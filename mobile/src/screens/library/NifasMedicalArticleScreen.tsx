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

const CONTENT = {
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
} as const;

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
