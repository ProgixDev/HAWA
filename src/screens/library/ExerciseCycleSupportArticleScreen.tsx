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

const ID = 'exercise-bouger-pour-le-cycle';

const CREAM = '#FCF9F5';
const INK = '#30283A';
const ROSE = '#B96778';
const BORDER = '#ECE5DF';
const MUTED = '#777078';

const HERO = require('../../assets/images/library/activité.png');

const BENEFITS = [
  'Soutenir la santé métabolique',
  'Aider à réguler la glycémie',
  'Soutenir l’équilibre hormonal',
  'Améliorer le niveau d’énergie',
  'Réduire le stress',
  'Soutenir la qualité du sommeil',
  'Favoriser, chez certaines femmes, une meilleure régularité du cycle',
];

const ACTIVITIES = [
  ['walk', 'Marche'],
  ['yoga', 'Yoga / mobilité douce'],
  ['dumbbell', 'Renforcement musculaire'],
  ['bike', 'Vélo'],
  ['swim', 'Natation'],
  ['dance-ballroom', 'Danse'],
] as const;

const CYCLE_PHASES = [
  ['water-outline', 'Pendant les règles : un mouvement doux si cela te convient'],
  ['weather-sunny', 'Après les règles : augmenter progressivement si l’énergie le permet'],
  ['egg-outline', 'Autour de l’ovulation : maintenir une activité normale selon ton confort'],
  ['moon-waning-crescent', 'Avant les règles : privilégier un mouvement gérable, et du repos si besoin'],
] as const;

const MISTAKES = [
  'Vouloir faire de l’exercice de façon excessive',
  'Penser que seuls les entraînements intenses sont utiles',
  'Faire du sport uniquement dans un objectif de perte de poids',
  'Ignorer la fatigue ou la douleur',
  'Culpabiliser après une séance manquée',
];

const CONSULT_REASONS = [
  ['alert-circle-outline', 'Une douleur persistante'],
  ['water-alert-outline', 'Des saignements inhabituels'],
  ['emoticon-dizzy-outline', 'Des sensations de vertige'],
  ['battery-alert-outline', 'Une fatigue importante et inhabituelle'],
  ['medical-bag', 'Une condition médicale particulière'],
  ['baby-carriage', 'Une reprise d’activité après une grossesse ou un accouchement'],
  ['shield-alert-outline', 'Toute situation où l’activité a été médicalement restreinte'],
] as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function ExerciseCycleSupportArticleScreen({
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
      message: 'Bouger pour soutenir ton cycle — AWA',
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
          {/* HEADER */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>CYCLE • ACTIVITÉ PHYSIQUE</Text>
          </View>

          <Text style={styles.title}>
            Bouger pour{`\n`}soutenir ton cycle
          </Text>

          <View style={styles.metas}>
            {[
              ['clock-outline', '8 min de lecture'],
              ['book-open-page-variant-outline', 'Guide'],
              ['chart-bar', 'Débutant'],
              ['shield-check-outline', 'Contenu éducatif'],
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
            Pourquoi une activité physique régulière peut soutenir
            l’équilibre de ton cycle, quels types de mouvement privilégier,
            et comment adapter ton rythme sans pression ni culpabilité.
          </Text>

          <Text style={styles.introSecondary}>
            Il ne s’agit pas de faire plus, mais de bouger d’une façon qui
            te correspond et que tu peux maintenir dans la durée.
          </Text>

          {/* CONTENTS */}
          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>Dans cet article</Text>

            {[
              'Pourquoi bouger peut soutenir ton cycle',
              'Quels bénéfices pour le cycle ?',
              'Quel type d’activité choisir ?',
              'Combien bouger ?',
              'Adapter l’activité à son cycle',
              'Bouger quand on a un SOPK',
              'Les erreurs à éviter',
              'Quand demander conseil',
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

          {/* 1 */}
          <Text style={styles.h2}>1. Pourquoi bouger peut soutenir ton cycle</Text>

          <Text style={styles.body}>
            L’activité physique régulière influence de nombreux systèmes du
            corps, dont ceux impliqués dans la régulation hormonale et le
            fonctionnement du cycle menstruel. Elle agit notamment sur la
            sensibilité à l’insuline, la gestion du stress et la qualité du
            sommeil, trois facteurs qui interagissent avec l’équilibre
            hormonal.
          </Text>

          <Text style={styles.body}>
            Bouger régulièrement ne garantit pas un cycle « parfait », mais
            fait partie des habitudes qui soutiennent une bonne santé
            générale, avec des effets qui peuvent se refléter sur le cycle
            chez certaines femmes.
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
                Le lien entre activité physique et cycle est individuel :
                certaines femmes remarquent des effets nets, d’autres
                moins. Cela reste une habitude bénéfique dans tous les cas.
              </Text>
            </View>
          </View>

          {/* 2 */}
          <Text style={styles.h2}>2. Quels bénéfices pour le cycle ?</Text>

          <Text style={styles.body}>
            Une activité régulière peut contribuer à plusieurs niveaux,
            sans que ces effets soient garantis ou identiques pour toutes :
          </Text>

          <View style={styles.checkList}>
            {BENEFITS.map(item => (
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

          <View style={styles.neutralBox}>
            <MaterialDesignIcons
              name="information-outline"
              size={22}
              color="#85727E"
            />

            <Text style={styles.neutralText}>
              Ces bénéfices s’installent progressivement : il ne s’agit pas
              d’un effet immédiat après une seule séance.
            </Text>
          </View>

          {/* 3 */}
          <Text style={styles.h2}>3. Quel type d’activité choisir ?</Text>

          <Text style={styles.body}>
            Il n’existe pas d’activité « meilleure » que les autres : la
            plus efficace est celle que tu prends plaisir à pratiquer
            régulièrement.
          </Text>

          <View style={styles.daily}>
            {ACTIVITIES.map(([icon, label]) => (
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

          {/* 4 */}
          <Text style={styles.h2}>4. Combien bouger ?</Text>

          <Text style={styles.body}>
            Il n’y a pas de règle universelle : l’essentiel est la
            régularité plutôt que la performance. Intégrer de courtes
            périodes de mouvement dans ton quotidien (marcher, prendre les
            escaliers, t’étirer) compte tout autant qu’une séance
            planifiée.
          </Text>

          <Text style={styles.body}>
            L’intensité adaptée dépend de ton niveau de forme, de ta santé,
            de ton énergie du moment et de tes objectifs personnels : ce
            qui convient à une personne ne convient pas forcément à une
            autre.
          </Text>

          <View style={styles.highlightBox}>
            <MaterialDesignIcons
              name="calendar-heart"
              size={23}
              color={ROSE}
            />

            <View style={styles.highlightCopy}>
              <Text style={styles.highlightTitle}>
                Priorité à la régularité
              </Text>

              <Text style={styles.highlightText}>
                Trois courtes séances par semaine, maintenues dans la
                durée, sont souvent plus bénéfiques qu’un objectif ambitieux
                abandonné après quelques jours.
              </Text>
            </View>
          </View>

          {/* 5 */}
          <Text style={styles.h2}>5. Adapter l’activité à son cycle</Text>

          <Text style={styles.body}>
            L’énergie et le confort physique peuvent varier au fil du
            cycle. Adapter l’intensité de ton activité selon ce que tu
            ressens est tout à fait légitime.
          </Text>

          <View style={styles.consultCard}>
            {CYCLE_PHASES.map(([icon, text]) => (
              <View key={text} style={styles.consultRow}>
                <View style={styles.consultIcon}>
                  <MaterialDesignIcons
                    name={icon as never}
                    size={18}
                    color={ROSE}
                  />
                </View>

                <Text style={styles.consultText}>{text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.neutralBox}>
            <MaterialDesignIcons
              name="information-outline"
              size={22}
              color="#85727E"
            />

            <Text style={styles.neutralText}>
              Il ne s’agit pas de règles physiologiques strictes : chaque
              femme vit son cycle différemment, et ces exemples sont des
              repères, pas des obligations.
            </Text>
          </View>

          {/* 6 */}
          <Text style={styles.h2}>6. Bouger quand on a un SOPK</Text>

          <Text style={styles.body}>
            Chez les femmes ayant un SOPK, l’activité physique régulière
            peut être particulièrement utile : elle soutient la
            sensibilité à l’insuline, un mécanisme souvent affecté dans ce
            contexte, et peut contribuer à un meilleur équilibre
            métabolique et hormonal sur le long terme.
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
                Il ne s’agit pas d’un remède, mais d’un soutien
                complémentaire à une prise en charge globale, à adapter
                avec un professionnel de santé.
              </Text>
            </View>
          </View>

          {/* 7 */}
          <Text style={styles.h2}>7. Les erreurs à éviter</Text>

          <Text style={styles.body}>
            Certaines idées reçues ou habitudes peuvent desservir plus
            qu’aider :
          </Text>

          <View style={styles.checkList}>
            {MISTAKES.map(item => (
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

          {/* 8 */}
          <Text style={styles.h2}>8. Quand demander conseil</Text>

          <Text style={styles.body}>
            Dans certaines situations, l’avis d’un professionnel de santé
            est particulièrement utile avant de reprendre ou d’adapter une
            activité physique :
          </Text>

          <View style={styles.consultCard}>
            {CONSULT_REASONS.map(([icon, text]) => (
              <View key={text} style={styles.consultRow}>
                <View style={styles.consultIcon}>
                  <MaterialDesignIcons
                    name={icon as never}
                    size={18}
                    color={ROSE}
                  />
                </View>

                <Text style={styles.consultText}>{text}</Text>
              </View>
            ))}
          </View>

          {/* 9 */}
          <Text style={styles.h2}>9. À retenir</Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={ROSE}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Bon à savoir</Text>
              <Text style={styles.tipText}>
                Le mouvement n’a pas besoin d’être intense ou parfait pour
                être bénéfique. Une activité régulière, agréable et
                durable peut soutenir ta santé globale et contribuer, chez
                certaines femmes, à une meilleure gestion du cycle.
              </Text>
            </View>
          </View>

          {/* FINAL NOTE */}
          <View style={styles.finalNote}>
            <MaterialDesignIcons
              name="shield-check-outline"
              size={23}
              color="#85727E"
            />

            <View style={styles.finalNoteCopy}>
              <Text style={styles.finalNoteTitle}>
                Un guide pour mieux comprendre
              </Text>

              <Text style={styles.finalNoteText}>
                Cet article est destiné à l’information générale et ne
                remplace pas un avis médical. Adapte toujours l’activité
                physique à ta situation personnelle, et demande conseil à
                un professionnel de santé en cas de doute.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={8} scrollRef={scrollRef} />
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
  introSecondary: {
    marginTop: 9,
    fontSize: 13.5,
    lineHeight: 20.5,
    color: MUTED,
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
  highlightBox: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 13,
    backgroundColor: '#F7EFF2',
    borderWidth: 1,
    borderColor: '#EADBE0',
  },
  highlightCopy: {flex: 1, marginLeft: 10},
  highlightTitle: {color: INK, fontSize: 13, fontWeight: '800'},
  highlightText: {
    marginTop: 4,
    color: '#5A5158',
    fontSize: 11.5,
    lineHeight: 17,
  },
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
  finalNote: {
    marginTop: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 13,
    backgroundColor: '#F1EDEF',
  },
  finalNoteCopy: {flex: 1, marginLeft: 10},
  finalNoteTitle: {color: INK, fontSize: 13, fontWeight: '800'},
  finalNoteText: {
    marginTop: 4,
    color: '#5C535B',
    fontSize: 11,
    lineHeight: 16.5,
  },
});
