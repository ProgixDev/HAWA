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

const ID = 'menopause-comprendre-la-transition';

const HERO = require('../../assets/images/library/spm-sleep.png');

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const DAILY_HABIT_ICONS = [
  'bowl-mix-outline',
  'shoe-sneaker',
  'weather-night',
  'meditation',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('MenopauseTransition', {
  fr: {
    badge: 'PÉRIMÉNOPAUSE & MÉNOPAUSE',
    title: 'Comprendre la transition ménopausique',
    metaDuration: '10 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro:
      'Ce qui change progressivement, des années avant l’arrêt des règles, et comment aborder cette étape avec plus de clarté.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Périménopause et ménopause : les définitions',
      'Des cycles de plus en plus irréguliers',
      'Sommeil et humeur',
      'Vie intime et sécheresse vaginale',
      'Poids et métabolisme',
      'Idées reçues sur la ménopause',
      'Symptômes normaux et signaux à surveiller',
      'Conseils pratiques au quotidien',
      'À retenir',
    ],
    h1: '1. Périménopause et ménopause : les définitions',
    body1a:
      'La périménopause désigne la période de transition hormonale qui précède la ménopause : elle peut débuter plusieurs années avant, généralement à partir de la quarantaine, avec des niveaux d’œstrogènes qui fluctuent de façon irrégulière.',
    body1b:
      'La ménopause, elle, est un moment précis : elle est confirmée après 12 mois consécutifs sans règles, en l’absence d’autre cause. En France, elle survient en moyenne autour de 51 ans, mais cet âge varie naturellement d’une femme à l’autre.',
    tip1Title: 'Bon à savoir',
    tip1Text:
      'Chaque femme vit cette transition différemment, en durée comme en intensité des symptômes. En parler ouvertement aide à mieux l’anticiper.',
    h2: '2. Des cycles de plus en plus irréguliers',
    body2:
      'L’un des premiers signes de la périménopause est souvent un changement dans le rythme des cycles : ils peuvent devenir plus courts, plus longs, plus espacés, ou avec un flux différent d’un mois à l’autre.',
    alert1Title: 'À noter',
    alert1Text:
      'Des saignements très abondants, très rapprochés, ou survenant après un an sans règles justifient un avis médical, car ils ne sont pas considérés comme un signe habituel de la transition.',
    h3: '3. Sommeil et humeur',
    body3a:
      'La baisse et les fluctuations d’œstrogènes et de progestérone peuvent perturber le sommeil (endormissement, réveils nocturnes) et s’accompagner d’une irritabilité, d’une anxiété ou de sautes d’humeur inhabituelles.',
    body3b:
      'Ces changements ont une explication biologique réelle : ils ne traduisent ni un manque de volonté, ni un problème psychologique isolé.',
    h4: '4. Vie intime et sécheresse vaginale',
    body4:
      'La baisse d’œstrogènes peut entraîner une sécheresse vaginale, parfois source d’inconfort ou de douleurs pendant les rapports. Le désir peut aussi évoluer, à la hausse comme à la baisse, selon les femmes.',
    tip2Title: 'Bon à savoir',
    tip2Text:
      'Des solutions simples existent (lubrifiants, hydratants vaginaux, traitements locaux) : en parler à un professionnel de santé permet de trouver une réponse adaptée, sans tabou.',
    h5: '5. Poids et métabolisme',
    body5:
      'Le métabolisme peut ralentir légèrement pendant cette période, et la répartition des graisses a tendance à se déplacer vers l’abdomen. Ces changements sont courants et ne dépendent pas uniquement de la volonté.',
    h6: '6. Idées reçues sur la ménopause',
    myths: [
      'La ménopause « arrive d’un coup » — en réalité, elle est précédée de plusieurs années de transition (périménopause)',
      'Tous les symptômes sont sévères pour tout le monde — leur intensité varie énormément d’une femme à l’autre',
      'Rien ne peut être fait — de nombreuses solutions, hormonales ou non, existent pour soulager les symptômes gênants',
      'La vie intime s’arrête — elle évolue, mais reste tout à fait possible et épanouissante avec les bons ajustements',
    ],
    h7: '7. Symptômes normaux et signaux à surveiller',
    body7:
      'La grande majorité des changements décrits ici sont des manifestations normales de la transition. Certains signes méritent en revanche une consultation plus rapide.',
    alert2Title: 'Consulter si',
    alert2Text:
      'Saignements après la ménopause confirmée, douleurs pelviennes inhabituelles, symptômes qui perturbent fortement le quotidien, ou tout doute persistant.',
    h8: '8. Conseils pratiques au quotidien',
    dailyHabits: [
      'Une alimentation riche en calcium et fibres',
      'Une activité physique régulière',
      'Une routine de sommeil stable',
      'Des moments de détente au quotidien',
    ],
    h9: '9. À retenir',
    tip3Title: 'Bon à savoir',
    tip3Text:
      'La périménopause et la ménopause sont des étapes naturelles, pas une maladie. De nombreuses solutions existent pour traverser cette transition avec plus de confort : un professionnel de santé reste la meilleure ressource pour les adapter à ta situation.',
    shareMessage: 'Comprendre la transition ménopausique — AWA',
  },
  en: {
    badge: 'PERIMENOPAUSE & MENOPAUSE',
    title: 'Understanding the menopause transition',
    metaDuration: '10 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro:
      'What changes gradually, years before periods stop, and how to approach this stage with more clarity.',
    contentsTitle: 'In this article',
    topics: [
      'Perimenopause and menopause: definitions',
      'Increasingly irregular cycles',
      'Sleep and mood',
      'Intimacy and vaginal dryness',
      'Weight and metabolism',
      'Common myths about menopause',
      'Normal symptoms and signs to watch for',
      'Practical everyday tips',
      'Key takeaways',
    ],
    h1: '1. Perimenopause and menopause: definitions',
    body1a:
      'Perimenopause refers to the hormonal transition period that precedes menopause: it can begin several years earlier, generally from your forties onward, with estrogen levels fluctuating irregularly.',
    body1b:
      'Menopause, on the other hand, is a specific point in time: it is confirmed after 12 consecutive months without a period, with no other cause. In France, it occurs on average around age 51, though this age naturally varies from woman to woman.',
    tip1Title: 'Good to know',
    tip1Text:
      'Every woman experiences this transition differently, both in duration and in the intensity of symptoms. Talking about it openly helps you anticipate it better.',
    h2: '2. Increasingly irregular cycles',
    body2:
      'One of the first signs of perimenopause is often a change in cycle rhythm: cycles may become shorter, longer, more spaced out, or have a different flow from one month to the next.',
    alert1Title: 'Please note',
    alert1Text:
      'Very heavy bleeding, bleeding that occurs very close together, or bleeding that happens after a year without a period calls for medical advice, as these are not considered typical signs of the transition.',
    h3: '3. Sleep and mood',
    body3a:
      'The decline and fluctuations in estrogen and progesterone can disrupt sleep (falling asleep, waking during the night) and may be accompanied by irritability, anxiety, or unusual mood swings.',
    body3b:
      'These changes have a real biological explanation: they reflect neither a lack of willpower nor an isolated psychological problem.',
    h4: '4. Intimacy and vaginal dryness',
    body4:
      'The decline in estrogen can lead to vaginal dryness, sometimes causing discomfort or pain during intercourse. Desire can also change, either increasing or decreasing, depending on the woman.',
    tip2Title: 'Good to know',
    tip2Text:
      'Simple solutions exist (lubricants, vaginal moisturizers, local treatments): talking to a healthcare professional can help you find the right solution, without taboo.',
    h5: '5. Weight and metabolism',
    body5:
      'Metabolism can slow down slightly during this period, and fat distribution tends to shift toward the abdomen. These changes are common and do not depend solely on willpower.',
    h6: '6. Common myths about menopause',
    myths: [
      'Menopause "happens all at once" — in reality, it is preceded by several years of transition (perimenopause)',
      'All symptoms are severe for everyone — their intensity varies enormously from woman to woman',
      'Nothing can be done — many solutions, hormonal or not, exist to relieve bothersome symptoms',
      'Intimate life comes to an end — it changes, but remains entirely possible and fulfilling with the right adjustments',
    ],
    h7: '7. Normal symptoms and signs to watch for',
    body7:
      'The vast majority of the changes described here are normal manifestations of the transition. However, certain signs warrant prompt medical attention.',
    alert2Title: 'See a doctor if',
    alert2Text:
      'Bleeding after confirmed menopause, unusual pelvic pain, symptoms that significantly disrupt daily life, or any persistent doubt.',
    h8: '8. Practical everyday tips',
    dailyHabits: [
      'A diet rich in calcium and fiber',
      'Regular physical activity',
      'A stable sleep routine',
      'Daily moments of relaxation',
    ],
    h9: '9. Key takeaways',
    tip3Title: 'Good to know',
    tip3Text:
      'Perimenopause and menopause are natural stages, not an illness. Many solutions exist to help you go through this transition more comfortably: a healthcare professional remains the best resource to adapt them to your situation.',
    shareMessage: 'Understanding the menopause transition — AWA',
  },
  es: {
    badge: 'PERIMENOPAUSIA Y MENOPAUSIA',
    title: 'Entender la transición menopáusica',
    metaDuration: '10 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro:
      'Lo que cambia progresivamente, años antes de que cesen las reglas, y cómo abordar esta etapa con más claridad.',
    contentsTitle: 'En este artículo',
    topics: [
      'Perimenopausia y menopausia: las definiciones',
      'Ciclos cada vez más irregulares',
      'Sueño y estado de ánimo',
      'Vida íntima y sequedad vaginal',
      'Peso y metabolismo',
      'Ideas falsas sobre la menopausia',
      'Síntomas normales y señales a vigilar',
      'Consejos prácticos para el día a día',
      'Para recordar',
    ],
    h1: '1. Perimenopausia y menopausia: las definiciones',
    body1a:
      'La perimenopausia designa el periodo de transición hormonal que precede a la menopausia: puede empezar varios años antes, generalmente a partir de los cuarenta, con niveles de estrógenos que fluctúan de forma irregular.',
    body1b:
      'La menopausia, por su parte, es un momento preciso: se confirma después de 12 meses consecutivos sin regla, en ausencia de otra causa. En Francia, ocurre de media alrededor de los 51 años, aunque esta edad varía naturalmente de una mujer a otra.',
    tip1Title: 'DATO ÚTIL',
    tip1Text:
      'Cada mujer vive esta transición de forma diferente, tanto en duración como en intensidad de los síntomas. Hablar de ello abiertamente ayuda a anticiparla mejor.',
    h2: '2. Ciclos cada vez más irregulares',
    body2:
      'Una de las primeras señales de la perimenopausia suele ser un cambio en el ritmo de los ciclos: pueden volverse más cortos, más largos, más espaciados, o con un flujo diferente de un mes a otro.',
    alert1Title: 'A tener en cuenta',
    alert1Text:
      'Un sangrado muy abundante, muy seguido, o que ocurre después de un año sin regla, justifica un aviso médico, ya que no se consideran señales habituales de la transición.',
    h3: '3. Sueño y estado de ánimo',
    body3a:
      'La disminución y las fluctuaciones de estrógenos y progesterona pueden alterar el sueño (dificultad para dormirse, despertares nocturnos) y acompañarse de irritabilidad, ansiedad o cambios de humor inusuales.',
    body3b:
      'Estos cambios tienen una explicación biológica real: no reflejan ni una falta de voluntad ni un problema psicológico aislado.',
    h4: '4. Vida íntima y sequedad vaginal',
    body4:
      'La disminución de estrógenos puede provocar sequedad vaginal, a veces fuente de incomodidad o dolor durante las relaciones. El deseo también puede evolucionar, al alza o a la baja, según la mujer.',
    tip2Title: 'DATO ÚTIL',
    tip2Text:
      'Existen soluciones sencillas (lubricantes, hidratantes vaginales, tratamientos locales): hablarlo con un profesional de la salud permite encontrar una respuesta adecuada, sin tabúes.',
    h5: '5. Peso y metabolismo',
    body5:
      'El metabolismo puede ralentizarse ligeramente durante este periodo, y la distribución de la grasa tiende a desplazarse hacia el abdomen. Estos cambios son frecuentes y no dependen únicamente de la voluntad.',
    h6: '6. Ideas falsas sobre la menopausia',
    myths: [
      'La menopausia «llega de golpe» — en realidad, está precedida de varios años de transición (perimenopausia)',
      'Todos los síntomas son graves para todo el mundo — su intensidad varía enormemente de una mujer a otra',
      'No se puede hacer nada — existen numerosas soluciones, hormonales o no, para aliviar los síntomas molestos',
      'La vida íntima se detiene — evoluciona, pero sigue siendo totalmente posible y satisfactoria con los ajustes adecuados',
    ],
    h7: '7. Síntomas normales y señales a vigilar',
    body7:
      'La gran mayoría de los cambios descritos aquí son manifestaciones normales de la transición. Sin embargo, algunas señales merecen una consulta más rápida.',
    alert2Title: 'Consultar si',
    alert2Text:
      'Sangrado después de una menopausia confirmada, dolor pélvico inusual, síntomas que alteran fuertemente el día a día, o cualquier duda persistente.',
    h8: '8. Consejos prácticos para el día a día',
    dailyHabits: [
      'Una alimentación rica en calcio y fibra',
      'Una actividad física regular',
      'Una rutina de sueño estable',
      'Momentos de relajación en el día a día',
    ],
    h9: '9. Para recordar',
    tip3Title: 'DATO ÚTIL',
    tip3Text:
      'La perimenopausia y la menopausia son etapas naturales, no una enfermedad. Existen numerosas soluciones para atravesar esta transición con más comodidad: un profesional de la salud sigue siendo el mejor recurso para adaptarlas a tu situación.',
    shareMessage: 'Entender la transición menopáusica — AWA',
  },
  it: {
    badge: 'PERIMENOPAUSA E MENOPAUSA',
    title: 'Capire la transizione verso la menopausa',
    metaDuration: '10 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Cosa cambia gradualmente, anni prima che le mestruazioni si fermino, e come affrontare questa fase con più chiarezza.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Perimenopausa e menopausa: definizioni',
      'Cicli sempre più irregolari',
      'Sonno e umore',
      'Intimità e secchezza vaginale',
      'Peso e metabolismo',
      'Falsi miti comuni sulla menopausa',
      'Sintomi normali e segnali a cui prestare attenzione',
      'Consigli pratici per ogni giorno',
      'Punti chiave da ricordare',
    ],
    h1: '1. Perimenopausa e menopausa: definizioni',
    body1a: 'La perimenopausa indica il periodo di transizione ormonale che precede la menopausa: può iniziare diversi anni prima, in genere a partire dai quarant’anni, con livelli di estrogeni che fluttuano in modo irregolare.',
    body1b: 'La menopausa, invece, è un momento preciso: viene confermata dopo 12 mesi consecutivi senza mestruazioni, in assenza di altre cause. In Francia si verifica in media intorno ai 51 anni, anche se questa età varia naturalmente da donna a donna.',
    tip1Title: 'Bene a sapersi',
    tip1Text: 'Ogni donna vive questa transizione in modo diverso, sia per durata sia per intensità dei sintomi. Parlarne apertamente aiuta a prepararsi meglio.',
    h2: '2. Cicli sempre più irregolari',
    body2: 'Uno dei primi segni della perimenopausa è spesso un cambiamento del ritmo del ciclo: i cicli possono diventare più corti, più lunghi, più distanziati o avere un flusso diverso da un mese all’altro.',
    alert1Title: 'Attenzione',
    alert1Text: 'Un sanguinamento molto abbondante, un sanguinamento che si presenta a intervalli molto ravvicinati o un sanguinamento che compare dopo un anno senza mestruazioni richiede un parere medico, perché non sono considerati segni tipici della transizione.',
    h3: '3. Sonno e umore',
    body3a: 'Il calo e le fluttuazioni di estrogeni e progesterone possono disturbare il sonno (difficoltà ad addormentarsi, risvegli notturni) e possono essere accompagnati da irritabilità, ansia o insoliti sbalzi d’umore.',
    body3b: 'Questi cambiamenti hanno una reale spiegazione biologica: non dipendono da una mancanza di forza di volontà né da un problema psicologico isolato.',
    h4: '4. Intimità e secchezza vaginale',
    body4: 'Il calo degli estrogeni può causare secchezza vaginale, a volte con fastidio o dolore durante i rapporti. Anche il desiderio può cambiare, aumentando o diminuendo, a seconda della donna.',
    tip2Title: 'Bene a sapersi',
    tip2Text: 'Esistono soluzioni semplici (lubrificanti, idratanti vaginali, trattamenti locali): parlarne con un professionista sanitario può aiutarti a trovare quella giusta, senza tabù.',
    h5: '5. Peso e metabolismo',
    body5: 'Il metabolismo può rallentare leggermente in questo periodo e la distribuzione del grasso tende a spostarsi verso l’addome. Questi cambiamenti sono comuni e non dipendono solo dalla forza di volontà.',
    h6: '6. Falsi miti comuni sulla menopausa',
    myths: [
      'La menopausa «arriva tutta in una volta» — in realtà è preceduta da diversi anni di transizione (perimenopausa)',
      'Tutti i sintomi sono forti per tutte — la loro intensità varia enormemente da donna a donna',
      'Non c’è nulla da fare — esistono molte soluzioni, ormonali o no, per alleviare i sintomi fastidiosi',
      'La vita intima finisce — cambia, ma resta del tutto possibile e appagante con gli opportuni adattamenti',
    ],
    h7: '7. Sintomi normali e segnali a cui prestare attenzione',
    body7: 'La grande maggioranza dei cambiamenti descritti qui sono manifestazioni normali della transizione. Tuttavia, alcuni segnali richiedono un’attenzione medica tempestiva.',
    alert2Title: 'Rivolgiti a un medico se',
    alert2Text: 'Sanguinamento dopo la menopausa confermata, dolore pelvico insolito, sintomi che disturbano in modo significativo la vita quotidiana o qualsiasi dubbio persistente.',
    h8: '8. Consigli pratici per ogni giorno',
    dailyHabits: [
      'Un’alimentazione ricca di calcio e fibre',
      'Attività fisica regolare',
      'Una routine del sonno regolare',
      'Momenti di relax ogni giorno',
    ],
    h9: '9. Punti chiave da ricordare',
    tip3Title: 'Bene a sapersi',
    tip3Text: 'La perimenopausa e la menopausa sono fasi naturali, non una malattia. Esistono molte soluzioni per aiutarti ad attraversare questa transizione in modo più confortevole: un professionista sanitario resta la migliore risorsa per adattarle alla tua situazione.',
    shareMessage: 'Capire la transizione verso la menopausa — AWA',
  },
  tr: {
    badge: 'PERİMENOPOZ VE MENOPOZ',
    title: 'Menopoz geçişini anlamak',
    metaDuration: '10 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Adetler kesilmeden yıllar önce yavaş yavaş neyin değiştiği ve bu döneme daha net bir bakışla nasıl yaklaşabileceğin.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Perimenopoz ve menopoz: tanımlar',
      'Giderek düzensizleşen döngüler',
      'Uyku ve ruh hali',
      'Cinsel yakınlık ve vajinal kuruluk',
      'Kilo ve metabolizma',
      'Menopoz hakkında yaygın yanlış inanışlar',
      'Normal belirtiler ve dikkat edilecek işaretler',
      'Günlük hayat için pratik ipuçları',
      'Akılda tutulacaklar',
    ],
    h1: '1. Perimenopoz ve menopoz: tanımlar',
    body1a: 'Perimenopoz, menopozdan önce gelen hormonal geçiş dönemini ifade eder. Östrojen düzeyleri düzensiz biçimde dalgalanırken, bu dönem birkaç yıl önceden, genellikle kırklı yaşlardan itibaren başlayabilir.',
    body1b: 'Menopoz ise belirli bir zaman noktasıdır: başka bir neden olmaksızın art arda 12 ay adet görülmemesinin ardından doğrulanır. Fransa’da ortalama 51 yaş civarında görülür; ancak bu yaş kadından kadına doğal olarak değişir.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Her kadın bu geçişi hem süre hem de belirtilerin şiddeti açısından farklı yaşar. Bu konuda açıkça konuşmak, döneme daha iyi hazırlanmana yardımcı olur.',
    h2: '2. Giderek düzensizleşen döngüler',
    body2: 'Perimenopozun ilk belirtilerinden biri çoğu zaman döngü ritmindeki değişikliktir: döngüler kısalabilir, uzayabilir, daha aralıklı hale gelebilir ya da akış bir aydan diğerine farklılık gösterebilir.',
    alert1Title: 'Dikkat',
    alert1Text: 'Çok yoğun kanama, birbirine çok yakın aralıklarla gelen kanamalar ya da bir yıl adet görmedikten sonra ortaya çıkan kanama, geçişin tipik belirtileri sayılmadığı için tıbbi görüş almayı gerektirir.',
    h3: '3. Uyku ve ruh hali',
    body3a: 'Östrojen ve progesteronun azalması ve dalgalanması uykuyu bozabilir (uykuya dalma, gece uyanma) ve sinirlilik, kaygı ya da alışılmadık ruh hali değişimleriyle birlikte görülebilir.',
    body3b: 'Bu değişikliklerin gerçek bir biyolojik açıklaması vardır: ne irade eksikliğini ne de tek başına psikolojik bir sorunu yansıtırlar.',
    h4: '4. Cinsel yakınlık ve vajinal kuruluk',
    body4: 'Östrojenin azalması vajinal kuruluğa yol açabilir; bu da zaman zaman cinsel ilişki sırasında rahatsızlık veya ağrıya neden olabilir. İstek de kadından kadına değişerek artabilir ya da azalabilir.',
    tip2Title: 'Bilmekte fayda var',
    tip2Text: 'Basit çözümler mevcut (kayganlaştırıcılar, vajinal nemlendiriciler, lokal tedaviler): bir sağlık profesyoneliyle konuşmak, tabu olmadan sana uygun çözümü bulmana yardımcı olabilir.',
    h5: '5. Kilo ve metabolizma',
    body5: 'Bu dönemde metabolizma biraz yavaşlayabilir ve yağ dağılımı karın bölgesine doğru kayma eğilimi gösterir. Bu değişiklikler yaygındır ve yalnızca irade gücüne bağlı değildir.',
    h6: '6. Menopoz hakkında yaygın yanlış inanışlar',
    myths: [
      'Menopoz “bir anda olur” — aslında öncesinde birkaç yıllık bir geçiş (perimenopoz) vardır',
      'Belirtiler herkes için şiddetlidir — şiddetleri kadından kadına çok büyük farklılık gösterir',
      'Yapılabilecek bir şey yok — rahatsız edici belirtileri hafifletmek için hormonal olan ve olmayan birçok çözüm var',
      'Cinsel hayat sona erer — değişir, ancak doğru düzenlemelerle tamamen mümkün ve tatmin edici kalmaya devam eder',
    ],
    h7: '7. Normal belirtiler ve dikkat edilecek işaretler',
    body7: 'Burada anlatılan değişikliklerin büyük çoğunluğu, geçişin normal görünümleridir. Ancak bazı işaretler vakit kaybetmeden tıbbi değerlendirme gerektirir.',
    alert2Title: 'Şu durumlarda doktora başvur',
    alert2Text: 'Doğrulanmış menopozdan sonra kanama, alışılmadık pelvik ağrı, günlük hayatı belirgin biçimde bozan belirtiler ya da süregelen herhangi bir şüphe.',
    h8: '8. Günlük hayat için pratik ipuçları',
    dailyHabits: [
      'Kalsiyum ve lif bakımından zengin bir beslenme',
      'Düzenli fiziksel aktivite',
      'Sabit bir uyku düzeni',
      'Gün içinde rahatlama anları',
    ],
    h9: '9. Akılda tutulacaklar',
    tip3Title: 'Bilmekte fayda var',
    tip3Text: 'Perimenopoz ve menopoz doğal evrelerdir, bir hastalık değildir. Bu geçişi daha rahat atlatmana yardımcı olacak birçok çözüm var: bunları durumuna uyarlamak için en iyi kaynak bir sağlık profesyonelidir.',
    shareMessage: 'Menopoz geçişini anlamak — AWA',
  },
  ru: {
    badge: 'ПЕРИМЕНОПАУЗА И МЕНОПАУЗА',
    title: 'Как понять переход к менопаузе',
    metaDuration: '10 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro:
      'Что меняется постепенно, за годы до прекращения месячных, и как подойти к этому этапу с большей ясностью.',
    contentsTitle: 'В этой статье',
    topics: [
      'Перименопауза и менопауза: определения',
      'Всё более нерегулярные циклы',
      'Сон и настроение',
      'Интимная жизнь и сухость влагалища',
      'Вес и обмен веществ',
      'Распространённые мифы о менопаузе',
      'Нормальные симптомы и тревожные признаки',
      'Практические советы на каждый день',
      'Главное',
    ],
    h1: '1. Перименопауза и менопауза: определения',
    body1a:
      'Перименопауза — это период гормональной перестройки, который предшествует менопаузе: она может начаться за несколько лет до неё, как правило после сорока лет, при нерегулярных колебаниях уровня эстрогена.',
    body1b:
      'Менопауза же — это конкретный момент: о ней говорят после 12 месяцев подряд без месячных при отсутствии других причин. Во Франции она наступает в среднем около 51 года, хотя этот возраст, естественно, различается у разных женщин.',
    tip1Title: 'Полезно знать',
    tip1Text:
      'Каждая женщина переживает этот переход по-своему — и по продолжительности, и по выраженности симптомов. Открытый разговор об этом помогает лучше подготовиться.',
    h2: '2. Всё более нерегулярные циклы',
    body2:
      'Одним из первых признаков перименопаузы часто становится изменение ритма цикла: циклы могут становиться короче, длиннее, реже или отличаться по обильности выделений от месяца к месяцу.',
    alert1Title: 'Обратите внимание',
    alert1Text:
      'Очень обильные кровотечения, кровотечения, возникающие слишком часто, или кровотечение после года без месячных требуют консультации врача, поскольку не считаются типичными признаками этого перехода.',
    h3: '3. Сон и настроение',
    body3a:
      'Снижение и колебания уровня эстрогена и прогестерона могут нарушать сон (трудности с засыпанием, пробуждения среди ночи) и сопровождаться раздражительностью, тревогой или необычными перепадами настроения.',
    body3b:
      'У этих изменений есть реальное биологическое объяснение: они не говорят ни о недостатке силы воли, ни об отдельной психологической проблеме.',
    h4: '4. Интимная жизнь и сухость влагалища',
    body4:
      'Снижение уровня эстрогена может приводить к сухости влагалища, а иногда и к дискомфорту или боли во время полового акта. Желание также может меняться — как усиливаться, так и снижаться, в зависимости от женщины.',
    tip2Title: 'Полезно знать',
    tip2Text:
      'Существуют простые решения (лубриканты, увлажняющие средства для влагалища, местное лечение): разговор со медицинским специалистом поможет подобрать подходящее — без неловкости.',
    h5: '5. Вес и обмен веществ',
    body5:
      'В этот период обмен веществ может немного замедляться, а жир стремится перераспределяться в область живота. Такие изменения распространены и зависят не только от силы воли.',
    h6: '6. Распространённые мифы о менопаузе',
    myths: [
      'Менопауза «наступает сразу» — на самом деле ей предшествуют несколько лет перехода (перименопауза)',
      'Все симптомы тяжёлые у всех — их выраженность очень сильно различается у разных женщин',
      'Ничего нельзя сделать — существует множество гормональных и негормональных способов облегчить беспокоящие симптомы',
      'Интимная жизнь заканчивается — она меняется, но при соответствующих изменениях остаётся вполне возможной и полноценной',
    ],
    h7: '7. Нормальные симптомы и тревожные признаки',
    body7:
      'Подавляющее большинство описанных здесь изменений — нормальные проявления этого перехода. Однако некоторые признаки требуют срочного обращения к врачу.',
    alert2Title: 'Обратитесь к врачу, если',
    alert2Text:
      'Есть кровотечение после подтверждённой менопаузы, необычная боль в области таза, симптомы, значительно нарушающие повседневную жизнь, или любые не проходящие сомнения.',
    h8: '8. Практические советы на каждый день',
    dailyHabits: [
      'Питание, богатое кальцием и клетчаткой',
      'Регулярная физическая активность',
      'Стабильный режим сна',
      'Ежедневные минуты расслабления',
    ],
    h9: '9. Главное',
    tip3Title: 'Полезно знать',
    tip3Text:
      'Перименопауза и менопауза — естественные этапы, а не болезнь. Существует множество способов пройти этот переход комфортнее: медицинский специалист остаётся лучшим помощником в том, чтобы подобрать их под вашу ситуацию.',
    shareMessage: 'Как понять переход к менопаузе — AWA',
  },
  de: {
    badge: 'PERIMENOPAUSE & MENOPAUSE',
    title: 'Den Übergang in die Menopause verstehen',
    metaDuration: '10 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro:
      'Was sich schon Jahre vor dem Ausbleiben der Periode schrittweise verändert und wie du diese Lebensphase mit mehr Klarheit angehen kannst.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Perimenopause und Menopause: Begriffe',
      'Zunehmend unregelmäßige Zyklen',
      'Schlaf und Stimmung',
      'Intimität und Scheidentrockenheit',
      'Gewicht und Stoffwechsel',
      'Verbreitete Mythen über die Menopause',
      'Normale Symptome und Warnzeichen',
      'Praktische Tipps für den Alltag',
      'Das Wichtigste in Kürze',
    ],
    h1: '1. Perimenopause und Menopause: Begriffe',
    body1a:
      'Die Perimenopause bezeichnet die hormonelle Übergangszeit vor der Menopause: Sie kann mehrere Jahre früher beginnen, in der Regel ab den Vierzigern, wobei der Östrogenspiegel unregelmäßig schwankt.',
    body1b:
      'Die Menopause dagegen ist ein bestimmter Zeitpunkt: Sie wird nach 12 aufeinanderfolgenden Monaten ohne Periode festgestellt, wenn es keine andere Ursache gibt. In Frankreich tritt sie im Durchschnitt um das 51. Lebensjahr ein, wobei dieses Alter von Frau zu Frau natürlicherweise variiert.',
    tip1Title: 'Gut zu wissen',
    tip1Text:
      'Jede Frau erlebt diesen Übergang anders, sowohl in der Dauer als auch in der Stärke der Symptome. Offen darüber zu sprechen hilft dir, dich besser darauf einzustellen.',
    h2: '2. Zunehmend unregelmäßige Zyklen',
    body2:
      'Eines der ersten Anzeichen der Perimenopause ist oft eine Veränderung des Zyklusrhythmus: Zyklen können kürzer, länger oder weiter auseinander liegen, oder die Blutung kann sich von Monat zu Monat unterscheiden.',
    alert1Title: 'Bitte beachten',
    alert1Text:
      'Sehr starke Blutungen, Blutungen in sehr kurzen Abständen oder Blutungen nach einem Jahr ohne Periode erfordern ärztlichen Rat, da sie nicht als typische Anzeichen des Übergangs gelten.',
    h3: '3. Schlaf und Stimmung',
    body3a:
      'Der Rückgang und die Schwankungen von Östrogen und Progesteron können den Schlaf stören (Einschlafen, Aufwachen in der Nacht) und mit Reizbarkeit, Angst oder ungewohnten Stimmungsschwankungen einhergehen.',
    body3b:
      'Diese Veränderungen haben eine echte biologische Erklärung: Sie sind weder ein Zeichen mangelnder Willenskraft noch ein isoliertes psychisches Problem.',
    h4: '4. Intimität und Scheidentrockenheit',
    body4:
      'Der Rückgang des Östrogens kann zu Scheidentrockenheit führen und manchmal Beschwerden oder Schmerzen beim Geschlechtsverkehr verursachen. Auch das Verlangen kann sich verändern, je nach Frau stärker oder schwächer werden.',
    tip2Title: 'Gut zu wissen',
    tip2Text:
      'Es gibt einfache Lösungen (Gleitmittel, vaginale Feuchtigkeitsmittel, lokale Behandlungen): Ein Gespräch mit medizinischem Fachpersonal kann dir helfen, die passende Lösung zu finden – ohne Tabu.',
    h5: '5. Gewicht und Stoffwechsel',
    body5:
      'Der Stoffwechsel kann sich in dieser Zeit leicht verlangsamen, und das Fett verteilt sich tendenziell stärker auf den Bauch. Diese Veränderungen sind häufig und hängen nicht allein von der Willenskraft ab.',
    h6: '6. Verbreitete Mythen über die Menopause',
    myths: [
      'Die Menopause „kommt von heute auf morgen“ – in Wirklichkeit gehen ihr mehrere Jahre des Übergangs (Perimenopause) voraus',
      'Alle Symptome sind bei allen schwer – ihre Stärke ist von Frau zu Frau sehr unterschiedlich',
      'Man kann nichts tun – es gibt viele Lösungen, hormonelle und nicht-hormonelle, die belastende Symptome lindern können',
      'Das intime Leben ist vorbei – es verändert sich, bleibt aber mit den richtigen Anpassungen vollkommen möglich und erfüllend',
    ],
    h7: '7. Normale Symptome und Warnzeichen',
    body7:
      'Die allermeisten der hier beschriebenen Veränderungen sind normale Erscheinungen des Übergangs. Bestimmte Anzeichen sollten jedoch zeitnah ärztlich abgeklärt werden.',
    alert2Title: 'Geh zu einer Ärztin oder einem Arzt, wenn',
    alert2Text:
      'Blutungen nach bestätigter Menopause, ungewöhnliche Schmerzen im Beckenbereich, Symptome, die deinen Alltag deutlich beeinträchtigen, oder anhaltende Zweifel auftreten.',
    h8: '8. Praktische Tipps für den Alltag',
    dailyHabits: [
      'Eine kalzium- und ballaststoffreiche Ernährung',
      'Regelmäßige Bewegung',
      'Eine feste Schlafroutine',
      'Tägliche Momente der Entspannung',
    ],
    h9: '9. Das Wichtigste in Kürze',
    tip3Title: 'Gut zu wissen',
    tip3Text:
      'Perimenopause und Menopause sind natürliche Lebensphasen, keine Krankheit. Es gibt viele Möglichkeiten, diesen Übergang angenehmer zu erleben: Medizinisches Fachpersonal bleibt die beste Anlaufstelle, um sie an deine Situation anzupassen.',
    shareMessage: 'Den Übergang in die Menopause verstehen – AWA',
  },
  zh: {
      badge: '围绝经期与绝经',
      title: '了解绝经过渡期',
      metaDuration: '阅读约 10 分钟',
      metaType: '指南',
      metaLevel: '入门',
      metaValidated: '已审阅内容',
      intro: '在月经停止前的数年里，身体会逐渐发生哪些变化，以及如何更清晰地面对这一阶段。',
      contentsTitle: '本文内容',
      topics: [
        '围绝经期与绝经：定义',
        '越来越不规律的周期',
        '睡眠与情绪',
        '亲密生活与阴道干涩',
        '体重与代谢',
        '关于绝经的常见误解',
        '正常症状与需要留意的信号',
        '日常实用小建议',
        '要点回顾',
      ],
      h1: '1. 围绝经期与绝经：定义',
      body1a: '围绝经期是指绝经之前的激素过渡阶段：它可能提前数年开始，通常从四十岁左右起，雌激素水平会不规则地波动。',
      body1b: '绝经则是一个明确的时间点：在连续 12 个月没有月经、且没有其他原因的情况下才能确认。在法国，平均绝经年龄约为 51 岁，但这个年龄因人而异。',
      tip1Title: '小贴士',
      tip1Text: '每位女性经历这一过渡期的方式都不同，无论是持续时间还是症状的强度。坦然地谈论它，有助于你更好地做好准备。',
      h2: '2. 越来越不规律的周期',
      body2: '围绝经期最早的信号之一，往往是周期节奏的变化：周期可能变短、变长、间隔更远，或者每个月的经量都不一样。',
      alert1Title: '请注意',
      alert1Text: '经量非常大、出血间隔非常近，或者在停经一年后又出血，都需要寻求医疗建议，因为这些不属于过渡期的典型表现。',
      h3: '3. 睡眠与情绪',
      body3a: '雌激素和孕激素的下降与波动可能扰乱睡眠（入睡困难、夜间醒来），并可能伴随易怒、焦虑或异常的情绪波动。',
      body3b: '这些变化有真实的生物学原因：它们既不是意志力不足，也不是单纯的心理问题。',
      h4: '4. 亲密生活与阴道干涩',
      body4: '雌激素下降可能导致阴道干涩，有时会在性生活中造成不适或疼痛。性欲也可能发生变化，有的人增强，有的人减弱，因人而异。',
      tip2Title: '小贴士',
      tip2Text: '有一些简单的办法（润滑剂、阴道保湿剂、局部治疗）：和医疗专业人员聊一聊，可以帮你找到合适的方案，不必有顾虑。',
      h5: '5. 体重与代谢',
      body5: '这一时期代谢可能会略微减慢，脂肪分布也倾向于向腹部集中。这些变化很常见，并不单单取决于意志力。',
      h6: '6. 关于绝经的常见误解',
      myths: [
        '绝经“是突然发生的”——实际上，在此之前会有数年的过渡期（围绝经期）',
        '所有人的症状都很严重——症状的强度因人而异，差别很大',
        '什么都做不了——有许多方法，无论是激素类还是非激素类，都可以缓解令人困扰的症状',
        '亲密生活就此结束——它会发生变化，但只要适当调整，依然完全可能并且令人满足',
      ],
      h7: '7. 正常症状与需要留意的信号',
      body7: '这里描述的绝大多数变化都是过渡期的正常表现。不过，有些信号需要及时就医。',
      alert2Title: '出现以下情况请就医',
      alert2Text: '确认绝经后出血、异常的盆腔疼痛、明显影响日常生活的症状，或任何持续存在的疑虑。',
      h8: '8. 日常实用小建议',
      dailyHabits: [
        '富含钙和膳食纤维的饮食',
        '规律的体育活动',
        '稳定的睡眠作息',
        '每天留出放松的时间',
      ],
      h9: '9. 要点回顾',
      tip3Title: '小贴士',
      tip3Text: '围绝经期和绝经是自然的阶段，而不是疾病。有许多办法可以帮你更舒适地度过这一过渡期：医疗专业人员仍然是最好的依靠，可以根据你的情况做出调整。',
      shareMessage: '了解绝经过渡期 — AWA',
    },
  id: {
    badge: 'PERIMENOPAUSE & MENOPAUSE',
    title: 'Memahami masa transisi menopause',
    metaDuration: '10 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Apa saja yang berubah secara bertahap, bertahun-tahun sebelum haid berhenti, dan bagaimana menjalani tahap ini dengan lebih jelas.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Perimenopause dan menopause: definisi',
      'Siklus yang makin tidak teratur',
      'Tidur dan suasana hati',
      'Keintiman dan vagina kering',
      'Berat badan dan metabolisme',
      'Mitos umum tentang menopause',
      'Gejala normal dan tanda yang perlu diwaspadai',
      'Tips praktis sehari-hari',
      'Poin-poin penting',
    ],
    h1: '1. Perimenopause dan menopause: definisi',
    body1a: 'Perimenopause adalah masa transisi hormonal yang mendahului menopause: bisa dimulai beberapa tahun sebelumnya, umumnya sejak usia empat puluhan, dengan kadar estrogen yang naik turun tidak teratur.',
    body1b: 'Menopause, sebaliknya, adalah satu titik waktu tertentu: dipastikan setelah 12 bulan berturut-turut tanpa haid, tanpa penyebab lain. Di Prancis, menopause terjadi rata-rata sekitar usia 51 tahun, meskipun usia ini tentu berbeda dari satu perempuan ke perempuan lain.',
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Setiap perempuan mengalami transisi ini dengan cara yang berbeda, baik dari segi lama maupun intensitas gejalanya. Membicarakannya secara terbuka membantumu mengantisipasinya dengan lebih baik.',
    h2: '2. Siklus yang makin tidak teratur',
    body2: 'Salah satu tanda pertama perimenopause sering kali perubahan ritme siklus: siklus bisa menjadi lebih pendek, lebih panjang, lebih jarang, atau memiliki aliran darah yang berbeda dari satu bulan ke bulan berikutnya.',
    alert1Title: 'Harap diperhatikan',
    alert1Text: 'Perdarahan yang sangat banyak, perdarahan yang terjadi dengan jarak sangat dekat, atau perdarahan yang terjadi setelah satu tahun tanpa haid memerlukan saran medis, karena hal-hal ini tidak dianggap sebagai tanda khas masa transisi.',
    h3: '3. Tidur dan suasana hati',
    body3a: 'Penurunan dan fluktuasi estrogen serta progesteron dapat mengganggu tidur (sulit tertidur, terbangun di malam hari) dan bisa disertai mudah tersinggung, cemas, atau perubahan suasana hati yang tidak biasa.',
    body3b: 'Perubahan ini punya penjelasan biologis yang nyata: perubahan ini bukan cerminan kurangnya kemauan ataupun masalah psikologis yang berdiri sendiri.',
    h4: '4. Keintiman dan vagina kering',
    body4: 'Penurunan estrogen dapat menyebabkan vagina kering, yang kadang menimbulkan rasa tidak nyaman atau nyeri saat berhubungan intim. Hasrat juga bisa berubah, meningkat atau menurun, tergantung pada tiap perempuan.',
    tip2Title: 'Perlu diketahui',
    tip2Text: 'Ada solusi sederhana (pelumas, pelembap vagina, pengobatan lokal): berbicara dengan tenaga kesehatan bisa membantumu menemukan solusi yang tepat, tanpa tabu.',
    h5: '5. Berat badan dan metabolisme',
    body5: 'Metabolisme bisa sedikit melambat pada masa ini, dan distribusi lemak cenderung bergeser ke area perut. Perubahan ini umum terjadi dan tidak hanya bergantung pada kemauan.',
    h6: '6. Mitos umum tentang menopause',
    myths: [
      'Menopause "terjadi sekaligus" — kenyataannya, menopause didahului beberapa tahun masa transisi (perimenopause)',
      'Semua gejala berat bagi setiap orang — intensitasnya sangat bervariasi dari satu perempuan ke perempuan lain',
      'Tidak ada yang bisa dilakukan — banyak solusi, hormonal maupun non-hormonal, untuk meredakan gejala yang mengganggu',
      'Kehidupan intim berakhir — memang berubah, tetapi tetap sepenuhnya mungkin dan memuaskan dengan penyesuaian yang tepat',
    ],
    h7: '7. Gejala normal dan tanda yang perlu diwaspadai',
    body7: 'Sebagian besar perubahan yang dijelaskan di sini adalah manifestasi normal dari masa transisi. Namun, beberapa tanda memerlukan perhatian medis segera.',
    alert2Title: 'Temui dokter jika',
    alert2Text: 'Perdarahan setelah menopause terkonfirmasi, nyeri panggul yang tidak biasa, gejala yang sangat mengganggu kehidupan sehari-hari, atau keraguan yang menetap.',
    h8: '8. Tips praktis sehari-hari',
    dailyHabits: [
      'Pola makan kaya kalsium dan serat',
      'Aktivitas fisik secara teratur',
      'Rutinitas tidur yang stabil',
      'Momen relaksasi setiap hari',
    ],
    h9: '9. Poin-poin penting',
    tip3Title: 'Perlu diketahui',
    tip3Text: 'Perimenopause dan menopause adalah tahapan alami, bukan penyakit. Banyak solusi yang bisa membantumu menjalani transisi ini dengan lebih nyaman: tenaga kesehatan tetap menjadi sumber terbaik untuk menyesuaikannya dengan situasimu.',
    shareMessage: 'Memahami masa transisi menopause — AWA',
  },
  hi: {
    badge: 'पेरिमेनोपॉज़ और मेनोपॉज़',
    title: 'मेनोपॉज़ की ओर बदलाव को समझना',
    metaDuration: '10 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'शुरुआती',
    metaValidated: 'समीक्षा किया गया लेख',
    intro: 'पीरियड्स बंद होने से कई साल पहले धीरे-धीरे क्या बदलता है, और इस पड़ाव को ज़्यादा स्पष्टता से कैसे समझें।',
    contentsTitle: 'इस लेख में',
    topics: [
      'पेरिमेनोपॉज़ और मेनोपॉज़: परिभाषाएँ',
      'बढ़ते हुए अनियमित चक्र',
      'नींद और मूड',
      'अंतरंगता और वजाइनल सूखापन',
      'वज़न और मेटाबॉलिज़्म',
      'मेनोपॉज़ के बारे में आम भ्रांतियाँ',
      'सामान्य लक्षण और ध्यान देने योग्य संकेत',
      'रोज़मर्रा के व्यावहारिक सुझाव',
      'मुख्य बातें',
    ],
    h1: '1. पेरिमेनोपॉज़ और मेनोपॉज़: परिभाषाएँ',
    body1a: 'पेरिमेनोपॉज़ उस हार्मोनल बदलाव की अवधि को कहते हैं जो मेनोपॉज़ (रजोनिवृत्ति) से पहले आती है: यह कई साल पहले शुरू हो सकती है, आम तौर पर चालीस की उम्र के आसपास से, जब एस्ट्रोजन का स्तर अनियमित रूप से घटता-बढ़ता है।',
    body1b: 'मेनोपॉज़, इसके विपरीत, एक ख़ास बिंदु है: इसकी पुष्टि तब होती है जब किसी और कारण के बिना लगातार 12 महीने तक पीरियड न आए। फ़्रांस में यह औसतन लगभग 51 साल की उम्र में होता है, हालाँकि यह उम्र हर महिला में स्वाभाविक रूप से अलग होती है।',
    tip1Title: 'जानना अच्छा है',
    tip1Text: 'हर महिला इस बदलाव को अलग तरह से अनुभव करती है, अवधि में भी और लक्षणों की तीव्रता में भी। इस पर खुलकर बात करने से आप इसके लिए बेहतर तैयार हो पाती हैं।',
    h2: '2. बढ़ते हुए अनियमित चक्र',
    body2: 'पेरिमेनोपॉज़ के पहले संकेतों में से एक अक्सर चक्र की लय में बदलाव होता है: चक्र छोटे, लंबे या ज़्यादा अंतराल वाले हो सकते हैं, या एक महीने से दूसरे महीने में उनका फ़्लो अलग हो सकता है।',
    alert1Title: 'ध्यान दें',
    alert1Text: 'बहुत ज़्यादा रक्तस्राव, बहुत जल्दी-जल्दी होने वाला रक्तस्राव, या एक साल तक पीरियड न आने के बाद होने वाला रक्तस्राव, डॉक्टरी सलाह की माँग करता है, क्योंकि इन्हें इस बदलाव के सामान्य संकेत नहीं माना जाता।',
    h3: '3. नींद और मूड',
    body3a: 'एस्ट्रोजन और प्रोजेस्टेरोन का घटना और उतार-चढ़ाव नींद में खलल डाल सकता है (नींद आने में दिक़्क़त, रात में जाग जाना) और इसके साथ चिड़चिड़ापन, घबराहट या असामान्य मूड स्विंग भी हो सकते हैं।',
    body3b: 'इन बदलावों की एक असली जैविक वजह है: ये न इच्छाशक्ति की कमी दिखाते हैं और न कोई अलग-थलग मानसिक समस्या।',
    h4: '4. अंतरंगता और वजाइनल सूखापन',
    body4: 'एस्ट्रोजन घटने से वजाइनल सूखापन हो सकता है, जिससे कभी-कभी संबंध बनाते समय असुविधा या दर्द होता है। इच्छा भी बदल सकती है, किसी में बढ़ सकती है तो किसी में घट सकती है।',
    tip2Title: 'जानना अच्छा है',
    tip2Text: 'आसान उपाय मौजूद हैं (लुब्रिकेंट, वजाइनल मॉइस्चराइज़र, स्थानीय उपचार): किसी स्वास्थ्य विशेषज्ञ से बात करने से बिना झिझक सही उपाय खोजने में मदद मिल सकती है।',
    h5: '5. वज़न और मेटाबॉलिज़्म',
    body5: 'इस दौरान मेटाबॉलिज़्म थोड़ा धीमा हो सकता है, और चर्बी का वितरण पेट की ओर खिसकने लगता है। ये बदलाव आम हैं और सिर्फ़ इच्छाशक्ति पर निर्भर नहीं करते।',
    h6: '6. मेनोपॉज़ के बारे में आम भ्रांतियाँ',
    myths: [
      'मेनोपॉज़ "अचानक एक साथ आ जाता है" — असल में उससे पहले कई सालों का बदलाव (पेरिमेनोपॉज़) होता है',
      'सभी लक्षण हर किसी के लिए गंभीर होते हैं — उनकी तीव्रता हर महिला में बहुत अलग होती है',
      'कुछ नहीं किया जा सकता — परेशान करने वाले लक्षणों से राहत के लिए हार्मोनल और ग़ैर-हार्मोनल, कई उपाय मौजूद हैं',
      'अंतरंग जीवन ख़त्म हो जाता है — वह बदलता है, लेकिन सही बदलावों के साथ पूरी तरह संभव और संतोषजनक बना रहता है',
    ],
    h7: '7. सामान्य लक्षण और ध्यान देने योग्य संकेत',
    body7: 'यहाँ बताए गए ज़्यादातर बदलाव इस पड़ाव की सामान्य अभिव्यक्तियाँ हैं। फिर भी, कुछ संकेतों पर जल्द डॉक्टरी ध्यान ज़रूरी है।',
    alert2Title: 'डॉक्टर को दिखाएँ अगर',
    alert2Text: 'पक्के तौर पर मेनोपॉज़ हो जाने के बाद रक्तस्राव हो, पेल्विक में असामान्य दर्द हो, लक्षण रोज़मर्रा की ज़िंदगी में काफ़ी रुकावट डालें, या कोई भी संदेह बना रहे।',
    h8: '8. रोज़मर्रा के व्यावहारिक सुझाव',
    dailyHabits: [
      'कैल्शियम और फ़ाइबर से भरपूर आहार',
      'नियमित शारीरिक गतिविधि',
      'नींद का स्थिर रूटीन',
      'रोज़ाना आराम के कुछ पल',
    ],
    h9: '9. मुख्य बातें',
    tip3Title: 'जानना अच्छा है',
    tip3Text: 'पेरिमेनोपॉज़ और मेनोपॉज़ प्राकृतिक पड़ाव हैं, बीमारी नहीं। इस बदलाव से ज़्यादा आराम से गुज़रने में मदद करने वाले कई उपाय मौजूद हैं: उन्हें आपकी स्थिति के अनुसार ढालने के लिए स्वास्थ्य विशेषज्ञ ही सबसे अच्छा सहारा हैं।',
    shareMessage: 'मेनोपॉज़ की ओर बदलाव को समझना — AWA',
  },
  sq: {
    badge: 'PERIMENOPAUZA & MENOPAUZA',
    title: 'Të kuptojmë tranzicionin drejt menopauzës',
    metaDuration: '10 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Çfarë ndryshon gradualisht, vite përpara se të ndalojnë menstruacionet, dhe si ta përballosh këtë etapë me më shumë qartësi.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Perimenopauza dhe menopauza: përkufizime',
      'Cikle gjithnjë e më të parregullta',
      'Gjumi dhe gjendja shpirtërore',
      'Intimiteti dhe thatësia vaginale',
      'Pesha dhe metabolizmi',
      'Mite të zakonshme për menopauzën',
      'Simptoma normale dhe shenja për t’u vëzhguar',
      'Këshilla praktike për çdo ditë',
      'Në pak fjalë',
    ],
    h1: '1. Perimenopauza dhe menopauza: përkufizime',
    body1a: 'Perimenopauza është periudha e tranzicionit hormonal që i paraprin menopauzës: mund të fillojë disa vite më parë, zakonisht nga të dyzetat, me nivele të estrogjenit që luhaten në mënyrë të parregullt.',
    body1b: 'Menopauza, nga ana tjetër, është një çast i caktuar në kohë: konfirmohet pas 12 muajsh të njëpasnjëshëm pa menstruacione, pa ndonjë shkak tjetër. Në Francë, ajo ndodh mesatarisht rreth moshës 51 vjeç, megjithëse kjo moshë ndryshon natyrshëm nga një grua te tjetra.',
    tip1Title: 'Mirë është ta dish',
    tip1Text: 'Çdo grua e jeton këtë tranzicion ndryshe, si në kohëzgjatje ashtu edhe në intensitetin e simptomave. Të flasësh hapur për të të ndihmon ta parashikosh më mirë.',
    h2: '2. Cikle gjithnjë e më të parregullta',
    body2: 'Një nga shenjat e para të perimenopauzës është shpesh ndryshimi i ritmit të ciklit: ciklet mund të bëhen më të shkurtra, më të gjata, më të rralla ose me rrjedhje të ndryshme nga një muaj te tjetri.',
    alert1Title: 'Mos harro',
    alert1Text: 'Gjakderdhja shumë e bollshme, gjakderdhja që vjen shumë afër njëra-tjetrës ose gjakderdhja që ndodh pas një viti pa menstruacione kërkon këshillë mjekësore, pasi këto nuk konsiderohen shenja tipike të tranzicionit.',
    h3: '3. Gjumi dhe gjendja shpirtërore',
    body3a: 'Rënia dhe luhatjet e estrogjenit dhe të progesteronit mund ta prishin gjumin (zënien e gjumit, zgjimet gjatë natës) dhe mund të shoqërohen me nervozizëm, ankth ose ndryshime të pazakonta të gjendjes shpirtërore.',
    body3b: 'Këto ndryshime kanë një shpjegim real biologjik: ato nuk pasqyrojnë mungesë vullneti dhe as një problem psikologjik të izoluar.',
    h4: '4. Intimiteti dhe thatësia vaginale',
    body4: 'Rënia e estrogjenit mund të çojë në thatësi vaginale, që ndonjëherë shkakton parehati ose dhimbje gjatë marrëdhënieve. Edhe dëshira mund të ndryshojë, duke u rritur ose duke u ulur, sipas gruas.',
    tip2Title: 'Mirë është ta dish',
    tip2Text: 'Ekzistojnë zgjidhje të thjeshta (lubrifikantë, hidratues vaginalë, trajtime lokale): të flasësh me një profesionist të shëndetësisë mund të të ndihmojë të gjesh zgjidhjen e duhur, pa tabu.',
    h5: '5. Pesha dhe metabolizmi',
    body5: 'Metabolizmi mund të ngadalësohet pak gjatë kësaj periudhe dhe shpërndarja e yndyrës priret të zhvendoset drejt barkut. Këto ndryshime janë të zakonshme dhe nuk varen vetëm nga vullneti.',
    h6: '6. Mite të zakonshme për menopauzën',
    myths: [
      'Menopauza “vjen menjëherë” — në fakt, ajo paraprihet nga disa vite tranzicioni (perimenopauza)',
      'Të gjitha simptomat janë të rënda për çdo grua — intensiteti i tyre ndryshon shumë nga një grua te tjetra',
      'Nuk mund të bëhet asgjë — ekzistojnë shumë zgjidhje, hormonale ose jo, për të lehtësuar simptomat e bezdisshme',
      'Jeta intime mbaron — ajo ndryshon, por mbetet plotësisht e mundshme dhe e plotë me përshtatjet e duhura',
    ],
    h7: '7. Simptoma normale dhe shenja për t’u vëzhguar',
    body7: 'Shumica dërrmuese e ndryshimeve të përshkruara këtu janë shfaqje normale të tranzicionit. Megjithatë, disa shenja kërkojnë vëmendje të shpejtë mjekësore.',
    alert2Title: 'Shko te mjeku nëse',
    alert2Text: 'Gjakderdhje pas menopauzës së konfirmuar, dhimbje e pazakontë në legen, simptoma që e prishin ndjeshëm jetën e përditshme, ose çdo dyshim i vazhdueshëm.',
    h8: '8. Këshilla praktike për çdo ditë',
    dailyHabits: [
      'Një ushqyerje e pasur me kalcium dhe fibra',
      'Aktivitet fizik i rregullt',
      'Një rutinë e qëndrueshme gjumi',
      'Çaste çlodhjeje çdo ditë',
    ],
    h9: '9. Në pak fjalë',
    tip3Title: 'Mirë është ta dish',
    tip3Text: 'Perimenopauza dhe menopauza janë etapa natyrore, jo sëmundje. Ekzistojnë shumë zgjidhje që të ndihmojnë ta kalosh këtë tranzicion më rehat: një profesionist i shëndetësisë mbetet burimi më i mirë për t’i përshtatur me situatën tënde.',
    shareMessage: 'Të kuptojmë tranzicionin e menopauzës — AWA',
  },
  ja: {
    badge: '更年期への移行期と閉経',
    title: '更年期への移行を理解する',
    metaDuration: '読了時間10分',
    metaType: 'ガイド',
    metaLevel: '初級',
    metaValidated: '確認済みコンテンツ',
    intro: '生理が止まる何年も前から少しずつ変わっていくことと、この時期をより明確な見通しで迎えるための解説です。',
    contentsTitle: 'この記事の内容',
    topics: [
      '更年期への移行期と閉経：定義',
      'だんだん不規則になる周期',
      '睡眠と気分',
      '性生活と腟の乾燥',
      '体重と代謝',
      '閉経にまつわるよくある誤解',
      'ふつうの症状と注意すべきサイン',
      '毎日の実践的なヒント',
      '重要なポイント',
    ],
    h1: '1. 更年期への移行期と閉経：定義',
    body1a: '更年期への移行期（ペリメノポーズ）とは、閉経の前に訪れるホルモンの移行期間のことです。数年前から始まることがあり、一般的には40代から、エストロゲンの値が不規則に変動します。',
    body1b: '一方、閉経は特定の時点を指します。ほかに原因がなく、生理が12か月連続でないことで確定します。フランスでは平均しておよそ51歳で迎えますが、この年齢は女性によって自然に異なります。',
    tip1Title: '知っておきたいこと',
    tip1Text: 'この移行は、期間も症状の強さも、女性によってそれぞれ異なります。オープンに話すことで、より心づもりをしやすくなります。',
    h2: '2. だんだん不規則になる周期',
    body2: '更年期への移行期の最初のサインの一つは、周期のリズムの変化であることが多いです。周期が短くなったり、長くなったり、間隔が空いたり、月ごとに経血量が変わったりすることがあります。',
    alert1Title: 'ご注意ください',
    alert1Text: 'とても多い出血、ごく短い間隔で起こる出血、生理がない状態が1年続いたあとの出血は、この移行期の典型的なサインとは考えられないため、医師に相談しましょう。',
    h3: '3. 睡眠と気分',
    body3a: 'エストロゲンとプロゲステロンの低下や変動は、睡眠（寝つき、夜中に目が覚めること）を妨げることがあり、いらだち、不安、いつもと違う気分の波を伴うこともあります。',
    body3b: 'これらの変化には、生物学的な裏づけがあります。意志の弱さや、単独の心理的な問題の表れではありません。',
    h4: '4. 性生活と腟の乾燥',
    body4: 'エストロゲンの低下により、腟が乾燥し、性交時に不快感や痛みを感じることがあります。性欲も、女性によって高まったり低くなったりと変化することがあります。',
    tip2Title: '知っておきたいこと',
    tip2Text: '簡単な解決策があります（潤滑ゼリー、腟用の保湿剤、局所的な治療）。医療従事者に相談すると、タブー視せずに合う方法を見つけられます。',
    h5: '5. 体重と代謝',
    body5: 'この時期には、代謝がわずかに落ち、脂肪のつき方がおなかまわりに移りやすくなります。これらの変化はよくあることで、意志の力だけで左右されるものではありません。',
    h6: '6. 閉経にまつわるよくある誤解',
    myths: [
      '閉経は「一度に起こる」。実際には、その前に何年もの移行期（更年期への移行期）があります',
      '症状はすべての人で重い。強さは女性によって大きく異なります',
      'できることは何もない。つらい症状をやわらげるために、ホルモンを使うものも使わないものも、多くの方法があります',
      '性生活は終わる。変化はしますが、適切な工夫をすれば、十分に続けられ、満たされたものになります',
    ],
    h7: '7. ふつうの症状と注意すべきサイン',
    body7: 'ここで説明した変化の大部分は、移行期のふつうの現れです。ただし、早めに医師に診てもらうべきサインもあります。',
    alert2Title: '次の場合は医師に相談してください',
    alert2Text: '閉経が確定したあとの出血、いつもと違う骨盤の痛み、日常生活を大きく妨げる症状、または疑問が続く場合。',
    h8: '8. 毎日の実践的なヒント',
    dailyHabits: [
      'カルシウムと食物繊維が豊富な食事',
      '定期的な運動',
      '安定した睡眠リズム',
      '毎日のリラックスの時間',
    ],
    h9: '9. 重要なポイント',
    tip3Title: '知っておきたいこと',
    tip3Text: '更年期への移行期と閉経は自然な段階であり、病気ではありません。この移行をより快適に過ごすための方法は数多くあります。ご自身の状況に合わせるには、医療従事者が最も頼りになります。',
    shareMessage: '更年期への移行を理解する — AWA',
  },
  ko: {
    badge: '폐경 이행기와 폐경',
    title: '폐경 이행기 이해하기',
    metaDuration: '10분 읽기',
    metaType: '가이드',
    metaLevel: '입문',
    metaValidated: '검토된 콘텐츠',
    intro: '생리가 멈추기 몇 년 전부터 서서히 달라지는 것들과, 이 시기를 더 분명하게 맞이하는 방법을 알아봐요.',
    contentsTitle: '이 아티클에서 다루는 내용',
    topics: [
      '폐경 이행기와 폐경: 정의',
      '점점 불규칙해지는 주기',
      '수면과 기분',
      '친밀한 관계와 질 건조',
      '체중과 대사',
      '폐경에 대한 흔한 오해',
      '정상적인 증상과 주의해야 할 신호',
      '일상에서의 실용적인 팁',
      '핵심 정리',
    ],
    h1: '1. 폐경 이행기와 폐경: 정의',
    body1a: '폐경 이행기는 폐경 전에 찾아오는 호르몬 변화의 시기를 말해요. 몇 년 전부터 시작될 수 있으며, 일반적으로 40대부터 에스트로겐 수치가 불규칙하게 오르내려요.',
    body1b: '반면 폐경은 특정한 시점이에요. 다른 원인 없이 생리가 12개월 연속으로 없을 때 확정돼요. 프랑스에서는 평균 51세 무렵에 나타나지만, 이 나이는 여성마다 자연스럽게 달라요.',
    tip1Title: '알아 두면 좋아요',
    tip1Text: '이 시기를 겪는 방식은 기간도, 증상의 강도도 여성마다 달라요. 터놓고 이야기하면 더 잘 대비하는 데 도움이 돼요.',
    h2: '2. 점점 불규칙해지는 주기',
    body2: '폐경 이행기의 첫 신호 중 하나는 주기의 리듬이 달라지는 거예요. 주기가 짧아지거나, 길어지거나, 간격이 벌어지거나, 달마다 출혈량이 달라질 수 있어요.',
    alert1Title: '참고해 주세요',
    alert1Text: '출혈량이 매우 많거나, 출혈이 아주 가까운 간격으로 나타나거나, 1년 동안 생리가 없다가 출혈이 생기는 경우에는 이 시기의 전형적인 신호로 보지 않으므로 의학적인 조언이 필요해요.',
    h3: '3. 수면과 기분',
    body3a: '에스트로겐과 프로게스테론이 줄어들고 오르내리면 수면(잠들기, 밤중에 깨기)이 방해받을 수 있고, 짜증, 불안, 평소와 다른 기분 변화가 함께 나타날 수 있어요.',
    body3b: '이런 변화에는 실제로 생물학적인 이유가 있어요. 의지가 부족해서도 아니고, 따로 떨어진 심리적 문제여서도 아니에요.',
    h4: '4. 친밀한 관계와 질 건조',
    body4: '에스트로겐이 줄면 질이 건조해져서 성관계 때 불편함이나 통증이 생길 수 있어요. 성욕도 여성에 따라 늘거나 줄어드는 등 달라질 수 있어요.',
    tip2Title: '알아 두면 좋아요',
    tip2Text: '윤활제, 질 보습제, 국소 치료처럼 간단한 해결책이 있어요. 의료 전문가와 터놓고 이야기하면 맞는 방법을 찾는 데 도움이 돼요.',
    h5: '5. 체중과 대사',
    body5: '이 시기에는 대사가 조금 느려질 수 있고, 지방이 복부 쪽으로 더 쌓이는 경향이 있어요. 이런 변화는 흔하며 의지만으로 좌우되지 않아요.',
    h6: '6. 폐경에 대한 흔한 오해',
    myths: [
      '폐경은 “한꺼번에 찾아온다” — 실제로는 몇 년에 걸친 이행기(폐경 이행기)가 먼저 와요',
      '누구나 모든 증상이 심하다 — 증상의 강도는 여성마다 매우 달라요',
      '할 수 있는 일이 없다 — 불편한 증상을 덜어 주는 호르몬 요법과 비호르몬 요법이 많이 있어요',
      '친밀한 생활이 끝난다 — 달라지지만, 알맞게 조정하면 충분히 가능하고 만족스러울 수 있어요',
    ],
    h7: '7. 정상적인 증상과 주의해야 할 신호',
    body7: '여기서 설명한 변화의 대부분은 이 시기의 정상적인 모습이에요. 다만 몇 가지 신호는 빨리 진료를 받아야 해요.',
    alert2Title: '이럴 때는 의사를 만나세요',
    alert2Text: '폐경이 확정된 뒤의 출혈, 평소와 다른 골반 통증, 일상생활을 크게 방해하는 증상, 또는 계속되는 의문이 있을 때예요.',
    h8: '8. 일상에서의 실용적인 팁',
    dailyHabits: [
      '칼슘과 식이섬유가 풍부한 식단',
      '규칙적인 신체 활동',
      '안정적인 수면 루틴',
      '매일 갖는 편안한 휴식 시간',
    ],
    h9: '9. 핵심 정리',
    tip3Title: '알아 두면 좋아요',
    tip3Text: '폐경 이행기와 폐경은 질병이 아니라 자연스러운 단계예요. 이 시기를 더 편안하게 지나도록 돕는 방법이 많이 있으며, 내 상황에 맞게 조정하는 데는 의료 전문가가 가장 좋은 도움이 돼요.',
    shareMessage: '폐경 이행기 이해하기 — AWA',
  },
  'pt-PT': {
    badge: 'PERIMENOPAUSA E MENOPAUSA',
    title: 'Compreender a transição para a menopausa',
    metaDuration: '10 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'O que muda gradualmente, anos antes de os períodos cessarem, e como encarar esta fase com mais clareza.',
    contentsTitle: 'Neste artigo',
    topics: [
      'Perimenopausa e menopausa: definições',
      'Ciclos cada vez mais irregulares',
      'Sono e humor',
      'Intimidade e secura vaginal',
      'Peso e metabolismo',
      'Mitos comuns sobre a menopausa',
      'Sintomas normais e sinais a vigiar',
      'Dicas práticas para o dia a dia',
      'Pontos essenciais',
    ],
    h1: '1. Perimenopausa e menopausa: definições',
    body1a: 'A perimenopausa designa o período de transição hormonal que antecede a menopausa: pode começar vários anos antes, geralmente a partir dos quarenta anos, com os níveis de estrogénio a oscilar de forma irregular.',
    body1b: 'A menopausa, por sua vez, é um momento preciso: é confirmada após 12 meses consecutivos sem período, sem outra causa. Em França, ocorre em média por volta dos 51 anos, embora esta idade varie naturalmente de mulher para mulher.',
    tip1Title: 'Bom saber',
    tip1Text: 'Cada mulher vive esta transição de forma diferente, tanto na duração como na intensidade dos sintomas. Falar abertamente sobre o assunto ajuda a antecipá-la melhor.',
    h2: '2. Ciclos cada vez mais irregulares',
    body2: 'Um dos primeiros sinais da perimenopausa é muitas vezes uma alteração do ritmo do ciclo: os ciclos podem tornar-se mais curtos, mais longos, mais espaçados, ou ter um fluxo diferente de um mês para o outro.',
    alert1Title: 'Atenção',
    alert1Text: 'Uma hemorragia muito abundante, hemorragias que ocorrem muito próximas umas das outras ou uma hemorragia que surge depois de um ano sem período exigem aconselhamento médico, pois não são consideradas sinais típicos da transição.',
    h3: '3. Sono e humor',
    body3a: 'A diminuição e as oscilações do estrogénio e da progesterona podem perturbar o sono (adormecer, acordar durante a noite) e podem ser acompanhadas de irritabilidade, ansiedade ou alterações de humor incomuns.',
    body3b: 'Estas alterações têm uma explicação biológica real: não refletem falta de força de vontade nem um problema psicológico isolado.',
    h4: '4. Intimidade e secura vaginal',
    body4: 'A diminuição do estrogénio pode provocar secura vaginal, causando por vezes desconforto ou dor durante as relações sexuais. O desejo também pode mudar, aumentando ou diminuindo, consoante a mulher.',
    tip2Title: 'Bom saber',
    tip2Text: 'Existem soluções simples (lubrificantes, hidratantes vaginais, tratamentos locais): falar com um profissional de saúde pode ajudar a encontrar a solução certa, sem tabus.',
    h5: '5. Peso e metabolismo',
    body5: 'O metabolismo pode abrandar ligeiramente durante este período e a distribuição da gordura tende a deslocar-se para o abdómen. Estas alterações são frequentes e não dependem apenas da força de vontade.',
    h6: '6. Mitos comuns sobre a menopausa',
    myths: [
      'A menopausa “acontece de uma só vez” — na realidade, é precedida por vários anos de transição (perimenopausa)',
      'Todos os sintomas são graves para todas as mulheres — a sua intensidade varia enormemente de mulher para mulher',
      'Não há nada a fazer — existem muitas soluções, hormonais ou não, para aliviar os sintomas incómodos',
      'A vida íntima acaba — muda, mas continua a ser inteiramente possível e satisfatória com os ajustes certos',
    ],
    h7: '7. Sintomas normais e sinais a vigiar',
    body7: 'A grande maioria das alterações aqui descritas são manifestações normais da transição. No entanto, certos sinais justificam atenção médica rápida.',
    alert2Title: 'Consulte um médico se',
    alert2Text: 'Hemorragia após menopausa confirmada, dor pélvica fora do comum, sintomas que perturbam significativamente o quotidiano, ou qualquer dúvida persistente.',
    h8: '8. Dicas práticas para o dia a dia',
    dailyHabits: [
      'Uma alimentação rica em cálcio e fibra',
      'Atividade física regular',
      'Uma rotina de sono estável',
      'Momentos diários de relaxamento',
    ],
    h9: '9. Pontos essenciais',
    tip3Title: 'Bom saber',
    tip3Text: 'A perimenopausa e a menopausa são etapas naturais, não uma doença. Existem muitas soluções para ajudar a atravessar esta transição de forma mais confortável: um profissional de saúde continua a ser o melhor recurso para as adaptar à sua situação.',
    shareMessage: 'Compreender a transição para a menopausa — AWA',
  },
  bn: {
    badge: 'মেনোপজ-পূর্ব পর্যায় ও মেনোপজ',
    title: 'মেনোপজে উত্তরণ বোঝা',
    metaDuration: 'পড়তে 10 মিনিট',
    metaType: 'গাইড',
    metaLevel: 'প্রাথমিক',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'মাসিক বন্ধ হওয়ার কয়েক বছর আগে থেকে ধীরে ধীরে কী পরিবর্তন হয়, এবং এই পর্যায়কে আরও স্পষ্টভাবে কীভাবে মোকাবিলা করবেন।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'মেনোপজ-পূর্ব পর্যায় ও মেনোপজ: সংজ্ঞা',
      'ক্রমশ আরও অনিয়মিত চক্র',
      'ঘুম ও মেজাজ',
      'ঘনিষ্ঠতা ও যোনিপথের শুষ্কতা',
      'ওজন ও বিপাক',
      'মেনোপজ নিয়ে প্রচলিত ভুল ধারণা',
      'স্বাভাবিক উপসর্গ এবং যেসব লক্ষণে সতর্ক হবেন',
      'প্রতিদিনের ব্যবহারিক পরামর্শ',
      'মূল কথা',
    ],
    h1: '1. মেনোপজ-পূর্ব পর্যায় (পেরিমেনোপজ) ও মেনোপজ: সংজ্ঞা',
    body1a: 'মেনোপজ-পূর্ব পর্যায় (পেরিমেনোপজ) হলো মেনোপজের আগের হরমোনজনিত উত্তরণকাল: এটি কয়েক বছর আগে শুরু হতে পারে, সাধারণত চল্লিশের কোঠা থেকে, যখন ইস্ট্রোজেনের মাত্রা অনিয়মিতভাবে ওঠানামা করে।',
    body1b: 'অন্যদিকে মেনোপজ একটি নির্দিষ্ট সময়বিন্দু: অন্য কোনো কারণ ছাড়া টানা 12 মাস মাসিক না হলে এটি নিশ্চিত হয়। ফ্রান্সে এটি গড়ে প্রায় 51 বছর বয়সে ঘটে, তবে এই বয়স স্বাভাবিকভাবেই একজন নারী থেকে আরেকজনে ভিন্ন হয়।',
    tip1Title: 'জেনে রাখা ভালো',
    tip1Text: 'প্রত্যেক নারী এই উত্তরণ ভিন্নভাবে অনুভব করেন, সময়কাল এবং উপসর্গের তীব্রতা দুই দিক থেকেই। এ নিয়ে খোলামেলা কথা বললে আপনি এর জন্য আরও ভালোভাবে প্রস্তুত হতে পারবেন।',
    h2: '2. ক্রমশ আরও অনিয়মিত চক্র',
    body2: 'মেনোপজ-পূর্ব পর্যায়ের প্রথম লক্ষণগুলোর একটি প্রায়ই চক্রের ছন্দে পরিবর্তন: চক্র ছোট বা লম্বা হতে পারে, আরও ফাঁকে ফাঁকে হতে পারে, বা এক মাস থেকে পরের মাসে রক্তক্ষরণের পরিমাণ ভিন্ন হতে পারে।',
    alert1Title: 'মনে রাখবেন',
    alert1Text: 'খুব বেশি রক্তক্ষরণ, খুব কাছাকাছি সময়ে রক্তক্ষরণ, অথবা এক বছর মাসিক না হওয়ার পর রক্তক্ষরণ হলে চিকিৎসকের পরামর্শ নেওয়া প্রয়োজন, কারণ এগুলো উত্তরণের সাধারণ লক্ষণ হিসেবে গণ্য হয় না।',
    h3: '3. ঘুম ও মেজাজ',
    body3a: 'ইস্ট্রোজেন ও প্রোজেস্টেরনের হ্রাস ও ওঠানামা ঘুমে ব্যাঘাত ঘটাতে পারে (ঘুম আসতে দেরি, রাতে জেগে ওঠা) এবং এর সঙ্গে খিটখিটে ভাব, উদ্বেগ বা অস্বাভাবিক মেজাজের পরিবর্তন দেখা দিতে পারে।',
    body3b: 'এই পরিবর্তনগুলোর একটি প্রকৃত জৈবিক ব্যাখ্যা রয়েছে: এগুলো ইচ্ছাশক্তির অভাব বা কোনো বিচ্ছিন্ন মানসিক সমস্যার প্রতিফলন নয়।',
    h4: '4. ঘনিষ্ঠতা ও যোনিপথের শুষ্কতা',
    body4: 'ইস্ট্রোজেন কমে গেলে যোনিপথ শুষ্ক হতে পারে, যা কখনো কখনো সহবাসের সময় অস্বস্তি বা ব্যথার কারণ হয়। আকাঙ্ক্ষাও বদলাতে পারে, নারীভেদে বাড়তে বা কমতে পারে।',
    tip2Title: 'জেনে রাখা ভালো',
    tip2Text: 'সহজ সমাধান আছে (লুব্রিকেন্ট, যোনিপথের ময়েশ্চারাইজার, স্থানীয় চিকিৎসা): স্বাস্থ্যসেবা পেশাজীবীর সঙ্গে কথা বললে কোনো সংকোচ ছাড়াই উপযুক্ত সমাধান খুঁজে পেতে পারেন।',
    h5: '5. ওজন ও বিপাক',
    body5: 'এই সময়ে বিপাক কিছুটা ধীর হতে পারে এবং চর্বি জমার ধরন পেটের দিকে সরে যাওয়ার প্রবণতা থাকে। এই পরিবর্তনগুলো সাধারণ এবং শুধু ইচ্ছাশক্তির ওপর নির্ভর করে না।',
    h6: '6. মেনোপজ নিয়ে প্রচলিত ভুল ধারণা',
    myths: [
      'মেনোপজ “হঠাৎ করে ঘটে” — বাস্তবে এর আগে কয়েক বছরের উত্তরণকাল (মেনোপজ-পূর্ব পর্যায়) থাকে',
      'সবার জন্য সব উপসর্গ তীব্র — নারীভেদে এর তীব্রতা অনেক ভিন্ন হয়',
      'কিছুই করার নেই — বিরক্তিকর উপসর্গ উপশমের জন্য হরমোনভিত্তিক বা অন্যান্য অনেক সমাধান আছে',
      'ঘনিষ্ঠ জীবন শেষ হয়ে যায় — এটি বদলায়, কিন্তু সঠিক সমন্বয়ে সম্পূর্ণ সম্ভব ও পরিতৃপ্তিদায়ক থাকে',
    ],
    h7: '7. স্বাভাবিক উপসর্গ এবং যেসব লক্ষণে সতর্ক হবেন',
    body7: 'এখানে বর্ণিত পরিবর্তনগুলোর বেশিরভাগই উত্তরণের স্বাভাবিক প্রকাশ। তবে কিছু লক্ষণে দ্রুত চিকিৎসকের মনোযোগ প্রয়োজন।',
    alert2Title: 'যেসব ক্ষেত্রে ডাক্তার দেখাবেন',
    alert2Text: 'নিশ্চিত মেনোপজের পর রক্তক্ষরণ, অস্বাভাবিক তলপেটের ব্যথা, দৈনন্দিন জীবনে উল্লেখযোগ্য ব্যাঘাত ঘটায় এমন উপসর্গ, অথবা কোনো স্থায়ী সন্দেহ।',
    h8: '8. প্রতিদিনের ব্যবহারিক পরামর্শ',
    dailyHabits: [
      'ক্যালসিয়াম ও আঁশসমৃদ্ধ খাদ্য',
      'নিয়মিত শারীরিক কার্যকলাপ',
      'স্থির ঘুমের রুটিন',
      'প্রতিদিন শিথিল হওয়ার কিছু মুহূর্ত',
    ],
    h9: '9. মূল কথা',
    tip3Title: 'জেনে রাখা ভালো',
    tip3Text: 'মেনোপজ-পূর্ব পর্যায় ও মেনোপজ প্রাকৃতিক ধাপ, কোনো অসুখ নয়। এই উত্তরণ আরও স্বাচ্ছন্দ্যে পার করতে সাহায্য করার মতো অনেক সমাধান আছে: সেগুলো আপনার অবস্থার সঙ্গে মানিয়ে নিতে স্বাস্থ্যসেবা পেশাজীবীই সবচেয়ে ভালো সহায়ক।',
    shareMessage: 'মেনোপজে উত্তরণ বোঝা — AWA',
  },
  da: {
    badge: 'PERIMENOPAUSE & MENOPAUSE',
    title: 'Forstå overgangsalderen',
    metaDuration: '10 min læsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemset indhold',
    intro:
      'Hvad der gradvist ændrer sig i de år, der går, inden menstruationen ophører, og hvordan du kan møde denne fase med mere klarhed.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Perimenopause og menopause: definitioner',
      'Stadig mere uregelmæssige cyklusser',
      'Søvn og humør',
      'Intimliv og vaginal tørhed',
      'Vægt og stofskifte',
      'Myter om menopause',
      'Normale symptomer og tegn at holde øje med',
      'Praktiske hverdagstips',
      'Hvad du kan tage med dig',
    ],
    h1: '1. Perimenopause og menopause: definitioner',
    body1a:
      'Perimenopause betegner den hormonelle overgangsperiode, der går forud for menopausen: den kan begynde flere år tidligere, typisk fra 40-årsalderen, hvor østrogenniveauet svinger uregelmæssigt.',
    body1b:
      'Menopause er derimod et bestemt tidspunkt: det bekræftes efter 12 sammenhængende måneder uden menstruation og uden anden årsag. Det sker gennemsnitligt omkring 51-årsalderen, men dette tidspunkt varierer naturligt fra kvinde til kvinde.',
    tip1Title: 'Godt at vide',
    tip1Text:
      'Alle kvinder oplever denne overgang forskelligt – både i varighed og i intensiteten af symptomerne. At tale åbent om det hjælper dig med at forberede dig bedre.',
    h2: '2. Stadig mere uregelmæssige cyklusser',
    body2:
      'Et af de første tegn på perimenopause er ofte en ændring i cyklussens rytme: den kan blive kortere, længere, mere spredt eller have et forskelligt blødningsmønster fra måned til måned.',
    alert1Title: 'Bemærk',
    alert1Text:
      'Meget kraftige blødninger, blødninger tæt på hinanden eller blødning efter et år uden menstruation kræver lægelig vurdering, da disse ikke betragtes som normale tegn på overgangen.',
    h3: '3. Søvn og humør',
    body3a:
      'Fald og udsving i østrogen og progesteron kan forstyrre søvnen (indsovningsbesvær, natlige opvågninger) og ledsages af irritabilitet, angst eller usædvanlige humørsvingninger.',
    body3b:
      'Disse ændringer har en reel biologisk forklaring: de afspejler hverken manglende viljestyrke eller et isoleret psykologisk problem.',
    h4: '4. Intimliv og vaginal tørhed',
    body4:
      'Faldet i østrogen kan føre til vaginal tørhed, som sommetider giver ubehag eller smerter ved samleje. Lysten kan også ændre sig – op eller ned – afhængigt af den enkelte kvinde.',
    tip2Title: 'Godt at vide',
    tip2Text:
      'Der findes enkle løsninger (glidecreme, vaginale fugtighedsprodukter, lokalbehandling): at tale med en sundhedsprofessionel hjælper dig med at finde den rette løsning – uden tabu.',
    h5: '5. Vægt og stofskifte',
    body5:
      'Stofskiftet kan bremses en smule i denne periode, og fedtfordelingen har tendens til at flytte sig mod maven. Disse ændringer er almindelige og afhænger ikke udelukkende af viljestyrke.',
    h6: '6. Myter om menopause',
    myths: [
      'Menopausen "sker pludseligt" – i virkeligheden går der flere år med overgang (perimenopause) forud',
      'Alle har kraftige symptomer – intensiteten varierer enormt fra kvinde til kvinde',
      'Der er intet at gøre – der findes mange løsninger, hormonelle eller ej, til at lindre generende symptomer',
      'Intimlivet er forbi – det ændrer sig, men er fuldt muligt og tilfredsstillende med de rette tilpasninger',
    ],
    h7: '7. Normale symptomer og tegn at holde øje med',
    body7:
      'Langt de fleste ændringer beskrevet her er normale udtryk for overgangen. Visse tegn kræver dog hurtig lægelig opmærksomhed.',
    alert2Title: 'Gå til læge hvis',
    alert2Text:
      'Blødning efter bekræftet menopause, usædvanlige bækkensmerter, symptomer der markant forstyrrer dagliglivet, eller vedvarende tvivl.',
    h8: '8. Praktiske hverdagstips',
    dailyHabits: [
      'En kost rig på calcium og kostfibre',
      'Regelmæssig fysisk aktivitet',
      'En stabil søvnrutine',
      'Daglige øjeblikke med afslapning',
    ],
    h9: '9. Hvad du kan tage med dig',
    tip3Title: 'Godt at vide',
    tip3Text:
      'Perimenopause og menopause er naturlige faser, ikke sygdomme. Der findes mange løsninger til at gøre denne overgang mere behagelig: en sundhedsprofessionel er den bedste samtalepartner til at tilpasse dem til din situation.',
    shareMessage: 'Forstå overgangsalderen — AWA',
  },
  sv: {
    badge: 'PERIMENOPAUSE & MENOPAUSE',
    title: 'Forstå overgangsalderen',
    metaDuration: '10 min läsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemset indhold',
    intro:
      'Hvad der gradvist ändrer sig i de år, der går, inden menstruationen ophörer, och hvordan du kan möde denne fase med mere klarhed.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Perimenopause och menopause: definitioner',
      'Stadig mere uregelmässige cyklusser',
      'Sövn och humör',
      'Intimliv och vaginal törhed',
      'Vägt och stofskifte',
      'Myter om menopause',
      'Normale symtom och tegn at holde öje med',
      'Praktiske hverdagstips',
      'Hvad du kan tage med dig',
    ],
    h1: '1. Perimenopause och menopause: definitioner',
    body1a:
      'Perimenopause betegner den hormonelle overgangsperiode, der går forud for menopausen: den kan begynde flere år tidligere, typisk fran 40-årsalderen, hvor östrogenniveauet svinger uregelmässigt.',
    body1b:
      'Menopause ar derimod et bestemt tidspunkt: det bekräftes efter 12 sammenhängende måneder uden menstruation och uden anden årsag. Det sker gennemsnitligt omkring 51-årsalderen, men dette tidspunkt varierer naturligt fran kvinna till kvinde.',
    tip1Title: 'Godt at vide',
    tip1Text:
      'Alla kvinnor oplever denne overgang forskelligt – både i varighed och i intensiteten av symtomne. At tale åbent om det hjälper dig med at forberede dig bedre.',
    h2: '2. Stadig mere uregelmässige cyklusser',
    body2:
      'Et av de förste tegn på perimenopause ar ofta en ändring i cyklussens rytme: den kan blive kortere, längere, mere spredt eller have et forskelligt blödningsmönster fran måned till måned.',
    alert1Title: 'Bemärk',
    alert1Text:
      'Meget kraftige blödninger, blödninger tät på hinanden eller blödning efter et år uden menstruation kräver lägelig vurdering, da disse inte betragtes som normale tegn på overgangen.',
    h3: '3. Sövn och humör',
    body3a:
      'Fald och udsving i östrogen och progesteron kan forstyrre sövnen (indsovningsbesvär, natlige opvågninger) och ledsages av irritabilitet, angst eller usädvanlige humörsvingninger.',
    body3b:
      'Disse ändringer har en reel biologisk forklaring: de afspejler hverken manglende viljestyrke eller et isoleret psykologisk problem.',
    h4: '4. Intimliv och vaginal törhed',
    body4:
      'Faldet i östrogen kan före till vaginal törhed, som sommetider giver ubehag eller smartor ved samleje. Lysten kan også ändre sig – op eller ned – afhängigt av den enkelte kvinde.',
    tip2Title: 'Godt at vide',
    tip2Text:
      'Der findes enkle lösninger (glidecreme, vaginale fugtighedsprodukter, lokalbehandling): at tale med en halsasprofessionel hjälper dig med at finde den rette lösning – uden tabu.',
    h5: '5. Vägt och stofskifte',
    body5:
      'Stofskiftet kan bremses en smule i denne periode, och fedtfordelingen har tendens till at flytte sig mod maven. Disse ändringer ar almindelige och afhänger inte udelukkende av viljestyrke.',
    h6: '6. Myter om menopause',
    myths: [
      'Menopausen "sker pludseligt" – i virkeligheden går der flere år med overgang (perimenopause) forud',
      'Alla har kraftige symtom – intensiteten varierer enormt fran kvinna till kvinde',
      'Der ar intet at göre – der findes mange lösninger, hormonelle eller ej, till at lindre generende symtom',
      'Intimlivet ar forbi – det ändrer sig, men ar fuldt muligt och tilfredsstillende med de rette tilpasninger',
    ],
    h7: '7. Normale symtom och tegn at holde öje med',
    body7:
      'Langt de fleste ändringer beskrevet her ar normale udtryk for overgangen. Visse tegn kräver dog hurtig lägelig opmärksomhed.',
    alert2Title: 'Gå till läge hvis',
    alert2Text:
      'Blödning efter bekräftet menopause, usädvanlige bäkkensmerter, symtom der markant forstyrrer dagliglivet, eller vedvarende tvivl.',
    h8: '8. Praktiske hverdagstips',
    dailyHabits: [
      'En kost rig på calcium och kostfibre',
      'Regelmässig fysisk aktivitet',
      'En stabil sövnrutine',
      'Daglige öjeblikke med afslapning',
    ],
    h9: '9. Hvad du kan tage med dig',
    tip3Title: 'Godt at vide',
    tip3Text:
      'Perimenopause och menopause ar naturlige faser, inte sygdomme. Der findes mange lösninger till at göre denne overgang mere behagelig: en halsasprofessionel ar den bedste samtalepartner till at tilpasse dem till din situation.',
    shareMessage: 'Forstå overgangsalderen — AWA',
  },
  nb: {
    badge: 'OVERGANGSALDER OG MENOPAUSE',
    title: 'Forstå overgangen til menopause',
    metaDuration: '10 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Nybegynner',
    metaValidated: 'Gjennomgått innhold',
    intro:
      'Hva som gradvis endrer seg, år før mensen opphører, og hvordan du kan møte denne fasen med mer klarhet.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Overgangsalder og menopause: definisjoner',
      'Stadig mer uregelmessige sykluser',
      'Søvn og humør',
      'Intimitet og vaginal tørrhet',
      'Vekt og stoffskifte',
      'Vanlige myter om menopausen',
      'Normale symptomer og tegn å følge med på',
      'Praktiske tips for hverdagen',
      'Det viktigste å huske',
    ],
    h1: '1. Overgangsalder og menopause: definisjoner',
    body1a:
      'Overgangsalderen betegner den hormonelle overgangsperioden som går forut for menopausen: den kan begynne flere år tidligere, vanligvis fra førtiårene, med uregelmessige svingninger i østrogennivået.',
    body1b:
      'Menopausen derimot er et bestemt tidspunkt: den bekreftes etter 12 sammenhengende måneder uten mens, uten annen årsak. I Frankrike inntreffer den i gjennomsnitt rundt 51 år, men denne alderen varierer naturlig fra kvinne til kvinne.',
    tip1Title: 'Godt å vite',
    tip1Text:
      'Hver kvinne opplever denne overgangen forskjellig, både i varighet og i hvor sterke symptomene er. Å snakke åpent om det hjelper deg å forberede deg bedre.',
    h2: '2. Stadig mer uregelmessige sykluser',
    body2:
      'Et av de første tegnene på overgangsalder er ofte en endring i syklusrytmen: syklusene kan bli kortere, lengre, mer spredt eller ha en annen blødning fra en måned til den neste.',
    alert1Title: 'Merk',
    alert1Text:
      'Svært kraftig blødning, blødning som kommer svært tett, eller blødning etter ett år uten mens krever medisinsk råd, siden dette ikke regnes som typiske tegn på overgangen.',
    h3: '3. Søvn og humør',
    body3a:
      'Fallet og svingningene i østrogen og progesteron kan forstyrre søvnen (innsovning, oppvåkning om natten) og kan følges av irritabilitet, angst eller uvanlige humørsvingninger.',
    body3b:
      'Disse endringene har en reell biologisk forklaring: de gjenspeiler verken mangel på viljestyrke eller et isolert psykologisk problem.',
    h4: '4. Intimitet og vaginal tørrhet',
    body4:
      'Fallet i østrogen kan gi vaginal tørrhet, som noen ganger fører til ubehag eller smerter under samleie. Lysten kan også endre seg, enten øke eller avta, avhengig av kvinnen.',
    tip2Title: 'Godt å vite',
    tip2Text:
      'Det finnes enkle løsninger (glidemidler, vaginale fuktighetskremer, lokale behandlinger): en samtale med helsepersonell kan hjelpe deg å finne den rette løsningen, uten tabu.',
    h5: '5. Vekt og stoffskifte',
    body5:
      'Stoffskiftet kan gå litt saktere i denne perioden, og fettfordelingen har en tendens til å flytte seg mot magen. Disse endringene er vanlige og avhenger ikke bare av viljestyrke.',
    h6: '6. Vanlige myter om menopausen',
    myths: [
      'Menopausen «kommer plutselig» – i virkeligheten går den foran av flere års overgang (overgangsalder)',
      'Alle symptomer er sterke for alle – styrken varierer enormt fra kvinne til kvinne',
      'Man kan ikke gjøre noe – mange løsninger, hormonelle eller ikke, finnes for å lindre plagsomme symptomer',
      'Intimlivet tar slutt – det endrer seg, men forblir helt mulig og givende med de riktige tilpasningene',
    ],
    h7: '7. Normale symptomer og tegn å følge med på',
    body7:
      'De aller fleste endringene som er beskrevet her, er normale uttrykk for overgangen. Likevel krever visse tegn rask medisinsk oppmerksomhet.',
    alert2Title: 'Gå til lege hvis',
    alert2Text:
      'Blødning etter bekreftet menopause, uvanlige bekkensmerter, symptomer som forstyrrer hverdagen betydelig eller vedvarende tvil.',
    h8: '8. Praktiske tips for hverdagen',
    dailyHabits: [
      'Et kosthold rikt på kalsium og fiber',
      'Regelmessig fysisk aktivitet',
      'En stabil søvnrutine',
      'Daglige øyeblikk med avslapning',
    ],
    h9: '9. Det viktigste å huske',
    tip3Title: 'Godt å vite',
    tip3Text:
      'Overgangsalder og menopause er naturlige faser, ikke en sykdom. Det finnes mange løsninger som kan hjelpe deg å komme gjennom denne overgangen mer komfortabelt: helsepersonell er fortsatt den beste ressursen for å tilpasse dem til din situasjon.',
    shareMessage: 'Forstå overgangen til menopause – AWA',
  },
  pl: {
    badge: 'PERIMENOPAUZA I MENOPAUZA',
    title: 'Zrozumieć okres przejścia do menopauzy',
    metaDuration: '10 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść zweryfikowana',
    intro:
      'Co zmienia się stopniowo, na lata przed ustaniem miesiączek, i jak z większą jasnością podejść do tego etapu.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Perimenopauza i menopauza: definicje',
      'Coraz bardziej nieregularne cykle',
      'Sen i nastrój',
      'Intymność i suchość pochwy',
      'Waga i metabolizm',
      'Częste mity o menopauzie',
      'Normalne objawy i oznaki, na które warto zwracać uwagę',
      'Praktyczne wskazówki na co dzień',
      'Najważniejsze wnioski',
    ],
    h1: '1. Perimenopauza i menopauza: definicje',
    body1a:
      'Perimenopauza to okres przejścia hormonalnego poprzedzający menopauzę: może zacząć się kilka lat wcześniej, zwykle po czterdziestce, z nieregularnie wahającym się poziomem estrogenów.',
    body1b:
      'Menopauza natomiast to konkretny moment w czasie: potwierdza się ją po 12 kolejnych miesiącach bez miesiączki, bez innej przyczyny. We Francji występuje średnio około 51. roku życia, choć wiek ten naturalnie różni się u poszczególnych kobiet.',
    tip1Title: 'Warto wiedzieć',
    tip1Text:
      'Każda kobieta przeżywa to przejście inaczej, zarówno pod względem czasu trwania, jak i nasilenia objawów. Otwarta rozmowa o tym pomaga lepiej się na nie przygotować.',
    h2: '2. Coraz bardziej nieregularne cykle',
    body2:
      'Jedną z pierwszych oznak perimenopauzy jest często zmiana rytmu cyklu: cykle mogą stawać się krótsze, dłuższe, bardziej oddalone lub mieć inną obfitość krwawienia z miesiąca na miesiąc.',
    alert1Title: 'Zwróć uwagę',
    alert1Text:
      'Bardzo obfite krwawienie, krwawienia występujące bardzo blisko siebie lub krwawienie po roku bez miesiączki wymagają porady lekarskiej, ponieważ nie uznaje się ich za typowe oznaki przejścia.',
    h3: '3. Sen i nastrój',
    body3a:
      'Spadek i wahania estrogenu i progesteronu mogą zaburzać sen (zasypianie, budzenie się w nocy) i mogą towarzyszyć im drażliwość, lęk lub nietypowe wahania nastroju.',
    body3b:
      'Te zmiany mają realne wyjaśnienie biologiczne: nie świadczą ani o braku silnej woli, ani o odosobnionym problemie psychicznym.',
    h4: '4. Intymność i suchość pochwy',
    body4:
      'Spadek estrogenów może prowadzić do suchości pochwy, czasem powodując dyskomfort lub ból podczas stosunku. Pożądanie również może się zmieniać, zwiększać się lub zmniejszać, w zależności od kobiety.',
    tip2Title: 'Warto wiedzieć',
    tip2Text:
      'Istnieją proste rozwiązania (nawilżacze, środki nawilżające dopochwowe, leczenie miejscowe): rozmowa ze specjalistą może pomóc znaleźć odpowiednie rozwiązanie, bez tabu.',
    h5: '5. Waga i metabolizm',
    body5:
      'Metabolizm może w tym okresie nieznacznie zwolnić, a rozmieszczenie tkanki tłuszczowej ma tendencję do przesuwania się w stronę brzucha. Te zmiany są częste i nie zależą wyłącznie od silnej woli.',
    h6: '6. Częste mity o menopauzie',
    myths: [
      'Menopauza „następuje nagle” — w rzeczywistości poprzedza ją kilka lat przejścia (perimenopauza)',
      'Wszystkie objawy są ciężkie u każdej kobiety — ich nasilenie bardzo się różni u poszczególnych kobiet',
      'Nic nie można zrobić — istnieje wiele rozwiązań, hormonalnych lub nie, łagodzących uciążliwe objawy',
      'Życie intymne się kończy — zmienia się, ale pozostaje w pełni możliwe i satysfakcjonujące przy odpowiednich dostosowaniach',
    ],
    h7: '7. Normalne objawy i oznaki, na które warto zwracać uwagę',
    body7:
      'Zdecydowana większość opisanych tu zmian to normalne przejawy okresu przejścia. Niektóre objawy wymagają jednak szybkiej porady lekarskiej.',
    alert2Title: 'Zgłoś się do lekarza, jeśli',
    alert2Text:
      'Występuje krwawienie po potwierdzonej menopauzie, nietypowy ból miednicy, objawy znacznie zakłócające codzienne życie lub jakiekolwiek uporczywe wątpliwości.',
    h8: '8. Praktyczne wskazówki na co dzień',
    dailyHabits: [
      'Dieta bogata w wapń i błonnik',
      'Regularna aktywność fizyczna',
      'Stała rutyna snu',
      'Codzienne chwile relaksu',
    ],
    h9: '9. Najważniejsze wnioski',
    tip3Title: 'Warto wiedzieć',
    tip3Text:
      'Perimenopauza i menopauza to naturalne etapy, a nie choroba. Istnieje wiele rozwiązań, które pomagają przejść przez ten okres wygodniej: specjalista pozostaje najlepszym źródłem pomocy w dostosowaniu ich do Twojej sytuacji.',
    shareMessage: 'Zrozumieć okres przejścia do menopauzy — AWA',
  },
  uk: {
    badge: 'ПЕРИМЕНОПАУЗА І МЕНОПАУЗА',
    title: 'Розуміння переходу до менопаузи',
    metaDuration: '10 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Початковий',
    metaValidated: 'Перевірений вміст',
    intro:
      'Що поступово змінюється за роки до припинення менструацій і як із більшою ясністю підійти до цього етапу.',
    contentsTitle: 'У цій статті',
    topics: [
      'Перименопауза та менопауза: визначення',
      'Дедалі нерегулярніші цикли',
      'Сон і настрій',
      'Інтимність і сухість піхви',
      'Вага та метаболізм',
      'Поширені міфи про менопаузу',
      'Нормальні симптоми та ознаки, на які варто звертати увагу',
      'Практичні поради на щодень',
      'Головні висновки',
    ],
    h1: '1. Перименопауза та менопауза: визначення',
    body1a:
      'Перименопауза — це період гормонального переходу, що передує менопаузі: вона може початися за кілька років до неї, зазвичай після сорока, з нерегулярними коливаннями рівня естрогену.',
    body1b:
      'Менопауза ж — конкретний момент у часі: її підтверджують після 12 послідовних місяців без менструації, без іншої причини. У Франції вона настає в середньому близько 51 року, хоча цей вік, природно, різниться в різних жінок.',
    tip1Title: 'Варто знати',
    tip1Text:
      'Кожна жінка переживає цей перехід по-різному, як за тривалістю, так і за інтенсивністю симптомів. Відверта розмова про це допомагає краще до нього підготуватися.',
    h2: '2. Дедалі нерегулярніші цикли',
    body2:
      'Однією з перших ознак перименопаузи часто є зміна ритму циклу: цикли можуть ставати коротшими, довшими, рідшими або мати інший характер виділень від місяця до місяця.',
    alert1Title: 'Зверніть увагу',
    alert1Text:
      'Дуже рясна кровотеча, кровотечі, що настають дуже близько одна до одної, або кровотеча після року без менструації потребують медичної поради, оскільки не вважаються типовими ознаками переходу.',
    h3: '3. Сон і настрій',
    body3a:
      'Зниження й коливання естрогену та прогестерону можуть порушувати сон (засинання, пробудження вночі) і можуть супроводжуватися дратівливістю, тривогою чи незвичними перепадами настрою.',
    body3b:
      'Ці зміни мають реальне біологічне пояснення: вони не свідчать ані про брак сили волі, ані про окрему психологічну проблему.',
    h4: '4. Інтимність і сухість піхви',
    body4:
      'Зниження естрогену може призводити до сухості піхви, іноді спричиняючи дискомфорт чи біль під час статевого акту. Бажання також може змінюватися, збільшуватися чи зменшуватися залежно від жінки.',
    tip2Title: 'Варто знати',
    tip2Text:
      'Існують прості рішення (змащувальні засоби, вагінальні зволожувачі, місцеве лікування): розмова з медичним фахівцем може допомогти знайти відповідне, без табу.',
    h5: '5. Вага та метаболізм',
    body5:
      'У цей період метаболізм може трохи сповільнюватися, а розподіл жиру має тенденцію зміщуватися до живота. Ці зміни поширені й залежать не лише від сили волі.',
    h6: '6. Поширені міфи про менопаузу',
    myths: [
      'Менопауза «настає раптово» — насправді їй передує кілька років переходу (перименопауза)',
      'Усі симптоми важкі в усіх — їхня інтенсивність надзвичайно різниться в різних жінок',
      'Нічого не можна зробити — існує багато рішень, гормональних чи ні, щоб полегшити прикрі симптоми',
      'Інтимне життя закінчується — воно змінюється, але залишається цілком можливим і повноцінним за відповідних коригувань',
    ],
    h7: '7. Нормальні симптоми та ознаки, на які варто звертати увагу',
    body7:
      'Переважна більшість описаних тут змін — нормальні прояви переходу. Проте певні ознаки потребують швидкої медичної уваги.',
    alert2Title: 'Зверніться до лікаря, якщо',
    alert2Text:
      'Є кровотеча після підтвердженої менопаузи, нетиповий біль у тазі, симптоми, що значно порушують щоденне життя, або будь-які стійкі сумніви.',
    h8: '8. Практичні поради на щодень',
    dailyHabits: [
      'Харчування, багате на кальцій і клітковину',
      'Регулярна фізична активність',
      'Стала рутина сну',
      'Щоденні моменти розслаблення',
    ],
    h9: '9. Головні висновки',
    tip3Title: 'Варто знати',
    tip3Text:
      'Перименопауза та менопауза — природні етапи, а не хвороба. Існує багато рішень, що допомагають пройти цей перехід комфортніше: медичний фахівець залишається найкращим джерелом допомоги в їх адаптації до вашої ситуації.',
    shareMessage: 'Розуміння переходу до менопаузи — AWA',
  },
  cs: {
    badge: 'PERIMENOPAUZA A MENOPAUZA',
    title: 'Pochopení přechodu do menopauzy',
    metaDuration: '10 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Začátečník',
    metaValidated: 'Ověřený obsah',
    intro:
      'Co se postupně mění, roky před koncem menstruace, a jak k této fázi přistupovat s větší jasností.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Perimenopauza a menopauza: definice',
      'Stále nepravidelnější cykly',
      'Spánek a nálada',
      'Intimita a suchost pochvy',
      'Váha a metabolismus',
      'Časté mýty o menopauze',
      'Normální příznaky a signály, kterých si všímat',
      'Praktické tipy pro každý den',
      'Hlavní poznatky',
    ],
    h1: '1. Perimenopauza a menopauza: definice',
    body1a:
      'Perimenopauza označuje období hormonálního přechodu, které předchází menopauze: může začít několik let předem, obecně od čtyřicítky, s nepravidelně kolísajícími hladinami estrogenu.',
    body1b:
      'Menopauza je naproti tomu přesný časový bod: potvrzuje se po 12 po sobě jdoucích měsících bez menstruace, bez jiné příčiny. Ve Francii nastává v průměru kolem 51 let, přičemž tento věk se přirozeně u každé ženy liší.',
    tip1Title: 'Stojí za to vědět',
    tip1Text:
      'Každá žena prožívá tento přechod jinak, jak délkou, tak intenzitou příznaků. Otevřený rozhovor o tom vám pomůže lépe se na něj připravit.',
    h2: '2. Stále nepravidelnější cykly',
    body2:
      'Jedním z prvních příznaků perimenopauzy bývá změna rytmu cyklu: cykly mohou být kratší, delší, řidší nebo se krvácení může z měsíce na měsíc lišit.',
    alert1Title: 'Upozornění',
    alert1Text:
      'Velmi silné krvácení, krvácení, které se objevuje velmi blízko po sobě, nebo krvácení po roce bez menstruace vyžaduje lékařskou radu, protože tyto příznaky se nepovažují za typické pro přechod.',
    h3: '3. Spánek a nálada',
    body3a:
      'Pokles a kolísání estrogenu a progesteronu mohou narušovat spánek (usínání, probouzení během noci) a mohou být doprovázeny podrážděností, úzkostí nebo neobvyklými výkyvy nálady.',
    body3b:
      'Tyto změny mají skutečné biologické vysvětlení: neodrážejí ani nedostatek vůle, ani izolovaný psychologický problém.',
    h4: '4. Intimita a suchost pochvy',
    body4:
      'Pokles estrogenu může vést k suchosti pochvy, někdy způsobující nepohodlí nebo bolest při styku. Touha se také může měnit, zvyšovat nebo snižovat, podle ženy.',
    tip2Title: 'Stojí za to vědět',
    tip2Text:
      'Existují jednoduchá řešení (lubrikanty, vaginální hydratační přípravky, lokální léčba): rozhovor se zdravotnickým pracovníkem vám pomůže najít správné řešení, bez tabu.',
    h5: '5. Váha a metabolismus',
    body5:
      'Metabolismus se v tomto období může mírně zpomalit a rozložení tuku má tendenci se přesouvat do oblasti břicha. Tyto změny jsou běžné a nezávisejí pouze na vůli.',
    h6: '6. Časté mýty o menopauze',
    myths: [
      'Menopauza „nastane najednou“ — ve skutečnosti jí předchází několik let přechodu (perimenopauza)',
      'Všechny příznaky jsou pro všechny silné — jejich intenzita se od ženy k ženě enormně liší',
      'Nelze nic dělat — existuje mnoho řešení, hormonálních i nehormonálních, k úlevě od obtěžujících příznaků',
      'Intimní život končí — mění se, ale s vhodnými úpravami zůstává zcela možný a naplňující',
    ],
    h7: '7. Normální příznaky a signály, kterých si všímat',
    body7:
      'Naprostá většina zde popsaných změn jsou normální projevy přechodu. Některé příznaky však vyžadují včasnou lékařskou pozornost.',
    alert2Title: 'Navštivte lékaře, pokud',
    alert2Text:
      'Krvácení po potvrzené menopauze, neobvyklá bolest v pánvi, příznaky, které výrazně narušují každodenní život, nebo jakákoli přetrvávající pochybnost.',
    h8: '8. Praktické tipy pro každý den',
    dailyHabits: [
      'Strava bohatá na vápník a vlákninu',
      'Pravidelná fyzická aktivita',
      'Stabilní spánkový režim',
      'Denní chvíle relaxace',
    ],
    h9: '9. Hlavní poznatky',
    tip3Title: 'Stojí za to vědět',
    tip3Text:
      'Perimenopauza a menopauza jsou přirozené etapy, nikoli nemoc. Existuje mnoho řešení, která vám pomohou projít tímto přechodem pohodlněji: zdravotnický pracovník zůstává nejlepším zdrojem k jejich přizpůsobení vaší situaci.',
    shareMessage: 'Pochopení přechodu do menopauzy — AWA',
  },
  sk: {
    badge: 'PERIMENOPAUZA A MENOPAUZA',
    title: 'Pochopenie prechodu do menopauzy',
    metaDuration: '10 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Začiatočník',
    metaValidated: 'Overený obsah',
    intro:
      'Čo sa postupne mení už roky pred zastavením menštruácie a ako k tejto etape pristupovať s väčšou jasnosťou.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Perimenopauza a menopauza: definície',
      'Čoraz nepravidelnejšie cykly',
      'Spánok a nálada',
      'Intimita a vaginálna suchosť',
      'Hmotnosť a metabolizmus',
      'Bežné mýty o menopauze',
      'Normálne príznaky a znaky, ktoré treba sledovať',
      'Praktické každodenné tipy',
      'Hlavné body',
    ],
    h1: '1. Perimenopauza a menopauza: definície',
    body1a:
      'Perimenopauza označuje obdobie hormonálneho prechodu, ktoré predchádza menopauze: môže sa začať niekoľko rokov vopred, vo všeobecnosti od štyridsiatky, pričom hladiny estrogénu nepravidelne kolíšu.',
    body1b:
      'Menopauza je naopak konkrétny bod v čase: potvrdzuje sa po 12 po sebe nasledujúcich mesiacoch bez menštruácie, bez inej príčiny. Vo Francúzsku nastáva priemerne okolo 51. roku veku, hoci tento vek sa prirodzene líši od ženy k žene.',
    tip1Title: 'Stojí za to vedieť',
    tip1Text:
      'Každá žena prežíva tento prechod inak, čo do trvania aj intenzity príznakov. Otvorený rozhovor o ňom vám pomáha lepšie sa naň pripraviť.',
    h2: '2. Čoraz nepravidelnejšie cykly',
    body2:
      'Jedným z prvých znakov perimenopauzy je často zmena rytmu cyklu: cykly sa môžu skracovať, predlžovať, byť viac roztiahnuté alebo mať z mesiaca na mesiac iné krvácanie.',
    alert1Title: 'Upozornenie',
    alert1Text:
      'Veľmi silné krvácanie, krvácanie, ktoré sa objavuje veľmi blízko seba, alebo krvácanie po roku bez menštruácie si vyžaduje lekársku radu, pretože nejde o typické znaky prechodu.',
    h3: '3. Spánok a nálada',
    body3a:
      'Pokles a kolísanie estrogénu a progesterónu môžu narúšať spánok (zaspávanie, budenie v noci) a môžu ich sprevádzať podráždenosť, úzkosť alebo nezvyčajné zmeny nálady.',
    body3b:
      'Tieto zmeny majú skutočné biologické vysvetlenie: neodrážajú ani nedostatok vôle, ani izolovaný psychologický problém.',
    h4: '4. Intimita a vaginálna suchosť',
    body4:
      'Pokles estrogénu môže viesť k vaginálnej suchosti, ktorá niekedy spôsobuje nepohodlie alebo bolesť pri styku. Túžba sa môže tiež meniť, buď zosilnieť, alebo zoslabnúť, podľa ženy.',
    tip2Title: 'Stojí za to vedieť',
    tip2Text:
      'Existujú jednoduché riešenia (lubrikanty, vaginálne hydratačné prípravky, lokálne liečby): rozhovor so zdravotníckym pracovníkom vám môže pomôcť nájsť to správne, bez tabu.',
    h5: '5. Hmotnosť a metabolizmus',
    body5:
      'Metabolizmus sa v tomto období môže mierne spomaliť a rozloženie tuku má tendenciu presúvať smerom k bruchu. Tieto zmeny sú bežné a nezávisia len od sily vôle.',
    h6: '6. Bežné mýty o menopauze',
    myths: [
      'Menopauza „nastane naraz“ — v skutočnosti jej predchádza niekoľko rokov prechodu (perimenopauza)',
      'Všetky príznaky sú pre všetky ženy silné — ich intenzita sa od ženy k žene mimoriadne líši',
      'Nedá sa nič robiť — existuje mnoho riešení, hormonálnych aj nehormonálnych, na zmiernenie obťažujúcich príznakov',
      'Intímny život sa končí — mení sa, ale s vhodnými úpravami zostáva úplne možný a napĺňajúci',
    ],
    h7: '7. Normálne príznaky a znaky, ktoré treba sledovať',
    body7:
      'Veľká väčšina tu opísaných zmien je normálnym prejavom prechodu. Niektoré znaky však vyžadujú rýchlu lekársku pozornosť.',
    alert2Title: 'Navštívte lekára, ak',
    alert2Text:
      'Krvácanie po potvrdenej menopauze, nezvyčajná panvová bolesť, príznaky, ktoré výrazne narúšajú každodenný život, alebo akákoľvek pretrvávajúca pochybnosť.',
    h8: '8. Praktické každodenné tipy',
    dailyHabits: [
      'Strava bohatá na vápnik a vlákninu',
      'Pravidelná fyzická aktivita',
      'Stála spánková rutina',
      'Každodenné chvíle relaxácie',
    ],
    h9: '9. Hlavné body',
    tip3Title: 'Stojí za to vedieť',
    tip3Text:
      'Perimenopauza a menopauza sú prirodzené etapy, nie choroba. Existuje mnoho riešení, ktoré vám pomôžu prejsť týmto prechodom pohodlnejšie: zdravotnícky pracovník zostáva najlepším zdrojom na ich prispôsobenie vašej situácii.',
    shareMessage: 'Pochopenie prechodu do menopauzy — AWA',
  },
  hu: {
    badge: 'PERIMENOPAUZA ÉS MENOPAUZA',
    title: 'A menopauzába vezető átmenet megértése',
    metaDuration: '10 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Kezdő',
    metaValidated: 'Ellenőrzött tartalom',
    intro:
      'Mi változik fokozatosan, már évekkel a menstruáció megszűnése előtt, és hogyan közelíts ehhez a szakaszhoz nagyobb tisztánlátással.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Perimenopauza és menopauza: meghatározások',
      'Egyre szabálytalanabb ciklusok',
      'Alvás és hangulat',
      'Intimitás és hüvelyszárazság',
      'Testsúly és anyagcsere',
      'Gyakori tévhitek a menopauzáról',
      'Normális tünetek és figyelendő jelek',
      'Praktikus mindennapi tippek',
      'Legfontosabb tudnivalók',
    ],
    h1: '1. Perimenopauza és menopauza: meghatározások',
    body1a:
      'A perimenopauza a menopauzát megelőző hormonális átmeneti időszakot jelöli: több évvel korábban kezdődhet, általában a negyvenes évektől, az ösztrogénszintek szabálytalan ingadozásával.',
    body1b:
      'A menopauza ezzel szemben egy konkrét időpont: 12 egymást követő menstruáció nélküli hónap után erősítik meg, más ok nélkül. Franciaországban átlagosan 51 éves kor körül következik be, bár ez az életkor természetesen nőnként eltér.',
    tip1Title: 'Érdemes tudni',
    tip1Text:
      'Minden nő másként éli meg ezt az átmenetet, mind az időtartam, mind a tünetek erőssége szempontjából. Ha nyíltan beszélsz róla, jobban fel tudsz készülni rá.',
    h2: '2. Egyre szabálytalanabb ciklusok',
    body2:
      'A perimenopauza egyik első jele gyakran a ciklus ritmusának megváltozása: a ciklusok rövidülhetnek, hosszabbodhatnak, jobban eltávolodhatnak egymástól, vagy hónapról hónapra eltérő vérzéssel járhatnak.',
    alert1Title: 'Figyelem',
    alert1Text:
      'A nagyon erős vérzés, a nagyon közel egymás után jelentkező vérzések vagy az egy év menstruáció nélküli időszak után fellépő vérzés orvosi tanácsot igényel, mivel ezek nem tekinthetők az átmenet tipikus jeleinek.',
    h3: '3. Alvás és hangulat',
    body3a:
      'Az ösztrogén és a progeszteron csökkenése és ingadozása megzavarhatja az alvást (elalvás, éjszakai ébredések), és együtt járhat ingerlékenységgel, szorongással vagy szokatlan hangulatingadozásokkal.',
    body3b:
      'Ezeknek a változásoknak valódi biológiai magyarázata van: nem az akaraterő hiányát, sem elszigetelt pszichológiai problémát tükröznek.',
    h4: '4. Intimitás és hüvelyszárazság',
    body4:
      'Az ösztrogén csökkenése hüvelyszárazsághoz vezethet, ami néha kellemetlenséget vagy fájdalmat okoz közösülés közben. A vágy is változhat — nőtől függően növekedhet vagy csökkenhet.',
    tip2Title: 'Érdemes tudni',
    tip2Text:
      'Léteznek egyszerű megoldások (síkosítók, hüvelynedvesítők, helyi kezelések): egy egészségügyi szakemberrel való beszélgetés segíthet megtalálni a megfelelőt, tabuk nélkül.',
    h5: '5. Testsúly és anyagcsere',
    body5:
      'Az anyagcsere ebben az időszakban kissé lelassulhat, és a zsír eloszlása hajlamos a has felé tolódni. Ezek a változások gyakoriak, és nem csak az akaraterőtől függnek.',
    h6: '6. Gyakori tévhitek a menopauzáról',
    myths: [
      'A menopauza „egyszerre történik” — valójában több évig tartó átmenet (perimenopauza) előzi meg',
      'Minden tünet mindenkinél súlyos — az erősségük nőnként rendkívül eltérő',
      'Nem lehet semmit tenni — számos megoldás, hormonális és nem hormonális is létezik a zavaró tünetek enyhítésére',
      'Az intim élet véget ér — megváltozik, de a megfelelő igazításokkal teljesen lehetséges és teljes értékű marad',
    ],
    h7: '7. Normális tünetek és figyelendő jelek',
    body7:
      'Az itt leírt változások nagy többsége az átmenet normális megnyilvánulása. Egyes jelek azonban gyors orvosi figyelmet igényelnek.',
    alert2Title: 'Fordulj orvoshoz, ha',
    alert2Text:
      'Vérzés a megerősített menopauza után, szokatlan medencefájdalom, a mindennapokat jelentősen zavaró tünetek, vagy bármilyen tartós kétség.',
    h8: '8. Praktikus mindennapi tippek',
    dailyHabits: [
      'Kalciumban és rostban gazdag étrend',
      'Rendszeres testmozgás',
      'Állandó alvási rutin',
      'Napi relaxációs pillanatok',
    ],
    h9: '9. Legfontosabb tudnivalók',
    tip3Title: 'Érdemes tudni',
    tip3Text:
      'A perimenopauza és a menopauza természetes szakaszok, nem betegség. Számos megoldás segíthet kényelmesebben átvészelni ezt az átmenetet: az egészségügyi szakember marad a legjobb forrás ezek helyzetedhez igazításához.',
    shareMessage: 'A menopauzába vezető átmenet megértése — AWA',
  },
  ro: {
    badge: 'PERIMENOPAUZĂ ȘI MENOPAUZĂ',
    title: 'Înțelegerea tranziției spre menopauză',
    metaDuration: '10 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Începător',
    metaValidated: 'Conținut revizuit',
    intro:
      'Ce se schimbă treptat, cu ani înainte ca menstruația să se oprească, și cum poți aborda această etapă cu mai multă claritate.',
    contentsTitle: 'În acest articol',
    topics: [
      'Perimenopauza și menopauza: definiții',
      'Cicluri tot mai neregulate',
      'Somnul și starea de spirit',
      'Intimitatea și uscăciunea vaginală',
      'Greutatea și metabolismul',
      'Mituri frecvente despre menopauză',
      'Simptome normale și semne de urmărit',
      'Sfaturi practice de zi cu zi',
      'Ce să reții',
    ],
    h1: '1. Perimenopauza și menopauza: definiții',
    body1a:
      'Perimenopauza desemnează perioada de tranziție hormonală care precede menopauza: poate începe cu câțiva ani mai devreme, în general din jurul vârstei de patruzeci de ani, cu niveluri de estrogen care fluctuează neregulat.',
    body1b:
      'Menopauza, în schimb, este un moment precis în timp: se confirmă după 12 luni consecutive fără menstruație, fără altă cauză. În Franța, apare în medie în jurul vârstei de 51 de ani, deși această vârstă variază firesc de la o femeie la alta.',
    tip1Title: 'Bine de știut',
    tip1Text:
      'Fiecare femeie trăiește această tranziție diferit, atât ca durată, cât și ca intensitate a simptomelor. Faptul că vorbești deschis despre ea te ajută să o anticipezi mai bine.',
    h2: '2. Cicluri tot mai neregulate',
    body2:
      'Unul dintre primele semne ale perimenopauzei este adesea o schimbare a ritmului ciclului: ciclurile pot deveni mai scurte, mai lungi, mai distanțate sau pot avea un flux diferit de la o lună la alta.',
    alert1Title: 'Atenție',
    alert1Text:
      'O sângerare foarte abundentă, sângerări foarte apropiate între ele sau sângerări care apar după un an fără menstruație necesită un sfat medical, deoarece nu sunt considerate semne tipice ale tranziției.',
    h3: '3. Somnul și starea de spirit',
    body3a:
      'Scăderea și fluctuațiile estrogenului și progesteronului pot perturba somnul (adormirea, trezirile din timpul nopții) și pot fi însoțite de irascibilitate, anxietate sau schimbări de dispoziție neobișnuite.',
    body3b:
      'Aceste schimbări au o explicație biologică reală: ele nu reflectă nici lipsă de voință, nici o problemă psihologică izolată.',
    h4: '4. Intimitatea și uscăciunea vaginală',
    body4:
      'Scăderea estrogenului poate duce la uscăciune vaginală, provocând uneori disconfort sau durere în timpul raporturilor intime. Dorința se poate schimba și ea, crescând sau scăzând, în funcție de femeie.',
    tip2Title: 'Bine de știut',
    tip2Text:
      'Există soluții simple (lubrifianți, hidratante vaginale, tratamente locale): discuția cu un profesionist din domeniul sănătății te poate ajuta să găsești soluția potrivită, fără tabuuri.',
    h5: '5. Greutatea și metabolismul',
    body5:
      'Metabolismul poate încetini ușor în această perioadă, iar distribuția grăsimii tinde să se deplaseze spre abdomen. Aceste schimbări sunt frecvente și nu depind doar de voință.',
    h6: '6. Mituri frecvente despre menopauză',
    myths: [
      'Menopauza „vine dintr-o dată” — în realitate, este precedată de câțiva ani de tranziție (perimenopauza)',
      'Toate simptomele sunt severe pentru toată lumea — intensitatea lor variază enorm de la o femeie la alta',
      'Nu se poate face nimic — există multe soluții, hormonale sau nu, pentru ameliorarea simptomelor deranjante',
      'Viața intimă ia sfârșit — se schimbă, dar rămâne pe deplin posibilă și împlinitoare cu ajustările potrivite',
    ],
    h7: '7. Simptome normale și semne de urmărit',
    body7:
      'Marea majoritate a schimbărilor descrise aici sunt manifestări normale ale tranziției. Totuși, anumite semne necesită o atenție medicală promptă.',
    alert2Title: 'Mergi la medic dacă',
    alert2Text:
      'Ai sângerări după menopauza confirmată, dureri pelviene neobișnuite, simptome care îți perturbă semnificativ viața de zi cu zi sau orice îndoială persistentă.',
    h8: '8. Sfaturi practice de zi cu zi',
    dailyHabits: [
      'O alimentație bogată în calciu și fibre',
      'Activitate fizică regulată',
      'O rutină stabilă de somn',
      'Momente zilnice de relaxare',
    ],
    h9: '9. Ce să reții',
    tip3Title: 'Bine de știut',
    tip3Text:
      'Perimenopauza și menopauza sunt etape naturale, nu o boală. Există multe soluții care te ajută să treci mai confortabil prin această tranziție: un profesionist din domeniul sănătății rămâne cea mai bună resursă pentru a le adapta situației tale.',
    shareMessage: 'Înțelegerea tranziției spre menopauză — AWA',
  },
  bg: {
    badge: 'ПЕРИМЕНОПАУЗА И МЕНОПАУЗА',
    title: 'Разбиране на прехода към менопауза',
    metaDuration: '10 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Начинаещ',
    metaValidated: 'Проверено съдържание',
    intro:
      'Какво се променя постепенно, години преди менструацията да спре, и как да подходиш към този етап с повече яснота.',
    contentsTitle: 'В тази статия',
    topics: [
      'Перименопауза и менопауза: определения',
      'Все по-нередовни цикли',
      'Сън и настроение',
      'Интимност и вагинална сухота',
      'Тегло и метаболизъм',
      'Чести митове за менопаузата',
      'Нормални симптоми и признаци, които да следиш',
      'Практически ежедневни съвети',
      'Какво да запомниш',
    ],
    h1: '1. Перименопауза и менопауза: определения',
    body1a:
      'Перименопаузата означава периода на хормонален преход, който предхожда менопаузата: тя може да започне няколко години по-рано, обикновено от четиридесетте години нататък, с нередовно колебаещи се нива на естроген.',
    body1b:
      'Менопаузата, от друга страна, е конкретен момент във времето: тя се потвърждава след 12 последователни месеца без менструация, без друга причина. Във Франция настъпва средно около 51-годишна възраст, макар тази възраст естествено да варира от жена на жена.',
    tip1Title: 'Добре е да знаеш',
    tip1Text:
      'Всяка жена преживява този преход различно, както по продължителност, така и по интензитет на симптомите. Откритият разговор за него ти помага да го предвидиш по-добре.',
    h2: '2. Все по-нередовни цикли',
    body2:
      'Един от първите признаци на перименопаузата често е промяна в ритъма на цикъла: циклите могат да станат по-къси, по-дълги, по-разредени или да имат различен поток от месец на месец.',
    alert1Title: 'Обърни внимание',
    alert1Text:
      'Много обилно кървене, кървене, което се случва много близо едно до друго, или кървене след една година без менструация изисква медицински съвет, тъй като не се считат за типични признаци на прехода.',
    h3: '3. Сън и настроение',
    body3a:
      'Спадът и колебанията на естрогена и прогестерона могат да нарушат съня (заспиване, събуждания през нощта) и могат да бъдат съпроводени от раздразнителност, тревожност или необичайни промени в настроението.',
    body3b:
      'Тези промени имат реално биологично обяснение: те не отразяват нито липса на воля, нито изолиран психологически проблем.',
    h4: '4. Интимност и вагинална сухота',
    body4:
      'Спадът на естрогена може да доведе до вагинална сухота, понякога причинявайки дискомфорт или болка по време на полов контакт. Желанието също може да се промени, да се увеличи или намали, според жената.',
    tip2Title: 'Добре е да знаеш',
    tip2Text:
      'Съществуват прости решения (лубриканти, вагинални хидратанти, локални лечения): разговорът със здравен специалист може да ти помогне да намериш правилното решение, без табута.',
    h5: '5. Тегло и метаболизъм',
    body5:
      'Метаболизмът може леко да се забави през този период, а разпределението на мазнините има склонност да се измества към корема. Тези промени са чести и не зависят единствено от волята.',
    h6: '6. Чести митове за менопаузата',
    myths: [
      'Менопаузата „идва изведнъж“ — в действителност ѝ предхождат няколко години преход (перименопауза)',
      'Всички симптоми са тежки за всички — интензитетът им варира изключително много от жена на жена',
      'Нищо не може да се направи — съществуват много решения, хормонални или не, за облекчаване на неприятните симптоми',
      'Интимният живот приключва — той се променя, но остава напълно възможен и удовлетворяващ с правилните приспособявания',
    ],
    h7: '7. Нормални симптоми и признаци, които да следиш',
    body7:
      'Огромното мнозинство от описаните тук промени са нормални прояви на прехода. Все пак някои признаци изискват бързо медицинско внимание.',
    alert2Title: 'Иди на лекар, ако',
    alert2Text:
      'Имаш кървене след потвърдена менопауза, необичайна тазова болка, симптоми, които значително нарушават ежедневието, или каквото и да е упорито съмнение.',
    h8: '8. Практически ежедневни съвети',
    dailyHabits: [
      'Храна, богата на калций и фибри',
      'Редовна физическа активност',
      'Стабилна рутина на съня',
      'Ежедневни моменти на релаксация',
    ],
    h9: '9. Какво да запомниш',
    tip3Title: 'Добре е да знаеш',
    tip3Text:
      'Перименопаузата и менопаузата са естествени етапи, а не болест. Съществуват много решения, които да ти помогнат да преминеш по-удобно през този преход: здравният специалист остава най-добрият ресурс, за да ги приспособи към ситуацията ти.',
    shareMessage: 'Разбиране на прехода към менопауза — AWA',
  },
  sr: {
    badge: 'ПЕРИМЕНОПАУЗА И МЕНОПАУЗА',
    title: 'Разумевање прелаза у менопаузу',
    metaDuration: '10 мин читања',
    metaType: 'Водич',
    metaLevel: 'Почетник',
    metaValidated: 'Проверен садржај',
    intro:
      'Шта се постепено мења, годинама пре него што менструација престане, и како овој фази приступити са више јасноће.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Перименопауза и менопауза: дефиниције',
      'Све нередовнији циклуси',
      'Сан и расположење',
      'Интимност и вагинална сувоћа',
      'Тежина и метаболизам',
      'Чести митови о менопаузи',
      'Нормални симптоми и знаци на које треба пазити',
      'Практични свакодневни савети',
      'Шта да запамтиш',
    ],
    h1: '1. Перименопауза и менопауза: дефиниције',
    body1a:
      'Перименопауза означава период хормонског прелаза који претходи менопаузи: може почети неколико година раније, обично од четрдесетих година, уз нередовне флуктуације нивоа естрогена.',
    body1b:
      'Менопауза је, с друге стране, одређена тачка у времену: потврђује се после 12 узастопних месеци без менструације, без другог узрока. У Француској наступа у просеку око 51. године, мада ова старост природно варира од жене до жене.',
    tip1Title: 'Добро је знати',
    tip1Text:
      'Свака жена овај прелаз доживљава другачије, како по трајању, тако и по интензитету симптома. Отворен разговор о томе помаже ти да га боље предвидиш.',
    h2: '2. Све нередовнији циклуси',
    body2:
      'Један од првих знакова перименопаузе често је промена ритма циклуса: циклуси могу постати краћи, дужи, ређи или имати другачији проток из месеца у месец.',
    alert1Title: 'Обрати пажњу',
    alert1Text:
      'Веома обилно крварење, крварење које се јавља врло близу једно другом или крварење после годину дана без менструације захтева медицински савет, јер то нису типични знаци прелаза.',
    h3: '3. Сан и расположење',
    body3a:
      'Пад и флуктуације естрогена и прогестерона могу пореметити сан (заспивање, буђење током ноћи) и могу бити праћени раздражљивошћу, анксиозношћу или необичним променама расположења.',
    body3b:
      'Ове промене имају стварно биолошко објашњење: оне не одражавају ни недостатак воље ни изоловани психолошки проблем.',
    h4: '4. Интимност и вагинална сувоћа',
    body4:
      'Пад естрогена може довести до вагиналне сувоће, која понекад изазива нелагодност или бол током односа. И жеља се може променити, повећати или смањити, зависно од жене.',
    tip2Title: 'Добро је знати',
    tip2Text:
      'Постоје једноставна решења (лубриканти, вагинални хидратанти, локалне терапије): разговор са здравственим радником може ти помоћи да пронађеш право решење, без табуа.',
    h5: '5. Тежина и метаболизам',
    body5:
      'Метаболизам се током овог периода може благо успорити, а распоред масног ткива има тенденцију да се помера ка стомаку. Ове промене су честе и не зависе само од воље.',
    h6: '6. Чести митови о менопаузи',
    myths: [
      'Менопауза „наступа одједном“ — у ствари, њој претходи неколико година прелаза (перименопауза)',
      'Сви симптоми су тешки за све — њихов интензитет увелико варира од жене до жене',
      'Ништа се не може учинити — постоје многа решења, хормонска или не, за ублажавање непријатних симптома',
      'Интимни живот се завршава — он се мења, али остаје потпуно могућ и пун уз праве прилагођавања',
    ],
    h7: '7. Нормални симптоми и знаци на које треба пазити',
    body7:
      'Огромна већина овде описаних промена су нормалне манифестације прелаза. Међутим, одређени знаци захтевају хитну медицинску пажњу.',
    alert2Title: 'Посети лекара ако',
    alert2Text:
      'Имаш крварење после потврђене менопаузе, необичан бол у карлици, симптоме који значајно ометају свакодневни живот или било какву упорну сумњу.',
    h8: '8. Практични свакодневни савети',
    dailyHabits: [
      'Исхрана богата калцијумом и влакнима',
      'Редовна физичка активност',
      'Стабилна рутина спавања',
      'Свакодневни тренуци опуштања',
    ],
    h9: '9. Шта да запамтиш',
    tip3Title: 'Добро је знати',
    tip3Text:
      'Перименопауза и менопауза су природне фазе, а не болест. Постоје многа решења која ти могу помоћи да овај прелаз прођеш удобније: здравствени радник остаје најбољи ресурс да их прилагодиш својој ситуацији.',
    shareMessage: 'Разумевање прелаза у менопаузу — AWA',
  },
  hr: {
    badge: 'PERIMENOPAUZA I MENOPAUZA',
    title: 'Razumijevanje prijelaza u menopauzu',
    metaDuration: '10 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro:
      'Što se postupno mijenja godinama prije prestanka menstruacije i kako ovoj fazi pristupiti s više jasnoće.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Perimenopauza i menopauza: definicije',
      'Sve nepravilniji ciklusi',
      'San i raspoloženje',
      'Intimnost i suhoća rodnice',
      'Težina i metabolizam',
      'Česti mitovi o menopauzi',
      'Normalni simptomi i znakovi na koje treba paziti',
      'Praktični svakodnevni savjeti',
      'Ključne poruke',
    ],
    h1: '1. Perimenopauza i menopauza: definicije',
    body1a:
      'Perimenopauza označava razdoblje hormonskog prijelaza koje prethodi menopauzi: može započeti nekoliko godina ranije, općenito od četrdesetih godina nadalje, uz nepravilno kolebanje razina estrogena.',
    body1b:
      'Menopauza je, naprotiv, točno određen trenutak: potvrđuje se nakon 12 uzastopnih mjeseci bez menstruacije, bez drugog uzroka. U Francuskoj nastupa u prosjeku oko 51. godine, iako se ta dob prirodno razlikuje od žene do žene.',
    tip1Title: 'Dobro je znati',
    tip1Text:
      'Svaka žena ovaj prijelaz doživljava drugačije, i po trajanju i po intenzitetu simptoma. Otvoren razgovor o tome pomaže ti da ga bolje predvidiš.',
    h2: '2. Sve nepravilniji ciklusi',
    body2:
      'Jedan od prvih znakova perimenopauze često je promjena ritma ciklusa: ciklusi mogu postati kraći, dulji, razmaknutiji ili imati drugačiji protok iz mjeseca u mjesec.',
    alert1Title: 'Napomena',
    alert1Text:
      'Vrlo obilno krvarenje, krvarenje koje se javlja vrlo blizu jedno drugom ili krvarenje nakon godinu dana bez menstruacije zahtijeva liječnički savjet jer se ne smatraju tipičnim znakovima prijelaza.',
    h3: '3. San i raspoloženje',
    body3a:
      'Pad i kolebanje estrogena i progesterona mogu poremetiti san (uspavljivanje, buđenje tijekom noći), a mogu biti praćeni razdražljivošću, tjeskobom ili neobičnim promjenama raspoloženja.',
    body3b:
      'Te promjene imaju stvarno biološko objašnjenje: ne odražavaju ni nedostatak snage volje ni izoliran psihološki problem.',
    h4: '4. Intimnost i suhoća rodnice',
    body4:
      'Pad estrogena može dovesti do suhoće rodnice, ponekad uzrokujući nelagodu ili bol tijekom spolnog odnosa. Želja se također može promijeniti, povećati ili smanjiti, ovisno o ženi.',
    tip2Title: 'Dobro je znati',
    tip2Text:
      'Postoje jednostavna rješenja (lubrikanti, vaginalni hidratanti, lokalne terapije): razgovor sa zdravstvenim djelatnikom može ti pomoći pronaći pravo rješenje, bez tabua.',
    h5: '5. Težina i metabolizam',
    body5:
      'Metabolizam se u ovom razdoblju može neznatno usporiti, a raspodjela masnog tkiva ima tendenciju pomaknuti se prema trbuhu. Te su promjene česte i ne ovise samo o snazi volje.',
    h6: '6. Česti mitovi o menopauzi',
    myths: [
      'Menopauza „nastupa odjednom“ — u stvarnosti joj prethodi nekoliko godina prijelaza (perimenopauza)',
      'Svi su simptomi teški za sve — njihov se intenzitet jako razlikuje od žene do žene',
      'Ništa se ne može učiniti — postoje mnoga rješenja, hormonska i nehormonska, koja ublažavaju smetajuće simptome',
      'Intimni život završava — mijenja se, ali uz prave prilagodbe ostaje potpuno moguć i ispunjavajući',
    ],
    h7: '7. Normalni simptomi i znakovi na koje treba paziti',
    body7:
      'Velika većina ovdje opisanih promjena normalne su manifestacije prijelaza. Međutim, određeni znakovi zahtijevaju žurnu medicinsku pomoć.',
    alert2Title: 'Posjeti liječnika ako',
    alert2Text:
      'Imaš krvarenje nakon potvrđene menopauze, neobičnu bol u zdjelici, simptome koji znatno remete svakodnevni život ili bilo kakvu trajnu nedoumicu.',
    h8: '8. Praktični svakodnevni savjeti',
    dailyHabits: [
      'Prehrana bogata kalcijem i vlaknima',
      'Redovita tjelesna aktivnost',
      'Stabilna rutina spavanja',
      'Svakodnevni trenuci opuštanja',
    ],
    h9: '9. Ključne poruke',
    tip3Title: 'Dobro je znati',
    tip3Text:
      'Perimenopauza i menopauza prirodne su faze, a ne bolest. Postoje mnoga rješenja koja ti pomažu da ovaj prijelaz proživiš ugodnije: zdravstveni djelatnik ostaje najbolji izvor za njihovu prilagodbu tvojoj situaciji.',
    shareMessage: 'Razumijevanje prijelaza u menopauzu — AWA',
  },
  bs: {
    badge: 'PERIMENOPAUZA I MENOPAUZA',
    title: 'Razumijevanje prijelaza u menopauzu',
    metaDuration: '10 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro:
      'Što se postupno mijenja godinama prije prestanka menstruacije i kako ovoj fazi pristupiti s više jasnoće.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Perimenopauza i menopauza: definicije',
      'Sve nepravilniji ciklusi',
      'San i raspoloženje',
      'Intimnost i suhoća rodnice',
      'Težina i metabolizam',
      'Česti mitovi o menopauzi',
      'Normalni simptomi i znakovi na koje treba paziti',
      'Praktični svakodnevni savjeti',
      'Ključne poruke',
    ],
    h1: '1. Perimenopauza i menopauza: definicije',
    body1a:
      'Perimenopauza označava razdoblje hormonskog prijelaza koje prethodi menopauzi: može započeti nekoliko godina ranije, općenito od četrdesetih godina nadalje, uz nepravilno kolebanje razina estrogena.',
    body1b:
      'Menopauza je, naprotiv, tačno određen trenutak: potvrđuje se nakon 12 uzastopnih mjeseci bez menstruacije, bez drugog uzroka. U Francuskoj nastupa u prosjeku oko 51. godine, iako se ta dob prirodno razlikuje od žene do žene.',
    tip1Title: 'Dobro je znati',
    tip1Text:
      'Svaka žena ovaj prijelaz doživljava drugačije, i po trajanju i po intenzitetu simptoma. Otvoren razgovor o tome pomaže ti da ga bolje predvidiš.',
    h2: '2. Sve nepravilniji ciklusi',
    body2:
      'Jedan od prvih znakova perimenopauze često je promjena ritma ciklusa: ciklusi mogu postati kraći, dulji, razmaknutiji ili imati drugačiji protok iz mjeseca u mjesec.',
    alert1Title: 'Napomena',
    alert1Text:
      'Vrlo obilno krvarenje, krvarenje koje se javlja vrlo blizu jedno drugom ili krvarenje nakon godinu dana bez menstruacije zahtijeva ljekarski savjet jer se ne smatraju tipičnim znakovima prijelaza.',
    h3: '3. San i raspoloženje',
    body3a:
      'Pad i kolebanje estrogena i progesterona mogu poremetiti san (uspavljivanje, buđenje tokom noći), a mogu biti praćeni razdražljivošću, tjeskobom ili neobičnim promjenama raspoloženja.',
    body3b:
      'Te promjene imaju stvarno biološko objašnjenje: ne odražavaju ni nedostatak snage volje ni izoliran psihološki problem.',
    h4: '4. Intimnost i suhoća rodnice',
    body4:
      'Pad estrogena može dovesti do suhoće rodnice, ponekad uzrokujući nelagodu ili bol tokom spolnog odnosa. Želja se također može promijeniti, povećati ili smanjiti, ovisno o ženi.',
    tip2Title: 'Dobro je znati',
    tip2Text:
      'Postoje jednostavna rješenja (lubrikanti, vaginalni hidratanti, lokalne terapije): razgovor sa zdravstvenim radnikom može ti pomoći pronaći pravo rješenje, bez tabua.',
    h5: '5. Težina i metabolizam',
    body5:
      'Metabolizam se u ovom razdoblju može neznatno usporiti, a raspodjela masnog tkiva ima tendenciju pomaknuti se prema trbuhu. Te su promjene česte i ne ovise samo o snazi volje.',
    h6: '6. Česti mitovi o menopauzi',
    myths: [
      'Menopauza „nastupa odjednom“ — u stvarnosti joj prethodi nekoliko godina prijelaza (perimenopauza)',
      'Svi su simptomi teški za sve — njihov se intenzitet jako razlikuje od žene do žene',
      'Ništa se ne može učiniti — postoje mnoga rješenja, hormonska i nehormonska, koja ublažavaju smetajuće simptome',
      'Intimni život završava — mijenja se, ali uz prave prilagodbe ostaje potpuno moguć i ispunjavajući',
    ],
    h7: '7. Normalni simptomi i znakovi na koje treba paziti',
    body7:
      'Velika većina ovdje opisanih promjena normalne su manifestacije prijelaza. Međutim, određeni znakovi zahtijevaju žurnu medicinsku pomoć.',
    alert2Title: 'Posjeti ljekara ako',
    alert2Text:
      'Imaš krvarenje nakon potvrđene menopauze, neobičnu bol u zdjelici, simptome koji znatno remete svakodnevni život ili bilo kakvu trajnu nedoumicu.',
    h8: '8. Praktični svakodnevni savjeti',
    dailyHabits: [
      'Ishrana bogata kalcijem i vlaknima',
      'Redovita tjelesna aktivnost',
      'Stabilna rutina spavanja',
      'Svakodnevni trenuci opuštanja',
    ],
    h9: '9. Ključne poruke',
    tip3Title: 'Dobro je znati',
    tip3Text:
      'Perimenopauza i menopauza prirodne su faze, a ne bolest. Postoje mnoga rješenja koja ti pomažu da ovaj prijelaz proživiš ugodnije: zdravstveni radnik ostaje najbolji izvor za njihovu prilagodbu tvojoj situaciji.',
    shareMessage: 'Razumijevanje prijelaza u menopauzu — AWA',
  },
  sl: {
    badge: 'PERIMENOPAVZA IN MENOPAVZA',
    title: 'Razumevanje prehoda v menopavzo',
    metaDuration: '10 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Začetnica',
    metaValidated: 'Preverjena vsebina',
    intro:
      'Kaj se postopoma spreminja leta pred prenehanjem menstruacije in kako tej fazi pristopiti z več jasnosti.',
    contentsTitle: 'V tem članku',
    topics: [
      'Perimenopavza in menopavza: definicije',
      'Vse nerednejši cikli',
      'Spanje in razpoloženje',
      'Intimnost in suhost nožnice',
      'Teža in presnova',
      'Pogosti miti o menopavzi',
      'Normalni simptomi in znaki, na katere je treba paziti',
      'Praktični vsakodnevni nasveti',
      'Ključna sporočila',
    ],
    h1: '1. Perimenopavza in menopavza: definicije',
    body1a:
      'Perimenopavza pomeni obdobje hormonskega prehoda, ki je pred menopavzo: lahko se začne več let prej, na splošno od štiridesetih let naprej, z nepravilnim nihanjem ravni estrogena.',
    body1b:
      'Menopavza je nasprotno natančno določen trenutek: potrdi se po 12 zaporednih mesecih brez menstruacije, brez drugega vzroka. V Franciji nastopi v povprečju okoli 51. leta, čeprav se ta starost naravno razlikuje od ženske do ženske.',
    tip1Title: 'Vredno vedeti',
    tip1Text:
      'Vsaka ženska ta prehod doživlja drugače, tako po trajanju kot po intenzivnosti simptomov. Odprt pogovor o tem ti pomaga, da ga bolje predvidiš.',
    h2: '2. Vse nerednejši cikli',
    body2:
      'Eden prvih znakov perimenopavze je pogosto sprememba ritma cikla: cikli lahko postanejo krajši, daljši, bolj razmaknjeni ali imajo drugačen tok iz meseca v mesec.',
    alert1Title: 'Opomba',
    alert1Text:
      'Zelo obilna krvavitev, krvavitev, ki se pojavlja zelo blizu ena druge, ali krvavitev po letu dni brez menstruacije zahteva zdravniški nasvet, saj se ne štejejo za tipične znake prehoda.',
    h3: '3. Spanje in razpoloženje',
    body3a:
      'Upad in nihanje estrogena in progesterona lahko motita spanec (uspavanje, prebujanje ponoči) in ju lahko spremljajo razdražljivost, tesnoba ali nenavadne spremembe razpoloženja.',
    body3b:
      'Te spremembe imajo resnično biološko razlago: ne odražajo niti pomanjkanja volje niti izolirane psihološke težave.',
    h4: '4. Intimnost in suhost nožnice',
    body4:
      'Upad estrogena lahko privede do suhosti nožnice, ki včasih povzroča nelagodje ali bolečino med spolnim odnosom. Tudi želja se lahko spremeni, poveča ali zmanjša, odvisno od ženske.',
    tip2Title: 'Vredno vedeti',
    tip2Text:
      'Obstajajo preproste rešitve (lubrikanti, vaginalni vlažilci, lokalna zdravljenja): pogovor z zdravstvenim delavcem ti lahko pomaga najti pravo rešitev, brez tabujev.',
    h5: '5. Teža in presnova',
    body5:
      'Presnova se lahko v tem obdobju rahlo upočasni, porazdelitev maščobnega tkiva pa ima tendenco premakniti se proti trebuhu. Te spremembe so pogoste in niso odvisne samo od moči volje.',
    h6: '6. Pogosti miti o menopavzi',
    myths: [
      'Menopavza „nastopi naenkrat“ — v resnici ji predhaja več let prehoda (perimenopavza)',
      'Vsi simptomi so težki pri vseh — njihova intenzivnost se zelo razlikuje od ženske do ženske',
      'Nič se ne da storiti — obstaja veliko rešitev, hormonskih in nehormonskih, ki lajšajo moteče simptome',
      'Intimno življenje se konča — spreminja se, a ob pravih prilagoditvah ostaja povsem mogoče in izpolnjujoče',
    ],
    h7: '7. Normalni simptomi in znaki, na katere je treba paziti',
    body7:
      'Velika večina tukaj opisanih sprememb so normalne manifestacije prehoda. Vendar nekateri znaki zahtevajo nujno zdravniško pomoč.',
    alert2Title: 'Obišči zdravnika, če',
    alert2Text:
      'Imaš krvavitev po potrjeni menopavzi, nenavadno bolečino v mednožju, simptome, ki pomembno motijo vsakdanje življenje, ali kakršen koli trajen dvom.',
    h8: '8. Praktični vsakodnevni nasveti',
    dailyHabits: [
      'Prehrana, bogata s kalcijem in vlakninami',
      'Redna telesna dejavnost',
      'Stabilna rutina spanja',
      'Vsakodnevni trenutki sproščanja',
    ],
    h9: '9. Ključna sporočila',
    tip3Title: 'Vredno vedeti',
    tip3Text:
      'Perimenopavza in menopavza sta naravni fazi, ne bolezen. Obstajajo številne rešitve, ki ti pomagajo ta prehod doživeti udobneje: zdravstveni delavec ostaja najboljši vir za njihovo prilagoditev tvoji situaciji.',
    shareMessage: 'Razumevanje prehoda v menopavzo — AWA',
  },
  ne: {
    badge: 'पेरिमेनोपज र रजोनिवृत्ति',
    title: 'रजोनिवृत्तिको संक्रमण बुझ्नुहोस्',
    metaDuration: '10 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'सुरुवाती',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro:
      'महिनावारी बन्द हुनुभन्दा वर्षौँ अघिदेखि बिस्तारै के बदलिन्छ, र यो चरणलाई थप स्पष्टतासाथ कसरी सामना गर्ने।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'पेरिमेनोपज र रजोनिवृत्ति: परिभाषाहरू',
      'झन्झन् अनियमित हुँदै जाने चक्रहरू',
      'निद्रा र मनोदशा',
      'सामीप्य र योनि सुक्खापन',
      'तौल र मेटाबोलिजम',
      'रजोनिवृत्तिबारे सामान्य भ्रमहरू',
      'सामान्य लक्षणहरू र ध्यान दिनुपर्ने संकेतहरू',
      'व्यावहारिक दैनिक सुझावहरू',
      'मुख्य कुराहरू',
    ],
    h1: '1. पेरिमेनोपज र रजोनिवृत्ति: परिभाषाहरू',
    body1a:
      'पेरिमेनोपजले रजोनिवृत्तिभन्दा पहिलेको हर्मोनल संक्रमण अवधिलाई जनाउँछ: यो धेरै वर्षअघिदेखि, सामान्यतया चालीसको दशकदेखि सुरु हुन सक्छ, जहाँ एस्ट्रोजेनको स्तर अनियमित रूपमा उतारचढाव हुन्छ।',
    body1b:
      'अर्कोतर्फ, रजोनिवृत्ति एउटा निश्चित क्षण हो: अन्य कुनै कारणबिना लगातार 12 महिना महिनावारी नआएपछि यो पुष्टि हुन्छ। फ्रान्समा यो औसतमा करिब 51 वर्षको उमेरमा हुन्छ, यद्यपि यो उमेर महिलैपिच्छे स्वाभाविक रूपमा फरक हुन्छ।',
    tip1Title: 'जान्न लायक',
    tip1Text:
      'हरेक महिलाले यो संक्रमण फरक ढङ्गले अनुभव गर्छिन्, अवधि र लक्षणको तीव्रता दुवैमा। यसबारे खुलेर कुरा गर्नाले तपाईंलाई यसको राम्रो पूर्वानुमान गर्न मद्दत गर्छ।',
    h2: '2. झन्झन् अनियमित हुँदै जाने चक्रहरू',
    body2:
      'पेरिमेनोपजका पहिला संकेतहरूमध्ये एउटा प्रायः चक्रको लयमा परिवर्तन हो: चक्रहरू छोटा, लामा, बढी टाढा-टाढा हुन सक्छन्, वा एक महिनादेखि अर्कोमा फरक बहाव हुन सक्छ।',
    alert1Title: 'कृपया ध्यान दिनुहोस्',
    alert1Text:
      'निकै धेरै रक्तस्राव, धेरै नजिक-नजिक हुने रक्तस्राव, वा एक वर्ष महिनावारी नआएपछि हुने रक्तस्रावले चिकित्सकीय सल्लाह चाहिन्छ, किनभने ती संक्रमणका सामान्य संकेत मानिँदैनन्।',
    h3: '3. निद्रा र मनोदशा',
    body3a:
      'एस्ट्रोजेन र प्रोजेस्टेरोनको घटाइ र उतारचढावले निद्रा बिगार्न सक्छ (निदाउन, रातमा ब्युँझन) र त्यससँगै चिडचिडाहट, चिन्ता वा असामान्य मनोदशाको उतारचढाव आउन सक्छ।',
    body3b:
      'यी परिवर्तनहरूको वास्तविक जैविक व्याख्या छ: तिनले इच्छाशक्तिको कमी वा एकल मनोवैज्ञानिक समस्यालाई प्रतिबिम्बित गर्दैनन्।',
    h4: '4. सामीप्य र योनि सुक्खापन',
    body4:
      'एस्ट्रोजेनको घटाइले योनि सुक्खापन निम्त्याउन सक्छ, जसले कहिलेकाहीँ सम्भोगको समयमा असहजता वा दुखाइ गराउँछ। चाहना पनि महिलाअनुसार बढ्न वा घट्न सक्छ।',
    tip2Title: 'जान्न लायक',
    tip2Text:
      'सरल समाधानहरू छन् (ल्युब्रिकेन्ट, योनि मोइस्चराइजर, स्थानीय उपचार): स्वास्थ्यकर्मीसँग कुरा गर्दा, कुनै वर्जनाबिना, तपाईंलाई सही समाधान भेट्टाउन मद्दत गर्न सक्छ।',
    h5: '5. तौल र मेटाबोलिजम',
    body5:
      'यो अवधिमा मेटाबोलिजम अलिकति सुस्त हुन सक्छ, र बोसोको वितरण पेटतिर सर्ने प्रवृत्ति हुन्छ। यी परिवर्तनहरू सामान्य छन् र केवल इच्छाशक्तिमा निर्भर गर्दैनन्।',
    h6: '6. रजोनिवृत्तिबारे सामान्य भ्रमहरू',
    myths: [
      'रजोनिवृत्ति "एकै पटक हुन्छ" — वास्तवमा, यसअघि धेरै वर्षको संक्रमण (पेरिमेनोपज) हुन्छ',
      'सबै लक्षण सबैका लागि गम्भीर हुन्छन् — तिनको तीव्रता महिलैपिच्छे निकै फरक हुन्छ',
      'केही गर्न सकिँदैन — असहज लक्षण कम गर्न हर्मोनल वा गैर-हर्मोनल धेरै समाधान छन्',
      'निजी जीवन समाप्त हुन्छ — यो बदलिन्छ, तर सही मिलानसँग पूर्ण रूपमा सम्भव र सन्तोषजनक रहन्छ',
    ],
    h7: '7. सामान्य लक्षणहरू र ध्यान दिनुपर्ने संकेतहरू',
    body7:
      'यहाँ वर्णन गरिएका अधिकांश परिवर्तनहरू संक्रमणका सामान्य अभिव्यक्ति हुन्। तथापि, केही संकेतहरूले तुरुन्तै चिकित्सकीय ध्यान चाहिन्छ।',
    alert2Title: 'यस्तो भए चिकित्सकलाई देखाउनुहोस्',
    alert2Text:
      'पुष्टि भएको रजोनिवृत्तिपछि रक्तस्राव, असामान्य पेल्भिक दुखाइ, दैनिक जीवनमा ठूलो बाधा पुर्‍याउने लक्षणहरू, वा कुनै लगातार शङ्का।',
    h8: '8. व्यावहारिक दैनिक सुझावहरू',
    dailyHabits: [
      'क्यालसियम र रेशा भरपूर खानपान',
      'नियमित शारीरिक गतिविधि',
      'स्थिर निद्राको दिनचर्या',
      'दैनिक आरामका क्षणहरू',
    ],
    h9: '9. मुख्य कुराहरू',
    tip3Title: 'जान्न लायक',
    tip3Text:
      'पेरिमेनोपज र रजोनिवृत्ति स्वाभाविक चरणहरू हुन्, बिमारी होइनन्। यो संक्रमणलाई अझ सहज रूपमा पार गर्न मद्दत गर्ने धेरै समाधानहरू छन्: तिनलाई तपाईंको अवस्थाअनुसार मिलाउन स्वास्थ्यकर्मी नै सबैभन्दा राम्रो स्रोत रहन्छन्।',
    shareMessage: 'रजोनिवृत्तिको संक्रमण बुझ्नुहोस् — AWA',
  },
  si: {
    badge: 'පෙරි-ඔසප් නැවතීම සහ ඔසප් නැවතීම',
    title: 'ඔසප් නැවතීමේ සංක්‍රාන්තිය තේරුම් ගැනීම',
    metaDuration: 'කියවීමට මිනිත්තු 10',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro:
      'ඔසප් නතර වීමට වසර ගණනාවකට පෙර ක්‍රමයෙන් වෙනස් වන්නේ කුමක්ද, සහ වඩා පැහැදිලි බවකින් මෙම අවධියට ළඟා වන්නේ කෙසේද.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'පෙරි-ඔසප් නැවතීම සහ ඔසප් නැවතීම: අර්ථ දැක්වීම්',
      'වැඩි වැඩියෙන් අක්‍රමවත් වන චක්‍ර',
      'නින්ද සහ මනෝභාවය',
      'සමීප සබඳතා සහ යෝනි වියළීම',
      'බර සහ පරිවෘත්තිය',
      'ඔසප් නැවතීම පිළිබඳ පොදු මිථ්‍යා විශ්වාස',
      'සාමාන්‍ය රෝග ලක්ෂණ සහ අවධානයට ලක් කළ යුතු සලකුණු',
      'ප්‍රායෝගික එදිනෙදා ඉඟි',
      'ප්‍රධාන කරුණු',
    ],
    h1: '1. පෙරි-ඔසප් නැවතීම සහ ඔසප් නැවතීම: අර්ථ දැක්වීම්',
    body1a:
      'පෙරි-ඔසප් නැවතීම යනු ඔසප් නැවතීමට පෙර සිදුවන හෝමෝන සංක්‍රාන්ති කාලය දක්වයි: එය වසර කිහිපයකට පෙර, සාමාන්‍යයෙන් ඔබේ හතළිස් ගණන්වල සිට, එස්ට්‍රජන් මට්ටම් අක්‍රමවත් ලෙස උච්චාවචනය වෙමින් ආරම්භ විය හැක.',
    body1b:
      'ඔසප් නැවතීම, අනෙක් අතට, නිශ්චිත කාලයකි: එය වෙනත් හේතුවක් නොමැතිව ඔසප් නොමැතිව අඛණ්ඩ මාස 12කට පසු තහවුරු වේ. ප්‍රංශයේ, එය සාමාන්‍යයෙන් වයස 51ක් පමණ වන විට සිදුවන නමුත්, මෙම වයස කාන්තාවෙන් කාන්තාවට ස්වභාවිකවම වෙනස් වේ.',
    tip1Title: 'දැනගත යුතු දේ',
    tip1Text:
      'සෑම කාන්තාවක්ම මෙම සංක්‍රාන්තිය කාලය සහ රෝග ලක්ෂණවල තීව්‍රතාව යන දෙකෙන්ම වෙනස් ලෙස අත්විඳී. ඒ ගැන විවෘතව කතා කිරීම එය වඩා හොඳින් අපේක්ෂා කිරීමට උපකාරී වේ.',
    h2: '2. වැඩි වැඩියෙන් අක්‍රමවත් වන චක්‍ර',
    body2:
      'පෙරි-ඔසප් නැවතීමේ පළමු සලකුණුවලින් එකක් බොහෝ විට චක්‍ර රිද්මයේ වෙනසකි: චක්‍ර කෙටි, දිගු, වඩා පරතරයක් සහිත විය හැකිය, නැතහොත් මාසයෙන් මාසයට වෙනස් ගලනයක් තිබිය හැක.',
    alert1Title: 'කරුණාකර සටහන් කරන්න',
    alert1Text:
      'ඉතා වැඩි ලේ ගැලීම, ඉතා ළඟින් ඇතිවන ලේ ගැලීම, හෝ ඔසප් නොමැතිව වසරකට පසු සිදුවන ලේ ගැලීම වෛද්‍ය උපදෙස් ඉල්ලා සිටී, මන්ද මේවා සංක්‍රාන්තියේ සාමාන්‍ය සලකුණු ලෙස නොසැලකේ.',
    h3: '3. නින්ද සහ මනෝභාවය',
    body3a:
      'එස්ට්‍රජන් සහ ප්‍රොජෙස්ටරෝන්වල පහත වැටීම සහ උච්චාවචනය නින්ද (නින්ද යාම, රාත්‍රියේ අවදි වීම) කඩාකප්පල් කළ හැකි අතර, කෝපශීලී බව, කනස්සල්ල, හෝ අසාමාන්‍ය මනෝභාව උච්චාවචනයන් සමඟ සිදු විය හැක.',
    body3b:
      'මෙම වෙනස්කම්වලට සැබෑ ජීව විද්‍යාත්මක පැහැදිලි කිරීමක් ඇත: ඒවා කැමැත්ත නොමැතිකමක් හෝ හුදකලා මානසික ගැටලුවක් පිළිබිඹු නොකරයි.',
    h4: '4. සමීප සබඳතා සහ යෝනි වියළීම',
    body4:
      'එස්ට්‍රජන් පහත වැටීම යෝනි වියළීමට හේතු විය හැකි අතර, සමහර විට සංසර්ගයේදී අපහසුතාවයක් හෝ වේදනාවක් ඇති කරයි. ආශාවද, කාන්තාව අනුව, වැඩි වීමට හෝ අඩු වීමට වෙනස් විය හැක.',
    tip2Title: 'දැනගත යුතු දේ',
    tip2Text:
      'සරල විසඳුම් ඇත (ලිහිසි ද්‍රව්‍ය, යෝනි තෙතමනය ද්‍රව්‍ය, ස්ථානීය ප්‍රතිකාර): සෞඛ්‍ය වෘත්තිකයෙකු සමඟ කතා කිරීම, තහනමකින් තොරව, නිවැරදි විසඳුම සොයාගැනීමට ඔබට උපකාරී විය හැක.',
    h5: '5. බර සහ පරිවෘත්තිය',
    body5:
      'මෙම කාලය තුළ පරිවෘත්තිය තරමක් මන්දගාමී විය හැකි අතර, මේද ව්‍යාප්තිය උදරය දෙසට මාරු වීමට නැඹුරු වේ. මෙම වෙනස්කම් පොදු වන අතර කැමැත්ත මත පමණක් රඳා නොපවතී.',
    h6: '6. ඔසප් නැවතීම පිළිබඳ පොදු මිථ්‍යා විශ්වාස',
    myths: [
      'ඔසප් නැවතීම "එකවරම සිදුවේ" — සැබෑවටම, එයට පෙර වසර කිහිපයක සංක්‍රාන්තියක් (පෙරි-ඔසප් නැවතීම) ඇත',
      'සියලුම රෝග ලක්ෂණ සෑම කෙනෙකුටම දැඩියි — ඒවායේ තීව්‍රතාව කාන්තාවෙන් කාන්තාවට අතිවිශාල ලෙස වෙනස් වේ',
      'කිසිවක් කළ නොහැක — කරදර සහගත රෝග ලක්ෂණ සමනය කිරීමට හෝමෝන හෝ නොවන බොහෝ විසඳුම් ඇත',
      'සමීප ජීවිතය අවසන් වේ — එය වෙනස් වේ, නමුත් නිවැරදි සකස් කිරීම් සමඟ සම්පූර්ණයෙන්ම හැකි සහ තෘප්තිමත් ලෙස පවතී',
    ],
    h7: '7. සාමාන්‍ය රෝග ලක්ෂණ සහ අවධානයට ලක් කළ යුතු සලකුණු',
    body7:
      'මෙහි විස්තර කර ඇති වෙනස්කම්වලින් බහුතරය සංක්‍රාන්තියේ සාමාන්‍ය ප්‍රකාශනයන්ය. කෙසේ වෙතත්, සමහර සලකුණුවලට කඩිනම් වෛද්‍ය අවධානයක් අවශ්‍යයි.',
    alert2Title: 'මෙසේ නම් වෛද්‍යවරයෙකු හමුවන්න',
    alert2Text:
      'තහවුරු කළ ඔසප් නැවතීමෙන් පසු ලේ ගැලීම, අසාමාන්‍ය ශ්‍රෝණි වේදනාව, එදිනෙදා ජීවිතය සැලකිය යුතු ලෙස කඩාකප්පල් කරන රෝග ලක්ෂණ, හෝ ඕනෑම දිගටම පවතින සැකයක්.',
    h8: '8. ප්‍රායෝගික එදිනෙදා ඉඟි',
    dailyHabits: [
      'කැල්සියම් සහ තන්තු බහුල ආහාර වේලක්',
      'නිතිපතා ශාරීරික ක්‍රියාකාරකම',
      'ස්ථාවර නින්ද පුරුද්දක්',
      'දෛනික ලිහිල් වීමේ මොහොතවල්',
    ],
    h9: '9. ප්‍රධාන කරුණු',
    tip3Title: 'දැනගත යුතු දේ',
    tip3Text:
      'පෙරි-ඔසප් නැවතීම සහ ඔසප් නැවතීම රෝගයක් නොව ස්වාභාවික අවධි වේ. මෙම සංක්‍රාන්තිය වඩා සුවපහසුවෙන් ගත කිරීමට ඔබට උපකාර කිරීමට බොහෝ විසඳුම් ඇත: ඒවා ඔබේ තත්ත්වයට සකස් කිරීමට සෞඛ්‍ය වෘත්තිකයෙකු හොඳම සම්පතයි.',
    shareMessage: 'ඔසප් නැවතීමේ සංක්‍රාන්තිය තේරුම් ගැනීම — AWA',
  },
  th: {
    badge: 'ช่วงใกล้หมดประจำเดือนและวัยหมดประจำเดือน',
    title: 'ทำความเข้าใจช่วงเปลี่ยนผ่านสู่วัยหมดประจำเดือน',
    metaDuration: 'อ่าน 10 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro:
      'สิ่งที่ค่อย ๆ เปลี่ยนไปหลายปีก่อนประจำเดือนจะหยุด และวิธีเข้าหาช่วงนี้ด้วยความชัดเจนยิ่งขึ้น',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'ช่วงใกล้หมดประจำเดือนและวัยหมดประจำเดือน: คำนิยาม',
      'รอบเดือนที่ไม่สม่ำเสมอมากขึ้น',
      'การนอนหลับและอารมณ์',
      'ความใกล้ชิดและช่องคลอดแห้ง',
      'น้ำหนักและการเผาผลาญ',
      'ความเชื่อผิด ๆ ที่พบบ่อยเกี่ยวกับวัยหมดประจำเดือน',
      'อาการปกติและสัญญาณที่ควรสังเกต',
      'เคล็ดลับเชิงปฏิบัติในชีวิตประจำวัน',
      'ประเด็นสำคัญ',
    ],
    h1: '1. ช่วงใกล้หมดประจำเดือนและวัยหมดประจำเดือน: คำนิยาม',
    body1a:
      'ช่วงใกล้หมดประจำเดือนหมายถึงช่วงเปลี่ยนผ่านทางฮอร์โมนที่เกิดก่อนวัยหมดประจำเดือน: อาจเริ่มหลายปีก่อน โดยทั่วไปตั้งแต่อายุสี่สิบเป็นต้นไป โดยระดับเอสโตรเจนผันผวนอย่างไม่สม่ำเสมอ',
    body1b:
      'ส่วนวัยหมดประจำเดือนเป็นจุดเวลาที่เฉพาะเจาะจง: ยืนยันหลังไม่มีประจำเดือนติดต่อกัน 12 เดือน โดยไม่มีสาเหตุอื่น ในฝรั่งเศส เกิดเฉลี่ยราวอายุ 51 ปี แม้อายุนี้ย่อมต่างกันไปในผู้หญิงแต่ละคน',
    tip1Title: 'ควรรู้',
    tip1Text:
      'ผู้หญิงแต่ละคนผ่านช่วงเปลี่ยนผ่านนี้ต่างกัน ทั้งระยะเวลาและความรุนแรงของอาการ การพูดคุยอย่างเปิดเผยช่วยให้คุณเตรียมรับมือได้ดีขึ้น',
    h2: '2. รอบเดือนที่ไม่สม่ำเสมอมากขึ้น',
    body2:
      'หนึ่งในสัญญาณแรกของช่วงใกล้หมดประจำเดือนมักเป็นการเปลี่ยนจังหวะของรอบเดือน: รอบเดือนอาจสั้นลง ยาวขึ้น ห่างขึ้น หรือมีปริมาณต่างกันจากเดือนหนึ่งไปอีกเดือนหนึ่ง',
    alert1Title: 'โปรดทราบ',
    alert1Text:
      'เลือดออกมากผิดปกติ เลือดออกถี่มาก หรือเลือดออกหลังไม่มีประจำเดือนมาหนึ่งปี ต้องขอคำแนะนำทางการแพทย์ เพราะไม่ถือเป็นสัญญาณทั่วไปของช่วงเปลี่ยนผ่าน',
    h3: '3. การนอนหลับและอารมณ์',
    body3a:
      'การลดลงและความผันผวนของเอสโตรเจนและโปรเจสเตอโรนอาจรบกวนการนอน (หลับยาก ตื่นกลางดึก) และอาจมาพร้อมกับความหงุดหงิด ความวิตกกังวล หรืออารมณ์แปรปรวนผิดปกติ',
    body3b:
      'การเปลี่ยนแปลงเหล่านี้มีคำอธิบายทางชีววิทยาที่แท้จริง: ไม่ได้สะท้อนการขาดความตั้งใจ หรือปัญหาทางจิตใจที่โดดเดี่ยว',
    h4: '4. ความใกล้ชิดและช่องคลอดแห้ง',
    body4:
      'การลดลงของเอสโตรเจนอาจทำให้ช่องคลอดแห้ง บางครั้งทำให้ไม่สบายหรือเจ็บขณะมีเพศสัมพันธ์ ความต้องการก็อาจเปลี่ยนไป ทั้งเพิ่มขึ้นหรือลดลง ขึ้นกับผู้หญิงแต่ละคน',
    tip2Title: 'ควรรู้',
    tip2Text:
      'มีวิธีแก้ง่าย ๆ (สารหล่อลื่น ครีมให้ความชุ่มชื้นช่องคลอด การรักษาเฉพาะที่): การพูดคุยกับบุคลากรทางการแพทย์ช่วยให้คุณหาวิธีที่เหมาะสมได้ โดยไม่มีข้อห้าม',
    h5: '5. น้ำหนักและการเผาผลาญ',
    body5:
      'การเผาผลาญอาจช้าลงเล็กน้อยในช่วงนี้ และการกระจายของไขมันมีแนวโน้มเปลี่ยนไปที่หน้าท้อง การเปลี่ยนแปลงเหล่านี้พบบ่อยและไม่ได้ขึ้นกับความตั้งใจเพียงอย่างเดียว',
    h6: '6. ความเชื่อผิด ๆ ที่พบบ่อยเกี่ยวกับวัยหมดประจำเดือน',
    myths: [
      'วัยหมดประจำเดือน "เกิดขึ้นทีเดียว" — ในความเป็นจริงมีช่วงเปลี่ยนผ่านหลายปีก่อนหน้า (ช่วงใกล้หมดประจำเดือน)',
      'ทุกคนมีอาการรุนแรงทั้งหมด — ความรุนแรงแตกต่างกันมากในผู้หญิงแต่ละคน',
      'ไม่มีอะไรทำได้ — มีวิธีแก้มากมาย ทั้งที่ใช้ฮอร์โมนและไม่ใช้ เพื่อบรรเทาอาการที่รบกวน',
      'ชีวิตคู่จบลง — เปลี่ยนไป แต่ยังเป็นไปได้อย่างสมบูรณ์และเติมเต็มได้ด้วยการปรับที่เหมาะสม',
    ],
    h7: '7. อาการปกติและสัญญาณที่ควรสังเกต',
    body7:
      'การเปลี่ยนแปลงที่อธิบายไว้ที่นี่ส่วนใหญ่เป็นอาการปกติของช่วงเปลี่ยนผ่าน อย่างไรก็ตาม สัญญาณบางอย่างต้องได้รับการดูแลทางการแพทย์โดยเร็ว',
    alert2Title: 'พบแพทย์หาก',
    alert2Text:
      'เลือดออกหลังยืนยันวัยหมดประจำเดือนแล้ว ปวดอุ้งเชิงกรานผิดปกติ อาการที่รบกวนชีวิตประจำวันอย่างมาก หรือความสงสัยใด ๆ ที่คงอยู่',
    h8: '8. เคล็ดลับเชิงปฏิบัติในชีวิตประจำวัน',
    dailyHabits: [
      'อาหารที่อุดมด้วยแคลเซียมและใยอาหาร',
      'กิจกรรมทางกายสม่ำเสมอ',
      'กิจวัตรการนอนที่คงที่',
      'ช่วงเวลาผ่อนคลายทุกวัน',
    ],
    h9: '9. ประเด็นสำคัญ',
    tip3Title: 'ควรรู้',
    tip3Text:
      'ช่วงใกล้หมดประจำเดือนและวัยหมดประจำเดือนเป็นระยะตามธรรมชาติ ไม่ใช่โรค มีวิธีแก้มากมายที่ช่วยให้คุณผ่านช่วงเปลี่ยนผ่านนี้ได้สบายขึ้น: บุคลากรทางการแพทย์ยังคงเป็นแหล่งที่ดีที่สุดในการปรับให้เหมาะกับสถานการณ์ของคุณ',
    shareMessage: 'ทำความเข้าใจช่วงเปลี่ยนผ่านสู่วัยหมดประจำเดือน — AWA',
  },
  vi: {
    badge: 'TIỀN MÃN KINH & MÃN KINH',
    title: 'Hiểu về giai đoạn chuyển tiếp mãn kinh',
    metaDuration: '10 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung đã được thẩm định',
    intro:
      'Những gì dần thay đổi, từ nhiều năm trước khi kỳ kinh ngừng, và cách đón nhận giai đoạn này một cách rõ ràng hơn.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Tiền mãn kinh và mãn kinh: định nghĩa',
      'Chu kỳ ngày càng không đều',
      'Giấc ngủ và tâm trạng',
      'Đời sống tình dục và khô âm đạo',
      'Cân nặng và chuyển hóa',
      'Những lầm tưởng thường gặp về mãn kinh',
      'Triệu chứng bình thường và dấu hiệu cần chú ý',
      'Mẹo thực tế hằng ngày',
      'Những điểm chính cần nhớ',
    ],
    h1: '1. Tiền mãn kinh và mãn kinh: định nghĩa',
    body1a:
      'Tiền mãn kinh là giai đoạn chuyển tiếp nội tiết diễn ra trước mãn kinh: nó có thể bắt đầu nhiều năm trước đó, thường từ độ tuổi bốn mươi trở đi, khi nồng độ estrogen dao động không đều.',
    body1b:
      'Ngược lại, mãn kinh là một thời điểm cụ thể: nó được xác nhận sau 12 tháng liên tiếp không có kinh, không do nguyên nhân nào khác. Ở Pháp, mãn kinh xảy ra trung bình vào khoảng 51 tuổi, dù độ tuổi này tự nhiên khác nhau giữa từng phụ nữ.',
    tip1Title: 'Nên biết',
    tip1Text:
      'Mỗi phụ nữ trải qua giai đoạn chuyển tiếp này theo cách khác nhau, cả về thời gian lẫn cường độ triệu chứng. Nói chuyện cởi mở về điều đó giúp bạn chuẩn bị tốt hơn.',
    h2: '2. Chu kỳ ngày càng không đều',
    body2:
      'Một trong những dấu hiệu đầu tiên của tiền mãn kinh thường là sự thay đổi nhịp điệu chu kỳ: chu kỳ có thể ngắn hơn, dài hơn, thưa hơn hoặc có lượng kinh khác nhau từ tháng này sang tháng khác.',
    alert1Title: 'Xin lưu ý',
    alert1Text:
      'Ra máu rất nhiều, ra máu các lần cách nhau rất gần, hoặc ra máu sau một năm không có kinh cần lời khuyên y khoa, vì đây không được coi là dấu hiệu điển hình của giai đoạn chuyển tiếp.',
    h3: '3. Giấc ngủ và tâm trạng',
    body3a:
      'Sự suy giảm và dao động của estrogen và progesterone có thể làm rối loạn giấc ngủ (khó đi vào giấc ngủ, thức giấc giữa đêm) và có thể đi kèm cáu gắt, lo âu hoặc thay đổi tâm trạng bất thường.',
    body3b:
      'Những thay đổi này có lời giải thích sinh học thực sự: chúng không phản ánh sự thiếu ý chí hay một vấn đề tâm lý đơn lẻ.',
    h4: '4. Đời sống tình dục và khô âm đạo',
    body4:
      'Sự suy giảm estrogen có thể dẫn đến khô âm đạo, đôi khi gây khó chịu hoặc đau khi quan hệ. Ham muốn cũng có thể thay đổi, tăng lên hoặc giảm đi, tùy từng phụ nữ.',
    tip2Title: 'Nên biết',
    tip2Text:
      'Có những giải pháp đơn giản (gel bôi trơn, kem dưỡng ẩm âm đạo, điều trị tại chỗ): nói chuyện với nhân viên y tế có thể giúp bạn tìm giải pháp phù hợp, không e ngại.',
    h5: '5. Cân nặng và chuyển hóa',
    body5:
      'Chuyển hóa có thể chậm lại đôi chút trong giai đoạn này, và sự phân bố mỡ có xu hướng chuyển về vùng bụng. Những thay đổi này là phổ biến và không chỉ phụ thuộc vào ý chí.',
    h6: '6. Những lầm tưởng thường gặp về mãn kinh',
    myths: [
      'Mãn kinh "xảy ra một lần là xong" — thực tế, nó được báo trước bởi nhiều năm chuyển tiếp (tiền mãn kinh)',
      'Mọi triệu chứng đều nặng với tất cả mọi người — cường độ của chúng khác nhau rất nhiều giữa từng phụ nữ',
      'Không thể làm gì được — có nhiều giải pháp, dùng hormone hoặc không, để làm dịu các triệu chứng khó chịu',
      'Đời sống tình dục chấm dứt — nó thay đổi, nhưng vẫn hoàn toàn có thể và trọn vẹn với những điều chỉnh phù hợp',
    ],
    h7: '7. Triệu chứng bình thường và dấu hiệu cần chú ý',
    body7:
      'Đại đa số các thay đổi được mô tả ở đây là biểu hiện bình thường của giai đoạn chuyển tiếp. Tuy nhiên, một số dấu hiệu cần được chăm sóc y tế kịp thời.',
    alert2Title: 'Hãy đi khám bác sĩ nếu',
    alert2Text:
      'Ra máu sau khi đã xác nhận mãn kinh, đau vùng chậu bất thường, các triệu chứng làm gián đoạn đáng kể cuộc sống hằng ngày, hoặc bất kỳ nghi ngờ kéo dài nào.',
    h8: '8. Mẹo thực tế hằng ngày',
    dailyHabits: [
      'Chế độ ăn giàu canxi và chất xơ',
      'Hoạt động thể chất đều đặn',
      'Thói quen ngủ ổn định',
      'Những khoảnh khắc thư giãn mỗi ngày',
    ],
    h9: '9. Những điểm chính cần nhớ',
    tip3Title: 'Nên biết',
    tip3Text:
      'Tiền mãn kinh và mãn kinh là những giai đoạn tự nhiên, không phải bệnh. Có nhiều giải pháp giúp bạn trải qua giai đoạn chuyển tiếp này thoải mái hơn: nhân viên y tế vẫn là nguồn tốt nhất để điều chỉnh chúng cho phù hợp với tình huống của bạn.',
    shareMessage: 'Hiểu về giai đoạn chuyển tiếp mãn kinh — AWA',
  },
  uz: {
    badge: 'PERIMENOPAUZA VA MENOPAUZA',
    title: 'Menopauza oʻtish davrini tushunish',
    metaDuration: '10 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Tasdiqlangan kontent',
    intro:
      'Hayz toʻxtashidan bir necha yil oldin nimalar asta-sekin oʻzgaradi va bu bosqichga qanday aniqroq yondashish kerak.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Perimenopauza va menopauza: taʼriflar',
      'Tobora notekis sikllar',
      'Uyqu va kayfiyat',
      'Intim salomatlik va qin quruqligi',
      'Vazn va metabolizm',
      'Menopauza haqida keng tarqalgan afsonalar',
      'Normal alomatlar va eʼtibor berish kerak boʻlgan belgilar',
      'Kundalik amaliy maslahatlar',
      'Asosiy xulosalar',
    ],
    h1: '1. Perimenopauza va menopauza: taʼriflar',
    body1a:
      'Perimenopauza menopauzadan oldingi gormonal oʻtish davrini bildiradi: u bir necha yil oldin, odatda qirq yoshdan boshlab, estrogen darajasi notekis tebranishi bilan boshlanishi mumkin.',
    body1b:
      'Menopauza esa muayyan vaqt nuqtasi: u boshqa sababsiz ketma-ket 12 oy hayz boʻlmagandan keyin tasdiqlanadi. Fransiyada u oʻrtacha taxminan 51 yoshda sodir boʻladi, garchi bu yosh tabiiy ravishda ayoldan ayolga farq qilsa ham.',
    tip1Title: 'Bilish foydali',
    tip1Text:
      'Har bir ayol bu oʻtish davrini, ham davomiyligi, ham alomatlar kuchi jihatidan, boshqacha boshdan kechiradi. Bu haqda ochiq gaplashish uni yaxshiroq oldindan sezishga yordam beradi.',
    h2: '2. Tobora notekis sikllar',
    body2:
      'Perimenopauzaning birinchi belgilaridan biri koʻpincha sikl ritmining oʻzgarishi: sikllar qisqaroq, uzunroq, kamroq uchraydigan boʻlishi yoki oyma-oy boshqacha oqimga ega boʻlishi mumkin.',
    alert1Title: 'Eʼtibor bering',
    alert1Text:
      'Juda koʻp qon ketishi, bir-biriga juda yaqin sodir boʻladigan qon ketishi yoki hayzsiz bir yildan keyin sodir boʻladigan qon ketishi tibbiy maslahatni talab qiladi, chunki ular oʻtish davrining odatiy belgilari hisoblanmaydi.',
    h3: '3. Uyqu va kayfiyat',
    body3a:
      'Estrogen va progesteronning pasayishi va tebranishlari uyquni (uxlab qolish, tunda uygʻonish) buzishi va jizzakilik, xavotir yoki odatdan tashqari kayfiyat oʻzgarishlari bilan birga kelishi mumkin.',
    body3b:
      'Bu oʻzgarishlarning haqiqiy biologik izohi bor: ular irodaning yetishmasligini ham, yakka psixologik muammoni ham aks ettirmaydi.',
    h4: '4. Intim salomatlik va qin quruqligi',
    body4:
      'Estrogenning pasayishi qin quruqligiga olib kelishi, baʼzan jinsiy aloqa paytida noqulaylik yoki ogʻriq keltirib chiqarishi mumkin. Istak ham ayolga qarab ortishi yoki kamayishi mumkin.',
    tip2Title: 'Bilish foydali',
    tip2Text:
      'Oddiy yechimlar mavjud (moylovchi vositalar, qin namlagichlari, mahalliy davolanishlar): sogʻliqni saqlash mutaxassisi bilan gaplashish tabusiz toʻgʻri yechimni topishga yordam beradi.',
    h5: '5. Vazn va metabolizm',
    body5:
      'Bu davrda metabolizm biroz sekinlashishi mumkin va yogʻ taqsimoti qorin tomon siljishga moyil. Bu oʻzgarishlar keng tarqalgan va faqat irodaga bogʻliq emas.',
    h6: '6. Menopauza haqida keng tarqalgan afsonalar',
    myths: [
      'Menopauza “birdan sodir boʻladi” — aslida unga bir necha yillik oʻtish davri (perimenopauza) oldin keladi',
      'Barcha alomatlar hamma uchun ogʻir — ularning kuchi ayoldan ayolga juda farq qiladi',
      'Hech narsa qilib boʻlmaydi — bezovta qiladigan alomatlarni yengillashtirish uchun gormonal yoki gormonsiz koʻplab yechimlar mavjud',
      'Intim hayot tugaydi — u oʻzgaradi, lekin toʻgʻri moslashuvlar bilan mutlaqo mumkin va mazmunli boʻlib qoladi',
    ],
    h7: '7. Normal alomatlar va eʼtibor berish kerak boʻlgan belgilar',
    body7:
      'Bu yerda tasvirlangan oʻzgarishlarning katta qismi oʻtish davrining normal koʻrinishlari. Biroq baʼzi belgilar zudlik bilan tibbiy eʼtiborni talab qiladi.',
    alert2Title: 'Quyidagi hollarda shifokorga boring',
    alert2Text:
      'Tasdiqlangan menopauzadan keyin qon ketishi, odatdan tashqari chanoq ogʻrigʻi, kundalik hayotni sezilarli buzadigan alomatlar yoki har qanday doimiy shubha.',
    h8: '8. Kundalik amaliy maslahatlar',
    dailyHabits: [
      'Kalsiy va tolaga boy ovqatlanish',
      'Muntazam jismoniy faollik',
      'Barqaror uxlash tartibi',
      'Kundalik boʻshashish lahzalari',
    ],
    h9: '9. Asosiy xulosalar',
    tip3Title: 'Bilish foydali',
    tip3Text:
      'Perimenopauza va menopauza tabiiy bosqichlar, kasallik emas. Bu oʻtish davrini qulayroq oʻtkazishga yordam beradigan koʻplab yechimlar mavjud: ularni vaziyatingizga moslashtirish uchun sogʻliqni saqlash mutaxassisi eng yaxshi manba boʻlib qoladi.',
    shareMessage: 'Menopauza oʻtish davrini tushunish — AWA',
  },
  az: {
    badge: 'PERİMENOPAUZA VƏ MENOPAUZA',
    title: 'Menopauza keçidini anlamaq',
    metaDuration: '10 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Yoxlanılmış məzmun',
    intro:
      'Aybaşı dayanmazdan illər əvvəl nələr tədricən dəyişir və bu mərhələyə daha aydın necə yanaşmaq olar.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Perimenopauza və menopauza: anlayışlar',
      'Getdikcə daha qeyri-müntəzəm dövrlər',
      'Yuxu və əhval',
      'İntimlik və vaginal quruluq',
      'Çəki və maddələr mübadiləsi',
      'Menopauza barədə geniş yayılmış miflər',
      'Normal simptomlar və diqqət ediləcək əlamətlər',
      'Praktik gündəlik məsləhətlər',
      'Əsas nəticələr',
    ],
    h1: '1. Perimenopauza və menopauza: anlayışlar',
    body1a:
      'Perimenopauza menopauzadan əvvəlki hormonal keçid dövrünə deyilir: o, bir neçə il əvvəl, adətən qırxlı yaşlardan başlaya bilər, bu zaman östrogen səviyyələri qeyri-müntəzəm dalğalanır.',
    body1b:
      'Menopauza isə konkret zaman nöqtəsidir: o, başqa səbəb olmadan ardıcıl 12 ay aybaşı olmadıqdan sonra təsdiqlənir. Fransada o, orta hesabla təxminən 51 yaşda baş verir, baxmayaraq ki, bu yaş qadından qadına təbii olaraq dəyişir.',
    tip1Title: 'Bilmək faydalıdır',
    tip1Text:
      'Hər qadın bu keçidi həm müddət, həm də simptomların intensivliyi baxımından fərqli yaşayır. Bu barədə açıq danışmaq onu daha yaxşı qabaqcadan görməyə kömək edir.',
    h2: '2. Getdikcə daha qeyri-müntəzəm dövrlər',
    body2:
      'Perimenopauzanın ilk əlamətlərindən biri çox vaxt dövr ritmində dəyişiklikdir: dövrlər daha qısa, daha uzun, daha seyrək ola və ya aydan aya fərqli axına malik ola bilər.',
    alert1Title: 'Nəzərə alın',
    alert1Text:
      'Çox bol qanaxma, bir-birinə çox yaxın baş verən qanaxma və ya bir il aybaşı olmadıqdan sonra baş verən qanaxma tibbi məsləhət tələb edir, çünki bunlar keçidin tipik əlamətləri sayılmır.',
    h3: '3. Yuxu və əhval',
    body3a:
      'Östrogen və progesteronun azalması və dalğalanmaları yuxunu (yuxuya getmə, gecə oyanmalar) poza bilər və əsəbilik, narahatlıq və ya qeyri-adi əhval dəyişkənliyi ilə müşayiət oluna bilər.',
    body3b:
      'Bu dəyişikliklərin real bioloji izahı var: onlar nə iradə çatışmazlığını, nə də təcrid olunmuş psixoloji problemi əks etdirir.',
    h4: '4. İntimlik və vaginal quruluq',
    body4:
      'Östrogenin azalması vaginal quruluğa səbəb ola bilər və bəzən cinsi əlaqə zamanı narahatlıq və ya ağrı yaradır. Arzu da qadından asılı olaraq ya artıb, ya da azala bilər.',
    tip2Title: 'Bilmək faydalıdır',
    tip2Text:
      'Sadə həllər mövcuddur (sürtkü vasitələri, vaginal nəmləndiricilər, lokal müalicələr): tibb işçisi ilə danışmaq tabu olmadan düzgün həlli tapmağa kömək edə bilər.',
    h5: '5. Çəki və maddələr mübadiləsi',
    body5:
      'Maddələr mübadiləsi bu dövrdə bir qədər ləngiyə bilər və piyin paylanması qarına doğru dəyişməyə meyllidir. Bu dəyişikliklər geniş yayılıb və yalnız iradədən asılı deyil.',
    h6: '6. Menopauza barədə geniş yayılmış miflər',
    myths: [
      'Menopauza "birdən baş verir" — əslində ondan əvvəl bir neçə illik keçid (perimenopauza) gəlir',
      'Bütün simptomlar hamı üçün şiddətlidir — onların intensivliyi qadından qadına xeyli dəyişir',
      'Heç nə etmək olmaz — narahatedici simptomları yüngülləşdirmək üçün hormonal və ya qeyri-hormonal çoxlu həll mövcuddur',
      'İntim həyat sona çatır — o, dəyişir, lakin uyğun tənzimləmələrlə tamamilə mümkün və dolğun qalır',
    ],
    h7: '7. Normal simptomlar və diqqət ediləcək əlamətlər',
    body7:
      'Burada təsvir olunan dəyişikliklərin böyük əksəriyyəti keçidin normal təzahürləridir. Lakin bəzi əlamətlər təcili tibbi diqqət tələb edir.',
    alert2Title: 'Bu hallarda həkimə müraciət edin',
    alert2Text:
      'Təsdiqlənmiş menopauzadan sonra qanaxma, qeyri-adi çanaq ağrısı, gündəlik həyatı əhəmiyyətli dərəcədə pozan simptomlar və ya hər hansı davamlı şübhə.',
    h8: '8. Praktik gündəlik məsləhətlər',
    dailyHabits: [
      'Kalsium və lifə zəngin qidalanma',
      'Müntəzəm fiziki fəaliyyət',
      'Sabit yuxu rutini',
      'Gündəlik rahatlama anları',
    ],
    h9: '9. Əsas nəticələr',
    tip3Title: 'Bilmək faydalıdır',
    tip3Text:
      'Perimenopauza və menopauza təbii mərhələlərdir, xəstəlik deyil. Bu keçidi daha rahat keçməyə kömək edəcək çoxlu həll mövcuddur: tibb işçisi onları vəziyyətinizə uyğunlaşdırmaq üçün ən yaxşı mənbə olaraq qalır.',
    shareMessage: 'Menopauza keçidini anlamaq — AWA',
  },
  ka: {
    badge: 'პერიმენოპაუზა და მენოპაუზა',
    title: 'მენოპაუზაზე გადასვლის გაგება',
    metaDuration: '10 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'დამწყები',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro:
      'რა იცვლება ეტაპობრივად მენსტრუაციის შეწყვეტამდე წლებით ადრე და როგორ მივუდგეთ ამ ეტაპს უფრო მეტი სიცხადით.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'პერიმენოპაუზა და მენოპაუზა: განმარტებები',
      'სულ უფრო არარეგულარული ციკლები',
      'ძილი და ხასიათი',
      'ინტიმურობა და ვაგინალური სიმშრალე',
      'წონა და მეტაბოლიზმი',
      'გავრცელებული მითები მენოპაუზის შესახებ',
      'ნორმალური სიმპტომები და ნიშნები, რომლებსაც უნდა დააკვირდეთ',
      'პრაქტიკული ყოველდღიური რჩევები',
      'მთავარი დასკვნები',
    ],
    h1: '1. პერიმენოპაუზა და მენოპაუზა: განმარტებები',
    body1a:
      'პერიმენოპაუზა ჰორმონული გარდამავალი პერიოდია, რომელიც მენოპაუზას წინ უსწრებს: ის შეიძლება რამდენიმე წლით ადრე დაიწყოს, ზოგადად ორმოცი წლიდან, როცა ესტროგენის დონე არარეგულარულად ცვალებადობს.',
    body1b:
      'მენოპაუზა, პირიქით, კონკრეტული მომენტია: ის დასტურდება 12 თანმიმდევრული თვის შემდეგ მენსტრუაციის გარეშე, სხვა მიზეზის გარეშე. საფრანგეთში ის საშუალოდ დაახლოებით 51 წლის ასაკში ხდება, თუმცა ეს ასაკი ქალიდან ქალამდე ბუნებრივად განსხვავდება.',
    tip1Title: 'კარგია ვიცოდეთ',
    tip1Text:
      'ყველა ქალი ამ გარდამავალ პერიოდს სხვაგვარად განიცდის, როგორც ხანგრძლივობით, ისე სიმპტომების ინტენსივობით. ამის შესახებ ღია საუბარი გეხმარებათ უკეთ მოემზადოთ.',
    h2: '2. სულ უფრო არარეგულარული ციკლები',
    body2:
      'პერიმენოპაუზის ერთ-ერთი პირველი ნიშანი ხშირად ციკლის რიტმის ცვლილებაა: ციკლები შეიძლება უფრო მოკლე, უფრო გრძელი, უფრო დაშორებული გახდეს ან ერთი თვიდან მეორეზე განსხვავებული ნაკადი ჰქონდეს.',
    alert1Title: 'გაითვალისწინეთ',
    alert1Text:
      'ძალიან უხვი სისხლდენა, ძალიან ახლო-ახლო მომხდარი სისხლდენა ან მენსტრუაციის გარეშე ერთი წლის შემდეგ მომხდარი სისხლდენა სამედიცინო რჩევას მოითხოვს, რადგან ეს გარდამავალი პერიოდის ტიპურ ნიშნებად არ ითვლება.',
    h3: '3. ძილი და ხასიათი',
    body3a:
      'ესტროგენისა და პროგესტერონის შემცირებამ და ცვალებადობამ შეიძლება ძილი დაარღვიოს (ჩაძინება, ღამით გაღვიძება) და შეიძლება თან ახლდეს გაღიზიანებადობა, შფოთვა ან უჩვეულო ხასიათის ცვალებადობა.',
    body3b:
      'ამ ცვლილებებს რეალური ბიოლოგიური ახსნა აქვს: ისინი არც ნებისყოფის ნაკლებობას ასახავს და არც იზოლირებულ ფსიქოლოგიურ პრობლემას.',
    h4: '4. ინტიმურობა და ვაგინალური სიმშრალე',
    body4:
      'ესტროგენის შემცირებამ შეიძლება ვაგინალური სიმშრალე გამოიწვიოს, რაც ზოგჯერ დისკომფორტს ან ტკივილს იწვევს სქესობრივი კავშირის დროს. სურვილიც შეიძლება შეიცვალოს, გაიზარდოს ან შემცირდეს, ქალის მიხედვით.',
    tip2Title: 'კარგია ვიცოდეთ',
    tip2Text:
      'არსებობს მარტივი გადაწყვეტილებები (ლუბრიკანტები, ვაგინალური დამატენიანებლები, ადგილობრივი მკურნალობა): ჯანდაცვის სპეციალისტთან საუბარმა შეიძლება დაგეხმაროთ სწორი გადაწყვეტილების პოვნაში, ტაბუს გარეშე.',
    h5: '5. წონა და მეტაბოლიზმი',
    body5:
      'ამ პერიოდში მეტაბოლიზმი შეიძლება მცირედ შენელდეს და ცხიმის განაწილება მუცლისკენ გადაინაცვლებს. ეს ცვლილებები ხშირია და მხოლოდ ნებისყოფაზე არ არის დამოკიდებული.',
    h6: '6. გავრცელებული მითები მენოპაუზის შესახებ',
    myths: [
      'მენოპაუზა „ერთბაშად ხდება“ — სინამდვილეში მას რამდენიმე წლიანი გარდამავალი პერიოდი (პერიმენოპაუზა) უსწრებს წინ',
      'ყველა სიმპტომი ყველასთვის ძლიერია — მათი ინტენსივობა ქალიდან ქალამდე უზომოდ განსხვავდება',
      'არაფრის გაკეთება შეუძლებელია — არსებობს მრავალი გადაწყვეტილება, ჰორმონული ან არა, შემაწუხებელი სიმპტომების შესამსუბუქებლად',
      'ინტიმური ცხოვრება მთავრდება — ის იცვლება, მაგრამ სწორი მოხერხებებით სრულიად შესაძლებელი და სრულფასოვანი რჩება',
    ],
    h7: '7. ნორმალური სიმპტომები და ნიშნები, რომლებსაც უნდა დააკვირდეთ',
    body7:
      'აქ აღწერილი ცვლილებების აბსოლუტური უმრავლესობა გარდამავალი პერიოდის ნორმალური გამოვლინებებია. თუმცა გარკვეული ნიშნები დაუყოვნებელ სამედიცინო ყურადღებას საჭიროებს.',
    alert2Title: 'მიმართეთ ექიმს, თუ',
    alert2Text:
      'სისხლდენა დადასტურებული მენოპაუზის შემდეგ, უჩვეულო მენჯის ტკივილი, სიმპტომები, რომლებიც ყოველდღიურ ცხოვრებას მნიშვნელოვნად არღვევს, ან ნებისმიერი გაგრძელებული ეჭვი.',
    h8: '8. პრაქტიკული ყოველდღიური რჩევები',
    dailyHabits: [
      'კალციუმითა და ბოჭკოთი მდიდარი კვება',
      'რეგულარული ფიზიკური აქტივობა',
      'ძილის სტაბილური რუტინა',
      'ყოველდღიური მოდუნების მომენტები',
    ],
    h9: '9. მთავარი დასკვნები',
    tip3Title: 'კარგია ვიცოდეთ',
    tip3Text:
      'პერიმენოპაუზა და მენოპაუზა ბუნებრივი ეტაპებია და არა ავადმყოფობა. არსებობს მრავალი გადაწყვეტილება, რომელიც ამ გარდამავალ პერიოდს უფრო კომფორტულად გავლაში დაგეხმარებათ: ჯანდაცვის სპეციალისტი რჩება საუკეთესო წყაროდ მათი თქვენს სიტუაციაზე მოსარგებად.',
    shareMessage: 'მენოპაუზაზე გადასვლის გაგება — AWA',
  },
  hy: {
    badge: 'ՊԵՐԻՄԵՆՈՊԱՈՒԶԱ ԵՎ ԴԱՇՏԱՆԱԴԱԴԱՐ',
    title: 'Հասկանալ դաշտանադադարի անցումը',
    metaDuration: '10 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Վերանայված բովանդակություն',
    intro:
      'Ինչն է աստիճանաբար փոխվում դաշտանների դադարելուց տարիներ առաջ և ինչպես ավելի հստակությամբ մոտենալ այս փուլին:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Պերիմենոպաուզա և դաշտանադադար. սահմանումներ',
      'Ավելի ու ավելի անկանոն ցիկլեր',
      'Քուն և տրամադրություն',
      'Մտերմություն և հեշտոցային չորություն',
      'Քաշ և նյութափոխանակություն',
      'Տարածված առասպելներ դաշտանադադարի մասին',
      'Նորմալ ախտանիշներ և նշաններ, որոնց պետք է ուշադրություն դարձնել',
      'Գործնական առօրյա խորհուրդներ',
      'Հիմնական եզրակացություններ',
    ],
    h1: '1. Պերիմենոպաուզա և դաշտանադադար. սահմանումներ',
    body1a:
      'Պերիմենոպաուզան նշանակում է հորմոնալ անցումային շրջան, որը նախորդում է դաշտանադադարին. այն կարող է սկսվել մի քանի տարի շուտ, սովորաբար քառասուն տարեկանից սկսած, երբ էստրոգենի մակարդակները անկանոն տատանվում են:',
    body1b:
      'Դաշտանադադարը, ընդհակառակը, ժամանակի որոշակի կետ է. այն հաստատվում է 12 անընդմեջ ամիս դաշտանի բացակայությունից հետո՝ առանց այլ պատճառի: Ֆրանսիայում այն միջինում տեղի է ունենում մոտ 51 տարեկանում, թեև այս տարիքը բնականաբար տարբերվում է կնոջից կին:',
    tip1Title: 'Լավ է իմանալ',
    tip1Text:
      'Յուրաքանչյուր կին ապրում է այս անցումը տարբեր կերպ՝ և՛ տևողությամբ, և՛ ախտանիշների ինտենսիվությամբ: Այդ մասին բաց խոսելը օգնում է ավելի լավ նախապատրաստվել:',
    h2: '2. Ավելի ու ավելի անկանոն ցիկլեր',
    body2:
      'Պերիմենոպաուզայի առաջին նշաններից մեկը հաճախ ցիկլի ռիթմի փոփոխությունն է. ցիկլերը կարող են դառնալ ավելի կարճ, ավելի երկար, ավելի հազվադեպ կամ ունենալ տարբեր արտահոսք մի ամսից մյուսը:',
    alert1Title: 'Խնդրում ենք ուշադրություն դարձնել',
    alert1Text:
      'Շատ առատ արյունահոսությունը, իրար շատ մոտ տեղի ունեցող արյունահոսությունը կամ մեկ տարի դաշտանի բացակայությունից հետո տեղի ունեցող արյունահոսությունը պահանջում է բժշկական խորհրդատվություն, քանի որ դրանք անցման բնորոշ նշաններ չեն համարվում:',
    h3: '3. Քուն և տրամադրություն',
    body3a:
      'Էստրոգենի և պրոգեստերոնի նվազումն ու տատանումները կարող են խաթարել քունը (քնելը, գիշերը արթնանալը) և կարող են ուղեկցվել դյուրագրգռությամբ, անհանգստությամբ կամ տրամադրության անսովոր տատանումներով:',
    body3b:
      'Այս փոփոխությունները ունեն իրական կենսաբանական բացատրություն. դրանք չեն արտացոլում ո՛չ կամքի պակաս, ո՛չ մեկուսացված հոգեբանական խնդիր:',
    h4: '4. Մտերմություն և հեշտոցային չորություն',
    body4:
      'Էստրոգենի նվազումը կարող է հանգեցնել հեշտոցային չորության՝ երբեմն առաջացնելով անհարմարություն կամ ցավ սեռական հարաբերության ժամանակ: Ցանկությունը նույնպես կարող է փոխվել՝ աճել կամ նվազել՝ կախված կնոջից:',
    tip2Title: 'Լավ է իմանալ',
    tip2Text:
      'Գոյություն ունեն պարզ լուծումներ (քսուքներ, հեշտոցային խոնավեցնող միջոցներ, տեղային բուժումներ). առողջապահության մասնագետի հետ խոսելը կարող է օգնել գտնել ճիշտ լուծումը՝ առանց տաբուի:',
    h5: '5. Քաշ և նյութափոխանակություն',
    body5:
      'Այս շրջանում նյութափոխանակությունը կարող է թեթևակի դանդաղել, և ճարպի բաշխումը հակված է տեղաշարժվել դեպի որովայն: Այս փոփոխությունները տարածված են և կախված չեն միայն կամքի ուժից:',
    h6: '6. Տարածված առասպելներ դաշտանադադարի մասին',
    myths: [
      'Դաշտանադադարը «տեղի է ունենում միանգամից». իրականում դրան նախորդում է անցման մի քանի տարի (պերիմենոպաուզա)',
      'Բոլոր ախտանիշները բոլորի համար ծանր են. դրանց ինտենսիվությունը խիստ տարբերվում է կնոջից կին',
      'Ոչինչ չի կարելի անել. գոյություն ունեն բազմաթիվ լուծումներ՝ հորմոնալ կամ ոչ, անհարմար ախտանիշները թեթևացնելու համար',
      'Մտերմիկ կյանքը ավարտվում է. այն փոխվում է, սակայն մնում է լիովին հնարավոր և լիարժեք՝ ճիշտ ճշգրտումներով',
    ],
    h7: '7. Նորմալ ախտանիշներ և նշաններ, որոնց պետք է ուշադրություն դարձնել',
    body7:
      'Այստեղ նկարագրված փոփոխությունների ճնշող մեծամասնությունը անցման նորմալ դրսևորումներ են: Այդուհանդերձ, որոշ նշաններ պահանջում են անհապաղ բժշկական ուշադրություն:',
    alert2Title: 'Դիմեք բժշկի, եթե',
    alert2Text:
      'Հաստատված դաշտանադադարից հետո արյունահոսություն, անսովոր կոնքի ցավ, ախտանիշներ, որոնք զգալիորեն խաթարում են առօրյան, կամ ցանկացած շարունակական կասկած:',
    h8: '8. Գործնական առօրյա խորհուրդներ',
    dailyHabits: [
      'Կալցիումով և մանրաթելերով հարուստ սննդակարգ',
      'Կանոնավոր ֆիզիկական ակտիվություն',
      'Կայուն քնի ռեժիմ',
      'Ամենօրյա թուլացման պահեր',
    ],
    h9: '9. Հիմնական եզրակացություններ',
    tip3Title: 'Լավ է իմանալ',
    tip3Text:
      'Պերիմենոպաուզան և դաշտանադադարը բնական փուլեր են, ոչ թե հիվանդություն: Գոյություն ունեն բազմաթիվ լուծումներ, որոնք օգնում են այս անցումն ավելի հարմարավետ անցնել. առողջապահության մասնագետը մնում է լավագույն ռեսուրսը դրանք ձեր իրավիճակին հարմարեցնելու համար:',
    shareMessage: 'Հասկանալ դաշտանադադարի անցումը — AWA',
  },
  tg: {
    badge: 'ПЕРИМЕНОПАУЗА ВА МЕНОПАУЗА',
    title: 'Фаҳмидани гузариш ба менопауза',
    metaDuration: '10 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни баррасишуда',
    intro:
      'Чӣ тадриҷан тағйир меёбад, солҳо пеш аз қатъи ҳайз, ва чӣ тавр ба ин марҳила бо возеҳии бештар наздик шудан мумкин аст.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Перименопауза ва менопауза: таърифҳо',
      'Давраҳои торафт номунтазамтар',
      'Хоб ва кайфият',
      'Наздикӣ ва хушкии маҳбал',
      'Вазн ва мубодилаи моддаҳо',
      'Афсонаҳои маъмул дар бораи менопауза',
      'Нишонаҳои муқаррарӣ ва нишонаҳое, ки бояд пайгирӣ кард',
      'Маслиҳатҳои амалии ҳаррӯза',
      'Хулосаҳои асосӣ',
    ],
    h1: '1. Перименопауза ва менопауза: таърифҳо',
    body1a:
      'Перименопауза давраи гузариши гормониро мефаҳмонад, ки пеш аз менопауза меояд: он метавонад якчанд сол барвақттар, одатан аз солҳои чилсолагӣ оғоз шавад, бо сатҳи эстроген, ки ба таври номунтазам тағйир меёбад.',
    body1b:
      'Менопауза бошад, лаҳзаи мушаххас аст: он пас аз 12 моҳи пай дар пай бе ҳайз, бидуни ягон сабаби дигар тасдиқ мешавад. Дар Фаронса он ба ҳисоби миёна тақрибан дар 51-солагӣ рух медиҳад, гарчанде ки ин синну сол ба таври табиӣ аз зан ба зан фарқ мекунад.',
    tip1Title: 'Донистан хуб аст',
    tip1Text:
      'Ҳар зан ин гузаришро ба таври гуногун аз сар мегузаронад, ҳам аз ҷиҳати давомнокӣ ва ҳам шиддати нишонаҳо. Кушод дар ин бора гап задан ба шумо кумак мекунад онро беҳтар пешбинӣ кунед.',
    h2: '2. Давраҳои торафт номунтазамтар',
    body2:
      'Яке аз аввалин нишонаҳои перименопауза аксар вақт тағйири суръати давра аст: давраҳо метавонанд кӯтоҳтар, дарозтар, дурфосилатар шаванд ё аз як моҳ то моҳи дигар ҷараёни гуногун дошта бошанд.',
    alert1Title: 'Таваҷҷӯҳ кунед',
    alert1Text:
      'Хунравии хеле зиёд, хунравиҳои хеле наздик ба ҳам ё хунравӣ пас аз як сол бе ҳайз маслиҳати тиббиро талаб мекунад, зеро инҳо нишонаҳои хоси гузариш ҳисоб намешаванд.',
    h3: '3. Хоб ва кайфият',
    body3a:
      'Паст шудан ва тағйирёбии эстроген ва прогестерон метавонад хобро (хоб рафтан, бедор шудан дар шаб) вайрон кунад ва метавонад бо асабоният, изтироб ё тағйироти ғайриоддии кайфият ҳамроҳ бошад.',
    body3b:
      'Ин тағйирот шарҳи биологии воқеӣ дорад: онҳо на камии иродаро ва на мушкили ҷудогонаи равониро инъикос мекунанд.',
    h4: '4. Наздикӣ ва хушкии маҳбал',
    body4:
      'Паст шудани эстроген метавонад ба хушкии маҳбал оварда расонад, ки баъзан ҳангоми наздикӣ нороҳатӣ ё дард ба вуҷуд меорад. Майл низ метавонад тағйир ёбад, афзояд ё кам шавад, вобаста ба зан.',
    tip2Title: 'Донистан хуб аст',
    tip2Text:
      'Роҳҳои оддӣ вуҷуд доранд (равғанҳои молиданӣ, намдиҳандаҳои маҳбалӣ, табобатҳои маҳаллӣ): гап задан бо мутахассиси соҳаи тиб метавонад ба шумо кумак кунад роҳи мувофиқро бидуни ҳаросу шарм ёбед.',
    h5: '5. Вазн ва мубодилаи моддаҳо',
    body5:
      'Мубодилаи моддаҳо дар ин давра метавонад андаке суст шавад ва тақсимоти равған майл дорад ба шикам гузарад. Ин тағйирот маъмуланд ва танҳо ба иродаи шумо вобаста нестанд.',
    h6: '6. Афсонаҳои маъмул дар бораи менопауза',
    myths: [
      'Менопауза «якбора рух медиҳад» — дар асл пеш аз он якчанд соли гузариш (перименопауза) мегузарад',
      'Ҳама нишонаҳо барои ҳама шадиданд — шиддати онҳо аз зан ба зан хеле фарқ мекунад',
      'Коре кардан намешавад — бисёр роҳҳо, гормонӣ ё не, барои сабук кардани нишонаҳои мазоҳим вуҷуд доранд',
      'Зиндагии наздикӣ ба охир мерасад — он тағйир меёбад, вале бо танзимоти дуруст комилан имконпазир ва қаноатбахш боқӣ мемонад',
    ],
    h7: '7. Нишонаҳои муқаррарӣ ва нишонаҳое, ки бояд пайгирӣ кард',
    body7:
      'Аксари мутлақи тағйироти дар ин ҷо тавсифшуда зуҳуроти муқаррарии гузариш мебошанд. Бо вуҷуди ин, баъзе нишонаҳо диққати фавриро талаб мекунанд.',
    alert2Title: 'Ба табиб муроҷиат кунед, агар',
    alert2Text:
      'Хунравӣ пас аз менопаузаи тасдиқшуда, дарди ғайриоддии коса, нишонаҳое, ки ҳаёти ҳаррӯзаро ба таври назаррас вайрон мекунанд, ё ҳар шубҳаи доимӣ.',
    h8: '8. Маслиҳатҳои амалии ҳаррӯза',
    dailyHabits: [
      'Ғизои бойи калсий ва нахи ғизоӣ',
      'Фаъолияти мунтазами ҷисмонӣ',
      'Тартиби собити хоб',
      'Лаҳзаҳои ҳаррӯзаи ором шудан',
    ],
    h9: '9. Хулосаҳои асосӣ',
    tip3Title: 'Донистан хуб аст',
    tip3Text:
      'Перименопауза ва менопауза марҳилаҳои табиианд, на беморӣ. Роҳҳои бисёре вуҷуд доранд, ки ба шумо кумак мекунанд ин гузаришро роҳаттар гузаронед: мутахассиси соҳаи тиб беҳтарин манбаъ барои мутобиқ кардани онҳо ба вазъияти шумо боқӣ мемонад.',
    shareMessage: 'Фаҳмидани гузариш ба менопауза — AWA',
  },
  ky: {
    badge: 'ПЕРИМЕНОПАУЗА ЖАНА МЕНОПАУЗА',
    title: 'Менопауза өткөөлүн түшүнүү',
    metaDuration: '10 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Баштоочу',
    metaValidated: 'Текшерилген мазмун',
    intro:
      'Етек кирим токтогонго чейин жылдар мурун эмне акырындап өзгөрөт жана бул этапка кантип даанараак жакындоо керек.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Перименопауза жана менопауза: аныктамалар',
      'Барган сайын туура эмес циклдер',
      'Уйку жана маанай',
      'Жакындык жана кынаптын кургактыгы',
      'Салмак жана зат алмашуу',
      'Менопауза жөнүндө кеңири таралган жаңылыш түшүнүктөр',
      'Кадимки белгилер жана көңүл бура турган белгилер',
      'Практикалык күнүмдүк кеңештер',
      'Негизги жыйынтыктар',
    ],
    h1: '1. Перименопауза жана менопауза: аныктамалар',
    body1a:
      'Перименопауза — менопаузадан мурунку гормондук өткөөл мезгил: ал бир нече жыл мурун, көбүнчө кырк жаштан баштап, эстроген деңгээли туура эмес термелип башталышы мүмкүн.',
    body1b:
      'Менопауза болсо белгилүү бир убакыт чекити: ал башка себепсиз катары менен 12 ай етек кирим болбогондон кийин ырасталат. Францияда ал орточо 51 жаш чамасында болот, бирок бул жаш аялдан аялга табигый түрдө айырмаланат.',
    tip1Title: 'Билүү пайдалуу',
    tip1Text:
      'Ар бир аял бул өткөөлдү ар башкача башынан өткөрөт, узактыгы боюнча да, белгилердин курчтугу боюнча да. Ачык сүйлөшүү аны жакшыраак алдын ала билүүгө жардам берет.',
    h2: '2. Барган сайын туура эмес циклдер',
    body2:
      'Перименопаузанын алгачкы белгилеринин бири көбүнчө цикл ритминин өзгөрүшү: циклдер кыскарып, узарып, сейрек болуп же айдан айга башка агымга ээ болушу мүмкүн.',
    alert1Title: 'Көңүл буруңуз',
    alert1Text:
      'Өтө көп кан кетүү, бири-бирине өтө жакын кан кетүү же етек кирим болбогон бир жылдан кийин болгон кан кетүү медициналык кеңешти талап кылат, анткени булар өткөөлдүн типтүү белгилери деп эсептелбейт.',
    h3: '3. Уйку жана маанай',
    body3a:
      'Эстроген менен прогестерондун азайышы жана термелүүсү уйкуну (уктап кетүү, түнкүсүн ойгонуу) бузушу мүмкүн жана ачуулануу, тынчсыздануу же адаттан тыш маанай өзгөрүүлөрү менен коштолушу мүмкүн.',
    body3b:
      'Бул өзгөрүүлөрдүн чыныгы биологиялык түшүндүрмөсү бар: алар эркинин жетишсиздигин да, жекече психологиялык көйгөйдү да чагылдырбайт.',
    h4: '4. Жакындык жана кынаптын кургактыгы',
    body4:
      'Эстрогендин азайышы кынаптын кургактыгына алып келиши мүмкүн, кээде жыныстык катнашта ыңгайсыздык же оору жаратат. Каалоо да аялга жараша көбөйүп же азайып өзгөрүшү мүмкүн.',
    tip2Title: 'Билүү пайдалуу',
    tip2Text:
      'Жөнөкөй чечимдер бар (майлоочу каражаттар, кынапты нымдаткычтар, жергиликтүү дарылоолор): ден соолук сактоо адиси менен сүйлөшүү тартынбай туура чечимди табууга жардам бере алат.',
    h5: '5. Салмак жана зат алмашуу',
    body5:
      'Бул мезгилде зат алмашуу бир аз жайлашы мүмкүн жана май бөлүштүрүлүшү курсакка карай жылууга умтулат. Бул өзгөрүүлөр кеңири таралган жана жалаң эркке көз каранды эмес.',
    h6: '6. Менопауза жөнүндө кеңири таралган жаңылыш түшүнүктөр',
    myths: [
      'Менопауза «бир заматта болот» — чындыгында, андан мурун бир нече жылдык өткөөл (перименопауза) болот',
      'Бардык белгилер баарына катуу — алардын курчтугу аялдан аялга абдан айырмаланат',
      'Эч нерсе кылууга болбойт — тынчсыздандырган белгилерди жеңилдетүү үчүн гормондук же гормондук эмес көптөгөн чечимдер бар',
      'Жакын жашоо аяктайт — ал өзгөрөт, бирок туура тууралоолор менен толугу менен мүмкүн жана ыракат берүүчү бойдон калат',
    ],
    h7: '7. Кадимки белгилер жана көңүл бура турган белгилер',
    body7:
      'Бул жерде сүрөттөлгөн өзгөрүүлөрдүн абдан көпчүлүгү өткөөлдүн кадимки көрүнүштөрү. Ошентсе да, айрым белгилер тез медициналык көңүл бурууну талап кылат.',
    alert2Title: 'Дарыгерге барыңыз, эгер',
    alert2Text:
      'Ырасталган менопаузадан кийин кан кетүү, адаттан тыш жамбаш оорусу, күнүмдүк жашоону олуттуу бузган белгилер же ар кандай улана берген күмөн болсо.',
    h8: '8. Практикалык күнүмдүк кеңештер',
    dailyHabits: [
      'Кальцийге жана була кыртыштарына бай тамактануу',
      'Үзгүлтүксүз физикалык активдүүлүк',
      'Туруктуу уйку тартиби',
      'Күн сайын бошоңдоо учурлары',
    ],
    h9: '9. Негизги жыйынтыктар',
    tip3Title: 'Билүү пайдалуу',
    tip3Text:
      'Перименопауза жана менопауза — табигый этаптар, ооруу эмес. Бул өткөөлдөн ыңгайлуураак өтүүгө жардам берген көптөгөн чечимдер бар: аларды абалыңызга ыңгайлаштыруу үчүн ден соолук сактоо адиси эң жакшы булак бойдон калат.',
    shareMessage: 'Менопауза өткөөлүн түшүнүү — AWA',
  },
  tk: {
    badge: 'PERIMENOPAUZA WE MENOPAUZA',
    title: 'Menopauza ötüşini düşünmek',
    metaDuration: '10 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Barlanan mazmun',
    intro:
      'Aýbaşy kesilmezden ýyllar öň ýuwaş-ýuwaşdan nämäniň üýtgeýändigi we bu tapgyra has aýdyňlyk bilen nähili ýakynlaşmaly.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Perimenopauza we menopauza: kesgitlemeler',
      'Barha düzgünsiz sikller',
      'Uky we keýp',
      'Ýakynlyk we jynsy ýoluň gurakçylygy',
      'Agram we metabolizm',
      'Menopauza barada giňden ýaýran mifler',
      'Adaty alamatlar we üns bermeli alamatlar',
      'Amaly gündelik maslahatlar',
      'Esasy netijeler',
    ],
    h1: '1. Perimenopauza we menopauza: kesgitlemeler',
    body1a:
      'Perimenopauza menopauzadan öňki gormonal ötüş döwrüni aňladýar: ol birnäçe ýyl öň, adatça kyrk ýaşdan başlap, estrogen derejeleriniň düzgünsiz yrgyldamagy bilen başlap biler.',
    body1b:
      'Menopauza, tersine, belli bir pursat: ol başga sebäp bolmazdan yzly-yzyna 12 aý aýbaşy bolmandan soň tassyklanýar. Fransiýada ol ortaça 51 ýaşda bolýar, ýöne bu ýaş aýaldan aýala tebigy ýagdaýda tapawutlanýar.',
    tip1Title: 'Bilmek peýdaly',
    tip1Text:
      'Her aýal bu ötüşi, hem dowamlylygy, hem alamatlaryň güýçlüligi boýunça, başgaça başdan geçirýär. Ol barada açyk gürleşmek ony has gowy öňünden görmäge kömek edýär.',
    h2: '2. Barha düzgünsiz sikller',
    body2:
      'Perimenopauzanyň ilkinji alamatlarynyň biri köplenç sikl ritminiň üýtgemegi: sikller gysgalyp, uzalyp, has seýrekleşip ýa-da aýdan aýa başga gan akma bilen bolup biler.',
    alert1Title: 'Üns beriň',
    alert1Text:
      'Gaty köp gan akma, bir-birine gaty ýakyn bolýan gan akma ýa-da bir ýyl aýbaşysyz soň bolýan gan akma lukmançylyk maslahatyny talap edýär, sebäbi bular ötüşiň adaty alamatlary hasaplanmaýar.',
    h3: '3. Uky we keýp',
    body3a:
      'Estrogen we progesteronyň peselmegi we yrgyldamagy ukyny bozup biler (uklap bilmek, gije oýanmak) we gaharjaňlyk, biynjalyklyk ýa-da adaty däl keýp üýtgeşmeleri bilen bile bolup biler.',
    body3b:
      'Bu üýtgeşmeleriň hakyky biologik düşündirişi bar: olar ne erk ýetmezçiligini, ne-de aýry psihologiki kynçylygy görkezýär.',
    h4: '4. Ýakynlyk we jynsy ýoluň gurakçylygy',
    body4:
      'Estrogeniň peselmegi jynsy ýoluň gurakçylygyna eltip biler, bu käwagt jynsy gatnaşyk wagtynda rahatsyzlyga ýa-da agyra sebäp bolýar. Islegler hem aýala görä artyp ýa-da azalyp üýtgäp biler.',
    tip2Title: 'Bilmek peýdaly',
    tip2Text:
      'Ýönekeý çözgütler bar (ýaglaýjylar, jynsy ýol çyglandyryjylary, ýerli bejergiler): saglyk hünärmeni bilen gürleşmek tabusyz dogry çözgüdi tapmaga kömek edip biler.',
    h5: '5. Agram we metabolizm',
    body5:
      'Metabolizm bu döwürde az-kem haýallap biler we ýag paýlanyşy garyn tarapa süýşmäge ýykgyn edýär. Bu üýtgeşmeler umumy we diňe erk güýjüne bagly däl.',
    h6: '6. Menopauza barada giňden ýaýran mifler',
    myths: [
      'Menopauza «birden bolýar» — hakykatda, oňa birnäçe ýyllyk ötüş (perimenopauza) öň gelýär',
      'Ähli alamatlar hemmeler üçin güýçli — olaryň güýçlüligi aýaldan aýala köp tapawutlanýar',
      'Hiç zat edip bolmaýar — biynjalyk edýän alamatlary ýeňilleşdirmek üçin gormonal ýa-da gormonal däl köp çözgüt bar',
      'Ýakyn durmuş gutarýar — ol üýtgeýär, ýöne dogry sazlamalar bilen doly mümkin we kanagatlandyryjy bolup galýar',
    ],
    h7: '7. Adaty alamatlar we üns bermeli alamatlar',
    body7:
      'Bu ýerde suratlandyrylan üýtgeşmeleriň aglaba köpüsi ötüşiň adaty ýüze çykyşlary. Şeýle-de bolsa, käbir alamatlar çalt lukmançylyk üns talap edýär.',
    alert2Title: 'Şu ýagdaýda lukmana ýüz tutuň',
    alert2Text:
      'Tassyklanan menopauzadan soň gan akma, adaty däl çanak agyrysy, gündelik durmuşy möhüm bozýan alamatlar ýa-da islendik dowamly şübhe.',
    h8: '8. Amaly gündelik maslahatlar',
    dailyHabits: [
      'Kalsiýe we süýümlige baý iýmit',
      'Yzygiderli fiziki işjeňlik',
      'Durnukly uky tertibi',
      'Her günki dynç alyş pursatlary',
    ],
    h9: '9. Esasy netijeler',
    tip3Title: 'Bilmek peýdaly',
    tip3Text:
      'Perimenopauza we menopauza tebigy tapgyrlar, kesellik däl. Bu ötüşi has rahat geçirmäge kömek edýän köp çözgüt bar: saglyk hünärmeni olary ýagdaýyňyza uýgunlaşdyrmak üçin iň gowy çeşme bolup galýar.',
    shareMessage: 'Menopauza ötüşini düşünmek — AWA',
  },
} as const);

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function MenopauseTransitionArticleScreen({
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
            {content.h1}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body1a}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body1b}
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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>{content.h2}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body2}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.alert1Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.alert1Text}
              </AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>{content.h3}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body3a}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body3b}
          </AwaText>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>{content.h4}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body4}
          </AwaText>

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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>{content.h5}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body5}
          </AwaText>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>{content.h6}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.myths.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="close-circle-outline"
                  size={18}
                  color={theme.colors.warning}
                />

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.checkText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            {content.h7}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body7}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="alert-circle-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.alert2Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.alert2Text}
              </AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>{content.h8}</AwaText>

          <View style={styles.daily}>
            {DAILY_HABIT_ICONS.map((icon, index) => (
              <View key={icon} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={icon as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <AwaText variant="bodySmall" style={styles.dailyText}>{content.dailyHabits[index]}</AwaText>
              </View>
            ))}
          </View>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>{content.h9}</AwaText>

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

      <ReadingControls articleId={ID} durationMinutes={10} scrollRef={scrollRef} />
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
  alert: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },
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
