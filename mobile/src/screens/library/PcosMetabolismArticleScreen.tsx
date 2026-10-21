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
const CONTENT = withBrazilianPortuguese('PcosMetabolism', {
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
  id: {
    badge: 'PCOS',
    title: 'Berat badan, metabolisme, dan\nresistensi insulin',
    metaDuration: '6 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Menengah',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Hubungan antara PCOS, berat badan, dan resistensi insulin — tanpa menghakimi dan tanpa jalan pintas.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Hubungan antara PCOS dan metabolisme',
      'Memahami resistensi insulin',
      'Berat badan: apa yang benar dan apa yang tidak',
      'Kebiasaan yang mendukung keseimbangan',
      'Kapan pemantauan medis bermanfaat',
      'Poin-poin penting',
    ],
    body1: 'Sindrom ovarium polikistik (PCOS) sering dikaitkan dengan perubahan metabolik, termasuk resistensi insulin. Namun, kaitan ini tidak hanya menyangkut perempuan yang kelebihan berat badan — profil metabolik berbeda dari satu orang ke orang lain.',
    body2: 'Insulin adalah hormon yang membantu sel menggunakan glukosa dalam darah. Pada resistensi insulin, sel kurang responsif terhadap hormon ini, dan tubuh bisa mengompensasinya dengan menghasilkan lebih banyak insulin.',
    body3: 'Pada PCOS, hal ini bisa dikaitkan dengan peningkatan produksi androgen dan dapat berperan dalam munculnya beberapa gejala. Namun, tidak semua perempuan dengan PCOS memiliki profil metabolik yang sama.',
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Resistensi insulin bisa diperiksa lewat tes darah jika dokter menganggapnya perlu. Perlu tidaknya tes bergantung pada keadaan masing-masing.',
    weightFacts: [
      'PCOS dialami perempuan dengan berbagai bentuk tubuh, dari yang langsing hingga yang bertubuh lebih besar.',
      'Kenaikan berat badan tidak selalu terjadi.',
      'Menurunkan berat badan tidak selalu diperlukan — atau cukup — untuk memperbaiki gejala.',
      'Penurunan berat badan yang kecil terkadang bisa memperbaiki beberapa penanda metabolik atau keteraturan siklus jika ada kelebihan berat badan.',
    ],
    body4: 'Tujuannya bukan mengejar berat badan yang “sempurna”, melainkan membangun kebiasaan yang realistis dan bertahan lama. Pola makan seimbang, aktivitas fisik, dan tidur yang teratur semuanya bisa berkontribusi pada kesehatan metabolik yang lebih baik.',
    dailyHabits: [
      'Makan teratur dan bervariasi, kaya serat',
      'Aktivitas fisik secara rutin, meskipun sedang',
      'Tidur yang cukup dan teratur',
      'Asupan air yang cukup setiap hari',
    ],
    body5: 'Pemantauan medis untuk PCOS tidak terbatas pada siklus atau gejala hormonal. Tergantung profilmu, tenaga kesehatanmu mungkin juga memantau beberapa penanda metabolik untuk membantu mengenali faktor risiko sejak dini.',
    medicalTitle: 'Pemantauan yang disesuaikan dengan profilmu',
    medicalSubtitle: 'Pemeriksaannya tidak sama untuk semua orang.',
    medicalDescription: 'Dokter bisa memutuskan untuk memeriksa beberapa penanda berdasarkan gejalamu, riwayat kesehatanmu, keadaan keluargamu, dan faktor risiko lainnya.',
    medicalSectionTitle: 'Apa yang mungkin dipantau',
    medicalChecks: [
      'Gula darah dan/atau HbA1c, tergantung konteksnya',
      'Profil lipid (kolesterol dan trigliserida)',
      'Tekanan darah dan penilaian risiko kardiovaskular',
      'Pemantauan berat badan dan lingkar pinggang, tanpa menghakimi',
    ],
    subH3: 'Keadaan yang layak disampaikan',
    body6: 'Beberapa perubahan layak disampaikan saat konsultasi, terutama jika baru, menetap, atau tidak biasa bagimu.',
    medicalFollowUp: [
      {
        title: 'Siklus yang sangat tidak teratur',
        description: 'Sampaikan jika haidmu sangat jarang atau tidak bisa diprediksi.',
      },
      {
        title: 'Rasa haus atau sering buang air kecil',
        description: 'Bicaralah dengan dokter jika tanda-tanda ini muncul secara tidak biasa.',
      },
      {
        title: 'Perubahan berat badan yang signifikan',
        description: 'Perubahan yang cepat atau tidak jelas penyebabnya layak dievaluasi.',
      },
      {
        title: 'Riwayat keluarga',
        description: 'Sampaikan jika ada riwayat diabetes atau gangguan metabolik dalam keluargamu.',
      },
    ],
    alertTitle: 'Harap diperhatikan',
    alertText: 'Rasa haus yang tidak biasa, sering buang air kecil, kelelahan yang menetap, atau perubahan berat badan yang signifikan dan tidak jelas penyebabnya sebaiknya disampaikan kepada tenaga kesehatan. Tanda-tanda ini bisa memiliki beberapa penyebab dan, dengan sendirinya, tidak memastikan adanya resistensi insulin atau diabetes.',
    followUpTipTitle: 'Pemantauan berlangsung seiring waktu',
    followUpTipText: 'Dokter mungkin menyarankan pemeriksaan rutin, bukan hanya satu kali pemeriksaan menyeluruh. Tujuannya adalah menyesuaikan saran dan tes dengan perkembanganmu, tanpa hanya berfokus pada berat badan.',
    tip2Title: 'Perlu diketahui',
    tip2Text: 'Berat badan hanyalah satu bagian dari gambaran metabolik pada PCOS. Pendekatan yang menyeluruh mempertimbangkan siklus, gejala, kebiasaan hidup, riwayat kesehatan, dan penanda metabolik.',
    shareMessage: 'Berat badan, metabolisme, dan resistensi insulin — AWA',
  },
  hi: {
    badge: 'PCOS',
    title: 'वज़न, मेटाबॉलिज़्म और\nइंसुलिन रेज़िस्टेंस',
    metaDuration: '6 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'मध्यम',
    metaValidated: 'समीक्षा किया गया लेख',
    intro: 'PCOS, वज़न और इंसुलिन रेज़िस्टेंस के बीच का संबंध — बिना किसी जजमेंट और बिना शॉर्टकट के।',
    contentsTitle: 'इस लेख में',
    topics: [
      'PCOS और मेटाबॉलिज़्म का संबंध',
      'इंसुलिन रेज़िस्टेंस को समझना',
      'वज़न: क्या सच है और क्या नहीं',
      'संतुलन में मदद करने वाली आदतें',
      'मेडिकल फ़ॉलो-अप कब मददगार होता है',
      'मुख्य बातें',
    ],
    body1: 'PCOS अक्सर मेटाबॉलिक बदलावों से जुड़ा होता है, जिनमें इंसुलिन रेज़िस्टेंस भी शामिल है। लेकिन यह संबंध सिर्फ़ ज़्यादा वज़न वाली महिलाओं तक सीमित नहीं है — मेटाबॉलिक प्रोफ़ाइल हर व्यक्ति में अलग होती है।',
    body2: 'इंसुलिन एक हार्मोन है जो कोशिकाओं को खून में मौजूद ग्लूकोज़ का इस्तेमाल करने में मदद करता है। इंसुलिन रेज़िस्टेंस में कोशिकाएँ इस हार्मोन पर कम प्रतिक्रिया देती हैं, और शरीर इसकी भरपाई के लिए ज़्यादा इंसुलिन बना सकता है।',
    body3: 'PCOS में यह एंड्रोजन के बढ़े हुए उत्पादन से जुड़ा हो सकता है और कुछ लक्षणों में योगदान दे सकता है। लेकिन PCOS वाली सभी महिलाओं की मेटाबॉलिक प्रोफ़ाइल एक जैसी नहीं होती।',
    tip1Title: 'जानना अच्छा है',
    tip1Text: 'जब डॉक्टर ज़रूरी समझें, तो इंसुलिन रेज़िस्टेंस की जाँच ब्लड टेस्ट से की जा सकती है। टेस्ट की ज़रूरत है या नहीं, यह आपकी अपनी स्थिति पर निर्भर करता है।',
    weightFacts: [
      'PCOS हर तरह की कद-काठी की महिलाओं को होता है, दुबली से लेकर भारी शरीर तक।',
      'वज़न बढ़ना हमेशा नहीं होता।',
      'लक्षणों में सुधार के लिए वज़न घटाना हमेशा ज़रूरी नहीं है — और अकेले काफ़ी भी नहीं।',
      'जब वज़न ज़्यादा हो, तो थोड़ा-सा वज़न घटाने से कभी-कभी कुछ मेटाबॉलिक मार्कर या चक्र की नियमितता में सुधार हो सकता है।',
    ],
    body4: 'लक्ष्य किसी “परफ़ेक्ट” वज़न के पीछे भागना नहीं, बल्कि व्यावहारिक और टिकाऊ आदतें बनाना है। संतुलित खान-पान, शारीरिक गतिविधि और नियमित नींद, सब बेहतर मेटाबॉलिक सेहत में योगदान दे सकते हैं।',
    dailyHabits: [
      'नियमित, विविध और फ़ाइबर से भरपूर भोजन',
      'नियमित शारीरिक गतिविधि, भले ही हल्की हो',
      'पर्याप्त और नियमित नींद',
      'रोज़ाना पर्याप्त पानी पीना',
    ],
    body5: 'PCOS का मेडिकल फ़ॉलो-अप सिर्फ़ चक्र या हार्मोन से जुड़े लक्षणों तक सीमित नहीं है। आपकी प्रोफ़ाइल के अनुसार, आपके स्वास्थ्य विशेषज्ञ संभावित जोखिम कारकों को जल्दी पहचानने के लिए कुछ मेटाबॉलिक मार्कर की निगरानी भी कर सकते हैं।',
    medicalTitle: 'आपकी प्रोफ़ाइल के अनुसार फ़ॉलो-अप',
    medicalSubtitle: 'जाँच हर किसी के लिए एक जैसी नहीं होती।',
    medicalDescription: 'आपके डॉक्टर आपके लक्षणों, मेडिकल इतिहास, पारिवारिक स्थिति और अन्य जोखिम कारकों के आधार पर कुछ मार्कर जाँचने का फ़ैसला कर सकते हैं।',
    medicalSectionTitle: 'किन चीज़ों पर नज़र रखी जा सकती है',
    medicalChecks: [
      'ब्लड ग्लूकोज़ और/या HbA1c, संदर्भ के अनुसार',
      'लिपिड पैनल (कोलेस्ट्रॉल और ट्राइग्लिसराइड)',
      'ब्लड प्रेशर और हृदय संबंधी जोखिम का आकलन',
      'वज़न और कमर के घेरे पर नज़र, बिना किसी जजमेंट के',
    ],
    subH3: 'किन बातों का ज़िक्र करना चाहिए',
    body6: 'कुछ बदलावों का ज़िक्र कंसल्टेशन में करना चाहिए, ख़ासकर जब वे नए हों, बने रहें, या आपके लिए असामान्य हों।',
    medicalFollowUp: [
      {
        title: 'बहुत अनियमित चक्र',
        description: 'बहुत लंबे अंतराल पर या अनिश्चित समय पर आने वाले पीरियड्स के बारे में बताएँ।',
      },
      {
        title: 'प्यास या बार-बार पेशाब',
        description: 'अगर ये लक्षण असामान्य रूप से दिखें तो अपने डॉक्टर से बात करें।',
      },
      {
        title: 'वज़न में बड़ा बदलाव',
        description: 'तेज़ या बिना वजह बदलाव की जाँच करवाना ठीक रहता है।',
      },
      {
        title: 'पारिवारिक इतिहास',
        description: 'परिवार में डायबिटीज़ या मेटाबॉलिक समस्याओं का इतिहास हो तो बताएँ।',
      },
    ],
    alertTitle: 'ध्यान दें',
    alertText: 'असामान्य प्यास, बार-बार पेशाब, लगातार थकान, या वज़न में बिना वजह बड़ा बदलाव हो तो स्वास्थ्य विशेषज्ञ को बताएँ। इन संकेतों के कई कारण हो सकते हैं, और ये अपने आप में इंसुलिन रेज़िस्टेंस या डायबिटीज़ की पुष्टि नहीं करते।',
    followUpTipTitle: 'फ़ॉलो-अप समय के साथ चलता है',
    followUpTipText: 'आपके डॉक्टर एक बार की जाँच के बजाय नियमित चेक-अप का सुझाव दे सकते हैं। लक्ष्य यह है कि आपकी प्रगति के अनुसार सलाह और टेस्ट बदले जाएँ, सिर्फ़ वज़न पर ध्यान दिए बिना।',
    tip2Title: 'जानना अच्छा है',
    tip2Text: 'PCOS में वज़न मेटाबॉलिक तस्वीर का सिर्फ़ एक हिस्सा है। एक समग्र दृष्टिकोण में चक्र, लक्षण, जीवनशैली की आदतें, मेडिकल इतिहास और मेटाबॉलिक मार्कर, सबका ध्यान रखा जाता है।',
    shareMessage: 'वज़न, मेटाबॉलिज़्म और इंसुलिन रेज़िस्टेंस — AWA',
  },
  sq: {
    badge: 'PCOS',
    title: 'Pesha, metabolizmi dhe\nrezistenca ndaj insulinës',
    metaDuration: '6 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Mesatar',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Lidhja midis PCOS-it, peshës dhe rezistencës ndaj insulinës — pa gjykime dhe pa shkurtore.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Lidhja midis PCOS-it dhe metabolizmit',
      'Të kuptojmë rezistencën ndaj insulinës',
      'Pesha: çfarë është e vërtetë dhe çfarë jo',
      'Zakone që mbështesin ekuilibrin',
      'Kur ndihmon ndjekja mjekësore',
      'Në pak fjalë',
    ],
    body1: 'PCOS shpesh lidhet me ndryshime metabolike, përfshirë rezistencën ndaj insulinës. Megjithatë, kjo lidhje nuk prek vetëm gratë me peshë të tepërt — profilet metabolike ndryshojnë nga një person te tjetri.',
    body2: 'Insulina është një hormon që ndihmon qelizat të përdorin glukozën në gjak. Me rezistencën ndaj insulinës, qelizat i përgjigjen më pak mirë këtij hormoni dhe trupi mund ta kompensojë duke prodhuar më shumë insulinë.',
    body3: 'Në PCOS, kjo mund të lidhet me rritjen e prodhimit të androgjeneve dhe mund të kontribuojë në disa simptoma. Por jo të gjitha gratë me PCOS kanë të njëjtin profil metabolik.',
    tip1Title: 'Mirë është ta dish',
    tip1Text: 'Rezistenca ndaj insulinës mund të kontrollohet me analiza gjaku kur mjeku e çmon të përshtatshme. Nëse nevojiten analiza, kjo varet nga situata jote individuale.',
    weightFacts: [
      'PCOS prek gra të të gjitha trupave, nga të dobëtat te ato me ndërtim më të plotë.',
      'Shtimi në peshë nuk ndodh gjithmonë.',
      'Humbja e peshës nuk është gjithmonë e nevojshme — as e mjaftueshme vetë — për të përmirësuar simptomat.',
      'Një humbje e vogël peshe ndonjëherë mund të përmirësojë disa tregues metabolikë ose rregullsinë e ciklit kur ka peshë të tepërt.',
    ],
    body4: 'Qëllimi nuk është të ndjekësh një peshë “të përsosur”, por të ndërtosh zakone realiste dhe të qëndrueshme. Një ushqyerje e ekuilibruar, lëvizja dhe gjumi i rregullt mund të kontribuojnë të gjitha për një shëndet metabolik më të mirë.',
    dailyHabits: [
      'Vakte të rregullta e të larmishme, të pasura me fibra',
      'Aktivitet fizik i rregullt, qoftë edhe i moderuar',
      'Gjumë i mjaftueshëm dhe i rregullt',
      'Hidratim i mjaftueshëm çdo ditë',
    ],
    body5: 'Ndjekja mjekësore për PCOS nuk kufizohet te cikli ose simptomat hormonale. Sipas profilit tënd, ofruesi yt i shëndetësisë mund të monitorojë edhe disa tregues metabolikë për të ndihmuar në identifikimin e hershëm të faktorëve të mundshëm të rrezikut.',
    medicalTitle: 'Ndjekje e përshtatur me profilin tënd',
    medicalSubtitle: 'Kontrolli nuk është i njëjtë për të gjithë.',
    medicalDescription: 'Mjeku yt mund të vendosë të kontrollojë disa tregues sipas simptomave të tua, historisë mjekësore, situatës familjare dhe faktorëve të tjerë të rrezikut.',
    medicalSectionTitle: 'Çfarë mund të monitorohet',
    medicalChecks: [
      'Glicemia dhe/ose HbA1c, sipas kontekstit',
      'Profili i lipideve (kolesteroli dhe trigliceridet)',
      'Tensioni i gjakut dhe vlerësimi i rrezikut kardiovaskular',
      'Ndjekja e peshës dhe e perimetrit të belit, pa gjykime',
    ],
    subH3: 'Situata që vlen t’i përmendësh',
    body6: 'Disa ndryshime vlen t’i përmendësh gjatë një konsultimi, sidomos kur janë të reja, të vazhdueshme ose të pazakonta për ty.',
    medicalFollowUp: [
      {
        title: 'Cikle shumë të parregullta',
        description: 'Përmend menstruacionet që vijnë shumë rrallë ose që nuk mund të parashikohen.',
      },
      {
        title: 'Etje ose urinim i shpeshtë',
        description: 'Flit me mjekun tënd nëse këto shenja shfaqen në mënyrë të pazakontë.',
      },
      {
        title: 'Ndryshim i ndjeshëm i peshës',
        description: 'Një ndryshim i shpejtë ose i pashpjeguar vlen të vlerësohet.',
      },
      {
        title: 'Historia familjare',
        description: 'Përmend çdo histori familjare të diabetit ose të gjendjeve metabolike.',
      },
    ],
    alertTitle: 'Mos harro',
    alertText: 'Etja e pazakontë, urinimi i shpeshtë, lodhja e vazhdueshme ose një ndryshim i ndjeshëm i pashpjeguar i peshës duhen raportuar te një profesionist i shëndetësisë. Këto shenja mund të kenë disa shkaqe dhe vetvetiu nuk konfirmojnë rezistencën ndaj insulinës apo diabetin.',
    followUpTipTitle: 'Ndjekja bëhet me kalimin e kohës',
    followUpTipText: 'Mjeku yt mund të sugjerojë kontrolle të rregullta në vend të një kontrolli të vetëm. Qëllimi është t’i përshtatë këshillat dhe analizat me ecurinë tënde, pa u fokusuar vetëm te pesha.',
    tip2Title: 'Mirë është ta dish',
    tip2Text: 'Pesha është vetëm një pjesë e pamjes metabolike në PCOS. Një qasje gjithëpërfshirëse merr parasysh ciklet, simptomat, zakonet e jetesës, historinë mjekësore dhe treguesit metabolikë.',
    shareMessage: 'Pesha, metabolizmi dhe rezistenca ndaj insulinës — AWA',
  },
  ja: {
    badge: 'PCOS',
    title: '体重、代謝、\nインスリン抵抗性',
    metaDuration: '読了時間6分',
    metaType: 'ガイド',
    metaLevel: '中級',
    metaValidated: '確認済みコンテンツ',
    intro: 'PCOSと体重、インスリン抵抗性の関係を、決めつけや近道なしで解説します。',
    contentsTitle: 'この記事の内容',
    topics: [
      'PCOSと代謝の関係',
      'インスリン抵抗性を理解する',
      '体重について：本当のことと誤解',
      'バランスを支える習慣',
      '医療機関でのフォローアップが役立つとき',
      '重要なポイント',
    ],
    body1: 'PCOS（多嚢胞性卵巣症候群）は、インスリン抵抗性をはじめとする代謝の変化とよく関連づけられます。ただし、この関連は体重が多い女性だけに当てはまるものではなく、代謝の状態は人によって異なります。',
    body2: 'インスリンは、血液中のブドウ糖を細胞が利用するのを助けるホルモンです。インスリン抵抗性があると、細胞がこのホルモンに反応しにくくなり、体がそれを補おうとしてインスリンをより多く分泌することがあります。',
    body3: 'PCOSでは、これがアンドロゲン（男性ホルモン）の分泌増加と関連することがあり、一部の症状の一因となる場合があります。ただし、PCOSのすべての女性が同じ代謝の状態というわけではありません。',
    tip1Title: '知っておきたいこと',
    tip1Text: 'インスリン抵抗性は、医師が必要と判断した場合に血液検査で調べることができます。検査が必要かどうかは、個々の状況によります。',
    weightFacts: [
      'PCOSは、細身の人からふくよかな人まで、あらゆる体型の女性に起こります。',
      '体重が増えるとは限りません。',
      '症状を改善するために、減量が必ずしも必要とは限りません。減量だけで十分とも限りません。',
      '体重が多い場合には、わずかな減量でも、一部の代謝の指標や周期の規則性が改善することがあります。',
    ],
    body4: '目標は「理想的な」体重を追いかけることではなく、無理のない続けられる習慣をつくることです。バランスのよい食事、体を動かすこと、規則正しい睡眠は、いずれも代謝の健康に役立ちます。',
    dailyHabits: [
      '食物繊維が豊富な、規則的で多様な食事',
      '適度でもよいので、定期的な運動',
      '十分で規則的な睡眠',
      '毎日の十分な水分補給',
    ],
    body5: 'PCOSの医療的なフォローアップは、周期やホルモンに関する症状だけにとどまりません。状態によっては、医療従事者が一部の代謝の指標を確認し、考えられるリスク要因を早めに見つける手助けをすることもあります。',
    medicalTitle: '状態に合わせたフォローアップ',
    medicalSubtitle: '必要な検査は人によって異なります。',
    medicalDescription: '医師は、症状、既往歴、家族の状況、その他のリスク要因に基づいて、確認する指標を決めることがあります。',
    medicalSectionTitle: '確認される可能性のあるもの',
    medicalChecks: [
      '状況に応じて、血糖値やHbA1c',
      '脂質検査（コレステロールと中性脂肪）',
      '血圧と心血管リスクの評価',
      '体重とウエスト周囲径の経過観察（評価や批判はしません）',
    ],
    subH3: '伝えておきたい状況',
    body6: '診察の際に伝えておきたい変化があります。とくに、新しく現れたもの、続いているもの、ご自身にとって普段と違うものです。',
    medicalFollowUp: [
      {
        title: 'とても不規則な周期',
        description: '間隔が大きく空く、または予測できない生理を伝えましょう。',
      },
      {
        title: 'のどの渇きや頻尿',
        description: 'これらの兆候が普段と違う形で現れたら、医師に相談しましょう。',
      },
      {
        title: '体重の大きな変化',
        description: '急な変化や原因のわからない変化は、評価を受ける価値があります。',
      },
      {
        title: '家族歴',
        description: '糖尿病や代謝性の病気の家族歴があれば伝えましょう。',
      },
    ],
    alertTitle: 'ご注意ください',
    alertText: '普段と違うのどの渇き、頻尿、続く疲れ、原因のわからない大きな体重の変化は、医療従事者に伝えましょう。これらの兆候にはさまざまな原因があり、それだけでインスリン抵抗性や糖尿病が確定するわけではありません。',
    followUpTipTitle: 'フォローアップは時間をかけて行われます',
    followUpTipText: '医師は、1回の検査ではなく、定期的な診察を提案することがあります。目的は、体重だけに注目せず、経過に合わせて助言や検査を調整することです。',
    tip2Title: '知っておきたいこと',
    tip2Text: 'PCOSでは、体重は代謝の全体像の一部にすぎません。総合的な取り組みでは、周期、症状、生活習慣、既往歴、代謝の指標を合わせて考えます。',
    shareMessage: '体重、代謝、インスリン抵抗性 — AWA',
  },
  ko: {
    badge: 'PCOS',
    title: '체중, 대사,\n인슐린 저항성',
    metaDuration: '6분 읽기',
    metaType: '가이드',
    metaLevel: '중급',
    metaValidated: '검토된 콘텐츠',
    intro: 'PCOS와 체중, 인슐린 저항성의 관계를 판단하거나 단정하지 않고 알아봐요.',
    contentsTitle: '이 아티클에서 다루는 내용',
    topics: [
      'PCOS와 대사의 관계',
      '인슐린 저항성 이해하기',
      '체중에 대해 맞는 것과 틀린 것',
      '균형을 돕는 습관',
      '의학적 추적 관찰이 도움이 되는 때',
      '핵심 정리',
    ],
    body1: '다낭성 난소 증후군(PCOS)은 인슐린 저항성을 비롯한 대사 변화와 자주 관련돼요. 하지만 이 관련성이 과체중인 여성에게만 해당하는 것은 아니에요. 대사 상태는 사람마다 달라요.',
    body2: '인슐린은 세포가 혈액 속 포도당을 사용하도록 돕는 호르몬이에요. 인슐린 저항성이 있으면 세포가 이 호르몬에 덜 잘 반응하고, 몸은 인슐린을 더 많이 만들어 보완하려 할 수 있어요.',
    body3: 'PCOS에서는 이것이 안드로겐 생성 증가와 관련될 수 있고 일부 증상에 영향을 줄 수 있어요. 하지만 PCOS가 있는 모든 여성의 대사 상태가 같은 것은 아니에요.',
    tip1Title: '알아 두면 좋아요',
    tip1Text: '의사가 필요하다고 판단하면 혈액 검사로 인슐린 저항성을 확인할 수 있어요. 검사가 필요한지는 개인의 상황에 따라 달라요.',
    weightFacts: [
      'PCOS는 마른 체형부터 체격이 큰 체형까지 모든 체형의 여성에게 나타날 수 있어요.',
      '체중 증가가 늘 나타나는 것은 아니에요.',
      '증상을 개선하기 위해 체중 감량이 항상 필요한 것은 아니며, 그것만으로 충분하지도 않을 수 있어요.',
      '과체중이 있는 경우에는 약간의 체중 감량이 일부 대사 지표나 주기의 규칙성을 개선하는 데 도움이 될 때도 있어요.',
    ],
    body4: '목표는 “완벽한” 체중을 쫓는 것이 아니라 현실적이고 오래 이어갈 수 있는 습관을 만드는 거예요. 균형 잡힌 식사, 움직임, 규칙적인 수면이 모두 더 나은 대사 건강에 도움이 될 수 있어요.',
    dailyHabits: [
      '식이섬유가 풍부한 규칙적이고 다양한 식사',
      '적당한 정도라도 꾸준한 신체 활동',
      '충분하고 규칙적인 수면',
      '하루에 충분한 수분 섭취',
    ],
    body5: 'PCOS의 의학적 추적 관찰은 주기나 호르몬 증상에만 그치지 않아요. 상황에 따라 의료진이 일부 대사 지표도 살펴보고, 잠재적인 위험 요인을 일찍 찾아내는 데 도움을 줄 수 있어요.',
    medicalTitle: '나에게 맞춘 추적 관찰',
    medicalSubtitle: '검사 항목은 모두에게 같지 않아요.',
    medicalDescription: '의사는 증상, 병력, 가족 상황, 그 밖의 위험 요인에 따라 일부 지표를 확인하기로 할 수 있어요.',
    medicalSectionTitle: '살펴볼 수 있는 항목',
    medicalChecks: [
      '상황에 따라 혈당 및/또는 당화혈색소(HbA1c)',
      '지질 검사(콜레스테롤과 중성지방)',
      '혈압과 심혈관 위험 평가',
      '판단 없이 체중과 허리둘레 추적',
    ],
    subH3: '알려 두면 좋은 상황',
    body6: '새로 생겼거나 계속되거나 평소와 다른 변화는 진료 때 이야기해 두는 것이 좋아요.',
    medicalFollowUp: [
      {
        title: '매우 불규칙한 주기',
        description: '간격이 매우 길거나 예측할 수 없는 생리를 알려 주세요.',
      },
      {
        title: '갈증 또는 잦은 소변',
        description: '이런 증상이 평소와 다르게 나타나면 의사와 상담해 보세요.',
      },
      {
        title: '큰 체중 변화',
        description: '빠르거나 이유를 알 수 없는 변화는 평가를 받아 보는 것이 좋아요.',
      },
      {
        title: '가족력',
        description: '당뇨병이나 대사 질환의 가족력이 있다면 알려 주세요.',
      },
    ],
    alertTitle: '참고해 주세요',
    alertText: '평소와 다른 갈증, 잦은 소변, 계속되는 피로, 이유를 알 수 없는 큰 체중 변화는 의료 전문가에게 알려야 해요. 이런 증상은 여러 원인이 있을 수 있으며, 그것만으로 인슐린 저항성이나 당뇨병을 확진할 수는 없어요.',
    followUpTipTitle: '추적 관찰은 시간을 두고 이어져요',
    followUpTipText: '의사가 한 번의 검사 대신 정기적인 점검을 권할 수 있어요. 체중에만 집중하지 않고, 경과에 맞춰 조언과 검사를 조정하는 것이 목표예요.',
    tip2Title: '알아 두면 좋아요',
    tip2Text: 'PCOS에서 체중은 대사 상태의 한 부분일 뿐이에요. 종합적인 접근에서는 주기, 증상, 생활 습관, 병력, 대사 지표를 함께 살펴봐요.',
    shareMessage: '체중, 대사, 인슐린 저항성 — AWA',
  },
  'pt-PT': {
    badge: 'SOP',
    title: 'Peso, metabolismo e\nresistência à insulina',
    metaDuration: '6 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Intermédio',
    metaValidated: 'Conteúdo revisto',
    intro: 'A relação entre a síndrome do ovário poliquístico (SOP), o peso e a resistência à insulina — sem julgamentos nem atalhos.',
    contentsTitle: 'Neste artigo',
    topics: [
      'A relação entre a SOP e o metabolismo',
      'Compreender a resistência à insulina',
      'Peso: o que é verdade e o que não é',
      'Hábitos que favorecem o equilíbrio',
      'Quando o acompanhamento médico é útil',
      'Pontos essenciais',
    ],
    body1: 'A SOP está frequentemente associada a alterações metabólicas, nomeadamente à resistência à insulina. No entanto, esta associação não diz respeito apenas às mulheres com excesso de peso — os perfis metabólicos variam de pessoa para pessoa.',
    body2: 'A insulina é uma hormona que ajuda as células a utilizar a glicose presente no sangue. Com a resistência à insulina, as células respondem menos bem a esta hormona e o organismo pode compensar produzindo mais insulina.',
    body3: 'Na SOP, isto pode estar associado a um aumento da produção de androgénios e pode contribuir para certos sintomas. Mas nem todas as mulheres com SOP têm o mesmo perfil metabólico.',
    tip1Title: 'Bom saber',
    tip1Text: 'A resistência à insulina pode ser avaliada através de análises ao sangue quando o médico o considera pertinente. A necessidade de exames depende da sua situação individual.',
    weightFacts: [
      'A SOP afeta mulheres de todos os tipos físicos, desde as mais magras às de constituição mais forte.',
      'O aumento de peso não é sistemático.',
      'Perder peso nem sempre é necessário — nem suficiente por si só — para melhorar os sintomas.',
      'Uma pequena perda de peso pode, por vezes, melhorar certos marcadores metabólicos ou a regularidade do ciclo quando existe excesso de peso.',
    ],
    body4: 'O objetivo não é perseguir um peso “perfeito”, mas construir hábitos realistas e duradouros. Uma alimentação equilibrada, o movimento e um sono regular podem contribuir para uma melhor saúde metabólica.',
    dailyHabits: [
      'Refeições regulares e variadas, ricas em fibra',
      'Atividade física regular, ainda que moderada',
      'Sono suficiente e regular',
      'Hidratação diária suficiente',
    ],
    body5: 'O acompanhamento médico da SOP não se limita ao ciclo ou aos sintomas hormonais. Consoante o seu perfil, o seu profissional de saúde pode também vigiar certos marcadores metabólicos para ajudar a identificar precocemente potenciais fatores de risco.',
    medicalTitle: 'Acompanhamento adaptado ao seu perfil',
    medicalSubtitle: 'A avaliação não é igual para todas as mulheres.',
    medicalDescription: 'O seu médico pode decidir verificar certos marcadores com base nos seus sintomas, no seu historial médico, na sua situação familiar e noutros fatores de risco.',
    medicalSectionTitle: 'O que pode ser vigiado',
    medicalChecks: [
      'Glicemia e/ou HbA1c, consoante o contexto',
      'Perfil lipídico (colesterol e triglicéridos)',
      'Tensão arterial e avaliação do risco cardiovascular',
      'Acompanhamento do peso e do perímetro da cintura, sem julgamentos',
    ],
    subH3: 'Situações a mencionar',
    body6: 'Certas alterações merecem ser mencionadas numa consulta, sobretudo quando são recentes, persistentes ou fora do habitual para si.',
    medicalFollowUp: [
      {
        title: 'Ciclos muito irregulares',
        description: 'Mencione períodos muito espaçados ou imprevisíveis.',
      },
      {
        title: 'Sede ou vontade frequente de urinar',
        description: 'Fale com o seu médico se estes sinais surgirem de forma fora do comum.',
      },
      {
        title: 'Alteração significativa do peso',
        description: 'Uma alteração rápida ou inexplicada merece ser avaliada.',
      },
      {
        title: 'Antecedentes familiares',
        description: 'Mencione quaisquer antecedentes familiares de diabetes ou de doenças metabólicas.',
      },
    ],
    alertTitle: 'Atenção',
    alertText: 'Sede fora do comum, vontade frequente de urinar, cansaço persistente ou uma alteração significativa e inexplicada do peso devem ser comunicados a um profissional de saúde. Estes sinais podem ter várias causas e, por si só, não confirmam resistência à insulina nem diabetes.',
    followUpTipTitle: 'O acompanhamento faz-se ao longo do tempo',
    followUpTipText: 'O seu médico pode sugerir controlos regulares em vez de uma única avaliação. O objetivo é adaptar os conselhos e os exames à sua evolução, sem se concentrar apenas no peso.',
    tip2Title: 'Bom saber',
    tip2Text: 'O peso é apenas uma parte do quadro metabólico na SOP. Uma abordagem global tem em conta os ciclos, os sintomas, os hábitos de vida, o historial médico e os marcadores metabólicos.',
    shareMessage: 'Peso, metabolismo e resistência à insulina — AWA',
  },
  bn: {
    badge: 'পিসিওএস',
    title: 'ওজন, বিপাক ও\nইনসুলিন রেজিস্ট্যান্স',
    metaDuration: '6 মিনিটের পাঠ',
    metaType: 'গাইড',
    metaLevel: 'মধ্যম',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'পিসিওএস, ওজন ও ইনসুলিন রেজিস্ট্যান্সের মধ্যকার সম্পর্ক — বিচার বা সংক্ষিপ্ত সমাধান ছাড়াই।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'পিসিওএস ও বিপাকের সম্পর্ক',
      'ইনসুলিন রেজিস্ট্যান্স বোঝা',
      'ওজন: কোনটি সত্য আর কোনটি নয়',
      'ভারসাম্য বজায় রাখতে সহায়ক অভ্যাস',
      'কখন চিকিৎসাগত ফলো-আপ সহায়ক',
      'মূল কথা',
    ],
    body1: 'পলিসিস্টিক ওভারি সিনড্রোম (পিসিওএস) প্রায়ই বিপাকীয় পরিবর্তনের সঙ্গে যুক্ত, যার মধ্যে ইনসুলিন রেজিস্ট্যান্স রয়েছে। তবে এই সম্পর্ক শুধু অতিরিক্ত ওজনের নারীদের ক্ষেত্রেই সীমাবদ্ধ নয় — বিপাকীয় চিত্র একজন থেকে আরেকজনে ভিন্ন হয়।',
    body2: 'ইনসুলিন একটি হরমোন যা কোষগুলোকে রক্তের গ্লুকোজ ব্যবহার করতে সাহায্য করে। ইনসুলিন রেজিস্ট্যান্সে কোষগুলো এই হরমোনে কম সাড়া দেয়, এবং শরীর বেশি ইনসুলিন তৈরি করে তা পূরণ করার চেষ্টা করতে পারে।',
    body3: 'পিসিওএসে এটি অ্যান্ড্রোজেন উৎপাদন বৃদ্ধির সঙ্গে যুক্ত হতে পারে এবং কিছু উপসর্গের কারণ হতে পারে। তবে পিসিওএসে আক্রান্ত সব নারীর বিপাকীয় চিত্র একই নয়।',
    tip1Title: 'জেনে রাখা ভালো',
    tip1Text: 'ডাক্তার প্রয়োজনীয় মনে করলে রক্ত পরীক্ষার মাধ্যমে ইনসুলিন রেজিস্ট্যান্স যাচাই করা যায়। পরীক্ষার প্রয়োজন আছে কি না, তা আপনার ব্যক্তিগত অবস্থার ওপর নির্ভর করে।',
    weightFacts: [
      'পিসিওএস সব ধরনের শারীরিক গড়নের নারীকে প্রভাবিত করে, রোগা থেকে ভারী গড়ন পর্যন্ত।',
      'ওজন বাড়া অবধারিত নয়।',
      'উপসর্গ উন্নত করতে ওজন কমানো সবসময় প্রয়োজন নয় — বা এককভাবে যথেষ্টও নয়।',
      'অতিরিক্ত ওজন থাকলে সামান্য ওজন কমানো কখনো কখনো কিছু বিপাকীয় নির্দেশক বা চক্রের নিয়মিততা উন্নত করতে পারে।',
    ],
    body4: 'লক্ষ্য কোনো “নিখুঁত” ওজনের পেছনে ছোটা নয়, বরং বাস্তবসম্মত ও দীর্ঘস্থায়ী অভ্যাস গড়ে তোলা। সুষম খাদ্য, নিয়মিত চলাফেরা ও নিয়মিত ঘুম — সবই উন্নত বিপাকীয় স্বাস্থ্যে অবদান রাখতে পারে।',
    dailyHabits: [
      'আঁশসমৃদ্ধ নিয়মিত ও বৈচিত্র্যময় খাবার',
      'নিয়মিত শারীরিক কার্যকলাপ, মাঝারি হলেও',
      'পর্যাপ্ত ও নিয়মিত ঘুম',
      'প্রতিদিন পর্যাপ্ত পানি পান',
    ],
    body5: 'পিসিওএসের চিকিৎসাগত ফলো-আপ শুধু চক্র বা হরমোনজনিত উপসর্গের মধ্যে সীমাবদ্ধ নয়। আপনার অবস্থা অনুযায়ী, সম্ভাব্য ঝুঁকির কারণ আগেভাগে শনাক্ত করতে আপনার স্বাস্থ্যসেবা পেশাজীবী কিছু বিপাকীয় নির্দেশকও পর্যবেক্ষণ করতে পারেন।',
    medicalTitle: 'আপনার অবস্থা অনুযায়ী ফলো-আপ',
    medicalSubtitle: 'পরীক্ষানিরীক্ষা সবার জন্য এক নয়।',
    medicalDescription: 'আপনার উপসর্গ, চিকিৎসা ইতিহাস, পারিবারিক অবস্থা এবং অন্যান্য ঝুঁকির কারণ বিবেচনা করে আপনার ডাক্তার কিছু নির্দেশক যাচাই করার সিদ্ধান্ত নিতে পারেন।',
    medicalSectionTitle: 'কী কী পর্যবেক্ষণ করা হতে পারে',
    medicalChecks: [
      'রক্তের গ্লুকোজ এবং/অথবা HbA1c, পরিস্থিতি অনুযায়ী',
      'লিপিড প্যানেল (কোলেস্টেরল ও ট্রাইগ্লিসারাইড)',
      'রক্তচাপ এবং হৃদরোগের ঝুঁকি মূল্যায়ন',
      'ওজন ও কোমরের পরিধি পর্যবেক্ষণ, কোনো বিচার ছাড়াই',
    ],
    subH3: 'যেসব পরিস্থিতি জানানো উচিত',
    body6: 'কিছু পরিবর্তন পরামর্শের সময় জানানো ভালো, বিশেষ করে যখন সেগুলো নতুন, দীর্ঘস্থায়ী, বা আপনার জন্য অস্বাভাবিক।',
    medicalFollowUp: [
      {
        title: 'খুব অনিয়মিত চক্র',
        description: 'অনেক বিরতিতে হওয়া বা অনুমান করা যায় না এমন মাসিকের কথা জানান।',
      },
      {
        title: 'তৃষ্ণা বা ঘন ঘন প্রস্রাব',
        description: 'এই লক্ষণগুলো অস্বাভাবিকভাবে দেখা দিলে ডাক্তারকে বলুন।',
      },
      {
        title: 'ওজনে উল্লেখযোগ্য পরিবর্তন',
        description: 'দ্রুত বা কারণ ছাড়া পরিবর্তন হলে তা মূল্যায়ন করিয়ে নেওয়া ভালো।',
      },
      {
        title: 'পারিবারিক ইতিহাস',
        description: 'পরিবারে ডায়াবেটিস বা বিপাকীয় সমস্যার ইতিহাস থাকলে তা জানান।',
      },
    ],
    alertTitle: 'মনে রাখবেন',
    alertText: 'অস্বাভাবিক তৃষ্ণা, ঘন ঘন প্রস্রাব, স্থায়ী ক্লান্তি, বা ওজনে উল্লেখযোগ্য ও কারণহীন পরিবর্তন কোনো স্বাস্থ্যসেবা পেশাজীবীকে জানানো উচিত। এই লক্ষণগুলোর একাধিক কারণ থাকতে পারে এবং এগুলো এককভাবে ইনসুলিন রেজিস্ট্যান্স বা ডায়াবেটিস নিশ্চিত করে না।',
    followUpTipTitle: 'ফলো-আপ সময়ের সঙ্গে চলে',
    followUpTipText: 'আপনার ডাক্তার একবারের পরীক্ষার বদলে নিয়মিত চেক-আপের পরামর্শ দিতে পারেন। লক্ষ্য হলো শুধু ওজনের ওপর মনোযোগ না দিয়ে আপনার অগ্রগতি অনুযায়ী পরামর্শ ও পরীক্ষা মানিয়ে নেওয়া।',
    tip2Title: 'জেনে রাখা ভালো',
    tip2Text: 'পিসিওএসে বিপাকীয় চিত্রের একটি অংশ মাত্র ওজন। একটি সামগ্রিক পদ্ধতিতে চক্র, উপসর্গ, জীবনযাত্রার অভ্যাস, চিকিৎসা ইতিহাস ও বিপাকীয় নির্দেশক বিবেচনা করা হয়।',
    shareMessage: 'ওজন, বিপাক ও ইনসুলিন রেজিস্ট্যান্স — AWA',
  },
} as const);

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

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.intro}>
            {content.intro}
          </AwaText>

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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            1. {content.topics[0]}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body1}
          </AwaText>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            2. {content.topics[1]}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body2}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body3}
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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            3. {content.topics[2]}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.weightFacts.map(item => (
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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            4. {content.topics[3]}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body4}
          </AwaText>

          <View style={styles.daily}>
            {DAILY_HABIT_ICONS.map((icon, index) => (
              <AwaCard variant="filled" padding="none" key={icon} style={styles.dailyItem}>
                <View style={styles.dailyIcon}>
                  <MaterialDesignIcons
                    name={icon as never}
                    color={theme.colors.primary}
                    size={24}
                  />
                </View>

                <AwaText variant="bodySmall" style={styles.dailyText}>{content.dailyHabits[index]}</AwaText>
              </AwaCard>
            ))}
          </View>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            5. {content.topics[4]}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body5}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.medicalCard}>
            <View style={styles.medicalHeader}>
              <View style={styles.medicalHeaderIcon}>
                <MaterialDesignIcons
                  name="stethoscope"
                  size={22}
                  color={theme.colors.primary}
                />
              </View>

              <View style={styles.medicalHeaderCopy}>
                <AwaText variant="titleMedium" emphasized>
                  {content.medicalTitle}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.medicalSubtitle}>
                  {content.medicalSubtitle}
                </AwaText>
              </View>
            </View>

            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.medicalDescription}>
              {content.medicalDescription}
            </AwaText>

            <AwaText variant="titleSmall" emphasized style={styles.medicalSectionTitle}>
              {content.medicalSectionTitle}
            </AwaText>

            <View style={styles.medicalChecks}>
              {content.medicalChecks.map((item, index) => (
                <View key={item} style={styles.medicalCheckRow}>
                  <View style={styles.medicalCheckNumber}>
                    <AwaText variant="labelSmall" emphasized colorRole="primary">
                      {index + 1}
                    </AwaText>
                  </View>

                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.medicalCheckText}>{item}</AwaText>
                </View>
              ))}
            </View>
          </AwaCard>

          <AwaText variant="titleMedium" emphasized style={styles.subH3}>{content.subH3}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body6}
          </AwaText>

          <View style={styles.signalGrid}>
            {FOLLOW_UP_ICONS.map((icon, index) => (
              <AwaCard variant="filled" padding="none" key={icon} style={styles.signalCard}>
                <View style={styles.signalIcon}>
                  <MaterialDesignIcons
                    name={icon as never}
                    size={22}
                    color={theme.colors.primary}
                  />
                </View>

                <AwaText variant="titleSmall" emphasized style={styles.signalTitle}>
                  {content.medicalFollowUp[index].title}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.signalDescription}>
                  {content.medicalFollowUp[index].description}
                </AwaText>
              </AwaCard>
            ))}
          </View>

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.alertTitle}</AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.alertText}
              </AwaText>
            </View>
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.followUpTip}>
            <MaterialDesignIcons
              name="calendar-heart"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.followUpTipTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.followUpTipText}
              </AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>6. {content.topics[5]}</AwaText>

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
    marginTop: 24,
  },

  subH3: {
    marginTop: 24,
  },

  body: {
    marginTop: 8,
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

  checkText: {
    flex: 1,
  },

  daily: {
    marginTop: 12,
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
    textAlign: 'center',
  },

  medicalCard: {
    marginTop: 16,
    padding: 16,
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
    marginLeft: 12,
  },


  medicalSubtitle: {
    marginTop: 2,
  },

  medicalDescription: {
    marginTop: 12,
  },

  medicalSectionTitle: {
    marginTop: 16,
    marginBottom: 8,
  },

  medicalChecks: {
    gap: 8,
  },

  medicalCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },

  medicalCheckNumber: {
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },


  medicalCheckText: {
    flex: 1,
    marginLeft: 8,
  },

  signalGrid: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  signalCard: {
    width: '48.7%',
    minHeight: 145,
    padding: 12,
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
    marginTop: 8,
  },

  signalDescription: {
    marginTop: 4,
  },

  alert: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },

  followUpTip: {
    marginTop: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    marginTop: 3,
  },
  });
}
