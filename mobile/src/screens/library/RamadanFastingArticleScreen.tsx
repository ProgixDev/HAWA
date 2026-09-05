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

const ID = 'ramadan-jeune-et-regles';

const CREAM = '#FCF9F5';
const INK = '#30283A';
const ROSE = '#B96778';
const BORDER = '#ECE5DF';

const HERO = require('../../assets/images/library/cycle-phases-hero.png');

const ART = {
  tracking: require('../../assets/images/library/featured-tracking-hero.png'),
};

const RELIGIOUS_DISCLAIMER =
  'Ce contenu est purement éducatif. Les questions religieuses doivent être validées par des savants qualifiés. AWA ne délivre pas de fatwas ni de décisions religieuses personnalisées.';

const SPIRITUAL_ACTS = [
  ['hands-pray', 'Dhikr (évocation de Dieu)'],
  ['heart-outline', 'Du’a (invocations)'],
  ['headphones', 'Écoute de contenus religieux'],
  ['book-open-variant', 'Lecture de contenus éducatifs'],
  ['hand-heart-outline', 'Charité et gestes de bienveillance'],
  ['pot-steam-outline', 'Aider à préparer l’iftar'],
  ['weather-night', 'Temps de réflexion personnelle'],
  ['calendar-check-outline', 'Maintenir une routine spirituelle'],
] as const;

const TRACKING_TIPS = [
  'Noter la date de chaque jour non jeûné au fur et à mesure',
  'Utiliser un calendrier, une application ou un carnet dédié',
  'Faire un point rapide en fin de mois pour vérifier le total',
];

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function RamadanFastingArticleScreen({
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
      message: 'Le jeûne pendant le Ramadan — AWA',
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
            <Text style={styles.badgeText}>RAMADAN</Text>
          </View>

          <Text style={styles.title}>
            Le jeûne pendant{`\n`}le Ramadan
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
            Conseils pratiques et repères éducatifs pour vivre le mois de
            Ramadan en période de règles, avec sérénité.
          </Text>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="information-outline"
              size={24}
              color="#B76568"
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Information importante</Text>
              <Text style={styles.tipText}>{RELIGIOUS_DISCLAIMER}</Text>
            </View>
          </View>

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>Dans cet article</Text>

            {[
              'Pendant les règles, le jeûne suspendu',
              'Vivre la spiritualité autrement',
              'Noter ses jours pour le rattrapage',
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

          <Text style={styles.h2}>1. Pendant les règles, le jeûne suspendu</Text>

          <Text style={styles.body}>
            Pendant les règles, le jeûne n’est pas requis : cette période
            place la femme dans un état où plusieurs actes d’adoration, dont
            le jeûne, sont temporairement suspendus. Cette suspension est
            reconnue comme une facilité, et non comme une interdiction ou
            une sanction.
          </Text>

          <Text style={styles.body}>
            Suspendre le jeûne pendant les règles ne signifie pas s’éloigner
            de sa pratique religieuse. Il est simplement mis en pause pour
            une durée limitée, puis repris normalement dès la fin des
            règles, sans qu’aucun acte de foi ne soit perdu. Les jours non
            jeûnés seront rattrapés plus tard (qadaa), en dehors du Ramadan.
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
                Cette pause peut aussi être vécue comme un moment différent
                du mois, où la spiritualité continue de s’exprimer
                autrement, sans jeûne.
              </Text>
            </View>
          </View>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color="#B76568"
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>À noter</Text>
              <Text style={styles.tipText}>
                Cette situation ne doit pas être vécue avec culpabilité :
                elle fait partie du cycle naturel du corps et est prise en
                compte par la tradition religieuse elle-même.
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>2. Vivre la spiritualité autrement</Text>

          <Text style={styles.body}>
            Ne pas jeûner ne signifie pas être coupée du mois de Ramadan. De
            nombreuses formes de spiritualité restent accessibles et
            permettent de continuer à vivre pleinement cette période.
          </Text>

          <View style={styles.daily}>
            {SPIRITUAL_ACTS.map(([icon, label]) => (
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

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={ROSE}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Bon à savoir</Text>
              <Text style={styles.tipText}>
                Ces gestes, même simples, permettent de rester pleinement
                connectée à l’esprit du mois, quelle que soit la situation.
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>3. Noter ses jours pour le rattrapage</Text>

          <Text style={styles.body}>
            Garder une trace des jours de règles pendant le Ramadan facilite
            ensuite le calcul du nombre de jours à rattraper (qadaa), et
            évite d’avoir à s’en souvenir de mémoire une fois le mois
            terminé.
          </Text>

          <View style={styles.checkList}>
            {TRACKING_TIPS.map(item => (
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

          <View style={styles.visualCard}>
            <Image
              source={ART.tracking}
              resizeMode="cover"
              style={styles.visualImage}
            />

            <View style={styles.visualCopy}>
              <Text style={styles.visualTitle}>Un suivi simplifié</Text>

              <Text style={styles.visualText}>
                AWA peut t’aider à suivre ton cycle au fil du Ramadan, pour
                retrouver facilement ces informations plus tard.
              </Text>
            </View>
          </View>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color="#B76568"
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>À noter</Text>
              <Text style={styles.tipText}>
                Les modalités exactes du rattrapage (délai, situations
                particulières comme la grossesse ou l’allaitement) peuvent
                varier selon les écoles juridiques. Pour toute situation
                spécifique ou complexe, l’avis d’un savant qualifié reste la
                référence.
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>4. À retenir</Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={ROSE}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Bon à savoir</Text>
              <Text style={styles.tipText}>
                Le jeûne suspendu pendant les règles est une facilité
                reconnue, non une rupture avec sa pratique religieuse.
                Vivre cette période autrement, garder une trace de ses
                jours, et demander conseil en cas de doute permettent de
                traverser le Ramadan avec sérénité.
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
  alert: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F8E8E8',
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
    marginBottom: 9,
  },
  checkText: {flex: 1, color: '#4A444B', fontSize: 12, lineHeight: 17},
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
