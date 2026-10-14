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

const ID = 'pcos-poids-metabolisme-insuline';

const HERO = require('../../assets/images/library/popular-nutrition.png');

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const DAILY_HABIT_ICONS = [
  'bowl-mix-outline',
  'shoe-sneaker',
  'weather-night',
  'cup-water',
] as const;

const FOLLOW_UP_ICONS = [
  'calendar-check-outline',
  'water-alert-outline',
  'scale-bathroom',
  'heart-pulse',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'SOPK',
    title: 'Poids, métabolisme et\nrésistance à l’insuline',
    metaDuration: '6 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Intermédiaire',
    metaValidated: 'Contenu validé',
    intro: 'Le lien entre SOPK, poids et résistance à l’insuline, sans jugement ni raccourci.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Le lien entre SOPK et métabolisme',
      'Comprendre la résistance à l’insuline',
      'Poids : ce qui est vrai et ce qui ne l’est pas',
      'Des habitudes qui soutiennent l’équilibre',
      'Quand un suivi médical est utile',
      'À retenir',
    ],
    body1: 'Le SOPK est souvent associé à des changements métaboliques, notamment une résistance à l’insuline. Cette association ne concerne cependant pas uniquement les femmes en surpoids : le profil métabolique varie d’une personne à l’autre.',
    body2: 'L’insuline est une hormone qui aide les cellules à utiliser le glucose présent dans le sang. En cas de résistance à l’insuline, les cellules répondent moins bien à cette hormone et l’organisme peut compenser en produisant davantage d’insuline.',
    body3: 'Dans le SOPK, cette situation peut être associée à une augmentation de la production d’androgènes et contribuer à certains symptômes. Mais toutes les femmes atteintes de SOPK n’ont pas le même profil métabolique.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'La résistance à l’insuline peut être recherchée par un bilan biologique lorsque le médecin le juge pertinent. Le besoin d’examens dépend du contexte individuel.',
    weightFacts: [
      'Le SOPK touche des femmes de toutes corpulences, minces comme fortes.',
      'La prise de poids n’est pas systématique.',
      'Perdre du poids n’est pas toujours nécessaire ni suffisant pour améliorer les symptômes.',
      'Une petite perte de poids peut parfois améliorer certains paramètres métaboliques ou la régularité du cycle lorsqu’un surpoids est présent.',
    ],
    body4: 'L’objectif n’est pas de rechercher un poids « parfait », mais de mettre en place des habitudes réalistes et durables. Une alimentation équilibrée, le mouvement et un sommeil régulier peuvent participer à une meilleure santé métabolique.',
    dailyHabits: [
      'Des repas réguliers et variés, riches en fibres',
      'Une activité physique régulière, même modérée',
      'Un sommeil suffisant et régulier',
      'Une hydratation suffisante au quotidien',
    ],
    body5: 'Le suivi médical du SOPK ne se limite pas au cycle ou aux symptômes hormonaux. Selon ton profil, le professionnel de santé peut aussi surveiller certains paramètres métaboliques afin d’identifier précocement d’éventuels facteurs de risque.',
    medicalTitle: 'Un suivi adapté à ton profil',
    medicalSubtitle: 'Le bilan n’est pas identique pour tout le monde.',
    medicalDescription: 'Le médecin peut décider de contrôler certains paramètres en fonction de tes symptômes, de tes antécédents, de ta situation familiale et des autres facteurs de risque.',
    medicalSectionTitle: 'Ce qui peut être surveillé',
    medicalChecks: [
      'Glycémie et/ou HbA1c selon le contexte',
      'Bilan lipidique (cholestérol et triglycérides)',
      'Évaluation de la tension artérielle et du risque cardiovasculaire',
      'Suivi du poids et du tour de taille sans jugement',
    ],
    subH3: 'Situations à signaler',
    body6: 'Certains changements méritent d’être mentionnés lors d’une consultation, surtout lorsqu’ils sont nouveaux, persistants ou inhabituels pour toi.',
    medicalFollowUp: [
      {title: 'Cycles très irréguliers', description: 'Signaler des règles très espacées ou imprévisibles.'},
      {title: 'Soif ou urines fréquentes', description: 'En parler au médecin si ces signes apparaissent de façon inhabituelle.'},
      {title: 'Variation importante du poids', description: 'Une évolution rapide ou inexpliquée mérite une évaluation.'},
      {title: 'Antécédents familiaux', description: 'Mentionner les antécédents de diabète ou de maladies métaboliques.'},
    ],
    alertTitle: 'À noter',
    alertText: 'Une soif inhabituelle, des urines fréquentes, une fatigue persistante ou une variation importante et inexpliquée du poids doivent être signalées à un professionnel de santé. Ces signes peuvent avoir plusieurs causes et ne permettent pas, à eux seuls, de conclure à une résistance à l’insuline ou à un diabète.',
    followUpTipTitle: 'Le suivi se fait dans le temps',
    followUpTipText: 'Le médecin peut proposer un contrôle régulier plutôt qu’un bilan unique. L’objectif est d’adapter les conseils et les examens à ton évolution, sans se focaliser uniquement sur le poids.',
    tip2Title: 'Bon à savoir',
    tip2Text: 'Le poids n’est qu’une partie du tableau métabolique du SOPK. Une prise en charge globale tient compte des cycles, des symptômes, des habitudes de vie, des antécédents et des paramètres métaboliques.',
    shareMessage: 'Poids, métabolisme et résistance à l’insuline — AWA',
  },
  en: {
    badge: 'PCOS',
    title: 'Weight, metabolism, and\ninsulin resistance',
    metaDuration: '6 min read',
    metaType: 'Guide',
    metaLevel: 'Intermediate',
    metaValidated: 'Reviewed content',
    intro: 'The link between PCOS, weight, and insulin resistance — without judgment or shortcuts.',
    contentsTitle: 'In this article',
    topics: [
      'The link between PCOS and metabolism',
      'Understanding insulin resistance',
      'Weight: what’s true and what isn’t',
      'Habits that support balance',
      'When medical follow-up is helpful',
      'Key takeaways',
    ],
    body1: 'PCOS is often associated with metabolic changes, including insulin resistance. However, this association doesn’t concern only women who are overweight — metabolic profiles vary from person to person.',
    body2: 'Insulin is a hormone that helps cells use the glucose in the blood. With insulin resistance, cells respond less well to this hormone, and the body may compensate by producing more insulin.',
    body3: 'In PCOS, this can be associated with increased androgen production and may contribute to certain symptoms. But not all women with PCOS have the same metabolic profile.',
    tip1Title: 'Good to know',
    tip1Text: 'Insulin resistance can be checked through blood tests when the doctor considers it relevant. Whether tests are needed depends on your individual situation.',
    weightFacts: [
      'PCOS affects women of all body types, from slim to heavier builds.',
      'Weight gain isn’t systematic.',
      'Losing weight isn’t always necessary — or enough on its own — to improve symptoms.',
      'A small weight loss can sometimes improve certain metabolic markers or cycle regularity when excess weight is present.',
    ],
    body4: 'The goal isn’t to chase a “perfect” weight, but to build realistic, lasting habits. A balanced diet, movement, and regular sleep can all contribute to better metabolic health.',
    dailyHabits: [
      'Regular, varied meals rich in fiber',
      'Regular physical activity, even if moderate',
      'Enough regular sleep',
      'Enough daily hydration',
    ],
    body5: 'Medical follow-up for PCOS isn’t limited to the cycle or hormonal symptoms. Depending on your profile, your healthcare provider may also monitor certain metabolic markers to help identify potential risk factors early.',
    medicalTitle: 'Follow-up tailored to your profile',
    medicalSubtitle: 'The workup isn’t the same for everyone.',
    medicalDescription: 'Your doctor may decide to check certain markers based on your symptoms, your medical history, your family situation, and other risk factors.',
    medicalSectionTitle: 'What may be monitored',
    medicalChecks: [
      'Blood glucose and/or HbA1c, depending on context',
      'Lipid panel (cholesterol and triglycerides)',
      'Blood pressure and cardiovascular risk assessment',
      'Weight and waist circumference tracking, without judgment',
    ],
    subH3: 'Situations worth mentioning',
    body6: 'Certain changes are worth mentioning during a consultation, especially when they’re new, persistent, or unusual for you.',
    medicalFollowUp: [
      {title: 'Very irregular cycles', description: 'Mention periods that are very spaced out or unpredictable.'},
      {title: 'Thirst or frequent urination', description: 'Talk to your doctor if these signs appear in an unusual way.'},
      {title: 'Significant weight change', description: 'A rapid or unexplained change is worth getting evaluated.'},
      {title: 'Family history', description: 'Mention any family history of diabetes or metabolic conditions.'},
    ],
    alertTitle: 'Please note',
    alertText: 'Unusual thirst, frequent urination, persistent fatigue, or a significant, unexplained change in weight should be reported to a healthcare professional. These signs can have several causes and don’t, on their own, confirm insulin resistance or diabetes.',
    followUpTipTitle: 'Follow-up happens over time',
    followUpTipText: 'Your doctor may suggest regular check-ups rather than a single workup. The goal is to adapt advice and tests to how you progress, without focusing solely on weight.',
    tip2Title: 'Good to know',
    tip2Text: 'Weight is only one part of the metabolic picture in PCOS. A comprehensive approach takes into account cycles, symptoms, lifestyle habits, medical history, and metabolic markers.',
    shareMessage: 'Weight, metabolism, and insulin resistance — AWA',
  },
  es: {
    badge: 'SOP',
    title: 'Peso, metabolismo y\nresistencia a la insulina',
    metaDuration: '6 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenido validado',
    intro: 'El vínculo entre el SOP, el peso y la resistencia a la insulina, sin juicios ni atajos.',
    contentsTitle: 'En este artículo',
    topics: [
      'El vínculo entre el SOP y el metabolismo',
      'Comprender la resistencia a la insulina',
      'Peso: lo que es cierto y lo que no',
      'Hábitos que sostienen el equilibrio',
      'Cuándo un seguimiento médico es útil',
      'Para recordar',
    ],
    body1: 'El SOP suele estar asociado con cambios metabólicos, entre ellos una resistencia a la insulina. Sin embargo, esta asociación no concierne únicamente a las mujeres con sobrepeso: el perfil metabólico varía de una persona a otra.',
    body2: 'La insulina es una hormona que ayuda a las células a utilizar la glucosa presente en la sangre. En caso de resistencia a la insulina, las células responden peor a esta hormona y el organismo puede compensarlo produciendo más insulina.',
    body3: 'En el SOP, esta situación puede estar asociada con un aumento de la producción de andrógenos y contribuir a ciertos síntomas. Pero no todas las mujeres con SOP tienen el mismo perfil metabólico.',
    tip1Title: 'Dato útil',
    tip1Text: 'La resistencia a la insulina puede buscarse mediante un análisis biológico cuando el médico lo considera pertinente. La necesidad de exámenes depende del contexto individual.',
    weightFacts: [
      'El SOP afecta a mujeres de todas las complexiones, delgadas y con más peso.',
      'El aumento de peso no es sistemático.',
      'Perder peso no siempre es necesario ni suficiente para mejorar los síntomas.',
      'Una pequeña pérdida de peso a veces puede mejorar ciertos parámetros metabólicos o la regularidad del ciclo cuando hay sobrepeso.',
    ],
    body4: 'El objetivo no es buscar un peso «perfecto», sino establecer hábitos realistas y duraderos. Una alimentación equilibrada, el movimiento y un sueño regular pueden contribuir a una mejor salud metabólica.',
    dailyHabits: [
      'Comidas regulares y variadas, ricas en fibra',
      'Una actividad física regular, aunque sea moderada',
      'Un sueño suficiente y regular',
      'Una hidratación suficiente a diario',
    ],
    body5: 'El seguimiento médico del SOP no se limita al ciclo ni a los síntomas hormonales. Según tu perfil, el profesional de salud también puede vigilar ciertos parámetros metabólicos para identificar precozmente posibles factores de riesgo.',
    medicalTitle: 'Un seguimiento adaptado a tu perfil',
    medicalSubtitle: 'El balance no es idéntico para todo el mundo.',
    medicalDescription: 'El médico puede decidir controlar ciertos parámetros en función de tus síntomas, tus antecedentes, tu situación familiar y otros factores de riesgo.',
    medicalSectionTitle: 'Lo que puede vigilarse',
    medicalChecks: [
      'Glucemia y/o HbA1c según el contexto',
      'Perfil lipídico (colesterol y triglicéridos)',
      'Evaluación de la tensión arterial y del riesgo cardiovascular',
      'Seguimiento del peso y del perímetro de cintura sin juicios',
    ],
    subH3: 'Situaciones que señalar',
    body6: 'Algunos cambios merecen mencionarse durante una consulta, sobre todo cuando son nuevos, persistentes o inusuales para ti.',
    medicalFollowUp: [
      {title: 'Ciclos muy irregulares', description: 'Señalar reglas muy espaciadas o imprevisibles.'},
      {title: 'Sed o micciones frecuentes', description: 'Hablar con el médico si estos signos aparecen de forma inusual.'},
      {title: 'Variación importante de peso', description: 'Una evolución rápida o inexplicada merece una evaluación.'},
      {title: 'Antecedentes familiares', description: 'Mencionar los antecedentes de diabetes o de enfermedades metabólicas.'},
    ],
    alertTitle: 'A tener en cuenta',
    alertText: 'Una sed inusual, micciones frecuentes, una fatiga persistente o una variación importante e inexplicada del peso deben señalarse a un profesional de salud. Estos signos pueden tener varias causas y no permiten, por sí solos, concluir una resistencia a la insulina o una diabetes.',
    followUpTipTitle: 'El seguimiento se hace a lo largo del tiempo',
    followUpTipText: 'El médico puede proponer un control regular en lugar de un balance único. El objetivo es adaptar los consejos y los exámenes a tu evolución, sin centrarse únicamente en el peso.',
    tip2Title: 'Dato útil',
    tip2Text: 'El peso es solo una parte del cuadro metabólico del SOP. Un manejo global tiene en cuenta los ciclos, los síntomas, los hábitos de vida, los antecedentes y los parámetros metabólicos.',
    shareMessage: 'Peso, metabolismo y resistencia a la insulina — AWA',
  },
  it: {
    badge: 'PCOS',
    title: 'Peso, metabolismo e\ninsulino-resistenza',
    metaDuration: '6 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenuto validato',
    intro: 'Il legame tra PCOS, peso e insulino-resistenza, senza giudizi né scorciatoie.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Il legame tra PCOS e metabolismo',
      'Capire l’insulino-resistenza',
      'Peso: che cosa è vero e che cosa no',
      'Abitudini che favoriscono l’equilibrio',
      'Quando il follow-up medico è utile',
      'Punti chiave',
    ],
    body1: 'La PCOS è spesso associata a cambiamenti metabolici, tra cui l’insulino-resistenza. Questa associazione, però, non riguarda solo le donne in sovrappeso: i profili metabolici variano da persona a persona.',
    body2: 'L’insulina è un ormone che aiuta le cellule a utilizzare il glucosio presente nel sangue. Con l’insulino-resistenza, le cellule rispondono meno bene a questo ormone e il corpo può compensare producendo più insulina.',
    body3: 'Nella PCOS, questo può essere associato a una maggiore produzione di androgeni e può contribuire ad alcuni sintomi. Ma non tutte le donne con PCOS hanno lo stesso profilo metabolico.',
    tip1Title: 'Da sapere',
    tip1Text: 'L’insulino-resistenza può essere valutata con esami del sangue quando il medico lo ritiene opportuno. La necessità di fare degli esami dipende dalla tua situazione individuale.',
    weightFacts: [
      'La PCOS riguarda donne di qualsiasi corporatura, da quelle magre a quelle più robuste.',
      'L’aumento di peso non è sistematico.',
      'Perdere peso non è sempre necessario, né da solo sufficiente, per migliorare i sintomi.',
      'Una piccola perdita di peso può a volte migliorare alcuni parametri metabolici o la regolarità del ciclo quando è presente un eccesso di peso.',
    ],
    body4: 'L’obiettivo non è inseguire un peso «perfetto», ma costruire abitudini realistiche e durature. Un’alimentazione equilibrata, il movimento e un sonno regolare possono tutti contribuire a una migliore salute metabolica.',
    dailyHabits: [
      'Pasti regolari e vari, ricchi di fibre',
      'Attività fisica regolare, anche se moderata',
      'Un sonno sufficiente e regolare',
      'Un’idratazione quotidiana sufficiente',
    ],
    body5: 'Il follow-up medico della PCOS non si limita al ciclo o ai sintomi ormonali. A seconda del tuo profilo, il tuo operatore sanitario può anche monitorare alcuni parametri metabolici per aiutare a individuare precocemente possibili fattori di rischio.',
    medicalTitle: 'Un follow-up adatto al tuo profilo',
    medicalSubtitle: 'Gli accertamenti non sono uguali per tutte.',
    medicalDescription: 'Il tuo medico può decidere di controllare alcuni parametri in base ai tuoi sintomi, alla tua storia clinica, alla tua situazione familiare e ad altri fattori di rischio.',
    medicalSectionTitle: 'Che cosa può essere monitorato',
    medicalChecks: [
      'Glicemia e/o HbA1c, a seconda del contesto',
      'Profilo lipidico (colesterolo e trigliceridi)',
      'Pressione arteriosa e valutazione del rischio cardiovascolare',
      'Monitoraggio del peso e della circonferenza vita, senza giudizio',
    ],
    subH3: 'Situazioni da riferire',
    body6: 'Alcuni cambiamenti vale la pena di riferirli durante una visita, soprattutto quando sono nuovi, persistenti o insoliti per te.',
    medicalFollowUp: [
      {
        title: 'Cicli molto irregolari',
        description: 'Riferisci le mestruazioni molto distanziate o imprevedibili.',
      },
      {
        title: 'Sete o minzione frequente',
        description: 'Parlane con il tuo medico se questi segni compaiono in modo insolito.',
      },
      {
        title: 'Variazione di peso significativa',
        description: 'Una variazione rapida o inspiegata merita di essere valutata.',
      },
      {
        title: 'Storia familiare',
        description: 'Riferisci eventuali casi in famiglia di diabete o di condizioni metaboliche.',
      },
    ],
    alertTitle: 'Attenzione',
    alertText: 'Sete insolita, minzione frequente, stanchezza persistente o una variazione di peso significativa e inspiegata vanno riferite a un professionista sanitario. Questi segni possono avere diverse cause e, da soli, non confermano un’insulino-resistenza o il diabete.',
    followUpTipTitle: 'Il follow-up avviene nel tempo',
    followUpTipText: 'Il tuo medico può suggerirti controlli regolari anziché un unico accertamento. L’obiettivo è adattare consigli ed esami a come evolvi, senza concentrarsi solo sul peso.',
    tip2Title: 'Da sapere',
    tip2Text: 'Nella PCOS il peso è solo una parte del quadro metabolico. Un approccio completo tiene conto di cicli, sintomi, abitudini di vita, storia clinica e parametri metabolici.',
    shareMessage: 'Peso, metabolismo e insulino-resistenza — AWA',
  },
  tr: {
    badge: 'PKOS',
    title: 'Kilo, metabolizma ve\ninsülin direnci',
    metaDuration: '6 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Orta düzey',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'PKOS, kilo ve insülin direnci arasındaki bağlantı; yargılamadan ve kestirmeye kaçmadan.',
    contentsTitle: 'Bu makalede',
    topics: [
      'PKOS ile metabolizma arasındaki bağlantı',
      'İnsülin direncini anlamak',
      'Kilo: doğrular ve yanlışlar',
      'Dengeyi destekleyen alışkanlıklar',
      'Tıbbi takip ne zaman yararlıdır',
      'Öne çıkanlar',
    ],
    body1: 'PKOS sıklıkla insülin direnci de dahil olmak üzere metabolik değişikliklerle ilişkilendirilir. Ancak bu ilişki yalnızca kilolu kadınları ilgilendirmez; metabolik profiller kişiden kişiye farklılık gösterir.',
    body2: 'İnsülin, hücrelerin kandaki glikozu kullanmasına yardımcı olan bir hormondur. İnsülin direncinde hücreler bu hormona daha az yanıt verir ve vücut daha fazla insülin üreterek bunu dengelemeye çalışabilir.',
    body3: 'PKOS’ta bu durum artmış androjen üretimiyle ilişkili olabilir ve bazı belirtilere katkıda bulunabilir. Ancak PKOS’u olan her kadının metabolik profili aynı değildir.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'İnsülin direnci, doktor uygun gördüğünde kan testleriyle kontrol edilebilir. Test gerekip gerekmediği kişisel durumuna bağlıdır.',
    weightFacts: [
      'PKOS, zayıf yapıdan daha iri yapıya kadar her vücut tipindeki kadını etkiler.',
      'Kilo alımı her zaman görülmez.',
      'Kilo vermek, belirtileri iyileştirmek için her zaman gerekli ya da tek başına yeterli değildir.',
      'Fazla kilo olduğunda küçük bir kilo kaybı bazen bazı metabolik göstergeleri veya döngü düzenini iyileştirebilir.',
    ],
    body4: 'Amaç “mükemmel” bir kilonun peşinden koşmak değil, gerçekçi ve kalıcı alışkanlıklar oluşturmaktır. Dengeli beslenme, hareket ve düzenli uyku, daha iyi bir metabolik sağlığa katkıda bulunabilir.',
    dailyHabits: [
      'Lif açısından zengin, düzenli ve çeşitli öğünler',
      'Ölçülü de olsa düzenli fiziksel aktivite',
      'Yeterli ve düzenli uyku',
      'Gün içinde yeterli sıvı tüketimi',
    ],
    body5: 'PKOS’ta tıbbi takip yalnızca döngü ya da hormonal belirtilerle sınırlı değildir. Profiline bağlı olarak sağlık uzmanın olası risk faktörlerini erken fark etmeye yardımcı olmak için bazı metabolik göstergeleri de izleyebilir.',
    medicalTitle: 'Profiline göre uyarlanmış takip',
    medicalSubtitle: 'Değerlendirme herkes için aynı değildir.',
    medicalDescription: 'Doktorun belirtilerine, tıbbi geçmişine, aile öyküne ve diğer risk faktörlerine göre bazı göstergeleri kontrol etmeye karar verebilir.',
    medicalSectionTitle: 'Nelerin izlenebileceği',
    medicalChecks: [
      'Duruma göre kan şekeri ve/veya HbA1c',
      'Lipid paneli (kolesterol ve trigliserit)',
      'Tansiyon ve kardiyovasküler risk değerlendirmesi',
      'Kilo ve bel çevresi takibi, yargılamadan',
    ],
    subH3: 'Bahsetmeye değer durumlar',
    body6: 'Bazı değişiklikler, özellikle yeni, kalıcı ya da senin için alışılmadık olduklarında, muayenede bahsetmeye değer.',
    medicalFollowUp: [
      {
        title: 'Çok düzensiz döngüler',
        description: 'Çok seyrek gelen ya da tahmin edilemeyen adetlerden bahset.',
      },
      {
        title: 'Susuzluk veya sık idrara çıkma',
        description: 'Bu belirtiler alışılmadık şekilde ortaya çıkarsa doktoruna söyle.',
      },
      {
        title: 'Belirgin kilo değişimi',
        description: 'Hızlı ya da açıklanamayan bir değişimin değerlendirilmesi yararlıdır.',
      },
      {
        title: 'Aile öyküsü',
        description: 'Ailede diyabet ya da metabolik hastalık öyküsü varsa bahset.',
      },
    ],
    alertTitle: 'Lütfen dikkat',
    alertText: 'Alışılmadık susuzluk, sık idrara çıkma, süregelen yorgunluk ya da kilodaki belirgin, açıklanamayan bir değişiklik bir sağlık uzmanına bildirilmelidir. Bu belirtilerin birçok nedeni olabilir ve tek başlarına insülin direncini ya da diyabeti doğrulamaz.',
    followUpTipTitle: 'Takip zaman içinde yapılır',
    followUpTipText: 'Doktorun tek bir değerlendirme yerine düzenli kontroller önerebilir. Amaç, yalnızca kiloya odaklanmadan, tavsiyeleri ve testleri senin ilerleyişine göre uyarlamaktır.',
    tip2Title: 'Bilmekte fayda var',
    tip2Text: 'PKOS’ta kilo, metabolik tablonun yalnızca bir parçasıdır. Kapsamlı bir yaklaşım; döngüleri, belirtileri, yaşam tarzı alışkanlıklarını, tıbbi geçmişi ve metabolik göstergeleri birlikte ele alır.',
    shareMessage: 'Kilo, metabolizma ve insülin direnci — AWA',
  },
  ru: {
    badge: 'СПКЯ',
    title: 'Вес, обмен веществ и\nинсулинорезистентность',
    metaDuration: '6 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Средний уровень',
    metaValidated: 'Проверенный материал',
    intro: 'Связь между СПКЯ, весом и инсулинорезистентностью — без осуждения и упрощений.',
    contentsTitle: 'В этой статье',
    topics: [
      'Связь между СПКЯ и обменом веществ',
      'Что такое инсулинорезистентность',
      'Вес: что правда, а что нет',
      'Привычки, поддерживающие баланс',
      'Когда полезно медицинское наблюдение',
      'Главное',
    ],
    body1: 'СПКЯ часто связан с обменными изменениями, в том числе с инсулинорезистентностью. Однако эта связь касается не только женщин с избыточным весом — обменные профили различаются от человека к человеку.',
    body2: 'Инсулин — гормон, который помогает клеткам использовать глюкозу из крови. При инсулинорезистентности клетки хуже отвечают на этот гормон, и организм может компенсировать это выработкой большего количества инсулина.',
    body3: 'При СПКЯ это может сопровождаться повышенной выработкой андрогенов и способствовать некоторым симптомам. Но не у всех женщин с СПКЯ одинаковый обменный профиль.',
    tip1Title: 'ПОЛЕЗНО ЗНАТЬ',
    tip1Text: 'Инсулинорезистентность можно выявить с помощью анализов крови, когда врач считает это уместным. Необходимость обследования зависит от вашей индивидуальной ситуации.',
    weightFacts: [
      'СПКЯ встречается у женщин любого телосложения — от стройных до более плотных.',
      'Набор веса бывает не всегда.',
      'Снижение веса не всегда необходимо и не всегда само по себе достаточно, чтобы улучшить симптомы.',
      'Небольшое снижение веса иногда может улучшить некоторые показатели обмена веществ или регулярность цикла при избыточном весе.',
    ],
    body4: 'Цель не в том, чтобы гнаться за «идеальным» весом, а в том, чтобы выработать реалистичные и устойчивые привычки. Сбалансированное питание, движение и регулярный сон могут способствовать лучшему обменному здоровью.',
    dailyHabits: [
      'Регулярное и разнообразное питание, богатое клетчаткой',
      'Регулярная физическая активность, пусть и умеренная',
      'Достаточный и регулярный сон',
      'Достаточное потребление воды в течение дня',
    ],
    body5: 'Медицинское наблюдение при СПКЯ не ограничивается циклом и гормональными симптомами. В зависимости от вашего профиля врач может также контролировать некоторые обменные показатели, чтобы на раннем этапе выявлять возможные факторы риска.',
    medicalTitle: 'Наблюдение с учётом вашего профиля',
    medicalSubtitle: 'Обследование не одинаково для всех.',
    medicalDescription: 'Врач может принять решение проверить некоторые показатели с учётом ваших симптомов, истории болезни, семейной ситуации и других факторов риска.',
    medicalSectionTitle: 'Что может контролироваться',
    medicalChecks: [
      'Глюкоза крови и/или HbA1c — в зависимости от ситуации',
      'Липидный профиль (холестерин и триглицериды)',
      'Артериальное давление и оценка сердечно-сосудистого риска',
      'Контроль веса и окружности талии без осуждения',
    ],
    subH3: 'О чём стоит сообщить врачу',
    body6: 'Некоторые изменения стоит упомянуть на консультации, особенно если они новые, сохраняются долго или необычны для вас.',
    medicalFollowUp: [
      {title: 'Очень нерегулярный цикл', description: 'Сообщите о месячных, которые бывают очень редко или непредсказуемо.'},
      {title: 'Жажда или частое мочеиспускание', description: 'Обсудите с врачом, если эти признаки появляются необычным образом.'},
      {title: 'Заметное изменение веса', description: 'Быстрое или необъяснимое изменение стоит обсудить с врачом.'},
      {title: 'Семейный анамнез', description: 'Сообщите о случаях диабета или обменных нарушений в семье.'},
    ],
    alertTitle: 'Обратите внимание',
    alertText: 'О необычной жажде, частом мочеиспускании, стойкой усталости или заметном необъяснимом изменении веса следует сообщить медицинскому специалисту. Эти признаки могут иметь разные причины и сами по себе не подтверждают инсулинорезистентность или диабет.',
    followUpTipTitle: 'Наблюдение ведётся со временем',
    followUpTipText: 'Врач может предложить регулярные осмотры вместо единичного обследования. Цель — подбирать рекомендации и анализы с учётом вашей динамики, не сосредотачиваясь только на весе.',
    tip2Title: 'ПОЛЕЗНО ЗНАТЬ',
    tip2Text: 'Вес — лишь одна из составляющих обменной картины при СПКЯ. Комплексный подход учитывает цикл, симптомы, образ жизни, историю болезни и обменные показатели.',
    shareMessage: 'Вес, обмен веществ и инсулинорезистентность — AWA',
  },
  de: {
    badge: 'PCOS',
    title: 'Gewicht, Stoffwechsel und\nInsulinresistenz',
    metaDuration: '6 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Fortgeschritten',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Der Zusammenhang zwischen PCOS, Gewicht und Insulinresistenz – ohne Urteil und ohne Abkürzungen.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Der Zusammenhang zwischen PCOS und Stoffwechsel',
      'Insulinresistenz verstehen',
      'Gewicht: was stimmt und was nicht',
      'Gewohnheiten, die das Gleichgewicht unterstützen',
      'Wann ärztliche Begleitung hilfreich ist',
      'Das Wichtigste in Kürze',
    ],
    body1: 'PCOS wird häufig mit Stoffwechselveränderungen in Verbindung gebracht, darunter die Insulinresistenz. Dieser Zusammenhang betrifft jedoch nicht nur übergewichtige Frauen – Stoffwechselprofile sind von Person zu Person verschieden.',
    body2: 'Insulin ist ein Hormon, das den Zellen hilft, die Glukose im Blut zu verwerten. Bei Insulinresistenz sprechen die Zellen schlechter auf dieses Hormon an, und der Körper kann dies ausgleichen, indem er mehr Insulin produziert.',
    body3: 'Bei PCOS kann dies mit einer erhöhten Androgenproduktion einhergehen und zu bestimmten Symptomen beitragen. Doch nicht alle Frauen mit PCOS haben dasselbe Stoffwechselprofil.',
    tip1Title: 'Gut zu wissen',
    tip1Text: 'Eine Insulinresistenz kann durch Bluttests überprüft werden, wenn die Ärztin oder der Arzt es für sinnvoll hält. Ob Tests nötig sind, hängt von deiner individuellen Situation ab.',
    weightFacts: [
      'PCOS betrifft Frauen mit jeder Körperform, von schlank bis kräftiger.',
      'Eine Gewichtszunahme tritt nicht zwangsläufig auf.',
      'Abnehmen ist nicht immer nötig – oder allein nicht ausreichend –, um die Symptome zu verbessern.',
      'Eine geringe Gewichtsabnahme kann bei Übergewicht manchmal bestimmte Stoffwechselwerte oder die Regelmäßigkeit des Zyklus verbessern.',
    ],
    body4: 'Es geht nicht darum, einem „perfekten“ Gewicht nachzujagen, sondern realistische, dauerhafte Gewohnheiten aufzubauen. Eine ausgewogene Ernährung, Bewegung und regelmäßiger Schlaf können alle zu einer besseren Stoffwechselgesundheit beitragen.',
    dailyHabits: [
      'Regelmäßige, abwechslungsreiche und ballaststoffreiche Mahlzeiten',
      'Regelmäßige körperliche Aktivität, auch wenn sie moderat ist',
      'Ausreichend regelmäßiger Schlaf',
      'Ausreichend Flüssigkeit im Alltag',
    ],
    body5: 'Die ärztliche Begleitung bei PCOS beschränkt sich nicht auf den Zyklus oder hormonelle Symptome. Je nach deinem Profil kann dein medizinisches Fachpersonal auch bestimmte Stoffwechselwerte überwachen, um mögliche Risikofaktoren frühzeitig zu erkennen.',
    medicalTitle: 'Begleitung, die zu deinem Profil passt',
    medicalSubtitle: 'Die Untersuchungen sind nicht für alle gleich.',
    medicalDescription: 'Deine Ärztin oder dein Arzt kann entscheiden, bestimmte Werte anhand deiner Symptome, deiner Krankengeschichte, deiner familiären Situation und weiterer Risikofaktoren zu überprüfen.',
    medicalSectionTitle: 'Was überwacht werden kann',
    medicalChecks: [
      'Blutzucker und/oder HbA1c, je nach Zusammenhang',
      'Blutfettwerte (Cholesterin und Triglyceride)',
      'Blutdruck und Einschätzung des Herz-Kreislauf-Risikos',
      'Verlaufskontrolle von Gewicht und Taillenumfang, ohne Wertung',
    ],
    subH3: 'Situationen, die du ansprechen solltest',
    body6: 'Bestimmte Veränderungen solltest du in einer Sprechstunde erwähnen, besonders wenn sie neu, anhaltend oder für dich ungewöhnlich sind.',
    medicalFollowUp: [
      {title: 'Sehr unregelmäßiger Zyklus', description: 'Erwähne Perioden, die sehr weit auseinanderliegen oder unvorhersehbar sind.'},
      {title: 'Durst oder häufiges Wasserlassen', description: 'Sprich mit deiner Ärztin oder deinem Arzt, wenn diese Anzeichen ungewöhnlich auftreten.'},
      {title: 'Deutliche Gewichtsveränderung', description: 'Eine schnelle oder unerklärliche Veränderung sollte abgeklärt werden.'},
      {title: 'Familiäre Vorbelastung', description: 'Erwähne Diabetes oder Stoffwechselerkrankungen in deiner Familie.'},
    ],
    alertTitle: 'Bitte beachten',
    alertText: 'Ungewöhnlicher Durst, häufiges Wasserlassen, anhaltende Müdigkeit oder eine deutliche, unerklärliche Gewichtsveränderung solltest du medizinischem Fachpersonal mitteilen. Diese Anzeichen können mehrere Ursachen haben und bestätigen für sich allein weder eine Insulinresistenz noch Diabetes.',
    followUpTipTitle: 'Die Begleitung erfolgt über die Zeit',
    followUpTipText: 'Deine Ärztin oder dein Arzt schlägt dir möglicherweise regelmäßige Kontrolltermine statt einer einmaligen Untersuchung vor. Ziel ist es, Empfehlungen und Tests an deinen Verlauf anzupassen, ohne sich allein auf das Gewicht zu konzentrieren.',
    tip2Title: 'Gut zu wissen',
    tip2Text: 'Das Gewicht ist bei PCOS nur ein Teil des Stoffwechselbilds. Ein umfassender Ansatz berücksichtigt Zyklus, Symptome, Lebensgewohnheiten, Krankengeschichte und Stoffwechselwerte.',
    shareMessage: 'Gewicht, Stoffwechsel und Insulinresistenz — AWA',
  },
  zh: {
      badge: 'PCOS',
      title: '体重、代谢与\n胰岛素抵抗',
      metaDuration: '阅读约 6 分钟',
      metaType: '指南',
      metaLevel: '进阶',
      metaValidated: '已审阅内容',
      intro: 'PCOS 与体重、胰岛素抵抗之间的关系——不评判，也不走捷径。',
      contentsTitle: '本文内容',
      topics: [
        'PCOS 与代谢的关系',
        '了解胰岛素抵抗',
        '体重：哪些是事实，哪些不是',
        '有助于保持平衡的习惯',
        '何时需要医疗随访',
        '要点回顾',
      ],
      body1: 'PCOS 常与代谢变化有关，其中包括胰岛素抵抗。不过，这种关联并不只涉及超重的女性——每个人的代谢状况各不相同。',
      body2: '胰岛素是一种激素，帮助细胞利用血液中的葡萄糖。出现胰岛素抵抗时，细胞对这种激素的反应变差，身体可能会通过分泌更多胰岛素来代偿。',
      body3: '在 PCOS 中，这可能与雄激素分泌增加有关，并可能促成某些症状。但并非所有 PCOS 患者的代谢状况都相同。',
      tip1Title: '小贴士',
      tip1Text: '当医生认为有必要时，可以通过血液检查来评估胰岛素抵抗。是否需要检查，取决于你的个人情况。',
      weightFacts: [
        'PCOS 会出现在各种体型的女性身上，从偏瘦到偏胖都有。',
        '体重增加并不是必然的。',
        '减重不一定是改善症状所必需的，单靠减重也不一定足够。',
        '在存在超重的情况下，少量减重有时可以改善某些代谢指标或月经周期的规律性。',
      ],
      body4: '目标不是追求一个“完美”的体重，而是建立现实、可持续的习惯。均衡的饮食、活动和规律的睡眠，都有助于更好的代谢健康。',
      dailyHabits: [
        '规律、多样、富含膳食纤维的饮食',
        '规律的运动，即使强度适中',
        '充足而规律的睡眠',
        '每天摄入足够的水分',
      ],
      body5: 'PCOS 的医疗随访并不局限于月经周期或激素相关的症状。根据你的情况，医疗专业人员也可能监测某些代谢指标，以便及早发现潜在的风险因素。',
      medicalTitle: '根据你的情况量身定制的随访',
      medicalSubtitle: '每个人需要做的检查并不相同。',
      medicalDescription: '医生可能会根据你的症状、病史、家族情况和其他风险因素，决定检查哪些指标。',
      medicalSectionTitle: '可能会监测的内容',
      medicalChecks: [
        '血糖和／或糖化血红蛋白（HbA1c），视具体情况而定',
        '血脂检查（胆固醇和甘油三酯）',
        '血压和心血管风险评估',
        '体重和腰围的追踪，不带评判',
      ],
      subH3: '值得告诉医生的情况',
      body6: '某些变化值得在就诊时提出，尤其是当它们是新出现的、持续的，或对你来说不寻常时。',
      medicalFollowUp: [
        {
          title: '月经周期非常不规律',
          description: '请告诉医生月经间隔很长或难以预测的情况。',
        },
        {
          title: '口渴或尿频',
          description: '如果这些表现以不寻常的方式出现，请告诉你的医生。',
        },
        {
          title: '体重明显变化',
          description: '快速或无法解释的变化，值得去做评估。',
        },
        {
          title: '家族史',
          description: '请告知家族中是否有糖尿病或代谢性疾病的情况。',
        },
      ],
      alertTitle: '请注意',
      alertText: '异常的口渴、尿频、持续的疲劳，或无法解释的明显体重变化，都应告知医疗专业人员。这些表现可能有多种原因，单凭它们并不能确认胰岛素抵抗或糖尿病。',
      followUpTipTitle: '随访是一个持续的过程',
      followUpTipText: '医生可能会建议定期复查，而不是只做一次检查。目的是根据你的变化调整建议和检查，而不是只盯着体重。',
      tip2Title: '小贴士',
      tip2Text: '体重只是 PCOS 代谢状况的一部分。全面的评估会综合考虑月经周期、症状、生活习惯、病史和代谢指标。',
      shareMessage: '体重、代谢与胰岛素抵抗 — AWA',
    },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function PcosMetabolismArticleScreen({
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

          <Text style={styles.h2}>
            1. {content.topics[0]}
          </Text>

          <Text style={styles.body}>
            {content.body1}
          </Text>

          <Text style={styles.h2}>
            2. {content.topics[1]}
          </Text>

          <Text style={styles.body}>
            {content.body2}
          </Text>

          <Text style={styles.body}>
            {content.body3}
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
            3. {content.topics[2]}
          </Text>

          <View style={styles.checkList}>
            {content.weightFacts.map(item => (
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

          <Text style={styles.h2}>
            4. {content.topics[3]}
          </Text>

          <Text style={styles.body}>
            {content.body4}
          </Text>

          <View style={styles.daily}>
            {DAILY_HABIT_ICONS.map((icon, index) => (
              <View key={icon} style={styles.dailyItem}>
                <View style={styles.dailyIcon}>
                  <MaterialDesignIcons
                    name={icon as never}
                    color={theme.colors.primary}
                    size={24}
                  />
                </View>

                <Text style={styles.dailyText}>{content.dailyHabits[index]}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.h2}>
            5. {content.topics[4]}
          </Text>

          <Text style={styles.body}>
            {content.body5}
          </Text>

          <View style={styles.medicalCard}>
            <View style={styles.medicalHeader}>
              <View style={styles.medicalHeaderIcon}>
                <MaterialDesignIcons
                  name="stethoscope"
                  size={22}
                  color={theme.colors.primary}
                />
              </View>

              <View style={styles.medicalHeaderCopy}>
                <Text style={styles.medicalTitle}>
                  {content.medicalTitle}
                </Text>

                <Text style={styles.medicalSubtitle}>
                  {content.medicalSubtitle}
                </Text>
              </View>
            </View>

            <Text style={styles.medicalDescription}>
              {content.medicalDescription}
            </Text>

            <Text style={styles.medicalSectionTitle}>
              {content.medicalSectionTitle}
            </Text>

            <View style={styles.medicalChecks}>
              {content.medicalChecks.map((item, index) => (
                <View key={item} style={styles.medicalCheckRow}>
                  <View style={styles.medicalCheckNumber}>
                    <Text style={styles.medicalCheckNumberText}>
                      {index + 1}
                    </Text>
                  </View>

                  <Text style={styles.medicalCheckText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={styles.subH3}>{content.subH3}</Text>

          <Text style={styles.body}>
            {content.body6}
          </Text>

          <View style={styles.signalGrid}>
            {FOLLOW_UP_ICONS.map((icon, index) => (
              <View key={icon} style={styles.signalCard}>
                <View style={styles.signalIcon}>
                  <MaterialDesignIcons
                    name={icon as never}
                    size={22}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.signalTitle}>
                  {content.medicalFollowUp[index].title}
                </Text>

                <Text style={styles.signalDescription}>
                  {content.medicalFollowUp[index].description}
                </Text>
              </View>
            ))}
          </View>

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

          <View style={styles.followUpTip}>
            <MaterialDesignIcons
              name="calendar-heart"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                {content.followUpTipTitle}
              </Text>

              <Text style={styles.tipText}>
                {content.followUpTipText}
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>6. {content.topics[5]}</Text>

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
        </View>
      </ScrollView>

      <ReadingControls
        articleId={ID}
        durationMinutes={6}
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

  subH3: {
    marginTop: 22,
    fontSize: 17,
    lineHeight: 23,
    color: theme.colors.text,
    fontWeight: '800',
  },

  body: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
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

  daily: {
    marginTop: 13,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  dailyItem: {
    width: '48.7%',
    minHeight: 118,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  dailyIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  dailyText: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 16,
    color: theme.colors.text,
    textAlign: 'center',
  },

  medicalCard: {
    marginTop: 15,
    padding: 16,
    borderRadius: 15,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  medicalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  medicalHeaderIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  medicalHeaderCopy: {
    flex: 1,
    marginLeft: 11,
  },

  medicalTitle: {
    fontSize: 15,
    lineHeight: 20,
    color: theme.colors.text,
    fontWeight: '800',
  },

  medicalSubtitle: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 16,
    color: theme.colors.textMuted,
  },

  medicalDescription: {
    marginTop: 13,
    fontSize: 12.5,
    lineHeight: 19,
    color: theme.colors.textSecondary,
  },

  medicalSectionTitle: {
    marginTop: 16,
    marginBottom: 9,
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  medicalChecks: {
    gap: 8,
  },

  medicalCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },

  medicalCheckNumber: {
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  medicalCheckNumberText: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '800',
  },

  medicalCheckText: {
    flex: 1,
    marginLeft: 9,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  signalGrid: {
    marginTop: 13,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  signalCard: {
    width: '48.7%',
    minHeight: 145,
    padding: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  signalIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  signalTitle: {
    marginTop: 9,
    fontSize: 12.5,
    lineHeight: 17,
    color: theme.colors.text,
    fontWeight: '800',
  },

  signalDescription: {
    marginTop: 4,
    fontSize: 10.5,
    lineHeight: 15,
    color: theme.colors.textMuted,
  },

  alert: {
    marginTop: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },

  followUpTip: {
    marginTop: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  tip: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
  },

  tipCopy: {
    flex: 1,
    marginLeft: 11,
  },

  tipTitle: {
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.text,
    fontWeight: '800',
  },

  tipText: {
    marginTop: 3,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },
  });
}
