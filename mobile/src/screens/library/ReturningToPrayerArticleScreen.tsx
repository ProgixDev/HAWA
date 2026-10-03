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

const ID = 'returningtoprayer-le-ghusl-et-le-retour';

const HERO = require('../../assets/images/library/category-spiritual.png');

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'RETOUR À LA PRIÈRE',
    title: 'Le ghusl et le\nretour à la prière',
    metaDuration: '5 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Les étapes générales pour reprendre la prière après les règles, avec sérénité.',
    disclaimerTitle: 'Information importante',
    disclaimerText: 'Ce contenu est purement éducatif. Les questions religieuses doivent être validées par des savants qualifiés. AWA ne délivre pas de fatwas ni de décisions religieuses personnalisées.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Le ghusl, retour à la pureté rituelle',
      'Une méthode qui peut varier selon l’école',
      'La reprise de la prière, sans rattrapage',
      'Points pratiques à retenir',
    ],
    section1Body1: 'Le ghusl est une grande ablution rituelle : elle consiste à laver l’intégralité du corps avec l’intention de retrouver l’état de pureté rituelle (tahara), nécessaire à l’accomplissement de la prière et d’autres actes d’adoration.',
    section1Body2: 'Avant d’effectuer le ghusl, il est important de s’assurer que les règles sont réellement terminées : le ghusl doit suivre, et non précéder, la certitude que le saignement s’est arrêté. De manière générale, cette fin se reconnaît à l’arrêt total du saignement, observé sur une durée suffisante pour écarter tout doute — un point détaillé dans l’article dédié à la pureté rituelle.',
    section1Body3: 'C’est cette purification qui permet de renouer avec les moments d’adoration suspendus pendant les règles.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Il n’y a pas d’urgence à ressentir : le ghusl peut être effectué dès que tu es prête, sans pression, une fois la fin des règles constatée avec certitude.',
    section2Body: 'Le ghusl repose sur des principes généraux communs : l’intention de se purifier, et le lavage complet du corps, y compris les cheveux et la peau. Les détails précis de la méthode peuvent en revanche varier selon les écoles juridiques suivies.',
    alertTitle: 'Note importante',
    alertText: 'Aucune méthode particulière n’est présentée ici comme la seule valable : se référer à l’école ou à l’avis suivi habituellement, ou demander conseil à un savant qualifié, permet de connaître les modalités précises adaptées à ta situation.',
    section3Body1: 'Une fois les règles terminées et le ghusl effectué, la prière reprend normalement, sans délai particulier ni condition supplémentaire.',
    section3Body2: 'Il est utile de distinguer deux situations qui suivent des règles différentes : les prières non accomplies pendant les règles ne sont généralement pas rattrapées, alors que les jours de jeûne manqués pendant le Ramadan doivent, eux, être rattrapés plus tard (qadaa).',
    section3Body3: 'Par exemple, une femme ayant eu ses règles pendant 6 jours reprend la prière normalement après le ghusl, sans avoir à rattraper les prières de ces 6 jours. Les 6 jours de jeûne correspondants, en revanche, seront rattrapés après le Ramadan.',
    practicalPoints: [
      'Reconnaître la fin des règles avec certitude',
      'Effectuer le ghusl (grande ablution) pour retrouver la pureté rituelle',
      'Reprendre la prière normalement, sans délai',
      'Savoir que les prières manquées pendant les règles ne sont généralement pas rattrapées',
      'Demander conseil à un savant qualifié pour toute situation particulière ou un doute persistant',
    ],
    shareMessage: 'Le ghusl et le retour à la prière — AWA',
  },
  en: {
    badge: 'RETURN TO PRAYER',
    title: 'Ghusl and the\nreturn to prayer',
    metaDuration: '5 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'The general steps for resuming prayer after menstruation, with peace of mind.',
    disclaimerTitle: 'Important information',
    disclaimerText: 'This content is purely educational. Religious questions should be validated by qualified scholars. AWA does not issue fatwas or personalized religious rulings.',
    contentsTitle: 'In this article',
    topics: [
      'Ghusl, return to ritual purity',
      'A method that can vary by school',
      'Resuming prayer, without making up missed prayers',
      'Practical points to remember',
    ],
    section1Body1: 'Ghusl is a major ritual ablution: it consists of washing the entire body with the intention of returning to the state of ritual purity (tahara), necessary for performing prayer and other acts of worship.',
    section1Body2: 'Before performing the ghusl, it’s important to make sure that menstruation has truly ended: the ghusl should follow, not precede, the certainty that the bleeding has stopped. Generally speaking, this end is recognized by the total stopping of bleeding, observed over a sufficient period of time to rule out any doubt — a point covered in detail in the article dedicated to ritual purity.',
    section1Body3: 'This purification is what allows you to reconnect with the moments of worship suspended during menstruation.',
    tip1Title: 'Good to know',
    tip1Text: 'There’s no need to feel rushed: the ghusl can be performed as soon as you’re ready, without pressure, once the end of menstruation has been confirmed with certainty.',
    section2Body: 'The ghusl is based on shared general principles: the intention to purify oneself, and the complete washing of the body, including the hair and skin. The precise details of the method, however, can vary according to the school of jurisprudence followed.',
    alertTitle: 'Important note',
    alertText: 'No particular method is presented here as the only valid one: referring to the school or opinion you usually follow, or seeking advice from a qualified scholar, will help you learn the precise details suited to your situation.',
    section3Body1: 'Once menstruation has ended and the ghusl has been performed, prayer resumes normally, with no particular delay or additional condition.',
    section3Body2: 'It’s helpful to distinguish between two situations that follow different rules: prayers not performed during menstruation are generally not made up, whereas fasting days missed during Ramadan must be made up later (qadaa).',
    section3Body3: 'For example, a woman who has had her period for 6 days resumes prayer normally after the ghusl, without having to make up the prayers from those 6 days. The corresponding 6 days of fasting, however, will be made up after Ramadan.',
    practicalPoints: [
      'Recognizing the end of menstruation with certainty',
      'Performing the ghusl (major ablution) to return to ritual purity',
      'Resuming prayer normally, without delay',
      'Knowing that prayers missed during menstruation are generally not made up',
      'Seeking advice from a qualified scholar for any particular situation or persistent doubt',
    ],
    shareMessage: 'Ghusl and the return to prayer — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function ReturningToPrayerArticleScreen({
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
            {content.section1Body1}
          </Text>

          <Text style={styles.body}>
            {content.section1Body2}
          </Text>

          <Text style={styles.body}>
            {content.section1Body3}
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

          <Text style={styles.body}>
            {content.section2Body}
          </Text>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.alertTitle}</Text>
              <Text style={styles.tipText}>
                {content.alertText}
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>3. {content.topics[2]}</Text>

          <Text style={styles.body}>
            {content.section3Body1}
          </Text>

          <Text style={styles.body}>
            {content.section3Body2}
          </Text>

          <Text style={styles.body}>
            {content.section3Body3}
          </Text>

          <Text style={styles.h2}>4. {content.topics[3]}</Text>

          <View style={styles.checkList}>
            {content.practicalPoints.map(item => (
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
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={5} scrollRef={scrollRef} />
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
  body: {marginTop: 8, fontSize: 14, lineHeight: 21, color: theme.colors.textSecondary},
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
  });
}
