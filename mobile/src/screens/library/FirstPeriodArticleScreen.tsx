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
import {
  getBottomPadding,
  getTopPadding,
  READING_CONTROLS_SPACE,
} from '../../theme/spacing';

const ID = 'firstperiod-premieres-regles';

const CREAM = '#FCF9F5';
const INK = '#30283A';
const ROSE = '#B96778';
const BORDER = '#ECE5DF';

const HERO = require('../../assets/images/library/cycle-phases-hero.png');

// Same title/text pairs the article always had — TOPICS supplies each
// section's heading + illustration, DETAILS supplies the visualCard's own
// mini-title + description. Preserved verbatim, only the container changed.
const TOPICS = [
  {title: 'Quand arrivent les premières règles ?', image: require('../../assets/images/first-period-calendar.png')},
  {title: 'Ce qui est normal', image: require('../../assets/images/first-period-normal.png')},
  {title: 'Comment ça fonctionne ?', image: require('../../assets/images/first-period-pad.png')},
  {title: 'Prendre soin de soi', image: require('../../assets/images/first-period-care.png')},
  {title: 'Parler et se faire soutenir', image: require('../../assets/images/first-period-support.png')},
] as const;

const DETAILS = [
  {title: 'Quand arrivent les premières règles ?', text: 'Elles apparaissent le plus souvent entre 10 et 15 ans, environ deux ans après les premiers signes de la puberté.'},
  {title: 'Ce qui est tout à fait normal', text: 'Au début, les cycles peuvent être irréguliers, courts ou longs. Ton corps prend simplement le temps de trouver son rythme.'},
  {title: 'Comprendre comment ça fonctionne', text: 'Les règles durent généralement de 3 à 7 jours. Le flux et la couleur peuvent changer d’un jour à l’autre.'},
  {title: 'Prendre soin de toi', text: 'Change régulièrement de protection, lave-toi doucement et choisis des vêtements confortables pour rester à l’aise.'},
  {title: 'Parler et se faire soutenir', text: 'Tu peux en parler à ta mère, une sœur, une proche, une enseignante ou un professionnel de santé en qui tu as confiance.'},
] as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function FirstPeriodArticleScreen({
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
    setSaved(toggleBookmark(ID));
  };

  const handleShare = () => {
    Share.share({
      title: 'Premières règles · AWA',
      message: 'Tes premières règles : à quoi t’attendre · AWA',
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
              <MaterialDesignIcons name="chevron-left" size={23} color={INK} />
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
                  color={ROSE}
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
                  color={ROSE}
                />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.article}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>PREMIÈRES RÈGLES</Text>
          </View>

          <Text style={styles.title}>
            Tes premières règles :{`\n`}à quoi t’attendre
          </Text>

          <View style={styles.metas}>
            {[
              ['clock-outline', '5 min de lecture'],
              ['book-open-page-variant-outline', 'Guide'],
              ['chart-bar', 'Débutant'],
              ['shield-check-outline', 'Contenu validé'],
            ].map(([icon, text], index) => (
              <React.Fragment key={text}>
                {index > 0 ? <View style={styles.metaDivider} /> : null}

                <View style={styles.metaItem}>
                  <MaterialDesignIcons
                    name={icon as never}
                    color="#8A8190"
                    size={17}
                  />

                  <Text style={styles.meta}>{text}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          <Text style={styles.intro}>
            Ce qui est normal, ce qui rassure, et ce qu’il faut savoir.
          </Text>

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>Dans cet article</Text>

            {TOPICS.map((topic, index) => (
              <View key={topic.title} style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <Text style={styles.contentNumber}>{index + 1}.</Text>
                  <Text style={styles.contentText}>{topic.title}</Text>
                </View>

                <MaterialDesignIcons
                  name="chevron-right"
                  size={17}
                  color={ROSE}
                />
              </View>
            ))}
          </View>

          <Text style={styles.h2}>1. {TOPICS[0].title}</Text>

          <View style={styles.visualCard}>
            <Image
              source={TOPICS[0].image}
              resizeMode="cover"
              style={styles.visualImage}
            />

            <View style={styles.visualCopy}>
              <Text style={styles.visualTitle}>{DETAILS[0].title}</Text>
              <Text style={styles.visualText}>{DETAILS[0].text}</Text>
            </View>
          </View>

          <Text style={styles.h2}>2. {TOPICS[1].title}</Text>

          <View style={styles.visualCard}>
            <Image
              source={TOPICS[1].image}
              resizeMode="cover"
              style={styles.visualImage}
            />

            <View style={styles.visualCopy}>
              <Text style={styles.visualTitle}>{DETAILS[1].title}</Text>
              <Text style={styles.visualText}>{DETAILS[1].text}</Text>
            </View>
          </View>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={ROSE}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Bon à savoir</Text>
              <Text style={styles.tipText}>
                Un cycle irrégulier au début est tout à fait normal. Ton corps
                apprend encore à fonctionner.
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>3. {TOPICS[2].title}</Text>

          <View style={styles.visualCard}>
            <Image
              source={TOPICS[2].image}
              resizeMode="cover"
              style={styles.visualImage}
            />

            <View style={styles.visualCopy}>
              <Text style={styles.visualTitle}>{DETAILS[2].title}</Text>
              <Text style={styles.visualText}>{DETAILS[2].text}</Text>
            </View>
          </View>

          <Text style={styles.h2}>4. {TOPICS[3].title}</Text>

          <View style={styles.visualCard}>
            <Image
              source={TOPICS[3].image}
              resizeMode="cover"
              style={styles.visualImage}
            />

            <View style={styles.visualCopy}>
              <Text style={styles.visualTitle}>{DETAILS[3].title}</Text>
              <Text style={styles.visualText}>{DETAILS[3].text}</Text>
            </View>
          </View>

          <Text style={styles.h2}>5. {TOPICS[4].title}</Text>

          <View style={styles.visualCard}>
            <Image
              source={TOPICS[4].image}
              resizeMode="cover"
              style={styles.visualImage}
            />

            <View style={styles.visualCopy}>
              <Text style={styles.visualTitle}>{DETAILS[4].title}</Text>
              <Text style={styles.visualText}>{DETAILS[4].text}</Text>
            </View>
          </View>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={ROSE}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Tu n’es pas seule</Text>
              <Text style={styles.tipText}>
                Chaque corps est unique. Prends le temps, sois patiente et
                n’hésite pas à demander de l’aide à une personne de confiance.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={5} scrollRef={scrollRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: CREAM},
  scroll: {paddingBottom: 30},
  heroWrap: {height: 245, backgroundColor: '#EFE3D5'},
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
    backgroundColor: 'rgba(255,255,255,0.90)',
    borderWidth: 1,
    borderColor: BORDER,
  },
  pressed: {opacity: 0.74},
  article: {
    marginTop: -15,
    padding: 20,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: CREAM,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#F3DFE5',
  },
  badgeText: {fontSize: 11, color: ROSE, fontWeight: '800'},
  title: {
    marginTop: 12,
    fontFamily: 'serif',
    fontSize: 25,
    lineHeight: 31,
    color: INK,
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
  metaDivider: {width: 1, height: 20, backgroundColor: '#DDD5DA'},
  meta: {fontSize: 10, color: '#777078'},
  intro: {
    marginTop: 17,
    fontSize: 14,
    lineHeight: 21,
    color: '#49424A',
    fontWeight: '500',
  },
  contents: {
    marginTop: 19,
    padding: 15,
    borderRadius: 13,
    backgroundColor: '#F8F2F4',
  },
  contentsTitle: {marginBottom: 7, fontSize: 15, color: INK, fontWeight: '800'},
  contentRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contentLeft: {flex: 1, flexDirection: 'row', alignItems: 'center'},
  contentNumber: {width: 24, color: ROSE, fontSize: 12, fontWeight: '800'},
  contentText: {flex: 1, fontSize: 12.5, lineHeight: 17, color: INK},
  h2: {
    marginTop: 24,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: INK,
    fontWeight: '700',
  },
  visualCard: {
    marginTop: 15,
    minHeight: 98,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDE2E4',
    backgroundColor: '#FFFDFC',
  },
  visualImage: {width: 72, height: 72, borderRadius: 12},
  visualCopy: {flex: 1, marginLeft: 12},
  visualTitle: {color: INK, fontSize: 13, lineHeight: 17, fontWeight: '800'},
  visualText: {marginTop: 4, color: '#585057', fontSize: 11, lineHeight: 16},
  tip: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F5EBEF',
  },
  tipCopy: {flex: 1, marginLeft: 11},
  tipTitle: {fontSize: 13, color: INK, fontWeight: '800'},
  tipText: {marginTop: 3, fontSize: 11.5, lineHeight: 17, color: '#585057'},
});
