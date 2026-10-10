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

const ID = 'conceptiontips-comprendre-nidation';

const HERO = require('../../assets/images/library/featured-cycle.png');

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'NIDATION',
    title: 'Comprendre\nla nidation',
    metaDuration: '5 min de lecture',
    metaType: 'Article',
    metaLevel: 'Intermédiaire',
    metaValidated: 'Contenu validé',
    intro:
      'Ce qui se passe entre la fécondation et le test de grossesse positif.',
    contentsTitle: 'Dans cet article',
    topics: [
      'De la fécondation à la nidation',
      'Les signes possibles, sans certitude',
      'Quand un test devient fiable',
      'À retenir',
    ],
    body1:
      'Après la fécondation, l’œuf met généralement 6 à 10 jours pour atteindre l’utérus et s’y implanter : c’est la nidation. Cette étape marque le véritable point de départ de la grossesse.',
    body2:
      'De légers saignements ou tiraillements peuvent parfois accompagner la nidation, sans que ce soit systématique ni un signe fiable à lui seul.',
    possibleSigns: [
      'De très légers saignements, parfois appelés « spotting »',
      'De légères tensions dans le bas-ventre',
      'Aucun signe particulier, pour beaucoup de femmes',
    ],
    tip1Title: 'Bon à savoir',
    tip1Text:
      'L’absence de signe ne veut rien dire : de nombreuses grossesses débutent sans aucun symptôme perceptible à ce stade.',
    body3:
      'C’est seulement après l’implantation que l’hormone hCG commence à être produite, et devient détectable par un test de grossesse. Faire un test trop tôt peut donner un résultat faussement négatif.',
    alertTitle: 'À noter',
    alertText:
      'Attendre le jour présumé des règles avant de tester donne un résultat plus fiable qu’un test réalisé trop précocement.',
    tip2Title: 'Bon à savoir',
    tip2Text:
      'La nidation se déroule discrètement, avec ou sans signe visible. Un peu de patience avant de tester t’évite un résultat peu fiable.',
    shareMessage: 'Comprendre la nidation — AWA',
  },
  en: {
    badge: 'IMPLANTATION',
    title: 'Understanding\nimplantation',
    metaDuration: '5 min read',
    metaType: 'Article',
    metaLevel: 'Intermediate',
    metaValidated: 'Reviewed content',
    intro:
      'What happens between fertilization and a positive pregnancy test.',
    contentsTitle: 'In this article',
    topics: [
      'From fertilization to implantation',
      'Possible signs, without certainty',
      'When a test becomes reliable',
      'Key takeaways',
    ],
    body1:
      'After fertilization, the egg usually takes 6 to 10 days to reach the uterus and implant there: this is implantation. This step marks the true starting point of pregnancy.',
    body2:
      'Light bleeding or cramping can sometimes accompany implantation, though this isn’t systematic, nor a reliable sign on its own.',
    possibleSigns: [
      'Very light bleeding, sometimes called "spotting"',
      'Mild cramping in the lower abdomen',
      'No particular sign at all, for many women',
    ],
    tip1Title: 'Good to know',
    tip1Text:
      'The absence of a sign doesn’t mean anything: many pregnancies begin without any noticeable symptom at this stage.',
    body3:
      'It’s only after implantation that the hCG hormone starts being produced and becomes detectable by a pregnancy test. Testing too early can give a falsely negative result.',
    alertTitle: 'Note',
    alertText:
      'Waiting until the presumed day of your period before testing gives a more reliable result than testing too early.',
    tip2Title: 'Good to know',
    tip2Text:
      'Implantation happens discreetly, with or without a visible sign. A little patience before testing saves you from an unreliable result.',
    shareMessage: 'Understanding implantation — AWA',
  },
  es: {
    badge: 'NIDACIÓN',
    title: 'Comprende\nla nidación',
    metaDuration: '5 min de lectura',
    metaType: 'Artículo',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenido validado',
    intro:
      'Lo que ocurre entre la fecundación y una prueba de embarazo positiva.',
    contentsTitle: 'En este artículo',
    topics: [
      'De la fecundación a la nidación',
      'Posibles señales, sin certeza',
      'Cuándo una prueba se vuelve fiable',
      'Para recordar',
    ],
    body1:
      'Después de la fecundación, el óvulo fecundado suele tardar de 6 a 10 días en llegar al útero e implantarse en él: esto es la nidación. Esta etapa marca el verdadero punto de partida del embarazo.',
    body2:
      'Un ligero sangrado o algunos tirones pueden a veces acompañar la nidación, sin que esto sea sistemático ni una señal fiable por sí sola.',
    possibleSigns: [
      'Un sangrado muy ligero, a veces llamado "spotting"',
      'Ligeras tensiones en la parte baja del vientre',
      'Ninguna señal en particular, para muchas mujeres',
    ],
    tip1Title: 'DATO ÚTIL',
    tip1Text:
      'La ausencia de señales no significa nada: muchos embarazos comienzan sin ningún síntoma perceptible en esta etapa.',
    body3:
      'Solo después de la implantación comienza a producirse la hormona hCG, que se vuelve detectable mediante una prueba de embarazo. Hacerte la prueba demasiado pronto puede dar un resultado falsamente negativo.',
    alertTitle: 'Nota',
    alertText:
      'Esperar hasta el día presunto de tu período antes de hacerte la prueba da un resultado más fiable que una prueba realizada demasiado pronto.',
    tip2Title: 'DATO ÚTIL',
    tip2Text:
      'La nidación ocurre de forma discreta, con o sin señales visibles. Un poco de paciencia antes de hacerte la prueba te evita un resultado poco fiable.',
    shareMessage: 'Comprende la nidación — AWA',
  },
  it: {
    badge: 'IMPIANTO',
    title: 'Capire\nl’impianto',
    metaDuration: '5 min di lettura',
    metaType: 'Articolo',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenuto validato',
    intro: 'Che cosa succede tra la fecondazione e un test di gravidanza positivo.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Dalla fecondazione all’impianto',
      'Possibili segni, senza certezze',
      'Quando un test diventa affidabile',
      'Punti chiave',
    ],
    body1: 'Dopo la fecondazione, l’ovulo impiega di solito da 6 a 10 giorni per raggiungere l’utero e impiantarsi: è l’impianto. Questa tappa segna il vero punto di partenza della gravidanza.',
    body2: 'Un lieve sanguinamento o dei crampi possono talvolta accompagnare l’impianto, ma non è sistematico e non è un segno affidabile da solo.',
    possibleSigns: [
      'Un sanguinamento molto lieve, a volte chiamato «spotting»',
      'Lievi crampi nel basso ventre',
      'Nessun segno particolare, per molte donne',
    ],
    tip1Title: 'Da sapere',
    tip1Text: 'L’assenza di segni non significa nulla: molte gravidanze iniziano senza alcun sintomo percepibile in questa fase.',
    body3: 'È solo dopo l’impianto che l’ormone hCG inizia a essere prodotto e diventa rilevabile da un test di gravidanza. Fare il test troppo presto può dare un risultato falsamente negativo.',
    alertTitle: 'Nota',
    alertText: 'Aspettare il giorno presunto del periodo mestruale prima di fare il test dà un risultato più affidabile rispetto a farlo troppo presto.',
    tip2Title: 'Da sapere',
    tip2Text: 'L’impianto avviene in modo discreto, con o senza un segno visibile. Un po’ di pazienza prima del test ti evita un risultato poco affidabile.',
    shareMessage: 'Capire l’impianto — AWA',
  },
  tr: {
    badge: 'İMPLANTASYON',
    title: 'İmplantasyonu\nanlamak',
    metaDuration: '5 dk okuma',
    metaType: 'Makale',
    metaLevel: 'Orta düzey',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Döllenme ile pozitif gebelik testi arasında neler olur.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Döllenmeden implantasyona',
      'Olası belirtiler, kesinlik olmadan',
      'Test ne zaman güvenilir olur',
      'Öne çıkanlar',
    ],
    body1: 'Döllenmeden sonra yumurta genellikle rahme ulaşıp orada yerleşmesi için 6 ila 10 gün alır: buna implantasyon denir. Bu adım, gebeliğin gerçek başlangıç noktasını oluşturur.',
    body2: 'Hafif bir kanama ya da kramp bazen implantasyona eşlik edebilir; ancak bu her zaman olmaz ve tek başına güvenilir bir belirti değildir.',
    possibleSigns: [
      'Bazen “lekelenme” olarak adlandırılan çok hafif kanama',
      'Alt karında hafif kramplar',
      'Birçok kadında hiçbir belirti olmaması',
    ],
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Belirti olmaması hiçbir şey ifade etmez: birçok gebelik bu aşamada fark edilir bir belirti olmadan başlar.',
    body3: 'hCG hormonu ancak implantasyondan sonra üretilmeye başlar ve gebelik testiyle saptanabilir hale gelir. Çok erken test yapmak yanlış negatif sonuç verebilir.',
    alertTitle: 'Not',
    alertText: 'Test yapmadan önce adetinin beklenen gününe kadar beklemek, çok erken test yapmaya göre daha güvenilir bir sonuç verir.',
    tip2Title: 'Bilmekte fayda var',
    tip2Text: 'İmplantasyon, görünür bir belirti olsun ya da olmasın sessizce gerçekleşir. Test yapmadan önce biraz sabretmek, güvenilmez bir sonuçtan seni korur.',
    shareMessage: 'İmplantasyonu anlamak — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function NidationArticleScreen({
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

          <Text style={styles.intro}>{content.intro}</Text>

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

          <Text style={styles.body}>{content.body1}</Text>

          <Text style={styles.h2}>2. {content.topics[1]}</Text>

          <Text style={styles.body}>{content.body2}</Text>

          <View style={styles.checkList}>
            {content.possibleSigns.map(item => (
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

          <Text style={styles.h2}>3. {content.topics[2]}</Text>

          <Text style={styles.body}>{content.body3}</Text>

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

          <Text style={styles.h2}>4. {content.topics[3]}</Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.tip2Title}</Text>
              <Text style={styles.tipText}>{content.tip2Text}</Text>
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
