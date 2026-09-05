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

const ID = 'pcos-poids-metabolisme-insuline';

const CREAM = '#FCF9F5';
const INK = '#30283A';
const ROSE = '#B96778';
const BORDER = '#ECE5DF';

const HERO = require('../../assets/images/library/popular-nutrition.png');

const WEIGHT_FACTS = [
  'Le SOPK touche des femmes de toutes corpulences, minces comme fortes.',
  'La prise de poids n’est pas systématique.',
  'Perdre du poids n’est pas toujours nécessaire ni suffisant pour améliorer les symptômes.',
  'Une petite perte de poids peut parfois améliorer certains paramètres métaboliques ou la régularité du cycle lorsqu’un surpoids est présent.',
];

const DAILY_HABITS = [
  ['bowl-mix-outline', 'Des repas réguliers et variés, riches en fibres'],
  ['shoe-sneaker', 'Une activité physique régulière, même modérée'],
  ['weather-night', 'Un sommeil suffisant et régulier'],
  ['cup-water', 'Une hydratation suffisante au quotidien'],
] as const;

const MEDICAL_FOLLOW_UP = [
  [
    'calendar-check-outline',
    'Cycles très irréguliers',
    'Signaler des règles très espacées ou imprévisibles.',
  ],
  [
    'water-alert-outline',
    'Soif ou urines fréquentes',
    'En parler au médecin si ces signes apparaissent de façon inhabituelle.',
  ],
  [
    'scale-bathroom',
    'Variation importante du poids',
    'Une évolution rapide ou inexpliquée mérite une évaluation.',
  ],
  [
    'heart-pulse',
    'Antécédents familiaux',
    'Mentionner les antécédents de diabète ou de maladies métaboliques.',
  ],
] as const;

const MEDICAL_CHECKS = [
  'Glycémie et/ou HbA1c selon le contexte',
  'Bilan lipidique (cholestérol et triglycérides)',
  'Évaluation de la tension artérielle et du risque cardiovasculaire',
  'Suivi du poids et du tour de taille sans jugement',
];

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function PcosMetabolismArticleScreen({
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
      message: 'Poids, métabolisme et résistance à l’insuline — AWA',
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
              {
                paddingTop: getTopPadding(insets.top, true),
              },
            ]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retour"
              onPress={() => navigation.goBack()}
              style={({pressed}) => [
                styles.circle,
                pressed && styles.pressed,
              ]}>
              <MaterialDesignIcons
                name="chevron-left"
                size={23}
                color={INK}
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
            <Text style={styles.badgeText}>SOPK</Text>
          </View>

          <Text style={styles.title}>
            Poids, métabolisme et{`\n`}résistance à l’insuline
          </Text>

          <View style={styles.metas}>
            {[
              ['clock-outline', '6 min de lecture'],
              ['book-open-page-variant-outline', 'Guide'],
              ['chart-bar', 'Intermédiaire'],
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
            Le lien entre SOPK, poids et résistance à l’insuline, sans
            jugement ni raccourci.
          </Text>

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>Dans cet article</Text>

            {[
              'Le lien entre SOPK et métabolisme',
              'Comprendre la résistance à l’insuline',
              'Poids : ce qui est vrai et ce qui ne l’est pas',
              'Des habitudes qui soutiennent l’équilibre',
              'Quand un suivi médical est utile',
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

          <Text style={styles.h2}>
            1. Le lien entre SOPK et métabolisme
          </Text>

          <Text style={styles.body}>
            Le SOPK est souvent associé à des changements métaboliques,
            notamment une résistance à l’insuline. Cette association ne
            concerne cependant pas uniquement les femmes en surpoids : le
            profil métabolique varie d’une personne à l’autre.
          </Text>

          <Text style={styles.h2}>
            2. Comprendre la résistance à l’insuline
          </Text>

          <Text style={styles.body}>
            L’insuline est une hormone qui aide les cellules à utiliser le
            glucose présent dans le sang. En cas de résistance à l’insuline,
            les cellules répondent moins bien à cette hormone et l’organisme
            peut compenser en produisant davantage d’insuline.
          </Text>

          <Text style={styles.body}>
            Dans le SOPK, cette situation peut être associée à une
            augmentation de la production d’androgènes et contribuer à
            certains symptômes. Mais toutes les femmes atteintes de SOPK
            n’ont pas le même profil métabolique.
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
                La résistance à l’insuline peut être recherchée par un bilan
                biologique lorsque le médecin le juge pertinent. Le besoin
                d’examens dépend du contexte individuel.
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>
            3. Poids : ce qui est vrai et ce qui ne l’est pas
          </Text>

          <View style={styles.checkList}>
            {WEIGHT_FACTS.map(item => (
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

          <Text style={styles.h2}>
            4. Des habitudes qui soutiennent l’équilibre
          </Text>

          <Text style={styles.body}>
            L’objectif n’est pas de rechercher un poids « parfait », mais de
            mettre en place des habitudes réalistes et durables. Une
            alimentation équilibrée, le mouvement et un sommeil régulier
            peuvent participer à une meilleure santé métabolique.
          </Text>

          <View style={styles.daily}>
            {DAILY_HABITS.map(([icon, label]) => (
              <View key={label} style={styles.dailyItem}>
                <View style={styles.dailyIcon}>
                  <MaterialDesignIcons
                    name={icon as never}
                    color={ROSE}
                    size={24}
                  />
                </View>

                <Text style={styles.dailyText}>{label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.h2}>
            5. Quand un suivi médical est utile
          </Text>

          <Text style={styles.body}>
            Le suivi médical du SOPK ne se limite pas au cycle ou aux
            symptômes hormonaux. Selon ton profil, le professionnel de santé
            peut aussi surveiller certains paramètres métaboliques afin
            d’identifier précocement d’éventuels facteurs de risque.
          </Text>

          <View style={styles.medicalCard}>
            <View style={styles.medicalHeader}>
              <View style={styles.medicalHeaderIcon}>
                <MaterialDesignIcons
                  name="stethoscope"
                  size={22}
                  color={ROSE}
                />
              </View>

              <View style={styles.medicalHeaderCopy}>
                <Text style={styles.medicalTitle}>
                  Un suivi adapté à ton profil
                </Text>

                <Text style={styles.medicalSubtitle}>
                  Le bilan n’est pas identique pour tout le monde.
                </Text>
              </View>
            </View>

            <Text style={styles.medicalDescription}>
              Le médecin peut décider de contrôler certains paramètres en
              fonction de tes symptômes, de tes antécédents, de ta situation
              familiale et des autres facteurs de risque.
            </Text>

            <Text style={styles.medicalSectionTitle}>
              Ce qui peut être surveillé
            </Text>

            <View style={styles.medicalChecks}>
              {MEDICAL_CHECKS.map((item, index) => (
                <View key={item} style={styles.medicalCheckRow}>
                  <View style={styles.medicalCheckNumber}>
                    <Text style={styles.medicalCheckNumberText}>
                      {index + 1}
                    </Text>
                  </View>

                  <Text style={styles.medicalCheckText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={styles.subH3}>Situations à signaler</Text>

          <Text style={styles.body}>
            Certains changements méritent d’être mentionnés lors d’une
            consultation, surtout lorsqu’ils sont nouveaux, persistants ou
            inhabituels pour toi.
          </Text>

          <View style={styles.signalGrid}>
            {MEDICAL_FOLLOW_UP.map(([icon, title, description]) => (
              <View key={title} style={styles.signalCard}>
                <View style={styles.signalIcon}>
                  <MaterialDesignIcons
                    name={icon as never}
                    size={22}
                    color={ROSE}
                  />
                </View>

                <Text style={styles.signalTitle}>{title}</Text>

                <Text style={styles.signalDescription}>{description}</Text>
              </View>
            ))}
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
                Une soif inhabituelle, des urines fréquentes, une fatigue
                persistante ou une variation importante et inexpliquée du
                poids doivent être signalées à un professionnel de santé.
                Ces signes peuvent avoir plusieurs causes et ne permettent
                pas, à eux seuls, de conclure à une résistance à l’insuline
                ou à un diabète.
              </Text>
            </View>
          </View>

          <View style={styles.followUpTip}>
            <MaterialDesignIcons
              name="calendar-heart"
              size={24}
              color={ROSE}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                Le suivi se fait dans le temps
              </Text>

              <Text style={styles.tipText}>
                Le médecin peut proposer un contrôle régulier plutôt qu’un
                bilan unique. L’objectif est d’adapter les conseils et les
                examens à ton évolution, sans se focaliser uniquement sur le
                poids.
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>6. À retenir</Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={ROSE}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Bon à savoir</Text>

              <Text style={styles.tipText}>
                Le poids n’est qu’une partie du tableau métabolique du SOPK.
                Une prise en charge globale tient compte des cycles, des
                symptômes, des habitudes de vie, des antécédents et des
                paramètres métaboliques.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <ReadingControls
        articleId={ID}
        durationMinutes={6}
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
    paddingBottom: 30,
  },

  heroWrap: {
    height: 245,
    backgroundColor: '#EFE3D5',
  },

  hero: {
    width: '100%',
    height: '100%',
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.90)',
    borderWidth: 1,
    borderColor: BORDER,
  },

  pressed: {
    opacity: 0.74,
  },

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
    fontSize: 11,
    color: ROSE,
    fontWeight: '800',
  },

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

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  metaDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#DDD5DA',
  },

  meta: {
    fontSize: 10,
    color: '#777078',
  },

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

  contentLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  contentNumber: {
    width: 24,
    color: ROSE,
    fontSize: 12,
    fontWeight: '800',
  },

  contentText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 17,
    color: INK,
  },

  h2: {
    marginTop: 24,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: INK,
    fontWeight: '700',
  },

  subH3: {
    marginTop: 22,
    fontSize: 17,
    lineHeight: 23,
    color: INK,
    fontWeight: '800',
  },

  body: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: '#4A444B',
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

  checkText: {
    flex: 1,
    color: '#4A444B',
    fontSize: 12,
    lineHeight: 17,
  },

  daily: {
    marginTop: 13,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  dailyItem: {
    width: '48.7%',
    minHeight: 118,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#FBF5F6',
    borderWidth: 1,
    borderColor: '#F1E3E7',
  },

  dailyIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8E9EE',
  },

  dailyText: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 16,
    color: INK,
    textAlign: 'center',
  },

  medicalCard: {
    marginTop: 15,
    padding: 16,
    borderRadius: 15,
    backgroundColor: '#F8F2F4',
    borderWidth: 1,
    borderColor: '#EFE0E5',
  },

  medicalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  medicalHeaderIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4E1E6',
  },

  medicalHeaderCopy: {
    flex: 1,
    marginLeft: 11,
  },

  medicalTitle: {
    fontSize: 15,
    lineHeight: 20,
    color: INK,
    fontWeight: '800',
  },

  medicalSubtitle: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 16,
    color: '#756C73',
  },

  medicalDescription: {
    marginTop: 13,
    fontSize: 12.5,
    lineHeight: 19,
    color: '#4F484F',
  },

  medicalSectionTitle: {
    marginTop: 16,
    marginBottom: 9,
    fontSize: 13,
    color: INK,
    fontWeight: '800',
  },

  medicalChecks: {
    gap: 8,
  },

  medicalCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },

  medicalCheckNumber: {
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFDCE2',
  },

  medicalCheckNumberText: {
    fontSize: 10,
    color: ROSE,
    fontWeight: '800',
  },

  medicalCheckText: {
    flex: 1,
    marginLeft: 9,
    fontSize: 11.5,
    lineHeight: 17,
    color: '#4A444B',
  },

  signalGrid: {
    marginTop: 13,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  signalCard: {
    width: '48.7%',
    minHeight: 145,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FBF8F5',
    borderWidth: 1,
    borderColor: BORDER,
  },

  signalIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7E7EB',
  },

  signalTitle: {
    marginTop: 9,
    fontSize: 12.5,
    lineHeight: 17,
    color: INK,
    fontWeight: '800',
  },

  signalDescription: {
    marginTop: 4,
    fontSize: 10.5,
    lineHeight: 15,
    color: '#655D64',
  },

  alert: {
    marginTop: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: '#F8E8E8',
  },

  followUpTip: {
    marginTop: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: '#F5EBEF',
    borderWidth: 1,
    borderColor: '#EDDEE3',
  },

  tip: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: '#F5EBEF',
  },

  tipCopy: {
    flex: 1,
    marginLeft: 11,
  },

  tipTitle: {
    fontSize: 13,
    lineHeight: 18,
    color: INK,
    fontWeight: '800',
  },

  tipText: {
    marginTop: 3,
    fontSize: 11.5,
    lineHeight: 17,
    color: '#585057',
  },
});