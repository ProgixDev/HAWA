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

const ID = 'postpartum-recuperation-globale';

const HERO = require('../../assets/images/library/spm-water.png');

const NORMAL_SIGNS = [
  'Fatigue importante',
  'Saignements qui diminuent progressivement',
  'Fluctuations hormonales et émotionnelles',
];

const RECOVERY_PILLARS = [
  {
    icon: 'bed-outline',
    title: 'Repos',
    text: 'Alterner les moments d’activité et de repos aide le corps à récupérer progressivement.',
  },
  {
    icon: 'food-apple-outline',
    title: 'Alimentation',
    text: 'Manger régulièrement et boire selon ses besoins soutient la récupération au quotidien.',
  },
  {
    icon: 'account-heart-outline',
    title: 'Soutien',
    text: 'Accepter de l’aide permet de préserver de l’énergie pour les soins essentiels et la récupération.',
  },
  {
    icon: 'walk',
    title: 'Mouvement doux',
    text: 'Reprendre les gestes et déplacements progressivement, en respectant son état et son confort.',
  },
];

const SELF_CARE_TIPS = [
  'Prévoir de vrais moments de repos lorsque cela est possible.',
  'Demander de l’aide pour les tâches quotidiennes et les repas.',
  'Boire régulièrement et garder une alimentation variée.',
  'Éviter de comparer sa récupération à celle des autres.',
  'Reprendre les activités progressivement, sans chercher à tout faire immédiatement.',
];

const CONSULTATION_SIGNS = [
  {
    icon: 'alert-circle-outline',
    title: 'Symptômes qui s’aggravent',
    text: 'Une douleur ou un inconfort qui augmente au lieu de s’améliorer mérite un avis professionnel.',
  },
  {
    icon: 'water-alert-outline',
    title: 'Saignements inhabituels',
    text: 'Des saignements qui deviennent soudainement plus importants ou inhabituels doivent être signalés à un professionnel de santé.',
  },
  {
    icon: 'emoticon-sad-outline',
    title: 'Mal-être persistant',
    text: 'Si le mal-être émotionnel prend beaucoup de place ou rend le quotidien difficile, il est important d’en parler et de demander du soutien.',
  },
  {
    icon: 'medical-bag',
    title: 'Une inquiétude importante',
    text: 'En cas de doute sur la récupération, demander conseil permet d’obtenir des recommandations adaptées à sa situation.',
  },
];

const MILESTONES = [
  ['Premiers jours', 'Repos, adaptation et soins essentiels.'],
  ['Premières semaines', 'Récupération progressive et installation de nouveaux repères.'],
  ['Après la consultation post-natale', 'Faire le point sur la récupération et discuter de la reprise progressive des activités.'],
] as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function PostpartumRecoveryArticleScreen({
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
      message: 'La récupération après l’accouchement — AWA',
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
              <MaterialDesignIcons name="chevron-left" size={23} color={theme.colors.text} />
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
            <Text style={styles.badgeText}>POST-PARTUM • RÉCUPÉRATION</Text>
          </View>

          <Text style={styles.title}>
            La récupération{`\n`}après l’accouchement
          </Text>

          <View style={styles.metas}>
            {[
              ['clock-outline', '10 min de lecture'],
              ['book-open-page-variant-outline', 'Guide'],
              ['chart-bar', 'Débutant'],
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
            Ton corps a besoin de temps : ce qui est normal après la
            naissance.
          </Text>

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>Dans cet article</Text>

            {[
              'Comprendre le post-partum',
              'Les premiers jours : ralentir et récupérer',
              'Ce qui peut être normal pendant la récupération',
              'Prendre soin de soi au quotidien',
              'Bouger et reprendre les activités progressivement',
              'Sommeil, fatigue et nouveaux rythmes',
              'Les émotions après la naissance',
              'Quand demander conseil',
              'Faire le point avec un professionnel',
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

          {/* SECTION 1 */}
          <Text style={styles.h2}>1. Comprendre le post-partum</Text>

          <Text style={styles.body}>
            Le post-partum correspond à la période qui suit la naissance. Il ne
            se limite pas à quelques jours : le corps, le rythme quotidien et
            les émotions peuvent évoluer progressivement au fil des semaines.
          </Text>

          <Text style={styles.body}>
            La « quarantaine » est une expression traditionnelle souvent
            utilisée pour évoquer les premières semaines de récupération. Elle
            peut être un bon rappel : après la grossesse et l’accouchement, il
            est utile de ralentir et de laisser du temps au corps.
          </Text>

          <View style={styles.highlight}>
            <MaterialDesignIcons
              name="heart-pulse"
              size={24}
              color={theme.colors.primary}
            />
            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Une récupération globale</Text>
              <Text style={styles.tipText}>
                La récupération concerne le corps, mais aussi le sommeil,
                l’énergie, l’organisation quotidienne et l’adaptation
                émotionnelle à une nouvelle étape de vie.
              </Text>
            </View>
          </View>

          {/* SECTION 2 */}
          <Text style={styles.h2}>
            2. Les premiers jours : ralentir et récupérer
          </Text>

          <Text style={styles.body}>
            Les premiers jours peuvent être intenses. Le repos, les soins de
            base et l’adaptation au nouveau rythme sont souvent les priorités.
            Il n’est pas nécessaire de retrouver immédiatement son niveau
            d’énergie habituel.
          </Text>

          <View style={styles.pillarGrid}>
            {RECOVERY_PILLARS.map(item => (
              <View key={item.title} style={styles.pillarCard}>
                <View style={styles.pillarIcon}>
                  <MaterialDesignIcons
                    name={item.icon as never}
                    size={22}
                    color={theme.colors.primary}
                  />
                </View>
                <Text style={styles.pillarTitle}>{item.title}</Text>
                <Text style={styles.pillarText}>{item.text}</Text>
              </View>
            ))}
          </View>

          {/* SECTION 3 */}
          <Text style={styles.h2}>
            3. Ce qui peut être normal pendant la récupération
          </Text>

          <Text style={styles.body}>
            Chaque récupération est différente. Certains changements peuvent
            faire partie de la période d’adaptation et évoluer progressivement :
          </Text>

          <View style={styles.checkList}>
            {NORMAL_SIGNS.map(item => (
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
            L’intensité et la durée des symptômes peuvent varier d’une personne
            à l’autre. L’important est d’observer leur évolution et de demander
            conseil lorsqu’un changement semble préoccupant ou inhabituel.
          </Text>

          {/* SECTION 4 */}
          <Text style={styles.h2}>
            4. Prendre soin de soi au quotidien
          </Text>

          <Text style={styles.body}>
            Pendant le post-partum, les petites habitudes réalistes sont souvent
            plus utiles qu’un programme exigeant. L’objectif est de soutenir la
            récupération sans ajouter de pression.
          </Text>

          <View style={styles.tipList}>
            {SELF_CARE_TIPS.map((item, index) => (
              <View key={item} style={styles.tipRow}>
                <View style={styles.tipNumber}>
                  <Text style={styles.tipNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.tipRowText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />
            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Bon à savoir</Text>
              <Text style={styles.tipText}>
                S’entourer et accepter de l’aide n’est pas un luxe. Cela peut
                permettre de préserver de l’énergie et de rendre la récupération
                plus progressive.
              </Text>
            </View>
          </View>

          {/* SECTION 5 */}
          <Text style={styles.h2}>
            5. Bouger et reprendre les activités progressivement
          </Text>

          <Text style={styles.body}>
            La reprise des activités peut se faire étape par étape selon le
            confort, l’énergie et les recommandations reçues après
            l’accouchement. Les mouvements doux et les activités quotidiennes
            constituent déjà une reprise du mouvement.
          </Text>

          <Text style={styles.body}>
            Pour les activités plus intenses, il est préférable de progresser
            sans brûler les étapes et de tenir compte des éventuels symptômes ou
            inconforts.
          </Text>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="run-fast"
              size={24}
              color={theme.colors.warning}
            />
            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Écouter les signaux du corps</Text>
              <Text style={styles.tipText}>
                Une gêne qui augmente pendant une activité est une raison de
                ralentir et, si nécessaire, de demander un avis adapté avant de
                poursuivre ou d’augmenter l’intensité.
              </Text>
            </View>
          </View>

          {/* SECTION 6 */}
          <Text style={styles.h2}>
            6. Sommeil, fatigue et nouveaux rythmes
          </Text>

          <Text style={styles.body}>
            Le sommeil peut devenir irrégulier après la naissance. La fatigue
            accumulée peut influencer l’énergie, la concentration et l’humeur.
            Lorsque c’est possible, simplifier certaines tâches et partager les
            responsabilités peut aider.
          </Text>

          <View style={styles.timeline}>
            {MILESTONES.map(([period, description], index) => (
              <View key={period} style={styles.timelineRow}>
                <View style={styles.timelineMarker}>
                  <Text style={styles.timelineNumber}>{index + 1}</Text>
                </View>
                <View style={styles.timelineCopy}>
                  <Text style={styles.timelineTitle}>{period}</Text>
                  <Text style={styles.timelineText}>{description}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* SECTION 7 */}
          <Text style={styles.h2}>
            7. Les émotions après la naissance
          </Text>

          <Text style={styles.body}>
            Le post-partum peut s’accompagner de nombreuses émotions : joie,
            inquiétude, fatigue, sensibilité ou sentiment d’être dépassée. Ces
            ressentis peuvent varier rapidement, notamment dans une période où
            le sommeil et les habitudes quotidiennes changent.
          </Text>

          <Text style={styles.body}>
            Parler à une personne de confiance ou à un professionnel peut être
            utile lorsque les émotions deviennent difficiles à gérer ou prennent
            beaucoup de place dans le quotidien.
          </Text>

          <View style={styles.highlight}>
            <MaterialDesignIcons
              name="account-heart-outline"
              size={24}
              color={theme.colors.primary}
            />
            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Demander du soutien est normal</Text>
              <Text style={styles.tipText}>
                Il n’est pas nécessaire d’attendre d’être totalement épuisée ou
                dépassée pour parler de ce que l’on ressent et chercher du
                soutien.
              </Text>
            </View>
          </View>

          {/* SECTION 8 */}
          <Text style={styles.h2}>8. Quand demander conseil ?</Text>

          <Text style={styles.body}>
            Certaines situations méritent d’être discutées avec un professionnel
            de santé, surtout lorsqu’elles s’aggravent, persistent ou créent une
            inquiétude importante.
          </Text>

          <View style={styles.consultList}>
            {CONSULTATION_SIGNS.map(item => (
              <View key={item.title} style={styles.consultCard}>
                <View style={styles.consultIcon}>
                  <MaterialDesignIcons
                    name={item.icon as never}
                    size={21}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.consultCopy}>
                  <Text style={styles.consultTitle}>{item.title}</Text>
                  <Text style={styles.consultText}>{item.text}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* SECTION 9 */}
          <Text style={styles.h2}>
            9. Faire le point avec un professionnel
          </Text>

          <Text style={styles.body}>
            Les rendez-vous de suivi sont l’occasion de parler de la
            récupération, des symptômes, de la reprise des activités et des
            questions qui restent en suspens. Préparer quelques questions à
            l’avance peut aider à ne rien oublier.
          </Text>

          <View style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <MaterialDesignIcons
                name="message-question-outline"
                size={22}
                color={theme.colors.primary}
              />
              <Text style={styles.questionTitle}>
                Questions que tu peux préparer
              </Text>
            </View>

            {[
              'Est-ce que ma récupération évolue comme prévu pour ma situation ?',
              'Quelles activités puis-je reprendre progressivement ?',
              'Quels symptômes dois-je surveiller ?',
              'Quand puis-je envisager une reprise sportive plus intense ?',
              'Ai-je besoin de conseils ou d’une rééducation particulière ?',
            ].map((item, index) => (
              <View key={item} style={styles.questionRow}>
                <View style={styles.questionBullet}>
                  <Text style={styles.questionNumber}>{index + 1}</Text>
                </View>
                <Text style={styles.questionText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* SECTION 10 */}
          <Text style={styles.h2}>10. À retenir</Text>

          <View style={styles.summaryCard}>
            {[
              'La récupération après l’accouchement est progressive et différente pour chaque personne.',
              'Le repos et le soutien peuvent faire partie intégrante de la récupération.',
              'Les changements physiques, le sommeil et les émotions peuvent évoluer au fil des semaines.',
              'Reprendre les activités progressivement permet de mieux respecter son énergie et son confort.',
              'En cas de symptôme inhabituel, persistant ou inquiétant, demander conseil est une bonne démarche.',
            ].map(item => (
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
              name="heart-outline"
              size={25}
              color={theme.colors.primary}
            />
            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Prends le temps nécessaire</Text>
              <Text style={styles.tipText}>
                La récupération n’est pas une course. Avancer progressivement,
                respecter ses besoins et demander du soutien lorsque nécessaire
                sont déjà des étapes importantes.
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
              Cet article a une vocation informative et ne remplace pas un avis
              médical personnalisé. En cas de symptôme important, persistant ou
              inquiétant, contacte un professionnel de santé.
            </Text>
          </View>
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={10} scrollRef={scrollRef} />
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
    color: theme.colors.textSecondary,
    fontWeight: '600',
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
  body: {
    marginTop: 9,
    fontSize: 14,
    lineHeight: 21.5,
    color: theme.colors.textSecondary,
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
  alert: {
    marginTop: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tipCopy: {flex: 1, marginLeft: 11},
  tipTitle: {fontSize: 13, color: theme.colors.text, fontWeight: '800'},
  tipText: {
    marginTop: 4,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textMuted,
  },
  pillarGrid: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  pillarCard: {
    width: '48.5%',
    padding: 13,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pillarIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  pillarTitle: {
    marginTop: 9,
    fontSize: 12.5,
    color: theme.colors.text,
    fontWeight: '800',
  },
  pillarText: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 16.5,
    color: theme.colors.textMuted,
  },
  checkList: {
    marginTop: 13,
    padding: 13,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
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
    fontSize: 12,
    lineHeight: 17,
  },
  tipList: {
    marginTop: 14,
    padding: 14,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 11,
  },
  tipNumber: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  tipNumberText: {fontSize: 10, color: theme.colors.primary, fontWeight: '800'},
  tipRowText: {
    flex: 1,
    marginLeft: 10,
    paddingTop: 2,
    fontSize: 12,
    lineHeight: 17.5,
    color: theme.colors.textSecondary,
  },
  timeline: {
    marginTop: 15,
    padding: 15,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  timelineMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  timelineNumber: {fontSize: 11, color: theme.colors.primary, fontWeight: '800'},
  timelineCopy: {flex: 1, marginLeft: 11},
  timelineTitle: {fontSize: 12.5, color: theme.colors.text, fontWeight: '800'},
  timelineText: {
    marginTop: 3,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textMuted,
  },
  consultList: {marginTop: 14, gap: 10},
  consultCard: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  consultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  consultCopy: {flex: 1, marginLeft: 11},
  consultTitle: {fontSize: 13, color: theme.colors.text, fontWeight: '800'},
  consultText: {
    marginTop: 4,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textMuted,
  },
  questionCard: {
    marginTop: 15,
    padding: 15,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
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
    flex: 1,
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
  questionNumber: {fontSize: 10, color: theme.colors.primary, fontWeight: '800'},
  questionText: {
    flex: 1,
    marginLeft: 9,
    paddingTop: 2,
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },
  summaryCard: {
    marginTop: 15,
    padding: 16,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
