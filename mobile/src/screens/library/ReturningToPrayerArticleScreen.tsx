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

const ID = 'returningtoprayer-le-ghusl-et-le-retour';

const HERO = require('../../assets/images/library/category-spiritual.png');

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'RETOUR À LA PRIÈRE',
    title: 'Le ghusl et le\nretour à la prière',
    metaDuration: '5 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Les étapes générales pour reprendre la prière après les règles, avec sérénité.',
    disclaimerTitle: 'Information importante',
    disclaimerText: 'Ce contenu est purement éducatif. Les questions religieuses doivent être validées par des savants qualifiés. AWA ne délivre pas de fatwas ni de décisions religieuses personnalisées.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Le ghusl, retour à la pureté rituelle',
      'Une méthode qui peut varier selon l’école',
      'La reprise de la prière, sans rattrapage',
      'Points pratiques à retenir',
    ],
    section1Body1: 'Le ghusl est une grande ablution rituelle : elle consiste à laver l’intégralité du corps avec l’intention de retrouver l’état de pureté rituelle (tahara), nécessaire à l’accomplissement de la prière et d’autres actes d’adoration.',
    section1Body2: 'Avant d’effectuer le ghusl, il est important de s’assurer que les règles sont réellement terminées : le ghusl doit suivre, et non précéder, la certitude que le saignement s’est arrêté. De manière générale, cette fin se reconnaît à l’arrêt total du saignement, observé sur une durée suffisante pour écarter tout doute — un point détaillé dans l’article dédié à la pureté rituelle.',
    section1Body3: 'C’est cette purification qui permet de renouer avec les moments d’adoration suspendus pendant les règles.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Il n’y a pas d’urgence à ressentir : le ghusl peut être effectué dès que tu es prête, sans pression, une fois la fin des règles constatée avec certitude.',
    section2Body: 'Le ghusl repose sur des principes généraux communs : l’intention de se purifier, et le lavage complet du corps, y compris les cheveux et la peau. Les détails précis de la méthode peuvent en revanche varier selon les écoles juridiques suivies.',
    alertTitle: 'Note importante',
    alertText: 'Aucune méthode particulière n’est présentée ici comme la seule valable : se référer à l’école ou à l’avis suivi habituellement, ou demander conseil à un savant qualifié, permet de connaître les modalités précises adaptées à ta situation.',
    section3Body1: 'Une fois les règles terminées et le ghusl effectué, la prière reprend normalement, sans délai particulier ni condition supplémentaire.',
    section3Body2: 'Il est utile de distinguer deux situations qui suivent des règles différentes : les prières non accomplies pendant les règles ne sont généralement pas rattrapées, alors que les jours de jeûne manqués pendant le Ramadan doivent, eux, être rattrapés plus tard (qadaa).',
    section3Body3: 'Par exemple, une femme ayant eu ses règles pendant 6 jours reprend la prière normalement après le ghusl, sans avoir à rattraper les prières de ces 6 jours. Les 6 jours de jeûne correspondants, en revanche, seront rattrapés après le Ramadan.',
    practicalPoints: [
      'Reconnaître la fin des règles avec certitude',
      'Effectuer le ghusl (grande ablution) pour retrouver la pureté rituelle',
      'Reprendre la prière normalement, sans délai',
      'Savoir que les prières manquées pendant les règles ne sont généralement pas rattrapées',
      'Demander conseil à un savant qualifié pour toute situation particulière ou un doute persistant',
    ],
    shareMessage: 'Le ghusl et le retour à la prière — AWA',
  },
  en: {
    badge: 'RETURN TO PRAYER',
    title: 'Ghusl and the\nreturn to prayer',
    metaDuration: '5 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'The general steps for resuming prayer after menstruation, with peace of mind.',
    disclaimerTitle: 'Important information',
    disclaimerText: 'This content is purely educational. Religious questions should be validated by qualified scholars. AWA does not issue fatwas or personalized religious rulings.',
    contentsTitle: 'In this article',
    topics: [
      'Ghusl, return to ritual purity',
      'A method that can vary by school',
      'Resuming prayer, without making up missed prayers',
      'Practical points to remember',
    ],
    section1Body1: 'Ghusl is a major ritual ablution: it consists of washing the entire body with the intention of returning to the state of ritual purity (tahara), necessary for performing prayer and other acts of worship.',
    section1Body2: 'Before performing the ghusl, it’s important to make sure that menstruation has truly ended: the ghusl should follow, not precede, the certainty that the bleeding has stopped. Generally speaking, this end is recognized by the total stopping of bleeding, observed over a sufficient period of time to rule out any doubt — a point covered in detail in the article dedicated to ritual purity.',
    section1Body3: 'This purification is what allows you to reconnect with the moments of worship suspended during menstruation.',
    tip1Title: 'Good to know',
    tip1Text: 'There’s no need to feel rushed: the ghusl can be performed as soon as you’re ready, without pressure, once the end of menstruation has been confirmed with certainty.',
    section2Body: 'The ghusl is based on shared general principles: the intention to purify oneself, and the complete washing of the body, including the hair and skin. The precise details of the method, however, can vary according to the school of jurisprudence followed.',
    alertTitle: 'Important note',
    alertText: 'No particular method is presented here as the only valid one: referring to the school or opinion you usually follow, or seeking advice from a qualified scholar, will help you learn the precise details suited to your situation.',
    section3Body1: 'Once menstruation has ended and the ghusl has been performed, prayer resumes normally, with no particular delay or additional condition.',
    section3Body2: 'It’s helpful to distinguish between two situations that follow different rules: prayers not performed during menstruation are generally not made up, whereas fasting days missed during Ramadan must be made up later (qadaa).',
    section3Body3: 'For example, a woman who has had her period for 6 days resumes prayer normally after the ghusl, without having to make up the prayers from those 6 days. The corresponding 6 days of fasting, however, will be made up after Ramadan.',
    practicalPoints: [
      'Recognizing the end of menstruation with certainty',
      'Performing the ghusl (major ablution) to return to ritual purity',
      'Resuming prayer normally, without delay',
      'Knowing that prayers missed during menstruation are generally not made up',
      'Seeking advice from a qualified scholar for any particular situation or persistent doubt',
    ],
    shareMessage: 'Ghusl and the return to prayer — AWA',
  },
  es: {
    badge: 'REGRESO A LA ORACIÓN',
    title: 'El gusl y el\nregreso a la oración',
    metaDuration: '5 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Los pasos generales para reanudar la oración después de la menstruación, con serenidad.',
    disclaimerTitle: 'Información importante',
    disclaimerText: 'Este contenido es puramente educativo. Las preguntas religiosas deben ser validadas por eruditos cualificados. AWA no emite fatuas ni decisiones religiosas personalizadas.',
    contentsTitle: 'En este artículo',
    topics: [
      'El gusl, regreso a la pureza ritual',
      'Un método que puede variar según la escuela',
      'La reanudación de la oración, sin recuperación',
      'Puntos prácticos para recordar',
    ],
    section1Body1: 'El gusl es una ablución ritual mayor: consiste en lavar todo el cuerpo con la intención de recuperar el estado de pureza ritual (tahara), necesario para realizar la oración y otros actos de adoración.',
    section1Body2: 'Antes de realizar el gusl, es importante asegurarse de que la menstruación ha terminado realmente: el gusl debe seguir, y no preceder, a la certeza de que el sangrado se ha detenido. De manera general, este fin se reconoce por el cese total del sangrado, observado durante un tiempo suficiente para descartar cualquier duda, un punto detallado en el artículo dedicado a la pureza ritual.',
    section1Body3: 'Es esta purificación la que permite retomar los momentos de adoración suspendidos durante la menstruación.',
    tip1Title: 'Bueno saberlo',
    tip1Text: 'No hay ninguna urgencia que sentir: el gusl puede realizarse en cuanto estés lista, sin presión, una vez constatado con certeza el fin de la menstruación.',
    section2Body: 'El gusl se basa en principios generales comunes: la intención de purificarse y el lavado completo del cuerpo, incluidos el cabello y la piel. Los detalles precisos del método, en cambio, pueden variar según las escuelas jurídicas seguidas.',
    alertTitle: 'Nota importante',
    alertText: 'Ningún método concreto se presenta aquí como el único válido: referirse a la escuela o a la opinión que se suele seguir, o pedir consejo a un erudito cualificado, permite conocer las modalidades precisas adaptadas a tu situación.',
    section3Body1: 'Una vez terminada la menstruación y realizado el gusl, la oración se reanuda con normalidad, sin ningún plazo particular ni condición adicional.',
    section3Body2: 'Es útil distinguir dos situaciones que siguen reglas diferentes: las oraciones no realizadas durante la menstruación generalmente no se recuperan, mientras que los días de ayuno no realizados durante el Ramadán sí deben recuperarse más tarde (qadaa).',
    section3Body3: 'Por ejemplo, una mujer que ha tenido la menstruación durante 6 días reanuda la oración con normalidad después del gusl, sin tener que recuperar las oraciones de esos 6 días. Los 6 días de ayuno correspondientes, en cambio, se recuperarán después del Ramadán.',
    practicalPoints: [
      'Reconocer el fin de la menstruación con certeza',
      'Realizar el gusl (ablución mayor) para recuperar la pureza ritual',
      'Reanudar la oración con normalidad, sin demora',
      'Saber que las oraciones no realizadas durante la menstruación generalmente no se recuperan',
      'Pedir consejo a un erudito cualificado para cualquier situación particular o duda persistente',
    ],
    shareMessage: 'El gusl y el regreso a la oración — AWA',
  },
  it: {
    badge: 'RIPRESA DELLA PREGHIERA',
    title: 'Il ghusl e la\nripresa della preghiera',
    metaDuration: '5 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'I passaggi generali per riprendere la preghiera dopo le mestruazioni, con serenità.',
    disclaimerTitle: 'Informazione importante',
    disclaimerText: 'Questo contenuto ha uno scopo puramente educativo. Le questioni religiose dovrebbero essere validate da studiosi qualificati. AWA non emette fatwa né pareri religiosi personalizzati.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Il ghusl, il ritorno alla purezza rituale',
      'Un metodo che può variare a seconda della scuola',
      'Riprendere la preghiera, senza recuperare quelle perse',
      'Punti pratici da ricordare',
    ],
    section1Body1: 'Il ghusl è un’abluzione rituale maggiore: consiste nel lavare tutto il corpo con l’intenzione di tornare allo stato di purezza rituale (tahara), necessario per eseguire la preghiera e gli altri atti di culto.',
    section1Body2: 'Prima di eseguire il ghusl, è importante assicurarsi che le mestruazioni siano davvero terminate: il ghusl deve seguire, e non precedere, la certezza che il sanguinamento sia cessato. In generale, questa fine si riconosce dall’arresto totale del sanguinamento, osservato per un tempo sufficiente a escludere ogni dubbio — un punto trattato nel dettaglio nell’articolo dedicato alla purezza rituale.',
    section1Body3: 'Questa purificazione è ciò che ti permette di ritrovare i momenti di culto sospesi durante le mestruazioni.',
    tip1Title: 'Da sapere',
    tip1Text: 'Non c’è bisogno di sentirsi di fretta: il ghusl può essere eseguito non appena sei pronta, senza pressione, una volta confermata con certezza la fine delle mestruazioni.',
    section2Body: 'Il ghusl si basa su principi generali condivisi: l’intenzione di purificarsi e il lavaggio completo del corpo, inclusi capelli e pelle. I dettagli precisi del metodo, però, possono variare a seconda della scuola giuridica seguita.',
    alertTitle: 'Nota importante',
    alertText: 'Nessun metodo particolare è presentato qui come l’unico valido: fare riferimento alla scuola o all’opinione che segui abitualmente, oppure chiedere consiglio a uno studioso qualificato, ti aiuterà a conoscere i dettagli precisi adatti alla tua situazione.',
    section3Body1: 'Una volta terminate le mestruazioni ed eseguito il ghusl, la preghiera riprende normalmente, senza alcun ritardo né condizione aggiuntiva particolare.',
    section3Body2: 'È utile distinguere due situazioni che seguono regole diverse: le preghiere non eseguite durante le mestruazioni in genere non si recuperano, mentre i giorni di digiuno saltati durante il Ramadan devono essere recuperati più tardi (qadaa).',
    section3Body3: 'Per esempio, una donna che ha avuto il periodo mestruale per 6 giorni riprende normalmente la preghiera dopo il ghusl, senza dover recuperare le preghiere di quei 6 giorni. I 6 giorni di digiuno corrispondenti, invece, saranno recuperati dopo il Ramadan.',
    practicalPoints: [
      'Riconoscere con certezza la fine delle mestruazioni',
      'Eseguire il ghusl (abluzione maggiore) per tornare alla purezza rituale',
      'Riprendere normalmente la preghiera, senza ritardo',
      'Sapere che le preghiere perse durante le mestruazioni in genere non si recuperano',
      'Chiedere consiglio a uno studioso qualificato per qualsiasi situazione particolare o dubbio persistente',
    ],
    shareMessage: 'Il ghusl e la ripresa della preghiera — AWA',
  },
  tr: {
    badge: 'NAMAZA DÖNÜŞ',
    title: 'Gusül ve\nnamaza dönüş',
    metaDuration: '5 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Adetten sonra namaza yeniden başlamanın genel adımları, içinin rahatlığıyla.',
    disclaimerTitle: 'Önemli bilgi',
    disclaimerText: 'Bu içerik tamamen eğiticidir. Dinî sorular nitelikli âlimlere danışılarak doğrulanmalıdır. AWA fetva veya kişiye özel dinî hüküm vermez.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Gusül, ritüel temizliğe dönüş',
      'Mezhebe göre değişebilen bir yöntem',
      'Kılınamayan namazları kaza etmeden namaza yeniden başlamak',
      'Akılda tutulacak pratik noktalar',
    ],
    section1Body1: 'Gusül, büyük bir ritüel temizliktir: namaz kılmak ve diğer ibadetleri yapmak için gerekli olan ritüel temizlik (taharet) haline dönme niyetiyle bütün bedenin yıkanmasından oluşur.',
    section1Body2: 'Gusül almadan önce adetin gerçekten sona erdiğinden emin olmak önemlidir: gusül, kanamanın durduğundan emin olunmasından önce değil, sonra gelmelidir. Genel olarak bu son, her türlü şüpheyi ortadan kaldıracak yeterli bir süre boyunca gözlemlenen, kanamanın tamamen durmasıyla anlaşılır — bu nokta, ritüel temizliğe ayrılmış makalede ayrıntılı olarak ele alınmıştır.',
    section1Body3: 'Bu arınma, adet boyunca askıya alınan ibadet anlarına yeniden bağlanmana olanak tanır.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Acele etmene gerek yok: adetin sona erdiği kesin olarak teyit edildikten sonra, hazır olduğunda, baskı hissetmeden gusül alabilirsin.',
    section2Body: 'Gusül, ortak genel ilkelere dayanır: arınma niyeti ve saç ile cilt dahil bedenin tamamen yıkanması. Ancak yöntemin kesin ayrıntıları, uyulan fıkıh mezhebine göre değişebilir.',
    alertTitle: 'Önemli not',
    alertText: 'Burada hiçbir yöntem tek geçerli yöntem olarak sunulmuyor: genellikle uyduğun mezhebe ya da görüşe başvurmak veya nitelikli bir âlimden görüş almak, durumuna uygun kesin ayrıntıları öğrenmene yardımcı olur.',
    section3Body1: 'Adet sona erip gusül alındıktan sonra namaza, belirli bir gecikme ya da ek bir şart olmaksızın normal şekilde yeniden başlanır.',
    section3Body2: 'Farklı kurallara tabi iki durumu ayırt etmek faydalıdır: adet sırasında kılınmayan namazlar genellikle kaza edilmez; buna karşılık Ramazan’da tutulamayan oruç günleri daha sonra kaza edilmelidir.',
    section3Body3: 'Örneğin, 6 gün adet görmüş bir kadın gusülden sonra namaza normal şekilde yeniden başlar; o 6 günün namazlarını kaza etmesi gerekmez. Buna karşılık, karşılık gelen 6 günlük oruç Ramazan’dan sonra kaza edilir.',
    practicalPoints: [
      'Adetin sona erdiğini kesin olarak fark etmek',
      'Ritüel temizliğe dönmek için gusül (büyük abdest) almak',
      'Gecikmeden namaza normal şekilde yeniden başlamak',
      'Adet sırasında kılınamayan namazların genellikle kaza edilmediğini bilmek',
      'Herhangi bir özel durum veya süregelen tereddüt için nitelikli bir âlimden görüş almak',
    ],
    shareMessage: 'Gusül ve namaza dönüş — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function ReturningToPrayerArticleScreen({
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

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="information-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.disclaimerTitle}</Text>
              <Text style={styles.tipText}>{content.disclaimerText}</Text>
            </View>
          </View>

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
            {content.section1Body1}
          </Text>

          <Text style={styles.body}>
            {content.section1Body2}
          </Text>

          <Text style={styles.body}>
            {content.section1Body3}
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
            {content.section2Body}
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

          <Text style={styles.h2}>3. {content.topics[2]}</Text>

          <Text style={styles.body}>
            {content.section3Body1}
          </Text>

          <Text style={styles.body}>
            {content.section3Body2}
          </Text>

          <Text style={styles.body}>
            {content.section3Body3}
          </Text>

          <Text style={styles.h2}>4. {content.topics[3]}</Text>

          <View style={styles.checkList}>
            {content.practicalPoints.map(item => (
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
  alert: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
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
  tipText: {marginTop: 3, fontSize: 11.5, lineHeight: 17, color: theme.colors.textMuted},
  });
}
