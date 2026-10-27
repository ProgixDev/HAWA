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
import {withBrazilianPortuguese} from '../../i18n/ptBrEditorial';

const ID = 'nifas-aspects-medicaux';

const HERO = require('../../assets/images/library/featured-spm.png');

/* -------------------------------------------------------------------------- */
/* LANGUAGE-NEUTRAL DATA (icons/numbers only — text lives in CONTENT below) */
/* -------------------------------------------------------------------------- */

const NIFAS_STAGE_META = [
  {icon: 'hospital-box-outline', number: '01'},
  {icon: 'water-outline', number: '02'},
  {icon: 'chart-timeline-variant', number: '03'},
  {icon: 'calendar-check-outline', number: '04'},
] as const;

// Note: the three lochia-evolution stages below are differentiated purely by
// their text labels/periods ("Rouges" → "Rosées/brunâtres" → "Blanchâtres"),
// matching the sibling LochiaArticleScreen.tsx timeline exactly — the icons
// all use the same theme accent color rather than a per-stage swatch (an
// earlier per-item tint here was decorative, not a genuine medical color
// legend: it used a green icon for the "blanchâtre"/whitish stage, which
// does not represent that color at all).
const LOCHIA_EVOLUTION_ICONS = [
  'numeric-1-circle-outline',
  'numeric-2-circle-outline',
  'numeric-3-circle-outline',
] as const;

const CARE_TIP_ICONS = [
  'shower',
  'bed-outline',
  'cup-water',
  'food-apple-outline',
] as const;

/* -------------------------------------------------------------------------- */
/* CONTENT — PHASE 7L bilingual editorial content. Article identity (ID,
   images, bookmark/progress keys, JSX structure) is untouched; only this
   object changes per language. The French text below is byte-identical to
   the original — never retyped, only moved into the `fr` key — so the app
   remains fully bilingual rather than having French replaced by English.
   "Nifas" is an Islamic jurisprudence term and is kept untranslated in both
   languages, exactly as the rest of the app does. */
/* -------------------------------------------------------------------------- */

const CONTENT = withBrazilianPortuguese('NifasMedical', {
  fr: {
    badge: 'POST-PARTUM • NIFAS',
    title: 'Le nifas :\naspects médicaux',
    metaDuration: '5 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu informatif',
    intro:
      'Après la naissance, le corps traverse une période de récupération progressive. Comprendre les pertes post-accouchement, leur évolution et les signes qui doivent attirer l’attention peut aider à vivre cette période avec davantage de repères.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Comprendre le terme nifas',
      'Le schéma médical après la naissance',
      'L’évolution des lochies',
      'Prendre soin de soi',
      'Quand demander conseil ?',
      'À retenir',
    ],
    h2Section1: '1. Comprendre le terme « nifas »',
    body1a:
      'Le terme « nifas » appartient au vocabulaire religieux et désigne la période liée aux saignements qui suivent l’accouchement dans les règles de jurisprudence islamique.',
    body1b:
      'Sur le plan médical, les pertes observées après l’accouchement sont appelées « lochies ». Ces deux notions peuvent être étudiées séparément : l’une relève d’un cadre religieux, l’autre décrit un phénomène physiologique.',
    distinction: {
      nifasTitle: 'Nifas',
      nifasText: 'Notion relevant du cadre religieux après l’accouchement.',
      lochiaTitle: 'Lochies',
      lochiaText: 'Terme médical utilisé pour les pertes post-accouchement.',
    },
    h2Section2: '2. Le schéma médical après la naissance',
    body2:
      'La récupération post-partum se fait progressivement. Les pertes post-accouchement évoluent généralement avec le temps tandis que l’utérus poursuit son retour vers son état habituel.',
    schemaTitle: 'Évolution post-accouchement',
    schemaSubtitle: 'Repère médical simplifié',
    stages: [
      {
        title: 'Après l’accouchement',
        subtitle: 'Début du post-partum',
        text: 'Le corps commence progressivement sa récupération après la naissance.',
      },
      {
        title: 'Les lochies',
        subtitle: 'Pertes post-accouchement',
        text: 'Les pertes évoluent progressivement en quantité et en couleur.',
      },
      {
        title: 'Diminution progressive',
        subtitle: 'Sur plusieurs semaines',
        text: 'Les pertes diminuent généralement au fil du temps.',
      },
      {
        title: 'Retour progressif',
        subtitle: 'Vers le cycle habituel',
        text: 'Le cycle menstruel peut ensuite reprendre progressivement.',
      },
    ],
    h2Section3: '3. L’évolution des lochies',
    body3:
      'Les lochies changent généralement progressivement de couleur et diminuent en quantité. Leur évolution peut cependant varier d’une personne à l’autre.',
    lochiaEvolution: [
      {
        title: 'Lochies rouges',
        period: 'Premiers jours',
        text: 'Les pertes sont généralement rouges et peuvent être plus abondantes au début.',
      },
      {
        title: 'Lochies rosées / brunâtres',
        period: 'Après quelques jours',
        text: 'La couleur peut devenir plus claire ou brunâtre tandis que le flux diminue.',
      },
      {
        title: 'Lochies blanchâtres',
        period: 'Semaines suivantes',
        text: 'Les pertes deviennent progressivement plus claires et moins abondantes.',
      },
    ],
    infoTitle: 'À retenir',
    infoText:
      'La couleur et la quantité des lochies peuvent évoluer progressivement. L’évolution exacte n’est pas identique chez toutes les personnes.',
    h2Section4: '4. Prendre soin de soi',
    body4:
      'Pendant cette période, quelques habitudes simples peuvent contribuer au confort et accompagner la récupération du corps.',
    careTips: [
      {title: 'Hygiène douce', text: 'Garde une hygiène quotidienne simple et confortable.'},
      {title: 'Repos', text: 'Accorde à ton corps du temps pour récupérer.'},
      {title: 'Hydratation', text: 'Pense à boire régulièrement selon tes besoins.'},
      {title: 'Alimentation', text: 'Une alimentation variée accompagne la récupération.'},
    ],
    h2Section5: '5. Quand demander conseil ?',
    body5:
      'Certaines situations nécessitent de demander rapidement conseil à un professionnel de santé, notamment lorsqu’un changement paraît important, soudain ou inhabituel.',
    warningTitle: 'Signes à ne pas ignorer',
    warningSubtitle: 'Demande un avis professionnel si nécessaire',
    warningSigns: [
      'Une odeur forte ou inhabituelle des pertes',
      'De la fièvre ou un état général qui se dégrade',
      'Un saignement qui devient soudainement très abondant',
      'Une douleur importante, persistante ou inhabituelle',
      'Un symptôme nouveau qui t’inquiète',
    ],
    tipTitle: 'Bon à savoir',
    tipText:
      'Chaque récupération post-partum est différente. Les informations de cet article sont destinées à donner des repères généraux et ne remplacent pas une consultation médicale.',
    summaryHeading: 'À retenir',
    summary: [
      'Le nifas est un terme utilisé dans le cadre religieux après l’accouchement.',
      'Sur le plan médical, les pertes post-accouchement sont appelées lochies.',
      'Les lochies évoluent progressivement en couleur et en quantité.',
      'Le repos, l’hygiène douce et une bonne hydratation accompagnent la récupération.',
      'Un changement inhabituel ou préoccupant mérite un avis professionnel.',
    ],
    disclaimerText:
      'Contenu informatif. Les informations médicales présentées ici sont générales et ne remplacent pas l’avis d’un professionnel de santé. Pour les questions religieuses spécifiques, il est recommandé de se référer à une source religieuse qualifiée.',
    shareMessage: 'Le nifas : aspects médicaux — AWA',
  },
  en: {
    badge: 'POSTPARTUM • NIFAS',
    title: 'Nifas:\nmedical aspects',
    metaDuration: '5 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Informational content',
    intro:
      'After giving birth, the body goes through a gradual recovery period. Understanding postpartum bleeding, how it evolves, and the signs that call for attention can help you feel more informed during this time.',
    contentsTitle: 'In this article',
    topics: [
      'Understanding the term Nifas',
      'The medical pattern after birth',
      'How lochia evolves',
      'Taking care of yourself',
      'When to seek advice',
      'Key takeaways',
    ],
    h2Section1: '1. Understanding the term "Nifas"',
    body1a:
      'The term "Nifas" belongs to religious vocabulary and refers to the period associated with the bleeding that follows childbirth within the rules of Islamic jurisprudence.',
    body1b:
      'Medically, the bleeding observed after childbirth is called "lochia." These two notions can be considered separately: one belongs to a religious framework, the other describes a physiological phenomenon.',
    distinction: {
      nifasTitle: 'Nifas',
      nifasText: 'A notion belonging to the religious framework after childbirth.',
      lochiaTitle: 'Lochia',
      lochiaText: 'Medical term used for postpartum bleeding.',
    },
    h2Section2: '2. The medical pattern after birth',
    body2:
      'Postpartum recovery happens gradually. Postpartum bleeding generally changes over time as the uterus continues returning to its usual state.',
    schemaTitle: 'Postpartum progression',
    schemaSubtitle: 'Simplified medical reference',
    stages: [
      {
        title: 'After childbirth',
        subtitle: 'Start of the postpartum period',
        text: 'The body gradually begins its recovery after birth.',
      },
      {
        title: 'Lochia',
        subtitle: 'Postpartum bleeding',
        text: 'The bleeding gradually changes in amount and color.',
      },
      {
        title: 'Gradual decrease',
        subtitle: 'Over several weeks',
        text: 'The bleeding generally decreases over time.',
      },
      {
        title: 'Gradual return',
        subtitle: 'Toward the usual cycle',
        text: 'The menstrual cycle can then gradually resume.',
      },
    ],
    h2Section3: '3. How lochia evolves',
    body3:
      'Lochia generally changes color gradually and decreases in amount. However, this progression can vary from person to person.',
    lochiaEvolution: [
      {
        title: 'Red lochia',
        period: 'First days',
        text: 'The bleeding is usually red and can be heavier at the start.',
      },
      {
        title: 'Pink / brownish lochia',
        period: 'After a few days',
        text: 'The color can become lighter or brownish as the flow decreases.',
      },
      {
        title: 'Whitish lochia',
        period: 'Following weeks',
        text: 'The bleeding gradually becomes lighter and less abundant.',
      },
    ],
    infoTitle: 'Key takeaways',
    infoText:
      'The color and amount of lochia can change gradually. The exact progression isn’t the same for everyone.',
    h2Section4: '4. Taking care of yourself',
    body4:
      'During this period, a few simple habits can help with comfort and support the body’s recovery.',
    careTips: [
      {title: 'Gentle hygiene', text: 'Keep a simple, comfortable daily hygiene routine.'},
      {title: 'Rest', text: 'Give your body time to recover.'},
      {title: 'Hydration', text: 'Remember to drink regularly according to your needs.'},
      {title: 'Nutrition', text: 'A varied diet supports recovery.'},
    ],
    h2Section5: '5. When to seek advice',
    body5:
      'Certain situations call for prompt advice from a healthcare professional, particularly when a change seems significant, sudden, or unusual.',
    warningTitle: 'Signs not to ignore',
    warningSubtitle: 'Seek professional advice if needed',
    warningSigns: [
      'A strong or unusual odor in the bleeding',
      'Fever or a worsening general condition',
      'Bleeding that suddenly becomes very heavy',
      'Significant, persistent, or unusual pain',
      'A new symptom that worries you',
    ],
    tipTitle: 'Good to know',
    tipText:
      'Every postpartum recovery is different. The information in this article is meant to provide general guidance and doesn’t replace a medical consultation.',
    summaryHeading: 'Key takeaways',
    summary: [
      'Nifas is a term used in the religious context after childbirth.',
      'Medically, postpartum bleeding is called lochia.',
      'Lochia gradually changes in color and amount.',
      'Rest, gentle hygiene, and good hydration support recovery.',
      'An unusual or concerning change deserves professional advice.',
    ],
    disclaimerText:
      'Informational content. The medical information presented here is general and doesn’t replace the advice of a healthcare professional. For specific religious questions, it’s recommended to refer to a qualified religious source.',
    shareMessage: 'Nifas: medical aspects — AWA',
  },
  es: {
    badge: 'POSPARTO • NIFÁS',
    title: 'El nifás:\naspectos médicos',
    metaDuration: '5 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido informativo',
    intro:
      'Después del nacimiento, el cuerpo atraviesa un período de recuperación progresiva. Comprender las pérdidas posparto, su evolución y los signos que deben llamar la atención puede ayudar a vivir este período con más referencias.',
    contentsTitle: 'En este artículo',
    topics: [
      'Comprender el término nifás',
      'El esquema médico después del nacimiento',
      'La evolución de los loquios',
      'Cuidarte a ti misma',
      '¿Cuándo pedir consejo?',
      'Lo esencial',
    ],
    h2Section1: '1. Comprender el término «nifás»',
    body1a:
      'El término «nifás» pertenece al vocabulario religioso y designa el período relacionado con los sangrados que siguen al parto según las reglas de la jurisprudencia islámica.',
    body1b:
      'A nivel médico, las pérdidas observadas después del parto se denominan «loquios». Estas dos nociones pueden estudiarse por separado: una pertenece a un marco religioso, la otra describe un fenómeno fisiológico.',
    distinction: {
      nifasTitle: 'Nifás',
      nifasText: 'Noción que pertenece al marco religioso después del parto.',
      lochiaTitle: 'Loquios',
      lochiaText: 'Término médico utilizado para las pérdidas posparto.',
    },
    h2Section2: '2. El esquema médico después del nacimiento',
    body2:
      'La recuperación posparto se produce de forma progresiva. Las pérdidas posparto evolucionan generalmente con el tiempo mientras el útero continúa su retorno a su estado habitual.',
    schemaTitle: 'Evolución posparto',
    schemaSubtitle: 'Referencia médica simplificada',
    stages: [
      {
        title: 'Después del parto',
        subtitle: 'Inicio del posparto',
        text: 'El cuerpo comienza progresivamente su recuperación después del nacimiento.',
      },
      {
        title: 'Los loquios',
        subtitle: 'Pérdidas posparto',
        text: 'Las pérdidas evolucionan progresivamente en cantidad y en color.',
      },
      {
        title: 'Disminución progresiva',
        subtitle: 'A lo largo de varias semanas',
        text: 'Las pérdidas generalmente disminuyen con el tiempo.',
      },
      {
        title: 'Retorno progresivo',
        subtitle: 'Hacia el ciclo habitual',
        text: 'El ciclo menstrual puede entonces reanudarse progresivamente.',
      },
    ],
    h2Section3: '3. La evolución de los loquios',
    body3:
      'Los loquios generalmente cambian de color de forma progresiva y disminuyen en cantidad. Sin embargo, su evolución puede variar de una persona a otra.',
    lochiaEvolution: [
      {
        title: 'Loquios rojos',
        period: 'Primeros días',
        text: 'Las pérdidas son generalmente rojas y pueden ser más abundantes al principio.',
      },
      {
        title: 'Loquios rosados / parduzcos',
        period: 'Después de algunos días',
        text: 'El color puede volverse más claro o parduzco mientras el flujo disminuye.',
      },
      {
        title: 'Loquios blanquecinos',
        period: 'Semanas siguientes',
        text: 'Las pérdidas se vuelven progresivamente más claras y menos abundantes.',
      },
    ],
    infoTitle: 'Lo esencial',
    infoText:
      'El color y la cantidad de los loquios pueden evolucionar progresivamente. La evolución exacta no es idéntica en todas las personas.',
    h2Section4: '4. Cuidarte a ti misma',
    body4:
      'Durante este período, algunos hábitos sencillos pueden contribuir al confort y acompañar la recuperación del cuerpo.',
    careTips: [
      {title: 'Higiene suave', text: 'Mantén una higiene diaria sencilla y cómoda.'},
      {title: 'Descanso', text: 'Dale a tu cuerpo tiempo para recuperarse.'},
      {title: 'Hidratación', text: 'Recuerda beber con regularidad según tus necesidades.'},
      {title: 'Alimentación', text: 'Una alimentación variada acompaña la recuperación.'},
    ],
    h2Section5: '5. ¿Cuándo pedir consejo?',
    body5:
      'Algunas situaciones requieren pedir consejo rápidamente a un profesional de la salud, especialmente cuando un cambio parece importante, repentino o inusual.',
    warningTitle: 'Signos que no hay que ignorar',
    warningSubtitle: 'Pide un consejo profesional si es necesario',
    warningSigns: [
      'Un olor fuerte o inusual de las pérdidas',
      'Fiebre o un estado general que empeora',
      'Un sangrado que se vuelve repentinamente muy abundante',
      'Un dolor importante, persistente o inusual',
      'Un síntoma nuevo que te preocupa',
    ],
    tipTitle: 'DATO ÚTIL',
    tipText:
      'Cada recuperación posparto es diferente. La información de este artículo está destinada a dar referencias generales y no sustituye una consulta médica.',
    summaryHeading: 'Lo esencial',
    summary: [
      'El nifás es un término utilizado en el marco religioso después del parto.',
      'A nivel médico, las pérdidas posparto se denominan loquios.',
      'Los loquios evolucionan progresivamente en color y en cantidad.',
      'El descanso, la higiene suave y una buena hidratación acompañan la recuperación.',
      'Un cambio inusual o preocupante merece un consejo profesional.',
    ],
    disclaimerText:
      'Contenido informativo. La información médica presentada aquí es general y no sustituye el consejo de un profesional de la salud. Para preguntas religiosas específicas, se recomienda remitirse a una fuente religiosa cualificada.',
    shareMessage: 'El nifás: aspectos médicos — AWA',
  },
  it: {
    badge: 'POST-PARTUM • NIFAS',
    title: 'Nifas:\naspetti medici',
    metaDuration: '5 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto informativo',
    intro: 'Dopo il parto, il corpo attraversa un periodo di recupero graduale. Capire il sanguinamento post-partum, come evolve e i segni che richiedono attenzione può aiutarti a sentirti più informata in questo periodo.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Capire il termine Nifas',
      'L’andamento medico dopo il parto',
      'Come evolvono le lochiazioni',
      'Prenderti cura di te',
      'Quando chiedere un parere',
      'Punti chiave',
    ],
    h2Section1: '1. Capire il termine «Nifas»',
    body1a: 'Il termine «Nifas» appartiene al vocabolario religioso e indica il periodo associato al sanguinamento che segue il parto nell’ambito delle regole della giurisprudenza islamica.',
    body1b: 'Dal punto di vista medico, il sanguinamento osservato dopo il parto si chiama «lochiazioni». Queste due nozioni possono essere considerate separatamente: una appartiene a un ambito religioso, l’altra descrive un fenomeno fisiologico.',
    distinction: {
      nifasTitle: 'Nifas',
      nifasText: 'Una nozione che appartiene all’ambito religioso dopo il parto.',
      lochiaTitle: 'Lochiazioni',
      lochiaText: 'Termine medico usato per il sanguinamento post-partum.',
    },
    h2Section2: '2. L’andamento medico dopo il parto',
    body2: 'Il recupero post-partum avviene gradualmente. Il sanguinamento post-partum di solito cambia nel tempo man mano che l’utero continua a tornare al suo stato abituale.',
    schemaTitle: 'Progressione post-partum',
    schemaSubtitle: 'Riferimento medico semplificato',
    stages: [
      {
        title: 'Dopo il parto',
        subtitle: 'Inizio del periodo post-partum',
        text: 'Il corpo inizia gradualmente il proprio recupero dopo il parto.',
      },
      {
        title: 'Lochiazioni',
        subtitle: 'Sanguinamento post-partum',
        text: 'Il sanguinamento cambia gradualmente per quantità e colore.',
      },
      {
        title: 'Diminuzione graduale',
        subtitle: 'Nell’arco di diverse settimane',
        text: 'Il sanguinamento di solito diminuisce nel tempo.',
      },
      {
        title: 'Ritorno graduale',
        subtitle: 'Verso il ciclo abituale',
        text: 'Il ciclo mestruale può poi riprendere gradualmente.',
      },
    ],
    h2Section3: '3. Come evolvono le lochiazioni',
    body3: 'Le lochiazioni di solito cambiano colore gradualmente e diminuiscono di quantità. Tuttavia, questa progressione può variare da persona a persona.',
    lochiaEvolution: [
      {
        title: 'Lochiazioni rosse',
        period: 'Primi giorni',
        text: 'Il sanguinamento è di solito rosso e può essere più abbondante all’inizio.',
      },
      {
        title: 'Lochiazioni rosate / brunastre',
        period: 'Dopo alcuni giorni',
        text: 'Il colore può diventare più chiaro o brunastro man mano che il flusso diminuisce.',
      },
      {
        title: 'Lochiazioni biancastre',
        period: 'Settimane successive',
        text: 'Il sanguinamento diventa gradualmente più leggero e meno abbondante.',
      },
    ],
    infoTitle: 'Punti chiave',
    infoText: 'Il colore e la quantità delle lochiazioni possono cambiare gradualmente. La progressione esatta non è uguale per tutte.',
    h2Section4: '4. Prendersi cura di sé',
    body4: 'In questo periodo, alcune semplici abitudini possono aiutare il comfort e sostenere il recupero del corpo.',
    careTips: [
      {
        title: 'Igiene delicata',
        text: 'Mantieni una routine di igiene quotidiana semplice e confortevole.',
      },
      {
        title: 'Riposo',
        text: 'Concedi al tuo corpo il tempo di recuperare.',
      },
      {
        title: 'Idratazione',
        text: 'Ricordati di bere regolarmente in base alle tue esigenze.',
      },
      {
        title: 'Alimentazione',
        text: 'Un’alimentazione varia sostiene il recupero.',
      },
    ],
    h2Section5: '5. Quando chiedere consiglio',
    body5: 'Alcune situazioni richiedono un consiglio tempestivo da parte di un professionista sanitario, in particolare quando un cambiamento sembra significativo, improvviso o insolito.',
    warningTitle: 'Segnali da non ignorare',
    warningSubtitle: 'Se necessario, chiedi il parere di un professionista',
    warningSigns: [
      'Un odore forte o insolito nel sanguinamento',
      'Febbre o un peggioramento delle condizioni generali',
      'Un sanguinamento che diventa improvvisamente molto abbondante',
      'Dolore intenso, persistente o insolito',
      'Un nuovo sintomo che ti preoccupa',
    ],
    tipTitle: 'Da sapere',
    tipText: 'Ogni recupero post-partum è diverso. Le informazioni di questo articolo hanno lo scopo di offrire un orientamento generale e non sostituiscono una visita medica.',
    summaryHeading: 'Punti chiave',
    summary: [
      'Il Nifas è un termine usato nel contesto religioso dopo il parto.',
      'Dal punto di vista medico, il sanguinamento post-partum si chiama lochiazioni.',
      'Le lochiazioni cambiano gradualmente per colore e quantità.',
      'Riposo, igiene delicata e una buona idratazione sostengono il recupero.',
      'Un cambiamento insolito o preoccupante merita il parere di un professionista.',
    ],
    disclaimerText: 'Contenuto informativo. Le informazioni mediche qui presentate sono di carattere generale e non sostituiscono il parere di un professionista sanitario. Per questioni religiose specifiche, si consiglia di rivolgersi a una fonte religiosa qualificata.',
    shareMessage: 'Nifas: aspetti medici — AWA',
  },
  tr: {
    badge: 'DOĞUM SONRASI • NİFAS',
    title: 'Nifas:\ntıbbi yönleri',
    metaDuration: '5 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Bilgilendirici içerik',
    intro: 'Doğumdan sonra beden, kademeli bir iyileşme dönemi geçirir. Doğum sonrası kanamayı, nasıl seyrettiğini ve dikkat gerektiren belirtileri anlamak, bu dönemde kendini daha bilgili hissetmene yardımcı olabilir.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Nifas teriminin anlamı',
      'Doğum sonrası tıbbi seyir',
      'Loşya nasıl değişir',
      'Kendine iyi bakmak',
      'Ne zaman görüş alınmalı',
      'Akılda tutulacaklar',
    ],
    h2Section1: '1. “Nifas” teriminin anlamı',
    body1a: '“Nifas” terimi dinî sözlüğe aittir ve İslam hukuku kuralları çerçevesinde doğumu izleyen kanamayla ilişkili dönemi ifade eder.',
    body1b: 'Tıbbi olarak, doğumdan sonra görülen kanamaya “loşya” denir. Bu iki kavram ayrı ayrı ele alınabilir: biri dinî bir çerçeveye aittir, diğeri fizyolojik bir olguyu tanımlar.',
    distinction: {
      nifasTitle: 'Nifas',
      nifasText: 'Doğum sonrasında dinî çerçeveye ait bir kavram.',
      lochiaTitle: 'Loşya',
      lochiaText: 'Doğum sonrası kanama için kullanılan tıbbi terim.',
    },
    h2Section2: '2. Doğum sonrası tıbbi seyir',
    body2: 'Doğum sonrası iyileşme kademeli olarak gerçekleşir. Rahim olağan durumuna dönmeye devam ettikçe doğum sonrası kanama genellikle zamanla değişir.',
    schemaTitle: 'Doğum sonrası seyir',
    schemaSubtitle: 'Basitleştirilmiş tıbbi referans',
    stages: [
      {
        title: 'Doğumdan sonra',
        subtitle: 'Doğum sonrası dönemin başlangıcı',
        text: 'Beden, doğumdan sonra yavaş yavaş iyileşmeye başlar.',
      },
      {
        title: 'Loşya',
        subtitle: 'Doğum sonrası kanama',
        text: 'Kanamanın miktarı ve rengi yavaş yavaş değişir.',
      },
      {
        title: 'Kademeli azalma',
        subtitle: 'Birkaç hafta boyunca',
        text: 'Kanama genellikle zamanla azalır.',
      },
      {
        title: 'Kademeli dönüş',
        subtitle: 'Olağan döngüye doğru',
        text: 'Adet döngüsü ardından yavaş yavaş yeniden başlayabilir.',
      },
    ],
    h2Section3: '3. Loşya nasıl değişir',
    body3: 'Loşya genellikle rengini yavaş yavaş değiştirir ve miktarı azalır. Ancak bu seyir kişiden kişiye değişebilir.',
    lochiaEvolution: [
      {
        title: 'Kırmızı loşya',
        period: 'İlk günler',
        text: 'Kanama genellikle kırmızıdır ve başlangıçta daha yoğun olabilir.',
      },
      {
        title: 'Pembe / kahverengimsi loşya',
        period: 'Birkaç gün sonra',
        text: 'Akış azaldıkça renk daha açık ya da kahverengimsi olabilir.',
      },
      {
        title: 'Beyazımsı loşya',
        period: 'Sonraki haftalar',
        text: 'Kanama yavaş yavaş hafifler ve azalır.',
      },
    ],
    infoTitle: 'Akılda tutulacaklar',
    infoText: 'Loşyanın rengi ve miktarı yavaş yavaş değişebilir. Kesin seyir herkes için aynı değildir.',
    h2Section4: '4. Kendine iyi bakmak',
    body4: 'Bu dönemde birkaç basit alışkanlık rahatlığa yardımcı olabilir ve bedenin iyileşmesini destekleyebilir.',
    careTips: [
      {
        title: 'Nazik hijyen',
        text: 'Günlük hijyenini basit ve rahat bir düzende sürdür.',
      },
      {
        title: 'Dinlenme',
        text: 'Bedenine iyileşmesi için zaman tanı.',
      },
      {
        title: 'Sıvı alımı',
        text: 'İhtiyacına göre düzenli olarak su içmeyi unutma.',
      },
      {
        title: 'Beslenme',
        text: 'Çeşitli bir beslenme iyileşmeyi destekler.',
      },
    ],
    h2Section5: '5. Ne zaman görüş alınmalı',
    body5: 'Bazı durumlar, özellikle bir değişiklik belirgin, ani ya da olağan dışı göründüğünde, bir sağlık uzmanından hızlıca görüş almayı gerektirir.',
    warningTitle: 'Göz ardı edilmemesi gereken belirtiler',
    warningSubtitle: 'Gerekirse bir uzmandan görüş al',
    warningSigns: [
      'Kanamada keskin ya da olağan dışı bir koku',
      'Ateş ya da genel durumun kötüleşmesi',
      'Kanamanın birdenbire çok yoğunlaşması',
      'Şiddetli, geçmeyen ya da olağan dışı ağrı',
      'Seni endişelendiren yeni bir belirti',
    ],
    tipTitle: 'Bilmekte fayda var',
    tipText: 'Her doğum sonrası iyileşme farklıdır. Bu makaledeki bilgiler genel bir yol gösterici olmayı amaçlar ve bir doktor muayenesinin yerini almaz.',
    summaryHeading: 'Akılda tutulacaklar',
    summary: [
      'Nifas, doğum sonrasında dinî bağlamda kullanılan bir terimdir.',
      'Tıbbi olarak doğum sonrası kanamaya loşya denir.',
      'Loşya renk ve miktar bakımından yavaş yavaş değişir.',
      'Dinlenme, nazik hijyen ve yeterli sıvı alımı iyileşmeyi destekler.',
      'Olağan dışı ya da endişe verici bir değişiklik uzman görüşünü hak eder.',
    ],
    disclaimerText: 'Bilgilendirici içerik. Burada sunulan tıbbi bilgiler geneldir ve bir sağlık uzmanının görüşünün yerini almaz. Belirli dinî sorular için yetkin bir dinî kaynağa başvurulması önerilir.',
    shareMessage: 'Nifas: tıbbi yönleri — AWA',
  },
  ru: {
    badge: 'ПОСЛЕРОДОВОЙ ПЕРИОД • НИФАС',
    title: 'Нифас:\nмедицинские аспекты',
    metaDuration: '5 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Для начинающих',
    metaValidated: 'Информационный материал',
    intro:
      'После родов организм проходит через период постепенного восстановления. Понимание того, как протекают послеродовые выделения, как они меняются и какие признаки требуют внимания, поможет вам чувствовать себя более осведомлённой в этот период.',
    contentsTitle: 'В этой статье',
    topics: [
      'Что означает термин «нифас»',
      'Медицинская картина после родов',
      'Как меняются лохии',
      'Забота о себе',
      'Когда обратиться за советом',
      'Главное, что стоит запомнить',
    ],
    h2Section1: '1. Что означает термин «нифас»',
    body1a:
      'Термин «нифас» относится к религиозной лексике и обозначает период, связанный с кровотечением после родов, в рамках исламского права.',
    body1b:
      'С медицинской точки зрения кровотечение, наблюдаемое после родов, называется «лохии». Эти два понятия можно рассматривать отдельно: одно относится к религиозной сфере, другое описывает физиологическое явление.',
    distinction: {
      nifasTitle: 'Нифас',
      nifasText: 'Понятие из религиозной сферы, относящееся к периоду после родов.',
      lochiaTitle: 'Лохии',
      lochiaText: 'Медицинский термин, обозначающий послеродовые выделения.',
    },
    h2Section2: '2. Медицинская картина после родов',
    body2:
      'Послеродовое восстановление происходит постепенно. Послеродовые выделения, как правило, меняются со временем по мере того, как матка продолжает возвращаться в обычное состояние.',
    schemaTitle: 'Течение послеродового периода',
    schemaSubtitle: 'Упрощённая медицинская схема',
    stages: [
      {
        title: 'После родов',
        subtitle: 'Начало послеродового периода',
        text: 'Организм постепенно начинает восстанавливаться после родов.',
      },
      {
        title: 'Лохии',
        subtitle: 'Послеродовые выделения',
        text: 'Количество и цвет выделений постепенно меняются.',
      },
      {
        title: 'Постепенное уменьшение',
        subtitle: 'В течение нескольких недель',
        text: 'Со временем выделения, как правило, уменьшаются.',
      },
      {
        title: 'Постепенное возвращение',
        subtitle: 'К привычному циклу',
        text: 'Затем менструальный цикл может постепенно возобновиться.',
      },
    ],
    h2Section3: '3. Как меняются лохии',
    body3:
      'Лохии, как правило, постепенно меняют цвет и становятся менее обильными. Однако это течение может отличаться у разных женщин.',
    lochiaEvolution: [
      {
        title: 'Красные лохии',
        period: 'Первые дни',
        text: 'Выделения обычно красного цвета и в начале могут быть более обильными.',
      },
      {
        title: 'Розоватые / коричневатые лохии',
        period: 'Через несколько дней',
        text: 'По мере уменьшения выделений цвет может становиться светлее или коричневатым.',
      },
      {
        title: 'Беловатые лохии',
        period: 'В последующие недели',
        text: 'Выделения постепенно становятся светлее и менее обильными.',
      },
    ],
    infoTitle: 'Главное',
    infoText:
      'Цвет и количество лохий могут постепенно меняться. Точное течение этого процесса у всех разное.',
    h2Section4: '4. Забота о себе',
    body4:
      'В этот период несколько простых привычек могут помочь чувствовать себя комфортнее и поддержать восстановление организма.',
    careTips: [
      {title: 'Бережная гигиена', text: 'Придерживайтесь простой и комфортной ежедневной гигиены.'},
      {title: 'Отдых', text: 'Дайте организму время восстановиться.'},
      {title: 'Питьевой режим', text: 'Не забывайте регулярно пить в соответствии с вашими потребностями.'},
      {title: 'Питание', text: 'Разнообразное питание поддерживает восстановление.'},
    ],
    h2Section5: '5. Когда обратиться за советом',
    body5:
      'В некоторых ситуациях необходимо как можно скорее обратиться за советом к медицинскому специалисту, особенно если изменение кажется значительным, внезапным или необычным.',
    warningTitle: 'Признаки, которые нельзя игнорировать',
    warningSubtitle: 'При необходимости обратитесь к специалисту',
    warningSigns: [
      'Сильный или необычный запах выделений',
      'Повышение температуры или ухудшение общего состояния',
      'Внезапное резкое усиление кровотечения',
      'Сильная, не проходящая или необычная боль',
      'Новый симптом, который вас беспокоит',
    ],
    tipTitle: 'ПОЛЕЗНО ЗНАТЬ',
    tipText:
      'Послеродовое восстановление у каждой женщины проходит по-своему. Информация в этой статье носит общий ориентировочный характер и не заменяет медицинскую консультацию.',
    summaryHeading: 'Главное, что стоит запомнить',
    summary: [
      'Нифас — термин, используемый в религиозном контексте после родов.',
      'С медицинской точки зрения послеродовые выделения называются лохиями.',
      'Лохии постепенно меняют цвет и количество.',
      'Отдых, бережная гигиена и достаточное питьё поддерживают восстановление.',
      'Необычное или тревожное изменение требует консультации специалиста.',
    ],
    disclaimerText:
      'Информационный материал. Представленная здесь медицинская информация носит общий характер и не заменяет рекомендации медицинского специалиста. По конкретным религиозным вопросам рекомендуется обращаться к компетентному религиозному источнику.',
    shareMessage: 'Нифас: медицинские аспекты — AWA',
  },
  de: {
    badge: 'WOCHENBETT • NIFAS',
    title: 'Nifas:\nmedizinische Aspekte',
    metaDuration: '5 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Einsteiger',
    metaValidated: 'Informationsinhalt',
    intro:
      'Nach der Geburt durchläuft der Körper eine Phase allmählicher Erholung. Wenn du die Blutung im Wochenbett, ihren Verlauf und die Anzeichen verstehst, die Aufmerksamkeit erfordern, kannst du dich in dieser Zeit besser informiert fühlen.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Den Begriff Nifas verstehen',
      'Der medizinische Verlauf nach der Geburt',
      'Wie sich der Wochenfluss entwickelt',
      'Gut für dich sorgen',
      'Wann du Rat suchen solltest',
      'Das Wichtigste in Kürze',
    ],
    h2Section1: '1. Den Begriff „Nifas“ verstehen',
    body1a:
      'Der Begriff „Nifas“ gehört zum religiösen Vokabular und bezeichnet im Rahmen der islamischen Rechtslehre die Zeit, die mit der Blutung nach der Geburt verbunden ist.',
    body1b:
      'Medizinisch wird die Blutung nach der Geburt „Wochenfluss“ (Lochien) genannt. Diese beiden Begriffe lassen sich getrennt betrachten: Der eine gehört zu einem religiösen Rahmen, der andere beschreibt ein körperliches Geschehen.',
    distinction: {
      nifasTitle: 'Nifas',
      nifasText: 'Ein Begriff aus dem religiösen Rahmen nach der Geburt.',
      lochiaTitle: 'Wochenfluss',
      lochiaText: 'Medizinischer Begriff für die Blutung im Wochenbett.',
    },
    h2Section2: '2. Der medizinische Verlauf nach der Geburt',
    body2:
      'Die Erholung im Wochenbett verläuft allmählich. Die Blutung im Wochenbett verändert sich im Allgemeinen mit der Zeit, während sich die Gebärmutter weiter in ihren gewohnten Zustand zurückbildet.',
    schemaTitle: 'Verlauf im Wochenbett',
    schemaSubtitle: 'Vereinfachte medizinische Orientierung',
    stages: [
      {
        title: 'Nach der Geburt',
        subtitle: 'Beginn des Wochenbetts',
        text: 'Der Körper beginnt nach der Geburt allmählich mit seiner Erholung.',
      },
      {
        title: 'Wochenfluss',
        subtitle: 'Blutung im Wochenbett',
        text: 'Die Blutung verändert sich nach und nach in Menge und Farbe.',
      },
      {
        title: 'Allmählicher Rückgang',
        subtitle: 'Über mehrere Wochen',
        text: 'Die Blutung nimmt im Allgemeinen mit der Zeit ab.',
      },
      {
        title: 'Allmähliche Rückkehr',
        subtitle: 'Zum gewohnten Zyklus',
        text: 'Der Menstruationszyklus kann danach allmählich wieder einsetzen.',
      },
    ],
    h2Section3: '3. Wie sich der Wochenfluss entwickelt',
    body3:
      'Der Wochenfluss ändert im Allgemeinen nach und nach seine Farbe und nimmt in der Menge ab. Dieser Verlauf kann jedoch von Person zu Person unterschiedlich sein.',
    lochiaEvolution: [
      {
        title: 'Roter Wochenfluss',
        period: 'Erste Tage',
        text: 'Die Blutung ist meist rot und kann am Anfang stärker sein.',
      },
      {
        title: 'Rosafarbener / bräunlicher Wochenfluss',
        period: 'Nach einigen Tagen',
        text: 'Die Farbe kann heller oder bräunlich werden, wenn der Fluss nachlässt.',
      },
      {
        title: 'Weißlicher Wochenfluss',
        period: 'In den folgenden Wochen',
        text: 'Die Blutung wird nach und nach schwächer und weniger.',
      },
    ],
    infoTitle: 'Das Wichtigste in Kürze',
    infoText:
      'Farbe und Menge des Wochenflusses können sich allmählich verändern. Der genaue Verlauf ist nicht bei jeder Frau gleich.',
    h2Section4: '4. Gut für dich sorgen',
    body4:
      'In dieser Zeit können ein paar einfache Gewohnheiten das Wohlbefinden fördern und die Erholung des Körpers unterstützen.',
    careTips: [
      {title: 'Sanfte Hygiene', text: 'Pflege eine einfache, angenehme tägliche Hygieneroutine.'},
      {title: 'Ruhe', text: 'Gib deinem Körper Zeit, sich zu erholen.'},
      {title: 'Flüssigkeit', text: 'Denk daran, je nach Bedarf regelmäßig zu trinken.'},
      {title: 'Ernährung', text: 'Eine abwechslungsreiche Ernährung unterstützt die Erholung.'},
    ],
    h2Section5: '5. Wann du Rat suchen solltest',
    body5:
      'In bestimmten Situationen ist zeitnaher Rat von medizinischem Fachpersonal angezeigt, besonders wenn eine Veränderung erheblich, plötzlich oder ungewöhnlich erscheint.',
    warningTitle: 'Anzeichen, die du nicht ignorieren solltest',
    warningSubtitle: 'Hole bei Bedarf fachlichen Rat ein',
    warningSigns: [
      'Ein starker oder ungewöhnlicher Geruch der Blutung',
      'Fieber oder eine Verschlechterung des Allgemeinzustands',
      'Eine Blutung, die plötzlich sehr stark wird',
      'Starke, anhaltende oder ungewöhnliche Schmerzen',
      'Ein neues Symptom, das dich beunruhigt',
    ],
    tipTitle: 'Gut zu wissen',
    tipText:
      'Jede Erholung im Wochenbett ist anders. Die Informationen in diesem Artikel dienen der allgemeinen Orientierung und ersetzen keine ärztliche Beratung.',
    summaryHeading: 'Das Wichtigste in Kürze',
    summary: [
      'Nifas ist ein Begriff, der im religiösen Zusammenhang nach der Geburt verwendet wird.',
      'Medizinisch heißt die Blutung im Wochenbett Wochenfluss (Lochien).',
      'Der Wochenfluss verändert sich nach und nach in Farbe und Menge.',
      'Ruhe, sanfte Hygiene und ausreichend Flüssigkeit unterstützen die Erholung.',
      'Eine ungewöhnliche oder beunruhigende Veränderung verdient fachlichen Rat.',
    ],
    disclaimerText:
      'Informationsinhalt. Die hier dargestellten medizinischen Informationen sind allgemein gehalten und ersetzen nicht den Rat von medizinischem Fachpersonal. Bei konkreten religiösen Fragen wird empfohlen, eine fachkundige religiöse Quelle heranzuziehen.',
    shareMessage: 'Nifas: medizinische Aspekte — AWA',
  },
  zh: {
      badge: '产后 • 恶露期（Nifas）',
      title: '产后恶露期（Nifas）：\n医学角度',
      metaDuration: '阅读约 5 分钟',
      metaType: '指南',
      metaLevel: '入门',
      metaValidated: '科普内容',
      intro: '分娩后，身体会经历一个循序渐进的恢复期。了解产后出血的变化过程，以及哪些信号需要留意，可以让你在这段时间里心里更有数。',
      contentsTitle: '本文内容',
      topics: [
        '了解“Nifas”这个词',
        '产后的医学规律',
        '恶露如何变化',
        '照顾好自己',
        '何时需要寻求建议',
        '要点回顾',
      ],
      h2Section1: '1. 了解“Nifas”这个词',
      body1a: '“Nifas”属于宗教词汇，指伊斯兰教法规则中与分娩后出血相关的时期。',
      body1b: '在医学上，分娩后的出血被称为“恶露”。这两个概念可以分开来看：一个属于宗教范畴，另一个描述的是生理现象。',
      distinction: {
        nifasTitle: 'Nifas',
        nifasText: '分娩后属于宗教范畴的概念。',
        lochiaTitle: '恶露',
        lochiaText: '用于描述产后出血的医学术语。',
      },
      h2Section2: '2. 产后的医学规律',
      body2: '产后恢复是逐步进行的。随着子宫不断恢复到原来的状态，产后出血通常会随时间发生变化。',
      schemaTitle: '产后恢复进程',
      schemaSubtitle: '简化的医学参考',
      stages: [
        {
          title: '分娩后',
          subtitle: '产后期开始',
          text: '分娩后，身体开始逐步恢复。',
        },
        {
          title: '恶露',
          subtitle: '产后出血',
          text: '出血的量和颜色会逐渐变化。',
        },
        {
          title: '逐渐减少',
          subtitle: '持续数周',
          text: '出血通常会随时间逐渐减少。',
        },
        {
          title: '逐渐恢复',
          subtitle: '回到原来的周期',
          text: '之后，月经周期可能会逐渐恢复。',
        },
      ],
      h2Section3: '3. 恶露如何变化',
      body3: '恶露的颜色通常会逐渐变化，量也会逐渐减少。不过，这个过程因人而异。',
      lochiaEvolution: [
        {
          title: '红色恶露',
          period: '最初几天',
          text: '出血通常为红色，刚开始时量可能较多。',
        },
        {
          title: '粉红色／褐色恶露',
          period: '几天之后',
          text: '随着量减少，颜色可能变淡或变成褐色。',
        },
        {
          title: '淡白色恶露',
          period: '之后的几周',
          text: '出血逐渐变淡，量也越来越少。',
        },
      ],
      infoTitle: '要点回顾',
      infoText: '恶露的颜色和量会逐渐变化，具体过程因人而异。',
      h2Section4: '4. 照顾好自己',
      body4: '在这段时间里，一些简单的习惯有助于让你感觉舒适，并支持身体恢复。',
      careTips: [
        {
          title: '温和清洁',
          text: '保持简单、舒适的日常清洁习惯。',
        },
        {
          title: '休息',
          text: '给身体足够的恢复时间。',
        },
        {
          title: '补水',
          text: '记得根据自己的需要规律地喝水。',
        },
        {
          title: '营养',
          text: '均衡多样的饮食有助于恢复。',
        },
      ],
      h2Section5: '5. 何时需要寻求建议',
      body5: '有些情况需要尽快向医疗专业人员咨询，尤其是当变化明显、突然或不寻常时。',
      warningTitle: '不要忽视的信号',
      warningSubtitle: '如有需要，请寻求专业建议',
      warningSigns: [
        '出血带有强烈或异常的气味',
        '发热，或整体状况变差',
        '出血突然变得非常多',
        '明显、持续或异常的疼痛',
        '出现让你担心的新症状',
      ],
      tipTitle: '小贴士',
      tipText: '每个人的产后恢复都不一样。本文信息仅供一般性参考，不能替代医生的诊疗。',
      summaryHeading: '要点回顾',
      summary: [
        'Nifas 是分娩后宗教语境中使用的术语。',
        '在医学上，产后出血称为恶露。',
        '恶露的颜色和量会逐渐变化。',
        '休息、温和清洁和充足饮水有助于恢复。',
        '出现异常或令人担心的变化时，值得寻求专业建议。',
      ],
      disclaimerText: '科普内容。这里提供的医学信息属于一般性信息，不能替代医疗专业人员的建议。如有具体的宗教问题，建议咨询有资质的宗教人士。',
      shareMessage: '产后恶露期（Nifas）：医学角度 — AWA',
    },
  id: {
    badge: 'PASCAPERSALINAN • NIFAS',
    title: 'Nifas:\naspek medis',
    metaDuration: '5 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Pemula',
    metaValidated: 'Konten informatif',
    intro: 'Setelah melahirkan, tubuh melalui masa pemulihan yang berlangsung bertahap. Memahami perdarahan pascapersalinan, perkembangannya, dan tanda-tanda yang perlu diperhatikan bisa membuatmu lebih tenang dan terinformasi selama masa ini.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Memahami istilah Nifas',
      'Pola medis setelah melahirkan',
      'Perkembangan lokia',
      'Merawat dirimu',
      'Kapan perlu meminta saran',
      'Poin-poin penting',
    ],
    h2Section1: '1. Memahami istilah "Nifas"',
    body1a: 'Istilah "Nifas" termasuk dalam kosakata keagamaan dan merujuk pada masa yang berkaitan dengan perdarahan setelah melahirkan menurut kaidah fikih Islam.',
    body1b: 'Secara medis, perdarahan yang terjadi setelah melahirkan disebut "lokia." Kedua pengertian ini bisa dipahami secara terpisah: yang satu berada dalam kerangka keagamaan, yang lain menggambarkan fenomena fisiologis.',
    distinction: {
      nifasTitle: 'Nifas',
      nifasText: 'Pengertian dalam kerangka keagamaan setelah melahirkan.',
      lochiaTitle: 'Lokia',
      lochiaText: 'Istilah medis untuk perdarahan pascapersalinan.',
    },
    h2Section2: '2. Pola medis setelah melahirkan',
    body2: 'Pemulihan pascapersalinan berlangsung bertahap. Perdarahan pascapersalinan umumnya berubah seiring waktu karena rahim terus kembali ke kondisi biasanya.',
    schemaTitle: 'Perkembangan pascapersalinan',
    schemaSubtitle: 'Acuan medis yang disederhanakan',
    stages: [
      {
        title: 'Setelah melahirkan',
        subtitle: 'Awal masa pascapersalinan',
        text: 'Tubuh mulai pulih secara bertahap setelah melahirkan.',
      },
      {
        title: 'Lokia',
        subtitle: 'Perdarahan pascapersalinan',
        text: 'Perdarahan berubah secara bertahap dalam jumlah dan warna.',
      },
      {
        title: 'Menurun bertahap',
        subtitle: 'Selama beberapa minggu',
        text: 'Perdarahan umumnya berkurang seiring waktu.',
      },
      {
        title: 'Kembali bertahap',
        subtitle: 'Menuju siklus yang biasa',
        text: 'Siklus menstruasi kemudian bisa kembali secara bertahap.',
      },
    ],
    h2Section3: '3. Perkembangan lokia',
    body3: 'Lokia umumnya berubah warna secara bertahap dan jumlahnya berkurang. Namun, perkembangan ini bisa berbeda dari satu orang ke orang lain.',
    lochiaEvolution: [
      {
        title: 'Lokia merah',
        period: 'Beberapa hari pertama',
        text: 'Perdarahan biasanya berwarna merah dan bisa lebih banyak di awal.',
      },
      {
        title: 'Lokia merah muda / kecokelatan',
        period: 'Setelah beberapa hari',
        text: 'Warnanya bisa menjadi lebih terang atau kecokelatan seiring berkurangnya aliran darah.',
      },
      {
        title: 'Lokia keputihan',
        period: 'Minggu-minggu berikutnya',
        text: 'Perdarahan perlahan menjadi lebih ringan dan lebih sedikit.',
      },
    ],
    infoTitle: 'Poin-poin penting',
    infoText: 'Warna dan jumlah lokia bisa berubah secara bertahap. Perkembangannya tidak persis sama pada setiap orang.',
    h2Section4: '4. Merawat dirimu',
    body4: 'Selama masa ini, beberapa kebiasaan sederhana bisa membantu kenyamananmu dan mendukung pemulihan tubuh.',
    careTips: [
      {
        title: 'Kebersihan yang lembut',
        text: 'Jaga rutinitas kebersihan harian yang sederhana dan nyaman.',
      },
      {
        title: 'Istirahat',
        text: 'Beri tubuhmu waktu untuk pulih.',
      },
      {
        title: 'Asupan air',
        text: 'Ingatlah untuk minum secara teratur sesuai kebutuhanmu.',
      },
      {
        title: 'Nutrisi',
        text: 'Makanan yang bervariasi mendukung pemulihan.',
      },
    ],
    h2Section5: '5. Kapan perlu meminta saran',
    body5: 'Beberapa kondisi memerlukan saran cepat dari tenaga kesehatan, terutama jika perubahan yang terjadi terasa signifikan, mendadak, atau tidak biasa.',
    warningTitle: 'Tanda yang tidak boleh diabaikan',
    warningSubtitle: 'Minta saran profesional jika perlu',
    warningSigns: [
      'Bau yang kuat atau tidak biasa pada perdarahan',
      'Demam atau kondisi umum yang memburuk',
      'Perdarahan yang tiba-tiba menjadi sangat banyak',
      'Nyeri yang hebat, menetap, atau tidak biasa',
      'Gejala baru yang membuatmu khawatir',
    ],
    tipTitle: 'Perlu diketahui',
    tipText: 'Setiap pemulihan pascapersalinan berbeda-beda. Informasi dalam artikel ini dimaksudkan sebagai panduan umum dan tidak menggantikan konsultasi medis.',
    summaryHeading: 'Poin-poin penting',
    summary: [
      'Nifas adalah istilah yang digunakan dalam konteks keagamaan setelah melahirkan.',
      'Secara medis, perdarahan pascapersalinan disebut lokia.',
      'Lokia berubah secara bertahap dalam warna dan jumlah.',
      'Istirahat, kebersihan yang lembut, dan asupan air yang cukup mendukung pemulihan.',
      'Perubahan yang tidak biasa atau mengkhawatirkan perlu dikonsultasikan kepada profesional.',
    ],
    disclaimerText: 'Konten informatif. Informasi medis yang disajikan di sini bersifat umum dan tidak menggantikan saran tenaga kesehatan. Untuk pertanyaan keagamaan yang spesifik, disarankan merujuk pada sumber keagamaan yang kompeten.',
    shareMessage: 'Nifas: aspek medis — AWA',
  },
  hi: {
    badge: 'प्रसवोत्तर • निफ़ास',
    title: 'निफ़ास:\nचिकित्सकीय पहलू',
    metaDuration: '5 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'शुरुआती',
    metaValidated: 'जानकारी देने वाली सामग्री',
    intro: 'बच्चे के जन्म के बाद शरीर धीरे-धीरे ठीक होने के दौर से गुज़रता है। प्रसव के बाद के रक्तस्राव, उसके बदलाव और ध्यान देने लायक संकेतों को समझना इस समय में आपको ज़्यादा जानकार महसूस कराने में मदद कर सकता है।',
    contentsTitle: 'इस लेख में',
    topics: [
      'निफ़ास शब्द को समझना',
      'प्रसव के बाद का चिकित्सकीय क्रम',
      'लोकिया कैसे बदलता है',
      'अपना ख्याल रखना',
      'सलाह कब लें',
      'मुख्य बातें',
    ],
    h2Section1: '1. "निफ़ास" शब्द को समझना',
    body1a: '"निफ़ास" शब्द धार्मिक शब्दावली का है और इस्लामी फ़िक़्ह के नियमों के दायरे में प्रसव के बाद होने वाले रक्तस्राव से जुड़ी अवधि को बताता है।',
    body1b: 'चिकित्सकीय रूप से प्रसव के बाद देखे जाने वाले रक्तस्राव को "लोकिया" कहा जाता है। इन दोनों धारणाओं को अलग-अलग देखा जा सकता है: एक धार्मिक दायरे से जुड़ी है, दूसरी एक शारीरिक प्रक्रिया का वर्णन करती है।',
    distinction: {
      nifasTitle: 'निफ़ास',
      nifasText: 'प्रसव के बाद के धार्मिक दायरे से जुड़ी एक धारणा।',
      lochiaTitle: 'लोकिया',
      lochiaText: 'प्रसव के बाद के रक्तस्राव के लिए इस्तेमाल होने वाला चिकित्सकीय शब्द।',
    },
    h2Section2: '2. प्रसव के बाद का चिकित्सकीय क्रम',
    body2: 'प्रसव के बाद की रिकवरी धीरे-धीरे होती है। गर्भाशय जैसे-जैसे अपनी सामान्य अवस्था में लौटता रहता है, प्रसव के बाद का रक्तस्राव आमतौर पर समय के साथ बदलता जाता है।',
    schemaTitle: 'प्रसव के बाद की प्रगति',
    schemaSubtitle: 'सरल चिकित्सकीय संदर्भ',
    stages: [
      {
        title: 'प्रसव के बाद',
        subtitle: 'प्रसवोत्तर अवधि की शुरुआत',
        text: 'प्रसव के बाद शरीर धीरे-धीरे ठीक होना शुरू करता है।',
      },
      {
        title: 'लोकिया',
        subtitle: 'प्रसव के बाद का रक्तस्राव',
        text: 'रक्तस्राव की मात्रा और रंग धीरे-धीरे बदलते हैं।',
      },
      {
        title: 'धीरे-धीरे कमी',
        subtitle: 'कई सप्ताहों में',
        text: 'रक्तस्राव आमतौर पर समय के साथ कम होता जाता है।',
      },
      {
        title: 'धीरे-धीरे वापसी',
        subtitle: 'सामान्य चक्र की ओर',
        text: 'इसके बाद मासिक चक्र धीरे-धीरे फिर से शुरू हो सकता है।',
      },
    ],
    h2Section3: '3. लोकिया कैसे बदलता है',
    body3: 'लोकिया का रंग आमतौर पर धीरे-धीरे बदलता है और मात्रा कम होती जाती है। फिर भी, यह बदलाव हर महिला में अलग हो सकता है।',
    lochiaEvolution: [
      {
        title: 'लाल लोकिया',
        period: 'शुरुआती दिन',
        text: 'रक्तस्राव आमतौर पर लाल होता है और शुरुआत में ज़्यादा हो सकता है।',
      },
      {
        title: 'गुलाबी / भूरा-सा लोकिया',
        period: 'कुछ दिनों के बाद',
        text: 'बहाव कम होने के साथ रंग हल्का या भूरा-सा हो सकता है।',
      },
      {
        title: 'सफ़ेद-सा लोकिया',
        period: 'आने वाले सप्ताह',
        text: 'रक्तस्राव धीरे-धीरे हल्का और कम होता जाता है।',
      },
    ],
    infoTitle: 'मुख्य बातें',
    infoText: 'लोकिया का रंग और मात्रा धीरे-धीरे बदल सकते हैं। सही बदलाव सभी में एक जैसा नहीं होता।',
    h2Section4: '4. अपना ख्याल रखना',
    body4: 'इस दौरान कुछ आसान आदतें आराम बढ़ाने और शरीर को ठीक होने में सहारा देने में मदद कर सकती हैं।',
    careTips: [
      {
        title: 'नरम सफ़ाई',
        text: 'रोज़ की सफ़ाई का एक आसान और आरामदेह तरीका अपनाएँ।',
      },
      {
        title: 'आराम',
        text: 'अपने शरीर को ठीक होने का समय दें।',
      },
      {
        title: 'पानी पीना',
        text: 'अपनी ज़रूरत के हिसाब से नियमित रूप से पानी पीना याद रखें।',
      },
      {
        title: 'खान-पान',
        text: 'विविध आहार रिकवरी में सहारा देता है।',
      },
    ],
    h2Section5: '5. सलाह कब लें',
    body5: 'कुछ स्थितियों में स्वास्थ्य विशेषज्ञ की जल्द सलाह ज़रूरी होती है, खासकर जब कोई बदलाव बड़ा, अचानक या असामान्य लगे।',
    warningTitle: 'ऐसे संकेत जिन्हें नज़रअंदाज़ न करें',
    warningSubtitle: 'ज़रूरत हो तो विशेषज्ञ की सलाह लें',
    warningSigns: [
      'रक्तस्राव में तेज़ या असामान्य गंध',
      'बुखार या सामान्य हालत का बिगड़ना',
      'रक्तस्राव का अचानक बहुत ज़्यादा हो जाना',
      'तेज़, लगातार या असामान्य दर्द',
      'कोई नया लक्षण जो आपको चिंतित करे',
    ],
    tipTitle: 'जानना ज़रूरी है',
    tipText: 'प्रसव के बाद की हर रिकवरी अलग होती है। इस लेख की जानकारी केवल सामान्य मार्गदर्शन के लिए है और डॉक्टरी परामर्श का विकल्प नहीं है।',
    summaryHeading: 'मुख्य बातें',
    summary: [
      'निफ़ास प्रसव के बाद के धार्मिक संदर्भ में इस्तेमाल होने वाला शब्द है।',
      'चिकित्सकीय रूप से प्रसव के बाद के रक्तस्राव को लोकिया कहते हैं।',
      'लोकिया का रंग और मात्रा धीरे-धीरे बदलते हैं।',
      'आराम, नरम सफ़ाई और भरपूर पानी रिकवरी में सहारा देते हैं।',
      'कोई असामान्य या चिंताजनक बदलाव हो तो विशेषज्ञ की सलाह लेनी चाहिए।',
    ],
    disclaimerText: 'जानकारी देने वाली सामग्री। यहाँ दी गई चिकित्सकीय जानकारी सामान्य है और स्वास्थ्य विशेषज्ञ की सलाह का विकल्प नहीं है। धार्मिक सवालों के लिए किसी योग्य धार्मिक स्रोत से पूछने की सलाह दी जाती है।',
    shareMessage: 'निफ़ास: चिकित्सकीय पहलू — AWA',
  },
  sq: {
    badge: 'PAS LINDJES • NIFASI',
    title: 'Nifasi:\naspektet mjekësore',
    metaDuration: '5 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje informuese',
    intro: 'Pas lindjes, trupi kalon një periudhë rikuperimi gradual. Të kuptuarit e gjakderdhjes pas lindjes, e zhvillimit të saj dhe e shenjave që kërkojnë vëmendje mund të të ndihmojë të ndihesh më e informuar në këtë kohë.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Të kuptosh termin nifas',
      'Ecuria mjekësore pas lindjes',
      'Si zhvillohet lohia',
      'Kujdesi për veten',
      'Kur të kërkosh këshillë',
      'Pikat kryesore',
    ],
    h2Section1: '1. Të kuptosh termin "nifas"',
    body1a: 'Termi "nifas" i përket fjalorit fetar dhe i referohet periudhës që lidhet me gjakderdhjen pas lindjes brenda rregullave të jurisprudencës islame.',
    body1b: 'Nga ana mjekësore, gjakderdhja e vërejtur pas lindjes quhet "lohia". Këto dy nocione mund të shihen veçmas: njëri i përket një kuadri fetar, tjetri përshkruan një fenomen fiziologjik.',
    distinction: {
      nifasTitle: 'Nifasi',
      nifasText: 'Një nocion që i përket kuadrit fetar pas lindjes.',
      lochiaTitle: 'Lohia',
      lochiaText: 'Term mjekësor që përdoret për gjakderdhjen pas lindjes.',
    },
    h2Section2: '2. Ecuria mjekësore pas lindjes',
    body2: 'Rikuperimi pas lindjes ndodh gradualisht. Gjakderdhja pas lindjes në përgjithësi ndryshon me kalimin e kohës ndërsa mitra vazhdon të kthehet në gjendjen e saj të zakonshme.',
    schemaTitle: 'Zhvillimi pas lindjes',
    schemaSubtitle: 'Pikë referimi mjekësore e thjeshtuar',
    stages: [
      {
        title: 'Pas lindjes',
        subtitle: 'Fillimi i periudhës pas lindjes',
        text: 'Trupi fillon gradualisht rikuperimin pas lindjes.',
      },
      {
        title: 'Lohia',
        subtitle: 'Gjakderdhja pas lindjes',
        text: 'Gjakderdhja ndryshon gradualisht në sasi dhe ngjyrë.',
      },
      {
        title: 'Pakësim gradual',
        subtitle: 'Gjatë disa javëve',
        text: 'Gjakderdhja në përgjithësi pakësohet me kalimin e kohës.',
      },
      {
        title: 'Kthim gradual',
        subtitle: 'Drejt ciklit të zakonshëm',
        text: 'Cikli menstrual pastaj mund të rifillojë gradualisht.',
      },
    ],
    h2Section3: '3. Si zhvillohet lohia',
    body3: 'Lohia në përgjithësi ndryshon ngjyrë gradualisht dhe pakësohet në sasi. Megjithatë, ky zhvillim mund të ndryshojë nga një grua te tjetra.',
    lochiaEvolution: [
      {
        title: 'Lohia e kuqe',
        period: 'Ditët e para',
        text: 'Gjakderdhja zakonisht është e kuqe dhe mund të jetë më e bollshme në fillim.',
      },
      {
        title: 'Lohia rozë / kafeje',
        period: 'Pas disa ditësh',
        text: 'Ngjyra mund të bëhet më e çelët ose kafeje ndërsa rrjedhja pakësohet.',
      },
      {
        title: 'Lohia e bardhë',
        period: 'Javët në vijim',
        text: 'Gjakderdhja bëhet gradualisht më e lehtë dhe më pak e bollshme.',
      },
    ],
    infoTitle: 'Pikat kryesore',
    infoText: 'Ngjyra dhe sasia e lohisë mund të ndryshojnë gradualisht. Zhvillimi i saktë nuk është i njëjtë për të gjitha.',
    h2Section4: '4. Kujdesi për veten',
    body4: 'Në këtë periudhë, disa zakone të thjeshta mund të ndihmojnë rehatinë dhe ta mbështesin rikuperimin e trupit.',
    careTips: [
      {
        title: 'Higjienë e butë',
        text: 'Mbaj një rutinë të thjeshtë dhe të rehatshme higjiene çdo ditë.',
      },
      {
        title: 'Pushimi',
        text: 'Jepi trupit tënd kohë për t’u rikuperuar.',
      },
      {
        title: 'Hidratimi',
        text: 'Mos harro të pish rregullisht, në përputhje me nevojat e tua.',
      },
      {
        title: 'Ushqimi',
        text: 'Një dietë e larmishme e mbështet rikuperimin.',
      },
    ],
    h2Section5: '5. Kur të kërkosh këshillë',
    body5: 'Disa situata kërkojnë këshillë të shpejtë nga një profesionist i shëndetësisë, veçanërisht kur një ndryshim duket i rëndësishëm, i befasishëm ose i pazakontë.',
    warningTitle: 'Shenja që nuk duhen shpërfillur',
    warningSubtitle: 'Kërko këshillë profesionale nëse është e nevojshme',
    warningSigns: [
      'Një erë e fortë ose e pazakontë në gjakderdhje',
      'Ethe ose një gjendje e përgjithshme që përkeqësohet',
      'Gjakderdhje që befas bëhet shumë e bollshme',
      'Dhimbje e fortë, e vazhdueshme ose e pazakontë',
      'Një simptomë e re që të shqetëson',
    ],
    tipTitle: 'Mirë është ta dish',
    tipText: 'Çdo rikuperim pas lindjes është i ndryshëm. Informacioni në këtë artikull ka për qëllim të japë orientim të përgjithshëm dhe nuk zëvendëson një konsultë mjekësore.',
    summaryHeading: 'Pikat kryesore',
    summary: [
      'Nifasi është një term që përdoret në kontekstin fetar pas lindjes.',
      'Nga ana mjekësore, gjakderdhja pas lindjes quhet lohia.',
      'Lohia ndryshon gradualisht në ngjyrë dhe sasi.',
      'Pushimi, higjiena e butë dhe hidratimi i mirë mbështesin rikuperimin.',
      'Një ndryshim i pazakontë ose shqetësues meriton këshillë profesionale.',
    ],
    disclaimerText: 'Përmbajtje informuese. Informacioni mjekësor i paraqitur këtu është i përgjithshëm dhe nuk zëvendëson këshillën e një profesionisti të shëndetësisë. Për pyetje specifike fetare, rekomandohet t’i drejtohesh një burimi fetar të kualifikuar.',
    shareMessage: 'Nifasi: aspektet mjekësore — AWA',
  },
  ja: {
    badge: '産後 • ニファース',
    title: 'ニファース：\n医学的な側面',
    metaDuration: '読了時間5分',
    metaType: 'ガイド',
    metaLevel: '初級',
    metaValidated: '情報提供のための内容',
    intro: '出産後、体は少しずつ回復していく期間を過ごします。産後の出血とその経過、そして注意が必要なサインを理解しておくことで、この時期について十分な情報を得る助けになります。',
    contentsTitle: 'この記事の内容',
    topics: [
      '「ニファース」という言葉について',
      '出産後の医学的な経過',
      '悪露の変化',
      '自分をいたわる',
      'どんなときに相談する？',
      'ポイントのまとめ',
    ],
    h2Section1: '1. 「ニファース」という言葉について',
    body1a: '「ニファース」は宗教用語で、イスラーム法学の規定における、出産後の出血にともなう期間を指します。',
    body1b: '医学的には、出産後に見られる出血は「悪露」と呼ばれます。この2つの概念は別々に考えることができます。一方は宗教的な枠組みに属し、もう一方は生理的な現象を表しています。',
    distinction: {
      nifasTitle: 'ニファース',
      nifasText: '出産後の宗教的な枠組みに属する概念です。',
      lochiaTitle: '悪露',
      lochiaText: '産後の出血に使われる医学用語です。',
    },
    h2Section2: '2. 出産後の医学的な経過',
    body2: '産後の回復は少しずつ進みます。産後の出血は、子宮がいつもの状態へ戻っていくにつれて、一般的に時間とともに変化します。',
    schemaTitle: '産後の経過',
    schemaSubtitle: '簡略化した医学的な目安',
    stages: [
      {
        title: '出産後',
        subtitle: '産後期の始まり',
        text: '出産後、体は少しずつ回復を始めます。',
      },
      {
        title: '悪露',
        subtitle: '産後の出血',
        text: '出血は、量と色が少しずつ変化していきます。',
      },
      {
        title: '少しずつ減る',
        subtitle: '数週間にわたって',
        text: '出血は一般的に、時間とともに減っていきます。',
      },
      {
        title: '少しずつ戻る',
        subtitle: 'いつもの周期へ',
        text: 'その後、生理周期が少しずつ再開することがあります。',
      },
    ],
    h2Section3: '3. 悪露の変化',
    body3: '悪露は一般的に、色が少しずつ変わり、量が減っていきます。ただし、この経過には個人差があります。',
    lochiaEvolution: [
      {
        title: '赤色の悪露',
        period: '最初の数日',
        text: '出血は通常赤く、始めのうちは量が多いことがあります。',
      },
      {
        title: 'ピンク色・茶色っぽい悪露',
        period: '数日後',
        text: '量が減るにつれて、色が薄くなったり茶色っぽくなったりすることがあります。',
      },
      {
        title: '白っぽい悪露',
        period: 'その後の数週間',
        text: '出血は少しずつ薄くなり、量も少なくなっていきます。',
      },
    ],
    infoTitle: 'ポイントのまとめ',
    infoText: '悪露の色と量は、少しずつ変わっていくことがあります。正確な経過は、すべての人が同じではありません。',
    h2Section4: '4. 自分をいたわる',
    body4: 'この時期は、いくつかの簡単な習慣が、快適さを保ち、体の回復を支える助けになります。',
    careTips: [
      {
        title: 'やさしい清潔ケア',
        text: '毎日、簡単で心地よい清潔ケアを続けましょう。',
      },
      {
        title: '休息',
        text: '体が回復する時間を与えましょう。',
      },
      {
        title: '水分補給',
        text: '必要に応じて、こまめに水分をとることを忘れずに。',
      },
      {
        title: '栄養',
        text: 'バランスのよい食事が回復を支えます。',
      },
    ],
    h2Section5: '5. どんなときに相談する？',
    body5: '変化が大きい、突然である、またはいつもと違うと感じる場合など、早めに医療従事者のアドバイスを受けたほうがよい状況があります。',
    warningTitle: '見過ごしてはいけないサイン',
    warningSubtitle: '必要に応じて専門家に相談しましょう',
    warningSigns: [
      '出血に強いにおい、またはいつもと違うにおいがある',
      '発熱、または全身の状態の悪化',
      '出血が急にとても多くなる',
      '強い痛み、続く痛み、またはいつもと違う痛み',
      '気になる新しい症状',
    ],
    tipTitle: '知っておきたいこと',
    tipText: '産後の回復は人それぞれです。この記事の情報は一般的な目安であり、診察に代わるものではありません。',
    summaryHeading: 'ポイントのまとめ',
    summary: [
      'ニファースは、出産後の宗教的な文脈で使われる言葉です。',
      '医学的には、産後の出血は悪露と呼ばれます。',
      '悪露は、色と量が少しずつ変化します。',
      '休息、やさしい清潔ケア、十分な水分補給が回復を支えます。',
      'いつもと違う変化や気になる変化があるときは、専門家に相談しましょう。',
    ],
    disclaimerText: '情報提供のための内容です。ここで紹介する医学的な情報は一般的なもので、医療従事者のアドバイスに代わるものではありません。宗教に関する具体的な質問については、資格のある宗教上の情報源を参照することをおすすめします。',
    shareMessage: 'ニファース：医学的な側面 — AWA',
  },
  ko: {
    badge: '산후 • 니파스',
    title: '니파스:\n의학적 측면',
    metaDuration: '5분 읽기',
    metaType: '가이드',
    metaLevel: '입문',
    metaValidated: '정보 제공용 콘텐츠',
    intro: '출산 후 몸은 서서히 회복되는 시기를 거쳐요. 산후 출혈이 어떻게 달라지는지, 주의가 필요한 신호는 무엇인지 알아 두면 이 시기를 더 잘 이해하는 데 도움이 돼요.',
    contentsTitle: '이 아티클의 내용',
    topics: [
      '니파스라는 용어 이해하기',
      '출산 후의 의학적 흐름',
      '오로는 어떻게 달라질까요',
      '나 자신 돌보기',
      '언제 조언을 구해야 할까요',
      '핵심 정리',
    ],
    h2Section1: '1. “니파스”라는 용어 이해하기',
    body1a: '“니파스”라는 용어는 종교적 어휘에 속하며, 이슬람 법학의 규정 안에서 출산 후 출혈과 관련된 기간을 가리켜요.',
    body1b: '의학적으로는 출산 후에 나타나는 출혈을 “오로”라고 해요. 이 두 개념은 따로 생각할 수 있어요. 하나는 종교적인 틀에 속하고, 다른 하나는 생리적인 현상을 설명해요.',
    distinction: {
      nifasTitle: '니파스',
      nifasText: '출산 후의 종교적인 틀에 속하는 개념이에요.',
      lochiaTitle: '오로',
      lochiaText: '산후 출혈을 가리키는 의학 용어예요.',
    },
    h2Section2: '2. 출산 후의 의학적 흐름',
    body2: '산후 회복은 서서히 이루어져요. 자궁이 원래 상태로 계속 돌아가면서 산후 출혈도 보통 시간이 지날수록 달라져요.',
    schemaTitle: '산후 경과',
    schemaSubtitle: '간단히 정리한 의학적 기준',
    stages: [
      {
        title: '출산 직후',
        subtitle: '산후 기간의 시작',
        text: '출산 후 몸이 서서히 회복되기 시작해요.',
      },
      {
        title: '오로',
        subtitle: '산후 출혈',
        text: '출혈의 양과 색이 서서히 달라져요.',
      },
      {
        title: '서서히 감소',
        subtitle: '몇 주에 걸쳐',
        text: '출혈은 보통 시간이 지나면서 줄어들어요.',
      },
      {
        title: '서서히 회복',
        subtitle: '평소 주기를 향해',
        text: '그 후 생리 주기가 서서히 다시 시작될 수 있어요.',
      },
    ],
    h2Section3: '3. 오로는 어떻게 달라질까요',
    body3: '오로는 보통 색이 서서히 변하고 양이 줄어들어요. 다만 이런 진행은 사람마다 다를 수 있어요.',
    lochiaEvolution: [
      {
        title: '붉은 오로',
        period: '처음 며칠',
        text: '출혈은 대개 붉고, 처음에는 양이 더 많을 수 있어요.',
      },
      {
        title: '분홍색 / 갈색빛 오로',
        period: '며칠 후',
        text: '양이 줄어들면서 색이 더 옅어지거나 갈색빛으로 바뀔 수 있어요.',
      },
      {
        title: '흰빛 오로',
        period: '이후 몇 주',
        text: '출혈이 서서히 옅어지고 양도 적어져요.',
      },
    ],
    infoTitle: '핵심 정리',
    infoText: '오로의 색과 양은 서서히 달라질 수 있어요. 정확한 진행 과정은 사람마다 같지 않아요.',
    h2Section4: '4. 나 자신 돌보기',
    body4: '이 시기에는 몇 가지 간단한 습관이 편안함에 도움이 되고 몸의 회복을 뒷받침해 줄 수 있어요.',
    careTips: [
      {
        title: '부드러운 위생 관리',
        text: '간단하고 편안한 일상 위생 관리를 유지해요.',
      },
      {
        title: '휴식',
        text: '몸이 회복할 시간을 주세요.',
      },
      {
        title: '수분 섭취',
        text: '필요에 맞게 규칙적으로 마시는 것을 잊지 마세요.',
      },
      {
        title: '영양',
        text: '다양한 음식을 먹으면 회복에 도움이 돼요.',
      },
    ],
    h2Section5: '5. 언제 조언을 구해야 할까요',
    body5: '변화가 크거나, 갑작스럽거나, 평소와 다르게 느껴질 때처럼 의료 전문가의 빠른 조언이 필요한 상황이 있어요.',
    warningTitle: '그냥 넘기면 안 되는 신호',
    warningSubtitle: '필요하다면 전문가의 조언을 구하세요',
    warningSigns: [
      '출혈에서 나는 강하거나 평소와 다른 냄새',
      '열이 나거나 전반적인 상태가 나빠짐',
      '출혈이 갑자기 매우 많아짐',
      '심하거나, 계속되거나, 평소와 다른 통증',
      '걱정되는 새로운 증상',
    ],
    tipTitle: '알아 두면 좋아요',
    tipText: '산후 회복은 사람마다 달라요. 이 아티클의 정보는 일반적인 안내를 위한 것이며 진료를 대신하지 않아요.',
    summaryHeading: '핵심 정리',
    summary: [
      '니파스는 출산 후 종교적인 맥락에서 쓰이는 용어예요.',
      '의학적으로 산후 출혈은 오로라고 해요.',
      '오로는 색과 양이 서서히 달라져요.',
      '휴식, 부드러운 위생 관리, 충분한 수분 섭취가 회복에 도움이 돼요.',
      '평소와 다르거나 걱정되는 변화는 전문가의 조언을 받는 것이 좋아요.',
    ],
    disclaimerText: '정보 제공용 콘텐츠예요. 여기에 나온 의학 정보는 일반적인 내용이며 의료 전문가의 조언을 대신하지 않아요. 구체적인 종교 관련 질문은 믿을 수 있는 종교 자료를 참고하는 것이 좋아요.',
    shareMessage: '니파스: 의학적 측면 — AWA',
  },
  'pt-PT': {
    badge: 'PÓS-PARTO • NIFAS',
    title: 'Nifas:\naspetos médicos',
    metaDuration: '5 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo informativo',
    intro: 'Depois do parto, o corpo passa por um período de recuperação gradual. Perceber o sangramento pós-parto, a sua evolução e os sinais que exigem atenção pode ajudá-la a sentir-se mais informada nesta fase.',
    contentsTitle: 'Neste artigo',
    topics: [
      'Perceber o termo Nifas',
      'O padrão médico depois do parto',
      'Como evoluem os lóquios',
      'Cuidar de si',
      'Quando procurar aconselhamento',
      'Pontos-chave',
    ],
    h2Section1: '1. Perceber o termo “Nifas”',
    body1a: 'O termo “Nifas” pertence ao vocabulário religioso e refere-se ao período associado ao sangramento que se segue ao parto, no quadro das regras da jurisprudência islâmica.',
    body1b: 'Do ponto de vista médico, o sangramento observado depois do parto chama-se “lóquios”. Estas duas noções podem ser consideradas separadamente: uma pertence a um quadro religioso, a outra descreve um fenómeno fisiológico.',
    distinction: {
      nifasTitle: 'Nifas',
      nifasText: 'Uma noção que pertence ao quadro religioso depois do parto.',
      lochiaTitle: 'Lóquios',
      lochiaText: 'Termo médico utilizado para o sangramento pós-parto.',
    },
    h2Section2: '2. O padrão médico depois do parto',
    body2: 'A recuperação pós-parto faz-se de forma gradual. O sangramento pós-parto muda, em geral, ao longo do tempo, à medida que o útero continua a regressar ao seu estado habitual.',
    schemaTitle: 'Evolução do pós-parto',
    schemaSubtitle: 'Referência médica simplificada',
    stages: [
      {
        title: 'Depois do parto',
        subtitle: 'Início do pós-parto',
        text: 'O corpo começa gradualmente a sua recuperação depois do parto.',
      },
      {
        title: 'Lóquios',
        subtitle: 'Hemorragia pós-parto',
        text: 'O sangramento muda gradualmente de quantidade e de cor.',
      },
      {
        title: 'Diminuição gradual',
        subtitle: 'Ao longo de várias semanas',
        text: 'O sangramento diminui, em geral, com o tempo.',
      },
      {
        title: 'Regresso gradual',
        subtitle: 'Rumo ao ciclo habitual',
        text: 'O ciclo menstrual pode então retomar-se gradualmente.',
      },
    ],
    h2Section3: '3. Como evoluem os lóquios',
    body3: 'Os lóquios mudam, em geral, gradualmente de cor e diminuem de quantidade. No entanto, esta evolução pode variar de mulher para mulher.',
    lochiaEvolution: [
      {
        title: 'Lóquios vermelhos',
        period: 'Primeiros dias',
        text: 'O sangramento é geralmente vermelho e pode ser mais abundante no início.',
      },
      {
        title: 'Lóquios rosados / acastanhados',
        period: 'Passados alguns dias',
        text: 'A cor pode tornar-se mais clara ou acastanhada à medida que o fluxo diminui.',
      },
      {
        title: 'Lóquios esbranquiçados',
        period: 'Semanas seguintes',
        text: 'O sangramento torna-se gradualmente mais ligeiro e menos abundante.',
      },
    ],
    infoTitle: 'Pontos-chave',
    infoText: 'A cor e a quantidade dos lóquios podem mudar gradualmente. A evolução exata não é igual para todas as mulheres.',
    h2Section4: '4. Cuidar de si',
    body4: 'Durante este período, alguns hábitos simples podem contribuir para o conforto e apoiar a recuperação do corpo.',
    careTips: [
      {
        title: 'Higiene suave',
        text: 'Mantenha uma rotina de higiene diária simples e confortável.',
      },
      {
        title: 'Descanso',
        text: 'Dê ao seu corpo tempo para recuperar.',
      },
      {
        title: 'Hidratação',
        text: 'Lembre-se de beber com regularidade, de acordo com as suas necessidades.',
      },
      {
        title: 'Alimentação',
        text: 'Uma alimentação variada apoia a recuperação.',
      },
    ],
    h2Section5: '5. Quando procurar aconselhamento',
    body5: 'Certas situações exigem o conselho rápido de um profissional de saúde, em particular quando uma alteração parece significativa, súbita ou fora do comum.',
    warningTitle: 'Sinais a não ignorar',
    warningSubtitle: 'Procure aconselhamento profissional se necessário',
    warningSigns: [
      'Um odor forte ou fora do comum no sangramento',
      'Febre ou agravamento do estado geral',
      'Uma hemorragia que de repente se torna muito abundante',
      'Dor intensa, persistente ou fora do comum',
      'Um novo sintoma que a preocupe',
    ],
    tipTitle: 'Bom saber',
    tipText: 'Cada recuperação no pós-parto é diferente. As informações deste artigo pretendem dar uma orientação geral e não substituem uma consulta médica.',
    summaryHeading: 'Pontos-chave',
    summary: [
      'Nifas é um termo utilizado no contexto religioso depois do parto.',
      'Do ponto de vista médico, o sangramento pós-parto chama-se lóquios.',
      'Os lóquios mudam gradualmente de cor e de quantidade.',
      'O descanso, a higiene suave e uma boa hidratação apoiam a recuperação.',
      'Uma alteração fora do comum ou preocupante merece aconselhamento profissional.',
    ],
    disclaimerText: 'Conteúdo informativo. As informações médicas aqui apresentadas são gerais e não substituem o conselho de um profissional de saúde. Para questões religiosas específicas, é recomendável consultar uma fonte religiosa qualificada.',
    shareMessage: 'Nifas: aspetos médicos — AWA',
  },
  bn: {
    badge: 'প্রসবোত্তর • নিফাস',
    title: 'নিফাস:\nচিকিৎসাগত দিক',
    metaDuration: '5 মিনিটের পাঠ',
    metaType: 'গাইড',
    metaLevel: 'প্রাথমিক',
    metaValidated: 'তথ্যমূলক বিষয়বস্তু',
    intro: 'সন্তান জন্মের পর শরীর ধীরে ধীরে সুস্থ হয়ে ওঠার একটি সময়ের মধ্য দিয়ে যায়। প্রসবোত্তর রক্তস্রাব, তা কীভাবে বদলায় এবং কোন লক্ষণে মনোযোগ দিতে হয়, তা বুঝলে এই সময়ে নিজেকে আরও ওয়াকিবহাল মনে হতে পারে।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'নিফাস শব্দটি বোঝা',
      'প্রসবের পর চিকিৎসাগত ধারা',
      'লোকিয়া কীভাবে বদলায়',
      'নিজের যত্ন নেওয়া',
      'কখন পরামর্শ নেবেন',
      'মূল কথা',
    ],
    h2Section1: '1. “নিফাস” শব্দটি বোঝা',
    body1a: '“নিফাস” শব্দটি ধর্মীয় পরিভাষার অন্তর্গত এবং ইসলামি আইনশাস্ত্রের নিয়মের আওতায় সন্তান প্রসবের পরবর্তী রক্তস্রাবের সঙ্গে সম্পর্কিত সময়কে বোঝায়।',
    body1b: 'চিকিৎসাবিজ্ঞানে প্রসবের পর দেখা দেওয়া রক্তস্রাবকে “লোকিয়া” বলা হয়। এই দুটি ধারণাকে আলাদাভাবে বিবেচনা করা যায়: একটি ধর্মীয় কাঠামোর অন্তর্গত, অন্যটি একটি শারীরবৃত্তীয় ঘটনা বর্ণনা করে।',
    distinction: {
      nifasTitle: 'নিফাস',
      nifasText: 'প্রসবের পর ধর্মীয় কাঠামোর অন্তর্গত একটি ধারণা।',
      lochiaTitle: 'লোকিয়া',
      lochiaText: 'প্রসবোত্তর রক্তস্রাবের জন্য ব্যবহৃত চিকিৎসাগত পরিভাষা।',
    },
    h2Section2: '2. প্রসবের পর চিকিৎসাগত ধারা',
    body2: 'প্রসবোত্তর সুস্থ হয়ে ওঠা ধীরে ধীরে ঘটে। জরায়ু তার স্বাভাবিক অবস্থায় ফিরতে থাকায় প্রসবোত্তর রক্তস্রাব সাধারণত সময়ের সঙ্গে বদলায়।',
    schemaTitle: 'প্রসবোত্তর অগ্রগতি',
    schemaSubtitle: 'সরলীকৃত চিকিৎসাগত নির্দেশিকা',
    stages: [
      {
        title: 'সন্তান প্রসবের পর',
        subtitle: 'প্রসবোত্তর সময়ের শুরু',
        text: 'প্রসবের পর শরীর ধীরে ধীরে সুস্থ হয়ে ওঠা শুরু করে।',
      },
      {
        title: 'লোকিয়া',
        subtitle: 'প্রসবোত্তর রক্তস্রাব',
        text: 'রক্তস্রাবের পরিমাণ ও রং ধীরে ধীরে বদলাতে থাকে।',
      },
      {
        title: 'ধীরে ধীরে কমে যাওয়া',
        subtitle: 'কয়েক সপ্তাহ ধরে',
        text: 'রক্তস্রাব সাধারণত সময়ের সঙ্গে কমে আসে।',
      },
      {
        title: 'ধীরে ধীরে ফিরে আসা',
        subtitle: 'স্বাভাবিক চক্রের দিকে',
        text: 'এরপর মাসিক চক্র ধীরে ধীরে আবার শুরু হতে পারে।',
      },
    ],
    h2Section3: '3. লোকিয়া কীভাবে বদলায়',
    body3: 'লোকিয়ার রং সাধারণত ধীরে ধীরে বদলায় এবং পরিমাণ কমে যায়। তবে এই অগ্রগতি একেকজনের ক্ষেত্রে আলাদা হতে পারে।',
    lochiaEvolution: [
      {
        title: 'লাল লোকিয়া',
        period: 'প্রথম কয়েক দিন',
        text: 'রক্তস্রাব সাধারণত লাল হয় এবং শুরুতে বেশি হতে পারে।',
      },
      {
        title: 'গোলাপি / বাদামি লোকিয়া',
        period: 'কয়েক দিন পর',
        text: 'স্রাব কমার সঙ্গে সঙ্গে রং হালকা বা বাদামি হয়ে যেতে পারে।',
      },
      {
        title: 'সাদাটে লোকিয়া',
        period: 'পরবর্তী কয়েক সপ্তাহ',
        text: 'রক্তস্রাব ধীরে ধীরে হালকা এবং কম হয়ে আসে।',
      },
    ],
    infoTitle: 'মূল কথা',
    infoText: 'লোকিয়ার রং ও পরিমাণ ধীরে ধীরে বদলাতে পারে। সঠিক অগ্রগতি সবার ক্ষেত্রে এক নয়।',
    h2Section4: '4. নিজের যত্ন নেওয়া',
    body4: 'এই সময়ে কয়েকটি সহজ অভ্যাস আরাম বাড়াতে এবং শরীরের সুস্থ হয়ে ওঠায় সহায়তা করতে পারে।',
    careTips: [
      {
        title: 'কোমল পরিচ্ছন্নতা',
        text: 'দৈনন্দিন পরিচ্ছন্নতার একটি সহজ ও আরামদায়ক রুটিন বজায় রাখুন।',
      },
      {
        title: 'বিশ্রাম',
        text: 'শরীরকে সুস্থ হয়ে ওঠার সময় দিন।',
      },
      {
        title: 'পানি পান',
        text: 'প্রয়োজন অনুযায়ী নিয়মিত পানি পান করার কথা মনে রাখুন।',
      },
      {
        title: 'পুষ্টি',
        text: 'বৈচিত্র্যময় খাদ্যাভ্যাস সুস্থ হয়ে ওঠায় সহায়তা করে।',
      },
    ],
    h2Section5: '5. কখন পরামর্শ নেবেন',
    body5: 'কিছু পরিস্থিতিতে স্বাস্থ্যসেবা পেশাজীবীর দ্রুত পরামর্শ প্রয়োজন, বিশেষ করে যখন কোনো পরিবর্তন উল্লেখযোগ্য, আকস্মিক বা অস্বাভাবিক মনে হয়।',
    warningTitle: 'যেসব লক্ষণ উপেক্ষা করবেন না',
    warningSubtitle: 'প্রয়োজনে পেশাজীবীর পরামর্শ নিন',
    warningSigns: [
      'রক্তস্রাবে তীব্র বা অস্বাভাবিক গন্ধ',
      'জ্বর বা সার্বিক অবস্থার অবনতি',
      'রক্তস্রাব হঠাৎ অনেক বেড়ে যাওয়া',
      'তীব্র, দীর্ঘস্থায়ী বা অস্বাভাবিক ব্যথা',
      'নতুন কোনো উপসর্গ যা আপনাকে চিন্তায় ফেলে',
    ],
    tipTitle: 'জেনে রাখা ভালো',
    tipText: 'প্রতিটি প্রসবোত্তর সুস্থ হয়ে ওঠা আলাদা। এই নিবন্ধের তথ্য সাধারণ দিকনির্দেশনা দেওয়ার জন্য এবং এটি চিকিৎসকের পরামর্শের বিকল্প নয়।',
    summaryHeading: 'মূল কথা',
    summary: [
      'নিফাস হলো প্রসবের পর ধর্মীয় প্রেক্ষাপটে ব্যবহৃত একটি পরিভাষা।',
      'চিকিৎসাবিজ্ঞানে প্রসবোত্তর রক্তস্রাবকে লোকিয়া বলা হয়।',
      'লোকিয়ার রং ও পরিমাণ ধীরে ধীরে বদলায়।',
      'বিশ্রাম, কোমল পরিচ্ছন্নতা এবং পর্যাপ্ত পানি পান সুস্থ হয়ে ওঠায় সহায়তা করে।',
      'অস্বাভাবিক বা উদ্বেগজনক কোনো পরিবর্তনে পেশাদার পরামর্শ নেওয়া উচিত।',
    ],
    disclaimerText: 'তথ্যমূলক বিষয়বস্তু। এখানে উপস্থাপিত চিকিৎসাগত তথ্য সাধারণ এবং স্বাস্থ্যসেবা পেশাজীবীর পরামর্শের বিকল্প নয়। নির্দিষ্ট ধর্মীয় প্রশ্নের জন্য একজন যোগ্য ধর্মীয় উৎসের শরণাপন্ন হওয়ার পরামর্শ দেওয়া হয়।',
    shareMessage: 'নিফাস: চিকিৎসাগত দিক — AWA',
  },
  da: {
    badge: 'BARSELSTID • NIFAS',
    title: 'Nifas:\nmedicinske aspekter',
    metaDuration: '5 min læsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaValidated: 'Informativt indhold',
    intro:
      'Efter fødslen gennemgår kroppen en gradvis restitutionsperiode. At forstå blødningen efter fødslen, hvordan den udvikler sig, og hvilke tegn der kræver opmærksomhed, kan hjælpe dig til at føle dig bedre informeret i denne tid.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Forståelse af begrebet Nifas',
      'Det medicinske forløb efter fødslen',
      'Hvordan barselsudflåd udvikler sig',
      'Omsorg for dig selv',
      'Hvornår skal du søge råd',
      'Vigtige pointer',
    ],
    h2Section1: '1. Forståelse af begrebet "Nifas"',
    body1a:
      'Begrebet "Nifas" hører til det religiøse ordforråd og refererer til den periode, der er knyttet til blødningen efter fødslen inden for islamisk jurisprudens (fiqh).',
    body1b:
      'Medicinsk set kaldes blødningen efter fødslen "lochia" (barselsudflåd). Disse to begreber kan betragtes separat: det ene hører til en religiøs ramme, det andet beskriver et fysiologisk fænomen.',
    distinction: {
      nifasTitle: 'Nifas',
      nifasText: 'Et begreb, der hører til den religiøse ramme efter fødslen.',
      lochiaTitle: 'Barselsudflåd (lochia)',
      lochiaText: 'Medicinsk term for blødning efter fødslen.',
    },
    h2Section2: '2. Det medicinske forløb efter fødslen',
    body2:
      'Barselsrestitutionen sker gradvist. Blødningen efter fødslen ændrer sig generelt over tid, mens livmoderen fortsætter med at vende tilbage til sin normale tilstand.',
    schemaTitle: 'Forløb efter fødslen',
    schemaSubtitle: 'Forenklet medicinsk oversigt',
    stages: [
      {
        title: 'Efter fødslen',
        subtitle: 'Start af barselstiden',
        text: 'Kroppen begynder gradvist sin restitution efter fødslen.',
      },
      {
        title: 'Barselsudflåd',
        subtitle: 'Blødning efter fødslen',
        text: 'Blødningen ændrer sig gradvist i mængde og farve.',
      },
      {
        title: 'Gradvis aftagen',
        subtitle: 'Over flere uger',
        text: 'Blødningen aftager generelt over tid.',
      },
      {
        title: 'Gradvis tilbagevenden',
        subtitle: 'Mod den normale cyklus',
        text: 'Menstruationscyklussen kan derefter gradvist genoptages.',
      },
    ],
    h2Section3: '3. Hvordan barselsudflåd udvikler sig',
    body3:
      'Barselsudflåd ændrer generelt farve gradvist og aftager i mængde. Dette forløb kan dog variere fra person til person.',
    lochiaEvolution: [
      {
        title: 'Rødt barselsudflåd',
        period: 'De første dage',
        text: 'Blødningen er normalt rød og kan være kraftigere i starten.',
      },
      {
        title: 'Lyserødt / brunligt barselsudflåd',
        period: 'Efter et par dage',
        text: 'Farven kan blive lysere eller brunlig, efterhånden som flowet aftager.',
      },
      {
        title: 'Hvidligt barselsudflåd',
        period: 'De følgende uger',
        text: 'Blødningen bliver gradvist lysere og mindre.',
      },
    ],
    infoTitle: 'Vigtige pointer',
    infoText:
      'Barselsudflåds farve og mængde kan ændre sig gradvist. Det nøjagtige forløb er ikke det samme for alle.',
    h2Section4: '4. Omsorg for dig selv',
    body4:
      'I denne periode kan nogle enkle vaner bidrage til komfort og støtte kroppens restitution.',
    careTips: [
      {title: 'Skånsom hygiejne', text: 'Oprethold en enkel og behagelig daglig hygiejnerutine.'},
      {title: 'Hvile', text: 'Giv din krop tid til at restituere.'},
      {title: 'Hydrering', text: 'Husk at drikke regelmæssigt efter behov.'},
      {title: 'Ernæring', text: 'En varieret kost støtter restitutionen.'},
    ],
    h2Section5: '5. Hvornår skal du søge råd',
    body5:
      'Visse situationer kræver hurtig rådgivning fra en sundhedsprofessionel, særligt når en ændring virker betydelig, pludselig eller usædvanlig.',
    warningTitle: 'Tegn du ikke bør ignorere',
    warningSubtitle: 'Søg professionel rådgivning om nødvendigt',
    warningSigns: [
      'En stærk eller usædvanlig lugt fra blødningen',
      'Feber eller forværring af almentilstanden',
      'Blødning der pludselig bliver meget kraftig',
      'Stærke, vedvarende eller usædvanlige smerter',
      'Et nyt symptom, der bekymrer dig',
    ],
    tipTitle: 'Godt at vide',
    tipText:
      'Enhver barselsrestitution er forskellig. Oplysningerne i denne artikel er ment som generel vejledning og erstatter ikke en medicinsk konsultation.',
    summaryHeading: 'Vigtige pointer',
    summary: [
      'Nifas er et begreb, der bruges i religiøs sammenhæng efter fødslen.',
      'Medicinsk set kaldes blødningen efter fødslen barselsudflåd (lochia).',
      'Barselsudflåd ændrer sig gradvist i farve og mængde.',
      'Hvile, skånsom hygiejne og god hydrering støtter restitutionen.',
      'En usædvanlig eller bekymrende ændring fortjener professionel rådgivning.',
    ],
    disclaimerText:
      'Informativt indhold. De medicinske oplysninger her er generelle og erstatter ikke råd fra en sundhedsprofessionel. For specifikke religiøse spørgsmål anbefales det at konsultere en kvalificeret religiøs kilde.',
    shareMessage: 'Nifas: medicinske aspekter — AWA',
  },
  sv: {
    badge: 'BARSELSTID • NIFAS',
    title: 'Nifas:\nmedicinske aspekter',
    metaDuration: '5 min läsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaValidated: 'Informativt indhold',
    intro:
      'Efter födslen gennemgår kroppen en gradvis restitutionsperiode. At forstå blödningen efter födslen, hvordan den udvikler sig, och hvilke tegn der kräver opmärksomhed, kan hjälpe dig till at föle dig bedre informeret i denne tid.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Forståelse av begrebet Nifas',
      'Det medicinske forlöb efter födslen',
      'Hvordan barselsudflåd udvikler sig',
      'Omsorg for dig selv',
      'Hvornår skal du söge råd',
      'Vigtige pointer',
    ],
    h2Section1: '1. Forståelse av begrebet "Nifas"',
    body1a:
      'Begrebet "Nifas" hörer till det religiöse ordforråd och refererer till den periode, der ar knyttet till blödningen efter födslen inden for islamisk jurisprudens (fiqh).',
    body1b:
      'Medicinsk set kaldes blödningen efter födslen "lochia" (barselsudflåd). Disse to begreber kan betragtes separat: det ene hörer till en religiös ramme, det andet beskriver et fysiologisk fänomen.',
    distinction: {
      nifasTitle: 'Nifas',
      nifasText: 'Et begreb, der hörer till den religiöse ramme efter födslen.',
      lochiaTitle: 'Barselsudflåd (lochia)',
      lochiaText: 'Medicinsk term for blödning efter födslen.',
    },
    h2Section2: '2. Det medicinske forlöb efter födslen',
    body2:
      'Barselsrestitutionen sker gradvist. Blödningen efter födslen ändrer sig generelt over tid, mens livmoderen fortsätter med at vende tilbage till sin normale tilstand.',
    schemaTitle: 'Forlöb efter födslen',
    schemaSubtitle: 'Forenklet medicinsk oversigt',
    stages: [
      {
        title: 'Efter födslen',
        subtitle: 'Start av barselstiden',
        text: 'Kroppen begynder gradvist sin restitution efter födslen.',
      },
      {
        title: 'Barselsudflåd',
        subtitle: 'Blödning efter födslen',
        text: 'Blödningen ändrer sig gradvist i mängde och farve.',
      },
      {
        title: 'Gradvis aftagen',
        subtitle: 'Over flere veckor',
        text: 'Blödningen aftager generelt over tid.',
      },
      {
        title: 'Gradvis tilbagevenden',
        subtitle: 'Mod den normale cyklus',
        text: 'Menstruationscyklussen kan derefter gradvist genoptages.',
      },
    ],
    h2Section3: '3. Hvordan barselsudflåd udvikler sig',
    body3:
      'Barselsudflåd ändrer generelt farve gradvist och aftager i mängde. Dette forlöb kan dog variere fran person till person.',
    lochiaEvolution: [
      {
        title: 'Rödt barselsudflåd',
        period: 'De förste dage',
        text: 'Blödningen ar normalt röd och kan väre kraftigere i starten.',
      },
      {
        title: 'Lyserödt / brunligt barselsudflåd',
        period: 'Efter et par dage',
        text: 'Farven kan blive lysere eller brunlig, efterhånden som flowet aftager.',
      },
      {
        title: 'Hvidligt barselsudflåd',
        period: 'De fölgende veckor',
        text: 'Blödningen bliver gradvist lysere och mindre.',
      },
    ],
    infoTitle: 'Vigtige pointer',
    infoText:
      'Barselsudflåds farve och mängde kan ändre sig gradvist. Det nöjagtige forlöb ar inte det samme for alle.',
    h2Section4: '4. Omsorg for dig selv',
    body4:
      'I denne periode kan nogle enkle vaner bidrage till komfort och stötte kroppens restitution.',
    careTips: [
      {title: 'Skånsom hygiejne', text: 'Oprethold en enkel och behagelig daglig hygiejnerutine.'},
      {title: 'Hvile', text: 'Giv din krop tid till at restituere.'},
      {title: 'Hydrering', text: 'Husk at drikke regelmässigt efter behov.'},
      {title: 'Ernäring', text: 'En varieret kost stötter restitutionen.'},
    ],
    h2Section5: '5. Hvornår skal du söge råd',
    body5:
      'Visse situationer kräver hurtig rådgivning fran en halsasprofessionel, särligt når en ändring virker betydelig, pludselig eller usädvanlig.',
    warningTitle: 'Tegn du inte bör ignorere',
    warningSubtitle: 'Sög professionel rådgivning om nödvendigt',
    warningSigns: [
      'En stärk eller usädvanlig lugt fran blödningen',
      'Feber eller forvärring av almentilstanden',
      'Blödning der pludselig bliver mycket kraftig',
      'Stärke, vedvarende eller usädvanlige smerter',
      'Et nyt symptom, der bekymrer dig',
    ],
    tipTitle: 'Godt at vide',
    tipText:
      'Enhver barselsrestitution ar forskellig. Oplysningerne i denne artikel ar ment som generel vejledning och erstatter inte en medicinsk konsultation.',
    summaryHeading: 'Vigtige pointer',
    summary: [
      'Nifas ar et begreb, der bruges i religiös sammenhäng efter födslen.',
      'Medicinsk set kaldes blödningen efter födslen barselsudflåd (lochia).',
      'Barselsudflåd ändrer sig gradvist i farve och mängde.',
      'Hvile, skånsom hygiejne och god hydrering stötter restitutionen.',
      'En usädvanlig eller bekymrende ändring fortjener professionel rådgivning.',
    ],
    disclaimerText:
      'Informativt indhold. De medicinske oplysninger her ar generelle och erstatter inte råd fran en halsasprofessionel. For specifikke religiöse spörgsmål anbefales det at konsultere en kvalificeret religiös kilde.',
    shareMessage: 'Nifas: medicinske aspekter — AWA',
  },
  nb: {
    badge: 'BARSELTID • NIFAS',
    title: 'Nifas:\nmedisinske aspekter',
    metaDuration: '5 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Nybegynner',
    metaValidated: 'Informasjonsinnhold',
    intro:
      'Etter fødselen går kroppen gjennom en gradvis tilfriskningsperiode. Å forstå blødningen etter fødselen, hvordan den utvikler seg, og tegnene som krever oppmerksomhet, kan hjelpe deg å føle deg bedre informert i denne tiden.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Forstå begrepet nifas',
      'Det medisinske forløpet etter fødselen',
      'Hvordan barselblødningen utvikler seg',
      'Ta vare på deg selv',
      'Når du bør søke råd',
      'Det viktigste å huske',
    ],
    h2Section1: '1. Forstå begrepet «nifas»',
    body1a:
      'Begrepet «nifas» hører til det religiøse ordforrådet og betegner perioden knyttet til blødningen som følger etter fødselen innenfor den islamske rettsvitenskapens regler.',
    body1b:
      'Medisinsk kalles blødningen som observeres etter fødselen «lochia» (barselblødning). Disse to begrepene kan betraktes hver for seg: det ene hører til et religiøst rammeverk, det andre beskriver et fysiologisk fenomen.',
    distinction: {
      nifasTitle: 'Nifas',
      nifasText: 'Et begrep som hører til det religiøse rammeverket etter fødselen.',
      lochiaTitle: 'Barselblødning (lochia)',
      lochiaText: 'Medisinsk begrep som brukes om blødning etter fødselen.',
    },
    h2Section2: '2. Det medisinske forløpet etter fødselen',
    body2:
      'Tilfriskningen etter fødselen skjer gradvis. Blødningen etter fødselen endrer seg vanligvis over tid mens livmoren fortsetter å vende tilbake til sin vanlige tilstand.',
    schemaTitle: 'Forløpet etter fødselen',
    schemaSubtitle: 'Forenklet medisinsk referanse',
    stages: [
      {
        title: 'Etter fødselen',
        subtitle: 'Starten på barseltiden',
        text: 'Kroppen begynner gradvis tilfriskningen etter fødselen.',
      },
      {
        title: 'Barselblødning',
        subtitle: 'Blødning etter fødselen',
        text: 'Blødningen endrer gradvis mengde og farge.',
      },
      {
        title: 'Gradvis nedgang',
        subtitle: 'Over flere uker',
        text: 'Blødningen avtar vanligvis over tid.',
      },
      {
        title: 'Gradvis tilbakekomst',
        subtitle: 'Mot den vanlige syklusen',
        text: 'Menstruasjonssyklusen kan deretter gradvis komme i gang igjen.',
      },
    ],
    h2Section3: '3. Hvordan barselblødningen utvikler seg',
    body3:
      'Barselblødningen endrer vanligvis farge gradvis og avtar i mengde. Forløpet kan imidlertid variere fra person til person.',
    lochiaEvolution: [
      {
        title: 'Rød barselblødning',
        period: 'De første dagene',
        text: 'Blødningen er vanligvis rød og kan være kraftigere i begynnelsen.',
      },
      {
        title: 'Rosa / brunaktig barselblødning',
        period: 'Etter noen dager',
        text: 'Fargen kan bli lysere eller brunaktig etter hvert som mengden avtar.',
      },
      {
        title: 'Hvitaktig barselblødning',
        period: 'De følgende ukene',
        text: 'Blødningen blir gradvis lettere og mindre rikelig.',
      },
    ],
    infoTitle: 'Det viktigste å huske',
    infoText:
      'Fargen og mengden på barselblødningen kan endre seg gradvis. Det nøyaktige forløpet er ikke likt for alle.',
    h2Section4: '4. Ta vare på deg selv',
    body4:
      'I denne perioden kan noen enkle vaner bidra til komfort og støtte kroppens tilfriskning.',
    careTips: [
      {title: 'Mild hygiene', text: 'Hold en enkel, behagelig daglig hygienerutine.'},
      {title: 'Hvile', text: 'Gi kroppen din tid til å komme seg.'},
      {title: 'Væskeinntak', text: 'Husk å drikke jevnlig etter behov.'},
      {title: 'Ernæring', text: 'Et variert kosthold støtter tilfriskningen.'},
    ],
    h2Section5: '5. Når du bør søke råd',
    body5:
      'Visse situasjoner krever rask rådgivning fra helsepersonell, særlig når en endring virker betydelig, plutselig eller uvanlig.',
    warningTitle: 'Tegn du ikke bør overse',
    warningSubtitle: 'Søk faglig råd ved behov',
    warningSigns: [
      'En sterk eller uvanlig lukt i blødningen',
      'Feber eller forverret allmenntilstand',
      'Blødning som plutselig blir svært kraftig',
      'Betydelig, vedvarende eller uvanlig smerte',
      'Et nytt symptom som bekymrer deg',
    ],
    tipTitle: 'Godt å vite',
    tipText:
      'Hver tilfriskning etter fødselen er forskjellig. Informasjonen i denne artikkelen er ment som generell veiledning og erstatter ikke en medisinsk konsultasjon.',
    summaryHeading: 'Det viktigste å huske',
    summary: [
      'Nifas er et begrep som brukes i den religiøse sammenhengen etter fødselen.',
      'Medisinsk kalles blødning etter fødselen lochia (barselblødning).',
      'Barselblødningen endrer gradvis farge og mengde.',
      'Hvile, mild hygiene og godt væskeinntak støtter tilfriskningen.',
      'En uvanlig eller bekymringsfull endring fortjener faglig råd.',
    ],
    disclaimerText:
      'Informasjonsinnhold. Den medisinske informasjonen som presenteres her, er generell og erstatter ikke råd fra helsepersonell. For spesifikke religiøse spørsmål anbefales det å henvende seg til en kvalifisert religiøs kilde.',
    shareMessage: 'Nifas: medisinske aspekter – AWA',
  },
  pl: {
    badge: 'POŁÓG • NIFAS',
    title: 'Nifas:\naspekty medyczne',
    metaDuration: '5 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść informacyjna',
    intro:
      'Po porodzie organizm przechodzi przez okres stopniowej regeneracji. Zrozumienie krwawienia poporodowego, jego przebiegu i objawów wymagających uwagi może pomóc czuć się lepiej poinformowaną w tym czasie.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Zrozumieć pojęcie nifas',
      'Przebieg medyczny po porodzie',
      'Jak zmieniają się lochia',
      'Dbanie o siebie',
      'Kiedy zasięgnąć porady',
      'Najważniejsze wnioski',
    ],
    h2Section1: '1. Zrozumieć pojęcie „nifas”',
    body1a:
      'Pojęcie „nifas” należy do słownictwa religijnego i oznacza okres związany z krwawieniem po porodzie w ramach zasad prawa islamskiego.',
    body1b:
      'Z medycznego punktu widzenia krwawienie obserwowane po porodzie nazywa się „lochiami”. Te dwa pojęcia można rozpatrywać osobno: jedno należy do ram religijnych, drugie opisuje zjawisko fizjologiczne.',
    distinction: {
      nifasTitle: 'Nifas',
      nifasText: 'Pojęcie należące do ram religijnych po porodzie.',
      lochiaTitle: 'Lochia',
      lochiaText: 'Termin medyczny używany dla krwawienia poporodowego.',
    },
    h2Section2: '2. Przebieg medyczny po porodzie',
    body2:
      'Regeneracja poporodowa przebiega stopniowo. Krwawienie poporodowe zazwyczaj zmienia się w czasie, gdy macica nadal wraca do swojego zwykłego stanu.',
    schemaTitle: 'Postęp w okresie poporodowym',
    schemaSubtitle: 'Uproszczony punkt odniesienia medycznego',
    stages: [
      {
        title: 'Po porodzie',
        subtitle: 'Początek okresu poporodowego',
        text: 'Organizm stopniowo rozpoczyna regenerację po porodzie.',
      },
      {
        title: 'Lochia',
        subtitle: 'Krwawienie poporodowe',
        text: 'Krwawienie stopniowo zmienia ilość i kolor.',
      },
      {
        title: 'Stopniowe zmniejszanie',
        subtitle: 'Przez kilka tygodni',
        text: 'Krwawienie zazwyczaj z czasem słabnie.',
      },
      {
        title: 'Stopniowy powrót',
        subtitle: 'Do zwykłego cyklu',
        text: 'Cykl menstruacyjny może następnie stopniowo wrócić.',
      },
    ],
    h2Section3: '3. Jak zmieniają się lochia',
    body3:
      'Lochia zazwyczaj stopniowo zmieniają kolor i słabną. Ten przebieg może się jednak różnić u poszczególnych osób.',
    lochiaEvolution: [
      {
        title: 'Czerwone lochia',
        period: 'Pierwsze dni',
        text: 'Krwawienie jest zwykle czerwone i na początku może być obfitsze.',
      },
      {
        title: 'Różowe / brązowawe lochia',
        period: 'Po kilku dniach',
        text: 'Kolor może stać się jaśniejszy lub brązowawy, gdy krwawienie słabnie.',
      },
      {
        title: 'Białawe lochia',
        period: 'W kolejnych tygodniach',
        text: 'Krwawienie stopniowo staje się słabsze i mniej obfite.',
      },
    ],
    infoTitle: 'Najważniejsze wnioski',
    infoText:
      'Kolor i ilość lochiów mogą zmieniać się stopniowo. Dokładny przebieg nie jest taki sam u wszystkich.',
    h2Section4: '4. Dbanie o siebie',
    body4:
      'W tym okresie kilka prostych nawyków może pomóc w komforcie i wspierać regenerację organizmu.',
    careTips: [
      {title: 'Delikatna higiena', text: 'Zachowaj prostą, wygodną codzienną higienę.'},
      {title: 'Odpoczynek', text: 'Daj swojemu ciału czas na regenerację.'},
      {title: 'Nawodnienie', text: 'Pamiętaj, by pić regularnie, zgodnie ze swoimi potrzebami.'},
      {title: 'Odżywianie', text: 'Urozmaicona dieta wspiera regenerację.'},
    ],
    h2Section5: '5. Kiedy zasięgnąć porady',
    body5:
      'Niektóre sytuacje wymagają szybkiej porady specjalisty, zwłaszcza gdy zmiana wydaje się znaczna, nagła lub nietypowa.',
    warningTitle: 'Objawy, których nie należy ignorować',
    warningSubtitle: 'W razie potrzeby zasięgnij porady specjalisty',
    warningSigns: [
      'Silny lub nietypowy zapach krwawienia',
      'Gorączka lub pogarszający się stan ogólny',
      'Krwawienie, które nagle staje się bardzo obfite',
      'Silny, uporczywy lub nietypowy ból',
      'Nowy objaw, który Cię niepokoi',
    ],
    tipTitle: 'Warto wiedzieć',
    tipText:
      'Każda regeneracja poporodowa jest inna. Informacje w tym artykule mają dawać ogólne wskazówki i nie zastępują wizyty lekarskiej.',
    summaryHeading: 'Najważniejsze wnioski',
    summary: [
      'Nifas to termin używany w kontekście religijnym po porodzie.',
      'Z medycznego punktu widzenia krwawienie poporodowe nazywa się lochiami.',
      'Lochia stopniowo zmieniają kolor i ilość.',
      'Odpoczynek, delikatna higiena i dobre nawodnienie wspierają regenerację.',
      'Nietypowa lub niepokojąca zmiana zasługuje na poradę specjalisty.',
    ],
    disclaimerText:
      'Treść informacyjna. Przedstawione tu informacje medyczne są ogólne i nie zastępują porady specjalisty. W konkretnych kwestiach religijnych zaleca się odwołanie do wykwalifikowanego źródła religijnego.',
    shareMessage: 'Nifas: aspekty medyczne — AWA',
  },
  uk: {
    badge: 'ПІСЛЯ ПОЛОГІВ • НІФАС',
    title: 'Ніфас:\nмедичні аспекти',
    metaDuration: '5 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Початковий',
    metaValidated: 'Інформаційний вміст',
    intro:
      'Після пологів організм проходить період поступового відновлення. Розуміння післяпологової кровотечі, її перебігу та ознак, що потребують уваги, може допомогти вам почуватися краще поінформованою в цей час.',
    contentsTitle: 'У цій статті',
    topics: [
      'Розуміння терміна «ніфас»',
      'Медичний перебіг після пологів',
      'Як змінюються лохії',
      'Дбайте про себе',
      'Коли звертатися за порадою',
      'Головні висновки',
    ],
    h2Section1: '1. Розуміння терміна «ніфас»',
    body1a:
      'Термін «ніфас» належить до релігійного словника й означає період, пов’язаний із кровотечею після пологів у межах норм ісламського правознавства.',
    body1b:
      'З медичного погляду кровотечу, що спостерігається після пологів, називають «лохіями». Ці два поняття можна розглядати окремо: одне належить до релігійних рамок, інше описує фізіологічне явище.',
    distinction: {
      nifasTitle: 'Ніфас',
      nifasText: 'Поняття, що належить до релігійних рамок після пологів.',
      lochiaTitle: 'Лохії',
      lochiaText: 'Медичний термін для післяпологової кровотечі.',
    },
    h2Section2: '2. Медичний перебіг після пологів',
    body2:
      'Післяпологове відновлення відбувається поступово. Післяпологова кровотеча зазвичай змінюється з часом, у міру того як матка продовжує повертатися до свого звичного стану.',
    schemaTitle: 'Післяпологовий перебіг',
    schemaSubtitle: 'Спрощений медичний орієнтир',
    stages: [
      {
        title: 'Після пологів',
        subtitle: 'Початок післяпологового періоду',
        text: 'Тіло поступово розпочинає відновлення після пологів.',
      },
      {
        title: 'Лохії',
        subtitle: 'Післяпологова кровотеча',
        text: 'Кровотеча поступово змінює кількість і колір.',
      },
      {
        title: 'Поступове зменшення',
        subtitle: 'Протягом кількох тижнів',
        text: 'Кровотеча зазвичай з часом зменшується.',
      },
      {
        title: 'Поступове повернення',
        subtitle: 'До звичного циклу',
        text: 'Менструальний цикл може потім поступово відновитися.',
      },
    ],
    h2Section3: '3. Як змінюються лохії',
    body3:
      'Лохії зазвичай поступово змінюють колір і зменшуються за кількістю. Проте цей перебіг може відрізнятися в різних людей.',
    lochiaEvolution: [
      {
        title: 'Червоні лохії',
        period: 'Перші дні',
        text: 'Кровотеча зазвичай червона й на початку може бути рясніша.',
      },
      {
        title: 'Рожеві / коричнюваті лохії',
        period: 'Через кілька днів',
        text: 'Колір може ставати світлішим або коричнюватим у міру зменшення виділень.',
      },
      {
        title: 'Білуваті лохії',
        period: 'У наступні тижні',
        text: 'Кровотеча поступово стає слабшою й менш рясною.',
      },
    ],
    infoTitle: 'Головні висновки',
    infoText:
      'Колір і кількість лохій можуть змінюватися поступово. Точний перебіг не однаковий у всіх.',
    h2Section4: '4. Дбайте про себе',
    body4:
      'У цей період кілька простих звичок можуть допомогти з комфортом і підтримати відновлення організму.',
    careTips: [
      {title: 'Ніжна гігієна', text: 'Дотримуйтеся простої, зручної щоденної гігієни.'},
      {title: 'Відпочинок', text: 'Дайте своєму тілу час на відновлення.'},
      {title: 'Питний режим', text: 'Пам’ятайте пити регулярно відповідно до потреб.'},
      {title: 'Харчування', text: 'Різноманітне харчування підтримує відновлення.'},
    ],
    h2Section5: '5. Коли звертатися за порадою',
    body5:
      'Деякі ситуації потребують швидкої поради медичного фахівця, особливо коли зміна здається значною, раптовою чи нетиповою.',
    warningTitle: 'Ознаки, яких не слід ігнорувати',
    warningSubtitle: 'За потреби зверніться за порадою до фахівця',
    warningSigns: [
      'Сильний або нетиповий запах кровотечі',
      'Гарячка або погіршення загального стану',
      'Кровотеча, що раптово стає дуже рясною',
      'Сильний, стійкий або нетиповий біль',
      'Новий симптом, що вас турбує',
    ],
    tipTitle: 'Варто знати',
    tipText:
      'Кожне післяпологове відновлення індивідуальне. Інформація в цій статті має надавати загальні орієнтири й не замінює медичної консультації.',
    summaryHeading: 'Головні висновки',
    summary: [
      'Ніфас — термін, що вживається в релігійному контексті після пологів.',
      'З медичного погляду післяпологова кровотеча називається лохіями.',
      'Лохії поступово змінюють колір і кількість.',
      'Відпочинок, ніжна гігієна та достатній питний режим підтримують відновлення.',
      'Нетипова або тривожна зміна заслуговує на пораду фахівця.',
    ],
    disclaimerText:
      'Інформаційний вміст. Наведена тут медична інформація загальна й не замінює поради медичного фахівця. З конкретних релігійних питань рекомендується звертатися до кваліфікованого релігійного джерела.',
    shareMessage: 'Ніфас: медичні аспекти — AWA',
  },
  cs: {
    badge: 'PO PORODU • NIFÁS',
    title: 'Nifás:\nzdravotní stránka',
    metaDuration: '5 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Začátečník',
    metaValidated: 'Informativní obsah',
    intro:
      'Po porodu prochází tělo obdobím postupného zotavování. Pochopení poporodního krvácení, jeho vývoje a příznaků, které vyžadují pozornost, vám může pomoci cítit se v tomto období lépe informována.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Pochopení pojmu nifás',
      'Lékařský průběh po porodu',
      'Jak se lochie vyvíjejí',
      'Péče o sebe',
      'Kdy vyhledat radu',
      'Hlavní poznatky',
    ],
    h2Section1: '1. Pochopení pojmu „nifás“',
    body1a:
      'Pojem „nifás“ patří do náboženské slovní zásoby a označuje období spojené s krvácením po porodu v rámci pravidel islámského práva.',
    body1b:
      'Lékařsky se krvácení pozorované po porodu nazývá „lochie“. Tyto dva pojmy lze posuzovat samostatně: jeden patří do náboženského rámce, druhý popisuje fyziologický jev.',
    distinction: {
      nifasTitle: 'Nifás',
      nifasText: 'Pojem patřící do náboženského rámce po porodu.',
      lochiaTitle: 'Lochie',
      lochiaText: 'Lékařský termín používaný pro poporodní krvácení.',
    },
    h2Section2: '2. Lékařský průběh po porodu',
    body2:
      'Zotavení po porodu probíhá postupně. Poporodní krvácení se obecně v čase mění, jak se děloha dál vrací do svého obvyklého stavu.',
    schemaTitle: 'Poporodní vývoj',
    schemaSubtitle: 'Zjednodušený lékařský přehled',
    stages: [
      {
        title: 'Po porodu',
        subtitle: 'Začátek poporodního období',
        text: 'Tělo po porodu postupně zahajuje své zotavování.',
      },
      {
        title: 'Lochie',
        subtitle: 'Poporodní krvácení',
        text: 'Krvácení se postupně mění v množství i barvě.',
      },
      {
        title: 'Postupné ubývání',
        subtitle: 'Během několika týdnů',
        text: 'Krvácení obecně v čase ubývá.',
      },
      {
        title: 'Postupný návrat',
        subtitle: 'K obvyklému cyklu',
        text: 'Menstruační cyklus se pak může postupně obnovit.',
      },
    ],
    h2Section3: '3. Jak se lochie vyvíjejí',
    body3:
      'Lochie obecně postupně mění barvu a ubývají. Tento průběh se však může u každé ženy lišit.',
    lochiaEvolution: [
      {
        title: 'Červené lochie',
        period: 'První dny',
        text: 'Krvácení je obvykle červené a na začátku může být silnější.',
      },
      {
        title: 'Růžové / nahnědlé lochie',
        period: 'Po několika dnech',
        text: 'Barva může zesvětlat nebo zhnědnout, jak se množství snižuje.',
      },
      {
        title: 'Bělavé lochie',
        period: 'V následujících týdnech',
        text: 'Krvácení postupně slábne a ubývá.',
      },
    ],
    infoTitle: 'Hlavní poznatky',
    infoText:
      'Barva a množství lochií se mohou postupně měnit. Přesný průběh není u všech stejný.',
    h2Section4: '4. Péče o sebe',
    body4:
      'V tomto období může několik jednoduchých návyků pomoci s pohodlím a podpořit zotavení těla.',
    careTips: [
      {title: 'Jemná hygiena', text: 'Dodržujte jednoduchou, pohodlnou každodenní hygienu.'},
      {title: 'Odpočinek', text: 'Dopřejte svému tělu čas na zotavení.'},
      {title: 'Pitný režim', text: 'Nezapomínejte pravidelně pít podle svých potřeb.'},
      {title: 'Výživa', text: 'Pestrá strava podporuje zotavení.'},
    ],
    h2Section5: '5. Kdy vyhledat radu',
    body5:
      'Některé situace vyžadují rychlou radu zdravotnického pracovníka, zejména když se změna zdá výrazná, náhlá nebo neobvyklá.',
    warningTitle: 'Příznaky, které nelze ignorovat',
    warningSubtitle: 'V případě potřeby vyhledejte odbornou radu',
    warningSigns: [
      'Silný nebo neobvyklý zápach krvácení',
      'Horečka nebo zhoršující se celkový stav',
      'Krvácení, které se náhle výrazně zesílí',
      'Výrazná, přetrvávající nebo neobvyklá bolest',
      'Nový příznak, který vás znepokojuje',
    ],
    tipTitle: 'Stojí za to vědět',
    tipText:
      'Každé poporodní zotavení je jiné. Informace v tomto článku mají poskytnout obecné vodítko a nenahrazují lékařskou konzultaci.',
    summaryHeading: 'Hlavní poznatky',
    summary: [
      'Nifás je termín používaný v náboženském kontextu po porodu.',
      'Lékařsky se poporodní krvácení nazývá lochie.',
      'Lochie postupně mění barvu a množství.',
      'Odpočinek, jemná hygiena a dobrý pitný režim podporují zotavení.',
      'Neobvyklá nebo znepokojivá změna si zaslouží odbornou radu.',
    ],
    disclaimerText:
      'Informativní obsah. Zde uvedené zdravotní informace jsou obecné a nenahrazují radu zdravotnického pracovníka. Pro konkrétní náboženské otázky se doporučuje obrátit se na kvalifikovaný náboženský zdroj.',
    shareMessage: 'Nifás: zdravotní stránka — AWA',
  },
  sk: {
    badge: 'PO PÔRODE • NIFÁS',
    title: 'Nifás:\nlekárske aspekty',
    metaDuration: '5 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Začiatočník',
    metaValidated: 'Informatívny obsah',
    intro:
      'Po pôrode telo prechádza obdobím postupného zotavovania. Pochopenie popôrodného krvácania, jeho vývoja a znakov, ktoré si vyžadujú pozornosť, vám môže pomôcť cítiť sa v tomto období lepšie informovaná.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Pochopenie pojmu nifás',
      'Lekársky priebeh po pôrode',
      'Ako sa vyvíjajú lóchie',
      'Starostlivosť o seba',
      'Kedy hľadať radu',
      'Hlavné body',
    ],
    h2Section1: '1. Pochopenie pojmu „nifás“',
    body1a:
      'Pojem „nifás“ patrí do náboženskej slovnej zásoby a označuje obdobie súvisiace s krvácaním po pôrode v rámci pravidiel islamskej jurisprudencie.',
    body1b:
      'Z lekárskeho hľadiska sa krvácanie pozorované po pôrode nazýva „lóchie“. Tieto dva pojmy možno posudzovať oddelene: jeden patrí do náboženského rámca, druhý opisuje fyziologický jav.',
    distinction: {
      nifasTitle: 'Nifás',
      nifasText: 'Pojem patriaci do náboženského rámca po pôrode.',
      lochiaTitle: 'Lóchie',
      lochiaText: 'Lekársky pojem používaný pre popôrodné krvácanie.',
    },
    h2Section2: '2. Lekársky priebeh po pôrode',
    body2:
      'Popôrodné zotavovanie prebieha postupne. Popôrodné krvácanie sa vo všeobecnosti v čase mení, ako sa maternica naďalej vracia do svojho obvyklého stavu.',
    schemaTitle: 'Popôrodný vývoj',
    schemaSubtitle: 'Zjednodušená lekárska referencia',
    stages: [
      {
        title: 'Po pôrode',
        subtitle: 'Začiatok popôrodného obdobia',
        text: 'Telo sa po pôrode postupne začína zotavovať.',
      },
      {
        title: 'Lóchie',
        subtitle: 'Popôrodné krvácanie',
        text: 'Krvácanie sa postupne mení množstvom aj farbou.',
      },
      {
        title: 'Postupný pokles',
        subtitle: 'Počas niekoľkých týždňov',
        text: 'Krvácanie sa v čase vo všeobecnosti zmenšuje.',
      },
      {
        title: 'Postupný návrat',
        subtitle: 'K obvyklému cyklu',
        text: 'Menštruačný cyklus sa potom môže postupne obnoviť.',
      },
    ],
    h2Section3: '3. Ako sa vyvíjajú lóchie',
    body3:
      'Lóchie vo všeobecnosti postupne menia farbu a množstvo sa zmenšuje. Tento vývoj sa však môže líšiť od ženy k žene.',
    lochiaEvolution: [
      {
        title: 'Červené lóchie',
        period: 'Prvé dni',
        text: 'Krvácanie je zvyčajne červené a na začiatku môže byť silnejšie.',
      },
      {
        title: 'Ružovkasté / hnedastré lóchie',
        period: 'Po niekoľkých dňoch',
        text: 'Farba sa môže zosvetliť alebo zhnednúť, keď prietok klesá.',
      },
      {
        title: 'Belavé lóchie',
        period: 'Nasledujúce týždne',
        text: 'Krvácanie sa postupne stáva svetlejším a menej hojným.',
      },
    ],
    infoTitle: 'Hlavné body',
    infoText:
      'Farba a množstvo lóchií sa môžu postupne meniť. Presný priebeh nie je u každej ženy rovnaký.',
    h2Section4: '4. Starostlivosť o seba',
    body4:
      'V tomto období môže niekoľko jednoduchých návykov pomôcť s pohodlím a podporiť zotavovanie tela.',
    careTips: [
      {title: 'Jemná hygiena', text: 'Udržiavajte jednoduchú a pohodlnú každodennú hygienickú rutinu.'},
      {title: 'Odpočinok', text: 'Doprajte svojmu telu čas na zotavenie.'},
      {title: 'Hydratácia', text: 'Nezabúdajte pravidelne piť podľa svojich potrieb.'},
      {title: 'Výživa', text: 'Pestrá strava podporuje zotavenie.'},
    ],
    h2Section5: '5. Kedy hľadať radu',
    body5:
      'Niektoré situácie vyžadujú rýchlu radu zdravotníckeho pracovníka, najmä keď sa zmena zdá výrazná, náhla alebo nezvyčajná.',
    warningTitle: 'Znaky, ktoré netreba ignorovať',
    warningSubtitle: 'V prípade potreby vyhľadajte odbornú radu',
    warningSigns: [
      'Silný alebo nezvyčajný zápach krvácania',
      'Horúčka alebo zhoršujúci sa celkový stav',
      'Krvácanie, ktoré sa náhle stane veľmi silným',
      'Výrazná, pretrvávajúca alebo nezvyčajná bolesť',
      'Nový príznak, ktorý vás znepokojuje',
    ],
    tipTitle: 'Stojí za to vedieť',
    tipText:
      'Každé popôrodné zotavenie je iné. Informácie v tomto článku majú poskytnúť všeobecné usmernenie a nenahrádzajú lekársku konzultáciu.',
    summaryHeading: 'Hlavné body',
    summary: [
      'Nifás je pojem používaný v náboženskom kontexte po pôrode.',
      'Z lekárskeho hľadiska sa popôrodné krvácanie nazýva lóchie.',
      'Lóchie postupne menia farbu aj množstvo.',
      'Odpočinok, jemná hygiena a dobrá hydratácia podporujú zotavenie.',
      'Nezvyčajná alebo znepokojujúca zmena si zaslúži odbornú radu.',
    ],
    disclaimerText:
      'Informatívny obsah. Tu uvedené lekárske informácie sú všeobecné a nenahrádzajú radu zdravotníckeho pracovníka. V konkrétnych náboženských otázkach sa odporúča obrátiť sa na kvalifikovaný náboženský zdroj.',
    shareMessage: 'Nifás: lekárske aspekty — AWA',
  },
  hu: {
    badge: 'SZÜLÉS UTÁN • NIFÁSZ',
    title: 'Nifász:\norvosi szempontok',
    metaDuration: '5 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Kezdő',
    metaValidated: 'Tájékoztató jellegű tartalom',
    intro:
      'Szülés után a test fokozatos felépülési időszakon megy keresztül. A szülés utáni vérzés, annak alakulása és a figyelmet igénylő jelek megértése segíthet, hogy ebben az időszakban jobban tájékozottnak érezd magad.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'A nifász kifejezés megértése',
      'Az orvosi lefolyás szülés után',
      'A gyermekágyi vérzés alakulása',
      'Gondoskodj magadról',
      'Mikor kérj tanácsot',
      'Legfontosabb tudnivalók',
    ],
    h2Section1: '1. A „nifász” kifejezés megértése',
    body1a:
      'A „nifász” kifejezés a vallási szókincshez tartozik, és az iszlám jogtudomány szabályain belül a szülést követő vérzéshez kapcsolódó időszakot jelöli.',
    body1b:
      'Orvosi szempontból a szülés után megfigyelt vérzést „gyermekágyi vérzésnek” nevezik. Ez a két fogalom külön is szemlélhető: az egyik vallási keretbe tartozik, a másik egy élettani jelenséget ír le.',
    distinction: {
      nifasTitle: 'Nifász',
      nifasText: 'A szülés utáni vallási keretbe tartozó fogalom.',
      lochiaTitle: 'Gyermekágyi vérzés',
      lochiaText: 'A szülés utáni vérzésre használt orvosi kifejezés.',
    },
    h2Section2: '2. Az orvosi lefolyás szülés után',
    body2:
      'A szülés utáni felépülés fokozatosan zajlik. A szülés utáni vérzés általában idővel változik, ahogy a méh tovább tér vissza a szokásos állapotába.',
    schemaTitle: 'Szülés utáni fejlődés',
    schemaSubtitle: 'Egyszerűsített orvosi referencia',
    stages: [
      {
        title: 'A szülés után',
        subtitle: 'A szülés utáni időszak kezdete',
        text: 'A test a szülés után fokozatosan megkezdi a felépülést.',
      },
      {
        title: 'Gyermekágyi vérzés',
        subtitle: 'Szülés utáni vérzés',
        text: 'A vérzés mennyisége és színe fokozatosan változik.',
      },
      {
        title: 'Fokozatos csökkenés',
        subtitle: 'Több hét alatt',
        text: 'A vérzés általában idővel csökken.',
      },
      {
        title: 'Fokozatos visszatérés',
        subtitle: 'A szokásos ciklus felé',
        text: 'A menstruációs ciklus ezután fokozatosan újraindulhat.',
      },
    ],
    h2Section3: '3. A gyermekágyi vérzés alakulása',
    body3:
      'A gyermekágyi vérzés általában fokozatosan változtatja a színét, és a mennyisége csökken. Ez a lefolyás azonban nőnként eltérhet.',
    lochiaEvolution: [
      {
        title: 'Vörös gyermekágyi vérzés',
        period: 'Első napok',
        text: 'A vérzés általában vörös, és az elején erősebb lehet.',
      },
      {
        title: 'Rózsaszínes / barnás gyermekágyi vérzés',
        period: 'Néhány nap után',
        text: 'A szín világosabbá vagy barnásabbá válhat, ahogy a vérzés csökken.',
      },
      {
        title: 'Fehéres gyermekágyi vérzés',
        period: 'A következő hetek',
        text: 'A vérzés fokozatosan világosabbá és kevésbé bőségessé válik.',
      },
    ],
    infoTitle: 'Legfontosabb tudnivalók',
    infoText:
      'A gyermekágyi vérzés színe és mennyisége fokozatosan változhat. A pontos lefolyás nem mindenkinél azonos.',
    h2Section4: '4. Gondoskodj magadról',
    body4:
      'Ebben az időszakban néhány egyszerű szokás segíthet a kényelemben és támogathatja a test felépülését.',
    careTips: [
      {title: 'Kíméletes higiénia', text: 'Tarts fenn egyszerű, kényelmes napi higiéniai rutint.'},
      {title: 'Pihenés', text: 'Adj időt a testednek a felépülésre.'},
      {title: 'Hidratálás', text: 'Ne felejts el rendszeresen inni az igényeid szerint.'},
      {title: 'Táplálkozás', text: 'A változatos étrend támogatja a felépülést.'},
    ],
    h2Section5: '5. Mikor kérj tanácsot',
    body5:
      'Bizonyos helyzetek gyors egészségügyi szakmai tanácsot igényelnek, különösen ha a változás jelentősnek, hirtelennek vagy szokatlannak tűnik.',
    warningTitle: 'Jelek, amelyeket nem szabad figyelmen kívül hagyni',
    warningSubtitle: 'Szükség esetén kérj szakmai tanácsot',
    warningSigns: [
      'A vérzés erős vagy szokatlan szaga',
      'Láz vagy romló általános állapot',
      'Hirtelen nagyon erőssé váló vérzés',
      'Jelentős, tartós vagy szokatlan fájdalom',
      'Új tünet, amely aggaszt',
    ],
    tipTitle: 'Érdemes tudni',
    tipText:
      'Minden szülés utáni felépülés más. A cikkben szereplő információk általános útmutatást nyújtanak, és nem helyettesítik az orvosi konzultációt.',
    summaryHeading: 'Legfontosabb tudnivalók',
    summary: [
      'A nifász a szülés utáni vallási kontextusban használt kifejezés.',
      'Orvosi szempontból a szülés utáni vérzést gyermekágyi vérzésnek nevezik.',
      'A gyermekágyi vérzés fokozatosan változtatja a színét és a mennyiségét.',
      'A pihenés, a kíméletes higiénia és a jó hidratálás támogatja a felépülést.',
      'A szokatlan vagy aggasztó változás szakmai tanácsot érdemel.',
    ],
    disclaimerText:
      'Tájékoztató jellegű tartalom. Az itt bemutatott orvosi információk általánosak, és nem helyettesítik az egészségügyi szakember tanácsát. Konkrét vallási kérdésekben ajánlott kvalifikált vallási forráshoz fordulni.',
    shareMessage: 'Nifász: orvosi szempontok — AWA',
  },
  ro: {
    badge: 'POSTNATAL • NIFAS',
    title: 'Nifas:\naspectul medical',
    metaDuration: '5 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Începător',
    metaValidated: 'Conținut informativ',
    intro:
      'După naștere, corpul trece printr-o perioadă de recuperare treptată. Înțelegerea sângerării postnatale, a evoluției ei și a semnelor care cer atenție te poate ajuta să te simți mai bine informată în această perioadă.',
    contentsTitle: 'În acest articol',
    topics: [
      'Înțelegerea termenului Nifas',
      'Tiparul medical după naștere',
      'Cum evoluează lohiile',
      'Grija de tine',
      'Când să ceri un sfat',
      'Ce să reții',
    ],
    h2Section1: '1. Înțelegerea termenului „Nifas”',
    body1a:
      'Termenul „Nifas” aparține vocabularului religios și desemnează perioada asociată sângerării de după naștere în cadrul regulilor jurisprudenței islamice.',
    body1b:
      'Din punct de vedere medical, sângerarea observată după naștere se numește „lohii”. Aceste două noțiuni pot fi considerate separat: una aparține unui cadru religios, cealaltă descrie un fenomen fiziologic.',
    distinction: {
      nifasTitle: 'Nifas',
      nifasText: 'O noțiune care aparține cadrului religios de după naștere.',
      lochiaTitle: 'Lohii',
      lochiaText: 'Termen medical folosit pentru sângerarea postnatală.',
    },
    h2Section2: '2. Tiparul medical după naștere',
    body2:
      'Recuperarea postnatală se face treptat. Sângerarea postnatală se schimbă în general în timp, pe măsură ce uterul continuă să revină la starea lui obișnuită.',
    schemaTitle: 'Evoluția postnatală',
    schemaSubtitle: 'Reper medical simplificat',
    stages: [
      {
        title: 'După naștere',
        subtitle: 'Începutul perioadei postnatale',
        text: 'Corpul își începe treptat recuperarea după naștere.',
      },
      {
        title: 'Lohii',
        subtitle: 'Sângerarea postnatală',
        text: 'Sângerarea își schimbă treptat cantitatea și culoarea.',
      },
      {
        title: 'Scădere treptată',
        subtitle: 'Pe parcursul mai multor săptămâni',
        text: 'Sângerarea scade în general în timp.',
      },
      {
        title: 'Revenire treptată',
        subtitle: 'Către ciclul obișnuit',
        text: 'Ciclul menstrual poate apoi relua treptat.',
      },
    ],
    h2Section3: '3. Cum evoluează lohiile',
    body3:
      'Lohiile își schimbă în general culoarea treptat și scad în cantitate. Totuși, această evoluție poate varia de la o persoană la alta.',
    lochiaEvolution: [
      {
        title: 'Lohii roșii',
        period: 'Primele zile',
        text: 'Sângerarea este de obicei roșie și poate fi mai abundentă la început.',
      },
      {
        title: 'Lohii roz / maronii',
        period: 'După câteva zile',
        text: 'Culoarea poate deveni mai deschisă sau maronie pe măsură ce fluxul scade.',
      },
      {
        title: 'Lohii albicioase',
        period: 'Săptămânile următoare',
        text: 'Sângerarea devine treptat mai ușoară și mai puțin abundentă.',
      },
    ],
    infoTitle: 'Ce să reții',
    infoText:
      'Culoarea și cantitatea lohiilor se pot schimba treptat. Evoluția exactă nu este aceeași pentru toată lumea.',
    h2Section4: '4. Grija de tine',
    body4:
      'În această perioadă, câteva obiceiuri simple pot ajuta la confort și pot susține recuperarea corpului.',
    careTips: [
      {title: 'Igienă blândă', text: 'Păstrează o rutină zilnică de igienă simplă și confortabilă.'},
      {title: 'Odihnă', text: 'Oferă-i corpului timp să se refacă.'},
      {title: 'Hidratare', text: 'Nu uita să bei regulat, în funcție de nevoile tale.'},
      {title: 'Alimentație', text: 'O alimentație variată susține recuperarea.'},
    ],
    h2Section5: '5. Când să ceri un sfat',
    body5:
      'Anumite situații cer sfatul prompt al unui profesionist din domeniul sănătății, în special când o schimbare pare importantă, bruscă sau neobișnuită.',
    warningTitle: 'Semne de nelăsat deoparte',
    warningSubtitle: 'Cere sfatul unui profesionist la nevoie',
    warningSigns: [
      'Un miros puternic sau neobișnuit al sângerării',
      'Febră sau o stare generală care se agravează',
      'O sângerare care devine brusc foarte abundentă',
      'Durere importantă, persistentă sau neobișnuită',
      'Un simptom nou care te îngrijorează',
    ],
    tipTitle: 'Bine de știut',
    tipText:
      'Fiecare recuperare postnatală este diferită. Informațiile din acest articol au rolul de a oferi o orientare generală și nu înlocuiesc o consultație medicală.',
    summaryHeading: 'Ce să reții',
    summary: [
      'Nifas este un termen folosit în context religios după naștere.',
      'Din punct de vedere medical, sângerarea postnatală se numește lohii.',
      'Lohiile își schimbă treptat culoarea și cantitatea.',
      'Odihna, igiena blândă și o bună hidratare susțin recuperarea.',
      'O schimbare neobișnuită sau îngrijorătoare merită sfatul unui profesionist.',
    ],
    disclaimerText:
      'Conținut cu caracter informativ. Informațiile medicale prezentate aici sunt generale și nu înlocuiesc sfatul unui profesionist din domeniul sănătății. Pentru întrebările religioase specifice, se recomandă raportarea la o sursă religioasă calificată.',
    shareMessage: 'Nifas: aspectul medical — AWA',
  },
  bg: {
    badge: 'СЛЕД РАЖДАНЕ • НИФАС',
    title: 'Нифас:\nмедицински аспекти',
    metaDuration: '5 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Начинаещ',
    metaValidated: 'Информационно съдържание',
    intro:
      'След раждане тялото преминава през период на постепенно възстановяване. Разбирането на кървенето след раждане, как то се развива и кои признаци изискват внимание, може да ти помогне да се чувстваш по-добре информирана през това време.',
    contentsTitle: 'В тази статия',
    topics: [
      'Разбиране на термина нифас',
      'Медицинската картина след раждане',
      'Как се развиват лохиите',
      'Грижа за себе си',
      'Кога да потърсиш съвет',
      'Какво да запомниш',
    ],
    h2Section1: '1. Разбиране на термина „нифас“',
    body1a:
      'Терминът „нифас“ принадлежи към религиозния речник и означава периода, свързан с кървенето след раждане в рамките на правилата на ислямската юриспруденция.',
    body1b:
      'Медицински кървенето след раждане се нарича „лохии“. Тези две понятия могат да се разглеждат поотделно: едното принадлежи към религиозна рамка, другото описва физиологичен феномен.',
    distinction: {
      nifasTitle: 'Нифас',
      nifasText: 'Понятие от религиозната рамка след раждане.',
      lochiaTitle: 'Лохии',
      lochiaText: 'Медицински термин за кървенето след раждане.',
    },
    h2Section2: '2. Медицинската картина след раждане',
    body2:
      'Възстановяването след раждане протича постепенно. Кървенето след раждане обикновено се променя във времето, докато матката продължава да се връща към обичайното си състояние.',
    schemaTitle: 'Развитие след раждане',
    schemaSubtitle: 'Опростена медицинска референция',
    stages: [
      {
        title: 'След раждане',
        subtitle: 'Начало на следродовия период',
        text: 'Тялото постепенно започва възстановяването си след раждането.',
      },
      {
        title: 'Лохии',
        subtitle: 'Кървене след раждане',
        text: 'Кървенето постепенно променя количеството и цвета си.',
      },
      {
        title: 'Постепенно намаляване',
        subtitle: 'През няколко седмици',
        text: 'Кървенето обикновено намалява с времето.',
      },
      {
        title: 'Постепенно връщане',
        subtitle: 'Към обичайния цикъл',
        text: 'Менструалният цикъл може след това постепенно да се възобнови.',
      },
    ],
    h2Section3: '3. Как се развиват лохиите',
    body3:
      'Лохиите обикновено постепенно променят цвета си и намаляват на количество. Това развитие обаче може да варира от човек на човек.',
    lochiaEvolution: [
      {
        title: 'Червени лохии',
        period: 'Първите дни',
        text: 'Кървенето обикновено е червено и в началото може да бъде по-обилно.',
      },
      {
        title: 'Розови / кафеникави лохии',
        period: 'След няколко дни',
        text: 'Цветът може да стане по-светъл или кафеникав, докато потокът намалява.',
      },
      {
        title: 'Белезникави лохии',
        period: 'През следващите седмици',
        text: 'Кървенето постепенно става по-леко и по-оскъдно.',
      },
    ],
    infoTitle: 'Какво да запомниш',
    infoText:
      'Цветът и количеството на лохиите могат да се променят постепенно. Точното развитие не е еднакво за всички.',
    h2Section4: '4. Грижа за себе си',
    body4:
      'През този период няколко прости навика могат да помогнат за комфорта и да подкрепят възстановяването на тялото.',
    careTips: [
      {title: 'Нежна хигиена', text: 'Поддържай проста и удобна ежедневна хигиена.'},
      {title: 'Почивка', text: 'Дай на тялото си време да се възстанови.'},
      {title: 'Хидратиране', text: 'Не забравяй да пиеш редовно според нуждите си.'},
      {title: 'Хранене', text: 'Разнообразното хранене подпомага възстановяването.'},
    ],
    h2Section5: '5. Кога да потърсиш съвет',
    body5:
      'Някои ситуации изискват бърз съвет от здравен специалист, особено когато промяната изглежда значителна, внезапна или необичайна.',
    warningTitle: 'Признаци, които не бива да се пренебрегват',
    warningSubtitle: 'При нужда потърси професионален съвет',
    warningSigns: [
      'Силна или необичайна миризма на кървенето',
      'Температура или влошаване на общото състояние',
      'Кървене, което внезапно става много обилно',
      'Значителна, упорита или необичайна болка',
      'Нов симптом, който те тревожи',
    ],
    tipTitle: 'Добре е да знаеш',
    tipText:
      'Всяко възстановяване след раждане е различно. Информацията в тази статия е предназначена да даде общи насоки и не замества медицинска консултация.',
    summaryHeading: 'Какво да запомниш',
    summary: [
      'Нифас е термин, използван в религиозния контекст след раждане.',
      'Медицински кървенето след раждане се нарича лохии.',
      'Лохиите постепенно променят цвета и количеството си.',
      'Почивката, нежната хигиена и доброто хидратиране подпомагат възстановяването.',
      'Необичайна или тревожна промяна заслужава професионален съвет.',
    ],
    disclaimerText:
      'Информационно съдържание. Представената тук медицинска информация е обща и не замества съвета на здравен специалист. За конкретни религиозни въпроси се препоръчва да се обърнеш към квалифициран религиозен източник.',
    shareMessage: 'Нифас: медицински аспекти — AWA',
  },
  sr: {
    badge: 'ПОСЛЕ ПОРОЂАЈА • НИФАС',
    title: 'Нифас:\nмедицински аспекти',
    metaDuration: '5 мин читања',
    metaType: 'Водич',
    metaLevel: 'Почетник',
    metaValidated: 'Информативни садржај',
    intro:
      'После порођаја тело пролази кроз период постепеног опоравка. Разумевање крварења после порођаја, како се оно развија и знакова који захтевају пажњу може ти помоћи да се у овом периоду осећаш информисаније.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Разумевање појма нифас',
      'Медицинска слика после порођаја',
      'Како се лохије развијају',
      'Брига о себи',
      'Када потражити савет',
      'Шта да запамтиш',
    ],
    h2Section1: '1. Разумевање појма „нифас“',
    body1a:
      'Појам „нифас“ припада верском речнику и означава период повезан са крварењем које следи после порођаја у оквиру правила исламске јуриспруденције.',
    body1b:
      'Медицински, крварење које се примећује после порођаја назива се „лохије“. Ова два појма могу се посматрати одвојено: један припада верском оквиру, други описује физиолошки феномен.',
    distinction: {
      nifasTitle: 'Нифас',
      nifasText: 'Појам из верског оквира после порођаја.',
      lochiaTitle: 'Лохије',
      lochiaText: 'Медицински термин за крварење после порођаја.',
    },
    h2Section2: '2. Медицинска слика после порођаја',
    body2:
      'Опоравак после порођаја одвија се постепено. Крварење после порођаја обично се мења током времена док се материца и даље враћа у уобичајено стање.',
    schemaTitle: 'Развој после порођаја',
    schemaSubtitle: 'Поједностављена медицинска референца',
    stages: [
      {
        title: 'После порођаја',
        subtitle: 'Почетак периода после порођаја',
        text: 'Тело постепено почиње свој опоравак после порођаја.',
      },
      {
        title: 'Лохије',
        subtitle: 'Крварење после порођаја',
        text: 'Крварење постепено мења количину и боју.',
      },
      {
        title: 'Постепено смањивање',
        subtitle: 'Током неколико недеља',
        text: 'Крварење се обично смањује током времена.',
      },
      {
        title: 'Постепен повратак',
        subtitle: 'Ка уобичајеном циклусу',
        text: 'Менструални циклус се тада може постепено поново успоставити.',
      },
    ],
    h2Section3: '3. Како се лохије развијају',
    body3:
      'Лохије обично постепено мењају боју и смањују се по количини. Међутим, овај развој може варирати од особе до особе.',
    lochiaEvolution: [
      {
        title: 'Црвене лохије',
        period: 'Први дани',
        text: 'Крварење је обично црвено и на почетку може бити обилније.',
      },
      {
        title: 'Розе / смеђкасте лохије',
        period: 'После неколико дана',
        text: 'Боја може постати светлија или смеђкаста како се проток смањује.',
      },
      {
        title: 'Беличасте лохије',
        period: 'Наредне недеље',
        text: 'Крварење постепено постаје лакше и мање обилно.',
      },
    ],
    infoTitle: 'Шта да запамтиш',
    infoText:
      'Боја и количина лохија могу се мењати постепено. Тачан развој није исти за све.',
    h2Section4: '4. Брига о себи',
    body4:
      'У овом периоду неколико једноставних навика може помоћи удобности и подржати опоравак тела.',
    careTips: [
      {title: 'Нежна хигијена', text: 'Одржавај једноставну, удобну свакодневну хигијену.'},
      {title: 'Одмор', text: 'Дај свом телу времена да се опорави.'},
      {title: 'Хидратација', text: 'Не заборави да редовно пијеш према својим потребама.'},
      {title: 'Исхрана', text: 'Разноврсна исхрана подржава опоравак.'},
    ],
    h2Section5: '5. Када потражити савет',
    body5:
      'Одређене ситуације захтевају брз савет здравственог радника, нарочито када промена изгледа значајна, изненадна или необична.',
    warningTitle: 'Знаци који се не смеју игнорисати',
    warningSubtitle: 'По потреби потражи стручни савет',
    warningSigns: [
      'Јак или необичан мирис крварења',
      'Температура или погоршање општег стања',
      'Крварење које изненада постаје веома обилно',
      'Значајан, упоран или необичан бол',
      'Нов симптом који те брине',
    ],
    tipTitle: 'Добро је знати',
    tipText:
      'Сваки опоравак после порођаја је различит. Информације у овом чланку намењене су давању општих смерница и не замењују лекарску консултацију.',
    summaryHeading: 'Шта да запамтиш',
    summary: [
      'Нифас је појам који се користи у верском контексту после порођаја.',
      'Медицински, крварење после порођаја назива се лохије.',
      'Лохије постепено мењају боју и количину.',
      'Одмор, нежна хигијена и добра хидратација подржавају опоравак.',
      'Необична или забрињавајућа промена заслужује стручни савет.',
    ],
    disclaimerText:
      'Информативни садржај. Овде представљене медицинске информације су опште и не замењују савет здравственог радника. За конкретна верска питања препоручује се обратити се квалификованом верском извору.',
    shareMessage: 'Нифас: медицински аспекти — AWA',
  },
  hr: {
    badge: 'NAKON PORODA • NIFAS',
    title: 'Nifas:\nmedicinski aspekti',
    metaDuration: '5 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Informativni sadržaj',
    intro:
      'Nakon poroda tijelo prolazi kroz razdoblje postupnog oporavka. Razumijevanje poslijeporođajnog krvarenja, njegova tijeka i znakova koji zahtijevaju pozornost može ti pomoći da se u tom razdoblju osjećaš informiranije.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Razumijevanje pojma nifas',
      'Medicinski obrazac nakon poroda',
      'Kako se lohije mijenjaju',
      'Briga o sebi',
      'Kada zatražiti savjet',
      'Ključne poruke',
    ],
    h2Section1: '1. Razumijevanje pojma „nifas“',
    body1a:
      'Pojam „nifas“ pripada vjerskom rječniku i označava razdoblje povezano s krvarenjem koje slijedi nakon poroda u okviru pravila islamskog prava.',
    body1b:
      'Medicinski se krvarenje primijećeno nakon poroda naziva „lohije“. Ta se dva pojma mogu promatrati odvojeno: jedan pripada vjerskom okviru, a drugi opisuje fiziološku pojavu.',
    distinction: {
      nifasTitle: 'Nifas',
      nifasText: 'Pojam koji pripada vjerskom okviru nakon poroda.',
      lochiaTitle: 'Lohije',
      lochiaText: 'Medicinski pojam za poslijeporođajno krvarenje.',
    },
    h2Section2: '2. Medicinski obrazac nakon poroda',
    body2:
      'Poslijeporođajni oporavak odvija se postupno. Poslijeporođajno krvarenje općenito se mijenja tijekom vremena dok se maternica nastavlja vraćati u uobičajeno stanje.',
    schemaTitle: 'Poslijeporođajni tijek',
    schemaSubtitle: 'Pojednostavljena medicinska referenca',
    stages: [
      {
        title: 'Nakon poroda',
        subtitle: 'Početak poslijeporođajnog razdoblja',
        text: 'Tijelo postupno započinje oporavak nakon poroda.',
      },
      {
        title: 'Lohije',
        subtitle: 'Poslijeporođajno krvarenje',
        text: 'Krvarenje se postupno mijenja po količini i boji.',
      },
      {
        title: 'Postupno smanjenje',
        subtitle: 'Tijekom nekoliko tjedana',
        text: 'Krvarenje se općenito smanjuje tijekom vremena.',
      },
      {
        title: 'Postupan povratak',
        subtitle: 'Prema uobičajenom ciklusu',
        text: 'Menstrualni ciklus se zatim može postupno ponovno uspostaviti.',
      },
    ],
    h2Section3: '3. Kako se lohije mijenjaju',
    body3:
      'Lohije obično postupno mijenjaju boju i smanjuju se po količini. Međutim, taj se tijek može razlikovati od osobe do osobe.',
    lochiaEvolution: [
      {
        title: 'Crvene lohije',
        period: 'Prvi dani',
        text: 'Krvarenje je obično crveno i na početku može biti obilnije.',
      },
      {
        title: 'Ružičaste / smećkaste lohije',
        period: 'Nakon nekoliko dana',
        text: 'Boja može postati svjetlija ili smećkasta kako se protok smanjuje.',
      },
      {
        title: 'Bjelkaste lohije',
        period: 'Sljedeći tjedni',
        text: 'Krvarenje postupno postaje blaže i manje obilno.',
      },
    ],
    infoTitle: 'Ključne poruke',
    infoText:
      'Boja i količina lohija mogu se postupno mijenjati. Točan tijek nije isti za svaku ženu.',
    h2Section4: '4. Briga o sebi',
    body4:
      'U tom razdoblju nekoliko jednostavnih navika može pomoći ugodi i podržati oporavak tijela.',
    careTips: [
      {title: 'Nježna higijena', text: 'Održavaj jednostavnu, ugodnu svakodnevnu higijenu.'},
      {title: 'Odmor', text: 'Daj svom tijelu vremena za oporavak.'},
      {title: 'Hidratacija', text: 'Ne zaboravi redovito piti prema svojim potrebama.'},
      {title: 'Prehrana', text: 'Raznolika prehrana podupire oporavak.'},
    ],
    h2Section5: '5. Kada zatražiti savjet',
    body5:
      'Određene situacije zahtijevaju žuran savjet zdravstvenog djelatnika, osobito kada se promjena čini znatnom, iznenadnom ili neobičnom.',
    warningTitle: 'Znakovi koje ne treba zanemariti',
    warningSubtitle: 'Po potrebi zatraži stručni savjet',
    warningSigns: [
      'Jak ili neobičan miris krvarenja',
      'Vrućica ili pogoršanje općeg stanja',
      'Krvarenje koje iznenada postaje vrlo obilno',
      'Jaka, dugotrajna ili neobična bol',
      'Novi simptom koji te brine',
    ],
    tipTitle: 'Dobro je znati',
    tipText:
      'Svaki je poslijeporođajni oporavak drugačiji. Informacije u ovom članku namijenjene su općem usmjeravanju i ne zamjenjuju liječnički pregled.',
    summaryHeading: 'Ključne poruke',
    summary: [
      'Nifas je pojam koji se koristi u vjerskom kontekstu nakon poroda.',
      'Medicinski se poslijeporođajno krvarenje naziva lohije.',
      'Lohije postupno mijenjaju boju i količinu.',
      'Odmor, nježna higijena i dobra hidratacija podupiru oporavak.',
      'Neobična ili zabrinjavajuća promjena zaslužuje stručni savjet.',
    ],
    disclaimerText:
      'Informativni sadržaj. Ovdje predstavljene medicinske informacije su općenite i ne zamjenjuju savjet zdravstvenog djelatnika. Za konkretna vjerska pitanja preporučuje se obratiti kvalificiranom vjerskom izvoru.',
    shareMessage: 'Nifas: medicinski aspekti — AWA',
  },
  bs: {
    badge: 'NAKON PORODA • NIFAS',
    title: 'Nifas:\nmedicinski aspekti',
    metaDuration: '5 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Informativni sadržaj',
    intro:
      'Nakon porođaja tijelo prolazi kroz razdoblje postupnog oporavka. Razumijevanje poslijeporođajnog krvarenja, njegova toka i znakova koji zahtijevaju pozornost može ti pomoći da se u tom razdoblju osjećaš informiranije.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Razumijevanje pojma nifas',
      'Medicinski obrazac nakon porođaja',
      'Kako se lohije mijenjaju',
      'Briga o sebi',
      'Kada zatražiti savjet',
      'Ključne poruke',
    ],
    h2Section1: '1. Razumijevanje pojma „nifas“',
    body1a:
      'Pojam „nifas“ pripada vjerskom rječniku i označava razdoblje povezano s krvarenjem koje slijedi nakon porođaja u okviru pravila islamskog prava.',
    body1b:
      'Medicinski se krvarenje primijećeno nakon porođaja naziva „lohije“. Ta se dva pojma mogu promatrati odvojeno: jedan pripada vjerskom okviru, a drugi opisuje fiziološku pojavu.',
    distinction: {
      nifasTitle: 'Nifas',
      nifasText: 'Pojam koji pripada vjerskom okviru nakon porođaja.',
      lochiaTitle: 'Lohije',
      lochiaText: 'Medicinski pojam za poslijeporođajno krvarenje.',
    },
    h2Section2: '2. Medicinski obrazac nakon porođaja',
    body2:
      'Poslijeporođajni oporavak odvija se postupno. Poslijeporođajno krvarenje općenito se mijenja tokom vremena dok se maternica nastavlja vraćati u uobičajeno stanje.',
    schemaTitle: 'Poslijeporođajni tok',
    schemaSubtitle: 'Pojednostavljena medicinska referenca',
    stages: [
      {
        title: 'Nakon porođaja',
        subtitle: 'Početak poslijeporođajnog razdoblja',
        text: 'Tijelo postupno započinje oporavak nakon porođaja.',
      },
      {
        title: 'Lohije',
        subtitle: 'Poslijeporođajno krvarenje',
        text: 'Krvarenje se postupno mijenja po količini i boji.',
      },
      {
        title: 'Postupno smanjenje',
        subtitle: 'Tokom nekoliko sedmica',
        text: 'Krvarenje se općenito smanjuje tokom vremena.',
      },
      {
        title: 'Postupan povratak',
        subtitle: 'Prema uobičajenom ciklusu',
        text: 'Menstrualni ciklus se zatim može postupno ponovno uspostaviti.',
      },
    ],
    h2Section3: '3. Kako se lohije mijenjaju',
    body3:
      'Lohije obično postupno mijenjaju boju i smanjuju se po količini. Međutim, taj se tok može razlikovati od osobe do osobe.',
    lochiaEvolution: [
      {
        title: 'Crvene lohije',
        period: 'Prvi dani',
        text: 'Krvarenje je obično crveno i na početku može biti obilnije.',
      },
      {
        title: 'Ružičaste / smećkaste lohije',
        period: 'Nakon nekoliko dana',
        text: 'Boja može postati svjetlija ili smećkasta kako se protok smanjuje.',
      },
      {
        title: 'Bjelkaste lohije',
        period: 'Sljedeće sedmice',
        text: 'Krvarenje postupno postaje blaže i manje obilno.',
      },
    ],
    infoTitle: 'Ključne poruke',
    infoText:
      'Boja i količina lohija mogu se postupno mijenjati. Točan tok nije isti za svaku ženu.',
    h2Section4: '4. Briga o sebi',
    body4:
      'U tom razdoblju nekoliko jednostavnih navika može pomoći ugodi i podržati oporavak tijela.',
    careTips: [
      {title: 'Nježna higijena', text: 'Održavaj jednostavnu, ugodnu svakodnevnu higijenu.'},
      {title: 'Odmor', text: 'Daj svom tijelu vremena za oporavak.'},
      {title: 'Hidratacija', text: 'Ne zaboravi redovito piti prema svojim potrebama.'},
      {title: 'Ishrana', text: 'Raznolika ishrana podupire oporavak.'},
    ],
    h2Section5: '5. Kada zatražiti savjet',
    body5:
      'Određene situacije zahtijevaju žuran savjet zdravstvenog radnika, osobito kada se promjena čini znatnom, iznenadnom ili neobičnom.',
    warningTitle: 'Znakovi koje ne treba zanemariti',
    warningSubtitle: 'Po potrebi zatraži stručni savjet',
    warningSigns: [
      'Jak ili neobičan miris krvarenja',
      'Vrućica ili pogoršanje općeg stanja',
      'Krvarenje koje iznenada postaje vrlo obilno',
      'Jaka, dugotrajna ili neobična bol',
      'Novi simptom koji te brine',
    ],
    tipTitle: 'Dobro je znati',
    tipText:
      'Svaki je poslijeporođajni oporavak drugačiji. Informacije u ovom članku namijenjene su općem usmjeravanju i ne zamjenjuju ljekarski pregled.',
    summaryHeading: 'Ključne poruke',
    summary: [
      'Nifas je pojam koji se koristi u vjerskom kontekstu nakon porođaja.',
      'Medicinski se poslijeporođajno krvarenje naziva lohije.',
      'Lohije postupno mijenjaju boju i količinu.',
      'Odmor, nježna higijena i dobra hidratacija podupiru oporavak.',
      'Neobična ili zabrinjavajuća promjena zaslužuje stručni savjet.',
    ],
    disclaimerText:
      'Informativni sadržaj. Ovdje predstavljene medicinske informacije su općenite i ne zamjenjuju savjet zdravstvenog radnika. Za konkretna vjerska pitanja preporučuje se obratiti kvalificiranom vjerskom izvoru.',
    shareMessage: 'Nifas: medicinski aspekti — AWA',
  },
  sl: {
    badge: 'PO PORODU • NIFAS',
    title: 'Nifas:\nzdravstveni vidiki',
    metaDuration: '5 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Začetnica',
    metaValidated: 'Informativna vsebina',
    intro:
      'Po porodu telo prehaja skozi obdobje postopnega okrevanja. Razumevanje poporodne krvavitve, njenega poteka in znakov, ki zahtevajo pozornost, ti lahko pomaga, da se v tem času počutiš bolj informirano.',
    contentsTitle: 'V tem članku',
    topics: [
      'Razumevanje pojma nifas',
      'Medicinski vzorec po porodu',
      'Kako se lohije spreminjajo',
      'Skrb zase',
      'Kdaj poiskati nasvet',
      'Ključna sporočila',
    ],
    h2Section1: '1. Razumevanje pojma „nifas“',
    body1a:
      'Pojem „nifas“ spada v versko besedišče in pomeni obdobje, povezano s krvavitvijo, ki sledi po porodu, v okviru pravil islamskega prava.',
    body1b:
      'Medicinsko se krvavitev, opažena po porodu, imenuje „lohije“. Ta dva pojma je mogoče obravnavati ločeno: eden spada v verski okvir, drugi opisuje fiziološki pojav.',
    distinction: {
      nifasTitle: 'Nifas',
      nifasText: 'Pojem, ki spada v verski okvir po porodu.',
      lochiaTitle: 'Lohije',
      lochiaText: 'Medicinski izraz za poporodno krvavitev.',
    },
    h2Section2: '2. Medicinski vzorec po porodu',
    body2:
      'Poporodno okrevanje poteka postopoma. Poporodna krvavitev se na splošno spreminja skozi čas, medtem ko se maternica nadaljuje vračati v običajno stanje.',
    schemaTitle: 'Poporodni potek',
    schemaSubtitle: 'Poenostavljena medicinska referenca',
    stages: [
      {
        title: 'Po porodu',
        subtitle: 'Začetek poporodnega obdobja',
        text: 'Telo postopoma začne okrevati po porodu.',
      },
      {
        title: 'Lohije',
        subtitle: 'Poporodna krvavitev',
        text: 'Krvavitev se postopoma spreminja po količini in barvi.',
      },
      {
        title: 'Postopno zmanjšanje',
        subtitle: 'Skozi nekaj tednov',
        text: 'Krvavitev se na splošno zmanjšuje skozi čas.',
      },
      {
        title: 'Postopna vrnitev',
        subtitle: 'K običajnemu ciklu',
        text: 'Menstrualni cikel se nato lahko postopoma ponovno vzpostavi.',
      },
    ],
    h2Section3: '3. Kako se lohije spreminjajo',
    body3:
      'Lohije običajno postopoma spreminjajo barvo in se količinsko zmanjšujejo. Vendar se ta potek lahko razlikuje od osebe do osebe.',
    lochiaEvolution: [
      {
        title: 'Rdeče lohije',
        period: 'Prvi dnevi',
        text: 'Krvavitev je običajno rdeča in je na začetku lahko obilnejša.',
      },
      {
        title: 'Rožnate / rjavkaste lohije',
        period: 'Po nekaj dneh',
        text: 'Barva lahko postane svetlejša ali rjavkasta, ko se tok zmanjšuje.',
      },
      {
        title: 'Beličaste lohije',
        period: 'Naslednji tedni',
        text: 'Krvavitev postopoma postaja blažja in manj obilna.',
      },
    ],
    infoTitle: 'Ključna sporočila',
    infoText:
      'Barva in količina lohij se lahko postopoma spreminjata. Natančen potek ni enak pri vsaki ženski.',
    h2Section4: '4. Skrb zase',
    body4:
      'V tem obdobju lahko nekaj preprostih navad pomaga udobju in podpre okrevanje telesa.',
    careTips: [
      {title: 'Nežna higiena', text: 'Ohranjaj preprosto, udobno vsakodnevno higieno.'},
      {title: 'Počitek', text: 'Daj svojemu telesu časa za okrevanje.'},
      {title: 'Hidracija', text: 'Ne pozabi redno piti glede na svoje potrebe.'},
      {title: 'Prehrana', text: 'Raznolika prehrana podpira okrevanje.'},
    ],
    h2Section5: '5. Kdaj poiskati nasvet',
    body5:
      'Določene situacije zahtevajo hiter nasvet zdravstvenega delavca, zlasti kadar se sprememba zdi pomembna, nenadna ali nenavadna.',
    warningTitle: 'Znaki, ki jih ne smemo zanemariti',
    warningSubtitle: 'Po potrebi poišči strokovni nasvet',
    warningSigns: [
      'Močan ali nenavaden vonj krvavitve',
      'Vročina ali poslabšanje splošnega stanja',
      'Krvavitev, ki nenadoma postane zelo obilna',
      'Huda, dolgotrajna ali nenavadna bolečina',
      'Nov simptom, ki te skrbi',
    ],
    tipTitle: 'Vredno vedeti',
    tipText:
      'Vsako poporodno okrevanje je drugačno. Informacije v tem članku so namenjene splošnemu usmerjanju in ne nadomeščajo zdravniškega pregleda.',
    summaryHeading: 'Ključna sporočila',
    summary: [
      'Nifas je pojem, ki se uporablja v verskem kontekstu po porodu.',
      'Medicinsko se poporodna krvavitev imenuje lohije.',
      'Lohije postopoma spreminjajo barvo in količino.',
      'Počitek, nežna higiena in dobra hidracija podpirajo okrevanje.',
      'Nenavadna ali zaskrbljujoča sprememba zasluži strokovni nasvet.',
    ],
    disclaimerText:
      'Informativna vsebina. Tukaj predstavljene zdravstvene informacije so splošne in ne nadomeščajo nasveta zdravstvenega delavca. Za konkretna verska vprašanja se priporoča obrniti na kvalificiran verski vir.',
    shareMessage: 'Nifas: zdravstveni vidiki — AWA',
  },
  ne: {
    badge: 'सुत्केरीपछि • निफास',
    title: 'निफास:\nचिकित्सकीय पक्षहरू',
    metaDuration: '5 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'सुरुवाती',
    metaValidated: 'जानकारीमूलक सामग्री',
    intro:
      'प्रसवपछि, शरीर क्रमिक स्वास्थ्यलाभको अवधिबाट गुज्रिन्छ। सुत्केरीपछिको रक्तस्राव, यो कसरी बदलिन्छ, र ध्यान चाहिने संकेतहरू बुझ्नाले यो समयमा तपाईंलाई थप जानकार महसुस गराउन सक्छ।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'निफास शब्द बुझ्ने',
      'प्रसवपछिको चिकित्सकीय ढाँचा',
      'लोकिया कसरी बदलिन्छ',
      'आफ्नो ख्याल राख्ने',
      'सल्लाह कहिले लिने',
      'मुख्य कुराहरू',
    ],
    h2Section1: '1. "निफास" शब्द बुझ्ने',
    body1a:
      '"निफास" शब्द धार्मिक शब्दावलीको हो र इस्लामी न्यायशास्त्रका नियमभित्र प्रसवपछिको रक्तस्रावसँग सम्बन्धित अवधिलाई जनाउँछ।',
    body1b:
      'चिकित्सकीय रूपमा, प्रसवपछि देखिने रक्तस्रावलाई "लोकिया" भनिन्छ। यी दुई अवधारणालाई छुट्टाछुट्टै विचार गर्न सकिन्छ: एउटा धार्मिक ढाँचासँग सम्बन्धित छ, अर्काले शारीरिक घटनाको वर्णन गर्छ।',
    distinction: {
      nifasTitle: 'निफास',
      nifasText: 'प्रसवपछिको धार्मिक ढाँचासँग सम्बन्धित एउटा अवधारणा।',
      lochiaTitle: 'लोकिया',
      lochiaText: 'सुत्केरीपछिको रक्तस्रावका लागि प्रयोग हुने चिकित्सकीय शब्द।',
    },
    h2Section2: '2. प्रसवपछिको चिकित्सकीय ढाँचा',
    body2:
      'सुत्केरीपछिको स्वास्थ्यलाभ बिस्तारै हुन्छ। गर्भाशय आफ्नो सामान्य अवस्थामा फर्किरहँदा सुत्केरीपछिको रक्तस्राव सामान्यतया समयसँगै बदलिन्छ।',
    schemaTitle: 'सुत्केरीपछिको प्रगति',
    schemaSubtitle: 'सरलीकृत चिकित्सकीय सन्दर्भ',
    stages: [
      {
        title: 'प्रसवपछि',
        subtitle: 'सुत्केरीपछिको अवधिको सुरुवात',
        text: 'प्रसवपछि शरीरले बिस्तारै आफ्नो स्वास्थ्यलाभ सुरु गर्छ।',
      },
      {
        title: 'लोकिया',
        subtitle: 'सुत्केरीपछिको रक्तस्राव',
        text: 'रक्तस्रावको मात्रा र रङ बिस्तारै बदलिन्छ।',
      },
      {
        title: 'क्रमिक घटाइ',
        subtitle: 'केही हप्तामा',
        text: 'रक्तस्राव सामान्यतया समयसँगै घट्छ।',
      },
      {
        title: 'क्रमिक फिर्ती',
        subtitle: 'सामान्य चक्रतर्फ',
        text: 'मासिक चक्र त्यसपछि बिस्तारै फेरि सुरु हुन सक्छ।',
      },
    ],
    h2Section3: '3. लोकिया कसरी बदलिन्छ',
    body3:
      'लोकियाको रङ सामान्यतया बिस्तारै बदलिन्छ र मात्रा घट्छ। तथापि, यो प्रगति व्यक्तिपिच्छे फरक हुन सक्छ।',
    lochiaEvolution: [
      {
        title: 'रातो लोकिया',
        period: 'पहिला दिनहरू',
        text: 'रक्तस्राव सामान्यतया रातो हुन्छ र सुरुमा बढी हुन सक्छ।',
      },
      {
        title: 'गुलाबी / खैरोजस्तो लोकिया',
        period: 'केही दिनपछि',
        text: 'बहाव घट्दै जाँदा रङ हल्का वा खैरोजस्तो हुन सक्छ।',
      },
      {
        title: 'सेतोजस्तो लोकिया',
        period: 'आगामी हप्ताहरू',
        text: 'रक्तस्राव बिस्तारै हल्का र कम मात्राको हुँदै जान्छ।',
      },
    ],
    infoTitle: 'मुख्य कुराहरू',
    infoText:
      'लोकियाको रङ र मात्रा बिस्तारै बदलिन सक्छ। सही प्रगति सबैका लागि उस्तै हुँदैन।',
    h2Section4: '4. आफ्नो ख्याल राख्ने',
    body4:
      'यो अवधिमा, केही सरल बानीहरूले सहजतामा मद्दत गर्न र शरीरको स्वास्थ्यलाभलाई साथ दिन सक्छन्।',
    careTips: [
      {title: 'कोमल सरसफाइ', text: 'सरल, सहज दैनिक सरसफाइको दिनचर्या कायम राख्नुहोस्।'},
      {title: 'आराम', text: 'आफ्नो शरीरलाई निको हुने समय दिनुहोस्।'},
      {title: 'पानीको सेवन', text: 'आफ्नो आवश्यकताअनुसार नियमित रूपमा पानी पिउन सम्झनुहोस्।'},
      {title: 'पोषण', text: 'विविधतापूर्ण खानपानले स्वास्थ्यलाभलाई साथ दिन्छ।'},
    ],
    h2Section5: '5. सल्लाह कहिले लिने',
    body5:
      'केही अवस्थाहरूमा स्वास्थ्यकर्मीको छिटो सल्लाह चाहिन्छ, विशेष गरी जब कुनै परिवर्तन ठूलो, अचानक वा असामान्य लाग्छ।',
    warningTitle: 'बेवास्ता नगर्नुपर्ने संकेतहरू',
    warningSubtitle: 'आवश्यक परे व्यावसायिक सल्लाह लिनुहोस्',
    warningSigns: [
      'रक्तस्रावमा कडा वा असामान्य गन्ध',
      'ज्वरो वा बिग्रँदो समग्र अवस्था',
      'अचानक निकै धेरै हुने रक्तस्राव',
      'ठूलो, लगातार वा असामान्य दुखाइ',
      'तपाईंलाई चिन्तित बनाउने नयाँ लक्षण',
    ],
    tipTitle: 'जान्न लायक',
    tipText:
      'हरेक सुत्केरीपछिको स्वास्थ्यलाभ फरक हुन्छ। यो लेखको जानकारी सामान्य मार्गदर्शन दिनका लागि हो र चिकित्सकीय परामर्शको स्थान लिँदैन।',
    summaryHeading: 'मुख्य कुराहरू',
    summary: [
      'निफास प्रसवपछि धार्मिक सन्दर्भमा प्रयोग हुने शब्द हो।',
      'चिकित्सकीय रूपमा, सुत्केरीपछिको रक्तस्रावलाई लोकिया भनिन्छ।',
      'लोकिया बिस्तारै रङ र मात्रामा बदलिन्छ।',
      'आराम, कोमल सरसफाइ र राम्रो पानीको सेवनले स्वास्थ्यलाभलाई साथ दिन्छ।',
      'असामान्य वा चिन्ताजनक परिवर्तनले व्यावसायिक सल्लाह पाउनुपर्छ।',
    ],
    disclaimerText:
      'जानकारीमूलक सामग्री। यहाँ प्रस्तुत चिकित्सकीय जानकारी सामान्य हो र स्वास्थ्यकर्मीको सल्लाहको स्थान लिँदैन। विशेष धार्मिक प्रश्नहरूका लागि, योग्य धार्मिक स्रोतलाई हेर्न सिफारिस गरिन्छ।',
    shareMessage: 'निफास: चिकित्सकीय पक्षहरू — AWA',
  },
  si: {
    badge: 'ප්‍රසූතියෙන් පසු • නිෆාස්',
    title: 'නිෆාස්:\nවෛද්‍ය පැත්ත',
    metaDuration: 'කියවීමට මිනිත්තු 5',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'තොරතුරු අන්තර්ගතය',
    intro:
      'ප්‍රසූතියෙන් පසු, ශරීරය ක්‍රමානුකූල යථා තත්ත්වයට පැමිණීමේ කාලයක් හරහා ගමන් කරයි. ප්‍රසූතියෙන් පසු ලේ ගැලීම, එය වෙනස් වන ආකාරය සහ අවධානය අවශ්‍ය සලකුණු තේරුම් ගැනීම මෙම කාලය තුළ ඔබට වඩා දැනුවත්ව සිටීමට උපකාරී විය හැක.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'නිෆාස් යන යෙදුම තේරුම් ගැනීම',
      'ප්‍රසූතියෙන් පසු වෛද්‍ය රටාව',
      'ප්‍රසූතියෙන් පසු ස්‍රාවය වෙනස් වන ආකාරය',
      'ඔබ ගැන සැලකිලිමත් වීම',
      'උපදෙස් ඉල්ලිය යුත්තේ කවදාද',
      'ප්‍රධාන කරුණු',
    ],
    h2Section1: '1. "නිෆාස්" යන යෙදුම තේරුම් ගැනීම',
    body1a:
      '"නිෆාස්" යන යෙදුම ආගමික වචන මාලාවට අයත් වන අතර, ඉස්ලාමීය නීති විද්‍යාවේ රීති තුළ ප්‍රසූතියෙන් පසු සිදුවන ලේ ගැලීම සමඟ සම්බන්ධ කාලය දක්වයි.',
    body1b:
      'වෛද්‍යමය වශයෙන්, ප්‍රසූතියෙන් පසු නිරීක්ෂණය කරන ලේ ගැලීම "ප්‍රසූතියෙන් පසු ස්‍රාවය" ලෙස හැඳින්වේ. මෙම සංකල්ප දෙක වෙන වෙනම සැලකිය හැක: එකක් ආගමික රාමුවකට අයත් වන අතර, අනෙක කායික සංසිද්ධියක් විස්තර කරයි.',
    distinction: {
      nifasTitle: 'නිෆාස්',
      nifasText: 'ප්‍රසූතියෙන් පසු ආගමික රාමුවට අයත් සංකල්පයක්.',
      lochiaTitle: 'ප්‍රසූතියෙන් පසු ස්‍රාවය',
      lochiaText: 'ප්‍රසූතියෙන් පසු ලේ ගැලීම සඳහා භාවිතා කරන වෛද්‍ය යෙදුම.',
    },
    h2Section2: '2. ප්‍රසූතියෙන් පසු වෛද්‍ය රටාව',
    body2:
      'ප්‍රසූතියෙන් පසු යථා තත්ත්වයට පැමිණීම ක්‍රමයෙන් සිදුවේ. ගර්භාෂය සුපුරුදු තත්ත්වයට ආපසු පැමිණෙමින් සිටින විට ප්‍රසූතියෙන් පසු ලේ ගැලීම සාමාන්‍යයෙන් කාලයත් සමඟ වෙනස් වේ.',
    schemaTitle: 'ප්‍රසූතියෙන් පසු ප්‍රගතිය',
    schemaSubtitle: 'සරල කළ වෛද්‍ය යොමුව',
    stages: [
      {
        title: 'ප්‍රසූතියෙන් පසු',
        subtitle: 'ප්‍රසූතියෙන් පසු කාලයේ ආරම්භය',
        text: 'ප්‍රසූතියෙන් පසු ශරීරය ක්‍රමයෙන් තම යථා තත්ත්වයට පැමිණීම ආරම්භ කරයි.',
      },
      {
        title: 'ප්‍රසූතියෙන් පසු ස්‍රාවය',
        subtitle: 'ප්‍රසූතියෙන් පසු ලේ ගැලීම',
        text: 'ලේ ගැලීම ප්‍රමාණයෙන් සහ වර්ණයෙන් ක්‍රමයෙන් වෙනස් වේ.',
      },
      {
        title: 'ක්‍රමානුකූල අඩුවීම',
        subtitle: 'සති කිහිපයක් පුරා',
        text: 'ලේ ගැලීම සාමාන්‍යයෙන් කාලයත් සමඟ අඩු වේ.',
      },
      {
        title: 'ක්‍රමානුකූල නැවත පැමිණීම',
        subtitle: 'සුපුරුදු චක්‍රය දෙසට',
        text: 'ඔසප් චක්‍රය එවිට ක්‍රමයෙන් නැවත ආරම්භ විය හැක.',
      },
    ],
    h2Section3: '3. ප්‍රසූතියෙන් පසු ස්‍රාවය වෙනස් වන ආකාරය',
    body3:
      'ප්‍රසූතියෙන් පසු ස්‍රාවය සාමාන්‍යයෙන් වර්ණයෙන් ක්‍රමයෙන් වෙනස් වී ප්‍රමාණයෙන් අඩු වේ. කෙසේ වෙතත්, මෙම ප්‍රගතිය පුද්ගලයාගෙන් පුද්ගලයාට වෙනස් විය හැක.',
    lochiaEvolution: [
      {
        title: 'රතු ස්‍රාවය',
        period: 'පළමු දින',
        text: 'ලේ ගැලීම සාමාන්‍යයෙන් රතු වන අතර ආරම්භයේදී වැඩි විය හැක.',
      },
      {
        title: 'රෝස / දුඹුරු පැහැති ස්‍රාවය',
        period: 'දින කිහිපයකට පසු',
        text: 'ගලනය අඩු වන විට වර්ණය ලා පැහැයට හෝ දුඹුරු පැහැයට හැරිය හැක.',
      },
      {
        title: 'සුදුපැහැති ස්‍රාවය',
        period: 'ඉදිරි සති',
        text: 'ලේ ගැලීම ක්‍රමයෙන් ලා වී අඩුවෙන් පවතී.',
      },
    ],
    infoTitle: 'ප්‍රධාන කරුණු',
    infoText:
      'ප්‍රසූතියෙන් පසු ස්‍රාවයේ වර්ණය සහ ප්‍රමාණය ක්‍රමයෙන් වෙනස් විය හැක. නිශ්චිත ප්‍රගතිය සෑම කෙනෙකුටම එකම නොවේ.',
    h2Section4: '4. ඔබ ගැන සැලකිලිමත් වීම',
    body4:
      'මෙම කාලය තුළ, සරල පුරුදු කිහිපයක් සුවපහසුවට උපකාරී වී ශරීරයේ යථා තත්ත්වයට පැමිණීමට සහාය විය හැක.',
    careTips: [
      {title: 'මෘදු සනීපාරක්ෂාව', text: 'සරල, සුවපහසු එදිනෙදා සනීපාරක්ෂක පුරුද්දක් පවත්වන්න.'},
      {title: 'විවේකය', text: 'ඔබේ ශරීරයට යථා තත්ත්වයට පැමිණීමට කාලය දෙන්න.'},
      {title: 'ජල සමතුලිතතාව', text: 'ඔබේ අවශ්‍යතා අනුව නිතිපතා පානය කිරීමට මතක තබාගන්න.'},
      {title: 'පෝෂණය', text: 'විවිධාකාර ආහාර වේලක් යථා තත්ත්වයට පැමිණීමට සහාය වේ.'},
    ],
    h2Section5: '5. උපදෙස් ඉල්ලිය යුත්තේ කවදාද',
    body5:
      'සමහර තත්ත්වයන් සෞඛ්‍ය වෘත්තිකයෙකුගෙන් කඩිනම් උපදෙස් ඉල්ලා සිටී, විශේෂයෙන් වෙනසක් සැලකිය යුතු, හදිසි, හෝ අසාමාන්‍ය ලෙස පෙනෙන විට.',
    warningTitle: 'නොසලකා නොහැරිය යුතු සලකුණු',
    warningSubtitle: 'අවශ්‍ය නම් වෘත්තීය උපදෙස් ඉල්ලන්න',
    warningSigns: [
      'ලේ ගැලීමේ දැඩි හෝ අසාමාන්‍ය ගඳක්',
      'උණ හෝ නරක අතට හැරෙන සමස්ත තත්ත්වයක්',
      'හදිසියේ ඉතා වැඩි වන ලේ ගැලීම',
      'සැලකිය යුතු, දිගටම පවතින හෝ අසාමාන්‍ය වේදනාවක්',
      'ඔබව කනස්සල්ලට පත් කරන නව රෝග ලක්ෂණයක්',
    ],
    tipTitle: 'දැනගත යුතු දේ',
    tipText:
      'සෑම ප්‍රසූතියෙන් පසු යථා තත්ත්වයට පැමිණීමක්ම වෙනස්. මෙම ලිපියේ තොරතුරු සාමාන්‍ය මඟපෙන්වීමක් ලබා දීමට අදහස් කර ඇති අතර වෛද්‍ය උපදේශනයක් වෙනුවට නොපවතී.',
    summaryHeading: 'ප්‍රධාන කරුණු',
    summary: [
      'නිෆාස් යනු ප්‍රසූතියෙන් පසු ආගමික සන්දර්භයේ භාවිතා වන යෙදුමකි.',
      'වෛද්‍යමය වශයෙන්, ප්‍රසූතියෙන් පසු ලේ ගැලීම ප්‍රසූතියෙන් පසු ස්‍රාවය ලෙස හැඳින්වේ.',
      'ප්‍රසූතියෙන් පසු ස්‍රාවය වර්ණයෙන් සහ ප්‍රමාණයෙන් ක්‍රමයෙන් වෙනස් වේ.',
      'විවේකය, මෘදු සනීපාරක්ෂාව සහ හොඳ ජල සමතුලිතතාව යථා තත්ත්වයට පැමිණීමට සහාය වේ.',
      'අසාමාන්‍ය හෝ කනස්සල්ලට කරුණක් වන වෙනසකට වෘත්තීය උපදෙස් සුදුසුයි.',
    ],
    disclaimerText:
      'තොරතුරු අන්තර්ගතයකි. මෙහි ඉදිරිපත් කර ඇති වෛද්‍ය තොරතුරු සාමාන්‍ය වන අතර සෞඛ්‍ය වෘත්තිකයෙකුගේ උපදෙස් වෙනුවට නොපවතී. නිශ්චිත ආගමික ප්‍රශ්න සඳහා, සුදුසුකම් ලත් ආගමික මූලාශ්‍රයකට යොමු වීම නිර්දේශ කෙරේ.',
    shareMessage: 'නිෆාස්: වෛද්‍ය පැත්ත — AWA',
  },
  th: {
    badge: 'หลังคลอด • นิฟาส',
    title: 'นิฟาส:\nด้านการแพทย์',
    metaDuration: 'อ่าน 5 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาเพื่อให้ข้อมูล',
    intro:
      'หลังคลอด ร่างกายผ่านช่วงฟื้นตัวทีละน้อย การทำความเข้าใจเลือดที่ออกหลังคลอด การเปลี่ยนแปลงของมัน และสัญญาณที่ควรใส่ใจ ช่วยให้คุณรู้สึกมีข้อมูลมากขึ้นในช่วงเวลานี้',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'ทำความเข้าใจคำว่านิฟาส',
      'รูปแบบทางการแพทย์หลังคลอด',
      'น้ำคาวปลาเปลี่ยนแปลงอย่างไร',
      'ดูแลตัวเอง',
      'เมื่อไรควรขอคำแนะนำ',
      'ประเด็นสำคัญ',
    ],
    h2Section1: '1. ทำความเข้าใจคำว่า "นิฟาส"',
    body1a:
      'คำว่า "นิฟาส" อยู่ในคำศัพท์ทางศาสนา และหมายถึงช่วงเวลาที่เกี่ยวข้องกับเลือดที่ออกหลังคลอดตามกฎของนิติศาสตร์อิสลาม',
    body1b:
      'ในทางการแพทย์ เลือดที่ออกหลังคลอดเรียกว่า "น้ำคาวปลา" สองแนวคิดนี้พิจารณาแยกกันได้: แนวคิดหนึ่งอยู่ในกรอบทางศาสนา อีกแนวคิดหนึ่งอธิบายปรากฏการณ์ทางสรีรวิทยา',
    distinction: {
      nifasTitle: 'นิฟาส',
      nifasText: 'แนวคิดที่อยู่ในกรอบทางศาสนาหลังคลอด',
      lochiaTitle: 'น้ำคาวปลา',
      lochiaText: 'คำศัพท์ทางการแพทย์ที่ใช้เรียกเลือดที่ออกหลังคลอด',
    },
    h2Section2: '2. รูปแบบทางการแพทย์หลังคลอด',
    body2:
      'การฟื้นตัวหลังคลอดเกิดขึ้นทีละน้อย เลือดที่ออกหลังคลอดมักเปลี่ยนไปตามเวลาขณะที่มดลูกกลับสู่สภาพปกติต่อไป',
    schemaTitle: 'ความก้าวหน้าหลังคลอด',
    schemaSubtitle: 'แหล่งอ้างอิงทางการแพทย์แบบย่อ',
    stages: [
      {
        title: 'หลังคลอด',
        subtitle: 'จุดเริ่มต้นของช่วงหลังคลอด',
        text: 'ร่างกายค่อย ๆ เริ่มฟื้นตัวหลังคลอด',
      },
      {
        title: 'น้ำคาวปลา',
        subtitle: 'เลือดที่ออกหลังคลอด',
        text: 'เลือดค่อย ๆ เปลี่ยนปริมาณและสี',
      },
      {
        title: 'ค่อย ๆ ลดลง',
        subtitle: 'ในช่วงหลายสัปดาห์',
        text: 'เลือดที่ออกมักลดลงตามเวลา',
      },
      {
        title: 'ค่อย ๆ กลับมา',
        subtitle: 'สู่รอบเดือนปกติ',
        text: 'จากนั้นรอบเดือนอาจค่อย ๆ กลับมา',
      },
    ],
    h2Section3: '3. น้ำคาวปลาเปลี่ยนแปลงอย่างไร',
    body3:
      'น้ำคาวปลามักเปลี่ยนสีทีละน้อยและลดปริมาณลง อย่างไรก็ตาม การเปลี่ยนแปลงนี้อาจต่างกันในแต่ละคน',
    lochiaEvolution: [
      {
        title: 'น้ำคาวปลาสีแดง',
        period: 'วันแรก ๆ',
        text: 'เลือดที่ออกมักเป็นสีแดงและอาจมากกว่าในช่วงต้น',
      },
      {
        title: 'น้ำคาวปลาสีชมพู / น้ำตาลอ่อน',
        period: 'หลังผ่านไปไม่กี่วัน',
        text: 'สีอาจจางลงหรือเป็นสีน้ำตาลเมื่อปริมาณลดลง',
      },
      {
        title: 'น้ำคาวปลาสีขาว',
        period: 'ในสัปดาห์ถัดมา',
        text: 'เลือดที่ออกค่อย ๆ จางลงและมีปริมาณน้อยลง',
      },
    ],
    infoTitle: 'ประเด็นสำคัญ',
    infoText:
      'สีและปริมาณของน้ำคาวปลาอาจเปลี่ยนไปทีละน้อย การเปลี่ยนแปลงที่แน่ชัดไม่เหมือนกันทุกคน',
    h2Section4: '4. ดูแลตัวเอง',
    body4:
      'ในช่วงนี้ นิสัยง่าย ๆ ไม่กี่อย่างช่วยเรื่องความสบายและสนับสนุนการฟื้นตัวของร่างกาย',
    careTips: [
      {title: 'สุขอนามัยอย่างอ่อนโยน', text: 'รักษากิจวัตรสุขอนามัยประจำวันที่เรียบง่ายและสบาย'},
      {title: 'พักผ่อน', text: 'ให้เวลาร่างกายได้ฟื้นตัว'},
      {title: 'ดื่มน้ำ', text: 'อย่าลืมดื่มน้ำสม่ำเสมอตามความต้องการ'},
      {title: 'โภชนาการ', text: 'อาหารที่หลากหลายสนับสนุนการฟื้นตัว'},
    ],
    h2Section5: '5. เมื่อไรควรขอคำแนะนำ',
    body5:
      'สถานการณ์บางอย่างต้องการคำแนะนำจากบุคลากรทางการแพทย์โดยเร็ว โดยเฉพาะเมื่อการเปลี่ยนแปลงดูมาก กะทันหัน หรือผิดปกติ',
    warningTitle: 'สัญญาณที่ไม่ควรละเลย',
    warningSubtitle: 'ขอคำแนะนำจากผู้เชี่ยวชาญหากจำเป็น',
    warningSigns: [
      'กลิ่นแรงหรือผิดปกติในเลือดที่ออก',
      'ไข้หรือสภาพโดยรวมที่แย่ลง',
      'เลือดที่ออกมากขึ้นอย่างกะทันหัน',
      'อาการปวดมาก ต่อเนื่อง หรือผิดปกติ',
      'อาการใหม่ที่ทำให้คุณกังวล',
    ],
    tipTitle: 'ควรรู้',
    tipText:
      'การฟื้นตัวหลังคลอดของแต่ละคนแตกต่างกัน ข้อมูลในบทความนี้มีไว้เพื่อให้แนวทางทั่วไป และไม่ได้ทดแทนการปรึกษาแพทย์',
    summaryHeading: 'ประเด็นสำคัญ',
    summary: [
      'นิฟาสเป็นคำที่ใช้ในบริบททางศาสนาหลังคลอด',
      'ในทางการแพทย์ เลือดที่ออกหลังคลอดเรียกว่าน้ำคาวปลา',
      'น้ำคาวปลาค่อย ๆ เปลี่ยนสีและปริมาณ',
      'การพักผ่อน สุขอนามัยอย่างอ่อนโยน และการดื่มน้ำที่ดี สนับสนุนการฟื้นตัว',
      'การเปลี่ยนแปลงที่ผิดปกติหรือน่ากังวลควรได้รับคำแนะนำจากผู้เชี่ยวชาญ',
    ],
    disclaimerText:
      'เนื้อหาเพื่อให้ข้อมูล ข้อมูลทางการแพทย์ที่นำเสนอที่นี่เป็นข้อมูลทั่วไปและไม่ได้ทดแทนคำแนะนำของบุคลากรทางการแพทย์ สำหรับคำถามทางศาสนาเฉพาะ แนะนำให้อ้างอิงแหล่งข้อมูลทางศาสนาที่มีคุณวุฒิ',
    shareMessage: 'นิฟาส: ด้านการแพทย์ — AWA',
  },
  vi: {
    badge: 'SAU SINH • NIFAS',
    title: 'Nifas:\nkhía cạnh y học',
    metaDuration: '5 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung mang tính thông tin',
    intro:
      'Sau khi sinh, cơ thể trải qua một giai đoạn hồi phục dần dần. Hiểu về việc ra máu sau sinh, cách nó diễn tiến và những dấu hiệu cần chú ý có thể giúp bạn cảm thấy hiểu biết hơn trong thời gian này.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Hiểu thuật ngữ Nifas',
      'Quy luật y học sau sinh',
      'Sản dịch diễn tiến thế nào',
      'Chăm sóc bản thân',
      'Khi nào nên tìm lời khuyên',
      'Những điểm chính cần nhớ',
    ],
    h2Section1: '1. Hiểu thuật ngữ "Nifas"',
    body1a:
      'Thuật ngữ "Nifas" thuộc về từ vựng tôn giáo và chỉ giai đoạn liên quan đến việc ra máu sau khi sinh trong các quy định của luật học Hồi giáo.',
    body1b:
      'Về mặt y học, việc ra máu quan sát được sau khi sinh được gọi là "sản dịch". Hai khái niệm này có thể được xem xét riêng: một thuộc về khuôn khổ tôn giáo, một mô tả hiện tượng sinh lý.',
    distinction: {
      nifasTitle: 'Nifas',
      nifasText: 'Một khái niệm thuộc khuôn khổ tôn giáo sau khi sinh.',
      lochiaTitle: 'Sản dịch',
      lochiaText: 'Thuật ngữ y học dùng cho việc ra máu sau sinh.',
    },
    h2Section2: '2. Quy luật y học sau sinh',
    body2:
      'Sự hồi phục sau sinh diễn ra dần dần. Việc ra máu sau sinh nhìn chung thay đổi theo thời gian khi tử cung tiếp tục trở về trạng thái thông thường.',
    schemaTitle: 'Diễn tiến sau sinh',
    schemaSubtitle: 'Tham chiếu y học đơn giản hóa',
    stages: [
      {
        title: 'Sau khi sinh',
        subtitle: 'Bắt đầu giai đoạn sau sinh',
        text: 'Cơ thể dần bắt đầu quá trình hồi phục sau khi sinh.',
      },
      {
        title: 'Sản dịch',
        subtitle: 'Ra máu sau sinh',
        text: 'Việc ra máu dần thay đổi về lượng và màu sắc.',
      },
      {
        title: 'Giảm dần',
        subtitle: 'Trong vài tuần',
        text: 'Việc ra máu nhìn chung giảm dần theo thời gian.',
      },
      {
        title: 'Trở lại dần dần',
        subtitle: 'Hướng tới chu kỳ thông thường',
        text: 'Chu kỳ kinh nguyệt sau đó có thể dần hoạt động trở lại.',
      },
    ],
    h2Section3: '3. Sản dịch diễn tiến thế nào',
    body3:
      'Sản dịch nhìn chung thay đổi màu sắc dần dần và giảm về lượng. Tuy nhiên, diễn tiến này có thể khác nhau giữa từng người.',
    lochiaEvolution: [
      {
        title: 'Sản dịch đỏ',
        period: 'Những ngày đầu',
        text: 'Việc ra máu thường có màu đỏ và có thể nhiều hơn lúc ban đầu.',
      },
      {
        title: 'Sản dịch hồng / hơi nâu',
        period: 'Sau vài ngày',
        text: 'Màu sắc có thể nhạt hơn hoặc ngả nâu khi lượng giảm đi.',
      },
      {
        title: 'Sản dịch trắng đục',
        period: 'Những tuần tiếp theo',
        text: 'Việc ra máu dần nhạt hơn và ít hơn.',
      },
    ],
    infoTitle: 'Những điểm chính cần nhớ',
    infoText:
      'Màu sắc và lượng sản dịch có thể thay đổi dần dần. Diễn tiến chính xác không giống nhau ở mọi người.',
    h2Section4: '4. Chăm sóc bản thân',
    body4:
      'Trong giai đoạn này, một vài thói quen đơn giản có thể giúp thoải mái và hỗ trợ sự hồi phục của cơ thể.',
    careTips: [
      {title: 'Vệ sinh nhẹ nhàng', text: 'Duy trì thói quen vệ sinh hằng ngày đơn giản, thoải mái.'},
      {title: 'Nghỉ ngơi', text: 'Cho cơ thể bạn thời gian để hồi phục.'},
      {title: 'Uống nước', text: 'Hãy nhớ uống nước đều đặn theo nhu cầu của bạn.'},
      {title: 'Dinh dưỡng', text: 'Một chế độ ăn đa dạng hỗ trợ sự hồi phục.'},
    ],
    h2Section5: '5. Khi nào nên tìm lời khuyên',
    body5:
      'Một số tình huống cần lời khuyên kịp thời từ nhân viên y tế, đặc biệt khi một thay đổi có vẻ đáng kể, đột ngột hoặc bất thường.',
    warningTitle: 'Những dấu hiệu không nên bỏ qua',
    warningSubtitle: 'Hãy tìm lời khuyên chuyên môn nếu cần',
    warningSigns: [
      'Mùi nồng hoặc bất thường trong dịch ra',
      'Sốt hoặc tình trạng chung xấu đi',
      'Việc ra máu đột ngột trở nên rất nhiều',
      'Đau đáng kể, kéo dài hoặc bất thường',
      'Một triệu chứng mới khiến bạn lo lắng',
    ],
    tipTitle: 'Nên biết',
    tipText:
      'Mỗi quá trình hồi phục sau sinh đều khác nhau. Thông tin trong bài viết này nhằm cung cấp hướng dẫn chung và không thay thế một buổi khám y tế.',
    summaryHeading: 'Những điểm chính cần nhớ',
    summary: [
      'Nifas là một thuật ngữ được dùng trong bối cảnh tôn giáo sau khi sinh.',
      'Về mặt y học, việc ra máu sau sinh được gọi là sản dịch.',
      'Sản dịch dần thay đổi về màu sắc và lượng.',
      'Nghỉ ngơi, vệ sinh nhẹ nhàng và uống đủ nước hỗ trợ sự hồi phục.',
      'Một thay đổi bất thường hoặc đáng lo cần lời khuyên chuyên môn.',
    ],
    disclaimerText:
      'Nội dung mang tính thông tin. Thông tin y học trình bày ở đây mang tính chung và không thay thế lời khuyên của nhân viên y tế. Với các câu hỏi tôn giáo cụ thể, nên tham khảo một nguồn tôn giáo có thẩm quyền.',
    shareMessage: 'Nifas: khía cạnh y học — AWA',
  },
  uz: {
    badge: 'TUGʻRUQDAN KEYIN • NIFOS',
    title: 'Nifos:\ntibbiy jihatlari',
    metaDuration: '5 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Maʼlumot uchun kontent',
    intro:
      'Tugʻruqdan keyin tana bosqichma-bosqich tiklanish davrini boshdan kechiradi. Tugʻruqdan keyingi qon ketishini, uning qanday oʻzgarishini va eʼtibor talab qiladigan belgilarni tushunish bu davrda oʻzingizni xabardorroq his qilishga yordam beradi.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Nifos atamasini tushunish',
      'Tugʻruqdan keyingi tibbiy manzara',
      'Lohiya qanday oʻzgaradi',
      'Oʻzingizga gʻamxoʻrlik qilish',
      'Qachon maslahat olish kerak',
      'Asosiy xulosalar',
    ],
    h2Section1: '1. “Nifos” atamasini tushunish',
    body1a:
      '“Nifos” atamasi diniy lugʻatga mansub boʻlib, islom fiqhi qoidalari doirasida tugʻruqdan keyingi qon ketishi bilan bogʻliq davrni bildiradi.',
    body1b:
      'Tibbiy jihatdan tugʻruqdan keyin kuzatiladigan qon ketishi “lohiya” deb ataladi. Bu ikki tushunchani alohida koʻrib chiqish mumkin: biri diniy doiraga mansub, ikkinchisi fiziologik hodisani tasvirlaydi.',
    distinction: {
      nifasTitle: 'Nifos',
      nifasText: 'Tugʻruqdan keyin diniy doiraga mansub tushuncha.',
      lochiaTitle: 'Lohiya',
      lochiaText: 'Tugʻruqdan keyingi qon ketishi uchun ishlatiladigan tibbiy atama.',
    },
    h2Section2: '2. Tugʻruqdan keyingi tibbiy manzara',
    body2:
      'Tugʻruqdan keyingi tiklanish bosqichma-bosqich kechadi. Bachadon oʻzining odatiy holatiga qaytishda davom etar ekan, tugʻruqdan keyingi qon ketishi odatda vaqt oʻtishi bilan oʻzgaradi.',
    schemaTitle: 'Tugʻruqdan keyingi jarayon',
    schemaSubtitle: 'Soddalashtirilgan tibbiy tayanch',
    stages: [
      {
        title: 'Tugʻruqdan keyin',
        subtitle: 'Tugʻruqdan keyingi davr boshlanishi',
        text: 'Tana tugʻruqdan keyin asta-sekin tiklana boshlaydi.',
      },
      {
        title: 'Lohiya',
        subtitle: 'Tugʻruqdan keyingi qon ketishi',
        text: 'Qon ketishi miqdori va rangi asta-sekin oʻzgaradi.',
      },
      {
        title: 'Asta-sekin kamayish',
        subtitle: 'Bir necha hafta davomida',
        text: 'Qon ketishi odatda vaqt oʻtishi bilan kamayadi.',
      },
      {
        title: 'Asta-sekin qaytish',
        subtitle: 'Odatiy sikl tomon',
        text: 'Shundan soʻng hayz sikli asta-sekin qayta boshlanishi mumkin.',
      },
    ],
    h2Section3: '3. Lohiya qanday oʻzgaradi',
    body3:
      'Lohiya odatda rangini asta-sekin oʻzgartiradi va miqdori kamayadi. Biroq bu jarayon odamdan odamga farq qilishi mumkin.',
    lochiaEvolution: [
      {
        title: 'Qizil lohiya',
        period: 'Dastlabki kunlar',
        text: 'Qon ketishi odatda qizil boʻladi va boshida koʻproq boʻlishi mumkin.',
      },
      {
        title: 'Pushti / jigarrangsimon lohiya',
        period: 'Bir necha kundan keyin',
        text: 'Oqim kamayganda rang ochilashishi yoki jigarrangsimon boʻlishi mumkin.',
      },
      {
        title: 'Oqish lohiya',
        period: 'Keyingi haftalar',
        text: 'Qon ketishi asta-sekin yengillashadi va kamroq boʻladi.',
      },
    ],
    infoTitle: 'Asosiy xulosalar',
    infoText:
      'Lohiyaning rangi va miqdori asta-sekin oʻzgarishi mumkin. Aniq jarayon hamma uchun bir xil emas.',
    h2Section4: '4. Oʻzingizga gʻamxoʻrlik qilish',
    body4:
      'Bu davrda bir nechta oddiy odat qulaylikka yordam beradi va tananing tiklanishini qoʻllab-quvvatlaydi.',
    careTips: [
      {title: 'Muloyim gigiyena', text: 'Oddiy, qulay kundalik gigiyena tartibini saqlang.'},
      {title: 'Dam olish', text: 'Tanangizga tiklanish uchun vaqt bering.'},
      {title: 'Suv balansi', text: 'Ehtiyojingizga qarab muntazam ichishni unutmang.'},
      {title: 'Ovqatlanish', text: 'Xilma-xil ovqatlanish tiklanishni qoʻllab-quvvatlaydi.'},
    ],
    h2Section5: '5. Qachon maslahat olish kerak',
    body5:
      'Baʼzi vaziyatlar sogʻliqni saqlash mutaxassisining tezkor maslahatini talab qiladi, ayniqsa oʻzgarish sezilarli, birdan yoki odatdan tashqari tuyulsa.',
    warningTitle: 'Eʼtiborsiz qoldirmaslik kerak boʻlgan belgilar',
    warningSubtitle: 'Kerak boʻlsa, mutaxassisdan maslahat oling',
    warningSigns: [
      'Qon ketishida kuchli yoki odatdan tashqari hid',
      'Isitma yoki umumiy holatning yomonlashishi',
      'Birdan juda koʻp boʻlib qoladigan qon ketishi',
      'Sezilarli, doimiy yoki odatdan tashqari ogʻriq',
      'Sizni xavotirga soladigan yangi alomat',
    ],
    tipTitle: 'Bilish foydali',
    tipText:
      'Har bir tugʻruqdan keyingi tiklanish boshqacha. Ushbu maqoladagi maʼlumot umumiy yoʻl-yoʻriq berishga moʻljallangan va tibbiy konsultatsiyani almashtirmaydi.',
    summaryHeading: 'Asosiy xulosalar',
    summary: [
      'Nifos tugʻruqdan keyin diniy kontekstda ishlatiladigan atama.',
      'Tibbiy jihatdan tugʻruqdan keyingi qon ketishi lohiya deb ataladi.',
      'Lohiya rangi va miqdori boʻyicha asta-sekin oʻzgaradi.',
      'Dam olish, muloyim gigiyena va yaxshi suv balansi tiklanishni qoʻllab-quvvatlaydi.',
      'Odatdan tashqari yoki xavotirli oʻzgarish mutaxassis maslahatiga arziydi.',
    ],
    disclaimerText:
      'Maʼlumot uchun kontent. Bu yerda keltirilgan tibbiy maʼlumot umumiy xarakterga ega va sogʻliqni saqlash mutaxassisining maslahatini almashtirmaydi. Muayyan diniy savollar uchun malakali diniy manbaga murojaat qilish tavsiya etiladi.',
    shareMessage: 'Nifos: tibbiy jihatlari — AWA',
  },
  az: {
    badge: 'DOĞUŞDAN SONRA • NİFAS',
    title: 'Nifas:\ntibbi aspektlər',
    metaDuration: '5 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Məlumat xarakterli məzmun',
    intro:
      'Doğuşdan sonra bədən tədricən bərpa dövrü keçirir. Doğuşdan sonrakı qanaxmanı, onun necə inkişaf etdiyini və diqqət tələb edən əlamətləri anlamaq bu dövrdə özünüzü daha məlumatlı hiss etməyə kömək edə bilər.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Nifas terminini anlamaq',
      'Doğuşdan sonrakı tibbi gedişat',
      'Loxiya necə inkişaf edir',
      'Özünüzə qulluq etmək',
      'Nə vaxt məsləhət almaq lazımdır',
      'Əsas nəticələr',
    ],
    h2Section1: '1. "Nifas" terminini anlamaq',
    body1a:
      '"Nifas" termini dini lüğətə aiddir və İslam hüququ qaydaları çərçivəsində doğuşdan sonrakı qanaxma ilə əlaqəli dövrə işarə edir.',
    body1b:
      'Tibbi baxımdan doğuşdan sonra müşahidə olunan qanaxma "loxiya" adlanır. Bu iki anlayış ayrıca nəzərdən keçirilə bilər: biri dini çərçivəyə aiddir, digəri fizioloji hadisəni təsvir edir.',
    distinction: {
      nifasTitle: 'Nifas',
      nifasText: 'Doğuşdan sonra dini çərçivəyə aid anlayış.',
      lochiaTitle: 'Loxiya',
      lochiaText: 'Doğuşdan sonrakı qanaxma üçün istifadə olunan tibbi termin.',
    },
    h2Section2: '2. Doğuşdan sonrakı tibbi gedişat',
    body2:
      'Doğuşdan sonrakı bərpa tədricən baş verir. Uşaqlıq adi vəziyyətinə qayıtmağa davam etdikcə, doğuşdan sonrakı qanaxma adətən zamanla dəyişir.',
    schemaTitle: 'Doğuşdan sonrakı inkişaf',
    schemaSubtitle: 'Sadələşdirilmiş tibbi istinad',
    stages: [
      {
        title: 'Doğuşdan sonra',
        subtitle: 'Doğuşdan sonrakı dövrün başlanğıcı',
        text: 'Bədən doğuşdan sonra tədricən bərpaya başlayır.',
      },
      {
        title: 'Loxiya',
        subtitle: 'Doğuşdan sonrakı qanaxma',
        text: 'Qanaxma miqdar və rəng baxımından tədricən dəyişir.',
      },
      {
        title: 'Tədricən azalma',
        subtitle: 'Bir neçə həftə ərzində',
        text: 'Qanaxma adətən zamanla azalır.',
      },
      {
        title: 'Tədricən qayıdış',
        subtitle: 'Adi dövrə doğru',
        text: 'Menstrual dövr sonra tədricən bərpa oluna bilər.',
      },
    ],
    h2Section3: '3. Loxiya necə inkişaf edir',
    body3:
      'Loxiya adətən rəngini tədricən dəyişir və miqdarca azalır. Lakin bu inkişaf şəxsdən şəxsə dəyişə bilər.',
    lochiaEvolution: [
      {
        title: 'Qırmızı loxiya',
        period: 'İlk günlər',
        text: 'Qanaxma adətən qırmızı olur və əvvəlində daha bol ola bilər.',
      },
      {
        title: 'Çəhrayı / qəhvəyimtıl loxiya',
        period: 'Bir neçə gündən sonra',
        text: 'Axın azaldıqca rəng açıqlaşa və ya qəhvəyiyə çala bilər.',
      },
      {
        title: 'Ağımtıl loxiya',
        period: 'Sonrakı həftələr',
        text: 'Qanaxma tədricən daha yüngül və daha az bol olur.',
      },
    ],
    infoTitle: 'Əsas nəticələr',
    infoText:
      'Loxiyanın rəngi və miqdarı tədricən dəyişə bilər. Dəqiq inkişaf hamı üçün eyni deyil.',
    h2Section4: '4. Özünüzə qulluq etmək',
    body4:
      'Bu dövrdə bir neçə sadə vərdiş rahatlığa kömək edə və bədənin bərpasını dəstəkləyə bilər.',
    careTips: [
      {title: 'Mülayim gigiyena', text: 'Sadə, rahat gündəlik gigiyena rejimini saxlayın.'},
      {title: 'İstirahət', text: 'Bədəninizə bərpa olunmaq üçün vaxt verin.'},
      {title: 'Hidratasiya', text: 'Ehtiyaclarınıza görə müntəzəm içməyi unutmayın.'},
      {title: 'Qidalanma', text: 'Müxtəlif qidalanma bərpanı dəstəkləyir.'},
    ],
    h2Section5: '5. Nə vaxt məsləhət almaq lazımdır',
    body5:
      'Bəzi vəziyyətlər, xüsusilə dəyişiklik əhəmiyyətli, qəfil və ya qeyri-adi görünəndə, tibb işçisinin təcili məsləhətini tələb edir.',
    warningTitle: 'Nəzərə alınmamalı əlamətlər',
    warningSubtitle: 'Lazım gələrsə, mütəxəssisdən məsləhət alın',
    warningSigns: [
      'Qanaxmada güclü və ya qeyri-adi qoxu',
      'Hərarət və ya pisləşən ümumi vəziyyət',
      'Qəfildən çox bollaşan qanaxma',
      'Əhəmiyyətli, davamlı və ya qeyri-adi ağrı',
      'Sizi narahat edən yeni simptom',
    ],
    tipTitle: 'Bilmək faydalıdır',
    tipText:
      'Doğuşdan sonrakı hər bərpa fərqlidir. Bu məqalədəki məlumat ümumi istiqamət verməyə yönəlib və tibbi konsultasiyanı əvəz etmir.',
    summaryHeading: 'Əsas nəticələr',
    summary: [
      'Nifas doğuşdan sonra dini kontekstdə istifadə olunan termindir.',
      'Tibbi baxımdan doğuşdan sonrakı qanaxma loxiya adlanır.',
      'Loxiya rəng və miqdarca tədricən dəyişir.',
      'İstirahət, mülayim gigiyena və yaxşı hidratasiya bərpanı dəstəkləyir.',
      'Qeyri-adi və ya narahatedici dəyişiklik mütəxəssis məsləhətinə layiqdir.',
    ],
    disclaimerText:
      'Məlumat xarakterli məzmun. Burada təqdim olunan tibbi məlumat ümumidir və tibb işçisinin məsləhətini əvəz etmir. Konkret dini suallar üçün səlahiyyətli dini mənbəyə müraciət etmək tövsiyə olunur.',
    shareMessage: 'Nifas: tibbi aspektlər — AWA',
  },
  ka: {
    badge: 'მშობიარობის შემდგომი პერიოდი • ნიფასი',
    title: 'ნიფასი:\nსამედიცინო ასპექტები',
    metaDuration: '5 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'დამწყები',
    metaValidated: 'საინფორმაციო შინაარსი',
    intro:
      'მშობიარობის შემდეგ სხეული ეტაპობრივი გამოჯანმრთელების პერიოდს გადის. მშობიარობის შემდგომი სისხლდენის, მისი ცვლილებისა და იმ ნიშნების გაგებამ, რომლებიც ყურადღებას მოითხოვს, შეიძლება ამ დროს უკეთ ინფორმირებულად გაგრძნობინოთ თავი.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'ტერმინ „ნიფასის“ გაგება',
      'სამედიცინო სურათი მშობიარობის შემდეგ',
      'როგორ იცვლება ლოხია',
      'საკუთარ თავზე ზრუნვა',
      'როდის ვითხოვოთ რჩევა',
      'მთავარი დასკვნები',
    ],
    h2Section1: '1. ტერმინ „ნიფასის“ გაგება',
    body1a:
      'ტერმინი „ნიფასი“ რელიგიური ლექსიკონს მიეკუთვნება და ისლამური სამართლის წესებში ნიშნავს მშობიარობის შემდგომ სისხლდენასთან დაკავშირებულ პერიოდს.',
    body1b:
      'სამედიცინო თვალსაზრისით, მშობიარობის შემდეგ დაკვირვებულ სისხლდენას „ლოხია“ ეწოდება. ეს ორი ცნება ცალ-ცალკე შეიძლება განვიხილოთ: ერთი რელიგიურ ჩარჩოს მიეკუთვნება, მეორე ფიზიოლოგიურ მოვლენას აღწერს.',
    distinction: {
      nifasTitle: 'ნიფასი',
      nifasText: 'ცნება, რომელიც მშობიარობის შემდგომ რელიგიურ ჩარჩოს მიეკუთვნება.',
      lochiaTitle: 'ლოხია',
      lochiaText: 'სამედიცინო ტერმინი, რომელიც მშობიარობის შემდგომი სისხლდენისთვის გამოიყენება.',
    },
    h2Section2: '2. სამედიცინო სურათი მშობიარობის შემდეგ',
    body2:
      'მშობიარობის შემდგომი გამოჯანმრთელება ეტაპობრივად ხდება. მშობიარობის შემდგომი სისხლდენა, როგორც წესი, დროთა განმავლობაში იცვლება, რადგან საშვილოსნო ჩვეულ მდგომარეობას კვლავ უბრუნდება.',
    schemaTitle: 'მშობიარობის შემდგომი პროგრესი',
    schemaSubtitle: 'გამარტივებული სამედიცინო საორიენტაციო სურათი',
    stages: [
      {
        title: 'მშობიარობის შემდეგ',
        subtitle: 'მშობიარობის შემდგომი პერიოდის დასაწყისი',
        text: 'სხეული მშობიარობის შემდეგ ეტაპობრივად იწყებს გამოჯანმრთელებას.',
      },
      {
        title: 'ლოხია',
        subtitle: 'მშობიარობის შემდგომი სისხლდენა',
        text: 'სისხლდენა ეტაპობრივად იცვლის რაოდენობასა და ფერს.',
      },
      {
        title: 'ეტაპობრივი შემცირება',
        subtitle: 'რამდენიმე კვირის განმავლობაში',
        text: 'სისხლდენა, როგორც წესი, დროთა განმავლობაში მცირდება.',
      },
      {
        title: 'ეტაპობრივი დაბრუნება',
        subtitle: 'ჩვეული ციკლისკენ',
        text: 'მენსტრუაციული ციკლი შემდეგ ეტაპობრივად შეიძლება განახლდეს.',
      },
    ],
    h2Section3: '3. როგორ იცვლება ლოხია',
    body3:
      'ლოხია, როგორც წესი, ეტაპობრივად იცვლის ფერს და რაოდენობით მცირდება. თუმცა, ეს ცვლილება ადამიანიდან ადამიანამდე შეიძლება განსხვავდებოდეს.',
    lochiaEvolution: [
      {
        title: 'წითელი ლოხია',
        period: 'პირველი დღეები',
        text: 'სისხლდენა, როგორც წესი, წითელია და დასაწყისში შეიძლება უფრო უხვი იყოს.',
      },
      {
        title: 'ვარდისფერი / მოყავისფრო ლოხია',
        period: 'რამდენიმე დღის შემდეგ',
        text: 'ფერი შეიძლება უფრო ღია ან მოყავისფრო გახდეს, რადგან ნაკადი მცირდება.',
      },
      {
        title: 'მოთეთრო ლოხია',
        period: 'მომდევნო კვირებში',
        text: 'სისხლდენა ეტაპობრივად უფრო მსუბუქი და ნაკლებად უხვი ხდება.',
      },
    ],
    infoTitle: 'მთავარი დასკვნები',
    infoText:
      'ლოხიის ფერი და რაოდენობა ეტაპობრივად შეიძლება შეიცვალოს. ზუსტი ცვლილება ყველასთვის ერთნაირი არ არის.',
    h2Section4: '4. საკუთარ თავზე ზრუნვა',
    body4:
      'ამ პერიოდში რამდენიმე მარტივ ჩვევას შეუძლია კომფორტსა და სხეულის გამოჯანმრთელებას შეუწყოს ხელი.',
    careTips: [
      {title: 'რბილი ჰიგიენა', text: 'შეინარჩუნეთ მარტივი, კომფორტული ყოველდღიური ჰიგიენა.'},
      {title: 'დასვენება', text: 'მიეცით თქვენს სხეულს გამოჯანმრთელების დრო.'},
      {title: 'ჰიდრატაცია', text: 'გახსოვდეთ რეგულარულად სმა თქვენი საჭიროებების მიხედვით.'},
      {title: 'კვება', text: 'მრავალფეროვანი კვება გამოჯანმრთელებას უჭერს მხარს.'},
    ],
    h2Section5: '5. როდის ვითხოვოთ რჩევა',
    body5:
      'გარკვეული სიტუაციები ჯანდაცვის სპეციალისტის დაუყოვნებელ რჩევას მოითხოვს, განსაკუთრებით როცა ცვლილება მნიშვნელოვანი, მოულოდნელი ან უჩვეულო ჩანს.',
    warningTitle: 'ნიშნები, რომლებიც არ უნდა უგულებელვყოთ',
    warningSubtitle: 'საჭიროების შემთხვევაში მოიძიეთ პროფესიული რჩევა',
    warningSigns: [
      'ძლიერი ან უჩვეულო სუნი სისხლდენისას',
      'ცხელება ან საერთო მდგომარეობის გაუარესება',
      'სისხლდენა, რომელიც მოულოდნელად ძალიან უხვი ხდება',
      'მნიშვნელოვანი, გაგრძელებული ან უჩვეულო ტკივილი',
      'ახალი სიმპტომი, რომელიც გაწუხებთ',
    ],
    tipTitle: 'კარგია ვიცოდეთ',
    tipText:
      'მშობიარობის შემდგომი ყოველი გამოჯანმრთელება განსხვავებულია. ამ სტატიაში მოცემული ინფორმაცია ზოგად მითითებას იძლევა და სამედიცინო კონსულტაციას არ ანაცვლებს.',
    summaryHeading: 'მთავარი დასკვნები',
    summary: [
      'ნიფასი მშობიარობის შემდგომ რელიგიურ კონტექსტში გამოყენებული ტერმინია.',
      'სამედიცინო თვალსაზრისით, მშობიარობის შემდგომ სისხლდენას ლოხია ეწოდება.',
      'ლოხია ეტაპობრივად იცვლის ფერსა და რაოდენობას.',
      'დასვენება, რბილი ჰიგიენა და კარგი ჰიდრატაცია გამოჯანმრთელებას უჭერს მხარს.',
      'უჩვეულო ან შემაშფოთებელი ცვლილება პროფესიულ რჩევას იმსახურებს.',
    ],
    disclaimerText:
      'საინფორმაციო შინაარსი. აქ წარმოდგენილი სამედიცინო ინფორმაცია ზოგადია და ჯანდაცვის სპეციალისტის რჩევას არ ანაცვლებს. კონკრეტული რელიგიური საკითხებისთვის რეკომენდებულია კვალიფიციური რელიგიური წყაროსთვის მიმართვა.',
    shareMessage: 'ნიფასი: სამედიცინო ასპექტები — AWA',
  },
  hy: {
    badge: 'ՀԵՏԾՆՆԴՅԱՆ ՇՐՋԱՆ • ՆԻՖԱՍ',
    title: 'Նիֆաս.\nբժշկական կողմերը',
    metaDuration: '5 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Տեղեկատվական բովանդակություն',
    intro:
      'Ծննդաբերությունից հետո մարմինն անցնում է աստիճանական վերականգնման շրջանով: Հետծննդյան արյունահոսությունը, դրա զարգացումը և ուշադրություն պահանջող նշանները հասկանալը կարող է օգնել ձեզ այս ժամանակահատվածում ավելի տեղեկացված զգալ:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Հասկանալ «նիֆաս» տերմինը',
      'Բժշկական օրինաչափությունը ծննդաբերությունից հետո',
      'Ինչպես է զարգանում լոխիան',
      'Հոգ տանել ձեր մասին',
      'Երբ խորհուրդ հարցնել',
      'Հիմնական եզրակացություններ',
    ],
    h2Section1: '1. Հասկանալ «նիֆաս» տերմինը',
    body1a:
      '«Նիֆաս» տերմինը պատկանում է կրոնական բառապաշարին և վերաբերում է ծննդաբերությունից հետո արյունահոսության հետ կապված ժամանակահատվածին իսլամական իրավագիտության կանոնների շրջանակում:',
    body1b:
      'Բժշկական առումով ծննդաբերությունից հետո նկատվող արյունահոսությունը կոչվում է «լոխիա»: Այս երկու հասկացությունները կարելի է դիտարկել առանձին. մեկը պատկանում է կրոնական շրջանակին, մյուսը նկարագրում է ֆիզիոլոգիական երևույթ:',
    distinction: {
      nifasTitle: 'Նիֆաս',
      nifasText: 'Հասկացություն, որը պատկանում է ծննդաբերությունից հետո կրոնական շրջանակին:',
      lochiaTitle: 'Լոխիա',
      lochiaText: 'Բժշկական տերմին, որն օգտագործվում է հետծննդյան արյունահոսության համար:',
    },
    h2Section2: '2. Բժշկական օրինաչափությունը ծննդաբերությունից հետո',
    body2:
      'Հետծննդյան վերականգնումը տեղի է ունենում աստիճանաբար: Հետծննդյան արյունահոսությունը սովորաբար փոխվում է ժամանակի ընթացքում, երբ արգանդը շարունակում է վերադառնալ իր սովորական վիճակին:',
    schemaTitle: 'Հետծննդյան զարգացում',
    schemaSubtitle: 'Պարզեցված բժշկական հղում',
    stages: [
      {
        title: 'Ծննդաբերությունից հետո',
        subtitle: 'Հետծննդյան շրջանի սկիզբ',
        text: 'Մարմինը աստիճանաբար սկսում է իր վերականգնումը ծննդաբերությունից հետո:',
      },
      {
        title: 'Լոխիա',
        subtitle: 'Հետծննդյան արյունահոսություն',
        text: 'Արյունահոսությունը աստիճանաբար փոխում է քանակը և գույնը:',
      },
      {
        title: 'Աստիճանական նվազում',
        subtitle: 'Մի քանի շաբաթվա ընթացքում',
        text: 'Արյունահոսությունը սովորաբար նվազում է ժամանակի ընթացքում:',
      },
      {
        title: 'Աստիճանական վերադարձ',
        subtitle: 'Դեպի սովորական ցիկլ',
        text: 'Դաշտանային ցիկլը այնուհետև կարող է աստիճանաբար վերսկսվել:',
      },
    ],
    h2Section3: '3. Ինչպես է զարգանում լոխիան',
    body3:
      'Լոխիան սովորաբար աստիճանաբար փոխում է գույնը և նվազում քանակով: Այդուհանդերձ, այս զարգացումը կարող է տարբերվել մարդուց մարդ:',
    lochiaEvolution: [
      {
        title: 'Կարմիր լոխիա',
        period: 'Առաջին օրերը',
        text: 'Արյունահոսությունը սովորաբար կարմիր է և կարող է սկզբում ավելի առատ լինել:',
      },
      {
        title: 'Վարդագույն / շագանակագույնին տվող լոխիա',
        period: 'Մի քանի օր անց',
        text: 'Գույնը կարող է դառնալ ավելի բաց կամ շագանակագույն՝ արտահոսքի նվազմանը զուգընթաց:',
      },
      {
        title: 'Սպիտակավուն լոխիա',
        period: 'Հաջորդ շաբաթները',
        text: 'Արյունահոսությունը աստիճանաբար դառնում է ավելի թեթև և պակաս առատ:',
      },
    ],
    infoTitle: 'Հիմնական եզրակացություններ',
    infoText:
      'Լոխիայի գույնը և քանակը կարող են աստիճանաբար փոխվել: Ճշգրիտ զարգացումը բոլորի համար նույնը չէ:',
    h2Section4: '4. Հոգ տանել ձեր մասին',
    body4:
      'Այս շրջանում մի քանի պարզ սովորություն կարող են օգնել հարմարավետությանը և աջակցել մարմնի վերականգնմանը:',
    careTips: [
      {title: 'Մեղմ հիգիենա', text: 'Պահպանեք պարզ, հարմարավետ ամենօրյա հիգիենայի ռեժիմ:'},
      {title: 'Հանգիստ', text: 'Ժամանակ տվեք ձեր մարմնին վերականգնվելու համար:'},
      {title: 'Հիդրատացիա', text: 'Հիշեք կանոնավոր խմել՝ ըստ ձեր կարիքների:'},
      {title: 'Սնունդ', text: 'Բազմազան սննդակարգը աջակցում է վերականգնմանը:'},
    ],
    h2Section5: '5. Երբ խորհուրդ հարցնել',
    body5:
      'Որոշ իրավիճակներ պահանջում են առողջապահության մասնագետի անհապաղ խորհուրդ, մասնավորապես երբ փոփոխությունը թվում է զգալի, հանկարծակի կամ անսովոր:',
    warningTitle: 'Նշաններ, որոնք չպետք է անտեսել',
    warningSubtitle: 'Անհրաժեշտության դեպքում խնդրեք մասնագիտական խորհուրդ',
    warningSigns: [
      'Արյունահոսության սուր կամ անսովոր հոտ',
      'Ջերմություն կամ ընդհանուր վիճակի վատացում',
      'Արյունահոսություն, որը հանկարծակի դառնում է շատ առատ',
      'Զգալի, շարունակական կամ անսովոր ցավ',
      'Նոր ախտանիշ, որն անհանգստացնում է ձեզ',
    ],
    tipTitle: 'Լավ է իմանալ',
    tipText:
      'Յուրաքանչյուր հետծննդյան վերականգնում տարբեր է: Այս հոդվածի տեղեկությունը նախատեսված է ընդհանուր ուղղորդման համար և չի փոխարինում բժշկական խորհրդատվությանը:',
    summaryHeading: 'Հիմնական եզրակացություններ',
    summary: [
      'Նիֆասը տերմին է, որն օգտագործվում է ծննդաբերությունից հետո կրոնական համատեքստում:',
      'Բժշկական առումով հետծննդյան արյունահոսությունը կոչվում է լոխիա:',
      'Լոխիան աստիճանաբար փոխում է գույնը և քանակը:',
      'Հանգիստը, մեղմ հիգիենան և լավ հիդրատացիան աջակցում են վերականգնմանը:',
      'Անսովոր կամ անհանգստացնող փոփոխությունը արժանի է մասնագիտական խորհրդի:',
    ],
    disclaimerText:
      'Տեղեկատվական բովանդակություն: Այստեղ ներկայացված բժշկական տեղեկությունը ընդհանուր է և չի փոխարինում առողջապահության մասնագետի խորհրդին: Կոնկրետ կրոնական հարցերի համար խորհուրդ է տրվում դիմել որակավորված կրոնական աղբյուրի:',
    shareMessage: 'Նիֆաս. բժշկական կողմերը — AWA',
  },
  tg: {
    badge: 'ДАВРАИ БАЪДИЗОӢ • НИФОС',
    title: 'Нифос:\nҷанбаҳои тиббӣ',
    metaDuration: '5 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни иттилоотӣ',
    intro:
      'Пас аз таваллуд бадан давраи тадриҷии барқароршавиро аз сар мегузаронад. Фаҳмидани хунравии баъдизоӣ, тарзи тағйирёбии он ва нишонаҳое, ки диққатро талаб мекунанд, метавонад ба шумо кумак кунад дар ин давра бохабартар бошед.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Фаҳмидани истилоҳи нифос',
      'Намунаи тиббӣ пас аз таваллуд',
      'Лохия чӣ тавр тағйир меёбад',
      'Ғамхорӣ аз худ',
      'Кай маслиҳат пурсидан лозим аст',
      'Хулосаҳои асосӣ',
    ],
    h2Section1: '1. Фаҳмидани истилоҳи «нифос»',
    body1a:
      'Истилоҳи «нифос» ба луғати динӣ тааллуқ дорад ва давраеро мефаҳмонад, ки бо хунравии пас аз таваллуд дар доираи қоидаҳои фиқҳи исломӣ алоқаманд аст.',
    body1b:
      'Аз ҷиҳати тиббӣ хунравии пас аз таваллуд «лохия» номида мешавад. Ин ду мафҳумро алоҳида баррасӣ кардан мумкин аст: яке ба доираи динӣ тааллуқ дорад, дигаре падидаи физиологиро тавсиф мекунад.',
    distinction: {
      nifasTitle: 'Нифос',
      nifasText: 'Мафҳуме, ки ба доираи динӣ пас аз таваллуд тааллуқ дорад.',
      lochiaTitle: 'Лохия',
      lochiaText: 'Истилоҳи тиббӣ барои хунравии баъдизоӣ.',
    },
    h2Section2: '2. Намунаи тиббӣ пас аз таваллуд',
    body2:
      'Барқароршавии баъдизоӣ тадриҷан рух медиҳад. Хунравии баъдизоӣ одатан бо мурури замон тағйир меёбад, дар ҳоле ки бачадон ба ҳолати одатии худ бозгаштанро идома медиҳад.',
    schemaTitle: 'Пешрафти баъдизоӣ',
    schemaSubtitle: 'Истиноди соддакардашудаи тиббӣ',
    stages: [
      {
        title: 'Пас аз таваллуд',
        subtitle: 'Оғози давраи баъдизоӣ',
        text: 'Бадан тадриҷан барқароршавии худро пас аз таваллуд оғоз мекунад.',
      },
      {
        title: 'Лохия',
        subtitle: 'Хунравии баъдизоӣ',
        text: 'Хунравӣ тадриҷан дар миқдор ва ранг тағйир меёбад.',
      },
      {
        title: 'Кам шудани тадриҷӣ',
        subtitle: 'Дар давоми якчанд ҳафта',
        text: 'Хунравӣ одатан бо мурури замон кам мешавад.',
      },
      {
        title: 'Бозгашти тадриҷӣ',
        subtitle: 'Ба сӯи давраи одатӣ',
        text: 'Давраи ҳайз он гоҳ метавонад тадриҷан аз сар гирифта шавад.',
      },
    ],
    h2Section3: '3. Лохия чӣ тавр тағйир меёбад',
    body3:
      'Лохия одатан тадриҷан ранг иваз мекунад ва миқдораш кам мешавад. Бо вуҷуди ин, ин пешрафт аз шахс ба шахс фарқ карда метавонад.',
    lochiaEvolution: [
      {
        title: 'Лохияи сурх',
        period: 'Рӯзҳои аввал',
        text: 'Хунравӣ одатан сурх аст ва дар оғоз метавонад зиёдтар бошад.',
      },
      {
        title: 'Лохияи гулобӣ / қаҳваранг',
        period: 'Пас аз чанд рӯз',
        text: 'Ранг метавонад равшантар ё қаҳваранг шавад, ҳангоме ки ҷараён кам мешавад.',
      },
      {
        title: 'Лохияи сафедтоб',
        period: 'Ҳафтаҳои минбаъда',
        text: 'Хунравӣ тадриҷан сабуктар ва камтар мешавад.',
      },
    ],
    infoTitle: 'Хулосаҳои асосӣ',
    infoText:
      'Ранг ва миқдори лохия метавонад тадриҷан тағйир ёбад. Пешрафти дақиқ барои ҳама якхела нест.',
    h2Section4: '4. Ғамхорӣ аз худ',
    body4:
      'Дар ин давра чанд одати оддӣ метавонад ба роҳатӣ кумак кунад ва барқароршавии баданро дастгирӣ намояд.',
    careTips: [
      {title: 'Гигиенаи нарм', text: 'Тартиби оддӣ ва роҳати гигиенаи ҳаррӯзаро нигоҳ доред.'},
      {title: 'Истироҳат', text: 'Ба бадани худ вақт диҳед, то барқарор шавад.'},
      {title: 'Обнӯшӣ', text: 'Фаромӯш накунед, ки мунтазам мувофиқи эҳтиёҷ об нӯшед.'},
      {title: 'Ғизо', text: 'Ғизои гуногун барқароршавиро дастгирӣ мекунад.'},
    ],
    h2Section5: '5. Кай маслиҳат пурсидан лозим аст',
    body5:
      'Баъзе вазъиятҳо маслиҳати зудтари мутахассиси соҳаи тибро талаб мекунанд, хусусан вақте ки тағйирот назаррас, ногаҳонӣ ё ғайриоддӣ менамояд.',
    warningTitle: 'Нишонаҳое, ки набояд нодида гирифт',
    warningSubtitle: 'Дар сурати зарурат маслиҳати касбӣ пурсед',
    warningSigns: [
      'Бӯи қавӣ ё ғайриоддӣ дар хунравӣ',
      'Таб ё бадтар шудани ҳолати умумӣ',
      'Хунравӣ, ки ногаҳон хеле зиёд мешавад',
      'Дарди назаррас, доимӣ ё ғайриоддӣ',
      'Нишонаи нав, ки шуморо нигарон мекунад',
    ],
    tipTitle: 'Донистан хуб аст',
    tipText:
      'Ҳар барқароршавии баъдизоӣ гуногун аст. Маълумот дар ин мақола барои роҳнамоии умумӣ пешбинӣ шудааст ва машварати тиббиро иваз намекунад.',
    summaryHeading: 'Хулосаҳои асосӣ',
    summary: [
      'Нифос истилоҳест, ки дар заминаи динӣ пас аз таваллуд истифода мешавад.',
      'Аз ҷиҳати тиббӣ хунравии баъдизоӣ лохия номида мешавад.',
      'Лохия тадриҷан дар ранг ва миқдор тағйир меёбад.',
      'Истироҳат, гигиенаи нарм ва обнӯшии хуб барқароршавиро дастгирӣ мекунанд.',
      'Тағйироти ғайриоддӣ ё нигаронкунанда маслиҳати касбиро сазовор аст.',
    ],
    disclaimerText:
      'Мазмуни иттилоотӣ. Маълумоти тиббии дар ин ҷо овардашуда умумӣ аст ва маслиҳати мутахассиси соҳаи тибро иваз намекунад. Барои саволҳои мушаххаси динӣ тавсия дода мешавад ба манбаи салоҳиятдори динӣ муроҷиат кунед.',
    shareMessage: 'Нифос: ҷанбаҳои тиббӣ — AWA',
  },
  ky: {
    badge: 'ТӨРӨТТӨН КИЙИН • НИФАС',
    title: 'Нифас:\nмедициналык жагы',
    metaDuration: '5 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Баштоочу',
    metaValidated: 'Маалымат берүүчү мазмун',
    intro:
      'Төрөттөн кийин дене акырындык менен калыбына келүү мезгилинен өтөт. Төрөттөн кийинки кан кетүүнү, анын кантип өзгөрөрүн жана көңүл бурууну талап кылган белгилерди түшүнүү бул мезгилде өзүңүздү кабардар сезүүгө жардам бериши мүмкүн.',
    contentsTitle: 'Бул макалада',
    topics: [
      '«Нифас» терминин түшүнүү',
      'Төрөттөн кийинки медициналык мыйзам ченемдүүлүк',
      'Лохия кантип өзгөрөт',
      'Өзүңүзгө кам көрүү',
      'Кеңешти качан сурап кайрылуу керек',
      'Негизги жыйынтыктар',
    ],
    h2Section1: '1. «Нифас» терминин түшүнүү',
    body1a:
      '«Нифас» термини диний лексикага таандык жана ислам укугунун эрежелеринин алкагында төрөттөн кийинки кан кетүү менен байланышкан мезгилди билдирет.',
    body1b:
      'Медициналык жактан төрөттөн кийинки кан кетүү «лохия» деп аталат. Бул эки түшүнүктү өзүнчө карасаңыз болот: бири диний алкакка таандык, экинчиси физиологиялык кубулушту сүрөттөйт.',
    distinction: {
      nifasTitle: 'Нифас',
      nifasText: 'Төрөттөн кийинки диний алкакка таандык түшүнүк.',
      lochiaTitle: 'Лохия',
      lochiaText: 'Төрөттөн кийинки кан кетүү үчүн колдонулган медициналык термин.',
    },
    h2Section2: '2. Төрөттөн кийинки медициналык мыйзам ченемдүүлүк',
    body2:
      'Төрөттөн кийинки калыбына келүү акырындап жүрөт. Төрөттөн кийинки кан кетүү жатын адаттагы абалына кайтып жатканда жалпысынан убакыттын өтүшү менен өзгөрөт.',
    schemaTitle: 'Төрөттөн кийинки өнүгүү',
    schemaSubtitle: 'Жөнөкөйлөштүрүлгөн медициналык шилтеме',
    stages: [
      {
        title: 'Төрөттөн кийин',
        subtitle: 'Төрөттөн кийинки мезгилдин башталышы',
        text: 'Дене төрөттөн кийин калыбына келүүнү акырындап баштайт.',
      },
      {
        title: 'Лохия',
        subtitle: 'Төрөттөн кийинки кан кетүү',
        text: 'Кан кетүү көлөмү жана түсү боюнча акырындап өзгөрөт.',
      },
      {
        title: 'Акырындап азаюу',
        subtitle: 'Бир нече жума бою',
        text: 'Кан кетүү жалпысынан убакыттын өтүшү менен азаят.',
      },
      {
        title: 'Акырындап кайтуу',
        subtitle: 'Адаттагы циклге карай',
        text: 'Етек кирим цикли андан кийин акырындап улануусу мүмкүн.',
      },
    ],
    h2Section3: '3. Лохия кантип өзгөрөт',
    body3:
      'Лохия жалпысынан түсүн акырындап өзгөртөт жана көлөмү азаят. Бирок бул өнүгүү адамдан адамга айырмаланышы мүмкүн.',
    lochiaEvolution: [
      {
        title: 'Кызыл лохия',
        period: 'Алгачкы күндөр',
        text: 'Кан кетүү адатта кызыл түстө болот жана башында көбүрөөк болушу мүмкүн.',
      },
      {
        title: 'Кызгылт / күрөңсүмөк лохия',
        period: 'Бир нече күндөн кийин',
        text: 'Агым азайган сайын түсү ачыктап же күрөңсүмөк болушу мүмкүн.',
      },
      {
        title: 'Агыш лохия',
        period: 'Кийинки жумалар',
        text: 'Кан кетүү акырындап жеңилдеп, азыраак болот.',
      },
    ],
    infoTitle: 'Негизги жыйынтыктар',
    infoText:
      'Лохиянын түсү жана көлөмү акырындап өзгөрүшү мүмкүн. Так өнүгүү баарында бирдей эмес.',
    h2Section4: '4. Өзүңүзгө кам көрүү',
    body4:
      'Бул мезгилде бир нече жөнөкөй адат ыңгайлуулукка жана дененин калыбына келүүсүн колдоого жардам бериши мүмкүн.',
    careTips: [
      {title: 'Жумшак гигиена', text: 'Жөнөкөй, ыңгайлуу күнүмдүк гигиенаны сактаңыз.'},
      {title: 'Эс алуу', text: 'Денеңизге калыбына келүүгө убакыт бериңиз.'},
      {title: 'Суюктук ичүү', text: 'Муктаждыгыңызга жараша үзгүлтүксүз ичүүнү унутпаңыз.'},
      {title: 'Тамактануу', text: 'Ар түрдүү тамактануу калыбына келүүнү колдойт.'},
    ],
    h2Section5: '5. Кеңешти качан сурап кайрылуу керек',
    body5:
      'Айрым абалдар ден соолук сактоо адисинин тез кеңешин талап кылат, айрыкча өзгөрүү олуттуу, капыстан же адаттан тыш көрүнгөндө.',
    warningTitle: 'Эске алынбашы керек белгилер',
    warningSubtitle: 'Керек болсо адистин кеңешин сураңыз',
    warningSigns: [
      'Кан кетүүдө күчтүү же адаттан тыш жыт',
      'Ысытма же жалпы абалдын начарлашы',
      'Капыстан өтө көбөйгөн кан кетүү',
      'Олуттуу, улана берген же адаттан тыш оору',
      'Тынчсыздандырган жаңы белги',
    ],
    tipTitle: 'Билүү пайдалуу',
    tipText:
      'Төрөттөн кийинки ар бир калыбына келүү ар башка. Бул макаладагы маалымат жалпы багыт берүү үчүн арналган жана медициналык консультацияны алмаштырбайт.',
    summaryHeading: 'Негизги жыйынтыктар',
    summary: [
      'Нифас — төрөттөн кийинки диний контекстте колдонулган термин.',
      'Медициналык жактан төрөттөн кийинки кан кетүү лохия деп аталат.',
      'Лохия түсү жана көлөмү боюнча акырындап өзгөрөт.',
      'Эс алуу, жумшак гигиена жана жакшы суюктук ичүү калыбына келүүнү колдойт.',
      'Адаттан тыш же тынчсыздандырган өзгөрүү адистин кеңешине татыйт.',
    ],
    disclaimerText:
      'Маалымат берүүчү мазмун. Бул жерде берилген медициналык маалымат жалпы жана ден соолук сактоо адисинин кеңешин алмаштырбайт. Белгилүү диний суроолор үчүн квалификациялуу диний булакка кайрылуу сунушталат.',
    shareMessage: 'Нифас: медициналык жагы — AWA',
  },
  tk: {
    badge: 'DOGRANDAN SOŇ • NIFAS',
    title: 'Nifas:\nlukmançylyk taraplary',
    metaDuration: '5 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Maglumat berýän mazmun',
    intro:
      'Dograndan soň bedeniň ýuwaş-ýuwaşdan dikelýän döwri bolýar. Dograndan soňky gan akmany, onuň nähili üýtgeýändigini we üns talap edýän alamatlary düşünmek bu döwürde özüňizi has habarly duýmaga kömek edip biler.',
    contentsTitle: 'Bu makalada',
    topics: [
      '«Nifas» adalgasyny düşünmek',
      'Dograndan soňky lukmançylyk nusgasy',
      'Lohiýa nähili üýtgeýär',
      'Özüňize ideg etmek',
      'Maslahaty haçan soramaly',
      'Esasy netijeler',
    ],
    h2Section1: '1. «Nifas» adalgasyny düşünmek',
    body1a:
      '«Nifas» adalgasy dini leksikona degişli we yslam hukugynyň düzgünleri çäginde dograndan soňky gan akma bilen baglanyşykly döwri aňladýar.',
    body1b:
      'Lukmançylyk taýdan dograndan soň synlanylan gan akma «lohiýa» diýlip atlandyrylýar. Bu iki düşünjäni aýry-aýrylykda göz öňünde tutup bolýar: biri dini çarçuwa degişli, beýlekisi fiziologik hadysany suratlandyrýar.',
    distinction: {
      nifasTitle: 'Nifas',
      nifasText: 'Dograndan soňky dini çarçuwa degişli düşünje.',
      lochiaTitle: 'Lohiýa',
      lochiaText: 'Dograndan soňky gan akma üçin ulanylýan lukmançylyk adalgasy.',
    },
    h2Section2: '2. Dograndan soňky lukmançylyk nusgasy',
    body2:
      'Dograndan soňky dikeliş ýuwaş-ýuwaşdan bolýar. Dograndan soňky gan akma adatça ýatga öz adaty ýagdaýyna gaýdyp barýarka wagtyň geçmegi bilen üýtgeýär.',
    schemaTitle: 'Dograndan soňky ösüş',
    schemaSubtitle: 'Ýönekeýleşdirilen lukmançylyk salgylanmasy',
    stages: [
      {
        title: 'Dograndan soň',
        subtitle: 'Dograndan soňky döwrüň başy',
        text: 'Bedeniň dikelişi dograndan soň ýuwaş-ýuwaşdan başlaýar.',
      },
      {
        title: 'Lohiýa',
        subtitle: 'Dograndan soňky gan akma',
        text: 'Gan akma mukdary we reňki boýunça ýuwaş-ýuwaşdan üýtgeýär.',
      },
      {
        title: 'Ýuwaş-ýuwaşdan azalmak',
        subtitle: 'Birnäçe hepde dowamynda',
        text: 'Gan akma wagtyň geçmegi bilen adatça azalýar.',
      },
      {
        title: 'Ýuwaş-ýuwaşdan gaýdyp gelmek',
        subtitle: 'Adaty sikle tarap',
        text: 'Aýbaşy sikli soňra ýuwaş-ýuwaşdan täzeden başlap biler.',
      },
    ],
    h2Section3: '3. Lohiýa nähili üýtgeýär',
    body3:
      'Lohiýa adatça ýuwaş-ýuwaşdan reňkini üýtgedýär we mukdary azalýar. Şeýle-de bolsa, bu ösüş adamdan adama tapawutlanyp biler.',
    lochiaEvolution: [
      {
        title: 'Gyzyl lohiýa',
        period: 'Ilkinji günler',
        text: 'Gan akma adatça gyzyl we başda has köp bolup biler.',
      },
      {
        title: 'Gülgüne / goňurymtyl lohiýa',
        period: 'Birnäçe günden soň',
        text: 'Akym azalanda reňk açyklaşyp ýa-da goňurymtyl bolup biler.',
      },
      {
        title: 'Akymtyl lohiýa',
        period: 'Indiki hepdeler',
        text: 'Gan akma ýuwaş-ýuwaşdan ýeňilleşýär we az bolýar.',
      },
    ],
    infoTitle: 'Esasy netijeler',
    infoText:
      'Lohiýanyň reňki we mukdary ýuwaş-ýuwaşdan üýtgäp biler. Takyk ösüş hemmeler üçin şol bir däl.',
    h2Section4: '4. Özüňize ideg etmek',
    body4:
      'Bu döwürde birnäçe ýönekeý endik rahatlyga we bedeniň dikelişine goldaw bermäge kömek edip biler.',
    careTips: [
      {title: 'Ýumşak arassaçylyk', text: 'Ýönekeý, rahat gündelik arassaçylyk tertibini saklaň.'},
      {title: 'Dynç', text: 'Bedeniňize dikelmek üçin wagt beriň.'},
      {title: 'Suwlandyrmak', text: 'Zerurlyklaryňyza görä yzygiderli içmegi ýatdan çykarmaň.'},
      {title: 'Iýmitlenmek', text: 'Dürli-dürli iýmit dikelişe goldaw berýär.'},
    ],
    h2Section5: '5. Maslahaty haçan soramaly',
    body5:
      'Käbir ýagdaýlar saglyk hünärmeniniň çalt maslahatyny talap edýär, aýratyn-da üýtgeşme möhüm, ýiti ýa-da adaty däl bolup görünende.',
    warningTitle: 'Äsgermezlik edilmeli däl alamatlar',
    warningSubtitle: 'Zerur bolsa hünärmeniň maslahatyny soraň',
    warningSigns: [
      'Gan akmada güýçli ýa-da adaty däl ys',
      'Gyzgyn ýa-da erbetleşýän umumy ýagdaý',
      'Birden gaty köp bolýan gan akma',
      'Möhüm, dowamly ýa-da adaty däl agyry',
      'Sizi alada goýýan täze alamat',
    ],
    tipTitle: 'Bilmek peýdaly',
    tipText:
      'Her dograndan soňky dikeliş dürli. Bu makaladaky maglumat umumy ugrukdyrma bermek üçin niýetlenen we lukmançylyk maslahatlaşmagyny çalyşmaýar.',
    summaryHeading: 'Esasy netijeler',
    summary: [
      'Nifas dograndan soň dini kontekstde ulanylýan adalga.',
      'Lukmançylyk taýdan dograndan soňky gan akma lohiýa diýlip atlandyrylýar.',
      'Lohiýa reňkini we mukdaryny ýuwaş-ýuwaşdan üýtgedýär.',
      'Dynç, ýumşak arassaçylyk we gowy suwlandyrmak dikelişe goldaw berýär.',
      'Adaty däl ýa-da alada goýýan üýtgeşme hünärmeniň maslahatyna mynasyp.',
    ],
    disclaimerText:
      'Maglumat berýän mazmun. Bu ýerde berlen lukmançylyk maglumaty umumy we saglyk hünärmeniniň maslahatyny çalyşmaýar. Aýratyn dini soraglar üçin bilimli dini çeşmä ýüz tutmak maslahat berilýär.',
    shareMessage: 'Nifas: lukmançylyk taraplary — AWA',
  },
} as const);

/* -------------------------------------------------------------------------- */
/* TYPES */
/* -------------------------------------------------------------------------- */

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ArticleReader'
>;

/* -------------------------------------------------------------------------- */
/* SCREEN */
/* -------------------------------------------------------------------------- */

export default function NifasMedicalArticleScreen({
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
        ]}
      >
        {/* ---------------------------------------------------------------- */}
        {/* HERO */}
        {/* ---------------------------------------------------------------- */}

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
            ]}
          >
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
                icon={
                    saved
                      ? 'bookmark'
                      : 'bookmark-outline'
                  }
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

        {/* ---------------------------------------------------------------- */}
        {/* ARTICLE */}
        {/* ---------------------------------------------------------------- */}

        <View style={styles.article}>
          {/* Badge */}

          <View style={styles.badge}>
            <AwaText variant="labelSmall" emphasized colorRole="primary">
              {content.badge}
            </AwaText>
          </View>

          {/* Title */}

          <AwaText variant="headlineMedium" weight="700" style={styles.title}>
            {content.title}
          </AwaText>

          {/* Metadata */}

          <View style={styles.metas}>
            {[
              ['clock-outline', content.metaDuration],
              [
                'book-open-page-variant-outline',
                content.metaType,
              ],
              ['chart-bar', content.metaLevel],
              [
                'shield-check-outline',
                content.metaValidated,
              ],
            ].map(([icon, text], index) => (
              <React.Fragment key={text}>
                {index > 0 ? (
                  <View style={styles.metaDivider} />
                ) : null}

                <View style={styles.metaItem}>
                  <MaterialDesignIcons
                    name={icon as never}
                    color={theme.colors.textMuted}
                    size={16}
                  />

                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant">
                    {text}
                  </AwaText>
                </View>
              </React.Fragment>
            ))}
          </View>

          {/* Introduction */}

          <AwaText variant="titleSmall" colorRole="onSurfaceVariant" style={styles.intro}>
            {content.intro}
          </AwaText>

          {/* ---------------------------------------------------------------- */}
          {/* CONTENTS */}
          {/* ---------------------------------------------------------------- */}

          <AwaCard variant="filled" padding="none" style={styles.contents}>
            <AwaText variant="titleMedium" emphasized style={styles.contentsTitle}>
              {content.contentsTitle}
            </AwaText>

            {content.topics.map((item, index) => (
              <View
                key={item}
                style={styles.contentRow}
              >
                <View style={styles.contentLeft}>
                  <AwaText variant="labelSmall" emphasized colorRole="primary" style={styles.contentNumber}>
                    {String(index + 1).padStart(2, '0')}
                  </AwaText>

                  <AwaText variant="bodySmall" style={styles.contentText}>
                    {item}
                  </AwaText>
                </View>

                <MaterialDesignIcons
                  name="chevron-right"
                  size={17}
                  color={theme.colors.primary}
                />
              </View>
            ))}
          </AwaCard>

          {/* ---------------------------------------------------------------- */}
          {/* SECTION 1 */}
          {/* ---------------------------------------------------------------- */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            {content.h2Section1}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body1a}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body1b}
          </AwaText>

          {/* Distinction card */}

          <AwaCard variant="filled" padding="none" style={styles.distinctionCard}>
            <View style={styles.distinctionItem}>
              <View style={styles.distinctionIcon}>
                <MaterialDesignIcons
                  name="book-open-variant"
                  size={21}
                  color={theme.colors.primary}
                />
              </View>

              <View style={styles.distinctionCopy}>
                <AwaText variant="titleSmall" emphasized>
                  {content.distinction.nifasTitle}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.distinctionText}>
                  {content.distinction.nifasText}
                </AwaText>
              </View>
            </View>

            <View style={styles.distinctionDivider} />

            <View style={styles.distinctionItem}>
              <View style={styles.distinctionIcon}>
                <MaterialDesignIcons
                  name="medical-bag"
                  size={21}
                  color={theme.colors.primary}
                />
              </View>

              <View style={styles.distinctionCopy}>
                <AwaText variant="titleSmall" emphasized>
                  {content.distinction.lochiaTitle}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.distinctionText}>
                  {content.distinction.lochiaText}
                </AwaText>
              </View>
            </View>
          </AwaCard>

          {/* ---------------------------------------------------------------- */}
          {/* SECTION 2 */}
          {/* ---------------------------------------------------------------- */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            {content.h2Section2}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body2}
          </AwaText>

          {/* SCHEMA */}

          <AwaCard variant="filled" padding="none" style={styles.schemaCard}>
            <View style={styles.schemaHeader}>
              <View style={styles.schemaHeaderIcon}>
                <MaterialDesignIcons
                  name="chart-timeline-variant"
                  size={22}
                  color={theme.colors.primary}
                />
              </View>

              <View style={styles.schemaHeaderCopy}>
                <AwaText variant="titleSmall" emphasized>
                  {content.schemaTitle}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.schemaSubtitle}>
                  {content.schemaSubtitle}
                </AwaText>
              </View>
            </View>

            <View style={styles.schemaTimeline}>
              {content.stages.map((stage, index) => (
                <View
                  key={stage.title}
                  style={styles.schemaStage}
                >
                  <View style={styles.schemaRail}>
                    <View style={styles.schemaNode}>
                      <AwaText variant="labelSmall" emphasized colorRole="primary"
                      >
                        {NIFAS_STAGE_META[index].number}
                      </AwaText>
                    </View>

                    {index <
                    content.stages.length - 1 ? (
                      <View
                        style={styles.schemaConnector}
                      />
                    ) : null}
                  </View>

                  <View style={styles.schemaContent}>
                    <View
                      style={styles.schemaStageTop}
                    >
                      <View
                        style={styles.schemaStageIcon}
                      >
                        <MaterialDesignIcons
                          name={NIFAS_STAGE_META[index].icon as never}
                          size={19}
                          color={theme.colors.primary}
                        />
                      </View>

                      <View
                        style={styles.schemaStageHeading}
                      >
                        <AwaText variant="titleSmall" emphasized
                        >
                          {stage.title}
                        </AwaText>

                        <AwaText variant="labelSmall" colorRole="primary"
                          style={
                            styles.schemaStageSubtitle
                          }
                        >
                          {stage.subtitle}
                        </AwaText>
                      </View>
                    </View>

                    <AwaText variant="bodySmall" colorRole="onSurfaceVariant"
                      style={styles.schemaStageText}
                    >
                      {stage.text}
                    </AwaText>
                  </View>
                </View>
              ))}
            </View>
          </AwaCard>

          {/* ---------------------------------------------------------------- */}
          {/* SECTION 3 */}
          {/* ---------------------------------------------------------------- */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            {content.h2Section3}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body3}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.evolutionCard}>
            {content.lochiaEvolution.map((item, index) => (
              <View
                key={item.title}
                style={styles.evolutionItem}
              >
                <View style={styles.evolutionLeft}>
                  <View style={styles.evolutionIcon}>
                    <MaterialDesignIcons
                      name={LOCHIA_EVOLUTION_ICONS[index] as never}
                      size={21}
                      color={theme.colors.primary}
                    />
                  </View>

                  {index <
                  content.lochiaEvolution.length - 1 ? (
                    <View
                      style={
                        styles.evolutionConnector
                      }
                    />
                  ) : null}
                </View>

                <View style={styles.evolutionCopy}>
                  <AwaText variant="titleSmall" emphasized>
                    {item.title}
                  </AwaText>

                  <AwaText variant="labelSmall" colorRole="primary"
                    style={styles.evolutionPeriod}
                  >
                    {item.period}
                  </AwaText>

                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.evolutionText}>
                    {item.text}
                  </AwaText>
                </View>
              </View>
            ))}
          </AwaCard>

          {/* Info */}

          <AwaCard variant="filled" padding="none" style={styles.infoCard}>
            <MaterialDesignIcons
              name="information-outline"
              size={22}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.infoTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.infoText}>
                {content.infoText}
              </AwaText>
            </View>
          </AwaCard>

          {/* ---------------------------------------------------------------- */}
          {/* SECTION 4 */}
          {/* ---------------------------------------------------------------- */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            {content.h2Section4}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body4}
          </AwaText>

          <View style={styles.careGrid}>
            {content.careTips.map((item, index) => (
              <AwaCard variant="filled" padding="none"
                key={item.title}
                style={styles.careCard}
              >
                <View style={styles.careIcon}>
                  <MaterialDesignIcons
                    name={CARE_TIP_ICONS[index] as never}
                    size={22}
                    color={theme.colors.primary}
                  />
                </View>

                <AwaText variant="titleSmall" emphasized style={styles.careTitle}>
                  {item.title}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.careText}>
                  {item.text}
                </AwaText>
              </AwaCard>
            ))}
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* SECTION 5 */}
          {/* ---------------------------------------------------------------- */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            {content.h2Section5}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body5}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <View style={styles.warningHeaderIcon}>
                <MaterialDesignIcons
                  name="alert-outline"
                  size={22}
                  color={theme.colors.warning}
                />
              </View>

              <View style={styles.warningHeaderCopy}>
                <AwaText variant="titleSmall" emphasized>
                  {content.warningTitle}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant"
                  style={styles.warningSubtitle}
                >
                  {content.warningSubtitle}
                </AwaText>
              </View>
            </View>

            {content.warningSigns.map(item => (
              <View
                key={item}
                style={styles.warningRow}
              >
                <MaterialDesignIcons
                  name="alert-circle-outline"
                  size={18}
                  color={theme.colors.warning}
                />

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.warningText}>
                  {item}
                </AwaText>
              </View>
            ))}
          </AwaCard>

          {/* ---------------------------------------------------------------- */}
          {/* TIP */}
          {/* ---------------------------------------------------------------- */}

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.tipTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.tipText}
              </AwaText>
            </View>
          </AwaCard>

          {/* ---------------------------------------------------------------- */}
          {/* SUMMARY */}
          {/* ---------------------------------------------------------------- */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            {content.summaryHeading}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.summaryCard}>
            {content.summary.map(item => (
              <View
                key={item}
                style={styles.summaryRow}
              >
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.summaryText}>
                  {item}
                </AwaText>
              </View>
            ))}
          </AwaCard>

          {/* Disclaimer */}

          <View style={styles.disclaimer}>
            <MaterialDesignIcons
              name="shield-outline"
              size={18}
              color={theme.colors.textMuted}
            />

            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.disclaimerText}>
              {content.disclaimerText}
            </AwaText>
          </View>
        </View>
      </ScrollView>

      <ReadingControls
        articleId={ID}
        durationMinutes={5}
        scrollRef={scrollRef}
      />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* STYLES */
/* -------------------------------------------------------------------------- */

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  scroll: {
    paddingBottom: 32,
  },

  /* HERO */

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



  /* ARTICLE */

  article: {
    marginTop: -16,
    padding: 20,
    paddingBottom: 32,
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
    gap: 8,
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  metaDivider: {
    width: 1,
    height: 18,
    backgroundColor: theme.colors.border,
  },


  intro: {
    marginTop: 16,
  },

  /* CONTENTS */

  contents: {
    marginTop: 20,
    padding: 16,
  },

  contentsTitle: {
    marginBottom: 8,
  },

  contentRow: {
    minHeight: 41,
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
    width: 31,
  },

  contentText: {
    flex: 1,
  },

  /* HEADINGS */

  h2: {
    marginTop: 28,
  },

  body: {
    marginTop: 8,
  },

  /* DISTINCTION */

  distinctionCard: {
    marginTop: 16,
    padding: 16,
  },

  distinctionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  distinctionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  distinctionCopy: {
    flex: 1,
    marginLeft: 12,
  },


  distinctionText: {
    marginTop: 3,
  },

  distinctionDivider: {
    height: 1,
    marginVertical: 12,
    backgroundColor: theme.colors.border,
  },

  /* SCHEMA */

  schemaCard: {
    marginTop: 16,
    padding: 16,
  },

  schemaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },

  schemaHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  schemaHeaderCopy: {
    flex: 1,
    marginLeft: 12,
  },


  schemaSubtitle: {
    marginTop: 2,
  },

  schemaTimeline: {
    marginTop: 4,
  },

  schemaStage: {
    minHeight: 102,
    flexDirection: 'row',
  },

  schemaRail: {
    width: 42,
    alignItems: 'center',
    position: 'relative',
  },

  schemaNode: {
    width: 32,
    height: 32,
    marginTop: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    zIndex: 2,
  },


  schemaConnector: {
    position: 'absolute',
    top: 48,
    bottom: 0,
    width: 2,
    backgroundColor: theme.colors.border,
  },

  schemaContent: {
    flex: 1,
    paddingTop: 12,
    paddingLeft: 8,
    paddingBottom: 12,
  },

  schemaStageTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  schemaStageIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  schemaStageHeading: {
    flex: 1,
    marginLeft: 8,
  },


  schemaStageSubtitle: {
    marginTop: 1,
  },

  schemaStageText: {
    marginTop: 8,
  },

  /* EVOLUTION */

  evolutionCard: {
    marginTop: 16,
    padding: 16,
  },

  evolutionItem: {
    minHeight: 91,
    flexDirection: 'row',
  },

  evolutionLeft: {
    width: 40,
    alignItems: 'center',
    position: 'relative',
  },

  evolutionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    zIndex: 2,
  },

  evolutionConnector: {
    position: 'absolute',
    top: 34,
    bottom: 0,
    width: 1.5,
    backgroundColor: theme.colors.border,
  },

  evolutionCopy: {
    flex: 1,
    marginLeft: 8,
    paddingBottom: 12,
  },


  evolutionPeriod: {
    marginTop: 2,
  },

  evolutionText: {
    marginTop: 4,
  },

  /* INFO */

  infoCard: {
    marginTop: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  infoCopy: {
    flex: 1,
    marginLeft: 8,
  },


  infoText: {
    marginTop: 3,
  },

  /* CARE */

  careGrid: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  careCard: {
    width: '48%',
    minHeight: 135,
    padding: 12,
  },

  careIcon: {
    width: 37,
    height: 37,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  careTitle: {
    marginTop: 8,
  },

  careText: {
    marginTop: 4,
  },

  /* WARNING */

  warningCard: {
    marginTop: 16,
    padding: 16,
  },

  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },

  warningHeaderIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },

  warningHeaderCopy: {
    flex: 1,
    marginLeft: 8,
  },


  warningSubtitle: {
    marginTop: 2,
  },

  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },

  warningText: {
    flex: 1,
  },

  /* TIP */

  tip: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  tipCopy: {
    flex: 1,
    marginLeft: 12,
  },


  tipText: {
    marginTop: 4,
  },

  /* SUMMARY */

  summaryCard: {
    marginTop: 16,
    padding: 16,
  },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },

  summaryText: {
    flex: 1,
  },

  /* DISCLAIMER */

  disclaimer: {
    marginTop: 20,
    paddingHorizontal: 3,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },

  disclaimerText: {
    flex: 1,
  },
  });
}
