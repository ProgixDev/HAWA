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

const ID = 'fastingqadaa-dispense-et-rattrapage';

const HERO = require('../../assets/images/library/rules-hero.png');

const ART = {
  balance: require('../../assets/images/library/regular-cycle-balance.png'),
  pregnancy: require('../../assets/images/library/category-pregnancy.png'),
};

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'JEÛNE & QADAA',
    title: 'Jeûne et dispense :\nle rattrapage (Qadaa)',
    metaDuration: '6 min de lecture',
    metaType: 'FAQ',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Comment et quand rattraper les jours de jeûne manqués, à son propre rythme et sans culpabilité.',
    disclaimerTitle: 'Information importante',
    disclaimerText: 'Ce contenu est purement éducatif. Les questions religieuses doivent être validées par des savants qualifiés. AWA ne délivre pas de fatwas ni de décisions religieuses personnalisées.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Quand rattraper les jours manqués ?',
      'Un délai courant : avant le Ramadan suivant',
      'Grossesse et allaitement',
      'À retenir',
    ],
    section1Body: 'Le Qadaa désigne le fait de rattraper, plus tard, les jours de jeûne manqués pendant le Ramadan — notamment en raison des règles. Ces jours doivent être rattrapés car le jeûne du Ramadan reste un pilier du mois, et les jours suspendus pour cause de règles sont comptés comme dus, sans qu’il s’agisse d’une faute de ta part.',
    section1Body2: 'Le rattrapage peut généralement commencer dès la fin du Ramadan, dès que ta situation le permet. Tu peux organiser ces jours selon ton propre rythme : certaines personnes préfèrent les regrouper rapidement après le Ramadan, d’autres les répartissent progressivement au fil des mois suivants.',
    noteTitle: 'À noter',
    noteText: 'Rattraper les jours de manière consécutive ou de façon répartie peut faire l’objet d’avis différents selon les écoles juridiques ; aucune des deux approches n’est présentée ici comme la seule valable.',
    recordTips: [
      'Noter le nombre total de jours à rattraper dès la fin du Ramadan',
      'Choisir une méthode simple : calendrier, application, carnet',
      'Cocher chaque jour rattrapé au fur et à mesure',
    ],
    section1Body3: 'Par exemple, une personne ayant 6 jours à rattraper peut choisir d’en jeûner un par semaine pendant six semaines, ou de les regrouper sur une même période si cela lui convient mieux.',
    section2Body: 'Il est courant de chercher à rattraper les jours manqués avant le Ramadan suivant. Cette pratique n’est pas systématiquement obligatoire dans tous les cas, mais elle facilite l’organisation et évite d’accumuler un nombre important de jours en attente.',
    visual1Title: 'Un rythme qui s’adapte à toi',
    visual1Text: 'Répartir les jours à rattraper selon ton emploi du temps permet d’avancer sereinement, sans pression.',
    section2Body2: 'Planifier à l’avance permet d’éviter le stress de dernière minute. Une astuce simple consiste à compter le nombre de jours restants avant le prochain Ramadan et à répartir les jours à rattraper sur les semaines ou mois disponibles.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Si une raison durable ou récurrente empêche de jeûner (un état de santé prolongé, par exemple), la situation peut relever d’un cadre différent ; il est alors particulièrement utile d’en parler avec un savant qualifié.',
    alert2Title: 'Information importante',
    alert2Text: 'Les modalités précises en cas de délai dépassé peuvent différer selon les interprétations. Pour toute situation compliquée, l’avis d’un savant ou d’une savante qualifiée reste la référence.',
    section2Body3: 'Par exemple, si le prochain Ramadan commence dans 8 mois et qu’il reste 6 jours à rattraper, une possibilité est de prévoir environ un jour par mois, avec de la flexibilité selon les imprévus.',
    section3Body: 'La grossesse et l’allaitement peuvent affecter la capacité à jeûner, notamment lorsque le jeûne présente un risque pour la santé de la mère ou de l’enfant. Le bien-être physique et la capacité réelle à jeûner sont des éléments importants à prendre en compte.',
    visual2Title: 'Une situation prise en compte',
    visual2Text: 'Ces circonstances sont reconnues par la tradition religieuse comme pouvant donner lieu à une dispense.',
    section3Body2: 'Les avis religieux concernant le jeûne non effectué pendant la grossesse ou l’allaitement peuvent varier selon les écoles, notamment sur la question de savoir si un simple rattrapage suffit ou si une compensation est également concernée. La raison précise de l’absence de jeûne et la situation personnelle peuvent influencer la réponse applicable.',
    tip2Title: 'Bon à savoir',
    tip2Text: 'Le Qadaa permet de rattraper sereinement les jours de jeûne manqués, à ton propre rythme. En cas de situation particulière (délai dépassé, grossesse, allaitement, empêchement durable), l’avis d’un savant qualifié reste la meilleure ressource.',
    shareMessage: 'Jeûne et dispense : le rattrapage (Qadaa) — AWA',
  },
  en: {
    badge: 'FASTING & QADAA',
    title: 'Fasting and exemption:\nthe make-up (Qadaa)',
    metaDuration: '6 min read',
    metaType: 'FAQ',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'How and when to make up missed fasting days, at your own pace and without guilt.',
    disclaimerTitle: 'Important information',
    disclaimerText: 'This content is purely educational. Religious questions should be validated by qualified scholars. AWA does not issue fatwas or personalized religious rulings.',
    contentsTitle: 'In this article',
    topics: [
      'When to make up the missed days?',
      'A common timeframe: before the next Ramadan',
      'Pregnancy and breastfeeding',
      'Key takeaways',
    ],
    section1Body: 'Qadaa refers to making up, at a later time, the fasting days missed during Ramadan — notably because of menstruation. These days must be made up because the Ramadan fast remains a pillar of the month, and the days suspended due to menstruation are counted as owed, without this being any fault of yours.',
    section1Body2: 'The make-up can generally begin as soon as Ramadan ends, as soon as your situation allows it. You can organize these days at your own pace: some people prefer to group them together soon after Ramadan, while others spread them out gradually over the following months.',
    noteTitle: 'Please note',
    noteText: 'Making up the days consecutively or spreading them out may be viewed differently depending on the school of jurisprudence; neither approach is presented here as the only valid one.',
    recordTips: [
      'Write down the total number of days to make up as soon as Ramadan ends',
      'Choose a simple method: calendar, app, notebook',
      'Check off each day as it is made up',
    ],
    section1Body3: 'For example, a person with 6 days to make up can choose to fast one per week for six weeks, or group them into the same period if that suits them better.',
    section2Body: 'It is common to try to make up the missed days before the next Ramadan. This practice is not systematically mandatory in every case, but it makes organizing easier and avoids accumulating a large number of pending days.',
    visual1Title: 'A pace that adapts to you',
    visual1Text: 'Spreading out the days to make up according to your schedule lets you move forward calmly, without pressure.',
    section2Body2: 'Planning ahead helps avoid last-minute stress. A simple tip is to count the number of days remaining before the next Ramadan and spread the days to make up over the available weeks or months.',
    tip1Title: 'Good to know',
    tip1Text: 'If a lasting or recurring reason prevents fasting (a prolonged health condition, for example), the situation may fall under a different framework; it is then especially useful to discuss it with a qualified scholar.',
    alert2Title: 'Important information',
    alert2Text: 'The precise rules in case the timeframe is exceeded can differ depending on interpretation. For any complicated situation, the opinion of a qualified scholar remains the reference.',
    section2Body3: 'For example, if the next Ramadan begins in 8 months and 6 days remain to be made up, one possibility is to plan for about one day per month, with flexibility for unforeseen circumstances.',
    section3Body: 'Pregnancy and breastfeeding can affect the ability to fast, particularly when fasting poses a risk to the health of the mother or the child. Physical well-being and the real ability to fast are important factors to take into account.',
    visual2Title: 'A situation that is taken into account',
    visual2Text: 'These circumstances are recognized by religious tradition as potentially giving rise to an exemption.',
    section3Body2: 'Religious opinions regarding fasting not carried out during pregnancy or breastfeeding can vary depending on the school, particularly on the question of whether a simple make-up is sufficient or whether a compensation is also involved. The precise reason for not fasting and the personal situation can influence the applicable answer.',
    tip2Title: 'Good to know',
    tip2Text: 'Qadaa allows you to calmly make up the missed fasting days, at your own pace. In case of a particular situation (exceeded timeframe, pregnancy, breastfeeding, lasting impediment), the opinion of a qualified scholar remains the best resource.',
    shareMessage: 'Fasting and exemption: the make-up (Qadaa) — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function FastingQadaaArticleScreen({
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

          <Text style={styles.body}>
            {content.section1Body2}
          </Text>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.noteTitle}</Text>
              <Text style={styles.tipText}>
                {content.noteText}
              </Text>
            </View>
          </View>

          <View style={styles.checkList}>
            {content.recordTips.map(item => (
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

          <Text style={styles.body}>
            {content.section1Body3}
          </Text>

          <Text style={styles.h2}>
            2. {content.topics[1]}
          </Text>

          <Text style={styles.body}>
            {content.section2Body}
          </Text>

          <View style={styles.visualCard}>
            <Image
              source={ART.balance}
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

          <Text style={styles.body}>
            {content.section2Body2}
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

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-circle-outline"
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

          <Text style={styles.body}>
            {content.section2Body3}
          </Text>

          <Text style={styles.h2}>3. {content.topics[2]}</Text>

          <Text style={styles.body}>
            {content.section3Body}
          </Text>

          <View style={styles.visualCard}>
            <Image
              source={ART.pregnancy}
              resizeMode="cover"
              style={styles.visualImage}
            />

            <View style={styles.visualCopy}>
              <Text style={styles.visualTitle}>{content.visual2Title}</Text>

              <Text style={styles.visualText}>
                {content.visual2Text}
              </Text>
            </View>
          </View>

          <Text style={styles.body}>
            {content.section3Body2}
          </Text>

          <Text style={styles.h2}>4. {content.topics[3]}</Text>

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
  body: {marginTop: 8, fontSize: 14, lineHeight: 21, color: theme.colors.textSecondary},
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
  visualImage: {width: 72, height: 72, borderRadius: 12},
  visualCopy: {flex: 1, marginLeft: 12},
  visualTitle: {color: theme.colors.text, fontSize: 13, lineHeight: 17, fontWeight: '800'},
  visualText: {marginTop: 4, color: theme.colors.textMuted, fontSize: 11, lineHeight: 16},
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
