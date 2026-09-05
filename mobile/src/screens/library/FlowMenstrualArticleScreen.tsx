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

const ID = 'flow-hygiene-intime';

const CREAM = '#FCF9F5';
const INK = '#30283A';
const ROSE = '#B96778';
const BORDER = '#ECE5DF';

const HERO = require('../../assets/images/library/flow-colors-hero.png');

// Same 3 practices this article always had — title and text merged into one
// row string ("Title : text") to fit the checkList component, no words
// added or removed.
const GOOD_PRACTICES = [
  'Lave-toi doucement : un simple lavage à l’eau claire, de l’avant vers l’arrière, suffit pour préserver ta flore naturelle.',
  'Change régulièrement tes protections : toutes les 4 à 6 heures pour éviter l’humidité et les mauvaises odeurs.',
  'Privilégie le coton : les sous-vêtements en coton laissent la peau respirer et réduisent les risques d’irritation.',
];

const THINGS_TO_AVOID = [
  'Les savons agressifs et les produits parfumés',
  'Les douches vaginales qui perturbent la flore naturelle',
  'Garder une protection humide trop longtemps',
];

const CONSULT_REASONS = [
  'Irritations, démangeaisons ou brûlures persistantes',
  'Odeur inhabituelle ou pertes différentes de ton habitude',
  'Douleurs importantes ou symptômes qui t’inquiètent',
];

const TAKEAWAYS = [
  'Lavage doux à l’eau claire',
  'Changer régulièrement',
  'Éviter les produits parfumés',
  'Privilégier le coton',
];

const RELATED = [
  {
    title: 'Comprendre les douleurs menstruelles',
    meta: '7 min  ·  Guide',
    image: require('../../assets/images/library/pain-hero.png'),
    articleId: 'pain-gerer-douleurs',
  },
  {
    title: 'Choisir la protection adaptée à ton corps',
    meta: '5 min  ·  Guide',
    image: require('../../assets/images/library/rules-hero.png'),
    articleId: 'flow-comprendre-flux',
  },
  {
    title: 'Comment soulager les crampes naturellement',
    meta: '6 min  ·  Guide',
    image: require('../../assets/images/library/pain-hero.png'),
    articleId: 'pain-gerer-douleurs',
  },
] as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function FlowMenstrualArticleScreen({
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
      title: 'Hygiène intime · AWA',
      message: 'Bien vivre son hygiène intime pendant les règles · AWA',
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
            <Text style={styles.badgeText}>FLUX MENSTRUEL</Text>
          </View>

          <Text style={styles.title}>
            Bien vivre son hygiène intime{`\n`}pendant les règles
          </Text>

          <View style={styles.metas}>
            {[
              ['clock-outline', '6 min de lecture'],
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
            Prendre soin de son intimité, c’est respecter son corps et son
            équilibre naturel.
          </Text>

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>Dans cet article</Text>

            {[
              'Pourquoi c’est important',
              'Les bons gestes',
              'À éviter',
              'Quand consulter',
              'Conseils pratiques',
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

          <Text style={styles.h2}>1. Pourquoi c’est important</Text>

          <Text style={styles.body}>
            Pendant les règles, ton corps change et devient plus sensible.
            Adopter les bons gestes aide à prévenir les irritations, les
            infections et à rester à l’aise au quotidien.
          </Text>

          <Text style={styles.h2}>2. Les bons gestes</Text>

          <View style={styles.checkList}>
            {GOOD_PRACTICES.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color="#789276"
                />

                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.h2}>3. À éviter</Text>

          <View style={styles.alertList}>
            {THINGS_TO_AVOID.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="close-circle-outline"
                  size={18}
                  color="#B76568"
                />

                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.h2}>4. Quand consulter</Text>

          <View style={styles.checkList}>
            {CONSULT_REASONS.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color="#789276"
                />

                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.h2}>5. Conseils pratiques</Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={ROSE}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Conseil AWA</Text>
              <Text style={styles.tipText}>
                Ton corps possède déjà un mécanisme naturel d’équilibre. Un
                lavage doux suffit généralement.
              </Text>
            </View>
          </View>

          <Text style={styles.contentsTitle}>À retenir</Text>

          <View style={styles.checkList}>
            {TAKEAWAYS.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color="#789276"
                />

                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>
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

      <ReadingControls articleId={ID} durationMinutes={6} scrollRef={scrollRef} />
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
  contentsTitle: {
    marginTop: 24,
    marginBottom: 7,
    fontSize: 15,
    color: INK,
    fontWeight: '800',
  },
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
  checkList: {
    marginTop: 13,
    padding: 13,
    borderRadius: 12,
    backgroundColor: '#FBF8F5',
  },
  alertList: {
    marginTop: 13,
    padding: 13,
    borderRadius: 12,
    backgroundColor: '#F8E8E8',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 9,
  },
  checkText: {flex: 1, color: '#4A444B', fontSize: 12, lineHeight: 17},
  relatedHeader: {
    marginTop: 8,
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
