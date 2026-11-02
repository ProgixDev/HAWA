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

const ID = 'sideeffects-reconnaitre-les-effets-secondaires';

const HERO = require('../../assets/images/library/featured-pain.png');

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const COMMON_EFFECT_ICONS = [
  'water-outline',
  'heart-outline',
  'emoticon-outline',
  'head-outline',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('SideEffects', {
  fr: {
    badge: 'EFFETS SECONDAIRES',
    title: 'Reconnaître les effets\nsecondaires possibles',
    metaDuration: '8 min de lecture',
    metaType: 'Article',
    metaLevel: 'Intermédiaire',
    metaValidated: 'Contenu validé',
    intro:
      'Certains effets peuvent être fréquents et temporaires. D’autres nécessitent davantage d’attention. Apprends à distinguer les réactions habituelles des signes qui doivent être évalués.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Des effets courants et bénins',
      'Le temps d’adaptation du corps',
      'Observer ce qui change',
      'Quand demander un avis médical',
      'Quand consulter rapidement',
      'À retenir',
    ],
    body1:
      'Lorsqu’une personne commence une nouvelle contraception hormonale, le corps peut avoir besoin d’un temps d’adaptation. De petits changements peuvent apparaître au niveau du cycle, de l’humeur ou du confort physique.',
    body2:
      'Ces manifestations sont souvent modérées et peuvent diminuer progressivement. Leur présence ne signifie pas automatiquement que la méthode est dangereuse ou qu’elle doit être arrêtée.',
    commonEffects: [
      {
        title: 'Petits saignements',
        text: 'Des saignements irréguliers peuvent apparaître, notamment au début d’une nouvelle méthode.',
      },
      {
        title: 'Sensibilité des seins',
        text: 'Une tension ou une sensibilité des seins peut être ressentie temporairement.',
      },
      {
        title: 'Humeur',
        text: 'Certaines personnes remarquent des variations d’humeur ou une plus grande sensibilité émotionnelle.',
      },
      {
        title: 'Maux de tête',
        text: 'De légers maux de tête peuvent survenir pendant la période d’adaptation.',
      },
    ],
    body3:
      'Les premières semaines ou les premiers cycles peuvent être différents de ce que tu connaissais auparavant. Le corps peut progressivement s’adapter au nouveau fonctionnement hormonal.',
    tip1Title: 'Bon à savoir',
    tip1Text:
      'Un effet apparu peu après le début d’une méthode mérite d’être observé dans le temps. S’il devient gênant ou persiste, parle-en avec un professionnel de santé.',
    body4:
      'Il peut être utile de noter les symptômes dans ton application afin de mieux voir leur évolution d’un cycle à l’autre.',
    trackingTitle: 'Observe l’évolution',
    trackingSubtitle: 'Quelques repères peuvent être utiles',
    trackingLines: [
      'Note la date d’apparition du symptôme.',
      'Indique son intensité et sa durée.',
      'Observe s’il s’améliore ou s’aggrave.',
    ],
    body5:
      'Tous les symptômes ne sont pas forcément liés à la contraception. Le stress, le sommeil, l’alimentation, le cycle ou d’autres traitements peuvent également influencer la façon dont tu te sens.',
    body6:
      'Pour comprendre la situation, essaie de regarder le contexte général plutôt que de considérer un symptôme isolé.',
    worthMentioning: [
      'Des changements d’humeur marqués et persistants',
      'Une baisse de libido qui te gêne',
      'Des saignements irréguliers qui durent plus de 3 cycles',
      'Des nausées ou maux de tête qui restent gênants',
    ],
    questionsTitle: 'Quelques questions utiles',
    questions: [
      'Depuis quand ces symptômes ont-ils commencé ?',
      'Sont-ils apparus après le début ou le changement d’une contraception ?',
      'Sont-ils légers, gênants ou vraiment inhabituels pour toi ?',
      'S’améliorent-ils avec le temps ou deviennent-ils plus fréquents ?',
    ],
    body7:
      'Même lorsqu’un symptôme n’est pas urgent, il peut être utile d’en parler si celui-ci devient gênant, persiste ou modifie réellement ta qualité de vie.',
    infoTitle: 'Un avis peut être utile si…',
    infoText:
      'les symptômes persistent, deviennent plus importants ou t’empêchent de vivre normalement.',
    body8:
      'Un médecin, une sage-femme ou un pharmacien peut t’aider à déterminer si les symptômes peuvent être liés à la méthode utilisée et s’il est nécessaire de l’adapter.',
    body9:
      'Certains signes sont inhabituels et nécessitent une évaluation médicale rapide. Ils ne signifient pas forcément qu’une complication est présente, mais ils ne doivent pas être ignorés.',
    alertTitle: 'Consulter rapidement',
    alertIntro: 'Demande rapidement un avis médical si tu présentes notamment :',
    urgentSigns: [
      'Douleur thoracique importante ou inhabituelle',
      'Difficulté soudaine à respirer',
      'Gonflement ou douleur inhabituelle d’une jambe',
      'Mal de tête brutal, très intense ou inhabituel',
      'Trouble soudain de la vision, de la parole ou de la force',
    ],
    emergencyTitle: 'En cas de situation sévère',
    emergencyText:
      'Si les symptômes sont soudains, très importants ou s’accompagnent d’une difficulté à respirer, d’un malaise ou d’un autre signe grave, recherche une aide médicale urgente.',
    summaryTitle: 'L’essentiel',
    summaryItems: [
      'Certains effets peuvent apparaître au début d’une nouvelle contraception hormonale.',
      'Beaucoup de manifestations sont temporaires et peuvent diminuer avec le temps.',
      'Un symptôme gênant ou persistant mérite d’être discuté avec un professionnel.',
      'Certains signes inhabituels nécessitent un avis médical rapide.',
    ],
    finalTipTitle: 'À retenir',
    finalTipText:
      'Écouter ton corps ne signifie pas forcément arrêter immédiatement une méthode. Note ce que tu ressens, observe son évolution et demande conseil lorsqu’un symptôme te préoccupe.',
    disclaimerText:
      'Cet article a une vocation informative et ne remplace pas un avis médical personnalisé. En cas de symptôme important ou inhabituel, demande conseil à un professionnel de santé.',
    shareMessage: 'Reconnaître les effets secondaires possibles — AWA',
  },
  en: {
    badge: 'SIDE EFFECTS',
    title: 'Recognizing possible\nside effects',
    metaDuration: '8 min read',
    metaType: 'Article',
    metaLevel: 'Intermediate',
    metaValidated: 'Reviewed content',
    intro:
      'Some effects can be common and temporary. Others need more attention. Learn to tell the difference between usual reactions and signs that should be evaluated.',
    contentsTitle: 'In this article',
    topics: [
      'Common, mild effects',
      'The body’s adjustment period',
      'Observing what changes',
      'When to seek medical advice',
      'When to seek care quickly',
      'Key takeaways',
    ],
    body1:
      'When someone starts a new hormonal contraception method, the body may need some time to adjust. Small changes can appear in the cycle, mood, or physical comfort.',
    body2:
      'These effects are often mild and may gradually decrease. Their presence doesn’t automatically mean the method is dangerous or that it needs to be stopped.',
    commonEffects: [
      {
        title: 'Minor bleeding',
        text: 'Irregular bleeding can occur, especially at the start of a new method.',
      },
      {
        title: 'Breast tenderness',
        text: 'Breast tightness or tenderness may be felt temporarily.',
      },
      {
        title: 'Mood',
        text: 'Some people notice mood changes or increased emotional sensitivity.',
      },
      {
        title: 'Headaches',
        text: 'Mild headaches can occur during the adjustment period.',
      },
    ],
    body3:
      'The first few weeks or cycles may be different from what you were used to before. The body can gradually adjust to the new hormonal balance.',
    tip1Title: 'Good to know',
    tip1Text:
      'An effect that appears shortly after starting a method is worth watching over time. If it becomes bothersome or persists, talk to a healthcare professional.',
    body4:
      'It can be helpful to log symptoms in your app to better track how they change from one cycle to the next.',
    trackingTitle: 'Track how things evolve',
    trackingSubtitle: 'A few markers can be helpful',
    trackingLines: [
      'Note the date the symptom appeared.',
      'Record its intensity and duration.',
      'Watch whether it improves or worsens.',
    ],
    body5:
      'Not all symptoms are necessarily linked to contraception. Stress, sleep, diet, your cycle, or other treatments can also affect how you feel.',
    body6:
      'To understand the situation, try to look at the overall context rather than a single symptom in isolation.',
    worthMentioning: [
      'Marked, persistent mood changes',
      'A drop in libido that bothers you',
      'Irregular bleeding that lasts more than 3 cycles',
      'Nausea or headaches that remain bothersome',
    ],
    questionsTitle: 'A few helpful questions',
    questions: [
      'How long have these symptoms been going on?',
      'Did they appear after starting or changing a contraception method?',
      'Are they mild, bothersome, or truly unusual for you?',
      'Are they improving over time or becoming more frequent?',
    ],
    body7:
      'Even when a symptom isn’t urgent, it can be worth discussing it if it becomes bothersome, persists, or genuinely affects your quality of life.',
    infoTitle: 'It may be worth getting advice if…',
    infoText:
      'symptoms persist, become more significant, or keep you from living normally.',
    body8:
      'A doctor, midwife, or pharmacist can help you determine whether the symptoms may be linked to the method you’re using and whether it needs to be adjusted.',
    body9:
      'Some signs are unusual and call for prompt medical evaluation. They don’t necessarily mean a complication is present, but they should not be ignored.',
    alertTitle: 'Seek care quickly',
    alertIntro: 'Seek medical advice quickly if you experience, in particular:',
    urgentSigns: [
      'Significant or unusual chest pain',
      'Sudden difficulty breathing',
      'Unusual swelling or pain in a leg',
      'A sudden, very intense, or unusual headache',
      'Sudden trouble with vision, speech, or strength',
    ],
    emergencyTitle: 'In case of a severe situation',
    emergencyText:
      'If symptoms are sudden, very severe, or come with difficulty breathing, feeling faint, or another serious sign, seek urgent medical help.',
    summaryTitle: 'The essentials',
    summaryItems: [
      'Some effects can appear at the start of a new hormonal contraception method.',
      'Many effects are temporary and may decrease over time.',
      'A bothersome or persistent symptom is worth discussing with a professional.',
      'Some unusual signs require prompt medical advice.',
    ],
    finalTipTitle: 'Key takeaway',
    finalTipText:
      'Listening to your body doesn’t necessarily mean stopping a method right away. Note what you’re feeling, watch how it evolves, and ask for advice whenever a symptom concerns you.',
    disclaimerText:
      'This article is intended for information purposes and does not replace personalized medical advice. If you have a significant or unusual symptom, seek advice from a healthcare professional.',
    shareMessage: 'Recognizing possible side effects — AWA',
  },
  es: {
    badge: 'EFECTOS SECUNDARIOS',
    title: 'Reconoce los posibles\nefectos secundarios',
    metaDuration: '8 min de lectura',
    metaType: 'Artículo',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenido validado',
    intro:
      'Algunos efectos pueden ser frecuentes y temporales. Otros requieren más atención. Aprende a distinguir las reacciones habituales de los signos que deben evaluarse.',
    contentsTitle: 'En este artículo',
    topics: [
      'Efectos frecuentes y leves',
      'El tiempo de adaptación del cuerpo',
      'Observar lo que cambia',
      'Cuándo pedir un consejo médico',
      'Cuándo consultar rápidamente',
      'Lo esencial',
    ],
    body1:
      'Cuando una persona empieza una nueva anticoncepción hormonal, el cuerpo puede necesitar un tiempo de adaptación. Pueden aparecer pequeños cambios en el ciclo, el estado de ánimo o el confort físico.',
    body2:
      'Estas manifestaciones suelen ser moderadas y pueden disminuir progresivamente. Su presencia no significa automáticamente que el método sea peligroso o que deba interrumpirse.',
    commonEffects: [
      {
        title: 'Pequeños sangrados',
        text: 'Pueden aparecer sangrados irregulares, especialmente al inicio de un nuevo método.',
      },
      {
        title: 'Sensibilidad en los senos',
        text: 'Puede sentirse tensión o sensibilidad en los senos de forma temporal.',
      },
      {
        title: 'Estado de ánimo',
        text: 'Algunas personas notan variaciones del estado de ánimo o una mayor sensibilidad emocional.',
      },
      {
        title: 'Dolores de cabeza',
        text: 'Pueden surgir ligeros dolores de cabeza durante el período de adaptación.',
      },
    ],
    body3:
      'Las primeras semanas o los primeros ciclos pueden ser diferentes de lo que conocías antes. El cuerpo puede adaptarse progresivamente al nuevo funcionamiento hormonal.',
    tip1Title: 'DATO ÚTIL',
    tip1Text:
      'Un efecto que aparece poco después de empezar un método merece observarse con el tiempo. Si se vuelve molesto o persiste, habla con un profesional de la salud.',
    body4:
      'Puede ser útil anotar los síntomas en tu aplicación para ver mejor su evolución de un ciclo a otro.',
    trackingTitle: 'Observa la evolución',
    trackingSubtitle: 'Algunas referencias pueden ser útiles',
    trackingLines: [
      'Anota la fecha de aparición del síntoma.',
      'Indica su intensidad y su duración.',
      'Observa si mejora o empeora.',
    ],
    body5:
      'No todos los síntomas están necesariamente relacionados con la anticoncepción. El estrés, el sueño, la alimentación, el ciclo u otros tratamientos también pueden influir en cómo te sientes.',
    body6:
      'Para entender la situación, intenta fijarte en el contexto general en lugar de considerar un síntoma aislado.',
    worthMentioning: [
      'Cambios de humor marcados y persistentes',
      'Una disminución de la libido que te molesta',
      'Sangrados irregulares que duran más de 3 ciclos',
      'Náuseas o dolores de cabeza que siguen siendo molestos',
    ],
    questionsTitle: 'Algunas preguntas útiles',
    questions: [
      '¿Desde cuándo comenzaron estos síntomas?',
      '¿Aparecieron después de empezar o cambiar de anticoncepción?',
      '¿Son leves, molestos o realmente inusuales para ti?',
      '¿Mejoran con el tiempo o se vuelven más frecuentes?',
    ],
    body7:
      'Incluso cuando un síntoma no es urgente, puede ser útil hablar de él si se vuelve molesto, persiste o modifica realmente tu calidad de vida.',
    infoTitle: 'Puede ser útil pedir consejo si…',
    infoText:
      'los síntomas persisten, se vuelven más importantes o te impiden vivir con normalidad.',
    body8:
      'Un médico, una matrona o un farmacéutico puede ayudarte a determinar si los síntomas pueden estar relacionados con el método utilizado y si es necesario adaptarlo.',
    body9:
      'Algunos signos son inusuales y requieren una evaluación médica rápida. No significan necesariamente que haya una complicación, pero no deben ignorarse.',
    alertTitle: 'Consultar rápidamente',
    alertIntro: 'Pide rápidamente un consejo médico si presentas, en particular:',
    urgentSigns: [
      'Dolor torácico importante o inusual',
      'Dificultad repentina para respirar',
      'Hinchazón o dolor inusual en una pierna',
      'Dolor de cabeza brusco, muy intenso o inusual',
      'Trastorno repentino de la visión, del habla o de la fuerza',
    ],
    emergencyTitle: 'En caso de situación grave',
    emergencyText:
      'Si los síntomas son repentinos, muy importantes o se acompañan de dificultad para respirar, malestar u otro signo grave, busca ayuda médica urgente.',
    summaryTitle: 'Lo esencial',
    summaryItems: [
      'Algunos efectos pueden aparecer al inicio de una nueva anticoncepción hormonal.',
      'Muchas manifestaciones son temporales y pueden disminuir con el tiempo.',
      'Un síntoma molesto o persistente merece hablarse con un profesional.',
      'Algunos signos inusuales requieren un consejo médico rápido.',
    ],
    finalTipTitle: 'Para recordar',
    finalTipText:
      'Escuchar tu cuerpo no significa necesariamente dejar un método de inmediato. Anota lo que sientes, observa su evolución y pide consejo cuando un síntoma te preocupe.',
    disclaimerText:
      'Este artículo tiene una finalidad informativa y no sustituye un consejo médico personalizado. En caso de síntoma importante o inusual, pide consejo a un profesional de la salud.',
    shareMessage: 'Reconoce los posibles efectos secundarios — AWA',
  },
  it: {
    badge: 'EFFETTI COLLATERALI',
    title: 'Riconoscere i possibili\neffetti collaterali',
    metaDuration: '8 min di lettura',
    metaType: 'Articolo',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenuto validato',
    intro: 'Alcuni effetti possono essere comuni e temporanei. Altri richiedono maggiore attenzione. Impara a distinguere tra le reazioni abituali e i segnali che vanno valutati.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Effetti comuni e lievi',
      'Il periodo di adattamento del corpo',
      'Osservare ciò che cambia',
      'Quando chiedere un parere medico',
      'Quando rivolgersi rapidamente a un medico',
      'I punti essenziali',
    ],
    body1: 'Quando si inizia un nuovo metodo di contraccezione ormonale, il corpo può aver bisogno di un po’ di tempo per adattarsi. Possono comparire piccoli cambiamenti nel ciclo, nell’umore o nel benessere fisico.',
    body2: 'Questi effetti sono spesso lievi e possono diminuire gradualmente. La loro presenza non significa automaticamente che il metodo sia pericoloso o che vada interrotto.',
    commonEffects: [
      {
        title: 'Piccoli sanguinamenti',
        text: 'Possono verificarsi sanguinamenti irregolari, soprattutto all’inizio di un nuovo metodo.',
      },
      {
        title: 'Tensione al seno',
        text: 'Si può avvertire temporaneamente un senso di tensione o di dolorabilità al seno.',
      },
      {
        title: 'Umore',
        text: 'Alcune persone notano cambiamenti dell’umore o una maggiore sensibilità emotiva.',
      },
      {
        title: 'Mal di testa',
        text: 'Possono comparire lievi mal di testa durante il periodo di adattamento.',
      },
    ],
    body3: 'Le prime settimane o i primi cicli possono essere diversi da quelli a cui eri abituata prima. Il corpo può adattarsi gradualmente al nuovo equilibrio ormonale.',
    tip1Title: 'Da sapere',
    tip1Text: 'Un effetto che compare poco dopo l’inizio di un metodo merita di essere osservato nel tempo. Se diventa fastidioso o persiste, parlane con un professionista sanitario.',
    body4: 'Può essere utile annotare i sintomi nella tua app per seguire meglio come cambiano da un ciclo all’altro.',
    trackingTitle: 'Segui l’evoluzione',
    trackingSubtitle: 'Alcuni punti di riferimento possono essere utili',
    trackingLines: [
      'Annota la data in cui è comparso il sintomo.',
      'Registra la sua intensità e la sua durata.',
      'Osserva se migliora o peggiora.',
    ],
    body5: 'Non tutti i sintomi sono necessariamente legati alla contraccezione. Anche lo stress, il sonno, l’alimentazione, il tuo ciclo o altre terapie possono influire su come ti senti.',
    body6: 'Per capire la situazione, prova a guardare il contesto generale anziché un singolo sintomo preso isolatamente.',
    worthMentioning: [
      'Cambiamenti dell’umore marcati e persistenti',
      'Un calo della libido che ti dà fastidio',
      'Sanguinamenti irregolari che durano più di 3 cicli',
      'Nausea o mal di testa che restano fastidiosi',
    ],
    questionsTitle: 'Alcune domande utili',
    questions: [
      'Da quanto tempo durano questi sintomi?',
      'Sono comparsi dopo aver iniziato o cambiato un metodo contraccettivo?',
      'Sono lievi, fastidiosi o davvero insoliti per te?',
      'Stanno migliorando nel tempo o diventano più frequenti?',
    ],
    body7: 'Anche quando un sintomo non è urgente, può valere la pena parlarne se diventa fastidioso, persiste o incide davvero sulla tua qualità di vita.',
    infoTitle: 'Può essere utile chiedere un parere se…',
    infoText: 'i sintomi persistono, diventano più importanti o ti impediscono di vivere normalmente.',
    body8: 'Un medico, un’ostetrica o un farmacista può aiutarti a capire se i sintomi possono essere legati al metodo che usi e se è necessario modificarlo.',
    body9: 'Alcuni segnali sono insoliti e richiedono una valutazione medica tempestiva. Non significano necessariamente che sia presente una complicanza, ma non vanno ignorati.',
    alertTitle: 'Rivolgiti rapidamente a un medico',
    alertIntro: 'Chiedi rapidamente un parere medico se hai, in particolare:',
    urgentSigns: [
      'Dolore al petto importante o insolito',
      'Difficoltà respiratoria improvvisa',
      'Gonfiore o dolore insolito a una gamba',
      'Un mal di testa improvviso, molto intenso o insolito',
      'Difficoltà improvvise nella vista, nel linguaggio o nella forza',
    ],
    emergencyTitle: 'In caso di situazione grave',
    emergencyText: 'Se i sintomi sono improvvisi, molto gravi o accompagnati da difficoltà respiratoria, sensazione di svenimento o un altro segno serio, chiedi subito aiuto medico urgente.',
    summaryTitle: 'L’essenziale',
    summaryItems: [
      'Alcuni effetti possono comparire all’inizio di un nuovo metodo di contraccezione ormonale.',
      'Molti effetti sono temporanei e possono diminuire nel tempo.',
      'Un sintomo fastidioso o persistente merita di essere discusso con un professionista.',
      'Alcuni segnali insoliti richiedono un parere medico tempestivo.',
    ],
    finalTipTitle: 'Da ricordare',
    finalTipText: 'Ascoltare il tuo corpo non significa necessariamente interrompere subito un metodo. Annota ciò che senti, osserva come evolve e chiedi consiglio ogni volta che un sintomo ti preoccupa.',
    disclaimerText: 'Questo articolo ha scopo informativo e non sostituisce un parere medico personalizzato. Se hai un sintomo importante o insolito, rivolgiti a un professionista sanitario.',
    shareMessage: 'Riconoscere i possibili effetti collaterali — AWA',
  },
  tr: {
    badge: 'YAN ETKİLER',
    title: 'Olası yan etkileri\ntanımak',
    metaDuration: '8 dk okuma',
    metaType: 'Makale',
    metaLevel: 'Orta düzey',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Bazı etkiler yaygın ve geçici olabilir. Bazıları ise daha fazla dikkat gerektirir. Olağan tepkilerle değerlendirilmesi gereken belirtiler arasındaki farkı ayırt etmeyi öğren.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Yaygın, hafif etkiler',
      'Bedenin uyum süreci',
      'Nelerin değiştiğini gözlemlemek',
      'Ne zaman tıbbi tavsiye almalı?',
      'Ne zaman hızlıca yardım istemeli?',
      'Akılda kalacaklar',
    ],
    body1: 'Biri yeni bir hormonal doğum kontrol yöntemine başladığında, bedenin uyum sağlamak için biraz zamana ihtiyacı olabilir. Döngüde, ruh halinde ya da bedensel konforda küçük değişimler ortaya çıkabilir.',
    body2: 'Bu etkiler çoğu zaman hafiftir ve zamanla azalabilir. Varlıkları, yöntemin tehlikeli olduğu ya da bırakılması gerektiği anlamına otomatik olarak gelmez.',
    commonEffects: [
      {
        title: 'Hafif kanama',
        text: 'Düzensiz kanama olabilir; özellikle yeni bir yöntemin başında.',
      },
      {
        title: 'Göğüslerde hassasiyet',
        text: 'Göğüslerde geçici bir gerginlik ya da hassasiyet hissedilebilir.',
      },
      {
        title: 'Ruh hali',
        text: 'Bazı kişiler ruh halinde değişimler ya da duygusal hassasiyette artış fark eder.',
      },
      {
        title: 'Baş ağrıları',
        text: 'Uyum döneminde hafif baş ağrıları olabilir.',
      },
    ],
    body3: 'İlk haftalar ya da döngüler, daha önce alışık olduğundan farklı olabilir. Beden yeni hormonal dengeye zamanla uyum sağlayabilir.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Bir yönteme başladıktan kısa süre sonra ortaya çıkan bir etkiyi zaman içinde izlemeye değer. Rahatsız edici hale gelirse ya da sürerse bir sağlık uzmanıyla konuş.',
    body4: 'Belirtilerin bir döngüden diğerine nasıl değiştiğini daha iyi takip etmek için bunları uygulamana kaydetmek faydalı olabilir.',
    trackingTitle: 'Gelişimi takip et',
    trackingSubtitle: 'Birkaç gösterge faydalı olabilir',
    trackingLines: [
      'Belirtinin ortaya çıktığı tarihi not et.',
      'Şiddetini ve süresini kaydet.',
      'Düzelip düzelmediğini ya da kötüleşip kötüleşmediğini izle.',
    ],
    body5: 'Her belirti mutlaka doğum kontrolüyle bağlantılı değildir. Stres, uyku, beslenme, döngün ya da diğer tedaviler de kendini nasıl hissettiğini etkileyebilir.',
    body6: 'Durumu anlamak için tek bir belirtiyi ayrı olarak ele almak yerine genel bağlama bakmaya çalış.',
    worthMentioning: [
      'Belirgin, geçmeyen ruh hali değişimleri',
      'Seni rahatsız eden cinsel istek azalması',
      '3 döngüden uzun süren düzensiz kanama',
      'Rahatsız edici olmaya devam eden bulantı ya da baş ağrıları',
    ],
    questionsTitle: 'Faydalı birkaç soru',
    questions: [
      'Bu belirtiler ne zamandır sürüyor?',
      'Bir doğum kontrol yöntemine başladıktan ya da yöntemi değiştirdikten sonra mı ortaya çıktılar?',
      'Hafif mi, rahatsız edici mi, yoksa senin için gerçekten alışılmadık mı?',
      'Zamanla düzeliyorlar mı, yoksa daha sık mı oluyorlar?',
    ],
    body7: 'Bir belirti acil olmasa bile, rahatsız edici hale gelirse, sürerse ya da yaşam kaliteni gerçekten etkilerse bunu konuşmaya değer olabilir.',
    infoTitle: 'Tavsiye almak yerinde olabilir, eğer…',
    infoText: 'belirtiler sürüyorsa, daha belirgin hale geliyorsa ya da normal şekilde yaşamana engel oluyorsa.',
    body8: 'Bir doktor, ebe ya da eczacı, belirtilerin kullandığın yöntemle bağlantılı olup olmayabileceğini ve yöntemin ayarlanması gerekip gerekmediğini belirlemene yardımcı olabilir.',
    body9: 'Bazı belirtiler alışılmadıktır ve hızlı tıbbi değerlendirme gerektirir. Mutlaka bir komplikasyon olduğu anlamına gelmezler, ancak göz ardı edilmemelidirler.',
    alertTitle: 'Hızlıca yardım iste',
    alertIntro: 'Özellikle aşağıdakilerden birini yaşarsan hızlıca tıbbi tavsiye al:',
    urgentSigns: [
      'Belirgin ya da alışılmadık göğüs ağrısı',
      'Ani nefes darlığı',
      'Bacakta alışılmadık şişlik ya da ağrı',
      'Ani, çok şiddetli ya da alışılmadık bir baş ağrısı',
      'Görmede, konuşmada ya da güçte ani bir sorun',
    ],
    emergencyTitle: 'Ciddi bir durumda',
    emergencyText: 'Belirtiler ani ve çok şiddetliyse ya da nefes almada güçlük, baygınlık hissi veya başka bir ciddi belirti eşlik ediyorsa acil tıbbi yardım iste.',
    summaryTitle: 'Özetle',
    summaryItems: [
      'Bazı etkiler yeni bir hormonal doğum kontrol yönteminin başında ortaya çıkabilir.',
      'Birçok etki geçicidir ve zamanla azalabilir.',
      'Rahatsız edici ya da geçmeyen bir belirtiyi bir uzmanla konuşmaya değer.',
      'Bazı alışılmadık belirtiler hızlı tıbbi tavsiye gerektirir.',
    ],
    finalTipTitle: 'Akılda kalacak nokta',
    finalTipText: 'Bedenini dinlemek, bir yöntemi hemen bırakmak anlamına gelmek zorunda değildir. Hissettiklerini not et, nasıl geliştiğini izle ve bir belirti seni endişelendirdiğinde tavsiye iste.',
    disclaimerText: 'Bu makale bilgilendirme amaçlıdır ve kişiye özel tıbbi tavsiyenin yerini tutmaz. Belirgin ya da alışılmadık bir belirtin varsa bir sağlık uzmanından tavsiye al.',
    shareMessage: 'Olası yan etkileri tanımak — AWA',
  },
  ru: {
    badge: 'ПОБОЧНЫЕ ЭФФЕКТЫ',
    title: 'Как распознать возможные\nпобочные эффекты',
    metaDuration: '8 мин чтения',
    metaType: 'Статья',
    metaLevel: 'Средний уровень',
    metaValidated: 'Проверенный материал',
    intro: 'Некоторые эффекты могут быть обычными и временными. Другие требуют большего внимания. Научитесь отличать привычные реакции от признаков, которые нужно оценить.',
    contentsTitle: 'В этой статье',
    topics: [
      'Частые слабовыраженные эффекты',
      'Период адаптации организма',
      'Наблюдение за изменениями',
      'Когда обратиться за медицинской консультацией',
      'Когда нужно быстро обратиться за помощью',
      'Главное',
    ],
    body1: 'Когда женщина начинает новый метод гормональной контрацепции, организму может потребоваться время на адаптацию. Могут появиться небольшие изменения в цикле, настроении или физическом самочувствии.',
    body2: 'Эти эффекты часто выражены слабо и могут постепенно уменьшаться. Их наличие автоматически не означает, что метод опасен или что его нужно прекратить.',
    commonEffects: [
      {
        title: 'Небольшие кровянистые выделения',
        text: 'Могут возникать нерегулярные кровянистые выделения, особенно в начале нового метода.',
      },
      {
        title: 'Болезненность груди',
        text: 'Временно может ощущаться напряжение или болезненность груди.',
      },
      {
        title: 'Настроение',
        text: 'Некоторые замечают перепады настроения или повышенную эмоциональную чувствительность.',
      },
      {
        title: 'Головные боли',
        text: 'В период адаптации могут возникать слабые головные боли.',
      },
    ],
    body3: 'Первые недели или циклы могут отличаться от того, к чему вы привыкли раньше. Организм может постепенно приспособиться к новому гормональному балансу.',
    tip1Title: 'Полезно знать',
    tip1Text: 'За эффектом, который появился вскоре после начала метода, стоит понаблюдать во времени. Если он становится мешающим или не проходит, поговорите с медицинским специалистом.',
    body4: 'Полезно записывать симптомы в приложении, чтобы лучше отслеживать, как они меняются от цикла к циклу.',
    trackingTitle: 'Следите за динамикой',
    trackingSubtitle: 'Несколько ориентиров могут быть полезны',
    trackingLines: [
      'Отметьте дату появления симптома.',
      'Запишите его интенсивность и продолжительность.',
      'Следите, улучшается он или усиливается.',
    ],
    body5: 'Не все симптомы обязательно связаны с контрацепцией. На самочувствие могут влиять также стресс, сон, питание, фаза цикла или другие лекарства.',
    body6: 'Чтобы разобраться в ситуации, постарайтесь смотреть на общий контекст, а не на один симптом в отдельности.',
    worthMentioning: [
      'Выраженные и стойкие изменения настроения',
      'Снижение либидо, которое вас беспокоит',
      'Нерегулярные кровянистые выделения, которые продолжаются более 3 циклов',
      'Тошнота или головные боли, которые остаются мешающими',
    ],
    questionsTitle: 'Несколько полезных вопросов',
    questions: [
      'Как давно длятся эти симптомы?',
      'Появились ли они после начала или смены метода контрацепции?',
      'Они слабые, мешающие или действительно необычные для вас?',
      'Они со временем проходят или становятся чаще?',
    ],
    body7: 'Даже если симптом не срочный, его стоит обсудить, если он становится мешающим, не проходит или действительно влияет на качество вашей жизни.',
    infoTitle: 'Стоит обратиться за советом, если…',
    infoText: 'симптомы сохраняются, усиливаются или мешают вам жить привычной жизнью.',
    body8: 'Врач, акушерка или фармацевт помогут определить, могут ли симптомы быть связаны с используемым вами методом и нужно ли его скорректировать.',
    body9: 'Некоторые признаки необычны и требуют срочной медицинской оценки. Они не обязательно означают осложнение, но игнорировать их нельзя.',
    alertTitle: 'Обратитесь за помощью быстро',
    alertIntro: 'Быстро обратитесь за медицинской помощью, если вы испытываете, в частности:',
    urgentSigns: [
      'Сильную или необычную боль в груди',
      'Внезапное затруднение дыхания',
      'Необычный отёк или боль в ноге',
      'Внезапную, очень сильную или необычную головную боль',
      'Внезапные нарушения зрения, речи или слабость',
    ],
    emergencyTitle: 'При тяжёлом состоянии',
    emergencyText: 'Если симптомы возникли внезапно, очень выражены или сопровождаются затруднением дыхания, предобморочным состоянием или другим серьёзным признаком, срочно обратитесь за неотложной медицинской помощью.',
    summaryTitle: 'Главное',
    summaryItems: [
      'Некоторые эффекты могут появиться в начале нового метода гормональной контрацепции.',
      'Многие эффекты временны и могут уменьшаться со временем.',
      'Мешающий или не проходящий симптом стоит обсудить со специалистом.',
      'Некоторые необычные признаки требуют быстрой медицинской консультации.',
    ],
    finalTipTitle: 'Главная мысль',
    finalTipText: 'Прислушиваться к своему телу не обязательно означает сразу прекращать метод. Отмечайте, что вы чувствуете, наблюдайте за динамикой и обращайтесь за советом, когда симптом вас тревожит.',
    disclaimerText: 'Эта статья носит информационный характер и не заменяет индивидуальную медицинскую консультацию. Если у вас выраженный или необычный симптом, обратитесь за советом к медицинскому специалисту.',
    shareMessage: 'Как распознать возможные побочные эффекты — AWA',
  },
  de: {
    badge: 'NEBENWIRKUNGEN',
    title: 'Mögliche Nebenwirkungen\nerkennen',
    metaDuration: '8 Min. Lesezeit',
    metaType: 'Artikel',
    metaLevel: 'Fortgeschritten',
    metaValidated: 'Geprüfter Inhalt',
    intro:
      'Manche Wirkungen sind häufig und vorübergehend. Andere verdienen mehr Aufmerksamkeit. Lerne, übliche Reaktionen von Anzeichen zu unterscheiden, die abgeklärt werden sollten.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Häufige, leichte Wirkungen',
      'Die Anpassungszeit des Körpers',
      'Beobachten, was sich verändert',
      'Wann du dich ärztlich beraten lassen solltest',
      'Wann du schnell Hilfe suchen solltest',
      'Das Wichtigste in Kürze',
    ],
    body1:
      'Wenn du eine neue hormonelle Verhütungsmethode beginnst, braucht dein Körper möglicherweise etwas Zeit, um sich anzupassen. Kleine Veränderungen können im Zyklus, in der Stimmung oder im körperlichen Wohlbefinden auftreten.',
    body2:
      'Diese Wirkungen sind oft mild und können allmählich nachlassen. Dass sie auftreten, bedeutet nicht automatisch, dass die Methode gefährlich ist oder abgesetzt werden muss.',
    commonEffects: [
      {
        title: 'Leichte Blutungen',
        text: 'Unregelmäßige Blutungen können auftreten, besonders zu Beginn einer neuen Methode.',
      },
      {
        title: 'Brustspannen',
        text: 'Ein Spannungsgefühl oder eine Empfindlichkeit der Brust kann vorübergehend auftreten.',
      },
      {
        title: 'Stimmung',
        text: 'Manche Frauen bemerken Stimmungsschwankungen oder eine erhöhte emotionale Empfindsamkeit.',
      },
      {
        title: 'Kopfschmerzen',
        text: 'Leichte Kopfschmerzen können in der Anpassungsphase auftreten.',
      },
    ],
    body3:
      'Die ersten Wochen oder Zyklen können anders sein, als du es zuvor gewohnt warst. Dein Körper kann sich nach und nach an das neue hormonelle Gleichgewicht anpassen.',
    tip1Title: 'Gut zu wissen',
    tip1Text:
      'Eine Wirkung, die kurz nach dem Beginn einer Methode auftritt, solltest du über die Zeit beobachten. Wenn sie störend wird oder anhält, sprich mit medizinischem Fachpersonal.',
    body4:
      'Es kann hilfreich sein, Symptome in deiner App festzuhalten, um besser zu verfolgen, wie sie sich von einem Zyklus zum nächsten verändern.',
    trackingTitle: 'Den Verlauf beobachten',
    trackingSubtitle: 'Ein paar Anhaltspunkte können hilfreich sein',
    trackingLines: [
      'Notiere, wann das Symptom aufgetreten ist.',
      'Halte Stärke und Dauer fest.',
      'Achte darauf, ob es besser oder schlimmer wird.',
    ],
    body5:
      'Nicht alle Symptome hängen zwangsläufig mit der Verhütung zusammen. Auch Stress, Schlaf, Ernährung, dein Zyklus oder andere Behandlungen können beeinflussen, wie du dich fühlst.',
    body6:
      'Um die Situation einzuordnen, versuche, den gesamten Zusammenhang zu betrachten statt ein einzelnes Symptom für sich allein.',
    worthMentioning: [
      'Deutliche, anhaltende Stimmungsschwankungen',
      'Ein Rückgang der Libido, der dich belastet',
      'Unregelmäßige Blutungen, die länger als 3 Zyklen anhalten',
      'Übelkeit oder Kopfschmerzen, die weiterhin störend sind',
    ],
    questionsTitle: 'Ein paar hilfreiche Fragen',
    questions: [
      'Seit wann bestehen diese Symptome?',
      'Sind sie nach dem Beginn oder Wechsel einer Verhütungsmethode aufgetreten?',
      'Sind sie leicht, störend oder wirklich ungewöhnlich für dich?',
      'Bessern sie sich mit der Zeit oder werden sie häufiger?',
    ],
    body7:
      'Auch wenn ein Symptom nicht dringend ist, kann es sinnvoll sein, darüber zu sprechen, wenn es störend wird, anhält oder deine Lebensqualität wirklich beeinträchtigt.',
    infoTitle: 'Ein Rat kann sinnvoll sein, wenn …',
    infoText:
      'Symptome anhalten, stärker werden oder dich daran hindern, normal zu leben.',
    body8:
      'Eine Ärztin oder ein Arzt, eine Hebamme oder eine Apothekerin bzw. ein Apotheker kann dir helfen einzuschätzen, ob die Symptome mit der angewendeten Methode zusammenhängen könnten und ob sie angepasst werden sollte.',
    body9:
      'Manche Anzeichen sind ungewöhnlich und erfordern eine zeitnahe ärztliche Abklärung. Sie bedeuten nicht zwangsläufig, dass eine Komplikation vorliegt, sollten aber nicht ignoriert werden.',
    alertTitle: 'Schnell Hilfe suchen',
    alertIntro: 'Hole schnell ärztlichen Rat ein, wenn du insbesondere Folgendes bemerkst:',
    urgentSigns: [
      'Starke oder ungewöhnliche Brustschmerzen',
      'Plötzliche Atemnot',
      'Ungewöhnliche Schwellung oder Schmerzen in einem Bein',
      'Plötzliche, sehr starke oder ungewöhnliche Kopfschmerzen',
      'Plötzliche Probleme mit dem Sehen, Sprechen oder der Kraft',
    ],
    emergencyTitle: 'Bei einer schweren Situation',
    emergencyText:
      'Wenn Symptome plötzlich auftreten, sehr stark sind oder mit Atemnot, Ohnmachtsgefühl oder einem anderen ernsten Anzeichen einhergehen, such dringend ärztliche Hilfe.',
    summaryTitle: 'Das Wesentliche',
    summaryItems: [
      'Zu Beginn einer neuen hormonellen Verhütungsmethode können manche Wirkungen auftreten.',
      'Viele Wirkungen sind vorübergehend und können mit der Zeit nachlassen.',
      'Ein störendes oder anhaltendes Symptom solltest du mit Fachpersonal besprechen.',
      'Manche ungewöhnlichen Anzeichen erfordern zeitnah ärztlichen Rat.',
    ],
    finalTipTitle: 'Die Kernbotschaft',
    finalTipText:
      'Auf deinen Körper zu hören bedeutet nicht zwangsläufig, eine Methode sofort abzusetzen. Notiere, was du spürst, beobachte den Verlauf und hol dir Rat, sobald dich ein Symptom beunruhigt.',
    disclaimerText:
      'Dieser Artikel dient der Information und ersetzt keine persönliche ärztliche Beratung. Wenn du ein deutliches oder ungewöhnliches Symptom hast, lass dich von medizinischem Fachpersonal beraten.',
    shareMessage: 'Mögliche Nebenwirkungen erkennen — AWA',
  },
  zh: {
      badge: '副作用',
      title: '识别可能的\n副作用',
      metaDuration: '阅读约 8 分钟',
      metaType: '文章',
      metaLevel: '进阶',
      metaValidated: '已审阅内容',
      intro: '有些反应很常见，而且是暂时的；另一些则需要更多关注。学会区分常见反应和需要评估的信号。',
      contentsTitle: '本文内容',
      topics: [
        '常见的轻微反应',
        '身体的适应期',
        '观察有什么变化',
        '什么时候该咨询医生',
        '什么时候该尽快就医',
        '要点回顾',
      ],
      body1: '开始使用一种新的激素类避孕方式时，身体可能需要一些时间来适应。周期、情绪或身体舒适度上可能会出现一些小变化。',
      body2: '这些反应通常较轻，并可能逐渐减轻。出现这些反应，并不一定说明这种方式有危险，也不一定需要停用。',
      commonEffects: [
        {
          title: '少量出血',
          text: '可能出现不规则出血，尤其是在刚开始使用一种新方式时。',
        },
        {
          title: '乳房胀痛',
          text: '可能会暂时感到乳房发胀或触痛。',
        },
        {
          title: '情绪',
          text: '有些人会感到情绪变化，或者情绪更敏感。',
        },
        {
          title: '头痛',
          text: '适应期间可能出现轻微头痛。',
        },
      ],
      body3: '最初几周或几个周期，可能与你以前习惯的不太一样。身体可以逐渐适应新的激素平衡。',
      tip1Title: '小贴士',
      tip1Text: '开始使用某种方式后不久出现的反应，值得持续观察。如果变得困扰你或持续不退，请咨询医疗专业人员。',
      body4: '在应用中记录症状，有助于更好地了解它们在不同周期之间的变化。',
      trackingTitle: '记录变化过程',
      trackingSubtitle: '几个要点会有帮助',
      trackingLines: [
        '记下症状出现的日期。',
        '记录它的强度和持续时间。',
        '观察它是在好转还是加重。',
      ],
      body5: '并非所有症状都一定与避孕有关。压力、睡眠、饮食、你的周期或其他药物，也可能影响你的感受。',
      body6: '要弄清情况，请尽量从整体来看，而不是只盯着某一个孤立的症状。',
      worthMentioning: [
        '明显而持续的情绪变化',
        '让你感到困扰的性欲下降',
        '持续超过 3 个周期的不规则出血',
        '持续令人不适的恶心或头痛',
      ],
      questionsTitle: '几个有用的问题',
      questions: [
        '这些症状持续多久了？',
        '它们是在开始或更换避孕方式之后出现的吗？',
        '它们是轻微的、令人困扰的，还是对你来说确实反常？',
        '它们随着时间在好转，还是变得更频繁？',
      ],
      body7: '即使症状并不紧急，如果它让你困扰、持续存在，或确实影响了你的生活质量，也值得和医生谈一谈。',
      infoTitle: '出现以下情况时，可以考虑寻求建议…',
      infoText: '症状持续、变得更明显，或妨碍你正常生活。',
      body8: '医生、助产士或药师可以帮你判断这些症状是否可能与你使用的方式有关，以及是否需要调整。',
      body9: '有些症状不寻常，需要尽快接受医学评估。它们不一定意味着出现了并发症，但不应被忽视。',
      alertTitle: '尽快就医',
      alertIntro: '如果出现以下情况，尤其要尽快寻求医疗建议：',
      urgentSigns: [
        '明显的或不寻常的胸痛',
        '突然呼吸困难',
        '单侧腿部不寻常的肿胀或疼痛',
        '突然出现的、非常剧烈或不寻常的头痛',
        '突然出现视力、言语或肢体力量方面的障碍',
      ],
      emergencyTitle: '出现严重情况时',
      emergencyText: '如果症状突然出现、非常严重，或伴有呼吸困难、感觉要晕倒或其他严重迹象，请立即寻求紧急医疗救助。',
      summaryTitle: '核心要点',
      summaryItems: [
        '开始使用新的激素类避孕方式时，可能会出现一些反应。',
        '许多反应是暂时的，可能会随时间减轻。',
        '令人困扰或持续的症状，值得与专业人员讨论。',
        '有些不寻常的迹象需要尽快获得医疗建议。',
      ],
      finalTipTitle: '要点',
      finalTipText: '倾听身体的声音，并不一定意味着马上停用某种方式。记下你的感受，观察它的变化，只要某个症状让你担心，就去寻求建议。',
      disclaimerText: '本文仅供参考，不能替代个性化的医生建议。如果你出现明显或不寻常的症状，请咨询医疗专业人员。',
      shareMessage: '识别可能的副作用 — AWA',
    },
  'zh-Hant': {
      badge: '副作用',
      title: '識別可能的\n副作用',
      metaDuration: '閱讀約 8 分鐘',
      metaType: '文章',
      metaLevel: '進階',
      metaValidated: '已審閱內容',
      intro: '有些反應很常見，而且是暫時的；另一些則需要更多關注。學會區分常見反應和需要評估的訊號。',
      contentsTitle: '本文內容',
      topics: [
        '常見的輕微反應',
        '身體的適應期',
        '觀察有什麼變化',
        '什麼時候該諮詢醫生',
        '什麼時候該儘快就醫',
        '要點回顧',
      ],
      body1: '開始使用一種新的荷爾蒙類避孕方式時，身體可能需要一些時間來適應。週期、情緒或身體舒適度上可能會出現一些小變化。',
      body2: '這些反應通常較輕，並可能逐漸減輕。出現這些反應，並不一定說明這種方式有危險，也不一定需要停用。',
      commonEffects: [
        {
          title: '少量出血',
          text: '可能出現不規則出血，尤其是在剛開始使用一種新方式時。',
        },
        {
          title: '乳房脹痛',
          text: '可能會暫時感到乳房發脹或觸痛。',
        },
        {
          title: '情緒',
          text: '有些人會感到情緒變化，或者情緒更敏感。',
        },
        {
          title: '頭痛',
          text: '適應期間可能出現輕微頭痛。',
        },
      ],
      body3: '最初幾週或幾個週期，可能與你以前習慣的不太一樣。身體可以逐漸適應新的荷爾蒙平衡。',
      tip1Title: '小提醒',
      tip1Text: '開始使用某種方式後不久出現的反應，值得持續觀察。如果變得困擾你或持續不退，請諮詢醫療專業人員。',
      body4: '在應用中記錄症狀，有助於更好地瞭解它們在不同週期之間的變化。',
      trackingTitle: '記錄變化過程',
      trackingSubtitle: '幾個要點會有幫助',
      trackingLines: [
        '記下症狀出現的日期。',
        '記錄它的強度和持續時間。',
        '觀察它是在好轉還是加重。',
      ],
      body5: '並非所有症狀都一定與避孕有關。壓力、睡眠、飲食、你的週期或其他藥物，也可能影響你的感受。',
      body6: '要弄清情況，請儘量從整體來看，而不是隻盯著某一個孤立的症狀。',
      worthMentioning: [
        '明顯而持續的情緒變化',
        '讓你感到困擾的性慾下降',
        '持續超過 3 個週期的不規則出血',
        '持續令人不適的噁心或頭痛',
      ],
      questionsTitle: '幾個有用的問題',
      questions: [
        '這些症狀持續多久了？',
        '它們是在開始或更換避孕方式之後出現的嗎？',
        '它們是輕微的、令人困擾的，還是對你來說確實反常？',
        '它們隨著時間在好轉，還是變得更頻繁？',
      ],
      body7: '即使症狀並不緊急，如果它讓你困擾、持續存在，或確實影響了你的生活品質，也值得和醫生談一談。',
      infoTitle: '出現以下情況時，可以考慮尋求建議…',
      infoText: '症狀持續、變得更明顯，或妨礙你正常生活。',
      body8: '醫生、助產士或藥師可以幫你判斷這些症狀是否可能與你使用的方式有關，以及是否需要調整。',
      body9: '有些症狀不尋常，需要儘快接受醫學評估。它們不一定意味著出現了併發症，但不應被忽視。',
      alertTitle: '儘快就醫',
      alertIntro: '如果出現以下情況，尤其要儘快尋求醫療建議：',
      urgentSigns: [
        '明顯的或不尋常的胸痛',
        '突然呼吸困難',
        '單側腿部不尋常的腫脹或疼痛',
        '突然出現的、非常劇烈或不尋常的頭痛',
        '突然出現視力、言語或肢體力量方面的障礙',
      ],
      emergencyTitle: '出現嚴重情況時',
      emergencyText: '如果症狀突然出現、非常嚴重，或伴有呼吸困難、感覺要暈倒或其他嚴重跡象，請立即尋求緊急醫療救助。',
      summaryTitle: '核心要點',
      summaryItems: [
        '開始使用新的荷爾蒙類避孕方式時，可能會出現一些反應。',
        '許多反應是暫時的，可能會隨時間減輕。',
        '令人困擾或持續的症狀，值得與專業人員討論。',
        '有些不尋常的跡象需要儘快獲得醫療建議。',
      ],
      finalTipTitle: '要點',
      finalTipText: '傾聽身體的聲音，並不一定意味著馬上停用某種方式。記下你的感受，觀察它的變化，只要某個症狀讓你擔心，就去尋求建議。',
      disclaimerText: '本文僅供參考，不能替代個性化的醫生建議。如果你出現明顯或不尋常的症狀，請諮詢醫療專業人員。',
      shareMessage: '識別可能的副作用 — AWA',
    },
  ar: {
    badge: 'الآثار الجانبية',
    title: 'التعرّف على\nالآثار الجانبية المحتملة',
    metaDuration: 'قراءة 8 دقائق',
    metaType: 'مقال',
    metaLevel: 'متوسط',
    metaValidated: 'محتوى مُراجَع',
    intro:
      'قد تكون بعض الآثار شائعة ومؤقتة، وبعضها الآخر يحتاج إلى مزيد من الانتباه. تعلّمي التمييز بين التفاعلات المعتادة والعلامات التي ينبغي تقييمها.',
    contentsTitle: 'في هذا المقال',
    topics: [
      'آثار شائعة وخفيفة',
      'مرحلة تكيّف الجسم',
      'ملاحظة ما يتغيّر',
      'متى تطلبين استشارة طبية',
      'متى تطلبين الرعاية بسرعة',
      'أهم ما يجب تذكّره',
    ],
    body1:
      'عند البدء بوسيلة جديدة لمنع الحمل الهرموني، قد يحتاج الجسم إلى بعض الوقت ليتكيّف. وقد تظهر تغيرات صغيرة في الدورة أو المزاج أو الراحة الجسدية.',
    body2:
      'غالبًا ما تكون هذه الآثار خفيفة وقد تقلّ تدريجيًا. ووجودها لا يعني تلقائيًا أن الوسيلة خطيرة أو أنه ينبغي إيقافها.',
    commonEffects: [
      {
        title: 'نزف خفيف',
        text: 'قد يحدث نزف غير منتظم، خصوصًا في بداية استخدام وسيلة جديدة.',
      },
      {
        title: 'ألم في الثديين',
        text: 'قد يُشعَر بشدّ أو ألم في الثديين بشكل مؤقت.',
      },
      {
        title: 'المزاج',
        text: 'تلاحظ بعض النساء تغيّرات في المزاج أو زيادة في الحساسية العاطفية.',
      },
      {
        title: 'الصداع',
        text: 'قد يحدث صداع خفيف خلال فترة التكيّف.',
      },
    ],
    body3:
      'قد تختلف الأسابيع أو الدورات الأولى عمّا اعتدتِ عليه سابقًا. ويمكن للجسم أن يتكيّف تدريجيًا مع التوازن الهرموني الجديد.',
    tip1Title: 'جدير بالمعرفة',
    tip1Text:
      'الأثر الذي يظهر بعد وقت قصير من بدء وسيلة ما يستحق المتابعة مع مرور الوقت. وإذا أصبح مزعجًا أو استمر، فتحدثي إلى مختص صحي.',
    body4:
      'قد يكون من المفيد تسجيل الأعراض في تطبيقك لمتابعة تغيّرها بشكل أفضل من دورة إلى أخرى.',
    trackingTitle: 'تابعي كيف تتطور الأمور',
    trackingSubtitle: 'بعض المؤشرات قد تكون مفيدة',
    trackingLines: [
      'دوّني تاريخ ظهور العرض.',
      'سجّلي شدّته ومدّته.',
      'لاحظي هل يتحسن أم يزداد سوءًا.',
    ],
    body5:
      'ليست كل الأعراض مرتبطة بالضرورة بمنع الحمل. فالتوتر والنوم والغذاء والدورة أو علاجات أخرى قد تؤثر أيضًا في شعورك.',
    body6:
      'لفهم الوضع، حاولي النظر إلى السياق العام بدلًا من عرض واحد بمعزل عن غيره.',
    worthMentioning: [
      'تغيّرات واضحة ومستمرة في المزاج',
      'انخفاض في الرغبة الجنسية يزعجك',
      'نزف غير منتظم يستمر أكثر من 3 دورات',
      'غثيان أو صداع يظل مزعجًا',
    ],
    questionsTitle: 'بعض الأسئلة المفيدة',
    questions: [
      'منذ متى بدأت هذه الأعراض؟',
      'هل ظهرت بعد البدء بوسيلة لمنع الحمل أو تغييرها؟',
      'هل هي خفيفة أم مزعجة أم غير معتادة فعلًا بالنسبة إليك؟',
      'هل تتحسن مع الوقت أم تزداد تكرارًا؟',
    ],
    body7:
      'حتى لو لم يكن العرض عاجلًا، فقد يستحق أن تناقشيه إذا أصبح مزعجًا أو استمر أو أثّر فعلًا في جودة حياتك.',
    infoTitle: 'قد يكون من المفيد طلب المشورة إذا…',
    infoText:
      'استمرت الأعراض أو ازدادت أو منعتكِ من عيش حياتك بشكل طبيعي.',
    body8:
      'يمكن للطبيب أو القابلة أو الصيدلي مساعدتك في تحديد ما إذا كانت الأعراض مرتبطة بالوسيلة التي تستخدمينها وهل ينبغي تعديلها.',
    body9:
      'بعض العلامات غير معتادة وتستدعي تقييمًا طبيًا سريعًا. وهي لا تعني بالضرورة وجود مضاعفات، لكن لا ينبغي تجاهلها.',
    alertTitle: 'اطلبي الرعاية بسرعة',
    alertIntro: 'اطلبي استشارة طبية بسرعة إذا ظهر لديك، على وجه الخصوص:',
    urgentSigns: [
      'ألم شديد أو غير معتاد في الصدر',
      'صعوبة مفاجئة في التنفس',
      'تورّم أو ألم غير معتاد في إحدى الساقين',
      'صداع مفاجئ أو شديد جدًا أو غير معتاد',
      'اضطراب مفاجئ في الرؤية أو الكلام أو القوة',
    ],
    emergencyTitle: 'في حالة خطيرة',
    emergencyText:
      'إذا كانت الأعراض مفاجئة أو شديدة جدًا أو ترافقت مع صعوبة في التنفس أو شعور بالإغماء أو علامة خطيرة أخرى، فاطلبي مساعدة طبية عاجلة.',
    summaryTitle: 'الخلاصة',
    summaryItems: [
      'قد تظهر بعض الآثار عند بدء وسيلة جديدة لمنع الحمل الهرموني.',
      'كثير من الآثار مؤقتة وقد تقلّ مع الوقت.',
      'العرض المزعج أو المستمر يستحق أن يُناقَش مع مختص.',
      'بعض العلامات غير المعتادة تستدعي استشارة طبية سريعة.',
    ],
    finalTipTitle: 'أهم ما يجب تذكّره',
    finalTipText:
      'الإصغاء إلى جسمك لا يعني بالضرورة إيقاف الوسيلة فورًا. دوّني ما تشعرين به، وتابعي تطوره، واطلبي المشورة كلما أقلقك عرض ما.',
    disclaimerText:
      'هذا المقال للاطلاع والمعرفة ولا يغني عن استشارة طبية شخصية. وإذا ظهر لديك عرض كبير أو غير معتاد، فاطلبي مشورة مختص صحي.',
    shareMessage: 'التعرّف على الآثار الجانبية المحتملة — AWA',
  },
  kab: {
    badge: 'TIGGIN N WEDDAL',
    title: 'Isem n yiggin n wuddal\nyezmer ad d-banen',
    metaDuration: '8 n tesdidin n tɣuri',
    metaType: 'Amagrad',
    metaLevel: 'Alemmas',
    metaValidated: 'Agbur yettwasenqed',
    intro:
      'Kra n yigget zemren ad ilin d imatuten yerna ad ɛeddin. Wiyaḍ ḥwaǧen aḥrad ugar. Ssen amek ara tfarqeḍ gar tiririyin n yal ass d tilɣa i ilaqen ad ttwasenqed.',
    contentsTitle: 'Deg umagrad-a',
    topics: [
      'Tigget imatuten yerna ur ttaḥricent ara',
      'Tawala n ukkus n ujeṭṭa',
      'Tkekkaṭ i ayen ibeddlen',
      'Melmi ara tsuteḍ tamusni n ṭṭbib',
      'Melmi ara tfeṛṣeḍ ad tt-nnadiḍ s zzerb',
      'Tiktiwin tigejdanin',
    ],
    body1:
      'Mi ara yebdu yiwen tarrayt tamaynut n ugdal n lḥemla s hormone, ajeṭṭa yezmer ad yeḥwaǧ kra n wakud akken ad yemgar. Isennan imecṭuḥen zemren ad d-banen deg tawaɣit, deg tebburt neɣ deg ujeṭṭa.',
    body2:
      'Tigget-a ttilint s umata d timecṭuḥin yerna zemrent ad ttnaqṣent s wudem ameẓyan. Tella-nsent ur tt-yeɛni ara s wudem awurman belli tarrayt tettuɣal d tamgut neɣ ilaq ad tettwakkes.',
    commonEffects: [
      {
        title: 'Idammen imecṭuḥen',
        text: 'Idammen ur nezmir ara ad ilin, nețța mi ara yebdu yiwen tarrayt tamaynut.',
      },
      {
        title: 'Ucemmus n ufud',
        text: 'Ufud yezmer ad d-yeḥseb d aḥrad neɣ d ucemmus i kra n wakud.',
      },
      {
        title: 'Aṭṭan n wul',
        text: 'Kra n medden ad ẓren abeddel deg uṭṭan n wul neɣ ugar n tḥissit.',
      },
      {
        title: 'Aṭṭan n uqerruy',
        text: 'Aṭṭan n uqerruy amecṭuḥ yezmer ad d-yili deg tallit n umeẓlu.',
      },
    ],
    body3:
      'Imalasen imezwura neɣ tawaɣiwin tizwiren zemren ad ilin yemgarad ɣef ayen tettuɣaleḍ ɣer-s send. Ajeṭṭa izmer ad yemgar s wudem ameẓyan i uzenzi amaynut n hormone.',
    tip1Title: 'Yelha ad tessneḍ',
    tip1Text:
      'Agget i d-yettbanen kra n wussan deffir ma tebdiḍ tarrayt yelha ad tt-tḥerzeḍ s wakud. Ma yuɣal d aṭṭan neɣ yeqqim, hader d unelmad n tezmert.',
    body4:
      'Yezmer ad ak-yelhu ma tketbeḍ iceddan deg usnas-ik akken ad tḥerzeḍ amek ttbeddilen seg tawaɣit ɣer tayeḍ.',
    trackingTitle: 'Ḥerz amek ara d-tekkseḍ',
    trackingSubtitle: 'Kra n yirewwiyen zemren ad ak-ɛawnen',
    trackingLines: [
      'Ɣer asuter n wass i d-yebda uceddan.',
      'Kteb tezmert-is d wakud i yekkat.',
      'Ḥader ma yelha neɣ ma yuɣal d ugar n uḥraḍ.',
    ],
    body5:
      'Mačči akk iceddan qqnen ɣer ugdal n lḥemla. Aḍris, nnuba, tanafa, tawaɣit neɣ tisnadin-nniḍen zemrent ad ɛeṭṭlent ayen tḥessed.',
    body6:
      'I wakken ad tefhmeḍ addad, ɛreḍ ad twalaḍ amnaḍ imatu ugar n uceddan yiwen yettwaweṭṭen.',
    worthMentioning: [
      'Abeddel n uṭṭan n wul yesɛan azal yerna yeqqim',
      'Anqis n lbɣi i d-yeḥwaǧen',
      'Idammen ur nețța ara ɛeddan seg 3 n tewaɣiwin',
      'Tuccḍa neɣ aṭṭan n uqerruy i d-yeqqimen d uḥrad',
    ],
    questionsTitle: 'Kra n yisteqsiyen yelhan',
    questions: [
      'Acḥal n wakud i yella uceddan-agi?',
      'Tebdan deffir ma tebdiḍ neɣ tbeddleḍ tarrayt n ugdal n lḥemla?',
      'Wissen d imecṭuḥen, d iḥraden neɣ d ayen ur yelli akk am wakken i tettuɣaleḍ?',
      'Ttnaqqṣen akken i d-yezga uzemz neɣ ttarrin d ugar?',
    ],
    body7:
      'Ula ma yella uceddan ur yeṭṭef ara aḥrad, yezmer ad yelhu ad ttawalen ma yuɣal d uḥrad, ma yeqqim neɣ ma yesɛa awal ɣef tudert-ik s tidet.',
    infoTitle: 'Yezmer ad yelhu ad tsutreḍ tamusni ma…',
    infoText:
      'iceddan ttqimen, ttarrin d ugar, neɣ ur k-ǧǧin ara ad tɛicḍ amek tella.',
    body8:
      'Ṭṭbib, tamwellidt neɣ ṣṣidli zemren ad ak-ɛawnen ad tissineḍ ma iceddan zemren ad qqnen ɣer tarrayt i tettḥeṛṛiḍ yerna ma yelha ad tettwabeddel.',
    body9:
      'Kra n yeḥricen ur nelli ara am wakken i yella yerna ḥwaǧen asenqed n ṭṭbib s zzerb. Ur d-sebbben ara s wudem awurman aɣebbar, maca ur ilaq ara ad ttwarrin.',
    alertTitle: 'Nadi s zzerb i lemɛawna',
    alertIntro: 'Suter lemɛawna n ṭṭbib s zzerb ma tḥessed, s wudem uslig:',
    urgentSigns: [
      'Aṭṭan meqqren neɣ ur nelli ara am wakken yella deg uḍar n wul',
      'Tuccḍa n tuffɣa n tnefsit s wudem uslig',
      'Ubbu neɣ aṭṭan ur nelli ara am wakken yella deg uḍar',
      'Aṭṭan n uqerruy uslig, aḥrad aṭas neɣ ur nelli ara am wakken yella',
      'Tuccḍa uslig n tmuɣli, n wawal neɣ n tezmert',
    ],
    emergencyTitle: 'Ma yella addad aḥrad',
    emergencyText:
      'Ma yella uceddan d uslig, d aḥrad aṭas, neɣ yedda d tuccḍa n tuffɣa n tnefsit, n tuffɣa n tafat neɣ n kra n yeḥric aḥrad nniḍen, nadi s zzerb i lemɛawna n ṭṭbib.',
    summaryTitle: 'Ayen i d-yeqqimen',
    summaryItems: [
      'Kra n yigget zemren ad d-banen deg tazwara n tarrayt tamaynut n ugdal n lḥemla s hormone.',
      'Aṭas n yigget ttilint d timecṭuḥin yerna zemrent ad ttnaqṣent s wakud.',
      'Uceddan yeqqimen neɣ yuɣalen d aṭṭan yelha ad yettwabder d unelmad.',
      'Kra n yeḥricen ur nelli ara am wakken yella ḥwaǧen tamusni n ṭṭbib s zzerb.',
    ],
    finalTipTitle: 'Tikti tameqqrant',
    finalTipText:
      'Ad tesliḍ i ujeṭṭa-ik ur yeɛni ara ilaq ad tserseḍ tarrayt s zzerb. Kteb ayen tḥessed, ḥader amek ara yeddu, yerna suter tamusni mi ara k-yeccuren kra n uceddan.',
    disclaimerText:
      'Amagrad-a yella i talɣut kan yerna ur yettɛawad ara tamusni n ṭṭbib i tebɣiḍ. Ma tesɛiḍ aceddan ameqqran neɣ ur nelli ara am wakken yella, suter tamusni n unelmad n tezmert.',
    shareMessage: 'Isem n yiggin n wuddal yezmer ad d-banen — AWA',
  },
  om: {
    badge: 'GAARIIN BIRO',
    title: 'Dhiibbaa gaarii biroo\nta\'uu danda\'u beekuu',
    metaDuration: 'Dubbisuuf daqiiqaa 8',
    metaType: 'Barreeffama',
    metaLevel: 'Giddu-galeessa',
    metaValidated: 'Qabiyyee ilaalame',
    intro:
      'Dhiibbaan tokko tokko baay\'ee fi yeroo gabaabaaf ta\'uu danda\'u. Kaan immoo xiyyeeffannoo caalu barbaadu. Deebii idilee fi mallattoowwan madaalamuu qaban addaan baasuu bari.',
    contentsTitle: 'Barreeffama kana keessatti',
    topics: [
      'Dhiibbaawwan baay\'ee fi salphaa',
      'Yeroo qaamni of sirreessu',
      'Wanti jijjiiramu ilaaluu',
      'Yeroo gorsa fayyaa barbaaduu qabnu',
      'Yeroo ariitiin kunuunsa barbaaduu qabnu',
      'Wantoota ijoo yaadannoo',
    ],
    body1:
      'Namni tokko mala ittisa ulfaa hormoonii haaraa yeroo jalqabu, qaamni of sirreessuuf yeroo muraasa barbaachisuu danda\'a. Jijjiiramni xiqqoon marsaa, miira, yookaan mijaa\'ina qaamaa keessatti mul\'achuu danda\'a.',
    body2:
      'Dhiibbaawwan kun yeroo baay\'ee salphaa dha, suuta suutaan hir\'achuu danda\'u. Jiraachuun isaanii mala sun balaa qaba yookaan dhaabuun barbaachisa jechuu miti.',
    commonEffects: [
      {
        title: 'Dhiigni xiqqaan',
        text: 'Dhiigni idilee hin taane mul\'achuu danda\'a, keessumaa jalqaba mala haaraa irratti.',
      },
      {
        title: 'Dhukkubbii harmaa',
        text: 'Harmi ciccimuu yookaan dhukkubbuun yeroo gabaabaaf dhaga\'amuu danda\'a.',
      },
      {
        title: 'Miira',
        text: 'Namoonni tokko tokko jijjiirama miirasaa yookaan miira hamilee caaluu hubatu.',
      },
      {
        title: 'Mataa dhukkubbii',
        text: 'Mataan dhukkubbuun salphaan yeroo of sirreessuu mul\'achuu danda\'a.',
      },
    ],
    body3:
      'Torban yookaan marsaawwan jalqabaa kan duraan hawwii turte irraa adda ta\'uu danda\'u. Qaamni suuta suutaan madaalii hormoonii haaraatti of sirreessuu danda\'a.',
    tip1Title: 'Beekuun gaarii',
    tip1Text:
      'Dhiibbaan mala jalqabuu booda yeroo gabaabaa keessatti mul\'atu yeroo dheeraaf hordofamuu cala. Yoo rakkisaa ta\'e yookaan itti fufe, ogeessa fayyaa waliin haasa\'i.',
    body4:
      'Mallattoowwan appii kee keessatti galmeessuun, marsaa tokko irraa gara marsaa kaan akka jijjiiraman hordofuuf gargaara.',
    trackingTitle: 'Akka wanti jijjiiramu hordofuu',
    trackingSubtitle: 'Mallattoowwan muraasni gargaaruu danda\'u',
    trackingLines: [
      'Guyyaa mallattichi itti mul\'ate galmeessi.',
      'Cimina fi turtii isaa galmeessi.',
      'Gaarii ta\'aa jiraa moo hammaataa jira ilaali.',
    ],
    body5:
      'Mallattoon hundi ittisa ulfaa waliin walqabata jechuu miti. Dhiphina, rafuu, nyaata, marsaa kee, yookaan yaalii biroo illee akka itti dhaga\'amu sirreessuu danda\'u.',
    body6:
      'Haala hubachuuf, mallattoo tokko qofa addatti ilaaluu mannaa haala waliigalaa ilaali.',
    worthMentioning: [
      'Jijjiirama miira cimaa fi itti fufu',
      'Fedhii saalaa kan si rakkisu hir\'achuu',
      'Dhiiga idilee hin taane marsaa 3 ol turu',
      'Dhukkubbii garaa yookaan mataa kan rakkisaa ta\'ee itti fufu',
    ],
    questionsTitle: 'Gaaffilee gargaaran muraasa',
    questions: [
      'Mallattooleen kun yeroo hagamiif turaniiru?',
      'Mala ittisa ulfaa jalqabuu yookaan jijjiiruu booda mul\'ataniiree?',
      'Salphaa dhaa, rakkisaa dhaa, yookaan dhugumaan si biratti kan hin baratamne?',
      'Yeroo darbuun fooyya\'aa jiru moo yeroo baay\'ee ta\'aa jiru?',
    ],
    body7:
      'Mallattoon tokko ariifachiisaa hin taane illee, yoo rakkisaa ta\'e, itti fufe, yookaan dhugumaan jireenya kee irratti dhiibbaa geessise, haasa\'uun gaarii dha.',
    infoTitle: 'Gorsa argachuun gaarii ta\'a yoo…',
    infoText:
      'mallattooleen itti fufan, caalaatti ulfaatan, yookaan akka haala idileen jiraattu si dhorkan.',
    body8:
      'Doktora, ykn ogeessa deessisaa, yookaan faarmaasii mallattooleen kun mala itti fayyadamtu waliin walqabatu moo hin walqabanne, fi sirreeffamuu qaba moo hin qabne murteessuuf si gargaaruu danda\'a.',
    body9:
      'Mallattoowwan tokko tokko addaa dha, madaallii yaalaa ariifachiisaa barbaadu. Rakkoon jira jechuu hin taanu, garuu tuffatamuu hin qaban.',
    alertTitle: 'Ariitiin kunuunsa barbaadi',
    alertIntro: 'Yoo kanneen armaan gadii si mudatan, ariitiin gorsa fayyaa barbaadi:',
    urgentSigns: [
      'Dhukkubbii laphee cimaa yookaan idilee hin taane',
      'Si dhaabbataa hafuu hafuun afuuffachuu rakkachuu',
      'Dhiita yookaan dhukkubbii miila tokko keessatti idilee hin taane',
      'Mataa dhukkubbii tasa, baay\'ee cimaa, yookaan idilee hin taane',
      'Tasa ijaan arguu, dubbachuu, yookaan jabina rakkachuu',
    ],
    emergencyTitle: 'Yeroo haalli ulfaataa ta\'u',
    emergencyText:
      'Yoo mallattooleen tasa, baay\'ee cimaa ta\'an, yookaan afuuffachuu rakkachuu, of dhabuu, yookaan mallattoo ulfaataa biroo waliin dhufan, ariitiin gargaarsa fayyaa barbaadi.',
    summaryTitle: 'Wantoota ijoo',
    summaryItems: [
      'Dhiibbaawwan tokko tokko jalqaba mala ittisa ulfaa hormoonii haaraa irratti mul\'achuu danda\'u.',
      'Dhiibbaawwan baay\'een yeroo gabaabaaf kan ta\'an yoo ta\'u, yeroo darbuun hir\'achuu danda\'u.',
      'Mallattoon rakkisaa yookaan itti fufu ogeessa waliin haasa\'uuf gaarii dha.',
      'Mallattoowwan idilee hin taane tokko tokko gorsa fayyaa ariifachiisaa barbaadu.',
    ],
    finalTipTitle: 'Yaadannoo ijoo',
    finalTipText:
      'Qaama kee dhaggeeffachuun ammuma mala dhaabuu jechuu miti. Wanta dhaga\'amu galmeessi, akka jijjiiramu hordofi, mallattoon si yaachisu yeroo hundaa gorsa gaafadhu.',
    disclaimerText:
      'Barreeffamni kun odeeffannoof kan qophaa\'e yoo ta\'u, gorsa fayyaa dhuunfaa hin bakka bu\'u. Mallattoo ulfaataa yookaan idilee hin taane yoo qabaatte, ogeessa fayyaa irraa gorsa argadhu.',
    shareMessage: 'Dhiibbaa gaarii biroo ta\'uu danda\'u beekuu — AWA',
  },
  ti: {
    badge: 'ጎድኒ ዝኾኑ ሳዕቤናት',
    title: 'ክፍጠሩ ዝኽእሉ\nጎድኒ ሳዕቤናት ምልላይ',
    metaDuration: '8 ደቒቕ ንባብ',
    metaType: 'ጽሑፍ',
    metaLevel: 'ማእከላይ',
    metaValidated: 'ዝተገምገመ ትሕዝቶ',
    intro:
      'ገሊኦም ሳዕቤናት ልሙድን ግዝያውን ክኾኑ ይኽእሉ። ካልኦት ድማ ተወሳኺ ጥንቃቐ የድልዩ። ኣብ መንጎ ልሙዳት ምላሽን ክግምገሙ ዘለዎም ምልክታትን ዘሎ ፍልልይ ተማሃር።',
    contentsTitle: 'ኣብዚ ጽሑፍ',
    topics: [
      'ልሙዳትን ቀሊላትን ሳዕቤናት',
      'ኣካል ዝላመደሉ ግዜ',
      'እንታይ ከም ዝቕየር ምዕዛብ',
      'መዓስ ሓኪም ምስ ምኽኻር',
      'መዓስ ብሕልፈት ሓገዝ ጥዕና ምሕታት',
      'ቀንዲ ነጥብታት',
    ],
    body1:
      'ሓደ ሰብ ሓድሽ ሆርሞናዊ ኣገባብ ምክልኻል ጥንሲ ክጅምር ከሎ፣ ኣካል ንምልማድ ገለ ግዜ ክደልይ ይኽእል። ኣብ ዑደት፣ ስምዒትን ኣካላዊ ምቾትን ንኣሽቱ ለውጢታት ክረኣዩ ይኽእሉ።',
    body2:
      'እዞም ሳዕቤናት ብዙሕ ግዜ ቀሊላት እዮም፣ ብዝሕ ኢሎም’ውን ክንእሱ ይኽእሉ። ምህላዎም ኣውቶማቲካዊ እቲ ኣገባብ ሓደገኛ እዩ ወይ ክቋርጽ ኣለዎ ማለት ኣይኰነን።',
    commonEffects: [
      {
        title: 'ቀሊል ደም ምፍሳስ',
        text: 'ብፍላይ ኣብ ጅማሬ ሓድሽ ኣገባብ ዘይመደበኛ ደም ምፍሳስ ክኸውን ይኽእል።',
      },
      {
        title: 'ሕማም ጥቓ ጡብ',
        text: 'ጡብ ምጥባቕ ወይ ምቁዛም ግዝያዊ ክስምዓካ ይኽእል።',
      },
      {
        title: 'ስምዒት',
        text: 'ገሊአን ሰባት ለውጢ ስምዒትን ዝበዝሐ ስምዒታዊ ተቐባልነትን የስተውዕላ።',
      },
      {
        title: 'ቁርጽምጥም ርእሲ',
        text: 'ኣብ ግዜ ምልማድ ቀሊል ቁርጽምጥም ርእሲ ክፍጠር ይኽእል።',
      },
    ],
    body3:
      'እቲ ቀዳሞት ሳምንታት ወይ ዑደታት ቅድሚ ሕጂ ካብ ዝለመድክዎ ክፈላለይ ይኽእል። ኣካል ቀስ ብቐስ ናብቲ ሓድሽ ሆርሞናዊ ሚዛን ክላመድ ይኽእል።',
    tip1Title: 'ምፍላጥ ጽቡቕ',
    tip1Text:
      'ድሕሪ ምጅማር ሓደ ኣገባብ ብቕልጡፍ ዝርአ ሳዕቤን ብግዜ ክዕቀብ ይግበኦ። እንተ ኣጨናኒቑ ወይ እንተ ቀጸለ፣ ምስ ክኢላ ጥዕና ተዛረብ።',
    body4:
      'ብዛዕባ ለውጢታት ካብ ሓደ ዑደት ናብ ካልእ ንምክትታል ምልክታት ኣብ ኣፕሊኬሽንካ ምምዝጋብ ክሕግዝ ይኽእል።',
    trackingTitle: 'ለውጢ ምክትታል',
    trackingSubtitle: 'ገለ ምልክታት ክሕግዙ ይኽእሉ',
    trackingLines: [
      'እቲ ምልክት ዝተራእየሉ ዕለት ጽሓፍ።',
      'ጽንዓቱን ጸንሖቱን መዝግብ።',
      'ይሓይሽ ወይ ይሓምም ከም ዘሎ ዓዪ።',
    ],
    body5:
      'ኩሎም ምልክታት ብዘይ ጥርጥር ምስ ምክልኻል ጥንሲ ኣይተኣሳሰሩን። ጭንቀት፣ ድቃስ፣ ምግቢ፣ ዑደትካ፣ ወይ ካልእ ሕክምናታት’ውን ኣብ ዝስማዕካ ክጸሉ ይኽእሉ።',
    body6:
      'ኩነታት ንምርዳእ፣ ሓደ ምልክት ጥራይ ብፍላይ ኢልካ ምርኣይ ኣብ ክንዲ እቲ ሓፈሻዊ ኩነታት ርኣይ።',
    worthMentioning: [
      'ዝጸንሑ ጉሉሓት ለውጢ ስምዒት',
      'ዘጨንቐካ ምንካይ ድሌት ጾታዊ',
      'ልዕሊ 3 ዑደታት ዝጸንሐ ዘይመደበኛ ደም ምፍሳስ',
      'ዘጨንቑ ዝቀጸሉ ምግላል ወይ ቁርጽምጥም ርእሲ',
    ],
    questionsTitle: 'ገለ ጠቓሚ ሕቶታት',
    questions: [
      'እዞም ምልክታት ክሳብ ክንደይ ግዜ ኮይኖም?',
      'ድሕሪ ምጅማር ወይ ምቕያር ኣገባብ ምክልኻል ጥንሲ ተራእዮም ዶ?',
      'ቀሊላት፣ ዘጨንቑ፣ ወይስ ንዓኻ ብሓቂ ዘይልሙዳት እዮም?',
      'ብግዜ ይሓይሹ ኣለዉ ወይስ ዝያዳ ይበዝሑ ኣለዉ?',
    ],
    body7:
      'ሓደ ምልክት ህጹጽ እንተዘይኰነ’ውን፣ እንተ ኣጨናኒቑ፣ እንተ ቀጸለ፣ ወይ ብሓቂ ጽሬት ህይወትካ እንተ ጸሊኡ ምዝርራብ ዋጋ ኣለዎ።',
    infoTitle: 'ምዕዳል ምሕታት ዋጋ ክህልዎ ይኽእል እንተ…',
    infoText:
      'ምልክታት እንተ ቀጺሎም፣ እንተ ዓቢዮም፣ ወይ ብመደበኛ ከይትነብሪ እንተ ዓጺዮምኻ።',
    body8:
      'ሓኪም፣ ሚድዋይፍ፣ ወይ ፋርማሲስት እቶም ምልክታት ምስቲ እትጥቀመሉ ኣገባብ ዝተኣሳሰሩ እዮም ወይ ኣይኰኑን፣ ከምኡ’ውን ክስተኻኸል ኣለዎ ወይ ኣይነበሮን ንምውሳን ክሕግዙኻ ይኽእሉ።',
    body9:
      'ገሊኦም ምልክታት ዘይልሙዳት እዮም፣ ህጹጽ ሕክምናዊ ግምገማ’ውን የድልዩ። ብርግጽ ጸገም ኣሎ ማለት ኣይኰነን፣ ግን ክተሓሓዙ የብሎምን።',
    alertTitle: 'ብቕልጡፍ ሓገዝ ጥዕና ሕተት',
    alertIntro: 'እዞም ዝስዕቡ ምልክታት እንተ ኣጋጢምካ ብቕልጡፍ ሕክምናዊ ምኽሪ ሕተት፦',
    urgentSigns: [
      'ዓቢ ወይ ዘይልሙድ ቃንዛ ሰፍሖ',
      'ድንገት ምትንፋስ ጽገም',
      'ኣብ እግሪ ዘይልሙድ ምሕባጥ ወይ ቃንዛ',
      'ድንገታዊ፣ ብጣዕሚ ኩሩዕ፣ ወይ ዘይልሙድ ቁርጽምጥም ርእሲ',
      'ድንገት ኣብ ርእየት፣ ዘረባ፣ ወይ ሓይሊ ጸገም',
    ],
    emergencyTitle: 'ኣብ ከቢድ ኩነታት',
    emergencyText:
      'ምልክታት ድንገታዊ፣ ብጣዕሚ ከቢዳት፣ ወይ ምስ ምትንፋስ ጽገም፣ ምድንጋጽ፣ ወይ ካልእ ከቢድ ምልክት እንተ መጺኦም፣ ህጹጽ ሕክምናዊ ሓገዝ ሕተት።',
    summaryTitle: 'ቀንዲ ነጥብታት',
    summaryItems: [
      'ገሊኦም ሳዕቤናት ኣብ ጅማሬ ሓድሽ ሆርሞናዊ ኣገባብ ምክልኻል ጥንሲ ክረኣዩ ይኽእሉ።',
      'ብዙሓት ሳዕቤናት ግዝያውያን እዮም፣ ብግዜ’ውን ክንእሱ ይኽእሉ።',
      'ዘጨንቅ ወይ ዝቀጸለ ምልክት ምስ ክኢላ ምዝርራብ ዋጋ ኣለዎ።',
      'ገሊኦም ዘይልሙዳት ምልክታት ህጹጽ ሕክምናዊ ምኽሪ የድልዩ።',
    ],
    finalTipTitle: 'ቀንዲ ነጥቢ',
    finalTipText:
      'ንኣካልካ ምስማዕ ብቕልጡፍ ኣገባብ ምቋራጽ ማለት ኣይኰነን። እንታይ ከም ዝስምዓካ ጽሓፍ፣ ከመይ ከም ዝቕየር ዓዪ፣ ሓደ ምልክት ምስ ኣሻቐለካ ድማ ምኽሪ ሕተት።',
    disclaimerText:
      'እዚ ጽሑፍ ንኣፍልጦ ዝተዳለወ እዩ፣ ውልቃዊ ሕክምናዊ ምኽሪ ድማ ኣይትክእን። ዓቢ ወይ ዘይልሙድ ምልክት እንተ ኣለካ፣ ካብ ክኢላ ጥዕና ምኽሪ ሕተት።',
    shareMessage: 'ክፍጠሩ ዝኽእሉ ጎድኒ ሳዕቤናት ምልላይ — AWA',
  },
  rw: {
    badge: 'INGARUKA',
    title: 'Kumenya ingaruka\nzishobora kubaho',
    metaDuration: 'Gusoma bitwara iminota 8',
    metaType: 'Inkuru',
    metaLevel: 'Hagati',
    metaValidated: 'Ibikubiyemo byasuzumwe',
    intro:
      'Zimwe mu ngaruka zishobora kuba zisanzwe kandi z\'igihe gito. Izindi zisaba kwitabwaho cyane. Menya gutandukanya ibisanzwe n\'ibimenyetso bikwiye gusuzumwa.',
    contentsTitle: 'Muri iyi nkuru',
    topics: [
      'Ingaruka zisanzwe kandi zoroheje',
      'Igihe umubiri wimenyereza',
      'Kwitegereza ibihinduka',
      'Igihe cyo gusaba inama z\'ubuvuzi',
      'Igihe cyo kwivuza vuba',
      'Ingingo z\'ingenzi',
    ],
    body1:
      'Iyo umuntu atangiye uburyo bushya bwo kuboneza urubyaro bukoresha hormone, umubiri ushobora gukenera igihe cyo kwimenyereza. Impinduka nto zishobora kugaragara mu mihango, mu marangamutima, cyangwa mu buzima bw\'umubiri.',
    body2:
      'Izi ngaruka akenshi ziba zoroheje kandi zishobora kugenda zigabanuka buhoro buhoro. Kuba zihari ntibivuze ko uburyo bukoreshwa ari bubi cyangwa ko bugomba guhagarikwa.',
    commonEffects: [
      {
        title: 'Kuva amaraso make',
        text: 'Kuva amaraso bidasanzwe bishobora kubaho, cyane cyane mu ntangiriro y\'uburyo bushya.',
      },
      {
        title: 'Kubabara amabere',
        text: 'Amabere ashobora kumera nk\'ayuzuye cyangwa kubabara by\'igihe gito.',
      },
      {
        title: 'Amarangamutima',
        text: 'Bamwe babona impinduka mu marangamutima cyangwa kumva cyane ibintu.',
      },
      {
        title: 'Kubabara umutwe',
        text: 'Kubabara umutwe koroheje bishobora kubaho mu gihe cyo kwimenyereza.',
      },
    ],
    body3:
      'Ibyumweru cyangwa imihango ya mbere bishobora gutandukana n\'ibyo wari umenyereye mbere. Umubiri ushobora kwimenyereza buhoro buhoro ku buringanire bushya bwa hormone.',
    tip1Title: 'Byiza kumenya',
    tip1Text:
      'Ingaruka igaragaye nyuma gato yo gutangira uburyo ikwiye gukurikiranwa uko igihe gishira. Niba ibabaje cyangwa ikomeje, vugana n\'umuhanga mu buzima.',
    body4:
      'Bishobora kugufasha kwandika ibimenyetso muri porogaramu kugira ngo ukurikirane neza uko bihinduka kuva ku mihango ujya ku yindi.',
    trackingTitle: 'Kurikirana uko bihinduka',
    trackingSubtitle: 'Utuntu duke dushobora gufasha',
    trackingLines: [
      'Andika itariki ikimenyetso cyagaragayeho.',
      'Andika uburemere bwacyo n\'igihe cyamaze.',
      'Reba niba cyoroha cyangwa kirushaho kuba kibi.',
    ],
    body5:
      'Ibimenyetso byose ntibifitanye isano n\'uburyo bwo kuboneza urubyaro. Umunaniro, ibitotsi, imirire, imihango yawe, cyangwa indi miti na byo bishobora kugira ingaruka ku buryo wumva umeze.',
    body6:
      'Kugira ngo wumve imimerere, gerageza kureba ishusho rusange aho gushingira ku kimenyetso kimwe gusa.',
    worthMentioning: [
      'Impinduka zikomeye kandi zihoraho mu marangamutima',
      'Kugabanuka k\'icyifuzo cy\'imibonano kikubangamira',
      'Kuva amaraso bidasanzwe kumara imihango irenga 3',
      'Iseseme cyangwa kubabara umutwe bikomeza kukubangamira',
    ],
    questionsTitle: 'Ibibazo bike byafasha',
    questions: [
      'Ibi bimenyetso bimaze igihe kingana iki?',
      'Byagaragaye nyuma yo gutangira cyangwa guhindura uburyo bwo kuboneza urubyaro?',
      'Ni bworoshye, bukubangamira, cyangwa ni ibidasanzwe kuri wowe koko?',
      'Biragenda bigabanuka uko igihe gishira cyangwa biragenda biba byinshi?',
    ],
    body7:
      'Nubwo ikimenyetso kitaba cyihutirwa, byaba byiza kukivugaho iyo kikubangamira, gikomeje, cyangwa kigira ingaruka ku buzima bwawe bwa buri munsi.',
    infoTitle: 'Byaba byiza gusaba inama niba…',
    infoText:
      'ibimenyetso bikomeje, birushaho gukomera, cyangwa bikubuza kubaho nk\'uko bisanzwe.',
    body8:
      'Muganga, umubyaza, cyangwa umufarumasiye ashobora kugufasha kumenya niba ibimenyetso bishobora kuba bifitanye isano n\'uburyo ukoresha n\'niba bugomba guhindurwa.',
    body9:
      'Ibimenyetso bimwe ntibisanzwe kandi bisaba gusuzumwa n\'abaganga vuba. Ntibivuze byanze bikunze ko hari ikibazo gikomeye, ariko ntibigomba kwirengagizwa.',
    alertTitle: 'Kwivuza vuba',
    alertIntro: 'Saba inama z\'ubuvuzi vuba niba ugize by\'umwihariko:',
    urgentSigns: [
      'Kubabara cyane cyangwa bidasanzwe mu gituza',
      'Guhumeka bigoye gitunguranye',
      'Kubyimba cyangwa kubabara bidasanzwe mu kuguru',
      'Kubabara umutwe gitunguranye, gukabije, cyangwa bidasanzwe',
      'Ibibazo bitunguranye mu kureba, mu kuvuga, cyangwa mu mbaraga',
    ],
    emergencyTitle: 'Mu gihe cy\'imimerere ikomeye',
    emergencyText:
      'Niba ibimenyetso bije gitunguranye, ari bikomeye cyane, cyangwa biherekejwe no guhumeka bigoye, kumva ushaka guta ubwenge, cyangwa ikindi kimenyetso gikomeye, shaka ubutabazi bw\'ubuvuzi bwihuse.',
    summaryTitle: 'Iby\'ingenzi',
    summaryItems: [
      'Ingaruka zimwe zishobora kugaragara mu ntangiriro y\'uburyo bushya bwo kuboneza urubyaro bukoresha hormone.',
      'Ingaruka nyinshi ni iz\'igihe gito kandi zishobora kugabanuka uko igihe gishira.',
      'Ikimenyetso kibangamira cyangwa gikomeje cyaba cyiza kivuzwe n\'umuhanga.',
      'Ibimenyetso bimwe bidasanzwe bisaba inama z\'ubuvuzi vuba.',
    ],
    finalTipTitle: 'Ingingo y\'ingenzi',
    finalTipText:
      'Kumva umubiri wawe ntibivuze byanze bikunze guhita uhagarika uburyo. Andika ibyo wumva, kurikirana uko bihinduka, kandi usabe inama igihe cyose ikimenyetso kigutera impungenge.',
    disclaimerText:
      'Iyi nkuru igamije gutanga amakuru kandi ntisimbura inama z\'ubuvuzi zihariye. Niba ufite ikimenyetso gikomeye cyangwa kidasanzwe, saba inama umuhanga mu buzima.',
    shareMessage: 'Kumenya ingaruka zishobora kubaho — AWA',
  },
  rn: {
    badge: 'ICO IKORA',
    title: 'Kumenya ingaruka\nzishobora kubaho',
    metaDuration: 'Isomwa rya iminota 8',
    metaType: 'Inyandiko',
    metaLevel: 'Hagati',
    metaValidated: 'Ibikorwa byasuzumwe',
    intro:
      'Zimwe mu ngaruka zirashobora kuba zisanzwe kandi z’akanya gato. Izindi zisaba kwitonderwa cane. Menya gutandukanya ivyo umubiri ukunda gukora n’ibimenyetso bikwiye gusuzumwa.',
    contentsTitle: 'Muri iyi nyandiko',
    topics: [
      'Ingaruka zisanzwe, zoroheje',
      'Igihe umubiri wimenyereza',
      'Kwitegereza ivyo bihinduka',
      'Igihe co gusaba inama z’abaganga',
      'Igihe cyo kuja kwa muganga vuba',
      'Ivy’ingenzi wibuka',
    ],
    body1:
      'Umuntu atangura uburyo bushasha bwa contraception ya hormone, umubiri ushobora gukenera akanya kugira wimenyereze. Impinduka nto zishobora kugaragara mu mihango, mu mutima canke mu mererwe y’umubiri.',
    body2:
      'Izo ngaruka akenshi ziba zoroheje kandi zishobora kugabanuka buhoro buhoro. Kuba zihari ntibisobanura ko ubwo buryo buteye akaga canke ko bukwiye guhagarikwa.',
    commonEffects: [
      {
        title: 'Amaraso make',
        text: 'Amaraso adahoraho ashobora kuboneka, cane cane mu ntango y’uburyo bushasha.',
      },
      {
        title: 'Kuribwa amabere',
        text: 'Amabere ashobora kwumva afunze canke arwaye mu kanya gato.',
      },
      {
        title: 'Umutima',
        text: 'Bamwe bitegereza impinduka mu mutima canke gukunda kurira cane.',
      },
      {
        title: 'Kuribwa umutwe',
        text: 'Umutwe woroheje ushobora kuboneka mu gihe c’imenyerezwa.',
      },
    ],
    body3:
      'Ibyumweru canke imihango ya mbere bishobora gutandukana n’ivyo wari wimenyereye. Umubiri ushobora kwimenyereza buhoro buhoro kuri hormone nshasha.',
    tip1Title: 'Ni vyiza kumenya',
    tip1Text:
      'Ingaruka ibonetse nyuma yo gutangura uburyo ikwiye kwitegerezwa uko iminsi igenda. Iyo ibaye ikibazo canke ikaguma, vugana n’umuganga.',
    body4:
      'Ni vyiza kwandika ibimenyetso muri porogaramu yawe kugira umenye neza uko bihinduka kuva mu mihango umwe ukaja mu wundi.',
    trackingTitle: 'Rondera uko bigenda bihinduka',
    trackingSubtitle: 'Ibimenyetso bike bishobora gufasha',
    trackingLines: [
      'Andika itariki ikimenyetso catangiriyeko.',
      'Andika uko gikomeye n’igihe kimaze.',
      'Itegereze niba gitera imbere canke gikomera.',
    ],
    body5:
      'Ibimenyetso vyose ntibijanye na contraception. Guhagarika umutima, ibitotsi, ivyo urya, imihango yawe, canke indi miti na vyo bishobora guhindura uko wumva.',
    body6:
      'Kugira usobanukirwe n’ikibazo, gerageza kurora ibintu vyose hamwe aho kurora ikimenyetso kimwe gusa.',
    worthMentioning: [
      'Impinduka z’umutima zigaragara kandi zihoraho',
      'Kugabanuka kw’icipfuzo ca libido kikubabaza',
      'Amaraso adahoraho amara imihango irenga 3',
      'Isesemi canke umutwe bikomeza kukubabaza',
    ],
    questionsTitle: 'Ibibazo bikeya bifasha',
    questions: [
      'Ibi bimenyetso bimaze igihe kingana iki?',
      'Vyatanguye nyuma yo gutangura canke guhindura uburyo bwa contraception?',
      'Biroroshe, biraguhangayikishije, canke biratangaje kuri wewe?',
      'Biragenda biroroha uko iminsi igenda canke biragenda bigaruka kenshi?',
    ],
    body7:
      'Naho ikimenyetso kitihutirwa, gishobora kuba ngombwa kukivuganako iyo kibaye ikibazo, kiguma, canke gihindura mu vy’ukuri imibereho yawe.',
    infoTitle: 'Birashobora kuba vyiza gusaba inama iyo…',
    infoText:
      'ibimenyetso biguma, bigakomera, canke bikubuza kubaho bisanzwe.',
    body8:
      'Muganga, umubyaaza, canke umuntu w’imiti arashobora kugufasha kumenya niba ibimenyetso bishobora kuba bijanye n’uburyo ukoresha, no kumenya niba bukwiye guhindurwa.',
    body9:
      'Ibimenyetso bimwe ntibisanzwe kandi bisaba gusuzumwa vuba n’umuganga. Ntibisobanura ko hariho ingorane, ariko ntibikwiye kwirengagizwa.',
    alertTitle: 'Ja kwa muganga vuba',
    alertIntro: 'Saba inama z’abaganga vuba iyo ufise, cane cane:',
    urgentSigns: [
      'Kuribwa igikomo kinini canke kitamenyerewe',
      'Kubura umwuka mu buryo butunguranye',
      'Kubyimba canke kuribwa ukuguru mu buryo butamenyerewe',
      'Umutwe utunguranye, ukomeye cane canke utamenyerewe',
      'Ingorane zitunguranye zo kubona, kuvuga canke imbaraga',
    ],
    emergencyTitle: 'Mu gihe c’ikibazo gikomeye',
    emergencyText:
      'Ibimenyetso nibiba bitunguranye, bikomeye cane, canke bijanye no kubura umwuka, kwumva ugiye kugwa, canke ikindi kimenyetso gikomeye, saba ubufasha bwihuse bw’abaganga.',
    summaryTitle: 'Iby’ingenzi',
    summaryItems: [
      'Zimwe mu ngaruka zishobora kugaragara mu ntango y’uburyo bushasha bwa contraception ya hormone.',
      'Ingaruka nyinshi ni iz’akanya gato kandi zishobora kugabanuka uko iminsi igenda.',
      'Ikimenyetso kibangamira canke kiguma kikwiye kuvugwako n’umuhanga.',
      'Ibimenyetso bimwe bidasanzwe bisaba inama z’abaganga vuba.',
    ],
    finalTipTitle: 'Icingenzi wibuka',
    finalTipText:
      'Kwumviriza umubiri wawe ntibisobanura buri gihe guhagarika uburyo ako kanya. Andika ico wumva, itegereze uko gihinduka, kandi usabe inama igihe cose ikimenyetso kiguhangayikishije.',
    disclaimerText:
      'Iyi nyandiko ni iyo kumenyesha kandi ntisimbura inama z’abaganga zihariye. Iyo ufise ikimenyetso gikomeye canke kidasanzwe, saba inama umuhanga mu vy’ubuzima.',
    shareMessage: 'Kumenya ingaruka zishobora kubaho — AWA',
  },
  ig: {
    badge: 'MMETỤTA NA-EME NA NKE',
    title: 'Ịmata mmetụta ndị nwere\nike ime n\'akụkụ',
    metaDuration: 'Ọgụgụ nke nkeji 8',
    metaType: 'Edemede',
    metaLevel: 'Etiti',
    metaValidated: 'Ọdịnaya a nyochara',
    intro:
      'Ụfọdụ mmetụta nwere ike ịbụ ihe a na-ahụkarị ma na-adịghị ogologo. Ndị ọzọ chọrọ nlebara anya karịa. Mụta ịmata ọdịiche dị n\'etiti mmeghachi omume ndị a na-ahụkarị na ihe ịrịba ama kwesịrị ka a nyochaa.',
    contentsTitle: 'N\'edemede a',
    topics: [
      'Mmetụta dị nro, ndị a na-ahụkarị',
      'Oge ahụ na-eme mgbanwe',
      'Ịlele ihe na-agbanwe',
      'Mgbe ị kwesịrị ịjụ ndụmọdụ dọkịta',
      'Mgbe ị kwesịrị ịchọ enyemaka ngwa ngwa',
      'Isi ihe ịkwesịrị ichetara',
    ],
    body1:
      'Mgbe mmadụ malitere ụzọ ịkpachara anya ịtụrụ ime nke hormone ọhụrụ, ahụ nwere ike ịchọ oge ụfọdụ iji gbanwee. Obere mgbanwe nwere ike pụta n\'ime cycle, mmụọ, ma ọ bụ nkasi obi ahụ.',
    body2:
      'Mmetụta ndị a na-adịkarị nro ma nwee ike ibelata nwayọ nwayọ. Ịdị adị ha apụtaghị na ụzọ ahụ dị ize ndụ ma ọ bụ na ọ kwesịrị ịkwụsị.',
    commonEffects: [
      {
        title: 'Obere ọbara',
        text: 'Ọbara na-adịghị n\'usoro nwere ike ịpụta, karịsịa n\'mmalite nke ụzọ ọhụrụ.',
      },
      {
        title: 'Mgbu ara',
        text: 'Ọ nwere ike ịbụ na a ga-enwe mmetụta ara ịtụsi ike ma ọ bụ mgbu n\'oge ruru obere.',
      },
      {
        title: 'Mmụọ',
        text: 'Ụfọdụ mmadụ na-ahụ mgbanwe na mmụọ ma ọ bụ mmetụta nke na-abawanye.',
      },
      {
        title: 'Isi ọwụwa',
        text: 'Isi ọwụwa dị nro nwere ike ịpụta n\'oge ahụ na-agbanwe.',
      },
    ],
    body3:
      'Izu ole na ole mbụ ma ọ bụ cycle ole na ole mbụ nwere ike ịdị iche ka ihe ị na-emebu. Ahụ nwere ike ịgbanwe nwayọ nwayọ n\'ọnọdụ hormone ọhụrụ.',
    tip1Title: 'Mara nke a',
    tip1Text:
      'Mmetụta pụtara obere oge ka e malitechara ụzọ bụ nke kwesịrị ilele ya ka oge na-aga. Ọ bụrụ na ọ na-akpata nsogbu ma ọ bụ na-adịgide, gwa onye ọrụ ahụike okwu.',
    body4:
      'Ọ nwere ike inye aka ide mgbaàmà n\'ngwa gị iji soro ka ha si agbanwe site na cycle gaa na cycle ọzọ.',
    trackingTitle: 'Soro ka ihe si agbanwe',
    trackingSubtitle: 'Ọtụtụ ihe ọmụmụ nwere ike inye aka',
    trackingLines: [
      'Dee ụbọchị mgbaàmà ahụ pụtara.',
      'Dee ike ya na ogologo oge ọ dịruru.',
      'Lee ma ọ na-eme nke ọma ma ọ bụ ma ọ na-akawanye njọ.',
    ],
    body5:
      'Ọ bụghị mgbaàmà niile ka ejikọtara na ịkpachara anya ịtụrụ ime. Nrụgide, ụra, nri, cycle gị, ma ọ bụ ọgwụgwọ ndị ọzọ nwekwara ike imetụta otú ị na-ahụ onwe gị.',
    body6:
      'Ijighọta ọnọdụ ahụ, gbalịa ilebakwa anya n\'ọnọdụ niile kama ịlele otu mgbaàmà naanị ya.',
    worthMentioning: [
      'Mgbanwe pụtara ìhè, na-adịgide na mmụọ',
      'Mbelata ọchịchọ mmekọahụ nke na-akpata gị nsogbu',
      'Ọbara na-adịghị n\'usoro nke dị ogologo karịa cycle 3',
      'Ọgbụgbọ ma ọ bụ isi ọwụwa ndị na-aga n\'ihu na-akpata nsogbu',
    ],
    questionsTitle: 'Ajụjụ ole na ole bara uru',
    questions: [
      'Kemgbe oge ole ka mgbaàmà ndị a na-adị?',
      'Ha ọ pụtara mgbe ịmalitechara ma ọ bụ gbanwee ụzọ ịkpachara anya ịtụrụ ime?',
      'Ha dị nro, na-akpata nsogbu, ka ha dị iche n\'ezie maka gị?',
      'Ha ọ na-eme nke ọma ka oge na-aga ka ha na-abawanye ugboro ugboro?',
    ],
    body7:
      'Ọbụna mgbe mgbaàmà abụghị ihe ngwa ngwa, ọ bara uru ikwurita ya ma ọ bụrụ na ọ na-akpata nsogbu, na-adịgide, ma ọ bụ na-emetụta ezigbo ndụ gị n\'ezie.',
    infoTitle: 'O nwere ike ịbara gị uru ịjụ ndụmọdụ ma ọ bụrụ na…',
    infoText:
      'mgbaàmà na-adịgide, na-aghọwanye ihe dị mkpa, ma ọ bụ na-egbochi gị ibi ndụ dị ka ọ na-adị.',
    body8:
      'Dọkịta, onye na-azụ nwa (midwife), ma ọ bụ onye na-ere ọgwụ nwere ike inyere gị aka ịchọpụta ma mgbaàmà ndị ahụ nwere ike ịbụ nke jikọtara na ụzọ ị na-eji, na ma ọ kwesịrị ka a gbanwee ya.',
    body9:
      'Ụfọdụ ihe ịrịba ama dị iche ma chọọ nyocha ahụike ngwa ngwa. Ha apụtaghị n\'ezie na nsogbu adịla, mana a ghaghị ileghara ha anya.',
    alertTitle: 'Chọọ enyemaka ngwa ngwa',
    alertIntro: 'Jụọ ndụmọdụ ahụike ngwa ngwa ma ọ bụrụ na ị nwere, karịsịa:',
    urgentSigns: [
      'Mgbu obi dị ukwuu ma ọ bụ dị iche',
      'Nsogbu iku ume mberede',
      'Ọzịza ma ọ bụ mgbu dị iche n\'ụkwụ',
      'Isi ọwụwa mberede, dị oke ike, ma ọ bụ dị iche',
      'Nsogbu mberede n\'ịhụ ụzọ, n\'ikwu okwu, ma ọ bụ n\'ike',
    ],
    emergencyTitle: 'Ma ọ bụrụ na ọnọdụ siri ike',
    emergencyText:
      'Ọ bụrụ na mgbaàmà pụtara mberede, siri ike nke ukwuu, ma ọ bụ soro nsogbu iku ume, ọmịiko ịda, ma ọ bụ ihe ịrịba ama ọzọ dị oke njọ, chọọ enyemaka ahụike ozugbo.',
    summaryTitle: 'Isi ihe',
    summaryItems: [
      'Ụfọdụ mmetụta nwere ike ịpụta n\'mmalite nke ụzọ ọhụrụ nke ịkpachara anya ịtụrụ ime site na hormone.',
      'Ọtụtụ mmetụta adịghị ogologo oge ma nwee ike ibelata ka oge na-aga.',
      'Mgbaàmà na-akpata nsogbu ma ọ bụ na-adịgide bara uru ikwurita ya na onye ọkachamara.',
      'Ụfọdụ ihe ịrịba ama dị iche chọrọ ndụmọdụ ahụike ngwa ngwa.',
    ],
    finalTipTitle: 'Isi ihe ịkwesịrị ichetara',
    finalTipText:
      'Ige ntị n\'ahụ gị apụtaghị n\'ezie ịkwụsị ụzọ ozugbo. Dee ihe ị na-enwe, lelee ka o si agbanwe, ma jụọ ndụmọdụ mgbe ọ bụla mgbaàmà na-echegbu gị.',
    disclaimerText:
      'Edemede a bụ maka ozi ma anaghị anọchi ndụmọdụ ahụike nke onye ọ bụla. Ọ bụrụ na ị nwere mgbaàmà dị ukwuu ma ọ bụ dị iche, jụọ ndụmọdụ n\'aka onye ọrụ ahụike.',
    shareMessage: 'Ịmata mmetụta ndị nwere ike ime n\'akụkụ — AWA',
  },
  yo: {
    badge: 'ÀWỌN ÌPA ÀÌLÈRA',
    title: 'Mímọ àwọn ipa àìlera\ntó ṣeé ṣe',
    metaDuration: 'Ìṣẹ́jú 8 láti kà',
    metaType: 'Àpilẹ̀kọ',
    metaLevel: 'Àárín',
    metaValidated: 'Àkóónú tí a ti ṣàyẹ̀wò',
    intro:
      'Àwọn ipa kan lè wọ́pọ̀ kí wọ́n sì jẹ́ ti ìgbà díẹ̀. Àwọn mìíràn nílò àfiyèsí sí i. Kọ́ bí a ṣe ń mọ ìyàtọ̀ láàrin àwọn ìhùwàsí àtẹ̀yìnwá àti àwọn àmì tó yẹ kí a ṣàyẹ̀wò.',
    contentsTitle: 'Nínú àpilẹ̀kọ yìí',
    topics: [
      'Àwọn ipa tó wọ́pọ̀, tí kò le',
      'Àkókò tí ara ń bá ara mu',
      'Ṣíṣàkíyèsí ohun tó ń yípadà',
      'Ìgbà tí a ó wá ìmọ̀ràn dókítà',
      'Ìgbà tí a ó wá ìtọ́jú kíákíá',
      'Àwọn kókó pàtàkì',
    ],
    body1:
      'Nígbà tí ẹnìkan bá bẹ̀rẹ̀ ọ̀nà ìdènà oyún hormone tuntun, ara lè nílò àkókò díẹ̀ láti bá a mu. Àwọn àyípadà kéékèèké lè hàn nínú ìyípo oṣù, ìṣesí, tàbí ìtura ara.',
    body2:
      'Àwọn ipa wọ̀nyí sábà máa ń jẹ́ aláìle, wọ́n sì lè dínkù díẹ̀díẹ̀. Wíwà wọn kò túmọ̀ sí pé ọ̀nà náà léwu tàbí pé ó yẹ kí a dáwọ́ rẹ̀ dúró.',
    commonEffects: [
      {
        title: 'Ẹ̀jẹ̀ díẹ̀',
        text: 'Ẹ̀jẹ̀ àìtò lè wáyé, pàápàá ní ìbẹ̀rẹ̀ ọ̀nà tuntun.',
      },
      {
        title: 'Ọmú ríro',
        text: 'Ọmú lílé tàbí ríro lè wáyé fún ìgbà díẹ̀.',
      },
      {
        title: 'Ìṣesí',
        text: 'Àwọn kan máa ń kíyèsí àyípadà ìṣesí tàbí ìmọ̀lára tó pọ̀ sí i.',
      },
      {
        title: 'Orí fífọ́',
        text: 'Orí fífọ́ aláìle lè wáyé ní àkókò tí ara ń bá a mu.',
      },
    ],
    body3:
      'Àwọn ọ̀sẹ̀ tàbí ìyípo oṣù díẹ̀ àkọ́kọ́ lè yàtọ̀ sí ohun tí o ti mọ̀ tẹ́lẹ̀. Ara lè bá ìwọ̀ntúnwọ̀nsì hormone tuntun mu díẹ̀díẹ̀.',
    tip1Title: 'Ó dára láti mọ̀',
    tip1Text:
      'Ipa tó hàn láìpẹ́ lẹ́yìn bíbẹ̀rẹ̀ ọ̀nà kan yẹ kí a máa wò lórí ìgbà. Bí ó bá di ìdààmú tàbí tí ó bá ń wà títí, bá oníṣẹ́ ìlera sọ̀rọ̀.',
    body4:
      'Ó lè wúlò láti kọ àwọn àmì àìsàn sílẹ̀ nínú ìṣàfilọ́lẹ̀ rẹ kí o lè tọpa bí wọ́n ṣe ń yípadà láti ìyípo oṣù kan sí òmíràn.',
    trackingTitle: 'Tọpa bí nǹkan ṣe ń yípadà',
    trackingSubtitle: 'Àwọn àmì díẹ̀ lè wúlò',
    trackingLines: [
      'Kọ ọjọ́ tí àmì àìsàn náà hàn sílẹ̀.',
      'Kọ bí ó ti le tó àti bí ó ti pẹ́ tó.',
      'Ṣàkíyèsí bóyá ó ń dára sí i tàbí ó ń burú sí i.',
    ],
    body5:
      'Kì í ṣe gbogbo àmì àìsàn ni ó jẹ mọ́ ìdènà oyún. Wàhálà, oorun, oúnjẹ, ìyípo oṣù rẹ, tàbí àwọn ìtọ́jú mìíràn tún lè nípa lórí bí o ṣe ń rí.',
    body6:
      'Láti lóye ipò náà, gbìyànjú láti wo gbogbo àyíká dípò àmì àìsàn kan ṣoṣo lọ́tọ̀.',
    worthMentioning: [
      'Àyípadà ìṣesí tó hàn gbangba tí ó sì ń wà títí',
      'Ìdínkù ìfẹ́ ìbálòpọ̀ tó ń yọ ọ́ lẹ́nu',
      'Ẹ̀jẹ̀ àìtò tó pẹ́ ju ìyípo oṣù 3 lọ',
      'Ríru tàbí orí fífọ́ tó ṣì ń yọ ni lẹ́nu',
    ],
    questionsTitle: 'Àwọn ìbéèrè díẹ̀ tó wúlò',
    questions: [
      'Báwo ni àwọn àmì àìsàn wọ̀nyí ti pẹ́ tó?',
      'Ṣé wọ́n hàn lẹ́yìn bíbẹ̀rẹ̀ tàbí yíyí ọ̀nà ìdènà oyún padà?',
      'Ṣé wọ́n jẹ́ aláìle, ń yọ ọ́ lẹ́nu, tàbí àìwọ́pọ̀ lóòótọ́ fún ọ?',
      'Ṣé wọ́n ń dára sí i lórí ìgbà tàbí wọ́n ń pọ̀ sí i?',
    ],
    body7:
      'Kódà nígbà tí àmì àìsàn kò bá jẹ́ pàjáwìrì, ó lè tọ́ láti jíròrò rẹ̀ bí ó bá ń yọ ni lẹ́nu, tí ó bá ń wà títí, tàbí tí ó bá kan ìgbésí ayé rẹ lóòótọ́.',
    infoTitle: 'Ó lè tọ́ láti wá ìmọ̀ràn bí…',
    infoText:
      'àwọn àmì àìsàn bá ń wà títí, di pàtàkì sí i, tàbí dí ọ lọ́wọ́ láti gbé ayé déédé.',
    body8:
      'Dókítà, agbẹ̀bí, tàbí oníṣègùn oògùn lè ràn ọ́ lọ́wọ́ láti mọ̀ bóyá àwọn àmì àìsàn náà lè jẹ mọ́ ọ̀nà tí o ń lò àti bóyá ó yẹ kí a ṣàtúnṣe rẹ̀.',
    body9:
      'Àwọn àmì kan jẹ́ àìwọ́pọ̀, wọ́n sì béèrè ìṣàyẹ̀wò ìṣègùn kíákíá. Wọn kò túmọ̀ sí dandan pé ìṣòro kan wà, ṣùgbọ́n kò yẹ kí a ṣàìfiyèsí wọn.',
    alertTitle: 'Wá ìtọ́jú kíákíá',
    alertIntro: 'Wá ìmọ̀ràn ìṣègùn kíákíá bí o bá ní, ní pàtàkì:',
    urgentSigns: [
      'Ìrora àyà tó pọ̀ tàbí àìwọ́pọ̀',
      'Ìṣòro mímí lójijì',
      'Wíwú tàbí ìrora àìwọ́pọ̀ nínú ẹsẹ̀ kan',
      'Orí fífọ́ lójijì, tó le gan-an, tàbí àìwọ́pọ̀',
      'Ìṣòro lójijì pẹ̀lú ìríran, ọ̀rọ̀ sísọ, tàbí agbára',
    ],
    emergencyTitle: 'Nígbà ipò tó le',
    emergencyText:
      'Bí àwọn àmì àìsàn bá wáyé lójijì, tí wọ́n le gan-an, tàbí tí wọ́n bá wá pẹ̀lú ìṣòro mímí, ìmọ̀lára bí ẹni tí yóò dákú, tàbí àmì pàtàkì mìíràn, wá ìrànlọ́wọ́ ìṣègùn kíákíá.',
    summaryTitle: 'Àwọn kókó pàtàkì',
    summaryItems: [
      'Àwọn ipa kan lè hàn ní ìbẹ̀rẹ̀ ọ̀nà ìdènà oyún hormone tuntun.',
      'Ọ̀pọ̀ ipa jẹ́ ti ìgbà díẹ̀, wọ́n sì lè dínkù lórí ìgbà.',
      'Àmì àìsàn tó ń yọ ni lẹ́nu tàbí tó ń wà títí yẹ kí a jíròrò pẹ̀lú oníṣẹ́ ìlera.',
      'Àwọn àmì àìwọ́pọ̀ kan nílò ìmọ̀ràn ìṣègùn kíákíá.',
    ],
    finalTipTitle: 'Kókó pàtàkì',
    finalTipText:
      'Gbígbọ́ ara rẹ kò túmọ̀ sí dandan pé kí o dáwọ́ ọ̀nà kan dúró lẹ́sẹ̀kẹsẹ̀. Kọ ohun tí o ń rí sílẹ̀, ṣàkíyèsí bó ṣe ń yípadà, kí o sì bèèrè ìmọ̀ràn nígbàkigbà tí àmì àìsàn bá ń kó ọ lọ́kàn sókè.',
    disclaimerText:
      'Àpilẹ̀kọ yìí wà fún ìwífún nìkan kò sì rọ́pò ìmọ̀ràn ìṣègùn ti ara ẹni. Bí o bá ní àmì àìsàn tó pọ̀ tàbí àìwọ́pọ̀, wá ìmọ̀ràn lọ́dọ̀ oníṣẹ́ ìlera.',
    shareMessage: 'Mímọ àwọn ipa àìlera tó ṣeé ṣe — AWA',
  },
  zu: {
    badge: 'IZINDLELA EZINGAKHONA',
    title: 'Ukubona imiphumela\nengase ibe khona',
    metaDuration: 'Imizuzu emi-8 yokufunda',
    metaType: 'Isihloko',
    metaLevel: 'Maphakathi',
    metaValidated: 'Okuphonswe ukubukeleka',
    intro:
      'Eminye imiphumela ingajwayeleka futhi ibe yesikhashana. Eminye idinga ukunakwa kakhudlwana. Funda ukwahlukanisa phakathi kwezimpendulo ezijwayelekile nezimpawu okufanele zihlolwe.',
    contentsTitle: 'Kulesi sihloko',
    topics: [
      'Imiphumela ejwayelekile, emincane',
      'Isikhathi sokujwayela somzimba',
      'Ukubuka okushintshayo',
      'Ukuthi kufanele ucele iseluleko sezokwelapha nini',
      'Ukuthi kufanele ufune ukunakekelwa ngokushesha nini',
      'Amaphuzu abalulekile',
    ],
    body1:
      'Uma othile eqala indlela entsha yokuvimbela inzalo enamahomoni, umzimba ungadinga isikhathi ukuze ujwayele. Izinguquko ezincane zingavela esikhathini, emoyeni, noma ekududuzekeni komzimba.',
    body2:
      'Le miphumela ivame ukuba mincane futhi ingehla kancane kancane. Ukuba khona kwayo akusho ngokuzenzakalelayo ukuthi indlela iyingozi noma ukuthi kudingeka iyekwe.',
    commonEffects: [
      {
        title: 'Ukopha okuncane',
        text: 'Ukopha okungajwayelekile kungenzeka, ikakhulukazi ekuqaleni kwendlela entsha.',
      },
      {
        title: 'Ukuzwa izibele zibuhlungu',
        text: 'Ukuqina noma ubuhlungu bezibele kungezwakala isikhashana.',
      },
      {
        title: 'Isimo sengqondo',
        text: 'Abanye abantu baqaphela izinguquko zemizwa noma ukuzwela kakhulu ngokomzwelo.',
      },
      {
        title: 'Ikhanda elibuhlungu',
        text: 'Ikhanda elibuhlungu elincane lingenzeka phakathi nesikhathi sokujwayela.',
      },
    ],
    body3:
      'Amasonto okuqala noma imijikelezo yokuqala ingahluka kulokho obujwayele ngaphambili. Umzimba ungajwayela kancane kancane ibhalansi entsha yamahomoni.',
    tip1Title: 'Kuhle ukwazi',
    tip1Text:
      'Umphumela ovela ngokushesha ngemva kokuqala indlela ufanele ubhekwe ngokuhamba kwesikhathi. Uma uba nzima noma uqhubeka, khuluma nongochwepheshe wezempilo.',
    body4:
      'Kungasiza ukuqopha izimpawu ku-app yakho ukuze ubone kangcono ukuthi zishintsha kanjani kusuka emjikelezweni oya komunye.',
    trackingTitle: 'Landelela indlela izinto ezishintsha ngayo',
    trackingSubtitle: 'Ezinye izinkomba zingasiza',
    trackingLines: [
      'Qaphela usuku lapho uphawu lwavela.',
      'Qopha amandla aso nobude balo.',
      'Bheka ukuthi luyamelela noma luyabhibha.',
    ],
    body5:
      'Zonke izimpawu azihlangene ngempela nokuvimbela inzalo. Ukukhathazeka, ukulala, ukudla, umjikelezo wakho, noma ezinye izindlela zokwelashwa nazo zingathinta indlela ozizwa ngayo.',
    body6:
      'Ukuze uqonde isimo, zama ukubuka isimo sonke kunokubuka uphawu olulodwa lodwa.',
    worthMentioning: [
      'Izinguquko zemizwa ezicacile, eziqhubekayo',
      'Ukwehla kwesifiso sobulili okukukhathazayo',
      'Ukopha okungajwayelekile okuthatha imijikelezo engaphezu kwemi-3',
      'Isicanucanu noma ikhanda elibuhlungu eliqhubeka likukhathaza',
    ],
    questionsTitle: 'Imibuzo embalwa esizayo',
    questions: [
      'Lezi zimpawu sezithathe isikhathi esingakanani?',
      'Ingabe zavela ngemva kokuqala noma ukushintsha indlela yokuvimbela inzalo?',
      'Ingabe zincane, ziyakhathaza, noma azijwayelekile ngempela kuwe?',
      'Ingabe ziyathuthuka ngokuhamba kwesikhathi noma ziya ngokuvama?',
    ],
    body7:
      'Ngisho nalapho uphawu lungasheshi, kungaba kuhle ukulukhulumela uma luyakhathaza, luqhubeka, noma lunomthelela ngempela empilweni yakho.',
    infoTitle: 'Kungaba kuhle ukucela iseluleko uma…',
    infoText:
      'izimpawu ziqhubeka, ziba kakhulu, noma zikuvimbela ukuphila ngokujwayelekile.',
    body8:
      'Udokotela, umbelethisi, noma isazi sezemithi singakusiza unqume ukuthi izimpawu zingahle zihlangane nendlela oyisebenzisayo yini nokuthi idinga ukulungiswa yini.',
    body9:
      'Ezinye izimpawu azijwayelekile futhi zidinga ukuhlolwa ngokushesha ngezokwelapha. Akusho ngempela ukuthi kukhona inkinga, kodwa akufanele zinganakwa.',
    alertTitle: 'Cela usizo ngokushesha',
    alertIntro: 'Cela iseluleko sezokwelapha ngokushesha uma uzwa, ikakhulukazi:',
    urgentSigns: [
      'Ubuhlungu besifuba obukhulu noma obungajwayelekile',
      'Ukuphelelwa umoya ngokuzumayo',
      'Ukuvuvukala noma ubuhlungu okungajwayelekile ethangeni',
      'Ikhanda elibuhlungu elizumayo, elinamandla kakhulu, noma elingajwayelekile',
      'Ubunzima obuzumayo ekuboneni, ekukhulumeni, noma emandleni',
    ],
    emergencyTitle: 'Uma kunesimo esibi kakhulu',
    emergencyText:
      'Uma izimpawu ziza ngokuzumayo, zinamandla kakhulu, noma zihambisana nobunzima bokuphefumula, ukuzwa sengathi uzocinwa, noma esinye isibonakaliso esibi, cela usizo lwezokwelapha oluphuthumayo.',
    summaryTitle: 'Okubalulekile',
    summaryItems: [
      'Eminye imiphumela ingavela ekuqaleni kwendlela entsha yokuvimbela inzalo enamahomoni.',
      'Imiphumela eminingi iyesikhashana futhi ingehla ngokuhamba kwesikhathi.',
      'Uphawu oluhlupha noma oluqhubekayo lufanele lukhulunywe nongochwepheshe.',
      'Ezinye izimpawu ezingajwayelekile zidinga iseluleko sezokwelapha ngokushesha.',
    ],
    finalTipTitle: 'Isifundo esiyinhloko',
    finalTipText:
      'Ukulalela umzimba wakho akusho ngempela ukumisa indlela ngokushesha. Qaphela ozizwa ngakho, ubuke ukuthi kushintsha kanjani, bese ucela iseluleko noma nini uma uphawu lukukhathaza.',
    disclaimerText:
      'Lesi sihloko senzelwe ukwazisa futhi asithathi indawo yeseluleko sezokwelapha esikhethelwe wena. Uma unophawu olubalulekile noma olungajwayelekile, cela iseluleko kongochwepheshe wezempilo.',
    shareMessage: 'Ukubona imiphumela engase ibe khona — AWA',
  },
  xh: {
    badge: 'IMIPHUMELA EYONGEZELELWEYO',
    title: 'Ukuqonda imiphumo\nenokwenzeka',
    metaDuration: 'Imizuzu emi-8 yokufunda',
    metaType: 'Inqaku',
    metaLevel: 'Ephakathi',
    metaValidated: 'Umxholo ohlaziyiweyo',
    intro:
      'Eminye imiphumo inokuba yeqhelekileyo kwaye yethutyana. Eminye ifuna ingqwalaselo engakumbi. Funda ukwahlula phakathi kokusabela okuqhelekileyo nemiqondiso ekufuneka ihlolwe.',
    contentsTitle: 'Kweli nqaku',
    topics: [
      'Imiphumo eqhelekileyo, ethambileyo',
      'Ixesha lokuziqhelanisa komzimba',
      'Ukubona oko kutshintshayo',
      'Xa kufuneka ucele ingcebiso yezonyango',
      'Xa kufuneka ufune ukhathalelo ngokukhawuleza',
      'Amanqaku aphambili',
    ],
    body1:
      'Xa umntu eqala indlela entsha yokuthintela uzalo ene-hormone, umzimba ungafuna ixesha ukuziqhelanisa. Utshintsho oluncinci lunokuvela kumjikelo, kwimood, okanye kunqabiseko lomzimba.',
    body2:
      'Le miphumo ihlala ithambile kwaye inokuncipha ngokuthe ngcembe. Ubukho bayo ayithethi ngokuzenzekelayo ukuba indlela iyingozi okanye ukuba kufuneka iyekwe.',
    commonEffects: [
      {
        title: 'Ukopha okuncinci',
        text: 'Ukopha okungaqhelekanga kunokwenzeka, ngakumbi ekuqaleni kwendlela entsha.',
      },
      {
        title: 'Ukuvuvukala kwamabele',
        text: 'Ukuqina okanye ukuvuvukala kwamabele kunokuvakala okwethutyana.',
      },
      {
        title: 'Imood',
        text: 'Abanye abantu bayabona utshintsho kwimood okanye ukuvakalelwa ngakumbi.',
      },
      {
        title: 'Iintloko ezibuhlungu',
        text: 'Iintloko ezibuhlungu ezithambileyo zinokwenzeka ngexesha lokuziqhelanisa.',
      },
    ],
    body3:
      'Iiveki okanye imijikelo yokuqala inokwahluka koko wawuqhele ngaphambili. Umzimba unokuziqhelanisa ngokuthe ngcembe nesilinganiselo esitsha seehomoni.',
    tip1Title: 'Kulungile ukwazi',
    tip1Text:
      'Umphumo ovela kungekudala emva kokuqala indlela kufanelekile ukuba ujongwe ngokuhamba kwexesha. Ukuba uyakhathaza okanye uyaqhubeka, thetha nengcali yezempilo.',
    body4:
      'Kunokuba luncedo ukubhala iimpawu kwi-app yakho ukulandelela ngcono indlela etshintsha ngayo kumjikelo nomjikelo.',
    trackingTitle: 'Landelela indlela izinto ezitshintsha ngayo',
    trackingSubtitle: 'Iimpawu ezimbalwa zinokuba luncedo',
    trackingLines: [
      'Bhala umhla impawu ebonakale ngawo.',
      'Rekhoda ubukhulu nobude bayo.',
      'Jonga ukuba iyalunga okanye iyabuya iba mbi.',
    ],
    body5:
      'Ayizizo zonke iimpawu ezidibene nokuthintela uzalo ngokuqinisekileyo. Uxinzelelo, ukulala, ukutya, umjikelo wakho, okanye ezinye iindlela zokunyanga zinokuchaphazela indlela ovakalelwa ngayo.',
    body6:
      'Ukuqonda imeko, zama ukujonga imeko iphela kunokujonga impawu enye yodwa.',
    worthMentioning: [
      'Utshintsho olubalulekileyo, oluqhubekayo kwimood',
      'Ukuncipha kwenkanuko okukuphazamisayo',
      'Ukopha okungaqhelekanga okuthatha imijikelo engaphezu kwe-3',
      'Isicaphucaphu okanye iintloko ezibuhlungu eziqhubeka zikuphazamisa',
    ],
    questionsTitle: 'Imibuzo embalwa enomsebenzi',
    questions: [
      'Ezi mpawu zihleli ixesha elingakanani?',
      'Ingaba zivele emva kokuqala okanye ukutshintsha indlela yokuthintela uzalo?',
      'Ingaba zithambile, ziyakuphazamisa, okanye zingaqhelekanga ngokwenene kuwe?',
      'Ingaba ziyalunga ngokuhamba kwexesha okanye ziyaphindaphindeka?',
    ],
    body7:
      'Nokuba impawu ayikhawulezi, inokuba luncedo ukuxoxa ngayo ukuba iyakuphazamisa, iyaqhubeka, okanye ichaphazela ngokwenene umgangatho wobomi bakho.',
    infoTitle: 'Kunokuba luncedo ukufumana ingcebiso ukuba…',
    infoText:
      'iimpawu ziyaqhubeka, ziba zinkulu, okanye zikuthintela ukuphila ngokwesiqhelo.',
    body8:
      'Ugqirha, umbelekisi, okanye ugqirha wamayeza angakunceda ukuqonda ukuba iimpawu zinokudibana nendlela oyisebenzisayo kwaye ukuba kufuneka ilungiswe.',
    body9:
      'Ezinye iimpawu aziqhelekanga kwaye zifuna uvavanyo lwezonyango olukhawulezileyo. Azithethi ngokuqinisekileyo ukuba kukho ingxaki, kodwa akufuneki zityeshelwe.',
    alertTitle: 'Funa ukhathalelo ngokukhawuleza',
    alertIntro: 'Funa ingcebiso yezonyango ngokukhawuleza ukuba uvakalelwa, ngokukodwa:',
    urgentSigns: [
      'Intlungu enkulu okanye engaqhelekanga esifubeni',
      'Ubunzima bokuphefumla obuvele ngequbuliso',
      'Ukudumba okanye intlungu engaqhelekanga emlenzeni',
      'Intloko ebuhlungu ngequbuliso, enkulu kakhulu, okanye engaqhelekanga',
      'Ingxaki ngequbuliso ekubonweni, ekuthetheni, okanye kumandla',
    ],
    emergencyTitle: 'Kwimeko enzima',
    emergencyText:
      'Ukuba iimpawu zivela ngequbuliso, zinzima kakhulu, okanye zihamba nobunzima bokuphefumla, ukuziva uzakuwa, okanye enye impawu ebalulekileyo, funa uncedo lwezonyango olukhawulezileyo.',
    summaryTitle: 'Okubalulekileyo',
    summaryItems: [
      'Eminye imiphumo inokuvela ekuqaleni kwendlela entsha yokuthintela uzalo ene-hormone.',
      'Imiphumo emininzi yethutyana kwaye inokuncipha ngokuhamba kwexesha.',
      'Impawu ekhathazayo okanye eqhubekayo kufanelekile ukuba uxoxe ngayo nengcali.',
      'Ezinye iimpawu ezingaqhelekanga zifuna ingcebiso yezonyango ekhawulezileyo.',
    ],
    finalTipTitle: 'Okuphambili',
    finalTipText:
      'Ukumamela umzimba wakho akuthethi ngokuqinisekileyo ukuyeka indlela kwangoko. Bhala oko ukuvakalelwa, jonga indlela etshintsha ngayo, kwaye ucele ingcebiso nanini na xa impawu ikukhathaza.',
    disclaimerText:
      'Eli nqaku lenzelwe ukwazisa kwaye alithathi indawo yengcebiso yezonyango ezenzelwe wena. Ukuba une-mpawu enkulu okanye engaqhelekanga, funa ingcebiso kwingcali yezempilo.',
    shareMessage: 'Ukuqonda imiphumo enokwenzeka — AWA',
  },
  sn: {
    badge: 'ZVINOITIKA',
    title: 'Kuziva zvinogona\nkuitika',
    metaDuration: 'Maminitsi masere ekuverenga',
    metaType: 'Chinyorwa',
    metaLevel: 'Pakati nepakati',
    metaValidated: 'Zvakaongororwa',
    intro:
      'Zvimwe zvinoitika zvinogona kuve zvakajairika uye zvenguva pfupi. Zvimwe zvinoda kutariswa zvakanyanya. Dzidza kusiyanisa pakati pezvinoitika zvakajairika nezviratidzo zvinofanira kuongororwa.',
    contentsTitle: 'Mune chinyorwa ichi',
    topics: [
      'Zvinoitika zvakajairika, zvisina simba',
      'Nguva yekuzvinzwisisa kwemuviri',
      'Kutarisa zvinoshanduka',
      'Kana wafanira kutsvaga mazano ekurapwa',
      'Kana wafanira kutsvaga rubatsiro nekukurumidza',
      'Zvikuru zvekuyeuka',
    ],
    body1:
      'Kana munhu achitanga nzira itsva yecontraception ine hormone, muviri unogona kuda nguva yekuzvinzwisisa. Shanduko diki dzinogona kuoneka mu cycle, mumufambiro wemoyo, kana pakugadzikana kwemuviri.',
    body2:
      'Zvinoitika izvi kazhinji hazvina simba uye zvinogona kuderera zvishoma nezvishoma. Kuvapo kwazvo hakusi kureva kuti nzira iyi ine ngozi kana kuti inofanira kumiswa.',
    commonEffects: [
      {
        title: 'Ropa shoma',
        text: 'Ropa risina kujairika rinogona kubuda, kunyanya pakutanga kwenzira itsva.',
      },
      {
        title: 'Kurwadza kwemazamu',
        text: 'Kuomarara kana kurwadza kwemazamu kunogona kunzwika kwenguva pfupi.',
      },
      {
        title: 'Mufambiro wemoyo',
        text: 'Vamwe vanoona shanduko mumufambiro wemoyo kana kuwedzera kwekunzwa zvakanyanya.',
      },
      {
        title: 'Kurwadza mutwe',
        text: 'Kurwadza mutwe kusina simba kunogona kuitika panguva yekuzvinzwisisa kwemuviri.',
      },
    ],
    body3:
      'Mavhiki mashoma ekutanga kana macycle anogona kusiyana nezvaunga uchijairira kare. Muviri unogona kuzvinzwisisa zvishoma nezvishoma kuhormone nyowani.',
    tip1Title: 'Zvakanaka kuziva',
    tip1Text:
      'Chinhu chinoitika nguva pfupi mushure mekutanga nzira chakakodzera kutariswa nenguva. Kana chikabvunza kana kuramba chichivapo, taura nemushandi wezvehutano.',
    body4:
      'Zvinogona kubatsira kunyora zviratidzo muapp yako kuti utarise zviri nani kuti zvinoshanduka sei kubva pa cycle kuenda kune inotevera.',
    trackingTitle: 'Tevera zvinoshanduka',
    trackingSubtitle: 'Zviratidzo zvishoma zvinogona kubatsira',
    trackingLines: [
      'Nyora zuva rakaonekwa chiratidzo.',
      'Nyora kusimba kwacho nenguva yachakagara.',
      'Tarisa kana chichiita nani kana chichiipa.',
    ],
    body5:
      'Zviratidzo zvose hazvikonzerwi necontraception. Kushushikana, hope, zvekudya, cycle yako, kana mimwe mishonga zvinogona zvakare kukanganisa kunzwa kwako.',
    body6:
      'Kuti unzwisise mamiriro, edza kutarisa mamiriro ose pane kutarisa chiratidzo chimwe chete chega.',
    worthMentioning: [
      'Shanduko dzakajeka, dzinoramba dziripo dzemufambiro wemoyo',
      'Kuderera kwechishuwo chekuita ukama kunokunetsa',
      'Ropa risina kujairika rinopfuura macycle matatu',
      'Kusvotwa kana kurwadza mutwe zvichiramba zvichinetsa',
    ],
    questionsTitle: 'Mibvunzo mishoma inobatsira',
    questions: [
      'Zviratidzo izvi zvakatora nguva yakareba sei?',
      'Zvakatanga mushure mekutanga kana kushandura nzira yecontraception here?',
      'Hazvina simba, zvinonetsa, kana kuti hazvina kujairika kwauri chaizvo here?',
      'Zviri kuita nani nenguva kana kuwedzera kuitika here?',
    ],
    body7:
      'Kunyange kana chiratidzo chisina kukurumidza, chinogona kukodzera kutaurwa kana chikanetsa, chikaramba chiripo, kana chichikanganisa upenyu hwako zvechokwadi.',
    infoTitle: 'Zvingakodzera kutsvaga mazano kana…',
    infoText:
      'zviratidzo zvichiramba zviripo, zvichiwedzera, kana kukudzivisa kurarama zvakajairika.',
    body8:
      'Chiremba, mukoti, kana mushandi wefamasi anogona kukubatsira kuziva kana zviratidzo zvichibatana nenzira yauri kushandisa uye kana ichifanira kugadziriswa.',
    body9:
      'Zviratidzo zvimwe hazvijairiki uye zvinoda kuongororwa nekukurumidza nechiremba. Hazvirevi kuti pane dambudziko, asi hazvifaniri kufuratirwa.',
    alertTitle: 'Tsvaga rubatsiro nekukurumidza',
    alertIntro: 'Tsvaga mazano ekurapwa nekukurumidza kana uine, kunyanya:',
    urgentSigns: [
      'Kurwadza kukuru kana kusina kujairika pachipfuva',
      'Kunetseka kufema kunoerekana kwavapo',
      'Kuzvimba kana kurwadza kusina kujairika mubvi',
      'Kurwadza mutwe kunoerekana, kukuru kwazvo, kana kusina kujairika',
      'Dambudziko rinoerekana rekuona, kutaura, kana simba',
    ],
    emergencyTitle: 'Mukuita kwakaomarara',
    emergencyText:
      'Kana zviratidzo zvichiuya zvinoerekana, zvakaipa kwazvo, kana zvichiuya nekunetseka kufema, kunzwa kuda kuwa, kana chimwe chiratidzo chakakomba, tsvaga rubatsiro rwekurapwa rwechimbichimbi.',
    summaryTitle: 'Zvakakosha',
    summaryItems: [
      'Zvimwe zvinoitika zvinogona kuoneka pakutanga kwenzira itsva yecontraception ine hormone.',
      'Zvinoitika zvizhinji zvenguva pfupi uye zvinogona kuderera nenguva.',
      'Chiratidzo chinonetsa kana chinoramba chiripo chakakodzera kutaurwa nemushandi wehutano.',
      'Zviratidzo zvimwe zvisina kujairika zvinoda mazano ekurapwa nekukurumidza.',
    ],
    finalTipTitle: 'Chinokosha chekuyeuka',
    finalTipText:
      'Kuteerera muviri wako hakusi kureva kumisa nzira nekukurumidza. Nyora zvauri kunzwa, tarisa kuti zvinoshanduka sei, uye kumbira mazano chero kana chiratidzo chichikunetsa.',
    disclaimerText:
      'Chinyorwa ichi chakagadzirirwa kuzivisa uye hachitsiviri mazano ekurapwa akagadzirirwa iwe. Kana uine chiratidzo chakakura kana chisina kujairika, tsvaga mazano kumushandi wezvehutano.',
    shareMessage: 'Kuziva zvinogona kuitika — AWA',
  },
  ln: {
    badge: 'MABUNDA YA MAKAMBO',
    title: 'Koyeba mabunda\noyo ekoki koya',
    metaDuration: 'Mikanda ya minutes 8',
    metaType: 'Lisolo',
    metaLevel: 'Ya katikati',
    metaValidated: 'Contenu etalamaki',
    intro:
      'Mabunda mosusu ezali ya kokesana te mpe ekoleka. Mosusu esengi bokebi mingi. Yekola koyeba bokeseni kati na makambo ya ndenge na ndenge mpe bilembo oyo esengeli kotalama.',
    contentsTitle: 'Na lisolo oyo',
    topics: [
      'Mabunda ya pete, ya mike',
      'Ntango oyo nzoto ekoyela',
      'Kotala oyo ekoki kobongwana',
      'Ntango ya kosenga toli ya monganga',
      'Ntango ya koluka lisalisi noki',
      'Makambo ya ntina',
    ],
    body1:
      'Ntango moto abandi lolenge ya sika ya contraception ya hormone, nzoto ekoki kozala na ntango ya koyela. Mbongwana mike ekoki kobima na cycle, na motema, to na kimya ya nzoto.',
    body2:
      'Mabunda oyo ezalaka mingi ya mike mpe ekoki kokita noki noki. Kozala na yango elingi koloba te ete lolenge yango ezali na likama to esengeli kotika.',
    commonEffects: [
      {
        title: 'Makila mike',
        text: 'Makila oyo ekeseni ekoki kobima, mingi mingi na ebandeli ya lolenge ya sika.',
      },
      {
        title: 'Mpasi ya mabɛlɛ',
        text: 'Kolɔngɔ to mpasi ya mabɛlɛ ekoki koyokana ntango moke.',
      },
      {
        title: 'Motema',
        text: 'Basusu bamoni mbongwana ya motema to bayokaka mpasi mingi na mayoki.',
      },
      {
        title: 'Mpasi ya moto',
        text: 'Mpasi ya moto ya mike ekoki kobima na ntango ya koyela.',
      },
    ],
    body3:
      'Poso ya liboso to ba cycle ya liboso ekoki kokesana na oyo olingaki kozwa liboso. Nzoto ekoki koyela noki noki na hormone ya sika.',
    tip1Title: 'Eloko ya koyeba',
    tip1Text:
      'Eloko oyo ebimi nsima ya kobanda lolenge ezali na ntina ya kotala na ntango. Soki ebimi mpasi to etikali, lobela moto ya mosala ya lisano.',
    body4:
      'Ekoki kosunga kokoma bilembo na app na yo mpo na kotala malamu ndenge ebongwani uta cycle moko kino mosusu.',
    trackingTitle: 'Tala ndenge ebongwani',
    trackingSubtitle: 'Bilembo mike ekoki kosunga',
    trackingLines: [
      'Koma mokolo oyo elembo ebimaki.',
      'Koma makasi mpe ntango ya yango.',
      'Tala soki ebongi to ekomi mabe.',
    ],
    body5:
      'Bilembo nyonso ezali na boyokani na contraception te. Stress, mpongi, bilei, cycle na yo, to bapiluli mosusu ekoki mpe kosala na ndenge oyokaka.',
    body6:
      'Mpo na kondimisa likambo, tala makambo mobimba, kasi te elembo moko mosika na bisusu.',
    worthMentioning: [
      'Mbongwana ya motema oyo ezali makasi mpe etikali',
      'Kokita ya mposa ya kolala na mobali oyo ezali kopesa yo mpasi',
      'Makila oyo ekeseni oyo etikali koleka ba cycle 3',
      'Nausea to mpasi ya moto oyo etikali kopesa mpasi',
    ],
    questionsTitle: 'Mituna mike oyo ekoki kosunga',
    questions: [
      'Bilembo oyo ezali kobima uta ntango boni?',
      'Ebimaki nsima ya kobanda to kobongola lolenge ya contraception?',
      'Ezali ya mike, ezali kopesa mpasi, to ezali mpenza ya kokesana mpo na yo?',
      'Ezali kobongwa na ntango to ekomi ya mbala mingi?',
    ],
    body7:
      'Atako elembo ezali ya mbangu te, ekoki kozala malamu kolobela yango soki ekomi kopesa mpasi, etikali, to ezali mpenza kosala ete bomoi na yo ebimela malamu te.',
    infoTitle: 'Ekoki kozala malamu kosenga toli soki…',
    infoText:
      'bilembo etikali, ekomi makasi, to ekopesa yo nzela te ya kozala na bomoi ya ndenge moko.',
    body8:
      'Monganga, mobotisi, to moto oyo azali koteka bapiluli akoki kosunga yo koyeba soki bilembo ekoki kozala na boyokani na lolenge oyo ozali kosalela mpe soki esengeli kobongola yango.',
    body9:
      'Bilembo mosusu ezali ya kokesana mpe esengi monganga atala noki. Elingi koloba te ete likambo ya mabe ezali, kasi esengeli kotika yango te.',
    alertTitle: 'Luka lisalisi noki',
    alertIntro: 'Luka toli ya monganga noki soki ozali na, mingi mingi:',
    urgentSigns: [
      'Mpasi makasi to ya kokesana na ntolo',
      'Mpasi ya mbala moko ya kopema',
      'Kotumba to mpasi ya kokesana na lokolo',
      'Mpasi ya moto ya mbala moko, makasi mingi, to ya kokesana',
      'Mpasi ya mbala moko na komona, na koloba, to na makasi',
    ],
    emergencyTitle: 'Soki likambo ezali makasi mingi',
    emergencyText:
      'Soki bilembo ebimi na mbala moko, makasi mingi, to elandami na mpasi ya kopema, koyoka ete okobɛta, to elembo mosusu ya makasi, luka lisalisi ya monganga noki.',
    summaryTitle: 'Makambo ya ntina',
    summaryItems: [
      'Mabunda mosusu ekoki kobima na ebandeli ya lolenge ya sika ya contraception ya hormone.',
      'Mabunda mingi ezali ya ntango moke mpe ekoki kokita na ntango.',
      'Elembo oyo ezali kopesa mpasi to etikali ebongi kolobelama na moto ya mosala ya lisano.',
      'Bilembo mosusu ya kokesana esengi toli ya monganga noki.',
    ],
    finalTipTitle: 'Likambo ya ntina',
    finalTipText:
      'Koyoka nzoto na yo elingi koloba te kotika lolenge noki. Koma oyo ozali koyoka, tala ndenge ebongwani, mpe sɛnga toli ntango nyonso elembo ekopesa yo ntembe.',
    disclaimerText:
      'Lisolo oyo ezali mpo na koyebisa mpe ejwi lisalisi ya monganga mpo na yo moko te. Soki ozali na elembo makasi to ya kokesana, sɛnga toli epai ya moto ya mosala ya lisano.',
    shareMessage: 'Koyeba mabunda oyo ekoki koya — AWA',
  },
  ff: {
    badge: 'GOOƊI ƁOYƊI',
    title: 'Anndude gooƊi ɓoyƊi\nɗi ngaɗata',
    metaDuration: 'Janngugol minit 8',
    metaType: 'Winndannde',
    metaLevel: 'Hakkunde',
    metaValidated: 'Ko ndaaraaka',
    intro:
      'Woɗɗa ɗum ina limtee e ɗum ina nanndi. Woɗɗa ina ɗaɓɓiti ndaaraade ɓeydaa. Anndu ko seerti hakkunde ko ɗum aada e ko haani ndaaretee.',
    contentsTitle: 'Ɗoo nder winndannde',
    topics: [
      'GooƊi nanndi, ɗi ɓoyƊi tan',
      'Wakkati ɓaleeɗo jaɓa',
      'Ndaarugol ko wayliri',
      'Ndeen naamnaade doktoor',
      'Ndeen yaadude e yaaɗi koyɗe',
      'Ko haani hoolaade',
    ],
    body1:
      'Ndeen debbo fuɗɗi laawol ɗum hormon hiwa reedu, ɓaleeɗo ina waawi ɗaɓɓude wakkati seɗɗa ngam jaɓaade. Waylooji pamarooji ina mbaawi feɗɗude nder sikkle, hakkiilo, walla lampaaɗi.',
    body2:
      'GooƊi ɗin ko feewi ɓoyƊi, ina mbaawi dogguye seɗɗa seɗɗa. Ɗi ngoodaa ɗum anndinan laawol ngol ina hoyƴa walla haani ɗum ɓennee.',
    commonEffects: [
      {
        title: 'Yiiyam seɗɗa',
        text: 'Yiiyam ina waawi yaltude no ɗum yaaɗaa, ko feewi fuɗɗoode laawol heyaɗo.',
      },
      {
        title: 'Muusaare ɓeemeeji',
        text: 'Hukkere walla muusaare ɓeemeeji ina waawi wonde wakkati seɗɗa.',
      },
      {
        title: 'Hakkiilo',
        text: 'Woɗɓe ina ndaaray waylooji hakkiilo walla ɓeydaare hoyre.',
      },
      {
        title: 'Muusaare hoore',
        text: 'Muusaare hoore ɓoyƊa ina waawi wonde nder wakkati jaɓaade.',
      },
    ],
    body3:
      'Yontaaji adannde walla sikkle adannde ina mbaawi wonde feerti e ko a ɓeydaa nder adii. Ɓaleeɗo ina waawi jaɓaade seɗɗa seɗɗa e hormon heyaɗo.',
    tip1Title: 'Ko haani anndude',
    tip1Text:
      'Ko wayliri ɓaawo fuɗɗoode laawol ina haani ndaaretee e wakkati. Si ɗum yeeɓii walla ɗum ɓennaaki, wolwu e jey-jeyaaɗo ɗemngal dawrugol.',
    body4:
      'Ina waawi wallude winndude tokkindiral dow aplikasiyoŋ maaɗa ngam ndaarude ko wayliri hakkunde sikkle e sikkle.',
    trackingTitle: 'Ndaaru ko wayliri',
    trackingSubtitle: 'Seɗɗa ko wallata',
    trackingLines: [
      'Winndu nyalaande tokkindiral ɗu fuɗɗi.',
      'Winndu tiiɗal mum e janngo mum.',
      'Ndaaru si ɗum moƴƴi walla ɗum ɓeydi.',
    ],
    body5:
      'Tokkindiral fuu walaa ko ɗum e laawol hiwa reedu. Hakkiilo, hoosugol, ñaamdu, sikkle maaɗa, walla safaara feere ina mbaawi sankude no a nanday.',
    body6:
      'Ngam faamude ko woni, haɓɓu ndaare dow ko heewi fuu, wanaa tokkindiral gooto tan.',
    worthMentioning: [
      'Waylooji hakkiilo ɗi tiiɗi, ɗi ɓennaaki',
      'Ɓusugol muusaare gorko-debbo ɗum ɓurdi ma',
      'Yiiyam jaŋtaaɗam ɗum yahi sikkle 3 ɓurdi',
      'Tuumaare walla muusaare hoore ɗum ɓennaaki',
    ],
    questionsTitle: 'Naamnooji seɗɗa ɗi wallata',
    questions: [
      'Tokkindiral ɗin ɗon ina ɗon e ndeye?',
      'Ɗi ngoodi ɓaawo fuɗɗoode walla waylugol laawol hiwa reedu?',
      'Ɗi ɓoyƊi, ɗi ɓurdi ma, walla ɗi feere ngam an?',
      'Ɗi ina moƴƴa e wakkati walla ɗi ɓeydi?',
    ],
    body7:
      'Hay si tokkindiral wanaa ko yaaɗi, ina moƴƴi a wolwa dow ɗum si ɗum ɓurdi ma, ɗum ɓennaaki, walla ɗum sankii nguurndam maaɗa.',
    infoTitle: 'Ina waawi moƴƴude naamnaade tawtoreeji si…',
    infoText:
      'tokkindiral ɗin ɓennaaki, ɗi ɓeydi, walla ɗi haɗi ma nguurude no feewi.',
    body8:
      'Doktoor, ɓiɗɗo-ɗemngal debbo (midwife), walla farmasiyeŋ ina mbaawi wallude ma faamude si tokkindiral ɗin ina ngoodi e laawol ngol a huutinoto e si haani ɗum wayleede.',
    body9:
      'Tokkindiral feere ina wonaa no feewi e ina ɗaɓɓiti ndaarugol doktoor yaaɗi. Ɗin ngartaa e ko ɗum ɓurdi ma, ammaa walaa ɗin ndarnaa.',
    alertTitle: 'Yaad e yaaɗi koyɗe',
    alertIntro: 'Yaad e yaaɗi koyɗe doktoor si a hiɗi:',
    urgentSigns: [
      'Muusaare ɓerɗe mawnde walla wanaa no feewi',
      'Daŋŋgol hoyre ngol ɓurdi e yaaɗi',
      'Tuumaare walla muusaare e koyngal gooto wanaa no feewi',
      'Muusaare hoore ngootiri, tiiɗuɗo, walla wanaa no feewi',
      'Ñaawugol yiite, haala, walla semmbe ngol ɓurdi e yaaɗi',
    ],
    emergencyTitle: 'Si ɗum ɓurdi mawnude',
    emergencyText:
      'Si tokkindiral ɗin ngootiri, ɗin tiiɗi no feewi, walla ɗin ngari e daŋŋgol hoyre, mooyugol, walla tokkindiral feere ɗum tiiɗi, ɗaɓɓu walliinde doktoor yaaɗi.',
    summaryTitle: 'Ko ɗum tiiɗi',
    summaryItems: [
      'GooƊi feere ina mbaawi yaltude fuɗɗoode laawol heyaɗo hormon hiwa reedu.',
      'GooƊi ɗuuɗɗi ɗum wakkati tan e ina mbaawi dogguye e wakkati.',
      'Tokkindiral ɗum ɓurdi ma walla ɗum ɓennaaki ina moƴƴi a wolwa dow ɗum e jey-jeyaaɗo.',
      'Tokkindiral feere ina ɗaɓɓiti anndinol doktoor yaaɗi.',
    ],
    finalTipTitle: 'Ko haani hoolaade',
    finalTipText:
      'Hojjugol ɓaleeɗo maaɗa wanaa ɗum ɓennugol laawol gaɗa. Winndu ko a ɓiɗɗa, ndaaru no ɗum waylata, e naamnu anndinol si tokkindiral ina hakkunde ma.',
    disclaimerText:
      'Winndannde ɗoo ko anndinol, ɗum wonaa ɓesduɗo anndinol doktoor ngam an. Si a ngoodi tokkindiral tiiɗɗo walla wanaa no feewi, ɗaɓɓu anndinol jey-jeyaaɗo ɗemngal dawrugol.',
    shareMessage: 'Anndude gooƊi ɓoyƊi ɗi ngaɗata — AWA',
  },
  id: {
    badge: 'EFEK SAMPING',
    title: 'Mengenali kemungkinan\nefek samping',
    metaDuration: '8 menit baca',
    metaType: 'Artikel',
    metaLevel: 'Menengah',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Beberapa efek bisa umum dan sementara. Efek lainnya perlu perhatian lebih. Pelajari cara membedakan reaksi yang biasa dari tanda-tanda yang perlu dievaluasi.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Efek ringan yang umum',
      'Masa penyesuaian tubuh',
      'Mengamati apa yang berubah',
      'Kapan perlu meminta saran medis',
      'Kapan perlu segera mencari pertolongan',
      'Poin-poin penting',
    ],
    body1: 'Ketika seseorang mulai menggunakan metode kontrasepsi hormonal yang baru, tubuh mungkin membutuhkan waktu untuk menyesuaikan diri. Perubahan kecil bisa muncul pada siklus, suasana hati, atau kenyamanan fisik.',
    body2: 'Efek ini sering kali ringan dan bisa berkurang secara bertahap. Munculnya efek tersebut tidak otomatis berarti metodenya berbahaya atau harus dihentikan.',
    commonEffects: [
      {
        title: 'Perdarahan ringan',
        text: 'Perdarahan tidak teratur bisa terjadi, terutama pada awal penggunaan metode baru.',
      },
      {
        title: 'Payudara nyeri',
        text: 'Payudara terasa kencang atau nyeri untuk sementara.',
      },
      {
        title: 'Suasana hati',
        text: 'Sebagian orang merasakan perubahan suasana hati atau kepekaan emosi yang meningkat.',
      },
      {
        title: 'Sakit kepala',
        text: 'Sakit kepala ringan bisa terjadi selama masa penyesuaian.',
      },
    ],
    body3: 'Beberapa minggu atau siklus pertama mungkin berbeda dari yang biasa kamu alami sebelumnya. Tubuh bisa menyesuaikan diri secara bertahap dengan keseimbangan hormon yang baru.',
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Efek yang muncul tak lama setelah memulai suatu metode layak dipantau dari waktu ke waktu. Jika mengganggu atau terus berlanjut, bicaralah dengan tenaga kesehatan.',
    body4: 'Mencatat gejala di aplikasimu bisa membantu memantau perubahannya dari satu siklus ke siklus berikutnya.',
    trackingTitle: 'Pantau perkembangannya',
    trackingSubtitle: 'Beberapa penanda bisa membantu',
    trackingLines: [
      'Catat tanggal gejala muncul.',
      'Catat tingkat keparahan dan durasinya.',
      'Perhatikan apakah gejala membaik atau memburuk.',
    ],
    body5: 'Tidak semua gejala berkaitan dengan kontrasepsi. Stres, tidur, pola makan, siklusmu, atau pengobatan lain juga bisa memengaruhi apa yang kamu rasakan.',
    body6: 'Untuk memahami keadaannya, cobalah melihat konteks secara keseluruhan, bukan satu gejala secara terpisah.',
    worthMentioning: [
      'Perubahan suasana hati yang nyata dan menetap',
      'Penurunan libido yang mengganggumu',
      'Perdarahan tidak teratur yang berlangsung lebih dari 3 siklus',
      'Mual atau sakit kepala yang tetap mengganggu',
    ],
    questionsTitle: 'Beberapa pertanyaan yang membantu',
    questions: [
      'Sudah berapa lama gejala ini berlangsung?',
      'Apakah gejala muncul setelah memulai atau mengganti metode kontrasepsi?',
      'Apakah gejalanya ringan, mengganggu, atau benar-benar tidak biasa bagimu?',
      'Apakah gejalanya membaik seiring waktu atau makin sering muncul?',
    ],
    body7: 'Meskipun suatu gejala tidak mendesak, ada baiknya dibicarakan jika mengganggu, terus berlanjut, atau benar-benar memengaruhi kualitas hidupmu.',
    infoTitle: 'Mungkin ada baiknya meminta saran jika…',
    infoText: 'gejala terus berlanjut, makin berat, atau membuatmu tidak bisa menjalani hidup dengan normal.',
    body8: 'Dokter, bidan, atau apoteker bisa membantumu menentukan apakah gejala tersebut mungkin berkaitan dengan metode yang kamu gunakan dan apakah metode itu perlu disesuaikan.',
    body9: 'Beberapa tanda tidak biasa dan memerlukan evaluasi medis segera. Tanda-tanda itu belum tentu berarti ada komplikasi, tetapi tidak boleh diabaikan.',
    alertTitle: 'Segera cari pertolongan',
    alertIntro: 'Segera minta saran medis jika kamu mengalami, terutama:',
    urgentSigns: [
      'Nyeri dada yang hebat atau tidak biasa',
      'Sesak napas yang tiba-tiba',
      'Pembengkakan atau nyeri yang tidak biasa pada salah satu kaki',
      'Sakit kepala yang tiba-tiba, sangat hebat, atau tidak biasa',
      'Gangguan penglihatan, bicara, atau kekuatan tubuh yang tiba-tiba',
    ],
    emergencyTitle: 'Dalam keadaan yang berat',
    emergencyText: 'Jika gejala muncul tiba-tiba, sangat berat, atau disertai sesak napas, rasa akan pingsan, atau tanda serius lainnya, segera cari pertolongan medis darurat.',
    summaryTitle: 'Intinya',
    summaryItems: [
      'Beberapa efek bisa muncul pada awal penggunaan metode kontrasepsi hormonal yang baru.',
      'Banyak efek bersifat sementara dan bisa berkurang seiring waktu.',
      'Gejala yang mengganggu atau menetap layak dibicarakan dengan tenaga profesional.',
      'Beberapa tanda yang tidak biasa memerlukan saran medis segera.',
    ],
    finalTipTitle: 'Poin penting',
    finalTipText: 'Mendengarkan tubuhmu tidak selalu berarti langsung menghentikan suatu metode. Catat apa yang kamu rasakan, pantau perkembangannya, dan mintalah saran setiap kali ada gejala yang membuatmu khawatir.',
    disclaimerText: 'Artikel ini bersifat informatif dan tidak menggantikan nasihat medis yang dipersonalisasi. Jika kamu mengalami gejala yang berat atau tidak biasa, mintalah saran dari tenaga kesehatan.',
    shareMessage: 'Mengenali kemungkinan efek samping — AWA',
  },
  hi: {
    badge: 'दुष्प्रभाव',
    title: 'संभावित दुष्प्रभावों\nको पहचानना',
    metaDuration: '8 मिनट में पढ़ें',
    metaType: 'लेख',
    metaLevel: 'मध्यम',
    metaValidated: 'समीक्षित सामग्री',
    intro: 'कुछ असर आम और अस्थायी हो सकते हैं। कुछ पर ज़्यादा ध्यान देने की ज़रूरत होती है। जानें कि सामान्य प्रतिक्रियाओं और जाँच करवाने लायक संकेतों में फ़र्क़ कैसे करें।',
    contentsTitle: 'इस लेख में',
    topics: [
      'आम और हल्के असर',
      'शरीर के ढलने का समय',
      'बदलावों पर नज़र रखना',
      'डॉक्टर की सलाह कब लें',
      'तुरंत इलाज कब लें',
      'मुख्य बातें',
    ],
    body1: 'जब कोई महिला नया हार्मोनल गर्भनिरोधक तरीका शुरू करती है, तो शरीर को ढलने में कुछ समय लग सकता है। चक्र, मूड या शारीरिक आराम में छोटे बदलाव दिख सकते हैं।',
    body2: 'ये असर अक्सर हल्के होते हैं और धीरे-धीरे कम हो सकते हैं। इनके होने का मतलब अपने आप यह नहीं कि तरीका खतरनाक है या उसे बंद कर देना चाहिए।',
    commonEffects: [
      {
        title: 'हल्का रक्तस्राव',
        text: 'अनियमित रक्तस्राव हो सकता है, खासकर किसी नए तरीके की शुरुआत में।',
      },
      {
        title: 'स्तनों में कोमलता',
        text: 'स्तनों में कसाव या कोमलता कुछ समय के लिए महसूस हो सकती है।',
      },
      {
        title: 'मूड',
        text: 'कुछ महिलाओं को मूड में बदलाव या भावनात्मक संवेदनशीलता बढ़ी हुई महसूस होती है।',
      },
      {
        title: 'सिरदर्द',
        text: 'ढलने के दौरान हल्का सिरदर्द हो सकता है।',
      },
    ],
    body3: 'पहले कुछ सप्ताह या चक्र आपकी पहले की आदत से अलग हो सकते हैं। शरीर धीरे-धीरे नए हार्मोनल संतुलन के हिसाब से ढल सकता है।',
    tip1Title: 'जानना ज़रूरी है',
    tip1Text: 'किसी तरीके को शुरू करने के कुछ ही समय बाद दिखने वाले असर पर समय के साथ नज़र रखना ठीक रहता है। अगर वह परेशान करने लगे या बना रहे, तो किसी स्वास्थ्य विशेषज्ञ से बात करें।',
    body4: 'अपने ऐप में लक्षण दर्ज करना मददगार हो सकता है, ताकि आप देख सकें कि एक चक्र से दूसरे चक्र में वे कैसे बदलते हैं।',
    trackingTitle: 'बदलाव पर नज़र रखें',
    trackingSubtitle: 'कुछ बातें मददगार हो सकती हैं',
    trackingLines: [
      'लक्षण शुरू होने की तारीख नोट करें।',
      'उसकी तीव्रता और अवधि दर्ज करें।',
      'देखें कि वह बेहतर हो रहा है या बिगड़ रहा है।',
    ],
    body5: 'हर लक्षण का गर्भनिरोधक से जुड़ा होना ज़रूरी नहीं है। तनाव, नींद, खान-पान, आपका चक्र या दूसरे इलाज भी आपकी सेहत पर असर डाल सकते हैं।',
    body6: 'स्थिति को समझने के लिए किसी एक लक्षण को अलग से देखने के बजाय पूरे संदर्भ को देखने की कोशिश करें।',
    worthMentioning: [
      'मूड में साफ़ और लगातार बदलाव',
      'कामेच्छा में कमी, जो आपको परेशान करे',
      'अनियमित रक्तस्राव जो 3 चक्र से ज़्यादा चले',
      'मतली या सिरदर्द जो परेशान करते रहें',
    ],
    questionsTitle: 'कुछ काम के सवाल',
    questions: [
      'ये लक्षण कितने समय से हैं?',
      'क्या ये गर्भनिरोधक का तरीका शुरू करने या बदलने के बाद शुरू हुए?',
      'क्या ये हल्के हैं, परेशान करने वाले हैं, या आपके लिए सचमुच असामान्य हैं?',
      'क्या ये समय के साथ ठीक हो रहे हैं या ज़्यादा बार हो रहे हैं?',
    ],
    body7: 'भले ही कोई लक्षण आपात न हो, अगर वह परेशान करे, बना रहे या आपके जीवन की गुणवत्ता पर सचमुच असर डाले, तो उस पर बात करना ठीक रहता है।',
    infoTitle: 'सलाह लेना ठीक रहेगा अगर…',
    infoText: 'लक्षण बने रहें, बढ़ जाएँ या आपको सामान्य ज़िंदगी जीने से रोकें।',
    body8: 'डॉक्टर, दाई-नर्स (मिडवाइफ़) या फ़ार्मासिस्ट यह तय करने में मदद कर सकते हैं कि लक्षण आपके इस्तेमाल किए जा रहे तरीके से जुड़े हो सकते हैं या नहीं, और उसे बदलने की ज़रूरत है या नहीं।',
    body9: 'कुछ संकेत असामान्य होते हैं और उनकी जल्द डॉक्टरी जाँच ज़रूरी है। इनका मतलब यह नहीं कि कोई जटिलता ज़रूर है, लेकिन इन्हें नज़रअंदाज़ नहीं करना चाहिए।',
    alertTitle: 'तुरंत इलाज लें',
    alertIntro: 'अगर आपको खासकर इनमें से कुछ हो, तो जल्दी डॉक्टरी सलाह लें:',
    urgentSigns: [
      'सीने में तेज़ या असामान्य दर्द',
      'अचानक साँस लेने में कठिनाई',
      'पैर में असामान्य सूजन या दर्द',
      'अचानक बहुत तेज़ या असामान्य सिरदर्द',
      'अचानक देखने, बोलने या ताक़त में परेशानी',
    ],
    emergencyTitle: 'गंभीर स्थिति में',
    emergencyText: 'अगर लक्षण अचानक हों, बहुत गंभीर हों, या उनके साथ साँस लेने में कठिनाई, बेहोशी जैसा महसूस होना या कोई और गंभीर संकेत हो, तो तुरंत आपातकालीन चिकित्सा सहायता लें।',
    summaryTitle: 'ज़रूरी बातें',
    summaryItems: [
      'नया हार्मोनल गर्भनिरोधक तरीका शुरू करने पर कुछ असर दिख सकते हैं।',
      'कई असर अस्थायी होते हैं और समय के साथ कम हो सकते हैं।',
      'परेशान करने वाले या बने रहने वाले लक्षण पर विशेषज्ञ से बात करना ठीक रहता है।',
      'कुछ असामान्य संकेतों में जल्द डॉक्टरी सलाह ज़रूरी है।',
    ],
    finalTipTitle: 'मुख्य बात',
    finalTipText: 'अपने शरीर की सुनने का मतलब यह नहीं कि तरीका तुरंत बंद कर दिया जाए। जो महसूस हो रहा है उसे नोट करें, उसके बदलाव पर नज़र रखें, और जब भी कोई लक्षण आपको चिंतित करे तो सलाह लें।',
    disclaimerText: 'यह लेख केवल जानकारी के लिए है और व्यक्तिगत चिकित्सकीय सलाह का विकल्प नहीं है। अगर आपको कोई गंभीर या असामान्य लक्षण हो, तो किसी स्वास्थ्य विशेषज्ञ से सलाह लें।',
    shareMessage: 'संभावित दुष्प्रभावों को पहचानना — AWA',
  },
  sq: {
    badge: 'EFEKTET ANËSORE',
    title: 'Të njohësh efektet\nanësore të mundshme',
    metaDuration: '8 min lexim',
    metaType: 'Artikull',
    metaLevel: 'Mesatar',
    metaValidated: 'Përmbajtje e shqyrtuar',
    intro: 'Disa efekte mund të jenë të zakonshme dhe kalimtare. Të tjera kërkojnë më shumë vëmendje. Mëso të dallosh mes reaksioneve të zakonshme dhe shenjave që duhen vlerësuar.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Efekte të zakonshme e të lehta',
      'Periudha e përshtatjes së trupit',
      'Vëzhgimi i asaj që ndryshon',
      'Kur të kërkosh këshillë mjekësore',
      'Kur të kërkosh kujdes të shpejtë',
      'Pikat kryesore',
    ],
    body1: 'Kur dikush fillon një metodë të re kontracepsioni hormonal, trupit mund t’i duhet pak kohë për t’u përshtatur. Mund të shfaqen ndryshime të vogla në cikël, në gjendjen shpirtërore ose në rehatinë fizike.',
    body2: 'Këto efekte shpesh janë të lehta dhe mund të pakësohen gradualisht. Prania e tyre nuk do të thotë automatikisht se metoda është e rrezikshme ose se duhet ndërprerë.',
    commonEffects: [
      {
        title: 'Gjakderdhje e lehtë',
        text: 'Mund të ndodhë gjakderdhje e parregullt, sidomos në fillim të një metode të re.',
      },
      {
        title: 'Ndjeshmëri e gjirit',
        text: 'Mund të ndihet përkohësisht shtrëngim ose ndjeshmëri në gji.',
      },
      {
        title: 'Gjendja shpirtërore',
        text: 'Disa gra vërejnë ndryshime të gjendjes shpirtërore ose ndjeshmëri emocionale më të madhe.',
      },
      {
        title: 'Dhimbje koke',
        text: 'Dhimbje të lehta koke mund të shfaqen gjatë periudhës së përshtatjes.',
      },
    ],
    body3: 'Javët ose ciklet e para mund të jenë ndryshe nga ato që ishe mësuar më parë. Trupi mund të përshtatet gradualisht me ekuilibrin e ri hormonal.',
    tip1Title: 'Mirë është ta dish',
    tip1Text: 'Një efekt që shfaqet menjëherë pas fillimit të një metode vlen të vëzhgohet me kalimin e kohës. Nëse bëhet i bezdisshëm ose vazhdon, flit me një profesionist të shëndetësisë.',
    body4: 'Mund të jetë e dobishme t’i regjistrosh simptomat në aplikacion për të ndjekur më mirë si ndryshojnë nga një cikël te tjetri.',
    trackingTitle: 'Ndiq si zhvillohen gjërat',
    trackingSubtitle: 'Disa pika referimi mund të ndihmojnë',
    trackingLines: [
      'Shëno datën kur u shfaq simptoma.',
      'Regjistro intensitetin dhe kohëzgjatjen e saj.',
      'Vëzhgo nëse përmirësohet apo përkeqësohet.',
    ],
    body5: 'Jo të gjitha simptomat lidhen domosdoshmërisht me kontracepsionin. Stresi, gjumi, ushqimi, cikli yt ose trajtime të tjera mund të ndikojnë gjithashtu në mënyrën si ndihesh.',
    body6: 'Për të kuptuar situatën, përpiqu ta shohësh kontekstin e përgjithshëm dhe jo një simptomë të vetme të veçuar.',
    worthMentioning: [
      'Ndryshime të theksuara e të vazhdueshme të gjendjes shpirtërore',
      'Një rënie e dëshirës seksuale që të bezdis',
      'Gjakderdhje e parregullt që zgjat më shumë se 3 cikle',
      'Të përziera ose dhimbje koke që mbeten të bezdisshme',
    ],
    questionsTitle: 'Disa pyetje të dobishme',
    questions: [
      'Prej sa kohësh vazhdojnë këto simptoma?',
      'A u shfaqën pas fillimit ose ndërrimit të një metode kontracepsioni?',
      'A janë të lehta, të bezdisshme apo vërtet të pazakonta për ty?',
      'A po përmirësohen me kalimin e kohës apo po bëhen më të shpeshta?',
    ],
    body7: 'Edhe kur një simptomë nuk është urgjente, vlen të flasësh për të nëse bëhet e bezdisshme, vazhdon ose ndikon vërtet në cilësinë e jetës sate.',
    infoTitle: 'Mund të ia vlejë të kërkosh këshillë nëse…',
    infoText: 'simptomat vazhdojnë, bëhen më të rëndësishme ose të pengojnë të jetosh normalisht.',
    body8: 'Një mjek, mami ose farmacist mund të të ndihmojë të përcaktosh nëse simptomat mund të lidhen me metodën që përdor dhe nëse duhet përshtatur.',
    body9: 'Disa shenja janë të pazakonta dhe kërkojnë vlerësim të shpejtë mjekësor. Ato nuk do të thonë domosdoshmërisht se ka një ndërlikim, por nuk duhen shpërfillur.',
    alertTitle: 'Kërko kujdes të shpejtë',
    alertIntro: 'Kërko shpejt këshillë mjekësore nëse ke, në veçanti:',
    urgentSigns: [
      'Dhimbje të fortë ose të pazakontë në gjoks',
      'Vështirësi të papritur në frymëmarrje',
      'Ënjtje ose dhimbje të pazakontë në një këmbë',
      'Dhimbje koke të papritur, shumë të fortë ose të pazakontë',
      'Probleme të papritura me shikimin, të folurit ose forcën',
    ],
    emergencyTitle: 'Në rast të një situate të rëndë',
    emergencyText: 'Nëse simptomat janë të papritura, shumë të forta ose shoqërohen me vështirësi në frymëmarrje, ndjesi të fikëti ose një shenjë tjetër serioze, kërko ndihmë mjekësore urgjente.',
    summaryTitle: 'Thelbi',
    summaryItems: [
      'Disa efekte mund të shfaqen në fillim të një metode të re kontracepsioni hormonal.',
      'Shumë efekte janë kalimtare dhe mund të pakësohen me kalimin e kohës.',
      'Një simptomë e bezdisshme ose e vazhdueshme vlen të diskutohet me një profesionist.',
      'Disa shenja të pazakonta kërkojnë këshillë të shpejtë mjekësore.',
    ],
    finalTipTitle: 'Pika kryesore',
    finalTipText: 'Të dëgjosh trupin tënd nuk do të thotë domosdoshmërisht ta ndërpresësh menjëherë një metodë. Shëno çfarë ndien, vëzhgo si zhvillohet dhe kërko këshillë sa herë që një simptomë të shqetëson.',
    disclaimerText: 'Ky artikull është vetëm për informim dhe nuk zëvendëson këshillën mjekësore të personalizuar. Nëse ke një simptomë të rëndësishme ose të pazakontë, kërko këshillë nga një profesionist i shëndetësisë.',
    shareMessage: 'Të njohësh efektet anësore të mundshme — AWA',
  },
  ja: {
    badge: '副作用',
    title: '起こりうる副作用を\n知る',
    metaDuration: '読了時間8分',
    metaType: '記事',
    metaLevel: '中級',
    metaValidated: '確認済みの内容',
    intro: 'よくある一時的な症状もあれば、より注意が必要なものもあります。よくある反応と、診察を受けたほうがよいサインの違いを見分けられるようにしましょう。',
    contentsTitle: 'この記事の内容',
    topics: [
      'よくある軽い症状',
      '体が慣れるまでの期間',
      '変化を観察する',
      '医師に相談するタイミング',
      'すぐに受診するタイミング',
      'ポイントのまとめ',
    ],
    body1: '新しいホルモン避妊法を始めると、体が慣れるまでに少し時間がかかることがあります。周期、気分、体の快適さに小さな変化が現れることがあります。',
    body2: 'これらの症状は軽いことが多く、少しずつ和らいでいく場合があります。症状があるからといって、その方法が危険である、あるいは中止しなければならないとは限りません。',
    commonEffects: [
      {
        title: '少量の出血',
        text: '特に新しい方法を始めたばかりのときに、不規則な出血が起こることがあります。',
      },
      {
        title: '胸の張り',
        text: '胸の張りや痛みを一時的に感じることがあります。',
      },
      {
        title: '気分',
        text: '気分の変化や、感情が揺れやすくなることに気づく人もいます。',
      },
      {
        title: '頭痛',
        text: '体が慣れるまでの期間に、軽い頭痛が起こることがあります。',
      },
    ],
    body3: '最初の数週間や数周期は、以前とは違って感じられることがあります。体は新しいホルモンバランスに少しずつ慣れていくことができます。',
    tip1Title: '知っておきたいこと',
    tip1Text: '方法を始めてすぐに現れた症状は、時間をかけて様子を見ることが大切です。気になるようになったり、続いたりする場合は、医療従事者に相談してください。',
    body4: 'アプリに症状を記録しておくと、周期ごとの変化を追いやすくなります。',
    trackingTitle: '変化を記録する',
    trackingSubtitle: 'いくつかの目安が役立ちます',
    trackingLines: [
      '症状が現れた日付をメモする。',
      '強さと続いた期間を記録する。',
      '良くなっているか、悪くなっているかを見る。',
    ],
    body5: 'すべての症状が避妊法と関係しているとは限りません。ストレス、睡眠、食事、周期、ほかの治療も、体調に影響することがあります。',
    body6: '状況を理解するには、ひとつの症状だけを切り離して見るのではなく、全体の状況を見るようにしましょう。',
    worthMentioning: [
      'はっきりとした、続く気分の変化',
      '気になる性欲の低下',
      '3周期を超えて続く不規則な出血',
      'つらさが続く吐き気や頭痛',
    ],
    questionsTitle: '役立つ問いかけ',
    questions: [
      'これらの症状はどのくらい続いていますか？',
      '避妊法を始めたり変えたりしたあとに現れましたか？',
      '軽いですか、つらいですか、それともご自身にとって本当にいつもと違いますか？',
      '時間とともに良くなっていますか、それとも頻繁になっていますか？',
    ],
    body7: '緊急ではない症状でも、つらくなってきた場合、続く場合、生活の質に本当に影響している場合は、相談する価値があります。',
    infoTitle: '次のような場合は相談を検討しましょう',
    infoText: '症状が続く、強くなる、または普段どおりの生活を妨げるとき。',
    body8: '医師、助産師、薬剤師は、症状が使用中の方法と関係している可能性があるかどうか、また方法を調整する必要があるかどうかを判断する手助けをしてくれます。',
    body9: 'なかには、いつもと違って、早めに医師の診察を受ける必要があるサインもあります。必ずしも合併症があることを意味するわけではありませんが、見過ごしてはいけません。',
    alertTitle: 'すぐに受診する',
    alertIntro: '特に次のような症状がある場合は、すぐに医師に相談してください。',
    urgentSigns: [
      '強い胸の痛み、またはいつもと違う胸の痛み',
      '突然の息苦しさ',
      '脚のいつもと違う腫れや痛み',
      '突然の非常に強い頭痛、またはいつもと違う頭痛',
      '突然、見えにくくなる、話しにくくなる、力が入りにくくなる',
    ],
    emergencyTitle: '重い状態の場合',
    emergencyText: '症状が突然現れたり、非常に強かったり、息苦しさ、気が遠くなる感じ、そのほかの深刻なサインをともなう場合は、緊急の医療を受けてください。',
    summaryTitle: '要点',
    summaryItems: [
      '新しいホルモン避妊法を始めたときに、いくつかの症状が現れることがあります。',
      '多くの症状は一時的で、時間とともに和らぐ場合があります。',
      'つらい症状や続く症状は、専門家に相談する価値があります。',
      'いつもと違うサインのなかには、早めの医師への相談が必要なものがあります。',
    ],
    finalTipTitle: '大切なこと',
    finalTipText: '体の声に耳を傾けることは、必ずしもすぐに方法をやめることではありません。感じていることをメモし、経過を見守り、症状が気になるときはいつでもアドバイスを求めましょう。',
    disclaimerText: 'この記事は情報提供を目的としており、一人ひとりに合わせた医療上のアドバイスに代わるものではありません。強い症状やいつもと違う症状がある場合は、医療従事者にご相談ください。',
    shareMessage: '起こりうる副作用を知る — AWA',
  },
  ko: {
    badge: '부작용',
    title: '생길 수 있는\n부작용 알아보기',
    metaDuration: '읽는 데 8분',
    metaType: '아티클',
    metaLevel: '중급',
    metaValidated: '검토된 콘텐츠',
    intro: '어떤 반응은 흔하고 일시적일 수 있어요. 또 어떤 반응은 더 주의가 필요해요. 흔한 반응과 살펴봐야 하는 신호를 구분하는 방법을 알아봐요.',
    contentsTitle: '이 아티클의 내용',
    topics: [
      '흔하고 가벼운 반응',
      '몸이 적응하는 기간',
      '달라지는 점 관찰하기',
      '언제 진료를 받아야 할까요',
      '언제 빨리 진료를 받아야 할까요',
      '핵심 정리',
    ],
    body1: '새로운 호르몬 피임법을 시작하면 몸이 적응하는 데 시간이 필요할 수 있어요. 주기, 기분, 몸의 편안함에 작은 변화가 나타날 수 있어요.',
    body2: '이런 반응은 대개 가볍고 점차 줄어들 수 있어요. 반응이 나타났다고 해서 그 방법이 위험하다거나 반드시 중단해야 한다는 뜻은 아니에요.',
    commonEffects: [
      {
        title: '소량 출혈',
        text: '특히 새로운 방법을 시작할 때 불규칙한 출혈이 있을 수 있어요.',
      },
      {
        title: '가슴 통증',
        text: '가슴이 땅기거나 아픈 느낌이 일시적으로 있을 수 있어요.',
      },
      {
        title: '기분',
        text: '기분이 달라지거나 감정이 더 예민해졌다고 느끼는 사람도 있어요.',
      },
      {
        title: '두통',
        text: '적응 기간에 가벼운 두통이 생길 수 있어요.',
      },
    ],
    body3: '처음 몇 주 또는 몇 번의 주기는 이전과 다를 수 있어요. 몸은 새로운 호르몬 균형에 서서히 적응할 수 있어요.',
    tip1Title: '알아 두면 좋아요',
    tip1Text: '방법을 시작한 직후 나타난 반응은 시간을 두고 지켜보는 것이 좋아요. 불편하거나 계속된다면 의료 전문가와 상담해 보세요.',
    body4: '앱에 증상을 기록해 두면 주기마다 어떻게 달라지는지 더 잘 살펴볼 수 있어요.',
    trackingTitle: '변화 추적하기',
    trackingSubtitle: '몇 가지 기준이 도움이 될 수 있어요',
    trackingLines: [
      '증상이 나타난 날짜를 적어 두세요.',
      '강도와 지속 시간을 기록하세요.',
      '나아지는지 심해지는지 지켜보세요.',
    ],
    body5: '모든 증상이 반드시 피임과 관련된 것은 아니에요. 스트레스, 수면, 식사, 주기, 다른 치료도 컨디션에 영향을 줄 수 있어요.',
    body6: '상황을 이해하려면 한 가지 증상만 따로 보기보다 전체적인 맥락을 살펴보는 것이 좋아요.',
    worthMentioning: [
      '뚜렷하고 계속되는 기분 변화',
      '신경 쓰이는 성욕 감소',
      '3주기 넘게 이어지는 불규칙한 출혈',
      '계속 불편한 메스꺼움이나 두통',
    ],
    questionsTitle: '도움이 되는 몇 가지 질문',
    questions: [
      '이런 증상이 얼마나 오래 이어졌나요?',
      '피임법을 시작하거나 바꾼 뒤에 나타났나요?',
      '가벼운 정도인가요, 불편한 정도인가요, 아니면 평소와 완전히 다른가요?',
      '시간이 지나면서 나아지고 있나요, 아니면 더 잦아지고 있나요?',
    ],
    body7: '급한 증상이 아니더라도 불편하거나, 계속되거나, 삶의 질에 실제로 영향을 준다면 상담해 보는 것이 좋아요.',
    infoTitle: '다음과 같다면 조언을 구해 보세요…',
    infoText: '증상이 계속되거나, 더 심해지거나, 평소처럼 생활하기 어려울 때예요.',
    body8: '의사, 조산사, 약사는 증상이 사용 중인 방법과 관련이 있을 수 있는지, 방법을 조정해야 하는지 판단하는 데 도움을 줄 수 있어요.',
    body9: '어떤 신호는 평소와 달라서 빠른 진료와 평가가 필요해요. 반드시 합병증이 있다는 뜻은 아니지만, 그냥 넘겨서는 안 돼요.',
    alertTitle: '빨리 진료를 받으세요',
    alertIntro: '특히 다음과 같은 증상이 있다면 빨리 진료를 받으세요.',
    urgentSigns: [
      '심하거나 평소와 다른 가슴 통증',
      '갑작스러운 호흡 곤란',
      '다리가 평소와 다르게 붓거나 아픔',
      '갑작스럽고 매우 심하거나 평소와 다른 두통',
      '시력, 말하기, 힘에 갑작스러운 이상이 생김',
    ],
    emergencyTitle: '심각한 상황이라면',
    emergencyText: '증상이 갑자기 나타나거나 매우 심하거나, 호흡 곤란, 어지러워 쓰러질 것 같은 느낌 또는 다른 심각한 신호가 함께 있다면 즉시 응급 진료를 받으세요.',
    summaryTitle: '핵심 요약',
    summaryItems: [
      '새로운 호르몬 피임법을 시작할 때 일부 반응이 나타날 수 있어요.',
      '많은 반응은 일시적이며 시간이 지나면서 줄어들 수 있어요.',
      '불편하거나 계속되는 증상은 전문가와 상담해 보는 것이 좋아요.',
      '평소와 다른 일부 신호는 빠른 진료가 필요해요.',
    ],
    finalTipTitle: '핵심 포인트',
    finalTipText: '몸의 소리에 귀 기울인다고 해서 반드시 방법을 바로 중단해야 하는 것은 아니에요. 느끼는 것을 기록하고, 어떻게 달라지는지 지켜보고, 증상이 걱정될 때는 언제든 조언을 구하세요.',
    disclaimerText: '이 아티클은 정보 제공을 위한 것이며 개인별 의학적 조언을 대신하지 않아요. 심하거나 평소와 다른 증상이 있다면 의료 전문가의 조언을 받으세요.',
    shareMessage: '생길 수 있는 부작용 알아보기 — AWA',
  },
  'pt-PT': {
    badge: 'EFEITOS SECUNDÁRIOS',
    title: 'Reconhecer os possíveis\nefeitos secundários',
    metaDuration: '8 min de leitura',
    metaType: 'Artigo',
    metaLevel: 'Intermédio',
    metaValidated: 'Conteúdo revisto',
    intro: 'Alguns efeitos podem ser comuns e passageiros. Outros exigem mais atenção. Aprenda a distinguir entre reações habituais e sinais que devem ser avaliados.',
    contentsTitle: 'Neste artigo',
    topics: [
      'Efeitos comuns e ligeiros',
      'O período de adaptação do corpo',
      'Observar o que muda',
      'Quando procurar aconselhamento médico',
      'Quando procurar cuidados rapidamente',
      'Pontos-chave',
    ],
    body1: 'Quando se começa a utilizar um novo método de contraceção hormonal, o corpo pode precisar de algum tempo para se adaptar. Podem surgir pequenas alterações no ciclo, no humor ou no conforto físico.',
    body2: 'Estes efeitos são muitas vezes ligeiros e podem diminuir gradualmente. A sua presença não significa automaticamente que o método seja perigoso ou que tenha de ser interrompido.',
    commonEffects: [
      {
        title: 'Pequenas perdas de sangue',
        text: 'Podem ocorrer perdas de sangue irregulares, sobretudo no início de um novo método.',
      },
      {
        title: 'Sensibilidade mamária',
        text: 'Pode sentir-se temporariamente tensão ou sensibilidade nas mamas.',
      },
      {
        title: 'Humor',
        text: 'Algumas mulheres notam alterações de humor ou maior sensibilidade emocional.',
      },
      {
        title: 'Dores de cabeça',
        text: 'Podem ocorrer dores de cabeça ligeiras durante o período de adaptação.',
      },
    ],
    body3: 'As primeiras semanas ou os primeiros ciclos podem ser diferentes do que estava habituada. O corpo pode adaptar-se gradualmente ao novo equilíbrio hormonal.',
    tip1Title: 'Bom saber',
    tip1Text: 'Um efeito que surge pouco depois de começar um método merece ser acompanhado ao longo do tempo. Se se tornar incómodo ou persistir, fale com um profissional de saúde.',
    body4: 'Pode ser útil registar os sintomas na aplicação para acompanhar melhor a sua evolução de um ciclo para o seguinte.',
    trackingTitle: 'Acompanhar a evolução',
    trackingSubtitle: 'Alguns pontos de referência podem ser úteis',
    trackingLines: [
      'Anote a data em que o sintoma surgiu.',
      'Registe a sua intensidade e duração.',
      'Observe se melhora ou piora.',
    ],
    body5: 'Nem todos os sintomas estão necessariamente ligados à contraceção. O stress, o sono, a alimentação, o seu ciclo ou outros tratamentos também podem influenciar o modo como se sente.',
    body6: 'Para perceber a situação, procure olhar para o contexto global em vez de um único sintoma isolado.',
    worthMentioning: [
      'Alterações de humor marcadas e persistentes',
      'Uma diminuição da libido que a incomode',
      'Perdas de sangue irregulares que durem mais de 3 ciclos',
      'Náuseas ou dores de cabeça que continuem a ser incómodas',
    ],
    questionsTitle: 'Algumas perguntas úteis',
    questions: [
      'Há quanto tempo duram estes sintomas?',
      'Surgiram depois de começar ou de mudar de método contracetivo?',
      'São ligeiros, incómodos ou realmente fora do comum para si?',
      'Estão a melhorar com o tempo ou a tornar-se mais frequentes?',
    ],
    body7: 'Mesmo quando um sintoma não é urgente, pode valer a pena falar sobre ele se se tornar incómodo, persistir ou afetar realmente a sua qualidade de vida.',
    infoTitle: 'Pode ser útil pedir aconselhamento se…',
    infoText: 'os sintomas persistirem, se tornarem mais significativos ou a impedirem de viver normalmente.',
    body8: 'Um médico, uma parteira ou um farmacêutico pode ajudá-la a determinar se os sintomas podem estar ligados ao método que utiliza e se este deve ser ajustado.',
    body9: 'Alguns sinais são fora do comum e exigem uma avaliação médica rápida. Não significam necessariamente que exista uma complicação, mas não devem ser ignorados.',
    alertTitle: 'Procure cuidados rapidamente',
    alertIntro: 'Procure aconselhamento médico rapidamente se sentir, em particular:',
    urgentSigns: [
      'Dor no peito intensa ou fora do comum',
      'Dificuldade súbita em respirar',
      'Inchaço ou dor fora do comum numa perna',
      'Uma dor de cabeça súbita, muito intensa ou fora do comum',
      'Dificuldade súbita na visão, na fala ou na força',
    ],
    emergencyTitle: 'Em caso de situação grave',
    emergencyText: 'Se os sintomas forem súbitos, muito intensos ou vierem acompanhados de dificuldade em respirar, sensação de desmaio ou outro sinal grave, procure ajuda médica urgente.',
    summaryTitle: 'O essencial',
    summaryItems: [
      'Alguns efeitos podem surgir no início de um novo método de contraceção hormonal.',
      'Muitos efeitos são passageiros e podem diminuir com o tempo.',
      'Um sintoma incómodo ou persistente merece ser abordado com um profissional.',
      'Alguns sinais fora do comum exigem aconselhamento médico rápido.',
    ],
    finalTipTitle: 'A reter',
    finalTipText: 'Escutar o seu corpo não significa necessariamente interromper de imediato um método. Anote o que sente, observe como evolui e peça aconselhamento sempre que um sintoma a preocupe.',
    disclaimerText: 'Este artigo tem fins informativos e não substitui um aconselhamento médico personalizado. Se tiver um sintoma significativo ou fora do comum, procure o conselho de um profissional de saúde.',
    shareMessage: 'Reconhecer os possíveis efeitos secundários — AWA',
  },
  bn: {
    badge: 'পার্শ্বপ্রতিক্রিয়া',
    title: 'সম্ভাব্য পার্শ্বপ্রতিক্রিয়া\nচিনে নেওয়া',
    metaDuration: 'পড়তে 8 মিনিট',
    metaType: 'নিবন্ধ',
    metaLevel: 'মধ্যম',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'কিছু প্রতিক্রিয়া সাধারণ ও সাময়িক হতে পারে। অন্যগুলোতে বেশি মনোযোগ দরকার। স্বাভাবিক প্রতিক্রিয়া এবং যেসব লক্ষণ মূল্যায়ন করানো উচিত, তার পার্থক্য চিনতে শিখুন।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'সাধারণ, মৃদু প্রতিক্রিয়া',
      'শরীরের মানিয়ে নেওয়ার সময়',
      'কী বদলাচ্ছে তা পর্যবেক্ষণ',
      'কখন চিকিৎসকের পরামর্শ নেবেন',
      'কখন দ্রুত চিকিৎসা নেবেন',
      'মূল কথা',
    ],
    body1: 'কেউ নতুন হরমোনাল জন্মনিয়ন্ত্রণ পদ্ধতি শুরু করলে শরীরের মানিয়ে নিতে কিছু সময় লাগতে পারে। চক্র, মেজাজ বা শারীরিক স্বাচ্ছন্দ্যে ছোটখাটো পরিবর্তন দেখা দিতে পারে।',
    body2: 'এই প্রতিক্রিয়াগুলো প্রায়ই মৃদু হয় এবং ধীরে ধীরে কমে যেতে পারে। এগুলো থাকলেই যে পদ্ধতিটি বিপজ্জনক বা তা বন্ধ করতে হবে, এমন নয়।',
    commonEffects: [
      {
        title: 'সামান্য রক্তপাত',
        text: 'বিশেষ করে নতুন পদ্ধতি শুরুর সময় অনিয়মিত রক্তপাত হতে পারে।',
      },
      {
        title: 'স্তনে স্পর্শকাতরতা',
        text: 'সাময়িকভাবে স্তন শক্ত বা স্পর্শকাতর মনে হতে পারে।',
      },
      {
        title: 'মেজাজ',
        text: 'কেউ কেউ মেজাজের পরিবর্তন বা আবেগের স্পর্শকাতরতা বৃদ্ধি লক্ষ করেন।',
      },
      {
        title: 'মাথাব্যথা',
        text: 'মানিয়ে নেওয়ার সময়ে মৃদু মাথাব্যথা হতে পারে।',
      },
    ],
    body3: 'প্রথম কয়েক সপ্তাহ বা কয়েকটি চক্র আগের অভ্যস্ত অবস্থার চেয়ে আলাদা হতে পারে। শরীর ধীরে ধীরে নতুন হরমোনের ভারসাম্যের সঙ্গে মানিয়ে নিতে পারে।',
    tip1Title: 'জেনে রাখা ভালো',
    tip1Text: 'কোনো পদ্ধতি শুরুর অল্প সময় পরে দেখা দেওয়া প্রতিক্রিয়া সময়ের সঙ্গে পর্যবেক্ষণ করা ভালো। তা বিরক্তিকর হয়ে উঠলে বা থেকে গেলে স্বাস্থ্যসেবা পেশাজীবীর সঙ্গে কথা বলুন।',
    body4: 'এক চক্র থেকে আরেক চক্রে উপসর্গ কীভাবে বদলায় তা ভালোভাবে অনুসরণ করতে আপনার অ্যাপে উপসর্গ লিখে রাখা সহায়ক হতে পারে।',
    trackingTitle: 'পরিবর্তন অনুসরণ করুন',
    trackingSubtitle: 'কয়েকটি সূচক সহায়ক হতে পারে',
    trackingLines: [
      'উপসর্গ কোন তারিখে দেখা দিয়েছে তা লিখে রাখুন।',
      'এর তীব্রতা ও স্থায়িত্ব নথিভুক্ত করুন।',
      'লক্ষ করুন এটি ভালো হচ্ছে নাকি খারাপ হচ্ছে।',
    ],
    body5: 'সব উপসর্গ যে জন্মনিয়ন্ত্রণের কারণেই হচ্ছে, এমন নয়। মানসিক চাপ, ঘুম, খাদ্যাভ্যাস, আপনার চক্র বা অন্যান্য চিকিৎসাও আপনার অনুভূতিকে প্রভাবিত করতে পারে।',
    body6: 'পরিস্থিতি বুঝতে একটিমাত্র উপসর্গকে আলাদাভাবে না দেখে সার্বিক প্রেক্ষাপট দেখার চেষ্টা করুন।',
    worthMentioning: [
      'স্পষ্ট ও দীর্ঘস্থায়ী মেজাজের পরিবর্তন',
      'যৌন আকাঙ্ক্ষা কমে যাওয়া, যা আপনাকে বিরক্ত করে',
      '3টি চক্রের বেশি সময় ধরে চলা অনিয়মিত রক্তপাত',
      'বমি বমি ভাব বা মাথাব্যথা, যা বিরক্তিকর থেকে যায়',
    ],
    questionsTitle: 'কয়েকটি সহায়ক প্রশ্ন',
    questions: [
      'এই উপসর্গগুলো কত দিন ধরে চলছে?',
      'জন্মনিয়ন্ত্রণ পদ্ধতি শুরু বা পরিবর্তনের পর কি এগুলো দেখা দিয়েছে?',
      'এগুলো কি মৃদু, বিরক্তিকর, নাকি আপনার জন্য সত্যিই অস্বাভাবিক?',
      'সময়ের সঙ্গে এগুলো কি কমছে, নাকি আরও ঘন ঘন হচ্ছে?',
    ],
    body7: 'কোনো উপসর্গ জরুরি না হলেও, তা বিরক্তিকর হয়ে উঠলে, থেকে গেলে বা আপনার জীবনের মানকে সত্যিই প্রভাবিত করলে সে বিষয়ে আলোচনা করা ভালো।',
    infoTitle: 'পরামর্শ নেওয়া ভালো হতে পারে যদি…',
    infoText: 'উপসর্গ থেকে যায়, আরও গুরুতর হয়, বা আপনাকে স্বাভাবিকভাবে জীবন কাটাতে বাধা দেয়।',
    body8: 'ডাক্তার, ধাত্রী বা ফার্মাসিস্ট নির্ধারণ করতে সাহায্য করতে পারেন যে উপসর্গগুলো আপনার ব্যবহৃত পদ্ধতির সঙ্গে সম্পর্কিত হতে পারে কি না এবং পদ্ধতিটি বদলানো দরকার কি না।',
    body9: 'কিছু লক্ষণ অস্বাভাবিক এবং দ্রুত চিকিৎসা মূল্যায়নের দাবি রাখে। এগুলো থাকলেই যে কোনো জটিলতা আছে, এমন নয়; তবে এগুলো উপেক্ষা করা উচিত নয়।',
    alertTitle: 'দ্রুত চিকিৎসা নিন',
    alertIntro: 'বিশেষ করে নিচের কিছু দেখা দিলে দ্রুত চিকিৎসকের পরামর্শ নিন:',
    urgentSigns: [
      'বুকে তীব্র বা অস্বাভাবিক ব্যথা',
      'হঠাৎ শ্বাসকষ্ট',
      'পায়ে অস্বাভাবিক ফোলা বা ব্যথা',
      'হঠাৎ অত্যন্ত তীব্র বা অস্বাভাবিক মাথাব্যথা',
      'হঠাৎ দেখতে বা কথা বলতে অসুবিধা, কিংবা শরীরে দুর্বলতা',
    ],
    emergencyTitle: 'গুরুতর পরিস্থিতিতে',
    emergencyText: 'উপসর্গ হঠাৎ হলে, অত্যন্ত তীব্র হলে, বা সঙ্গে শ্বাসকষ্ট, অজ্ঞান হয়ে যাওয়ার মতো অনুভূতি অথবা অন্য কোনো গুরুতর লক্ষণ থাকলে জরুরি চিকিৎসা সহায়তা নিন।',
    summaryTitle: 'সারকথা',
    summaryItems: [
      'নতুন হরমোনাল জন্মনিয়ন্ত্রণ পদ্ধতি শুরুর সময় কিছু প্রতিক্রিয়া দেখা দিতে পারে।',
      'অনেক প্রতিক্রিয়া সাময়িক এবং সময়ের সঙ্গে কমে যেতে পারে।',
      'বিরক্তিকর বা দীর্ঘস্থায়ী উপসর্গ নিয়ে পেশাজীবীর সঙ্গে কথা বলা ভালো।',
      'কিছু অস্বাভাবিক লক্ষণে দ্রুত চিকিৎসকের পরামর্শ প্রয়োজন।',
    ],
    finalTipTitle: 'মূল কথা',
    finalTipText: 'নিজের শরীরের কথা শোনার অর্থ এই নয় যে সঙ্গে সঙ্গে কোনো পদ্ধতি বন্ধ করে দিতে হবে। আপনি যা অনুভব করছেন তা লিখে রাখুন, কীভাবে বদলায় তা লক্ষ করুন, এবং কোনো উপসর্গ আপনাকে চিন্তায় ফেললেই পরামর্শ নিন।',
    disclaimerText: 'এই নিবন্ধ তথ্যের উদ্দেশ্যে লেখা এবং ব্যক্তিগত চিকিৎসা পরামর্শের বিকল্প নয়। গুরুতর বা অস্বাভাবিক কোনো উপসর্গ থাকলে স্বাস্থ্যসেবা পেশাজীবীর পরামর্শ নিন।',
    shareMessage: 'সম্ভাব্য পার্শ্বপ্রতিক্রিয়া চিনে নেওয়া — AWA',
  },
  da: {
    badge: 'Bivirkninger',
    title: 'Genkend mulige\nbivirkninger',
    metaDuration: '8 minutters læsning',
    metaType: 'Artikel',
    metaLevel: 'Mellemsvær',
    metaValidated: 'Gennemset indhold',
    intro: 'Nogle reaktioner er normale og midlertidige. Andre kræver mere opmærksomhed. Lær at skelne mellem normale reaktioner og symptomer, der bør vurderes.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Almindelige, milde reaktioner',
      'Kroppens tilpasningstid',
      'Observer hvad der ændrer sig',
      'Hvornår du bør kontakte en læge',
      'Hvornår du bør søge hjælp hurtigt',
      'Det vigtigste',
    ],
    body1: 'Når du starter en ny hormonel prævention, kan kroppen have brug for lidt tid til at tilpasse sig. Der kan forekomme mindre ændringer i din cyklus, humør eller fysisk velvære.',
    body2: 'Disse reaktioner er ofte milde og kan aftage med tiden. De er ikke nødvendigvis et tegn på, at metoden er farlig, eller at du skal stoppe.',
    commonEffects: [
      {
        title: 'Let blødning',
        text: 'Uregelmæssig blødning kan forekomme, særligt ved opstart af en ny metode.',
      },
      {
        title: 'Ømme bryster',
        text: 'Brysterne kan midlertidigt føles spændte eller ømme.',
      },
      {
        title: 'Humør',
        text: 'Nogle bemærker humørsvingninger eller øget følelsesmæssig sårbarhed.',
      },
      {
        title: 'Hovedpine',
        text: 'Let hovedpine kan forekomme i tilpasningsperioden.',
      },
    ],
    body3: 'De første par uger eller cyklusser kan være anderledes end det, du er vant til. Kroppen kan gradvist tilpasse sig den nye hormonbalance.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Reaktioner, der opstår kort tid efter opstart af en metode, er gode at følge over tid. Tal med et sundhedspersonale, hvis de bliver generende eller fortsætter.',
    body4: 'Det kan hjælpe at registrere symptomer i din app for bedre at følge, hvordan de ændrer sig fra cyklus til cyklus.',
    trackingTitle: 'Følg ændringerne',
    trackingSubtitle: 'Nogle indikatorer kan hjælpe',
    trackingLines: [
      'Notér hvilken dato et symptom opstod.',
      'Registrér dets intensitet og varighed.',
      'Bemærk om det bliver bedre eller værre.',
    ],
    body5: 'Ikke alle symptomer skyldes præventionen. Stress, søvn, kost, din cyklus eller andre helbredsmæssige forhold kan også påvirke, hvordan du har det.',
    body6: 'Forsøg at se det samlede billede frem for at isolere ét enkelt symptom for at forstå situationen.',
    worthMentioning: [
      'Tydelige og vedvarende humørændringer',
      'Reduceret sexlyst, som generer dig',
      'Uregelmæssig blødning i mere end 3 cyklusser',
      'Kvalme eller hovedpine, som forbliver generende',
    ],
    questionsTitle: 'Nogle hjælpsomme spørgsmål',
    questions: [
      'Hvor længe har disse symptomer stået på?',
      'Opstod de efter opstart eller skift af præventionsmetode?',
      'Er de milde, generende eller virkelig usædvanlige for dig?',
      'Er de aftaget med tiden, eller sker de hyppigere?',
    ],
    body7: 'Selv hvis et symptom ikke er akut, er det godt at tale om det, hvis det er generende, vedvarer, eller virkelig påvirker din livskvalitet.',
    infoTitle: 'Det kan være en god idé at søge råd, hvis…',
    infoText: 'Symptomerne vedvarer, bliver mere alvorlige, eller forhindrer dig i at leve dit normale liv.',
    body8: 'En læge, jordemoder eller farmaceut kan hjælpe med at afklare, om symptomerne kan hænge sammen med din metode, og om et skift er nødvendigt.',
    body9: 'Visse tegn er usædvanlige og kræver hurtig medicinsk vurdering. Deres tilstedeværelse betyder ikke nødvendigvis, at der er en komplikation, men de bør ikke ignoreres.',
    alertTitle: 'Søg hurtig hjælp',
    alertIntro: 'Kontakt hurtigt en læge, særligt hvis du oplever noget af følgende:',
    urgentSigns: [
      'Kraftige eller usædvanlige brystsmerter',
      'Pludselig åndenød',
      'Usædvanlig hævelse eller smerter i benene',
      'Pludselig meget kraftig eller usædvanlig hovedpine',
      'Pludselige synsproblemer, talebesvær eller svaghed i kroppen',
    ],
    emergencyTitle: 'I alvorlige situationer',
    emergencyText: 'Kontakt akut lægehjælp, hvis symptomerne opstår pludseligt, er meget intense, eller ledsages af åndenød, besvimelsesanfald eller andre alvorlige tegn.',
    summaryTitle: 'Det vigtigste',
    summaryItems: [
      'Nogle reaktioner kan forekomme ved opstart af ny hormonel prævention.',
      'Mange reaktioner er midlertidige og kan aftage med tiden.',
      'Det er godt at tale med en fagperson om generende eller vedvarende symptomer.',
      'Visse usædvanlige tegn kræver hurtig lægekonsultation.',
    ],
    finalTipTitle: 'Det vigtigste',
    finalTipText: 'At lytte til din krop betyder ikke, at du straks skal stoppe en metode. Notér hvad du oplever, observer hvordan det ændrer sig, og søg råd, så snart et symptom bekymrer dig.',
    disclaimerText: 'Denne artikel er til informationsformål og er ikke en erstatning for personlig medicinsk rådgivning. Kontakt et sundhedspersonale, hvis du har alvorlige eller usædvanlige symptomer.',
    shareMessage: 'Genkend mulige bivirkninger — AWA',
  },
  sv: {
    badge: 'Bivirkninger',
    title: 'Genkend mulige\nbivirkninger',
    metaDuration: '8 minutters läsning',
    metaType: 'Artikel',
    metaLevel: 'Mellemsvär',
    metaValidated: 'Gennemset indhold',
    intro: 'Nogle reaktioner ar normale och midlertidige. Andre kräver mere opmärksomhed. Lär at skelne mellem normale reaktioner och symtom, der bör vurderes.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Almindelige, milde reaktioner',
      'Kroppens tilpasningstid',
      'Observer hvad der ändrer sig',
      'Hvornår du bör kontakte en läge',
      'Hvornår du bör söge hjälp hurtigt',
      'Det vigtigste',
    ],
    body1: 'Når du starter en ny hormonel prävention, kan kroppen have brug for lite tid till at tilpasse sig. Der kan forekomme mindre ändringer i din cyklus, humör eller fysisk velväre.',
    body2: 'Disse reaktioner ar ofta milde och kan aftage med tiden. De ar inte nödvendigvis et tegn på, at metoden ar farlig, eller at du skal stoppe.',
    commonEffects: [
      {
        title: 'Let blödning',
        text: 'Uregelmässig blödning kan forekomme, särligt ved opstart av en ny metode.',
      },
      {
        title: 'Ömme bryster',
        text: 'Brysterne kan midlertidigt föles spändte eller ömme.',
      },
      {
        title: 'Humör',
        text: 'Nogle bemärker humörsvingninger eller öget fölelsesmässig sårbarhed.',
      },
      {
        title: 'Hovedpine',
        text: 'Let hovedpine kan forekomme i tilpasningsperioden.',
      },
    ],
    body3: 'De förste par veckor eller cyklusser kan väre anderledes end det, du ar vant till. Kroppen kan gradvist tilpasse sig den nye hormonbalance.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Reaktioner, der opstår kort tid efter opstart av en metode, ar gode at fölge over tid. Tal med et halsaspersonale, hvis de bliver generende eller fortsätter.',
    body4: 'Det kan hjälpe at registrere symtom i din app for bedre at fölge, hvordan de ändrer sig fran cyklus till cyklus.',
    trackingTitle: 'Fölg ändringerne',
    trackingSubtitle: 'Nogle indikatorer kan hjälpe',
    trackingLines: [
      'Notér hvilken dato et symptom opstod.',
      'Registrér dets intensitet och varighed.',
      'Bemärk om det bliver bedre eller värre.',
    ],
    body5: 'Ikke alla symtom skyldes präventionen. Stress, sövn, kost, din cyklus eller andre helbredsmässige forhold kan også påvirke, hvordan du har det.',
    body6: 'Forsög at se det samlede billede frem for att isolere ét enkelt symptom for att forstå situationen.',
    worthMentioning: [
      'Tydelige och vedvarende humörändringer',
      'Reduceret sexlyst, som generer dig',
      'Uregelmässig blödning i mere end 3 cyklusser',
      'Kvalme eller hovedpine, som forbliver generende',
    ],
    questionsTitle: 'Nogle hjälpsomme spörgsmål',
    questions: [
      'Hvor länge har disse symtom stået på?',
      'Opstod de efter opstart eller skift av präventionsmetode?',
      'Er de milde, generende eller virkelig usädvanlige for dig?',
      'Er de aftaget med tiden, eller sker de hyppigere?',
    ],
    body7: 'Selv hvis et symptom inte ar akut, ar det godt at tale om det, hvis det ar generende, vedvarer, eller virkelig påvirker din livskvalitet.',
    infoTitle: 'Det kan väre en god idé at söge råd, hvis…',
    infoText: 'Symtomne vedvarer, bliver mere alvorlige, eller forhindrer dig i at leve ditt normale liv.',
    body8: 'En läge, jordemoder eller farmaceut kan hjälpe med at afklare, om symtomne kan hänge sammen med din metode, och om et skift ar nödvendigt.',
    body9: 'Visse tegn ar usädvanlige och kräver hurtig medicinsk vurdering. Deres tilstedevärelse betyder inte nödvendigvis, at der ar en komplikation, men de bör inte ignoreres.',
    alertTitle: 'Sög hurtig hjälp',
    alertIntro: 'Kontakt hurtigt en läge, särligt hvis du oplever noget av fölgende:',
    urgentSigns: [
      'Kraftige eller usädvanlige brystsmerter',
      'Pludselig åndenöd',
      'Usädvanlig hävelse eller smartor i benene',
      'Pludselig mycket kraftig eller usädvanlig hovedpine',
      'Pludselige synsproblemer, talebesvär eller svaghed i kroppen',
    ],
    emergencyTitle: 'I alvorlige situationer',
    emergencyText: 'Kontakt akut lägehjälp, hvis symtomne opstår pludseligt, ar mycket intense, eller ledsages av åndenöd, besvimelsesanfald eller andre alvorlige tegn.',
    summaryTitle: 'Det vigtigste',
    summaryItems: [
      'Nogle reaktioner kan forekomme ved opstart av ny hormonel prävention.',
      'Mange reaktioner ar midlertidige och kan aftage med tiden.',
      'Det ar godt at tale med en fagperson om generende eller vedvarende symtom.',
      'Visse usädvanlige tegn kräver hurtig lägekonsultation.',
    ],
    finalTipTitle: 'Det vigtigste',
    finalTipText: 'At lytte till din krop betyder inte, at du straks skal stoppe en metode. Notér hvad du oplever, observer hvordan det ändrer sig, och sög råd, så snart et symptom bekymrer dig.',
    disclaimerText: 'Denne artikel ar till informationsformål och ar inte en erstatning for personlig medicinsk rådgivning. Kontakt et halsaspersonale, hvis du har alvorlige eller usädvanlige symtom.',
    shareMessage: 'Genkend mulige bivirkninger — AWA',
  },
  nb: {
    badge: 'BIVIRKNINGER',
    title: 'Kjenne igjen mulige\nbivirkninger',
    metaDuration: '8 min lesing',
    metaType: 'Artikkel',
    metaLevel: 'Middels',
    metaValidated: 'Gjennomgått innhold',
    intro:
      'Noen effekter kan være vanlige og midlertidige. Andre krever mer oppmerksomhet. Lær å skille mellom vanlige reaksjoner og tegn som bør vurderes.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Vanlige, milde effekter',
      'Kroppens tilpasningsperiode',
      'Observere hva som endrer seg',
      'Når du bør søke medisinsk råd',
      'Når du bør søke hjelp raskt',
      'Det viktigste å huske',
    ],
    body1:
      'Når man begynner med en ny hormonell prevensjonsmetode, kan kroppen trenge litt tid til å tilpasse seg. Små endringer kan dukke opp i syklusen, humøret eller den fysiske komforten.',
    body2:
      'Disse effektene er ofte milde og kan avta gradvis. At de er til stede, betyr ikke automatisk at metoden er farlig eller at den må stoppes.',
    commonEffects: [
      {
        title: 'Lett blødning',
        text: 'Uregelmessig blødning kan forekomme, særlig i starten av en ny metode.',
      },
      {
        title: 'Ømme bryster',
        text: 'Spenning eller ømhet i brystene kan kjennes midlertidig.',
      },
      {
        title: 'Humør',
        text: 'Noen merker humørendringer eller økt følelsesmessig sårbarhet.',
      },
      {
        title: 'Hodepine',
        text: 'Mild hodepine kan forekomme i tilpasningsperioden.',
      },
    ],
    body3:
      'De første ukene eller syklusene kan være annerledes enn det du var vant til før. Kroppen kan gradvis tilpasse seg den nye hormonelle balansen.',
    tip1Title: 'Godt å vite',
    tip1Text:
      'En effekt som dukker opp kort tid etter at du har begynt med en metode, er verdt å følge med på over tid. Hvis den blir plagsom eller vedvarer, bør du snakke med helsepersonell.',
    body4:
      'Det kan være nyttig å registrere symptomer i appen din for å følge bedre hvordan de endrer seg fra en syklus til den neste.',
    trackingTitle: 'Følg utviklingen',
    trackingSubtitle: 'Noen markører kan være nyttige',
    trackingLines: [
      'Noter datoen symptomet dukket opp.',
      'Registrer styrken og varigheten.',
      'Følg med på om det blir bedre eller verre.',
    ],
    body5:
      'Ikke alle symptomer henger nødvendigvis sammen med prevensjonen. Stress, søvn, kosthold, syklusen din eller andre behandlinger kan også påvirke hvordan du har det.',
    body6:
      'For å forstå situasjonen bør du prøve å se på den overordnede sammenhengen heller enn et enkelt symptom isolert.',
    worthMentioning: [
      'Tydelige, vedvarende humørendringer',
      'Nedgang i sexlyst som plager deg',
      'Uregelmessig blødning som varer i mer enn 3 sykluser',
      'Kvalme eller hodepine som fortsatt er plagsom',
    ],
    questionsTitle: 'Noen nyttige spørsmål',
    questions: [
      'Hvor lenge har disse symptomene pågått?',
      'Dukket de opp etter at du begynte med eller endret prevensjonsmetode?',
      'Er de milde, plagsomme eller virkelig uvanlige for deg?',
      'Blir de bedre over tid eller hyppigere?',
    ],
    body7:
      'Selv når et symptom ikke haster, kan det være verdt å ta det opp hvis det blir plagsomt, vedvarer eller virkelig påvirker livskvaliteten din.',
    infoTitle: 'Det kan være verdt å søke råd hvis …',
    infoText:
      'symptomene vedvarer, blir mer betydelige eller hindrer deg i å leve normalt.',
    body8:
      'En lege, jordmor eller farmasøyt kan hjelpe deg å avgjøre om symptomene kan henge sammen med metoden du bruker, og om den bør justeres.',
    body9:
      'Noen tegn er uvanlige og krever rask medisinsk vurdering. De betyr ikke nødvendigvis at det foreligger en komplikasjon, men de bør ikke overses.',
    alertTitle: 'Søk hjelp raskt',
    alertIntro: 'Søk medisinsk råd raskt hvis du opplever særlig:',
    urgentSigns: [
      'Betydelige eller uvanlige brystsmerter',
      'Plutselige pustevansker',
      'Uvanlig hevelse eller smerte i et ben',
      'En plutselig, svært intens eller uvanlig hodepine',
      'Plutselige problemer med syn, tale eller kraft',
    ],
    emergencyTitle: 'Ved en alvorlig situasjon',
    emergencyText:
      'Hvis symptomene er plutselige, svært alvorlige eller kommer sammen med pustevansker, følelse av å besvime eller et annet alvorlig tegn, søk akutt medisinsk hjelp.',
    summaryTitle: 'Det viktigste',
    summaryItems: [
      'Noen effekter kan dukke opp i starten av en ny hormonell prevensjonsmetode.',
      'Mange effekter er midlertidige og kan avta over tid.',
      'Et plagsomt eller vedvarende symptom er verdt å ta opp med en fagperson.',
      'Noen uvanlige tegn krever rask medisinsk rådgivning.',
    ],
    finalTipTitle: 'Det viktigste å huske',
    finalTipText:
      'Å lytte til kroppen din betyr ikke nødvendigvis å slutte med en metode med en gang. Noter det du kjenner, følg med på hvordan det utvikler seg, og be om råd når et symptom bekymrer deg.',
    disclaimerText:
      'Denne artikkelen er ment som informasjon og erstatter ikke personlig medisinsk rådgivning. Hvis du har et betydelig eller uvanlig symptom, bør du søke råd hos helsepersonell.',
    shareMessage: 'Kjenne igjen mulige bivirkninger – AWA',
  },
  pl: {
    badge: 'SKUTKI UBOCZNE',
    title: 'Rozpoznawanie możliwych\nskutków ubocznych',
    metaDuration: '8 min czytania',
    metaType: 'Artykuł',
    metaLevel: 'Średnio zaawansowany',
    metaValidated: 'Treść zweryfikowana',
    intro:
      'Niektóre skutki mogą być częste i przejściowe. Inne wymagają większej uwagi. Naucz się odróżniać zwykłe reakcje od objawów, które należy ocenić.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Częste, łagodne skutki',
      'Okres przystosowania organizmu',
      'Obserwowanie zmian',
      'Kiedy zasięgnąć porady medycznej',
      'Kiedy szybko zgłosić się po pomoc',
      'Najważniejsze wnioski',
    ],
    body1:
      'Gdy ktoś zaczyna stosować nową hormonalną metodę antykoncepcji, organizm może potrzebować czasu na przystosowanie się. Mogą pojawić się niewielkie zmiany w cyklu, nastroju lub samopoczuciu fizycznym.',
    body2:
      'Te skutki są często łagodne i mogą stopniowo słabnąć. Ich obecność nie oznacza automatycznie, że metoda jest niebezpieczna lub że trzeba ją odstawić.',
    commonEffects: [
      {
        title: 'Niewielkie krwawienia',
        text: 'Mogą wystąpić nieregularne krwawienia, zwłaszcza na początku stosowania nowej metody.',
      },
      {
        title: 'Tkliwość piersi',
        text: 'Przejściowo można odczuwać napięcie lub tkliwość piersi.',
      },
      {
        title: 'Nastrój',
        text: 'Niektóre osoby zauważają zmiany nastroju lub zwiększoną wrażliwość emocjonalną.',
      },
      {
        title: 'Bóle głowy',
        text: 'W okresie przystosowania mogą wystąpić łagodne bóle głowy.',
      },
    ],
    body3:
      'Pierwsze tygodnie lub cykle mogą różnić się od tego, do czego byłaś przyzwyczajona wcześniej. Organizm może stopniowo przystosować się do nowej równowagi hormonalnej.',
    tip1Title: 'Warto wiedzieć',
    tip1Text:
      'Skutek, który pojawia się krótko po rozpoczęciu stosowania metody, warto obserwować w czasie. Jeśli staje się uciążliwy lub się utrzymuje, porozmawiaj ze specjalistą.',
    body4:
      'Pomocne może być zapisywanie objawów w aplikacji, aby lepiej śledzić, jak zmieniają się w kolejnych cyklach.',
    trackingTitle: 'Śledź, jak się zmieniają',
    trackingSubtitle: 'Kilka znaczników może być pomocnych',
    trackingLines: [
      'Zanotuj datę pojawienia się objawu.',
      'Zapisz jego nasilenie i czas trwania.',
      'Obserwuj, czy się poprawia, czy pogarsza.',
    ],
    body5:
      'Nie wszystkie objawy muszą być związane z antykoncepcją. Na to, jak się czujesz, mogą też wpływać stres, sen, dieta, cykl lub inne leczenie.',
    body6:
      'Aby zrozumieć sytuację, spróbuj spojrzeć na ogólny kontekst, a nie na pojedynczy objaw w oderwaniu.',
    worthMentioning: [
      'Wyraźne, utrzymujące się zmiany nastroju',
      'Spadek libido, który Ci przeszkadza',
      'Nieregularne krwawienia trwające dłużej niż 3 cykle',
      'Nudności lub bóle głowy, które nadal są uciążliwe',
    ],
    questionsTitle: 'Kilka pomocnych pytań',
    questions: [
      'Od jak dawna trwają te objawy?',
      'Czy pojawiły się po rozpoczęciu lub zmianie metody antykoncepcji?',
      'Czy są łagodne, uciążliwe, czy naprawdę nietypowe dla Ciebie?',
      'Czy poprawiają się z czasem, czy stają się częstsze?',
    ],
    body7:
      'Nawet jeśli objaw nie jest pilny, warto go omówić, jeśli staje się uciążliwy, utrzymuje się lub naprawdę wpływa na jakość życia.',
    infoTitle: 'Warto zasięgnąć porady, jeśli…',
    infoText:
      'objawy się utrzymują, nasilają lub uniemożliwiają normalne funkcjonowanie.',
    body8:
      'Lekarz, położna lub farmaceuta może pomóc ustalić, czy objawy mogą być związane ze stosowaną metodą i czy trzeba ją dostosować.',
    body9:
      'Niektóre objawy są nietypowe i wymagają szybkiej oceny lekarskiej. Niekoniecznie oznaczają powikłanie, ale nie należy ich ignorować.',
    alertTitle: 'Szybko zgłoś się po pomoc',
    alertIntro: 'Szybko zasięgnij porady medycznej, jeśli wystąpi w szczególności:',
    urgentSigns: [
      'Silny lub nietypowy ból w klatce piersiowej',
      'Nagła trudność w oddychaniu',
      'Nietypowy obrzęk lub ból nogi',
      'Nagły, bardzo silny lub nietypowy ból głowy',
      'Nagłe zaburzenia widzenia, mowy lub siły',
    ],
    emergencyTitle: 'W ciężkiej sytuacji',
    emergencyText:
      'Jeśli objawy są nagłe, bardzo silne lub towarzyszy im trudność w oddychaniu, uczucie omdlenia lub inny poważny objaw, szukaj pilnej pomocy medycznej.',
    summaryTitle: 'Najważniejsze',
    summaryItems: [
      'Niektóre skutki mogą pojawić się na początku stosowania nowej hormonalnej metody antykoncepcji.',
      'Wiele skutków jest przejściowych i może z czasem słabnąć.',
      'Uciążliwy lub utrzymujący się objaw warto omówić ze specjalistą.',
      'Niektóre nietypowe objawy wymagają szybkiej porady medycznej.',
    ],
    finalTipTitle: 'Najważniejsze do zapamiętania',
    finalTipText:
      'Słuchanie swojego ciała niekoniecznie oznacza natychmiastowe odstawienie metody. Zapisuj, co czujesz, obserwuj, jak się to zmienia, i proś o poradę, ilekroć objaw Cię niepokoi.',
    disclaimerText:
      'Ten artykuł ma charakter informacyjny i nie zastępuje spersonalizowanej porady medycznej. Jeśli masz znaczący lub nietypowy objaw, zasięgnij porady specjalisty.',
    shareMessage: 'Rozpoznawanie możliwych skutków ubocznych — AWA',
  },
  uk: {
    badge: 'ПОБІЧНІ ЕФЕКТИ',
    title: 'Розпізнавання можливих\nпобічних ефектів',
    metaDuration: '8 хв читання',
    metaType: 'Стаття',
    metaLevel: 'Середній',
    metaValidated: 'Перевірений вміст',
    intro:
      'Деякі ефекти можуть бути поширеними й тимчасовими. Інші потребують більшої уваги. Навчіться розрізняти звичайні реакції та ознаки, які слід оцінити.',
    contentsTitle: 'У цій статті',
    topics: [
      'Поширені, легкі ефекти',
      'Період пристосування організму',
      'Спостереження за змінами',
      'Коли звертатися за медичною порадою',
      'Коли швидко звертатися по допомогу',
      'Головні висновки',
    ],
    body1:
      'Коли людина починає застосовувати новий метод гормональної контрацепції, організму може знадобитися час, щоб пристосуватися. Можуть з’явитися невеликі зміни в циклі, настрої чи фізичному комфорті.',
    body2:
      'Ці ефекти часто легкі й можуть поступово слабшати. Їхня наявність не означає автоматично, що метод небезпечний або що його потрібно припинити.',
    commonEffects: [
      {
        title: 'Незначні кровотечі',
        text: 'Можуть виникати нерегулярні кровотечі, особливо на початку застосування нового методу.',
      },
      {
        title: 'Болючість грудей',
        text: 'Тимчасово можуть відчуватися напруження чи болючість грудей.',
      },
      {
        title: 'Настрій',
        text: 'Деякі люди помічають зміни настрою чи підвищену емоційну чутливість.',
      },
      {
        title: 'Головні болі',
        text: 'У період пристосування можуть виникати легкі головні болі.',
      },
    ],
    body3:
      'Перші тижні чи цикли можуть відрізнятися від того, до чого ви звикли раніше. Організм може поступово пристосуватися до нового гормонального балансу.',
    tip1Title: 'Варто знати',
    tip1Text:
      'За ефектом, що з’являється невдовзі після початку застосування методу, варто спостерігати з часом. Якщо він стає прикрим або зберігається, поговоріть із медичним фахівцем.',
    body4:
      'Корисно записувати симптоми у вашому застосунку, щоб краще стежити за їхніми змінами від циклу до циклу.',
    trackingTitle: 'Відстежуйте зміни',
    trackingSubtitle: 'Кілька орієнтирів можуть бути корисними',
    trackingLines: [
      'Занотуйте дату появи симптому.',
      'Запишіть його інтенсивність і тривалість.',
      'Спостерігайте, чи він покращується, чи погіршується.',
    ],
    body5:
      'Не всі симптоми обов’язково пов’язані з контрацепцією. На ваше самопочуття можуть також впливати стрес, сон, харчування, ваш цикл чи інше лікування.',
    body6:
      'Щоб зрозуміти ситуацію, спробуйте розглянути загальний контекст, а не окремий симптом ізольовано.',
    worthMentioning: [
      'Виразні, стійкі зміни настрою',
      'Зниження лібідо, що вас турбує',
      'Нерегулярні кровотечі, що тривають понад 3 цикли',
      'Нудота чи головні болі, що залишаються прикрими',
    ],
    questionsTitle: 'Кілька корисних запитань',
    questions: [
      'Як довго тривають ці симптоми?',
      'Чи з’явилися вони після початку або зміни методу контрацепції?',
      'Вони легкі, прикрі чи справді нетипові для вас?',
      'Вони з часом покращуються чи стають частішими?',
    ],
    body7:
      'Навіть якщо симптом не терміновий, його варто обговорити, якщо він стає прикрим, зберігається або справді впливає на якість життя.',
    infoTitle: 'Можливо, варто звернутися за порадою, якщо…',
    infoText:
      'симптоми зберігаються, посилюються або заважають вам жити нормально.',
    body8:
      'Лікар, акушерка чи фармацевт можуть допомогти визначити, чи симптоми можуть бути пов’язані із застосовуваним вами методом і чи потрібно його скоригувати.',
    body9:
      'Деякі ознаки нетипові й потребують швидкої медичної оцінки. Вони не обов’язково означають наявність ускладнення, але їх не слід ігнорувати.',
    alertTitle: 'Швидко зверніться по допомогу',
    alertIntro: 'Швидко зверніться за медичною порадою, якщо у вас виникне, зокрема:',
    urgentSigns: [
      'Сильний або нетиповий біль у грудях',
      'Раптове утруднення дихання',
      'Нетиповий набряк або біль у нозі',
      'Раптовий, дуже сильний або нетиповий головний біль',
      'Раптові порушення зору, мовлення чи сили',
    ],
    emergencyTitle: 'У тяжкій ситуації',
    emergencyText:
      'Якщо симптоми раптові, дуже сильні або супроводжуються утрудненим диханням, відчуттям непритомності чи іншою серйозною ознакою, негайно шукайте невідкладної медичної допомоги.',
    summaryTitle: 'Головне',
    summaryItems: [
      'Деякі ефекти можуть з’явитися на початку застосування нового методу гормональної контрацепції.',
      'Багато ефектів тимчасові й можуть з часом слабшати.',
      'Прикрий або стійкий симптом варто обговорити зі спеціалістом.',
      'Деякі нетипові ознаки потребують швидкої медичної поради.',
    ],
    finalTipTitle: 'Головне, що слід пам’ятати',
    finalTipText:
      'Прислухатися до свого тіла не обов’язково означає одразу припиняти метод. Занотовуйте, що ви відчуваєте, спостерігайте за змінами й просіть поради щоразу, коли симптом вас турбує.',
    disclaimerText:
      'Ця стаття має інформаційний характер і не замінює персоналізованої медичної поради. Якщо у вас є значний або нетиповий симптом, зверніться за порадою до медичного фахівця.',
    shareMessage: 'Розпізнавання можливих побічних ефектів — AWA',
  },
  cs: {
    badge: 'NEŽÁDOUCÍ ÚČINKY',
    title: 'Rozpoznání možných\nnežádoucích účinků',
    metaDuration: '8 min čtení',
    metaType: 'Článek',
    metaLevel: 'Pokročilý',
    metaValidated: 'Ověřený obsah',
    intro:
      'Některé účinky mohou být běžné a přechodné. Jiné vyžadují větší pozornost. Naučte se rozlišit obvyklé reakce od příznaků, které je třeba posoudit.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Běžné, mírné účinky',
      'Období přizpůsobení těla',
      'Pozorování, co se mění',
      'Kdy vyhledat lékařskou radu',
      'Kdy vyhledat rychlou péči',
      'Hlavní poznatky',
    ],
    body1:
      'Když žena začne používat novou metodu hormonální antikoncepce, může tělo potřebovat čas na přizpůsobení. V cyklu, náladě nebo tělesném pohodlí se mohou objevit drobné změny.',
    body2:
      'Tyto účinky jsou často mírné a mohou postupně slábnout. Jejich přítomnost automaticky neznamená, že je metoda nebezpečná nebo že ji je třeba ukončit.',
    commonEffects: [
      {
        title: 'Slabé krvácení',
        text: 'Může se objevit nepravidelné krvácení, zejména na začátku používání nové metody.',
      },
      {
        title: 'Citlivost prsou',
        text: 'Může se dočasně objevit napětí nebo citlivost prsou.',
      },
      {
        title: 'Nálada',
        text: 'Někteří lidé zaznamenají změny nálady nebo zvýšenou emoční citlivost.',
      },
      {
        title: 'Bolesti hlavy',
        text: 'V období přizpůsobení se mohou objevit mírné bolesti hlavy.',
      },
    ],
    body3:
      'První týdny nebo cykly se mohou lišit od toho, na co jste byla zvyklá. Tělo se může na novou hormonální rovnováhu postupně přizpůsobit.',
    tip1Title: 'Stojí za to vědět',
    tip1Text:
      'Účinek, který se objeví krátce po zahájení metody, stojí za to sledovat v čase. Pokud se stane obtěžujícím nebo přetrvává, promluvte si se zdravotnickým pracovníkem.',
    body4:
      'Může být užitečné zaznamenávat příznaky ve své aplikaci, abyste lépe sledovala, jak se mění z jednoho cyklu na další.',
    trackingTitle: 'Sledujte vývoj',
    trackingSubtitle: 'Užitečných může být několik ukazatelů',
    trackingLines: [
      'Poznamenejte si datum, kdy se příznak objevil.',
      'Zaznamenejte jeho intenzitu a délku trvání.',
      'Sledujte, zda se zlepšuje, nebo zhoršuje.',
    ],
    body5:
      'Ne všechny příznaky nutně souvisejí s antikoncepcí. Na to, jak se cítíte, může mít vliv i stres, spánek, strava, váš cyklus nebo jiná léčba.',
    body6:
      'Abyste situaci pochopila, snažte se pohlížet na celkový kontext, nikoli na jediný izolovaný příznak.',
    worthMentioning: [
      'Výrazné, přetrvávající změny nálady',
      'Pokles libida, který vás trápí',
      'Nepravidelné krvácení trvající déle než 3 cykly',
      'Nevolnost nebo bolesti hlavy, které zůstávají obtěžující',
    ],
    questionsTitle: 'Několik užitečných otázek',
    questions: [
      'Jak dlouho tyto příznaky trvají?',
      'Objevily se po zahájení nebo změně metody antikoncepce?',
      'Jsou mírné, obtěžující, nebo pro vás skutečně neobvyklé?',
      'Zlepšují se v čase, nebo se stávají častějšími?',
    ],
    body7:
      'I když příznak není naléhavý, může stát za to ho probrat, pokud se stane obtěžujícím, přetrvává nebo skutečně ovlivňuje kvalitu vašeho života.',
    infoTitle: 'Může stát za to požádat o radu, pokud…',
    infoText:
      'příznaky přetrvávají, zesilují nebo vám brání žít normálně.',
    body8:
      'Lékař, porodní asistentka nebo lékárník vám může pomoci určit, zda mohou příznaky souviset s metodou, kterou používáte, a zda ji je třeba upravit.',
    body9:
      'Některé příznaky jsou neobvyklé a vyžadují rychlé lékařské posouzení. Nemusí nutně znamenat komplikaci, ale neměly by se ignorovat.',
    alertTitle: 'Vyhledejte péči rychle',
    alertIntro: 'Rychle vyhledejte lékařskou radu, pokud zaznamenáte zejména:',
    urgentSigns: [
      'Výraznou nebo neobvyklou bolest na hrudi',
      'Náhlé potíže s dýcháním',
      'Neobvyklý otok nebo bolest v noze',
      'Náhlou, velmi intenzivní nebo neobvyklou bolest hlavy',
      'Náhlé potíže se zrakem, řečí nebo silou',
    ],
    emergencyTitle: 'V případě závažné situace',
    emergencyText:
      'Pokud jsou příznaky náhlé, velmi silné nebo provázené dušností, pocitem na omdlení či jiným závažným příznakem, vyhledejte neodkladnou lékařskou pomoc.',
    summaryTitle: 'To nejdůležitější',
    summaryItems: [
      'Některé účinky se mohou objevit na začátku používání nové metody hormonální antikoncepce.',
      'Mnoho účinků je přechodných a mohou časem slábnout.',
      'Obtěžující nebo přetrvávající příznak stojí za to probrat s odborníkem.',
      'Některé neobvyklé příznaky vyžadují rychlou lékařskou radu.',
    ],
    finalTipTitle: 'Hlavní poznatek',
    finalTipText:
      'Naslouchat svému tělu nemusí nutně znamenat ihned ukončit metodu. Poznamenávejte si, co cítíte, sledujte, jak se to vyvíjí, a požádejte o radu, kdykoli vás příznak znepokojuje.',
    disclaimerText:
      'Tento článek je určen pouze pro informaci a nenahrazuje individuální lékařskou radu. Pokud máte výrazný nebo neobvyklý příznak, vyhledejte radu zdravotnického pracovníka.',
    shareMessage: 'Rozpoznání možných nežádoucích účinků — AWA',
  },
  sk: {
    badge: 'VEDĽAJŠIE ÚČINKY',
    title: 'Rozpoznanie možných\nvedľajších účinkov',
    metaDuration: '8 min čítania',
    metaType: 'Článok',
    metaLevel: 'Stredne pokročilý',
    metaValidated: 'Overený obsah',
    intro:
      'Niektoré účinky môžu byť bežné a dočasné. Iné si vyžadujú väčšiu pozornosť. Naučte sa rozlišovať medzi obvyklými reakciami a znakmi, ktoré treba posúdiť.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Bežné, mierne účinky',
      'Obdobie prispôsobovania tela',
      'Sledovanie toho, čo sa mení',
      'Kedy vyhľadať lekársku radu',
      'Kedy rýchlo vyhľadať starostlivosť',
      'Hlavné body',
    ],
    body1:
      'Keď žena začne používať novú metódu hormonálnej antikoncepcie, telo môže potrebovať nejaký čas na prispôsobenie. V cykle, nálade alebo telesnom pohodlí sa môžu objaviť malé zmeny.',
    body2:
      'Tieto účinky sú často mierne a môžu postupne ustupovať. Ich prítomnosť automaticky neznamená, že metóda je nebezpečná alebo že treba prestať.',
    commonEffects: [
      {
        title: 'Slabé krvácanie',
        text: 'Môže sa objaviť nepravidelné krvácanie, najmä na začiatku novej metódy.',
      },
      {
        title: 'Citlivosť prsníkov',
        text: 'Dočasne sa môže objaviť napätie alebo citlivosť prsníkov.',
      },
      {
        title: 'Nálada',
        text: 'Niektoré ženy si všimnú zmeny nálady alebo zvýšenú emočnú citlivosť.',
      },
      {
        title: 'Bolesti hlavy',
        text: 'Počas obdobia prispôsobovania sa môžu objaviť mierne bolesti hlavy.',
      },
    ],
    body3:
      'Prvé týždne alebo cykly sa môžu líšiť od toho, na čo ste boli zvyknutá predtým. Telo sa môže postupne prispôsobiť novej hormonálnej rovnováhe.',
    tip1Title: 'Stojí za to vedieť',
    tip1Text:
      'Účinok, ktorý sa objaví krátko po začatí metódy, stojí za sledovanie v čase. Ak sa stane obťažujúcim alebo pretrváva, porozprávajte sa so zdravotníckym pracovníkom.',
    body4:
      'Môže byť užitočné zaznamenávať príznaky v aplikácii, aby ste lepšie sledovali, ako sa menia z jedného cyklu na druhý.',
    trackingTitle: 'Sledujte vývoj',
    trackingSubtitle: 'Môže pomôcť niekoľko orientačných bodov',
    trackingLines: [
      'Poznačte si dátum, kedy sa príznak objavil.',
      'Zaznamenajte jeho intenzitu a trvanie.',
      'Sledujte, či sa zlepšuje alebo zhoršuje.',
    ],
    body5:
      'Nie všetky príznaky nutne súvisia s antikoncepciou. Na to, ako sa cítite, môžu mať vplyv aj stres, spánok, strava, váš cyklus alebo iné liečby.',
    body6:
      'Aby ste situáciu pochopili, skúste sa pozrieť na celkový kontext namiesto jediného izolovaného príznaku.',
    worthMentioning: [
      'Výrazné, pretrvávajúce zmeny nálady',
      'Pokles libida, ktorý vám prekáža',
      'Nepravidelné krvácanie trvajúce viac ako 3 cykly',
      'Nevoľnosť alebo bolesti hlavy, ktoré zostávajú obťažujúce',
    ],
    questionsTitle: 'Niekoľko užitočných otázok',
    questions: [
      'Ako dlho tieto príznaky trvajú?',
      'Objavili sa po začatí alebo zmene antikoncepčnej metódy?',
      'Sú mierne, obťažujúce alebo pre vás skutočne nezvyčajné?',
      'Zlepšujú sa v čase alebo sa stávajú častejšími?',
    ],
    body7:
      'Aj keď príznak nie je naliehavý, môže stáť za to o ňom hovoriť, ak sa stane obťažujúcim, pretrváva alebo skutočne ovplyvňuje vašu kvalitu života.',
    infoTitle: 'Môže stáť za to požiadať o radu, ak…',
    infoText:
      'príznaky pretrvávajú, zosilnejú alebo vám bránia žiť normálne.',
    body8:
      'Lekár, pôrodná asistentka alebo lekárnik vám môže pomôcť zistiť, či príznaky môžu súvisieť s používanou metódou a či treba metódu upraviť.',
    body9:
      'Niektoré znaky sú nezvyčajné a vyžadujú rýchle lekárske posúdenie. Nemusia nutne znamenať prítomnosť komplikácie, ale nemali by sa ignorovať.',
    alertTitle: 'Rýchlo vyhľadajte starostlivosť',
    alertIntro: 'Rýchlo vyhľadajte lekársku radu, ak pociťujete najmä:',
    urgentSigns: [
      'Výraznú alebo nezvyčajnú bolesť na hrudi',
      'Náhle ťažkosti s dýchaním',
      'Nezvyčajný opuch alebo bolesť nohy',
      'Náhlu, veľmi intenzívnu alebo nezvyčajnú bolesť hlavy',
      'Náhle problémy so zrakom, rečou alebo silou',
    ],
    emergencyTitle: 'V prípade závažnej situácie',
    emergencyText:
      'Ak sú príznaky náhle, veľmi silné alebo ich sprevádza ťažkosť s dýchaním, pocit na odpadnutie alebo iný vážny znak, vyhľadajte naliehavú lekársku pomoc.',
    summaryTitle: 'To najdôležitejšie',
    summaryItems: [
      'Na začiatku novej metódy hormonálnej antikoncepcie sa môžu objaviť niektoré účinky.',
      'Mnohé účinky sú dočasné a môžu v čase ustúpiť.',
      'Obťažujúci alebo pretrvávajúci príznak stojí za to prediskutovať s odborníkom.',
      'Niektoré nezvyčajné znaky vyžadujú rýchlu lekársku radu.',
    ],
    finalTipTitle: 'Hlavný bod',
    finalTipText:
      'Počúvať svoje telo nemusí nutne znamenať okamžite prestať s metódou. Poznačte si, čo cítite, sledujte vývoj a požiadajte o radu vždy, keď vás príznak znepokojuje.',
    disclaimerText:
      'Tento článok je určený na informačné účely a nenahrádza individuálnu lekársku radu. Ak máte výrazný alebo nezvyčajný príznak, poraďte sa so zdravotníckym pracovníkom.',
    shareMessage: 'Rozpoznanie možných vedľajších účinkov — AWA',
  },
  hu: {
    badge: 'MELLÉKHATÁSOK',
    title: 'A lehetséges\nmellékhatások felismerése',
    metaDuration: '8 perc olvasás',
    metaType: 'Cikk',
    metaLevel: 'Középhaladó',
    metaValidated: 'Ellenőrzött tartalom',
    intro:
      'Egyes hatások gyakoriak és átmenetiek lehetnek. Mások nagyobb figyelmet igényelnek. Tanuld meg megkülönböztetni a szokásos reakciókat azoktól a jelektől, amelyeket ki kell vizsgáltatni.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Gyakori, enyhe hatások',
      'A szervezet alkalmazkodási időszaka',
      'A változások megfigyelése',
      'Mikor kérj orvosi tanácsot',
      'Mikor kérj gyorsan ellátást',
      'Legfontosabb tudnivalók',
    ],
    body1:
      'Amikor valaki új hormonális fogamzásgátló módszert kezd használni, a szervezetnek szüksége lehet némi időre az alkalmazkodáshoz. A ciklusban, a hangulatban vagy a testi komfortban apró változások jelenhetnek meg.',
    body2:
      'Ezek a hatások gyakran enyhék, és fokozatosan csökkenhetnek. Jelenlétük automatikusan nem jelenti, hogy a módszer veszélyes, vagy hogy abba kell hagyni.',
    commonEffects: [
      {
        title: 'Enyhe vérzés',
        text: 'Szabálytalan vérzés előfordulhat, különösen egy új módszer elején.',
      },
      {
        title: 'Mellfeszülés',
        text: 'A mellek feszülése vagy érzékenysége átmenetileg érezhető.',
      },
      {
        title: 'Hangulat',
        text: 'Egyesek hangulatváltozásokat vagy fokozott érzelmi érzékenységet vesznek észre.',
      },
      {
        title: 'Fejfájás',
        text: 'Az alkalmazkodási időszak alatt enyhe fejfájás jelentkezhet.',
      },
    ],
    body3:
      'Az első hetek vagy ciklusok eltérhetnek attól, amihez korábban hozzászoktál. A szervezet fokozatosan alkalmazkodhat az új hormonális egyensúlyhoz.',
    tip1Title: 'Érdemes tudni',
    tip1Text:
      'A módszer megkezdése után hamarosan megjelenő hatást érdemes az idő során figyelni. Ha zavaróvá válik vagy fennmarad, beszélj egészségügyi szakemberrel.',
    body4:
      'Hasznos lehet a tüneteket az alkalmazásodban naplózni, hogy jobban követhesd, hogyan változnak ciklusról ciklusra.',
    trackingTitle: 'Kövesd az alakulást',
    trackingSubtitle: 'Néhány támpont hasznos lehet',
    trackingLines: [
      'Jegyezd fel a tünet megjelenésének dátumát.',
      'Rögzítsd az erősségét és az időtartamát.',
      'Figyeld, hogy javul vagy romlik.',
    ],
    body5:
      'Nem minden tünet feltétlenül kapcsolódik a fogamzásgátláshoz. A stressz, az alvás, az étrend, a ciklusod vagy más kezelések is befolyásolhatják a közérzetedet.',
    body6:
      'A helyzet megértéséhez próbálj a teljes kontextust nézni egyetlen elszigetelt tünet helyett.',
    worthMentioning: [
      'Kifejezett, tartós hangulatváltozások',
      'A libidó zavaró csökkenése',
      '3 ciklusnál tovább tartó szabálytalan vérzés',
      'Hányinger vagy fejfájás, amely zavaró marad',
    ],
    questionsTitle: 'Néhány hasznos kérdés',
    questions: [
      'Mióta állnak fenn ezek a tünetek?',
      'Egy fogamzásgátló módszer megkezdése vagy módosítása után jelentek meg?',
      'Enyhék, zavaróak, vagy számodra valóban szokatlanok?',
      'Idővel javulnak, vagy gyakoribbá válnak?',
    ],
    body7:
      'Még ha egy tünet nem is sürgős, érdemes lehet beszélni róla, ha zavaróvá válik, fennmarad, vagy valóban befolyásolja az életminőségedet.',
    infoTitle: 'Érdemes lehet tanácsot kérni, ha…',
    infoText:
      'a tünetek fennmaradnak, jelentősebbé válnak, vagy megakadályoznak a normális életben.',
    body8:
      'Egy orvos, szülésznő vagy gyógyszerész segíthet megállapítani, hogy a tünetek kapcsolódhatnak-e az általad használt módszerhez, és hogy módosítani kell-e azt.',
    body9:
      'Egyes jelek szokatlanok, és gyors orvosi értékelést igényelnek. Nem feltétlenül jelentik szövődmény jelenlétét, de nem szabad figyelmen kívül hagyni őket.',
    alertTitle: 'Gyorsan kérj ellátást',
    alertIntro: 'Gyorsan kérj orvosi tanácsot, ha különösen az alábbiakat tapasztalod:',
    urgentSigns: [
      'Jelentős vagy szokatlan mellkasi fájdalom',
      'Hirtelen légzési nehézség',
      'Szokatlan duzzanat vagy fájdalom az egyik lábban',
      'Hirtelen, nagyon intenzív vagy szokatlan fejfájás',
      'Hirtelen látás-, beszéd- vagy erőbeli problémák',
    ],
    emergencyTitle: 'Súlyos helyzet esetén',
    emergencyText:
      'Ha a tünetek hirtelenek, nagyon súlyosak, vagy légzési nehézséggel, ájulásérzéssel vagy más súlyos jellel járnak, kérj sürgős orvosi segítséget.',
    summaryTitle: 'A lényeg',
    summaryItems: [
      'Egy új hormonális fogamzásgátló módszer elején bizonyos hatások jelentkezhetnek.',
      'Sok hatás átmeneti, és idővel csökkenhet.',
      'A zavaró vagy tartós tünetet érdemes megbeszélni egy szakemberrel.',
      'Bizonyos szokatlan jelek gyors orvosi tanácsot igényelnek.',
    ],
    finalTipTitle: 'Legfontosabb tudnivaló',
    finalTipText:
      'A tested figyelése nem feltétlenül jelenti, hogy azonnal abba kell hagyni egy módszert. Jegyezd fel, amit érzel, kövesd az alakulását, és kérj tanácsot, valahányszor egy tünet aggaszt.',
    disclaimerText:
      'Ez a cikk tájékoztató jellegű, és nem helyettesíti a személyre szabott orvosi tanácsot. Ha jelentős vagy szokatlan tünetet tapasztalsz, kérj tanácsot egészségügyi szakembertől.',
    shareMessage: 'A lehetséges mellékhatások felismerése — AWA',
  },
  ro: {
    badge: 'EFECTE SECUNDARE',
    title: 'Recunoașterea posibilelor\nefecte secundare',
    metaDuration: '8 min de citit',
    metaType: 'Articol',
    metaLevel: 'Intermediar',
    metaValidated: 'Conținut revizuit',
    intro:
      'Unele efecte pot fi frecvente și temporare. Altele necesită mai multă atenție. Învață să deosebești reacțiile obișnuite de semnele care ar trebui evaluate.',
    contentsTitle: 'În acest articol',
    topics: [
      'Efecte frecvente, ușoare',
      'Perioada de adaptare a corpului',
      'Observarea a ceea ce se schimbă',
      'Când să ceri un sfat medical',
      'Când să ceri rapid îngrijiri',
      'Ce să reții',
    ],
    body1:
      'Când cineva începe o nouă metodă de contracepție hormonală, corpul poate avea nevoie de timp pentru a se adapta. Mici schimbări pot apărea în ciclu, în starea de spirit sau în confortul fizic.',
    body2:
      'Aceste efecte sunt adesea ușoare și pot scădea treptat. Prezența lor nu înseamnă automat că metoda este periculoasă sau că trebuie oprită.',
    commonEffects: [
      {
        title: 'Sângerări minore',
        text: 'Pot apărea sângerări neregulate, mai ales la începutul unei noi metode.',
      },
      {
        title: 'Sensibilitatea sânilor',
        text: 'O senzație temporară de încordare sau de sensibilitate a sânilor poate fi resimțită.',
      },
      {
        title: 'Starea de spirit',
        text: 'Unele persoane observă schimbări de dispoziție sau o sensibilitate emoțională crescută.',
      },
      {
        title: 'Dureri de cap',
        text: 'Dureri de cap ușoare pot apărea în perioada de adaptare.',
      },
    ],
    body3:
      'Primele săptămâni sau cicluri pot fi diferite de ceea ce erai obișnuită înainte. Corpul se poate adapta treptat la noul echilibru hormonal.',
    tip1Title: 'Bine de știut',
    tip1Text:
      'Un efect care apare la scurt timp după începerea unei metode merită urmărit în timp. Dacă devine deranjant sau persistă, vorbește cu un profesionist din domeniul sănătății.',
    body4:
      'Poate fi util să înregistrezi simptomele în aplicație pentru a urmări mai bine cum se schimbă de la un ciclu la altul.',
    trackingTitle: 'Urmărește cum evoluează',
    trackingSubtitle: 'Câteva repere pot fi utile',
    trackingLines: [
      'Notează data la care a apărut simptomul.',
      'Înregistrează-i intensitatea și durata.',
      'Urmărește dacă se ameliorează sau se agravează.',
    ],
    body5:
      'Nu toate simptomele sunt neapărat legate de contracepție. Stresul, somnul, alimentația, ciclul sau alte tratamente pot afecta și ele felul în care te simți.',
    body6:
      'Pentru a înțelege situația, încearcă să te uiți la contextul general, nu la un singur simptom izolat.',
    worthMentioning: [
      'Schimbări de dispoziție marcate, persistente',
      'O scădere a libidoului care te deranjează',
      'Sângerări neregulate care durează mai mult de 3 cicluri',
      'Greață sau dureri de cap care rămân deranjante',
    ],
    questionsTitle: 'Câteva întrebări utile',
    questions: [
      'De cât timp durează aceste simptome?',
      'Au apărut după începerea sau schimbarea unei metode de contracepție?',
      'Sunt ușoare, deranjante sau cu adevărat neobișnuite pentru tine?',
      'Se ameliorează în timp sau devin mai frecvente?',
    ],
    body7:
      'Chiar și atunci când un simptom nu este urgent, poate merita discutat dacă devine deranjant, persistă sau îți afectează cu adevărat calitatea vieții.',
    infoTitle: 'Poate merita să ceri un sfat dacă…',
    infoText:
      'simptomele persistă, devin mai importante sau te împiedică să trăiești normal.',
    body8:
      'Un medic, o moașă sau un farmacist te poate ajuta să stabilești dacă simptomele pot fi legate de metoda pe care o folosești și dacă aceasta trebuie ajustată.',
    body9:
      'Unele semne sunt neobișnuite și cer o evaluare medicală promptă. Ele nu înseamnă neapărat că există o complicație, dar nu trebuie ignorate.',
    alertTitle: 'Cere rapid îngrijiri',
    alertIntro: 'Cere rapid un sfat medical dacă ai, în special:',
    urgentSigns: [
      'Durere în piept importantă sau neobișnuită',
      'Dificultate bruscă de respirație',
      'Umflare sau durere neobișnuită la un picior',
      'O durere de cap bruscă, foarte intensă sau neobișnuită',
      'Probleme bruște de vedere, de vorbire sau de forță',
    ],
    emergencyTitle: 'În caz de situație severă',
    emergencyText:
      'Dacă simptomele sunt bruște, foarte severe sau însoțite de dificultăți de respirație, senzație de leșin sau alt semn grav, cere ajutor medical de urgență.',
    summaryTitle: 'Esențialul',
    summaryItems: [
      'Unele efecte pot apărea la începutul unei noi metode de contracepție hormonală.',
      'Multe efecte sunt temporare și pot scădea în timp.',
      'Un simptom deranjant sau persistent merită discutat cu un profesionist.',
      'Unele semne neobișnuite cer un sfat medical prompt.',
    ],
    finalTipTitle: 'Ideea principală',
    finalTipText:
      'A-ți asculta corpul nu înseamnă neapărat a opri imediat o metodă. Notează ce simți, urmărește cum evoluează și cere un sfat ori de câte ori un simptom te îngrijorează.',
    disclaimerText:
      'Acest articol este destinat informării și nu înlocuiește sfatul medical personalizat. Dacă ai un simptom important sau neobișnuit, cere sfatul unui profesionist din domeniul sănătății.',
    shareMessage: 'Recunoașterea posibilelor efecte secundare — AWA',
  },
  bg: {
    badge: 'СТРАНИЧНИ ЕФЕКТИ',
    title: 'Разпознаване на възможни\nстранични ефекти',
    metaDuration: '8 мин четене',
    metaType: 'Статия',
    metaLevel: 'Средно ниво',
    metaValidated: 'Проверено съдържание',
    intro:
      'Някои ефекти могат да са чести и временни. Други изискват повече внимание. Научи се да различаваш обичайните реакции от признаците, които трябва да бъдат оценени.',
    contentsTitle: 'В тази статия',
    topics: [
      'Чести, леки ефекти',
      'Периодът на приспособяване на тялото',
      'Наблюдение на онова, което се променя',
      'Кога да потърсиш медицински съвет',
      'Кога да потърсиш бърза помощ',
      'Какво да запомниш',
    ],
    body1:
      'Когато някой започне нов метод на хормонална контрацепция, тялото може да има нужда от време, за да се приспособи. Могат да се появят малки промени в цикъла, настроението или физическия комфорт.',
    body2:
      'Тези ефекти често са леки и могат постепенно да намалеят. Наличието им не означава автоматично, че методът е опасен или че трябва да се спре.',
    commonEffects: [
      {
        title: 'Леко кървене',
        text: 'Може да се появи нередовно кървене, особено в началото на нов метод.',
      },
      {
        title: 'Чувствителност на гърдите',
        text: 'Може временно да се усеща стягане или чувствителност на гърдите.',
      },
      {
        title: 'Настроение',
        text: 'Някои хора забелязват промени в настроението или засилена емоционална чувствителност.',
      },
      {
        title: 'Главоболие',
        text: 'По време на периода на приспособяване може да се появи леко главоболие.',
      },
    ],
    body3:
      'Първите няколко седмици или цикъла могат да са различни от онова, към което си била свикнала преди. Тялото може постепенно да се приспособи към новия хормонален баланс.',
    tip1Title: 'Добре е да знаеш',
    tip1Text:
      'Ефект, който се появява скоро след започване на метод, си струва да се наблюдава във времето. Ако стане неприятен или продължи, поговори със здравен специалист.',
    body4:
      'Може да е полезно да записваш симптомите в приложението си, за да следиш по-добре как се променят от цикъл на цикъл.',
    trackingTitle: 'Следи как се развива',
    trackingSubtitle: 'Няколко ориентира могат да са полезни',
    trackingLines: [
      'Отбележи датата, на която се е появил симптомът.',
      'Запиши интензивността и продължителността му.',
      'Наблюдавай дали се подобрява или влошава.',
    ],
    body5:
      'Не всички симптоми са непременно свързани с контрацепцията. Стресът, сънят, храненето, цикълът ти или други лечения също могат да влияят на самочувствието ти.',
    body6:
      'За да разбереш ситуацията, опитай да погледнеш общия контекст, а не един изолиран симптом.',
    worthMentioning: [
      'Изразени, упорити промени в настроението',
      'Спад на либидото, който те притеснява',
      'Нередовно кървене, което продължава повече от 3 цикъла',
      'Гадене или главоболие, които остават неприятни',
    ],
    questionsTitle: 'Няколко полезни въпроса',
    questions: [
      'От колко време продължават тези симптоми?',
      'Появили ли са се след започване или смяна на метод на контрацепция?',
      'Леки ли са, неприятни ли са или наистина необичайни за теб?',
      'Подобряват ли се с времето или стават по-чести?',
    ],
    body7:
      'Дори когато симптомът не е спешен, може да си струва да го обсъдиш, ако стане неприятен, продължава или наистина влияе на качеството ти на живот.',
    infoTitle: 'Може да си струва да поискаш съвет, ако…',
    infoText:
      'симптомите продължават, стават по-значителни или ти пречат да живееш нормално.',
    body8:
      'Лекар, акушерка или фармацевт може да ти помогне да определиш дали симптомите могат да са свързани с метода, който използваш, и дали трябва да се коригира.',
    body9:
      'Някои признаци са необичайни и изискват бърза медицинска оценка. Те не означават непременно наличие на усложнение, но не бива да се пренебрегват.',
    alertTitle: 'Потърси бърза помощ',
    alertIntro: 'Потърси бързо медицински съвет, ако изпиташ по-специално:',
    urgentSigns: [
      'Значителна или необичайна болка в гърдите',
      'Внезапно затруднено дишане',
      'Необичайно подуване или болка в крак',
      'Внезапно, много силно или необичайно главоболие',
      'Внезапно затруднение със зрението, речта или силата',
    ],
    emergencyTitle: 'При тежка ситуация',
    emergencyText:
      'Ако симптомите са внезапни, много тежки или идват със затруднено дишане, прималяване или друг сериозен признак, потърси спешна медицинска помощ.',
    summaryTitle: 'Същественото',
    summaryItems: [
      'Някои ефекти могат да се появят в началото на нов метод на хормонална контрацепция.',
      'Много ефекти са временни и могат да намалеят с времето.',
      'Неприятен или упорит симптом си струва да се обсъди със специалист.',
      'Някои необичайни признаци изискват бърз медицински съвет.',
    ],
    finalTipTitle: 'Основно',
    finalTipText:
      'Да се вслушваш в тялото си не означава непременно веднага да спреш метода. Отбелязвай какво чувстваш, наблюдавай как се развива и поискай съвет, когато симптом те тревожи.',
    disclaimerText:
      'Тази статия е предназначена за информация и не замества персонализирания медицински съвет. Ако имаш значителен или необичаен симптом, потърси съвет от здравен специалист.',
    shareMessage: 'Разпознаване на възможни странични ефекти — AWA',
  },
  sr: {
    badge: 'НЕЖЕЉЕНИ ЕФЕКТИ',
    title: 'Препознавање могућих\nнежељених ефеката',
    metaDuration: '8 мин читања',
    metaType: 'Чланак',
    metaLevel: 'Средњи ниво',
    metaValidated: 'Проверен садржај',
    intro:
      'Неки ефекти могу бити чести и привремени. Други захтевају више пажње. Научи да разликујеш уобичајене реакције од знакова које треба проценити.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Чести, благи ефекти',
      'Период прилагођавања тела',
      'Посматрање онога што се мења',
      'Када потражити медицински савет',
      'Када потражити брзу помоћ',
      'Шта да запамтиш',
    ],
    body1:
      'Када неко започне нови метод хормонске контрацепције, телу може бити потребно време да се прилагоди. Могу се појавити мале промене у циклусу, расположењу или физичкој удобности.',
    body2:
      'Ови ефекти су често благи и могу постепено јењавати. Њихово присуство не значи аутоматски да је метод опасан или да га треба прекинути.',
    commonEffects: [
      {
        title: 'Благо крварење',
        text: 'Може се јавити нередовно крварење, нарочито на почетку новог метода.',
      },
      {
        title: 'Осетљивост дојки',
        text: 'Може се привремено осећати напетост или осетљивост дојки.',
      },
      {
        title: 'Расположење',
        text: 'Неке особе примећују промене расположења или појачану емоционалну осетљивост.',
      },
      {
        title: 'Главобоље',
        text: 'Током периода прилагођавања може се појавити блага главобоља.',
      },
    ],
    body3:
      'Првих неколико недеља или циклуса могу бити другачији од онога на шта си навикла раније. Тело се може постепено прилагодити новој хормонској равнотежи.',
    tip1Title: 'Добро је знати',
    tip1Text:
      'Ефекат који се појави убрзо после почетка метода вреди пратити током времена. Ако постане непријатан или потраје, разговарај са здравственим радником.',
    body4:
      'Може бити корисно бележити симптоме у апликацији да боље пратиш како се мењају од циклуса до циклуса.',
    trackingTitle: 'Прати како се развија',
    trackingSubtitle: 'Неколико ознака може бити корисно',
    trackingLines: [
      'Забележи датум појаве симптома.',
      'Запиши његов интензитет и трајање.',
      'Посматрај да ли се побољшава или погоршава.',
    ],
    body5:
      'Нису сви симптоми нужно повезани са контрацепцијом. Стрес, сан, исхрана, твој циклус или друге терапије такође могу утицати на то како се осећаш.',
    body6:
      'Да разумеш ситуацију, покушај да сагледаш цео контекст, а не један изоловани симптом.',
    worthMentioning: [
      'Изражене, упорне промене расположења',
      'Пад либида који те смета',
      'Нередовно крварење које траје дуже од 3 циклуса',
      'Мучнина или главобоље које остају непријатне',
    ],
    questionsTitle: 'Неколико корисних питања',
    questions: [
      'Од када трају ови симптоми?',
      'Да ли су се појавили после започињања или промене метода контрацепције?',
      'Да ли су благи, непријатни или заиста необични за тебе?',
      'Да ли се с временом побољшавају или постају чешћи?',
    ],
    body7:
      'Чак и када симптом није хитан, може вредети да га обсудиш ако постане непријатан, потраје или заиста утиче на квалитет твог живота.',
    infoTitle: 'Можда вреди затражити савет ако…',
    infoText:
      'симптоми трају, постају значајнији или ти спречавају да живиш нормално.',
    body8:
      'Лекар, бабица или фармацеут може ти помоћи да утврдиш да ли симптоми могу бити повезани са методом који користиш и да ли га треба прилагодити.',
    body9:
      'Неки знаци су необични и захтевају хитну медицинску процену. Они не значе нужно да постоји компликација, али их не треба занемарити.',
    alertTitle: 'Потражи помоћ одмах',
    alertIntro: 'Брзо потражи медицински савет ако доживиш, нарочито:',
    urgentSigns: [
      'Значајан или необичан бол у грудима',
      'Изненадно отежано дисање',
      'Необичан оток или бол у нози',
      'Изненадну, веома јаку или необичну главобољу',
      'Изненадне тешкоће са видом, говором или снагом',
    ],
    emergencyTitle: 'У случају тешке ситуације',
    emergencyText:
      'Ако су симптоми изненадни, веома тешки или праћени отежаним дисањем, осећајем малаксалости или другим озбиљним знаком, потражи хитну медицинску помоћ.',
    summaryTitle: 'Основно',
    summaryItems: [
      'Неки ефекти се могу појавити на почетку новог метода хормонске контрацепције.',
      'Многи ефекти су привремени и могу јењавати током времена.',
      'Непријатан или упоран симптом вреди размотрити са стручњаком.',
      'Неки необични знаци захтевају брзи медицински савет.',
    ],
    finalTipTitle: 'Основно',
    finalTipText:
      'Слушање свог тела не значи нужно одмах прекинути метод. Бележи шта осећаш, прати како се развија и затражи савет кад год те симптом брине.',
    disclaimerText:
      'Овај чланак је намењен информисању и не замењује персонализовани медицински савет. Ако имаш значајан или необичан симптом, потражи савет од здравственог радника.',
    shareMessage: 'Препознавање могућих нежељених ефеката — AWA',
  },
  hr: {
    badge: 'NUSPOJAVE',
    title: 'Prepoznavanje mogućih\nnuspojava',
    metaDuration: '8 min čitanja',
    metaType: 'Članak',
    metaLevel: 'Srednja razina',
    metaValidated: 'Provjeren sadržaj',
    intro:
      'Neki učinci mogu biti česti i privremeni. Drugi zahtijevaju više pozornosti. Nauči razlikovati uobičajene reakcije od znakova koje treba procijeniti.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Česti, blagi učinci',
      'Razdoblje prilagodbe tijela',
      'Promatranje onoga što se mijenja',
      'Kada zatražiti liječnički savjet',
      'Kada brzo zatražiti skrb',
      'Ključne poruke',
    ],
    body1:
      'Kad netko počne s novom metodom hormonske kontracepcije, tijelu može trebati vremena za prilagodbu. U ciklusu, raspoloženju ili tjelesnoj ugodi mogu se pojaviti male promjene.',
    body2:
      'Ti su učinci često blagi i mogu se postupno smanjivati. Njihova prisutnost automatski ne znači da je metoda opasna ili da je treba prekinuti.',
    commonEffects: [
      {
        title: 'Blago krvarenje',
        text: 'Može se javiti nepravilno krvarenje, osobito na početku nove metode.',
      },
      {
        title: 'Osjetljivost grudi',
        text: 'Napetost ili osjetljivost grudi može se osjećati privremeno.',
      },
      {
        title: 'Raspoloženje',
        text: 'Neke osobe primjećuju promjene raspoloženja ili pojačanu emocionalnu osjetljivost.',
      },
      {
        title: 'Glavobolje',
        text: 'Blage glavobolje mogu se javiti tijekom razdoblja prilagodbe.',
      },
    ],
    body3:
      'Prvih nekoliko tjedana ili ciklusa može se razlikovati od onoga na što si bila navikla prije. Tijelo se može postupno prilagoditi novoj hormonskoj ravnoteži.',
    tip1Title: 'Dobro je znati',
    tip1Text:
      'Učinak koji se pojavi nedugo nakon početka metode vrijedi pratiti tijekom vremena. Ako postane smetnja ili potraje, razgovaraj sa zdravstvenim djelatnikom.',
    body4:
      'Može biti korisno bilježiti simptome u aplikaciji kako bi bolje pratila kako se mijenjaju od ciklusa do ciklusa.',
    trackingTitle: 'Prati kako se stvari mijenjaju',
    trackingSubtitle: 'Nekoliko pokazatelja može pomoći',
    trackingLines: [
      'Zabilježi datum pojave simptoma.',
      'Zabilježi njegov intenzitet i trajanje.',
      'Prati poboljšava li se ili pogoršava.',
    ],
    body5:
      'Svi simptomi nisu nužno povezani s kontracepcijom. Na to kako se osjećaš mogu utjecati i stres, san, prehrana, tvoj ciklus ili druge terapije.',
    body6:
      'Da bi razumjela situaciju, pokušaj promatrati cjelokupni kontekst, a ne jedan simptom izolirano.',
    worthMentioning: [
      'Izražene, dugotrajne promjene raspoloženja',
      'Pad libida koji te smeta',
      'Nepravilno krvarenje koje traje dulje od 3 ciklusa',
      'Mučnina ili glavobolje koje i dalje smetaju',
    ],
    questionsTitle: 'Nekoliko korisnih pitanja',
    questions: [
      'Koliko dugo traju ti simptomi?',
      'Jesu li se pojavili nakon početka ili promjene kontracepcijske metode?',
      'Jesu li blagi, smetajući ili doista neobični za tebe?',
      'Poboljšavaju li se tijekom vremena ili postaju učestaliji?',
    ],
    body7:
      'Čak i kad simptom nije hitan, može biti vrijedno razgovarati o njemu ako postane smetnja, potraje ili doista utječe na kvalitetu tvog života.',
    infoTitle: 'Možda vrijedi zatražiti savjet ako…',
    infoText:
      'simptomi potraju, postanu izraženiji ili te sprječavaju u normalnom životu.',
    body8:
      'Liječnik, babica ili ljekarnik može ti pomoći utvrditi jesu li simptomi možda povezani s metodom koju koristiš i treba li je prilagoditi.',
    body9:
      'Neki su znakovi neobični i zahtijevaju žurnu liječničku procjenu. Ne znače nužno da je prisutna komplikacija, ali ih ne treba zanemariti.',
    alertTitle: 'Brzo zatraži skrb',
    alertIntro: 'Brzo zatraži liječnički savjet ako osjetiš, osobito:',
    urgentSigns: [
      'Jaku ili neobičnu bol u prsima',
      'Iznenadne teškoće s disanjem',
      'Neobično oticanje ili bol u nozi',
      'Iznenadnu, vrlo jaku ili neobičnu glavobolju',
      'Iznenadne poteškoće s vidom, govorom ili snagom',
    ],
    emergencyTitle: 'U slučaju teške situacije',
    emergencyText:
      'Ako su simptomi iznenadni, vrlo jaki ili ih prate teškoće s disanjem, osjećaj nesvjestice ili neki drugi ozbiljan znak, zatraži hitnu medicinsku pomoć.',
    summaryTitle: 'Najvažnije',
    summaryItems: [
      'Neki se učinci mogu pojaviti na početku nove metode hormonske kontracepcije.',
      'Mnogi su učinci privremeni i mogu se s vremenom smanjiti.',
      'O smetajućem ili dugotrajnom simptomu vrijedi razgovarati sa stručnom osobom.',
      'Neki neobični znakovi zahtijevaju žuran liječnički savjet.',
    ],
    finalTipTitle: 'Ključna poruka',
    finalTipText:
      'Slušati svoje tijelo ne znači nužno odmah prekinuti metodu. Zabilježi što osjećaš, prati kako se mijenja i zatraži savjet kad god te simptom zabrinjava.',
    disclaimerText:
      'Ovaj je članak namijenjen informiranju i ne zamjenjuje individualni medicinski savjet. Ako imaš znatan ili neobičan simptom, zatraži savjet zdravstvenog djelatnika.',
    shareMessage: 'Prepoznavanje mogućih nuspojava — AWA',
  },
  bs: {
    badge: 'NUSPOJAVE',
    title: 'Prepoznavanje mogućih\nnuspojava',
    metaDuration: '8 min čitanja',
    metaType: 'Članak',
    metaLevel: 'Srednja razina',
    metaValidated: 'Provjeren sadržaj',
    intro:
      'Neki učinci mogu biti česti i privremeni. Drugi zahtijevaju više pozornosti. Nauči razlikovati uobičajene reakcije od znakova koje treba procijeniti.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Česti, blagi učinci',
      'Razdoblje prilagodbe tijela',
      'Promatranje onoga što se mijenja',
      'Kada zatražiti ljekarski savjet',
      'Kada brzo zatražiti skrb',
      'Ključne poruke',
    ],
    body1:
      'Kad neko počne s novom metodom hormonske kontracepcije, tijelu može trebati vremena za prilagodbu. U ciklusu, raspoloženju ili tjelesnoj ugodi mogu se pojaviti male promjene.',
    body2:
      'Ti su učinci često blagi i mogu se postupno smanjivati. Njihova prisutnost automatski ne znači da je metoda opasna ili da je treba prekinuti.',
    commonEffects: [
      {
        title: 'Blago krvarenje',
        text: 'Može se javiti nepravilno krvarenje, osobito na početku nove metode.',
      },
      {
        title: 'Osjetljivost grudi',
        text: 'Napetost ili osjetljivost grudi može se osjećati privremeno.',
      },
      {
        title: 'Raspoloženje',
        text: 'Neke osobe primjećuju promjene raspoloženja ili pojačanu emocionalnu osjetljivost.',
      },
      {
        title: 'Glavobolje',
        text: 'Blage glavobolje mogu se javiti tokom razdoblja prilagodbe.',
      },
    ],
    body3:
      'Prvih nekoliko sedmica ili ciklusa može se razlikovati od onoga na što si bila navikla prije. Tijelo se može postupno prilagoditi novoj hormonskoj ravnoteži.',
    tip1Title: 'Dobro je znati',
    tip1Text:
      'Učinak koji se pojavi nedugo nakon početka metode vrijedi pratiti tokom vremena. Ako postane smetnja ili potraje, razgovaraj sa zdravstvenim radnikom.',
    body4:
      'Može biti korisno bilježiti simptome u aplikaciji kako bi bolje pratila kako se mijenjaju od ciklusa do ciklusa.',
    trackingTitle: 'Prati kako se stvari mijenjaju',
    trackingSubtitle: 'Nekoliko pokazatelja može pomoći',
    trackingLines: [
      'Zabilježi datum pojave simptoma.',
      'Zabilježi njegov intenzitet i trajanje.',
      'Prati poboljšava li se ili pogoršava.',
    ],
    body5:
      'Svi simptomi nisu nužno povezani s kontracepcijom. Na to kako se osjećaš mogu utjecati i stres, san, ishrana, tvoj ciklus ili druge terapije.',
    body6:
      'Da bi razumjela situaciju, pokušaj promatrati cjelokupni kontekst, a ne jedan simptom izolirano.',
    worthMentioning: [
      'Izražene, dugotrajne promjene raspoloženja',
      'Pad libida koji te smeta',
      'Nepravilno krvarenje koje traje dulje od 3 ciklusa',
      'Mučnina ili glavobolje koje i dalje smetaju',
    ],
    questionsTitle: 'Nekoliko korisnih pitanja',
    questions: [
      'Koliko dugo traju ti simptomi?',
      'Jesu li se pojavili nakon početka ili promjene kontracepcijske metode?',
      'Jesu li blagi, smetajući ili doista neobični za tebe?',
      'Poboljšavaju li se tokom vremena ili postaju učestaliji?',
    ],
    body7:
      'Čak i kad simptom nije hitan, može biti vrijedno razgovarati o njemu ako postane smetnja, potraje ili doista utječe na kvalitetu tvog života.',
    infoTitle: 'Možda vrijedi zatražiti savjet ako…',
    infoText:
      'simptomi potraju, postanu izraženiji ili te sprječavaju u normalnom životu.',
    body8:
      'Ljekar, babica ili ljekarnik može ti pomoći utvrditi jesu li simptomi možda povezani s metodom koju koristiš i treba li je prilagoditi.',
    body9:
      'Neki su znakovi neobični i zahtijevaju žurnu ljekarsku procjenu. Ne znače nužno da je prisutna komplikacija, ali ih ne treba zanemariti.',
    alertTitle: 'Brzo zatraži skrb',
    alertIntro: 'Brzo zatraži ljekarski savjet ako osjetiš, osobito:',
    urgentSigns: [
      'Jaku ili neobičnu bol u prsima',
      'Iznenadne teškoće s disanjem',
      'Neobično oticanje ili bol u nozi',
      'Iznenadnu, vrlo jaku ili neobičnu glavobolju',
      'Iznenadne poteškoće s vidom, govorom ili snagom',
    ],
    emergencyTitle: 'U slučaju teške situacije',
    emergencyText:
      'Ako su simptomi iznenadni, vrlo jaki ili ih prate teškoće s disanjem, osjećaj nesvjestice ili neki drugi ozbiljan znak, zatraži hitnu medicinsku pomoć.',
    summaryTitle: 'Najvažnije',
    summaryItems: [
      'Neki se učinci mogu pojaviti na početku nove metode hormonske kontracepcije.',
      'Mnogi su učinci privremeni i mogu se s vremenom smanjiti.',
      'O smetajućem ili dugotrajnom simptomu vrijedi razgovarati sa stručnom osobom.',
      'Neki neobični znakovi zahtijevaju žuran ljekarski savjet.',
    ],
    finalTipTitle: 'Ključna poruka',
    finalTipText:
      'Slušati svoje tijelo ne znači nužno odmah prekinuti metodu. Zabilježi što osjećaš, prati kako se mijenja i zatraži savjet kad god te simptom zabrinjava.',
    disclaimerText:
      'Ovaj je članak namijenjen informiranju i ne zamjenjuje individualni medicinski savjet. Ako imaš znatan ili neobičan simptom, zatraži savjet zdravstvenog radnika.',
    shareMessage: 'Prepoznavanje mogućih nuspojava — AWA',
  },
  sl: {
    badge: 'STRANSKI UČINKI',
    title: 'Prepoznavanje možnih\nstranskih učinkov',
    metaDuration: '8 min branja',
    metaType: 'Članek',
    metaLevel: 'Srednja raven',
    metaValidated: 'Preverjena vsebina',
    intro:
      'Nekateri učinki so lahko pogosti in začasni. Drugi zahtevajo več pozornosti. Nauči se razlikovati običajne reakcije od znakov, ki jih je treba oceniti.',
    contentsTitle: 'V tem članku',
    topics: [
      'Pogosti, blagi učinki',
      'Obdobje prilagoditve telesa',
      'Opazovanje tega, kar se spreminja',
      'Kdaj poiskati zdravniški nasvet',
      'Kdaj hitro poiskati oskrbo',
      'Ključna sporočila',
    ],
    body1:
      'Ko oseba začne z novo metodo hormonske kontracepcije, lahko telesu traja nekaj časa, da se prilagodi. V ciklu, razpoloženju ali telesnem udobju se lahko pojavijo majhne spremembe.',
    body2:
      'Ti učinki so pogosto blagi in se lahko postopoma zmanjšujejo. Njihova prisotnost samodejno ne pomeni, da je metoda nevarna ali da jo je treba prekiniti.',
    commonEffects: [
      {
        title: 'Blaga krvavitev',
        text: 'Lahko se pojavi nepravilna krvavitev, zlasti na začetku nove metode.',
      },
      {
        title: 'Občutljivost prsi',
        text: 'Napetost ali občutljivost prsi se lahko čuti začasno.',
      },
      {
        title: 'Razpoloženje',
        text: 'Nekatere osebe opazijo spremembe razpoloženja ali povečano čustveno občutljivost.',
      },
      {
        title: 'Glavoboli',
        text: 'Blagi glavoboli se lahko pojavijo med obdobjem prilagoditve.',
      },
    ],
    body3:
      'Prvih nekaj tednov ali ciklov se lahko razlikuje od tistega, na kar si bila navajena prej. Telo se lahko postopoma prilagodi novemu hormonskemu ravnovesju.',
    tip1Title: 'Vredno vedeti',
    tip1Text:
      'Učinek, ki se pojavi kmalu po začetku metode, je vredno spremljati skozi čas. Če postane moteč ali vztraja, se pogovori z zdravstvenim delavcem.',
    body4:
      'Lahko je koristno beležiti simptome v aplikaciji, da bolje spremljaš, kako se spreminjajo od cikla do cikla.',
    trackingTitle: 'Spremljaj, kako se stvari spreminjajo',
    trackingSubtitle: 'Nekaj kazalnikov lahko pomaga',
    trackingLines: [
      'Zabeleži datum pojava simptoma.',
      'Zabeleži njegovo intenzivnost in trajanje.',
      'Spremljaj, ali se izboljšuje ali poslabšuje.',
    ],
    body5:
      'Vsi simptomi niso nujno povezani s kontracepcijo. Na to, kako se počutiš, lahko vplivajo tudi stres, spanje, prehrana, tvoj cikel ali druga zdravljenja.',
    body6:
      'Da bi razumela situacijo, poskusi opazovati celotni kontekst, ne enega simptoma izolirano.',
    worthMentioning: [
      'Izrazite, dolgotrajne spremembe razpoloženja',
      'Padec libida, ki te moti',
      'Nepravilna krvavitev, ki traja dlje od 3 ciklov',
      'Slabost ali glavoboli, ki še naprej motijo',
    ],
    questionsTitle: 'Nekaj koristnih vprašanj',
    questions: [
      'Kako dolgo trajajo ti simptomi?',
      'Ali so se pojavili po začetku ali spremembi kontracepcijske metode?',
      'Ali so blagi, moteči ali resnično nenavadni zate?',
      'Ali se skozi čas izboljšujejo ali postajajo pogostejši?',
    ],
    body7:
      'Tudi kadar simptom ni nujen, je lahko vredno govoriti o njem, če postane moteč, vztraja ali resnično vpliva na kakovost tvojega življenja.',
    infoTitle: 'Morda je vredno poiskati nasvet, če…',
    infoText:
      'simptomi vztrajajo, postanejo izrazitejši ali te ovirajo pri normalnem življenju.',
    body8:
      'Zdravnik, babica ali lekarnar ti lahko pomaga ugotoviti, ali so simptomi morda povezani z metodo, ki jo uporabljaš, in ali jo je treba prilagoditi.',
    body9:
      'Nekateri znaki so nenavadni in zahtevajo nujno zdravniško oceno. Ne pomenijo nujno, da je prisoten zaplet, vendar jih ne smemo zanemariti.',
    alertTitle: 'Hitro poišči oskrbo',
    alertIntro: 'Hitro poišči zdravniški nasvet, če občutiš, zlasti:',
    urgentSigns: [
      'Hudo ali nenavadno bolečino v prsih',
      'Nenadne težave z dihanjem',
      'Nenavadno otekanje ali bolečino v nogi',
      'Nenaden, zelo hud ali nenavaden glavobol',
      'Nenadne težave z vidom, govorom ali močjo',
    ],
    emergencyTitle: 'V primeru hude situacije',
    emergencyText:
      'Če so simptomi nenadni, zelo hudi ali jih spremljajo težave z dihanjem, občutek omedlevice ali drug resen znak, poišči nujno zdravniško pomoč.',
    summaryTitle: 'Najpomembnejše',
    summaryItems: [
      'Nekateri učinki se lahko pojavijo na začetku nove metode hormonske kontracepcije.',
      'Mnogi učinki so začasni in se lahko s časom zmanjšajo.',
      'O motečem ali dolgotrajnem simptomu je vredno govoriti s strokovnjakom.',
      'Nekateri nenavadni znaki zahtevajo hiter zdravniški nasvet.',
    ],
    finalTipTitle: 'Ključno sporočilo',
    finalTipText:
      'Poslušati svoje telo ne pomeni nujno takoj prekiniti metode. Zabeleži, kar čutiš, spremljaj, kako se spreminja, in poišči nasvet, kadar koli te simptom skrbi.',
    disclaimerText:
      'Ta članek je namenjen informiranju in ne nadomešča osebnega zdravniškega nasveta. Če imaš pomemben ali nenavaden simptom, poišči nasvet zdravstvenega delavca.',
    shareMessage: 'Prepoznavanje možnih stranskih učinkov — AWA',
  },
  ne: {
    badge: 'साइड इफेक्टहरू',
    title: 'सम्भावित साइड इफेक्टहरू\nचिन्नुहोस्',
    metaDuration: '8 मिनेट पढाइ',
    metaType: 'लेख',
    metaLevel: 'मध्यम',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro:
      'केही असरहरू सामान्य र अस्थायी हुन सक्छन्। अरूले बढी ध्यान चाहिन्छ। सामान्य प्रतिक्रिया र मूल्याङ्कन गर्नुपर्ने संकेतहरूबीच भिन्नता छुट्ट्याउन सिक्नुहोस्।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'सामान्य, हल्का असरहरू',
      'शरीरको समायोजन अवधि',
      'के बदलिन्छ अवलोकन गर्ने',
      'चिकित्सकीय सल्लाह कहिले लिने',
      'हेरचाह छिटो कहिले खोज्ने',
      'मुख्य कुराहरू',
    ],
    body1:
      'कसैले नयाँ हर्मोनल गर्भनिरोधक विधि सुरु गर्दा, शरीरलाई समायोजन हुन केही समय चाहिन सक्छ। चक्र, मनोदशा वा शारीरिक सहजतामा साना परिवर्तन देखिन सक्छन्।',
    body2:
      'यी असरहरू प्रायः हल्का हुन्छन् र बिस्तारै घट्न सक्छन्। तिनको उपस्थितिले विधि खतरनाक छ वा रोक्नुपर्छ भन्ने स्वतः जनाउँदैन।',
    commonEffects: [
      {
        title: 'सानो रक्तस्राव',
        text: 'विशेष गरी नयाँ विधिको सुरुमा अनियमित रक्तस्राव हुन सक्छ।',
      },
      {
        title: 'स्तनमा दुखाइ',
        text: 'स्तन कसिलो वा दुख्ने अनुभूति अस्थायी रूपमा हुन सक्छ।',
      },
      {
        title: 'मनोदशा',
        text: 'केही मानिसले मनोदशामा परिवर्तन वा बढेको भावनात्मक संवेदनशीलता देख्छन्।',
      },
      {
        title: 'टाउको दुखाइ',
        text: 'समायोजन अवधिमा हल्का टाउको दुखाइ हुन सक्छ।',
      },
    ],
    body3:
      'पहिला केही हप्ता वा चक्रहरू तपाईं पहिले अभ्यस्त हुनुभएकोभन्दा फरक हुन सक्छन्। शरीर बिस्तारै नयाँ हर्मोनल सन्तुलनसँग मिल्न सक्छ।',
    tip1Title: 'जान्न लायक',
    tip1Text:
      'विधि सुरु गरेको केही समयपछि देखिने असर समयसँगै हेर्न लायक हुन्छ। यो असहज भएमा वा रहिरहेमा, स्वास्थ्यकर्मीसँग कुरा गर्नुहोस्।',
    body4:
      'लक्षणहरू एक चक्रदेखि अर्कोमा कसरी बदलिन्छन् राम्ररी अनुगमन गर्न आफ्नो एपमा तिनलाई दर्ता गर्नु मद्दतकारी हुन सक्छ।',
    trackingTitle: 'के बदलिन्छ अनुगमन गर्नुहोस्',
    trackingSubtitle: 'केही सूचकहरू उपयोगी हुन सक्छन्',
    trackingLines: [
      'लक्षण देखिएको मिति टिप्नुहोस्।',
      'यसको तीव्रता र अवधि अभिलेख गर्नुहोस्।',
      'यो सुध्रिँदै छ कि बिग्रँदै छ हेर्नुहोस्।',
    ],
    body5:
      'सबै लक्षणहरू अनिवार्य रूपमा गर्भनिरोधनसँग जोडिएका हुँदैनन्। तनाव, निद्रा, खानपान, तपाईंको चक्र, वा अन्य उपचारहरूले पनि तपाईंलाई कस्तो लाग्छ भन्नेलाई असर गर्न सक्छन्।',
    body6:
      'अवस्था बुझ्न, कुनै एक लक्षणलाई एक्लै हेर्नुभन्दा समग्र सन्दर्भ हेर्ने प्रयास गर्नुहोस्।',
    worthMentioning: [
      'स्पष्ट, लगातार मनोदशाका परिवर्तनहरू',
      'तपाईंलाई असहज पार्ने यौन इच्छामा कमी',
      '3 चक्रभन्दा बढी रहने अनियमित रक्तस्राव',
      'असहज रहिरहने वाकवाकी वा टाउको दुखाइ',
    ],
    questionsTitle: 'केही उपयोगी प्रश्नहरू',
    questions: [
      'यी लक्षणहरू कति समयदेखि छन्?',
      'के तिनीहरू गर्भनिरोधक विधि सुरु गरेपछि वा बदलेपछि देखिए?',
      'के तिनीहरू हल्का, असहज, वा तपाईंका लागि साँच्चै असामान्य छन्?',
      'के तिनीहरू समयसँगै सुध्रिँदै छन् वा बढी बारम्बार हुँदै छन्?',
    ],
    body7:
      'लक्षण जरुरी नभए पनि, यो असहज बनेमा, रहिरहेमा, वा साँच्चै तपाईंको जीवनको गुणस्तरमा असर गरेमा, यसबारे छलफल गर्न लायक हुन सक्छ।',
    infoTitle: 'यस्तो भए सल्लाह लिन लायक हुन सक्छ…',
    infoText:
      'लक्षणहरू रहिरहन्छन्, बढी ठूला हुन्छन्, वा तपाईंलाई सामान्य रूपमा बाँच्नबाट रोक्छन्।',
    body8:
      'चिकित्सक, सुँडेनी वा फार्मासिस्टले लक्षणहरू तपाईंले प्रयोग गरिरहनुभएको विधिसँग जोडिएका हुन सक्छन् कि र त्यसलाई मिलाउनुपर्छ कि भन्ने निर्धारण गर्न मद्दत गर्न सक्छन्।',
    body9:
      'केही संकेतहरू असामान्य हुन्छन् र छिटो चिकित्सकीय मूल्याङ्कन चाहिन्छ। तिनले जटिलता छ भन्ने अनिवार्य रूपमा जनाउँदैनन्, तर तिनलाई बेवास्ता गर्नु हुँदैन।',
    alertTitle: 'हेरचाह छिटो खोज्नुहोस्',
    alertIntro: 'विशेष गरी यी अनुभव गर्नुभयो भने छिटो चिकित्सकीय सल्लाह लिनुहोस्:',
    urgentSigns: [
      'ठूलो वा असामान्य छातीको दुखाइ',
      'अचानक सास फेर्न गाह्रो',
      'खुट्टामा असामान्य सुन्निने वा दुखाइ',
      'अचानक, निकै तीव्र वा असामान्य टाउको दुखाइ',
      'दृष्टि, बोली वा शक्तिमा अचानक समस्या',
    ],
    emergencyTitle: 'गम्भीर अवस्थामा',
    emergencyText:
      'लक्षणहरू अचानक, निकै गम्भीर छन्, वा सास फेर्न गाह्रो, बेहोस हुन लागेको अनुभूति, वा अर्को गम्भीर संकेतसहित आउँछन् भने, तुरुन्तै चिकित्सकीय मद्दत खोज्नुहोस्।',
    summaryTitle: 'आवश्यक कुराहरू',
    summaryItems: [
      'नयाँ हर्मोनल गर्भनिरोधक विधिको सुरुमा केही असरहरू देखिन सक्छन्।',
      'धेरै असरहरू अस्थायी हुन्छन् र समयसँगै घट्न सक्छन्।',
      'असहज वा लगातार लक्षणबारे व्यावसायिकसँग छलफल गर्न लायक हुन्छ।',
      'केही असामान्य संकेतहरूले छिटो चिकित्सकीय सल्लाह चाहिन्छ।',
    ],
    finalTipTitle: 'मुख्य कुरा',
    finalTipText:
      'आफ्नो शरीरको कुरा सुन्नुको अर्थ विधि तुरुन्तै रोक्नु अनिवार्य होइन। तपाईंले के महसुस गर्दै हुनुहुन्छ टिप्नुहोस्, यो कसरी बदलिन्छ हेर्नुहोस्, र कुनै लक्षणले चिन्तित बनाउँदा सल्लाह माग्नुहोस्।',
    disclaimerText:
      'यो लेख जानकारीका लागि हो र व्यक्तिगत चिकित्सकीय सल्लाहको स्थान लिँदैन। तपाईंलाई ठूलो वा असामान्य लक्षण छ भने, स्वास्थ्यकर्मीसँग सल्लाह लिनुहोस्।',
    shareMessage: 'सम्भावित साइड इफेक्टहरू चिन्नुहोस् — AWA',
  },
  si: {
    badge: 'අතුරු ආබාධ',
    title: 'ඇතිවිය හැකි අතුරු ආබාධ\nහඳුනාගැනීම',
    metaDuration: 'කියවීමට මිනිත්තු 8',
    metaType: 'ලිපිය',
    metaLevel: 'මධ්‍යම',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro:
      'සමහර බලපෑම් පොදු සහ තාවකාලික විය හැක. අනෙක් ඒවාට වැඩි අවධානයක් අවශ්‍යයි. සුපුරුදු ප්‍රතික්‍රියා සහ තක්සේරු කළ යුතු සලකුණු අතර වෙනස හඳුනාගැනීමට ඉගෙන ගන්න.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'පොදු, සුළු බලපෑම්',
      'ශරීරයේ හැඩගැසීමේ කාලය',
      'වෙනස් වන දේ නිරීක්ෂණය කිරීම',
      'වෛද්‍ය උපදෙස් ලබාගත යුත්තේ කවදාද',
      'කඩිනමින් සත්කාර ලබාගත යුත්තේ කවදාද',
      'ප්‍රධාන කරුණු',
    ],
    body1:
      'යමෙකු නව හෝමෝන ගර්භනිරෝධන ක්‍රමයක් ආරම්භ කරන විට, ශරීරයට හැඩගැසීමට යම් කාලයක් අවශ්‍ය විය හැක. චක්‍රයේ, මනෝභාවයේ, හෝ ශාරීරික සුවපහසුවේ කුඩා වෙනස්කම් දිස්විය හැක.',
    body2:
      'මෙම බලපෑම් බොහෝ විට සුළු වන අතර ක්‍රමයෙන් අඩු විය හැක. ඒවා පැවතීම ස්වයංක්‍රීයව ක්‍රමය භයානක බව හෝ එය නැවැත්විය යුතු බව අදහස් නොවේ.',
    commonEffects: [
      {
        title: 'සුළු ලේ ගැලීම',
        text: 'අක්‍රමවත් ලේ ගැලීම, විශේෂයෙන් නව ක්‍රමයක ආරම්භයේදී, සිදුවිය හැක.',
      },
      {
        title: 'පියයුරු වේදනාව',
        text: 'පියයුරු තද බව හෝ වේදනාව තාවකාලිකව දැනිය හැක.',
      },
      {
        title: 'මනෝභාවය',
        text: 'සමහර පුද්ගලයන් මනෝභාව වෙනස්කම් හෝ වැඩි චිත්තවේගී සංවේදීතාවක් දකිති.',
      },
      {
        title: 'හිසරදය',
        text: 'හැඩගැසීමේ කාලය තුළ සැහැල්ලු හිසරදය ඇතිවිය හැක.',
      },
    ],
    body3:
      'පළමු සති හෝ චක්‍ර කිහිපය ඔබ කලින් හුරුවී සිටි දේට වඩා වෙනස් විය හැක. ශරීරයට නව හෝමෝන සමතුලිතතාවයට ක්‍රමයෙන් හැඩගැසිය හැක.',
    tip1Title: 'දැනගත යුතු දේ',
    tip1Text:
      'ක්‍රමයක් ආරම්භ කිරීමෙන් ටික කලකට පසු දිස්වන බලපෑමක් කාලයත් සමඟ නිරීක්ෂණය කිරීම වටී. එය කරදර සහගත වුවහොත් හෝ දිගටම පවතී නම්, සෞඛ්‍ය වෘත්තිකයෙකු සමඟ කතා කරන්න.',
    body4:
      'එක් චක්‍රයක සිට ඊළඟ චක්‍රයට ඒවා වෙනස් වන ආකාරය වඩා හොඳින් නිරීක්ෂණය කිරීමට ඔබේ යෙදුමේ රෝග ලක්ෂණ සටහන් කිරීම ප්‍රයෝජනවත් විය හැක.',
    trackingTitle: 'දේවල් වෙනස් වන ආකාරය නිරීක්ෂණය කරන්න',
    trackingSubtitle: 'සලකුණු කිහිපයක් ප්‍රයෝජනවත් විය හැක',
    trackingLines: [
      'රෝග ලක්ෂණය දිස්වූ දිනය සටහන් කරන්න.',
      'එහි තීව්‍රතාව සහ කාලය සටහන් කරන්න.',
      'එය යහපත් වේද නරක අතට හැරේද යන්න නිරීක්ෂණය කරන්න.',
    ],
    body5:
      'සියලුම රෝග ලක්ෂණ අනිවාර්යයෙන්ම ගර්භනිරෝධනයට සම්බන්ධ නොවේ. ආතතිය, නින්ද, ආහාර, ඔබේ චක්‍රය, හෝ වෙනත් ප්‍රතිකාරද ඔබට දැනෙන ආකාරයට බලපෑ හැක.',
    body6:
      'තත්ත්වය තේරුම් ගැනීමට, හුදකලා තනි රෝග ලක්ෂණයකට වඩා සමස්ත සන්දර්භය දෙස බැලීමට උත්සාහ කරන්න.',
    worthMentioning: [
      'කැපී පෙනෙන, දිගටම පවතින මනෝභාව වෙනස්කම්',
      'ඔබට කරදර කරන ලිබිඩෝව අඩුවීමක්',
      'චක්‍ර 3කට වඩා පවතින අක්‍රමවත් ලේ ගැලීම',
      'කරදර සහගතව පවතින ඔක්කාරය හෝ හිසරදය',
    ],
    questionsTitle: 'ප්‍රයෝජනවත් ප්‍රශ්න කිහිපයක්',
    questions: [
      'මෙම රෝග ලක්ෂණ කොපමණ කාලයක සිට පවතීද?',
      'ඒවා ගර්භනිරෝධන ක්‍රමයක් ආරම්භ කිරීමෙන් හෝ වෙනස් කිරීමෙන් පසු දිස් වුණාද?',
      'ඒවා සුළු ද, කරදර සහගතද, නැතහොත් ඔබට සැබවින්ම අසාමාන්‍යද?',
      'ඒවා කාලයත් සමඟ යහපත් වෙමින්ද නැතහොත් වඩා නිතර වෙමින්ද?',
    ],
    body7:
      'රෝග ලක්ෂණයක් හදිසි නොවුවද, එය කරදර සහගත වන්නේ නම්, දිගටම පවතී නම්, හෝ ඔබේ ජීවන ගුණාත්මකභාවයට සැබවින්ම බලපාන්නේ නම් එය සාකච්ඡා කිරීම වටී.',
    infoTitle: 'ඔබට උපදෙස් ලබා ගැනීම වටී නම්…',
    infoText:
      'රෝග ලක්ෂණ දිගටම පවතී, වඩා සැලකිය යුතු වේ, හෝ ඔබව සාමාන්‍ය ලෙස ජීවත් වීමෙන් වළක්වයි.',
    body8:
      'වෛද්‍යවරයෙකුට, ප්‍රසව හෙදියකට, හෝ ඖෂධවේදියෙකුට රෝග ලක්ෂණ ඔබ භාවිතා කරන ක්‍රමයට සම්බන්ධ විය හැකිද සහ එය සකස් කිරීමට අවශ්‍යද යන්න තීරණය කිරීමට ඔබට උදව් කළ හැක.',
    body9:
      'සමහර සලකුණු අසාමාන්‍ය වන අතර කඩිනම් වෛද්‍ය තක්සේරුවක් ඉල්ලා සිටී. ඒවා අනිවාර්යයෙන්ම සංකූලතාවක් පවතින බව අදහස් නොවේ, නමුත් ඒවා නොසලකා නොහැරිය යුතුයි.',
    alertTitle: 'කඩිනමින් සත්කාර ලබාගන්න',
    alertIntro: 'ඔබ විශේෂයෙන් මෙවැනි දේ අත්විඳින්නේ නම් ඉක්මනින් වෛද්‍ය උපදෙස් ලබාගන්න:',
    urgentSigns: [
      'සැලකිය යුතු හෝ අසාමාන්‍ය පපුවේ වේදනාව',
      'හදිසි හුස්ම ගැනීමේ අපහසුව',
      'කකුලක අසාමාන්‍ය ඉදිමීම හෝ වේදනාව',
      'හදිසි, ඉතා දැඩි, හෝ අසාමාන්‍ය හිසරදයක්',
      'දෘෂ්ටියේ, කතාවේ, හෝ ශක්තියේ හදිසි ගැටලුව',
    ],
    emergencyTitle: 'බරපතළ තත්ත්වයකදී',
    emergencyText:
      'රෝග ලක්ෂණ හදිසි නම්, ඉතා දැඩි නම්, හෝ හුස්ම ගැනීමේ අපහසුව, ක්ලාන්ත බවක් දැනීම, හෝ වෙනත් බරපතළ සලකුණක් සමඟ පැමිණේ නම්, හදිසි වෛද්‍ය උපකාර ලබාගන්න.',
    summaryTitle: 'අත්‍යවශ්‍ය දේ',
    summaryItems: [
      'නව හෝමෝන ගර්භනිරෝධන ක්‍රමයක ආරම්භයේදී සමහර බලපෑම් දිස්විය හැක.',
      'බොහෝ බලපෑම් තාවකාලික වන අතර කාලයත් සමඟ අඩු විය හැක.',
      'කරදර සහගත හෝ දිගටම පවතින රෝග ලක්ෂණයක් වෘත්තිකයෙකු සමඟ සාකච්ඡා කිරීම වටී.',
      'සමහර අසාමාන්‍ය සලකුණුවලට කඩිනම් වෛද්‍ය උපදෙස් අවශ්‍යයි.',
    ],
    finalTipTitle: 'ප්‍රධාන කරුණ',
    finalTipText:
      'ඔබේ ශරීරයට සවන් දීම ක්‍රමයක් වහාම නැවැත්වීම අනිවාර්යයෙන්ම අදහස් නොවේ. ඔබට දැනෙන දේ සටහන් කරන්න, එය වෙනස් වන ආකාරය නිරීක්ෂණය කරන්න, සහ රෝග ලක්ෂණයක් ඔබව කනස්සල්ලට පත් කරන සෑම විටම උපදෙස් ඉල්ලන්න.',
    disclaimerText:
      'මෙම ලිපිය තොරතුරු අරමුණු සඳහා අදහස් කර ඇති අතර පුද්ගලීකරණය කළ වෛද්‍ය උපදෙස් වෙනුවට නොපවතී. ඔබට සැලකිය යුතු හෝ අසාමාන්‍ය රෝග ලක්ෂණයක් ඇත්නම්, සෞඛ්‍ය වෘත්තිකයෙකුගෙන් උපදෙස් ලබා ගන්න.',
    shareMessage: 'ඇතිවිය හැකි අතුරු ආබාධ හඳුනාගැනීම — AWA',
  },
  th: {
    badge: 'ผลข้างเคียง',
    title: 'การสังเกต\nผลข้างเคียงที่อาจเกิดขึ้น',
    metaDuration: 'อ่าน 8 นาที',
    metaType: 'บทความ',
    metaLevel: 'ปานกลาง',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro:
      'ผลบางอย่างพบบ่อยและเป็นเพียงชั่วคราว ส่วนอย่างอื่นต้องใส่ใจมากกว่า เรียนรู้ที่จะแยกปฏิกิริยาปกติออกจากสัญญาณที่ควรได้รับการประเมิน',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'ผลที่พบบ่อยและไม่รุนแรง',
      'ช่วงปรับตัวของร่างกาย',
      'สังเกตสิ่งที่เปลี่ยนไป',
      'เมื่อไรควรขอคำแนะนำทางการแพทย์',
      'เมื่อไรควรรีบไปพบแพทย์',
      'ประเด็นสำคัญ',
    ],
    body1:
      'เมื่อเริ่มวิธีคุมกำเนิดด้วยฮอร์โมนวิธีใหม่ ร่างกายอาจต้องใช้เวลาปรับตัว การเปลี่ยนแปลงเล็ก ๆ อาจปรากฏในรอบเดือน อารมณ์ หรือความสบายทางกาย',
    body2:
      'ผลเหล่านี้มักไม่รุนแรงและอาจค่อย ๆ ลดลง การมีอยู่ไม่ได้หมายความโดยอัตโนมัติว่าวิธีนั้นเป็นอันตรายหรือต้องหยุดใช้',
    commonEffects: [
      {
        title: 'เลือดออกเล็กน้อย',
        text: 'อาจมีเลือดออกไม่สม่ำเสมอ โดยเฉพาะในช่วงเริ่มวิธีใหม่',
      },
      {
        title: 'เต้านมคัด',
        text: 'อาจรู้สึกตึงหรือเจ็บเต้านมชั่วคราว',
      },
      {
        title: 'อารมณ์',
        text: 'บางคนสังเกตเห็นอารมณ์เปลี่ยนหรืออ่อนไหวมากขึ้น',
      },
      {
        title: 'ปวดหัว',
        text: 'อาจมีอาการปวดหัวเล็กน้อยในช่วงปรับตัว',
      },
    ],
    body3:
      'สัปดาห์หรือรอบเดือนแรก ๆ อาจต่างจากที่คุณคุ้นเคยก่อนหน้านี้ ร่างกายค่อย ๆ ปรับตัวกับสมดุลฮอร์โมนใหม่ได้',
    tip1Title: 'ควรรู้',
    tip1Text:
      'ผลที่ปรากฏไม่นานหลังเริ่มวิธีหนึ่งควรเฝ้าสังเกตตามเวลา หากรบกวนหรือคงอยู่ ให้พูดคุยกับบุคลากรทางการแพทย์',
    body4:
      'การบันทึกอาการในแอปของคุณช่วยให้ติดตามการเปลี่ยนแปลงจากรอบเดือนหนึ่งไปอีกรอบได้ดีขึ้น',
    trackingTitle: 'ติดตามการเปลี่ยนแปลง',
    trackingSubtitle: 'ตัวบ่งชี้บางอย่างมีประโยชน์',
    trackingLines: [
      'จดวันที่อาการปรากฏ',
      'บันทึกความรุนแรงและระยะเวลา',
      'สังเกตว่าดีขึ้นหรือแย่ลง',
    ],
    body5:
      'ไม่ใช่ทุกอาการที่เกี่ยวข้องกับการคุมกำเนิด ความเครียด การนอน อาหาร รอบเดือน หรือการรักษาอื่นก็ส่งผลต่อความรู้สึกของคุณได้',
    body6:
      'เพื่อเข้าใจสถานการณ์ ให้ลองมองบริบทโดยรวมแทนอาการเดียวที่โดดเดี่ยว',
    worthMentioning: [
      'อารมณ์เปลี่ยนแปลงชัดเจนและต่อเนื่อง',
      'ความต้องการทางเพศลดลงจนรบกวนคุณ',
      'เลือดออกไม่สม่ำเสมอเกิน 3 รอบเดือน',
      'คลื่นไส้หรือปวดหัวที่ยังรบกวน',
    ],
    questionsTitle: 'คำถามที่เป็นประโยชน์บางข้อ',
    questions: [
      'อาการเหล่านี้เป็นมานานเท่าไร?',
      'ปรากฏหลังเริ่มหรือเปลี่ยนวิธีคุมกำเนิดหรือไม่?',
      'เล็กน้อย รบกวน หรือผิดปกติจริง ๆ สำหรับคุณ?',
      'ดีขึ้นตามเวลาหรือถี่ขึ้น?',
    ],
    body7:
      'แม้อาการจะไม่เร่งด่วน การพูดคุยก็คุ้มค่าหากรบกวน คงอยู่ หรือส่งผลต่อคุณภาพชีวิตของคุณจริง ๆ',
    infoTitle: 'ควรขอคำแนะนำหาก…',
    infoText:
      'อาการคงอยู่ รุนแรงขึ้น หรือทำให้คุณใช้ชีวิตตามปกติไม่ได้',
    body8:
      'แพทย์ ผดุงครรภ์ หรือเภสัชกรช่วยคุณระบุได้ว่าอาการอาจเกี่ยวข้องกับวิธีที่คุณใช้หรือไม่ และต้องปรับหรือไม่',
    body9:
      'สัญญาณบางอย่างผิดปกติและต้องได้รับการประเมินทางการแพทย์โดยเร็ว ไม่ได้หมายความว่าเกิดภาวะแทรกซ้อนเสมอไป แต่ไม่ควรเพิกเฉย',
    alertTitle: 'รีบไปพบแพทย์',
    alertIntro: 'ขอคำแนะนำทางการแพทย์โดยเร็วหากคุณมี โดยเฉพาะ:',
    urgentSigns: [
      'เจ็บหน้าอกมากหรือผิดปกติ',
      'หายใจลำบากอย่างกะทันหัน',
      'ขาบวมหรือเจ็บผิดปกติ',
      'ปวดหัวอย่างกะทันหัน รุนแรงมาก หรือผิดปกติ',
      'การมองเห็น การพูด หรือกำลังเปลี่ยนไปอย่างกะทันหัน',
    ],
    emergencyTitle: 'ในกรณีที่รุนแรง',
    emergencyText:
      'หากอาการเกิดอย่างกะทันหัน รุนแรงมาก หรือมาพร้อมหายใจลำบาก รู้สึกจะเป็นลม หรือสัญญาณร้ายแรงอื่น ให้ขอความช่วยเหลือทางการแพทย์เร่งด่วน',
    summaryTitle: 'สาระสำคัญ',
    summaryItems: [
      'ผลบางอย่างอาจปรากฏในช่วงเริ่มวิธีคุมกำเนิดด้วยฮอร์โมนวิธีใหม่',
      'ผลหลายอย่างเป็นเพียงชั่วคราวและอาจลดลงตามเวลา',
      'อาการที่รบกวนหรือคงอยู่ควรพูดคุยกับผู้เชี่ยวชาญ',
      'สัญญาณผิดปกติบางอย่างต้องขอคำแนะนำทางการแพทย์โดยเร็ว',
    ],
    finalTipTitle: 'ประเด็นสำคัญ',
    finalTipText:
      'การฟังร่างกายของคุณไม่ได้หมายถึงการหยุดวิธีนั้นทันทีเสมอไป จดสิ่งที่คุณรู้สึก สังเกตว่าเปลี่ยนไปอย่างไร และขอคำแนะนำเมื่อใดก็ตามที่อาการทำให้คุณกังวล',
    disclaimerText:
      'บทความนี้เพื่อให้ข้อมูลและไม่ได้ทดแทนคำแนะนำทางการแพทย์เฉพาะบุคคล หากคุณมีอาการที่สำคัญหรือผิดปกติ โปรดขอคำแนะนำจากบุคลากรทางการแพทย์',
    shareMessage: 'การสังเกตผลข้างเคียงที่อาจเกิดขึ้น — AWA',
  },
  vi: {
    badge: 'TÁC DỤNG PHỤ',
    title: 'Nhận biết các\ntác dụng phụ có thể gặp',
    metaDuration: '8 phút đọc',
    metaType: 'Bài viết',
    metaLevel: 'Trung cấp',
    metaValidated: 'Nội dung đã được thẩm định',
    intro:
      'Một số tác động có thể phổ biến và chỉ tạm thời. Những tác động khác cần được chú ý hơn. Hãy học cách phân biệt giữa các phản ứng thông thường và những dấu hiệu cần được đánh giá.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Các tác động nhẹ, thường gặp',
      'Giai đoạn cơ thể điều chỉnh',
      'Quan sát những gì thay đổi',
      'Khi nào nên tìm lời khuyên y khoa',
      'Khi nào nên tìm sự chăm sóc nhanh chóng',
      'Những điểm chính cần nhớ',
    ],
    body1:
      'Khi ai đó bắt đầu một phương pháp tránh thai nội tiết mới, cơ thể có thể cần một thời gian để điều chỉnh. Những thay đổi nhỏ có thể xuất hiện ở chu kỳ, tâm trạng hoặc sự thoải mái về thể chất.',
    body2:
      'Những tác động này thường nhẹ và có thể giảm dần. Sự hiện diện của chúng không tự động có nghĩa là phương pháp đó nguy hiểm hay cần ngừng.',
    commonEffects: [
      {
        title: 'Ra máu nhẹ',
        text: 'Có thể xảy ra ra máu không đều, đặc biệt lúc bắt đầu một phương pháp mới.',
      },
      {
        title: 'Căng tức ngực',
        text: 'Có thể tạm thời cảm thấy ngực căng hoặc đau nhức.',
      },
      {
        title: 'Tâm trạng',
        text: 'Một số người nhận thấy thay đổi tâm trạng hoặc nhạy cảm về cảm xúc hơn.',
      },
      {
        title: 'Đau đầu',
        text: 'Có thể xảy ra đau đầu nhẹ trong giai đoạn điều chỉnh.',
      },
    ],
    body3:
      'Vài tuần hoặc vài chu kỳ đầu tiên có thể khác với những gì bạn quen thuộc trước đây. Cơ thể có thể dần điều chỉnh với sự cân bằng nội tiết mới.',
    tip1Title: 'Nên biết',
    tip1Text:
      'Một tác động xuất hiện ngay sau khi bắt đầu một phương pháp đáng được theo dõi theo thời gian. Nếu nó trở nên khó chịu hoặc kéo dài, hãy nói chuyện với nhân viên y tế.',
    body4:
      'Ghi lại các triệu chứng trong ứng dụng của bạn có thể hữu ích để theo dõi tốt hơn chúng thay đổi thế nào từ chu kỳ này sang chu kỳ khác.',
    trackingTitle: 'Theo dõi diễn biến',
    trackingSubtitle: 'Một vài mốc có thể hữu ích',
    trackingLines: [
      'Ghi lại ngày triệu chứng xuất hiện.',
      'Ghi lại cường độ và thời gian của nó.',
      'Quan sát xem nó cải thiện hay xấu đi.',
    ],
    body5:
      'Không phải mọi triệu chứng đều nhất thiết liên quan đến biện pháp tránh thai. Căng thẳng, giấc ngủ, chế độ ăn, chu kỳ của bạn hoặc các phương pháp điều trị khác cũng có thể ảnh hưởng đến cảm giác của bạn.',
    body6:
      'Để hiểu tình hình, hãy cố gắng nhìn vào bối cảnh tổng thể thay vì một triệu chứng riêng lẻ.',
    worthMentioning: [
      'Thay đổi tâm trạng rõ rệt, kéo dài',
      'Giảm ham muốn khiến bạn khó chịu',
      'Ra máu không đều kéo dài hơn 3 chu kỳ',
      'Buồn nôn hoặc đau đầu vẫn gây khó chịu',
    ],
    questionsTitle: 'Một vài câu hỏi hữu ích',
    questions: [
      'Những triệu chứng này đã kéo dài bao lâu?',
      'Chúng có xuất hiện sau khi bắt đầu hoặc đổi một phương pháp tránh thai không?',
      'Chúng nhẹ, khó chịu hay thực sự bất thường với bạn?',
      'Chúng đang cải thiện theo thời gian hay trở nên thường xuyên hơn?',
    ],
    body7:
      'Ngay cả khi một triệu chứng không khẩn cấp, vẫn đáng được trao đổi nếu nó trở nên khó chịu, kéo dài hoặc thực sự ảnh hưởng đến chất lượng cuộc sống của bạn.',
    infoTitle: 'Có thể nên tìm lời khuyên nếu…',
    infoText:
      'các triệu chứng kéo dài, trở nên đáng kể hơn hoặc khiến bạn không thể sinh hoạt bình thường.',
    body8:
      'Bác sĩ, nữ hộ sinh hoặc dược sĩ có thể giúp bạn xác định các triệu chứng có thể liên quan đến phương pháp bạn đang dùng không và có cần điều chỉnh không.',
    body9:
      'Một số dấu hiệu bất thường và cần được đánh giá y khoa kịp thời. Chúng không nhất thiết có nghĩa là có biến chứng, nhưng không nên bỏ qua.',
    alertTitle: 'Hãy đi khám ngay',
    alertIntro: 'Hãy nhanh chóng tìm lời khuyên y khoa nếu bạn gặp, đặc biệt:',
    urgentSigns: [
      'Đau ngực đáng kể hoặc bất thường',
      'Khó thở đột ngột',
      'Sưng hoặc đau bất thường ở một bên chân',
      'Đau đầu đột ngột, rất dữ dội hoặc bất thường',
      'Đột ngột gặp khó khăn về thị lực, lời nói hoặc sức mạnh',
    ],
    emergencyTitle: 'Trong trường hợp nghiêm trọng',
    emergencyText:
      'Nếu các triệu chứng đột ngột, rất nặng hoặc đi kèm khó thở, cảm giác choáng váng hoặc dấu hiệu nghiêm trọng khác, hãy tìm sự trợ giúp y tế khẩn cấp.',
    summaryTitle: 'Điều thiết yếu',
    summaryItems: [
      'Một số tác động có thể xuất hiện khi bắt đầu một phương pháp tránh thai nội tiết mới.',
      'Nhiều tác động chỉ tạm thời và có thể giảm dần theo thời gian.',
      'Một triệu chứng gây khó chịu hoặc kéo dài đáng được trao đổi với chuyên gia.',
      'Một số dấu hiệu bất thường cần lời khuyên y khoa kịp thời.',
    ],
    finalTipTitle: 'Điểm chính cần nhớ',
    finalTipText:
      'Lắng nghe cơ thể không nhất thiết có nghĩa là ngừng ngay một phương pháp. Hãy ghi lại những gì bạn cảm thấy, theo dõi diễn biến và hỏi lời khuyên bất cứ khi nào một triệu chứng khiến bạn lo lắng.',
    disclaimerText:
      'Bài viết này nhằm cung cấp thông tin và không thay thế lời khuyên y khoa cá nhân hóa. Nếu bạn có một triệu chứng đáng kể hoặc bất thường, hãy tìm lời khuyên từ nhân viên y tế.',
    shareMessage: 'Nhận biết các tác dụng phụ có thể gặp — AWA',
  },
  uz: {
    badge: 'NOJOʻYA TAʼSIRLAR',
    title: 'Mumkin boʻlgan nojoʻya\ntaʼsirlarni tanish',
    metaDuration: '8 daq oʻqish',
    metaType: 'Maqola',
    metaLevel: 'Oʻrta',
    metaValidated: 'Tasdiqlangan kontent',
    intro:
      'Baʼzi taʼsirlar keng tarqalgan va vaqtinchalik boʻlishi mumkin. Boshqalari koʻproq eʼtiborni talab qiladi. Odatiy reaksiyalarni baholanishi kerak boʻlgan belgilardan farqlashni oʻrganing.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Keng tarqalgan, yengil taʼsirlar',
      'Tananing moslashuv davri',
      'Nima oʻzgarishini kuzatish',
      'Qachon tibbiy maslahat olish kerak',
      'Qachon zudlik bilan yordam soʻrash kerak',
      'Asosiy xulosalar',
    ],
    body1:
      'Kimdir yangi gormonal kontratseptiv usulni boshlaganda, tanaga moslashish uchun biroz vaqt kerak boʻlishi mumkin. Siklda, kayfiyatda yoki jismoniy qulaylikda kichik oʻzgarishlar paydo boʻlishi mumkin.',
    body2:
      'Bu taʼsirlar koʻpincha yengil va asta-sekin kamayishi mumkin. Ularning mavjudligi usul xavfli yoki uni toʻxtatish kerakligini avtomatik anglatmaydi.',
    commonEffects: [
      {
        title: 'Yengil qon ketishi',
        text: 'Notekis qon ketishi, ayniqsa yangi usulning boshida, boʻlishi mumkin.',
      },
      {
        title: 'Koʻkrakning sezgirligi',
        text: 'Koʻkrakning tarangligi yoki sezgirligi vaqtinchalik sezilishi mumkin.',
      },
      {
        title: 'Kayfiyat',
        text: 'Baʼzi odamlar kayfiyat oʻzgarishlari yoki hissiy sezgirlikning ortishini sezadi.',
      },
      {
        title: 'Bosh ogʻrigʻi',
        text: 'Moslashuv davrida yengil bosh ogʻrigʻi boʻlishi mumkin.',
      },
    ],
    body3:
      'Dastlabki bir necha hafta yoki sikl avvalgi odatlaringizdan farq qilishi mumkin. Tana yangi gormonal muvozanatga asta-sekin moslashishi mumkin.',
    tip1Title: 'Bilish foydali',
    tip1Text:
      'Usulni boshlaganingizdan keyin tez orada paydo boʻlgan taʼsirni vaqt davomida kuzatishga arziydi. Agar u noqulay boʻlsa yoki saqlanib qolsa, sogʻliqni saqlash mutaxassisi bilan gaplashing.',
    body4:
      'Alomatlarni sikldan sikliga qanday oʻzgarishini yaxshiroq kuzatish uchun ilovada yozib borish foydali boʻlishi mumkin.',
    trackingTitle: 'Oʻzgarishlarni kuzating',
    trackingSubtitle: 'Bir nechta belgi foydali boʻlishi mumkin',
    trackingLines: [
      'Alomat paydo boʻlgan sanani yozing.',
      'Uning kuchi va davomiyligini qayd eting.',
      'Yaxshilanayotgani yoki yomonlashayotganini kuzating.',
    ],
    body5:
      'Barcha alomatlar albatta kontratseptsiya bilan bogʻliq emas. Stress, uyqu, ovqatlanish, siklingiz yoki boshqa davolanishlar ham oʻzingizni qanday his qilishingizga taʼsir qilishi mumkin.',
    body6:
      'Vaziyatni tushunish uchun yakka alomatga emas, umumiy kontekstga qarashga harakat qiling.',
    worthMentioning: [
      'Sezilarli, doimiy kayfiyat oʻzgarishlari',
      'Sizni bezovta qiladigan libidoning pasayishi',
      '3 sikldan ortiq davom etadigan notekis qon ketishi',
      'Bezovta qilishda davom etadigan koʻngil aynishi yoki bosh ogʻrigʻi',
    ],
    questionsTitle: 'Bir nechta foydali savol',
    questions: [
      'Bu alomatlar qancha vaqtdan beri davom etmoqda?',
      'Ular kontratseptiv usulni boshlagandan yoki oʻzgartirgandan keyin paydo boʻldimi?',
      'Ular yengilmi, bezovta qiladimi yoki siz uchun haqiqatan odatdan tashqarimi?',
      'Ular vaqt oʻtishi bilan yaxshilanyaptimi yoki tez-tez boʻlyaptimi?',
    ],
    body7:
      'Alomat shoshilinch boʻlmasa ham, agar u bezovta qilsa, saqlanib qolsa yoki hayot sifatingizga haqiqatan taʼsir qilsa, uni muhokama qilishga arziydi.',
    infoTitle: 'Maslahat olishga arziydi, agar…',
    infoText:
      'alomatlar saqlanib qolsa, kuchaysa yoki normal yashashingizga xalaqit bersa.',
    body8:
      'Shifokor, doya yoki farmatsevt alomatlar siz ishlatayotgan usul bilan bogʻliq boʻlishi mumkinligini va uni moslashtirish kerakligini aniqlashga yordam beradi.',
    body9:
      'Baʼzi belgilar odatdan tashqari va zudlik bilan tibbiy baholashni talab qiladi. Ular albatta asorat borligini anglatmaydi, lekin ularni eʼtiborsiz qoldirmaslik kerak.',
    alertTitle: 'Zudlik bilan yordam soʻrang',
    alertIntro: 'Xususan, quyidagilarni sezsangiz, tezda tibbiy maslahat oling:',
    urgentSigns: [
      'Koʻkrak qafasidagi sezilarli yoki odatdan tashqari ogʻriq',
      'Birdan nafas olishning qiyinlashishi',
      'Oyoqdagi odatdan tashqari shish yoki ogʻriq',
      'Birdan paydo boʻlgan, juda kuchli yoki odatdan tashqari bosh ogʻrigʻi',
      'Koʻrish, nutq yoki kuchda birdan muammo',
    ],
    emergencyTitle: 'Ogʻir vaziyat boʻlsa',
    emergencyText:
      'Agar alomatlar birdan paydo boʻlsa, juda kuchli boʻlsa yoki nafas olish qiyinligi, hushdan ketayotgandek his qilish yoki boshqa jiddiy belgi bilan birga kelsa, shoshilinch tibbiy yordam soʻrang.',
    summaryTitle: 'Asosiy jihatlar',
    summaryItems: [
      'Baʼzi taʼsirlar yangi gormonal kontratseptiv usulning boshida paydo boʻlishi mumkin.',
      'Koʻp taʼsirlar vaqtinchalik va vaqt oʻtishi bilan kamayishi mumkin.',
      'Bezovta qiladigan yoki doimiy alomatni mutaxassis bilan muhokama qilishga arziydi.',
      'Baʼzi odatdan tashqari belgilar zudlik bilan tibbiy maslahatni talab qiladi.',
    ],
    finalTipTitle: 'Asosiy xulosa',
    finalTipText:
      'Tanangizni tinglash usulni darhol toʻxtatishni albatta anglatmaydi. His qilayotgan narsangizni yozib boring, uning qanday oʻzgarishini kuzating va alomat xavotirga solganda maslahat soʻrang.',
    disclaimerText:
      'Bu maqola maʼlumot uchun moʻljallangan va shaxsiy tibbiy maslahatni almashtirmaydi. Agar sezilarli yoki odatdan tashqari alomat boʻlsa, sogʻliqni saqlash mutaxassisidan maslahat oling.',
    shareMessage: 'Mumkin boʻlgan nojoʻya taʼsirlarni tanish — AWA',
  },
  az: {
    badge: 'YAN TƏSİRLƏR',
    title: 'Mümkün yan təsirləri\ntanımaq',
    metaDuration: '8 dəq oxu',
    metaType: 'Məqalə',
    metaLevel: 'Orta',
    metaValidated: 'Yoxlanılmış məzmun',
    intro:
      'Bəzi təsirlər geniş yayılmış və müvəqqəti ola bilər. Digərləri daha çox diqqət tələb edir. Adi reaksiyaları qiymətləndirilməli əlamətlərdən ayırmağı öyrənin.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Geniş yayılmış, yüngül təsirlər',
      'Bədənin uyğunlaşma dövrü',
      'Nəyin dəyişdiyini müşahidə etmək',
      'Nə vaxt tibbi məsləhət almaq lazımdır',
      'Nə vaxt tez tibbi yardım almaq lazımdır',
      'Əsas nəticələr',
    ],
    body1:
      'Kimsə yeni hormonal kontrasepsiya üsuluna başlayanda bədənin uyğunlaşması üçün bir qədər vaxt lazım ola bilər. Dövrdə, əhvalda və ya fiziki rahatlıqda kiçik dəyişikliklər görünə bilər.',
    body2:
      'Bu təsirlər çox vaxt yüngül olur və tədricən azala bilər. Onların olması üsulun avtomatik olaraq təhlükəli olduğunu və ya dayandırılmalı olduğunu bildirmir.',
    commonEffects: [
      {
        title: 'Yüngül qanaxma',
        text: 'Qeyri-müntəzəm qanaxma ola bilər, xüsusilə yeni üsulun əvvəlində.',
      },
      {
        title: 'Döşün həssaslığı',
        text: 'Döşdə gərginlik və ya həssaslıq müvəqqəti hiss oluna bilər.',
      },
      {
        title: 'Əhval',
        text: 'Bəziləri əhval dəyişikliyini və ya emosional həssaslığın artmasını hiss edir.',
      },
      {
        title: 'Baş ağrıları',
        text: 'Uyğunlaşma dövründə yüngül baş ağrıları ola bilər.',
      },
    ],
    body3:
      'İlk bir neçə həftə və ya dövr əvvəllər öyrəşdiyinizdən fərqli ola bilər. Bədən yeni hormonal tarazlığa tədricən uyğunlaşa bilər.',
    tip1Title: 'Bilmək faydalıdır',
    tip1Text:
      'Üsula başladıqdan qısa müddət sonra görünən təsiri zamanla izləməyə dəyər. Narahatedici olarsa və ya davam edərsə, tibb işçisi ilə danışın.',
    body4:
      'Simptomların bir dövrdən digərinə necə dəyişdiyini daha yaxşı izləmək üçün onları tətbiqdə qeyd etmək faydalı ola bilər.',
    trackingTitle: 'Dəyişikliyi izləyin',
    trackingSubtitle: 'Bir neçə göstərici faydalı ola bilər',
    trackingLines: [
      'Simptomun göründüyü tarixi qeyd edin.',
      'Onun intensivliyini və müddətini qeyd edin.',
      'Yaxşılaşıb-pisləşdiyini izləyin.',
    ],
    body5:
      'Bütün simptomlar mütləq kontrasepsiya ilə bağlı deyil. Stress, yuxu, qidalanma, dövrünüz və ya digər müalicələr də özünüzü necə hiss etdiyinizə təsir edə bilər.',
    body6:
      'Vəziyyəti anlamaq üçün tək bir simptoma deyil, ümumi kontekstə baxmağa çalışın.',
    worthMentioning: [
      'Nəzərəçarpan, davamlı əhval dəyişiklikləri',
      'Sizi narahat edən libidonun azalması',
      '3 dövrdən çox davam edən qeyri-müntəzəm qanaxma',
      'Narahatedici qalan ürəkbulanma və ya baş ağrıları',
    ],
    questionsTitle: 'Bir neçə faydalı sual',
    questions: [
      'Bu simptomlar nə qədərdir davam edir?',
      'Onlar kontrasepsiya üsuluna başladıqdan və ya onu dəyişdikdən sonra görünüb?',
      'Onlar yüngül, narahatedici və ya sizin üçün həqiqətən qeyri-adidir?',
      'Zamanla yaxşılaşır, yoxsa daha tez-tez olur?',
    ],
    body7:
      'Simptom təcili olmasa belə, narahatedici olarsa, davam edərsə və ya həyat keyfiyyətinizə həqiqətən təsir edərsə, onu müzakirə etməyə dəyər.',
    infoTitle: 'Məsləhət almağa dəyər, əgər…',
    infoText:
      'simptomlar davam edir, daha əhəmiyyətli olur və ya normal yaşamağınıza mane olur.',
    body8:
      'Həkim, mama və ya əczaçı simptomların istifadə etdiyiniz üsulla bağlı ola biləcəyini və onun tənzimlənməli olub-olmadığını müəyyən etməyə kömək edə bilər.',
    body9:
      'Bəzi əlamətlər qeyri-adidir və təcili tibbi qiymətləndirmə tələb edir. Onlar mütləq fəsadın olduğunu bildirmir, lakin nəzərə alınmamalıdır.',
    alertTitle: 'Tez tibbi yardım alın',
    alertIntro: 'Xüsusilə aşağıdakıları yaşayırsınızsa, tez tibbi məsləhət alın:',
    urgentSigns: [
      'Əhəmiyyətli və ya qeyri-adi sinə ağrısı',
      'Qəfil nəfəs çətinliyi',
      'Ayaqda qeyri-adi şişkinlik və ya ağrı',
      'Qəfil, çox şiddətli və ya qeyri-adi baş ağrısı',
      'Qəfil görmə, nitq və ya güc problemləri',
    ],
    emergencyTitle: 'Ağır vəziyyət halında',
    emergencyText:
      'Simptomlar qəfil, çox şiddətli olarsa və ya nəfəs çətinliyi, hövsələsizlik hissi və ya digər ciddi əlamətlə müşayiət olunarsa, təcili tibbi yardım axtarın.',
    summaryTitle: 'Əsas məsələlər',
    summaryItems: [
      'Yeni hormonal kontrasepsiya üsulunun əvvəlində bəzi təsirlər görünə bilər.',
      'Bir çox təsir müvəqqətidir və zamanla azala bilər.',
      'Narahatedici və ya davamlı simptomu mütəxəssislə müzakirə etməyə dəyər.',
      'Bəzi qeyri-adi əlamətlər təcili tibbi məsləhət tələb edir.',
    ],
    finalTipTitle: 'Əsas nəticə',
    finalTipText:
      'Bədəninizi dinləmək üsulu dərhal dayandırmaq demək deyil. Hiss etdiyinizi qeyd edin, necə dəyişdiyini izləyin və hər hansı simptom sizi narahat etdikdə məsləhət alın.',
    disclaimerText:
      'Bu məqalə məlumat məqsədi daşıyır və fərdi tibbi məsləhəti əvəz etmir. Əhəmiyyətli və ya qeyri-adi simptomunuz varsa, tibb işçisindən məsləhət alın.',
    shareMessage: 'Mümkün yan təsirləri tanımaq — AWA',
  },
  ka: {
    badge: 'გვერდითი მოვლენები',
    title: 'შესაძლო გვერდითი\nმოვლენების ამოცნობა',
    metaDuration: '8 წთ საკითხავი',
    metaType: 'სტატია',
    metaLevel: 'საშუალო',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro:
      'ზოგი ეფექტი შეიძლება გავრცელებული და დროებითი იყოს. სხვები მეტ ყურადღებას მოითხოვს. ისწავლეთ ჩვეულებრივ რეაქციებსა და ნიშნებს შორის განსხვავება, რომლებიც შეფასებას საჭიროებს.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'გავრცელებული, მსუბუქი ეფექტები',
      'სხეულის ადაპტაციის პერიოდი',
      'ცვლილებებზე დაკვირვება',
      'როდის მივმართოთ სამედიცინო რჩევას',
      'როდის მივმართოთ დახმარებას სწრაფად',
      'მთავარი დასკვნები',
    ],
    body1:
      'როცა ადამიანი ჰორმონული კონტრაცეფციის ახალ მეთოდს იწყებს, სხეულს ადაპტაციისთვის გარკვეული დრო შეიძლება დასჭირდეს. ციკლში, ხასიათსა თუ ფიზიკურ კომფორტში მცირე ცვლილებები შეიძლება გამოჩნდეს.',
    body2:
      'ეს ეფექტები ხშირად მსუბუქია და ეტაპობრივად შეიძლება შემცირდეს. მათი არსებობა ავტომატურად არ ნიშნავს, რომ მეთოდი საშიშია ან უნდა შეწყდეს.',
    commonEffects: [
      {
        title: 'უმნიშვნელო სისხლდენა',
        text: 'არარეგულარული სისხლდენა შეიძლება მოხდეს, განსაკუთრებით ახალი მეთოდის დასაწყისში.',
      },
      {
        title: 'მკერდის სიმტკივნე',
        text: 'მკერდის დაძაბულობა ან სიმტკივნე დროებით შეიძლება იგრძნოთ.',
      },
      {
        title: 'ხასიათი',
        text: 'ზოგი ხასიათის ცვლილებას ან გაზრდილ ემოციურ მგრძნობელობას ამჩნევს.',
      },
      {
        title: 'თავის ტკივილი',
        text: 'მსუბუქი თავის ტკივილი ადაპტაციის პერიოდში შეიძლება მოხდეს.',
      },
    ],
    body3:
      'პირველი რამდენიმე კვირა ან ციკლი შეიძლება განსხვავდებოდეს იმისგან, რასაც ადრე იყავით შეჩვეული. სხეულს შეუძლია ახალ ჰორმონულ ბალანსთან ეტაპობრივად ადაპტაცია.',
    tip1Title: 'კარგია ვიცოდეთ',
    tip1Text:
      'ეფექტი, რომელიც მეთოდის დაწყებიდან მალევე ჩნდება, დროთა განმავლობაში დაკვირვებას იმსახურებს. თუ ის შემაწუხებელი ხდება ან გრძელდება, ესაუბრეთ ჯანდაცვის სპეციალისტს.',
    body4:
      'სასარგებლო შეიძლება იყოს სიმპტომების ჩაწერა თქვენს აპში, რომ უკეთ აკონტროლოთ, როგორ იცვლება ისინი ერთი ციკლიდან მეორეზე.',
    trackingTitle: 'აკონტროლეთ ცვლილება',
    trackingSubtitle: 'რამდენიმე მარკერი სასარგებლო შეიძლება იყოს',
    trackingLines: [
      'აღნიშნეთ სიმპტომის გამოჩენის თარიღი.',
      'ჩაიწერეთ მისი ინტენსივობა და ხანგრძლივობა.',
      'დააკვირდით, უმჯობესდება თუ უარესდება.',
    ],
    body5:
      'ყველა სიმპტომი აუცილებლად კონტრაცეფციას არ უკავშირდება. სტრესმა, ძილმა, კვებამ, თქვენმა ციკლმა ან სხვა მკურნალობამაც შეიძლება თქვენს თვითგრძნობაზე იმოქმედოს.',
    body6:
      'სიტუაციის გასაგებად ეცადეთ საერთო კონტექსტს შეხედოთ და არა ერთ იზოლირებულ სიმპტომს.',
    worthMentioning: [
      'გამოხატული, გაგრძელებული ხასიათის ცვლილებები',
      'ლიბიდოს დაქვეითება, რომელიც გაწუხებთ',
      'არარეგულარული სისხლდენა, რომელიც 3 ციკლზე მეტ ხანს გრძელდება',
      'გულისრევა ან თავის ტკივილი, რომელიც შემაწუხებელი რჩება',
    ],
    questionsTitle: 'რამდენიმე სასარგებლო კითხვა',
    questions: [
      'რამდენი ხანია გრძელდება ეს სიმპტომები?',
      'გამოჩნდა თუ არა ისინი კონტრაცეფციის მეთოდის დაწყების ან შეცვლის შემდეგ?',
      'მსუბუქია, შემაწუხებელია თუ ნამდვილად უჩვეულოა თქვენთვის?',
      'უმჯობესდება დროთა განმავლობაში თუ უფრო ხშირი ხდება?',
    ],
    body7:
      'მაშინაც კი, როცა სიმპტომი გადაუდებელი არ არის, ღირს მისი განხილვა, თუ ის შემაწუხებელი ხდება, გრძელდება ან ნამდვილად გიმოქმედებთ ცხოვრების ხარისხზე.',
    infoTitle: 'შეიძლება ღირდეს რჩევის მიღება, თუ…',
    infoText:
      'სიმპტომები რჩება, მნიშვნელოვანი ხდება ან ნორმალურად ცხოვრებას გიშლით.',
    body8:
      'ექიმს, ბებიაქალს ან ფარმაცევტს შეუძლია დაგეხმაროთ განსაზღვროთ, შეიძლება თუ არა სიმპტომები თქვენ მიერ გამოყენებულ მეთოდს უკავშირდებოდეს და უნდა მოირგოს თუ არა ის.',
    body9:
      'ზოგი ნიშანი უჩვეულოა და სწრაფ სამედიცინო შეფასებას მოითხოვს. ისინი აუცილებლად გართულების არსებობას არ ნიშნავს, მაგრამ უგულებელყოფა არ უნდა მოხდეს.',
    alertTitle: 'სწრაფად მიმართეთ დახმარებას',
    alertIntro: 'სწრაფად მიმართეთ სამედიცინო რჩევას, თუ განიცდით, კერძოდ:',
    urgentSigns: [
      'მნიშვნელოვანი ან უჩვეულო გულმკერდის ტკივილი',
      'მოულოდნელი სუნთქვის სირთულე',
      'უჩვეულო შეშუპება ან ტკივილი ფეხზე',
      'მოულოდნელი, ძალიან ინტენსიური ან უჩვეულო თავის ტკივილი',
      'მოულოდნელი პრობლემა მხედველობასთან, მეტყველებასთან ან ძალასთან',
    ],
    emergencyTitle: 'მძიმე სიტუაციის შემთხვევაში',
    emergencyText:
      'თუ სიმპტომები მოულოდნელია, ძალიან მძიმეა ან თან ახლავს სუნთქვის სირთულე, გულის წასვლის შეგრძნება ან სხვა სერიოზული ნიშანი, მიმართეთ გადაუდებელ სამედიცინო დახმარებას.',
    summaryTitle: 'მთავარი',
    summaryItems: [
      'ზოგი ეფექტი ჰორმონული კონტრაცეფციის ახალი მეთოდის დასაწყისში შეიძლება გამოჩნდეს.',
      'ბევრი ეფექტი დროებითია და დროთა განმავლობაში შეიძლება შემცირდეს.',
      'შემაწუხებელი ან გაგრძელებული სიმპტომი სპეციალისტთან განხილვას იმსახურებს.',
      'ზოგი უჩვეულო ნიშანი სწრაფ სამედიცინო რჩევას მოითხოვს.',
    ],
    finalTipTitle: 'მთავარი დასკვნა',
    finalTipText:
      'თქვენი სხეულისთვის ყურის მიგდება აუცილებლად არ ნიშნავს მეთოდის დაუყოვნებლივ შეწყვეტას. აღნიშნეთ, რასაც გრძნობთ, დააკვირდით მის ცვლილებას და ითხოვეთ რჩევა, როცა სიმპტომი გაწუხებთ.',
    disclaimerText:
      'ეს სტატია საინფორმაციო მიზნებისთვისაა განკუთვნილი და პერსონალიზებულ სამედიცინო რჩევას არ ანაცვლებს. თუ მნიშვნელოვანი ან უჩვეულო სიმპტომი გაქვთ, მიმართეთ ჯანდაცვის სპეციალისტს.',
    shareMessage: 'შესაძლო გვერდითი მოვლენების ამოცნობა — AWA',
  },
  hy: {
    badge: 'ԿՈՂՄՆԱԿԻ ԱԶԴԵՑՈՒԹՅՈՒՆՆԵՐ',
    title: 'Հնարավոր կողմնակի\nազդեցությունների ճանաչում',
    metaDuration: '8 ր կարդալու համար',
    metaType: 'Հոդված',
    metaLevel: 'Միջին',
    metaValidated: 'Վերանայված բովանդակություն',
    intro:
      'Որոշ ազդեցություններ կարող են լինել տարածված և ժամանակավոր: Մյուսները ավելի շատ ուշադրություն են պահանջում: Սովորեք տարբերակել սովորական արձագանքները այն նշաններից, որոնք պետք է գնահատվեն:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Տարածված, թեթև ազդեցություններ',
      'Մարմնի հարմարվողական շրջան',
      'Դիտարկել, թե ինչն է փոխվում',
      'Երբ դիմել բժշկական խորհրդատվության',
      'Երբ արագ խնամք փնտրել',
      'Հիմնական եզրակացություններ',
    ],
    body1:
      'Երբ մարդը սկսում է հորմոնալ հակաբեղմնավորման նոր մեթոդ, մարմինը կարող է ժամանակի կարիք ունենալ հարմարվելու համար: Ցիկլում, տրամադրության կամ ֆիզիկական հարմարավետության մեջ կարող են հայտնվել փոքր փոփոխություններ:',
    body2:
      'Այս ազդեցությունները հաճախ թեթև են և կարող են աստիճանաբար նվազել: Դրանց առկայությունը ինքնաբերաբար չի նշանակում, որ մեթոդը վտանգավոր է կամ պետք է դադարեցվի:',
    commonEffects: [
      {
        title: 'Աննշան արյունահոսություն',
        text: 'Կարող է առաջանալ անկանոն արյունահոսություն, մասնավորապես նոր մեթոդի սկզբում:',
      },
      {
        title: 'Կրծքի ցավոտություն',
        text: 'Կրծքի ձգվածություն կամ ցավոտություն կարող է ժամանակավորապես զգացվել:',
      },
      {
        title: 'Տրամադրություն',
        text: 'Որոշ մարդիկ նկատում են տրամադրության փոփոխություններ կամ ավելացած հուզական զգայունություն:',
      },
      {
        title: 'Գլխացավեր',
        text: 'Հարմարվողական շրջանում կարող են առաջանալ թեթև գլխացավեր:',
      },
    ],
    body3:
      'Առաջին մի քանի շաբաթները կամ ցիկլերը կարող են տարբերվել նախկինում սովորածից: Մարմինը կարող է աստիճանաբար հարմարվել նոր հորմոնալ հավասարակշռությանը:',
    tip1Title: 'Լավ է իմանալ',
    tip1Text:
      'Մեթոդը սկսելուց անմիջապես հետո հայտնվող ազդեցությունն արժե ժամանակի ընթացքում հետևել: Եթե այն դառնում է անհարմար կամ շարունակվում է, խոսեք առողջապահության մասնագետի հետ:',
    body4:
      'Կարող է օգտակար լինել ախտանիշները գրանցել ձեր հավելվածում՝ ավելի լավ հետևելու համար, թե ինչպես են դրանք փոխվում մի ցիկլից մյուսը:',
    trackingTitle: 'Հետևեք զարգացմանը',
    trackingSubtitle: 'Մի քանի ուղենիշ կարող է օգտակար լինել',
    trackingLines: [
      'Գրանցեք ախտանիշի հայտնվելու ամսաթիվը:',
      'Գրանցեք դրա ինտենսիվությունը և տևողությունը:',
      'Հետևեք՝ բարելավվում է, թե վատանում:',
    ],
    body5:
      'Բոլոր ախտանիշները պարտադիր չէ կապված լինեն հակաբեղմնավորման հետ: Սթրեսը, քունը, սննդակարգը, ձեր ցիկլը կամ այլ բուժումները նույնպես կարող են ազդել ձեր ինքնազգացողության վրա:',
    body6:
      'Իրավիճակը հասկանալու համար փորձեք նայել ընդհանուր համատեքստին, այլ ոչ թե մեկ ախտանիշին առանձին:',
    worthMentioning: [
      'Արտահայտված, շարունակական տրամադրության փոփոխություններ',
      'Լիբիդոյի անկում, որն անհանգստացնում է ձեզ',
      'Անկանոն արյունահոսություն, որը տևում է 3 ցիկլից ավելի',
      'Սրտխառնոց կամ գլխացավեր, որոնք մնում են անհարմար',
    ],
    questionsTitle: 'Մի քանի օգտակար հարց',
    questions: [
      'Որքա՞ն ժամանակ են շարունակվում այս ախտանիշները:',
      'Դրանք հայտնվե՞լ են հակաբեղմնավորման մեթոդը սկսելուց կամ փոխելուց հետո:',
      'Դրանք թեթև են, անհարմար, թե իսկապես անսովոր ձեզ համար:',
      'Ժամանակի ընթացքում բարելավվո՞ւմ են, թե՞ ավելի հաճախակի են դառնում:',
    ],
    body7:
      'Նույնիսկ երբ ախտանիշը շտապ չէ, արժե այն քննարկել, եթե դառնում է անհարմար, շարունակվում է կամ իսկապես ազդում է ձեր կյանքի որակի վրա:',
    infoTitle: 'Արժե խորհուրդ հարցնել, եթե…',
    infoText:
      'ախտանիշները շարունակվում են, դառնում են ավելի զգալի կամ խանգարում են նորմալ ապրել:',
    body8:
      'Բժիշկը, մանկաբարձուհին կամ դեղագործը կարող է օգնել որոշել՝ ախտանիշները կարող են կապված լինել ձեր օգտագործած մեթոդի հետ, թե պետք է այն ճշգրտել:',
    body9:
      'Որոշ նշաններ անսովոր են և պահանջում են բժշկական անհապաղ գնահատում: Դրանք պարտադիր չէ նշանակեն բարդության առկայություն, սակայն չպետք է անտեսվեն:',
    alertTitle: 'Արագ դիմեք խնամքի',
    alertIntro: 'Արագ դիմեք բժշկական խորհրդատվության, եթե զգում եք, մասնավորապես.',
    urgentSigns: [
      'Կրծքավանդակի զգալի կամ անսովոր ցավ',
      'Հանկարծակի շնչառության դժվարություն',
      'Անսովոր այտուց կամ ցավ ոտքում',
      'Հանկարծակի, շատ ինտենսիվ կամ անսովոր գլխացավ',
      'Հանկարծակի խնդիրներ տեսողության, խոսքի կամ ուժի հետ',
    ],
    emergencyTitle: 'Ծանր իրավիճակի դեպքում',
    emergencyText:
      'Եթե ախտանիշները հանկարծակի են, շատ ծանր են կամ ուղեկցվում են շնչառության դժվարությամբ, ուշագնացության զգացումով կամ այլ լուրջ նշանով, դիմեք շտապ բժշկական օգնության:',
    summaryTitle: 'Էականը',
    summaryItems: [
      'Որոշ ազդեցություններ կարող են հայտնվել հորմոնալ հակաբեղմնավորման նոր մեթոդի սկզբում:',
      'Շատ ազդեցություններ ժամանակավոր են և կարող են նվազել ժամանակի ընթացքում:',
      'Անհարմար կամ շարունակական ախտանիշն արժե քննարկել մասնագետի հետ:',
      'Որոշ անսովոր նշաններ պահանջում են բժշկական անհապաղ խորհրդատվություն:',
    ],
    finalTipTitle: 'Հիմնական եզրակացություն',
    finalTipText:
      'Ձեր մարմինը լսելը պարտադիր չէ նշանակի անմիջապես դադարեցնել մեթոդը: Գրանցեք, թե ինչ եք զգում, հետևեք, թե ինչպես է այն զարգանում, և խորհուրդ հարցրեք ամեն անգամ, երբ ախտանիշը անհանգստացնում է ձեզ:',
    disclaimerText:
      'Այս հոդվածը նախատեսված է տեղեկատվական նպատակով և չի փոխարինում անհատականացված բժշկական խորհրդատվությանը: Եթե ունեք զգալի կամ անսովոր ախտանիշ, խորհուրդ հարցրեք առողջապահության մասնագետից:',
    shareMessage: 'Հնարավոր կողմնակի ազդեցությունների ճանաչում — AWA',
  },
  tg: {
    badge: 'ТАЪСИРОТИ МАНФӢ',
    title: 'Шинохтани таъсироти манфии\nэҳтимолӣ',
    metaDuration: '8 дақ барои хондан',
    metaType: 'Мақола',
    metaLevel: 'Миёна',
    metaValidated: 'Мазмуни баррасишуда',
    intro:
      'Баъзе таъсирот метавонанд маъмул ва муваққатӣ бошанд. Дигарон диққати бештарро талаб мекунанд. Фарқ кардани вокунишҳои одатӣ аз нишонаҳое, ки бояд арзёбӣ шаванд, биомӯзед.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Таъсироти маъмул ва сабук',
      'Давраи мутобиқшавии бадан',
      'Мушоҳидаи он чи тағйир меёбад',
      'Кай маслиҳати тиббӣ пурсидан лозим аст',
      'Кай зуд нигоҳубин ҷустан лозим аст',
      'Хулосаҳои асосӣ',
    ],
    body1:
      'Вақте ки касе усули нави пешгирии гормониро оғоз мекунад, бадан метавонад барои мутобиқшавӣ андаке вақт талаб кунад. Тағйироти хурд метавонад дар давра, кайфият ё роҳатии ҷисмонӣ пайдо шавад.',
    body2:
      'Ин таъсирот аксар вақт сабуканд ва метавонанд тадриҷан кам шаванд. Мавҷудияти онҳо худкор маънои хатарнок будани усул ё зарурати қатъи онро надорад.',
    commonEffects: [
      {
        title: 'Хунравии хурд',
        text: 'Хунравии номунтазам метавонад рух диҳад, хусусан дар оғози усули нав.',
      },
      {
        title: 'Ҳассосияти пистон',
        text: 'Танг шудан ё ҳассосияти пистон метавонад муваққатан эҳсос шавад.',
      },
      {
        title: 'Кайфият',
        text: 'Баъзеҳо тағйироти кайфият ё ҳассосияти ҳиссии афзударо мушоҳида мекунанд.',
      },
      {
        title: 'Дарди сар',
        text: 'Дарди сабуки сар метавонад ҳангоми давраи мутобиқшавӣ рух диҳад.',
      },
    ],
    body3:
      'Чанд ҳафта ё давраи аввал метавонад аз он чи пештар одат карда будед, фарқ кунад. Бадан метавонад тадриҷан ба тавозуни нави гормонӣ мутобиқ шавад.',
    tip1Title: 'Донистан хуб аст',
    tip1Text:
      'Таъсире, ки дар ба зудӣ пас аз оғози усул пайдо мешавад, сазовори пайгирӣ бо мурури замон аст. Агар он мазоҳим шавад ё идома ёбад, бо мутахассиси соҳаи тиб гап занед.',
    body4:
      'Муфид буда метавонад, ки нишонаҳоро дар барномаи худ сабт кунед, то тағйирёбии онҳоро аз як давра то давраи дигар беҳтар пайгирӣ намоед.',
    trackingTitle: 'Тағйирёбиро пайгирӣ кунед',
    trackingSubtitle: 'Чанд нишона метавонад муфид бошад',
    trackingLines: [
      'Санаи пайдо шудани нишонаро қайд кунед.',
      'Шиддат ва давомнокии онро сабт кунед.',
      'Мушоҳида кунед, ки беҳтар мешавад ё бадтар.',
    ],
    body5:
      'На ҳамаи нишонаҳо ҳатман бо пешгирӣ алоқаманданд. Стресс, хоб, ғизо, давраи шумо ё табобатҳои дигар низ метавонанд ба эҳсоси шумо таъсир расонанд.',
    body6:
      'Барои фаҳмидани вазъият кӯшиш кунед ба заминаи умумӣ нигоҳ кунед, на ба як нишонаи ҷудогона.',
    worthMentioning: [
      'Тағйироти равшан ва доимии кайфият',
      'Кам шудани майли ҷинсӣ, ки шуморо нигарон мекунад',
      'Хунравии номунтазам, ки зиёда аз 3 давра давом мекунад',
      'Беҳузурӣ ё дарди сар, ки мазоҳим мемонад',
    ],
    questionsTitle: 'Чанд савол барои кумак',
    questions: [
      'Ин нишонаҳо аз кай идома доранд?',
      'Оё онҳо пас аз оғоз ё тағйири усули пешгирӣ пайдо шуданд?',
      'Оё онҳо сабук, мазоҳим ё воқеан барои шумо ғайриоддианд?',
      'Оё онҳо бо мурури замон беҳтар мешаванд ё зудтар рух медиҳанд?',
    ],
    body7:
      'Ҳатто вақте ки нишона фаврӣ нест, метавонад сазовор бошад, ки онро муҳокима кунед, агар мазоҳим шавад, идома ёбад ё воқеан ба сифати зиндагии шумо таъсир расонад.',
    infoTitle: 'Шояд маслиҳат пурсидан сазовор бошад, агар…',
    infoText:
      'нишонаҳо идома ёбанд, назарраст шаванд ё шуморо аз зиндагии муқаррарӣ бозмедоранд.',
    body8:
      'Табиб, доя ё доруфурӯш метавонад ба шумо кумак кунад муайян кунед, ки оё нишонаҳо метавонанд бо усули истифодашаванда алоқаманд бошанд ва оё онро танзим кардан лозим аст.',
    body9:
      'Баъзе нишонаҳо ғайриоддианд ва арзёбии зуди тиббиро талаб мекунанд. Онҳо ҳатман маънои мавҷудияти мушкилиро надоранд, вале набояд нодида гирифта шаванд.',
    alertTitle: 'Зуд нигоҳубин ҷӯед',
    alertIntro: 'Зуд маслиҳати тиббӣ пурсед, агар хусусан эҳсос кунед:',
    urgentSigns: [
      'Дарди назаррас ё ғайриоддии сина',
      'Душвории ногаҳонии нафаскашӣ',
      'Варам ё дарди ғайриоддӣ дар як по',
      'Дарди сари ногаҳонӣ, хеле шадид ё ғайриоддӣ',
      'Мушкилоти ногаҳонӣ бо биноӣ, сухан ё қувват',
    ],
    emergencyTitle: 'Дар ҳолати вазнин',
    emergencyText:
      'Агар нишонаҳо ногаҳонӣ, хеле вазнин бошанд ё бо душвории нафаскашӣ, эҳсоси беҳушӣ ё нишонаи ҷиддии дигар ҳамроҳ шаванд, кумаки фавриро ҷӯед.',
    summaryTitle: 'Муҳимтарин чизҳо',
    summaryItems: [
      'Баъзе таъсирот метавонад дар оғози усули нави пешгирии гормонӣ пайдо шавад.',
      'Бисёр таъсирот муваққатианд ва бо мурури замон метавонанд кам шаванд.',
      'Нишонаи мазоҳим ё доимӣ сазовор аст, ки бо мутахассис муҳокима шавад.',
      'Баъзе нишонаҳои ғайриоддӣ маслиҳати зуди тиббиро талаб мекунанд.',
    ],
    finalTipTitle: 'Хулосаи асосӣ',
    finalTipText:
      'Гӯш додан ба бадан ҳатман маънои фавран қатъ кардани усулро надорад. Он чиро, ки эҳсос мекунед, қайд кунед, тағйирёбии онро мушоҳида кунед ва ҳар вақт нишона шуморо нигарон кунад, маслиҳат пурсед.',
    disclaimerText:
      'Ин мақола барои иттилоъ пешбинӣ шудааст ва маслиҳати шахсии тиббиро иваз намекунад. Агар нишонаи назаррас ё ғайриоддӣ дошта бошед, аз мутахассиси соҳаи тиб маслиҳат пурсед.',
    shareMessage: 'Шинохтани таъсироти манфии эҳтимолӣ — AWA',
  },
  ky: {
    badge: 'ТЕРС ТААСИРЛЕР',
    title: 'Мүмкүн болгон терс\nтаасирлерди таануу',
    metaDuration: '8 мүн окуу',
    metaType: 'Макала',
    metaLevel: 'Орто',
    metaValidated: 'Текшерилген мазмун',
    intro:
      'Айрым таасирлер кеңири таралган жана убактылуу болушу мүмкүн. Башкалары көбүрөөк көңүл бурууну талап кылат. Адаттагы реакцияларды баалоого татыктуу белгилерден айырмалоону үйрөнүңүз.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Кеңири таралган, жеңил таасирлер',
      'Дененин ыңгайлашуу мезгили',
      'Эмне өзгөрөрүн байкоо',
      'Медициналык кеңешти качан сурап кайрылуу керек',
      'Тез медициналык жардамга качан кайрылуу керек',
      'Негизги жыйынтыктар',
    ],
    body1:
      'Бирөө жаңы гормондук контрацепция ыкмасын баштаганда, денеге ыңгайлашуу үчүн бир аз убакыт керек болушу мүмкүн. Циклде, маанайда же физикалык ыңгайлуулукта кичинекей өзгөрүүлөр пайда болушу мүмкүн.',
    body2:
      'Бул таасирлер көбүнчө жеңил жана акырындап азайышы мүмкүн. Алардын болушу ыкма коркунучтуу же аны токтотуу керек дегенди автоматтык түрдө билдирбейт.',
    commonEffects: [
      {
        title: 'Майда кан кетүү',
        text: 'Туура эмес кан кетүү болушу мүмкүн, айрыкча жаңы ыкманын башталышында.',
      },
      {
        title: 'Көкүрөктүн сезгичтиги',
        text: 'Көкүрөктүн тартылуусу же сезгичтиги убактылуу сезилиши мүмкүн.',
      },
      {
        title: 'Маанай',
        text: 'Айрым адамдар маанайдын өзгөрүшүн же эмоционалдык сезгичтиктин жогорулашын байкашат.',
      },
      {
        title: 'Баш оору',
        text: 'Жеңил баш оору ыңгайлашуу мезгилинде болушу мүмкүн.',
      },
    ],
    body3:
      'Алгачкы бир нече жума же цикл мурун көнгөнүңүздөн башкача болушу мүмкүн. Дене жаңы гормондук тең салмактуулукка акырындап ыңгайлаша алат.',
    tip1Title: 'Билүү пайдалуу',
    tip1Text:
      'Ыкманы баштагандан көп өтпөй пайда болгон таасир убакыттын өтүшү менен байкоого татыйт. Эгер ал тынчсыздандырса же улана берсе, ден соолук сактоо адиси менен сүйлөшүңүз.',
    body4:
      'Бир циклден экинчисине кандай өзгөрөрүн жакшыраак көзөмөлдөө үчүн белгилерди колдонмоңузга жазып туруу пайдалуу болушу мүмкүн.',
    trackingTitle: 'Өнүгүүнү байкаңыз',
    trackingSubtitle: 'Бир нече көрсөткүч пайдалуу болушу мүмкүн',
    trackingLines: [
      'Белги пайда болгон күндү жазып коюңуз.',
      'Анын курчтугун жана узактыгын жазыңыз.',
      'Жакшырганын же начарлаганын байкаңыз.',
    ],
    body5:
      'Бардык белгилер контрацепция менен сөзсүз байланышкан эмес. Стресс, уйку, тамактануу, циклиңиз же башка дарылоолор да сезимиңизге таасир этиши мүмкүн.',
    body6:
      'Абалды түшүнүү үчүн өзүнчө алынган бир белгиден көрө жалпы контекстти карап көрүңүз.',
    worthMentioning: [
      'Айкын, улана берген маанай өзгөрүүлөрү',
      'Тынчсыздандырган либидонун төмөндөшү',
      '3 циклден ашык созулган туура эмес кан кетүү',
      'Тынчсыздандыра берген көңүл айлануу же баш оору',
    ],
    questionsTitle: 'Бир нече пайдалуу суроо',
    questions: [
      'Бул белгилер канча убакыттан бери уланууда?',
      'Алар контрацепция ыкмасын баштагандан же өзгөрткөндөн кийин пайда болдубу?',
      'Алар жеңилби, тынчсыздандырабы же сиз үчүн чындап адаттан тышпы?',
      'Алар убакыттын өтүшү менен жакшырып жатабы же жыштап жатабы?',
    ],
    body7:
      'Белги шашылыш болбосо да, ал тынчсыздандырса, улана берсе же жашоо сапатыңызга чындап таасир этсе, аны талкуулоого татыйт.',
    infoTitle: 'Кеңеш алган жакшы болушу мүмкүн, эгер…',
    infoText:
      'белгилер улана берсе, олуттуураак болсо же нормалдуу жашоого тоскоол болсо.',
    body8:
      'Дарыгер, акушерка же фармацевт белгилер колдонуп жаткан ыкма менен байланыштуу болушу мүмкүнбү жана аны тууралоо керекпи — аны аныктоого жардам бере алат.',
    body9:
      'Айрым белгилер адаттан тыш жана тез медициналык баа берүүнү талап кылат. Алар сөзсүз татаалдашуу бар дегенди билдирбейт, бирок аларга көңүл бурбай коюуга болбойт.',
    alertTitle: 'Тез медициналык жардамга кайрылыңыз',
    alertIntro: 'Атап айтканда, төмөнкүлөрдү сезсеңиз, тез медициналык кеңеш сураңыз:',
    urgentSigns: [
      'Олуттуу же адаттан тыш көкүрөк оорусу',
      'Капыстан дем алуудагы кыйынчылык',
      'Буттагы адаттан тыш шишик же оору',
      'Капыстан, абдан күчтүү же адаттан тыш баш оору',
      'Көрүүдө, сүйлөөдө же күчтө капыстан кыйынчылык',
    ],
    emergencyTitle: 'Оор абал болгон учурда',
    emergencyText:
      'Эгер белгилер капыстан, абдан катуу болсо же дем алуудагы кыйынчылык, эсин жоготуп жаткандай сезим же башка олуттуу белги менен коштолсо, шашылыш медициналык жардам сураңыз.',
    summaryTitle: 'Эң негизгиси',
    summaryItems: [
      'Айрым таасирлер жаңы гормондук контрацепция ыкмасынын башталышында пайда болушу мүмкүн.',
      'Көптөгөн таасирлер убактылуу жана убакыттын өтүшү менен азайышы мүмкүн.',
      'Тынчсыздандырган же улана берген белгини адис менен талкуулоого татыйт.',
      'Айрым адаттан тыш белгилер тез медициналык кеңешти талап кылат.',
    ],
    finalTipTitle: 'Негизги жыйынтык',
    finalTipText:
      'Денеңизди угуу ыкманы дароо токтотуу дегенди сөзсүз билдирбейт. Сезгениңизди жазып коюңуз, анын кандай өнүгөрүн байкаңыз жана белги тынчсыздандырганда кеңеш сураңыз.',
    disclaimerText:
      'Бул макала маалымат берүү максатында арналган жана жекелештирилген медициналык кеңешти алмаштырбайт. Олуттуу же адаттан тыш белгиңиз болсо, ден соолук сактоо адисинен кеңеш сураңыз.',
    shareMessage: 'Мүмкүн болгон терс таасирлерди таануу — AWA',
  },
  tk: {
    badge: 'GAÝRY TÄSIRLER',
    title: 'Mümkin gaýry täsirleri\ntanamak',
    metaDuration: '8 min okamak',
    metaType: 'Makala',
    metaLevel: 'Orta',
    metaValidated: 'Barlanan mazmun',
    intro:
      'Käbir täsirler umumy we wagtlaýyn bolup biler. Beýlekiler has köp üns talap edýär. Adaty reaksiýalar bilen bahalandyrylmaly alamatlaryň arasyndaky tapawudy aýyrmagy öwreniň.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Umumy, ýeňil täsirler',
      'Bedeniň uýgunlaşma döwri',
      'Nämäniň üýtgeýändigini synlamak',
      'Lukmançylyk maslahatyny haçan soramaly',
      'Lukmançylyk kömegini çalt haçan soramaly',
      'Esasy netijeler',
    ],
    body1:
      'Kimdir biri täze gormonal göwrelilikden goranyş usulyny başlanda, bedeniň uýgunlaşmak üçin birneme wagta mätäç bolmagy mümkin. Sikliňizde, keýbiňizde ýa-da fiziki rahatlygyňyzda kiçijik üýtgeşmeler peýda bolup biler.',
    body2:
      'Bu täsirler köplenç ýeňil we ýuwaş-ýuwaşdan azalyp biler. Olaryň barlygy usulyň howply ýa-da bes edilmelidigini awtomatiki aňlatmaýar.',
    commonEffects: [
      {
        title: 'Ownuk gan akma',
        text: 'Düzgünsiz gan akma, aýratyn-da täze usulyň başynda, bolup biler.',
      },
      {
        title: 'Döşüň duýgurlygy',
        text: 'Döşüň gysylmasy ýa-da duýgurlygy wagtlaýyn duýulyp biler.',
      },
      {
        title: 'Keýp',
        text: 'Käbir adamlar keýp üýtgeşmelerini ýa-da artan duýgusal duýgurlygy görýär.',
      },
      {
        title: 'Kelle agyrylary',
        text: 'Uýgunlaşma döwründe ýeňil kelle agyrylary bolup biler.',
      },
    ],
    body3:
      'Ilkinji birnäçe hepde ýa-da sikller öň ulanan zatlaryňyzdan tapawutly bolup biler. Beden täze gormonal deňagramlylyga ýuwaş-ýuwaşdan uýgunlaşyp biler.',
    tip1Title: 'Bilmek peýdaly',
    tip1Text:
      'Usuly başlanyňyzdan gysga wagt soň peýda bolýan täsir wagtyň geçmegi bilen synlamaga mynasyp. Ol biynjalyk edýän ýa-da dowam edýän bolsa, saglyk hünärmeni bilen gürleşiň.',
    body4:
      'Alamatlaryň sikldan sika nähili üýtgeýändigini has gowy yzarlamak üçin olary programmaňyzda ýazyp goýmak peýdaly bolup biler.',
    trackingTitle: 'Üýtgeşmeleri yzarlaň',
    trackingSubtitle: 'Käbir bellikler peýdaly bolup biler',
    trackingLines: [
      'Alamatyň peýda bolan senesini belläň.',
      'Onuň güýçlüligini we dowamlylygyny ýazyň.',
      'Onuň gowulaşýandygyny ýa-da erbetleşýändigini synlaň.',
    ],
    body5:
      'Ähli alamatlar göwrelilikden goranyş bilen hökman baglanyşykly däl. Stres, uky, iýmitlenmek, sikliňiz ýa-da beýleki bejergiler hem özüňizi nähili duýýandygyňyza täsir edip biler.',
    body6:
      'Ýagdaýy düşünmek üçin ýeke alamata däl, umumy kontekste seretmäge synanyşyň.',
    worthMentioning: [
      'Aýdyň, dowamly keýp üýtgeşmeleri',
      'Sizi biynjalyk edýän libidonyň peselmegi',
      '3 sikldan köp dowam edýän düzgünsiz gan akma',
      'Biynjalyk edýän ýagdaýda galýan ýüregiň bulanmasy ýa-da kelle agyrylary',
    ],
    questionsTitle: 'Birnäçe peýdaly sorag',
    questions: [
      'Bu alamatlar näçe wagt bäri dowam edýär?',
      'Olar göwrelilikden goranyş usulyny başlandan ýa-da üýtgedeninden soň peýda boldumy?',
      'Olar ýeňilmi, biynjalyk edýärmi ýa-da siz üçin hakykatdan adaty däl?',
      'Olar wagtyň geçmegi bilen gowulaşýarmy ýa-da ýygylaýarmy?',
    ],
    body7:
      'Alamat ýiti bolmasa-da, ol biynjalyk edýän, dowam edýän ýa-da ýaşaýyş hiline hakykatdan täsir edýän bolsa, onuň barada gürleşmek mynasyp bolup biler.',
    infoTitle: 'Maslahat almak mynasyp bolup biler eger…',
    infoText:
      'alamatlar dowam etse, möhümleşse ýa-da adaty ýaşamaga päsgel berse.',
    body8:
      'Lukman, akuşerka ýa-da derman satyjy alamatlaryň ulanýan usulyňyz bilen baglanyşykly bolup biljekdigini we sazlanmalydygyny kesgitlemäge kömek edip biler.',
    body9:
      'Käbir alamatlar adaty däl we çalt lukmançylyk bahalandyrmany talap edýär. Olar çylşyrymlylygyň barlygyny hökman aňlatmaýar, ýöne äsgermezlik edilmeli däl.',
    alertTitle: 'Çalt lukmançylyk kömegine ýüz tutuň',
    alertIntro: 'Aýratyn-da şulary başdan geçirseňiz, çalt lukmançylyk maslahatyny soraň:',
    urgentSigns: [
      'Möhüm ýa-da adaty däl döş agyrysy',
      'Ýiti dem alyş kynçylygy',
      'Aýakda adaty däl çişme ýa-da agyry',
      'Ýiti, gaty güýçli ýa-da adaty däl kelle agyrysy',
      'Görüşde, gürlemekde ýa-da güýçde ýiti kynçylyk',
    ],
    emergencyTitle: 'Agyr ýagdaýda',
    emergencyText:
      'Alamatlar ýiti, gaty agyr bolsa ýa-da dem alyş kynçylygy, huşdan gitmek duýgusy ýa-da başga agyr alamat bilen bile gelse, gyssagly lukmançylyk kömegini soraň.',
    summaryTitle: 'Esasy zatlar',
    summaryItems: [
      'Täze gormonal göwrelilikden goranyş usulynyň başynda käbir täsirler peýda bolup biler.',
      'Köp täsir wagtlaýyn we wagtyň geçmegi bilen azalyp biler.',
      'Biynjalyk edýän ýa-da dowamly alamat hünärmen bilen gürleşmäge mynasyp.',
      'Käbir adaty däl alamatlar çalt lukmançylyk maslahatyny talap edýär.',
    ],
    finalTipTitle: 'Esasy netije',
    finalTipText:
      'Bedeniňize gulak asmak usuly derrew bes etmegi hökman aňlatmaýar. Duýýanlaryňyzy belläň, onuň nähili üýtgeýändigini synlaň we alamat sizi alada goýanda maslahat soraň.',
    disclaimerText:
      'Bu makala maglumat maksatly we şahsylaşdyrylan lukmançylyk maslahatyny çalyşmaýar. Möhüm ýa-da adaty däl alamatyňyz bar bolsa, saglyk hünärmeninden maslahat soraň.',
    shareMessage: 'Mümkin gaýry täsirleri tanamak — AWA',
  },
  ms: {
    badge: 'KESAN SAMPINGAN',
    title: 'Mengenali kemungkinan\nkesan sampingan',
    metaDuration: '8 min bacaan',
    metaType: 'Artikel',
    metaLevel: 'Pertengahan',
    metaValidated: 'Kandungan disemak',
    intro:
      'Sesetengah kesan boleh lazim dan bersifat sementara. Yang lain memerlukan lebih perhatian. Belajar membezakan antara tindak balas biasa dan tanda yang perlu dinilai.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Kesan yang lazim dan ringan',
      'Tempoh penyesuaian tubuh',
      'Memerhati apa yang berubah',
      'Bila untuk mendapatkan nasihat perubatan',
      'Bila untuk mendapatkan rawatan dengan segera',
      'Perkara penting untuk diingat',
    ],
    body1:
      'Apabila seseorang mula menggunakan kaedah kontraseptif hormon yang baharu, tubuh mungkin memerlukan sedikit masa untuk menyesuaikan diri. Perubahan kecil boleh muncul pada kitaran, emosi atau keselesaan fizikal.',
    body2:
      'Kesan ini selalunya ringan dan mungkin beransur-ansur berkurangan. Kehadirannya tidak secara automatik bermakna kaedah itu berbahaya atau perlu dihentikan.',
    commonEffects: [
      {
        title: 'Pendarahan ringan',
        text: 'Pendarahan tidak teratur boleh berlaku, terutamanya pada permulaan kaedah baharu.',
      },
      {
        title: 'Payudara sakit',
        text: 'Rasa tegang atau sakit pada payudara mungkin dirasai buat sementara waktu.',
      },
      {
        title: 'Emosi',
        text: 'Sesetengah orang perasan perubahan emosi atau kepekaan emosi yang meningkat.',
      },
      {
        title: 'Sakit kepala',
        text: 'Sakit kepala ringan boleh berlaku semasa tempoh penyesuaian.',
      },
    ],
    body3:
      'Beberapa minggu atau kitaran pertama mungkin berbeza daripada apa yang anda biasa alami sebelum ini. Tubuh boleh menyesuaikan diri secara beransur-ansur dengan keseimbangan hormon yang baharu.',
    tip1Title: 'Elok diketahui',
    tip1Text:
      'Kesan yang muncul tidak lama selepas memulakan sesuatu kaedah wajar diperhatikan dari semasa ke semasa. Jika ia menjadi mengganggu atau berterusan, berbincanglah dengan pengamal penjagaan kesihatan.',
    body4:
      'Ia boleh membantu untuk merekodkan simptom dalam aplikasi anda bagi menjejaki bagaimana ia berubah dari satu kitaran ke kitaran berikutnya dengan lebih baik.',
    trackingTitle: 'Jejaki bagaimana perkara berkembang',
    trackingSubtitle: 'Beberapa penanda boleh membantu',
    trackingLines: [
      'Catat tarikh simptom itu muncul.',
      'Rekodkan keamatan dan tempohnya.',
      'Perhatikan sama ada ia bertambah baik atau bertambah teruk.',
    ],
    body5:
      'Tidak semua simptom semestinya berkaitan dengan kontraseptif. Tekanan, tidur, pemakanan, kitaran anda atau rawatan lain juga boleh mempengaruhi perasaan anda.',
    body6:
      'Untuk memahami keadaan, cuba lihat konteks keseluruhan dan bukan satu simptom secara terpencil.',
    worthMentioning: [
      'Perubahan emosi yang ketara dan berterusan',
      'Penurunan libido yang mengganggu anda',
      'Pendarahan tidak teratur yang berlangsung lebih daripada 3 kitaran',
      'Loya atau sakit kepala yang kekal mengganggu',
    ],
    questionsTitle: 'Beberapa soalan berguna',
    questions: [
      'Sudah berapa lama simptom ini berlaku?',
      'Adakah ia muncul selepas memulakan atau menukar kaedah kontraseptif?',
      'Adakah ia ringan, mengganggu atau benar-benar luar biasa bagi anda?',
      'Adakah ia bertambah baik dari semasa ke semasa atau menjadi lebih kerap?',
    ],
    body7:
      'Walaupun simptom tidak mendesak, ia wajar dibincangkan jika ia menjadi mengganggu, berterusan atau benar-benar menjejaskan kualiti hidup anda.',
    infoTitle: 'Mungkin wajar mendapatkan nasihat jika…',
    infoText:
      'simptom berterusan, menjadi lebih ketara atau menghalang anda hidup seperti biasa.',
    body8:
      'Doktor, bidan atau ahli farmasi boleh membantu anda menentukan sama ada simptom itu mungkin berkaitan dengan kaedah yang anda gunakan dan sama ada ia perlu dilaraskan.',
    body9:
      'Sesetengah tanda adalah luar biasa dan memerlukan penilaian perubatan segera. Ia tidak semestinya bermakna komplikasi hadir, tetapi ia tidak patut diabaikan.',
    alertTitle: 'Dapatkan rawatan dengan segera',
    alertIntro: 'Dapatkan nasihat perubatan dengan segera jika anda mengalami, terutamanya:',
    urgentSigns: [
      'Sakit dada yang ketara atau luar biasa',
      'Kesukaran bernafas secara tiba-tiba',
      'Bengkak atau sakit yang luar biasa pada kaki',
      'Sakit kepala yang tiba-tiba, sangat kuat atau luar biasa',
      'Masalah penglihatan, pertuturan atau kekuatan secara tiba-tiba',
    ],
    emergencyTitle: 'Dalam keadaan yang teruk',
    emergencyText:
      'Jika simptom berlaku secara tiba-tiba, sangat teruk, atau disertai kesukaran bernafas, rasa hendak pengsan atau tanda serius yang lain, dapatkan bantuan perubatan segera.',
    summaryTitle: 'Perkara penting',
    summaryItems: [
      'Sesetengah kesan boleh muncul pada permulaan kaedah kontraseptif hormon yang baharu.',
      'Banyak kesan bersifat sementara dan mungkin berkurangan dari semasa ke semasa.',
      'Simptom yang mengganggu atau berterusan wajar dibincangkan dengan pengamal profesional.',
      'Sesetengah tanda luar biasa memerlukan nasihat perubatan segera.',
    ],
    finalTipTitle: 'Perkara penting untuk diingat',
    finalTipText:
      'Mendengar tubuh anda tidak semestinya bermakna menghentikan sesuatu kaedah serta-merta. Catat apa yang anda rasa, perhatikan bagaimana ia berkembang, dan mintalah nasihat bila-bila masa sesuatu simptom membimbangkan anda.',
    disclaimerText:
      'Artikel ini bertujuan untuk maklumat dan tidak menggantikan nasihat perubatan yang diperibadikan. Jika anda mempunyai simptom yang ketara atau luar biasa, dapatkan nasihat daripada pengamal penjagaan kesihatan.',
    shareMessage: 'Mengenali kemungkinan kesan sampingan — AWA',
  },
  so: {
    badge: 'SAAMEYN DHINAC',
    title: 'Aqoonsiga saameynta\ndhinac ee suurtagalka ah',
    metaDuration: '8 daq akhris',
    metaType: 'Maqaal',
    metaLevel: 'Dhexdhexaad',
    metaValidated: 'Macluumaad la dib-u-eegay',
    intro:
      'Saameyn qaar ayaa noqon karta mid caadi ah oo ku meel gaar ah. Kuwa kale waxay u baahan yihiin feejignaan dheeraad ah. Baro kala saaridda falcelinnada caadiga ah iyo calaamadaha mudan in la qiimeeyo.',
    contentsTitle: 'Maqaalkan dhexdiisa',
    topics: [
      'Saameyn caadi ah, khafiif ah',
      'Muddada la qabsiga jidhka',
      'Indho-indheynta waxa isbeddelaya',
      'Goorta talo caafimaad la raadsado',
      'Goorta daryeel dhakhso ah la raadsado',
      'Qodobbada muhiimka ah',
    ],
    body1:
      'Marka qof bilaabo hab cusub oo ka hortag uur hormoon ah, jidhku wuxuu u baahan karaa waqti si uu isu hagaajiyo. Isbeddelo yar ayaa ka soo bixi kara wareegga, niyadda, ama raaxada jidheed.',
    body2:
      'Saameyntani inta badan waa khafiif wayna yaraan kartaa tartiib. Jiritaankoodu macnaheedu maaha si toos ah in habku khatar yahay ama in loo baahan yahay in la joojiyo.',
    commonEffects: [
      {
        title: 'Dhiigbax yar',
        text: 'Dhiigbax aan joogto ahayn ayaa dhici kara, gaar ahaan bilowga hab cusub.',
      },
      {
        title: 'Xanuunka naasaha',
        text: 'Cufnaan ama xanuun naasaha ah ayaa ku meel gaar lagu dareemi karaa.',
      },
      {
        title: 'Niyad',
        text: 'Dadka qaar waxay ogaadaan isbeddello niyadeed ama dareen-xanaaq kordhay.',
      },
      {
        title: 'Madax-xanuun',
        text: 'Madax-xanuun khafiif ah ayaa dhici kara inta muddada la qabsigu socoto.',
      },
    ],
    body3:
      'Dhowr toddobaad ama wareeg ee ugu horreeya waxay noqon karaan kuwo ka duwan waxa aad hore ugu qabsatay. Jidhku wuu isu hagaajin karaa tartiib dheelitirka hormoonka cusub.',
    tip1Title: 'Waxtar leh in la ogaado',
    tip1Text:
      'Saameyn soo muuqata wax yar ka dib bilowga hab waa mudan in waqti ka dib la indho-indheeyo. Haddii ay noqoto mid dhib leh ama ay sii socoto, la hadal xirfadle caafimaad.',
    body4:
      'Waxay faa’iido yeelan kartaa in astaamaha laga diiwaangeliyo app-kaaga si aad si wanaagsan u la socoto sida ay u isbeddelaan wareeg ilaa wareeg.',
    trackingTitle: 'La soco isbeddelka',
    trackingSubtitle: 'Dhowr calaamadood ayaa faa’iido leh',
    trackingLines: [
      'Xus taariikhda astaanta soo muuqatay.',
      'Diiwaangeli xooggeeda iyo muddadeeda.',
      'Indho-indheeyo haddii ay hagaagayso ama xumaanayso.',
    ],
    body5:
      'Astaamaha dhammaantood lagama maarmaan ahan inay la xiriiraan ka hortagga uurka. Walaac, hurdo, cunto, wareeggaaga, ama daaweynno kale ayaa sidoo kale saameyn kara sida aad dareemayso.',
    body6:
      'Si aad u fahanto xaaladda, isku day inaad eegto xaaladda guud halkii aad ka eegi lahayd hal astaan oo go’doon ah.',
    worthMentioning: [
      'Isbeddelo niyadeed oo muuqda, sii socda',
      'Hoos u dhac rabitaanka galmada oo ku dhibaya',
      'Dhiigbax aan joogto ahayn oo socda in ka badan 3 wareeg',
      'Lallabo ama madax-xanuun weli dhib leh',
    ],
    questionsTitle: 'Dhowr su’aalood oo faa’iido leh',
    questions: [
      'Intee in le’eg ayay astaamahani jireen?',
      'Ma soo muuqdeen ka dib bilowga ama beddelka hab ka hortag uur?',
      'Ma khafiif, dhib leh, mise runtii aan caadi ahayn bay kuu yihiin?',
      'Ma hagaagayaan waqti ka dib ama way sii soo noqnoqdaan?',
    ],
    body7:
      'Xataa marka astaan aysan degdeg ahayn, waxay mudan kartaa in laga hadlo haddii ay noqoto mid dhib leh, sii socoto, ama runtii saameyso tayada nolosha.',
    infoTitle: 'Waxay mudan kartaa in talo la raadsado haddii…',
    infoText:
      'astaamuhu sii socdaan, sii weynaadaan, ama ku joojiyaan inaad caadi u noolaato.',
    body8:
      'Dhakhtar, umulis, ama farmasiiste ayaa kaa caawin kara go’aaminta haddii astaamuhu la xiriiri karaan habka aad isticmaalayso iyo haddii loo baahan yahay in la hagaajiyo.',
    body9:
      'Calaamado qaar ma aha kuwo caadi ah oo waxay u baahan yihiin qiimeyn caafimaad oo degdeg ah. Lagama maarmaan ahan inay muujiyaan in dhibaato jirto, laakiin waa in aan la iska indho tirin.',
    alertTitle: 'Raadi daryeel dhakhso ah',
    alertIntro: 'Si dhakhso ah talo caafimaad u raadso haddii aad la kulanto, gaar ahaan:',
    urgentSigns: [
      'Xanuun laab oo weyn ama aan caadi ahayn',
      'Dhib neefsasho oo lama filaan ah',
      'Barar ama xanuun aan caadi ahayn oo hal lug ah',
      'Madax-xanuun lama filaan ah, aad u xoog badan, ama aan caadi ahayn',
      'Dhib lama filaan ah oo araga, hadalka, ama xoogga ah',
    ],
    emergencyTitle: 'Haddii xaalad daran dhacdo',
    emergencyText:
      'Haddii astaamuhu yihiin kuwo lama filaan ah, aad u daran, ama ay la socdaan dhib neefsasho, dareenka suuxdin, ama calaamad kale oo daran, raadso caawimaad caafimaad oo degdeg ah.',
    summaryTitle: 'Waxa muhiimka ah',
    summaryItems: [
      'Saameyn qaar ayaa soo bixi kara bilowga hab cusub oo ka hortag uur hormoon ah.',
      'Saameyn badan waa ku meel gaar wayna yaraan kartaa waqti ka dib.',
      'Astaan dhib leh ama sii socota waxay mudan tahay in lala hadlo xirfadle.',
      'Calaamado aan caadi ahayn qaar waxay u baahan yihiin talo caafimaad oo degdeg ah.',
    ],
    finalTipTitle: 'Qodob muhiim ah',
    finalTipText:
      'U dhegaysiga jidhkaaga macnaheedu maaha lagama maarmaan inaad isla markiiba joojiso hab. Xus waxa aad dareemayso, indho-indheeyo sida ay u isbeddelaan, oo weydiiso talo markasta oo astaan ku walaaciso.',
    disclaimerText:
      'Maqaalkan waxaa loogu talagalay macluumaad mana bedelo talo caafimaad oo shakhsi ah. Haddii aad leedahay astaan weyn ama aan caadi ahayn, talo ka raadso xirfadle caafimaad.',
    shareMessage: 'Aqoonsiga saameynta dhinac ee suurtagalka ah — AWA',
  },
  sw: {
    badge: 'MADHARA YA PEMBENI',
    title: 'Kutambua madhara\nya pembeni yanayowezekana',
    metaDuration: 'Dakika 8 za kusoma',
    metaType: 'Makala',
    metaLevel: 'Wastani',
    metaValidated: 'Maudhui yaliyokaguliwa',
    intro:
      'Baadhi ya athari zinaweza kuwa za kawaida na za muda. Nyingine zinahitaji uangalizi zaidi. Jifunze kutofautisha kati ya miitikio ya kawaida na dalili zinazopaswa kutathminiwa.',
    contentsTitle: 'Katika makala hii',
    topics: [
      'Athari za kawaida na hafifu',
      'Kipindi cha mwili kujirekebisha',
      'Kuchunguza kinachobadilika',
      'Wakati wa kutafuta ushauri wa kitabibu',
      'Wakati wa kutafuta huduma haraka',
      'Mambo muhimu ya kukumbuka',
    ],
    body1:
      'Mtu anapoanza njia mpya ya uzazi wa mpango wa homoni, mwili unaweza kuhitaji muda wa kujirekebisha. Mabadiliko madogo yanaweza kuonekana katika mzunguko, hali ya moyo, au faraja ya mwili.',
    body2:
      'Athari hizi mara nyingi ni hafifu na zinaweza kupungua polepole. Kuwepo kwake haimaanishi moja kwa moja kwamba njia ni hatari au kwamba inahitaji kuachwa.',
    commonEffects: [
      {
        title: 'Kutokwa damu kidogo',
        text: 'Kutokwa damu kusiko kwa mpangilio kunaweza kutokea, hasa mwanzoni mwa njia mpya.',
      },
      {
        title: 'Maumivu ya matiti',
        text: 'Kubana au maumivu ya matiti yanaweza kuhisiwa kwa muda.',
      },
      {
        title: 'Hali ya moyo',
        text: 'Baadhi ya watu huona mabadiliko ya hali ya moyo au unyeti ulioongezeka wa hisia.',
      },
      {
        title: 'Maumivu ya kichwa',
        text: 'Maumivu hafifu ya kichwa yanaweza kutokea wakati wa kipindi cha kujirekebisha.',
      },
    ],
    body3:
      'Wiki au mizunguko ya kwanza inaweza kuwa tofauti na uliyoizoea kabla. Mwili unaweza kujirekebisha polepole kwa usawa mpya wa homoni.',
    tip1Title: 'Vyema kujua',
    tip1Text:
      'Athari inayoonekana muda mfupi baada ya kuanza njia inastahili kufuatiliwa kadiri muda unavyopita. Ikiwa inakuwa ya kusumbua au inaendelea, zungumza na mtaalamu wa afya.',
    body4:
      'Inaweza kusaidia kurekodi dalili kwenye programu yako ili kufuatilia vizuri jinsi zinavyobadilika kutoka mzunguko mmoja hadi unaofuata.',
    trackingTitle: 'Fuatilia jinsi mambo yanavyobadilika',
    trackingSubtitle: 'Alama chache zinaweza kusaidia',
    trackingLines: [
      'Andika tarehe dalili ilipoonekana.',
      'Rekodi ukali wake na muda wake.',
      'Angalia kama inaimarika au inazidi kuwa mbaya.',
    ],
    body5:
      'Si dalili zote zinahusiana lazima na uzazi wa mpango. Msongo wa mawazo, usingizi, lishe, mzunguko wako, au matibabu mengine pia yanaweza kuathiri unavyojisikia.',
    body6:
      'Ili kuelewa hali, jaribu kuangalia muktadha wa jumla badala ya dalili moja iliyotengwa.',
    worthMentioning: [
      'Mabadiliko ya hali ya moyo yanayoonekana na ya kuendelea',
      'Kushuka kwa hamu ya tendo la ndoa kunakokusumbua',
      'Kutokwa damu kusiko kwa mpangilio kunakodumu zaidi ya mizunguko 3',
      'Kichefuchefu au maumivu ya kichwa yanayobaki kusumbua',
    ],
    questionsTitle: 'Maswali machache yenye manufaa',
    questions: [
      'Dalili hizi zimekuwepo kwa muda gani?',
      'Je, ziliibuka baada ya kuanza au kubadilisha njia ya uzazi wa mpango?',
      'Je, ni hafifu, za kusumbua, au zisizo za kawaida kweli kwako?',
      'Je, zinaimarika kadiri muda unavyopita au zinakuwa za mara kwa mara zaidi?',
    ],
    body7:
      'Hata dalili isipokuwa ya dharura, inaweza kufaa kuijadili ikiwa inakuwa ya kusumbua, inaendelea, au inaathiri kweli ubora wa maisha yako.',
    infoTitle: 'Huenda ikafaa kupata ushauri ikiwa…',
    infoText:
      'dalili zinaendelea, zinakuwa kubwa zaidi, au zinakuzuia kuishi kawaida.',
    body8:
      'Daktari, mkunga, au mfamasia anaweza kukusaidia kubaini kama dalili zinaweza kuhusiana na njia unayotumia na kama inahitaji kurekebishwa.',
    body9:
      'Dalili fulani si za kawaida na zinahitaji tathmini ya haraka ya kitabibu. Hazimaanishi lazima kuna tatizo, lakini hazipaswi kupuuzwa.',
    alertTitle: 'Tafuta huduma haraka',
    alertIntro: 'Tafuta ushauri wa kitabibu haraka ikiwa utapata, hasa:',
    urgentSigns: [
      'Maumivu makubwa au yasiyo ya kawaida ya kifua',
      'Ugumu wa ghafla wa kupumua',
      'Uvimbe au maumivu yasiyo ya kawaida kwenye mguu',
      'Maumivu ya kichwa ya ghafla, makali sana, au yasiyo ya kawaida',
      'Shida ya ghafla ya kuona, kuzungumza, au nguvu',
    ],
    emergencyTitle: 'Katika hali mbaya',
    emergencyText:
      'Ikiwa dalili ni za ghafla, kali sana, au zinaambatana na ugumu wa kupumua, kuhisi kuzimia, au dalili nyingine mbaya, tafuta msaada wa haraka wa kitabibu.',
    summaryTitle: 'Mambo ya msingi',
    summaryItems: [
      'Athari fulani zinaweza kuonekana mwanzoni mwa njia mpya ya uzazi wa mpango wa homoni.',
      'Athari nyingi ni za muda na zinaweza kupungua kadiri muda unavyopita.',
      'Dalili ya kusumbua au ya kuendelea inastahili kujadiliwa na mtaalamu.',
      'Dalili fulani zisizo za kawaida zinahitaji ushauri wa haraka wa kitabibu.',
    ],
    finalTipTitle: 'Jambo kuu la kukumbuka',
    finalTipText:
      'Kusikiliza mwili wako hakumaanishi lazima kuacha njia mara moja. Andika unachohisi, angalia jinsi kinavyobadilika, na uombe ushauri wakati wowote dalili inapokutia wasiwasi.',
    disclaimerText:
      'Makala hii imekusudiwa kwa madhumuni ya taarifa na haichukui nafasi ya ushauri wa kitabibu uliobinafsishwa. Ikiwa una dalili kubwa au isiyo ya kawaida, tafuta ushauri wa mtaalamu wa afya.',
    shareMessage: 'Kutambua madhara ya pembeni yanayowezekana — AWA',
  },
  kk: {
    badge: 'ЖАНАМА ӘСЕРЛЕР',
    title: 'Мүмкін жанама\nәсерлерді тану',
    metaDuration: '8 мин оқу',
    metaType: 'Мақала',
    metaLevel: 'Орташа',
    metaValidated: 'Тексерілген мазмұн',
    intro:
      'Кейбір әсерлер жиі және уақытша болуы мүмкін. Басқаларына көбірек назар аудару керек. Әдеттегі реакцияларды бағалауды қажет ететін белгілерден ажыратуды үйреніңіз.',
    contentsTitle: 'Осы мақалада',
    topics: [
      'Жиі, жеңіл әсерлер',
      'Дененің бейімделу кезеңі',
      'Не өзгеретінін бақылау',
      'Медициналық кеңесті қашан сұрау керек',
      'Жедел көмекке қашан жүгіну керек',
      'Негізгі қорытындылар',
    ],
    body1:
      'Адам гормондық контрацепцияның жаңа әдісін бастағанда, денеге бейімделуге біраз уақыт қажет болуы мүмкін. Циклде, көңіл-күйде немесе дене жайлылығында шағын өзгерістер пайда болуы мүмкін.',
    body2:
      'Бұл әсерлер көбіне жеңіл және біртіндеп азаюы мүмкін. Олардың болуы әдістің қауіпті екенін немесе тоқтату керек екенін автоматты түрде білдірмейді.',
    commonEffects: [
      {
        title: 'Шамалы қан кету',
        text: 'Тұрақсыз қан кету, әсіресе жаңа әдістің басында, болуы мүмкін.',
      },
      {
        title: 'Емшектің ауыруы',
        text: 'Емшектің керілуі немесе ауыруы уақытша сезілуі мүмкін.',
      },
      {
        title: 'Көңіл-күй',
        text: 'Кейбір адамдар көңіл-күйдің өзгеруін немесе эмоциялық сезімталдықтың артуын байқайды.',
      },
      {
        title: 'Бас ауыруы',
        text: 'Бейімделу кезеңінде жеңіл бас ауыруы пайда болуы мүмкін.',
      },
    ],
    body3:
      'Алғашқы апталар немесе циклдер бұрын үйренген жағдайыңыздан өзгеше болуы мүмкін. Дене жаңа гормондық тепе-теңдікке біртіндеп бейімделе алады.',
    tip1Title: 'Білуге тиісті',
    tip1Text:
      'Әдісті бастағаннан кейін көп ұзамай пайда болған әсер уақыт өте бақылауға тұрарлық. Ол мазаласа немесе сақталса, медицина маманымен сөйлесіңіз.',
    body4:
      'Белгілердің бір циклден екіншісіне қалай өзгеретінін жақсырақ бақылау үшін оларды қолданбаңызда тіркеу пайдалы болуы мүмкін.',
    trackingTitle: 'Өзгерісті бақылаңыз',
    trackingSubtitle: 'Бірнеше белгі пайдалы болуы мүмкін',
    trackingLines: [
      'Белгі пайда болған күнді жазып қойыңыз.',
      'Оның қарқындылығы мен ұзақтығын тіркеңіз.',
      'Жақсарып немесе нашарлап жатқанын қараңыз.',
    ],
    body5:
      'Барлық белгілер міндетті түрде контрацепциямен байланысты емес. Күйзеліс, ұйқы, тамақтану, циклыңыз немесе басқа емдеулер де сезінуіңізге әсер етуі мүмкін.',
    body6:
      'Жағдайды түсіну үшін бір оқшау белгіге емес, жалпы контекстке қарауға тырысыңыз.',
    worthMentioning: [
      'Айқын, тұрақты көңіл-күй өзгерістері',
      'Сізді мазалайтын либидоның төмендеуі',
      '3 циклден астам созылатын тұрақсыз қан кету',
      'Мазалауды жалғастыратын жүрек айну немесе бас ауыруы',
    ],
    questionsTitle: 'Бірнеше пайдалы сұрақ',
    questions: [
      'Бұл белгілер қанша уақыттан бері бар?',
      'Олар контрацепция әдісін бастағаннан немесе өзгерткеннен кейін пайда болды ма?',
      'Олар жеңіл, мазалайтын немесе сіз үшін шынымен әдеттен тыс па?',
      'Олар уақыт өте жақсарып жатыр ма, әлде жиілеп жатыр ма?',
    ],
    body7:
      'Белгі шұғыл болмаса да, ол мазаласа, сақталса немесе өмір сапасына шынымен әсер етсе, оны талқылаған жөн.',
    infoTitle: 'Кеңес алған жөн болуы мүмкін, егер…',
    infoText:
      'белгілер сақталса, күшейсе немесе қалыпты өмір сүруге кедергі келтірсе.',
    body8:
      'Дәрігер, акушер немесе дәрігер-фармацевт белгілердің қолданып жүрген әдісіңізбен байланысты болуы мүмкін екенін және оны түзету керек пе екенін анықтауға көмектесе алады.',
    body9:
      'Кейбір белгілер әдеттен тыс және жедел медициналық бағалауды қажет етеді. Олар міндетті түрде асқыну бар дегенді білдірмейді, бірақ оларды елемеуге болмайды.',
    alertTitle: 'Дереу көмекке жүгініңіз',
    alertIntro: 'Мына жағдайларда, атап айтқанда, медициналық кеңесті тез іздеңіз:',
    urgentSigns: [
      'Айтарлықтай немесе әдеттен тыс кеуде ауыруы',
      'Кенеттен тыныс алудың қиындауы',
      'Аяқтағы әдеттен тыс ісіну немесе ауыру',
      'Кенеттен болған, өте қатты немесе әдеттен тыс бас ауыруы',
      'Көру, сөйлеу немесе күштегі кенеттен проблема',
    ],
    emergencyTitle: 'Ауыр жағдай болғанда',
    emergencyText:
      'Белгілер кенеттен, өте қатты болса немесе тыныс алу қиындығымен, талу сезімімен немесе басқа ауыр белгімен бірге жүрсе, шұғыл медициналық көмекке жүгініңіз.',
    summaryTitle: 'Негізгі нәрселер',
    summaryItems: [
      'Гормондық контрацепцияның жаңа әдісін бастағанда кейбір әсерлер пайда болуы мүмкін.',
      'Көптеген әсерлер уақытша және уақыт өте азаюы мүмкін.',
      'Мазалайтын немесе тұрақты белгіні маманмен талқылаған жөн.',
      'Кейбір әдеттен тыс белгілер жедел медициналық кеңесті қажет етеді.',
    ],
    finalTipTitle: 'Негізгі қорытынды',
    finalTipText:
      'Денеңізді тыңдау әдісті бірден тоқтатуды міндетті түрде білдірмейді. Сезінгеніңізді жазып қойыңыз, оның қалай дамитынын бақылаңыз және белгі алаңдатқан сайын кеңес сұраңыз.',
    disclaimerText:
      'Бұл мақала ақпараттық мақсатқа арналған және жекелендірілген медициналық кеңестің орнын баспайды. Айтарлықтай немесе әдеттен тыс белгіңіз болса, медицина маманынан кеңес сұраңыз.',
    shareMessage: 'Мүмкін жанама әсерлерді тану — AWA',
  },
  wo: {
    badge: 'LU ÑUY GIS GINNAAW',
    title: 'Xam lu ñuy mën\na gis ginnaaw',
    metaDuration: '8 simili jàng',
    metaType: 'Bind',
    metaLevel: 'Digg-dóomu',
    metaValidated: 'Mbind bu ñu seetlu',
    intro:
      'Yenn njeexital mën nañu bari te gàtt. Yeneen soxla teg bu gëna bari. Jàng séddale tontu yu cosaan ak màndarga yu war a seetlu.',
    contentsTitle: 'Ci bind bii',
    topics: [
      'Njeexital yu bari, yu neex',
      'Diirub bokk bu yaram',
      'Teg li di soppiku',
      'Kañ ngay seet ndigalu doktoor',
      'Kañ ngay seet dimbali ci gaaw',
      'Li am solo',
    ],
    body1:
      'Bu ñu tàmbalee benn anamu ŋàbbal ëmb bu hormon bu bees, yaram bi mën na soxla jamono ngir bokk. Soppi yu ndaw mën nañu feeñ ci wërsëg, xol walla neex ci yaram.',
    body2:
      'Njeexital yii daa neex te mën nañu wàññiku tuuti-tuuti. Seen am du tekki saa su ne ne anam bi dafa bon walla war na ñu ko taxawal.',
    commonEffects: [
      {
        title: 'Deret bu ndaw',
        text: 'Deret bu jubul mën na am, lool ci tàmbalig benn anam bu bees.',
      },
      {
        title: 'Metit ci nàmm',
        text: 'Nàmm yu diis walla yu metti mën nañu feeñ ci diir bu gàtt.',
      },
      {
        title: 'Xol',
        text: 'Yenn nit dañuy gis soppi ci xol walla nooy bu yokku.',
      },
      {
        title: 'Bopp bu metti',
        text: 'Bopp bu neex mën na feeñ ci jamonoy bokk.',
      },
    ],
    body3:
      'Ayu-bés walla wërsëg yu njëkk mën nañu wuute ak li nga amoon balaa. Yaram bi mën na bokk ak jubluñu hormon bu bees tuuti-tuuti.',
    tip1Title: 'Lu baax a xam',
    tip1Text:
      'Benn njeexital bu feeñ ci gaaw ginnaaw tàmbalig anam bi am solo na ñu ko teg ci jamono. Bu mu tiital walla di sax, wax ak benn liggéeykatu wér.',
    body4:
      'Mën na dimbli nga bind màndarga yi ci sa appli ngir gën a topp naka ñuy soppiku ci wërsëg ak wërsëg.',
    trackingTitle: 'Teg li di soppiku',
    trackingSubtitle: 'Yenn màndarga mën nañu am njariñ',
    trackingLines: [
      'Bind bési bi màndarga bi feeñ.',
      'Bind dayoom ak diiram.',
      'Seetlu ndax mu ngi gën a baax walla gën a bon.',
    ],
    body5:
      'Màndarga yépp duñu jëm saa su ne ci ŋàbbal ëmb. Coono, nelaw, lekk, sa wërsëg walla yeneen garab mën nañu jëm itam ci naka nga di dégg.',
    body6:
      'Ngir xam mbir bi, jéem seet ni mu mel ci biir, du benn màndarga bu neen rekk.',
    worthMentioning: [
      'Soppi yu xol yu leer, yu sax',
      'Wàññiku bëgg-bëgg bu tiis',
      'Deret bu jubul bu yàgg ci kaw 3 wërsëg',
      'Dundu xol walla bopp bu metti bu kontine di tiis',
    ],
    questionsTitle: 'Yenn laaj yu am njariñ',
    questions: [
      'Bu yàgg la màndarga yii am?',
      'Dañu feeñ ginnaaw tàmbali walla soppi benn anam bu ŋàbbal ëmb?',
      'Neex nañu, tiis nañu walla cosaanul dëgg ngir yaw?',
      'Dañuy wér ci jamono walla di gën a bari?',
    ],
    body7:
      'Lu mu mën a doon benn màndarga bu amul gaaw, baax na ñu ko waxtaan bu mu tiis, bu mu sax walla bu mu ñaawal dund bu bees.',
    infoTitle: 'Mën na baax nga seet ndigal bu…',
    infoText:
      'màndarga yi sax, gën a bari walla tee nga dund ni cosaan.',
    body8:
      'Benn doktoor, ndey-jur walla farmasiyen mën na dimbli nga xam ndax màndarga yi mën nañu jëm ci anam bi nga di jëfandikoo te ndax war na ñu ko defar.',
    body9:
      'Yenn màndarga cosaanul te soxla seetlu bu gaaw bu doktoor. Duñu tekki saa su ne ne am na jafe-jafe, waaye bañ a bàyyi leen.',
    alertTitle: 'Seet dimbali ci gaaw',
    alertIntro: 'Seet ndigalu doktoor ci gaaw bu nga gisee, lool:',
    urgentSigns: [
      'Metit ci dënn bu am solo walla bu cosaanul',
      'Jafe ci noppiku ci gaaw',
      'Tuuru walla metit bu cosaanul ci benn tànk',
      'Bopp bu metti lool, bu gaaw walla bu cosaanul',
      'Jafe-jafe bu gaaw ci gis, ci wax walla ci doole',
    ],
    emergencyTitle: 'Bu mbir bi metti',
    emergencyText:
      'Bu màndarga yi gaaw, metti lool walla ànd ak jafe ci noppiku, dégg ne dinga ŋàbbu walla beneen màndarga bu metti, seet dimbali bu gaaw.',
    summaryTitle: 'Li am solo',
    summaryItems: [
      'Yenn njeexital mën nañu feeñ bu ñu tàmbalee benn anamu ŋàbbal ëmb bu hormon bu bees.',
      'Bari ci njeexital yi gàtt nañu te mën nañu wàññiku ci jamono.',
      'Benn màndarga bu tiis walla bu sax baax na ñu ko waxtaan ak benn liggéeykat.',
      'Yenn màndarga yu cosaanul soxla ndigalu doktoor bu gaaw.',
    ],
    finalTipTitle: 'Li am solo',
    finalTipText:
      'Déglu sa yaram du tekki taxawal anam bi ci gaaw. Bind li nga dégg, teg naka mu di dem te ñaan ndigal saa su ne benn màndarga di tiital la.',
    disclaimerText:
      'Bind bii ngir xibaar la te du wuutu ndigalu doktoor bu sa bopp. Bu am nga benn màndarga bu am solo walla bu cosaanul, seet ndigalu benn liggéeykatu wér.',
    shareMessage: 'Xam lu ñuy mën a gis ginnaaw — AWA',
  },
  ha: {
    badge: 'ILLOLI',
    title: 'Gane yiwuwar\nillolin magani',
    metaDuration: 'karatun minti 8',
    metaType: 'Labari',
    metaLevel: 'Matsakaici',
    metaValidated: 'Abun da aka duba',
    intro:
      'Wasu tasirori na iya zama gama gari kuma na ɗan lokaci. Wasu suna bukatar ƙarin kulawa. Koyi bambanta martani na yau da kullum da alamomin da ya kamata a tantance.',
    contentsTitle: 'A cikin wannan labari',
    topics: [
      'Tasirori gama gari, masu sauƙi',
      'Lokacin daidaitawar jiki',
      'Lura da abin da ke canzawa',
      'Lokacin neman shawarar likita',
      'Lokacin neman kulawa da sauri',
      'Muhimman abubuwa',
    ],
    body1:
      'Idan wani ya fara sabuwar hanyar hana haihuwa ta hormone, jiki na iya bukatar ɗan lokaci don daidaitawa. Ƙananan sauye-sauye na iya bayyana a zagaye, yanayi, ko jin daɗin jiki.',
    body2:
      'Waɗannan tasirori galibi masu sauƙi ne kuma suna iya raguwa a hankali. Kasancewarsu ba ya nufin kai tsaye hanyar tana da haɗari ko cewa dole a daina ta.',
    commonEffects: [
      {
        title: 'Ƙaramin zubar jini',
        text: 'Zubar jini mara tsari na iya faruwa, musamman a farkon sabuwar hanya.',
      },
      {
        title: 'Ciwon nono',
        text: 'Ƙuntatawa ko ciwon nono na iya bayyana na ɗan lokaci.',
      },
      {
        title: 'Yanayi',
        text: 'Wasu mutane suna lura da sauyin yanayi ko ƙarin hankali ga ji.',
      },
      {
        title: 'Ciwon kai',
        text: 'Ciwon kai mai sauƙi na iya faruwa yayin lokacin daidaitawa.',
      },
    ],
    body3:
      'Makonni ko zagaye na farko na iya bambanta da abin da kika saba kafin. Jiki zai iya daidaitawa a hankali da sabon daidaiton hormone.',
    tip1Title: 'Abin da ya dace a sani',
    tip1Text:
      'Tasirin da ya bayyana jim kaɗan bayan fara hanya ya cancanci a lura da shi a kan lokaci. Idan ya zama mai damuwa ko ya dawwama, yi magana da ma’aikacin lafiya.',
    body4:
      'Yana iya zama da amfani a rubuta alamomi a manhajarki don fi bin yadda suke canzawa daga zagaye zuwa zagaye.',
    trackingTitle: 'Bi yadda abubuwa ke ci gaba',
    trackingSubtitle: 'Wasu alamomi na iya zama masu amfani',
    trackingLines: [
      'Rubuta ranar da alamar ta bayyana.',
      'Rubuta ƙarfinta da tsawonta.',
      'Lura ko tana inganta ko tana ƙara muni.',
    ],
    body5:
      'Ba duk alamomi ne ke da alaƙa da hana haihuwa ba. Damuwa, barci, abinci, zagayenki, ko wasu magunguna ma na iya shafar yadda kike ji.',
    body6:
      'Don fahimtar yanayin, yi ƙoƙarin duba yanayin gabaɗaya maimakon alama guda ɗaya a keɓe.',
    worthMentioning: [
      'Sauyin yanayi bayyananne, mai dawwama',
      'Raguwar sha’awa da ke damun ki',
      'Zubar jini mara tsari da ya wuce zagaye 3',
      'Tashin zuciya ko ciwon kai da ke ci gaba da damuwa',
    ],
    questionsTitle: 'Wasu tambayoyi masu amfani',
    questions: [
      'Tun yaushe waɗannan alamomi suke?',
      'Sun bayyana bayan fara ko canza hanyar hana haihuwa?',
      'Suna da sauƙi, masu damuwa, ko da gaske ba na al’ada ba a gare ki?',
      'Suna inganta a kan lokaci ko suna ƙara yawa?',
    ],
    body7:
      'Ko da alama ba ta gaggawa ba, tana iya cancanci a tattauna ta idan ta zama mai damuwa, ta dawwama, ko ta shafi ingancin rayuwarki da gaske.',
    infoTitle: 'Yana iya cancanci a nemi shawara idan…',
    infoText:
      'alamomi sun dawwama, sun zama masu muhimmanci, ko sun hana ki rayuwa yadda ya kamata.',
    body8:
      'Likita, ungozoma, ko mai magani na iya taimaka miki ki tantance ko alamomi na iya alaƙa da hanyar da kike amfani da ita kuma ko ana bukatar a daidaita ta.',
    body9:
      'Wasu alamomi ba na al’ada ba ne kuma suna bukatar tantancewar likita nan take. Ba lallai ba ne suna nufin akwai rikitarwa, amma bai kamata a yi watsi da su ba.',
    alertTitle: 'Nemi kulawa da sauri',
    alertIntro: 'Nemi shawarar likita da sauri idan kina fuskantar, musamman:',
    urgentSigns: [
      'Ciwon ƙirji mai yawa ko ba na al’ada ba',
      'Wahalar numfashi kwatsam',
      'Kumburi ko ciwo ba na al’ada ba a ƙafa',
      'Ciwon kai kwatsam, mai tsanani sosai ko ba na al’ada ba',
      'Matsalar gani, magana, ko ƙarfi kwatsam',
    ],
    emergencyTitle: 'Idan akwai yanayi mai tsanani',
    emergencyText:
      'Idan alamomi sun zo kwatsam, suna da tsanani sosai, ko suna zuwa tare da wahalar numfashi, jin kamar za a suma, ko wata alama mai tsanani, nemi taimakon likita na gaggawa.',
    summaryTitle: 'Muhimman abubuwa',
    summaryItems: [
      'Wasu tasirori na iya bayyana a farkon sabuwar hanyar hana haihuwa ta hormone.',
      'Tasirori da yawa na ɗan lokaci ne kuma suna iya raguwa a kan lokaci.',
      'Alama mai damuwa ko mai dawwama ta cancanci a tattauna da ƙwararre.',
      'Wasu alamomi ba na al’ada ba suna bukatar shawarar likita nan take.',
    ],
    finalTipTitle: 'Muhimmin abu',
    finalTipText:
      'Sauraron jikinki ba lallai ba ne yana nufin daina hanya nan da nan. Rubuta abin da kike ji, lura da yadda yake ci gaba, kuma nemi shawara duk lokacin da alama ta damu ke.',
    disclaimerText:
      'An yi wannan labari don bayani ne kuma ba ya maye gurbin shawarar likita ta keɓaɓɓiya. Idan kina da alama mai muhimmanci ko ba ta al’ada ba, nemi shawara daga ma’aikacin lafiya.',
    shareMessage: 'Gane yiwuwar illolin magani — AWA',
  },
  am: {
    badge: 'የጎንዮሽ ጉዳቶች',
    title: 'ሊኖሩ የሚችሉ የጎንዮሽ ጉዳቶችን\nመለየት',
    metaDuration: '8 ደቂቃ ንባብ',
    metaType: 'ጽሑፍ',
    metaLevel: 'መካከለኛ',
    metaValidated: 'የተገመገመ ይዘት',
    intro:
      'አንዳንድ ተጽእኖዎች የተለመዱ እና ጊዜያዊ ሊሆኑ ይችላሉ። ሌሎች የበለጠ ትኩረት ይፈልጋሉ። በተለመዱ ምላሾች እና ግምገማ በሚፈልጉ ምልክቶች መካከል ያለውን ልዩነት ለመለየት ተማሪ።',
    contentsTitle: 'በዚህ ጽሑፍ ውስጥ',
    topics: [
      'የተለመዱ፣ ቀላል ተጽእኖዎች',
      'የሰውነት የመላመድ ጊዜ',
      'የሚለወጠውን መታዘብ',
      'የሕክምና ምክር መቼ መፈለግ',
      'ፈጣን እንክብካቤ መቼ መፈለግ',
      'ዋና ዋና ነጥቦች',
    ],
    body1:
      'አንድ ሰው አዲስ የሆርሞን የእርግዝና መከላከያ ዘዴ ሲጀምር ሰውነት ለመላመድ ጥቂት ጊዜ ሊፈልግ ይችላል። ትናንሽ ለውጦች በዑደቱ፣ በስሜቱ ወይም በአካላዊ ምቾቱ ላይ ሊታዩ ይችላሉ።',
    body2:
      'እነዚህ ተጽእኖዎች ብዙ ጊዜ ቀላል ናቸው እና ቀስ በቀስ ሊቀንሱ ይችላሉ። መኖራቸው ዘዴው አደገኛ ነው ወይም መቆም አለበት ማለት በራስ-ሰር አይደለም።',
    commonEffects: [
      {
        title: 'ቀላል ደም መፍሰስ',
        text: 'መደበኛ ያልሆነ ደም መፍሰስ ሊከሰት ይችላል፣ በተለይ በአዲስ ዘዴ መጀመሪያ።',
      },
      {
        title: 'የጡት ርህራሄ',
        text: 'የጡት መጨናነቅ ወይም ርህራሄ ለጊዜው ሊሰማ ይችላል።',
      },
      {
        title: 'ስሜት',
        text: 'አንዳንድ ሰዎች የስሜት ለውጦችን ወይም የጨመረ ስሜታዊነትን ያስተውላሉ።',
      },
      {
        title: 'ራስ ምታት',
        text: 'በመላመድ ጊዜ ቀላል ራስ ምታት ሊከሰት ይችላል።',
      },
    ],
    body3:
      'የመጀመሪያዎቹ ጥቂት ሳምንታት ወይም ዑደቶች ከለመድሽው ሊለዩ ይችላሉ። ሰውነት ከአዲሱ የሆርሞን ሚዛን ጋር ቀስ በቀስ ሊላመድ ይችላል።',
    tip1Title: 'ማወቅ ጠቃሚ ነው',
    tip1Text:
      'ዘዴ ከተጀመረ ብዙም ሳይቆይ የሚታይ ተጽእኖ በጊዜ ሂደት መከታተል ተገቢ ነው። የሚያስቸግር ከሆነ ወይም ከቀጠለ ከጤና ባለሙያ ጋር ተነጋገሪ።',
    body4:
      'ምልክቶች ከአንዱ ዑደት ወደ ሌላው እንዴት እንደሚለወጡ በተሻለ ለመከታተል በመተግበሪያሽ ውስጥ መመዝገብ ሊረዳ ይችላል።',
    trackingTitle: 'እንዴት እንደሚለወጥ ተከታተይ',
    trackingSubtitle: 'ጥቂት አመልካቾች ጠቃሚ ሊሆኑ ይችላሉ',
    trackingLines: [
      'ምልክቱ የታየበትን ቀን ጻፊ።',
      'ጥንካሬውንና ቆይታውን መዝግቢ።',
      'እየተሻሻለ ወይም እየተባባሰ እንደሆነ ታዘቢ።',
    ],
    body5:
      'ሁሉም ምልክቶች የግድ ከእርግዝና መከላከያ ጋር የተያያዙ አይደሉም። ጭንቀት፣ እንቅልፍ፣ አመጋገብ፣ ዑደትሽ ወይም ሌሎች ሕክምናዎች እንዴት እንደሚሰማሽም ሊነኩ ይችላሉ።',
    body6:
      'ሁኔታውን ለመረዳት አንድን ምልክት ብቻውን ከማየት ይልቅ አጠቃላይ አውዱን ለማየት ሞክሪ።',
    worthMentioning: [
      'ግልጽ፣ የሚቆዩ የስሜት ለውጦች',
      'የሚያስቸግርሽ የፍላጎት መቀነስ',
      'ከ3 ዑደቶች በላይ የሚቆይ መደበኛ ያልሆነ ደም መፍሰስ',
      'የሚያስቸግሩ ሆነው የሚቆዩ ማቅለሽለሽ ወይም ራስ ምታት',
    ],
    questionsTitle: 'ጥቂት ጠቃሚ ጥያቄዎች',
    questions: [
      'እነዚህ ምልክቶች ለምን ያህል ጊዜ ቆይተዋል?',
      'የእርግዝና መከላከያ ዘዴ ከጀመርሽ ወይም ከቀየርሽ በኋላ ታዩ?',
      'ቀላል፣ የሚያስቸግሩ ወይም ለአንቺ በእርግጥ ያልተለመዱ ናቸው?',
      'በጊዜ ሂደት እየተሻሻሉ ነው ወይስ እየበዙ ነው?',
    ],
    body7:
      'ምልክት አስቸኳይ ባይሆንም የሚያስቸግር ከሆነ፣ ከቀጠለ ወይም የሕይወት ጥራትሽን በእውነት ከነካ ስለሱ መወያየት ተገቢ ሊሆን ይችላል።',
    infoTitle: 'ምክር ማግኘት ተገቢ ሊሆን ይችላል…',
    infoText:
      'ምልክቶች ከቀጠሉ፣ ከጨመሩ ወይም በመደበኛነት እንዳትኖሪ ካደረጉሽ።',
    body8:
      'ሐኪም፣ ሚድዋይፍ ወይም ፋርማሲስት ምልክቶቹ ከምትጠቀሚው ዘዴ ጋር ሊያያዙ እንደሚችሉ እና ማስተካከል እንደሚያስፈልገው ለመወሰን ሊረዱሽ ይችላሉ።',
    body9:
      'አንዳንድ ምልክቶች ያልተለመዱ ናቸው እና ፈጣን የሕክምና ግምገማ ይፈልጋሉ። ውስብስብ ችግር እንዳለ የግድ አያመለክቱም፣ ነገር ግን ችላ ሊባሉ አይገባም።',
    alertTitle: 'ፈጣን እንክብካቤ ፈልጊ',
    alertIntro: 'በተለይ የሚከተሉት ካጋጠሙሽ በፍጥነት የሕክምና ምክር ፈልጊ፦',
    urgentSigns: [
      'ከፍተኛ ወይም ያልተለመደ የደረት ህመም',
      'ድንገተኛ የመተንፈስ ችግር',
      'በእግር ላይ ያልተለመደ እብጠት ወይም ህመም',
      'ድንገተኛ፣ በጣም ኃይለኛ ወይም ያልተለመደ ራስ ምታት',
      'ድንገተኛ የማየት፣ የመናገር ወይም የጥንካሬ ችግር',
    ],
    emergencyTitle: 'ከባድ ሁኔታ ሲኖር',
    emergencyText:
      'ምልክቶች ድንገተኛ፣ በጣም ከባድ ከሆኑ ወይም ከመተንፈስ ችግር፣ የመውደቅ ስሜት ወይም ሌላ ከባድ ምልክት ጋር ከመጡ አስቸኳይ የሕክምና እርዳታ ፈልጊ።',
    summaryTitle: 'አስፈላጊዎቹ',
    summaryItems: [
      'አንዳንድ ተጽእኖዎች በአዲስ የሆርሞን የእርግዝና መከላከያ ዘዴ መጀመሪያ ሊታዩ ይችላሉ።',
      'ብዙ ተጽእኖዎች ጊዜያዊ ናቸው እና በጊዜ ሂደት ሊቀንሱ ይችላሉ።',
      'የሚያስቸግር ወይም የሚቆይ ምልክት ከባለሙያ ጋር መወያየት ተገቢ ነው።',
      'አንዳንድ ያልተለመዱ ምልክቶች ፈጣን የሕክምና ምክር ይፈልጋሉ።',
    ],
    finalTipTitle: 'ዋና ነጥብ',
    finalTipText:
      'ሰውነትሽን ማዳመጥ ዘዴን ወዲያውኑ ማቆም የግድ አይደለም። የሚሰማሽን ጻፊ፣ እንዴት እንደሚለወጥ ታዘቢ፣ እና ምልክት ባሳሰበሽ ጊዜ ሁሉ ምክር ጠይቂ።',
    disclaimerText:
      'ይህ ጽሑፍ ለመረጃ ዓላማ የታሰበ ነው እና ግላዊ የሕክምና ምክርን አይተካም። ከፍተኛ ወይም ያልተለመደ ምልክት ካለሽ ከጤና ባለሙያ ምክር ጠይቂ።',
    shareMessage: 'ሊኖሩ የሚችሉ የጎንዮሽ ጉዳቶችን መለየት — AWA',
  },
  nl: {
    badge: 'BIJWERKINGEN',
    title: 'Mogelijke bijwerkingen\nherkennen',
    metaDuration: '8 min lezen',
    metaType: 'Artikel',
    metaLevel: 'Gemiddeld',
    metaValidated: 'Gecontroleerde inhoud',
    intro:
      'Sommige effecten kunnen vaak voorkomen en tijdelijk zijn. Andere vragen meer aandacht. Leer het verschil te zien tussen gebruikelijke reacties en tekenen die moeten worden beoordeeld.',
    contentsTitle: 'In dit artikel',
    topics: [
      'Veelvoorkomende, milde effecten',
      'De aanpassingsperiode van het lichaam',
      'Observeren wat verandert',
      'Wanneer medisch advies vragen',
      'Wanneer snel zorg zoeken',
      'Belangrijkste punten',
    ],
    body1:
      'Wanneer iemand een nieuwe hormonale anticonceptiemethode begint, kan het lichaam wat tijd nodig hebben om zich aan te passen. Er kunnen kleine veranderingen optreden in de cyclus, de stemming of het lichamelijk comfort.',
    body2:
      'Deze effecten zijn vaak mild en kunnen geleidelijk afnemen. Hun aanwezigheid betekent niet automatisch dat de methode gevaarlijk is of dat ze moet worden gestopt.',
    commonEffects: [
      {
        title: 'Lichte bloedingen',
        text: 'Onregelmatig bloedverlies kan optreden, vooral aan het begin van een nieuwe methode.',
      },
      {
        title: 'Gevoelige borsten',
        text: 'Een gespannen of gevoelig gevoel in de borsten kan tijdelijk optreden.',
      },
      {
        title: 'Stemming',
        text: 'Sommige mensen merken stemmingswisselingen of een grotere emotionele gevoeligheid op.',
      },
      {
        title: 'Hoofdpijn',
        text: 'Lichte hoofdpijn kan optreden tijdens de aanpassingsperiode.',
      },
    ],
    body3:
      'De eerste weken of cycli kunnen anders zijn dan wat je gewend was. Het lichaam kan zich geleidelijk aanpassen aan het nieuwe hormonale evenwicht.',
    tip1Title: 'Goed om te weten',
    tip1Text:
      'Een effect dat kort na het starten van een methode verschijnt, is de moeite waard om in de loop van de tijd te volgen. Als het hinderlijk wordt of aanhoudt, praat dan met een zorgprofessional.',
    body4:
      'Het kan nuttig zijn symptomen in je app vast te leggen om beter te volgen hoe ze van cyclus tot cyclus veranderen.',
    trackingTitle: 'Volg hoe het zich ontwikkelt',
    trackingSubtitle: 'Enkele aandachtspunten kunnen nuttig zijn',
    trackingLines: [
      'Noteer de datum waarop het symptoom verscheen.',
      'Leg de intensiteit en duur vast.',
      'Kijk of het verbetert of verergert.',
    ],
    body5:
      'Niet alle symptomen hangen noodzakelijk samen met anticonceptie. Stress, slaap, voeding, je cyclus of andere behandelingen kunnen ook beïnvloeden hoe je je voelt.',
    body6:
      'Probeer om de situatie te begrijpen naar de algemene context te kijken in plaats van naar één symptoom afzonderlijk.',
    worthMentioning: [
      'Duidelijke, aanhoudende stemmingswisselingen',
      'Een afname van het libido die je hindert',
      'Onregelmatig bloedverlies dat langer dan 3 cycli duurt',
      'Misselijkheid of hoofdpijn die hinderlijk blijven',
    ],
    questionsTitle: 'Enkele nuttige vragen',
    questions: [
      'Hoe lang duren deze klachten al?',
      'Zijn ze verschenen na het starten of wijzigen van een anticonceptiemethode?',
      'Zijn ze mild, hinderlijk of echt ongewoon voor jou?',
      'Verbeteren ze na verloop van tijd of komen ze vaker voor?',
    ],
    body7:
      'Zelfs als een symptoom niet dringend is, kan het de moeite waard zijn het te bespreken als het hinderlijk wordt, aanhoudt of je levenskwaliteit echt beïnvloedt.',
    infoTitle: 'Het kan nuttig zijn advies te vragen als…',
    infoText:
      'symptomen aanhouden, ernstiger worden of je beletten normaal te leven.',
    body8:
      'Een arts, verloskundige of apotheker kan je helpen te bepalen of de klachten samenhangen met de methode die je gebruikt en of die moet worden aangepast.',
    body9:
      'Sommige tekenen zijn ongewoon en vragen om snelle medische beoordeling. Ze betekenen niet per se dat er een complicatie is, maar ze mogen niet worden genegeerd.',
    alertTitle: 'Zoek snel zorg',
    alertIntro: 'Zoek snel medisch advies als je met name last hebt van:',
    urgentSigns: [
      'Aanzienlijke of ongewone pijn op de borst',
      'Plotselinge ademhalingsmoeilijkheden',
      'Ongewone zwelling of pijn in een been',
      'Plotselinge, zeer hevige of ongewone hoofdpijn',
      'Plotselinge problemen met zien, spreken of kracht',
    ],
    emergencyTitle: 'Bij een ernstige situatie',
    emergencyText:
      'Als de klachten plotseling, zeer ernstig zijn of gepaard gaan met ademhalingsmoeilijkheden, een flauw gevoel of een ander ernstig teken, zoek dan dringend medische hulp.',
    summaryTitle: 'De essentie',
    summaryItems: [
      'Sommige effecten kunnen optreden aan het begin van een nieuwe hormonale anticonceptiemethode.',
      'Veel effecten zijn tijdelijk en kunnen na verloop van tijd afnemen.',
      'Een hinderlijk of aanhoudend symptoom is de moeite waard om met een professional te bespreken.',
      'Sommige ongewone tekenen vragen om snel medisch advies.',
    ],
    finalTipTitle: 'Belangrijkste punt',
    finalTipText:
      'Luisteren naar je lichaam betekent niet per se meteen stoppen met een methode. Noteer wat je voelt, volg hoe het zich ontwikkelt en vraag advies zodra een symptoom je zorgen baart.',
    disclaimerText:
      'Dit artikel is bedoeld ter informatie en vervangt geen persoonlijk medisch advies. Als je een aanzienlijk of ongewoon symptoom hebt, vraag dan advies aan een zorgprofessional.',
    shareMessage: 'Mogelijke bijwerkingen herkennen — AWA',
  },
  fi: {
    badge: 'SIVUVAIKUTUKSET',
    title: 'Mahdollisten sivuvaikutusten\ntunnistaminen',
    metaDuration: '8 min lukuaika',
    metaType: 'Artikkeli',
    metaLevel: 'Keskitaso',
    metaValidated: 'Tarkistettu sisältö',
    intro:
      'Jotkin vaikutukset voivat olla yleisiä ja tilapäisiä. Toiset vaativat enemmän huomiota. Opi erottamaan tavalliset reaktiot merkeistä, jotka tulisi arvioida.',
    contentsTitle: 'Tässä artikkelissa',
    topics: [
      'Yleiset, lievät vaikutukset',
      'Kehon sopeutumisjakso',
      'Muutosten havainnointi',
      'Milloin hakea lääketieteellistä neuvoa',
      'Milloin hakea hoitoa nopeasti',
      'Tärkeimmät asiat',
    ],
    body1:
      'Kun joku aloittaa uuden hormonaalisen ehkäisymenetelmän, keho voi tarvita aikaa sopeutuakseen. Kiertoon, mielialaan tai fyysiseen mukavuuteen voi ilmaantua pieniä muutoksia.',
    body2:
      'Nämä vaikutukset ovat usein lieviä ja voivat vähitellen vähentyä. Niiden esiintyminen ei automaattisesti tarkoita, että menetelmä olisi vaarallinen tai että se pitäisi lopettaa.',
    commonEffects: [
      {
        title: 'Lievä vuoto',
        text: 'Epäsäännöllistä vuotoa voi esiintyä erityisesti uuden menetelmän alussa.',
      },
      {
        title: 'Rintojen arkuus',
        text: 'Rintojen kireyttä tai arkuutta voi tuntua tilapäisesti.',
      },
      {
        title: 'Mieliala',
        text: 'Jotkut huomaavat mielialan muutoksia tai lisääntynyttä tunneherkkyyttä.',
      },
      {
        title: 'Päänsärky',
        text: 'Lievää päänsärkyä voi esiintyä sopeutumisjakson aikana.',
      },
    ],
    body3:
      'Ensimmäiset viikot tai kierrot voivat poiketa siitä, mihin olit tottunut ennen. Keho voi vähitellen sopeutua uuteen hormonitasapainoon.',
    tip1Title: 'Hyvä tietää',
    tip1Text:
      'Pian menetelmän aloittamisen jälkeen ilmaantuvaa vaikutusta kannattaa seurata ajan myötä. Jos se muuttuu haittaavaksi tai jatkuu, puhu terveydenhuollon ammattilaisen kanssa.',
    body4:
      'Voi olla hyödyllistä kirjata oireet sovellukseesi, jotta voit seurata paremmin niiden muutoksia kierrosta toiseen.',
    trackingTitle: 'Seuraa kehitystä',
    trackingSubtitle: 'Muutamat viitepisteet voivat olla hyödyllisiä',
    trackingLines: [
      'Kirjaa oireen ilmaantumispäivä.',
      'Kirjaa sen voimakkuus ja kesto.',
      'Seuraa, paraneeko vai pahenee se.',
    ],
    body5:
      'Kaikki oireet eivät välttämättä liity ehkäisyyn. Stressi, uni, ruokavalio, kiertosi tai muut hoidot voivat myös vaikuttaa olosi.',
    body6:
      'Tilanteen ymmärtämiseksi yritä katsoa kokonaisuutta yksittäisen oireen sijaan.',
    worthMentioning: [
      'Selvät, pitkäkestoiset mielialan muutokset',
      'Sukupuolivietin lasku, joka vaivaa sinua',
      'Epäsäännöllinen vuoto, joka kestää yli 3 kiertoa',
      'Pahoinvointi tai päänsärky, jotka pysyvät haittaavina',
    ],
    questionsTitle: 'Muutamia hyödyllisiä kysymyksiä',
    questions: [
      'Kuinka kauan nämä oireet ovat jatkuneet?',
      'Ilmaantuivatko ne ehkäisymenetelmän aloittamisen tai vaihtamisen jälkeen?',
      'Ovatko ne lieviä, haittaavia vai todella epätavallisia sinulle?',
      'Paranevatko ne ajan myötä vai yleistyvätkö ne?',
    ],
    body7:
      'Vaikka oire ei olisi kiireellinen, sen puheeksi ottaminen voi olla arvokasta, jos se muuttuu haittaavaksi, jatkuu tai todella vaikuttaa elämänlaatuusi.',
    infoTitle: 'Voi olla hyödyllistä pyytää neuvoa, jos…',
    infoText:
      'oireet jatkuvat, muuttuvat merkittävämmiksi tai estävät sinua elämästä normaalisti.',
    body8:
      'Lääkäri, kätilö tai apteekkari voi auttaa selvittämään, voivatko oireet liittyä käyttämääsi menetelmään ja pitäisikö sitä säätää.',
    body9:
      'Jotkin merkit ovat epätavallisia ja vaativat pikaista lääketieteellistä arviota. Ne eivät välttämättä tarkoita komplikaatiota, mutta niitä ei pidä sivuuttaa.',
    alertTitle: 'Hakeudu hoitoon pikaisesti',
    alertIntro: 'Hae pikaisesti lääketieteellistä neuvontaa, jos sinulla on erityisesti:',
    urgentSigns: [
      'Merkittävä tai epätavallinen rintakipu',
      'Äkillinen hengitysvaikeus',
      'Epätavallinen turvotus tai kipu jalassa',
      'Äkillinen, hyvin voimakas tai epätavallinen päänsärky',
      'Äkillisiä ongelmia näössä, puheessa tai voimassa',
    ],
    emergencyTitle: 'Vakavan tilanteen sattuessa',
    emergencyText:
      'Jos oireet ovat äkillisiä, hyvin vaikeita tai niihin liittyy hengitysvaikeuksia, pyörtymisen tunnetta tai muu vakava merkki, hae kiireellistä lääketieteellistä apua.',
    summaryTitle: 'Olennaiset asiat',
    summaryItems: [
      'Jotkin vaikutukset voivat ilmaantua uuden hormonaalisen ehkäisymenetelmän alussa.',
      'Monet vaikutukset ovat tilapäisiä ja voivat vähentyä ajan myötä.',
      'Haittaavasta tai jatkuvasta oireesta kannattaa puhua ammattilaisen kanssa.',
      'Jotkin epätavalliset merkit vaativat pikaista lääketieteellistä neuvontaa.',
    ],
    finalTipTitle: 'Tärkein asia',
    finalTipText:
      'Kehosi kuunteleminen ei välttämättä tarkoita menetelmän heti lopettamista. Kirjaa, mitä tunnet, seuraa sen kehitystä ja pyydä neuvoa aina, kun oire huolestuttaa sinua.',
    disclaimerText:
      'Tämä artikkeli on tarkoitettu tiedoksi eikä korvaa henkilökohtaista lääketieteellistä neuvontaa. Jos sinulla on merkittävä tai epätavallinen oire, pyydä neuvoa terveydenhuollon ammattilaiselta.',
    shareMessage: 'Mahdollisten sivuvaikutusten tunnistaminen — AWA',
  },
  el: {
    badge: 'ΠΑΡΕΝΕΡΓΕΙΕΣ',
    title: 'Αναγνωρίζοντας πιθανές\nπαρενέργειες',
    metaDuration: '8 λεπτά ανάγνωσης',
    metaType: 'Άρθρο',
    metaLevel: 'Μεσαίο',
    metaValidated: 'Ελεγμένο περιεχόμενο',
    intro:
      'Ορισμένες επιδράσεις μπορεί να είναι συχνές και παροδικές. Άλλες χρειάζονται περισσότερη προσοχή. Μάθε να ξεχωρίζεις τις συνηθισμένες αντιδράσεις από τα σημάδια που πρέπει να αξιολογηθούν.',
    contentsTitle: 'Σε αυτό το άρθρο',
    topics: [
      'Συχνές, ήπιες επιδράσεις',
      'Η περίοδος προσαρμογής του σώματος',
      'Παρατηρώντας τι αλλάζει',
      'Πότε να ζητήσεις ιατρική συμβουλή',
      'Πότε να ζητήσεις γρήγορα φροντίδα',
      'Βασικά συμπεράσματα',
    ],
    body1:
      'Όταν μια γυναίκα ξεκινά μια νέα ορμονική αντισυλληπτική μέθοδο, το σώμα μπορεί να χρειαστεί λίγο χρόνο για να προσαρμοστεί. Μικρές αλλαγές μπορεί να εμφανιστούν στον κύκλο, στη διάθεση ή στη σωματική άνεση.',
    body2:
      'Αυτές οι επιδράσεις είναι συχνά ήπιες και μπορεί να μειώνονται σταδιακά. Η παρουσία τους δεν σημαίνει αυτόματα ότι η μέθοδος είναι επικίνδυνη ή ότι πρέπει να διακοπεί.',
    commonEffects: [
      {
        title: 'Ελαφριά αιμορραγία',
        text: 'Μπορεί να εμφανιστεί ακανόνιστη αιμορραγία, ιδίως στην αρχή μιας νέας μεθόδου.',
      },
      {
        title: 'Ευαισθησία στο στήθος',
        text: 'Μπορεί να νιώσεις προσωρινά σφίξιμο ή ευαισθησία στο στήθος.',
      },
      {
        title: 'Διάθεση',
        text: 'Ορισμένες γυναίκες παρατηρούν αλλαγές διάθεσης ή αυξημένη συναισθηματική ευαισθησία.',
      },
      {
        title: 'Πονοκέφαλοι',
        text: 'Ήπιοι πονοκέφαλοι μπορεί να εμφανιστούν κατά την περίοδο προσαρμογής.',
      },
    ],
    body3:
      'Οι πρώτες εβδομάδες ή κύκλοι μπορεί να διαφέρουν από όσα συνήθιζες πριν. Το σώμα μπορεί να προσαρμοστεί σταδιακά στη νέα ορμονική ισορροπία.',
    tip1Title: 'Καλό είναι να γνωρίζεις',
    tip1Text:
      'Μια επίδραση που εμφανίζεται λίγο μετά την έναρξη μιας μεθόδου αξίζει να παρακολουθείται με τον καιρό. Αν γίνει ενοχλητική ή επιμείνει, μίλησε με έναν επαγγελματία υγείας.',
    body4:
      'Μπορεί να βοηθήσει να καταγράφεις τα συμπτώματα στην εφαρμογή σου για να παρακολουθείς καλύτερα πώς αλλάζουν από τον έναν κύκλο στον άλλο.',
    trackingTitle: 'Παρακολούθησε την εξέλιξη',
    trackingSubtitle: 'Μερικοί δείκτες μπορεί να είναι χρήσιμοι',
    trackingLines: [
      'Σημείωσε την ημερομηνία που εμφανίστηκε το σύμπτωμα.',
      'Κατάγραψε την ένταση και τη διάρκειά του.',
      'Παρατήρησε αν βελτιώνεται ή επιδεινώνεται.',
    ],
    body5:
      'Δεν συνδέονται αναγκαστικά όλα τα συμπτώματα με την αντισύλληψη. Το άγχος, ο ύπνος, η διατροφή, ο κύκλος σου ή άλλες θεραπείες μπορούν επίσης να επηρεάσουν το πώς νιώθεις.',
    body6:
      'Για να κατανοήσεις την κατάσταση, προσπάθησε να δεις το συνολικό πλαίσιο αντί για ένα μεμονωμένο σύμπτωμα.',
    worthMentioning: [
      'Έντονες, επίμονες αλλαγές διάθεσης',
      'Μια πτώση της libido που σε ενοχλεί',
      'Ακανόνιστη αιμορραγία που διαρκεί πάνω από 3 κύκλους',
      'Ναυτία ή πονοκέφαλοι που παραμένουν ενοχλητικοί',
    ],
    questionsTitle: 'Μερικές χρήσιμες ερωτήσεις',
    questions: [
      'Πόσο καιρό διαρκούν αυτά τα συμπτώματα;',
      'Εμφανίστηκαν μετά την έναρξη ή την αλλαγή μιας αντισυλληπτικής μεθόδου;',
      'Είναι ήπια, ενοχλητικά ή πραγματικά ασυνήθιστα για σένα;',
      'Βελτιώνονται με τον καιρό ή γίνονται πιο συχνά;',
    ],
    body7:
      'Ακόμη και όταν ένα σύμπτωμα δεν είναι επείγον, μπορεί να αξίζει να συζητηθεί αν γίνει ενοχλητικό, επιμένει ή επηρεάζει πραγματικά την ποιότητα ζωής σου.',
    infoTitle: 'Μπορεί να αξίζει να ζητήσεις συμβουλή αν…',
    infoText:
      'τα συμπτώματα επιμένουν, γίνονται πιο σημαντικά ή σε εμποδίζουν να ζεις κανονικά.',
    body8:
      'Ένας γιατρός, μια μαία ή ένας φαρμακοποιός μπορεί να σε βοηθήσει να καθορίσεις αν τα συμπτώματα μπορεί να συνδέονται με τη μέθοδο που χρησιμοποιείς και αν χρειάζεται να προσαρμοστεί.',
    body9:
      'Ορισμένα σημάδια είναι ασυνήθιστα και απαιτούν άμεση ιατρική αξιολόγηση. Δεν σημαίνουν αναγκαστικά ότι υπάρχει επιπλοκή, αλλά δεν πρέπει να αγνοούνται.',
    alertTitle: 'Ζήτησε γρήγορα φροντίδα',
    alertIntro: 'Ζήτησε γρήγορα ιατρική συμβουλή αν παρουσιάσεις, ιδίως:',
    urgentSigns: [
      'Σημαντικό ή ασυνήθιστο πόνο στο στήθος',
      'Ξαφνική δυσκολία στην αναπνοή',
      'Ασυνήθιστο πρήξιμο ή πόνο στο ένα πόδι',
      'Έναν ξαφνικό, πολύ έντονο ή ασυνήθιστο πονοκέφαλο',
      'Ξαφνικά προβλήματα στην όραση, στην ομιλία ή στη δύναμη',
    ],
    emergencyTitle: 'Σε περίπτωση σοβαρής κατάστασης',
    emergencyText:
      'Αν τα συμπτώματα είναι ξαφνικά, πολύ σοβαρά ή συνοδεύονται από δυσκολία στην αναπνοή, αίσθημα λιποθυμίας ή άλλο σοβαρό σημάδι, ζήτησε επείγουσα ιατρική βοήθεια.',
    summaryTitle: 'Τα βασικά',
    summaryItems: [
      'Ορισμένες επιδράσεις μπορεί να εμφανιστούν στην αρχή μιας νέας ορμονικής αντισυλληπτικής μεθόδου.',
      'Πολλές επιδράσεις είναι προσωρινές και μπορεί να μειώνονται με τον καιρό.',
      'Ένα ενοχλητικό ή επίμονο σύμπτωμα αξίζει να συζητηθεί με έναν επαγγελματία.',
      'Ορισμένα ασυνήθιστα σημάδια απαιτούν άμεση ιατρική συμβουλή.',
    ],
    finalTipTitle: 'Βασικό συμπέρασμα',
    finalTipText:
      'Το να ακούς το σώμα σου δεν σημαίνει αναγκαστικά ότι θα σταματήσεις αμέσως μια μέθοδο. Σημείωσε όσα νιώθεις, παρακολούθησε την εξέλιξή τους και ζήτησε συμβουλή όποτε ένα σύμπτωμα σε ανησυχεί.',
    disclaimerText:
      'Αυτό το άρθρο προορίζεται για ενημέρωση και δεν αντικαθιστά εξατομικευμένη ιατρική συμβουλή. Αν έχεις ένα σημαντικό ή ασυνήθιστο σύμπτωμα, ζήτησε συμβουλή από έναν επαγγελματία υγείας.',
    shareMessage: 'Αναγνωρίζοντας πιθανές παρενέργειες — AWA',
  },
  fil: {
    badge: 'MGA SIDE EFFECT',
    title: 'Pagkilala sa mga posibleng\nside effect',
    metaDuration: '8 min na babasahin',
    metaType: 'Artikulo',
    metaLevel: 'Katamtaman',
    metaValidated: 'Sinuring nilalaman',
    intro:
      'Ang ilang epekto ay maaaring karaniwan at pansamantala. Ang iba ay nangangailangan ng mas maraming atensyon. Matutong ihiwalay ang karaniwang reaksyon mula sa mga senyales na dapat suriin.',
    contentsTitle: 'Sa artikulong ito',
    topics: [
      'Karaniwan at banayad na mga epekto',
      'Ang panahon ng pag-angkop ng katawan',
      'Pagmamasid sa nagbabago',
      'Kailan hihingi ng payong medikal',
      'Kailan hihingi agad ng pangangalaga',
      'Mahahalagang tandaan',
    ],
    body1:
      'Kapag nagsimula ang isang tao ng bagong paraan ng hormonal na kontrasepsyon, maaaring kailanganin ng katawan ng kaunting oras para umangkop. Maaaring lumitaw ang maliliit na pagbabago sa siklo, mood, o pisikal na ginhawa.',
    body2:
      'Madalas na banayad ang mga epektong ito at maaaring unti-unting bumaba. Hindi awtomatikong nangangahulugan ang presensya ng mga ito na mapanganib ang paraan o kailangan na itong ihinto.',
    commonEffects: [
      {
        title: 'Bahagyang pagdurugo',
        text: 'Maaaring magkaroon ng hindi regular na pagdurugo, lalo na sa simula ng bagong paraan.',
      },
      {
        title: 'Pananakit ng dibdib',
        text: 'Ang paninikip o pananakit ng dibdib ay maaaring pansamantalang maramdaman.',
      },
      {
        title: 'Mood',
        text: 'May ilang tao na nakapapansin ng pagbabago ng mood o mas mataas na pagiging sensitibo sa emosyon.',
      },
      {
        title: 'Pananakit ng ulo',
        text: 'Ang banayad na pananakit ng ulo ay maaaring mangyari sa panahon ng pag-angkop.',
      },
    ],
    body3:
      'Maaaring magkaiba ang unang ilang linggo o siklo sa nakasanayan mo dati. Maaaring unti-unting umangkop ang katawan sa bagong hormonal na balanse.',
    tip1Title: 'Mabuting malaman',
    tip1Text:
      'Ang epektong lumilitaw ilang sandali matapos magsimula ng paraan ay dapat bantayan sa paglipas ng panahon. Kung nagiging nakakaabala o nagpapatuloy, makipag-usap sa propesyonal sa kalusugan.',
    body4:
      'Makakatulong na itala ang mga sintomas sa iyong app upang mas masubaybayan kung paano sila nagbabago mula isang siklo hanggang sa susunod.',
    trackingTitle: 'Subaybayan ang pag-usad',
    trackingSubtitle: 'Makakatulong ang ilang marker',
    trackingLines: [
      'Itala ang petsa ng paglitaw ng sintomas.',
      'Itala ang tindi at tagal nito.',
      'Bantayan kung gumaganda o lumalala ito.',
    ],
    body5:
      'Hindi lahat ng sintomas ay kinakailangang may kaugnayan sa kontrasepsyon. Maaari ring makaapekto sa nararamdaman mo ang stress, tulog, pagkain, iyong siklo, o iba pang paggamot.',
    body6:
      'Upang maunawaan ang sitwasyon, subukang tingnan ang kabuuang konteksto sa halip na iisang sintomas na nag-iisa.',
    worthMentioning: [
      'Malinaw at patuloy na pagbabago ng mood',
      'Pagbaba ng libido na nakakaabala sa iyo',
      'Hindi regular na pagdurugo na tumatagal nang higit sa 3 siklo',
      'Pagduduwal o pananakit ng ulo na nananatiling nakakaabala',
    ],
    questionsTitle: 'Ilang kapaki-pakinabang na tanong',
    questions: [
      'Gaano na katagal nagpapatuloy ang mga sintomas na ito?',
      'Lumitaw ba ang mga ito pagkatapos magsimula o magpalit ng paraan ng kontrasepsyon?',
      'Banayad ba, nakakaabala, o tunay na hindi pangkaraniwan para sa iyo ang mga ito?',
      'Gumaganda ba ang mga ito sa paglipas ng panahon o dumadalas?',
    ],
    body7:
      'Kahit hindi agarang usapin ang isang sintomas, maaaring sulit itong pag-usapan kung nagiging nakakaabala, nagpapatuloy, o tunay na nakakaapekto sa iyong kalidad ng buhay.',
    infoTitle: 'Maaaring sulit humingi ng payo kung…',
    infoText:
      'nagpapatuloy ang mga sintomas, lumalaki ang mga ito, o pinipigilan ka ng mga ito na mamuhay nang normal.',
    body8:
      'Matutulungan ka ng doktor, midwife, o parmasyutiko na matukoy kung maaaring may kaugnayan ang mga sintomas sa paraang ginagamit mo at kung kailangan itong ayusin.',
    body9:
      'Ang ilang senyales ay hindi pangkaraniwan at nangangailangan ng agarang medikal na pagsusuri. Hindi nila kinakailangang nangangahulugang may komplikasyon, ngunit hindi dapat balewalain ang mga ito.',
    alertTitle: 'Humingi agad ng pangangalaga',
    alertIntro: 'Humingi agad ng payong medikal kung nakararanas ka, partikular, ng:',
    urgentSigns: [
      'Malaki o hindi pangkaraniwang pananakit ng dibdib',
      'Biglaang hirap sa paghinga',
      'Hindi pangkaraniwang pamamaga o sakit sa binti',
      'Biglaan, napakatindi, o hindi pangkaraniwang pananakit ng ulo',
      'Biglaang problema sa paningin, pagsasalita, o lakas',
    ],
    emergencyTitle: 'Sa kaso ng malubhang sitwasyon',
    emergencyText:
      'Kung biglaan, napakalubha ang mga sintomas, o may kasamang hirap sa paghinga, pakiramdam na mahihimatay, o iba pang malubhang senyales, humingi ng agarang medikal na tulong.',
    summaryTitle: 'Ang mahalaga',
    summaryItems: [
      'Ang ilang epekto ay maaaring lumitaw sa simula ng bagong paraan ng hormonal na kontrasepsyon.',
      'Maraming epekto ay pansamantala at maaaring bumaba sa paglipas ng panahon.',
      'Ang nakakaabala o patuloy na sintomas ay nararapat pag-usapan sa propesyonal.',
      'Ang ilang hindi pangkaraniwang senyales ay nangangailangan ng agarang payong medikal.',
    ],
    finalTipTitle: 'Mahalagang tandaan',
    finalTipText:
      'Ang pakikinig sa iyong katawan ay hindi kinakailangang nangangahulugang agad na ihinto ang isang paraan. Itala ang nararamdaman mo, bantayan kung paano ito nagbabago, at humingi ng payo kapag may sintomas na bumabagabag sa iyo.',
    disclaimerText:
      'Inilaan ang artikulong ito para sa impormasyon at hindi pumapalit sa personalisadong payong medikal. Kung may malaki o hindi pangkaraniwang sintomas ka, humingi ng payo sa propesyonal sa kalusugan.',
    shareMessage: 'Pagkilala sa mga posibleng side effect — AWA',
  },
  ta: {
    badge: 'பக்க விளைவுகள்',
    title: 'சாத்தியமான பக்க விளைவுகளை\nஅடையாளம் காணுதல்',
    metaDuration: '8 நிமிடம் படிக்க',
    metaType: 'கட்டுரை',
    metaLevel: 'இடைநிலை',
    metaValidated: 'மதிப்பாய்வு செய்யப்பட்ட உள்ளடக்கம்',
    intro:
      'சில விளைவுகள் பொதுவானவையாகவும் தற்காலிகமானவையாகவும் இருக்கலாம். மற்றவற்றுக்கு அதிகக் கவனம் தேவை. வழக்கமான எதிர்வினைகளுக்கும் மதிப்பீடு செய்யப்பட வேண்டிய அறிகுறிகளுக்கும் இடையே வேறுபடுத்தக் கற்றுக்கொள்ளுங்கள்.',
    contentsTitle: 'இந்தக் கட்டுரையில்',
    topics: [
      'பொதுவான, லேசான விளைவுகள்',
      'உடலின் சரிசெய்தல் காலம்',
      'என்ன மாறுகிறது என்பதைக் கவனித்தல்',
      'மருத்துவ ஆலோசனையை எப்போது நாடுவது',
      'விரைவாகச் சிகிச்சை நாட வேண்டியபோது',
      'முக்கியக் குறிப்புகள்',
    ],
    body1:
      'ஒருவர் புதிய ஹார்மோன் கருத்தடை முறையைத் தொடங்கும்போது, உடல் பொருந்திக்கொள்ள சிறிது நேரம் தேவைப்படலாம். சுழற்சி, மனநிலை அல்லது உடல் வசதியில் சிறு மாற்றங்கள் தோன்றலாம்.',
    body2:
      'இந்த விளைவுகள் பெரும்பாலும் லேசானவை, படிப்படியாகக் குறையலாம். அவை இருப்பது முறை ஆபத்தானது என்றோ நிறுத்தப்பட வேண்டும் என்றோ தானாகப் பொருளல்ல.',
    commonEffects: [
      {
        title: 'சிறு இரத்தப்போக்கு',
        text: 'ஒழுங்கற்ற இரத்தப்போக்கு ஏற்படலாம், குறிப்பாக புதிய முறையின் தொடக்கத்தில்.',
      },
      {
        title: 'மார்பகத் தொடு வலி',
        text: 'மார்பகம் இறுக்கமாக அல்லது தொட்டால் வலிப்பதாகத் தற்காலிகமாக உணரப்படலாம்.',
      },
      {
        title: 'மனநிலை',
        text: 'சிலர் மனநிலை மாற்றங்களையோ அதிகரித்த உணர்வுத் திறனையோ கவனிக்கிறார்கள்.',
      },
      {
        title: 'தலைவலி',
        text: 'சரிசெய்தல் காலத்தில் லேசான தலைவலி ஏற்படலாம்.',
      },
    ],
    body3:
      'முதல் சில வாரங்கள் அல்லது சுழற்சிகள் நீங்கள் முன்பு பழகியதிலிருந்து வேறுபடலாம். புதிய ஹார்மோன் சமநிலைக்கு உடல் படிப்படியாகப் பொருந்திக்கொள்ளலாம்.',
    tip1Title: 'தெரிந்துகொள்ளுங்கள்',
    tip1Text:
      'ஒரு முறையைத் தொடங்கிய சிறிது நேரத்திலேயே தோன்றும் விளைவைக் காலப்போக்கில் கவனிப்பது நல்லது. அது தொந்தரவாகவோ நீடிப்பதாகவோ மாறினால், ஒரு சுகாதார நிபுணரிடம் பேசுங்கள்.',
    body4:
      'ஒரு சுழற்சியிலிருந்து மற்றொன்றுக்கு அறிகுறிகள் எப்படி மாறுகின்றன என்பதை நன்கு கண்காணிக்க, அவற்றை உங்கள் செயலியில் பதிவு செய்வது உதவலாம்.',
    trackingTitle: 'மாற்றத்தைக் கண்காணியுங்கள்',
    trackingSubtitle: 'சில குறிகாட்டிகள் உதவலாம்',
    trackingLines: [
      'அறிகுறி தோன்றிய தேதியைக் குறியுங்கள்.',
      'அதன் தீவிரத்தையும் காலத்தையும் பதிவு செய்யுங்கள்.',
      'அது மேம்படுகிறதா மோசமடைகிறதா என்று கவனியுங்கள்.',
    ],
    body5:
      'எல்லா அறிகுறிகளும் கருத்தடையுடன் தொடர்புடையவை என்று கட்டாயமில்லை. மன அழுத்தம், உறக்கம், உணவு, உங்கள் சுழற்சி அல்லது பிற சிகிச்சைகளும் நீங்கள் உணரும் விதத்தைப் பாதிக்கலாம்.',
    body6:
      'நிலைமையைப் புரிந்துகொள்ள, தனித்த ஓர் அறிகுறியை விட ஒட்டுமொத்தச் சூழலைப் பார்க்க முயலுங்கள்.',
    worthMentioning: [
      'தெளிவான, நீடிக்கும் மனநிலை மாற்றங்கள்',
      'உங்களைத் தொந்தரவு செய்யும் ஆசை குறைவு',
      '3 சுழற்சிகளுக்கு மேல் நீடிக்கும் ஒழுங்கற்ற இரத்தப்போக்கு',
      'தொந்தரவாகத் தொடரும் குமட்டல் அல்லது தலைவலி',
    ],
    questionsTitle: 'உதவக்கூடிய சில கேள்விகள்',
    questions: [
      'இந்த அறிகுறிகள் எவ்வளவு காலமாக உள்ளன?',
      'ஒரு கருத்தடை முறையைத் தொடங்கிய அல்லது மாற்றிய பின் அவை தோன்றினவா?',
      'அவை லேசானவையா, தொந்தரவானவையா, அல்லது உங்களுக்கு உண்மையிலேயே வழக்கத்துக்கு மாறானவையா?',
      'அவை காலப்போக்கில் மேம்படுகின்றனவா அல்லது அடிக்கடி வருகின்றனவா?',
    ],
    body7:
      'ஓர் அறிகுறி அவசரமில்லாவிட்டாலும், அது தொந்தரவாக மாறினால், நீடித்தால், அல்லது உங்கள் வாழ்க்கைத் தரத்தை உண்மையிலேயே பாதித்தால் அதைப் பற்றிப் பேசுவது மதிப்புள்ளது.',
    infoTitle: 'ஆலோசனை பெறுவது மதிப்புள்ளதாக இருக்கலாம்…',
    infoText:
      'அறிகுறிகள் நீடித்தால், அதிகக் குறிப்பிடத்தக்கவையாக மாறினால், அல்லது நீங்கள் இயல்பாக வாழ்வதைத் தடுத்தால்.',
    body8:
      'அறிகுறிகள் நீங்கள் பயன்படுத்தும் முறையுடன் தொடர்புடையவையாக இருக்கலாமா, அதை மாற்றியமைக்க வேண்டுமா என்பதைத் தீர்மானிக்க ஒரு மருத்துவர், மருத்துவச்சி அல்லது மருந்தாளர் உதவலாம்.',
    body9:
      'சில அறிகுறிகள் வழக்கத்துக்கு மாறானவை, உடனடி மருத்துவ மதிப்பீட்டைக் கோருகின்றன. ஒரு சிக்கல் இருக்கிறது என்று அவை கட்டாயம் பொருளல்ல, ஆனால் அவற்றைப் புறக்கணிக்கக் கூடாது.',
    alertTitle: 'விரைவாகச் சிகிச்சை நாடுங்கள்',
    alertIntro: 'குறிப்பாக இவற்றை அனுபவித்தால் விரைவாக மருத்துவ ஆலோசனை பெறுங்கள்:',
    urgentSigns: [
      'குறிப்பிடத்தக்க அல்லது வழக்கத்துக்கு மாறான மார்பு வலி',
      'திடீர் மூச்சுத் திணறல்',
      'காலில் வழக்கத்துக்கு மாறான வீக்கம் அல்லது வலி',
      'திடீரென வரும், மிகத் தீவிரமான அல்லது வழக்கத்துக்கு மாறான தலைவலி',
      'பார்வை, பேச்சு அல்லது வலிமையில் திடீர்ச் சிக்கல்',
    ],
    emergencyTitle: 'கடுமையான சூழ்நிலையில்',
    emergencyText:
      'அறிகுறிகள் திடீரென்றோ மிகக் கடுமையாகவோ இருந்தால், அல்லது மூச்சுத் திணறல், மயக்க உணர்வு அல்லது வேறு தீவிர அறிகுறியுடன் வந்தால், அவசர மருத்துவ உதவியை நாடுங்கள்.',
    summaryTitle: 'அத்தியாவசியங்கள்',
    summaryItems: [
      'புதிய ஹார்மோன் கருத்தடை முறையின் தொடக்கத்தில் சில விளைவுகள் தோன்றலாம்.',
      'பல விளைவுகள் தற்காலிகமானவை, காலப்போக்கில் குறையலாம்.',
      'தொந்தரவான அல்லது நீடிக்கும் அறிகுறியை ஒரு நிபுணருடன் பேசுவது மதிப்புள்ளது.',
      'சில வழக்கத்துக்கு மாறான அறிகுறிகளுக்கு உடனடி மருத்துவ ஆலோசனை தேவை.',
    ],
    finalTipTitle: 'முக்கியக் குறிப்பு',
    finalTipText:
      'உங்கள் உடலைக் கேட்பது ஒரு முறையை உடனே நிறுத்த வேண்டும் என்று கட்டாயம் பொருளல்ல. நீங்கள் உணர்வதைக் குறியுங்கள், அது எப்படி மாறுகிறது என்று கவனியுங்கள், ஓர் அறிகுறி உங்களைக் கவலைப்படுத்தும் போதெல்லாம் ஆலோசனை கேளுங்கள்.',
    disclaimerText:
      'இந்தக் கட்டுரை தகவல் நோக்கத்துக்காக உள்ளது, தனிப்பயன் மருத்துவ ஆலோசனைக்கு மாற்றல்ல. உங்களுக்குக் குறிப்பிடத்தக்க அல்லது வழக்கத்துக்கு மாறான அறிகுறி இருந்தால், ஒரு சுகாதார நிபுணரின் ஆலோசனையைப் பெறுங்கள்.',
    shareMessage: 'சாத்தியமான பக்க விளைவுகளை அடையாளம் காணுதல் — AWA',
  },
  te: {
    badge: 'దుష్ప్రభావాలు',
    title: 'సాధ్యమైన దుష్ప్రభావాలను\nగుర్తించడం',
    metaDuration: '8 నిమిషాల పఠనం',
    metaType: 'వ్యాసం',
    metaLevel: 'మధ్యస్థ స్థాయి',
    metaValidated: 'మదింపు చేసిన కంటెంట్',
    intro:
      'కొన్ని ప్రభావాలు సాధారణమైనవి, తాత్కాలికమైనవి కావచ్చు. మరికొన్నింటికి ఎక్కువ శ్రద్ధ అవసరం. సాధారణ ప్రతిస్పందనలకు, మదింపు చేయాల్సిన సంకేతాలకు మధ్య తేడాను గుర్తించడం నేర్చుకోండి.',
    contentsTitle: 'ఈ వ్యాసంలో',
    topics: [
      'సాధారణ, తేలికపాటి ప్రభావాలు',
      'శరీరం సర్దుబాటు అయ్యే కాలం',
      'ఏమి మారుతుందో గమనించడం',
      'వైద్య సలహా ఎప్పుడు కోరాలి',
      'వెంటనే వైద్య సంరక్షణ ఎప్పుడు కోరాలి',
      'ముఖ్యాంశాలు',
    ],
    body1:
      'ఒకరు కొత్త హార్మోన్ గర్భనిరోధక పద్ధతిని మొదలుపెట్టినప్పుడు, శరీరం సర్దుబాటు కావడానికి కొంత సమయం పట్టవచ్చు. చక్రంలో, మానసిక స్థితిలో లేదా శారీరక సౌకర్యంలో చిన్న మార్పులు కనిపించవచ్చు.',
    body2:
      'ఈ ప్రభావాలు తరచుగా తేలికపాటివి, క్రమంగా తగ్గవచ్చు. అవి ఉండటం ఆ పద్ధతి ప్రమాదకరమని లేదా దాన్ని ఆపాలని ఆటోమేటిక్‌గా అర్థం కాదు.',
    commonEffects: [
      {
        title: 'స్వల్ప రక్తస్రావం',
        text: 'అస్తవ్యస్త రక్తస్రావం, ముఖ్యంగా కొత్త పద్ధతి మొదట్లో, సంభవించవచ్చు.',
      },
      {
        title: 'రొమ్ముల సున్నితత్వం',
        text: 'రొమ్ములో బిగుతు లేదా సున్నితత్వం తాత్కాలికంగా అనిపించవచ్చు.',
      },
      {
        title: 'మానసిక స్థితి',
        text: 'కొందరు మానసిక స్థితిలో మార్పులను లేదా పెరిగిన భావోద్వేగ సున్నితత్వాన్ని గమనిస్తారు.',
      },
      {
        title: 'తలనొప్పి',
        text: 'సర్దుబాటు కాలంలో తేలికపాటి తలనొప్పి రావచ్చు.',
      },
    ],
    body3:
      'మొదటి కొన్ని వారాలు లేదా చక్రాలు మీరు ముందు అలవాటుపడిన దానికి భిన్నంగా ఉండవచ్చు. శరీరం కొత్త హార్మోన్ సమతుల్యతకు క్రమంగా సర్దుబాటు కావచ్చు.',
    tip1Title: 'తెలుసుకోవాల్సినవి',
    tip1Text:
      'ఒక పద్ధతిని మొదలుపెట్టిన కొద్దిసేపటికే కనిపించే ప్రభావాన్ని కాలక్రమేణా గమనించడం విలువైనది. అది ఇబ్బందికరంగా మారితే లేదా కొనసాగితే, ఒక ఆరోగ్య నిపుణుడితో మాట్లాడండి.',
    body4:
      'లక్షణాలు ఒక చక్రం నుండి మరొక చక్రానికి ఎలా మారుతున్నాయో బాగా ట్రాక్ చేయడానికి, వాటిని మీ యాప్‌లో నమోదు చేయడం సహాయపడగలదు.',
    trackingTitle: 'ఎలా మారుతుందో ట్రాక్ చేయండి',
    trackingSubtitle: 'కొన్ని సూచికలు ఉపయోగపడవచ్చు',
    trackingLines: [
      'లక్షణం కనిపించిన తేదీని రాయండి.',
      'దాని తీవ్రతను, వ్యవధిని నమోదు చేయండి.',
      'అది మెరుగవుతోందా లేక దిగజారుతోందా గమనించండి.',
    ],
    body5:
      'అన్ని లక్షణాలూ గర్భనిరోధకంతో ముడిపడి ఉండాల్సిన అవసరం లేదు. ఒత్తిడి, నిద్ర, ఆహారం, మీ చక్రం లేదా ఇతర చికిత్సలు కూడా మీకు ఎలా అనిపిస్తుందో ప్రభావితం చేయవచ్చు.',
    body6:
      'పరిస్థితిని అర్థం చేసుకోవడానికి, ఒక్క లక్షణాన్ని విడిగా చూడకుండా, మొత్తం సందర్భాన్ని చూడటానికి ప్రయత్నించండి.',
    worthMentioning: [
      'స్పష్టమైన, కొనసాగే మానసిక స్థితి మార్పులు',
      'మిమ్మల్ని ఇబ్బంది పెట్టే లైంగిక కోరిక తగ్గుదల',
      '3 చక్రాల కంటే ఎక్కువ కొనసాగే అస్తవ్యస్త రక్తస్రావం',
      'ఇబ్బందికరంగా ఉండే వికారం లేదా తలనొప్పి',
    ],
    questionsTitle: 'కొన్ని ఉపయోగకరమైన ప్రశ్నలు',
    questions: [
      'ఈ లక్షణాలు ఎంతకాలంగా ఉన్నాయి?',
      'అవి ఒక గర్భనిరోధక పద్ధతిని మొదలుపెట్టిన లేదా మార్చిన తర్వాత కనిపించాయా?',
      'అవి తేలికపాటివా, ఇబ్బందికరమైనవా, లేదా మీకు నిజంగా అసాధారణమైనవా?',
      'అవి కాలక్రమేణా మెరుగవుతున్నాయా లేదా మరింత తరచుగా వస్తున్నాయా?',
    ],
    body7:
      'ఒక లక్షణం అత్యవసరం కాకపోయినా, అది ఇబ్బందికరంగా మారితే, కొనసాగితే లేదా మీ జీవన నాణ్యతను నిజంగా ప్రభావితం చేస్తే దాని గురించి చర్చించడం విలువైనది.',
    infoTitle: 'ఈ సందర్భాల్లో సలహా తీసుకోవడం విలువైనది…',
    infoText:
      'లక్షణాలు కొనసాగినప్పుడు, మరింత గణనీయమవుతున్నప్పుడు, లేదా మిమ్మల్ని సాధారణంగా జీవించనివ్వనప్పుడు.',
    body8:
      'లక్షణాలు మీరు ఉపయోగిస్తున్న పద్ధతితో ముడిపడి ఉండవచ్చో లేదో, దాన్ని సర్దుబాటు చేయాలో లేదో నిర్ణయించడానికి వైద్యులు, మంత్రసాని లేదా ఫార్మసిస్ట్ సహాయపడగలరు.',
    body9:
      'కొన్ని సంకేతాలు అసాధారణమైనవి, తక్షణ వైద్య మదింపు కోరతాయి. అవి తప్పనిసరిగా సమస్య ఉందని అర్థం కాదు, కానీ వాటిని నిర్లక్ష్యం చేయకూడదు.',
    alertTitle: 'వెంటనే వైద్య సంరక్షణ కోరండి',
    alertIntro: 'మీకు ముఖ్యంగా ఇవి ఉంటే వెంటనే వైద్య సలహా కోరండి:',
    urgentSigns: [
      'గణనీయమైన లేదా అసాధారణ ఛాతీ నొప్పి',
      'అకస్మాత్తుగా శ్వాస తీసుకోవడంలో ఇబ్బంది',
      'కాలులో అసాధారణ వాపు లేదా నొప్పి',
      'అకస్మాత్తుగా వచ్చే, చాలా తీవ్రమైన లేదా అసాధారణ తలనొప్పి',
      'చూపు, మాట లేదా బలంలో అకస్మాత్తుగా ఇబ్బంది',
    ],
    emergencyTitle: 'తీవ్రమైన పరిస్థితిలో',
    emergencyText:
      'లక్షణాలు అకస్మాత్తుగా, చాలా తీవ్రంగా ఉంటే, లేదా శ్వాస ఇబ్బంది, తలతిరుగుడు లేదా మరొక తీవ్రమైన సంకేతంతో కలిసి వస్తే, అత్యవసర వైద్య సహాయం కోరండి.',
    summaryTitle: 'ముఖ్యాంశాలు',
    summaryItems: [
      'కొత్త హార్మోన్ గర్భనిరోధక పద్ధతి మొదట్లో కొన్ని ప్రభావాలు కనిపించవచ్చు.',
      'అనేక ప్రభావాలు తాత్కాలికమైనవి, కాలక్రమేణా తగ్గవచ్చు.',
      'ఇబ్బందికరమైన లేదా కొనసాగే లక్షణాన్ని ఒక నిపుణుడితో చర్చించడం విలువైనది.',
      'కొన్ని అసాధారణ సంకేతాలకు తక్షణ వైద్య సలహా అవసరం.',
    ],
    finalTipTitle: 'ముఖ్య సారాంశం',
    finalTipText:
      'మీ శరీరాన్ని వినడం అంటే తప్పనిసరిగా ఒక పద్ధతిని వెంటనే ఆపడం కాదు. మీకు అనిపించేదాన్ని నమోదు చేయండి, అది ఎలా మారుతుందో గమనించండి, ఏదైనా లక్షణం మిమ్మల్ని ఆందోళనపరిచినప్పుడల్లా సలహా కోరండి.',
    disclaimerText:
      'ఈ వ్యాసం సమాచారం కోసం ఉద్దేశించబడింది, వ్యక్తిగతీకరించిన వైద్య సలహాకు ప్రత్యామ్నాయం కాదు. మీకు గణనీయమైన లేదా అసాధారణ లక్షణం ఉంటే, ఒక ఆరోగ్య నిపుణుడి సలహా కోరండి.',
    shareMessage: 'సాధ్యమైన దుష్ప్రభావాలను గుర్తించడం — AWA',
  },
  mr: {
    badge: 'दुष्परिणाम',
    title: 'संभाव्य दुष्परिणाम\nओळखणे',
    metaDuration: '8 मिनिटे वाचन',
    metaType: 'लेख',
    metaLevel: 'मध्यम स्तर',
    metaValidated: 'पुनरावलोकन केलेला मजकूर',
    intro:
      'काही परिणाम सामान्य आणि तात्पुरते असू शकतात. इतरांकडे अधिक लक्ष द्यावे लागते. नेहमीच्या प्रतिक्रिया आणि मूल्यांकन करावी लागणारी चिन्हे यातील फरक ओळखायला शिका.',
    contentsTitle: 'या लेखात',
    topics: [
      'सामान्य, सौम्य परिणाम',
      'शरीर जुळवून घेण्याचा काळ',
      'काय बदलते याचे निरीक्षण',
      'वैद्यकीय सल्ला केव्हा घ्यावा',
      'त्वरित वैद्यकीय काळजी केव्हा घ्यावी',
      'मुख्य मुद्दे',
    ],
    body1:
      'कोणी नवीन हार्मोनल गर्भनिरोधक पद्धत सुरू करते तेव्हा, शरीराला जुळवून घेण्यासाठी थोडा वेळ लागू शकतो. पाळीत, मनःस्थितीत किंवा शारीरिक आरामात छोटे बदल दिसू शकतात.',
    body2:
      'हे परिणाम बहुतेकदा सौम्य असतात आणि हळूहळू कमी होऊ शकतात. त्यांच्या उपस्थितीचा आपोआप अर्थ असा नाही की पद्धत धोकादायक आहे किंवा ती थांबवणे आवश्यक आहे.',
    commonEffects: [
      {
        title: 'किरकोळ रक्तस्राव',
        text: 'अनियमित रक्तस्राव, विशेषतः नव्या पद्धतीच्या सुरुवातीला, होऊ शकतो.',
      },
      {
        title: 'स्तनांची संवेदनशीलता',
        text: 'स्तनांमध्ये घट्टपणा किंवा संवेदनशीलता तात्पुरती जाणवू शकते.',
      },
      {
        title: 'मनःस्थिती',
        text: 'काहींना मनःस्थितीत बदल किंवा वाढलेली भावनिक संवेदनशीलता जाणवते.',
      },
      {
        title: 'डोकेदुखी',
        text: 'जुळवून घेण्याच्या काळात सौम्य डोकेदुखी होऊ शकते.',
      },
    ],
    body3:
      'पहिले काही आठवडे किंवा पाळीचक्रे तुम्ही आधी ज्याला सरावलेल्या होता त्यापेक्षा वेगळी असू शकतात. शरीर नव्या हार्मोनल संतुलनाशी हळूहळू जुळवून घेऊ शकते.',
    tip1Title: 'हे जाणून घ्या',
    tip1Text:
      'पद्धत सुरू केल्यानंतर लवकरच दिसणारा परिणाम कालांतराने पाहण्यासारखा आहे. तो त्रासदायक झाल्यास किंवा कायम राहिल्यास, आरोग्य व्यावसायिकाशी बोला.',
    body4:
      'एका पाळीपासून दुसऱ्या पाळीपर्यंत लक्षणे कशी बदलतात याचा अधिक चांगला मागोवा घेण्यासाठी, ती तुमच्या अ‍ॅपमध्ये नोंदवणे उपयुक्त ठरू शकते.',
    trackingTitle: 'ते कसे बदलते याचा मागोवा घ्या',
    trackingSubtitle: 'काही खुणा उपयुक्त ठरू शकतात',
    trackingLines: [
      'लक्षण केव्हा दिसले त्याची तारीख लिहा.',
      'त्याची तीव्रता आणि कालावधी नोंदवा.',
      'ते सुधारते आहे की बिघडते आहे ते पाहा.',
    ],
    body5:
      'सर्व लक्षणे गर्भनिरोधनाशीच जोडलेली असतीलच असे नाही. ताण, झोप, आहार, तुमची पाळी किंवा इतर उपचारही तुम्हाला कसे वाटते यावर परिणाम करू शकतात.',
    body6:
      'परिस्थिती समजण्यासाठी, एका लक्षणाकडे वेगळे पाहण्याऐवजी संपूर्ण संदर्भ पाहण्याचा प्रयत्न करा.',
    worthMentioning: [
      'ठळक, कायम राहणारे मनःस्थितीतील बदल',
      'तुम्हाला त्रासदायक वाटणारी लैंगिक इच्छेतील घट',
      '3 पाळीचक्रांपेक्षा जास्त काळ टिकणारा अनियमित रक्तस्राव',
      'त्रासदायक राहणारी मळमळ किंवा डोकेदुखी',
    ],
    questionsTitle: 'काही उपयुक्त प्रश्न',
    questions: [
      'ही लक्षणे किती काळापासून सुरू आहेत?',
      'ती गर्भनिरोधक पद्धत सुरू केल्यानंतर किंवा बदलल्यानंतर दिसली का?',
      'ती सौम्य, त्रासदायक आहेत की तुमच्यासाठी खरोखर असामान्य?',
      'ती कालांतराने सुधारत आहेत की अधिक वारंवार होत आहेत?',
    ],
    body7:
      'एखादे लक्षण तातडीचे नसले तरी, ते त्रासदायक झाल्यास, कायम राहिल्यास किंवा तुमच्या जीवनाच्या गुणवत्तेवर खरोखर परिणाम करत असल्यास त्यावर चर्चा करणे योग्य ठरू शकते.',
    infoTitle: 'या प्रसंगी सल्ला घेणे योग्य ठरू शकते…',
    infoText:
      'लक्षणे कायम राहतात, अधिक गंभीर होतात किंवा तुम्हाला सामान्यपणे जगू देत नाहीत.',
    body8:
      'डॉक्टर, दाई किंवा औषधविक्रेते तुम्हाला लक्षणे तुम्ही वापरत असलेल्या पद्धतीशी जोडलेली असू शकतात का आणि ती जुळवावी लागेल का हे ठरवण्यास मदत करू शकतात.',
    body9:
      'काही चिन्हे असामान्य असतात आणि त्वरित वैद्यकीय मूल्यांकन मागतात. ती गुंतागुंत असल्याचे दर्शवतातच असे नाही, पण त्यांकडे दुर्लक्ष करू नये.',
    alertTitle: 'लगेच वैद्यकीय काळजी घ्या',
    alertIntro: 'तुम्हाला विशेषतः यांपैकी काही असल्यास त्वरित वैद्यकीय सल्ला घ्या:',
    urgentSigns: [
      'लक्षणीय किंवा असामान्य छातीदुखी',
      'अचानक श्वास घेण्यात अडचण',
      'पायात असामान्य सूज किंवा वेदना',
      'अचानक येणारी, खूप तीव्र किंवा असामान्य डोकेदुखी',
      'दृष्टी, बोलणे किंवा ताकदीत अचानक अडचण',
    ],
    emergencyTitle: 'गंभीर परिस्थितीत',
    emergencyText:
      'लक्षणे अचानक, खूप तीव्र असल्यास, किंवा श्वास घेण्यात अडचण, चक्कर येऊन पडल्यासारखे वाटणे किंवा इतर गंभीर चिन्हासोबत येत असल्यास, तातडीची वैद्यकीय मदत घ्या.',
    summaryTitle: 'मुख्य मुद्दे',
    summaryItems: [
      'नवीन हार्मोनल गर्भनिरोधक पद्धतीच्या सुरुवातीला काही परिणाम दिसू शकतात.',
      'अनेक परिणाम तात्पुरते असतात आणि कालांतराने कमी होऊ शकतात.',
      'त्रासदायक किंवा कायम राहणाऱ्या लक्षणाबद्दल तज्ज्ञाशी चर्चा करणे योग्य आहे.',
      'काही असामान्य चिन्हांसाठी त्वरित वैद्यकीय सल्ला आवश्यक आहे.',
    ],
    finalTipTitle: 'मुख्य मुद्दा',
    finalTipText:
      'तुमच्या शरीराचे ऐकणे म्हणजे पद्धत लगेच थांबवणे असे नाही. तुम्हाला जे जाणवते ते नोंदवा, ते कसे बदलते ते पाहा आणि एखादे लक्षण तुम्हाला काळजीत टाकेल तेव्हा सल्ला घ्या.',
    disclaimerText:
      'हा लेख माहितीसाठी आहे आणि वैयक्तिक वैद्यकीय सल्ल्याची जागा घेत नाही. तुम्हाला लक्षणीय किंवा असामान्य लक्षण असल्यास, आरोग्य व्यावसायिकाचा सल्ला घ्या.',
    shareMessage: 'संभाव्य दुष्परिणाम ओळखणे — AWA',
  },
  gu: {
    badge: 'આડઅસરો',
    title: 'સંભવિત આડઅસરો\nઓળખવી',
    metaDuration: '8 મિનિટ વાંચન',
    metaType: 'લેખ',
    metaLevel: 'મધ્યમ સ્તર',
    metaValidated: 'પુનરાવલોકન કરેલી સામગ્રી',
    intro:
      'કેટલીક અસરો સામાન્ય અને અસ્થાયી હોઈ શકે. બીજી વધુ ધ્યાન માગે છે. સામાન્ય પ્રતિક્રિયાઓ અને તપાસવા જેવાં ચિહ્નો વચ્ચેનો તફાવત ઓળખતાં શીખો.',
    contentsTitle: 'આ લેખમાં',
    topics: [
      'સામાન્ય, હળવી અસરો',
      'શરીરનો સમાયોજન સમયગાળો',
      'શું બદલાય છે તે જોવું',
      'તબીબી સલાહ ક્યારે લેવી',
      'સારવાર ક્યારે તરત લેવી',
      'મુખ્ય મુદ્દા',
    ],
    body1:
      'જ્યારે કોઈ નવી હોર્મોનલ ગર્ભનિરોધન પદ્ધતિ શરૂ કરે છે, ત્યારે શરીરને ગોઠવાવા માટે થોડો સમય જોઈએ. ચક્ર, મૂડ કે શારીરિક આરામમાં નાના ફેરફારો દેખાઈ શકે.',
    body2:
      'આ અસરો ઘણી વાર હળવી હોય છે અને ધીમે ધીમે ઓછી થઈ શકે. તેમની હાજરીનો અર્થ આપોઆપ એવો નથી કે પદ્ધતિ જોખમી છે કે તેને બંધ કરવી જરૂરી છે.',
    commonEffects: [
      {
        title: 'હળવો રક્તસ્રાવ',
        text: 'અનિયમિત રક્તસ્રાવ થઈ શકે, ખાસ કરીને નવી પદ્ધતિની શરૂઆતમાં.',
      },
      {
        title: 'સ્તનમાં કોમળતા',
        text: 'સ્તનમાં તણાવ કે કોમળતા અસ્થાયી રૂપે અનુભવાઈ શકે.',
      },
      {
        title: 'મૂડ',
        text: 'કેટલાક લોકોને મૂડમાં ફેરફાર કે લાગણીઓની વધુ સંવેદનશીલતા જણાય છે.',
      },
      {
        title: 'માથાનો દુખાવો',
        text: 'સમાયોજનના સમયગાળા દરમિયાન હળવો માથાનો દુખાવો થઈ શકે.',
      },
    ],
    body3:
      'પહેલાં થોડા અઠવાડિયાં કે ચક્રો તમે પહેલાં ટેવાયેલા હતા તેનાથી અલગ હોઈ શકે. શરીર નવા હોર્મોનલ સંતુલન સાથે ધીમે ધીમે ગોઠવાઈ શકે.',
    tip1Title: 'જાણવા જેવું',
    tip1Text:
      'પદ્ધતિ શરૂ કર્યા પછી થોડા સમયમાં દેખાતી અસર સમય જતાં જોવી યોગ્ય છે. જો તે તકલીફ આપે કે ચાલુ રહે, તો આરોગ્ય વ્યાવસાયિક સાથે વાત કરો.',
    body4:
      'તમારી એપમાં લક્ષણો નોંધવાથી એક ચક્રથી બીજા ચક્રમાં તે કેવી રીતે બદલાય છે તે વધુ સારી રીતે જોઈ શકાય.',
    trackingTitle: 'ફેરફારો પર નજર રાખો',
    trackingSubtitle: 'કેટલાક માપદંડ ઉપયોગી થઈ શકે',
    trackingLines: [
      'લક્ષણ દેખાયાની તારીખ નોંધો.',
      'તેની તીવ્રતા અને સમયગાળો નોંધો.',
      'તે સુધરે છે કે વધુ ખરાબ થાય છે તે જુઓ.',
    ],
    body5:
      'બધાં લક્ષણો ગર્ભનિરોધન સાથે જ જોડાયેલાં હોય તે જરૂરી નથી. તણાવ, ઊંઘ, આહાર, તમારું ચક્ર કે બીજી સારવારો પણ તમને કેવું લાગે છે તેના પર અસર કરી શકે.',
    body6:
      'પરિસ્થિતિ સમજવા માટે, એક અલગ લક્ષણને બદલે સમગ્ર સંદર્ભ જોવાનો પ્રયાસ કરો.',
    worthMentioning: [
      'સ્પષ્ટ, સતત મૂડમાં ફેરફાર',
      'તમને પરેશાન કરતો કામેચ્છામાં ઘટાડો',
      '3 ચક્રથી વધુ ચાલતો અનિયમિત રક્તસ્રાવ',
      'ઉબકા કે માથાનો દુખાવો જે તકલીફ આપતા રહે',
    ],
    questionsTitle: 'કેટલાક ઉપયોગી પ્રશ્નો',
    questions: [
      'આ લક્ષણો કેટલા સમયથી ચાલે છે?',
      'શું તે ગર્ભનિરોધન પદ્ધતિ શરૂ કર્યા કે બદલ્યા પછી દેખાયાં?',
      'શું તે હળવાં છે, તકલીફ આપે છે કે તમારા માટે ખરેખર અસામાન્ય છે?',
      'શું તે સમય સાથે સુધરી રહ્યાં છે કે વધુ વારંવાર થઈ રહ્યાં છે?',
    ],
    body7:
      'લક્ષણ તાત્કાલિક ન હોય તો પણ, જો તે તકલીફ આપે, ચાલુ રહે કે તમારા જીવનની ગુણવત્તાને ખરેખર અસર કરે, તો તેના વિશે વાત કરવી યોગ્ય છે.',
    infoTitle: 'સલાહ લેવી યોગ્ય હોઈ શકે જો…',
    infoText:
      'લક્ષણો ચાલુ રહે, વધુ ગંભીર બને કે તમને સામાન્ય રીતે જીવવા ન દે.',
    body8:
      'ડૉક્ટર, મિડવાઇફ કે ફાર્માસિસ્ટ નક્કી કરવામાં મદદ કરી શકે કે લક્ષણો તમે વાપરતા હો તે પદ્ધતિ સાથે જોડાયેલાં હોઈ શકે કે નહીં અને તેમાં ફેરફાર કરવો જરૂરી છે કે નહીં.',
    body9:
      'કેટલાંક ચિહ્નો અસામાન્ય હોય છે અને તાત્કાલિક તબીબી મૂલ્યાંકન માગે છે. તેમનો અર્થ જરૂરી નથી કે કોઈ જટિલતા છે, પણ તેમને અવગણવાં ન જોઈએ.',
    alertTitle: 'તરત સારવાર લો',
    alertIntro: 'જો તમને ખાસ કરીને આમાંનું કંઈ થાય, તો તરત તબીબી સલાહ લો:',
    urgentSigns: [
      'છાતીમાં નોંધપાત્ર કે અસામાન્ય દુખાવો',
      'અચાનક શ્વાસ લેવામાં તકલીફ',
      'પગમાં અસામાન્ય સોજો કે દુખાવો',
      'અચાનક, ખૂબ તીવ્ર કે અસામાન્ય માથાનો દુખાવો',
      'દૃષ્ટિ, વાણી કે શક્તિમાં અચાનક તકલીફ',
    ],
    emergencyTitle: 'ગંભીર પરિસ્થિતિના કિસ્સામાં',
    emergencyText:
      'જો લક્ષણો અચાનક હોય, ખૂબ ગંભીર હોય, અથવા શ્વાસ લેવામાં તકલીફ, બેભાન થઈ જવાની લાગણી કે બીજા ગંભીર ચિહ્ન સાથે આવે, તો તાત્કાલિક તબીબી મદદ લો.',
    summaryTitle: 'મુખ્ય સાર',
    summaryItems: [
      'નવી હોર્મોનલ ગર્ભનિરોધન પદ્ધતિની શરૂઆતમાં કેટલીક અસરો દેખાઈ શકે.',
      'ઘણી અસરો અસ્થાયી હોય છે અને સમય સાથે ઓછી થઈ શકે.',
      'તકલીફ આપતા કે સતત લક્ષણ વિશે વ્યાવસાયિક સાથે વાત કરવી યોગ્ય છે.',
      'કેટલાંક અસામાન્ય ચિહ્નોમાં તાત્કાલિક તબીબી સલાહ જરૂરી છે.',
    ],
    finalTipTitle: 'મુખ્ય મુદ્દો',
    finalTipText:
      'તમારા શરીરને સાંભળવાનો અર્થ જરૂરી નથી કે પદ્ધતિ તરત બંધ કરી દેવી. તમને શું લાગે છે તે નોંધો, તે કેવી રીતે બદલાય છે તે જુઓ, અને જ્યારે કોઈ લક્ષણ ચિંતા કરાવે ત્યારે સલાહ માગો.',
    disclaimerText:
      'આ લેખ માહિતી માટે છે અને વ્યક્તિગત તબીબી સલાહનું સ્થાન લેતો નથી. જો તમને કોઈ ગંભીર કે અસામાન્ય લક્ષણ હોય, તો આરોગ્ય વ્યાવસાયિક પાસેથી સલાહ લો.',
    shareMessage: 'સંભવિત આડઅસરો ઓળખવી — AWA',
  },
  pa: {
    badge: 'ਮਾੜੇ ਪ੍ਰਭਾਵ',
    title: 'ਸੰਭਵ ਮਾੜੇ ਪ੍ਰਭਾਵਾਂ ਨੂੰ\nਪਛਾਣਨਾ',
    metaDuration: '8 ਮਿੰਟ ਪੜ੍ਹਨ',
    metaType: 'ਲੇਖ',
    metaLevel: 'ਦਰਮਿਆਨਾ ਪੱਧਰ',
    metaValidated: 'ਸਮੀਖਿਆ ਕੀਤੀ ਸਮੱਗਰੀ',
    intro:
      'ਕੁਝ ਪ੍ਰਭਾਵ ਆਮ ਅਤੇ ਅਸਥਾਈ ਹੋ ਸਕਦੇ ਹਨ। ਹੋਰਾਂ ਵੱਲ ਵਧੇਰੇ ਧਿਆਨ ਦੇਣ ਦੀ ਲੋੜ ਹੁੰਦੀ ਹੈ। ਆਮ ਪ੍ਰਤੀਕਰਮਾਂ ਅਤੇ ਜਾਂਚ ਯੋਗ ਸੰਕੇਤਾਂ ਵਿੱਚ ਫ਼ਰਕ ਕਰਨਾ ਸਿੱਖੋ।',
    contentsTitle: 'ਇਸ ਲੇਖ ਵਿੱਚ',
    topics: [
      'ਆਮ, ਹਲਕੇ ਪ੍ਰਭਾਵ',
      'ਸਰੀਰ ਦੇ ਢਲਣ ਦਾ ਸਮਾਂ',
      'ਇਹ ਵੇਖਣਾ ਕਿ ਕੀ ਬਦਲਦਾ ਹੈ',
      'ਡਾਕਟਰੀ ਸਲਾਹ ਕਦੋਂ ਲੈਣੀ ਹੈ',
      'ਇਲਾਜ ਲਈ ਜਲਦੀ ਕਦੋਂ ਜਾਣਾ ਹੈ',
      'ਮੁੱਖ ਨੁਕਤੇ',
    ],
    body1:
      'ਜਦੋਂ ਕੋਈ ਔਰਤ ਹਾਰਮੋਨ ਵਾਲਾ ਨਵਾਂ ਗਰਭ ਨਿਰੋਧ ਤਰੀਕਾ ਸ਼ੁਰੂ ਕਰਦੀ ਹੈ, ਤਾਂ ਸਰੀਰ ਨੂੰ ਢਲਣ ਲਈ ਕੁਝ ਸਮਾਂ ਲੱਗ ਸਕਦਾ ਹੈ। ਮਾਹਵਾਰੀ ਚੱਕਰ, ਮੂਡ ਜਾਂ ਸਰੀਰਕ ਆਰਾਮ ਵਿੱਚ ਛੋਟੇ ਬਦਲਾਅ ਆ ਸਕਦੇ ਹਨ।',
    body2:
      'ਇਹ ਪ੍ਰਭਾਵ ਅਕਸਰ ਹਲਕੇ ਹੁੰਦੇ ਹਨ ਅਤੇ ਹੌਲੀ-ਹੌਲੀ ਘਟ ਸਕਦੇ ਹਨ। ਇਨ੍ਹਾਂ ਦੀ ਮੌਜੂਦਗੀ ਦਾ ਆਪਣੇ ਆਪ ਇਹ ਮਤਲਬ ਨਹੀਂ ਕਿ ਤਰੀਕਾ ਖ਼ਤਰਨਾਕ ਹੈ ਜਾਂ ਉਸ ਨੂੰ ਬੰਦ ਕਰਨਾ ਚਾਹੀਦਾ ਹੈ।',
    commonEffects: [
      {
        title: 'ਹਲਕਾ ਖ਼ੂਨ',
        text: 'ਬੇਨਿਯਮਾ ਖ਼ੂਨ ਆ ਸਕਦਾ ਹੈ, ਖ਼ਾਸ ਕਰਕੇ ਨਵੇਂ ਤਰੀਕੇ ਦੀ ਸ਼ੁਰੂਆਤ ਵਿੱਚ।',
      },
      {
        title: 'ਛਾਤੀ ਵਿੱਚ ਨਾਜ਼ੁਕਪਣ',
        text: 'ਛਾਤੀ ਵਿੱਚ ਕਸਾਅ ਜਾਂ ਨਾਜ਼ੁਕਪਣ ਅਸਥਾਈ ਤੌਰ ਉੱਤੇ ਮਹਿਸੂਸ ਹੋ ਸਕਦਾ ਹੈ।',
      },
      {
        title: 'ਮੂਡ',
        text: 'ਕੁਝ ਔਰਤਾਂ ਮੂਡ ਵਿੱਚ ਬਦਲਾਅ ਜਾਂ ਵਧੀ ਹੋਈ ਭਾਵਨਾਤਮਕ ਸੰਵੇਦਨਸ਼ੀਲਤਾ ਮਹਿਸੂਸ ਕਰਦੀਆਂ ਹਨ।',
      },
      {
        title: 'ਸਿਰ ਦਰਦ',
        text: 'ਢਲਣ ਦੇ ਸਮੇਂ ਦੌਰਾਨ ਹਲਕਾ ਸਿਰ ਦਰਦ ਹੋ ਸਕਦਾ ਹੈ।',
      },
    ],
    body3:
      'ਪਹਿਲੇ ਕੁਝ ਹਫ਼ਤੇ ਜਾਂ ਚੱਕਰ ਉਸ ਤੋਂ ਵੱਖਰੇ ਹੋ ਸਕਦੇ ਹਨ ਜਿਸ ਦੀ ਤੁਹਾਨੂੰ ਪਹਿਲਾਂ ਆਦਤ ਸੀ। ਸਰੀਰ ਨਵੇਂ ਹਾਰਮੋਨ ਸੰਤੁਲਨ ਨਾਲ ਹੌਲੀ-ਹੌਲੀ ਢਲ ਸਕਦਾ ਹੈ।',
    tip1Title: 'ਜਾਣਨ ਯੋਗ',
    tip1Text:
      'ਜੋ ਪ੍ਰਭਾਵ ਤਰੀਕਾ ਸ਼ੁਰੂ ਕਰਨ ਤੋਂ ਥੋੜ੍ਹੇ ਸਮੇਂ ਬਾਅਦ ਦਿਸੇ, ਉਸ ਨੂੰ ਸਮੇਂ ਦੇ ਨਾਲ ਵੇਖਣਾ ਚਾਹੀਦਾ ਹੈ। ਜੇ ਉਹ ਪਰੇਸ਼ਾਨ ਕਰਨ ਲੱਗੇ ਜਾਂ ਬਣਿਆ ਰਹੇ, ਤਾਂ ਸਿਹਤ ਮਾਹਿਰ ਨਾਲ ਗੱਲ ਕਰੋ।',
    body4:
      'ਇੱਕ ਚੱਕਰ ਤੋਂ ਦੂਜੇ ਤੱਕ ਲੱਛਣਾਂ ਦੇ ਬਦਲਣ ਨੂੰ ਬਿਹਤਰ ਢੰਗ ਨਾਲ ਵੇਖਣ ਲਈ ਆਪਣੀ ਐਪ ਵਿੱਚ ਲੱਛਣ ਦਰਜ ਕਰਨਾ ਮਦਦਗਾਰ ਹੋ ਸਕਦਾ ਹੈ।',
    trackingTitle: 'ਵੇਖੋ ਕਿ ਚੀਜ਼ਾਂ ਕਿਵੇਂ ਬਦਲਦੀਆਂ ਹਨ',
    trackingSubtitle: 'ਕੁਝ ਨਿਸ਼ਾਨੀਆਂ ਮਦਦਗਾਰ ਹੋ ਸਕਦੀਆਂ ਹਨ',
    trackingLines: [
      'ਲੱਛਣ ਦੇ ਸ਼ੁਰੂ ਹੋਣ ਦੀ ਤਾਰੀਖ਼ ਲਿਖੋ।',
      'ਉਸ ਦੀ ਤੀਬਰਤਾ ਅਤੇ ਮਿਆਦ ਦਰਜ ਕਰੋ।',
      'ਵੇਖੋ ਕਿ ਉਹ ਸੁਧਰਦਾ ਹੈ ਜਾਂ ਵਿਗੜਦਾ ਹੈ।',
    ],
    body5:
      'ਸਾਰੇ ਲੱਛਣ ਜ਼ਰੂਰੀ ਤੌਰ ਉੱਤੇ ਗਰਭ ਨਿਰੋਧ ਨਾਲ ਜੁੜੇ ਨਹੀਂ ਹੁੰਦੇ। ਤਣਾਅ, ਨੀਂਦ, ਖ਼ੁਰਾਕ, ਤੁਹਾਡਾ ਚੱਕਰ ਜਾਂ ਹੋਰ ਇਲਾਜ ਵੀ ਤੁਹਾਡੇ ਮਹਿਸੂਸ ਕਰਨ ਨੂੰ ਪ੍ਰਭਾਵਿਤ ਕਰ ਸਕਦੇ ਹਨ।',
    body6:
      'ਹਾਲਤ ਨੂੰ ਸਮਝਣ ਲਈ, ਕਿਸੇ ਇੱਕ ਲੱਛਣ ਨੂੰ ਇਕੱਲਾ ਵੇਖਣ ਦੀ ਬਜਾਏ ਪੂਰੇ ਸੰਦਰਭ ਨੂੰ ਵੇਖਣ ਦੀ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
    worthMentioning: [
      'ਮੂਡ ਵਿੱਚ ਸਾਫ਼ ਅਤੇ ਲਗਾਤਾਰ ਬਦਲਾਅ',
      'ਜਿਨਸੀ ਇੱਛਾ ਵਿੱਚ ਕਮੀ ਜੋ ਤੁਹਾਨੂੰ ਪਰੇਸ਼ਾਨ ਕਰੇ',
      '3 ਚੱਕਰਾਂ ਤੋਂ ਵੱਧ ਚੱਲਣ ਵਾਲਾ ਬੇਨਿਯਮਾ ਖ਼ੂਨ',
      'ਜੀ ਕੱਚਾ ਹੋਣਾ ਜਾਂ ਸਿਰ ਦਰਦ ਜੋ ਪਰੇਸ਼ਾਨ ਕਰਦੇ ਰਹਿਣ',
    ],
    questionsTitle: 'ਕੁਝ ਮਦਦਗਾਰ ਸਵਾਲ',
    questions: [
      'ਇਹ ਲੱਛਣ ਕਿੰਨੇ ਸਮੇਂ ਤੋਂ ਚੱਲ ਰਹੇ ਹਨ?',
      'ਕੀ ਇਹ ਗਰਭ ਨਿਰੋਧ ਤਰੀਕਾ ਸ਼ੁਰੂ ਕਰਨ ਜਾਂ ਬਦਲਣ ਤੋਂ ਬਾਅਦ ਆਏ?',
      'ਕੀ ਇਹ ਹਲਕੇ ਹਨ, ਪਰੇਸ਼ਾਨ ਕਰਨ ਵਾਲੇ ਹਨ, ਜਾਂ ਤੁਹਾਡੇ ਲਈ ਸੱਚਮੁੱਚ ਅਸਾਧਾਰਨ ਹਨ?',
      'ਕੀ ਇਹ ਸਮੇਂ ਨਾਲ ਸੁਧਰ ਰਹੇ ਹਨ ਜਾਂ ਵਧੇਰੇ ਵਾਰ ਆ ਰਹੇ ਹਨ?',
    ],
    body7:
      'ਭਾਵੇਂ ਕੋਈ ਲੱਛਣ ਜ਼ਰੂਰੀ ਨਾ ਹੋਵੇ, ਜੇ ਉਹ ਪਰੇਸ਼ਾਨ ਕਰਨ ਲੱਗੇ, ਬਣਿਆ ਰਹੇ ਜਾਂ ਤੁਹਾਡੀ ਜ਼ਿੰਦਗੀ ਦੀ ਗੁਣਵੱਤਾ ਨੂੰ ਸੱਚਮੁੱਚ ਪ੍ਰਭਾਵਿਤ ਕਰੇ, ਤਾਂ ਉਸ ਬਾਰੇ ਗੱਲ ਕਰਨਾ ਚੰਗਾ ਹੋ ਸਕਦਾ ਹੈ।',
    infoTitle: 'ਸਲਾਹ ਲੈਣੀ ਚੰਗੀ ਹੋ ਸਕਦੀ ਹੈ ਜੇ…',
    infoText:
      'ਲੱਛਣ ਬਣੇ ਰਹਿਣ, ਵਧੇਰੇ ਗੰਭੀਰ ਹੋ ਜਾਣ, ਜਾਂ ਤੁਹਾਨੂੰ ਆਮ ਜ਼ਿੰਦਗੀ ਜਿਉਣ ਤੋਂ ਰੋਕਣ।',
    body8:
      'ਡਾਕਟਰ, ਮਿਡਵਾਈਫ਼ ਜਾਂ ਫ਼ਾਰਮਾਸਿਸਟ ਇਹ ਤੈਅ ਕਰਨ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹੈ ਕਿ ਕੀ ਲੱਛਣ ਤੁਹਾਡੇ ਵਰਤੇ ਜਾ ਰਹੇ ਤਰੀਕੇ ਨਾਲ ਜੁੜੇ ਹੋ ਸਕਦੇ ਹਨ ਅਤੇ ਕੀ ਉਸ ਨੂੰ ਬਦਲਣ ਦੀ ਲੋੜ ਹੈ।',
    body9:
      'ਕੁਝ ਸੰਕੇਤ ਅਸਾਧਾਰਨ ਹੁੰਦੇ ਹਨ ਅਤੇ ਤੁਰੰਤ ਡਾਕਟਰੀ ਜਾਂਚ ਮੰਗਦੇ ਹਨ। ਇਨ੍ਹਾਂ ਦਾ ਜ਼ਰੂਰੀ ਤੌਰ ਉੱਤੇ ਇਹ ਮਤਲਬ ਨਹੀਂ ਕਿ ਕੋਈ ਪੇਚੀਦਗੀ ਹੈ, ਪਰ ਇਨ੍ਹਾਂ ਨੂੰ ਅਣਡਿੱਠ ਨਹੀਂ ਕਰਨਾ ਚਾਹੀਦਾ।',
    alertTitle: 'ਜਲਦੀ ਇਲਾਜ ਲਵੋ',
    alertIntro: 'ਜੇ ਤੁਹਾਨੂੰ ਖ਼ਾਸ ਤੌਰ ਉੱਤੇ ਇਹ ਹੋਵੇ ਤਾਂ ਜਲਦੀ ਡਾਕਟਰੀ ਸਲਾਹ ਲਵੋ:',
    urgentSigns: [
      'ਛਾਤੀ ਵਿੱਚ ਤੇਜ਼ ਜਾਂ ਅਸਾਧਾਰਨ ਦਰਦ',
      'ਅਚਾਨਕ ਸਾਹ ਲੈਣ ਵਿੱਚ ਔਖ',
      'ਲੱਤ ਵਿੱਚ ਅਸਾਧਾਰਨ ਸੋਜ ਜਾਂ ਦਰਦ',
      'ਅਚਾਨਕ, ਬਹੁਤ ਤੇਜ਼ ਜਾਂ ਅਸਾਧਾਰਨ ਸਿਰ ਦਰਦ',
      'ਨਜ਼ਰ, ਬੋਲਣ ਜਾਂ ਤਾਕਤ ਵਿੱਚ ਅਚਾਨਕ ਦਿੱਕਤ',
    ],
    emergencyTitle: 'ਗੰਭੀਰ ਹਾਲਤ ਵਿੱਚ',
    emergencyText:
      'ਜੇ ਲੱਛਣ ਅਚਾਨਕ ਹੋਣ, ਬਹੁਤ ਗੰਭੀਰ ਹੋਣ, ਜਾਂ ਸਾਹ ਲੈਣ ਵਿੱਚ ਔਖ, ਬੇਹੋਸ਼ੀ ਮਹਿਸੂਸ ਹੋਣ ਜਾਂ ਕਿਸੇ ਹੋਰ ਗੰਭੀਰ ਸੰਕੇਤ ਨਾਲ ਆਉਣ, ਤਾਂ ਤੁਰੰਤ ਡਾਕਟਰੀ ਮਦਦ ਲਵੋ।',
    summaryTitle: 'ਜ਼ਰੂਰੀ ਗੱਲਾਂ',
    summaryItems: [
      'ਹਾਰਮੋਨ ਵਾਲੇ ਨਵੇਂ ਗਰਭ ਨਿਰੋਧ ਤਰੀਕੇ ਦੀ ਸ਼ੁਰੂਆਤ ਵਿੱਚ ਕੁਝ ਪ੍ਰਭਾਵ ਦਿਖ ਸਕਦੇ ਹਨ।',
      'ਕਈ ਪ੍ਰਭਾਵ ਅਸਥਾਈ ਹੁੰਦੇ ਹਨ ਅਤੇ ਸਮੇਂ ਨਾਲ ਘਟ ਸਕਦੇ ਹਨ।',
      'ਪਰੇਸ਼ਾਨ ਕਰਨ ਵਾਲੇ ਜਾਂ ਲਗਾਤਾਰ ਲੱਛਣ ਬਾਰੇ ਮਾਹਿਰ ਨਾਲ ਗੱਲ ਕਰਨੀ ਚੰਗੀ ਹੈ।',
      'ਕੁਝ ਅਸਾਧਾਰਨ ਸੰਕੇਤਾਂ ਲਈ ਤੁਰੰਤ ਡਾਕਟਰੀ ਸਲਾਹ ਦੀ ਲੋੜ ਹੁੰਦੀ ਹੈ।',
    ],
    finalTipTitle: 'ਮੁੱਖ ਨੁਕਤਾ',
    finalTipText:
      'ਆਪਣੇ ਸਰੀਰ ਦੀ ਸੁਣਨ ਦਾ ਜ਼ਰੂਰੀ ਮਤਲਬ ਕਿਸੇ ਤਰੀਕੇ ਨੂੰ ਤੁਰੰਤ ਬੰਦ ਕਰਨਾ ਨਹੀਂ ਹੈ। ਜੋ ਮਹਿਸੂਸ ਹੋ ਰਿਹਾ ਹੈ ਉਹ ਲਿਖੋ, ਵੇਖੋ ਕਿ ਉਹ ਕਿਵੇਂ ਬਦਲਦਾ ਹੈ, ਅਤੇ ਜਦੋਂ ਵੀ ਕੋਈ ਲੱਛਣ ਚਿੰਤਾ ਕਰੇ ਤਾਂ ਸਲਾਹ ਮੰਗੋ।',
    disclaimerText:
      'ਇਹ ਲੇਖ ਜਾਣਕਾਰੀ ਲਈ ਹੈ ਅਤੇ ਨਿੱਜੀ ਡਾਕਟਰੀ ਸਲਾਹ ਦੀ ਥਾਂ ਨਹੀਂ ਲੈਂਦਾ। ਜੇ ਤੁਹਾਨੂੰ ਕੋਈ ਵੱਡਾ ਜਾਂ ਅਸਾਧਾਰਨ ਲੱਛਣ ਹੋਵੇ, ਤਾਂ ਸਿਹਤ ਮਾਹਿਰ ਤੋਂ ਸਲਾਹ ਲਵੋ।',
    shareMessage: 'ਸੰਭਵ ਮਾੜੇ ਪ੍ਰਭਾਵਾਂ ਨੂੰ ਪਛਾਣਨਾ — AWA',
  },
  my: {
    badge: 'ဘေးထွက်ဆိုးကျိုးများ',
    title: 'ဖြစ်နိုင်ခြေရှိသော\nဘေးထွက်ဆိုးကျိုးများကို သိရှိခြင်း',
    metaDuration: 'ဖတ်ချိန် 8 မိနစ်',
    metaType: 'ဆောင်းပါး',
    metaLevel: 'အလယ်အလတ်အဆင့်',
    metaValidated: 'ပြန်လည်သုံးသပ်ပြီး အကြောင်းအရာ',
    intro:
      'အချို့သက်ရောက်မှုများသည် ဖြစ်လေ့ရှိပြီး ယာယီသာဖြစ်နိုင်သည်။ အခြားအချို့မှာ ပိုမိုဂရုစိုက်ရန် လိုအပ်သည်။ ပုံမှန်တုံ့ပြန်မှုများနှင့် အကဲဖြတ်သင့်သော လက္ခဏာများကြား ကွာခြားချက်ကို ခွဲခြားသိရှိရန် သင်ယူပါ။',
    contentsTitle: 'ဤဆောင်းပါးတွင်',
    topics: [
      'ဖြစ်လေ့ရှိသော ပေါ့ပါးသည့် သက်ရောက်မှုများ',
      'ခန္ဓာကိုယ်၏ လိုက်လျောညီထွေဖြစ်ရာကာလ',
      'ပြောင်းလဲသည်များကို စောင့်ကြည့်ခြင်း',
      'ဆေးဘက်ဆိုင်ရာ အကြံဉာဏ်ကို ဘယ်အချိန်မေးသင့်သလဲ',
      'ဘယ်အချိန် အမြန်ကုသမှုခံယူသင့်သလဲ',
      'အဓိကအချက်များ',
    ],
    body1:
      'တစ်စုံတစ်ယောက်သည် ဟော်မုန်းသုံး ကိုယ်ဝန်တားနည်းအသစ်ကို စတင်သောအခါ ခန္ဓာကိုယ်သည် လိုက်လျောညီထွေဖြစ်ရန် အချိန်အနည်းငယ် လိုအပ်နိုင်သည်။ ရာသီစက်ဝန်း၊ စိတ်ခံစားမှု သို့မဟုတ် ကိုယ်ခန္ဓာသက်သာမှုတွင် ပြောင်းလဲမှုသေးသေးလေးများ ပေါ်လာနိုင်သည်။',
    body2:
      'ဤသက်ရောက်မှုများသည် မကြာခဏ ပေါ့ပါးပြီး တဖြည်းဖြည်း လျော့နည်းသွားနိုင်သည်။ ၎င်းတို့ ရှိနေခြင်းသည် နည်းလမ်းသည် အန္တရာယ်ရှိသည် သို့မဟုတ် ရပ်ရန်လိုသည်ဟု အလိုအလျောက် မဆိုလိုပါ။',
    commonEffects: [
      {
        title: 'သွေးအနည်းငယ်ထွက်ခြင်း',
        text: 'မပုံမှန်သွေးထွက်ခြင်း ဖြစ်နိုင်သည်၊ အထူးသဖြင့် နည်းလမ်းအသစ်စတင်ချိန်တွင်။',
      },
      {
        title: 'ရင်သားနာခြင်း',
        text: 'ရင်သားတင်းခြင်း သို့မဟုတ် နာခြင်းကို ယာယီခံစားရနိုင်သည်။',
      },
      {
        title: 'စိတ်ခံစားမှု',
        text: 'အချို့သူများသည် စိတ်ခံစားမှု ပြောင်းလဲခြင်း သို့မဟုတ် စိတ်ထိခိုက်လွယ်မှု တိုးလာသည်ကို သတိပြုမိကြသည်။',
      },
      {
        title: 'ခေါင်းကိုက်ခြင်း',
        text: 'လိုက်လျောညီထွေဖြစ်ရာကာလအတွင်း ပေါ့ပါးသော ခေါင်းကိုက်ခြင်း ဖြစ်နိုင်သည်။',
      },
    ],
    body3:
      'ပထမသီတင်းပတ်အနည်းငယ် သို့မဟုတ် ရာသီစက်ဝန်းအနည်းငယ်သည် သင်ယခင်ကျင့်သားရထားသည်နှင့် ကွဲပြားနိုင်သည်။ ခန္ဓာကိုယ်သည် ဟော်မုန်းမျှခြေအသစ်သို့ တဖြည်းဖြည်း လိုက်လျောညီထွေဖြစ်လာနိုင်သည်။',
    tip1Title: 'သိထားသင့်သည်',
    tip1Text:
      'နည်းလမ်းတစ်ခု စတင်ပြီးမကြာမီ ပေါ်လာသော သက်ရောက်မှုကို အချိန်ကြာလာသည်နှင့်အမျှ စောင့်ကြည့်သင့်သည်။ အနှောင့်အယှက်ဖြစ်လာလျှင် သို့မဟုတ် ဆက်ရှိနေလျှင် ကျန်းမာရေးပညာရှင်နှင့် ပြောဆိုပါ။',
    body4:
      'ရာသီစက်ဝန်းတစ်ခုမှ နောက်တစ်ခုသို့ ပြောင်းလဲပုံကို ပိုကောင်းစွာ မှတ်သားရန် သင့်အက်ပ်တွင် ရောဂါလက္ခဏာများကို မှတ်တမ်းတင်ခြင်းက အသုံးဝင်နိုင်သည်။',
    trackingTitle: 'ပြောင်းလဲပုံကို မှတ်သားပါ',
    trackingSubtitle: 'အမှတ်အသားအချို့က အသုံးဝင်နိုင်သည်',
    trackingLines: [
      'ရောဂါလက္ခဏာ ပေါ်လာသော ရက်စွဲကို မှတ်ပါ။',
      'ပြင်းထန်မှုနှင့် ကြာချိန်ကို မှတ်တမ်းတင်ပါ။',
      'ကောင်းလာသလား ဆိုးလာသလားကို စောင့်ကြည့်ပါ။',
    ],
    body5:
      'ရောဂါလက္ခဏာအားလုံးသည် ကိုယ်ဝန်တားခြင်းနှင့် ဆက်စပ်နေရန် မလိုပါ။ စိတ်ဖိစီးမှု၊ အိပ်စက်ခြင်း၊ အစားအသောက်၊ သင့်ရာသီစက်ဝန်း သို့မဟုတ် အခြားကုထုံးများသည်လည်း သင့်ခံစားချက်ကို ထိခိုက်နိုင်သည်။',
    body6:
      'အခြေအနေကို နားလည်ရန် ရောဂါလက္ခဏာတစ်ခုတည်းကို သီးခြားကြည့်မည့်အစား အလုံးစုံအခြေအနေကို ကြည့်ရန် ကြိုးစားပါ။',
    worthMentioning: [
      'သိသာပြီး ဆက်ရှိနေသော စိတ်ခံစားမှု ပြောင်းလဲခြင်း',
      'သင့်ကို အနှောင့်အယှက်ဖြစ်စေသည့် လိင်ဆန္ဒ ကျဆင်းခြင်း',
      'ရာသီစက်ဝန်း 3 ကြိမ်ထက်ပိုကြာသော မပုံမှန်သွေးထွက်ခြင်း',
      'အနှောင့်အယှက်ဖြစ်နေဆဲ ပျို့အန်ခြင်း သို့မဟုတ် ခေါင်းကိုက်ခြင်း',
    ],
    questionsTitle: 'အသုံးဝင်သော မေးခွန်းအချို့',
    questions: [
      'ဤရောဂါလက္ခဏာများ ဘယ်လောက်ကြာပြီလဲ။',
      'ကိုယ်ဝန်တားနည်းတစ်ခု စတင်ပြီးနောက် သို့မဟုတ် ပြောင်းပြီးနောက် ပေါ်လာခဲ့ပါသလား။',
      'ပေါ့ပါးသလား၊ အနှောင့်အယှက်ဖြစ်သလား၊ သင့်အတွက် တကယ်ထူးဆန်းသလား။',
      'အချိန်ကြာလာသည်နှင့်အမျှ ကောင်းလာနေသလား၊ ပိုမကြာခဏဖြစ်လာနေသလား။',
    ],
    body7:
      'ရောဂါလက္ခဏာတစ်ခုသည် အရေးပေါ်မဟုတ်သော်လည်း အနှောင့်အယှက်ဖြစ်လာလျှင်၊ ဆက်ရှိနေလျှင် သို့မဟုတ် သင့်ဘဝအရည်အသွေးကို အမှန်တကယ်ထိခိုက်လျှင် ဆွေးနွေးသင့်သည်။',
    infoTitle: 'အကြံဉာဏ်မေးသင့်နိုင်သည်မှာ…',
    infoText:
      'ရောဂါလက္ခဏာများ ဆက်ရှိနေလျှင်၊ ပိုသိသာလာလျှင် သို့မဟုတ် ပုံမှန်နေထိုင်ရန် အဟန့်အတားဖြစ်စေလျှင် ဖြစ်သည်။',
    body8:
      'ဆရာဝန်၊ သားဖွားဆရာမ သို့မဟုတ် ဆေးဆိုင်ဆရာက ရောဂါလက္ခဏာများသည် သင်သုံးနေသောနည်းလမ်းနှင့် ဆက်စပ်နိုင်မနိုင်နှင့် ညှိနှိုင်းရန်လိုမလိုကို ဆုံးဖြတ်ရန် ကူညီနိုင်သည်။',
    body9:
      'အချို့လက္ခဏာများသည် ထူးဆန်းပြီး ဆေးဘက်ဆိုင်ရာ အကဲဖြတ်မှုကို အမြန်လိုအပ်စေသည်။ ၎င်းတို့သည် ရှုပ်ထွေးမှုရှိသည်ဟု မဆိုလိုသော်လည်း လျစ်လျူမရှုသင့်ပါ။',
    alertTitle: 'အမြန်ကုသမှုခံယူပါ',
    alertIntro: 'အောက်ပါတို့ကို အထူးသဖြင့် ကြုံလာပါက ဆေးဘက်ဆိုင်ရာ အကြံဉာဏ်ကို အမြန်မေးပါ။',
    urgentSigns: [
      'သိသာသော သို့မဟုတ် ထူးဆန်းသော ရင်ဘတ်နာကျင်ခြင်း',
      'ရုတ်တရက် အသက်ရှူရခက်ခြင်း',
      'ခြေထောက်တစ်ဖက်တွင် ထူးဆန်းသော ရောင်ခြင်း သို့မဟုတ် နာကျင်ခြင်း',
      'ရုတ်တရက်ဖြစ်သော၊ အလွန်ပြင်းထန်သော သို့မဟုတ် ထူးဆန်းသော ခေါင်းကိုက်ခြင်း',
      'အမြင်၊ စကားပြောခြင်း သို့မဟုတ် အားအင်တွင် ရုတ်တရက် ပြဿနာဖြစ်ခြင်း',
    ],
    emergencyTitle: 'ပြင်းထန်သော အခြေအနေဖြစ်ပါက',
    emergencyText:
      'ရောဂါလက္ခဏာများသည် ရုတ်တရက်ဖြစ်လျှင်၊ အလွန်ပြင်းထန်လျှင် သို့မဟုတ် အသက်ရှူရခက်ခြင်း၊ မူးမေ့ချင်သလိုခံစားရခြင်း သို့မဟုတ် အခြားပြင်းထန်သောလက္ခဏာနှင့်အတူ ပါလာလျှင် အရေးပေါ်ဆေးဘက်ဆိုင်ရာ အကူအညီကို ရှာပါ။',
    summaryTitle: 'အဓိကအချက်များ',
    summaryItems: [
      'ဟော်မုန်းသုံး ကိုယ်ဝန်တားနည်းအသစ် စတင်ချိန်တွင် အချို့သက်ရောက်မှုများ ပေါ်လာနိုင်သည်။',
      'သက်ရောက်မှုများစွာသည် ယာယီဖြစ်ပြီး အချိန်ကြာလာသည်နှင့်အမျှ လျော့နည်းသွားနိုင်သည်။',
      'အနှောင့်အယှက်ဖြစ်စေသော သို့မဟုတ် ဆက်ရှိနေသော ရောဂါလက္ခဏာကို ပညာရှင်နှင့် ဆွေးနွေးသင့်သည်။',
      'အချို့ထူးဆန်းသောလက္ခဏာများသည် ဆေးဘက်ဆိုင်ရာ အကြံဉာဏ်ကို အမြန်လိုအပ်သည်။',
    ],
    finalTipTitle: 'အဓိကအချက်',
    finalTipText:
      'သင့်ခန္ဓာကိုယ်ကို နားထောင်ခြင်းသည် နည်းလမ်းတစ်ခုကို ချက်ချင်းရပ်ရမည်ဟု မဆိုလိုပါ။ သင်ခံစားရသည်ကို မှတ်သားပါ၊ မည်သို့ပြောင်းလဲသည်ကို စောင့်ကြည့်ပါ၊ ရောဂါလက္ခဏာတစ်ခုက စိုးရိမ်စေသည့်အခါတိုင်း အကြံဉာဏ်မေးပါ။',
    disclaimerText:
      'ဤဆောင်းပါးသည် အချက်အလက်ပေးရန် ရည်ရွယ်ပြီး ကိုယ်ပိုင်ဆေးဘက်ဆိုင်ရာ အကြံပြုချက်ကို အစားထိုးခြင်းမရှိပါ။ သိသာသော သို့မဟုတ် ထူးဆန်းသော ရောဂါလက္ခဏာရှိပါက ကျန်းမာရေးပညာရှင်ထံ အကြံဉာဏ်မေးပါ။',
    shareMessage: 'ဖြစ်နိုင်ခြေရှိသော ဘေးထွက်ဆိုးကျိုးများကို သိရှိခြင်း — AWA',
  },
  km: {
    badge: 'ផលប៉ះពាល់',
    title: 'ស្គាល់ផលប៉ះពាល់\nដែលអាចកើតមាន',
    metaDuration: 'អាន 8 នាទី',
    metaType: 'អត្ថបទ',
    metaLevel: 'កម្រិតមធ្យម',
    metaValidated: 'មាតិកាបានពិនិត្យ',
    intro:
      'ផលប៉ះពាល់មួយចំនួនអាចជារឿងធម្មតា ហើយបណ្តោះអាសន្ន។ ផលផ្សេងទៀតត្រូវការការយកចិត្តទុកដាក់ច្រើនជាង។ សូមរៀនបែងចែករវាងប្រតិកម្មធម្មតា និងសញ្ញាដែលគួរតែត្រូវបានវាយតម្លៃ។',
    contentsTitle: 'ក្នុងអត្ថបទនេះ',
    topics: [
      'ផលប៉ះពាល់ធម្មតាស្រាលៗ',
      'រយៈពេលនៃការសម្របខ្លួនរបស់រាងកាយ',
      'សង្កេតមើលអ្វីដែលផ្លាស់ប្តូរ',
      'ពេលណាត្រូវសុំដំបូន្មានផ្នែកពេទ្យ',
      'ពេលណាត្រូវស្វែងរកការថែទាំភ្លាមៗ',
      'ចំណុចសំខាន់ៗ',
    ],
    body1:
      'នៅពេលនរណាម្នាក់ចាប់ផ្តើមវិធីពន្យារកំណើតដោយអរម៉ូនថ្មី រាងកាយអាចត្រូវការពេលខ្លះដើម្បីសម្របខ្លួន។ ការផ្លាស់ប្តូរតិចតួចអាចលេចឡើងក្នុងវដ្តរដូវ អារម្មណ៍ ឬភាពស្រួលខ្លួន។',
    body2:
      'ផលប៉ះពាល់ទាំងនេះជាញឹកញាប់ស្រាល ហើយអាចថយចុះបន្តិចម្តងៗ។ វត្តមានរបស់វាមិនមែនមានន័យដោយស្វ័យប្រវត្តិថាវិធីនោះគ្រោះថ្នាក់ ឬត្រូវតែឈប់ប្រើទេ។',
    commonEffects: [
      {
        title: 'ដំណក់ឈាមតិចៗ',
        text: 'ការហូរឈាមមិនទៀងទាត់អាចកើតមាន ជាពិសេសនៅពេលចាប់ផ្តើមប្រើវិធីថ្មី។',
      },
      {
        title: 'ដោះឈឺ',
        text: 'អាចមានអារម្មណ៍តឹង ឬឈឺដោះជាបណ្តោះអាសន្ន។',
      },
      {
        title: 'អារម្មណ៍',
        text: 'មនុស្សមួយចំនួនកត់សម្គាល់ឃើញការប្រែប្រួលអារម្មណ៍ ឬភាពរសើបខាងអារម្មណ៍កើនឡើង។',
      },
      {
        title: 'ឈឺក្បាល',
        text: 'ការឈឺក្បាលស្រាលអាចកើតមានក្នុងអំឡុងពេលសម្របខ្លួន។',
      },
    ],
    body3:
      'សប្តាហ៍ ឬវដ្តរដូវដំបូងៗអាចខុសពីអ្វីដែលអ្នកធ្លាប់មានពីមុន។ រាងកាយអាចសម្របខ្លួនបន្តិចម្តងៗទៅនឹងតុល្យភាពអរម៉ូនថ្មី។',
    tip1Title: 'គួរដឹង',
    tip1Text:
      'ផលដែលលេចឡើងភ្លាមៗក្រោយចាប់ផ្តើមវិធីមួយ គួរតែត្រូវបានតាមដានតាមពេលវេលា។ ប្រសិនបើវាកាន់តែរំខាន ឬនៅជាប់ សូមនិយាយជាមួយអ្នកជំនាញសុខាភិបាល។',
    body4:
      'វាអាចមានប្រយោជន៍ក្នុងការកត់ត្រារោគសញ្ញាក្នុងកម្មវិធីរបស់អ្នក ដើម្បីតាមដានការប្រែប្រួលពីវដ្តរដូវមួយទៅមួយទៀតបានប្រសើរជាង។',
    trackingTitle: 'តាមដានការវិវឌ្ឍ',
    trackingSubtitle: 'សញ្ញាសម្គាល់មួយចំនួនអាចមានប្រយោជន៍',
    trackingLines: [
      'កត់ត្រាកាលបរិច្ឆេទដែលរោគសញ្ញាលេចឡើង។',
      'កត់ត្រាកម្រិត និងរយៈពេលរបស់វា។',
      'សង្កេតមើលថាវាប្រសើរឡើង ឬកាន់តែអាក្រក់។',
    ],
    body5:
      'រោគសញ្ញាទាំងអស់មិនចាំបាច់ទាក់ទងនឹងការពន្យារកំណើតទេ។ ភាពតានតឹង ដំណេក របបអាហារ វដ្តរដូវរបស់អ្នក ឬការព្យាបាលផ្សេងទៀតក៏អាចប៉ះពាល់ដល់អារម្មណ៍របស់អ្នកដែរ។',
    body6:
      'ដើម្បីយល់ពីស្ថានភាព សូមព្យាយាមមើលបរិបទទាំងមូល ជាជាងរោគសញ្ញាតែមួយដាច់ដោយឡែក។',
    worthMentioning: [
      'ការប្រែប្រួលអារម្មណ៍ច្បាស់ និងនៅជាប់',
      'ការថយចុះនៃចំណង់ផ្លូវភេទដែលរំខានអ្នក',
      'ការហូរឈាមមិនទៀងទាត់ដែលមានលើសពី 3 វដ្តរដូវ',
      'ចង្អោរ ឬឈឺក្បាលដែលនៅតែរំខាន',
    ],
    questionsTitle: 'សំណួរមានប្រយោជន៍មួយចំនួន',
    questions: [
      'តើរោគសញ្ញាទាំងនេះបានកើតមានយូរប៉ុណ្ណាហើយ?',
      'តើវាលេចឡើងក្រោយពេលចាប់ផ្តើម ឬប្តូរវិធីពន្យារកំណើតឬទេ?',
      'តើវាស្រាល រំខាន ឬមិនធម្មតាពិតប្រាកដសម្រាប់អ្នក?',
      'តើវាប្រសើរឡើងតាមពេលវេលា ឬកាន់តែញឹកញាប់?',
    ],
    body7:
      'ទោះបីរោគសញ្ញាមិនបន្ទាន់ក៏ដោយ វាអាចគួរពិភាក្សាអំពីវា ប្រសិនបើវាកាន់តែរំខាន នៅជាប់ ឬប៉ះពាល់ដល់គុណភាពជីវិតរបស់អ្នកពិតប្រាកដ។',
    infoTitle: 'វាអាចគួរសុំដំបូន្មាន ប្រសិនបើ…',
    infoText:
      'រោគសញ្ញានៅជាប់ កាន់តែធ្ងន់ធ្ងរ ឬរារាំងអ្នកពីការរស់នៅជាធម្មតា។',
    body8:
      'វេជ្ជបណ្ឌិត ឆ្មប ឬឱសថការី អាចជួយអ្នកកំណត់ថារោគសញ្ញាអាចទាក់ទងនឹងវិធីដែលអ្នកកំពុងប្រើឬទេ និងថាតើវាត្រូវកែសម្រួលឬអត់។',
    body9:
      'សញ្ញាមួយចំនួនមិនធម្មតា ហើយតម្រូវឱ្យមានការវាយតម្លៃផ្នែកពេទ្យភ្លាមៗ។ វាមិនចាំបាច់មានន័យថាមានផលវិបាកទេ ប៉ុន្តែមិនគួរមើលរំលងវាទេ។',
    alertTitle: 'ស្វែងរកការថែទាំភ្លាមៗ',
    alertIntro: 'សូមសុំដំបូន្មានផ្នែកពេទ្យភ្លាមៗ ប្រសិនបើអ្នកមានជាពិសេស៖',
    urgentSigns: [
      'ឈឺទ្រូងខ្លាំង ឬមិនធម្មតា',
      'ពិបាកដកដង្ហើមភ្លាមៗ',
      'ហើម ឬឈឺជើងមិនធម្មតា',
      'ឈឺក្បាលភ្លាមៗ ខ្លាំងខ្លាំង ឬមិនធម្មតា',
      'ពិបាកមើល និយាយ ឬមានកម្លាំងភ្លាមៗ',
    ],
    emergencyTitle: 'ក្នុងករណីស្ថានភាពធ្ងន់ធ្ងរ',
    emergencyText:
      'ប្រសិនបើរោគសញ្ញាកើតឡើងភ្លាមៗ ធ្ងន់ធ្ងរខ្លាំង ឬមានអមដោយការពិបាកដកដង្ហើម ឬមានអារម្មណ៍ងងឹតមុខ ឬសញ្ញាធ្ងន់ធ្ងរផ្សេងទៀត សូមស្វែងរកជំនួយផ្នែកពេទ្យជាបន្ទាន់។',
    summaryTitle: 'ខ្លឹមសារសំខាន់',
    summaryItems: [
      'ផលប៉ះពាល់មួយចំនួនអាចលេចឡើងនៅពេលចាប់ផ្តើមវិធីពន្យារកំណើតដោយអរម៉ូនថ្មី។',
      'ផលប៉ះពាល់ជាច្រើនគឺបណ្តោះអាសន្ន ហើយអាចថយចុះតាមពេលវេលា។',
      'រោគសញ្ញាដែលរំខាន ឬនៅជាប់ គួរតែពិភាក្សាជាមួយអ្នកជំនាញ។',
      'សញ្ញាមិនធម្មតាមួយចំនួនតម្រូវឱ្យមានដំបូន្មានផ្នែកពេទ្យភ្លាមៗ។',
    ],
    finalTipTitle: 'ចំណុចសំខាន់',
    finalTipText:
      'ការស្តាប់រាងកាយរបស់អ្នក មិនចាំបាច់មានន័យថាត្រូវឈប់ប្រើវិធីមួយភ្លាមៗទេ។ សូមកត់ត្រាអ្វីដែលអ្នកមានអារម្មណ៍ សង្កេតមើលការវិវឌ្ឍរបស់វា ហើយសុំដំបូន្មាននៅពេលណាក៏ដោយដែលរោគសញ្ញាមួយធ្វើឱ្យអ្នកព្រួយបារម្ភ។',
    disclaimerText:
      'អត្ថបទនេះមានគោលបំណងផ្តល់ព័ត៌មាន ហើយមិនជំនួសដំបូន្មានផ្នែកពេទ្យផ្ទាល់ខ្លួនទេ។ ប្រសិនបើអ្នកមានរោគសញ្ញាធ្ងន់ធ្ងរ ឬមិនធម្មតា សូមសុំដំបូន្មានពីអ្នកជំនាញសុខាភិបាល។',
    shareMessage: 'ស្គាល់ផលប៉ះពាល់ដែលអាចកើតមាន — AWA',
  },
  lo: {
    badge: 'ຜົນຂ້າງຄຽງ',
    title: 'ຮູ້ຈັກຜົນຂ້າງຄຽງ\nທີ່ອາດເກີດຂຶ້ນ',
    metaDuration: 'ອ່ານ 8 ນາທີ',
    metaType: 'ບົດຄວາມ',
    metaLevel: 'ລະດັບກາງ',
    metaValidated: 'ເນື້ອຫາທີ່ຜ່ານການກວດສອບ',
    intro:
      'ບາງຜົນອາດພົບໄດ້ທົ່ວໄປ ແລະ ເປັນຊົ່ວຄາວ. ບາງຜົນຕ້ອງການຄວາມເອົາໃຈໃສ່ຫຼາຍຂຶ້ນ. ຮຽນຮູ້ທີ່ຈະແຍກແຍະລະຫວ່າງປະຕິກິລິຍາທີ່ເປັນປົກກະຕິ ແລະ ອາການທີ່ຄວນໄດ້ຮັບການປະເມີນ.',
    contentsTitle: 'ໃນບົດຄວາມນີ້',
    topics: [
      'ຜົນທີ່ພົບທົ່ວໄປ ແລະ ບໍ່ຮຸນແຮງ',
      'ໄລຍະປັບຕົວຂອງຮ່າງກາຍ',
      'ສັງເກດສິ່ງທີ່ປ່ຽນແປງ',
      'ເມື່ອໃດຄວນຂໍຄຳແນະນຳທາງການແພດ',
      'ເມື່ອໃດຄວນຮັບການດູແລຢ່າງວ່ອງໄວ',
      'ຈຸດສຳຄັນ',
    ],
    body1:
      'ເມື່ອເລີ່ມໃຊ້ວິທີຄຸມກຳເນີດດ້ວຍຮໍໂມນວິທີໃໝ່ ຮ່າງກາຍອາດຕ້ອງໃຊ້ເວລາເພື່ອປັບຕົວ. ການປ່ຽນແປງເລັກນ້ອຍອາດປາກົດໃນຮອບເດືອນ ອາລົມ ຫຼື ຄວາມສະບາຍທາງຮ່າງກາຍ.',
    body2:
      'ຜົນເຫຼົ່ານີ້ມັກບໍ່ຮຸນແຮງ ແລະ ອາດຄ່ອຍໆຫຼຸດລົງ. ການມີຜົນເຫຼົ່ານີ້ບໍ່ໄດ້ໝາຍຄວາມວ່າວິທີນັ້ນອັນຕະລາຍ ຫຼື ຕ້ອງຢຸດໃຊ້ໂດຍອັດຕະໂນມັດ.',
    commonEffects: [
      {
        title: 'ເລືອດອອກເລັກນ້ອຍ',
        text: 'ອາດມີເລືອດອອກທີ່ບໍ່ສະໝ່ຳສະເໝີ ໂດຍສະເພາະໃນຕອນເລີ່ມຕົ້ນໃຊ້ວິທີໃໝ່.',
      },
      {
        title: 'ເຕົ້ານົມເຈັບຕຶງ',
        text: 'ອາດຮູ້ສຶກເຕົ້ານົມຕຶງ ຫຼື ເຈັບຊົ່ວຄາວ.',
      },
      {
        title: 'ອາລົມ',
        text: 'ບາງຄົນສັງເກດເຫັນການປ່ຽນແປງຂອງອາລົມ ຫຼື ຄວາມອ່ອນໄຫວທາງອາລົມເພີ່ມຂຶ້ນ.',
      },
      {
        title: 'ເຈັບຫົວ',
        text: 'ອາດມີອາການເຈັບຫົວເລັກນ້ອຍໃນໄລຍະປັບຕົວ.',
      },
    ],
    body3:
      'ສອງສາມອາທິດ ຫຼື ຮອບເດືອນທຳອິດອາດແຕກຕ່າງຈາກທີ່ທ່ານເຄີຍຊິນກ່ອນໜ້ານີ້. ຮ່າງກາຍສາມາດຄ່ອຍໆປັບຕົວເຂົ້າກັບຄວາມສົມດຸນຂອງຮໍໂມນໃໝ່.',
    tip1Title: 'ຄວນຮູ້',
    tip1Text:
      'ອາການທີ່ປາກົດຂຶ້ນບໍ່ດົນຫຼັງເລີ່ມໃຊ້ວິທີໃດໜຶ່ງຄວນໄດ້ຮັບການເຝົ້າສັງເກດຕາມເວລາ. ຖ້າມັນສ້າງຄວາມລຳຄານ ຫຼື ຍັງຄົງຢູ່ ໃຫ້ປຶກສາຜູ້ຊ່ຽວຊານດ້ານສຸຂະພາບ.',
    body4:
      'ການບັນທຶກອາການໃນແອັບຂອງທ່ານສາມາດຊ່ວຍໃຫ້ຕິດຕາມການປ່ຽນແປງຈາກຮອບເດືອນໜຶ່ງໄປອີກຮອບໜຶ່ງໄດ້ດີຂຶ້ນ.',
    trackingTitle: 'ຕິດຕາມວ່າມີການປ່ຽນແປງແນວໃດ',
    trackingSubtitle: 'ບາງຈຸດສັງເກດອາດເປັນປະໂຫຍດ',
    trackingLines: [
      'ຈົດວັນທີທີ່ອາການປາກົດ.',
      'ບັນທຶກຄວາມຮຸນແຮງ ແລະ ໄລຍະເວລາຂອງມັນ.',
      'ສັງເກດວ່າດີຂຶ້ນ ຫຼື ຮ້າຍລົງ.',
    ],
    body5:
      'ບໍ່ແມ່ນທຸກອາການຈະກ່ຽວຂ້ອງກັບການຄຸມກຳເນີດ. ຄວາມຕຶງຄຽດ ການນອນ ອາຫານ ຮອບເດືອນຂອງທ່ານ ຫຼື ການຮັກສາອື່ນໆກໍອາດສົ່ງຜົນຕໍ່ຄວາມຮູ້ສຶກຂອງທ່ານໄດ້.',
    body6:
      'ເພື່ອເຂົ້າໃຈສະຖານະການ ໃຫ້ພະຍາຍາມເບິ່ງບໍລິບົດໂດຍລວມ ແທນທີ່ຈະເບິ່ງອາການດຽວແຍກຕ່າງຫາກ.',
    worthMentioning: [
      'ອາລົມປ່ຽນແປງຊັດເຈນ ແລະ ຍັງຄົງຢູ່',
      'ຄວາມຢາກທາງເພດຫຼຸດລົງຈົນສ້າງຄວາມກັງວົນໃຫ້ທ່ານ',
      'ເລືອດອອກທີ່ບໍ່ສະໝ່ຳສະເໝີເກີນ 3 ຮອບເດືອນ',
      'ວິນຫົວຄື່ນໄສ້ ຫຼື ເຈັບຫົວທີ່ຍັງສ້າງຄວາມລຳຄານ',
    ],
    questionsTitle: 'ຄຳຖາມບາງຂໍ້ທີ່ເປັນປະໂຫຍດ',
    questions: [
      'ອາການເຫຼົ່ານີ້ເປັນມາດົນປານໃດແລ້ວ?',
      'ມັນປາກົດຫຼັງຈາກເລີ່ມ ຫຼື ປ່ຽນວິທີຄຸມກຳເນີດບໍ?',
      'ມັນບໍ່ຮຸນແຮງ ສ້າງຄວາມລຳຄານ ຫຼື ຜິດປົກກະຕິສຳລັບທ່ານແທ້ໆບໍ?',
      'ມັນດີຂຶ້ນຕາມເວລາ ຫຼື ເກີດຖີ່ຂຶ້ນບໍ?',
    ],
    body7:
      'ເຖິງແມ່ນວ່າອາການໃດໜຶ່ງບໍ່ຮີບດ່ວນ ກໍຄວນປຶກສາຖ້າມັນສ້າງຄວາມລຳຄານ ຍັງຄົງຢູ່ ຫຼື ສົ່ງຜົນຕໍ່ຄຸນນະພາບຊີວິດຂອງທ່ານແທ້ໆ.',
    infoTitle: 'ອາດຄວນຂໍຄຳແນະນຳ ຖ້າ…',
    infoText:
      'ອາການຍັງຄົງຢູ່ ຮຸນແຮງຂຶ້ນ ຫຼື ເຮັດໃຫ້ທ່ານດຳລົງຊີວິດຕາມປົກກະຕິບໍ່ໄດ້.',
    body8:
      'ແພດ ໝໍຕຳແຍ ຫຼື ເພສັດຊະກອນສາມາດຊ່ວຍທ່ານກຳນົດວ່າອາການອາດກ່ຽວຂ້ອງກັບວິທີທີ່ທ່ານໃຊ້ຢູ່ຫຼືບໍ່ ແລະ ຄວນປັບປ່ຽນຫຼືບໍ່.',
    body9:
      'ບາງອາການຜິດປົກກະຕິ ແລະ ຕ້ອງໄດ້ຮັບການປະເມີນທາງການແພດຢ່າງວ່ອງໄວ. ມັນບໍ່ຈຳເປັນຕ້ອງໝາຍຄວາມວ່າມີພາວະແຊກຊ້ອນ ແຕ່ບໍ່ຄວນລະເລີຍ.',
    alertTitle: 'ຮັບການດູແລຢ່າງວ່ອງໄວ',
    alertIntro: 'ຂໍຄຳແນະນຳທາງການແພດຢ່າງວ່ອງໄວ ຖ້າທ່ານມີອາການດັ່ງນີ້ ໂດຍສະເພາະ:',
    urgentSigns: [
      'ເຈັບໜ້າເອິກຮຸນແຮງ ຫຼື ຜິດປົກກະຕິ',
      'ຫາຍໃຈຍາກຢ່າງກະທັນຫັນ',
      'ຂາບວມ ຫຼື ເຈັບຜິດປົກກະຕິ',
      'ເຈັບຫົວຢ່າງກະທັນຫັນ ຮຸນແຮງຫຼາຍ ຫຼື ຜິດປົກກະຕິ',
      'ມີບັນຫາກະທັນຫັນກັບການເບິ່ງເຫັນ ການເວົ້າ ຫຼື ກຳລັງ',
    ],
    emergencyTitle: 'ໃນກໍລະນີທີ່ຮຸນແຮງ',
    emergencyText:
      'ຖ້າອາການເກີດຂຶ້ນກະທັນຫັນ ຮຸນແຮງຫຼາຍ ຫຼື ມາພ້ອມກັບຫາຍໃຈຍາກ ຮູ້ສຶກຈະເປັນລົມ ຫຼື ອາການຮ້າຍແຮງອື່ນ ໃຫ້ຂໍຄວາມຊ່ວຍເຫຼືອທາງການແພດດ່ວນ.',
    summaryTitle: 'ສິ່ງສຳຄັນ',
    summaryItems: [
      'ບາງຜົນອາດປາກົດໃນຕອນເລີ່ມໃຊ້ວິທີຄຸມກຳເນີດດ້ວຍຮໍໂມນວິທີໃໝ່.',
      'ຫຼາຍຜົນເປັນຊົ່ວຄາວ ແລະ ອາດຫຼຸດລົງຕາມເວລາ.',
      'ອາການທີ່ສ້າງຄວາມລຳຄານ ຫຼື ຍັງຄົງຢູ່ ຄວນປຶກສາຜູ້ຊ່ຽວຊານ.',
      'ບາງອາການຜິດປົກກະຕິຕ້ອງການຄຳແນະນຳທາງການແພດຢ່າງວ່ອງໄວ.',
    ],
    finalTipTitle: 'ຈຸດສຳຄັນ',
    finalTipText:
      'ການຮັບຟັງຮ່າງກາຍຂອງທ່ານບໍ່ຈຳເປັນຕ້ອງໝາຍເຖິງການຢຸດໃຊ້ວິທີນັ້ນທັນທີ. ຈົດສິ່ງທີ່ທ່ານຮູ້ສຶກ ເຝົ້າສັງເກດວ່າມັນພັດທະນາແນວໃດ ແລະ ຂໍຄຳແນະນຳທຸກຄັ້ງທີ່ອາການໃດເຮັດໃຫ້ທ່ານກັງວົນ.',
    disclaimerText:
      'ບົດຄວາມນີ້ມີຈຸດປະສົງເພື່ອໃຫ້ຂໍ້ມູນ ແລະ ບໍ່ແທນຄຳແນະນຳທາງການແພດສະເພາະບຸກຄົນ. ຖ້າທ່ານມີອາການຮຸນແຮງ ຫຼື ຜິດປົກກະຕິ ໃຫ້ຂໍຄຳແນະນຳຈາກຜູ້ຊ່ຽວຊານດ້ານສຸຂະພາບ.',
    shareMessage: 'ຮູ້ຈັກຜົນຂ້າງຄຽງທີ່ອາດເກີດຂຶ້ນ — AWA',
  },
} as const);

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function SideEffectsArticleScreen({
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

        {/* ARTICLE HEADER */}

        <View style={styles.article}>
          <View style={styles.badge}>
            <AwaText variant="labelSmall" emphasized colorRole="primary">{content.badge}</AwaText>
          </View>

          <AwaText variant="headlineMedium" weight="700" style={styles.title}>{content.title}</AwaText>

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

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.intro}>{content.intro}</AwaText>

          {/* CONTENTS */}

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

          {/* SECTION 1 */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>1. {content.topics[0]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.body1}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.body2}</AwaText>

          <View style={styles.commonGrid}>
            {COMMON_EFFECT_ICONS.map((icon, index) => {
              const item = content.commonEffects[index];
              return (
                <AwaCard variant="filled" padding="none" key={item.title} style={styles.commonCard}>
                  <View style={styles.commonIcon}>
                    <MaterialDesignIcons
                      name={icon as never}
                      size={21}
                      color={theme.colors.primary}
                    />
                  </View>

                  <AwaText variant="titleSmall" emphasized style={styles.commonTitle}>{item.title}</AwaText>

                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.commonText}>{item.text}</AwaText>
                </AwaCard>
              );
            })}
          </View>

          {/* SECTION 2 */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>2. {content.topics[1]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.body3}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.tip1Title}</AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>{content.tip1Text}</AwaText>
            </View>
          </AwaCard>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.body4}</AwaText>

          {/* TRACKING CARD */}

          <AwaCard variant="filled" padding="none" style={styles.trackingCard}>
            <View style={styles.trackingHeader}>
              <View style={styles.trackingIcon}>
                <MaterialDesignIcons
                  name="notebook-edit-outline"
                  size={22}
                  color={theme.colors.primary}
                />
              </View>

              <View style={styles.trackingHeaderCopy}>
                <AwaText variant="titleSmall" emphasized>
                  {content.trackingTitle}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.trackingSubtitle}>
                  {content.trackingSubtitle}
                </AwaText>
              </View>
            </View>

            {content.trackingLines.map(line => (
              <View key={line} style={styles.trackingLine}>
                <MaterialDesignIcons
                  name="check"
                  size={17}
                  color={theme.colors.success}
                />

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.trackingText}>{line}</AwaText>
              </View>
            ))}
          </AwaCard>

          {/* SECTION 3 */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.topics[2]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.body5}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.body6}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.worthMentioning.map(item => (
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

          {/* QUESTIONS */}

          <AwaCard variant="filled" padding="none" style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <MaterialDesignIcons
                name="help-circle-outline"
                size={23}
                color={theme.colors.primary}
              />

              <AwaText variant="titleSmall" emphasized>
                {content.questionsTitle}
              </AwaText>
            </View>

            {content.questions.map((item, index) => (
              <View key={item} style={styles.questionRow}>
                <View style={styles.questionNumberCircle}>
                  <AwaText variant="labelSmall" emphasized colorRole="primary">{index + 1}</AwaText>
                </View>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.questionText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          {/* SECTION 4 */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.topics[3]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.body7}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <MaterialDesignIcons
                name="stethoscope"
                size={22}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.infoCopy}>
              <AwaText variant="titleSmall" emphasized>{content.infoTitle}</AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.infoText}>{content.infoText}</AwaText>
            </View>
          </AwaCard>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.body8}</AwaText>

          {/* SECTION 5 */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>5. {content.topics[4]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.body9}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="alert-circle-outline"
              size={25}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.alertTitle}</AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.alertIntro}>{content.alertIntro}</AwaText>

              {content.urgentSigns.map(item => (
                <View key={item} style={styles.alertRow}>
                  <View style={styles.alertDot} />

                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.alertText}>{item}</AwaText>
                </View>
              ))}
            </View>
          </AwaCard>

          {/* EMERGENCY NOTE */}

          <AwaCard variant="filled" padding="none" style={styles.emergencyCard}>
            <MaterialDesignIcons
              name="phone-alert-outline"
              size={23}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.emergencyTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.emergencyText}>
                {content.emergencyText}
              </AwaText>
            </View>
          </AwaCard>

          {/* SECTION 6 */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>6. {content.topics[5]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <MaterialDesignIcons
                name="check-decagram-outline"
                size={25}
                color={theme.colors.primary}
              />

              <AwaText variant="titleSmall" emphasized>{content.summaryTitle}</AwaText>
            </View>

            {content.summaryItems.map(item => (
              <View key={item} style={styles.summaryItem}>
                <MaterialDesignIcons
                  name="check"
                  size={18}
                  color={theme.colors.success}
                />

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.summaryText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          {/* FINAL TIP */}

          <AwaCard variant="filled" padding="none" style={styles.finalTip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={25}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.finalTipTitle}</AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>{content.finalTipText}</AwaText>
            </View>
          </AwaCard>

          {/* DISCLAIMER */}

          <View style={styles.disclaimer}>
            <MaterialDesignIcons
              name="shield-outline"
              size={19}
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
        durationMinutes={8}
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
    paddingBottom: 32,
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

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  metaDivider: {
    width: 1,
    height: 20,
    backgroundColor: theme.colors.border,
  },


  intro: {
    marginTop: 16,
  },

  contents: {
    marginTop: 20,
    padding: 16,
  },

  contentsTitle: {
    marginBottom: 8,
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
  },

  contentText: {
    flex: 1,
  },

  h2: {
    marginTop: 28,
  },

  body: {
    marginTop: 8,
  },

  commonGrid: {
    marginTop: 16,
    gap: 12,
  },

  commonCard: {
    padding: 16,
  },

  commonIcon: {
    width: 39,
    height: 39,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  commonTitle: {
    marginTop: 8,
  },

  commonText: {
    marginTop: 4,
  },

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

  trackingCard: {
    marginTop: 16,
    padding: 16,
  },

  trackingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  trackingIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  trackingHeaderCopy: {
    flex: 1,
    marginLeft: 12,
  },


  trackingSubtitle: {
    marginTop: 2,
  },

  trackingLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },

  trackingText: {
    flex: 1,
  },

  checkList: {
    marginTop: 12,
    padding: 16,
  },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },

  checkText: {
    flex: 1,
  },

  questionCard: {
    marginTop: 16,
    padding: 16,
  },

  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },


  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  questionNumberCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },


  questionText: {
    flex: 1,
    marginLeft: 8,
    paddingTop: 2,
  },

  infoCard: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  infoCopy: {
    flex: 1,
    marginLeft: 12,
  },


  infoText: {
    marginTop: 4,
  },

  alert: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },


  alertIntro: {
    marginTop: 4,
  },

  alertRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },

  alertDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 8,
    marginRight: 8,
    backgroundColor: theme.colors.warning,
  },

  alertText: {
    flex: 1,
  },

  emergencyCard: {
    marginTop: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: withAlpha(theme.colors.warning, 0.08),
  },


  emergencyText: {
    marginTop: 4,
  },

  summaryCard: {
    marginTop: 16,
    padding: 16,
  },

  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },


  summaryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },

  summaryText: {
    flex: 1,
  },

  finalTip: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  disclaimer: {
    marginTop: 20,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },

  disclaimerText: {
    flex: 1,
  },
  });
}
