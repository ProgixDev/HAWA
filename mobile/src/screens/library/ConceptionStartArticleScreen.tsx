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

const ID = 'conceptiontips-essayer-de-concevoir';

const HERO = require('../../assets/images/library/featured-tracker.png');

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'ESSAYER DE CONCEVOIR',
    title: 'Essayer de concevoir :\npar où commencer',
    metaDuration: '6 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Les repères essentiels pour démarrer sereinement ton parcours de conception.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Identifier sa fenêtre fertile',
      'Le rythme des rapports',
      'Combien de temps cela peut prendre',
      'À retenir',
    ],
    body1: 'La première étape la plus utile consiste à identifier ta fenêtre fertile grâce à ton cycle : durée du cycle, signes physiques et, si tu le souhaites, des outils de suivi comme les tests d’ovulation ou la température basale.',
    body2: 'Des rapports réguliers, tous les 2 à 3 jours, couvrent naturellement la période la plus fertile, sans nécessiter une planification trop rigide.',
    rhythmPoints: [
      'Pas besoin de te limiter au seul jour de l’ovulation',
      'Un rythme régulier reste plus simple à maintenir qu’une planification stricte',
      'Le bien-être du couple compte aussi pendant cette période',
    ],
    body3: 'La majorité des couples conçoivent dans les 12 mois suivant l’arrêt de la contraception. Ce délai varie selon de nombreux facteurs propres à chaque situation.',
    alertTitle: 'À noter',
    alertText: 'Au-delà de 12 mois (ou 6 mois après 35 ans), il est conseillé de consulter un professionnel de santé pour un bilan, sans que cela signifie nécessairement un problème.',
    tipTitle: 'Bon à savoir',
    tipText: 'Connaître son cycle, garder un rythme naturel et rester patiente sont les trois piliers d’un début de parcours serein.',
    shareMessage: 'Essayer de concevoir : par où commencer — AWA',
  },
  en: {
    badge: 'TRYING TO CONCEIVE',
    title: 'Trying to conceive:\nwhere to start',
    metaDuration: '6 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'The essential pointers to start your conception journey with confidence.',
    contentsTitle: 'In this article',
    topics: [
      'Identifying your fertile window',
      'The rhythm of intercourse',
      'How long it can take',
      'Key takeaways',
    ],
    body1: 'The most useful first step is identifying your fertile window using your cycle: cycle length, physical signs, and, if you’d like, tracking tools such as ovulation tests or basal body temperature.',
    body2: 'Having intercourse regularly, every 2 to 3 days, naturally covers your most fertile period without requiring overly rigid planning.',
    rhythmPoints: [
      'No need to limit yourself to the day of ovulation alone',
      'A regular rhythm is easier to keep up than strict planning',
      'The couple’s well-being matters too during this time',
    ],
    body3: 'Most couples conceive within 12 months of stopping contraception. This timeframe varies depending on many factors specific to each situation.',
    alertTitle: 'Please note',
    alertText: 'Beyond 12 months (or 6 months after age 35), it’s advisable to see a healthcare professional for a check-up, though this doesn’t necessarily mean there’s a problem.',
    tipTitle: 'Good to know',
    tipText: 'Knowing your cycle, keeping a natural rhythm, and staying patient are the three pillars of a calm start to this journey.',
    shareMessage: 'Trying to conceive: where to start — AWA',
  },
  es: {
    badge: 'INTENTAR CONCEBIR',
    title: 'Intentar concebir:\npor dónde empezar',
    metaDuration: '6 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Las claves esenciales para comenzar tu camino hacia la concepción con tranquilidad.',
    contentsTitle: 'En este artículo',
    topics: [
      'Identificar tu ventana fértil',
      'El ritmo de las relaciones',
      'Cuánto tiempo puede llevar',
      'Para recordar',
    ],
    body1: 'El primer paso más útil consiste en identificar tu ventana fértil a partir de tu ciclo: duración del ciclo, signos físicos y, si lo deseas, herramientas de seguimiento como los test de ovulación o la temperatura basal.',
    body2: 'Tener relaciones con regularidad, cada 2 o 3 días, cubre de forma natural el período más fértil, sin necesidad de una planificación demasiado rígida.',
    rhythmPoints: [
      'No hace falta limitarte únicamente al día de la ovulación',
      'Un ritmo regular es más fácil de mantener que una planificación estricta',
      'El bienestar de la pareja también cuenta durante este período',
    ],
    body3: 'La mayoría de las parejas conciben dentro de los 12 meses posteriores a dejar la anticoncepción. Este plazo varía según numerosos factores propios de cada situación.',
    alertTitle: 'Ten en cuenta',
    alertText: 'Pasados los 12 meses (o 6 meses después de los 35 años), se recomienda consultar a un profesional de la salud para un chequeo, sin que eso signifique necesariamente que haya un problema.',
    tipTitle: 'DATO ÚTIL',
    tipText: 'Conocer tu ciclo, mantener un ritmo natural y tener paciencia son los tres pilares de un comienzo de camino tranquilo.',
    shareMessage: 'Intentar concebir: por dónde empezar — AWA',
  },
  it: {
    badge: 'CERCARE UNA GRAVIDANZA',
    title: 'Cercare una gravidanza:\nda dove iniziare',
    metaDuration: '6 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'I punti essenziali per iniziare con serenità il tuo percorso verso il concepimento.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Individuare la tua finestra fertile',
      'Il ritmo dei rapporti',
      'Quanto tempo può servire',
      'I punti chiave',
    ],
    body1: 'Il primo passo più utile è individuare la tua finestra fertile a partire dal ciclo: durata del ciclo, segni fisici e, se vuoi, strumenti di monitoraggio come i test di ovulazione o la temperatura basale.',
    body2: 'Avere rapporti con regolarità, ogni 2-3 giorni, copre naturalmente il tuo periodo più fertile senza richiedere una pianificazione troppo rigida.',
    rhythmPoints: [
      'Non serve limitarsi al solo giorno dell’ovulazione',
      'Un ritmo regolare è più facile da mantenere di una pianificazione rigida',
      'In questo periodo conta anche il benessere della coppia',
    ],
    body3: 'La maggior parte delle coppie concepisce entro 12 mesi dall’interruzione della contraccezione. Questi tempi variano in base a numerosi fattori propri di ogni situazione.',
    alertTitle: 'Attenzione',
    alertText: 'Dopo 12 mesi (o 6 mesi dopo i 35 anni) è consigliabile rivolgersi a un professionista sanitario per un controllo, anche se questo non significa necessariamente che ci sia un problema.',
    tipTitle: 'Da sapere',
    tipText: 'Conoscere il tuo ciclo, mantenere un ritmo naturale e avere pazienza sono i tre pilastri per iniziare questo percorso con calma.',
    shareMessage: 'Cercare una gravidanza: da dove iniziare — AWA',
  },
  tr: {
    badge: 'HAMİLE KALMAYA ÇALIŞMA',
    title: 'Hamile kalmaya çalışmak:\nnereden başlamalı',
    metaDuration: '6 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Hamile kalma yolculuğuna güvenle başlamak için temel ipuçları.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Doğurganlık dönemini belirlemek',
      'İlişki sıklığı',
      'Ne kadar sürebilir',
      'Önemli noktalar',
    ],
    body1: 'En faydalı ilk adım, döngünden yola çıkarak doğurganlık dönemini belirlemektir: döngü uzunluğu, bedensel belirtiler ve istersen ovülasyon testleri ya da bazal vücut sıcaklığı gibi takip araçları.',
    body2: '2 ila 3 günde bir düzenli olarak cinsel ilişkide bulunmak, aşırı katı bir planlama gerektirmeden en doğurgan dönemini doğal olarak kapsar.',
    rhythmPoints: [
      'Yalnızca yumurtlama gününe sıkışıp kalmana gerek yok',
      'Düzenli bir ritmi sürdürmek, katı bir planlamaya göre daha kolaydır',
      'Bu süreçte çiftin iyi oluşu da önemlidir',
    ],
    body3: 'Çiftlerin çoğu doğum kontrolünü bıraktıktan sonraki 12 ay içinde hamile kalır. Bu süre, her duruma özgü birçok etkene göre değişir.',
    alertTitle: 'Dikkat',
    alertText: '12 ayı aştığında (35 yaşından sonra ise 6 ayı aştığında) bir sağlık profesyoneline görünerek kontrolden geçmek önerilir; bu, mutlaka bir sorun olduğu anlamına gelmez.',
    tipTitle: 'Bilmekte fayda var',
    tipText: 'Döngünü tanımak, doğal bir ritmi korumak ve sabırlı olmak, bu yolculuğa sakin bir başlangıcın üç temel taşıdır.',
    shareMessage: 'Hamile kalmaya çalışmak: nereden başlamalı — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function ConceptionStartArticleScreen({
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

          <Text style={styles.h2}>2. {content.topics[1]}</Text>

          <Text style={styles.body}>
            {content.body2}
          </Text>

          <View style={styles.checkList}>
            {content.rhythmPoints.map(item => (
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

          <Text style={styles.body}>
            {content.body3}
          </Text>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.alertTitle}</Text>
              <Text style={styles.tipText}>
                {content.alertText}
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>4. {content.topics[3]}</Text>

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
  alert: {
    marginTop: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },
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
  tipText: {marginTop: 3, fontSize: 11.5, lineHeight: 17, color: theme.colors.textSecondary},
  });
}
