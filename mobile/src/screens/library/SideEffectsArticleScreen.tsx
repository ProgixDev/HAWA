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
const CONTENT = {
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
} as const;

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
