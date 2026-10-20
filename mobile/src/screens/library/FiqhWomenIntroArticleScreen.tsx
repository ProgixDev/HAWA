import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  Image,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import ReadingControls from '../../components/articles/ReadingControls';
import {AwaCard} from '../../components/ui/AwaCard';
import {AwaIconButton} from '../../components/ui/AwaIconButton';
import {AwaText} from '../../components/ui/AwaText';
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
  tr: {
    badge: 'KADIN FIKHI',
    title: 'Kadın fıkhı:\nbir giriş',
    metaDuration: '7 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Kadın fıkhında ele alınan başlıca konulara, dinî yaşam ile gündelik hayat arasında kapsamlı bir bakış.',
    disclaimerTitle: 'Önemli bilgi',
    disclaimerText: 'Bu içerik tamamen eğitim amaçlıdır. Dinî sorular yetkin âlimlere danışılarak doğrulanmalıdır. AWA fetva ya da kişiye özel dinî hüküm vermez.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Kadın fıkhı neleri kapsar',
      'Kadın fıkhı neden önemlidir?',
      'Fıkıh ekolleri (mezhep)',
      'Fıkıh, sağlık ve gündelik uygulama',
      'AWA’nın eğitici rolü',
      'Yetkin bir kişiye ne zaman danışmalı?',
      'Akılda tutulacaklar',
    ],
    section1Body: 'Kadın fıkhı, İslam hukukunun (fıkıh) kadın bedenine ve ibadete ilişkin pratik soruları ele alan alanıdır. Gündelik dinî yaşamı kadın döngüsünün farklı evreleriyle bağdaştırmayı anlamaya yardımcı olur.',
    dailyTopics: [
      'Adet ve adet döngüsü',
      'Adet kanı ve hükmü',
      'Ritüel temizlik',
      'Adet sonrası gusül',
      'Adet sırasında ve sonrasında namaz',
      'Ramazan orucu ve kaza edilecek günler',
      'Düzensiz kanama (istihaze)',
      'Doğum sonrası nifas',
      'Gündelik hayat ve dinî yaşam',
    ],
    section1Body2: 'Fıkıh bir yorum alanıdır: bazı konularda âlimlere ve mezheplere göre farklı görüşler vardır; hiçbir görüş tek başına mutlak değildir.',
    section2Body: 'Kadın fıkhını anlamak, beden belirli evrelerden geçerken (adet, gebelik, doğum sonrası, menopoz) dinî yaşamı daha huzurlu ve kafa karışıklığı olmadan sürdürmeyi mümkün kılar. Aynı zamanda neyin bir yükümlülük, neyin bir muafiyet, neyin de sadece bir tavsiye olduğunu ayırt etmeye yardımcı olur.',
    visual1Title: 'Daha huzurlu bir dinî yaşam',
    visual1Text: 'Döngünün her evresinde ne beklendiğini bilmek, inancına daha güvenle yaklaşmanı sağlar.',
    section3Body: 'Mezhep, bir hukuk düşüncesi ekolünü, yani âlimlerin dinî kaynakları (Kur’an, Sünnet, icma, akıl yürütme) yorumlamak ve gündelik hayata dair pratik soruları yanıtlamak için kullandığı yapılandırılmış bir yöntemi ifade eder. Birden fazla ekol vardır, çünkü âlimler her zaman aynı yöntemi izlememiş ve aynı metinleri aynı şekilde yorumlamamıştır.',
    section3Body2: 'Bu nedenle adet, ritüel temizlik, namaz ya da oruçla ilgili bazı konularda, danışılan âlimlere göre farklı görüşler olabilir. Görüş ayrılığı, bir görüşün “yanlış” olduğu anlamına gelmez: aynı kaynakların farklı yöntemlerle ve farklı okumalarla ele alındığını yansıtır.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Ailenin ya da çevrenin geleneksel olarak izlediği yaklaşımı veya mezhebi takip etmek yaygındır.',
    noteTitle: 'Dikkat',
    noteText: 'Belirli bir dinî durum belirsiz kaldığında, yetkin bir âlimin görüşüne başvurmak son derece yerindedir.',
    section4Body: 'Döngüyle ilgili tıbbi bilgiler (süre, belirtiler, hormonal evreler) ile bunlardan doğan dinî kurallar (temizlik, namaz, oruç) iki farklı mantığa dayanır: biri biyolojik bir olguyu tanımlar, diğeri ruhsal uygulama için bir çerçeve belirler. İkisi birbirini tamamlayabilir ama birbirine karıştırılmamalıdır.',
    visual2Title: 'Birbirini tamamlayan iki bakış',
    visual2Text: 'Döngünün tıbbi takibi ve ondan doğan dinî ölçütlerin her biri faydalı bir bakış sunar.',
    tip2Title: 'Bilmekte fayda var',
    tip2Text: 'Tıbbi sorulara bir sağlık uzmanı yanıt verebilir; dinî sorularda ise başvurulacak kaynak yetkin bir âlimdir.',
    section5Body: 'AWA, kullanıcıların döngülerini sağlık ile dinî yaşamın kesiştiği noktada anlamalarına, mezhepler arasındaki farklılıklara saygı gösteren eğitici bir yaklaşımla destek olur.',
    awaRole: [
      'Kadın fıkhının temel kavramlarını anlamak',
      'Döngünü hem tıbbi hem dinî açıdan daha iyi anlamak',
      'Yetkin bir âlimin görüşünü gerektiren soruları belirlemek',
      'Mezhepler arasındaki farklılıklar arasında kafan karışmadan yolunu bulmak',
      'Açık ve tarafsız eğitici açıklamalara ulaşmak',
      'Tıbbi bilgiyi dinî bir karardan ayırt etmek',
      'Gerekirse dinî yaşamın için faydalı bilgileri takip etmek',
      'Yetkin bir âlime sorulacak özel soruları hazırlamak',
    ],
    alert3Title: 'Önemli bilgi',
    alert3Text: 'AWA eğitici ve bilgilendirici bir araçtır: hiçbir koşulda yetkin bir âlimin ya da dinî otoritenin görüşünün yerini almaz.',
    section6Body: 'Bazı durumlar, özellikle şu hâllerde, güvendiğin bir âlimle doğrudan konuşulmayı hak eder:',
    whenToAsk: [
      'Kişisel durumun hiçbir tipik duruma uymuyorsa (olağan dışı kanama, uzayan tereddüt...)',
      'Birkaç görüş birbiriyle çelişiyor gibi görünüyor ve hangisini izleyeceğini bilmiyorsan',
      'Dinî bir karar gündelik uygulamanı önemli ölçüde etkiliyorsa',
      'Kişisel durumuna uygun bir rehberliğe ihtiyaç duyuyorsan',
    ],
    tip3Title: 'Bilmekte fayda var',
    tip3Text: 'Kadın fıkhı, mezhepler arasında zaman zaman farklılık gösteren görüşlerin bulunduğu yaşayan bir yorum alanıdır. AWA temelleri anlamana ve sorularını düzenlemene yardımcı olur, ancak kişisel her dinî karar için başvurulacak kaynak yetkin bir âlimin görüşüdür.',
    shareMessage: 'Kadın fıkhı, bir giriş — AWA',
  },
  ru: {
    badge: 'ЖЕНСКИЙ ФИКХ',
    title: 'Женский фикх:\nвведение',
    metaDuration: '7 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'Общий обзор основных тем женского фикха — на стыке религиозной практики и повседневной жизни.',
    disclaimerTitle: 'Важная информация',
    disclaimerText: 'Этот материал носит исключительно образовательный характер. Религиозные вопросы следует уточнять у компетентных учёных. AWA не выносит фетв и не даёт индивидуальных религиозных заключений.',
    contentsTitle: 'В этой статье',
    topics: [
      'Что охватывает женский фикх',
      'Почему женский фикх важен?',
      'Правовые школы (мазхабы)',
      'Фикх, здоровье и повседневная практика',
      'Образовательная роль AWA',
      'Когда стоит обратиться за советом к компетентному человеку?',
      'Главное',
    ],
    section1Body: 'Женский фикх — это область исламского права (фикха), которая занимается практическими вопросами, связанными с телом женщины и её богослужением. Он помогает понять, как сочетать повседневную религиозную жизнь с разными этапами женского цикла.',
    dailyTopics: [
      'Менструация и менструальный цикл',
      'Менструальная кровь и её статус',
      'Ритуальная чистота',
      'Гусль после менструации',
      'Намаз во время менструации и после неё',
      'Пост в Рамадан и дни, которые нужно восполнить',
      'Нерегулярные кровотечения (истихада)',
      'Нифас после родов',
      'Повседневная жизнь и религиозная практика',
    ],
    section1Body2: 'Фикх — это область правового толкования: по некоторым вопросам существуют различные мнения в зависимости от учёных и школ, и ни одно из них само по себе не является абсолютным.',
    section2Body: 'Понимание женского фикха позволяет с большим спокойствием и без путаницы соблюдать религиозную практику в те периоды, когда тело проходит особые этапы (менструация, беременность, послеродовой период, менопауза). Оно также помогает различать, что относится к обязанности, к освобождению от неё или к простой рекомендации.',
    visual1Title: 'Более спокойная религиозная практика',
    visual1Text: 'Когда вы знаете, что ожидается на каждом этапе цикла, проще относиться к своей вере с большей уверенностью.',
    section3Body: 'Мазхаб — это школа правового мышления, то есть выстроенный метод, с помощью которого учёные толкуют религиозные источники (Коран, Сунна, консенсус, рассуждение) и отвечают на практические вопросы повседневной жизни. Существует несколько школ, потому что учёные не всегда следовали одной и той же методологии и не всегда одинаково толковали одни и те же тексты.',
    section3Body2: 'Поэтому по некоторым вопросам, связанным с менструацией, ритуальной чистотой, намазом или постом, мнения могут различаться в зависимости от учёных, к которым обращаются. Различие во мнениях не означает, что одно из них «неверно»: оно отражает разные методологии и прочтения одних и тех же источников.',
    tip1Title: 'Полезно знать',
    tip1Text: 'Часто придерживаются подхода или мазхаба, которому традиционно следуют в семье или общине.',
    noteTitle: 'Обратите внимание',
    noteText: 'Если конкретная религиозная ситуация остаётся неясной, вполне уместно обратиться за мнением к компетентному учёному.',
    section4Body: 'Медицинская информация о цикле (продолжительность, симптомы, гормональные фазы) и вытекающие из неё религиозные нормы (чистота, намаз, пост) подчиняются двум разным логикам: одна описывает биологическое явление, другая задаёт рамки духовной практики. Они могут дополнять друг друга, но их нельзя смешивать.',
    visual2Title: 'Два взаимодополняющих взгляда',
    visual2Text: 'Медицинское отслеживание цикла и вытекающие из него религиозные ориентиры каждый по-своему дают полезное понимание.',
    tip2Title: 'Полезно знать',
    tip2Text: 'На медицинские вопросы может ответить медицинский специалист; по религиозным вопросам ориентиром остаётся компетентный учёный.',
    section5Body: 'AWA помогает пользовательницам разобраться в своём цикле на стыке здоровья и религиозной практики, придерживаясь образовательного подхода, который уважает различия между школами.',
    awaRole: [
      'Понять базовые понятия женского фикха',
      'Лучше понимать свой цикл — как с медицинской, так и с религиозной точки зрения',
      'Определять вопросы, для которых нужно мнение компетентного учёного',
      'Ориентироваться в различиях между мазхабами без путаницы',
      'Получать ясные и нейтральные образовательные объяснения',
      'Отличать медицинскую информацию от религиозного решения',
      'При необходимости отслеживать сведения, полезные для религиозной практики',
      'Готовить конкретные вопросы для компетентного учёного',
    ],
    alert3Title: 'Важная информация',
    alert3Text: 'AWA — это образовательный и информационный инструмент: он ни при каких обстоятельствах не заменяет мнение компетентного учёного или религиозного авторитета.',
    section6Body: 'Некоторые ситуации стоит обсуждать напрямую с учёным, которому вы доверяете, в частности когда:',
    whenToAsk: [
      'Ваша личная ситуация не подходит ни под один типичный случай (необычное кровотечение, затянувшиеся сомнения...)',
      'Несколько мнений кажутся противоречащими друг другу, и вы не знаете, какому следовать',
      'Религиозное решение существенно влияет на вашу повседневную практику',
      'Вы чувствуете потребность в наставлении, соответствующем вашей личной ситуации',
    ],
    tip3Title: 'Полезно знать',
    tip3Text: 'Женский фикх — это живая область толкования, в которой мнения порой различаются между школами. AWA помогает понять основы и сформулировать вопросы, но мнение компетентного учёного остаётся ориентиром для любого личного религиозного решения.',
    shareMessage: 'Женский фикх: введение — AWA',
  },
  de: {
    badge: 'FIQH DER FRAU',
    title: 'Fiqh der Frau:\neine Einführung',
    metaDuration: '7 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Ein umfassender Überblick über die wichtigsten Themen des Fiqh der Frau – zwischen religiöser Praxis und Alltag.',
    disclaimerTitle: 'Wichtiger Hinweis',
    disclaimerText: 'Dieser Inhalt ist rein bildend. Religiöse Fragen sollten von qualifizierten Gelehrten geklärt werden. AWA erlässt keine Fatwas und keine persönlichen religiösen Urteile.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Was der Fiqh der Frau umfasst',
      'Warum ist der Fiqh der Frau wichtig?',
      'Rechtsschulen (Madhhab)',
      'Fiqh, Gesundheit und Alltagspraxis',
      'Die Bildungsrolle von AWA',
      'Wann solltest du eine qualifizierte Person um Rat fragen?',
      'Das Wichtigste in Kürze',
    ],
    section1Body: 'Der Fiqh der Frau ist der Bereich des islamischen Rechts (Fiqh), der sich mit praktischen Fragen zum Körper der Frau und zur Gottesdienstpraxis befasst. Er hilft zu verstehen, wie sich das religiöse Alltagsleben mit den verschiedenen Phasen des weiblichen Zyklus vereinbaren lässt.',
    dailyTopics: [
      'Menstruation und Menstruationszyklus',
      'Menstruationsblut und sein Status',
      'Rituelle Reinheit',
      'Ghusl nach der Menstruation',
      'Gebet während und nach der Menstruation',
      'Das Ramadan-Fasten und nachzuholende Tage',
      'Unregelmäßige Blutungen (Istihada)',
      'Nifas nach der Geburt',
      'Alltag und religiöse Praxis',
    ],
    section1Body2: 'Der Fiqh ist ein Bereich der rechtlichen Auslegung: Zu manchen Fragen gibt es je nach Gelehrten und Rechtsschulen unterschiedliche Meinungen, ohne dass eine einzelne Meinung für sich genommen absolut wäre.',
    section2Body: 'Wer den Fiqh der Frau versteht, kann seine religiöse Praxis gelassener und ohne Verunsicherung leben – gerade in Zeiten, in denen der Körper besondere Phasen durchläuft (Menstruation, Schwangerschaft, Wochenbett, Wechseljahre). Er hilft auch dabei, zu unterscheiden, was eine Pflicht, eine Befreiung oder eine bloße Empfehlung ist.',
    visual1Title: 'Eine gelassenere religiöse Praxis',
    visual1Text: 'Wenn du weißt, was in jeder Phase des Zyklus erwartet wird, kannst du deinen Glauben mit mehr Zuversicht leben.',
    section3Body: 'Ein Madhhab bezeichnet eine Rechtsschule, also eine strukturierte Methode, mit der Gelehrte die religiösen Quellen (Koran, Sunna, Konsens, Analogieschluss) auslegen und praktische Alltagsfragen beantworten. Es gibt mehrere Schulen, weil Gelehrte nicht immer derselben Methodik gefolgt sind oder dieselben Texte nicht immer gleich ausgelegt haben.',
    section3Body2: 'Deshalb können manche Fragen zu Menstruation, ritueller Reinheit, Gebet oder Fasten je nach befragten Gelehrten unterschiedlich beantwortet werden. Eine abweichende Meinung bedeutet nicht, dass eine Meinung „falsch“ wäre: Sie spiegelt unterschiedliche Methoden und Lesarten derselben Quellen wider.',
    tip1Title: 'Gut zu wissen',
    tip1Text: 'Es ist üblich, dem Ansatz oder Madhhab zu folgen, dem die eigene Familie oder Gemeinschaft traditionell folgt.',
    noteTitle: 'Bitte beachten',
    noteText: 'Wenn eine konkrete religiöse Situation unklar bleibt, ist es völlig angemessen, eine qualifizierte Gelehrte oder einen qualifizierten Gelehrten um Rat zu fragen.',
    section4Body: 'Medizinische Informationen zum Zyklus (Dauer, Symptome, hormonelle Phasen) und die daraus folgenden religiösen Regeln (Reinheit, Gebet, Fasten) folgen zwei unterschiedlichen Logiken: Die eine beschreibt ein biologisches Phänomen, die andere legt einen Rahmen für die spirituelle Praxis fest. Beide können sich ergänzen, dürfen aber nicht verwechselt werden.',
    visual2Title: 'Zwei sich ergänzende Perspektiven',
    visual2Text: 'Die medizinische Zyklusbeobachtung und die daraus folgenden religiösen Kriterien liefern jeweils nützliche Einblicke.',
    tip2Title: 'Gut zu wissen',
    tip2Text: 'Medizinische Fragen kann medizinisches Fachpersonal beantworten; für religiöse Fragen bleibt eine qualifizierte Gelehrte oder ein qualifizierter Gelehrter die maßgebliche Stelle.',
    section5Body: 'AWA unterstützt dich dabei, deinen Zyklus an der Schnittstelle von Gesundheit und religiöser Praxis zu verstehen – mit einem bildenden Ansatz, der die Unterschiede zwischen den Rechtsschulen respektiert.',
    awaRole: [
      'Die Grundbegriffe des Fiqh der Frau verstehen',
      'Den eigenen Zyklus aus medizinischer und religiöser Sicht besser verstehen',
      'Fragen erkennen, die die Meinung einer qualifizierten Gelehrten oder eines qualifizierten Gelehrten erfordern',
      'Sich ohne Verwirrung zwischen den Unterschieden der Madhahib orientieren',
      'Klare und neutrale Erklärungen zur Bildung nutzen',
      'Medizinische Informationen von einer religiösen Entscheidung unterscheiden',
      'Bei Bedarf Informationen verfolgen, die für die eigene religiöse Praxis nützlich sind',
      'Konkrete Fragen für eine Gelehrte oder einen Gelehrten vorbereiten',
    ],
    alert3Title: 'Wichtiger Hinweis',
    alert3Text: 'AWA ist ein Bildungs- und Informationswerkzeug: Es ersetzt in keinem Fall die Meinung einer qualifizierten Gelehrten, eines qualifizierten Gelehrten oder einer religiösen Autorität.',
    section6Body: 'Manche Situationen solltest du direkt mit einer vertrauenswürdigen Gelehrten oder einem vertrauenswürdigen Gelehrten besprechen, insbesondere wenn:',
    whenToAsk: [
      'Eine persönliche Situation zu keinem typischen Fall passt (ungewöhnliche Blutungen, lang anhaltender Zweifel …)',
      'Mehrere Meinungen einander zu widersprechen scheinen und du nicht weißt, welcher du folgen sollst',
      'Eine religiöse Entscheidung deine tägliche Praxis erheblich beeinflusst',
      'Du das Bedürfnis nach einer Begleitung hast, die zu deiner persönlichen Situation passt',
    ],
    tip3Title: 'Gut zu wissen',
    tip3Text: 'Der Fiqh der Frau ist ein lebendiger Auslegungsbereich, in dem die Meinungen zwischen den Schulen mitunter voneinander abweichen. AWA hilft dir, die Grundlagen zu verstehen und deine Fragen zu ordnen, aber die Meinung einer qualifizierten Gelehrten oder eines qualifizierten Gelehrten bleibt maßgeblich für jede persönliche religiöse Entscheidung.',
    shareMessage: 'Fiqh der Frau, eine Einführung – AWA',
  },
  zh: {
      badge: '女性教法学',
      title: '女性教法学：\n入门介绍',
      metaDuration: '阅读约 7 分钟',
      metaType: '指南',
      metaLevel: '入门',
      metaValidated: '已审阅内容',
      intro: '对女性教法学所涵盖的主要议题做一个全面的概览，连接宗教实践与日常生活。',
      disclaimerTitle: '重要提示',
      disclaimerText: '本内容纯属教育性质。宗教问题应由合格的学者来确认。AWA 不发布法特瓦，也不提供个性化的宗教裁决。',
      contentsTitle: '本文内容',
      topics: [
        '女性教法学涵盖什么',
        '女性教法学为什么重要？',
        '教法学派（Madhab）',
        '教法学、健康与日常实践',
        'AWA 的教育角色',
        '何时向合格人士请教？',
        '要点回顾',
      ],
      section1Body: '女性教法学是伊斯兰教法学（fiqh）中关注与女性身体和礼拜相关的实际问题的领域。它帮助人们理解如何让日常的宗教生活与女性周期的不同阶段相协调。',
      dailyTopics: [
        '月经与月经周期',
        '经血及其判定',
        '仪式性洁净',
        '月经后的大净（Ghusl）',
        '月经期间及之后的礼拜',
        '斋月斋戒与需要补的天数',
        '不规则出血（伊斯提哈达，Istihada）',
        '分娩后的产后恶露期（Nifas）',
        '日常生活与宗教实践',
      ],
      section1Body2: '教法学是一个需要法理阐释的领域：有些问题会因学者和学派的不同而存在不同的观点，没有哪一种观点本身是绝对的。',
      section2Body: '了解女性教法学，可以让人在身体经历特定阶段（月经、怀孕、产后、绝经）时，更加安心地进行宗教实践，不再困惑。它也有助于分清哪些属于义务，哪些属于豁免，哪些只是建议。',
      visual1Title: '更平和的宗教实践',
      visual1Text: '了解周期各个阶段的要求，可以让人更有信心地面对自己的信仰。',
      section3Body: 'Madhab 指的是一个教法思想学派，即学者们用来解读宗教渊源（《古兰经》、圣训、公议、推理）并回答日常生活中实际问题的一套有条理的方法。之所以存在多个学派，是因为学者们并不总是采用相同的方法论，也不总是以相同的方式解读同样的经文。',
      section3Body2: '因此，一些与月经、仪式性洁净、礼拜或斋戒相关的问题，可能会因所请教的学者不同而有不同的观点。观点不同并不意味着某一种观点“错了”：这反映的是对同一渊源的不同方法论和不同解读。',
      tip1Title: '小贴士',
      tip1Text: '许多人遵循自己家庭或社群中传统上所遵循的学派或方法。',
      noteTitle: '请注意',
      noteText: '当某个具体的宗教情形仍不确定时，向合格的学者请教是完全恰当的。',
      section4Body: '关于周期的医学信息（时长、症状、激素阶段）与由此引出的宗教规则（洁净、礼拜、斋戒），遵循的是两种不同的逻辑：一个描述生理现象，另一个界定精神实践的框架。两者可以互为补充，但不应混为一谈。',
      visual2Title: '两种互补的视角',
      visual2Text: '周期的医学记录与由此而来的宗教标志，各自都能提供有用的参考。',
      tip2Title: '小贴士',
      tip2Text: '医疗专业人员可以回答医学问题；合格的学者仍然是宗教问题的依据。',
      section5Body: 'AWA 以尊重各学派差异的教育方式，帮助用户在健康与宗教实践的交汇处了解自己的周期。',
      awaRole: [
        '了解女性教法学的基本概念',
        '从医学和宗教两个角度更好地了解自己的周期',
        '找出需要请合格学者给出意见的问题',
        '在不同学派的差异之间不再困惑',
        '获取清晰、中立的教育性说明',
        '区分医学信息与宗教决定',
        '如有需要，记录对自己宗教实践有用的信息',
        '准备要向合格学者请教的具体问题',
      ],
      alert3Title: '重要提示',
      alert3Text: 'AWA 是教育和信息工具：在任何情况下，都不能替代合格学者或宗教权威的意见。',
      section6Body: '有些情形值得直接向你信任的学者请教，尤其是在以下情况下：',
      whenToAsk: [
        '个人情况与任何典型情形都不相符（异常出血、长时间的疑虑等）',
        '几种观点似乎相互矛盾，你不知道该遵循哪一种',
        '某个宗教决定会对你的日常实践产生重大影响',
        '你觉得需要针对自己的具体情况得到指导',
      ],
      tip3Title: '小贴士',
      tip3Text: '女性教法学是一个不断被阐释的领域，不同学派之间的观点有时并不相同。AWA 帮助你了解基础知识并梳理自己的问题，但对于任何个人的宗教决定，合格学者的意见仍然是依据。',
      shareMessage: '女性教法学入门介绍 — AWA',
    },
  id: {
    badge: 'FIKIH PEREMPUAN',
    title: 'Fikih perempuan:\nsebuah pengantar',
    metaDuration: '7 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Gambaran menyeluruh tentang topik-topik utama dalam fikih perempuan, antara ibadah dan kehidupan sehari-hari.',
    disclaimerTitle: 'Informasi penting',
    disclaimerText: 'Konten ini murni bersifat edukatif. Pertanyaan keagamaan sebaiknya dipastikan kepada ulama yang berkompeten. AWA tidak mengeluarkan fatwa maupun hukum agama yang dipersonalisasi.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Cakupan fikih perempuan',
      'Mengapa fikih perempuan penting?',
      'Mazhab fikih (madhab)',
      'Fikih, kesehatan, dan praktik sehari-hari',
      'Peran edukatif AWA',
      'Kapan perlu meminta saran dari orang yang berkompeten?',
      'Poin penting',
    ],
    section1Body: 'Fikih perempuan adalah cabang ilmu fikih (hukum Islam) yang membahas persoalan praktis terkait tubuh perempuan dan ibadah. Ilmu ini membantu memahami cara menyelaraskan kehidupan beragama sehari-hari dengan berbagai tahap dalam siklus perempuan.',
    dailyTopics: [
      'Menstruasi dan siklus menstruasi',
      'Darah haid dan statusnya',
      'Kesucian ritual',
      'Mandi wajib (ghusl) setelah haid',
      'Salat selama dan setelah haid',
      'Puasa Ramadan dan hari-hari yang harus diganti',
      'Perdarahan tidak teratur (istihadah)',
      'Nifas setelah melahirkan',
      'Kehidupan sehari-hari dan praktik ibadah',
    ],
    section1Body2: 'Fikih adalah bidang penafsiran hukum: sebagian persoalan memiliki pendapat yang berbeda menurut ulama dan mazhab, tanpa ada satu pendapat pun yang mutlak dengan sendirinya.',
    section2Body: 'Memahami fikih perempuan memungkinkan kamu menjalani ibadah dengan lebih tenang, tanpa kebingungan, pada saat tubuh melewati tahap-tahap tertentu (menstruasi, kehamilan, pascapersalinan, menopause). Ini juga membantu membedakan mana yang termasuk kewajiban, keringanan, atau sekadar anjuran.',
    visual1Title: 'Ibadah yang lebih tenteram',
    visual1Text: 'Mengetahui apa yang diharapkan pada setiap tahap siklus membuat kamu bisa menjalani keimanan dengan lebih percaya diri.',
    section3Body: 'Mazhab adalah aliran pemikiran hukum, yaitu metode terstruktur yang digunakan para ulama untuk menafsirkan sumber-sumber agama (Al-Qur\'an, Sunnah, ijmak, penalaran) dan menjawab persoalan praktis sehari-hari. Ada beberapa mazhab, karena para ulama tidak selalu menggunakan metodologi yang sama atau menafsirkan teks yang sama dengan cara yang sama.',
    section3Body2: 'Itulah sebabnya sebagian persoalan terkait menstruasi, kesucian ritual, salat, atau puasa bisa memiliki pendapat yang berbeda tergantung ulama yang dirujuk. Perbedaan pendapat tidak berarti satu pendapat “salah”: perbedaan itu mencerminkan metodologi dan cara membaca yang berbeda terhadap sumber yang sama.',
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Umumnya orang mengikuti pendekatan atau mazhab yang secara turun-temurun dianut keluarga atau komunitasnya.',
    noteTitle: 'Harap diperhatikan',
    noteText: 'Jika suatu situasi keagamaan tertentu masih belum jelas, sangat wajar untuk meminta pendapat ulama yang berkompeten.',
    section4Body: 'Informasi medis tentang siklus (durasi, gejala, fase hormonal) dan aturan agama yang mengikutinya (kesucian, salat, puasa) berangkat dari dua logika yang berbeda: yang satu menggambarkan fenomena biologis, yang lain menetapkan kerangka untuk ibadah. Keduanya bisa saling melengkapi, tetapi tidak boleh dicampuradukkan.',
    visual2Title: 'Dua sudut pandang yang saling melengkapi',
    visual2Text: 'Pemantauan siklus secara medis dan penanda keagamaan yang mengikutinya masing-masing memberikan wawasan yang berguna.',
    tip2Title: 'Perlu diketahui',
    tip2Text: 'Tenaga kesehatan dapat menjawab pertanyaan medis; ulama yang berkompeten tetap menjadi rujukan untuk pertanyaan keagamaan.',
    section5Body: 'AWA mendampingi pengguna dalam memahami siklusnya, di persimpangan antara kesehatan dan praktik ibadah, dengan pendekatan edukatif yang menghormati perbedaan antarmazhab.',
    awaRole: [
      'Memahami konsep dasar fikih perempuan',
      'Lebih memahami siklusmu, baik dari sisi medis maupun keagamaan',
      'Mengenali pertanyaan yang memerlukan pendapat ulama yang berkompeten',
      'Menemukan arah di tengah perbedaan antarmazhab tanpa kebingungan',
      'Mengakses penjelasan edukatif yang jelas dan netral',
      'Membedakan informasi medis dari keputusan keagamaan',
      'Mencatat informasi yang berguna bagi ibadahmu, jika diperlukan',
      'Menyiapkan pertanyaan khusus untuk diajukan kepada ulama yang berkompeten',
    ],
    alert3Title: 'Informasi penting',
    alert3Text: 'AWA adalah alat edukasi dan informasi: dalam keadaan apa pun tidak menggantikan pendapat ulama yang berkompeten atau otoritas keagamaan.',
    section6Body: 'Sebagian situasi sebaiknya disampaikan langsung kepada ulama yang kamu percaya, terutama ketika:',
    whenToAsk: [
      'Situasi pribadimu tidak cocok dengan kasus umum mana pun (perdarahan tidak biasa, keraguan yang berkepanjangan...)',
      'Beberapa pendapat tampak saling bertentangan dan kamu tidak tahu mana yang harus diikuti',
      'Suatu keputusan keagamaan berdampak besar pada ibadah sehari-harimu',
      'Kamu merasa perlu bimbingan yang sesuai dengan situasi pribadimu',
    ],
    tip3Title: 'Perlu diketahui',
    tip3Text: 'Fikih perempuan adalah bidang penafsiran yang hidup, dengan pendapat yang terkadang berbeda antarmazhab. AWA membantumu memahami dasar-dasarnya dan menyusun pertanyaanmu, tetapi pendapat ulama yang berkompeten tetap menjadi rujukan untuk setiap keputusan keagamaan pribadi.',
    shareMessage: 'Fikih perempuan, sebuah pengantar — AWA',
  },
  hi: {
    badge: 'महिलाओं का फ़िक़्ह',
    title: 'महिलाओं का फ़िक़्ह:\nएक परिचय',
    metaDuration: '7 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'शुरुआती',
    metaValidated: 'समीक्षित सामग्री',
    intro: 'महिलाओं के फ़िक़्ह में शामिल मुख्य विषयों का एक व्यापक परिचय, जो धार्मिक अमल और रोज़ की ज़िंदगी के बीच का है।',
    disclaimerTitle: 'ज़रूरी जानकारी',
    disclaimerText: 'यह सामग्री पूरी तरह शैक्षिक है। धार्मिक सवालों की पुष्टि योग्य उलमा से करवानी चाहिए। AWA फ़तवे या व्यक्तिगत धार्मिक हुक्म जारी नहीं करता।',
    contentsTitle: 'इस लेख में',
    topics: [
      'महिलाओं के फ़िक़्ह में क्या शामिल है',
      'महिलाओं का फ़िक़्ह क्यों ज़रूरी है?',
      'फ़िक़्ही मत (मदहब)',
      'फ़िक़्ह, सेहत और रोज़ का अमल',
      'AWA की शैक्षिक भूमिका',
      'योग्य व्यक्ति से सलाह कब लें?',
      'मुख्य बातें',
    ],
    section1Body: 'महिलाओं का फ़िक़्ह इस्लामी न्यायशास्त्र (फ़िक़्ह) का वह क्षेत्र है जो महिलाओं के शरीर और इबादत से जुड़े व्यावहारिक सवालों से संबंध रखता है। यह समझने में मदद करता है कि रोज़ की धार्मिक ज़िंदगी को स्त्री-चक्र के अलग-अलग चरणों के साथ कैसे निभाया जाए।',
    dailyTopics: [
      'माहवारी और मासिक चक्र',
      'माहवारी का ख़ून और उसकी हैसियत',
      'पाकी (पवित्रता)',
      'माहवारी के बाद ग़ुस्ल',
      'माहवारी के दौरान और बाद में नमाज़',
      'रमज़ान का रोज़ा और क़ज़ा के दिन',
      'अनियमित रक्तस्राव (इस्तिहाज़ा)',
      'प्रसव के बाद निफ़ास',
      'रोज़मर्रा की ज़िंदगी और धार्मिक अमल',
    ],
    section1Body2: 'फ़िक़्ह व्याख्या का एक क्षेत्र है: कुछ सवालों पर उलमा और मसलकों के अनुसार अलग-अलग राय होती हैं, और कोई एक राय अपने आप में अंतिम नहीं मानी जाती।',
    section2Body: 'महिलाओं के फ़िक़्ह को समझने से अपना धार्मिक अमल ज़्यादा सुकून के साथ, बिना उलझन के निभाया जा सकता है, उन समयों में जब शरीर ख़ास चरणों से गुज़रता है (माहवारी, गर्भावस्था, प्रसवोत्तर, मेनोपॉज़)। इससे यह पहचानने में भी मदद मिलती है कि क्या फ़र्ज़ है, क्या छूट के दायरे में है और क्या सिर्फ़ पसंदीदा सलाह है।',
    visual1Title: 'ज़्यादा सुकून भरा धार्मिक अमल',
    visual1Text: 'चक्र के हर चरण में क्या अपेक्षित है, यह जानने से अपने ईमान की ओर ज़्यादा भरोसे के साथ बढ़ा जा सकता है।',
    section3Body: 'मदहब का मतलब है फ़िक़्ह की एक विचारधारा, यानी एक व्यवस्थित तरीका जिससे उलमा धार्मिक स्रोतों (क़ुरआन, सुन्नत, सर्वसम्मति और तर्क) की व्याख्या करते हैं और रोज़मर्रा की ज़िंदगी के व्यावहारिक सवालों के जवाब देते हैं। कई मदहब मौजूद हैं, क्योंकि उलमा ने हमेशा एक ही पद्धति का पालन नहीं किया या एक ही पाठों की एक जैसी व्याख्या नहीं की।',
    section3Body2: 'इसीलिए माहवारी, पाकी, नमाज़ या रोज़े से जुड़े कुछ सवालों पर, सलाह लिए गए उलमा के अनुसार अलग-अलग राय हो सकती हैं। राय का अंतर इसका मतलब नहीं कि कोई राय "ग़लत" है: यह एक ही स्रोतों की अलग पद्धतियों और अलग समझ को दिखाता है।',
    tip1Title: 'जानना अच्छा है',
    tip1Text: 'अपने परिवार या समुदाय में जिस तरीके या मदहब का परंपरागत रूप से पालन होता है, उसे अपनाना आम बात है।',
    noteTitle: 'कृपया ध्यान दें',
    noteText: 'जब कोई ख़ास धार्मिक स्थिति अनिश्चित बनी रहे, तो किसी योग्य आलिम की राय पूछना पूरी तरह उचित है।',
    section4Body: 'चक्र की चिकित्सकीय जानकारी (अवधि, लक्षण, हार्मोनल चरण) और उससे निकलने वाले धार्मिक नियम (पाकी, नमाज़, रोज़ा) दो अलग तर्कों पर चलते हैं: एक जैविक घटना का वर्णन करता है, दूसरा आध्यात्मिक अमल का दायरा तय करता है। दोनों एक-दूसरे के पूरक हो सकते हैं, लेकिन इन्हें आपस में गड्ड-मड्ड नहीं करना चाहिए।',
    visual2Title: 'दो पूरक नज़रिए',
    visual2Text: 'चक्र की चिकित्सकीय निगरानी और उससे जुड़े धार्मिक पैमाने, दोनों अपने-अपने ढंग से उपयोगी समझ देते हैं।',
    tip2Title: 'जानना अच्छा है',
    tip2Text: 'चिकित्सकीय सवालों का जवाब स्वास्थ्य विशेषज्ञ दे सकता है; धार्मिक सवालों के लिए योग्य आलिम ही संदर्भ बने रहते हैं।',
    section5Body: 'AWA स्वास्थ्य और धार्मिक अमल के संगम पर उपयोगकर्ताओं को अपना चक्र समझने में सहयोग देता है, एक ऐसे शैक्षिक तरीके से जो अलग-अलग मसलकों के बीच के अंतर का सम्मान करता है।',
    awaRole: [
      'महिलाओं के फ़िक़्ह की बुनियादी अवधारणाएँ समझना',
      'अपने चक्र को चिकित्सकीय और धार्मिक, दोनों नज़रिए से बेहतर समझना',
      'ऐसे सवाल पहचानना जिनके लिए योग्य आलिम की राय ज़रूरी है',
      'बिना उलझन के अलग-अलग मदहबों के अंतर को समझना',
      'साफ़ और निष्पक्ष शैक्षिक व्याख्याएँ पाना',
      'चिकित्सकीय जानकारी को धार्मिक फ़ैसले से अलग पहचानना',
      'ज़रूरत हो तो अपने धार्मिक अमल के लिए उपयोगी जानकारी पर नज़र रखना',
      'किसी योग्य आलिम से पूछने के लिए ख़ास सवाल तैयार करना',
    ],
    alert3Title: 'ज़रूरी जानकारी',
    alert3Text: 'AWA एक शैक्षिक और जानकारी देने वाला साधन है: यह किसी भी हाल में किसी योग्य आलिम या धार्मिक अधिकारी की राय का विकल्प नहीं है।',
    section6Body: 'कुछ स्थितियों को सीधे किसी भरोसेमंद आलिम के सामने रखना चाहिए, ख़ासकर जब:',
    whenToAsk: [
      'कोई व्यक्तिगत स्थिति किसी आम मामले से मेल न खाती हो (असामान्य रक्तस्राव, लंबे समय का संदेह...)',
      'कई राय आपस में टकराती लगें और आप न जानती हों कि किसका पालन करें',
      'कोई धार्मिक फ़ैसला आपके रोज़ के अमल पर बड़ा असर डालता हो',
      'आपको अपनी निजी स्थिति के अनुरूप मार्गदर्शन की ज़रूरत महसूस हो',
    ],
    tip3Title: 'जानना अच्छा है',
    tip3Text: 'महिलाओं का फ़िक़्ह व्याख्या का एक जीवंत क्षेत्र है, जिसमें मसलकों के बीच कभी-कभी अलग राय मिलती हैं। AWA आपको बुनियादी बातें समझने और अपने सवाल व्यवस्थित करने में मदद करता है, लेकिन किसी भी व्यक्तिगत धार्मिक फ़ैसले के लिए योग्य आलिम की राय ही संदर्भ रहती है।',
    shareMessage: 'महिलाओं का फ़िक़्ह, एक परिचय — AWA',
  },
  sq: {
    badge: 'FIKHU I GRAVE',
    title: 'Fikhu i grave:\nnjë hyrje',
    metaDuration: '7 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e shqyrtuar',
    intro: 'Një pasqyrë e plotë e temave kryesore që trajton fikhu i grave, mes praktikës fetare dhe jetës së përditshme.',
    disclaimerTitle: 'Informacion i rëndësishëm',
    disclaimerText: 'Kjo përmbajtje është thjesht edukative. Pyetjet fetare duhen vërtetuar nga dijetarë të kualifikuar. AWA nuk jep fetva dhe as vendime fetare të personalizuara.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Çfarë përfshin fikhu i grave',
      'Pse është i rëndësishëm fikhu i grave?',
      'Shkollat juridike (medhhebet)',
      'Fikhu, shëndeti dhe praktika e përditshme',
      'Roli edukativ i AWA-s',
      'Kur të kërkosh këshillë nga një person i kualifikuar?',
      'Çfarë të mbash mend',
    ],
    section1Body: 'Fikhu i grave është fusha e jurisprudencës islame (fikhut) që merret me pyetjet praktike që lidhen me trupin e gruas dhe me adhurimin. Ndihmon të kuptohet si mund të pajtohet jeta e përditshme fetare me fazat e ndryshme të ciklit femëror.',
    dailyTopics: [
      'Menstruacioni dhe cikli menstrual',
      'Gjaku menstrual dhe statusi i tij',
      'Pastërtia rituale',
      'Gusli pas menstruacionit',
      'Namazi gjatë dhe pas menstruacionit',
      'Agjërimi i Ramazanit dhe ditët që duhen kompensuar',
      'Gjakderdhja e parregullt (istihadaja)',
      'Nifasi pas lindjes',
      'Jeta e përditshme dhe praktika fetare',
    ],
    section1Body2: 'Fikhu është një fushë interpretimi juridik: disa pyetje kanë mendime të ndryshme sipas dijetarëve dhe shkollave të mendimit, pa qenë ndonjë mendim i vetëm absolut në vetvete.',
    section2Body: 'Të kuptuarit e fikhut të grave bën të mundur që praktika fetare të jetohet me më shumë qetësi, pa ngatërresa, në momente kur trupi kalon në faza të veçanta (menstruacioni, shtatzënia, periudha pas lindjes, menopauza). Ndihmon gjithashtu të dallohet çfarë është detyrim, çfarë është përjashtim dhe çfarë është thjesht rekomandim.',
    visual1Title: 'Një praktikë fetare më e qetë',
    visual1Text: 'Të dish çfarë pritet në çdo fazë të ciklit bën të mundur ta qasesh besimin tënd me më shumë besim.',
    section3Body: 'Një medhheb është një shkollë e mendimit juridik, domethënë një metodë e strukturuar që dijetarët e përdorin për të interpretuar burimet fetare (Kuranin, sunnetin, konsensusin, arsyetimin) dhe për t’iu përgjigjur pyetjeve praktike të jetës së përditshme. Ekzistojnë disa shkolla, sepse dijetarët nuk e kanë ndjekur gjithmonë të njëjtën metodologji ose nuk i kanë interpretuar të njëjtat tekste në të njëjtën mënyrë.',
    section3Body2: 'Prandaj disa pyetje që lidhen me menstruacionin, pastërtinë rituale, namazin ose agjërimin mund të kenë mendime të ndryshme sipas dijetarëve që konsultohen. Një ndryshim mendimi nuk do të thotë se një mendim është “i gabuar”: pasqyron metodologji dhe lexime të ndryshme të të njëjtave burime.',
    tip1Title: 'Mirë është ta dish',
    tip1Text: 'Është e zakonshme të ndiqet qasja ose medhhebi që e ndjek tradicionalisht familja ose komuniteti i dikujt.',
    noteTitle: 'Ki parasysh',
    noteText: 'Kur një situatë e veçantë fetare mbetet e pasigurt, është krejt e përshtatshme të kërkosh mendimin e një dijetari të kualifikuar.',
    section4Body: 'Informacioni mjekësor për ciklin (kohëzgjatja, simptomat, fazat hormonale) dhe rregullat fetare që rrjedhin prej tij (pastërtia, namazi, agjërimi) i përgjigjen dy logjikave të ndryshme: njëra përshkruan një dukuri biologjike, tjetra përcakton një kornizë për praktikën shpirtërore. Të dyja mund të plotësojnë njëra-tjetrën, por nuk duhen ngatërruar.',
    visual2Title: 'Dy këndvështrime plotësuese',
    visual2Text: 'Ndjekja mjekësore e ciklit dhe pikat fetare referuese që rrjedhin prej tij secila ofron një kuptim të dobishëm.',
    tip2Title: 'Mirë është ta dish',
    tip2Text: 'Një profesionist i shëndetësisë mund t’u përgjigjet pyetjeve mjekësore; një dijetar i kualifikuar mbetet reference për pyetjet fetare.',
    section5Body: 'AWA i përkrah përdoruesit të kuptojnë ciklin e tyre, në kryqëzimin mes shëndetit dhe praktikës fetare, me një qasje edukative që i respekton dallimet mes shkollave.',
    awaRole: [
      'Të kuptosh konceptet themelore të fikhut të grave në mënyrë të thjeshtë',
      'Ta kuptosh më mirë ciklin tënd, si nga ana mjekësore, ashtu edhe nga ajo fetare',
      'Të dallosh pyetjet që kërkojnë mendimin e një dijetari të kualifikuar',
      'Të orientohesh mes dallimeve të medhhebeve pa u ngatërruar',
      'Të kesh qasje në shpjegime edukative të qarta dhe neutrale',
      'Ta dallosh informacionin mjekësor nga një vendim fetar',
      'Të ndjekësh informacionin e dobishëm për praktikën tënde fetare, nëse të duhet',
      'Të përgatitesh pyetje të veçanta për t’i bërë një dijetari të kualifikuar',
    ],
    alert3Title: 'Informacion i rëndësishëm',
    alert3Text: 'AWA është një mjet edukativ dhe informues: nuk zëvendëson, në asnjë rrethanë, mendimin e një dijetari të kualifikuar ose të një autoriteti fetar.',
    section6Body: 'Disa situata meritojnë t’i drejtohen drejtpërdrejt një dijetari të besuar, sidomos kur:',
    whenToAsk: [
      'Një situatë personale nuk përputhet me asnjë rast tipik (gjakderdhje e pazakontë, dyshim i zgjatur...)',
      'Disa mendime duken se kundërshtojnë njëri-tjetrin dhe nuk e di cilin të ndjekësh',
      'Një vendim fetar ka ndikim të rëndësishëm në praktikën tënde të përditshme',
      'Ndjen nevojën për udhëzim të përshtatur me situatën tënde personale',
    ],
    tip3Title: 'Mirë është ta dish',
    tip3Text: 'Fikhu i grave është një fushë interpretimi e gjallë, me mendime që ndonjëherë ndryshojnë mes shkollave. AWA të ndihmon të kuptosh bazat dhe t’i strukturosh pyetjet e tua, por mendimi i një dijetari të kualifikuar mbetet reference për çdo vendim personal fetar.',
    shareMessage: 'Fikhu i grave, një hyrje — AWA',
  },
  ja: {
    badge: '女性のフィクフ',
    title: '女性のフィクフ：\n入門',
    metaDuration: '読了7分',
    metaType: 'ガイド',
    metaLevel: '初級',
    metaValidated: '確認済みの内容',
    intro: '信仰の実践と日々の生活のあいだで、女性のフィクフが扱う主なテーマを幅広く紹介します。',
    disclaimerTitle: '大切なお知らせ',
    disclaimerText: 'この内容は教育目的のみのものです。宗教に関する疑問は、資格のある学者に確認してください。AWAはファトワーや個別の宗教的判断を出すことはありません。',
    contentsTitle: 'この記事の内容',
    topics: [
      '女性のフィクフが扱う範囲',
      '女性のフィクフが大切な理由',
      '法学派（マズハブ）',
      'フィクフ、健康、日々の実践',
      'AWAの教育的な役割',
      '資格のある人に相談するタイミングは？',
      '大切なポイント',
    ],
    section1Body: '女性のフィクフとは、イスラーム法学（フィクフ）のうち、女性の体と礼拝・信仰の実践に関する具体的な問いを扱う分野です。女性の周期のさまざまな段階と、日々の信仰生活をどう両立させるかを理解する助けになります。',
    dailyTopics: [
      '月経と生理周期',
      '経血とその位置づけ',
      '清浄',
      '月経後のグスル',
      '月経中と月経後の礼拝',
      'ラマダーンの断食と後日に行う日',
      '不規則な出血（イスティハーダ）',
      '出産後のニファース',
      '日常生活と信仰の実践',
    ],
    section1Body2: 'フィクフは法的な解釈の分野です。いくつかの問いについては、学者や学派によって意見が異なり、どれかひとつの意見がそれだけで絶対になるわけではありません。',
    section2Body: '女性のフィクフを理解すると、体が特有の段階（月経、妊娠、産後、更年期）を迎える時期にも、迷うことなく、より穏やかな気持ちで信仰を実践しやすくなります。また、何が義務で、何が免除で、何が単なる推奨なのかを見分ける助けにもなります。',
    visual1Title: 'より穏やかな信仰の実践',
    visual1Text: '周期の各段階で何が求められているかを知ると、より自信を持って信仰に向き合えます。',
    section3Body: 'マズハブ（法学派）とは、法的な考え方の流派のことです。学者がクルアーン、スンナ、学者たちの合意、推論といった宗教的な根拠を解釈し、日常生活の具体的な問いに答えるための、体系だった方法を指します。学派がいくつも存在するのは、学者たちが必ずしも同じ方法に従ったり、同じ文言を同じように解釈したりしてきたわけではないからです。',
    section3Body2: 'このため、月経、清浄、礼拝、断食に関するいくつかの問いは、誰に尋ねるかによって意見が異なることがあります。意見の違いは、どちらかの意見が「間違い」であることを意味しません。同じ根拠に対する方法や読み方が違うことの表れです。',
    tip1Title: '知っておきたいこと',
    tip1Text: '家族や地域の人々が伝統的に従ってきた考え方やマズハブに従うことは、よくあることです。',
    noteTitle: 'ご注意ください',
    noteText: '特定の宗教的な状況に迷いが残るときは、資格のある学者の意見を尋ねるのがまったく適切です。',
    section4Body: '周期に関する医療面の情報（長さ、症状、ホルモンの段階）と、そこから生じる宗教上の決まり（清浄、礼拝、断食）は、2つの異なる考え方に基づいています。一方は生物学的な現象を説明するもので、もう一方は信仰の実践の枠組みを定めるものです。この2つは互いに補い合えますが、混同してはいけません。',
    visual2Title: '互いに補い合う2つの視点',
    visual2Text: '周期の医療面での記録と、それに伴う宗教上の目安は、それぞれ役に立つ見方を与えてくれます。',
    tip2Title: '知っておきたいこと',
    tip2Text: '医療に関する疑問には医療従事者が答えられます。宗教に関する疑問については、資格のある学者が基準となります。',
    section5Body: 'AWAは、学派の違いを尊重する教育的な姿勢で、健康と信仰の実践が交わる場所にある自分の周期を理解できるよう、利用者を支えます。',
    awaRole: [
      '女性のフィクフの基本的な考え方を理解する',
      '医療面と宗教面の両方から、自分の周期をよりよく理解する',
      '資格のある学者の意見が必要な問いを見きわめる',
      'マズハブ（法学派）間の違いの中で、迷わずに道筋を見つける',
      '分かりやすく中立的な教育的な説明にアクセスする',
      '医療情報と宗教的な判断を区別する',
      '必要に応じて、信仰の実践に役立つ情報を記録する',
      '資格のある学者に尋ねる具体的な質問を準備する',
    ],
    alert3Title: '大切なお知らせ',
    alert3Text: 'AWAは教育と情報提供のためのツールであり、いかなる場合も、資格のある学者や宗教的権威の意見に代わるものではありません。',
    section6Body: '信頼できる学者に直接尋ねるのがよい場合があります。とくに、次のようなときです。',
    whenToAsk: [
      '個人的な状況がどの典型的なケースにも当てはまらない（いつもと違う出血、長引く迷いなど）',
      '複数の意見が食い違うように思え、どれに従えばよいか分からない',
      '宗教的な判断が日々の実践に大きく影響する',
      '自分の状況に合った導きが必要だと感じる',
    ],
    tip3Title: '知っておきたいこと',
    tip3Text: '女性のフィクフは解釈が生き続けている分野で、学派によって意見が分かれることもあります。AWAは基本を理解し、質問を整理する助けになりますが、個人的な宗教上の判断については、資格のある学者の意見が基準であり続けます。',
    shareMessage: '女性のフィクフ入門 — AWA',
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
            <AwaIconButton
              accessibilityLabel={t('library.reader.back')}
              icon="chevron-left"
              iconSize={23}
              onPress={() => navigation.goBack()}
              variant="tonal"
            />

            <View style={styles.actions}>
              <AwaIconButton
                accessibilityLabel={t('library.screen.addBookmark')}
                icon={saved ? 'bookmark' : 'bookmark-outline'}
                iconSize={20}
                onPress={handleBookmark}
                variant="tonal"
              />

              <AwaIconButton
                accessibilityLabel={t('libraryArticle.shareA11y')}
                icon="share-variant-outline"
                iconSize={20}
                onPress={handleShare}
                variant="tonal"
              />
            </View>
          </View>
        </View>

        <View style={styles.article}>
          <View style={styles.badge}>
            <AwaText variant="labelSmall" emphasized colorRole="primary">{content.badge}</AwaText>
          </View>

          <AwaText variant="headlineMedium" weight="700" style={styles.title}>
            {content.title}
          </AwaText>

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

                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant">{text}</AwaText>
                </View>
              </React.Fragment>
            ))}
          </View>

          <AwaText variant="bodyMedium" style={styles.intro}>
            {content.intro}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="information-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.disclaimerTitle}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>{content.disclaimerText}</AwaText>
            </View>
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.contents}>
            <AwaText variant="titleMedium" emphasized style={styles.contentsTitle}>{content.contentsTitle}</AwaText>

            {content.topics.map((item, index) => (
              <View key={item} style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <AwaText variant="titleSmall" emphasized colorRole="primary" style={styles.contentNumber}>{index + 1}.</AwaText>
                  <AwaText variant="bodySmall" style={styles.contentText}>{item}</AwaText>
                </View>

                <MaterialDesignIcons
                  name="chevron-right"
                  size={17}
                  color={theme.colors.primary}
                />
              </View>
            ))}
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>1. {content.topics[0]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section1Body}
          </AwaText>

          <View style={styles.daily}>
            {TOPIC_ICONS.map((icon, index) => (
              <View key={icon} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={icon as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <AwaText variant="bodySmall" style={styles.dailyText}>{content.dailyTopics[index]}</AwaText>
              </View>
            ))}
          </View>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section1Body2}
          </AwaText>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            2. {content.topics[1]}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section2Body}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.visualCard}>
            <Image
              source={resolveEditorialImage(ART.importance, lang)}
              resizeMode="cover"
              style={styles.visualImage}
            />

            <View style={styles.visualCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.visual1Title}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.visualText}>
                {content.visual1Text}
              </AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.topics[2]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section3Body}
          </AwaText>

          <Image
            source={ART.madhahib}
            resizeMode="cover"
            style={styles.wideImage}
          />

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section3Body2}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.tip1Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.tip1Text}
              </AwaText>
            </View>
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.noteTitle}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.noteText}
              </AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            4. {content.topics[3]}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section4Body}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.visualCard}>
            <Image
              source={ART.consult}
              resizeMode="cover"
              style={styles.visualImage}
            />

            <View style={styles.visualCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.visual2Title}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.visualText}>
                {content.visual2Text}
              </AwaText>
            </View>
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.tip2Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.tip2Text}
              </AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>5. {content.topics[4]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section5Body}
          </AwaText>

          <Image
            source={ART.awaRole}
            resizeMode="cover"
            style={styles.wideImage}
          />

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.awaRole.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.checkText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="alert-circle-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.alert3Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.alert3Text}
              </AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            6. {content.topics[5]}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section6Body}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.whenToAsk.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.checkText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>7. {content.topics[6]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.tip3Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.tip3Text}
              </AwaText>
            </View>
          </AwaCard>
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={7} scrollRef={scrollRef} />
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  screen: {flex: 1, backgroundColor: theme.colors.background},
  scroll: {paddingBottom: 32},
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
  article: {
    marginTop: -16,
    padding: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: theme.colors.background,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
  },
  title: {
    marginTop: 12,
  },
  metas: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {flexDirection: 'row', alignItems: 'center', gap: 4},
  metaDivider: {width: 1, height: 20, backgroundColor: theme.colors.border},
  intro: {
    marginTop: 16,
  },
  alert: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },
  contents: {
    marginTop: 20,
    padding: 16,
  },
  contentsTitle: {marginBottom: 8},
  contentRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contentLeft: {flex: 1, flexDirection: 'row', alignItems: 'center'},
  contentNumber: {width: 24},
  contentText: {flex: 1},
  h2: {
    marginTop: 24,
  },
  body: {marginTop: 8},
  visualCard: {
    marginTop: 16,
    minHeight: 98,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  visualImage: {width: 72, height: 72, borderRadius: 12},
  visualCopy: {flex: 1, marginLeft: 12},
  visualText: {marginTop: 4},
  wideImage: {width: '100%', height: 120, marginTop: 16, borderRadius: 12},
  daily: {marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  dailyItem: {
    width: '48.7%',
    minHeight: 108,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  dailyText: {
    marginTop: 8,
    textAlign: 'center',
  },
  checkList: {
    marginTop: 12,
    padding: 12,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  checkText: {flex: 1},
  tip: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipCopy: {flex: 1, marginLeft: 12},
  tipText: {marginTop: 3},
  });
}
