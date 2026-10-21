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
const CONTENT = withBrazilianPortuguese('MiscarriageFertility', {
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
  id: {
    badge: 'SETELAH KEGUGURAN • KESUBURAN',
    title: 'Kesuburan dan mencoba hamil lagi setelah kehilangan',
    metaDuration: '6 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Menengah',
    metaValidated: 'Konten informatif',
    intro: 'Kapan dan bagaimana memikirkan untuk mencoba hamil lagi, sesuai kecepatanmu sendiri dan dengan penuh keyakinan.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Kembalinya kesuburan',
      'Yang umumnya disampaikan tenaga kesehatan',
      'Merasa siap, sesuai kecepatanmu sendiri',
      'Pemeriksaan lanjutan yang bisa menenangkanmu',
      'Poin penting',
    ],
    body1: 'Kesuburan biasanya kembali paling cepat pada siklus setelah keguguran dini. Ovulasi bahkan bisa terjadi sebelum haidmu kembali terlihat.',
    infoTitle: 'Poin penting',
    infoText: 'Tergantung tahap kehilangan yang dialami, waktu pemulihan fisik bisa sedikit berbeda dari satu situasi ke situasi lain.',
    body2: 'Banyak tenaga kesehatan menilai bahwa tidak perlu menunggu beberapa siklus sebelum mencoba hamil lagi, kecuali dokter atau bidanmu menyarankan lain.',
    compareEarlyTitle: 'Kehilangan dini',
    compareEarlyText: 'Kesuburan sering kembali dengan cepat, paling cepat pada siklus berikutnya.',
    compareLateTitle: 'Kehilangan yang lebih lanjut',
    compareLateText: 'Tim medis mungkin menyarankan waktu pemulihan yang sedikit lebih lama.',
    body3: 'Merasa siap, secara fisik maupun emosional, tetap menjadi penunjuk terpenting — jauh lebih penting daripada jangka waktu teoretis mana pun.',
    readinessPoints: [
      {
        title: 'Secara emosional',
        text: 'Merasa siap dari dalam dirimu sama pentingnya dengan pemulihan fisik.',
      },
      {
        title: 'Secara fisik',
        text: 'Siklus yang teratur dan rasa sehat adalah indikator yang baik.',
      },
      {
        title: 'Bersama pasangan atau dengan dukungan orang lain',
        text: 'Membicarakannya dengan pasanganmu bisa membantu kalian melangkah maju dengan kecepatan yang sama.',
      },
    ],
    body4: 'Sebelum mencoba hamil lagi, konsultasi medis bisa membantumu melangkah dengan hati yang lebih tenang:',
    followUpSteps: [
      {
        title: 'Meninjau kembali',
        text: 'Berbincang dengan tenaga kesehatan memungkinkanmu mengulas kembali apa yang terjadi.',
      },
      {
        title: 'Pemeriksaan bila perlu',
        text: 'Tergantung situasinya, pemeriksaan tambahan mungkin akan ditawarkan.',
      },
      {
        title: 'Percobaan baru',
        text: 'Pendampingan lanjutan kemudian bisa menemanimu dengan tenang saat mencoba hamil lagi.',
      },
    ],
    tipTitle: 'Perlu diketahui',
    tipText: 'Satu kali keguguran umumnya tidak menandakan masalah kesuburan. Tim medismu tetap yang paling tepat menjawab pertanyaan pribadimu.',
    summaryPoints: [
      'Kesuburan biasanya kembali paling cepat pada siklus setelah keguguran dini.',
      'Banyak tenaga kesehatan menilai tidak perlu menunggu beberapa siklus, kecuali disarankan lain.',
      'Merasa siap, secara fisik maupun emosional, tetap menjadi penunjuk terpenting.',
      'Pemeriksaan medis lanjutan bisa mendampingi dan menenangkanmu sebelum mencoba hamil lagi.',
    ],
    disclaimerText: 'Konten informatif. Artikel ini tidak menggantikan saran medis yang dipersonalisasi. Dokter atau bidanmu tetap menjadi rujukan untuk situasimu.',
    shareMessage: 'Kesuburan dan mencoba hamil lagi setelah kehilangan — AWA',
  },
  hi: {
    badge: 'गर्भपात के बाद • प्रजनन क्षमता',
    title: 'गर्भ खोने के बाद प्रजनन क्षमता और दोबारा कोशिश',
    metaDuration: '6 मिनट का पाठ',
    metaType: 'गाइड',
    metaLevel: 'मध्यम',
    metaValidated: 'जानकारी के लिए कंटेंट',
    intro: 'दोबारा कोशिश करने के बारे में कब और कैसे सोचें, अपनी रफ़्तार से और पूरे भरोसे के साथ।',
    contentsTitle: 'इस लेख में',
    topics: [
      'प्रजनन क्षमता की वापसी',
      'विशेषज्ञ आमतौर पर क्या कहते हैं',
      'अपनी रफ़्तार से तैयार महसूस करना',
      'फ़ॉलो-अप देखभाल जो आपको तसल्ली दे सकती है',
      'मुख्य बातें',
    ],
    body1: 'शुरुआती गर्भपात के बाद प्रजनन क्षमता आमतौर पर अगले ही चक्र से लौट आती है। ओव्यूलेशन (अंडोत्सर्ग) तो आपके पीरियड के साफ़ तौर पर लौटने से पहले भी हो सकता है।',
    infoTitle: 'मुख्य बात',
    infoText: 'गर्भ खोने किस चरण में हुआ, इसके हिसाब से शारीरिक रूप से ठीक होने का समय एक स्थिति से दूसरी में थोड़ा अलग हो सकता है।',
    body2: 'कई विशेषज्ञ मानते हैं कि दोबारा कोशिश करने से पहले कई चक्र इंतज़ार करने की ज़रूरत नहीं है, जब तक कि आपके डॉक्टर या दाई-नर्स (मिडवाइफ़) कुछ और सलाह न दें।',
    compareEarlyTitle: 'शुरुआती हानि',
    compareEarlyText: 'प्रजनन क्षमता अक्सर जल्दी लौट आती है, अगले ही चक्र से।',
    compareLateTitle: 'बाद की अवधि में हानि',
    compareLateText: 'मेडिकल टीम थोड़ा ज़्यादा समय ठीक होने के लिए लेने की सलाह दे सकती है।',
    body3: 'शारीरिक और भावनात्मक रूप से तैयार महसूस करना ही सबसे ज़रूरी मार्गदर्शन है — किसी भी सैद्धांतिक समय-सीमा से कहीं ज़्यादा।',
    readinessPoints: [
      {
        title: 'भावनात्मक रूप से',
        text: 'मन से तैयार महसूस करना उतना ही मायने रखता है जितना शारीरिक रूप से ठीक होना।',
      },
      {
        title: 'शारीरिक रूप से',
        text: 'नियमित चक्र और अच्छा महसूस करना अच्छे संकेत हैं।',
      },
      {
        title: 'साथी या अपनों के साथ',
        text: 'अपने साथी से इस बारे में बात करने से आप एक ही रफ़्तार से आगे बढ़ पाती हैं।',
      },
    ],
    body4: 'दोबारा कोशिश करने से पहले डॉक्टर से मिलना आपको ज़्यादा सुकून के साथ आगे बढ़ने में मदद कर सकता है:',
    followUpSteps: [
      {
        title: 'स्थिति का जायज़ा',
        text: 'किसी विशेषज्ञ से बातचीत में आप जो हुआ उसे दोबारा समझ सकती हैं।',
      },
      {
        title: 'ज़रूरत हो तो जाँच',
        text: 'स्थिति के अनुसार अतिरिक्त टेस्ट सुझाए जा सकते हैं।',
      },
      {
        title: 'नई कोशिश',
        text: 'इसके बाद फ़ॉलो-अप देखभाल दोबारा कोशिश करते समय शांति से आपका साथ दे सकती है।',
      },
    ],
    tipTitle: 'जानना अच्छा रहेगा',
    tipText: 'एक अकेला गर्भपात आमतौर पर प्रजनन क्षमता की समस्या का संकेत नहीं होता। आपके निजी सवालों का जवाब देने के लिए आपकी मेडिकल टीम सबसे अच्छी स्थिति में है।',
    summaryPoints: [
      'शुरुआती गर्भपात के बाद प्रजनन क्षमता आमतौर पर अगले ही चक्र से लौट आती है।',
      'कई विशेषज्ञ मानते हैं कि कई चक्र इंतज़ार करने की ज़रूरत नहीं है, जब तक कि कोई और सलाह न दी जाए।',
      'शारीरिक और भावनात्मक रूप से तैयार महसूस करना ही सबसे ज़रूरी मार्गदर्शन है।',
      'मेडिकल फ़ॉलो-अप दोबारा कोशिश से पहले आपको सहारा और तसल्ली दे सकता है।',
    ],
    disclaimerText: 'यह जानकारी सिर्फ़ सामान्य जानकारी के लिए है। यह लेख व्यक्तिगत चिकित्सकीय सलाह का विकल्प नहीं है। आपकी स्थिति के लिए आपके डॉक्टर या दाई-नर्स (मिडवाइफ़) की राय ही सबसे भरोसेमंद है।',
    shareMessage: 'गर्भ खोने के बाद प्रजनन क्षमता और दोबारा कोशिश — AWA',
  },
  sq: {
    badge: 'PAS NJË ABORTI SPONTAN • PJELLORIA',
    title: 'Pjelloria dhe përpjekja e re pas një humbjeje',
    metaDuration: '6 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Mesatar',
    metaValidated: 'Përmbajtje informuese',
    intro: 'Kur dhe si të mendosh për një përpjekje të re, me ritmin tënd dhe me plot besim.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Kthimi i pjellorisë',
      'Çfarë thonë zakonisht profesionistët',
      'Të ndihesh gati, me ritmin tënd',
      'Ndjekja mjekësore që mund të të qetësojë',
      'Pikat kryesore',
    ],
    body1: 'Pjelloria zakonisht kthehet që në ciklin pas një aborti spontan të hershëm. Ovulacioni mund të ndodhë madje përpara se menstruacionet të kthehen dukshëm.',
    infoTitle: 'Pikat kryesore',
    infoText: 'Sipas fazës së humbjes, koha e rikuperimit fizik mund të ndryshojë pak nga një situatë te tjetra.',
    body2: 'Shumë profesionistë mendojnë se nuk ka nevojë të presësh disa cikle përpara se të provosh sërish, përveç nëse mjeku ose mamia jote këshillon ndryshe.',
    compareEarlyTitle: 'Humbje e hershme',
    compareEarlyText: 'Pjelloria shpesh kthehet shpejt, që në ciklin e ardhshëm.',
    compareLateTitle: 'Humbje më e vonë',
    compareLateText: 'Ekipi mjekësor mund të rekomandojë një kohë rikuperimi pak më të gjatë.',
    body3: 'Të ndihesh gati, fizikisht dhe emocionalisht, mbetet udhërrëfyesi më i rëndësishëm — shumë më tepër se çdo afat teorik.',
    readinessPoints: [
      {
        title: 'Emocionalisht',
        text: 'Të ndihesh gati brenda vetes ka po aq rëndësi sa rikuperimi fizik.',
      },
      {
        title: 'Fizikisht',
        text: 'Një cikël i rregullt dhe një ndjenjë mirëqenieje janë tregues të mirë.',
      },
      {
        title: 'Si çift ose me mbështetje',
        text: 'Të flasësh për këtë me partnerin tënd mund të të ndihmojë të ecni përpara me të njëjtin ritëm.',
      },
    ],
    body4: 'Përpara se të provosh sërish, një vizitë mjekësore mund të të ndihmojë të ecësh përpara me më shumë qetësi:',
    followUpSteps: [
      {
        title: 'Një vlerësim i situatës',
        text: 'Një bisedë me një profesionist të lejon të rikthehesh te ajo që ndodhi.',
      },
      {
        title: 'Një ekzaminim nëse nevojitet',
        text: 'Sipas situatës, mund të propozohen analiza shtesë.',
      },
      {
        title: 'Një përpjekje e re',
        text: 'Ndjekja mjekësore mund të të shoqërojë më pas me qetësi gjatë përpjekjes së re.',
      },
    ],
    tipTitle: 'Mirë është ta dish',
    tipText: 'Një abort spontan i izoluar zakonisht nuk tregon një problem të pjellorisë. Ekipi yt mjekësor mbetet më i përshtatshmi për t’iu përgjigjur pyetjeve të tua personale.',
    summaryPoints: [
      'Pjelloria zakonisht kthehet që në ciklin pas një aborti spontan të hershëm.',
      'Shumë profesionistë mendojnë se nuk ka nevojë të presësh disa cikle, përveç nëse këshillohet ndryshe.',
      'Të ndihesh gati, fizikisht dhe emocionalisht, mbetet udhërrëfyesi më i rëndësishëm.',
      'Ndjekja mjekësore mund të të mbështesë dhe të të qetësojë përpara se të provosh sërish.',
    ],
    disclaimerText: 'Përmbajtje informuese. Ky artikull nuk zëvendëson këshillën mjekësore të personalizuar. Mjeku ose mamia jote mbetet pika e referimit për situatën tënde.',
    shareMessage: 'Pjelloria dhe përpjekja e re pas një humbjeje — AWA',
  },
  ja: {
    badge: '流産後 • 妊娠しやすさ',
    title: '流産後の妊娠しやすさと再び妊娠を望むとき',
    metaDuration: '読了時間6分',
    metaType: 'ガイド',
    metaLevel: '中級',
    metaValidated: '情報提供のための内容',
    intro: '再び妊娠を望むタイミングや考え方について、ご自身のペースで、安心して考えるための内容です。',
    contentsTitle: 'この記事の内容',
    topics: [
      '妊娠しやすさの回復',
      '専門家が一般に伝えていること',
      '準備ができたと感じるまで、自分のペースで',
      '安心につながるフォローアップ',
      'ポイントのまとめ',
    ],
    body1: '初期の流産のあとは、通常、次の周期から妊娠しやすさが戻ります。生理がはっきり戻る前に排卵が起こることもあります。',
    infoTitle: 'ポイント',
    infoText: '流産の時期によって、体の回復にかかる時間は、状況ごとに少しずつ異なることがあります。',
    body2: '多くの専門家は、医師や助産師から別の助言がない限り、再び妊娠を望むまでに何周期も待つ必要はないと考えています。',
    compareEarlyTitle: '初期の流産',
    compareEarlyText: '妊娠しやすさは、多くの場合、早ければ次の周期から戻ります。',
    compareLateTitle: 'それ以降の流産',
    compareLateText: '医療チームから、もう少し長めの回復期間を勧められることがあります。',
    body3: '体も心も準備ができたと感じることが、何よりも大切な目安です。理論上の期間よりも、ずっと重要です。',
    readinessPoints: [
      {
        title: '心の面',
        text: '自分の中で準備ができたと感じることは、体の回復と同じくらい大切です。',
      },
      {
        title: '体の面',
        text: '周期が規則的で、体調がよいと感じられることは、よい目安になります。',
      },
      {
        title: 'パートナーや周囲の支えとともに',
        text: 'パートナーと話し合うことで、同じペースで前に進みやすくなります。',
      },
    ],
    body4: '再び妊娠を望む前に受診しておくと、より安心して前に進めます。',
    followUpSteps: [
      {
        title: '振り返り',
        text: '専門家と話すことで、起きたことを振り返ることができます。',
      },
      {
        title: '必要に応じた検査',
        text: '状況によっては、追加の検査を勧められることがあります。',
      },
      {
        title: '新たな挑戦',
        text: 'その後も、フォローアップを受けながら、落ち着いて再び妊娠を望むことができます。',
      },
    ],
    tipTitle: '知っておきたいこと',
    tipText: '1回きりの流産は、一般に妊娠しやすさの問題を示すものではありません。個別の疑問には、医療チームがいちばん的確に答えられます。',
    summaryPoints: [
      '初期の流産のあとは、通常、次の周期から妊娠しやすさが戻ります。',
      '多くの専門家は、別の助言がない限り、何周期も待つ必要はないと考えています。',
      '体も心も準備ができたと感じることが、何よりも大切な目安です。',
      '医療的なフォローアップは、再び妊娠を望む前の支えと安心につながります。',
    ],
    disclaimerText: '情報提供を目的とした内容です。この記事は、個別の医療上の助言に代わるものではありません。ご自身の状況については、医師や助産師が基準となります。',
    shareMessage: '流産後の妊娠しやすさと再び妊娠を望むとき — AWA',
  },
  ko: {
    badge: '유산 후 • 임신 가능성',
    title: '유산 후의 임신 가능성과 다시 시도하기',
    metaDuration: '읽는 데 6분',
    metaType: '가이드',
    metaLevel: '중급',
    metaValidated: '정보 제공 콘텐츠',
    intro: '다시 시도하는 것을 언제, 어떻게 생각하면 좋을지, 나의 속도로 믿음을 가지고 알아봐요.',
    contentsTitle: '이 아티클의 내용',
    topics: [
      '임신 가능성의 회복',
      '전문가들이 일반적으로 하는 이야기',
      '준비됐다고 느끼는 때, 나의 속도로',
      '안심이 되는 후속 진료',
      '핵심 정리',
    ],
    body1: '초기 유산 후에는 보통 바로 다음 주기부터 임신 가능성이 돌아와요. 생리가 눈에 띄게 다시 시작되기 전에 배란이 일어나기도 해요.',
    infoTitle: '핵심 포인트',
    infoText: '유산이 일어난 시기에 따라 몸이 회복되는 데 걸리는 시간은 상황마다 조금씩 다를 수 있어요.',
    body2: '많은 전문가들은 의사나 조산사가 다르게 권하지 않는 한, 다시 시도하기 전에 여러 주기를 기다릴 필요는 없다고 봐요.',
    compareEarlyTitle: '초기 유산',
    compareEarlyText: '임신 가능성이 빠르게, 일찍은 다음 주기부터 돌아오는 경우가 많아요.',
    compareLateTitle: '더 늦은 시기의 유산',
    compareLateText: '의료진이 조금 더 긴 회복 시간을 권할 수 있어요.',
    body3: '몸과 마음이 모두 준비됐다고 느끼는 것이 이론적인 기간보다 훨씬 더 중요한 기준이에요.',
    readinessPoints: [
      {
        title: '마음으로',
        text: '스스로 준비됐다고 느끼는 것은 몸의 회복만큼 중요해요.',
      },
      {
        title: '몸으로',
        text: '규칙적인 주기와 컨디션이 좋다는 느낌이 좋은 지표예요.',
      },
      {
        title: '부부로서 또는 주변의 도움과 함께',
        text: '파트너와 이야기를 나누면 같은 속도로 나아가는 데 도움이 될 수 있어요.',
      },
    ],
    body4: '다시 시도하기 전에 진료를 받아 보면 더 편안한 마음으로 나아갈 수 있어요.',
    followUpSteps: [
      {
        title: '돌아보기',
        text: '전문가와 이야기를 나누며 있었던 일을 되짚어 볼 수 있어요.',
      },
      {
        title: '필요하면 검사',
        text: '상황에 따라 추가 검사를 권할 수 있어요.',
      },
      {
        title: '새로운 시도',
        text: '그 후에는 후속 진료가 차분하게 다시 시도하는 것을 도와줄 수 있어요.',
      },
    ],
    tipTitle: '알아두면 좋아요',
    tipText: '한 번의 유산은 일반적으로 임신 가능성에 문제가 있다는 뜻이 아니에요. 개인적인 궁금증에는 의료진이 가장 잘 답해 줄 수 있어요.',
    summaryPoints: [
      '초기 유산 후에는 보통 바로 다음 주기부터 임신 가능성이 돌아와요.',
      '많은 전문가들은 다르게 권하지 않는 한 여러 주기를 기다릴 필요는 없다고 봐요.',
      '몸과 마음이 모두 준비됐다고 느끼는 것이 가장 중요한 기준이에요.',
      '다시 시도하기 전에 의료 진료를 받으면 도움과 안심을 얻을 수 있어요.',
    ],
    disclaimerText: '정보 제공용 콘텐츠예요. 이 아티클은 개인별 맞춤 의학적 조언을 대신하지 않아요. 나의 상황에 대해서는 의사나 조산사가 기준이 돼요.',
    shareMessage: '유산 후의 임신 가능성과 다시 시도하기 — AWA',
  },
  'pt-PT': {
    badge: 'APÓS UM ABORTO ESPONTÂNEO • FERTILIDADE',
    title: 'Fertilidade e voltar a tentar após uma perda',
    metaDuration: '6 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Intermédio',
    metaValidated: 'Conteúdo informativo',
    intro: 'Quando e como pensar em voltar a tentar, ao seu ritmo e com total confiança.',
    contentsTitle: 'Neste artigo',
    topics: [
      'O regresso da fertilidade',
      'O que dizem geralmente os profissionais',
      'Sentir-se pronta, ao seu ritmo',
      'Acompanhamento que pode tranquilizar',
      'Pontos a reter',
    ],
    body1: 'A fertilidade regressa geralmente logo no ciclo seguinte a um aborto espontâneo precoce. A ovulação pode até ocorrer antes de o período voltar visivelmente.',
    infoTitle: 'Ponto a reter',
    infoText: 'Consoante a fase da perda, o tempo de recuperação física pode variar ligeiramente de uma situação para outra.',
    body2: 'Muitos profissionais consideram que não é necessário esperar vários ciclos antes de voltar a tentar, a menos que o seu médico ou a sua parteira aconselhe o contrário.',
    compareEarlyTitle: 'Perda precoce',
    compareEarlyText: 'A fertilidade regressa muitas vezes depressa, logo no ciclo seguinte.',
    compareLateTitle: 'Perda mais tardia',
    compareLateText: 'A equipa médica pode recomendar um tempo de recuperação ligeiramente mais longo.',
    body3: 'Sentir-se pronta, física e emocionalmente, continua a ser o guia mais importante — muito mais do que qualquer prazo teórico.',
    readinessPoints: [
      {
        title: 'Emocionalmente',
        text: 'Sentir-se pronta por dentro é tão importante como a recuperação física.',
      },
      {
        title: 'Fisicamente',
        text: 'Um ciclo regular e uma sensação de bem-estar são bons indicadores.',
      },
      {
        title: 'Em casal ou com apoio',
        text: 'Falar sobre o assunto com o seu parceiro pode ajudar a avançarem ao mesmo ritmo.',
      },
    ],
    body4: 'Antes de voltar a tentar, uma consulta médica pode ajudar a avançar com mais tranquilidade:',
    followUpSteps: [
      {
        title: 'Fazer um balanço',
        text: 'Uma conversa com um profissional permite revisitar o que aconteceu.',
      },
      {
        title: 'Uma avaliação, se necessário',
        text: 'Consoante a situação, podem ser propostos exames complementares.',
      },
      {
        title: 'Uma nova tentativa',
        text: 'O acompanhamento pode depois apoiá-la com serenidade quando voltar a tentar.',
      },
    ],
    tipTitle: 'Bom saber',
    tipText: 'Um aborto espontâneo isolado não indica, em geral, um problema de fertilidade. A sua equipa médica continua a ser a mais indicada para responder às suas questões pessoais.',
    summaryPoints: [
      'A fertilidade regressa geralmente logo no ciclo seguinte a um aborto espontâneo precoce.',
      'Muitos profissionais consideram que não é necessário esperar vários ciclos, a menos que seja aconselhado o contrário.',
      'Sentir-se pronta, física e emocionalmente, continua a ser o guia mais importante.',
      'O acompanhamento médico pode apoiá-la e tranquilizá-la antes de voltar a tentar.',
    ],
    disclaimerText: 'Conteúdo informativo. Este artigo não substitui um aconselhamento médico personalizado. O seu médico ou a sua parteira continua a ser a referência para a sua situação.',
    shareMessage: 'Fertilidade e voltar a tentar após uma perda — AWA',
  },
  bn: {
    badge: 'গর্ভপাতের পর • প্রজনন ক্ষমতা',
    title: 'গর্ভধারণ হারানোর পর প্রজনন ক্ষমতা ও আবার চেষ্টা করা',
    metaDuration: '6 মিনিটের পাঠ',
    metaType: 'গাইড',
    metaLevel: 'মাঝারি',
    metaValidated: 'তথ্যমূলক বিষয়বস্তু',
    intro: 'আবার চেষ্টা করার কথা কখন ও কীভাবে ভাববেন, নিজের গতিতে এবং পূর্ণ আস্থার সঙ্গে।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'প্রজনন ক্ষমতা ফিরে আসা',
      'বিশেষজ্ঞরা সাধারণত কী বলেন',
      'নিজের গতিতে প্রস্তুত বোধ করা',
      'যে ফলো-আপ যত্ন আপনাকে আশ্বস্ত করতে পারে',
      'মূল কথা',
    ],
    body1: 'প্রাথমিক পর্যায়ের গর্ভপাতের পর সাধারণত পরবর্তী চক্র থেকেই প্রজনন ক্ষমতা ফিরে আসে। এমনকি আপনার মাসিক দৃশ্যমানভাবে ফিরে আসার আগেও ডিম্বস্ফোটন হতে পারে।',
    infoTitle: 'মূল কথা',
    infoText: 'গর্ভধারণ হারানোর পর্যায় অনুযায়ী শারীরিকভাবে সেরে ওঠার সময় এক পরিস্থিতি থেকে আরেক পরিস্থিতিতে সামান্য আলাদা হতে পারে।',
    body2: 'অনেক বিশেষজ্ঞ মনে করেন, আপনার ডাক্তার বা ধাত্রী অন্য পরামর্শ না দিলে আবার চেষ্টা করার আগে কয়েকটি চক্র অপেক্ষা করার প্রয়োজন নেই।',
    compareEarlyTitle: 'প্রাথমিক পর্যায়ে হারানো',
    compareEarlyText: 'প্রজনন ক্ষমতা প্রায়ই দ্রুত ফিরে আসে, পরবর্তী চক্র থেকেই।',
    compareLateTitle: 'পরবর্তী পর্যায়ে হারানো',
    compareLateText: 'চিকিৎসক দল কিছুটা বেশি সময় সেরে ওঠার পরামর্শ দিতে পারেন।',
    body3: 'শারীরিক ও মানসিকভাবে প্রস্তুত বোধ করাই সবচেয়ে গুরুত্বপূর্ণ পথনির্দেশক — কোনো তাত্ত্বিক সময়সীমার চেয়ে অনেক বেশি।',
    readinessPoints: [
      {
        title: 'মানসিকভাবে',
        text: 'নিজের ভেতরে প্রস্তুত বোধ করা শারীরিকভাবে সেরে ওঠার মতোই গুরুত্বপূর্ণ।',
      },
      {
        title: 'শারীরিকভাবে',
        text: 'নিয়মিত চক্র এবং সুস্থতার অনুভূতি ভালো লক্ষণ।',
      },
      {
        title: 'দম্পতি হিসেবে বা সহায়তা নিয়ে',
        text: 'আপনার সঙ্গীর সঙ্গে এ নিয়ে কথা বললে একই গতিতে এগিয়ে যেতে সহায়তা হতে পারে।',
      },
    ],
    body4: 'আবার চেষ্টা করার আগে ডাক্তারের সঙ্গে সাক্ষাৎ আপনাকে আরও নিশ্চিন্তে এগিয়ে যেতে সাহায্য করতে পারে:',
    followUpSteps: [
      {
        title: 'পরিস্থিতি পর্যালোচনা',
        text: 'বিশেষজ্ঞের সঙ্গে কথোপকথনে যা ঘটেছিল তা আবার দেখে নেওয়া যায়।',
      },
      {
        title: 'প্রয়োজনে মূল্যায়ন',
        text: 'পরিস্থিতি অনুযায়ী অতিরিক্ত পরীক্ষার প্রস্তাব দেওয়া হতে পারে।',
      },
      {
        title: 'নতুন চেষ্টা',
        text: 'এরপর ফলো-আপ যত্ন আপনি আবার চেষ্টা করার সময় শান্তভাবে আপনার পাশে থাকতে পারে।',
      },
    ],
    tipTitle: 'জেনে রাখা ভালো',
    tipText: 'একটি বিচ্ছিন্ন গর্ভপাত সাধারণত প্রজনন ক্ষমতার সমস্যা নির্দেশ করে না। আপনার ব্যক্তিগত প্রশ্নের উত্তর দেওয়ার জন্য আপনার চিকিৎসক দলই সবচেয়ে উপযুক্ত।',
    summaryPoints: [
      'প্রাথমিক পর্যায়ের গর্ভপাতের পর সাধারণত পরবর্তী চক্র থেকেই প্রজনন ক্ষমতা ফিরে আসে।',
      'অনেক বিশেষজ্ঞ মনে করেন, অন্য পরামর্শ না থাকলে কয়েকটি চক্র অপেক্ষা করার প্রয়োজন নেই।',
      'শারীরিক ও মানসিকভাবে প্রস্তুত বোধ করাই সবচেয়ে গুরুত্বপূর্ণ পথনির্দেশক।',
      'আবার চেষ্টা করার আগে চিকিৎসাগত ফলো-আপ আপনাকে সহায়তা ও আশ্বাস দিতে পারে।',
    ],
    disclaimerText: 'তথ্যমূলক বিষয়বস্তু। এই নিবন্ধ ব্যক্তিগত চিকিৎসা পরামর্শের বিকল্প নয়। আপনার পরিস্থিতির ক্ষেত্রে আপনার ডাক্তার বা ধাত্রীই নির্ভরযোগ্য দিকনির্দেশক।',
    shareMessage: 'গর্ভধারণ হারানোর পর প্রজনন ক্ষমতা ও আবার চেষ্টা করা — AWA',
  },
} as const);

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

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.body1}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.infoCard}>
            <MaterialDesignIcons
              name="information-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <AwaText variant="titleSmall" emphasized>{content.infoTitle}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.infoText}>{content.infoText}</AwaText>
            </View>
          </AwaCard>

          {/* ================================================================= */}
          {/* SECTION 2                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>2. {content.topics[1]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.body2}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.compareCard}>
            <View style={styles.compareColumn}>
              <View style={styles.compareIcon}>
                <MaterialDesignIcons
                  name="calendar-month-outline"
                  size={21}
                  color={theme.colors.primary}
                />
              </View>

              <AwaText variant="titleSmall" emphasized style={styles.compareTitle}>{content.compareEarlyTitle}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.compareText}>{content.compareEarlyText}</AwaText>
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

              <AwaText variant="titleSmall" emphasized style={styles.compareTitle}>{content.compareLateTitle}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.compareText}>{content.compareLateText}</AwaText>
            </View>
          </AwaCard>

          {/* ================================================================= */}
          {/* SECTION 3                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.topics[2]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.body3}</AwaText>

          <View style={styles.normalGrid}>
            {READINESS_ICONS.map((icon, index) => (
              <AwaCard variant="filled" padding="none" key={icon} style={styles.normalCard}>
                <View style={styles.normalIcon}>
                  <MaterialDesignIcons
                    name={icon as never}
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>

                <AwaText variant="titleSmall" emphasized style={styles.normalTitle}>
                  {content.readinessPoints[index].title}
                </AwaText>
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.normalText}>
                  {content.readinessPoints[index].text}
                </AwaText>
              </AwaCard>
            ))}
          </View>

          {/* ================================================================= */}
          {/* SECTION 4                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.topics[3]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.body4}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.comfortCard}>
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
                  <AwaText variant="titleSmall" emphasized>
                    {content.followUpSteps[index].title}
                  </AwaText>
                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.comfortText}>
                    {content.followUpSteps[index].text}
                  </AwaText>
                </View>
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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>{content.topics[4]}</AwaText>

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

  compareCard: {
    marginTop: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'stretch',
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
  compareTitle: {marginTop: 8},
  compareText: {marginTop: 4},
  compareDivider: {width: 1, marginHorizontal: 12, backgroundColor: theme.colors.border},

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
