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

const ID = 'patch-le-patch-contraceptif';

const HERO = require('../../assets/images/library/cycle-phases-hero.png');

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const PATCH_FACT_ICONS = [
  'calendar-week-outline',
  'water-outline',
  'shield-check-outline',
  'alert-circle-outline',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'PATCH CONTRACEPTIF',
    title: 'Le patch\ncontraceptif',
    metaDuration: '5 min de lecture',
    metaType: 'Article',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Une alternative hebdomadaire à la pilule quotidienne.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Comment fonctionne le patch',
      'Le rythme d’application',
      'Ce qu’il faut savoir',
      'À retenir',
    ],
    section1Body:
      'Le patch diffuse en continu des hormones à travers la peau, avec une action comparable à celle de la pilule combinée : il empêche l’ovulation et épaissit la glaire cervicale.',
    tip1Title: 'Bon à savoir',
    tip1Text:
      'Son principal avantage est de ne pas nécessiter une prise quotidienne.',
    section2Body:
      'Le patch se change généralement une fois par semaine pendant trois semaines, suivies d’une semaine sans patch.',
    applicationTips: [
      'Changer de zone d’application à chaque pose',
      'Vérifier qu’il reste bien collé',
      'Le poser sur une peau propre et sèche',
    ],
    sectionIntro:
      'Les points essentiels à connaître avant et pendant son utilisation.',
    facts: [
      {title: 'Chaque semaine', text: 'Le patch se remplace une fois par semaine.'},
      {title: 'Peau sèche', text: 'Il doit être posé sur une peau propre et sèche.'},
      {title: 'Protection', text: 'Il agit en continu lorsqu’il est utilisé correctement.'},
      {title: 'À surveiller', text: 'Une irritation locale peut parfois apparaître.'},
    ],
    comparisonTitle: 'Avantages & limites',
    advantageTitle: 'Avantages',
    advantages: [
      '• Une application par semaine',
      '• Pas de prise quotidienne',
      '• Diffusion hormonale continue',
    ],
    limitTitle: 'Limites',
    limits: [
      'Ne protège pas des IST',
      'Peut provoquer une irritation cutanée',
      'Nécessite de respecter le rythme de remplacement',
    ],
    alertTitle: 'À noter',
    alertText:
      'Une légère irritation peut apparaître à l’endroit de la pose. Alterner les zones d’application peut aider à limiter ce problème.',
    rememberTitle: 'Les 3 essentiels',
    remember: [
      'Changer le patch chaque semaine.',
      'Vérifier régulièrement son adhérence.',
      'Demander conseil à un professionnel de santé si nécessaire.',
    ],
    shareMessage: 'Le patch contraceptif — AWA',
  },
  en: {
    badge: 'CONTRACEPTIVE PATCH',
    title: 'The contraceptive\npatch',
    metaDuration: '5 min read',
    metaType: 'Article',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'A weekly alternative to the daily pill.',
    contentsTitle: 'In this article',
    topics: [
      'How the patch works',
      'Application schedule',
      'What you need to know',
      'Key takeaways',
    ],
    section1Body:
      'The patch continuously releases hormones through the skin, working in a way comparable to the combined pill: it prevents ovulation and thickens cervical mucus.',
    tip1Title: 'Good to know',
    tip1Text:
      'Its main advantage is that it doesn’t require a daily dose.',
    section2Body:
      'The patch is generally changed once a week for three weeks, followed by one week without a patch.',
    applicationTips: [
      'Change the application site each time',
      'Check that it’s still firmly stuck',
      'Apply it to clean, dry skin',
    ],
    sectionIntro:
      'The key points to know before and during use.',
    facts: [
      {title: 'Every week', text: 'The patch is replaced once a week.'},
      {title: 'Dry skin', text: 'It must be applied to clean, dry skin.'},
      {title: 'Protection', text: 'It works continuously when used correctly.'},
      {title: 'Watch for', text: 'Local irritation can sometimes occur.'},
    ],
    comparisonTitle: 'Advantages & limitations',
    advantageTitle: 'Advantages',
    advantages: [
      '• One application per week',
      '• No daily dose',
      '• Continuous hormone release',
    ],
    limitTitle: 'Limitations',
    limits: [
      'Doesn’t protect against STIs',
      'May cause skin irritation',
      'Requires sticking to the replacement schedule',
    ],
    alertTitle: 'Please note',
    alertText:
      'Slight irritation may appear at the application site. Alternating application sites can help limit this.',
    rememberTitle: 'The 3 essentials',
    remember: [
      'Change the patch every week.',
      'Check regularly that it’s sticking well.',
      'Ask a healthcare professional for advice if needed.',
    ],
    shareMessage: 'The contraceptive patch — AWA',
  },
  es: {
    badge: 'PARCHE ANTICONCEPTIVO',
    title: 'El parche\nanticonceptivo',
    metaDuration: '5 min de lectura',
    metaType: 'Artículo',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Una alternativa semanal a la píldora diaria.',
    contentsTitle: 'En este artículo',
    topics: [
      'Cómo funciona el parche',
      'El ritmo de aplicación',
      'Lo que hay que saber',
      'Lo esencial',
    ],
    section1Body:
      'El parche libera hormonas de forma continua a través de la piel, con una acción comparable a la de la píldora combinada: impide la ovulación y espesa el moco cervical.',
    tip1Title: 'DATO ÚTIL',
    tip1Text:
      'Su principal ventaja es que no requiere una toma diaria.',
    section2Body:
      'El parche se cambia generalmente una vez por semana durante tres semanas, seguidas de una semana sin parche.',
    applicationTips: [
      'Cambiar de zona de aplicación en cada colocación',
      'Comprobar que sigue bien pegado',
      'Colocarlo sobre una piel limpia y seca',
    ],
    sectionIntro:
      'Los puntos esenciales que hay que conocer antes y durante su uso.',
    facts: [
      {title: 'Cada semana', text: 'El parche se sustituye una vez por semana.'},
      {title: 'Piel seca', text: 'Debe colocarse sobre una piel limpia y seca.'},
      {title: 'Protección', text: 'Actúa de forma continua cuando se usa correctamente.'},
      {title: 'A vigilar', text: 'A veces puede aparecer una irritación local.'},
    ],
    comparisonTitle: 'Ventajas y límites',
    advantageTitle: 'Ventajas',
    advantages: [
      '• Una aplicación por semana',
      '• Sin toma diaria',
      '• Liberación hormonal continua',
    ],
    limitTitle: 'Límites',
    limits: [
      'No protege de las ITS',
      'Puede provocar irritación cutánea',
      'Requiere respetar el ritmo de sustitución',
    ],
    alertTitle: 'A tener en cuenta',
    alertText:
      'Puede aparecer una ligera irritación en el lugar de la aplicación. Alternar las zonas de aplicación puede ayudar a limitar este problema.',
    rememberTitle: 'Los 3 esenciales',
    remember: [
      'Cambia el parche cada semana.',
      'Comprueba regularmente que se mantiene adherido.',
      'Pide consejo a un profesional de la salud si es necesario.',
    ],
    shareMessage: 'El parche anticonceptivo — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function PatchArticleScreen({
  navigation,
}: Props): React.JSX.Element {
  const {t, i18n} = useTranslation();
  const lang = i18n.language === 'fr' ? 'fr' : i18n.language === 'es' ? 'es' : 'en';
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

        {/* ARTICLE */}
        <View style={styles.article}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{content.badge}</Text>
          </View>

          <Text style={styles.title}>{content.title}</Text>

          {/* METADATA */}
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

          {/* TABLE OF CONTENTS */}
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

          {/* SECTION 1 */}
          <Text style={styles.h2}>1. {content.topics[0]}</Text>

          <Text style={styles.body}>{content.section1Body}</Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.tip1Title}</Text>

              <Text style={styles.tipText}>{content.tip1Text}</Text>
            </View>
          </View>

          {/* SECTION 2 */}
          <Text style={styles.h2}>2. {content.topics[1]}</Text>

          <Text style={styles.body}>{content.section2Body}</Text>

          <View style={styles.checkList}>
            {content.applicationTips.map(item => (
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

          {/* SECTION 3 */}
          <Text style={styles.h2}>3. {content.topics[2]}</Text>

          <Text style={styles.sectionIntro}>{content.sectionIntro}</Text>

          {/* VISUAL FACT CARDS */}
          <View style={styles.factGrid}>
            {content.facts.map((item, index) => (
              <View key={item.title} style={styles.factCard}>
                <View style={styles.factIcon}>
                  <MaterialDesignIcons
                    name={PATCH_FACT_ICONS[index] as never}
                    size={23}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.factTitle}>{item.title}</Text>

                <Text style={styles.factText}>{item.text}</Text>
              </View>
            ))}
          </View>

          {/* ADVANTAGES / LIMITS SCHEMA */}
          <View style={styles.comparisonCard}>
            <View style={styles.comparisonHeader}>
              <MaterialDesignIcons
                name="scale-balance"
                size={22}
                color={theme.colors.primary}
              />

              <Text style={styles.comparisonTitle}>
                {content.comparisonTitle}
              </Text>
            </View>

            <View style={styles.comparisonColumns}>
              {/* ADVANTAGES */}
              <View style={styles.column}>
                <View style={styles.columnTitleRow}>
                  <MaterialDesignIcons
                    name="check-circle"
                    size={18}
                    color={theme.colors.success}
                  />

                  <Text style={styles.advantageTitle}>{content.advantageTitle}</Text>
                </View>

                {content.advantages.map(item => (
                  <Text key={item} style={styles.columnItem}>
                    {item}
                  </Text>
                ))}
              </View>

              {/* LIMITS */}
              <View style={styles.column}>
                <View style={styles.columnTitleRow}>
                  <MaterialDesignIcons
                    name="alert-circle"
                    size={18}
                    color={theme.colors.warning}
                  />

                  <Text style={styles.limitTitle}>{content.limitTitle}</Text>
                </View>

                {content.limits.map(item => (
                  <Text key={item} style={styles.columnItem}>
                    • {item}
                  </Text>
                ))}
              </View>
            </View>
          </View>

          {/* ALERT */}
          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.alertTitle}</Text>

              <Text style={styles.tipText}>{content.alertText}</Text>
            </View>
          </View>

          {/* SECTION 4 */}
          <Text style={styles.h2}>4. {content.topics[3]}</Text>

          <View style={styles.rememberCard}>
            <View style={styles.rememberIcon}>
              <MaterialDesignIcons
                name="check-decagram-outline"
                size={26}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.rememberContent}>
              <Text style={styles.rememberTitle}>
                {content.rememberTitle}
              </Text>

              {content.remember.map((item, index) => (
                <View key={item} style={styles.rememberRow}>
                  <Text style={styles.rememberNumber}>
                    {String(index + 1).padStart(2, '0')}
                  </Text>
                  <Text style={styles.rememberText}>{item}</Text>
                </View>
              ))}
            </View>
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
    color: theme.colors.textSecondary,
  },

  sectionIntro: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.textMuted,
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
    marginBottom: 9,
  },

  checkText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },

  /* FACT CARDS */

  factGrid: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 9,
  },

  factCard: {
    width: '48.5%',
    minHeight: 145,
    padding: 13,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  factIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    marginBottom: 9,
  },

  factTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  factText: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 16,
    color: theme.colors.textSecondary,
  },

  /* COMPARISON */

  comparisonCard: {
    marginTop: 15,
    padding: 15,
    borderRadius: 15,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 13,
  },

  comparisonTitle: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '800',
  },

  comparisonColumns: {
    flexDirection: 'row',
    gap: 10,
  },

  column: {
    flex: 1,
    padding: 11,
    borderRadius: 11,
    backgroundColor: theme.colors.background,
  },

  columnTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 9,
  },

  advantageTitle: {
    fontSize: 12,
    color: theme.colors.success,
    fontWeight: '800',
  },

  limitTitle: {
    fontSize: 12,
    color: theme.colors.warning,
    fontWeight: '800',
  },

  columnItem: {
    marginBottom: 7,
    fontSize: 10.5,
    lineHeight: 15,
    color: theme.colors.textSecondary,
  },

  /* TIP */

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

  /* ALERT */

  alert: {
    marginTop: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },

  /* REMEMBER */

  rememberCard: {
    marginTop: 14,
    padding: 15,
    flexDirection: 'row',
    borderRadius: 15,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  rememberIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  rememberContent: {
    flex: 1,
    marginLeft: 12,
  },

  rememberTitle: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '800',
    marginBottom: 8,
  },

  rememberRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 7,
  },

  rememberNumber: {
    width: 28,
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '800',
    marginTop: 2,
  },

  rememberText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },
  });
}
