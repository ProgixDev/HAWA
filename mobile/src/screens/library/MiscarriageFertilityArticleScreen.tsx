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

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

const ID = 'lossfertility-fertilite-apres-perte';

const HERO = require('../../assets/images/library/featured-pain.png');

/* -------------------------------------------------------------------------- */
/* DATA — icons stay language-neutral — only TEXT moves into the bilingual   */
/* CONTENT object below, keyed by index to stay aligned with these icons.    */
/* -------------------------------------------------------------------------- */

const READINESS_ICONS = [
  'heart-outline',
  'account-heart-outline',
  'account-group-outline',
] as const;

const FOLLOW_UP_ICONS = [
  'clipboard-text-outline',
  'test-tube',
  'calendar-heart',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'APRÈS UNE FAUSSE COUCHE • FERTILITÉ',
    title: 'Fertilité et nouvel essai après une perte',
    metaDuration: '6 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Intermédiaire',
    metaValidated: 'Contenu informatif',
    intro:
      'Quand et comment envisager un nouveau projet, à ton rythme et en toute confiance.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Le retour de la fertilité',
      'Ce que disent généralement les professionnels',
      'Se sentir prête, à ton rythme',
      'Un suivi qui peut rassurer',
      'À retenir',
    ],
    body1:
      'La fertilité revient généralement dès le cycle suivant une fausse couche précoce. L’ovulation peut même survenir avant le retour visible des règles.',
    infoTitle: 'À retenir',
    infoText:
      'Selon le stade de la perte, le temps de récupération physique peut varier légèrement d’une situation à l’autre.',
    body2:
      'De nombreux professionnels considèrent qu’il n’y a pas besoin d’attendre plusieurs cycles avant un nouvel essai, sauf avis contraire de ton médecin ou de ta sage-femme.',
    compareEarlyTitle: 'Perte précoce',
    compareEarlyText:
      'La fertilité revient souvent rapidement, dès le cycle suivant.',
    compareLateTitle: 'Perte plus tardive',
    compareLateText:
      'Un temps de récupération un peu plus long peut être conseillé par l’équipe médicale.',
    body3:
      'Se sentir prête, physiquement et émotionnellement, reste le repère le plus important — bien plus qu’un délai théorique.',
    readinessPoints: [
      {
        title: 'Sur le plan émotionnel',
        text: 'Te sentir prête intérieurement compte autant que la récupération physique.',
      },
      {
        title: 'Sur le plan physique',
        text: 'Un cycle régulier et un ressenti de bien-être sont de bons repères.',
      },
      {
        title: 'En couple ou entourée',
        text: 'En parler avec ton ou ta partenaire peut aider à avancer au même rythme.',
      },
    ],
    body4:
      'Avant un nouvel essai, un rendez-vous médical peut t’aider à avancer plus sereinement :',
    followUpSteps: [
      {
        title: 'Faire le point',
        text: 'Un échange avec un professionnel permet de revenir sur ce qui s’est passé.',
      },
      {
        title: 'Un bilan si nécessaire',
        text: 'Selon la situation, des examens complémentaires peuvent être proposés.',
      },
      {
        title: 'Un nouveau projet',
        text: 'Le suivi peut ensuite t’accompagner sereinement dans ce nouvel essai.',
      },
    ],
    tipTitle: 'Bon à savoir',
    tipText:
      'Une fausse couche isolée n’indique généralement pas un problème de fertilité. Ton équipe médicale reste la mieux placée pour répondre à tes questions personnelles.',
    summaryPoints: [
      'La fertilité revient généralement dès le cycle suivant une fausse couche précoce.',
      'De nombreux professionnels considèrent qu’il n’y a pas besoin d’attendre plusieurs cycles, sauf avis contraire.',
      'Se sentir prête, physiquement et émotionnellement, reste le repère le plus important.',
      'Un suivi médical peut t’accompagner et te rassurer avant un nouvel essai.',
    ],
    disclaimerText:
      'Contenu informatif. Cet article ne remplace pas un avis médical personnalisé. Ton médecin ou ta sage-femme reste la référence pour ta situation.',
    shareMessage: 'Fertilité et nouvel essai après une perte — AWA',
  },
  en: {
    badge: 'AFTER A MISCARRIAGE • FERTILITY',
    title: 'Fertility and trying again after a loss',
    metaDuration: '6 min read',
    metaType: 'Guide',
    metaLevel: 'Intermediate',
    metaValidated: 'Informational content',
    intro:
      'When and how to think about trying again, at your own pace and in full confidence.',
    contentsTitle: 'In this article',
    topics: [
      'The return of fertility',
      'What professionals generally say',
      'Feeling ready, at your own pace',
      'Follow-up care that can reassure you',
      'Key takeaways',
    ],
    body1:
      'Fertility usually returns as early as the cycle following an early miscarriage. Ovulation can even occur before your period visibly returns.',
    infoTitle: 'Key takeaway',
    infoText:
      'Depending on the stage of the loss, physical recovery time can vary slightly from one situation to another.',
    body2:
      'Many professionals consider that there’s no need to wait several cycles before trying again, unless your doctor or midwife advises otherwise.',
    compareEarlyTitle: 'Early loss',
    compareEarlyText:
      'Fertility often returns quickly, as early as the next cycle.',
    compareLateTitle: 'Later loss',
    compareLateText:
      'A slightly longer recovery time may be recommended by the medical team.',
    body3:
      'Feeling ready, physically and emotionally, remains the most important guide — far more than any theoretical timeframe.',
    readinessPoints: [
      {
        title: 'Emotionally',
        text: 'Feeling ready within yourself matters just as much as physical recovery.',
      },
      {
        title: 'Physically',
        text: 'A regular cycle and a sense of well-being are good indicators.',
      },
      {
        title: 'As a couple or with support',
        text: 'Talking about it with your partner can help you move forward at the same pace.',
      },
    ],
    body4:
      'Before trying again, a medical appointment can help you move forward with more peace of mind:',
    followUpSteps: [
      {
        title: 'Taking stock',
        text: 'A conversation with a professional allows you to revisit what happened.',
      },
      {
        title: 'An assessment if needed',
        text: 'Depending on the situation, additional tests may be offered.',
      },
      {
        title: 'A new attempt',
        text: 'Follow-up care can then calmly support you as you try again.',
      },
    ],
    tipTitle: 'Good to know',
    tipText:
      'An isolated miscarriage generally does not indicate a fertility problem. Your medical team remains best placed to answer your personal questions.',
    summaryPoints: [
      'Fertility usually returns as early as the cycle following an early miscarriage.',
      'Many professionals consider that there’s no need to wait several cycles, unless advised otherwise.',
      'Feeling ready, physically and emotionally, remains the most important guide.',
      'Medical follow-up can support and reassure you before trying again.',
    ],
    disclaimerText:
      'Informational content. This article does not replace personalized medical advice. Your doctor or midwife remains the reference for your situation.',
    shareMessage: 'Fertility and trying again after a loss — AWA',
  },
  es: {
    badge: 'DESPUÉS DE UNA PÉRDIDA DEL EMBARAZO • FERTILIDAD',
    title: 'Fertilidad y un nuevo intento después de una pérdida',
    metaDuration: '6 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenido informativo',
    intro:
      'Cuándo y cómo plantearte un nuevo proyecto, a tu ritmo y con total confianza.',
    contentsTitle: 'En este artículo',
    topics: [
      'El regreso de la fertilidad',
      'Lo que suelen decir los profesionales',
      'Sentirte preparada, a tu ritmo',
      'Un seguimiento que puede tranquilizarte',
      'Para recordar',
    ],
    body1:
      'La fertilidad suele volver ya en el ciclo siguiente a una pérdida del embarazo precoz. La ovulación puede incluso ocurrir antes de que la regla vuelva de forma visible.',
    infoTitle: 'Para recordar',
    infoText:
      'Según la etapa de la pérdida, el tiempo de recuperación física puede variar ligeramente de una situación a otra.',
    body2:
      'Muchos profesionales consideran que no es necesario esperar varios ciclos antes de un nuevo intento, salvo indicación contraria de tu médico o tu matrona.',
    compareEarlyTitle: 'Pérdida precoz',
    compareEarlyText:
      'La fertilidad suele volver rápidamente, ya desde el ciclo siguiente.',
    compareLateTitle: 'Pérdida más tardía',
    compareLateText:
      'El equipo médico puede aconsejar un tiempo de recuperación un poco más largo.',
    body3:
      'Sentirte preparada, física y emocionalmente, sigue siendo la referencia más importante — mucho más que un plazo teórico.',
    readinessPoints: [
      {
        title: 'En el plano emocional',
        text: 'Sentirte preparada interiormente cuenta tanto como la recuperación física.',
      },
      {
        title: 'En el plano físico',
        text: 'Un ciclo regular y una sensación de bienestar son buenas señales.',
      },
      {
        title: 'En pareja o acompañada',
        text: 'Hablarlo con tu pareja puede ayudar a avanzar al mismo ritmo.',
      },
    ],
    body4:
      'Antes de un nuevo intento, una cita médica puede ayudarte a avanzar con más serenidad:',
    followUpSteps: [
      {
        title: 'Hacer balance',
        text: 'Una conversación con un profesional permite volver sobre lo que ocurrió.',
      },
      {
        title: 'Un balance si es necesario',
        text: 'Según la situación, se pueden proponer exámenes complementarios.',
      },
      {
        title: 'Un nuevo proyecto',
        text: 'El seguimiento puede entonces acompañarte con serenidad en este nuevo intento.',
      },
    ],
    tipTitle: 'DATO ÚTIL',
    tipText:
      'Una pérdida del embarazo aislada generalmente no indica un problema de fertilidad. Tu equipo médico sigue siendo quien mejor puede responder a tus preguntas personales.',
    summaryPoints: [
      'La fertilidad suele volver ya en el ciclo siguiente a una pérdida del embarazo precoz.',
      'Muchos profesionales consideran que no es necesario esperar varios ciclos, salvo indicación contraria.',
      'Sentirte preparada, física y emocionalmente, sigue siendo la referencia más importante.',
      'Un seguimiento médico puede acompañarte y tranquilizarte antes de un nuevo intento.',
    ],
    disclaimerText:
      'Contenido informativo. Este artículo no sustituye un asesoramiento médico personalizado. Tu médico o tu matrona sigue siendo la referencia para tu situación.',
    shareMessage: 'Fertilidad y un nuevo intento después de una pérdida — AWA',
  },
  it: {
    badge: 'DOPO UN ABORTO SPONTANEO • FERTILITÀ',
    title: 'Fertilità e nuovi tentativi dopo una perdita',
    metaDuration: '6 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenuto informativo',
    intro: 'Quando e come pensare a un nuovo tentativo, con i tuoi tempi e in piena serenità.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Il ritorno della fertilità',
      'Cosa dicono in genere i professionisti',
      'Sentirsi pronte, con i propri tempi',
      'Un follow-up che può rassicurarti',
      'Punti chiave',
    ],
    body1: 'La fertilità di solito ritorna già nel ciclo successivo a un aborto spontaneo precoce. L’ovulazione può addirittura avvenire prima che il periodo mestruale si ripresenti in modo visibile.',
    infoTitle: 'Punto chiave',
    infoText: 'A seconda della fase in cui è avvenuta la perdita, i tempi di recupero fisico possono variare leggermente da una situazione all’altra.',
    body2: 'Molti professionisti ritengono che non sia necessario aspettare diversi cicli prima di riprovare, a meno che il tuo medico o la tua ostetrica non ti consigli diversamente.',
    compareEarlyTitle: 'Perdita precoce',
    compareEarlyText: 'La fertilità spesso ritorna rapidamente, già nel ciclo successivo.',
    compareLateTitle: 'Perdita più avanzata',
    compareLateText: 'L’équipe medica può consigliare un tempo di recupero leggermente più lungo.',
    body3: 'Sentirsi pronte, fisicamente ed emotivamente, resta la guida più importante, molto più di qualsiasi tempistica teorica.',
    readinessPoints: [
      {
        title: 'A livello emotivo',
        text: 'Sentirti pronta dentro di te conta quanto il recupero fisico.',
      },
      {
        title: 'A livello fisico',
        text: 'Un ciclo regolare e una sensazione di benessere sono buoni indicatori.',
      },
      {
        title: 'In coppia o con un sostegno',
        text: 'Parlarne con il tuo partner può aiutarvi ad andare avanti allo stesso ritmo.',
      },
    ],
    body4: 'Prima di riprovare, una visita medica può aiutarti ad andare avanti con più serenità:',
    followUpSteps: [
      {
        title: 'Fare il punto',
        text: 'Un colloquio con un professionista ti permette di ripercorrere ciò che è successo.',
      },
      {
        title: 'Un controllo, se necessario',
        text: 'A seconda della situazione, possono essere proposti ulteriori esami.',
      },
      {
        title: 'Un nuovo tentativo',
        text: 'Il follow-up può poi accompagnarti con serenità mentre riprovi.',
      },
    ],
    tipTitle: 'Da sapere',
    tipText: 'Un aborto spontaneo isolato in genere non indica un problema di fertilità. La tua équipe medica resta la più adatta a rispondere alle tue domande personali.',
    summaryPoints: [
      'La fertilità di solito ritorna già nel ciclo successivo a un aborto spontaneo precoce.',
      'Molti professionisti ritengono che non sia necessario aspettare diversi cicli, a meno che non venga consigliato diversamente.',
      'Sentirsi pronte, fisicamente ed emotivamente, resta la guida più importante.',
      'Il follow-up medico può sostenerti e rassicurarti prima di riprovare.',
    ],
    disclaimerText: 'Contenuto informativo. Questo articolo non sostituisce un parere medico personalizzato. Il tuo medico o la tua ostetrica resta il riferimento per la tua situazione.',
    shareMessage: 'Fertilità e nuovi tentativi dopo una perdita — AWA',
  },
  tr: {
    badge: 'DÜŞÜK SONRASI • DOĞURGANLIK',
    title: 'Kayıptan sonra doğurganlık ve yeniden denemek',
    metaDuration: '6 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Orta düzey',
    metaValidated: 'Bilgilendirici içerik',
    intro: 'Yeniden denemeyi ne zaman ve nasıl düşüneceğin, kendi temponda ve tam bir güven içinde.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Doğurganlığın geri dönüşü',
      'Profesyoneller genellikle ne söylüyor',
      'Kendi temponda hazır hissetmek',
      'Seni rahatlatabilecek takip süreci',
      'Önemli çıkarımlar',
    ],
    body1: 'Doğurganlık genellikle erken bir düşükten sonraki döngüde geri döner. Yumurtlama, adetin gözle görülür biçimde geri dönmesinden önce bile gerçekleşebilir.',
    infoTitle: 'Önemli çıkarım',
    infoText: 'Kaybın aşamasına bağlı olarak fiziksel iyileşme süresi bir durumdan diğerine biraz farklılık gösterebilir.',
    body2: 'Birçok profesyonel, doktorun ya da ebenin aksini önermediği sürece yeniden denemeden önce birkaç döngü beklemeye gerek olmadığını düşünür.',
    compareEarlyTitle: 'Erken kayıp',
    compareEarlyText: 'Doğurganlık çoğunlukla hızla, bir sonraki döngüden itibaren geri döner.',
    compareLateTitle: 'Daha geç dönemdeki kayıp',
    compareLateText: 'Tıbbi ekip biraz daha uzun bir iyileşme süresi önerebilir.',
    body3: 'Fiziksel ve duygusal olarak hazır hissetmek, kuramsal herhangi bir süreden çok daha önemli bir rehber olmaya devam eder.',
    readinessPoints: [
      {
        title: 'Duygusal olarak',
        text: 'İçinde hazır hissetmek, fiziksel iyileşme kadar önemlidir.',
      },
      {
        title: 'Fiziksel olarak',
        text: 'Düzenli bir döngü ve iyi olma hissi iyi göstergelerdir.',
      },
      {
        title: 'Çift olarak ya da destekle',
        text: 'Eşinle bunu konuşmak, aynı tempoda ilerlemene yardımcı olabilir.',
      },
    ],
    body4: 'Yeniden denemeden önce bir tıbbi randevu, daha huzurlu ilerlemene yardımcı olabilir:',
    followUpSteps: [
      {
        title: 'Durumu değerlendirmek',
        text: 'Bir profesyonelle yapılan görüşme, yaşananları yeniden gözden geçirmene olanak tanır.',
      },
      {
        title: 'Gerekirse bir değerlendirme',
        text: 'Duruma göre ek tetkikler önerilebilir.',
      },
      {
        title: 'Yeni bir deneme',
        text: 'Takip süreci, yeniden denerken seni sakin bir biçimde destekleyebilir.',
      },
    ],
    tipTitle: 'Bilmekte fayda var',
    tipText: 'Tek bir düşük genellikle bir doğurganlık sorununa işaret etmez. Kişisel sorularını yanıtlamak için en uygun kişi tıbbi ekibindir.',
    summaryPoints: [
      'Doğurganlık genellikle erken bir düşükten sonraki döngüde geri döner.',
      'Birçok profesyonel, aksi önerilmediği sürece birkaç döngü beklemeye gerek olmadığını düşünür.',
      'Fiziksel ve duygusal olarak hazır hissetmek en önemli rehber olmaya devam eder.',
      'Tıbbi takip, yeniden denemeden önce seni destekleyebilir ve rahatlatabilir.',
    ],
    disclaimerText: 'Bilgilendirici içerik. Bu makale kişiye özel tıbbi tavsiyenin yerini tutmaz. Durumun için başvuru kaynağı doktorun ya da ebendir.',
    shareMessage: 'Kayıptan sonra doğurganlık ve yeniden denemek — AWA',
  },
  ru: {
    badge: 'ПОСЛЕ ВЫКИДЫША • ФЕРТИЛЬНОСТЬ',
    title: 'Фертильность и новая попытка после потери',
    metaDuration: '6 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Средний уровень',
    metaValidated: 'Информационный материал',
    intro:
      'Когда и как думать о новой попытке — в своём темпе и с уверенностью.',
    contentsTitle: 'В этой статье',
    topics: [
      'Возвращение фертильности',
      'Что обычно говорят специалисты',
      'Почувствовать себя готовой — в своём темпе',
      'Наблюдение, которое может успокоить',
      'Главное',
    ],
    body1:
      'Фертильность обычно возвращается уже в цикле, следующем за ранним выкидышем. Овуляция может произойти даже до того, как месячные заметно возобновятся.',
    infoTitle: 'Главное',
    infoText:
      'В зависимости от срока потери время физического восстановления может немного различаться в разных ситуациях.',
    body2:
      'Многие специалисты считают, что нет необходимости ждать несколько циклов, прежде чем пытаться снова, если только врач или акушерка не посоветуют иное.',
    compareEarlyTitle: 'Ранняя потеря',
    compareEarlyText:
      'Фертильность часто возвращается быстро — уже в следующем цикле.',
    compareLateTitle: 'Потеря на более позднем сроке',
    compareLateText:
      'Медицинская команда может рекомендовать немного более длительное восстановление.',
    body3:
      'Ощущение готовности — физической и эмоциональной — остаётся самым важным ориентиром, куда важнее любых теоретических сроков.',
    readinessPoints: [
      {
        title: 'Эмоционально',
        text: 'Внутренняя готовность так же важна, как и физическое восстановление.',
      },
      {
        title: 'Физически',
        text: 'Регулярный цикл и хорошее самочувствие — хорошие показатели.',
      },
      {
        title: 'В паре или с поддержкой близких',
        text: 'Разговор с партнёром может помочь вам двигаться вперёд в одном темпе.',
      },
    ],
    body4:
      'Перед новой попыткой приём у врача может помочь вам двигаться дальше со спокойной душой:',
    followUpSteps: [
      {
        title: 'Подвести итоги',
        text: 'Разговор со специалистом позволяет вернуться к тому, что произошло.',
      },
      {
        title: 'Обследование при необходимости',
        text: 'В зависимости от ситуации могут быть предложены дополнительные обследования.',
      },
      {
        title: 'Новая попытка',
        text: 'Затем наблюдение сможет спокойно поддерживать вас в новой попытке.',
      },
    ],
    tipTitle: 'Полезно знать',
    tipText:
      'Единичный выкидыш, как правило, не указывает на проблему с фертильностью. Ответить на ваши личные вопросы лучше всего сможет ваша медицинская команда.',
    summaryPoints: [
      'Фертильность обычно возвращается уже в цикле, следующем за ранним выкидышем.',
      'Многие специалисты считают, что нет необходимости ждать несколько циклов, если не рекомендовано иное.',
      'Ощущение готовности — физической и эмоциональной — остаётся самым важным ориентиром.',
      'Медицинское наблюдение может поддержать и успокоить вас перед новой попыткой.',
    ],
    disclaimerText:
      'Информационный материал. Эта статья не заменяет персональную медицинскую консультацию. Ориентиром в вашей ситуации остаётся ваш врач или акушерка.',
    shareMessage: 'Фертильность и новая попытка после потери — AWA',
  },
  de: {
    badge: 'NACH EINER FEHLGEBURT • FRUCHTBARKEIT',
    title: 'Fruchtbarkeit und ein neuer Versuch nach einem Verlust',
    metaDuration: '6 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Fortgeschritten',
    metaValidated: 'Informationsinhalt',
    intro:
      'Wann und wie du darüber nachdenken kannst, es erneut zu versuchen – in deinem eigenen Tempo und mit Vertrauen.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Die Rückkehr der Fruchtbarkeit',
      'Was Fachpersonen im Allgemeinen sagen',
      'Sich bereit fühlen, in deinem eigenen Tempo',
      'Nachsorge, die dich beruhigen kann',
      'Das Wichtigste in Kürze',
    ],
    body1:
      'Die Fruchtbarkeit kehrt nach einer frühen Fehlgeburt meist schon im darauffolgenden Zyklus zurück. Der Eisprung kann sogar eintreten, bevor deine Periode sichtbar wiederkehrt.',
    infoTitle: 'Das Wichtigste',
    infoText:
      'Je nach Stadium des Verlusts kann die körperliche Erholungszeit von Situation zu Situation leicht unterschiedlich sein.',
    body2:
      'Viele Fachpersonen sind der Ansicht, dass du nicht mehrere Zyklen warten musst, bevor du es erneut versuchst – es sei denn, deine Ärztin, dein Arzt oder deine Hebamme rät dir etwas anderes.',
    compareEarlyTitle: 'Früher Verlust',
    compareEarlyText:
      'Die Fruchtbarkeit kehrt oft schnell zurück, schon im nächsten Zyklus.',
    compareLateTitle: 'Späterer Verlust',
    compareLateText:
      'Das medizinische Team empfiehlt manchmal eine etwas längere Erholungszeit.',
    body3:
      'Dich körperlich und seelisch bereit zu fühlen, bleibt der wichtigste Wegweiser – weit wichtiger als jede theoretische Frist.',
    readinessPoints: [
      {
        title: 'Seelisch',
        text: 'Dich innerlich bereit zu fühlen ist genauso wichtig wie die körperliche Erholung.',
      },
      {
        title: 'Körperlich',
        text: 'Ein regelmäßiger Zyklus und ein Gefühl des Wohlbefindens sind gute Anhaltspunkte.',
      },
      {
        title: 'Als Paar oder mit Unterstützung',
        text: 'Wenn du mit deinem Partner darüber sprichst, könnt ihr im gleichen Tempo vorangehen.',
      },
    ],
    body4:
      'Bevor du es erneut versuchst, kann ein Arzttermin dir helfen, mit mehr Ruhe weiterzugehen:',
    followUpSteps: [
      {
        title: 'Bilanz ziehen',
        text: 'In einem Gespräch mit einer Fachperson kannst du noch einmal auf das Geschehene zurückblicken.',
      },
      {
        title: 'Eine Abklärung, falls nötig',
        text: 'Je nach Situation können weitere Untersuchungen angeboten werden.',
      },
      {
        title: 'Ein neuer Versuch',
        text: 'Die Nachsorge kann dich dann in Ruhe begleiten, während du es erneut versuchst.',
      },
    ],
    tipTitle: 'Gut zu wissen',
    tipText:
      'Eine einzelne Fehlgeburt weist in der Regel nicht auf ein Fruchtbarkeitsproblem hin. Dein medizinisches Team kann deine persönlichen Fragen am besten beantworten.',
    summaryPoints: [
      'Die Fruchtbarkeit kehrt nach einer frühen Fehlgeburt meist schon im darauffolgenden Zyklus zurück.',
      'Viele Fachpersonen sind der Ansicht, dass du nicht mehrere Zyklen warten musst, es sei denn, dir wird etwas anderes geraten.',
      'Dich körperlich und seelisch bereit zu fühlen, bleibt der wichtigste Wegweiser.',
      'Eine ärztliche Begleitung kann dich vor einem neuen Versuch unterstützen und beruhigen.',
    ],
    disclaimerText:
      'Informationsinhalt. Dieser Artikel ersetzt keine persönliche ärztliche Beratung. Deine Ärztin, dein Arzt oder deine Hebamme bleibt die Referenz für deine Situation.',
    shareMessage: 'Fruchtbarkeit und ein neuer Versuch nach einem Verlust – AWA',
  },
  zh: {
      badge: '流产之后 • 生育力',
      title: '失去宝宝之后的生育力与再次备孕',
      metaDuration: '阅读约 6 分钟',
      metaType: '指南',
      metaLevel: '进阶',
      metaValidated: '科普内容',
      intro: '何时、如何考虑再次备孕，按自己的节奏，怀着信心。',
      contentsTitle: '本文内容',
      topics: [
        '生育力的恢复',
        '专业人员通常怎么说',
        '按自己的节奏，感到准备好了',
        '能让你安心的随访',
        '要点回顾',
      ],
      body1: '早期流产之后，生育力通常最早在下一个周期就会恢复。甚至在月经明显恢复之前，就可能已经排卵。',
      infoTitle: '重点',
      infoText: '根据失去宝宝时所处的阶段不同，身体恢复所需的时间可能会略有差异。',
      body2: '许多专业人员认为，不必等上好几个周期再备孕，除非你的医生或助产士另有建议。',
      compareEarlyTitle: '早期流产',
      compareEarlyText: '生育力往往恢复得很快，最早在下一个周期就会恢复。',
      compareLateTitle: '较晚期流产',
      compareLateText: '医疗团队可能会建议稍长一些的恢复时间。',
      body3: '身体和情绪上都感到准备好了，始终是最重要的指引，远比任何理论上的时间表更重要。',
      readinessPoints: [
        {
          title: '情绪上',
          text: '内心感到准备好了，和身体恢复同样重要。',
        },
        {
          title: '身体上',
          text: '月经周期规律、身体状态良好，都是不错的参考。',
        },
        {
          title: '与伴侣或身边的人一起',
          text: '和伴侣聊一聊，有助于你们以同样的步调往前走。',
        },
      ],
      body4: '再次备孕之前，去医院就诊一次，可以让你更安心地向前走：',
      followUpSteps: [
        {
          title: '回顾梳理',
          text: '和专业人员聊一聊，可以重新回顾所发生的事。',
        },
        {
          title: '必要时做评估',
          text: '视情况，可能会建议做一些进一步的检查。',
        },
        {
          title: '再次尝试',
          text: '之后，随访可以在你再次备孕时从容地陪伴你。',
        },
      ],
      tipTitle: '小贴士',
      tipText: '单次流产通常并不说明存在生育力方面的问题。关于你个人的疑问，医疗团队始终是最合适的解答者。',
      summaryPoints: [
        '早期流产之后，生育力通常最早在下一个周期就会恢复。',
        '许多专业人员认为，不必等上好几个周期，除非另有建议。',
        '身体和情绪上都感到准备好了，始终是最重要的指引。',
        '医学随访可以在你再次备孕之前支持并安抚你。',
      ],
      disclaimerText: '科普内容。本文不能替代个性化的医疗建议。你的医生或助产士始终是了解你具体情况的参考。',
      shareMessage: '失去宝宝之后的生育力与再次备孕 — AWA',
    },
} as const;

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

/* -------------------------------------------------------------------------- */
/* SCREEN                                                                     */
/* -------------------------------------------------------------------------- */

export default function MiscarriageFertilityArticleScreen({
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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('library.reader.back')}
              hitSlop={8}
              onPress={() => navigation.goBack()}
              style={({pressed}) => [styles.circle, pressed && styles.pressed]}>
              <MaterialDesignIcons
                name="chevron-left"
                size={23}
                color={theme.colors.text}
              />
            </Pressable>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  saved ? t('library.screen.removeBookmark') : t('library.screen.addBookmark')
                }
                hitSlop={8}
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
                hitSlop={8}
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

        {/* ==================================================================== */}
        {/* ARTICLE                                                             */}
        {/* ==================================================================== */}

        <View style={styles.article}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{content.badge}</Text>
          </View>

          <Text style={styles.title}>{content.title}</Text>

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

          <Text style={styles.intro}>{content.intro}</Text>

          {/* -------------------------------------------------------------- */}
          {/* CONTENTS                                                        */}
          {/* -------------------------------------------------------------- */}

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

          {/* ================================================================= */}
          {/* SECTION 1                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>1. {content.topics[0]}</Text>

          <Text style={styles.body}>{content.body1}</Text>

          <View style={styles.infoCard}>
            <MaterialDesignIcons
              name="information-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>{content.infoTitle}</Text>
              <Text style={styles.infoText}>{content.infoText}</Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SECTION 2                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>2. {content.topics[1]}</Text>

          <Text style={styles.body}>{content.body2}</Text>

          <View style={styles.compareCard}>
            <View style={styles.compareColumn}>
              <View style={styles.compareIcon}>
                <MaterialDesignIcons
                  name="calendar-month-outline"
                  size={21}
                  color={theme.colors.primary}
                />
              </View>

              <Text style={styles.compareTitle}>{content.compareEarlyTitle}</Text>
              <Text style={styles.compareText}>{content.compareEarlyText}</Text>
            </View>

            <View style={styles.compareDivider} />

            <View style={styles.compareColumn}>
              <View style={styles.compareIcon}>
                <MaterialDesignIcons
                  name="calendar-clock-outline"
                  size={21}
                  color={theme.colors.primary}
                />
              </View>

              <Text style={styles.compareTitle}>{content.compareLateTitle}</Text>
              <Text style={styles.compareText}>{content.compareLateText}</Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SECTION 3                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>3. {content.topics[2]}</Text>

          <Text style={styles.body}>{content.body3}</Text>

          <View style={styles.normalGrid}>
            {READINESS_ICONS.map((icon, index) => (
              <View key={icon} style={styles.normalCard}>
                <View style={styles.normalIcon}>
                  <MaterialDesignIcons
                    name={icon as never}
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.normalTitle}>
                  {content.readinessPoints[index].title}
                </Text>
                <Text style={styles.normalText}>
                  {content.readinessPoints[index].text}
                </Text>
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* SECTION 4                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>4. {content.topics[3]}</Text>

          <Text style={styles.body}>{content.body4}</Text>

          <View style={styles.comfortCard}>
            {FOLLOW_UP_ICONS.map((icon, index) => (
              <View
                key={icon}
                style={[
                  styles.comfortRow,
                  index < FOLLOW_UP_ICONS.length - 1 &&
                    styles.comfortRowBorder,
                ]}>
                <View style={styles.comfortIcon}>
                  <MaterialDesignIcons
                    name={icon as never}
                    size={19}
                    color={theme.colors.primary}
                  />
                </View>

                <View style={styles.comfortCopy}>
                  <Text style={styles.comfortTitle}>
                    {content.followUpSteps[index].title}
                  </Text>
                  <Text style={styles.comfortText}>
                    {content.followUpSteps[index].text}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* TIP                                                               */}
          {/* ================================================================= */}

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.tipTitle}</Text>
              <Text style={styles.tipText}>{content.tipText}</Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SUMMARY                                                           */}
          {/* ================================================================= */}

          <Text style={styles.h2}>{content.topics[4]}</Text>

          <View style={styles.summaryCard}>
            {content.summaryPoints.map(item => (
              <View key={item} style={styles.summaryRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <Text style={styles.summaryText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* DISCLAIMER                                                        */}
          {/* ================================================================= */}

          <View style={styles.disclaimer}>
            <MaterialDesignIcons
              name="shield-outline"
              size={18}
              color={theme.colors.textMuted}
            />

            <Text style={styles.disclaimerText}>{content.disclaimerText}</Text>
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
  scroll: {paddingBottom: 30},

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
  pressed: {opacity: 0.74},

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
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  title: {
    marginTop: 12,
    fontFamily: 'serif',
    fontSize: 27,
    lineHeight: 32,
    color: theme.colors.text,
    fontWeight: '700',
  },

  metas: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  metaItem: {flexDirection: 'row', alignItems: 'center', gap: 5},
  metaDivider: {width: 1, height: 20, backgroundColor: theme.colors.border},
  meta: {fontSize: 9.5, color: theme.colors.textMuted},

  intro: {
    marginTop: 17,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },

  contents: {
    marginTop: 20,
    padding: 15,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  contentsTitle: {marginBottom: 7, fontSize: 15, color: theme.colors.text, fontWeight: '800'},
  contentRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contentLeft: {flex: 1, flexDirection: 'row', alignItems: 'center'},
  contentNumber: {width: 25, color: theme.colors.primary, fontSize: 11.5, fontWeight: '800'},
  contentText: {flex: 1, fontSize: 12.3, lineHeight: 17, color: theme.colors.text},

  h2: {
    marginTop: 27,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: theme.colors.text,
    fontWeight: '700',
  },
  body: {marginTop: 9, fontSize: 14, lineHeight: 21.5, color: theme.colors.textSecondary},

  infoCard: {
    marginTop: 14,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoCopy: {flex: 1, marginLeft: 9},
  infoTitle: {fontSize: 12.5, color: theme.colors.text, fontWeight: '800'},
  infoText: {marginTop: 3, fontSize: 11.5, lineHeight: 17, color: theme.colors.textSecondary},

  compareCard: {
    marginTop: 13,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  compareColumn: {flex: 1},
  compareIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  compareTitle: {marginTop: 8, fontSize: 12.5, color: theme.colors.text, fontWeight: '800'},
  compareText: {marginTop: 4, fontSize: 10.5, lineHeight: 15.5, color: theme.colors.textSecondary},
  compareDivider: {width: 1, marginHorizontal: 12, backgroundColor: theme.colors.border},

  normalGrid: {marginTop: 13, gap: 9},
  normalCard: {
    padding: 13,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  normalIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  normalTitle: {marginTop: 8, fontSize: 12.5, color: theme.colors.text, fontWeight: '800'},
  normalText: {marginTop: 4, fontSize: 11, lineHeight: 16, color: theme.colors.textSecondary},

  comfortCard: {
    marginTop: 13,
    paddingHorizontal: 13,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  comfortRow: {flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 13},
  comfortRowBorder: {borderBottomWidth: 1, borderBottomColor: theme.colors.border},
  comfortIcon: {
    width: 35,
    height: 35,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  comfortCopy: {flex: 1, marginLeft: 10},
  comfortTitle: {fontSize: 12.5, color: theme.colors.text, fontWeight: '800'},
  comfortText: {marginTop: 3, fontSize: 10.8, lineHeight: 16, color: theme.colors.textSecondary},

  tip: {
    marginTop: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tipCopy: {flex: 1, marginLeft: 11},
  tipTitle: {fontSize: 13, color: theme.colors.text, fontWeight: '800'},
  tipText: {marginTop: 4, fontSize: 11.5, lineHeight: 17, color: theme.colors.textSecondary},

  summaryCard: {
    marginTop: 13,
    padding: 14,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  summaryRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10},
  summaryText: {flex: 1, fontSize: 11.5, lineHeight: 17, color: theme.colors.textSecondary},

  disclaimer: {
    marginTop: 18,
    paddingHorizontal: 3,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },
  disclaimerText: {flex: 1, fontSize: 10, lineHeight: 15, color: theme.colors.textMuted},
  });
}
