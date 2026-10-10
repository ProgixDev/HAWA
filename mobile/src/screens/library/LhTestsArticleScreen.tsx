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

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

const ID = 'lhtests-comprendre-tests-ovulation';

const HERO = require('../../assets/images/library/spm-consult.png');

/* -------------------------------------------------------------------------- */
/* DATA — icons stay language-neutral; TEXT moves into the bilingual CONTENT  */
/* object below, keyed by index to stay aligned with these icons.            */
/* -------------------------------------------------------------------------- */

const TESTING_TIP_ICONS = ['calendar-range', 'clock-outline', 'cup-water'] as const;

/* -------------------------------------------------------------------------- */
/* CONTENT — PHASE 7L bilingual editorial content. Article identity (ID,     */
/* images, bookmark/progress keys, JSX structure) is untouched; only this    */
/* object changes per language. The French text below is byte-identical to  */
/* the original — never retyped, only moved into the `fr` key — so the app  */
/* remains fully bilingual rather than having French replaced by English.   */
/* -------------------------------------------------------------------------- */

const CONTENT = {
  fr: {
    badge: 'FERTILITÉ • TESTS D’OVULATION',
    title: 'Comprendre les tests\nd’ovulation (LH)',
    metaDuration: '6 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Intermédiaire',
    metaValidated: 'Contenu validé',
    intro: 'Comment fonctionnent ces bandelettes, et quand les utiliser.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Qu’est-ce que la LH ?',
      'Comment fonctionnent ces tests',
      'Quand commencer à tester',
      'Interpréter un résultat',
      'Faux positifs et limites',
      'Les combiner à d’autres signes',
      'À retenir',
    ],
    section1Body:
      'La LH (hormone lutéinisante) est produite par le cerveau et pilote le fonctionnement des ovaires. Les tests d’ovulation détectent le pic de cette hormone, qui déclenche la libération de l’ovule 24 à 36 heures après.',
    section2Body:
      'Une bandelette urinaire mesure le taux de LH : une ligne test aussi foncée ou plus foncée que la ligne de contrôle indique un pic.',
    section3Body:
      'Il est conseillé de commencer les tests quelques jours avant la date d’ovulation estimée par ton cycle.',
    testingTips: [
      {
        title: 'Se baser sur ton cycle',
        text: 'Commence quelques jours avant la date d’ovulation estimée par la longueur moyenne de tes cycles.',
      },
      {
        title: 'Tester à heure fixe',
        text: 'Idéalement en milieu de journée, en évitant la première urine du matin.',
      },
      {
        title: 'Éviter de trop diluer',
        text: 'Limite les grandes quantités de boisson dans les heures qui précèdent le test.',
      },
    ],
    section4Body:
      'Un résultat positif signale le moment le plus fertile pour les rapports dans les 1 à 2 jours qui suivent. Un résultat négatif signifie simplement que le pic n’a pas encore eu lieu.',
    limitations: [
      'Le SOPK peut donner des taux de LH naturellement plus élevés, brouillant la lecture',
      'Certains traitements de fertilité peuvent influencer le résultat',
      'Une urine très diluée peut donner un faux négatif',
      'Un test de moins bonne qualité peut être moins fiable',
    ],
    infoTitle: 'À garder en tête',
    infoText:
      'Un pic de LH indique un signal hormonal déclencheur, mais ne garantit pas à lui seul que l’ovule a effectivement été libéré.',
    tipTitle: 'Bon à savoir',
    tipText:
      'Associer les tests d’ovulation à ta température basale ou à l’observation de ta glaire cervicale donne une image plus complète de ton cycle.',
    summaryPoints: [
      'Les tests d’ovulation détectent le pic de l’hormone LH, qui déclenche la libération de l’ovule 24 à 36 heures après.',
      'Il est conseillé de commencer les tests quelques jours avant la date d’ovulation estimée par ton cycle.',
      'Un résultat positif signale le moment le plus fertile pour les rapports dans les 1 à 2 jours qui suivent.',
      'Un pic de LH ne garantit pas à lui seul que l’ovulation a effectivement eu lieu.',
    ],
    disclaimerText:
      'Contenu informatif. Cet article ne remplace pas un avis médical personnalisé. En cas de doute, demande conseil à un professionnel de santé.',
    shareMessage: 'Comprendre les tests d’ovulation (LH) — AWA',
  },
  en: {
    badge: 'FERTILITY • OVULATION TESTS',
    title: 'Understanding ovulation\ntests (LH)',
    metaDuration: '6 min read',
    metaType: 'Guide',
    metaLevel: 'Intermediate',
    metaValidated: 'Reviewed content',
    intro: 'How these strips work, and when to use them.',
    contentsTitle: 'In this article',
    topics: [
      'What is LH?',
      'How these tests work',
      'When to start testing',
      'Interpreting a result',
      'False positives and limitations',
      'Combining them with other signs',
      'Key takeaways',
    ],
    section1Body:
      'LH (luteinizing hormone) is produced by the brain and controls how the ovaries function. Ovulation tests detect the surge in this hormone, which triggers the release of the egg 24 to 36 hours later.',
    section2Body:
      'A urine test strip measures LH levels: a test line as dark as or darker than the control line indicates a surge.',
    section3Body:
      'It’s recommended to start testing a few days before the ovulation date estimated from your cycle.',
    testingTips: [
      {
        title: 'Base it on your cycle',
        text: 'Start a few days before the ovulation date estimated from the average length of your cycles.',
      },
      {
        title: 'Test at the same time each day',
        text: 'Ideally around midday, avoiding your first urine of the morning.',
      },
      {
        title: 'Avoid diluting your urine',
        text: 'Limit large amounts of fluids in the hours before the test.',
      },
    ],
    section4Body:
      'A positive result signals the most fertile time for intercourse over the following 1 to 2 days. A negative result simply means the surge hasn’t happened yet.',
    limitations: [
      'PCOS can cause naturally higher LH levels, which can blur the reading',
      'Certain fertility treatments can affect the result',
      'Very diluted urine can give a false negative',
      'A lower-quality test can be less reliable',
    ],
    infoTitle: 'Keep in mind',
    infoText:
      'An LH surge indicates a triggering hormonal signal, but on its own it doesn’t guarantee that the egg was actually released.',
    tipTitle: 'Good to know',
    tipText:
      'Combining ovulation tests with your basal body temperature or cervical mucus observation gives a fuller picture of your cycle.',
    summaryPoints: [
      'Ovulation tests detect the LH surge, which triggers the release of the egg 24 to 36 hours later.',
      'It’s recommended to start testing a few days before the ovulation date estimated from your cycle.',
      'A positive result signals the most fertile time for intercourse over the following 1 to 2 days.',
      'An LH surge on its own doesn’t guarantee that ovulation actually occurred.',
    ],
    disclaimerText:
      'Informational content. This article does not replace personalized medical advice. If in doubt, seek guidance from a healthcare professional.',
    shareMessage: 'Understanding ovulation tests (LH) — AWA',
  },
  es: {
    badge: 'FERTILIDAD • PRUEBAS DE OVULACIÓN',
    title: 'Comprender las pruebas\nde ovulación (LH)',
    metaDuration: '6 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenido validado',
    intro: 'Cómo funcionan estas tiras, y cuándo usarlas.',
    contentsTitle: 'En este artículo',
    topics: [
      '¿Qué es la LH?',
      'Cómo funcionan estas pruebas',
      'Cuándo empezar a hacerte las pruebas',
      'Interpretar un resultado',
      'Falsos positivos y límites',
      'Combinarlas con otras señales',
      'Para recordar',
    ],
    section1Body:
      'La LH (hormona luteinizante) es producida por el cerebro y controla el funcionamiento de los ovarios. Las pruebas de ovulación detectan el pico de esta hormona, que desencadena la liberación del óvulo entre 24 y 36 horas después.',
    section2Body:
      'Una tira de orina mide el nivel de LH: una línea de prueba tan oscura o más oscura que la línea de control indica un pico.',
    section3Body:
      'Se recomienda empezar las pruebas unos días antes de la fecha de ovulación estimada según tu ciclo.',
    testingTips: [
      {
        title: 'Basarte en tu ciclo',
        text: 'Empieza unos días antes de la fecha de ovulación estimada según la duración media de tus ciclos.',
      },
      {
        title: 'Probar a una hora fija',
        text: 'Idealmente a mediodía, evitando la primera orina de la mañana.',
      },
      {
        title: 'Evitar diluir demasiado',
        text: 'Limita las grandes cantidades de líquido en las horas previas a la prueba.',
      },
    ],
    section4Body:
      'Un resultado positivo señala el momento más fértil para las relaciones sexuales en el 1 o 2 días siguientes. Un resultado negativo simplemente significa que el pico aún no ha ocurrido.',
    limitations: [
      'El SOP puede dar niveles de LH naturalmente más altos, lo que dificulta la lectura',
      'Algunos tratamientos de fertilidad pueden influir en el resultado',
      'Una orina muy diluida puede dar un falso negativo',
      'Una prueba de menor calidad puede ser menos fiable',
    ],
    infoTitle: 'Ten en cuenta',
    infoText:
      'Un pico de LH indica una señal hormonal desencadenante, pero por sí solo no garantiza que el óvulo se haya liberado realmente.',
    tipTitle: 'Dato útil',
    tipText:
      'Combinar las pruebas de ovulación con tu temperatura basal o con la observación de tu moco cervical te da una imagen más completa de tu ciclo.',
    summaryPoints: [
      'Las pruebas de ovulación detectan el pico de la hormona LH, que desencadena la liberación del óvulo entre 24 y 36 horas después.',
      'Se recomienda empezar las pruebas unos días antes de la fecha de ovulación estimada según tu ciclo.',
      'Un resultado positivo señala el momento más fértil para las relaciones sexuales en el 1 o 2 días siguientes.',
      'Un pico de LH por sí solo no garantiza que la ovulación haya ocurrido realmente.',
    ],
    disclaimerText:
      'Contenido informativo. Este artículo no sustituye una opinión médica personalizada. Si tienes dudas, consulta a un profesional de la salud.',
    shareMessage: 'Comprender las pruebas de ovulación (LH) — AWA',
  },
  it: {
    badge: 'FERTILITÀ • TEST DI OVULAZIONE',
    title: 'Capire i test\ndi ovulazione (LH)',
    metaDuration: '6 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenuto validato',
    intro: 'Come funzionano queste strisce e quando usarle.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Che cos’è l’LH?',
      'Come funzionano questi test',
      'Quando iniziare a fare il test',
      'Interpretare un risultato',
      'Falsi positivi e limiti',
      'Abbinarli ad altri segnali',
      'Punti chiave',
    ],
    section1Body: 'L’LH (ormone luteinizzante) è prodotto dal cervello e regola il funzionamento delle ovaie. I test di ovulazione rilevano il picco di questo ormone, che innesca il rilascio dell’ovulo da 24 a 36 ore dopo.',
    section2Body: 'Una striscia reattiva sulle urine misura i livelli di LH: una linea del test scura quanto la linea di controllo, o più scura, indica un picco.',
    section3Body: 'Si consiglia di iniziare a fare il test qualche giorno prima della data di ovulazione stimata in base al tuo ciclo.',
    testingTips: [
      {
        title: 'Parti dal tuo ciclo',
        text: 'Inizia qualche giorno prima della data di ovulazione stimata in base alla durata media dei tuoi cicli.',
      },
      {
        title: 'Fai il test alla stessa ora ogni giorno',
        text: 'Idealmente verso mezzogiorno, evitando le prime urine del mattino.',
      },
      {
        title: 'Evita di diluire le urine',
        text: 'Limita le grandi quantità di liquidi nelle ore che precedono il test.',
      },
    ],
    section4Body: 'Un risultato positivo indica il momento più fertile per avere rapporti nei 1-2 giorni successivi. Un risultato negativo significa semplicemente che il picco non c’è ancora stato.',
    limitations: [
      'La PCOS può causare livelli di LH naturalmente più alti, che possono falsare la lettura',
      'Alcuni trattamenti per la fertilità possono influire sul risultato',
      'Urine molto diluite possono dare un falso negativo',
      'Un test di qualità inferiore può essere meno affidabile',
    ],
    infoTitle: 'Da tenere a mente',
    infoText: 'Un picco di LH indica un segnale ormonale di innesco, ma da solo non garantisce che l’ovulo sia stato effettivamente rilasciato.',
    tipTitle: 'Da sapere',
    tipText: 'Abbinare i test di ovulazione alla temperatura basale o all’osservazione del muco cervicale offre un quadro più completo del tuo ciclo.',
    summaryPoints: [
      'I test di ovulazione rilevano il picco di LH, che innesca il rilascio dell’ovulo da 24 a 36 ore dopo.',
      'Si consiglia di iniziare a fare il test qualche giorno prima della data di ovulazione stimata in base al tuo ciclo.',
      'Un risultato positivo indica il momento più fertile per avere rapporti nei 1-2 giorni successivi.',
      'Un picco di LH da solo non garantisce che l’ovulazione sia effettivamente avvenuta.',
    ],
    disclaimerText: 'Contenuto informativo. Questo articolo non sostituisce un parere medico personalizzato. In caso di dubbi, rivolgiti a un professionista sanitario.',
    shareMessage: 'Capire i test di ovulazione (LH) — AWA',
  },
  tr: {
    badge: 'DOĞURGANLIK • OVÜLASYON TESTLERİ',
    title: 'Ovülasyon testlerini (LH)\nanlamak',
    metaDuration: '6 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Orta düzey',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Bu test şeritleri nasıl çalışır ve ne zaman kullanılmalı?',
    contentsTitle: 'Bu makalede',
    topics: [
      'LH nedir?',
      'Bu testler nasıl çalışır?',
      'Teste ne zaman başlanmalı?',
      'Sonucu yorumlamak',
      'Yanlış pozitifler ve sınırlamalar',
      'Diğer belirtilerle birlikte kullanmak',
      'Akılda kalacaklar',
    ],
    section1Body: 'LH (luteinleştirici hormon) beyin tarafından üretilir ve yumurtalıkların işleyişini kontrol eder. Ovülasyon testleri, bu hormondaki ani yükselişi saptar; bu yükseliş, 24 ile 36 saat sonra yumurtanın salınmasını tetikler.',
    section2Body: 'İdrar test şeridi LH düzeyini ölçer: kontrol çizgisi kadar koyu veya ondan daha koyu bir test çizgisi, hormonda ani bir yükselişe işaret eder.',
    section3Body: 'Testlere, döngüne göre tahmin edilen yumurtlama tarihinden birkaç gün önce başlaman önerilir.',
    testingTips: [
      {
        title: 'Döngünü temel al',
        text: 'Döngülerinin ortalama uzunluğuna göre tahmin edilen yumurtlama tarihinden birkaç gün önce başla.',
      },
      {
        title: 'Her gün aynı saatte test yap',
        text: 'İdeal olarak öğlen civarında yap; sabahın ilk idrarından kaçın.',
      },
      {
        title: 'İdrarını seyreltmekten kaçın',
        text: 'Testten önceki saatlerde çok miktarda sıvı almayı sınırla.',
      },
    ],
    section4Body: 'Pozitif bir sonuç, takip eden 1 ile 2 gün boyunca cinsel ilişki için en verimli zamanı gösterir. Negatif bir sonuç ise yalnızca hormondaki yükselişin henüz gerçekleşmediği anlamına gelir.',
    limitations: [
      'PKOS doğal olarak daha yüksek LH düzeylerine yol açabilir ve bu da okumayı belirsizleştirebilir',
      'Bazı doğurganlık tedavileri sonucu etkileyebilir',
      'Çok seyreltilmiş idrar yanlış negatif sonuç verebilir',
      'Daha düşük kaliteli bir test daha az güvenilir olabilir',
    ],
    infoTitle: 'Aklında bulunsun',
    infoText: 'LH yükselişi tetikleyici bir hormonal sinyale işaret eder, ancak tek başına yumurtanın gerçekten salındığını garanti etmez.',
    tipTitle: 'Bilmekte fayda var',
    tipText: 'Ovülasyon testlerini bazal vücut sıcaklığın veya servikal mukus gözlemiyle birlikte kullanmak, döngün hakkında daha eksiksiz bir tablo sunar.',
    summaryPoints: [
      'Ovülasyon testleri, 24 ile 36 saat sonra yumurtanın salınmasını tetikleyen LH yükselişini saptar.',
      'Testlere, döngüne göre tahmin edilen yumurtlama tarihinden birkaç gün önce başlaman önerilir.',
      'Pozitif bir sonuç, takip eden 1 ile 2 gün boyunca cinsel ilişki için en verimli zamanı gösterir.',
      'LH yükselişi tek başına yumurtlamanın gerçekten gerçekleştiğini garanti etmez.',
    ],
    disclaimerText: 'Bilgilendirme amaçlı içerik. Bu makale kişiye özel tıbbi tavsiyenin yerini tutmaz. Şüphen varsa bir sağlık profesyonelinden yönlendirme iste.',
    shareMessage: 'Ovülasyon testlerini (LH) anlamak — AWA',
  },
} as const;

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

/* -------------------------------------------------------------------------- */
/* SCREEN                                                                     */
/* -------------------------------------------------------------------------- */

export default function LhTestsArticleScreen({
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

  const handleShare = async () => {
    try {
      await Share.share({
        message: content.shareMessage,
      });
    } catch {
      // Partage annulé ou indisponible.
    }
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
        {/* ==================================================================== */}
        {/* HERO                                                                 */}
        {/* ==================================================================== */}

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
              hitSlop={8}
              onPress={() => navigation.goBack()}
              style={({pressed}) => [styles.circle, pressed && styles.pressed]}>
              <MaterialDesignIcons name="chevron-left" size={23} color={theme.colors.text} />
            </Pressable>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  saved ? t('library.screen.removeBookmark') : t('library.screen.addBookmark')
                }
                hitSlop={8}
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
                hitSlop={8}
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

        {/* ==================================================================== */}
        {/* ARTICLE                                                             */}
        {/* ==================================================================== */}

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

          {/* -------------------------------------------------------------- */}
          {/* CONTENTS                                                        */}
          {/* -------------------------------------------------------------- */}

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>{content.contentsTitle}</Text>

            {content.topics.map((item, index) => (
              <View key={index} style={styles.contentRow}>
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

          {/* ================================================================= */}
          {/* SECTION 1                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>1. {content.topics[0]}</Text>

          <Text style={styles.body}>{content.section1Body}</Text>

          {/* ================================================================= */}
          {/* SECTION 2                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>2. {content.topics[1]}</Text>

          <Text style={styles.body}>{content.section2Body}</Text>

          {/* ================================================================= */}
          {/* SECTION 3                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>3. {content.topics[2]}</Text>

          <Text style={styles.body}>{content.section3Body}</Text>

          <View style={styles.comfortCard}>
            {TESTING_TIP_ICONS.map((icon, index) => (
              <View
                key={icon}
                style={[
                  styles.comfortRow,
                  index < TESTING_TIP_ICONS.length - 1 && styles.comfortRowBorder,
                ]}>
                <View style={styles.comfortIcon}>
                  <MaterialDesignIcons
                    name={icon as never}
                    size={19}
                    color={theme.colors.primary}
                  />
                </View>

                <View style={styles.comfortCopy}>
                  <Text style={styles.comfortTitle}>{content.testingTips[index].title}</Text>
                  <Text style={styles.comfortText}>{content.testingTips[index].text}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* SECTION 4                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>4. {content.topics[3]}</Text>

          <Text style={styles.body}>{content.section4Body}</Text>

          {/* ================================================================= */}
          {/* SECTION 5                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>5. {content.topics[4]}</Text>

          <View style={styles.checkList}>
            {content.limitations.map((item, index) => (
              <View key={index} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="checkbox-blank-circle-outline"
                  size={14}
                  color={theme.colors.primary}
                />

                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.infoCard}>
            <MaterialDesignIcons
              name="information-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>{content.infoTitle}</Text>
              <Text style={styles.infoText}>{content.infoText}</Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* TIP                                                               */}
          {/* ================================================================= */}

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.tipTitle}</Text>
              <Text style={styles.tipText}>{content.tipText}</Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SUMMARY                                                           */}
          {/* ================================================================= */}

          <Text style={styles.h2}>{content.topics[6]}</Text>

          <View style={styles.summaryCard}>
            {content.summaryPoints.map((item, index) => (
              <View key={index} style={styles.summaryRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <Text style={styles.summaryText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* DISCLAIMER                                                        */}
          {/* ================================================================= */}

          <View style={styles.disclaimer}>
            <MaterialDesignIcons
              name="shield-outline"
              size={18}
              color={theme.colors.textMuted}
            />

            <Text style={styles.disclaimerText}>{content.disclaimerText}</Text>
          </View>
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={6} scrollRef={scrollRef} />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* STYLES                                                                     */
/* -------------------------------------------------------------------------- */

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
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    marginTop: 27,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: theme.colors.text,
    fontWeight: '700',
  },
  body: {marginTop: 9, fontSize: 14, lineHeight: 21.5, color: theme.colors.text},

  comfortCard: {
    marginTop: 13,
    paddingHorizontal: 13,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  comfortRow: {flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 13},
  comfortRowBorder: {borderBottomWidth: 1, borderBottomColor: theme.colors.border},
  comfortIcon: {
    width: 35,
    height: 35,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  comfortCopy: {flex: 1, marginLeft: 10},
  comfortTitle: {fontSize: 12.5, color: theme.colors.text, fontWeight: '800'},
  comfortText: {marginTop: 3, fontSize: 10.8, lineHeight: 16, color: theme.colors.textSecondary},

  checkList: {
    marginTop: 13,
    padding: 13,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  checkRow: {flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6},
  checkText: {flex: 1, color: theme.colors.text, fontSize: 12.5, lineHeight: 17},

  infoCard: {
    marginTop: 13,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoCopy: {flex: 1, marginLeft: 9},
  infoTitle: {fontSize: 12.5, color: theme.colors.text, fontWeight: '800'},
  infoText: {marginTop: 3, fontSize: 11.5, lineHeight: 17, color: theme.colors.textSecondary},

  tip: {
    marginTop: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tipCopy: {flex: 1, marginLeft: 11},
  tipTitle: {fontSize: 13, color: theme.colors.text, fontWeight: '800'},
  tipText: {marginTop: 4, fontSize: 11.5, lineHeight: 17, color: theme.colors.textSecondary},

  summaryCard: {
    marginTop: 13,
    padding: 14,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  summaryRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10},
  summaryText: {flex: 1, fontSize: 11.5, lineHeight: 17, color: theme.colors.text},

  disclaimer: {
    marginTop: 18,
    paddingHorizontal: 3,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },
  disclaimerText: {flex: 1, fontSize: 10, lineHeight: 15, color: theme.colors.textMuted},
  });
}
