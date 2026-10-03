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

const ID = 'hormonaltreatments-choisir-sa-methode';

const HERO = require('../../assets/images/library/featured-spm.png');

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const PRIORITY_ICONS = [
  'calendar-check-outline',
  'heart-pulse',
  'baby-face-outline',
  'shield-check-outline',
] as const;

const COMPARISON_ICONS = [
  'pill',
  'bandage',
  'circle-outline',
  'needle',
  'shape-outline',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'CHOISIR SA MÉTHODE',
    title: 'Choisir le traitement\nqui te convient',
    metaDuration: '7 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Intermédiaire',
    metaValidated: 'Contenu validé',
    intro: 'Les bonnes questions à te poser pour trouver une méthode contraceptive adaptée à ton quotidien, à tes besoins et à tes projets.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Les questions à te poser',
      'Aucune méthode « meilleure » dans l’absolu',
      'Les critères qui peuvent faire la différence',
      'En parler avec un professionnel',
      'À retenir',
    ],
    section1Body: 'Il n’existe pas une contraception idéale pour tout le monde. Avant de choisir une méthode, il peut être utile de réfléchir à tes habitudes, tes préférences, ta tolérance et tes projets.',
    questions: [
      'Comment mon corps réagit-il aux hormones ?',
      'Ai-je besoin d’un geste quotidien, hebdomadaire, ou d’une solution longue durée ?',
      'Ai-je un projet de grossesse à moyen terme ?',
      'Quel est mon budget et l’accès à ce moyen de contraception ?',
    ],
    section2Body: 'Deux personnes peuvent choisir des méthodes différentes et avoir toutes les deux fait un choix parfaitement adapté à leur situation. Le bon choix dépend notamment de la façon dont tu souhaites utiliser ta contraception et de ce que tu recherches.',
    highlightTitle: 'Le bon repère',
    highlightText: 'Une méthode intéressante sur le papier n’est pas forcément celle qui sera la plus simple ou la plus confortable pour toi au quotidien.',
    section3Body: 'Pour comparer plusieurs options, tu peux regarder différents critères. L’objectif n’est pas de tout connaître par cœur, mais d’identifier ce qui compte réellement pour toi.',
    priorities: [
      {title: 'Simplicité', text: 'Certaines méthodes demandent une action quotidienne, alors que d’autres nécessitent seulement une attention hebdomadaire ou beaucoup plus espacée.'},
      {title: 'Tolérance', text: 'Les effets ressentis peuvent varier d’une personne à l’autre. Il est important d’observer comment ton corps réagit et d’en parler si quelque chose te gêne.'},
      {title: 'Projet de grossesse', text: 'Si tu souhaites une grossesse prochainement, la durée d’utilisation et le retour de la fertilité après l’arrêt peuvent faire partie des éléments à discuter.'},
      {title: 'Efficacité', text: 'L’efficacité dépend non seulement de la méthode choisie, mais aussi de son utilisation correcte et régulière.'},
    ],
    rhythmTitle: 'Le rythme d’utilisation',
    rhythmBody: 'Une différence importante entre les méthodes concerne la fréquence à laquelle tu dois penser à ta contraception.',
    comparison: [
      {title: 'Pilule', detail: 'Geste quotidien'},
      {title: 'Patch', detail: 'Changement hebdomadaire'},
      {title: 'Anneau', detail: 'Cycle de plusieurs semaines'},
      {title: 'Implant', detail: 'Solution longue durée'},
      {title: 'Stérilet hormonal', detail: 'Solution longue durée'},
    ],
    bodyReactionTitle: 'Observer la réaction de ton corps',
    bodyReactionText: 'Une méthode hormonale peut être ressentie différemment selon les personnes. Certaines remarquent des changements du cycle, des saignements ou d’autres effets indésirables. Ces réactions ne signifient pas automatiquement que la méthode ne convient pas, mais elles méritent d’être prises en compte.',
    alertTitle: 'À surveiller',
    alertText: 'Si un effet est important, persistant ou inhabituel, ne reste pas seule avec tes questions. Un médecin, une sage-femme ou un autre professionnel de santé peut t’aider à déterminer s’il faut poursuivre, adapter ou changer la méthode.',
    projectsTitle: 'Tenir compte de tes projets',
    projectsBody: 'Ton projet de grossesse peut également influencer le choix. Si tu souhaites éviter une grossesse pendant plusieurs années, une méthode longue durée peut être intéressante. Si tu envisages une grossesse plus prochainement, d’autres options peuvent davantage correspondre à ton calendrier.',
    keepInMindTitle: 'À garder en tête',
    keepInMindText: 'Parler de ton projet de grossesse, même s’il est encore lointain ou incertain, permet au professionnel de santé de mieux orienter la discussion.',
    section4Body: 'Un rendez-vous permet de mettre en balance les avantages, les contraintes et les éventuelles contre-indications de chaque méthode. Tu peux préparer quelques questions avant la consultation afin de ne pas oublier les points importants.',
    questionCardTitle: 'Questions utiles à poser',
    professionalQuestions: [
      'Quels sont les avantages de cette méthode pour moi ?',
      'Quels effets indésirables puis-je rencontrer ?',
      'Comment l’utiliser correctement ?',
      'Que faire si j’oublie, si elle se déplace ou si je souhaite l’arrêter ?',
      'Cette méthode correspond-elle à mon projet de grossesse ?',
    ],
    professionalTipTitle: 'Bon à savoir',
    professionalTipText: 'Une sage-femme ou un médecin peut prendre en compte tes antécédents, tes traitements, tes préférences et ton mode de vie avant de te conseiller une méthode.',
    summaryTitle: 'L’essentiel',
    summaryItems: [
      'Choisis une méthode compatible avec ton quotidien.',
      'Tiens compte de ta tolérance et de tes préférences.',
      'Pense à ton projet de grossesse et à ton horizon de temps.',
      'Demande conseil à un professionnel en cas de doute.',
    ],
    finalTipTitle: 'À retenir',
    finalTipText: 'La meilleure méthode n’est pas nécessairement celle qui semble la plus pratique ou la plus populaire. C’est celle qui correspond à ta situation, à tes besoins et à tes préférences, après une discussion éclairée avec un professionnel de santé.',
    disclaimerText: 'Cet article a une vocation informative et ne remplace pas un avis médical personnalisé.',
    shareMessage: 'Choisir le traitement qui te convient — AWA',
  },
  en: {
    badge: 'CHOOSING YOUR METHOD',
    title: 'Choosing the treatment\nthat suits you',
    metaDuration: '7 min read',
    metaType: 'Guide',
    metaLevel: 'Intermediate',
    metaValidated: 'Reviewed content',
    intro: 'The right questions to ask yourself to find a contraceptive method suited to your daily life, your needs, and your plans.',
    contentsTitle: 'In this article',
    topics: [
      'Questions to ask yourself',
      'No method is “best” in absolute terms',
      'Criteria that can make a difference',
      'Talking it over with a professional',
      'Key takeaways',
    ],
    section1Body: 'There is no single ideal contraceptive method for everyone. Before choosing a method, it can help to think about your habits, preferences, tolerance, and plans.',
    questions: [
      'How does my body react to hormones?',
      'Do I need a daily or weekly action, or a long-acting solution?',
      'Do I have a medium-term pregnancy plan?',
      'What is my budget, and how accessible is this contraceptive method?',
    ],
    section2Body: 'Two people can choose different methods and both have made a choice that is perfectly suited to their situation. The right choice depends in particular on how you want to use your contraception and on what you’re looking for.',
    highlightTitle: 'The key thing to remember',
    highlightText: 'A method that looks appealing on paper isn’t necessarily the one that will be simplest or most comfortable for you day to day.',
    section3Body: 'To compare several options, you can look at different criteria. The goal isn’t to know everything by heart, but to identify what really matters to you.',
    priorities: [
      {title: 'Simplicity', text: 'Some methods require a daily action, while others only need weekly attention, or far less often.'},
      {title: 'Tolerance', text: 'The effects you feel can vary from person to person. It’s important to notice how your body reacts and to talk about it if something bothers you.'},
      {title: 'Pregnancy plans', text: 'If you’re hoping for a pregnancy soon, the length of use and the return of fertility after stopping can be part of what you discuss.'},
      {title: 'Effectiveness', text: 'Effectiveness depends not only on the method chosen, but also on using it correctly and consistently.'},
    ],
    rhythmTitle: 'How often you need to use it',
    rhythmBody: 'One important difference between methods is how often you need to think about your contraception.',
    comparison: [
      {title: 'Pill', detail: 'Daily action'},
      {title: 'Patch', detail: 'Weekly change'},
      {title: 'Ring', detail: 'Cycle of several weeks'},
      {title: 'Implant', detail: 'Long-acting solution'},
      {title: 'Hormonal IUD', detail: 'Long-acting solution'},
    ],
    bodyReactionTitle: 'Watching how your body reacts',
    bodyReactionText: 'A hormonal method can feel different from one person to another. Some notice changes in their cycle, bleeding, or other side effects. These reactions don’t automatically mean the method isn’t right for you, but they’re worth paying attention to.',
    alertTitle: 'Worth watching for',
    alertText: 'If an effect is significant, persistent, or unusual, don’t stay alone with your questions. A doctor, midwife, or another healthcare professional can help you determine whether to continue, adjust, or change the method.',
    projectsTitle: 'Taking your plans into account',
    projectsBody: 'Your pregnancy plans can also influence your choice. If you want to avoid pregnancy for several years, a long-acting method may be worth considering. If you’re thinking about a pregnancy sooner, other options may fit your timeline better.',
    keepInMindTitle: 'Worth keeping in mind',
    keepInMindText: 'Talking about your pregnancy plans, even if they’re still distant or uncertain, helps the healthcare professional better guide the discussion.',
    section4Body: 'An appointment lets you weigh the benefits, constraints, and possible contraindications of each method. You can prepare a few questions beforehand so you don’t forget anything important.',
    questionCardTitle: 'Useful questions to ask',
    professionalQuestions: [
      'What are the benefits of this method for me?',
      'What side effects might I experience?',
      'How do I use it correctly?',
      'What should I do if I forget it, if it shifts out of place, or if I want to stop it?',
      'Does this method fit with my pregnancy plans?',
    ],
    professionalTipTitle: 'Good to know',
    professionalTipText: 'A midwife or doctor can take your medical history, treatments, preferences, and lifestyle into account before recommending a method.',
    summaryTitle: 'The essentials',
    summaryItems: [
      'Choose a method that fits your daily life.',
      'Take your tolerance and preferences into account.',
      'Think about your pregnancy plans and your timeline.',
      'Ask a professional for advice if you’re unsure.',
    ],
    finalTipTitle: 'Remember',
    finalTipText: 'The best method isn’t necessarily the one that seems most convenient or most popular. It’s the one that fits your situation, your needs, and your preferences, following an informed discussion with a healthcare professional.',
    disclaimerText: 'This article is for informational purposes only and does not replace personalized medical advice.',
    shareMessage: 'Choosing the treatment that suits you — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function ChooseHormonalMethodArticleScreen({
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

  const priorities = content.priorities.map((item, index) => ({
    ...item,
    icon: PRIORITY_ICONS[index],
  }));

  const comparison = content.comparison.map((item, index) => ({
    ...item,
    icon: COMPARISON_ICONS[index],
  }));

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

          <Text style={styles.body}>{content.section1Body}</Text>

          <View style={styles.checkList}>
            {content.questions.map(item => (
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

          <Text style={styles.h2}>2. {content.topics[1]}</Text>

          <Text style={styles.body}>{content.section2Body}</Text>

          <View style={styles.highlight}>
            <MaterialDesignIcons
              name="information-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.highlightCopy}>
              <Text style={styles.highlightTitle}>{content.highlightTitle}</Text>

              <Text style={styles.highlightText}>{content.highlightText}</Text>
            </View>
          </View>

          <Text style={styles.h2}>3. {content.topics[2]}</Text>

          <Text style={styles.body}>{content.section3Body}</Text>

          <View style={styles.priorityList}>
            {priorities.map(item => (
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

          <Text style={styles.h3}>{content.rhythmTitle}</Text>

          <Text style={styles.body}>{content.rhythmBody}</Text>

          <View style={styles.comparison}>
            {comparison.map((item, index) => (
              <View
                key={item.title}
                style={[
                  styles.comparisonRow,
                  index === comparison.length - 1 &&
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

          <Text style={styles.h3}>{content.bodyReactionTitle}</Text>

          <Text style={styles.body}>{content.bodyReactionText}</Text>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-circle-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.alertTitle}</Text>

              <Text style={styles.tipText}>{content.alertText}</Text>
            </View>
          </View>

          <Text style={styles.h3}>{content.projectsTitle}</Text>

          <Text style={styles.body}>{content.projectsBody}</Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="calendar-heart"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.keepInMindTitle}</Text>

              <Text style={styles.tipText}>{content.keepInMindText}</Text>
            </View>
          </View>

          <Text style={styles.h2}>4. {content.topics[3]}</Text>

          <Text style={styles.body}>{content.section4Body}</Text>

          <View style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <MaterialDesignIcons
                name="message-question-outline"
                size={22}
                color={theme.colors.primary}
              />

              <Text style={styles.questionTitle}>
                {content.questionCardTitle}
              </Text>
            </View>

            {content.professionalQuestions.map((item, index) => (
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
              <Text style={styles.tipTitle}>{content.professionalTipTitle}</Text>

              <Text style={styles.tipText}>{content.professionalTipText}</Text>
            </View>
          </View>

          <Text style={styles.h2}>5. {content.topics[4]}</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <MaterialDesignIcons
                name="check-decagram-outline"
                size={25}
                color={theme.colors.primary}
              />

              <Text style={styles.summaryTitle}>{content.summaryTitle}</Text>
            </View>

            {content.summaryItems.map(item => (
              <View key={item} style={styles.summaryItem}>
                <MaterialDesignIcons
                  name="check"
                  size={18}
                  color={theme.colors.success}
                />

                <Text style={styles.summaryText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.finalTip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={25}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.finalTipTitle}</Text>

              <Text style={styles.tipText}>{content.finalTipText}</Text>
            </View>
          </View>

          <View style={styles.disclaimer}>
            <MaterialDesignIcons
              name="shield-outline"
              size={19}
              color={theme.colors.textMuted}
            />

            <Text style={styles.disclaimerText}>{content.disclaimerText}</Text>
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
