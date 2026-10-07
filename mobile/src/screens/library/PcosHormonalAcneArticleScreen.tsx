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

const ID = 'pcos-acne-hormonale';

const HERO = require('../../assets/images/library/featured-cycle.png');

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icon lists.
const RECOGNIZE_SIGN_ICONS = [
  'map-marker-outline',
  'circle-outline',
  'calendar-refresh',
  'palette-outline',
] as const;

const CARE_HABIT_ICONS = [
  'face-woman-outline',
  'water-off-outline',
  'weather-sunny',
  'hand-back-left-outline',
] as const;

const CONSULT_REASON_ICONS = [
  'clock-alert-outline',
  'emoticon-sad-outline',
  'alert-circle-outline',
  'blur',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'SOPK • ACNÉ HORMONALE',
    title: 'Comprendre\nl’acné hormonale',
    metaDuration: '7 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu éducatif',
    intro:
      'Pourquoi l’acné hormonale peut apparaître avec le SOPK, comment la reconnaître et quelles solutions peuvent aider à la prendre en charge.',
    introSecondary:
      'Elle touche de nombreuses femmes et n’est ni un manque d’hygiène, ni une fatalité : comprendre son origine aide à mieux la prendre en charge.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Qu’est-ce que l’acné hormonale ?',
      'Pourquoi le SOPK peut provoquer de l’acné ?',
      'Comment reconnaître l’acné hormonale',
      'Acné hormonale et cycle menstruel',
      'Ce qui peut aider',
      'Quand consulter ?',
      'À retenir',
    ],
    h1: 'Qu’est-ce que l’acné hormonale ?',
    body1a:
      'L’acné hormonale est une forme d’acné directement liée aux fluctuations ou à un déséquilibre des hormones, notamment des androgènes. Contrairement à l’acné plus classique de l’adolescence, elle touche souvent des femmes adultes et peut persister ou apparaître après cette période.',
    body1b:
      'Elle se distingue aussi par sa localisation, sa profondeur et sa tendance à réapparaître aux mêmes endroits malgré des soins habituels bien suivis.',
    tip1Title: 'Bon à savoir',
    tip1Text:
      'L’acné hormonale n’est pas liée à un manque d’hygiène : se laver davantage le visage ne la fait pas disparaître, et peut même irriter la peau.',
    h2Title: 'Pourquoi le SOPK peut provoquer de l’acné ?',
    body2:
      'Dans le SOPK, un excès relatif d’androgènes stimule les glandes sébacées, qui produisent alors plus de sébum. Certaines peaux sont aussi plus sensibles à ces hormones, ce qui explique pourquoi l’acné peut être marquée même sans déséquilibre majeur mesuré en laboratoire.',
    neutralText:
      'Ce n’est pas une question de volonté : cette sensibilité varie d’une personne à l’autre et ne dépend pas de tes habitudes de vie.',
    h3Title: 'Comment reconnaître l’acné hormonale',
    body3:
      'Certaines caractéristiques reviennent souvent, sans être systématiques :',
    recognizeSigns: [
      'Bas du visage : mâchoire, menton',
      'Boutons plus profonds, parfois douloureux',
      'Réapparition souvent aux mêmes endroits',
      'Rougeurs ou marques qui persistent',
    ],
    h4Title: 'Acné hormonale et cycle menstruel',
    body4:
      'L’acné hormonale peut fluctuer au fil du cycle. Beaucoup de femmes remarquent une poussée dans les jours précédant les règles, lorsque la progestérone augmente puis chute brutalement, stimulant temporairement la production de sébum.',
    highlightTitle: 'Suivre ses poussées',
    highlightText:
      'Noter les dates d’apparition des boutons par rapport à ton cycle peut t’aider, toi et ton dermatologue, à mieux comprendre le lien hormonal.',
    h5Title: 'Ce qui peut aider',
    body5a:
      'Certaines habitudes de soin simples peuvent limiter les poussées, sans les faire disparaître complètement à elles seules :',
    careHabits: [
      'Nettoyer la peau en douceur, matin et soir',
      'Éviter les produits agressifs ou décapants',
      'Protéger sa peau du soleil au quotidien',
      'Ne pas percer ou triturer les boutons',
    ],
    body5b:
      'Selon la situation, un dermatologue ou un gynécologue peut proposer des traitements locaux (crèmes, gels) ou, si nécessaire, un traitement hormonal adapté.',
    alertTitle: 'Pas d’automédication',
    alertText:
      'Les traitements contre l’acné hormonale (locaux ou hormonaux) doivent être prescrits et suivis par un professionnel de santé, en particulier en cas de désir de grossesse.',
    h6Title: 'Quand consulter ?',
    body6:
      'Un avis médical est particulièrement utile dans certaines situations :',
    consultReasons: [
      'Acné qui persiste malgré des soins adaptés',
      'Boutons douloureux ou profonds (nodules, kystes)',
      'Acné sévère ou qui s’aggrave rapidement',
      'Marques ou cicatrices qui s’installent',
    ],
    h7Title: 'À retenir',
    summaryTitle: 'Les points essentiels',
    keyPoints: [
      'L’acné hormonale a une cause identifiable, liée aux androgènes.',
      'Elle touche souvent le bas du visage et peut s’aggraver avant les règles.',
      'Ce n’est ni un manque d’hygiène, ni une fatalité.',
      'Des soins doux et, si besoin, un traitement adapté peuvent l’améliorer.',
      'Un dermatologue ou un gynécologue peut t’accompagner en cas de persistance.',
    ],
    finalNoteTitle: 'Un guide pour mieux comprendre',
    finalNoteText:
      'Cet article est destiné à l’information générale et ne remplace pas une consultation médicale. En cas de doute ou de symptômes persistants, demande conseil à un professionnel de santé.',
    shareMessage: 'Comprendre l’acné hormonale — AWA',
  },
  en: {
    badge: 'PCOS • HORMONAL ACNE',
    title: 'Understanding\nhormonal acne',
    metaDuration: '7 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Educational content',
    intro:
      'Why hormonal acne can appear with PCOS, how to recognize it, and what solutions may help manage it.',
    introSecondary:
      'It affects many women and is neither a lack of hygiene nor an inevitability: understanding its origin helps manage it better.',
    contentsTitle: 'In this article',
    topics: [
      'What is hormonal acne?',
      'Why can PCOS cause acne?',
      'How to recognize hormonal acne',
      'Hormonal acne and the menstrual cycle',
      'What can help',
      'When to see a doctor?',
      'Key takeaways',
    ],
    h1: 'What is hormonal acne?',
    body1a:
      'Hormonal acne is a form of acne directly linked to hormonal fluctuations or an imbalance, particularly in androgens. Unlike the more typical acne of adolescence, it often affects adult women and can persist or appear after that period.',
    body1b:
      'It is also distinguished by its location, its depth, and its tendency to reappear in the same spots despite a well-followed regular skincare routine.',
    tip1Title: 'Good to know',
    tip1Text:
      'Hormonal acne is not linked to a lack of hygiene: washing your face more often does not make it go away, and may even irritate the skin.',
    h2Title: 'Why can PCOS cause acne?',
    body2:
      'In PCOS, a relative excess of androgens stimulates the sebaceous glands, which then produce more sebum. Some skin is also more sensitive to these hormones, which explains why acne can be pronounced even without a major imbalance measured in a lab.',
    neutralText:
      'This is not a matter of willpower: this sensitivity varies from person to person and does not depend on your lifestyle habits.',
    h3Title: 'How to recognize hormonal acne',
    body3:
      'Certain features often recur, though not systematically:',
    recognizeSigns: [
      'Lower face: jawline, chin',
      'Deeper, sometimes painful breakouts',
      'Often reappears in the same spots',
      'Redness or marks that persist',
    ],
    h4Title: 'Hormonal acne and the menstrual cycle',
    body4:
      'Hormonal acne can fluctuate throughout the cycle. Many women notice a flare-up in the days before their period, when progesterone rises and then drops sharply, temporarily stimulating sebum production.',
    highlightTitle: 'Tracking your flare-ups',
    highlightText:
      'Noting when breakouts appear relative to your cycle can help you and your dermatologist better understand the hormonal link.',
    h5Title: 'What can help',
    body5a:
      'A few simple care habits can help limit flare-ups, without fully clearing them on their own:',
    careHabits: [
      'Gently cleanse your skin morning and evening',
      'Avoid harsh or stripping products',
      'Protect your skin from the sun daily',
      'Avoid squeezing or picking at breakouts',
    ],
    body5b:
      'Depending on the situation, a dermatologist or gynecologist may suggest topical treatments (creams, gels) or, if needed, a suitable hormonal treatment.',
    alertTitle: 'No self-medicating',
    alertText:
      'Treatments for hormonal acne (topical or hormonal) must be prescribed and monitored by a healthcare professional, particularly if you are hoping to conceive.',
    h6Title: 'When to see a doctor?',
    body6:
      'Medical advice is especially helpful in certain situations:',
    consultReasons: [
      'Acne that persists despite suitable care',
      'Painful or deep breakouts (nodules, cysts)',
      'Severe acne or acne that worsens rapidly',
      'Marks or scars that are settling in',
    ],
    h7Title: 'Key takeaways',
    summaryTitle: 'The essential points',
    keyPoints: [
      'Hormonal acne has an identifiable cause, linked to androgens.',
      'It often affects the lower face and can worsen before your period.',
      'It is neither a lack of hygiene nor an inevitability.',
      'Gentle care and, if needed, a suitable treatment can improve it.',
      'A dermatologist or gynecologist can support you if it persists.',
    ],
    finalNoteTitle: 'A guide to better understanding',
    finalNoteText:
      'This article is for general information only and does not replace a medical consultation. If in doubt or if symptoms persist, seek advice from a healthcare professional.',
    shareMessage: 'Understanding hormonal acne — AWA',
  },
  es: {
    badge: 'SOP • ACNÉ HORMONAL',
    title: 'Comprender\nel acné hormonal',
    metaDuration: '7 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido educativo',
    intro:
      'Por qué puede aparecer acné hormonal con el SOP, cómo reconocerlo y qué soluciones pueden ayudar a manejarlo.',
    introSecondary:
      'Afecta a muchas mujeres y no es ni una falta de higiene ni una fatalidad: comprender su origen ayuda a manejarlo mejor.',
    contentsTitle: 'En este artículo',
    topics: [
      '¿Qué es el acné hormonal?',
      '¿Por qué el SOP puede provocar acné?',
      'Cómo reconocer el acné hormonal',
      'Acné hormonal y ciclo menstrual',
      'Lo que puede ayudar',
      '¿Cuándo consultar?',
      'Para recordar',
    ],
    h1: '¿Qué es el acné hormonal?',
    body1a:
      'El acné hormonal es una forma de acné directamente relacionada con fluctuaciones o un desequilibrio de las hormonas, especialmente de los andrógenos. A diferencia del acné más habitual de la adolescencia, afecta a menudo a mujeres adultas y puede persistir o aparecer después de esa etapa.',
    body1b:
      'También se distingue por su localización, su profundidad y su tendencia a reaparecer en los mismos lugares a pesar de cuidados habituales bien seguidos.',
    tip1Title: 'Dato útil',
    tip1Text:
      'El acné hormonal no está relacionado con una falta de higiene: lavarse más el rostro no lo hace desaparecer, e incluso puede irritar la piel.',
    h2Title: '¿Por qué el SOP puede provocar acné?',
    body2:
      'En el SOP, un exceso relativo de andrógenos estimula las glándulas sebáceas, que producen entonces más sebo. Algunas pieles también son más sensibles a estas hormonas, lo que explica por qué el acné puede ser notable incluso sin un desequilibrio importante medido en laboratorio.',
    neutralText:
      'No es una cuestión de voluntad: esta sensibilidad varía de una persona a otra y no depende de tus hábitos de vida.',
    h3Title: 'Cómo reconocer el acné hormonal',
    body3:
      'Algunas características se repiten a menudo, sin ser sistemáticas:',
    recognizeSigns: [
      'Parte baja del rostro: mandíbula, mentón',
      'Granos más profundos, a veces dolorosos',
      'Reaparición frecuente en los mismos lugares',
      'Enrojecimientos o marcas que persisten',
    ],
    h4Title: 'Acné hormonal y ciclo menstrual',
    body4:
      'El acné hormonal puede fluctuar a lo largo del ciclo. Muchas mujeres notan un brote en los días previos a la regla, cuando la progesterona aumenta y luego cae bruscamente, estimulando temporalmente la producción de sebo.',
    highlightTitle: 'Seguir tus brotes',
    highlightText:
      'Anotar las fechas de aparición de los granos en relación con tu ciclo puede ayudarte, a ti y a tu dermatólogo, a comprender mejor el vínculo hormonal.',
    h5Title: 'Lo que puede ayudar',
    body5a:
      'Algunos hábitos de cuidado sencillos pueden limitar los brotes, sin hacerlos desaparecer por completo por sí solos:',
    careHabits: [
      'Limpiar la piel con suavidad, mañana y noche',
      'Evitar productos agresivos o resecantes',
      'Proteger tu piel del sol a diario',
      'No pinchar ni manipular los granos',
    ],
    body5b:
      'Según la situación, un dermatólogo o un ginecólogo puede proponer tratamientos locales (cremas, geles) o, si es necesario, un tratamiento hormonal adecuado.',
    alertTitle: 'Sin automedicación',
    alertText:
      'Los tratamientos contra el acné hormonal (locales u hormonales) deben ser recetados y supervisados por un profesional de salud, en particular en caso de deseo de embarazo.',
    h6Title: '¿Cuándo consultar?',
    body6:
      'Una opinión médica resulta especialmente útil en ciertas situaciones:',
    consultReasons: [
      'Acné que persiste a pesar de cuidados adecuados',
      'Granos dolorosos o profundos (nódulos, quistes)',
      'Acné grave o que empeora rápidamente',
      'Marcas o cicatrices que se instalan',
    ],
    h7Title: 'Para recordar',
    summaryTitle: 'Los puntos esenciales',
    keyPoints: [
      'El acné hormonal tiene una causa identificable, relacionada con los andrógenos.',
      'Afecta a menudo la parte baja del rostro y puede empeorar antes de la regla.',
      'No es ni una falta de higiene ni una fatalidad.',
      'Cuidados suaves y, si es necesario, un tratamiento adecuado pueden mejorarlo.',
      'Un dermatólogo o un ginecólogo puede acompañarte en caso de persistencia.',
    ],
    finalNoteTitle: 'Una guía para comprender mejor',
    finalNoteText:
      'Este artículo tiene fines de información general y no sustituye una consulta médica. En caso de duda o de síntomas persistentes, pide consejo a un profesional de salud.',
    shareMessage: 'Comprender el acné hormonal — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function PcosHormonalAcneArticleScreen({
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
          {/* HEADER */}
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

          <Text style={styles.introSecondary}>
            {content.introSecondary}
          </Text>

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
          <Text style={styles.h2}>1. {content.h1}</Text>

          <Text style={styles.body}>
            {content.body1a}
          </Text>

          <Text style={styles.body}>
            {content.body1b}
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

          {/* 2 */}
          <Text style={styles.h2}>
            2. {content.h2Title}
          </Text>

          <Text style={styles.body}>
            {content.body2}
          </Text>

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

          {/* 3 */}
          <Text style={styles.h2}>
            3. {content.h3Title}
          </Text>

          <Text style={styles.body}>
            {content.body3}
          </Text>

          <View style={styles.daily}>
            {RECOGNIZE_SIGN_ICONS.map((icon, index) => (
              <View key={icon} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={icon as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <Text style={styles.dailyText}>
                  {content.recognizeSigns[index]}
                </Text>
              </View>
            ))}
          </View>

          {/* 4 */}
          <Text style={styles.h2}>4. {content.h4Title}</Text>

          <Text style={styles.body}>
            {content.body4}
          </Text>

          <View style={styles.highlightBox}>
            <MaterialDesignIcons
              name="calendar-heart"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.highlightCopy}>
              <Text style={styles.highlightTitle}>{content.highlightTitle}</Text>

              <Text style={styles.highlightText}>
                {content.highlightText}
              </Text>
            </View>
          </View>

          {/* 5 */}
          <Text style={styles.h2}>5. {content.h5Title}</Text>

          <Text style={styles.body}>
            {content.body5a}
          </Text>

          <View style={styles.daily}>
            {CARE_HABIT_ICONS.map((icon, index) => (
              <View key={icon} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={icon as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <Text style={styles.dailyText}>
                  {content.careHabits[index]}
                </Text>
              </View>
            ))}
          </View>

          <Text style={styles.body}>
            {content.body5b}
          </Text>

          <View style={styles.alert}>
            <MaterialDesignIcons name="doctor" size={24} color={theme.colors.warning} />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.alertTitle}</Text>
              <Text style={styles.tipText}>
                {content.alertText}
              </Text>
            </View>
          </View>

          {/* 6 */}
          <Text style={styles.h2}>6. {content.h6Title}</Text>

          <Text style={styles.body}>
            {content.body6}
          </Text>

          <View style={styles.consultCard}>
            {CONSULT_REASON_ICONS.map((icon, index) => (
              <View key={icon} style={styles.consultRow}>
                <View style={styles.consultIcon}>
                  <MaterialDesignIcons
                    name={icon as never}
                    size={18}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.consultText}>
                  {content.consultReasons[index]}
                </Text>
              </View>
            ))}
          </View>

          {/* 7 */}
          <Text style={styles.h2}>7. {content.h7Title}</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <MaterialDesignIcons
                name="check-decagram-outline"
                size={24}
                color={theme.colors.primary}
              />

              <Text style={styles.summaryTitle}>{content.summaryTitle}</Text>
            </View>

            {content.keyPoints.map(item => (
              <View key={item} style={styles.summaryRow}>
                <MaterialDesignIcons name="check" size={17} color={theme.colors.success} />
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
  body: {marginTop: 9, fontSize: 14, lineHeight: 21.5, color: theme.colors.textSecondary},
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
  daily: {marginTop: 13, flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  dailyItem: {
    width: '48.7%',
    minHeight: 108,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  dailyText: {
    marginTop: 7,
    fontSize: 11,
    lineHeight: 16,
    color: theme.colors.text,
    textAlign: 'center',
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
  highlightCopy: {flex: 1, marginLeft: 10},
  highlightTitle: {color: theme.colors.text, fontSize: 13, fontWeight: '800'},
  highlightText: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 11.5,
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
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 12,
  },
  summaryTitle: {color: theme.colors.text, fontSize: 15, fontWeight: '800'},
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 9,
  },
  summaryText: {flex: 1, color: theme.colors.textSecondary, fontSize: 12, lineHeight: 17},
  finalNote: {
    marginTop: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  finalNoteCopy: {flex: 1, marginLeft: 10},
  finalNoteTitle: {color: theme.colors.text, fontSize: 13, fontWeight: '800'},
  finalNoteText: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 16.5,
  },
  });
}
