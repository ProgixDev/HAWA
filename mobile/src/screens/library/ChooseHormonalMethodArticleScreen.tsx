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

const ID = 'hormonaltreatments-choisir-sa-methode';

const HERO = require('../../assets/images/library/featured-spm.png');

const QUESTIONS = [
  'Comment mon corps réagit-il aux hormones ?',
  'Ai-je besoin d’un geste quotidien, hebdomadaire, ou d’une solution longue durée ?',
  'Ai-je un projet de grossesse à moyen terme ?',
  'Quel est mon budget et l’accès à ce moyen de contraception ?',
];

const PRIORITIES = [
  {
    icon: 'calendar-check-outline',
    title: 'Simplicité',
    text: 'Certaines méthodes demandent une action quotidienne, alors que d’autres nécessitent seulement une attention hebdomadaire ou beaucoup plus espacée.',
  },
  {
    icon: 'heart-pulse',
    title: 'Tolérance',
    text: 'Les effets ressentis peuvent varier d’une personne à l’autre. Il est important d’observer comment ton corps réagit et d’en parler si quelque chose te gêne.',
  },
  {
    icon: 'baby-face-outline',
    title: 'Projet de grossesse',
    text: 'Si tu souhaites une grossesse prochainement, la durée d’utilisation et le retour de la fertilité après l’arrêt peuvent faire partie des éléments à discuter.',
  },
  {
    icon: 'shield-check-outline',
    title: 'Efficacité',
    text: 'L’efficacité dépend non seulement de la méthode choisie, mais aussi de son utilisation correcte et régulière.',
  },
];

const COMPARISON = [
  {
    icon: 'pill',
    title: 'Pilule',
    detail: 'Geste quotidien',
  },
  {
    icon: 'bandage',
    title: 'Patch',
    detail: 'Changement hebdomadaire',
  },
  {
    icon: 'circle-outline',
    title: 'Anneau',
    detail: 'Cycle de plusieurs semaines',
  },
  {
    icon: 'needle',
    title: 'Implant',
    detail: 'Solution longue durée',
  },
  {
    icon: 'shape-outline',
    title: 'Stérilet hormonal',
    detail: 'Solution longue durée',
  },
];

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function ChooseHormonalMethodArticleScreen({
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
      message: 'Choisir le traitement qui te convient — AWA',
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
              <MaterialDesignIcons
                name="chevron-left"
                size={23}
                color={theme.colors.text}
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
            <Text style={styles.badgeText}>CHOISIR SA MÉTHODE</Text>
          </View>

          <Text style={styles.title}>
            Choisir le traitement{`\n`}qui te convient
          </Text>

          <View style={styles.metas}>
            {[
              ['clock-outline', '7 min de lecture'],
              ['book-open-page-variant-outline', 'Guide'],
              ['chart-bar', 'Intermédiaire'],
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
            Les bonnes questions à te poser pour trouver une méthode
            contraceptive adaptée à ton quotidien, à tes besoins et à tes
            projets.
          </Text>

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>Dans cet article</Text>

            {[
              'Les questions à te poser',
              'Aucune méthode « meilleure » dans l’absolu',
              'Les critères qui peuvent faire la différence',
              'En parler avec un professionnel',
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
                  color={theme.colors.primary}
                />
              </View>
            ))}
          </View>

          <Text style={styles.h2}>1. Les questions à te poser</Text>

          <Text style={styles.body}>
            Il n’existe pas une contraception idéale pour tout le monde.
            Avant de choisir une méthode, il peut être utile de réfléchir à
            tes habitudes, tes préférences, ta tolérance et tes projets.
          </Text>

          <View style={styles.checkList}>
            {QUESTIONS.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.h2}>
            2. Aucune méthode « meilleure » dans l’absolu
          </Text>

          <Text style={styles.body}>
            Deux personnes peuvent choisir des méthodes différentes et avoir
            toutes les deux fait un choix parfaitement adapté à leur
            situation. Le bon choix dépend notamment de la façon dont tu
            souhaites utiliser ta contraception et de ce que tu recherches.
          </Text>

          <View style={styles.highlight}>
            <MaterialDesignIcons
              name="information-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.highlightCopy}>
              <Text style={styles.highlightTitle}>Le bon repère</Text>

              <Text style={styles.highlightText}>
                Une méthode intéressante sur le papier n’est pas forcément
                celle qui sera la plus simple ou la plus confortable pour toi
                au quotidien.
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>
            3. Les critères qui peuvent faire la différence
          </Text>

          <Text style={styles.body}>
            Pour comparer plusieurs options, tu peux regarder différents
            critères. L’objectif n’est pas de tout connaître par cœur, mais
            d’identifier ce qui compte réellement pour toi.
          </Text>

          <View style={styles.priorityList}>
            {PRIORITIES.map(item => (
              <View key={item.title} style={styles.priorityCard}>
                <View style={styles.priorityIcon}>
                  <MaterialDesignIcons
                    name={item.icon as never}
                    size={21}
                    color={theme.colors.primary}
                  />
                </View>

                <View style={styles.priorityCopy}>
                  <Text style={styles.priorityTitle}>{item.title}</Text>

                  <Text style={styles.priorityText}>{item.text}</Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.h3}>Le rythme d’utilisation</Text>

          <Text style={styles.body}>
            Une différence importante entre les méthodes concerne la
            fréquence à laquelle tu dois penser à ta contraception.
          </Text>

          <View style={styles.comparison}>
            {COMPARISON.map((item, index) => (
              <View
                key={item.title}
                style={[
                  styles.comparisonRow,
                  index === COMPARISON.length - 1 &&
                    styles.comparisonRowLast,
                ]}>
                <View style={styles.comparisonIcon}>
                  <MaterialDesignIcons
                    name={item.icon as never}
                    size={19}
                    color={theme.colors.primary}
                  />
                </View>

                <View style={styles.comparisonCopy}>
                  <Text style={styles.comparisonTitle}>{item.title}</Text>
                  <Text style={styles.comparisonDetail}>{item.detail}</Text>
                </View>

                <MaterialDesignIcons
                  name="chevron-right"
                  size={18}
                  color={theme.colors.textMuted}
                />
              </View>
            ))}
          </View>

          <Text style={styles.h3}>Observer la réaction de ton corps</Text>

          <Text style={styles.body}>
            Une méthode hormonale peut être ressentie différemment selon les
            personnes. Certaines remarquent des changements du cycle, des
            saignements ou d’autres effets indésirables. Ces réactions ne
            signifient pas automatiquement que la méthode ne convient pas,
            mais elles méritent d’être prises en compte.
          </Text>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-circle-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>À surveiller</Text>

              <Text style={styles.tipText}>
                Si un effet est important, persistant ou inhabituel, ne reste
                pas seule avec tes questions. Un médecin, une sage-femme ou
                un autre professionnel de santé peut t’aider à déterminer
                s’il faut poursuivre, adapter ou changer la méthode.
              </Text>
            </View>
          </View>

          <Text style={styles.h3}>Tenir compte de tes projets</Text>

          <Text style={styles.body}>
            Ton projet de grossesse peut également influencer le choix. Si
            tu souhaites éviter une grossesse pendant plusieurs années, une
            méthode longue durée peut être intéressante. Si tu envisages une
            grossesse plus prochainement, d’autres options peuvent davantage
            correspondre à ton calendrier.
          </Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="calendar-heart"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>À garder en tête</Text>

              <Text style={styles.tipText}>
                Parler de ton projet de grossesse, même s’il est encore
                lointain ou incertain, permet au professionnel de santé de
                mieux orienter la discussion.
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>4. En parler avec un professionnel</Text>

          <Text style={styles.body}>
            Un rendez-vous permet de mettre en balance les avantages, les
            contraintes et les éventuelles contre-indications de chaque
            méthode. Tu peux préparer quelques questions avant la consultation
            afin de ne pas oublier les points importants.
          </Text>

          <View style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <MaterialDesignIcons
                name="message-question-outline"
                size={22}
                color={theme.colors.primary}
              />

              <Text style={styles.questionTitle}>
                Questions utiles à poser
              </Text>
            </View>

            {[
              'Quels sont les avantages de cette méthode pour moi ?',
              'Quels effets indésirables puis-je rencontrer ?',
              'Comment l’utiliser correctement ?',
              'Que faire si j’oublie, si elle se déplace ou si je souhaite l’arrêter ?',
              'Cette méthode correspond-elle à mon projet de grossesse ?',
            ].map((item, index) => (
              <View key={item} style={styles.questionRow}>
                <View style={styles.questionBullet}>
                  <Text style={styles.questionNumber}>{index + 1}</Text>
                </View>

                <Text style={styles.questionText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.professionalTip}>
            <MaterialDesignIcons
              name="doctor"
              size={25}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Bon à savoir</Text>

              <Text style={styles.tipText}>
                Une sage-femme ou un médecin peut prendre en compte tes
                antécédents, tes traitements, tes préférences et ton mode de
                vie avant de te conseiller une méthode.
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>5. À retenir</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <MaterialDesignIcons
                name="check-decagram-outline"
                size={25}
                color={theme.colors.primary}
              />

              <Text style={styles.summaryTitle}>L’essentiel</Text>
            </View>

            <View style={styles.summaryItem}>
              <MaterialDesignIcons
                name="check"
                size={18}
                color={theme.colors.success}
              />

              <Text style={styles.summaryText}>
                Choisis une méthode compatible avec ton quotidien.
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <MaterialDesignIcons
                name="check"
                size={18}
                color={theme.colors.success}
              />

              <Text style={styles.summaryText}>
                Tiens compte de ta tolérance et de tes préférences.
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <MaterialDesignIcons
                name="check"
                size={18}
                color={theme.colors.success}
              />

              <Text style={styles.summaryText}>
                Pense à ton projet de grossesse et à ton horizon de temps.
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <MaterialDesignIcons
                name="check"
                size={18}
                color={theme.colors.success}
              />

              <Text style={styles.summaryText}>
                Demande conseil à un professionnel en cas de doute.
              </Text>
            </View>
          </View>

          <View style={styles.finalTip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={25}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>À retenir</Text>

              <Text style={styles.tipText}>
                La meilleure méthode n’est pas nécessairement celle qui
                semble la plus pratique ou la plus populaire. C’est celle
                qui correspond à ta situation, à tes besoins et à tes
                préférences, après une discussion éclairée avec un
                professionnel de santé.
              </Text>
            </View>
          </View>

          <View style={styles.disclaimer}>
            <MaterialDesignIcons
              name="shield-outline"
              size={19}
              color={theme.colors.textMuted}
            />

            <Text style={styles.disclaimerText}>
              Cet article a une vocation informative et ne remplace pas un
              avis médical personnalisé.
            </Text>
          </View>
        </View>
      </ScrollView>

      <ReadingControls
        articleId={ID}
        durationMinutes={7}
        scrollRef={scrollRef}
      />
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  scroll: {
    paddingBottom: 30,
  },

  heroWrap: {
    height: 245,
    backgroundColor: theme.colors.surfaceSecondary,
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
    backgroundColor: withAlpha(theme.colors.surface, 0.90),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  pressed: {
    opacity: 0.74,
  },

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

  badgeText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '800',
  },

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

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  metaDivider: {
    width: 1,
    height: 20,
    backgroundColor: theme.colors.border,
  },

  meta: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },

  intro: {
    marginTop: 17,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },

  contents: {
    marginTop: 19,
    padding: 15,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  contentsTitle: {
    marginBottom: 7,
    fontSize: 15,
    color: theme.colors.text,
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
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },

  contentText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 17,
    color: theme.colors.text,
  },

  h2: {
    marginTop: 27,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: theme.colors.text,
    fontWeight: '700',
  },

  h3: {
    marginTop: 22,
    fontSize: 16,
    lineHeight: 22,
    color: theme.colors.text,
    fontWeight: '800',
  },

  body: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textSecondary,
  },

  checkList: {
    marginTop: 13,
    padding: 14,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },

  checkText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 12.5,
    lineHeight: 18,
  },

  highlight: {
    marginTop: 16,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 13,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  highlightCopy: {
    flex: 1,
    marginLeft: 11,
  },

  highlightTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  highlightText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.textSecondary,
  },

  priorityList: {
    marginTop: 14,
    gap: 10,
  },

  priorityCard: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 13,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  priorityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  priorityCopy: {
    flex: 1,
    marginLeft: 11,
  },

  priorityTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  priorityText: {
    marginTop: 4,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  comparison: {
    marginTop: 14,
    overflow: 'hidden',
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  comparisonRow: {
    minHeight: 61,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },

  comparisonRowLast: {
    borderBottomWidth: 0,
  },

  comparisonIcon: {
    width: 35,
    height: 35,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  comparisonCopy: {
    flex: 1,
    marginLeft: 10,
  },

  comparisonTitle: {
    fontSize: 12.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  comparisonDetail: {
    marginTop: 2,
    fontSize: 11,
    color: theme.colors.textMuted,
  },

  alert: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  tip: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  tipCopy: {
    flex: 1,
    marginLeft: 11,
  },

  tipTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  tipText: {
    marginTop: 4,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  questionCard: {
    marginTop: 15,
    padding: 15,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 13,
  },

  questionTitle: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '800',
  },

  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 11,
  },

  questionBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  questionNumber: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '800',
  },

  questionText: {
    flex: 1,
    marginLeft: 9,
    paddingTop: 2,
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  professionalTip: {
    marginTop: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  summaryCard: {
    marginTop: 15,
    padding: 16,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 13,
  },

  summaryTitle: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '800',
  },

  summaryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },

  summaryText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.textSecondary,
  },

  finalTip: {
    marginTop: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 13,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
  },

  disclaimer: {
    marginTop: 20,
    paddingHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },

  disclaimerText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 16,
    color: theme.colors.textMuted,
  },
  });
}
