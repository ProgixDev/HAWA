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
  da: {
    badge: 'EFTER ABORT • FERTILITET',
    title: 'Fertilitet og at prøve igen\nefter et graviditetstab',
    metaDuration: '6 min læsning',
    metaType: 'Guide',
    metaLevel: 'Mellemniveau',
    metaValidated: 'Informativt indhold',
    intro: 'Hvornår og hvordan man tænker på at prøve igen, i sit eget tempo og med fuld selvtillid.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Fertiliteten vender tilbage',
      'Hvad eksperter generelt anbefaler',
      'At føle sig klar i sit eget tempo',
      'Opfølgende pleje, der kan berolige dig',
      'Vigtige pointer',
    ],
    body1: 'Efter en tidlig abort vender fertiliteten generelt tilbage fra den næste cyklus. Ægløsning kan forekomme selv inden din menstruation er synligt vendt tilbage.',
    infoTitle: 'Vigtig information',
    infoText: 'Den fysiske restitution varierer lidt fra situation til situation afhængigt af, hvornår i graviditeten tabet skete.',
    body2: 'Mange eksperter mener, at det ikke er nødvendigt at vente et par cyklusser, inden man prøver igen, medmindre din læge eller jordemoder anbefaler andet.',
    compareEarlyTitle: 'Tidligt tab',
    compareEarlyText: 'Fertiliteten vender ofte hurtigt tilbage, fra den næste cyklus.',
    compareLateTitle: 'Sent tab',
    compareLateText: 'Læger kan anbefale lidt mere tid til restitution.',
    body3: 'At føle sig fysisk og følelsesmæssigt klar er den vigtigste vejledende faktor — meget vigtigere end nogen teoretisk tidslinje.',
    readinessPoints: [
      {
        title: 'Følelsesmæssigt',
        text: 'At føle sig klar indvendigt er lige så vigtigt som fysisk restitution.',
      },
      {
        title: 'Fysisk',
        text: 'En regelmæssig cyklus og en følelse af velvære er gode tegn.',
      },
      {
        title: 'Som par eller med støtte',
        text: 'At tale med din partner om det kan hjælpe jer med at bevæge jer fremad i samme tempo.',
      },
    ],
    body4: 'En aftale med din læge inden du prøver igen kan hjælpe dig med at gå videre med mere ro i sindet:',
    followUpSteps: [
      {
        title: 'Gennemgang af situationen',
        text: 'En samtale med en specialist giver mulighed for at se på, hvad der skete.',
      },
      {
        title: 'Vurdering om nødvendigt',
        text: 'Yderligere tests kan foreslås afhængigt af situationen.',
      },
      {
        title: 'Ny start',
        text: 'Opfølgende pleje kan herefter roligt følge dig, når du prøver igen.',
      },
    ],
    tipTitle: 'Godt at vide',
    tipText: 'En enkeltstående abort indikerer normalt ikke et fertilitetsproblem. Dit behandlingsteam er bedst egnet til at besvare dine personlige spørgsmål.',
    summaryPoints: [
      'Efter en tidlig abort vender fertiliteten generelt tilbage fra den næste cyklus.',
      'Mange eksperter mener, at det ikke er nødvendigt at vente et par cyklusser, medmindre andet er anbefalet.',
      'At føle sig fysisk og følelsesmæssigt klar er den vigtigste vejledende faktor.',
      'Medicinsk opfølgning inden du prøver igen kan støtte og berolige dig.',
    ],
    disclaimerText: 'Informativt indhold. Denne artikel erstatter ikke personlig medicinsk rådgivning. Din læge eller jordemoder er den pålidelige guide til din specifikke situation.',
    shareMessage: 'Fertilitet og at prøve igen efter et graviditetstab — AWA',
  },
  sv: {
    badge: 'EFTER ABORT • FERTILITET',
    title: 'Fertilitet och at pröve igen\nefter et graviditetstab',
    metaDuration: '6 min läsning',
    metaType: 'Guide',
    metaLevel: 'Mellemniveau',
    metaValidated: 'Informativt indhold',
    intro: 'Hvornår och hvordan man tänker på at pröve igen, i sit eget tempo och med fuld selvtillid.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Fertiliteten vender tilbage',
      'Hvad eksperter generelt anbefaler',
      'At föle sig klar i sit eget tempo',
      'Opfölgende pleje, der kan berolige dig',
      'Vigtige pointer',
    ],
    body1: 'Efter en tidlig abort vender fertiliteten generelt tilbage fran den näste cyklus. Äglösning kan forekomme selv inden din menstruation ar synligt vendt tilbage.',
    infoTitle: 'Vigtig information',
    infoText: 'Den fysiske restitution varierer lite fran situation till situation afhängigt av, hvornår i graviditeten tabet skete.',
    body2: 'Mange eksperter mener, at det inte ar nödvendigt at vente et par cyklusser, inden man pröver igen, medmindre din läge eller jordemoder anbefaler andet.',
    compareEarlyTitle: 'Tidligt tab',
    compareEarlyText: 'Fertiliteten vender ofta hurtigt tilbage, fran den näste cyklus.',
    compareLateTitle: 'Sent tab',
    compareLateText: 'Läger kan anbefale lite mere tid till restitution.',
    body3: 'At föle sig fysisk och fölelsesmässigt klar ar den vigtigste vejledende faktor — mycket vigtigere end nogen teoretisk tidslinje.',
    readinessPoints: [
      {
        title: 'Fölelsesmässigt',
        text: 'At föle sig klar indvendigt ar lige så vigtigt som fysisk restitution.',
      },
      {
        title: 'Fysisk',
        text: 'En regelmässig cyklus och en fölelse av velväre ar gode tegn.',
      },
      {
        title: 'Som par eller med stötte',
        text: 'At tale med din partner om det kan hjälpe jer med at beväge jer fremad i samme tempo.',
      },
    ],
    body4: 'En aftale med din läge inden du pröver igen kan hjälpe dig med at gå videre med mere ro i sindet:',
    followUpSteps: [
      {
        title: 'Gennemgang av situationen',
        text: 'En samtale med en specialist giver mulighed for att se på, hvad der skete.',
      },
      {
        title: 'Vurdering om nödvendigt',
        text: 'Yderligere tests kan foreslås afhängigt av situationen.',
      },
      {
        title: 'Ny start',
        text: 'Opfölgende pleje kan herefter roligt fölge dig, når du pröver igen.',
      },
    ],
    tipTitle: 'Godt at vide',
    tipText: 'En enkeltstående abort indikerer normalt inte et fertilitetsproblem. Dit behandlingsteam ar bedst egnet till at besvare dina personlige spörgsmål.',
    summaryPoints: [
      'Efter en tidlig abort vender fertiliteten generelt tilbage fran den näste cyklus.',
      'Mange eksperter mener, at det inte ar nödvendigt at vente et par cyklusser, medmindre andet ar anbefalet.',
      'At föle sig fysisk och fölelsesmässigt klar ar den vigtigste vejledende faktor.',
      'Medicinsk opfölgning inden du pröver igen kan stötte och berolige dig.',
    ],
    disclaimerText: 'Informativt indhold. Denne artikel erstatter inte personlig medicinsk rådgivning. Din läge eller jordemoder ar den pålidelige guide till din specifikke situation.',
    shareMessage: 'Fertilitet och at pröve igen efter et graviditetstab — AWA',
  },
  nb: {
    badge: 'ETTER EN SPONTANABORT • FRUKTBARHET',
    title: 'Fruktbarhet og å prøve igjen etter et tap',
    metaDuration: '6 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Middels',
    metaValidated: 'Informasjonsinnhold',
    intro:
      'Når og hvordan du kan tenke på å prøve igjen, i ditt eget tempo og med full trygghet.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Fruktbarhetens tilbakekomst',
      'Hva fagfolk vanligvis sier',
      'Å føle seg klar, i ditt eget tempo',
      'Oppfølging som kan berolige deg',
      'Det viktigste å huske',
    ],
    body1:
      'Fruktbarheten kommer vanligvis tilbake allerede i syklusen etter en tidlig spontanabort. Eggløsningen kan til og med skje før mensen synlig er tilbake.',
    infoTitle: 'Det viktigste å huske',
    infoText:
      'Avhengig av hvor tidlig i svangerskapet tapet skjedde, kan den fysiske tilfriskningstiden variere litt fra en situasjon til en annen.',
    body2:
      'Mange fagfolk mener at det ikke er nødvendig å vente flere sykluser før du prøver igjen, med mindre legen eller jordmoren din anbefaler noe annet.',
    compareEarlyTitle: 'Tidlig tap',
    compareEarlyText:
      'Fruktbarheten kommer ofte raskt tilbake, allerede i neste syklus.',
    compareLateTitle: 'Senere tap',
    compareLateText:
      'En litt lengre tilfriskningstid kan anbefales av det medisinske teamet.',
    body3:
      'Å føle seg klar, fysisk og følelsesmessig, er fortsatt den viktigste veiviseren – langt viktigere enn noen teoretisk frist.',
    readinessPoints: [
      {
        title: 'Følelsesmessig',
        text: 'Å føle seg klar i seg selv betyr like mye som den fysiske tilfriskningen.',
      },
      {
        title: 'Fysisk',
        text: 'En regelmessig syklus og en følelse av velvære er gode indikatorer.',
      },
      {
        title: 'Som par eller med støtte',
        text: 'Å snakke om det med partneren din kan hjelpe dere å gå videre i samme tempo.',
      },
    ],
    body4:
      'Før du prøver igjen kan en time hos helsepersonell hjelpe deg å gå videre med mer ro i sinnet:',
    followUpSteps: [
      {
        title: 'Gjøre opp status',
        text: 'En samtale med en fagperson lar deg gå gjennom det som skjedde.',
      },
      {
        title: 'En utredning ved behov',
        text: 'Avhengig av situasjonen kan det tilbys flere undersøkelser.',
      },
      {
        title: 'Et nytt forsøk',
        text: 'Oppfølgingen kan deretter rolig støtte deg når du prøver igjen.',
      },
    ],
    tipTitle: 'Godt å vite',
    tipText:
      'En enkelt spontanabort tyder vanligvis ikke på et fruktbarhetsproblem. Det medisinske teamet ditt er best stilt til å svare på dine personlige spørsmål.',
    summaryPoints: [
      'Fruktbarheten kommer vanligvis tilbake allerede i syklusen etter en tidlig spontanabort.',
      'Mange fagfolk mener at det ikke er nødvendig å vente flere sykluser, med mindre noe annet anbefales.',
      'Å føle seg klar, fysisk og følelsesmessig, er fortsatt den viktigste veiviseren.',
      'Medisinsk oppfølging kan støtte og berolige deg før du prøver igjen.',
    ],
    disclaimerText:
      'Informasjonsinnhold. Denne artikkelen erstatter ikke personlig medisinsk rådgivning. Legen eller jordmoren din er fortsatt referansen for din situasjon.',
    shareMessage: 'Fruktbarhet og å prøve igjen etter et tap – AWA',
  },
  pl: {
    badge: 'PO PORONIENIU • PŁODNOŚĆ',
    title: 'Płodność i ponowne starania po stracie',
    metaDuration: '6 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Średnio zaawansowany',
    metaValidated: 'Treść informacyjna',
    intro:
      'Kiedy i jak myśleć o ponownych staraniach, we własnym tempie i z pełnym zaufaniem.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Powrót płodności',
      'Co zazwyczaj mówią specjaliści',
      'Poczucie gotowości, we własnym tempie',
      'Opieka kontrolna, która może uspokoić',
      'Najważniejsze wnioski',
    ],
    body1:
      'Płodność zwykle wraca już w cyklu następującym po wczesnym poronieniu. Owulacja może nawet nastąpić, zanim miesiączka wyraźnie powróci.',
    infoTitle: 'Najważniejsze do zapamiętania',
    infoText:
      'W zależności od etapu straty czas fizycznej regeneracji może się nieznacznie różnić w poszczególnych sytuacjach.',
    body2:
      'Wielu specjalistów uważa, że nie trzeba czekać kilku cykli przed ponownymi staraniami, chyba że lekarz lub położna zalecą inaczej.',
    compareEarlyTitle: 'Wczesna strata',
    compareEarlyText:
      'Płodność często wraca szybko, już w następnym cyklu.',
    compareLateTitle: 'Późniejsza strata',
    compareLateText:
      'Zespół medyczny może zalecić nieco dłuższy czas regeneracji.',
    body3:
      'Poczucie gotowości, fizycznej i emocjonalnej, pozostaje najważniejszym wyznacznikiem — znacznie bardziej niż jakikolwiek teoretyczny termin.',
    readinessPoints: [
      {
        title: 'Emocjonalnie',
        text: 'Poczucie gotowości w sobie jest równie ważne jak regeneracja fizyczna.',
      },
      {
        title: 'Fizycznie',
        text: 'Regularny cykl i poczucie dobrego samopoczucia to dobre wskaźniki.',
      },
      {
        title: 'Jako para lub ze wsparciem',
        text: 'Rozmowa z partnerem może pomóc iść naprzód w tym samym tempie.',
      },
    ],
    body4:
      'Przed ponownymi staraniami wizyta lekarska może pomóc iść naprzód ze spokojniejszym sercem:',
    followUpSteps: [
      {
        title: 'Podsumowanie',
        text: 'Rozmowa ze specjalistą pozwala wrócić do tego, co się wydarzyło.',
      },
      {
        title: 'Badania w razie potrzeby',
        text: 'W zależności od sytuacji mogą zostać zaproponowane dodatkowe badania.',
      },
      {
        title: 'Nowa próba',
        text: 'Opieka kontrolna może następnie spokojnie wspierać Cię w ponownych staraniach.',
      },
    ],
    tipTitle: 'Warto wiedzieć',
    tipText:
      'Pojedyncze poronienie zazwyczaj nie wskazuje na problem z płodnością. Twój zespół medyczny najlepiej odpowie na Twoje osobiste pytania.',
    summaryPoints: [
      'Płodność zwykle wraca już w cyklu następującym po wczesnym poronieniu.',
      'Wielu specjalistów uważa, że nie trzeba czekać kilku cykli, chyba że zalecono inaczej.',
      'Poczucie gotowości, fizycznej i emocjonalnej, pozostaje najważniejszym wyznacznikiem.',
      'Opieka medyczna może Cię wesprzeć i uspokoić przed ponownymi staraniami.',
    ],
    disclaimerText:
      'Treść informacyjna. Ten artykuł nie zastępuje spersonalizowanej porady medycznej. Twój lekarz lub położna pozostają punktem odniesienia w Twojej sytuacji.',
    shareMessage: 'Płodność i ponowne starania po stracie — AWA',
  },
  uk: {
    badge: 'ПІСЛЯ ВИКИДНЯ • ФЕРТИЛЬНІСТЬ',
    title: 'Фертильність і нові спроби після втрати',
    metaDuration: '6 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Середній',
    metaValidated: 'Інформаційний вміст',
    intro:
      'Коли і як замислитися про нові спроби — у власному темпі та з повною впевненістю.',
    contentsTitle: 'У цій статті',
    topics: [
      'Повернення фертильності',
      'Що зазвичай кажуть фахівці',
      'Почуття готовності — у власному темпі',
      'Подальший нагляд, що може заспокоїти',
      'Головні висновки',
    ],
    body1:
      'Фертильність зазвичай повертається вже в циклі після раннього викидня. Овуляція може навіть відбутися до того, як менструація помітно повернеться.',
    infoTitle: 'Головне',
    infoText:
      'Залежно від етапу втрати час фізичного відновлення може трохи відрізнятися в різних ситуаціях.',
    body2:
      'Багато фахівців вважають, що не потрібно чекати кількох циклів перед новими спробами, якщо лікар або акушерка не радять інакше.',
    compareEarlyTitle: 'Рання втрата',
    compareEarlyText:
      'Фертильність часто повертається швидко, вже в наступному циклі.',
    compareLateTitle: 'Пізніша втрата',
    compareLateText:
      'Медична команда може порекомендувати дещо довший час відновлення.',
    body3:
      'Відчуття готовності, фізичної й емоційної, залишається найважливішим орієнтиром — набагато важливішим за будь-який теоретичний строк.',
    readinessPoints: [
      {
        title: 'Емоційно',
        text: 'Відчуття готовності всередині так само важливе, як і фізичне відновлення.',
      },
      {
        title: 'Фізично',
        text: 'Регулярний цикл і відчуття добре самопочуття — гарні показники.',
      },
      {
        title: 'Як пара або з підтримкою',
        text: 'Розмова з партнером може допомогти рухатися вперед у одному темпі.',
      },
    ],
    body4:
      'Перш ніж знову спробувати, візит до лікаря може допомогти рухатися далі зі спокійнішим серцем:',
    followUpSteps: [
      {
        title: 'Підбиття підсумків',
        text: 'Розмова зі спеціалістом дозволяє повернутися до того, що сталося.',
      },
      {
        title: 'Обстеження за потреби',
        text: 'Залежно від ситуації можуть бути запропоновані додаткові обстеження.',
      },
      {
        title: 'Нова спроба',
        text: 'Подальший нагляд може потім спокійно підтримувати вас під час нових спроб.',
      },
    ],
    tipTitle: 'Варто знати',
    tipText:
      'Поодинокий викидень зазвичай не вказує на проблему з фертильністю. Ваша медична команда найкраще відповість на ваші особисті запитання.',
    summaryPoints: [
      'Фертильність зазвичай повертається вже в циклі після раннього викидня.',
      'Багато фахівців вважають, що не потрібно чекати кількох циклів, якщо не радять інакше.',
      'Відчуття готовності, фізичної й емоційної, залишається найважливішим орієнтиром.',
      'Медичний нагляд може підтримати й заспокоїти вас перед новими спробами.',
    ],
    disclaimerText:
      'Інформаційний вміст. Ця стаття не замінює персоналізованої медичної поради. Ваш лікар або акушерка залишаються орієнтиром у вашій ситуації.',
    shareMessage: 'Фертильність і нові спроби після втрати — AWA',
  },
  cs: {
    badge: 'PO POTRATU • PLODNOST',
    title: 'Plodnost a nový pokus po ztrátě',
    metaDuration: '6 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Pokročilý',
    metaValidated: 'Informativní obsah',
    intro:
      'Kdy a jak uvažovat o novém pokusu, vlastním tempem a s plnou důvěrou.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Návrat plodnosti',
      'Co obvykle říkají odborníci',
      'Cítit se připravená, vlastním tempem',
      'Následná péče, která vás může uklidnit',
      'Hlavní poznatky',
    ],
    body1:
      'Plodnost se po časném potratu obvykle vrací už v následujícím cyklu. Ovulace může nastat dokonce dříve, než se viditelně vrátí menstruace.',
    infoTitle: 'Hlavní poznatek',
    infoText:
      'Podle fáze ztráty se doba fyzického zotavení může mezi jednotlivými situacemi mírně lišit.',
    body2:
      'Mnoho odborníků se domnívá, že není třeba čekat několik cyklů, než se pokusíte znovu, pokud vám lékař nebo porodní asistentka neporadí jinak.',
    compareEarlyTitle: 'Časná ztráta',
    compareEarlyText:
      'Plodnost se často vrací rychle, už v dalším cyklu.',
    compareLateTitle: 'Pozdější ztráta',
    compareLateText:
      'Zdravotnický tým může doporučit o něco delší dobu zotavení.',
    body3:
      'Cítit se připravená, tělesně i emočně, zůstává nejdůležitějším vodítkem — mnohem víc než jakýkoli teoretický časový rámec.',
    readinessPoints: [
      {
        title: 'Emočně',
        text: 'Cítit se uvnitř připravená je stejně důležité jako fyzické zotavení.',
      },
      {
        title: 'Tělesně',
        text: 'Pravidelný cyklus a pocit pohody jsou dobrými ukazateli.',
      },
      {
        title: 'Jako pár nebo s podporou',
        text: 'Rozhovor s partnerem vám může pomoci postupovat stejným tempem.',
      },
    ],
    body4:
      'Než se pokusíte znovu, může vám lékařská návštěva pomoci postupovat s větším klidem:',
    followUpSteps: [
      {
        title: 'Bilancování',
        text: 'Rozhovor s odborníkem vám umožní vrátit se k tomu, co se stalo.',
      },
      {
        title: 'Případné vyšetření',
        text: 'Podle situace mohou být nabídnuty doplňující testy.',
      },
      {
        title: 'Nový pokus',
        text: 'Následná péče vás pak může klidně provázet při dalším pokusu.',
      },
    ],
    tipTitle: 'Stojí za to vědět',
    tipText:
      'Ojedinělý potrat obecně neukazuje na problém s plodností. Váš zdravotnický tým je nejlépe připraven odpovědět na vaše osobní otázky.',
    summaryPoints: [
      'Plodnost se po časném potratu obvykle vrací už v následujícím cyklu.',
      'Mnoho odborníků se domnívá, že není třeba čekat několik cyklů, pokud není doporučeno jinak.',
      'Cítit se připravená, tělesně i emočně, zůstává nejdůležitějším vodítkem.',
      'Lékařské sledování vás může podpořit a uklidnit před dalším pokusem.',
    ],
    disclaimerText:
      'Informativní obsah. Tento článek nenahrazuje individuální lékařskou radu. Váš lékař nebo porodní asistentka zůstává referencí pro vaši situaci.',
    shareMessage: 'Plodnost a nový pokus po ztrátě — AWA',
  },
  sk: {
    badge: 'PO POTRATE • PLODNOSŤ',
    title: 'Plodnosť a nový pokus po strate',
    metaDuration: '6 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Stredne pokročilý',
    metaValidated: 'Informatívny obsah',
    intro:
      'Kedy a ako uvažovať o novom pokuse, vlastným tempom a s plnou dôverou.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Návrat plodnosti',
      'Čo zvyčajne hovoria odborníci',
      'Cítiť sa pripravená, vlastným tempom',
      'Následná starostlivosť, ktorá vás môže upokojiť',
      'Hlavné body',
    ],
    body1:
      'Plodnosť sa po včasnom potrate zvyčajne vracia už v nasledujúcom cykle. Ovulácia môže nastať dokonca skôr, než sa menštruácia viditeľne vráti.',
    infoTitle: 'Hlavný bod',
    infoText:
      'V závislosti od štádia straty sa čas fyzického zotavenia môže medzi situáciami mierne líšiť.',
    body2:
      'Mnohí odborníci sa domnievajú, že nie je potrebné čakať niekoľko cyklov pred novým pokusom, pokiaľ lekár alebo pôrodná asistentka neodporučia inak.',
    compareEarlyTitle: 'Skorá strata',
    compareEarlyText:
      'Plodnosť sa často vracia rýchlo, už v nasledujúcom cykle.',
    compareLateTitle: 'Neskoršia strata',
    compareLateText:
      'Zdravotnícky tím môže odporučiť o niečo dlhší čas zotavenia.',
    body3:
      'Cítiť sa pripravená, fyzicky aj emočne, zostáva najdôležitejším vodidlom — oveľa viac než akýkoľvek teoretický časový rámec.',
    readinessPoints: [
      {
        title: 'Emočne',
        text: 'Cítiť sa pripravená v sebe je rovnako dôležité ako fyzické zotavenie.',
      },
      {
        title: 'Fyzicky',
        text: 'Pravidelný cyklus a pocit pohody sú dobrými ukazovateľmi.',
      },
      {
        title: 'Ako pár alebo s podporou',
        text: 'Rozhovor s partnerom vám môže pomôcť postupovať rovnakým tempom.',
      },
    ],
    body4:
      'Pred novým pokusom vám lekárska návšteva môže pomôcť postupovať s väčším pokojom:',
    followUpSteps: [
      {
        title: 'Zhodnotenie',
        text: 'Rozhovor s odborníkom vám umožní vrátiť sa k tomu, čo sa stalo.',
      },
      {
        title: 'Vyšetrenie, ak je potrebné',
        text: 'Podľa situácie sa môžu ponúknuť ďalšie testy.',
      },
      {
        title: 'Nový pokus',
        text: 'Následná starostlivosť vás potom môže pokojne podporovať pri novom pokuse.',
      },
    ],
    tipTitle: 'Stojí za to vedieť',
    tipText:
      'Ojedinelý potrat vo všeobecnosti nenaznačuje problém s plodnosťou. Váš zdravotnícky tím je najlepšie pripravený odpovedať na vaše osobné otázky.',
    summaryPoints: [
      'Plodnosť sa po včasnom potrate zvyčajne vracia už v nasledujúcom cykle.',
      'Mnohí odborníci sa domnievajú, že nie je potrebné čakať niekoľko cyklov, pokiaľ nie je odporučené inak.',
      'Cítiť sa pripravená, fyzicky aj emočne, zostáva najdôležitejším vodidlom.',
      'Lekárske sledovanie vás môže pred novým pokusom podporiť a upokojiť.',
    ],
    disclaimerText:
      'Informatívny obsah. Tento článok nenahrádza individuálnu lekársku radu. Váš lekár alebo pôrodná asistentka zostáva referenciou pre vašu situáciu.',
    shareMessage: 'Plodnosť a nový pokus po strate — AWA',
  },
  hu: {
    badge: 'VETÉLÉS UTÁN • TERMÉKENYSÉG',
    title: 'Termékenység és újrapróbálkozás veszteség után',
    metaDuration: '6 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Középhaladó',
    metaValidated: 'Tájékoztató jellegű tartalom',
    intro:
      'Mikor és hogyan érdemes az újrapróbálkozásra gondolni, a saját tempódban és teljes bizalommal.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'A termékenység visszatérése',
      'Mit mondanak általában a szakemberek',
      'Készen állni, a saját tempódban',
      'Megnyugtató utánkövetés',
      'Legfontosabb tudnivalók',
    ],
    body1:
      'A termékenység általában már a korai vetélést követő ciklusban visszatér. A peteérés akár még azelőtt is bekövetkezhet, hogy a menstruációd láthatóan visszatérne.',
    infoTitle: 'Legfontosabb tudnivaló',
    infoText:
      'A veszteség szakaszától függően a testi felépülés ideje helyzetről helyzetre kissé eltérhet.',
    body2:
      'Sok szakember úgy véli, hogy nem kell több cikluson át várni az újrapróbálkozással, kivéve, ha az orvosod vagy a szülésznőd másként tanácsolja.',
    compareEarlyTitle: 'Korai veszteség',
    compareEarlyText:
      'A termékenység gyakran gyorsan visszatér, már a következő ciklusban.',
    compareLateTitle: 'Későbbi veszteség',
    compareLateText:
      'Az egészségügyi csapat valamivel hosszabb felépülési időt is javasolhat.',
    body3:
      'A testileg és érzelmileg is készen állás marad a legfontosabb vezérfonal — sokkal inkább, mint bármilyen elméleti időkeret.',
    readinessPoints: [
      {
        title: 'Érzelmileg',
        text: 'Az, hogy magadban készen állsz, ugyanolyan fontos, mint a testi felépülés.',
      },
      {
        title: 'Testileg',
        text: 'A rendszeres ciklus és a jó közérzet jó mutatók.',
      },
      {
        title: 'Párként vagy támogatással',
        text: 'A párkapcsolatban való beszélgetés segíthet, hogy azonos tempóban haladjatok.',
      },
    ],
    body4:
      'Az újrapróbálkozás előtt egy orvosi időpont segíthet nagyobb nyugalommal haladni:',
    followUpSteps: [
      {
        title: 'Összegzés',
        text: 'Egy szakemberrel folytatott beszélgetés lehetővé teszi, hogy visszatérj a történtekhez.',
      },
      {
        title: 'Vizsgálat, ha szükséges',
        text: 'A helyzettől függően további vizsgálatokat ajánlhatnak.',
      },
      {
        title: 'Új próbálkozás',
        text: 'Az utánkövetés ezután nyugodtan támogathat az újrapróbálkozásban.',
      },
    ],
    tipTitle: 'Érdemes tudni',
    tipText:
      'Egy elszigetelt vetélés általában nem termékenységi problémára utal. Az egészségügyi csapatod áll a legjobb helyzetben ahhoz, hogy válaszoljon a személyes kérdéseidre.',
    summaryPoints: [
      'A termékenység általában már a korai vetélést követő ciklusban visszatér.',
      'Sok szakember úgy véli, hogy nem kell több cikluson át várni, kivéve, ha másként tanácsolják.',
      'A testileg és érzelmileg is készen állás marad a legfontosabb vezérfonal.',
      'Az orvosi utánkövetés támogathat és megnyugtathat az újrapróbálkozás előtt.',
    ],
    disclaimerText:
      'Tájékoztató jellegű tartalom. Ez a cikk nem helyettesíti a személyre szabott orvosi tanácsot. Az orvosod vagy a szülésznőd marad az irányadó a helyzetedben.',
    shareMessage: 'Termékenység és újrapróbálkozás veszteség után — AWA',
  },
  ro: {
    badge: 'DUPĂ UN AVORT SPONTAN • FERTILITATE',
    title: 'Fertilitatea și noile încercări după o pierdere',
    metaDuration: '6 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Intermediar',
    metaValidated: 'Conținut informativ',
    intro:
      'Când și cum să te gândești să încerci din nou, în ritmul tău și cu deplină încredere.',
    contentsTitle: 'În acest articol',
    topics: [
      'Revenirea fertilității',
      'Ce spun în general profesioniștii',
      'Să te simți pregătită, în ritmul tău',
      'Urmărirea medicală care te poate liniști',
      'Ce să reții',
    ],
    body1:
      'Fertilitatea revine de obicei încă din ciclul care urmează unui avort spontan precoce. Ovulația poate avea loc chiar înainte ca menstruația să revină în mod vizibil.',
    infoTitle: 'Ideea principală',
    infoText:
      'În funcție de stadiul pierderii, timpul de recuperare fizică poate varia ușor de la o situație la alta.',
    body2:
      'Mulți profesioniști consideră că nu este nevoie să aștepți mai multe cicluri înainte de a încerca din nou, cu excepția cazului în care medicul sau moașa îți recomandă altceva.',
    compareEarlyTitle: 'Pierdere precoce',
    compareEarlyText:
      'Fertilitatea revine adesea repede, încă din ciclul următor.',
    compareLateTitle: 'Pierdere mai tardivă',
    compareLateText:
      'Echipa medicală poate recomanda un timp de recuperare ceva mai lung.',
    body3:
      'Să te simți pregătită, fizic și emoțional, rămâne cel mai important reper — mult mai mult decât orice interval teoretic.',
    readinessPoints: [
      {
        title: 'Emoțional',
        text: 'Să te simți pregătită în interior contează la fel de mult ca recuperarea fizică.',
      },
      {
        title: 'Fizic',
        text: 'Un ciclu regulat și o stare de bine sunt indicatori buni.',
      },
      {
        title: 'În cuplu sau cu sprijin',
        text: 'Discuția cu partenerul tău te poate ajuta să mergeți înainte în același ritm.',
      },
    ],
    body4:
      'Înainte de a încerca din nou, o consultație medicală te poate ajuta să mergi mai departe cu mai multă liniște:',
    followUpSteps: [
      {
        title: 'Un bilanț',
        text: 'O discuție cu un profesionist îți permite să revii asupra a ceea ce s-a întâmplat.',
      },
      {
        title: 'O evaluare, la nevoie',
        text: 'În funcție de situație, pot fi propuse analize suplimentare.',
      },
      {
        title: 'O nouă încercare',
        text: 'Urmărirea medicală te poate sprijini apoi liniștit în timp ce încerci din nou.',
      },
    ],
    tipTitle: 'Bine de știut',
    tipText:
      'Un avort spontan izolat nu indică, în general, o problemă de fertilitate. Echipa ta medicală rămâne cea mai bine plasată pentru a răspunde întrebărilor tale personale.',
    summaryPoints: [
      'Fertilitatea revine de obicei încă din ciclul care urmează unui avort spontan precoce.',
      'Mulți profesioniști consideră că nu este nevoie să aștepți mai multe cicluri, cu excepția cazului în care ți se recomandă altceva.',
      'Să te simți pregătită, fizic și emoțional, rămâne cel mai important reper.',
      'Urmărirea medicală te poate sprijini și liniști înainte de a încerca din nou.',
    ],
    disclaimerText:
      'Conținut cu caracter informativ. Acest articol nu înlocuiește sfatul medical personalizat. Medicul sau moașa ta rămâne referința pentru situația ta.',
    shareMessage: 'Fertilitatea și noile încercări după o pierdere — AWA',
  },
  bg: {
    badge: 'СЛЕД СПОНТАНЕН АБОРТ • ПЛОДОВИТОСТ',
    title: 'Плодовитост и нови опити след загуба',
    metaDuration: '6 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Средно ниво',
    metaValidated: 'Информационно съдържание',
    intro:
      'Кога и как да мислиш за нов опит, в твоето темпо и с пълна увереност.',
    contentsTitle: 'В тази статия',
    topics: [
      'Връщане на плодовитостта',
      'Какво казват обикновено специалистите',
      'Да се чувстваш готова, в твоето темпо',
      'Проследяване, което може да те успокои',
      'Какво да запомниш',
    ],
    body1:
      'Плодовитостта обикновено се връща още в цикъла след ранен спонтанен аборт. Овулацията може дори да настъпи, преди менструацията ти да се върне видимо.',
    infoTitle: 'Основната идея',
    infoText:
      'В зависимост от етапа на загубата времето за физическо възстановяване може да варира леко от ситуация на ситуация.',
    body2:
      'Много специалисти смятат, че не е нужно да чакаш няколко цикъла, преди да опиташ отново, освен ако лекарят или акушерката ти не посъветват друго.',
    compareEarlyTitle: 'Ранна загуба',
    compareEarlyText:
      'Плодовитостта често се връща бързо, още в следващия цикъл.',
    compareLateTitle: 'По-късна загуба',
    compareLateText:
      'Медицинският екип може да препоръча малко по-дълго време за възстановяване.',
    body3:
      'Да се чувстваш готова, физически и емоционално, остава най-важният ориентир — много повече от всеки теоретичен срок.',
    readinessPoints: [
      {
        title: 'Емоционално',
        text: 'Да се чувстваш готова вътрешно е също толкова важно, колкото физическото възстановяване.',
      },
      {
        title: 'Физически',
        text: 'Редовен цикъл и усещане за добро състояние са добри показатели.',
      },
      {
        title: 'Като двойка или с подкрепа',
        text: 'Разговорът с партньора ти може да ви помогне да вървите напред в един и същ ритъм.',
      },
    ],
    body4:
      'Преди да опиташ отново, медицинска консултация може да ти помогне да вървиш напред с повече спокойствие:',
    followUpSteps: [
      {
        title: 'Обобщение',
        text: 'Разговорът със специалист ти позволява да се върнеш към случилото се.',
      },
      {
        title: 'Оценка, ако е нужна',
        text: 'В зависимост от ситуацията могат да бъдат предложени допълнителни изследвания.',
      },
      {
        title: 'Нов опит',
        text: 'Проследяването може след това спокойно да те подкрепя, докато опитваш отново.',
      },
    ],
    tipTitle: 'Добре е да знаеш',
    tipText:
      'Един изолиран спонтанен аборт обикновено не показва проблем с плодовитостта. Медицинският ти екип остава най-добре позициониран да отговори на личните ти въпроси.',
    summaryPoints: [
      'Плодовитостта обикновено се връща още в цикъла след ранен спонтанен аборт.',
      'Много специалисти смятат, че не е нужно да чакаш няколко цикъла, освен ако не ти е препоръчано друго.',
      'Да се чувстваш готова, физически и емоционално, остава най-важният ориентир.',
      'Медицинското проследяване може да те подкрепи и успокои, преди да опиташ отново.',
    ],
    disclaimerText:
      'Информационно съдържание. Тази статия не замества персонализирания медицински съвет. Лекарят или акушерката ти остава референцията за твоята ситуация.',
    shareMessage: 'Плодовитост и нови опити след загуба — AWA',
  },
  sr: {
    badge: 'ПОСЛЕ СПОНТАНОГ ПОБАЧАЈА • ПЛОДНОСТ',
    title: 'Плодност и нови покушаји после губитка',
    metaDuration: '6 мин читања',
    metaType: 'Водич',
    metaLevel: 'Средњи ниво',
    metaValidated: 'Информативни садржај',
    intro:
      'Када и како размишљати о новом покушају, својим темпом и са потпуним поверењем.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Повратак плодности',
      'Шта стручњаци обично кажу',
      'Осећати се спремном, својим темпом',
      'Праћење које може да те умири',
      'Шта да запамтиш',
    ],
    body1:
      'Плодност се обично враћа већ у циклусу после раног спонтаног побачаја. Овулација може чак настати пре него што се менструација видљиво врати.',
    infoTitle: 'Основно',
    infoText:
      'Зависно од фазе губитка, време физичког опоравка може се благо разликовати од ситуације до ситуације.',
    body2:
      'Многи стручњаци сматрају да нема потребе да чекаш неколико циклуса пре новог покушаја, осим ако ти лекар или бабица не саветују другачије.',
    compareEarlyTitle: 'Рани губитак',
    compareEarlyText:
      'Плодност се често брзо враћа, већ у следећем циклусу.',
    compareLateTitle: 'Каснији губитак',
    compareLateText:
      'Медицински тим може препоручити нешто дуже време опоравка.',
    body3:
      'Осећати се спремном, физички и емоционално, остаје најважнији водич — много више од било ког теоријског рока.',
    readinessPoints: [
      {
        title: 'Емоционално',
        text: 'Осећати се спремном изнутра је једнако важно као физички опоравак.',
      },
      {
        title: 'Физички',
        text: 'Редован циклус и осећај добробити су добри показатељи.',
      },
      {
        title: 'Као пар или уз подршку',
        text: 'Разговор са партнером може вам помоћи да напредујете у истом ритму.',
      },
    ],
    body4:
      'Пре новог покушаја, лекарски преглед може ти помоћи да напредујеш са више спокоја:',
    followUpSteps: [
      {
        title: 'Сумирање',
        text: 'Разговор са стручњаком омогућава ти да се вратиш на оно што се догодило.',
      },
      {
        title: 'Процена по потреби',
        text: 'Зависно од ситуације, могу се предложити додатне анализе.',
      },
      {
        title: 'Нов покушај',
        text: 'Праћење те тада може мирно подржавати док покушаваш поново.',
      },
    ],
    tipTitle: 'Добро је знати',
    tipText:
      'Један изоловани спонтани побачај обично не указује на проблем са плодношћу. Твој медицински тим остаје најпозванији да одговори на твоја лична питања.',
    summaryPoints: [
      'Плодност се обично враћа већ у циклусу после раног спонтаног побачаја.',
      'Многи стручњаци сматрају да нема потребе чекати неколико циклуса, осим ако није другачије саветовано.',
      'Осећати се спремном, физички и емоционално, остаје најважнији водич.',
      'Медицинско праћење може те подржати и умирити пре новог покушаја.',
    ],
    disclaimerText:
      'Информативни садржај. Овај чланак не замењује персонализовани медицински савет. Твој лекар или бабица остаје референца за твоју ситуацију.',
    shareMessage: 'Плодност и нови покушаји после губитка — AWA',
  },
  hr: {
    badge: 'NAKON SPONTANOG POBAČAJA • PLODNOST',
    title: 'Plodnost i novi pokušaj nakon gubitka',
    metaDuration: '6 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Srednja razina',
    metaValidated: 'Informativni sadržaj',
    intro:
      'Kada i kako razmišljati o novom pokušaju, svojim tempom i s punim povjerenjem.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Povratak plodnosti',
      'Što stručnjaci općenito kažu',
      'Osjećaj spremnosti, svojim tempom',
      'Praćenje koje može umiriti',
      'Ključne poruke',
    ],
    body1:
      'Plodnost se obično vraća već u ciklusu nakon ranog spontanog pobačaja. Ovulacija se može dogoditi čak i prije nego što se menstruacija vidljivo vrati.',
    infoTitle: 'Ključna poruka',
    infoText:
      'Ovisno o fazi gubitka, vrijeme tjelesnog oporavka može se neznatno razlikovati od situacije do situacije.',
    body2:
      'Mnogi stručnjaci smatraju da nije potrebno čekati nekoliko ciklusa prije novog pokušaja, osim ako liječnik ili babica ne savjetuju drugačije.',
    compareEarlyTitle: 'Rani gubitak',
    compareEarlyText:
      'Plodnost se često brzo vraća, već u sljedećem ciklusu.',
    compareLateTitle: 'Kasniji gubitak',
    compareLateText:
      'Medicinski tim može preporučiti nešto dulje vrijeme oporavka.',
    body3:
      'Osjećaj spremnosti, tjelesne i emocionalne, ostaje najvažniji vodič — mnogo važniji od bilo kojeg teorijskog roka.',
    readinessPoints: [
      {
        title: 'Emocionalno',
        text: 'Osjećati se spremno u sebi jednako je važno kao tjelesni oporavak.',
      },
      {
        title: 'Tjelesno',
        text: 'Pravilan ciklus i osjećaj dobrobiti dobri su pokazatelji.',
      },
      {
        title: 'Kao par ili uz podršku',
        text: 'Razgovor s partnerom može vam pomoći da napredujete istim tempom.',
      },
    ],
    body4:
      'Prije novog pokušaja liječnički pregled može ti pomoći da nastaviš s više mira:',
    followUpSteps: [
      {
        title: 'Osvrt na situaciju',
        text: 'Razgovor sa stručnom osobom omogućuje ti da se vratiš na ono što se dogodilo.',
      },
      {
        title: 'Obrada ako je potrebno',
        text: 'Ovisno o situaciji mogu se predložiti dodatne pretrage.',
      },
      {
        title: 'Novi pokušaj',
        text: 'Praćenje te zatim može mirno podržati dok pokušavaš ponovno.',
      },
    ],
    tipTitle: 'Dobro je znati',
    tipText:
      'Jedan izoliran spontani pobačaj općenito ne upućuje na problem s plodnošću. Tvoj medicinski tim ostaje najbolje postavljen da odgovori na tvoja osobna pitanja.',
    summaryPoints: [
      'Plodnost se obično vraća već u ciklusu nakon ranog spontanog pobačaja.',
      'Mnogi stručnjaci smatraju da nije potrebno čekati nekoliko ciklusa, osim ako se ne savjetuje drugačije.',
      'Osjećaj spremnosti, tjelesne i emocionalne, ostaje najvažniji vodič.',
      'Liječničko praćenje može te podržati i umiriti prije novog pokušaja.',
    ],
    disclaimerText:
      'Informativni sadržaj. Ovaj članak ne zamjenjuje individualni medicinski savjet. Tvoj liječnik ili babica ostaje mjerodavan za tvoju situaciju.',
    shareMessage: 'Plodnost i novi pokušaj nakon gubitka — AWA',
  },
  bs: {
    badge: 'NAKON SPONTANOG POBAČAJA • PLODNOST',
    title: 'Plodnost i novi pokušaj nakon gubitka',
    metaDuration: '6 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Srednja razina',
    metaValidated: 'Informativni sadržaj',
    intro:
      'Kada i kako razmišljati o novom pokušaju, svojim tempom i s punim povjerenjem.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Povratak plodnosti',
      'Što stručnjaci općenito kažu',
      'Osjećaj spremnosti, svojim tempom',
      'Praćenje koje može umiriti',
      'Ključne poruke',
    ],
    body1:
      'Plodnost se obično vraća već u ciklusu nakon ranog spontanog pobačaja. Ovulacija se može dogoditi čak i prije nego što se menstruacija vidljivo vrati.',
    infoTitle: 'Ključna poruka',
    infoText:
      'Ovisno o fazi gubitka, vrijeme tjelesnog oporavka može se neznatno razlikovati od situacije do situacije.',
    body2:
      'Mnogi stručnjaci smatraju da nije potrebno čekati nekoliko ciklusa prije novog pokušaja, osim ako ljekar ili babica ne savjetuju drugačije.',
    compareEarlyTitle: 'Rani gubitak',
    compareEarlyText:
      'Plodnost se često brzo vraća, već u sljedećem ciklusu.',
    compareLateTitle: 'Kasniji gubitak',
    compareLateText:
      'Medicinski tim može preporučiti nešta dulje vrijeme oporavka.',
    body3:
      'Osjećaj spremnosti, tjelesne i emocionalne, ostaje najvažniji vodič — mnogo važniji od bilo kojeg teorijskog roka.',
    readinessPoints: [
      {
        title: 'Emocionalno',
        text: 'Osjećati se spremno u sebi jednako je važno kao tjelesni oporavak.',
      },
      {
        title: 'Tjelesno',
        text: 'Pravilan ciklus i osjećaj dobrobiti dobri su pokazatelji.',
      },
      {
        title: 'Kao par ili uz podršku',
        text: 'Razgovor s partnerom može vam pomoći da napredujete istim tempom.',
      },
    ],
    body4:
      'Prije novog pokušaja ljekarski pregled može ti pomoći da nastaviš s više mira:',
    followUpSteps: [
      {
        title: 'Osvrt na situaciju',
        text: 'Razgovor sa stručnom osobom omogućuje ti da se vratiš na ono što se dogodilo.',
      },
      {
        title: 'Obrada ako je potrebno',
        text: 'Ovisno o situaciji mogu se predložiti dodatne pretrage.',
      },
      {
        title: 'Novi pokušaj',
        text: 'Praćenje te zatim može mirno podržati dok pokušavaš ponovno.',
      },
    ],
    tipTitle: 'Dobro je znati',
    tipText:
      'Jedan izoliran spontani pobačaj općenito ne upućuje na problem s plodnošću. Tvoj medicinski tim ostaje najbolje postavljen da odgovori na tvoja osobna pitanja.',
    summaryPoints: [
      'Plodnost se obično vraća već u ciklusu nakon ranog spontanog pobačaja.',
      'Mnogi stručnjaci smatraju da nije potrebno čekati nekoliko ciklusa, osim ako se ne savjetuje drugačije.',
      'Osjećaj spremnosti, tjelesne i emocionalne, ostaje najvažniji vodič.',
      'Ljekarsko praćenje može te podržati i umiriti prije novog pokušaja.',
    ],
    disclaimerText:
      'Informativni sadržaj. Ovaj članak ne zamjenjuje individualni medicinski savjet. Tvoj ljekar ili babica ostaje mjerodavan za tvoju situaciju.',
    shareMessage: 'Plodnost i novi pokušaj nakon gubitka — AWA',
  },
  sl: {
    badge: 'PO SPONTANEM SPLAVU • PLODNOST',
    title: 'Plodnost in nov poskus po izgubi',
    metaDuration: '6 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Srednja raven',
    metaValidated: 'Informativna vsebina',
    intro:
      'Kdaj in kako razmišljati o novem poskusu, v svojem tempu in s polnim zaupanjem.',
    contentsTitle: 'V tem članku',
    topics: [
      'Vrnitev plodnosti',
      'Kaj strokovnjaki na splošno pravijo',
      'Občutek pripravljenosti, v svojem tempu',
      'Spremljanje, ki lahko pomiri',
      'Ključna sporočila',
    ],
    body1:
      'Plodnost se običajno vrne že v ciklu po zgodnjem spontanem splavu. Ovulacija se lahko zgodi celo, preden se menstruacija vidno vrne.',
    infoTitle: 'Ključno sporočilo',
    infoText:
      'Glede na fazo izgube se čas telesnega okrevanja lahko rahlo razlikuje od situacije do situacije.',
    body2:
      'Mnogi strokovnjaki menijo, da ni treba čakati več ciklov pred novim poskusom, razen če zdravnik ali babica ne svetujeta drugače.',
    compareEarlyTitle: 'Zgodnja izguba',
    compareEarlyText:
      'Plodnost se pogosto hitro vrne, že v naslednjem ciklu.',
    compareLateTitle: 'Poznejša izguba',
    compareLateText:
      'Medicinska ekipa lahko priporoči nekoliko daljši čas okrevanja.',
    body3:
      'Občutek pripravljenosti, telesne in čustvene, ostaja najpomembnejši vodnik — veliko pomembnejši od katerega koli teoretičnega roka.',
    readinessPoints: [
      {
        title: 'Čustveno',
        text: 'Čutiti se pripravljeno v sebi je enako pomembno kot telesno okrevanje.',
      },
      {
        title: 'Telesno',
        text: 'Reden cikel in občutek dobrega počutja sta dobra kazalnika.',
      },
      {
        title: 'Kot par ali s podporo',
        text: 'Pogovor s partnerjem vama lahko pomaga napredovati z enakim tempom.',
      },
    ],
    body4:
      'Pred novim poskusom ti lahko zdravniški pregled pomaga nadaljevati z več miru:',
    followUpSteps: [
      {
        title: 'Pregled situacije',
        text: 'Pogovor s strokovnjakom ti omogoča, da se vrneš k temu, kar se je zgodilo.',
      },
      {
        title: 'Obdelava, če je potrebno',
        text: 'Glede na situacijo se lahko predlagajo dodatne preiskave.',
      },
      {
        title: 'Nov poskus',
        text: 'Spremljanje te nato lahko mirno podpira, ko poskušaš znova.',
      },
    ],
    tipTitle: 'Vredno vedeti',
    tipText:
      'En sam izoliran spontani splav na splošno ne kaže na težavo s plodnostjo. Tvoja medicinska ekipa je najbolje postavljena, da odgovori na tvoja osebna vprašanja.',
    summaryPoints: [
      'Plodnost se običajno vrne že v ciklu po zgodnjem spontanem splavu.',
      'Mnogi strokovnjaki menijo, da ni treba čakati več ciklov, razen če se ne svetuje drugače.',
      'Občutek pripravljenosti, telesne in čustvene, ostaja najpomembnejši vodnik.',
      'Zdravniško spremljanje te lahko podpre in pomiri pred novim poskusom.',
    ],
    disclaimerText:
      'Informativna vsebina. Ta članek ne nadomešča osebnega zdravniškega nasveta. Tvoj zdravnik ali babica ostaja merodajen za tvojo situacijo.',
    shareMessage: 'Plodnost in nov poskus po izgubi — AWA',
  },
  ne: {
    badge: 'गर्भपतनपछि • उर्वरता',
    title: 'क्षतिपछि उर्वरता र फेरि प्रयास गर्ने',
    metaDuration: '6 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'मध्यम',
    metaValidated: 'जानकारीमूलक सामग्री',
    intro:
      'फेरि प्रयास गर्नेबारे कहिले र कसरी सोच्ने, आफ्नै गतिमा र पूर्ण विश्वासका साथ।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'उर्वरताको फिर्ती',
      'व्यावसायिकहरूले सामान्यतया के भन्छन्',
      'आफ्नै गतिमा तयार महसुस गर्ने',
      'आश्वस्त पार्न सक्ने फलोअप हेरचाह',
      'मुख्य कुराहरू',
    ],
    body1:
      'चाँडो गर्भपतनपछिको अर्को चक्रदेखि नै उर्वरता सामान्यतया फर्कन्छ। तपाईंको महिनावारी स्पष्ट रूपमा फर्कनुअघि नै अण्डोत्सर्ग पनि हुन सक्छ।',
    infoTitle: 'मुख्य कुरा',
    infoText:
      'क्षतिको चरणअनुसार, शारीरिक स्वास्थ्यलाभको समय एक अवस्थादेखि अर्कोमा अलिकति फरक हुन सक्छ।',
    body2:
      'धेरै व्यावसायिकहरू तपाईंको चिकित्सक वा सुँडेनीले अन्यथा सल्लाह नदिएसम्म फेरि प्रयास गर्नुअघि धेरै चक्र पर्खनु आवश्यक छैन भन्ने ठान्छन्।',
    compareEarlyTitle: 'चाँडो क्षति',
    compareEarlyText:
      'उर्वरता प्रायः चाँडै, अर्को चक्रदेखि नै फर्कन्छ।',
    compareLateTitle: 'पछिको क्षति',
    compareLateText:
      'चिकित्सकीय टोलीले अलिक लामो स्वास्थ्यलाभको समय सिफारिस गर्न सक्छ।',
    body3:
      'शारीरिक र भावनात्मक रूपमा तयार महसुस गर्नु सबैभन्दा महत्त्वपूर्ण मार्गदर्शक रहन्छ — कुनै सैद्धान्तिक समयसीमाभन्दा धेरै।',
    readinessPoints: [
      {
        title: 'भावनात्मक रूपमा',
        text: 'आफ्नो भित्र तयार महसुस गर्नु शारीरिक स्वास्थ्यलाभजत्तिकै महत्त्वपूर्ण छ।',
      },
      {
        title: 'शारीरिक रूपमा',
        text: 'नियमित चक्र र भलाइको अनुभूति राम्रा सूचक हुन्।',
      },
      {
        title: 'दम्पतीका रूपमा वा साथसहित',
        text: 'आफ्नो साथीसँग यसबारे कुरा गर्नाले तपाईंहरूलाई एउटै गतिमा अघि बढ्न मद्दत गर्न सक्छ।',
      },
    ],
    body4:
      'फेरि प्रयास गर्नुअघि, चिकित्सकीय भेटघाटले तपाईंलाई थप मनको शान्तिसाथ अघि बढ्न मद्दत गर्न सक्छ:',
    followUpSteps: [
      {
        title: 'अवस्थाको समीक्षा',
        text: 'व्यावसायिकसँगको कुराकानीले जे भयो त्यसलाई फेरि हेर्न दिन्छ।',
      },
      {
        title: 'आवश्यक परे मूल्याङ्कन',
        text: 'अवस्थाअनुसार, थप परीक्षणहरू प्रस्ताव गर्न सकिन्छ।',
      },
      {
        title: 'नयाँ प्रयास',
        text: 'फलोअप हेरचाहले त्यसपछि तपाईंले फेरि प्रयास गर्दा शान्तिसँग साथ दिन सक्छ।',
      },
    ],
    tipTitle: 'जान्न लायक',
    tipText:
      'एउटा एक्लो गर्भपतनले सामान्यतया उर्वरताको समस्या जनाउँदैन। तपाईंको चिकित्सकीय टोली नै तपाईंका व्यक्तिगत प्रश्नहरूको उत्तर दिन सबैभन्दा उपयुक्त हुन्छ।',
    summaryPoints: [
      'चाँडो गर्भपतनपछिको अर्को चक्रदेखि नै उर्वरता सामान्यतया फर्कन्छ।',
      'धेरै व्यावसायिकहरू अन्यथा सल्लाह नदिएसम्म धेरै चक्र पर्खनु आवश्यक छैन भन्ने ठान्छन्।',
      'शारीरिक र भावनात्मक रूपमा तयार महसुस गर्नु सबैभन्दा महत्त्वपूर्ण मार्गदर्शक रहन्छ।',
      'चिकित्सकीय फलोअपले फेरि प्रयास गर्नुअघि तपाईंलाई साथ दिन र आश्वस्त पार्न सक्छ।',
    ],
    disclaimerText:
      'जानकारीमूलक सामग्री। यो लेखले व्यक्तिगत चिकित्सकीय सल्लाहको स्थान लिँदैन। तपाईंको चिकित्सक वा सुँडेनी नै तपाईंको अवस्थाका लागि सन्दर्भ रहन्छन्।',
    shareMessage: 'क्षतिपछि उर्वरता र फेरि प्रयास गर्ने — AWA',
  },
  si: {
    badge: 'ගබ්සාවකින් පසු • සාරවත් බව',
    title: 'අහිමිවීමකින් පසු සාරවත් බව සහ නැවත උත්සාහ කිරීම',
    metaDuration: 'කියවීමට මිනිත්තු 6',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'මධ්‍යම',
    metaValidated: 'තොරතුරු අන්තර්ගතය',
    intro:
      'නැවත උත්සාහ කිරීම ගැන සිතිය යුත්තේ කවදාද සහ කෙසේද, ඔබේම වේගයෙන් සහ සම්පූර්ණ විශ්වාසයෙන්.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'සාරවත් බව නැවත පැමිණීම',
      'වෘත්තිකයන් සාමාන්‍යයෙන් පවසන දේ',
      'ඔබේම වේගයෙන් සූදානම් බව දැනීම',
      'ඔබව සැනසිය හැකි පසු විපරම් සත්කාර',
      'ප්‍රධාන කරුණු',
    ],
    body1:
      'මුල් ගබ්සාවකින් පසු චක්‍රයේ සිටම සාරවත් බව සාමාන්‍යයෙන් නැවත පැමිණේ. ඔබේ ඔසප් පැහැදිලිව නැවත පැමිණීමට පෙර පවා ඩිම්බ මෝචනය සිදුවිය හැක.',
    infoTitle: 'ප්‍රධාන කරුණ',
    infoText:
      'අහිමිවීමේ අවධිය අනුව, ශාරීරික යථා තත්ත්වයට පැමිණීමේ කාලය එක් තත්ත්වයකින් තවත් තත්ත්වයකට තරමක් වෙනස් විය හැක.',
    body2:
      'බොහෝ වෘත්තිකයන් සලකන්නේ, ඔබේ වෛද්‍යවරයා හෝ ප්‍රසව හෙදිය වෙනත් ලෙස උපදෙස් දෙන්නේ නම් මිස, නැවත උත්සාහ කිරීමට පෙර චක්‍ර කිහිපයක් බලා සිටීම අවශ්‍ය නොවන බවයි.',
    compareEarlyTitle: 'මුල් අහිමිවීම',
    compareEarlyText:
      'සාරවත් බව බොහෝ විට ඉක්මනින්, ඊළඟ චක්‍රයේ සිටම නැවත පැමිණේ.',
    compareLateTitle: 'පසු අහිමිවීම',
    compareLateText:
      'වෛද්‍ය කණ්ඩායම විසින් තරමක් දිගු යථා තත්ත්වයට පැමිණීමේ කාලයක් නිර්දේශ කළ හැක.',
    body3:
      'කායිකව සහ චිත්තවේගීව සූදානම් බව දැනීම, ඕනෑම න්‍යායාත්මක කාල රාමුවකට වඩා බොහෝ සේ, වඩාත්ම වැදගත් මාර්ගෝපදේශය ලෙස පවතී.',
    readinessPoints: [
      {
        title: 'චිත්තවේගීව',
        text: 'ඔබ තුළ සූදානම් බව දැනීම ශාරීරික යථා තත්ත්වයට පැමිණීම තරමටම වැදගත්.',
      },
      {
        title: 'කායිකව',
        text: 'නිතිපතා චක්‍රයක් සහ යහපැවැත්මේ හැඟීමක් හොඳ දර්ශක වේ.',
      },
      {
        title: 'යුවළක් ලෙස හෝ සහාය සමඟ',
        text: 'ඒ ගැන ඔබේ සහකරු/සහකාරිය සමඟ කතා කිරීම ඔබට එකම වේගයෙන් ඉදිරියට යාමට උපකාරී විය හැක.',
      },
    ],
    body4:
      'නැවත උත්සාහ කිරීමට පෙර, වෛද්‍ය හමුවීමක් වඩා සන්සුන් සිතින් ඉදිරියට යාමට ඔබට උපකාරී විය හැක:',
    followUpSteps: [
      {
        title: 'තත්ත්වය තක්සේරු කිරීම',
        text: 'වෘත්තිකයෙකු සමඟ සංවාදයක් සිදු වූ දේ නැවත සලකා බැලීමට ඔබට ඉඩ සලසයි.',
      },
      {
        title: 'අවශ්‍ය නම් තක්සේරුවක්',
        text: 'තත්ත්වය අනුව, අමතර පරීක්ෂණ ඉදිරිපත් කළ හැක.',
      },
      {
        title: 'නව උත්සාහයක්',
        text: 'පසු විපරම් සත්කාර ඔබ නැවත උත්සාහ කරන විට සන්සුන්ව ඔබට සහාය විය හැක.',
      },
    ],
    tipTitle: 'දැනගත යුතු දේ',
    tipText:
      'හුදකලා ගබ්සාවක් සාමාන්‍යයෙන් සාරවත් බවේ ගැටලුවක් පෙන්නුම් නොකරයි. ඔබේ පෞද්ගලික ප්‍රශ්නවලට පිළිතුරු දීමට ඔබේ වෛද්‍ය කණ්ඩායම වඩාත්ම සුදුසු ස්ථානයේ සිටී.',
    summaryPoints: [
      'මුල් ගබ්සාවකින් පසු චක්‍රයේ සිටම සාරවත් බව සාමාන්‍යයෙන් නැවත පැමිණේ.',
      'බොහෝ වෘත්තිකයන් සලකන්නේ, වෙනත් ලෙස උපදෙස් දෙන්නේ නම් මිස, චක්‍ර කිහිපයක් බලා සිටීම අවශ්‍ය නොවන බවයි.',
      'කායිකව සහ චිත්තවේගීව සූදානම් බව දැනීම වඩාත්ම වැදගත් මාර්ගෝපදේශය ලෙස පවතී.',
      'වෛද්‍ය පසු විපරම නැවත උත්සාහ කිරීමට පෙර ඔබට සහාය වී ඔබව සැනසිය හැක.',
    ],
    disclaimerText:
      'තොරතුරු අන්තර්ගතයකි. මෙම ලිපිය පුද්ගලීකරණය කළ වෛද්‍ය උපදෙස් වෙනුවට නොපවතී. ඔබේ වෛද්‍යවරයා හෝ ප්‍රසව හෙදිය ඔබේ තත්ත්වය සඳහා යොමුව ලෙස පවතී.',
    shareMessage: 'අහිමිවීමකින් පසු සාරවත් බව සහ නැවත උත්සාහ කිරීම — AWA',
  },
  th: {
    badge: 'หลังการแท้งบุตร • ภาวะเจริญพันธุ์',
    title: 'ภาวะเจริญพันธุ์และการพยายามอีกครั้งหลังการสูญเสีย',
    metaDuration: 'อ่าน 6 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'ปานกลาง',
    metaValidated: 'เนื้อหาเพื่อให้ข้อมูล',
    intro:
      'เมื่อไรและอย่างไรจึงควรคิดถึงการลองอีกครั้ง ตามจังหวะของคุณและด้วยความมั่นใจเต็มที่',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'การกลับมาของภาวะเจริญพันธุ์',
      'สิ่งที่ผู้เชี่ยวชาญมักกล่าว',
      'รู้สึกพร้อม ตามจังหวะของคุณ',
      'การติดตามดูแลที่ช่วยให้คุณสบายใจ',
      'ประเด็นสำคัญ',
    ],
    body1:
      'ภาวะเจริญพันธุ์มักกลับมาตั้งแต่รอบเดือนถัดจากการแท้งบุตรในระยะแรก การตกไข่อาจเกิดขึ้นก่อนที่ประจำเดือนจะกลับมาให้เห็นชัดด้วยซ้ำ',
    infoTitle: 'ประเด็นสำคัญ',
    infoText:
      'ตามระยะของการสูญเสีย เวลาฟื้นตัวทางร่างกายอาจต่างกันเล็กน้อยในแต่ละสถานการณ์',
    body2:
      'ผู้เชี่ยวชาญหลายคนเห็นว่าไม่จำเป็นต้องรอหลายรอบเดือนก่อนลองอีกครั้ง เว้นแต่แพทย์หรือผดุงครรภ์ของคุณจะแนะนำเป็นอย่างอื่น',
    compareEarlyTitle: 'การสูญเสียในระยะแรก',
    compareEarlyText:
      'ภาวะเจริญพันธุ์มักกลับมาเร็ว ตั้งแต่รอบเดือนถัดไป',
    compareLateTitle: 'การสูญเสียในระยะหลัง',
    compareLateText:
      'ทีมแพทย์อาจแนะนำเวลาฟื้นตัวที่นานขึ้นเล็กน้อย',
    body3:
      'การรู้สึกพร้อม ทั้งทางกายและทางอารมณ์ ยังคงเป็นแนวทางที่สำคัญที่สุด — มากกว่ากรอบเวลาตามทฤษฎีใด ๆ',
    readinessPoints: [
      {
        title: 'ทางอารมณ์',
        text: 'การรู้สึกพร้อมภายในใจสำคัญไม่น้อยไปกว่าการฟื้นตัวทางร่างกาย',
      },
      {
        title: 'ทางกาย',
        text: 'รอบเดือนที่สม่ำเสมอและความรู้สึกสบายดีเป็นตัวชี้วัดที่ดี',
      },
      {
        title: 'ในฐานะคู่หรือด้วยการสนับสนุน',
        text: 'การพูดคุยกับคู่ของคุณช่วยให้ก้าวไปด้วยจังหวะเดียวกัน',
      },
    ],
    body4:
      'ก่อนลองอีกครั้ง การพบแพทย์ช่วยให้คุณก้าวไปด้วยความสบายใจยิ่งขึ้น:',
    followUpSteps: [
      {
        title: 'ทบทวนสถานการณ์',
        text: 'การพูดคุยกับผู้เชี่ยวชาญช่วยให้คุณทบทวนสิ่งที่เกิดขึ้น',
      },
      {
        title: 'การประเมินหากจำเป็น',
        text: 'ตามสถานการณ์ อาจเสนอการตรวจเพิ่มเติม',
      },
      {
        title: 'การลองครั้งใหม่',
        text: 'การติดตามดูแลจะสนับสนุนคุณอย่างสงบขณะที่คุณลองอีกครั้ง',
      },
    ],
    tipTitle: 'ควรรู้',
    tipText:
      'การแท้งบุตรเพียงครั้งเดียวโดยทั่วไปไม่ได้บ่งชี้ถึงปัญหาภาวะเจริญพันธุ์ ทีมแพทย์ของคุณยังคงเป็นผู้ที่ตอบคำถามส่วนตัวของคุณได้ดีที่สุด',
    summaryPoints: [
      'ภาวะเจริญพันธุ์มักกลับมาตั้งแต่รอบเดือนถัดจากการแท้งบุตรในระยะแรก',
      'ผู้เชี่ยวชาญหลายคนเห็นว่าไม่จำเป็นต้องรอหลายรอบเดือน เว้นแต่จะมีคำแนะนำเป็นอย่างอื่น',
      'การรู้สึกพร้อม ทั้งทางกายและทางอารมณ์ ยังคงเป็นแนวทางที่สำคัญที่สุด',
      'การติดตามทางการแพทย์สนับสนุนและช่วยให้คุณสบายใจก่อนลองอีกครั้ง',
    ],
    disclaimerText:
      'เนื้อหาเพื่อให้ข้อมูล บทความนี้ไม่ได้ทดแทนคำแนะนำทางการแพทย์เฉพาะบุคคล แพทย์หรือผดุงครรภ์ของคุณยังคงเป็นแหล่งอ้างอิงสำหรับสถานการณ์ของคุณ',
    shareMessage: 'ภาวะเจริญพันธุ์และการพยายามอีกครั้งหลังการสูญเสีย — AWA',
  },
  vi: {
    badge: 'SAU KHI MẤT THAI • KHẢ NĂNG SINH SẢN',
    title: 'Khả năng sinh sản và cố gắng thụ thai lại sau mất mát',
    metaDuration: '6 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Trung cấp',
    metaValidated: 'Nội dung mang tính thông tin',
    intro:
      'Khi nào và làm thế nào để nghĩ đến việc thử lại, theo nhịp của bạn và với đầy đủ sự tự tin.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Khả năng sinh sản trở lại',
      'Các chuyên gia thường nói gì',
      'Cảm thấy sẵn sàng, theo nhịp của bạn',
      'Chăm sóc theo dõi có thể giúp bạn yên tâm',
      'Những điểm chính cần nhớ',
    ],
    body1:
      'Khả năng sinh sản thường trở lại ngay từ chu kỳ sau một lần sảy thai sớm. Rụng trứng thậm chí có thể xảy ra trước khi kỳ kinh trở lại rõ ràng.',
    infoTitle: 'Điểm chính cần nhớ',
    infoText:
      'Tùy theo giai đoạn của lần mất thai, thời gian hồi phục thể chất có thể hơi khác nhau giữa các tình huống.',
    body2:
      'Nhiều chuyên gia cho rằng không cần chờ nhiều chu kỳ trước khi thử lại, trừ khi bác sĩ hoặc nữ hộ sinh của bạn khuyên khác.',
    compareEarlyTitle: 'Mất thai sớm',
    compareEarlyText:
      'Khả năng sinh sản thường trở lại nhanh, ngay từ chu kỳ tiếp theo.',
    compareLateTitle: 'Mất thai muộn hơn',
    compareLateText:
      'Đội ngũ y tế có thể khuyên một thời gian hồi phục dài hơn một chút.',
    body3:
      'Cảm thấy sẵn sàng, cả về thể chất lẫn tinh thần, vẫn là chỉ dẫn quan trọng nhất — hơn nhiều so với bất kỳ khung thời gian lý thuyết nào.',
    readinessPoints: [
      {
        title: 'Về mặt tinh thần',
        text: 'Cảm thấy sẵn sàng trong chính bản thân cũng quan trọng không kém sự hồi phục thể chất.',
      },
      {
        title: 'Về mặt thể chất',
        text: 'Chu kỳ đều đặn và cảm giác khỏe mạnh là những chỉ báo tốt.',
      },
      {
        title: 'Với tư cách một cặp đôi hoặc có sự hỗ trợ',
        text: 'Nói chuyện với bạn đời có thể giúp hai bạn tiến bước cùng một nhịp.',
      },
    ],
    body4:
      'Trước khi thử lại, một buổi hẹn y tế có thể giúp bạn tiến bước với sự yên tâm hơn:',
    followUpSteps: [
      {
        title: 'Nhìn lại',
        text: 'Một cuộc trò chuyện với chuyên gia cho phép bạn xem lại những gì đã xảy ra.',
      },
      {
        title: 'Đánh giá nếu cần',
        text: 'Tùy tình huống, có thể đề xuất thêm các xét nghiệm bổ sung.',
      },
      {
        title: 'Một lần thử mới',
        text: 'Việc chăm sóc theo dõi sau đó có thể đồng hành cùng bạn một cách bình tĩnh khi thử lại.',
      },
    ],
    tipTitle: 'Nên biết',
    tipText:
      'Một lần sảy thai đơn lẻ nhìn chung không cho thấy vấn đề về khả năng sinh sản. Đội ngũ y tế của bạn vẫn là nơi giải đáp tốt nhất các thắc mắc cá nhân của bạn.',
    summaryPoints: [
      'Khả năng sinh sản thường trở lại ngay từ chu kỳ sau một lần sảy thai sớm.',
      'Nhiều chuyên gia cho rằng không cần chờ nhiều chu kỳ, trừ khi được khuyên khác.',
      'Cảm thấy sẵn sàng, cả về thể chất lẫn tinh thần, vẫn là chỉ dẫn quan trọng nhất.',
      'Việc theo dõi y tế có thể hỗ trợ và giúp bạn yên tâm trước khi thử lại.',
    ],
    disclaimerText:
      'Nội dung mang tính thông tin. Bài viết này không thay thế lời khuyên y khoa cá nhân hóa. Bác sĩ hoặc nữ hộ sinh của bạn vẫn là tham chiếu cho tình huống của bạn.',
    shareMessage: 'Khả năng sinh sản và cố gắng thụ thai lại sau mất mát — AWA',
  },
  uz: {
    badge: 'HOMILA TUSHGANDAN KEYIN • UNUMDORLIK',
    title: 'Yoʻqotishdan keyin unumdorlik va qayta urinish',
    metaDuration: '6 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Oʻrta',
    metaValidated: 'Maʼlumot uchun kontent',
    intro:
      'Qayta urinish haqida qachon va qanday oʻylash kerak — oʻz surʼatingizda va toʻliq ishonch bilan.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Unumdorlikning qaytishi',
      'Mutaxassislar odatda nima deydi',
      'Oʻz surʼatingizda tayyor ekaningizni his qilish',
      'Sizni tinchlantirishi mumkin boʻlgan nazorat',
      'Asosiy xulosalar',
    ],
    body1:
      'Unumdorlik odatda erta homila tushgandan keyingi sikldanoq qaytadi. Ovulyatsiya hatto hayzingiz koʻrinarli qaytishidan oldin ham sodir boʻlishi mumkin.',
    infoTitle: 'Asosiy xulosa',
    infoText:
      'Yoʻqotish bosqichiga qarab, jismoniy tiklanish vaqti bir vaziyatdan boshqasiga biroz farq qilishi mumkin.',
    body2:
      'Koʻp mutaxassislar, shifokor yoki doyangiz boshqacha maslahat bermasa, qayta urinishdan oldin bir necha sikl kutish shart emas deb hisoblaydi.',
    compareEarlyTitle: 'Erta yoʻqotish',
    compareEarlyText:
      'Unumdorlik koʻpincha tez, keyingi sikldanoq qaytadi.',
    compareLateTitle: 'Keyingi muddatdagi yoʻqotish',
    compareLateText:
      'Tibbiy jamoa biroz uzoqroq tiklanish vaqtini tavsiya qilishi mumkin.',
    body3:
      'Jismoniy va hissiy jihatdan tayyor ekaningizni his qilish har qanday nazariy muddatdan ancha koʻproq eng muhim yoʻl-yoʻriq boʻlib qoladi.',
    readinessPoints: [
      {
        title: 'Hissiy jihatdan',
        text: 'Ichingizda tayyor ekaningizni his qilish jismoniy tiklanish kabi muhim.',
      },
      {
        title: 'Jismoniy jihatdan',
        text: 'Muntazam sikl va yaxshi his qilish — yaxshi koʻrsatkichlar.',
      },
      {
        title: 'Juftlik sifatida yoki yordam bilan',
        text: 'Hamrohingiz bilan bu haqda gaplashish bir xil surʼatda oldinga siljishga yordam beradi.',
      },
    ],
    body4:
      'Qayta urinishdan oldin tibbiy qabul xotirjamroq oldinga siljishga yordam beradi:',
    followUpSteps: [
      {
        title: 'Xulosa chiqarish',
        text: 'Mutaxassis bilan suhbat sodir boʻlgan voqeani qayta koʻrib chiqish imkonini beradi.',
      },
      {
        title: 'Kerak boʻlsa, tekshiruv',
        text: 'Vaziyatga qarab, qoʻshimcha tahlillar taklif qilinishi mumkin.',
      },
      {
        title: 'Yangi urinish',
        text: 'Keyin nazorat qayta urinayotganingizda sizni xotirjam qoʻllab-quvvatlashi mumkin.',
      },
    ],
    tipTitle: 'Bilish foydali',
    tipText:
      'Yakka homila tushishi odatda unumdorlik muammosini bildirmaydi. Shaxsiy savollaringizga javob berish uchun tibbiy jamoangiz eng yaxshi oʻrinda.',
    summaryPoints: [
      'Unumdorlik odatda erta homila tushgandan keyingi sikldanoq qaytadi.',
      'Koʻp mutaxassislar, boshqacha maslahat berilmasa, bir necha sikl kutish shart emas deb hisoblaydi.',
      'Jismoniy va hissiy jihatdan tayyor ekaningizni his qilish eng muhim yoʻl-yoʻriq boʻlib qoladi.',
      'Tibbiy nazorat qayta urinishdan oldin sizni qoʻllab-quvvatlashi va tinchlantirishi mumkin.',
    ],
    disclaimerText:
      'Maʼlumot uchun kontent. Bu maqola shaxsiy tibbiy maslahatni almashtirmaydi. Vaziyatingiz uchun shifokor yoki doyangiz tayanch boʻlib qoladi.',
    shareMessage: 'Yoʻqotishdan keyin unumdorlik va qayta urinish — AWA',
  },
  az: {
    badge: 'DÜŞÜKDƏN SONRA • MÜNBİTLİK',
    title: 'İtkidən sonra münbitlik və yenidən cəhd',
    metaDuration: '6 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Orta',
    metaValidated: 'Məlumat xarakterli məzmun',
    intro:
      'Yenidən cəhd etmək barədə nə vaxt və necə düşünmək lazımdır — öz tempinizlə və tam əminliklə.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Münbitliyin qayıtması',
      'Mütəxəssislər adətən nə deyir',
      'Özünüzü hazır hiss etmək, öz tempinizlə',
      'Sizi arxayın edə bilən nəzarət qayğısı',
      'Əsas nəticələr',
    ],
    body1:
      'Münbitlik adətən erkən düşükdən sonrakı dövrdən etibarən qayıdır. Ovulyasiya hətta aybaşınız gözə çarpacaq şəkildə qayıtmazdan əvvəl də baş verə bilər.',
    infoTitle: 'Əsas nəticə',
    infoText:
      'İtkinin mərhələsindən asılı olaraq fiziki bərpa müddəti bir vəziyyətdən digərinə bir qədər dəyişə bilər.',
    body2:
      'Bir çox mütəxəssis hesab edir ki, həkiminiz və ya mamanız başqa cür məsləhət görməyibsə, yenidən cəhd etməzdən əvvəl bir neçə dövr gözləməyə ehtiyac yoxdur.',
    compareEarlyTitle: 'Erkən itki',
    compareEarlyText:
      'Münbitlik çox vaxt tez, növbəti dövrdən etibarən qayıdır.',
    compareLateTitle: 'Sonrakı itki',
    compareLateText:
      'Tibbi komanda bir qədər daha uzun bərpa müddəti tövsiyə edə bilər.',
    body3:
      'Fiziki və emosional baxımdan özünüzü hazır hiss etmək hər hansı nəzəri müddətdən daha çox ən vacib bələdçi olaraq qalır.',
    readinessPoints: [
      {
        title: 'Emosional baxımdan',
        text: 'İçinizdə hazır hiss etmək fiziki bərpa qədər vacibdir.',
      },
      {
        title: 'Fiziki baxımdan',
        text: 'Müntəzəm dövr və rifah hissi yaxşı göstəricilərdir.',
      },
      {
        title: 'Cütlük olaraq və ya dəstəklə',
        text: 'Həyat yoldaşınızla bu barədə danışmaq eyni templə irəliləməyə kömək edə bilər.',
      },
    ],
    body4:
      'Yenidən cəhd etməzdən əvvəl tibbi qəbul daha çox arxayınlıqla irəliləməyə kömək edə bilər:',
    followUpSteps: [
      {
        title: 'Vəziyyəti qiymətləndirmək',
        text: 'Mütəxəssislə söhbət baş verənləri yenidən nəzərdən keçirməyə imkan verir.',
      },
      {
        title: 'Lazım gələrsə, müayinə',
        text: 'Vəziyyətdən asılı olaraq əlavə testlər təklif oluna bilər.',
      },
      {
        title: 'Yeni cəhd',
        text: 'Nəzarət qayğısı sonra yenidən cəhd edərkən sizi sakitcə dəstəkləyə bilər.',
      },
    ],
    tipTitle: 'Bilmək faydalıdır',
    tipText:
      'Tək düşük adətən münbitlik problemini göstərmir. Şəxsi suallarınıza cavab verməyə ən yaxşı tibbi komandanız qadirdir.',
    summaryPoints: [
      'Münbitlik adətən erkən düşükdən sonrakı dövrdən etibarən qayıdır.',
      'Bir çox mütəxəssis hesab edir ki, başqa cür məsləhət görülməyibsə, bir neçə dövr gözləməyə ehtiyac yoxdur.',
      'Fiziki və emosional baxımdan özünüzü hazır hiss etmək ən vacib bələdçi olaraq qalır.',
      'Tibbi nəzarət yenidən cəhd etməzdən əvvəl sizi dəstəkləyə və arxayın edə bilər.',
    ],
    disclaimerText:
      'Məlumat xarakterli məzmun. Bu məqalə fərdi tibbi məsləhəti əvəz etmir. Həkiminiz və ya mamanız vəziyyətiniz üçün istinad olaraq qalır.',
    shareMessage: 'İtkidən sonra münbitlik və yenidən cəhd — AWA',
  },
  ka: {
    badge: 'ორსულობის დაკარგვის შემდეგ • ფერტილობა',
    title: 'ფერტილობა და ხელახლა ცდა დაკარგვის შემდეგ',
    metaDuration: '6 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'საშუალო',
    metaValidated: 'საინფორმაციო შინაარსი',
    intro:
      'როდის და როგორ ვიფიქროთ ხელახლა ცდაზე, თქვენი ტემპით და სრული თავდაჯერებულობით.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'ფერტილობის დაბრუნება',
      'რას ამბობენ ზოგადად სპეციალისტები',
      'მზადყოფნის განცდა, თქვენი ტემპით',
      'მეთვალყურეობა, რომელსაც დაგამშვიდებთ',
      'მთავარი დასკვნები',
    ],
    body1:
      'ფერტილობა, როგორც წესი, ადრეული ორსულობის დაკარგვის შემდგომ ციკლშივე ბრუნდება. ოვულაცია შეიძლება მენსტრუაციის თვალსაჩინო დაბრუნებამდეც კი მოხდეს.',
    infoTitle: 'მთავარი დასკვნა',
    infoText:
      'დაკარგვის ეტაპის მიხედვით, ფიზიკური გამოჯანმრთელების დრო ერთი სიტუაციიდან მეორეზე მცირედ შეიძლება განსხვავდებოდეს.',
    body2:
      'ბევრი სპეციალისტი თვლის, რომ ხელახლა ცდამდე რამდენიმე ციკლის ლოდინი საჭირო არ არის, თუ თქვენი ექიმი ან ბებიაქალი სხვას არ გირჩევთ.',
    compareEarlyTitle: 'ადრეული დაკარგვა',
    compareEarlyText:
      'ფერტილობა ხშირად სწრაფად ბრუნდება, უკვე შემდეგ ციკლში.',
    compareLateTitle: 'უფრო გვიანდელი დაკარგვა',
    compareLateText:
      'სამედიცინო გუნდმა შეიძლება უფრო ხანგრძლივი გამოჯანმრთელების დრო გირჩიოთ.',
    body3:
      'მზადყოფნის განცდა, ფიზიკურად და ემოციურად, რჩება ყველაზე მნიშვნელოვან მეგზურად — ნებისმიერ თეორიულ ვადაზე ბევრად მეტად.',
    readinessPoints: [
      {
        title: 'ემოციურად',
        text: 'საკუთარ თავში მზადყოფნის განცდა ისეთივე მნიშვნელოვანია, როგორც ფიზიკური გამოჯანმრთელება.',
      },
      {
        title: 'ფიზიკურად',
        text: 'რეგულარული ციკლი და კარგი თვითგრძნობა კარგი ინდიკატორებია.',
      },
      {
        title: 'წყვილად ან მხარდაჭერით',
        text: 'პარტნიორთან ამ თემაზე საუბარმა შეიძლება დაგეხმაროთ ერთი ტემპით წინსვლაში.',
      },
    ],
    body4:
      'ხელახლა ცდამდე სამედიცინო ვიზიტმა შეიძლება დაგეხმაროთ უფრო მშვიდად წახვიდეთ წინ:',
    followUpSteps: [
      {
        title: 'ანგარიშის გასწორება',
        text: 'სპეციალისტთან საუბარი საშუალებას გაძლევთ დაუბრუნდეთ იმას, რაც მოხდა.',
      },
      {
        title: 'საჭიროების შემთხვევაში შეფასება',
        text: 'სიტუაციის მიხედვით, შეიძლება დამატებითი გამოკვლევები შემოგთავაზონ.',
      },
      {
        title: 'ახალი მცდელობა',
        text: 'შემდეგ მეთვალყურეობას შეუძლია მშვიდად დაგიჭიროთ მხარი ხელახლა ცდის დროს.',
      },
    ],
    tipTitle: 'კარგია ვიცოდეთ',
    tipText:
      'ერთჯერადი ორსულობის დაკარგვა, როგორც წესი, ფერტილობის პრობლემაზე არ მიუთითებს. თქვენი სამედიცინო გუნდი რჩება ყველაზე სათანადო თქვენს პირად კითხვებზე პასუხისთვის.',
    summaryPoints: [
      'ფერტილობა, როგორც წესი, ადრეული ორსულობის დაკარგვის შემდგომ ციკლშივე ბრუნდება.',
      'ბევრი სპეციალისტი თვლის, რომ რამდენიმე ციკლის ლოდინი საჭირო არ არის, თუ სხვა რჩევა არ გაქვთ.',
      'მზადყოფნის განცდა, ფიზიკურად და ემოციურად, რჩება ყველაზე მნიშვნელოვან მეგზურად.',
      'სამედიცინო მეთვალყურეობას შეუძლია ხელახლა ცდამდე მხარდაჭერა და დამშვიდება.',
    ],
    disclaimerText:
      'საინფორმაციო შინაარსი. ეს სტატია პერსონალიზებულ სამედიცინო რჩევას არ ანაცვლებს. თქვენი ექიმი ან ბებიაქალი რჩება თქვენი სიტუაციის საორიენტაციო წყაროდ.',
    shareMessage: 'ფერტილობა და ხელახლა ცდა დაკარგვის შემდეგ — AWA',
  },
  hy: {
    badge: 'ՎԻԺՈՒՄԻՑ ՀԵՏՈ • ՊՏՂԱԲԵՐՈՒԹՅՈՒՆ',
    title: 'Պտղաբերություն և նորից փորձելը կորստից հետո',
    metaDuration: '6 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Միջին',
    metaValidated: 'Տեղեկատվական բովանդակություն',
    intro:
      'Երբ և ինչպես մտածել նորից փորձելու մասին՝ ձեր տեմպով և լիակատար վստահությամբ:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Պտղաբերության վերադարձ',
      'Ինչ են սովորաբար ասում մասնագետները',
      'Պատրաստ զգալ՝ ձեր տեմպով',
      'Հետագա խնամք, որը կարող է հանգստացնել ձեզ',
      'Հիմնական եզրակացություններ',
    ],
    body1:
      'Պտղաբերությունը սովորաբար վերադառնում է վաղ վիժումից հետո արդեն հաջորդ ցիկլում: Ձվազատումը նույնիսկ կարող է տեղի ունենալ նախքան ձեր դաշտանի տեսանելի վերադարձը:',
    infoTitle: 'Հիմնական եզրակացություն',
    infoText:
      'Կորստի փուլից կախված՝ ֆիզիկական վերականգնման ժամանակը կարող է թեթևակի տարբերվել մի իրավիճակից մյուսը:',
    body2:
      'Շատ մասնագետներ համարում են, որ պետք չէ մի քանի ցիկլ սպասել նորից փորձելուց առաջ, եթե ձեր բժիշկը կամ մանկաբարձուհին այլ բան չի խորհուրդ տալիս:',
    compareEarlyTitle: 'Վաղ կորուստ',
    compareEarlyText:
      'Պտղաբերությունը հաճախ արագ է վերադառնում՝ արդեն հաջորդ ցիկլում:',
    compareLateTitle: 'Ավելի ուշ կորուստ',
    compareLateText:
      'Բժշկական թիմը կարող է խորհուրդ տալ մի փոքր ավելի երկար վերականգնման ժամանակ:',
    body3:
      'Պատրաստ զգալը, ֆիզիկապես և հուզականորեն, մնում է ամենակարևոր ուղեցույցը՝ շատ ավելի, քան ցանկացած տեսական ժամկետ:',
    readinessPoints: [
      {
        title: 'Հուզականորեն',
        text: 'Ներքուստ պատրաստ զգալը նույնքան կարևոր է, որքան ֆիզիկական վերականգնումը:',
      },
      {
        title: 'Ֆիզիկապես',
        text: 'Կանոնավոր ցիկլը և բարեկեցության զգացումը լավ ցուցանիշներ են:',
      },
      {
        title: 'Որպես զույգ կամ աջակցությամբ',
        text: 'Զուգընկերոջ հետ այդ մասին խոսելը կարող է օգնել առաջ շարժվել նույն տեմպով:',
      },
    ],
    body4:
      'Նորից փորձելուց առաջ բժշկական այցը կարող է օգնել առաջ շարժվել ավելի հանգիստ սրտով.',
    followUpSteps: [
      {
        title: 'Ամփոփում',
        text: 'Մասնագետի հետ զրույցը թույլ է տալիս վերադառնալ պատահածին:',
      },
      {
        title: 'Անհրաժեշտության դեպքում՝ հետազոտություն',
        text: 'Կախված իրավիճակից՝ կարող են առաջարկվել լրացուցիչ հետազոտություններ:',
      },
      {
        title: 'Նոր փորձ',
        text: 'Հետագա խնամքը կարող է այնուհետև հանգիստ աջակցել ձեզ՝ նորից փորձելիս:',
      },
    ],
    tipTitle: 'Լավ է իմանալ',
    tipText:
      'Մեկուսացված վիժումը սովորաբար պտղաբերության խնդիր չի նշանակում: Ձեր բժշկական թիմը մնում է լավագույն դիրքում՝ պատասխանելու ձեր անձնական հարցերին:',
    summaryPoints: [
      'Պտղաբերությունը սովորաբար վերադառնում է վաղ վիժումից հետո արդեն հաջորդ ցիկլում:',
      'Շատ մասնագետներ համարում են, որ պետք չէ մի քանի ցիկլ սպասել, եթե այլ բան չի խորհուրդ տրվում:',
      'Պատրաստ զգալը, ֆիզիկապես և հուզականորեն, մնում է ամենակարևոր ուղեցույցը:',
      'Բժշկական հսկողությունը կարող է աջակցել և հանգստացնել ձեզ՝ նորից փորձելուց առաջ:',
    ],
    disclaimerText:
      'Տեղեկատվական բովանդակություն: Այս հոդվածը չի փոխարինում անհատականացված բժշկական խորհրդատվությանը: Ձեր բժիշկը կամ մանկաբարձուհին մնում է հիմնական հղումը ձեր իրավիճակի համար:',
    shareMessage: 'Պտղաբերություն և նորից փորձելը կորստից հետո — AWA',
  },
  tg: {
    badge: 'ПАС АЗ ВИЖИШ • ҲОСИЛХЕЗӢ',
    title: 'Ҳосилхезӣ ва кӯшиши дубора пас аз талафот',
    metaDuration: '6 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Миёна',
    metaValidated: 'Мазмуни иттилоотӣ',
    intro:
      'Кай ва чӣ тавр дар бораи кӯшиши дубора фикр кардан лозим аст, бо суръати худ ва бо боварии комил.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Бозгашти ҳосилхезӣ',
      'Мутахассисон одатан чӣ мегӯянд',
      'Худро омода ҳис кардан, бо суръати худ',
      'Назорате, ки метавонад шуморо оромтар кунад',
      'Хулосаҳои асосӣ',
    ],
    body1:
      'Ҳосилхезӣ одатан аллакай дар давраи пас аз вижиши барвақт бармегардад. Овуляция ҳатто метавонад пеш аз он ки ҳайзи шумо ба таври намоён баргардад, рух диҳад.',
    infoTitle: 'Хулосаи асосӣ',
    infoText:
      'Вобаста ба марҳилаи талафот, вақти барқароршавии ҷисмонӣ метавонад аз як вазъият то вазъияти дигар андаке фарқ кунад.',
    body2:
      'Бисёр мутахассисон ҳисоб мекунанд, ки барои кӯшиши дубора интизор шудани якчанд давра лозим нест, магар ин ки табиб ё доя дигар тавсия диҳад.',
    compareEarlyTitle: 'Талафоти барвақт',
    compareEarlyText:
      'Ҳосилхезӣ аксар вақт зуд, аллакай дар давраи оянда бармегардад.',
    compareLateTitle: 'Талафоти дертар',
    compareLateText:
      'Вақти барқароршавии андаке дарозтарро гурӯҳи тиббӣ метавонад тавсия диҳад.',
    body3:
      'Худро омода ҳис кардан, ҷисмонӣ ва ҳиссӣ, муҳимтарин роҳнамо боқӣ мемонад — хеле бештар аз ҳар мӯҳлати назариявӣ.',
    readinessPoints: [
      {
        title: 'Аз ҷиҳати ҳиссӣ',
        text: 'Худро дар дохили худ омода ҳис кардан ба қадри барқароршавии ҷисмонӣ муҳим аст.',
      },
      {
        title: 'Аз ҷиҳати ҷисмонӣ',
        text: 'Давраи мунтазам ва эҳсоси некӯаҳволӣ нишондиҳандаҳои хубанд.',
      },
      {
        title: 'Ҳамчун ҷуфт ё бо дастгирӣ',
        text: 'Гап задан дар ин бора бо шарики худ метавонад ба шумо кумак кунад бо як суръат пеш равед.',
      },
    ],
    body4:
      'Пеш аз кӯшиши дубора қабули тиббӣ метавонад ба шумо кумак кунад бо оромии бештар пеш равед:',
    followUpSteps: [
      {
        title: 'Ҷамъбаст кардан',
        text: 'Сӯҳбат бо мутахассис имкон медиҳад он чиро, ки рух дод, аз нав баррасӣ кунед.',
      },
      {
        title: 'Арзёбӣ, агар лозим бошад',
        text: 'Вобаста ба вазъият, санҷишҳои иловагӣ метавонанд пешниҳод шаванд.',
      },
      {
        title: 'Кӯшиши нав',
        text: 'Назорат он гоҳ метавонад шуморо ҳангоми кӯшиши дубора оромона дастгирӣ кунад.',
      },
    ],
    tipTitle: 'Донистан хуб аст',
    tipText:
      'Вижиши ҷудогона одатан мушкили ҳосилхезиро нишон намедиҳад. Гурӯҳи тиббии шумо беҳтарин ҷойгоҳ барои посух ба саволҳои шахсии шумост.',
    summaryPoints: [
      'Ҳосилхезӣ одатан аллакай дар давраи пас аз вижиши барвақт бармегардад.',
      'Бисёр мутахассисон ҳисоб мекунанд, ки интизор шудани якчанд давра лозим нест, магар ин ки дигар тавсия дода шавад.',
      'Худро омода ҳис кардан, ҷисмонӣ ва ҳиссӣ, муҳимтарин роҳнамо боқӣ мемонад.',
      'Назорати тиббӣ метавонад пеш аз кӯшиши дубора шуморо дастгирӣ ва оромтар кунад.',
    ],
    disclaimerText:
      'Мазмуни иттилоотӣ. Ин мақола маслиҳати шахсии тиббиро иваз намекунад. Табиб ё доя барои вазъияти шумо манбаи асосӣ боқӣ мемонад.',
    shareMessage: 'Ҳосилхезӣ ва кӯшиши дубора пас аз талафот — AWA',
  },
  ky: {
    badge: 'КУРСАКТУУЛУК ҮЗҮЛГӨНДӨН КИЙИН • БОЙГО БҮТҮҮ ЖӨНДӨМДҮҮЛҮГҮ',
    title: 'Жоготуудан кийин бойго бүтүү жөндөмдүүлүгү жана кайра аракет кылуу',
    metaDuration: '6 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Орто',
    metaValidated: 'Маалымат берүүчү мазмун',
    intro:
      'Кайра аракет кылуу жөнүндө качан жана кантип ойлонуу керек, өз ылдамдыгыңызда жана толук ишеним менен.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Бойго бүтүү жөндөмдүүлүгүнүн кайтышы',
      'Адистер жалпысынан эмне дейт',
      'Өзүңүздү даяр сезүү, өз ылдамдыгыңызда',
      'Сизди тынчтандыра турган кийинки көзөмөл',
      'Негизги жыйынтыктар',
    ],
    body1:
      'Бойго бүтүү жөндөмдүүлүгү эрте курсактуулук үзүлгөндөн кийинки циклден эле адатта кайтат. Овуляция етек кирим көрүнүп кайтканга чейин эле болушу мүмкүн.',
    infoTitle: 'Негизги жыйынтык',
    infoText:
      'Жоготуунун этабына жараша физикалык калыбына келүү убактысы бир абалдан экинчисине бир аз айырмаланышы мүмкүн.',
    body2:
      'Көптөгөн адистер дарыгериңиз же акушеркаңыз башкача кеңеш бербесе, кайра аракет кылуудан мурун бир нече цикл күтүүнүн кереги жок деп эсептейт.',
    compareEarlyTitle: 'Эрте жоготуу',
    compareEarlyText:
      'Бойго бүтүү жөндөмдүүлүгү көбүнчө тез, кийинки циклден эле кайтат.',
    compareLateTitle: 'Кечирээки жоготуу',
    compareLateText:
      'Медициналык команда бир аз узунураак калыбына келүү убактысын сунуштай мүмкүн.',
    body3:
      'Физикалык жана эмоционалдык жактан даяр сезүү эң маанилүү жетекчи бойдон калат — ар кандай теориялык мөөнөттөн бир кыйла маанилүү.',
    readinessPoints: [
      {
        title: 'Эмоционалдык жактан',
        text: 'Өзүңүздүн ичиңизде даяр сезүү физикалык калыбына келүү сыяктуу эле маанилүү.',
      },
      {
        title: 'Физикалык жактан',
        text: 'Туруктуу цикл жана жыргалчылык сезими жакшы көрсөткүчтөр.',
      },
      {
        title: 'Жубайлар катары же колдоо менен',
        text: 'Жубайыңыз менен бул жөнүндө сүйлөшүү бир эле темпте алдыга жылууга жардам бериши мүмкүн.',
      },
    ],
    body4:
      'Кайра аракет кылуудан мурун медициналык кабыл алуу сизге тынчыраак алдыга жылууга жардам бериши мүмкүн:',
    followUpSteps: [
      {
        title: 'Жыйынтык чыгаруу',
        text: 'Адис менен сүйлөшүү болгондорду кайра карап чыгууга мүмкүндүк берет.',
      },
      {
        title: 'Керек болсо текшерүү',
        text: 'Абалга жараша кошумча анализдер сунушталышы мүмкүн.',
      },
      {
        title: 'Жаңы аракет',
        text: 'Кийинки көзөмөл андан кийин кайра аракет кылганыңызда сизди тынч колдой алат.',
      },
    ],
    tipTitle: 'Билүү пайдалуу',
    tipText:
      'Бир жолку курсактуулук үзүлүшү жалпысынан бойго бүтүү жөндөмдүүлүгүндө көйгөй бар дегенди билдирбейт. Жеке суроолоруңузга медициналык командаңыз эң жакшы жооп бере алат.',
    summaryPoints: [
      'Бойго бүтүү жөндөмдүүлүгү эрте курсактуулук үзүлгөндөн кийинки циклден эле адатта кайтат.',
      'Көптөгөн адистер башкача кеңеш берилбесе, бир нече цикл күтүүнүн кереги жок деп эсептейт.',
      'Физикалык жана эмоционалдык жактан даяр сезүү эң маанилүү жетекчи бойдон калат.',
      'Медициналык көзөмөл кайра аракет кылуудан мурун сизди колдоп, тынчтандыра алат.',
    ],
    disclaimerText:
      'Маалымат берүүчү мазмун. Бул макала жекелештирилген медициналык кеңешти алмаштырбайт. Абалыңыз үчүн дарыгериңиз же акушеркаңыз шилтеме бойдон калат.',
    shareMessage: 'Жоготуудан кийин бойго бүтүү жөндөмдүүлүгү жана кайра аракет кылуу — AWA',
  },
  tk: {
    badge: 'GÖWRELILIGIŇ ÝITIRILMEGINDEN SOŇ • GÖWRELI BOLMAK UKYBY',
    title: 'Ýitgiden soň göwreli bolmak ukyby we täzeden synanyşmak',
    metaDuration: '6 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Orta',
    metaValidated: 'Maglumat berýän mazmun',
    intro:
      'Täzeden synanyşmagy haçan we nähili pikir etmeli, öz ritmiňizde we doly ynam bilen.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Göwreli bolmak ukybynyň gaýdyp gelmegi',
      'Hünärmenleriň adatça näme diýýändigi',
      'Özüňi taýýar duýmak, öz ritmiňde',
      'Köňlüňizi rahatlandyryp biljek yzarlama',
      'Esasy netijeler',
    ],
    body1:
      'Göwreli bolmak ukyby adatça ir ýitgiden soňky sikldenem gaýdyp gelýär. Ovulýasiýa aýbaşyňyz aýdyň gaýdyp gelmänkä hem bolup biler.',
    infoTitle: 'Esasy netije',
    infoText:
      'Ýitgi tapgyryna baglylykda, fiziki dikeliş wagty ýagdaýdan ýagdaýa az-kem tapawutlanyp biler.',
    body2:
      'Köp hünärmen lukmanyňyz ýa-da akuşerkaňyz başgaça maslahat bermese, täzeden synanyşmazdan öň birnäçe sikl garaşmagyň zerurlygy ýok diýip hasaplaýar.',
    compareEarlyTitle: 'Ir ýitgi',
    compareEarlyText:
      'Göwreli bolmak ukyby köplenç çalt, indiki sikldenem gaýdyp gelýär.',
    compareLateTitle: 'Giçki ýitgi',
    compareLateText:
      'Lukmançylyk topary az-kem uzak dikeliş wagtyny maslahat berip biler.',
    body3:
      'Fiziki we duýgusal taýdan taýýar bolmak iň möhüm ugrukdyryjy bolup galýar — islendik nazary möhletden has köp.',
    readinessPoints: [
      {
        title: 'Duýgusal taýdan',
        text: 'Içiňizde taýýar bolmak fiziki dikeliş ýaly möhüm.',
      },
      {
        title: 'Fiziki taýdan',
        text: 'Yzygiderli sikl we abadançylyk duýgusy gowy görkezijiler.',
      },
      {
        title: 'Jübüt hökmünde ýa-da goldaw bilen',
        text: 'Hemrahyňyz bilen bu barada gürleşmek şol bir çaltlykda öňe gitmäge kömek edip biler.',
      },
    ],
    body4:
      'Täzeden synanyşmazdan öň, lukmançylyk kabul ediş has köp asudalyk bilen öňe gitmäge kömek edip biler:',
    followUpSteps: [
      {
        title: 'Ýagdaýy bahalamak',
        text: 'Hünärmen bilen söhbetdeşlik bolup geçeni täzeden gözden geçirmäge mümkinçilik berýär.',
      },
      {
        title: 'Zerur bolsa barlag',
        text: 'Ýagdaýa görä goşmaça synaglar teklip edilip bilner.',
      },
      {
        title: 'Täze synanyşyk',
        text: 'Yzarlama soňra täzeden synanyşanyňyzda asudalyk bilen size goldaw berip biler.',
      },
    ],
    tipTitle: 'Bilmek peýdaly',
    tipText:
      'Aýry ýitgi adatça göwreli bolmak ukybynyň kynçylygyny görkezmeýär. Lukmançylyk topary şahsy soraglaryňyza jogap bermek üçin iň gowy ýerleşen bolup galýar.',
    summaryPoints: [
      'Göwreli bolmak ukyby adatça ir ýitgiden soňky sikldenem gaýdyp gelýär.',
      'Köp hünärmen, başgaça maslahat berilmese, birnäçe sikl garaşmagyň zerurlygy ýok diýip hasaplaýar.',
      'Fiziki we duýgusal taýdan taýýar bolmak iň möhüm ugrukdyryjy bolup galýar.',
      'Lukmançylyk yzarlamasy täzeden synanyşmazdan öň size goldaw berip we köňlüňizi rahatlandyryp biler.',
    ],
    disclaimerText:
      'Maglumat berýän mazmun. Bu makala şahsylaşdyrylan lukmançylyk maslahatyny çalyşmaýar. Lukmanyňyz ýa-da akuşerkaňyz ýagdaýyňyz üçin esasy çeşme bolup galýar.',
    shareMessage: 'Ýitgiden soň göwreli bolmak ukyby we täzeden synanyşmak — AWA',
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
