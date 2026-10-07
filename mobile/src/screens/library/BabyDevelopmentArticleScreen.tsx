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

const ID = 'babydevelopment-developpement-bebe';

const HERO = require('../../assets/images/library/cycle-phases-diagram.png');

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const MILESTONE_ICONS = [
  'heart-pulse',
  'baby-face-outline',
  'ear-hearing',
  'eye-outline',
] as const;

// PHASE 7L.2 — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'GROSSESSE • DÉVELOPPEMENT',
    title: 'Le développement\ndu bébé in utero',
    metaDuration: '6 min de lecture',
    metaType: 'Article',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Comment ton bébé grandit, trimestre après trimestre.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Le premier trimestre : les débuts',
      'Le deuxième trimestre : les sens s’éveillent',
      'Le troisième trimestre : la dernière ligne droite',
      'Les grandes étapes en un coup d’œil',
      'Idées reçues',
      'À retenir',
    ],
    body1: 'Dès la 6e semaine, un cœur minuscule commence déjà à battre. Au cours de ce premier trimestre, les organes principaux se mettent progressivement en place.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Le rythme cardiaque du bébé est l’un des premiers signes visibles à l’échographie, souvent un moment marquant du suivi.',
    body2: 'Vers la 20e semaine, tu peux généralement ressentir les premiers mouvements du bébé. C’est aussi la période où ses sens commencent à se développer.',
    body3: 'À partir du 3e trimestre, le bébé prend rapidement du poids et se positionne progressivement pour la naissance.',
    neutralText: 'Le rythme de développement varie d’un bébé à l’autre : ces repères restent des moyennes générales.',
    milestones: [
      'Dès 6 semaines : le cœur commence à battre',
      'Vers 20 semaines : premiers mouvements ressentis',
      'Vers 24-26 semaines : l’audition se développe',
      'Vers 28 semaines : les yeux s’ouvrent progressivement',
    ],
    myths: [
      'Le bébé « entend tout » dès le début : l’audition ne se développe réellement qu’à partir du 2e trimestre',
      'La forme du ventre indique le sexe du bébé : aucune preuve scientifique ne le confirme',
      'Un bébé actif est forcément en meilleure santé : le niveau d’activité varie beaucoup d’un bébé à l’autre',
    ],
    tip2Title: 'Bon à savoir',
    tip2Text: 'Chaque étape du développement du bébé suit un rythme propre ; le suivi médical régulier permet de vérifier que tout évolue normalement.',
    shareMessage: 'Le développement du bébé in utero — AWA',
  },
  en: {
    badge: 'PREGNANCY • DEVELOPMENT',
    title: 'Your baby’s development\nin utero',
    metaDuration: '6 min read',
    metaType: 'Article',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'How your baby grows, trimester by trimester.',
    contentsTitle: 'In this article',
    topics: [
      'The first trimester: the early days',
      'The second trimester: the senses awaken',
      'The third trimester: the home stretch',
      'Key milestones at a glance',
      'Common myths',
      'What to remember',
    ],
    body1: 'From as early as week 6, a tiny heart already begins to beat. Over the course of this first trimester, the main organs gradually form.',
    tip1Title: 'Good to know',
    tip1Text: 'The baby’s heartbeat is one of the first visible signs on ultrasound, often a memorable moment in your care.',
    body2: 'Around week 20, you can usually feel the baby’s first movements. This is also when the senses start to develop.',
    body3: 'From the 3rd trimester onward, the baby gains weight quickly and gradually moves into position for birth.',
    neutralText: 'The pace of development varies from baby to baby: these milestones remain general averages.',
    milestones: [
      'From 6 weeks: the heart begins to beat',
      'Around 20 weeks: first movements felt',
      'Around 24-26 weeks: hearing develops',
      'Around 28 weeks: the eyes gradually open',
    ],
    myths: [
      'The baby “hears everything” from the start: hearing doesn’t really develop until the 2nd trimester',
      'The shape of the belly indicates the baby’s sex: no scientific evidence supports this',
      'An active baby is necessarily healthier: activity levels vary widely from one baby to another',
    ],
    tip2Title: 'Good to know',
    tip2Text: 'Each stage of the baby’s development follows its own pace; regular medical check-ups help confirm that everything is progressing normally.',
    shareMessage: 'Baby’s development in utero — AWA',
  },
  es: {
    badge: 'EMBARAZO • DESARROLLO',
    title: 'El desarrollo\ndel bebé en el útero',
    metaDuration: '6 min de lectura',
    metaType: 'Artículo',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Cómo crece tu bebé, trimestre tras trimestre.',
    contentsTitle: 'En este artículo',
    topics: [
      'El primer trimestre: los inicios',
      'El segundo trimestre: los sentidos despiertan',
      'El tercer trimestre: la recta final',
      'Los grandes hitos de un vistazo',
      'Ideas falsas',
      'Para recordar',
    ],
    body1: 'Ya desde la semana 6, un corazón diminuto empieza a latir. A lo largo de este primer trimestre, los órganos principales se van formando progresivamente.',
    tip1Title: 'DATO ÚTIL',
    tip1Text: 'El ritmo cardíaco del bebé es una de las primeras señales visibles en la ecografía, a menudo un momento destacado del seguimiento.',
    body2: 'Hacia la semana 20, generalmente puedes sentir los primeros movimientos del bebé. También es el periodo en el que sus sentidos empiezan a desarrollarse.',
    body3: 'A partir del 3.er trimestre, el bebé gana peso rápidamente y se va colocando progresivamente para el nacimiento.',
    neutralText: 'El ritmo de desarrollo varía de un bebé a otro: estas referencias siguen siendo promedios generales.',
    milestones: [
      'Desde las 6 semanas: el corazón empieza a latir',
      'Hacia las 20 semanas: primeros movimientos percibidos',
      'Hacia las 24-26 semanas: se desarrolla la audición',
      'Hacia las 28 semanas: los ojos se abren progresivamente',
    ],
    myths: [
      'El bebé «lo oye todo» desde el principio: la audición solo se desarrolla realmente a partir del 2.º trimestre',
      'La forma de la barriga indica el sexo del bebé: ninguna prueba científica lo confirma',
      'Un bebé activo es necesariamente más sano: el nivel de actividad varía mucho de un bebé a otro',
    ],
    tip2Title: 'DATO ÚTIL',
    tip2Text: 'Cada etapa del desarrollo del bebé sigue su propio ritmo; el seguimiento médico regular permite comprobar que todo evoluciona con normalidad.',
    shareMessage: 'El desarrollo del bebé en el útero — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function BabyDevelopmentArticleScreen({
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
            {content.body2}
          </Text>

          <Text style={styles.h2}>
            3. {content.topics[2]}
          </Text>

          <Text style={styles.body}>
            {content.body3}
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

          <Text style={styles.h2}>4. {content.topics[3]}</Text>

          <View style={styles.daily}>
            {MILESTONE_ICONS.map((icon, index) => (
              <View key={content.milestones[index]} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={icon as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <Text style={styles.dailyText}>{content.milestones[index]}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.h2}>5. {content.topics[4]}</Text>

          <View style={styles.checkList}>
            {content.myths.map(item => (
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

          <Text style={styles.h2}>6. {content.topics[5]}</Text>

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
  });
}
