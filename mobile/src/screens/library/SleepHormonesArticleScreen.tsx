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

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

const ID = 'sleep-sommeil-et-cycle';

const HERO = require('../../assets/images/library/spm-sleep.png');

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const PHASE_SLEEP_ICONS = ['water-outline', 'egg-outline', 'weather-night'] as const;

const EVENING_ROUTINE_ICONS = ['clock-outline', 'cellphone-off', 'snowflake'] as const;

/* -------------------------------------------------------------------------- */
/* CONTENT (PHASE 7L — bilingual editorial content)                          */
/* -------------------------------------------------------------------------- */
// Article identity (ID, images, bookmark/progress keys, JSX structure) is
// untouched; only this object changes per language. The French text below
// is byte-identical to the original — never retyped, only moved into the
// `fr` key — so the app remains fully bilingual rather than having French
// replaced by English.
const CONTENT = withBrazilianPortuguese('SleepHormones', {
  fr: {
    badge: 'CYCLE MENSTRUEL • SOMMEIL',
    title: 'Sommeil et hormones :\nle lien méconnu',
    metaDuration: '6 min de lecture',
    metaType: 'Article',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Pourquoi ton sommeil varie selon la phase du cycle, et à la ménopause.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Pourquoi les hormones influencent le sommeil',
      'Le sommeil selon les phases du cycle',
      'Stress et qualité du sommeil',
      'Une routine du soir apaisante',
      'Quand consulter',
      'À retenir',
    ],
    section1Body: 'La progestérone a un léger effet sédatif ; sa baisse en fin de cycle peut perturber le sommeil, en le rendant plus léger ou plus fragmenté.',
    infoCard1Title: 'Bon à savoir',
    infoCard1Text: 'La légère hausse de température corporelle après l’ovulation peut aussi rendre l’endormissement un peu plus difficile pour certaines personnes.',
    phaseSleep: [
      {title: 'Pendant les règles', text: 'L’inconfort physique et la fatigue peuvent rendre le sommeil plus léger.'},
      {title: 'Autour de l’ovulation', text: 'Le sommeil est généralement plus stable pour la plupart des personnes.'},
      {title: 'Avant les règles', text: 'La baisse de progestérone peut rendre le sommeil plus léger, avec des réveils possibles.'},
    ],
    section2Body: 'À la ménopause, les bouffées de chaleur nocturnes sont une cause fréquente de réveils, pour des raisons hormonales similaires.',
    section3Body: 'Le stress peut amplifier les perturbations du sommeil pendant les phases déjà plus sensibles du cycle. Des techniques de relaxation simples (respiration, étirements doux) peuvent aider à s’apaiser avant le coucher.',
    section4Body: 'Une routine du coucher stable et une chambre fraîche aident à limiter ces perturbations, à tout âge.',
    eveningRoutine: [
      {title: 'Des horaires réguliers', text: 'Se coucher et se lever à des heures stables aide à réguler l’horloge interne.'},
      {title: 'Moins d’écrans le soir', text: 'La lumière bleue peut retarder l’endormissement ; une pause écran aide à s’apaiser.'},
      {title: 'Une chambre fraîche', text: 'Une température modérée facilite l’endormissement, à tout âge.'},
    ],
    section5Body: 'De bonnes habitudes ne suffisent pas toujours. Il peut être utile d’en parler à un professionnel si :',
    warningTitle: 'Signes qui méritent un avis',
    consultSigns: [
      'Les troubles du sommeil durent depuis plusieurs semaines',
      'La fatigue impacte fortement le quotidien',
      'L’insomnie persiste malgré de bonnes habitudes',
    ],
    infoCard2Title: 'Se préparer à ce rendez-vous',
    infoCard2Text: 'Noter depuis quand les troubles durent et ce qui semble les influencer peut aider ton professionnel de santé à mieux t’orienter.',
    tipTitle: 'Bon à savoir',
    tipText: 'Ces variations de sommeil sont fréquentes et généralement temporaires : elles ne signifient pas qu’il y a un problème.',
    summaryPoints: [
      'La progestérone a un léger effet sédatif ; sa baisse en fin de cycle peut perturber le sommeil.',
      'À la ménopause, les bouffées de chaleur nocturnes sont une cause fréquente de réveils.',
      'Une routine du coucher stable et une chambre fraîche aident à limiter ces perturbations, à tout âge.',
      'Des troubles du sommeil qui persistent méritent d’être évoqués avec un professionnel de santé.',
    ],
    disclaimerText: 'Contenu informatif. Cet article ne remplace pas un avis médical personnalisé. En cas de doute, demande conseil à un professionnel de santé.',
    shareMessage: 'Sommeil et hormones : le lien méconnu — AWA',
  },
  en: {
    badge: 'MENSTRUAL CYCLE • SLEEP',
    title: 'Sleep and hormones:\nthe little-known link',
    metaDuration: '6 min read',
    metaType: 'Article',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'Why your sleep changes depending on your cycle phase, and at menopause.',
    contentsTitle: 'In this article',
    topics: [
      'Why hormones affect sleep',
      'Sleep across the phases of the cycle',
      'Stress and sleep quality',
      'A soothing evening routine',
      'When to see a professional',
      'Key takeaways',
    ],
    section1Body: 'Progesterone has a mild sedative effect; its drop at the end of the cycle can disrupt sleep, making it lighter or more fragmented.',
    infoCard1Title: 'Good to know',
    infoCard1Text: 'The slight rise in body temperature after ovulation can also make falling asleep a little harder for some people.',
    phaseSleep: [
      {title: 'During your period', text: 'Physical discomfort and fatigue can make sleep lighter.'},
      {title: 'Around ovulation', text: 'Sleep is generally more stable for most people.'},
      {title: 'Before your period', text: 'The drop in progesterone can make sleep lighter, with possible wake-ups.'},
    ],
    section2Body: 'At menopause, night sweats are a common cause of waking up, for similar hormonal reasons.',
    section3Body: 'Stress can amplify sleep disruptions during phases of the cycle that are already more sensitive. Simple relaxation techniques (breathing, gentle stretching) can help you unwind before bed.',
    section4Body: 'A stable bedtime routine and a cool bedroom help limit these disruptions, at any age.',
    eveningRoutine: [
      {title: 'Regular hours', text: 'Going to bed and waking up at stable times helps regulate your internal clock.'},
      {title: 'Less screen time in the evening', text: 'Blue light can delay falling asleep; a screen break helps you wind down.'},
      {title: 'A cool bedroom', text: 'A moderate temperature makes falling asleep easier, at any age.'},
    ],
    section5Body: 'Good habits aren’t always enough. It can be helpful to talk to a professional if:',
    warningTitle: 'Signs worth getting checked',
    consultSigns: [
      'Sleep problems have lasted for several weeks',
      'Fatigue is strongly affecting daily life',
      'Insomnia persists despite good habits',
    ],
    infoCard2Title: 'Preparing for this appointment',
    infoCard2Text: 'Noting how long the problems have lasted and what seems to influence them can help your healthcare professional guide you better.',
    tipTitle: 'Good to know',
    tipText: 'These sleep changes are common and usually temporary: they don’t mean something is wrong.',
    summaryPoints: [
      'Progesterone has a mild sedative effect; its drop at the end of the cycle can disrupt sleep.',
      'At menopause, night sweats are a common cause of waking up.',
      'A stable bedtime routine and a cool bedroom help limit these disruptions, at any age.',
      'Persistent sleep problems are worth discussing with a healthcare professional.',
    ],
    disclaimerText: 'Informational content. This article does not replace personalized medical advice. If in doubt, seek guidance from a healthcare professional.',
    shareMessage: 'Sleep and hormones: the little-known link — AWA',
  },
  es: {
    badge: 'CICLO MENSTRUAL • SUEÑO',
    title: 'Sueño y hormonas:\nel vínculo poco conocido',
    metaDuration: '6 min de lectura',
    metaType: 'Artículo',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Por qué tu sueño varía según la fase del ciclo, y en la menopausia.',
    contentsTitle: 'En este artículo',
    topics: [
      'Por qué las hormonas influyen en el sueño',
      'El sueño según las fases del ciclo',
      'Estrés y calidad del sueño',
      'Una rutina nocturna relajante',
      'Cuándo consultar',
      'Para recordar',
    ],
    section1Body: 'La progesterona tiene un ligero efecto sedante; su descenso al final del ciclo puede alterar el sueño, haciéndolo más ligero o más fragmentado.',
    infoCard1Title: 'Dato útil',
    infoCard1Text: 'La ligera subida de la temperatura corporal después de la ovulación también puede dificultar un poco más conciliar el sueño en algunas personas.',
    phaseSleep: [
      {title: 'Durante la regla', text: 'La incomodidad física y el cansancio pueden hacer que el sueño sea más ligero.'},
      {title: 'Alrededor de la ovulación', text: 'El sueño suele ser más estable para la mayoría de las personas.'},
      {title: 'Antes de la regla', text: 'El descenso de progesterona puede hacer que el sueño sea más ligero, con posibles despertares.'},
    ],
    section2Body: 'En la menopausia, los sofocos nocturnos son una causa frecuente de despertares, por razones hormonales similares.',
    section3Body: 'El estrés puede amplificar las alteraciones del sueño durante las fases del ciclo que ya son más sensibles. Algunas técnicas de relajación sencillas (respiración, estiramientos suaves) pueden ayudar a calmarte antes de acostarte.',
    section4Body: 'Una rutina de sueño estable y una habitación fresca ayudan a limitar estas alteraciones, a cualquier edad.',
    eveningRoutine: [
      {title: 'Horarios regulares', text: 'Acostarse y levantarse a horas estables ayuda a regular el reloj interno.'},
      {title: 'Menos pantallas por la noche', text: 'La luz azul puede retrasar el sueño; una pausa de pantallas ayuda a relajarte.'},
      {title: 'Una habitación fresca', text: 'Una temperatura moderada facilita conciliar el sueño, a cualquier edad.'},
    ],
    section5Body: 'Los buenos hábitos no siempre son suficientes. Puede ser útil hablar con un profesional si:',
    warningTitle: 'Señales que merecen una consulta',
    consultSigns: [
      'Los problemas de sueño duran desde hace varias semanas',
      'El cansancio afecta fuertemente a tu vida diaria',
      'El insomnio persiste a pesar de tener buenos hábitos',
    ],
    infoCard2Title: 'Prepararte para esa consulta',
    infoCard2Text: 'Anotar desde cuándo duran los problemas y qué parece influir en ellos puede ayudar a tu profesional de la salud a orientarte mejor.',
    tipTitle: 'Dato útil',
    tipText: 'Estas variaciones del sueño son frecuentes y suelen ser temporales: no significan que haya un problema.',
    summaryPoints: [
      'La progesterona tiene un ligero efecto sedante; su descenso al final del ciclo puede alterar el sueño.',
      'En la menopausia, los sofocos nocturnos son una causa frecuente de despertares.',
      'Una rutina de sueño estable y una habitación fresca ayudan a limitar estas alteraciones, a cualquier edad.',
      'Los problemas de sueño que persisten merecen comentarse con un profesional de la salud.',
    ],
    disclaimerText: 'Contenido informativo. Este artículo no sustituye una opinión médica personalizada. Si tienes dudas, consulta a un profesional de la salud.',
    shareMessage: 'Sueño y hormonas: el vínculo poco conocido — AWA',
  },
  it: {
    badge: 'CICLO MESTRUALE • SONNO',
    title: 'Sonno e ormoni:\nil legame poco noto',
    metaDuration: '6 min di lettura',
    metaType: 'Articolo',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Perché il tuo sonno cambia a seconda della fase del ciclo e in menopausa.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Perché gli ormoni influenzano il sonno',
      'Il sonno nelle fasi del ciclo',
      'Stress e qualità del sonno',
      'Una routine serale rilassante',
      'Quando rivolgersi a un professionista',
      'I punti essenziali',
    ],
    section1Body: 'Il progesterone ha un lieve effetto sedativo; il suo calo alla fine del ciclo può disturbare il sonno, rendendolo più leggero o più frammentato.',
    infoCard1Title: 'Da sapere',
    infoCard1Text: 'Anche il leggero aumento della temperatura corporea dopo l’ovulazione può rendere l’addormentamento un po’ più difficile per alcune persone.',
    phaseSleep: [
      {
        title: 'Durante il periodo mestruale',
        text: 'Il disagio fisico e la stanchezza possono rendere il sonno più leggero.',
      },
      {
        title: 'Intorno all’ovulazione',
        text: 'Il sonno è generalmente più stabile per la maggior parte delle persone.',
      },
      {
        title: 'Prima del periodo mestruale',
        text: 'Il calo del progesterone può rendere il sonno più leggero, con possibili risvegli.',
      },
    ],
    section2Body: 'In menopausa, le sudorazioni notturne sono una causa frequente di risveglio, per ragioni ormonali simili.',
    section3Body: 'Lo stress può amplificare i disturbi del sonno nelle fasi del ciclo che sono già più sensibili. Semplici tecniche di rilassamento (respirazione, stretching dolce) possono aiutarti a distenderti prima di dormire.',
    section4Body: 'Una routine regolare prima di andare a letto e una camera fresca aiutano a limitare questi disturbi, a qualsiasi età.',
    eveningRoutine: [
      {
        title: 'Orari regolari',
        text: 'Andare a letto e svegliarsi a orari stabili aiuta a regolare il tuo orologio interno.',
      },
      {
        title: 'Meno schermi la sera',
        text: 'La luce blu può ritardare l’addormentamento; una pausa dagli schermi aiuta a rilassarsi.',
      },
      {
        title: 'Una camera fresca',
        text: 'Una temperatura moderata facilita l’addormentamento, a qualsiasi età.',
      },
    ],
    section5Body: 'Le buone abitudini non sempre bastano. Può essere utile parlarne con un professionista se:',
    warningTitle: 'Segnali da far controllare',
    consultSigns: [
      'I problemi di sonno durano da diverse settimane',
      'La stanchezza incide fortemente sulla vita quotidiana',
      'L’insonnia persiste nonostante le buone abitudini',
    ],
    infoCard2Title: 'Prepararsi a questa visita',
    infoCard2Text: 'Annotare da quanto tempo durano i problemi e che cosa sembra influenzarli può aiutare il tuo professionista sanitario a orientarti meglio.',
    tipTitle: 'Da sapere',
    tipText: 'Questi cambiamenti del sonno sono comuni e di solito temporanei: non significano che ci sia qualcosa che non va.',
    summaryPoints: [
      'Il progesterone ha un lieve effetto sedativo; il suo calo alla fine del ciclo può disturbare il sonno.',
      'In menopausa, le sudorazioni notturne sono una causa frequente di risveglio.',
      'Una routine regolare prima di andare a letto e una camera fresca aiutano a limitare questi disturbi, a qualsiasi età.',
      'I problemi di sonno persistenti meritano di essere discussi con un professionista sanitario.',
    ],
    disclaimerText: 'Contenuto informativo. Questo articolo non sostituisce un parere medico personalizzato. In caso di dubbi, rivolgiti a un professionista sanitario.',
    shareMessage: 'Sonno e ormoni: il legame poco noto — AWA',
  },
  tr: {
    badge: 'ADET DÖNGÜSÜ • UYKU',
    title: 'Uyku ve hormonlar:\nçok bilinmeyen bağlantı',
    metaDuration: '6 dk okuma',
    metaType: 'Makale',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Uykunun neden döngü evrene göre ve menopozda değiştiğini öğren.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Hormonlar uykuyu neden etkiler',
      'Döngü evreleri boyunca uyku',
      'Stres ve uyku kalitesi',
      'Sakinleştirici bir akşam rutini',
      'Ne zaman bir uzmana görünmeli',
      'Akılda tutulacaklar',
    ],
    section1Body: 'Progesteronun hafif yatıştırıcı bir etkisi vardır; döngünün sonunda düşmesi uykuyu bozabilir, daha hafif ya da daha bölünmüş hâle getirebilir.',
    infoCard1Title: 'Bilmekte fayda var',
    infoCard1Text: 'Yumurtlamadan sonra vücut sıcaklığındaki hafif yükselme, bazı kişilerde uykuya dalmayı biraz zorlaştırabilir.',
    phaseSleep: [
      {
        title: 'Adet sırasında',
        text: 'Fiziksel rahatsızlık ve yorgunluk uykuyu hafifletebilir.',
      },
      {
        title: 'Yumurtlama civarında',
        text: 'Uyku çoğu kişide genellikle daha dengelidir.',
      },
      {
        title: 'Adetten önce',
        text: 'Progesteronun düşmesi uykuyu hafifletebilir; gece uyanmaları olabilir.',
      },
    ],
    section2Body: 'Menopozda gece terlemeleri, benzer hormonal nedenlerle uyanmanın yaygın bir sebebidir.',
    section3Body: 'Stres, döngünün zaten daha hassas olan evrelerinde uyku bozukluklarını güçlendirebilir. Basit gevşeme teknikleri (nefes egzersizi, nazik esneme hareketleri) yatmadan önce rahatlamana yardımcı olabilir.',
    section4Body: 'Düzenli bir yatma rutini ve serin bir yatak odası, her yaşta bu bozuklukları sınırlamaya yardımcı olur.',
    eveningRoutine: [
      {
        title: 'Düzenli saatler',
        text: 'Sabit saatlerde yatıp kalkmak iç saatini düzenlemene yardımcı olur.',
      },
      {
        title: 'Akşamları daha az ekran',
        text: 'Mavi ışık uykuya dalmayı geciktirebilir; ekrana ara vermek yavaşlamana yardımcı olur.',
      },
      {
        title: 'Serin bir yatak odası',
        text: 'Ölçülü bir sıcaklık, her yaşta uykuya dalmayı kolaylaştırır.',
      },
    ],
    section5Body: 'İyi alışkanlıklar her zaman yeterli olmaz. Şu durumlarda bir uzmanla konuşmak faydalı olabilir:',
    warningTitle: 'Kontrol ettirmeye değer belirtiler',
    consultSigns: [
      'Uyku sorunları birkaç haftadır sürüyorsa',
      'Yorgunluk gündelik hayatı güçlü biçimde etkiliyorsa',
      'İyi alışkanlıklara rağmen uykusuzluk sürüyorsa',
    ],
    infoCard2Title: 'Bu randevuya hazırlanmak',
    infoCard2Text: 'Sorunların ne kadar süredir devam ettiğini ve neyin etkili olduğunu düşündüğünü not etmek, sağlık uzmanının seni daha iyi yönlendirmesine yardımcı olabilir.',
    tipTitle: 'Bilmekte fayda var',
    tipText: 'Bu uyku değişiklikleri yaygındır ve genellikle geçicidir: bir şeylerin ters gittiği anlamına gelmez.',
    summaryPoints: [
      'Progesteronun hafif yatıştırıcı bir etkisi vardır; döngünün sonunda düşmesi uykuyu bozabilir.',
      'Menopozda gece terlemeleri, uyanmanın yaygın bir sebebidir.',
      'Düzenli bir yatma rutini ve serin bir yatak odası, her yaşta bu bozuklukları sınırlamaya yardımcı olur.',
      'Süren uyku sorunları bir sağlık uzmanıyla konuşulmaya değerdir.',
    ],
    disclaimerText: 'Bilgilendirici içerik. Bu makale kişiye özel tıbbi görüşün yerini almaz. Şüphen varsa bir sağlık uzmanından yönlendirme al.',
    shareMessage: 'Uyku ve hormonlar: çok bilinmeyen bağlantı — AWA',
  },
  ru: {
    badge: 'МЕНСТРУАЛЬНЫЙ ЦИКЛ • СОН',
    title: 'Сон и гормоны:\nмало известная связь',
    metaDuration: '6 мин чтения',
    metaType: 'Статья',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'Почему сон меняется в зависимости от фазы цикла и в менопаузе.',
    contentsTitle: 'В этой статье',
    topics: [
      'Почему гормоны влияют на сон',
      'Сон в разные фазы цикла',
      'Стресс и качество сна',
      'Успокаивающий вечерний ритуал',
      'Когда обратиться к специалисту',
      'Главное',
    ],
    section1Body: 'Прогестерон оказывает мягкое седативное действие; его снижение в конце цикла может нарушать сон, делая его более поверхностным или прерывистым.',
    infoCard1Title: 'ПОЛЕЗНО ЗНАТЬ',
    infoCard1Text: 'Небольшое повышение температуры тела после овуляции тоже может немного затруднять засыпание у некоторых женщин.',
    phaseSleep: [
      {title: 'Во время месячных', text: 'Физический дискомфорт и усталость могут делать сон более поверхностным.'},
      {title: 'Около овуляции', text: 'Сон, как правило, более стабильный у большинства женщин.'},
      {title: 'Перед месячными', text: 'Снижение прогестерона может делать сон более поверхностным, с возможными пробуждениями.'},
    ],
    section2Body: 'В менопаузе ночная потливость — частая причина пробуждений, по схожим гормональным причинам.',
    section3Body: 'Стресс может усиливать нарушения сна в фазы цикла, которые и без того более чувствительны. Простые техники расслабления (дыхание, мягкая растяжка) помогут расслабиться перед сном.',
    section4Body: 'Стабильный режим перед сном и прохладная спальня помогают ограничить эти нарушения в любом возрасте.',
    eveningRoutine: [
      {title: 'Регулярный режим', text: 'Если ложиться и вставать в одно и то же время, это помогает регулировать внутренние часы.'},
      {title: 'Меньше экранов вечером', text: 'Синий свет может отсрочить засыпание; перерыв от экранов помогает расслабиться.'},
      {title: 'Прохладная спальня', text: 'Умеренная температура облегчает засыпание в любом возрасте.'},
    ],
    section5Body: 'Хороших привычек не всегда достаточно. Обратиться к специалисту может быть полезно, если:',
    warningTitle: 'Признаки, при которых стоит пройти обследование',
    consultSigns: [
      'Проблемы со сном продолжаются несколько недель',
      'Усталость сильно влияет на повседневную жизнь',
      'Бессонница сохраняется, несмотря на хорошие привычки',
    ],
    infoCard2Title: 'Подготовка к визиту',
    infoCard2Text: 'Если отметить, как долго длятся проблемы и что, по-видимому, на них влияет, медицинскому специалисту будет легче вас сориентировать.',
    tipTitle: 'ПОЛЕЗНО ЗНАТЬ',
    tipText: 'Такие изменения сна встречаются часто и обычно временны: они не означают, что что-то не так.',
    summaryPoints: [
      'Прогестерон оказывает мягкое седативное действие; его снижение в конце цикла может нарушать сон.',
      'В менопаузе ночная потливость — частая причина пробуждений.',
      'Стабильный режим перед сном и прохладная спальня помогают ограничить эти нарушения в любом возрасте.',
      'Стойкие проблемы со сном стоит обсудить со медицинским специалистом.',
    ],
    disclaimerText: 'Информационный материал. Эта статья не заменяет индивидуальную медицинскую консультацию. При сомнениях обратитесь за рекомендацией к медицинскому специалисту.',
    shareMessage: 'Сон и гормоны: мало известная связь — AWA',
  },
  de: {
    badge: 'MENSTRUATIONSZYKLUS • SCHLAF',
    title: 'Schlaf und Hormone:\nder wenig bekannte Zusammenhang',
    metaDuration: '6 Min. Lesezeit',
    metaType: 'Artikel',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Warum sich dein Schlaf je nach Zyklusphase und in den Wechseljahren verändert.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Warum Hormone den Schlaf beeinflussen',
      'Schlaf in den Phasen des Zyklus',
      'Stress und Schlafqualität',
      'Eine beruhigende Abendroutine',
      'Wann du Fachpersonal aufsuchen solltest',
      'Das Wichtigste in Kürze',
    ],
    section1Body: 'Progesteron wirkt leicht beruhigend; sein Absinken am Ende des Zyklus kann den Schlaf stören und ihn leichter oder unterbrochener machen.',
    infoCard1Title: 'Gut zu wissen',
    infoCard1Text: 'Der leichte Anstieg der Körpertemperatur nach dem Eisprung kann das Einschlafen bei manchen Frauen ebenfalls etwas erschweren.',
    phaseSleep: [
      {title: 'Während deiner Periode', text: 'Körperliche Beschwerden und Müdigkeit können den Schlaf leichter machen.'},
      {title: 'Rund um den Eisprung', text: 'Der Schlaf ist bei den meisten in der Regel stabiler.'},
      {title: 'Vor deiner Periode', text: 'Das Absinken des Progesterons kann den Schlaf leichter machen, mit möglichem nächtlichem Aufwachen.'},
    ],
    section2Body: 'In den Wechseljahren sind nächtliche Schweißausbrüche aus ähnlichen hormonellen Gründen eine häufige Ursache für Aufwachen.',
    section3Body: 'Stress kann Schlafstörungen in ohnehin empfindlicheren Zyklusphasen verstärken. Einfache Entspannungstechniken (Atmen, sanftes Dehnen) können dir helfen, vor dem Schlafengehen zur Ruhe zu kommen.',
    section4Body: 'Eine feste Abendroutine und ein kühles Schlafzimmer helfen, diese Störungen in jedem Alter zu begrenzen.',
    eveningRoutine: [
      {title: 'Feste Zeiten', text: 'Regelmäßige Zeiten zum Schlafengehen und Aufstehen helfen, deine innere Uhr zu regulieren.'},
      {title: 'Abends weniger Bildschirm', text: 'Blaues Licht kann das Einschlafen verzögern; eine Bildschirmpause hilft dir, herunterzufahren.'},
      {title: 'Ein kühles Schlafzimmer', text: 'Eine moderate Temperatur erleichtert das Einschlafen in jedem Alter.'},
    ],
    section5Body: 'Gute Gewohnheiten reichen nicht immer aus. Ein Gespräch mit medizinischem Fachpersonal kann hilfreich sein, wenn:',
    warningTitle: 'Anzeichen, die du abklären lassen solltest',
    consultSigns: [
      'Schlafprobleme bestehen seit mehreren Wochen',
      'Die Müdigkeit beeinträchtigt deinen Alltag stark',
      'Die Schlaflosigkeit hält trotz guter Gewohnheiten an',
    ],
    infoCard2Title: 'Vorbereitung auf diesen Termin',
    infoCard2Text: 'Wenn du notierst, wie lange die Beschwerden schon bestehen und was sie zu beeinflussen scheint, kann dein medizinisches Fachpersonal dich besser beraten.',
    tipTitle: 'Gut zu wissen',
    tipText: 'Diese Schlafveränderungen sind häufig und meist vorübergehend: Sie bedeuten nicht, dass etwas nicht stimmt.',
    summaryPoints: [
      'Progesteron wirkt leicht beruhigend; sein Absinken am Ende des Zyklus kann den Schlaf stören.',
      'In den Wechseljahren sind nächtliche Schweißausbrüche eine häufige Ursache für Aufwachen.',
      'Eine feste Abendroutine und ein kühles Schlafzimmer helfen, diese Störungen in jedem Alter zu begrenzen.',
      'Anhaltende Schlafprobleme solltest du mit medizinischem Fachpersonal besprechen.',
    ],
    disclaimerText: 'Informationsinhalt. Dieser Artikel ersetzt keine individuelle ärztliche Beratung. Bei Zweifeln wende dich an medizinisches Fachpersonal.',
    shareMessage: 'Schlaf und Hormone: der wenig bekannte Zusammenhang – AWA',
  },
  zh: {
      badge: '月经周期 • 睡眠',
      title: '睡眠与激素：\n鲜为人知的联系',
      metaDuration: '阅读约 6 分钟',
      metaType: '文章',
      metaLevel: '入门',
      metaValidated: '已审阅内容',
      intro: '为什么你的睡眠会随周期阶段而变化，以及绝经时的睡眠变化。',
      contentsTitle: '本文内容',
      topics: [
        '为什么激素会影响睡眠',
        '周期各阶段的睡眠',
        '压力与睡眠质量',
        '舒缓的睡前习惯',
        '什么时候该看专业人员',
        '要点回顾',
      ],
      section1Body: '孕激素有轻微的镇静作用；周期末期它的下降可能扰乱睡眠，让睡眠变浅或更容易中断。',
      infoCard1Title: '小贴士',
      infoCard1Text: '排卵后体温的轻微升高，也可能让一些人更难入睡。',
      phaseSleep: [
        {
          title: '月经期间',
          text: '身体的不适和疲倦可能让睡眠变浅。',
        },
        {
          title: '排卵前后',
          text: '对大多数人来说，睡眠通常更稳定。',
        },
        {
          title: '月经来潮前',
          text: '孕激素下降可能让睡眠变浅，并可能出现夜间醒来。',
        },
      ],
      section2Body: '到了绝经期，夜间盗汗是常见的醒来原因，背后的激素原因与之相似。',
      section3Body: '在周期中本就更敏感的阶段，压力可能放大睡眠的干扰。简单的放松方法（呼吸、轻柔的拉伸）可以帮助你在睡前放松下来。',
      section4Body: '固定的睡前习惯和凉爽的卧室，有助于减少这些干扰，不论什么年龄都适用。',
      eveningRoutine: [
        {
          title: '规律的作息',
          text: '在固定的时间上床和起床，有助于调节你的生物钟。',
        },
        {
          title: '晚上少看屏幕',
          text: '蓝光可能推迟入睡；暂时放下屏幕，有助于让自己放松下来。',
        },
        {
          title: '凉爽的卧室',
          text: '适中的温度更容易入睡，不论什么年龄都是如此。',
        },
      ],
      section5Body: '良好的习惯并不总是足够。在以下情况下，和专业人员谈一谈会有帮助：',
      warningTitle: '值得检查的迹象',
      consultSigns: [
        '睡眠问题已持续数周',
        '疲倦严重影响日常生活',
        '即使养成了良好习惯，失眠仍然持续',
      ],
      infoCard2Title: '为就诊做准备',
      infoCard2Text: '记下问题持续了多久、似乎受什么影响，可以帮助医疗专业人员更好地为你提供指导。',
      tipTitle: '小贴士',
      tipText: '这些睡眠变化很常见，通常是暂时的：并不意味着哪里出了问题。',
      summaryPoints: [
        '孕激素有轻微的镇静作用；周期末期它的下降可能扰乱睡眠。',
        '到了绝经期，夜间盗汗是常见的醒来原因。',
        '固定的睡前习惯和凉爽的卧室，有助于减少这些干扰，不论什么年龄都适用。',
        '持续的睡眠问题，值得与医疗专业人员讨论。',
      ],
      disclaimerText: '仅供参考。本文不能替代个性化的医生建议。如有疑虑，请咨询医疗专业人员。',
      shareMessage: '睡眠与激素：鲜为人知的联系 — AWA',
    },
  id: {
    badge: 'SIKLUS MENSTRUASI • TIDUR',
    title: 'Tidur dan hormon:\nkaitan yang jarang diketahui',
    metaDuration: '6 menit baca',
    metaType: 'Artikel',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Mengapa tidurmu berubah sesuai fase siklus, dan saat menopause.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Mengapa hormon memengaruhi tidur',
      'Tidur di setiap fase siklus',
      'Stres dan kualitas tidur',
      'Rutinitas malam yang menenangkan',
      'Kapan perlu menemui tenaga profesional',
      'Poin penting',
    ],
    section1Body: 'Progesteron memiliki efek sedatif ringan; penurunannya di akhir siklus bisa mengganggu tidur, membuatnya lebih ringan atau lebih sering terputus.',
    infoCard1Title: 'Perlu diketahui',
    infoCard1Text: 'Kenaikan ringan suhu tubuh setelah ovulasi juga dapat membuat sebagian orang sedikit lebih sulit tertidur.',
    phaseSleep: [
      {
        title: 'Saat haid',
        text: 'Rasa tidak nyaman di tubuh dan kelelahan bisa membuat tidur lebih ringan.',
      },
      {
        title: 'Sekitar ovulasi',
        text: 'Tidur umumnya lebih stabil bagi kebanyakan orang.',
      },
      {
        title: 'Sebelum haid',
        text: 'Penurunan progesteron bisa membuat tidur lebih ringan, dengan kemungkinan terbangun di malam hari.',
      },
    ],
    section2Body: 'Saat menopause, keringat malam adalah penyebab umum terbangun di tengah tidur, karena alasan hormonal yang serupa.',
    section3Body: 'Stres bisa memperkuat gangguan tidur pada fase siklus yang memang sudah lebih sensitif. Teknik relaksasi sederhana (pernapasan, peregangan lembut) dapat membantumu rileks sebelum tidur.',
    section4Body: 'Rutinitas tidur yang teratur dan kamar yang sejuk membantu membatasi gangguan ini, di usia berapa pun.',
    eveningRoutine: [
      {
        title: 'Jam yang teratur',
        text: 'Tidur dan bangun pada jam yang stabil membantu mengatur jam biologis tubuhmu.',
      },
      {
        title: 'Kurangi layar di malam hari',
        text: 'Cahaya biru bisa menunda rasa kantuk; istirahat dari layar membantumu menenangkan diri.',
      },
      {
        title: 'Kamar yang sejuk',
        text: 'Suhu yang sedang memudahkan tertidur, di usia berapa pun.',
      },
    ],
    section5Body: 'Kebiasaan baik tidak selalu cukup. Berbicara dengan tenaga profesional bisa membantu jika:',
    warningTitle: 'Tanda yang perlu diperiksakan',
    consultSigns: [
      'Masalah tidur sudah berlangsung selama beberapa minggu',
      'Kelelahan sangat memengaruhi kehidupan sehari-hari',
      'Insomnia berlanjut meski kebiasaanmu sudah baik',
    ],
    infoCard2Title: 'Bersiap untuk janji temu ini',
    infoCard2Text: 'Mencatat sudah berapa lama masalah itu berlangsung dan apa yang tampaknya memengaruhinya dapat membantu tenaga kesehatanmu membimbingmu dengan lebih baik.',
    tipTitle: 'Perlu diketahui',
    tipText: 'Perubahan tidur ini umum terjadi dan biasanya bersifat sementara: ini tidak berarti ada yang salah.',
    summaryPoints: [
      'Progesteron memiliki efek sedatif ringan; penurunannya di akhir siklus bisa mengganggu tidur.',
      'Saat menopause, keringat malam adalah penyebab umum terbangun di tengah tidur.',
      'Rutinitas tidur yang teratur dan kamar yang sejuk membantu membatasi gangguan ini, di usia berapa pun.',
      'Masalah tidur yang menetap perlu dibicarakan dengan tenaga kesehatan.',
    ],
    disclaimerText: 'Konten informatif. Artikel ini tidak menggantikan saran medis yang dipersonalisasi. Jika ragu, mintalah bimbingan dari tenaga kesehatan.',
    shareMessage: 'Tidur dan hormon: kaitan yang jarang diketahui — AWA',
  },
  hi: {
    badge: 'मासिक चक्र • नींद',
    title: 'नींद और हार्मोन:\nएक कम जाना-पहचाना रिश्ता',
    metaDuration: '6 मिनट का पाठ',
    metaType: 'लेख',
    metaLevel: 'शुरुआती',
    metaValidated: 'समीक्षा किया गया कंटेंट',
    intro: 'चक्र के अलग-अलग चरणों में और मेनोपॉज़ के समय आपकी नींद क्यों बदलती है।',
    contentsTitle: 'इस लेख में',
    topics: [
      'हार्मोन नींद को क्यों प्रभावित करते हैं',
      'चक्र के चरणों में नींद',
      'तनाव और नींद की गुणवत्ता',
      'शाम की सुकून भरी दिनचर्या',
      'प्रोफ़ेशनल से कब मिलें',
      'मुख्य बातें',
    ],
    section1Body: 'प्रोजेस्टेरोन का हल्का सुकून देने वाला असर होता है; चक्र के अंत में इसके घटने से नींद बिगड़ सकती है, यानी नींद हल्की या टूटी-टूटी हो सकती है।',
    infoCard1Title: 'जानना अच्छा रहेगा',
    infoCard1Text: 'ओव्यूलेशन (अंडोत्सर्ग) के बाद शरीर के तापमान में हल्की बढ़त से कुछ महिलाओं को नींद आने में थोड़ी मुश्किल भी हो सकती है।',
    phaseSleep: [
      {
        title: 'आपके पीरियड के दौरान',
        text: 'शारीरिक बेचैनी और थकान से नींद हल्की हो सकती है।',
      },
      {
        title: 'ओव्यूलेशन के आसपास',
        text: 'ज़्यादातर महिलाओं में नींद आमतौर पर ज़्यादा स्थिर रहती है।',
      },
      {
        title: 'पीरियड से पहले',
        text: 'प्रोजेस्टेरोन के घटने से नींद हल्की हो सकती है और बीच-बीच में आँख खुल सकती है।',
      },
    ],
    section2Body: 'मेनोपॉज़ (रजोनिवृत्ति) में रात को पसीना आना नींद खुलने का एक आम कारण है, जिसके पीछे भी इसी तरह के हार्मोनल बदलाव होते हैं।',
    section3Body: 'तनाव उन चरणों में नींद की गड़बड़ियों को और बढ़ा सकता है जब शरीर पहले से ज़्यादा संवेदनशील होता है। साँस के अभ्यास और हल्की स्ट्रेचिंग जैसी आसान रिलैक्सेशन तकनीकें सोने से पहले मन को शांत करने में मदद कर सकती हैं।',
    section4Body: 'सोने का तय समय और ठंडा कमरा इन गड़बड़ियों को कम करने में मदद करते हैं, किसी भी उम्र में।',
    eveningRoutine: [
      {
        title: 'नियमित समय',
        text: 'तय समय पर सोना और उठना आपकी शरीर की घड़ी को सही रखने में मदद करता है।',
      },
      {
        title: 'शाम को स्क्रीन कम देखें',
        text: 'नीली रोशनी नींद आने में देरी कर सकती है; स्क्रीन से ब्रेक लेने से मन शांत होता है।',
      },
      {
        title: 'ठंडा कमरा',
        text: 'मध्यम तापमान में नींद आना आसान होता है, किसी भी उम्र में।',
      },
    ],
    section5Body: 'अच्छी आदतें हमेशा काफ़ी नहीं होतीं। इन स्थितियों में किसी स्वास्थ्य विशेषज्ञ से बात करना मददगार हो सकता है:',
    warningTitle: 'जाँच करवाने लायक संकेत',
    consultSigns: [
      'नींद की समस्या कई हफ़्तों से बनी हुई है',
      'थकान रोज़मर्रा की ज़िंदगी को काफ़ी प्रभावित कर रही है',
      'अच्छी आदतों के बावजूद अनिद्रा बनी रहती है',
    ],
    infoCard2Title: 'इस अपॉइंटमेंट की तैयारी',
    infoCard2Text: 'समस्या कितने समय से है और किन बातों का उस पर असर दिखता है, यह नोट कर लेने से आपके स्वास्थ्य विशेषज्ञ आपको बेहतर मार्गदर्शन दे पाते हैं।',
    tipTitle: 'जानना अच्छा रहेगा',
    tipText: 'नींद में ये बदलाव आम हैं और आमतौर पर अस्थायी होते हैं: इसका मतलब यह नहीं कि कुछ गड़बड़ है।',
    summaryPoints: [
      'प्रोजेस्टेरोन का हल्का सुकून देने वाला असर होता है; चक्र के अंत में इसके घटने से नींद बिगड़ सकती है।',
      'मेनोपॉज़ में रात को पसीना आना नींद खुलने का एक आम कारण है।',
      'सोने का तय समय और ठंडा कमरा इन गड़बड़ियों को कम करने में मदद करते हैं, किसी भी उम्र में।',
      'नींद की लगातार समस्या के बारे में किसी स्वास्थ्य विशेषज्ञ से बात करना ठीक रहता है।',
    ],
    disclaimerText: 'यह जानकारी सिर्फ़ सामान्य जानकारी के लिए है। यह लेख व्यक्तिगत चिकित्सकीय सलाह का विकल्प नहीं है। संदेह होने पर किसी स्वास्थ्य विशेषज्ञ से सलाह लें।',
    shareMessage: 'नींद और हार्मोन: एक कम जाना-पहचाना रिश्ता — AWA',
  },
  sq: {
    badge: 'CIKLI MENSTRUAL • GJUMI',
    title: 'Gjumi dhe hormonet:\nlidhja e pak e njohur',
    metaDuration: '6 min lexim',
    metaType: 'Artikull',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Pse gjumi yt ndryshon sipas fazës së ciklit dhe në menopauzë.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Pse hormonet ndikojnë te gjumi',
      'Gjumi gjatë fazave të ciklit',
      'Stresi dhe cilësia e gjumit',
      'Një rutinë e qetë mbrëmjeje',
      'Kur duhet të konsultohesh me një profesionist',
      'Pikat kryesore',
    ],
    section1Body: 'Progesteroni ka një efekt të lehtë qetësues; rënia e tij në fund të ciklit mund ta prishë gjumin, duke e bërë më sipërfaqësor ose më të ndërprerë.',
    infoCard1Title: 'Mirë është ta dish',
    infoCard1Text: 'Rritja e lehtë e temperaturës së trupit pas ovulacionit mund ta bëjë pak më të vështirë përgjumjen te disa njerëz.',
    phaseSleep: [
      {
        title: 'Gjatë menstruacioneve',
        text: 'Siklleti fizik dhe lodhja mund ta bëjnë gjumin më sipërfaqësor.',
      },
      {
        title: 'Rreth ovulacionit',
        text: 'Gjumi është përgjithësisht më i qëndrueshëm për shumicën e njerëzve.',
      },
      {
        title: 'Para menstruacioneve',
        text: 'Rënia e progesteronit mund ta bëjë gjumin më sipërfaqësor, me zgjime të mundshme.',
      },
    ],
    section2Body: 'Në menopauzë, djersët e natës janë një shkak i zakonshëm i zgjimeve, për arsye hormonale të ngjashme.',
    section3Body: 'Stresi mund t’i përforcojë shqetësimet e gjumit gjatë fazave të ciklit që janë tashmë më të ndjeshme. Teknika të thjeshta çlodhjeje (frymëmarrja, shtrirjet e buta) mund të të ndihmojnë të çlodhesh para gjumit.',
    section4Body: 'Një rutinë e qëndrueshme para gjumit dhe një dhomë gjumi e freskët ndihmojnë t’i kufizosh këto shqetësime, në çdo moshë.',
    eveningRoutine: [
      {
        title: 'Orare të rregullta',
        text: 'Shtrirja në shtrat dhe zgjimi në orare të qëndrueshme ndihmon në rregullimin e orës sate të brendshme.',
      },
      {
        title: 'Më pak ekran në mbrëmje',
        text: 'Drita blu mund ta shtyjë përgjumjen; një pushim nga ekrani të ndihmon të qetësohesh.',
      },
      {
        title: 'Një dhomë gjumi e freskët',
        text: 'Një temperaturë e moderuar e bën përgjumjen më të lehtë, në çdo moshë.',
      },
    ],
    section5Body: 'Zakonet e mira nuk mjaftojnë gjithmonë. Mund të jetë e dobishme të flasësh me një profesionist nëse:',
    warningTitle: 'Shenja për t’u kontrolluar',
    consultSigns: [
      'Problemet e gjumit kanë zgjatur disa javë',
      'Lodhja po ndikon fort në jetën e përditshme',
      'Pagjumësia vazhdon pavarësisht nga zakonet e mira',
    ],
    infoCard2Title: 'Përgatitja për këtë takim',
    infoCard2Text: 'Të shënosh sa kohë kanë zgjatur problemet dhe çfarë duket se ndikon te ato mund ta ndihmojë profesionistin tënd të shëndetësisë të të orientojë më mirë.',
    tipTitle: 'Mirë është ta dish',
    tipText: 'Këto ndryshime të gjumit janë të zakonshme dhe zakonisht të përkohshme: nuk do të thotë se diçka nuk shkon.',
    summaryPoints: [
      'Progesteroni ka një efekt të lehtë qetësues; rënia e tij në fund të ciklit mund ta prishë gjumin.',
      'Në menopauzë, djersët e natës janë një shkak i zakonshëm i zgjimeve.',
      'Një rutinë e qëndrueshme para gjumit dhe një dhomë gjumi e freskët ndihmojnë t’i kufizosh këto shqetësime, në çdo moshë.',
      'Problemet e vazhdueshme të gjumit vlen t’i diskutosh me një profesionist të shëndetësisë.',
    ],
    disclaimerText: 'Përmbajtje informuese. Ky artikull nuk zëvendëson këshillën mjekësore të personalizuar. Në rast dyshimi, kërko orientim nga një profesionist i shëndetësisë.',
    shareMessage: 'Gjumi dhe hormonet: lidhja e pak e njohur — AWA',
  },
  ja: {
    badge: '生理周期 • 睡眠',
    title: '睡眠とホルモン：\nあまり知られていない関係',
    metaDuration: '読了時間6分',
    metaType: '記事',
    metaLevel: '初級',
    metaValidated: '確認済みの内容',
    intro: '周期のフェーズや更年期によって、なぜ睡眠が変わるのかを解説します。',
    contentsTitle: 'この記事の内容',
    topics: [
      'ホルモンが睡眠に影響する理由',
      '周期のフェーズごとの睡眠',
      'ストレスと睡眠の質',
      '心地よい夜の習慣',
      '専門家に相談するタイミング',
      'ポイントのまとめ',
    ],
    section1Body: 'プロゲステロンには穏やかな鎮静作用があります。周期の終わりにその分泌が減ると、睡眠が浅くなったり、途中で目が覚めやすくなったりすることがあります。',
    infoCard1Title: '知っておきたいこと',
    infoCard1Text: '排卵後に体温がわずかに上がることで、人によっては寝つきが少し悪くなることもあります。',
    phaseSleep: [
      {
        title: '生理中',
        text: '体の不快感や疲れのせいで、眠りが浅くなることがあります。',
      },
      {
        title: '排卵の前後',
        text: 'ほとんどの人は、睡眠が比較的安定しています。',
      },
      {
        title: '生理前',
        text: 'プロゲステロンの減少で眠りが浅くなり、夜中に目が覚めることがあります。',
      },
    ],
    section2Body: '更年期には、同じようにホルモンの影響で、寝汗が夜中に目が覚める一般的な原因になります。',
    section3Body: 'ストレスは、もともと敏感になりやすい周期のフェーズでの睡眠の乱れを大きくすることがあります。呼吸法や軽いストレッチなど、簡単なリラックス法は、寝る前に気持ちを落ち着けるのに役立ちます。',
    section4Body: '就寝前の習慣を一定にし、寝室を涼しく保つと、年齢を問わず、こうした乱れを抑えやすくなります。',
    eveningRoutine: [
      {
        title: '規則正しい時間',
        text: '寝る時間と起きる時間を一定にすると、体内時計が整いやすくなります。',
      },
      {
        title: '夜は画面を見る時間を減らす',
        text: 'ブルーライトは寝つきを遅らせることがあります。画面から離れる時間をつくると、気持ちが落ち着きます。',
      },
      {
        title: '涼しい寝室',
        text: 'ほどよい室温だと、年齢を問わず眠りにつきやすくなります。',
      },
    ],
    section5Body: 'よい習慣だけでは足りないこともあります。次のような場合は、専門家に相談するとよいでしょう。',
    warningTitle: '受診を考えたいサイン',
    consultSigns: [
      '睡眠の問題が数週間続いている',
      '疲れが日常生活に大きく影響している',
      'よい習慣を続けても不眠が続く',
    ],
    infoCard2Title: '受診の準備',
    infoCard2Text: '問題がどのくらい続いているか、何が影響していそうかをメモしておくと、医療従事者がより的確に助言しやすくなります。',
    tipTitle: '知っておきたいこと',
    tipText: 'こうした睡眠の変化はよくあることで、多くは一時的です。何か問題があるという意味ではありません。',
    summaryPoints: [
      'プロゲステロンには穏やかな鎮静作用があり、周期の終わりに減ると睡眠が乱れることがあります。',
      '更年期には、寝汗が夜中に目が覚める一般的な原因になります。',
      '就寝前の習慣を一定にし、寝室を涼しく保つと、年齢を問わず、こうした乱れを抑えやすくなります。',
      '睡眠の問題が続く場合は、医療従事者に相談するとよいでしょう。',
    ],
    disclaimerText: '情報提供を目的とした内容です。この記事は、個別の医療上の助言に代わるものではありません。不安がある場合は、医療従事者に相談してください。',
    shareMessage: '睡眠とホルモン：あまり知られていない関係 — AWA',
  },
  ko: {
    badge: '생리 주기 • 수면',
    title: '수면과 호르몬,\n잘 알려지지 않은 관계',
    metaDuration: '읽는 데 6분',
    metaType: '아티클',
    metaLevel: '입문',
    metaValidated: '검토된 콘텐츠',
    intro: '생리 주기의 단계에 따라, 그리고 폐경기에 수면이 달라지는 이유를 알아봐요.',
    contentsTitle: '이 아티클의 내용',
    topics: [
      '호르몬이 수면에 영향을 주는 이유',
      '생리 주기 단계별 수면',
      '스트레스와 수면의 질',
      '편안한 저녁 루틴',
      '전문가를 만나야 할 때',
      '핵심 정리',
    ],
    section1Body: '프로게스테론은 가벼운 진정 작용이 있어요. 주기 끝 무렵에 프로게스테론이 줄어들면 잠이 얕아지거나 자주 깰 수 있어요.',
    infoCard1Title: '알아두면 좋아요',
    infoCard1Text: '배란 후에 체온이 약간 오르면 사람에 따라 잠들기가 조금 더 어려워질 수도 있어요.',
    phaseSleep: [
      {
        title: '생리 중',
        text: '몸이 불편하고 피로하면 잠이 얕아질 수 있어요.',
      },
      {
        title: '배란 즈음',
        text: '대부분은 수면이 비교적 안정적이에요.',
      },
      {
        title: '생리 전',
        text: '프로게스테론이 줄어들면 잠이 얕아지고 중간에 깰 수 있어요.',
      },
    ],
    section2Body: '폐경기에는 비슷한 호르몬 변화 때문에 야간 발한이 잠에서 깨는 흔한 원인이에요.',
    section3Body: '스트레스는 이미 더 예민해진 주기 단계에서 수면 방해를 키울 수 있어요. 호흡이나 가벼운 스트레칭 같은 간단한 이완 방법이 잠자리에 들기 전에 긴장을 푸는 데 도움이 될 수 있어요.',
    section4Body: '일정한 취침 루틴과 시원한 침실은 나이와 상관없이 이런 방해를 줄이는 데 도움이 돼요.',
    eveningRoutine: [
      {
        title: '규칙적인 시간',
        text: '일정한 시간에 자고 일어나면 체내 시계를 조절하는 데 도움이 돼요.',
      },
      {
        title: '저녁에는 화면 줄이기',
        text: '블루라이트는 잠드는 시간을 늦출 수 있어요. 화면을 잠시 멀리하면 긴장을 풀기 좋아요.',
      },
      {
        title: '시원한 침실',
        text: '적당한 온도는 나이와 상관없이 잠들기 쉽게 해 줘요.',
      },
    ],
    section5Body: '좋은 습관만으로는 충분하지 않을 때도 있어요. 다음과 같다면 전문가와 상담해 보는 것이 좋아요.',
    warningTitle: '진료를 받아 볼 만한 신호',
    consultSigns: [
      '수면 문제가 몇 주째 이어지고 있어요',
      '피로가 일상생활에 크게 영향을 주고 있어요',
      '좋은 습관을 지켜도 불면이 계속돼요',
    ],
    infoCard2Title: '진료 준비하기',
    infoCard2Text: '문제가 얼마나 오래 이어졌는지, 무엇이 영향을 주는 것 같은지 적어 두면 의료 전문가가 더 잘 안내해 줄 수 있어요.',
    tipTitle: '알아두면 좋아요',
    tipText: '이런 수면 변화는 흔하고 대개 일시적이에요. 어딘가 잘못되었다는 뜻은 아니에요.',
    summaryPoints: [
      '프로게스테론은 가벼운 진정 작용이 있어서, 주기 끝 무렵에 줄어들면 수면이 방해받을 수 있어요.',
      '폐경기에는 야간 발한이 잠에서 깨는 흔한 원인이에요.',
      '일정한 취침 루틴과 시원한 침실은 나이와 상관없이 이런 방해를 줄이는 데 도움이 돼요.',
      '수면 문제가 계속되면 의료 전문가와 상담해 보는 것이 좋아요.',
    ],
    disclaimerText: '정보 제공용 콘텐츠예요. 이 아티클은 개인별 맞춤 의학적 조언을 대신하지 않아요. 궁금한 점이 있다면 의료 전문가에게 안내를 받으세요.',
    shareMessage: '수면과 호르몬, 잘 알려지지 않은 관계 — AWA',
  },
  'pt-PT': {
    badge: 'CICLO MENSTRUAL • SONO',
    title: 'Sono e hormonas:\na relação pouco conhecida',
    metaDuration: '6 min de leitura',
    metaType: 'Artigo',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'Porque é que o seu sono muda consoante a fase do ciclo e na menopausa.',
    contentsTitle: 'Neste artigo',
    topics: [
      'Porque é que as hormonas afetam o sono',
      'O sono ao longo das fases do ciclo',
      'Stress e qualidade do sono',
      'Uma rotina calma ao fim do dia',
      'Quando consultar um profissional',
      'Pontos a reter',
    ],
    section1Body: 'A progesterona tem um efeito sedativo ligeiro; a sua descida no final do ciclo pode perturbar o sono, tornando-o mais leve ou mais fragmentado.',
    infoCard1Title: 'Bom saber',
    infoCard1Text: 'O ligeiro aumento da temperatura corporal após a ovulação também pode tornar o adormecer um pouco mais difícil para algumas pessoas.',
    phaseSleep: [
      {
        title: 'Durante o período',
        text: 'O desconforto físico e o cansaço podem tornar o sono mais leve.',
      },
      {
        title: 'Perto da ovulação',
        text: 'O sono é geralmente mais estável para a maioria das pessoas.',
      },
      {
        title: 'Antes do período',
        text: 'A descida da progesterona pode tornar o sono mais leve, com possíveis despertares.',
      },
    ],
    section2Body: 'Na menopausa, os suores noturnos são uma causa frequente de despertares, por razões hormonais semelhantes.',
    section3Body: 'O stress pode amplificar as perturbações do sono nas fases do ciclo que já são mais sensíveis. Técnicas simples de relaxamento (respiração, alongamentos suaves) podem ajudar a descontrair antes de dormir.',
    section4Body: 'Uma rotina de deitar estável e um quarto fresco ajudam a limitar estas perturbações, em qualquer idade.',
    eveningRoutine: [
      {
        title: 'Horários regulares',
        text: 'Deitar e acordar a horas estáveis ajuda a regular o relógio biológico.',
      },
      {
        title: 'Menos ecrãs ao fim do dia',
        text: 'A luz azul pode atrasar o adormecer; uma pausa dos ecrãs ajuda a desacelerar.',
      },
      {
        title: 'Um quarto fresco',
        text: 'Uma temperatura moderada facilita o adormecer, em qualquer idade.',
      },
    ],
    section5Body: 'Os bons hábitos nem sempre bastam. Pode ser útil falar com um profissional se:',
    warningTitle: 'Sinais que justificam uma avaliação',
    consultSigns: [
      'Os problemas de sono duram há várias semanas',
      'O cansaço afeta fortemente o dia a dia',
      'A insónia persiste apesar dos bons hábitos',
    ],
    infoCard2Title: 'Preparar esta consulta',
    infoCard2Text: 'Anotar há quanto tempo os problemas duram e o que parece influenciá-los pode ajudar o seu profissional de saúde a orientá-la melhor.',
    tipTitle: 'Bom saber',
    tipText: 'Estas alterações do sono são frequentes e, em geral, temporárias: não significam que algo esteja errado.',
    summaryPoints: [
      'A progesterona tem um efeito sedativo ligeiro; a sua descida no final do ciclo pode perturbar o sono.',
      'Na menopausa, os suores noturnos são uma causa frequente de despertares.',
      'Uma rotina de deitar estável e um quarto fresco ajudam a limitar estas perturbações, em qualquer idade.',
      'Vale a pena falar com um profissional de saúde sobre problemas de sono persistentes.',
    ],
    disclaimerText: 'Conteúdo informativo. Este artigo não substitui um aconselhamento médico personalizado. Em caso de dúvida, procure a orientação de um profissional de saúde.',
    shareMessage: 'Sono e hormonas: a relação pouco conhecida — AWA',
  },
  bn: {
    badge: 'মাসিক চক্র • ঘুম',
    title: 'ঘুম ও হরমোন:\nঅজানা সম্পর্ক',
    metaDuration: 'পড়তে 6 মিনিট',
    metaType: 'নিবন্ধ',
    metaLevel: 'প্রাথমিক',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'চক্রের পর্যায় অনুযায়ী এবং মেনোপজে আপনার ঘুম কেন বদলে যায়।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'হরমোন কেন ঘুমকে প্রভাবিত করে',
      'চক্রের বিভিন্ন পর্যায়ে ঘুম',
      'মানসিক চাপ ও ঘুমের মান',
      'সন্ধ্যার একটি প্রশান্তিদায়ক রুটিন',
      'কখন বিশেষজ্ঞের কাছে যাবেন',
      'মূল কথা',
    ],
    section1Body: 'প্রোজেস্টেরনের হালকা ঘুমপাড়ানি প্রভাব আছে; চক্রের শেষে এর পরিমাণ কমে গেলে ঘুম ব্যাহত হতে পারে, ঘুম হালকা বা বারবার ভেঙে যেতে পারে।',
    infoCard1Title: 'জেনে রাখা ভালো',
    infoCard1Text: 'ডিম্বস্ফোটনের পর শরীরের তাপমাত্রা সামান্য বেড়ে যাওয়ায় কারও কারও ঘুমিয়ে পড়তে একটু কষ্ট হতে পারে।',
    phaseSleep: [
      {
        title: 'মাসিকের সময়',
        text: 'শারীরিক অস্বস্তি ও ক্লান্তির কারণে ঘুম হালকা হতে পারে।',
      },
      {
        title: 'ডিম্বস্ফোটনের সময়',
        text: 'বেশিরভাগ মানুষের ক্ষেত্রে ঘুম সাধারণত বেশি স্থিতিশীল থাকে।',
      },
      {
        title: 'মাসিকের আগে',
        text: 'প্রোজেস্টেরন কমে যাওয়ায় ঘুম হালকা হতে পারে, মাঝে মাঝে ঘুম ভেঙে যেতে পারে।',
      },
    ],
    section2Body: 'মেনোপজে একই ধরনের হরমোনজনিত কারণে রাতে ঘাম হওয়া ঘুম ভেঙে যাওয়ার একটি সাধারণ কারণ।',
    section3Body: 'যে পর্যায়গুলো আগে থেকেই বেশি সংবেদনশীল, সেখানে মানসিক চাপ ঘুমের ব্যাঘাত আরও বাড়িয়ে দিতে পারে। সহজ শিথিলায়নের কৌশল (শ্বাসের ব্যায়াম, হালকা স্ট্রেচিং) ঘুমের আগে মন শান্ত করতে সাহায্য করতে পারে।',
    section4Body: 'নিয়মিত ঘুমানোর রুটিন এবং শীতল শোবার ঘর যেকোনো বয়সে এই ব্যাঘাত কমাতে সাহায্য করে।',
    eveningRoutine: [
      {
        title: 'নিয়মিত সময়',
        text: 'প্রতিদিন নির্দিষ্ট সময়ে ঘুমাতে যাওয়া ও ঘুম থেকে ওঠা আপনার শরীরের অভ্যন্তরীণ ঘড়ি নিয়ন্ত্রণে সাহায্য করে।',
      },
      {
        title: 'সন্ধ্যায় স্ক্রিন কম ব্যবহার',
        text: 'নীল আলো ঘুম আসতে দেরি করাতে পারে; স্ক্রিন থেকে বিরতি নিলে মন শান্ত হয়।',
      },
      {
        title: 'শীতল শোবার ঘর',
        text: 'মাঝারি তাপমাত্রা যেকোনো বয়সে ঘুমিয়ে পড়া সহজ করে।',
      },
    ],
    section5Body: 'ভালো অভ্যাসই সবসময় যথেষ্ট নয়। নিচের ক্ষেত্রে কোনো বিশেষজ্ঞের সঙ্গে কথা বলা সহায়ক হতে পারে:',
    warningTitle: 'যে লক্ষণে পরীক্ষা করানো উচিত',
    consultSigns: [
      'ঘুমের সমস্যা বেশ কয়েক সপ্তাহ ধরে চলছে',
      'ক্লান্তি দৈনন্দিন জীবনে মারাত্মকভাবে প্রভাব ফেলছে',
      'ভালো অভ্যাস সত্ত্বেও অনিদ্রা থেকে যাচ্ছে',
    ],
    infoCard2Title: 'এই অ্যাপয়েন্টমেন্টের প্রস্তুতি',
    infoCard2Text: 'সমস্যাগুলো কতদিন ধরে চলছে এবং কী কী বিষয় এতে প্রভাব ফেলছে বলে মনে হয়, তা লিখে রাখলে আপনার স্বাস্থ্যসেবা পেশাজীবী আপনাকে আরও ভালোভাবে দিকনির্দেশনা দিতে পারবেন।',
    tipTitle: 'জেনে রাখা ভালো',
    tipText: 'ঘুমের এই পরিবর্তনগুলো সাধারণ এবং সাধারণত সাময়িক: এর অর্থ এই নয় যে কিছু ভুল আছে।',
    summaryPoints: [
      'প্রোজেস্টেরনের হালকা ঘুমপাড়ানি প্রভাব আছে; চক্রের শেষে এর পরিমাণ কমে গেলে ঘুম ব্যাহত হতে পারে।',
      'মেনোপজে রাতে ঘাম হওয়া ঘুম ভেঙে যাওয়ার একটি সাধারণ কারণ।',
      'নিয়মিত ঘুমানোর রুটিন এবং শীতল শোবার ঘর যেকোনো বয়সে এই ব্যাঘাত কমাতে সাহায্য করে।',
      'ঘুমের স্থায়ী সমস্যা কোনো স্বাস্থ্যসেবা পেশাজীবীর সঙ্গে আলোচনা করা উচিত।',
    ],
    disclaimerText: 'তথ্যমূলক বিষয়বস্তু। এই নিবন্ধ ব্যক্তিগত চিকিৎসা পরামর্শের বিকল্প নয়। সন্দেহ থাকলে কোনো স্বাস্থ্যসেবা পেশাজীবীর পরামর্শ নিন।',
    shareMessage: 'ঘুম ও হরমোন: অজানা সম্পর্ক — AWA',
  },
  da: {
    badge: 'MENSTRUATIONSCYKLUS • SØVN',
    title: 'Søvn og hormoner:\nden skjulte forbindelse',
    metaDuration: '6 min læsning',
    metaType: 'Artikel',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemgået indhold',
    intro: 'Hvorfor din søvn ændrer sig afhængigt af cyklussens fase og under menopausen.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvorfor hormoner påvirker søvnen',
      'Søvn i cyklussens faser',
      'Stress og søvnkvalitet',
      'En beroligende aftenrutine',
      'Hvornår bør du opsøge en specialist',
      'Vigtige pointer',
    ],
    section1Body: 'Progesteron har en let søvnfremkaldende virkning; når niveauet falder mod slutningen af cyklussen, kan søvnen forstyrres, blive lettere eller afbrydes.',
    infoCard1Title: 'Godt at vide',
    infoCard1Text: 'Den lille stigning i kropstemperaturen efter ægløsning kan gøre det lidt sværere for visse kvinder at falde i søvn.',
    phaseSleep: [
      {
        title: 'Under menstruationen',
        text: 'Søvnen kan være lettere på grund af fysisk ubehag og træthed.',
      },
      {
        title: 'Omkring ægløsningen',
        text: 'Søvnen er generelt mere stabil for de fleste.',
      },
      {
        title: 'Inden menstruationen',
        text: 'Faldende progesteron kan lette søvnen med lejlighedsvise afbrydelser.',
      },
    ],
    section2Body: 'Under menopausen er nattesved på grund af lignende hormonelle årsager en almindelig grund til søvnafbrydelse.',
    section3Body: 'Stress kan forværre søvnforstyrrelser i faser der allerede er mere følsomme. Simple afslapningsteknikker (åndedrætsøvelser, blid udstrækning) kan hjælpe med at berolige sindet inden sengetid.',
    section4Body: 'En regelmæssig søvnrytme og et køligt soverum hjælper med at reducere disse forstyrrelser i alle aldre.',
    eveningRoutine: [
      {
        title: 'Faste tidspunkter',
        text: 'At gå i seng og stå op på samme tid hver dag hjælper med at regulere din indre ur.',
      },
      {
        title: 'Færre skærme om aftenen',
        text: 'Blåt lys kan forsinke indsovning; en pause fra skærme beroliger sindet.',
      },
      {
        title: 'Køligt soverum',
        text: 'En moderat temperatur gør det lettere at falde i søvn i alle aldre.',
      },
    ],
    section5Body: 'Gode vaner er ikke altid nok. Det kan være nyttigt at tale med en specialist i følgende tilfælde:',
    warningTitle: 'Tegn der kræver en konsultation',
    consultSigns: [
      'Søvnproblemer der har varet i flere uger',
      'Træthed der i alvorlig grad påvirker dit daglige liv',
      'Vedvarende søvnløshed trods gode vaner',
    ],
    infoCard2Title: 'Forberedelse til denne konsultation',
    infoCard2Text: 'At notere hvor længe problemerne har stået på og hvad der synes at påvirke dem hjælper din sundhedsfaglige person med bedre at vejlede dig.',
    tipTitle: 'Godt at vide',
    tipText: 'Disse søvnforandringer er normale og normalt forbigående: det betyder ikke, at der er noget galt.',
    summaryPoints: [
      'Progesteron har en let søvnfremkaldende virkning; et fald mod slutningen af cyklussen kan forstyrre søvnen.',
      'Under menopausen er nattesved en almindelig årsag til søvnafbrydelse.',
      'En regelmæssig søvnrytme og et køligt soverum hjælper med at reducere disse forstyrrelser.',
      'Vedvarende søvnproblemer bør drøftes med en sundhedsfaglig person.',
    ],
    disclaimerText: 'Informativt indhold. Denne artikel er ikke en erstatning for personlig medicinsk rådgivning. Kontakt en sundhedsfaglig person, hvis du er i tvivl.',
    shareMessage: 'Søvn og hormoner: den skjulte forbindelse — AWA',
  },
  sv: {
    badge: 'MENSTRUATIONSCYKLUS • SÖVN',
    title: 'Sövn och hormoner:\nden skjulte forbindelse',
    metaDuration: '6 min läsning',
    metaType: 'Artikel',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemgået indhold',
    intro: 'Hvorfor din sövn ändrer sig afhängigt av cyklussens fase och under menopausen.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvorfor hormoner påvirker sövnen',
      'Sövn i cyklussens faser',
      'Stress och sövnkvalitet',
      'En beroligende aftenrutine',
      'Hvornår bör du opsöge en specialist',
      'Vigtige pointer',
    ],
    section1Body: 'Progesteron har en let sövnfremkaldende virkning; når niveauet falder mod slutningen av cyklussen, kan sövnen forstyrres, blive lettere eller afbrydes.',
    infoCard1Title: 'Godt at vide',
    infoCard1Text: 'Den lille stigning i kropstemperaturen efter äglösning kan göre det lite svärere for visse kvinnor at falde i sövn.',
    phaseSleep: [
      {
        title: 'Under menstruationen',
        text: 'Sövnen kan väre lettere på grund av fysisk ubehag och träthed.',
      },
      {
        title: 'Omkring äglösningen',
        text: 'Sövnen ar generelt mere stabil for de fleste.',
      },
      {
        title: 'Inden menstruationen',
        text: 'Faldende progesteron kan lette sövnen med lejlighedsvise afbrydelser.',
      },
    ],
    section2Body: 'Under menopausen ar nattesved på grund av lignende hormonelle årsager en almindelig grund till sövnafbrydelse.',
    section3Body: 'Stress kan forvärre sövnforstyrrelser i faser der redan ar mere fölsomme. Simple afslapningsteknikker (åndedrätsövelser, blid udsträkning) kan hjälpe med at berolige sindet inden sengetid.',
    section4Body: 'En regelmässig sövnrytme och et köligt soverum hjälper med at reducere disse forstyrrelser i alla aldre.',
    eveningRoutine: [
      {
        title: 'Faste tidspunkter',
        text: 'At gå i seng och stå op på samme tid hver dag hjälper med at regulere din indre ur.',
      },
      {
        title: 'Färre skärme om aftenen',
        text: 'Blåt lys kan forsinke indsovning; en pause fran skärme beroliger sindet.',
      },
      {
        title: 'Köligt soverum',
        text: 'En moderat temperatur gör det lettere at falde i sövn i alla aldre.',
      },
    ],
    section5Body: 'Gode vaner ar inte alltid nok. Det kan väre nyttigt at tale med en specialist i fölgende tilfälde:',
    warningTitle: 'Tegn der kräver en konsultation',
    consultSigns: [
      'Sövnproblemer der har varet i flere veckor',
      'Träthed der i alvorlig grad påvirker ditt daglige liv',
      'Vedvarende sövnlöshed trods gode vaner',
    ],
    infoCard2Title: 'Forberedelse till denne konsultation',
    infoCard2Text: 'At notere hvor länge problemerne har stået på och hvad der synes at påvirke dem hjälper din halsasfaglige person med bedre at vejlede dig.',
    tipTitle: 'Godt at vide',
    tipText: 'Disse sövnforandringer ar normale och normalt forbigående: det betyder inte, at der ar noget galt.',
    summaryPoints: [
      'Progesteron har en let sövnfremkaldende virkning; et fald mod slutningen av cyklussen kan forstyrre sövnen.',
      'Under menopausen ar nattesved en almindelig årsag till sövnafbrydelse.',
      'En regelmässig sövnrytme och et köligt soverum hjälper med at reducere disse forstyrrelser.',
      'Vedvarende sövnproblemer bör dröftes med en halsasfaglig person.',
    ],
    disclaimerText: 'Informativt indhold. Denne artikel ar inte en erstatning for personlig medicinsk rådgivning. Kontakt en halsasfaglig person, hvis du ar i tvivl.',
    shareMessage: 'Sövn och hormoner: den skjulte forbindelse — AWA',
  },
  nb: {
    badge: 'MENSTRUASJONSSYKLUS • SØVN',
    title: 'Søvn og hormoner:\nden lite kjente sammenhengen',
    metaDuration: '6 min lesing',
    metaType: 'Artikkel',
    metaLevel: 'Nybegynner',
    metaValidated: 'Gjennomgått innhold',
    intro: 'Hvorfor søvnen din endrer seg avhengig av syklusfasen, og i menopausen.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Hvorfor hormoner påvirker søvn',
      'Søvn gjennom fasene i syklusen',
      'Stress og søvnkvalitet',
      'En beroligende kveldsrutine',
      'Når du bør gå til fagperson',
      'Det viktigste å huske',
    ],
    section1Body: 'Progesteron har en mild beroligende effekt; fallet mot slutten av syklusen kan forstyrre søvnen og gjøre den lettere eller mer oppstykket.',
    infoCard1Title: 'Godt å vite',
    infoCard1Text: 'Den lille økningen i kroppstemperaturen etter eggløsningen kan også gjøre det litt vanskeligere å sovne for noen.',
    phaseSleep: [
      {title: 'Under mensen', text: 'Fysisk ubehag og tretthet kan gjøre søvnen lettere.'},
      {title: 'Rundt eggløsningen', text: 'Søvnen er vanligvis mer stabil for de fleste.'},
      {title: 'Før mensen', text: 'Fallet i progesteron kan gjøre søvnen lettere, med mulige oppvåkninger.'},
    ],
    section2Body: 'I menopausen er nattesvette en vanlig årsak til oppvåkning, av lignende hormonelle grunner.',
    section3Body: 'Stress kan forsterke søvnforstyrrelser i faser av syklusen som allerede er mer følsomme. Enkle avspenningsteknikker (pusting, mild tøyning) kan hjelpe deg å slappe av før leggetid.',
    section4Body: 'En stabil leggerutine og et kjølig soverom bidrar til å begrense disse forstyrrelsene, i alle aldre.',
    eveningRoutine: [
      {title: 'Faste tider', text: 'Å legge seg og stå opp til stabile tider hjelper til å regulere den indre klokken.'},
      {title: 'Mindre skjermtid om kvelden', text: 'Blått lys kan forsinke innsovningen; en skjermpause hjelper deg å roe ned.'},
      {title: 'Et kjølig soverom', text: 'En moderat temperatur gjør det lettere å sovne, i alle aldre.'},
    ],
    section5Body: 'Gode vaner er ikke alltid nok. Det kan være nyttig å snakke med en fagperson hvis:',
    warningTitle: 'Tegn det er verdt å få sjekket',
    consultSigns: [
      'Søvnproblemene har vart i flere uker',
      'Trettheten påvirker hverdagen sterkt',
      'Søvnløsheten vedvarer til tross for gode vaner',
    ],
    infoCard2Title: 'Forberede denne timen',
    infoCard2Text: 'Å notere hvor lenge problemene har vart, og hva som ser ut til å påvirke dem, kan hjelpe helsepersonellet å veilede deg bedre.',
    tipTitle: 'Godt å vite',
    tipText: 'Disse søvnendringene er vanlige og som regel midlertidige: de betyr ikke at noe er galt.',
    summaryPoints: [
      'Progesteron har en mild beroligende effekt; fallet mot slutten av syklusen kan forstyrre søvnen.',
      'I menopausen er nattesvette en vanlig årsak til oppvåkning.',
      'En stabil leggerutine og et kjølig soverom bidrar til å begrense disse forstyrrelsene, i alle aldre.',
      'Vedvarende søvnproblemer er verdt å ta opp med helsepersonell.',
    ],
    disclaimerText: 'Informasjonsinnhold. Denne artikkelen erstatter ikke personlig medisinsk rådgivning. Ved tvil bør du søke veiledning hos helsepersonell.',
    shareMessage: 'Søvn og hormoner: den lite kjente sammenhengen – AWA',
  },
  pl: {
    badge: 'CYKL MIESIĄCZKOWY • SEN',
    title: 'Sen i hormony:\nmało znany związek',
    metaDuration: '6 min czytania',
    metaType: 'Artykuł',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Dlaczego Twój sen zmienia się w zależności od fazy cyklu i w menopauzie.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Dlaczego hormony wpływają na sen',
      'Sen w poszczególnych fazach cyklu',
      'Stres a jakość snu',
      'Kojąca wieczorna rutyna',
      'Kiedy zgłosić się do specjalisty',
      'Najważniejsze wnioski',
    ],
    section1Body: 'Progesteron ma łagodne działanie uspokajające; jego spadek pod koniec cyklu może zaburzać sen, czyniąc go płytszym lub bardziej przerywanym.',
    infoCard1Title: 'Warto wiedzieć',
    infoCard1Text: 'Niewielki wzrost temperatury ciała po owulacji może też u niektórych osób nieco utrudniać zasypianie.',
    phaseSleep: [
      {title: 'Podczas miesiączki', text: 'Dyskomfort fizyczny i zmęczenie mogą sprawić, że sen jest płytszy.'},
      {title: 'Około owulacji', text: 'Sen jest zazwyczaj bardziej stabilny u większości osób.'},
      {title: 'Przed miesiączką', text: 'Spadek progesteronu może sprawić, że sen jest płytszy, z możliwymi przebudzeniami.'},
    ],
    section2Body: 'W menopauzie nocne poty są częstą przyczyną budzenia się, z podobnych powodów hormonalnych.',
    section3Body: 'Stres może nasilać zaburzenia snu w fazach cyklu, które są już bardziej wrażliwe. Proste techniki relaksacyjne (oddychanie, delikatne rozciąganie) mogą pomóc się wyciszyć przed snem.',
    section4Body: 'Stała wieczorna rutyna i chłodna sypialnia pomagają ograniczać te zaburzenia w każdym wieku.',
    eveningRoutine: [
      {title: 'Regularne godziny', text: 'Kładzenie się i wstawanie o stałych porach pomaga regulować zegar biologiczny.'},
      {title: 'Mniej ekranów wieczorem', text: 'Niebieskie światło może opóźniać zasypianie; przerwa od ekranu pomaga się wyciszyć.'},
      {title: 'Chłodna sypialnia', text: 'Umiarkowana temperatura ułatwia zasypianie w każdym wieku.'},
    ],
    section5Body: 'Dobre nawyki nie zawsze wystarczają. Rozmowa ze specjalistą może pomóc, jeśli:',
    warningTitle: 'Objawy, które warto skonsultować',
    consultSigns: [
      'Problemy ze snem trwają kilka tygodni',
      'Zmęczenie silnie wpływa na codzienne życie',
      'Bezsenność utrzymuje się mimo dobrych nawyków',
    ],
    infoCard2Title: 'Przygotowanie do wizyty',
    infoCard2Text: 'Zanotowanie, jak długo trwają problemy i co wydaje się na nie wpływać, może pomóc specjaliście lepiej Cię pokierować.',
    tipTitle: 'Warto wiedzieć',
    tipText: 'Te zmiany snu są częste i zwykle przejściowe: nie oznaczają, że coś jest nie tak.',
    summaryPoints: [
      'Progesteron ma łagodne działanie uspokajające; jego spadek pod koniec cyklu może zaburzać sen.',
      'W menopauzie nocne poty są częstą przyczyną budzenia się.',
      'Stała wieczorna rutyna i chłodna sypialnia pomagają ograniczać te zaburzenia w każdym wieku.',
      'Uporczywe problemy ze snem warto omówić ze specjalistą.',
    ],
    disclaimerText: 'Treść informacyjna. Ten artykuł nie zastępuje spersonalizowanej porady medycznej. W razie wątpliwości zasięgnij porady specjalisty.',
    shareMessage: 'Sen i hormony: mało znany związek — AWA',
  },
  uk: {
    badge: 'МЕНСТРУАЛЬНИЙ ЦИКЛ • СОН',
    title: 'Сон і гормони:\nмало відомий зв’язок',
    metaDuration: '6 хв читання',
    metaType: 'Стаття',
    metaLevel: 'Початковий',
    metaValidated: 'Перевірений вміст',
    intro: 'Чому ваш сон змінюється залежно від фази циклу та в менопаузі.',
    contentsTitle: 'У цій статті',
    topics: [
      'Чому гормони впливають на сон',
      'Сон у різних фазах циклу',
      'Стрес і якість сну',
      'Заспокійлива вечірня рутина',
      'Коли звертатися до фахівця',
      'Головні висновки',
    ],
    section1Body: 'Прогестерон має легкий заспокійливий ефект; його зниження наприкінці циклу може порушувати сон, роблячи його поверхневішим або уривчастішим.',
    infoCard1Title: 'Варто знати',
    infoCard1Text: 'Невелике підвищення температури тіла після овуляції також може трохи ускладнювати засинання в деяких людей.',
    phaseSleep: [
      {title: 'Під час менструації', text: 'Фізичний дискомфорт і втома можуть робити сон поверхневішим.'},
      {title: 'Близько овуляції', text: 'Сон зазвичай стабільніший у більшості людей.'},
      {title: 'Перед менструацією', text: 'Зниження прогестерону може робити сон поверхневішим, з можливими пробудженнями.'},
    ],
    section2Body: 'У менопаузі нічне потовиділення — часта причина пробуджень, з подібних гормональних причин.',
    section3Body: 'Стрес може посилювати порушення сну в фазах циклу, які й так чутливіші. Прості техніки релаксації (дихання, легка розтяжка) можуть допомогти розслабитися перед сном.',
    section4Body: 'Стала вечірня рутина та прохолодна спальня допомагають обмежити ці порушення в будь-якому віці.',
    eveningRoutine: [
      {title: 'Регулярні години', text: 'Відхід до сну й пробудження в стабільний час допомагає регулювати внутрішній годинник.'},
      {title: 'Менше екранів увечері', text: 'Синє світло може відтягувати засинання; перерва від екрана допомагає розслабитися.'},
      {title: 'Прохолодна спальня', text: 'Помірна температура полегшує засинання в будь-якому віці.'},
    ],
    section5Body: 'Гарних звичок не завжди достатньо. Поговорити зі спеціалістом може бути корисно, якщо:',
    warningTitle: 'Ознаки, які варто перевірити',
    consultSigns: [
      'Проблеми зі сном тривають кілька тижнів',
      'Втома сильно впливає на щоденне життя',
      'Безсоння зберігається попри гарні звички',
    ],
    infoCard2Title: 'Підготовка до візиту',
    infoCard2Text: 'Занотувавши, як довго тривають проблеми та що, схоже, на них впливає, ви допоможете лікареві краще вас спрямувати.',
    tipTitle: 'Варто знати',
    tipText: 'Ці зміни сну поширені й зазвичай тимчасові: вони не означають, що щось не так.',
    summaryPoints: [
      'Прогестерон має легкий заспокійливий ефект; його зниження наприкінці циклу може порушувати сон.',
      'У менопаузі нічне потовиділення — часта причина пробуджень.',
      'Стала вечірня рутина та прохолодна спальня допомагають обмежити ці порушення в будь-якому віці.',
      'Стійкі проблеми зі сном варто обговорити з медичним фахівцем.',
    ],
    disclaimerText: 'Інформаційний вміст. Ця стаття не замінює персоналізованої медичної поради. У разі сумнівів зверніться до медичного фахівця.',
    shareMessage: 'Сон і гормони: мало відомий зв’язок — AWA',
  },
  cs: {
    badge: 'MENSTRUAČNÍ CYKLUS • SPÁNEK',
    title: 'Spánek a hormony:\nméně známá souvislost',
    metaDuration: '6 min čtení',
    metaType: 'Článek',
    metaLevel: 'Začátečník',
    metaValidated: 'Ověřený obsah',
    intro: 'Proč se váš spánek mění podle fáze cyklu i v menopauze.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Proč hormony ovlivňují spánek',
      'Spánek v jednotlivých fázích cyklu',
      'Stres a kvalita spánku',
      'Uklidňující večerní rutina',
      'Kdy navštívit odborníka',
      'Hlavní poznatky',
    ],
    section1Body: 'Progesteron má mírný sedativní účinek; jeho pokles na konci cyklu může narušit spánek a učinit ho lehčím nebo přerušovanějším.',
    infoCard1Title: 'Stojí za to vědět',
    infoCard1Text: 'Mírný nárůst tělesné teploty po ovulaci může u některých žen také mírně ztížit usínání.',
    phaseSleep: [
      {title: 'Během menstruace', text: 'Tělesné nepohodlí a únava mohou spánek zlehčit.'},
      {title: 'Kolem ovulace', text: 'Spánek je u většiny žen obecně stabilnější.'},
      {title: 'Před menstruací', text: 'Pokles progesteronu může spánek zlehčit, s možným probouzením.'},
    ],
    section2Body: 'V menopauze je noční pocení častou příčinou probouzení, ze srovnatelných hormonálních důvodů.',
    section3Body: 'Stres může zesílit poruchy spánku ve fázích cyklu, které jsou již citlivější. Jednoduché relaxační techniky (dýchání, jemné protahování) vám mohou pomoci uvolnit se před spaním.',
    section4Body: 'Stabilní večerní rutina a chladná ložnice pomáhají tyto poruchy omezit, v jakémkoli věku.',
    eveningRoutine: [
      {title: 'Pravidelné hodiny', text: 'Uléhání a vstávání ve stabilních časech pomáhá regulovat vaše vnitřní hodiny.'},
      {title: 'Méně obrazovek večer', text: 'Modré světlo může oddálit usínání; přestávka od obrazovek vám pomůže zklidnit se.'},
      {title: 'Chladná ložnice', text: 'Mírná teplota usnadňuje usínání, v jakémkoli věku.'},
    ],
    section5Body: 'Dobré návyky ne vždy stačí. Může být užitečné promluvit si s odborníkem, pokud:',
    warningTitle: 'Příznaky, které stojí za vyšetření',
    consultSigns: [
      'Problémy se spánkem trvají několik týdnů',
      'Únava výrazně ovlivňuje každodenní život',
      'Nespavost přetrvává navzdory dobrým návykům',
    ],
    infoCard2Title: 'Příprava na tuto návštěvu',
    infoCard2Text: 'Poznamenání, jak dlouho potíže trvají a co je zřejmě ovlivňuje, může zdravotnickému pracovníkovi pomoci lépe vás vést.',
    tipTitle: 'Stojí za to vědět',
    tipText: 'Tyto změny spánku jsou běžné a obvykle přechodné: neznamenají, že je něco špatně.',
    summaryPoints: [
      'Progesteron má mírný sedativní účinek; jeho pokles na konci cyklu může narušit spánek.',
      'V menopauze je noční pocení častou příčinou probouzení.',
      'Stabilní večerní rutina a chladná ložnice pomáhají tyto poruchy omezit, v jakémkoli věku.',
      'Přetrvávající problémy se spánkem stojí za to probrat se zdravotnickým pracovníkem.',
    ],
    disclaimerText: 'Informativní obsah. Tento článek nenahrazuje individuální lékařskou radu. V případě pochybností požádejte o radu zdravotnického pracovníka.',
    shareMessage: 'Spánek a hormony: méně známá souvislost — AWA',
  },
  sk: {
    badge: 'MENŠTRUAČNÝ CYKLUS • SPÁNOK',
    title: 'Spánok a hormóny:\nmáloznáma súvislosť',
    metaDuration: '6 min čítania',
    metaType: 'Článok',
    metaLevel: 'Začiatočník',
    metaValidated: 'Overený obsah',
    intro: 'Prečo sa váš spánok mení podľa fázy cyklu a v menopauze.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Prečo hormóny ovplyvňujú spánok',
      'Spánok v jednotlivých fázach cyklu',
      'Stres a kvalita spánku',
      'Upokojujúca večerná rutina',
      'Kedy navštíviť odborníka',
      'Hlavné body',
    ],
    section1Body: 'Progesterón má mierny sedatívny účinok; jeho pokles na konci cyklu môže spánok narúšať a robiť ho plytším alebo prerušovanejším.',
    infoCard1Title: 'Stojí za to vedieť',
    infoCard1Text: 'Mierny nárast telesnej teploty po ovulácii môže niektorým ženám tiež trochu sťažiť zaspávanie.',
    phaseSleep: [
      {title: 'Počas menštruácie', text: 'Telesné nepohodlie a únava môžu spánok urobiť plytším.'},
      {title: 'Okolo ovulácie', text: 'Spánok je u väčšiny žien vo všeobecnosti stabilnejší.'},
      {title: 'Pred menštruáciou', text: 'Pokles progesterónu môže spánok urobiť plytším, s možným budením.'},
    ],
    section2Body: 'V menopauze je nočné potenie častou príčinou budenia, z podobných hormonálnych dôvodov.',
    section3Body: 'Stres môže zosilniť poruchy spánku vo fázach cyklu, ktoré sú už citlivejšie. Jednoduché relaxačné techniky (dýchanie, jemný strečing) vám môžu pomôcť uvoľniť sa pred spaním.',
    section4Body: 'Stála večerná rutina a chladná spálňa pomáhajú tieto poruchy obmedziť, v každom veku.',
    eveningRoutine: [
      {title: 'Pravidelné hodiny', text: 'Chodenie spať a vstávanie v stálych časoch pomáha regulovať vaše vnútorné hodiny.'},
      {title: 'Menej obrazoviek večer', text: 'Modré svetlo môže oneskoriť zaspávanie; prestávka od obrazovky vám pomáha upokojiť sa.'},
      {title: 'Chladná spálňa', text: 'Mierna teplota uľahčuje zaspávanie, v každom veku.'},
    ],
    section5Body: 'Dobré návyky nie vždy stačia. Môže byť užitočné porozprávať sa s odborníkom, ak:',
    warningTitle: 'Znaky, ktoré stojí za to nechať skontrolovať',
    consultSigns: [
      'Problémy so spánkom trvajú niekoľko týždňov',
      'Únava výrazne ovplyvňuje každodenný život',
      'Nespavosť pretrváva napriek dobrým návykom',
    ],
    infoCard2Title: 'Príprava na túto návštevu',
    infoCard2Text: 'Zaznamenanie toho, ako dlho problémy trvajú a čo ich zdanlivo ovplyvňuje, môže pomôcť vášmu zdravotníckemu pracovníkovi lepšie vás usmerniť.',
    tipTitle: 'Stojí za to vedieť',
    tipText: 'Tieto zmeny spánku sú bežné a zvyčajne dočasné: neznamenajú, že je niečo v neporiadku.',
    summaryPoints: [
      'Progesterón má mierny sedatívny účinok; jeho pokles na konci cyklu môže spánok narúšať.',
      'V menopauze je nočné potenie častou príčinou budenia.',
      'Stála večerná rutina a chladná spálňa pomáhajú tieto poruchy obmedziť, v každom veku.',
      'Pretrvávajúce problémy so spánkom stojí za to prediskutovať so zdravotníckym pracovníkom.',
    ],
    disclaimerText: 'Informatívny obsah. Tento článok nenahrádza individuálnu lekársku radu. V prípade pochybností sa poraďte so zdravotníckym pracovníkom.',
    shareMessage: 'Spánok a hormóny: máloznáma súvislosť — AWA',
  },
  hu: {
    badge: 'MENSTRUÁCIÓS CIKLUS • ALVÁS',
    title: 'Alvás és hormonok:\na kevéssé ismert kapcsolat',
    metaDuration: '6 perc olvasás',
    metaType: 'Cikk',
    metaLevel: 'Kezdő',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'Miért változik az alvásod a ciklusszakaszodtól függően és a menopauzában.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Miért befolyásolják a hormonok az alvást',
      'Alvás a ciklus szakaszaiban',
      'Stressz és az alvás minősége',
      'Megnyugtató esti rutin',
      'Mikor menj szakemberhez',
      'Legfontosabb tudnivalók',
    ],
    section1Body: 'A progeszteronnak enyhe nyugtató hatása van; a ciklus végén bekövetkező csökkenése megzavarhatja az alvást, könnyebbé vagy töredezettebbé téve azt.',
    infoCard1Title: 'Érdemes tudni',
    infoCard1Text: 'A testhőmérséklet peteérés utáni enyhe emelkedése egyeseknél kissé megnehezítheti az elalvást is.',
    phaseSleep: [
      {title: 'A menstruáció alatt', text: 'A testi kellemetlenség és a fáradtság könnyebbé tehetik az alvást.'},
      {title: 'A peteérés körül', text: 'Az alvás a legtöbb nőnél általában stabilabb.'},
      {title: 'A menstruáció előtt', text: 'A progeszteron csökkenése könnyebbé teheti az alvást, lehetséges ébredésekkel.'},
    ],
    section2Body: 'A menopauzában az éjszakai izzadás az ébredések gyakori oka, hasonló hormonális okokból.',
    section3Body: 'A stressz felerősítheti az alvászavarokat a ciklus eleve érzékenyebb szakaszaiban. Az egyszerű relaxációs technikák (légzés, kíméletes nyújtás) segíthetnek ellazulni lefekvés előtt.',
    section4Body: 'Az állandó lefekvési rutin és a hűvös hálószoba segít korlátozni ezeket a zavarokat, bármely életkorban.',
    eveningRoutine: [
      {title: 'Rendszeres órák', text: 'A stabil időpontban való lefekvés és ébredés segít szabályozni a belső órádat.'},
      {title: 'Kevesebb képernyő este', text: 'A kék fény késleltetheti az elalvást; a képernyőtől való szünet segít lecsillapodni.'},
      {title: 'Hűvös hálószoba', text: 'A mérsékelt hőmérséklet megkönnyíti az elalvást, bármely életkorban.'},
    ],
    section5Body: 'A jó szokások nem mindig elegendők. Hasznos lehet szakemberrel beszélni, ha:',
    warningTitle: 'Jelek, amelyeket érdemes kivizsgáltatni',
    consultSigns: [
      'Az alvási problémák több hete fennállnak',
      'A fáradtság erősen befolyásolja a mindennapi életet',
      'Az álmatlanság a jó szokások ellenére is fennmarad',
    ],
    infoCard2Title: 'Felkészülés erre az időpontra',
    infoCard2Text: 'Ha feljegyzed, mióta állnak fenn a problémák, és mi befolyásolja őket, az segíthet az egészségügyi szakembernek jobban eligazítani.',
    tipTitle: 'Érdemes tudni',
    tipText: 'Ezek az alvásváltozások gyakoriak és általában átmenetiek: nem jelentik azt, hogy baj van.',
    summaryPoints: [
      'A progeszteronnak enyhe nyugtató hatása van; a ciklus végén bekövetkező csökkenése megzavarhatja az alvást.',
      'A menopauzában az éjszakai izzadás az ébredések gyakori oka.',
      'Az állandó lefekvési rutin és a hűvös hálószoba segít korlátozni ezeket a zavarokat, bármely életkorban.',
      'A tartós alvási problémákat érdemes megbeszélni egészségügyi szakemberrel.',
    ],
    disclaimerText: 'Tájékoztató jellegű tartalom. Ez a cikk nem helyettesíti a személyre szabott orvosi tanácsot. Kétség esetén kérj útmutatást egészségügyi szakembertől.',
    shareMessage: 'Alvás és hormonok: a kevéssé ismert kapcsolat — AWA',
  },
  ro: {
    badge: 'CICLUL MENSTRUAL • SOMN',
    title: 'Somnul și hormonii:\nlegătura prea puțin cunoscută',
    metaDuration: '6 min de citit',
    metaType: 'Articol',
    metaLevel: 'Începător',
    metaValidated: 'Conținut revizuit',
    intro: 'De ce somnul tău se schimbă în funcție de faza ciclului și la menopauză.',
    contentsTitle: 'În acest articol',
    topics: [
      'De ce hormonii afectează somnul',
      'Somnul în fazele ciclului',
      'Stresul și calitatea somnului',
      'O rutină liniștitoare de seară',
      'Când să mergi la un profesionist',
      'Ce să reții',
    ],
    section1Body: 'Progesteronul are un efect sedativ ușor; scăderea lui la sfârșitul ciclului poate perturba somnul, făcându-l mai superficial sau mai fragmentat.',
    infoCard1Title: 'Bine de știut',
    infoCard1Text: 'Ușoara creștere a temperaturii corpului după ovulație poate face, de asemenea, adormirea puțin mai grea pentru unele persoane.',
    phaseSleep: [
      {title: 'În timpul menstruației', text: 'Disconfortul fizic și oboseala pot face somnul mai superficial.'},
      {title: 'În jurul ovulației', text: 'Somnul este în general mai stabil pentru majoritatea persoanelor.'},
      {title: 'Înainte de menstruație', text: 'Scăderea progesteronului poate face somnul mai superficial, cu posibile treziri.'},
    ],
    section2Body: 'La menopauză, transpirațiile nocturne sunt o cauză frecventă de trezire, din motive hormonale asemănătoare.',
    section3Body: 'Stresul poate amplifica perturbările somnului în fazele ciclului care sunt deja mai sensibile. Tehnicile simple de relaxare (respirație, stretching blând) te pot ajuta să te destinzi înainte de culcare.',
    section4Body: 'O rutină stabilă de culcare și un dormitor răcoros ajută la limitarea acestor perturbări, la orice vârstă.',
    eveningRoutine: [
      {title: 'Ore regulate', text: 'Culcatul și trezitul la ore stabile ajută la reglarea ceasului tău intern.'},
      {title: 'Mai puțin ecran seara', text: 'Lumina albastră poate întârzia adormirea; o pauză de la ecran te ajută să te liniștești.'},
      {title: 'Un dormitor răcoros', text: 'O temperatură moderată face adormirea mai ușoară, la orice vârstă.'},
    ],
    section5Body: 'Obiceiurile bune nu sunt întotdeauna suficiente. Poate fi util să vorbești cu un profesionist dacă:',
    warningTitle: 'Semne care merită verificate',
    consultSigns: [
      'Problemele de somn durează de mai multe săptămâni',
      'Oboseala îți afectează puternic viața de zi cu zi',
      'Insomnia persistă în ciuda obiceiurilor bune',
    ],
    infoCard2Title: 'Pregătirea acestei consultații',
    infoCard2Text: 'Notarea duratei problemelor și a ceea ce pare să le influențeze poate ajuta profesionistul din domeniul sănătății să te îndrume mai bine.',
    tipTitle: 'Bine de știut',
    tipText: 'Aceste schimbări ale somnului sunt frecvente și de obicei temporare: nu înseamnă că ceva nu este în regulă.',
    summaryPoints: [
      'Progesteronul are un efect sedativ ușor; scăderea lui la sfârșitul ciclului poate perturba somnul.',
      'La menopauză, transpirațiile nocturne sunt o cauză frecventă de trezire.',
      'O rutină stabilă de culcare și un dormitor răcoros ajută la limitarea acestor perturbări, la orice vârstă.',
      'Problemele persistente de somn merită discutate cu un profesionist din domeniul sănătății.',
    ],
    disclaimerText: 'Conținut cu caracter informativ. Acest articol nu înlocuiește sfatul medical personalizat. Dacă ai îndoieli, cere îndrumare unui profesionist din domeniul sănătății.',
    shareMessage: 'Somnul și hormonii: legătura prea puțin cunoscută — AWA',
  },
  bg: {
    badge: 'МЕНСТРУАЛЕН ЦИКЪЛ • СЪН',
    title: 'Сън и хормони:\nмалко известната връзка',
    metaDuration: '6 мин четене',
    metaType: 'Статия',
    metaLevel: 'Начинаещ',
    metaValidated: 'Проверено съдържание',
    intro: 'Защо сънят ти се променя според фазата на цикъла и при менопауза.',
    contentsTitle: 'В тази статия',
    topics: [
      'Защо хормоните влияят на съня',
      'Сънят през фазите на цикъла',
      'Стрес и качество на съня',
      'Успокояваща вечерна рутина',
      'Кога да посетиш специалист',
      'Какво да запомниш',
    ],
    section1Body: 'Прогестеронът има лек успокоителен ефект; спадането му в края на цикъла може да наруши съня, правейки го по-лек или по-накъсан.',
    infoCard1Title: 'Добре е да знаеш',
    infoCard1Text: 'Лекото повишаване на телесната температура след овулацията също може да затрудни малко заспиването при някои хора.',
    phaseSleep: [
      {title: 'По време на менструация', text: 'Физическият дискомфорт и умората могат да направят съня по-лек.'},
      {title: 'Около овулацията', text: 'Сънят обикновено е по-стабилен при повечето хора.'},
      {title: 'Преди менструация', text: 'Спадането на прогестерона може да направи съня по-лек, с възможни събуждания.'},
    ],
    section2Body: 'При менопауза нощното изпотяване е честа причина за събуждане, поради подобни хормонални причини.',
    section3Body: 'Стресът може да засили нарушенията на съня през фази на цикъла, които и без това са по-чувствителни. Прости техники за релаксация (дишане, нежно разтягане) могат да ти помогнат да се отпуснеш преди лягане.',
    section4Body: 'Стабилна рутина преди лягане и хладна спалня помагат да се ограничат тези нарушения, на всяка възраст.',
    eveningRoutine: [
      {title: 'Редовни часове', text: 'Лягането и ставането в стабилни часове помага да се регулира вътрешният ти часовник.'},
      {title: 'По-малко екрани вечер', text: 'Синята светлина може да забави заспиването; почивката от екраните ти помага да се отпуснеш.'},
      {title: 'Хладна спалня', text: 'Умерената температура улеснява заспиването, на всяка възраст.'},
    ],
    section5Body: 'Добрите навици не винаги са достатъчни. Може да е полезно да поговориш със специалист, ако:',
    warningTitle: 'Признаци, които си струва да проверите',
    consultSigns: [
      'Проблемите със съня продължават няколко седмици',
      'Умората силно влияе на ежедневието',
      'Безсънието продължава въпреки добрите навици',
    ],
    infoCard2Title: 'Подготовка за този преглед',
    infoCard2Text: 'Отбелязването на колко време продължават проблемите и какво изглежда да ги влияе може да помогне на здравния ти специалист да те насочи по-добре.',
    tipTitle: 'Добре е да знаеш',
    tipText: 'Тези промени в съня са чести и обикновено временни: те не означават, че нещо не е наред.',
    summaryPoints: [
      'Прогестеронът има лек успокоителен ефект; спадането му в края на цикъла може да наруши съня.',
      'При менопауза нощното изпотяване е честа причина за събуждане.',
      'Стабилна рутина преди лягане и хладна спалня помагат да се ограничат тези нарушения, на всяка възраст.',
      'Упорити проблеми със съня си струва да се обсъдят със здравен специалист.',
    ],
    disclaimerText: 'Информационно съдържание. Тази статия не замества персонализирания медицински съвет. При съмнение потърси насоки от здравен специалист.',
    shareMessage: 'Сън и хормони: малко известната връзка — AWA',
  },
  sr: {
    badge: 'МЕНСТРУАЛНИ ЦИКЛУС • САН',
    title: 'Сан и хормони:\nмало позната веза',
    metaDuration: '6 мин читања',
    metaType: 'Чланак',
    metaLevel: 'Почетник',
    metaValidated: 'Проверен садржај',
    intro: 'Зашто се твој сан мења зависно од фазе циклуса и у менопаузи.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Зашто хормони утичу на сан',
      'Сан кроз фазе циклуса',
      'Стрес и квалитет сна',
      'Умирујућа вечерња рутина',
      'Када посетити стручњака',
      'Шта да запамтиш',
    ],
    section1Body: 'Прогестерон има лак седативни ефекат; његов пад на крају циклуса може пореметити сан, чинећи га лакшим или испрекиданијим.',
    infoCard1Title: 'Добро је знати',
    infoCard1Text: 'Благи пораст телесне температуре после овулације такође може отежати заспивање код неких особа.',
    phaseSleep: [
      {title: 'Током менструације', text: 'Физичка нелагодност и умор могу учинити сан лакшим.'},
      {title: 'Око овулације', text: 'Сан је обично стабилнији код већине особа.'},
      {title: 'Пре менструације', text: 'Пад прогестерона може учинити сан лакшим, уз могућа буђења.'},
    ],
    section2Body: 'У менопаузи ноћно знојење је честа причина буђења, из сличних хормонских разлога.',
    section3Body: 'Стрес може појачати поремећаје сна током фаза циклуса које су већ осетљивије. Једноставне технике опуштања (дисање, нежно истезање) могу ти помоћи да се опустиш пре спавања.',
    section4Body: 'Стабилна рутина пре спавања и хладна спаваћа соба помажу да се ограниче ови поремећаји, у било ком узрасту.',
    eveningRoutine: [
      {title: 'Редовни сати', text: 'Одлазак на спавање и устајање у стабилно време помаже у регулацији унутрашњег сата.'},
      {title: 'Мање екрана увече', text: 'Плава светлост може одгодити заспивање; пауза од екрана помаже ти да се опустиш.'},
      {title: 'Хладна спаваћа соба', text: 'Умерена температура олакшава заспивање, у било ком узрасту.'},
    ],
    section5Body: 'Добре навике нису увек довољне. Може бити корисно разговарати са стручњаком ако:',
    warningTitle: 'Знаци које вреди проверити',
    consultSigns: [
      'Проблеми са спавањем трају неколико недеља',
      'Умор снажно утиче на свакодневни живот',
      'Несаница траје упркос добрим навикама',
    ],
    infoCard2Title: 'Припрема за овај преглед',
    infoCard2Text: 'Бележење колико дуго проблеми трају и шта изгледа да их утиче може помоћи здравственом раднику да те боље усмери.',
    tipTitle: 'Добро је знати',
    tipText: 'Ове промене сна су честе и обично привремене: оне не значе да нешто није у реду.',
    summaryPoints: [
      'Прогестерон има лак седативни ефекат; његов пад на крају циклуса може пореметити сан.',
      'У менопаузи ноћно знојење је честа причина буђења.',
      'Стабилна рутина пре спавања и хладна спаваћа соба помажу да се ограниче ови поремећаји, у било ком узрасту.',
      'Упорне проблеме са спавањем вреди размотрити са здравственим радником.',
    ],
    disclaimerText: 'Информативни садржај. Овај чланак не замењује персонализовани медицински савет. При сумњи потражи смернице од здравственог радника.',
    shareMessage: 'Сан и хормони: мало позната веза — AWA',
  },
  hr: {
    badge: 'MENSTRUALNI CIKLUS • SAN',
    title: 'San i hormoni:\nslabo poznata veza',
    metaDuration: '6 min čitanja',
    metaType: 'Članak',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Zašto se tvoj san mijenja ovisno o fazi ciklusa i u menopauzi.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Zašto hormoni utječu na san',
      'San kroz faze ciklusa',
      'Stres i kvaliteta sna',
      'Umirujuća večernja rutina',
      'Kada posjetiti stručnu osobu',
      'Ključne poruke',
    ],
    section1Body: 'Progesteron ima blag sedativni učinak; njegov pad pred kraj ciklusa može poremetiti san, čineći ga plićim ili isprekidanijim.',
    infoCard1Title: 'Dobro je znati',
    infoCard1Text: 'Blagi porast tjelesne temperature nakon ovulacije također može kod nekih osoba malo otežati uspavljivanje.',
    phaseSleep: [
      {title: 'Tijekom menstruacije', text: 'Tjelesna nelagoda i umor mogu učiniti san plićim.'},
      {title: 'Oko ovulacije', text: 'San je općenito stabilniji kod većine osoba.'},
      {title: 'Prije menstruacije', text: 'Pad progesterona može učiniti san plićim, uz moguća buđenja.'},
    ],
    section2Body: 'U menopauzi je noćno znojenje čest uzrok buđenja, iz sličnih hormonskih razloga.',
    section3Body: 'Stres može pojačati poremećaje sna tijekom faza ciklusa koje su već osjetljivije. Jednostavne tehnike opuštanja (disanje, nježno istezanje) mogu ti pomoći smiriti se prije spavanja.',
    section4Body: 'Stabilna večernja rutina i svježa spavaća soba pomažu ograničiti te poremećaje, u bilo kojoj dobi.',
    eveningRoutine: [
      {title: 'Redovito vrijeme', text: 'Odlazak na spavanje i buđenje u stabilno vrijeme pomaže regulirati tvoj unutarnji sat.'},
      {title: 'Manje ekrana navečer', text: 'Plava svjetlost može odgoditi uspavljivanje; stanka od ekrana pomaže ti se smiriti.'},
      {title: 'Svježa spavaća soba', text: 'Umjerena temperatura olakšava uspavljivanje, u bilo kojoj dobi.'},
    ],
    section5Body: 'Dobre navike nisu uvijek dovoljne. Može biti korisno razgovarati sa stručnom osobom ako:',
    warningTitle: 'Znakovi koje vrijedi provjeriti',
    consultSigns: [
      'Problemi sa spavanjem traju nekoliko tjedana',
      'Umor snažno utječe na svakodnevni život',
      'Nesanica traje unatoč dobrim navikama',
    ],
    infoCard2Title: 'Priprema za taj pregled',
    infoCard2Text: 'Bilježenje koliko dugo problemi traju i što se čini da na njih utječe može pomoći tvom zdravstvenom djelatniku da te bolje usmjeri.',
    tipTitle: 'Dobro je znati',
    tipText: 'Te su promjene sna česte i obično privremene: ne znače da je nešto pogrešno.',
    summaryPoints: [
      'Progesteron ima blag sedativni učinak; njegov pad pred kraj ciklusa može poremetiti san.',
      'U menopauzi je noćno znojenje čest uzrok buđenja.',
      'Stabilna večernja rutina i svježa spavaća soba pomažu ograničiti te poremećaje, u bilo kojoj dobi.',
      'O dugotrajnim problemima sa spavanjem vrijedi razgovarati sa zdravstvenim djelatnikom.',
    ],
    disclaimerText: 'Informativni sadržaj. Ovaj članak ne zamjenjuje individualni medicinski savjet. U slučaju nedoumice zatraži savjet zdravstvenog djelatnika.',
    shareMessage: 'San i hormoni: slabo poznata veza — AWA',
  },
  bs: {
    badge: 'MENSTRUALNI CIKLUS • SAN',
    title: 'San i hormoni:\nslabo poznata veza',
    metaDuration: '6 min čitanja',
    metaType: 'Članak',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Zašta se tvoj san mijenja ovisno o fazi ciklusa i u menopauzi.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Zašta hormoni utječu na san',
      'San kroz faze ciklusa',
      'Stres i kvaliteta sna',
      'Umirujuća večernja rutina',
      'Kada posjetiti stručnu osobu',
      'Ključne poruke',
    ],
    section1Body: 'Progesteron ima blag sedativni učinak; njegov pad pred kraj ciklusa može poremetiti san, čineći ga plićim ili isprekidanijim.',
    infoCard1Title: 'Dobro je znati',
    infoCard1Text: 'Blagi porast tjelesne temperature nakon ovulacije također može kod nekih osoba malo otežati uspavljivanje.',
    phaseSleep: [
      {title: 'Tokom menstruacije', text: 'Tjelesna nelagoda i umor mogu učiniti san plićim.'},
      {title: 'Oko ovulacije', text: 'San je općenito stabilniji kod većine osoba.'},
      {title: 'Prije menstruacije', text: 'Pad progesterona može učiniti san plićim, uz moguća buđenja.'},
    ],
    section2Body: 'U menopauzi je noćno znojenje čest uzrok buđenja, iz sličnih hormonskih razloga.',
    section3Body: 'Stres može pojačati poremećaje sna tokom faza ciklusa koje su već osjetljivije. Jednostavne tehnike opuštanja (disanje, nježno istezanje) mogu ti pomoći smiriti se prije spavanja.',
    section4Body: 'Stabilna večernja rutina i svježa spavaća soba pomažu ograničiti te poremećaje, u bilo kojoj dobi.',
    eveningRoutine: [
      {title: 'Redovito vrijeme', text: 'Odlazak na spavanje i buđenje u stabilno vrijeme pomaže regulirati tvoj unutarnji sat.'},
      {title: 'Manje ekrana navečer', text: 'Plava svjetlost može odgoditi uspavljivanje; stanka od ekrana pomaže ti se smiriti.'},
      {title: 'Svježa spavaća soba', text: 'Umjerena temperatura olakšava uspavljivanje, u bilo kojoj dobi.'},
    ],
    section5Body: 'Dobre navike nisu uvijek dovoljne. Može biti korisno razgovarati sa stručnom osobom ako:',
    warningTitle: 'Znakovi koje vrijedi provjeriti',
    consultSigns: [
      'Problemi sa spavanjem traju nekoliko sedmica',
      'Umor snažno utječe na svakodnevni život',
      'Nesanica traje unatoč dobrim navikama',
    ],
    infoCard2Title: 'Priprema za taj pregled',
    infoCard2Text: 'Bilježenje koliko dugo problemi traju i što se čini da na njih utječe može pomoći tvom zdravstvenom radniku da te bolje usmjeri.',
    tipTitle: 'Dobro je znati',
    tipText: 'Te su promjene sna česte i obično privremene: ne znače da je nešta pogrešno.',
    summaryPoints: [
      'Progesteron ima blag sedativni učinak; njegov pad pred kraj ciklusa može poremetiti san.',
      'U menopauzi je noćno znojenje čest uzrok buđenja.',
      'Stabilna večernja rutina i svježa spavaća soba pomažu ograničiti te poremećaje, u bilo kojoj dobi.',
      'O dugotrajnim problemima sa spavanjem vrijedi razgovarati sa zdravstvenim radnikom.',
    ],
    disclaimerText: 'Informativni sadržaj. Ovaj članak ne zamjenjuje individualni medicinski savjet. U slučaju nedoumice zatraži savjet zdravstvenog radnika.',
    shareMessage: 'San i hormoni: slabo poznata veza — AWA',
  },
  sl: {
    badge: 'MENSTRUALNI CIKEL • SPANJE',
    title: 'Spanje in hormoni:\nslabo poznana povezava',
    metaDuration: '6 min branja',
    metaType: 'Članek',
    metaLevel: 'Začetnica',
    metaValidated: 'Preverjena vsebina',
    intro: 'Zakaj se tvoj spanec spreminja glede na fazo cikla in v menopavzi.',
    contentsTitle: 'V tem članku',
    topics: [
      'Zakaj hormoni vplivajo na spanje',
      'Spanje skozi faze cikla',
      'Stres in kakovost spanja',
      'Pomirjujoča večerna rutina',
      'Kdaj obiskati strokovnjaka',
      'Ključna sporočila',
    ],
    section1Body: 'Progesteron ima blag pomirjevalni učinek; njegov padec pred koncem cikla lahko moti spanec, ga naredi plitvejšega ali bolj prekinjenega.',
    infoCard1Title: 'Vredno vedeti',
    infoCard1Text: 'Rahel dvig telesne temperature po ovulaciji lahko pri nekaterih osebah tudi malo otežuje uspavanje.',
    phaseSleep: [
      {title: 'Med menstruacijo', text: 'Telesna nelagodnost in utrujenost lahko naredita spanec plitvejši.'},
      {title: 'Okoli ovulacije', text: 'Spanec je na splošno stabilnejši pri večini oseb.'},
      {title: 'Pred menstruacijo', text: 'Padec progesterona lahko naredi spanec plitvejši, z možnimi prebujanji.'},
    ],
    section2Body: 'V menopavzi je nočno potenje pogost vzrok prebujanj, iz podobnih hormonskih razlogov.',
    section3Body: 'Stres lahko okrepi motnje spanja v fazah cikla, ki so že občutljivejše. Preproste tehnike sproščanja (dihanje, nežno raztezanje) ti lahko pomagajo umiriti se pred spanjem.',
    section4Body: 'Stabilna večerna rutina in sveža spalnica pomagata omejiti te motnje, v kateri koli starosti.',
    eveningRoutine: [
      {title: 'Redne ure', text: 'Odhod v posteljo in bujenje ob stalni uri pomaga uravnavati tvojo notranjo uro.'},
      {title: 'Manj zaslonov zvečer', text: 'Modra svetloba lahko odloži uspavanje; odmor od zaslona ti pomaga umiriti se.'},
      {title: 'Sveža spalnica', text: 'Zmerna temperatura olajša uspavanje, v kateri koli starosti.'},
    ],
    section5Body: 'Dobre navade niso vedno dovolj. Lahko je koristno govoriti s strokovnjakom, če:',
    warningTitle: 'Znaki, ki jih je vredno preveriti',
    consultSigns: [
      'Težave s spanjem trajajo več tednov',
      'Utrujenost močno vpliva na vsakdanje življenje',
      'Nespečnost vztraja kljub dobrim navadam',
    ],
    infoCard2Title: 'Priprava na ta pregled',
    infoCard2Text: 'Beleženje, kako dolgo težave trajajo in kaj se zdi, da vpliva nanje, lahko pomaga tvojemu zdravstvenemu delavcu, da te bolje usmeri.',
    tipTitle: 'Vredno vedeti',
    tipText: 'Te spremembe spanja so pogoste in običajno začasne: ne pomenijo, da je kaj narobe.',
    summaryPoints: [
      'Progesteron ima blag pomirjevalni učinek; njegov padec pred koncem cikla lahko moti spanec.',
      'V menopavzi je nočno potenje pogost vzrok prebujanj.',
      'Stabilna večerna rutina in sveža spalnica pomagata omejiti te motnje, v kateri koli starosti.',
      'O dolgotrajnih težavah s spanjem je vredno govoriti z zdravstvenim delavcem.',
    ],
    disclaimerText: 'Informativna vsebina. Ta članek ne nadomešča osebnega zdravniškega nasveta. V primeru dvoma poišči nasvet zdravstvenega delavca.',
    shareMessage: 'Spanje in hormoni: slabo poznana povezava — AWA',
  },
  ne: {
    badge: 'मासिक चक्र • निद्रा',
    title: 'निद्रा र हर्मोन:\nकम चिनिएको सम्बन्ध',
    metaDuration: '6 मिनेट पढाइ',
    metaType: 'लेख',
    metaLevel: 'सुरुवाती',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'तपाईंको चक्रको चरण र रजोनिवृत्तिमा तपाईंको निद्रा किन बदलिन्छ।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'हर्मोनले निद्रालाई किन असर गर्छन्',
      'चक्रका चरणहरूमा निद्रा',
      'तनाव र निद्राको गुणस्तर',
      'शान्त पार्ने बेलुकीको दिनचर्या',
      'व्यावसायिकलाई कहिले देखाउने',
      'मुख्य कुराहरू',
    ],
    section1Body: 'प्रोजेस्टेरोनले हल्का निद्रा ल्याउने असर राख्छ; चक्रको अन्त्यमा यसको घटाइले निद्रा बिगार्न सक्छ, यसलाई हल्का वा टुक्रिएको बनाउँदै।',
    infoCard1Title: 'जान्न लायक',
    infoCard1Text: 'अण्डोत्सर्गपछि शरीरको तापक्रममा सानो वृद्धिले केही मानिसलाई निदाउन अलिक गाह्रो बनाउन पनि सक्छ।',
    phaseSleep: [
      {title: 'महिनावारीको समयमा', text: 'शारीरिक असहजता र थकानले निद्रा हल्का बनाउन सक्छ।'},
      {title: 'अण्डोत्सर्गको वरिपरि', text: 'धेरैजसो मानिसका लागि निद्रा सामान्यतया बढी स्थिर हुन्छ।'},
      {title: 'महिनावारीअघि', text: 'प्रोजेस्टेरोनको घटाइले निद्रा हल्का बनाउन सक्छ, सम्भावित ब्युँझाइसहित।'},
    ],
    section2Body: 'रजोनिवृत्तिमा, रातको पसिना ब्युँझनुको सामान्य कारण हो, उस्तै हर्मोनल कारणले।',
    section3Body: 'तनावले चक्रका पहिल्यै बढी संवेदनशील चरणहरूमा निद्राको बाधा बढाउन सक्छ। सरल आरामका प्रविधिहरू (सास फेर्ने, कोमल स्ट्रेचिङ) ले सुत्नुअघि आराम गर्न मद्दत गर्न सक्छन्।',
    section4Body: 'स्थिर सुत्ने दिनचर्या र चिसो सुत्ने कोठाले, जुनसुकै उमेरमा, यी बाधाहरू सीमित गर्न मद्दत गर्छन्।',
    eveningRoutine: [
      {title: 'नियमित समय', text: 'स्थिर समयमा सुत्नु र उठ्नुले तपाईंको आन्तरिक घडी नियमन गर्न मद्दत गर्छ।'},
      {title: 'बेलुका कम स्क्रिन समय', text: 'निलो बत्तीले निदाउन ढिलो गर्न सक्छ; स्क्रिनबाट विरामले तपाईंलाई आराम गर्न मद्दत गर्छ।'},
      {title: 'चिसो सुत्ने कोठा', text: 'मध्यम तापक्रमले, जुनसुकै उमेरमा, निदाउन सजिलो बनाउँछ।'},
    ],
    section5Body: 'राम्रा बानीहरू सधैँ पर्याप्त हुँदैनन्। यस्तो भएमा व्यावसायिकसँग कुरा गर्नु मद्दतकारी हुन सक्छ:',
    warningTitle: 'जाँच गराउन लायक संकेतहरू',
    consultSigns: [
      'निद्राका समस्या धेरै हप्तादेखि रहेका छन्',
      'थकानले दैनिक जीवनलाई ठूलो असर गरिरहेको छ',
      'राम्रा बानीका बावजुद अनिद्रा रहिरहेको छ',
    ],
    infoCard2Title: 'यो भेटघाटको तयारी',
    infoCard2Text: 'समस्याहरू कति समयदेखि छन् र के कुराले तिनलाई प्रभाव पार्छ जस्तो लाग्छ टिप्नाले तपाईंको स्वास्थ्यकर्मीलाई तपाईंलाई राम्ररी मार्गदर्शन गर्न मद्दत गर्न सक्छ।',
    tipTitle: 'जान्न लायक',
    tipText: 'निद्राका यी परिवर्तनहरू सामान्य र प्रायः अस्थायी हुन्छन्: तिनले केही गडबड छ भन्ने जनाउँदैनन्।',
    summaryPoints: [
      'प्रोजेस्टेरोनले हल्का निद्रा ल्याउने असर राख्छ; चक्रको अन्त्यमा यसको घटाइले निद्रा बिगार्न सक्छ।',
      'रजोनिवृत्तिमा, रातको पसिना ब्युँझनुको सामान्य कारण हो।',
      'स्थिर सुत्ने दिनचर्या र चिसो सुत्ने कोठाले, जुनसुकै उमेरमा, यी बाधाहरू सीमित गर्न मद्दत गर्छन्।',
      'लगातार निद्राका समस्याबारे स्वास्थ्यकर्मीसँग छलफल गर्न लायक हुन्छ।',
    ],
    disclaimerText: 'जानकारीमूलक सामग्री। यो लेखले व्यक्तिगत चिकित्सकीय सल्लाहको स्थान लिँदैन। शङ्का भए स्वास्थ्यकर्मीसँग मार्गदर्शन लिनुहोस्।',
    shareMessage: 'निद्रा र हर्मोन: कम चिनिएको सम्बन्ध — AWA',
  },
  si: {
    badge: 'ඔසප් චක්‍රය • නින්ද',
    title: 'නින්ද සහ හෝමෝන:\nසුළු දන්නා සම්බන්ධය',
    metaDuration: 'කියවීමට මිනිත්තු 6',
    metaType: 'ලිපිය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'ඔබේ නින්ද ඔබේ චක්‍ර අවධිය අනුව සහ ඔසප් නැවතීමේදී වෙනස් වන්නේ ඇයි.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'හෝමෝන නින්දට බලපාන්නේ ඇයි',
      'චක්‍රයේ අවධි පුරා නින්ද',
      'ආතතිය සහ නින්දේ ගුණාත්මකභාවය',
      'සැනසිලිදායක සවස් පුරුද්දක්',
      'වෘත්තිකයෙකු හමුවිය යුත්තේ කවදාද',
      'ප්‍රධාන කරුණු',
    ],
    section1Body: 'ප්‍රොජෙස්ටරෝන්වලට මෘදු සංසිඳුවන බලපෑමක් ඇත; චක්‍රයේ අවසානයේ එහි පහත වැටීම නින්ද කඩාකප්පල් කළ හැකි අතර, එය සැහැල්ලු හෝ වඩා කැඩුණු කරයි.',
    infoCard1Title: 'දැනගත යුතු දේ',
    infoCard1Text: 'ඩිම්බ මෝචනයෙන් පසු ශරීර උෂ්ණත්වයේ සුළු ඉහළ යාම සමහර පුද්ගලයන්ට නිදාගැනීම ටිකක් අපහසු කළ හැක.',
    phaseSleep: [
      {title: 'ඔබේ ඔසප් කාලයේ', text: 'ශාරීරික අපහසුතාව සහ වෙහෙස නින්ද සැහැල්ලු කළ හැක.'},
      {title: 'ඩිම්බ මෝචනය වටා', text: 'නින්ද සාමාන්‍යයෙන් බොහෝ පුද්ගලයන්ට වඩා ස්ථාවරයි.'},
      {title: 'ඔබේ ඔසප්වලට පෙර', text: 'ප්‍රොජෙස්ටරෝන් පහත වැටීම නින්ද සැහැල්ලු කළ හැකි අතර, අවදි වීම් ඇතිවිය හැක.'},
    ],
    section2Body: 'ඔසප් නැවතීමේදී, රාත්‍රී දහදිය සමාන හෝමෝන හේතූන් නිසා අවදි වීමට පොදු හේතුවකි.',
    section3Body: 'ආතතියට දැනටමත් වඩා සංවේදී චක්‍රයේ අවධිවල නින්ද කඩාකප්පල් වීම් වැඩි කළ හැක. සරල ලිහිල් කිරීමේ ක්‍රම (හුස්ම ගැනීම, මෘදු දිගු කිරීම) නිදාගැනීමට පෙර ලිහිල් වීමට ඔබට උපකාරී විය හැක.',
    section4Body: 'ස්ථාවර නින්දට යාමේ පුරුද්දක් සහ සිසිල් නිදන කාමරයක් ඕනෑම වයසකදී මෙම කඩාකප්පල් වීම් සීමා කිරීමට උපකාරී වේ.',
    eveningRoutine: [
      {title: 'නිතිපතා පැය', text: 'ස්ථාවර වේලාවන්හි නින්දට යාම සහ අවදි වීම ඔබේ අභ්‍යන්තර ඔරලෝසුව නියාමනය කිරීමට උපකාරී වේ.'},
      {title: 'සවස අඩු තිර කාලය', text: 'නිල් ආලෝකය නින්ද යාම ප්‍රමාද කළ හැක; තිරයකින් විරාමයක් ලිහිල් වීමට ඔබට උපකාරී වේ.'},
      {title: 'සිසිල් නිදන කාමරයක්', text: 'මධ්‍යස්ථ උෂ්ණත්වයක් ඕනෑම වයසකදී නින්ද යාම පහසු කරයි.'},
    ],
    section5Body: 'හොඳ පුරුදු සෑම විටම ප්‍රමාණවත් නොවේ. මෙසේ නම් වෘත්තිකයෙකු සමඟ කතා කිරීම උපකාරී විය හැක:',
    warningTitle: 'පරීක්ෂා කර ගැනීම වටින සලකුණු',
    consultSigns: [
      'නින්ද ගැටලු සති කිහිපයක් පවතී',
      'වෙහෙස එදිනෙදා ජීවිතයට දැඩි ලෙස බලපායි',
      'හොඳ පුරුදු තිබියදීත් අනිද්‍රාව දිගටම පවතී',
    ],
    infoCard2Title: 'මෙම හමුවීමට සූදානම් වීම',
    infoCard2Text: 'ගැටලු පවතින කාලය සහ ඒවාට බලපාන බව පෙනෙන දේ සටහන් කිරීම ඔබේ සෞඛ්‍ය වෘත්තිකයාට ඔබට වඩා හොඳින් මඟ පෙන්වීමට උපකාරී විය හැක.',
    tipTitle: 'දැනගත යුතු දේ',
    tipText: 'මෙම නින්ද වෙනස්කම් පොදු සහ සාමාන්‍යයෙන් තාවකාලික වේ: ඒවා යමක් වැරදී ඇති බව අදහස් නොවේ.',
    summaryPoints: [
      'ප්‍රොජෙස්ටරෝන්වලට මෘදු සංසිඳුවන බලපෑමක් ඇත; චක්‍රයේ අවසානයේ එහි පහත වැටීම නින්ද කඩාකප්පල් කළ හැක.',
      'ඔසප් නැවතීමේදී, රාත්‍රී දහදිය අවදි වීමට පොදු හේතුවකි.',
      'ස්ථාවර නින්දට යාමේ පුරුද්දක් සහ සිසිල් නිදන කාමරයක් ඕනෑම වයසකදී මෙම කඩාකප්පල් වීම් සීමා කිරීමට උපකාරී වේ.',
      'දිගටම පවතින නින්ද ගැටලු සෞඛ්‍ය වෘත්තිකයෙකු සමඟ සාකච්ඡා කිරීම වටී.',
    ],
    disclaimerText: 'තොරතුරු අන්තර්ගතයකි. මෙම ලිපිය පුද්ගලීකරණය කළ වෛද්‍ය උපදෙස් වෙනුවට නොපවතී. සැකයක් ඇත්නම්, සෞඛ්‍ය වෘත්තිකයෙකුගෙන් මඟපෙන්වීමක් ලබා ගන්න.',
    shareMessage: 'නින්ද සහ හෝමෝන: සුළු දන්නා සම්බන්ධය — AWA',
  },
  th: {
    badge: 'รอบเดือน • การนอนหลับ',
    title: 'การนอนหลับกับฮอร์โมน:\nความเชื่อมโยงที่ไม่ค่อยมีใครรู้',
    metaDuration: 'อ่าน 6 นาที',
    metaType: 'บทความ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'ทำไมการนอนของคุณเปลี่ยนไปตามระยะของรอบเดือน และเมื่อเข้าสู่วัยหมดประจำเดือน',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'ทำไมฮอร์โมนจึงส่งผลต่อการนอน',
      'การนอนในแต่ละระยะของรอบเดือน',
      'ความเครียดและคุณภาพการนอน',
      'กิจวัตรยามเย็นที่ผ่อนคลาย',
      'เมื่อไรควรพบผู้เชี่ยวชาญ',
      'ประเด็นสำคัญ',
    ],
    section1Body: 'โปรเจสเตอโรนมีฤทธิ์ทำให้สงบเล็กน้อย การลดลงของมันในช่วงท้ายรอบเดือนอาจรบกวนการนอน ทำให้หลับตื้นหรือขาดช่วงมากขึ้น',
    infoCard1Title: 'ควรรู้',
    infoCard1Text: 'อุณหภูมิร่างกายที่สูงขึ้นเล็กน้อยหลังการตกไข่ยังอาจทำให้หลับยากขึ้นเล็กน้อยในบางคน',
    phaseSleep: [
      {title: 'ระหว่างมีประจำเดือน', text: 'ความไม่สบายทางกายและความเหนื่อยล้าอาจทำให้หลับตื้นลง'},
      {title: 'ช่วงใกล้ตกไข่', text: 'การนอนโดยทั่วไปคงที่กว่าสำหรับคนส่วนใหญ่'},
      {title: 'ก่อนมีประจำเดือน', text: 'การลดลงของโปรเจสเตอโรนอาจทำให้หลับตื้นลง และอาจตื่นกลางดึก'},
    ],
    section2Body: 'ในวัยหมดประจำเดือน เหงื่อออกตอนกลางคืนเป็นสาเหตุที่พบบ่อยของการตื่น ด้วยเหตุผลทางฮอร์โมนที่คล้ายกัน',
    section3Body: 'ความเครียดอาจขยายการรบกวนการนอนในระยะของรอบเดือนที่อ่อนไหวอยู่แล้ว เทคนิคผ่อนคลายง่าย ๆ (การหายใจ การยืดเหยียดเบา ๆ) ช่วยให้คุณผ่อนคลายก่อนนอน',
    section4Body: 'กิจวัตรก่อนนอนที่คงที่และห้องนอนที่เย็นช่วยจำกัดการรบกวนเหล่านี้ได้ ในทุกวัย',
    eveningRoutine: [
      {title: 'เวลาสม่ำเสมอ', text: 'การเข้านอนและตื่นในเวลาที่คงที่ช่วยปรับนาฬิกาชีวิตภายในของคุณ'},
      {title: 'ลดเวลาหน้าจอในตอนเย็น', text: 'แสงสีฟ้าอาจทำให้หลับช้าลง การพักจากหน้าจอช่วยให้คุณผ่อนคลาย'},
      {title: 'ห้องนอนเย็น', text: 'อุณหภูมิที่พอดีทำให้หลับง่ายขึ้น ในทุกวัย'},
    ],
    section5Body: 'นิสัยที่ดีไม่ได้เพียงพอเสมอไป การพูดคุยกับผู้เชี่ยวชาญมีประโยชน์หาก:',
    warningTitle: 'สัญญาณที่ควรตรวจ',
    consultSigns: [
      'ปัญหาการนอนเป็นมาหลายสัปดาห์',
      'ความเหนื่อยล้าส่งผลต่อชีวิตประจำวันอย่างมาก',
      'นอนไม่หลับต่อเนื่องแม้มีนิสัยที่ดี',
    ],
    infoCard2Title: 'เตรียมตัวสำหรับการนัดหมายนี้',
    infoCard2Text: 'การจดว่าปัญหาเป็นมานานเท่าไรและอะไรที่ดูเหมือนมีอิทธิพล ช่วยให้บุคลากรทางการแพทย์ของคุณแนะนำคุณได้ดียิ่งขึ้น',
    tipTitle: 'ควรรู้',
    tipText: 'การเปลี่ยนแปลงของการนอนเหล่านี้พบบ่อยและมักเป็นเพียงชั่วคราว: ไม่ได้หมายความว่ามีสิ่งผิดปกติ',
    summaryPoints: [
      'โปรเจสเตอโรนมีฤทธิ์ทำให้สงบเล็กน้อย การลดลงของมันในช่วงท้ายรอบเดือนอาจรบกวนการนอน',
      'ในวัยหมดประจำเดือน เหงื่อออกตอนกลางคืนเป็นสาเหตุที่พบบ่อยของการตื่น',
      'กิจวัตรก่อนนอนที่คงที่และห้องนอนที่เย็นช่วยจำกัดการรบกวนเหล่านี้ได้ ในทุกวัย',
      'ปัญหาการนอนที่ต่อเนื่องควรพูดคุยกับบุคลากรทางการแพทย์',
    ],
    disclaimerText: 'เนื้อหาเพื่อให้ข้อมูล บทความนี้ไม่ได้ทดแทนคำแนะนำทางการแพทย์เฉพาะบุคคล หากมีข้อสงสัย โปรดขอคำแนะนำจากบุคลากรทางการแพทย์',
    shareMessage: 'การนอนหลับกับฮอร์โมน: ความเชื่อมโยงที่ไม่ค่อยมีใครรู้ — AWA',
  },
  vi: {
    badge: 'CHU KỲ KINH NGUYỆT • GIẤC NGỦ',
    title: 'Giấc ngủ và hormone:\nmối liên hệ ít được biết đến',
    metaDuration: '6 phút đọc',
    metaType: 'Bài viết',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Tại sao giấc ngủ của bạn thay đổi tùy theo giai đoạn chu kỳ, và khi mãn kinh.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Tại sao hormone ảnh hưởng đến giấc ngủ',
      'Giấc ngủ qua các giai đoạn của chu kỳ',
      'Căng thẳng và chất lượng giấc ngủ',
      'Một thói quen buổi tối dịu nhẹ',
      'Khi nào nên gặp chuyên gia',
      'Những điểm chính cần nhớ',
    ],
    section1Body: 'Progesterone có tác dụng an thần nhẹ; sự sụt giảm của nó vào cuối chu kỳ có thể làm rối loạn giấc ngủ, khiến giấc ngủ nông hơn hoặc ngắt quãng hơn.',
    infoCard1Title: 'Nên biết',
    infoCard1Text: 'Thân nhiệt tăng nhẹ sau khi rụng trứng cũng có thể khiến một số người khó đi vào giấc ngủ hơn một chút.',
    phaseSleep: [
      {title: 'Trong kỳ kinh', text: 'Khó chịu về thể chất và mệt mỏi có thể khiến giấc ngủ nông hơn.'},
      {title: 'Quanh thời điểm rụng trứng', text: 'Giấc ngủ nhìn chung ổn định hơn ở hầu hết mọi người.'},
      {title: 'Trước kỳ kinh', text: 'Sự sụt giảm progesterone có thể khiến giấc ngủ nông hơn, với khả năng thức giấc.'},
    ],
    section2Body: 'Khi mãn kinh, đổ mồ hôi ban đêm là nguyên nhân phổ biến khiến thức giấc, vì những lý do nội tiết tương tự.',
    section3Body: 'Căng thẳng có thể khuếch đại những rối loạn giấc ngủ trong các giai đoạn vốn đã nhạy cảm hơn của chu kỳ. Các kỹ thuật thư giãn đơn giản (hít thở, giãn cơ nhẹ nhàng) có thể giúp bạn thả lỏng trước khi ngủ.',
    section4Body: 'Một thói quen đi ngủ ổn định và phòng ngủ mát giúp hạn chế những rối loạn này, ở mọi lứa tuổi.',
    eveningRoutine: [
      {title: 'Giờ giấc đều đặn', text: 'Đi ngủ và thức dậy vào những giờ ổn định giúp điều hòa đồng hồ sinh học của bạn.'},
      {title: 'Bớt dùng màn hình vào buổi tối', text: 'Ánh sáng xanh có thể làm chậm việc đi vào giấc ngủ; nghỉ khỏi màn hình giúp bạn thả lỏng.'},
      {title: 'Phòng ngủ mát', text: 'Nhiệt độ vừa phải giúp dễ đi vào giấc ngủ hơn, ở mọi lứa tuổi.'},
    ],
    section5Body: 'Thói quen tốt không phải lúc nào cũng đủ. Có thể hữu ích khi nói chuyện với chuyên gia nếu:',
    warningTitle: 'Những dấu hiệu đáng được kiểm tra',
    consultSigns: [
      'Các vấn đề về giấc ngủ kéo dài vài tuần',
      'Mệt mỏi ảnh hưởng mạnh đến cuộc sống hằng ngày',
      'Mất ngủ kéo dài dù đã có thói quen tốt',
    ],
    infoCard2Title: 'Chuẩn bị cho buổi hẹn này',
    infoCard2Text: 'Ghi lại các vấn đề đã kéo dài bao lâu và điều gì có vẻ ảnh hưởng đến chúng có thể giúp nhân viên y tế hướng dẫn bạn tốt hơn.',
    tipTitle: 'Nên biết',
    tipText: 'Những thay đổi giấc ngủ này là phổ biến và thường chỉ tạm thời: chúng không có nghĩa là có điều gì sai.',
    summaryPoints: [
      'Progesterone có tác dụng an thần nhẹ; sự sụt giảm của nó vào cuối chu kỳ có thể làm rối loạn giấc ngủ.',
      'Khi mãn kinh, đổ mồ hôi ban đêm là nguyên nhân phổ biến khiến thức giấc.',
      'Một thói quen đi ngủ ổn định và phòng ngủ mát giúp hạn chế những rối loạn này, ở mọi lứa tuổi.',
      'Các vấn đề về giấc ngủ kéo dài đáng được trao đổi với nhân viên y tế.',
    ],
    disclaimerText: 'Nội dung mang tính thông tin. Bài viết này không thay thế lời khuyên y khoa cá nhân hóa. Nếu có nghi ngờ, hãy tìm hướng dẫn từ nhân viên y tế.',
    shareMessage: 'Giấc ngủ và hormone: mối liên hệ ít được biết đến — AWA',
  },
  uz: {
    badge: 'HAYZ SIKLI • UYQU',
    title: 'Uyqu va gormonlar:\nkam maʼlum bogʻliqlik',
    metaDuration: '6 daq oʻqish',
    metaType: 'Maqola',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Nima uchun uyquingiz sikl bosqichiga qarab va menopauzada oʻzgaradi.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Gormonlar nima uchun uyquga taʼsir qiladi',
      'Sikl bosqichlarida uyqu',
      'Stress va uyqu sifati',
      'Tinchlantiruvchi kechki tartib',
      'Qachon mutaxassisga borish kerak',
      'Asosiy xulosalar',
    ],
    section1Body: 'Progesteron yengil tinchlantiruvchi taʼsirga ega; uning sikl oxirida pasayishi uyquni buzishi, uni yengilroq yoki boʻlak-boʻlak qilishi mumkin.',
    infoCard1Title: 'Bilish foydali',
    infoCard1Text: 'Ovulyatsiyadan keyin tana haroratining ozgina koʻtarilishi baʼzi odamlar uchun uxlab qolishni ham biroz qiyinlashtirishi mumkin.',
    phaseSleep: [
      {title: 'Hayz paytida', text: 'Jismoniy noqulaylik va charchoq uyquni yengilroq qilishi mumkin.'},
      {title: 'Ovulyatsiya atrofida', text: 'Uyqu koʻpchilik uchun odatda barqarorroq boʻladi.'},
      {title: 'Hayzdan oldin', text: 'Progesteronning pasayishi uyquni yengilroq qilishi, uygʻonishlar boʻlishi mumkin.'},
    ],
    section2Body: 'Menopauzada tungi terlash uygʻonishning keng tarqalgan sababi, bunga ham shunga oʻxshash gormonal sabablar bor.',
    section3Body: 'Stress sikl davrlarining allaqachon sezgirroq bosqichlarida uyqu buzilishlarini kuchaytirishi mumkin. Oddiy boʻshashish usullari (nafas olish, muloyim choʻzilish) uxlashdan oldin xotirjamlashishga yordam beradi.',
    section4Body: 'Barqaror uxlash tartibi va salqin yotoqxona istalgan yoshda bu buzilishlarni cheklashga yordam beradi.',
    eveningRoutine: [
      {title: 'Muntazam soatlar', text: 'Barqaror vaqtda uxlash va uygʻonish ichki soatingizni tartibga solishga yordam beradi.'},
      {title: 'Kechqurun ekranga kamroq qarash', text: 'Koʻk yorugʻlik uxlab qolishni kechiktirishi mumkin; ekrandan tanaffus xotirjamlashishga yordam beradi.'},
      {title: 'Salqin yotoqxona', text: 'Muʼtadil harorat istalgan yoshda uxlab qolishni osonlashtiradi.'},
    ],
    section5Body: 'Yaxshi odatlar har doim ham yetarli emas. Quyidagi hollarda mutaxassis bilan gaplashish foydali boʻlishi mumkin:',
    warningTitle: 'Tekshiruvdan oʻtishga arziydigan belgilar',
    consultSigns: [
      'Uyqu muammolari bir necha haftadan beri davom etmoqda',
      'Charchoq kundalik hayotga kuchli taʼsir qilmoqda',
      'Yaxshi odatlarga qaramay uyqusizlik davom etmoqda',
    ],
    infoCard2Title: 'Bu qabulga tayyorgarlik',
    infoCard2Text: 'Muammolar qancha davom etganini va nima taʼsir qilayotganini yozib qoʻyish sogʻliqni saqlash mutaxassisiga sizni yaxshiroq yoʻnaltirishga yordam beradi.',
    tipTitle: 'Bilish foydali',
    tipText: 'Bu uyqu oʻzgarishlari keng tarqalgan va odatda vaqtinchalik: ular nimadir notoʻgʻri ekanini anglatmaydi.',
    summaryPoints: [
      'Progesteron yengil tinchlantiruvchi taʼsirga ega; uning sikl oxirida pasayishi uyquni buzishi mumkin.',
      'Menopauzada tungi terlash uygʻonishning keng tarqalgan sababi.',
      'Barqaror uxlash tartibi va salqin yotoqxona istalgan yoshda bu buzilishlarni cheklashga yordam beradi.',
      'Doimiy uyqu muammolarini sogʻliqni saqlash mutaxassisi bilan muhokama qilishga arziydi.',
    ],
    disclaimerText: 'Maʼlumot uchun kontent. Bu maqola shaxsiy tibbiy maslahatni almashtirmaydi. Shubha boʻlsa, sogʻliqni saqlash mutaxassisidan yoʻl-yoʻriq soʻrang.',
    shareMessage: 'Uyqu va gormonlar: kam maʼlum bogʻliqlik — AWA',
  },
  az: {
    badge: 'MENSTRUAL DÖVR • YUXU',
    title: 'Yuxu və hormonlar:\nazbilinən əlaqə',
    metaDuration: '6 dəq oxu',
    metaType: 'Məqalə',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Yuxunuz nə üçün dövr fazasından asılı olaraq və menopauzada dəyişir.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Hormonlar yuxuya nə üçün təsir edir',
      'Dövrün fazaları üzrə yuxu',
      'Stress və yuxunun keyfiyyəti',
      'Sakitləşdirici axşam rutini',
      'Nə vaxt mütəxəssisə müraciət etmək lazımdır',
      'Əsas nəticələr',
    ],
    section1Body: 'Progesteronun yüngül sakitləşdirici təsiri var; dövrün sonunda onun azalması yuxunu pozaraq onu daha səthi və ya daha kəsik-kəsik edə bilər.',
    infoCard1Title: 'Bilmək faydalıdır',
    infoCard1Text: 'Ovulyasiyadan sonra bədən temperaturunun yüngül yüksəlməsi bəzi insanlar üçün yuxuya getməyi bir qədər çətinləşdirə bilər.',
    phaseSleep: [
      {title: 'Aybaşı zamanı', text: 'Fiziki narahatlıq və yorğunluq yuxunu daha səthi edə bilər.'},
      {title: 'Ovulyasiya ətrafında', text: 'Yuxu əksər insanlar üçün ümumiyyətlə daha sabit olur.'},
      {title: 'Aybaşıdan əvvəl', text: 'Progesteronun azalması yuxunu daha səthi edə bilər, oyanmalar mümkündür.'},
    ],
    section2Body: 'Menopauzada gecə tərləmələri oxşar hormonal səbəblərə görə oyanmanın geniş yayılmış səbəbidir.',
    section3Body: 'Stress dövrün artıq daha həssas olan fazalarında yuxu pozuntularını gücləndirə bilər. Sadə relaksasiya üsulları (nəfəs, mülayim dartılma) yatmazdan əvvəl rahatlamağa kömək edə bilər.',
    section4Body: 'Sabit yatma rutini və sərin yataq otağı istənilən yaşda bu pozuntuları məhdudlaşdırmağa kömək edir.',
    eveningRoutine: [
      {title: 'Müntəzəm saatlar', text: 'Sabit saatlarda yatmaq və oyanmaq daxili saatı tənzimləməyə kömək edir.'},
      {title: 'Axşam ekrandan az istifadə', text: 'Mavi işıq yuxuya getməni gecikdirə bilər; ekrandan fasilə sakitləşməyə kömək edir.'},
      {title: 'Sərin yataq otağı', text: 'Mülayim temperatur istənilən yaşda yuxuya getməyi asanlaşdırır.'},
    ],
    section5Body: 'Yaxşı vərdişlər həmişə kifayət etmir. Aşağıdakı hallarda mütəxəssislə danışmaq faydalı ola bilər:',
    warningTitle: 'Yoxlanılmağa dəyər əlamətlər',
    consultSigns: [
      'Yuxu problemləri bir neçə həftədir davam edir',
      'Yorğunluq gündəlik həyata güclü təsir edir',
      'Yaxşı vərdişlərə baxmayaraq yuxusuzluq davam edir',
    ],
    infoCard2Title: 'Bu görüşə hazırlıq',
    infoCard2Text: 'Problemlərin nə qədər davam etdiyini və nəyin onlara təsir etdiyini qeyd etmək tibb işçisinin sizi daha yaxşı istiqamətləndirməsinə kömək edə bilər.',
    tipTitle: 'Bilmək faydalıdır',
    tipText: 'Bu yuxu dəyişiklikləri geniş yayılıb və adətən müvəqqətidir: onlar nəsə səhv olduğunu bildirmir.',
    summaryPoints: [
      'Progesteronun yüngül sakitləşdirici təsiri var; dövrün sonunda onun azalması yuxunu poza bilər.',
      'Menopauzada gecə tərləmələri oyanmanın geniş yayılmış səbəbidir.',
      'Sabit yatma rutini və sərin yataq otağı istənilən yaşda bu pozuntuları məhdudlaşdırmağa kömək edir.',
      'Davamlı yuxu problemlərini tibb işçisi ilə müzakirə etməyə dəyər.',
    ],
    disclaimerText: 'Məlumat xarakterli məzmun. Bu məqalə fərdi tibbi məsləhəti əvəz etmir. Şübhə olarsa, tibb işçisindən məsləhət alın.',
    shareMessage: 'Yuxu və hormonlar: azbilinən əlaqə — AWA',
  },
  ka: {
    badge: 'მენსტრუაციული ციკლი • ძილი',
    title: 'ძილი და ჰორმონები:\nნაკლებად ცნობილი კავშირი',
    metaDuration: '6 წთ საკითხავი',
    metaType: 'სტატია',
    metaLevel: 'დამწყები',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'რატომ იცვლება თქვენი ძილი ციკლის ფაზის მიხედვით და მენოპაუზისას.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'რატომ მოქმედებს ჰორმონები ძილზე',
      'ძილი ციკლის ფაზების მიხედვით',
      'სტრესი და ძილის ხარისხი',
      'დამამშვიდებელი საღამოს რუტინა',
      'როდის მივმართოთ სპეციალისტს',
      'მთავარი დასკვნები',
    ],
    section1Body: 'პროგესტერონს მსუბუქი დამამშვიდებელი ეფექტი აქვს; ციკლის ბოლოს მისმა შემცირებამ შეიძლება ძილი დაარღვიოს და ის უფრო მსუბუქი ან დანაწევრებული გახადოს.',
    infoCard1Title: 'კარგია ვიცოდეთ',
    infoCard1Text: 'სხეულის ტემპერატურის მცირე მატებამ ოვულაციის შემდეგ შეიძლება ზოგისთვის ჩაძინებაც ცოტა გაართულოს.',
    phaseSleep: [
      {title: 'მენსტრუაციის დროს', text: 'ფიზიკურმა დისკომფორტმა და დაღლილობამ შეიძლება ძილი უფრო მსუბუქი გახადოს.'},
      {title: 'ოვულაციის გარშემო', text: 'ძილი ზოგადად უფრო სტაბილურია უმრავლესობისთვის.'},
      {title: 'მენსტრუაციამდე', text: 'პროგესტერონის შემცირებამ შეიძლება ძილი უფრო მსუბუქი გახადოს, შესაძლო გაღვიძებებით.'},
    ],
    section2Body: 'მენოპაუზისას ღამის ოფლიანობა გაღვიძების გავრცელებული მიზეზია, მსგავსი ჰორმონული მიზეზების გამო.',
    section3Body: 'სტრესმა შეიძლება ძილის დარღვევები გააძლიეროს ციკლის უკვე უფრო მგრძნობიარე ფაზებში. მოდუნების მარტივ ტექნიკებს (სუნთქვა, რბილი გაჭიმვა) შეუძლია დაძინებამდე მოდუნებაში დაგეხმაროთ.',
    section4Body: 'დაძინების სტაბილური რუტინა და გრილი საძინებელი ამ დარღვევების შეზღუდვაში გეხმარებათ, ნებისმიერ ასაკში.',
    eveningRoutine: [
      {title: 'რეგულარული საათები', text: 'სტაბილურ დროს დაძინება და გაღვიძება თქვენი შიდა საათის რეგულირებაში გეხმარებათ.'},
      {title: 'ნაკლები ეკრანი საღამოს', text: 'ლურჯმა სინათლემ შეიძლება ჩაძინება დააგვიანოს; ეკრანისგან შესვენება დამშვიდებაში გეხმარებათ.'},
      {title: 'გრილი საძინებელი', text: 'ზომიერი ტემპერატურა ჩაძინებას ამარტივებს, ნებისმიერ ასაკში.'},
    ],
    section5Body: 'კარგი ჩვევები ყოველთვის საკმარისი არ არის. სპეციალისტთან საუბარი სასარგებლო შეიძლება იყოს, თუ:',
    warningTitle: 'ნიშნები, რომლებიც შემოწმებას იმსახურებს',
    consultSigns: [
      'ძილის პრობლემები რამდენიმე კვირაა გრძელდება',
      'დაღლილობა ყოველდღიურ ცხოვრებაზე ძლიერ მოქმედებს',
      'უძილობა კარგი ჩვევების მიუხედავად რჩება',
    ],
    infoCard2Title: 'ამ ვიზიტისთვის მომზადება',
    infoCard2Text: 'იმის ჩაწერამ, რამდენი ხანია გრძელდება პრობლემები და რა ჩანს მათზე გავლენის მქონედ, შეიძლება თქვენს ჯანდაცვის სპეციალისტს დაეხმაროს უკეთ წარგმართოთ.',
    tipTitle: 'კარგია ვიცოდეთ',
    tipText: 'ძილის ეს ცვლილებები ხშირია და, როგორც წესი, დროებითი: ისინი არ ნიშნავს, რომ რაღაც არასწორია.',
    summaryPoints: [
      'პროგესტერონს მსუბუქი დამამშვიდებელი ეფექტი აქვს; ციკლის ბოლოს მისმა შემცირებამ შეიძლება ძილი დაარღვიოს.',
      'მენოპაუზისას ღამის ოფლიანობა გაღვიძების გავრცელებული მიზეზია.',
      'დაძინების სტაბილური რუტინა და გრილი საძინებელი ამ დარღვევების შეზღუდვაში გეხმარებათ, ნებისმიერ ასაკში.',
      'გაგრძელებული ძილის პრობლემები ჯანდაცვის სპეციალისტთან განხილვას იმსახურებს.',
    ],
    disclaimerText: 'საინფორმაციო შინაარსი. ეს სტატია პერსონალიზებულ სამედიცინო რჩევას არ ანაცვლებს. ეჭვის შემთხვევაში მიმართეთ ჯანდაცვის სპეციალისტს.',
    shareMessage: 'ძილი და ჰორმონები: ნაკლებად ცნობილი კავშირი — AWA',
  },
  hy: {
    badge: 'ԴԱՇՏԱՆԱՅԻՆ ՑԻԿԼ • ՔՈՒՆ',
    title: 'Քուն և հորմոններ.\nքիչ հայտնի կապը',
    metaDuration: '6 ր կարդալու համար',
    metaType: 'Հոդված',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Ինչու է ձեր քունը փոխվում ցիկլի փուլից կախված և դաշտանադադարի ժամանակ:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Ինչու են հորմոնները ազդում քնի վրա',
      'Քունը ցիկլի փուլերի ընթացքում',
      'Սթրես և քնի որակ',
      'Հանգստացնող երեկոյան ռեժիմ',
      'Երբ դիմել մասնագետի',
      'Հիմնական եզրակացություններ',
    ],
    section1Body: 'Պրոգեստերոնը ունի թեթև հանգստացնող ազդեցություն. ցիկլի վերջում դրա անկումը կարող է խաթարել քունը՝ դարձնելով այն ավելի թեթև կամ մասնատված:',
    infoCard1Title: 'Լավ է իմանալ',
    infoCard1Text: 'Ձվազատումից հետո մարմնի ջերմաստիճանի թեթև բարձրացումը կարող է նաև որոշ մարդկանց համար մի փոքր դժվարացնել քնելը:',
    phaseSleep: [
      {title: 'Դաշտանի ընթացքում', text: 'Ֆիզիկական անհարմարությունը և հոգնածությունը կարող են քունը դարձնել ավելի թեթև:'},
      {title: 'Ձվազատման շուրջ', text: 'Քունը ընդհանուր առմամբ ավելի կայուն է մարդկանց մեծ մասի համար:'},
      {title: 'Դաշտանից առաջ', text: 'Պրոգեստերոնի անկումը կարող է քունը դարձնել ավելի թեթև՝ հնարավոր արթնացումներով:'},
    ],
    section2Body: 'Դաշտանադադարի ժամանակ գիշերային քրտնարտադրությունը արթնանալու տարածված պատճառ է՝ նման հորմոնալ պատճառներով:',
    section3Body: 'Սթրեսը կարող է ուժեղացնել քնի խանգարումները ցիկլի արդեն ավելի զգայուն փուլերում: Թուլացման պարզ տեխնիկաները (շնչառություն, մեղմ ձգումներ) կարող են օգնել հանգստանալ քնելուց առաջ:',
    section4Body: 'Կայուն քնելու ռեժիմը և զով ննջարանը օգնում են սահմանափակել այս խանգարումները՝ ցանկացած տարիքում:',
    eveningRoutine: [
      {title: 'Կանոնավոր ժամեր', text: 'Կայուն ժամերին քնելը և արթնանալը օգնում է կարգավորել ձեր ներքին ժամացույցը:'},
      {title: 'Ավելի քիչ էկրաններ երեկոյան', text: 'Կապույտ լույսը կարող է ուշացնել քնելը. էկրանից դադարը օգնում է հանգստանալ:'},
      {title: 'Զով ննջարան', text: 'Չափավոր ջերմաստիճանը հեշտացնում է քնելը ցանկացած տարիքում:'},
    ],
    section5Body: 'Լավ սովորությունները միշտ չէ, որ բավական են: Կարող է օգտակար լինել մասնագետի հետ խոսելը, եթե.',
    warningTitle: 'Նշաններ, որոնք արժե ստուգել',
    consultSigns: [
      'Քնի խնդիրները տևել են մի քանի շաբաթ',
      'Հոգնածությունը խիստ ազդում է առօրյայի վրա',
      'Անքնությունը շարունակվում է՝ չնայած լավ սովորություններին',
    ],
    infoCard2Title: 'Նախապատրաստվել այս այցին',
    infoCard2Text: 'Գրանցել, թե որքան ժամանակ են տևել խնդիրները և ինչն է կարծես ազդում դրանց վրա, կարող է օգնել ձեր առողջապահության մասնագետին ավելի լավ ուղղորդել ձեզ:',
    tipTitle: 'Լավ է իմանալ',
    tipText: 'Քնի այս փոփոխությունները տարածված են և սովորաբար ժամանակավոր. դրանք չեն նշանակում, որ ինչ-որ բան այն չէ:',
    summaryPoints: [
      'Պրոգեստերոնը ունի թեթև հանգստացնող ազդեցություն. ցիկլի վերջում դրա անկումը կարող է խաթարել քունը:',
      'Դաշտանադադարի ժամանակ գիշերային քրտնարտադրությունը արթնանալու տարածված պատճառ է:',
      'Կայուն քնելու ռեժիմը և զով ննջարանը օգնում են սահմանափակել այս խանգարումները՝ ցանկացած տարիքում:',
      'Շարունակական քնի խնդիրներն արժե քննարկել առողջապահության մասնագետի հետ:',
    ],
    disclaimerText: 'Տեղեկատվական բովանդակություն: Այս հոդվածը չի փոխարինում անհատականացված բժշկական խորհրդատվությանը: Կասկածի դեպքում խորհուրդ հարցրեք առողջապահության մասնագետից:',
    shareMessage: 'Քուն և հորմոններ. քիչ հայտնի կապը — AWA',
  },
  tg: {
    badge: 'ДАВРАИ ҲАЙЗ • ХОБ',
    title: 'Хоб ва гормонҳо:\nпайванди кам маълум',
    metaDuration: '6 дақ барои хондан',
    metaType: 'Мақола',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Чаро хоби шумо вобаста ба марҳилаи давра ва дар менопауза тағйир меёбад.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Чаро гормонҳо ба хоб таъсир мерасонанд',
      'Хоб дар марҳилаҳои давра',
      'Стресс ва сифати хоб',
      'Тартиби оромбахши шом',
      'Кай ба мутахассис муроҷиат кардан лозим аст',
      'Хулосаҳои асосӣ',
    ],
    section1Body: 'Прогестерон таъсири сабуки оромкунанда дорад; паст шудани он дар охири давра метавонад хобро вайрон кунад, онро сабуктар ё пораҳо кунад.',
    infoCard1Title: 'Донистан хуб аст',
    infoCard1Text: 'Болоравии андаки ҳарорати бадан пас аз овуляция инчунин метавонад барои баъзеҳо хоб рафтанро андаке душвортар кунад.',
    phaseSleep: [
      {title: 'Ҳангоми ҳайз', text: 'Нороҳатии ҷисмонӣ ва хастагӣ метавонад хобро сабуктар кунад.'},
      {title: 'Дар атрофи овуляция', text: 'Хоб барои аксари одамон умуман устувортар аст.'},
      {title: 'Пеш аз ҳайз', text: 'Паст шудани прогестерон метавонад хобро сабуктар кунад, бо бедор шуданҳои имконпазир.'},
    ],
    section2Body: 'Дар менопауза арақи шабона сабаби маъмули бедор шудан аст, бо сабабҳои гормонии монанд.',
    section3Body: 'Стресс метавонад вайроншавии хобро дар марҳилаҳои аллакай ҳассостари давра афзоиш диҳад. Усулҳои оддии ором шудан (нафаскашӣ, кашиши нарм) метавонанд ба шумо кумак кунанд пеш аз хоб ором шавед.',
    section4Body: 'Тартиби собити хоб ва ҳуҷраи хунук ба маҳдуд кардани ин вайроншавӣ кумак мекунанд, дар ҳар синну сол.',
    eveningRoutine: [
      {title: 'Соатҳои мунтазам', text: 'Дар вақтҳои собит хобидан ва бедор шудан ба танзими соати дохилии шумо кумак мекунад.'},
      {title: 'Камтар экран дар шом', text: 'Нури кабуд метавонад хоб рафтанро ба таъхир андозад; танаффус аз экран ба ором шудан кумак мекунад.'},
      {title: 'Ҳуҷраи хунук', text: 'Ҳарорати мӯътадил хоб рафтанро дар ҳар синну сол осонтар мекунад.'},
    ],
    section5Body: 'Одатҳои хуб на ҳамеша кифоя мебошанд. Метавонад муфид бошад, ки бо мутахассис гап занед, агар:',
    warningTitle: 'Нишонаҳое, ки сазовори санҷиш мебошанд',
    consultSigns: [
      'Мушкилоти хоб чанд ҳафта давом кардаанд',
      'Хастагӣ ба ҳаёти ҳаррӯза қавӣ таъсир мерасонад',
      'Бехобӣ бо вуҷуди одатҳои хуб идома меёбад',
    ],
    infoCard2Title: 'Омодагӣ ба ин қабул',
    infoCard2Text: 'Қайд кардани он ки мушкилот чанд вақт давом кардаанд ва чӣ ба онҳо таъсир мерасонад, ба мутахассиси соҳаи тиби шумо кумак мекунад шуморо беҳтар роҳнамоӣ кунад.',
    tipTitle: 'Донистан хуб аст',
    tipText: 'Ин тағйироти хоб маъмул ва одатан муваққатианд: онҳо маънои нодурустии чизеро надоранд.',
    summaryPoints: [
      'Прогестерон таъсири сабуки оромкунанда дорад; паст шудани он дар охири давра метавонад хобро вайрон кунад.',
      'Дар менопауза арақи шабона сабаби маъмули бедор шудан аст.',
      'Тартиби собити хоб ва ҳуҷраи хунук ба маҳдуд кардани ин вайроншавӣ кумак мекунанд, дар ҳар синну сол.',
      'Мушкилоти доимии хоб сазоворанд, ки бо мутахассиси соҳаи тиб муҳокима шаванд.',
    ],
    disclaimerText: 'Мазмуни иттилоотӣ. Ин мақола маслиҳати шахсии тиббиро иваз намекунад. Дар сурати шубҳа аз мутахассиси соҳаи тиб роҳнамоӣ пурсед.',
    shareMessage: 'Хоб ва гормонҳо: пайванди кам маълум — AWA',
  },
  ky: {
    badge: 'ЕТЕК КИРИМ ЦИКЛИ • УЙКУ',
    title: 'Уйку жана гормондор:\nаз белгилүү байланыш',
    metaDuration: '6 мүн окуу',
    metaType: 'Макала',
    metaLevel: 'Баштоочу',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Уйкуңуз цикл фазасына жараша жана менопаузада эмне үчүн өзгөрөт.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Гормондор уйкуга эмне үчүн таасир этет',
      'Циклдин фазалары боюнча уйку',
      'Стресс жана уйкунун сапаты',
      'Тынчтандыруучу кечки тартип',
      'Адис менен качан кеңешүү керек',
      'Негизги жыйынтыктар',
    ],
    section1Body: 'Прогестерон жумшак тынчтандыруучу таасирге ээ; анын цикл аякташында азайышы уйкуну бузуп, аны жеңилирээк же бөлүнүп-жарылган кылышы мүмкүн.',
    infoCard1Title: 'Билүү пайдалуу',
    infoCard1Text: 'Овуляциядан кийинки дене температурасынын бир аз көтөрүлүшү айрым адамдарда уктап кетүүнү бир аз кыйындатышы мүмкүн.',
    phaseSleep: [
      {title: 'Етек кирим учурунда', text: 'Физикалык ыңгайсыздык жана чарчоо уйкуну жеңилирээк кылышы мүмкүн.'},
      {title: 'Овуляциянын тегерегинде', text: 'Уйку көпчүлүк адамдарда жалпысынан туруктуураак.'},
      {title: 'Етек киримдин алдында', text: 'Прогестерондун азайышы уйкуну жеңилирээк кылып, ойгонууларга алып келиши мүмкүн.'},
    ],
    section2Body: 'Менопаузада түнкү тердөө ойгонуунун кеңири таралган себеби, окшош гормондук себептерден улам.',
    section3Body: 'Стресс циклдин буга чейин эле сезгичирээк фазаларында уйкудагы бузулууларды күчөтүшү мүмкүн. Жөнөкөй бошоңдоо ыкмалары (дем алуу, жумшак чоюлуу) уктоодон мурун тынчтанууга жардам бере алат.',
    section4Body: 'Туруктуу уктоо тартиби жана салкын уктоочу бөлмө бул бузулууларды ар кандай жашта чектөөгө жардам берет.',
    eveningRoutine: [
      {title: 'Үзгүлтүксүз саат', text: 'Туруктуу убакта уктоо жана ойгонуу ички саатыңызды жөнгө салууга жардам берет.'},
      {title: 'Кечинде азыраак экран', text: 'Көк жарык уктап кетүүнү кечиктириши мүмкүн; экрандан тыныгуу тынчтанууга жардам берет.'},
      {title: 'Салкын уктоочу бөлмө', text: 'Орточо температура ар кандай жашта уктап кетүүнү жеңилдетет.'},
    ],
    section5Body: 'Жакшы адаттар ар дайым жетиштүү боло бербейт. Төмөнкү учурларда адис менен сүйлөшүү пайдалуу болушу мүмкүн:',
    warningTitle: 'Текшерүүгө татыктуу белгилер',
    consultSigns: [
      'Уйку көйгөйлөрү бир нече жума созулду',
      'Чарчоо күнүмдүк жашоого катуу таасир этүүдө',
      'Жакшы адаттарга карабастан уйкусуздук улана берүүдө',
    ],
    infoCard2Title: 'Бул кабыл алууга даярдануу',
    infoCard2Text: 'Көйгөйлөр канча убакыт созулганын жана аларга эмне таасир этип жаткандай көрүнөрүн жазып коюу ден соолук сактоо адисине сизге жакшыраак багыт берүүгө жардам бериши мүмкүн.',
    tipTitle: 'Билүү пайдалуу',
    tipText: 'Бул уйку өзгөрүүлөрү кеңири таралган жана адатта убактылуу: алар бир нерсе туура эмес дегенди билдирбейт.',
    summaryPoints: [
      'Прогестерон жумшак тынчтандыруучу таасирге ээ; анын цикл аякташында азайышы уйкуну бузушу мүмкүн.',
      'Менопаузада түнкү тердөө ойгонуунун кеңири таралган себеби.',
      'Туруктуу уктоо тартиби жана салкын уктоочу бөлмө бул бузулууларды ар кандай жашта чектөөгө жардам берет.',
      'Улана берген уйку көйгөйлөрүн ден соолук сактоо адиси менен талкуулоого татыйт.',
    ],
    disclaimerText: 'Маалымат берүүчү мазмун. Бул макала жекелештирилген медициналык кеңешти алмаштырбайт. Күмөн болсо, ден соолук сактоо адисинен кеңеш сураңыз.',
    shareMessage: 'Уйку жана гормондор: аз белгилүү байланыш — AWA',
  },
  tk: {
    badge: 'AÝBAŞY SIKLI • UKY',
    title: 'Uky we gormonlar:\nazbilinýän baglanyşyk',
    metaDuration: '6 min okamak',
    metaType: 'Makala',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Barlanan mazmun',
    intro: 'Ukyňyzyň sikl tapgyryňyza görä we menopauzada näme üçin üýtgeýändigi.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Gormonlar ukyna näme üçin täsir edýär',
      'Sikliň tapgyrlarynda uky',
      'Stres we uky hili',
      'Köňül rahatlandyryjy agşam tertibi',
      'Hünärmene haçan ýüz tutmaly',
      'Esasy netijeler',
    ],
    section1Body: 'Progesteron ýeňil rahatlandyryjy täsire eýe; onuň sikliň ahyrynda peselmegi ukyny bozup, ony ýeňilleşdirip ýa-da bölek-bölek edip biler.',
    infoCard1Title: 'Bilmek peýdaly',
    infoCard1Text: 'Ovulýasiýadan soň beden temperaturasynyň az-kem ýokarlanmagy käbir adamlar üçin uklamagy az-kem kynlaşdyryp biler.',
    phaseSleep: [
      {title: 'Aýbaşy wagtynda', text: 'Fiziki biynjalyk we ýadawlyk ukyny ýeňilleşdirip biler.'},
      {title: 'Ovulýasiýa töwereginde', text: 'Uky aglaba adamlar üçin umuman has durnukly.'},
      {title: 'Aýbaşydan öň', text: 'Progesteronyň peselmegi ukyny ýeňilleşdirip, mümkin oýanmalara sebäp bolup biler.'},
    ],
    section2Body: 'Menopauzada gijeki derlemek meňzeş gormonal sebäplere görä oýanmagyň umumy sebäbi.',
    section3Body: 'Stres sikliň eýýäm has duýgur tapgyrlarynda uky bozulmalaryny güýçlendirip biler. Ýönekeý rahatlanma usullary (dem alyş, ýumşak uzaltmak) ýatmazdan öň dynç almaga kömek edip biler.',
    section4Body: 'Durnukly ýatmak tertibi we salkyn otag islendik ýaşda bu bozulmalary çäklemäge kömek edýär.',
    eveningRoutine: [
      {title: 'Yzygiderli sagatlar', text: 'Durnukly wagtlarda ýatmak we oýanmak içki sagadyňyzy sazlamaga kömek edýär.'},
      {title: 'Agşam az ekran wagty', text: 'Gök ýagtylyk uklamagy gijikdirip biler; ekran arakesmesi dynç almaga kömek edýär.'},
      {title: 'Salkyn otag', text: 'Ortaça temperatura islendik ýaşda uklamagy aňsatlaşdyrýar.'},
    ],
    section5Body: 'Gowy endikler hemişe ýeterlik däl. Şu ýagdaýlarda hünärmen bilen gürleşmek peýdaly bolup biler:',
    warningTitle: 'Barlatmaga mynasyp alamatlar',
    consultSigns: [
      'Uky kynçylyklary birnäçe hepde dowam etdi',
      'Ýadawlyk gündelik durmuşa güýçli täsir edýär',
      'Uky ýoklugy gowy endiklere garamazdan dowam edýär',
    ],
    infoCard2Title: 'Bu kabul edişe taýýarlanmak',
    infoCard2Text: 'Kynçylyklaryň näçe wagt dowam edendigini we olara näme täsir edýän ýaly görünýändigini bellemek saglyk hünärmeniňize sizi has gowy ugrukdyrmaga kömek edip biler.',
    tipTitle: 'Bilmek peýdaly',
    tipText: 'Bu uky üýtgeşmeleri umumy we adatça wagtlaýyn: olar nämedir bir zadyň nädogrydygyny aňlatmaýar.',
    summaryPoints: [
      'Progesteron ýeňil rahatlandyryjy täsire eýe; onuň sikliň ahyrynda peselmegi ukyny bozup biler.',
      'Menopauzada gijeki derlemek oýanmagyň umumy sebäbi.',
      'Durnukly ýatmak tertibi we salkyn otag islendik ýaşda bu bozulmalary çäklemäge kömek edýär.',
      'Dowamly uky kynçylyklary saglyk hünärmeni bilen gürleşmäge mynasyp.',
    ],
    disclaimerText: 'Maglumat berýän mazmun. Bu makala şahsylaşdyrylan lukmançylyk maslahatyny çalyşmaýar. Şübhe bolsa, saglyk hünärmeninden ugrukdyrma soraň.',
    shareMessage: 'Uky we gormonlar: azbilinýän baglanyşyk — AWA',
  },
  ms: {
    badge: 'KITARAN HAID • TIDUR',
    title: 'Tidur dan hormon:\nkaitan yang kurang diketahui',
    metaDuration: '6 min bacaan',
    metaType: 'Artikel',
    metaLevel: 'Permulaan',
    metaValidated: 'Kandungan disemak',
    intro: 'Mengapa tidur anda berubah bergantung pada fasa kitaran anda, dan semasa menopaus.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Mengapa hormon mempengaruhi tidur',
      'Tidur merentasi fasa kitaran',
      'Tekanan dan kualiti tidur',
      'Rutin petang yang menenangkan',
      'Bila untuk berjumpa pengamal profesional',
      'Perkara penting untuk diingat',
    ],
    section1Body: 'Progesteron mempunyai kesan sedatif yang ringan; penurunannya pada penghujung kitaran boleh mengganggu tidur, menjadikannya lebih ringan atau lebih berpecah-pecah.',
    infoCard1Title: 'Elok diketahui',
    infoCard1Text: 'Kenaikan sedikit suhu badan selepas ovulasi juga boleh menjadikan tidur sedikit lebih sukar bagi sesetengah orang.',
    phaseSleep: [
      {title: 'Semasa haid anda', text: 'Ketidakselesaan fizikal dan keletihan boleh menjadikan tidur lebih ringan.'},
      {title: 'Sekitar ovulasi', text: 'Tidur biasanya lebih stabil bagi kebanyakan orang.'},
      {title: 'Sebelum haid anda', text: 'Penurunan progesteron boleh menjadikan tidur lebih ringan, dengan kemungkinan terjaga.'},
    ],
    section2Body: 'Semasa menopaus, berpeluh malam ialah punca lazim terjaga, atas sebab hormon yang serupa.',
    section3Body: 'Tekanan boleh menguatkan gangguan tidur semasa fasa kitaran yang sudah lebih sensitif. Teknik relaksasi yang mudah (pernafasan, regangan lembut) boleh membantu anda bersantai sebelum tidur.',
    section4Body: 'Rutin waktu tidur yang stabil dan bilik tidur yang sejuk membantu mengehadkan gangguan ini, pada sebarang umur.',
    eveningRoutine: [
      {title: 'Waktu yang tetap', text: 'Tidur dan bangun pada waktu yang stabil membantu mengawal jam dalaman anda.'},
      {title: 'Kurang masa skrin pada waktu petang', text: 'Cahaya biru boleh melewatkan tidur; rehat daripada skrin membantu anda bertenang.'},
      {title: 'Bilik tidur yang sejuk', text: 'Suhu yang sederhana memudahkan tidur, pada sebarang umur.'},
    ],
    section5Body: 'Tabiat yang baik tidak selalunya mencukupi. Ia boleh membantu untuk berbincang dengan pengamal profesional jika:',
    warningTitle: 'Tanda yang wajar diperiksa',
    consultSigns: [
      'Masalah tidur telah berlarutan selama beberapa minggu',
      'Keletihan sangat menjejaskan kehidupan seharian',
      'Insomnia berterusan walaupun dengan tabiat yang baik',
    ],
    infoCard2Title: 'Bersedia untuk temu janji ini',
    infoCard2Text: 'Mencatat berapa lama masalah itu berlarutan dan apa yang nampaknya mempengaruhinya boleh membantu pengamal penjagaan kesihatan anda membimbing anda dengan lebih baik.',
    tipTitle: 'Elok diketahui',
    tipText: 'Perubahan tidur ini lazim dan biasanya bersifat sementara: ia tidak bermakna ada sesuatu yang tidak kena.',
    summaryPoints: [
      'Progesteron mempunyai kesan sedatif yang ringan; penurunannya pada penghujung kitaran boleh mengganggu tidur.',
      'Semasa menopaus, berpeluh malam ialah punca lazim terjaga.',
      'Rutin waktu tidur yang stabil dan bilik tidur yang sejuk membantu mengehadkan gangguan ini, pada sebarang umur.',
      'Masalah tidur yang berterusan wajar dibincangkan dengan pengamal penjagaan kesihatan.',
    ],
    disclaimerText: 'Kandungan bersifat maklumat. Artikel ini tidak menggantikan nasihat perubatan yang diperibadikan. Jika ragu-ragu, dapatkan panduan daripada pengamal penjagaan kesihatan.',
    shareMessage: 'Tidur dan hormon: kaitan yang kurang diketahui — AWA',
  },
  so: {
    badge: 'WAREEGGA CAADADA • HURDO',
    title: 'Hurdo iyo hormoonno:\nxiriirka aan la aqoon',
    metaDuration: '6 daq akhris',
    metaType: 'Maqaal',
    metaLevel: 'Bilow',
    metaValidated: 'Macluumaad la dib-u-eegay',
    intro: 'Sababta hurdadaadu u isbeddesho iyadoo ku xiran marxaladda wareeggaaga, iyo menopause.',
    contentsTitle: 'Maqaalkan dhexdiisa',
    topics: [
      'Sababta hormoonnadu u saameeyaan hurdada',
      'Hurdo marxaladaha wareegga',
      'Walaac iyo tayada hurdada',
      'Nidaam habeen oo nasteexo leh',
      'Goorta xirfadle la arko',
      'Qodobbada muhiimka ah',
    ],
    section1Body: 'Progesterone wuxuu leeyahay saameyn jilicsan oo hurdo-keenaa; hoos u dhaciisa dhammaadka wareegga ayaa carqaladayn kara hurdada, isagoo ka dhigaya mid fudud ama kala go’an.',
    infoCard1Title: 'Waxtar leh in la ogaado',
    infoCard1Text: 'Kor u kaca yar ee heerkulka jidhka ukun-sii-deynta ka dib ayaa sidoo kale ka dhigi kara hurdo-qaadashada mid xoogaa ka adag dadka qaarkood.',
    phaseSleep: [
      {title: 'Inta caadadaadu jirto', text: 'Raaxo-darro jidheed iyo daal ayaa hurdada ka dhigi kara mid fudud.'},
      {title: 'Ku dhawaad ukun-sii-deynta', text: 'Hurdadu guud ahaan waa ka degan tahay dadka badankooda.'},
      {title: 'Caadada ka hor', text: 'Hoos u dhaca progesterone wuxuu hurdada ka dhigi karaa mid fudud, iyadoo ay suurtagal tahay soo-toosid.'},
    ],
    section2Body: 'Menopause, dhididka habeenkii waa sabab caadi ah oo soo-toosidda, sababo hormoon oo isku mid ah awgeed.',
    section3Body: 'Walaacu wuxuu kordhin karaa carqaladaynta hurdada marxaladaha wareegga ee horey u ka dareen badan. Farsamooyin nasasho oo fudud (neefsasho, kala-qaadid jilicsan) ayaa kaa caawin kara inaad is nasiso ka hor seexashada.',
    section4Body: 'Nidaam habeen oo degan iyo qol qabow ayaa caawisa xaddidaadda carqaladaynta, da’ kasta.',
    eveningRoutine: [
      {title: 'Saacado joogto ah', text: 'Seexashada iyo toosidda waqtiyo degan ayaa caawisa nidaaminta saacadda gudaha.'},
      {title: 'Shaashad yar habeenkii', text: 'Iftiinka buluugga ah wuu daahin karaa hurdo-qaadashada; nasashada shaashadda ayaa kaa caawisa inaad is nasiso.'},
      {title: 'Qol qabow', text: 'Heerkul dhexdhexaad ah ayaa fududeeya hurdo-qaadashada, da’ kasta.'},
    ],
    section5Body: 'Caadooyin wanaagsan mar walba kuma filna. Waxay faa’iido yeelan kartaa in lala hadlo xirfadle haddii:',
    warningTitle: 'Calaamado mudan in la hubiyo',
    consultSigns: [
      'Dhibaatooyinka hurdadu way socdeen dhowr toddobaad',
      'Daalku si xoog leh u saameeyo nolol-maalmeedka',
      'Hurdo la’aanta sii socota inkasta oo caadooyin wanaagsan jiraan',
    ],
    infoCard2Title: 'U diyaargarowga ballankan',
    infoCard2Text: 'Xusidda intee in le’eg ayay dhibaatooyinku jireen iyo waxa u muuqda inay saameeyaan ayaa caawin karta xirfadlaha caafimaadka inuu si wanaagsan kuu hago.',
    tipTitle: 'Waxtar leh in la ogaado',
    tipText: 'Isbeddeladan hurdadu waa caadi inta badan waana ku meel gaar: macnaheedu maaha in wax khalad ah jiraan.',
    summaryPoints: [
      'Progesterone wuxuu leeyahay saameyn jilicsan oo hurdo-keenaa; hoos u dhaciisa dhammaadka wareegga ayaa carqaladayn kara hurdada.',
      'Menopause, dhididka habeenkii waa sabab caadi ah oo soo-toosidda.',
      'Nidaam habeen oo degan iyo qol qabow ayaa caawisa xaddidaadda carqaladaynta, da’ kasta.',
      'Dhibaatooyinka hurdada ee sii socda waxay mudan yihiin in lala hadlo xirfadle caafimaad.',
    ],
    disclaimerText: 'Macluumaad. Maqaalkan ma beddelo talo caafimaad oo shakhsi ah. Haddii aad shaki qabto, hel hagid xirfadle caafimaad.',
    shareMessage: 'Hurdo iyo hormoonno: xiriirka aan la aqoon — AWA',
  },
  sw: {
    badge: 'MZUNGUKO WA HEDHI • USINGIZI',
    title: 'Usingizi na homoni:\nuhusiano usiojulikana sana',
    metaDuration: 'Dakika 6 za kusoma',
    metaType: 'Makala',
    metaLevel: 'Mwanzo',
    metaValidated: 'Maudhui yaliyokaguliwa',
    intro: 'Kwa nini usingizi wako hubadilika kulingana na awamu ya mzunguko wako, na wakati wa kukoma hedhi.',
    contentsTitle: 'Katika makala hii',
    topics: [
      'Kwa nini homoni huathiri usingizi',
      'Usingizi katika awamu za mzunguko',
      'Msongo wa mawazo na ubora wa usingizi',
      'Utaratibu wa jioni unaotuliza',
      'Wakati wa kumwona mtaalamu',
      'Mambo muhimu ya kukumbuka',
    ],
    section1Body: 'Projesteroni ina athari hafifu ya kutuliza; kushuka kwake mwishoni mwa mzunguko kunaweza kuvuruga usingizi, na kuufanya kuwa mwepesi zaidi au wenye vipande vipande.',
    infoCard1Title: 'Vyema kujua',
    infoCard1Text: 'Ongezeko dogo la joto la mwili baada ya utoaji wa yai pia linaweza kufanya kupata usingizi kuwa vigumu kidogo kwa baadhi ya watu.',
    phaseSleep: [
      {title: 'Wakati wa hedhi yako', text: 'Usumbufu wa mwili na uchovu vinaweza kufanya usingizi kuwa mwepesi zaidi.'},
      {title: 'Karibu na utoaji wa yai', text: 'Usingizi kwa ujumla ni thabiti zaidi kwa watu wengi.'},
      {title: 'Kabla ya hedhi yako', text: 'Kushuka kwa projesteroni kunaweza kufanya usingizi kuwa mwepesi zaidi, na kuamka kunakowezekana.'},
    ],
    section2Body: 'Wakati wa kukoma hedhi, kutokwa jasho usiku ni sababu ya kawaida ya kuamka, kwa sababu zinazofanana za homoni.',
    section3Body: 'Msongo wa mawazo unaweza kuongeza usumbufu wa usingizi wakati wa awamu za mzunguko ambazo tayari ni nyeti zaidi. Mbinu rahisi za kutuliza (kupumua, kunyoosha mwili kwa upole) zinaweza kukusaidia kutulia kabla ya kulala.',
    section4Body: 'Utaratibu thabiti wa wakati wa kulala na chumba cha kulala chenye ubaridi vinasaidia kupunguza usumbufu huu, katika umri wowote.',
    eveningRoutine: [
      {title: 'Saa za mpangilio', text: 'Kwenda kulala na kuamka kwa nyakati thabiti kunasaidia kudhibiti saa yako ya ndani.'},
      {title: 'Muda mdogo wa skrini jioni', text: 'Mwanga wa buluu unaweza kuchelewesha kupata usingizi; mapumziko ya skrini yanakusaidia kutulia.'},
      {title: 'Chumba chenye ubaridi', text: 'Joto la wastani linarahisisha kupata usingizi, katika umri wowote.'},
    ],
    section5Body: 'Tabia nzuri hazitoshi kila wakati. Inaweza kusaidia kuzungumza na mtaalamu ikiwa:',
    warningTitle: 'Dalili zinazostahili kukaguliwa',
    consultSigns: [
      'Matatizo ya usingizi yamedumu kwa wiki kadhaa',
      'Uchovu unaathiri sana maisha ya kila siku',
      'Kukosa usingizi kunaendelea licha ya tabia nzuri',
    ],
    infoCard2Title: 'Kujiandaa kwa miadi hii',
    infoCard2Text: 'Kuandika muda matatizo yamedumu na kinachoonekana kuyaathiri kunaweza kumsaidia mtaalamu wako wa afya kukuongoza vizuri zaidi.',
    tipTitle: 'Vyema kujua',
    tipText: 'Mabadiliko haya ya usingizi ni ya kawaida na kwa kawaida ni ya muda: hayamaanishi kuna tatizo.',
    summaryPoints: [
      'Projesteroni ina athari hafifu ya kutuliza; kushuka kwake mwishoni mwa mzunguko kunaweza kuvuruga usingizi.',
      'Wakati wa kukoma hedhi, kutokwa jasho usiku ni sababu ya kawaida ya kuamka.',
      'Utaratibu thabiti wa wakati wa kulala na chumba cha kulala chenye ubaridi vinasaidia kupunguza usumbufu huu, katika umri wowote.',
      'Matatizo ya usingizi ya kuendelea yanastahili kujadiliwa na mtaalamu wa afya.',
    ],
    disclaimerText: 'Maudhui ya taarifa. Makala hii haichukui nafasi ya ushauri wa kitabibu uliobinafsishwa. Ukiwa na shaka, tafuta mwongozo wa mtaalamu wa afya.',
    shareMessage: 'Usingizi na homoni: uhusiano usiojulikana sana — AWA',
  },
  kk: {
    badge: 'ЕТЕККІР ЦИКЛІ • ҰЙҚЫ',
    title: 'Ұйқы және гормондар:\nаз белгілі байланыс',
    metaDuration: '6 мин оқу',
    metaType: 'Мақала',
    metaLevel: 'Бастауыш',
    metaValidated: 'Тексерілген мазмұн',
    intro: 'Ұйқыңыз цикл фазасына қарай және менопауза кезінде неге өзгереді.',
    contentsTitle: 'Осы мақалада',
    topics: [
      'Гормондар ұйқыға неге әсер етеді',
      'Цикл фазаларындағы ұйқы',
      'Күйзеліс және ұйқы сапасы',
      'Тыныштандыратын кешкі тәртіп',
      'Маманға қашан бару керек',
      'Негізгі қорытындылар',
    ],
    section1Body: 'Прогестеронның жеңіл седативті әсері бар; оның цикл соңындағы төмендеуі ұйқыны бұзып, жеңілірек немесе үзіліп-үзіліп ете алады.',
    infoCard1Title: 'Білуге тиісті',
    infoCard1Text: 'Овуляциядан кейінгі дене температурасының шамалы көтерілуі кейбір адамдарда ұйықтап кетуді сәл қиындатуы да мүмкін.',
    phaseSleep: [
      {title: 'Етеккір кезінде', text: 'Дене жайсыздығы мен шаршау ұйқыны жеңілірек ете алады.'},
      {title: 'Овуляцияның айналасында', text: 'Ұйқы көпшілікте әдетте тұрақтырақ болады.'},
      {title: 'Етеккірдің алдында', text: 'Прогестеронның төмендеуі ұйқыны жеңілірек етіп, ояну мүмкін болады.'},
    ],
    section2Body: 'Менопауза кезінде түнгі терлеу ұқсас гормондық себептерден оянудың жиі себебі болып табылады.',
    section3Body: 'Күйзеліс цикльдің қазірдің өзінде сезімтал фазаларында ұйқы бұзылыстарын күшейте алады. Қарапайым босаңсу техникалары (тыныс алу, жұмсақ созылу) ұйықтар алдында тынышталуға көмектесе алады.',
    section4Body: 'Тұрақты ұйықтар алдындағы тәртіп және салқын жатын бөлме бұл бұзылыстарды кез келген жаста шектеуге көмектеседі.',
    eveningRoutine: [
      {title: 'Тұрақты сағаттар', text: 'Тұрақты уақытта ұйықтап, ояну ішкі сағатыңызды реттеуге көмектеседі.'},
      {title: 'Кешке экран уақытын азайту', text: 'Көк жарық ұйықтап кетуді кешіктіруі мүмкін; экраннан үзіліс тынышталуға көмектеседі.'},
      {title: 'Салқын жатын бөлме', text: 'Орташа температура кез келген жаста ұйықтап кетуді жеңілдетеді.'},
    ],
    section5Body: 'Жақсы әдеттер әрқашан жеткіліксіз. Мына жағдайда маманмен сөйлесу пайдалы болуы мүмкін:',
    warningTitle: 'Тексерген жөн белгілер',
    consultSigns: [
      'Ұйқы проблемалары бірнеше апта бойы созылды',
      'Шаршау күнделікті өмірге қатты әсер етеді',
      'Жақсы әдеттерге қарамастан ұйқысыздық сақталады',
    ],
    infoCard2Title: 'Осы қабылдауға дайындалу',
    infoCard2Text: 'Проблемалардың қанша уақыт созылғанын және оларға не әсер ететіндей көрінетінін жазып қою медицина маманыңызға сізді жақсырақ бағыттауға көмектесе алады.',
    tipTitle: 'Білуге тиісті',
    tipText: 'Бұл ұйқы өзгерістері жиі кездеседі және әдетте уақытша: олар бірдеңенің дұрыс емес екенін білдірмейді.',
    summaryPoints: [
      'Прогестеронның жеңіл седативті әсері бар; оның цикл соңындағы төмендеуі ұйқыны бұзуы мүмкін.',
      'Менопауза кезінде түнгі терлеу оянудың жиі себебі болып табылады.',
      'Тұрақты ұйықтар алдындағы тәртіп және салқын жатын бөлме бұл бұзылыстарды кез келген жаста шектеуге көмектеседі.',
      'Тұрақты ұйқы проблемаларын медицина маманымен талқылаған жөн.',
    ],
    disclaimerText: 'Ақпараттық мазмұн. Бұл мақала жекелендірілген медициналық кеңестің орнын баспайды. Күмән туындаса, медицина маманынан бағыт сұраңыз.',
    shareMessage: 'Ұйқы және гормондар: аз белгілі байланыс — AWA',
  },
  wo: {
    badge: 'WËRSËGU WEER • NELAW',
    title: 'Nelaw ak hormon:\njokkoo bu xamuñu lu bari',
    metaDuration: '6 simili jàng',
    metaType: 'Bind',
    metaLevel: 'Tàmbali',
    metaValidated: 'Mbind bu ñu seetlu',
    intro: 'Lu tax sa nelaw di soppiku ci jamonoy sa wërsëg, ak ci menopoos.',
    contentsTitle: 'Ci bind bii',
    topics: [
      'Lu tax hormon di jëm ci nelaw',
      'Nelaw ci jamono yu wërsëg bi',
      'Coono ak kàttanu nelaw',
      'Benn yoon bu dal ci reer',
      'Kañ ngay wax ak benn liggéeykat',
      'Li am solo',
    ],
    section1Body: 'Progesteron am na jëf bu lewet bu nelawal; wàññiku ci jeexu wërsëg bi mën na ñaawal nelaw, mu def ko lewet walla tasaare ko.',
    infoCard1Title: 'Lu baax a xam',
    infoCard1Text: 'Yokkute bu ndaw ci tàngooru yaram ginnaaw ovilasiyoŋ mën na def jafe a nelaw ci yenn nit.',
    phaseSleep: [
      {title: 'Ci sa règle', text: 'Jafe ci yaram ak sonn mën nañu def nelaw bi nekk lewet.'},
      {title: 'Ci wetu ovilasiyoŋ', text: 'Nelaw daa sax ci ñépp.'},
      {title: 'Balaa sa règle', text: 'Wàññiku progesteron mën na def nelaw bi lewet, ak yewu yu mën a am.'},
    ],
    section2Body: 'Ci menopoos, takkal guddi mooy sabab bu bari ci yewu, ngir ay sabab yu hormon yu mel ni.',
    section3Body: 'Coono mën na yokk jafe-jafe ci nelaw ci jamono yu wërsëg bi yu ñàkk dëgër. Ay anam yu yomb yu noppalu (noppiku, xëtt bu lewet) mën nañu dimbli nga noppalu balaa nelaw.',
    section4Body: 'Benn yoon bu sax balaa nelaw ak néeg bu sedd dañuy dimbli wàññi jafe-jafe yii, ci at bu nekk.',
    eveningRoutine: [
      {title: 'Waxtu yu sax', text: 'Dem nelaw te yewu ci waxtu yu sax dafay dimbli yor sa waxtu bu biir.'},
      {title: 'Wàññi ekraŋ ci reer', text: 'Leer bu bleu mën na yeexal nelaw; noppalu ci ekraŋ dafay dimbli nga dal.'},
      {title: 'Néeg bu sedd', text: 'Tàngoor bu digg-dóomu dafay yombal nelaw, ci at bu nekk.'},
    ],
    section5Body: 'Yoon yu baax duñu doy saa su ne. Mën na dimbli nga wax ak benn liggéeykat bu:',
    warningTitle: 'Màndarga yu baax a seet',
    consultSigns: [
      'Jafe-jafe ci nelaw yàgg nañu ay ayu-bés',
      'Sonn dafay jëm lool ci dund bu bés',
      'Ñàkk nelaw des na ak yoon yu baax',
    ],
    infoCard2Title: 'Waajal ndaje bii',
    infoCard2Text: 'Bind diir bi jafe-jafe yi yàgg ak li mel ni mooy ko jëm mën na dimbli sa liggéeykatu wér mu gën a jëmal la.',
    tipTitle: 'Lu baax a xam',
    tipText: 'Soppi yii ci nelaw dañu bari te daa gàtt: duñu wone ne lenn du jub.',
    summaryPoints: [
      'Progesteron am na jëf bu lewet bu nelawal; wàññiku ci jeexu wërsëg bi mën na ñaawal nelaw.',
      'Ci menopoos, takkal guddi mooy sabab bu bari ci yewu.',
      'Benn yoon bu sax balaa nelaw ak néeg bu sedd dañuy dimbli wàññi jafe-jafe yii, ci at bu nekk.',
      'Jafe-jafe yu sax ci nelaw baax na ñu leen waxtaan ak benn liggéeykatu wér.',
    ],
    disclaimerText: 'Mbind ngir xibaar. Bind bii du wuutu ndigalu doktoor bu sa bopp. Bu am nga xel-ñaar, laajal benn liggéeykatu wér.',
    shareMessage: 'Nelaw ak hormon: jokkoo bu xamuñu lu bari — AWA',
  },
  ha: {
    badge: 'ZAGAYEN HAILA • BARCI',
    title: 'Barci da hormone:\nalaƙar da ba a sani sosai ba',
    metaDuration: 'karatun minti 6',
    metaType: 'Labari',
    metaLevel: 'Mafari',
    metaValidated: 'Abun da aka duba',
    intro: 'Dalilin da ya sa barcinki ke canzawa bisa matakin zagayenki, da lokacin daina haila.',
    contentsTitle: 'A cikin wannan labari',
    topics: [
      'Dalilin da ya sa hormone ke shafar barci',
      'Barci a matakan zagaye',
      'Damuwa da ingancin barci',
      'Tsarin yamma mai kwantar da hankali',
      'Lokacin ganin ƙwararre',
      'Muhimman abubuwa',
    ],
    section1Body: 'Progesterone yana da tasiri mai kwantar da hankali; raguwarsa a ƙarshen zagaye na iya dagula barci, yana sa ya zama mai sauƙi ko mai yankewa.',
    infoCard1Title: 'Abin da ya dace a sani',
    infoCard1Text: 'Ɗan hawan zafin jiki bayan fitar ƙwai kuma na iya sa yin barci ya zama ɗan wuya ga wasu mutane.',
    phaseSleep: [
      {title: 'A lokacin hailarki', text: 'Rashin jin daɗin jiki da gajiya na iya sa barci ya zama mai sauƙi.'},
      {title: 'Kusa da fitar ƙwai', text: 'Barci yawanci ya fi tsayawa ga yawancin mutane.'},
      {title: 'Kafin hailarki', text: 'Raguwar progesterone na iya sa barci ya zama mai sauƙi, tare da yiwuwar farkawa.'},
    ],
    section2Body: 'Lokacin daina haila, gumin dare dalili ne gama gari na farkawa, saboda dalilan hormone irin wannan.',
    section3Body: 'Damuwa na iya ƙara dagulewar barci a matakan zagaye da suka riga suka fi hankali. Dabarun hutawa masu sauƙi (numfashi, miƙa jiki a hankali) na iya taimaka miki ki huta kafin kwanciya.',
    section4Body: 'Tsayayyen tsarin kwanciya da ɗaki mai sanyi suna taimakawa rage waɗannan dagulewa, a kowane shekaru.',
    eveningRoutine: [
      {title: 'Lokuta na yau da kullum', text: 'Kwanciya da tashi a lokuta tsayayyu yana taimakawa daidaita agogon cikinki.'},
      {title: 'Ƙarancin allo da yamma', text: 'Hasken shuɗi na iya jinkirta yin barci; hutu daga allo yana taimaka miki ki huta.'},
      {title: 'Ɗaki mai sanyi', text: 'Zafin jiki matsakaici yana sauƙaƙa yin barci, a kowane shekaru.'},
    ],
    section5Body: 'Dabi’u masu kyau ba koyaushe suke isa ba. Yana iya zama da amfani a yi magana da ƙwararre idan:',
    warningTitle: 'Alamomin da suka cancanci a duba',
    consultSigns: [
      'Matsalolin barci sun ɗauki makonni da dama',
      'Gajiya tana shafar rayuwar yau da kullum sosai',
      'Rashin barci yana dawwama duk da dabi’u masu kyau',
    ],
    infoCard2Title: 'Shirya wa wannan ganawa',
    infoCard2Text: 'Rubuta tsawon lokacin matsalolin da abin da ya yi kama da yana shafar su na iya taimaka wa ma’aikacin lafiyarki ya jagorance ki da kyau.',
    tipTitle: 'Abin da ya dace a sani',
    tipText: 'Waɗannan sauye-sauyen barci sun zama ruwan dare kuma yawanci na ɗan lokaci ne: ba sa nufin wani abu ba daidai ba ne.',
    summaryPoints: [
      'Progesterone yana da tasiri mai kwantar da hankali; raguwarsa a ƙarshen zagaye na iya dagula barci.',
      'Lokacin daina haila, gumin dare dalili ne gama gari na farkawa.',
      'Tsayayyen tsarin kwanciya da ɗaki mai sanyi suna taimakawa rage waɗannan dagulewa, a kowane shekaru.',
      'Matsalolin barci masu dawwama sun cancanci a tattauna su da ma’aikacin lafiya.',
    ],
    disclaimerText: 'Abun bayani. Wannan labari ba ya maye gurbin shawarar likita ta keɓaɓɓiya. Idan kina cikin shakka, nemi jagora daga ma’aikacin lafiya.',
    shareMessage: 'Barci da hormone: alaƙar da ba a sani sosai ba — AWA',
  },
  am: {
    badge: 'የወር አበባ ዑደት • እንቅልፍ',
    title: 'እንቅልፍ እና ሆርሞኖች፦\nብዙም የማይታወቀው ግንኙነት',
    metaDuration: '6 ደቂቃ ንባብ',
    metaType: 'ጽሑፍ',
    metaLevel: 'ጀማሪ',
    metaValidated: 'የተገመገመ ይዘት',
    intro: 'እንቅልፍሽ እንደ ዑደት ደረጃሽ እና በማረጥ ጊዜ ለምን እንደሚለወጥ።',
    contentsTitle: 'በዚህ ጽሑፍ ውስጥ',
    topics: [
      'ሆርሞኖች እንቅልፍን ለምን ይነካሉ',
      'በዑደቱ ደረጃዎች ውስጥ እንቅልፍ',
      'ጭንቀትና የእንቅልፍ ጥራት',
      'የሚያረጋጋ የምሽት ሥርዓት',
      'ባለሙያ መቼ ማየት',
      'ዋና ዋና ነጥቦች',
    ],
    section1Body: 'ፕሮጄስትሮን ቀላል የማስተኛ ተጽእኖ አለው፤ በዑደቱ መጨረሻ መውረዱ እንቅልፍን ሊያውክ፣ ቀለል ወይም የተቆራረጠ ሊያደርገው ይችላል።',
    infoCard1Title: 'ማወቅ ጠቃሚ ነው',
    infoCard1Text: 'ከእንቁላል መልቀቅ በኋላ የሰውነት ሙቀት ትንሽ መጨመር ለአንዳንድ ሰዎች እንቅልፍ መተኛትን ትንሽ ሊያከብድ ይችላል።',
    phaseSleep: [
      {title: 'በወር አበባሽ ጊዜ', text: 'አካላዊ ምቾት ማጣትና ድካም እንቅልፍን ቀለል ሊያደርጉ ይችላሉ።'},
      {title: 'እንቁላል መልቀቅ አካባቢ', text: 'እንቅልፍ ለአብዛኞቹ ሰዎች በአጠቃላይ ይበልጥ የተረጋጋ ነው።'},
      {title: 'ከወር አበባሽ በፊት', text: 'የፕሮጄስትሮን መውረድ እንቅልፍን ቀለል ሊያደርግ ይችላል፣ መንቃትም ሊኖር ይችላል።'},
    ],
    section2Body: 'በማረጥ ጊዜ የሌሊት ላብ ለመንቃት የተለመደ መንስኤ ነው፣ በተመሳሳይ የሆርሞን ምክንያቶች።',
    section3Body: 'ጭንቀት ቀድሞውኑ ይበልጥ ስሱ በሆኑ የዑደት ደረጃዎች የእንቅልፍ መዛባትን ሊያጎላ ይችላል። ቀላል የዘና ማለት ዘዴዎች (መተንፈስ፣ ለስላሳ መሳብ) ከመተኛትሽ በፊት ዘና እንድትዪ ሊረዱሽ ይችላሉ።',
    section4Body: 'የተረጋጋ የመኝታ ሰዓት ሥርዓት እና ቀዝቃዛ መኝታ ቤት እነዚህን መዛባቶች በማንኛውም ዕድሜ ለመገደብ ይረዳሉ።',
    eveningRoutine: [
      {title: 'መደበኛ ሰዓቶች', text: 'በተረጋጉ ሰዓቶች መተኛትና መንቃት የውስጥ ሰዓትሽን ለማስተካከል ይረዳል።'},
      {title: 'በምሽት ያነሰ የስክሪን ጊዜ', text: 'ሰማያዊ ብርሃን መተኛትን ሊያዘገይ ይችላል፤ ከስክሪን እረፍት ማድረግ ዘና እንድትዪ ይረዳል።'},
      {title: 'ቀዝቃዛ መኝታ ቤት', text: 'መካከለኛ ሙቀት በማንኛውም ዕድሜ መተኛትን ያቀልላል።'},
    ],
    section5Body: 'ጥሩ ልማዶች ሁልጊዜ በቂ አይደሉም። ከባለሙያ ጋር መነጋገር ሊረዳ የሚችለው፦',
    warningTitle: 'መመርመር የሚገባቸው ምልክቶች',
    consultSigns: [
      'የእንቅልፍ ችግሮች ለበርካታ ሳምንታት ቆይተዋል',
      'ድካም በዕለት ሕይወት ላይ በጣም ተጽእኖ እያሳደረ ነው',
      'ጥሩ ልማዶች ቢኖሩም እንቅልፍ ማጣት ይቀጥላል',
    ],
    infoCard2Title: 'ለዚህ ቀጠሮ መዘጋጀት',
    infoCard2Text: 'ችግሮቹ ለምን ያህል ጊዜ እንደቆዩ እና ምን እንደሚነካቸው የሚመስል መጻፍ የጤና ባለሙያሽ በተሻለ እንዲመራሽ ሊረዳ ይችላል።',
    tipTitle: 'ማወቅ ጠቃሚ ነው',
    tipText: 'እነዚህ የእንቅልፍ ለውጦች የተለመዱ እና ብዙውን ጊዜ ጊዜያዊ ናቸው፦ የሆነ ችግር አለ ማለት አይደሉም።',
    summaryPoints: [
      'ፕሮጄስትሮን ቀላል የማስተኛ ተጽእኖ አለው፤ በዑደቱ መጨረሻ መውረዱ እንቅልፍን ሊያውክ ይችላል።',
      'በማረጥ ጊዜ የሌሊት ላብ ለመንቃት የተለመደ መንስኤ ነው።',
      'የተረጋጋ የመኝታ ሰዓት ሥርዓት እና ቀዝቃዛ መኝታ ቤት እነዚህን መዛባቶች በማንኛውም ዕድሜ ለመገደብ ይረዳሉ።',
      'የሚቆዩ የእንቅልፍ ችግሮች ከጤና ባለሙያ ጋር መወያየት ተገቢ ናቸው።',
    ],
    disclaimerText: 'የመረጃ ይዘት። ይህ ጽሑፍ ግላዊ የሕክምና ምክርን አይተካም። ጥርጣሬ ካለሽ የጤና ባለሙያ መመሪያ ጠይቂ።',
    shareMessage: 'እንቅልፍ እና ሆርሞኖች፦ ብዙም የማይታወቀው ግንኙነት — AWA',
  },
  nl: {
    badge: 'MENSTRUATIECYCLUS • SLAAP',
    title: 'Slaap en hormonen:\nhet weinig bekende verband',
    metaDuration: '6 min lezen',
    metaType: 'Artikel',
    metaLevel: 'Beginner',
    metaValidated: 'Gecontroleerde inhoud',
    intro: 'Waarom je slaap verandert naargelang je cyclusfase, en in de overgang.',
    contentsTitle: 'In dit artikel',
    topics: [
      'Waarom hormonen de slaap beïnvloeden',
      'Slaap in de fasen van de cyclus',
      'Stress en slaapkwaliteit',
      'Een rustgevende avondroutine',
      'Wanneer een professional raadplegen',
      'Belangrijkste punten',
    ],
    section1Body: 'Progesteron heeft een licht kalmerend effect; de daling ervan aan het einde van de cyclus kan de slaap verstoren, waardoor die lichter of onderbroken wordt.',
    infoCard1Title: 'Goed om te weten',
    infoCard1Text: 'De lichte stijging van de lichaamstemperatuur na de eisprong kan het inslapen voor sommige mensen ook wat moeilijker maken.',
    phaseSleep: [
      {title: 'Tijdens je menstruatie', text: 'Lichamelijk ongemak en vermoeidheid kunnen de slaap lichter maken.'},
      {title: 'Rond de eisprong', text: 'De slaap is over het algemeen stabieler voor de meeste mensen.'},
      {title: 'Voor je menstruatie', text: 'De daling van progesteron kan de slaap lichter maken, met mogelijk wakker worden.'},
    ],
    section2Body: 'In de overgang zijn nachtelijk zweten een veelvoorkomende oorzaak van wakker worden, om vergelijkbare hormonale redenen.',
    section3Body: 'Stress kan slaapverstoringen versterken in fasen van de cyclus die al gevoeliger zijn. Eenvoudige ontspanningstechnieken (ademhaling, zachte rekoefeningen) kunnen je helpen tot rust te komen voor het slapengaan.',
    section4Body: 'Een vaste routine voor het slapengaan en een koele slaapkamer helpen deze verstoringen te beperken, op elke leeftijd.',
    eveningRoutine: [
      {title: 'Vaste tijden', text: 'Op vaste tijden naar bed gaan en opstaan helpt je biologische klok te regelen.'},
      {title: 'Minder schermtijd in de avond', text: 'Blauw licht kan het inslapen vertragen; een schermpauze helpt je tot rust te komen.'},
      {title: 'Een koele slaapkamer', text: 'Een gematigde temperatuur maakt het inslapen makkelijker, op elke leeftijd.'},
    ],
    section5Body: 'Goede gewoonten zijn niet altijd genoeg. Het kan nuttig zijn met een professional te praten als:',
    warningTitle: 'Tekenen die het waard zijn om te laten onderzoeken',
    consultSigns: [
      'Slaapproblemen al enkele weken aanhouden',
      'Vermoeidheid het dagelijks leven sterk beïnvloedt',
      'Slapeloosheid aanhoudt ondanks goede gewoonten',
    ],
    infoCard2Title: 'Deze afspraak voorbereiden',
    infoCard2Text: 'Noteren hoe lang de problemen duren en wat ze lijkt te beïnvloeden kan je zorgprofessional helpen je beter te begeleiden.',
    tipTitle: 'Goed om te weten',
    tipText: 'Deze slaapveranderingen komen vaak voor en zijn meestal tijdelijk: ze betekenen niet dat er iets mis is.',
    summaryPoints: [
      'Progesteron heeft een licht kalmerend effect; de daling ervan aan het einde van de cyclus kan de slaap verstoren.',
      'In de overgang zijn nachtelijk zweten een veelvoorkomende oorzaak van wakker worden.',
      'Een vaste routine voor het slapengaan en een koele slaapkamer helpen deze verstoringen te beperken, op elke leeftijd.',
      'Aanhoudende slaapproblemen zijn de moeite waard om met een zorgprofessional te bespreken.',
    ],
    disclaimerText: 'Informatieve inhoud. Dit artikel vervangt geen persoonlijk medisch advies. Bij twijfel, vraag begeleiding aan een zorgprofessional.',
    shareMessage: 'Slaap en hormonen: het weinig bekende verband — AWA',
  },
  fi: {
    badge: 'KUUKAUTISKIERTO • UNI',
    title: 'Uni ja hormonit:\nvähän tunnettu yhteys',
    metaDuration: '6 min lukuaika',
    metaType: 'Artikkeli',
    metaLevel: 'Aloittelija',
    metaValidated: 'Tarkistettu sisältö',
    intro: 'Miksi unesi muuttuu kiertosi vaiheen mukaan ja vaihdevuosissa.',
    contentsTitle: 'Tässä artikkelissa',
    topics: [
      'Miksi hormonit vaikuttavat uneen',
      'Uni kierron eri vaiheissa',
      'Stressi ja unen laatu',
      'Rauhoittava iltarutiini',
      'Milloin mennä ammattilaisen luo',
      'Tärkeimmät asiat',
    ],
    section1Body: 'Progesteronilla on lievä rauhoittava vaikutus; sen lasku kierron lopussa voi häiritä unta tehden siitä kevyempää tai katkonaisempaa.',
    infoCard1Title: 'Hyvä tietää',
    infoCard1Text: 'Kehon lämpötilan lievä nousu ovulaation jälkeen voi myös tehdä nukahtamisesta hieman vaikeampaa joillekin.',
    phaseSleep: [
      {title: 'Kuukautisten aikana', text: 'Fyysinen epämukavuus ja väsymys voivat tehdä unesta kevyempää.'},
      {title: 'Ovulaation tienoilla', text: 'Uni on yleensä vakaampaa useimmilla.'},
      {title: 'Ennen kuukautisia', text: 'Progesteronin lasku voi tehdä unesta kevyempää, ja heräämisiä voi esiintyä.'},
    ],
    section2Body: 'Vaihdevuosissa yöhikoilu on yleinen heräämisen syy samankaltaisista hormonaalisista syistä.',
    section3Body: 'Stressi voi voimistaa unen häiriöitä kierron vaiheissa, jotka ovat jo herkempiä. Yksinkertaiset rentoutumistekniikat (hengitys, lempeä venyttely) voivat auttaa rauhoittumaan ennen nukkumaanmenoa.',
    section4Body: 'Vakaa nukkumaanmenorutiini ja viileä makuuhuone auttavat rajoittamaan näitä häiriöitä missä iässä tahansa.',
    eveningRoutine: [
      {title: 'Säännölliset ajat', text: 'Nukkumaanmeno ja herääminen vakaina aikoina auttaa säätelemään sisäistä kelloasi.'},
      {title: 'Vähemmän ruutuaikaa illalla', text: 'Sininen valo voi viivästyttää nukahtamista; ruututauko auttaa rauhoittumaan.'},
      {title: 'Viileä makuuhuone', text: 'Kohtalainen lämpötila helpottaa nukahtamista missä iässä tahansa.'},
    ],
    section5Body: 'Hyvät tavat eivät aina riitä. Voi olla hyödyllistä puhua ammattilaisen kanssa, jos:',
    warningTitle: 'Tarkistamisen arvoiset merkit',
    consultSigns: [
      'Univaikeudet ovat jatkuneet useita viikkoja',
      'Väsymys vaikuttaa vahvasti arkeen',
      'Unettomuus jatkuu hyvistä tavoista huolimatta',
    ],
    infoCard2Title: 'Tähän vastaanottoon valmistautuminen',
    infoCard2Text: 'Sen kirjaaminen, kuinka kauan ongelmat ovat kestäneet ja mikä niihin näyttää vaikuttavan, voi auttaa terveydenhuollon ammattilaistasi ohjaamaan sinua paremmin.',
    tipTitle: 'Hyvä tietää',
    tipText: 'Nämä unen muutokset ovat yleisiä ja yleensä tilapäisiä: ne eivät tarkoita, että jokin olisi vialla.',
    summaryPoints: [
      'Progesteronilla on lievä rauhoittava vaikutus; sen lasku kierron lopussa voi häiritä unta.',
      'Vaihdevuosissa yöhikoilu on yleinen heräämisen syy.',
      'Vakaa nukkumaanmenorutiini ja viileä makuuhuone auttavat rajoittamaan näitä häiriöitä missä iässä tahansa.',
      'Pitkäkestoisista univaikeuksista kannattaa puhua terveydenhuollon ammattilaisen kanssa.',
    ],
    disclaimerText: 'Tiedoksi tarkoitettua sisältöä. Tämä artikkeli ei korvaa henkilökohtaista lääketieteellistä neuvontaa. Epäselvässä tilanteessa pyydä ohjausta terveydenhuollon ammattilaiselta.',
    shareMessage: 'Uni ja hormonit: vähän tunnettu yhteys — AWA',
  },
  el: {
    badge: 'ΕΜΜΗΝΟΣ ΚΥΚΛΟΣ • ΥΠΝΟΣ',
    title: 'Ύπνος και ορμόνες:\nη λίγο γνωστή σύνδεση',
    metaDuration: '6 λεπτά ανάγνωσης',
    metaType: 'Άρθρο',
    metaLevel: 'Αρχάριο',
    metaValidated: 'Ελεγμένο περιεχόμενο',
    intro: 'Γιατί ο ύπνος σου αλλάζει ανάλογα με τη φάση του κύκλου σου και στην εμμηνόπαυση.',
    contentsTitle: 'Σε αυτό το άρθρο',
    topics: [
      'Γιατί οι ορμόνες επηρεάζουν τον ύπνο',
      'Ύπνος στις φάσεις του κύκλου',
      'Άγχος και ποιότητα ύπνου',
      'Μια καταπραϋντική βραδινή ρουτίνα',
      'Πότε να επισκεφθείς έναν επαγγελματία',
      'Βασικά συμπεράσματα',
    ],
    section1Body: 'Η προγεστερόνη έχει ήπια ηρεμιστική δράση· η πτώση της στο τέλος του κύκλου μπορεί να διαταράξει τον ύπνο, κάνοντάς τον πιο ελαφρύ ή πιο κατακερματισμένο.',
    infoCard1Title: 'Καλό είναι να γνωρίζεις',
    infoCard1Text: 'Η ελαφριά άνοδος της θερμοκρασίας του σώματος μετά την ωορρηξία μπορεί επίσης να κάνει λίγο πιο δύσκολο το αποκοίμισμα σε ορισμένες γυναίκες.',
    phaseSleep: [
      {title: 'Κατά την περίοδό σου', text: 'Η σωματική δυσφορία και η κόπωση μπορεί να κάνουν τον ύπνο πιο ελαφρύ.'},
      {title: 'Γύρω από την ωορρηξία', text: 'Ο ύπνος είναι γενικά πιο σταθερός για τις περισσότερες γυναίκες.'},
      {title: 'Πριν την περίοδό σου', text: 'Η πτώση της προγεστερόνης μπορεί να κάνει τον ύπνο πιο ελαφρύ, με πιθανά ξυπνήματα.'},
    ],
    section2Body: 'Στην εμμηνόπαυση, οι νυχτερινές εφιδρώσεις είναι συχνή αιτία ξυπνημάτων, για παρόμοιους ορμονικούς λόγους.',
    section3Body: 'Το άγχος μπορεί να ενισχύσει τις διαταραχές του ύπνου σε φάσεις του κύκλου που είναι ήδη πιο ευαίσθητες. Απλές τεχνικές χαλάρωσης (αναπνοή, ήπιες διατάσεις) μπορούν να σε βοηθήσουν να ηρεμήσεις πριν τον ύπνο.',
    section4Body: 'Μια σταθερή ρουτίνα πριν τον ύπνο και ένα δροσερό υπνοδωμάτιο βοηθούν να περιοριστούν αυτές οι διαταραχές, σε κάθε ηλικία.',
    eveningRoutine: [
      {title: 'Τακτικές ώρες', text: 'Το να πηγαίνεις για ύπνο και να ξυπνάς σε σταθερές ώρες βοηθά να ρυθμιστεί το εσωτερικό σου ρολόι.'},
      {title: 'Λιγότερος χρόνος μπροστά σε οθόνες το βράδυ', text: 'Το μπλε φως μπορεί να καθυστερήσει το αποκοίμισμα· ένα διάλειμμα από τις οθόνες σε βοηθά να χαλαρώσεις.'},
      {title: 'Ένα δροσερό υπνοδωμάτιο', text: 'Μια μέτρια θερμοκρασία διευκολύνει το αποκοίμισμα, σε κάθε ηλικία.'},
    ],
    section5Body: 'Οι καλές συνήθειες δεν αρκούν πάντα. Μπορεί να βοηθήσει να μιλήσεις με έναν επαγγελματία αν:',
    warningTitle: 'Σημάδια που αξίζει να ελεγχθούν',
    consultSigns: [
      'Τα προβλήματα ύπνου διαρκούν αρκετές εβδομάδες',
      'Η κόπωση επηρεάζει έντονα την καθημερινή ζωή',
      'Η αϋπνία επιμένει παρά τις καλές συνήθειες',
    ],
    infoCard2Title: 'Προετοιμασία για αυτό το ραντεβού',
    infoCard2Text: 'Το να σημειώνεις πόσο καιρό διαρκούν τα προβλήματα και τι φαίνεται να τα επηρεάζει μπορεί να βοηθήσει τον επαγγελματία υγείας σου να σε καθοδηγήσει καλύτερα.',
    tipTitle: 'Καλό είναι να γνωρίζεις',
    tipText: 'Αυτές οι αλλαγές στον ύπνο είναι συχνές και συνήθως προσωρινές: δεν σημαίνουν ότι κάτι δεν πάει καλά.',
    summaryPoints: [
      'Η προγεστερόνη έχει ήπια ηρεμιστική δράση· η πτώση της στο τέλος του κύκλου μπορεί να διαταράξει τον ύπνο.',
      'Στην εμμηνόπαυση, οι νυχτερινές εφιδρώσεις είναι συχνή αιτία ξυπνημάτων.',
      'Μια σταθερή ρουτίνα πριν τον ύπνο και ένα δροσερό υπνοδωμάτιο βοηθούν να περιοριστούν αυτές οι διαταραχές, σε κάθε ηλικία.',
      'Τα επίμονα προβλήματα ύπνου αξίζει να συζητηθούν με έναν επαγγελματία υγείας.',
    ],
    disclaimerText: 'Ενημερωτικό περιεχόμενο. Αυτό το άρθρο δεν αντικαθιστά εξατομικευμένη ιατρική συμβουλή. Αν έχεις αμφιβολίες, ζήτησε καθοδήγηση από έναν επαγγελματία υγείας.',
    shareMessage: 'Ύπνος και ορμόνες: η λίγο γνωστή σύνδεση — AWA',
  },
  fil: {
    badge: 'SIKLO NG REGLA • TULOG',
    title: 'Tulog at mga hormone:\nang hindi gaanong kilalang ugnayan',
    metaDuration: '6 min na babasahin',
    metaType: 'Artikulo',
    metaLevel: 'Baguhan',
    metaValidated: 'Sinuring nilalaman',
    intro: 'Bakit nagbabago ang iyong tulog depende sa yugto ng siklo, at sa menopause.',
    contentsTitle: 'Sa artikulong ito',
    topics: [
      'Bakit nakakaapekto sa tulog ang mga hormone',
      'Tulog sa iba’t ibang yugto ng siklo',
      'Stress at kalidad ng tulog',
      'Isang nakakapanatag na routine sa gabi',
      'Kailan magpapatingin sa propesyonal',
      'Mahahalagang tandaan',
    ],
    section1Body: 'May banayad na epektong pampakalma ang progesterone; ang pagbaba nito sa katapusan ng siklo ay maaaring makagambala sa tulog, na ginagawa itong mas magaan o putol-putol.',
    infoCard1Title: 'Mabuting malaman',
    infoCard1Text: 'Ang bahagyang pagtaas ng temperatura ng katawan pagkatapos ng obulasyon ay maaari ring gawing bahagyang mas mahirap ang pagkakatulog para sa ilan.',
    phaseSleep: [
      {title: 'Habang may regla', text: 'Ang pisikal na kakulangan sa ginhawa at pagod ay maaaring gawing mas magaan ang tulog.'},
      {title: 'Sa paligid ng obulasyon', text: 'Karaniwang mas matatag ang tulog para sa karamihan.'},
      {title: 'Bago ang regla', text: 'Ang pagbaba ng progesterone ay maaaring gawing mas magaan ang tulog, na may posibleng paggising.'},
    ],
    section2Body: 'Sa menopause, ang pagpapawis sa gabi ay karaniwang sanhi ng paggising, sa magkakahawig na hormonal na dahilan.',
    section3Body: 'Maaaring palakihin ng stress ang mga gambala sa tulog sa mga yugto ng siklo na mas sensitibo na. Makakatulong ang simpleng pamamaraan ng pagrerelaks (paghinga, banayad na stretching) na kumalma bago matulog.',
    section4Body: 'Ang matatag na gawi sa oras ng pagtulog at malamig na kuwarto ay tumutulong na limitahan ang mga gambalang ito, sa anumang edad.',
    eveningRoutine: [
      {title: 'Regular na oras', text: 'Ang pagtulog at paggising sa matatag na oras ay tumutulong na i-regulate ang iyong internal na orasan.'},
      {title: 'Mas kaunting screen time sa gabi', text: 'Maaaring maantala ng blue light ang pagkakatulog; ang pahinga mula sa screen ay tumutulong na kumalma.'},
      {title: 'Malamig na kuwarto', text: 'Ang katamtamang temperatura ay nagpapadali ng pagkakatulog, sa anumang edad.'},
    ],
    section5Body: 'Hindi laging sapat ang mabubuting gawi. Makakatulong na makipag-usap sa propesyonal kung:',
    warningTitle: 'Mga senyales na dapat ipasuri',
    consultSigns: [
      'Ilang linggo nang tumatagal ang mga problema sa tulog',
      'Malaki ang epekto ng pagod sa pang-araw-araw na buhay',
      'Nagpapatuloy ang insomnia sa kabila ng mabubuting gawi',
    ],
    infoCard2Title: 'Paghahanda para sa appointment na ito',
    infoCard2Text: 'Ang pagtatala kung gaano katagal na ang mga problema at kung ano ang tila nakakaimpluwensya sa mga ito ay makakatulong sa iyong propesyonal sa kalusugan na mas gabayan ka.',
    tipTitle: 'Mabuting malaman',
    tipText: 'Karaniwan at karaniwang pansamantala ang mga pagbabagong ito sa tulog: hindi nangangahulugang may mali.',
    summaryPoints: [
      'May banayad na epektong pampakalma ang progesterone; ang pagbaba nito sa katapusan ng siklo ay maaaring makagambala sa tulog.',
      'Sa menopause, ang pagpapawis sa gabi ay karaniwang sanhi ng paggising.',
      'Ang matatag na gawi sa oras ng pagtulog at malamig na kuwarto ay tumutulong na limitahan ang mga gambalang ito, sa anumang edad.',
      'Ang patuloy na mga problema sa tulog ay nararapat pag-usapan sa propesyonal sa kalusugan.',
    ],
    disclaimerText: 'Impormatibong nilalaman. Hindi pumapalit ang artikulong ito sa personalisadong payong medikal. Kung nag-aalinlangan, humingi ng gabay sa propesyonal sa kalusugan.',
    shareMessage: 'Tulog at mga hormone: ang hindi gaanong kilalang ugnayan — AWA',
  },
  ta: {
    badge: 'மாதவிடாய்ச் சுழற்சி • உறக்கம்',
    title: 'உறக்கமும் ஹார்மோன்களும்:\nஅதிகம் அறியப்படாத தொடர்பு',
    metaDuration: '6 நிமிடம் படிக்க',
    metaType: 'கட்டுரை',
    metaLevel: 'தொடக்க நிலை',
    metaValidated: 'மதிப்பாய்வு செய்யப்பட்ட உள்ளடக்கம்',
    intro: 'உங்கள் சுழற்சிக் கட்டத்தைப் பொறுத்தும், மாதவிடாய் நிறுத்தத்திலும் உங்கள் உறக்கம் ஏன் மாறுகிறது.',
    contentsTitle: 'இந்தக் கட்டுரையில்',
    topics: [
      'ஹார்மோன்கள் உறக்கத்தை ஏன் பாதிக்கின்றன',
      'சுழற்சியின் கட்டங்களில் உறக்கம்',
      'மன அழுத்தமும் உறக்கத் தரமும்',
      'அமைதிப்படுத்தும் மாலை வழக்கம்',
      'ஒரு நிபுணரை எப்போது பார்ப்பது',
      'முக்கியக் குறிப்புகள்',
    ],
    section1Body: 'புரோஜெஸ்டிரோனுக்கு லேசான மயக்க விளைவு உண்டு; சுழற்சியின் இறுதியில் அதன் வீழ்ச்சி உறக்கத்தைக் குலைத்து, அதை இலேசாகவோ துண்டுதுண்டாகவோ ஆக்கலாம்.',
    infoCard1Title: 'தெரிந்துகொள்ளுங்கள்',
    infoCard1Text: 'அண்டவிடுப்புக்குப் பின் உடல் வெப்பநிலையில் ஏற்படும் சிறு உயர்வு, சிலருக்கு உறங்குவதை இன்னும் சற்றுக் கடினமாக்கலாம்.',
    phaseSleep: [
      {title: 'மாதவிடாயின்போது', text: 'உடல் அசௌகரியமும் சோர்வும் உறக்கத்தை இலேசாக்கலாம்.'},
      {title: 'அண்டவிடுப்பைச் சுற்றி', text: 'பெரும்பாலானோருக்கு உறக்கம் பொதுவாக அதிக நிலையாக இருக்கும்.'},
      {title: 'மாதவிடாய்க்கு முன்', text: 'புரோஜெஸ்டிரோன் வீழ்ச்சி உறக்கத்தை இலேசாக்கலாம், இடையில் விழிப்பும் ஏற்படலாம்.'},
    ],
    section2Body: 'மாதவிடாய் நிறுத்தத்தில், இரவில் வியர்த்தல் விழிப்பதற்கான ஒரு பொதுவான காரணம், ஒத்த ஹார்மோன் காரணங்களால்.',
    section3Body: 'ஏற்கெனவே அதிக உணர்திறனுள்ள சுழற்சிக் கட்டங்களில் மன அழுத்தம் உறக்கத் தடைகளைப் பெருக்கலாம். எளிய தளர்வு உத்திகள் (சுவாசம், மென்மையான நீட்சி) உறங்கும் முன் இளைப்பாற உதவலாம்.',
    section4Body: 'நிலையான உறக்க நேர வழக்கமும் குளிர்ச்சியான படுக்கையறையும் எந்த வயதிலும் இந்தத் தடைகளைக் குறைக்க உதவுகின்றன.',
    eveningRoutine: [
      {title: 'ஒழுங்கான நேரங்கள்', text: 'நிலையான நேரங்களில் உறங்கச் செல்வதும் எழுவதும் உங்கள் உள் கடிகாரத்தை ஒழுங்குபடுத்த உதவுகிறது.'},
      {title: 'மாலையில் குறைவான திரை நேரம்', text: 'நீல ஒளி உறக்கத்தைத் தாமதப்படுத்தலாம்; திரையிலிருந்து ஓர் இடைவெளி இளைப்பாற உதவுகிறது.'},
      {title: 'குளிர்ச்சியான படுக்கையறை', text: 'மிதமான வெப்பநிலை எந்த வயதிலும் உறங்குவதை எளிதாக்குகிறது.'},
    ],
    section5Body: 'நல்ல பழக்கங்கள் எப்போதும் போதுமானவை அல்ல. இவை இருந்தால் ஒரு நிபுணரிடம் பேசுவது உதவியாக இருக்கலாம்:',
    warningTitle: 'பரிசோதிக்கத் தகுந்த அறிகுறிகள்',
    consultSigns: [
      'உறக்கப் பிரச்சினைகள் பல வாரங்களாக நீடிக்கின்றன',
      'சோர்வு அன்றாட வாழ்க்கையை வலுவாகப் பாதிக்கிறது',
      'நல்ல பழக்கங்கள் இருந்தும் தூக்கமின்மை நீடிக்கிறது',
    ],
    infoCard2Title: 'இந்தச் சந்திப்புக்குத் தயாராதல்',
    infoCard2Text: 'பிரச்சினைகள் எவ்வளவு காலமாக உள்ளன என்பதையும் எது அவற்றைப் பாதிப்பதாகத் தோன்றுகிறது என்பதையும் குறிப்பது உங்கள் சுகாதார நிபுணர் உங்களுக்கு நன்கு வழிகாட்ட உதவலாம்.',
    tipTitle: 'தெரிந்துகொள்ளுங்கள்',
    tipText: 'இந்த உறக்க மாற்றங்கள் பொதுவானவை, பொதுவாகத் தற்காலிகமானவை: ஏதோ தவறு என்று அவை பொருளல்ல.',
    summaryPoints: [
      'புரோஜெஸ்டிரோனுக்கு லேசான மயக்க விளைவு உண்டு; சுழற்சியின் இறுதியில் அதன் வீழ்ச்சி உறக்கத்தைக் குலைக்கலாம்.',
      'மாதவிடாய் நிறுத்தத்தில், இரவில் வியர்த்தல் விழிப்பதற்கான ஒரு பொதுவான காரணம்.',
      'நிலையான உறக்க நேர வழக்கமும் குளிர்ச்சியான படுக்கையறையும் எந்த வயதிலும் இந்தத் தடைகளைக் குறைக்க உதவுகின்றன.',
      'நீடிக்கும் உறக்கப் பிரச்சினைகளை ஒரு சுகாதார நிபுணருடன் பேசுவது மதிப்புள்ளது.',
    ],
    disclaimerText: 'தகவல் உள்ளடக்கம். இந்தக் கட்டுரை தனிப்பயன் மருத்துவ ஆலோசனைக்கு மாற்றல்ல. சந்தேகம் இருந்தால், ஒரு சுகாதார நிபுணரின் வழிகாட்டுதலை நாடுங்கள்.',
    shareMessage: 'உறக்கமும் ஹார்மோன்களும்: அதிகம் அறியப்படாத தொடர்பு — AWA',
  },
  te: {
    badge: 'నెలసరి చక్రం • నిద్ర',
    title: 'నిద్ర, హార్మోన్లు:\nతక్కువగా తెలిసిన సంబంధం',
    metaDuration: '6 నిమిషాల పఠనం',
    metaType: 'వ్యాసం',
    metaLevel: 'ప్రారంభ స్థాయి',
    metaValidated: 'మదింపు చేసిన కంటెంట్',
    intro: 'మీ చక్ర దశను బట్టి, మెనోపాజ్‌లో మీ నిద్ర ఎందుకు మారుతుంది.',
    contentsTitle: 'ఈ వ్యాసంలో',
    topics: [
      'హార్మోన్లు నిద్రను ఎందుకు ప్రభావితం చేస్తాయి',
      'చక్రంలోని దశల్లో నిద్ర',
      'ఒత్తిడి, నిద్ర నాణ్యత',
      'ప్రశాంతపరిచే సాయంత్రపు దినచర్య',
      'ఒక నిపుణుడిని ఎప్పుడు కలవాలి',
      'ముఖ్యాంశాలు',
    ],
    section1Body: 'ప్రొజెస్టెరాన్‌కు తేలికపాటి నిద్రమత్తు కలిగించే ప్రభావం ఉంటుంది; చక్రం చివర్లో దాని తగ్గుదల నిద్రను భంగపరిచి, తేలికగా లేదా తుంపులు తుంపులుగా చేయవచ్చు.',
    infoCard1Title: 'తెలుసుకోవాల్సినవి',
    infoCard1Text: 'అండోత్సర్గం తర్వాత శరీర ఉష్ణోగ్రతలో స్వల్ప పెరుగుదల కూడా కొందరికి నిద్రపట్టడాన్ని కొంచెం కష్టతరం చేయవచ్చు.',
    phaseSleep: [
      {title: 'మీ నెలసరి సమయంలో', text: 'శారీరక అసౌకర్యం, అలసట నిద్రను తేలికగా చేయవచ్చు.'},
      {title: 'అండోత్సర్గం చుట్టూ', text: 'నిద్ర సాధారణంగా చాలా మందికి మరింత స్థిరంగా ఉంటుంది.'},
      {title: 'మీ నెలసరికి ముందు', text: 'ప్రొజెస్టెరాన్ తగ్గుదల నిద్రను తేలికగా చేయవచ్చు, మధ్యలో మెలకువ రావచ్చు.'},
    ],
    section2Body: 'మెనోపాజ్‌లో, రాత్రి చెమటలు ఇదే విధమైన హార్మోన్ కారణాల వల్ల మెలకువ రావడానికి సాధారణ కారణం.',
    section3Body: 'ఇప్పటికే ఎక్కువ సున్నితమైన చక్ర దశల్లో ఒత్తిడి నిద్ర భంగాలను పెంచవచ్చు. సరళమైన విశ్రాంతి పద్ధతులు (శ్వాస, మృదువైన సాగతీత) పడుకునే ముందు సేద తీరడానికి సహాయపడతాయి.',
    section4Body: 'స్థిరమైన నిద్రవేళ దినచర్య, చల్లని పడకగది ఏ వయసులోనైనా ఈ భంగాలను పరిమితం చేయడానికి సహాయపడతాయి.',
    eveningRoutine: [
      {title: 'క్రమమైన సమయాలు', text: 'స్థిరమైన సమయాల్లో పడుకోవడం, లేవడం మీ అంతర్గత గడియారాన్ని నియంత్రించడానికి సహాయపడుతుంది.'},
      {title: 'సాయంత్రం తక్కువ స్క్రీన్ సమయం', text: 'నీలి కాంతి నిద్రపట్టడాన్ని ఆలస్యం చేయవచ్చు; స్క్రీన్ విరామం సేద తీరడానికి సహాయపడుతుంది.'},
      {title: 'చల్లని పడకగది', text: 'మధ్యస్థ ఉష్ణోగ్రత ఏ వయసులోనైనా నిద్రపట్టడాన్ని సులభతరం చేస్తుంది.'},
    ],
    section5Body: 'మంచి అలవాట్లు ఎల్లప్పుడూ సరిపోవు. ఈ సందర్భాల్లో ఒక నిపుణుడితో మాట్లాడటం సహాయపడవచ్చు:',
    warningTitle: 'పరీక్ష చేయించుకోవాల్సిన సంకేతాలు',
    consultSigns: [
      'నిద్ర సమస్యలు చాలా వారాలుగా కొనసాగుతున్నాయి',
      'అలసట రోజువారీ జీవితాన్ని బలంగా ప్రభావితం చేస్తోంది',
      'మంచి అలవాట్లు ఉన్నా నిద్రలేమి కొనసాగుతోంది',
    ],
    infoCard2Title: 'ఈ అపాయింట్‌మెంట్ కోసం సిద్ధమవ్వడం',
    infoCard2Text: 'సమస్యలు ఎంతకాలంగా ఉన్నాయో, వాటిని ఏది ప్రభావితం చేస్తున్నట్లు అనిపిస్తుందో నోట్ చేసుకోవడం మీ ఆరోగ్య నిపుణుడు మిమ్మల్ని మరింత బాగా మార్గనిర్దేశం చేయడానికి సహాయపడవచ్చు.',
    tipTitle: 'తెలుసుకోవాల్సినవి',
    tipText: 'ఈ నిద్ర మార్పులు సాధారణమైనవి, సాధారణంగా తాత్కాలికమైనవి: ఏదో తప్పు ఉందని అవి అర్థం కావు.',
    summaryPoints: [
      'ప్రొజెస్టెరాన్‌కు తేలికపాటి నిద్రమత్తు కలిగించే ప్రభావం ఉంటుంది; చక్రం చివర్లో దాని తగ్గుదల నిద్రను భంగపరచవచ్చు.',
      'మెనోపాజ్‌లో, రాత్రి చెమటలు మెలకువ రావడానికి సాధారణ కారణం.',
      'స్థిరమైన నిద్రవేళ దినచర్య, చల్లని పడకగది ఏ వయసులోనైనా ఈ భంగాలను పరిమితం చేయడానికి సహాయపడతాయి.',
      'కొనసాగే నిద్ర సమస్యలను ఒక ఆరోగ్య నిపుణుడితో చర్చించడం విలువైనది.',
    ],
    disclaimerText: 'సమాచార కంటెంట్. ఈ వ్యాసం వ్యక్తిగతీకరించిన వైద్య సలహాకు ప్రత్యామ్నాయం కాదు. సందేహం ఉంటే, ఒక ఆరోగ్య నిపుణుడి సలహా కోరండి.',
    shareMessage: 'నిద్ర, హార్మోన్లు: తక్కువగా తెలిసిన సంబంధం — AWA',
  },
  mr: {
    badge: 'मासिक पाळी • झोप',
    title: 'झोप आणि हार्मोन्स:\nकमी माहीत असलेला संबंध',
    metaDuration: '6 मिनिटे वाचन',
    metaType: 'लेख',
    metaLevel: 'प्रारंभ स्तर',
    metaValidated: 'पुनरावलोकन केलेला मजकूर',
    intro: 'तुमच्या पाळीच्या टप्प्यानुसार, आणि रजोनिवृत्तीत, तुमची झोप का बदलते.',
    contentsTitle: 'या लेखात',
    topics: [
      'हार्मोन्स झोपेवर परिणाम का करतात',
      'पाळीच्या टप्प्यांमध्ये झोप',
      'ताण आणि झोपेची गुणवत्ता',
      'शांत करणारी संध्याकाळची दिनचर्या',
      'तज्ज्ञांना केव्हा भेटावे',
      'मुख्य मुद्दे',
    ],
    section1Body: 'प्रोजेस्टेरॉनचा सौम्य झोप आणणारा परिणाम असतो; पाळीच्या शेवटी त्याची घट झोप विस्कळीत करू शकते, ती हलकी किंवा तुटक तुटक करू शकते.',
    infoCard1Title: 'हे जाणून घ्या',
    infoCard1Text: 'बीजोत्सर्जनानंतर शरीराच्या तापमानात होणारी थोडी वाढ काहींसाठी झोप लागणे थोडे कठीण करू शकते.',
    phaseSleep: [
      {title: 'तुमच्या पाळीदरम्यान', text: 'शारीरिक अस्वस्थता आणि थकवा झोप हलकी करू शकतात.'},
      {title: 'बीजोत्सर्जनाच्या आसपास', text: 'झोप सामान्यतः बहुतेकांसाठी अधिक स्थिर असते.'},
      {title: 'तुमच्या पाळीपूर्वी', text: 'प्रोजेस्टेरॉनची घट झोप हलकी करू शकते, मधे जाग येण्याची शक्यता असते.'},
    ],
    section2Body: 'रजोनिवृत्तीत, सारख्याच हार्मोनल कारणांमुळे रात्री घाम येणे हे जाग येण्याचे सामान्य कारण आहे.',
    section3Body: 'ताण आधीच अधिक संवेदनशील असलेल्या पाळीच्या टप्प्यांमध्ये झोपेतील अडथळे वाढवू शकतो. साध्या विश्रांतीची तंत्रे (श्वास, हळुवार स्ट्रेचिंग) झोपण्यापूर्वी शांत होण्यास मदत करू शकतात.',
    section4Body: 'स्थिर झोपण्याची दिनचर्या आणि थंड खोली कोणत्याही वयात हे अडथळे मर्यादित करण्यास मदत करतात.',
    eveningRoutine: [
      {title: 'नियमित वेळा', text: 'स्थिर वेळी झोपणे आणि उठणे तुमचे अंतर्गत घड्याळ नियंत्रित करण्यास मदत करते.'},
      {title: 'संध्याकाळी कमी स्क्रीन वेळ', text: 'निळा प्रकाश झोप लागणे लांबवू शकतो; स्क्रीनमधून विश्रांती शांत होण्यास मदत करते.'},
      {title: 'थंड खोली', text: 'मध्यम तापमान कोणत्याही वयात झोप लागणे सोपे करते.'},
    ],
    section5Body: 'चांगल्या सवयी नेहमी पुरेशा नसतात. यांपैकी काही असल्यास तज्ज्ञाशी बोलणे उपयुक्त ठरू शकते:',
    warningTitle: 'तपासून घ्यावीत अशी चिन्हे',
    consultSigns: [
      'झोपेच्या समस्या अनेक आठवड्यांपासून आहेत',
      'थकवा रोजच्या जीवनावर जोरदार परिणाम करत आहे',
      'चांगल्या सवयी असूनही निद्रानाश कायम आहे',
    ],
    infoCard2Title: 'या भेटीसाठी तयारी',
    infoCard2Text: 'समस्या किती काळापासून आहेत आणि त्यांच्यावर काय परिणाम करत असल्याचे दिसते ते नोंदवल्याने तुमचा आरोग्य व्यावसायिक तुम्हाला अधिक चांगले मार्गदर्शन करू शकतो.',
    tipTitle: 'हे जाणून घ्या',
    tipText: 'हे झोपेतील बदल सामान्य आणि साधारणपणे तात्पुरते असतात: काहीतरी चुकले आहे असा त्यांचा अर्थ नसतो.',
    summaryPoints: [
      'प्रोजेस्टेरॉनचा सौम्य झोप आणणारा परिणाम असतो; पाळीच्या शेवटी त्याची घट झोप विस्कळीत करू शकते.',
      'रजोनिवृत्तीत, रात्री घाम येणे हे जाग येण्याचे सामान्य कारण आहे.',
      'स्थिर झोपण्याची दिनचर्या आणि थंड खोली कोणत्याही वयात हे अडथळे मर्यादित करण्यास मदत करतात.',
      'कायम राहणाऱ्या झोपेच्या समस्यांबद्दल आरोग्य व्यावसायिकाशी चर्चा करणे योग्य आहे.',
    ],
    disclaimerText: 'माहितीपर मजकूर. हा लेख वैयक्तिक वैद्यकीय सल्ल्याची जागा घेत नाही. शंका असल्यास, मार्गदर्शनासाठी आरोग्य व्यावसायिकाला विचारा.',
    shareMessage: 'झोप आणि हार्मोन्स: कमी माहीत असलेला संबंध — AWA',
  },
  gu: {
    badge: 'માસિક ચક્ર • ઊંઘ',
    title: 'ઊંઘ અને હોર્મોન:\nઓછો જાણીતો સંબંધ',
    metaDuration: '6 મિનિટ વાંચન',
    metaType: 'લેખ',
    metaLevel: 'પ્રારંભિક સ્તર',
    metaValidated: 'પુનરાવલોકન કરેલી સામગ્રી',
    intro: 'તમારા ચક્રના તબક્કા પ્રમાણે અને રજોનિવૃત્તિમાં તમારી ઊંઘ કેમ બદલાય છે.',
    contentsTitle: 'આ લેખમાં',
    topics: [
      'હોર્મોન ઊંઘને કેમ અસર કરે છે',
      'ચક્રના તબક્કાઓ દરમિયાન ઊંઘ',
      'તણાવ અને ઊંઘની ગુણવત્તા',
      'સાંજની શાંત દિનચર્યા',
      'વ્યાવસાયિકને ક્યારે મળવું',
      'મુખ્ય મુદ્દા',
    ],
    section1Body: 'પ્રોજેસ્ટેરોનની હળવી શામક અસર હોય છે; ચક્રના અંતે તેનું ઘટવું ઊંઘમાં ખલેલ પાડી શકે, તેને હળવી કે વધુ તૂટક બનાવી શકે.',
    infoCard1Title: 'જાણવા જેવું',
    infoCard1Text: 'અંડોત્સર્જન પછી શરીરના તાપમાનમાં થોડો વધારો પણ કેટલાક લોકો માટે ઊંઘ આવવી થોડી વધુ મુશ્કેલ બનાવી શકે.',
    phaseSleep: [
      {title: 'માસિક દરમિયાન', text: 'શારીરિક અસ્વસ્થતા અને થાક ઊંઘને હળવી બનાવી શકે.'},
      {title: 'અંડોત્સર્જનની આસપાસ', text: 'ઊંઘ સામાન્ય રીતે મોટા ભાગના લોકો માટે વધુ સ્થિર હોય છે.'},
      {title: 'માસિક પહેલાં', text: 'પ્રોજેસ્ટેરોનનું ઘટવું ઊંઘને હળવી બનાવી શકે, જેમાં વચ્ચે જાગી જવાય તેવું બની શકે.'},
    ],
    section2Body: 'રજોનિવૃત્તિમાં, રાતનો પરસેવો જાગી જવાનું સામાન્ય કારણ છે, સમાન હોર્મોનલ કારણોસર.',
    section3Body: 'ચક્રના પહેલેથી વધુ સંવેદનશીલ તબક્કાઓમાં તણાવ ઊંઘની ખલેલને વધારી શકે. સરળ આરામની તકનીકો (શ્વાસ, હળવું સ્ટ્રેચિંગ) સૂતા પહેલાં શાંત થવામાં મદદ કરી શકે.',
    section4Body: 'સૂવાની સ્થિર દિનચર્યા અને ઠંડો બેડરૂમ આ ખલેલ ઘટાડવામાં મદદ કરે છે, કોઈ પણ ઉંમરે.',
    eveningRoutine: [
      {title: 'નિયમિત સમય', text: 'સ્થિર સમયે સૂવા અને જાગવાથી તમારી આંતરિક ઘડિયાળ નિયમિત થવામાં મદદ મળે છે.'},
      {title: 'સાંજે ઓછો સ્ક્રીન સમય', text: 'વાદળી પ્રકાશ ઊંઘ આવવામાં વિલંબ કરી શકે; સ્ક્રીનમાંથી વિરામ શાંત થવામાં મદદ કરે છે.'},
      {title: 'ઠંડો બેડરૂમ', text: 'મધ્યમ તાપમાન ઊંઘ આવવાનું સરળ બનાવે છે, કોઈ પણ ઉંમરે.'},
    ],
    section5Body: 'સારી ટેવો હંમેશાં પૂરતી હોતી નથી. આ કિસ્સાઓમાં વ્યાવસાયિક સાથે વાત કરવી ઉપયોગી થઈ શકે:',
    warningTitle: 'તપાસ કરાવવા જેવાં ચિહ્નો',
    consultSigns: [
      'ઊંઘની સમસ્યાઓ ઘણા અઠવાડિયાંથી ચાલે છે',
      'થાક રોજિંદા જીવનને ખૂબ અસર કરે છે',
      'સારી ટેવો છતાં અનિદ્રા ચાલુ રહે છે',
    ],
    infoCard2Title: 'આ મુલાકાત માટે તૈયારી',
    infoCard2Text: 'સમસ્યાઓ કેટલા સમયથી ચાલે છે અને તેમને શું અસર કરતું લાગે છે તે નોંધવાથી તમારા આરોગ્ય વ્યાવસાયિક તમને વધુ સારી રીતે માર્ગદર્શન આપી શકે.',
    tipTitle: 'જાણવા જેવું',
    tipText: 'ઊંઘના આ ફેરફારો સામાન્ય છે અને સામાન્ય રીતે અસ્થાયી હોય છે: તેનો અર્થ એ નથી કે કંઈક ખોટું છે.',
    summaryPoints: [
      'પ્રોજેસ્ટેરોનની હળવી શામક અસર હોય છે; ચક્રના અંતે તેનું ઘટવું ઊંઘમાં ખલેલ પાડી શકે.',
      'રજોનિવૃત્તિમાં, રાતનો પરસેવો જાગી જવાનું સામાન્ય કારણ છે.',
      'સૂવાની સ્થિર દિનચર્યા અને ઠંડો બેડરૂમ આ ખલેલ ઘટાડવામાં મદદ કરે છે, કોઈ પણ ઉંમરે.',
      'સતત ઊંઘની સમસ્યાઓ વિશે આરોગ્ય વ્યાવસાયિક સાથે વાત કરવી યોગ્ય છે.',
    ],
    disclaimerText: 'માહિતી માટેની સામગ્રી. આ લેખ વ્યક્તિગત તબીબી સલાહનું સ્થાન લેતો નથી. શંકા હોય તો આરોગ્ય વ્યાવસાયિક પાસેથી માર્ગદર્શન લો.',
    shareMessage: 'ઊંઘ અને હોર્મોન: ઓછો જાણીતો સંબંધ — AWA',
  },
  pa: {
    badge: 'ਮਾਹਵਾਰੀ ਚੱਕਰ • ਨੀਂਦ',
    title: 'ਨੀਂਦ ਅਤੇ ਹਾਰਮੋਨ:\nਘੱਟ ਜਾਣਿਆ ਜਾਂਦਾ ਰਿਸ਼ਤਾ',
    metaDuration: '6 ਮਿੰਟ ਪੜ੍ਹਨ',
    metaType: 'ਲੇਖ',
    metaLevel: 'ਸ਼ੁਰੂਆਤੀ ਪੱਧਰ',
    metaValidated: 'ਸਮੀਖਿਆ ਕੀਤੀ ਸਮੱਗਰੀ',
    intro: 'ਤੁਹਾਡੀ ਨੀਂਦ ਮਾਹਵਾਰੀ ਚੱਕਰ ਦੇ ਪੜਾਅ ਮੁਤਾਬਕ, ਅਤੇ ਮੇਨੋਪੌਜ਼ ਵਿੱਚ, ਕਿਉਂ ਬਦਲਦੀ ਹੈ।',
    contentsTitle: 'ਇਸ ਲੇਖ ਵਿੱਚ',
    topics: [
      'ਹਾਰਮੋਨ ਨੀਂਦ ਨੂੰ ਕਿਉਂ ਪ੍ਰਭਾਵਿਤ ਕਰਦੇ ਹਨ',
      'ਮਾਹਵਾਰੀ ਚੱਕਰ ਦੇ ਪੜਾਵਾਂ ਵਿੱਚ ਨੀਂਦ',
      'ਤਣਾਅ ਅਤੇ ਨੀਂਦ ਦੀ ਗੁਣਵੱਤਾ',
      'ਸ਼ਾਮ ਦੀ ਸਕੂਨ ਦੇਣ ਵਾਲੀ ਰੁਟੀਨ',
      'ਮਾਹਿਰ ਨੂੰ ਕਦੋਂ ਮਿਲਣਾ ਹੈ',
      'ਮੁੱਖ ਨੁਕਤੇ',
    ],
    section1Body: 'ਪ੍ਰੋਜੈਸਟ੍ਰੋਨ ਦਾ ਹਲਕਾ ਸ਼ਾਂਤ ਕਰਨ ਵਾਲਾ ਅਸਰ ਹੁੰਦਾ ਹੈ; ਚੱਕਰ ਦੇ ਅੰਤ ਵਿੱਚ ਇਸ ਦੇ ਘਟਣ ਨਾਲ ਨੀਂਦ ਵਿੱਚ ਵਿਘਨ ਪੈ ਸਕਦਾ ਹੈ, ਜਿਸ ਨਾਲ ਉਹ ਹਲਕੀ ਜਾਂ ਟੁੱਟਵੀਂ ਹੋ ਜਾਂਦੀ ਹੈ।',
    infoCard1Title: 'ਜਾਣਨ ਯੋਗ',
    infoCard1Text: 'ਓਵੂਲੇਸ਼ਨ ਤੋਂ ਬਾਅਦ ਸਰੀਰ ਦੇ ਤਾਪਮਾਨ ਵਿੱਚ ਹਲਕਾ ਵਾਧਾ ਵੀ ਕੁਝ ਔਰਤਾਂ ਲਈ ਸੌਣਾ ਥੋੜ੍ਹਾ ਔਖਾ ਬਣਾ ਸਕਦਾ ਹੈ।',
    phaseSleep: [
      {title: 'ਮਾਹਵਾਰੀ ਦੌਰਾਨ', text: 'ਸਰੀਰਕ ਬੇਆਰਾਮੀ ਅਤੇ ਥਕਾਵਟ ਨੀਂਦ ਨੂੰ ਹਲਕਾ ਬਣਾ ਸਕਦੀਆਂ ਹਨ।'},
      {title: 'ਓਵੂਲੇਸ਼ਨ ਦੇ ਆਲੇ-ਦੁਆਲੇ', text: 'ਜ਼ਿਆਦਾਤਰ ਔਰਤਾਂ ਲਈ ਨੀਂਦ ਆਮ ਤੌਰ ਉੱਤੇ ਵਧੇਰੇ ਸਥਿਰ ਹੁੰਦੀ ਹੈ।'},
      {title: 'ਮਾਹਵਾਰੀ ਤੋਂ ਪਹਿਲਾਂ', text: 'ਪ੍ਰੋਜੈਸਟ੍ਰੋਨ ਦਾ ਘਟਣਾ ਨੀਂਦ ਨੂੰ ਹਲਕਾ ਬਣਾ ਸਕਦਾ ਹੈ, ਜਿਸ ਵਿੱਚ ਵਾਰ-ਵਾਰ ਜਾਗ ਆ ਸਕਦੀ ਹੈ।'},
    ],
    section2Body: 'ਮੇਨੋਪੌਜ਼ ਵਿੱਚ, ਰਾਤ ਦਾ ਪਸੀਨਾ ਜਾਗ ਆਉਣ ਦਾ ਆਮ ਕਾਰਨ ਹੈ, ਇਸੇ ਤਰ੍ਹਾਂ ਦੇ ਹਾਰਮੋਨ ਕਾਰਨਾਂ ਕਰਕੇ।',
    section3Body: 'ਤਣਾਅ ਚੱਕਰ ਦੇ ਉਨ੍ਹਾਂ ਪੜਾਵਾਂ ਵਿੱਚ ਨੀਂਦ ਦੀਆਂ ਗੜਬੜਾਂ ਨੂੰ ਵਧਾ ਸਕਦਾ ਹੈ ਜੋ ਪਹਿਲਾਂ ਹੀ ਵਧੇਰੇ ਸੰਵੇਦਨਸ਼ੀਲ ਹੁੰਦੇ ਹਨ। ਸਾਧਾਰਨ ਆਰਾਮ ਦੇ ਤਰੀਕੇ (ਸਾਹ ਲੈਣ ਦੀ ਕਸਰਤ, ਹਲਕਾ ਖਿੱਚਣਾ) ਸੌਣ ਤੋਂ ਪਹਿਲਾਂ ਮਨ ਨੂੰ ਸ਼ਾਂਤ ਕਰਨ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦੇ ਹਨ।',
    section4Body: 'ਸੌਣ ਦੀ ਸਥਿਰ ਰੁਟੀਨ ਅਤੇ ਠੰਢਾ ਕਮਰਾ, ਕਿਸੇ ਵੀ ਉਮਰ ਵਿੱਚ, ਇਨ੍ਹਾਂ ਗੜਬੜਾਂ ਨੂੰ ਘਟਾਉਣ ਵਿੱਚ ਮਦਦ ਕਰਦੇ ਹਨ।',
    eveningRoutine: [
      {title: 'ਨਿਯਮਿਤ ਸਮਾਂ', text: 'ਸਥਿਰ ਸਮਿਆਂ ਉੱਤੇ ਸੌਣਾ ਅਤੇ ਜਾਗਣਾ ਤੁਹਾਡੀ ਅੰਦਰੂਨੀ ਘੜੀ ਨੂੰ ਸੰਤੁਲਿਤ ਕਰਨ ਵਿੱਚ ਮਦਦ ਕਰਦਾ ਹੈ।'},
      {title: 'ਸ਼ਾਮ ਨੂੰ ਸਕ੍ਰੀਨ ਘੱਟ', text: 'ਨੀਲੀ ਰੌਸ਼ਨੀ ਨੀਂਦ ਆਉਣ ਵਿੱਚ ਦੇਰੀ ਕਰ ਸਕਦੀ ਹੈ; ਸਕ੍ਰੀਨ ਤੋਂ ਵਿਰਾਮ ਤੁਹਾਨੂੰ ਸ਼ਾਂਤ ਹੋਣ ਵਿੱਚ ਮਦਦ ਕਰਦਾ ਹੈ।'},
      {title: 'ਠੰਢਾ ਕਮਰਾ', text: 'ਦਰਮਿਆਨਾ ਤਾਪਮਾਨ ਨੀਂਦ ਆਉਣਾ ਸੌਖਾ ਬਣਾਉਂਦਾ ਹੈ, ਕਿਸੇ ਵੀ ਉਮਰ ਵਿੱਚ।'},
    ],
    section5Body: 'ਚੰਗੀਆਂ ਆਦਤਾਂ ਹਮੇਸ਼ਾ ਕਾਫ਼ੀ ਨਹੀਂ ਹੁੰਦੀਆਂ। ਮਾਹਿਰ ਨਾਲ ਗੱਲ ਕਰਨਾ ਮਦਦਗਾਰ ਹੋ ਸਕਦਾ ਹੈ ਜੇ:',
    warningTitle: 'ਜਾਂਚ ਕਰਵਾਉਣ ਯੋਗ ਸੰਕੇਤ',
    consultSigns: [
      'ਨੀਂਦ ਦੀਆਂ ਸਮੱਸਿਆਵਾਂ ਕਈ ਹਫ਼ਤਿਆਂ ਤੋਂ ਚੱਲ ਰਹੀਆਂ ਹੋਣ',
      'ਥਕਾਵਟ ਰੋਜ਼ਾਨਾ ਜ਼ਿੰਦਗੀ ਨੂੰ ਬਹੁਤ ਪ੍ਰਭਾਵਿਤ ਕਰ ਰਹੀ ਹੋਵੇ',
      'ਚੰਗੀਆਂ ਆਦਤਾਂ ਦੇ ਬਾਵਜੂਦ ਨੀਂਦ ਨਾ ਆਉਣਾ ਬਣਿਆ ਰਹੇ',
    ],
    infoCard2Title: 'ਇਸ ਮੁਲਾਕਾਤ ਦੀ ਤਿਆਰੀ',
    infoCard2Text: 'ਇਹ ਲਿਖ ਲੈਣਾ ਕਿ ਸਮੱਸਿਆਵਾਂ ਕਿੰਨੇ ਸਮੇਂ ਤੋਂ ਹਨ ਅਤੇ ਕਿਹੜੀ ਚੀਜ਼ ਉਨ੍ਹਾਂ ਨੂੰ ਪ੍ਰਭਾਵਿਤ ਕਰਦੀ ਜਾਪਦੀ ਹੈ, ਤੁਹਾਡੇ ਸਿਹਤ ਮਾਹਿਰ ਨੂੰ ਤੁਹਾਨੂੰ ਬਿਹਤਰ ਰਾਹ ਦਿਖਾਉਣ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹੈ।',
    tipTitle: 'ਜਾਣਨ ਯੋਗ',
    tipText: 'ਨੀਂਦ ਦੇ ਇਹ ਬਦਲਾਅ ਆਮ ਹਨ ਅਤੇ ਆਮ ਤੌਰ ਉੱਤੇ ਅਸਥਾਈ ਹੁੰਦੇ ਹਨ: ਇਨ੍ਹਾਂ ਦਾ ਇਹ ਮਤਲਬ ਨਹੀਂ ਕਿ ਕੁਝ ਗ਼ਲਤ ਹੈ।',
    summaryPoints: [
      'ਪ੍ਰੋਜੈਸਟ੍ਰੋਨ ਦਾ ਹਲਕਾ ਸ਼ਾਂਤ ਕਰਨ ਵਾਲਾ ਅਸਰ ਹੁੰਦਾ ਹੈ; ਚੱਕਰ ਦੇ ਅੰਤ ਵਿੱਚ ਇਸ ਦਾ ਘਟਣਾ ਨੀਂਦ ਵਿੱਚ ਵਿਘਨ ਪਾ ਸਕਦਾ ਹੈ।',
      'ਮੇਨੋਪੌਜ਼ ਵਿੱਚ, ਰਾਤ ਦਾ ਪਸੀਨਾ ਜਾਗ ਆਉਣ ਦਾ ਆਮ ਕਾਰਨ ਹੈ।',
      'ਸੌਣ ਦੀ ਸਥਿਰ ਰੁਟੀਨ ਅਤੇ ਠੰਢਾ ਕਮਰਾ, ਕਿਸੇ ਵੀ ਉਮਰ ਵਿੱਚ, ਇਨ੍ਹਾਂ ਗੜਬੜਾਂ ਨੂੰ ਘਟਾਉਣ ਵਿੱਚ ਮਦਦ ਕਰਦੇ ਹਨ।',
      'ਲਗਾਤਾਰ ਨੀਂਦ ਦੀਆਂ ਸਮੱਸਿਆਵਾਂ ਬਾਰੇ ਸਿਹਤ ਮਾਹਿਰ ਨਾਲ ਗੱਲ ਕਰਨੀ ਚੰਗੀ ਹੈ।',
    ],
    disclaimerText: 'ਜਾਣਕਾਰੀ ਲਈ ਸਮੱਗਰੀ। ਇਹ ਲੇਖ ਨਿੱਜੀ ਡਾਕਟਰੀ ਸਲਾਹ ਦੀ ਥਾਂ ਨਹੀਂ ਲੈਂਦਾ। ਸ਼ੱਕ ਹੋਵੇ ਤਾਂ ਸਿਹਤ ਮਾਹਿਰ ਤੋਂ ਸਲਾਹ ਲਵੋ।',
    shareMessage: 'ਨੀਂਦ ਅਤੇ ਹਾਰਮੋਨ: ਘੱਟ ਜਾਣਿਆ ਜਾਂਦਾ ਰਿਸ਼ਤਾ — AWA',
  },
  my: {
    badge: 'ရာသီစက်ဝန်း • အိပ်စက်ခြင်း',
    title: 'အိပ်စက်ခြင်းနှင့် ဟော်မုန်းများ -\nမသိသာသော ဆက်စပ်မှု',
    metaDuration: 'ဖတ်ချိန် 6 မိနစ်',
    metaType: 'ဆောင်းပါး',
    metaLevel: 'အခြေခံအဆင့်',
    metaValidated: 'ပြန်လည်သုံးသပ်ပြီး အကြောင်းအရာ',
    intro: 'သင့်ရာသီစက်ဝန်းအဆင့်အလိုက်နှင့် ရာသီဆုံးချိန်တွင် သင့်အိပ်စက်ခြင်း ဘာကြောင့်ပြောင်းလဲသနည်း။',
    contentsTitle: 'ဤဆောင်းပါးတွင်',
    topics: [
      'ဟော်မုန်းများက အိပ်စက်ခြင်းကို ဘာကြောင့် ထိခိုက်သလဲ',
      'ရာသီစက်ဝန်းအဆင့်များအလိုက် အိပ်စက်ခြင်း',
      'စိတ်ဖိစီးမှုနှင့် အိပ်စက်ခြင်းအရည်အသွေး',
      'စိတ်သက်သာစေသော ညနေပိုင်းအကျင့်',
      'ပညာရှင်ကို ဘယ်အချိန်ပြသင့်သလဲ',
      'အဓိကအချက်များ',
    ],
    section1Body: 'ပရိုဂျက်စတီရုန်းတွင် ပေါ့ပါးသော စိတ်ငြိမ်စေသည့် သက်ရောက်မှုရှိသည်။ ရာသီစက်ဝန်းအဆုံးတွင် ၎င်းကျဆင်းခြင်းက အိပ်စက်ခြင်းကို အနှောင့်အယှက်ဖြစ်စေပြီး ပိုပေါ့ပါးစေခြင်း သို့မဟုတ် ပိုပြတ်တောက်စေခြင်း ဖြစ်နိုင်သည်။',
    infoCard1Title: 'သိထားသင့်သည်',
    infoCard1Text: 'မျိုးဥကြွေပြီးနောက် ကိုယ်အပူချိန် အနည်းငယ်မြင့်တက်ခြင်းသည် အချို့သူများအတွက် အိပ်ပျော်ရန် အနည်းငယ်ပိုခက်စေနိုင်သည်။',
    phaseSleep: [
      {title: 'ရာသီလာချိန်တွင်', text: 'ကိုယ်ခန္ဓာမသက်မသာမှုနှင့် ပင်ပန်းနွမ်းနယ်မှုက အိပ်စက်ခြင်းကို ပိုပေါ့ပါးစေနိုင်သည်။'},
      {title: 'မျိုးဥကြွေချိန်ဝန်းကျင်တွင်', text: 'အိပ်စက်ခြင်းသည် လူအများစုအတွက် ယေဘုယျအားဖြင့် ပိုတည်ငြိမ်သည်။'},
      {title: 'ရာသီမလာမီ', text: 'ပရိုဂျက်စတီရုန်း ကျဆင်းခြင်းက အိပ်စက်ခြင်းကို ပိုပေါ့ပါးစေပြီး နှိုးလာခြင်း ဖြစ်နိုင်သည်။'},
    ],
    section2Body: 'ရာသီဆုံးချိန်တွင် ဆင်တူသော ဟော်မုန်းအကြောင်းများကြောင့် ညဘက်ချွေးထွက်ခြင်းသည် နိုးလာခြင်း၏ ဖြစ်လေ့ရှိသော အကြောင်းရင်းတစ်ခုဖြစ်သည်။',
    section3Body: 'စိတ်ဖိစီးမှုသည် ရာသီစက်ဝန်း၏ ထိခိုက်လွယ်ပြီးသားအဆင့်များတွင် အိပ်စက်ခြင်းအနှောင့်အယှက်များကို ပိုမိုပြင်းထန်စေနိုင်သည်။ ရိုးရှင်းသော အပန်းဖြေနည်းများ (အသက်ရှူခြင်း၊ ညင်သာသော ကိုယ်လက်ဆန့်ခြင်း) က အိပ်ရာမဝင်မီ စိတ်လျှော့ချရန် ကူညီနိုင်သည်။',
    section4Body: 'တည်ငြိမ်သော အိပ်ရာဝင်အကျင့်နှင့် အေးမြသော အိပ်ခန်းက မည်သည့်အသက်အရွယ်တွင်မဆို ဤအနှောင့်အယှက်များကို လျှော့ချရန် ကူညီသည်။',
    eveningRoutine: [
      {title: 'ပုံမှန်အချိန်များ', text: 'တည်ငြိမ်သောအချိန်တွင် အိပ်ရာဝင်ပြီး နိုးခြင်းက သင့်ကိုယ်တွင်းနာရီကို ထိန်းညှိပေးသည်။'},
      {title: 'ညနေပိုင်း ဖန်သားပြင်အသုံးပြုမှု လျှော့ခြင်း', text: 'အပြာရောင်အလင်းသည် အိပ်ပျော်ခြင်းကို နှောင့်နှေးစေနိုင်သည်။ ဖန်သားပြင်မှ အနားယူခြင်းက စိတ်လျှော့ချရန် ကူညီသည်။'},
      {title: 'အေးမြသော အိပ်ခန်း', text: 'အလယ်အလတ်အပူချိန်က မည်သည့်အသက်အရွယ်တွင်မဆို အိပ်ပျော်ရန် ပိုလွယ်စေသည်။'},
    ],
    section5Body: 'အကျင့်ကောင်းများသည် အမြဲလုံလောက်မည်မဟုတ်ပါ။ အောက်ပါအခါများတွင် ပညာရှင်တစ်ဦးနှင့် ပြောဆိုခြင်းက အသုံးဝင်နိုင်သည်။',
    warningTitle: 'စစ်ဆေးသင့်သော လက္ခဏာများ',
    consultSigns: [
      'အိပ်စက်ခြင်းပြဿနာများ သီတင်းပတ်အနည်းငယ် ကြာနေခြင်း',
      'ပင်ပန်းနွမ်းနယ်ခြင်းသည် နေ့စဉ်ဘဝကို ပြင်းထန်စွာ ထိခိုက်နေခြင်း',
      'အကျင့်ကောင်းများရှိသော်လည်း အိပ်မပျော်ခြင်း ဆက်ရှိနေခြင်း',
    ],
    infoCard2Title: 'ဤချိန်းဆိုမှုအတွက် ပြင်ဆင်ခြင်း',
    infoCard2Text: 'ပြဿနာများ ကြာခဲ့သည့်ကာလနှင့် ၎င်းတို့ကို သက်ရောက်နေပုံရသည့်အရာများကို မှတ်သားထားခြင်းက သင့်ကျန်းမာရေးပညာရှင်က သင့်ကို ပိုကောင်းစွာ လမ်းညွှန်ရန် ကူညီနိုင်သည်။',
    tipTitle: 'သိထားသင့်သည်',
    tipText: 'ဤအိပ်စက်ခြင်း ပြောင်းလဲမှုများသည် ဖြစ်လေ့ရှိပြီး များသောအားဖြင့် ယာယီဖြစ်သည်။ တစ်စုံတစ်ရာမှားနေသည်ဟု မဆိုလိုပါ။',
    summaryPoints: [
      'ပရိုဂျက်စတီရုန်းတွင် ပေါ့ပါးသော စိတ်ငြိမ်စေသည့် သက်ရောက်မှုရှိသည်။ ရာသီစက်ဝန်းအဆုံးတွင် ၎င်းကျဆင်းခြင်းက အိပ်စက်ခြင်းကို အနှောင့်အယှက်ဖြစ်စေနိုင်သည်။',
      'ရာသီဆုံးချိန်တွင် ညဘက်ချွေးထွက်ခြင်းသည် နိုးလာခြင်း၏ ဖြစ်လေ့ရှိသော အကြောင်းရင်းတစ်ခုဖြစ်သည်။',
      'တည်ငြိမ်သော အိပ်ရာဝင်အကျင့်နှင့် အေးမြသော အိပ်ခန်းက မည်သည့်အသက်အရွယ်တွင်မဆို ဤအနှောင့်အယှက်များကို လျှော့ချရန် ကူညီသည်။',
      'ဆက်ရှိနေသော အိပ်စက်ခြင်းပြဿနာများကို ကျန်းမာရေးပညာရှင်နှင့် ဆွေးနွေးသင့်သည်။',
    ],
    disclaimerText: 'အချက်အလက်ပေးသော အကြောင်းအရာ။ ဤဆောင်းပါးသည် ကိုယ်ပိုင်ဆေးဘက်ဆိုင်ရာ အကြံပြုချက်ကို အစားမထိုးပါ။ သံသယရှိပါက ကျန်းမာရေးပညာရှင်ထံ လမ်းညွှန်မှုတောင်းပါ။',
    shareMessage: 'အိပ်စက်ခြင်းနှင့် ဟော်မုန်းများ - မသိသာသော ဆက်စပ်မှု — AWA',
  },
  km: {
    badge: 'វដ្តរដូវ • ដំណេក',
    title: 'ដំណេក និងអរម៉ូន៖\nទំនាក់ទំនងដែលមិនសូវស្គាល់',
    metaDuration: 'អាន 6 នាទី',
    metaType: 'អត្ថបទ',
    metaLevel: 'កម្រិតដំបូង',
    metaValidated: 'មាតិកាបានពិនិត្យ',
    intro: 'ហេតុអ្វីបានជាដំណេករបស់អ្នកប្រែប្រួលតាមដំណាក់កាលនៃវដ្តរដូវ និងពេលអស់រដូវ។',
    contentsTitle: 'ក្នុងអត្ថបទនេះ',
    topics: [
      'ហេតុអ្វីអរម៉ូនប៉ះពាល់ដល់ដំណេក',
      'ដំណេកក្នុងដំណាក់កាលនានានៃវដ្តរដូវ',
      'ភាពតានតឹង និងគុណភាពដំណេក',
      'ទម្លាប់ពេលល្ងាចដែលធ្វើឱ្យស្ងប់',
      'ពេលណាត្រូវជួបអ្នកជំនាញ',
      'ចំណុចសំខាន់ៗ',
    ],
    section1Body: 'ប្រូសេស្តេរ៉ូនមានឥទ្ធិពលធ្វើឱ្យស្ងប់បន្តិច។ ការធ្លាក់ចុះរបស់វានៅចុងវដ្តរដូវអាចរំខានដំណេក ធ្វើឱ្យដំណេកស្រាលជាង ឬដាច់ៗ។',
    infoCard1Title: 'គួរដឹង',
    infoCard1Text: 'ការឡើងកម្ដៅរាងកាយបន្តិចក្រោយការបញ្ចេញពងអូវុល ក៏អាចធ្វើឱ្យការគេងលក់ពិបាកបន្តិចសម្រាប់មនុស្សមួយចំនួន។',
    phaseSleep: [
      {title: 'ក្នុងអំឡុងពេលរដូវរបស់អ្នក', text: 'ភាពមិនស្រួលខ្លួន និងការអស់កម្លាំងអាចធ្វើឱ្យដំណេកស្រាលជាង។'},
      {title: 'ជុំវិញការបញ្ចេញពងអូវុល', text: 'ជាទូទៅដំណេកមានស្ថិរភាពជាងសម្រាប់មនុស្សភាគច្រើន។'},
      {title: 'មុនរដូវរបស់អ្នក', text: 'ការធ្លាក់ចុះនៃប្រូសេស្តេរ៉ូនអាចធ្វើឱ្យដំណេកស្រាលជាង ហើយអាចភ្ញាក់ពីគេង។'},
    ],
    section2Body: 'ពេលអស់រដូវ ការបែកញើសពេលយប់គឺជាមូលហេតុទូទៅនៃការភ្ញាក់ពីគេង ដោយសារហេតុផលអរម៉ូនស្រដៀងគ្នា។',
    section3Body: 'ភាពតានតឹងអាចបង្កើនការរំខានដំណេកក្នុងដំណាក់កាលនៃវដ្តរដូវដែលរសើបជាងរួចហើយ។ បច្ចេកទេសសម្រាកងាយៗ (ការដកដង្ហើម ការលាតសន្ធឹងទន់ភ្លន់) អាចជួយអ្នកឱ្យស្ងប់មុនពេលចូលគេង។',
    section4Body: 'ទម្លាប់ចូលគេងមានស្ថិរភាព និងបន្ទប់គេងត្រជាក់ ជួយកាត់បន្ថយការរំខានទាំងនេះ ទោះនៅអាយុណាក៏ដោយ។',
    eveningRoutine: [
      {title: 'ម៉ោងទៀងទាត់', text: 'ការចូលគេង និងភ្ញាក់ឡើងនៅម៉ោងថេរ ជួយគ្រប់គ្រងនាឡិកាខាងក្នុងរបស់អ្នក។'},
      {title: 'ប្រើអេក្រង់តិចនៅពេលល្ងាច', text: 'ពន្លឺខៀវអាចពន្យារការគេងលក់។ ការឈប់សម្រាកពីអេក្រង់ជួយអ្នកឱ្យស្ងប់។'},
      {title: 'បន្ទប់គេងត្រជាក់', text: 'សីតុណ្ហភាពមធ្យមធ្វើឱ្យការគេងលក់កាន់តែងាយស្រួល ទោះនៅអាយុណាក៏ដោយ។'},
    ],
    section5Body: 'ទម្លាប់ល្អមិនតែងតែគ្រប់គ្រាន់ទេ។ វាអាចមានប្រយោជន៍ក្នុងការនិយាយជាមួយអ្នកជំនាញ ប្រសិនបើ៖',
    warningTitle: 'សញ្ញាដែលគួរតែពិនិត្យ',
    consultSigns: [
      'បញ្ហាដំណេកបានមានរយៈពេលជាច្រើនសប្តាហ៍',
      'ការអស់កម្លាំងប៉ះពាល់យ៉ាងខ្លាំងដល់ជីវិតប្រចាំថ្ងៃ',
      'ការគេងមិនលក់នៅតែមាន ទោះមានទម្លាប់ល្អក៏ដោយ',
    ],
    infoCard2Title: 'ត្រៀមខ្លួនសម្រាប់ការណាត់ជួបនេះ',
    infoCard2Text: 'ការកត់ត្រាថាបញ្ហាបានមានយូរប៉ុណ្ណា និងអ្វីដែលហាក់ដូចជាមានឥទ្ធិពលលើវា អាចជួយអ្នកជំនាញសុខាភិបាលរបស់អ្នកណែនាំអ្នកបានប្រសើរជាង។',
    tipTitle: 'គួរដឹង',
    tipText: 'ការប្រែប្រួលដំណេកទាំងនេះជារឿងទូទៅ ហើយជាធម្មតាបណ្តោះអាសន្ន។ វាមិនមានន័យថាមានអ្វីមិនប្រក្រតីទេ។',
    summaryPoints: [
      'ប្រូសេស្តេរ៉ូនមានឥទ្ធិពលធ្វើឱ្យស្ងប់បន្តិច។ ការធ្លាក់ចុះរបស់វានៅចុងវដ្តរដូវអាចរំខានដំណេក។',
      'ពេលអស់រដូវ ការបែកញើសពេលយប់គឺជាមូលហេតុទូទៅនៃការភ្ញាក់ពីគេង។',
      'ទម្លាប់ចូលគេងមានស្ថិរភាព និងបន្ទប់គេងត្រជាក់ ជួយកាត់បន្ថយការរំខានទាំងនេះ ទោះនៅអាយុណាក៏ដោយ។',
      'បញ្ហាដំណេកដែលនៅជាប់ គួរតែពិភាក្សាជាមួយអ្នកជំនាញសុខាភិបាល។',
    ],
    disclaimerText: 'នេះជាព័ត៌មានទូទៅ។ អត្ថបទនេះមិនជំនួសដំបូន្មានពីវេជ្ជបណ្ឌិតផ្ទាល់ខ្លួនទេ។ ប្រសិនបើសង្ស័យ សូមសុំការណែនាំពីអ្នកជំនាញសុខាភិបាល។',
    shareMessage: 'ដំណេក និងអរម៉ូន៖ ទំនាក់ទំនងដែលមិនសូវស្គាល់ — AWA',
  },
  lo: {
    badge: 'ຮອບເດືອນ • ການນອນ',
    title: 'ການນອນ ແລະ ຮໍໂມນ:\nຄວາມເຊື່ອມໂຍງທີ່ຫຼາຍຄົນບໍ່ຮູ້',
    metaDuration: 'ອ່ານ 6 ນາທີ',
    metaType: 'ບົດຄວາມ',
    metaLevel: 'ລະດັບເລີ່ມຕົ້ນ',
    metaValidated: 'ເນື້ອຫາທີ່ຜ່ານການກວດສອບ',
    intro: 'ເປັນຫຍັງການນອນຂອງທ່ານຈຶ່ງປ່ຽນໄປຕາມໄລຍະຂອງຮອບເດືອນ ແລະ ໃນຊ່ວງໝົດປະຈຳເດືອນ.',
    contentsTitle: 'ໃນບົດຄວາມນີ້',
    topics: [
      'ເປັນຫຍັງຮໍໂມນຈຶ່ງສົ່ງຜົນຕໍ່ການນອນ',
      'ການນອນໃນແຕ່ລະໄລຍະຂອງຮອບເດືອນ',
      'ຄວາມຕຶງຄຽດ ແລະ ຄຸນນະພາບການນອນ',
      'ກິດຈະວັດຕອນແລງທີ່ຜ່ອນຄາຍ',
      'ເມື່ອໃດຄວນພົບຜູ້ຊ່ຽວຊານ',
      'ຈຸດສຳຄັນ',
    ],
    section1Body: 'ໂປຣເຈສເຕໂຣນມີຜົນເຮັດໃຫ້ງ່ວງເລັກນ້ອຍ; ການຫຼຸດລົງຂອງມັນໃນທ້າຍຮອບເດືອນສາມາດລົບກວນການນອນ ເຮັດໃຫ້ນອນຫຼັບເບົາ ຫຼື ຕື່ນເປັນຊ່ວງໆ.',
    infoCard1Title: 'ຄວນຮູ້',
    infoCard1Text: 'ອຸນຫະພູມຮ່າງກາຍທີ່ສູງຂຶ້ນເລັກນ້ອຍຫຼັງການຕົກໄຂ່ ກໍອາດເຮັດໃຫ້ບາງຄົນນອນຫຼັບຍາກຂຶ້ນນິດໜ້ອຍ.',
    phaseSleep: [
      {title: 'ໃນຊ່ວງມີປະຈຳເດືອນ', text: 'ຄວາມບໍ່ສະບາຍທາງຮ່າງກາຍ ແລະ ອາການອ່ອນເພຍອາດເຮັດໃຫ້ນອນຫຼັບເບົາ.'},
      {title: 'ໃນຊ່ວງການຕົກໄຂ່', text: 'ການນອນໂດຍທົ່ວໄປຄົງທີ່ກວ່າສຳລັບຄົນສ່ວນໃຫຍ່.'},
      {title: 'ກ່ອນມີປະຈຳເດືອນ', text: 'ການຫຼຸດລົງຂອງໂປຣເຈສເຕໂຣນອາດເຮັດໃຫ້ນອນຫຼັບເບົາ ແລະ ອາດຕື່ນກາງຄືນ.'},
    ],
    section2Body: 'ໃນຊ່ວງໝົດປະຈຳເດືອນ ເຫື່ອອອກກາງຄືນເປັນສາເຫດທົ່ວໄປຂອງການຕື່ນນອນ ດ້ວຍເຫດຜົນທາງຮໍໂມນທີ່ຄ້າຍກັນ.',
    section3Body: 'ຄວາມຕຶງຄຽດສາມາດເພີ່ມການລົບກວນການນອນໃນໄລຍະຂອງຮອບເດືອນທີ່ອ່ອນໄຫວຢູ່ແລ້ວ. ເຕັກນິກຜ່ອນຄາຍງ່າຍໆ (ການຫາຍໃຈ ການຢຽດກ້າມເນື້ອເບົາໆ) ສາມາດຊ່ວຍໃຫ້ທ່ານຜ່ອນຄາຍກ່ອນນອນ.',
    section4Body: 'ກິດຈະວັດກ່ອນນອນທີ່ຄົງທີ່ ແລະ ຫ້ອງນອນທີ່ເຢັນຊ່ວຍຈຳກັດການລົບກວນເຫຼົ່ານີ້ ໃນທຸກໄວ.',
    eveningRoutine: [
      {title: 'ເວລາປົກກະຕິ', text: 'ການເຂົ້ານອນ ແລະ ຕື່ນນອນໃນເວລາທີ່ຄົງທີ່ ຊ່ວຍປັບນາຬິກາພາຍໃນຂອງທ່ານ.'},
      {title: 'ໃຊ້ໜ້າຈໍໜ້ອຍລົງໃນຕອນແລງ', text: 'ແສງສີຟ້າອາດເຮັດໃຫ້ນອນຫຼັບຊ້າລົງ; ການພັກຈາກໜ້າຈໍຊ່ວຍໃຫ້ຜ່ອນຄາຍ.'},
      {title: 'ຫ້ອງນອນທີ່ເຢັນ', text: 'ອຸນຫະພູມປານກາງເຮັດໃຫ້ນອນຫຼັບງ່າຍຂຶ້ນ ໃນທຸກໄວ.'},
    ],
    section5Body: 'ນິໄສທີ່ດີບໍ່ໄດ້ພຽງພໍສະເໝີໄປ. ມັນອາດເປັນປະໂຫຍດທີ່ຈະປຶກສາຜູ້ຊ່ຽວຊານ ຖ້າ:',
    warningTitle: 'ອາການທີ່ຄວນໄປກວດ',
    consultSigns: [
      'ບັນຫາການນອນເປັນມາຫຼາຍອາທິດແລ້ວ',
      'ອາການອ່ອນເພຍສົ່ງຜົນຢ່າງຫຼາຍຕໍ່ຊີວິດປະຈຳວັນ',
      'ນອນບໍ່ຫຼັບຍັງຄົງຢູ່ ເຖິງວ່າມີນິໄສທີ່ດີ',
    ],
    infoCard2Title: 'ກະກຽມສຳລັບການນັດພົບນີ້',
    infoCard2Text: 'ການຈົດວ່າບັນຫາເປັນມາດົນປານໃດ ແລະ ສິ່ງໃດທີ່ເບິ່ງຄືວ່າມີອິດທິພົນ ສາມາດຊ່ວຍໃຫ້ຜູ້ຊ່ຽວຊານດ້ານສຸຂະພາບແນະນຳທ່ານໄດ້ດີຂຶ້ນ.',
    tipTitle: 'ຄວນຮູ້',
    tipText: 'ການປ່ຽນແປງຂອງການນອນເຫຼົ່ານີ້ພົບໄດ້ທົ່ວໄປ ແລະ ມັກເປັນຊົ່ວຄາວ: ມັນບໍ່ໄດ້ໝາຍຄວາມວ່າມີບາງຢ່າງຜິດປົກກະຕິ.',
    summaryPoints: [
      'ໂປຣເຈສເຕໂຣນມີຜົນເຮັດໃຫ້ງ່ວງເລັກນ້ອຍ; ການຫຼຸດລົງຂອງມັນໃນທ້າຍຮອບເດືອນສາມາດລົບກວນການນອນ.',
      'ໃນຊ່ວງໝົດປະຈຳເດືອນ ເຫື່ອອອກກາງຄືນເປັນສາເຫດທົ່ວໄປຂອງການຕື່ນນອນ.',
      'ກິດຈະວັດກ່ອນນອນທີ່ຄົງທີ່ ແລະ ຫ້ອງນອນທີ່ເຢັນຊ່ວຍຈຳກັດການລົບກວນເຫຼົ່ານີ້ ໃນທຸກໄວ.',
      'ບັນຫາການນອນທີ່ຍັງຄົງຢູ່ ຄວນປຶກສາຜູ້ຊ່ຽວຊານດ້ານສຸຂະພາບ.',
    ],
    disclaimerText: 'ນີ້ແມ່ນຂໍ້ມູນທົ່ວໄປ ແລະ ບໍ່ແທນຄຳແນະນຳຂອງແພດ. ບົດຄວາມນີ້ບໍ່ແທນຄຳແນະນຳທາງການແພດສະເພາະບຸກຄົນ. ຖ້າຍັງສົງໄສ ໃຫ້ຂໍຄຳແນະນຳຈາກຜູ້ຊ່ຽວຊານດ້ານສຸຂະພາບ.',
    shareMessage: 'ການນອນ ແລະ ຮໍໂມນ: ຄວາມເຊື່ອມໂຍງທີ່ຫຼາຍຄົນບໍ່ຮູ້ — AWA',
  },
} as const);

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

/* -------------------------------------------------------------------------- */
/* SCREEN                                                                     */
/* -------------------------------------------------------------------------- */

export default function SleepHormonesArticleScreen({
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

  const handleShare = async () => {
    try {
      await Share.share({
        message: content.shareMessage,
      });
    } catch {
      // Partage annulé ou indisponible.
    }
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
        {/* ==================================================================== */}
        {/* HERO                                                                 */}
        {/* ==================================================================== */}

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
                accessibilityLabel={
                  saved ? t('library.screen.removeBookmark') : t('library.screen.addBookmark')
                }
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

        {/* ==================================================================== */}
        {/* ARTICLE                                                             */}
        {/* ==================================================================== */}

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

          <AwaText variant="titleSmall" style={styles.intro}>
            {content.intro}
          </AwaText>

          {/* -------------------------------------------------------------- */}
          {/* CONTENTS                                                        */}
          {/* -------------------------------------------------------------- */}

          <AwaCard variant="filled" padding="none" style={styles.contents}>
            <AwaText variant="titleMedium" emphasized style={styles.contentsTitle}>{content.contentsTitle}</AwaText>

            {content.topics.map((item, index) => (
              <View key={item} style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <AwaText variant="labelSmall" emphasized colorRole="primary" style={styles.contentNumber}>{index + 1}.</AwaText>
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

          {/* ================================================================= */}
          {/* SECTION 1                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>1. {content.topics[0]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.section1Body}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.infoCard}>
            <MaterialDesignIcons
              name="information-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <AwaText variant="titleSmall" emphasized>{content.infoCard1Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.infoText}>
                {content.infoCard1Text}
              </AwaText>
            </View>
          </AwaCard>

          {/* ================================================================= */}
          {/* SECTION 2                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>2. {content.topics[1]}</AwaText>

          <View style={styles.normalGrid}>
            {content.phaseSleep.map((item, index) => (
              <AwaCard variant="filled" padding="none" key={item.title} style={styles.normalCard}>
                <View style={styles.normalIcon}>
                  <MaterialDesignIcons
                    name={PHASE_SLEEP_ICONS[index] as never}
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>

                <AwaText variant="titleSmall" emphasized style={styles.normalTitle}>{item.title}</AwaText>
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.normalText}>{item.text}</AwaText>
              </AwaCard>
            ))}
          </View>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.section2Body}
          </AwaText>

          {/* ================================================================= */}
          {/* SECTION 3                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.topics[2]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.section3Body}
          </AwaText>

          {/* ================================================================= */}
          {/* SECTION 4                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.topics[3]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.section4Body}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.comfortCard}>
            {content.eveningRoutine.map((item, index) => (
              <View
                key={item.title}
                style={[
                  styles.comfortRow,
                  index < content.eveningRoutine.length - 1 && styles.comfortRowBorder,
                ]}>
                <View style={styles.comfortIcon}>
                  <MaterialDesignIcons
                    name={EVENING_ROUTINE_ICONS[index] as never}
                    size={19}
                    color={theme.colors.primary}
                  />
                </View>

                <View style={styles.comfortCopy}>
                  <AwaText variant="titleSmall" emphasized>{item.title}</AwaText>
                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.comfortText}>{item.text}</AwaText>
                </View>
              </View>
            ))}
          </AwaCard>

          {/* ================================================================= */}
          {/* SECTION 5                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>5. {content.topics[4]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.section5Body}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <MaterialDesignIcons
                name="alert-circle-outline"
                size={22}
                color={theme.colors.warning}
              />

              <AwaText variant="titleSmall" emphasized style={styles.warningTitle}>{content.warningTitle}</AwaText>
            </View>

            {content.consultSigns.map(item => (
              <View key={item} style={styles.warningRow}>
                <View style={styles.warningBullet}>
                  <MaterialDesignIcons
                    name="alert-circle-outline"
                    size={16}
                    color={theme.colors.warning}
                  />
                </View>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.warningText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.infoCard}>
            <MaterialDesignIcons
              name="stethoscope"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <AwaText variant="titleSmall" emphasized>{content.infoCard2Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.infoText}>
                {content.infoCard2Text}
              </AwaText>
            </View>
          </AwaCard>

          {/* ================================================================= */}
          {/* TIP                                                               */}
          {/* ================================================================= */}

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.tipTitle}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.tipText}
              </AwaText>
            </View>
          </AwaCard>

          {/* ================================================================= */}
          {/* SUMMARY                                                           */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>{content.topics[5]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.summaryCard}>
            {content.summaryPoints.map(item => (
              <View key={item} style={styles.summaryRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <AwaText variant="bodySmall" style={styles.summaryText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          {/* ================================================================= */}
          {/* DISCLAIMER                                                        */}
          {/* ================================================================= */}

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

      <ReadingControls articleId={ID} durationMinutes={6} scrollRef={scrollRef} />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* STYLES                                                                     */
/* -------------------------------------------------------------------------- */

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
  contentNumber: {width: 25},
  contentText: {flex: 1},

  h2: {
    marginTop: 28,
  },
  body: {marginTop: 8},

  infoCard: {
    marginTop: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoCopy: {flex: 1, marginLeft: 8},
  infoText: {marginTop: 3},

  normalGrid: {marginTop: 12, gap: 8},
  normalCard: {
    padding: 12,
  },
  normalIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  normalTitle: {marginTop: 8},
  normalText: {marginTop: 4},

  comfortCard: {
    marginTop: 12,
    paddingHorizontal: 12,
  },
  comfortRow: {flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12},
  comfortRowBorder: {borderBottomWidth: 1, borderBottomColor: theme.colors.border},
  comfortIcon: {
    width: 35,
    height: 35,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  comfortCopy: {flex: 1, marginLeft: 12},
  comfortText: {marginTop: 3},

  warningCard: {
    marginTop: 12,
    padding: 16,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },
  warningHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 12},
  warningTitle: {flex: 1, marginLeft: 8},
  warningRow: {flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8},
  warningBullet: {width: 20, alignItems: 'flex-start'},
  warningText: {flex: 1, marginLeft: 4},

  tip: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipCopy: {flex: 1, marginLeft: 12},
  tipText: {marginTop: 4},

  summaryCard: {
    marginTop: 12,
    padding: 16,
  },
  summaryRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 12},
  summaryText: {flex: 1},

  disclaimer: {
    marginTop: 20,
    paddingHorizontal: 3,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  disclaimerText: {flex: 1},
  });
}
