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

const ID = 'nifas-aspects-medicaux';

const HERO = require('../../assets/images/library/featured-spm.png');

/* -------------------------------------------------------------------------- */
/* LANGUAGE-NEUTRAL DATA (icons/numbers only — text lives in CONTENT below) */
/* -------------------------------------------------------------------------- */

const NIFAS_STAGE_META = [
  {icon: 'hospital-box-outline', number: '01'},
  {icon: 'water-outline', number: '02'},
  {icon: 'chart-timeline-variant', number: '03'},
  {icon: 'calendar-check-outline', number: '04'},
] as const;

// Note: the three lochia-evolution stages below are differentiated purely by
// their text labels/periods ("Rouges" → "Rosées/brunâtres" → "Blanchâtres"),
// matching the sibling LochiaArticleScreen.tsx timeline exactly — the icons
// all use the same theme accent color rather than a per-stage swatch (an
// earlier per-item tint here was decorative, not a genuine medical color
// legend: it used a green icon for the "blanchâtre"/whitish stage, which
// does not represent that color at all).
const LOCHIA_EVOLUTION_ICONS = [
  'numeric-1-circle-outline',
  'numeric-2-circle-outline',
  'numeric-3-circle-outline',
] as const;

const CARE_TIP_ICONS = [
  'shower',
  'bed-outline',
  'cup-water',
  'food-apple-outline',
] as const;

/* -------------------------------------------------------------------------- */
/* CONTENT — PHASE 7L bilingual editorial content. Article identity (ID,
   images, bookmark/progress keys, JSX structure) is untouched; only this
   object changes per language. The French text below is byte-identical to
   the original — never retyped, only moved into the `fr` key — so the app
   remains fully bilingual rather than having French replaced by English.
   "Nifas" is an Islamic jurisprudence term and is kept untranslated in both
   languages, exactly as the rest of the app does. */
/* -------------------------------------------------------------------------- */

const CONTENT = {
  fr: {
    badge: 'POST-PARTUM • NIFAS',
    title: 'Le nifas :\naspects médicaux',
    metaDuration: '5 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu informatif',
    intro:
      'Après la naissance, le corps traverse une période de récupération progressive. Comprendre les pertes post-accouchement, leur évolution et les signes qui doivent attirer l’attention peut aider à vivre cette période avec davantage de repères.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Comprendre le terme nifas',
      'Le schéma médical après la naissance',
      'L’évolution des lochies',
      'Prendre soin de soi',
      'Quand demander conseil ?',
      'À retenir',
    ],
    h2Section1: '1. Comprendre le terme « nifas »',
    body1a:
      'Le terme « nifas » appartient au vocabulaire religieux et désigne la période liée aux saignements qui suivent l’accouchement dans les règles de jurisprudence islamique.',
    body1b:
      'Sur le plan médical, les pertes observées après l’accouchement sont appelées « lochies ». Ces deux notions peuvent être étudiées séparément : l’une relève d’un cadre religieux, l’autre décrit un phénomène physiologique.',
    distinction: {
      nifasTitle: 'Nifas',
      nifasText: 'Notion relevant du cadre religieux après l’accouchement.',
      lochiaTitle: 'Lochies',
      lochiaText: 'Terme médical utilisé pour les pertes post-accouchement.',
    },
    h2Section2: '2. Le schéma médical après la naissance',
    body2:
      'La récupération post-partum se fait progressivement. Les pertes post-accouchement évoluent généralement avec le temps tandis que l’utérus poursuit son retour vers son état habituel.',
    schemaTitle: 'Évolution post-accouchement',
    schemaSubtitle: 'Repère médical simplifié',
    stages: [
      {
        title: 'Après l’accouchement',
        subtitle: 'Début du post-partum',
        text: 'Le corps commence progressivement sa récupération après la naissance.',
      },
      {
        title: 'Les lochies',
        subtitle: 'Pertes post-accouchement',
        text: 'Les pertes évoluent progressivement en quantité et en couleur.',
      },
      {
        title: 'Diminution progressive',
        subtitle: 'Sur plusieurs semaines',
        text: 'Les pertes diminuent généralement au fil du temps.',
      },
      {
        title: 'Retour progressif',
        subtitle: 'Vers le cycle habituel',
        text: 'Le cycle menstruel peut ensuite reprendre progressivement.',
      },
    ],
    h2Section3: '3. L’évolution des lochies',
    body3:
      'Les lochies changent généralement progressivement de couleur et diminuent en quantité. Leur évolution peut cependant varier d’une personne à l’autre.',
    lochiaEvolution: [
      {
        title: 'Lochies rouges',
        period: 'Premiers jours',
        text: 'Les pertes sont généralement rouges et peuvent être plus abondantes au début.',
      },
      {
        title: 'Lochies rosées / brunâtres',
        period: 'Après quelques jours',
        text: 'La couleur peut devenir plus claire ou brunâtre tandis que le flux diminue.',
      },
      {
        title: 'Lochies blanchâtres',
        period: 'Semaines suivantes',
        text: 'Les pertes deviennent progressivement plus claires et moins abondantes.',
      },
    ],
    infoTitle: 'À retenir',
    infoText:
      'La couleur et la quantité des lochies peuvent évoluer progressivement. L’évolution exacte n’est pas identique chez toutes les personnes.',
    h2Section4: '4. Prendre soin de soi',
    body4:
      'Pendant cette période, quelques habitudes simples peuvent contribuer au confort et accompagner la récupération du corps.',
    careTips: [
      {title: 'Hygiène douce', text: 'Garde une hygiène quotidienne simple et confortable.'},
      {title: 'Repos', text: 'Accorde à ton corps du temps pour récupérer.'},
      {title: 'Hydratation', text: 'Pense à boire régulièrement selon tes besoins.'},
      {title: 'Alimentation', text: 'Une alimentation variée accompagne la récupération.'},
    ],
    h2Section5: '5. Quand demander conseil ?',
    body5:
      'Certaines situations nécessitent de demander rapidement conseil à un professionnel de santé, notamment lorsqu’un changement paraît important, soudain ou inhabituel.',
    warningTitle: 'Signes à ne pas ignorer',
    warningSubtitle: 'Demande un avis professionnel si nécessaire',
    warningSigns: [
      'Une odeur forte ou inhabituelle des pertes',
      'De la fièvre ou un état général qui se dégrade',
      'Un saignement qui devient soudainement très abondant',
      'Une douleur importante, persistante ou inhabituelle',
      'Un symptôme nouveau qui t’inquiète',
    ],
    tipTitle: 'Bon à savoir',
    tipText:
      'Chaque récupération post-partum est différente. Les informations de cet article sont destinées à donner des repères généraux et ne remplacent pas une consultation médicale.',
    summaryHeading: 'À retenir',
    summary: [
      'Le nifas est un terme utilisé dans le cadre religieux après l’accouchement.',
      'Sur le plan médical, les pertes post-accouchement sont appelées lochies.',
      'Les lochies évoluent progressivement en couleur et en quantité.',
      'Le repos, l’hygiène douce et une bonne hydratation accompagnent la récupération.',
      'Un changement inhabituel ou préoccupant mérite un avis professionnel.',
    ],
    disclaimerText:
      'Contenu informatif. Les informations médicales présentées ici sont générales et ne remplacent pas l’avis d’un professionnel de santé. Pour les questions religieuses spécifiques, il est recommandé de se référer à une source religieuse qualifiée.',
    shareMessage: 'Le nifas : aspects médicaux — AWA',
  },
  en: {
    badge: 'POSTPARTUM • NIFAS',
    title: 'Nifas:\nmedical aspects',
    metaDuration: '5 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Informational content',
    intro:
      'After giving birth, the body goes through a gradual recovery period. Understanding postpartum bleeding, how it evolves, and the signs that call for attention can help you feel more informed during this time.',
    contentsTitle: 'In this article',
    topics: [
      'Understanding the term Nifas',
      'The medical pattern after birth',
      'How lochia evolves',
      'Taking care of yourself',
      'When to seek advice',
      'Key takeaways',
    ],
    h2Section1: '1. Understanding the term "Nifas"',
    body1a:
      'The term "Nifas" belongs to religious vocabulary and refers to the period associated with the bleeding that follows childbirth within the rules of Islamic jurisprudence.',
    body1b:
      'Medically, the bleeding observed after childbirth is called "lochia." These two notions can be considered separately: one belongs to a religious framework, the other describes a physiological phenomenon.',
    distinction: {
      nifasTitle: 'Nifas',
      nifasText: 'A notion belonging to the religious framework after childbirth.',
      lochiaTitle: 'Lochia',
      lochiaText: 'Medical term used for postpartum bleeding.',
    },
    h2Section2: '2. The medical pattern after birth',
    body2:
      'Postpartum recovery happens gradually. Postpartum bleeding generally changes over time as the uterus continues returning to its usual state.',
    schemaTitle: 'Postpartum progression',
    schemaSubtitle: 'Simplified medical reference',
    stages: [
      {
        title: 'After childbirth',
        subtitle: 'Start of the postpartum period',
        text: 'The body gradually begins its recovery after birth.',
      },
      {
        title: 'Lochia',
        subtitle: 'Postpartum bleeding',
        text: 'The bleeding gradually changes in amount and color.',
      },
      {
        title: 'Gradual decrease',
        subtitle: 'Over several weeks',
        text: 'The bleeding generally decreases over time.',
      },
      {
        title: 'Gradual return',
        subtitle: 'Toward the usual cycle',
        text: 'The menstrual cycle can then gradually resume.',
      },
    ],
    h2Section3: '3. How lochia evolves',
    body3:
      'Lochia generally changes color gradually and decreases in amount. However, this progression can vary from person to person.',
    lochiaEvolution: [
      {
        title: 'Red lochia',
        period: 'First days',
        text: 'The bleeding is usually red and can be heavier at the start.',
      },
      {
        title: 'Pink / brownish lochia',
        period: 'After a few days',
        text: 'The color can become lighter or brownish as the flow decreases.',
      },
      {
        title: 'Whitish lochia',
        period: 'Following weeks',
        text: 'The bleeding gradually becomes lighter and less abundant.',
      },
    ],
    infoTitle: 'Key takeaways',
    infoText:
      'The color and amount of lochia can change gradually. The exact progression isn’t the same for everyone.',
    h2Section4: '4. Taking care of yourself',
    body4:
      'During this period, a few simple habits can help with comfort and support the body’s recovery.',
    careTips: [
      {title: 'Gentle hygiene', text: 'Keep a simple, comfortable daily hygiene routine.'},
      {title: 'Rest', text: 'Give your body time to recover.'},
      {title: 'Hydration', text: 'Remember to drink regularly according to your needs.'},
      {title: 'Nutrition', text: 'A varied diet supports recovery.'},
    ],
    h2Section5: '5. When to seek advice',
    body5:
      'Certain situations call for prompt advice from a healthcare professional, particularly when a change seems significant, sudden, or unusual.',
    warningTitle: 'Signs not to ignore',
    warningSubtitle: 'Seek professional advice if needed',
    warningSigns: [
      'A strong or unusual odor in the bleeding',
      'Fever or a worsening general condition',
      'Bleeding that suddenly becomes very heavy',
      'Significant, persistent, or unusual pain',
      'A new symptom that worries you',
    ],
    tipTitle: 'Good to know',
    tipText:
      'Every postpartum recovery is different. The information in this article is meant to provide general guidance and doesn’t replace a medical consultation.',
    summaryHeading: 'Key takeaways',
    summary: [
      'Nifas is a term used in the religious context after childbirth.',
      'Medically, postpartum bleeding is called lochia.',
      'Lochia gradually changes in color and amount.',
      'Rest, gentle hygiene, and good hydration support recovery.',
      'An unusual or concerning change deserves professional advice.',
    ],
    disclaimerText:
      'Informational content. The medical information presented here is general and doesn’t replace the advice of a healthcare professional. For specific religious questions, it’s recommended to refer to a qualified religious source.',
    shareMessage: 'Nifas: medical aspects — AWA',
  },
} as const;

/* -------------------------------------------------------------------------- */
/* TYPES */
/* -------------------------------------------------------------------------- */

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ArticleReader'
>;

/* -------------------------------------------------------------------------- */
/* SCREEN */
/* -------------------------------------------------------------------------- */

export default function NifasMedicalArticleScreen({
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
          saveScrollPosition(
            ID,
            event.nativeEvent.contentOffset.y,
          )
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
        ]}
      >
        {/* ---------------------------------------------------------------- */}
        {/* HERO */}
        {/* ---------------------------------------------------------------- */}

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
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('library.reader.back')}
              onPress={() => navigation.goBack()}
              style={({pressed}) => [
                styles.circle,
                pressed && styles.pressed,
              ]}
            >
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
                ]}
              >
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
                ]}
              >
                <MaterialDesignIcons
                  name="share-variant-outline"
                  size={20}
                  color={theme.colors.primary}
                />
              </Pressable>
            </View>
          </View>
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* ARTICLE */}
        {/* ---------------------------------------------------------------- */}

        <View style={styles.article}>
          {/* Badge */}

          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {content.badge}
            </Text>
          </View>

          {/* Title */}

          <Text style={styles.title}>
            {content.title}
          </Text>

          {/* Metadata */}

          <View style={styles.metas}>
            {[
              ['clock-outline', content.metaDuration],
              [
                'book-open-page-variant-outline',
                content.metaType,
              ],
              ['chart-bar', content.metaLevel],
              [
                'shield-check-outline',
                content.metaValidated,
              ],
            ].map(([icon, text], index) => (
              <React.Fragment key={text}>
                {index > 0 ? (
                  <View style={styles.metaDivider} />
                ) : null}

                <View style={styles.metaItem}>
                  <MaterialDesignIcons
                    name={icon as never}
                    color={theme.colors.textMuted}
                    size={16}
                  />

                  <Text style={styles.meta}>
                    {text}
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          {/* Introduction */}

          <Text style={styles.intro}>
            {content.intro}
          </Text>

          {/* ---------------------------------------------------------------- */}
          {/* CONTENTS */}
          {/* ---------------------------------------------------------------- */}

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>
              {content.contentsTitle}
            </Text>

            {content.topics.map((item, index) => (
              <View
                key={item}
                style={styles.contentRow}
              >
                <View style={styles.contentLeft}>
                  <Text style={styles.contentNumber}>
                    {String(index + 1).padStart(2, '0')}
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

          {/* ---------------------------------------------------------------- */}
          {/* SECTION 1 */}
          {/* ---------------------------------------------------------------- */}

          <Text style={styles.h2}>
            {content.h2Section1}
          </Text>

          <Text style={styles.body}>
            {content.body1a}
          </Text>

          <Text style={styles.body}>
            {content.body1b}
          </Text>

          {/* Distinction card */}

          <View style={styles.distinctionCard}>
            <View style={styles.distinctionItem}>
              <View style={styles.distinctionIcon}>
                <MaterialDesignIcons
                  name="book-open-variant"
                  size={21}
                  color={theme.colors.primary}
                />
              </View>

              <View style={styles.distinctionCopy}>
                <Text style={styles.distinctionTitle}>
                  {content.distinction.nifasTitle}
                </Text>

                <Text style={styles.distinctionText}>
                  {content.distinction.nifasText}
                </Text>
              </View>
            </View>

            <View style={styles.distinctionDivider} />

            <View style={styles.distinctionItem}>
              <View style={styles.distinctionIcon}>
                <MaterialDesignIcons
                  name="medical-bag"
                  size={21}
                  color={theme.colors.primary}
                />
              </View>

              <View style={styles.distinctionCopy}>
                <Text style={styles.distinctionTitle}>
                  {content.distinction.lochiaTitle}
                </Text>

                <Text style={styles.distinctionText}>
                  {content.distinction.lochiaText}
                </Text>
              </View>
            </View>
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* SECTION 2 */}
          {/* ---------------------------------------------------------------- */}

          <Text style={styles.h2}>
            {content.h2Section2}
          </Text>

          <Text style={styles.body}>
            {content.body2}
          </Text>

          {/* SCHEMA */}

          <View style={styles.schemaCard}>
            <View style={styles.schemaHeader}>
              <View style={styles.schemaHeaderIcon}>
                <MaterialDesignIcons
                  name="chart-timeline-variant"
                  size={22}
                  color={theme.colors.primary}
                />
              </View>

              <View style={styles.schemaHeaderCopy}>
                <Text style={styles.schemaTitle}>
                  {content.schemaTitle}
                </Text>

                <Text style={styles.schemaSubtitle}>
                  {content.schemaSubtitle}
                </Text>
              </View>
            </View>

            <View style={styles.schemaTimeline}>
              {content.stages.map((stage, index) => (
                <View
                  key={stage.title}
                  style={styles.schemaStage}
                >
                  <View style={styles.schemaRail}>
                    <View style={styles.schemaNode}>
                      <Text
                        style={styles.schemaNodeNumber}
                      >
                        {NIFAS_STAGE_META[index].number}
                      </Text>
                    </View>

                    {index <
                    content.stages.length - 1 ? (
                      <View
                        style={styles.schemaConnector}
                      />
                    ) : null}
                  </View>

                  <View style={styles.schemaContent}>
                    <View
                      style={styles.schemaStageTop}
                    >
                      <View
                        style={styles.schemaStageIcon}
                      >
                        <MaterialDesignIcons
                          name={NIFAS_STAGE_META[index].icon as never}
                          size={19}
                          color={theme.colors.primary}
                        />
                      </View>

                      <View
                        style={styles.schemaStageHeading}
                      >
                        <Text
                          style={
                            styles.schemaStageTitle
                          }
                        >
                          {stage.title}
                        </Text>

                        <Text
                          style={
                            styles.schemaStageSubtitle
                          }
                        >
                          {stage.subtitle}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={styles.schemaStageText}
                    >
                      {stage.text}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* SECTION 3 */}
          {/* ---------------------------------------------------------------- */}

          <Text style={styles.h2}>
            {content.h2Section3}
          </Text>

          <Text style={styles.body}>
            {content.body3}
          </Text>

          <View style={styles.evolutionCard}>
            {content.lochiaEvolution.map((item, index) => (
              <View
                key={item.title}
                style={styles.evolutionItem}
              >
                <View style={styles.evolutionLeft}>
                  <View style={styles.evolutionIcon}>
                    <MaterialDesignIcons
                      name={LOCHIA_EVOLUTION_ICONS[index] as never}
                      size={21}
                      color={theme.colors.primary}
                    />
                  </View>

                  {index <
                  content.lochiaEvolution.length - 1 ? (
                    <View
                      style={
                        styles.evolutionConnector
                      }
                    />
                  ) : null}
                </View>

                <View style={styles.evolutionCopy}>
                  <Text style={styles.evolutionTitle}>
                    {item.title}
                  </Text>

                  <Text
                    style={styles.evolutionPeriod}
                  >
                    {item.period}
                  </Text>

                  <Text style={styles.evolutionText}>
                    {item.text}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Info */}

          <View style={styles.infoCard}>
            <MaterialDesignIcons
              name="information-outline"
              size={22}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>
                {content.infoTitle}
              </Text>

              <Text style={styles.infoText}>
                {content.infoText}
              </Text>
            </View>
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* SECTION 4 */}
          {/* ---------------------------------------------------------------- */}

          <Text style={styles.h2}>
            {content.h2Section4}
          </Text>

          <Text style={styles.body}>
            {content.body4}
          </Text>

          <View style={styles.careGrid}>
            {content.careTips.map((item, index) => (
              <View
                key={item.title}
                style={styles.careCard}
              >
                <View style={styles.careIcon}>
                  <MaterialDesignIcons
                    name={CARE_TIP_ICONS[index] as never}
                    size={22}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.careTitle}>
                  {item.title}
                </Text>

                <Text style={styles.careText}>
                  {item.text}
                </Text>
              </View>
            ))}
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* SECTION 5 */}
          {/* ---------------------------------------------------------------- */}

          <Text style={styles.h2}>
            {content.h2Section5}
          </Text>

          <Text style={styles.body}>
            {content.body5}
          </Text>

          <View style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <View style={styles.warningHeaderIcon}>
                <MaterialDesignIcons
                  name="alert-outline"
                  size={22}
                  color={theme.colors.warning}
                />
              </View>

              <View style={styles.warningHeaderCopy}>
                <Text style={styles.warningTitle}>
                  {content.warningTitle}
                </Text>

                <Text
                  style={styles.warningSubtitle}
                >
                  {content.warningSubtitle}
                </Text>
              </View>
            </View>

            {content.warningSigns.map(item => (
              <View
                key={item}
                style={styles.warningRow}
              >
                <MaterialDesignIcons
                  name="alert-circle-outline"
                  size={18}
                  color={theme.colors.warning}
                />

                <Text style={styles.warningText}>
                  {item}
                </Text>
              </View>
            ))}
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* TIP */}
          {/* ---------------------------------------------------------------- */}

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                {content.tipTitle}
              </Text>

              <Text style={styles.tipText}>
                {content.tipText}
              </Text>
            </View>
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* SUMMARY */}
          {/* ---------------------------------------------------------------- */}

          <Text style={styles.h2}>
            {content.summaryHeading}
          </Text>

          <View style={styles.summaryCard}>
            {content.summary.map(item => (
              <View
                key={item}
                style={styles.summaryRow}
              >
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <Text style={styles.summaryText}>
                  {item}
                </Text>
              </View>
            ))}
          </View>

          {/* Disclaimer */}

          <View style={styles.disclaimer}>
            <MaterialDesignIcons
              name="shield-outline"
              size={18}
              color={theme.colors.textMuted}
            />

            <Text style={styles.disclaimerText}>
              {content.disclaimerText}
            </Text>
          </View>
        </View>
      </ScrollView>

      <ReadingControls
        articleId={ID}
        durationMinutes={5}
        scrollRef={scrollRef}
      />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* STYLES */
/* -------------------------------------------------------------------------- */

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  scroll: {
    paddingBottom: 30,
  },

  /* HERO */

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
    backgroundColor: withAlpha(theme.colors.surface, 0.92),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  pressed: {
    opacity: 0.72,
  },

  /* ARTICLE */

  article: {
    marginTop: -15,
    padding: 20,
    paddingBottom: 30,
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
    gap: 9,
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  metaDivider: {
    width: 1,
    height: 18,
    backgroundColor: theme.colors.border,
  },

  meta: {
    fontSize: 9.5,
    color: theme.colors.textMuted,
  },

  intro: {
    marginTop: 17,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },

  /* CONTENTS */

  contents: {
    marginTop: 20,
    padding: 15,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  contentsTitle: {
    marginBottom: 7,
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '800',
  },

  contentRow: {
    minHeight: 41,
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
    width: 31,
    color: theme.colors.primary,
    fontSize: 10.5,
    fontWeight: '800',
  },

  contentText: {
    flex: 1,
    fontSize: 12.2,
    lineHeight: 17,
    color: theme.colors.text,
  },

  /* HEADINGS */

  h2: {
    marginTop: 28,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: theme.colors.text,
    fontWeight: '700',
  },

  body: {
    marginTop: 9,
    fontSize: 14,
    lineHeight: 21.5,
    color: theme.colors.textSecondary,
  },

  /* DISTINCTION */

  distinctionCard: {
    marginTop: 15,
    padding: 14,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  distinctionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  distinctionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  distinctionCopy: {
    flex: 1,
    marginLeft: 10,
  },

  distinctionTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  distinctionText: {
    marginTop: 3,
    fontSize: 10.8,
    lineHeight: 16,
    color: theme.colors.textSecondary,
  },

  distinctionDivider: {
    height: 1,
    marginVertical: 13,
    backgroundColor: theme.colors.border,
  },

  /* SCHEMA */

  schemaCard: {
    marginTop: 15,
    padding: 15,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  schemaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },

  schemaHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  schemaHeaderCopy: {
    flex: 1,
    marginLeft: 10,
  },

  schemaTitle: {
    fontSize: 13.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  schemaSubtitle: {
    marginTop: 2,
    fontSize: 10,
    color: theme.colors.textMuted,
  },

  schemaTimeline: {
    marginTop: 4,
  },

  schemaStage: {
    minHeight: 102,
    flexDirection: 'row',
  },

  schemaRail: {
    width: 42,
    alignItems: 'center',
    position: 'relative',
  },

  schemaNode: {
    width: 32,
    height: 32,
    marginTop: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    zIndex: 2,
  },

  schemaNodeNumber: {
    fontSize: 9,
    color: theme.colors.primary,
    fontWeight: '900',
  },

  schemaConnector: {
    position: 'absolute',
    top: 48,
    bottom: 0,
    width: 2,
    backgroundColor: theme.colors.border,
  },

  schemaContent: {
    flex: 1,
    paddingTop: 13,
    paddingLeft: 9,
    paddingBottom: 10,
  },

  schemaStageTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  schemaStageIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  schemaStageHeading: {
    flex: 1,
    marginLeft: 8,
  },

  schemaStageTitle: {
    fontSize: 12.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  schemaStageSubtitle: {
    marginTop: 1,
    fontSize: 9.5,
    color: theme.colors.primary,
    fontWeight: '700',
  },

  schemaStageText: {
    marginTop: 7,
    fontSize: 10.7,
    lineHeight: 16,
    color: theme.colors.textSecondary,
  },

  /* EVOLUTION */

  evolutionCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  evolutionItem: {
    minHeight: 91,
    flexDirection: 'row',
  },

  evolutionLeft: {
    width: 40,
    alignItems: 'center',
    position: 'relative',
  },

  evolutionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    zIndex: 2,
  },

  evolutionConnector: {
    position: 'absolute',
    top: 34,
    bottom: 0,
    width: 1.5,
    backgroundColor: theme.colors.border,
  },

  evolutionCopy: {
    flex: 1,
    marginLeft: 8,
    paddingBottom: 13,
  },

  evolutionTitle: {
    fontSize: 12.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  evolutionPeriod: {
    marginTop: 2,
    fontSize: 9.5,
    color: theme.colors.primary,
    fontWeight: '700',
  },

  evolutionText: {
    marginTop: 4,
    fontSize: 10.8,
    lineHeight: 16,
    color: theme.colors.textSecondary,
  },

  /* INFO */

  infoCard: {
    marginTop: 14,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 13,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  infoCopy: {
    flex: 1,
    marginLeft: 9,
  },

  infoTitle: {
    fontSize: 12.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  infoText: {
    marginTop: 3,
    fontSize: 10.8,
    lineHeight: 16,
    color: theme.colors.textSecondary,
  },

  /* CARE */

  careGrid: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },

  careCard: {
    width: '48%',
    minHeight: 135,
    padding: 12,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  careIcon: {
    width: 37,
    height: 37,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  careTitle: {
    marginTop: 9,
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '800',
  },

  careText: {
    marginTop: 4,
    fontSize: 10.4,
    lineHeight: 15.5,
    color: theme.colors.textSecondary,
  },

  /* WARNING */

  warningCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },

  warningHeaderIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },

  warningHeaderCopy: {
    flex: 1,
    marginLeft: 9,
  },

  warningTitle: {
    fontSize: 12.5,
    color: theme.colors.text,
    fontWeight: '800',
  },

  warningSubtitle: {
    marginTop: 2,
    fontSize: 9.8,
    color: theme.colors.textMuted,
  },

  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },

  warningText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  /* TIP */

  tip: {
    marginTop: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 13,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  tipCopy: {
    flex: 1,
    marginLeft: 10,
  },

  tipTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  tipText: {
    marginTop: 4,
    fontSize: 11.2,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  /* SUMMARY */

  summaryCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 11,
  },

  summaryText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  /* DISCLAIMER */

  disclaimer: {
    marginTop: 18,
    paddingHorizontal: 3,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },

  disclaimerText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 15,
    color: theme.colors.textMuted,
  },
  });
}
