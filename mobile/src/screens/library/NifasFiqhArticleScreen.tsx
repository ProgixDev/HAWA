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

const ID = 'nifasfiqh-repere-fiqh';

const HERO = require('../../assets/images/library/nifas-fiqh-hero.png');

// PHASE 7L.2 — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
//
// RELIGIOUS CONTENT: "nifas" is kept untranslated in both languages. Every
// hedge/attribution present in the French ("selon la référence suivie",
// "selon l'école juridique", "une référence fréquemment retenue", etc.) is
// preserved in English with the same scope — no ruling is strengthened,
// invented, or resolved beyond what the French source states.
const CONTENT = {
  fr: {
    badge: 'NIFAS (FIQH)',
    title: 'Le nifas en\npratique religieuse',
    metaDuration: '6 min de lecture',
    metaType: 'FAQ',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Comprendre le nifas, sa durée, la prière, le jeûne et la reprise des adorations après l’accouchement.',
    disclaimerTitle: 'Information importante',
    disclaimerText: 'Ce contenu est purement éducatif. Les questions religieuses doivent être validées par des savants qualifiés. AWA ne délivre pas de fatwas ni de décisions religieuses personnalisées.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Qu’est-ce que le nifas ?',
      'Sa durée selon les références juridiques',
      'Prière pendant le nifas',
      'Jeûne pendant le nifas',
      'Purification et reprise des adorations',
      'Questions fréquentes',
    ],
    section1Body: 'Le nifas désigne, dans la pratique religieuse, la période liée aux pertes de sang après l’accouchement. Les lochies décrivent l’aspect médical et physiologique de ces pertes ; le nifas est leur classification religieuse. Ces deux notions ne doivent pas être confondues.',
    tip1Title: 'À retenir',
    tip1Text: 'AWA sépare volontairement les informations médicales sur les lochies des repères religieux sur le nifas.',
    question1: 'Combien de temps dure le nifas ?',
    section2Body: 'La durée maximale peut varier selon l’école juridique ou la référence religieuse suivie. 40 jours est une référence fréquemment retenue, sans être présentée comme une règle universelle par AWA.',
    tip2Title: 'Repère souvent utilisé',
    tip2Text: 'Une référence fréquemment retenue est de 40 jours, mais AWA ne présente pas ce chiffre comme une vérité unique pour toutes les écoles juridiques. Suis la référence religieuse que tu as choisie.',
    question2: 'Dois-je prier pendant le nifas ?',
    section3Body: 'Pendant une période reconnue comme nifas selon la référence suivie, la prière rituelle est suspendue. AWA ne classe pas automatiquement les saignements et ne fournit pas de décision personnalisée. Aucun compteur de prières manquées n’est ajouté pour cette période.',
    question3: 'Puis-je jeûner pendant le nifas ?',
    section4Body: 'Le jeûne obligatoire n’est pas accompli pendant une période reconnue comme nifas. Les jours concernés sont ensuite traités par le rattrapage approprié, selon la référence suivie.',
    tip3Title: 'Organiser, sans décider',
    tip3Text: 'AWA peut t’aider à mémoriser ou organiser les jours concernés, sans émettre de décision religieuse personnalisée.',
    section5Body: 'La reprise dépend des signes observés et de la référence religieuse suivie.',
    steps: [
      'Observer la fin des pertes',
      'Effectuer la purification rituelle',
      'Reprendre les actes d’adoration concernés',
    ],
    alert2Title: 'En cas de doute',
    alert2Text: 'Si les saignements persistent au-delà de la durée maximale retenue par la référence suivie, leur statut religieux peut changer. Un avis qualifié est recommandé.',
    faq: [
      {
        q: 'Le nifas dure-t-il toujours 40 jours ?',
        a: 'Non. 40 jours est une référence fréquemment utilisée, mais les références juridiques peuvent différer.',
      },
      {
        q: 'Que faire si les pertes s’arrêtent avant 40 jours ?',
        a: 'La reprise des actes d’adoration dépend des signes observés et de la référence religieuse suivie.',
      },
      {
        q: 'Et si les saignements continuent longtemps ?',
        a: 'S’ils dépassent la durée maximale retenue, leur statut religieux peut changer : demande un avis qualifié.',
      },
      {
        q: 'AWA peut-elle dire exactement si mes pertes sont encore du nifas ?',
        a: 'Non. AWA donne des repères éducatifs généraux et ne délivre ni fatwa ni décision personnalisée.',
      },
    ],
    alert3Title: 'Un repère, pas une fatwa',
    alert3Text: 'Les situations personnelles peuvent être différentes. En cas de doute, rapproche-toi d’un savant qualifié ou d’une organisation religieuse reconnue.',
    shareMessage: 'Le nifas en pratique religieuse — AWA',
  },
  en: {
    badge: 'NIFAS (FIQH)',
    title: 'Nifas in\nreligious practice',
    metaDuration: '6 min read',
    metaType: 'FAQ',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'Understanding nifas, its duration, prayer, fasting, and the resumption of acts of worship after childbirth.',
    disclaimerTitle: 'Important information',
    disclaimerText: 'This content is purely educational. Religious questions should be validated by qualified scholars. AWA does not issue fatwas or personalized religious rulings.',
    contentsTitle: 'In this article',
    topics: [
      'What is nifas?',
      'Its duration according to jurisprudential references',
      'Prayer during nifas',
      'Fasting during nifas',
      'Purification and resumption of acts of worship',
      'Frequently asked questions',
    ],
    section1Body: 'In religious practice, nifas refers to the period linked to the bleeding after childbirth. Lochia describes the medical and physiological aspect of this bleeding; nifas is its religious classification. These two notions should not be confused.',
    tip1Title: 'Key takeaway',
    tip1Text: 'AWA deliberately separates the medical information about lochia from the religious markers about nifas.',
    question1: 'How long does nifas last?',
    section2Body: 'The maximum duration may vary according to the school of jurisprudence or the religious reference followed. 40 days is a frequently used reference, without being presented by AWA as a universal rule.',
    tip2Title: 'A commonly used marker',
    tip2Text: 'A frequently used reference is 40 days, but AWA does not present this figure as the one truth for all schools of jurisprudence. Follow the religious reference you have chosen.',
    question2: 'Should I pray during nifas?',
    section3Body: 'During a period recognized as nifas according to the reference followed, ritual prayer is suspended. AWA does not automatically classify bleeding and does not provide a personalized decision. No missed-prayer counter is added for this period.',
    question3: 'Can I fast during nifas?',
    section4Body: 'The obligatory fast is not performed during a period recognized as nifas. The days concerned are then handled through the appropriate make-up, according to the reference followed.',
    tip3Title: 'Organizing, without deciding',
    tip3Text: 'AWA can help you keep track of or organize the days concerned, without issuing a personalized religious decision.',
    section5Body: 'Resumption depends on the signs observed and the religious reference followed.',
    steps: [
      'Observe the end of the bleeding',
      'Perform the ritual purification',
      'Resume the acts of worship concerned',
    ],
    alert2Title: 'In case of doubt',
    alert2Text: 'If the bleeding persists beyond the maximum duration adopted by the reference followed, its religious status may change. A qualified opinion is recommended.',
    faq: [
      {
        q: 'Does nifas always last 40 days?',
        a: 'No. 40 days is a frequently used reference, but jurisprudential references may differ.',
      },
      {
        q: 'What should I do if the bleeding stops before 40 days?',
        a: 'The resumption of acts of worship depends on the signs observed and the religious reference followed.',
      },
      {
        q: 'What if the bleeding continues for a long time?',
        a: 'If it exceeds the maximum duration adopted, its religious status may change: ask for a qualified opinion.',
      },
      {
        q: 'Can AWA say exactly whether my bleeding is still nifas?',
        a: 'No. AWA provides general educational markers and does not issue a fatwa or a personalized decision.',
      },
    ],
    alert3Title: 'A marker, not a fatwa',
    alert3Text: 'Personal situations can differ. In case of doubt, reach out to a qualified scholar or a recognized religious organization.',
    shareMessage: 'Nifas in religious practice — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function NifasFiqhArticleScreen({
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

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="information-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.disclaimerTitle}</Text>
              <Text style={styles.tipText}>{content.disclaimerText}</Text>
            </View>
          </View>

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

          <Text style={styles.h2}>1. {content.topics[0]}</Text>

          <Text style={styles.body}>
            {content.section1Body}
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

          <Text style={styles.h2}>
            2. {content.topics[1]}
          </Text>

          <Text style={styles.question}>{content.question1}</Text>

          <Text style={styles.body}>
            {content.section2Body}
          </Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="calendar-star"
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

          <Text style={styles.h2}>3. {content.topics[2]}</Text>

          <Text style={styles.question}>{content.question2}</Text>

          <Text style={styles.body}>
            {content.section3Body}
          </Text>

          <Text style={styles.h2}>4. {content.topics[3]}</Text>

          <Text style={styles.question}>{content.question3}</Text>

          <Text style={styles.body}>
            {content.section4Body}
          </Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="calendar-refresh-outline"
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

          <Text style={styles.h2}>
            5. {content.topics[4]}
          </Text>

          <Text style={styles.body}>
            {content.section5Body}
          </Text>

          <View style={styles.checkList}>
            {content.steps.map((label, index) => (
              <View key={label} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <Text style={styles.checkText}>
                  {index + 1}. {label}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.alert2Title}</Text>
              <Text style={styles.tipText}>
                {content.alert2Text}
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>6. {content.topics[5]}</Text>

          {content.faq.map(item => (
            <View key={item.q} style={styles.faqItem}>
              <Text style={styles.question}>{item.q}</Text>
              <Text style={styles.body}>{item.a}</Text>
            </View>
          ))}

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="shield-check-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.alert3Title}</Text>
              <Text style={styles.tipText}>
                {content.alert3Text}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={6} scrollRef={scrollRef} />
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
  badgeText: {fontSize: 11, color: theme.colors.primary, fontWeight: '800'},
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
  metaItem: {flexDirection: 'row', alignItems: 'center', gap: 5},
  metaDivider: {width: 1, height: 20, backgroundColor: theme.colors.border},
  meta: {fontSize: 10, color: theme.colors.textMuted},
  intro: {
    marginTop: 17,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.text,
    fontWeight: '500',
  },
  alert: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },
  contents: {
    marginTop: 19,
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
  contentNumber: {width: 24, color: theme.colors.primary, fontSize: 12, fontWeight: '800'},
  contentText: {flex: 1, fontSize: 12.5, lineHeight: 17, color: theme.colors.text},
  h2: {
    marginTop: 24,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: theme.colors.text,
    fontWeight: '700',
  },
  question: {marginTop: 14, fontSize: 14, color: theme.colors.text, fontWeight: '800'},
  body: {marginTop: 8, fontSize: 14, lineHeight: 21, color: theme.colors.textSecondary},
  tip: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
  },
  tipCopy: {flex: 1, marginLeft: 11},
  tipTitle: {fontSize: 13, color: theme.colors.text, fontWeight: '800'},
  tipText: {marginTop: 3, fontSize: 11.5, lineHeight: 17, color: theme.colors.textMuted},
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
    marginBottom: 9,
  },
  checkText: {flex: 1, color: theme.colors.textSecondary, fontSize: 12, lineHeight: 17},
  faqItem: {marginBottom: 4},
  });
}
