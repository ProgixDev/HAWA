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
  da: {
    badge: 'PCOS',
    title: 'Vægt, stofskifte og\ninsulinresistens',
    metaDuration: '6 minutters læsning',
    metaType: 'Guide',
    metaLevel: 'Mellem',
    metaValidated: 'Gennemgået indhold',
    intro: 'Sammenhængen mellem PCOS, vægt og insulinresistens — uden dom og uden lette løsninger.',
    contentsTitle: 'I denne artikel',
    topics: [
      'PCOS og stofskiftet',
      'Forståelse af insulinresistens',
      'Vægt: hvad der er sandt, og hvad der ikke er',
      'Vaner der støtter balancen',
      'Hvornår medicinsk opfølgning er nyttig',
      'Det vigtigste',
    ],
    body1: 'Polycystisk ovariesyndrom (PCOS) er ofte forbundet med metaboliske forandringer, herunder insulinresistens. Men denne sammenhæng er ikke begrænset til kvinder med overvægt — det metaboliske billede varierer fra person til person.',
    body2: 'Insulin er et hormon, der hjælper cellerne med at optage glukose fra blodet. Ved insulinresistens reagerer cellerne dårligere på dette hormon, og kroppen kan forsøge at kompensere ved at producere mere insulin.',
    body3: 'Ved PCOS kan dette hænge sammen med øget androgenproduktion og bidrage til visse symptomer. Men ikke alle med PCOS har samme metaboliske billede.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Insulinresistens kan undersøges via blodprøver, hvis lægen finder det relevant. Om det er nødvendigt afhænger af din individuelle situation.',
    weightFacts: [
      'PCOS påvirker kvinder med alle kropstyper, fra slank til fyldigere bygning.',
      'Vægtøgning er ikke uundgåeligt.',
      'Vægttab er ikke altid nødvendigt for at forbedre symptomerne — eller tilstrækkeligt alene.',
      'Hos dem med overvægt kan et moderat vægttab nogle gange forbedre visse metaboliske markører eller cyklussens regelmæssighed.',
    ],
    body4: 'Målet er ikke at jage en "perfekt" vægt, men at opbygge realistiske og bæredygtige vaner. Varieret kost, regelmæssig bevægelse og tilstrækkelig søvn kan alle bidrage til et bedre metabolisk helbred.',
    dailyHabits: [
      'Regelmæssige, varierede måltider med fokus på fiberrige fødevarer',
      'Regelmæssig fysisk aktivitet, selv på moderat niveau',
      'Tilstrækkelig og regelmæssig søvn',
      'Tilstrækkelig væskeindtag hver dag',
    ],
    body5: 'Medicinsk opfølgning ved PCOS er ikke begrænset til cyklus- eller hormonsymptomer. Afhængigt af din situation kan din sundhedsperson også overvåge visse metaboliske markører for at identificere eventuelle risikofaktorer tidligt.',
    medicalTitle: 'Opfølgning tilpasset din situation',
    medicalSubtitle: 'Undersøgelserne er ikke ens for alle.',
    medicalDescription: 'Din læge kan beslutte at tjekke visse markører baseret på dine symptomer, din sygehistorie, din familiesituation og andre risikofaktorer.',
    medicalSectionTitle: 'Hvad der kan overvåges',
    medicalChecks: [
      'Blodsukker og/eller HbA1c, afhængigt af situationen',
      'Lipidpanel (kolesterol og triglycerider)',
      'Blodtryk og vurdering af hjerte-kar-risiko',
      'Vægt og taljemål, uden dom',
    ],
    subH3: 'Situationer du bør nævne',
    body6: 'Visse forandringer er værd at nævne til din konsultation, særligt når de er nye, vedvarende eller usædvanlige for dig.',
    medicalFollowUp: [
      {
        title: 'Meget uregelmæssig cyklus',
        description: 'Fortæl om menstruation, der er sjælden eller uforudsigelig.',
      },
      {
        title: 'Øget tørst eller hyppig vandladning',
        description: 'Nævn det over for din læge, hvis disse symptomer opstår usædvanligt.',
      },
      {
        title: 'Betydelig vægtvariaton',
        description: 'Hurtige eller grundløse ændringer bør vurderes.',
      },
      {
        title: 'Familiehistorie',
        description: 'Fortæl det, hvis der er diabetes eller metaboliske problemer i din familie.',
      },
    ],
    alertTitle: 'Husk',
    alertText: 'Usædvanlig tørst, hyppig vandladning, vedvarende træthed eller betydelig og grundløs vægtvariaton bør nævnes for en sundhedsperson. Disse symptomer kan have flere årsager og bekræfter ikke i sig selv insulinresistens eller diabetes.',
    followUpTipTitle: 'Opfølgning sker over tid',
    followUpTipText: 'Din læge kan anbefale regelmæssige tjek frem for en enkelt undersøgelse. Målet er at tilpasse rådgivning og prøver til din udvikling — ikke kun at fokusere på vægten.',
    tip2Title: 'Godt at vide',
    tip2Text: 'Vægten er kun én del af det metaboliske billede ved PCOS. En helhedsorienteret tilgang tager cyklus, symptomer, livsstilsvaner, sygehistorie og metaboliske markører med i betragtning.',
    shareMessage: 'Vægt, stofskifte og insulinresistens — AWA',
  },
  sv: {
    badge: 'PCOS',
    title: 'Vägt, stofskifte og\ninsulinresistens',
    metaDuration: '6 minutters läsning',
    metaType: 'Guide',
    metaLevel: 'Mellem',
    metaValidated: 'Gennemgået indhold',
    intro: 'Sammenhängen mellem PCOS, vägt och insulinresistens — uden dom och uden lette lösninger.',
    contentsTitle: 'I denne artikel',
    topics: [
      'PCOS och stofskiftet',
      'Forståelse av insulinresistens',
      'Vägt: hvad der ar sandt, och hvad der inte er',
      'Vaner der stötter balancen',
      'Hvornår medicinsk opfölgning ar nyttig',
      'Det vigtigste',
    ],
    body1: 'Polycystisk ovariesyndrom (PCOS) ar ofta forbundet med metaboliske forandringer, herunder insulinresistens. Men denne sammenhäng ar inte begränset till kvinnor med overvägt — det metaboliske billede varierer fran person till person.',
    body2: 'Insulin ar et hormon, der hjälper cellerne med at optage glukose fran blodet. Ved insulinresistens reagerer cellerne dårligere på dette hormon, och kroppen kan forsöge at kompensere ved at producere mere insulin.',
    body3: 'Ved PCOS kan dette hänge sammen med öget androgenproduktion och bidrage till visse symtom. Men inte alla med PCOS har samme metaboliske billede.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Insulinresistens kan undersöges via blodpröver, hvis lägen finder det relevant. Om det ar nödvendigt afhänger av din individuelle situation.',
    weightFacts: [
      'PCOS påvirker kvinnor med alla kropstyper, fran slank till fyldigere bygning.',
      'Vägtögning ar inte uundgåeligt.',
      'Vägttab ar inte alltid nödvendigt for att forbedre symtomne — eller tilsträkkeligt alene.',
      'Hos dem med overvägt kan et moderat vägttab nogle gange forbedre visse metaboliske markörer eller cyklussens regelmässighed.',
    ],
    body4: 'Målet ar inte at jage en "perfekt" vägt, men at opbygge realistiske och bäredygtige vaner. Varieret kost, regelmässig bevägelse och tilsträkkelig sövn kan alla bidrage till et bedre metabolisk helbred.',
    dailyHabits: [
      'Regelmässige, varierede måltider med fokus på fiberrige födevarer',
      'Regelmässig fysisk aktivitet, selv på moderat niveau',
      'Tilsträkkelig och regelmässig sövn',
      'Tilsträkkelig väskeindtag hver dag',
    ],
    body5: 'Medicinsk opfölgning ved PCOS ar inte begränset till cyklus- eller hormonsymtom. Afhängigt av din situation kan din halsasperson også overvåge visse metaboliske markörer for att identificere eventuelle risikofaktorer tidligt.',
    medicalTitle: 'Opfölgning tilpasset din situation',
    medicalSubtitle: 'Undersögelserne ar inte ens for alle.',
    medicalDescription: 'Din läge kan beslutte at tjekke visse markörer baseret på dina symtom, din sygehistorie, din familiesituation och andre risikofaktorer.',
    medicalSectionTitle: 'Hvad der kan overvåges',
    medicalChecks: [
      'Blodsukker og/eller HbA1c, afhängigt av situationen',
      'Lipidpanel (kolesterol och triglycerider)',
      'Blodtryk och vurdering av hjerte-kar-risiko',
      'Vägt och taljemål, uden dom',
    ],
    subH3: 'Situationer du bör nävne',
    body6: 'Visse forandringer ar värd at nävne till din konsultation, särligt når de ar nye, vedvarende eller usädvanlige for dig.',
    medicalFollowUp: [
      {
        title: 'Meget uregelmässig cyklus',
        description: 'Fortäl om menstruation, der ar själden eller uforudsigelig.',
      },
      {
        title: 'Öget törst eller hyppig vandladning',
        description: 'Nävn det over for din läge, hvis disse symtom opstår usädvanligt.',
      },
      {
        title: 'Betydelig vägtvariaton',
        description: 'Hurtige eller grundlöse ändringer bör vurderes.',
      },
      {
        title: 'Familiehistorie',
        description: 'Fortäl det, hvis der ar diabetes eller metaboliske problemer i din familie.',
      },
    ],
    alertTitle: 'Husk',
    alertText: 'Usädvanlig törst, hyppig vandladning, vedvarende träthed eller betydelig och grundlös vägtvariaton bör nävnes for en halsasperson. Disse symtom kan have flere årsager och bekräfter inte i sig selv insulinresistens eller diabetes.',
    followUpTipTitle: 'Opfölgning sker over tid',
    followUpTipText: 'Din läge kan anbefale regelmässige tjek frem for en enkelt undersögelse. Målet ar at tilpasse rådgivning och pröver till din udvikling — inte kun at fokusere på vägten.',
    tip2Title: 'Godt at vide',
    tip2Text: 'Vägten ar kun én del av det metaboliske billede ved PCOS. En helhedsorienteret tilgang tager cyklus, symtom, livsstilsvaner, sygehistorie och metaboliske markörer med i betragtning.',
    shareMessage: 'Vägt, stofskifte och insulinresistens — AWA',
  },
  nb: {
    badge: 'PCOS',
    title: 'Vekt, stoffskifte og\ninsulinresistens',
    metaDuration: '6 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Middels',
    metaValidated: 'Gjennomgått innhold',
    intro: 'Sammenhengen mellom PCOS, vekt og insulinresistens – uten fordømmelse eller snarveier.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Sammenhengen mellom PCOS og stoffskifte',
      'Forstå insulinresistens',
      'Vekt: hva som er sant og ikke sant',
      'Vaner som støtter balansen',
      'Når medisinsk oppfølging er nyttig',
      'Det viktigste å huske',
    ],
    body1: 'PCOS er ofte forbundet med metabolske endringer, blant annet insulinresistens. Denne sammenhengen gjelder imidlertid ikke bare kvinner med overvekt – metabolske profiler varierer fra person til person.',
    body2: 'Insulin er et hormon som hjelper cellene å bruke glukosen i blodet. Ved insulinresistens reagerer cellene dårligere på dette hormonet, og kroppen kan kompensere ved å produsere mer insulin.',
    body3: 'Ved PCOS kan dette være forbundet med økt produksjon av androgener og kan bidra til visse symptomer. Men ikke alle kvinner med PCOS har samme metabolske profil.',
    tip1Title: 'Godt å vite',
    tip1Text: 'Insulinresistens kan undersøkes med blodprøver når legen mener det er relevant. Om prøver er nødvendige, avhenger av din individuelle situasjon.',
    weightFacts: [
      'PCOS rammer kvinner av alle kroppstyper, fra slanke til kraftigere bygde.',
      'Vektøkning er ikke systematisk.',
      'Å gå ned i vekt er ikke alltid nødvendig – eller nok alene – for å bedre symptomene.',
      'Et lite vekttap kan noen ganger bedre visse metabolske markører eller syklusens regelmessighet når det foreligger overvekt.',
    ],
    body4: 'Målet er ikke å jage en «perfekt» vekt, men å bygge realistiske, varige vaner. Et balansert kosthold, bevegelse og regelmessig søvn kan alle bidra til bedre metabolsk helse.',
    dailyHabits: [
      'Regelmessige, varierte måltider rike på fiber',
      'Regelmessig fysisk aktivitet, selv om den er moderat',
      'Nok og regelmessig søvn',
      'Nok væske hver dag',
    ],
    body5: 'Medisinsk oppfølging ved PCOS er ikke begrenset til syklusen eller hormonelle symptomer. Avhengig av profilen din kan helsepersonellet også følge visse metabolske markører for å hjelpe med å oppdage mulige risikofaktorer tidlig.',
    medicalTitle: 'Oppfølging tilpasset profilen din',
    medicalSubtitle: 'Utredningen er ikke den samme for alle.',
    medicalDescription: 'Legen din kan bestemme seg for å kontrollere visse markører ut fra symptomene dine, sykehistorien din, familiesituasjonen din og andre risikofaktorer.',
    medicalSectionTitle: 'Hva som kan følges',
    medicalChecks: [
      'Blodsukker og/eller HbA1c, avhengig av sammenhengen',
      'Fettprofil (kolesterol og triglyserider)',
      'Blodtrykk og vurdering av hjerte- og karrisiko',
      'Oppfølging av vekt og livvidde, uten fordømmelse',
    ],
    subH3: 'Situasjoner det er verdt å nevne',
    body6: 'Visse endringer er verdt å nevne under en konsultasjon, særlig når de er nye, vedvarende eller uvanlige for deg.',
    medicalFollowUp: [
      {title: 'Svært uregelmessige sykluser', description: 'Nevn menstruasjoner som ligger svært spredt eller er uforutsigbare.'},
      {title: 'Tørste eller hyppig vannlating', description: 'Snakk med legen din hvis disse tegnene dukker opp på en uvanlig måte.'},
      {title: 'Betydelig vektendring', description: 'En rask eller uforklarlig endring er verdt å få vurdert.'},
      {title: 'Sykdom i familien', description: 'Nevn eventuell diabetes eller metabolske tilstander i familien.'},
    ],
    alertTitle: 'Merk',
    alertText: 'Uvanlig tørste, hyppig vannlating, vedvarende tretthet eller en betydelig, uforklarlig endring i vekt bør meldes til helsepersonell. Disse tegnene kan ha flere årsaker og bekrefter ikke i seg selv insulinresistens eller diabetes.',
    followUpTipTitle: 'Oppfølgingen skjer over tid',
    followUpTipText: 'Legen din kan foreslå regelmessige kontroller heller enn én enkelt utredning. Målet er å tilpasse råd og prøver til hvordan du utvikler deg, uten å fokusere bare på vekt.',
    tip2Title: 'Godt å vite',
    tip2Text: 'Vekt er bare én del av det metabolske bildet ved PCOS. En helhetlig tilnærming tar hensyn til sykluser, symptomer, livsstilsvaner, sykehistorie og metabolske markører.',
    shareMessage: 'Vekt, stoffskifte og insulinresistens – AWA',
  },
  pl: {
    badge: 'PCOS',
    title: 'Waga, metabolizm i\ninsulinooporność',
    metaDuration: '6 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Średnio zaawansowany',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Związek między PCOS, wagą i insulinoopornością — bez oceniania i uproszczeń.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Związek między PCOS a metabolizmem',
      'Zrozumieć insulinooporność',
      'Waga: co jest prawdą, a co nie',
      'Nawyki wspierające równowagę',
      'Kiedy pomocna jest opieka medyczna',
      'Najważniejsze wnioski',
    ],
    body1: 'PCOS jest często powiązany ze zmianami metabolicznymi, w tym z insulinoopornością. To powiązanie nie dotyczy jednak wyłącznie kobiet z nadwagą — profile metaboliczne są różne u poszczególnych osób.',
    body2: 'Insulina to hormon, który pomaga komórkom wykorzystywać glukozę z krwi. Przy insulinooporności komórki słabiej reagują na ten hormon, a organizm może to kompensować, produkując więcej insuliny.',
    body3: 'W PCOS może to być związane ze zwiększoną produkcją androgenów i może przyczyniać się do niektórych objawów. Nie każda kobieta z PCOS ma jednak taki sam profil metaboliczny.',
    tip1Title: 'Warto wiedzieć',
    tip1Text: 'Insulinooporność można sprawdzić badaniami krwi, gdy lekarz uzna to za zasadne. To, czy badania są potrzebne, zależy od Twojej indywidualnej sytuacji.',
    weightFacts: [
      'PCOS dotyka kobiety o każdej budowie ciała, od szczupłych po z większą masą ciała.',
      'Przyrost wagi nie występuje zawsze.',
      'Utrata wagi nie zawsze jest konieczna — ani sama w sobie wystarczająca — aby poprawić objawy.',
      'Niewielka utrata wagi może czasem poprawić niektóre parametry metaboliczne lub regularność cyklu, gdy występuje nadwaga.',
    ],
    body4: 'Celem nie jest pogoń za „idealną” wagą, lecz budowanie realistycznych, trwałych nawyków. Zbilansowana dieta, ruch i regularny sen mogą przyczynić się do lepszego zdrowia metabolicznego.',
    dailyHabits: [
      'Regularne, urozmaicone posiłki bogate w błonnik',
      'Regularna aktywność fizyczna, nawet umiarkowana',
      'Wystarczająca ilość regularnego snu',
      'Odpowiednie nawodnienie każdego dnia',
    ],
    body5: 'Opieka medyczna w PCOS nie ogranicza się do cyklu ani objawów hormonalnych. W zależności od Twojego profilu lekarz może też monitorować niektóre parametry metaboliczne, aby wcześnie wykryć potencjalne czynniki ryzyka.',
    medicalTitle: 'Opieka dopasowana do Twojego profilu',
    medicalSubtitle: 'Zakres badań nie jest taki sam dla wszystkich.',
    medicalDescription: 'Lekarz może zdecydować o sprawdzeniu niektórych parametrów na podstawie Twoich objawów, historii medycznej, sytuacji rodzinnej i innych czynników ryzyka.',
    medicalSectionTitle: 'Co może być monitorowane',
    medicalChecks: [
      'Glukoza we krwi i/lub HbA1c, w zależności od kontekstu',
      'Lipidogram (cholesterol i trójglicerydy)',
      'Ciśnienie krwi i ocena ryzyka sercowo-naczyniowego',
      'Śledzenie wagi i obwodu talii, bez oceniania',
    ],
    subH3: 'Sytuacje warte zgłoszenia',
    body6: 'Niektóre zmiany warto zgłosić podczas wizyty, zwłaszcza gdy są nowe, uporczywe lub nietypowe dla Ciebie.',
    medicalFollowUp: [
      {title: 'Bardzo nieregularne cykle', description: 'Zgłoś miesiączki, które pojawiają się bardzo rzadko lub nieprzewidywalnie.'},
      {title: 'Pragnienie lub częste oddawanie moczu', description: 'Porozmawiaj z lekarzem, jeśli te objawy pojawiają się w nietypowy sposób.'},
      {title: 'Znaczna zmiana wagi', description: 'Szybką lub niewyjaśnioną zmianę warto zbadać.'},
      {title: 'Historia rodzinna', description: 'Wspomnij o cukrzycy lub chorobach metabolicznych w rodzinie.'},
    ],
    alertTitle: 'Zwróć uwagę',
    alertText: 'Nietypowe pragnienie, częste oddawanie moczu, uporczywe zmęczenie lub znaczna, niewyjaśniona zmiana wagi powinny zostać zgłoszone specjaliście. Te objawy mogą mieć kilka przyczyn i same w sobie nie potwierdzają insulinooporności ani cukrzycy.',
    followUpTipTitle: 'Opieka trwa w czasie',
    followUpTipText: 'Lekarz może zaproponować regularne kontrole zamiast jednorazowych badań. Celem jest dostosowywanie porad i badań do Twoich postępów, bez skupiania się wyłącznie na wadze.',
    tip2Title: 'Warto wiedzieć',
    tip2Text: 'Waga to tylko jeden element obrazu metabolicznego w PCOS. Kompleksowe podejście uwzględnia cykle, objawy, nawyki stylu życia, historię medyczną i parametry metaboliczne.',
    shareMessage: 'Waga, metabolizm i insulinooporność — AWA',
  },
  uk: {
    badge: 'СПКЯ',
    title: 'Вага, метаболізм та\nінсулінорезистентність',
    metaDuration: '6 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Середній',
    metaValidated: 'Перевірений вміст',
    intro: 'Зв’язок між СПКЯ, вагою та інсулінорезистентністю — без осуду й спрощень.',
    contentsTitle: 'У цій статті',
    topics: [
      'Зв’язок між СПКЯ та метаболізмом',
      'Розуміння інсулінорезистентності',
      'Вага: що правда, а що ні',
      'Звички, що підтримують рівновагу',
      'Коли корисний медичний нагляд',
      'Головні висновки',
    ],
    body1: 'СПКЯ часто пов’язаний із метаболічними змінами, зокрема з інсулінорезистентністю. Проте цей зв’язок стосується не лише жінок із зайвою вагою — метаболічні профілі різняться в різних людей.',
    body2: 'Інсулін — гормон, що допомагає клітинам використовувати глюкозу з крові. За інсулінорезистентності клітини гірше реагують на цей гормон, а організм може компенсувати це, виробляючи більше інсуліну.',
    body3: 'При СПКЯ це може бути пов’язане зі збільшеним виробленням андрогенів і може сприяти певним симптомам. Але не в усіх жінок із СПКЯ однаковий метаболічний профіль.',
    tip1Title: 'Варто знати',
    tip1Text: 'Інсулінорезистентність можна перевірити аналізами крові, коли лікар вважає це доцільним. Чи потрібні аналізи, залежить від вашої індивідуальної ситуації.',
    weightFacts: [
      'СПКЯ торкається жінок усіх типів статури — від худорлявих до з більшою масою тіла.',
      'Набір ваги не є обов’язковим.',
      'Втрата ваги не завжди необхідна — і не завжди сама по собі достатня — для покращення симптомів.',
      'Невелика втрата ваги іноді може покращити деякі метаболічні показники чи регулярність циклу за наявності зайвої ваги.',
    ],
    body4: 'Мета — не гнатися за «ідеальною» вагою, а будувати реалістичні, тривалі звички. Збалансоване харчування, рух і регулярний сон можуть сприяти кращому метаболічному здоров’ю.',
    dailyHabits: [
      'Регулярні, різноманітні страви, багаті на клітковину',
      'Регулярна фізична активність, навіть помірна',
      'Достатньо регулярного сну',
      'Достатнє щоденне споживання води',
    ],
    body5: 'Медичний нагляд при СПКЯ не обмежується циклом чи гормональними симптомами. Залежно від вашого профілю лікар також може стежити за певними метаболічними показниками, щоб рано виявити потенційні чинники ризику.',
    medicalTitle: 'Нагляд, підібраний до вашого профілю',
    medicalSubtitle: 'Обстеження не однакове для всіх.',
    medicalDescription: 'Ваш лікар може вирішити перевірити певні показники залежно від ваших симптомів, медичної історії, сімейної ситуації та інших чинників ризику.',
    medicalSectionTitle: 'За чим можуть стежити',
    medicalChecks: [
      'Глюкоза крові та/або HbA1c, залежно від контексту',
      'Ліпідограма (холестерин і тригліцериди)',
      'Артеріальний тиск та оцінка серцево-судинного ризику',
      'Відстеження ваги й окружності талії, без осуду',
    ],
    subH3: 'Ситуації, про які варто повідомити',
    body6: 'Про певні зміни варто повідомити під час візиту, особливо коли вони нові, стійкі або нетипові для вас.',
    medicalFollowUp: [
      {title: 'Дуже нерегулярні цикли', description: 'Повідомте про менструації, що настають дуже рідко або непередбачувано.'},
      {title: 'Спрага чи часте сечовипускання', description: 'Поговоріть із лікарем, якщо ці ознаки з’являються незвично.'},
      {title: 'Значна зміна ваги', description: 'Швидку чи необґрунтовану зміну варто обстежити.'},
      {title: 'Сімейна історія', description: 'Згадайте про діабет чи метаболічні захворювання в родині.'},
    ],
    alertTitle: 'Зверніть увагу',
    alertText: 'Про незвичну спрагу, часте сечовипускання, стійку втому чи значну, необґрунтовану зміну ваги слід повідомити медичному фахівцю. Ці ознаки можуть мати кілька причин і самі по собі не підтверджують інсулінорезистентності чи діабету.',
    followUpTipTitle: 'Нагляд відбувається з часом',
    followUpTipText: 'Ваш лікар може запропонувати регулярні огляди замість одноразового обстеження. Мета — підлаштовувати поради й аналізи під ваш прогрес, не зосереджуючись лише на вазі.',
    tip2Title: 'Варто знати',
    tip2Text: 'Вага — лише одна зі складових метаболічної картини при СПКЯ. Комплексний підхід враховує цикли, симптоми, звички способу життя, медичну історію та метаболічні показники.',
    shareMessage: 'Вага, метаболізм та інсулінорезистентність — AWA',
  },
  cs: {
    badge: 'PCOS',
    title: 'Váha, metabolismus a\ninzulinová rezistence',
    metaDuration: '6 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Pokročilý',
    metaValidated: 'Ověřený obsah',
    intro: 'Souvislost mezi PCOS, váhou a inzulinovou rezistencí — bez odsuzování a zkratek.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Souvislost mezi PCOS a metabolismem',
      'Pochopení inzulinové rezistence',
      'Váha: co je pravda a co ne',
      'Návyky, které podporují rovnováhu',
      'Kdy je lékařské sledování užitečné',
      'Hlavní poznatky',
    ],
    body1: 'PCOS bývá často spojen s metabolickými změnami, včetně inzulinové rezistence. Tato souvislost se však netýká jen žen s nadváhou — metabolické profily se u jednotlivých žen liší.',
    body2: 'Inzulin je hormon, který pomáhá buňkám využívat glukózu v krvi. Při inzulinové rezistenci buňky na tento hormon reagují hůře a tělo to může kompenzovat tvorbou většího množství inzulinu.',
    body3: 'Při PCOS to může souviset se zvýšenou tvorbou androgenů a může to přispívat k některým příznakům. Ne všechny ženy s PCOS však mají stejný metabolický profil.',
    tip1Title: 'Stojí za to vědět',
    tip1Text: 'Inzulinovou rezistenci lze ověřit krevními testy, pokud to lékař považuje za relevantní. Zda jsou testy potřeba, závisí na vaší individuální situaci.',
    weightFacts: [
      'PCOS postihuje ženy všech postav, od štíhlých po plnějších.',
      'Přibírání na váze není pravidlem.',
      'Zhubnout není vždy nutné — ani samo o sobě dostačující — ke zlepšení příznaků.',
      'Malý úbytek váhy může někdy zlepšit některé metabolické ukazatele nebo pravidelnost cyklu, pokud je přítomna nadváha.',
    ],
    body4: 'Cílem není honit se za „dokonalou“ váhou, ale vybudovat realistické, trvalé návyky. K lepšímu metabolickému zdraví může přispět vyvážená strava, pohyb a pravidelný spánek.',
    dailyHabits: [
      'Pravidelná, pestrá jídla bohatá na vlákninu',
      'Pravidelná fyzická aktivita, i mírná',
      'Dostatek pravidelného spánku',
      'Dostatečný každodenní pitný režim',
    ],
    body5: 'Lékařské sledování PCOS se neomezuje na cyklus nebo hormonální příznaky. Podle vašeho profilu může zdravotnický pracovník sledovat i některé metabolické ukazatele, aby pomohl včas odhalit potenciální rizikové faktory.',
    medicalTitle: 'Sledování přizpůsobené vašemu profilu',
    medicalSubtitle: 'Vyšetření není pro všechny stejné.',
    medicalDescription: 'Váš lékař se může rozhodnout zkontrolovat určité ukazatele podle vašich příznaků, zdravotní anamnézy, rodinné situace a dalších rizikových faktorů.',
    medicalSectionTitle: 'Co se může sledovat',
    medicalChecks: [
      'Glykémie a/nebo HbA1c, podle kontextu',
      'Lipidový profil (cholesterol a triglyceridy)',
      'Krevní tlak a posouzení kardiovaskulárního rizika',
      'Sledování váhy a obvodu pasu, bez odsuzování',
    ],
    subH3: 'Situace, které stojí za zmínku',
    body6: 'Některé změny stojí za to zmínit při konzultaci, zejména pokud jsou nové, přetrvávající nebo pro vás neobvyklé.',
    medicalFollowUp: [
      {title: 'Velmi nepravidelné cykly', description: 'Zmiňte menstruace, které jsou velmi řídké nebo nepředvídatelné.'},
      {title: 'Žízeň nebo časté močení', description: 'Promluvte si s lékařem, pokud se tyto příznaky objeví neobvyklým způsobem.'},
      {title: 'Výrazná změna váhy', description: 'Rychlá nebo nevysvětlená změna stojí za to nechat posoudit.'},
      {title: 'Rodinná anamnéza', description: 'Zmiňte případnou rodinnou anamnézu cukrovky nebo metabolických onemocnění.'},
    ],
    alertTitle: 'Upozornění',
    alertText: 'Neobvyklou žízeň, časté močení, přetrvávající únavu nebo výraznou, nevysvětlenou změnu váhy je třeba sdělit zdravotnickému pracovníkovi. Tyto příznaky mohou mít několik příčin a samy o sobě inzulinovou rezistenci ani cukrovku nepotvrzují.',
    followUpTipTitle: 'Sledování probíhá v čase',
    followUpTipText: 'Váš lékař vám může navrhnout pravidelné kontroly místo jediného vyšetření. Cílem je přizpůsobit rady a testy tomu, jak se vyvíjíte, aniž by se zaměřoval pouze na váhu.',
    tip2Title: 'Stojí za to vědět',
    tip2Text: 'Váha je při PCOS jen jednou částí metabolického obrazu. Komplexní přístup zohledňuje cykly, příznaky, životní návyky, zdravotní anamnézu a metabolické ukazatele.',
    shareMessage: 'Váha, metabolismus a inzulinová rezistence — AWA',
  },
  sk: {
    badge: 'PCOS',
    title: 'Hmotnosť, metabolizmus a\ninzulínová rezistencia',
    metaDuration: '6 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Stredne pokročilý',
    metaValidated: 'Overený obsah',
    intro: 'Súvislosť medzi PCOS, hmotnosťou a inzulínovou rezistenciou — bez posudzovania a skratiek.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Súvislosť medzi PCOS a metabolizmom',
      'Pochopenie inzulínovej rezistencie',
      'Hmotnosť: čo je pravda a čo nie',
      'Návyky, ktoré podporujú rovnováhu',
      'Kedy je užitočné lekárske sledovanie',
      'Hlavné body',
    ],
    body1: 'PCOS sa často spája s metabolickými zmenami, vrátane inzulínovej rezistencie. Táto súvislosť sa však netýka len žien s nadváhou — metabolické profily sa líšia od ženy k žene.',
    body2: 'Inzulín je hormón, ktorý pomáha bunkám využívať glukózu v krvi. Pri inzulínovej rezistencii bunky na tento hormón reagujú horšie a telo to môže kompenzovať produkciou väčšieho množstva inzulínu.',
    body3: 'Pri PCOS to môže súvisieť so zvýšenou produkciou androgénov a môže to prispievať k niektorým príznakom. Nie všetky ženy s PCOS však majú rovnaký metabolický profil.',
    tip1Title: 'Stojí za to vedieť',
    tip1Text: 'Inzulínovú rezistenciu možno overiť krvnými testami, keď to lekár považuje za relevantné. Potreba testov závisí od vašej individuálnej situácie.',
    weightFacts: [
      'PCOS postihuje ženy všetkých postáv, od štíhlych po robustnejšie.',
      'Priberanie nie je systematické.',
      'Schudnutie nie je vždy potrebné — ani samo osebe dostatočné — na zlepšenie príznakov.',
      'Malý úbytok hmotnosti môže niekedy zlepšiť niektoré metabolické ukazovatele alebo pravidelnosť cyklu, keď je prítomná nadváha.',
    ],
    body4: 'Cieľom nie je hnať sa za „dokonalou“ hmotnosťou, ale budovať realistické, trvalé návyky. Vyvážená strava, pohyb a pravidelný spánok môžu všetky prispieť k lepšiemu metabolickému zdraviu.',
    dailyHabits: [
      'Pravidelné, pestré jedlá bohaté na vlákninu',
      'Pravidelná fyzická aktivita, aj keď mierna',
      'Dostatok pravidelného spánku',
      'Dostatočná každodenná hydratácia',
    ],
    body5: 'Lekárske sledovanie PCOS sa neobmedzuje na cyklus alebo hormonálne príznaky. Podľa vášho profilu môže zdravotnícky pracovník sledovať aj niektoré metabolické ukazovatele, aby pomohol včas odhaliť možné rizikové faktory.',
    medicalTitle: 'Sledovanie prispôsobené vášmu profilu',
    medicalSubtitle: 'Vyšetrenie nie je pre všetky ženy rovnaké.',
    medicalDescription: 'Váš lekár sa môže rozhodnúť skontrolovať niektoré ukazovatele na základe vašich príznakov, zdravotnej anamnézy, rodinnej situácie a iných rizikových faktorov.',
    medicalSectionTitle: 'Čo sa môže sledovať',
    medicalChecks: [
      'Glykémia a/alebo HbA1c, podľa kontextu',
      'Lipidový profil (cholesterol a triglyceridy)',
      'Krvný tlak a posúdenie kardiovaskulárneho rizika',
      'Sledovanie hmotnosti a obvodu pásu, bez posudzovania',
    ],
    subH3: 'Situácie, ktoré stojí za to spomenúť',
    body6: 'Niektoré zmeny stojí za to spomenúť pri konzultácii, najmä keď sú nové, pretrvávajúce alebo pre vás nezvyčajné.',
    medicalFollowUp: [
      {title: 'Veľmi nepravidelné cykly', description: 'Spomeňte menštruáciu, ktorá je veľmi vzdialená alebo nepredvídateľná.'},
      {title: 'Smäd alebo časté močenie', description: 'Porozprávajte sa s lekárom, ak sa tieto znaky objavia nezvyčajným spôsobom.'},
      {title: 'Výrazná zmena hmotnosti', description: 'Rýchla alebo nevysvetliteľná zmena stojí za vyšetrenie.'},
      {title: 'Rodinná anamnéza', description: 'Spomeňte akúkoľvek rodinnú anamnézu cukrovky alebo metabolických ochorení.'},
    ],
    alertTitle: 'Upozornenie',
    alertText: 'Nezvyčajný smäd, časté močenie, pretrvávajúcu únavu alebo výraznú, nevysvetliteľnú zmenu hmotnosti by ste mali oznámiť zdravotníckemu pracovníkovi. Tieto znaky môžu mať viacero príčin a samy osebe inzulínovú rezistenciu ani cukrovku nepotvrdzujú.',
    followUpTipTitle: 'Sledovanie prebieha v čase',
    followUpTipText: 'Váš lekár môže navrhnúť pravidelné kontroly namiesto jediného vyšetrenia. Cieľom je prispôsobiť rady a testy tomu, ako sa vyvíjate, bez zamerania výlučne na hmotnosť.',
    tip2Title: 'Stojí za to vedieť',
    tip2Text: 'Hmotnosť je pri PCOS len jednou časťou metabolického obrazu. Komplexný prístup zohľadňuje cykly, príznaky, návyky životného štýlu, zdravotnú anamnézu a metabolické ukazovatele.',
    shareMessage: 'Hmotnosť, metabolizmus a inzulínová rezistencia — AWA',
  },
  hu: {
    badge: 'PCOS',
    title: 'Testsúly, anyagcsere és\ninzulinrezisztencia',
    metaDuration: '6 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Középhaladó',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'A PCOS, a testsúly és az inzulinrezisztencia közötti kapcsolat — ítélkezés és rövidítések nélkül.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'A PCOS és az anyagcsere közötti kapcsolat',
      'Az inzulinrezisztencia megértése',
      'Testsúly: mi igaz és mi nem',
      'Az egyensúlyt támogató szokások',
      'Mikor hasznos az orvosi követés',
      'Legfontosabb tudnivalók',
    ],
    body1: 'A PCOS-t gyakran anyagcsere-változásokkal, köztük inzulinrezisztenciával társítják. Ez a kapcsolat azonban nem csak a túlsúlyos nőket érinti — az anyagcsere-profilok nőnként eltérnek.',
    body2: 'Az inzulin olyan hormon, amely segíti a sejteket a vérben lévő glükóz hasznosításában. Inzulinrezisztencia esetén a sejtek kevésbé jól reagálnak erre a hormonra, és a szervezet ezt több inzulin termelésével kompenzálhatja.',
    body3: 'PCOS esetén ez az androgéntermelés fokozódásával járhat együtt, és hozzájárulhat bizonyos tünetekhez. De nem minden PCOS-sel élő nőnek azonos az anyagcsere-profilja.',
    tip1Title: 'Érdemes tudni',
    tip1Text: 'Az inzulinrezisztencia vérvizsgálatokkal ellenőrizhető, ha az orvos ezt relevánsnak tartja. A vizsgálatok szükségessége az egyéni helyzetedtől függ.',
    weightFacts: [
      'A PCOS bármilyen testalkatú nőt érint, a soványtól a robusztusabbig.',
      'A súlygyarapodás nem rendszeres.',
      'A fogyás nem mindig szükséges — és önmagában nem is elegendő — a tünetek javításához.',
      'Kisebb súlycsökkenés néha javíthat egyes anyagcsere-mutatókat vagy a ciklus rendszerességét, ha túlsúly áll fenn.',
    ],
    body4: 'A cél nem a „tökéletes” testsúly hajszolása, hanem reális, tartós szokások kialakítása. A kiegyensúlyozott étrend, a mozgás és a rendszeres alvás mind hozzájárulhat a jobb anyagcsere-egészséghez.',
    dailyHabits: [
      'Rendszeres, változatos, rostban gazdag étkezések',
      'Rendszeres fizikai aktivitás, még ha mérsékelt is',
      'Elegendő, rendszeres alvás',
      'Elegendő napi hidratálás',
    ],
    body5: 'A PCOS orvosi követése nem korlátozódik a ciklusra vagy a hormonális tünetekre. A profilodtól függően az egészségügyi szakember egyes anyagcsere-mutatókat is figyelhet, hogy segítsen korán azonosítani a lehetséges kockázati tényezőket.',
    medicalTitle: 'A profilodhoz igazított követés',
    medicalSubtitle: 'A kivizsgálás nem mindenkinél azonos.',
    medicalDescription: 'Az orvosod dönthet úgy, hogy ellenőriz bizonyos mutatókat a tüneteid, az orvosi előzményeid, a családi helyzeted és más kockázati tényezők alapján.',
    medicalSectionTitle: 'Mit követhetnek',
    medicalChecks: [
      'Vércukor és/vagy HbA1c, a kontextustól függően',
      'Lipidprofil (koleszterin és trigliceridek)',
      'Vérnyomás és a szív- és érrendszeri kockázat értékelése',
      'A testsúly és a derékbőség követése, ítélkezés nélkül',
    ],
    subH3: 'Megemlítendő helyzetek',
    body6: 'Bizonyos változásokat érdemes megemlíteni egy konzultáció során, különösen ha újak, tartósak vagy számodra szokatlanok.',
    medicalFollowUp: [
      {title: 'Nagyon szabálytalan ciklusok', description: 'Említsd meg a nagyon távoli vagy kiszámíthatatlan menstruációkat.'},
      {title: 'Szomjúság vagy gyakori vizelés', description: 'Beszélj az orvosoddal, ha ezek a jelek szokatlan módon jelentkeznek.'},
      {title: 'Jelentős testsúlyváltozás', description: 'A gyors vagy megmagyarázhatatlan változás kivizsgálást érdemel.'},
      {title: 'Családi előzmények', description: 'Említsd meg a cukorbetegség vagy anyagcsere-betegségek családi előfordulását.'},
    ],
    alertTitle: 'Figyelem',
    alertText: 'A szokatlan szomjúságot, a gyakori vizelést, a tartós fáradtságot vagy a testsúly jelentős, megmagyarázhatatlan változását jelezd egészségügyi szakembernek. Ezeknek a jeleknek több oka is lehet, és önmagukban nem erősítik meg az inzulinrezisztenciát vagy a cukorbetegséget.',
    followUpTipTitle: 'A követés az idő során zajlik',
    followUpTipText: 'Az orvosod egyetlen kivizsgálás helyett rendszeres ellenőrzéseket javasolhat. A cél az, hogy a tanácsokat és a vizsgálatokat ahhoz igazítsa, ahogyan fejlődsz, anélkül, hogy kizárólag a testsúlyra összpontosítana.',
    tip2Title: 'Érdemes tudni',
    tip2Text: 'A testsúly PCOS esetén az anyagcsere-kép csak egy része. Az átfogó megközelítés figyelembe veszi a ciklusokat, a tüneteket, az életmódbeli szokásokat, az orvosi előzményeket és az anyagcsere-mutatókat.',
    shareMessage: 'Testsúly, anyagcsere és inzulinrezisztencia — AWA',
  },
  ro: {
    badge: 'SOP',
    title: 'Greutatea, metabolismul și\nrezistența la insulină',
    metaDuration: '6 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Intermediar',
    metaValidated: 'Conținut revizuit',
    intro: 'Legătura dintre SOP, greutate și rezistența la insulină — fără judecată și fără scurtături.',
    contentsTitle: 'În acest articol',
    topics: [
      'Legătura dintre SOP și metabolism',
      'Înțelegerea rezistenței la insulină',
      'Greutatea: ce este adevărat și ce nu',
      'Obiceiuri care susțin echilibrul',
      'Când urmărirea medicală este utilă',
      'Ce să reții',
    ],
    body1: 'SOP este adesea asociat cu modificări metabolice, inclusiv rezistența la insulină. Totuși, această asociere nu privește doar femeile supraponderale — profilurile metabolice variază de la o persoană la alta.',
    body2: 'Insulina este un hormon care ajută celulele să folosească glucoza din sânge. În cazul rezistenței la insulină, celulele răspund mai puțin bine la acest hormon, iar corpul poate compensa producând mai multă insulină.',
    body3: 'În SOP, aceasta poate fi asociată cu o producție crescută de androgeni și poate contribui la anumite simptome. Dar nu toate femeile cu SOP au același profil metabolic.',
    tip1Title: 'Bine de știut',
    tip1Text: 'Rezistența la insulină poate fi verificată prin analize de sânge atunci când medicul o consideră relevantă. Necesitatea analizelor depinde de situația ta individuală.',
    weightFacts: [
      'SOP afectează femei de toate constituțiile, de la cele slabe la cele mai corpolente.',
      'Creșterea în greutate nu este sistematică.',
      'Slăbitul nu este întotdeauna necesar — și nici suficient de unul singur — pentru a ameliora simptomele.',
      'O mică scădere în greutate poate îmbunătăți uneori anumiți markeri metabolici sau regularitatea ciclului atunci când există exces de greutate.',
    ],
    body4: 'Scopul nu este să urmărești o greutate „perfectă”, ci să construiești obiceiuri realiste și durabile. O alimentație echilibrată, mișcarea și un somn regulat pot contribui toate la o mai bună sănătate metabolică.',
    dailyHabits: [
      'Mese regulate și variate, bogate în fibre',
      'Activitate fizică regulată, chiar dacă este moderată',
      'Suficient somn regulat',
      'O hidratare zilnică suficientă',
    ],
    body5: 'Urmărirea medicală a SOP nu se limitează la ciclu sau la simptomele hormonale. În funcție de profilul tău, profesionistul din domeniul sănătății poate monitoriza și anumiți markeri metabolici pentru a ajuta la identificarea timpurie a unor eventuali factori de risc.',
    medicalTitle: 'O urmărire adaptată profilului tău',
    medicalSubtitle: 'Bilanțul nu este același pentru toată lumea.',
    medicalDescription: 'Medicul tău poate decide să verifice anumiți markeri în funcție de simptomele tale, istoricul medical, situația familială și alți factori de risc.',
    medicalSectionTitle: 'Ce poate fi monitorizat',
    medicalChecks: [
      'Glicemia și/sau HbA1c, în funcție de context',
      'Profilul lipidic (colesterol și trigliceride)',
      'Tensiunea arterială și evaluarea riscului cardiovascular',
      'Urmărirea greutății și a circumferinței taliei, fără judecată',
    ],
    subH3: 'Situații care merită menționate',
    body6: 'Anumite schimbări merită menționate în timpul unei consultații, mai ales când sunt noi, persistente sau neobișnuite pentru tine.',
    medicalFollowUp: [
      {title: 'Cicluri foarte neregulate', description: 'Menționează menstruațiile foarte distanțate sau imprevizibile.'},
      {title: 'Sete sau urinare frecventă', description: 'Vorbește cu medicul tău dacă aceste semne apar într-un mod neobișnuit.'},
      {title: 'Schimbare importantă a greutății', description: 'O schimbare rapidă sau inexplicabilă merită evaluată.'},
      {title: 'Antecedente familiale', description: 'Menționează orice antecedente familiale de diabet sau de afecțiuni metabolice.'},
    ],
    alertTitle: 'Atenție',
    alertText: 'Setea neobișnuită, urinarea frecventă, oboseala persistentă sau o schimbare importantă și inexplicabilă a greutății trebuie semnalate unui profesionist din domeniul sănătății. Aceste semne pot avea mai multe cauze și nu confirmă, singure, o rezistență la insulină sau un diabet.',
    followUpTipTitle: 'Urmărirea se face în timp',
    followUpTipText: 'Medicul tău poate propune controale regulate, nu un singur bilanț. Scopul este de a adapta sfaturile și analizele la evoluția ta, fără a te concentra doar pe greutate.',
    tip2Title: 'Bine de știut',
    tip2Text: 'Greutatea este doar o parte a tabloului metabolic în SOP. O abordare completă ia în considerare ciclurile, simptomele, obiceiurile de viață, istoricul medical și markerii metabolici.',
    shareMessage: 'Greutatea, metabolismul și rezistența la insulină — AWA',
  },
  bg: {
    badge: 'СПКЯ',
    title: 'Тегло, метаболизъм и\nинсулинова резистентност',
    metaDuration: '6 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Средно ниво',
    metaValidated: 'Проверено съдържание',
    intro: 'Връзката между СПКЯ, теглото и инсулиновата резистентност — без осъждане и без преки пътища.',
    contentsTitle: 'В тази статия',
    topics: [
      'Връзката между СПКЯ и метаболизма',
      'Разбиране на инсулиновата резистентност',
      'Тегло: кое е вярно и кое не',
      'Навици, които подкрепят баланса',
      'Кога медицинското проследяване е полезно',
      'Какво да запомниш',
    ],
    body1: 'СПКЯ често се свързва с метаболитни промени, включително инсулинова резистентност. Тази връзка обаче не засяга само жените с наднормено тегло — метаболитните профили варират от човек на човек.',
    body2: 'Инсулинът е хормон, който помага на клетките да използват глюкозата в кръвта. При инсулинова резистентност клетките реагират по-слабо на този хормон и тялото може да компенсира, като произвежда повече инсулин.',
    body3: 'При СПКЯ това може да се свърже с повишено производство на андрогени и да допринася за някои симптоми. Но не всички жени със СПКЯ имат един и същи метаболитен профил.',
    tip1Title: 'Добре е да знаеш',
    tip1Text: 'Инсулиновата резистентност може да се провери чрез кръвни изследвания, когато лекарят го прецени за уместно. Дали са нужни изследвания, зависи от личната ти ситуация.',
    weightFacts: [
      'СПКЯ засяга жени с всякакво телосложение, от слабо до по-едро.',
      'Напълняването не е системно.',
      'Отслабването не винаги е необходимо — нито достатъчно само по себе си — за подобряване на симптомите.',
      'Малко отслабване понякога може да подобри някои метаболитни показатели или редовността на цикъла, когато има наднормено тегло.',
    ],
    body4: 'Целта не е да гониш „съвършено“ тегло, а да изградиш реалистични, трайни навици. Балансираното хранене, движението и редовният сън могат да допринесат за по-добро метаболитно здраве.',
    dailyHabits: [
      'Редовни, разнообразни ястия, богати на фибри',
      'Редовна физическа активност, дори умерена',
      'Достатъчно редовен сън',
      'Достатъчно ежедневно хидратиране',
    ],
    body5: 'Медицинското проследяване при СПКЯ не се ограничава до цикъла или хормоналните симптоми. Според профила ти здравният специалист може да следи и някои метаболитни показатели, за да помогне за ранното откриване на потенциални рискови фактори.',
    medicalTitle: 'Проследяване, съобразено с профила ти',
    medicalSubtitle: 'Оценката не е еднаква за всички.',
    medicalDescription: 'Лекарят ти може да реши да провери някои показатели според симптомите ти, медицинската ти история, семейната ти ситуация и други рискови фактори.',
    medicalSectionTitle: 'Какво може да се следи',
    medicalChecks: [
      'Кръвна захар и/или HbA1c, според контекста',
      'Липиден профил (холестерол и триглицериди)',
      'Кръвно налягане и оценка на сърдечно-съдовия риск',
      'Проследяване на теглото и обиколката на талията, без осъждане',
    ],
    subH3: 'Ситуации, които си струва да споменеш',
    body6: 'Някои промени си струва да бъдат споменати по време на консултация, особено когато са нови, упорити или необичайни за теб.',
    medicalFollowUp: [
      {title: 'Много нередовни цикли', description: 'Спомени менструации, които са много разтеглени или непредсказуеми.'},
      {title: 'Жажда или често уриниране', description: 'Поговори с лекаря си, ако тези признаци се появят необичайно.'},
      {title: 'Значителна промяна в теглото', description: 'Бърза или необяснима промяна заслужава оценка.'},
      {title: 'Семейна история', description: 'Спомени всяка семейна история на диабет или метаболитни състояния.'},
    ],
    alertTitle: 'Обърни внимание',
    alertText: 'Необичайна жажда, често уриниране, упорита умора или значителна необяснима промяна в теглото трябва да се съобщят на здравен специалист. Тези признаци могат да имат няколко причини и сами по себе си не потвърждават инсулинова резистентност или диабет.',
    followUpTipTitle: 'Проследяването става във времето',
    followUpTipText: 'Лекарят ти може да предложи редовни прегледи вместо една-единствена оценка. Целта е съветите и изследванията да се нагаждат към напредъка ти, без да се фокусираш само върху теглото.',
    tip2Title: 'Добре е да знаеш',
    tip2Text: 'Теглото е само една част от метаболитната картина при СПКЯ. Цялостният подход взема предвид циклите, симптомите, навиците на живот, медицинската история и метаболитните показатели.',
    shareMessage: 'Тегло, метаболизъм и инсулинова резистентност — AWA',
  },
  sr: {
    badge: 'ПЦОС',
    title: 'Тежина, метаболизам и\nинсулинска резистенција',
    metaDuration: '6 мин читања',
    metaType: 'Водич',
    metaLevel: 'Средњи ниво',
    metaValidated: 'Проверен садржај',
    intro: 'Веза између ПЦОС-а, тежине и инсулинске резистенције — без осуде и без пречица.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Веза између ПЦОС-а и метаболизма',
      'Разумевање инсулинске резистенције',
      'Тежина: шта је тачно, а шта није',
      'Навике које подржавају равнотежу',
      'Када је медицинско праћење корисно',
      'Шта да запамтиш',
    ],
    body1: 'ПЦОС се често повезује са метаболичким променама, укључујући инсулинску резистенцију. Међутим, ова веза не односи се само на жене са вишком килограма — метаболички профили варирају од особе до особе.',
    body2: 'Инсулин је хормон који помаже ћелијама да користе глукозу из крви. Код инсулинске резистенције ћелије слабије реагују на овај хормон и тело може компензовати стварајући више инсулина.',
    body3: 'Код ПЦОС-а ово може бити повезано са повећаном производњом андрогена и може допринети одређеним симптомима. Али не показују све жене са ПЦОС-ом исти метаболички профил.',
    tip1Title: 'Добро је знати',
    tip1Text: 'Инсулинска резистенција може се проверити анализама крви када лекар то сматра релевантним. Да ли су анализе потребне зависи од твоје индивидуалне ситуације.',
    weightFacts: [
      'ПЦОС погађа жене сваког телосложења, од витких до крупнијих.',
      'Дебљање није системско.',
      'Губитак тежине није увек потребан — нити довољан сам по себи — за побољшање симптома.',
      'Мали губитак тежине понекад може побољшати одређене метаболичке показатеље или редовност циклуса када постоји вишак тежине.',
    ],
    body4: 'Циљ није јурити „савршену“ тежину, већ изградити реалне, трајне навике. Уравнотежена исхрана, кретање и редован сан могу допринети бољем метаболичком здрављу.',
    dailyHabits: [
      'Редовни, разноврсни оброци богати влакнима',
      'Редовна физичка активност, чак и умерена',
      'Довољно редован сан',
      'Довољна свакодневна хидратација',
    ],
    body5: 'Медицинско праћење ПЦОС-а не ограничава се на циклус или хормонске симптоме. Зависно од твог профила, твој здравствени радник може пратити и одређене метаболичке показатеље како би помогао у раном откривању потенцијалних фактора ризика.',
    medicalTitle: 'Праћење прилагођено твом профилу',
    medicalSubtitle: 'Процена није иста за све.',
    medicalDescription: 'Твој лекар може одлучити да провери одређене показатеље на основу твојих симптома, медицинске историје, породичне ситуације и других фактора ризика.',
    medicalSectionTitle: 'Шта се може пратити',
    medicalChecks: [
      'Шећер у крви и/или HbA1c, зависно од контекста',
      'Липидни профил (холестерол и триглицериди)',
      'Крвни притисак и процена кардиоваскуларног ризика',
      'Праћење тежине и обима струка, без осуде',
    ],
    subH3: 'Ситуације које вреди споменути',
    body6: 'Одређене промене вреди споменути током консултације, нарочито када су нове, упорне или необичне за тебе.',
    medicalFollowUp: [
      {title: 'Веома нередовни циклуси', description: 'Спомени менструације које су веома размакнуте или непредвидиве.'},
      {title: 'Жеђ или често уринирање', description: 'Разговарај са лекаром ако се ови знаци појаве на необичан начин.'},
      {title: 'Значајна промена тежине', description: 'Брза или необјашњива промена вреди да се процени.'},
      {title: 'Породична историја', description: 'Спомени сваку породичну историју дијабетеса или метаболичких стања.'},
    ],
    alertTitle: 'Обрати пажњу',
    alertText: 'Необична жеђ, често уринирање, упоран умор или значајна необјашњива промена тежине треба да се пријаве здравственом раднику. Ови знаци могу имати неколико узрока и сами по себи не потврђују инсулинску резистенцију нити дијабетес.',
    followUpTipTitle: 'Праћење се одвија током времена',
    followUpTipText: 'Твој лекар може предложити редовне прегледе уместо једне процене. Циљ је да се савети и анализе прилагоде твом напретку, без фокусирања само на тежину.',
    tip2Title: 'Добро је знати',
    tip2Text: 'Тежина је само један део метаболичке слике код ПЦОС-а. Свеобухватан приступ узима у обзир циклусе, симптоме, навике начина живота, медицинску историју и метаболичке показатеље.',
    shareMessage: 'Тежина, метаболизам и инсулинска резистенција — AWA',
  },
  hr: {
    badge: 'PCOS',
    title: 'Težina, metabolizam i\ninzulinska rezistencija',
    metaDuration: '6 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Srednja razina',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Veza između PCOS-a, težine i inzulinske rezistencije — bez osuđivanja i prečaca.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Veza između PCOS-a i metabolizma',
      'Razumijevanje inzulinske rezistencije',
      'Težina: što je istina, a što nije',
      'Navike koje podržavaju ravnotežu',
      'Kada je liječničko praćenje korisno',
      'Ključne poruke',
    ],
    body1: 'PCOS se često povezuje s metaboličkim promjenama, uključujući inzulinsku rezistenciju. Međutim, ta se povezanost ne odnosi samo na žene s prekomjernom težinom — metabolički profili razlikuju se od osobe do osobe.',
    body2: 'Inzulin je hormon koji pomaže stanicama da koriste glukozu iz krvi. Kod inzulinske rezistencije stanice slabije reagiraju na taj hormon, a tijelo može nadoknaditi stvaranjem više inzulina.',
    body3: 'Kod PCOS-a to može biti povezano s pojačanim stvaranjem androgena i može pridonijeti određenim simptomima. No sve žene s PCOS-om nemaju isti metabolički profil.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Inzulinska rezistencija može se provjeriti krvnim pretragama kad liječnik smatra da je to relevantno. Jesu li pretrage potrebne ovisi o tvojoj individualnoj situaciji.',
    weightFacts: [
      'PCOS pogađa žene svih tjelesnih građa, od vitkih do čvršćih.',
      'Dobivanje na težini nije sustavno.',
      'Gubitak težine nije uvijek nužan — niti sam po sebi dovoljan — za poboljšanje simptoma.',
      'Mali gubitak težine ponekad može poboljšati određene metaboličke pokazatelje ili pravilnost ciklusa kad postoji prekomjerna težina.',
    ],
    body4: 'Cilj nije juriti „savršenu“ težinu, nego graditi realistične, trajne navike. Uravnotežena prehrana, kretanje i redovit san mogu pridonijeti boljem metaboličkom zdravlju.',
    dailyHabits: [
      'Redoviti, raznoliki obroci bogati vlaknima',
      'Redovita tjelesna aktivnost, čak i ako je umjerena',
      'Dovoljno redovit san',
      'Dovoljna svakodnevna hidratacija',
    ],
    body5: 'Liječničko praćenje kod PCOS-a nije ograničeno na ciklus ili hormonske simptome. Ovisno o tvom profilu, zdravstveni djelatnik može pratiti i određene metaboličke pokazatelje kako bi rano prepoznao potencijalne čimbenike rizika.',
    medicalTitle: 'Praćenje prilagođeno tvom profilu',
    medicalSubtitle: 'Obrada nije ista za sve.',
    medicalDescription: 'Tvoj liječnik može odlučiti provjeriti određene pokazatelje na temelju tvojih simptoma, medicinske anamneze, obiteljske situacije i drugih čimbenika rizika.',
    medicalSectionTitle: 'Što se može pratiti',
    medicalChecks: [
      'Glukoza u krvi i/ili HbA1c, ovisno o kontekstu',
      'Lipidogram (kolesterol i trigliceridi)',
      'Krvni tlak i procjena kardiovaskularnog rizika',
      'Praćenje težine i opsega struka, bez osuđivanja',
    ],
    subH3: 'Situacije koje vrijedi spomenuti',
    body6: 'Određene promjene vrijedi spomenuti tijekom savjetovanja, osobito kad su nove, dugotrajne ili za tebe neobične.',
    medicalFollowUp: [
      {title: 'Vrlo nepravilni ciklusi', description: 'Spomeni menstruacije koje su jako razmaknute ili nepredvidljive.'},
      {title: 'Žeđ ili često mokrenje', description: 'Razgovaraj s liječnikom ako se ti znakovi pojave na neuobičajen način.'},
      {title: 'Znatna promjena težine', description: 'Brzu ili neobjašnjivu promjenu vrijedi dati procijeniti.'},
      {title: 'Obiteljska anamneza', description: 'Spomeni svaku obiteljsku povijest dijabetesa ili metaboličkih stanja.'},
    ],
    alertTitle: 'Napomena',
    alertText: 'Neuobičajenu žeđ, često mokrenje, dugotrajan umor ili znatnu, neobjašnjivu promjenu težine treba prijaviti zdravstvenom djelatniku. Ti znakovi mogu imati nekoliko uzroka i sami po sebi ne potvrđuju inzulinsku rezistenciju ni dijabetes.',
    followUpTipTitle: 'Praćenje se odvija tijekom vremena',
    followUpTipText: 'Tvoj liječnik može predložiti redovite kontrole umjesto jedne obrade. Cilj je prilagoditi savjete i pretrage tvom napretku, bez usredotočenosti samo na težinu.',
    tip2Title: 'Dobro je znati',
    tip2Text: 'Težina je samo jedan dio metaboličke slike kod PCOS-a. Sveobuhvatan pristup uzima u obzir cikluse, simptome, životne navike, medicinsku anamnezu i metaboličke pokazatelje.',
    shareMessage: 'Težina, metabolizam i inzulinska rezistencija — AWA',
  },
  bs: {
    badge: 'PCOS',
    title: 'Težina, metabolizam i\ninzulinska rezistencija',
    metaDuration: '6 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Srednja razina',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Veza između PCOS-a, težine i inzulinske rezistencije — bez osuđivanja i prečaca.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Veza između PCOS-a i metabolizma',
      'Razumijevanje inzulinske rezistencije',
      'Težina: što je istina, a što nije',
      'Navike koje podržavaju ravnotežu',
      'Kada je ljekarsko praćenje korisno',
      'Ključne poruke',
    ],
    body1: 'PCOS se često povezuje s metaboličkim promjenama, uključujući inzulinsku rezistenciju. Međutim, ta se povezanost ne odnosi samo na žene s prekomjernom težinom — metabolički profili razlikuju se od osobe do osobe.',
    body2: 'Inzulin je hormon koji pomaže stanicama da koriste glukozu iz krvi. Kod inzulinske rezistencije stanice slabije reagiraju na taj hormon, a tijelo može nadoknaditi stvaranjem više inzulina.',
    body3: 'Kod PCOS-a to može biti povezano s pojačanim stvaranjem androgena i može pridonijeti određenim simptomima. No sve žene s PCOS-om nemaju isti metabolički profil.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Inzulinska rezistencija može se provjeriti krvnim pretragama kad ljekar smatra da je to relevantno. Jesu li pretrage potrebne ovisi o tvojoj individualnoj situaciji.',
    weightFacts: [
      'PCOS pogađa žene svih tjelesnih građa, od vitkih do čvršćih.',
      'Dobivanje na težini nije sistemno.',
      'Gubitak težine nije uvijek nužan — niti sam po sebi dovoljan — za poboljšanje simptoma.',
      'Mali gubitak težine ponekad može poboljšati određene metaboličke pokazatelje ili pravilnost ciklusa kad postoji prekomjerna težina.',
    ],
    body4: 'Cilj nije juriti „savršenu“ težinu, nego graditi realistične, trajne navike. Uravnotežena ishrana, kretanje i redovit san mogu pridonijeti boljem metaboličkom zdravlju.',
    dailyHabits: [
      'Redoviti, raznoliki obroci bogati vlaknima',
      'Redovita tjelesna aktivnost, čak i ako je umjerena',
      'Dovoljno redovit san',
      'Dovoljna svakodnevna hidratacija',
    ],
    body5: 'Ljekarsko praćenje kod PCOS-a nije ograničeno na ciklus ili hormonske simptome. Ovisno o tvom profilu, zdravstveni radnik može pratiti i određene metaboličke pokazatelje kako bi rano prepoznao potencijalne čimbenike rizika.',
    medicalTitle: 'Praćenje prilagođeno tvom profilu',
    medicalSubtitle: 'Obrada nije ista za sve.',
    medicalDescription: 'Tvoj ljekar može odlučiti provjeriti određene pokazatelje na temelju tvojih simptoma, medicinske anamneze, obiteljske situacije i drugih čimbenika rizika.',
    medicalSectionTitle: 'Što se može pratiti',
    medicalChecks: [
      'Glukoza u krvi i/ili HbA1c, ovisno o kontekstu',
      'Lipidogram (kolesterol i trigliceridi)',
      'Krvni tlak i procjena kardiovaskularnog rizika',
      'Praćenje težine i opsega struka, bez osuđivanja',
    ],
    subH3: 'Situacije koje vrijedi spomenuti',
    body6: 'Određene promjene vrijedi spomenuti tokom savjetovanja, osobito kad su nove, dugotrajne ili za tebe neobične.',
    medicalFollowUp: [
      {title: 'Vrlo nepravilni ciklusi', description: 'Spomeni menstruacije koje su jako razmaknute ili nepredvidljive.'},
      {title: 'Žeđ ili često mokrenje', description: 'Razgovaraj s ljekarom ako se ti znakovi pojave na neuobičajen način.'},
      {title: 'Znatna promjena težine', description: 'Brzu ili neobjašnjivu promjenu vrijedi dati procijeniti.'},
      {title: 'Obiteljska anamneza', description: 'Spomeni svaku obiteljsku povijest dijabetesa ili metaboličkih stanja.'},
    ],
    alertTitle: 'Napomena',
    alertText: 'Neuobičajenu žeđ, često mokrenje, dugotrajan umor ili znatnu, neobjašnjivu promjenu težine treba prijaviti zdravstvenom radniku. Ti znakovi mogu imati nekoliko uzroka i sami po sebi ne potvrđuju inzulinsku rezistenciju ni dijabetes.',
    followUpTipTitle: 'Praćenje se odvija tokom vremena',
    followUpTipText: 'Tvoj ljekar može predložiti redovite kontrole umjesto jedne obrade. Cilj je prilagoditi savjete i pretrage tvom napretku, bez usredotočenosti samo na težinu.',
    tip2Title: 'Dobro je znati',
    tip2Text: 'Težina je samo jedan dio metaboličke slike kod PCOS-a. Sveobuhvatan pristup uzima u obzir cikluse, simptome, životne navike, medicinsku anamnezu i metaboličke pokazatelje.',
    shareMessage: 'Težina, metabolizam i inzulinska rezistencija — AWA',
  },
  sl: {
    badge: 'PCOS',
    title: 'Teža, presnova in\ninzulinska rezistenca',
    metaDuration: '6 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Srednja raven',
    metaValidated: 'Preverjena vsebina',
    intro: 'Povezava med PCOS, težo in inzulinsko rezistenco — brez obsojanja in bližnjic.',
    contentsTitle: 'V tem članku',
    topics: [
      'Povezava med PCOS in presnovo',
      'Razumevanje inzulinske rezistence',
      'Teža: kaj je res in kaj ni',
      'Navade, ki podpirajo ravnovesje',
      'Kdaj je zdravniško spremljanje koristno',
      'Ključna sporočila',
    ],
    body1: 'PCOS se pogosto povezuje s presnovnimi spremembami, vključno z inzulinsko rezistenco. Vendar se ta povezava ne nanaša samo na ženske s prekomerno težo — presnovni profili se razlikujejo od osebe do osebe.',
    body2: 'Inzulin je hormon, ki celicam pomaga uporabljati glukozo iz krvi. Pri inzulinski rezistenci se celice slabše odzivajo na ta hormon, telo pa lahko to nadomesti s proizvodnjo več inzulina.',
    body3: 'Pri PCOS je lahko to povezano s povečano proizvodnjo androgenov in lahko prispeva k določenim simptomom. A vse ženske s PCOS nimajo enakega presnovnega profila.',
    tip1Title: 'Vredno vedeti',
    tip1Text: 'Inzulinska rezistenca se lahko preveri s krvnimi preiskavami, kadar zdravnik meni, da je to relevantno. Ali so preiskave potrebne, je odvisno od tvoje individualne situacije.',
    weightFacts: [
      'PCOS prizadene ženske vseh telesnih postav, od vitkih do čvrstejših.',
      'Pridobivanje teže ni sistematično.',
      'Hujšanje ni vedno potrebno — niti samo po sebi dovolj — za izboljšanje simptomov.',
      'Majhna izguba teže lahko včasih izboljša določene presnovne kazalnike ali pravilnost cikla, kadar obstaja prekomerna teža.',
    ],
    body4: 'Cilj ni goniti „popolno“ težo, ampak graditi realistične, trajne navade. Uravnotežena prehrana, gibanje in reden spanec lahko prispevajo k boljšemu presnovnemu zdravju.',
    dailyHabits: [
      'Redni, raznoliki obroki, bogati z vlakninami',
      'Redna telesna dejavnost, tudi če je zmerna',
      'Dovolj reden spanec',
      'Dovolj dnevne hidracije',
    ],
    body5: 'Zdravniško spremljanje pri PCOS ni omejeno na cikel ali hormonske simptome. Glede na tvoj profil lahko zdravstveni delavec spremlja tudi določene presnovne kazalnike, da zgodaj prepozna morebitne dejavnike tveganja.',
    medicalTitle: 'Spremljanje, prilagojeno tvojemu profilu',
    medicalSubtitle: 'Obravnava ni enaka za vse.',
    medicalDescription: 'Tvoj zdravnik se lahko odloči preveriti določene kazalnike na podlagi tvojih simptomov, zdravstvene anamneze, družinske situacije in drugih dejavnikov tveganja.',
    medicalSectionTitle: 'Kaj se lahko spremlja',
    medicalChecks: [
      'Glukoza v krvi in/ali HbA1c, glede na kontekst',
      'Lipidogram (holesterol in trigliceridi)',
      'Krvni tlak in ocena srčno-žilnega tveganja',
      'Spremljanje teže in obsega pasu, brez obsojanja',
    ],
    subH3: 'Situacije, ki jih je vredno omeniti',
    body6: 'Določene spremembe je vredno omeniti med posvetom, zlasti kadar so nove, dolgotrajne ali zate nenavadne.',
    medicalFollowUp: [
      {title: 'Zelo neredni cikli', description: 'Omeni menstruacije, ki so zelo razmaknjene ali nepredvidljive.'},
      {title: 'Žeja ali pogosto uriniranje', description: 'Pogovori se z zdravnikom, če se ti znaki pojavijo na nenavaden način.'},
      {title: 'Pomembna sprememba teže', description: 'Hitro ali nepojasnjeno spremembo je vredno dati oceniti.'},
      {title: 'Družinska anamneza', description: 'Omeni vsako družinsko zgodovino sladkorne bolezni ali presnovnih stanj.'},
    ],
    alertTitle: 'Opomba',
    alertText: 'Nenavadno žejo, pogosto uriniranje, dolgotrajno utrujenost ali pomembno, nepojasnjeno spremembo teže je treba prijaviti zdravstvenemu delavcu. Ti znaki imajo lahko več vzrokov in sami po sebi ne potrjujejo inzulinske rezistence ali sladkorne bolezni.',
    followUpTipTitle: 'Spremljanje poteka skozi čas',
    followUpTipText: 'Tvoj zdravnik lahko predlaga redne kontrole namesto ene obravnave. Cilj je prilagoditi nasvete in preiskave tvojemu napredku, brez osredotočenosti samo na težo.',
    tip2Title: 'Vredno vedeti',
    tip2Text: 'Teža je le del presnovne slike pri PCOS. Celovit pristop upošteva cikle, simptome, življenjske navade, zdravstveno anamnezo in presnovne kazalnike.',
    shareMessage: 'Teža, presnova in inzulinska rezistenca — AWA',
  },
  ne: {
    badge: 'PCOS',
    title: 'तौल, मेटाबोलिजम र\nइन्सुलिन प्रतिरोध',
    metaDuration: '6 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'मध्यम',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'PCOS, तौल र इन्सुलिन प्रतिरोधबीचको सम्बन्ध — कुनै निर्णय वा सर्टकट बिना।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'PCOS र मेटाबोलिजमबीचको सम्बन्ध',
      'इन्सुलिन प्रतिरोध बुझ्ने',
      'तौल: के सत्य हो र के होइन',
      'सन्तुलनलाई साथ दिने बानीहरू',
      'चिकित्सकीय फलोअप कहिले उपयोगी हुन्छ',
      'मुख्य कुराहरू',
    ],
    body1: 'PCOS प्रायः मेटाबोलिक परिवर्तनहरूसँग जोडिएको हुन्छ, जसमा इन्सुलिन प्रतिरोध पर्छ। तथापि, यो सम्बन्ध बढी तौल भएका महिलामा मात्र सीमित हुँदैन — मेटाबोलिक प्रोफाइल व्यक्तिपिच्छे फरक हुन्छ।',
    body2: 'इन्सुलिन एउटा हर्मोन हो जसले कोषहरूलाई रगतमा भएको ग्लुकोज प्रयोग गर्न मद्दत गर्छ। इन्सुलिन प्रतिरोधमा, कोषहरूले यो हर्मोनलाई कम राम्रोसँग प्रतिक्रिया दिन्छन्, र शरीरले बढी इन्सुलिन उत्पादन गरेर क्षतिपूर्ति गर्न सक्छ।',
    body3: 'PCOS मा, यो एन्ड्रोजनको बढेको उत्पादनसँग जोडिन सक्छ र केही लक्षणहरूमा योगदान पुर्‍याउन सक्छ। तर PCOS भएका सबै महिलाको उस्तै मेटाबोलिक प्रोफाइल हुँदैन।',
    tip1Title: 'जान्न लायक',
    tip1Text: 'चिकित्सकले सान्दर्भिक ठान्दा इन्सुलिन प्रतिरोध रगत परीक्षणबाट जाँच्न सकिन्छ। परीक्षण चाहिन्छ कि चाहिँदैन भन्ने तपाईंको व्यक्तिगत अवस्थामा निर्भर गर्छ।',
    weightFacts: [
      'PCOS ले दुब्लोदेखि भारी बनावटसम्म सबै शारीरिक बनावटका महिलालाई असर गर्छ।',
      'तौल बढ्नु व्यवस्थित होइन।',
      'तौल घटाउनु सधैँ आवश्यक होइन — वा लक्षणहरू सुधार्न आफैँ पर्याप्त पनि होइन।',
      'बढी तौल हुँदा सानो तौल घटाउनुले कहिलेकाहीँ केही मेटाबोलिक सूचक वा चक्रको नियमितता सुधार्न सक्छ।',
    ],
    body4: 'लक्ष्य “पूर्ण” तौलको पछि लाग्नु होइन, यथार्थपरक, टिकाउ बानीहरू निर्माण गर्नु हो। सन्तुलित खानपान, चाल र नियमित निद्राले राम्रो मेटाबोलिक स्वास्थ्यमा योगदान पुर्‍याउन सक्छन्।',
    dailyHabits: [
      'रेशा भरपूर नियमित, विविधतापूर्ण खाना',
      'मध्यम भए पनि नियमित शारीरिक गतिविधि',
      'पर्याप्त नियमित निद्रा',
      'दैनिक पर्याप्त पानीको सेवन',
    ],
    body5: 'PCOS का लागि चिकित्सकीय फलोअप चक्र वा हर्मोनल लक्षणहरूमा मात्र सीमित हुँदैन। तपाईंको प्रोफाइलअनुसार, तपाईंका स्वास्थ्य सेवा प्रदायकले सम्भावित जोखिम कारकहरू चाँडै पहिचान गर्न मद्दत गर्न केही मेटाबोलिक सूचकहरू पनि निगरानी गर्न सक्छन्।',
    medicalTitle: 'तपाईंको प्रोफाइलअनुसार मिलाइएको फलोअप',
    medicalSubtitle: 'जाँच सबैका लागि उस्तै हुँदैन।',
    medicalDescription: 'तपाईंको चिकित्सकले तपाईंका लक्षण, चिकित्सकीय इतिहास, पारिवारिक अवस्था र अन्य जोखिम कारकहरूका आधारमा केही सूचकहरू जाँच्ने निर्णय गर्न सक्छन्।',
    medicalSectionTitle: 'के निगरानी गर्न सकिन्छ',
    medicalChecks: [
      'रगतमा चिनी र/वा HbA1c, सन्दर्भअनुसार',
      'बोसोको प्यानल (कोलेस्टेरोल र ट्राइग्लिसराइड)',
      'रक्तचाप र हृदय-रक्तनली जोखिमको मूल्याङ्कन',
      'कुनै निर्णयबिना तौल र कम्मरको घेराको अनुगमन',
    ],
    subH3: 'उल्लेख गर्न लायक अवस्थाहरू',
    body6: 'केही परिवर्तनहरू परामर्शको क्रममा उल्लेख गर्न लायक हुन्छन्, विशेष गरी जब ती नयाँ, लगातार वा तपाईंका लागि असामान्य हुन्छन्।',
    medicalFollowUp: [
      {title: 'निकै अनियमित चक्रहरू', description: 'निकै टाढा-टाढा वा अप्रत्याशित महिनावारी उल्लेख गर्नुहोस्।'},
      {title: 'तिर्खा वा बारम्बार पिसाब', description: 'यी संकेतहरू असामान्य रूपमा देखिएमा आफ्नो चिकित्सकसँग कुरा गर्नुहोस्।'},
      {title: 'तौलमा ठूलो परिवर्तन', description: 'छिटो वा अव्याख्यात परिवर्तनको मूल्याङ्कन गराउन लायक हुन्छ।'},
      {title: 'पारिवारिक इतिहास', description: 'मधुमेह वा मेटाबोलिक अवस्थाहरूको कुनै पारिवारिक इतिहास उल्लेख गर्नुहोस्।'},
    ],
    alertTitle: 'कृपया ध्यान दिनुहोस्',
    alertText: 'असामान्य तिर्खा, बारम्बार पिसाब, लगातार थकान, वा तौलमा ठूलो, अव्याख्यात परिवर्तन स्वास्थ्यकर्मीलाई जानकारी गराउनुपर्छ। यी संकेतहरूका धेरै कारण हुन सक्छन् र आफैँले इन्सुलिन प्रतिरोध वा मधुमेहको पुष्टि गर्दैनन्।',
    followUpTipTitle: 'फलोअप समयसँगै हुन्छ',
    followUpTipText: 'तपाईंको चिकित्सकले एउटा मात्र जाँचको सट्टा नियमित जाँचहरू सुझाउन सक्छन्। लक्ष्य केवल तौलमा ध्यान केन्द्रित नगरी, तपाईंको प्रगतिअनुसार सल्लाह र परीक्षणहरू मिलाउनु हो।',
    tip2Title: 'जान्न लायक',
    tip2Text: 'PCOS मा तौल मेटाबोलिक चित्रको एक भाग मात्र हो। व्यापक दृष्टिकोणले चक्र, लक्षण, जीवनशैलीका बानी, चिकित्सकीय इतिहास र मेटाबोलिक सूचकहरूलाई ध्यानमा राख्छ।',
    shareMessage: 'तौल, मेटाबोलिजम र इन्सुलिन प्रतिरोध — AWA',
  },
  si: {
    badge: 'PCOS',
    title: 'බර, පරිවෘත්තිය සහ\nඉන්සියුලින් ප්‍රතිරෝධය',
    metaDuration: 'කියවීමට මිනිත්තු 6',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'මධ්‍යම',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'විනිශ්චයකින් හෝ කෙටි මාර්ගවලින් තොරව, PCOS, බර සහ ඉන්සියුලින් ප්‍රතිරෝධය අතර සම්බන්ධය.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'PCOS සහ පරිවෘත්තිය අතර සම්බන්ධය',
      'ඉන්සියුලින් ප්‍රතිරෝධය තේරුම් ගැනීම',
      'බර: සත්‍ය සහ අසත්‍ය දේ',
      'සමතුලිතතාවයට සහාය වන පුරුදු',
      'වෛද්‍ය පසු විපරම ප්‍රයෝජනවත් වන විට',
      'ප්‍රධාන කරුණු',
    ],
    body1: 'PCOS බොහෝ විට පරිවෘත්තීය වෙනස්කම් සමඟ, ඉන්සියුලින් ප්‍රතිරෝධය ඇතුළුව, සම්බන්ධ වේ. කෙසේ වෙතත්, මෙම සම්බන්ධය අධික බරැති කාන්තාවන්ට පමණක් අදාළ නොවේ — පරිවෘත්තීය පැතිකඩ පුද්ගලයාගෙන් පුද්ගලයාට වෙනස් වේ.',
    body2: 'ඉන්සියුලින් යනු සෛලවලට රුධිරයේ ග්ලූකෝස් භාවිතා කිරීමට උපකාරී වන හෝමෝනයකි. ඉන්සියුලින් ප්‍රතිරෝධය සමඟ, සෛල මෙම හෝමෝනයට අඩුවෙන් ප්‍රතිචාර දක්වන අතර, ශරීරය වැඩි ඉන්සියුලින් නිපදවීමෙන් වන්දි ගෙවිය හැක.',
    body3: 'PCOS හිදී, මෙය වැඩි වූ ඇන්ඩ්‍රජන් නිෂ්පාදනය සමඟ සම්බන්ධ විය හැකි අතර සමහර රෝග ලක්ෂණවලට දායක විය හැක. නමුත් PCOS ඇති සියලුම කාන්තාවන්ට එකම පරිවෘත්තීය පැතිකඩ නොමැත.',
    tip1Title: 'දැනගත යුතු දේ',
    tip1Text: 'වෛද්‍යවරයා අදාළ යැයි සලකන විට රුධිර පරීක්ෂණ හරහා ඉන්සියුලින් ප්‍රතිරෝධය පරීක්ෂා කළ හැක. පරීක්ෂණ අවශ්‍යද යන්න ඔබේ පුද්ගලික තත්ත්වය මත රඳා පවතී.',
    weightFacts: [
      'PCOS කෙට්ටු සිට බර ශරීර දක්වා සෑම ශරීර වර්ගයකම කාන්තාවන්ට බලපායි.',
      'බර වැඩිවීම ක්‍රමානුකූල නොවේ.',
      'බර අඩු කිරීම රෝග ලක්ෂණ වැඩිදියුණු කිරීමට සෑම විටම අවශ්‍ය නොවේ — හෝ තනිවම ප්‍රමාණවත් නොවේ.',
      'අධික බර ඇති විට, කුඩා බර අඩු කිරීමක් සමහර විට සමහර පරිවෘත්තීය දර්ශක හෝ චක්‍රයේ නිතිපතා බව වැඩිදියුණු කළ හැක.',
    ],
    body4: 'අරමුණ “පරිපූර්ණ” බරක් සොයා යාම නොව, යථාර්ථවාදී, කල් පවතින පුරුදු ගොඩනැගීමයි. සමතුලිත ආහාර වේලක්, චලනයක් සහ නිතිපතා නින්දක් සියල්ලම වඩා හොඳ පරිවෘත්තීය සෞඛ්‍යයට දායක විය හැක.',
    dailyHabits: [
      'තන්තු බහුල නිතිපතා, විවිධාකාර ආහාර වේල්',
      'මධ්‍යස්ථ වුවද, නිතිපතා ශාරීරික ක්‍රියාකාරකම',
      'ප්‍රමාණවත් නිතිපතා නින්ද',
      'ප්‍රමාණවත් දෛනික ජල සමතුලිතතාව',
    ],
    body5: 'PCOS සඳහා වෛද්‍ය පසු විපරම චක්‍රයට හෝ හෝමෝන රෝග ලක්ෂණවලට පමණක් සීමා නොවේ. ඔබේ පැතිකඩ අනුව, ඔබේ සෞඛ්‍ය සේවා සපයන්නාට විභව අවදානම් සාධක කල්තියා හඳුනාගැනීමට උපකාරී වීමට සමහර පරිවෘත්තීය දර්ශකද නිරීක්ෂණය කළ හැක.',
    medicalTitle: 'ඔබේ පැතිකඩට ගැළපෙන පසු විපරම',
    medicalSubtitle: 'විමර්ශනය සෑම කෙනෙකුටම එකම නොවේ.',
    medicalDescription: 'ඔබේ රෝග ලක්ෂණ, ඔබේ වෛද්‍ය ඉතිහාසය, ඔබේ පවුල් තත්ත්වය සහ වෙනත් අවදානම් සාධක මත පදනම්ව සමහර දර්ශක පරීක්ෂා කිරීමට ඔබේ වෛද්‍යවරයා තීරණය කළ හැක.',
    medicalSectionTitle: 'නිරීක්ෂණය කළ හැක්කේ කුමක්ද',
    medicalChecks: [
      'සන්දර්භය අනුව රුධිර ග්ලූකෝස් සහ/හෝ HbA1c',
      'ලිපිඩ පරීක්ෂාව (කොලෙස්ටරෝල් සහ ට්‍රයිග්ලිසරයිඩ්)',
      'රුධිර පීඩනය සහ හෘද වාහිනී අවදානම් තක්සේරුව',
      'විනිශ්චයකින් තොරව බර සහ ඉණ වට ප්‍රමාණය නිරීක්ෂණය',
    ],
    subH3: 'සඳහන් කිරීම වටින තත්ත්වයන්',
    body6: 'සමහර වෙනස්කම් උපදේශනයකදී සඳහන් කිරීම වටී, විශේෂයෙන් ඒවා අලුත්, දිගටම පවතින, හෝ ඔබට අසාමාන්‍ය වන විට.',
    medicalFollowUp: [
      {title: 'ඉතා අක්‍රමවත් චක්‍ර', description: 'ඉතා පරතරයක් ඇති හෝ පුරෝකථනය කළ නොහැකි ඔසප් සඳහන් කරන්න.'},
      {title: 'පිපාසය හෝ නිතර මුත්‍රා කිරීම', description: 'මෙම සලකුණු අසාමාන්‍ය ආකාරයෙන් දිස්වන්නේ නම් ඔබේ වෛද්‍යවරයා සමඟ කතා කරන්න.'},
      {title: 'සැලකිය යුතු බර වෙනසක්', description: 'වේගවත් හෝ පැහැදිලි කළ නොහැකි වෙනසක් තක්සේරු කර ගැනීම වටී.'},
      {title: 'පවුලේ ඉතිහාසය', description: 'දියවැඩියාවේ හෝ පරිවෘත්තීය තත්ත්වයන්ගේ ඕනෑම පවුල් ඉතිහාසයක් සඳහන් කරන්න.'},
    ],
    alertTitle: 'කරුණාකර සටහන් කරන්න',
    alertText: 'අසාමාන්‍ය පිපාසය, නිතර මුත්‍රා කිරීම, දිගටම පවතින වෙහෙස, හෝ බරෙහි සැලකිය යුතු, පැහැදිලි කළ නොහැකි වෙනසක් සෞඛ්‍ය වෘත්තිකයෙකුට වාර්තා කළ යුතුයි. මෙම සලකුණුවලට හේතු කිහිපයක් තිබිය හැකි අතර, තනිවම ඉන්සියුලින් ප්‍රතිරෝධය හෝ දියවැඩියාව තහවුරු නොකරයි.',
    followUpTipTitle: 'පසු විපරම කාලයත් සමඟ සිදුවේ',
    followUpTipText: 'ඔබේ වෛද්‍යවරයා තනි විමර්ශනයකට වඩා නිතිපතා පරීක්ෂා කිරීම් යෝජනා කළ හැක. අරමුණ බර මත පමණක් අවධානය යොමු නොකර, ඔබ ප්‍රගතියක් ලබන ආකාරයට උපදෙස් සහ පරීක්ෂණ සකස් කිරීමයි.',
    tip2Title: 'දැනගත යුතු දේ',
    tip2Text: 'PCOS හි පරිවෘත්තීය චිත්‍රයේ එක් කොටසක් පමණක් බරයි. විස්තීර්ණ ප්‍රවේශයක් චක්‍ර, රෝග ලක්ෂණ, ජීවන රටා පුරුදු, වෛද්‍ය ඉතිහාසය සහ පරිවෘත්තීය දර්ශක සැලකිල්ලට ගනී.',
    shareMessage: 'බර, පරිවෘත්තිය සහ ඉන්සියුලින් ප්‍රතිරෝධය — AWA',
  },
  th: {
    badge: 'PCOS',
    title: 'น้ำหนัก การเผาผลาญ และ\nภาวะดื้ออินซูลิน',
    metaDuration: 'อ่าน 6 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'ปานกลาง',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'ความเชื่อมโยงระหว่าง PCOS น้ำหนัก และภาวะดื้ออินซูลิน — โดยไม่ตัดสินและไม่มีทางลัด',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'ความเชื่อมโยงระหว่าง PCOS กับการเผาผลาญ',
      'ทำความเข้าใจภาวะดื้ออินซูลิน',
      'น้ำหนัก: อะไรจริงและอะไรไม่จริง',
      'นิสัยที่สนับสนุนสมดุล',
      'เมื่อไรที่การติดตามทางการแพทย์มีประโยชน์',
      'ประเด็นสำคัญ',
    ],
    body1: 'PCOS มักเกี่ยวข้องกับการเปลี่ยนแปลงด้านการเผาผลาญ รวมถึงภาวะดื้ออินซูลิน อย่างไรก็ตาม ความเกี่ยวข้องนี้ไม่ได้เกิดเฉพาะผู้หญิงที่น้ำหนักเกิน — โปรไฟล์การเผาผลาญแตกต่างกันในแต่ละคน',
    body2: 'อินซูลินเป็นฮอร์โมนที่ช่วยให้เซลล์ใช้กลูโคสในเลือด เมื่อดื้ออินซูลิน เซลล์ตอบสนองต่อฮอร์โมนนี้น้อยลง และร่างกายอาจชดเชยโดยผลิตอินซูลินมากขึ้น',
    body3: 'ใน PCOS สิ่งนี้อาจเกี่ยวข้องกับการผลิตแอนโดรเจนที่เพิ่มขึ้นและอาจมีส่วนทำให้เกิดอาการบางอย่าง แต่ไม่ใช่ผู้หญิงทุกคนที่เป็น PCOS จะมีโปรไฟล์การเผาผลาญเหมือนกัน',
    tip1Title: 'ควรรู้',
    tip1Text: 'ตรวจภาวะดื้ออินซูลินได้ด้วยการตรวจเลือดเมื่อแพทย์เห็นว่าเกี่ยวข้อง การต้องตรวจหรือไม่ขึ้นอยู่กับสถานการณ์ส่วนตัวของคุณ',
    weightFacts: [
      'PCOS เกิดกับผู้หญิงทุกรูปร่าง ตั้งแต่ผอมไปจนถึงตัวใหญ่ขึ้น',
      'น้ำหนักขึ้นไม่ได้เกิดทุกคน',
      'การลดน้ำหนักไม่จำเป็นเสมอไป — หรือไม่เพียงพอด้วยตัวเอง — เพื่อปรับปรุงอาการ',
      'การลดน้ำหนักเล็กน้อยบางครั้งปรับปรุงตัวชี้วัดการเผาผลาญบางอย่างหรือความสม่ำเสมอของรอบเดือนได้ เมื่อมีน้ำหนักเกิน',
    ],
    body4: 'เป้าหมายไม่ใช่การไล่ตามน้ำหนัก “สมบูรณ์แบบ” แต่เป็นการสร้างนิสัยที่เป็นจริงและยั่งยืน อาหารที่สมดุล การเคลื่อนไหว และการนอนหลับสม่ำเสมอ ล้วนมีส่วนต่อสุขภาพการเผาผลาญที่ดีขึ้น',
    dailyHabits: [
      'มื้ออาหารสม่ำเสมอและหลากหลายที่อุดมด้วยใยอาหาร',
      'กิจกรรมทางกายสม่ำเสมอ แม้ระดับปานกลาง',
      'นอนหลับให้เพียงพอและสม่ำเสมอ',
      'ดื่มน้ำให้เพียงพอทุกวัน',
    ],
    body5: 'การติดตามทางการแพทย์สำหรับ PCOS ไม่ได้จำกัดเพียงรอบเดือนหรืออาการทางฮอร์โมน ตามโปรไฟล์ของคุณ ผู้ให้การดูแลสุขภาพอาจติดตามตัวชี้วัดการเผาผลาญบางอย่างเพื่อช่วยระบุปัจจัยเสี่ยงที่อาจเกิดขึ้นตั้งแต่เนิ่น ๆ',
    medicalTitle: 'การติดตามที่เหมาะกับโปรไฟล์ของคุณ',
    medicalSubtitle: 'การประเมินไม่เหมือนกันสำหรับทุกคน',
    medicalDescription: 'แพทย์ของคุณอาจตัดสินใจตรวจตัวชี้วัดบางอย่างตามอาการ ประวัติทางการแพทย์ สถานการณ์ในครอบครัว และปัจจัยเสี่ยงอื่น ๆ ของคุณ',
    medicalSectionTitle: 'สิ่งที่อาจติดตาม',
    medicalChecks: [
      'น้ำตาลในเลือดและ/หรือ HbA1c ตามบริบท',
      'ผลตรวจไขมัน (คอเลสเตอรอลและไตรกลีเซอไรด์)',
      'ความดันโลหิตและการประเมินความเสี่ยงโรคหัวใจและหลอดเลือด',
      'การติดตามน้ำหนักและเส้นรอบเอว โดยไม่ตัดสิน',
    ],
    subH3: 'สถานการณ์ที่ควรแจ้ง',
    body6: 'การเปลี่ยนแปลงบางอย่างควรแจ้งระหว่างการปรึกษา โดยเฉพาะเมื่อเป็นเรื่องใหม่ คงอยู่ หรือผิดปกติสำหรับคุณ',
    medicalFollowUp: [
      {title: 'รอบเดือนไม่สม่ำเสมอมาก', description: 'แจ้งประจำเดือนที่ห่างกันมากหรือคาดเดาไม่ได้'},
      {title: 'กระหายน้ำหรือปัสสาวะบ่อย', description: 'พูดคุยกับแพทย์หากสัญญาณเหล่านี้ปรากฏผิดปกติ'},
      {title: 'น้ำหนักเปลี่ยนแปลงมาก', description: 'การเปลี่ยนแปลงที่รวดเร็วหรืออธิบายไม่ได้ควรได้รับการประเมิน'},
      {title: 'ประวัติครอบครัว', description: 'แจ้งประวัติเบาหวานหรือภาวะการเผาผลาญในครอบครัว'},
    ],
    alertTitle: 'โปรดทราบ',
    alertText: 'อาการกระหายน้ำผิดปกติ ปัสสาวะบ่อย เหนื่อยล้าต่อเนื่อง หรือน้ำหนักเปลี่ยนแปลงมากโดยอธิบายไม่ได้ ควรแจ้งบุคลากรทางการแพทย์ สัญญาณเหล่านี้อาจมีหลายสาเหตุ และไม่ได้ยืนยันภาวะดื้ออินซูลินหรือเบาหวานด้วยตัวเอง',
    followUpTipTitle: 'การติดตามเกิดขึ้นตามเวลา',
    followUpTipText: 'แพทย์ของคุณอาจแนะนำการตรวจสม่ำเสมอแทนการประเมินครั้งเดียว เป้าหมายคือปรับคำแนะนำและการตรวจตามความก้าวหน้าของคุณ โดยไม่เน้นเฉพาะน้ำหนัก',
    tip2Title: 'ควรรู้',
    tip2Text: 'น้ำหนักเป็นเพียงส่วนหนึ่งของภาพการเผาผลาญใน PCOS แนวทางที่ครอบคลุมคำนึงถึงรอบเดือน อาการ นิสัยในวิถีชีวิต ประวัติทางการแพทย์ และตัวชี้วัดการเผาผลาญ',
    shareMessage: 'น้ำหนัก การเผาผลาญ และภาวะดื้ออินซูลิน — AWA',
  },
  vi: {
    badge: 'PCOS',
    title: 'Cân nặng, chuyển hóa và\nkháng insulin',
    metaDuration: '6 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Trung cấp',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Mối liên hệ giữa PCOS, cân nặng và kháng insulin — không phán xét, không đi đường tắt.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Mối liên hệ giữa PCOS và chuyển hóa',
      'Hiểu về kháng insulin',
      'Cân nặng: điều gì đúng và điều gì không',
      'Những thói quen hỗ trợ sự cân bằng',
      'Khi nào việc theo dõi y tế hữu ích',
      'Những điểm chính cần nhớ',
    ],
    body1: 'PCOS thường đi kèm với những thay đổi chuyển hóa, bao gồm kháng insulin. Tuy nhiên, mối liên hệ này không chỉ liên quan đến phụ nữ thừa cân — hồ sơ chuyển hóa khác nhau giữa từng người.',
    body2: 'Insulin là một hormone giúp tế bào sử dụng glucose trong máu. Khi kháng insulin, tế bào đáp ứng kém hơn với hormone này, và cơ thể có thể bù đắp bằng cách sản xuất nhiều insulin hơn.',
    body3: 'Ở PCOS, điều này có thể đi kèm với việc tăng sản xuất androgen và có thể góp phần gây ra một số triệu chứng. Nhưng không phải tất cả phụ nữ bị PCOS đều có cùng hồ sơ chuyển hóa.',
    tip1Title: 'Nên biết',
    tip1Text: 'Kháng insulin có thể được kiểm tra qua xét nghiệm máu khi bác sĩ thấy cần thiết. Việc có cần xét nghiệm hay không phụ thuộc vào tình huống cá nhân của bạn.',
    weightFacts: [
      'PCOS ảnh hưởng đến phụ nữ ở mọi vóc dáng, từ gầy đến đầy đặn hơn.',
      'Tăng cân không phải lúc nào cũng xảy ra.',
      'Giảm cân không phải lúc nào cũng cần thiết — hoặc tự nó không đủ — để cải thiện triệu chứng.',
      'Giảm một chút cân đôi khi có thể cải thiện một số chỉ số chuyển hóa hoặc độ đều của chu kỳ khi có thừa cân.',
    ],
    body4: 'Mục tiêu không phải là theo đuổi một cân nặng “hoàn hảo”, mà là xây dựng những thói quen thực tế, bền vững. Chế độ ăn cân bằng, vận động và giấc ngủ đều đặn đều có thể góp phần cải thiện sức khỏe chuyển hóa.',
    dailyHabits: [
      'Các bữa ăn đều đặn, đa dạng, giàu chất xơ',
      'Hoạt động thể chất đều đặn, kể cả vừa phải',
      'Ngủ đủ giấc đều đặn',
      'Uống đủ nước mỗi ngày',
    ],
    body5: 'Theo dõi y tế cho PCOS không chỉ giới hạn ở chu kỳ hay các triệu chứng nội tiết. Tùy hồ sơ của bạn, nhân viên y tế cũng có thể theo dõi một số chỉ số chuyển hóa để giúp sớm nhận ra các yếu tố nguy cơ tiềm ẩn.',
    medicalTitle: 'Theo dõi phù hợp với hồ sơ của bạn',
    medicalSubtitle: 'Các xét nghiệm không giống nhau với mọi người.',
    medicalDescription: 'Bác sĩ có thể quyết định kiểm tra một số chỉ số dựa trên triệu chứng, tiền sử bệnh, hoàn cảnh gia đình và các yếu tố nguy cơ khác của bạn.',
    medicalSectionTitle: 'Những gì có thể được theo dõi',
    medicalChecks: [
      'Đường huyết và/hoặc HbA1c, tùy bối cảnh',
      'Mỡ máu (cholesterol và triglyceride)',
      'Huyết áp và đánh giá nguy cơ tim mạch',
      'Theo dõi cân nặng và vòng eo, không phán xét',
    ],
    subH3: 'Những tình huống đáng nêu ra',
    body6: 'Một số thay đổi đáng được nêu ra trong buổi khám, đặc biệt khi chúng mới xuất hiện, kéo dài hoặc bất thường với bạn.',
    medicalFollowUp: [
      {title: 'Chu kỳ rất không đều', description: 'Hãy nêu ra những kỳ kinh rất thưa hoặc không thể dự đoán.'},
      {title: 'Khát nước hoặc đi tiểu thường xuyên', description: 'Hãy nói với bác sĩ nếu những dấu hiệu này xuất hiện một cách bất thường.'},
      {title: 'Thay đổi cân nặng đáng kể', description: 'Một thay đổi nhanh hoặc không rõ nguyên nhân đáng được đánh giá.'},
      {title: 'Tiền sử gia đình', description: 'Hãy nêu ra mọi tiền sử gia đình về tiểu đường hoặc các bệnh chuyển hóa.'},
    ],
    alertTitle: 'Xin lưu ý',
    alertText: 'Khát nước bất thường, đi tiểu thường xuyên, mệt mỏi kéo dài hoặc thay đổi cân nặng đáng kể không rõ nguyên nhân cần được báo với nhân viên y tế. Những dấu hiệu này có thể có nhiều nguyên nhân và tự chúng không xác nhận kháng insulin hay tiểu đường.',
    followUpTipTitle: 'Việc theo dõi diễn ra theo thời gian',
    followUpTipText: 'Bác sĩ có thể đề xuất các lần kiểm tra định kỳ thay vì một đợt thăm khám duy nhất. Mục tiêu là điều chỉnh lời khuyên và xét nghiệm theo diễn tiến của bạn, không chỉ tập trung vào cân nặng.',
    tip2Title: 'Nên biết',
    tip2Text: 'Cân nặng chỉ là một phần của bức tranh chuyển hóa ở PCOS. Một cách tiếp cận toàn diện cân nhắc chu kỳ, triệu chứng, thói quen sinh hoạt, tiền sử bệnh và các chỉ số chuyển hóa.',
    shareMessage: 'Cân nặng, chuyển hóa và kháng insulin — AWA',
  },
  uz: {
    badge: 'PCOS',
    title: 'Vazn, metabolizm va\ninsulin qarshiligi',
    metaDuration: '6 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Oʻrta',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'PCOS, vazn va insulin qarshiligi oʻrtasidagi bogʻliqlik — hukm chiqarmasdan va yengil yoʻllarsiz.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'PCOS va metabolizm oʻrtasidagi bogʻliqlik',
      'Insulin qarshiligini tushunish',
      'Vazn: nima toʻgʻri va nima emas',
      'Muvozanatni qoʻllab-quvvatlaydigan odatlar',
      'Tibbiy nazorat qachon foydali',
      'Asosiy xulosalar',
    ],
    body1: 'PCOS koʻpincha metabolik oʻzgarishlar, jumladan insulin qarshiligi bilan bogʻliq. Biroq bu bogʻliqlik faqat ortiqcha vaznli ayollarga tegishli emas — metabolik profillar odamdan odamga farq qiladi.',
    body2: 'Insulin — hujayralarga qondagi glyukozadan foydalanishga yordam beradigan gormon. Insulin qarshiligida hujayralar bu gormonga kamroq javob beradi va tana koʻproq insulin ishlab chiqarish bilan kompensatsiya qilishi mumkin.',
    body3: 'PCOS da bu androgen ishlab chiqarishning ortishi bilan bogʻliq boʻlishi va baʼzi alomatlarga hissa qoʻshishi mumkin. Lekin PCOS li barcha ayollarda bir xil metabolik profil boʻlmaydi.',
    tip1Title: 'Bilish foydali',
    tip1Text: 'Shifokor maqsadga muvofiq deb hisoblasa, insulin qarshiligi qon tahlillari orqali tekshirilishi mumkin. Tahlillar kerak yoki kerak emasligi individual vaziyatingizga bogʻliq.',
    weightFacts: [
      'PCOS ozgʻindan yirikroq tana tuzilishigacha har qanday tana tuzilishidagi ayollarga taʼsir qiladi.',
      'Vazn ortishi doimiy emas.',
      'Vazn tashlash alomatlarni yaxshilash uchun har doim ham zarur emas — va yakka oʻzi yetarli ham emas.',
      'Ortiqcha vazn boʻlganda ozgina vazn tashlash baʼzan baʼzi metabolik koʻrsatkichlar yoki sikl muntazamligini yaxshilashi mumkin.',
    ],
    body4: 'Maqsad “mukammal” vaznni quvish emas, balki real, barqaror odatlarni shakllantirish. Muvozanatli ovqatlanish, harakat va muntazam uyqu — barchasi yaxshiroq metabolik salomatlikka hissa qoʻshishi mumkin.',
    dailyHabits: [
      'Tolaga boy muntazam, xilma-xil ovqatlar',
      'Muntazam jismoniy faollik, hatto muʼtadil boʻlsa ham',
      'Yetarli muntazam uyqu',
      'Kundalik yetarli suv balansi',
    ],
    body5: 'PCOS uchun tibbiy nazorat siklga yoki gormonal alomatlarga cheklanmaydi. Profilingizga qarab, sogʻliqni saqlash xodimi mumkin boʻlgan xavf omillarini erta aniqlashga yordam berish uchun baʼzi metabolik koʻrsatkichlarni ham kuzatishi mumkin.',
    medicalTitle: 'Profilingizga moslashtirilgan nazorat',
    medicalSubtitle: 'Tekshiruv hamma uchun bir xil emas.',
    medicalDescription: 'Shifokoringiz alomatlaringiz, tibbiy tarixingiz, oilaviy vaziyatingiz va boshqa xavf omillariga qarab baʼzi koʻrsatkichlarni tekshirishga qaror qilishi mumkin.',
    medicalSectionTitle: 'Nima kuzatilishi mumkin',
    medicalChecks: [
      'Kontekstga qarab qon glyukozasi va/yoki HbA1c',
      'Lipid paneli (xolesterin va triglitseridlar)',
      'Qon bosimi va yurak-qon tomir xavfini baholash',
      'Hukm chiqarmasdan vazn va bel aylanasini kuzatish',
    ],
    subH3: 'Aytib qoʻyishga arziydigan vaziyatlar',
    body6: 'Baʼzi oʻzgarishlar, ayniqsa yangi, doimiy yoki siz uchun odatdan tashqari boʻlsa, konsultatsiya paytida aytib qoʻyishga arziydi.',
    medicalFollowUp: [
      {title: 'Juda notekis sikllar', description: 'Juda uzoq oraliqdagi yoki oldindan aytib boʻlmaydigan hayzlar haqida ayting.'},
      {title: 'Chanqoq yoki tez-tez siyish', description: 'Bu belgilar odatdan tashqari paydo boʻlsa, shifokor bilan gaplashing.'},
      {title: 'Sezilarli vazn oʻzgarishi', description: 'Tez yoki izohsiz oʻzgarishni baholatishga arziydi.'},
      {title: 'Oilaviy tarix', description: 'Diabet yoki metabolik holatlarning har qanday oilaviy tarixi haqida ayting.'},
    ],
    alertTitle: 'Eʼtibor bering',
    alertText: 'Odatdan tashqari chanqoq, tez-tez siyish, doimiy charchoq yoki vaznning sezilarli, izohsiz oʻzgarishi haqida sogʻliqni saqlash mutaxassisiga xabar berilishi kerak. Bu belgilarning bir necha sababi boʻlishi mumkin va yakka oʻzi insulin qarshiligi yoki diabetni tasdiqlamaydi.',
    followUpTipTitle: 'Nazorat vaqt oʻtishi bilan amalga oshiriladi',
    followUpTipText: 'Shifokoringiz yakka tekshiruv oʻrniga muntazam tekshiruvlarni taklif qilishi mumkin. Maqsad faqat vaznga eʼtibor qaratmasdan, maslahat va tahlillarni sizning oʻzgarishingizga moslashtirish.',
    tip2Title: 'Bilish foydali',
    tip2Text: 'PCOS da vazn metabolik tasvirning faqat bir qismi. Kompleks yondashuv sikllar, alomatlar, turmush tarzi odatlari, tibbiy tarix va metabolik koʻrsatkichlarni hisobga oladi.',
    shareMessage: 'Vazn, metabolizm va insulin qarshiligi — AWA',
  },
  az: {
    badge: 'PKOS',
    title: 'Çəki, maddələr mübadiləsi və\ninsulin rezistentliyi',
    metaDuration: '6 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Orta',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'PKOS, çəki və insulin rezistentliyi arasındakı əlaqə — mühakimə və yarımçıq nəticələr olmadan.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'PKOS ilə maddələr mübadiləsi arasındakı əlaqə',
      'İnsulin rezistentliyini anlamaq',
      'Çəki: nə doğrudur və nə doğru deyil',
      'Tarazlığı dəstəkləyən vərdişlər',
      'Tibbi nəzarət nə vaxt faydalıdır',
      'Əsas nəticələr',
    ],
    body1: 'PKOS çox vaxt insulin rezistentliyi də daxil olmaqla metabolik dəyişikliklərlə əlaqələndirilir. Lakin bu əlaqə yalnız artıq çəkisi olan qadınlara aid deyil — metabolik profillər şəxsdən şəxsə dəyişir.',
    body2: 'İnsulin hüceyrələrə qandakı qlükozadan istifadə etməyə kömək edən hormondur. İnsulin rezistentliyi zamanı hüceyrələr bu hormona daha pis cavab verir və bədən daha çox insulin istehsal etməklə kompensasiya edə bilər.',
    body3: 'PKOS-da bu, androgen istehsalının artması ilə əlaqələndirilə bilər və bəzi simptomlara töhfə verə bilər. Lakin PKOS olan bütün qadınların eyni metabolik profili yoxdur.',
    tip1Title: 'Bilmək faydalıdır',
    tip1Text: 'İnsulin rezistentliyi həkim bunu məqsədəuyğun hesab etdikdə qan testləri ilə yoxlana bilər. Testlərin lazım olub-olmaması fərdi vəziyyətinizdən asılıdır.',
    weightFacts: [
      'PKOS arıqdan daha iri quruluşa qədər bütün bədən quruluşlu qadınlara təsir edir.',
      'Çəki artımı sistematik deyil.',
      'Çəki itirmək həmişə lazım deyil — və tək başına simptomları yaxşılaşdırmaq üçün kifayət deyil.',
      'Artıq çəki olduqda kiçik çəki itkisi bəzən bəzi metabolik göstəriciləri və ya dövrün müntəzəmliyini yaxşılaşdıra bilər.',
    ],
    body4: 'Məqsəd “mükəmməl” çəki arxasınca qaçmaq deyil, real, davamlı vərdişlər qurmaqdır. Balanslı qidalanma, hərəkət və müntəzəm yuxu hamısı daha yaxşı metabolik sağlamlığa töhfə verə bilər.',
    dailyHabits: [
      'Lifə zəngin müntəzəm, müxtəlif yeməklər',
      'Orta səviyyəli olsa belə, müntəzəm fiziki fəaliyyət',
      'Kifayət qədər müntəzəm yuxu',
      'Gündəlik kifayət qədər hidratasiya',
    ],
    body5: 'PKOS üçün tibbi nəzarət dövr və ya hormonal simptomlarla məhdudlaşmır. Profilinizdən asılı olaraq tibb işçisi potensial risk amillərini erkən müəyyən etməyə kömək etmək üçün bəzi metabolik göstəriciləri də izləyə bilər.',
    medicalTitle: 'Profilinizə uyğunlaşdırılmış nəzarət',
    medicalSubtitle: 'Müayinə hamı üçün eyni deyil.',
    medicalDescription: 'Həkiminiz simptomlarınıza, tibbi tarixçənizə, ailə vəziyyətinizə və digər risk amillərinə əsasən bəzi göstəriciləri yoxlamağa qərar verə bilər.',
    medicalSectionTitle: 'Nələr izlənə bilər',
    medicalChecks: [
      'Kontekstdən asılı olaraq qanda qlükoza və/və ya HbA1c',
      'Lipid paneli (xolesterol və trigliseridlər)',
      'Qan təzyiqi və ürək-damar riskinin qiymətləndirilməsi',
      'Mühakimə etmədən çəkinin və bel çevrəsinin izlənməsi',
    ],
    subH3: 'Qeyd etməyə dəyər vəziyyətlər',
    body6: 'Bəzi dəyişiklikləri konsultasiya zamanı qeyd etməyə dəyər, xüsusilə onlar yeni, davamlı və ya sizin üçün qeyri-adi olduqda.',
    medicalFollowUp: [
      {title: 'Çox qeyri-müntəzəm dövrlər', description: 'Çox seyrək və ya proqnozlaşdırıla bilməyən aybaşıları qeyd edin.'},
      {title: 'Susuzluq və ya tez-tez sidik ifrazı', description: 'Bu əlamətlər qeyri-adi şəkildə görünərsə, həkiminizlə danışın.'},
      {title: 'Əhəmiyyətli çəki dəyişikliyi', description: 'Sürətli və ya izah olunmayan dəyişikliyi qiymətləndirməyə dəyər.'},
      {title: 'Ailə tarixçəsi', description: 'Diabet və ya metabolik xəstəliklərin hər hansı ailə tarixçəsini qeyd edin.'},
    ],
    alertTitle: 'Nəzərə alın',
    alertText: 'Qeyri-adi susuzluq, tez-tez sidik ifrazı, davamlı yorğunluq və ya çəkidə əhəmiyyətli, izah olunmayan dəyişiklik tibb işçisinə bildirilməlidir. Bu əlamətlərin bir neçə səbəbi ola bilər və tək başına insulin rezistentliyini və ya diabeti təsdiq etmir.',
    followUpTipTitle: 'Nəzarət zamanla aparılır',
    followUpTipText: 'Həkiminiz tək müayinə əvəzinə müntəzəm yoxlamalar təklif edə bilər. Məqsəd yalnız çəkiyə diqqət yetirmədən, məsləhət və testləri irəliləyişinizə uyğunlaşdırmaqdır.',
    tip2Title: 'Bilmək faydalıdır',
    tip2Text: 'Çəki PKOS-da metabolik mənzərənin yalnız bir hissəsidir. Hərtərəfli yanaşma dövrləri, simptomları, həyat tərzi vərdişlərini, tibbi tarixçəni və metabolik göstəriciləri nəzərə alır.',
    shareMessage: 'Çəki, maddələr mübadiləsi və insulin rezistentliyi — AWA',
  },
  ka: {
    badge: 'PCOS',
    title: 'წონა, მეტაბოლიზმი და\nინსულინრეზისტენტობა',
    metaDuration: '6 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'საშუალო',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'კავშირი PCOS-ს, წონასა და ინსულინრეზისტენტობას შორის — განსჯისა და მარტივი პასუხების გარეშე.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'კავშირი PCOS-სა და მეტაბოლიზმს შორის',
      'ინსულინრეზისტენტობის გაგება',
      'წონა: რა არის სიმართლე და რა არა',
      'ჩვევები, რომლებიც ბალანსს უჭერს მხარს',
      'როდის არის სამედიცინო მეთვალყურეობა სასარგებლო',
      'მთავარი დასკვნები',
    ],
    body1: 'PCOS ხშირად მეტაბოლურ ცვლილებებს უკავშირდება, მათ შორის ინსულინრეზისტენტობას. თუმცა ეს კავშირი მხოლოდ ჭარბი წონის მქონე ქალებს არ ეხება — მეტაბოლური პროფილები ადამიანიდან ადამიანამდე განსხვავდება.',
    body2: 'ინსულინი ჰორმონია, რომელიც უჯრედებს სისხლში გლუკოზის გამოყენებაში ეხმარება. ინსულინრეზისტენტობის დროს უჯრედები ამ ჰორმონზე უარესად რეაგირებს და სხეულმა შეიძლება უფრო მეტი ინსულინის გამომუშავებით ანაზღაუროს.',
    body3: 'PCOS-ის დროს ეს შეიძლება ანდროგენების გაზრდილ გამომუშავებას უკავშირდებოდეს და გარკვეულ სიმპტომებს ხელი შეუწყოს. მაგრამ PCOS-ის მქონე ყველა ქალს ერთნაირი მეტაბოლური პროფილი არ აქვს.',
    tip1Title: 'კარგია ვიცოდეთ',
    tip1Text: 'ინსულინრეზისტენტობა სისხლის ანალიზებით შეიძლება შემოწმდეს, როცა ექიმი ამას მიზანშეწონილად მიიჩნევს. ტესტების საჭიროება თქვენს ინდივიდუალურ სიტუაციაზეა დამოკიდებული.',
    weightFacts: [
      'PCOS ყველა აღნაგობის ქალს ეხება, გამხდრიდან უფრო მსხვილ აღნაგობამდე.',
      'წონის მატება სისტემატური არ არის.',
      'წონის დაკლება ყოველთვის არ არის საჭირო — და არც ყოველთვის საკმარისი — სიმპტომების გასაუმჯობესებლად.',
      'წონის მცირედ დაკლებამ შეიძლება ზოგჯერ გააუმჯობესოს გარკვეული მეტაბოლური მარკერები ან ციკლის რეგულარულობა, როცა ჭარბი წონაა.',
    ],
    body4: 'მიზანი „იდეალური“ წონის დევნა არ არის, არამედ რეალისტური, მდგრადი ჩვევების აგება. დაბალანსებულ კვებას, მოძრაობასა და რეგულარულ ძილს შეუძლია უკეთესი მეტაბოლური ჯანმრთელობის ხელშეწყობა.',
    dailyHabits: [
      'რეგულარული, ბოჭკოთი მდიდარი მრავალფეროვანი კვება',
      'რეგულარული ფიზიკური აქტივობა, თუნდაც ზომიერი',
      'საკმარისი რეგულარული ძილი',
      'საკმარისი ყოველდღიური ჰიდრატაცია',
    ],
    body5: 'PCOS-ის სამედიცინო მეთვალყურეობა ციკლით ან ჰორმონული სიმპტომებით არ შემოიფარგლება. თქვენი პროფილის მიხედვით, თქვენმა ჯანდაცვის სპეციალისტმა შეიძლება ასევე გარკვეული მეტაბოლური მარკერები აკონტროლოს, რომ პოტენციური რისკ-ფაქტორები ადრევე გამოვლინდეს.',
    medicalTitle: 'თქვენს პროფილზე მორგებული მეთვალყურეობა',
    medicalSubtitle: 'გამოკვლევა ყველასთვის ერთნაირი არ არის.',
    medicalDescription: 'თქვენმა ექიმმა შეიძლება გადაწყვიტოს გარკვეული მარკერების შემოწმება თქვენი სიმპტომების, სამედიცინო ისტორიის, ოჯახური სიტუაციისა და სხვა რისკ-ფაქტორების მიხედვით.',
    medicalSectionTitle: 'რა შეიძლება კონტროლდებოდეს',
    medicalChecks: [
      'სისხლში გლუკოზა და/ან HbA1c, კონტექსტის მიხედვით',
      'ლიპიდური პროფილი (ქოლესტერინი და ტრიგლიცერიდები)',
      'არტერიული წნევა და გულ-სისხლძარღვთა რისკის შეფასება',
      'წონისა და წელის გარშემოწერილობის კონტროლი, განსჯის გარეშე',
    ],
    subH3: 'სიტუაციები, რომლებიც ნახსენებად ღირს',
    body6: 'გარკვეული ცვლილებები კონსულტაციაზე ნახსენებად ღირს, განსაკუთრებით როცა ისინი ახალია, გრძელდება ან თქვენთვის უჩვეულოა.',
    medicalFollowUp: [
      {title: 'ძალიან არარეგულარული ციკლები', description: 'ახსენეთ ძალიან დაშორებული ან არაპროგნოზირებადი მენსტრუაციები.'},
      {title: 'წყურვილი ან ხშირი შარდვა', description: 'ესაუბრეთ თქვენს ექიმს, თუ ეს ნიშნები უჩვეულოდ ჩნდება.'},
      {title: 'წონის მნიშვნელოვანი ცვლილება', description: 'სწრაფი ან აუხსნელი ცვლილება შეფასებას იმსახურებს.'},
      {title: 'ოჯახური ისტორია', description: 'ახსენეთ დიაბეტის ან მეტაბოლური მდგომარეობების ნებისმიერი ოჯახური ისტორია.'},
    ],
    alertTitle: 'გაითვალისწინეთ',
    alertText: 'უჩვეულო წყურვილი, ხშირი შარდვა, გაგრძელებული დაღლილობა ან წონის მნიშვნელოვანი, აუხსნელი ცვლილება ჯანდაცვის სპეციალისტს უნდა შეატყობინოთ. ამ ნიშნებს რამდენიმე მიზეზი შეიძლება ჰქონდეს და თავისთავად ინსულინრეზისტენტობას ან დიაბეტს არ ადასტურებს.',
    followUpTipTitle: 'მეთვალყურეობა დროთა განმავლობაში ხდება',
    followUpTipText: 'თქვენმა ექიმმა შეიძლება ერთჯერადი გამოკვლევის ნაცვლად რეგულარული შემოწმებები შემოგთავაზოთ. მიზანია რჩევებისა და ტესტების მორგება თქვენი განვითარებისადმი, მხოლოდ წონაზე ფოკუსირების გარეშე.',
    tip2Title: 'კარგია ვიცოდეთ',
    tip2Text: 'წონა PCOS-ის დროს მეტაბოლური სურათის მხოლოდ ერთი ნაწილია. ყოვლისმომცველი მიდგომა ითვალისწინებს ციკლებს, სიმპტომებს, ცხოვრების წესის ჩვევებს, სამედიცინო ისტორიასა და მეტაბოლურ მარკერებს.',
    shareMessage: 'წონა, მეტაბოლიზმი და ინსულინრეზისტენტობა — AWA',
  },
  hy: {
    badge: 'PCOS',
    title: 'Քաշ, նյութափոխանակություն և\nինսուլինակայունություն',
    metaDuration: '6 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Միջին',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Կապը PCOS-ի, քաշի և ինսուլինակայունության միջև՝ առանց դատապարտման կամ կրճատ ճանապարհների:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Կապը PCOS-ի և նյութափոխանակության միջև',
      'Հասկանալ ինսուլինակայունությունը',
      'Քաշ. ինչն է ճիշտ և ինչը՝ ոչ',
      'Սովորություններ, որոնք աջակցում են հավասարակշռությանը',
      'Երբ օգտակար է բժշկական հսկողությունը',
      'Հիմնական եզրակացություններ',
    ],
    body1: 'PCOS-ը հաճախ կապված է նյութափոխանակային փոփոխությունների հետ, այդ թվում՝ ինսուլինակայունության: Սակայն այս կապը վերաբերում է ոչ միայն ավելորդ քաշ ունեցող կանանց. նյութափոխանակային պրոֆիլները տարբերվում են մարդուց մարդ:',
    body2: 'Ինսուլինը հորմոն է, որը օգնում է բջիջներին օգտագործել արյան մեջ գտնվող գլյուկոզը: Ինսուլինակայունության դեպքում բջիջները ավելի վատ են արձագանքում այս հորմոնին, և մարմինը կարող է փոխհատուցել՝ արտադրելով ավելի շատ ինսուլին:',
    body3: 'PCOS-ի դեպքում սա կարող է կապված լինել անդրոգենների արտադրության ավելացման հետ և կարող է նպաստել որոշ ախտանիշների: Բայց PCOS ունեցող բոլոր կանայք նույն նյութափոխանակային պրոֆիլը չունեն:',
    tip1Title: 'Լավ է իմանալ',
    tip1Text: 'Ինսուլինակայունությունը կարելի է ստուգել արյան անալիզներով, երբ բժիշկը դա տեղին է համարում: Անալիզների անհրաժեշտությունը կախված է ձեր անհատական իրավիճակից:',
    weightFacts: [
      'PCOS-ը ազդում է բոլոր կազմվածքի կանանց վրա՝ նիհարից մինչև ավելի լայն կազմվածք:',
      'Քաշի ավելացումը համակարգված չէ:',
      'Քաշ կորցնելը միշտ անհրաժեշտ չէ, և միայնակ միշտ բավարար չէ ախտանիշները բարելավելու համար:',
      'Քաշի փոքր կորուստը երբեմն կարող է բարելավել որոշ նյութափոխանակային ցուցանիշներ կամ ցիկլի կանոնավորությունը՝ ավելորդ քաշի առկայության դեպքում:',
    ],
    body4: 'Նպատակը «կատարյալ» քաշի հետևից վազելը չէ, այլ իրատեսական, երկարատև սովորություններ կառուցելը: Հավասարակշռված սննդակարգը, շարժումը և կանոնավոր քունը բոլորը կարող են նպաստել նյութափոխանակային ավելի լավ առողջությանը:',
    dailyHabits: [
      'Կանոնավոր, բազմազան ճաշեր՝ հարուստ մանրաթելերով',
      'Կանոնավոր ֆիզիկական ակտիվություն, նույնիսկ եթե չափավոր է',
      'Բավարար կանոնավոր քուն',
      'Բավարար ամենօրյա հիդրատացիա',
    ],
    body5: 'PCOS-ի բժշկական հսկողությունը չի սահմանափակվում ցիկլով կամ հորմոնալ ախտանիշներով: Կախված ձեր պրոֆիլից՝ ձեր առողջապահության մասնագետը կարող է նաև վերահսկել որոշ նյութափոխանակային ցուցանիշներ՝ հնարավոր վտանգի գործոնները վաղ բացահայտելու համար:',
    medicalTitle: 'Հսկողություն՝ հարմարեցված ձեր պրոֆիլին',
    medicalSubtitle: 'Քննությունը բոլորի համար նույնը չէ:',
    medicalDescription: 'Ձեր բժիշկը կարող է որոշել ստուգել որոշ ցուցանիշներ՝ ձեր ախտանիշների, բժշկական պատմության, ընտանեկան իրավիճակի և վտանգի այլ գործոնների հիման վրա:',
    medicalSectionTitle: 'Ինչ կարող է վերահսկվել',
    medicalChecks: [
      'Արյան գլյուկոզ և/կամ HbA1c՝ կախված համատեքստից',
      'Լիպիդային պրոֆիլ (խոլեստերին և տրիգլիցերիդներ)',
      'Արյան ճնշում և սրտանոթային վտանգի գնահատում',
      'Քաշի և գոտկատեղի շրջագծի հետևում՝ առանց դատելու',
    ],
    subH3: 'Իրավիճակներ, որոնք արժե նշել',
    body6: 'Որոշ փոփոխություններ արժե նշել խորհրդատվության ժամանակ, հատկապես երբ դրանք նոր են, շարունակական կամ ձեզ համար անսովոր:',
    medicalFollowUp: [
      {title: 'Շատ անկանոն ցիկլեր', description: 'Նշեք շատ հեռու իրարից կամ անկանխատեսելի դաշտանները:'},
      {title: 'Ծարավ կամ հաճախակի միզարձակում', description: 'Խոսեք ձեր բժշկի հետ, եթե այս նշանները հայտնվեն անսովոր կերպով:'},
      {title: 'Քաշի զգալի փոփոխություն', description: 'Արագ կամ անբացատրելի փոփոխությունը արժե գնահատել:'},
      {title: 'Ընտանեկան պատմություն', description: 'Նշեք շաքարախտի կամ նյութափոխանակային հիվանդությունների ցանկացած ընտանեկան պատմություն:'},
    ],
    alertTitle: 'Խնդրում ենք ուշադրություն դարձնել',
    alertText: 'Անսովոր ծարավը, հաճախակի միզարձակումը, շարունակական հոգնածությունը կամ քաշի զգալի, անբացատրելի փոփոխությունը պետք է հայտնել առողջապահության մասնագետին: Այս նշանները կարող են ունենալ մի քանի պատճառ և ինքնին չեն հաստատում ինսուլինակայունությունը կամ շաքարախտը:',
    followUpTipTitle: 'Հսկողությունը տեղի է ունենում ժամանակի ընթացքում',
    followUpTipText: 'Ձեր բժիշկը կարող է առաջարկել կանոնավոր հետազոտություններ՝ մեկ քննության փոխարեն: Նպատակը խորհուրդները և հետազոտությունները ձեր առաջընթացին հարմարեցնելն է՝ առանց կենտրոնանալու միայն քաշի վրա:',
    tip2Title: 'Լավ է իմանալ',
    tip2Text: 'Քաշը PCOS-ի նյութափոխանակային պատկերի միայն մի մասն է: Համապարփակ մոտեցումը հաշվի է առնում ցիկլերը, ախտանիշները, ապրելակերպի սովորությունները, բժշկական պատմությունը և նյութափոխանակային ցուցանիշները:',
    shareMessage: 'Քաշ, նյութափոխանակություն և ինսուլինակայունություն — AWA',
  },
  tg: {
    badge: 'PCOS',
    title: 'Вазн, мубодилаи моддаҳо ва\nмуқовимати инсулин',
    metaDuration: '6 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Миёна',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Робитаи байни PCOS, вазн ва муқовимати инсулин — бе доварӣ ва роҳҳои кӯтоҳ.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Робитаи байни PCOS ва мубодилаи моддаҳо',
      'Фаҳмидани муқовимати инсулин',
      'Вазн: чӣ ҳақиқат аст ва чӣ нест',
      'Одатҳое, ки тавозунро дастгирӣ мекунанд',
      'Кай пайгирии тиббӣ муфид аст',
      'Хулосаҳои асосӣ',
    ],
    body1: 'PCOS аксар вақт бо тағйироти мубодилавӣ, аз ҷумла муқовимати инсулин, алоқаманд аст. Бо вуҷуди ин, ин алоқа танҳо занони вазни зиёддоштаро фаро намегирад — профилҳои мубодилавӣ аз шахс ба шахс фарқ мекунанд.',
    body2: 'Инсулин гормонест, ки ба ҳуҷайраҳо кумак мекунад глюкозаи хунро истифода баранд. Бо муқовимати инсулин ҳуҷайраҳо ба ин гормон камтар хуб вокуниш нишон медиҳанд ва бадан метавонад бо тавлиди бештари инсулин ҷуброн кунад.',
    body3: 'Дар PCOS ин метавонад бо афзоиши тавлиди андрогенҳо алоқаманд бошад ва метавонад ба баъзе нишонаҳо мусоидат кунад. Аммо на ҳамаи занони дорои PCOS профили мубодилавии якхела доранд.',
    tip1Title: 'Донистан хуб аст',
    tip1Text: 'Муқовимати инсулинро тавассути санҷишҳои хун санҷидан мумкин аст, вақте ки табиб онро мувофиқ мешуморад. Зарурати санҷишҳо ба вазъияти инфиродии шумо вобаста аст.',
    weightFacts: [
      'PCOS занони ҳама навъи ҷусса, аз борик то пурқувватро фаро мегирад.',
      'Афзудани вазн мунтазам нест.',
      'Кам кардани вазн на ҳамеша зарур аст — ва на ҳамеша барои беҳтар кардани нишонаҳо кифоя аст.',
      'Кам кардани андаки вазн баъзан метавонад баъзе нишондиҳандаҳои мубодилавӣ ё мунтазамии давраро беҳтар кунад, вақте ки вазни зиёдатӣ мавҷуд аст.',
    ],
    body4: 'Мақсад пайравии «вазни комил» нест, балки сохтани одатҳои воқеӣ ва устувор аст. Ғизои мутавозин, ҳаракат ва хоби мунтазам ҳама метавонанд ба саломатии беҳтари мубодилавӣ мусоидат кунанд.',
    dailyHabits: [
      'Хӯрокҳои мунтазам ва гуногуни бойи нахи ғизоӣ',
      'Фаъолияти мунтазами ҷисмонӣ, ҳатто агар мӯътадил бошад',
      'Хоби кофии мунтазам',
      'Обнӯшии кофии ҳаррӯза',
    ],
    body5: 'Пайгирии тиббӣ барои PCOS ба давра ё нишонаҳои гормонӣ маҳдуд намешавад. Вобаста ба профили шумо, мутахассиси соҳаи тиб инчунин метавонад баъзе нишондиҳандаҳои мубодилавиро назорат кунад, то омилҳои эҳтимолии хатарро барвақт муайян кунад.',
    medicalTitle: 'Пайгирӣ мутобиқ ба профили шумо',
    medicalSubtitle: 'Муоина барои ҳама якхела нест.',
    medicalDescription: 'Табиби шумо метавонад қарор диҳад, ки баъзе нишондиҳандаҳоро вобаста ба нишонаҳо, таърихи тиббӣ, вазъияти оилавӣ ва омилҳои дигари хатар санҷад.',
    medicalSectionTitle: 'Чӣ метавонад назорат шавад',
    medicalChecks: [
      'Қанди хун ва/ё HbA1c, вобаста ба замина',
      'Липидограмма (холестерин ва триглицеридҳо)',
      'Фишори хун ва арзёбии хатари дилу рагҳо',
      'Пайгирии вазн ва давраи камар, бе доварӣ',
    ],
    subH3: 'Вазъиятҳое, ки сазовори зикранд',
    body6: 'Баъзе тағйирот сазоворанд, ки ҳангоми машварат зикр шаванд, хусусан вақте ки онҳо нав, доимӣ ё барои шумо ғайриоддианд.',
    medicalFollowUp: [
      {title: 'Давраҳои хеле номунтазам', description: 'Ҳайзи хеле дурфосила ё пешгӯинашавандаро зикр кунед.'},
      {title: 'Ташнагӣ ё пешобкунии зуд-зуд', description: 'Ба табиби худ бигӯед, агар ин нишонаҳо ба таври ғайриоддӣ пайдо шаванд.'},
      {title: 'Тағйироти назарраси вазн', description: 'Тағйироти зуд ё беасос сазовори арзёбист.'},
      {title: 'Таърихи оилавӣ', description: 'Ҳар таърихи оилавии диабет ё ҳолатҳои мубодилавиро зикр кунед.'},
    ],
    alertTitle: 'Таваҷҷӯҳ кунед',
    alertText: 'Ташнагии ғайриоддӣ, пешобкунии зуд-зуд, хастагии доимӣ ё тағйироти назарраси беасоси вазнро бояд ба мутахассиси соҳаи тиб гуфт. Ин нишонаҳо метавонанд якчанд сабаб дошта бошанд ва худ ба худ муқовимати инсулин ё диабетро тасдиқ намекунанд.',
    followUpTipTitle: 'Пайгирӣ бо мурури замон сурат мегирад',
    followUpTipText: 'Табиби шумо метавонад ба ҷои муоинаи ягона санҷишҳои мунтазамро пешниҳод кунад. Мақсад мутобиқ кардани маслиҳат ва санҷишҳо ба пешрафти шумост, бидуни таваҷҷӯҳ танҳо ба вазн.',
    tip2Title: 'Донистан хуб аст',
    tip2Text: 'Вазн танҳо як қисми тасвири мубодилавӣ дар PCOS аст. Равиши ҷомеъ давраҳо, нишонаҳо, одатҳои тарзи зиндагӣ, таърихи тиббӣ ва нишондиҳандаҳои мубодилавиро ба назар мегирад.',
    shareMessage: 'Вазн, мубодилаи моддаҳо ва муқовимати инсулин — AWA',
  },
  ky: {
    badge: 'PCOS',
    title: 'Салмак, зат алмашуу жана\nинсулин каршылыгы',
    metaDuration: '6 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Орто',
    metaValidated: 'Текшерилген мазмун',
    intro: 'PCOS, салмак жана инсулин каршылыгынын ортосундагы байланыш — соттоосуз жана кыска жолдорсуз.',
    contentsTitle: 'Бул макалада',
    topics: [
      'PCOS менен зат алмашуунун ортосундагы байланыш',
      'Инсулин каршылыгын түшүнүү',
      'Салмак: эмне чын жана эмне чын эмес',
      'Тең салмактуулукту колдогон адаттар',
      'Медициналык көзөмөл качан пайдалуу',
      'Негизги жыйынтыктар',
    ],
    body1: 'PCOS көбүнчө зат алмашуудагы өзгөрүүлөр, анын ичинде инсулин каршылыгы менен байланышкан. Бирок бул байланыш ашыкча салмактуу аялдарга гана тиешелүү эмес — метаболизм профили адамдан адамга айырмаланат.',
    body2: 'Инсулин — клеткаларга кандагы глюкозаны колдонууга жардам берген гормон. Инсулин каршылыгында клеткалар бул гормонго азыраак жооп берет жана организм көбүрөөк инсулин өндүрүү менен компенсациялашы мүмкүн.',
    body3: 'PCOSто бул андроген өндүрүүнүн көбөйүшү менен байланышкан болушу мүмкүн жана айрым белгилерге салым кошушу мүмкүн. Бирок PCOS бар бардык аялдарда бирдей метаболизм профили болбойт.',
    tip1Title: 'Билүү пайдалуу',
    tip1Text: 'Дарыгер тиешелүү деп эсептегенде, инсулин каршылыгын кан анализдери аркылуу текшерсе болот. Анализдер керекпи — жеке абалыңызга көз каранды.',
    weightFacts: [
      'PCOS арыктан толуктугу бар аялдарга чейин ар кандай дене түзүлүшүндөгү аялдарга таасир этет.',
      'Салмак алуу системалуу эмес.',
      'Салмак жоготуу ар дайым зарыл эмес — же белгилерди жакшыртуу үчүн жалгыз жетиштүү эмес.',
      'Ашыкча салмак болгондо, бир аз салмак жоготуу кээде айрым метаболизм көрсөткүчтөрүн же циклдин үзгүлтүксүздүгүн жакшырта алат.',
    ],
    body4: 'Максат — «кемчиликсиз» салмакты кууп жетүү эмес, чыныгы, туруктуу адаттарды түзүү. Тең салмактуу тамактануу, кыймыл жана үзгүлтүксүз уйку жакшыраак метаболизм ден соолугуна салым кошо алат.',
    dailyHabits: [
      'Булага бай үзгүлтүксүз, ар түрдүү тамактар',
      'Орточо болсо да үзгүлтүксүз физикалык активдүүлүк',
      'Жетиштүү үзгүлтүксүз уйку',
      'Күнүмдүк жетиштүү суюктук ичүү',
    ],
    body5: 'PCOS үчүн медициналык көзөмөл циклге же гормондук белгилерге гана чектелбейт. Профилиңизге жараша ден соолук сактоо адиси мүмкүн болгон коркунуч факторлорун эрте аныктоого жардам берүү үчүн айрым метаболизм көрсөткүчтөрүн да көзөмөлдөшү мүмкүн.',
    medicalTitle: 'Профилиңизге ылайыкталган көзөмөл',
    medicalSubtitle: 'Текшерүү баарына бирдей эмес.',
    medicalDescription: 'Дарыгериңиз белгилериңизге, медициналык тарыхыңызга, үй-бүлөлүк абалыңызга жана башка коркунуч факторлоруна жараша айрым көрсөткүчтөрдү текшерүүнү чечиши мүмкүн.',
    medicalSectionTitle: 'Эмне көзөмөлдөнүшү мүмкүн',
    medicalChecks: [
      'Контекстке жараша кандагы кант жана/же HbA1c',
      'Липид панели (холестерин жана триглицериддер)',
      'Кан басымы жана жүрөк-кан тамыр коркунучун баалоо',
      'Соттоосуз салмакты жана бел айланасын көзөмөлдөө',
    ],
    subH3: 'Айтууга татыктуу абалдар',
    body6: 'Айрым өзгөрүүлөр консультация учурунда айтууга татыйт, айрыкча алар жаңы, улана берген же сиз үчүн адаттан тыш болсо.',
    medicalFollowUp: [
      {title: 'Абдан туура эмес циклдер', description: 'Абдан сейрек же болжолдонбогон етек киримди айтыңыз.'},
      {title: 'Суусоо же тез-тез заара кылуу', description: 'Бул белгилер адаттан тыш пайда болсо, дарыгериңиз менен сүйлөшүңүз.'},
      {title: 'Салмактын олуттуу өзгөрүшү', description: 'Тез же түшүндүрүлбөгөн өзгөрүү баалоого татыйт.'},
      {title: 'Үй-бүлөлүк тарых', description: 'Үй-бүлөдө диабеттин же метаболизм оорууларынын болушун айтыңыз.'},
    ],
    alertTitle: 'Көңүл буруңуз',
    alertText: 'Адаттан тыш суусоо, тез-тез заара кылуу, улана берген чарчоо же салмактын түшүндүрүлбөгөн олуттуу өзгөрүшү ден соолук сактоо адисине билдирилиши керек. Бул белгилердин бир нече себеби болушу мүмкүн жана алар өзү инсулин каршылыгын же диабетти ырастабайт.',
    followUpTipTitle: 'Көзөмөл убакыттын өтүшү менен жүрөт',
    followUpTipText: 'Дарыгериңиз бир жолку текшерүүнүн ордуна үзгүлтүксүз текшерүүлөрдү сунуштаса болот. Максат — жалаң салмакка көңүл бурбастан, кеңештерди жана анализдерди өнүгүшүңүзгө ыңгайлаштыруу.',
    tip2Title: 'Билүү пайдалуу',
    tip2Text: 'Салмак PCOSтогу метаболизм сүрөтүнүн бир бөлүгү гана. Комплекстүү ыкма циклдерди, белгилерди, жашоо образынын адаттарын, медициналык тарыхты жана метаболизм көрсөткүчтөрүн эске алат.',
    shareMessage: 'Салмак, зат алмашуу жана инсулин каршылыгы — AWA',
  },
  tk: {
    badge: 'PCOS',
    title: 'Agram, metabolizm we\ninsulin garşylygy',
    metaDuration: '6 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Orta',
    metaValidated: 'Barlanan mazmun',
    intro: 'PCOS, agram we insulin garşylygy arasyndaky baglanyşyk — höküm çykarman we gysga ýollar bolmazdan.',
    contentsTitle: 'Bu makalada',
    topics: [
      'PCOS bilen metabolizmiň arasyndaky baglanyşyk',
      'Insulin garşylygyny düşünmek',
      'Agram: nämäniň dogry, nämäniň däl',
      'Deňagramlylyga goldaw berýän endikler',
      'Lukmançylyk yzarlamasy haçan peýdaly',
      'Esasy netijeler',
    ],
    body1: 'PCOS köplenç insulin garşylygy ýaly metabolik üýtgeşmeler bilen baglanyşykly. Şeýle-de bolsa, bu baglanyşyk diňe artykmaç agramly aýallara degişli däl — metabolik profiller adamdan adama tapawutlanýar.',
    body2: 'Insulin öýjüklere gandaky glýukozany ulanmaga kömek edýän gormon. Insulin garşylygy bilen öýjükler bu gormona has erbet jogap berýär we beden has köp insulin öndürip kompensirlemäge synanyşyp biler.',
    body3: 'PCOS-da bu androgen öndürilişiniň artmagy bilen baglanyşykly bolup biler we käbir alamatlara goşant goşup biler. Emma PCOS-ly ähli aýallaryň metabolik profili şol bir däl.',
    tip1Title: 'Bilmek peýdaly',
    tip1Text: 'Insulin garşylygyny lukman degişli hasaplanda gan synaglary arkaly barlap bolýar. Synaglaryň zerurlygy şahsy ýagdaýyňyza bagly.',
    weightFacts: [
      'PCOS inçe bedenden agyr beden gurluşyna çenli ähli beden görnüşli aýallara täsir edýär.',
      'Agram goşmak yzygiderli däl.',
      'Agram ýitirmek alamatlary gowulandyrmak üçin hemişe zerur däl — ýa-da ýeke özi ýeterlik däl.',
      'Kiçijik agram ýitgisi artykmaç agram bar wagty käwagt käbir metabolik görkezijileri ýa-da sikl yzygiderliligini gowulandyryp biler.',
    ],
    body4: 'Maksat «kämil» agramy kowalamak däl-de, hakyky, dowamly endikleri gurmak. Deňagramly iýmitlenmek, hereket we yzygiderli uky has gowy metabolik saglyga goşant goşup biler.',
    dailyHabits: [
      'Süýümlige baý yzygiderli, dürli-dürli tagamlar',
      'Hatda ortaça bolsa-da yzygiderli fiziki işjeňlik',
      'Ýeterlik yzygiderli uky',
      'Gündelik ýeterlik suwlandyrmak',
    ],
    body5: 'PCOS üçin lukmançylyk yzarlamasy sikl ýa-da gormonal alamatlar bilen çäklenmeýär. Profiliňize görä, saglyk hünärmeniňiz mümkin howp faktorlaryny ir kesgitlemäge kömek etmek üçin käbir metabolik görkezijileri hem yzarlap biler.',
    medicalTitle: 'Profiliňize laýyk yzarlama',
    medicalSubtitle: 'Barlag hemmeler üçin şol bir däl.',
    medicalDescription: 'Lukmanyňyz alamatlaryňyza, lukmançylyk taryhyňyza, maşgala ýagdaýyňyza we beýleki howp faktorlaryna görä käbir görkezijileri barlamagy karar edip biler.',
    medicalSectionTitle: 'Nämäniň yzarlanyp biljekdigi',
    medicalChecks: [
      'Gandaky şeker we/ýa-da HbA1c, kontekste görä',
      'Lipid paneli (holesterin we triglýseridler)',
      'Gan basyşy we ýürek-damar howpuny bahalandyrma',
      'Agramy we bil töwereginiň ölçegini höküm çykarman yzarlamak',
    ],
    subH3: 'Bellemäge mynasyp ýagdaýlar',
    body6: 'Käbir üýtgeşmeler, aýratyn-da täze, dowamly ýa-da siz üçin adaty däl bolanda, maslahatlaşmak wagtynda bellemäge mynasyp.',
    medicalFollowUp: [
      {title: 'Gaty düzgünsiz sikller', description: 'Gaty seýrek ýa-da çaklanylmaýan aýbaşylary aýdyň.'},
      {title: 'Suwsuzlyk ýa-da ýygy peşew', description: 'Bu alamatlar adaty däl görnüşde peýda bolsa, lukmanyňyz bilen gürleşiň.'},
      {title: 'Möhüm agram üýtgemesi', description: 'Çalt ýa-da düşündirilmedik üýtgeşme bahalandyrylmaga mynasyp.'},
      {title: 'Maşgala taryhy', description: 'Diabetiň ýa-da metabolik ýagdaýlaryň islendik maşgala taryhyny aýdyň.'},
    ],
    alertTitle: 'Üns beriň',
    alertText: 'Adaty däl suwsuzlyk, ýygy peşew, dowamly ýadawlyk ýa-da agramdaky möhüm, düşündirilmedik üýtgeşme saglyk hünärmenine habar berilmeli. Bu alamatlaryň birnäçe sebäbi bolup biler we ýeke özi insulin garşylygyny ýa-da diabeti tassyklamaýar.',
    followUpTipTitle: 'Yzarlama wagtyň geçmegi bilen bolýar',
    followUpTipText: 'Lukmanyňyz ýeke barlagyň ýerine yzygiderli barlaglary teklip edip biler. Maksat ösüşiňize görä maslahatlary we synaglary uýgunlaşdyrmak, diňe agramda jemlenmän.',
    tip2Title: 'Bilmek peýdaly',
    tip2Text: 'PCOS-da agram metabolik suratyň diňe bir bölegi. Giňişleýin çemeleşme sikllerini, alamatlary, durmuş ýörelgesi endiklerini, lukmançylyk taryhyny we metabolik görkezijileri hasaba alýar.',
    shareMessage: 'Agram, metabolizm we insulin garşylygy — AWA',
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
