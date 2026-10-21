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
