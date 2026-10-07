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
import {
  isArticleBookmarked,
  loadLibraryState,
  saveScrollPosition,
  toggleBookmark,
} from '../../state/libraryStore';
import ReadingControls from '../../components/articles/ReadingControls';
import {getBottomPadding, getTopPadding, READING_CONTROLS_SPACE} from '../../theme/spacing';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';

const ID = 'flow-colors-textures';

const HERO = require('../../assets/images/library/flow-colors-hero.png');
const WARNING = require('../../assets/images/library/flow-colors-warning.png');

// fixed: these hex values are real educational flow-color swatches (this
// article's actual subject matter), not generic UI chrome — they must stay
// literal regardless of theme so the color example itself is accurate.
// Only the label/description TEXT moves into the bilingual CONTENT object
// below (CONTENT.fr.colors / CONTENT.en.colors), keyed by index to stay
// aligned with these swatches.
const COLOR_SWATCHES = [
  '#C42031',
  '#7F2D31',
  '#9E7462',
  '#E66770',
  '#F47B2A',
] as const;

// Images stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below (CONTENT.fr.textures / CONTENT.en.textures), keyed by index
// to stay aligned with these illustrations.
const TEXTURE_IMAGES = [
  require('../../assets/images/library/flow-texture-fluid.png'),
  require('../../assets/images/library/flow-texture-creamy.png'),
  require('../../assets/images/library/flow-texture-clots.png'),
  require('../../assets/images/library/flow-texture-mucus.png'),
  require('../../assets/images/library/flow-texture-tissue.png'),
] as const;

// fixed: same reasoning as COLOR_SWATCHES above — these dots illustrate the
// actual flow-color meanings discussed in the text, not decorative UI
// chrome. Only the label/description TEXT moves into CONTENT.fr.meanings /
// CONTENT.en.meanings, keyed by index to stay aligned with these dots.
const MEANING_DOTS = ['#B8182D', '#A97864', '#E45F6B', '#F47B2A'] as const;

// Icon names are not natural language — only TEXT moves into
// CONTENT.fr.advice / CONTENT.en.advice, keyed by index to stay aligned
// with these icons.
const ADVICE_ICONS = [
  'calendar-month-outline',
  'shield-cross-outline',
  'heart-outline',
  'doctor',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// hex swatches, icons, bookmark/progress keys, JSX structure) is untouched;
// only this object changes per language. The French text below is
// byte-identical to the original — never retyped, only moved into the `fr`
// key — so the app remains fully bilingual rather than having French
// replaced by English.
const CONTENT = {
  fr: {
    badge: 'CYCLE & BIEN-ÊTRE',
    title: 'Flux menstruel : comprendre\nles couleurs et textures',
    metaDuration: '4 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro:
      'La couleur et la texture de tes règles en disent long sur ta santé hormonale. Apprends à les décrypter pour mieux comprendre ton cycle.',
    contentsTitle: 'Dans cet article',
    contents: [
      'Les couleurs du flux menstruel',
      'Les textures du flux',
      'Ce que chaque couleur peut indiquer',
      'Quand faut-il s’inquiéter ?',
      'Nos conseils pour mieux te connaître',
    ],
    colors: [
      {name: 'Rouge vif', text: 'Flux frais, nouveau sang. Fréquent en début de règles.'},
      {name: 'Rouge foncé', text: 'Sang plus ancien, normal en milieu de cycle.'},
      {name: 'Marron', text: 'Sang oxydé, souvent en fin de règles.'},
      {name: 'Rose', text: 'Peut indiquer un flux léger ou un changement hormonal.'},
      {name: 'Orange', text: 'Peut être lié à une infection ou à un déséquilibre.'},
    ],
    textures: [
      {name: 'Fluide', text: 'Flux liquide, sans grumeaux.'},
      {name: 'Crémeux', text: 'Texture épaisse et homogène.'},
      {name: 'Caillots', text: 'Petits ou gros caillots de sang.'},
      {name: 'Filaire / Mucus', text: 'Élastique, transparent ou blanchâtre.'},
      {name: 'Tissus', text: 'Morceaux de tissu ou de muqueuse.'},
    ],
    meanings: [
      {name: 'Rouge vif à foncé', text: 'Cycle normal. Ton corps élimine la muqueuse utérine.'},
      {name: 'Marron', text: 'Sang plus ancien, rien d’inquiétant.'},
      {name: 'Rose', text: 'Peut survenir en cas de début/fin de règles ou de déséquilibre hormonal.'},
      {name: 'Orange', text: 'Surveille si accompagné d’odeur forte, démangeaisons ou douleurs.'},
    ],
    warningTitle: 'Signes à surveiller',
    warningItems: [
      'Saignements très abondants (changer de protection toutes les 1–2 h)',
      'Présence de très gros caillots régulièrement',
      'Mauvaise odeur persistante ou démangeaisons',
      'Douleurs intenses inhabituelles',
    ],
    advice: [
      {title: 'Observe ton flux', text: 'Note les changements chaque mois.'},
      {title: 'Choisis la protection adaptée', text: 'Selon ton flux et ton confort.'},
      {title: 'Écoute ton corps', text: 'Il te donne des signaux précieux.'},
      {title: 'En cas de doute', text: 'Parle-en à un·e professionnel·le de santé.'},
    ],
    shareMessage: 'Flux menstruel : comprendre les couleurs et textures — AWA',
  },
  en: {
    badge: 'CYCLE & WELLNESS',
    title: 'Period flow: understanding\ncolors and textures',
    metaDuration: '4 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro:
      'The color and texture of your period say a lot about your hormonal health. Learn to read them to better understand your cycle.',
    contentsTitle: 'In this article',
    contents: [
      'The colors of period flow',
      'The textures of flow',
      'What each color may indicate',
      'When should you be concerned?',
      'Our tips to help you know yourself better',
    ],
    colors: [
      {name: 'Bright red', text: 'Fresh flow, new blood. Common at the start of your period.'},
      {name: 'Dark red', text: 'Older blood, normal in the middle of the cycle.'},
      {name: 'Brown', text: 'Oxidized blood, often at the end of your period.'},
      {name: 'Pink', text: 'May indicate light flow or a hormonal change.'},
      {name: 'Orange', text: 'May be linked to an infection or an imbalance.'},
    ],
    textures: [
      {name: 'Fluid', text: 'Liquid flow, without clumps.'},
      {name: 'Creamy', text: 'Thick, smooth texture.'},
      {name: 'Clots', text: 'Small or large blood clots.'},
      {name: 'Stringy / Mucus', text: 'Stretchy, clear or whitish.'},
      {name: 'Tissue', text: 'Pieces of tissue or mucous membrane.'},
    ],
    meanings: [
      {name: 'Bright to dark red', text: 'Normal cycle. Your body is shedding the uterine lining.'},
      {name: 'Brown', text: 'Older blood, nothing to worry about.'},
      {name: 'Pink', text: 'May occur at the start/end of your period or with a hormonal imbalance.'},
      {name: 'Orange', text: 'Keep an eye on it if accompanied by a strong odor, itching, or pain.'},
    ],
    warningTitle: 'Signs to watch for',
    warningItems: [
      'Very heavy bleeding (changing protection every 1–2 hours)',
      'Regularly passing very large clots',
      'Persistent bad odor or itching',
      'Unusually intense pain',
    ],
    advice: [
      {title: 'Observe your flow', text: 'Note any changes each month.'},
      {title: 'Choose the right protection', text: 'Based on your flow and your comfort.'},
      {title: 'Listen to your body', text: 'It gives you valuable signals.'},
      {title: 'If in doubt', text: 'Talk to a healthcare professional.'},
    ],
    shareMessage: 'Period flow: understanding colors and textures — AWA',
  },
  es: {
    badge: 'CICLO Y BIENESTAR',
    title: 'Flujo menstrual: entender\nlos colores y las texturas',
    metaDuration: '4 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro:
      'El color y la textura de tu período dicen mucho sobre tu salud hormonal. Aprende a interpretarlos para entender mejor tu ciclo.',
    contentsTitle: 'En este artículo',
    contents: [
      'Los colores del flujo menstrual',
      'Las texturas del flujo',
      'Qué puede indicar cada color',
      '¿Cuándo hay que preocuparse?',
      'Nuestros consejos para conocerte mejor',
    ],
    colors: [
      {name: 'Rojo vivo', text: 'Flujo fresco, sangre nueva. Frecuente al inicio del período.'},
      {name: 'Rojo oscuro', text: 'Sangre más antigua, normal a mitad del ciclo.'},
      {name: 'Marrón', text: 'Sangre oxidada, frecuente al final del período.'},
      {name: 'Rosa', text: 'Puede indicar un flujo ligero o un cambio hormonal.'},
      {name: 'Naranja', text: 'Puede estar relacionado con una infección o un desequilibrio.'},
    ],
    textures: [
      {name: 'Fluido', text: 'Flujo líquido, sin grumos.'},
      {name: 'Cremoso', text: 'Textura espesa y homogénea.'},
      {name: 'Coágulos', text: 'Coágulos de sangre pequeños o grandes.'},
      {name: 'Filamentoso / Mucoso', text: 'Elástico, transparente o blanquecino.'},
      {name: 'Tejido', text: 'Fragmentos de tejido o de mucosa.'},
    ],
    meanings: [
      {name: 'Del rojo vivo al oscuro', text: 'Ciclo normal. Tu cuerpo elimina el revestimiento uterino.'},
      {name: 'Marrón', text: 'Sangre más antigua, no es motivo de preocupación.'},
      {name: 'Rosa', text: 'Puede aparecer al inicio o al final del período, o con un desequilibrio hormonal.'},
      {name: 'Naranja', text: 'Presta atención si va acompañado de olor fuerte, picor o dolor.'},
    ],
    warningTitle: 'Señales que hay que vigilar',
    warningItems: [
      'Sangrado muy abundante (cambiar de protección cada 1-2 horas)',
      'Presencia frecuente de coágulos muy grandes',
      'Mal olor persistente o picor',
      'Dolores intensos e inusuales',
    ],
    advice: [
      {title: 'Observa tu flujo', text: 'Anota los cambios cada mes.'},
      {title: 'Elige la protección adecuada', text: 'Según tu flujo y tu comodidad.'},
      {title: 'Escucha a tu cuerpo', text: 'Te da señales valiosas.'},
      {title: 'Si tienes dudas', text: 'Habla con un profesional de la salud.'},
    ],
    shareMessage: 'Flujo menstrual: entender los colores y las texturas — AWA',
  },
} as const;

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ArticleReader'
>;

export default function FlowColorsTexturesArticleScreen({
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
    let active = true;

    loadLibraryState().then(() => {
      if (active) {
        setSaved(isArticleBookmarked(ID));
      }
    });

    return () => {
      active = false;
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
          saveScrollPosition(
            ID,
            event.nativeEvent.contentOffset.y,
          )
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
          <Image
            source={HERO}
            resizeMode="cover"
            style={styles.hero}
          />

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
                accessibilityLabel={t('libraryArticle.bookmarkA11y')}
                onPress={handleBookmark}
                style={({pressed}) => [
                  styles.circle,
                  pressed && styles.pressed,
                ]}>
                <MaterialDesignIcons
                  name={
                    saved
                      ? 'bookmark'
                      : 'bookmark-outline'
                  }
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
            <Text style={styles.badgeText}>
              {content.badge}
            </Text>
          </View>

          <Text style={styles.title}>
            {content.title}
          </Text>

          {/* MÉTADONNÉES */}
          <View style={styles.metas}>
            <View style={styles.metaTopRow}>
              <View style={styles.metaItem}>
                <MaterialDesignIcons
                  name="clock-outline"
                  size={19}
                  color={theme.colors.textMuted}
                />
                <Text style={styles.metaText}>
                  {content.metaDuration}
                </Text>
              </View>

              <View style={styles.metaDivider} />

              <View style={styles.metaItem}>
                <MaterialDesignIcons
                  name="book-open-page-variant-outline"
                  size={19}
                  color={theme.colors.textMuted}
                />
                <Text style={styles.metaText}>
                  {content.metaType}
                </Text>
              </View>

              <View style={styles.metaDivider} />

              <View style={styles.metaItem}>
                <MaterialDesignIcons
                  name="chart-bar"
                  size={19}
                  color={theme.colors.textMuted}
                />
                <Text style={styles.metaText}>
                  {content.metaLevel}
                </Text>
              </View>
            </View>

            <View style={styles.metaValidatedRow}>
              <MaterialDesignIcons
                name="shield-check-outline"
                size={19}
                color={theme.colors.textMuted}
              />
              <Text style={styles.metaText}>
                {content.metaValidated}
              </Text>
            </View>
          </View>

          <Text style={styles.intro}>
            {content.intro}
          </Text>

          {/* SOMMAIRE */}
          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>
              {content.contentsTitle}
            </Text>

            {content.contents.map((item, index) => (
              <View
                key={item}
                style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <Text style={styles.contentNumber}>
                    {index + 1}.
                  </Text>

                  <Text style={styles.contentText}>
                    {item}
                  </Text>
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
          <Text style={styles.sectionTitle}>
            1. {content.contents[0]}
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cards}>
            {content.colors.map(({name, text}, index) => (
              <View
                key={COLOR_SWATCHES[index]}
                style={styles.smallCard}>
                <View style={styles.dropIcon}>
                  <MaterialDesignIcons
                    name="water"
                    size={34}
                    color={COLOR_SWATCHES[index]}
                  />
                </View>

                <Text style={styles.cardTitle}>
                  {name}
                </Text>

                <Text style={styles.cardText}>
                  {text}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* SECTION 2 */}
          <Text style={styles.sectionTitle}>
            2. {content.contents[1]}
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cards}>
            {content.textures.map(({name, text}, index) => (
              <View
                key={index}
                style={styles.smallCard}>
                <Image
                  source={TEXTURE_IMAGES[index]}
                  resizeMode="cover"
                  style={styles.textureImage}
                />

                <Text style={styles.cardTitle}>
                  {name}
                </Text>

                <Text style={styles.cardText}>
                  {text}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* SECTION 3 */}
          <Text style={styles.sectionTitle}>
            3. {content.contents[2]}
          </Text>

          <View style={styles.meanings}>
            {content.meanings.map(({name, text}, index) => (
              <View
                key={MEANING_DOTS[index]}
                style={styles.meaning}>
                <View
                  style={[
                    styles.dot,
                    {backgroundColor: MEANING_DOTS[index]},
                  ]}
                />

                <View style={styles.meaningCopy}>
                  <Text style={styles.meaningName}>
                    {name}
                  </Text>

                  <Text style={styles.meaningText}>
                    {text}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* SECTION 4 */}
          <Text style={styles.sectionTitle}>
            4. {content.contents[3]}
          </Text>

          <View style={styles.warning}>
            <Image
              source={WARNING}
              resizeMode="cover"
              style={styles.warningImage}
            />

            <View style={styles.warningOverlay}>
              <View style={styles.warningHeader}>
                <View style={styles.warningIcon}>
                  <MaterialDesignIcons
                    name="alert-circle-outline"
                    size={22}
                    color={theme.colors.warning}
                  />
                </View>

                <Text style={styles.warningTitle}>
                  {content.warningTitle}
                </Text>
              </View>

              <View style={styles.warningList}>
                {content.warningItems.map(item => (
                  <View
                    key={item}
                    style={styles.warningRow}>
                    <View style={styles.warningBullet} />
                    <Text style={styles.warningText}>
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* SECTION 5 */}
          <Text style={styles.sectionTitle}>
            5. {content.contents[4]}
          </Text>

          <View style={styles.advice}>
            {content.advice.map(({title, text}, index) => (
              <View
                key={title}
                style={styles.adviceCard}>
                <View style={styles.adviceIcon}>
                  <MaterialDesignIcons
                    name={ADVICE_ICONS[index] as never}
                    size={24}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.adviceTitle}>
                  {title}
                </Text>

                <Text style={styles.adviceText}>
                  {text}
                </Text>
              </View>
            ))}
          </View>

        </View>
      </ScrollView>

      <ReadingControls
        articleId={ID}
        durationMinutes={4}
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
    paddingBottom: 26,
  },

  heroWrap: {
    height: 255,
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
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: withAlpha(theme.colors.surface, 0.92),
  },

  pressed: {
    opacity: 0.72,
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
    fontSize: 10.5,
    fontWeight: '800',
    color: theme.colors.primary,
  },

  title: {
    marginTop: 12,
    color: theme.colors.text,
    fontFamily: 'serif',
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '700',
  },

  metas: {
    marginTop: 15,
  },

  metaTopRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  metaDivider: {
    width: 1,
    height: 20,
    marginHorizontal: 11,
    backgroundColor: theme.colors.border,
  },

  metaValidatedRow: {
    marginTop: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  metaText: {
    color: theme.colors.textMuted,
    fontSize: 11,
  },

  intro: {
    marginTop: 17,
    color: theme.colors.text,
    fontSize: 13.5,
    lineHeight: 20,
  },

  contents: {
    marginTop: 19,
    padding: 14,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  contentsTitle: {
    marginBottom: 7,
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '800',
  },

  contentRow: {
    minHeight: 36,
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
    width: 23,
    color: theme.colors.primary,
    fontSize: 11.5,
    fontWeight: '800',
  },

  contentText: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 12,
    lineHeight: 16,
  },

  sectionTitle: {
    marginTop: 24,
    marginBottom: 11,
    color: theme.colors.text,
    fontFamily: 'serif',
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '700',
  },

  cards: {
    gap: 9,
    paddingRight: 8,
    paddingBottom: 3,
  },

  smallCard: {
    width: 136,
    minHeight: 178,
    padding: 11,
    alignItems: 'center',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },

  dropIcon: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  textureImage: {
    width: 84,
    height: 68,
    borderRadius: 10,
  },

  cardTitle: {
    marginTop: 8,
    color: theme.colors.text,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    textAlign: 'center',
  },

  cardText: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: 10.5,
    lineHeight: 15,
    textAlign: 'center',
  },

  meanings: {
    gap: 7,
  },

  meaning: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 11,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  dot: {
    width: 23,
    height: 23,
    borderRadius: 12,
    marginRight: 11,
  },

  meaningCopy: {
    flex: 1,
  },

  meaningName: {
    color: theme.colors.text,
    fontSize: 11.5,
    fontWeight: '800',
  },

  meaningText: {
    marginTop: 3,
    color: theme.colors.textSecondary,
    fontSize: 10.5,
    lineHeight: 15,
  },

  warning: {
    marginTop: 3,
    overflow: 'hidden',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },

  warningImage: {
    width: '100%',
    height: 120,
  },

  warningOverlay: {
    padding: 13,
  },

  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  warningIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(theme.colors.warning, 0.18),
  },

  warningTitle: {
    marginLeft: 10,
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '800',
  },

  warningList: {
    marginTop: 10,
    gap: 7,
  },

  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  warningBullet: {
    width: 5,
    height: 5,
    marginTop: 6,
    marginRight: 8,
    borderRadius: 3,
    backgroundColor: theme.colors.warning,
  },

  warningText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 10.8,
    lineHeight: 16,
  },

  advice: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  adviceCard: {
    width: '48.7%',
    minHeight: 124,
    padding: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },

  adviceIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  adviceTitle: {
    marginTop: 7,
    color: theme.colors.text,
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: '800',
    textAlign: 'center',
  },

  adviceText: {
    marginTop: 5,
    color: theme.colors.textSecondary,
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
  },

  });
}
