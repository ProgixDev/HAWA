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
  ms: {
    badge: 'SELEPAS BERSALIN • NIFAS',
    title: 'Nifas:\naspek perubatan',
    metaDuration: '5 min bacaan',
    metaType: 'Panduan',
    metaLevel: 'Permulaan',
    metaValidated: 'Kandungan maklumat',
    intro:
      'Selepas bersalin, tubuh melalui tempoh pemulihan yang beransur-ansur. Memahami pendarahan selepas bersalin, bagaimana ia berkembang dan tanda yang memerlukan perhatian boleh membantu anda berasa lebih berpengetahuan pada masa ini.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Memahami istilah Nifas',
      'Corak perubatan selepas bersalin',
      'Bagaimana lokia berkembang',
      'Menjaga diri anda',
      'Bila untuk meminta nasihat',
      'Perkara penting untuk diingat',
    ],
    h2Section1: '1. Memahami istilah "Nifas"',
    body1a:
      'Istilah "Nifas" tergolong dalam perbendaharaan kata agama dan merujuk kepada tempoh yang dikaitkan dengan pendarahan yang mengikuti bersalin dalam peraturan fiqh Islam.',
    body1b:
      'Dari segi perubatan, pendarahan yang diperhatikan selepas bersalin dipanggil "lokia." Kedua-dua konsep ini boleh dipertimbangkan secara berasingan: satu tergolong dalam kerangka agama, satu lagi menerangkan fenomena fisiologi.',
    distinction: {
      nifasTitle: 'Nifas',
      nifasText: 'Konsep yang tergolong dalam kerangka agama selepas bersalin.',
      lochiaTitle: 'Lokia',
      lochiaText: 'Istilah perubatan yang digunakan untuk pendarahan selepas bersalin.',
    },
    h2Section2: '2. Corak perubatan selepas bersalin',
    body2:
      'Pemulihan selepas bersalin berlaku secara beransur-ansur. Pendarahan selepas bersalin biasanya berubah dari semasa ke semasa apabila rahim terus kembali kepada keadaan biasa.',
    schemaTitle: 'Perkembangan selepas bersalin',
    schemaSubtitle: 'Rujukan perubatan yang dipermudahkan',
    stages: [
      {
        title: 'Selepas bersalin',
        subtitle: 'Permulaan tempoh selepas bersalin',
        text: 'Tubuh beransur-ansur memulakan pemulihannya selepas bersalin.',
      },
      {
        title: 'Lokia',
        subtitle: 'Pendarahan selepas bersalin',
        text: 'Pendarahan beransur-ansur berubah dari segi jumlah dan warna.',
      },
      {
        title: 'Pengurangan beransur-ansur',
        subtitle: 'Sepanjang beberapa minggu',
        text: 'Pendarahan biasanya berkurangan dari semasa ke semasa.',
      },
      {
        title: 'Kembali secara beransur-ansur',
        subtitle: 'Ke arah kitaran biasa',
        text: 'Kitaran haid kemudiannya boleh bersambung semula secara beransur-ansur.',
      },
    ],
    h2Section3: '3. Bagaimana lokia berkembang',
    body3:
      'Lokia biasanya berubah warna secara beransur-ansur dan berkurangan jumlahnya. Walau bagaimanapun, perkembangan ini boleh berbeza dari seorang ke seorang.',
    lochiaEvolution: [
      {
        title: 'Lokia merah',
        period: 'Hari-hari pertama',
        text: 'Pendarahan biasanya berwarna merah dan boleh lebih banyak pada permulaan.',
      },
      {
        title: 'Lokia merah jambu / keperangan',
        period: 'Selepas beberapa hari',
        text: 'Warnanya boleh menjadi lebih cerah atau keperangan apabila aliran berkurangan.',
      },
      {
        title: 'Lokia keputihan',
        period: 'Minggu-minggu berikutnya',
        text: 'Pendarahan beransur-ansur menjadi lebih ringan dan kurang banyak.',
      },
    ],
    infoTitle: 'Perkara penting untuk diingat',
    infoText:
      'Warna dan jumlah lokia boleh berubah secara beransur-ansur. Perkembangan yang tepat tidak sama bagi semua orang.',
    h2Section4: '4. Menjaga diri anda',
    body4:
      'Dalam tempoh ini, beberapa tabiat yang mudah boleh membantu keselesaan dan menyokong pemulihan tubuh.',
    careTips: [
      {title: 'Kebersihan yang lembut', text: 'Kekalkan rutin kebersihan harian yang mudah dan selesa.'},
      {title: 'Rehat', text: 'Beri masa kepada tubuh anda untuk pulih.'},
      {title: 'Hidrasi', text: 'Ingat untuk minum secara tetap mengikut keperluan anda.'},
      {title: 'Pemakanan', text: 'Pemakanan yang pelbagai menyokong pemulihan.'},
    ],
    h2Section5: '5. Bila untuk meminta nasihat',
    body5:
      'Keadaan tertentu memerlukan nasihat segera daripada pengamal penjagaan kesihatan, terutamanya apabila sesuatu perubahan nampak ketara, tiba-tiba atau luar biasa.',
    warningTitle: 'Tanda yang tidak boleh diabaikan',
    warningSubtitle: 'Dapatkan nasihat profesional jika perlu',
    warningSigns: [
      'Bau yang kuat atau luar biasa pada pendarahan',
      'Demam atau keadaan am yang semakin teruk',
      'Pendarahan yang tiba-tiba menjadi sangat banyak',
      'Sakit yang ketara, berterusan atau luar biasa',
      'Simptom baharu yang membimbangkan anda',
    ],
    tipTitle: 'Elok diketahui',
    tipText:
      'Setiap pemulihan selepas bersalin berbeza. Maklumat dalam artikel ini bertujuan memberikan panduan umum dan tidak menggantikan konsultasi perubatan.',
    summaryHeading: 'Perkara penting untuk diingat',
    summary: [
      'Nifas ialah istilah yang digunakan dalam konteks agama selepas bersalin.',
      'Dari segi perubatan, pendarahan selepas bersalin dipanggil lokia.',
      'Lokia beransur-ansur berubah warna dan jumlah.',
      'Rehat, kebersihan yang lembut dan hidrasi yang baik menyokong pemulihan.',
      'Perubahan yang luar biasa atau membimbangkan wajar mendapat nasihat profesional.',
    ],
    disclaimerText:
      'Kandungan bersifat maklumat. Maklumat perubatan yang dikemukakan di sini adalah umum dan tidak menggantikan nasihat pengamal penjagaan kesihatan. Untuk persoalan agama yang khusus, adalah disyorkan untuk merujuk kepada sumber agama yang layak.',
    shareMessage: 'Nifas: aspek perubatan — AWA',
  },
  so: {
    badge: 'DHALMADA KA DIB • NIFAAS',
    title: 'Nifaas:\ndhinacyada caafimaadka',
    metaDuration: '5 daq akhris',
    metaType: 'Hage',
    metaLevel: 'Bilow',
    metaValidated: 'Macluumaad',
    intro:
      'Dhalmada ka dib, jidhku wuxuu maraa muddo bogsiin oo tartiib ah. Fahamka dhiigbaxa dhalmada ka dib, sida uu isu beddelo, iyo calaamadaha u baahan feejignaan ayaa kaa caawin kara inaad dareento macluumaad badan wakhtigan.',
    contentsTitle: 'Maqaalkan dhexdiisa',
    topics: [
      'Fahamka erayga Nifaas',
      'Qaabka caafimaad ee dhalmada ka dib',
      'Sida lochia u isbeddelo',
      'Naftaada daryeel',
      'Goorta talo la raadsado',
      'Qodobbada muhiimka ah',
    ],
    h2Section1: '1. Fahamka erayga “Nifaas”',
    body1a:
      'Erayga “Nifaas” wuxuu ka tirsan yahay erayada diineed wuxuuna tilmaamaa muddada la xiriirta dhiigbaxa ka dambeeya dhalmada, xeerarka fiqhiga Islaamka gudahooda.',
    body1b:
      'Caafimaad ahaan, dhiigbaxa la arko dhalmada ka dib waxaa loo yaqaan “lochia.” Labadan fikradood waa la kala eegi karaa: mid wuxuu ka tirsan yahay qaab diineed, kan kalena wuxuu sharxayaa dhacdo jidh-dhis ah.',
    distinction: {
      nifasTitle: 'Nifaas',
      nifasText: 'Fikrad ka tirsan qaabka diineed ee dhalmada ka dib.',
      lochiaTitle: 'Lochia',
      lochiaText: 'Erayga caafimaad ee loo isticmaalo dhiigbaxa dhalmada ka dib.',
    },
    h2Section2: '2. Qaabka caafimaad ee dhalmada ka dib',
    body2:
      'Bogsiinta dhalmada ka dib way dhacdaa tartiib. Dhiigbaxa dhalmada ka dib guud ahaan wuu isbeddelaa waqti ka dib marka ilmo-galeenku sii wado ku laabashada xaaladdiisa caadiga ah.',
    schemaTitle: 'Horumarka dhalmada ka dib',
    schemaSubtitle: 'Tixraac caafimaad oo la fududeeyey',
    stages: [
      {
        title: 'Dhalmada ka dib',
        subtitle: 'Bilowga muddada dhalmada ka dib',
        text: 'Jidhku wuxuu bilaabaa bogsiintiisa tartiib dhalmada ka dib.',
      },
      {
        title: 'Lochia',
        subtitle: 'Dhiigbaxa dhalmada ka dib',
        text: 'Dhiigbaxu tartiib ayuu xaddiga iyo midabka u beddelaa.',
      },
      {
        title: 'Hoos u dhac tartiib ah',
        subtitle: 'Dhowr toddobaad gudahood',
        text: 'Dhiigbaxu guud ahaan wuu yaraadaa waqti ka dib.',
      },
      {
        title: 'Soo noqosho tartiib ah',
        subtitle: 'Xagga wareegga caadiga ah',
        text: 'Wareegga caadadu markaas wuxuu bilaabi karaa inuu soo noqdo tartiib.',
      },
    ],
    h2Section3: '3. Sida lochia u isbeddelo',
    body3:
      'Lochia guud ahaan wuxuu midabka u beddelaa tartiib oo xaddigiisu wuu yaraadaa. Si kastaba, horumarkani wuu ku kala duwanaan karaa qof ilaa qof.',
    lochiaEvolution: [
      {
        title: 'Lochia casaan ah',
        period: 'Maalmaha ugu horreeya',
        text: 'Dhiigbaxu inta badan waa casaan wuxuuna ka culus noqon karaa bilowga.',
      },
      {
        title: 'Lochia ruuxdhalaal / bunni ah',
        period: 'Dhowr maalmood ka dib',
        text: 'Midabku wuu khafiifi karaa ama bunni noqon karaa marka socodku yaraado.',
      },
      {
        title: 'Lochia cadcad ah',
        period: 'Toddobaadyada xiga',
        text: 'Dhiigbaxu tartiib ayuu u noqdaa mid khafiif ah oo ka yar.',
      },
    ],
    infoTitle: 'Qodobbada muhiimka ah',
    infoText:
      'Midabka iyo xaddiga lochia way isbeddeli karaan tartiib. Horumarka saxda ahi qof walba isku mid ma aha.',
    h2Section4: '4. Naftaada daryeel',
    body4:
      'Muddadan, dhowr caado oo fudud ayaa caawin kara raaxada oo taageeri kara bogsiinta jidhka.',
    careTips: [
      {title: 'Nadaafad jilicsan', text: 'Hay nidaam nadaafad maalinle ah oo fudud, raaxo leh.'},
      {title: 'Nasasho', text: 'Jidhkaaga sii waqti uu ku bogsado.'},
      {title: 'Biyo-cabbid', text: 'Xasuuso inaad si joogto ah u cabto iyadoo loo eegayo baahidaada.'},
      {title: 'Nafaqo', text: 'Cunto kala duwan ayaa taageerta bogsiinta.'},
    ],
    h2Section5: '5. Goorta talo la raadsado',
    body5:
      'Xaalado qaar waxay u baahan yihiin talo degdeg ah oo xirfadle caafimaad, gaar ahaan marka isbeddel uu u muuqdo mid weyn, lama filaan ah, ama aan caadi ahayn.',
    warningTitle: 'Calaamado aan la iska indho tirin',
    warningSubtitle: 'Talo xirfadle raadso haddii loo baahdo',
    warningSigns: [
      'Ur xoog badan ama aan caadi ahayn oo dhiigbaxa ku jirta',
      'Qandho ama xaalad guud oo sii xumaanaysa',
      'Dhiigbax si lama filaan ah u noqda mid aad u culus',
      'Xanuun weyn, sii socda, ama aan caadi ahayn',
      'Astaan cusub oo ku walaaciya',
    ],
    tipTitle: 'Waxtar leh in la ogaado',
    tipText:
      'Bogsiin dhalmada ka dib kasta waa ka duwan yahay. Macluumaadka maqaalkani waa in uu bixiyo hagid guud mana bedelo la-talin caafimaad.',
    summaryHeading: 'Qodobbada muhiimka ah',
    summary: [
      'Nifaas waa eray lagu isticmaalo qaabka diineed dhalmada ka dib.',
      'Caafimaad ahaan, dhiigbaxa dhalmada ka dib waxaa loo yaqaan lochia.',
      'Lochia tartiib ayay midabka iyo xaddiga u beddeshaa.',
      'Nasasho, nadaafad jilicsan, iyo biyo-cabbid wanaagsan ayaa taageera bogsiinta.',
      'Isbeddel aan caadi ahayn ama walaac leh wuxuu mudan yahay talo xirfadle.',
    ],
    disclaimerText:
      'Macluumaad. Macluumaadka caafimaad ee halkan lagu soo bandhigay waa guud mana bedelo talada xirfadle caafimaad. Su’aalaha diineed ee gaarka ah, waxaa lagula talinayaa in loo tixraaco il diineed oo xirfad leh.',
    shareMessage: 'Nifaas: dhinacyada caafimaadka — AWA',
  },
  sw: {
    badge: 'BAADA YA KUJIFUNGUA • NIFASI',
    title: 'Nifasi:\nmambo ya kitabibu',
    metaDuration: 'Dakika 5 za kusoma',
    metaType: 'Mwongozo',
    metaLevel: 'Mwanzo',
    metaValidated: 'Maudhui ya taarifa',
    intro:
      'Baada ya kujifungua, mwili hupitia kipindi cha kupona polepole. Kuelewa kutokwa damu baada ya kujifungua, jinsi kunavyobadilika, na dalili zinazohitaji uangalizi kunaweza kukusaidia kujisikia umepata taarifa zaidi katika kipindi hiki.',
    contentsTitle: 'Katika makala hii',
    topics: [
      'Kuelewa neno Nifasi',
      'Mwenendo wa kitabibu baada ya kujifungua',
      'Jinsi lochia inavyobadilika',
      'Kujitunza',
      'Wakati wa kutafuta ushauri',
      'Mambo muhimu ya kukumbuka',
    ],
    h2Section1: '1. Kuelewa neno "Nifasi"',
    body1a:
      'Neno "Nifasi" ni la msamiati wa kidini na linarejelea kipindi kinachohusiana na kutokwa damu kunakofuata kujifungua ndani ya kanuni za fiqhi ya Kiislamu.',
    body1b:
      'Kitabibu, kutokwa damu kunakoonekana baada ya kujifungua kunaitwa "lochia." Dhana hizi mbili zinaweza kuzingatiwa kando: moja ni ya mfumo wa kidini, nyingine inaelezea tukio la kifiziolojia.',
    distinction: {
      nifasTitle: 'Nifasi',
      nifasText: 'Dhana ya mfumo wa kidini baada ya kujifungua.',
      lochiaTitle: 'Lochia',
      lochiaText: 'Neno la kitabibu linalotumika kwa kutokwa damu baada ya kujifungua.',
    },
    h2Section2: '2. Mwenendo wa kitabibu baada ya kujifungua',
    body2:
      'Kupona baada ya kujifungua hutokea polepole. Kutokwa damu baada ya kujifungua kwa kawaida hubadilika kadiri muda unavyopita huku mji wa uzazi ukiendelea kurejea hali yake ya kawaida.',
    schemaTitle: 'Maendeleo ya baada ya kujifungua',
    schemaSubtitle: 'Rejeo la kitabibu lililorahisishwa',
    stages: [
      {
        title: 'Baada ya kujifungua',
        subtitle: 'Mwanzo wa kipindi cha baada ya kujifungua',
        text: 'Mwili polepole huanza kupona baada ya kuzaliwa.',
      },
      {
        title: 'Lochia',
        subtitle: 'Kutokwa damu baada ya kujifungua',
        text: 'Kutokwa damu polepole hubadilika kwa kiasi na rangi.',
      },
      {
        title: 'Kupungua polepole',
        subtitle: 'Kwa wiki kadhaa',
        text: 'Kutokwa damu kwa kawaida hupungua kadiri muda unavyopita.',
      },
      {
        title: 'Kurejea polepole',
        subtitle: 'Kuelekea mzunguko wa kawaida',
        text: 'Mzunguko wa hedhi unaweza basi kuanza tena polepole.',
      },
    ],
    h2Section3: '3. Jinsi lochia inavyobadilika',
    body3:
      'Lochia kwa kawaida hubadilisha rangi polepole na kupungua kwa kiasi. Hata hivyo, maendeleo haya yanaweza kutofautiana kati ya mtu na mtu.',
    lochiaEvolution: [
      {
        title: 'Lochia nyekundu',
        period: 'Siku za kwanza',
        text: 'Kutokwa damu kwa kawaida ni nyekundu na kunaweza kuwa kwingi zaidi mwanzoni.',
      },
      {
        title: 'Lochia ya waridi / kahawia kiasi',
        period: 'Baada ya siku chache',
        text: 'Rangi inaweza kuwa nyepesi au ya kahawia kadiri mtiririko unavyopungua.',
      },
      {
        title: 'Lochia nyeupe',
        period: 'Wiki zinazofuata',
        text: 'Kutokwa damu polepole kunakuwa kwepesi na kwa kiasi kidogo.',
      },
    ],
    infoTitle: 'Mambo muhimu ya kukumbuka',
    infoText:
      'Rangi na kiasi cha lochia vinaweza kubadilika polepole. Maendeleo kamili si sawa kwa kila mtu.',
    h2Section4: '4. Kujitunza',
    body4:
      'Katika kipindi hiki, tabia chache rahisi zinaweza kusaidia faraja na kuunga mkono kupona kwa mwili.',
    careTips: [
      {title: 'Usafi wa upole', text: 'Dumisha utaratibu rahisi na wa faraja wa usafi wa kila siku.'},
      {title: 'Kupumzika', text: 'Mpe mwili wako muda wa kupona.'},
      {title: 'Kunywa maji', text: 'Kumbuka kunywa mara kwa mara kulingana na mahitaji yako.'},
      {title: 'Lishe', text: 'Lishe yenye aina mbalimbali inasaidia kupona.'},
    ],
    h2Section5: '5. Wakati wa kutafuta ushauri',
    body5:
      'Hali fulani zinahitaji ushauri wa haraka wa mtaalamu wa afya, hasa wakati badiliko linapoonekana kuwa kubwa, la ghafla, au lisilo la kawaida.',
    warningTitle: 'Dalili zisizopaswa kupuuzwa',
    warningSubtitle: 'Tafuta ushauri wa kitaalamu ikiwa inahitajika',
    warningSigns: [
      'Harufu kali au isiyo ya kawaida kwenye kutokwa damu',
      'Homa au hali ya jumla inayozidi kuwa mbaya',
      'Kutokwa damu kunakokuwa kwingi sana ghafla',
      'Maumivu makubwa, ya kuendelea, au yasiyo ya kawaida',
      'Dalili mpya inayokutia wasiwasi',
    ],
    tipTitle: 'Vyema kujua',
    tipText:
      'Kila kupona baada ya kujifungua ni tofauti. Taarifa katika makala hii zimekusudiwa kutoa mwongozo wa jumla na hazichukui nafasi ya mashauriano ya kitabibu.',
    summaryHeading: 'Mambo muhimu ya kukumbuka',
    summary: [
      'Nifasi ni neno linalotumika katika muktadha wa kidini baada ya kujifungua.',
      'Kitabibu, kutokwa damu baada ya kujifungua kunaitwa lochia.',
      'Lochia polepole hubadilika rangi na kiasi.',
      'Kupumzika, usafi wa upole, na kunywa maji ya kutosha vinasaidia kupona.',
      'Badiliko lisilo la kawaida au la kutia wasiwasi linastahili ushauri wa kitaalamu.',
    ],
    disclaimerText:
      'Maudhui ya taarifa. Taarifa za kitabibu zilizowasilishwa hapa ni za jumla na hazichukui nafasi ya ushauri wa mtaalamu wa afya. Kwa maswali mahususi ya kidini, inapendekezwa kurejea chanzo cha kidini kilichohitimu.',
    shareMessage: 'Nifasi: mambo ya kitabibu — AWA',
  },
  kk: {
    badge: 'БОСАНҒАННАН КЕЙІН • НИФАС',
    title: 'Нифас:\nмедициналық жағы',
    metaDuration: '5 мин оқу',
    metaType: 'Нұсқаулық',
    metaLevel: 'Бастауыш',
    metaValidated: 'Ақпараттық мазмұн',
    intro:
      'Босанғаннан кейін дене біртіндеп қалпына келу кезеңінен өтеді. Босанғаннан кейінгі қан кетуді, оның қалай өзгеретінін және назар аударуды қажет ететін белгілерді түсіну бұл уақытта өзіңізді жақсырақ хабардар сезінуге көмектесе алады.',
    contentsTitle: 'Осы мақалада',
    topics: [
      'Нифас терминін түсіну',
      'Босанғаннан кейінгі медициналық үлгі',
      'Лохия қалай өзгереді',
      'Өзіңізге қамқор болу',
      'Кеңесті қашан сұрау керек',
      'Негізгі қорытындылар',
    ],
    h2Section1: '1. "Нифас" терминін түсіну',
    body1a:
      '"Нифас" термині діни лексиконға жатады және ислам фиқһы ережелері шеңберінде босанғаннан кейінгі қан кетумен байланысты кезеңді білдіреді.',
    body1b:
      'Медициналық тұрғыдан босанғаннан кейін байқалатын қан кету "лохия" деп аталады. Бұл екі ұғымды бөлек қарастыруға болады: бірі діни шеңберге жатады, екіншісі физиологиялық құбылысты сипаттайды.',
    distinction: {
      nifasTitle: 'Нифас',
      nifasText: 'Босанғаннан кейінгі діни шеңберге жататын ұғым.',
      lochiaTitle: 'Лохия',
      lochiaText: 'Босанғаннан кейінгі қан кету үшін қолданылатын медициналық термин.',
    },
    h2Section2: '2. Босанғаннан кейінгі медициналық үлгі',
    body2:
      'Босанғаннан кейінгі қалпына келу біртіндеп жүреді. Босанғаннан кейінгі қан кету жатыр әдеттегі күйіне қайта оралуын жалғастырған сайын уақыт өте өзгереді.',
    schemaTitle: 'Босанғаннан кейінгі даму',
    schemaSubtitle: 'Жеңілдетілген медициналық анықтама',
    stages: [
      {
        title: 'Босанғаннан кейін',
        subtitle: 'Босанғаннан кейінгі кезеңнің басы',
        text: 'Дене босанғаннан кейін біртіндеп қалпына келе бастайды.',
      },
      {
        title: 'Лохия',
        subtitle: 'Босанғаннан кейінгі қан кету',
        text: 'Қан кету біртіндеп мөлшері мен түсін өзгертеді.',
      },
      {
        title: 'Біртіндеп азаю',
        subtitle: 'Бірнеше апта бойы',
        text: 'Қан кету әдетте уақыт өте азаяды.',
      },
      {
        title: 'Біртіндеп қайта оралу',
        subtitle: 'Әдеттегі циклге қарай',
        text: 'Етеккір циклі содан кейін біртіндеп қайта басталуы мүмкін.',
      },
    ],
    h2Section3: '3. Лохия қалай өзгереді',
    body3:
      'Лохия әдетте түсін біртіндеп өзгертеді және мөлшері азаяды. Дегенмен бұл даму әр адамда әртүрлі болуы мүмкін.',
    lochiaEvolution: [
      {
        title: 'Қызыл лохия',
        period: 'Алғашқы күндер',
        text: 'Қан кету әдетте қызыл болады және басында мол болуы мүмкін.',
      },
      {
        title: 'Қызғылт / қоңырлау лохия',
        period: 'Бірнеше күннен кейін',
        text: 'Ағу азайған сайын түсі ашылуы немесе қоңырлануы мүмкін.',
      },
      {
        title: 'Ақшыл лохия',
        period: 'Келесі апталар',
        text: 'Қан кету біртіндеп жеңілдеп, азая түседі.',
      },
    ],
    infoTitle: 'Негізгі қорытындылар',
    infoText:
      'Лохияның түсі мен мөлшері біртіндеп өзгеруі мүмкін. Нақты даму барлығында бірдей емес.',
    h2Section4: '4. Өзіңізге қамқор болу',
    body4:
      'Бұл кезеңде бірнеше қарапайым әдет жайлылыққа көмектесіп, дененің қалпына келуін қолдай алады.',
    careTips: [
      {title: 'Жұмсақ гигиена', text: 'Қарапайым, ыңғайлы күнделікті гигиена тәртібін сақтаңыз.'},
      {title: 'Демалыс', text: 'Денеңізге қалпына келуге уақыт беріңіз.'},
      {title: 'Су ішу', text: 'Қажеттіліктеріңізге сай үнемі ішуді ұмытпаңыз.'},
      {title: 'Тамақтану', text: 'Алуан түрлі тамақтану қалпына келуді қолдайды.'},
    ],
    h2Section5: '5. Кеңесті қашан сұрау керек',
    body5:
      'Кейбір жағдайлар медицина маманынан жедел кеңесті қажет етеді, әсіресе өзгеріс айтарлықтай, кенеттен немесе әдеттен тыс болып көрінгенде.',
    warningTitle: 'Елемеуге болмайтын белгілер',
    warningSubtitle: 'Қажет болса, кәсіби кеңес іздеңіз',
    warningSigns: [
      'Қан кетуде күшті немесе әдеттен тыс иіс',
      'Қызба немесе нашарлап бара жатқан жалпы жағдай',
      'Кенеттен өте мол болған қан кету',
      'Айтарлықтай, тұрақты немесе әдеттен тыс ауыру',
      'Сізді алаңдататын жаңа белгі',
    ],
    tipTitle: 'Білуге тиісті',
    tipText:
      'Әр босанғаннан кейінгі қалпына келу әртүрлі. Бұл мақаладағы ақпарат жалпы бағыт беруге арналған және медициналық консультацияның орнын баспайды.',
    summaryHeading: 'Негізгі қорытындылар',
    summary: [
      'Нифас — босанғаннан кейінгі діни контексте қолданылатын термин.',
      'Медициналық тұрғыдан босанғаннан кейінгі қан кету лохия деп аталады.',
      'Лохия біртіндеп түсі мен мөлшерін өзгертеді.',
      'Демалыс, жұмсақ гигиена және жақсы су ішу қалпына келуді қолдайды.',
      'Әдеттен тыс немесе алаңдатарлық өзгеріс кәсіби кеңеске тұрарлық.',
    ],
    disclaimerText:
      'Ақпараттық мазмұн. Мұнда ұсынылған медициналық ақпарат жалпы сипатта және медицина маманының кеңесінің орнын баспайды. Нақты діни сұрақтар үшін білікті діни көзге жүгіну ұсынылады.',
    shareMessage: 'Нифас: медициналық жағы — AWA',
  },
  wo: {
    badge: 'GINNAAW JUR • NIFAS',
    title: 'Nifas:\npàrtu wér',
    metaDuration: '5 simili jàng',
    metaType: 'Ndigal',
    metaLevel: 'Tàmbali',
    metaValidated: 'Mbind ngir xibaar',
    intro:
      'Ginnaaw jur, yaram bi dafay jàll benn jamonoy wér bu tuuti-tuuti. Xam deret ginnaaw jur, naka mu di soppiku ak màndarga yi soxla teg mën na dimbli nga gën a xam ci jamono jii.',
    contentsTitle: 'Ci bind bii',
    topics: [
      'Xam baat bii Nifas',
      'Yoonu wér ginnaaw jur',
      'Naka lochia di soppiku',
      'Yër sa bopp',
      'Kañ ngay seet ndigal',
      'Li am solo',
    ],
    h2Section1: '1. Xam baat bii "Nifas"',
    body1a:
      'Baat bii "Nifas" bokk na ci baatu diine te dafay wone jamono bu jëm ci deret bi topp jur ci yoon yu fiqhu islaam.',
    body1b:
      'Ci wér, deret bi ñuy gis ginnaaw jur dañu ko woowe "lochia." Ñaari xalaat yii mën nañu ñu leen séddale: benn bokk na ci benn tëralin bu diine, bi ci des dafay wone benn jëf bu fisiyoloji.',
    distinction: {
      nifasTitle: 'Nifas',
      nifasText: 'Benn xalaat bu bokk ci tëralinu diine ginnaaw jur.',
      lochiaTitle: 'Lochia',
      lochiaText: 'Baat bu wér bu ñuy jëfandikoo ngir deret ginnaaw jur.',
    },
    h2Section2: '2. Yoonu wér ginnaaw jur',
    body2:
      'Wér ginnaaw jur dafay am tuuti-tuuti. Deret ginnaaw jur daa soppiku ci jamono ba bérëbu ndey di kontine dellu ci anamam bu cosaan.',
    schemaTitle: 'Dem-kanam ginnaaw jur',
    schemaSubtitle: 'Màndarga bu wér bu yomb',
    stages: [
      {
        title: 'Ginnaaw jur',
        subtitle: 'Tàmbalig jamonoy ginnaaw jur',
        text: 'Yaram bi dafay tàmbali wér tuuti-tuuti ginnaaw jur.',
      },
      {
        title: 'Lochia',
        subtitle: 'Deret ginnaaw jur',
        text: 'Deret bi dafay soppiku tuuti-tuuti ci bariwaay ak kuloor.',
      },
      {
        title: 'Wàññiku bu tuuti-tuuti',
        subtitle: 'Ci ay ayu-bés',
        text: 'Deret bi daa wàññiku ci jamono.',
      },
      {
        title: 'Dellusi bu tuuti-tuuti',
        subtitle: 'Jëm ci wërsëg bu cosaan',
        text: 'Wërsëgu weer mën na tàmbaliwaat tuuti-tuuti.',
      },
    ],
    h2Section3: '3. Naka lochia di soppiku',
    body3:
      'Lochia daa soppi kuloor tuuti-tuuti te wàññiku ci bariwaay. Waaye dem-kanam bii mën na wuute ci nit ak nit.',
    lochiaEvolution: [
      {
        title: 'Lochia bu xonq',
        period: 'Fan yu njëkk',
        text: 'Deret bi daa nekk xonq te mën na gën a bari ci tàmbali.',
      },
      {
        title: 'Lochia bu roos / ñuul-xonq',
        period: 'Ginnaaw ay fan',
        text: 'Kuloor bi mën na gën a leer walla ñuul-xonq ba deret bi di wàññiku.',
      },
      {
        title: 'Lochia bu weex',
        period: 'Ayu-bés yu toftal',
        text: 'Deret bi dafay gën a neex te gën a ndaw tuuti-tuuti.',
      },
    ],
    infoTitle: 'Li am solo',
    infoText:
      'Kuloor ak bariwaayu lochia mën nañu soppiku tuuti-tuuti. Dem-kanam bu leer du bokk ci ñépp.',
    h2Section4: '4. Yër sa bopp',
    body4:
      'Ci jamono jii, yenn yoon yu yomb mën nañu dimbli ci neex te dimbli wéru yaram bi.',
    careTips: [
      {title: 'Set bu lewet', text: 'Denc benn yoonu set bu bés bu yomb te neex.'},
      {title: 'Noppalu', text: 'Joxe sa yaram jamono ngir wér.'},
      {title: 'Naan ndox', text: 'Fàttaliku naan ndox ci yoon ci sa soxla.'},
      {title: 'Lekk', text: 'Benn lekk bu wuute dafay dimbli wér.'},
    ],
    h2Section5: '5. Kañ ngay seet ndigal',
    body5:
      'Yenn mbir soxla ndigal bu gaaw bu benn liggéeykatu wér, lool bu soppi bi mel ni am solo, ci gaaw walla cosaanul.',
    warningTitle: 'Màndarga yu bañ a bàyyi',
    warningSubtitle: 'Seet ndigalu liggéeykat bu soxlaa',
    warningSigns: [
      'Xeeñ bu metti walla bu cosaanul ci deret bi',
      'Tàngoor walla anam bu mat bu di ñaaw',
      'Deret bu bari lool ci gaaw',
      'Metit bu am solo, bu sax walla bu cosaanul',
      'Benn màndarga bu bees bu tiital la',
    ],
    tipTitle: 'Lu baax a xam',
    tipText:
      'Wér ginnaaw jur bu nekk wuute na. Xibaar yi ci bind bii ay ndigal yu yaatu lañu te duñu wuutu benn seetlu bu doktoor.',
    summaryHeading: 'Li am solo',
    summary: [
      'Nifas baat la bu ñuy jëfandikoo ci tëralinu diine ginnaaw jur.',
      'Ci wér, deret ginnaaw jur dañu ko woowe lochia.',
      'Lochia daa soppiku tuuti-tuuti ci kuloor ak bariwaay.',
      'Noppalu, set bu lewet ak naan ndox bu baax dañuy dimbli wér.',
      'Benn soppi bu cosaanul walla bu tiital war na ndigal bu liggéeykat.',
    ],
    disclaimerText:
      'Mbind ngir xibaar. Xibaar yu wér yi ñu wone fii yu yaatu lañu te duñu wuutu ndigalu benn liggéeykatu wér. Ngir laaj yu diine yu sa bopp, gën na ñu jëm ci benn cosaanu diine bu am kàttan.',
    shareMessage: 'Nifas: pàrtu wér — AWA',
  },
  ha: {
    badge: 'BAYAN HAIHUWA • NIFASI',
    title: 'Nifasi:\nɓangaren likita',
    metaDuration: 'karatun minti 5',
    metaType: 'Jagora',
    metaLevel: 'Mafari',
    metaValidated: 'Abun bayani',
    intro:
      'Bayan haihuwa, jiki yana wucewa ta lokacin murmurewa a hankali. Fahimtar zubar jinin bayan haihuwa, yadda yake ci gaba, da alamomin da ke bukatar kulawa na iya taimaka miki ki ji ƙarin sani a wannan lokaci.',
    contentsTitle: 'A cikin wannan labari',
    topics: [
      'Fahimtar kalmar Nifasi',
      'Tsarin likita bayan haihuwa',
      'Yadda lochia ke ci gaba',
      'Kula da kanki',
      'Lokacin neman shawara',
      'Muhimman abubuwa',
    ],
    h2Section1: '1. Fahimtar kalmar "Nifasi"',
    body1a:
      'Kalmar "Nifasi" ta shafi kalmomin addini kuma tana nufin lokacin da ke da alaƙa da zubar jinin da ke biyo bayan haihuwa a cikin ƙa’idodin fiqhun Musulunci.',
    body1b:
      'A likitance, ana kiran zubar jinin da ake gani bayan haihuwa "lochia." Ana iya la’akari da waɗannan ra’ayoyi biyu daban: ɗaya na tsarin addini ne, ɗayan yana bayyana wani al’amari na jiki.',
    distinction: {
      nifasTitle: 'Nifasi',
      nifasText: 'Ra’ayi na tsarin addini bayan haihuwa.',
      lochiaTitle: 'Lochia',
      lochiaText: 'Kalmar likita da ake amfani da ita ga zubar jinin bayan haihuwa.',
    },
    h2Section2: '2. Tsarin likita bayan haihuwa',
    body2:
      'Murmurewa bayan haihuwa yana faruwa a hankali. Zubar jinin bayan haihuwa yawanci yana canzawa a kan lokaci yayin da mahaifa ke ci gaba da komawa yanayinta na yau da kullum.',
    schemaTitle: 'Ci gaban bayan haihuwa',
    schemaSubtitle: 'Nassin likita mai sauƙi',
    stages: [
      {
        title: 'Bayan haihuwa',
        subtitle: 'Farkon lokacin bayan haihuwa',
        text: 'Jiki yana fara murmurewa a hankali bayan haihuwa.',
      },
      {
        title: 'Lochia',
        subtitle: 'Zubar jinin bayan haihuwa',
        text: 'Zubar jinin yana canzawa a hankali a yawa da launi.',
      },
      {
        title: 'Raguwa a hankali',
        subtitle: 'A makonni da dama',
        text: 'Zubar jinin yawanci yana raguwa a kan lokaci.',
      },
      {
        title: 'Komawa a hankali',
        subtitle: 'Zuwa zagayen al’ada',
        text: 'Zagayen haila sai ya iya komawa a hankali.',
      },
    ],
    h2Section3: '3. Yadda lochia ke ci gaba',
    body3:
      'Lochia yawanci tana canza launi a hankali kuma yawanta yana raguwa. Duk da haka, wannan ci gaba na iya bambanta daga mutum zuwa mutum.',
    lochiaEvolution: [
      {
        title: 'Lochia ja',
        period: 'Kwanakin farko',
        text: 'Zubar jinin yawanci ja ne kuma yana iya yawaita a farko.',
      },
      {
        title: 'Lochia ruwan hoda / launin ruwan ƙasa',
        period: 'Bayan ’yan kwanaki',
        text: 'Launin zai iya ƙara haske ko komawa ruwan ƙasa yayin da jinin ke raguwa.',
      },
      {
        title: 'Lochia fari-fari',
        period: 'Makonni masu zuwa',
        text: 'Zubar jinin yana ƙara haske kuma yana raguwa a hankali.',
      },
    ],
    infoTitle: 'Muhimman abubuwa',
    infoText:
      'Launin da yawan lochia na iya canzawa a hankali. Ainihin ci gaban ba iri ɗaya ba ne ga kowa.',
    h2Section4: '4. Kula da kanki',
    body4:
      'A wannan lokaci, wasu dabi’u masu sauƙi na iya taimakawa wajen jin daɗi da tallafa wa murmurewar jiki.',
    careTips: [
      {title: 'Tsabta mai laushi', text: 'Rike tsarin tsabta mai sauƙi, mai daɗi kullum.'},
      {title: 'Hutu', text: 'Ba jikinki lokaci don murmurewa.'},
      {title: 'Shan ruwa', text: 'Ki tuna shan ruwa akai-akai bisa bukatunki.'},
      {title: 'Abinci mai gina jiki', text: 'Abinci iri-iri yana tallafa wa murmurewa.'},
    ],
    h2Section5: '5. Lokacin neman shawara',
    body5:
      'Wasu yanayi suna bukatar shawarar ma’aikacin lafiya da sauri, musamman idan wani sauyi ya yi kama da mai muhimmanci, kwatsam, ko ba na al’ada ba.',
    warningTitle: 'Alamomin da bai kamata a yi watsi da su ba',
    warningSubtitle: 'Nemi shawarar ƙwararre idan ya zama dole',
    warningSigns: [
      'Ƙamshi mai ƙarfi ko ba na al’ada ba a cikin zubar jinin',
      'Zazzabi ko yanayi na gabaɗaya da ke ƙara muni',
      'Zubar jini da ya yawaita sosai kwatsam',
      'Ciwo mai yawa, mai dawwama, ko ba na al’ada ba',
      'Sabuwar alama da ke damun ki',
    ],
    tipTitle: 'Abin da ya dace a sani',
    tipText:
      'Kowane murmurewa bayan haihuwa daban ne. An yi bayanin da ke cikin wannan labari don ba da jagora gabaɗaya kuma ba ya maye gurbin shawarar likita.',
    summaryHeading: 'Muhimman abubuwa',
    summary: [
      'Nifasi kalma ce da ake amfani da ita a yanayin addini bayan haihuwa.',
      'A likitance, ana kiran zubar jinin bayan haihuwa lochia.',
      'Lochia tana canza launi da yawa a hankali.',
      'Hutu, tsabta mai laushi, da shan ruwa sosai suna tallafa wa murmurewa.',
      'Sauyi ba na al’ada ba ko mai damuwa ya cancanci shawarar ƙwararre.',
    ],
    disclaimerText:
      'Abun bayani. Bayanin likitan da aka gabatar a nan na gaba ɗaya ne kuma ba ya maye gurbin shawarar ma’aikacin lafiya. Ga takamaiman tambayoyin addini, ana ba da shawarar komawa ga ingantaccen tushen addini.',
    shareMessage: 'Nifasi: ɓangaren likita — AWA',
  },
  am: {
    badge: 'ከወሊድ በኋላ • ኒፋስ',
    title: 'ኒፋስ፦\nየሕክምና ገጽታዎች',
    metaDuration: '5 ደቂቃ ንባብ',
    metaType: 'መመሪያ',
    metaLevel: 'ጀማሪ',
    metaValidated: 'የመረጃ ይዘት',
    intro:
      'ከወሊድ በኋላ ሰውነት ቀስ በቀስ የማገገም ጊዜ ያልፋል። ከወሊድ በኋላ ያለውን ደም መፍሰስ፣ እንዴት እንደሚለወጥ፣ እና ትኩረት የሚያስፈልጋቸውን ምልክቶች መረዳት በዚህ ጊዜ የበለጠ እንድትረጂ ሊረዳሽ ይችላል።',
    contentsTitle: 'በዚህ ጽሑፍ ውስጥ',
    topics: [
      'ኒፋስ የሚለውን ቃል መረዳት',
      'ከወሊድ በኋላ ያለው የሕክምና ዘይቤ',
      'ሎኪያ እንዴት እንደሚለወጥ',
      'ራስሽን መንከባከብ',
      'ምክር መቼ መፈለግ',
      'ዋና ዋና ነጥቦች',
    ],
    h2Section1: '1. “ኒፋስ” የሚለውን ቃል መረዳት',
    body1a:
      '“ኒፋስ” የሚለው ቃል የሃይማኖት መዝገበ ቃላት ነው እና በእስላማዊ ፊቅህ ደንቦች ውስጥ ከወሊድ በኋላ ከሚከተለው ደም መፍሰስ ጋር የተያያዘውን ጊዜ ያመለክታል።',
    body1b:
      'በሕክምና፣ ከወሊድ በኋላ የሚታየው ደም መፍሰስ “ሎኪያ” ይባላል። እነዚህ ሁለት ጽንሰ ሐሳቦች ለየብቻ ሊታዩ ይችላሉ፦ አንደኛው የሃይማኖት ማዕቀፍ ነው፣ ሌላኛው የፊዚዮሎጂ ክስተትን ይገልጻል።',
    distinction: {
      nifasTitle: 'ኒፋስ',
      nifasText: 'ከወሊድ በኋላ ባለው የሃይማኖት ማዕቀፍ ውስጥ ያለ ጽንሰ ሐሳብ።',
      lochiaTitle: 'ሎኪያ',
      lochiaText: 'ለከወሊድ በኋላ ደም መፍሰስ የሚያገለግል የሕክምና ቃል።',
    },
    h2Section2: '2. ከወሊድ በኋላ ያለው የሕክምና ዘይቤ',
    body2:
      'ከወሊድ በኋላ ማገገም ቀስ በቀስ ይከሰታል። ማህፀን ወደ ተለመደው ሁኔታው መመለሱን ሲቀጥል ከወሊድ በኋላ ያለው ደም መፍሰስ በአጠቃላይ በጊዜ ሂደት ይለወጣል።',
    schemaTitle: 'ከወሊድ በኋላ ሂደት',
    schemaSubtitle: 'ቀለል ያለ የሕክምና ማመሳከሪያ',
    stages: [
      {
        title: 'ከወሊድ በኋላ',
        subtitle: 'የከወሊድ በኋላ ጊዜ መጀመሪያ',
        text: 'ሰውነት ከወሊድ በኋላ ቀስ በቀስ ማገገም ይጀምራል።',
      },
      {
        title: 'ሎኪያ',
        subtitle: 'ከወሊድ በኋላ ደም መፍሰስ',
        text: 'ደም መፍሰሱ በመጠንና በቀለም ቀስ በቀስ ይለወጣል።',
      },
      {
        title: 'ቀስ በቀስ መቀነስ',
        subtitle: 'በበርካታ ሳምንታት',
        text: 'ደም መፍሰሱ በአጠቃላይ በጊዜ ሂደት ይቀንሳል።',
      },
      {
        title: 'ቀስ በቀስ መመለስ',
        subtitle: 'ወደ ተለመደው ዑደት',
        text: 'የወር አበባ ዑደት ከዚያ ቀስ በቀስ ሊቀጥል ይችላል።',
      },
    ],
    h2Section3: '3. ሎኪያ እንዴት እንደሚለወጥ',
    body3:
      'ሎኪያ በአጠቃላይ ቀለሙን ቀስ በቀስ ይለውጣል እና መጠኑ ይቀንሳል። ሆኖም፣ ይህ ሂደት ከሰው ወደ ሰው ሊለያይ ይችላል።',
    lochiaEvolution: [
      {
        title: 'ቀይ ሎኪያ',
        period: 'የመጀመሪያዎቹ ቀናት',
        text: 'ደም መፍሰሱ ብዙውን ጊዜ ቀይ ሲሆን በጅማሬ ሊበዛ ይችላል።',
      },
      {
        title: 'ሮዝ / ቡናማ-ቡናማ ሎኪያ',
        period: 'ከጥቂት ቀናት በኋላ',
        text: 'ፍሰቱ ሲቀንስ ቀለሙ ሊቀልል ወይም ወደ ቡናማ ሊሄድ ይችላል።',
      },
      {
        title: 'ነጭ-ነጭ ሎኪያ',
        period: 'በሚቀጥሉት ሳምንታት',
        text: 'ደም መፍሰሱ ቀስ በቀስ ይቀላል እና ያነሰ ይሆናል።',
      },
    ],
    infoTitle: 'ዋና ዋና ነጥቦች',
    infoText:
      'የሎኪያ ቀለምና መጠን ቀስ በቀስ ሊለወጥ ይችላል። ትክክለኛው ሂደት ለሁሉም ተመሳሳይ አይደለም።',
    h2Section4: '4. ራስሽን መንከባከብ',
    body4:
      'በዚህ ጊዜ ጥቂት ቀላል ልማዶች ለምቾት ሊረዱና የሰውነትን ማገገም ሊደግፉ ይችላሉ።',
    careTips: [
      {title: 'ለስላሳ ንጽሕና', text: 'ቀላል፣ ምቹ የዕለት ንጽሕና ሥርዓት ጠብቂ።'},
      {title: 'እረፍት', text: 'ለሰውነትሽ ለማገገም ጊዜ ስጪ።'},
      {title: 'ውሃ መጠጣት', text: 'እንደ ፍላጎትሽ በየጊዜው መጠጣት አስታውሺ።'},
      {title: 'አመጋገብ', text: 'የተለያየ አመጋገብ ማገገምን ይደግፋል።'},
    ],
    h2Section5: '5. ምክር መቼ መፈለግ',
    body5:
      'አንዳንድ ሁኔታዎች ከጤና ባለሙያ ፈጣን ምክር ይፈልጋሉ፣ በተለይ ለውጡ ከፍተኛ፣ ድንገተኛ ወይም ያልተለመደ ሲመስል።',
    warningTitle: 'ችላ ሊባሉ የማይገቡ ምልክቶች',
    warningSubtitle: 'ካስፈለገ የባለሙያ ምክር ፈልጊ',
    warningSigns: [
      'በደም መፍሰሱ ውስጥ ጠንካራ ወይም ያልተለመደ ሽታ',
      'ትኩሳት ወይም እየከፋ የሚሄድ አጠቃላይ ሁኔታ',
      'ድንገት በጣም የሚበዛ ደም መፍሰስ',
      'ከፍተኛ፣ የሚቀጥል ወይም ያልተለመደ ህመም',
      'የሚያሳስብሽ አዲስ ምልክት',
    ],
    tipTitle: 'ማወቅ ጠቃሚ ነው',
    tipText:
      'እያንዳንዱ ከወሊድ በኋላ ማገገም የተለየ ነው። በዚህ ጽሑፍ ውስጥ ያለው መረጃ አጠቃላይ መመሪያ ለመስጠት የታሰበ ነው እና የሕክምና ምክክርን አይተካም።',
    summaryHeading: 'ዋና ዋና ነጥቦች',
    summary: [
      'ኒፋስ ከወሊድ በኋላ በሃይማኖታዊ አውድ ውስጥ የሚጠቀም ቃል ነው።',
      'በሕክምና፣ ከወሊድ በኋላ ያለው ደም መፍሰስ ሎኪያ ይባላል።',
      'ሎኪያ ቀለሙንና መጠኑን ቀስ በቀስ ይለውጣል።',
      'እረፍት፣ ለስላሳ ንጽሕና እና በደንብ ውሃ መጠጣት ማገገምን ይደግፋሉ።',
      'ያልተለመደ ወይም የሚያሳስብ ለውጥ የባለሙያ ምክር ይገባዋል።',
    ],
    disclaimerText:
      'የመረጃ ይዘት። እዚህ የቀረበው የሕክምና መረጃ አጠቃላይ ነው እና የጤና ባለሙያን ምክር አይተካም። ለተወሰኑ ሃይማኖታዊ ጥያቄዎች ብቁ የሃይማኖት ምንጭን ማመሳከር ይመከራል።',
    shareMessage: 'ኒፋስ፦ የሕክምና ገጽታዎች — AWA',
  },
  nl: {
    badge: 'NA DE BEVALLING • NIFAS',
    title: 'Nifas:\nmedische aspecten',
    metaDuration: '5 min lezen',
    metaType: 'Gids',
    metaLevel: 'Beginner',
    metaValidated: 'Informatieve inhoud',
    intro:
      'Na de bevalling doorloopt het lichaam een periode van geleidelijk herstel. Het bloedverlies na de bevalling, hoe het zich ontwikkelt en de tekenen die aandacht vragen begrijpen kan je helpen je in deze tijd beter geïnformeerd te voelen.',
    contentsTitle: 'In dit artikel',
    topics: [
      'De term Nifas begrijpen',
      'Het medische verloop na de bevalling',
      'Hoe lochia zich ontwikkelt',
      'Voor jezelf zorgen',
      'Wanneer advies zoeken',
      'Belangrijkste punten',
    ],
    h2Section1: '1. De term "Nifas" begrijpen',
    body1a:
      'De term "Nifas" behoort tot het religieuze vocabulaire en verwijst naar de periode die samenhangt met het bloedverlies na de bevalling binnen de regels van de islamitische jurisprudentie.',
    body1b:
      'Medisch wordt het bloedverlies na de bevalling "lochia" genoemd. Deze twee begrippen kunnen afzonderlijk worden beschouwd: het ene behoort tot een religieus kader, het andere beschrijft een fysiologisch verschijnsel.',
    distinction: {
      nifasTitle: 'Nifas',
      nifasText: 'Een begrip dat tot het religieuze kader na de bevalling behoort.',
      lochiaTitle: 'Lochia',
      lochiaText: 'Medische term voor bloedverlies na de bevalling.',
    },
    h2Section2: '2. Het medische verloop na de bevalling',
    body2:
      'Herstel na de bevalling verloopt geleidelijk. Het bloedverlies na de bevalling verandert over het algemeen in de loop van de tijd terwijl de baarmoeder terugkeert naar de gebruikelijke toestand.',
    schemaTitle: 'Verloop na de bevalling',
    schemaSubtitle: 'Vereenvoudigde medische referentie',
    stages: [
      {
        title: 'Na de bevalling',
        subtitle: 'Begin van de periode na de bevalling',
        text: 'Het lichaam begint geleidelijk aan zijn herstel na de bevalling.',
      },
      {
        title: 'Lochia',
        subtitle: 'Bloedverlies na de bevalling',
        text: 'Het bloedverlies verandert geleidelijk in hoeveelheid en kleur.',
      },
      {
        title: 'Geleidelijke afname',
        subtitle: 'Over meerdere weken',
        text: 'Het bloedverlies neemt over het algemeen in de loop van de tijd af.',
      },
      {
        title: 'Geleidelijke terugkeer',
        subtitle: 'Naar de gebruikelijke cyclus',
        text: 'De menstruatiecyclus kan daarna geleidelijk hervatten.',
      },
    ],
    h2Section3: '3. Hoe lochia zich ontwikkelt',
    body3:
      'Lochia verandert over het algemeen geleidelijk van kleur en neemt af in hoeveelheid. Deze ontwikkeling kan echter van persoon tot persoon verschillen.',
    lochiaEvolution: [
      {
        title: 'Rode lochia',
        period: 'Eerste dagen',
        text: 'Het bloedverlies is meestal rood en kan in het begin heviger zijn.',
      },
      {
        title: 'Roze / bruinachtige lochia',
        period: 'Na enkele dagen',
        text: 'De kleur kan lichter of bruinachtig worden naarmate de bloeding afneemt.',
      },
      {
        title: 'Witachtige lochia',
        period: 'Volgende weken',
        text: 'Het bloedverlies wordt geleidelijk lichter en minder overvloedig.',
      },
    ],
    infoTitle: 'Belangrijkste punten',
    infoText:
      'De kleur en hoeveelheid van lochia kunnen geleidelijk veranderen. De exacte ontwikkeling is niet voor iedereen hetzelfde.',
    h2Section4: '4. Voor jezelf zorgen',
    body4:
      'In deze periode kunnen enkele eenvoudige gewoonten bijdragen aan het comfort en het herstel van het lichaam ondersteunen.',
    careTips: [
      {title: 'Zachte hygiëne', text: 'Houd een eenvoudige, comfortabele dagelijkse hygiëneroutine aan.'},
      {title: 'Rust', text: 'Geef je lichaam de tijd om te herstellen.'},
      {title: 'Vochtinname', text: 'Denk eraan regelmatig te drinken naar je behoefte.'},
      {title: 'Voeding', text: 'Een gevarieerde voeding ondersteunt het herstel.'},
    ],
    h2Section5: '5. Wanneer advies zoeken',
    body5:
      'Bepaalde situaties vragen om snel advies van een zorgverlener, vooral wanneer een verandering aanzienlijk, plotseling of ongewoon lijkt.',
    warningTitle: 'Tekenen die je niet moet negeren',
    warningSubtitle: 'Zoek zo nodig professioneel advies',
    warningSigns: [
      'Een sterke of ongewone geur in het bloedverlies',
      'Koorts of een verslechterende algemene toestand',
      'Bloedverlies dat plotseling zeer hevig wordt',
      'Aanzienlijke, aanhoudende of ongewone pijn',
      'Een nieuw symptoom dat je zorgen baart',
    ],
    tipTitle: 'Goed om te weten',
    tipText:
      'Elk herstel na de bevalling is anders. De informatie in dit artikel is bedoeld om algemene richtlijnen te geven en vervangt geen medische consultatie.',
    summaryHeading: 'Belangrijkste punten',
    summary: [
      'Nifas is een term die in de religieuze context na de bevalling wordt gebruikt.',
      'Medisch wordt het bloedverlies na de bevalling lochia genoemd.',
      'Lochia verandert geleidelijk van kleur en hoeveelheid.',
      'Rust, zachte hygiëne en goede vochtinname ondersteunen het herstel.',
      'Een ongewone of zorgwekkende verandering verdient professioneel advies.',
    ],
    disclaimerText:
      'Informatieve inhoud. De hier gepresenteerde medische informatie is algemeen en vervangt niet het advies van een zorgverlener. Voor specifieke religieuze vragen wordt aanbevolen een bevoegde religieuze bron te raadplegen.',
    shareMessage: 'Nifas: medische aspecten — AWA',
  },
  fi: {
    badge: 'SYNNYTYKSEN JÄLKEEN • NIFAS',
    title: 'Nifas:\nlääketieteelliset näkökohdat',
    metaDuration: '5 min lukuaika',
    metaType: 'Opas',
    metaLevel: 'Aloittelija',
    metaValidated: 'Tiedoksi tarkoitettua sisältöä',
    intro:
      'Synnytyksen jälkeen keho käy läpi asteittaisen toipumisjakson. Synnytyksen jälkeisen vuodon, sen kehityksen ja huomiota vaativien merkkien ymmärtäminen voi auttaa tuntemaan olosi paremmin perillä olevaksi tänä aikana.',
    contentsTitle: 'Tässä artikkelissa',
    topics: [
      'Termin nifas ymmärtäminen',
      'Lääketieteellinen kaava synnytyksen jälkeen',
      'Miten lochia kehittyy',
      'Itsestäsi huolehtiminen',
      'Milloin hakea neuvoa',
      'Tärkeimmät asiat',
    ],
    h2Section1: '1. Termin “nifas” ymmärtäminen',
    body1a:
      'Termi “nifas” kuuluu uskonnolliseen sanastoon ja viittaa synnytystä seuraavaan vuotoon liittyvään ajanjaksoon islamilaisen oikeustieteen sääntöjen puitteissa.',
    body1b:
      'Lääketieteellisesti synnytyksen jälkeen havaittua vuotoa kutsutaan “lochiaksi”. Näitä kahta käsitettä voidaan tarkastella erikseen: toinen kuuluu uskonnolliseen kehykseen, toinen kuvaa fysiologista ilmiötä.',
    distinction: {
      nifasTitle: 'Nifas',
      nifasText: 'Synnytyksen jälkeiseen uskonnolliseen kehykseen kuuluva käsite.',
      lochiaTitle: 'Lochia',
      lochiaText: 'Synnytyksen jälkeisestä vuodosta käytetty lääketieteellinen termi.',
    },
    h2Section2: '2. Lääketieteellinen kaava synnytyksen jälkeen',
    body2:
      'Synnytyksen jälkeinen toipuminen tapahtuu vähitellen. Synnytyksen jälkeinen vuoto muuttuu yleensä ajan myötä, kun kohtu palaa edelleen tavalliseen tilaansa.',
    schemaTitle: 'Synnytyksen jälkeinen eteneminen',
    schemaSubtitle: 'Yksinkertaistettu lääketieteellinen viite',
    stages: [
      {
        title: 'Synnytyksen jälkeen',
        subtitle: 'Synnytyksen jälkeisen ajan alku',
        text: 'Keho aloittaa vähitellen toipumisensa synnytyksen jälkeen.',
      },
      {
        title: 'Lochia',
        subtitle: 'Synnytyksen jälkeinen vuoto',
        text: 'Vuodon määrä ja väri muuttuvat vähitellen.',
      },
      {
        title: 'Asteittainen väheneminen',
        subtitle: 'Useiden viikkojen aikana',
        text: 'Vuoto yleensä vähenee ajan myötä.',
      },
      {
        title: 'Asteittainen paluu',
        subtitle: 'Kohti tavallista kiertoa',
        text: 'Kuukautiskierto voi sitten vähitellen jatkua.',
      },
    ],
    h2Section3: '3. Miten lochia kehittyy',
    body3:
      'Lochia vaihtaa yleensä väriä vähitellen ja vähenee määrältään. Tämä eteneminen voi kuitenkin vaihdella ihmisestä toiseen.',
    lochiaEvolution: [
      {
        title: 'Punainen lochia',
        period: 'Ensimmäiset päivät',
        text: 'Vuoto on yleensä punaista ja voi olla alussa runsaampaa.',
      },
      {
        title: 'Vaaleanpunainen / ruskehtava lochia',
        period: 'Muutaman päivän kuluttua',
        text: 'Väri voi vaaleta tai muuttua ruskehtavaksi vuodon vähentyessä.',
      },
      {
        title: 'Valkeahko lochia',
        period: 'Seuraavat viikot',
        text: 'Vuoto muuttuu vähitellen vaaleammaksi ja niukemmaksi.',
      },
    ],
    infoTitle: 'Tärkeimmät asiat',
    infoText:
      'Lochian väri ja määrä voivat muuttua vähitellen. Tarkka eteneminen ei ole sama kaikilla.',
    h2Section4: '4. Itsestäsi huolehtiminen',
    body4:
      'Tänä aikana muutama yksinkertainen tapa voi auttaa mukavuudessa ja tukea kehon toipumista.',
    careTips: [
      {title: 'Lempeä hygienia', text: 'Pidä yllä yksinkertainen, mukava päivittäinen hygieniarutiini.'},
      {title: 'Lepo', text: 'Anna keholle aikaa toipua.'},
      {title: 'Nesteytys', text: 'Muista juoda säännöllisesti tarpeesi mukaan.'},
      {title: 'Ravitsemus', text: 'Monipuolinen ruokavalio tukee toipumista.'},
    ],
    h2Section5: '5. Milloin hakea neuvoa',
    body5:
      'Tietyt tilanteet vaativat pikaista terveydenhuollon ammattilaisen neuvoa, erityisesti kun muutos vaikuttaa merkittävältä, äkilliseltä tai epätavalliselta.',
    warningTitle: 'Merkit, joita ei pidä sivuuttaa',
    warningSubtitle: 'Hae tarvittaessa ammattilaisen neuvoa',
    warningSigns: [
      'Voimakas tai epätavallinen haju vuodossa',
      'Kuume tai yleistilan huononeminen',
      'Vuoto, joka muuttuu äkillisesti hyvin runsaaksi',
      'Merkittävä, pitkäkestoinen tai epätavallinen kipu',
      'Uusi oire, joka huolestuttaa sinua',
    ],
    tipTitle: 'Hyvä tietää',
    tipText:
      'Jokainen synnytyksen jälkeinen toipuminen on erilainen. Tämän artikkelin tiedot on tarkoitettu yleiseksi ohjeeksi, eivätkä ne korvaa lääkärin vastaanottoa.',
    summaryHeading: 'Tärkeimmät asiat',
    summary: [
      'Nifas on synnytyksen jälkeisessä uskonnollisessa yhteydessä käytetty termi.',
      'Lääketieteellisesti synnytyksen jälkeistä vuotoa kutsutaan lochiaksi.',
      'Lochian väri ja määrä muuttuvat vähitellen.',
      'Lepo, lempeä hygienia ja hyvä nesteytys tukevat toipumista.',
      'Epätavallinen tai huolestuttava muutos ansaitsee ammattilaisen neuvon.',
    ],
    disclaimerText:
      'Tiedoksi tarkoitettua sisältöä. Tässä esitetyt lääketieteelliset tiedot ovat yleisiä, eivätkä ne korvaa terveydenhuollon ammattilaisen neuvoa. Erityisissä uskonnollisissa kysymyksissä suositellaan turvautumista pätevään uskonnolliseen lähteeseen.',
    shareMessage: 'Nifas: lääketieteelliset näkökohdat — AWA',
  },
  el: {
    badge: 'ΛΟΧΕΙΑ • ΝΙΦΑΣ',
    title: 'Νιφάς:\nοι ιατρικές πτυχές',
    metaDuration: '5 λεπτά ανάγνωσης',
    metaType: 'Οδηγός',
    metaLevel: 'Αρχάριο',
    metaValidated: 'Ενημερωτικό περιεχόμενο',
    intro:
      'Μετά τον τοκετό, το σώμα περνά από μια σταδιακή περίοδο ανάρρωσης. Η κατανόηση της αιμορραγίας της λοχείας, του πώς εξελίσσεται και των σημαδιών που απαιτούν προσοχή μπορεί να σε βοηθήσει να νιώθεις πιο ενημερωμένη σε αυτή την περίοδο.',
    contentsTitle: 'Σε αυτό το άρθρο',
    topics: [
      'Κατανοώντας τον όρο νιφάς',
      'Το ιατρικό μοτίβο μετά τον τοκετό',
      'Πώς εξελίσσονται τα λοχιακά υγρά',
      'Φροντίζοντας τον εαυτό σου',
      'Πότε να ζητήσεις συμβουλή',
      'Βασικά συμπεράσματα',
    ],
    h2Section1: '1. Κατανοώντας τον όρο «νιφάς»',
    body1a:
      'Ο όρος «νιφάς» ανήκει στο θρησκευτικό λεξιλόγιο και αναφέρεται στην περίοδο που συνδέεται με την αιμορραγία μετά τον τοκετό στο πλαίσιο των κανόνων της ισλαμικής νομολογίας.',
    body1b:
      'Ιατρικά, η αιμορραγία που παρατηρείται μετά τον τοκετό ονομάζεται «λοχιακά υγρά». Αυτές οι δύο έννοιες μπορούν να εξεταστούν ξεχωριστά: η μία ανήκει σε θρησκευτικό πλαίσιο, η άλλη περιγράφει ένα φυσιολογικό φαινόμενο.',
    distinction: {
      nifasTitle: 'Νιφάς',
      nifasText: 'Μια έννοια που ανήκει στο θρησκευτικό πλαίσιο μετά τον τοκετό.',
      lochiaTitle: 'Λοχιακά υγρά',
      lochiaText: 'Ιατρικός όρος που χρησιμοποιείται για την αιμορραγία της λοχείας.',
    },
    h2Section2: '2. Το ιατρικό μοτίβο μετά τον τοκετό',
    body2:
      'Η ανάρρωση στη λοχεία γίνεται σταδιακά. Η αιμορραγία της λοχείας αλλάζει γενικά με τον καιρό καθώς η μήτρα συνεχίζει να επιστρέφει στη συνηθισμένη της κατάσταση.',
    schemaTitle: 'Εξέλιξη της λοχείας',
    schemaSubtitle: 'Απλοποιημένη ιατρική αναφορά',
    stages: [
      {
        title: 'Μετά τον τοκετό',
        subtitle: 'Έναρξη της λοχείας',
        text: 'Το σώμα αρχίζει σταδιακά την ανάρρωσή του μετά τον τοκετό.',
      },
      {
        title: 'Λοχιακά υγρά',
        subtitle: 'Αιμορραγία της λοχείας',
        text: 'Η αιμορραγία αλλάζει σταδιακά σε ποσότητα και χρώμα.',
      },
      {
        title: 'Σταδιακή μείωση',
        subtitle: 'Σε αρκετές εβδομάδες',
        text: 'Η αιμορραγία μειώνεται γενικά με τον καιρό.',
      },
      {
        title: 'Σταδιακή επιστροφή',
        subtitle: 'Προς τον συνηθισμένο κύκλο',
        text: 'Ο έμμηνος κύκλος μπορεί τότε να επανέλθει σταδιακά.',
      },
    ],
    h2Section3: '3. Πώς εξελίσσονται τα λοχιακά υγρά',
    body3:
      'Τα λοχιακά υγρά αλλάζουν γενικά χρώμα σταδιακά και μειώνονται σε ποσότητα. Ωστόσο, αυτή η εξέλιξη μπορεί να διαφέρει από γυναίκα σε γυναίκα.',
    lochiaEvolution: [
      {
        title: 'Κόκκινα λοχιακά υγρά',
        period: 'Οι πρώτες ημέρες',
        text: 'Η αιμορραγία είναι συνήθως κόκκινη και μπορεί να είναι πιο έντονη στην αρχή.',
      },
      {
        title: 'Ροζ / καφέ λοχιακά υγρά',
        period: 'Μετά από λίγες ημέρες',
        text: 'Το χρώμα μπορεί να γίνει πιο ανοιχτό ή καφέ καθώς μειώνεται η ροή.',
      },
      {
        title: 'Υπόλευκα λοχιακά υγρά',
        period: 'Τις επόμενες εβδομάδες',
        text: 'Η αιμορραγία γίνεται σταδιακά πιο ελαφριά και λιγότερο άφθονη.',
      },
    ],
    infoTitle: 'Βασικά συμπεράσματα',
    infoText:
      'Το χρώμα και η ποσότητα των λοχιακών υγρών μπορεί να αλλάζουν σταδιακά. Η ακριβής εξέλιξη δεν είναι η ίδια για όλες.',
    h2Section4: '4. Φροντίζοντας τον εαυτό σου',
    body4:
      'Σε αυτή την περίοδο, μερικές απλές συνήθειες μπορούν να βοηθήσουν στην άνεση και να στηρίξουν την ανάρρωση του σώματος.',
    careTips: [
      {title: 'Ήπια υγιεινή', text: 'Κράτα μια απλή, άνετη καθημερινή ρουτίνα υγιεινής.'},
      {title: 'Ξεκούραση', text: 'Δώσε χρόνο στο σώμα σου να αναρρώσει.'},
      {title: 'Ενυδάτωση', text: 'Θυμήσου να πίνεις τακτικά ανάλογα με τις ανάγκες σου.'},
      {title: 'Διατροφή', text: 'Μια ποικίλη διατροφή στηρίζει την ανάρρωση.'},
    ],
    h2Section5: '5. Πότε να ζητήσεις συμβουλή',
    body5:
      'Ορισμένες καταστάσεις απαιτούν άμεση συμβουλή από έναν επαγγελματία υγείας, ιδίως όταν μια αλλαγή φαίνεται σημαντική, ξαφνική ή ασυνήθιστη.',
    warningTitle: 'Σημάδια που δεν πρέπει να αγνοείς',
    warningSubtitle: 'Ζήτησε επαγγελματική συμβουλή αν χρειάζεται',
    warningSigns: [
      'Έντονη ή ασυνήθιστη μυρωδιά στην αιμορραγία',
      'Πυρετός ή επιδείνωση της γενικής κατάστασης',
      'Αιμορραγία που ξαφνικά γίνεται πολύ έντονη',
      'Σημαντικός, επίμονος ή ασυνήθιστος πόνος',
      'Ένα νέο σύμπτωμα που σε ανησυχεί',
    ],
    tipTitle: 'Καλό είναι να γνωρίζεις',
    tipText:
      'Κάθε ανάρρωση στη λοχεία είναι διαφορετική. Οι πληροφορίες αυτού του άρθρου προορίζονται να δώσουν γενική καθοδήγηση και δεν αντικαθιστούν μια ιατρική επίσκεψη.',
    summaryHeading: 'Βασικά συμπεράσματα',
    summary: [
      'Το νιφάς είναι ένας όρος που χρησιμοποιείται στο θρησκευτικό πλαίσιο μετά τον τοκετό.',
      'Ιατρικά, η αιμορραγία της λοχείας ονομάζεται λοχιακά υγρά.',
      'Τα λοχιακά υγρά αλλάζουν σταδιακά χρώμα και ποσότητα.',
      'Η ξεκούραση, η ήπια υγιεινή και η καλή ενυδάτωση στηρίζουν την ανάρρωση.',
      'Μια ασυνήθιστη ή ανησυχητική αλλαγή αξίζει επαγγελματική συμβουλή.',
    ],
    disclaimerText:
      'Ενημερωτικό περιεχόμενο. Οι ιατρικές πληροφορίες που παρουσιάζονται εδώ είναι γενικές και δεν αντικαθιστούν τη συμβουλή ενός επαγγελματία υγείας. Για συγκεκριμένα θρησκευτικά ζητήματα, συνιστάται η ανάτρεξη σε αρμόδια θρησκευτική πηγή.',
    shareMessage: 'Νιφάς: οι ιατρικές πτυχές — AWA',
  },
  fil: {
    badge: 'PAGKATAPOS MANGANAK • NIFAS',
    title: 'Nifas:\nmga medikal na aspeto',
    metaDuration: '5 min na babasahin',
    metaType: 'Gabay',
    metaLevel: 'Baguhan',
    metaValidated: 'Impormatibong nilalaman',
    intro:
      'Pagkatapos manganak, dumaraan ang katawan sa unti-unting panahon ng paggaling. Ang pag-unawa sa pagdurugo pagkatapos manganak, kung paano ito nagbabago, at ang mga senyales na nangangailangan ng atensyon ay makakatulong na maging mas may kaalaman ka sa panahong ito.',
    contentsTitle: 'Sa artikulong ito',
    topics: [
      'Pag-unawa sa terminong Nifas',
      'Ang medikal na pattern pagkatapos manganak',
      'Paano nagbabago ang lochia',
      'Pag-aalaga sa sarili',
      'Kailan hihingi ng payo',
      'Mahahalagang tandaan',
    ],
    h2Section1: '1. Pag-unawa sa terminong "Nifas"',
    body1a:
      'Ang terminong "Nifas" ay bahagi ng bokabularyong panrelihiyon at tumutukoy sa panahong kaugnay ng pagdurugo pagkatapos manganak sa loob ng mga tuntunin ng jurisprudensyang Islamiko.',
    body1b:
      'Sa medikal na aspeto, ang pagdurugong naoobserbahan pagkatapos manganak ay tinatawag na "lochia." Maaaring ituring nang hiwalay ang dalawang konseptong ito: ang isa ay kabilang sa balangkas na panrelihiyon, ang isa ay naglalarawan ng pisyolohikal na penomena.',
    distinction: {
      nifasTitle: 'Nifas',
      nifasText: 'Isang konseptong kabilang sa balangkas na panrelihiyon pagkatapos manganak.',
      lochiaTitle: 'Lochia',
      lochiaText: 'Medikal na terminong ginagamit para sa pagdurugo pagkatapos manganak.',
    },
    h2Section2: '2. Ang medikal na pattern pagkatapos manganak',
    body2:
      'Unti-unting nangyayari ang paggaling pagkatapos manganak. Karaniwang nagbabago sa paglipas ng panahon ang pagdurugo pagkatapos manganak habang patuloy na bumabalik ang matris sa karaniwan nitong kalagayan.',
    schemaTitle: 'Pag-usad pagkatapos manganak',
    schemaSubtitle: 'Pinasimpleng medikal na sanggunian',
    stages: [
      {
        title: 'Pagkatapos manganak',
        subtitle: 'Simula ng panahon pagkatapos manganak',
        text: 'Unti-unting sinisimulan ng katawan ang paggaling pagkatapos manganak.',
      },
      {
        title: 'Lochia',
        subtitle: 'Pagdurugo pagkatapos manganak',
        text: 'Unti-unting nagbabago ang dami at kulay ng pagdurugo.',
      },
      {
        title: 'Unti-unting pagbaba',
        subtitle: 'Sa loob ng ilang linggo',
        text: 'Karaniwang bumababa ang pagdurugo sa paglipas ng panahon.',
      },
      {
        title: 'Unti-unting pagbabalik',
        subtitle: 'Patungo sa karaniwang siklo',
        text: 'Maaaring unti-unting magpatuloy pagkatapos ang siklo ng regla.',
      },
    ],
    h2Section3: '3. Paano nagbabago ang lochia',
    body3:
      'Karaniwang unti-unting nagbabago ng kulay ang lochia at bumababa ang dami. Gayunpaman, maaaring mag-iba ang pag-usad na ito sa bawat tao.',
    lochiaEvolution: [
      {
        title: 'Pulang lochia',
        period: 'Unang mga araw',
        text: 'Karaniwang pula ang pagdurugo at maaaring mas marami sa simula.',
      },
      {
        title: 'Rosas / kayumangging lochia',
        period: 'Pagkalipas ng ilang araw',
        text: 'Maaaring lumiwanag o maging kayumanggi ang kulay habang bumababa ang daloy.',
      },
      {
        title: 'Maputing lochia',
        period: 'Mga sumunod na linggo',
        text: 'Unti-unting gumagaan at nababawasan ang dami ng pagdurugo.',
      },
    ],
    infoTitle: 'Mahahalagang tandaan',
    infoText:
      'Maaaring unti-unting magbago ang kulay at dami ng lochia. Hindi pareho para sa lahat ang eksaktong pag-usad.',
    h2Section4: '4. Pag-aalaga sa sarili',
    body4:
      'Sa panahong ito, ang ilang simpleng gawi ay makakatulong sa ginhawa at sa paggaling ng katawan.',
    careTips: [
      {title: 'Banayad na kalinisan', text: 'Panatilihin ang simple at komportableng pang-araw-araw na gawi sa kalinisan.'},
      {title: 'Pahinga', text: 'Bigyan ang katawan mo ng oras para gumaling.'},
      {title: 'Hydration', text: 'Tandaang uminom nang regular ayon sa pangangailangan mo.'},
      {title: 'Nutrisyon', text: 'Ang iba’t ibang uri ng pagkain ay sumusuporta sa paggaling.'},
    ],
    h2Section5: '5. Kailan hihingi ng payo',
    body5:
      'Ang ilang sitwasyon ay nangangailangan ng agarang payo mula sa propesyonal sa kalusugan, partikular kapag tila malaki, biglaan, o hindi pangkaraniwan ang pagbabago.',
    warningTitle: 'Mga senyales na hindi dapat balewalain',
    warningSubtitle: 'Humingi ng propesyonal na payo kung kinakailangan',
    warningSigns: [
      'Matapang o hindi pangkaraniwang amoy sa pagdurugo',
      'Lagnat o lumalalang pangkalahatang kalagayan',
      'Pagdurugong biglang nagiging napakarami',
      'Matindi, patuloy, o hindi pangkaraniwang sakit',
      'Bagong sintomas na bumabagabag sa iyo',
    ],
    tipTitle: 'Mabuting malaman',
    tipText:
      'Iba-iba ang bawat paggaling pagkatapos manganak. Ang impormasyon sa artikulong ito ay inilaan upang magbigay ng pangkalahatang gabay at hindi pumapalit sa medikal na konsultasyon.',
    summaryHeading: 'Mahahalagang tandaan',
    summary: [
      'Ang Nifas ay terminong ginagamit sa panrelihiyong konteksto pagkatapos manganak.',
      'Sa medikal na aspeto, ang pagdurugo pagkatapos manganak ay tinatawag na lochia.',
      'Unti-unting nagbabago ang kulay at dami ng lochia.',
      'Ang pahinga, banayad na kalinisan, at mahusay na hydration ay sumusuporta sa paggaling.',
      'Ang hindi pangkaraniwan o nakababahalang pagbabago ay nararapat bigyan ng propesyonal na payo.',
    ],
    disclaimerText:
      'Impormatibong nilalaman. Pangkalahatan ang medikal na impormasyong ipinakita rito at hindi pumapalit sa payo ng propesyonal sa kalusugan. Para sa mga partikular na usaping panrelihiyon, inirerekomendang sumangguni sa kuwalipikadong sangguniang panrelihiyon.',
    shareMessage: 'Nifas: mga medikal na aspeto — AWA',
  },
  ta: {
    badge: 'பிரசவத்திற்குப் பின் • நிஃபாஸ்',
    title: 'நிஃபாஸ்:\nமருத்துவ அம்சங்கள்',
    metaDuration: '5 நிமிடம் படிக்க',
    metaType: 'வழிகாட்டி',
    metaLevel: 'தொடக்க நிலை',
    metaValidated: 'தகவல் உள்ளடக்கம்',
    intro:
      'பிரசவத்துக்குப் பின், உடல் படிப்படியான மீட்சிக் காலத்தைக் கடந்து செல்கிறது. பிரசவத்துக்குப் பிந்தைய இரத்தப்போக்கு, அது எப்படி மாறுகிறது, கவனம் தேவைப்படும் அறிகுறிகளைப் புரிந்துகொள்வது, இந்தக் காலத்தில் நீங்கள் நன்கு தெரிந்தவராக உணர உதவலாம்.',
    contentsTitle: 'இந்தக் கட்டுரையில்',
    topics: [
      'நிஃபாஸ் என்ற சொல்லைப் புரிந்துகொள்ளுதல்',
      'பிரசவத்துக்குப் பின் மருத்துவ முறை',
      'லோகியா எப்படி மாறுகிறது',
      'உங்களைக் கவனித்துக்கொள்ளுதல்',
      'ஆலோசனையை எப்போது கேட்பது',
      'முக்கியக் குறிப்புகள்',
    ],
    h2Section1: '1. "நிஃபாஸ்" என்ற சொல்லைப் புரிந்துகொள்ளுதல்',
    body1a:
      '"நிஃபாஸ்" என்ற சொல் மார்க்கச் சொற்றொடரைச் சேர்ந்தது, இஸ்லாமிய மார்க்கச் சட்ட விதிகளுக்குள் பிரசவத்தைத் தொடர்ந்து வரும் இரத்தப்போக்குடன் தொடர்புடைய காலத்தைக் குறிக்கிறது.',
    body1b:
      'மருத்துவ ரீதியாக, பிரசவத்துக்குப் பின் காணப்படும் இரத்தப்போக்கு "லோகியா" என அழைக்கப்படுகிறது. இந்த இரண்டு கருத்துகளையும் தனித்தனியாகக் கருதலாம்: ஒன்று மார்க்கக் கட்டமைப்பைச் சேர்ந்தது, மற்றொன்று ஓர் உடலியல் நிகழ்வை விவரிக்கிறது.',
    distinction: {
      nifasTitle: 'நிஃபாஸ்',
      nifasText: 'பிரசவத்துக்குப் பிந்தைய மார்க்கக் கட்டமைப்பைச் சேர்ந்த ஒரு கருத்து.',
      lochiaTitle: 'லோகியா',
      lochiaText: 'பிரசவத்துக்குப் பிந்தைய இரத்தப்போக்குக்குப் பயன்படுத்தப்படும் மருத்துவச் சொல்.',
    },
    h2Section2: '2. பிரசவத்துக்குப் பின் மருத்துவ முறை',
    body2:
      'பிரசவத்துக்குப் பிந்தைய மீட்சி படிப்படியாக நிகழ்கிறது. கருப்பை தன் வழக்கமான நிலைக்குத் தொடர்ந்து திரும்பும்போது, பிரசவத்துக்குப் பிந்தைய இரத்தப்போக்கு பொதுவாகக் காலப்போக்கில் மாறுகிறது.',
    schemaTitle: 'பிரசவத்துக்குப் பின் முன்னேற்றம்',
    schemaSubtitle: 'எளிமைப்படுத்தப்பட்ட மருத்துவக் குறிப்பு',
    stages: [
      {
        title: 'பிரசவத்துக்குப் பின்',
        subtitle: 'பிரசவத்துக்குப் பிந்தைய காலத்தின் தொடக்கம்',
        text: 'பிரசவத்துக்குப் பின் உடல் படிப்படியாகத் தன் மீட்சியைத் தொடங்குகிறது.',
      },
      {
        title: 'லோகியா',
        subtitle: 'பிரசவத்துக்குப் பிந்தைய இரத்தப்போக்கு',
        text: 'இரத்தப்போக்கு அளவிலும் நிறத்திலும் படிப்படியாக மாறுகிறது.',
      },
      {
        title: 'படிப்படியான குறைவு',
        subtitle: 'பல வாரங்களில்',
        text: 'இரத்தப்போக்கு பொதுவாகக் காலப்போக்கில் குறைகிறது.',
      },
      {
        title: 'படிப்படியான திரும்புதல்',
        subtitle: 'வழக்கமான சுழற்சியை நோக்கி',
        text: 'மாதவிடாய்ச் சுழற்சி பின்னர் படிப்படியாக மீண்டும் தொடங்கலாம்.',
      },
    ],
    h2Section3: '3. லோகியா எப்படி மாறுகிறது',
    body3:
      'லோகியா பொதுவாகப் படிப்படியாக நிறத்தை மாற்றி அளவில் குறைகிறது. இருப்பினும், இந்த முன்னேற்றம் ஒருவருக்கு ஒருவர் மாறுபடலாம்.',
    lochiaEvolution: [
      {
        title: 'சிவப்பு லோகியா',
        period: 'முதல் நாட்கள்',
        text: 'இரத்தப்போக்கு பொதுவாகச் சிவப்பாக இருக்கும், தொடக்கத்தில் அதிகமாக இருக்கலாம்.',
      },
      {
        title: 'இளஞ்சிவப்பு / பழுப்பு லோகியா',
        period: 'சில நாட்களுக்குப் பின்',
        text: 'ஓட்டம் குறையும்போது நிறம் இலேசாகலாம் அல்லது பழுப்பாகலாம்.',
      },
      {
        title: 'வெண்மையான லோகியா',
        period: 'அடுத்த வாரங்கள்',
        text: 'இரத்தப்போக்கு படிப்படியாக இலேசாகி, குறைவாகிறது.',
      },
    ],
    infoTitle: 'முக்கியக் குறிப்புகள்',
    infoText:
      'லோகியாவின் நிறமும் அளவும் படிப்படியாக மாறலாம். சரியான முன்னேற்றம் அனைவருக்கும் ஒரே மாதிரி இருப்பதில்லை.',
    h2Section4: '4. உங்களைக் கவனித்துக்கொள்ளுதல்',
    body4:
      'இந்தக் காலத்தில், சில எளிய பழக்கங்கள் வசதிக்கு உதவலாம், உடலின் மீட்சிக்குத் துணையாக இருக்கலாம்.',
    careTips: [
      {title: 'மென்மையான சுகாதாரம்', text: 'எளிய, வசதியான தினசரிச் சுகாதார வழக்கத்தைப் பேணுங்கள்.'},
      {title: 'ஓய்வு', text: 'உங்கள் உடல் குணமடைய நேரம் கொடுங்கள்.'},
      {title: 'நீர்ச்சத்து', text: 'உங்கள் தேவைக்கேற்பத் தொடர்ந்து அருந்த நினைவில் கொள்ளுங்கள்.'},
      {title: 'ஊட்டச்சத்து', text: 'பல்வகை உணவு மீட்சிக்குத் துணையாக இருக்கிறது.'},
    ],
    h2Section5: '5. ஆலோசனையை எப்போது கேட்பது',
    body5:
      'சில சூழ்நிலைகளுக்கு, குறிப்பாக ஒரு மாற்றம் குறிப்பிடத்தக்கதாக, திடீரென்று அல்லது வழக்கத்துக்கு மாறானதாகத் தோன்றும்போது, ஒரு சுகாதார நிபுணரின் உடனடி ஆலோசனை தேவை.',
    warningTitle: 'புறக்கணிக்கக் கூடாத அறிகுறிகள்',
    warningSubtitle: 'தேவைப்பட்டால் தொழில்முறை ஆலோசனை கேளுங்கள்',
    warningSigns: [
      'இரத்தப்போக்கில் வலுவான அல்லது வழக்கத்துக்கு மாறான மணம்',
      'காய்ச்சல் அல்லது மோசமடையும் ஒட்டுமொத்த நிலை',
      'திடீரென மிக அதிகமாகும் இரத்தப்போக்கு',
      'குறிப்பிடத்தக்க, தொடர்ந்த அல்லது வழக்கத்துக்கு மாறான வலி',
      'உங்களைக் கவலைப்படுத்தும் ஒரு புதிய அறிகுறி',
    ],
    tipTitle: 'தெரிந்துகொள்ளுங்கள்',
    tipText:
      'ஒவ்வொரு பிரசவத்துக்குப் பிந்தைய மீட்சியும் வேறுபட்டது. இந்தக் கட்டுரையில் உள்ள தகவல் பொதுவான வழிகாட்டலை வழங்கவே, மருத்துவ ஆலோசனைக்கு மாற்றல்ல.',
    summaryHeading: 'முக்கியக் குறிப்புகள்',
    summary: [
      'நிஃபாஸ் என்பது பிரசவத்துக்குப் பிந்தைய மார்க்கச் சூழலில் பயன்படுத்தப்படும் ஒரு சொல்.',
      'மருத்துவ ரீதியாக, பிரசவத்துக்குப் பிந்தைய இரத்தப்போக்கு லோகியா என அழைக்கப்படுகிறது.',
      'லோகியா படிப்படியாக நிறத்திலும் அளவிலும் மாறுகிறது.',
      'ஓய்வு, மென்மையான சுகாதாரம் மற்றும் நல்ல நீர்ச்சத்து மீட்சிக்குத் துணையாக இருக்கின்றன.',
      'வழக்கத்துக்கு மாறான அல்லது கவலையளிக்கும் மாற்றம் தொழில்முறை ஆலோசனைக்கு உரியது.',
    ],
    disclaimerText:
      'தகவல் உள்ளடக்கம். இங்கே வழங்கப்பட்ட மருத்துவத் தகவல் பொதுவானது, ஒரு சுகாதார நிபுணரின் ஆலோசனைக்கு மாற்றல்ல. குறிப்பிட்ட மார்க்கக் கேள்விகளுக்கு, ஒரு தகுதிவாய்ந்த மார்க்க ஆதாரத்தைப் பார்ப்பது பரிந்துரைக்கப்படுகிறது.',
    shareMessage: 'நிஃபாஸ்: மருத்துவ அம்சங்கள் — AWA',
  },
  te: {
    badge: 'ప్రసవానంతరం • నిఫాస్',
    title: 'నిఫాస్:\nవైద్యపరమైన కోణాలు',
    metaDuration: '5 నిమిషాల పఠనం',
    metaType: 'గైడ్',
    metaLevel: 'ప్రారంభ స్థాయి',
    metaValidated: 'సమాచార కంటెంట్',
    intro:
      'ప్రసవం తర్వాత, శరీరం క్రమమైన కోలుకునే కాలం గుండా వెళ్తుంది. ప్రసవానంతర రక్తస్రావాన్ని, అది ఎలా మారుతుందో, శ్రద్ధ అవసరమయ్యే సంకేతాలను అర్థం చేసుకోవడం ఈ సమయంలో మీకు మరింత తెలిసినట్లు అనిపించడానికి సహాయపడగలదు.',
    contentsTitle: 'ఈ వ్యాసంలో',
    topics: [
      'నిఫాస్ అనే పదాన్ని అర్థం చేసుకోవడం',
      'ప్రసవం తర్వాత వైద్య తీరు',
      'లోచియా ఎలా మారుతుంది',
      'మిమ్మల్ని మీరు చూసుకోవడం',
      'సలహాను ఎప్పుడు కోరాలి',
      'ముఖ్యాంశాలు',
    ],
    h2Section1: '1. "నిఫాస్" అనే పదాన్ని అర్థం చేసుకోవడం',
    body1a:
      '"నిఫాస్" అనే పదం మార్గదర్శక పదజాలానికి చెందినది, ఇస్లామిక్ న్యాయశాస్త్ర నియమాల చట్రంలో ప్రసవం తర్వాత వచ్చే రక్తస్రావంతో ముడిపడిన కాలాన్ని సూచిస్తుంది.',
    body1b:
      'వైద్యపరంగా, ప్రసవం తర్వాత గమనించే రక్తస్రావాన్ని "లోచియా" అంటారు. ఈ రెండు భావనలను విడివిడిగా పరిగణించవచ్చు: ఒకటి మార్గదర్శక చట్రానికి చెందినది, మరొకటి ఒక శారీరక దృగ్విషయాన్ని వివరిస్తుంది.',
    distinction: {
      nifasTitle: 'నిఫాస్',
      nifasText: 'ప్రసవం తర్వాత మార్గదర్శక చట్రానికి చెందిన ఒక భావన.',
      lochiaTitle: 'లోచియా',
      lochiaText: 'ప్రసవానంతర రక్తస్రావానికి ఉపయోగించే వైద్య పదం.',
    },
    h2Section2: '2. ప్రసవం తర్వాత వైద్య తీరు',
    body2:
      'ప్రసవానంతర కోలుకోవడం క్రమంగా జరుగుతుంది. గర్భాశయం తన సాధారణ స్థితికి తిరిగి వస్తున్న కొద్దీ ప్రసవానంతర రక్తస్రావం సాధారణంగా కాలక్రమేణా మారుతుంది.',
    schemaTitle: 'ప్రసవానంతర పురోగతి',
    schemaSubtitle: 'సరళీకృత వైద్య సూచన',
    stages: [
      {
        title: 'ప్రసవం తర్వాత',
        subtitle: 'ప్రసవానంతర కాలం ప్రారంభం',
        text: 'ప్రసవం తర్వాత శరీరం క్రమంగా కోలుకోవడం మొదలుపెడుతుంది.',
      },
      {
        title: 'లోచియా',
        subtitle: 'ప్రసవానంతర రక్తస్రావం',
        text: 'రక్తస్రావం పరిమాణంలో, రంగులో క్రమంగా మారుతుంది.',
      },
      {
        title: 'క్రమంగా తగ్గడం',
        subtitle: 'అనేక వారాల్లో',
        text: 'రక్తస్రావం సాధారణంగా కాలక్రమేణా తగ్గుతుంది.',
      },
      {
        title: 'క్రమంగా తిరిగి రావడం',
        subtitle: 'సాధారణ చక్రం వైపు',
        text: 'నెలసరి చక్రం అప్పుడు క్రమంగా తిరిగి మొదలవవచ్చు.',
      },
    ],
    h2Section3: '3. లోచియా ఎలా మారుతుంది',
    body3:
      'లోచియా సాధారణంగా క్రమంగా రంగు మారి పరిమాణంలో తగ్గుతుంది. అయితే, ఈ పురోగతి ఒకరి నుండి మరొకరికి మారవచ్చు.',
    lochiaEvolution: [
      {
        title: 'ఎరుపు లోచియా',
        period: 'మొదటి రోజులు',
        text: 'రక్తస్రావం సాధారణంగా ఎరుపుగా ఉంటుంది, ఆరంభంలో ఎక్కువగా ఉండవచ్చు.',
      },
      {
        title: 'గులాబీ / గోధుమ రంగు లోచియా',
        period: 'కొన్ని రోజుల తర్వాత',
        text: 'రక్తస్రావం తగ్గే కొద్దీ రంగు తేలికపడవచ్చు లేదా గోధుమగా మారవచ్చు.',
      },
      {
        title: 'తెల్లని లోచియా',
        period: 'తర్వాతి వారాలు',
        text: 'రక్తస్రావం క్రమంగా తేలికపడి తక్కువ అవుతుంది.',
      },
    ],
    infoTitle: 'ముఖ్యాంశాలు',
    infoText:
      'లోచియా రంగు, పరిమాణం క్రమంగా మారవచ్చు. ఖచ్చితమైన పురోగతి అందరికీ ఒకేలా ఉండదు.',
    h2Section4: '4. మిమ్మల్ని మీరు చూసుకోవడం',
    body4:
      'ఈ కాలంలో, కొన్ని సరళమైన అలవాట్లు సౌకర్యానికి సహాయపడి శరీరం కోలుకోవడానికి తోడ్పడగలవు.',
    careTips: [
      {title: 'మృదువైన పరిశుభ్రత', text: 'ఒక సరళమైన, సౌకర్యవంతమైన రోజువారీ పరిశుభ్రత దినచర్యను పాటించండి.'},
      {title: 'విశ్రాంతి', text: 'మీ శరీరం కోలుకోవడానికి సమయం ఇవ్వండి.'},
      {title: 'నీరు తీసుకోవడం', text: 'మీ అవసరాలకు అనుగుణంగా క్రమం తప్పకుండా తాగడం గుర్తుంచుకోండి.'},
      {title: 'పోషణ', text: 'వైవిధ్యమైన ఆహారం కోలుకోవడానికి తోడ్పడుతుంది.'},
    ],
    h2Section5: '5. సలహాను ఎప్పుడు కోరాలి',
    body5:
      'కొన్ని పరిస్థితులకు ఒక ఆరోగ్య నిపుణుడి త్వరిత సలహా అవసరం, ముఖ్యంగా ఒక మార్పు గణనీయంగా, అకస్మాత్తుగా లేదా అసాధారణంగా అనిపించినప్పుడు.',
    warningTitle: 'విస్మరించకూడని సంకేతాలు',
    warningSubtitle: 'అవసరమైతే నిపుణుల సలహా కోరండి',
    warningSigns: [
      'రక్తస్రావంలో బలమైన లేదా అసాధారణ వాసన',
      'జ్వరం లేదా మరింత దిగజారుతున్న సాధారణ స్థితి',
      'అకస్మాత్తుగా చాలా ఎక్కువయ్యే రక్తస్రావం',
      'గణనీయమైన, కొనసాగే లేదా అసాధారణ నొప్పి',
      'మిమ్మల్ని ఆందోళనపెట్టే కొత్త లక్షణం',
    ],
    tipTitle: 'తెలుసుకోవాల్సినవి',
    tipText:
      'ప్రతి ప్రసవానంతర కోలుకోవడం భిన్నమైనది. ఈ వ్యాసంలోని సమాచారం సాధారణ మార్గదర్శకత్వాన్ని అందించడానికి ఉద్దేశించబడింది, వైద్య సంప్రదింపును భర్తీ చేయదు.',
    summaryHeading: 'ముఖ్యాంశాలు',
    summary: [
      'నిఫాస్ ప్రసవం తర్వాత మార్గదర్శక సందర్భంలో ఉపయోగించే పదం.',
      'వైద్యపరంగా, ప్రసవానంతర రక్తస్రావాన్ని లోచియా అంటారు.',
      'లోచియా రంగులో, పరిమాణంలో క్రమంగా మారుతుంది.',
      'విశ్రాంతి, మృదువైన పరిశుభ్రత, మంచి నీటి శాతం కోలుకోవడానికి తోడ్పడతాయి.',
      'అసాధారణ లేదా ఆందోళన కలిగించే మార్పుకు నిపుణుల సలహా అవసరం.',
    ],
    disclaimerText:
      'సమాచార కంటెంట్. ఇక్కడ అందించిన వైద్య సమాచారం సాధారణమైనది, ఒక ఆరోగ్య నిపుణుడి సలహాకు ప్రత్యామ్నాయం కాదు. నిర్దిష్ట మార్గదర్శక ప్రశ్నల కోసం, అర్హత కలిగిన మార్గదర్శక మూలాన్ని చూడాలని సిఫార్సు చేయబడుతుంది.',
    shareMessage: 'నిఫాస్: వైద్యపరమైన కోణాలు — AWA',
  },
  mr: {
    badge: 'प्रसूतीनंतर • निफास',
    title: 'निफास:\nवैद्यकीय बाजू',
    metaDuration: '5 मिनिटे वाचन',
    metaType: 'मार्गदर्शक',
    metaLevel: 'प्रारंभ स्तर',
    metaValidated: 'माहितीपर मजकूर',
    intro:
      'बाळाला जन्म दिल्यानंतर शरीर हळूहळू बरे होण्याच्या काळातून जाते. प्रसूतीनंतरचा रक्तस्राव, तो कसा बदलतो आणि लक्ष द्यावे लागणारी चिन्हे समजून घेतल्याने या काळात तुम्हाला अधिक माहितगार वाटू शकते.',
    contentsTitle: 'या लेखात',
    topics: [
      'निफास या संज्ञेला समजून घेणे',
      'प्रसूतीनंतरचे वैद्यकीय स्वरूप',
      'लोकिया कसा बदलतो',
      'स्वतःची काळजी घेणे',
      'सल्ला केव्हा घ्यावा',
      'मुख्य मुद्दे',
    ],
    h2Section1: '1. "निफास" या संज्ञेला समजून घेणे',
    body1a:
      '"निफास" ही संज्ञा धार्मिक शब्दसंग्रहातील आहे आणि इस्लामी न्यायशास्त्राच्या नियमांमध्ये प्रसूतीनंतरच्या रक्तस्रावाशी संबंधित काळाला दर्शवते.',
    body1b:
      'वैद्यकीयदृष्ट्या, बाळंतपणानंतर दिसणाऱ्या रक्तस्रावाला "लोकिया" म्हणतात. या दोन संकल्पना स्वतंत्रपणे विचारात घेता येतात: एक धार्मिक चौकटीतील आहे, दुसरी शारीरिक घटनेचे वर्णन करते.',
    distinction: {
      nifasTitle: 'निफास',
      nifasText: 'प्रसूतीनंतरच्या धार्मिक चौकटीतील एक संकल्पना.',
      lochiaTitle: 'लोकिया',
      lochiaText: 'प्रसूतीनंतरच्या रक्तस्रावासाठी वापरली जाणारी वैद्यकीय संज्ञा.',
    },
    h2Section2: '2. प्रसूतीनंतरचे वैद्यकीय स्वरूप',
    body2:
      'प्रसूतीनंतरची पुनर्प्राप्ती हळूहळू होते. गर्भाशय आपल्या नेहमीच्या स्थितीत परत येत राहिल्यामुळे प्रसूतीनंतरचा रक्तस्राव साधारणपणे कालांतराने बदलतो.',
    schemaTitle: 'प्रसूतीनंतरची प्रगती',
    schemaSubtitle: 'सोपा वैद्यकीय संदर्भ',
    stages: [
      {
        title: 'प्रसूतीनंतर',
        subtitle: 'प्रसूतीनंतरच्या काळाची सुरुवात',
        text: 'शरीर प्रसूतीनंतर हळूहळू बरे होण्यास सुरुवात करते.',
      },
      {
        title: 'लोकिया',
        subtitle: 'प्रसूतीनंतरचा रक्तस्राव',
        text: 'रक्तस्राव प्रमाणात आणि रंगात हळूहळू बदलतो.',
      },
      {
        title: 'हळूहळू घट',
        subtitle: 'अनेक आठवड्यांत',
        text: 'रक्तस्राव साधारणपणे कालांतराने कमी होतो.',
      },
      {
        title: 'हळूहळू परत येणे',
        subtitle: 'नेहमीच्या पाळीकडे',
        text: 'मासिक पाळी मग हळूहळू पुन्हा सुरू होऊ शकते.',
      },
    ],
    h2Section3: '3. लोकिया कसा बदलतो',
    body3:
      'लोकिया साधारणपणे हळूहळू रंग बदलतो आणि प्रमाणात कमी होतो. तथापि, ही प्रगती एका व्यक्तीपासून दुसऱ्या व्यक्तीपर्यंत वेगळी असू शकते.',
    lochiaEvolution: [
      {
        title: 'लाल लोकिया',
        period: 'पहिले दिवस',
        text: 'रक्तस्राव सहसा लाल असतो आणि सुरुवातीला जास्त असू शकतो.',
      },
      {
        title: 'गुलाबी / तपकिरी लोकिया',
        period: 'काही दिवसांनंतर',
        text: 'स्राव कमी होताना रंग हलका किंवा तपकिरी होऊ शकतो.',
      },
      {
        title: 'पांढरट लोकिया',
        period: 'पुढील आठवडे',
        text: 'रक्तस्राव हळूहळू हलका आणि कमी प्रमाणात होतो.',
      },
    ],
    infoTitle: 'मुख्य मुद्दे',
    infoText:
      'लोकियाचा रंग आणि प्रमाण हळूहळू बदलू शकते. नेमकी प्रगती प्रत्येकासाठी सारखी नसते.',
    h2Section4: '4. स्वतःची काळजी घेणे',
    body4:
      'या काळात, काही साध्या सवयी आरामासाठी मदत करू शकतात आणि शरीराच्या पुनर्प्राप्तीला आधार देऊ शकतात.',
    careTips: [
      {title: 'हळुवार स्वच्छता', text: 'रोजची साधी, आरामदायी स्वच्छतेची दिनचर्या ठेवा.'},
      {title: 'विश्रांती', text: 'तुमच्या शरीराला बरे होण्यासाठी वेळ द्या.'},
      {title: 'पाण्याचे सेवन', text: 'तुमच्या गरजेनुसार नियमितपणे पाणी पिण्याचे लक्षात ठेवा.'},
      {title: 'आहार', text: 'वैविध्यपूर्ण आहार पुनर्प्राप्तीला आधार देतो.'},
    ],
    h2Section5: '5. सल्ला केव्हा घ्यावा',
    body5:
      'काही परिस्थितींत आरोग्य व्यावसायिकाचा तातडीचा सल्ला आवश्यक असतो, विशेषतः जेव्हा बदल लक्षणीय, अचानक किंवा असामान्य वाटतो.',
    warningTitle: 'दुर्लक्ष करू नयेत अशी चिन्हे',
    warningSubtitle: 'गरज असल्यास तज्ज्ञाचा सल्ला घ्या',
    warningSigns: [
      'रक्तस्रावात तीव्र किंवा असामान्य वास',
      'ताप किंवा बिघडत जाणारी सर्वसाधारण स्थिती',
      'अचानक खूप जास्त होणारा रक्तस्राव',
      'लक्षणीय, कायम किंवा असामान्य वेदना',
      'तुम्हाला काळजीत टाकणारे नवीन लक्षण',
    ],
    tipTitle: 'हे जाणून घ्या',
    tipText:
      'प्रत्येक प्रसूतीनंतरची पुनर्प्राप्ती वेगळी असते. या लेखातील माहिती सर्वसाधारण मार्गदर्शन देण्यासाठी आहे आणि वैद्यकीय सल्लामसलतीची जागा घेत नाही.',
    summaryHeading: 'मुख्य मुद्दे',
    summary: [
      'निफास ही प्रसूतीनंतरच्या धार्मिक संदर्भात वापरली जाणारी संज्ञा आहे.',
      'वैद्यकीयदृष्ट्या, प्रसूतीनंतरच्या रक्तस्रावाला लोकिया म्हणतात.',
      'लोकिया रंगात आणि प्रमाणात हळूहळू बदलतो.',
      'विश्रांती, हळुवार स्वच्छता आणि चांगले पाण्याचे सेवन पुनर्प्राप्तीला आधार देतात.',
      'असामान्य किंवा चिंताजनक बदलासाठी तज्ज्ञाचा सल्ला घ्यावा.',
    ],
    disclaimerText:
      'माहितीपर मजकूर. इथे मांडलेली वैद्यकीय माहिती सर्वसाधारण आहे आणि आरोग्य व्यावसायिकाच्या सल्ल्याची जागा घेत नाही. विशिष्ट धार्मिक प्रश्नांसाठी, पात्र धार्मिक स्रोताचा संदर्भ घेण्याची शिफारस केली जाते.',
    shareMessage: 'निफास: वैद्यकीय बाजू — AWA',
  },
  gu: {
    badge: 'પ્રસૂતિ પછી • નિફાસ',
    title: 'નિફાસ:\nતબીબી પાસાં',
    metaDuration: '5 મિનિટ વાંચન',
    metaType: 'માર્ગદર્શિકા',
    metaLevel: 'પ્રારંભિક સ્તર',
    metaValidated: 'માહિતી માટેની સામગ્રી',
    intro:
      'બાળકને જન્મ આપ્યા પછી શરીર ધીમે ધીમે સ્વસ્થ થવાના સમયગાળામાંથી પસાર થાય છે. પ્રસૂતિ પછીનો રક્તસ્રાવ, તે કેવી રીતે બદલાય છે અને કયા સંકેતો પર ધ્યાન આપવું જોઈએ તે સમજવાથી તમને આ સમય દરમિયાન વધુ માહિતગાર લાગી શકે છે.',
    contentsTitle: 'આ લેખમાં',
    topics: [
      'નિફાસ શબ્દને સમજવો',
      'પ્રસૂતિ પછીની તબીબી પેટર્ન',
      'લોચિયા કેવી રીતે બદલાય છે',
      'પોતાની કાળજી લેવી',
      'સલાહ ક્યારે લેવી',
      'મુખ્ય મુદ્દા',
    ],
    h2Section1: '1. "નિફાસ" શબ્દને સમજવો',
    body1a:
      '"નિફાસ" શબ્દ ધાર્મિક શબ્દભંડોળનો ભાગ છે અને ઇસ્લામી ફિક્હના નિયમોમાં પ્રસૂતિ પછીના રક્તસ્રાવ સાથે જોડાયેલા સમયગાળાને દર્શાવે છે.',
    body1b:
      'તબીબી રીતે, પ્રસૂતિ પછી જોવા મળતા રક્તસ્રાવને "લોચિયા" કહેવાય છે. આ બે બાબતોને અલગ ગણી શકાય: એક ધાર્મિક માળખાની છે, બીજી શારીરિક પ્રક્રિયાનું વર્ણન કરે છે.',
    distinction: {
      nifasTitle: 'નિફાસ',
      nifasText: 'પ્રસૂતિ પછી ધાર્મિક માળખાની એક બાબત.',
      lochiaTitle: 'લોચિયા',
      lochiaText: 'પ્રસૂતિ પછીના રક્તસ્રાવ માટે વપરાતો તબીબી શબ્દ.',
    },
    h2Section2: '2. પ્રસૂતિ પછીની તબીબી પેટર્ન',
    body2:
      'પ્રસૂતિ પછીની રિકવરી ધીમે ધીમે થાય છે. ગર્ભાશય તેની સામાન્ય સ્થિતિમાં પાછું ફરતું રહે તેમ પ્રસૂતિ પછીનો રક્તસ્રાવ સામાન્ય રીતે સમય સાથે બદલાય છે.',
    schemaTitle: 'પ્રસૂતિ પછીની પ્રગતિ',
    schemaSubtitle: 'સરળ કરેલો તબીબી સંદર્ભ',
    stages: [
      {
        title: 'પ્રસૂતિ પછી',
        subtitle: 'પ્રસૂતિ પછીના સમયગાળાની શરૂઆત',
        text: 'શરીર પ્રસૂતિ પછી ધીમે ધીમે સ્વસ્થ થવાનું શરૂ કરે છે.',
      },
      {
        title: 'લોચિયા',
        subtitle: 'પ્રસૂતિ પછીનો રક્તસ્રાવ',
        text: 'રક્તસ્રાવનું પ્રમાણ અને રંગ ધીમે ધીમે બદલાય છે.',
      },
      {
        title: 'ધીમે ધીમે ઘટાડો',
        subtitle: 'કેટલાક અઠવાડિયામાં',
        text: 'રક્તસ્રાવ સામાન્ય રીતે સમય સાથે ઘટે છે.',
      },
      {
        title: 'ધીમે ધીમે પાછા ફરવું',
        subtitle: 'સામાન્ય ચક્ર તરફ',
        text: 'ત્યારબાદ માસિક ચક્ર ધીમે ધીમે ફરી શરૂ થઈ શકે છે.',
      },
    ],
    h2Section3: '3. લોચિયા કેવી રીતે બદલાય છે',
    body3:
      'લોચિયાનો રંગ સામાન્ય રીતે ધીમે ધીમે બદલાય છે અને પ્રમાણ ઘટે છે. જોકે, આ પ્રગતિ વ્યક્તિએ વ્યક્તિએ અલગ હોઈ શકે છે.',
    lochiaEvolution: [
      {
        title: 'લાલ લોચિયા',
        period: 'પ્રથમ દિવસો',
        text: 'રક્તસ્રાવ સામાન્ય રીતે લાલ હોય છે અને શરૂઆતમાં વધુ હોઈ શકે છે.',
      },
      {
        title: 'ગુલાબી / ભૂરાશ પડતા લોચિયા',
        period: 'થોડા દિવસ પછી',
        text: 'સ્રાવ ઘટતાં રંગ હળવો અથવા ભૂરાશ પડતો થઈ શકે છે.',
      },
      {
        title: 'સફેદાશ પડતા લોચિયા',
        period: 'આગળના અઠવાડિયાં',
        text: 'રક્તસ્રાવ ધીમે ધીમે હળવો અને ઓછો થતો જાય છે.',
      },
    ],
    infoTitle: 'મુખ્ય મુદ્દા',
    infoText:
      'લોચિયાનો રંગ અને પ્રમાણ ધીમે ધીમે બદલાઈ શકે છે. ચોક્કસ પ્રગતિ બધા માટે એકસરખી હોતી નથી.',
    h2Section4: '4. પોતાની કાળજી લેવી',
    body4:
      'આ સમયગાળા દરમિયાન કેટલીક સરળ ટેવો આરામ આપવામાં અને શરીરને સ્વસ્થ થવામાં મદદ કરી શકે છે.',
    careTips: [
      {title: 'હળવી સ્વચ્છતા', text: 'રોજિંદી સ્વચ્છતાની સરળ અને આરામદાયક ટેવ જાળવો.'},
      {title: 'આરામ', text: 'તમારા શરીરને સ્વસ્થ થવા માટે સમય આપો.'},
      {title: 'પાણીનું પ્રમાણ', text: 'તમારી જરૂરિયાત મુજબ નિયમિત પાણી પીવાનું યાદ રાખો.'},
      {title: 'પોષણ', text: 'વૈવિધ્યસભર આહાર સ્વસ્થ થવામાં મદદ કરે છે.'},
    ],
    h2Section5: '5. સલાહ ક્યારે લેવી',
    body5:
      'કેટલીક પરિસ્થિતિઓમાં આરોગ્ય વ્યાવસાયિક પાસેથી ઝડપી સલાહ જરૂરી છે, ખાસ કરીને જ્યારે કોઈ ફેરફાર નોંધપાત્ર, અચાનક અથવા અસામાન્ય લાગે.',
    warningTitle: 'અવગણવા ન જોઈએ તેવા સંકેતો',
    warningSubtitle: 'જરૂર હોય તો નિષ્ણાતની સલાહ લો',
    warningSigns: [
      'રક્તસ્રાવમાં તીવ્ર અથવા અસામાન્ય ગંધ',
      'તાવ અથવા સામાન્ય સ્થિતિ બગડવી',
      'રક્તસ્રાવ અચાનક ખૂબ વધી જવો',
      'તીવ્ર, સતત અથવા અસામાન્ય દુખાવો',
      'કોઈ નવું લક્ષણ જે તમને ચિંતા કરાવે',
    ],
    tipTitle: 'જાણવા જેવું',
    tipText:
      'પ્રસૂતિ પછીની દરેક રિકવરી અલગ હોય છે. આ લેખની માહિતી સામાન્ય માર્ગદર્શન આપવા માટે છે અને તબીબી સલાહનું સ્થાન લેતી નથી.',
    summaryHeading: 'મુખ્ય મુદ્દા',
    summary: [
      'નિફાસ પ્રસૂતિ પછીના ધાર્મિક સંદર્ભમાં વપરાતો શબ્દ છે.',
      'તબીબી રીતે, પ્રસૂતિ પછીના રક્તસ્રાવને લોચિયા કહેવાય છે.',
      'લોચિયાનો રંગ અને પ્રમાણ ધીમે ધીમે બદલાય છે.',
      'આરામ, હળવી સ્વચ્છતા અને પૂરતું પાણી સ્વસ્થ થવામાં મદદ કરે છે.',
      'અસામાન્ય અથવા ચિંતાજનક ફેરફાર માટે નિષ્ણાતની સલાહ લેવી જોઈએ.',
    ],
    disclaimerText:
      'માહિતી માટેની સામગ્રી. અહીં આપેલી તબીબી માહિતી સામાન્ય છે અને આરોગ્ય વ્યાવસાયિકની સલાહનું સ્થાન લેતી નથી. ચોક્કસ ધાર્મિક પ્રશ્નો માટે લાયક ધાર્મિક સ્રોતનો સંદર્ભ લેવાની ભલામણ છે.',
    shareMessage: 'નિફાસ: તબીબી પાસાં — AWA',
  },
  pa: {
    badge: 'ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ • ਨਿਫ਼ਾਸ',
    title: 'ਨਿਫ਼ਾਸ:\nਡਾਕਟਰੀ ਪੱਖ',
    metaDuration: '5 ਮਿੰਟ ਪੜ੍ਹਨ',
    metaType: 'ਗਾਈਡ',
    metaLevel: 'ਸ਼ੁਰੂਆਤੀ ਪੱਧਰ',
    metaValidated: 'ਜਾਣਕਾਰੀ ਵਾਲੀ ਸਮੱਗਰੀ',
    intro:
      'ਬੱਚੇ ਨੂੰ ਜਨਮ ਦੇਣ ਤੋਂ ਬਾਅਦ, ਸਰੀਰ ਹੌਲੀ-ਹੌਲੀ ਠੀਕ ਹੋਣ ਦੇ ਦੌਰ ਵਿੱਚੋਂ ਲੰਘਦਾ ਹੈ। ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਦੇ ਖ਼ੂਨ, ਉਸ ਦੇ ਬਦਲਣ ਦੇ ਢੰਗ ਅਤੇ ਧਿਆਨ ਮੰਗਣ ਵਾਲੇ ਸੰਕੇਤਾਂ ਨੂੰ ਸਮਝਣਾ ਇਸ ਸਮੇਂ ਵਿੱਚ ਤੁਹਾਨੂੰ ਵਧੇਰੇ ਜਾਣੂ ਮਹਿਸੂਸ ਕਰਵਾ ਸਕਦਾ ਹੈ।',
    contentsTitle: 'ਇਸ ਲੇਖ ਵਿੱਚ',
    topics: [
      'ਨਿਫ਼ਾਸ ਸ਼ਬਦ ਨੂੰ ਸਮਝਣਾ',
      'ਜਨਮ ਤੋਂ ਬਾਅਦ ਦਾ ਡਾਕਟਰੀ ਰੂਪ',
      'ਲੋਕੀਆ ਕਿਵੇਂ ਬਦਲਦਾ ਹੈ',
      'ਆਪਣਾ ਖ਼ਿਆਲ ਰੱਖਣਾ',
      'ਸਲਾਹ ਕਦੋਂ ਲੈਣੀ ਹੈ',
      'ਮੁੱਖ ਨੁਕਤੇ',
    ],
    h2Section1: '1. "ਨਿਫ਼ਾਸ" ਸ਼ਬਦ ਨੂੰ ਸਮਝਣਾ',
    body1a:
      '"ਨਿਫ਼ਾਸ" ਸ਼ਬਦ ਧਾਰਮਿਕ ਸ਼ਬਦਾਵਲੀ ਦਾ ਹਿੱਸਾ ਹੈ ਅਤੇ ਇਸਲਾਮੀ ਫ਼ਿਕਹ ਦੇ ਨਿਯਮਾਂ ਅੰਦਰ ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਹੋਣ ਵਾਲੇ ਖ਼ੂਨ ਨਾਲ ਜੁੜੇ ਸਮੇਂ ਨੂੰ ਦਰਸਾਉਂਦਾ ਹੈ।',
    body1b:
      'ਡਾਕਟਰੀ ਤੌਰ \'ਤੇ, ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਹੋਣ ਵਾਲੇ ਖ਼ੂਨ ਨੂੰ "ਲੋਕੀਆ" ਕਿਹਾ ਜਾਂਦਾ ਹੈ। ਇਨ੍ਹਾਂ ਦੋਵਾਂ ਧਾਰਨਾਵਾਂ ਨੂੰ ਵੱਖ-ਵੱਖ ਸਮਝਿਆ ਜਾ ਸਕਦਾ ਹੈ: ਇੱਕ ਧਾਰਮਿਕ ਢਾਂਚੇ ਨਾਲ ਸਬੰਧਤ ਹੈ, ਦੂਜਾ ਇੱਕ ਸਰੀਰਕ ਪ੍ਰਕਿਰਿਆ ਦੱਸਦਾ ਹੈ।',
    distinction: {
      nifasTitle: 'ਨਿਫ਼ਾਸ',
      nifasText: 'ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਧਾਰਮਿਕ ਢਾਂਚੇ ਨਾਲ ਸਬੰਧਤ ਇੱਕ ਧਾਰਨਾ।',
      lochiaTitle: 'ਲੋਕੀਆ',
      lochiaText: 'ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਦੇ ਖ਼ੂਨ ਲਈ ਵਰਤਿਆ ਜਾਣ ਵਾਲਾ ਡਾਕਟਰੀ ਸ਼ਬਦ।',
    },
    h2Section2: '2. ਜਨਮ ਤੋਂ ਬਾਅਦ ਦਾ ਡਾਕਟਰੀ ਰੂਪ',
    body2:
      'ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਠੀਕ ਹੋਣਾ ਹੌਲੀ-ਹੌਲੀ ਹੁੰਦਾ ਹੈ। ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਦਾ ਖ਼ੂਨ ਆਮ ਤੌਰ \'ਤੇ ਸਮੇਂ ਦੇ ਨਾਲ ਬਦਲਦਾ ਹੈ ਕਿਉਂਕਿ ਬੱਚੇਦਾਨੀ ਆਪਣੀ ਆਮ ਹਾਲਤ ਵਿੱਚ ਵਾਪਸ ਆਉਂਦੀ ਰਹਿੰਦੀ ਹੈ।',
    schemaTitle: 'ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਦੀ ਪ੍ਰਗਤੀ',
    schemaSubtitle: 'ਸਰਲ ਡਾਕਟਰੀ ਹਵਾਲਾ',
    stages: [
      {
        title: 'ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ',
        subtitle: 'ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਦੇ ਦੌਰ ਦੀ ਸ਼ੁਰੂਆਤ',
        text: 'ਜਨਮ ਤੋਂ ਬਾਅਦ ਸਰੀਰ ਹੌਲੀ-ਹੌਲੀ ਠੀਕ ਹੋਣਾ ਸ਼ੁਰੂ ਕਰਦਾ ਹੈ।',
      },
      {
        title: 'ਲੋਕੀਆ',
        subtitle: 'ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਦਾ ਖ਼ੂਨ',
        text: 'ਖ਼ੂਨ ਦੀ ਮਾਤਰਾ ਅਤੇ ਰੰਗ ਹੌਲੀ-ਹੌਲੀ ਬਦਲਦੇ ਹਨ।',
      },
      {
        title: 'ਹੌਲੀ-ਹੌਲੀ ਘਟਣਾ',
        subtitle: 'ਕਈ ਹਫ਼ਤਿਆਂ ਦੌਰਾਨ',
        text: 'ਖ਼ੂਨ ਆਮ ਤੌਰ \'ਤੇ ਸਮੇਂ ਦੇ ਨਾਲ ਘਟਦਾ ਜਾਂਦਾ ਹੈ।',
      },
      {
        title: 'ਹੌਲੀ-ਹੌਲੀ ਵਾਪਸੀ',
        subtitle: 'ਆਮ ਚੱਕਰ ਵੱਲ',
        text: 'ਮਾਹਵਾਰੀ ਚੱਕਰ ਫਿਰ ਹੌਲੀ-ਹੌਲੀ ਦੁਬਾਰਾ ਸ਼ੁਰੂ ਹੋ ਸਕਦਾ ਹੈ।',
      },
    ],
    h2Section3: '3. ਲੋਕੀਆ ਕਿਵੇਂ ਬਦਲਦਾ ਹੈ',
    body3:
      'ਲੋਕੀਆ ਆਮ ਤੌਰ \'ਤੇ ਹੌਲੀ-ਹੌਲੀ ਰੰਗ ਬਦਲਦਾ ਹੈ ਅਤੇ ਮਾਤਰਾ ਵਿੱਚ ਘਟਦਾ ਹੈ। ਫਿਰ ਵੀ, ਇਹ ਤਰੱਕੀ ਹਰ ਵਿਅਕਤੀ ਵਿੱਚ ਵੱਖ ਹੋ ਸਕਦੀ ਹੈ।',
    lochiaEvolution: [
      {
        title: 'ਲਾਲ ਲੋਕੀਆ',
        period: 'ਪਹਿਲੇ ਦਿਨ',
        text: 'ਖ਼ੂਨ ਆਮ ਤੌਰ \'ਤੇ ਲਾਲ ਹੁੰਦਾ ਹੈ ਅਤੇ ਸ਼ੁਰੂ ਵਿੱਚ ਵਧੇਰੇ ਹੋ ਸਕਦਾ ਹੈ।',
      },
      {
        title: 'ਗੁਲਾਬੀ / ਭੂਰਾ ਜਿਹਾ ਲੋਕੀਆ',
        period: 'ਕੁਝ ਦਿਨਾਂ ਬਾਅਦ',
        text: 'ਵਹਾਅ ਘਟਣ ਨਾਲ ਰੰਗ ਹਲਕਾ ਜਾਂ ਭੂਰਾ ਜਿਹਾ ਹੋ ਸਕਦਾ ਹੈ।',
      },
      {
        title: 'ਚਿੱਟਾ ਜਿਹਾ ਲੋਕੀਆ',
        period: 'ਅਗਲੇ ਹਫ਼ਤੇ',
        text: 'ਖ਼ੂਨ ਹੌਲੀ-ਹੌਲੀ ਹਲਕਾ ਅਤੇ ਘੱਟ ਮਾਤਰਾ ਵਾਲਾ ਹੋ ਜਾਂਦਾ ਹੈ।',
      },
    ],
    infoTitle: 'ਮੁੱਖ ਨੁਕਤੇ',
    infoText:
      'ਲੋਕੀਆ ਦਾ ਰੰਗ ਅਤੇ ਮਾਤਰਾ ਹੌਲੀ-ਹੌਲੀ ਬਦਲ ਸਕਦੇ ਹਨ। ਸਹੀ ਤਰੱਕੀ ਹਰ ਕਿਸੇ ਲਈ ਇੱਕੋ ਜਿਹੀ ਨਹੀਂ ਹੁੰਦੀ।',
    h2Section4: '4. ਆਪਣਾ ਖ਼ਿਆਲ ਰੱਖਣਾ',
    body4:
      'ਇਸ ਦੌਰ ਵਿੱਚ, ਕੁਝ ਸਰਲ ਆਦਤਾਂ ਆਰਾਮ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦੀਆਂ ਹਨ ਅਤੇ ਸਰੀਰ ਦੇ ਠੀਕ ਹੋਣ ਵਿੱਚ ਸਹਾਇਕ ਹੋ ਸਕਦੀਆਂ ਹਨ।',
    careTips: [
      {title: 'ਕੋਮਲ ਸਫ਼ਾਈ', text: 'ਰੋਜ਼ਾਨਾ ਸਫ਼ਾਈ ਦੀ ਇੱਕ ਸਰਲ, ਆਰਾਮਦਾਇਕ ਆਦਤ ਰੱਖੋ।'},
      {title: 'ਆਰਾਮ', text: 'ਆਪਣੇ ਸਰੀਰ ਨੂੰ ਠੀਕ ਹੋਣ ਲਈ ਸਮਾਂ ਦਿਓ।'},
      {title: 'ਪਾਣੀ ਦੀ ਮਾਤਰਾ', text: 'ਆਪਣੀ ਲੋੜ ਮੁਤਾਬਕ ਨਿਯਮਿਤ ਤੌਰ \'ਤੇ ਪਾਣੀ ਪੀਣਾ ਯਾਦ ਰੱਖੋ।'},
      {title: 'ਖ਼ੁਰਾਕ', text: 'ਵੰਨ-ਸੁਵੰਨੀ ਖ਼ੁਰਾਕ ਠੀਕ ਹੋਣ ਵਿੱਚ ਮਦਦ ਕਰਦੀ ਹੈ।'},
    ],
    h2Section5: '5. ਸਲਾਹ ਕਦੋਂ ਲੈਣੀ ਹੈ',
    body5:
      'ਕੁਝ ਸਥਿਤੀਆਂ ਵਿੱਚ ਸਿਹਤ ਮਾਹਿਰ ਤੋਂ ਜਲਦੀ ਸਲਾਹ ਲੈਣੀ ਚਾਹੀਦੀ ਹੈ, ਖ਼ਾਸ ਕਰਕੇ ਜਦੋਂ ਕੋਈ ਬਦਲਾਅ ਵੱਡਾ, ਅਚਾਨਕ ਜਾਂ ਅਸਾਧਾਰਨ ਲੱਗੇ।',
    warningTitle: 'ਅਣਗੌਲੇ ਨਾ ਕਰਨ ਵਾਲੇ ਸੰਕੇਤ',
    warningSubtitle: 'ਲੋੜ ਪੈਣ \'ਤੇ ਮਾਹਿਰ ਦੀ ਸਲਾਹ ਲਓ',
    warningSigns: [
      'ਖ਼ੂਨ ਵਿੱਚ ਤੇਜ਼ ਜਾਂ ਅਸਾਧਾਰਨ ਬਦਬੂ',
      'ਬੁਖ਼ਾਰ ਜਾਂ ਆਮ ਹਾਲਤ ਦਾ ਵਿਗੜਨਾ',
      'ਖ਼ੂਨ ਦਾ ਅਚਾਨਕ ਬਹੁਤ ਜ਼ਿਆਦਾ ਹੋ ਜਾਣਾ',
      'ਤੇਜ਼, ਲਗਾਤਾਰ ਜਾਂ ਅਸਾਧਾਰਨ ਦਰਦ',
      'ਕੋਈ ਨਵਾਂ ਲੱਛਣ ਜੋ ਤੁਹਾਨੂੰ ਚਿੰਤਤ ਕਰੇ',
    ],
    tipTitle: 'ਜਾਣਨ ਯੋਗ',
    tipText:
      'ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਹਰ ਕਿਸੇ ਦਾ ਠੀਕ ਹੋਣਾ ਵੱਖਰਾ ਹੁੰਦਾ ਹੈ। ਇਸ ਲੇਖ ਦੀ ਜਾਣਕਾਰੀ ਆਮ ਮਾਰਗਦਰਸ਼ਨ ਦੇਣ ਲਈ ਹੈ ਅਤੇ ਡਾਕਟਰੀ ਸਲਾਹ-ਮਸ਼ਵਰੇ ਦੀ ਥਾਂ ਨਹੀਂ ਲੈਂਦੀ।',
    summaryHeading: 'ਮੁੱਖ ਨੁਕਤੇ',
    summary: [
      'ਨਿਫ਼ਾਸ ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਧਾਰਮਿਕ ਸੰਦਰਭ ਵਿੱਚ ਵਰਤਿਆ ਜਾਣ ਵਾਲਾ ਸ਼ਬਦ ਹੈ।',
      'ਡਾਕਟਰੀ ਤੌਰ \'ਤੇ, ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਦੇ ਖ਼ੂਨ ਨੂੰ ਲੋਕੀਆ ਕਿਹਾ ਜਾਂਦਾ ਹੈ।',
      'ਲੋਕੀਆ ਦਾ ਰੰਗ ਅਤੇ ਮਾਤਰਾ ਹੌਲੀ-ਹੌਲੀ ਬਦਲਦੇ ਹਨ।',
      'ਆਰਾਮ, ਕੋਮਲ ਸਫ਼ਾਈ ਅਤੇ ਪਾਣੀ ਦੀ ਚੰਗੀ ਮਾਤਰਾ ਠੀਕ ਹੋਣ ਵਿੱਚ ਮਦਦ ਕਰਦੇ ਹਨ।',
      'ਕੋਈ ਅਸਾਧਾਰਨ ਜਾਂ ਚਿੰਤਾਜਨਕ ਬਦਲਾਅ ਹੋਵੇ ਤਾਂ ਮਾਹਿਰ ਦੀ ਸਲਾਹ ਲੈਣੀ ਚਾਹੀਦੀ ਹੈ।',
    ],
    disclaimerText:
      'ਇਹ ਜਾਣਕਾਰੀ ਲਈ ਹੈ। ਇੱਥੇ ਦਿੱਤੀ ਡਾਕਟਰੀ ਜਾਣਕਾਰੀ ਆਮ ਹੈ ਅਤੇ ਸਿਹਤ ਮਾਹਿਰ ਦੀ ਸਲਾਹ ਦੀ ਥਾਂ ਨਹੀਂ ਲੈਂਦੀ। ਖ਼ਾਸ ਧਾਰਮਿਕ ਸਵਾਲਾਂ ਲਈ ਕਿਸੇ ਯੋਗ ਧਾਰਮਿਕ ਸਰੋਤ ਵੱਲ ਰੁਜੂ ਕਰਨ ਦੀ ਸਿਫ਼ਾਰਸ਼ ਕੀਤੀ ਜਾਂਦੀ ਹੈ।',
    shareMessage: 'ਨਿਫ਼ਾਸ: ਡਾਕਟਰੀ ਪੱਖ — AWA',
  },
  my: {
    badge: 'ကလေးမွေးပြီးနောက် • နီဖာစ်',
    title: 'နီဖာစ်-\nဆေးဘက်ဆိုင်ရာ ရှုထောင့်များ',
    metaDuration: 'ဖတ်ချိန် 5 မိနစ်',
    metaType: 'လမ်းညွှန်',
    metaLevel: 'အခြေခံအဆင့်',
    metaValidated: 'အချက်အလက်ပေးသော အကြောင်းအရာ',
    intro:
      'ကလေးမွေးဖွားပြီးနောက် ခန္ဓာကိုယ်သည် တဖြည်းဖြည်း ပြန်လည်ကောင်းမွန်လာသည့် ကာလကို ဖြတ်သန်းသည်။ မီးဖွားပြီးနောက် သွေးထွက်ခြင်း၊ ၎င်း ပြောင်းလဲပုံနှင့် ဂရုစိုက်ရန် လိုအပ်သော လက္ခဏာများကို နားလည်ခြင်းက ဤကာလတွင် သင့်ကို ပိုမိုသိရှိစေနိုင်သည်။',
    contentsTitle: 'ဤဆောင်းပါးတွင်',
    topics: [
      'နီဖာစ်ဟူသော စကားလုံးကို နားလည်ခြင်း',
      'မီးဖွားပြီးနောက် ဆေးဘက်ဆိုင်ရာပုံစံ',
      'မီးဖွားပြီးနောက်သွေး ပြောင်းလဲပုံ',
      'ကိုယ့်ကိုယ်ကို ဂရုစိုက်ခြင်း',
      'အကြံဉာဏ်မည်သည့်အခါ ရယူသင့်သလဲ',
      'အဓိကအချက်များ',
    ],
    h2Section1: '1. "နီဖာစ်" ဟူသော စကားလုံးကို နားလည်ခြင်း',
    body1a:
      '"နီဖာစ်" ဟူသော စကားလုံးသည် ဘာသာရေးဝေါဟာရဖြစ်ပြီး အစ်စလာမ်ဖစ်ခ်ဟ်စည်းမျဉ်းများအတွင်း ကလေးမွေးဖွားပြီးနောက် သွေးထွက်ခြင်းနှင့် ဆက်စပ်သော ကာလကို ရည်ညွှန်းသည်။',
    body1b:
      'ဆေးပညာအရ ကလေးမွေးပြီးနောက် တွေ့ရသော သွေးထွက်ခြင်းကို "မီးဖွားပြီးနောက်သွေး" ဟု ခေါ်သည်။ ဤအယူအဆနှစ်ခုကို သီးခြားစီ ယူဆနိုင်သည်- တစ်ခုသည် ဘာသာရေးမူဘောင်နှင့်သက်ဆိုင်ပြီး နောက်တစ်ခုသည် ဇီဝဗေဒဆိုင်ရာ ဖြစ်စဉ်ကို ဖော်ပြသည်။',
    distinction: {
      nifasTitle: 'နီဖာစ်',
      nifasText: 'ကလေးမွေးပြီးနောက် ဘာသာရေးမူဘောင်နှင့် သက်ဆိုင်သော အယူအဆ။',
      lochiaTitle: 'မီးဖွားပြီးနောက်သွေး',
      lochiaText: 'မီးဖွားပြီးနောက် သွေးထွက်ခြင်းအတွက် သုံးသော ဆေးဘက်ဆိုင်ရာ ဝေါဟာရ။',
    },
    h2Section2: '2. မီးဖွားပြီးနောက် ဆေးဘက်ဆိုင်ရာပုံစံ',
    body2:
      'မီးဖွားပြီးနောက် ပြန်လည်ကောင်းမွန်မှုသည် တဖြည်းဖြည်း ဖြစ်ပေါ်သည်။ သားအိမ်သည် ပုံမှန်အခြေအနေသို့ ဆက်လက်ပြန်သွားသည်နှင့်အမျှ မီးဖွားပြီးနောက် သွေးထွက်ခြင်းသည် ယေဘုယျအားဖြင့် အချိန်ကြာလာသည်နှင့်အမျှ ပြောင်းလဲသည်။',
    schemaTitle: 'မီးဖွားပြီးနောက် တိုးတက်မှု',
    schemaSubtitle: 'ရိုးရှင်းစေထားသော ဆေးဘက်ဆိုင်ရာ ကိုးကားချက်',
    stages: [
      {
        title: 'ကလေးမွေးဖွားပြီးနောက်',
        subtitle: 'မီးဖွားပြီးနောက်ကာလ အစ',
        text: 'မွေးဖွားပြီးနောက် ခန္ဓာကိုယ်သည် တဖြည်းဖြည်း ပြန်လည်ကောင်းမွန်မှု စတင်သည်။',
      },
      {
        title: 'မီးဖွားပြီးနောက်သွေး',
        subtitle: 'မီးဖွားပြီးနောက် သွေးထွက်ခြင်း',
        text: 'သွေးထွက်ခြင်းသည် ပမာဏနှင့် အရောင်တွင် တဖြည်းဖြည်း ပြောင်းလဲသည်။',
      },
      {
        title: 'တဖြည်းဖြည်း လျော့နည်းခြင်း',
        subtitle: 'သီတင်းပတ်များစွာအတွင်း',
        text: 'သွေးထွက်ခြင်းသည် ယေဘုယျအားဖြင့် အချိန်ကြာလာသည်နှင့်အမျှ လျော့နည်းသည်။',
      },
      {
        title: 'တဖြည်းဖြည်း ပြန်လည်ကောင်းမွန်ခြင်း',
        subtitle: 'ပုံမှန်ရာသီစက်ဝန်းဆီသို့',
        text: 'ထို့နောက် ရာသီစက်ဝန်းသည် တဖြည်းဖြည်း ပြန်လည်စတင်နိုင်သည်။',
      },
    ],
    h2Section3: '3. မီးဖွားပြီးနောက်သွေး ပြောင်းလဲပုံ',
    body3:
      'မီးဖွားပြီးနောက်သွေးသည် ယေဘုယျအားဖြင့် အရောင်တဖြည်းဖြည်း ပြောင်းလဲပြီး ပမာဏ လျော့နည်းသွားသည်။ သို့သော် ဤတိုးတက်မှုသည် လူတစ်ဦးနှင့်တစ်ဦး ကွဲပြားနိုင်သည်။',
    lochiaEvolution: [
      {
        title: 'အနီရောင် မီးဖွားပြီးနောက်သွေး',
        period: 'ပထမရက်များ',
        text: 'သွေးထွက်ခြင်းသည် များသောအားဖြင့် အနီရောင်ဖြစ်ပြီး အစပိုင်းတွင် ပိုများနိုင်သည်။',
      },
      {
        title: 'ပန်းရောင် / ညိုမည်းသော မီးဖွားပြီးနောက်သွေး',
        period: 'ရက်အနည်းငယ်ကြာပြီးနောက်',
        text: 'သွေးထွက်ပမာဏ လျော့နည်းလာသည်နှင့်အမျှ အရောင်သည် ပိုဖျော့လာနိုင်သည် သို့မဟုတ် ညိုမည်းလာနိုင်သည်။',
      },
      {
        title: 'ဖြူဖွေးသော မီးဖွားပြီးနောက်သွေး',
        period: 'နောက်ဆက်တွဲ သီတင်းပတ်များ',
        text: 'သွေးထွက်ခြင်းသည် တဖြည်းဖြည်း ပိုပါးလာပြီး ပမာဏလျော့နည်းလာသည်။',
      },
    ],
    infoTitle: 'အဓိကအချက်များ',
    infoText:
      'မီးဖွားပြီးနောက်သွေး၏ အရောင်နှင့် ပမာဏသည် တဖြည်းဖြည်း ပြောင်းလဲနိုင်သည်။ တိကျသော တိုးတက်မှုသည် လူတိုင်းအတွက် မတူပါ။',
    h2Section4: '4. ကိုယ့်ကိုယ်ကို ဂရုစိုက်ခြင်း',
    body4:
      'ဤကာလအတွင်း ရိုးရှင်းသော အလေ့အထအနည်းငယ်က သက်သောင့်သက်သာရှိစေရန်နှင့် ခန္ဓာကိုယ်၏ ပြန်လည်ကောင်းမွန်မှုကို ပံ့ပိုးရန် ကူညီနိုင်သည်။',
    careTips: [
      {title: 'နူးညံ့သော သန့်ရှင်းမှု', text: 'ရိုးရှင်းပြီး သက်သောင့်သက်သာရှိသော နေ့စဉ်သန့်ရှင်းမှုအလေ့အထကို ထိန်းသိမ်းပါ။'},
      {title: 'အနားယူခြင်း', text: 'သင့်ခန္ဓာကိုယ်အား ပြန်လည်ကောင်းမွန်ရန် အချိန်ပေးပါ။'},
      {title: 'ရေသောက်မှု', text: 'သင့်လိုအပ်ချက်အလိုက် ပုံမှန်ရေသောက်ရန် သတိရပါ။'},
      {title: 'အာဟာရ', text: 'ကွဲပြားစုံလင်သော အစားအစာသည် ပြန်လည်ကောင်းမွန်မှုကို ပံ့ပိုးသည်။'},
    ],
    h2Section5: '5. အကြံဉာဏ်မည်သည့်အခါ ရယူသင့်သလဲ',
    body5:
      'အချို့အခြေအနေများသည် ကျန်းမာရေးပညာရှင်၏ ချက်ချင်းအကြံဉာဏ်ကို လိုအပ်သည်၊ အထူးသဖြင့် ပြောင်းလဲမှုတစ်ခုသည် သိသာထင်ရှားခြင်း၊ ရုတ်တရက်ဖြစ်ခြင်း သို့မဟုတ် ပုံမှန်မဟုတ်ဟု ထင်ရသည့်အခါ။',
    warningTitle: 'လျစ်လျူမရှုသင့်သော လက္ခဏာများ',
    warningSubtitle: 'လိုအပ်လျှင် ပညာရှင်၏ အကြံဉာဏ်ကို ရယူပါ',
    warningSigns: [
      'သွေးထွက်ခြင်းတွင် ပြင်းထန်သော သို့မဟုတ် ပုံမှန်မဟုတ်သော အနံ့',
      'ဖျားနာခြင်း သို့မဟုတ် အလုံးစုံအခြေအနေ ဆိုးလာခြင်း',
      'သွေးထွက်ခြင်း ရုတ်တရက် အလွန်များလာခြင်း',
      'သိသာထင်ရှားသော၊ ဆက်လက်ရှိနေသော သို့မဟုတ် ပုံမှန်မဟုတ်သော နာကျင်မှု',
      'သင့်ကို စိုးရိမ်စေသော လက္ခဏာအသစ်',
    ],
    tipTitle: 'သိထားသင့်သည်',
    tipText:
      'မီးဖွားပြီးနောက် ပြန်လည်ကောင်းမွန်မှုတိုင်း ကွဲပြားသည်။ ဤဆောင်းပါးရှိ အချက်အလက်သည် ယေဘုယျလမ်းညွှန်ချက်ပေးရန် ရည်ရွယ်ပြီး ဆေးဘက်ဆိုင်ရာ ပြသမှုကို အစားထိုးခြင်း မရှိပါ။',
    summaryHeading: 'အဓိကအချက်များ',
    summary: [
      'နီဖာစ်သည် ကလေးမွေးပြီးနောက် ဘာသာရေးအကြောင်းအရာတွင် သုံးသော စကားလုံးဖြစ်သည်။',
      'ဆေးပညာအရ မီးဖွားပြီးနောက် သွေးထွက်ခြင်းကို မီးဖွားပြီးနောက်သွေးဟု ခေါ်သည်။',
      'မီးဖွားပြီးနောက်သွေးသည် အရောင်နှင့် ပမာဏ တဖြည်းဖြည်း ပြောင်းလဲသည်။',
      'အနားယူခြင်း၊ နူးညံ့သော သန့်ရှင်းမှုနှင့် ရေကောင်းစွာသောက်ခြင်းတို့သည် ပြန်လည်ကောင်းမွန်မှုကို ပံ့ပိုးသည်။',
      'ပုံမှန်မဟုတ်သော သို့မဟုတ် စိုးရိမ်ဖွယ်ပြောင်းလဲမှုသည် ပညာရှင်၏ အကြံဉာဏ်ကို လိုအပ်သည်။',
    ],
    disclaimerText:
      '၎င်းသည် အချက်အလက်ပေးရန်ဖြစ်ပြီး ဤနေရာတွင် တင်ပြထားသော ဆေးဘက်ဆိုင်ရာ အချက်အလက်သည် ယေဘုယျဖြစ်ကာ ကျန်းမာရေးပညာရှင်၏ အကြံဉာဏ်ကို အစားထိုးခြင်းမရှိပါ။ သီးခြားဘာသာရေးမေးခွန်းများအတွက် အရည်အချင်းပြည့်မီသော ဘာသာရေးရင်းမြစ်ကို ကိုးကားရန် အကြံပြုသည်။',
    shareMessage: 'နီဖာစ်- ဆေးဘက်ဆိုင်ရာ ရှုထောင့်များ — AWA',
  },
  km: {
    badge: 'ក្រោយសម្រាលកូន • និហ្វាស់',
    title: 'និហ្វាស់៖\nទិដ្ឋភាពវេជ្ជសាស្ត្រ',
    metaDuration: 'អាន 5 នាទី',
    metaType: 'មគ្គុទ្ទេសក៍',
    metaLevel: 'កម្រិតដំបូង',
    metaValidated: 'ព័ត៌មានទូទៅ',
    intro:
      'បន្ទាប់ពីសម្រាលកូន រាងកាយឆ្លងកាត់រយៈពេលនៃការជាសះស្បើយបន្តិចម្តងៗ។ ការយល់ដឹងអំពីការហូរឈាមក្រោយសម្រាល របៀបដែលវាវិវត្ត និងសញ្ញាដែលត្រូវការយកចិត្តទុកដាក់ អាចជួយឲ្យអ្នកមានព័ត៌មានគ្រប់គ្រាន់ក្នុងអំឡុងពេលនេះ។',
    contentsTitle: 'ក្នុងអត្ថបទនេះ',
    topics: [
      'ការយល់ដឹងអំពីពាក្យនិហ្វាស់',
      'លំនាំវេជ្ជសាស្ត្រក្រោយសម្រាល',
      'របៀបដែលឈាមក្រោយសម្រាលវិវត្ត',
      'ការថែរក្សាខ្លួនឯង',
      'ពេលណាត្រូវសុំដំបូន្មាន',
      'ចំណុចសំខាន់ៗ',
    ],
    h2Section1: '1. ការយល់ដឹងអំពីពាក្យ "និហ្វាស់"',
    body1a:
      'ពាក្យ "និហ្វាស់" ជាកម្មសិទ្ធិនៃវាក្យសព្ទសាសនា ហើយសំដៅលើរយៈពេលដែលទាក់ទងនឹងការហូរឈាមបន្ទាប់ពីការសម្រាលកូន ក្នុងក្របខណ្ឌនៃនីតិសាស្ត្រអ៊ីស្លាម។',
    body1b:
      'តាមវេជ្ជសាស្ត្រ ការហូរឈាមដែលសង្កេតឃើញបន្ទាប់ពីការសម្រាលកូនត្រូវបានហៅថា "ឈាមក្រោយសម្រាល"។ គំនិតទាំងពីរនេះអាចត្រូវបានពិចារណាដោយឡែកពីគ្នា៖ មួយជាកម្មសិទ្ធិនៃក្របខណ្ឌសាសនា មួយទៀតពិពណ៌នាអំពីបាតុភូតសរីរវិទ្យា។',
    distinction: {
      nifasTitle: 'និហ្វាស់',
      nifasText: 'គំនិតមួយដែលជាកម្មសិទ្ធិនៃក្របខណ្ឌសាសនាក្រោយការសម្រាលកូន។',
      lochiaTitle: 'ឈាមក្រោយសម្រាល',
      lochiaText: 'ពាក្យវេជ្ជសាស្ត្រដែលប្រើសម្រាប់ការហូរឈាមក្រោយសម្រាល។',
    },
    h2Section2: '2. លំនាំវេជ្ជសាស្ត្រក្រោយសម្រាល',
    body2:
      'ការជាសះស្បើយក្រោយសម្រាលកើតឡើងបន្តិចម្តងៗ។ ការហូរឈាមក្រោយសម្រាលជាទូទៅផ្លាស់ប្តូរតាមពេលវេលា ខណៈពេលដែលស្បូនបន្តត្រឡប់ទៅរកស្ថានភាពធម្មតារបស់វា។',
    schemaTitle: 'ដំណើរវិវត្តក្រោយសម្រាល',
    schemaSubtitle: 'ឯកសារយោងវេជ្ជសាស្ត្រដែលសម្រួល',
    stages: [
      {
        title: 'ក្រោយការសម្រាលកូន',
        subtitle: 'ការចាប់ផ្តើមនៃរយៈពេលក្រោយសម្រាល',
        text: 'រាងកាយចាប់ផ្តើមជាសះស្បើយបន្តិចម្តងៗបន្ទាប់ពីការសម្រាល។',
      },
      {
        title: 'ឈាមក្រោយសម្រាល',
        subtitle: 'ការហូរឈាមក្រោយសម្រាល',
        text: 'ការហូរឈាមផ្លាស់ប្តូរបន្តិចម្តងៗទាំងបរិមាណ និងពណ៌។',
      },
      {
        title: 'ការថយចុះបន្តិចម្តងៗ',
        subtitle: 'ក្នុងរយៈពេលជាច្រើនសប្តាហ៍',
        text: 'ការហូរឈាមជាទូទៅថយចុះតាមពេលវេលា។',
      },
      {
        title: 'ការត្រឡប់មកវិញបន្តិចម្តងៗ',
        subtitle: 'ឆ្ពោះទៅវដ្តធម្មតា',
        text: 'បន្ទាប់មក វដ្តរដូវអាចចាប់ផ្តើមឡើងវិញបន្តិចម្តងៗ។',
      },
    ],
    h2Section3: '3. របៀបដែលឈាមក្រោយសម្រាលវិវត្ត',
    body3:
      'ឈាមក្រោយសម្រាលជាទូទៅផ្លាស់ប្តូរពណ៌បន្តិចម្តងៗ ហើយថយចុះបរិមាណ។ ទោះយ៉ាងណា ដំណើរវិវត្តនេះអាចខុសគ្នាពីម្នាក់ទៅម្នាក់។',
    lochiaEvolution: [
      {
        title: 'ឈាមក្រោយសម្រាលពណ៌ក្រហម',
        period: 'ពីរបីថ្ងៃដំបូង',
        text: 'ការហូរឈាមជាធម្មតាមានពណ៌ក្រហម ហើយអាចមានច្រើនជាងនៅដើមដំបូង។',
      },
      {
        title: 'ឈាមក្រោយសម្រាលពណ៌ផ្កាឈូក / ត្នោតៗ',
        period: 'បន្ទាប់ពីប៉ុន្មានថ្ងៃ',
        text: 'ពណ៌អាចក្លាយជាស្រាលជាងមុន ឬត្នោតៗ នៅពេលបរិមាណថយចុះ។',
      },
      {
        title: 'ឈាមក្រោយសម្រាលពណ៌សៗ',
        period: 'សប្តាហ៍បន្ទាប់',
        text: 'ការហូរឈាមកាន់តែស្រាល និងមានបរិមាណតិចទៅៗ។',
      },
    ],
    infoTitle: 'ចំណុចសំខាន់ៗ',
    infoText:
      'ពណ៌ និងបរិមាណនៃឈាមក្រោយសម្រាលអាចផ្លាស់ប្តូរបន្តិចម្តងៗ។ ដំណើរវិវត្តពិតប្រាកដមិនដូចគ្នាសម្រាប់មនុស្សគ្រប់គ្នាទេ។',
    h2Section4: '4. ការថែរក្សាខ្លួនឯង',
    body4:
      'ក្នុងអំឡុងពេលនេះ ទម្លាប់សាមញ្ញៗមួយចំនួនអាចជួយឲ្យមានភាពស្រួលខ្លួន និងគាំទ្រការជាសះស្បើយរបស់រាងកាយ។',
    careTips: [
      {title: 'អនាម័យទន់ភ្លន់', text: 'រក្សាទម្លាប់អនាម័យប្រចាំថ្ងៃដ៏សាមញ្ញ និងស្រួលខ្លួន។'},
      {title: 'ការសម្រាក', text: 'ផ្តល់ពេលវេលាឲ្យរាងកាយរបស់អ្នកជាសះស្បើយ។'},
      {title: 'ការផឹកទឹក', text: 'ចងចាំផឹកទឹកជាប្រចាំតាមតម្រូវការរបស់អ្នក។'},
      {title: 'អាហារូបត្ថម្ភ', text: 'របបអាហារចម្រុះជួយគាំទ្រការជាសះស្បើយ។'},
    ],
    h2Section5: '5. ពេលណាត្រូវសុំដំបូន្មាន',
    body5:
      'ស្ថានភាពមួយចំនួនត្រូវការដំបូន្មានភ្លាមៗពីអ្នកជំនាញសុខាភិបាល ជាពិសេសនៅពេលដែលការផ្លាស់ប្តូរមើលទៅសំខាន់ ភ្លាមៗ ឬមិនធម្មតា។',
    warningTitle: 'សញ្ញាដែលមិនត្រូវមើលរំលង',
    warningSubtitle: 'សុំដំបូន្មានពីអ្នកជំនាញ ប្រសិនបើចាំបាច់',
    warningSigns: [
      'ក្លិនខ្លាំង ឬមិនធម្មតាក្នុងការហូរឈាម',
      'គ្រុនក្តៅ ឬស្ថានភាពទូទៅកាន់តែអាក្រក់',
      'ការហូរឈាមដែលស្រាប់តែច្រើនខ្លាំង',
      'ការឈឺចាប់ខ្លាំង បន្តយូរ ឬមិនធម្មតា',
      'រោគសញ្ញាថ្មីដែលធ្វើឲ្យអ្នកព្រួយបារម្ភ',
    ],
    tipTitle: 'គួរដឹង',
    tipText:
      'ការជាសះស្បើយក្រោយសម្រាលរបស់មនុស្សម្នាក់ៗខុសគ្នា។ ព័ត៌មានក្នុងអត្ថបទនេះមានគោលបំណងផ្តល់ការណែនាំទូទៅ ហើយមិនជំនួសការពិគ្រោះជាមួយវេជ្ជបណ្ឌិតឡើយ។',
    summaryHeading: 'ចំណុចសំខាន់ៗ',
    summary: [
      'និហ្វាស់ជាពាក្យដែលប្រើក្នុងបរិបទសាសនាក្រោយការសម្រាលកូន។',
      'តាមវេជ្ជសាស្ត្រ ការហូរឈាមក្រោយសម្រាលត្រូវបានហៅថាឈាមក្រោយសម្រាល។',
      'ឈាមក្រោយសម្រាលផ្លាស់ប្តូរពណ៌ និងបរិមាណបន្តិចម្តងៗ។',
      'ការសម្រាក អនាម័យទន់ភ្លន់ និងការផឹកទឹកឲ្យបានល្អ ជួយគាំទ្រការជាសះស្បើយ។',
      'ការផ្លាស់ប្តូរមិនធម្មតា ឬគួរឲ្យព្រួយបារម្ភ សមនឹងទទួលបានដំបូន្មានពីអ្នកជំនាញ។',
    ],
    disclaimerText:
      'នេះជាព័ត៌មានទូទៅ ហើយមិនជំនួសដំបូន្មានពីវេជ្ជបណ្ឌិតទេ។ ព័ត៌មានវេជ្ជសាស្ត្រដែលបង្ហាញនៅទីនេះមានលក្ខណៈទូទៅ ហើយមិនជំនួសដំបូន្មានរបស់អ្នកជំនាញសុខាភិបាលឡើយ។ សម្រាប់សំណួរខាងសាសនាជាក់លាក់ ត្រូវបានណែនាំឲ្យយោងទៅប្រភពសាសនាដែលមានសមត្ថភាព។',
    shareMessage: 'និហ្វាស់៖ ទិដ្ឋភាពវេជ្ជសាស្ត្រ — AWA',
  },
  lo: {
    badge: 'ຫຼັງຄອດ • ນີຟາດ',
    title: 'ນີຟາດ:\nດ້ານການແພດ',
    metaDuration: 'ອ່ານ 5 ນາທີ',
    metaType: 'ຄູ່ມື',
    metaLevel: 'ລະດັບເລີ່ມຕົ້ນ',
    metaValidated: 'ນີ້ແມ່ນຂໍ້ມູນທົ່ວໄປ ແລະ ບໍ່ແທນຄຳແນະນຳຂອງແພດ.',
    intro:
      'ຫຼັງຈາກເກີດລູກ, ຮ່າງກາຍຈະຜ່ານໄລຍະການຟື້ນຕົວຢ່າງຄ່ອຍເປັນຄ່ອຍໄປ. ການເຂົ້າໃຈເລືອດຫຼັງຄອດ, ວິວັດທະນາການຂອງມັນ ແລະ ສັນຍານທີ່ຕ້ອງເອົາໃຈໃສ່ ສາມາດຊ່ວຍໃຫ້ທ່ານຮູ້ສຶກມີຂໍ້ມູນຫຼາຍຂຶ້ນໃນໄລຍະນີ້.',
    contentsTitle: 'ໃນບົດຄວາມນີ້',
    topics: [
      'ເຂົ້າໃຈຄຳວ່າ ນີຟາດ',
      'ແບບແຜນທາງການແພດຫຼັງການເກີດລູກ',
      'ເລືອດຫຼັງຄອດປ່ຽນແປງແນວໃດ',
      'ການດູແລຕົນເອງ',
      'ເມື່ອໃດຄວນຂໍຄຳແນະນຳ',
      'ຈຸດສຳຄັນ',
    ],
    h2Section1: '1. ເຂົ້າໃຈຄຳວ່າ "ນີຟາດ"',
    body1a:
      'ຄຳວ່າ "ນີຟາດ" ເປັນສັບທາງສາສະໜາ ແລະ ໝາຍເຖິງໄລຍະທີ່ກ່ຽວຂ້ອງກັບເລືອດທີ່ອອກຫຼັງການເກີດລູກ ພາຍໃຕ້ກົດຂອງນິຕິສາດອິດສະລາມ.',
    body1b:
      'ທາງການແພດ, ເລືອດທີ່ອອກຫຼັງການເກີດລູກເອີ້ນວ່າ "ເລືອດຫຼັງຄອດ." ສອງແນວຄິດນີ້ສາມາດພິຈາລະນາແຍກກັນໄດ້: ອັນໜຶ່ງຢູ່ໃນກອບທາງສາສະໜາ, ອີກອັນໜຶ່ງອະທິບາຍປະກົດການທາງສະລີລະວິທະຍາ.',
    distinction: {
      nifasTitle: 'ນີຟາດ',
      nifasText: 'ແນວຄິດທີ່ຢູ່ໃນກອບທາງສາສະໜາຫຼັງການເກີດລູກ.',
      lochiaTitle: 'ເລືອດຫຼັງຄອດ',
      lochiaText: 'ສັບທາງການແພດທີ່ໃຊ້ສຳລັບເລືອດທີ່ອອກຫຼັງຄອດ.',
    },
    h2Section2: '2. ແບບແຜນທາງການແພດຫຼັງການເກີດລູກ',
    body2:
      'ການຟື້ນຕົວຫຼັງຄອດເກີດຂຶ້ນຢ່າງຄ່ອຍເປັນຄ່ອຍໄປ. ເລືອດຫຼັງຄອດໂດຍທົ່ວໄປປ່ຽນແປງຕາມເວລາ ຂະນະທີ່ມົດລູກສືບຕໍ່ກັບຄືນສູ່ສະພາບປົກກະຕິ.',
    schemaTitle: 'ວິວັດທະນາການຫຼັງຄອດ',
    schemaSubtitle: 'ຂໍ້ມູນອ້າງອີງທາງການແພດແບບງ່າຍ',
    stages: [
      {
        title: 'ຫຼັງການເກີດລູກ',
        subtitle: 'ການເລີ່ມຕົ້ນຂອງໄລຍະຫຼັງຄອດ',
        text: 'ຮ່າງກາຍຄ່ອຍໆເລີ່ມການຟື້ນຕົວຫຼັງການເກີດລູກ.',
      },
      {
        title: 'ເລືອດຫຼັງຄອດ',
        subtitle: 'ເລືອດທີ່ອອກຫຼັງຄອດ',
        text: 'ເລືອດຄ່ອຍໆປ່ຽນແປງທັງປະລິມານ ແລະ ສີ.',
      },
      {
        title: 'ຄ່ອຍໆຫຼຸດລົງ',
        subtitle: 'ໃນຫຼາຍອາທິດ',
        text: 'ເລືອດໂດຍທົ່ວໄປຫຼຸດລົງຕາມເວລາ.',
      },
      {
        title: 'ຄ່ອຍໆກັບຄືນ',
        subtitle: 'ສູ່ຮອບເດືອນປົກກະຕິ',
        text: 'ຈາກນັ້ນຮອບເດືອນອາດຄ່ອຍໆກັບມາ.',
      },
    ],
    h2Section3: '3. ເລືອດຫຼັງຄອດປ່ຽນແປງແນວໃດ',
    body3:
      'ເລືອດຫຼັງຄອດໂດຍທົ່ວໄປຄ່ອຍໆປ່ຽນສີ ແລະ ປະລິມານຫຼຸດລົງ. ຢ່າງໃດກໍຕາມ, ວິວັດທະນາການນີ້ອາດແຕກຕ່າງກັນໃນແຕ່ລະຄົນ.',
    lochiaEvolution: [
      {
        title: 'ເລືອດຫຼັງຄອດສີແດງ',
        period: 'ສອງສາມມື້ທຳອິດ',
        text: 'ເລືອດໂດຍປົກກະຕິເປັນສີແດງ ແລະ ອາດອອກຫຼາຍກວ່າໃນຕອນເລີ່ມຕົ້ນ.',
      },
      {
        title: 'ເລືອດຫຼັງຄອດສີບົວ / ສີນ້ຳຕານ',
        period: 'ຫຼັງຈາກສອງສາມມື້',
        text: 'ສີອາດຈາງລົງ ຫຼື ເປັນສີນ້ຳຕານເມື່ອປະລິມານຫຼຸດລົງ.',
      },
      {
        title: 'ເລືອດຫຼັງຄອດສີຂາວອົມເຫຼືອງ',
        period: 'ສອງສາມອາທິດຕໍ່ມາ',
        text: 'ເລືອດຄ່ອຍໆຈາງລົງ ແລະ ອອກໜ້ອຍລົງ.',
      },
    ],
    infoTitle: 'ຈຸດສຳຄັນ',
    infoText:
      'ສີ ແລະ ປະລິມານຂອງເລືອດຫຼັງຄອດສາມາດປ່ຽນແປງຢ່າງຄ່ອຍເປັນຄ່ອຍໄປ. ວິວັດທະນາການທີ່ແນ່ນອນບໍ່ຄືກັນໃນທຸກຄົນ.',
    h2Section4: '4. ການດູແລຕົນເອງ',
    body4:
      'ໃນໄລຍະນີ້, ນິໄສງ່າຍໆສອງສາມຢ່າງສາມາດຊ່ວຍໃຫ້ຮູ້ສຶກສະບາຍ ແລະ ສະໜັບສະໜູນການຟື້ນຕົວຂອງຮ່າງກາຍ.',
    careTips: [
      {title: 'ອະນາໄມແບບອ່ອນໂຍນ', text: 'ຮັກສາການອະນາໄມປະຈຳວັນໃຫ້ງ່າຍ ແລະ ສະບາຍ.'},
      {title: 'ການພັກຜ່ອນ', text: 'ໃຫ້ເວລາຮ່າງກາຍໄດ້ຟື້ນຕົວ.'},
      {title: 'ການດື່ມນ້ຳ', text: 'ຢ່າລືມດື່ມນ້ຳເປັນປະຈຳຕາມຄວາມຕ້ອງການຂອງທ່ານ.'},
      {title: 'ໂພຊະນາການ', text: 'ອາຫານທີ່ຫຼາກຫຼາຍຊ່ວຍສະໜັບສະໜູນການຟື້ນຕົວ.'},
    ],
    h2Section5: '5. ເມື່ອໃດຄວນຂໍຄຳແນະນຳ',
    body5:
      'ບາງສະຖານະການຕ້ອງການຄຳແນະນຳຈາກຜູ້ຊ່ຽວຊານດ້ານສຸຂະພາບໂດຍໄວ, ໂດຍສະເພາະເມື່ອການປ່ຽນແປງເບິ່ງຄືວ່າຮຸນແຮງ, ກະທັນຫັນ ຫຼື ຜິດປົກກະຕິ.',
    warningTitle: 'ສັນຍານທີ່ບໍ່ຄວນເມີນເສີຍ',
    warningSubtitle: 'ຂໍຄຳແນະນຳຈາກຜູ້ຊ່ຽວຊານຖ້າຈຳເປັນ',
    warningSigns: [
      'ກິ່ນແຮງ ຫຼື ຜິດປົກກະຕິຈາກເລືອດທີ່ອອກ',
      'ມີໄຂ້ ຫຼື ອາການທົ່ວໄປຮ້າຍແຮງຂຶ້ນ',
      'ເລືອດອອກຫຼາຍຂຶ້ນຢ່າງກະທັນຫັນ',
      'ອາການເຈັບທີ່ຮຸນແຮງ, ຕໍ່ເນື່ອງ ຫຼື ຜິດປົກກະຕິ',
      'ອາການໃໝ່ທີ່ເຮັດໃຫ້ທ່ານກັງວົນ',
    ],
    tipTitle: 'ຄວນຮູ້',
    tipText:
      'ການຟື້ນຕົວຫຼັງຄອດຂອງແຕ່ລະຄົນແຕກຕ່າງກັນ. ຂໍ້ມູນໃນບົດຄວາມນີ້ມີຈຸດປະສົງເພື່ອໃຫ້ແນວທາງທົ່ວໄປ ແລະ ບໍ່ແທນການປຶກສາແພດ.',
    summaryHeading: 'ຈຸດສຳຄັນ',
    summary: [
      'ນີຟາດເປັນຄຳທີ່ໃຊ້ໃນບໍລິບົດທາງສາສະໜາຫຼັງການເກີດລູກ.',
      'ທາງການແພດ, ເລືອດທີ່ອອກຫຼັງຄອດເອີ້ນວ່າເລືອດຫຼັງຄອດ.',
      'ເລືອດຫຼັງຄອດຄ່ອຍໆປ່ຽນສີ ແລະ ປະລິມານ.',
      'ການພັກຜ່ອນ, ການອະນາໄມແບບອ່ອນໂຍນ ແລະ ການດື່ມນ້ຳທີ່ດີຊ່ວຍສະໜັບສະໜູນການຟື້ນຕົວ.',
      'ການປ່ຽນແປງທີ່ຜິດປົກກະຕິ ຫຼື ໜ້າກັງວົນຄວນໄດ້ຮັບຄຳແນະນຳຈາກຜູ້ຊ່ຽວຊານ.',
    ],
    disclaimerText:
      'ນີ້ແມ່ນຂໍ້ມູນທົ່ວໄປ ແລະ ບໍ່ແທນຄຳແນະນຳຂອງແພດ. ຂໍ້ມູນທາງການແພດທີ່ນຳສະເໜີທີ່ນີ້ເປັນຂໍ້ມູນທົ່ວໄປ ແລະ ບໍ່ແທນຄຳແນະນຳຂອງຜູ້ຊ່ຽວຊານດ້ານສຸຂະພາບ. ສຳລັບຄຳຖາມທາງສາສະໜາສະເພາະ, ແນະນຳໃຫ້ອ້າງອີງແຫຼ່ງທາງສາສະໜາທີ່ມີຄຸນວຸດທິ.',
    shareMessage: 'ນີຟາດ: ດ້ານການແພດ — AWA',
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
