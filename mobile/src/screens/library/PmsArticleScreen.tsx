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

import ReadingControls from '../../components/articles/ReadingControls';
import type {RootStackParamList} from '../../navigation/AppNavigator';
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

const ID = 'symptoms-reconnaitre';

const HERO = require('../../assets/images/library/spm-hero.png');
const WOMAN = require('../../assets/images/library/spm-woman.png');
const CAUSES = require('../../assets/images/library/spm-causes.png');
const CONSULT = require('../../assets/images/library/spm-consult.png');

// Icons/images stay language-neutral — only TEXT moves into the bilingual
// CONTENT object below, keyed by index to stay aligned with these.
const SYMPTOM_ICONS = [
  'weather-cloudy',
  'human-female',
  'cupcake',
  'weather-night',
] as const;

const TIP_IMAGES = [
  require('../../assets/images/library/spm-water.png'),
  require('../../assets/images/library/spm-food.png'),
  require('../../assets/images/library/spm-yoga.png'),
  require('../../assets/images/library/spm-stress.png'),
  require('../../assets/images/library/spm-sleep.png'),
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'CYCLE & BIEN-ÊTRE',
    title: 'Syndrome prémenstruel (SPM) :\nmieux le comprendre',
    metaDuration: '4 min de lecture',
    metaValidated: 'Contenu vérifié',
    intro:
      'Le SPM touche jusqu’à 8 femmes sur 10. Fatigue, irritabilité, ballonnements… Comprendre ses causes et adopter les bons réflexes peut grandement améliorer cette période.',
    contentsTitle: 'Dans cet article',
    contents: [
      'Qu’est-ce que le SPM ?',
      'Symptômes courants',
      'Causes possibles',
      'Conseils pour mieux le vivre',
      'Quand consulter ?',
    ],
    section1Body:
      'Le syndrome prémenstruel regroupe des symptômes physiques et émotionnels qui apparaissent généralement 5 à 10 jours avant les règles et disparaissent au début du cycle menstruel.',
    visual1Title: 'Une période liée au cycle',
    visual1Text:
      'Les symptômes apparaissent avant les règles puis diminuent généralement avec leur arrivée.',
    tip1Title: 'Bon à savoir',
    tip1Text:
      'L’intensité et le type de symptômes peuvent être très différents d’une femme à l’autre et d’un cycle à l’autre.',
    symptoms: [
      {title: 'Émotions', text: 'Irritabilité, anxiété, tristesse, sautes d’humeur'},
      {title: 'Physiques', text: 'Ballonnements, douleurs, fatigue, maux de tête'},
      {title: 'Comportement', text: 'Envie de sucre, changements d’appétit, fatigue'},
      {title: 'Sommeil', text: 'Difficultés à dormir ou sommeil moins réparateur'},
    ],
    section3Body:
      'Les variations hormonales, en particulier de la progestérone et des œstrogènes, affectent les neurotransmetteurs du cerveau (sérotonine, dopamine), ce qui peut expliquer les symptômes émotionnels et physiques du SPM.',
    tip2Title: 'Les hormones jouent un rôle clé',
    tip2Text:
      'Les variations hormonales peuvent influencer l’humeur, l’énergie, le sommeil et certaines sensations physiques.',
    tips: [
      {title: 'Hydrate-toi', text: 'Boire suffisamment d’eau aide à réduire les ballonnements.'},
      {title: 'Adopte une alimentation équilibrée', text: 'Privilégie les aliments riches en magnésium, oméga-3 et vitamines B.'},
      {title: 'Bouge régulièrement', text: 'L’activité physique libère des endorphines et réduit le stress.'},
      {title: 'Gère ton stress', text: 'Respiration, méditation, journal intime… Trouve ce qui te fait du bien.'},
      {title: 'Dors suffisamment', text: 'Un sommeil de qualité favorise l’équilibre hormonal.'},
    ],
    consultTitle: 'Quand demander un avis médical ?',
    consultText:
      'Si les symptômes sont très intenses et impactent ta vie quotidienne, il peut s’agir de trouble dysphorique prémenstruel (TDPM). N’hésite pas à consulter un·e professionnel·le de santé.',
    shareMessage: 'Syndrome prémenstruel (SPM) : mieux le comprendre — AWA',
  },
  en: {
    badge: 'CYCLE & WELLBEING',
    title: 'Premenstrual syndrome (PMS):\nunderstanding it better',
    metaDuration: '4 min read',
    metaValidated: 'Reviewed content',
    intro:
      'PMS affects up to 8 in 10 women. Fatigue, irritability, bloating… Understanding its causes and adopting the right habits can greatly improve this time of the month.',
    contentsTitle: 'In this article',
    contents: [
      'What is PMS?',
      'Common symptoms',
      'Possible causes',
      'Tips to feel better',
      'When to see a doctor?',
    ],
    section1Body:
      'Premenstrual syndrome brings together physical and emotional symptoms that usually appear 5 to 10 days before your period and go away at the start of the menstrual cycle.',
    visual1Title: 'A phase tied to your cycle',
    visual1Text:
      'Symptoms appear before your period and usually ease once it starts.',
    tip1Title: 'Good to know',
    tip1Text:
      'The intensity and type of symptoms can vary widely from one woman to another, and from one cycle to the next.',
    symptoms: [
      {title: 'Emotions', text: 'Irritability, anxiety, sadness, mood swings'},
      {title: 'Physical', text: 'Bloating, pain, fatigue, headaches'},
      {title: 'Behavior', text: 'Sugar cravings, appetite changes, fatigue'},
      {title: 'Sleep', text: 'Trouble sleeping or less restful sleep'},
    ],
    section3Body:
      'Hormonal fluctuations, particularly in progesterone and estrogen, affect brain neurotransmitters (serotonin, dopamine), which may explain the emotional and physical symptoms of PMS.',
    tip2Title: 'Hormones play a key role',
    tip2Text:
      'Hormonal fluctuations can affect mood, energy, sleep, and certain physical sensations.',
    tips: [
      {title: 'Stay hydrated', text: 'Drinking enough water helps reduce bloating.'},
      {title: 'Eat a balanced diet', text: 'Favor foods rich in magnesium, omega-3s, and B vitamins.'},
      {title: 'Stay active', text: 'Physical activity releases endorphins and reduces stress.'},
      {title: 'Manage your stress', text: 'Breathing exercises, meditation, journaling… Find what works for you.'},
      {title: 'Get enough sleep', text: 'Quality sleep supports hormonal balance.'},
    ],
    consultTitle: 'When should you seek medical advice?',
    consultText:
      'If symptoms are very intense and affect your daily life, it may be premenstrual dysphoric disorder (PMDD). Don’t hesitate to consult a healthcare professional.',
    shareMessage: 'Premenstrual syndrome (PMS): understanding it better — AWA',
  },
} as const;

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ArticleReader'
>;

export default function PmsArticleScreen({
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
    let active = true;

    loadLibraryState().then(() => {
      if (active) {
        setSaved(isArticleBookmarked(ID));
      }
    });

    return () => {
      active = false;
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
        showsVerticalScrollIndicator={false}
        onScroll={event =>
          saveScrollPosition(
            ID,
            event.nativeEvent.contentOffset.y,
          )
        }
        scrollEventThrottle={200}
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
          <Image
            source={HERO}
            resizeMode="cover"
            style={styles.hero}
          />

          <View
            style={[
              styles.top,
              {
                paddingTop: getTopPadding(insets.top, true),
              },
            ]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('library.reader.back')}
              onPress={() => navigation.goBack()}
              style={({pressed}) => [
                styles.circle,
                pressed && styles.pressed,
              ]}>
              <MaterialDesignIcons
                name="chevron-left"
                size={23}
                color={theme.colors.text}
              />
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
                  name={
                    saved
                      ? 'bookmark'
                      : 'bookmark-outline'
                  }
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
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {content.badge}
            </Text>
          </View>

          <Text style={styles.title}>
            {content.title}
          </Text>

          <View style={styles.metas}>
            {[
              ['clock-outline', content.metaDuration],
              ['check-decagram-outline', content.metaValidated],
            ].map(([icon, text], index) => (
              <React.Fragment key={text}>
                {index > 0 ? (
                  <View style={styles.metaDivider} />
                ) : null}

                <View style={styles.metaItem}>
                  <MaterialDesignIcons
                    name={icon as never}
                    size={17}
                    color={theme.colors.textMuted}
                  />

                  <Text style={styles.meta}>
                    {text}
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          <Text style={styles.intro}>
            {content.intro}
          </Text>

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>
              {content.contentsTitle}
            </Text>

            {content.contents.map((item, index) => (
              <View
                key={item}
                style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <Text style={styles.contentNumber}>
                    {index + 1}.
                  </Text>

                  <Text style={styles.contentText}>
                    {item}
                  </Text>
                </View>

                <MaterialDesignIcons
                  name="chevron-right"
                  size={17}
                  color={theme.colors.primary}
                />
              </View>
            ))}
          </View>

          <Text style={styles.h2}>
            1. {content.contents[0]}
          </Text>

          <Text style={styles.body}>
            {content.section1Body}
          </Text>

          <View style={styles.visualCard}>
            <Image
              source={WOMAN}
              resizeMode="cover"
              style={styles.visualImage}
            />

            <View style={styles.visualCopy}>
              <Text style={styles.visualTitle}>
                {content.visual1Title}
              </Text>

              <Text style={styles.visualText}>
                {content.visual1Text}
              </Text>
            </View>
          </View>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                {content.tip1Title}
              </Text>

              <Text style={styles.tipText}>
                {content.tip1Text}
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>
            2. {content.contents[1]}
          </Text>

          <View style={styles.symptomGrid}>
            {SYMPTOM_ICONS.map((icon, index) => {
              const symptom = content.symptoms[index];
              return (
                <View
                  key={symptom.title}
                  style={styles.symptomItem}>
                  <MaterialDesignIcons
                    name={icon as never}
                    size={25}
                    color={theme.colors.primary}
                  />

                  <Text style={styles.symptomTitle}>
                    {symptom.title}
                  </Text>

                  <Text style={styles.symptomText}>
                    {symptom.text}
                  </Text>
                </View>
              );
            })}
          </View>

          <Text style={styles.h2}>
            3. {content.contents[2]}
          </Text>

          <Image
            source={CAUSES}
            resizeMode="cover"
            style={styles.wideImage}
          />

          <Text style={styles.body}>
            {content.section3Body}
          </Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="molecule"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                {content.tip2Title}
              </Text>

              <Text style={styles.tipText}>
                {content.tip2Text}
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>
            4. {content.contents[3]}
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tips}>
            {TIP_IMAGES.map((image, index) => {
              const tip = content.tips[index];
              return (
                <View
                  key={tip.title}
                  style={styles.tipCard}>
                  <Image
                    source={image}
                    resizeMode="cover"
                    style={styles.tipImage}
                  />

                  <Text style={styles.tipCardTitle}>
                    {tip.title}
                  </Text>

                  <Text style={styles.tipCardText}>
                    {tip.text}
                  </Text>
                </View>
              );
            })}
          </ScrollView>

          <Text style={styles.h2}>
            5. {content.contents[4]}
          </Text>

          <View style={styles.consultCard}>
            <Image
              source={CONSULT}
              resizeMode="cover"
              style={styles.consultImage}
            />

            <View style={styles.consultContent}>
              <View style={styles.consultTitleRow}>
                <View style={styles.consultIcon}>
                  <MaterialDesignIcons
                    name="heart-pulse"
                    size={21}
                    color={theme.colors.warning}
                  />
                </View>

                <Text style={styles.consultTitle}>
                  {content.consultTitle}
                </Text>
              </View>

              <Text style={styles.consultText}>
                {content.consultText}
              </Text>
            </View>
          </View>

        </View>
      </ScrollView>

      <ReadingControls
        articleId={ID}
        durationMinutes={4}
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
    color: theme.colors.text,
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
    minHeight: 38,
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
    marginTop: 24,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: theme.colors.text,
    fontWeight: '700',
  },

  body: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.text,
  },

  visualCard: {
    marginTop: 15,
    minHeight: 98,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },

  visualImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },

  visualCopy: {
    flex: 1,
    marginLeft: 12,
  },

  visualTitle: {
    color: theme.colors.text,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
  },

  visualText: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },

  tip: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
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
    marginTop: 3,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  symptomGrid: {
    marginTop: 13,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  symptomItem: {
    width: '48.7%',
    minHeight: 126,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.primarySoft,
  },

  symptomTitle: {
    marginTop: 7,
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },

  symptomText: {
    marginTop: 5,
    color: theme.colors.textSecondary,
    fontSize: 10.5,
    lineHeight: 15,
    textAlign: 'center',
  },

  wideImage: {
    width: '100%',
    height: 120,
    marginTop: 14,
    borderRadius: 12,
  },

  tips: {
    gap: 8,
    paddingTop: 13,
    paddingBottom: 3,
  },

  tipCard: {
    width: 142,
    minHeight: 215,
    padding: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },

  tipImage: {
    width: '100%',
    height: 82,
    borderRadius: 9,
  },

  tipCardTitle: {
    marginTop: 8,
    color: theme.colors.text,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },

  tipCardText: {
    marginTop: 5,
    color: theme.colors.textSecondary,
    fontSize: 10.5,
    lineHeight: 15,
  },

  consultCard: {
    marginTop: 14,
    overflow: 'hidden',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },

  consultImage: {
    width: '100%',
    height: 135,
  },

  consultContent: {
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 15,
  },

  consultTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  consultIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(theme.colors.warning, 0.18),
  },

  consultTitle: {
    flex: 1,
    marginLeft: 10,
    color: theme.colors.text,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
  },

  consultText: {
    marginTop: 10,
    color: theme.colors.textSecondary,
    fontSize: 11.5,
    lineHeight: 18,
  },

  });
}
