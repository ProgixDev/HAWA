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
import {withBrazilianPortuguese} from '../../i18n/ptBrEditorial';

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

const CONTENT = withBrazilianPortuguese('MiscarriagePhysicalRecovery', {
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
  ko: {
    badge: '유산 후 • 회복',
    title: '유산 후\n몸의 회복',
    metaDuration: '읽는 데 7분',
    metaType: '아티클',
    metaLevel: '입문',
    metaValidated: '정보 제공용 콘텐츠',
    intro: '몸이 다시 균형을 찾기까지는 시간이 필요해요. 이 시기를 천천히 이해하는 데 도움이 될 만한 내용을 알려 드려요.',
    contentsTitle: '이 아티클에서 다루는 내용',
    topics: [
      '유산이란?',
      '몸에서 일어날 수 있는 일',
      '주기의 재개',
      '안심할 수 있는 진료',
      '진료를 받아야 할 때',
      '핵심 정리',
    ],
    section1Body1: '유산은 임신이 저절로 끝나는 것으로, 대부분 임신 12~14주 이전에 일어나요. 확인된 임신 6~7건 중 1건이 이렇게 끝나는 것으로 추정되며, 대부분 임신 초기에 일어나요.',
    section1Body2: '드문 일이 아니며, 앞으로 임신 가능성에 문제가 있다는 신호도 아니에요. 대부분은 발달 과정에서 우연히 생긴 염색체 이상처럼 누구도 통제할 수 없는 요인과 관련이 있어요.',
    infoCard1Title: '핵심',
    infoCard1Text: '유산은 내가 한 일이나 하지 않은 일 때문에 생기는 것이 아니에요. 일어난 일은 내 책임이 아니에요.',
    section2Body: '겪는 경험은 사람마다 달라요. 가장 흔한 신호는 다음과 같아요.',
    physicalSigns: [
      {
        title: '출혈',
        text: '양과 기간은 상황에 따라 다를 수 있고, 이후 점차 줄어들어요.',
      },
      {
        title: '경련성 통증',
        text: '생리통과 비슷하거나 때로는 더 강한 통증이 이 시기에 함께 나타날 수 있어요.',
      },
      {
        title: '사람마다 다른 기간',
        text: '몸의 회복은 보통 며칠에서 몇 주까지 걸려요.',
      },
    ],
    section3Body: '유산 후 호르몬 균형이 돌아오기까지는 보통 몇 주가 걸려요. 빠르면 4~6주 만에 주기가 돌아올 수 있지만, 사람마다 과정은 달라요.',
    comfortTips: [
      {
        title: '충분히 쉬어도 괜찮아요',
        text: '몸이 다시 균형을 찾기까지는 시간이 필요해요. 어떤 결과를 내야 한다는 부담은 갖지 않아도 돼요.',
      },
      {
        title: '수분을 충분히 섭취해요',
        text: '충분한 수분 섭취는 자연스럽게 회복에 도움이 돼요.',
      },
      {
        title: '몸의 소리에 귀 기울여요',
        text: '과정은 모두 달라요. 다른 사람과 비교하지 말고 나만의 속도로 나아가세요.',
      },
    ],
    section4Body: '진료를 받으면 모든 것이 정상적으로 진행되고 있는지 확인할 수 있어 마음이 훨씬 놓여요. 이 진료는 궁금한 점을 모두 물어볼 기회이기도 해요.',
    infoCard2Title: '이 진료에서 하는 일',
    infoCard2Text: '겪은 일에 대한 대화, 필요하면 검진, 그리고 앞으로의 일에 대한 질문에 답할 수 있는 시간이 포함될 수 있어요.',
    section5Body: '다음 중 어느 하나라도 나타나면 바로 의료 전문가에게 연락하는 것이 중요해요.',
    warningTitle: '의료 전문가의 조언이 필요한 신호',
    warningSigns: [
      '열이 나거나 전반적인 상태가 나빠짐',
      '매우 많은 출혈(1시간도 안 되어 생리용품을 갈아야 하는 경우)',
      '나아지지 않는 심한 통증',
      '평소와 다른 냄새',
    ],
    tipTitle: '알아 두면 좋아요',
    tipText: '몸을 돌본다는 것은 모든 것을 통제한다는 뜻이 아니에요. 무엇보다 필요한 시간을 스스로에게 주는 것을 뜻해요.',
    summaryPoints: [
      '유산은 내가 한 일이나 하지 않은 일 때문에 생기는 것이 아니에요.',
      '호르몬 균형이 돌아오기까지는 보통 몇 주가 걸려요.',
      '빠르면 4~6주 만에 주기가 돌아올 수 있지만, 사람마다 과정은 달라요.',
      '진료를 받으면 모든 것이 정상적으로 진행되고 있는지 확인하고 마음을 놓을 수 있어요.',
    ],
    disclaimerText: '정보 제공용 콘텐츠예요. 이 아티클은 의학적 조언이나 진찰을 대신하지 않아요. 궁금한 점이 있거나 걱정되는 증상이 있으면 의료 전문가의 조언을 구하세요.',
    shareMessage: '유산 후 몸의 회복 — AWA',
  },
  'pt-PT': {
    badge: 'APÓS UM ABORTO ESPONTÂNEO • RECUPERAÇÃO',
    title: 'Recuperação física após \num aborto espontâneo',
    metaDuration: '7 min de leitura',
    metaType: 'Artigo',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo informativo',
    intro: 'O seu corpo precisa de tempo para reencontrar o equilíbrio. Eis o que pode ajudá-la a compreender melhor esta fase, com delicadeza.',
    contentsTitle: 'Neste artigo',
    topics: [
      'O que é um aborto espontâneo?',
      'O que pode acontecer fisicamente',
      'O regresso do seu ciclo',
      'Uma consulta médica tranquilizadora',
      'Quando procurar cuidados médicos',
      'Pontos essenciais',
    ],
    section1Body1: 'Um aborto espontâneo é o fim espontâneo de uma gravidez, na maioria das vezes antes das 12.ª a 14.ª semanas. Estima-se que uma em cada seis a sete gravidezes confirmadas termina desta forma, na maior parte das vezes no início da gravidez.',
    section1Body2: 'Não é raro, nem é sinal de um futuro problema de fertilidade. Na grande maioria dos casos, está ligado a fatores que ninguém pode controlar, como uma anomalia cromossómica ocorrida por acaso durante o desenvolvimento.',
    infoCard1Title: 'Ponto essencial',
    infoCard1Text: 'Um aborto espontâneo não é causado por nada do que fez ou não fez. Não é responsável pelo que aconteceu.',
    section2Body: 'Cada experiência é diferente de pessoa para pessoa. Eis os sinais mais frequentes:',
    physicalSigns: [
      {
        title: 'Hemorragia',
        text: 'A sua intensidade e duração podem variar consoante a situação, diminuindo depois gradualmente.',
      },
      {
        title: 'Cólicas',
        text: 'Uma dor semelhante às cólicas menstruais, por vezes mais intensa, pode acompanhar esta fase.',
      },
      {
        title: 'Uma duração variável',
        text: 'A recuperação física estende-se geralmente por alguns dias a algumas semanas.',
      },
    ],
    section3Body: 'O seu corpo demora geralmente algumas semanas a recuperar o equilíbrio hormonal após um aborto espontâneo. Um ciclo pode regressar logo às 4 a 6 semanas, mas cada percurso é diferente.',
    comfortTips: [
      {
        title: 'Permita-se descansar',
        text: 'O seu corpo precisa de tempo para reencontrar o equilíbrio, sem pressão para alcançar um resultado em particular.',
      },
      {
        title: 'Mantenha-se bem hidratada',
        text: 'Uma boa hidratação apoia naturalmente a recuperação.',
      },
      {
        title: 'Escute o seu corpo',
        text: 'Cada percurso é diferente: avance ao seu ritmo, sem se comparar com as outras.',
      },
    ],
    section4Body: 'Uma consulta médica ajuda a confirmar que tudo está a evoluir normalmente, com total tranquilidade. Esta consulta é também uma oportunidade para colocar todas as suas questões.',
    infoCard2Title: 'O que esta consulta pode incluir',
    infoCard2Text: 'Uma conversa sobre o que viveu, um exame se necessário e espaço para responder às suas questões sobre o que se segue.',
    section5Body: 'Se surgir algum destes sinais, é importante contactar de imediato um profissional de saúde.',
    warningTitle: 'Sinais que exigem aconselhamento médico',
    warningSigns: [
      'Febre ou agravamento do estado geral',
      'Hemorragia muito abundante (necessidade de mudar a proteção em menos de uma hora)',
      'Dor intensa que não melhora',
      'Um odor invulgar',
    ],
    tipTitle: 'Bom saber',
    tipText: 'Cuidar do seu corpo não significa controlar tudo: significa sobretudo dar-se o tempo de que precisa.',
    summaryPoints: [
      'Um aborto espontâneo não é causado por nada do que fez ou não fez.',
      'O seu corpo demora geralmente algumas semanas a recuperar o equilíbrio hormonal.',
      'Um ciclo pode regressar logo às 4 a 6 semanas, mas cada percurso é diferente.',
      'Uma consulta médica permite-lhe confirmar que tudo está a evoluir normalmente, com total tranquilidade.',
    ],
    disclaimerText: 'Conteúdo informativo. Este artigo não substitui o aconselhamento nem o exame médico. Em caso de dúvida ou de sintomas preocupantes, procure o aconselhamento de um profissional de saúde.',
    shareMessage: 'Recuperação física após um aborto espontâneo — AWA',
  },
  bn: {
    badge: 'গর্ভপাতের পর • সুস্থ হয়ে ওঠা',
    title: 'গর্ভপাতের পর\nশারীরিক সুস্থতা',
    metaDuration: '7 মিনিটের পাঠ',
    metaType: 'নিবন্ধ',
    metaLevel: 'নতুনদের জন্য',
    metaValidated: 'তথ্যমূলক বিষয়বস্তু',
    intro: 'আপনার শরীরের ভারসাম্য ফিরে পেতে সময় লাগে। এই পর্যায়টি আরও ভালোভাবে বুঝতে কী সাহায্য করতে পারে, তা এখানে আলতোভাবে বলা হলো।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'গর্ভপাত কী?',
      'শারীরিকভাবে কী হতে পারে',
      'আপনার চক্র ফিরে আসা',
      'আশ্বস্ত করার মতো একটি চিকিৎসা পরীক্ষা',
      'কখন চিকিৎসা সহায়তা নেবেন',
      'মূল কথা',
    ],
    section1Body1: 'গর্ভপাত হলো গর্ভাবস্থার স্বতঃস্ফূর্ত সমাপ্তি, যা বেশিরভাগ ক্ষেত্রে 12তম থেকে 14তম সপ্তাহের আগে ঘটে। অনুমান করা হয় নিশ্চিত হওয়া প্রতি ছয় থেকে সাতটি গর্ভাবস্থার একটি এভাবে শেষ হয়, বেশিরভাগ ক্ষেত্রে গর্ভাবস্থার শুরুর দিকে।',
    section1Body2: 'এটি বিরল নয়, আবার ভবিষ্যতে প্রজনন ক্ষমতার সমস্যার লক্ষণও নয়। অধিকাংশ ক্ষেত্রে এটি কারও নিয়ন্ত্রণের বাইরের কারণের সঙ্গে যুক্ত, যেমন বিকাশের সময় আকস্মিকভাবে ঘটে যাওয়া ক্রোমোজোমের অস্বাভাবিকতা।',
    infoCard1Title: 'মূল কথা',
    infoCard1Text: 'আপনি যা করেছেন বা করেননি, তার কারণে গর্ভপাত হয় না। যা ঘটেছে তার জন্য আপনি দায়ী নন।',
    section2Body: 'প্রতিটি অভিজ্ঞতা একেক জনের একেক রকম। সবচেয়ে সাধারণ লক্ষণগুলো হলো:',
    physicalSigns: [
      {
        title: 'রক্তপাত',
        text: 'এর তীব্রতা ও সময়কাল পরিস্থিতি অনুযায়ী ভিন্ন হতে পারে, তারপর ধীরে ধীরে কমে আসে।',
      },
      {
        title: 'পেটে মোচড়ানো ব্যথা',
        text: 'মাসিকের ব্যথার মতো, কখনো কখনো আরও তীব্র ব্যথা এই পর্যায়ে হতে পারে।',
      },
      {
        title: 'পরিবর্তনশীল সময়কাল',
        text: 'শারীরিকভাবে সুস্থ হতে সাধারণত কয়েক দিন থেকে কয়েক সপ্তাহ লাগে।',
      },
    ],
    section3Body: 'গর্ভপাতের পর আপনার শরীরের হরমোনের ভারসাম্য ফিরে পেতে সাধারণত কয়েক সপ্তাহ লাগে। চক্র 4 থেকে 6 সপ্তাহের মধ্যেই ফিরে আসতে পারে, তবে প্রত্যেকের যাত্রা আলাদা।',
    comfortTips: [
      {
        title: 'নিজেকে বিশ্রাম নিতে দিন',
        text: 'আপনার শরীরের ভারসাম্য ফিরে পেতে সময় লাগে, কোনো নির্দিষ্ট ফলাফল অর্জনের চাপ ছাড়াই।',
      },
      {
        title: 'পর্যাপ্ত পানি পান করুন',
        text: 'ভালোভাবে পানি পান স্বাভাবিকভাবেই সুস্থ হয়ে ওঠায় সহায়তা করে।',
      },
      {
        title: 'নিজের শরীরের কথা শুনুন',
        text: 'প্রত্যেকের যাত্রা আলাদা: অন্যদের সঙ্গে নিজেকে তুলনা না করে নিজের গতিতে এগোন।',
      },
    ],
    section4Body: 'একটি চিকিৎসা পরীক্ষা নিশ্চিত করতে সাহায্য করে যে সবকিছু স্বাভাবিকভাবে এগোচ্ছে, যাতে আপনি পুরোপুরি নিশ্চিন্ত থাকতে পারেন। এই সাক্ষাৎ আপনার সব প্রশ্ন করারও একটি সুযোগ।',
    infoCard2Title: 'এই সাক্ষাতে যা থাকতে পারে',
    infoCard2Text: 'আপনি যা পার করে এসেছেন তা নিয়ে আলোচনা, প্রয়োজনে একটি পরীক্ষা এবং এরপর কী হবে সে বিষয়ে আপনার প্রশ্নের উত্তর দেওয়ার সুযোগ।',
    section5Body: 'এই লক্ষণগুলোর কোনোটি দেখা দিলে অবিলম্বে স্বাস্থ্যসেবা পেশাজীবীর সঙ্গে যোগাযোগ করা গুরুত্বপূর্ণ।',
    warningTitle: 'যেসব লক্ষণে চিকিৎসা পরামর্শ প্রয়োজন',
    warningSigns: [
      'জ্বর বা সার্বিক অবস্থার অবনতি',
      'অত্যন্ত বেশি রক্তপাত (এক ঘণ্টার কম সময়ে প্যাড বা সুরক্ষা বদলাতে হওয়া)',
      'তীব্র ব্যথা যা কমছে না',
      'অস্বাভাবিক দুর্গন্ধ',
    ],
    tipTitle: 'জেনে রাখা ভালো',
    tipText: 'নিজের শরীরের যত্ন নেওয়ার অর্থ সবকিছু নিয়ন্ত্রণ করা নয়: এর মূল অর্থ নিজেকে প্রয়োজনীয় সময়টুকু দেওয়া।',
    summaryPoints: [
      'আপনি যা করেছেন বা করেননি, তার কারণে গর্ভপাত হয় না।',
      'হরমোনের ভারসাম্য ফিরে পেতে আপনার শরীরের সাধারণত কয়েক সপ্তাহ লাগে।',
      'চক্র 4 থেকে 6 সপ্তাহের মধ্যেই ফিরে আসতে পারে, তবে প্রত্যেকের যাত্রা আলাদা।',
      'একটি চিকিৎসা পরীক্ষায় আপনি নিশ্চিত হতে পারেন যে সবকিছু স্বাভাবিকভাবে এগোচ্ছে, পুরোপুরি নিশ্চিন্তে।',
    ],
    disclaimerText: 'তথ্যমূলক বিষয়বস্তু। এই নিবন্ধ চিকিৎসা পরামর্শ বা পরীক্ষার বিকল্প নয়। সন্দেহ থাকলে বা উদ্বেগজনক উপসর্গ দেখা দিলে স্বাস্থ্যসেবা পেশাজীবীর পরামর্শ নিন।',
    shareMessage: 'গর্ভপাতের পর শারীরিক সুস্থতা — AWA',
  },
  da: {
    badge: 'EFTER ABORT • RESTITUTION',
    title: 'Fysisk restitution\nefter en abort',
    metaDuration: '7 min læsning',
    metaType: 'Artikel',
    metaLevel: 'Begynderniveau',
    metaValidated: 'Informativt indhold',
    intro: 'Din krop har brug for tid til at genoprette balancen. Her er en blid forklaring på, hvad der kan hjælpe dig med at forstå denne fase bedre.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvad er en abort?',
      'Hvad der kan ske fysisk',
      'Din cyklus vender tilbage',
      'En beroligende medicinsk kontrol',
      'Hvornår du skal søge lægehjælp',
      'Vigtige pointer',
    ],
    section1Body1: 'En abort er en spontan afslutning af en graviditet, der oftest sker inden den 12. til 14. uge. Det anslås, at en ud af seks til syv bekræftede graviditeter ender på denne måde, oftest tidligt i graviditeten.',
    section1Body2: 'Det er ikke sjældent, og det er heller ikke et tegn på fremtidige fertilitetsproblemer. I de fleste tilfælde er det forbundet med årsager uden for nogens kontrol, som kromosomafvigelser, der opstår tilfældigt under udviklingen.',
    infoCard1Title: 'Vigtig information',
    infoCard1Text: 'En abort skyldes ikke noget, du har gjort eller undladt at gøre. Du er ikke ansvarlig for det, der skete.',
    section2Body: 'Enhver oplevelse er forskellig. De mest almindelige tegn er:',
    physicalSigns: [
      {
        title: 'Blødning',
        text: 'Dens intensitet og varighed kan variere afhængigt af situationen, og den aftager derefter gradvist.',
      },
      {
        title: 'Mavekramper',
        text: 'Lignende menstruationssmerter, sommetider mere intense, kan forekomme i denne fase.',
      },
      {
        title: 'Varierende varighed',
        text: 'Fysisk restitution tager generelt fra nogle dage til et par uger.',
      },
    ],
    section3Body: 'Efter en abort tager det generelt din krop et par uger at genoprette hormonbalancen. Cyklussen kan vende tilbage inden for 4 til 6 uger, men alles rejse er forskellig.',
    comfortTips: [
      {
        title: 'Tillad dig selv hvile',
        text: 'Din krop har brug for tid til at genoprette balancen, uden pres om at nå et bestemt resultat.',
      },
      {
        title: 'Drik rigeligt med vand',
        text: 'God hydrering understøtter restitutionen naturligt.',
      },
      {
        title: 'Lyt til din krop',
        text: 'Alles rejse er forskellig: gå fremad i dit eget tempo uden at sammenligne dig med andre.',
      },
    ],
    section4Body: 'En medicinsk kontrol hjælper med at bekræfte, at alt forløber normalt, så du kan føle dig helt tryg. Denne aftale er også en mulighed for at stille alle dine spørgsmål.',
    infoCard2Title: 'Hvad denne aftale kan indeholde',
    infoCard2Text: 'En samtale om det, du har gennemgået, eventuelt en undersøgelse, og mulighed for at besvare dine spørgsmål om, hvad der sker herfra.',
    section5Body: 'Det er vigtigt at kontakte en sundhedsprofessionel omgående, hvis du oplever et af disse tegn.',
    warningTitle: 'Tegn der kræver lægehjælp',
    warningSigns: [
      'Feber eller generel forværring af tilstand',
      'Meget kraftig blødning (skift af bind eller beskyttelse mere end én gang i timen)',
      'Intens smerte, der ikke aftager',
      'Usædvanlig ubehagelig lugt',
    ],
    tipTitle: 'Godt at vide',
    tipText: 'At tage sig af sin krop betyder ikke at kontrollere alt: det betyder at give sig selv den nødvendige tid.',
    summaryPoints: [
      'En abort skyldes ikke noget, du har gjort eller undladt at gøre.',
      'Din krop har generelt brug for et par uger til at genoprette hormonbalancen.',
      'Cyklussen kan vende tilbage inden for 4 til 6 uger, men alles rejse er forskellig.',
      'En medicinsk kontrol giver dig sikkerhed for, at alt forløber normalt.',
    ],
    disclaimerText: 'Informativt indhold. Denne artikel erstatter ikke medicinsk rådgivning eller undersøgelse. Konsulter en sundhedsprofessionel ved tvivl eller bekymrende symptomer.',
    shareMessage: 'Fysisk restitution efter en abort — AWA',
  },
  sv: {
    badge: 'EFTER ABORT • RESTITUTION',
    title: 'Fysisk restitution\nefter en abort',
    metaDuration: '7 min läsning',
    metaType: 'Artikel',
    metaLevel: 'Begynderniveau',
    metaValidated: 'Informativt indhold',
    intro: 'Din krop har brug for tid till at genoprette balancen. Her ar en blid forklaring på, hvad der kan hjälpe dig med at forstå denne fase bedre.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvad ar en abort?',
      'Hvad der kan ske fysisk',
      'Din cyklus vender tilbage',
      'En beroligende medicinsk kontrol',
      'Hvornår du skal söge lägehjälp',
      'Vigtige pointer',
    ],
    section1Body1: 'En abort ar en spontan afslutning av en graviditet, der oftest sker inden den 12. till 14. vecka. Det anslås, at en ud av seks till syv bekräftede graviditeter ender på denne måde, oftest tidligt i graviditeten.',
    section1Body2: 'Det ar inte själdent, och det ar heller inte et tegn på fremtidige fertilitetsproblemer. I de fleste tilfälde ar det forbundet med årsager uden for nogens kontrol, som kromosomafvigelser, der opstår tilfäldigt under udviklingen.',
    infoCard1Title: 'Vigtig information',
    infoCard1Text: 'En abort skyldes inte noget, du har gjort eller undladt at göre. Du ar inte ansvarlig for det, der skete.',
    section2Body: 'Enhver oplevelse ar forskellig. De mest almindelige tegn er:',
    physicalSigns: [
      {
        title: 'Blödning',
        text: 'Dens intensitet och varighed kan variere afhängigt av situationen, och den aftager derefter gradvist.',
      },
      {
        title: 'Mavekramper',
        text: 'Lignende menstruationssmerter, sommetider mere intense, kan forekomme i denne fase.',
      },
      {
        title: 'Varierende varighed',
        text: 'Fysisk restitution tager generelt fran nogle dagar till et par veckor.',
      },
    ],
    section3Body: 'Efter en abort tager det generelt din krop et par veckor at genoprette hormonbalancen. Cyklussen kan vende tilbage inden for 4 till 6 veckor, men alles rejse ar forskellig.',
    comfortTips: [
      {
        title: 'Tillad dig selv hvile',
        text: 'Din krop har brug for tid till at genoprette balancen, uden pres om at nå et bestemt resultat.',
      },
      {
        title: 'Drik rigeligt med vand',
        text: 'God hydrering understötter restitutionen naturligt.',
      },
      {
        title: 'Lyt till din krop',
        text: 'Alles rejse ar forskellig: gå fremad i ditt eget tempo uden at sammenligne dig med andre.',
      },
    ],
    section4Body: 'En medicinsk kontrol hjälper med at bekräfte, at alt forlöber normalt, så du kan föle dig helt tryg. Denne aftale ar også en mulighed for att stille alla dina spörgsmål.',
    infoCard2Title: 'Hvad denne aftale kan indeholde',
    infoCard2Text: 'En samtale om det, du har gennemgået, eventuelt en undersögelse, och mulighed for att besvare dina spörgsmål om, hvad der sker herfra.',
    section5Body: 'Det ar vigtigt at kontakte en halsasprofessionel omgående, hvis du oplever et av disse tegn.',
    warningTitle: 'Tegn der kräver lägehjälp',
    warningSigns: [
      'Feber eller generel forvärring av tilstand',
      'Meget kraftig blödning (skift av bind eller beskyttelse mere end én gang i timen)',
      'Intens smerte, der inte aftager',
      'Usädvanlig ubehagelig lugt',
    ],
    tipTitle: 'Godt at vide',
    tipText: 'At tage sig av sin krop betyder inte at kontrollere alt: det betyder at give sig selv den nödvendige tid.',
    summaryPoints: [
      'En abort skyldes inte noget, du har gjort eller undladt at göre.',
      'Din krop har generelt brug for et par veckor till at genoprette hormonbalancen.',
      'Cyklussen kan vende tilbage inden for 4 till 6 veckor, men alles rejse ar forskellig.',
      'En medicinsk kontrol giver dig sikkerhed for, at alt forlöber normalt.',
    ],
    disclaimerText: 'Informativt indhold. Denne artikel erstatter inte medicinsk rådgivning eller undersögelse. Konsulter en halsasprofessionel ved tvivl eller bekymrende symtom.',
    shareMessage: 'Fysisk restitution efter en abort — AWA',
  },
  nb: {
    badge: 'ETTER EN SPONTANABORT • TILFRISKNING',
    title: 'Fysisk tilfriskning etter \nen spontanabort',
    metaDuration: '7 min lesing',
    metaType: 'Artikkel',
    metaLevel: 'Nybegynner',
    metaValidated: 'Informasjonsinnhold',
    intro: 'Kroppen din trenger tid for å finne balansen igjen. Her er det som kan hjelpe deg å forstå denne fasen bedre, på en skånsom måte.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Hva er en spontanabort?',
      'Hva som kan skje fysisk',
      'Syklusens tilbakekomst',
      'En betryggende medisinsk kontroll',
      'Når du bør søke medisinsk hjelp',
      'Det viktigste å huske',
    ],
    section1Body1: 'En spontanabort er at et svangerskap tar slutt av seg selv, oftest før 12. til 14. uke. Det anslås at ett av seks til sju bekreftede svangerskap ender slik, oftest tidlig i svangerskapet.',
    section1Body2: 'Det er ikke sjeldent, og det er heller ikke et tegn på et fremtidig fruktbarhetsproblem. I de aller fleste tilfeller skyldes det faktorer ingen har kontroll over, som en kromosomavvik som oppsto tilfeldig under utviklingen.',
    infoCard1Title: 'Det viktigste å huske',
    infoCard1Text: 'En spontanabort er ikke forårsaket av noe du gjorde eller ikke gjorde. Du er ikke ansvarlig for det som skjedde.',
    section2Body: 'Hver opplevelse er forskjellig fra person til person. Her er de vanligste tegnene:',
    physicalSigns: [
      {title: 'Blødning', text: 'Styrken og varigheten kan variere avhengig av situasjonen, og avtar deretter gradvis.'},
      {title: 'Kramper', text: 'Smerter som ligner menstruasjonskramper, noen ganger sterkere, kan følge denne fasen.'},
      {title: 'Varierende varighet', text: 'Den fysiske tilfriskningen strekker seg vanligvis over noen dager til noen uker.'},
    ],
    section3Body: 'Kroppen din bruker vanligvis noen uker på å finne den hormonelle balansen igjen etter en spontanabort. En syklus kan komme tilbake allerede etter 4 til 6 uker, men hver reise er forskjellig.',
    comfortTips: [
      {title: 'Gi deg selv lov til å hvile', text: 'Kroppen din trenger tid for å finne balansen igjen, uten press for å oppnå et bestemt resultat.'},
      {title: 'Drikk nok', text: 'Godt væskeinntak støtter naturlig tilfriskningen.'},
      {title: 'Lytt til kroppen din', text: 'Hver reise er forskjellig: gå i ditt eget tempo, uten å sammenligne deg med andre.'},
    ],
    section4Body: 'En medisinsk kontroll hjelper med å bekrefte at alt utvikler seg normalt, med full ro i sinnet. Denne timen er også en anledning til å stille alle spørsmålene dine.',
    infoCard2Title: 'Hva denne timen kan omfatte',
    infoCard2Text: 'En samtale om det du har vært gjennom, en undersøkelse ved behov og rom for å få svar på spørsmål om det som kommer.',
    section5Body: 'Hvis noen av disse tegnene dukker opp, er det viktig å kontakte helsepersonell med en gang.',
    warningTitle: 'Tegn som krever medisinsk råd',
    warningSigns: [
      'Feber eller forverret allmenntilstand',
      'Svært kraftig blødning (må bytte beskyttelse på under en time)',
      'Sterke smerter som ikke blir bedre',
      'En uvanlig lukt',
    ],
    tipTitle: 'Godt å vite',
    tipText: 'Å ta vare på kroppen din betyr ikke å kontrollere alt: det betyr først og fremst å gi deg selv den tiden du trenger.',
    summaryPoints: [
      'En spontanabort er ikke forårsaket av noe du gjorde eller ikke gjorde.',
      'Kroppen din bruker vanligvis noen uker på å finne den hormonelle balansen igjen.',
      'En syklus kan komme tilbake allerede etter 4 til 6 uker, men hver reise er forskjellig.',
      'En medisinsk kontroll lar deg bekrefte at alt utvikler seg normalt, med full ro i sinnet.',
    ],
    disclaimerText: 'Informasjonsinnhold. Denne artikkelen erstatter ikke medisinsk rådgivning eller undersøkelse. Ved tvil eller bekymringsfulle symptomer bør du søke råd hos helsepersonell.',
    shareMessage: 'Fysisk tilfriskning etter en spontanabort – AWA',
  },
  pl: {
    badge: 'PO PORONIENIU • REGENERACJA',
    title: 'Fizyczna regeneracja po \nporonieniu',
    metaDuration: '7 min czytania',
    metaType: 'Artykuł',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść informacyjna',
    intro: 'Twoje ciało potrzebuje czasu, by znów odnaleźć równowagę. Oto, co może pomóc Ci łagodnie lepiej zrozumieć ten etap.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Czym jest poronienie?',
      'Co może dziać się w ciele',
      'Powrót cyklu',
      'Uspokajające badanie kontrolne',
      'Kiedy zgłosić się po pomoc medyczną',
      'Najważniejsze wnioski',
    ],
    section1Body1: 'Poronienie to samoistne zakończenie ciąży, najczęściej przed 12.–14. tygodniem. Szacuje się, że jedna na sześć do siedmiu potwierdzonych ciąż kończy się w ten sposób, najczęściej na wczesnym etapie.',
    section1Body2: 'Nie jest to rzadkie ani nie świadczy o przyszłych problemach z płodnością. W zdecydowanej większości przypadków jest związane z czynnikami niezależnymi od niczyjej woli, takimi jak anomalia chromosomalna, która powstała przypadkowo w trakcie rozwoju.',
    infoCard1Title: 'Najważniejsze do zapamiętania',
    infoCard1Text: 'Poronienia nie powoduje nic, co zrobiłaś lub czego nie zrobiłaś. Nie ponosisz odpowiedzialności za to, co się stało.',
    section2Body: 'Każde doświadczenie jest inne u każdej osoby. Oto najczęstsze objawy:',
    physicalSigns: [
      {title: 'Krwawienie', text: 'Jego nasilenie i czas trwania mogą się różnić w zależności od sytuacji, a następnie stopniowo słabną.'},
      {title: 'Skurcze', text: 'Ból podobny do skurczów menstruacyjnych, czasem silniejszy, może towarzyszyć temu etapowi.'},
      {title: 'Zmienny czas trwania', text: 'Fizyczna regeneracja zajmuje zwykle od kilku dni do kilku tygodni.'},
    ],
    section3Body: 'Ciału zwykle potrzeba kilku tygodni, by odzyskać równowagę hormonalną po poronieniu. Cykl może wrócić już po 4 do 6 tygodniach, ale każda droga jest inna.',
    comfortTips: [
      {title: 'Pozwól sobie na odpoczynek', text: 'Twoje ciało potrzebuje czasu, by znów odnaleźć równowagę, bez presji osiągnięcia określonego rezultatu.'},
      {title: 'Dbaj o nawodnienie', text: 'Dobre nawodnienie w naturalny sposób wspiera regenerację.'},
      {title: 'Słuchaj swojego ciała', text: 'Każda droga jest inna: idź swoim tempem, nie porównując się z innymi.'},
    ],
    section4Body: 'Badanie kontrolne pomaga potwierdzić, że wszystko przebiega prawidłowo, z pełnym spokojem. Ta wizyta to także okazja, by zadać wszystkie pytania.',
    infoCard2Title: 'Co może obejmować ta wizyta',
    infoCard2Text: 'Rozmowę o tym, przez co przeszłaś, w razie potrzeby badanie oraz przestrzeń na odpowiedzi na pytania o to, co dalej.',
    section5Body: 'Jeśli pojawi się któryś z tych objawów, ważne jest, by od razu skontaktować się ze specjalistą.',
    warningTitle: 'Objawy wymagające porady medycznej',
    warningSigns: [
      'Gorączka lub pogarszający się stan ogólny',
      'Bardzo obfite krwawienie (konieczność zmiany środka ochrony w mniej niż godzinę)',
      'Silny ból, który nie ustępuje',
      'Nietypowy zapach',
    ],
    tipTitle: 'Warto wiedzieć',
    tipText: 'Dbanie o swoje ciało nie oznacza kontrolowania wszystkiego: oznacza przede wszystkim danie sobie czasu, którego potrzebujesz.',
    summaryPoints: [
      'Poronienia nie powoduje nic, co zrobiłaś lub czego nie zrobiłaś.',
      'Ciału zwykle potrzeba kilku tygodni, by odzyskać równowagę hormonalną.',
      'Cykl może wrócić już po 4 do 6 tygodniach, ale każda droga jest inna.',
      'Badanie kontrolne pozwala potwierdzić, że wszystko przebiega prawidłowo, z pełnym spokojem.',
    ],
    disclaimerText: 'Treść informacyjna. Ten artykuł nie zastępuje porady ani badania lekarskiego. W razie wątpliwości lub niepokojących objawów zasięgnij porady specjalisty.',
    shareMessage: 'Fizyczna regeneracja po poronieniu — AWA',
  },
  uk: {
    badge: 'ПІСЛЯ ВИКИДНЯ • ВІДНОВЛЕННЯ',
    title: 'Фізичне відновлення після \nвикидня',
    metaDuration: '7 хв читання',
    metaType: 'Стаття',
    metaLevel: 'Початковий',
    metaValidated: 'Інформаційний вміст',
    intro: 'Вашому тілу потрібен час, щоб знову знайти рівновагу. Ось що може допомогти вам м’яко краще зрозуміти цей етап.',
    contentsTitle: 'У цій статті',
    topics: [
      'Що таке викидень?',
      'Що може відбуватися фізично',
      'Повернення вашого циклу',
      'Заспокійливе медичне обстеження',
      'Коли звертатися по медичну допомогу',
      'Головні висновки',
    ],
    section1Body1: 'Викидень — це самовільне завершення вагітності, найчастіше до 12–14-го тижня. За оцінками, одна з шести-семи підтверджених вагітностей закінчується саме так, найчастіше на ранньому терміні.',
    section1Body2: 'Це не рідкість і не ознака майбутніх проблем із фертильністю. У переважній більшості випадків він пов’язаний із чинниками, на які ніхто не може вплинути, наприклад із хромосомною аномалією, що виникла випадково під час розвитку.',
    infoCard1Title: 'Головне',
    infoCard1Text: 'Викидень не спричинений нічим із того, що ви зробили чи не зробили. Ви не відповідальні за те, що сталося.',
    section2Body: 'Кожен досвід різний в різних людей. Ось найпоширеніші ознаки:',
    physicalSigns: [
      {title: 'Кровотеча', text: 'Її інтенсивність і тривалість можуть відрізнятися залежно від ситуації, а потім поступово зменшуються.'},
      {title: 'Спазми', text: 'Біль, подібний до менструальних спазмів, іноді сильніший, може супроводжувати цей етап.'},
      {title: 'Змінна тривалість', text: 'Фізичне відновлення зазвичай триває від кількох днів до кількох тижнів.'},
    ],
    section3Body: 'Організму зазвичай потрібно кілька тижнів, щоб відновити гормональний баланс після викидня. Цикл може повернутися вже за 4–6 тижнів, але кожен шлях різний.',
    comfortTips: [
      {title: 'Дозвольте собі відпочити', text: 'Вашому тілу потрібен час, щоб знову знайти рівновагу, без тиску досягти певного результату.'},
      {title: 'Пийте достатньо води', text: 'Достатнє споживання води природно підтримує відновлення.'},
      {title: 'Прислухайтеся до свого тіла', text: 'Кожен шлях різний: рухайтеся у власному темпі, не порівнюючи себе з іншими.'},
    ],
    section4Body: 'Медичне обстеження допомагає підтвердити, що все проходить нормально, із повним спокоєм. Цей візит також є нагодою поставити всі свої запитання.',
    infoCard2Title: 'Що може включати цей візит',
    infoCard2Text: 'Розмову про пережите, за потреби огляд і простір для відповідей на ваші запитання про те, що далі.',
    section5Body: 'Якщо з’явиться будь-яка з цих ознак, важливо негайно звернутися до медичного фахівця.',
    warningTitle: 'Ознаки, що потребують медичної поради',
    warningSigns: [
      'Гарячка або погіршення загального стану',
      'Дуже рясна кровотеча (потрібно змінювати засіб гігієни менш ніж за годину)',
      'Сильний біль, що не вщухає',
      'Незвичний запах',
    ],
    tipTitle: 'Варто знати',
    tipText: 'Дбати про своє тіло не означає все контролювати: насамперед це означає дати собі потрібний час.',
    summaryPoints: [
      'Викидень не спричинений нічим із того, що ви зробили чи не зробили.',
      'Організму зазвичай потрібно кілька тижнів, щоб відновити гормональний баланс.',
      'Цикл може повернутися вже за 4–6 тижнів, але кожен шлях різний.',
      'Медичне обстеження дозволяє підтвердити, що все проходить нормально, із повним спокоєм.',
    ],
    disclaimerText: 'Інформаційний вміст. Ця стаття не замінює медичної поради чи обстеження. У разі сумнівів або тривожних симптомів зверніться за порадою до медичного фахівця.',
    shareMessage: 'Фізичне відновлення після викидня — AWA',
  },
  cs: {
    badge: 'PO POTRATU • ZOTAVENÍ',
    title: 'Fyzické zotavení po \npotratu',
    metaDuration: '7 min čtení',
    metaType: 'Článek',
    metaLevel: 'Začátečník',
    metaValidated: 'Informativní obsah',
    intro: 'Vaše tělo potřebuje čas, aby znovu našlo rovnováhu. Zde je to, co vám může pomoci lépe pochopit tuto fázi, jemně.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Co je potrat?',
      'Co se může fyzicky dít',
      'Návrat vašeho cyklu',
      'Uklidňující lékařská kontrola',
      'Kdy vyhledat lékařskou péči',
      'Hlavní poznatky',
    ],
    section1Body1: 'Potrat je samovolné ukončení těhotenství, nejčastěji před 12. až 14. týdnem. Odhaduje se, že takto končí jedno ze šesti až sedmi potvrzených těhotenství, nejčastěji v časné fázi.',
    section1Body2: 'Není vzácný a není ani známkou budoucího problému s plodností. V naprosté většině případů souvisí s faktory, které nikdo neovlivní, například s chromozomální odchylkou vzniklou náhodou při vývoji.',
    infoCard1Title: 'Hlavní poznatek',
    infoCard1Text: 'Potrat nezpůsobilo nic, co jste udělala nebo neudělala. Nenesete odpovědnost za to, co se stalo.',
    section2Body: 'Každá zkušenost je u každé ženy jiná. Zde jsou nejčastější příznaky:',
    physicalSigns: [
      {title: 'Krvácení', text: 'Jeho intenzita a délka se může podle situace lišit a poté postupně slábne.'},
      {title: 'Křeče', text: 'Bolest podobná menstruačním křečím, někdy intenzivnější, může tuto fázi provázet.'},
      {title: 'Proměnlivá doba trvání', text: 'Fyzické zotavení obvykle trvá od několika dní do několika týdnů.'},
    ],
    section3Body: 'Vaše tělo obvykle potřebuje po potratu několik týdnů, aby znovu získalo hormonální rovnováhu. Cyklus se může vrátit už za 4 až 6 týdnů, ale každá cesta je jiná.',
    comfortTips: [
      {title: 'Dopřejte si odpočinek', text: 'Vaše tělo potřebuje čas, aby znovu našlo rovnováhu, bez tlaku na dosažení konkrétního výsledku.'},
      {title: 'Dbejte na dostatek tekutin', text: 'Dobrý pitný režim přirozeně podporuje zotavení.'},
      {title: 'Naslouchejte svému tělu', text: 'Každá cesta je jiná: postupujte vlastním tempem, aniž byste se srovnávala s jinými.'},
    ],
    section4Body: 'Lékařská kontrola pomáhá potvrdit, že vše probíhá normálně, s úplným klidem. Tato návštěva je také příležitostí položit všechny své otázky.',
    infoCard2Title: 'Co může tato návštěva zahrnovat',
    infoCard2Text: 'Rozhovor o tom, čím jste prošla, případné vyšetření a prostor pro odpovědi na vaše otázky o tom, co bude dál.',
    section5Body: 'Pokud se objeví některý z těchto příznaků, je důležité okamžitě kontaktovat zdravotnického pracovníka.',
    warningTitle: 'Příznaky, které vyžadují lékařskou radu',
    warningSigns: [
      'Horečka nebo zhoršující se celkový stav',
      'Velmi silné krvácení (nutnost měnit ochranu za méně než hodinu)',
      'Intenzivní bolest, která se nelepší',
      'Neobvyklý zápach',
    ],
    tipTitle: 'Stojí za to vědět',
    tipText: 'Pečovat o své tělo neznamená mít vše pod kontrolou: znamená to hlavně dopřát si čas, který potřebujete.',
    summaryPoints: [
      'Potrat nezpůsobilo nic, co jste udělala nebo neudělala.',
      'Vaše tělo obvykle potřebuje několik týdnů, aby znovu získalo hormonální rovnováhu.',
      'Cyklus se může vrátit už za 4 až 6 týdnů, ale každá cesta je jiná.',
      'Lékařská kontrola vám umožní potvrdit, že vše probíhá normálně, s úplným klidem.',
    ],
    disclaimerText: 'Informativní obsah. Tento článek nenahrazuje lékařskou radu ani vyšetření. V případě pochybností nebo znepokojivých příznaků vyhledejte radu zdravotnického pracovníka.',
    shareMessage: 'Fyzické zotavení po potratu — AWA',
  },
  sk: {
    badge: 'PO POTRATE • ZOTAVENIE',
    title: 'Telesné zotavenie\npo potrate',
    metaDuration: '7 min čítania',
    metaType: 'Článok',
    metaLevel: 'Začiatočník',
    metaValidated: 'Informatívny obsah',
    intro: 'Vaše telo potrebuje čas, aby opäť našlo rovnováhu. Tu je, čo vám môže pomôcť jemne lepšie pochopiť túto etapu.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Čo je potrat?',
      'Čo sa môže diať fyzicky',
      'Návrat vášho cyklu',
      'Upokojujúca lekárska kontrola',
      'Kedy vyhľadať lekársku starostlivosť',
      'Hlavné body',
    ],
    section1Body1: 'Potrat je spontánne ukončenie tehotenstva, najčastejšie pred 12. až 14. týždňom. Odhaduje sa, že takto skončí jedno zo šiestich až siedmich potvrdených tehotenstiev, najčastejšie v skorej fáze.',
    section1Body2: 'Nie je to zriedkavé ani to nie je znakom budúceho problému s plodnosťou. Vo veľkej väčšine prípadov súvisí s faktormi, ktoré nikto nemôže ovplyvniť, ako je chromozómová anomália, ktorá vznikla náhodou počas vývoja.',
    infoCard1Title: 'Hlavný bod',
    infoCard1Text: 'Potrat nespôsobilo nič, čo ste urobili alebo neurobili. Nenesiete zodpovednosť za to, čo sa stalo.',
    section2Body: 'Každý zážitok je iný. Tu sú najčastejšie znaky:',
    physicalSigns: [
      {title: 'Krvácanie', text: 'Jeho intenzita a trvanie sa môžu líšiť podľa situácie a potom postupne ustupujú.'},
      {title: 'Kŕče', text: 'Bolesť podobná menštruačným kŕčom, niekedy intenzívnejšia, môže túto etapu sprevádzať.'},
      {title: 'Rôzne trvanie', text: 'Fyzické zotavenie zvyčajne trvá niekoľko dní až niekoľko týždňov.'},
    ],
    section3Body: 'Vášmu telu zvyčajne trvá niekoľko týždňov, kým po potrate obnoví hormonálnu rovnováhu. Cyklus sa môže vrátiť už po 4 až 6 týždňoch, ale každá cesta je iná.',
    comfortTips: [
      {title: 'Doprajte si odpočinok', text: 'Vaše telo potrebuje čas, aby opäť našlo rovnováhu, bez tlaku na dosiahnutie nejakého výsledku.'},
      {title: 'Dostatočne pite', text: 'Dobrá hydratácia prirodzene podporuje zotavenie.'},
      {title: 'Počúvajte svoje telo', text: 'Každá cesta je iná: postupujte vlastným tempom, bez porovnávania s inými.'},
    ],
    section4Body: 'Lekárska kontrola pomáha potvrdiť, že všetko prebieha normálne, s úplným pokojom. Táto návšteva je tiež príležitosťou položiť všetky otázky.',
    infoCard2Title: 'Čo môže táto návšteva zahŕňať',
    infoCard2Text: 'Rozhovor o tom, čím ste prešli, v prípade potreby vyšetrenie a priestor na odpovede na vaše otázky o tom, čo bude ďalej.',
    section5Body: 'Ak sa objaví niektorý z týchto znakov, je dôležité ihneď kontaktovať zdravotníckeho pracovníka.',
    warningTitle: 'Znaky, ktoré vyžadujú lekársku radu',
    warningSigns: [
      'Horúčka alebo zhoršujúci sa celkový stav',
      'Veľmi silné krvácanie (potreba meniť hygienickú pomôcku za menej než hodinu)',
      'Intenzívna bolesť, ktorá sa nezlepšuje',
      'Nezvyčajný zápach',
    ],
    tipTitle: 'Stojí za to vedieť',
    tipText: 'Starostlivosť o svoje telo neznamená mať všetko pod kontrolou: znamená to najmä dať si čas, ktorý potrebujete.',
    summaryPoints: [
      'Potrat nespôsobilo nič, čo ste urobili alebo neurobili.',
      'Vášmu telu zvyčajne trvá niekoľko týždňov, kým obnoví hormonálnu rovnováhu.',
      'Cyklus sa môže vrátiť už po 4 až 6 týždňoch, ale každá cesta je iná.',
      'Lekárska kontrola vám umožňuje potvrdiť, že všetko prebieha normálne, s úplným pokojom.',
    ],
    disclaimerText: 'Informatívny obsah. Tento článok nenahrádza lekársku radu ani vyšetrenie. V prípade pochybností alebo znepokojujúcich príznakov sa poraďte so zdravotníckym pracovníkom.',
    shareMessage: 'Telesné zotavenie po potrate — AWA',
  },
  hu: {
    badge: 'VETÉLÉS UTÁN • FELÉPÜLÉS',
    title: 'Testi felépülés\nvetélés után',
    metaDuration: '7 perc olvasás',
    metaType: 'Cikk',
    metaLevel: 'Kezdő',
    metaValidated: 'Tájékoztató jellegű tartalom',
    intro: 'A testednek időre van szüksége, hogy újra megtalálja az egyensúlyát. Íme, mi segíthet szelíden jobban megérteni ezt a szakaszt.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Mi a vetélés?',
      'Mi történhet testileg',
      'A ciklusod visszatérése',
      'Megnyugtató orvosi kontroll',
      'Mikor kérj orvosi ellátást',
      'Legfontosabb tudnivalók',
    ],
    section1Body1: 'A vetélés a terhesség spontán megszakadása, leggyakrabban a 12–14. hét előtt. Becslések szerint a megerősített terhességek hatodából-hetedéből ér így véget, leggyakrabban a terhesség elején.',
    section1Body2: 'Nem ritka, és nem jele a jövőbeli termékenységi problémának. A túlnyomó többségben olyan tényezőkhöz kapcsolódik, amelyeket senki sem tud befolyásolni, például a fejlődés során véletlenül kialakult kromoszóma-rendellenességhez.',
    infoCard1Title: 'Legfontosabb tudnivaló',
    infoCard1Text: 'A vetélést nem okozta semmi, amit tettél vagy nem tettél. Nem te vagy felelős azért, ami történt.',
    section2Body: 'Minden tapasztalat más. Íme a leggyakoribb jelek:',
    physicalSigns: [
      {title: 'Vérzés', text: 'Az erőssége és az időtartama a helyzettől függően változhat, majd fokozatosan csökken.'},
      {title: 'Görcsök', text: 'A menstruációs görcsökhöz hasonló, néha erősebb fájdalom kísérheti ezt a szakaszt.'},
      {title: 'Változó időtartam', text: 'A testi felépülés általában néhány naptól néhány hétig terjed.'},
    ],
    section3Body: 'A testnek általában néhány hétre van szüksége, hogy vetélés után visszanyerje a hormonális egyensúlyt. A ciklus már 4–6 hét után visszatérhet, de minden út más.',
    comfortTips: [
      {title: 'Engedj meg magadnak pihenést', text: 'A testednek időre van szüksége, hogy újra megtalálja az egyensúlyát, bármilyen eredmény elérésére irányuló nyomás nélkül.'},
      {title: 'Igyál eleget', text: 'A jó hidratálás természetesen támogatja a felépülést.'},
      {title: 'Figyelj a testedre', text: 'Minden út más: haladj a saját tempódban, anélkül, hogy másokhoz hasonlítanád magad.'},
    ],
    section4Body: 'Az orvosi kontroll segít megerősíteni, hogy minden rendben zajlik, teljes nyugalommal. Ez az időpont arra is alkalmat ad, hogy feltedd az összes kérdésedet.',
    infoCard2Title: 'Amit ez az időpont tartalmazhat',
    infoCard2Text: 'Beszélgetést arról, amin keresztülmentél, szükség esetén vizsgálatot, és teret a további lépésekkel kapcsolatos kérdéseid megválaszolására.',
    section5Body: 'Ha ezek közül bármelyik jel megjelenik, fontos azonnal felvenni a kapcsolatot egészségügyi szakemberrel.',
    warningTitle: 'Orvosi tanácsot igénylő jelek',
    warningSigns: [
      'Láz vagy romló általános állapot',
      'Nagyon erős vérzés (a higiéniai terméket egy óránál rövidebb idő alatt kell cserélni)',
      'Intenzív fájdalom, amely nem javul',
      'Szokatlan szag',
    ],
    tipTitle: 'Érdemes tudni',
    tipText: 'A tested gondozása nem azt jelenti, hogy mindent kontrollálsz: főként azt, hogy megadod magadnak az időt, amelyre szükséged van.',
    summaryPoints: [
      'A vetélést nem okozta semmi, amit tettél vagy nem tettél.',
      'A testnek általában néhány hétre van szüksége a hormonális egyensúly visszanyeréséhez.',
      'A ciklus már 4–6 hét után visszatérhet, de minden út más.',
      'Az orvosi kontroll lehetővé teszi, hogy teljes nyugalommal megerősítsd, hogy minden rendben zajlik.',
    ],
    disclaimerText: 'Tájékoztató jellegű tartalom. Ez a cikk nem helyettesíti az orvosi tanácsot vagy vizsgálatot. Kétség esetén vagy aggasztó tünetek észlelésekor kérj tanácsot egészségügyi szakembertől.',
    shareMessage: 'Testi felépülés vetélés után — AWA',
  },
  ro: {
    badge: 'DUPĂ UN AVORT SPONTAN • RECUPERARE',
    title: 'Recuperarea fizică după \nun avort spontan',
    metaDuration: '7 min de citit',
    metaType: 'Articol',
    metaLevel: 'Începător',
    metaValidated: 'Conținut informativ',
    intro: 'Corpul tău are nevoie de timp pentru a-și regăsi echilibrul. Iată ce te poate ajuta să înțelegi mai bine această etapă, cu blândețe.',
    contentsTitle: 'În acest articol',
    topics: [
      'Ce este un avort spontan?',
      'Ce se poate întâmpla fizic',
      'Revenirea ciclului tău',
      'Un control medical liniștitor',
      'Când să ceri îngrijiri medicale',
      'Ce să reții',
    ],
    section1Body1: 'Un avort spontan este încheierea spontană a unei sarcini, cel mai adesea înainte de săptămâna a 12-a până la a 14-a. Se estimează că una din șase până la șapte sarcini confirmate se încheie astfel, cel mai adesea la începutul sarcinii.',
    section1Body2: 'Nu este rar și nici un semn al unei viitoare probleme de fertilitate. În marea majoritate a cazurilor, este legat de factori care scapă oricărui control, cum ar fi o anomalie cromozomială apărută întâmplător în timpul dezvoltării.',
    infoCard1Title: 'Ideea principală',
    infoCard1Text: 'Un avort spontan nu este cauzat de nimic din ce ai făcut sau nu ai făcut. Nu ești responsabilă pentru ceea ce s-a întâmplat.',
    section2Body: 'Fiecare experiență este diferită de la o persoană la alta. Iată cele mai frecvente semne:',
    physicalSigns: [
      {title: 'Sângerare', text: 'Intensitatea și durata ei pot varia în funcție de situație, apoi scad treptat.'},
      {title: 'Crampe', text: 'O durere asemănătoare crampelor menstruale, uneori mai intensă, poate însoți această etapă.'},
      {title: 'O durată variabilă', text: 'Recuperarea fizică se întinde de obicei pe câteva zile până la câteva săptămâni.'},
    ],
    section3Body: 'Corpului tău îi iau în general câteva săptămâni pentru a-și regăsi echilibrul hormonal după un avort spontan. Un ciclu poate reveni încă de la 4 până la 6 săptămâni, dar fiecare parcurs este diferit.',
    comfortTips: [
      {title: 'Permite-ți să te odihnești', text: 'Corpul tău are nevoie de timp pentru a-și regăsi echilibrul, fără presiunea de a atinge un anumit rezultat.'},
      {title: 'Rămâi bine hidratată', text: 'O hidratare bună susține în mod natural recuperarea.'},
      {title: 'Ascultă-ți corpul', text: 'Fiecare parcurs este diferit: mergi în ritmul tău, fără a te compara cu altele.'},
    ],
    section4Body: 'Un control medical ajută la confirmarea faptului că totul decurge normal, cu deplină liniște sufletească. Această consultație este și o ocazie de a-ți pune toate întrebările.',
    infoCard2Title: 'Ce poate include această consultație',
    infoCard2Text: 'O discuție despre ce ai trăit, un examen dacă este nevoie și spațiu pentru a răspunde întrebărilor tale despre ce urmează.',
    section5Body: 'Dacă apare oricare dintre aceste semne, este important să contactezi imediat un profesionist din domeniul sănătății.',
    warningTitle: 'Semne care cer un sfat medical',
    warningSigns: [
      'Febră sau o stare generală care se agravează',
      'Sângerare foarte abundentă (necesitatea de a-ți schimba protecția în mai puțin de o oră)',
      'Durere intensă care nu se ameliorează',
      'Un miros neobișnuit',
    ],
    tipTitle: 'Bine de știut',
    tipText: 'A avea grijă de corpul tău nu înseamnă a controla totul: înseamnă mai ales a-ți acorda timpul de care ai nevoie.',
    summaryPoints: [
      'Un avort spontan nu este cauzat de nimic din ce ai făcut sau nu ai făcut.',
      'Corpului tău îi iau în general câteva săptămâni pentru a-și regăsi echilibrul hormonal.',
      'Un ciclu poate reveni încă de la 4 până la 6 săptămâni, dar fiecare parcurs este diferit.',
      'Un control medical îți permite să confirmi că totul decurge normal, cu deplină liniște sufletească.',
    ],
    disclaimerText: 'Conținut cu caracter informativ. Acest articol nu înlocuiește sfatul sau examenul medical. Dacă ai îndoieli sau simptome îngrijorătoare, cere sfatul unui profesionist din domeniul sănătății.',
    shareMessage: 'Recuperarea fizică după un avort spontan — AWA',
  },
  bg: {
    badge: 'СЛЕД СПОНТАНЕН АБОРТ • ВЪЗСТАНОВЯВАНЕ',
    title: 'Физическо възстановяване след\nспонтанен аборт',
    metaDuration: '7 мин четене',
    metaType: 'Статия',
    metaLevel: 'Начинаещ',
    metaValidated: 'Информационно съдържание',
    intro: 'Тялото ти се нуждае от време, за да намери отново равновесие. Ето какво може да ти помогне да разбереш по-добре този етап, внимателно.',
    contentsTitle: 'В тази статия',
    topics: [
      'Какво е спонтанен аборт?',
      'Какво може да се случи физически',
      'Връщането на цикъла',
      'Успокояващ медицински преглед',
      'Кога да потърсиш медицинска помощ',
      'Какво да запомниш',
    ],
    section1Body1: 'Спонтанният аборт е самопроизволен край на бременността, най-често преди 12-ата до 14-ата седмица. Изчислява се, че една от шест до седем потвърдени бременности завършва така, най-често в началото на бременността.',
    section1Body2: 'Това не е рядкост, нито е знак за бъдещ проблем с плодовитостта. В огромното мнозинство от случаите е свързано с фактори извън ничий контрол, като хромозомна аномалия, възникнала случайно по време на развитието.',
    infoCard1Title: 'Какво да запомниш',
    infoCard1Text: 'Спонтанният аборт не е причинен от нещо, което си направила или не си направила. Ти не носиш отговорност за случилото се.',
    section2Body: 'Всяко преживяване е различно от човек на човек. Ето най-честите признаци:',
    physicalSigns: [
      {title: 'Кървене', text: 'Интензивността и продължителността му могат да варират според ситуацията, след което постепенно намаляват.'},
      {title: 'Крампи', text: 'Болка, подобна на менструалните крампи, понякога по-силна, може да съпътства този етап.'},
      {title: 'Променлива продължителност', text: 'Физическото възстановяване обикновено отнема от няколко дни до няколко седмици.'},
    ],
    section3Body: 'Тялото ти обикновено има нужда от няколко седмици, за да възстанови хормоналния си баланс след спонтанен аборт. Цикълът може да се върне още след 4 до 6 седмици, но всеки път е различен.',
    comfortTips: [
      {title: 'Позволи си да си почиваш', text: 'Тялото ти се нуждае от време, за да намери отново равновесие, без натиск да постигнеш определен резултат.'},
      {title: 'Пий достатъчно течности', text: 'Доброто хидратиране естествено подпомага възстановяването.'},
      {title: 'Вслушвай се в тялото си', text: 'Всеки път е различен: върви със собственото си темпо, без да се сравняваш с другите.'},
    ],
    section4Body: 'Медицинският преглед помага да се потвърди, че всичко протича нормално, с пълно спокойствие. Този преглед е и възможност да зададеш всичките си въпроси.',
    infoCard2Title: 'Какво може да включва този преглед',
    infoCard2Text: 'Разговор за преживяното, преглед при нужда и място за отговори на въпросите ти за това, което следва.',
    section5Body: 'Ако се появи някой от тези признаци, важно е незабавно да се свържеш със здравен специалист.',
    warningTitle: 'Признаци, които изискват медицински съвет',
    warningSigns: [
      'Температура или влошаване на общото състояние',
      'Много обилно кървене (смяна на хигиенния продукт за по-малко от час)',
      'Силна болка, която не отшумява',
      'Необичайна миризма',
    ],
    tipTitle: 'Добре е да знаеш',
    tipText: 'Да се грижиш за тялото си не означава да контролираш всичко: преди всичко означава да си дадеш времето, от което имаш нужда.',
    summaryPoints: [
      'Спонтанният аборт не е причинен от нещо, което си направила или не си направила.',
      'Тялото ти обикновено има нужда от няколко седмици, за да възстанови хормоналния си баланс.',
      'Цикълът може да се върне още след 4 до 6 седмици, но всеки път е различен.',
      'Медицинският преглед ти позволява да потвърдиш, че всичко протича нормално, с пълно спокойствие.',
    ],
    disclaimerText: 'Информационно съдържание. Тази статия не замества медицинския съвет или преглед. При съмнение или тревожни симптоми потърси съвет от здравен специалист.',
    shareMessage: 'Физическо възстановяване след спонтанен аборт — AWA',
  },
  sr: {
    badge: 'ПОСЛЕ СПОНТАНОГ ПОБАЧАЈА • ОПОРАВАК',
    title: 'Физички опоравак после\nспонтаног побачаја',
    metaDuration: '7 мин читања',
    metaType: 'Чланак',
    metaLevel: 'Почетник',
    metaValidated: 'Информативни садржај',
    intro: 'Твом телу је потребно време да поново пронађе равнотежу. Ево шта ти може помоћи да нежно боље разумеш ову фазу.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Шта је спонтани побачај?',
      'Шта се може догодити физички',
      'Повратак циклуса',
      'Умирујући медицински преглед',
      'Када потражити медицинску помоћ',
      'Шта да запамтиш',
    ],
    section1Body1: 'Спонтани побачај је самопроизвољни крај трудноће, најчешће пре 12. до 14. недеље. Процењује се да једна од шест до седам потврђених трудноћа завршава на овај начин, најчешће рано у трудноћи.',
    section1Body2: 'То није ретко, нити је знак будућег проблема са плодношћу. У огромној већини случајева повезан је са факторима изван ичије контроле, као што је хромозомска аномалија која је случајно настала током развоја.',
    infoCard1Title: 'Основно',
    infoCard1Text: 'Спонтани побачај није узрокован ничим што си урадила или ниси урадила. Ти ниси одговорна за оно што се догодило.',
    section2Body: 'Свако искуство је различито од особе до особе. Ево најчешћих знакова:',
    physicalSigns: [
      {title: 'Крварење', text: 'Његов интензитет и трајање могу варирати зависно од ситуације, а затим се постепено смањују.'},
      {title: 'Грчеви', text: 'Бол сличан менструалним грчевима, понекад јачи, може пратити ову фазу.'},
      {title: 'Променљиво трајање', text: 'Физички опоравак обично траје од неколико дана до неколико недеља.'},
    ],
    section3Body: 'Телу је обично потребно неколико недеља да поново успостави хормонску равнотежу после спонтаног побачаја. Циклус се може вратити већ после 4 до 6 недеља, али је сваки пут различит.',
    comfortTips: [
      {title: 'Дозволи себи да се одмараш', text: 'Твом телу је потребно време да поново пронађе равнотежу, без притиска да постигнеш одређен резултат.'},
      {title: 'Пиј довољно течности', text: 'Добра хидратација природно подржава опоравак.'},
      {title: 'Слушај своје тело', text: 'Сваки пут је различит: иди својим темпом, без упоређивања са другима.'},
    ],
    section4Body: 'Медицински преглед помаже да се потврди да све протиче нормално, са потпуним спокојем. Овај преглед је и прилика да поставиш сва своја питања.',
    infoCard2Title: 'Шта овај преглед може обухватити',
    infoCard2Text: 'Разговор о ономе што си преживела, преглед по потреби и простор за одговоре на твоја питања о томе шта следи.',
    section5Body: 'Ако се појави било који од ових знакова, важно је да одмах контактираш здравственог радника.',
    warningTitle: 'Знаци који захтевају медицински савет',
    warningSigns: [
      'Температура или погоршање општег стања',
      'Веома обилно крварење (мењање заштите у року краћем од сат времена)',
      'Јак бол који не јењава',
      'Необичан мирис',
    ],
    tipTitle: 'Добро је знати',
    tipText: 'Брига о телу не значи контролисати све: пре свега значи дати себи време које ти је потребно.',
    summaryPoints: [
      'Спонтани побачај није узрокован ничим што си урадила или ниси урадила.',
      'Телу је обично потребно неколико недеља да поново успостави хормонску равнотежу.',
      'Циклус се може вратити већ после 4 до 6 недеља, али је сваки пут различит.',
      'Медицински преглед ти омогућава да потврдиш да све протиче нормално, са потпуним спокојем.',
    ],
    disclaimerText: 'Информативни садржај. Овај чланак не замењује медицински савет или преглед. При сумњи или забрињавајућим симптомима потражи савет од здравственог радника.',
    shareMessage: 'Физички опоравак после спонтаног побачаја — AWA',
  },
  hr: {
    badge: 'NAKON SPONTANOG POBAČAJA • OPORAVAK',
    title: 'Tjelesni oporavak nakon\nspontanog pobačaja',
    metaDuration: '7 min čitanja',
    metaType: 'Članak',
    metaLevel: 'Početnica',
    metaValidated: 'Informativni sadržaj',
    intro: 'Tvom tijelu treba vremena da ponovno pronađe ravnotežu. Evo što ti može pomoći da nježno bolje razumiješ ovu fazu.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Što je spontani pobačaj?',
      'Što se može dogoditi tjelesno',
      'Povratak ciklusa',
      'Umirujući liječnički pregled',
      'Kada potražiti liječničku skrb',
      'Ključne poruke',
    ],
    section1Body1: 'Spontani pobačaj je spontani prekid trudnoće, najčešće prije 12. do 14. tjedna. Procjenjuje se da jedna od šest do sedam potvrđenih trudnoća završi na taj način, najčešće rano u trudnoći.',
    section1Body2: 'Nije rijedak niti je znak budućeg problema s plodnošću. U velikoj većini slučajeva povezan je s čimbenicima na koje nitko ne može utjecati, poput kromosomske anomalije koja je slučajno nastala tijekom razvoja.',
    infoCard1Title: 'Ključna poruka',
    infoCard1Text: 'Spontani pobačaj ne uzrokuje ništa što si učinila ili nisi učinila. Nisi odgovorna za ono što se dogodilo.',
    section2Body: 'Svako je iskustvo različito od osobe do osobe. Evo najčešćih znakova:',
    physicalSigns: [
      {title: 'Krvarenje', text: 'Njegov intenzitet i trajanje mogu se razlikovati ovisno o situaciji, a zatim se postupno smanjuju.'},
      {title: 'Grčevi', text: 'Bol slična menstrualnim grčevima, ponekad jača, može pratiti ovu fazu.'},
      {title: 'Promjenjivo trajanje', text: 'Tjelesni oporavak obično traje od nekoliko dana do nekoliko tjedana.'},
    ],
    section3Body: 'Tvom tijelu općenito treba nekoliko tjedana da ponovno uspostavi hormonsku ravnotežu nakon spontanog pobačaja. Ciklus se može vratiti već nakon 4 do 6 tjedana, ali svaki je put drugačiji.',
    comfortTips: [
      {title: 'Dopusti si odmor', text: 'Tvom tijelu treba vremena da ponovno pronađe ravnotežu, bez pritiska da postigneš određeni ishod.'},
      {title: 'Ostani dobro hidrirana', text: 'Dobra hidratacija prirodno podupire oporavak.'},
      {title: 'Slušaj svoje tijelo', text: 'Svaki je put drugačiji: kreći se svojim tempom, bez uspoređivanja s drugima.'},
    ],
    section4Body: 'Liječnički pregled pomaže potvrditi da sve napreduje normalno, s potpunim mirom. Taj je pregled i prilika da postaviš sva svoja pitanja.',
    infoCard2Title: 'Što taj pregled može uključivati',
    infoCard2Text: 'Razgovor o onome kroz što si prošla, pregled ako je potreban i prostor za odgovore na tvoja pitanja o tome što slijedi.',
    section5Body: 'Ako se pojavi bilo koji od ovih znakova, važno je odmah se javiti zdravstvenom djelatniku.',
    warningTitle: 'Znakovi koji zahtijevaju liječnički savjet',
    warningSigns: [
      'Vrućica ili pogoršanje općeg stanja',
      'Vrlo obilno krvarenje (potreba za zamjenom zaštite u manje od sat vremena)',
      'Jaka bol koja se ne smanjuje',
      'Neobičan miris',
    ],
    tipTitle: 'Dobro je znati',
    tipText: 'Briga o tijelu ne znači imati kontrolu nad svime: ponajprije znači dati si vremena koje ti treba.',
    summaryPoints: [
      'Spontani pobačaj ne uzrokuje ništa što si učinila ili nisi učinila.',
      'Tvom tijelu općenito treba nekoliko tjedana da ponovno uspostavi hormonsku ravnotežu.',
      'Ciklus se može vratiti već nakon 4 do 6 tjedana, ali svaki je put drugačiji.',
      'Liječnički pregled omogućuje ti da potvrdiš da sve napreduje normalno, s potpunim mirom.',
    ],
    disclaimerText: 'Informativni sadržaj. Ovaj članak ne zamjenjuje liječnički savjet ni pregled. U slučaju nedoumice ili zabrinjavajućih simptoma zatraži savjet zdravstvenog djelatnika.',
    shareMessage: 'Tjelesni oporavak nakon spontanog pobačaja — AWA',
  },
  bs: {
    badge: 'NAKON SPONTANOG POBAČAJA • OPORAVAK',
    title: 'Tjelesni oporavak nakon\nspontanog pobačaja',
    metaDuration: '7 min čitanja',
    metaType: 'Članak',
    metaLevel: 'Početnica',
    metaValidated: 'Informativni sadržaj',
    intro: 'Tvom tijelu treba vremena da ponovno pronađe ravnotežu. Evo što ti može pomoći da nježno bolje razumiješ ovu fazu.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Što je spontani pobačaj?',
      'Što se može dogoditi tjelesno',
      'Povratak ciklusa',
      'Umirujući ljekarski pregled',
      'Kada potražiti ljekarsku skrb',
      'Ključne poruke',
    ],
    section1Body1: 'Spontani pobačaj je spontani prekid trudnoće, najčešće prije 12. do 14. sedmice. Procjenjuje se da jedna od šest do sedam potvrđenih trudnoća završi na taj način, najčešće rano u trudnoći.',
    section1Body2: 'Nije rijedak niti je znak budućeg problema s plodnošću. U velikoj većini slučajeva povezan je s čimbenicima na koje niko ne može utjecati, poput kromosomske anomalije koja je slučajno nastala tokom razvoja.',
    infoCard1Title: 'Ključna poruka',
    infoCard1Text: 'Spontani pobačaj ne uzrokuje ništa što si učinila ili nisi učinila. Nisi odgovorna za ono što se dogodilo.',
    section2Body: 'Svako je iskustvo različito od osobe do osobe. Evo najčešćih znakova:',
    physicalSigns: [
      {title: 'Krvarenje', text: 'Njegov intenzitet i trajanje mogu se razlikovati ovisno o situaciji, a zatim se postupno smanjuju.'},
      {title: 'Grčevi', text: 'Bol slična menstrualnim grčevima, ponekad jača, može pratiti ovu fazu.'},
      {title: 'Promjenjivo trajanje', text: 'Tjelesni oporavak obično traje od nekoliko dana do nekoliko sedmica.'},
    ],
    section3Body: 'Tvom tijelu općenito treba nekoliko sedmica da ponovno uspostavi hormonsku ravnotežu nakon spontanog pobačaja. Ciklus se može vratiti već nakon 4 do 6 sedmica, ali svaki je put drugačiji.',
    comfortTips: [
      {title: 'Dopusti si odmor', text: 'Tvom tijelu treba vremena da ponovno pronađe ravnotežu, bez pritiska da postigneš određeni ishod.'},
      {title: 'Ostani dobro hidrirana', text: 'Dobra hidratacija prirodno podupire oporavak.'},
      {title: 'Slušaj svoje tijelo', text: 'Svaki je put drugačiji: kreći se svojim tempom, bez uspoređivanja s drugima.'},
    ],
    section4Body: 'Ljekarski pregled pomaže potvrditi da sve napreduje normalno, s potpunim mirom. Taj je pregled i prilika da postaviš sva svoja pitanja.',
    infoCard2Title: 'Što taj pregled može uključivati',
    infoCard2Text: 'Razgovor o onome kroz što si prošla, pregled ako je potreban i prostor za odgovore na tvoja pitanja o tome što slijedi.',
    section5Body: 'Ako se pojavi bilo koji od ovih znakova, važno je odmah se javiti zdravstvenom radniku.',
    warningTitle: 'Znakovi koji zahtijevaju ljekarski savjet',
    warningSigns: [
      'Vrućica ili pogoršanje općeg stanja',
      'Vrlo obilno krvarenje (potreba za zamjenom zaštite u manje od sat vremena)',
      'Jaka bol koja se ne smanjuje',
      'Neobičan miris',
    ],
    tipTitle: 'Dobro je znati',
    tipText: 'Briga o tijelu ne znači imati kontrolu nad svime: ponajprije znači dati si vremena koje ti treba.',
    summaryPoints: [
      'Spontani pobačaj ne uzrokuje ništa što si učinila ili nisi učinila.',
      'Tvom tijelu općenito treba nekoliko sedmica da ponovno uspostavi hormonsku ravnotežu.',
      'Ciklus se može vratiti već nakon 4 do 6 sedmica, ali svaki je put drugačiji.',
      'Ljekarski pregled omogućuje ti da potvrdiš da sve napreduje normalno, s potpunim mirom.',
    ],
    disclaimerText: 'Informativni sadržaj. Ovaj članak ne zamjenjuje ljekarski savjet ni pregled. U slučaju nedoumice ili zabrinjavajućih simptoma zatraži savjet zdravstvenog radnika.',
    shareMessage: 'Tjelesni oporavak nakon spontanog pobačaja — AWA',
  },
  sl: {
    badge: 'PO SPONTANEM SPLAVU • OKREVANJE',
    title: 'Telesno okrevanje po\nspontanem splavu',
    metaDuration: '7 min branja',
    metaType: 'Članek',
    metaLevel: 'Začetnica',
    metaValidated: 'Informativna vsebina',
    intro: 'Tvojemu telesu je treba časa, da spet najde ravnovesje. Tu je, kar ti lahko nežno pomaga bolje razumeti to fazo.',
    contentsTitle: 'V tem članku',
    topics: [
      'Kaj je spontani splav?',
      'Kaj se lahko zgodi telesno',
      'Vrnitev cikla',
      'Pomirjujoč zdravniški pregled',
      'Kdaj poiskati zdravniško oskrbo',
      'Ključna sporočila',
    ],
    section1Body1: 'Spontani splav je spontana prekinitev nosečnosti, najpogosteje pred 12. do 14. tednom. Ocenjuje se, da ena od šestih do sedmih potrjenih nosečnosti konča na ta način, najpogosteje zgodaj v nosečnosti.',
    section1Body2: 'Ni redek niti ni znak prihodnje težave s plodnostjo. V veliki večini primerov je povezan z dejavniki, na katere nihče ne more vplivati, kot je kromosomska anomalija, ki je slučajno nastala med razvojem.',
    infoCard1Title: 'Ključno sporočilo',
    infoCard1Text: 'Spontanega splava ne povzroči nič, kar si naredila ali nisi naredila. Nisi odgovorna za to, kar se je zgodilo.',
    section2Body: 'Vsaka izkušnja je drugačna od osebe do osebe. Tu so najpogostejši znaki:',
    physicalSigns: [
      {title: 'Krvavitev', text: 'Njena intenzivnost in trajanje se lahko razlikujeta glede na situacijo, nato se postopoma zmanjšata.'},
      {title: 'Krči', text: 'Bolečina, podobna menstrualnim krčem, včasih močnejša, lahko spremlja to fazo.'},
      {title: 'Spremenljivo trajanje', text: 'Telesno okrevanje običajno traja od nekaj dni do nekaj tednov.'},
    ],
    section3Body: 'Tvojemu telesu na splošno traja nekaj tednov, da po spontanem splavu ponovno vzpostavi hormonsko ravnovesje. Cikel se lahko vrne že po 4 do 6 tednih, vendar je vsaka pot drugačna.',
    comfortTips: [
      {title: 'Dovoli si počitek', text: 'Tvojemu telesu je treba časa, da spet najde ravnovesje, brez pritiska za doseganje določenega izida.'},
      {title: 'Ostani dobro hidrirana', text: 'Dobra hidracija naravno podpira okrevanje.'},
      {title: 'Prisluhni svojemu telesu', text: 'Vsaka pot je drugačna: napreduj v svojem tempu, brez primerjanja z drugimi.'},
    ],
    section4Body: 'Zdravniški pregled pomaga potrditi, da vse poteka normalno, s popolnim mirom. Ta pregled je tudi priložnost, da postaviš vsa svoja vprašanja.',
    infoCard2Title: 'Kaj lahko vključuje ta pregled',
    infoCard2Text: 'Pogovor o tem, kar si preživela, pregled, če je potreben, in prostor za odgovore na tvoja vprašanja o tem, kaj sledi.',
    section5Body: 'Če se pojavi kateri od teh znakov, je pomembno, da se takoj obrneš na zdravstvenega delavca.',
    warningTitle: 'Znaki, ki zahtevajo zdravniški nasvet',
    warningSigns: [
      'Vročina ali poslabšanje splošnega stanja',
      'Zelo obilna krvavitev (potreba po menjavi zaščite v manj kot eni uri)',
      'Huda bolečina, ki se ne zmanjšuje',
      'Nenavaden vonj',
    ],
    tipTitle: 'Vredno vedeti',
    tipText: 'Skrb za telo ne pomeni imeti nadzor nad vsem: predvsem pomeni dati si časa, ki ga potrebuješ.',
    summaryPoints: [
      'Spontanega splava ne povzroči nič, kar si naredila ali nisi naredila.',
      'Tvojemu telesu na splošno traja nekaj tednov, da ponovno vzpostavi hormonsko ravnovesje.',
      'Cikel se lahko vrne že po 4 do 6 tednih, vendar je vsaka pot drugačna.',
      'Zdravniški pregled ti omogoča, da potrdiš, da vse poteka normalno, s popolnim mirom.',
    ],
    disclaimerText: 'Informativna vsebina. Ta članek ne nadomešča zdravniškega nasveta ali pregleda. V primeru dvoma ali zaskrbljujočih simptomov poišči nasvet zdravstvenega delavca.',
    shareMessage: 'Telesno okrevanje po spontanem splavu — AWA',
  },
  ne: {
    badge: 'गर्भपतनपछि • स्वास्थ्यलाभ',
    title: 'गर्भपतनपछि शारीरिक\nस्वास्थ्यलाभ',
    metaDuration: '7 मिनेट पढाइ',
    metaType: 'लेख',
    metaLevel: 'सुरुवाती',
    metaValidated: 'जानकारीमूलक सामग्री',
    intro: 'तपाईंको शरीरलाई फेरि सन्तुलन भेट्टाउन समय चाहिन्छ। यो चरणलाई कोमलतापूर्वक राम्ररी बुझ्न के मद्दत गर्न सक्छ, यहाँ छ।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'गर्भपतन के हो?',
      'शारीरिक रूपमा के हुन सक्छ',
      'तपाईंको चक्र फर्कने',
      'आश्वस्त पार्ने चिकित्सकीय जाँच',
      'चिकित्सकीय हेरचाह कहिले खोज्ने',
      'मुख्य कुराहरू',
    ],
    section1Body1: 'गर्भपतन गर्भावस्थाको स्वतःस्फूर्त अन्त्य हो, प्रायः 12 औँ देखि 14 औँ हप्ताअघि। पुष्टि भएका छ-सात गर्भावस्थामध्ये एकको अन्त्य यसरी हुन्छ भन्ने अनुमान गरिन्छ, प्रायः गर्भावस्थाको सुरुमै।',
    section1Body2: 'यो दुर्लभ होइन, र भविष्यको उर्वरता समस्याको संकेत पनि होइन। अधिकांश अवस्थामा, यो कसैको नियन्त्रणबाहिरका कारकहरूसँग जोडिएको हुन्छ, जस्तै विकासको क्रममा संयोगवश भएको क्रोमोजोमल विसङ्गति।',
    infoCard1Title: 'मुख्य कुरा',
    infoCard1Text: 'गर्भपतन तपाईंले गरेको वा नगरेको कुनै कुराका कारणले हुँदैन। जे भयो त्यसका लागि तपाईं जिम्मेवार हुनुहुन्न।',
    section2Body: 'हरेक अनुभव एक व्यक्तिदेखि अर्कोमा फरक हुन्छ। सबैभन्दा सामान्य संकेतहरू यी हुन्:',
    physicalSigns: [
      {title: 'रक्तस्राव', text: 'यसको तीव्रता र अवधि अवस्थाअनुसार फरक हुन सक्छ, त्यसपछि बिस्तारै घट्छ।'},
      {title: 'ऐंठन', text: 'महिनावारीको ऐंठनजस्तै दुखाइ, कहिलेकाहीँ अझ तीव्र, यस चरणसँगै आउन सक्छ।'},
      {title: 'फरक पर्ने अवधि', text: 'शारीरिक स्वास्थ्यलाभ सामान्यतया केही दिनदेखि केही हप्तासम्म चल्छ।'},
    ],
    section3Body: 'गर्भपतनपछि तपाईंको शरीरले हर्मोनल सन्तुलन फेरि पाउन सामान्यतया केही हप्ता लिन्छ। चक्र 4 देखि 6 हप्तामै फर्कन सक्छ, तर हरेक यात्रा फरक हुन्छ।',
    comfortTips: [
      {title: 'आफूलाई आराम गर्न दिनुहोस्', text: 'तपाईंको शरीरलाई फेरि सन्तुलन भेट्टाउन समय चाहिन्छ, कुनै विशेष नतिजा प्राप्त गर्ने दबाबबिना।'},
      {title: 'राम्ररी पानी पिउनुहोस्', text: 'राम्रो पानीको सेवनले स्वाभाविक रूपमा स्वास्थ्यलाभलाई साथ दिन्छ।'},
      {title: 'आफ्नो शरीरको कुरा सुन्नुहोस्', text: 'हरेक यात्रा फरक हुन्छ: अरूसँग तुलना नगरी आफ्नै गतिमा अघि बढ्नुहोस्।'},
    ],
    section4Body: 'चिकित्सकीय जाँचले सबै कुरा सामान्य रूपमा अघि बढिरहेको पुष्टि गर्न, पूर्ण मनको शान्तिका साथ, मद्दत गर्छ। यो भेटघाट आफ्ना सबै प्रश्न सोध्ने अवसर पनि हो।',
    infoCard2Title: 'यो भेटघाटमा के समावेश हुन सक्छ',
    infoCard2Text: 'तपाईंले जे बित्यो त्यसबारे कुराकानी, आवश्यक परे जाँच, र अब के हुन्छ भन्नेबारे तपाईंका प्रश्नहरूको जवाफ दिने ठाउँ।',
    section5Body: 'यी कुनै संकेत देखिएमा, स्वास्थ्यकर्मीसँग तुरुन्तै सम्पर्क गर्नु महत्त्वपूर्ण छ।',
    warningTitle: 'चिकित्सकीय सल्लाह चाहिने संकेतहरू',
    warningSigns: [
      'ज्वरो वा बिग्रँदो समग्र अवस्था',
      'निकै धेरै रक्तस्राव (एक घण्टाभन्दा कममा सुरक्षा बदल्नुपर्ने)',
      'सुधार नहुने तीव्र दुखाइ',
      'असामान्य गन्ध',
    ],
    tipTitle: 'जान्न लायक',
    tipText: 'आफ्नो शरीरको ख्याल राख्नुको अर्थ सबै कुरा नियन्त्रण गर्नु होइन: यो मुख्यतया आफूलाई चाहिने समय दिनु हो।',
    summaryPoints: [
      'गर्भपतन तपाईंले गरेको वा नगरेको कुनै कुराका कारणले हुँदैन।',
      'तपाईंको शरीरले हर्मोनल सन्तुलन फेरि पाउन सामान्यतया केही हप्ता लिन्छ।',
      'चक्र 4 देखि 6 हप्तामै फर्कन सक्छ, तर हरेक यात्रा फरक हुन्छ।',
      'चिकित्सकीय जाँचले तपाईंलाई सबै कुरा सामान्य रूपमा अघि बढिरहेको पूर्ण मनको शान्तिका साथ पुष्टि गर्न दिन्छ।',
    ],
    disclaimerText: 'जानकारीमूलक सामग्री। यो लेखले चिकित्सकीय सल्लाह वा जाँचको स्थान लिँदैन। शङ्का भए वा चिन्ताजनक लक्षण देखिए स्वास्थ्यकर्मीसँग सल्लाह लिनुहोस्।',
    shareMessage: 'गर्भपतनपछि शारीरिक स्वास्थ्यलाभ — AWA',
  },
  si: {
    badge: 'ගබ්සාවකින් පසු • යථා තත්ත්වයට පැමිණීම',
    title: 'ගබ්සාවකින් පසු \nශාරීරික යථා තත්ත්වයට පැමිණීම',
    metaDuration: 'කියවීමට මිනිත්තු 7',
    metaType: 'ලිපිය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'තොරතුරු අන්තර්ගතය',
    intro: 'ඔබේ ශරීරයට නැවත සමතුලිතතාව සොයාගැනීමට කාලය අවශ්‍යයි. මෙම අවධිය මෘදුවට වඩා හොඳින් තේරුම් ගැනීමට ඔබට උපකාරී විය හැකි දේ මෙන්න.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'ගබ්සාවක් යනු කුමක්ද?',
      'කායිකව සිදුවිය හැක්කේ කුමක්ද',
      'ඔබේ චක්‍රය නැවත පැමිණීම',
      'සැනසිලිදායක වෛද්‍ය පරීක්ෂාවක්',
      'වෛද්‍ය සත්කාර ලබාගත යුත්තේ කවදාද',
      'ප්‍රධාන කරුණු',
    ],
    section1Body1: 'ගබ්සාවක් යනු ගර්භණී කාලයක ස්වයංසිද්ධ අවසානයයි, බොහෝ විට 12 වන සිට 14 වන සතියට පෙර. තහවුරු කළ ගර්භණී කාල හයක් හෝ හතක් අතරින් එකක් මේ ආකාරයෙන් අවසන් වන බව ඇස්තමේන්තු කෙරේ, බොහෝ විට ගර්භණී කාලයේ මුලදී.',
    section1Body2: 'එය දුර්ලභ නොවන අතර, අනාගත සාරවත් බව ගැටලුවක සලකුණක්ද නොවේ. බහුතර අවස්ථාවලදී, එය වර්ධනය අතරතුර අහම්බෙන් සිදු වූ වර්ණදේහ විෂමතාවක් වැනි, කිසිවෙකුගේ පාලනයෙන් ඔබ්බට වූ සාධක සමඟ සම්බන්ධ වේ.',
    infoCard1Title: 'ප්‍රධාන කරුණ',
    infoCard1Text: 'ගබ්සාවක් ඇතිවන්නේ ඔබ කළ හෝ නොකළ කිසිවක් නිසා නොවේ. සිදු වූ දේට ඔබ වගකිව යුතු නැත.',
    section2Body: 'සෑම අත්දැකීමක්ම පුද්ගලයාගෙන් පුද්ගලයාට වෙනස්. වඩාත්ම පොදු සලකුණු මෙන්න:',
    physicalSigns: [
      {title: 'ලේ ගැලීම', text: 'එහි තීව්‍රතාව සහ කාලය තත්ත්වය අනුව වෙනස් විය හැකි අතර, පසුව ක්‍රමයෙන් අඩු වේ.'},
      {title: 'මාංශ පේශි සංකෝචන', text: 'ඔසප් වේදනාවට සමාන වේදනාව, සමහර විට වඩා දැඩි, මෙම අවධිය සමඟ පැවතිය හැක.'},
      {title: 'වෙනස් වන කාලයක්', text: 'ශාරීරික යථා තත්ත්වයට පැමිණීම සාමාන්‍යයෙන් දින කිහිපයක සිට සති කිහිපයක් දක්වා පැතිරේ.'},
    ],
    section3Body: 'ගබ්සාවකින් පසු හෝමෝන සමතුලිතතාව නැවත ලබා ගැනීමට ඔබේ ශරීරයට සාමාන්‍යයෙන් සති කිහිපයක් ගතවේ. චක්‍රයක් සති 4 සිට 6 දක්වා කලින් නැවත පැමිණිය හැක, නමුත් සෑම ගමනක්ම වෙනස්.',
    comfortTips: [
      {title: 'ඔබටම විවේක ගැනීමට ඉඩ දෙන්න', text: 'නිශ්චිත ප්‍රතිඵලයක් සාක්ෂාත් කර ගැනීමට පීඩනයක් නොමැතිව, ඔබේ ශරීරයට නැවත සමතුලිතතාව සොයාගැනීමට කාලය අවශ්‍යයි.'},
      {title: 'හොඳින් ජලය පානය කර සිටින්න', text: 'හොඳ ජල සමතුලිතතාව ස්වභාවිකවම යථා තත්ත්වයට පැමිණීමට සහාය වේ.'},
      {title: 'ඔබේ ශරීරයට සවන් දෙන්න', text: 'සෑම ගමනක්ම වෙනස්: ඔබේම වේගයෙන් ඉදිරියට යන්න, අන් අය සමඟ ඔබව සංසන්දනය නොකර.'},
    ],
    section4Body: 'වෛද්‍ය පරීක්ෂාවක් සියල්ල සාමාන්‍ය ලෙස ප්‍රගතියක් ලබන බව සම්පූර්ණ සන්සුන් සිතින් තහවුරු කිරීමට උපකාරී වේ. මෙම හමුවීම ඔබේ සියලු ප්‍රශ්න ඇසීමට අවස්ථාවක්ද වේ.',
    infoCard2Title: 'මෙම හමුවීමට ඇතුළත් විය හැක්කේ',
    infoCard2Text: 'ඔබ ගත කළ දේ ගැන සංවාදයක්, අවශ්‍ය නම් පරීක්ෂාවක්, සහ ඊළඟට පැමිණෙන දේ ගැන ඔබේ ප්‍රශ්නවලට පිළිතුරු දීමට අවකාශයක්.',
    section5Body: 'මෙම සලකුණුවලින් ඕනෑම එකක් දිස්වුවහොත්, වහාම සෞඛ්‍ය වෘත්තිකයෙකු අමතා ගැනීම වැදගත්.',
    warningTitle: 'වෛද්‍ය උපදෙස් අවශ්‍ය වන සලකුණු',
    warningSigns: [
      'උණ හෝ නරක අතට හැරෙන සමස්ත තත්ත්වයක්',
      'ඉතා වැඩි ලේ ගැලීම (පැයකට අඩු කාලයකින් ඔබේ ආරක්ෂාව වෙනස් කිරීමට අවශ්‍ය වීම)',
      'යහපත් නොවන දැඩි වේදනාව',
      'අසාමාන්‍ය ගඳක්',
    ],
    tipTitle: 'දැනගත යුතු දේ',
    tipText: 'ඔබේ ශරීරය ගැන සැලකිලිමත් වීම යනු සෑම දෙයක්ම පාලනය කිරීම නොවේ: එයින් ප්‍රධාන වශයෙන් අදහස් වන්නේ ඔබට අවශ්‍ය කාලය ඔබටම ලබා දීමයි.',
    summaryPoints: [
      'ගබ්සාවක් ඇතිවන්නේ ඔබ කළ හෝ නොකළ කිසිවක් නිසා නොවේ.',
      'හෝමෝන සමතුලිතතාව නැවත ලබා ගැනීමට ඔබේ ශරීරයට සාමාන්‍යයෙන් සති කිහිපයක් ගතවේ.',
      'චක්‍රයක් සති 4 සිට 6 දක්වා කලින් නැවත පැමිණිය හැක, නමුත් සෑම ගමනක්ම වෙනස්.',
      'වෛද්‍ය පරීක්ෂාවක් සියල්ල සාමාන්‍ය ලෙස ප්‍රගතියක් ලබන බව සම්පූර්ණ සන්සුන් සිතින් තහවුරු කිරීමට ඔබට ඉඩ සලසයි.',
    ],
    disclaimerText: 'තොරතුරු අන්තර්ගතයකි. මෙම ලිපිය වෛද්‍ය උපදෙස් හෝ පරීක්ෂණයක් වෙනුවට නොපවතී. සැකයක් ඇත්නම් හෝ කනස්සල්ලට කරුණක් වන රෝග ලක්ෂණ අත්විඳින්නේ නම්, සෞඛ්‍ය වෘත්තිකයෙකුගෙන් උපදෙස් ලබා ගන්න.',
    shareMessage: 'ගබ්සාවකින් පසු ශාරීරික යථා තත්ත්වයට පැමිණීම — AWA',
  },
  th: {
    badge: 'หลังการแท้งบุตร • การฟื้นตัว',
    title: 'การฟื้นตัวทางร่างกาย\nหลังการแท้งบุตร',
    metaDuration: 'อ่าน 7 นาที',
    metaType: 'บทความ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาเพื่อให้ข้อมูล',
    intro: 'ร่างกายของคุณต้องใช้เวลาหาสมดุลอีกครั้ง นี่คือสิ่งที่ช่วยให้คุณเข้าใจช่วงนี้ได้ดีขึ้นอย่างอ่อนโยน',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'การแท้งบุตรคืออะไร?',
      'สิ่งที่อาจเกิดขึ้นทางร่างกาย',
      'การกลับมาของรอบเดือนของคุณ',
      'การตรวจที่ช่วยให้สบายใจ',
      'เมื่อไรควรไปพบแพทย์',
      'ประเด็นสำคัญ',
    ],
    section1Body1: 'การแท้งบุตรคือการสิ้นสุดของการตั้งครรภ์เองโดยธรรมชาติ ส่วนใหญ่ก่อนสัปดาห์ที่ 12 ถึง 14 คาดว่าการตั้งครรภ์ที่ยืนยันแล้วหนึ่งใน 6 ถึง 7 ครั้งสิ้นสุดลงเช่นนี้ ส่วนใหญ่เกิดขึ้นในช่วงต้นของการตั้งครรภ์',
    section1Body2: 'ไม่ใช่เรื่องหายาก และไม่ใช่สัญญาณของปัญหาภาวะเจริญพันธุ์ในอนาคต ในกรณีส่วนใหญ่ เกี่ยวข้องกับปัจจัยที่ไม่มีใครควบคุมได้ เช่น ความผิดปกติของโครโมโซมที่เกิดขึ้นโดยบังเอิญระหว่างการพัฒนา',
    infoCard1Title: 'ประเด็นสำคัญ',
    infoCard1Text: 'การแท้งบุตรไม่ได้เกิดจากสิ่งที่คุณทำหรือไม่ได้ทำ คุณไม่ต้องรับผิดชอบต่อสิ่งที่เกิดขึ้น',
    section2Body: 'ประสบการณ์ของแต่ละคนแตกต่างกัน นี่คือสัญญาณที่พบบ่อยที่สุด:',
    physicalSigns: [
      {title: 'เลือดออก', text: 'ความมากน้อยและระยะเวลาอาจแตกต่างกันตามสถานการณ์ แล้วค่อย ๆ ลดลง'},
      {title: 'ปวดเกร็ง', text: 'อาการปวดคล้ายปวดประจำเดือน บางครั้งรุนแรงกว่า อาจเกิดขึ้นในระยะนี้'},
      {title: 'ระยะเวลาที่แปรผัน', text: 'การฟื้นตัวทางร่างกายมักกินเวลาไม่กี่วันถึงไม่กี่สัปดาห์'},
    ],
    section3Body: 'ร่างกายของคุณมักใช้เวลาไม่กี่สัปดาห์เพื่อกลับสู่สมดุลของฮอร์โมนหลังการแท้งบุตร รอบเดือนอาจกลับมาเร็วที่สุดใน 4 ถึง 6 สัปดาห์ แต่เส้นทางของแต่ละคนต่างกัน',
    comfortTips: [
      {title: 'อนุญาตให้ตัวเองพักผ่อน', text: 'ร่างกายของคุณต้องใช้เวลาหาสมดุลอีกครั้ง โดยไม่มีแรงกดดันให้ได้ผลลัพธ์ใดเป็นพิเศษ'},
      {title: 'ดื่มน้ำให้เพียงพอ', text: 'การดื่มน้ำที่ดีสนับสนุนการฟื้นตัวตามธรรมชาติ'},
      {title: 'ฟังเสียงร่างกายของคุณ', text: 'เส้นทางของแต่ละคนต่างกัน: ก้าวไปตามจังหวะของคุณ โดยไม่เปรียบเทียบกับผู้อื่น'},
    ],
    section4Body: 'การตรวจทางการแพทย์ช่วยยืนยันว่าทุกอย่างดำเนินไปตามปกติ ด้วยความสบายใจอย่างเต็มที่ การนัดหมายนี้ยังเป็นโอกาสถามคำถามทั้งหมดของคุณ',
    infoCard2Title: 'สิ่งที่การนัดหมายนี้อาจรวมถึง',
    infoCard2Text: 'การพูดคุยเกี่ยวกับสิ่งที่คุณผ่านมา การตรวจหากจำเป็น และพื้นที่ตอบคำถามของคุณเกี่ยวกับสิ่งที่จะตามมา',
    section5Body: 'หากมีสัญญาณเหล่านี้ปรากฏ สิ่งสำคัญคือต้องติดต่อบุคลากรทางการแพทย์ทันที',
    warningTitle: 'สัญญาณที่ควรขอคำแนะนำทางการแพทย์',
    warningSigns: [
      'ไข้หรือสภาพโดยรวมที่แย่ลง',
      'เลือดออกมากผิดปกติ (ต้องเปลี่ยนอุปกรณ์ในเวลาไม่ถึงหนึ่งชั่วโมง)',
      'อาการปวดรุนแรงที่ไม่ดีขึ้น',
      'กลิ่นผิดปกติ',
    ],
    tipTitle: 'ควรรู้',
    tipText: 'การดูแลร่างกายไม่ได้หมายถึงการควบคุมทุกอย่าง: เป็นการให้เวลาที่คุณต้องการแก่ตัวเองเป็นหลัก',
    summaryPoints: [
      'การแท้งบุตรไม่ได้เกิดจากสิ่งที่คุณทำหรือไม่ได้ทำ',
      'ร่างกายของคุณมักใช้เวลาไม่กี่สัปดาห์เพื่อกลับสู่สมดุลของฮอร์โมน',
      'รอบเดือนอาจกลับมาเร็วที่สุดใน 4 ถึง 6 สัปดาห์ แต่เส้นทางของแต่ละคนต่างกัน',
      'การตรวจทางการแพทย์ช่วยยืนยันว่าทุกอย่างดำเนินไปตามปกติ ด้วยความสบายใจอย่างเต็มที่',
    ],
    disclaimerText: 'เนื้อหาเพื่อให้ข้อมูล บทความนี้ไม่ได้ทดแทนคำแนะนำทางการแพทย์หรือการตรวจ หากมีข้อสงสัยหรือมีอาการที่น่ากังวล โปรดขอคำแนะนำจากบุคลากรทางการแพทย์',
    shareMessage: 'การฟื้นตัวทางร่างกายหลังการแท้งบุตร — AWA',
  },
  vi: {
    badge: 'SAU KHI MẤT THAI • HỒI PHỤC',
    title: 'Hồi phục thể chất sau \nkhi mất thai',
    metaDuration: '7 phút đọc',
    metaType: 'Bài viết',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung mang tính thông tin',
    intro: 'Cơ thể bạn cần thời gian để tìm lại sự cân bằng. Sau đây là những điều có thể giúp bạn hiểu rõ hơn giai đoạn này, một cách nhẹ nhàng.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Sảy thai là gì?',
      'Điều gì có thể xảy ra về mặt thể chất',
      'Chu kỳ của bạn trở lại',
      'Một lần kiểm tra y tế đáng yên tâm',
      'Khi nào nên tìm sự chăm sóc y tế',
      'Những điểm chính cần nhớ',
    ],
    section1Body1: 'Sảy thai là việc thai kỳ tự kết thúc, thường xảy ra nhất trước tuần thứ 12 đến 14. Ước tính cứ sáu đến bảy thai kỳ được xác nhận thì có một thai kỳ kết thúc theo cách này, thường là sớm trong thai kỳ.',
    section1Body2: 'Điều này không hiếm, cũng không phải là dấu hiệu của vấn đề sinh sản trong tương lai. Trong đại đa số trường hợp, nó liên quan đến những yếu tố nằm ngoài tầm kiểm soát của bất kỳ ai, chẳng hạn như một bất thường nhiễm sắc thể xảy ra ngẫu nhiên trong quá trình phát triển.',
    infoCard1Title: 'Điểm chính cần nhớ',
    infoCard1Text: 'Sảy thai không phải do bất cứ điều gì bạn đã làm hay không làm. Bạn không chịu trách nhiệm về những gì đã xảy ra.',
    section2Body: 'Mỗi trải nghiệm khác nhau ở từng người. Sau đây là những dấu hiệu thường gặp nhất:',
    physicalSigns: [
      {title: 'Ra máu', text: 'Cường độ và thời gian của nó có thể khác nhau tùy tình huống, rồi dần giảm đi.'},
      {title: 'Co thắt', text: 'Cơn đau giống đau bụng kinh, đôi khi dữ dội hơn, có thể đi kèm giai đoạn này.'},
      {title: 'Thời gian khác nhau', text: 'Quá trình hồi phục thể chất thường kéo dài từ vài ngày đến vài tuần.'},
    ],
    section3Body: 'Cơ thể bạn thường mất vài tuần để lấy lại sự cân bằng nội tiết sau khi sảy thai. Chu kỳ có thể trở lại sớm nhất sau 4 đến 6 tuần, nhưng mỗi hành trình đều khác nhau.',
    comfortTips: [
      {title: 'Cho phép bản thân nghỉ ngơi', text: 'Cơ thể bạn cần thời gian để tìm lại sự cân bằng, không áp lực phải đạt một kết quả cụ thể nào.'},
      {title: 'Uống đủ nước', text: 'Uống đủ nước hỗ trợ quá trình hồi phục một cách tự nhiên.'},
      {title: 'Lắng nghe cơ thể bạn', text: 'Mỗi hành trình đều khác nhau: hãy đi theo nhịp của riêng bạn, không so sánh với người khác.'},
    ],
    section4Body: 'Một lần kiểm tra y tế giúp xác nhận mọi thứ đang tiến triển bình thường, hoàn toàn yên tâm. Buổi hẹn này cũng là cơ hội để bạn đặt mọi câu hỏi.',
    infoCard2Title: 'Buổi hẹn này có thể bao gồm những gì',
    infoCard2Text: 'Một cuộc trò chuyện về những gì bạn đã trải qua, một lần thăm khám nếu cần và không gian để giải đáp các câu hỏi của bạn về những bước tiếp theo.',
    section5Body: 'Nếu xuất hiện bất kỳ dấu hiệu nào sau đây, điều quan trọng là liên hệ ngay với nhân viên y tế.',
    warningTitle: 'Những dấu hiệu cần lời khuyên y khoa',
    warningSigns: [
      'Sốt hoặc tình trạng chung xấu đi',
      'Ra máu rất nhiều (phải thay sản phẩm vệ sinh trong chưa đầy một giờ)',
      'Đau dữ dội không thuyên giảm',
      'Mùi bất thường',
    ],
    tipTitle: 'Nên biết',
    tipText: 'Chăm sóc cơ thể không có nghĩa là kiểm soát mọi thứ: chủ yếu là cho bản thân khoảng thời gian bạn cần.',
    summaryPoints: [
      'Sảy thai không phải do bất cứ điều gì bạn đã làm hay không làm.',
      'Cơ thể bạn thường mất vài tuần để lấy lại sự cân bằng nội tiết.',
      'Chu kỳ có thể trở lại sớm nhất sau 4 đến 6 tuần, nhưng mỗi hành trình đều khác nhau.',
      'Một lần kiểm tra y tế cho phép bạn xác nhận mọi thứ đang tiến triển bình thường, hoàn toàn yên tâm.',
    ],
    disclaimerText: 'Nội dung mang tính thông tin. Bài viết này không thay thế lời khuyên y khoa hay việc thăm khám. Nếu có nghi ngờ hoặc có các triệu chứng đáng lo, hãy tìm lời khuyên từ nhân viên y tế.',
    shareMessage: 'Hồi phục thể chất sau khi mất thai — AWA',
  },
  uz: {
    badge: 'HOMILA TUSHGANDAN KEYIN • TIKLANISH',
    title: 'Homila tushgandan keyingi \njismoniy tiklanish',
    metaDuration: '7 daq oʻqish',
    metaType: 'Maqola',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Maʼlumot uchun kontent',
    intro: 'Tanangiz muvozanatini qayta topishi uchun vaqt kerak. Bu bosqichni muloyim tarzda yaxshiroq tushunishga nima yordam berishi mumkin.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Homila tushishi nima?',
      'Jismonan nima sodir boʻlishi mumkin',
      'Siklingizning qaytishi',
      'Tinchlantiruvchi tibbiy tekshiruv',
      'Qachon tibbiy yordamga murojaat qilish kerak',
      'Asosiy xulosalar',
    ],
    section1Body1: 'Homila tushishi — homiladorlikning, koʻpincha 12-haftadan 14-haftagacha, oʻz-oʻzidan tugashi. Tasdiqlangan homiladorliklarning oltitadan yettitadan biri shunday tugaydi, koʻpincha homiladorlikning boshida.',
    section1Body2: 'Bu kamdan-kam emas va kelajakdagi unumdorlik muammosining belgisi ham emas. Aksariyat hollarda u hech kim nazorat qila olmaydigan omillar bilan bogʻliq, masalan, rivojlanish davomida tasodifan yuz bergan xromosoma anomaliyasi.',
    infoCard1Title: 'Asosiy xulosa',
    infoCard1Text: 'Homila tushishiga siz qilgan yoki qilmagan hech narsa sabab emas. Sodir boʻlgan narsa uchun siz javobgar emassiz.',
    section2Body: 'Har bir tajriba odamdan odamga farq qiladi. Eng keng tarqalgan belgilar:',
    physicalSigns: [
      {title: 'Qon ketishi', text: 'Uning kuchi va davomiyligi vaziyatga qarab farq qilishi, keyin asta-sekin kamayishi mumkin.'},
      {title: 'Qisqarishlar', text: 'Hayz qisqarishlariga oʻxshash, baʼzan kuchliroq ogʻriq bu bosqichga hamroh boʻlishi mumkin.'},
      {title: 'Oʻzgaruvchan davomiylik', text: 'Jismoniy tiklanish odatda bir necha kundan bir necha haftagacha davom etadi.'},
    ],
    section3Body: 'Tana homila tushgandan keyin gormonal muvozanatni qaytarish uchun odatda bir necha hafta vaqt oladi. Sikl 4 haftadan 6 haftagacha qaytishi mumkin, ammo har bir yoʻl boshqacha.',
    comfortTips: [
      {title: 'Oʻzingizga dam berishga ruxsat bering', text: 'Tanangiz muvozanatini qayta topishi uchun vaqt kerak, muayyan natijaga erishish bosimisiz.'},
      {title: 'Suv balansini yaxshi saqlang', text: 'Yaxshi suv balansi tiklanishni tabiiy ravishda qoʻllab-quvvatlaydi.'},
      {title: 'Tanangizni tinglang', text: 'Har bir yoʻl boshqacha: oʻz surʼatingizda harakat qiling, boshqalar bilan solishtirmasdan.'},
    ],
    section4Body: 'Tibbiy tekshiruv hammasi normal kechayotganini toʻliq xotirjamlik bilan tasdiqlashga yordam beradi. Bu qabul ayni paytda barcha savollaringizni berish imkoniyati.',
    infoCard2Title: 'Bu qabul nimani oʻz ichiga olishi mumkin',
    infoCard2Text: 'Boshdan kechirgan narsangiz haqida suhbat, kerak boʻlsa, koʻrik va keyingi qadamlar haqidagi savollaringizga javob beradigan joy.',
    section5Body: 'Agar bu belgilardan biri paydo boʻlsa, darhol sogʻliqni saqlash mutaxassisiga murojaat qilish muhim.',
    warningTitle: 'Tibbiy maslahatni talab qiladigan belgilar',
    warningSigns: [
      'Isitma yoki umumiy holatning yomonlashishi',
      'Juda koʻp qon ketishi (himoya vositasini bir soatdan kam vaqtda almashtirish kerak)',
      'Yaxshilanmaydigan kuchli ogʻriq',
      'Odatdan tashqari hid',
    ],
    tipTitle: 'Bilish foydali',
    tipText: 'Tanangizga gʻamxoʻrlik qilish hamma narsani nazorat qilishni anglatmaydi: bu asosan oʻzingizga kerakli vaqtni berish.',
    summaryPoints: [
      'Homila tushishiga siz qilgan yoki qilmagan hech narsa sabab emas.',
      'Tana odatda gormonal muvozanatni qaytarish uchun bir necha hafta vaqt oladi.',
      'Sikl 4 haftadan 6 haftagacha qaytishi mumkin, ammo har bir yoʻl boshqacha.',
      'Tibbiy tekshiruv hammasi normal kechayotganini toʻliq xotirjamlik bilan tasdiqlash imkonini beradi.',
    ],
    disclaimerText: 'Maʼlumot uchun kontent. Bu maqola tibbiy maslahat yoki koʻrikni almashtirmaydi. Shubha boʻlsa yoki xavotirli alomatlar boʻlsa, sogʻliqni saqlash mutaxassisidan maslahat oling.',
    shareMessage: 'Homila tushgandan keyingi jismoniy tiklanish — AWA',
  },
  az: {
    badge: 'DÜŞÜKDƏN SONRA • BƏRPA',
    title: 'Düşükdən sonra\nfiziki bərpa',
    metaDuration: '7 dəq oxu',
    metaType: 'Məqalə',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Məlumat xarakterli məzmun',
    intro: 'Bədəninizin yenidən tarazlıq tapması üçün vaxta ehtiyacı var. Bu mərhələni mülayim şəkildə daha yaxşı anlamağa nə kömək edə bilər.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Düşük nədir?',
      'Fiziki olaraq nə baş verə bilər',
      'Dövrünüzün qayıtması',
      'Arxayınlaşdıran tibbi yoxlama',
      'Nə vaxt tibbi yardım axtarmaq lazımdır',
      'Əsas nəticələr',
    ],
    section1Body1: 'Düşük hamiləliyin, çox vaxt 12–14-cü həftədən əvvəl, spontan sonlanmasıdır. Təsdiqlənmiş hamiləliklərin altıdan və ya yeddidən birinin bu şəkildə, ən çox hamiləliyin əvvəlində sonlandığı təxmin edilir.',
    section1Body2: 'O, nadir deyil və gələcək münbitlik problemi əlaməti də deyil. Əksər hallarda o, heç kimin nəzarətində olmayan amillərlə, məsələn, inkişaf zamanı təsadüfən baş verən xromosom anomaliyası ilə bağlıdır.',
    infoCard1Title: 'Əsas nəticə',
    infoCard1Text: 'Düşük sizin etdiyiniz və ya etmədiyiniz heç bir şeyin nəticəsi deyil. Baş verənlərə görə siz məsuliyyət daşımırsınız.',
    section2Body: 'Hər təcrübə bir şəxsdən digərinə fərqlidir. Ən geniş yayılmış əlamətlər bunlardır:',
    physicalSigns: [
      {title: 'Qanaxma', text: 'Onun intensivliyi və müddəti vəziyyətdən asılı olaraq dəyişə, sonra tədricən azala bilər.'},
      {title: 'Qıcolmalar', text: 'Aybaşı qıcolmalarına bənzər, bəzən daha şiddətli ağrı bu mərhələni müşayiət edə bilər.'},
      {title: 'Dəyişən müddət', text: 'Fiziki bərpa adətən bir neçə gündən bir neçə həftəyə qədər çəkir.'},
    ],
    section3Body: 'Bədəniniz düşükdən sonra hormonal tarazlığı bərpa etmək üçün adətən bir neçə həftə çəkir. Dövr 4–6 həftədən tez qayıda bilər, lakin hər yol fərqlidir.',
    comfortTips: [
      {title: 'İstirahətə icazə verin', text: 'Bədəninizin yenidən tarazlıq tapmasına vaxt lazımdır, müəyyən nəticəyə nail olmaq təzyiqi olmadan.'},
      {title: 'Yaxşı hidratasiyanı qoruyun', text: 'Yaxşı hidratasiya bərpanı təbii şəkildə dəstəkləyir.'},
      {title: 'Bədəninizi dinləyin', text: 'Hər yol fərqlidir: özünüzü başqaları ilə müqayisə etmədən öz tempinizlə irəliləyin.'},
    ],
    section4Body: 'Tibbi yoxlama hər şeyin normal getdiyini tam arxayınlıqla təsdiqləməyə kömək edir. Bu qəbul həm də bütün suallarınızı vermək üçün fürsətdir.',
    infoCard2Title: 'Bu qəbula nələr daxil ola bilər',
    infoCard2Text: 'Yaşadıqlarınız barədə söhbət, lazım gələrsə, müayinə və növbəti addım barədə suallarınıza cavab verəcək məkan.',
    section5Body: 'Bu əlamətlərdən hər hansı biri görünərsə, dərhal tibb işçisi ilə əlaqə saxlamaq vacibdir.',
    warningTitle: 'Tibbi məsləhət tələb edən əlamətlər',
    warningSigns: [
      'Hərarət və ya pisləşən ümumi vəziyyət',
      'Çox bol qanaxma (qoruyucu vasitəni bir saatdan az müddətdə dəyişmək lazım gəlir)',
      'Yaxşılaşmayan şiddətli ağrı',
      'Qeyri-adi qoxu',
    ],
    tipTitle: 'Bilmək faydalıdır',
    tipText: 'Bədəninizə qulluq etmək hər şeyi idarə etmək demək deyil: bu, əsasən özünüzə lazım olan vaxtı verməkdir.',
    summaryPoints: [
      'Düşük sizin etdiyiniz və ya etmədiyiniz heç bir şeyin nəticəsi deyil.',
      'Bədəniniz hormonal tarazlığı bərpa etmək üçün adətən bir neçə həftə çəkir.',
      'Dövr 4–6 həftədən tez qayıda bilər, lakin hər yol fərqlidir.',
      'Tibbi yoxlama hər şeyin normal getdiyini tam arxayınlıqla təsdiqləməyə imkan verir.',
    ],
    disclaimerText: 'Məlumat xarakterli məzmun. Bu məqalə tibbi məsləhəti və ya müayinəni əvəz etmir. Şübhə olarsa və ya narahatedici simptomlar yaşayırsınızsa, tibb işçisindən məsləhət alın.',
    shareMessage: 'Düşükdən sonra fiziki bərpa — AWA',
  },
  ka: {
    badge: 'ორსულობის დაკარგვის შემდეგ • გამოჯანმრთელება',
    title: 'ფიზიკური გამოჯანმრთელება\nორსულობის დაკარგვის შემდეგ',
    metaDuration: '7 წთ საკითხავი',
    metaType: 'სტატია',
    metaLevel: 'დამწყები',
    metaValidated: 'საინფორმაციო შინაარსი',
    intro: 'თქვენს სხეულს ბალანსის ხელახლა პოვნისთვის დრო სჭირდება. აი, რამ შეიძლება დაგეხმაროთ ამ ეტაპის უკეთ, ნაზად გაგებაში.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'რა არის ორსულობის თვითნებური შეწყვეტა?',
      'რა შეიძლება მოხდეს ფიზიკურად',
      'თქვენი ციკლის დაბრუნება',
      'დამამშვიდებელი სამედიცინო შემოწმება',
      'როდის მოვიძიოთ სამედიცინო დახმარება',
      'მთავარი დასკვნები',
    ],
    section1Body1: 'ორსულობის თვითნებური შეწყვეტა ორსულობის სპონტანური დასრულებაა, ყველაზე ხშირად მე-12–მე-14 კვირამდე. მიჩნეულია, რომ დადასტურებული ორსულობის ექვსიდან შვიდიდან ერთი ასე მთავრდება, ყველაზე ხშირად ორსულობის დასაწყისში.',
    section1Body2: 'ეს იშვიათი არ არის და მომავალი ფერტილობის პრობლემის ნიშანიც არ არის. შემთხვევათა აბსოლუტურ უმრავლესობაში ის ისეთ ფაქტორებს უკავშირდება, რომლებიც არავის კონტროლს არ ექვემდებარება, როგორიცაა განვითარებისას შემთხვევით მომხდარი ქრომოსომული ანომალია.',
    infoCard1Title: 'მთავარი დასკვნა',
    infoCard1Text: 'ორსულობის დაკარგვა არ არის გამოწვეული იმით, რაც თქვენ გააკეთეთ ან არ გააკეთეთ. თქვენ არ ხართ პასუხისმგებელი იმაზე, რაც მოხდა.',
    section2Body: 'ყოველი გამოცდილება ადამიანიდან ადამიანამდე განსხვავებულია. აი, ყველაზე გავრცელებული ნიშნები:',
    physicalSigns: [
      {title: 'სისხლდენა', text: 'მისი ინტენსივობა და ხანგრძლივობა სიტუაციის მიხედვით შეიძლება განსხვავდებოდეს, შემდეგ ეტაპობრივად მცირდება.'},
      {title: 'სპაზმები', text: 'მენსტრუაციულ სპაზმებთან მსგავსი ტკივილი, ზოგჯერ უფრო ინტენსიური, შეიძლება თან ახლდეს ამ ეტაპს.'},
      {title: 'ცვალებადი ხანგრძლივობა', text: 'ფიზიკური გამოჯანმრთელება, როგორც წესი, რამდენიმე დღიდან რამდენიმე კვირამდე გრძელდება.'},
    ],
    section3Body: 'თქვენს სხეულს, როგორც წესი, ორსულობის დაკარგვის შემდეგ ჰორმონული ბალანსის აღდგენისთვის რამდენიმე კვირა სჭირდება. ციკლი შეიძლება 4-დან 6 კვირაშივე დაბრუნდეს, მაგრამ ყოველი გზა განსხვავებულია.',
    comfortTips: [
      {title: 'მიეცით თავს დასვენების საშუალება', text: 'თქვენს სხეულს ბალანსის ხელახლა პოვნისთვის დრო სჭირდება, კონკრეტული შედეგის მიღწევის ზეწოლის გარეშე.'},
      {title: 'შეინარჩუნეთ კარგი ჰიდრატაცია', text: 'კარგი ჰიდრატაცია ბუნებრივად უჭერს მხარს გამოჯანმრთელებას.'},
      {title: 'მოუსმინეთ თქვენს სხეულს', text: 'ყოველი გზა განსხვავებულია: იმოძრავეთ თქვენი ტემპით, სხვებთან შედარების გარეშე.'},
    ],
    section4Body: 'სამედიცინო შემოწმება გეხმარებათ დარწმუნდეთ, რომ ყველაფერი ნორმალურად მიმდინარეობს, სრული სიმშვიდით. ეს ვიზიტი ასევე შესაძლებლობაა, ყველა თქვენი კითხვა დასვათ.',
    infoCard2Title: 'რა შეიძლება მოიცავდეს ეს ვიზიტი',
    infoCard2Text: 'საუბარი იმაზე, რაც გადაიტანეთ, საჭიროების შემთხვევაში გასინჯვა და სივრცე თქვენი კითხვებისთვის იმის შესახებ, რაც შემდეგ მოდის.',
    section5Body: 'თუ ამ ნიშნებიდან რომელიმე გამოჩნდა, მნიშვნელოვანია დაუყოვნებლივ დაუკავშირდეთ ჯანდაცვის სპეციალისტს.',
    warningTitle: 'ნიშნები, რომლებიც სამედიცინო რჩევას მოითხოვს',
    warningSigns: [
      'ცხელება ან საერთო მდგომარეობის გაუარესება',
      'ძალიან უხვი სისხლდენა (დამცავი საშუალების შეცვლის საჭიროება ერთ საათზე ნაკლებ დროში)',
      'ინტენსიური ტკივილი, რომელიც არ უმჯობესდება',
      'უჩვეულო სუნი',
    ],
    tipTitle: 'კარგია ვიცოდეთ',
    tipText: 'საკუთარ სხეულზე ზრუნვა ყველაფრის კონტროლს არ ნიშნავს: ის ძირითადად ნიშნავს, საკუთარ თავს მისცეთ საჭირო დრო.',
    summaryPoints: [
      'ორსულობის დაკარგვა არ არის გამოწვეული იმით, რაც თქვენ გააკეთეთ ან არ გააკეთეთ.',
      'თქვენს სხეულს, როგორც წესი, ჰორმონული ბალანსის აღდგენისთვის რამდენიმე კვირა სჭირდება.',
      'ციკლი შეიძლება 4-დან 6 კვირაშივე დაბრუნდეს, მაგრამ ყოველი გზა განსხვავებულია.',
      'სამედიცინო შემოწმება საშუალებას გაძლევთ დარწმუნდეთ, რომ ყველაფერი ნორმალურად მიმდინარეობს, სრული სიმშვიდით.',
    ],
    disclaimerText: 'საინფორმაციო შინაარსი. ეს სტატია სამედიცინო რჩევას ან გასინჯვას არ ანაცვლებს. ეჭვის შემთხვევაში ან შემაშფოთებელი სიმპტომების დროს მიმართეთ ჯანდაცვის სპეციალისტს.',
    shareMessage: 'ფიზიკური გამოჯანმრთელება ორსულობის დაკარგვის შემდეგ — AWA',
  },
  hy: {
    badge: 'ՎԻԺՈՒՄԻՑ ՀԵՏՈ • ՎԵՐԱԿԱՆԳՆՈՒՄ',
    title: 'Ֆիզիկական վերականգնում\nվիժումից հետո',
    metaDuration: '7 ր կարդալու համար',
    metaType: 'Հոդված',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Տեղեկատվական բովանդակություն',
    intro: 'Ձեր մարմինը ժամանակի կարիք ունի՝ կրկին հավասարակշռություն գտնելու համար: Ահա ինչը կարող է օգնել ձեզ մեղմորեն ավելի լավ հասկանալ այս փուլը:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Ի՞նչ է վիժումը',
      'Ինչ կարող է տեղի ունենալ ֆիզիկապես',
      'Ձեր ցիկլի վերադարձ',
      'Հանգստացնող բժշկական հետազոտություն',
      'Երբ դիմել բժշկական օգնության',
      'Հիմնական եզրակացություններ',
    ],
    section1Body1: 'Վիժումը հղիության ինքնաբուխ ավարտն է, ամենից հաճախ 12–14-րդ շաբաթից առաջ: Գնահատվում է, որ հաստատված հղիությունների վեցից յոթից մեկն ավարտվում է այսպես, ամենից հաճախ հղիության սկզբում:',
    section1Body2: 'Դա հազվադեպ չէ, ինչպես նաև ապագա պտղաբերության խնդրի նշան չէ: Դեպքերի ճնշող մեծամասնությունում այն կապված է գործոնների հետ, որոնք որևէ մեկի վերահսկողությունից դուրս են, օրինակ՝ քրոմոսոմային շեղում, որը պատահականորեն առաջացել է զարգացման ընթացքում:',
    infoCard1Title: 'Հիմնական եզրակացություն',
    infoCard1Text: 'Վիժումը չի առաջանում որևէ բանից, որ դուք արել կամ չեք արել: Դուք պատասխանատու չեք տեղի ունեցածի համար:',
    section2Body: 'Յուրաքանչյուր փորձառություն տարբեր է մարդուց մարդ: Ահա ամենատարածված նշանները.',
    physicalSigns: [
      {title: 'Արյունահոսություն', text: 'Դրա ինտենսիվությունը և տևողությունը կարող են տարբերվել՝ կախված իրավիճակից, ապա աստիճանաբար նվազել:'},
      {title: 'Ջղաձգումներ', text: 'Դաշտանային ջղաձգումներին նման ցավը, երբեմն ավելի ինտենսիվ, կարող է ուղեկցել այս փուլին:'},
      {title: 'Փոփոխվող տևողություն', text: 'Ֆիզիկական վերականգնումը սովորաբար տևում է մի քանի օրից մինչև մի քանի շաբաթ:'},
    ],
    section3Body: 'Ձեր մարմինը սովորաբար մի քանի շաբաթ է պահանջում վիժումից հետո հորմոնալ հավասարակշռությունը վերականգնելու համար: Ցիկլը կարող է վերադառնալ արդեն 4–6 շաբաթից, սակայն յուրաքանչյուր ճանապարհ տարբեր է:',
    comfortTips: [
      {title: 'Թույլ տվեք ինքներդ ձեզ հանգստանալ', text: 'Ձեր մարմինը ժամանակի կարիք ունի՝ կրկին հավասարակշռություն գտնելու համար՝ առանց որևէ կոնկրետ արդյունքի հասնելու ճնշման:'},
      {title: 'Մնացեք լավ հիդրատացված', text: 'Լավ հիդրատացիան բնականորեն աջակցում է վերականգնմանը:'},
      {title: 'Լսեք ձեր մարմինը', text: 'Յուրաքանչյուր ճանապարհ տարբեր է. շարժվեք ձեր տեմպով՝ առանց ուրիշների հետ համեմատվելու:'},
    ],
    section4Body: 'Բժշկական հետազոտությունը օգնում է հաստատել, որ ամեն ինչ նորմալ է ընթանում՝ լիակատար հանգստությամբ: Այս այցը նաև առիթ է տալու ձեր բոլոր հարցերը:',
    infoCard2Title: 'Ինչ կարող է ներառել այս այցը',
    infoCard2Text: 'Զրույց ձեր անցածի մասին, անհրաժեշտության դեպքում՝ հետազոտություն, և տարածք՝ հետագայի մասին ձեր հարցերին պատասխանելու համար:',
    section5Body: 'Եթե այս նշաններից որևէ մեկը հայտնվի, կարևոր է անմիջապես կապվել առողջապահության մասնագետի հետ:',
    warningTitle: 'Նշաններ, որոնք պահանջում են բժշկական խորհրդատվություն',
    warningSigns: [
      'Ջերմություն կամ ընդհանուր վիճակի վատացում',
      'Շատ առատ արյունահոսություն (պաշտպանության միջոցը մեկ ժամից պակասում փոխելու անհրաժեշտություն)',
      'Ինտենսիվ ցավ, որը չի թեթևանում',
      'Անսովոր հոտ',
    ],
    tipTitle: 'Լավ է իմանալ',
    tipText: 'Ձեր մարմնի մասին հոգ տանելը չի նշանակում ամեն ինչ վերահսկել. դա հիմնականում նշանակում է ինքներդ ձեզ տալ ձեզ անհրաժեշտ ժամանակը:',
    summaryPoints: [
      'Վիժումը չի առաջանում որևէ բանից, որ դուք արել կամ չեք արել:',
      'Ձեր մարմինը սովորաբար մի քանի շաբաթ է պահանջում հորմոնալ հավասարակշռությունը վերականգնելու համար:',
      'Ցիկլը կարող է վերադառնալ արդեն 4–6 շաբաթից, սակայն յուրաքանչյուր ճանապարհ տարբեր է:',
      'Բժշկական հետազոտությունը թույլ է տալիս հաստատել, որ ամեն ինչ նորմալ է ընթանում՝ լիակատար հանգստությամբ:',
    ],
    disclaimerText: 'Տեղեկատվական բովանդակություն: Այս հոդվածը չի փոխարինում բժշկական խորհրդատվությանը կամ հետազոտությանը: Կասկածի դեպքում կամ անհանգստացնող ախտանիշների դեպքում խորհուրդ հարցրեք առողջապահության մասնագետից:',
    shareMessage: 'Ֆիզիկական վերականգնում վիժումից հետո — AWA',
  },
  tg: {
    badge: 'ПАС АЗ ВИЖИШ • БАРҚАРОРШАВӢ',
    title: 'Барқароршавии ҷисмонӣ пас аз \nвижиш',
    metaDuration: '7 дақ барои хондан',
    metaType: 'Мақола',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни иттилоотӣ',
    intro: 'Бадани шумо барои ёфтани дубораи тавозуни худ вақт мехоҳад. Инак чӣ метавонад ба шумо кумак кунад ин марҳиларо мулоимона беҳтар бифаҳмед.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Вижиш чист?',
      'Аз ҷиҳати ҷисмонӣ чӣ рух дода метавонад',
      'Бозгашти давраи шумо',
      'Санҷиши тиббии оромбахш',
      'Кай ба нигоҳубини тиббӣ муроҷиат кардан лозим аст',
      'Хулосаҳои асосӣ',
    ],
    section1Body1: 'Вижиш хотимаи стихиявии ҳомиладорӣ аст, аксар вақт пеш аз ҳафтаи 12-ум то 14-ум. Тахмин меравад, ки аз шаш-ҳафт ҳомиладории тасдиқшуда яктоаш ба ин тарз ба охир мерасад, аксар вақт дар аввали ҳомиладорӣ.',
    section1Body2: 'Он кам нест ва нишонаи мушкили ҳосилхезии оянда низ нест. Дар аксари мутлақи ҳолатҳо он бо омилҳое алоқаманд аст, ки аз назорати ҳеҷ кас берунанд, масалан, аномалияи хромосомӣ, ки тасодуфан ҳангоми инкишоф рух додааст.',
    infoCard1Title: 'Хулосаи асосӣ',
    infoCard1Text: 'Вижиш бо чизе, ки шумо кардаед ё накардаед, ба вуҷуд намеояд. Шумо барои он чи рух дод, масъул нестед.',
    section2Body: 'Ҳар таҷриба аз шахс ба шахс фарқ мекунад. Инҳо маъмултарин нишонаҳоянд:',
    physicalSigns: [
      {title: 'Хунравӣ', text: 'Шиддат ва давомнокии он вобаста ба вазъият метавонад гуногун бошад, сипас тадриҷан кам мешавад.'},
      {title: 'Кашишхӯрӣ', text: 'Дарде монанди кашишхӯрии ҳайз, баъзан шадидтар, метавонад ин марҳиларо ҳамроҳӣ кунад.'},
      {title: 'Давомнокии гуногун', text: 'Барқароршавии ҷисмонӣ одатан аз чанд рӯз то чанд ҳафта давом мекунад.'},
    ],
    section3Body: 'Бадани шумо одатан чанд ҳафта вақт мегирад, то пас аз вижиш тавозуни гормониро бозёбад. Давра метавонад аллакай пас аз 4 то 6 ҳафта баргардад, вале ҳар роҳ гуногун аст.',
    comfortTips: [
      {title: 'Ба худ иҷозаи истироҳат диҳед', text: 'Бадани шумо барои ёфтани дубораи тавозун вақт мехоҳад, бе фишор барои ба даст овардани натиҷаи мушаххас.'},
      {title: 'Ба қадри кофӣ об нӯшед', text: 'Обнӯшии хуб ба таври табиӣ барқароршавиро дастгирӣ мекунад.'},
      {title: 'Ба бадани худ гӯш диҳед', text: 'Ҳар роҳ гуногун аст: бо суръати худ ҳаракат кунед, бидуни муқоиса бо дигарон.'},
    ],
    section4Body: 'Санҷиши тиббӣ ба тасдиқи он кумак мекунад, ки ҳама чиз муқаррарӣ пеш меравад, бо оромии комил. Ин қабул инчунин имконияти пурсидани ҳамаи саволҳои шумост.',
    infoCard2Title: 'Ин қабул чиро дар бар гирифта метавонад',
    infoCard2Text: 'Сӯҳбат дар бораи он чи аз сар гузаронидаед, муоина, агар лозим бошад, ва ҷой барои посух ба саволҳои шумо дар бораи он чи баъд меояд.',
    section5Body: 'Агар ягон аз ин нишонаҳо пайдо шавад, муҳим аст, ки фавран бо мутахассиси соҳаи тиб тамос гиред.',
    warningTitle: 'Нишонаҳое, ки маслиҳати тиббиро талаб мекунанд',
    warningSigns: [
      'Таб ё бадтар шудани ҳолати умумӣ',
      'Хунравии хеле зиёд (зарурати иваз кардани воситаи муҳофизат дар камтар аз як соат)',
      'Дарди шадид, ки беҳтар намешавад',
      'Бӯи ғайриоддӣ',
    ],
    tipTitle: 'Донистан хуб аст',
    tipText: 'Ғамхорӣ аз бадан маънои ҳамаро назорат карданро надорад: он асосан ба худ додани вақти заруриро дорад.',
    summaryPoints: [
      'Вижиш бо чизе, ки шумо кардаед ё накардаед, ба вуҷуд намеояд.',
      'Бадани шумо одатан чанд ҳафта вақт мегирад, то тавозуни гормониро бозёбад.',
      'Давра метавонад аллакай пас аз 4 то 6 ҳафта баргардад, вале ҳар роҳ гуногун аст.',
      'Санҷиши тиббӣ имкон медиҳад тасдиқ кунед, ки ҳама чиз муқаррарӣ пеш меравад, бо оромии комил.',
    ],
    disclaimerText: 'Мазмуни иттилоотӣ. Ин мақола маслиҳати тиббӣ ё муоинаро иваз намекунад. Дар сурати шубҳа ё нишонаҳои нигаронкунанда аз мутахассиси соҳаи тиб маслиҳат пурсед.',
    shareMessage: 'Барқароршавии ҷисмонӣ пас аз вижиш — AWA',
  },
  ky: {
    badge: 'КУРСАКТУУЛУК ҮЗҮЛГӨНДӨН КИЙИН • КАЛЫБЫНА КЕЛҮҮ',
    title: 'Курсактуулук үзүлгөндөн кийин\nфизикалык калыбына келүү',
    metaDuration: '7 мүн окуу',
    metaType: 'Макала',
    metaLevel: 'Баштоочу',
    metaValidated: 'Маалымат берүүчү мазмун',
    intro: 'Денеңизге тең салмактуулугун кайра табуу үчүн убакыт керек. Бул этапты жумшак жакшыраак түшүнүүгө эмне жардам бериши мүмкүн.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Курсактуулуктун үзүлүшү деген эмне?',
      'Физикалык жактан эмне болушу мүмкүн',
      'Циклиңиздин кайтышы',
      'Тынчтандыруучу медициналык текшерүү',
      'Медициналык жардамга качан кайрылуу керек',
      'Негизги жыйынтыктар',
    ],
    section1Body1: 'Курсактуулуктун үзүлүшү — курсактуулуктун өзүнөн өзү аякташы, көбүнчө 12–14-жумага чейин. Ырасталган курсактуулуктун алтыдан же жетиден бири ушундай аяктайт деп болжолдонот, көбүнчө курсактуулуктун башталышында.',
    section1Body2: 'Бул сейрек көрүнүш эмес жана келечектеги бойго бүтүү жөндөмдүүлүгүндөгү көйгөйдүн белгиси да эмес. Абдан көп учурларда ал эч кимдин көзөмөлүнөн тышкаркы факторлор менен байланышкан, мисалы өнүгүү учурунда кокусунан пайда болгон хромосомалык аномалия.',
    infoCard1Title: 'Негизги жыйынтык',
    infoCard1Text: 'Курсактуулуктун үзүлүшү сиз кылган же кылбаган эч нерседен келип чыкпайт. Болгон нерсеге сиз жооптуу эмессиз.',
    section2Body: 'Ар бир тажрыйба адамдан адамга башкача. Эң кеңири таралган белгилер:',
    physicalSigns: [
      {title: 'Кан кетүү', text: 'Анын курчтугу жана узактыгы абалга жараша айырмаланып, андан кийин акырындап азайышы мүмкүн.'},
      {title: 'Спазмдар', text: 'Етек кирим спазмдарына окшош оору, кээде күчтүүрөөк, бул этапка кошо жүрүшү мүмкүн.'},
      {title: 'Өзгөрүлмө узактык', text: 'Физикалык калыбына келүү адатта бир нече күндөн бир нече жумага чейин созулат.'},
    ],
    section3Body: 'Курсактуулук үзүлгөндөн кийин денеңизге гормондук тең салмактуулукту кайра табуу үчүн адатта бир нече жума керек. Цикл 4–6 жумадан эле кайтышы мүмкүн, бирок ар бир жол ар башка.',
    comfortTips: [
      {title: 'Өзүңүзгө эс алууга уруксат бериңиз', text: 'Денеңизге тең салмактуулугун кайра табуу үчүн белгилүү натыйжага жетүү кысымы жок убакыт керек.'},
      {title: 'Жакшы суюктук ичиңиз', text: 'Жакшы суюктук ичүү калыбына келүүнү табигый түрдө колдойт.'},
      {title: 'Денеңизди угуңуз', text: 'Ар бир жол ар башка: өз темпиңизде, башкалар менен салыштырбай жүрүңүз.'},
    ],
    section4Body: 'Медициналык текшерүү баары нормалдуу жүрүп жатканын толук тынчтык менен ырастоого жардам берет. Бул кабыл алуу ошондой эле бардык суроолоруңузду берүү мүмкүнчүлүгү.',
    infoCard2Title: 'Бул кабыл алуу эмнени камтышы мүмкүн',
    infoCard2Text: 'Башыңыздан өткөргөн нерсе жөнүндө сүйлөшүү, керек болсо текшерүү жана кийинки кадамдар боюнча суроолоруңузга жооп берүү мейкиндиги.',
    section5Body: 'Эгер бул белгилердин бири пайда болсо, ден соолук сактоо адиси менен дароо байланышуу маанилүү.',
    warningTitle: 'Медициналык кеңешти талап кылган белгилер',
    warningSigns: [
      'Ысытма же жалпы абалдын начарлашы',
      'Өтө көп кан кетүү (коргонуу каражатын бир сааттан аз убакытта алмаштыруу керек болсо)',
      'Жакшырбаган катуу оору',
      'Адаттан тыш жыт',
    ],
    tipTitle: 'Билүү пайдалуу',
    tipText: 'Денеңизге кам көрүү баарын көзөмөлдөө дегенди билдирбейт: ал негизинен өзүңүзгө керектүү убакытты берүү дегенди билдирет.',
    summaryPoints: [
      'Курсактуулуктун үзүлүшү сиз кылган же кылбаган эч нерседен келип чыкпайт.',
      'Денеңизге гормондук тең салмактуулукту кайра табуу үчүн адатта бир нече жума керек.',
      'Цикл 4–6 жумадан эле кайтышы мүмкүн, бирок ар бир жол ар башка.',
      'Медициналык текшерүү баары нормалдуу жүрүп жатканын толук тынчтык менен ырастоого мүмкүндүк берет.',
    ],
    disclaimerText: 'Маалымат берүүчү мазмун. Бул макала медициналык кеңешти же текшерүүнү алмаштырбайт. Күмөн болсо же тынчсыздандырган белгилер болсо, ден соолук сактоо адисинен кеңеш сураңыз.',
    shareMessage: 'Курсактуулук үзүлгөндөн кийин физикалык калыбына келүү — AWA',
  },
  tk: {
    badge: 'GÖWRELILIGIŇ ÝITIRILMEGINDEN SOŇ • DIKELIŞ',
    title: 'Göwreliligiň ýitirilmeginden\nsoňky fiziki dikeliş',
    metaDuration: '7 min okamak',
    metaType: 'Makala',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Maglumat berýän mazmun',
    intro: 'Bedeniňiz deňagramlylygyny täzeden tapmak üçin wagta mätäç. Bu tapgyry ýuwaşlyk bilen has gowy düşünmäge kömek edip biljek zatlar.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Göwreliligiň ýitirilmegi näme?',
      'Fiziki taýdan näme bolup biler',
      'Sikliňiziň gaýdyp gelmegi',
      'Köňül rahatlandyryjy lukmançylyk barlagy',
      'Lukmançylyk kömegini haçan soramaly',
      'Esasy netijeler',
    ],
    section1Body1: 'Göwreliligiň ýitirilmegi — göwreliligiň öz-özünden bes edilmegi, köplenç 12–14-nji hepdeden öň. Tassyklanan göwreliligiň alty-ýedi sanysynyň birinden bu ýagdaýda gutarýandygy hasaplanylýar, köplenç göwreliligiň başynda.',
    section1Body2: 'Bu seýrek hadysa däl, şeýle hem geljekdäki göwreli bolmak ukyby kynçylygynyň alamaty däl. Aglaba köp ýagdaýda ol hiç kimiň dolandyryp bilmeýän faktorlary, meselem, ösüş wagtynda tötänleýin ýüze çykan hromosom anomaliýasy bilen baglanyşykly.',
    infoCard1Title: 'Esasy netije',
    infoCard1Text: 'Göwreliligiň ýitirilmegi siziň eden ýa-da etmedik hiç bir zadyňyzdan döremeýär. Bolup geçen zada siz jogapkär däl.',
    section2Body: 'Her tejribe adamdan adama tapawutlanýar. Iň ýygy alamatlar:',
    physicalSigns: [
      {title: 'Gan akma', text: 'Onuň güýçlüligi we dowamlylygy ýagdaýa görä üýtgäp, soňra ýuwaş-ýuwaşdan azalyp biler.'},
      {title: 'Çekişme', text: 'Aýbaşy çekişmelerine meňzeş agyry, käwagt has güýçli, bu tapgyra hemrah bolup biler.'},
      {title: 'Üýtgeýän dowamlylyk', text: 'Fiziki dikeliş adatça birnäçe günden birnäçe hepdä çenli dowam edýär.'},
    ],
    section3Body: 'Bedeniňiz göwreliligiň ýitirilmeginden soň gormonal deňagramlylygy täzeden dikeltmek üçin adatça birnäçe hepde alýar. Sikl 4–6 hepdeden gaýdyp gelip biler, ýöne her ýol dürli.',
    comfortTips: [
      {title: 'Özüňize dynç bermäge rugsat ediň', text: 'Bedeniňiz belli bir netijä ýetmek basyşy bolmazdan, deňagramlylygyny täzeden tapmak üçin wagta mätäç.'},
      {title: 'Gowy suwly galyň', text: 'Gowy suwlandyrmak dikelişe tebigy ýagdaýda goldaw berýär.'},
      {title: 'Bedeniňize gulak asyň', text: 'Her ýol dürli: özüňizi başgalar bilen deňeşdirmän, öz ritmiňizde öňe gidiň.'},
    ],
    section4Body: 'Lukmançylyk barlagy hemme zadyň adaty ýagdaýda gidýändigini doly asudalyk bilen tassyklamaga kömek edýär. Bu kabul ediş şeýle hem ähli soraglaryňyzy bermek üçin pursat.',
    infoCard2Title: 'Bu kabul ediş näme öz içine alyp biler',
    infoCard2Text: 'Başdan geçirenleriňiz barada söhbetdeşlik, zerur bolsa barlag we indiki ädimler barada soraglaryňyza jogap bermek üçin ýer.',
    section5Body: 'Bu alamatlaryň haýsydyr biri peýda bolsa, derrew saglyk hünärmeni bilen habarlaşmak möhüm.',
    warningTitle: 'Lukmançylyk maslahatyny talap edýän alamatlar',
    warningSigns: [
      'Gyzgyn ýa-da erbetleşýän umumy ýagdaý',
      'Gaty köp gan akma (goranyş serişdesini bir sagatdan az wagtda çalyşmaly bolmak)',
      'Gowulaşmaýan güýçli agyry',
      'Adaty däl ys',
    ],
    tipTitle: 'Bilmek peýdaly',
    tipText: 'Bedeniňize ideg etmek hemme zady dolandyrmak diýmek däl: bu esasan özüňize gerek wagty bermek diýmek.',
    summaryPoints: [
      'Göwreliligiň ýitirilmegi siziň eden ýa-da etmedik hiç bir zadyňyzdan döremeýär.',
      'Bedeniňiz gormonal deňagramlylygy dikeltmek üçin adatça birnäçe hepde alýar.',
      'Sikl 4–6 hepdeden gaýdyp gelip biler, ýöne her ýol dürli.',
      'Lukmançylyk barlagy hemme zadyň adaty ýagdaýda gidýändigini doly asudalyk bilen tassyklamaga mümkinçilik berýär.',
    ],
    disclaimerText: 'Maglumat berýän mazmun. Bu makala lukmançylyk maslahatyny ýa-da barlagy çalyşmaýar. Şübhe bolsa ýa-da alada goýýan alamatlary başdan geçirseňiz, saglyk hünärmeninden maslahat soraň.',
    shareMessage: 'Göwreliligiň ýitirilmeginden soňky fiziki dikeliş — AWA',
  },
} as const);

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
