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

const ID = 'medicalexams-suivi-medical';

const CREAM = '#FCF9F5';
const INK = '#30283A';
const ROSE = '#B96778';
const BORDER = '#ECE5DF';

const HERO = require('../../assets/images/library/spm-consult.png');

const ULTRASOUNDS = [
  ['numeric-1-circle-outline', '1er trimestre : datation et clarté nucale'],
  ['numeric-2-circle-outline', '2e trimestre : échographie morphologique'],
  ['numeric-3-circle-outline', '3e trimestre : croissance et position du bébé'],
] as const;

const BLOOD_TESTS = [
  'Taux de fer, pour dépister une éventuelle anémie',
  'Dépistage du diabète gestationnel, généralement autour du 2e trimestre',
  'Groupe sanguin et recherche d’agglutinines irrégulières',
  'Sérologies (toxoplasmose, rubéole) selon ton statut immunitaire',
];

const PREP_TIPS = [
  'Noter tes questions au fur et à mesure, avant de les oublier',
  'Apporter ton carnet de suivi de grossesse à chaque rendez-vous',
  'Signaler tout symptôme nouveau, même s’il te semble mineur',
];

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function MedicalExamsArticleScreen({
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
      message: 'Le calendrier des examens de grossesse — AWA',
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
            <Text style={styles.badgeText}>GROSSESSE • SUIVI MÉDICAL</Text>
          </View>

          <Text style={styles.title}>
            Le calendrier des{`\n`}examens de grossesse
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
            Échographies et bilans essentiels, trimestre par trimestre.
          </Text>

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>Dans cet article</Text>

            {[
              'Les échographies de suivi',
              'Les prises de sang essentielles',
              'Préparer chaque rendez-vous',
              'À noter',
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
                  color={ROSE}
                />
              </View>
            ))}
          </View>

          <Text style={styles.h2}>1. Les échographies de suivi</Text>

          <Text style={styles.body}>
            Trois échographies principales rythment généralement la
            grossesse, une par trimestre, chacune avec un objectif
            différent.
          </Text>

          <View style={styles.daily}>
            {ULTRASOUNDS.map(([icon, label]) => (
              <View key={label} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={icon as never}
                  color={ROSE}
                  size={25}
                />

                <Text style={styles.dailyText}>{label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.h2}>2. Les prises de sang essentielles</Text>

          <Text style={styles.body}>
            Des prises de sang régulières surveillent plusieurs marqueurs
            clés tout au long de la grossesse :
          </Text>

          <View style={styles.checkList}>
            {BLOOD_TESTS.map(item => (
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

          <Text style={styles.h2}>3. Préparer chaque rendez-vous</Text>

          <View style={styles.consultCard}>
            {PREP_TIPS.map(item => (
              <View key={item} style={styles.consultRow}>
                <View style={styles.consultIcon}>
                  <MaterialDesignIcons
                    name="pencil-outline"
                    size={18}
                    color={ROSE}
                  />
                </View>

                <Text style={styles.consultText}>{item}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.h2}>4. À noter</Text>

          <View style={styles.neutralBox}>
            <MaterialDesignIcons
              name="information-outline"
              size={22}
              color="#85727E"
            />

            <Text style={styles.neutralText}>
              Le nombre et le calendrier exact des examens peuvent varier
              selon ton suivi, ton profil de risque et les pratiques de ton
              pays ou de ton établissement.
            </Text>
          </View>

          <Text style={styles.h2}>5. À retenir</Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={ROSE}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Bon à savoir</Text>
              <Text style={styles.tipText}>
                Ne pas hésiter à noter tes questions avant chaque rendez-vous
                pour ne rien oublier sur le moment : aucune question n’est
                trop petite pour être posée.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={6} scrollRef={scrollRef} />
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
  badgeText: {
    fontSize: 10,
    color: ROSE,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  title: {
    marginTop: 12,
    fontFamily: 'serif',
    fontSize: 27,
    lineHeight: 32,
    color: INK,
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
  metaDivider: {width: 1, height: 20, backgroundColor: '#DDD5DA'},
  meta: {fontSize: 9.5, color: '#777078'},
  intro: {
    marginTop: 17,
    fontSize: 14,
    lineHeight: 21,
    color: '#49424A',
    fontWeight: '600',
  },
  contents: {
    marginTop: 20,
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
  contentNumber: {width: 25, color: ROSE, fontSize: 11.5, fontWeight: '800'},
  contentText: {flex: 1, fontSize: 12.3, lineHeight: 17, color: INK},
  h2: {
    marginTop: 25,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: INK,
    fontWeight: '700',
  },
  body: {marginTop: 9, fontSize: 14, lineHeight: 21.5, color: '#4A444B'},
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
  checkList: {
    marginTop: 13,
    padding: 13,
    borderRadius: 12,
    backgroundColor: '#FBF8F5',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  checkText: {flex: 1, color: '#4A444B', fontSize: 12, lineHeight: 17},
  consultCard: {
    marginTop: 14,
    padding: 13,
    borderRadius: 13,
    backgroundColor: '#FBF7F4',
    borderWidth: 1,
    borderColor: BORDER,
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
    backgroundColor: '#F4E4E8',
  },
  consultText: {
    flex: 1,
    marginLeft: 10,
    color: '#4A444B',
    fontSize: 12,
    lineHeight: 17,
  },
  neutralBox: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    borderRadius: 12,
    backgroundColor: '#F1EDEF',
  },
  neutralText: {flex: 1, fontSize: 11.5, lineHeight: 17, color: '#5C535B'},
  tip: {
    marginTop: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: '#F5EBEF',
  },
  tipCopy: {flex: 1, marginLeft: 11},
  tipTitle: {fontSize: 13, color: INK, fontWeight: '800'},
  tipText: {marginTop: 4, fontSize: 11.5, lineHeight: 17, color: '#585057'},
});
