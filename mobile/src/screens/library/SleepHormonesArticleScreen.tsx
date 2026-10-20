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
const CONTENT = {
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
} as const;

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
