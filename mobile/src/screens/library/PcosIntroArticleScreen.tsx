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

const ID = 'pcos-comprendre-sopk';

const HERO = require('../../assets/images/library/featured-comfort-hero.png');

// Icons stay language-neutral — only the accompanying TEXT moves into the
// bilingual CONTENT object below, keyed by index to stay aligned with these.
const CONSULT_ICONS = [
  'calendar-alert',
  'face-woman-shimmer',
  'hair-dryer',
  'baby-heart-outline',
  'alert-circle-outline',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'SOPK • GUIDE ESSENTIEL',
    title: 'Comprendre\nle SOPK',
    metaDuration: '10 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu éducatif',
    intro:
      'Le syndrome des ovaires polykystiques, souvent appelé SOPK, est un trouble hormonal fréquent qui peut influencer les cycles, l’ovulation, la peau, les cheveux, le métabolisme et parfois la fertilité.',
    introSecondary:
      'Son expression varie beaucoup d’une femme à l’autre. Comprendre le SOPK permet surtout de mieux identifier ses symptômes, de savoir quand demander un avis médical et de suivre son évolution sans culpabiliser.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Qu’est-ce que le SOPK ?',
      'Pourquoi le SOPK apparaît-il ?',
      'Les principaux signes',
      'Comment le diagnostic est-il posé ?',
      'SOPK et ovulation',
      'SOPK et fertilité',
      'SOPK et poids / métabolisme',
      'Peau, cheveux et pilosité',
      'Comment prendre en charge le SOPK ?',
      'Idées reçues',
      'Quand consulter ?',
      'À retenir',
    ],
    s1Heading: 'Qu’est-ce que le SOPK ?',
    s1Body1:
      'Le syndrome des ovaires polykystiques (SOPK) est un trouble hormonal fréquent qui peut modifier le fonctionnement habituel des ovaires et l’équilibre de certaines hormones.',
    s1Body2:
      'Chez certaines femmes, le principal problème est une ovulation irrégulière. Chez d’autres, ce sont plutôt l’acné, la pilosité, la chute de cheveux ou des manifestations métaboliques qui attirent l’attention.',
    s1TipTitle: 'Bon à savoir',
    s1TipText:
      'Malgré son nom, le SOPK ne signifie pas nécessairement que les ovaires contiennent des « kystes ». Le terme historique peut être trompeur et l’échographie n’est pas à elle seule suffisante pour poser le diagnostic.',
    s2Heading: 'Pourquoi le SOPK apparaît-il ?',
    s2Body1:
      'Il n’existe pas une seule cause du SOPK. Son apparition semble résulter de plusieurs facteurs qui peuvent se combiner : prédisposition familiale, fonctionnement hormonal, ovulation, métabolisme et facteurs individuels.',
    s2Factors: [
      'Prédisposition familiale et facteurs génétiques',
      'Dérèglements de l’ovulation',
      'Excès relatif d’androgènes',
      'Résistance à l’insuline chez certaines femmes',
      'Facteurs métaboliques et environnementaux',
    ],
    s2NeutralText:
      'Le SOPK n’est pas une faute personnelle. Il ne résulte pas simplement d’un manque de volonté, d’une mauvaise alimentation ou d’un manque d’activité physique.',
    s3Heading: 'Les principaux signes',
    s3Body1:
      'Le SOPK peut se manifester de manière très différente. Certaines femmes présentent plusieurs symptômes tandis que d’autres n’en remarquent que très peu.',
    s3Signs: [
      'Des cycles irréguliers, très espacés ou parfois absents',
      'Une ovulation irrégulière ou difficile à prévoir',
      'Une acné persistante, notamment sur le bas du visage',
      'Une pilosité plus importante sur le visage, le torse ou le corps',
      'Une perte de cheveux de type hormonal',
      'Une prise de poids ou des difficultés à perdre du poids',
      'Des difficultés à concevoir',
    ],
    s3AlertTitle: 'Important',
    s3AlertText:
      'La présence d’un de ces symptômes ne signifie pas automatiquement que tu as un SOPK. Plusieurs autres situations peuvent provoquer des symptômes similaires.',
    s4Heading: 'Comment le diagnostic est-il posé ?',
    s4Body1:
      'Le diagnostic du SOPK est médical. Le professionnel de santé commence généralement par discuter des cycles, des symptômes, des antécédents et des traitements éventuels.',
    s4Body2:
      'Selon la situation, des analyses hormonales et une échographie peuvent également être proposées.',
    s4Points: [
      'Cycles irréguliers ou ovulation peu fréquente',
      'Signes d’un excès d’androgènes : acné, pilosité, chute de cheveux ou résultats biologiques',
      'Aspect ovarien compatible avec un SOPK à l’échographie, lorsque cet examen est indiqué',
    ],
    s4Body3:
      'Le médecin doit également rechercher d’autres causes possibles d’irrégularité des cycles ou d’excès d’androgènes avant de retenir un diagnostic de SOPK.',
    s5Heading: 'SOPK et ovulation',
    s5Body1:
      'L’ovulation correspond à la libération d’un ovocyte par l’ovaire. Dans le SOPK, l’ovulation peut être moins fréquente ou plus difficile à prévoir.',
    s5Body2:
      'Cela peut expliquer pourquoi les cycles sont parfois longs, irréguliers ou difficiles à anticiper.',
    s5HighlightTitle: 'Suivre son cycle',
    s5HighlightText:
      'Noter les dates des règles, les symptômes et les éventuels signes d’ovulation peut aider à mieux comprendre son propre fonctionnement.',
    s6Heading: 'SOPK et fertilité',
    s6Body1:
      'Comme l’ovulation peut être irrégulière, certaines femmes ayant un SOPK peuvent rencontrer plus de difficultés à concevoir.',
    s6Body2:
      'Cela ne signifie cependant pas que le SOPK empêche automatiquement une grossesse. De nombreuses femmes ayant un SOPK conçoivent naturellement ou avec un accompagnement médical adapté.',
    s6TipTitle: 'À retenir',
    s6TipText:
      'Difficultés à concevoir ne signifie pas impossibilité de concevoir. Si une grossesse est souhaitée, un médecin ou une sage-femme peut proposer une stratégie adaptée à la situation.',
    s7Heading: 'SOPK et poids / métabolisme',
    s7Body1:
      'Le SOPK peut être associé à des modifications du métabolisme, notamment chez certaines femmes une résistance à l’insuline.',
    s7Body2:
      'Cependant, le poids ne permet pas à lui seul de diagnostiquer ou d’exclure un SOPK. Une femme mince peut avoir un SOPK, tout comme une femme en surpoids peut ne pas en avoir.',
    s7NeutralText:
      'Le suivi doit prendre en compte la santé globale et pas uniquement le chiffre affiché sur la balance.',
    s8Heading: 'Peau, cheveux et pilosité',
    s8Body1:
      'Un excès relatif d’androgènes peut influencer les glandes sébacées et les follicules pileux.',
    s8Body2:
      'Cela peut se traduire par une acné persistante, une pilosité plus importante ou une perte de cheveux selon les femmes.',
    s8Items: [
      'Acné hormonale',
      'Pilosité faciale ou corporelle plus importante',
      'Cheveux plus fins ou chute de cheveux',
    ],
    s9Heading: 'Comment prendre en charge le SOPK ?',
    s9Body1:
      'Il n’existe pas une seule prise en charge valable pour toutes les femmes. Le choix dépend des symptômes, des objectifs et de la situation médicale.',
    s9Body2:
      'L’objectif peut être différent selon les périodes de la vie : régulariser les cycles, améliorer certains symptômes, protéger la santé métabolique ou accompagner un projet de grossesse.',
    s9MiniTitle: 'Habitudes favorables à la santé',
    s9Lifestyle: [
      'Avoir une alimentation variée et régulière, adaptée à ses besoins',
      'Pratiquer une activité physique régulière que l’on peut maintenir dans le temps',
      'Veiller à un sommeil suffisamment régulier',
      'Suivre l’évolution des cycles et des symptômes',
      'Ne pas culpabiliser en cas de variation de poids ou de symptômes',
    ],
    s9Body3:
      'Selon les besoins, un professionnel de santé peut également proposer des traitements pour certains symptômes ou pour accompagner un projet de grossesse.',
    s9AlertTitle: 'Pas d’automédication',
    s9AlertText:
      'Les traitements hormonaux, les médicaments métaboliques et les compléments alimentaires doivent être discutés avec un professionnel de santé.',
    s10Heading: 'Idées reçues sur le SOPK',
    s10Myths: [
      'Le SOPK signifie forcément « avoir des kystes » : le nom peut être trompeur. Le diagnostic ne repose pas uniquement sur la présence de kystes.',
      'Toutes les femmes ayant un SOPK sont en surpoids : le SOPK peut concerner des femmes de toutes corpulences.',
      'Le SOPK empêche forcément une grossesse : l’ovulation peut être irrégulière, mais une grossesse reste possible.',
      'Un seul symptôme suffit pour diagnostiquer un SOPK : le diagnostic nécessite une évaluation globale.',
      'Le SOPK disparaît simplement avec l’âge : son expression peut évoluer au cours de la vie, mais le suivi reste important.',
    ],
    s11Heading: 'Quand consulter ?',
    s11Body1:
      'Un avis médical est particulièrement pertinent lorsque les cycles deviennent très irréguliers, disparaissent pendant plusieurs mois, ou lorsqu’apparaissent des symptômes inhabituels.',
    s11ConsultItems: [
      'Cycles très irréguliers ou absents',
      'Acné ou pilosité inhabituelle',
      'Chute de cheveux importante',
      'Difficultés à concevoir',
      'Symptômes qui évoluent rapidement',
    ],
    s12Heading: 'À retenir',
    s12SummaryTitle: 'Les points essentiels',
    s12SummaryItems: [
      'Le SOPK est un trouble hormonal fréquent.',
      'Il peut se manifester de nombreuses façons.',
      'Toutes les femmes ayant un SOPK ne présentent pas les mêmes symptômes.',
      'Le poids ne suffit pas à diagnostiquer ou exclure un SOPK.',
      'Le diagnostic nécessite une évaluation médicale globale.',
      'Le SOPK peut influencer l’ovulation et parfois la fertilité.',
      'Une prise en charge personnalisée permet de répondre aux besoins de chaque femme.',
    ],
    finalNoteTitle: 'Un guide pour mieux comprendre',
    finalNoteText:
      'Cet article est destiné à l’information générale et ne remplace pas une consultation médicale. Chaque situation est différente : en cas de doute ou de symptômes persistants, demande conseil à un professionnel de santé.',
    shareMessage: 'Comprendre le SOPK — AWA',
  },
  en: {
    badge: 'PCOS • ESSENTIAL GUIDE',
    title: 'Understanding\nPCOS',
    metaDuration: '10 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Educational content',
    intro:
      'Polycystic ovary syndrome, often called PCOS, is a common hormonal condition that can affect your cycles, ovulation, skin, hair, metabolism, and sometimes fertility.',
    introSecondary:
      'How it shows up varies a lot from one woman to another. Understanding PCOS mainly helps you recognize its symptoms, know when to seek medical advice, and track how it evolves without self-blame.',
    contentsTitle: 'In this article',
    topics: [
      'What is PCOS?',
      'Why does PCOS happen?',
      'The main signs',
      'How is it diagnosed?',
      'PCOS and ovulation',
      'PCOS and fertility',
      'PCOS and weight / metabolism',
      'Skin, hair, and body hair',
      'How is PCOS managed?',
      'Common misconceptions',
      'When to see a doctor',
      'Key takeaways',
    ],
    s1Heading: 'What is PCOS?',
    s1Body1:
      'Polycystic ovary syndrome (PCOS) is a common hormonal condition that can change the ovaries’ usual functioning and the balance of certain hormones.',
    s1Body2:
      'For some women, the main issue is irregular ovulation. For others, it’s acne, excess hair growth, hair loss, or metabolic signs that stand out first.',
    s1TipTitle: 'Good to know',
    s1TipText:
      'Despite its name, PCOS doesn’t necessarily mean the ovaries contain “cysts.” The historical term can be misleading, and an ultrasound alone isn’t enough to make the diagnosis.',
    s2Heading: 'Why does PCOS happen?',
    s2Body1:
      'There isn’t a single cause of PCOS. It appears to result from several factors that can combine: family predisposition, hormonal functioning, ovulation, metabolism, and individual factors.',
    s2Factors: [
      'Family predisposition and genetic factors',
      'Disruptions in ovulation',
      'Relative androgen excess',
      'Insulin resistance in some women',
      'Metabolic and environmental factors',
    ],
    s2NeutralText:
      'PCOS is not a personal failing. It doesn’t simply result from a lack of willpower, poor diet, or insufficient physical activity.',
    s3Heading: 'The main signs',
    s3Body1:
      'PCOS can show up very differently from one woman to another. Some have several symptoms, while others notice very few.',
    s3Signs: [
      'Irregular, widely spaced, or sometimes absent cycles',
      'Irregular or hard-to-predict ovulation',
      'Persistent acne, particularly on the lower face',
      'Increased hair growth on the face, chest, or body',
      'Hormonal-pattern hair loss',
      'Weight gain or difficulty losing weight',
      'Difficulty conceiving',
    ],
    s3AlertTitle: 'Important',
    s3AlertText:
      'Having one of these symptoms doesn’t automatically mean you have PCOS. Several other conditions can cause similar symptoms.',
    s4Heading: 'How is it diagnosed?',
    s4Body1:
      'Diagnosing PCOS is a medical process. A healthcare provider usually starts by discussing your cycles, symptoms, medical history, and any treatments you’re taking.',
    s4Body2:
      'Depending on the situation, hormonal blood tests and an ultrasound may also be offered.',
    s4Points: [
      'Irregular cycles or infrequent ovulation',
      'Signs of androgen excess: acne, excess hair growth, hair loss, or blood test results',
      'Ovarian appearance consistent with PCOS on ultrasound, when this exam is indicated',
    ],
    s4Body3:
      'The doctor must also rule out other possible causes of irregular cycles or androgen excess before confirming a PCOS diagnosis.',
    s5Heading: 'PCOS and ovulation',
    s5Body1:
      'Ovulation is the release of an egg (oocyte) from the ovary. In PCOS, ovulation can be less frequent or harder to predict.',
    s5Body2:
      'This can explain why cycles are sometimes long, irregular, or hard to anticipate.',
    s5HighlightTitle: 'Tracking your cycle',
    s5HighlightText:
      'Recording your period dates, symptoms, and any signs of ovulation can help you better understand your own patterns.',
    s6Heading: 'PCOS and fertility',
    s6Body1:
      'Because ovulation can be irregular, some women with PCOS may have more difficulty conceiving.',
    s6Body2:
      'This doesn’t mean, however, that PCOS automatically prevents pregnancy. Many women with PCOS conceive naturally or with appropriate medical support.',
    s6TipTitle: 'Keep in mind',
    s6TipText:
      'Difficulty conceiving doesn’t mean it’s impossible. If you’re hoping to become pregnant, a doctor or midwife can suggest a strategy suited to your situation.',
    s7Heading: 'PCOS and weight / metabolism',
    s7Body1:
      'PCOS can be associated with metabolic changes, including insulin resistance in some women.',
    s7Body2:
      'However, weight alone cannot diagnose or rule out PCOS. A slim woman can have PCOS, just as a woman who is overweight may not have it.',
    s7NeutralText:
      'Follow-up care should consider overall health, not just the number on the scale.',
    s8Heading: 'Skin, hair, and body hair',
    s8Body1:
      'Relative androgen excess can affect the sebaceous glands and hair follicles.',
    s8Body2:
      'Depending on the woman, this can show up as persistent acne, increased hair growth, or hair loss.',
    s8Items: [
      'Hormonal acne',
      'Increased facial or body hair',
      'Thinning hair or hair loss',
    ],
    s9Heading: 'How is PCOS managed?',
    s9Body1:
      'There is no single approach to managing PCOS that works for every woman. The choice depends on symptoms, goals, and medical circumstances.',
    s9Body2:
      'The goal can differ depending on the stage of life: regulating cycles, improving certain symptoms, protecting metabolic health, or supporting a pregnancy plan.',
    s9MiniTitle: 'Health-supporting habits',
    s9Lifestyle: [
      'Eating a varied, regular diet suited to your needs',
      'Engaging in regular physical activity that you can sustain over time',
      'Maintaining sufficiently regular sleep',
      'Tracking how your cycles and symptoms change over time',
      'Not blaming yourself for changes in weight or symptoms',
    ],
    s9Body3:
      'Depending on your needs, a healthcare provider may also offer treatments for certain symptoms or to support a pregnancy plan.',
    s9AlertTitle: 'Don’t self-medicate',
    s9AlertText:
      'Hormonal treatments, metabolic medications, and dietary supplements should all be discussed with a healthcare provider.',
    s10Heading: 'Common misconceptions about PCOS',
    s10Myths: [
      'PCOS always means having “cysts”: the name can be misleading. The diagnosis doesn’t rely solely on the presence of cysts.',
      'All women with PCOS are overweight: PCOS can affect women of all body types.',
      'PCOS always prevents pregnancy: ovulation may be irregular, but pregnancy is still possible.',
      'A single symptom is enough to diagnose PCOS: diagnosis requires a comprehensive evaluation.',
      'PCOS simply goes away with age: how it presents can change over a lifetime, but ongoing follow-up remains important.',
    ],
    s11Heading: 'When to see a doctor',
    s11Body1:
      'Medical advice is particularly worthwhile when cycles become very irregular, stop for several months, or when unusual symptoms appear.',
    s11ConsultItems: [
      'Very irregular or absent cycles',
      'Unusual acne or hair growth',
      'Significant hair loss',
      'Difficulty conceiving',
      'Rapidly changing symptoms',
    ],
    s12Heading: 'Key takeaways',
    s12SummaryTitle: 'The essential points',
    s12SummaryItems: [
      'PCOS is a common hormonal condition.',
      'It can show up in many different ways.',
      'Not all women with PCOS have the same symptoms.',
      'Weight alone is not enough to diagnose or rule out PCOS.',
      'Diagnosis requires a comprehensive medical evaluation.',
      'PCOS can affect ovulation and sometimes fertility.',
      'A personalized care approach helps meet each woman’s needs.',
    ],
    finalNoteTitle: 'A guide to better understanding',
    finalNoteText:
      'This article is intended for general information and does not replace a medical consultation. Every situation is different: if in doubt or if symptoms persist, seek advice from a healthcare professional.',
    shareMessage: 'Understanding PCOS — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function PcosIntroArticleScreen({
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
          {/* HEADER */}
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

          <Text style={styles.introSecondary}>{content.introSecondary}</Text>

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
          <Text style={styles.h2}>1. {content.s1Heading}</Text>

          <Text style={styles.body}>{content.s1Body1}</Text>

          <Text style={styles.body}>{content.s1Body2}</Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.s1TipTitle}</Text>

              <Text style={styles.tipText}>{content.s1TipText}</Text>
            </View>
          </View>

          {/* 2 */}
          <Text style={styles.h2}>2. {content.s2Heading}</Text>

          <Text style={styles.body}>{content.s2Body1}</Text>

          <View style={styles.checkList}>
            {content.s2Factors.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="circle-small"
                  size={20}
                  color={theme.colors.primary}
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

            <Text style={styles.neutralText}>{content.s2NeutralText}</Text>
          </View>

          {/* 3 */}
          <Text style={styles.h2}>3. {content.s3Heading}</Text>

          <Text style={styles.body}>{content.s3Body1}</Text>

          <View style={styles.checkList}>
            {content.s3Signs.map(item => (
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

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.s3AlertTitle}</Text>

              <Text style={styles.tipText}>{content.s3AlertText}</Text>
            </View>
          </View>

          {/* 4 */}
          <Text style={styles.h2}>4. {content.s4Heading}</Text>

          <Text style={styles.body}>{content.s4Body1}</Text>

          <Text style={styles.body}>{content.s4Body2}</Text>

          <View style={styles.numberedCard}>
            {content.s4Points.map((item, index) => (
              <View key={item} style={styles.numberedRow}>
                <View style={styles.numberCircle}>
                  <Text style={styles.numberCircleText}>{index + 1}</Text>
                </View>

                <Text style={styles.numberedText}>{item}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.body}>{content.s4Body3}</Text>

          {/* 5 */}
          <Text style={styles.h2}>5. {content.s5Heading}</Text>

          <Text style={styles.body}>{content.s5Body1}</Text>

          <Text style={styles.body}>{content.s5Body2}</Text>

          <View style={styles.highlightBox}>
            <MaterialDesignIcons
              name="calendar-heart"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.highlightCopy}>
              <Text style={styles.highlightTitle}>
                {content.s5HighlightTitle}
              </Text>

              <Text style={styles.highlightText}>
                {content.s5HighlightText}
              </Text>
            </View>
          </View>

          {/* 6 */}
          <Text style={styles.h2}>6. {content.s6Heading}</Text>

          <Text style={styles.body}>{content.s6Body1}</Text>

          <Text style={styles.body}>{content.s6Body2}</Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="heart-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.s6TipTitle}</Text>

              <Text style={styles.tipText}>{content.s6TipText}</Text>
            </View>
          </View>

          {/* 7 */}
          <Text style={styles.h2}>7. {content.s7Heading}</Text>

          <Text style={styles.body}>{content.s7Body1}</Text>

          <Text style={styles.body}>{content.s7Body2}</Text>

          <View style={styles.neutralBox}>
            <MaterialDesignIcons
              name="scale-balance"
              size={22}
              color={theme.colors.textMuted}
            />

            <Text style={styles.neutralText}>{content.s7NeutralText}</Text>
          </View>

          {/* 8 */}
          <Text style={styles.h2}>8. {content.s8Heading}</Text>

          <Text style={styles.body}>{content.s8Body1}</Text>

          <Text style={styles.body}>{content.s8Body2}</Text>

          <View style={styles.checkList}>
            {content.s8Items.map(item => (
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

          {/* 9 */}
          <Text style={styles.h2}>9. {content.s9Heading}</Text>

          <Text style={styles.body}>{content.s9Body1}</Text>

          <Text style={styles.body}>{content.s9Body2}</Text>

          <View style={styles.sectionMiniTitle}>
            <MaterialDesignIcons
              name="heart-pulse"
              size={20}
              color={theme.colors.primary}
            />

            <Text style={styles.sectionMiniTitleText}>
              {content.s9MiniTitle}
            </Text>
          </View>

          <View style={styles.checkList}>
            {content.s9Lifestyle.map(item => (
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

          <Text style={styles.body}>{content.s9Body3}</Text>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="doctor"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.s9AlertTitle}</Text>

              <Text style={styles.tipText}>{content.s9AlertText}</Text>
            </View>
          </View>

          {/* 10 */}
          <Text style={styles.h2}>10. {content.s10Heading}</Text>

          <View style={styles.checkList}>
            {content.s10Myths.map(item => (
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

          {/* 11 */}
          <Text style={styles.h2}>11. {content.s11Heading}</Text>

          <Text style={styles.body}>{content.s11Body1}</Text>

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

                <Text style={styles.consultText}>
                  {content.s11ConsultItems[index]}
                </Text>
              </View>
            ))}
          </View>

          {/* 12 */}
          <Text style={styles.h2}>12. {content.s12Heading}</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <MaterialDesignIcons
                name="check-decagram-outline"
                size={24}
                color={theme.colors.primary}
              />

              <Text style={styles.summaryTitle}>
                {content.s12SummaryTitle}
              </Text>
            </View>

            {content.s12SummaryItems.map(item => (
              <View key={item} style={styles.summaryRow}>
                <MaterialDesignIcons
                  name="check"
                  size={17}
                  color={theme.colors.success}
                />

                <Text style={styles.summaryText}>{item}</Text>
              </View>
            ))}
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

      <ReadingControls articleId={ID} durationMinutes={10} scrollRef={scrollRef} />
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
      backgroundColor: withAlpha(theme.colors.surface, 0.9),
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
      width: 25,
      color: theme.colors.primary,
      fontSize: 11.5,
      fontWeight: '800',
    },

    contentText: {
      flex: 1,
      fontSize: 12.3,
      lineHeight: 17,
      color: theme.colors.text,
    },

    h2: {
      marginTop: 25,
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

    tip: {
      marginTop: 16,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'flex-start',
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
      marginTop: 4,
      fontSize: 11.5,
      lineHeight: 17,
      color: theme.colors.textSecondary,
    },

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

    checkText: {
      flex: 1,
      color: theme.colors.textSecondary,
      fontSize: 12,
      lineHeight: 17,
    },

    alert: {
      marginTop: 15,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'flex-start',
      borderRadius: 12,
      backgroundColor: withAlpha(theme.colors.warning, 0.12),
    },

    neutralBox: {
      marginTop: 15,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 9,
      borderRadius: 12,
      backgroundColor: theme.colors.surfaceSecondary,
    },

    neutralText: {
      flex: 1,
      fontSize: 11.5,
      lineHeight: 17,
      color: theme.colors.textSecondary,
    },

    numberedCard: {
      marginTop: 14,
      padding: 14,
      borderRadius: 13,
      backgroundColor: theme.colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },

    numberedRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 13,
    },

    numberCircle: {
      width: 27,
      height: 27,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primarySoft,
    },

    numberCircleText: {
      color: theme.colors.primary,
      fontSize: 11,
      fontWeight: '800',
    },

    numberedText: {
      flex: 1,
      marginLeft: 10,
      paddingTop: 3,
      color: theme.colors.textSecondary,
      fontSize: 12,
      lineHeight: 17,
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

    highlightCopy: {
      flex: 1,
      marginLeft: 10,
    },

    highlightTitle: {
      color: theme.colors.text,
      fontSize: 13,
      fontWeight: '800',
    },

    highlightText: {
      marginTop: 4,
      color: theme.colors.textSecondary,
      fontSize: 11.5,
      lineHeight: 17,
    },

    sectionMiniTitle: {
      marginTop: 17,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    sectionMiniTitleText: {
      color: theme.colors.text,
      fontSize: 13,
      fontWeight: '800',
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
      color: theme.colors.textSecondary,
      fontSize: 12,
      lineHeight: 17,
    },

    summaryCard: {
      marginTop: 15,
      padding: 15,
      borderRadius: 14,
      backgroundColor: theme.colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },

    summaryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      marginBottom: 12,
    },

    summaryTitle: {
      color: theme.colors.text,
      fontSize: 15,
      fontWeight: '800',
    },

    summaryRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      marginBottom: 9,
    },

    summaryText: {
      flex: 1,
      color: theme.colors.textSecondary,
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

    finalNoteCopy: {
      flex: 1,
      marginLeft: 10,
    },

    finalNoteTitle: {
      color: theme.colors.text,
      fontSize: 13,
      fontWeight: '800',
    },

    finalNoteText: {
      marginTop: 4,
      color: theme.colors.textSecondary,
      fontSize: 11,
      lineHeight: 16.5,
    },
  });
}
