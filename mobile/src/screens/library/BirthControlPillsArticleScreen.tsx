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

const ID = 'birthcontrolpills-comprendre-la-pilule';

const HERO = require('../../assets/images/library/featured-tracking-hero.png');

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'PILULE CONTRACEPTIVE',
    title: 'Comprendre la\npilule contraceptive',
    metaDuration: '7 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Comment agit la pilule, comment l’utiliser au quotidien et quels sont ses principaux avantages et limites.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Comment agit la pilule',
      'Bien la prendre au quotidien',
      'Avantages et limites',
      'À retenir',
    ],
    body1: 'La pilule contient des hormones, œstrogènes et/ou progestatif selon le type, qui agissent principalement en empêchant ou en bloquant l’ovulation. Elle modifie également la glaire cervicale, ce qui rend le passage des spermatozoïdes plus difficile.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Il existe plusieurs types de pilules, notamment les pilules combinées et celles contenant uniquement un progestatif. Leur composition et leur mode de prise peuvent varier.',
    body2: 'La régularité de la prise est importante. Selon le type de pilule, les règles en cas d’oubli peuvent être différentes : il est donc essentiel de consulter la notice de son médicament.',
    routineTips: [
      'Choisir un moment de la journée facile à retenir (repas, coucher...)',
      'Utiliser un rappel ou une application si besoin',
      'Garder la notice à portée de main en cas de doute',
    ],
    sectionIntro: 'Comme toute méthode contraceptive, la pilule présente des avantages mais aussi certaines limites à connaître avant de la choisir.',
    advantagesTitle: 'Avantages',
    advantagesSubtitle: 'Ce qu’elle peut apporter',
    advantages: [
      'Réduit fortement le risque de grossesse lorsqu’elle est utilisée correctement',
      'Peut rendre les règles plus régulières et prévisibles',
      'Peut diminuer les douleurs et les saignements chez certaines personnes',
      'Peut être adaptée ou changée si elle ne convient pas',
    ],
    limitationsTitle: 'Limites',
    limitationsSubtitle: 'Les points à connaître',
    limitations: [
      'Nécessite une prise régulière selon le type de pilule',
      'Les oublis peuvent diminuer son efficacité',
      'Des effets indésirables peuvent apparaître chez certaines personnes',
      'Ne protège pas contre les infections sexuellement transmissibles (IST)',
    ],
    takeawayTitle: 'Une méthode à connaître',
    takeawayText: 'La pilule est une méthode contraceptive hormonale efficace lorsqu’elle est utilisée correctement. Sa prise régulière, ses éventuels effets indésirables et l’absence de protection contre les IST sont des éléments importants à connaître.',
    finalTipText: 'Si tu envisages une contraception ou si ta méthode actuelle ne te convient pas, n’hésite pas à en discuter avec un médecin, une sage-femme ou un autre professionnel de santé.',
    shareMessage: 'Comprendre la pilule contraceptive — AWA',
  },
  en: {
    badge: 'BIRTH CONTROL PILL',
    title: 'Understanding\nthe birth control pill',
    metaDuration: '7 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'How the pill works, how to take it day to day, and its main advantages and limitations.',
    contentsTitle: 'In this article',
    topics: [
      'How the pill works',
      'Taking it correctly every day',
      'Advantages and limitations',
      'Key takeaways',
    ],
    body1: 'The pill contains hormones — estrogen and/or progestin, depending on the type — that work mainly by preventing or blocking ovulation. It also changes cervical mucus, which makes it harder for sperm to pass through.',
    tip1Title: 'Good to know',
    tip1Text: 'There are several types of pills, including combined pills and progestin-only pills. Their composition and how they’re taken can vary.',
    body2: 'Taking it consistently matters. Depending on the type of pill, what to do after a missed dose can differ — so it’s essential to check your medication’s package insert.',
    routineTips: [
      'Pick a time of day that’s easy to remember (a meal, bedtime...)',
      'Use a reminder or an app if needed',
      'Keep the package insert on hand in case of doubt',
    ],
    sectionIntro: 'Like any contraceptive method, the pill has advantages but also certain limitations to know about before choosing it.',
    advantagesTitle: 'Advantages',
    advantagesSubtitle: 'What it can offer',
    advantages: [
      'Greatly reduces the risk of pregnancy when used correctly',
      'May make periods more regular and predictable',
      'May reduce pain and bleeding for some people',
      'Can be adjusted or changed if it doesn’t suit you',
    ],
    limitationsTitle: 'Limitations',
    limitationsSubtitle: 'Points to be aware of',
    limitations: [
      'Requires regular intake depending on the type of pill',
      'Missed doses can reduce its effectiveness',
      'Some people may experience side effects',
      'Does not protect against sexually transmitted infections (STIs)',
    ],
    takeawayTitle: 'A method worth understanding',
    takeawayText: 'The pill is an effective hormonal contraceptive method when used correctly. Taking it consistently, its possible side effects, and the lack of protection against STIs are important things to know.',
    finalTipText: 'If you’re considering contraception or your current method isn’t working for you, don’t hesitate to talk to a doctor, midwife, or another healthcare professional.',
    shareMessage: 'Understanding the birth control pill — AWA',
  },
  es: {
    badge: 'PÍLDORA ANTICONCEPTIVA',
    title: 'Entender la\npíldora anticonceptiva',
    metaDuration: '7 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Cómo actúa la píldora, cómo tomarla cada día y cuáles son sus principales ventajas y límites.',
    contentsTitle: 'En este artículo',
    topics: [
      'Cómo actúa la píldora',
      'Tomarla correctamente cada día',
      'Ventajas y límites',
      'Lo esencial',
    ],
    body1: 'La píldora contiene hormonas, estrógenos y/o progestágeno según el tipo, que actúan principalmente impidiendo o bloqueando la ovulación. También modifica el moco cervical, lo que dificulta el paso de los espermatozoides.',
    tip1Title: 'DATO ÚTIL',
    tip1Text: 'Existen varios tipos de píldoras, entre ellas las píldoras combinadas y las que contienen únicamente un progestágeno. Su composición y su forma de uso pueden variar.',
    body2: 'La regularidad en la toma es importante. Según el tipo de píldora, la actuación a seguir en caso de olvido puede ser diferente: por eso es esencial consultar el prospecto de tu medicamento.',
    routineTips: [
      'Elige un momento del día fácil de recordar (una comida, la hora de dormir...)',
      'Usa un recordatorio o una aplicación si lo necesitas',
      'Ten el prospecto a mano en caso de duda',
    ],
    sectionIntro: 'Como todo método anticonceptivo, la píldora tiene ventajas, pero también ciertos límites que conviene conocer antes de elegirla.',
    advantagesTitle: 'Ventajas',
    advantagesSubtitle: 'Lo que puede aportar',
    advantages: [
      'Reduce considerablemente el riesgo de embarazo cuando se usa correctamente',
      'Puede hacer que las reglas sean más regulares y predecibles',
      'Puede disminuir el dolor y el sangrado en algunas personas',
      'Puede adaptarse o cambiarse si no resulta adecuada',
    ],
    limitationsTitle: 'Límites',
    limitationsSubtitle: 'Los puntos que hay que conocer',
    limitations: [
      'Requiere una toma regular según el tipo de píldora',
      'Los olvidos pueden disminuir su eficacia',
      'Pueden aparecer efectos indeseados en algunas personas',
      'No protege contra las infecciones de transmisión sexual (ITS)',
    ],
    takeawayTitle: 'Un método que conviene conocer',
    takeawayText: 'La píldora es un método anticonceptivo hormonal eficaz cuando se usa correctamente. Su toma regular, sus posibles efectos indeseados y la ausencia de protección frente a las ITS son aspectos importantes que hay que conocer.',
    finalTipText: 'Si estás considerando una anticoncepción o tu método actual no te resulta adecuado, no dudes en hablarlo con un médico, una matrona u otro profesional de la salud.',
    shareMessage: 'Entender la píldora anticonceptiva — AWA',
  },
  it: {
    badge: 'PILLOLA ANTICONCEZIONALE',
    title: 'Capire\nla pillola anticoncezionale',
    metaDuration: '7 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Come funziona la pillola, come assumerla ogni giorno, e i suoi principali vantaggi e limiti.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Come funziona la pillola',
      'Assumerla correttamente ogni giorno',
      'Vantaggi e limiti',
      'Punti chiave',
    ],
    body1: 'La pillola contiene ormoni — estrogeno e/o progestinico, a seconda del tipo — che agiscono soprattutto impedendo o bloccando l’ovulazione. Modifica inoltre il muco cervicale, rendendo più difficile il passaggio degli spermatozoi.',
    tip1Title: 'Da sapere',
    tip1Text: 'Esistono diversi tipi di pillola, tra cui le pillole combinate e le pillole a base di solo progestinico. La loro composizione e il modo di assumerle possono variare.',
    body2: 'È importante assumerla con regolarità. A seconda del tipo di pillola, cosa fare dopo una dimenticanza può essere diverso — per questo è essenziale consultare il foglietto illustrativo del tuo medicinale.',
    routineTips: [
      'Scegli un momento della giornata facile da ricordare (un pasto, l’ora di andare a dormire...)',
      'Usa un promemoria o un’app se necessario',
      'Tieni a portata di mano il foglietto illustrativo in caso di dubbi',
    ],
    sectionIntro: 'Come ogni metodo contraccettivo, la pillola ha dei vantaggi ma anche alcuni limiti da conoscere prima di sceglierla.',
    advantagesTitle: 'Vantaggi',
    advantagesSubtitle: 'Cosa può offrire',
    advantages: [
      'Riduce notevolmente il rischio di gravidanza se usata correttamente',
      'Può rendere le mestruazioni più regolari e prevedibili',
      'Può ridurre il dolore e il flusso mestruale in alcune persone',
      'Può essere adattata o cambiata se non è adatta a te',
    ],
    limitationsTitle: 'Limiti',
    limitationsSubtitle: 'Aspetti da conoscere',
    limitations: [
      'Richiede un’assunzione regolare, a seconda del tipo di pillola',
      'Le dimenticanze possono ridurne l’efficacia',
      'Alcune persone possono avere effetti collaterali',
      'Non protegge dalle infezioni sessualmente trasmissibili (IST)',
    ],
    takeawayTitle: 'Un metodo da conoscere bene',
    takeawayText: 'La pillola è un metodo contraccettivo ormonale efficace se usata correttamente. Assumerla con regolarità, i suoi possibili effetti collaterali e la mancanza di protezione contro le IST sono aspetti importanti da conoscere.',
    finalTipText: 'Se stai pensando alla contraccezione o il metodo che usi ora non fa per te, non esitare a parlarne con un medico, un’ostetrica o un altro professionista sanitario.',
    shareMessage: 'Capire la pillola anticoncezionale — AWA',
  },
  tr: {
    badge: 'DOĞUM KONTROL HAPI',
    title: 'Doğum kontrol hapını\nanlamak',
    metaDuration: '7 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Hapın nasıl etki ettiği, günlük olarak nasıl kullanılacağı, başlıca avantajları ve sınırlılıkları.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Hap nasıl etki eder',
      'Her gün doğru kullanmak',
      'Avantajlar ve sınırlılıklar',
      'Önemli noktalar',
    ],
    body1: 'Hap, türüne göre östrojen ve/veya progestin içeren hormonlar barındırır ve esas olarak yumurtlamayı önleyerek ya da engelleyerek etki eder. Ayrıca servikal mukusu değiştirir; bu da sperm geçişini zorlaştırır.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Kombine haplar ve yalnızca progestin içeren haplar dahil birkaç hap türü vardır. İçerikleri ve kullanım şekilleri farklılık gösterebilir.',
    body2: 'Düzenli kullanmak önemlidir. Hap türüne göre, unutulan bir dozdan sonra ne yapılacağı değişebilir; bu yüzden ilacının kullanma talimatını kontrol etmen çok önemlidir.',
    routineTips: [
      'Hatırlaması kolay bir saat seç (yemek zamanı, yatmadan önce...)',
      'Gerekirse bir hatırlatıcı veya uygulama kullan',
      'Tereddüt ettiğinde başvurmak için kullanma talimatını elinin altında tut',
    ],
    sectionIntro: 'Her doğum kontrol yöntemi gibi hapın da avantajları vardır, ancak seçmeden önce bilinmesi gereken bazı sınırlılıkları da vardır.',
    advantagesTitle: 'Avantajlar',
    advantagesSubtitle: 'Neler sunabilir',
    advantages: [
      'Doğru kullanıldığında gebelik riskini büyük ölçüde azaltır',
      'Adetleri daha düzenli ve öngörülebilir hale getirebilir',
      'Bazı kişilerde ağrıyı ve kanamayı azaltabilir',
      'Sana uymazsa ayarlanabilir veya değiştirilebilir',
    ],
    limitationsTitle: 'Sınırlılıklar',
    limitationsSubtitle: 'Dikkat edilmesi gereken noktalar',
    limitations: [
      'Hap türüne bağlı olarak düzenli kullanım gerektirir',
      'Unutulan dozlar etkinliğini azaltabilir',
      'Bazı kişilerde yan etkiler görülebilir',
      'Cinsel yolla bulaşan enfeksiyonlara (CYBE) karşı koruma sağlamaz',
    ],
    takeawayTitle: 'Anlamaya değer bir yöntem',
    takeawayText: 'Hap, doğru kullanıldığında etkili bir hormonal doğum kontrol yöntemidir. Düzenli kullanmak, olası yan etkileri ve CYBE’lere karşı koruma sağlamaması bilinmesi gereken önemli noktalardır.',
    finalTipText: 'Doğum kontrolünü düşünüyorsan ya da şu anki yöntemin sana uymuyorsa bir doktora, ebeye veya başka bir sağlık profesyoneline danışmaktan çekinme.',
    shareMessage: 'Doğum kontrol hapını anlamak — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function BirthControlPillsArticleScreen({
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
        {/* HERO */}
        <View style={styles.heroWrap}>
          <Image source={HERO} resizeMode="cover" style={styles.hero} />

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

        {/* ARTICLE */}
        <View style={styles.article}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{content.badge}</Text>
          </View>

          <Text style={styles.title}>
            {content.title}
          </Text>

          {/* METADATA */}
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

          {/* TABLE OF CONTENTS */}
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

          {/* SECTION 2 */}
          <Text style={styles.h2}>2. {content.topics[1]}</Text>

          <Text style={styles.body}>
            {content.body2}
          </Text>

          <View style={styles.checkList}>
            {content.routineTips.map(item => (
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

          {/* SECTION 3 */}
          <Text style={styles.h2}>3. {content.topics[2]}</Text>

          <Text style={styles.sectionIntro}>
            {content.sectionIntro}
          </Text>

          {/* CENTRAL SCHEMA */}
          <View style={styles.schema}>
            {/* ADVANTAGES */}
            <View style={styles.schemaCard}>
              <View style={styles.schemaHeader}>
                <View style={styles.iconCirclePositive}>
                  <MaterialDesignIcons
                    name="check-circle-outline"
                    size={22}
                    color={theme.colors.success}
                  />
                </View>

                <View style={styles.schemaHeaderText}>
                  <Text style={styles.schemaTitle}>{content.advantagesTitle}</Text>
                  <Text style={styles.schemaSubtitle}>
                    {content.advantagesSubtitle}
                  </Text>
                </View>
              </View>

              <View style={styles.schemaLine} />

              {content.advantages.map((item, index) => (
                <View
                  key={item}
                  style={[
                    styles.schemaRow,
                    index === content.advantages.length - 1 &&
                      styles.schemaRowLast,
                  ]}>
                  <View style={styles.smallPositiveIcon}>
                    <MaterialDesignIcons
                      name="check"
                      size={14}
                      color={theme.colors.success}
                    />
                  </View>

                  <Text style={styles.schemaText}>{item}</Text>
                </View>
              ))}
            </View>

            {/* LIMITATIONS */}
            <View style={styles.schemaCard}>
              <View style={styles.schemaHeader}>
                <View style={styles.iconCircleWarning}>
                  <MaterialDesignIcons
                    name="alert-circle-outline"
                    size={22}
                    color={theme.colors.primary}
                  />
                </View>

                <View style={styles.schemaHeaderText}>
                  <Text style={styles.schemaTitle}>{content.limitationsTitle}</Text>
                  <Text style={styles.schemaSubtitle}>
                    {content.limitationsSubtitle}
                  </Text>
                </View>
              </View>

              <View style={styles.schemaLine} />

              {content.limitations.map((item, index) => (
                <View
                  key={item}
                  style={[
                    styles.schemaRow,
                    index === content.limitations.length - 1 &&
                      styles.schemaRowLast,
                  ]}>
                  <View style={styles.smallWarningIcon}>
                    <MaterialDesignIcons
                      name="alert-outline"
                      size={14}
                      color={theme.colors.primary}
                    />
                  </View>

                  <Text style={styles.schemaText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* SECTION 4 */}
          <Text style={styles.h2}>4. {content.topics[3]}</Text>

          <View style={styles.takeaway}>
            <View style={styles.takeawayIcon}>
              <MaterialDesignIcons
                name="pill"
                size={22}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.takeawayContent}>
              <Text style={styles.takeawayTitle}>
                {content.takeawayTitle}
              </Text>

              <Text style={styles.takeawayText}>
                {content.takeawayText}
              </Text>
            </View>
          </View>

          <View style={styles.finalTip}>
            <MaterialDesignIcons
              name="heart-outline"
              size={22}
              color={theme.colors.primary}
            />

            <Text style={styles.finalTipText}>
              {content.finalTipText}
            </Text>
          </View>
        </View>
      </ScrollView>

      <ReadingControls
        articleId={ID}
        durationMinutes={7}
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
    color: theme.colors.textSecondary,
    fontWeight: '500',
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

  sectionIntro: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.textSecondary,
  },

  tip: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
  },

  note: {
    marginTop: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
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
    color: theme.colors.textSecondary,
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
    marginBottom: 9,
  },

  checkText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },

  /* ADVANTAGES / LIMITATIONS SCHEMA */

  schema: {
    marginTop: 15,
    gap: 12,
  },

  schemaCard: {
    padding: 15,
    borderRadius: 15,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  schemaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  schemaHeaderText: {
    flex: 1,
    marginLeft: 11,
  },

  schemaTitle: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '800',
  },

  schemaSubtitle: {
    marginTop: 2,
    fontSize: 10.5,
    color: theme.colors.textMuted,
  },

  iconCirclePositive: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(theme.colors.success, 0.12),
  },

  iconCircleWarning: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(theme.colors.primary, 0.12),
  },

  schemaLine: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginTop: 13,
    marginBottom: 4,
  },

  schemaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },

  schemaRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 3,
  },

  smallPositiveIcon: {
    width: 23,
    height: 23,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
    backgroundColor: withAlpha(theme.colors.success, 0.12),
  },

  smallWarningIcon: {
    width: 23,
    height: 23,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
    backgroundColor: withAlpha(theme.colors.primary, 0.12),
  },

  schemaText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  takeaway: {
    marginTop: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
  },

  takeawayIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  takeawayContent: {
    flex: 1,
    marginLeft: 11,
  },

  takeawayTitle: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '800',
  },

  takeawayText: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.textSecondary,
  },

  finalTip: {
    marginTop: 12,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  finalTipText: {
    flex: 1,
    marginLeft: 9,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },
  });
}
