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
  'zh-Hant': {
      badge: '流產之後 • 生育力',
      title: '失去寶寶之後的生育力與再次備孕',
      metaDuration: '閱讀約 6 分鐘',
      metaType: '指南',
      metaLevel: '進階',
      metaValidated: '科普內容',
      intro: '何時、如何考慮再次備孕，按自己的節奏，懷著信心。',
      contentsTitle: '本文內容',
      topics: [
        '生育力的恢復',
        '專業人員通常怎麼說',
        '按自己的節奏，感到準備好了',
        '能讓你安心的隨訪',
        '要點回顧',
      ],
      body1: '早期流產之後，生育力通常最早在下一個週期就會恢復。甚至在月經明顯恢復之前，就可能已經排卵。',
      infoTitle: '重點',
      infoText: '根據失去寶寶時所處的階段不同，身體恢復所需的時間可能會略有差異。',
      body2: '許多專業人員認為，不必等上好幾個週期再備孕，除非你的醫生或助產士另有建議。',
      compareEarlyTitle: '早期流產',
      compareEarlyText: '生育力往往恢復得很快，最早在下一個週期就會恢復。',
      compareLateTitle: '較晚期流產',
      compareLateText: '醫療團隊可能會建議稍長一些的恢復時間。',
      body3: '身體和情緒上都感到準備好了，始終是最重要的指引，遠比任何理論上的時間表更重要。',
      readinessPoints: [
        {
          title: '情緒上',
          text: '內心感到準備好了，和身體恢復同樣重要。',
        },
        {
          title: '身體上',
          text: '月經週期規律、身體狀態良好，都是不錯的參考。',
        },
        {
          title: '與伴侶或身邊的人一起',
          text: '和伴侶聊一聊，有助於你們以同樣的步調往前走。',
        },
      ],
      body4: '再次備孕之前，去醫院就診一次，可以讓你更安心地向前走：',
      followUpSteps: [
        {
          title: '回顧梳理',
          text: '和專業人員聊一聊，可以重新回顧所發生的事。',
        },
        {
          title: '必要時做評估',
          text: '視情況，可能會建議做一些進一步的檢查。',
        },
        {
          title: '再次嘗試',
          text: '之後，隨訪可以在你再次備孕時從容地陪伴你。',
        },
      ],
      tipTitle: '小提醒',
      tipText: '單次流產通常並不說明存在生育力方面的問題。關於你個人的疑問，醫療團隊始終是最合適的解答者。',
      summaryPoints: [
        '早期流產之後，生育力通常最早在下一個週期就會恢復。',
        '許多專業人員認為，不必等上好幾個週期，除非另有建議。',
        '身體和情緒上都感到準備好了，始終是最重要的指引。',
        '醫學隨訪可以在你再次備孕之前支援並安撫你。',
      ],
      disclaimerText: '科普內容。本文不能替代個性化的醫療建議。你的醫生或助產士始終是瞭解你具體情況的參考。',
      shareMessage: '失去寶寶之後的生育力與再次備孕 — AWA',
    },
  ar: {
    badge: 'بعد الإجهاض • الخصوبة',
    title: 'الخصوبة ومحاولة الحمل مجددًا بعد فقدان الحمل',
    metaDuration: 'قراءة في 6 دقائق',
    metaType: 'دليل',
    metaLevel: 'متوسط',
    metaValidated: 'محتوى للاطلاع',
    intro:
      'متى وكيف تفكرين في محاولة الحمل مجددًا، بوتيرتك الخاصة وبكل ثقة.',
    contentsTitle: 'في هذا المقال',
    topics: [
      'عودة الخصوبة',
      'ما يقوله المختصون عمومًا',
      'الشعور بالاستعداد، بوتيرتك الخاصة',
      'متابعة قد تطمئنك',
      'أهم النقاط',
    ],
    body1:
      'تعود الخصوبة عادةً منذ الدورة التي تلي الإجهاض المبكر. بل قد تحدث الإباضة قبل أن يعود الحيض بشكل ظاهر.',
    infoTitle: 'أهم ما يجب معرفته',
    infoText:
      'بحسب مرحلة الفقدان، قد تختلف مدة التعافي الجسدي قليلًا من حالة إلى أخرى.',
    body2:
      'يرى كثير من المختصين أنه لا داعي لانتظار عدة دورات قبل المحاولة مجددًا، ما لم يوصِ طبيبك أو قابلتك بغير ذلك.',
    compareEarlyTitle: 'فقدان مبكر',
    compareEarlyText:
      'تعود الخصوبة غالبًا بسرعة، منذ الدورة التالية.',
    compareLateTitle: 'فقدان متأخر',
    compareLateText:
      'قد يوصي الفريق الطبي بمدة تعافٍ أطول قليلًا.',
    body3:
      'يبقى الشعور بالاستعداد، جسديًا وعاطفيًا، أهم دليل — أكثر بكثير من أي مدة نظرية.',
    readinessPoints: [
      {
        title: 'عاطفيًا',
        text: 'الشعور بالاستعداد في داخلك يهمّ بقدر التعافي الجسدي.',
      },
      {
        title: 'جسديًا',
        text: 'الدورة المنتظمة والشعور بالعافية مؤشران جيدان.',
      },
      {
        title: 'كزوجين أو بالدعم',
        text: 'الحديث مع شريكك قد يساعدكما على التقدّم بالوتيرة نفسها.',
      },
    ],
    body4:
      'قبل المحاولة مجددًا، قد يساعدك موعد طبي على المضي بقدر أكبر من الطمأنينة:',
    followUpSteps: [
      {
        title: 'تقييم الوضع',
        text: 'تتيح لك المحادثة مع مختص مراجعة ما حدث.',
      },
      {
        title: 'فحوصات عند الحاجة',
        text: 'بحسب الحالة، قد تُقترح فحوصات إضافية.',
      },
      {
        title: 'محاولة جديدة',
        text: 'يمكن للمتابعة بعد ذلك أن ترافقك بهدوء أثناء المحاولة مجددًا.',
      },
    ],
    tipTitle: 'من المفيد أن تعرفي',
    tipText:
      'الإجهاض المعزول لا يدل عمومًا على مشكلة في الخصوبة. ويبقى فريقك الطبي أقدر على الإجابة عن أسئلتك الشخصية.',
    summaryPoints: [
      'تعود الخصوبة عادةً منذ الدورة التي تلي الإجهاض المبكر.',
      'يرى كثير من المختصين أنه لا داعي لانتظار عدة دورات، ما لم يُنصح بغير ذلك.',
      'يبقى الشعور بالاستعداد، جسديًا وعاطفيًا، أهم دليل.',
      'يمكن للمتابعة الطبية أن تدعمك وتطمئنك قبل المحاولة مجددًا.',
    ],
    disclaimerText:
      'محتوى للاطلاع. لا يغني هذا المقال عن مشورة طبية مخصّصة. ويبقى طبيبك أو قابلتك المرجع لحالتك.',
    shareMessage: 'الخصوبة ومحاولة الحمل مجددًا بعد فقدان الحمل — AWA',
  },
  kab: {
    badge: 'DEFFIR TUQQNA N TIGZI • TAYERZA',
    title: 'Tayerza d usnulfu n usmekti mbeɛd tuqqna',
    metaDuration: '6 n tesdidin n tɣuri',
    metaType: 'Amusnaw',
    metaLevel: 'Amzun',
    metaValidated: 'Agbur n isallen',
    intro:
      'Melmi d amek ara tettxemmimeḍ ad d-tɛawdeḍ, s lḥal-ik u s ttkal ummid.',
    contentsTitle: 'Deg umagrad-a',
    topics: [
      'Tuɣalin n tyerza',
      'D acu i d-qqarent s wudem amatu imusnawen',
      'Ma tḥessseḍ iman-ik yeheyya, s lḥal-ik',
      'Adfar ara k-yessetṭamnen',
      'Ayen ilaqen ad tettɛassed',
    ],
    body1:
      'Tayerza tettuɣal s wudem amatu seg uzray i d-yetteddun mbeɛd tuqqna tamezwarut n tigzi. Ovulation tezmer ad tt-ḍru uqbel ad d-yuɣal lḥiḍ-ik s wudem ibanen.',
    infoTitle: 'Ayen yesɛan azal',
    infoText:
      'Almend n uswir n tuqqna, akud n usirem n tfelwit izmer ad yemgarad cwiṭ seg yiwet n tmeslayt ɣer tayeḍ.',
    body2:
      'Aṭas n yimusnawen ttwalin belli ulac ilaq ad tṛaǧuḍ aṭas n yizray uqbel ad tɛerḍeḍ i tikkelt-nniḍen, ala ma yella ṭṭbib neɣ tamaɣart n tezmert yeqqar-ak-d akken ur tellim.',
    compareEarlyTitle: 'Tuqqna tamezwarut',
    compareEarlyText:
      'Tayerza ttuɣal s tazzla, seg uzray i d-yetteddun.',
    compareLateTitle: 'Tuqqna i d-yettbanen mbeɛd',
    compareLateText:
      'Akud ɣezzifen cwiṭ n usirem izmer ad yettwaqbel sɣur tarbaɛt n tezmert.',
    body3:
      'Aḥsas yeheyya, deg ugris d wul, yeqqim d ubrid ameqqran akk — ugar n yal akud n tidet.',
    readinessPoints: [
      {
        title: 'S wul',
        text: 'Aḥsas yeheyya deg wul-ik yesɛa azal am usirem n ugris.',
      },
      {
        title: 'S ugris',
        text: 'Azray amagnu d lḥal n lehna d icerṭen yelhan.',
      },
      {
        title: 'D tayeḍ neɣ s uɛawen',
        text: 'Tameslayt d umdan-ik tezmer ad k-yeɛawen ad tkemmleḍ s uɣbel yiwen.',
      },
    ],
    body4:
      'Uqbel ad tɛawdeḍ, asmekti n tezmert izmer ad k-yeɛawen ad tkemmleḍ s lehna ugar:',
    followUpSteps: [
      {
        title: 'Tamuɣli tummidt',
        text: 'Tameslayt d umusnaw tezmer ad k-teǧǧ ad tuɣaleḍ ɣer wayen yeḍran.',
      },
      {
        title: 'Asenqed ma ilaq',
        text: 'Almend n waddad, zemrent ad d-ttwaqeblent isenqden-nniḍen.',
      },
      {
        title: 'Tarmit tamaynut',
        text: 'Adfar izmer ad k-yeɛawen s lehna deg usmekti-ik amaynut.',
      },
    ],
    tipTitle: 'Yelha ad teɛlmeḍ',
    tipText:
      'Tuqqna yiwet kan s wudem amatu ur tebbi ara ugur n tyerza. Tarbaɛt-ik n tezmert tettqim d tin yelhan akk i teglen isteqsiyen-ik udmawanen.',
    summaryPoints: [
      'Tayerza tettuɣal s wudem amatu seg uzray i d-yetteddun mbeɛd tuqqna tamezwarut n tigzi.',
      'Aṭas n yimusnawen ttwalin belli ulac ilaq ad tṛaǧuḍ aṭas n yizray, ala ma yella tettwaqqar-ak akken ur tellim.',
      'Aḥsas yeheyya, deg ugris d wul, yeqqim d ubrid ameqqran akk.',
      'Adfar n tezmert izmer ad k-yeɛawen u ad k-yessetṭamen uqbel ad tɛawdeḍ.',
    ],
    disclaimerText:
      'Agbur n isallen. Amagrad-a ur yettnefsu ara amusnaw n tezmert i yiman-ik. Ṭṭbib-ik neɣ tamaɣart n tezmert qqimen d tamawt i waddad-ik.',
    shareMessage: 'Tayerza d usnulfu n usmekti mbeɛd tuqqna — AWA',
  },
  om: {
    badge: 'DHALUU BOODA • DHALUU',
    title: 'Dandeettii da\'uu fi deebi\'ee yaaluu erga dhabamsiisee booda',
    metaDuration: 'Daqiiqaa 6 dubbisuu',
    metaType: 'Qajeelfama',
    metaLevel: 'Giddugaleessa',
    metaValidated: 'Qabiyyee odeeffannoo',
    intro:
      'Yoom fi akkamitti deebi\'ee yaaluu yaaduu, saffisa kee mataa keetiin fi amantaa guutuun.',
    contentsTitle: 'Barruu kana keessatti',
    topics: [
      'Deebi\'uu dandeettii da\'uu',
      'Ogeeyyiin yeroo baay\'ee maal jedhu',
      'Saffisa kee mataa keetiin qophaa\'uu',
      'Hordoffii si tasgabbeessuu danda\'u',
      'Qabxiilee ijoo',
    ],
    body1:
      'Dandeettii da\'uu yeroo baay\'ee marsaa dhabamsiisuu jalqabaa itti aanu keessatti deebi\'a. Ovulation laguun kee ifatti osoo hin deebi\'in dura illee ta\'uu danda\'a.',
    infoTitle: 'Qabxii ijoo',
    infoText:
      'Sadarkaa dhabamsiisuu irratti hundaa\'uun, yeroon deebi\'ee fayyuu qaamaa haala irraa gara haalaatti xiqqoo garaagara ta\'uu danda\'a.',
    body2:
      'Ogeeyyiin baay\'een deebi\'ee yaaluu dura marsaa baay\'ee eegu hin barbaachisu jedhanii yaadu, doktora kee ykn ogeessi dhalaa kan biraa yoo gorse malee.',
    compareEarlyTitle: 'Dhabamsiisuu jalqabaa',
    compareEarlyText:
      'Dandeettii da\'uu yeroo baay\'ee dafee deebi\'a, marsaa itti aanu irraa eegalee.',
    compareLateTitle: 'Dhabamsiisuu booda',
    compareLateText:
      'Gareen yaalaa yeroo deebi\'ee fayyuu xiqqoo dheeraa gorsuu danda\'a.',
    body3:
      'Qophaa\'uu, qaamaan fi miiraan, qajeelfama caalaa barbaachisaa ta\'ee hafa — yeroo yaadaa kamiyyuu caalaa.',
    readinessPoints: [
      {
        title: 'Miiraan',
        text: 'Of keessatti qophaa\'uu deebi\'ee fayyuu qaamaa dandeettii wal fakkaatu qaba.',
      },
      {
        title: 'Qaamaan',
        text: 'Marsaa sirrii fi miira gaarummaa agarsiistoota gaarii dha.',
      },
      {
        title: 'Akka dhiirsaa fi niitiitti ykn deggersa waliin',
        text: 'Hiriyaa kee wajjin haasa\'uun saffisa wal fakkaatuun fuulduratti deemuuf si gargaara.',
      },
    ],
    body4:
      'Deebi\'ee yaaluu dura, beellamni yaalaa nageenya guddaa waliin fuulduratti deemuuf si gargaaruu danda\'a:',
    followUpSteps: [
      {
        title: 'Haala madaaluu',
        text: 'Mariin ogeessa wajjin waan ta\'e deebi\'ee ilaaluuf si dandeessisa.',
      },
      {
        title: 'Qorannoo yoo barbaachise',
        text: 'Haala irratti hundaa\'uun, qorannoowwan dabalataa dhiyaachuu danda\'u.',
      },
      {
        title: 'Yaalii haaraa',
        text: 'Hordoffiin booda tasgabbiin deebi\'ee yaaluu kee irratti si deggeruu danda\'a.',
      },
    ],
    tipTitle: 'Beekuun gaarii dha',
    tipText:
      'Dhabamsiisni tokko qofa yeroo baay\'ee rakkoo dandeettii da\'uu hin agarsiisu. Gareen yaalaa kee gaaffilee dhuunfaa kee deebisuuf iddoo gaarii irra jira.',
    summaryPoints: [
      'Dandeettii da\'uu yeroo baay\'ee marsaa dhabamsiisuu jalqabaa itti aanu keessatti deebi\'a.',
      'Ogeeyyiin baay\'een marsaa baay\'ee eegu hin barbaachisu jedhanii yaadu, yoo kan biraa hin gorsamne.',
      'Qophaa\'uu, qaamaan fi miiraan, qajeelfama caalaa barbaachisaa ta\'ee hafa.',
      'Hordoffiin yaalaa deebi\'ee yaaluu dura si deggeruu fi si tasgabbeessuu danda\'a.',
    ],
    disclaimerText:
      'Qabiyyee odeeffannoo. Barruun kun gorsa fayyaa dhuunfaa bakka hin bu\'u. Doktora kee ykn ogeessi dhalaa haala keetiif madda ta\'ee hafa.',
    shareMessage: 'Dandeettii da\'uu fi deebi\'ee yaaluu erga dhabamsiisee booda — AWA',
  },
  ti: {
    badge: 'ድሕሪ ምጥንፋእ • ፍርያም',
    title: 'ድሕሪ ምጥፋእ ጥንስቲ ፍርያምን ዳግም ምፍታንን',
    metaDuration: '6 ደቒቕ ንባብ',
    metaType: 'መምርሒ',
    metaLevel: 'ማእከላይ',
    metaValidated: 'ሓበሬታዊ ትሕዝቶ',
    intro:
      'ዳግም ንምፍታን መዓስን ከመይን ምሕሳብ፡ ብናይ ባዕልኺ ፍጥነትን ምሉእ ምትእምማንን።',
    contentsTitle: 'ኣብዚ ጽሑፍ',
    topics: [
      'ምምላስ ፍርያም',
      'ሰራሕተኛታት ብሓፈሻ እንታይ ይብሉ',
      'ዝተዳለኻ ምስምዓይ፡ ብናይ ባዕልኺ ፍጥነት',
      'ዘጸናንዓኪ ክትትል',
      'ቀንዲ ነጥብታት',
    ],
    body1:
      'ፍርያም ድሕሪ ቀደም ምጥፋእ ጥንስቲ ብዝቕጽል ዑደት ብዙሓት ግዜ ይምለስ። ኦቭዩሌሽን ወርሓዊ ደምኪ ብግልጺ ከይተመልሰ እውን ክኸውን ይኽእል።',
    infoTitle: 'ቀንዲ ነጥቢ',
    infoText:
      'ከከም ደረጃ ምጥፋእ፡ ናይ ኣካል ምሕዋይ ግዜ ካብ ሓደ ኩነታት ናብ ካልእ ቁሩብ ክፍለ ይኽእል።',
    body2:
      'ብዙሓት ሰራሕተኛታት ዶክተርኪ ወይ ሚድዋይፍ ካልእ እንተ ዘይመኸሩ፡ ዳግም ቅድሚ ምፍታን ብዙሓት ዑደታት ምጽባይ ኣየድልን ይብሉ።',
    compareEarlyTitle: 'ቀዳማይ ምጥፋእ',
    compareEarlyText:
      'ፍርያም ብዙሓት ግዜ ቀልጢፉ፡ ካብ ዝቕጽል ዑደት ጀሚሩ ይምለስ።',
    compareLateTitle: 'ደሓር ምጥፋእ',
    compareLateText:
      'ሕክምናዊ ጉጅለ ቁሩብ ነዊሕ ናይ ምሕዋይ ግዜ ክመኽር ይኽእል።',
    body3:
      'ብኣካልን ብስምዒትን ምድላው ምስምዓይ፡ ካብ ዝኾነ ቴዎሪያዊ ግዜ ኣዝዩ ንላዕሊ፡ ዝያዳ ኣገዳሲ መምርሒ ይቕጽል።',
    readinessPoints: [
      {
        title: 'ብስምዒት',
        text: 'ኣብ ውሽጥኺ ምድላው ምስምዓይ ከም ኣካላዊ ምሕዋይ ማዕረ ኣገዳሲ እዩ።',
      },
      {
        title: 'ብኣካል',
        text: 'ዝማዕሩ ዑደትን ደሓን ምስምዓይን ጽቡቓት ሕብሪ እዮም።',
      },
      {
        title: 'ከም ጽምዲ ወይ ምስ ድጋፍ',
        text: 'ምስ መቕርብኺ ብዛዕባኡ ምዝራብ ብሓደ ፍጥነት ንቕድሚት ንምኻድ ይሕግዝ።',
      },
    ],
    body4:
      'ዳግም ቅድሚ ምፍታን፡ ሕክምናዊ ቆጸራ ብዝያዳ ሰላም ንቕድሚት ንምኻድ ክሕግዝ ይኽእል፡',
    followUpSteps: [
      {
        title: 'ምግምጋም',
        text: 'ምስ ሰራሕተኛ ዝግበር ዝርርብ ነቲ ዝኸደ ዳግም ንምርኣይ የኽእል።',
      },
      {
        title: 'እንተ ኣድልዩ ግምገማ',
        text: 'ከከም ኩነታት ተወሳኺ ምርመራታት ክቐርቡ ይኽእሉ።',
      },
      {
        title: 'ሓድሽ ፈተነ',
        text: 'ድሕሪኡ ክትትል ዳግም ኣብ ምፍታን ብሰላም ክድግፈኪ ይኽእል።',
      },
    ],
    tipTitle: 'ከተፍልጥዮ ዘለካ',
    tipText:
      'ዝተነጸለ ምጥፋእ ጥንስቲ ብሓፈሻ ጸገም ፍርያም ኣይሕብርን። ሕክምናዊ ጉጅለኺ ንውልቃዊ ሕቶታትኪ ንምምላስ ዝበለጸ ቦታ ኣለዎ።',
    summaryPoints: [
      'ፍርያም ድሕሪ ቀደም ምጥፋእ ጥንስቲ ብዝቕጽል ዑደት ብዙሓት ግዜ ይምለስ።',
      'ብዙሓት ሰራሕተኛታት ካልእ እንተ ዘይተመኸረ ብዙሓት ዑደታት ምጽባይ ኣየድልን ይብሉ።',
      'ብኣካልን ብስምዒትን ምድላው ምስምዓይ ዝያዳ ኣገዳሲ መምርሒ ይቕጽል።',
      'ሕክምናዊ ክትትል ዳግም ቅድሚ ምፍታን ክድግፈኪን የጸናንዓኪን ይኽእል።',
    ],
    disclaimerText:
      'ሓበሬታዊ ትሕዝቶ። እዚ ጽሑፍ ውልቃዊ ሕክምናዊ ምኽሪ ኣይትካእልን። ዶክተርኪ ወይ ሚድዋይፍ ንኩነትኪ መወከሲ ይቕጽል።',
    shareMessage: 'ድሕሪ ምጥፋእ ጥንስቲ ፍርያምን ዳግም ምፍታንን — AWA',
  },
  rw: {
    badge: 'NYUMA YO GUTWITA INDA ISENYUKA • UBUREREKE',
    title: 'Uburereke no kongera kugerageza nyuma yo gutakaza inda',
    metaDuration: 'Gusoma: iminota 6',
    metaType: 'Ubuyobozi',
    metaLevel: 'Hagati',
    metaValidated: 'Ibikubiyemo by\'amakuru',
    intro:
      'Igihe n\'uburyo bwo gutekereza ku kongera kugerageza, ku muvuduko wawe kandi ufite icyizere cyuzuye.',
    contentsTitle: 'Muri iyi nkuru',
    topics: [
      'Kugaruka kw\'uburereke',
      'Icyo abahanga bakunze kuvuga',
      'Kumva witeguye, ku muvuduko wawe',
      'Ukurikiranwa ushobora kugutuza',
      'Iby\'ingenzi byo kwibuka',
    ],
    body1:
      'Uburereke bukunze kugaruka kuva ku ruhererekane rukurikira gutakaza inda hakiri kare. Ovulation ishobora no kubaho mbere y\'uko imihango yawe igaragara.',
    infoTitle: 'Icyingenzi cyo kwibuka',
    infoText:
      'Bitewe n\'icyiciro inda yatakariyemo, igihe cyo gukira mu buryo bw\'umubiri gishobora gutandukana gato hagati y\'imiterere imwe n\'indi.',
    body2:
      'Abahanga benshi bemeza ko nta mpamvu yo gutegereza ibyiciro by\'uruhererekane byinshi mbere yo kongera kugerageza, keretse muganga wawe cyangwa umubyaza akugiriye inama zinyuranye.',
    compareEarlyTitle: 'Gutakaza inda hakiri kare',
    compareEarlyText:
      'Uburereke akenshi bugaruka vuba, kuva ku ruhererekane rukurikira.',
    compareLateTitle: 'Gutakaza inda nyuma',
    compareLateText:
      'Itsinda ry\'abaganga rishobora kugusaba igihe kirekire gato cyo gukira.',
    body3:
      'Kumva witeguye, mu buryo bw\'umubiri n\'amarangamutima, bikomeza kuba ikiyobora cy\'ingenzi — kurusha igihe icyo ari cyo cyose cya gihanga.',
    readinessPoints: [
      {
        title: 'Mu marangamutima',
        text: 'Kumva witeguye imbere muri wowe bifite akamaro nk\'ak\'gukira mu buryo bw\'umubiri.',
      },
      {
        title: 'Mu buryo bw\'umubiri',
        text: 'Uruhererekane ruhoraho no kumva umeze neza ni ibimenyetso byiza.',
      },
      {
        title: 'Nk\'abashakanye cyangwa ufite inkunga',
        text: 'Kubiganiraho n\'uwo mubana bishobora kugufasha gukomeza ku muvuduko umwe.',
      },
    ],
    body4:
      'Mbere yo kongera kugerageza, gahunda yo kubonana na muganga ishobora kugufasha gukomeza ufite amahoro menshi:',
    followUpSteps: [
      {
        title: 'Gusuzuma uko bimeze',
        text: 'Ikiganiro n\'umuhanga kigufasha gusubiramo ibyabaye.',
      },
      {
        title: 'Isuzuma niba bikenewe',
        text: 'Bitewe n\'imiterere, hashobora gutangwa ibindi bizamini.',
      },
      {
        title: 'Kongera kugerageza',
        text: 'Ukurikiranwa ashobora gukomeza kugushyigikira utuje mu kongera kugerageza.',
      },
    ],
    tipTitle: 'Byiza kumenya',
    tipText:
      'Gutakaza inda rimwe gusa muri rusange ntibigaragaza ikibazo cy\'uburereke. Itsinda ry\'abaganga bawe ni ryo rishobora gusubiza neza ibibazo byawe bwite.',
    summaryPoints: [
      'Uburereke bukunze kugaruka kuva ku ruhererekane rukurikira gutakaza inda hakiri kare.',
      'Abahanga benshi bemeza ko nta mpamvu yo gutegereza ibyiciro by\'uruhererekane byinshi, keretse hatanzwe izindi nama.',
      'Kumva witeguye, mu buryo bw\'umubiri n\'amarangamutima, bikomeza kuba ikiyobora cy\'ingenzi.',
      'Ukurikiranwa n\'abaganga ashobora kugushyigikira no kugutuza mbere yo kongera kugerageza.',
    ],
    disclaimerText:
      'Ibikubiyemo by\'amakuru. Iyi nkuru ntisimbura inama z\'ubuvuzi zihariye. Muganga wawe cyangwa umubyaza akomeza kuba ishingiro ry\'imiterere yawe.',
    shareMessage: 'Uburereke no kongera kugerageza nyuma yo gutakaza inda — AWA',
  },
  rn: {
    badge: 'NYUMA Y\'INDA YAKUWEMWO • UBUBYAZI',
    title: 'Ububyazi no kugerageza kandi nyuma y\'igihombo',
    metaDuration: 'Iminota 6 yo gusoma',
    metaType: 'Ubuyobozi',
    metaLevel: 'Hagati',
    metaValidated: 'Ibikubiyemwo vyo kumenyesha',
    intro:
      'Igihe n\'uburyo bwo gutekereza ku kugerageza kandi, ku muvuduko wawe n\'ufise icizere cuzuye.',
    contentsTitle: 'Muri iyi ngingo',
    topics: [
      'Isubira ry\'ububyazi',
      'Ivyo abahinga bavuga muri rusangi',
      'Kumva witeguye, ku muvuduko wawe',
      'Gukurikiranwa gushobora kugarurira amahoro',
      'Ivyingenzi vyo kwibuka',
    ],
    body1:
      'Ububyazi busanzwe busubira hakiri kare nko mu ruziga rukurikira inda yakuwemwo hakiri kare. Ovulation irashobora no kuba imihango yawe itaragaragara.',
    infoTitle: 'Icingenzi co kwibuka',
    infoText:
      'Bitewe n\'igice c\'igihombo, igihe co koroherwa mu mubiri gishobora gutandukana gatoyi hagati y\'ikibazo n\'ikindi.',
    body2:
      'Abahinga benshi bafata ko nta mpamvu yo gutegereza inzira zitari nke imbere yo kugerageza kandi, keretse umuganga wawe canke umubyaza akugiriye inama itandukanye.',
    compareEarlyTitle: 'Igihombo co hakiri kare',
    compareEarlyText:
      'Ububyazi kenshi busubira vuba, nko mu ruziga rukurikira.',
    compareLateTitle: 'Igihombo c\'inyuma',
    compareLateText:
      'Igihe kirushiriza kuba kirekire co koroherwa gishobora gusabwa n\'ikipe y\'ubuvuzi.',
    body3:
      'Kumva witeguye, mu mubiri no mu marangamutima, bigumya kuba icerekezo gikuru — kuruta igihe cose co mu nyigisho.',
    readinessPoints: [
      {
        title: 'Mu marangamutima',
        text: 'Kumva witeguye muri wewe ubwawe ni ngombwa nka kumwe no koroherwa kw\'umubiri.',
      },
      {
        title: 'Mu mubiri',
        text: 'Uruziga rusanzwe n\'ukumva umerewe neza ni ibimenyetso vyiza.',
      },
      {
        title: 'Nk\'abubatse canke hamwe n\'ugushigikirwa',
        text: 'Kuvugana n\'uwo muri kumwe bishobora kugufasha gutera imbere ku muvuduko umwe.',
      },
    ],
    body4:
      'Imbere yo kugerageza kandi, kubonana na muganga bishobora kugufasha gutera imbere ufise amahoro menshi:',
    followUpSteps: [
      {
        title: 'Gusuzuma uko bimeze',
        text: 'Ikiganiro n\'umuhinga kigufasha gusubira ku vyabaye.',
      },
      {
        title: 'Isuzuma nimba bikenewe',
        text: 'Bitewe n\'ukuntu bimeze, ibindi bizamini bishobora gutangwa.',
      },
      {
        title: 'Igerageza rishasha',
        text: 'Gukurikiranwa noneho kurashobora kugushigikira utuje ukigerageza kandi.',
      },
    ],
    tipTitle: 'Ni vyiza kubimenya',
    tipText:
      'Inda imwe yakuwemwo isanzwe itavuga ikibazo c\'ububyazi. Ikipe yawe y\'ubuvuzi igumya kuba yo ibereye cane gusubiza ibibazo vyawe bwite.',
    summaryPoints: [
      'Ububyazi busanzwe busubira hakiri kare nko mu ruziga rukurikira inda yakuwemwo hakiri kare.',
      'Abahinga benshi bafata ko nta mpamvu yo gutegereza inzira zitari nke, keretse bagiriwe inama itandukanye.',
      'Kumva witeguye, mu mubiri no mu marangamutima, bigumya kuba icerekezo gikuru.',
      'Gukurikiranwa n\'ubuvuzi bishobora kugushigikira no kugarurira amahoro imbere yo kugerageza kandi.',
    ],
    disclaimerText:
      'Ibikubiyemwo vyo kumenyesha. Iyi ngingo ntisubira inama z\'ubuvuzi zihariye. Umuganga wawe canke umubyaza agumya kuba icerekezo c\'ukuntu uri.',
    shareMessage: 'Ububyazi no kugerageza kandi nyuma y\'igihombo — AWA',
  },
  ig: {
    badge: 'MGBE ỌPỤPỤ IME • ỌMỤMỤ',
    title: 'Ọmụmụ na ịnwale ọzọ mgbe mfu',
    metaDuration: 'Nkeji 6 ọgụgụ',
    metaType: 'Nduzi',
    metaLevel: 'Ọkwa etiti',
    metaValidated: 'Ọdịnaya ozi',
    intro:
      'Mgbe na etu ị ga-esi tụlee ịnwale ọzọ, n\'ọsọ nke gị na n\'obi ike zuru oke.',
    contentsTitle: 'N\'isiokwu a',
    topics: [
      'Ọlọghachi nke ọmụmụ',
      'Ihe ndị ọkachamara na-ekwukarị',
      'Inwe mmetụta na ị dịla njikere, n\'ọsọ nke gị',
      'Nlekọta nwere ike iche obi sie gị ike',
      'Isi ihe ndị ị ga-eburu',
    ],
    body1:
      'Ọmụmụ na-alọghachikarị ngwa ngwa dị ka usoro nsọ na-esote ọpụpụ ime n\'oge mbụ. Ovulation nwere ike ime tupu nsọ gị alọghachi n\'ụzọ a na-ahụ anya.',
    infoTitle: 'Isi ihe ịcheta',
    infoText:
      'Dabere n\'ọkwa mfu ahụ, oge ịgbake anụ ahụ nwere ike ịdịgasị obere site n\'ọnọdụ ruo ọnọdụ.',
    body2:
      'Ọtụtụ ndị ọkachamara na-ewere na ọ dịghị mkpa ichere ọtụtụ usoro nsọ tupu ịnwale ọzọ, ọ bụrụ na dọkịta ma ọ bụ onye na-agba nne ọrụ adụọla ọdụ ọzọ.',
    compareEarlyTitle: 'Mfu n\'oge mbụ',
    compareEarlyText:
      'Ọmụmụ na-alọghachikarị ngwa ngwa, ọbụna n\'usoro nsọ na-esote.',
    compareLateTitle: 'Mfu n\'oge dị ogologo',
    compareLateText:
      'Otu ndị ahụike nwere ike ịtụ aro oge ịgbake dị ogologo ntakịrị.',
    body3:
      'Inwe mmetụta na ị dịla njikere, n\'anụ ahụ na n\'mmụọ, ka bụ nduzi kacha mkpa — karịa oge ọ bụla e kwuru n\'echiche.',
    readinessPoints: [
      {
        title: 'N\'mmụọ',
        text: 'Inwe mmetụta na ị dịla njikere n\'ime onwe gị dị mkpa dị ka ịgbake anụ ahụ.',
      },
      {
        title: 'N\'anụ ahụ',
        text: 'Usoro nsọ dị n\'usoro na mmetụta ọdịmma bụ ihe ngosi ọma.',
      },
      {
        title: 'Ịnọ abụọ ma ọ bụ site n\'enyemaka',
        text: 'Ikwu maka ya na onye mmekọ gị nwere ike inyere unu aka ịga n\'ihu n\'otu ọsọ.',
      },
    ],
    body4:
      'Tupu ịnwale ọzọ, oge nleta ahụike nwere ike inyere gị aka ịga n\'ihu n\'udo karị:',
    followUpSteps: [
      {
        title: 'Ịtụle ọnọdụ',
        text: 'Mkparịta ụka na onye ọkachamara na-enyere gị aka ịlaghachi n\'ihe mere.',
      },
      {
        title: 'Nyocha ma ọ bụrụ na ọ dị mkpa',
        text: 'Dabere n\'ọnọdụ, a nwere ike ịtụ aro nnwale ndị ọzọ.',
      },
      {
        title: 'Ọnwale ọhụrụ',
        text: 'Nlekọta nwere ike mgbe ahụ ịkwado gị n\'udo ka ị na-anwale ọzọ.',
      },
    ],
    tipTitle: 'Ihe ọ dị mma ịma',
    tipText:
      'Otu ọpụpụ ime dịpụrụ adịpụ anaghị egosi nsogbu ọmụmụ n\'ozuzu. Otu ndị ahụike gị ka kacha mma ịza ajụjụ nke gị.',
    summaryPoints: [
      'Ọmụmụ na-alọghachikarị ngwa ngwa dị ka usoro nsọ na-esote ọpụpụ ime n\'oge mbụ.',
      'Ọtụtụ ndị ọkachamara na-ewere na ọ dịghị mkpa ichere ọtụtụ usoro nsọ, ọ bụrụ na a dụọla ọdụ ọzọ.',
      'Inwe mmetụta na ị dịla njikere, n\'anụ ahụ na n\'mmụọ, ka bụ nduzi kacha mkpa.',
      'Nlekọta ahụike nwere ike ịkwado gị ma mee ka obi sie gị ike tupu ịnwale ọzọ.',
    ],
    disclaimerText:
      'Ọdịnaya ozi. Isiokwu a anaghị anọchi ndụmọdụ ahụike nke e ji mee gị. Dọkịta gị ma ọ bụ onye na-agba nne ọrụ ka bụ ihe nrụtụ aka maka ọnọdụ gị.',
    shareMessage: 'Ọmụmụ na ịnwale ọzọ mgbe mfu — AWA',
  },
  yo: {
    badge: 'LẸ́YÌN ÌṢẸ́YUN • ÌBÍMỌ',
    title: 'Ìbímọ àti gbígbìyànjú lẹ́ẹ̀kan sí i lẹ́yìn àdánù',
    metaDuration: 'Ìṣẹ́jú 6 láti kà',
    metaType: 'Ìtọ́sọ́nà',
    metaLevel: 'Àárín',
    metaValidated: 'Àkóónú fún ìmọ̀',
    intro:
      'Ìgbà àti bí a ṣe lè ronú nípa gbígbìyànjú lẹ́ẹ̀kan sí i, ní ìwọ̀n ìrìn rẹ àti pẹ̀lú ìgboyà kíkún.',
    contentsTitle: 'Nínú àpilẹ̀kọ yìí',
    topics: [
      'Ìpadàbọ̀ ìbímọ',
      'Ohun tí àwọn ọ̀jọ̀gbọ́n sábà máa ń sọ',
      'Rírí ara rẹ gẹ́gẹ́ bí ẹni tó ti ṣetán, ní ìwọ̀n ìrìn rẹ',
      'Ìtọ́jú ìtẹ̀síwájú tó lè tù ọ́ nínú',
      'Àwọn kókó pàtàkì',
    ],
    body1:
      'Ìbímọ sábà máa ń padà bọ̀ ní kété ìyípo tó tẹ̀lé ìṣẹ́yun àkọ́kọ́. Ovulation tilẹ̀ lè ṣẹlẹ̀ kí nǹkan oṣù rẹ tó padà ní ojú kedere.',
    infoTitle: 'Kókó pàtàkì',
    infoText:
      'Gẹ́gẹ́ bí ìpele àdánù náà, àkókò ìgbàpadà ara lè yàtọ̀ díẹ̀ láti ipò kan sí òmíràn.',
    body2:
      'Ọ̀pọ̀ ọ̀jọ̀gbọ́n rò pé kò sí ìdí láti dúró fún ìyípo púpọ̀ kí a tó tún gbìyànjú, àyàfi tí dókítà tàbí agbẹ̀bí rẹ bá gbà ọ́ nímọ̀ràn yàtọ̀.',
    compareEarlyTitle: 'Àdánù ní ìbẹ̀rẹ̀',
    compareEarlyText:
      'Ìbímọ sábà máa ń padà bọ̀ kíákíá, ní kété ìyípo tó kàn.',
    compareLateTitle: 'Àdánù lẹ́yìn náà',
    compareLateText:
      'Ẹgbẹ́ oníṣègùn lè dábàá àkókò ìgbàpadà tó gùn díẹ̀ sí i.',
    body3:
      'Rírí ara rẹ gẹ́gẹ́ bí ẹni tó ti ṣetán, ní ti ara àti ti ẹ̀dùn ọkàn, ṣì jẹ́ atọ́nà pàtàkì jù — ó ju àkókò àròjinlẹ̀ èyíkéyìí lọ.',
    readinessPoints: [
      {
        title: 'Ní ti ẹ̀dùn ọkàn',
        text: 'Rírí ara rẹ gẹ́gẹ́ bí ẹni tó ti ṣetán nínú ara rẹ ṣe pàtàkì bí ìgbàpadà ara ṣe ṣe pàtàkì.',
      },
      {
        title: 'Ní ti ara',
        text: 'Ìyípo déédé àti ìmọ̀lára àlàáfíà jẹ́ àwọn àmì rere.',
      },
      {
        title: 'Gẹ́gẹ́ bí tọkọtaya tàbí pẹ̀lú ìtìlẹ́yìn',
        text: 'Bíbá partner rẹ sọ̀rọ̀ nípa rẹ̀ lè ràn yín lọ́wọ́ láti tẹ̀síwájú ní ìṣísẹ̀ kan náà.',
      },
    ],
    body4:
      'Ṣáájú kí o tó tún gbìyànjú, ìpàdé oníṣègùn lè ràn ọ́ lọ́wọ́ láti tẹ̀síwájú pẹ̀lú ìbàlẹ̀ ọkàn tó pọ̀ sí i:',
    followUpSteps: [
      {
        title: 'Ṣíṣe àyẹ̀wò gbogbogbò',
        text: 'Ìjíròrò pẹ̀lú ọ̀jọ̀gbọ́n ń jẹ́ kí o tún wo ohun tó ṣẹlẹ̀.',
      },
      {
        title: 'Àgbéyẹ̀wò tí ó bá yẹ',
        text: 'Gẹ́gẹ́ bí ipò náà, a lè dábàá àwọn ìdánwò afikún.',
      },
      {
        title: 'Ìgbìyànjú tuntun',
        text: 'Ìtọ́jú ìtẹ̀síwájú lè wá tì ọ́ lẹ́yìn ní ìbàlẹ̀ ọkàn bí o ṣe ń gbìyànjú lẹ́ẹ̀kan sí i.',
      },
    ],
    tipTitle: 'Ohun tó dára láti mọ̀',
    tipText:
      'Ìṣẹ́yun kan ṣoṣo kì í sábà fi ìṣòro ìbímọ hàn. Ẹgbẹ́ oníṣègùn rẹ ni ó dára jù láti dáhùn àwọn ìbéèrè ara ẹni rẹ.',
    summaryPoints: [
      'Ìbímọ sábà máa ń padà bọ̀ ní kété ìyípo tó tẹ̀lé ìṣẹ́yun àkọ́kọ́.',
      'Ọ̀pọ̀ ọ̀jọ̀gbọ́n rò pé kò sí ìdí láti dúró fún ìyípo púpọ̀, àyàfi tí a bá gbani nímọ̀ràn yàtọ̀.',
      'Rírí ara rẹ gẹ́gẹ́ bí ẹni tó ti ṣetán, ní ti ara àti ti ẹ̀dùn ọkàn, ṣì jẹ́ atọ́nà pàtàkì jù.',
      'Ìtọ́jú ìtẹ̀síwájú oníṣègùn lè tì ọ́ lẹ́yìn, kí ó sì tù ọ́ nínú ṣáájú kí o tó tún gbìyànjú.',
    ],
    disclaimerText:
      'Àkóónú fún ìmọ̀. Àpilẹ̀kọ yìí kò rọ́pò ìmọ̀ràn oníṣègùn tó jẹ mọ́ ẹni. Dókítà tàbí agbẹ̀bí rẹ ṣì jẹ́ ìtọ́kasí fún ipò rẹ.',
    shareMessage: 'Ìbímọ àti gbígbìyànjú lẹ́ẹ̀kan sí i lẹ́yìn àdánù — AWA',
  },
  zu: {
    badge: 'NGEMVA KOKUPHUPHUMA KWESISU • UKUZALA',
    title: 'Ukuzala nokuzama futhi ngemva kokulahlekelwa',
    metaDuration: 'Imizuzu emi-6 yokufunda',
    metaType: 'Umhlahlandlela',
    metaLevel: 'Eliphakathi',
    metaValidated: 'Okuqukethwe okunikeza ulwazi',
    intro:
      'Ukuthi ucabange nini nokuthi ucabange kanjani ngokuzama futhi, ngejubane lakho nangokuzethemba okugcwele.',
    contentsTitle: 'Kulesi sihloko',
    topics: [
      'Ukubuya kokuzala',
      'Lokho ochwepheshe abavame ukukusho',
      'Ukuzizwa ulungele, ngejubane lakho',
      'Ukunakekelwa kokulandelela okungakuqinisekisa',
      'Okubalulekile okufanele ukukhumbule',
    ],
    body1:
      'Ukuzala ngokuvamile kubuya ngokushesha emjikelezweni olandela ukuphuphuma kwesisu kwangaphambili. I-ovulation ingenzeka ngisho nangaphambi kokuthi isikhathi sakho sibonakale sibuya.',
    infoTitle: 'Okubalulekile ukukhumbula',
    infoText:
      'Kuye ngesigaba sokulahlekelwa, isikhathi sokululama komzimba singahluka kancane kusukela esimweni kuya kwesinye.',
    body2:
      'Ochwepheshe abaningi bacabanga ukuthi akudingeki ukulinda imijikelezo eminingana ngaphambi kokuzama futhi, ngaphandle kokuthi udokotela wakho noma umbelethisi akweluleke ngenye indlela.',
    compareEarlyTitle: 'Ukulahlekelwa kwangaphambili',
    compareEarlyText:
      'Ukuzala kuvame ukubuya ngokushesha, kusukela emjikelezweni olandelayo.',
    compareLateTitle: 'Ukulahlekelwa kwangemuva',
    compareLateText:
      'Isikhathi esihamba isikhathi eside kancane sokululama singanconywa yithimba lezokwelapha.',
    body3:
      'Ukuzizwa ulungele, ngokomzimba nangokwemizwa, kuhlala kuyisiholi esibaluleke kakhulu — ngaphezu kakhulu kunanoma yisiphi isikhathi sethiyori.',
    readinessPoints: [
      {
        title: 'Ngokwemizwa',
        text: 'Ukuzizwa ulungele ngaphakathi kubaluleke njengokululama komzimba.',
      },
      {
        title: 'Ngokomzimba',
        text: 'Umjikelezo ohlelekile nomuzwa wokuphila kahle kuyizikhombisi ezinhle.',
      },
      {
        title: 'Njengababili noma ngosekelo',
        text: 'Ukukhuluma ngakho nozakwenu kungakusiza niqhubeke ngejubane elifanayo.',
      },
    ],
    body4:
      'Ngaphambi kokuzama futhi, ukubonana nodokotela kungakusiza uqhubeke ngokuthula kwengqondo okukhulu:',
    followUpSteps: [
      {
        title: 'Ukubheka isimo',
        text: 'Ingxoxo nochwepheshe ikuvumela ukubuyekeza okwenzekile.',
      },
      {
        title: 'Ukuhlolwa uma kudingeka',
        text: 'Kuye ngesimo, ukuhlolwa okwengeziwe kungaphakanyiswa.',
      },
      {
        title: 'Umzamo omusha',
        text: 'Ukunakekelwa kokulandelela kungakweseka ngokuthula njengoba uzama futhi.',
      },
    ],
    tipTitle: 'Kuhle ukwazi',
    tipText:
      'Ukuphuphuma kwesisu okukodwa ngokuvamile akukhombisi inkinga yokuzala. Ithimba lakho lezokwelapha lihlala lilungele kakhulu ukuphendula imibuzo yakho siqu.',
    summaryPoints: [
      'Ukuzala ngokuvamile kubuya ngokushesha emjikelezweni olandela ukuphuphuma kwesisu kwangaphambili.',
      'Ochwepheshe abaningi bacabanga ukuthi akudingeki ukulinda imijikelezo eminingana, ngaphandle uma kululeke ngenye indlela.',
      'Ukuzizwa ulungele, ngokomzimba nangokwemizwa, kuhlala kuyisiholi esibaluleke kakhulu.',
      'Ukulandelela kwezokwelapha kungakweseka futhi kukuqinisekise ngaphambi kokuzama futhi.',
    ],
    disclaimerText:
      'Okuqukethwe okunikeza ulwazi. Lesi sihloko asithathi indawo yeseluleko sezokwelapha esikhethekile kuwe. Udokotela wakho noma umbelethisi uhlala eyisethenjwa ngesimo sakho.',
    shareMessage: 'Ukuzala nokuzama futhi ngemva kokulahlekelwa — AWA',
  },
  xh: {
    badge: 'EMVA KOKUPHUMA KWESISU • UKUZALA',
    title: 'Ukuzala nokuzama kwakhona emva kokulahlekelwa',
    metaDuration: 'Imizuzu emi-6 yokufunda',
    metaType: 'Isikhokelo',
    metaLevel: 'Ephakathi',
    metaValidated: 'Ulwazi',
    intro:
      'Nini nangendlela yokucinga ngokuzama kwakhona, ngejubane lakho nangentembelo epheleleyo.',
    contentsTitle: 'Kweli nqaku',
    topics: [
      'Ukubuya kokuzala',
      'Oko iingcali zihlala ziluthetha',
      'Ukuziva ulungile, ngejubane lakho',
      'Ukulandelwa okunokukuthomalalisa',
      'Eyona nto ibalulekileyo',
    ],
    body1:
      'Ukuzala kudla ngokubuya kwangomjikelo olandela ukuphuma kwesisu kwangoko. I-ovulation inokwenzeka kwanangaphambi kokuba ixesha lakho lokuya exesheni libonakale libuya.',
    infoTitle: 'Eyona nto ibalulekileyo',
    infoText:
      'Ngokuxhomekeke kwinqanaba lokulahlekelwa, ixesha lokuphola komzimba linokwahluka kancinci komnye umzekelo ukuya komnye.',
    body2:
      'Iingcali ezininzi ziqinisekile ukuba akukho mfuneko yokulinda imijikelo emininzi phambi kokuzama kwakhona, ngaphandle kokuba ugqirha wakho okanye umbelekisi ecebisa ngenye indlela.',
    compareEarlyTitle: 'Ukulahlekelwa kwangoko',
    compareEarlyText:
      'Ukuzala kudla ngokubuya ngokukhawuleza, kwangomjikelo olandelayo.',
    compareLateTitle: 'Ukulahlekelwa kamva',
    compareLateText:
      'Ixesha elide kancinci lokuphola linokucetyiswa liqela lezonyango.',
    body3:
      'Ukuziva ulungile, ngokomzimba nangokwemizwa, kusengowona mkhokeli ubalulekileyo — kakhulu ngaphezu nawuphi na umlinganiselo wexesha wethiyori.',
    readinessPoints: [
      {
        title: 'Ngokwemizwa',
        text: 'Ukuziva ulungile ngaphakathi kubalulekile njengokuphola komzimba.',
      },
      {
        title: 'Ngokomzimba',
        text: 'Umjikelo oqhelekileyo kunye nemvakalelo yempilo entle zizalathisi ezilungileyo.',
      },
      {
        title: 'Njengetshomi okanye ngenkxaso',
        text: 'Ukuthetha ngayo nozalana nawe kunganceda niqhubele phambili ngesantya esifanayo.',
      },
    ],
    body4:
      'Phambi kokuzama kwakhona, idinga lezonyango linganceda uqhubele phambili ngoxolo olungakumbi:',
    followUpSteps: [
      {
        title: 'Ukuhlola imeko',
        text: 'Incoko nengcali ikuvumela ukuba uphinde ujonge okwenzekileyo.',
      },
      {
        title: 'Uhlolo ukuba kuyafuneka',
        text: 'Ngokuxhomekeke kwimeko, uvavanyo olongezelelweyo lunokunikelwa.',
      },
      {
        title: 'Ukuzama okutsha',
        text: 'Ukulandelwa kunokuba kukuxhase ngokuzolileyo xa uzama kwakhona.',
      },
    ],
    tipTitle: 'Kulungile ukwazi',
    tipText:
      'Ukuphuma kwesisu okunye ngokubanzi akuthethi ingxaki yokuzala. Iqela lakho lezonyango lisafanele ngakumbi ukuphendula imibuzo yakho.',
    summaryPoints: [
      'Ukuzala kudla ngokubuya kwangomjikelo olandela ukuphuma kwesisu kwangoko.',
      'Iingcali ezininzi ziqinisekile ukuba akukho mfuneko yokulinda imijikelo emininzi, ngaphandle kokuba kucetyiswe ngenye indlela.',
      'Ukuziva ulungile, ngokomzimba nangokwemizwa, kusengowona mkhokeli ubalulekileyo.',
      'Ukulandelwa kwezonyango kunganceda kwaye kukuthomalalise phambi kokuzama kwakhona.',
    ],
    disclaimerText:
      'Ulwazi. Eli nqaku alithatheli indawo yecebiso lezonyango lomntu ngamnye. Ugqirha wakho okanye umbelekisi sisalathiso semeko yakho.',
    shareMessage: 'Ukuzala nokuzama kwakhona emva kokulahlekelwa — AWA',
  },
  sn: {
    badge: 'MUSHURE MENHUMBU YAPERA • KUBEREKA',
    title: 'Kubereka nekuedza zvakare mushure mekurasikirwa',
    metaDuration: 'Kuverenga kwemaminetsi 6',
    metaType: 'Gwaro',
    metaLevel: 'Epakati',
    metaValidated: 'Zvinyorwa zvekuziva',
    intro:
      'Rinhi nenzira yekufunga nezvekuedza zvakare, nekumhanya kwako uye nekuvimba kwakazara.',
    contentsTitle: 'Muchinyorwa chino',
    topics: [
      'Kudzoka kwekubereka',
      'Zvinowanzotaurwa nenyanzvi',
      'Kunzwa wakagadzirira, nekumhanya kwako',
      'Kutarisirwa kunogona kukunyaradza',
      'Zvakakosha kuyeuka',
    ],
    body1:
      'Kubereka kunowanzodzoka kubva pacycle inotevera nhumbu yakapera nokukurumidza. Ovulation inogona kunyange kuitika kuenda kwako kumwedzi kusati kwadzoka zvinooneka.',
    infoTitle: 'Zvakakosha kuyeuka',
    infoText:
      'Zvichienderana nenhanho yekurasikirwa, nguva yekupora kwemuviri inogona kusiyana zvishoma kubva pamamiriro kuenda kune mumwe.',
    body2:
      'Nyanzvi dzakawanda dzinofunga kuti hapana chikonzero chekumirira macycle akati wandei usati waedza zvakare, kunze kwekunge chiremba kana mukoti wako akurudzira zvimwe.',
    compareEarlyTitle: 'Kurasikirwa kwekutanga',
    compareEarlyText:
      'Kubereka kunowanzodzoka nokukurumidza, kubva pacycle inotevera.',
    compareLateTitle: 'Kurasikirwa kwekuma gare gare',
    compareLateText:
      'Nguva yakareba zvishoma yekupora inogona kukurudzirwa neboka rekurapa.',
    body3:
      'Kunzwa wakagadzirira, mumuviri nemumanzwiro, kunoramba kuri gwara rakakosha zvikuru — kupfuura nguva ipi neipi yepfungwa.',
    readinessPoints: [
      {
        title: 'Mumanzwiro',
        text: 'Kunzwa wakagadzirira mukati mako kunokosha sekupora kwemuviri.',
      },
      {
        title: 'Mumuviri',
        text: 'Cycle inorongeka nemanzwiro ekunaka zviratidzo zvakanaka.',
      },
      {
        title: 'Senhengo mbiri kana nerutsigiro',
        text: 'Kutaura nemurume wako kunogona kukubatsira kufambira mberi nekumhanya kwakafanana.',
      },
    ],
    body4:
      'Usati waedza zvakare, kuonana nechiremba kunogona kukubatsira kufambira mberi nerunyararo rwakawanda:',
    followUpSteps: [
      {
        title: 'Kutarisa mamiriro',
        text: 'Kukurukura nenyanzvi kunokubvumira kudzokorora zvakaitika.',
      },
      {
        title: 'Kuongororwa kana kuchidiwa',
        text: 'Zvichienderana nemamiriro, matesti akawedzera anogona kupihwa.',
      },
      {
        title: 'Kuedza kutsva',
        text: 'Kutarisirwa kunogona kukutsigira zvinyoro painotevera kuedza zvakare.',
      },
    ],
    tipTitle: 'Zvakanaka kuziva',
    tipText:
      'Nhumbu imwe chete yakapera inowanzoreva kuti hapana dambudziko rekubereka. Boka rako rekurapa ndiro rinokwanisa zvakanyanya kupindura mibvunzo yako.',
    summaryPoints: [
      'Kubereka kunowanzodzoka kubva pacycle inotevera nhumbu yakapera nokukurumidza.',
      'Nyanzvi dzakawanda dzinofunga kuti hapana chikonzero chekumirira macycle akati wandei, kunze kwekunge wakurudzirwa zvimwe.',
      'Kunzwa wakagadzirira, mumuviri nemumanzwiro, kunoramba kuri gwara rakakosha zvikuru.',
      'Kutarisirwa nechiremba kunogona kukutsigira nekukunyaradza usati waedza zvakare.',
    ],
    disclaimerText:
      'Zvinyorwa zvekuziva chete. Chinyorwa ichi hachitsiviri zano rekurapwa rakakodzera iwe. Chiremba kana mukoti wako ndiye anoramba ari sosi yemamiriro ako.',
    shareMessage: 'Kubereka nekuedza zvakare mushure mekurasikirwa — AWA',
  },
  ln: {
    badge: 'SIMA YA KOBOMBA ZEMI • BOMEMI',
    title: 'Bomemi mpe komeka lisusu sima ya kobungisa',
    metaDuration: 'Miniti 6 ya kotánga',
    metaType: 'Malako',
    metaLevel: 'Ya katikati',
    metaValidated: 'Makambo ya koyebisa',
    intro:
      'Ntango nini mpe ndenge nini ya kokanisa komeka lisusu, na lombangu na yo mpe na motema pɛtɛɛ.',
    contentsTitle: 'Na lisolo oyo',
    topics: [
      'Kozonga ya bomemi',
      'Oyo bato ya mosala balobaka mbala mingi',
      'Koyoka ete ozali pene, na lombangu na yo',
      'Bandeko oyo ekoki kopesa yo kimia',
      'Makambo ya kokanisa',
    ],
    body1:
      'Bomemi ezongaka mbala mingi uta na cycle oyo elandi sima ya kobomba zemi ya ebandeli. Ovulation ekoki mpe kosalema liboso sanza na yo emonana polele.',
    infoTitle: 'Eloko ya kokanisa',
    infoText:
      'Engebene na etape ya kobungisa, ntango ya kozongela nzoto ekoki kokeseni moke uta likambo moko tii mosusu.',
    body2:
      'Bato mingi ya mosala bakanisaka ete esengeli te kozela ba cycle mingi liboso ya komeka lisusu, longola soki monganga na yo to sage-femme alobi ndenge mosusu.',
    compareEarlyTitle: 'Kobungisa ya ebandeli',
    compareEarlyText:
      'Bomemi ezongaka mbala mingi noki, uta na cycle oyo elandi.',
    compareLateTitle: 'Kobungisa ya sima',
    compareLateText:
      'Ntango ya kozongela ya molai moke ekoki kolimbolama na etuluku ya monganga.',
    body3:
      'Koyoka ete ozali pene, na nzoto mpe na motema, ezali naino litambwisi ya ntina koleka — mingi koleka ntango ya nzela ya makanisi.',
    readinessPoints: [
      {
        title: 'Na motema',
        text: 'Koyoka ete ozali pene na kati na yo ezali na ntina lokola kozongela nzoto.',
      },
      {
        title: 'Na nzoto',
        text: 'Cycle ya molɔngɔ mpe koyoka malamu ezali bilembo ya malamu.',
      },
      {
        title: 'Lokola libala to na lisungi',
        text: 'Kolobela yango na partenaire na yo ekoki kosalisa bino kokende liboso na lombangu moko.',
      },
    ],
    body4:
      'Liboso ya komeka lisusu, rendez-vous ya monganga ekoki kosalisa yo kokende liboso na kimia ya motema koleka:',
    followUpSteps: [
      {
        title: 'Kotala makambo',
        text: 'Kosolola na moto ya mosala epesi nzela ya kotala lisusu oyo esalemaki.',
      },
      {
        title: 'Kotala soki esengeli',
        text: 'Engebene na likambo, ba test mosusu ekoki kopesama.',
      },
      {
        title: 'Komeka ya sika',
        text: 'Bandeko ekoki sima kosunga yo na kimia ntango ozali komeka lisusu.',
      },
    ],
    tipTitle: 'Eloko ya koyeba',
    tipText:
      'Kobomba zemi mbala moko kaka elakisi mbala mingi te ete ezali likambo ya bomemi. Etuluku ya monganga na yo azali naino na esika ya malamu mpo na koyanola mituna na yo ya moto.',
    summaryPoints: [
      'Bomemi ezongaka mbala mingi uta na cycle oyo elandi sima ya kobomba zemi ya ebandeli.',
      'Bato mingi ya mosala bakanisaka ete esengeli te kozela ba cycle mingi, longola soki balobi ndenge mosusu.',
      'Koyoka ete ozali pene, na nzoto mpe na motema, ezali naino litambwisi ya ntina koleka.',
      'Bandeko ya monganga ekoki kosunga mpe kopesa yo kimia liboso ya komeka lisusu.',
    ],
    disclaimerText:
      'Makambo ya koyebisa. Lisolo oyo etɛlɛmi na esika ya toli ya monganga oyo ebongi na yo moko te. Monganga na yo to sage-femme azali naino esika ya kotala mpo na likambo na yo.',
    shareMessage: 'Bomemi mpe komeka lisusu sima ya kobungisa — AWA',
  },
  ff: {
    badge: 'CAGGAL HOYRE HOWRE • HAWTERE',
    title: 'Hawtere e ɗaɓɓitugo caggal hoyre',
    metaDuration: 'Janngugol minti 6',
    metaType: 'Jannginoore',
    metaLevel: 'Hakkunde',
    metaValidated: 'Anndinde tan',
    intro:
      'Ndey e no hakkilaade dow ɗaɓɓitugo, bana yahde maaɗa e bernde laaɓɗe.',
    contentsTitle: 'Nder ɗuuɗal ndeen',
    topics: [
      'Ruttugo hawtere',
      'Ko mo hesɗitini ɗum wi\'i nder feere',
      'Hakkilaade ko a hawti, bana yahde maaɗa',
      'Raarugo ɗum waawi yoofugo bernde maaɗa',
      'Ko ɗum ɓuri fuu',
    ],
    body1:
      'Hawtere ɗum ɗon ruttita ko foti nder doggol lewru ɗi ɗon ara caggal hoyre howre adda. Ovulation ɗum waawi waɗude adda ndiyam lewru ruttii e ko ɗum yiyee.',
    infoTitle: 'Ko ɗum ɓuri fuu',
    infoText:
      'Bana wakkati hoyre waɗi, wakkati sellugo ɓanndu ɗum waawi waylude seɗɗa e gooto haa gooto.',
    body2:
      'Mo hesɗitini ɗum ɗuuɗɗo ɗon hakkilii ko walaa ko haani sabugo doggol lewru ɗuuɗɗe adda ɗaɓɓitugo, si dokotoro maaɗa malla mo hesɗitini ɗum wi\'i feere.',
    compareEarlyTitle: 'Hoyre adda',
    compareEarlyText:
      'Hawtere ɗum ɗon ruttita gaaw, ko foti nder doggol lewru ɗi ɗon ara.',
    compareLateTitle: 'Hoyre caggal',
    compareLateText:
      'Wakkati sellugo ɓuri juuɗude ɗum waawi wonde ko ɗum ɗon wi\'ee e koɗolle dokotoro.',
    body3:
      'Hakkilaade ko a hawti, nder ɓanndu e nder bernde, ɗum wooɗi ko ɓuri moyyude — ɓuri ko wakkati ɗum ɗon wi\'ee.',
    readinessPoints: [
      {
        title: 'Nder bernde',
        text: 'Hakkilaade ko a hawti nder hoore maaɗa ɗum ɓuri huutinaade bana sellugo ɓanndu.',
      },
      {
        title: 'Nder ɓanndu',
        text: 'Doggol lewru ɗum ɗon yaha moyyere e hakkilaade sella ko ɓaleeji moyyi.',
      },
      {
        title: 'Bana kawtal malla e wallugo',
        text: 'Haalaade dow ɗum e gorko maaɗa ɗum waawi wallude ma yahde e yeeso gooto.',
      },
    ],
    body4:
      'Adda ɗaɓɓitugo, yahde e dokotoro ɗum waawi wallude ma yahde e hakkilo ɓuri seɗɗa:',
    followUpSteps: [
      {
        title: 'Hawtugo ko ɗum waɗi',
        text: 'Haalaade e mo hesɗitini ɗum ɗum yaha ma tinndinde ko ɗum waɗi.',
      },
      {
        title: 'Ndaaruwol to ɗum haani',
        text: 'Bana ko woni e maaɗa, ndaaruwol feere ɗum waawi hokkeede.',
      },
      {
        title: 'Ɗaɓɓitugo hesere',
        text: 'Raarugo ɗum waawi wallude ma bannda tampude to a ɗon ɗaɓɓita.',
      },
    ],
    tipTitle: 'Ɗum ɓuri nafugo anndude',
    tipText:
      'Hoyre howre gooto ɗum wi\'ataa ko caɗeele hawtere. Koɗolle dokotoro maaɗa ɗum ɓuri moyyude ngam jaabugo naamne maaɗa.',
    summaryPoints: [
      'Hawtere ɗum ɗon ruttita ko foti nder doggol lewru ɗi ɗon ara caggal hoyre howre adda.',
      'Mo hesɗitini ɗum ɗuuɗɗo ɗon hakkilii ko walaa ko haani sabugo doggol lewru ɗuuɗɗe, si ɗum wi\'i feere.',
      'Hakkilaade ko a hawti, nder ɓanndu e nder bernde, ɗum wooɗi ko ɓuri moyyude.',
      'Raarugo dokotoro ɗum waawi wallude ma e yoofugo bernde maaɗa adda ɗaɓɓitugo.',
    ],
    disclaimerText:
      'Anndinde tan. Winndannde ndee ɗum sirtaaka jaabawol dokotoro ngam hoore maaɗa. Dokotoro maaɗa malla mo hesɗitini ɗum ɗum ko ɗum wooɗi ngam nyannde maaɗa.',
    shareMessage: 'Hawtere e ɗaɓɓitugo caggal hoyre — AWA',
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
  ms: {
    badge: 'SELEPAS KEGUGURAN • KESUBURAN',
    title: 'Kesuburan dan mencuba semula selepas kehilangan',
    metaDuration: '6 min bacaan',
    metaType: 'Panduan',
    metaLevel: 'Pertengahan',
    metaValidated: 'Kandungan maklumat',
    intro:
      'Bila dan bagaimana memikirkan untuk mencuba semula, mengikut rentak anda sendiri dan dengan penuh keyakinan.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Kembalinya kesuburan',
      'Apa yang biasanya dikatakan oleh pengamal profesional',
      'Berasa bersedia, mengikut rentak anda',
      'Penjagaan susulan yang boleh menenangkan anda',
      'Perkara penting untuk diingat',
    ],
    body1:
      'Kesuburan biasanya kembali seawal kitaran selepas keguguran awal. Ovulasi malah boleh berlaku sebelum haid anda kembali dengan jelas.',
    infoTitle: 'Perkara penting',
    infoText:
      'Bergantung pada peringkat kehilangan, masa pemulihan fizikal boleh berbeza sedikit dari satu keadaan ke keadaan yang lain.',
    body2:
      'Ramai pengamal profesional berpendapat bahawa tidak perlu menunggu beberapa kitaran sebelum mencuba semula, melainkan doktor atau bidan anda menasihatkan sebaliknya.',
    compareEarlyTitle: 'Kehilangan awal',
    compareEarlyText:
      'Kesuburan selalunya kembali dengan cepat, seawal kitaran seterusnya.',
    compareLateTitle: 'Kehilangan yang lebih lewat',
    compareLateText:
      'Masa pemulihan yang sedikit lebih lama mungkin disyorkan oleh pasukan perubatan.',
    body3:
      'Berasa bersedia, dari segi fizikal dan emosi, kekal sebagai panduan yang paling penting — jauh lebih daripada sebarang tempoh teori.',
    readinessPoints: [
      {
        title: 'Dari segi emosi',
        text: 'Berasa bersedia dalam diri sendiri sama pentingnya dengan pemulihan fizikal.',
      },
      {
        title: 'Dari segi fizikal',
        text: 'Kitaran yang tetap dan rasa sejahtera ialah penunjuk yang baik.',
      },
      {
        title: 'Sebagai pasangan atau dengan sokongan',
        text: 'Berbincang tentangnya dengan pasangan anda boleh membantu anda melangkah dengan kadar yang sama.',
      },
    ],
    body4:
      'Sebelum mencuba semula, temu janji perubatan boleh membantu anda melangkah dengan lebih tenang:',
    followUpSteps: [
      {
        title: 'Menilai keadaan',
        text: 'Perbualan dengan pengamal profesional membolehkan anda menyemak semula apa yang berlaku.',
      },
      {
        title: 'Penilaian jika perlu',
        text: 'Bergantung pada keadaan, ujian tambahan mungkin ditawarkan.',
      },
      {
        title: 'Percubaan baharu',
        text: 'Penjagaan susulan kemudiannya boleh menyokong anda dengan tenang semasa anda mencuba semula.',
      },
    ],
    tipTitle: 'Elok diketahui',
    tipText:
      'Keguguran yang terpencil biasanya tidak menunjukkan masalah kesuburan. Pasukan perubatan anda kekal paling sesuai untuk menjawab soalan peribadi anda.',
    summaryPoints: [
      'Kesuburan biasanya kembali seawal kitaran selepas keguguran awal.',
      'Ramai pengamal profesional berpendapat bahawa tidak perlu menunggu beberapa kitaran, melainkan dinasihatkan sebaliknya.',
      'Berasa bersedia, dari segi fizikal dan emosi, kekal sebagai panduan yang paling penting.',
      'Susulan perubatan boleh menyokong dan menenangkan anda sebelum mencuba semula.',
    ],
    disclaimerText:
      'Kandungan bersifat maklumat. Artikel ini tidak menggantikan nasihat perubatan yang diperibadikan. Doktor atau bidan anda kekal sebagai rujukan bagi keadaan anda.',
    shareMessage: 'Kesuburan dan mencuba semula selepas kehilangan — AWA',
  },
  so: {
    badge: 'UUR-LUMIS KA DIB • BACRIMIN',
    title: 'Bacrimin iyo isku day mar kale lumis ka dib',
    metaDuration: '6 daq akhris',
    metaType: 'Hage',
    metaLevel: 'Dhexdhexaad',
    metaValidated: 'Macluumaad',
    intro:
      'Goorta iyo sida loo fikiro isku day mar kale, xawaarahaaga iyo kalsooni buuxda.',
    contentsTitle: 'Maqaalkan dhexdiisa',
    topics: [
      'Soo noqoshada bacriminta',
      'Waxa xirfadlayaashu guud ahaan sheegaan',
      'Dareenka diyaar garowga, xawaarahaaga',
      'Daryeel la socod ah oo kuu degsan karo',
      'Qodobbada muhiimka ah',
    ],
    body1:
      'Bacrimintu inta badan waxay soo noqotaa isla wareegga ka dib uur-lumis hore. Ukun-sii-deyntu waxay xataa dhici kartaa ka hor intaysan caadadaadu muuqan.',
    infoTitle: 'Qodob muhiim ah',
    infoText:
      'Iyadoo ku xiran heerka lumista, waqtiga bogsiinta jidhku wuxuu xoogaa ku kala duwanaan karaa xaalad ilaa xaalad.',
    body2:
      'Xirfadlayaal badan ayaa u tixgeliya inaan loo baahnayn in la sugo dhowr wareeg ka hor intaan mar kale la isku dayin, marka laga reebo haddii dhakhtarkaaga ama umulistaadu ku talin si ka duwan.',
    compareEarlyTitle: 'Lumis hore',
    compareEarlyText:
      'Bacrimintu inta badan dhaqso ayay soo noqotaa, isla wareegga xiga.',
    compareLateTitle: 'Lumis dambe',
    compareLateText:
      'Waqti bogsiin oo xoogaa dheer ayaa laga yaabaa in kooxda caafimaadku ku talin.',
    body3:
      'Dareenka diyaar garowga, jidh ahaan iyo dareen ahaan, wuxuu weli yahay hagaha ugu muhiimsan — aad uga muhiim badan muddo aragtiyeed kasta.',
    readinessPoints: [
      {
        title: 'Dareen ahaan',
        text: 'Dareenka diyaar garow naftaada gudaheeda waa u muhiim sida bogsiinta jidhka.',
      },
      {
        title: 'Jidh ahaan',
        text: 'Wareeg joogto ah iyo dareen fayoobaan waa tilmaamayaal wanaagsan.',
      },
      {
        title: 'Lammaane ahaan ama taageero leh',
        text: 'La hadalka lammaanahaaga ayaa kaa caawin kara inaad isla xawaare horumarisaan.',
      },
    ],
    body4:
      'Ka hor intaadan mar kale isku dayin, ballan caafimaad ayaa kaa caawin kara inaad horumar ku samayso nabad badan:',
    followUpSteps: [
      {
        title: 'Qiimeyn',
        text: 'Wada hadal xirfadle ayaa kuu oggolaanaya inaad dib u eegto waxa dhacay.',
      },
      {
        title: 'Baaritaan haddii loo baahdo',
        text: 'Iyadoo ku xiran xaaladda, baaritaanno dheeraad ah ayaa la bixin karaa.',
      },
      {
        title: 'Isku day cusub',
        text: 'Daryeelka la socodku wuxuu markaas si degan kuu taageeri karaa marka aad mar kale isku dayayso.',
      },
    ],
    tipTitle: 'Waxtar leh in la ogaado',
    tipText:
      'Uur-lumis go’doon ah guud ahaan ma muujiyo dhibaato bacrimin. Kooxdaada caafimaadku waa tan ugu habboon ee ka jawaabi karta su’aalahaaga shakhsi ahaaneed.',
    summaryPoints: [
      'Bacrimintu inta badan waxay soo noqotaa isla wareegga ka dib uur-lumis hore.',
      'Xirfadlayaal badan ayaa u tixgeliya inaan loo baahnayn in la sugo dhowr wareeg, marka laga reebo haddii si kale lagula taliyo.',
      'Dareenka diyaar garowga, jidh ahaan iyo dareen ahaan, wuxuu weli yahay hagaha ugu muhiimsan.',
      'La socodka caafimaadku wuu kuu taageeri karaa oo kugu degsan karaa ka hor intaadan mar kale isku dayin.',
    ],
    disclaimerText:
      'Macluumaad. Maqaalkan ma beddelo talo caafimaad oo shakhsi ah. Dhakhtarkaaga ama umulistaadu waa tixraaca xaaladdaada.',
    shareMessage: 'Bacrimin iyo isku day mar kale lumis ka dib — AWA',
  },
  sw: {
    badge: 'BAADA YA KUHARIBIKA KWA MIMBA • RUTUBA',
    title: 'Rutuba na kujaribu tena baada ya kupoteza mimba',
    metaDuration: 'Dakika 6 za kusoma',
    metaType: 'Mwongozo',
    metaLevel: 'Wastani',
    metaValidated: 'Maudhui ya taarifa',
    intro:
      'Wakati na jinsi ya kufikiria kujaribu tena, kwa mwendo wako mwenyewe na kwa kujiamini kikamilifu.',
    contentsTitle: 'Katika makala hii',
    topics: [
      'Kurejea kwa rutuba',
      'Wataalamu kwa kawaida husema nini',
      'Kujisikia tayari, kwa mwendo wako mwenyewe',
      'Huduma za ufuatiliaji zinazoweza kukutuliza',
      'Mambo muhimu ya kukumbuka',
    ],
    body1:
      'Rutuba kwa kawaida hurejea mapema kama mzunguko unaofuata kuharibika kwa mimba mapema. Utoaji wa yai unaweza hata kutokea kabla hedhi yako haijarejea kwa wazi.',
    infoTitle: 'Jambo kuu la kukumbuka',
    infoText:
      'Kulingana na hatua ya kupoteza mimba, muda wa kupona kimwili unaweza kutofautiana kidogo kutoka hali moja hadi nyingine.',
    body2:
      'Wataalamu wengi wanaona kwamba hakuna haja ya kusubiri mizunguko kadhaa kabla ya kujaribu tena, isipokuwa daktari au mkunga wako akishauri vinginevyo.',
    compareEarlyTitle: 'Kupoteza mimba mapema',
    compareEarlyText:
      'Rutuba mara nyingi hurejea haraka, mapema kama mzunguko unaofuata.',
    compareLateTitle: 'Kupoteza mimba baadaye',
    compareLateText:
      'Muda mrefu zaidi kidogo wa kupona unaweza kupendekezwa na timu ya madaktari.',
    body3:
      'Kujisikia tayari, kimwili na kihisia, kunabaki kuwa mwongozo muhimu zaidi — zaidi sana ya muda wowote wa nadharia.',
    readinessPoints: [
      {
        title: 'Kihisia',
        text: 'Kujisikia tayari ndani yako ni muhimu sawa na kupona kimwili.',
      },
      {
        title: 'Kimwili',
        text: 'Mzunguko wa mpangilio na hisia ya ustawi ni viashiria vizuri.',
      },
      {
        title: 'Kama wenzi au kwa msaada',
        text: 'Kuzungumza na mwenzi wako kunaweza kukusaidia kusonga mbele kwa mwendo mmoja.',
      },
    ],
    body4:
      'Kabla ya kujaribu tena, miadi ya kitabibu inaweza kukusaidia kusonga mbele kwa amani zaidi ya akili:',
    followUpSteps: [
      {
        title: 'Kufanya tathmini',
        text: 'Mazungumzo na mtaalamu yanakuwezesha kurejea kilichotokea.',
      },
      {
        title: 'Uchunguzi ikiwa inahitajika',
        text: 'Kulingana na hali, vipimo vya ziada vinaweza kutolewa.',
      },
      {
        title: 'Jaribio jipya',
        text: 'Huduma za ufuatiliaji zinaweza basi kukusaidia kwa utulivu unapojaribu tena.',
      },
    ],
    tipTitle: 'Vyema kujua',
    tipText:
      'Kuharibika kwa mimba mara moja kwa kawaida hakuashirii tatizo la rutuba. Timu yako ya madaktari inabaki ndiyo iliyo katika nafasi bora ya kujibu maswali yako binafsi.',
    summaryPoints: [
      'Rutuba kwa kawaida hurejea mapema kama mzunguko unaofuata kuharibika kwa mimba mapema.',
      'Wataalamu wengi wanaona kwamba hakuna haja ya kusubiri mizunguko kadhaa, isipokuwa ukishauriwa vinginevyo.',
      'Kujisikia tayari, kimwili na kihisia, kunabaki kuwa mwongozo muhimu zaidi.',
      'Ufuatiliaji wa kitabibu unaweza kukusaidia na kukutuliza kabla ya kujaribu tena.',
    ],
    disclaimerText:
      'Maudhui ya taarifa. Makala hii haichukui nafasi ya ushauri wa kitabibu uliobinafsishwa. Daktari au mkunga wako anabaki kuwa rejeo kwa hali yako.',
    shareMessage: 'Rutuba na kujaribu tena baada ya kupoteza mimba — AWA',
  },
  kk: {
    badge: 'ТҮСІКТЕН КЕЙІН • ҚҰНАРЛЫЛЫҚ',
    title: 'Жоғалтқаннан кейінгі құнарлылық және қайта тырысу',
    metaDuration: '6 мин оқу',
    metaType: 'Нұсқаулық',
    metaLevel: 'Орташа',
    metaValidated: 'Ақпараттық мазмұн',
    intro:
      'Қайта тырысу туралы қашан және қалай ойлау керек, өз қарқыныңызбен және толық сеніммен.',
    contentsTitle: 'Осы мақалада',
    topics: [
      'Құнарлылықтың қайта оралуы',
      'Мамандар әдетте не дейді',
      'Өз қарқыныңызбен дайын болу',
      'Көңіліңізді тыныштандыра алатын бақылау күтімі',
      'Негізгі қорытындылар',
    ],
    body1:
      'Құнарлылық әдетте ерте түсіктен кейінгі циклде-ақ қайта оралады. Овуляция етеккіріңіз көрінетіндей қайта келмей тұрып-ақ болуы мүмкін.',
    infoTitle: 'Негізгі қорытынды',
    infoText:
      'Жоғалтудың кезеңіне байланысты дене қалпына келу уақыты бір жағдайдан екіншісіне сәл өзгеруі мүмкін.',
    body2:
      'Көптеген мамандар дәрігеріңіз немесе акушеріңіз басқаша кеңес бермесе, қайта тырысудан бұрын бірнеше цикл күтудің қажеті жоқ деп есептейді.',
    compareEarlyTitle: 'Ерте жоғалту',
    compareEarlyText:
      'Құнарлылық көбіне тез, келесі циклде-ақ қайта оралады.',
    compareLateTitle: 'Кейінгі жоғалту',
    compareLateText:
      'Медициналық топ сәл ұзағырақ қалпына келу уақытын ұсынуы мүмкін.',
    body3:
      'Дене және эмоциялық тұрғыдан дайын болу ең маңызды нұсқаулық болып қала береді — кез келген теориялық мерзімнен әлдеқайда маңызды.',
    readinessPoints: [
      {
        title: 'Эмоциялық тұрғыдан',
        text: 'Өз ішіңде дайын болу дене қалпына келуі сияқты маңызды.',
      },
      {
        title: 'Дене тұрғысынан',
        text: 'Тұрақты цикл және әл-ауқат сезімі жақсы көрсеткіштер.',
      },
      {
        title: 'Жұп ретінде немесе қолдаумен',
        text: 'Серіктесіңізбен сөйлесу бірдей қарқынмен алға жылжуға көмектесе алады.',
      },
    ],
    body4:
      'Қайта тырысудан бұрын медициналық қабылдау тыныштықпен алға жылжуға көмектесе алады:',
    followUpSteps: [
      {
        title: 'Қорытынды жасау',
        text: 'Маманмен әңгіме болған жағдайға қайта оралуға мүмкіндік береді.',
      },
      {
        title: 'Қажет болса, тексеру',
        text: 'Жағдайға байланысты қосымша тесттер ұсынылуы мүмкін.',
      },
      {
        title: 'Жаңа әрекет',
        text: 'Бақылау күтімі содан кейін қайта тырысқанда сізді тыныш қолдай алады.',
      },
    ],
    tipTitle: 'Білуге тиісті',
    tipText:
      'Жеке түсік әдетте құнарлылық проблемасын көрсетпейді. Медициналық тобыңыз жеке сұрақтарыңызға жауап беруге ең қолайлы.',
    summaryPoints: [
      'Құнарлылық әдетте ерте түсіктен кейінгі циклде-ақ қайта оралады.',
      'Көптеген мамандар басқаша кеңес берілмесе, бірнеше цикл күтудің қажеті жоқ деп есептейді.',
      'Дене және эмоциялық тұрғыдан дайын болу ең маңызды нұсқаулық болып қала береді.',
      'Медициналық бақылау қайта тырысудан бұрын сізді қолдап, көңіліңізді тыныштандыра алады.',
    ],
    disclaimerText:
      'Ақпараттық мазмұн. Бұл мақала жекелендірілген медициналық кеңестің орнын баспайды. Дәрігеріңіз немесе акушеріңіз жағдайыңыз үшін анықтама болып қала береді.',
    shareMessage: 'Жоғалтқаннан кейінгі құнарлылық және қайта тырысу — AWA',
  },
  wo: {
    badge: 'GINNAAW ËMB BU REES • BINDEEF',
    title: 'Bindeef ak jéemaat ginnaaw ëmb bu rees',
    metaDuration: '6 simili jàng',
    metaType: 'Ndigal',
    metaLevel: 'Digg-dóomu',
    metaValidated: 'Mbind ngir xibaar',
    intro:
      'Kañ ak naka ngay xalaat jéemaat, ci sa ritm te ak kóolute bu mat.',
    contentsTitle: 'Ci bind bii',
    topics: [
      'Dellusig bindeef',
      'Li liggéeykat yi di wax ci yoon',
      'Dégg nga waajal, ci sa ritm',
      'Topp yu mën a dalal sa xel',
      'Li am solo',
    ],
    body1:
      'Bindeef daa dellusi ci wërsëg bi toftal ëmb bu rees bu jëkk. Ovilasiyoŋ mën na am balaa sa règle di dellusi ci kaw.',
    infoTitle: 'Li am solo',
    infoText:
      'Ci anamu rees bi, jamonoy wér ci yaram mën na wuute tuuti ci mbir ak mbir.',
    body2:
      'Bari ci liggéeykat yi dañuy jàpp ne soxlawul xaar ay wërsëg balaa jéemaat, lu dul ndigalu doktoor walla ndey-jur wuute.',
    compareEarlyTitle: 'Rees bu jëkk',
    compareEarlyText:
      'Bindeef daa dellusi ci gaaw, ba ci wërsëg bi toftal.',
    compareLateTitle: 'Rees bu gën a yeex',
    compareLateText:
      'Jamonoy wér bu gën a gudd tuuti mën na ko digal ekipu doktoor yi.',
    body3:
      'Dégg nga waajal, ci yaram ak ci xol, des na ndigal bi gëna am solo — lool ba lu mu mën a doon diir bu leer.',
    readinessPoints: [
      {
        title: 'Ci xol',
        text: 'Dégg ne waajal nga ci sa biir am na solo ni wér ci yaram.',
      },
      {
        title: 'Ci yaram',
        text: 'Wërsëg bu jub ak dégg wér ay màndarga yu baax la.',
      },
      {
        title: 'Ci ñaar ñi walla ak dimbali',
        text: 'Wax ko ak sa jëkkër mën na dimbli ngeen demal ak benn ritm.',
      },
    ],
    body4:
      'Balaa nga jéemaat, benn ndaje ak doktoor mën na dimbli nga dem kanam ak jàmm bu gën a bari:',
    followUpSteps: [
      {
        title: 'Seetlu',
        text: 'Benn waxtaan ak liggéeykat mën na la may nga dellu ci li xewoon.',
      },
      {
        title: 'Benn natt bu soxla',
        text: 'Ci sa mbir, mën nañu la joxe tès yu yokk.',
      },
      {
        title: 'Benn jéem bu bees',
        text: 'Topp bi mën na la dimbli ci jéemaat ak dal.',
      },
    ],
    tipTitle: 'Lu baax a xam',
    tipText:
      'Ëmb bu rees bu neen du wone ne am na jafe-jafe ci bindeef. Sa ekipu doktoor des na bu gëna baax ngir tontu say laaj yu sa bopp.',
    summaryPoints: [
      'Bindeef daa dellusi ci wërsëg bi toftal ëmb bu rees bu jëkk.',
      'Bari ci liggéeykat dañuy jàpp ne soxlawul xaar ay wërsëg, lu dul ñu digal leen ko.',
      'Dégg nga waajal, ci yaram ak ci xol, des na ndigal bi gëna am solo.',
      'Topp bu doktoor mën na la dimbli te dalal sa xel balaa nga jéemaat.',
    ],
    disclaimerText:
      'Mbind ngir xibaar. Bind bii du wuutu ndigalu doktoor bu sa bopp. Sa doktoor walla sa ndey-jur des na li ñuy jëfandikoo ngir sa mbir.',
    shareMessage: 'Bindeef ak jéemaat ginnaaw ëmb bu rees — AWA',
  },
  ha: {
    badge: 'BAYAN ZUBAR DA CIKI • HAIHUWA',
    title: 'Haihuwa da sake gwadawa bayan rasa ciki',
    metaDuration: 'karatun minti 6',
    metaType: 'Jagora',
    metaLevel: 'Matsakaici',
    metaValidated: 'Abun bayani',
    intro:
      'Yaushe da yadda za a yi tunanin sake gwadawa, bisa saurinki kuma da cikakken kwarin gwiwa.',
    contentsTitle: 'A cikin wannan labari',
    topics: [
      'Dawowar haihuwa',
      'Abin da ƙwararru yawanci ke faɗi',
      'Jin shirin, bisa saurinki',
      'Kulawar bibiya da za ta iya kwantar da hankalinki',
      'Muhimman abubuwa',
    ],
    body1:
      'Haihuwa yawanci tana dawowa tun daga zagayen da ya biyo bayan zubar da ciki na farko. Fitar ƙwai ma na iya faruwa kafin hailarki ta dawo a bayyane.',
    infoTitle: 'Muhimmin abu',
    infoText:
      'Bisa matakin rashin, lokacin murmurewar jiki na iya bambanta kaɗan daga yanayi zuwa yanayi.',
    body2:
      'Ƙwararru da dama suna ganin babu bukatar jira zagaye da dama kafin sake gwadawa, sai dai idan likitanki ko ungozoma ta ba da shawara akasin haka.',
    compareEarlyTitle: 'Rashin da wuri',
    compareEarlyText:
      'Haihuwa galibi tana dawowa da sauri, tun daga zagaye na gaba.',
    compareLateTitle: 'Rashin daga baya',
    compareLateText:
      'Ƙungiyar likitoci na iya ba da shawarar ɗan tsawon lokacin murmurewa.',
    body3:
      'Jin shirin, ta jiki da ta zuciya, ya ci gaba da zama mafi muhimmin jagora — fiye da kowane lokaci na hasashe.',
    readinessPoints: [
      {
        title: 'Ta zuciya',
        text: 'Jin shirin a cikin kanki yana da muhimmanci daidai da murmurewar jiki.',
      },
      {
        title: 'Ta jiki',
        text: 'Zagaye mai tsari da jin daɗi alamomi ne masu kyau.',
      },
      {
        title: 'A matsayin ma’aurata ko tare da tallafi',
        text: 'Magana game da shi da abokin zamanki na iya taimaka muku ku ci gaba cikin sauri ɗaya.',
      },
    ],
    body4:
      'Kafin sake gwadawa, ganawa da likita na iya taimaka miki ki ci gaba da ƙarin kwanciyar hankali:',
    followUpSteps: [
      {
        title: 'Duba halin da ake ciki',
        text: 'Tattaunawa da ƙwararre tana ba ki damar sake duba abin da ya faru.',
      },
      {
        title: 'Bincike idan ya zama dole',
        text: 'Bisa yanayin, ana iya ba da shawarar ƙarin gwaje-gwaje.',
      },
      {
        title: 'Sabon yunƙuri',
        text: 'Kulawar bibiya sai ta iya tallafa miki cikin natsuwa yayin da kike sake gwadawa.',
      },
    ],
    tipTitle: 'Abin da ya dace a sani',
    tipText:
      'Zubar da ciki ɗaya kaɗai yawanci ba ya nuna matsalar haihuwa. Ƙungiyar likitocinki ta fi dacewa ta amsa tambayoyinki na kanki.',
    summaryPoints: [
      'Haihuwa yawanci tana dawowa tun daga zagayen da ya biyo bayan zubar da ciki na farko.',
      'Ƙwararru da dama suna ganin babu bukatar jira zagaye da dama, sai dai idan an ba da shawara akasin haka.',
      'Jin shirin, ta jiki da ta zuciya, ya ci gaba da zama mafi muhimmin jagora.',
      'Bibiyar likita na iya tallafa miki kuma ta kwantar miki da hankali kafin sake gwadawa.',
    ],
    disclaimerText:
      'Abun bayani. Wannan labari ba ya maye gurbin shawarar likita ta keɓaɓɓiya. Likitanki ko ungozoma ita ce mafi dogaro ga yanayinki.',
    shareMessage: 'Haihuwa da sake gwadawa bayan rasa ciki — AWA',
  },
  am: {
    badge: 'ከእርግዝና መጥፋት በኋላ • የመውለድ ችሎታ',
    title: 'የመውለድ ችሎታ እና ከመጥፋት በኋላ እንደገና መሞከር',
    metaDuration: '6 ደቂቃ ንባብ',
    metaType: 'መመሪያ',
    metaLevel: 'መካከለኛ',
    metaValidated: 'የመረጃ ይዘት',
    intro:
      'እንደገና መሞከርን መቼ እና እንዴት እንደምታስቢ፣ በራስሽ ፍጥነት እና በሙሉ በራስ መተማመን።',
    contentsTitle: 'በዚህ ጽሑፍ ውስጥ',
    topics: [
      'የመውለድ ችሎታ መመለስ',
      'ባለሙያዎች በአጠቃላይ የሚሉት',
      'ዝግጁ መሆን፣ በራስሽ ፍጥነት',
      'ልብሽን ሊያሳርፍ የሚችል የክትትል እንክብካቤ',
      'ዋና ዋና ነጥቦች',
    ],
    body1:
      'የመውለድ ችሎታ ብዙውን ጊዜ ከቅድመ እርግዝና መጥፋት በኋላ በሚቀጥለው ዑደት ይመለሳል። እንቁላል መልቀቅ የወር አበባሽ በግልጽ ከመመለሱ በፊት እንኳን ሊከሰት ይችላል።',
    infoTitle: 'ዋና ነጥብ',
    infoText:
      'እንደ መጥፋቱ ደረጃ፣ የአካል ማገገም ጊዜ ከሁኔታ ወደ ሁኔታ በትንሹ ሊለያይ ይችላል።',
    body2:
      'ብዙ ባለሙያዎች ሐኪምሽ ወይም ሚድዋይፍ ካልመከሩ በስተቀር እንደገና ከመሞከር በፊት በርካታ ዑደቶችን መጠበቅ አያስፈልግም ብለው ያስባሉ።',
    compareEarlyTitle: 'ቀደምት መጥፋት',
    compareEarlyText:
      'የመውለድ ችሎታ ብዙውን ጊዜ በፍጥነት፣ ከሚቀጥለው ዑደት ጀምሮ ይመለሳል።',
    compareLateTitle: 'ዘግይቶ መጥፋት',
    compareLateText:
      'የሕክምና ቡድኑ ትንሽ ረዘም ያለ የማገገም ጊዜ ሊመክር ይችላል።',
    body3:
      'በአካልም በስሜትም ዝግጁ መሆን ከማንኛውም የንድፈ ሐሳብ ጊዜ ገደብ በእጅጉ በላይ በጣም አስፈላጊው መመሪያ ሆኖ ይቆያል።',
    readinessPoints: [
      {
        title: 'በስሜት',
        text: 'በውስጥሽ ዝግጁ መሆን ከአካል ማገገም እኩል አስፈላጊ ነው።',
      },
      {
        title: 'በአካል',
        text: 'ወጥ ዑደት እና የደህንነት ስሜት ጥሩ አመልካቾች ናቸው።',
      },
      {
        title: 'እንደ ጥንዶች ወይም በድጋፍ',
        text: 'ከአጋርሽ ጋር ስለሱ መነጋገር በተመሳሳይ ፍጥነት ወደ ፊት እንድትሄዱ ሊረዳችሁ ይችላል።',
      },
    ],
    body4:
      'እንደገና ከመሞከርሽ በፊት የሕክምና ቀጠሮ በበለጠ ሰላም ወደ ፊት እንድትሄጂ ሊረዳሽ ይችላል፦',
    followUpSteps: [
      {
        title: 'ሁኔታን መገምገም',
        text: 'ከባለሙያ ጋር የሚደረግ ውይይት የተከሰተውን እንደገና እንድትመለከቺ ያስችልሻል።',
      },
      {
        title: 'ካስፈለገ ግምገማ',
        text: 'እንደ ሁኔታው ተጨማሪ ምርመራዎች ሊቀርቡ ይችላሉ።',
      },
      {
        title: 'አዲስ ሙከራ',
        text: 'የክትትል እንክብካቤ እንደገና ስትሞክሪ በእርጋታ ሊደግፍሽ ይችላል።',
      },
    ],
    tipTitle: 'ማወቅ ጠቃሚ ነው',
    tipText:
      'አንድ የተለየ የእርግዝና መጥፋት በአጠቃላይ የመውለድ ችሎታ ችግርን አያመለክትም። የሕክምና ቡድንሽ የግል ጥያቄዎችሽን ለመመለስ ምርጥ ቦታ ላይ ይገኛል።',
    summaryPoints: [
      'የመውለድ ችሎታ ብዙውን ጊዜ ከቅድመ እርግዝና መጥፋት በኋላ በሚቀጥለው ዑደት ይመለሳል።',
      'ብዙ ባለሙያዎች ካልተመከረ በስተቀር በርካታ ዑደቶችን መጠበቅ አያስፈልግም ብለው ያስባሉ።',
      'በአካልም በስሜትም ዝግጁ መሆን በጣም አስፈላጊው መመሪያ ሆኖ ይቆያል።',
      'የሕክምና ክትትል እንደገና ከመሞከርሽ በፊት ሊደግፍሽና ሊያሳርፍሽ ይችላል።',
    ],
    disclaimerText:
      'የመረጃ ይዘት። ይህ ጽሑፍ የግል የሕክምና ምክርን አይተካም። ሐኪምሽ ወይም ሚድዋይፍሽ ለሁኔታሽ ማመሳከሪያ ሆነው ይቆያሉ።',
    shareMessage: 'የመውለድ ችሎታ እና ከመጥፋት በኋላ እንደገና መሞከር — AWA',
  },
  nl: {
    badge: 'NA EEN MISKRAAM • VRUCHTBAARHEID',
    title: 'Vruchtbaarheid en opnieuw proberen na een verlies',
    metaDuration: '6 min lezen',
    metaType: 'Gids',
    metaLevel: 'Gevorderd',
    metaValidated: 'Informatieve inhoud',
    intro:
      'Wanneer en hoe je erover kunt nadenken opnieuw te proberen, in je eigen tempo en in alle vertrouwen.',
    contentsTitle: 'In dit artikel',
    topics: [
      'De terugkeer van de vruchtbaarheid',
      'Wat professionals over het algemeen zeggen',
      'Je er klaar voor voelen, in je eigen tempo',
      'Opvolging die je kan geruststellen',
      'Belangrijkste punten',
    ],
    body1:
      'De vruchtbaarheid keert meestal al terug in de cyclus na een vroege miskraam. De eisprong kan zelfs plaatsvinden voordat je menstruatie zichtbaar terugkeert.',
    infoTitle: 'Belangrijk punt',
    infoText:
      'Afhankelijk van het stadium van het verlies kan de lichamelijke hersteltijd iets verschillen van de ene situatie tot de andere.',
    body2:
      'Veel professionals vinden dat je niet meerdere cycli hoeft te wachten voordat je opnieuw probeert, tenzij je huisarts of verloskundige anders adviseert.',
    compareEarlyTitle: 'Vroeg verlies',
    compareEarlyText:
      'De vruchtbaarheid keert vaak snel terug, al in de volgende cyclus.',
    compareLateTitle: 'Later verlies',
    compareLateText:
      'Het medische team kan een iets langere hersteltijd aanbevelen.',
    body3:
      'Je er lichamelijk en emotioneel klaar voor voelen blijft de belangrijkste gids — veel meer dan welke theoretische termijn ook.',
    readinessPoints: [
      {
        title: 'Emotioneel',
        text: 'Je er in jezelf klaar voor voelen is net zo belangrijk als lichamelijk herstel.',
      },
      {
        title: 'Lichamelijk',
        text: 'Een regelmatige cyclus en een gevoel van welzijn zijn goede indicatoren.',
      },
      {
        title: 'Als koppel of met steun',
        text: 'Erover praten met je partner kan je helpen in hetzelfde tempo vooruit te gaan.',
      },
    ],
    body4:
      'Voordat je opnieuw probeert, kan een medische afspraak je helpen met meer gemoedsrust verder te gaan:',
    followUpSteps: [
      {
        title: 'Een balans opmaken',
        text: 'Een gesprek met een professional laat je terugkomen op wat er is gebeurd.',
      },
      {
        title: 'Zo nodig een onderzoek',
        text: 'Afhankelijk van de situatie kunnen aanvullende tests worden voorgesteld.',
      },
      {
        title: 'Een nieuwe poging',
        text: 'Opvolging kan je dan rustig begeleiden wanneer je opnieuw probeert.',
      },
    ],
    tipTitle: 'Goed om te weten',
    tipText:
      'Een op zichzelf staande miskraam duidt over het algemeen niet op een vruchtbaarheidsprobleem. Je medische team blijft het best in staat je persoonlijke vragen te beantwoorden.',
    summaryPoints: [
      'De vruchtbaarheid keert meestal al terug in de cyclus na een vroege miskraam.',
      'Veel professionals vinden dat je niet meerdere cycli hoeft te wachten, tenzij anders geadviseerd.',
      'Je er lichamelijk en emotioneel klaar voor voelen blijft de belangrijkste gids.',
      'Medische opvolging kan je ondersteunen en geruststellen voordat je opnieuw probeert.',
    ],
    disclaimerText:
      'Informatieve inhoud. Dit artikel vervangt geen persoonlijk medisch advies. Je huisarts of verloskundige blijft de referentie voor jouw situatie.',
    shareMessage: 'Vruchtbaarheid en opnieuw proberen na een verlies — AWA',
  },
  fi: {
    badge: 'KESKENMENON JÄLKEEN • HEDELMÄLLISYYS',
    title: 'Hedelmällisyys ja uusi yritys menetyksen jälkeen',
    metaDuration: '6 min lukuaika',
    metaType: 'Opas',
    metaLevel: 'Keskitaso',
    metaValidated: 'Tiedoksi tarkoitettua sisältöä',
    intro:
      'Milloin ja miten uutta yritystä voi harkita, omaan tahtiisi ja täydellä luottamuksella.',
    contentsTitle: 'Tässä artikkelissa',
    topics: [
      'Hedelmällisyyden palautuminen',
      'Mitä ammattilaiset yleensä sanovat',
      'Valmiuden tunne omaan tahtiisi',
      'Seuranta, joka voi rauhoittaa',
      'Tärkeimmät asiat',
    ],
    body1:
      'Hedelmällisyys palautuu yleensä jo varhaisen keskenmenon jälkeisessä kierrossa. Ovulaatio voi tapahtua jopa ennen kuin kuukautiset näkyvästi palaavat.',
    infoTitle: 'Tärkein asia',
    infoText:
      'Menetyksen vaiheesta riippuen fyysisen toipumisen aika voi vaihdella hieman tilanteesta toiseen.',
    body2:
      'Monet ammattilaiset katsovat, ettei useita kiertoja tarvitse odottaa ennen uutta yritystä, ellei lääkärisi tai kätilösi neuvo toisin.',
    compareEarlyTitle: 'Varhainen menetys',
    compareEarlyText:
      'Hedelmällisyys palautuu usein nopeasti, jo seuraavassa kierrossa.',
    compareLateTitle: 'Myöhäisempi menetys',
    compareLateText:
      'Hoitotiimi voi suositella hieman pidempää toipumisaikaa.',
    body3:
      'Valmiuden tunne, fyysisesti ja henkisesti, on edelleen tärkein ohjenuora — paljon tärkeämpi kuin mikään teoreettinen aikaraja.',
    readinessPoints: [
      {
        title: 'Henkisesti',
        text: 'Valmiuden tunne itsessäsi on yhtä tärkeää kuin fyysinen toipuminen.',
      },
      {
        title: 'Fyysisesti',
        text: 'Säännöllinen kierto ja hyvinvoinnin tunne ovat hyviä merkkejä.',
      },
      {
        title: 'Parina tai tuen kanssa',
        text: 'Asiasta puhuminen kumppanin kanssa voi auttaa etenemään samaa tahtia.',
      },
    ],
    body4:
      'Ennen uutta yritystä vastaanotto voi auttaa etenemään rauhallisemmin mielin:',
    followUpSteps: [
      {
        title: 'Tilanteen läpikäynti',
        text: 'Keskustelu ammattilaisen kanssa antaa mahdollisuuden palata tapahtuneeseen.',
      },
      {
        title: 'Tarvittaessa tutkimukset',
        text: 'Tilanteesta riippuen voidaan tarjota lisätutkimuksia.',
      },
      {
        title: 'Uusi yritys',
        text: 'Seuranta voi sitten tukea sinua rauhallisesti uuden yrityksen aikana.',
      },
    ],
    tipTitle: 'Hyvä tietää',
    tipText:
      'Yksittäinen keskenmeno ei yleensä viittaa hedelmällisyysongelmaan. Hoitotiimisi on edelleen parhaiten tilanteessa vastaamaan henkilökohtaisiin kysymyksiisi.',
    summaryPoints: [
      'Hedelmällisyys palautuu yleensä jo varhaisen keskenmenon jälkeisessä kierrossa.',
      'Monet ammattilaiset katsovat, ettei useita kiertoja tarvitse odottaa, ellei toisin neuvota.',
      'Valmiuden tunne, fyysisesti ja henkisesti, on edelleen tärkein ohjenuora.',
      'Lääketieteellinen seuranta voi tukea ja rauhoittaa sinua ennen uutta yritystä.',
    ],
    disclaimerText:
      'Tiedoksi tarkoitettua sisältöä. Tämä artikkeli ei korvaa henkilökohtaista lääketieteellistä neuvontaa. Lääkärisi tai kätilösi on edelleen tilanteesi ratkaiseva taho.',
    shareMessage: 'Hedelmällisyys ja uusi yritys menetyksen jälkeen — AWA',
  },
  el: {
    badge: 'ΜΕΤΑ ΑΠΟ ΑΠΟΒΟΛΗ • ΓΟΝΙΜΟΤΗΤΑ',
    title: 'Γονιμότητα και νέα προσπάθεια μετά από απώλεια',
    metaDuration: '6 λεπτά ανάγνωσης',
    metaType: 'Οδηγός',
    metaLevel: 'Μεσαίο',
    metaValidated: 'Ενημερωτικό περιεχόμενο',
    intro:
      'Πότε και πώς να σκεφτείς μια νέα προσπάθεια, με τον δικό σου ρυθμό και με πλήρη εμπιστοσύνη.',
    contentsTitle: 'Σε αυτό το άρθρο',
    topics: [
      'Η επιστροφή της γονιμότητας',
      'Τι λένε γενικά οι επαγγελματίες',
      'Νιώθοντας έτοιμη, με τον δικό σου ρυθμό',
      'Παρακολούθηση που μπορεί να σε καθησυχάσει',
      'Βασικά συμπεράσματα',
    ],
    body1:
      'Η γονιμότητα επιστρέφει συνήθως ήδη από τον κύκλο μετά από μια πρώιμη αποβολή. Η ωορρηξία μπορεί μάλιστα να συμβεί πριν επιστρέψει ορατά η περίοδός σου.',
    infoTitle: 'Βασικό συμπέρασμα',
    infoText:
      'Ανάλογα με το στάδιο της απώλειας, ο χρόνος σωματικής ανάρρωσης μπορεί να διαφέρει ελαφρά από περίπτωση σε περίπτωση.',
    body2:
      'Πολλοί επαγγελματίες θεωρούν ότι δεν χρειάζεται να περιμένεις αρκετούς κύκλους πριν προσπαθήσεις ξανά, εκτός αν ο γιατρός ή η μαία σου συμβουλεύσει διαφορετικά.',
    compareEarlyTitle: 'Πρώιμη απώλεια',
    compareEarlyText:
      'Η γονιμότητα επιστρέφει συχνά γρήγορα, ήδη από τον επόμενο κύκλο.',
    compareLateTitle: 'Μεταγενέστερη απώλεια',
    compareLateText:
      'Η ιατρική ομάδα μπορεί να συστήσει έναν ελαφρά μεγαλύτερο χρόνο ανάρρωσης.',
    body3:
      'Το να νιώθεις έτοιμη, σωματικά και συναισθηματικά, παραμένει ο πιο σημαντικός οδηγός — πολύ περισσότερο από οποιοδήποτε θεωρητικό χρονικό περιθώριο.',
    readinessPoints: [
      {
        title: 'Συναισθηματικά',
        text: 'Το να νιώθεις έτοιμη μέσα σου έχει τόση σημασία όση και η σωματική ανάρρωση.',
      },
      {
        title: 'Σωματικά',
        text: 'Ένας κανονικός κύκλος και ένα αίσθημα ευεξίας είναι καλοί δείκτες.',
      },
      {
        title: 'Ως ζευγάρι ή με στήριξη',
        text: 'Η συζήτηση με τον/την σύντροφό σου μπορεί να σε βοηθήσει να προχωρήσετε με τον ίδιο ρυθμό.',
      },
    ],
    body4:
      'Πριν προσπαθήσεις ξανά, ένα ιατρικό ραντεβού μπορεί να σε βοηθήσει να προχωρήσεις με περισσότερη ηρεμία:',
    followUpSteps: [
      {
        title: 'Απολογισμός',
        text: 'Μια συζήτηση με έναν επαγγελματία σου επιτρέπει να ξαναδείς όσα συνέβησαν.',
      },
      {
        title: 'Έλεγχος αν χρειάζεται',
        text: 'Ανάλογα με την περίπτωση, μπορεί να προταθούν επιπλέον εξετάσεις.',
      },
      {
        title: 'Μια νέα προσπάθεια',
        text: 'Η παρακολούθηση μπορεί τότε να σε στηρίξει ήρεμα καθώς προσπαθείς ξανά.',
      },
    ],
    tipTitle: 'Καλό είναι να γνωρίζεις',
    tipText:
      'Μια μεμονωμένη αποβολή γενικά δεν υποδεικνύει πρόβλημα γονιμότητας. Η ιατρική σου ομάδα παραμένει η καλύτερη για να απαντήσει στις προσωπικές σου ερωτήσεις.',
    summaryPoints: [
      'Η γονιμότητα επιστρέφει συνήθως ήδη από τον κύκλο μετά από μια πρώιμη αποβολή.',
      'Πολλοί επαγγελματίες θεωρούν ότι δεν χρειάζεται να περιμένεις αρκετούς κύκλους, εκτός αν συμβουλευτείς διαφορετικά.',
      'Το να νιώθεις έτοιμη, σωματικά και συναισθηματικά, παραμένει ο πιο σημαντικός οδηγός.',
      'Η ιατρική παρακολούθηση μπορεί να σε στηρίξει και να σε καθησυχάσει πριν προσπαθήσεις ξανά.',
    ],
    disclaimerText:
      'Ενημερωτικό περιεχόμενο. Αυτό το άρθρο δεν αντικαθιστά εξατομικευμένη ιατρική συμβουλή. Ο γιατρός ή η μαία σου παραμένει η αναφορά για την κατάστασή σου.',
    shareMessage: 'Γονιμότητα και νέα προσπάθεια μετά από απώλεια — AWA',
  },
  fil: {
    badge: 'PAGKATAPOS NG PAGKALAGLAG • PAGKAMAYABONG',
    title: 'Pagkamayabong at muling pagsubok pagkatapos ng pagkawala',
    metaDuration: '6 min na babasahin',
    metaType: 'Gabay',
    metaLevel: 'Katamtaman',
    metaValidated: 'Impormatibong nilalaman',
    intro:
      'Kailan at paano pag-isipan ang muling pagsubok, sa sarili mong bilis at may buong kumpiyansa.',
    contentsTitle: 'Sa artikulong ito',
    topics: [
      'Ang pagbabalik ng pagkamayabong',
      'Ang karaniwang sinasabi ng mga propesyonal',
      'Pakiramdam na handa ka na, sa sarili mong bilis',
      'Pagsubaybay na maaaring magpanatag sa iyo',
      'Mahahalagang tandaan',
    ],
    body1:
      'Karaniwang bumabalik ang pagkamayabong sa mismong siklong kasunod ng maagang pagkalaglag. Maaaring mangyari pa nga ang obulasyon bago kapansin-pansing bumalik ang iyong regla.',
    infoTitle: 'Mahalagang tandaan',
    infoText:
      'Depende sa yugto ng pagkawala, maaaring bahagyang mag-iba ang tagal ng pisikal na paggaling mula sa isang sitwasyon hanggang sa iba.',
    body2:
      'Maraming propesyonal ang naniniwalang hindi na kailangang maghintay ng ilang siklo bago muling sumubok, maliban kung ipayo ng iyong doktor o midwife ang kabaligtaran.',
    compareEarlyTitle: 'Maagang pagkawala',
    compareEarlyText:
      'Madalas na mabilis bumalik ang pagkamayabong, sa pinakamaaga ay sa susunod na siklo.',
    compareLateTitle: 'Mas huling pagkawala',
    compareLateText:
      'Maaaring irekomenda ng pangkat medikal ang bahagyang mas mahabang panahon ng paggaling.',
    body3:
      'Ang pakiramdam na handa ka na, sa pisikal at emosyonal na aspeto, ang nananatiling pinakamahalagang gabay — higit pa sa anumang teoretikal na takdang panahon.',
    readinessPoints: [
      {
        title: 'Sa emosyonal na aspeto',
        text: 'Kasing-halaga ng pisikal na paggaling ang pakiramdam na handa ka na sa sarili mo.',
      },
      {
        title: 'Sa pisikal na aspeto',
        text: 'Mabuting indikasyon ang regular na siklo at pakiramdam ng kagalingan.',
      },
      {
        title: 'Bilang mag-asawa o may suporta',
        text: 'Ang pag-uusap tungkol dito kasama ang iyong kapareha ay makakatulong na sabay kayong sumulong.',
      },
    ],
    body4:
      'Bago muling sumubok, makakatulong ang medikal na appointment para sumulong nang may mas payapang kalooban:',
    followUpSteps: [
      {
        title: 'Pagsusuri ng sitwasyon',
        text: 'Ang pakikipag-usap sa propesyonal ay nagpapahintulot na balikan ang nangyari.',
      },
      {
        title: 'Pagsusuri kung kinakailangan',
        text: 'Depende sa sitwasyon, maaaring ialok ang karagdagang mga test.',
      },
      {
        title: 'Isang bagong pagsubok',
        text: 'Mahinahon kang masusuportahan ng pagsubaybay habang muling sumusubok.',
      },
    ],
    tipTitle: 'Mabuting malaman',
    tipText:
      'Karaniwang hindi nagpapahiwatig ng problema sa pagkamayabong ang nag-iisang pagkalaglag. Ang iyong pangkat medikal ang pinakamainam na makasagot sa iyong mga personal na tanong.',
    summaryPoints: [
      'Karaniwang bumabalik ang pagkamayabong sa mismong siklong kasunod ng maagang pagkalaglag.',
      'Maraming propesyonal ang naniniwalang hindi na kailangang maghintay ng ilang siklo, maliban kung ipayo ang kabaligtaran.',
      'Ang pakiramdam na handa ka na, sa pisikal at emosyonal na aspeto, ang nananatiling pinakamahalagang gabay.',
      'Ang medikal na pagsubaybay ay maaaring sumuporta at magpanatag sa iyo bago muling sumubok.',
    ],
    disclaimerText:
      'Impormatibong nilalaman. Hindi pumapalit ang artikulong ito sa personalisadong payong medikal. Ang iyong doktor o midwife ang nananatiling sanggunian para sa iyong sitwasyon.',
    shareMessage: 'Pagkamayabong at muling pagsubok pagkatapos ng pagkawala — AWA',
  },
  ta: {
    badge: 'கருச்சிதைவுக்குப் பின் • கருவுறுதிறன்',
    title: 'இழப்புக்குப் பின் கருவுறுதிறனும் மீண்டும் முயற்சியும்',
    metaDuration: '6 நிமிடம் படிக்க',
    metaType: 'வழிகாட்டி',
    metaLevel: 'இடைநிலை',
    metaValidated: 'தகவல் உள்ளடக்கம்',
    intro:
      'மீண்டும் முயல்வதைப் பற்றி எப்போது, எப்படிச் சிந்திப்பது, உங்கள் சொந்த வேகத்தில், முழு நம்பிக்கையுடன்.',
    contentsTitle: 'இந்தக் கட்டுரையில்',
    topics: [
      'கருவுறுதிறன் திரும்புதல்',
      'நிபுணர்கள் பொதுவாகச் சொல்வது',
      'தயாராக உணருதல், உங்கள் சொந்த வேகத்தில்',
      'உங்களுக்கு ஆறுதல் தரக்கூடிய பின்தொடர்தல் பராமரிப்பு',
      'முக்கியக் குறிப்புகள்',
    ],
    body1:
      'கருவுறுதிறன் பொதுவாக ஆரம்பக் கருச்சிதைவுக்குப் பின் வரும் சுழற்சியிலேயே திரும்புகிறது. உங்கள் மாதவிடாய் கண்கூடாகத் திரும்புவதற்கு முன்பே அண்டவிடுப்பு நிகழக்கூடும்.',
    infoTitle: 'முக்கியக் குறிப்பு',
    infoText:
      'இழப்பின் கட்டத்தைப் பொறுத்து, உடல் மீட்சிக் காலம் ஒரு சூழ்நிலையிலிருந்து மற்றொன்றுக்குச் சிறிது மாறுபடலாம்.',
    body2:
      'உங்கள் மருத்துவர் அல்லது மருத்துவச்சி வேறுவிதமாக ஆலோசனை கூறாத வரை, மீண்டும் முயல்வதற்கு முன் பல சுழற்சிகள் காத்திருக்கத் தேவையில்லை என்று பல நிபுணர்கள் கருதுகிறார்கள்.',
    compareEarlyTitle: 'ஆரம்ப இழப்பு',
    compareEarlyText:
      'கருவுறுதிறன் பெரும்பாலும் விரைவாக, அடுத்த சுழற்சியிலேயே திரும்புகிறது.',
    compareLateTitle: 'பிந்தைய இழப்பு',
    compareLateText:
      'சற்று நீண்ட மீட்சிக் காலத்தை மருத்துவக் குழு பரிந்துரைக்கலாம்.',
    body3:
      'உடலளவிலும் உணர்வளவிலும் தயாராக உணர்வதே மிக முக்கியமான வழிகாட்டியாக இருக்கும் — எந்தக் கோட்பாட்டுக் கால அளவையும் விட மிக அதிகமாக.',
    readinessPoints: [
      {
        title: 'உணர்வளவில்',
        text: 'உங்களுக்குள் தயாராக உணர்வது உடல் மீட்சியைப் போலவே முக்கியம்.',
      },
      {
        title: 'உடலளவில்',
        text: 'ஒழுங்கான சுழற்சியும் நலம் குறித்த உணர்வும் நல்ல குறிகாட்டிகள்.',
      },
      {
        title: 'தம்பதியாக அல்லது ஆதரவுடன்',
        text: 'உங்கள் துணையுடன் இதைப் பற்றிப் பேசுவது ஒரே வேகத்தில் முன்னேற உங்களுக்கு உதவலாம்.',
      },
    ],
    body4:
      'மீண்டும் முயல்வதற்கு முன், ஒரு மருத்துவ சந்திப்பு அதிக மன அமைதியுடன் முன்னேற உங்களுக்கு உதவலாம்:',
    followUpSteps: [
      {
        title: 'நிலையை மதிப்பிடுதல்',
        text: 'ஒரு நிபுணருடனான உரையாடல் நடந்ததை மீண்டும் பார்க்க உங்களை அனுமதிக்கிறது.',
      },
      {
        title: 'தேவைப்பட்டால் ஒரு மதிப்பீடு',
        text: 'சூழ்நிலையைப் பொறுத்து, கூடுதல் பரிசோதனைகள் வழங்கப்படலாம்.',
      },
      {
        title: 'ஒரு புதிய முயற்சி',
        text: 'பின்தொடர்தல் பராமரிப்பு பின்னர் நீங்கள் மீண்டும் முயலும்போது அமைதியாக உங்களுக்குத் துணையாக இருக்கலாம்.',
      },
    ],
    tipTitle: 'தெரிந்துகொள்ளுங்கள்',
    tipText:
      'ஒரு தனிப்பட்ட கருச்சிதைவு பொதுவாக கருவுறுதிறன் பிரச்சினையைக் குறிப்பதில்லை. உங்கள் தனிப்பட்ட கேள்விகளுக்குப் பதிலளிக்க உங்கள் மருத்துவக் குழுவே சிறந்த நிலையில் உள்ளது.',
    summaryPoints: [
      'கருவுறுதிறன் பொதுவாக ஆரம்பக் கருச்சிதைவுக்குப் பின் வரும் சுழற்சியிலேயே திரும்புகிறது.',
      'வேறுவிதமாக ஆலோசனை கூறப்படாத வரை, பல சுழற்சிகள் காத்திருக்கத் தேவையில்லை என்று பல நிபுணர்கள் கருதுகிறார்கள்.',
      'உடலளவிலும் உணர்வளவிலும் தயாராக உணர்வதே மிக முக்கியமான வழிகாட்டியாக இருக்கிறது.',
      'மீண்டும் முயல்வதற்கு முன் மருத்துவப் பின்தொடர்தல் உங்களுக்குத் துணையாகவும் ஆறுதலாகவும் இருக்கலாம்.',
    ],
    disclaimerText:
      'தகவல் உள்ளடக்கம். இந்தக் கட்டுரை தனிப்பயன் மருத்துவ ஆலோசனைக்கு மாற்றல்ல. உங்கள் சூழ்நிலைக்கு உங்கள் மருத்துவர் அல்லது மருத்துவச்சியே சான்றாக இருக்கிறார்.',
    shareMessage: 'இழப்புக்குப் பின் கருவுறுதிறனும் மீண்டும் முயற்சியும் — AWA',
  },
  te: {
    badge: 'గర్భస్రావం తర్వాత • సారవంతత',
    title: 'గర్భస్రావం తర్వాత సారవంతత & మళ్లీ ప్రయత్నించడం',
    metaDuration: '6 నిమిషాల పఠనం',
    metaType: 'గైడ్',
    metaLevel: 'మధ్యస్థ స్థాయి',
    metaValidated: 'సమాచార కంటెంట్',
    intro:
      'మళ్లీ ప్రయత్నించడం గురించి ఎప్పుడు, ఎలా ఆలోచించాలి, మీ సొంత వేగంలో, పూర్తి నమ్మకంతో.',
    contentsTitle: 'ఈ వ్యాసంలో',
    topics: [
      'సారవంతత తిరిగి రావడం',
      'నిపుణులు సాధారణంగా ఏం చెబుతారు',
      'మీ సొంత వేగంలో సిద్ధంగా అనిపించడం',
      'మీకు ధైర్యం ఇవ్వగల తదుపరి పర్యవేక్షణ',
      'ముఖ్యాంశాలు',
    ],
    body1:
      'ప్రారంభ గర్భస్రావం తర్వాతి చక్రం నుండే సారవంతత సాధారణంగా తిరిగి వస్తుంది. నెలసరి స్పష్టంగా తిరిగి రాకముందే అండోత్సర్గం కూడా జరగవచ్చు.',
    infoTitle: 'ముఖ్య సారాంశం',
    infoText:
      'నష్టం జరిగిన దశను బట్టి, శారీరక కోలుకునే సమయం ఒక పరిస్థితి నుండి మరొకదానికి కొద్దిగా మారవచ్చు.',
    body2:
      'మీ వైద్యులు లేదా మంత్రసాని వేరుగా సలహా ఇస్తే తప్ప, మళ్లీ ప్రయత్నించే ముందు అనేక చక్రాలు వేచి ఉండాల్సిన అవసరం లేదని చాలా మంది నిపుణులు భావిస్తారు.',
    compareEarlyTitle: 'ప్రారంభ నష్టం',
    compareEarlyText:
      'సారవంతత తరచుగా వేగంగా, తర్వాతి చక్రం నుండే తిరిగి వస్తుంది.',
    compareLateTitle: 'తర్వాతి దశలో నష్టం',
    compareLateText:
      'వైద్య బృందం కొద్దిగా ఎక్కువ కోలుకునే సమయాన్ని సిఫార్సు చేయవచ్చు.',
    body3:
      'శారీరకంగా, భావోద్వేగపరంగా సిద్ధంగా అనిపించడమే అత్యంత ముఖ్యమైన మార్గదర్శకం — ఏ సైద్ధాంతిక కాలపరిమితి కంటే చాలా ఎక్కువగా.',
    readinessPoints: [
      {
        title: 'భావోద్వేగపరంగా',
        text: 'మీలో మీరు సిద్ధంగా అనిపించడం శారీరక కోలుకోవడంతో సమానంగా ముఖ్యం.',
      },
      {
        title: 'శారీరకంగా',
        text: 'క్రమబద్ధమైన చక్రం, శ్రేయస్సు భావన మంచి సూచికలు.',
      },
      {
        title: 'దంపతులుగా లేదా తోడ్పాటుతో',
        text: 'మీ భాగస్వామితో దీని గురించి మాట్లాడటం ఒకే వేగంలో ముందుకు సాగడానికి సహాయపడగలదు.',
      },
    ],
    body4:
      'మళ్లీ ప్రయత్నించే ముందు, ఒక వైద్య అపాయింట్‌మెంట్ మరింత మనశ్శాంతితో ముందుకు సాగడానికి సహాయపడగలదు:',
    followUpSteps: [
      {
        title: 'సమీక్షించుకోవడం',
        text: 'ఒక నిపుణుడితో సంభాషణ జరిగిన దాన్ని తిరిగి చూసుకోవడానికి మీకు వీలు కల్పిస్తుంది.',
      },
      {
        title: 'అవసరమైతే ఒక మదింపు',
        text: 'పరిస్థితిని బట్టి, అదనపు పరీక్షలు సూచించబడవచ్చు.',
      },
      {
        title: 'ఒక కొత్త ప్రయత్నం',
        text: 'అప్పుడు తదుపరి పర్యవేక్షణ మీరు మళ్లీ ప్రయత్నిస్తున్నప్పుడు ప్రశాంతంగా మీకు తోడ్పడగలదు.',
      },
    ],
    tipTitle: 'తెలుసుకోవాల్సినవి',
    tipText:
      'ఒక వేరు గర్భస్రావం సాధారణంగా సారవంతత సమస్యను సూచించదు. మీ వ్యక్తిగత ప్రశ్నలకు సమాధానం చెప్పడానికి మీ వైద్య బృందమే ఉత్తమ స్థానంలో ఉంది.',
    summaryPoints: [
      'ప్రారంభ గర్భస్రావం తర్వాతి చక్రం నుండే సారవంతత సాధారణంగా తిరిగి వస్తుంది.',
      'వేరుగా సలహా ఇవ్వకపోతే, అనేక చక్రాలు వేచి ఉండాల్సిన అవసరం లేదని చాలా మంది నిపుణులు భావిస్తారు.',
      'శారీరకంగా, భావోద్వేగపరంగా సిద్ధంగా అనిపించడమే అత్యంత ముఖ్యమైన మార్గదర్శకం.',
      'వైద్య పర్యవేక్షణ మళ్లీ ప్రయత్నించే ముందు మీకు తోడ్పడి ధైర్యం ఇవ్వగలదు.',
    ],
    disclaimerText:
      'సమాచార కంటెంట్. ఈ వ్యాసం వ్యక్తిగత వైద్య సలహాకు ప్రత్యామ్నాయం కాదు. మీ పరిస్థితికి మీ వైద్యులు లేదా మంత్రసానియే ప్రమాణం.',
    shareMessage: 'గర్భస్రావం తర్వాత సారవంతత & మళ్లీ ప్రయత్నించడం — AWA',
  },
  mr: {
    badge: 'गर्भपातानंतर • सुपीकता',
    title: 'नुकसानानंतर सुपीकता आणि पुन्हा प्रयत्न',
    metaDuration: '6 मिनिटे वाचन',
    metaType: 'मार्गदर्शक',
    metaLevel: 'मध्यम स्तर',
    metaValidated: 'माहितीपर मजकूर',
    intro:
      'पुन्हा प्रयत्न करण्याचा विचार केव्हा आणि कसा करावा, तुमच्या गतीने आणि पूर्ण आत्मविश्वासाने.',
    contentsTitle: 'या लेखात',
    topics: [
      'सुपीकता परत येणे',
      'तज्ज्ञ साधारणपणे काय सांगतात',
      'तुमच्या गतीने तयार वाटणे',
      'तुम्हाला दिलासा देऊ शकणारा पाठपुरावा',
      'मुख्य मुद्दे',
    ],
    body1:
      'लवकरच्या गर्भपातानंतरच्या पाळीतच सुपीकता सहसा परत येते. तुमची पाळी स्पष्टपणे परत येण्यापूर्वीही बीजोत्सर्जन होऊ शकते.',
    infoTitle: 'मुख्य मुद्दा',
    infoText:
      'नुकसानाच्या टप्प्यानुसार, शारीरिक पुनर्प्राप्तीचा कालावधी एका परिस्थितीपासून दुसऱ्या परिस्थितीपर्यंत थोडा बदलू शकतो.',
    body2:
      'तुमचे डॉक्टर किंवा दाई वेगळा सल्ला देत नाहीत तोपर्यंत, पुन्हा प्रयत्न करण्यापूर्वी अनेक पाळ्या थांबण्याची गरज नाही असे अनेक तज्ज्ञ मानतात.',
    compareEarlyTitle: 'लवकरचे नुकसान',
    compareEarlyText:
      'सुपीकता बहुतेकदा लवकर, पुढच्याच पाळीत परत येते.',
    compareLateTitle: 'नंतरचे नुकसान',
    compareLateText:
      'वैद्यकीय पथक थोडा जास्त पुनर्प्राप्तीचा कालावधी सुचवू शकते.',
    body3:
      'शारीरिक आणि भावनिकदृष्ट्या तयार वाटणे हाच सर्वात महत्त्वाचा मार्गदर्शक राहतो — कोणत्याही सैद्धांतिक कालमर्यादेपेक्षा खूप जास्त.',
    readinessPoints: [
      {
        title: 'भावनिकदृष्ट्या',
        text: 'आतून तयार वाटणे शारीरिक पुनर्प्राप्तीइतकेच महत्त्वाचे आहे.',
      },
      {
        title: 'शारीरिकदृष्ट्या',
        text: 'नियमित पाळी आणि सुदृढतेची भावना ही चांगली निर्देशक आहेत.',
      },
      {
        title: 'जोडपे म्हणून किंवा आधारासह',
        text: 'जोडीदाराशी याबद्दल बोलल्याने तुम्हाला एकाच गतीने पुढे जाण्यास मदत होऊ शकते.',
      },
    ],
    body4:
      'पुन्हा प्रयत्न करण्यापूर्वी, वैद्यकीय भेट तुम्हाला अधिक निश्चिंत मनाने पुढे जाण्यास मदत करू शकते:',
    followUpSteps: [
      {
        title: 'आढावा घेणे',
        text: 'तज्ज्ञासोबतचे संभाषण तुम्हाला जे घडले त्याकडे पुन्हा पाहण्याची संधी देते.',
      },
      {
        title: 'गरज असल्यास तपासणी',
        text: 'परिस्थितीनुसार, अतिरिक्त चाचण्या सुचवल्या जाऊ शकतात.',
      },
      {
        title: 'नवीन प्रयत्न',
        text: 'पाठपुरावा मग तुम्ही पुन्हा प्रयत्न करताना शांतपणे तुम्हाला साथ देऊ शकतो.',
      },
    ],
    tipTitle: 'हे जाणून घ्या',
    tipText:
      'एकच गर्भपात सहसा सुपीकतेची समस्या दर्शवत नाही. तुमचे वैद्यकीय पथक तुमच्या वैयक्तिक प्रश्नांची उत्तरे देण्यासाठी सर्वोत्तम स्थानी असते.',
    summaryPoints: [
      'लवकरच्या गर्भपातानंतरच्या पाळीतच सुपीकता सहसा परत येते.',
      'वेगळा सल्ला न मिळाल्यास, अनेक पाळ्या थांबण्याची गरज नाही असे अनेक तज्ज्ञ मानतात.',
      'शारीरिक आणि भावनिकदृष्ट्या तयार वाटणे हाच सर्वात महत्त्वाचा मार्गदर्शक राहतो.',
      'पुन्हा प्रयत्न करण्यापूर्वी वैद्यकीय पाठपुरावा तुम्हाला साथ आणि दिलासा देऊ शकतो.',
    ],
    disclaimerText:
      'माहितीपर मजकूर. हा लेख वैयक्तिक वैद्यकीय सल्ल्याची जागा घेत नाही. तुमची परिस्थिती समजण्यासाठी तुमचे डॉक्टर किंवा दाई हाच संदर्भ राहतो.',
    shareMessage: 'नुकसानानंतर सुपीकता आणि पुन्हा प्रयत्न — AWA',
  },
  gu: {
    badge: 'ગર્ભપાત પછી • ફળદ્રુપતા',
    title: 'ગર્ભાવસ્થાના નુકસાન પછી ફળદ્રુપતા અને ફરી પ્રયત્ન',
    metaDuration: '6 મિનિટ વાંચન',
    metaType: 'માર્ગદર્શિકા',
    metaLevel: 'મધ્યમ સ્તર',
    metaValidated: 'માહિતી માટેની સામગ્રી',
    intro:
      'ફરી પ્રયત્ન કરવા વિશે ક્યારે અને કેવી રીતે વિચારવું, તમારી પોતાની ગતિએ અને પૂરા વિશ્વાસ સાથે.',
    contentsTitle: 'આ લેખમાં',
    topics: [
      'ફળદ્રુપતાનું પાછું આવવું',
      'વ્યાવસાયિકો સામાન્ય રીતે શું કહે છે',
      'તૈયાર લાગવું, તમારી પોતાની ગતિએ',
      'ફોલો-અપ સંભાળ જે તમને આશ્વાસન આપી શકે',
      'મુખ્ય મુદ્દા',
    ],
    body1:
      'શરૂઆતના ગર્ભપાત પછી ફળદ્રુપતા સામાન્ય રીતે પછીના જ ચક્રમાં પાછી આવી શકે છે. તમારું માસિક દેખીતી રીતે પાછું આવે તે પહેલાં પણ અંડોત્સર્જન થઈ શકે છે.',
    infoTitle: 'મુખ્ય મુદ્દો',
    infoText:
      'નુકસાનના તબક્કા પ્રમાણે, શારીરિક રીતે સ્વસ્થ થવાનો સમય એક પરિસ્થિતિથી બીજી પરિસ્થિતિમાં થોડો અલગ હોઈ શકે છે.',
    body2:
      'ઘણા વ્યાવસાયિકો માને છે કે ફરી પ્રયત્ન કરતા પહેલાં ઘણા ચક્ર રાહ જોવાની જરૂર નથી, સિવાય કે તમારા ડૉક્ટર કે મિડવાઇફ બીજી સલાહ આપે.',
    compareEarlyTitle: 'શરૂઆતનું નુકસાન',
    compareEarlyText:
      'ફળદ્રુપતા ઘણી વાર ઝડપથી, પછીના જ ચક્રમાં પાછી આવે છે.',
    compareLateTitle: 'પાછળથી થયેલું નુકસાન',
    compareLateText:
      'તબીબી ટીમ થોડો વધુ સ્વસ્થ થવાનો સમય સૂચવી શકે છે.',
    body3:
      'શારીરિક અને ભાવનાત્મક રીતે તૈયાર લાગવું એ સૌથી મહત્વનું માર્ગદર્શક છે — કોઈપણ સૈદ્ધાંતિક સમયમર્યાદા કરતાં ઘણું વધુ.',
    readinessPoints: [
      {
        title: 'ભાવનાત્મક રીતે',
        text: 'અંદરથી તૈયાર લાગવું એ શારીરિક રીતે સ્વસ્થ થવા જેટલું જ મહત્વનું છે.',
      },
      {
        title: 'શારીરિક રીતે',
        text: 'નિયમિત ચક્ર અને સારું લાગવું એ સારા સંકેતો છે.',
      },
      {
        title: 'દંપતી તરીકે અથવા સહાય સાથે',
        text: 'તમારા જીવનસાથી સાથે તેના વિશે વાત કરવાથી તમે એક જ ગતિએ આગળ વધી શકો છો.',
      },
    ],
    body4:
      'ફરી પ્રયત્ન કરતા પહેલાં, તબીબી મુલાકાત તમને વધુ મનની શાંતિ સાથે આગળ વધવામાં મદદ કરી શકે છે:',
    followUpSteps: [
      {
        title: 'સ્થિતિ સમજવી',
        text: 'વ્યાવસાયિક સાથેની વાતચીત તમને જે બન્યું તેને ફરી સમજવાની તક આપે છે.',
      },
      {
        title: 'જરૂર પડે તો તપાસ',
        text: 'પરિસ્થિતિ પ્રમાણે, વધારાના પરીક્ષણો સૂચવવામાં આવી શકે છે.',
      },
      {
        title: 'નવો પ્રયત્ન',
        text: 'ત્યારપછી ફોલો-અપ સંભાળ તમે ફરી પ્રયત્ન કરો ત્યારે શાંતિથી તમને સાથ આપી શકે છે.',
      },
    ],
    tipTitle: 'જાણવા જેવું',
    tipText:
      'એકલ ગર્ભપાત સામાન્ય રીતે ફળદ્રુપતાની સમસ્યા દર્શાવતો નથી. તમારા વ્યક્તિગત પ્રશ્નોના જવાબ આપવા માટે તમારી તબીબી ટીમ સૌથી યોગ્ય છે.',
    summaryPoints: [
      'શરૂઆતના ગર્ભપાત પછી ફળદ્રુપતા સામાન્ય રીતે પછીના જ ચક્રમાં પાછી આવી શકે છે.',
      'ઘણા વ્યાવસાયિકો માને છે કે સિવાય કે અન્ય સલાહ મળે, ઘણા ચક્ર રાહ જોવાની જરૂર નથી.',
      'શારીરિક અને ભાવનાત્મક રીતે તૈયાર લાગવું એ સૌથી મહત્વનું માર્ગદર્શક રહે છે.',
      'ફરી પ્રયત્ન કરતા પહેલાં તબીબી ફોલો-અપ તમને સાથ અને આશ્વાસન આપી શકે છે.',
    ],
    disclaimerText:
      'માહિતી માટેની સામગ્રી. આ લેખ વ્યક્તિગત તબીબી સલાહનું સ્થાન લેતો નથી. તમારી પરિસ્થિતિ માટે તમારા ડૉક્ટર કે મિડવાઇફ જ સંદર્ભ રહે છે.',
    shareMessage: 'ગર્ભાવસ્થાના નુકસાન પછી ફળદ્રુપતા અને ફરી પ્રયત્ન — AWA',
  },
  pa: {
    badge: 'ਗਰਭਪਾਤ ਤੋਂ ਬਾਅਦ • ਉਪਜਾਊ ਸ਼ਕਤੀ',
    title: 'ਨੁਕਸਾਨ ਤੋਂ ਬਾਅਦ ਉਪਜਾਊ ਸ਼ਕਤੀ ਅਤੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰਨਾ',
    metaDuration: '6 ਮਿੰਟ ਪੜ੍ਹਨ',
    metaType: 'ਗਾਈਡ',
    metaLevel: 'ਦਰਮਿਆਨਾ ਪੱਧਰ',
    metaValidated: 'ਜਾਣਕਾਰੀ ਵਾਲੀ ਸਮੱਗਰੀ',
    intro:
      'ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰਨ ਬਾਰੇ ਕਦੋਂ ਅਤੇ ਕਿਵੇਂ ਸੋਚਣਾ ਹੈ, ਆਪਣੀ ਰਫ਼ਤਾਰ ਨਾਲ ਅਤੇ ਪੂਰੇ ਭਰੋਸੇ ਨਾਲ।',
    contentsTitle: 'ਇਸ ਲੇਖ ਵਿੱਚ',
    topics: [
      'ਉਪਜਾਊ ਸ਼ਕਤੀ ਦਾ ਮੁੜ ਆਉਣਾ',
      'ਮਾਹਿਰ ਆਮ ਤੌਰ ਤੇ ਕੀ ਕਹਿੰਦੇ ਹਨ',
      'ਤਿਆਰ ਮਹਿਸੂਸ ਕਰਨਾ, ਆਪਣੀ ਰਫ਼ਤਾਰ ਨਾਲ',
      'ਫ਼ਾਲੋ-ਅੱਪ ਦੇਖਭਾਲ ਜੋ ਤੁਹਾਨੂੰ ਤਸੱਲੀ ਦੇ ਸਕਦੀ ਹੈ',
      'ਮੁੱਖ ਨੁਕਤੇ',
    ],
    body1:
      'ਉਪਜਾਊ ਸ਼ਕਤੀ ਆਮ ਤੌਰ ਤੇ ਸ਼ੁਰੂਆਤੀ ਗਰਭਪਾਤ ਤੋਂ ਬਾਅਦ ਅਗਲੇ ਚੱਕਰ ਵਿੱਚ ਹੀ ਮੁੜ ਆ ਜਾਂਦੀ ਹੈ। ਓਵੂਲੇਸ਼ਨ ਤਾਂ ਮਾਹਵਾਰੀ ਦੇ ਸਾਫ਼ ਮੁੜ ਆਉਣ ਤੋਂ ਪਹਿਲਾਂ ਵੀ ਹੋ ਸਕਦਾ ਹੈ।',
    infoTitle: 'ਮੁੱਖ ਨੁਕਤਾ',
    infoText:
      'ਨੁਕਸਾਨ ਦੇ ਪੜਾਅ ਅਨੁਸਾਰ, ਸਰੀਰਕ ਤੌਰ ਤੇ ਠੀਕ ਹੋਣ ਦਾ ਸਮਾਂ ਇੱਕ ਸਥਿਤੀ ਤੋਂ ਦੂਜੀ ਵਿੱਚ ਥੋੜ੍ਹਾ ਵੱਖਰਾ ਹੋ ਸਕਦਾ ਹੈ।',
    body2:
      'ਬਹੁਤ ਸਾਰੇ ਮਾਹਿਰ ਮੰਨਦੇ ਹਨ ਕਿ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ ਕਈ ਚੱਕਰ ਉਡੀਕਣ ਦੀ ਲੋੜ ਨਹੀਂ, ਜਦੋਂ ਤੱਕ ਤੁਹਾਡਾ ਡਾਕਟਰ ਜਾਂ ਮਿਡਵਾਈਫ਼ ਹੋਰ ਸਲਾਹ ਨਾ ਦੇਵੇ।',
    compareEarlyTitle: 'ਸ਼ੁਰੂਆਤੀ ਨੁਕਸਾਨ',
    compareEarlyText:
      'ਉਪਜਾਊ ਸ਼ਕਤੀ ਅਕਸਰ ਜਲਦੀ ਮੁੜ ਆ ਜਾਂਦੀ ਹੈ, ਅਗਲੇ ਚੱਕਰ ਵਿੱਚ ਹੀ।',
    compareLateTitle: 'ਬਾਅਦ ਦੇ ਪੜਾਅ ਦਾ ਨੁਕਸਾਨ',
    compareLateText:
      'ਡਾਕਟਰੀ ਟੀਮ ਠੀਕ ਹੋਣ ਲਈ ਥੋੜ੍ਹਾ ਲੰਮਾ ਸਮਾਂ ਸੁਝਾ ਸਕਦੀ ਹੈ।',
    body3:
      'ਸਰੀਰਕ ਅਤੇ ਭਾਵਨਾਤਮਕ ਤੌਰ ਤੇ ਤਿਆਰ ਮਹਿਸੂਸ ਕਰਨਾ ਸਭ ਤੋਂ ਮਹੱਤਵਪੂਰਨ ਮਾਰਗਦਰਸ਼ਕ ਰਹਿੰਦਾ ਹੈ — ਕਿਸੇ ਵੀ ਸਿਧਾਂਤਕ ਸਮਾਂ-ਸੀਮਾ ਨਾਲੋਂ ਕਿਤੇ ਵੱਧ।',
    readinessPoints: [
      {
        title: 'ਭਾਵਨਾਤਮਕ ਤੌਰ ਤੇ',
        text: 'ਆਪਣੇ ਅੰਦਰੋਂ ਤਿਆਰ ਮਹਿਸੂਸ ਕਰਨਾ ਸਰੀਰਕ ਤੌਰ ਤੇ ਠੀਕ ਹੋਣ ਜਿੰਨਾ ਹੀ ਮਾਇਨੇ ਰੱਖਦਾ ਹੈ।',
      },
      {
        title: 'ਸਰੀਰਕ ਤੌਰ ਤੇ',
        text: 'ਨਿਯਮਿਤ ਚੱਕਰ ਅਤੇ ਤੰਦਰੁਸਤੀ ਦਾ ਅਹਿਸਾਸ ਚੰਗੇ ਸੰਕੇਤ ਹਨ।',
      },
      {
        title: 'ਜੋੜੇ ਵਜੋਂ ਜਾਂ ਸਹਾਰੇ ਨਾਲ',
        text: 'ਆਪਣੇ ਸਾਥੀ ਨਾਲ ਇਸ ਬਾਰੇ ਗੱਲ ਕਰਨ ਨਾਲ ਤੁਸੀਂ ਇੱਕੋ ਰਫ਼ਤਾਰ ਨਾਲ ਅੱਗੇ ਵਧ ਸਕਦੇ ਹੋ।',
      },
    ],
    body4:
      'ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ, ਡਾਕਟਰੀ ਮੁਲਾਕਾਤ ਤੁਹਾਨੂੰ ਵਧੇਰੇ ਮਨ ਦੀ ਸ਼ਾਂਤੀ ਨਾਲ ਅੱਗੇ ਵਧਣ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦੀ ਹੈ:',
    followUpSteps: [
      {
        title: 'ਹਾਲਾਤ ਦਾ ਜਾਇਜ਼ਾ',
        text: 'ਕਿਸੇ ਮਾਹਿਰ ਨਾਲ ਗੱਲਬਾਤ ਤੁਹਾਨੂੰ ਜੋ ਵਾਪਰਿਆ ਉਸ ਨੂੰ ਮੁੜ ਵੇਖਣ ਦਾ ਮੌਕਾ ਦਿੰਦੀ ਹੈ।',
      },
      {
        title: 'ਲੋੜ ਪੈਣ ਤੇ ਜਾਂਚ',
        text: 'ਸਥਿਤੀ ਅਨੁਸਾਰ, ਵਾਧੂ ਟੈਸਟ ਸੁਝਾਏ ਜਾ ਸਕਦੇ ਹਨ।',
      },
      {
        title: 'ਨਵੀਂ ਕੋਸ਼ਿਸ਼',
        text: 'ਫ਼ਾਲੋ-ਅੱਪ ਦੇਖਭਾਲ ਫਿਰ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰਦਿਆਂ ਸ਼ਾਂਤੀ ਨਾਲ ਤੁਹਾਡਾ ਸਾਥ ਦੇ ਸਕਦੀ ਹੈ।',
      },
    ],
    tipTitle: 'ਜਾਣਨ ਯੋਗ',
    tipText:
      'ਇੱਕ ਇਕੱਲਾ ਗਰਭਪਾਤ ਆਮ ਤੌਰ ਤੇ ਉਪਜਾਊ ਸ਼ਕਤੀ ਦੀ ਸਮੱਸਿਆ ਨੂੰ ਨਹੀਂ ਦਰਸਾਉਂਦਾ। ਤੁਹਾਡੇ ਨਿੱਜੀ ਸਵਾਲਾਂ ਦੇ ਜਵਾਬ ਦੇਣ ਲਈ ਤੁਹਾਡੀ ਡਾਕਟਰੀ ਟੀਮ ਸਭ ਤੋਂ ਵਧੀਆ ਥਾਂ ਤੇ ਹੈ।',
    summaryPoints: [
      'ਉਪਜਾਊ ਸ਼ਕਤੀ ਆਮ ਤੌਰ ਤੇ ਸ਼ੁਰੂਆਤੀ ਗਰਭਪਾਤ ਤੋਂ ਬਾਅਦ ਅਗਲੇ ਚੱਕਰ ਵਿੱਚ ਹੀ ਮੁੜ ਆ ਜਾਂਦੀ ਹੈ।',
      'ਬਹੁਤ ਸਾਰੇ ਮਾਹਿਰ ਮੰਨਦੇ ਹਨ ਕਿ ਕਈ ਚੱਕਰ ਉਡੀਕਣ ਦੀ ਲੋੜ ਨਹੀਂ, ਜਦੋਂ ਤੱਕ ਹੋਰ ਸਲਾਹ ਨਾ ਦਿੱਤੀ ਜਾਵੇ।',
      'ਸਰੀਰਕ ਅਤੇ ਭਾਵਨਾਤਮਕ ਤੌਰ ਤੇ ਤਿਆਰ ਮਹਿਸੂਸ ਕਰਨਾ ਸਭ ਤੋਂ ਮਹੱਤਵਪੂਰਨ ਮਾਰਗਦਰਸ਼ਕ ਰਹਿੰਦਾ ਹੈ।',
      'ਡਾਕਟਰੀ ਫ਼ਾਲੋ-ਅੱਪ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ ਤੁਹਾਨੂੰ ਸਹਾਰਾ ਅਤੇ ਤਸੱਲੀ ਦੇ ਸਕਦਾ ਹੈ।',
    ],
    disclaimerText:
      'ਇਹ ਜਾਣਕਾਰੀ ਲਈ ਹੈ ਅਤੇ ਨਿੱਜੀ ਡਾਕਟਰੀ ਸਲਾਹ ਦੀ ਥਾਂ ਨਹੀਂ ਲੈਂਦੀ। ਤੁਹਾਡੀ ਸਥਿਤੀ ਲਈ ਤੁਹਾਡਾ ਡਾਕਟਰ ਜਾਂ ਮਿਡਵਾਈਫ਼ ਹੀ ਹਵਾਲਾ ਰਹਿੰਦਾ ਹੈ।',
    shareMessage: 'ਨੁਕਸਾਨ ਤੋਂ ਬਾਅਦ ਉਪਜਾਊ ਸ਼ਕਤੀ ਅਤੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰਨਾ — AWA',
  },
  my: {
    badge: 'ကိုယ်ဝန်ပျက်ကျပြီးနောက် • သန္ဓေတည်နိုင်စွမ်း',
    title: 'ဆုံးရှုံးပြီးနောက် သန္ဓေတည်နိုင်စွမ်းနှင့် ပြန်လည်ကြိုးစားခြင်း',
    metaDuration: 'ဖတ်ချိန် 6 မိနစ်',
    metaType: 'လမ်းညွှန်',
    metaLevel: 'အလယ်အလတ်အဆင့်',
    metaValidated: 'အချက်အလက်ပေးသော အကြောင်းအရာ',
    intro:
      'ပြန်လည်ကြိုးစားခြင်းအကြောင်း မည်သည့်အချိန်နှင့် မည်သို့စဉ်းစားရမည်ကို သင့်ကိုယ်ပိုင်အရှိန်ဖြင့် အပြည့်အဝယုံကြည်စိတ်ချစွာ။',
    contentsTitle: 'ဤဆောင်းပါးတွင်',
    topics: [
      'သန္ဓေတည်နိုင်စွမ်း ပြန်လာခြင်း',
      'ပညာရှင်များ ယေဘုယျပြောဆိုသည်များ',
      'သင့်ကိုယ်ပိုင်အရှိန်ဖြင့် အဆင်သင့်ဖြစ်ကြောင်း ခံစားရခြင်း',
      'သင့်ကို စိတ်ချမ်းသာစေနိုင်သော နောက်ဆက်တွဲစောင့်ရှောက်မှု',
      'အဓိကအချက်များ',
    ],
    body1:
      'အစောပိုင်းကိုယ်ဝန်ပျက်ကျပြီးနောက် ရာသီစက်ဝန်းတွင်ပင် သန္ဓေတည်နိုင်စွမ်း ပြန်လာလေ့ရှိသည်။ သင့်ရာသီ မြင်သာစွာမပြန်လာမီပင် မျိုးဥကြွေခြင်း ဖြစ်ပေါ်နိုင်သည်။',
    infoTitle: 'အဓိကအချက်',
    infoText:
      'ဆုံးရှုံးမှုအဆင့်အလိုက် ရုပ်ပိုင်းဆိုင်ရာ ပြန်လည်နာလန်ထူချိန်သည် အခြေအနေတစ်ခုနှင့်တစ်ခု အနည်းငယ် ကွာခြားနိုင်သည်။',
    body2:
      'သင့်ဆရာဝန် သို့မဟုတ် သားဖွားဆရာမက အခြားနည်းဖြင့် အကြံမပြုလျှင် ပြန်လည်မကြိုးစားမီ ရာသီစက်ဝန်းများစွာ စောင့်ရန် မလိုဟု ပညာရှင်များစွာက ယူဆကြသည်။',
    compareEarlyTitle: 'အစောပိုင်းဆုံးရှုံးမှု',
    compareEarlyText:
      'သန္ဓေတည်နိုင်စွမ်းသည် မကြာခဏ လျင်မြန်စွာ၊ နောက်ရာသီစက်ဝန်းတွင်ပင် ပြန်လာတတ်သည်။',
    compareLateTitle: 'နောက်ပိုင်းဆုံးရှုံးမှု',
    compareLateText:
      'ဆေးဘက်ဆိုင်ရာအဖွဲ့က ပြန်လည်နာလန်ထူချိန် အနည်းငယ်ပိုကြာရန် အကြံပြုနိုင်သည်။',
    body3:
      'ရုပ်ပိုင်းနှင့် စိတ်ပိုင်းဆိုင်ရာ အဆင်သင့်ဖြစ်ကြောင်း ခံစားရခြင်းသည် သီအိုရီအရ အချိန်ကာလတစ်ခုထက် များစွာပိုမို အရေးပါသော လမ်းညွှန်ချက် ဖြစ်နေဆဲဖြစ်သည်။',
    readinessPoints: [
      {
        title: 'စိတ်ပိုင်းဆိုင်ရာအရ',
        text: 'သင့်ကိုယ်တိုင် အဆင်သင့်ဖြစ်ကြောင်း ခံစားရခြင်းသည် ရုပ်ပိုင်းဆိုင်ရာ ပြန်လည်နာလန်ထူခြင်းကဲ့သို့ပင် အရေးကြီးသည်။',
      },
      {
        title: 'ရုပ်ပိုင်းဆိုင်ရာအရ',
        text: 'ပုံမှန်ရာသီစက်ဝန်းနှင့် ကျန်းမာသာယာသည့် ခံစားချက်တို့သည် ကောင်းမွန်သော ညွှန်ပြချက်များဖြစ်သည်။',
      },
      {
        title: 'စုံတွဲအနေဖြင့် သို့မဟုတ် ပံ့ပိုးမှုဖြင့်',
        text: 'သင့်ခင်ပွန်းနှင့် ဆွေးနွေးခြင်းက တူညီသောအရှိန်ဖြင့် ရှေ့ဆက်နိုင်ရန် ကူညီနိုင်သည်။',
      },
    ],
    body4:
      'ပြန်လည်မကြိုးစားမီ ဆေးဘက်ဆိုင်ရာ ရက်ချိန်းတစ်ခုက သင့်ကို စိတ်ချမ်းသာစွာ ရှေ့ဆက်နိုင်ရန် ကူညီနိုင်သည်။',
    followUpSteps: [
      {
        title: 'ပြန်လည်သုံးသပ်ခြင်း',
        text: 'ပညာရှင်တစ်ဦးနှင့် ဆွေးနွေးခြင်းဖြင့် ဖြစ်ပျက်ခဲ့သည်များကို ပြန်လည်ဆန်းစစ်နိုင်သည်။',
      },
      {
        title: 'လိုအပ်ပါက စစ်ဆေးမှု',
        text: 'အခြေအနေအရ ထပ်ဆောင်းစစ်ဆေးမှုများ ကမ်းလှမ်းနိုင်သည်။',
      },
      {
        title: 'ပြန်လည်ကြိုးစားခြင်း',
        text: 'သင်ပြန်လည်ကြိုးစားသည့်အခါ နောက်ဆက်တွဲစောင့်ရှောက်မှုက တည်ငြိမ်စွာ ပံ့ပိုးပေးနိုင်သည်။',
      },
    ],
    tipTitle: 'သိထားသင့်သည်',
    tipText:
      'တစ်ကြိမ်တည်းသော ကိုယ်ဝန်ပျက်ကျခြင်းသည် ယေဘုယျအားဖြင့် သန္ဓေတည်နိုင်စွမ်း ပြဿနာကို မညွှန်ပြပါ။ သင့်ကိုယ်ပိုင်မေးခွန်းများကို ဖြေဆိုရာတွင် သင့်ဆေးဘက်ဆိုင်ရာအဖွဲ့သည် အသင့်တော်ဆုံးဖြစ်နေဆဲဖြစ်သည်။',
    summaryPoints: [
      'အစောပိုင်းကိုယ်ဝန်ပျက်ကျပြီးနောက် ရာသီစက်ဝန်းတွင်ပင် သန္ဓေတည်နိုင်စွမ်း ပြန်လာလေ့ရှိသည်။',
      'အခြားနည်းဖြင့် အကြံမပြုလျှင် ရာသီစက်ဝန်းများစွာ စောင့်ရန်မလိုဟု ပညာရှင်များစွာက ယူဆကြသည်။',
      'ရုပ်ပိုင်းနှင့် စိတ်ပိုင်းဆိုင်ရာ အဆင်သင့်ဖြစ်ကြောင်း ခံစားရခြင်းသည် အရေးကြီးဆုံး လမ်းညွှန်ချက် ဖြစ်နေဆဲဖြစ်သည်။',
      'ဆေးဘက်ဆိုင်ရာ နောက်ဆက်တွဲစောင့်ရှောက်မှုက ပြန်လည်မကြိုးစားမီ သင့်ကို ပံ့ပိုးပေးပြီး စိတ်ချမ်းသာစေနိုင်သည်။',
    ],
    disclaimerText:
      '၎င်းသည် အချက်အလက်ပေးရန်ဖြစ်ပြီး ကိုယ်ပိုင်ဆေးဘက်ဆိုင်ရာ အကြံပြုချက်ကို အစားထိုးခြင်းမရှိပါ။ သင့်အခြေအနေအတွက် သင့်ဆရာဝန် သို့မဟုတ် သားဖွားဆရာမသည် ကိုးကားရာအရင်းအမြစ် ဖြစ်နေဆဲဖြစ်သည်။',
    shareMessage: 'ဆုံးရှုံးပြီးနောက် သန္ဓေတည်နိုင်စွမ်းနှင့် ပြန်လည်ကြိုးစားခြင်း — AWA',
  },
  km: {
    badge: 'ក្រោយការរលូតកូន • ភាពមានកូន',
    title: 'ភាពមានកូន និងការព្យាយាមម្តងទៀតក្រោយការបាត់បង់',
    metaDuration: 'អាន 6 នាទី',
    metaType: 'មគ្គុទ្ទេសក៍',
    metaLevel: 'កម្រិតមធ្យម',
    metaValidated: 'មាតិកាព័ត៌មាន',
    intro:
      'ពេលណា និងរបៀបគិតអំពីការព្យាយាមម្តងទៀត តាមល្បឿនរបស់អ្នកផ្ទាល់ និងដោយទំនុកចិត្តពេញលេញ។',
    contentsTitle: 'ក្នុងអត្ថបទនេះ',
    topics: [
      'ការត្រឡប់មកវិញនៃភាពមានកូន',
      'អ្វីដែលអ្នកជំនាញនិយាយជាទូទៅ',
      'ការមានអារម្មណ៍ត្រៀមខ្លួន តាមល្បឿនរបស់អ្នកផ្ទាល់',
      'ការតាមដានថែទាំដែលអាចធ្វើឱ្យអ្នកធូរចិត្ត',
      'ចំណុចសំខាន់ៗ',
    ],
    body1:
      'ភាពមានកូនជាធម្មតាត្រឡប់មកវិញនៅវដ្តបន្ទាប់ពីការរលូតកូនដំបូង។ ការបញ្ចេញពងអូវុលថែមទាំងអាចកើតឡើងមុនរដូវត្រឡប់មកវិញយ៉ាងជាក់ស្តែងទៀតផង។',
    infoTitle: 'ចំណុចសំខាន់',
    infoText:
      'អាស្រ័យលើដំណាក់កាលនៃការបាត់បង់ ពេលវេលានៃការជាសះស្បើយខាងរាងកាយអាចខុសគ្នាបន្តិចពីស្ថានភាពមួយទៅស្ថានភាពមួយទៀត។',
    body2:
      'អ្នកជំនាញជាច្រើនយល់ថា មិនចាំបាច់រង់ចាំច្រើនវដ្តមុនព្យាយាមម្តងទៀតទេ លើកលែងតែវេជ្ជបណ្ឌិត ឬឆ្មបរបស់អ្នកណែនាំផ្សេង។',
    compareEarlyTitle: 'ការបាត់បង់ដំបូង',
    compareEarlyText:
      'ភាពមានកូនជាញឹកញាប់ត្រឡប់មកវិញយ៉ាងឆាប់ ចាប់ពីវដ្តបន្ទាប់។',
    compareLateTitle: 'ការបាត់បង់ក្រោយៗ',
    compareLateText:
      'ក្រុមវេជ្ជសាស្ត្រអាចណែនាំរយៈពេលជាសះស្បើយវែងជាងបន្តិច។',
    body3:
      'ការមានអារម្មណ៍ត្រៀមខ្លួន ទាំងខាងរាងកាយ និងអារម្មណ៍ នៅតែជាមគ្គុទ្ទេសក៍សំខាន់បំផុត — លើសពីរយៈពេលតាមទ្រឹស្តីណាមួយ។',
    readinessPoints: [
      {
        title: 'ខាងអារម្មណ៍',
        text: 'ការមានអារម្មណ៍ត្រៀមខ្លួននៅក្នុងខ្លួនអ្នក សំខាន់ដូចការជាសះស្បើយខាងរាងកាយដែរ។',
      },
      {
        title: 'ខាងរាងកាយ',
        text: 'វដ្តរដូវទៀងទាត់ និងអារម្មណ៍សុខស្រួល គឺជាសូចនាករល្អ។',
      },
      {
        title: 'ជាគូស្វាមីភរិយា ឬជាមួយការគាំទ្រ',
        text: 'ការនិយាយអំពីរឿងនេះជាមួយដៃគូរបស់អ្នក អាចជួយឱ្យអ្នកឈានទៅមុខក្នុងល្បឿនដូចគ្នា។',
      },
    ],
    body4:
      'មុនព្យាយាមម្តងទៀត ការណាត់ជួបវេជ្ជបណ្ឌិតអាចជួយអ្នកឈានទៅមុខដោយមានចិត្តស្ងប់ស្ងាត់ជាងមុន៖',
    followUpSteps: [
      {
        title: 'ការពិនិត្យឡើងវិញ',
        text: 'ការសន្ទនាជាមួយអ្នកជំនាញអនុញ្ញាតឱ្យអ្នកពិនិត្យឡើងវិញអំពីអ្វីដែលបានកើតឡើង។',
      },
      {
        title: 'ការវាយតម្លៃប្រសិនបើចាំបាច់',
        text: 'អាស្រ័យលើស្ថានភាព ការធ្វើតេស្តបន្ថែមអាចត្រូវបានស្នើឡើង។',
      },
      {
        title: 'ការព្យាយាមថ្មី',
        text: 'បន្ទាប់មក ការតាមដានថែទាំអាចគាំទ្រអ្នកដោយស្ងប់ស្ងាត់ នៅពេលអ្នកព្យាយាមម្តងទៀត។',
      },
    ],
    tipTitle: 'គួរដឹង',
    tipText:
      'ការរលូតកូនតែម្តងជាទូទៅមិនបង្ហាញពីបញ្ហាភាពមានកូនទេ។ ក្រុមវេជ្ជសាស្ត្ររបស់អ្នកនៅតែជាអ្នកដែលស័ក្តិសមបំផុតក្នុងការឆ្លើយសំណួរផ្ទាល់ខ្លួនរបស់អ្នក។',
    summaryPoints: [
      'ភាពមានកូនជាធម្មតាត្រឡប់មកវិញនៅវដ្តបន្ទាប់ពីការរលូតកូនដំបូង។',
      'អ្នកជំនាញជាច្រើនយល់ថា មិនចាំបាច់រង់ចាំច្រើនវដ្តទេ លើកលែងតែមានការណែនាំផ្សេង។',
      'ការមានអារម្មណ៍ត្រៀមខ្លួន ទាំងខាងរាងកាយ និងអារម្មណ៍ នៅតែជាមគ្គុទ្ទេសក៍សំខាន់បំផុត។',
      'ការតាមដានខាងវេជ្ជសាស្ត្រអាចគាំទ្រ និងធ្វើឱ្យអ្នកធូរចិត្តមុនព្យាយាមម្តងទៀត។',
    ],
    disclaimerText:
      'មាតិកាព័ត៌មាន។ អត្ថបទនេះមិនជំនួសដំបូន្មានវេជ្ជសាស្ត្រផ្ទាល់ខ្លួនទេ។ វេជ្ជបណ្ឌិត ឬឆ្មបរបស់អ្នកនៅតែជាអ្នកយោងសម្រាប់ស្ថានភាពរបស់អ្នក។',
    shareMessage: 'ភាពមានកូន និងការព្យាយាមម្តងទៀតក្រោយការបាត់បង់ — AWA',
  },
  lo: {
    badge: 'ຫຼັງການແທ້ງລູກ • ຄວາມສາມາດໃນການຕັ້ງຄັນ',
    title: 'ຄວາມສາມາດໃນການຕັ້ງຄັນ ແລະ ການລອງໃໝ່ຫຼັງການສູນເສຍ',
    metaDuration: 'ອ່ານ 6 ນາທີ',
    metaType: 'ຄູ່ມື',
    metaLevel: 'ລະດັບກາງ',
    metaValidated: 'ເນື້ອຫາທົ່ວໄປ',
    intro:
      'ເວລາໃດ ແລະ ຄິດເລື່ອງການລອງໃໝ່ແນວໃດ ຕາມຈັງຫວະຂອງທ່ານເອງ ແລະ ດ້ວຍຄວາມໝັ້ນໃຈເຕັມທີ່.',
    contentsTitle: 'ໃນບົດຄວາມນີ້',
    topics: [
      'ການກັບຄືນຂອງຄວາມສາມາດໃນການຕັ້ງຄັນ',
      'ສິ່ງທີ່ຜູ້ຊ່ຽວຊານມັກເວົ້າ',
      'ຮູ້ສຶກພ້ອມ ຕາມຈັງຫວະຂອງທ່ານເອງ',
      'ການຕິດຕາມດູແລທີ່ຊ່ວຍໃຫ້ທ່ານສະບາຍໃຈ',
      'ຈຸດສຳຄັນ',
    ],
    body1:
      'ຄວາມສາມາດໃນການຕັ້ງຄັນມັກກັບຄືນມາໄວສຸດໃນຮອບເດືອນຕໍ່ຈາກການແທ້ງລູກໃນໄລຍະຕົ້ນ. ການຕົກໄຂ່ອາດເກີດຂຶ້ນກ່ອນທີ່ປະຈຳເດືອນຈະກັບມາໃຫ້ເຫັນຊັດເຈນດ້ວຍຊ້ຳ.',
    infoTitle: 'ຈຸດສຳຄັນ',
    infoText:
      'ຂຶ້ນກັບຂັ້ນຕອນຂອງການສູນເສຍ ໄລຍະເວລາຟື້ນຕົວທາງກາຍອາດແຕກຕ່າງກັນເລັກນ້ອຍໃນແຕ່ລະສະຖານະການ.',
    body2:
      'ຜູ້ຊ່ຽວຊານຫຼາຍຄົນເຫັນວ່າບໍ່ຈຳເປັນຕ້ອງລໍຖ້າຫຼາຍຮອບເດືອນກ່ອນລອງໃໝ່ ເວັ້ນແຕ່ແພດ ຫຼື ໝໍຕຳແຍຂອງທ່ານຈະແນະນຳເປັນອື່ນ.',
    compareEarlyTitle: 'ການສູນເສຍໃນໄລຍະຕົ້ນ',
    compareEarlyText:
      'ຄວາມສາມາດໃນການຕັ້ງຄັນມັກກັບຄືນມາໄວ ຕັ້ງແຕ່ຮອບເດືອນຕໍ່ໄປ.',
    compareLateTitle: 'ການສູນເສຍໃນໄລຍະຕໍ່ມາ',
    compareLateText:
      'ທີມແພດອາດແນະນຳໃຫ້ໃຊ້ເວລາຟື້ນຕົວດົນຂຶ້ນເລັກນ້ອຍ.',
    body3:
      'ການຮູ້ສຶກພ້ອມ ທັງທາງກາຍ ແລະ ທາງອາລົມ ຍັງເປັນຕົວຊີ້ນຳທີ່ສຳຄັນທີ່ສຸດ — ສຳຄັນກວ່າໄລຍະເວລາຕາມທິດສະດີໃດໆ.',
    readinessPoints: [
      {
        title: 'ທາງອາລົມ',
        text: 'ການຮູ້ສຶກພ້ອມຈາກພາຍໃນຕົວທ່ານເອງສຳຄັນເທົ່າກັບການຟື້ນຕົວທາງກາຍ.',
      },
      {
        title: 'ທາງຮ່າງກາຍ',
        text: 'ຮອບເດືອນທີ່ສະໝ່ຳສະເໝີ ແລະ ຄວາມຮູ້ສຶກສະບາຍດີເປັນຕົວຊີ້ບອກທີ່ດີ.',
      },
      {
        title: 'ໃນຖານະຄູ່ ຫຼື ກັບຜູ້ສະໜັບສະໜູນ',
        text: 'ການລົມເລື່ອງນີ້ກັບຄູ່ຂອງທ່ານສາມາດຊ່ວຍໃຫ້ກ້າວໄປຂ້າງໜ້າດ້ວຍຈັງຫວະດຽວກັນ.',
      },
    ],
    body4:
      'ກ່ອນລອງໃໝ່ ການພົບແພດສາມາດຊ່ວຍໃຫ້ທ່ານກ້າວໄປຂ້າງໜ້າດ້ວຍຄວາມສະຫງົບໃຈຫຼາຍຂຶ້ນ:',
    followUpSteps: [
      {
        title: 'ທົບທວນສະຖານະການ',
        text: 'ການສົນທະນາກັບຜູ້ຊ່ຽວຊານຊ່ວຍໃຫ້ທ່ານກັບມາເບິ່ງສິ່ງທີ່ເກີດຂຶ້ນ.',
      },
      {
        title: 'ການກວດປະເມີນຖ້າຈຳເປັນ',
        text: 'ຂຶ້ນກັບສະຖານະການ ອາດມີການສະເໜີໃຫ້ກວດເພີ່ມເຕີມ.',
      },
      {
        title: 'ການລອງໃໝ່',
        text: 'ຈາກນັ້ນການຕິດຕາມດູແລສາມາດຊ່ວຍສະໜັບສະໜູນທ່ານຢ່າງສະຫງົບໃນຂະນະທີ່ລອງໃໝ່.',
      },
    ],
    tipTitle: 'ຄວນຮູ້',
    tipText:
      'ການແທ້ງລູກຄັ້ງດຽວໂດຍທົ່ວໄປບໍ່ໄດ້ບົ່ງບອກເຖິງບັນຫາຄວາມສາມາດໃນການຕັ້ງຄັນ. ທີມແພດຂອງທ່ານຍັງເປັນຜູ້ທີ່ຕອບຄຳຖາມສ່ວນຕົວຂອງທ່ານໄດ້ດີທີ່ສຸດ.',
    summaryPoints: [
      'ຄວາມສາມາດໃນການຕັ້ງຄັນມັກກັບຄືນມາໄວສຸດໃນຮອບເດືອນຕໍ່ຈາກການແທ້ງລູກໃນໄລຍະຕົ້ນ.',
      'ຜູ້ຊ່ຽວຊານຫຼາຍຄົນເຫັນວ່າບໍ່ຈຳເປັນຕ້ອງລໍຖ້າຫຼາຍຮອບເດືອນ ເວັ້ນແຕ່ໄດ້ຮັບຄຳແນະນຳເປັນອື່ນ.',
      'ການຮູ້ສຶກພ້ອມ ທັງທາງກາຍ ແລະ ທາງອາລົມ ຍັງເປັນຕົວຊີ້ນຳທີ່ສຳຄັນທີ່ສຸດ.',
      'ການຕິດຕາມທາງການແພດສາມາດຊ່ວຍສະໜັບສະໜູນ ແລະ ເຮັດໃຫ້ທ່ານສະບາຍໃຈກ່ອນລອງໃໝ່.',
    ],
    disclaimerText:
      'ນີ້ແມ່ນຂໍ້ມູນທົ່ວໄປ. ບົດຄວາມນີ້ບໍ່ແທນຄຳແນະນຳທາງການແພດສະເພາະບຸກຄົນ. ແພດ ຫຼື ໝໍຕຳແຍຂອງທ່ານຍັງເປັນຜູ້ອ້າງອີງສຳລັບສະຖານະການຂອງທ່ານ.',
    shareMessage: 'ຄວາມສາມາດໃນການຕັ້ງຄັນ ແລະ ການລອງໃໝ່ຫຼັງການສູນເສຍ — AWA',
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
