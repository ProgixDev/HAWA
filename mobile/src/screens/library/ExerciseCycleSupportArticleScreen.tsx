import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
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

const ID = 'exercise-bouger-pour-le-cycle';

const HERO = require('../../assets/images/library/activité.png');

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const ACTIVITY_ICONS = [
  'walk',
  'yoga',
  'dumbbell',
  'bike',
  'swim',
  'dance-ballroom',
] as const;

const CYCLE_PHASE_ICONS = [
  'water-outline',
  'weather-sunny',
  'egg-outline',
  'moon-waning-crescent',
] as const;

const CONSULT_ICONS = [
  'alert-circle-outline',
  'water-alert-outline',
  'emoticon-dizzy-outline',
  'battery-alert-outline',
  'medical-bag',
  'baby-carriage',
  'shield-alert-outline',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'CYCLE • ACTIVITÉ PHYSIQUE',
    title: 'Bouger pour\nsoutenir ton cycle',
    metaDuration: '8 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu éducatif',
    intro: 'Pourquoi une activité physique régulière peut soutenir l’équilibre de ton cycle, quels types de mouvement privilégier, et comment adapter ton rythme sans pression ni culpabilité.',
    introSecondary: 'Il ne s’agit pas de faire plus, mais de bouger d’une façon qui te correspond et que tu peux maintenir dans la durée.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Pourquoi bouger peut soutenir ton cycle',
      'Quels bénéfices pour le cycle ?',
      'Quel type d’activité choisir ?',
      'Combien bouger ?',
      'Adapter l’activité à son cycle',
      'Bouger quand on a un SOPK',
      'Les erreurs à éviter',
      'Quand demander conseil',
      'À retenir',
    ],
    section1Body1: 'L’activité physique régulière influence de nombreux systèmes du corps, dont ceux impliqués dans la régulation hormonale et le fonctionnement du cycle menstruel. Elle agit notamment sur la sensibilité à l’insuline, la gestion du stress et la qualité du sommeil, trois facteurs qui interagissent avec l’équilibre hormonal.',
    section1Body2: 'Bouger régulièrement ne garantit pas un cycle « parfait », mais fait partie des habitudes qui soutiennent une bonne santé générale, avec des effets qui peuvent se refléter sur le cycle chez certaines femmes.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Le lien entre activité physique et cycle est individuel : certaines femmes remarquent des effets nets, d’autres moins. Cela reste une habitude bénéfique dans tous les cas.',
    section2Intro: 'Une activité régulière peut contribuer à plusieurs niveaux, sans que ces effets soient garantis ou identiques pour toutes :',
    benefits: [
      'Soutenir la santé métabolique',
      'Aider à réguler la glycémie',
      'Soutenir l’équilibre hormonal',
      'Améliorer le niveau d’énergie',
      'Réduire le stress',
      'Soutenir la qualité du sommeil',
      'Favoriser, chez certaines femmes, une meilleure régularité du cycle',
    ],
    neutral1Text: 'Ces bénéfices s’installent progressivement : il ne s’agit pas d’un effet immédiat après une seule séance.',
    section3Intro: 'Il n’existe pas d’activité « meilleure » que les autres : la plus efficace est celle que tu prends plaisir à pratiquer régulièrement.',
    activities: [
      'Marche',
      'Yoga / mobilité douce',
      'Renforcement musculaire',
      'Vélo',
      'Natation',
      'Danse',
    ],
    section4Body1: 'Il n’y a pas de règle universelle : l’essentiel est la régularité plutôt que la performance. Intégrer de courtes périodes de mouvement dans ton quotidien (marcher, prendre les escaliers, t’étirer) compte tout autant qu’une séance planifiée.',
    section4Body2: 'L’intensité adaptée dépend de ton niveau de forme, de ta santé, de ton énergie du moment et de tes objectifs personnels : ce qui convient à une personne ne convient pas forcément à une autre.',
    highlightTitle: 'Priorité à la régularité',
    highlightText: 'Trois courtes séances par semaine, maintenues dans la durée, sont souvent plus bénéfiques qu’un objectif ambitieux abandonné après quelques jours.',
    section5Body: 'L’énergie et le confort physique peuvent varier au fil du cycle. Adapter l’intensité de ton activité selon ce que tu ressens est tout à fait légitime.',
    cyclePhases: [
      'Pendant les règles : un mouvement doux si cela te convient',
      'Après les règles : augmenter progressivement si l’énergie le permet',
      'Autour de l’ovulation : maintenir une activité normale selon ton confort',
      'Avant les règles : privilégier un mouvement gérable, et du repos si besoin',
    ],
    neutral2Text: 'Il ne s’agit pas de règles physiologiques strictes : chaque femme vit son cycle différemment, et ces exemples sont des repères, pas des obligations.',
    section6Body: 'Chez les femmes ayant un SOPK, l’activité physique régulière peut être particulièrement utile : elle soutient la sensibilité à l’insuline, un mécanisme souvent affecté dans ce contexte, et peut contribuer à un meilleur équilibre métabolique et hormonal sur le long terme.',
    tip2Title: 'Bon à savoir',
    tip2Text: 'Il ne s’agit pas d’un remède, mais d’un soutien complémentaire à une prise en charge globale, à adapter avec un professionnel de santé.',
    section7Intro: 'Certaines idées reçues ou habitudes peuvent desservir plus qu’aider :',
    mistakes: [
      'Vouloir faire de l’exercice de façon excessive',
      'Penser que seuls les entraînements intenses sont utiles',
      'Faire du sport uniquement dans un objectif de perte de poids',
      'Ignorer la fatigue ou la douleur',
      'Culpabiliser après une séance manquée',
    ],
    section8Intro: 'Dans certaines situations, l’avis d’un professionnel de santé est particulièrement utile avant de reprendre ou d’adapter une activité physique :',
    consultReasons: [
      'Une douleur persistante',
      'Des saignements inhabituels',
      'Des sensations de vertige',
      'Une fatigue importante et inhabituelle',
      'Une condition médicale particulière',
      'Une reprise d’activité après une grossesse ou un accouchement',
      'Toute situation où l’activité a été médicalement restreinte',
    ],
    tip3Title: 'Bon à savoir',
    tip3Text: 'Le mouvement n’a pas besoin d’être intense ou parfait pour être bénéfique. Une activité régulière, agréable et durable peut soutenir ta santé globale et contribuer, chez certaines femmes, à une meilleure gestion du cycle.',
    finalNoteTitle: 'Un guide pour mieux comprendre',
    finalNoteText: 'Cet article est destiné à l’information générale et ne remplace pas un avis médical. Adapte toujours l’activité physique à ta situation personnelle, et demande conseil à un professionnel de santé en cas de doute.',
    shareMessage: 'Bouger pour soutenir ton cycle — AWA',
  },
  en: {
    badge: 'CYCLE • PHYSICAL ACTIVITY',
    title: 'Move to\nsupport your cycle',
    metaDuration: '8 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Educational content',
    intro: 'Why regular physical activity may support your cycle’s balance, which types of movement to favor, and how to adapt your pace without pressure or guilt.',
    introSecondary: 'It’s not about doing more, but about moving in a way that suits you and that you can keep up over time.',
    contentsTitle: 'In this article',
    topics: [
      'Why moving may support your cycle',
      'What benefits for your cycle?',
      'Which type of activity to choose?',
      'How much should you move?',
      'Adapting activity to your cycle',
      'Moving when you have PCOS',
      'Mistakes to avoid',
      'When to ask for advice',
      'Key takeaways',
    ],
    section1Body1: 'Regular physical activity influences many of the body’s systems, including those involved in hormonal regulation and how the menstrual cycle functions. It acts in particular on insulin sensitivity, stress management, and sleep quality — three factors that interact with hormonal balance.',
    section1Body2: 'Moving regularly doesn’t guarantee a “perfect” cycle, but it’s one of the habits that supports good overall health, with effects that may be reflected in the cycle for some women.',
    tip1Title: 'Good to know',
    tip1Text: 'The link between physical activity and the cycle is individual: some women notice clear effects, others less so. Either way, it remains a beneficial habit.',
    section2Intro: 'Regular activity may contribute on several levels, without these effects being guaranteed or identical for everyone:',
    benefits: [
      'Supporting metabolic health',
      'Helping regulate blood sugar',
      'Supporting hormonal balance',
      'Improving energy levels',
      'Reducing stress',
      'Supporting sleep quality',
      'Promoting, in some women, better cycle regularity',
    ],
    neutral1Text: 'These benefits build up gradually: this isn’t an immediate effect after a single session.',
    section3Intro: 'No activity is “better” than another: the most effective one is the one you enjoy practicing regularly.',
    activities: [
      'Walking',
      'Yoga / gentle mobility',
      'Strength training',
      'Cycling',
      'Swimming',
      'Dance',
    ],
    section4Body1: 'There’s no universal rule: what matters most is regularity rather than performance. Fitting short bursts of movement into your day (walking, taking the stairs, stretching) counts just as much as a planned workout.',
    section4Body2: 'The right intensity depends on your fitness level, your health, your energy at the time, and your personal goals: what works for one person doesn’t necessarily work for another.',
    highlightTitle: 'Prioritize regularity',
    highlightText: 'Three short sessions a week, kept up over time, are often more beneficial than an ambitious goal abandoned after a few days.',
    section5Body: 'Energy and physical comfort can vary throughout the cycle. Adjusting the intensity of your activity based on how you feel is entirely legitimate.',
    cyclePhases: [
      'During your period: gentle movement if that suits you',
      'After your period: gradually increase if your energy allows',
      'Around ovulation: maintain normal activity according to your comfort',
      'Before your period: favor manageable movement, and rest if needed',
    ],
    neutral2Text: 'These are not strict physiological rules: every woman experiences her cycle differently, and these examples are reference points, not obligations.',
    section6Body: 'For women with PCOS, regular physical activity can be particularly helpful: it supports insulin sensitivity, a mechanism often affected in this context, and may contribute to better metabolic and hormonal balance over the long term.',
    tip2Title: 'Good to know',
    tip2Text: 'This isn’t a cure, but a complementary support to overall care, to be adapted with a healthcare professional.',
    section7Intro: 'Some misconceptions or habits can do more harm than good:',
    mistakes: [
      'Wanting to exercise excessively',
      'Thinking that only intense workouts are useful',
      'Exercising only with a weight-loss goal in mind',
      'Ignoring fatigue or pain',
      'Feeling guilty after a missed session',
    ],
    section8Intro: 'In certain situations, a healthcare professional’s advice is particularly useful before resuming or adapting a physical activity:',
    consultReasons: [
      'Persistent pain',
      'Unusual bleeding',
      'Dizziness',
      'Significant, unusual fatigue',
      'A specific medical condition',
      'Resuming activity after a pregnancy or childbirth',
      'Any situation where activity has been medically restricted',
    ],
    tip3Title: 'Good to know',
    tip3Text: 'Movement doesn’t need to be intense or perfect to be beneficial. A regular, enjoyable, and sustainable activity may support your overall health and contribute, in some women, to better cycle management.',
    finalNoteTitle: 'A guide to help you understand',
    finalNoteText: 'This article is intended for general information and does not replace medical advice. Always adapt physical activity to your personal situation, and seek advice from a healthcare professional if in doubt.',
    shareMessage: 'Move to support your cycle — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function ExerciseCycleSupportArticleScreen({
  navigation,
}: Props): React.JSX.Element {
  const {t, i18n} = useTranslation();
  const lang = i18n.language === 'en' ? 'en' : 'fr';
  const content = CONTENT[lang];
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
      message: content.shareMessage,
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
              accessibilityLabel={t('library.reader.back')}
              onPress={() => navigation.goBack()}
              style={({pressed}) => [styles.circle, pressed && styles.pressed]}>
              <MaterialDesignIcons name="chevron-left" size={23} color={theme.colors.text} />
            </Pressable>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('library.screen.addBookmark')}
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
                accessibilityLabel={t('libraryArticle.shareA11y')}
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
          {/* HEADER */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{content.badge}</Text>
          </View>

          <Text style={styles.title}>
            {content.title}
          </Text>

          <View style={styles.metas}>
            {[
              ['clock-outline', content.metaDuration],
              ['book-open-page-variant-outline', content.metaType],
              ['chart-bar', content.metaLevel],
              ['shield-check-outline', content.metaValidated],
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
            {content.intro}
          </Text>

          <Text style={styles.introSecondary}>
            {content.introSecondary}
          </Text>

          {/* CONTENTS */}
          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>{content.contentsTitle}</Text>

            {content.topics.map((item, index) => (
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

          {/* 1 */}
          <Text style={styles.h2}>1. {content.topics[0]}</Text>

          <Text style={styles.body}>
            {content.section1Body1}
          </Text>

          <Text style={styles.body}>
            {content.section1Body2}
          </Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.tip1Title}</Text>
              <Text style={styles.tipText}>
                {content.tip1Text}
              </Text>
            </View>
          </View>

          {/* 2 */}
          <Text style={styles.h2}>2. {content.topics[1]}</Text>

          <Text style={styles.body}>
            {content.section2Intro}
          </Text>

          <View style={styles.checkList}>
            {content.benefits.map(item => (
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

          <View style={styles.neutralBox}>
            <MaterialDesignIcons
              name="information-outline"
              size={22}
              color={theme.colors.textMuted}
            />

            <Text style={styles.neutralText}>
              {content.neutral1Text}
            </Text>
          </View>

          {/* 3 */}
          <Text style={styles.h2}>3. {content.topics[2]}</Text>

          <Text style={styles.body}>
            {content.section3Intro}
          </Text>

          <View style={styles.daily}>
            {ACTIVITY_ICONS.map((icon, index) => (
              <View key={icon} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={icon as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <Text style={styles.dailyText}>{content.activities[index]}</Text>
              </View>
            ))}
          </View>

          {/* 4 */}
          <Text style={styles.h2}>4. {content.topics[3]}</Text>

          <Text style={styles.body}>
            {content.section4Body1}
          </Text>

          <Text style={styles.body}>
            {content.section4Body2}
          </Text>

          <View style={styles.highlightBox}>
            <MaterialDesignIcons
              name="calendar-heart"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.highlightCopy}>
              <Text style={styles.highlightTitle}>
                {content.highlightTitle}
              </Text>

              <Text style={styles.highlightText}>
                {content.highlightText}
              </Text>
            </View>
          </View>

          {/* 5 */}
          <Text style={styles.h2}>5. {content.topics[4]}</Text>

          <Text style={styles.body}>
            {content.section5Body}
          </Text>

          <View style={styles.consultCard}>
            {CYCLE_PHASE_ICONS.map((icon, index) => (
              <View key={icon} style={styles.consultRow}>
                <View style={styles.consultIcon}>
                  <MaterialDesignIcons
                    name={icon as never}
                    size={18}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.consultText}>{content.cyclePhases[index]}</Text>
              </View>
            ))}
          </View>

          <View style={styles.neutralBox}>
            <MaterialDesignIcons
              name="information-outline"
              size={22}
              color={theme.colors.textMuted}
            />

            <Text style={styles.neutralText}>
              {content.neutral2Text}
            </Text>
          </View>

          {/* 6 */}
          <Text style={styles.h2}>6. {content.topics[5]}</Text>

          <Text style={styles.body}>
            {content.section6Body}
          </Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.tip2Title}</Text>
              <Text style={styles.tipText}>
                {content.tip2Text}
              </Text>
            </View>
          </View>

          {/* 7 */}
          <Text style={styles.h2}>7. {content.topics[6]}</Text>

          <Text style={styles.body}>
            {content.section7Intro}
          </Text>

          <View style={styles.checkList}>
            {content.mistakes.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="close-circle-outline"
                  size={18}
                  color={theme.colors.warning}
                />

                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* 8 */}
          <Text style={styles.h2}>8. {content.topics[7]}</Text>

          <Text style={styles.body}>
            {content.section8Intro}
          </Text>

          <View style={styles.consultCard}>
            {CONSULT_ICONS.map((icon, index) => (
              <View key={icon} style={styles.consultRow}>
                <View style={styles.consultIcon}>
                  <MaterialDesignIcons
                    name={icon as never}
                    size={18}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.consultText}>{content.consultReasons[index]}</Text>
              </View>
            ))}
          </View>

          {/* 9 */}
          <Text style={styles.h2}>9. {content.topics[8]}</Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.tip3Title}</Text>
              <Text style={styles.tipText}>
                {content.tip3Text}
              </Text>
            </View>
          </View>

          {/* FINAL NOTE */}
          <View style={styles.finalNote}>
            <MaterialDesignIcons
              name="shield-check-outline"
              size={23}
              color={theme.colors.textMuted}
            />

            <View style={styles.finalNoteCopy}>
              <Text style={styles.finalNoteTitle}>
                {content.finalNoteTitle}
              </Text>

              <Text style={styles.finalNoteText}>
                {content.finalNoteText}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={8} scrollRef={scrollRef} />
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  screen: {flex: 1, backgroundColor: theme.colors.background},
  scroll: {paddingBottom: 30},
  heroWrap: {height: 245, backgroundColor: theme.colors.surfaceSecondary},
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
    backgroundColor: withAlpha(theme.colors.surface, 0.90),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pressed: {opacity: 0.74},
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
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  title: {
    marginTop: 12,
    fontFamily: 'serif',
    fontSize: 27,
    lineHeight: 32,
    color: theme.colors.text,
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
  metaDivider: {width: 1, height: 20, backgroundColor: theme.colors.border},
  meta: {fontSize: 9.5, color: theme.colors.textMuted},
  intro: {
    marginTop: 17,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.text,
    fontWeight: '600',
  },
  introSecondary: {
    marginTop: 9,
    fontSize: 13.5,
    lineHeight: 20.5,
    color: theme.colors.textMuted,
  },
  contents: {
    marginTop: 20,
    padding: 15,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  contentsTitle: {marginBottom: 7, fontSize: 15, color: theme.colors.text, fontWeight: '800'},
  contentRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contentLeft: {flex: 1, flexDirection: 'row', alignItems: 'center'},
  contentNumber: {width: 25, color: theme.colors.primary, fontSize: 11.5, fontWeight: '800'},
  contentText: {flex: 1, fontSize: 12.3, lineHeight: 17, color: theme.colors.text},
  h2: {
    marginTop: 25,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: theme.colors.text,
    fontWeight: '700',
  },
  body: {marginTop: 9, fontSize: 14, lineHeight: 21.5, color: theme.colors.text},
  tip: {
    marginTop: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
  },
  tipCopy: {flex: 1, marginLeft: 11},
  tipTitle: {fontSize: 13, color: theme.colors.text, fontWeight: '800'},
  tipText: {marginTop: 4, fontSize: 11.5, lineHeight: 17, color: theme.colors.textSecondary},
  checkList: {
    marginTop: 13,
    padding: 13,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  checkText: {flex: 1, color: theme.colors.text, fontSize: 12, lineHeight: 17},
  neutralBox: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  neutralText: {flex: 1, fontSize: 11.5, lineHeight: 17, color: theme.colors.textSecondary},
  daily: {marginTop: 13, flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  dailyItem: {
    width: '48.7%',
    minHeight: 108,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: theme.colors.primarySoft,
  },
  dailyText: {
    marginTop: 7,
    fontSize: 11,
    lineHeight: 16,
    color: theme.colors.text,
    textAlign: 'center',
  },
  highlightBox: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 13,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  highlightCopy: {flex: 1, marginLeft: 10},
  highlightTitle: {color: theme.colors.text, fontSize: 13, fontWeight: '800'},
  highlightText: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 11.5,
    lineHeight: 17,
  },
  consultCard: {
    marginTop: 14,
    padding: 13,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    backgroundColor: theme.colors.primarySoft,
  },
  consultText: {
    flex: 1,
    marginLeft: 10,
    color: theme.colors.text,
    fontSize: 12,
    lineHeight: 17,
  },
  finalNote: {
    marginTop: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  finalNoteCopy: {flex: 1, marginLeft: 10},
  finalNoteTitle: {color: theme.colors.text, fontSize: 13, fontWeight: '800'},
  finalNoteText: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 16.5,
  },
  });
}
