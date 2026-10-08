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
import {resolveEditorialLanguage} from '../../i18n/editorialLanguage';

const ID = 'childbirthprep-preparer-accouchement';

const HERO = require('../../assets/images/library/featured-tracker.png');

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const PREP_ICONS = [
  'numeric-1-circle-outline',
  'numeric-2-circle-outline',
  'numeric-3-circle-outline',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'GROSSESSE • ACCOUCHEMENT',
    title: 'Se préparer sereinement\nà l’accouchement',
    metaDuration: '7 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Trois piliers pour aborder le jour J avec plus de confiance.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Se préparer en 3 étapes',
      'Le sac de maternité',
      'Rédiger ton projet de naissance',
      'À noter',
      'À retenir',
    ],
    prepSteps: [
      'Cours de préparation à la naissance',
      'Techniques de respiration et de relaxation',
      'Sac de maternité prêt dès le 8e mois',
    ],
    body1:
      'Les cours de préparation à la naissance t’aident à comprendre les étapes du travail et les techniques de respiration qui t’accompagneront le jour J.',
    body2:
      'Préparer ton sac de maternité dès le 8e mois t’évite le stress de dernière minute. Il contient généralement :',
    bagItems: [
      'Papiers administratifs et carnet de grossesse',
      'Vêtements confortables pour toi et le bébé',
      'Nécessaire de toilette et protections post-accouchement',
      'Une tenue de sortie pour le bébé',
    ],
    birthPlanPoints: [
      'Tes préférences pour gérer la douleur',
      'La présence souhaitée pendant le travail',
      'Tes attentes concernant le peau à peau',
    ],
    neutralText:
      'Un projet de naissance simple t’aide à exprimer tes souhaits à l’équipe médicale, tout en restant ouverte : le déroulement réel peut évoluer selon la situation.',
    tipTitle: 'Bon à savoir',
    tipText:
      'Se préparer ne veut pas dire tout contrôler : c’est surtout se donner les moyens d’aborder le jour J avec plus de confiance et moins d’incertitude.',
    shareMessage: 'Se préparer sereinement à l’accouchement — AWA',
  },
  en: {
    badge: 'PREGNANCY • CHILDBIRTH',
    title: 'Preparing calmly\nfor childbirth',
    metaDuration: '7 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'Three pillars for approaching the big day with more confidence.',
    contentsTitle: 'In this article',
    topics: [
      'Preparing in 3 steps',
      'Your hospital bag',
      'Writing your birth plan',
      'Worth noting',
      'What to remember',
    ],
    prepSteps: [
      'Childbirth preparation classes',
      'Breathing and relaxation techniques',
      'Hospital bag ready by month 8',
    ],
    body1:
      'Childbirth preparation classes help you understand the stages of labor and the breathing techniques that will support you on the big day.',
    body2:
      'Packing your hospital bag by month 8 saves you last-minute stress. It usually includes:',
    bagItems: [
      'ID documents and your pregnancy record book',
      'Comfortable clothing for you and the baby',
      'Toiletries and postpartum pads',
      'An outfit for the baby to go home in',
    ],
    birthPlanPoints: [
      'Your preferences for managing pain',
      'Who you’d like present during labor',
      'Your expectations around skin-to-skin contact',
    ],
    neutralText:
      'A simple birth plan helps you share your wishes with the medical team, while staying open-minded: the actual course of events can change depending on the situation.',
    tipTitle: 'Good to know',
    tipText:
      'Preparing doesn’t mean controlling everything: it’s mainly about giving yourself the means to approach the big day with more confidence and less uncertainty.',
    shareMessage: 'Preparing calmly for childbirth — AWA',
  },
  es: {
    badge: 'EMBARAZO • PARTO',
    title: 'Prepararte con calma\npara el parto',
    metaDuration: '7 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Tres pilares para afrontar el gran día con más confianza.',
    contentsTitle: 'En este artículo',
    topics: [
      'Prepararte en 3 pasos',
      'La bolsa de maternidad',
      'Redactar tu plan de parto',
      'Para tener en cuenta',
      'Para recordar',
    ],
    prepSteps: [
      'Clases de preparación al parto',
      'Técnicas de respiración y relajación',
      'Bolsa de maternidad lista desde el 8.º mes',
    ],
    body1:
      'Las clases de preparación al parto te ayudan a comprender las etapas del trabajo de parto y las técnicas de respiración que te acompañarán el gran día.',
    body2:
      'Preparar tu bolsa de maternidad desde el 8.º mes te evita el estrés de última hora. Generalmente incluye:',
    bagItems: [
      'Documentos administrativos y tu cartilla de embarazo',
      'Ropa cómoda para ti y para el bebé',
      'Artículos de aseo y compresas posparto',
      'Un conjunto de salida para el bebé',
    ],
    birthPlanPoints: [
      'Tus preferencias para manejar el dolor',
      'La presencia deseada durante el trabajo de parto',
      'Tus expectativas respecto al contacto piel con piel',
    ],
    neutralText:
      'Un plan de parto sencillo te ayuda a expresar tus deseos al equipo médico, manteniéndote abierta: el desarrollo real puede cambiar según la situación.',
    tipTitle: 'DATO ÚTIL',
    tipText:
      'Prepararte no significa controlarlo todo: se trata sobre todo de darte los medios para afrontar el gran día con más confianza y menos incertidumbre.',
    shareMessage: 'Prepararte con calma para el parto — AWA',
  },
  it: {
    badge: 'GRAVIDANZA • PARTO',
    title: 'Prepararsi con serenità\nal parto',
    metaDuration: '7 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Tre pilastri per affrontare il grande giorno con maggiore fiducia.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Prepararsi in 3 passi',
      'La tua borsa per l’ospedale',
      'Scrivere il tuo piano del parto',
      'Da tenere a mente',
      'Da ricordare',
    ],
    prepSteps: [
      'Corsi di preparazione al parto',
      'Tecniche di respirazione e di rilassamento',
      'Borsa per l’ospedale pronta entro il mese 8',
    ],
    body1: 'I corsi di preparazione al parto ti aiutano a capire le fasi del travaglio e le tecniche di respirazione che ti sosterranno il grande giorno.',
    body2: 'Preparare la borsa per l’ospedale entro il mese 8 ti evita lo stress dell’ultimo minuto. Di solito contiene:',
    bagItems: [
      'Documenti d’identità e il libretto della gravidanza',
      'Abiti comodi per te e per il neonato',
      'Articoli da toilette e assorbenti post-partum',
      'Un completo per il neonato per tornare a casa',
    ],
    birthPlanPoints: [
      'Le tue preferenze per la gestione del dolore',
      'Chi vorresti avere accanto durante il travaglio',
      'Le tue aspettative sul contatto pelle a pelle',
    ],
    neutralText: 'Un semplice piano del parto ti aiuta a comunicare i tuoi desideri all’équipe medica, restando però aperta ai cambiamenti: lo svolgimento reale può cambiare a seconda della situazione.',
    tipTitle: 'Da sapere',
    tipText: 'Prepararsi non significa controllare tutto: si tratta soprattutto di darti i mezzi per affrontare il grande giorno con più fiducia e meno incertezza.',
    shareMessage: 'Prepararsi con serenità al parto — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function ChildbirthPrepArticleScreen({
  navigation,
}: Props): React.JSX.Element {
  const {t, i18n} = useTranslation();
  const lang = resolveEditorialLanguage(i18n.language);
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
            {content.body1}
          </Text>

          <View style={styles.daily}>
            {PREP_ICONS.map((icon, index) => (
              <View key={icon} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={icon as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <Text style={styles.dailyText}>{content.prepSteps[index]}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.h2}>2. {content.topics[1]}</Text>

          <Text style={styles.body}>
            {content.body2}
          </Text>

          <View style={styles.checkList}>
            {content.bagItems.map(item => (
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

          <Text style={styles.h2}>3. {content.topics[2]}</Text>

          <View style={styles.consultCard}>
            {content.birthPlanPoints.map(item => (
              <View key={item} style={styles.consultRow}>
                <View style={styles.consultIcon}>
                  <MaterialDesignIcons
                    name="pencil-outline"
                    size={18}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.consultText}>{item}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.h2}>4. {content.topics[3]}</Text>

          <View style={styles.neutralBox}>
            <MaterialDesignIcons
              name="information-outline"
              size={22}
              color={theme.colors.textMuted}
            />

            <Text style={styles.neutralText}>
              {content.neutralText}
            </Text>
          </View>

          <Text style={styles.h2}>5. {content.topics[4]}</Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.tipTitle}</Text>
              <Text style={styles.tipText}>
                {content.tipText}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={7} scrollRef={scrollRef} />
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
    color: theme.colors.text,
    fontWeight: '600',
  },
  contents: {
    marginTop: 20,
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
  contentNumber: {width: 25, color: theme.colors.primary, fontSize: 11.5, fontWeight: '800'},
  contentText: {flex: 1, fontSize: 12.3, lineHeight: 17, color: theme.colors.text},
  h2: {
    marginTop: 25,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: theme.colors.text,
    fontWeight: '700',
  },
  body: {marginTop: 9, fontSize: 14, lineHeight: 21.5, color: theme.colors.text},
  daily: {marginTop: 13, flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  dailyItem: {
    width: '48.7%',
    minHeight: 108,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: theme.colors.primarySoft,
  },
  dailyText: {
    marginTop: 7,
    fontSize: 11,
    lineHeight: 16,
    color: theme.colors.text,
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
  checkText: {flex: 1, color: theme.colors.text, fontSize: 12, lineHeight: 17},
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
    color: theme.colors.text,
    fontSize: 12,
    lineHeight: 17,
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
  neutralText: {flex: 1, fontSize: 11.5, lineHeight: 17, color: theme.colors.textSecondary},
  tip: {
    marginTop: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
  },
  tipCopy: {flex: 1, marginLeft: 11},
  tipTitle: {fontSize: 13, color: theme.colors.text, fontWeight: '800'},
  tipText: {marginTop: 4, fontSize: 11.5, lineHeight: 17, color: theme.colors.textSecondary},
  });
}
