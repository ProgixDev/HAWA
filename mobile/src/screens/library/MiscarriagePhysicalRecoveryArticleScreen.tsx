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
import {type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {resolveEditorialLanguage} from '../../i18n/editorialLanguage';

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

const ID = 'lossphysical-recuperation-physique';

const HERO = require('../../assets/images/library/spm-water.png');

/* -------------------------------------------------------------------------- */
/* DATA — icons stay language-neutral — only TEXT moves into the bilingual   */
/* CONTENT object below, keyed by index to stay aligned with these icons.    */
/* -------------------------------------------------------------------------- */

const PHYSICAL_SIGNS_ICONS = ['water-outline', 'pulse', 'clock-outline'] as const;

const COMFORT_TIPS_ICONS = [
  'bed-outline',
  'cup-water',
  'account-heart-outline',
] as const;

/* -------------------------------------------------------------------------- */
/* CONTENT — PHASE 7L — bilingual editorial content. Article identity (ID,   */
/* images, bookmark/progress keys, JSX structure) is untouched; only this    */
/* object changes per language. The French text below is byte-identical to  */
/* the original — never retyped, only moved into the `fr` key — so the app  */
/* remains fully bilingual rather than having French replaced by English.   */
/* -------------------------------------------------------------------------- */

const CONTENT = {
  fr: {
    badge: 'APRÈS UNE FAUSSE COUCHE • RÉCUPÉRATION',
    title: 'La récupération physique après \nune fausse couche',
    metaDuration: '7 min de lecture',
    metaType: 'Article',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu informatif',
    intro: 'Ton corps a besoin de temps pour retrouver son équilibre. Voici ce qui peut t’aider à mieux comprendre cette étape, en douceur.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Qu’est-ce qu’une fausse couche ?',
      'Ce qui peut se passer physiquement',
      'Le retour du cycle',
      'Un suivi médical rassurant',
      'Quand consulter',
      'À retenir',
    ],
    section1Body1: 'Une fausse couche correspond à l’arrêt spontané d’une grossesse, le plus souvent avant la 12e à 14e semaine. On estime qu’une grossesse confirmée sur six à sept se termine ainsi, le plus souvent tôt dans la grossesse.',
    section1Body2: 'Ce n’est ni rare, ni le signe d’un problème de fertilité future. Dans la grande majorité des cas, elle est liée à des facteurs indépendants de la volonté, comme une anomalie chromosomique survenue par hasard lors du développement.',
    infoCard1Title: 'À retenir',
    infoCard1Text: 'Une fausse couche n’est causée par rien que tu aies fait ou pas fait. Tu n’es pas responsable de ce qui est arrivé.',
    section2Body: 'L’expérience varie beaucoup d’une personne à l’autre. Voici les manifestations les plus courantes :',
    physicalSigns: [
      {title: 'Des saignements', text: 'Leur intensité et leur durée peuvent varier selon chaque situation, puis diminuent progressivement.'},
      {title: 'Des crampes', text: 'Des douleurs proches de crampes menstruelles, parfois plus marquées, peuvent accompagner cette étape.'},
      {title: 'Une durée variable', text: 'La récupération physique s’étale généralement sur quelques jours à quelques semaines.'},
    ],
    section3Body: 'Le corps met généralement quelques semaines à retrouver un équilibre hormonal après une fausse couche. Un cycle peut revenir dès 4 à 6 semaines, mais chaque parcours est différent.',
    comfortTips: [
      {title: 'Accorde-toi du repos', text: 'Ton corps a besoin de temps pour retrouver son équilibre, sans obligation de résultat.'},
      {title: 'Reste bien hydratée', text: 'Une bonne hydratation accompagne naturellement la récupération.'},
      {title: 'Écoute ton corps', text: 'Chaque parcours est différent : avance à ton propre rythme, sans te comparer.'},
    ],
    section4Body: 'Un suivi médical de contrôle permet de vérifier que tout est rentré dans l’ordre, en toute sérénité. Ce rendez-vous est aussi l’occasion de poser toutes tes questions.',
    infoCard2Title: 'Ce que ce rendez-vous peut inclure',
    infoCard2Text: 'Une discussion sur ce que tu as vécu, un examen si nécessaire, et un espace pour répondre à tes questions sur la suite.',
    section5Body: 'Si l’un de ces signes apparaît, il est important de contacter un professionnel de santé sans attendre.',
    warningTitle: 'Signes qui méritent un avis médical',
    warningSigns: [
      'De la fièvre ou un état général qui se dégrade',
      'Des saignements très abondants (protection à changer en moins d’une heure)',
      'Des douleurs intenses qui ne s’améliorent pas',
      'Une odeur inhabituelle',
    ],
    tipTitle: 'Bon à savoir',
    tipText: 'Prendre soin de ton corps ne veut pas dire tout contrôler : c’est surtout t’accorder le temps dont tu as besoin.',
    summaryPoints: [
      'Une fausse couche n’est causée par rien que tu aies fait ou pas fait.',
      'Le corps met généralement quelques semaines à retrouver son équilibre hormonal.',
      'Un cycle peut revenir dès 4 à 6 semaines, mais chaque parcours est différent.',
      'Un contrôle médical permet de vérifier que tout évolue normalement, en toute sérénité.',
    ],
    disclaimerText: 'Contenu informatif. Cet article ne remplace pas un avis ou un examen médical. En cas de doute ou de symptôme préoccupant, demande conseil à un professionnel de santé.',
    shareMessage: 'La récupération physique après une fausse couche — AWA',
  },
  en: {
    badge: 'AFTER A MISCARRIAGE • RECOVERY',
    title: 'Physical recovery after \na miscarriage',
    metaDuration: '7 min read',
    metaType: 'Article',
    metaLevel: 'Beginner',
    metaValidated: 'Informational content',
    intro: 'Your body needs time to find its balance again. Here’s what can help you better understand this stage, gently.',
    contentsTitle: 'In this article',
    topics: [
      'What is a miscarriage?',
      'What can happen physically',
      'The return of your cycle',
      'A reassuring medical check-up',
      'When to seek medical care',
      'Key takeaways',
    ],
    section1Body1: 'A miscarriage is the spontaneous end of a pregnancy, most often before the 12th to 14th week. It’s estimated that one in six to seven confirmed pregnancies ends this way, most often early in the pregnancy.',
    section1Body2: 'It isn’t rare, nor is it a sign of a future fertility problem. In the vast majority of cases, it’s linked to factors beyond anyone’s control, such as a chromosomal anomaly that occurred by chance during development.',
    infoCard1Title: 'Key takeaway',
    infoCard1Text: 'A miscarriage isn’t caused by anything you did or didn’t do. You aren’t responsible for what happened.',
    section2Body: 'Every experience is different from one person to another. Here are the most common signs:',
    physicalSigns: [
      {title: 'Bleeding', text: 'Its intensity and duration can vary depending on the situation, then gradually decrease.'},
      {title: 'Cramping', text: 'Pain similar to menstrual cramps, sometimes more intense, can accompany this stage.'},
      {title: 'A variable duration', text: 'Physical recovery usually spans a few days to a few weeks.'},
    ],
    section3Body: 'Your body generally takes a few weeks to regain hormonal balance after a miscarriage. A cycle can return as early as 4 to 6 weeks, but every journey is different.',
    comfortTips: [
      {title: 'Allow yourself to rest', text: 'Your body needs time to find its balance again, with no pressure to achieve a particular outcome.'},
      {title: 'Stay well hydrated', text: 'Good hydration naturally supports recovery.'},
      {title: 'Listen to your body', text: 'Every journey is different: move at your own pace, without comparing yourself to others.'},
    ],
    section4Body: 'A medical check-up helps confirm that everything is progressing normally, with complete peace of mind. This appointment is also a chance to ask all your questions.',
    infoCard2Title: 'What this appointment can include',
    infoCard2Text: 'A conversation about what you’ve been through, an exam if needed, and space to answer your questions about what comes next.',
    section5Body: 'If any of these signs appear, it’s important to contact a healthcare professional right away.',
    warningTitle: 'Signs that call for medical advice',
    warningSigns: [
      'Fever or a worsening general condition',
      'Very heavy bleeding (needing to change your protection in less than an hour)',
      'Intense pain that doesn’t improve',
      'An unusual odor',
    ],
    tipTitle: 'Good to know',
    tipText: 'Taking care of your body doesn’t mean controlling everything: it mainly means giving yourself the time you need.',
    summaryPoints: [
      'A miscarriage isn’t caused by anything you did or didn’t do.',
      'Your body generally takes a few weeks to regain hormonal balance.',
      'A cycle can return as early as 4 to 6 weeks, but every journey is different.',
      'A medical check-up lets you confirm that everything is progressing normally, with complete peace of mind.',
    ],
    disclaimerText: 'Informational content. This article does not replace medical advice or examination. If in doubt or experiencing concerning symptoms, seek advice from a healthcare professional.',
    shareMessage: 'Physical recovery after a miscarriage — AWA',
  },
  es: {
    badge: 'DESPUÉS DE UNA PÉRDIDA DEL EMBARAZO • RECUPERACIÓN',
    title: 'La recuperación física después de \nuna pérdida del embarazo',
    metaDuration: '7 min de lectura',
    metaType: 'Artículo',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido informativo',
    intro: 'Tu cuerpo necesita tiempo para recuperar su equilibrio. Esto es lo que puede ayudarte a entender mejor esta etapa, con suavidad.',
    contentsTitle: 'En este artículo',
    topics: [
      '¿Qué es una pérdida del embarazo?',
      'Lo que puede ocurrir físicamente',
      'El regreso del ciclo',
      'Un seguimiento médico tranquilizador',
      'Cuándo consultar',
      'Para recordar',
    ],
    section1Body1: 'Una pérdida del embarazo corresponde a la interrupción espontánea de un embarazo, casi siempre antes de la semana 12 a 14. Se estima que entre una de cada seis y una de cada siete embarazos confirmados termina así, casi siempre pronto en el embarazo.',
    section1Body2: 'No es algo raro, ni es señal de un problema de fertilidad futura. En la gran mayoría de los casos, está relacionada con factores ajenos a la voluntad, como una anomalía cromosómica ocurrida por azar durante el desarrollo.',
    infoCard1Title: 'Para recordar',
    infoCard1Text: 'Una pérdida del embarazo no está causada por nada que hayas hecho o dejado de hacer. No eres responsable de lo que ha ocurrido.',
    section2Body: 'La experiencia varía mucho de una persona a otra. Estas son las manifestaciones más frecuentes:',
    physicalSigns: [
      {title: 'Sangrado', text: 'Su intensidad y su duración pueden variar según cada situación, y luego disminuyen progresivamente.'},
      {title: 'Cólicos', text: 'Dolores parecidos a cólicos menstruales, a veces más marcados, pueden acompañar esta etapa.'},
      {title: 'Una duración variable', text: 'La recuperación física se extiende generalmente entre unos días y unas semanas.'},
    ],
    section3Body: 'El cuerpo tarda generalmente unas semanas en recuperar el equilibrio hormonal después de una pérdida del embarazo. Un ciclo puede volver ya a partir de las 4 a 6 semanas, pero cada recorrido es diferente.',
    comfortTips: [
      {title: 'Concédete descanso', text: 'Tu cuerpo necesita tiempo para recuperar su equilibrio, sin obligación de resultado.'},
      {title: 'Mantente bien hidratada', text: 'Una buena hidratación acompaña naturalmente la recuperación.'},
      {title: 'Escucha tu cuerpo', text: 'Cada recorrido es diferente: avanza a tu propio ritmo, sin compararte.'},
    ],
    section4Body: 'Un seguimiento médico de control permite verificar que todo ha vuelto a la normalidad, con total tranquilidad. Esta cita es también la ocasión de hacer todas tus preguntas.',
    infoCard2Title: 'Lo que esta cita puede incluir',
    infoCard2Text: 'Una conversación sobre lo que has vivido, un examen si es necesario, y un espacio para responder a tus preguntas sobre lo que sigue.',
    section5Body: 'Si aparece alguna de estas señales, es importante contactar con un profesional de la salud sin esperar.',
    warningTitle: 'Señales que merecen un aviso médico',
    warningSigns: [
      'Fiebre o un estado general que empeora',
      'Sangrado muy abundante (necesidad de cambiar de protección en menos de una hora)',
      'Dolores intensos que no mejoran',
      'Un olor inusual',
    ],
    tipTitle: 'DATO ÚTIL',
    tipText: 'Cuidar tu cuerpo no significa controlarlo todo: significa sobre todo concederte el tiempo que necesitas.',
    summaryPoints: [
      'Una pérdida del embarazo no está causada por nada que hayas hecho o dejado de hacer.',
      'El cuerpo tarda generalmente unas semanas en recuperar su equilibrio hormonal.',
      'Un ciclo puede volver ya a partir de las 4 a 6 semanas, pero cada recorrido es diferente.',
      'Un control médico permite verificar que todo evoluciona con normalidad, con total tranquilidad.',
    ],
    disclaimerText: 'Contenido informativo. Este artículo no sustituye un aviso o un examen médico. En caso de duda o de síntoma preocupante, pide consejo a un profesional de la salud.',
    shareMessage: 'La recuperación física después de una pérdida del embarazo — AWA',
  },
  it: {
    badge: 'DOPO UN ABORTO SPONTANEO • RECUPERO',
    title: 'Il recupero fisico dopo \nun aborto spontaneo',
    metaDuration: '7 min di lettura',
    metaType: 'Articolo',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto informativo',
    intro: 'Il tuo corpo ha bisogno di tempo per ritrovare il suo equilibrio. Ecco cosa può aiutarti a comprendere meglio questa fase, con delicatezza.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Cos’è un aborto spontaneo?',
      'Cosa può succedere fisicamente',
      'Il ritorno del ciclo',
      'Un controllo medico rassicurante',
      'Quando rivolgersi a un medico',
      'Punti chiave',
    ],
    section1Body1: 'L’aborto spontaneo è la conclusione spontanea di una gravidanza, il più delle volte prima della 12ª–14ª settimana. Si stima che una gravidanza confermata su sei o sette termini in questo modo, il più delle volte nelle fasi iniziali della gravidanza.',
    section1Body2: 'Non è un evento raro, né è il segno di un futuro problema di fertilità. Nella grande maggioranza dei casi è legato a fattori che nessuno può controllare, come un’anomalia cromosomica comparsa per caso durante lo sviluppo.',
    infoCard1Title: 'Punto chiave',
    infoCard1Text: 'Un aborto spontaneo non è causato da nulla di ciò che hai fatto o non hai fatto. Non sei responsabile di ciò che è successo.',
    section2Body: 'Ogni esperienza è diversa da una persona all’altra. Ecco i segnali più comuni:',
    physicalSigns: [
      {
        title: 'Sanguinamento',
        text: 'La sua intensità e la sua durata possono variare a seconda della situazione, poi diminuiscono gradualmente.',
      },
      {
        title: 'Crampi',
        text: 'Un dolore simile ai crampi mestruali, a volte più intenso, può accompagnare questa fase.',
      },
      {
        title: 'Una durata variabile',
        text: 'Il recupero fisico di solito richiede da qualche giorno a qualche settimana.',
      },
    ],
    section3Body: 'In genere il tuo corpo impiega alcune settimane per ritrovare l’equilibrio ormonale dopo un aborto spontaneo. Il ciclo può ripresentarsi già dopo 4–6 settimane, ma ogni percorso è diverso.',
    comfortTips: [
      {
        title: 'Concediti di riposare',
        text: 'Il tuo corpo ha bisogno di tempo per ritrovare il suo equilibrio, senza alcuna pressione di ottenere un risultato particolare.',
      },
      {
        title: 'Bevi a sufficienza',
        text: 'Una buona idratazione sostiene naturalmente il recupero.',
      },
      {
        title: 'Ascolta il tuo corpo',
        text: 'Ogni percorso è diverso: procedi con i tuoi tempi, senza paragonarti agli altri.',
      },
    ],
    section4Body: 'Un controllo medico aiuta a confermare che tutto stia procedendo normalmente, con piena serenità. Questa visita è anche l’occasione per fare tutte le tue domande.',
    infoCard2Title: 'Cosa può includere questa visita',
    infoCard2Text: 'Un colloquio su ciò che hai vissuto, una visita se necessario, e uno spazio per rispondere alle tue domande su ciò che verrà dopo.',
    section5Body: 'Se compare uno di questi segnali, è importante contattare subito un operatore sanitario.',
    warningTitle: 'Segnali che richiedono un parere medico',
    warningSigns: [
      'Febbre o un peggioramento delle condizioni generali',
      'Sanguinamento molto abbondante (dover cambiare l’assorbente in meno di un’ora)',
      'Dolore intenso che non migliora',
      'Un odore insolito',
    ],
    tipTitle: 'Da sapere',
    tipText: 'Prendersi cura del proprio corpo non significa controllare tutto: significa soprattutto concedersi il tempo necessario.',
    summaryPoints: [
      'Un aborto spontaneo non è causato da nulla di ciò che hai fatto o non hai fatto.',
      'In genere il tuo corpo impiega alcune settimane per ritrovare l’equilibrio ormonale.',
      'Il ciclo può ripresentarsi già dopo 4–6 settimane, ma ogni percorso è diverso.',
      'Un controllo medico ti permette di confermare che tutto stia procedendo normalmente, con piena serenità.',
    ],
    disclaimerText: 'Contenuto informativo. Questo articolo non sostituisce un parere medico né una visita. In caso di dubbi o di sintomi preoccupanti, rivolgiti a un operatore sanitario.',
    shareMessage: 'Il recupero fisico dopo un aborto spontaneo — AWA',
  },
  tr: {
    badge: 'DÜŞÜK SONRASI • İYİLEŞME',
    title: 'Düşük sonrası \nfiziksel iyileşme',
    metaDuration: '7 dk okuma',
    metaType: 'Makale',
    metaLevel: 'Başlangıç',
    metaValidated: 'Bilgilendirici içerik',
    intro: 'Bedeninin dengesini yeniden bulması için zamana ihtiyacı var. Bu dönemi nazikçe daha iyi anlamana yardımcı olabilecekler burada.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Düşük nedir?',
      'Fiziksel olarak neler yaşanabilir',
      'Döngünün geri dönüşü',
      'İçini rahatlatan bir sağlık kontrolü',
      'Ne zaman tıbbi yardım alınmalı',
      'Akılda tutulacaklar',
    ],
    section1Body1: 'Düşük, bir gebeliğin kendiliğinden sona ermesidir ve çoğunlukla 12. ila 14. haftadan önce olur. Doğrulanmış gebeliklerin altı ila yedide birinin bu şekilde sonlandığı tahmin edilir; çoğunlukla gebeliğin erken döneminde.',
    section1Body2: 'Nadir değildir ve gelecekteki bir doğurganlık sorununun işareti de değildir. Vakaların büyük çoğunluğunda, gelişim sırasında tesadüfen ortaya çıkan bir kromozom anomalisi gibi, kimsenin elinde olmayan etkenlerle ilişkilidir.',
    infoCard1Title: 'Akılda tut',
    infoCard1Text: 'Düşük, senin yaptığın ya da yapmadığın bir şeyden kaynaklanmaz. Yaşananlardan sen sorumlu değilsin.',
    section2Body: 'Her deneyim kişiden kişiye farklıdır. En sık görülen belirtiler şunlardır:',
    physicalSigns: [
      {
        title: 'Kanama',
        text: 'Şiddeti ve süresi duruma göre değişebilir, ardından yavaş yavaş azalır.',
      },
      {
        title: 'Kramp',
        text: 'Adet kramplarına benzer, bazen daha yoğun bir ağrı bu dönemde eşlik edebilir.',
      },
      {
        title: 'Değişken bir süre',
        text: 'Fiziksel iyileşme genellikle birkaç gün ile birkaç hafta arasında sürer.',
      },
    ],
    section3Body: 'Bedenin, düşükten sonra hormonal dengesini yeniden kazanmak için genellikle birkaç hafta gerekir. Döngü 4 ila 6 hafta gibi erken bir sürede geri dönebilir, ancak her yolculuk farklıdır.',
    comfortTips: [
      {
        title: 'Dinlenmene izin ver',
        text: 'Bedeninin dengesini yeniden bulması için zamana ihtiyacı var; belirli bir sonuca ulaşma baskısı yok.',
      },
      {
        title: 'Yeterince su iç',
        text: 'İyi bir sıvı alımı iyileşmeyi doğal olarak destekler.',
      },
      {
        title: 'Bedenini dinle',
        text: 'Her yolculuk farklıdır: kendi hızında ilerle, kendini başkalarıyla kıyaslama.',
      },
    ],
    section4Body: 'Bir sağlık kontrolü, her şeyin normal seyrettiğini tam bir gönül rahatlığıyla doğrulamana yardımcı olur. Bu randevu aynı zamanda tüm sorularını sorman için bir fırsattır.',
    infoCard2Title: 'Bu randevuda neler olabilir',
    infoCard2Text: 'Yaşadıkların hakkında bir konuşma, gerekirse bir muayene ve bundan sonrasıyla ilgili sorularını yanıtlamak için ayrılmış bir alan.',
    section5Body: 'Bu belirtilerden herhangi biri ortaya çıkarsa, hemen bir sağlık uzmanıyla iletişime geçmek önemlidir.',
    warningTitle: 'Tıbbi görüş gerektiren belirtiler',
    warningSigns: [
      'Ateş ya da genel durumun kötüleşmesi',
      'Çok yoğun kanama (pedini bir saatten kısa sürede değiştirmen gerekiyorsa)',
      'Geçmeyen şiddetli ağrı',
      'Olağan dışı bir koku',
    ],
    tipTitle: 'Bilmekte fayda var',
    tipText: 'Bedenine iyi bakmak, her şeyi kontrol etmek anlamına gelmez: esas olarak kendine ihtiyacın olan zamanı tanımak demektir.',
    summaryPoints: [
      'Düşük, senin yaptığın ya da yapmadığın bir şeyden kaynaklanmaz.',
      'Bedenin hormonal dengesini yeniden kazanmak için genellikle birkaç hafta gerekir.',
      'Döngü 4 ila 6 hafta gibi erken bir sürede geri dönebilir, ancak her yolculuk farklıdır.',
      'Bir sağlık kontrolü, her şeyin normal seyrettiğini tam bir gönül rahatlığıyla doğrulamanı sağlar.',
    ],
    disclaimerText: 'Bilgilendirici içerik. Bu makale tıbbi görüşün ya da muayenenin yerini almaz. Şüphen varsa ya da endişe verici belirtiler yaşıyorsan bir sağlık uzmanına danış.',
    shareMessage: 'Düşük sonrası fiziksel iyileşme — AWA',
  },
  ru: {
    badge: 'ПОСЛЕ ВЫКИДЫША • ВОССТАНОВЛЕНИЕ',
    title: 'Физическое восстановление после \nвыкидыша',
    metaDuration: '7 мин чтения',
    metaType: 'Статья',
    metaLevel: 'Для начинающих',
    metaValidated: 'Информационный материал',
    intro: 'Вашему организму нужно время, чтобы снова обрести равновесие. Вот что поможет вам бережно лучше понять этот этап.',
    contentsTitle: 'В этой статье',
    topics: [
      'Что такое выкидыш?',
      'Что может происходить физически',
      'Возвращение цикла',
      'Успокаивающий медицинский осмотр',
      'Когда обратиться за медицинской помощью',
      'Главное, что стоит запомнить',
    ],
    section1Body1: 'Выкидыш — это самопроизвольное прекращение беременности, чаще всего до 12–14-й недели. По оценкам, одна из шести–семи подтверждённых беременностей заканчивается таким образом, чаще всего на раннем сроке.',
    section1Body2: 'Это не редкость и не признак будущих проблем с фертильностью. В подавляющем большинстве случаев причиной становятся факторы, которые никто не может контролировать, например хромосомная аномалия, возникшая случайно в ходе развития.',
    infoCard1Title: 'Главное',
    infoCard1Text: 'Выкидыш не вызван тем, что вы сделали или не сделали. Вы не виноваты в том, что произошло.',
    section2Body: 'Опыт каждой женщины отличается. Вот самые частые признаки:',
    physicalSigns: [
      {
        title: 'Кровотечение',
        text: 'Его интенсивность и продолжительность могут быть разными в зависимости от ситуации, затем оно постепенно уменьшается.',
      },
      {
        title: 'Спазмы',
        text: 'На этом этапе могут возникать боли, похожие на менструальные спазмы, иногда более сильные.',
      },
      {
        title: 'Разная продолжительность',
        text: 'Физическое восстановление обычно занимает от нескольких дней до нескольких недель.',
      },
    ],
    section3Body: 'Обычно организму требуется несколько недель, чтобы восстановить гормональное равновесие после выкидыша. Цикл может вернуться уже через 4–6 недель, но у каждой этот путь свой.',
    comfortTips: [
      {
        title: 'Позвольте себе отдых',
        text: 'Вашему организму нужно время, чтобы снова обрести равновесие, и от вас не требуется добиваться какого-либо результата.',
      },
      {
        title: 'Пейте достаточно воды',
        text: 'Достаточное количество жидкости естественным образом поддерживает восстановление.',
      },
      {
        title: 'Прислушивайтесь к своему телу',
        text: 'У каждой этот путь свой: двигайтесь в своём темпе, не сравнивая себя с другими.',
      },
    ],
    section4Body: 'Медицинский осмотр помогает убедиться, что всё протекает нормально, и обрести полное спокойствие. Этот приём также возможность задать все ваши вопросы.',
    infoCard2Title: 'Что может включать этот приём',
    infoCard2Text: 'Разговор о том, что вы пережили, при необходимости осмотр и возможность получить ответы на ваши вопросы о том, что будет дальше.',
    section5Body: 'Если появился любой из этих признаков, важно сразу обратиться к медицинскому специалисту.',
    warningTitle: 'Признаки, при которых нужна медицинская консультация',
    warningSigns: [
      'Повышение температуры или ухудшение общего состояния',
      'Очень обильное кровотечение (необходимость менять средство гигиены чаще чем раз в час)',
      'Сильная боль, которая не проходит',
      'Необычный запах',
    ],
    tipTitle: 'ПОЛЕЗНО ЗНАТЬ',
    tipText: 'Забота о своём теле не означает контролировать всё: прежде всего это значит дать себе необходимое время.',
    summaryPoints: [
      'Выкидыш не вызван тем, что вы сделали или не сделали.',
      'Обычно организму требуется несколько недель, чтобы восстановить гормональное равновесие.',
      'Цикл может вернуться уже через 4–6 недель, но у каждой этот путь свой.',
      'Медицинский осмотр позволяет убедиться, что всё протекает нормально, и обрести полное спокойствие.',
    ],
    disclaimerText: 'Информационный материал. Эта статья не заменяет консультацию или осмотр врача. При сомнениях или тревожных симптомах обратитесь к медицинскому специалисту.',
    shareMessage: 'Физическое восстановление после выкидыша — AWA',
  },
  de: {
    badge: 'NACH EINER FEHLGEBURT • ERHOLUNG',
    title: 'Körperliche Erholung nach \neiner Fehlgeburt',
    metaDuration: '7 Min. Lesezeit',
    metaType: 'Artikel',
    metaLevel: 'Einsteiger',
    metaValidated: 'Informationsinhalt',
    intro: 'Dein Körper braucht Zeit, um wieder ins Gleichgewicht zu finden. Hier erfährst du, was dir helfen kann, diese Phase behutsam besser zu verstehen.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Was ist eine Fehlgeburt?',
      'Was körperlich passieren kann',
      'Die Rückkehr deines Zyklus',
      'Eine beruhigende ärztliche Kontrolle',
      'Wann du ärztliche Hilfe suchen solltest',
      'Das Wichtigste in Kürze',
    ],
    section1Body1: 'Eine Fehlgeburt ist das spontane Ende einer Schwangerschaft, meist vor der 12. bis 14. Woche. Schätzungsweise endet eine von sechs bis sieben bestätigten Schwangerschaften auf diese Weise, meist früh in der Schwangerschaft.',
    section1Body2: 'Sie ist nicht selten und auch kein Zeichen für ein späteres Fruchtbarkeitsproblem. In den allermeisten Fällen hängt sie mit Faktoren zusammen, die niemand beeinflussen kann, etwa einer Chromosomenabweichung, die zufällig während der Entwicklung aufgetreten ist.',
    infoCard1Title: 'Wichtig zu wissen',
    infoCard1Text: 'Eine Fehlgeburt wird nicht durch etwas verursacht, das du getan oder nicht getan hast. Du bist nicht schuld an dem, was geschehen ist.',
    section2Body: 'Jede Erfahrung ist anders. Das sind die häufigsten Anzeichen:',
    physicalSigns: [
      {title: 'Blutung', text: 'Ihre Stärke und Dauer können je nach Situation unterschiedlich sein und lassen dann nach und nach nach.'},
      {title: 'Krämpfe', text: 'Schmerzen ähnlich wie Menstruationskrämpfe, manchmal auch stärker, können diese Phase begleiten.'},
      {title: 'Unterschiedliche Dauer', text: 'Die körperliche Erholung dauert in der Regel einige Tage bis einige Wochen.'},
    ],
    section3Body: 'Dein Körper braucht nach einer Fehlgeburt in der Regel einige Wochen, um sein hormonelles Gleichgewicht wiederzufinden. Der Zyklus kann schon nach 4 bis 6 Wochen zurückkehren, aber jeder Weg ist anders.',
    comfortTips: [
      {title: 'Erlaube dir, dich auszuruhen', text: 'Dein Körper braucht Zeit, um wieder ins Gleichgewicht zu finden, ohne den Druck, ein bestimmtes Ergebnis erreichen zu müssen.'},
      {title: 'Trink ausreichend', text: 'Eine gute Flüssigkeitszufuhr unterstützt die Erholung auf natürliche Weise.'},
      {title: 'Höre auf deinen Körper', text: 'Jeder Weg ist anders: Geh in deinem eigenen Tempo und vergleiche dich nicht mit anderen.'},
    ],
    section4Body: 'Eine ärztliche Kontrolle hilft zu bestätigen, dass alles normal verläuft, und schenkt dir volle Beruhigung. Dieser Termin ist auch eine Gelegenheit, alle deine Fragen zu stellen.',
    infoCard2Title: 'Was dieser Termin umfassen kann',
    infoCard2Text: 'Ein Gespräch über das, was du erlebt hast, bei Bedarf eine Untersuchung und Raum für deine Fragen dazu, wie es weitergeht.',
    section5Body: 'Wenn eines dieser Anzeichen auftritt, ist es wichtig, sofort medizinisches Fachpersonal zu kontaktieren.',
    warningTitle: 'Anzeichen, bei denen du ärztlichen Rat einholen solltest',
    warningSigns: [
      'Fieber oder eine Verschlechterung des Allgemeinzustands',
      'Sehr starke Blutung (du musst dein Hygieneprodukt in weniger als einer Stunde wechseln)',
      'Starke Schmerzen, die nicht besser werden',
      'Ein ungewöhnlicher Geruch',
    ],
    tipTitle: 'Gut zu wissen',
    tipText: 'Gut für deinen Körper zu sorgen bedeutet nicht, alles zu kontrollieren: Es bedeutet vor allem, dir die Zeit zu geben, die du brauchst.',
    summaryPoints: [
      'Eine Fehlgeburt wird nicht durch etwas verursacht, das du getan oder nicht getan hast.',
      'Dein Körper braucht in der Regel einige Wochen, um sein hormonelles Gleichgewicht wiederzufinden.',
      'Der Zyklus kann schon nach 4 bis 6 Wochen zurückkehren, aber jeder Weg ist anders.',
      'Eine ärztliche Kontrolle lässt dich bestätigen, dass alles normal verläuft, und schenkt dir volle Beruhigung.',
    ],
    disclaimerText: 'Informationsinhalt. Dieser Artikel ersetzt keine ärztliche Beratung oder Untersuchung. Bei Zweifeln oder beunruhigenden Symptomen lass dich von medizinischem Fachpersonal beraten.',
    shareMessage: 'Körperliche Erholung nach einer Fehlgeburt — AWA',
  },
  zh: {
      badge: '流产之后 • 恢复',
      title: '流产之后的\n身体恢复',
      metaDuration: '阅读约 7 分钟',
      metaType: '文章',
      metaLevel: '入门',
      metaValidated: '科普内容',
      intro: '你的身体需要时间重新找回平衡。这里的内容可以帮助你温和地了解这个阶段。',
      contentsTitle: '本文内容',
      topics: [
        '什么是流产？',
        '身体上可能出现的情况',
        '月经周期的恢复',
        '让人安心的医学检查',
        '何时需要就医',
        '要点回顾',
      ],
      section1Body1: '流产是指妊娠自然终止，最常发生在孕 12 至 14 周之前。据估计，每六到七次确认的怀孕中就有一次以这种方式结束，而且大多发生在孕早期。',
      section1Body2: '流产并不罕见，也不代表将来一定有生育力方面的问题。绝大多数情况下，它与无人能够控制的因素有关，例如发育过程中偶然出现的染色体异常。',
      infoCard1Title: '重点',
      infoCard1Text: '流产不是因为你做了或没做什么。发生的事情不是你的责任。',
      section2Body: '每个人的经历都不一样。以下是最常见的表现：',
      physicalSigns: [
        {
          title: '出血',
          text: '出血的量和持续时间因情况而异，之后会逐渐减少。',
        },
        {
          title: '痉挛',
          text: '类似痛经的疼痛，有时会更强烈，可能伴随这个阶段出现。',
        },
        {
          title: '持续时间不一',
          text: '身体的恢复通常需要几天到几周。',
        },
      ],
      section3Body: '流产之后，身体通常需要几周时间才能恢复激素平衡。月经周期最早可能在 4 至 6 周后恢复，但每个人的经历都不同。',
      comfortTips: [
        {
          title: '允许自己休息',
          text: '你的身体需要时间重新找回平衡，不必为了达到某个结果而给自己压力。',
        },
        {
          title: '保持充足的水分',
          text: '充足的水分自然有助于恢复。',
        },
        {
          title: '倾听身体的声音',
          text: '每个人的经历都不同：按自己的节奏来，不必和别人比较。',
        },
      ],
      section4Body: '医学检查有助于确认一切是否正常进行，让你完全放心。这次就诊也是提出所有疑问的好机会。',
      infoCard2Title: '这次就诊可能包括什么',
      infoCard2Text: '和医生聊聊你所经历的事，必要时做检查，并有空间解答你对接下来的疑问。',
      section5Body: '如果出现以下任何一种情况，请务必立即联系医疗专业人员。',
      warningTitle: '需要就医的信号',
      warningSigns: [
        '发热或整体状况恶化',
        '出血非常多（不到一小时就需要更换卫生用品）',
        '剧烈疼痛且没有缓解',
        '有异常气味',
      ],
      tipTitle: '小贴士',
      tipText: '照顾自己的身体，并不是要掌控一切：更重要的是给自己所需要的时间。',
      summaryPoints: [
        '流产不是因为你做了或没做什么。',
        '身体通常需要几周时间才能恢复激素平衡。',
        '月经周期最早可能在 4 至 6 周后恢复，但每个人的经历都不同。',
        '医学检查可以让你确认一切是否正常进行，让你完全放心。',
      ],
      disclaimerText: '科普内容。本文不能替代医疗建议或检查。如有疑虑或出现令你担心的症状，请向医疗专业人员咨询。',
      shareMessage: '流产之后的身体恢复 — AWA',
    },
  id: {
    badge: 'SETELAH KEGUGURAN • PEMULIHAN',
    title: 'Pemulihan fisik setelah \nkeguguran',
    metaDuration: '7 menit baca',
    metaType: 'Artikel',
    metaLevel: 'Pemula',
    metaValidated: 'Konten informatif',
    intro: 'Tubuhmu butuh waktu untuk menemukan keseimbangannya kembali. Berikut hal-hal yang dapat membantumu memahami tahap ini dengan lebih tenang.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Apa itu keguguran?',
      'Apa yang bisa terjadi secara fisik',
      'Kembalinya siklusmu',
      'Pemeriksaan medis yang menenangkan',
      'Kapan harus mencari perawatan medis',
      'Poin penting',
    ],
    section1Body1: 'Keguguran adalah berakhirnya kehamilan secara spontan, paling sering sebelum minggu ke-12 sampai ke-14. Diperkirakan satu dari enam sampai tujuh kehamilan yang terkonfirmasi berakhir dengan cara ini, paling sering di awal kehamilan.',
    section1Body2: 'Keguguran bukan hal yang jarang, dan bukan pula tanda adanya masalah kesuburan di masa depan. Pada sebagian besar kasus, keguguran berkaitan dengan faktor di luar kendali siapa pun, misalnya kelainan kromosom yang terjadi secara kebetulan selama perkembangan.',
    infoCard1Title: 'Poin utama',
    infoCard1Text: 'Keguguran tidak disebabkan oleh sesuatu yang kamu lakukan atau tidak kamu lakukan. Kamu tidak bertanggung jawab atas apa yang terjadi.',
    section2Body: 'Setiap pengalaman berbeda dari satu orang ke orang lain. Berikut tanda yang paling umum:',
    physicalSigns: [
      {
        title: 'Perdarahan',
        text: 'Banyaknya dan lamanya dapat bervariasi tergantung situasinya, lalu berangsur berkurang.',
      },
      {
        title: 'Kram',
        text: 'Nyeri yang mirip kram haid, kadang lebih kuat, dapat menyertai tahap ini.',
      },
      {
        title: 'Durasi yang bervariasi',
        text: 'Pemulihan fisik biasanya berlangsung beberapa hari sampai beberapa minggu.',
      },
    ],
    section3Body: 'Tubuhmu umumnya butuh beberapa minggu untuk memulihkan keseimbangan hormon setelah keguguran. Siklus bisa kembali paling cepat 4 sampai 6 minggu, tetapi setiap perjalanan berbeda.',
    comfortTips: [
      {
        title: 'Izinkan dirimu beristirahat',
        text: 'Tubuhmu butuh waktu untuk menemukan keseimbangannya kembali, tanpa tekanan untuk mencapai hasil tertentu.',
      },
      {
        title: 'Cukupi asupan air',
        text: 'Asupan air yang baik secara alami mendukung pemulihan.',
      },
      {
        title: 'Dengarkan tubuhmu',
        text: 'Setiap perjalanan berbeda: jalani dengan kecepatanmu sendiri, tanpa membandingkan diri dengan orang lain.',
      },
    ],
    section4Body: 'Pemeriksaan medis membantu memastikan bahwa semuanya berjalan normal, sehingga kamu bisa benar-benar tenang. Pertemuan ini juga kesempatan untuk menanyakan semua pertanyaanmu.',
    infoCard2Title: 'Apa saja yang bisa tercakup dalam pertemuan ini',
    infoCard2Text: 'Percakapan tentang apa yang telah kamu alami, pemeriksaan bila diperlukan, dan ruang untuk menjawab pertanyaanmu tentang langkah selanjutnya.',
    section5Body: 'Jika salah satu tanda ini muncul, penting untuk segera menghubungi tenaga kesehatan.',
    warningTitle: 'Tanda yang memerlukan saran medis',
    warningSigns: [
      'Demam atau kondisi umum yang memburuk',
      'Perdarahan yang sangat deras (perlu mengganti pembalutmu dalam waktu kurang dari satu jam)',
      'Nyeri hebat yang tidak membaik',
      'Bau yang tidak biasa',
    ],
    tipTitle: 'Perlu diketahui',
    tipText: 'Merawat tubuhmu bukan berarti mengendalikan segalanya: terutama berarti memberi dirimu waktu yang kamu butuhkan.',
    summaryPoints: [
      'Keguguran tidak disebabkan oleh sesuatu yang kamu lakukan atau tidak kamu lakukan.',
      'Tubuhmu umumnya butuh beberapa minggu untuk memulihkan keseimbangan hormon.',
      'Siklus bisa kembali paling cepat 4 sampai 6 minggu, tetapi setiap perjalanan berbeda.',
      'Pemeriksaan medis memungkinkanmu memastikan bahwa semuanya berjalan normal, sehingga kamu bisa benar-benar tenang.',
    ],
    disclaimerText: 'Konten informatif. Artikel ini tidak menggantikan saran atau pemeriksaan medis. Jika ragu atau mengalami gejala yang mengkhawatirkan, mintalah saran dari tenaga kesehatan.',
    shareMessage: 'Pemulihan fisik setelah keguguran — AWA',
  },
  hi: {
    badge: 'गर्भपात के बाद • रिकवरी',
    title: 'गर्भपात के बाद \nशारीरिक रिकवरी',
    metaDuration: '7 मिनट में पढ़ें',
    metaType: 'लेख',
    metaLevel: 'शुरुआती',
    metaValidated: 'जानकारी के लिए सामग्री',
    intro: 'आपके शरीर को फिर से संतुलन पाने में समय लगता है। यहाँ वे बातें हैं जो इस दौर को धीरे-धीरे बेहतर ढंग से समझने में आपकी मदद कर सकती हैं।',
    contentsTitle: 'इस लेख में',
    topics: [
      'गर्भपात क्या है?',
      'शारीरिक रूप से क्या हो सकता है',
      'आपके चक्र की वापसी',
      'तसल्ली देने वाली डॉक्टरी जाँच',
      'चिकित्सकीय मदद कब लें',
      'मुख्य बातें',
    ],
    section1Body1: 'गर्भपात (अपने आप हुआ) गर्भावस्था का अपने आप समाप्त हो जाना है, जो ज़्यादातर 12वें से 14वें हफ़्ते से पहले होता है। अनुमान है कि पुष्टि हुई छह से सात गर्भावस्थाओं में से एक इसी तरह समाप्त होती है, ज़्यादातर गर्भावस्था की शुरुआत में।',
    section1Body2: 'यह दुर्लभ नहीं है, और न ही यह भविष्य में प्रजनन क्षमता की किसी समस्या का संकेत है। ज़्यादातर मामलों में यह ऐसी वजहों से जुड़ा होता है जो किसी के बस में नहीं होतीं, जैसे विकास के दौरान संयोग से हुई कोई क्रोमोज़ोम संबंधी गड़बड़ी।',
    infoCard1Title: 'ज़रूरी बात',
    infoCard1Text: 'गर्भपात इसलिए नहीं होता कि आपने कुछ किया या नहीं किया। जो हुआ, उसके लिए आप ज़िम्मेदार नहीं हैं।',
    section2Body: 'हर महिला का अनुभव अलग होता है। सबसे आम संकेत ये हैं:',
    physicalSigns: [
      {
        title: 'रक्तस्राव',
        text: 'इसकी मात्रा और अवधि स्थिति के अनुसार अलग हो सकती है, फिर यह धीरे-धीरे कम होता जाता है।',
      },
      {
        title: 'ऐंठन',
        text: 'इस दौर में पीरियड की ऐंठन जैसा दर्द हो सकता है, कभी-कभी उससे ज़्यादा तेज़ भी।',
      },
      {
        title: 'अलग-अलग अवधि',
        text: 'शारीरिक रिकवरी में आम तौर पर कुछ दिनों से लेकर कुछ हफ़्ते लगते हैं।',
      },
    ],
    section3Body: 'गर्भपात के बाद शरीर को हॉर्मोनल संतुलन वापस पाने में आम तौर पर कुछ हफ़्ते लगते हैं। चक्र 4 से 6 हफ़्तों में ही लौट सकता है, लेकिन हर किसी का सफ़र अलग होता है।',
    comfortTips: [
      {
        title: 'ख़ुद को आराम करने दें',
        text: 'आपके शरीर को फिर से संतुलन पाने के लिए समय चाहिए, किसी ख़ास नतीजे को पाने के दबाव के बिना।',
      },
      {
        title: 'भरपूर पानी पिएँ',
        text: 'अच्छा हाइड्रेशन रिकवरी में स्वाभाविक रूप से मदद करता है।',
      },
      {
        title: 'अपने शरीर की सुनें',
        text: 'हर सफ़र अलग होता है। अपनी रफ़्तार से चलें, दूसरों से अपनी तुलना किए बिना।',
      },
    ],
    section4Body: 'डॉक्टरी जाँच से यह पक्का करने में मदद मिलती है कि सब कुछ सामान्य रूप से आगे बढ़ रहा है, और आपको पूरी तसल्ली मिलती है। यह मुलाक़ात आपके सारे सवाल पूछने का मौक़ा भी है।',
    infoCard2Title: 'इस मुलाक़ात में क्या शामिल हो सकता है',
    infoCard2Text: 'आपने जो झेला उस पर बातचीत, ज़रूरत हो तो जाँच, और आगे क्या होगा इसके बारे में आपके सवालों के जवाब देने की जगह।',
    section5Body: 'अगर इनमें से कोई भी संकेत दिखे, तो तुरंत किसी स्वास्थ्य विशेषज्ञ से संपर्क करना ज़रूरी है।',
    warningTitle: 'ऐसे संकेत जिनमें चिकित्सकीय सलाह ज़रूरी है',
    warningSigns: [
      'बुखार या सामान्य हालत का बिगड़ना',
      'बहुत ज़्यादा रक्तस्राव (एक घंटे से कम में पैड या कपड़ा बदलने की ज़रूरत पड़ना)',
      'तेज़ दर्द जो ठीक न हो',
      'असामान्य बदबू',
    ],
    tipTitle: 'जानना अच्छा रहेगा',
    tipText: 'अपने शरीर का ख़याल रखने का मतलब हर चीज़ पर नियंत्रण रखना नहीं है। इसका मुख्य मतलब है ख़ुद को वह समय देना जिसकी आपको ज़रूरत है।',
    summaryPoints: [
      'गर्भपात इसलिए नहीं होता कि आपने कुछ किया या नहीं किया।',
      'शरीर को हॉर्मोनल संतुलन वापस पाने में आम तौर पर कुछ हफ़्ते लगते हैं।',
      'चक्र 4 से 6 हफ़्तों में ही लौट सकता है, लेकिन हर किसी का सफ़र अलग होता है।',
      'डॉक्टरी जाँच से आप पक्का कर सकती हैं कि सब कुछ सामान्य रूप से आगे बढ़ रहा है, और आपको पूरी तसल्ली मिलती है।',
    ],
    disclaimerText: 'जानकारी के लिए सामग्री। यह लेख चिकित्सकीय सलाह या जाँच का विकल्प नहीं है। संदेह होने पर या चिंताजनक लक्षण दिखने पर किसी स्वास्थ्य विशेषज्ञ से सलाह लें।',
    shareMessage: 'गर्भपात के बाद शारीरिक रिकवरी — AWA',
  },
  sq: {
    badge: 'PAS NJË ABORTI SPONTAN • RIMËKËMBJA',
    title: 'Rimëkëmbja fizike pas \nnjë aborti spontan',
    metaDuration: '7 min lexim',
    metaType: 'Artikull',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje informuese',
    intro: 'Trupi yt ka nevojë për kohë që të gjejë sërish ekuilibrin. Ja çfarë mund të të ndihmojë ta kuptosh më mirë këtë etapë, me butësi.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Çfarë është aborti spontan?',
      'Çfarë mund të ndodhë fizikisht',
      'Rikthimi i ciklit tënd',
      'Një kontroll mjekësor qetësues',
      'Kur duhet kërkuar kujdes mjekësor',
      'Çfarë të mbash mend',
    ],
    section1Body1: 'Aborti spontan është mbarimi spontan i një shtatzënie, më shpesh para javës së 12-të deri në të 14-tën. Vlerësohet se një në gjashtë deri në shtatë shtatzëni të konfirmuara mbaron kështu, më shpesh herët në shtatzëni.',
    section1Body2: 'Nuk është i rrallë dhe nuk është shenjë e një problemi të ardhshëm të pjellorisë. Në shumicën dërrmuese të rasteve lidhet me faktorë që janë jashtë kontrollit të askujt, si një anomali kromozomike që ka ndodhur rastësisht gjatë zhvillimit.',
    infoCard1Title: 'Pika kryesore',
    infoCard1Text: 'Një abort spontan nuk shkaktohet nga diçka që ke bërë ose nuk ke bërë. Nuk je përgjegjëse për atë që ndodhi.',
    section2Body: 'Çdo përvojë është e ndryshme nga një person te tjetri. Ja shenjat më të zakonshme:',
    physicalSigns: [
      {
        title: 'Gjakderdhje',
        text: 'Intensiteti dhe kohëzgjatja e saj mund të ndryshojnë sipas situatës, pastaj ulet gradualisht.',
      },
      {
        title: 'Kramba',
        text: 'Një dhimbje e ngjashme me krambat e menstruacioneve, ndonjëherë më e fortë, mund ta shoqërojë këtë etapë.',
      },
      {
        title: 'Një kohëzgjatje e ndryshueshme',
        text: 'Rimëkëmbja fizike zgjat zakonisht nga disa ditë deri në disa javë.',
      },
    ],
    section3Body: 'Trupit tënd zakonisht i duhen disa javë që të gjejë sërish ekuilibrin hormonal pas një aborti spontan. Një cikël mund të kthehet që pas 4 deri në 6 javësh, por çdo rrugëtim është ndryshe.',
    comfortTips: [
      {
        title: 'Lejoji vetes të pushosh',
        text: 'Trupi yt ka nevojë për kohë që të gjejë sërish ekuilibrin, pa presion për të arritur ndonjë rezultat të caktuar.',
      },
      {
        title: 'Hidratohu mirë',
        text: 'Hidratimi i mirë e mbështet rimëkëmbjen në mënyrë natyrale.',
      },
      {
        title: 'Dëgjo trupin tënd',
        text: 'Çdo rrugëtim është ndryshe: ec me ritmin tënd, pa u krahasuar me të tjerat.',
      },
    ],
    section4Body: 'Një kontroll mjekësor ndihmon të konfirmohet që gjithçka po ecën normalisht, me qetësi të plotë. Ky takim është edhe një rast për të bërë të gjitha pyetjet e tua.',
    infoCard2Title: 'Çfarë mund të përfshijë ky takim',
    infoCard2Text: 'Një bisedë për atë që ke përjetuar, një ekzaminim nëse është e nevojshme dhe hapësirë për t’iu përgjigjur pyetjeve të tua për atë që vjen më pas.',
    section5Body: 'Nëse shfaqet ndonjë nga këto shenja, është e rëndësishme të kontaktosh menjëherë një profesionist të shëndetësisë.',
    warningTitle: 'Shenja që kërkojnë këshillë mjekësore',
    warningSigns: [
      'Ethe ose përkeqësim i gjendjes së përgjithshme',
      'Gjakderdhje shumë e bollshme (të duhet ta ndërrosh mbrojtësen në më pak se një orë)',
      'Dhimbje e fortë që nuk përmirësohet',
      'Një erë e pazakontë',
    ],
    tipTitle: 'Mirë është ta dish',
    tipText: 'Kujdesi për trupin tënd nuk do të thotë të kontrollosh gjithçka: do të thotë kryesisht t’i japësh vetes kohën që të nevojitet.',
    summaryPoints: [
      'Një abort spontan nuk shkaktohet nga diçka që ke bërë ose nuk ke bërë.',
      'Trupit tënd zakonisht i duhen disa javë që të gjejë sërish ekuilibrin hormonal.',
      'Një cikël mund të kthehet që pas 4 deri në 6 javësh, por çdo rrugëtim është ndryshe.',
      'Një kontroll mjekësor të lejon të konfirmosh që gjithçka po ecën normalisht, me qetësi të plotë.',
    ],
    disclaimerText: 'Përmbajtje informuese. Ky artikull nuk zëvendëson këshillën ose ekzaminimin mjekësor. Në rast dyshimi ose simptomash shqetësuese, kërko këshillë nga një profesionist i shëndetësisë.',
    shareMessage: 'Rimëkëmbja fizike pas një aborti spontan — AWA',
  },
  ja: {
    badge: '流産後 • 回復',
    title: '流産後の\n体の回復',
    metaDuration: '読了目安7分',
    metaType: '記事',
    metaLevel: '初級',
    metaValidated: '情報提供を目的とした内容',
    intro: '体がバランスを取り戻すには時間が必要です。この時期を、やさしく理解するための情報をお伝えします。',
    contentsTitle: 'この記事の内容',
    topics: [
      '流産とは',
      '体に起こりうること',
      '周期の再開',
      '安心のための診察',
      '医療機関を受診するタイミング',
      '重要なポイント',
    ],
    section1Body1: '流産とは、妊娠が自然に終わることで、多くは妊娠12〜14週より前に起こります。確認された妊娠の6〜7回に1回はこのように終わると推定されており、そのほとんどは妊娠初期に起こります。',
    section1Body2: '流産は珍しいことではなく、将来の妊娠しやすさに問題があるサインでもありません。大多数のケースでは、誰にもコントロールできない要因によるもので、たとえば発育の過程で偶然に起こった染色体の異常などが挙げられます。',
    infoCard1Title: 'ポイント',
    infoCard1Text: '流産は、あなたがしたこと、あるいはしなかったことが原因で起こるものではありません。起きたことに、あなたの責任はありません。',
    section2Body: '経験は人それぞれ異なります。最もよく見られるサインは次のとおりです。',
    physicalSigns: [
      {
        title: '出血',
        text: '量や期間は状況によって異なり、その後少しずつ減っていきます。',
      },
      {
        title: '下腹部の痛み',
        text: 'この時期には、生理痛に似た痛みが出ることがあり、ときにはより強く感じることもあります。',
      },
      {
        title: '期間には幅があります',
        text: '体の回復には、通常、数日から数週間かかります。',
      },
    ],
    section3Body: '流産のあと、体がホルモンバランスを取り戻すまでには、一般的に数週間かかります。周期は早ければ4〜6週間で戻ることがありますが、道のりは人それぞれです。',
    comfortTips: [
      {
        title: '休むことを自分に許す',
        text: '体がバランスを取り戻すには時間が必要です。何かを達成しなければというプレッシャーを感じる必要はありません。',
      },
      {
        title: '水分をしっかりとる',
        text: '十分な水分補給は、自然と回復を支えてくれます。',
      },
      {
        title: '体の声に耳を傾ける',
        text: '道のりは人それぞれです。他の人と比べず、自分のペースで進んでください。',
      },
    ],
    section4Body: '診察を受けると、すべてが順調に経過していることを確認でき、すっかり安心できます。この診察は、疑問をすべて尋ねる機会にもなります。',
    infoCard2Title: 'この診察で行われること',
    infoCard2Text: '経験されたことについての会話、必要に応じた診察、そしてこれからのことについての疑問に答える時間があります。',
    section5Body: '次のようなサインが現れたら、すぐに医療従事者に連絡することが大切です。',
    warningTitle: '医師に相談したいサイン',
    warningSigns: [
      '発熱、または全身状態の悪化',
      '非常に多い出血（1時間もたたずにナプキンなどの交換が必要になる）',
      '改善しない強い痛み',
      'いつもと違うにおい',
    ],
    tipTitle: '知っておきたいこと',
    tipText: '体をいたわることは、すべてをコントロールすることではありません。何よりも、必要な時間を自分に与えることです。',
    summaryPoints: [
      '流産は、あなたがしたこと、あるいはしなかったことが原因で起こるものではありません。',
      '体がホルモンバランスを取り戻すには、一般的に数週間かかります。',
      '周期は早ければ4〜6週間で戻ることがありますが、道のりは人それぞれです。',
      '診察を受けることで、すべてが順調に経過していることを確認でき、すっかり安心できます。',
    ],
    disclaimerText: '情報提供を目的とした内容です。この記事は、医師のアドバイスや診察に代わるものではありません。気になることがある場合や心配な症状がある場合は、医療従事者に相談してください。',
    shareMessage: '流産後の体の回復 — AWA',
  },
} as const;

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

/* -------------------------------------------------------------------------- */
/* SCREEN                                                                     */
/* -------------------------------------------------------------------------- */

export default function MiscarriagePhysicalRecoveryArticleScreen({
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

          <AwaText variant="titleSmall" colorRole="onSurfaceVariant" style={styles.intro}>{content.intro}</AwaText>

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

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section1Body1}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section1Body2}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.infoCard}>
            <MaterialDesignIcons
              name="information-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <AwaText variant="titleSmall" emphasized>{content.infoCard1Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.infoText}>{content.infoCard1Text}</AwaText>
            </View>
          </AwaCard>

          {/* ================================================================= */}
          {/* SECTION 2                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>2. {content.topics[1]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section2Body}</AwaText>

          <View style={styles.normalGrid}>
            {content.physicalSigns.map((item, index) => (
              <AwaCard variant="filled" padding="none" key={item.title} style={styles.normalCard}>
                <View style={styles.normalIcon}>
                  <MaterialDesignIcons
                    name={PHYSICAL_SIGNS_ICONS[index] as never}
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>

                <AwaText variant="titleSmall" emphasized style={styles.normalTitle}>{item.title}</AwaText>
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.normalText}>{item.text}</AwaText>
              </AwaCard>
            ))}
          </View>

          {/* ================================================================= */}
          {/* SECTION 3                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.topics[2]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section3Body}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.comfortCard}>
            {content.comfortTips.map((item, index) => (
              <View
                key={item.title}
                style={[
                  styles.comfortRow,
                  index < content.comfortTips.length - 1 && styles.comfortRowBorder,
                ]}>
                <View style={styles.comfortIcon}>
                  <MaterialDesignIcons
                    name={COMFORT_TIPS_ICONS[index] as never}
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
          {/* SECTION 4                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.topics[3]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section4Body}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.infoCard}>
            <MaterialDesignIcons
              name="stethoscope"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <AwaText variant="titleSmall" emphasized>{content.infoCard2Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.infoText}>{content.infoCard2Text}</AwaText>
            </View>
          </AwaCard>

          {/* ================================================================= */}
          {/* SECTION 5                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>5. {content.topics[4]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section5Body}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <MaterialDesignIcons
                name="alert-circle-outline"
                size={22}
                color={theme.colors.warning}
              />

              <AwaText variant="titleSmall" emphasized style={styles.warningTitle}>{content.warningTitle}</AwaText>
            </View>

            {content.warningSigns.map(item => (
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
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>{content.tipText}</AwaText>
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

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.summaryText}>{item}</AwaText>
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

            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.disclaimerText}>{content.disclaimerText}</AwaText>
          </View>
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={7} scrollRef={scrollRef} />
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
