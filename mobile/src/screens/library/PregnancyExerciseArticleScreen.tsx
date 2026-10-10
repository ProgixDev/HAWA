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
import {EDITORIAL_IMAGE_ALT, resolveEditorialImage, PREGNANCY_EXERCISE_HERO} from '../../i18n/editorialImages';

const ID = 'exercise-bouger-enceinte';

const HERO = PREGNANCY_EXERCISE_HERO;

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const RECOMMENDED_ICONS = ['walk', 'swim', 'yoga'] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'GROSSESSE • ACTIVITÉ PHYSIQUE',
    title: 'Bouger pendant\nla grossesse',
    metaDuration: '5 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Rester active en douceur, en toute sécurité, à chaque trimestre.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Les activités recommandées',
      'Ce qu’il vaut mieux éviter',
      'Écouter les signaux de ton corps',
      'À noter',
      'À retenir',
    ],
    body1: 'La marche, la natation et le yoga prénatal sont généralement recommandés tout au long de la grossesse, à un rythme adapté à ton ressenti.',
    recommended: ['Marche', 'Natation', 'Yoga prénatal'],
    body2: 'Éviter les sports à impact ou à risque de chute, surtout à partir du deuxième trimestre :',
    toAvoid: [
      'Sports à impact (course intensive, sports de raquette rapides)',
      'Activités avec risque de chute (ski, équitation, vélo en terrain accidenté)',
      'Sports de contact ou de combat',
      'Efforts intenses en altitude ou forte chaleur',
    ],
    listenSigns: [
      'Essoufflement inhabituel ou vertiges',
      'Douleurs, saignements ou contractions pendant l’effort',
      'Fatigue qui ne passe pas après le repos',
    ],
    neutralText: 'Toujours écouter les signaux de ton corps et en parler à ta sage-femme ou ton médecin avant de commencer ou de modifier une activité physique.',
    tipTitle: 'Bon à savoir',
    tipText: 'Une activité douce et régulière est bénéfique pour la plupart des grossesses : l’essentiel est d’adapter l’intensité à chaque étape et à ton propre ressenti.',
    shareMessage: 'Bouger pendant la grossesse — AWA',
  },
  en: {
    badge: 'PREGNANCY • PHYSICAL ACTIVITY',
    title: 'Staying active\nduring pregnancy',
    metaDuration: '5 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'Staying gently active, safely, at every trimester.',
    contentsTitle: 'In this article',
    topics: [
      'Recommended activities',
      'What’s best to avoid',
      'Listening to your body’s signals',
      'Note',
      'Key takeaway',
    ],
    body1: 'Walking, swimming, and prenatal yoga are generally recommended throughout pregnancy, at a pace that matches how you feel.',
    recommended: ['Walking', 'Swimming', 'Prenatal yoga'],
    body2: 'Avoid high-impact sports or activities with a risk of falling, especially from the second trimester onward:',
    toAvoid: [
      'High-impact sports (intense running, fast-paced racquet sports)',
      'Activities with a risk of falling (skiing, horseback riding, cycling on rough terrain)',
      'Contact or combat sports',
      'Intense exertion at altitude or in extreme heat',
    ],
    listenSigns: [
      'Unusual shortness of breath or dizziness',
      'Pain, bleeding, or contractions during exertion',
      'Fatigue that doesn’t go away after resting',
    ],
    neutralText: 'Always listen to your body’s signals and talk to your midwife or doctor before starting or changing a physical activity.',
    tipTitle: 'Good to know',
    tipText: 'Gentle, regular activity is beneficial for most pregnancies: the key is adapting the intensity to each stage and to how you feel.',
    shareMessage: 'Staying active during pregnancy — AWA',
  },
  es: {
    badge: 'EMBARAZO • ACTIVIDAD FÍSICA',
    title: 'Moverte durante\nel embarazo',
    metaDuration: '5 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Mantenerte activa con suavidad, con toda seguridad, en cada trimestre.',
    contentsTitle: 'En este artículo',
    topics: [
      'Las actividades recomendadas',
      'Lo que es mejor evitar',
      'Escuchar las señales de tu cuerpo',
      'Para tener en cuenta',
      'Para recordar',
    ],
    body1: 'Caminar, nadar y el yoga prenatal generalmente se recomiendan durante todo el embarazo, a un ritmo adaptado a cómo te sientas.',
    recommended: ['Caminar', 'Natación', 'Yoga prenatal'],
    body2: 'Evita los deportes de impacto o con riesgo de caída, sobre todo a partir del segundo trimestre:',
    toAvoid: [
      'Deportes de impacto (carrera intensa, deportes de raqueta rápidos)',
      'Actividades con riesgo de caída (esquí, equitación, bicicleta en terreno accidentado)',
      'Deportes de contacto o de combate',
      'Esfuerzos intensos en altitud o con mucho calor',
    ],
    listenSigns: [
      'Falta de aire inusual o mareos',
      'Dolor, sangrado o contracciones durante el esfuerzo',
      'Fatiga que no desaparece después de descansar',
    ],
    neutralText: 'Escucha siempre las señales de tu cuerpo y habla con tu partera o tu médico antes de empezar o modificar una actividad física.',
    tipTitle: 'DATO ÚTIL',
    tipText: 'Una actividad suave y regular es beneficiosa para la mayoría de los embarazos: lo esencial es adaptar la intensidad a cada etapa y a cómo te sientas.',
    shareMessage: 'Moverte durante el embarazo — AWA',
  },
  it: {
    badge: 'GRAVIDANZA • ATTIVITÀ FISICA',
    title: 'Restare attiva\ndurante la gravidanza',
    metaDuration: '5 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Restare attiva con dolcezza e in sicurezza, in ogni trimestre.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Attività consigliate',
      'Cosa è meglio evitare',
      'Ascoltare i segnali del tuo corpo',
      'Nota',
      'Punto chiave',
    ],
    body1: 'Camminare, nuotare e fare yoga prenatale sono in genere attività consigliate per tutta la gravidanza, a un ritmo adatto a come ti senti.',
    recommended: [
      'Camminata',
      'Nuoto',
      'Yoga prenatale',
    ],
    body2: 'Evita gli sport ad alto impatto o le attività con rischio di caduta, soprattutto dal secondo trimestre in poi:',
    toAvoid: [
      'Sport ad alto impatto (corsa intensa, sport con la racchetta a ritmo sostenuto)',
      'Attività con rischio di caduta (sci, equitazione, ciclismo su terreni accidentati)',
      'Sport di contatto o da combattimento',
      'Sforzi intensi in quota o con caldo estremo',
    ],
    listenSigns: [
      'Mancanza di fiato o capogiri insoliti',
      'Dolore, sanguinamento o contrazioni durante lo sforzo',
      'Stanchezza che non passa dopo il riposo',
    ],
    neutralText: 'Ascolta sempre i segnali del tuo corpo e parlane con la tua ostetrica o il tuo medico prima di iniziare o modificare un’attività fisica.',
    tipTitle: 'Da sapere',
    tipText: 'Un’attività dolce e regolare è benefica per la maggior parte delle gravidanze: l’importante è adattare l’intensità a ogni fase e a come ti senti.',
    shareMessage: 'Restare attiva durante la gravidanza — AWA',
  },
  tr: {
    badge: 'GEBELİK • FİZİKSEL AKTİVİTE',
    title: 'Gebelikte\naktif kalmak',
    metaDuration: '5 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Her trimesterde nazikçe ve güvenle aktif kalmak.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Önerilen aktiviteler',
      'Kaçınmak daha iyi olanlar',
      'Bedeninin sinyallerini dinlemek',
      'Not',
      'Öne çıkan nokta',
    ],
    body1: 'Yürüyüş, yüzme ve gebelik yogası, kendini nasıl hissettiğine uygun bir tempoda, gebelik boyunca genellikle önerilir.',
    recommended: [
      'Yürüyüş',
      'Yüzme',
      'Gebelik yogası',
    ],
    body2: 'Özellikle ikinci trimesterden itibaren yüksek etkili sporlardan veya düşme riski taşıyan aktivitelerden kaçın:',
    toAvoid: [
      'Yüksek etkili sporlar (yoğun koşu, hızlı tempolu raket sporları)',
      'Düşme riski taşıyan aktiviteler (kayak, at binme, engebeli arazide bisiklet)',
      'Temaslı veya dövüş sporları',
      'Yüksek rakımda veya aşırı sıcakta yoğun efor',
    ],
    listenSigns: [
      'Alışılmadık nefes darlığı veya baş dönmesi',
      'Efor sırasında ağrı, kanama veya kasılmalar',
      'Dinlenince geçmeyen yorgunluk',
    ],
    neutralText: 'Bedeninin sinyallerini her zaman dinle ve fiziksel bir aktiviteye başlamadan ya da onu değiştirmeden önce ebenle veya doktorunla konuş.',
    tipTitle: 'Bilmekte fayda var',
    tipText: 'Nazik ve düzenli aktivite çoğu gebelik için yararlıdır: önemli olan yoğunluğu her evreye ve kendini nasıl hissettiğine göre ayarlamaktır.',
    shareMessage: 'Gebelikte aktif kalmak — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function PregnancyExerciseArticleScreen({
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
          <Image accessible accessibilityLabel={EDITORIAL_IMAGE_ALT.pregnancyExercise[lang]} accessibilityRole="image" source={resolveEditorialImage(HERO, lang)} resizeMode="cover" style={styles.hero} />

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
            {RECOMMENDED_ICONS.map((icon, index) => (
              <View key={icon} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={icon as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <Text style={styles.dailyText}>{content.recommended[index]}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.h2}>2. {content.topics[1]}</Text>

          <Text style={styles.body}>
            {content.body2}
          </Text>

          <View style={styles.checkList}>
            {content.toAvoid.map(item => (
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

          <Text style={styles.h2}>3. {content.topics[2]}</Text>

          <View style={styles.consultCard}>
            {content.listenSigns.map(item => (
              <View key={item} style={styles.consultRow}>
                <View style={styles.consultIcon}>
                  <MaterialDesignIcons
                    name="alert-circle-outline"
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
