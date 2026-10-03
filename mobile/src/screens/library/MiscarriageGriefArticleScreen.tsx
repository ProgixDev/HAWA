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

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

const ID = 'lossemotional-traverser-le-deuil';

const HERO = require('../../assets/images/library/rules-hero.png');

/* -------------------------------------------------------------------------- */
/* DATA — icons are language-neutral and stay index-aligned with the matching */
/* CONTENT.fr/.en text arrays below (feelings / dailySupport).               */
/* -------------------------------------------------------------------------- */

const FEELING_ICONS = [
  'emoticon-sad-outline',
  'weather-lightning',
  'help-circle-outline',
] as const;

const DAILY_SUPPORT_ICONS = [
  'clock-outline',
  'account-off-outline',
  'pencil-outline',
] as const;

/* -------------------------------------------------------------------------- */
/* CONTENT — PHASE 7L bilingual editorial content. Article identity (ID,     */
/* images, bookmark/progress keys, JSX structure) is untouched; only this    */
/* object changes per language. The French text below is byte-identical to  */
/* the original — never retyped, only moved into the `fr` key — so the app  */
/* remains fully bilingual rather than having French replaced by English.   */
/* -------------------------------------------------------------------------- */

const CONTENT = {
  fr: {
    badge: 'APRÈS UNE FAUSSE COUCHE • SOUTIEN ÉMOTIONNEL',
    title: 'Traverser le deuil\némotionnellement',
    metaDuration: '7 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu informatif',
    intro:
      'Il n’y a pas de bonne façon de vivre cette épreuve. Chacune la traverse à sa manière, à son propre rythme.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Un deuil réel et légitime',
      'Des émotions qui varient selon chaque personne',
      'Ce qui peut aider au quotidien',
      'Le soutien de l’entourage',
      'Quand demander de l’aide professionnelle',
      'À retenir',
    ],
    section1Body:
      'La tristesse, la colère ou le sentiment de vide sont des réactions normales face à cette perte, quel que soit le stade de la grossesse. Ce que tu ressens mérite d’être reconnu.',
    section1InfoTitle: 'À retenir',
    section1InfoText:
      'Il n’existe pas de bonne ou de mauvaise façon de vivre cette épreuve. Chaque émotion que tu ressens est légitime.',
    section2Body:
      'Certaines personnes peuvent ressentir un ou plusieurs de ces états, parfois en même temps :',
    feelings: [
      {
        title: 'Tristesse',
        text: 'Un chagrin qui peut aller et venir, parfois de façon inattendue.',
      },
      {
        title: 'Colère',
        text: 'Envers soi, la situation ou un sentiment d’injustice, sans que ce soit un problème.',
      },
      {
        title: 'Sentiment de vide',
        text: 'Une impression de vide ou d’incompréhension face à ce qui vient de se passer.',
      },
    ],
    section3Body:
      'S’accorder du temps, sans pression ni comparaison, fait partie intégrante de la guérison.',
    dailySupport: [
      {
        title: 'T’accorder du temps',
        text: 'Sans pression ni date limite pour « aller mieux ».',
      },
      {
        title: 'Ne pas te comparer',
        text: 'Chaque deuil est unique ; il n’y a pas de bonne façon de le vivre.',
      },
      {
        title: 'Mettre des mots dessus',
        text: 'Écrire ou parler de ce que tu ressens peut alléger le poids des émotions.',
      },
    ],
    section4Body:
      'Parler à un proche, un groupe de soutien ou un professionnel peut alléger ce poids. Voici comment l’entourage peut aider :',
    supportTitle: 'Comment un proche peut soutenir',
    howToSupport: [
      'Écouter sans juger, même sans avoir les mots parfaits',
      'Éviter de minimiser (« ce n’était pas grave », « tu pourras réessayer »)',
      'Proposer une présence plutôt que des solutions',
      'Continuer à prendre des nouvelles dans les semaines qui suivent',
    ],
    section5Body:
      'Certains signes peuvent indiquer qu’un accompagnement professionnel serait bénéfique :',
    warningTitle: 'Signaux à surveiller',
    attentionSigns: [
      'La tristesse persiste longtemps et s’intensifie plutôt que de s’atténuer',
      'Il devient difficile de fonctionner au quotidien',
      'Un isolement important s’installe',
      'Des pensées envahissantes ou un sentiment de détresse important apparaissent',
    ],
    section5InfoTitle: 'Un accompagnement est possible',
    section5InfoText:
      'Une sage-femme, un médecin, un psychologue ou un groupe de parole peut t’écouter et t’accompagner, sans jugement.',
    tipTitle: 'Bon à savoir',
    tipText:
      'Demander de l’aide n’est pas un signe de faiblesse : c’est une façon de prendre soin de toi pendant cette période.',
    summaryPoints: [
      'Il n’existe pas de bonne ou de mauvaise façon de vivre cette épreuve.',
      'La tristesse, la colère ou le sentiment de vide sont des réactions normales.',
      'S’accorder du temps, sans pression ni comparaison, fait partie de la guérison.',
      'Parler à un proche, un groupe de soutien ou un professionnel peut alléger ce poids.',
    ],
    disclaimerText:
      'Contenu informatif. Cet article ne remplace pas un avis professionnel. Si tu traverses une période difficile, n’hésite pas à en parler à un professionnel de santé.',
    shareMessage: 'Traverser le deuil émotionnellement — AWA',
  },
  en: {
    badge: 'AFTER A MISCARRIAGE • EMOTIONAL SUPPORT',
    title: 'Moving through grief\nemotionally',
    metaDuration: '7 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Informational content',
    intro:
      'There’s no right way to go through this. Everyone moves through it in her own way, at her own pace.',
    contentsTitle: 'In this article',
    topics: [
      'A real and legitimate grief',
      'Emotions that vary from person to person',
      'What may help day to day',
      'Support from loved ones',
      'When to seek professional help',
      'Key takeaways',
    ],
    section1Body:
      'Sadness, anger, or a feeling of emptiness are normal reactions to this loss, whatever the stage of the pregnancy. What you’re feeling deserves to be acknowledged.',
    section1InfoTitle: 'Keep in mind',
    section1InfoText:
      'There is no right or wrong way to go through this. Every emotion you feel is valid.',
    section2Body:
      'You may feel one or more of these, sometimes all at once:',
    feelings: [
      {
        title: 'Sadness',
        text: 'A sorrow that can come and go, sometimes unexpectedly.',
      },
      {
        title: 'Anger',
        text: 'Toward yourself, the situation, or a sense of unfairness — and that’s nothing to worry about.',
      },
      {
        title: 'A feeling of emptiness',
        text: 'A sense of emptiness or confusion about what just happened.',
      },
    ],
    section3Body:
      'Giving yourself time, without pressure or comparison, is an essential part of healing.',
    dailySupport: [
      {
        title: 'Giving yourself time',
        text: 'Without pressure or a deadline for “feeling better.”',
      },
      {
        title: 'Not comparing yourself to others',
        text: 'Every grief is unique; there’s no right way to go through it.',
      },
      {
        title: 'Putting it into words',
        text: 'Writing or talking about what you feel can help lighten the weight of your emotions.',
      },
    ],
    section4Body:
      'Talking to someone close to you, a support group, or a professional can help lighten this weight. Here’s how loved ones can help:',
    supportTitle: 'How a loved one can offer support',
    howToSupport: [
      'Listen without judgment, even without having the perfect words',
      'Avoid minimizing the experience (“it wasn’t a big deal,” “you can try again”)',
      'Offer your presence rather than solutions',
      'Keep checking in during the weeks that follow',
    ],
    section5Body:
      'Some signs may indicate that professional support could be helpful:',
    warningTitle: 'Signs to watch for',
    attentionSigns: [
      'Sadness lasts a long time and intensifies rather than easing',
      'It becomes difficult to function day to day',
      'A significant sense of isolation sets in',
      'Intrusive thoughts or significant distress appear',
    ],
    section5InfoTitle: 'Support is available',
    section5InfoText:
      'A midwife, doctor, psychologist, or support group can listen and support you, without judgment.',
    tipTitle: 'Good to know',
    tipText:
      'Asking for help isn’t a sign of weakness — it’s a way of taking care of yourself during this time.',
    summaryPoints: [
      'There is no right or wrong way to go through this experience.',
      'Sadness, anger, or a feeling of emptiness are normal reactions.',
      'Giving yourself time, without pressure or comparison, is part of healing.',
      'Talking to someone close to you, a support group, or a professional can help lighten this weight.',
    ],
    disclaimerText:
      'Informational content. This article does not replace professional advice. If you’re going through a difficult time, don’t hesitate to talk to a healthcare professional.',
    shareMessage: 'Moving through grief, emotionally — AWA',
  },
} as const;

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

/* -------------------------------------------------------------------------- */
/* SCREEN                                                                     */
/* -------------------------------------------------------------------------- */

export default function MiscarriageGriefArticleScreen({
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

  const handleShare = async () => {
    try {
      await Share.share({
        message: content.shareMessage,
      });
    } catch {
      // Partage annulé ou indisponible.
    }
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
        {/* ==================================================================== */}
        {/* HERO                                                                 */}
        {/* ==================================================================== */}

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
              hitSlop={8}
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
                accessibilityLabel={
                  saved ? t('library.screen.removeBookmark') : t('library.screen.addBookmark')
                }
                hitSlop={8}
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
                hitSlop={8}
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

        {/* ==================================================================== */}
        {/* ARTICLE                                                             */}
        {/* ==================================================================== */}

        <View style={styles.article}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{content.badge}</Text>
          </View>

          <Text style={styles.title}>{content.title}</Text>

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

          <Text style={styles.intro}>{content.intro}</Text>

          {/* -------------------------------------------------------------- */}
          {/* CONTENTS                                                        */}
          {/* -------------------------------------------------------------- */}

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

          {/* ================================================================= */}
          {/* SECTION 1                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>1. {content.topics[0]}</Text>

          <Text style={styles.body}>{content.section1Body}</Text>

          <View style={styles.infoCard}>
            <MaterialDesignIcons
              name="heart-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>{content.section1InfoTitle}</Text>
              <Text style={styles.infoText}>{content.section1InfoText}</Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SECTION 2                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>2. {content.topics[1]}</Text>

          <Text style={styles.body}>{content.section2Body}</Text>

          <View style={styles.normalGrid}>
            {content.feelings.map((item, index) => (
              <View key={item.title} style={styles.normalCard}>
                <View style={styles.normalIcon}>
                  <MaterialDesignIcons
                    name={FEELING_ICONS[index] as never}
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.normalTitle}>{item.title}</Text>
                <Text style={styles.normalText}>{item.text}</Text>
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* SECTION 3                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>3. {content.topics[2]}</Text>

          <Text style={styles.body}>{content.section3Body}</Text>

          <View style={styles.comfortCard}>
            {content.dailySupport.map((item, index) => (
              <View
                key={item.title}
                style={[
                  styles.comfortRow,
                  index < content.dailySupport.length - 1 &&
                    styles.comfortRowBorder,
                ]}>
                <View style={styles.comfortIcon}>
                  <MaterialDesignIcons
                    name={DAILY_SUPPORT_ICONS[index] as never}
                    size={19}
                    color={theme.colors.primary}
                  />
                </View>

                <View style={styles.comfortCopy}>
                  <Text style={styles.comfortTitle}>{item.title}</Text>
                  <Text style={styles.comfortText}>{item.text}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* SECTION 4                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>4. {content.topics[3]}</Text>

          <Text style={styles.body}>{content.section4Body}</Text>

          <View style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <MaterialDesignIcons
                name="account-group-outline"
                size={22}
                color={theme.colors.primary}
              />

              <Text style={[styles.warningTitle, styles.supportTitle]}>
                {content.supportTitle}
              </Text>
            </View>

            {content.howToSupport.map(item => (
              <View key={item} style={styles.warningRow}>
                <View style={styles.warningBullet}>
                  <MaterialDesignIcons
                    name="check"
                    size={16}
                    color={theme.colors.success}
                  />
                </View>

                <Text style={styles.warningText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* SECTION 5                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>5. {content.topics[4]}</Text>

          <Text style={styles.body}>{content.section5Body}</Text>

          <View style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <MaterialDesignIcons
                name="alert-circle-outline"
                size={22}
                color={theme.colors.warning}
              />

              <Text style={styles.warningTitle}>{content.warningTitle}</Text>
            </View>

            {content.attentionSigns.map(item => (
              <View key={item} style={styles.warningRow}>
                <View style={styles.warningBullet}>
                  <MaterialDesignIcons
                    name="alert-circle-outline"
                    size={16}
                    color={theme.colors.warning}
                  />
                </View>

                <Text style={styles.warningText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.infoCard}>
            <MaterialDesignIcons
              name="account-heart-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>{content.section5InfoTitle}</Text>
              <Text style={styles.infoText}>{content.section5InfoText}</Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* TIP                                                               */}
          {/* ================================================================= */}

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.tipTitle}</Text>
              <Text style={styles.tipText}>{content.tipText}</Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SUMMARY                                                           */}
          {/* ================================================================= */}

          <Text style={styles.h2}>{content.topics[5]}</Text>

          <View style={styles.summaryCard}>
            {content.summaryPoints.map(item => (
              <View key={item} style={styles.summaryRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <Text style={styles.summaryText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* DISCLAIMER                                                        */}
          {/* ================================================================= */}

          <View style={styles.disclaimer}>
            <MaterialDesignIcons
              name="shield-outline"
              size={18}
              color={theme.colors.textMuted}
            />

            <Text style={styles.disclaimerText}>{content.disclaimerText}</Text>
          </View>
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={7} scrollRef={scrollRef} />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* STYLES                                                                     */
/* -------------------------------------------------------------------------- */

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
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },

  contents: {
    marginTop: 20,
    padding: 15,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    marginTop: 27,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: theme.colors.text,
    fontWeight: '700',
  },
  body: {marginTop: 9, fontSize: 14, lineHeight: 21.5, color: theme.colors.textSecondary},

  infoCard: {
    marginTop: 14,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoCopy: {flex: 1, marginLeft: 9},
  infoTitle: {fontSize: 12.5, color: theme.colors.text, fontWeight: '800'},
  infoText: {marginTop: 3, fontSize: 11.5, lineHeight: 17, color: theme.colors.textSecondary},

  normalGrid: {marginTop: 13, gap: 9},
  normalCard: {
    padding: 13,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  normalIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  normalTitle: {marginTop: 8, fontSize: 12.5, color: theme.colors.text, fontWeight: '800'},
  normalText: {marginTop: 4, fontSize: 11, lineHeight: 16, color: theme.colors.textSecondary},

  comfortCard: {
    marginTop: 13,
    paddingHorizontal: 13,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  comfortRow: {flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 13},
  comfortRowBorder: {borderBottomWidth: 1, borderBottomColor: theme.colors.border},
  comfortIcon: {
    width: 35,
    height: 35,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  comfortCopy: {flex: 1, marginLeft: 10},
  comfortTitle: {fontSize: 12.5, color: theme.colors.text, fontWeight: '800'},
  comfortText: {marginTop: 3, fontSize: 10.8, lineHeight: 16, color: theme.colors.textSecondary},

  warningCard: {
    marginTop: 13,
    padding: 14,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  warningHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 12},
  warningTitle: {flex: 1, marginLeft: 8, fontSize: 12.5, color: theme.colors.text, fontWeight: '800'},
  supportTitle: {color: theme.colors.text},
  warningRow: {flexDirection: 'row', alignItems: 'flex-start', marginBottom: 9},
  warningBullet: {width: 20, alignItems: 'flex-start'},
  warningText: {flex: 1, marginLeft: 5, color: theme.colors.textSecondary, fontSize: 11.5, lineHeight: 17},

  tip: {
    marginTop: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tipCopy: {flex: 1, marginLeft: 11},
  tipTitle: {fontSize: 13, color: theme.colors.text, fontWeight: '800'},
  tipText: {marginTop: 4, fontSize: 11.5, lineHeight: 17, color: theme.colors.textSecondary},

  summaryCard: {
    marginTop: 13,
    padding: 14,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  summaryRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10},
  summaryText: {flex: 1, fontSize: 11.5, lineHeight: 17, color: theme.colors.textSecondary},

  disclaimer: {
    marginTop: 18,
    paddingHorizontal: 3,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },
  disclaimerText: {flex: 1, fontSize: 10, lineHeight: 15, color: theme.colors.textMuted},
  });
}
