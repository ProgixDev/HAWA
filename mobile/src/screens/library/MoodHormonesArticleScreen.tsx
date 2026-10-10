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

const ID = 'mood-humeur-et-hormones';

const HERO = require('../../assets/images/library/spm-hero.png');

/* -------------------------------------------------------------------------- */
/* DATA — icons are language-neutral; matching titles/text live in CONTENT   */
/* below, keyed by index to stay aligned with these icon lists.              */
/* -------------------------------------------------------------------------- */

const PHASE_MOOD_ICONS = ['water-outline', 'egg-outline', 'weather-cloudy'] as const;

const OBSERVE_HABITS_ICONS = ['notebook-outline', 'chart-line'] as const;

const HELPFUL_HABITS_ICONS = ['sleep', 'run', 'account-group-outline'] as const;

/* -------------------------------------------------------------------------- */
/* CONTENT — PHASE 7L bilingual editorial content. Article identity (ID,     */
/* images, bookmark/progress keys, JSX structure) is untouched; only this    */
/* object changes per language. The French text below is byte-identical to  */
/* the original — never retyped, only moved into the `fr` key — so the app  */
/* remains fully bilingual rather than having French replaced by English.   */
/* -------------------------------------------------------------------------- */

const CONTENT = {
  fr: {
    badge: 'CYCLE MENSTRUEL • HUMEUR',
    title: 'Humeur et fluctuations\nhormonales',
    metaDuration: '6 min de lecture',
    metaType: 'Article',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Pourquoi ton moral peut varier au fil du cycle, sans que ce soit systématiquement le cas.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Pourquoi l’humeur peut varier',
      'L’humeur selon les phases du cycle',
      'Observer tes propres variations',
      'Des habitudes qui peuvent aider',
      'Quand les changements deviennent préoccupants',
      'À retenir',
    ],
    section1Body: 'Les variations d’œstrogènes et de progestérone influencent directement les neurotransmetteurs liés à l’humeur, comme la sérotonine.',
    info1Title: 'À garder en tête',
    info1Text: 'Toutes les variations d’humeur ne sont pas forcément liées au cycle : le contexte de vie, le stress ou la fatigue jouent aussi un rôle important.',
    phaseMood: [
      {title: 'Pendant les règles', text: 'Fatigue et sensibilité émotionnelle sont fréquentes pour beaucoup de personnes.'},
      {title: 'Autour de l’ovulation', text: 'C’est souvent une phase de meilleure énergie et de bien-être ressenti.'},
      {title: 'Avant les règles', text: 'L’irritabilité ou les sautes d’humeur sont plus fréquentes à cette période.'},
    ],
    section2Body: 'L’irritabilité prémenstruelle ou les sautes d’humeur ménopausiques ont donc une explication biologique réelle, même si elles ne se manifestent pas de la même façon chez tout le monde.',
    observeHabits: [
      {title: 'Tenir un journal', text: 'Noter ton humeur et la phase de ton cycle t’aide à repérer tes propres tendances.'},
      {title: 'Identifier des schémas', text: 'Sans te juger : le but est de mieux te connaître, pas de tout contrôler.'},
    ],
    section4Body: 'Sommeil, activité physique et soutien social restent les meilleurs alliés pour stabiliser l’humeur.',
    helpfulHabits: [
      {title: 'Un sommeil suffisant', text: 'Le manque de sommeil amplifie souvent la sensibilité émotionnelle.'},
      {title: 'Une activité physique régulière', text: 'Même modérée, elle aide à stabiliser l’humeur au fil du cycle.'},
      {title: 'Un soutien social', text: 'En parler à une personne de confiance peut alléger ce que tu ressens.'},
    ],
    section5Body: 'Une variation d’humeur liée au cycle reste généralement passagère. Certains signes méritent en revanche une attention particulière :',
    warningTitle: 'Signaux à surveiller',
    concerningSigns: [
      'Une tristesse intense ou qui persiste au-delà du cycle',
      'Une perte d’intérêt marquée pour ce que tu aimes habituellement',
      'Un impact important sur ton quotidien ou tes relations',
      'Des pensées envahissantes ou un sentiment de détresse important',
    ],
    info2Title: 'Un accompagnement est possible',
    info2Text: 'Un médecin, une sage-femme ou un psychologue peut t’aider à mieux comprendre ce que tu ressens et t’orienter si besoin.',
    tipTitle: 'Bon à savoir',
    tipText: 'Reconnaître le lien entre hormones et humeur peut aider à mieux comprendre ce que tu ressens, sans pour autant tout réduire à cette seule explication.',
    summaryPoints: [
      'Les variations d’œstrogènes et de progestérone influencent directement les neurotransmetteurs liés à l’humeur.',
      'L’irritabilité prémenstruelle a donc une explication biologique réelle.',
      'Toutes les variations d’humeur ne sont pas forcément liées au cycle : le contexte de vie compte aussi.',
      'Sommeil, activité physique et soutien social restent les meilleurs alliés pour stabiliser l’humeur.',
    ],
    disclaimerText: 'Contenu informatif. Cet article ne remplace pas un avis médical ou psychologique personnalisé. En cas de doute, demande conseil à un professionnel de santé.',
    shareMessage: 'Humeur et fluctuations hormonales — AWA',
  },
  en: {
    badge: 'MENSTRUAL CYCLE • MOOD',
    title: 'Mood and hormonal\nfluctuations',
    metaDuration: '6 min read',
    metaType: 'Article',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'Why your mood can vary throughout your cycle, though not always.',
    contentsTitle: 'In this article',
    topics: [
      'Why mood can vary',
      'Mood across the phases of the cycle',
      'Observing your own variations',
      'Habits that can help',
      'When changes become concerning',
      'Key takeaways',
    ],
    section1Body: 'Fluctuations in estrogen and progesterone directly influence mood-related neurotransmitters, such as serotonin.',
    info1Title: 'Keep in mind',
    info1Text: 'Not every mood swing is necessarily linked to your cycle: life circumstances, stress, and fatigue also play an important role.',
    phaseMood: [
      {title: 'During your period', text: 'Fatigue and emotional sensitivity are common for many people.'},
      {title: 'Around ovulation', text: 'This is often a phase of better energy and a greater sense of well-being.'},
      {title: 'Before your period', text: 'Irritability or mood swings are more common during this time.'},
    ],
    section2Body: 'Premenstrual irritability or menopausal mood swings therefore have a real biological explanation, even if they don’t show up the same way for everyone.',
    observeHabits: [
      {title: 'Keeping a journal', text: 'Writing down your mood and your cycle phase helps you spot your own patterns.'},
      {title: 'Identifying patterns', text: 'Without judging yourself: the goal is to know yourself better, not to control everything.'},
    ],
    section4Body: 'Sleep, physical activity, and social support remain the best allies for stabilizing mood.',
    helpfulHabits: [
      {title: 'Enough sleep', text: 'Lack of sleep often heightens emotional sensitivity.'},
      {title: 'Regular physical activity', text: 'Even moderate activity helps stabilize mood throughout the cycle.'},
      {title: 'Social support', text: 'Talking to someone you trust can ease what you’re feeling.'},
    ],
    section5Body: 'A mood change linked to your cycle is usually temporary. However, certain signs deserve particular attention:',
    warningTitle: 'Signs to watch for',
    concerningSigns: [
      'Intense sadness, or sadness that persists beyond the cycle',
      'A marked loss of interest in things you usually enjoy',
      'A significant impact on your daily life or relationships',
      'Intrusive thoughts or a significant feeling of distress',
    ],
    info2Title: 'Support is available',
    info2Text: 'A doctor, midwife, or psychologist can help you better understand what you’re feeling and refer you to further support if needed.',
    tipTitle: 'Good to know',
    tipText: 'Recognizing the link between hormones and mood can help you better understand what you’re feeling, without reducing everything to this one explanation.',
    summaryPoints: [
      'Fluctuations in estrogen and progesterone directly influence mood-related neurotransmitters.',
      'Premenstrual irritability therefore has a real biological explanation.',
      'Not every mood swing is necessarily linked to the cycle: life circumstances matter too.',
      'Sleep, physical activity, and social support remain the best allies for stabilizing mood.',
    ],
    disclaimerText: 'Informational content. This article does not replace personalized medical or psychological advice. If in doubt, seek guidance from a healthcare professional.',
    shareMessage: 'Mood and hormonal fluctuations — AWA',
  },
  es: {
    badge: 'CICLO MENSTRUAL • ESTADO DE ÁNIMO',
    title: 'Estado de ánimo y\nfluctuaciones hormonales',
    metaDuration: '6 min de lectura',
    metaType: 'Artículo',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Por qué tu estado de ánimo puede variar a lo largo del ciclo, aunque no siempre sea así.',
    contentsTitle: 'En este artículo',
    topics: [
      'Por qué puede variar el estado de ánimo',
      'El estado de ánimo según las fases del ciclo',
      'Observar tus propias variaciones',
      'Hábitos que pueden ayudar',
      'Cuándo los cambios se vuelven preocupantes',
      'Para recordar',
    ],
    section1Body: 'Las variaciones de estrógeno y progesterona influyen directamente en los neurotransmisores relacionados con el estado de ánimo, como la serotonina.',
    info1Title: 'Ten en cuenta',
    info1Text: 'No todas las variaciones del estado de ánimo están necesariamente ligadas al ciclo: el contexto de vida, el estrés o el cansancio también juegan un papel importante.',
    phaseMood: [
      {title: 'Durante la regla', text: 'El cansancio y la sensibilidad emocional son frecuentes en muchas personas.'},
      {title: 'Alrededor de la ovulación', text: 'Suele ser una fase de mejor energía y de mayor bienestar percibido.'},
      {title: 'Antes de la regla', text: 'La irritabilidad o los cambios de humor son más frecuentes en este momento.'},
    ],
    section2Body: 'La irritabilidad premenstrual o los cambios de humor de la menopausia tienen, por tanto, una explicación biológica real, aunque no se manifiesten de la misma manera en todas las personas.',
    observeHabits: [
      {title: 'Llevar un diario', text: 'Anotar tu estado de ánimo y la fase de tu ciclo te ayuda a detectar tus propias tendencias.'},
      {title: 'Identificar patrones', text: 'Sin juzgarte: el objetivo es conocerte mejor, no controlarlo todo.'},
    ],
    section4Body: 'El sueño, la actividad física y el apoyo social siguen siendo los mejores aliados para estabilizar el estado de ánimo.',
    helpfulHabits: [
      {title: 'Un sueño suficiente', text: 'La falta de sueño suele intensificar la sensibilidad emocional.'},
      {title: 'Actividad física regular', text: 'Incluso moderada, ayuda a estabilizar el estado de ánimo a lo largo del ciclo.'},
      {title: 'Apoyo social', text: 'Hablarlo con alguien de confianza puede aliviar lo que sientes.'},
    ],
    section5Body: 'Un cambio de humor ligado al ciclo suele ser pasajero. En cambio, algunas señales merecen una atención especial:',
    warningTitle: 'Señales a vigilar',
    concerningSigns: [
      'Una tristeza intensa o que persiste más allá del ciclo',
      'Una pérdida marcada de interés por lo que normalmente disfrutas',
      'Un impacto importante en tu vida diaria o en tus relaciones',
      'Pensamientos invasivos o una sensación de angustia importante',
    ],
    info2Title: 'Existe apoyo disponible',
    info2Text: 'Un médico, una matrona o un psicólogo pueden ayudarte a comprender mejor lo que sientes y orientarte si es necesario.',
    tipTitle: 'Dato útil',
    tipText: 'Reconocer el vínculo entre las hormonas y el estado de ánimo puede ayudarte a comprender mejor lo que sientes, sin por ello reducirlo todo a esta única explicación.',
    summaryPoints: [
      'Las variaciones de estrógeno y progesterona influyen directamente en los neurotransmisores relacionados con el estado de ánimo.',
      'La irritabilidad premenstrual tiene, por tanto, una explicación biológica real.',
      'No todas las variaciones del estado de ánimo están necesariamente ligadas al ciclo: el contexto de vida también importa.',
      'El sueño, la actividad física y el apoyo social siguen siendo los mejores aliados para estabilizar el estado de ánimo.',
    ],
    disclaimerText: 'Contenido informativo. Este artículo no sustituye una opinión médica o psicológica personalizada. Si tienes dudas, consulta a un profesional de la salud.',
    shareMessage: 'Estado de ánimo y fluctuaciones hormonales — AWA',
  },
  it: {
    badge: 'CICLO MESTRUALE • UMORE',
    title: 'Umore e fluttuazioni\normonali',
    metaDuration: '6 min di lettura',
    metaType: 'Articolo',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Perché il tuo umore può variare nel corso del ciclo, anche se non sempre.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Perché l’umore può variare',
      'L’umore nelle fasi del ciclo',
      'Osservare le tue variazioni',
      'Abitudini che possono aiutare',
      'Quando i cambiamenti diventano preoccupanti',
      'Punti chiave',
    ],
    section1Body: 'Le fluttuazioni di estrogeni e progesterone influenzano direttamente i neurotrasmettitori legati all’umore, come la serotonina.',
    info1Title: 'Da tenere a mente',
    info1Text: 'Non tutti gli sbalzi d’umore sono necessariamente legati al tuo ciclo: anche le circostanze della vita, lo stress e la stanchezza hanno un ruolo importante.',
    phaseMood: [
      {
        title: 'Durante il periodo mestruale',
        text: 'Stanchezza e sensibilità emotiva sono frequenti per molte persone.',
      },
      {
        title: 'Intorno all’ovulazione',
        text: 'Spesso è una fase di maggiore energia e di maggiore senso di benessere.',
      },
      {
        title: 'Prima del periodo mestruale',
        text: 'In questo momento sono più frequenti irritabilità o sbalzi d’umore.',
      },
    ],
    section2Body: 'L’irritabilità premestruale o gli sbalzi d’umore della menopausa hanno quindi una reale spiegazione biologica, anche se non si manifestano allo stesso modo in tutte.',
    observeHabits: [
      {
        title: 'Tenere un diario',
        text: 'Annotare il tuo umore e la fase del ciclo ti aiuta a individuare i tuoi schemi personali.',
      },
      {
        title: 'Individuare gli schemi',
        text: 'Senza giudicarti: l’obiettivo è conoscerti meglio, non controllare tutto.',
      },
    ],
    section4Body: 'Il sonno, l’attività fisica e il sostegno sociale restano i migliori alleati per stabilizzare l’umore.',
    helpfulHabits: [
      {
        title: 'Dormire a sufficienza',
        text: 'La mancanza di sonno spesso accentua la sensibilità emotiva.',
      },
      {
        title: 'Attività fisica regolare',
        text: 'Anche un’attività moderata aiuta a stabilizzare l’umore durante tutto il ciclo.',
      },
      {
        title: 'Sostegno sociale',
        text: 'Parlare con una persona di cui ti fidi può alleviare ciò che provi.',
      },
    ],
    section5Body: 'Un cambiamento dell’umore legato al ciclo è di solito temporaneo. Tuttavia, alcuni segnali meritano un’attenzione particolare:',
    warningTitle: 'Segnali a cui prestare attenzione',
    concerningSigns: [
      'Tristezza intensa, o tristezza che persiste oltre il ciclo',
      'Una marcata perdita di interesse per ciò che di solito ti piace',
      'Un impatto significativo sulla tua vita quotidiana o sulle tue relazioni',
      'Pensieri intrusivi o un forte senso di disagio',
    ],
    info2Title: 'Esiste un sostegno',
    info2Text: 'Un medico, un’ostetrica o una psicologa possono aiutarti a comprendere meglio ciò che provi e, se necessario, indirizzarti verso un ulteriore sostegno.',
    tipTitle: 'Da sapere',
    tipText: 'Riconoscere il legame tra ormoni e umore può aiutarti a capire meglio ciò che provi, senza ridurre tutto a questa sola spiegazione.',
    summaryPoints: [
      'Le fluttuazioni di estrogeni e progesterone influenzano direttamente i neurotrasmettitori legati all’umore.',
      'L’irritabilità premestruale ha quindi una reale spiegazione biologica.',
      'Non tutti gli sbalzi d’umore sono necessariamente legati al ciclo: contano anche le circostanze della vita.',
      'Il sonno, l’attività fisica e il sostegno sociale restano i migliori alleati per stabilizzare l’umore.',
    ],
    disclaimerText: 'Contenuto informativo. Questo articolo non sostituisce un parere medico o psicologico personalizzato. In caso di dubbi, rivolgiti a un professionista sanitario.',
    shareMessage: 'Umore e fluttuazioni ormonali — AWA',
  },
  tr: {
    badge: 'ADET DÖNGÜSÜ • RUH HALİ',
    title: 'Ruh hali ve hormonal\ndalgalanmalar',
    metaDuration: '6 dk okuma',
    metaType: 'Makale',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Ruh halinin döngü boyunca neden değişebildiği; ancak her zaman değişmeyebileceği.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Ruh hali neden değişebilir?',
      'Döngü evrelerinde ruh hali',
      'Kendi değişimlerini gözlemlemek',
      'Yardımcı olabilecek alışkanlıklar',
      'Değişimler ne zaman kaygı verici olur?',
      'Akılda kalacaklar',
    ],
    section1Body: 'Östrojen ve progesterondaki dalgalanmalar, serotonin gibi ruh haliyle ilgili nörotransmitterleri doğrudan etkiler.',
    info1Title: 'Aklında bulunsun',
    info1Text: 'Her ruh hali değişimi mutlaka döngünle bağlantılı değildir: yaşam koşulları, stres ve yorgunluk da önemli bir rol oynar.',
    phaseMood: [
      {
        title: 'Adetin sırasında',
        text: 'Yorgunluk ve duygusal hassasiyet birçok kişide yaygındır.',
      },
      {
        title: 'Yumurtlama civarında',
        text: 'Bu, çoğu zaman daha iyi enerjinin ve daha güçlü bir iyi olma hissinin yaşandığı bir evredir.',
      },
      {
        title: 'Adetinden önce',
        text: 'Bu dönemde alınganlık ya da ruh hali dalgalanmaları daha sık görülür.',
      },
    ],
    section2Body: 'Dolayısıyla adet öncesi alınganlığın ya da menopoz dönemindeki ruh hali dalgalanmalarının gerçek bir biyolojik açıklaması vardır; bu durum herkeste aynı şekilde ortaya çıkmasa da.',
    observeHabits: [
      {
        title: 'Günlük tutmak',
        text: 'Ruh halini ve döngü evreni yazmak, kendi örüntülerini fark etmene yardımcı olur.',
      },
      {
        title: 'Örüntüleri belirlemek',
        text: 'Kendini yargılamadan: amaç her şeyi kontrol etmek değil, kendini daha iyi tanımaktır.',
      },
    ],
    section4Body: 'Uyku, fiziksel aktivite ve sosyal destek, ruh halini dengelemek için en iyi müttefikler olmaya devam eder.',
    helpfulHabits: [
      {
        title: 'Yeterli uyku',
        text: 'Uykusuzluk çoğu zaman duygusal hassasiyeti artırır.',
      },
      {
        title: 'Düzenli fiziksel aktivite',
        text: 'Orta düzeyde bir aktivite bile döngü boyunca ruh halini dengelemeye yardımcı olur.',
      },
      {
        title: 'Sosyal destek',
        text: 'Güvendiğin biriyle konuşmak hissettiklerini hafifletebilir.',
      },
    ],
    section5Body: 'Döngüyle bağlantılı bir ruh hali değişimi genellikle geçicidir. Yine de bazı belirtiler özellikle dikkat gerektirir:',
    warningTitle: 'Dikkat edilmesi gereken belirtiler',
    concerningSigns: [
      'Yoğun üzüntü ya da döngünün ötesinde süren üzüntü',
      'Normalde keyif aldığın şeylere karşı belirgin ilgi kaybı',
      'Günlük hayatın ya da ilişkilerin üzerinde önemli bir etki',
      'İstem dışı düşünceler ya da belirgin bir sıkıntı hissi',
    ],
    info2Title: 'Destek mevcut',
    info2Text: 'Bir doktor, ebe ya da psikolog hissettiklerini daha iyi anlamana yardımcı olabilir ve gerekirse seni ileri desteğe yönlendirebilir.',
    tipTitle: 'Bilmekte fayda var',
    tipText: 'Hormonlar ile ruh hali arasındaki bağlantıyı fark etmek, her şeyi bu tek açıklamaya indirgemeden hissettiklerini daha iyi anlamana yardımcı olabilir.',
    summaryPoints: [
      'Östrojen ve progesterondaki dalgalanmalar, ruh haliyle ilgili nörotransmitterleri doğrudan etkiler.',
      'Dolayısıyla adet öncesi alınganlığın gerçek bir biyolojik açıklaması vardır.',
      'Her ruh hali değişimi mutlaka döngüyle bağlantılı değildir: yaşam koşulları da önemlidir.',
      'Uyku, fiziksel aktivite ve sosyal destek, ruh halini dengelemek için en iyi müttefikler olmaya devam eder.',
    ],
    disclaimerText: 'Bilgilendirme amaçlı içerik. Bu makale kişiye özel tıbbi ya da psikolojik tavsiyenin yerini tutmaz. Tereddüt ettiğinde bir sağlık profesyonelinden yönlendirme al.',
    shareMessage: 'Ruh hali ve hormonal dalgalanmalar — AWA',
  },
} as const;

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

/* -------------------------------------------------------------------------- */
/* SCREEN                                                                     */
/* -------------------------------------------------------------------------- */

export default function MoodHormonesArticleScreen({
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

          {/* ================================================================= */}
          {/* SECTION 1                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>1. {content.topics[0]}</Text>

          <Text style={styles.body}>{content.section1Body}</Text>

          <View style={styles.infoCard}>
            <MaterialDesignIcons
              name="information-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>{content.info1Title}</Text>
              <Text style={styles.infoText}>{content.info1Text}</Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SECTION 2                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>2. {content.topics[1]}</Text>

          <View style={styles.normalGrid}>
            {PHASE_MOOD_ICONS.map((icon, index) => {
              const item = content.phaseMood[index];
              return (
                <View key={item.title} style={styles.normalCard}>
                  <View style={styles.normalIcon}>
                    <MaterialDesignIcons
                      name={icon as never}
                      size={20}
                      color={theme.colors.primary}
                    />
                  </View>

                  <Text style={styles.normalTitle}>{item.title}</Text>
                  <Text style={styles.normalText}>{item.text}</Text>
                </View>
              );
            })}
          </View>

          <Text style={styles.body}>{content.section2Body}</Text>

          {/* ================================================================= */}
          {/* SECTION 3                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>3. {content.topics[2]}</Text>

          <View style={styles.comfortCard}>
            {OBSERVE_HABITS_ICONS.map((icon, index) => {
              const item = content.observeHabits[index];
              return (
                <View
                  key={item.title}
                  style={[
                    styles.comfortRow,
                    index < OBSERVE_HABITS_ICONS.length - 1 && styles.comfortRowBorder,
                  ]}>
                  <View style={styles.comfortIcon}>
                    <MaterialDesignIcons
                      name={icon as never}
                      size={19}
                      color={theme.colors.primary}
                    />
                  </View>

                  <View style={styles.comfortCopy}>
                    <Text style={styles.comfortTitle}>{item.title}</Text>
                    <Text style={styles.comfortText}>{item.text}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* ================================================================= */}
          {/* SECTION 4                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>4. {content.topics[3]}</Text>

          <Text style={styles.body}>{content.section4Body}</Text>

          <View style={styles.normalGrid}>
            {HELPFUL_HABITS_ICONS.map((icon, index) => {
              const item = content.helpfulHabits[index];
              return (
                <View key={item.title} style={styles.normalCard}>
                  <View style={styles.normalIcon}>
                    <MaterialDesignIcons
                      name={icon as never}
                      size={20}
                      color={theme.colors.primary}
                    />
                  </View>

                  <Text style={styles.normalTitle}>{item.title}</Text>
                  <Text style={styles.normalText}>{item.text}</Text>
                </View>
              );
            })}
          </View>

          {/* ================================================================= */}
          {/* SECTION 5                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>5. {content.topics[4]}</Text>

          <Text style={styles.body}>{content.section5Body}</Text>

          <View style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <MaterialDesignIcons
                name="alert-circle-outline"
                size={22}
                color={theme.colors.warning}
              />

              <Text style={styles.warningTitle}>{content.warningTitle}</Text>
            </View>

            {content.concerningSigns.map(item => (
              <View key={item} style={styles.warningRow}>
                <View style={styles.warningBullet}>
                  <MaterialDesignIcons
                    name="alert-circle-outline"
                    size={16}
                    color={theme.colors.warning}
                  />
                </View>

                <Text style={styles.warningText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.infoCard}>
            <MaterialDesignIcons
              name="account-heart-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>{content.info2Title}</Text>
              <Text style={styles.infoText}>{content.info2Text}</Text>
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

          <Text style={styles.h2}>{content.topics[5]}</Text>

          <View style={styles.summaryCard}>
            {content.summaryPoints.map(item => (
              <View key={item} style={styles.summaryRow}>
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

  infoCard: {
    marginTop: 14,
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

  normalGrid: {marginTop: 13, gap: 9},
  normalCard: {
    padding: 13,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  normalIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  normalTitle: {marginTop: 8, fontSize: 12.5, color: theme.colors.text, fontWeight: '800'},
  normalText: {marginTop: 4, fontSize: 11, lineHeight: 16, color: theme.colors.textSecondary},

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

  warningCard: {
    marginTop: 13,
    padding: 14,
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  warningHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 12},
  warningTitle: {flex: 1, marginLeft: 8, fontSize: 12.5, color: theme.colors.text, fontWeight: '800'},
  warningRow: {flexDirection: 'row', alignItems: 'flex-start', marginBottom: 9},
  warningBullet: {width: 20, alignItems: 'flex-start'},
  warningText: {flex: 1, marginLeft: 5, color: theme.colors.textSecondary, fontSize: 11.5, lineHeight: 17},

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
