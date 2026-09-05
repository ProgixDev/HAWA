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

const ID = 'firstperiod-gerer-quotidien';

const CREAM = '#FCF9F5';
const INK = '#30283A';
const ROSE = '#B96778';
const BORDER = '#ECE5DF';

const HERO = require('../../assets/images/library/rules-hero.png');

const DAILY_TIPS = [
  ['school-outline', 'École ou activités : garde une protection dans ton sac'],
  ['run', 'Sport : le sport reste possible, adapte simplement ton rythme'],
  ['power-sleep', 'Sommeil : une protection de nuit adaptée suffit'],
] as const;

const RELATED = [
  {
    title: 'Quelle protection choisir pour mes premières règles ?',
    meta: '6 min  ·  Guide',
    image: require('../../assets/images/library/featured-flow.png'),
    articleId: 'firstperiod-choisir-protection',
  },
  {
    title: 'Gérer les douleurs menstruelles',
    meta: '7 min  ·  Guide',
    image: require('../../assets/images/library/pain-hero.png'),
    articleId: 'pain-gerer-douleurs',
  },
  {
    title: 'Mes premières règles sont irrégulières : est-ce normal ?',
    meta: '5 min  ·  Guide',
    image: require('../../assets/images/library/regular-cycle-hero.png'),
    articleId: 'firstperiod-cycle-irregulier',
  },
] as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function FirstPeriodDailyLifeArticleScreen({
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
      message: 'Comment gérer ses premières règles au quotidien ? — AWA',
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
            Comment gérer ses{`\n`}premières règles au quotidien ?
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
            Avec quelques petites habitudes, les premières règles s’intègrent
            facilement à ton quotidien, à l’école comme en dehors.
          </Text>

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>Dans cet article</Text>

            {[
              'S’organiser au quotidien',
              'Préparer une trousse de secours',
              'Si les règles arrivent de façon inattendue',
            ].map((item, index) => (
              <View key={item} style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <Text style={styles.contentNumber}>{index + 1}.</Text>
                  <Text style={styles.contentText}>{item}</Text>
                </View>

                <MaterialDesignIcons
                  name="chevron-right"
                  size={17}
                  color={ROSE}
                />
              </View>
            ))}
          </View>

          <Text style={styles.h2}>1. S’organiser au quotidien</Text>

          <Text style={styles.body}>
            École, sport, sommeil : les règles n’empêchent pas de continuer
            tes activités habituelles. Il suffit d’adapter quelques
            habitudes pour rester à l’aise tout au long de la journée.
          </Text>

          <View style={styles.daily}>
            {DAILY_TIPS.map(([icon, text]) => (
              <View key={text} style={styles.dailyItem}>
                <MaterialDesignIcons name={icon as never} color={ROSE} size={25} />
                <Text style={styles.dailyText}>{text}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.h2}>2. Préparer une trousse de secours</Text>

          <Text style={styles.body}>
            Une petite trousse avec une ou deux protections, une culotte de
            rechange et des lingettes peut se glisser facilement dans un sac
            d’école ou de sport. Elle permet de rester tranquille en toute
            circonstance.
          </Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={ROSE}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Bon à savoir</Text>
              <Text style={styles.tipText}>
                Garder toujours une protection avec toi évite le stress d’être
                prise au dépourvu.
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>
            3. Si les règles arrivent de façon inattendue
          </Text>

          <Text style={styles.body}>
            Cela arrive souvent, surtout au début. Une infirmière scolaire,
            une enseignante ou une amie a presque toujours de quoi dépanner.
            Un vêtement noué autour de la taille peut aussi suffire en
            attendant de trouver une protection.
          </Text>
        </View>

        <View style={styles.relatedHeader}>
          <Text style={styles.relatedTitle}>♥  Tu pourrais aussi aimer</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.relatedRow}>
          {RELATED.map(item => (
            <Pressable
              key={item.title}
              onPress={() =>
                navigation.push('ArticleReader', {articleId: item.articleId})
              }
              style={styles.relatedCard}>
              <Image
                source={item.image}
                resizeMode="cover"
                style={styles.relatedImage}
              />

              <View style={styles.relatedCopy}>
                <Text numberOfLines={3} style={styles.relatedCardTitle}>
                  {item.title}
                </Text>
                <Text style={styles.relatedMeta}>{item.meta}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={5} scrollRef={scrollRef} />
    </View>
  );
}

const shadow = {
  shadowColor: '#4B3166',
  shadowOffset: {width: 0, height: 5},
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 2,
};

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
    lineHeight: 32,
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
  body: {marginTop: 8, fontSize: 14, lineHeight: 21, color: '#4A444B'},
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
  daily: {marginTop: 13, flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  dailyItem: {
    width: '48.7%',
    minHeight: 108,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#FBF5F6',
  },
  dailyText: {
    marginTop: 7,
    fontSize: 11,
    lineHeight: 16,
    color: INK,
    textAlign: 'center',
  },
  relatedHeader: {
    marginTop: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  relatedTitle: {color: INK, fontSize: 16, fontWeight: '800'},
  relatedRow: {gap: 10, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 5},
  relatedCard: {
    width: 230,
    height: 105,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F0EAF5',
    flexDirection: 'row',
    overflow: 'hidden',
    ...shadow,
  },
  relatedImage: {width: 80, height: '100%'},
  relatedCopy: {flex: 1, padding: 12},
  relatedCardTitle: {color: INK, fontSize: 11.5, lineHeight: 15, fontWeight: '800'},
  relatedMeta: {marginTop: 9, color: '#77708F', fontSize: 9.5},
});
