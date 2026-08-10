import React, {useEffect, useRef, useState} from 'react';
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
import {getBottomPadding, getTopPadding, READING_CONTROLS_SPACE} from '../../theme/spacing';

const ID = 'flow-comprendre-flux';
const CREAM = '#FCF9F5';
const INK = '#30283A';
const PURPLE = '#765C89';

const HERO = require('../../assets/images/library/rules-hero.png');
const PROCESS = require('../../assets/images/library/rules-process.png');

const TIPS = [
  {
    image: require('../../assets/images/library/tip-water.png'),
    text: 'Bois suffisamment\nd’eau pour limiter\nla fatigue.',
  },
  {
    image: require('../../assets/images/library/tip-heat.png'),
    text: 'Applique de la\nchaleur sur le bas-\nventre si besoin.',
  },
  {
    image: require('../../assets/images/library/tip-movement.png'),
    text: 'Pratique une activité\ndouce : marche,\nyoga, étirements.',
  },
  {
    image: require('../../assets/images/library/tip-sleep.png'),
    text: 'Accorde-toi du\nrepos et un sommeil\nde qualité.',
  },
] as const;

const FLOW_STEPS = [
  {
    number: '01',
    title: 'Début des règles',
    text: 'Le flux est souvent plus important pendant les premiers jours.',
    icon: 'water',
  },
  {
    number: '02',
    title: 'Milieu des règles',
    text: 'Le flux commence généralement à diminuer progressivement.',
    icon: 'calendar-clock-outline',
  },
  {
    number: '03',
    title: 'Fin des règles',
    text: 'Le flux devient plus léger et peut prendre une couleur plus foncée.',
    icon: 'weather-sunset-down',
  },
] as const;

const NORMAL_SIGNS = [
  {
    icon: 'calendar-range',
    title: 'Durée',
    text: 'Des règles qui durent généralement quelques jours.',
  },
  {
    icon: 'water-outline',
    title: 'Flux variable',
    text: 'Un flux plus abondant au début puis plus léger.',
  },
  {
    icon: 'palette-outline',
    title: 'Couleur',
    text: 'Du rouge vif au rouge foncé ou brun en fin de règles.',
  },
  {
    icon: 'heart-pulse',
    title: 'Sensations',
    text: 'Des crampes légères à modérées peuvent être ressenties.',
  },
] as const;

const WARNING_SIGNS = [
  'Douleurs très intenses ou inhabituelles',
  'Saignements qui imbibent une protection très rapidement',
  'Fatigue importante, malaise ou vertiges',
  'Changement brutal et persistant par rapport à tes habitudes',
] as const;

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ArticleReader'
>;

export default function UnderstandMenstrualFlowArticleScreen({
  navigation,
}: Props): React.JSX.Element {
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
    const next = toggleBookmark(ID);
    setSaved(next);
  };

  const handleShare = () => {
    Share.share({
      message:
        'Comprendre les règles : ce qui se passe vraiment — HAWA',
    });
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
            paddingBottom:
              getBottomPadding(insets.bottom, READING_CONTROLS_SPACE),
          },
        ]}>
        <View style={styles.heroWrap}>
          <Image
            source={HERO}
            style={styles.hero}
          />

          <View
            style={[
              styles.top,
              {
                paddingTop:
                  getTopPadding(insets.top, true),
              },
            ]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retour"
              onPress={navigation.goBack}
              style={({pressed}) => [
                styles.circle,
                pressed && styles.pressed,
              ]}>
              <MaterialDesignIcons
                name="chevron-left"
                color={INK}
                size={23}
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
                  name={
                    saved
                      ? 'bookmark'
                      : 'bookmark-outline'
                  }
                  color={PURPLE}
                  size={20}
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
                  color={PURPLE}
                  size={20}
                />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.article}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              CYCLE MENSTRUEL
            </Text>
          </View>

          <Text style={styles.title}>
            Comprendre les règles :{`\n`}
            ce qui se passe vraiment
          </Text>

          <View style={styles.metas}>
            {[
              [
                'clock-outline',
                '5 min de lecture',
              ],
              [
                'calendar-blank-outline',
                '12 mai 2024',
              ],
              [
                'shield-check-outline',
                'Contenu validé',
              ],
            ].map(([icon, text]) => (
              <View
                key={text}
                style={styles.meta}>
                <MaterialDesignIcons
                  name={icon as never}
                  color="#777078"
                  size={14}
                />

                <Text style={styles.metaText}>
                  {text}
                </Text>
              </View>
            ))}
          </View>

          <Text style={styles.intro}>
            Les règles font partie d’un processus
            naturel essentiel à la santé hormonale
            et reproductive féminine. Comprendre ce
            qui se passe dans ton corps peut t’aider
            à mieux vivre chaque cycle.
          </Text>

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>
              Dans cet article
            </Text>

            {[
              'Qu’est-ce que les règles ?',
              'Le déroulement des règles',
              'Ce qui est normal (et ce qui ne l’est pas)',
              'Soulager les douleurs naturellement',
            ].map((item, index) => (
              <View
                key={item}
                style={styles.contentRow}>
                <Text style={styles.contentNumber}>
                  {index + 1}.
                </Text>

                <Text style={styles.contentText}>
                  {item}
                </Text>

                <MaterialDesignIcons
                  name="chevron-right"
                  color={PURPLE}
                  size={17}
                />
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>
            1. Qu’est-ce que les règles ?
          </Text>

          <Text style={styles.body}>
            Les règles correspondent à l’élimination
            de la muqueuse utérine lorsqu’il n’y a
            pas de fécondation. Ce phénomène se
            produit en moyenne une fois par mois.
          </Text>

          <View style={styles.processCard}>
            <Image
              source={PROCESS}
              resizeMode="cover"
              style={styles.process}
            />
          </View>

          <View style={styles.know}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              color={PURPLE}
              size={23}
            />

            <View style={styles.knowCopy}>
              <Text style={styles.knowTitle}>
                Bon à savoir
              </Text>

              <Text style={styles.knowText}>
                Chaque femme est unique : la durée,
                l’intensité et les sensations peuvent
                varier d’un cycle à l’autre.
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>
            2. Le déroulement des règles
          </Text>

          <Text style={styles.body}>
            Le flux n’est pas identique pendant toute la période.
            Il évolue généralement au fil des jours et peut changer
            en intensité, en couleur et en texture.
          </Text>

          <View style={styles.timelineCard}>
            {FLOW_STEPS.map((step, index) => (
              <View
                key={step.title}
                style={[
                  styles.timelineRow,
                  index < FLOW_STEPS.length - 1 &&
                    styles.timelineDivider,
                ]}>
                <View style={styles.timelineNumber}>
                  <Text style={styles.timelineNumberText}>
                    {step.number}
                  </Text>
                </View>

                <View style={styles.timelineIcon}>
                  <MaterialDesignIcons
                    name={step.icon as never}
                    size={20}
                    color={PURPLE}
                  />
                </View>

                <View style={styles.timelineCopy}>
                  <Text style={styles.timelineTitle}>
                    {step.title}
                  </Text>
                  <Text style={styles.timelineText}>
                    {step.text}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.softInfo}>
            <MaterialDesignIcons
              name="information-outline"
              size={22}
              color={PURPLE}
            />

            <View style={styles.softInfoCopy}>
              <Text style={styles.softInfoTitle}>
                À retenir
              </Text>
              <Text style={styles.softInfoText}>
                Le déroulement peut varier d’un cycle à l’autre.
                Ce qui compte surtout est de connaître ton propre
                rythme habituel.
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>
            3. Ce qui est normal (et ce qui ne l’est pas)
          </Text>

          <Text style={styles.body}>
            Certaines variations sont fréquentes pendant les règles.
            D’autres signes méritent davantage d’attention, surtout
            lorsqu’ils sont nouveaux ou très intenses.
          </Text>

          <View style={styles.normalGrid}>
            {NORMAL_SIGNS.map(item => (
              <View
                key={item.title}
                style={styles.normalCard}>
                <View style={styles.normalIcon}>
                  <MaterialDesignIcons
                    name={item.icon as never}
                    size={22}
                    color={PURPLE}
                  />
                </View>

                <Text style={styles.normalTitle}>
                  {item.title}
                </Text>

                <Text style={styles.normalText}>
                  {item.text}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <View style={styles.warningIcon}>
                <MaterialDesignIcons
                  name="alert-circle-outline"
                  size={22}
                  color="#B45C67"
                />
              </View>

              <Text style={styles.warningTitle}>
                Quand demander un avis médical ?
              </Text>
            </View>

            <View style={styles.warningList}>
              {WARNING_SIGNS.map(item => (
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

          <Text style={styles.sectionTitle}>
            4. Soulager les douleurs naturellement
          </Text>

          <Text style={styles.body}>
            Des gestes simples peuvent aider à réduire l’inconfort
            et à mieux vivre les premiers jours des règles.
          </Text>

          <View style={styles.tipsCard}>
            <View style={styles.tipsTitleRow}>
              <MaterialDesignIcons
                name="heart-outline"
                color={PURPLE}
                size={21}
              />

              <Text style={styles.tipsTitle}>
                Conseils pratiques
              </Text>
            </View>

            <View style={styles.tipsRow}>
              {TIPS.map((tip, index) => (
                <View
                  key={tip.text}
                  style={[
                    styles.tip,
                    index > 0 &&
                      styles.tipBorder,
                  ]}>
                  <Image
                    source={tip.image}
                    style={styles.tipImage}
                  />

                  <Text style={styles.tipText}>
                    {tip.text}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.reliefTip}>
            <MaterialDesignIcons
              name="spa-outline"
              size={22}
              color={PURPLE}
            />

            <View style={styles.reliefCopy}>
              <Text style={styles.reliefTitle}>
                Écoute ton corps
              </Text>
              <Text style={styles.reliefText}>
                Le repos, la chaleur et une activité douce peuvent
                être utiles. Si la douleur reste très forte ou
                inhabituelle, demande un avis médical.
              </Text>
            </View>
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: CREAM,
  },

  scroll: {
    paddingBottom: 26,
  },

  heroWrap: {
    height: 250,
    backgroundColor: '#EADFD4',
  },

  hero: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(255,255,255,0.90)',
    borderWidth: 1,
    borderColor: '#EAE3DE',
  },

  pressed: {
    opacity: 0.75,
  },

  article: {
    marginTop: -14,
    paddingHorizontal: 20,
    paddingTop: 23,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: CREAM,
  },

  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#E9DFF0',
  },

  badgeText: {
    color: PURPLE,
    fontSize: 10.5,
    fontWeight: '800',
  },

  title: {
    marginTop: 13,
    color: INK,
    fontFamily: 'serif',
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '700',
  },

  metas: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 13,
  },

  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  metaText: {
    color: '#777078',
    fontSize: 10,
  },

  intro: {
    marginTop: 17,
    color: '#45404A',
    fontSize: 13.5,
    lineHeight: 21,
  },

  contents: {
    marginTop: 19,
    padding: 14,
    borderRadius: 13,
    backgroundColor: '#F7F2F4',
  },

  contentsTitle: {
    marginBottom: 8,
    color: INK,
    fontSize: 14,
    fontWeight: '800',
  },

  contentRow: {
    minHeight: 35,
    flexDirection: 'row',
    alignItems: 'center',
  },

  contentNumber: {
    width: 23,
    color: PURPLE,
    fontSize: 11.5,
    fontWeight: '800',
  },

  contentText: {
    flex: 1,
    color: INK,
    fontSize: 12,
    lineHeight: 16,
  },

  sectionTitle: {
    marginTop: 24,
    color: INK,
    fontFamily: 'serif',
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '700',
  },

  body: {
    marginTop: 10,
    color: '#45404A',
    fontSize: 13.5,
    lineHeight: 21,
  },

  processCard: {
    marginTop: 17,
    height: 116,
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: '#F9F3F2',
  },

  process: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  know: {
    marginTop: 17,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 13,
    backgroundColor: '#F3EDF6',
  },

  knowCopy: {
    flex: 1,
    marginLeft: 12,
  },

  knowTitle: {
    color: INK,
    fontSize: 13,
    fontWeight: '800',
  },

  knowText: {
    marginTop: 4,
    color: '#514A53',
    fontSize: 11.5,
    lineHeight: 17,
  },

  timelineCard: {
    marginTop: 15,
    paddingHorizontal: 13,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E9E1E6',
    backgroundColor: '#FFFDFC',
  },

  timelineRow: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },

  timelineDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8E0E2',
  },

  timelineNumber: {
    width: 30,
  },

  timelineNumberText: {
    color: '#A49BA6',
    fontSize: 10.5,
    fontWeight: '800',
  },

  timelineIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1EAF5',
  },

  timelineCopy: {
    flex: 1,
    marginLeft: 11,
  },

  timelineTitle: {
    color: INK,
    fontSize: 12.5,
    lineHeight: 16,
    fontWeight: '800',
  },

  timelineText: {
    marginTop: 4,
    color: '#585057',
    fontSize: 11,
    lineHeight: 16,
  },

  softInfo: {
    marginTop: 14,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F5F0F8',
  },

  softInfoCopy: {
    flex: 1,
    marginLeft: 10,
  },

  softInfoTitle: {
    color: INK,
    fontSize: 12.5,
    fontWeight: '800',
  },

  softInfoText: {
    marginTop: 3,
    color: '#585057',
    fontSize: 11,
    lineHeight: 16,
  },

  normalGrid: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  normalCard: {
    width: '48.7%',
    minHeight: 122,
    padding: 11,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#EAE2E6',
    backgroundColor: '#FFFDFC',
  },

  normalIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1EAF5',
  },

  normalTitle: {
    marginTop: 8,
    color: INK,
    fontSize: 12,
    fontWeight: '800',
  },

  normalText: {
    marginTop: 5,
    color: '#585057',
    fontSize: 10.5,
    lineHeight: 15,
  },

  warningCard: {
    marginTop: 14,
    padding: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0D9DD',
    backgroundColor: '#FFF5F6',
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
    backgroundColor: '#FCE7EA',
  },

  warningTitle: {
    flex: 1,
    marginLeft: 10,
    color: INK,
    fontSize: 12.5,
    lineHeight: 16,
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
    backgroundColor: '#B45C67',
  },

  warningText: {
    flex: 1,
    color: '#585057',
    fontSize: 10.8,
    lineHeight: 16,
  },

  tipsCard: {
    marginTop: 15,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FBF7F5',
  },

  tipsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  tipsTitle: {
    color: INK,
    fontFamily: 'serif',
    fontSize: 19,
    lineHeight: 23,
    fontWeight: '700',
  },

  tipsRow: {
    marginTop: 14,
    flexDirection: 'row',
  },

  tip: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },

  tipBorder: {
    borderLeftWidth: 1,
    borderLeftColor: '#E8E0E2',
  },

  tipImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },

  tipText: {
    marginTop: 7,
    color: INK,
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
  },

  reliefTip: {
    marginTop: 14,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F5F0F8',
  },

  reliefCopy: {
    flex: 1,
    marginLeft: 10,
  },

  reliefTitle: {
    color: INK,
    fontSize: 12.5,
    fontWeight: '800',
  },

  reliefText: {
    marginTop: 3,
    color: '#585057',
    fontSize: 11,
    lineHeight: 16,
  },

});
