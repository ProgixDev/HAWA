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

const ID = 'religiousfaq-reperes-apres-une-perte';

const HERO = require('../../assets/images/library/spm-woman.png');

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'REPÈRES SPIRITUELS',
    title: 'Repères spirituels\naprès une perte',
    metaDuration: '5 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaEducational: 'Contenu éducatif',
    intro:
      'Quelques repères spirituels pour traverser une perte avec douceur, patience et bienveillance.',
    disclaimerTitle: 'Information importante',
    disclaimerText:
      'Ce contenu est éducatif. Les questions religieuses précises doivent être vérifiées auprès d’un savant ou d’une savante qualifiée. AWA ne délivre pas de fatwas personnalisées.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Une épreuve reconnue',
      'Un statut selon la situation',
      'Patience et espérance',
      'Quelques repères pour avancer',
    ],
    section1H2: '1. Une épreuve reconnue',
    section1Body1:
      'Une perte de grossesse peut être une épreuve profondément douloureuse. La tristesse, le silence, la confusion ou le besoin de prendre du recul sont des réactions humaines naturelles.',
    section1Body2:
      'Ressentir ces émotions ne signifie pas manquer de foi. Chacune peut vivre son deuil à son propre rythme.',
    visual1Title: 'Accueillir ses émotions',
    visual1Body: 'Tristesse • besoin de repos • silence • soutien',
    section2H2: '2. Un statut qui peut varier selon la situation',
    section2Body1:
      'Après une perte, les règles religieuses peuvent dépendre de la situation et de la nature des saignements.',
    section2Body2:
      'Il peut notamment être nécessaire de distinguer différents types de saignements avant de déterminer les pratiques religieuses à suivre.',
    schemaTitle: 'Le principe général',
    schemaLabel1: 'Situation',
    schemaLabel2: 'Nature du saignement',
    schemaLabel3: 'Avis adapté',
    doubtTipTitle: 'En cas de doute',
    doubtTipText:
      'Une situation personnelle peut nécessiter une réponse différente. Il est préférable de demander conseil à une personne qualifiée.',
    section3H2: '3. Patience et espérance',
    section3Body1:
      'La patience (sabr) ne signifie pas ne pas pleurer ou ne pas ressentir de douleur. Elle peut simplement accompagner le cheminement avec foi et espérance.',
    section3Body2:
      'De petits gestes peuvent aider à retrouver progressivement un sentiment d’apaisement : une invocation, un moment de dhikr, une écoute spirituelle ou la présence d’un proche.',
    spiritual1: 'Invocation',
    spiritual2: 'Dhikr',
    spiritual3: 'Soutien',
    retainTipTitle: 'À retenir',
    retainTipText:
      'La guérison prend du temps. Il n’existe pas de rythme universel pour traverser une perte.',
    section4H2: '4. Quelques repères pour avancer',
    section4Body:
      'Il n’est pas nécessaire de tout faire à la fois. Choisis ce qui correspond à ton état et à tes besoins du moment.',
    gentleSteps: [
      'Prendre le temps de vivre son chagrin',
      'S’entourer de personnes bienveillantes',
      'Conserver de petits gestes spirituels si cela apporte du réconfort',
      'Demander conseil pour toute question religieuse précise',
      'Chercher du soutien si le chagrin devient trop difficile à porter',
    ],
    finalTitle: 'Un chemin à ton rythme',
    finalText:
      'Prendre soin de soi, chercher du soutien et conserver l’espérance peuvent accompagner progressivement le chemin vers l’apaisement.',
    shareMessage: 'Repères spirituels après une perte — AWA',
  },
  en: {
    badge: 'SPIRITUAL GUIDANCE',
    title: 'Spiritual guidance\nafter a loss',
    metaDuration: '5 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaEducational: 'Educational content',
    intro:
      'A few spiritual guidance points to help you move through a loss with gentleness, patience, and compassion.',
    disclaimerTitle: 'Important information',
    disclaimerText:
      'This content is educational. Specific religious questions should be verified with a qualified scholar. AWA does not issue personalized fatwas.',
    contentsTitle: 'In this article',
    topics: [
      'A recognized trial',
      'A status that depends on the situation',
      'Patience and hope',
      'A few guidance points for moving forward',
    ],
    section1H2: '1. A recognized trial',
    section1Body1:
      'A pregnancy loss can be a deeply painful trial. Sadness, silence, confusion, or the need to step back are natural human reactions.',
    section1Body2:
      'Feeling these emotions does not mean lacking faith. Each woman can go through her grief at her own pace.',
    visual1Title: 'Welcoming your emotions',
    visual1Body: 'Sadness • need for rest • silence • support',
    section2H2: '2. A status that can vary depending on the situation',
    section2Body1:
      'After a loss, religious rules can depend on the situation and the nature of the bleeding.',
    section2Body2:
      'In particular, it may be necessary to distinguish between different types of bleeding before determining which religious practices to follow.',
    schemaTitle: 'The general principle',
    schemaLabel1: 'Situation',
    schemaLabel2: 'Nature of the bleeding',
    schemaLabel3: 'Suitable guidance',
    doubtTipTitle: 'If in doubt',
    doubtTipText:
      'A personal situation may call for a different answer. It is best to seek advice from a qualified person.',
    section3H2: '3. Patience and hope',
    section3Body1:
      'Patience (sabr) does not mean not crying or not feeling pain. It can simply accompany the journey with faith and hope.',
    section3Body2:
      'Small gestures can help gradually restore a sense of peace: an invocation, a moment of dhikr, spiritual listening, or the presence of a loved one.',
    spiritual1: 'Invocation',
    spiritual2: 'Dhikr',
    spiritual3: 'Support',
    retainTipTitle: 'Keep in mind',
    retainTipText:
      'Healing takes time. There is no universal pace for moving through a loss.',
    section4H2: '4. A few guidance points for moving forward',
    section4Body:
      'There is no need to do everything at once. Choose what matches how you feel and what you need right now.',
    gentleSteps: [
      'Take the time to live through your grief',
      'Surround yourself with caring people',
      'Keep up small spiritual practices if they bring comfort',
      'Seek advice for any specific religious question',
      'Seek support if the grief becomes too difficult to carry',
    ],
    finalTitle: 'A path at your own pace',
    finalText:
      'Taking care of yourself, seeking support, and holding on to hope can gradually help guide the path toward peace.',
    shareMessage: 'Spiritual guidance after a loss — AWA',
  },
  es: {
    badge: 'REFERENCIAS ESPIRITUALES',
    title: 'Referencias espirituales\ndespués de una pérdida',
    metaDuration: '5 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaEducational: 'Contenido educativo',
    intro:
      'Algunas referencias espirituales para atravesar una pérdida con dulzura, paciencia y compasión.',
    disclaimerTitle: 'Información importante',
    disclaimerText:
      'Este contenido es educativo. Las preguntas religiosas precisas deben verificarse con un erudito o una erudita cualificada. AWA no emite fatuas personalizadas.',
    contentsTitle: 'En este artículo',
    topics: [
      'Una prueba reconocida',
      'Un estatus según la situación',
      'Paciencia y esperanza',
      'Algunas referencias para avanzar',
    ],
    section1H2: '1. Una prueba reconocida',
    section1Body1:
      'Una pérdida del embarazo puede ser una prueba profundamente dolorosa. La tristeza, el silencio, la confusión o la necesidad de tomar distancia son reacciones humanas naturales.',
    section1Body2:
      'Sentir estas emociones no significa carecer de fe. Cada mujer puede vivir su duelo a su propio ritmo.',
    visual1Title: 'Acoger tus emociones',
    visual1Body: 'Tristeza • necesidad de descanso • silencio • apoyo',
    section2H2: '2. Un estatus que puede variar según la situación',
    section2Body1:
      'Después de una pérdida, las reglas religiosas pueden depender de la situación y de la naturaleza de los sangrados.',
    section2Body2:
      'En particular, puede ser necesario distinguir entre diferentes tipos de sangrado antes de determinar las prácticas religiosas que seguir.',
    schemaTitle: 'El principio general',
    schemaLabel1: 'Situación',
    schemaLabel2: 'Naturaleza del sangrado',
    schemaLabel3: 'Opinión adaptada',
    doubtTipTitle: 'En caso de duda',
    doubtTipText:
      'Una situación personal puede requerir una respuesta diferente. Es preferible pedir consejo a una persona cualificada.',
    section3H2: '3. Paciencia y esperanza',
    section3Body1:
      'La paciencia (sabr) no significa no llorar ni dejar de sentir dolor. Simplemente puede acompañar el camino con fe y esperanza.',
    section3Body2:
      'Pequeños gestos pueden ayudar a recuperar progresivamente una sensación de sosiego: una invocación, un momento de dhikr, una escucha espiritual o la presencia de un ser querido.',
    spiritual1: 'Invocación',
    spiritual2: 'Dhikr',
    spiritual3: 'Apoyo',
    retainTipTitle: 'Para recordar',
    retainTipText:
      'La sanación lleva tiempo. No existe un ritmo universal para atravesar una pérdida.',
    section4H2: '4. Algunas referencias para avanzar',
    section4Body:
      'No es necesario hacerlo todo a la vez. Elige lo que corresponda a tu estado y a tus necesidades del momento.',
    gentleSteps: [
      'Tomarte el tiempo de vivir tu duelo',
      'Rodearte de personas comprensivas',
      'Conservar pequeños gestos espirituales si te aportan consuelo',
      'Pedir consejo para cualquier pregunta religiosa precisa',
      'Buscar apoyo si el duelo se vuelve demasiado difícil de sobrellevar',
    ],
    finalTitle: 'Un camino a tu propio ritmo',
    finalText:
      'Cuidarte, buscar apoyo y conservar la esperanza pueden acompañar progresivamente el camino hacia el sosiego.',
    shareMessage: 'Referencias espirituales después de una pérdida — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function ReligiousFaqAfterLossArticleScreen({
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
              {paddingTop: getTopPadding(insets.top, true)},
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
              ['shield-check-outline', content.metaEducational],
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

          {/* DISCLAIMER */}
          <View style={styles.alert}>
            <MaterialDesignIcons
              name="information-outline"
              size={23}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.disclaimerTitle}</Text>
              <Text style={styles.tipText}>{content.disclaimerText}</Text>
            </View>
          </View>

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

          {/* SECTION 1 */}
          <Text style={styles.h2}>{content.section1H2}</Text>

          <Text style={styles.body}>{content.section1Body1}</Text>

          <Text style={styles.body}>{content.section1Body2}</Text>

          {/* SIMPLE VISUAL */}
          <View style={styles.visualCard}>
            <View style={styles.visualIcon}>
              <MaterialDesignIcons
                name="heart-outline"
                size={30}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.visualText}>
              <Text style={styles.visualTitle}>{content.visual1Title}</Text>
              <Text style={styles.visualBody}>{content.visual1Body}</Text>
            </View>
          </View>

          {/* SECTION 2 */}
          <Text style={styles.h2}>{content.section2H2}</Text>

          <Text style={styles.body}>{content.section2Body1}</Text>

          <Text style={styles.body}>{content.section2Body2}</Text>

          {/* SCHEMA */}
          <View style={styles.schema}>
            <Text style={styles.schemaTitle}>{content.schemaTitle}</Text>

            <View style={styles.schemaRow}>
              <View style={styles.schemaStep}>
                <View style={styles.schemaCircle}>
                  <Text style={styles.schemaNumber}>1</Text>
                </View>
                <Text style={styles.schemaLabel}>{content.schemaLabel1}</Text>
              </View>

              <MaterialDesignIcons
                name="arrow-right"
                size={20}
                color={theme.colors.primary}
              />

              <View style={styles.schemaStep}>
                <View style={styles.schemaCircle}>
                  <Text style={styles.schemaNumber}>2</Text>
                </View>
                <Text style={styles.schemaLabel}>{content.schemaLabel2}</Text>
              </View>

              <MaterialDesignIcons
                name="arrow-right"
                size={20}
                color={theme.colors.primary}
              />

              <View style={styles.schemaStep}>
                <View style={styles.schemaCircle}>
                  <Text style={styles.schemaNumber}>3</Text>
                </View>
                <Text style={styles.schemaLabel}>{content.schemaLabel3}</Text>
              </View>
            </View>
          </View>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-circle-outline"
              size={23}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.doubtTipTitle}</Text>
              <Text style={styles.tipText}>{content.doubtTipText}</Text>
            </View>
          </View>

          {/* SECTION 3 */}
          <Text style={styles.h2}>{content.section3H2}</Text>

          <Text style={styles.body}>{content.section3Body1}</Text>

          <Text style={styles.body}>{content.section3Body2}</Text>

          {/* SPIRITUALITY VISUAL */}
          <View style={styles.spiritualCard}>
            <View style={styles.spiritualItem}>
              <MaterialDesignIcons
                name="heart-outline"
                size={23}
                color={theme.colors.primary}
              />
              <Text style={styles.spiritualText}>{content.spiritual1}</Text>
            </View>

            <View style={styles.spiritualItem}>
              <MaterialDesignIcons
                name="hands-pray"
                size={23}
                color={theme.colors.primary}
              />
              <Text style={styles.spiritualText}>{content.spiritual2}</Text>
            </View>

            <View style={styles.spiritualItem}>
              <MaterialDesignIcons
                name="account-heart-outline"
                size={23}
                color={theme.colors.primary}
              />
              <Text style={styles.spiritualText}>{content.spiritual3}</Text>
            </View>
          </View>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.retainTipTitle}</Text>
              <Text style={styles.tipText}>{content.retainTipText}</Text>
            </View>
          </View>

          {/* SECTION 4 */}
          <Text style={styles.h2}>{content.section4H2}</Text>

          <Text style={styles.body}>{content.section4Body}</Text>

          <View style={styles.checkList}>
            {content.gentleSteps.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={19}
                  color={theme.colors.success}
                />

                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* FINAL MESSAGE */}
          <View style={styles.finalCard}>
            <MaterialDesignIcons
              name="flower-outline"
              size={28}
              color={theme.colors.primary}
            />

            <Text style={styles.finalTitle}>{content.finalTitle}</Text>

            <Text style={styles.finalText}>{content.finalText}</Text>
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
    color: theme.colors.text,
    fontWeight: '500',
  },

  alert: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
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

  tip: {
    marginTop: 15,
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
    marginTop: 3,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textMuted,
  },

  visualCard: {
    marginTop: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  visualIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  visualText: {
    flex: 1,
    marginLeft: 12,
  },

  visualTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text,
  },

  visualBody: {
    marginTop: 4,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textMuted,
  },

  schema: {
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  schemaTitle: {
    marginBottom: 16,
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
  },

  schemaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  schemaStep: {
    flex: 1,
    alignItems: 'center',
  },

  schemaCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  schemaNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.primary,
  },

  schemaLabel: {
    marginTop: 7,
    fontSize: 10,
    lineHeight: 14,
    color: theme.colors.text,
    textAlign: 'center',
  },

  spiritualCard: {
    marginTop: 15,
    paddingVertical: 15,
    paddingHorizontal: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  spiritualItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  spiritualText: {
    marginTop: 7,
    fontSize: 11,
    color: theme.colors.text,
    fontWeight: '600',
    textAlign: 'center',
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

  finalCard: {
    marginTop: 18,
    padding: 18,
    alignItems: 'center',
    borderRadius: 15,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
  },

  finalTitle: {
    marginTop: 8,
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '800',
    textAlign: 'center',
  },

  finalText: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  });
}
