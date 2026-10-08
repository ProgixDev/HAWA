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
import {CYCLE_PHASES_HERO, resolveEditorialImage} from '../../i18n/editorialImages';

const ID = 'fiqhwomen-introduction';

const HERO = require('../../assets/images/library/rules-hero.png');

const ART = {
  importance: CYCLE_PHASES_HERO,
  madhahib: require('../../assets/images/library/popular-phases.png'),
  consult: require('../../assets/images/library/spm-consult.png'),
  awaRole: require('../../assets/images/library/featured-tracking-hero.png'),
};

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const TOPIC_ICONS = [
  'calendar-month-outline',
  'water-outline',
  'shield-check-outline',
  'shower',
  'mosque',
  'moon-waning-crescent',
  'help-circle-outline',
  'baby-face-outline',
  'account-heart-outline',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'FIQH FÉMININ',
    title: 'Le fiqh féminin,\nune introduction',
    metaDuration: '7 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Un aperçu complet des grands sujets abordés dans le fiqh féminin, entre pratique religieuse et vie quotidienne.',
    disclaimerTitle: 'Information importante',
    disclaimerText: 'Ce contenu est purement éducatif. Les questions religieuses doivent être validées par des savants qualifiés. AWA ne délivre pas de fatwas ni de décisions religieuses personnalisées.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Ce que couvre le fiqh féminin',
      'Pourquoi le fiqh féminin est-il important ?',
      'Les écoles juridiques (madhab)',
      'Fiqh, santé et pratique quotidienne',
      'Le rôle éducatif d’AWA',
      'Quand demander conseil à une personne qualifiée ?',
      'À retenir',
    ],
    section1Body: 'Le fiqh féminin est le champ de la jurisprudence islamique (fiqh) qui s’intéresse aux questions pratiques liées au corps et au culte des femmes. Il aide à comprendre comment concilier la vie religieuse quotidienne avec les différentes étapes du cycle féminin.',
    dailyTopics: [
      'Les règles et le cycle menstruel',
      'Le sang menstruel et son statut',
      'La pureté rituelle',
      'Le ghusl après les règles',
      'La prière pendant et après les règles',
      'Le jeûne du Ramadan et les jours à rattraper',
      'Les saignements particuliers (istihâda)',
      'Le nifas après l’accouchement',
      'La vie quotidienne et la pratique religieuse',
    ],
    section1Body2: 'Le fiqh est un champ d’interprétation juridique : certaines questions font l’objet d’avis différents selon les savants et les écoles de pensée, sans qu’un avis soit à lui seul absolu.',
    section2Body: 'Comprendre le fiqh féminin permet de vivre sa pratique religieuse avec plus de sérénité, sans confusion, aux moments où le corps traverse des étapes spécifiques (règles, grossesse, post-partum, ménopause). Cela aide aussi à distinguer ce qui relève d’une obligation, d’une dispense ou d’une simple recommandation.',
    visual1Title: 'Une pratique religieuse apaisée',
    visual1Text: 'Savoir ce qui est attendu à chaque étape du cycle permet d’aborder sa foi avec plus de confiance.',
    section3Body: 'Un madhab désigne une école de pensée juridique, c’est-à-dire une méthode structurée que des savants utilisent pour interpréter les sources religieuses (Coran, Sunna, consensus, raisonnement) et répondre aux questions pratiques de la vie quotidienne. Plusieurs écoles existent, car les savants n’ont pas toujours suivi la même méthodologie ni interprété les mêmes textes de la même manière.',
    section3Body2: 'C’est pourquoi certaines questions liées aux règles, à la pureté rituelle, à la prière ou au jeûne peuvent faire l’objet d’avis différents selon les savants consultés. Une divergence d’opinion ne signifie pas qu’un avis serait « faux » : elle reflète des méthodologies et des lectures différentes des mêmes sources.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Il est courant de suivre l’approche ou le madhab traditionnellement suivi dans sa famille ou sa communauté.',
    noteTitle: 'À noter',
    noteText: 'Lorsqu’une situation religieuse précise reste incertaine, il est tout à fait approprié de demander l’avis d’un savant ou d’une savante qualifiée.',
    section4Body: 'Les informations médicales sur le cycle (durée, symptômes, phases hormonales) et les règles religieuses qui en découlent (pureté, prière, jeûne) répondent à deux logiques différentes : l’une décrit un phénomène biologique, l’autre définit un cadre de pratique spirituelle. Les deux peuvent se compléter, mais ne doivent pas être confondues.',
    visual2Title: 'Deux regards complémentaires',
    visual2Text: 'Le suivi médical du cycle et les repères religieux qui en découlent apportent chacun un éclairage utile.',
    tip2Title: 'Bon à savoir',
    tip2Text: 'Un professionnel de santé peut répondre aux questions médicales ; un savant qualifié reste la référence pour les questions religieuses.',
    section5Body: 'AWA accompagne les utilisatrices dans la compréhension de leur cycle, à la croisée de la santé et de la pratique religieuse, avec une approche pédagogique et respectueuse des différences entre écoles.',
    awaRole: [
      'Comprendre les notions de base du fiqh féminin',
      'Mieux appréhender son cycle, d’un point de vue médical et religieux',
      'Identifier les questions qui nécessitent l’avis d’un savant qualifié',
      'Se repérer entre les différences de madhahib sans confusion',
      'Accéder à des explications éducatives claires et neutres',
      'Distinguer une information médicale d’une décision religieuse',
      'Suivre les informations utiles à sa pratique religieuse, si besoin',
      'Préparer des questions précises à poser à un savant qualifié',
    ],
    alert3Title: 'Information importante',
    alert3Text: 'AWA est un outil éducatif et informatif : elle ne remplace en aucun cas l’avis d’un savant ou d’une autorité religieuse qualifiée.',
    section6Body: 'Certaines situations méritent d’être posées directement à un savant ou une savante de confiance, notamment lorsque :',
    whenToAsk: [
      'Une situation personnelle ne correspond à aucun cas classique (saignement inhabituel, doute prolongé...)',
      'Plusieurs avis semblent se contredire et tu ne sais pas lequel suivre',
      'Une décision religieuse a un impact important sur ta pratique quotidienne',
      'Tu ressens le besoin d’un accompagnement adapté à ta situation personnelle',
    ],
    tip3Title: 'Bon à savoir',
    tip3Text: 'Le fiqh féminin est un champ vivant d’interprétation, avec des avis parfois différents selon les écoles. AWA t’aide à comprendre les bases et à structurer tes questions, mais l’avis d’un savant qualifié reste la référence pour toute décision religieuse personnelle.',
    shareMessage: 'Le fiqh féminin, une introduction — AWA',
  },
  en: {
    badge: 'WOMEN’S FIQH',
    title: 'Women’s fiqh:\nan introduction',
    metaDuration: '7 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'A comprehensive overview of the main topics covered in women’s fiqh, between religious practice and daily life.',
    disclaimerTitle: 'Important information',
    disclaimerText: 'This content is purely educational. Religious questions should be validated by qualified scholars. AWA does not issue fatwas or personalized religious rulings.',
    contentsTitle: 'In this article',
    topics: [
      'What women’s fiqh covers',
      'Why is women’s fiqh important?',
      'Schools of jurisprudence (madhab)',
      'Fiqh, health, and daily practice',
      'AWA’s educational role',
      'When to seek advice from a qualified person?',
      'Key takeaways',
    ],
    section1Body: 'Women’s fiqh is the field of Islamic jurisprudence (fiqh) concerned with practical questions related to women’s bodies and worship. It helps in understanding how to reconcile daily religious life with the different stages of the female cycle.',
    dailyTopics: [
      'Menstruation and the menstrual cycle',
      'Menstrual blood and its status',
      'Ritual purity',
      'Ghusl after menstruation',
      'Prayer during and after menstruation',
      'The Ramadan fast and days to make up',
      'Irregular bleeding (istihâda)',
      'Nifas after childbirth',
      'Daily life and religious practice',
    ],
    section1Body2: 'Fiqh is a field of legal interpretation: some questions are subject to different opinions depending on the scholars and schools of thought, without any single opinion being absolute on its own.',
    section2Body: 'Understanding women’s fiqh makes it possible to live one’s religious practice with more serenity, without confusion, at times when the body goes through specific stages (menstruation, pregnancy, postpartum, menopause). It also helps distinguish what falls under an obligation, an exemption, or a simple recommendation.',
    visual1Title: 'A more peaceful religious practice',
    visual1Text: 'Knowing what is expected at each stage of the cycle makes it possible to approach one’s faith with more confidence.',
    section3Body: 'A madhab refers to a school of legal thought, that is, a structured method that scholars use to interpret religious sources (Quran, Sunnah, consensus, reasoning) and answer practical questions of daily life. Several schools exist, because scholars have not always followed the same methodology or interpreted the same texts in the same way.',
    section3Body2: 'This is why some questions related to menstruation, ritual purity, prayer, or fasting may be subject to different opinions depending on the scholars consulted. A difference of opinion does not mean that one opinion is “wrong”: it reflects different methodologies and readings of the same sources.',
    tip1Title: 'Good to know',
    tip1Text: 'It is common to follow the approach or madhab traditionally followed in one’s family or community.',
    noteTitle: 'Please note',
    noteText: 'When a specific religious situation remains uncertain, it is entirely appropriate to ask for the opinion of a qualified scholar.',
    section4Body: 'Medical information about the cycle (duration, symptoms, hormonal phases) and the religious rules that follow from it (purity, prayer, fasting) respond to two different logics: one describes a biological phenomenon, the other defines a framework for spiritual practice. The two can complement each other, but must not be confused.',
    visual2Title: 'Two complementary perspectives',
    visual2Text: 'Medical tracking of the cycle and the religious markers that follow from it each provide useful insight.',
    tip2Title: 'Good to know',
    tip2Text: 'A healthcare professional can answer medical questions; a qualified scholar remains the reference for religious questions.',
    section5Body: 'AWA supports users in understanding their cycle, at the intersection of health and religious practice, with an educational approach that respects differences between schools.',
    awaRole: [
      'Understand the basic concepts of women’s fiqh',
      'Better understand one’s cycle, from both a medical and religious point of view',
      'Identify questions that require the opinion of a qualified scholar',
      'Find one’s way among differences between madhahib without confusion',
      'Access clear and neutral educational explanations',
      'Distinguish medical information from a religious decision',
      'Follow information useful to one’s religious practice, if needed',
      'Prepare specific questions to ask a qualified scholar',
    ],
    alert3Title: 'Important information',
    alert3Text: 'AWA is an educational and informational tool: it does not replace, under any circumstances, the opinion of a qualified scholar or religious authority.',
    section6Body: 'Some situations deserve to be raised directly with a trusted scholar, particularly when:',
    whenToAsk: [
      'A personal situation does not match any typical case (unusual bleeding, prolonged doubt...)',
      'Several opinions seem to contradict each other and you don’t know which one to follow',
      'A religious decision has a significant impact on your daily practice',
      'You feel the need for guidance suited to your personal situation',
    ],
    tip3Title: 'Good to know',
    tip3Text: 'Women’s fiqh is a living field of interpretation, with opinions that sometimes differ between schools. AWA helps you understand the basics and structure your questions, but the opinion of a qualified scholar remains the reference for any personal religious decision.',
    shareMessage: 'Women’s fiqh, an introduction — AWA',
  },
  es: {
    badge: 'FIQH FEMENINO',
    title: 'El fiqh femenino,\nuna introducción',
    metaDuration: '7 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Una visión completa de los grandes temas abordados en el fiqh femenino, entre la práctica religiosa y la vida cotidiana.',
    disclaimerTitle: 'Información importante',
    disclaimerText: 'Este contenido es puramente educativo. Las preguntas religiosas deben ser validadas por eruditos cualificados. AWA no emite fatuas ni decisiones religiosas personalizadas.',
    contentsTitle: 'En este artículo',
    topics: [
      'Qué abarca el fiqh femenino',
      '¿Por qué es importante el fiqh femenino?',
      'Las escuelas jurídicas (madhab)',
      'Fiqh, salud y práctica cotidiana',
      'El papel educativo de AWA',
      '¿Cuándo pedir consejo a una persona cualificada?',
      'Para recordar',
    ],
    section1Body: 'El fiqh femenino es el campo de la jurisprudencia islámica (fiqh) que se ocupa de las cuestiones prácticas relacionadas con el cuerpo y el culto de las mujeres. Ayuda a comprender cómo conciliar la vida religiosa cotidiana con las distintas etapas del ciclo femenino.',
    dailyTopics: [
      'La menstruación y el ciclo menstrual',
      'La sangre menstrual y su estatus',
      'La pureza ritual',
      'El gusl después de la menstruación',
      'La oración durante y después de la menstruación',
      'El ayuno del Ramadán y los días por recuperar',
      'Los sangrados particulares (istihada)',
      'El nifas después del parto',
      'La vida cotidiana y la práctica religiosa',
    ],
    section1Body2: 'El fiqh es un campo de interpretación jurídica: algunas cuestiones son objeto de opiniones distintas según los eruditos y las escuelas de pensamiento, sin que ninguna opinión sea por sí sola absoluta.',
    section2Body: 'Comprender el fiqh femenino permite vivir la propia práctica religiosa con más serenidad, sin confusión, en los momentos en que el cuerpo atraviesa etapas específicas (menstruación, embarazo, posparto, menopausia). Esto también ayuda a distinguir lo que corresponde a una obligación, a una dispensa o a una simple recomendación.',
    visual1Title: 'Una práctica religiosa serena',
    visual1Text: 'Saber qué se espera en cada etapa del ciclo permite vivir la fe con más confianza.',
    section3Body: 'Un madhab designa una escuela de pensamiento jurídico, es decir, un método estructurado que los eruditos utilizan para interpretar las fuentes religiosas (Corán, Sunna, consenso, razonamiento) y responder a las cuestiones prácticas de la vida cotidiana. Existen varias escuelas porque los eruditos no siempre han seguido la misma metodología ni han interpretado los mismos textos de la misma manera.',
    section3Body2: 'Por eso, algunas cuestiones relacionadas con la menstruación, la pureza ritual, la oración o el ayuno pueden ser objeto de opiniones distintas según los eruditos consultados. Una divergencia de opinión no significa que una opinión sea «falsa»: refleja metodologías y lecturas diferentes de las mismas fuentes.',
    tip1Title: 'Bueno saberlo',
    tip1Text: 'Es habitual seguir el enfoque o el madhab que tradicionalmente se sigue en la propia familia o comunidad.',
    noteTitle: 'Para tener en cuenta',
    noteText: 'Cuando una situación religiosa concreta permanece incierta, es totalmente apropiado pedir la opinión de un erudito o una erudita cualificada.',
    section4Body: 'La información médica sobre el ciclo (duración, síntomas, fases hormonales) y las normas religiosas que de ella se derivan (pureza, oración, ayuno) responden a dos lógicas diferentes: una describe un fenómeno biológico, la otra define un marco de práctica espiritual. Ambas pueden complementarse, pero no deben confundirse.',
    visual2Title: 'Dos miradas complementarias',
    visual2Text: 'El seguimiento médico del ciclo y las referencias religiosas que de él se derivan aportan cada uno una perspectiva útil.',
    tip2Title: 'Bueno saberlo',
    tip2Text: 'Un profesional de la salud puede responder a las preguntas médicas; un erudito cualificado sigue siendo la referencia para las preguntas religiosas.',
    section5Body: 'AWA acompaña a las usuarias en la comprensión de su ciclo, en la intersección entre la salud y la práctica religiosa, con un enfoque pedagógico y respetuoso de las diferencias entre escuelas.',
    awaRole: [
      'Comprender las nociones básicas del fiqh femenino',
      'Entender mejor su ciclo, desde un punto de vista médico y religioso',
      'Identificar las preguntas que requieren la opinión de un erudito cualificado',
      'Orientarse entre las diferencias de madhahib sin confusión',
      'Acceder a explicaciones educativas claras y neutrales',
      'Distinguir una información médica de una decisión religiosa',
      'Seguir la información útil para su práctica religiosa, si lo necesita',
      'Preparar preguntas precisas para plantear a un erudito cualificado',
    ],
    alert3Title: 'Información importante',
    alert3Text: 'AWA es una herramienta educativa e informativa: no sustituye en ningún caso la opinión de un erudito o una autoridad religiosa cualificada.',
    section6Body: 'Algunas situaciones merecen plantearse directamente a un erudito o una erudita de confianza, en particular cuando:',
    whenToAsk: [
      'Una situación personal no corresponde a ningún caso clásico (sangrado inusual, duda prolongada...)',
      'Varias opiniones parecen contradecirse y no sabes cuál seguir',
      'Una decisión religiosa tiene un impacto importante en tu práctica cotidiana',
      'Sientes la necesidad de un acompañamiento adaptado a tu situación personal',
    ],
    tip3Title: 'Bueno saberlo',
    tip3Text: 'El fiqh femenino es un campo vivo de interpretación, con opiniones a veces distintas según las escuelas. AWA te ayuda a comprender las bases y a estructurar tus preguntas, pero la opinión de un erudito cualificado sigue siendo la referencia para cualquier decisión religiosa personal.',
    shareMessage: 'El fiqh femenino, una introducción — AWA',
  },
  it: {
    badge: 'FIQH DELLE DONNE',
    title: 'Il fiqh delle donne:\nun’introduzione',
    metaDuration: '7 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Una panoramica completa dei principali temi trattati dal fiqh delle donne, tra pratica religiosa e vita quotidiana.',
    disclaimerTitle: 'Informazione importante',
    disclaimerText: 'Questo contenuto ha uno scopo puramente educativo. Le questioni religiose dovrebbero essere validate da studiosi qualificati. AWA non emette fatwa né pareri religiosi personalizzati.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Di cosa si occupa il fiqh delle donne',
      'Perché il fiqh delle donne è importante?',
      'Le scuole giuridiche (madhab)',
      'Fiqh, salute e pratica quotidiana',
      'Il ruolo educativo di AWA',
      'Quando chiedere consiglio a una persona qualificata?',
      'Punti chiave',
    ],
    section1Body: 'Il fiqh delle donne è l’ambito della giurisprudenza islamica (fiqh) che riguarda le questioni pratiche legate al corpo delle donne e al culto. Aiuta a capire come conciliare la vita religiosa quotidiana con le diverse fasi del ciclo femminile.',
    dailyTopics: [
      'Le mestruazioni e il ciclo mestruale',
      'Il sangue mestruale e il suo stato',
      'La purezza rituale',
      'Il ghusl dopo le mestruazioni',
      'La preghiera durante e dopo le mestruazioni',
      'Il digiuno del Ramadan e i giorni da recuperare',
      'Le perdite irregolari (istihâda)',
      'Il Nifas dopo il parto',
      'La vita quotidiana e la pratica religiosa',
    ],
    section1Body2: 'Il fiqh è un campo di interpretazione giuridica: alcune questioni sono oggetto di pareri diversi a seconda degli studiosi e delle scuole di pensiero, senza che un singolo parere sia assoluto di per sé.',
    section2Body: 'Comprendere il fiqh delle donne permette di vivere la propria pratica religiosa con più serenità, senza confusione, nei momenti in cui il corpo attraversa fasi specifiche (mestruazioni, gravidanza, post-partum, menopausa). Aiuta anche a distinguere ciò che rientra in un obbligo, in un’esenzione o in una semplice raccomandazione.',
    visual1Title: 'Una pratica religiosa più serena',
    visual1Text: 'Sapere cosa ci si aspetta in ogni fase del ciclo permette di affrontare la propria fede con maggiore fiducia.',
    section3Body: 'Un madhab indica una scuola di pensiero giuridico, cioè un metodo strutturato che gli studiosi usano per interpretare le fonti religiose (Corano, Sunna, consenso, ragionamento) e rispondere a questioni pratiche della vita quotidiana. Esistono diverse scuole, perché gli studiosi non hanno sempre seguito la stessa metodologia né interpretato gli stessi testi nello stesso modo.',
    section3Body2: 'Per questo alcune questioni legate alle mestruazioni, alla purezza rituale, alla preghiera o al digiuno possono essere oggetto di pareri diversi a seconda degli studiosi consultati. Una differenza di opinione non significa che un parere sia “sbagliato”: riflette metodologie e letture diverse delle stesse fonti.',
    tip1Title: 'Da sapere',
    tip1Text: 'È comune seguire l’approccio o il madhab tradizionalmente seguito nella propria famiglia o comunità.',
    noteTitle: 'Nota bene',
    noteText: 'Quando una situazione religiosa specifica resta incerta, è del tutto appropriato chiedere il parere di uno studioso qualificato.',
    section4Body: 'Le informazioni mediche sul ciclo (durata, sintomi, fasi ormonali) e le regole religiose che ne derivano (purezza, preghiera, digiuno) rispondono a due logiche diverse: una descrive un fenomeno biologico, l’altra definisce un quadro per la pratica spirituale. Le due possono completarsi, ma non vanno confuse.',
    visual2Title: 'Due prospettive complementari',
    visual2Text: 'Il monitoraggio medico del ciclo e i riferimenti religiosi che ne derivano offrono ciascuno una chiave di lettura utile.',
    tip2Title: 'Da sapere',
    tip2Text: 'Un professionista sanitario può rispondere alle domande mediche; uno studioso qualificato resta il riferimento per le questioni religiose.',
    section5Body: 'AWA accompagna le utenti nella comprensione del proprio ciclo, all’incrocio tra salute e pratica religiosa, con un approccio educativo che rispetta le differenze tra le scuole.',
    awaRole: [
      'Comprendere i concetti di base del fiqh delle donne',
      'Capire meglio il proprio ciclo, sia dal punto di vista medico sia da quello religioso',
      'Individuare le domande che richiedono il parere di uno studioso qualificato',
      'Orientarsi tra le differenze tra i madhahib senza confusione',
      'Accedere a spiegazioni educative chiare e neutrali',
      'Distinguere l’informazione medica da una decisione religiosa',
      'Seguire le informazioni utili alla propria pratica religiosa, se necessario',
      'Preparare domande specifiche da porre a uno studioso qualificato',
    ],
    alert3Title: 'Informazione importante',
    alert3Text: 'AWA è uno strumento educativo e informativo: non sostituisce, in nessun caso, il parere di uno studioso qualificato o di un’autorità religiosa.',
    section6Body: 'Alcune situazioni meritano di essere sottoposte direttamente a uno studioso di fiducia, in particolare quando:',
    whenToAsk: [
      'Una situazione personale non corrisponde a nessun caso tipico (perdite insolite, dubbio prolungato...)',
      'Diversi pareri sembrano contraddirsi e non sai quale seguire',
      'Una decisione religiosa ha un impatto significativo sulla tua pratica quotidiana',
      'Senti il bisogno di una guida adatta alla tua situazione personale',
    ],
    tip3Title: 'Da sapere',
    tip3Text: 'Il fiqh delle donne è un campo di interpretazione vivo, con pareri che a volte differiscono tra le scuole. AWA ti aiuta a comprendere le basi e a strutturare le tue domande, ma il parere di uno studioso qualificato resta il riferimento per qualsiasi decisione religiosa personale.',
    shareMessage: 'Il fiqh delle donne, un’introduzione — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function FiqhWomenIntroArticleScreen({
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
            {content.section1Body}
          </Text>

          <View style={styles.daily}>
            {TOPIC_ICONS.map((icon, index) => (
              <View key={icon} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={icon as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <Text style={styles.dailyText}>{content.dailyTopics[index]}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.body}>
            {content.section1Body2}
          </Text>

          <Text style={styles.h2}>
            2. {content.topics[1]}
          </Text>

          <Text style={styles.body}>
            {content.section2Body}
          </Text>

          <View style={styles.visualCard}>
            <Image
              source={resolveEditorialImage(ART.importance, lang)}
              resizeMode="cover"
              style={styles.visualImage}
            />

            <View style={styles.visualCopy}>
              <Text style={styles.visualTitle}>
                {content.visual1Title}
              </Text>

              <Text style={styles.visualText}>
                {content.visual1Text}
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>3. {content.topics[2]}</Text>

          <Text style={styles.body}>
            {content.section3Body}
          </Text>

          <Image
            source={ART.madhahib}
            resizeMode="cover"
            style={styles.wideImage}
          />

          <Text style={styles.body}>
            {content.section3Body2}
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

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.noteTitle}</Text>
              <Text style={styles.tipText}>
                {content.noteText}
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>
            4. {content.topics[3]}
          </Text>

          <Text style={styles.body}>
            {content.section4Body}
          </Text>

          <View style={styles.visualCard}>
            <Image
              source={ART.consult}
              resizeMode="cover"
              style={styles.visualImage}
            />

            <View style={styles.visualCopy}>
              <Text style={styles.visualTitle}>
                {content.visual2Title}
              </Text>

              <Text style={styles.visualText}>
                {content.visual2Text}
              </Text>
            </View>
          </View>

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

          <Text style={styles.h2}>5. {content.topics[4]}</Text>

          <Text style={styles.body}>
            {content.section5Body}
          </Text>

          <Image
            source={ART.awaRole}
            resizeMode="cover"
            style={styles.wideImage}
          />

          <View style={styles.checkList}>
            {content.awaRole.map(item => (
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

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-circle-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.alert3Title}</Text>
              <Text style={styles.tipText}>
                {content.alert3Text}
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>
            6. {content.topics[5]}
          </Text>

          <Text style={styles.body}>
            {content.section6Body}
          </Text>

          <View style={styles.checkList}>
            {content.whenToAsk.map(item => (
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

          <Text style={styles.h2}>7. {content.topics[6]}</Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.tip3Title}</Text>
              <Text style={styles.tipText}>
                {content.tip3Text}
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
  visualCard: {
    marginTop: 15,
    minHeight: 98,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  visualImage: {width: 72, height: 72, borderRadius: 12},
  visualCopy: {flex: 1, marginLeft: 12},
  visualTitle: {color: theme.colors.text, fontSize: 13, lineHeight: 17, fontWeight: '800'},
  visualText: {marginTop: 4, color: theme.colors.textMuted, fontSize: 11, lineHeight: 16},
  wideImage: {width: '100%', height: 120, marginTop: 14, borderRadius: 12},
  daily: {marginTop: 13, flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  dailyItem: {
    width: '48.7%',
    minHeight: 108,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceSecondary,
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
