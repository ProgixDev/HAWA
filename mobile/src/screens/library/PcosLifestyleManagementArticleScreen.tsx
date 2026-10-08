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

const ID = 'pcos-mode-de-vie-prise-en-charge';

const HERO = require('../../assets/images/library/spm-yoga.png');

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'SOPK',
    title: 'Mode de vie et\nprise en charge du SOPK',
    metaDuration: '7 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Les options de prise en charge du SOPK, et des habitudes simples pour accompagner ton quotidien.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Un accompagnement construit avec un professionnel',
      'Alimentation équilibrée',
      'Activité physique adaptée',
      'Sommeil et gestion du stress',
      'Bien-être émotionnel',
      'Signaux qui méritent une attention rapide',
      'À retenir',
    ],
    nutritionTips: [
      'Privilégier les fibres (légumes, légumineuses, céréales complètes)',
      'Répartir les repas pour éviter les grandes fringales',
      'Limiter les sucres rapides et les produits très transformés',
      'Pas d’aliment interdit : viser un équilibre global plutôt que des règles strictes',
    ],
    section1Body: 'Il n’existe pas de traitement unique du SOPK : la prise en charge est adaptée à tes symptômes, tes priorités (cycle, fertilité, peau, poids) et ta situation personnelle. Elle peut associer mesures d’hygiène de vie, traitements hormonaux ou autres options selon les besoins.',
    section3Body: 'Une activité physique régulière, même modérée (marche rapide, vélo, renforcement léger), aide à soutenir l’équilibre hormonal et métabolique. L’essentiel est la régularité, plus que l’intensité.',
    section4Body: 'Un sommeil suffisant et des moments de détente réguliers contribuent à limiter l’impact du stress sur l’équilibre hormonal, qui peut lui-même influencer les symptômes du SOPK.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'De petits changements durables sont souvent plus efficaces sur le long terme que des changements radicaux difficiles à maintenir.',
    section5Body: 'Vivre avec le SOPK peut peser sur le moral, notamment à cause de symptômes visibles ou de doutes sur la fertilité. Ces émotions sont légitimes : en parler à un proche ou à un professionnel fait pleinement partie d’une prise en charge complète.',
    alertTitle: 'Consulter si',
    alertText: 'Des douleurs pelviennes intenses ou inhabituelles, des saignements très abondants ou prolongés, une fatigue extrême ou une soif persistante inhabituelle, ou un mal-être émotionnel qui s’installe dans la durée.',
    tip2Title: 'Bon à savoir',
    tip2Text: 'Le SOPK se gère au quotidien avec des habitudes simples et un suivi médical régulier : chaque petit ajustement compte, à ton propre rythme.',
    shareMessage: 'Mode de vie et prise en charge du SOPK — AWA',
  },
  en: {
    badge: 'PCOS',
    title: 'PCOS lifestyle and\nmanagement',
    metaDuration: '7 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'Management options for PCOS, and simple habits to support your everyday life.',
    contentsTitle: 'In this article',
    topics: [
      'Care built together with a professional',
      'Balanced diet',
      'Suitable physical activity',
      'Sleep and stress management',
      'Emotional well-being',
      'Signs that call for prompt attention',
      'Key takeaways',
    ],
    nutritionTips: [
      'Favor fiber (vegetables, legumes, whole grains)',
      'Spread meals out to avoid intense hunger',
      'Limit fast sugars and highly processed foods',
      'No food is off-limits: aim for overall balance rather than strict rules',
    ],
    section1Body: 'There is no single treatment for PCOS: management is tailored to your symptoms, your priorities (cycle, fertility, skin, weight), and your personal situation. It can combine lifestyle measures, hormonal treatments, or other options depending on your needs.',
    section3Body: 'Regular physical activity, even moderate (brisk walking, cycling, light strength training), helps support hormonal and metabolic balance. Consistency matters more than intensity.',
    section4Body: 'Getting enough sleep and taking regular moments to relax help limit the impact of stress on hormonal balance, which can in turn influence PCOS symptoms.',
    tip1Title: 'Good to know',
    tip1Text: 'Small, lasting changes are often more effective in the long run than radical changes that are hard to maintain.',
    section5Body: 'Living with PCOS can weigh on your mood, especially because of visible symptoms or worries about fertility. These feelings are valid: talking to someone close to you or to a professional is a full part of comprehensive care.',
    alertTitle: 'See a doctor if',
    alertText: 'Intense or unusual pelvic pain, very heavy or prolonged bleeding, extreme fatigue or unusual persistent thirst, or emotional distress that settles in over time.',
    tip2Title: 'Good to know',
    tip2Text: 'PCOS is managed day to day with simple habits and regular medical follow-up: every small adjustment counts, at your own pace.',
    shareMessage: 'PCOS lifestyle and management — AWA',
  },
  es: {
    badge: 'SOP',
    title: 'Estilo de vida y\nmanejo del SOP',
    metaDuration: '7 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Las opciones de manejo del SOP, y hábitos sencillos para acompañar tu día a día.',
    contentsTitle: 'En este artículo',
    topics: [
      'Un acompañamiento construido con un profesional',
      'Alimentación equilibrada',
      'Actividad física adaptada',
      'Sueño y manejo del estrés',
      'Bienestar emocional',
      'Señales que merecen atención rápida',
      'Para recordar',
    ],
    nutritionTips: [
      'Priorizar la fibra (verduras, legumbres, cereales integrales)',
      'Repartir las comidas para evitar grandes hambres',
      'Limitar los azúcares rápidos y los productos muy procesados',
      'Ningún alimento prohibido: apuntar a un equilibrio global más que a reglas estrictas',
    ],
    section1Body: 'No existe un tratamiento único para el SOP: el manejo se adapta a tus síntomas, tus prioridades (ciclo, fertilidad, piel, peso) y tu situación personal. Puede combinar medidas de estilo de vida, tratamientos hormonales u otras opciones según las necesidades.',
    section3Body: 'Una actividad física regular, incluso moderada (caminar a paso rápido, bicicleta, fortalecimiento ligero), ayuda a sostener el equilibrio hormonal y metabólico. Lo esencial es la regularidad, más que la intensidad.',
    section4Body: 'Un sueño suficiente y momentos de relajación regulares contribuyen a limitar el impacto del estrés sobre el equilibrio hormonal, que a su vez puede influir en los síntomas del SOP.',
    tip1Title: 'Dato útil',
    tip1Text: 'Pequeños cambios duraderos suelen ser más eficaces a largo plazo que cambios radicales difíciles de mantener.',
    section5Body: 'Vivir con el SOP puede pesar en el ánimo, especialmente por síntomas visibles o dudas sobre la fertilidad. Estas emociones son legítimas: hablar de ello con alguien cercano o con un profesional forma plenamente parte de un manejo completo.',
    alertTitle: 'Consultar si',
    alertText: 'Dolores pélvicos intensos o inusuales, sangrados muy abundantes o prolongados, una fatiga extrema o una sed persistente inusual, o un malestar emocional que se instala en el tiempo.',
    tip2Title: 'Dato útil',
    tip2Text: 'El SOP se maneja día a día con hábitos sencillos y un seguimiento médico regular: cada pequeño ajuste cuenta, a tu propio ritmo.',
    shareMessage: 'Estilo de vida y manejo del SOP — AWA',
  },
  it: {
    badge: 'PCOS',
    title: 'PCOS: stile di vita e\ngestione',
    metaDuration: '7 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Le opzioni di gestione della PCOS e semplici abitudini per sostenere la tua vita quotidiana.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Un percorso di cura costruito insieme a un professionista',
      'Alimentazione equilibrata',
      'Attività fisica adatta',
      'Sonno e gestione dello stress',
      'Benessere emotivo',
      'Segnali che richiedono attenzione tempestiva',
      'Punti chiave',
    ],
    nutritionTips: [
      'Privilegia le fibre (verdure, legumi, cereali integrali)',
      'Distribuisci i pasti nell’arco della giornata per evitare una fame intensa',
      'Limita gli zuccheri semplici e gli alimenti molto processati',
      'Nessun alimento è vietato: punta all’equilibrio generale piuttosto che a regole rigide',
    ],
    section1Body: 'Non esiste un trattamento unico per la PCOS: la gestione viene adattata ai tuoi sintomi, alle tue priorità (ciclo, fertilità, pelle, peso) e alla tua situazione personale. Può combinare misure legate allo stile di vita, terapie ormonali o altre opzioni, a seconda delle tue esigenze.',
    section3Body: 'Un’attività fisica regolare, anche moderata (camminata a passo svelto, bicicletta, esercizi di rinforzo muscolare leggeri), aiuta a sostenere l’equilibrio ormonale e metabolico. La costanza conta più dell’intensità.',
    section4Body: 'Dormire a sufficienza e concederti regolarmente momenti di relax aiuta a limitare l’impatto dello stress sull’equilibrio ormonale, che a sua volta può influenzare i sintomi della PCOS.',
    tip1Title: 'Da sapere',
    tip1Text: 'Piccoli cambiamenti duraturi sono spesso più efficaci a lungo termine rispetto a cambiamenti radicali difficili da mantenere.',
    section5Body: 'Convivere con la PCOS può pesare sull’umore, soprattutto a causa dei sintomi visibili o delle preoccupazioni sulla fertilità. Queste emozioni sono legittime: parlarne con una persona a te vicina o con un professionista fa pienamente parte di una cura completa.',
    alertTitle: 'Rivolgiti al medico se',
    alertText: 'Hai dolore pelvico intenso o insolito, sanguinamento molto abbondante o prolungato, stanchezza estrema o sete insolita e persistente, oppure un disagio emotivo che si protrae nel tempo.',
    tip2Title: 'Da sapere',
    tip2Text: 'La PCOS si gestisce giorno per giorno con abitudini semplici e un follow-up medico regolare: ogni piccolo aggiustamento conta, al tuo ritmo.',
    shareMessage: 'PCOS: stile di vita e gestione — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function PcosLifestyleManagementArticleScreen({
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

          <Text style={styles.h2}>
            1. {content.topics[0]}
          </Text>

          <Text style={styles.body}>
            {content.section1Body}
          </Text>

          <Text style={styles.h2}>2. {content.topics[1]}</Text>

          <View style={styles.checkList}>
            {content.nutritionTips.map(item => (
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
            {content.section3Body}
          </Text>

          <Text style={styles.h2}>4. {content.topics[3]}</Text>

          <Text style={styles.body}>
            {content.section4Body}
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

          <Text style={styles.h2}>5. {content.topics[4]}</Text>

          <Text style={styles.body}>
            {content.section5Body}
          </Text>

          <Text style={styles.h2}>
            6. {content.topics[5]}
          </Text>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-circle-outline"
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

          <Text style={styles.h2}>7. {content.topics[6]}</Text>

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
    color: theme.colors.textSecondary,
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
