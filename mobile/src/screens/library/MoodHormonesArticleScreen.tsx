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

const ID = 'mood-humeur-et-hormones';

const HERO = require('../../assets/images/library/spm-hero.png');

/* -------------------------------------------------------------------------- */
/* DATA — icons are language-neutral; matching titles/text live in CONTENT   */
/* below, keyed by index to stay aligned with these icon lists.              */
/* -------------------------------------------------------------------------- */

const PHASE_MOOD_ICONS = ['water-outline', 'egg-outline', 'weather-cloudy'] as const;

const OBSERVE_HABITS_ICONS = ['notebook-outline', 'chart-line'] as const;

const HELPFUL_HABITS_ICONS = ['sleep', 'run', 'account-group-outline'] as const;

/* -------------------------------------------------------------------------- */
/* CONTENT — PHASE 7L bilingual editorial content. Article identity (ID,     */
/* images, bookmark/progress keys, JSX structure) is untouched; only this    */
/* object changes per language. The French text below is byte-identical to  */
/* the original — never retyped, only moved into the `fr` key — so the app  */
/* remains fully bilingual rather than having French replaced by English.   */
/* -------------------------------------------------------------------------- */

const CONTENT = withBrazilianPortuguese('MoodHormones', {
  fr: {
    badge: 'CYCLE MENSTRUEL • HUMEUR',
    title: 'Humeur et fluctuations\nhormonales',
    metaDuration: '6 min de lecture',
    metaType: 'Article',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Pourquoi ton moral peut varier au fil du cycle, sans que ce soit systématiquement le cas.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Pourquoi l’humeur peut varier',
      'L’humeur selon les phases du cycle',
      'Observer tes propres variations',
      'Des habitudes qui peuvent aider',
      'Quand les changements deviennent préoccupants',
      'À retenir',
    ],
    section1Body: 'Les variations d’œstrogènes et de progestérone influencent directement les neurotransmetteurs liés à l’humeur, comme la sérotonine.',
    info1Title: 'À garder en tête',
    info1Text: 'Toutes les variations d’humeur ne sont pas forcément liées au cycle : le contexte de vie, le stress ou la fatigue jouent aussi un rôle important.',
    phaseMood: [
      {title: 'Pendant les règles', text: 'Fatigue et sensibilité émotionnelle sont fréquentes pour beaucoup de personnes.'},
      {title: 'Autour de l’ovulation', text: 'C’est souvent une phase de meilleure énergie et de bien-être ressenti.'},
      {title: 'Avant les règles', text: 'L’irritabilité ou les sautes d’humeur sont plus fréquentes à cette période.'},
    ],
    section2Body: 'L’irritabilité prémenstruelle ou les sautes d’humeur ménopausiques ont donc une explication biologique réelle, même si elles ne se manifestent pas de la même façon chez tout le monde.',
    observeHabits: [
      {title: 'Tenir un journal', text: 'Noter ton humeur et la phase de ton cycle t’aide à repérer tes propres tendances.'},
      {title: 'Identifier des schémas', text: 'Sans te juger : le but est de mieux te connaître, pas de tout contrôler.'},
    ],
    section4Body: 'Sommeil, activité physique et soutien social restent les meilleurs alliés pour stabiliser l’humeur.',
    helpfulHabits: [
      {title: 'Un sommeil suffisant', text: 'Le manque de sommeil amplifie souvent la sensibilité émotionnelle.'},
      {title: 'Une activité physique régulière', text: 'Même modérée, elle aide à stabiliser l’humeur au fil du cycle.'},
      {title: 'Un soutien social', text: 'En parler à une personne de confiance peut alléger ce que tu ressens.'},
    ],
    section5Body: 'Une variation d’humeur liée au cycle reste généralement passagère. Certains signes méritent en revanche une attention particulière :',
    warningTitle: 'Signaux à surveiller',
    concerningSigns: [
      'Une tristesse intense ou qui persiste au-delà du cycle',
      'Une perte d’intérêt marquée pour ce que tu aimes habituellement',
      'Un impact important sur ton quotidien ou tes relations',
      'Des pensées envahissantes ou un sentiment de détresse important',
    ],
    info2Title: 'Un accompagnement est possible',
    info2Text: 'Un médecin, une sage-femme ou un psychologue peut t’aider à mieux comprendre ce que tu ressens et t’orienter si besoin.',
    tipTitle: 'Bon à savoir',
    tipText: 'Reconnaître le lien entre hormones et humeur peut aider à mieux comprendre ce que tu ressens, sans pour autant tout réduire à cette seule explication.',
    summaryPoints: [
      'Les variations d’œstrogènes et de progestérone influencent directement les neurotransmetteurs liés à l’humeur.',
      'L’irritabilité prémenstruelle a donc une explication biologique réelle.',
      'Toutes les variations d’humeur ne sont pas forcément liées au cycle : le contexte de vie compte aussi.',
      'Sommeil, activité physique et soutien social restent les meilleurs alliés pour stabiliser l’humeur.',
    ],
    disclaimerText: 'Contenu informatif. Cet article ne remplace pas un avis médical ou psychologique personnalisé. En cas de doute, demande conseil à un professionnel de santé.',
    shareMessage: 'Humeur et fluctuations hormonales — AWA',
  },
  en: {
    badge: 'MENSTRUAL CYCLE • MOOD',
    title: 'Mood and hormonal\nfluctuations',
    metaDuration: '6 min read',
    metaType: 'Article',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'Why your mood can vary throughout your cycle, though not always.',
    contentsTitle: 'In this article',
    topics: [
      'Why mood can vary',
      'Mood across the phases of the cycle',
      'Observing your own variations',
      'Habits that can help',
      'When changes become concerning',
      'Key takeaways',
    ],
    section1Body: 'Fluctuations in estrogen and progesterone directly influence mood-related neurotransmitters, such as serotonin.',
    info1Title: 'Keep in mind',
    info1Text: 'Not every mood swing is necessarily linked to your cycle: life circumstances, stress, and fatigue also play an important role.',
    phaseMood: [
      {title: 'During your period', text: 'Fatigue and emotional sensitivity are common for many people.'},
      {title: 'Around ovulation', text: 'This is often a phase of better energy and a greater sense of well-being.'},
      {title: 'Before your period', text: 'Irritability or mood swings are more common during this time.'},
    ],
    section2Body: 'Premenstrual irritability or menopausal mood swings therefore have a real biological explanation, even if they don’t show up the same way for everyone.',
    observeHabits: [
      {title: 'Keeping a journal', text: 'Writing down your mood and your cycle phase helps you spot your own patterns.'},
      {title: 'Identifying patterns', text: 'Without judging yourself: the goal is to know yourself better, not to control everything.'},
    ],
    section4Body: 'Sleep, physical activity, and social support remain the best allies for stabilizing mood.',
    helpfulHabits: [
      {title: 'Enough sleep', text: 'Lack of sleep often heightens emotional sensitivity.'},
      {title: 'Regular physical activity', text: 'Even moderate activity helps stabilize mood throughout the cycle.'},
      {title: 'Social support', text: 'Talking to someone you trust can ease what you’re feeling.'},
    ],
    section5Body: 'A mood change linked to your cycle is usually temporary. However, certain signs deserve particular attention:',
    warningTitle: 'Signs to watch for',
    concerningSigns: [
      'Intense sadness, or sadness that persists beyond the cycle',
      'A marked loss of interest in things you usually enjoy',
      'A significant impact on your daily life or relationships',
      'Intrusive thoughts or a significant feeling of distress',
    ],
    info2Title: 'Support is available',
    info2Text: 'A doctor, midwife, or psychologist can help you better understand what you’re feeling and refer you to further support if needed.',
    tipTitle: 'Good to know',
    tipText: 'Recognizing the link between hormones and mood can help you better understand what you’re feeling, without reducing everything to this one explanation.',
    summaryPoints: [
      'Fluctuations in estrogen and progesterone directly influence mood-related neurotransmitters.',
      'Premenstrual irritability therefore has a real biological explanation.',
      'Not every mood swing is necessarily linked to the cycle: life circumstances matter too.',
      'Sleep, physical activity, and social support remain the best allies for stabilizing mood.',
    ],
    disclaimerText: 'Informational content. This article does not replace personalized medical or psychological advice. If in doubt, seek guidance from a healthcare professional.',
    shareMessage: 'Mood and hormonal fluctuations — AWA',
  },
  es: {
    badge: 'CICLO MENSTRUAL • ESTADO DE ÁNIMO',
    title: 'Estado de ánimo y\nfluctuaciones hormonales',
    metaDuration: '6 min de lectura',
    metaType: 'Artículo',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Por qué tu estado de ánimo puede variar a lo largo del ciclo, aunque no siempre sea así.',
    contentsTitle: 'En este artículo',
    topics: [
      'Por qué puede variar el estado de ánimo',
      'El estado de ánimo según las fases del ciclo',
      'Observar tus propias variaciones',
      'Hábitos que pueden ayudar',
      'Cuándo los cambios se vuelven preocupantes',
      'Para recordar',
    ],
    section1Body: 'Las variaciones de estrógeno y progesterona influyen directamente en los neurotransmisores relacionados con el estado de ánimo, como la serotonina.',
    info1Title: 'Ten en cuenta',
    info1Text: 'No todas las variaciones del estado de ánimo están necesariamente ligadas al ciclo: el contexto de vida, el estrés o el cansancio también juegan un papel importante.',
    phaseMood: [
      {title: 'Durante la regla', text: 'El cansancio y la sensibilidad emocional son frecuentes en muchas personas.'},
      {title: 'Alrededor de la ovulación', text: 'Suele ser una fase de mejor energía y de mayor bienestar percibido.'},
      {title: 'Antes de la regla', text: 'La irritabilidad o los cambios de humor son más frecuentes en este momento.'},
    ],
    section2Body: 'La irritabilidad premenstrual o los cambios de humor de la menopausia tienen, por tanto, una explicación biológica real, aunque no se manifiesten de la misma manera en todas las personas.',
    observeHabits: [
      {title: 'Llevar un diario', text: 'Anotar tu estado de ánimo y la fase de tu ciclo te ayuda a detectar tus propias tendencias.'},
      {title: 'Identificar patrones', text: 'Sin juzgarte: el objetivo es conocerte mejor, no controlarlo todo.'},
    ],
    section4Body: 'El sueño, la actividad física y el apoyo social siguen siendo los mejores aliados para estabilizar el estado de ánimo.',
    helpfulHabits: [
      {title: 'Un sueño suficiente', text: 'La falta de sueño suele intensificar la sensibilidad emocional.'},
      {title: 'Actividad física regular', text: 'Incluso moderada, ayuda a estabilizar el estado de ánimo a lo largo del ciclo.'},
      {title: 'Apoyo social', text: 'Hablarlo con alguien de confianza puede aliviar lo que sientes.'},
    ],
    section5Body: 'Un cambio de humor ligado al ciclo suele ser pasajero. En cambio, algunas señales merecen una atención especial:',
    warningTitle: 'Señales a vigilar',
    concerningSigns: [
      'Una tristeza intensa o que persiste más allá del ciclo',
      'Una pérdida marcada de interés por lo que normalmente disfrutas',
      'Un impacto importante en tu vida diaria o en tus relaciones',
      'Pensamientos invasivos o una sensación de angustia importante',
    ],
    info2Title: 'Existe apoyo disponible',
    info2Text: 'Un médico, una matrona o un psicólogo pueden ayudarte a comprender mejor lo que sientes y orientarte si es necesario.',
    tipTitle: 'Dato útil',
    tipText: 'Reconocer el vínculo entre las hormonas y el estado de ánimo puede ayudarte a comprender mejor lo que sientes, sin por ello reducirlo todo a esta única explicación.',
    summaryPoints: [
      'Las variaciones de estrógeno y progesterona influyen directamente en los neurotransmisores relacionados con el estado de ánimo.',
      'La irritabilidad premenstrual tiene, por tanto, una explicación biológica real.',
      'No todas las variaciones del estado de ánimo están necesariamente ligadas al ciclo: el contexto de vida también importa.',
      'El sueño, la actividad física y el apoyo social siguen siendo los mejores aliados para estabilizar el estado de ánimo.',
    ],
    disclaimerText: 'Contenido informativo. Este artículo no sustituye una opinión médica o psicológica personalizada. Si tienes dudas, consulta a un profesional de la salud.',
    shareMessage: 'Estado de ánimo y fluctuaciones hormonales — AWA',
  },
  it: {
    badge: 'CICLO MESTRUALE • UMORE',
    title: 'Umore e fluttuazioni\normonali',
    metaDuration: '6 min di lettura',
    metaType: 'Articolo',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Perché il tuo umore può variare nel corso del ciclo, anche se non sempre.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Perché l’umore può variare',
      'L’umore nelle fasi del ciclo',
      'Osservare le tue variazioni',
      'Abitudini che possono aiutare',
      'Quando i cambiamenti diventano preoccupanti',
      'Punti chiave',
    ],
    section1Body: 'Le fluttuazioni di estrogeni e progesterone influenzano direttamente i neurotrasmettitori legati all’umore, come la serotonina.',
    info1Title: 'Da tenere a mente',
    info1Text: 'Non tutti gli sbalzi d’umore sono necessariamente legati al tuo ciclo: anche le circostanze della vita, lo stress e la stanchezza hanno un ruolo importante.',
    phaseMood: [
      {
        title: 'Durante il periodo mestruale',
        text: 'Stanchezza e sensibilità emotiva sono frequenti per molte persone.',
      },
      {
        title: 'Intorno all’ovulazione',
        text: 'Spesso è una fase di maggiore energia e di maggiore senso di benessere.',
      },
      {
        title: 'Prima del periodo mestruale',
        text: 'In questo momento sono più frequenti irritabilità o sbalzi d’umore.',
      },
    ],
    section2Body: 'L’irritabilità premestruale o gli sbalzi d’umore della menopausa hanno quindi una reale spiegazione biologica, anche se non si manifestano allo stesso modo in tutte.',
    observeHabits: [
      {
        title: 'Tenere un diario',
        text: 'Annotare il tuo umore e la fase del ciclo ti aiuta a individuare i tuoi schemi personali.',
      },
      {
        title: 'Individuare gli schemi',
        text: 'Senza giudicarti: l’obiettivo è conoscerti meglio, non controllare tutto.',
      },
    ],
    section4Body: 'Il sonno, l’attività fisica e il sostegno sociale restano i migliori alleati per stabilizzare l’umore.',
    helpfulHabits: [
      {
        title: 'Dormire a sufficienza',
        text: 'La mancanza di sonno spesso accentua la sensibilità emotiva.',
      },
      {
        title: 'Attività fisica regolare',
        text: 'Anche un’attività moderata aiuta a stabilizzare l’umore durante tutto il ciclo.',
      },
      {
        title: 'Sostegno sociale',
        text: 'Parlare con una persona di cui ti fidi può alleviare ciò che provi.',
      },
    ],
    section5Body: 'Un cambiamento dell’umore legato al ciclo è di solito temporaneo. Tuttavia, alcuni segnali meritano un’attenzione particolare:',
    warningTitle: 'Segnali a cui prestare attenzione',
    concerningSigns: [
      'Tristezza intensa, o tristezza che persiste oltre il ciclo',
      'Una marcata perdita di interesse per ciò che di solito ti piace',
      'Un impatto significativo sulla tua vita quotidiana o sulle tue relazioni',
      'Pensieri intrusivi o un forte senso di disagio',
    ],
    info2Title: 'Esiste un sostegno',
    info2Text: 'Un medico, un’ostetrica o una psicologa possono aiutarti a comprendere meglio ciò che provi e, se necessario, indirizzarti verso un ulteriore sostegno.',
    tipTitle: 'Da sapere',
    tipText: 'Riconoscere il legame tra ormoni e umore può aiutarti a capire meglio ciò che provi, senza ridurre tutto a questa sola spiegazione.',
    summaryPoints: [
      'Le fluttuazioni di estrogeni e progesterone influenzano direttamente i neurotrasmettitori legati all’umore.',
      'L’irritabilità premestruale ha quindi una reale spiegazione biologica.',
      'Non tutti gli sbalzi d’umore sono necessariamente legati al ciclo: contano anche le circostanze della vita.',
      'Il sonno, l’attività fisica e il sostegno sociale restano i migliori alleati per stabilizzare l’umore.',
    ],
    disclaimerText: 'Contenuto informativo. Questo articolo non sostituisce un parere medico o psicologico personalizzato. In caso di dubbi, rivolgiti a un professionista sanitario.',
    shareMessage: 'Umore e fluttuazioni ormonali — AWA',
  },
  tr: {
    badge: 'ADET DÖNGÜSÜ • RUH HALİ',
    title: 'Ruh hali ve hormonal\ndalgalanmalar',
    metaDuration: '6 dk okuma',
    metaType: 'Makale',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Ruh halinin döngü boyunca neden değişebildiği; ancak her zaman değişmeyebileceği.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Ruh hali neden değişebilir?',
      'Döngü evrelerinde ruh hali',
      'Kendi değişimlerini gözlemlemek',
      'Yardımcı olabilecek alışkanlıklar',
      'Değişimler ne zaman kaygı verici olur?',
      'Akılda kalacaklar',
    ],
    section1Body: 'Östrojen ve progesterondaki dalgalanmalar, serotonin gibi ruh haliyle ilgili nörotransmitterleri doğrudan etkiler.',
    info1Title: 'Aklında bulunsun',
    info1Text: 'Her ruh hali değişimi mutlaka döngünle bağlantılı değildir: yaşam koşulları, stres ve yorgunluk da önemli bir rol oynar.',
    phaseMood: [
      {
        title: 'Adetin sırasında',
        text: 'Yorgunluk ve duygusal hassasiyet birçok kişide yaygındır.',
      },
      {
        title: 'Yumurtlama civarında',
        text: 'Bu, çoğu zaman daha iyi enerjinin ve daha güçlü bir iyi olma hissinin yaşandığı bir evredir.',
      },
      {
        title: 'Adetinden önce',
        text: 'Bu dönemde alınganlık ya da ruh hali dalgalanmaları daha sık görülür.',
      },
    ],
    section2Body: 'Dolayısıyla adet öncesi alınganlığın ya da menopoz dönemindeki ruh hali dalgalanmalarının gerçek bir biyolojik açıklaması vardır; bu durum herkeste aynı şekilde ortaya çıkmasa da.',
    observeHabits: [
      {
        title: 'Günlük tutmak',
        text: 'Ruh halini ve döngü evreni yazmak, kendi örüntülerini fark etmene yardımcı olur.',
      },
      {
        title: 'Örüntüleri belirlemek',
        text: 'Kendini yargılamadan: amaç her şeyi kontrol etmek değil, kendini daha iyi tanımaktır.',
      },
    ],
    section4Body: 'Uyku, fiziksel aktivite ve sosyal destek, ruh halini dengelemek için en iyi müttefikler olmaya devam eder.',
    helpfulHabits: [
      {
        title: 'Yeterli uyku',
        text: 'Uykusuzluk çoğu zaman duygusal hassasiyeti artırır.',
      },
      {
        title: 'Düzenli fiziksel aktivite',
        text: 'Orta düzeyde bir aktivite bile döngü boyunca ruh halini dengelemeye yardımcı olur.',
      },
      {
        title: 'Sosyal destek',
        text: 'Güvendiğin biriyle konuşmak hissettiklerini hafifletebilir.',
      },
    ],
    section5Body: 'Döngüyle bağlantılı bir ruh hali değişimi genellikle geçicidir. Yine de bazı belirtiler özellikle dikkat gerektirir:',
    warningTitle: 'Dikkat edilmesi gereken belirtiler',
    concerningSigns: [
      'Yoğun üzüntü ya da döngünün ötesinde süren üzüntü',
      'Normalde keyif aldığın şeylere karşı belirgin ilgi kaybı',
      'Günlük hayatın ya da ilişkilerin üzerinde önemli bir etki',
      'İstem dışı düşünceler ya da belirgin bir sıkıntı hissi',
    ],
    info2Title: 'Destek mevcut',
    info2Text: 'Bir doktor, ebe ya da psikolog hissettiklerini daha iyi anlamana yardımcı olabilir ve gerekirse seni ileri desteğe yönlendirebilir.',
    tipTitle: 'Bilmekte fayda var',
    tipText: 'Hormonlar ile ruh hali arasındaki bağlantıyı fark etmek, her şeyi bu tek açıklamaya indirgemeden hissettiklerini daha iyi anlamana yardımcı olabilir.',
    summaryPoints: [
      'Östrojen ve progesterondaki dalgalanmalar, ruh haliyle ilgili nörotransmitterleri doğrudan etkiler.',
      'Dolayısıyla adet öncesi alınganlığın gerçek bir biyolojik açıklaması vardır.',
      'Her ruh hali değişimi mutlaka döngüyle bağlantılı değildir: yaşam koşulları da önemlidir.',
      'Uyku, fiziksel aktivite ve sosyal destek, ruh halini dengelemek için en iyi müttefikler olmaya devam eder.',
    ],
    disclaimerText: 'Bilgilendirme amaçlı içerik. Bu makale kişiye özel tıbbi ya da psikolojik tavsiyenin yerini tutmaz. Tereddüt ettiğinde bir sağlık profesyonelinden yönlendirme al.',
    shareMessage: 'Ruh hali ve hormonal dalgalanmalar — AWA',
  },
  ru: {
    badge: 'МЕНСТРУАЛЬНЫЙ ЦИКЛ • НАСТРОЕНИЕ',
    title: 'Настроение и гормональные\nколебания',
    metaDuration: '6 мин чтения',
    metaType: 'Статья',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'Почему настроение может меняться в течение цикла, хотя и не всегда.',
    contentsTitle: 'В этой статье',
    topics: [
      'Почему настроение может меняться',
      'Настроение в разных фазах цикла',
      'Наблюдение за собственными изменениями',
      'Привычки, которые могут помочь',
      'Когда изменения вызывают беспокойство',
      'Главные выводы',
    ],
    section1Body: 'Колебания уровня эстрогена и прогестерона напрямую влияют на нейромедиаторы, связанные с настроением, например серотонин.',
    info1Title: 'Важно помнить',
    info1Text: 'Не каждая смена настроения обязательно связана с циклом: жизненные обстоятельства, стресс и усталость тоже играют важную роль.',
    phaseMood: [
      {title: 'Во время месячных', text: 'Усталость и эмоциональная чувствительность часто встречаются у многих женщин.'},
      {title: 'Около овуляции', text: 'Часто это фаза, когда больше энергии и лучше самочувствие.'},
      {title: 'Перед месячными', text: 'В это время чаще встречаются раздражительность и перепады настроения.'},
    ],
    section2Body: 'Предменструальная раздражительность или перепады настроения в менопаузе имеют реальное биологическое объяснение, даже если проявляются не у всех одинаково.',
    observeHabits: [
      {title: 'Ведите дневник', text: 'Записывая настроение и фазу цикла, вы лучше замечаете собственные закономерности.'},
      {title: 'Выявляйте закономерности', text: 'Без самокритики: цель — лучше узнать себя, а не всё контролировать.'},
    ],
    section4Body: 'Сон, физическая активность и социальная поддержка остаются лучшими помощниками для стабилизации настроения.',
    helpfulHabits: [
      {title: 'Достаточный сон', text: 'Недостаток сна часто усиливает эмоциональную чувствительность.'},
      {title: 'Регулярная физическая активность', text: 'Даже умеренная активность помогает стабилизировать настроение на протяжении всего цикла.'},
      {title: 'Социальная поддержка', text: 'Разговор с человеком, которому вы доверяете, может облегчить то, что вы чувствуете.'},
    ],
    section5Body: 'Изменение настроения, связанное с циклом, обычно временное. Однако некоторые признаки заслуживают особого внимания:',
    warningTitle: 'На что стоит обратить внимание',
    concerningSigns: [
      'Сильная грусть или грусть, которая сохраняется за пределами цикла',
      'Выраженная потеря интереса к тому, что вам обычно нравится',
      'Заметное влияние на повседневную жизнь или отношения',
      'Навязчивые мысли или сильное ощущение душевного неблагополучия',
    ],
    info2Title: 'Поддержка доступна',
    info2Text: 'Врач, акушерка или психолог помогут лучше понять, что вы чувствуете, и при необходимости направят вас за дополнительной поддержкой.',
    tipTitle: 'Полезно знать',
    tipText: 'Понимание связи между гормонами и настроением помогает лучше осознавать свои чувства, не сводя всё только к этому объяснению.',
    summaryPoints: [
      'Колебания уровня эстрогена и прогестерона напрямую влияют на нейромедиаторы, связанные с настроением.',
      'Поэтому у предменструальной раздражительности есть реальное биологическое объяснение.',
      'Не каждая смена настроения обязательно связана с циклом: жизненные обстоятельства тоже важны.',
      'Сон, физическая активность и социальная поддержка остаются лучшими помощниками для стабилизации настроения.',
    ],
    disclaimerText: 'Информационный материал. Эта статья не заменяет индивидуальную медицинскую или психологическую консультацию. Если вы сомневаетесь, обратитесь за рекомендацией к медицинскому специалисту.',
    shareMessage: 'Настроение и гормональные колебания — AWA',
  },
  de: {
    badge: 'MENSTRUATIONSZYKLUS • STIMMUNG',
    title: 'Stimmung und hormonelle\nSchwankungen',
    metaDuration: '6 Min. Lesezeit',
    metaType: 'Artikel',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Warum deine Stimmung im Laufe deines Zyklus schwanken kann – aber nicht immer.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Warum die Stimmung schwanken kann',
      'Stimmung in den Zyklusphasen',
      'Die eigenen Schwankungen beobachten',
      'Gewohnheiten, die helfen können',
      'Wenn Veränderungen Anlass zur Sorge geben',
      'Das Wichtigste in Kürze',
    ],
    section1Body: 'Schwankungen von Östrogen und Progesteron beeinflussen direkt die Botenstoffe, die mit der Stimmung zusammenhängen, etwa Serotonin.',
    info1Title: 'Gut im Blick behalten',
    info1Text: 'Nicht jede Stimmungsschwankung hängt zwangsläufig mit deinem Zyklus zusammen: Auch Lebensumstände, Stress und Müdigkeit spielen eine wichtige Rolle.',
    phaseMood: [
      {title: 'Während deiner Periode', text: 'Müdigkeit und emotionale Empfindsamkeit sind für viele Frauen häufig.'},
      {title: 'Rund um den Eisprung', text: 'Oft ist das eine Phase mit mehr Energie und stärkerem Wohlbefinden.'},
      {title: 'Vor deiner Periode', text: 'Reizbarkeit oder Stimmungsschwankungen sind in dieser Zeit häufiger.'},
    ],
    section2Body: 'Prämenstruelle Reizbarkeit oder Stimmungsschwankungen in den Wechseljahren haben also eine echte biologische Erklärung, auch wenn sie sich nicht bei allen gleich zeigen.',
    observeHabits: [
      {title: 'Tagebuch führen', text: 'Wenn du deine Stimmung und deine Zyklusphase notierst, erkennst du deine eigenen Muster.'},
      {title: 'Muster erkennen', text: 'Ohne dich zu bewerten: Ziel ist, dich besser kennenzulernen, nicht alles zu kontrollieren.'},
    ],
    section4Body: 'Schlaf, körperliche Aktivität und soziale Unterstützung bleiben die besten Verbündeten, um die Stimmung zu stabilisieren.',
    helpfulHabits: [
      {title: 'Ausreichend Schlaf', text: 'Schlafmangel verstärkt oft die emotionale Empfindsamkeit.'},
      {title: 'Regelmäßige Bewegung', text: 'Schon moderate Aktivität hilft, die Stimmung im Verlauf des Zyklus zu stabilisieren.'},
      {title: 'Soziale Unterstützung', text: 'Mit einer vertrauten Person zu sprechen kann das, was du fühlst, erleichtern.'},
    ],
    section5Body: 'Eine zyklusbedingte Stimmungsveränderung ist in der Regel vorübergehend. Bestimmte Anzeichen verdienen jedoch besondere Aufmerksamkeit:',
    warningTitle: 'Anzeichen, auf die du achten solltest',
    concerningSigns: [
      'Starke Traurigkeit oder Traurigkeit, die über den Zyklus hinaus anhält',
      'Ein deutlicher Verlust des Interesses an Dingen, die dir sonst Freude machen',
      'Eine erhebliche Auswirkung auf deinen Alltag oder deine Beziehungen',
      'Aufdringliche Gedanken oder ein starkes Gefühl der Belastung',
    ],
    info2Title: 'Unterstützung ist da',
    info2Text: 'Eine Ärztin oder ein Arzt, eine Hebamme oder eine Psychologin bzw. ein Psychologe kann dir helfen, besser zu verstehen, was du fühlst, und dich bei Bedarf an weitere Unterstützung verweisen.',
    tipTitle: 'Gut zu wissen',
    tipText: 'Den Zusammenhang zwischen Hormonen und Stimmung zu erkennen kann dir helfen, besser zu verstehen, was du fühlst – ohne alles auf diese eine Erklärung zu reduzieren.',
    summaryPoints: [
      'Schwankungen von Östrogen und Progesteron beeinflussen direkt die Botenstoffe, die mit der Stimmung zusammenhängen.',
      'Prämenstruelle Reizbarkeit hat daher eine echte biologische Erklärung.',
      'Nicht jede Stimmungsschwankung hängt zwangsläufig mit dem Zyklus zusammen: Auch Lebensumstände spielen eine Rolle.',
      'Schlaf, körperliche Aktivität und soziale Unterstützung bleiben die besten Verbündeten, um die Stimmung zu stabilisieren.',
    ],
    disclaimerText: 'Informationsinhalt. Dieser Artikel ersetzt keine individuelle medizinische oder psychologische Beratung. Bei Zweifeln hol dir Rat bei medizinischem Fachpersonal.',
    shareMessage: 'Stimmung und hormonelle Schwankungen — AWA',
  },
  zh: {
      badge: '月经周期 • 情绪',
      title: '情绪与\n激素波动',
      metaDuration: '阅读约 6 分钟',
      metaType: '文章',
      metaLevel: '入门',
      metaValidated: '已审核内容',
      intro: '为什么你的情绪会在周期中有所起伏，但并不总是如此。',
      contentsTitle: '本文内容',
      topics: [
        '为什么情绪会有起伏',
        '周期各阶段的情绪',
        '观察自己的变化',
        '有帮助的习惯',
        '何时需要关注情绪变化',
        '要点回顾',
      ],
      section1Body: '雌激素和孕激素的波动会直接影响与情绪有关的神经递质，例如血清素。',
      info1Title: '请记住',
      info1Text: '并非每一次情绪波动都一定与周期有关：生活境遇、压力和疲劳同样起着重要作用。',
      phaseMood: [
        {
          title: '月经期间',
          text: '疲倦和情绪敏感，对许多人来说都很常见。',
        },
        {
          title: '排卵前后',
          text: '这通常是精力更好、幸福感更强的阶段。',
        },
        {
          title: '月经来潮前',
          text: '这段时间更容易出现易怒或情绪起伏。',
        },
      ],
      section2Body: '因此，经前易怒或绝经期的情绪波动有着真实的生理原因，尽管每个人的表现并不相同。',
      observeHabits: [
        {
          title: '写日记',
          text: '记下你的情绪和所处的周期阶段，有助于发现自己的规律。',
        },
        {
          title: '找出规律',
          text: '不必评判自己：目的是更了解自己，而不是掌控一切。',
        },
      ],
      section4Body: '充足的睡眠、体育活动和社会支持，仍然是稳定情绪的最好帮手。',
      helpfulHabits: [
        {
          title: '睡眠充足',
          text: '睡眠不足往往会让情绪更加敏感。',
        },
        {
          title: '规律的体育活动',
          text: '即使是适度的活动，也有助于在整个周期中稳定情绪。',
        },
        {
          title: '社会支持',
          text: '与你信任的人聊聊，可以缓解你的感受。',
        },
      ],
      section5Body: '与周期有关的情绪变化通常是暂时的。不过，有些信号值得特别留意：',
      warningTitle: '需要留意的信号',
      concerningSigns: [
        '强烈的悲伤，或悲伤在周期之后仍持续',
        '对平时喜欢的事情明显失去兴趣',
        '对日常生活或人际关系造成明显影响',
        '反复出现的侵入性念头，或明显的痛苦感',
      ],
      info2Title: '你可以得到支持',
      info2Text: '医生、助产士或心理师可以帮你更好地理解自己的感受，并在需要时为你转介进一步的支持。',
      tipTitle: '小贴士',
      tipText: '认识到激素与情绪之间的联系，可以帮你更好地理解自己的感受，但不要把一切都简单归结为这一种解释。',
      summaryPoints: [
        '雌激素和孕激素的波动会直接影响与情绪有关的神经递质。',
        '因此，经前易怒有着真实的生理原因。',
        '并非每一次情绪波动都一定与周期有关：生活境遇同样重要。',
        '充足的睡眠、体育活动和社会支持，仍然是稳定情绪的最好帮手。',
      ],
      disclaimerText: '仅供参考。本文不能替代个性化的医疗或心理建议。如有疑问，请向医疗专业人员寻求指导。',
      shareMessage: '情绪与激素波动 — AWA',
    },
  id: {
    badge: 'SIKLUS MENSTRUASI • SUASANA HATI',
    title: 'Suasana hati dan\nfluktuasi hormon',
    metaDuration: '6 menit baca',
    metaType: 'Artikel',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Mengapa suasana hatimu bisa berubah sepanjang siklus, meski tidak selalu.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Mengapa suasana hati bisa berubah',
      'Suasana hati di setiap fase siklus',
      'Mengamati variasimu sendiri',
      'Kebiasaan yang dapat membantu',
      'Saat perubahan mulai mengkhawatirkan',
      'Poin penting',
    ],
    section1Body: 'Fluktuasi estrogen dan progesteron memengaruhi secara langsung neurotransmiter yang berkaitan dengan suasana hati, seperti serotonin.',
    info1Title: 'Ingatlah',
    info1Text: 'Tidak semua perubahan suasana hati pasti berkaitan dengan siklusmu: keadaan hidup, stres, dan kelelahan juga berperan penting.',
    phaseMood: [
      {
        title: 'Saat haid',
        text: 'Kelelahan dan kepekaan emosi umum dialami banyak orang.',
      },
      {
        title: 'Sekitar ovulasi',
        text: 'Ini sering menjadi fase dengan energi yang lebih baik dan rasa sejahtera yang lebih besar.',
      },
      {
        title: 'Sebelum haid',
        text: 'Mudah tersinggung atau suasana hati yang naik turun lebih sering terjadi pada masa ini.',
      },
    ],
    section2Body: 'Karena itu, mudah tersinggung sebelum haid atau suasana hati yang naik turun saat menopause memiliki penjelasan biologis yang nyata, meski tidak muncul dengan cara yang sama pada setiap orang.',
    observeHabits: [
      {
        title: 'Menulis jurnal',
        text: 'Mencatat suasana hati dan fase siklusmu membantumu mengenali pola-polamu sendiri.',
      },
      {
        title: 'Mengenali pola',
        text: 'Tanpa menghakimi diri sendiri: tujuannya untuk lebih mengenal dirimu, bukan mengendalikan segalanya.',
      },
    ],
    section4Body: 'Tidur, aktivitas fisik, dan dukungan sosial tetap menjadi sekutu terbaik untuk menstabilkan suasana hati.',
    helpfulHabits: [
      {
        title: 'Tidur yang cukup',
        text: 'Kurang tidur sering memperkuat kepekaan emosi.',
      },
      {
        title: 'Aktivitas fisik secara teratur',
        text: 'Aktivitas yang sedang pun membantu menstabilkan suasana hati sepanjang siklus.',
      },
      {
        title: 'Dukungan sosial',
        text: 'Berbicara dengan orang yang kamu percaya dapat meringankan apa yang kamu rasakan.',
      },
    ],
    section5Body: 'Perubahan suasana hati yang berkaitan dengan siklusmu biasanya bersifat sementara. Namun, beberapa tanda layak mendapat perhatian khusus:',
    warningTitle: 'Tanda yang perlu diperhatikan',
    concerningSigns: [
      'Kesedihan yang intens, atau kesedihan yang bertahan melewati siklus',
      'Hilangnya minat yang nyata pada hal-hal yang biasanya kamu nikmati',
      'Dampak yang berarti pada kehidupan sehari-hari atau hubunganmu',
      'Pikiran yang mengganggu atau perasaan tertekan yang berat',
    ],
    info2Title: 'Dukungan tersedia',
    info2Text: 'Dokter, bidan, atau psikolog dapat membantumu lebih memahami apa yang kamu rasakan dan merujukmu ke pendampingan lanjutan bila perlu.',
    tipTitle: 'Perlu diketahui',
    tipText: 'Menyadari kaitan antara hormon dan suasana hati dapat membantumu lebih memahami apa yang kamu rasakan, tanpa menyederhanakan semuanya pada satu penjelasan ini.',
    summaryPoints: [
      'Fluktuasi estrogen dan progesteron memengaruhi secara langsung neurotransmiter yang berkaitan dengan suasana hati.',
      'Karena itu, mudah tersinggung sebelum haid memiliki penjelasan biologis yang nyata.',
      'Tidak semua perubahan suasana hati pasti berkaitan dengan siklus: keadaan hidup juga berperan.',
      'Tidur, aktivitas fisik, dan dukungan sosial tetap menjadi sekutu terbaik untuk menstabilkan suasana hati.',
    ],
    disclaimerText: 'Konten informatif. Artikel ini tidak menggantikan saran medis atau psikologis yang personal. Jika ragu, mintalah panduan dari tenaga kesehatan.',
    shareMessage: 'Suasana hati dan fluktuasi hormon — AWA',
  },
  hi: {
    badge: 'मासिक चक्र • मूड',
    title: 'मूड और हार्मोन के\nउतार-चढ़ाव',
    metaDuration: '6 मिनट में पढ़ें',
    metaType: 'लेख',
    metaLevel: 'शुरुआती',
    metaValidated: 'समीक्षा की गई सामग्री',
    intro: 'आपका मूड चक्र के दौरान क्यों बदल सकता है, हालाँकि हमेशा ऐसा नहीं होता।',
    contentsTitle: 'इस लेख में',
    topics: [
      'मूड क्यों बदल सकता है',
      'चक्र के चरणों में मूड',
      'अपने उतार-चढ़ाव को समझना',
      'मददगार आदतें',
      'बदलाव कब चिंता की बात बनते हैं',
      'मुख्य बातें',
    ],
    section1Body: 'एस्ट्रोजन और प्रोजेस्टेरोन के उतार-चढ़ाव मूड से जुड़े न्यूरोट्रांसमीटर, जैसे सेरोटोनिन, को सीधे प्रभावित करते हैं।',
    info1Title: 'याद रखें',
    info1Text: 'हर मूड स्विंग ज़रूरी नहीं कि आपके चक्र से जुड़ी हो: जीवन की परिस्थितियाँ, तनाव और थकान भी अहम भूमिका निभाते हैं।',
    phaseMood: [
      {
        title: 'पीरियड के दौरान',
        text: 'कई महिलाओं में थकान और भावनात्मक संवेदनशीलता आम है।',
      },
      {
        title: 'ओव्यूलेशन (अंडोत्सर्ग) के आसपास',
        text: 'यह अक्सर बेहतर ऊर्जा और ज़्यादा अच्छा महसूस करने का दौर होता है।',
      },
      {
        title: 'पीरियड से पहले',
        text: 'इस समय चिड़चिड़ापन या मूड में उतार-चढ़ाव ज़्यादा आम हैं।',
      },
    ],
    section2Body: 'इसलिए पीरियड से पहले का चिड़चिड़ापन या मेनोपॉज़ के दौरान मूड में बदलाव की एक असली जैविक वजह होती है, भले ही यह सबमें एक जैसा न दिखे।',
    observeHabits: [
      {
        title: 'जर्नल रखें',
        text: 'अपना मूड और चक्र का चरण लिखने से आप अपने पैटर्न पहचान पाती हैं।',
      },
      {
        title: 'पैटर्न पहचानें',
        text: 'खुद को परखे बिना: मक़सद खुद को बेहतर जानना है, हर चीज़ को काबू करना नहीं।',
      },
    ],
    section4Body: 'नींद, शारीरिक गतिविधि और लोगों का साथ मूड को संतुलित रखने के सबसे अच्छे साथी हैं।',
    helpfulHabits: [
      {
        title: 'पर्याप्त नींद',
        text: 'नींद की कमी अक्सर भावनात्मक संवेदनशीलता बढ़ा देती है।',
      },
      {
        title: 'नियमित शारीरिक गतिविधि',
        text: 'मध्यम गतिविधि भी पूरे चक्र में मूड को संतुलित रखने में मदद करती है।',
      },
      {
        title: 'लोगों का साथ',
        text: 'किसी भरोसेमंद व्यक्ति से बात करने से आप जो महसूस कर रही हैं, वह हल्का हो सकता है।',
      },
    ],
    section5Body: 'चक्र से जुड़ा मूड का बदलाव आमतौर पर अस्थायी होता है। फिर भी, कुछ संकेतों पर ख़ास ध्यान देना चाहिए:',
    warningTitle: 'इन संकेतों पर ध्यान दें',
    concerningSigns: [
      'गहरी उदासी, या ऐसी उदासी जो चक्र के बाद भी बनी रहे',
      'जिन चीज़ों में आपको आमतौर पर मज़ा आता है, उनमें साफ़ तौर पर रुचि खो जाना',
      'आपकी रोज़मर्रा की ज़िंदगी या रिश्तों पर काफ़ी असर पड़ना',
      'बार-बार आने वाले परेशान करने वाले विचार या बहुत ज़्यादा बेचैनी का एहसास',
    ],
    info2Title: 'मदद उपलब्ध है',
    info2Text: 'डॉक्टर, दाई-नर्स (मिडवाइफ़) या मनोवैज्ञानिक आपको यह बेहतर समझने में मदद कर सकते हैं कि आप क्या महसूस कर रही हैं, और ज़रूरत पड़ने पर आगे की मदद के लिए भेज सकते हैं।',
    tipTitle: 'जानने लायक',
    tipText: 'हार्मोन और मूड के बीच के रिश्ते को पहचानने से आप जो महसूस कर रही हैं उसे बेहतर समझ सकती हैं, बिना हर बात को सिर्फ़ इसी वजह से जोड़े।',
    summaryPoints: [
      'एस्ट्रोजन और प्रोजेस्टेरोन के उतार-चढ़ाव मूड से जुड़े न्यूरोट्रांसमीटर को सीधे प्रभावित करते हैं।',
      'इसलिए पीरियड से पहले के चिड़चिड़ेपन की एक असली जैविक वजह होती है।',
      'हर मूड स्विंग ज़रूरी नहीं कि चक्र से जुड़ी हो: जीवन की परिस्थितियाँ भी मायने रखती हैं।',
      'नींद, शारीरिक गतिविधि और लोगों का साथ मूड को संतुलित रखने के सबसे अच्छे साथी हैं।',
    ],
    disclaimerText: 'जानकारी के लिए सामग्री। यह लेख व्यक्तिगत चिकित्सकीय या मनोवैज्ञानिक सलाह का विकल्प नहीं है। संदेह होने पर किसी स्वास्थ्य विशेषज्ञ से सलाह लें।',
    shareMessage: 'मूड और हार्मोन के उतार-चढ़ाव — AWA',
  },
  sq: {
    badge: 'CIKLI MENSTRUAL • DISPONIMI',
    title: 'Disponimi dhe luhatjet\nhormonale',
    metaDuration: '6 min lexim',
    metaType: 'Artikull',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Pse disponimi yt mund të ndryshojë gjatë ciklit, edhe pse jo gjithmonë.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Pse mund të ndryshojë disponimi',
      'Disponimi nëpër fazat e ciklit',
      'Vëzhgimi i ndryshimeve të tua',
      'Zakone që mund të ndihmojnë',
      'Kur ndryshimet bëhen shqetësuese',
      'Pikat kryesore',
    ],
    section1Body: 'Luhatjet e estrogjenit dhe të progesteronit ndikojnë drejtpërdrejt te neurotransmetuesit e lidhur me disponimin, si serotonina.',
    info1Title: 'Mbaje mend',
    info1Text: 'Jo çdo luhatje e disponimit lidhet domosdoshmërisht me ciklin tënd: rrethanat e jetës, stresi dhe lodhja luajnë gjithashtu një rol të rëndësishëm.',
    phaseMood: [
      {
        title: 'Gjatë menstruacioneve',
        text: 'Lodhja dhe ndjeshmëria emocionale janë të zakonshme për shumë njerëz.',
      },
      {
        title: 'Rreth ovulacionit',
        text: 'Shpesh është një fazë me më shumë energji dhe me një ndjenjë më të madhe mirëqenieje.',
      },
      {
        title: 'Para menstruacioneve',
        text: 'Nervozizmi ose luhatjet e disponimit janë më të zakonshme në këtë kohë.',
      },
    ],
    section2Body: 'Prandaj nervozizmi para menstruacioneve ose luhatjet e disponimit në menopauzë kanë një shpjegim biologjik real, edhe nëse nuk shfaqen njësoj te të gjitha.',
    observeHabits: [
      {
        title: 'Mbajtja e një ditari',
        text: 'Të shënosh disponimin dhe fazën e ciklit të ndihmon të dallosh modelet e tua.',
      },
      {
        title: 'Dallimi i modeleve',
        text: 'Pa gjykuar veten: qëllimi është të njohësh veten më mirë, jo të kontrollosh gjithçka.',
      },
    ],
    section4Body: 'Gjumi, aktiviteti fizik dhe mbështetja shoqërore mbeten aleatët më të mirë për të stabilizuar disponimin.',
    helpfulHabits: [
      {
        title: 'Gjumë i mjaftueshëm',
        text: 'Mungesa e gjumit shpesh e rrit ndjeshmërinë emocionale.',
      },
      {
        title: 'Aktivitet fizik i rregullt',
        text: 'Edhe një aktivitet i moderuar ndihmon të stabilizohet disponimi gjatë ciklit.',
      },
      {
        title: 'Mbështetje shoqërore',
        text: 'Të flasësh me dikë që i beson mund ta lehtësojë atë që ndjen.',
      },
    ],
    section5Body: 'Një ndryshim i disponimit i lidhur me ciklin zakonisht është i përkohshëm. Megjithatë, disa shenja meritojnë vëmendje të veçantë:',
    warningTitle: 'Shenja për t’u vëzhguar',
    concerningSigns: [
      'Trishtim i fortë, ose trishtim që vazhdon edhe përtej ciklit',
      'Humbje e theksuar e interesit për gjërat që zakonisht të pëlqejnë',
      'Ndikim i ndjeshëm në jetën e përditshme ose në marrëdhëniet e tua',
      'Mendime ndërhyrëse ose një ndjenjë e fortë shqetësimi',
    ],
    info2Title: 'Mbështetja ekziston',
    info2Text: 'Një mjek, një mami ose një psikolog mund të të ndihmojë ta kuptosh më mirë atë që ndjen dhe, nëse nevojitet, të të orientojë drejt mbështetjes së mëtejshme.',
    tipTitle: 'Mirë është ta dish',
    tipText: 'Njohja e lidhjes midis hormoneve dhe disponimit mund të të ndihmojë ta kuptosh më mirë atë që ndjen, pa e reduktuar gjithçka në këtë shpjegim të vetëm.',
    summaryPoints: [
      'Luhatjet e estrogjenit dhe të progesteronit ndikojnë drejtpërdrejt te neurotransmetuesit e lidhur me disponimin.',
      'Prandaj nervozizmi para menstruacioneve ka një shpjegim biologjik real.',
      'Jo çdo luhatje e disponimit lidhet domosdoshmërisht me ciklin: edhe rrethanat e jetës kanë rëndësi.',
      'Gjumi, aktiviteti fizik dhe mbështetja shoqërore mbeten aleatët më të mirë për të stabilizuar disponimin.',
    ],
    disclaimerText: 'Përmbajtje informuese. Ky artikull nuk zëvendëson këshillën e personalizuar mjekësore ose psikologjike. Nëse ke dyshime, kërko udhëzim nga një profesionist i shëndetësisë.',
    shareMessage: 'Disponimi dhe luhatjet hormonale — AWA',
  },
  ja: {
    badge: '生理周期・気分',
    title: '気分とホルモンの\n揺らぎ',
    metaDuration: '読了時間6分',
    metaType: '記事',
    metaLevel: '初級',
    metaValidated: '確認済みコンテンツ',
    intro: '周期の中で気分が変わることがある理由についてです。ただし、いつもそうとは限りません。',
    contentsTitle: 'この記事の内容',
    topics: [
      '気分が変わる理由',
      '周期のフェーズごとの気分',
      '自分の変化を観察する',
      '助けになる習慣',
      '変化が気になるとき',
      'ポイントのまとめ',
    ],
    section1Body: 'エストロゲンとプロゲステロンの変動は、セロトニンなど気分に関わる神経伝達物質に直接影響します。',
    info1Title: '心に留めておきたいこと',
    info1Text: '気分の揺れのすべてが周期に関係しているとは限りません。生活環境やストレス、疲れも大きく影響します。',
    phaseMood: [
      {
        title: '生理中',
        text: '疲れやすさや感情の敏感さは、多くの人に見られます。',
      },
      {
        title: '排卵のころ',
        text: '元気が出やすく、気分も前向きになりやすい時期であることが多いです。',
      },
      {
        title: '生理前',
        text: 'この時期は、イライラや気分の波が起こりやすくなります。',
      },
    ],
    section2Body: 'そのため、生理前のイライラや更年期の気分の波には、生物学的な理由があります。ただし、現れ方は人それぞれです。',
    observeHabits: [
      {
        title: '記録をつける',
        text: '気分と周期のフェーズを書き留めると、自分なりのパターンに気づきやすくなります。',
      },
      {
        title: 'パターンを見つける',
        text: '自分を責めずに行いましょう。目的は自分をよりよく知ることで、すべてをコントロールすることではありません。',
      },
    ],
    section4Body: '睡眠、運動、周りの人からの支えは、気分を安定させる最良の味方であり続けます。',
    helpfulHabits: [
      {
        title: '十分な睡眠',
        text: '睡眠不足は、感情の敏感さを強めることがよくあります。',
      },
      {
        title: '定期的な運動',
        text: '適度な運動でも、周期を通して気分の安定に役立ちます。',
      },
      {
        title: '周りの人からの支え',
        text: '信頼できる人に話すと、感じていることが軽くなることがあります。',
      },
    ],
    section5Body: '周期に関連した気分の変化は、たいてい一時的なものです。ただし、特に注意したいサインがあります。',
    warningTitle: '気をつけたいサイン',
    concerningSigns: [
      '強い悲しみ、または周期が終わっても続く悲しみ',
      'いつも楽しんでいたことへの関心が、はっきりと失われる',
      '日常生活や人間関係に大きな影響が出る',
      '頭から離れない考えや、強い苦痛を感じる',
    ],
    info2Title: '支えを求めることができます',
    info2Text: '医師、助産師、心理士は、感じていることを理解する手助けをし、必要に応じてさらなる支援につなげることができます。',
    tipTitle: '知っておきたいこと',
    tipText: 'ホルモンと気分の関係を知っておくと、感じていることを理解しやすくなります。ただし、すべてをこの説明だけで片付けないようにしましょう。',
    summaryPoints: [
      'エストロゲンとプロゲステロンの変動は、気分に関わる神経伝達物質に直接影響します。',
      'そのため、生理前のイライラには生物学的な理由があります。',
      '気分の揺れのすべてが周期に関係しているとは限らず、生活環境も影響します。',
      '睡眠、運動、周りの人からの支えは、気分を安定させる最良の味方であり続けます。',
    ],
    disclaimerText: '情報提供を目的としたコンテンツです。この記事は、個別の医学的・心理的なアドバイスに代わるものではありません。不安なときは、医療従事者に相談してください。',
    shareMessage: '気分とホルモンの揺らぎ — AWA',
  },
  ko: {
    badge: '생리 주기 • 기분',
    title: '기분과 호르몬의\n변화',
    metaDuration: '6분 읽기',
    metaType: '아티클',
    metaLevel: '입문',
    metaValidated: '검토된 콘텐츠',
    intro: '기분이 주기에 따라 달라질 수 있는 이유예요. 항상 그런 것은 아니에요.',
    contentsTitle: '이 아티클의 내용',
    topics: [
      '기분이 달라질 수 있는 이유',
      '주기의 단계별 기분',
      '나의 변화 관찰하기',
      '도움이 되는 습관',
      '변화가 걱정스러울 때',
      '핵심 정리',
    ],
    section1Body: '에스트로겐과 프로게스테론의 변화는 세로토닌처럼 기분과 관련된 신경전달물질에 직접 영향을 줘요.',
    info1Title: '기억해 두세요',
    info1Text: '기분 변화가 모두 주기와 관련 있는 것은 아니에요. 생활 환경, 스트레스, 피로도 중요한 역할을 해요.',
    phaseMood: [
      {
        title: '생리 중',
        text: '많은 사람이 피로감과 감정적인 예민함을 느껴요.',
      },
      {
        title: '배란 즈음',
        text: '에너지가 더 좋고 컨디션이 좋다고 느끼는 시기인 경우가 많아요.',
      },
      {
        title: '생리 전',
        text: '이 시기에는 짜증이나 기분 변화가 더 흔해요.',
      },
    ],
    section2Body: '그래서 생리 전의 짜증이나 폐경기의 기분 변화에는 실제로 생물학적인 이유가 있어요. 다만 모든 사람에게 똑같이 나타나는 것은 아니에요.',
    observeHabits: [
      {
        title: '기록 남기기',
        text: '기분과 주기 단계를 적어 두면 나만의 패턴을 알아차리는 데 도움이 돼요.',
      },
      {
        title: '패턴 찾아보기',
        text: '스스로를 판단하지 않고요. 목표는 모든 것을 통제하는 것이 아니라 나를 더 잘 아는 거예요.',
      },
    ],
    section4Body: '수면, 신체 활동, 주변의 지지는 기분을 안정시키는 데 가장 든든한 도움이에요.',
    helpfulHabits: [
      {
        title: '충분한 수면',
        text: '잠이 부족하면 감정적인 예민함이 커지는 경우가 많아요.',
      },
      {
        title: '규칙적인 신체 활동',
        text: '적당한 활동만으로도 주기 내내 기분을 안정시키는 데 도움이 돼요.',
      },
      {
        title: '주변의 지지',
        text: '믿을 수 있는 사람과 이야기하면 느끼는 감정이 한결 가벼워질 수 있어요.',
      },
    ],
    section5Body: '주기와 관련된 기분 변화는 보통 일시적이에요. 다만 다음과 같은 신호에는 특별히 주의를 기울일 필요가 있어요.',
    warningTitle: '살펴봐야 할 신호',
    concerningSigns: [
      '강한 슬픔이 있거나, 슬픔이 주기가 지나도 이어져요',
      '평소 즐기던 일에 대한 흥미가 눈에 띄게 줄어요',
      '일상생활이나 인간관계에 큰 영향을 줘요',
      '떠나지 않는 생각이 들거나 심한 괴로움을 느껴요',
    ],
    info2Title: '도움을 받을 수 있어요',
    info2Text: '의사, 조산사, 심리 전문가는 느끼는 감정을 더 잘 이해하도록 돕고, 필요하면 추가 도움을 받을 수 있는 곳을 안내해 줄 수 있어요.',
    tipTitle: '알아 두세요',
    tipText: '호르몬과 기분의 관계를 알면 느끼는 감정을 더 잘 이해하는 데 도움이 될 수 있어요. 모든 것을 이 한 가지 설명으로만 풀지 않아도 괜찮아요.',
    summaryPoints: [
      '에스트로겐과 프로게스테론의 변화는 기분과 관련된 신경전달물질에 직접 영향을 줘요.',
      '그래서 생리 전의 짜증에는 실제로 생물학적인 이유가 있어요.',
      '기분 변화가 모두 주기와 관련 있는 것은 아니에요. 생활 환경도 중요해요.',
      '수면, 신체 활동, 주변의 지지는 기분을 안정시키는 데 가장 든든한 도움이에요.',
    ],
    disclaimerText: '정보 제공 콘텐츠예요. 이 아티클은 개인에게 맞춘 의학적·심리적 조언을 대신하지 않아요. 걱정되는 점이 있다면 의료 전문가의 안내를 받아 보세요.',
    shareMessage: '기분과 호르몬의 변화 — AWA',
  },
  'pt-PT': {
    badge: 'CICLO MENSTRUAL • HUMOR',
    title: 'Humor e flutuações\nhormonais',
    metaDuration: '6 min de leitura',
    metaType: 'Artigo',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'Porque é que o seu humor pode variar ao longo do ciclo, embora nem sempre aconteça.',
    contentsTitle: 'Neste artigo',
    topics: [
      'Porque é que o humor pode variar',
      'O humor ao longo das fases do ciclo',
      'Observar as suas próprias variações',
      'Hábitos que podem ajudar',
      'Quando as alterações se tornam preocupantes',
      'Pontos-chave',
    ],
    section1Body: 'As flutuações de estrogénio e de progesterona influenciam diretamente os neurotransmissores ligados ao humor, como a serotonina.',
    info1Title: 'A reter',
    info1Text: 'Nem todas as oscilações de humor estão necessariamente ligadas ao ciclo: as circunstâncias da vida, o stress e o cansaço também desempenham um papel importante.',
    phaseMood: [
      {
        title: 'Durante o período',
        text: 'O cansaço e a sensibilidade emocional são frequentes em muitas mulheres.',
      },
      {
        title: 'Por volta da ovulação',
        text: 'É muitas vezes uma fase de mais energia e de maior sensação de bem-estar.',
      },
      {
        title: 'Antes do período',
        text: 'A irritabilidade ou as oscilações de humor são mais frequentes nesta altura.',
      },
    ],
    section2Body: 'A irritabilidade pré-menstrual ou as oscilações de humor da menopausa têm, por isso, uma explicação biológica real, mesmo que não se manifestem da mesma forma em todas as mulheres.',
    observeHabits: [
      {
        title: 'Manter um diário',
        text: 'Registar o seu humor e a fase do ciclo ajuda a identificar os seus próprios padrões.',
      },
      {
        title: 'Identificar padrões',
        text: 'Sem se julgar: o objetivo é conhecer-se melhor, não controlar tudo.',
      },
    ],
    section4Body: 'O sono, a atividade física e o apoio social continuam a ser os melhores aliados para estabilizar o humor.',
    helpfulHabits: [
      {
        title: 'Dormir o suficiente',
        text: 'A falta de sono aumenta frequentemente a sensibilidade emocional.',
      },
      {
        title: 'Atividade física regular',
        text: 'Mesmo uma atividade moderada ajuda a estabilizar o humor ao longo do ciclo.',
      },
      {
        title: 'Apoio social',
        text: 'Falar com alguém de confiança pode aliviar o que sente.',
      },
    ],
    section5Body: 'Uma alteração de humor ligada ao ciclo é geralmente passageira. No entanto, alguns sinais merecem particular atenção:',
    warningTitle: 'Sinais a que deve estar atenta',
    concerningSigns: [
      'Tristeza intensa, ou tristeza que persiste para além do ciclo',
      'Uma perda marcada de interesse pelas coisas de que normalmente gosta',
      'Um impacto significativo na sua vida quotidiana ou nas suas relações',
      'Pensamentos intrusivos ou uma sensação marcada de sofrimento',
    ],
    info2Title: 'Existe apoio disponível',
    info2Text: 'Um médico, uma parteira ou um psicólogo pode ajudá-la a compreender melhor o que sente e encaminhá-la para um apoio mais específico, se necessário.',
    tipTitle: 'Bom saber',
    tipText: 'Reconhecer a ligação entre as hormonas e o humor pode ajudá-la a compreender melhor o que sente, sem reduzir tudo a esta única explicação.',
    summaryPoints: [
      'As flutuações de estrogénio e de progesterona influenciam diretamente os neurotransmissores ligados ao humor.',
      'A irritabilidade pré-menstrual tem, por isso, uma explicação biológica real.',
      'Nem todas as oscilações de humor estão necessariamente ligadas ao ciclo: as circunstâncias da vida também contam.',
      'O sono, a atividade física e o apoio social continuam a ser os melhores aliados para estabilizar o humor.',
    ],
    disclaimerText: 'Conteúdo informativo. Este artigo não substitui o aconselhamento médico ou psicológico personalizado. Em caso de dúvida, procure a orientação de um profissional de saúde.',
    shareMessage: 'Humor e flutuações hormonais — AWA',
  },
  bn: {
    badge: 'মাসিক চক্র • মেজাজ',
    title: 'মেজাজ ও হরমোনের\nউঠানামা',
    metaDuration: 'পড়তে 6 মিনিট',
    metaType: 'নিবন্ধ',
    metaLevel: 'প্রাথমিক',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'চক্রের বিভিন্ন সময়ে আপনার মেজাজ কেন বদলাতে পারে, যদিও সবসময় নয়।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'মেজাজ কেন বদলাতে পারে',
      'চক্রের বিভিন্ন পর্যায়ে মেজাজ',
      'নিজের পরিবর্তনগুলো লক্ষ করা',
      'যেসব অভ্যাস সাহায্য করতে পারে',
      'কখন পরিবর্তনগুলো উদ্বেগের কারণ হয়',
      'মূল কথা',
    ],
    section1Body: 'ইস্ট্রোজেন ও প্রোজেস্টেরনের উঠানামা সেরোটোনিনের মতো মেজাজ-সংক্রান্ত নিউরোট্রান্সমিটারকে সরাসরি প্রভাবিত করে।',
    info1Title: 'মনে রাখবেন',
    info1Text: 'প্রতিটি মেজাজের পরিবর্তন যে চক্রের সঙ্গে সম্পর্কিত তা নয়: জীবনের পরিস্থিতি, মানসিক চাপ ও ক্লান্তিও গুরুত্বপূর্ণ ভূমিকা রাখে।',
    phaseMood: [
      {
        title: 'মাসিকের সময়',
        text: 'অনেকের ক্ষেত্রেই ক্লান্তি ও আবেগপ্রবণতা সাধারণ।',
      },
      {
        title: 'ডিম্বস্ফোটনের আশপাশে',
        text: 'এটি প্রায়ই বেশি শক্তি ও ভালো থাকার অনুভূতির একটি পর্যায়।',
      },
      {
        title: 'মাসিকের আগে',
        text: 'এই সময়ে খিটখিটে ভাব বা মেজাজের ওঠানামা বেশি দেখা যায়।',
      },
    ],
    section2Body: 'তাই মাসিকের আগের খিটখিটে ভাব বা মেনোপজকালীন মেজাজের ওঠানামার একটি বাস্তব জৈবিক ব্যাখ্যা আছে, যদিও সবার ক্ষেত্রে তা একইভাবে প্রকাশ পায় না।',
    observeHabits: [
      {
        title: 'ডায়েরি রাখা',
        text: 'আপনার মেজাজ ও চক্রের পর্যায় লিখে রাখলে নিজের ধরনগুলো চিনতে সুবিধা হয়।',
      },
      {
        title: 'ধরন চিহ্নিত করা',
        text: 'নিজেকে বিচার না করে: লক্ষ্য নিজেকে আরও ভালোভাবে জানা, সবকিছু নিয়ন্ত্রণ করা নয়।',
      },
    ],
    section4Body: 'ঘুম, শারীরিক কার্যকলাপ ও সামাজিক সহায়তা মেজাজ স্থিতিশীল রাখার সেরা সহায়ক।',
    helpfulHabits: [
      {
        title: 'পর্যাপ্ত ঘুম',
        text: 'ঘুমের অভাব প্রায়ই আবেগপ্রবণতা বাড়িয়ে দেয়।',
      },
      {
        title: 'নিয়মিত শারীরিক কার্যকলাপ',
        text: 'পরিমিত কার্যকলাপও পুরো চক্র জুড়ে মেজাজ স্থিতিশীল রাখতে সাহায্য করে।',
      },
      {
        title: 'সামাজিক সহায়তা',
        text: 'বিশ্বস্ত কারও সঙ্গে কথা বললে আপনার অনুভূতির ভার কমতে পারে।',
      },
    ],
    section5Body: 'চক্রের সঙ্গে সম্পর্কিত মেজাজের পরিবর্তন সাধারণত সাময়িক। তবে কিছু লক্ষণে বিশেষ মনোযোগ দেওয়া উচিত:',
    warningTitle: 'যেসব লক্ষণে নজর রাখবেন',
    concerningSigns: [
      'তীব্র দুঃখ, কিংবা চক্র শেষ হওয়ার পরও থেকে যাওয়া দুঃখ',
      'যেসব বিষয় আপনি সাধারণত উপভোগ করেন সেগুলোতে স্পষ্ট আগ্রহ হারিয়ে ফেলা',
      'আপনার দৈনন্দিন জীবন বা সম্পর্কের ওপর উল্লেখযোগ্য প্রভাব',
      'অনাহূত চিন্তা বা তীব্র মানসিক কষ্টের অনুভূতি',
    ],
    info2Title: 'সহায়তা পাওয়া যায়',
    info2Text: 'ডাক্তার, ধাত্রী বা মনোবিজ্ঞানী আপনি যা অনুভব করছেন তা আরও ভালোভাবে বুঝতে সাহায্য করতে পারেন এবং প্রয়োজনে পরবর্তী সহায়তার জন্য পাঠাতে পারেন।',
    tipTitle: 'জেনে রাখা ভালো',
    tipText: 'হরমোন ও মেজাজের মধ্যকার সম্পর্ক চিনতে পারলে আপনি যা অনুভব করছেন তা আরও ভালোভাবে বুঝতে পারবেন, সবকিছুকে কেবল এই একটি ব্যাখ্যায় সীমাবদ্ধ না করেই।',
    summaryPoints: [
      'ইস্ট্রোজেন ও প্রোজেস্টেরনের উঠানামা মেজাজ-সংক্রান্ত নিউরোট্রান্সমিটারকে সরাসরি প্রভাবিত করে।',
      'তাই মাসিকের আগের খিটখিটে ভাবের একটি বাস্তব জৈবিক ব্যাখ্যা আছে।',
      'প্রতিটি মেজাজের পরিবর্তন যে চক্রের সঙ্গে সম্পর্কিত তা নয়: জীবনের পরিস্থিতিও গুরুত্বপূর্ণ।',
      'ঘুম, শারীরিক কার্যকলাপ ও সামাজিক সহায়তা মেজাজ স্থিতিশীল রাখার সেরা সহায়ক।',
    ],
    disclaimerText: 'তথ্যমূলক বিষয়বস্তু। এই নিবন্ধ ব্যক্তিগত চিকিৎসা বা মনস্তাত্ত্বিক পরামর্শের বিকল্প নয়। সন্দেহ থাকলে স্বাস্থ্যসেবা পেশাজীবীর পরামর্শ নিন।',
    shareMessage: 'মেজাজ ও হরমোনের উঠানামা — AWA',
  },
  da: {
    badge: 'MENSTRUATIONSCYKLUS • HUMØR',
    title: 'Humør og\nhormonelle udsving',
    metaDuration: '6 min læsning',
    metaType: 'Artikel',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemgået indhold',
    intro: 'Hvorfor dit humør kan ændre sig i forskellige perioder af cyklussen — om end ikke altid.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvorfor humøret kan ændre sig',
      'Humør i cyklussens faser',
      'Læg mærke til dine egne forandringer',
      'Vaner der kan hjælpe',
      'Hvornår forandringerne er bekymrende',
      'Vigtige pointer',
    ],
    section1Body: 'Udsving i østrogen og progesteron påvirker direkte humørrelaterede neurotransmittere som serotonin.',
    info1Title: 'Husk',
    info1Text: 'Ikke alle humørsvingninger er forbundet med cyklussen: livssituationer, stress og træthed spiller også en vigtig rolle.',
    phaseMood: [
      {
        title: 'Under menstruationen',
        text: 'Træthed og følsomhed er almindelige for mange.',
      },
      {
        title: 'Omkring ægløsningen',
        text: 'Det er ofte en periode med mere energi og velvære.',
      },
      {
        title: 'Inden menstruationen',
        text: 'Irritabilitet eller humørsvingninger er mere udtalte på dette tidspunkt.',
      },
    ],
    section2Body: 'Præmenstruel irritabilitet eller humørsvingninger under menopausen har altså en reel biologisk forklaring, selv om den ikke ytrer sig ens hos alle.',
    observeHabits: [
      {
        title: 'Skriv dagbog',
        text: 'At notere dit humør og din cyklusfase hjælper dig med at genkende dine egne mønstre.',
      },
      {
        title: 'Identificer mønstre',
        text: 'Uden at dømme dig selv: målet er at kende dig selv bedre, ikke at kontrollere alt.',
      },
    ],
    section4Body: 'Søvn, fysisk aktivitet og social støtte er de bedste redskaber til at stabilisere humøret.',
    helpfulHabits: [
      {
        title: 'Tilstrækkelig søvn',
        text: 'Søvnmangel forværrer ofte følsomheden.',
      },
      {
        title: 'Regelmæssig fysisk aktivitet',
        text: 'Moderat aktivitet hjælper med at stabilisere humøret gennem hele cyklussen.',
      },
      {
        title: 'Social støtte',
        text: 'At tale med nogen du stoler på kan lette dine følelsers tyngde.',
      },
    ],
    section5Body: 'Humørforandringer forbundet med cyklussen er normalt forbigående. Visse tegn fortjener dog særlig opmærksomhed:',
    warningTitle: 'Tegn du bør holde øje med',
    concerningSigns: [
      'Intens tristhed eller tristhed der vedvarer efter cyklussens afslutning',
      'Tydelig manglende interesse for ting du normalt nyder',
      'Markant indvirkning på dit daglige liv eller dine relationer',
      'Påtrængende tanker eller intense psykiske lidelser',
    ],
    info2Title: 'Hjælp er tilgængelig',
    info2Text: 'En læge, jordemoder eller psykolog kan hjælpe dig med bedre at forstå, hvad du oplever, og om nødvendigt henvise dig til yderligere støtte.',
    tipTitle: 'Godt at vide',
    tipText: 'At genkende forbindelsen mellem hormoner og humør hjælper dig med bedre at forstå, hvad du føler, uden at reducere det hele til én enkelt forklaring.',
    summaryPoints: [
      'Udsving i østrogen og progesteron påvirker direkte humørrelaterede neurotransmittere.',
      'Præmenstruel irritabilitet har altså en reel biologisk forklaring.',
      'Ikke alle humørsvingninger er forbundet med cyklussen: livssituationer spiller også en rolle.',
      'Søvn, fysisk aktivitet og social støtte er de bedste redskaber til at stabilisere humøret.',
    ],
    disclaimerText: 'Informativt indhold. Denne artikel er ikke en erstatning for personlig medicinsk eller psykologisk rådgivning. Kontakt en sundhedsfaglig person, hvis du er i tvivl.',
    shareMessage: 'Humør og hormonelle udsving — AWA',
  },
  sv: {
    badge: 'MENSTRUATIONSCYKLUS • HUMÖR',
    title: 'Humör og\nhormonelle udsving',
    metaDuration: '6 min läsning',
    metaType: 'Artikel',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemgået indhold',
    intro: 'Hvorfor ditt humör kan ändre sig i forskellige perioder av cyklussen — om end inte altid.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvorfor humöret kan ändre sig',
      'Humör i cyklussens faser',
      'Läg märke till dina egne forandringer',
      'Vaner der kan hjälpe',
      'Hvornår forandringerne ar bekymrende',
      'Vigtige pointer',
    ],
    section1Body: 'Udsving i östrogen och progesteron påvirker direkte humörrelaterede neurotransmittere som serotonin.',
    info1Title: 'Husk',
    info1Text: 'Ikke alla humörsvingninger ar forbundet med cyklussen: livssituationer, stress och träthed spiller også en vigtig rolle.',
    phaseMood: [
      {
        title: 'Under menstruationen',
        text: 'Träthed och fölsomhed ar almindelige for mange.',
      },
      {
        title: 'Omkring äglösningen',
        text: 'Det ar ofta en periode med mere energi och velväre.',
      },
      {
        title: 'Inden menstruationen',
        text: 'Irritabilitet eller humörsvingninger ar mere udtalte på dette tidspunkt.',
      },
    ],
    section2Body: 'Prämenstruel irritabilitet eller humörsvingninger under menopausen har altså en reel biologisk forklaring, selv om den inte ytrer sig ens hos alle.',
    observeHabits: [
      {
        title: 'Skriv dagbog',
        text: 'At notere ditt humör och din cyklusfase hjälper dig med at genkende dina egne mönstre.',
      },
      {
        title: 'Identificer mönstre',
        text: 'Uden at dömme dig selv: målet ar at kende dig selv bedre, inte at kontrollere alt.',
      },
    ],
    section4Body: 'Sövn, fysisk aktivitet och social stötte ar de bedste redskaber till at stabilisere humöret.',
    helpfulHabits: [
      {
        title: 'Tilsträkkelig sövn',
        text: 'Sövnmangel forvärrer ofta fölsomheden.',
      },
      {
        title: 'Regelmässig fysisk aktivitet',
        text: 'Moderat aktivitet hjälper med at stabilisere humöret gennem hele cyklussen.',
      },
      {
        title: 'Social stötte',
        text: 'At tale med nogen du stoler på kan lette dina fölelsers tyngde.',
      },
    ],
    section5Body: 'Humörforandringer forbundet med cyklussen ar normalt forbigående. Visse tegn fortjener dog särlig opmärksomhed:',
    warningTitle: 'Tegn du bör holde öje med',
    concerningSigns: [
      'Intens tristhed eller tristhed der vedvarer efter cyklussens afslutning',
      'Tydelig manglende interesse for ting du normalt nyder',
      'Markant indvirkning på ditt daglige liv eller dina relationer',
      'Påträngende tanker eller intense psykiske lidelser',
    ],
    info2Title: 'Hjälp ar tilgängelig',
    info2Text: 'En läge, jordemoder eller psykolog kan hjälpe dig med bedre at forstå, hvad du oplever, och om nödvendigt henvise dig till yderligere stötte.',
    tipTitle: 'Godt at vide',
    tipText: 'At genkende forbindelsen mellem hormoner och humör hjälper dig med bedre at forstå, hvad du föler, uden at reducere det hele till én enkelt forklaring.',
    summaryPoints: [
      'Udsving i östrogen och progesteron påvirker direkte humörrelaterede neurotransmittere.',
      'Prämenstruel irritabilitet har altså en reel biologisk forklaring.',
      'Ikke alla humörsvingninger ar forbundet med cyklussen: livssituationer spiller også en rolle.',
      'Sövn, fysisk aktivitet och social stötte ar de bedste redskaber till at stabilisere humöret.',
    ],
    disclaimerText: 'Informativt indhold. Denne artikel ar inte en erstatning for personlig medicinsk eller psykologisk rådgivning. Kontakt en halsasfaglig person, hvis du ar i tvivl.',
    shareMessage: 'Humör och hormonelle udsving — AWA',
  },
  nb: {
    badge: 'MENSTRUASJONSSYKLUS • HUMØR',
    title: 'Humør og hormonelle\nsvingninger',
    metaDuration: '6 min lesing',
    metaType: 'Artikkel',
    metaLevel: 'Nybegynner',
    metaValidated: 'Gjennomgått innhold',
    intro: 'Hvorfor humøret ditt kan variere gjennom syklusen, men ikke alltid.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Hvorfor humøret kan variere',
      'Humør gjennom fasene i syklusen',
      'Observere dine egne variasjoner',
      'Vaner som kan hjelpe',
      'Når endringene blir bekymringsfulle',
      'Det viktigste å huske',
    ],
    section1Body: 'Svingninger i østrogen og progesteron påvirker direkte signalstoffene som har med humør å gjøre, som serotonin.',
    info1Title: 'Husk',
    info1Text: 'Ikke alle humørsvingninger henger nødvendigvis sammen med syklusen: livssituasjon, stress og tretthet spiller også en viktig rolle.',
    phaseMood: [
      {title: 'Under mensen', text: 'Tretthet og følelsesmessig sårbarhet er vanlig for mange.'},
      {title: 'Rundt eggløsningen', text: 'Dette er ofte en fase med bedre energi og en større følelse av velvære.'},
      {title: 'Før mensen', text: 'Irritabilitet eller humørsvingninger er vanligere i denne tiden.'},
    ],
    section2Body: 'Irritabilitet før mensen eller humørsvingninger i overgangsalderen har derfor en reell biologisk forklaring, selv om de ikke viser seg likt hos alle.',
    observeHabits: [
      {title: 'Føre dagbok', text: 'Å skrive ned humøret og syklusfasen hjelper deg å oppdage dine egne mønstre.'},
      {title: 'Finne mønstre', text: 'Uten å dømme deg selv: målet er å kjenne deg selv bedre, ikke å kontrollere alt.'},
    ],
    section4Body: 'Søvn, fysisk aktivitet og sosial støtte er fortsatt de beste allierte for å stabilisere humøret.',
    helpfulHabits: [
      {title: 'Nok søvn', text: 'Søvnmangel forsterker ofte den følelsesmessige sårbarheten.'},
      {title: 'Regelmessig fysisk aktivitet', text: 'Selv moderat aktivitet hjelper til å stabilisere humøret gjennom syklusen.'},
      {title: 'Sosial støtte', text: 'Å snakke med noen du stoler på kan lette det du kjenner.'},
    ],
    section5Body: 'En humørendring knyttet til syklusen er vanligvis midlertidig. Visse tegn fortjener likevel særlig oppmerksomhet:',
    warningTitle: 'Tegn å være oppmerksom på',
    concerningSigns: [
      'Intens tristhet, eller tristhet som vedvarer utover syklusen',
      'Tydelig tap av interesse for ting du vanligvis liker',
      'Betydelig innvirkning på hverdagen eller relasjonene dine',
      'Påtrengende tanker eller en sterk følelse av nød',
    ],
    info2Title: 'Støtte finnes',
    info2Text: 'En lege, jordmor eller psykolog kan hjelpe deg å forstå bedre det du kjenner, og henvise deg til videre støtte ved behov.',
    tipTitle: 'Godt å vite',
    tipText: 'Å kjenne igjen sammenhengen mellom hormoner og humør kan hjelpe deg å forstå det du kjenner bedre, uten å redusere alt til denne ene forklaringen.',
    summaryPoints: [
      'Svingninger i østrogen og progesteron påvirker direkte signalstoffene som har med humør å gjøre.',
      'Irritabilitet før mensen har derfor en reell biologisk forklaring.',
      'Ikke alle humørsvingninger henger nødvendigvis sammen med syklusen: livssituasjonen betyr også noe.',
      'Søvn, fysisk aktivitet og sosial støtte er fortsatt de beste allierte for å stabilisere humøret.',
    ],
    disclaimerText: 'Informasjonsinnhold. Denne artikkelen erstatter ikke personlig medisinsk eller psykologisk rådgivning. Ved tvil bør du søke veiledning hos helsepersonell.',
    shareMessage: 'Humør og hormonelle svingninger – AWA',
  },
  pl: {
    badge: 'CYKL MIESIĄCZKOWY • NASTRÓJ',
    title: 'Nastrój a wahania\nhormonalne',
    metaDuration: '6 min czytania',
    metaType: 'Artykuł',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Dlaczego Twój nastrój może się zmieniać w trakcie cyklu, choć nie zawsze.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Dlaczego nastrój może się zmieniać',
      'Nastrój w poszczególnych fazach cyklu',
      'Obserwowanie własnych wahań',
      'Nawyki, które mogą pomóc',
      'Kiedy zmiany stają się niepokojące',
      'Najważniejsze wnioski',
    ],
    section1Body: 'Wahania estrogenu i progesteronu bezpośrednio wpływają na neuroprzekaźniki związane z nastrojem, takie jak serotonina.',
    info1Title: 'Pamiętaj',
    info1Text: 'Nie każda zmiana nastroju musi być związana z cyklem: istotną rolę odgrywają też okoliczności życiowe, stres i zmęczenie.',
    phaseMood: [
      {title: 'Podczas miesiączki', text: 'Zmęczenie i wrażliwość emocjonalna są częste u wielu osób.'},
      {title: 'Około owulacji', text: 'To często faza lepszej energii i większego poczucia dobrego samopoczucia.'},
      {title: 'Przed miesiączką', text: 'Drażliwość lub wahania nastroju są w tym czasie częstsze.'},
    ],
    section2Body: 'Drażliwość przedmiesiączkowa czy wahania nastroju w menopauzie mają więc realne wyjaśnienie biologiczne, nawet jeśli nie objawiają się tak samo u wszystkich.',
    observeHabits: [
      {title: 'Prowadzenie dziennika', text: 'Zapisywanie nastroju i fazy cyklu pomaga dostrzec własne wzorce.'},
      {title: 'Rozpoznawanie wzorców', text: 'Bez oceniania siebie: celem jest lepsze poznanie siebie, a nie kontrolowanie wszystkiego.'},
    ],
    section4Body: 'Sen, aktywność fizyczna i wsparcie społeczne pozostają najlepszymi sprzymierzeńcami w stabilizowaniu nastroju.',
    helpfulHabits: [
      {title: 'Wystarczająca ilość snu', text: 'Brak snu często nasila wrażliwość emocjonalną.'},
      {title: 'Regularna aktywność fizyczna', text: 'Nawet umiarkowana aktywność pomaga stabilizować nastrój w trakcie cyklu.'},
      {title: 'Wsparcie społeczne', text: 'Rozmowa z kimś, komu ufasz, może złagodzić to, co czujesz.'},
    ],
    section5Body: 'Zmiana nastroju związana z cyklem jest zwykle przejściowa. Niektóre objawy zasługują jednak na szczególną uwagę:',
    warningTitle: 'Objawy, na które warto zwracać uwagę',
    concerningSigns: [
      'Intensywny smutek lub smutek utrzymujący się poza cyklem',
      'Wyraźna utrata zainteresowania rzeczami, które zwykle sprawiają Ci przyjemność',
      'Znaczny wpływ na codzienne życie lub relacje',
      'Natrętne myśli lub silne poczucie cierpienia',
    ],
    info2Title: 'Wsparcie jest dostępne',
    info2Text: 'Lekarz, położna lub psycholog może pomóc Ci lepiej zrozumieć to, co czujesz, i w razie potrzeby skierować Cię po dalsze wsparcie.',
    tipTitle: 'Warto wiedzieć',
    tipText: 'Dostrzeżenie związku między hormonami a nastrojem może pomóc lepiej zrozumieć to, co czujesz, bez sprowadzania wszystkiego do tego jednego wyjaśnienia.',
    summaryPoints: [
      'Wahania estrogenu i progesteronu bezpośrednio wpływają na neuroprzekaźniki związane z nastrojem.',
      'Drażliwość przedmiesiączkowa ma więc realne wyjaśnienie biologiczne.',
      'Nie każda zmiana nastroju musi być związana z cyklem: znaczenie mają też okoliczności życiowe.',
      'Sen, aktywność fizyczna i wsparcie społeczne pozostają najlepszymi sprzymierzeńcami w stabilizowaniu nastroju.',
    ],
    disclaimerText: 'Treść informacyjna. Ten artykuł nie zastępuje spersonalizowanej porady medycznej ani psychologicznej. W razie wątpliwości zasięgnij porady specjalisty.',
    shareMessage: 'Nastrój a wahania hormonalne — AWA',
  },
  uk: {
    badge: 'МЕНСТРУАЛЬНИЙ ЦИКЛ • НАСТРІЙ',
    title: 'Настрій і гормональні\nколивання',
    metaDuration: '6 хв читання',
    metaType: 'Стаття',
    metaLevel: 'Початковий',
    metaValidated: 'Перевірений вміст',
    intro: 'Чому ваш настрій може змінюватися протягом циклу, хоча й не завжди.',
    contentsTitle: 'У цій статті',
    topics: [
      'Чому настрій може змінюватися',
      'Настрій у різних фазах циклу',
      'Спостереження за власними змінами',
      'Звички, що можуть допомогти',
      'Коли зміни стають тривожними',
      'Головні висновки',
    ],
    section1Body: 'Коливання естрогену та прогестерону безпосередньо впливають на нейромедіатори, пов’язані з настроєм, як-от серотонін.',
    info1Title: 'Пам’ятайте',
    info1Text: 'Не кожна зміна настрою обов’язково пов’язана з вашим циклом: важливу роль відіграють також життєві обставини, стрес і втома.',
    phaseMood: [
      {title: 'Під час менструації', text: 'Втома й емоційна чутливість поширені в багатьох людей.'},
      {title: 'Близько овуляції', text: 'Це часто фаза кращої енергії та більшого відчуття добробуту.'},
      {title: 'Перед менструацією', text: 'Дратівливість чи перепади настрою в цей час трапляються частіше.'},
    ],
    section2Body: 'Передменструальна дратівливість чи перепади настрою в менопаузі мають тому реальне біологічне пояснення, навіть якщо не проявляються однаково в усіх.',
    observeHabits: [
      {title: 'Ведення щоденника', text: 'Запис настрою та фази циклу допомагає помітити власні закономірності.'},
      {title: 'Виявлення закономірностей', text: 'Без осуду себе: мета — краще пізнати себе, а не контролювати все.'},
    ],
    section4Body: 'Сон, фізична активність і соціальна підтримка залишаються найкращими союзниками у стабілізації настрою.',
    helpfulHabits: [
      {title: 'Достатньо сну', text: 'Брак сну часто підвищує емоційну чутливість.'},
      {title: 'Регулярна фізична активність', text: 'Навіть помірна активність допомагає стабілізувати настрій протягом циклу.'},
      {title: 'Соціальна підтримка', text: 'Розмова з кимось, кому ви довіряєте, може полегшити те, що ви відчуваєте.'},
    ],
    section5Body: 'Зміна настрою, пов’язана з циклом, зазвичай тимчасова. Проте певні ознаки заслуговують на особливу увагу:',
    warningTitle: 'Ознаки, на які варто звертати увагу',
    concerningSigns: [
      'Інтенсивний смуток або смуток, що зберігається поза циклом',
      'Виразна втрата інтересу до того, що зазвичай приносить вам радість',
      'Значний вплив на щоденне життя чи стосунки',
      'Нав’язливі думки або виразне відчуття страждання',
    ],
    info2Title: 'Підтримка доступна',
    info2Text: 'Лікар, акушерка чи психолог можуть допомогти вам краще зрозуміти, що ви відчуваєте, і за потреби скерувати до подальшої підтримки.',
    tipTitle: 'Варто знати',
    tipText: 'Усвідомлення зв’язку між гормонами та настроєм може допомогти краще зрозуміти те, що ви відчуваєте, не зводячи все до цього єдиного пояснення.',
    summaryPoints: [
      'Коливання естрогену та прогестерону безпосередньо впливають на нейромедіатори, пов’язані з настроєм.',
      'Передменструальна дратівливість має тому реальне біологічне пояснення.',
      'Не кожна зміна настрою обов’язково пов’язана з циклом: важливі й життєві обставини.',
      'Сон, фізична активність і соціальна підтримка залишаються найкращими союзниками у стабілізації настрою.',
    ],
    disclaimerText: 'Інформаційний вміст. Ця стаття не замінює персоналізованої медичної чи психологічної поради. У разі сумнівів зверніться до медичного фахівця.',
    shareMessage: 'Настрій і гормональні коливання — AWA',
  },
  cs: {
    badge: 'MENSTRUAČNÍ CYKLUS • NÁLADA',
    title: 'Nálada a hormonální\nvýkyvy',
    metaDuration: '6 min čtení',
    metaType: 'Článek',
    metaLevel: 'Začátečník',
    metaValidated: 'Ověřený obsah',
    intro: 'Proč se vaše nálada může v průběhu cyklu měnit, i když ne vždy.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Proč se nálada může měnit',
      'Nálada v jednotlivých fázích cyklu',
      'Pozorování vlastních výkyvů',
      'Návyky, které mohou pomoci',
      'Kdy se změny stávají znepokojivými',
      'Hlavní poznatky',
    ],
    section1Body: 'Kolísání estrogenu a progesteronu přímo ovlivňuje neurotransmitery související s náladou, například serotonin.',
    info1Title: 'Mějte na paměti',
    info1Text: 'Ne každý výkyv nálady nutně souvisí s cyklem: důležitou roli hrají také životní okolnosti, stres a únava.',
    phaseMood: [
      {title: 'Během menstruace', text: 'Únava a emoční citlivost jsou u mnoha žen běžné.'},
      {title: 'Kolem ovulace', text: 'Často jde o fázi lepší energie a většího pocitu pohody.'},
      {title: 'Před menstruací', text: 'Podrážděnost nebo výkyvy nálady jsou v této době častější.'},
    ],
    section2Body: 'Předmenstruační podrážděnost nebo výkyvy nálady v menopauze tedy mají skutečné biologické vysvětlení, i když se neprojevují u všech stejně.',
    observeHabits: [
      {title: 'Vedení deníku', text: 'Zapisování nálady a fáze cyklu vám pomáhá rozpoznat vlastní vzorce.'},
      {title: 'Rozpoznávání vzorců', text: 'Bez odsuzování sebe sama: cílem je lépe se poznat, ne mít vše pod kontrolou.'},
    ],
    section4Body: 'Spánek, fyzická aktivita a sociální podpora zůstávají nejlepšími spojenci pro stabilizaci nálady.',
    helpfulHabits: [
      {title: 'Dostatek spánku', text: 'Nedostatek spánku často zvyšuje emoční citlivost.'},
      {title: 'Pravidelná fyzická aktivita', text: 'I mírná aktivita pomáhá stabilizovat náladu v průběhu cyklu.'},
      {title: 'Sociální podpora', text: 'Rozhovor s někým, komu důvěřujete, může zmírnit to, co cítíte.'},
    ],
    section5Body: 'Změna nálady spojená s cyklem je obvykle přechodná. Některé příznaky si však zaslouží zvláštní pozornost:',
    warningTitle: 'Příznaky, kterých si všímat',
    concerningSigns: [
      'Intenzivní smutek nebo smutek, který přetrvává i mimo cyklus',
      'Výrazná ztráta zájmu o věci, které vás obvykle baví',
      'Výrazný dopad na váš každodenní život nebo vztahy',
      'Vtíravé myšlenky nebo výrazný pocit tísně',
    ],
    info2Title: 'Podpora je k dispozici',
    info2Text: 'Lékař, porodní asistentka nebo psycholog vám může pomoci lépe porozumět tomu, co cítíte, a v případě potřeby vás odkázat na další podporu.',
    tipTitle: 'Stojí za to vědět',
    tipText: 'Rozpoznání souvislosti mezi hormony a náladou vám může pomoci lépe pochopit, co cítíte, aniž byste vše redukovala na toto jediné vysvětlení.',
    summaryPoints: [
      'Kolísání estrogenu a progesteronu přímo ovlivňuje neurotransmitery související s náladou.',
      'Předmenstruační podrážděnost má tedy skutečné biologické vysvětlení.',
      'Ne každý výkyv nálady nutně souvisí s cyklem: záleží i na životních okolnostech.',
      'Spánek, fyzická aktivita a sociální podpora zůstávají nejlepšími spojenci pro stabilizaci nálady.',
    ],
    disclaimerText: 'Informativní obsah. Tento článek nenahrazuje individuální lékařskou ani psychologickou radu. V případě pochybností požádejte o radu zdravotnického pracovníka.',
    shareMessage: 'Nálada a hormonální výkyvy — AWA',
  },
  sk: {
    badge: 'MENŠTRUAČNÝ CYKLUS • NÁLADA',
    title: 'Nálada a hormonálne\nkolísanie',
    metaDuration: '6 min čítania',
    metaType: 'Článok',
    metaLevel: 'Začiatočník',
    metaValidated: 'Overený obsah',
    intro: 'Prečo sa vaša nálada môže počas cyklu meniť, hoci nie vždy.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Prečo sa nálada môže meniť',
      'Nálada v jednotlivých fázach cyklu',
      'Sledovanie vlastných zmien',
      'Návyky, ktoré môžu pomôcť',
      'Keď sa zmeny stanú znepokojujúcimi',
      'Hlavné body',
    ],
    section1Body: 'Kolísanie estrogénu a progesterónu priamo ovplyvňuje neurotransmitery súvisiace s náladou, ako je serotonín.',
    info1Title: 'Pamätajte',
    info1Text: 'Nie každá zmena nálady nevyhnutne súvisí s vaším cyklom: dôležitú úlohu zohrávajú aj životné okolnosti, stres a únava.',
    phaseMood: [
      {title: 'Počas menštruácie', text: 'Únava a emočná citlivosť sú u mnohých žien bežné.'},
      {title: 'Okolo ovulácie', text: 'Je to často fáza lepšej energie a väčšieho pocitu pohody.'},
      {title: 'Pred menštruáciou', text: 'Podráždenosť alebo zmeny nálady sú v tomto období častejšie.'},
    ],
    section2Body: 'Premenštruačná podráždenosť alebo výkyvy nálady v menopauze majú teda skutočné biologické vysvetlenie, aj keď sa neprejavujú u každej rovnako.',
    observeHabits: [
      {title: 'Viesť denník', text: 'Zapisovanie nálady a fázy cyklu vám pomáha rozpoznať vlastné vzorce.'},
      {title: 'Rozpoznať vzorce', text: 'Bez posudzovania seba: cieľom je lepšie sa poznať, nie mať všetko pod kontrolou.'},
    ],
    section4Body: 'Spánok, fyzická aktivita a sociálna podpora zostávajú najlepšími spojencami pri stabilizácii nálady.',
    helpfulHabits: [
      {title: 'Dostatok spánku', text: 'Nedostatok spánku často zvyšuje emočnú citlivosť.'},
      {title: 'Pravidelná fyzická aktivita', text: 'Aj mierna aktivita pomáha stabilizovať náladu počas cyklu.'},
      {title: 'Sociálna podpora', text: 'Rozhovor s niekým, komu dôverujete, môže zmierniť to, čo cítite.'},
    ],
    section5Body: 'Zmena nálady súvisiaca s cyklom je zvyčajne dočasná. Niektoré znaky si však zaslúžia osobitnú pozornosť:',
    warningTitle: 'Znaky, ktoré treba sledovať',
    concerningSigns: [
      'Intenzívny smútok alebo smútok, ktorý pretrváva aj mimo cyklu',
      'Výrazná strata záujmu o veci, ktoré vás zvyčajne tešia',
      'Výrazný vplyv na váš každodenný život alebo vzťahy',
      'Vtieravé myšlienky alebo výrazný pocit tiesne',
    ],
    info2Title: 'Podpora je dostupná',
    info2Text: 'Lekár, pôrodná asistentka alebo psychológ vám môže pomôcť lepšie pochopiť, čo cítite, a v prípade potreby vás nasmerovať k ďalšej podpore.',
    tipTitle: 'Stojí za to vedieť',
    tipText: 'Rozpoznanie súvislosti medzi hormónmi a náladou vám môže pomôcť lepšie pochopiť, čo cítite, bez toho, aby ste všetko zredukovali na toto jediné vysvetlenie.',
    summaryPoints: [
      'Kolísanie estrogénu a progesterónu priamo ovplyvňuje neurotransmitery súvisiace s náladou.',
      'Premenštruačná podráždenosť má teda skutočné biologické vysvetlenie.',
      'Nie každá zmena nálady nevyhnutne súvisí s cyklom: dôležité sú aj životné okolnosti.',
      'Spánok, fyzická aktivita a sociálna podpora zostávajú najlepšími spojencami pri stabilizácii nálady.',
    ],
    disclaimerText: 'Informatívny obsah. Tento článok nenahrádza individuálnu lekársku ani psychologickú radu. V prípade pochybností sa poraďte so zdravotníckym pracovníkom.',
    shareMessage: 'Nálada a hormonálne kolísanie — AWA',
  },
  hu: {
    badge: 'MENSTRUÁCIÓS CIKLUS • HANGULAT',
    title: 'Hangulat és hormonális\ningadozások',
    metaDuration: '6 perc olvasás',
    metaType: 'Cikk',
    metaLevel: 'Kezdő',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'Miért változhat a hangulatod a ciklusod során, bár nem mindig.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Miért változhat a hangulat',
      'A hangulat a ciklus szakaszaiban',
      'A saját ingadozásaid megfigyelése',
      'Szokások, amelyek segíthetnek',
      'Amikor a változások aggasztóvá válnak',
      'Legfontosabb tudnivalók',
    ],
    section1Body: 'Az ösztrogén és a progeszteron ingadozása közvetlenül befolyásolja a hangulattal összefüggő neurotranszmittereket, például a szerotonint.',
    info1Title: 'Tartsd észben',
    info1Text: 'Nem minden hangulatváltozás feltétlenül a ciklusodhoz kapcsolódik: az élethelyzetek, a stressz és a fáradtság is fontos szerepet játszanak.',
    phaseMood: [
      {title: 'A menstruáció alatt', text: 'A fáradtság és az érzelmi érzékenység sok nőnél gyakori.'},
      {title: 'A peteérés körül', text: 'Ez gyakran a jobb energia és a nagyobb jólét szakasza.'},
      {title: 'A menstruáció előtt', text: 'Az ingerlékenység vagy a hangulatingadozás ebben az időszakban gyakoribb.'},
    ],
    section2Body: 'A premenstruációs ingerlékenységnek vagy a menopauza alatti hangulatingadozásoknak ezért valódi biológiai magyarázata van, még ha nem is mindenkinél jelentkeznek ugyanúgy.',
    observeHabits: [
      {title: 'Napló vezetése', text: 'A hangulatod és a ciklusszakaszod feljegyzése segít felismerni a saját mintáidat.'},
      {title: 'Minták felismerése', text: 'Önmagad megítélése nélkül: a cél az, hogy jobban megismerd magad, nem az, hogy mindent kontrolláljál.'},
    ],
    section4Body: 'Az alvás, a testmozgás és a társas támogatás maradnak a legjobb szövetségeseid a hangulat stabilizálásában.',
    helpfulHabits: [
      {title: 'Elegendő alvás', text: 'Az alváshiány gyakran fokozza az érzelmi érzékenységet.'},
      {title: 'Rendszeres testmozgás', text: 'Még a mérsékelt aktivitás is segít stabilizálni a hangulatot a ciklus során.'},
      {title: 'Társas támogatás', text: 'Ha beszélsz valakivel, akiben megbízol, az enyhítheti, amit érzel.'},
    ],
    section5Body: 'A ciklushoz kapcsolódó hangulatváltozás általában átmeneti. Bizonyos jelek azonban különös figyelmet érdemelnek:',
    warningTitle: 'Figyelendő jelek',
    concerningSigns: [
      'Intenzív szomorúság, vagy a cikluson túl is fennálló szomorúság',
      'Az általában élvezett dolgok iránti érdeklődés kifejezett elvesztése',
      'Jelentős hatás a mindennapi életedre vagy a kapcsolataidra',
      'Tolakodó gondolatok vagy jelentős szorongásérzés',
    ],
    info2Title: 'Van segítség',
    info2Text: 'Egy orvos, szülésznő vagy pszichológus segíthet jobban megérteni, amit érzel, és szükség esetén további támogatáshoz irányíthat.',
    tipTitle: 'Érdemes tudni',
    tipText: 'A hormonok és a hangulat közötti kapcsolat felismerése segíthet jobban megérteni, amit érzel, anélkül, hogy mindent erre az egyetlen magyarázatra egyszerűsítenél.',
    summaryPoints: [
      'Az ösztrogén és a progeszteron ingadozása közvetlenül befolyásolja a hangulattal összefüggő neurotranszmittereket.',
      'A premenstruációs ingerlékenységnek ezért valódi biológiai magyarázata van.',
      'Nem minden hangulatváltozás feltétlenül a ciklushoz kapcsolódik: az élethelyzetek is számítanak.',
      'Az alvás, a testmozgás és a társas támogatás maradnak a legjobb szövetségeseid a hangulat stabilizálásában.',
    ],
    disclaimerText: 'Tájékoztató jellegű tartalom. Ez a cikk nem helyettesíti a személyre szabott orvosi vagy pszichológiai tanácsot. Kétség esetén kérj útmutatást egészségügyi szakembertől.',
    shareMessage: 'Hangulat és hormonális ingadozások — AWA',
  },
  ro: {
    badge: 'CICLUL MENSTRUAL • STAREA DE SPIRIT',
    title: 'Starea de spirit și\nfluctuațiile hormonale',
    metaDuration: '6 min de citit',
    metaType: 'Articol',
    metaLevel: 'Începător',
    metaValidated: 'Conținut revizuit',
    intro: 'De ce starea ta de spirit poate varia pe parcursul ciclului, deși nu întotdeauna.',
    contentsTitle: 'În acest articol',
    topics: [
      'De ce poate varia starea de spirit',
      'Starea de spirit în fazele ciclului',
      'Observarea propriilor variații',
      'Obiceiuri care pot ajuta',
      'Când schimbările devin îngrijorătoare',
      'Ce să reții',
    ],
    section1Body: 'Fluctuațiile estrogenului și progesteronului influențează direct neurotransmițătorii legați de starea de spirit, precum serotonina.',
    info1Title: 'De ținut minte',
    info1Text: 'Nu orice schimbare de dispoziție este neapărat legată de ciclul tău: circumstanțele de viață, stresul și oboseala joacă și ele un rol important.',
    phaseMood: [
      {title: 'În timpul menstruației', text: 'Oboseala și sensibilitatea emoțională sunt frecvente la multe persoane.'},
      {title: 'În jurul ovulației', text: 'Aceasta este adesea o fază cu mai multă energie și cu un sentiment mai mare de bine.'},
      {title: 'Înainte de menstruație', text: 'Irascibilitatea sau schimbările de dispoziție sunt mai frecvente în această perioadă.'},
    ],
    section2Body: 'Irascibilitatea premenstruală sau schimbările de dispoziție din menopauză au, așadar, o explicație biologică reală, chiar dacă nu se manifestă la fel la toată lumea.',
    observeHabits: [
      {title: 'Ținerea unui jurnal', text: 'Notarea stării tale de spirit și a fazei ciclului te ajută să-ți descoperi propriile tipare.'},
      {title: 'Identificarea tiparelor', text: 'Fără să te judeci: scopul este să te cunoști mai bine, nu să controlezi totul.'},
    ],
    section4Body: 'Somnul, activitatea fizică și sprijinul social rămân cei mai buni aliați pentru stabilizarea stării de spirit.',
    helpfulHabits: [
      {title: 'Suficient somn', text: 'Lipsa somnului accentuează adesea sensibilitatea emoțională.'},
      {title: 'Activitate fizică regulată', text: 'Chiar și o activitate moderată ajută la stabilizarea stării de spirit pe parcursul ciclului.'},
      {title: 'Sprijin social', text: 'Discuția cu o persoană în care ai încredere poate ușura ceea ce simți.'},
    ],
    section5Body: 'O schimbare a stării de spirit legată de ciclul tău este de obicei trecătoare. Totuși, anumite semne merită o atenție deosebită:',
    warningTitle: 'Semne de urmărit',
    concerningSigns: [
      'O tristețe intensă sau o tristețe care persistă dincolo de ciclu',
      'O pierdere marcată a interesului pentru lucrurile care îți plac de obicei',
      'Un impact important asupra vieții tale de zi cu zi sau asupra relațiilor',
      'Gânduri intruzive sau un sentiment important de suferință',
    ],
    info2Title: 'Sprijinul este disponibil',
    info2Text: 'Un medic, o moașă sau un psiholog te poate ajuta să înțelegi mai bine ce simți și te poate orienta, la nevoie, spre un sprijin suplimentar.',
    tipTitle: 'Bine de știut',
    tipText: 'Recunoașterea legăturii dintre hormoni și starea de spirit te poate ajuta să înțelegi mai bine ce simți, fără a reduce totul la această singură explicație.',
    summaryPoints: [
      'Fluctuațiile estrogenului și progesteronului influențează direct neurotransmițătorii legați de starea de spirit.',
      'Irascibilitatea premenstruală are, așadar, o explicație biologică reală.',
      'Nu orice schimbare de dispoziție este neapărat legată de ciclu: circumstanțele de viață contează și ele.',
      'Somnul, activitatea fizică și sprijinul social rămân cei mai buni aliați pentru stabilizarea stării de spirit.',
    ],
    disclaimerText: 'Conținut cu caracter informativ. Acest articol nu înlocuiește sfatul medical sau psihologic personalizat. Dacă ai îndoieli, cere îndrumare unui profesionist din domeniul sănătății.',
    shareMessage: 'Starea de spirit și fluctuațiile hormonale — AWA',
  },
  bg: {
    badge: 'МЕНСТРУАЛЕН ЦИКЪЛ • НАСТРОЕНИЕ',
    title: 'Настроение и хормонални\nколебания',
    metaDuration: '6 мин четене',
    metaType: 'Статия',
    metaLevel: 'Начинаещ',
    metaValidated: 'Проверено съдържание',
    intro: 'Защо настроението ти може да се променя през цикъла, макар и не винаги.',
    contentsTitle: 'В тази статия',
    topics: [
      'Защо настроението може да се променя',
      'Настроението през фазите на цикъла',
      'Наблюдение на собствените ти промени',
      'Навици, които могат да помогнат',
      'Когато промените станат тревожни',
      'Какво да запомниш',
    ],
    section1Body: 'Колебанията на естрогена и прогестерона влияят пряко на невротрансмитерите, свързани с настроението, като серотонина.',
    info1Title: 'Помни',
    info1Text: 'Не всяка промяна в настроението е непременно свързана с цикъла: житейските обстоятелства, стресът и умората също играят важна роля.',
    phaseMood: [
      {title: 'По време на менструация', text: 'Умората и емоционалната чувствителност са чести при много хора.'},
      {title: 'Около овулацията', text: 'Това често е фаза с по-добра енергия и по-силно усещане за благополучие.'},
      {title: 'Преди менструация', text: 'Раздразнителността или промените в настроението са по-чести в този период.'},
    ],
    section2Body: 'Предменструалната раздразнителност или промените в настроението при менопауза имат реално биологично обяснение, дори да не се проявяват по един и същи начин при всеки.',
    observeHabits: [
      {title: 'Водене на дневник', text: 'Записването на настроението и фазата на цикъла ти помага да забележиш собствените си модели.'},
      {title: 'Разпознаване на модели', text: 'Без да се съдиш: целта е да се познаваш по-добре, а не да контролираш всичко.'},
    ],
    section4Body: 'Сънят, физическата активност и социалната подкрепа остават най-добрите съюзници за стабилизиране на настроението.',
    helpfulHabits: [
      {title: 'Достатъчно сън', text: 'Недостигът на сън често засилва емоционалната чувствителност.'},
      {title: 'Редовна физическа активност', text: 'Дори умерената активност помага за стабилизиране на настроението през целия цикъл.'},
      {title: 'Социална подкрепа', text: 'Разговорът с човек, на когото се доверяваш, може да облекчи онова, което чувстваш.'},
    ],
    section5Body: 'Промяната в настроението, свързана с цикъла, обикновено е временна. Въпреки това някои признаци заслужават особено внимание:',
    warningTitle: 'Признаци, които да следиш',
    concerningSigns: [
      'Силна тъга или тъга, която продължава извън цикъла',
      'Изразена загуба на интерес към неща, които обикновено обичаш',
      'Значително влияние върху ежедневието или отношенията ти',
      'Натрапчиви мисли или значително чувство на страдание',
    ],
    info2Title: 'Подкрепата е налична',
    info2Text: 'Лекар, акушерка или психолог може да ти помогне да разбереш по-добре какво чувстваш и при нужда да те насочи към допълнителна подкрепа.',
    tipTitle: 'Добре е да знаеш',
    tipText: 'Разпознаването на връзката между хормоните и настроението може да ти помогне да разбереш по-добре какво чувстваш, без всичко да се свежда до това едно обяснение.',
    summaryPoints: [
      'Колебанията на естрогена и прогестерона влияят пряко на невротрансмитерите, свързани с настроението.',
      'Предменструалната раздразнителност има реално биологично обяснение.',
      'Не всяка промяна в настроението е непременно свързана с цикъла: житейските обстоятелства също имат значение.',
      'Сънят, физическата активност и социалната подкрепа остават най-добрите съюзници за стабилизиране на настроението.',
    ],
    disclaimerText: 'Информационно съдържание. Тази статия не замества персонализирания медицински или психологически съвет. При съмнение потърси насоки от здравен специалист.',
    shareMessage: 'Настроение и хормонални колебания — AWA',
  },
  sr: {
    badge: 'МЕНСТРУАЛНИ ЦИКЛУС • РАСПОЛОЖЕЊЕ',
    title: 'Расположење и хормонске\nфлуктуације',
    metaDuration: '6 мин читања',
    metaType: 'Чланак',
    metaLevel: 'Почетник',
    metaValidated: 'Проверен садржај',
    intro: 'Зашто твоје расположење може варирати током циклуса, мада не увек.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Зашто расположење може варирати',
      'Расположење кроз фазе циклуса',
      'Посматрање сопствених промена',
      'Навике које могу помоћи',
      'Када промене постају забрињавајуће',
      'Шта да запамтиш',
    ],
    section1Body: 'Флуктуације естрогена и прогестерона директно утичу на невротрансмитере повезане са расположењем, као што је серотонин.',
    info1Title: 'Имај на уму',
    info1Text: 'Не мора свака промена расположења бити повезана са твојим циклусом: животне околности, стрес и умор такође играју важну улогу.',
    phaseMood: [
      {title: 'Током менструације', text: 'Умор и емоционална осетљивост су чести код многих особа.'},
      {title: 'Око овулације', text: 'Ово је често фаза боље енергије и израженијег осећаја добробити.'},
      {title: 'Пре менструације', text: 'Раздражљивост или промене расположења чешћи су у овом периоду.'},
    ],
    section2Body: 'Предменструална раздражљивост или промене расположења у менопаузи зато имају стварно биолошко објашњење, чак и ако се не испољавају исто код сваке особе.',
    observeHabits: [
      {title: 'Вођење дневника', text: 'Бележење расположења и фазе циклуса помаже ти да уочиш сопствене обрасце.'},
      {title: 'Препознавање образаца', text: 'Без осуђивања себе: циљ је да боље упознаш себе, а не да све контролишеш.'},
    ],
    section4Body: 'Сан, физичка активност и друштвена подршка остају најбољи савезници за стабилизацију расположења.',
    helpfulHabits: [
      {title: 'Довољно сна', text: 'Недостатак сна често појачава емоционалну осетљивост.'},
      {title: 'Редовна физичка активност', text: 'Чак и умерена активност помаже у стабилизацији расположења током циклуса.'},
      {title: 'Друштвена подршка', text: 'Разговор са неким коме верујеш може олакшати оно што осећаш.'},
    ],
    section5Body: 'Промена расположења повезана са циклусом обично је привремена. Међутим, одређени знаци заслужују посебну пажњу:',
    warningTitle: 'Знаци на које треба обратити пажњу',
    concerningSigns: [
      'Јака туга или туга која траје и ван циклуса',
      'Изражен губитак интересовања за ствари у којима иначе уживаш',
      'Значајан утицај на свакодневни живот или односе',
      'Упорне мисли или значајан осећај патње',
    ],
    info2Title: 'Подршка је доступна',
    info2Text: 'Лекар, бабица или психолог може ти помоћи да боље разумеш оно што осећаш и по потреби те упутити на даљу подршку.',
    tipTitle: 'Добро је знати',
    tipText: 'Препознавање везе између хормона и расположења може ти помоћи да боље разумеш оно што осећаш, без свођења свега на ово једно објашњење.',
    summaryPoints: [
      'Флуктуације естрогена и прогестерона директно утичу на невротрансмитере повезане са расположењем.',
      'Предменструална раздражљивост има стварно биолошко објашњење.',
      'Не мора свака промена расположења бити повезана са циклусом: и животне околности су важне.',
      'Сан, физичка активност и друштвена подршка остају најбољи савезници за стабилизацију расположења.',
    ],
    disclaimerText: 'Информативни садржај. Овај чланак не замењује персонализовани медицински или психолошки савет. При сумњи потражи смернице од здравственог радника.',
    shareMessage: 'Расположење и хормонске флуктуације — AWA',
  },
  hr: {
    badge: 'MENSTRUALNI CIKLUS • RASPOLOŽENJE',
    title: 'Raspoloženje i hormonske\nfluktuacije',
    metaDuration: '6 min čitanja',
    metaType: 'Članak',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Zašto se tvoje raspoloženje može mijenjati tijekom ciklusa, iako ne uvijek.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Zašto se raspoloženje može mijenjati',
      'Raspoloženje kroz faze ciklusa',
      'Promatranje vlastitih promjena',
      'Navike koje mogu pomoći',
      'Kada promjene postanu zabrinjavajuće',
      'Ključne poruke',
    ],
    section1Body: 'Fluktuacije estrogena i progesterona izravno utječu na neurotransmitere povezane s raspoloženjem, poput serotonina.',
    info1Title: 'Imaj na umu',
    info1Text: 'Svaka promjena raspoloženja nije nužno povezana s tvojim ciklusom: životne okolnosti, stres i umor također imaju važnu ulogu.',
    phaseMood: [
      {title: 'Tijekom menstruacije', text: 'Umor i emocionalna osjetljivost česti su kod mnogih osoba.'},
      {title: 'Oko ovulacije', text: 'To je često faza bolje energije i većeg osjećaja dobrobiti.'},
      {title: 'Prije menstruacije', text: 'Razdražljivost ili promjene raspoloženja češći su u tom razdoblju.'},
    ],
    section2Body: 'Predmenstrualna razdražljivost ili promjene raspoloženja u menopauzi stoga imaju stvarno biološko objašnjenje, iako se ne pokazuju jednako kod svake žene.',
    observeHabits: [
      {title: 'Vođenje dnevnika', text: 'Bilježenje raspoloženja i faze ciklusa pomaže ti uočiti vlastite obrasce.'},
      {title: 'Prepoznavanje obrazaca', text: 'Bez osuđivanja sebe: cilj je bolje upoznati sebe, a ne imati kontrolu nad svime.'},
    ],
    section4Body: 'San, tjelesna aktivnost i društvena podrška ostaju najbolji saveznici za stabilizaciju raspoloženja.',
    helpfulHabits: [
      {title: 'Dovoljno sna', text: 'Nedostatak sna često pojačava emocionalnu osjetljivost.'},
      {title: 'Redovita tjelesna aktivnost', text: 'Čak i umjerena aktivnost pomaže stabilizirati raspoloženje tijekom ciklusa.'},
      {title: 'Društvena podrška', text: 'Razgovor s osobom kojoj vjeruješ može ublažiti ono što osjećaš.'},
    ],
    section5Body: 'Promjena raspoloženja povezana s ciklusom obično je privremena. Međutim, određeni znakovi zaslužuju posebnu pozornost:',
    warningTitle: 'Znakovi na koje treba paziti',
    concerningSigns: [
      'Intenzivna tuga ili tuga koja traje i nakon ciklusa',
      'Izrazit gubitak zanimanja za stvari u kojima inače uživaš',
      'Znatan utjecaj na svakodnevni život ili odnose',
      'Nametljive misli ili snažan osjećaj patnje',
    ],
    info2Title: 'Podrška je dostupna',
    info2Text: 'Liječnik, babica ili psiholog može ti pomoći bolje razumjeti što osjećaš i, ako je potrebno, uputiti te na daljnju podršku.',
    tipTitle: 'Dobro je znati',
    tipText: 'Prepoznavanje veze između hormona i raspoloženja može ti pomoći bolje razumjeti što osjećaš, bez svođenja svega na to jedno objašnjenje.',
    summaryPoints: [
      'Fluktuacije estrogena i progesterona izravno utječu na neurotransmitere povezane s raspoloženjem.',
      'Predmenstrualna razdražljivost stoga ima stvarno biološko objašnjenje.',
      'Svaka promjena raspoloženja nije nužno povezana s ciklusom: važne su i životne okolnosti.',
      'San, tjelesna aktivnost i društvena podrška ostaju najbolji saveznici za stabilizaciju raspoloženja.',
    ],
    disclaimerText: 'Informativni sadržaj. Ovaj članak ne zamjenjuje individualni medicinski ni psihološki savjet. U slučaju nedoumice zatraži savjet zdravstvenog djelatnika.',
    shareMessage: 'Raspoloženje i hormonske fluktuacije — AWA',
  },
  bs: {
    badge: 'MENSTRUALNI CIKLUS • RASPOLOŽENJE',
    title: 'Raspoloženje i hormonske\nfluktuacije',
    metaDuration: '6 min čitanja',
    metaType: 'Članak',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Zašta se tvoje raspoloženje može mijenjati tokom ciklusa, iako ne uvijek.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Zašta se raspoloženje može mijenjati',
      'Raspoloženje kroz faze ciklusa',
      'Promatranje vlastitih promjena',
      'Navike koje mogu pomoći',
      'Kada promjene postanu zabrinjavajuće',
      'Ključne poruke',
    ],
    section1Body: 'Fluktuacije estrogena i progesterona izravno utječu na neurotransmitere povezane s raspoloženjem, poput serotonina.',
    info1Title: 'Imaj na umu',
    info1Text: 'Svaka promjena raspoloženja nije nužno povezana s tvojim ciklusom: životne okolnosti, stres i umor također imaju važnu ulogu.',
    phaseMood: [
      {title: 'Tokom menstruacije', text: 'Umor i emocionalna osjetljivost česti su kod mnogih osoba.'},
      {title: 'Oko ovulacije', text: 'To je često faza bolje energije i većeg osjećaja dobrobiti.'},
      {title: 'Prije menstruacije', text: 'Razdražljivost ili promjene raspoloženja češći su u tom razdoblju.'},
    ],
    section2Body: 'Predmenstrualna razdražljivost ili promjene raspoloženja u menopauzi stoga imaju stvarno biološko objašnjenje, iako se ne pokazuju jednako kod svake žene.',
    observeHabits: [
      {title: 'Vođenje dnevnika', text: 'Bilježenje raspoloženja i faze ciklusa pomaže ti uočiti vlastite obrasce.'},
      {title: 'Prepoznavanje obrazaca', text: 'Bez osuđivanja sebe: cilj je bolje upoznati sebe, a ne imati kontrolu nad svime.'},
    ],
    section4Body: 'San, tjelesna aktivnost i društvena podrška ostaju najbolji saveznici za stabilizaciju raspoloženja.',
    helpfulHabits: [
      {title: 'Dovoljno sna', text: 'Nedostatak sna često pojačava emocionalnu osjetljivost.'},
      {title: 'Redovita tjelesna aktivnost', text: 'Čak i umjerena aktivnost pomaže stabilizirati raspoloženje tokom ciklusa.'},
      {title: 'Društvena podrška', text: 'Razgovor s osobom kojoj vjeruješ može ublažiti ono što osjećaš.'},
    ],
    section5Body: 'Promjena raspoloženja povezana s ciklusom obično je privremena. Međutim, određeni znakovi zaslužuju posebnu pozornost:',
    warningTitle: 'Znakovi na koje treba paziti',
    concerningSigns: [
      'Intenzivna tuga ili tuga koja traje i nakon ciklusa',
      'Izrazit gubitak zanimanja za stvari u kojima inače uživaš',
      'Znatan utjecaj na svakodnevni život ili odnose',
      'Nametljive misli ili snažan osjećaj patnje',
    ],
    info2Title: 'Podrška je dostupna',
    info2Text: 'Ljekar, babica ili psiholog može ti pomoći bolje razumjeti što osjećaš i, ako je potrebno, uputiti te na daljnju podršku.',
    tipTitle: 'Dobro je znati',
    tipText: 'Prepoznavanje veze između hormona i raspoloženja može ti pomoći bolje razumjeti što osjećaš, bez svođenja svega na to jedno objašnjenje.',
    summaryPoints: [
      'Fluktuacije estrogena i progesterona izravno utječu na neurotransmitere povezane s raspoloženjem.',
      'Predmenstrualna razdražljivost stoga ima stvarno biološko objašnjenje.',
      'Svaka promjena raspoloženja nije nužno povezana s ciklusom: važne su i životne okolnosti.',
      'San, tjelesna aktivnost i društvena podrška ostaju najbolji saveznici za stabilizaciju raspoloženja.',
    ],
    disclaimerText: 'Informativni sadržaj. Ovaj članak ne zamjenjuje individualni medicinski ni psihološki savjet. U slučaju nedoumice zatraži savjet zdravstvenog radnika.',
    shareMessage: 'Raspoloženje i hormonske fluktuacije — AWA',
  },
  sl: {
    badge: 'MENSTRUALNI CIKEL • RAZPOLOŽENJE',
    title: 'Razpoloženje in hormonska\nnihanja',
    metaDuration: '6 min branja',
    metaType: 'Članek',
    metaLevel: 'Začetnica',
    metaValidated: 'Preverjena vsebina',
    intro: 'Zakaj se tvoje razpoloženje lahko spreminja skozi cikel, čeprav ne vedno.',
    contentsTitle: 'V tem članku',
    topics: [
      'Zakaj se razpoloženje lahko spreminja',
      'Razpoloženje skozi faze cikla',
      'Opazovanje lastnih sprememb',
      'Navade, ki lahko pomagajo',
      'Kdaj spremembe postanejo zaskrbljujoče',
      'Ključna sporočila',
    ],
    section1Body: 'Nihanja estrogena in progesterona neposredno vplivajo na nevrotransmiterje, povezane z razpoloženjem, kot je serotonin.',
    info1Title: 'Imej v mislih',
    info1Text: 'Vsaka sprememba razpoloženja ni nujno povezana s tvojim ciklom: življenjske okoliščine, stres in utrujenost imajo tudi pomembno vlogo.',
    phaseMood: [
      {title: 'Med menstruacijo', text: 'Utrujenost in čustvena občutljivost sta pogosti pri mnogih osebah.'},
      {title: 'Okoli ovulacije', text: 'To je pogosto faza boljše energije in večjega občutka dobrega počutja.'},
      {title: 'Pred menstruacijo', text: 'Razdražljivost ali spremembe razpoloženja so v tem obdobju pogostejše.'},
    ],
    section2Body: 'Predmenstrualna razdražljivost ali spremembe razpoloženja v menopavzi imajo zato resnično biološko razlago, čeprav se ne kažejo enako pri vsaki ženski.',
    observeHabits: [
      {title: 'Vodenje dnevnika', text: 'Beleženje razpoloženja in faze cikla ti pomaga prepoznati lastne vzorce.'},
      {title: 'Prepoznavanje vzorcev', text: 'Brez obsojanja sebe: cilj je bolje spoznati sebe, ne imeti nadzor nad vsem.'},
    ],
    section4Body: 'Spanje, telesna dejavnost in družbena podpora ostajajo najboljši zavezniki za stabilizacijo razpoloženja.',
    helpfulHabits: [
      {title: 'Dovolj spanja', text: 'Pomanjkanje spanja pogosto okrepi čustveno občutljivost.'},
      {title: 'Redna telesna dejavnost', text: 'Tudi zmerna dejavnost pomaga stabilizirati razpoloženje skozi cikel.'},
      {title: 'Družbena podpora', text: 'Pogovor z osebo, ki ji zaupaš, lahko omili tisto, kar čutiš.'},
    ],
    section5Body: 'Sprememba razpoloženja, povezana s ciklom, je običajno začasna. Vendar določeni znaki zaslužijo posebno pozornost:',
    warningTitle: 'Znaki, na katere je treba paziti',
    concerningSigns: [
      'Intenzivna žalost ali žalost, ki traja tudi po koncu cikla',
      'Izrazita izguba zanimanja za stvari, v katerih običajno uživaš',
      'Pomemben vpliv na vsakdanje življenje ali odnose',
      'Vsiljive misli ali močan občutek stiske',
    ],
    info2Title: 'Podpora je na voljo',
    info2Text: 'Zdravnik, babica ali psiholog ti lahko pomaga bolje razumeti, kaj čutiš, in te po potrebi napoti na nadaljnjo podporo.',
    tipTitle: 'Vredno vedeti',
    tipText: 'Prepoznavanje povezave med hormoni in razpoloženjem ti lahko pomaga bolje razumeti, kaj čutiš, brez zvajanja vsega na to eno razlago.',
    summaryPoints: [
      'Nihanja estrogena in progesterona neposredno vplivajo na nevrotransmiterje, povezane z razpoloženjem.',
      'Predmenstrualna razdražljivost ima zato resnično biološko razlago.',
      'Vsaka sprememba razpoloženja ni nujno povezana s ciklom: pomembne so tudi življenjske okoliščine.',
      'Spanje, telesna dejavnost in družbena podpora ostajajo najboljši zavezniki za stabilizacijo razpoloženja.',
    ],
    disclaimerText: 'Informativna vsebina. Ta članek ne nadomešča osebnega zdravniškega ali psihološkega nasveta. V primeru dvoma poišči nasvet zdravstvenega delavca.',
    shareMessage: 'Razpoloženje in hormonska nihanja — AWA',
  },
  ne: {
    badge: 'मासिक चक्र • मनोदशा',
    title: 'मनोदशा र हर्मोनल\nउतारचढाव',
    metaDuration: '6 मिनेट पढाइ',
    metaType: 'लेख',
    metaLevel: 'सुरुवाती',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'तपाईंको चक्रभरि तपाईंको मनोदशा किन फरक हुन सक्छ, यद्यपि सधैँ होइन।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'मनोदशा किन फरक हुन सक्छ',
      'चक्रका चरणहरूमा मनोदशा',
      'आफ्नै भिन्नताहरू अवलोकन गर्ने',
      'मद्दत गर्न सक्ने बानीहरू',
      'परिवर्तन चिन्ताजनक हुँदा',
      'मुख्य कुराहरू',
    ],
    section1Body: 'एस्ट्रोजेन र प्रोजेस्टेरोनमा हुने उतारचढावले सेरोटोनिन जस्ता मनोदशासँग सम्बन्धित न्यूरोट्रान्समिटरहरूलाई सिधै प्रभाव पार्छ।',
    info1Title: 'मनमा राख्नुहोस्',
    info1Text: 'हरेक मनोदशाको उतारचढाव अनिवार्य रूपमा तपाईंको चक्रसँग जोडिएको हुँदैन: जीवनका परिस्थिति, तनाव र थकानले पनि महत्त्वपूर्ण भूमिका खेल्छन्।',
    phaseMood: [
      {title: 'महिनावारीको समयमा', text: 'थकान र भावनात्मक संवेदनशीलता धेरैका लागि सामान्य हो।'},
      {title: 'अण्डोत्सर्गको वरिपरि', text: 'यो प्रायः राम्रो ऊर्जा र बढी भलाइको अनुभूतिको चरण हो।'},
      {title: 'महिनावारीअघि', text: 'यस समयमा चिडचिडाहट वा मनोदशाको उतारचढाव बढी सामान्य हुन्छ।'},
    ],
    section2Body: 'त्यसैले महिनावारीपूर्वको चिडचिडाहट वा रजोनिवृत्तिको मनोदशाको उतारचढावको वास्तविक जैविक व्याख्या छ, यद्यपि ती सबैमा उस्तै रूपमा देखिँदैनन्।',
    observeHabits: [
      {title: 'डायरी राख्ने', text: 'आफ्नो मनोदशा र चक्रको चरण लेख्नाले तपाईंलाई आफ्नै ढाँचा देख्न मद्दत गर्छ।'},
      {title: 'ढाँचाहरू पहिचान गर्ने', text: 'आफूलाई न्याय नगरी: लक्ष्य सबै कुरा नियन्त्रण गर्नु होइन, आफूलाई राम्ररी चिन्नु हो।'},
    ],
    section4Body: 'निद्रा, शारीरिक गतिविधि र सामाजिक साथ मनोदशा स्थिर पार्ने सबैभन्दा राम्रा साथी रहन्छन्।',
    helpfulHabits: [
      {title: 'पर्याप्त निद्रा', text: 'निद्राको कमीले प्रायः भावनात्मक संवेदनशीलता बढाउँछ।'},
      {title: 'नियमित शारीरिक गतिविधि', text: 'मध्यम गतिविधिले पनि चक्रभरि मनोदशा स्थिर पार्न मद्दत गर्छ।'},
      {title: 'सामाजिक साथ', text: 'आफूले विश्वास गर्ने कसैसँग कुरा गर्दा तपाईंले महसुस गरेको कुरा हल्का पार्न सक्छ।'},
    ],
    section5Body: 'चक्रसँग जोडिएको मनोदशाको परिवर्तन सामान्यतया अस्थायी हुन्छ। तथापि, केही संकेतहरूले विशेष ध्यान पाउनुपर्छ:',
    warningTitle: 'ध्यान दिनुपर्ने संकेतहरू',
    concerningSigns: [
      'तीव्र उदासी, वा चक्रभन्दा बाहिर पनि रहिरहने उदासी',
      'तपाईंलाई सामान्यतया मन पर्ने कुराहरूमा स्पष्ट रुचि गुमाउनु',
      'तपाईंको दैनिक जीवन वा सम्बन्धहरूमा ठूलो प्रभाव',
      'घुसपैठ गर्ने विचार वा ठूलो पीडाको अनुभूति',
    ],
    info2Title: 'साथ उपलब्ध छ',
    info2Text: 'चिकित्सक, सुँडेनी वा मनोवैज्ञानिकले तपाईंले के महसुस गरिरहनुभएको छ राम्ररी बुझ्न र आवश्यक परे थप साथका लागि सिफारिस गर्न मद्दत गर्न सक्छन्।',
    tipTitle: 'जान्न लायक',
    tipText: 'हर्मोन र मनोदशाबीचको सम्बन्ध चिन्नाले तपाईंलाई सबै कुरा यही एउटा व्याख्यामा सीमित नगरी आफूले के महसुस गरिरहनुभएको छ राम्ररी बुझ्न मद्दत गर्न सक्छ।',
    summaryPoints: [
      'एस्ट्रोजेन र प्रोजेस्टेरोनमा हुने उतारचढावले मनोदशासँग सम्बन्धित न्यूरोट्रान्समिटरहरूलाई सिधै प्रभाव पार्छ।',
      'त्यसैले महिनावारीपूर्वको चिडचिडाहटको वास्तविक जैविक व्याख्या छ।',
      'हरेक मनोदशाको उतारचढाव अनिवार्य रूपमा चक्रसँग जोडिएको हुँदैन: जीवनका परिस्थितिहरू पनि महत्त्वपूर्ण छन्।',
      'निद्रा, शारीरिक गतिविधि र सामाजिक साथ मनोदशा स्थिर पार्ने सबैभन्दा राम्रा साथी रहन्छन्।',
    ],
    disclaimerText: 'जानकारीमूलक सामग्री। यो लेखले व्यक्तिगत चिकित्सकीय वा मनोवैज्ञानिक सल्लाहको स्थान लिँदैन। शङ्का भए स्वास्थ्यकर्मीसँग मार्गदर्शन लिनुहोस्।',
    shareMessage: 'मनोदशा र हर्मोनल उतारचढाव — AWA',
  },
  si: {
    badge: 'ඔසප් චක්‍රය • මනෝභාවය',
    title: 'මනෝභාවය සහ හෝමෝන\nඋච්චාවචනය',
    metaDuration: 'කියවීමට මිනිත්තු 6',
    metaType: 'ලිපිය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'ඔබේ චක්‍රය පුරා ඔබේ මනෝභාවය වෙනස් විය හැක්කේ ඇයි, නමුත් සෑම විටම නොවේ.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'මනෝභාවය වෙනස් විය හැක්කේ ඇයි',
      'චක්‍රයේ අවධි පුරා මනෝභාවය',
      'ඔබේම වෙනස්කම් නිරීක්ෂණය කිරීම',
      'උපකාරී විය හැකි පුරුදු',
      'වෙනස්කම් කනස්සල්ලට හේතු වන විට',
      'ප්‍රධාන කරුණු',
    ],
    section1Body: 'එස්ට්‍රජන් සහ ප්‍රොජෙස්ටරෝන් උච්චාවචනය සෙරොටොනින් වැනි මනෝභාවයට සම්බන්ධ ස්නායු සම්ප්‍රේෂකවලට කෙලින්ම බලපායි.',
    info1Title: 'මතක තබාගන්න',
    info1Text: 'සෑම මනෝභාව උච්චාවචනයක්ම අනිවාර්යයෙන්ම ඔබේ චක්‍රයට සම්බන්ධ නොවේ: ජීවන තත්ත්වයන්, ආතතිය සහ වෙහෙසද වැදගත් කාර්යභාරයක් ඉටු කරයි.',
    phaseMood: [
      {title: 'ඔබේ ඔසප් කාලයේ', text: 'වෙහෙස සහ චිත්තවේගී සංවේදීතාව බොහෝ දෙනෙකුට පොදුයි.'},
      {title: 'ඩිම්බ මෝචනය වටා', text: 'මෙය බොහෝ විට වඩා හොඳ ශක්තියක් සහ වැඩි යහපැවැත්ම හැඟීමක් ඇති අවධියකි.'},
      {title: 'ඔබේ ඔසප්වලට පෙර', text: 'මෙම කාලය තුළ කෝපශීලී බව හෝ මනෝභාව උච්චාවචනය වඩාත් පොදුයි.'},
    ],
    section2Body: 'එබැවින් ඔසප්වලට පෙර කෝපශීලී බව හෝ ඔසප් නැවතීමේ මනෝභාව උච්චාවචනයට සැබෑ ජීව විද්‍යාත්මක පැහැදිලි කිරීමක් ඇත, ඒවා සෑම කෙනෙකුටම එකම ආකාරයෙන් නොපෙනුනත්.',
    observeHabits: [
      {title: 'දිනපොතක් තබාගැනීම', text: 'ඔබේ මනෝභාවය සහ ඔබේ චක්‍ර අවධිය ලියා තැබීම ඔබේම රටා දැකීමට උපකාරී වේ.'},
      {title: 'රටා හඳුනාගැනීම', text: 'ඔබව විනිශ්චය නොකර: අරමුණ සෑම දෙයක්ම පාලනය කිරීම නොව, ඔබ ගැන වඩා හොඳින් දැනගැනීමයි.'},
    ],
    section4Body: 'නින්ද, ශාරීරික ක්‍රියාකාරකම සහ සමාජ සහාය මනෝභාවය ස්ථාවර කිරීමට හොඳම සහායකයන් ලෙස පවතී.',
    helpfulHabits: [
      {title: 'ප්‍රමාණවත් නින්ද', text: 'නින්ද නොමැතිකම බොහෝ විට චිත්තවේගී සංවේදීතාව වැඩි කරයි.'},
      {title: 'නිතිපතා ශාරීරික ක්‍රියාකාරකම', text: 'මධ්‍යස්ථ ක්‍රියාකාරකම පවා චක්‍රය පුරා මනෝභාවය ස්ථාවර කිරීමට උපකාරී වේ.'},
      {title: 'සමාජ සහාය', text: 'ඔබ විශ්වාස කරන කෙනෙකු සමඟ කතා කිරීම ඔබට දැනෙන දේ සැහැල්ලු කළ හැක.'},
    ],
    section5Body: 'ඔබේ චක්‍රයට සම්බන්ධ මනෝභාව වෙනසක් සාමාන්‍යයෙන් තාවකාලිකයි. කෙසේ වෙතත්, සමහර සලකුණුවලට විශේෂ අවධානයක් ලැබිය යුතුයි:',
    warningTitle: 'අවධානයට ලක් කළ යුතු සලකුණු',
    concerningSigns: [
      'දැඩි දුක, හෝ චක්‍රයෙන් ඔබ්බට පවතින දුක',
      'ඔබ සාමාන්‍යයෙන් රස විඳින දේවල් කෙරෙහි කැපී පෙනෙන උනන්දුව නැති වීමක්',
      'ඔබේ එදිනෙදා ජීවිතයට හෝ සබඳතාවලට සැලකිය යුතු බලපෑමක්',
      'බාධා කරන සිතුවිලි හෝ සැලකිය යුතු දුක්ඛිතභාවයක්',
    ],
    info2Title: 'සහාය ලබාගත හැක',
    info2Text: 'වෛද්‍යවරයෙකුට, ප්‍රසව හෙදියකට, හෝ මනෝවිද්‍යාඥයෙකුට ඔබට දැනෙන දේ වඩා හොඳින් තේරුම් ගැනීමට සහ අවශ්‍ය නම් තවදුරටත් සහායක් වෙත යොමු කිරීමට ඔබට උදව් කළ හැක.',
    tipTitle: 'දැනගත යුතු දේ',
    tipText: 'හෝමෝන සහ මනෝභාවය අතර සම්බන්ධය හඳුනාගැනීම, සෑම දෙයක්ම මෙම එක් පැහැදිලි කිරීමකට අඩු නොකර, ඔබට දැනෙන දේ වඩා හොඳින් තේරුම් ගැනීමට උපකාරී විය හැක.',
    summaryPoints: [
      'එස්ට්‍රජන් සහ ප්‍රොජෙස්ටරෝන් උච්චාවචනය මනෝභාවයට සම්බන්ධ ස්නායු සම්ප්‍රේෂකවලට කෙලින්ම බලපායි.',
      'එබැවින් ඔසප්වලට පෙර කෝපශීලී බවට සැබෑ ජීව විද්‍යාත්මක පැහැදිලි කිරීමක් ඇත.',
      'සෑම මනෝභාව උච්චාවචනයක්ම අනිවාර්යයෙන්ම චක්‍රයට සම්බන්ධ නොවේ: ජීවන තත්ත්වයන්ද වැදගත්.',
      'නින්ද, ශාරීරික ක්‍රියාකාරකම සහ සමාජ සහාය මනෝභාවය ස්ථාවර කිරීමට හොඳම සහායකයන් ලෙස පවතී.',
    ],
    disclaimerText: 'තොරතුරු අන්තර්ගතයකි. මෙම ලිපිය පුද්ගලීකරණය කළ වෛද්‍ය හෝ මනෝවිද්‍යාත්මක උපදෙස් වෙනුවට නොපවතී. සැකයක් ඇත්නම්, සෞඛ්‍ය වෘත්තිකයෙකුගෙන් මඟපෙන්වීමක් ලබා ගන්න.',
    shareMessage: 'මනෝභාවය සහ හෝමෝන උච්චාවචනය — AWA',
  },
  th: {
    badge: 'รอบเดือน • อารมณ์',
    title: 'อารมณ์กับความผันผวน\nของฮอร์โมน',
    metaDuration: 'อ่าน 6 นาที',
    metaType: 'บทความ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'ทำไมอารมณ์ของคุณอาจแปรผันตลอดรอบเดือน แม้ไม่ได้เป็นเช่นนั้นเสมอไป',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'ทำไมอารมณ์จึงแปรผันได้',
      'อารมณ์ในแต่ละระยะของรอบเดือน',
      'การสังเกตความแปรผันของคุณเอง',
      'นิสัยที่ช่วยได้',
      'เมื่อการเปลี่ยนแปลงน่ากังวล',
      'ประเด็นสำคัญ',
    ],
    section1Body: 'ความผันผวนของเอสโตรเจนและโปรเจสเตอโรนมีอิทธิพลโดยตรงต่อสารสื่อประสาทที่เกี่ยวข้องกับอารมณ์ เช่น เซโรโทนิน',
    info1Title: 'โปรดจำไว้',
    info1Text: 'อารมณ์แปรปรวนทุกครั้งไม่จำเป็นต้องเกี่ยวข้องกับรอบเดือนของคุณ: สถานการณ์ในชีวิต ความเครียด และความเหนื่อยล้าก็มีบทบาทสำคัญ',
    phaseMood: [
      {title: 'ระหว่างมีประจำเดือน', text: 'ความเหนื่อยล้าและอารมณ์อ่อนไหวพบบ่อยในหลายคน'},
      {title: 'ช่วงใกล้ตกไข่', text: 'มักเป็นระยะที่พลังงานดีขึ้นและรู้สึกสบายดีมากขึ้น'},
      {title: 'ก่อนมีประจำเดือน', text: 'ความหงุดหงิดหรืออารมณ์แปรปรวนพบบ่อยกว่าในช่วงนี้'},
    ],
    section2Body: 'ความหงุดหงิดก่อนมีประจำเดือนหรืออารมณ์แปรปรวนในวัยหมดประจำเดือนจึงมีคำอธิบายทางชีววิทยาที่แท้จริง แม้จะไม่ปรากฏเหมือนกันในทุกคน',
    observeHabits: [
      {title: 'เขียนบันทึก', text: 'การจดอารมณ์และระยะของรอบเดือนช่วยให้คุณสังเกตรูปแบบของตัวเอง'},
      {title: 'ระบุรูปแบบ', text: 'โดยไม่ตัดสินตัวเอง: เป้าหมายคือการรู้จักตัวเองมากขึ้น ไม่ใช่การควบคุมทุกอย่าง'},
    ],
    section4Body: 'การนอนหลับ กิจกรรมทางกาย และการสนับสนุนทางสังคม ยังคงเป็นพันธมิตรที่ดีที่สุดในการทำให้อารมณ์คงที่',
    helpfulHabits: [
      {title: 'นอนให้พอ', text: 'การนอนไม่พอมักทำให้อารมณ์อ่อนไหวมากขึ้น'},
      {title: 'กิจกรรมทางกายสม่ำเสมอ', text: 'แม้กิจกรรมระดับปานกลางก็ช่วยให้อารมณ์คงที่ตลอดรอบเดือน'},
      {title: 'การสนับสนุนทางสังคม', text: 'การพูดคุยกับคนที่คุณไว้ใจช่วยบรรเทาสิ่งที่คุณรู้สึกได้'},
    ],
    section5Body: 'อารมณ์ที่เปลี่ยนไปเกี่ยวกับรอบเดือนมักเป็นเพียงชั่วคราว อย่างไรก็ตาม สัญญาณบางอย่างควรให้ความสนใจเป็นพิเศษ:',
    warningTitle: 'สัญญาณที่ควรสังเกต',
    concerningSigns: [
      'ความเศร้ารุนแรง หรือความเศร้าที่คงอยู่เกินรอบเดือน',
      'สูญเสียความสนใจในสิ่งที่คุณชอบตามปกติอย่างชัดเจน',
      'ส่งผลอย่างมากต่อชีวิตประจำวันหรือความสัมพันธ์ของคุณ',
      'มีความคิดที่แทรกเข้ามาหรือความทุกข์ใจอย่างมาก',
    ],
    info2Title: 'มีผู้พร้อมให้การสนับสนุน',
    info2Text: 'แพทย์ ผดุงครรภ์ หรือนักจิตวิทยาช่วยให้คุณเข้าใจสิ่งที่รู้สึกดีขึ้น และส่งต่อไปยังการสนับสนุนเพิ่มเติมหากจำเป็น',
    tipTitle: 'ควรรู้',
    tipText: 'การรับรู้ความเชื่อมโยงระหว่างฮอร์โมนกับอารมณ์ช่วยให้คุณเข้าใจสิ่งที่รู้สึกดีขึ้น โดยไม่ต้องลดทุกอย่างให้เหลือคำอธิบายเดียว',
    summaryPoints: [
      'ความผันผวนของเอสโตรเจนและโปรเจสเตอโรนมีอิทธิพลโดยตรงต่อสารสื่อประสาทที่เกี่ยวข้องกับอารมณ์',
      'ความหงุดหงิดก่อนมีประจำเดือนจึงมีคำอธิบายทางชีววิทยาที่แท้จริง',
      'อารมณ์แปรปรวนทุกครั้งไม่จำเป็นต้องเกี่ยวข้องกับรอบเดือน: สถานการณ์ในชีวิตก็สำคัญ',
      'การนอนหลับ กิจกรรมทางกาย และการสนับสนุนทางสังคม ยังคงเป็นพันธมิตรที่ดีที่สุดในการทำให้อารมณ์คงที่',
    ],
    disclaimerText: 'เนื้อหาเพื่อให้ข้อมูล บทความนี้ไม่ได้ทดแทนคำแนะนำทางการแพทย์หรือทางจิตวิทยาเฉพาะบุคคล หากมีข้อสงสัย โปรดขอคำแนะนำจากบุคลากรทางการแพทย์',
    shareMessage: 'อารมณ์กับความผันผวนของฮอร์โมน — AWA',
  },
  vi: {
    badge: 'CHU KỲ KINH NGUYỆT • TÂM TRẠNG',
    title: 'Tâm trạng và những\ndao động nội tiết',
    metaDuration: '6 phút đọc',
    metaType: 'Bài viết',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Tại sao tâm trạng của bạn có thể thay đổi trong suốt chu kỳ, dù không phải lúc nào cũng vậy.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Tại sao tâm trạng có thể thay đổi',
      'Tâm trạng qua các giai đoạn của chu kỳ',
      'Quan sát những thay đổi của riêng bạn',
      'Những thói quen có thể giúp ích',
      'Khi nào những thay đổi trở nên đáng lo ngại',
      'Những điểm chính cần nhớ',
    ],
    section1Body: 'Những dao động của estrogen và progesterone ảnh hưởng trực tiếp đến các chất dẫn truyền thần kinh liên quan đến tâm trạng, chẳng hạn như serotonin.',
    info1Title: 'Hãy ghi nhớ',
    info1Text: 'Không phải mọi thay đổi tâm trạng đều nhất thiết liên quan đến chu kỳ của bạn: hoàn cảnh cuộc sống, căng thẳng và mệt mỏi cũng đóng vai trò quan trọng.',
    phaseMood: [
      {title: 'Trong kỳ kinh', text: 'Mệt mỏi và nhạy cảm về cảm xúc là điều phổ biến ở nhiều người.'},
      {title: 'Quanh thời điểm rụng trứng', text: 'Đây thường là giai đoạn năng lượng tốt hơn và cảm giác khỏe mạnh nhiều hơn.'},
      {title: 'Trước kỳ kinh', text: 'Cáu gắt hoặc thay đổi tâm trạng thường gặp hơn trong thời gian này.'},
    ],
    section2Body: 'Vì vậy, tính cáu gắt trước kỳ kinh hay những thay đổi tâm trạng khi mãn kinh có một lời giải thích sinh học thực sự, dù chúng không biểu hiện giống nhau ở mọi người.',
    observeHabits: [
      {title: 'Ghi nhật ký', text: 'Ghi lại tâm trạng và giai đoạn chu kỳ giúp bạn nhận ra quy luật của riêng mình.'},
      {title: 'Nhận diện quy luật', text: 'Không tự phán xét: mục tiêu là hiểu mình hơn, không phải kiểm soát mọi thứ.'},
    ],
    section4Body: 'Giấc ngủ, hoạt động thể chất và sự hỗ trợ xã hội vẫn là những người bạn đồng hành tốt nhất để ổn định tâm trạng.',
    helpfulHabits: [
      {title: 'Ngủ đủ giấc', text: 'Thiếu ngủ thường làm tăng sự nhạy cảm về cảm xúc.'},
      {title: 'Hoạt động thể chất đều đặn', text: 'Ngay cả hoạt động vừa phải cũng giúp ổn định tâm trạng trong suốt chu kỳ.'},
      {title: 'Sự hỗ trợ xã hội', text: 'Nói chuyện với người bạn tin tưởng có thể làm dịu những gì bạn đang cảm thấy.'},
    ],
    section5Body: 'Sự thay đổi tâm trạng liên quan đến chu kỳ thường chỉ là tạm thời. Tuy nhiên, một số dấu hiệu đáng được đặc biệt chú ý:',
    warningTitle: 'Những dấu hiệu cần chú ý',
    concerningSigns: [
      'Nỗi buồn dữ dội, hoặc nỗi buồn kéo dài sau khi chu kỳ kết thúc',
      'Mất hứng thú rõ rệt với những điều bạn thường yêu thích',
      'Ảnh hưởng đáng kể đến cuộc sống hằng ngày hoặc các mối quan hệ của bạn',
      'Những ý nghĩ ám ảnh hoặc cảm giác đau khổ đáng kể',
    ],
    info2Title: 'Luôn có sự hỗ trợ dành cho bạn',
    info2Text: 'Bác sĩ, nữ hộ sinh hoặc chuyên gia tâm lý có thể giúp bạn hiểu rõ hơn những gì bạn đang cảm thấy và giới thiệu bạn đến sự hỗ trợ tiếp theo nếu cần.',
    tipTitle: 'Nên biết',
    tipText: 'Nhận ra mối liên hệ giữa hormone và tâm trạng có thể giúp bạn hiểu rõ hơn những gì mình đang cảm thấy, mà không quy mọi thứ về duy nhất lời giải thích này.',
    summaryPoints: [
      'Những dao động của estrogen và progesterone ảnh hưởng trực tiếp đến các chất dẫn truyền thần kinh liên quan đến tâm trạng.',
      'Vì vậy, tính cáu gắt trước kỳ kinh có một lời giải thích sinh học thực sự.',
      'Không phải mọi thay đổi tâm trạng đều nhất thiết liên quan đến chu kỳ: hoàn cảnh cuộc sống cũng quan trọng.',
      'Giấc ngủ, hoạt động thể chất và sự hỗ trợ xã hội vẫn là những người bạn đồng hành tốt nhất để ổn định tâm trạng.',
    ],
    disclaimerText: 'Nội dung mang tính thông tin. Bài viết này không thay thế lời khuyên y khoa hoặc tâm lý cá nhân hóa. Nếu có nghi ngờ, hãy tìm hướng dẫn từ nhân viên y tế.',
    shareMessage: 'Tâm trạng và những dao động nội tiết — AWA',
  },
  uz: {
    badge: 'HAYZ SIKLI • KAYFIYAT',
    title: 'Kayfiyat va gormonal\ntebranishlar',
    metaDuration: '6 daq oʻqish',
    metaType: 'Maqola',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Nima uchun kayfiyatingiz sikl davomida oʻzgarishi mumkin, garchi har doim ham emas.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Kayfiyat nima uchun oʻzgarishi mumkin',
      'Sikl bosqichlarida kayfiyat',
      'Oʻz oʻzgarishlaringizni kuzatish',
      'Yordam berishi mumkin boʻlgan odatlar',
      'Oʻzgarishlar qachon xavotirli boʻladi',
      'Asosiy xulosalar',
    ],
    section1Body: 'Estrogen va progesteron tebranishlari kayfiyat bilan bogʻliq neyromediatorlarga, masalan, serotoninga bevosita taʼsir qiladi.',
    info1Title: 'Esda tuting',
    info1Text: 'Har bir kayfiyat oʻzgarishi albatta siklingiz bilan bogʻliq emas: hayotiy holatlar, stress va charchoq ham muhim rol oʻynaydi.',
    phaseMood: [
      {title: 'Hayz paytida', text: 'Charchoq va hissiy sezgirlik koʻp odamlarda keng tarqalgan.'},
      {title: 'Ovulyatsiya atrofida', text: 'Bu koʻpincha yaxshiroq energiya va katta farovonlik hissi bosqichi.'},
      {title: 'Hayzdan oldin', text: 'Bu davrda jizzakilik yoki kayfiyatning keskin oʻzgarishi koʻproq uchraydi.'},
    ],
    section2Body: 'Shuning uchun hayz oldi jizzakilik yoki menopauza davridagi kayfiyat oʻzgarishlarining haqiqiy biologik izohi bor, garchi ular hammada bir xil koʻrinmasa ham.',
    observeHabits: [
      {title: 'Kundalik yuritish', text: 'Kayfiyatingiz va sikl bosqichingizni yozib borish oʻz qonuniyatlaringizni payqashga yordam beradi.'},
      {title: 'Qonuniyatlarni aniqlash', text: 'Oʻzingizni hukm qilmasdan: maqsad hamma narsani nazorat qilish emas, oʻzingizni yaxshiroq bilish.'},
    ],
    section4Body: 'Uyqu, jismoniy faollik va ijtimoiy qoʻllab-quvvatlash kayfiyatni barqarorlashtirishning eng yaxshi ittifoqchilari boʻlib qoladi.',
    helpfulHabits: [
      {title: 'Yetarli uyqu', text: 'Uyqu yetishmasligi koʻpincha hissiy sezgirlikni kuchaytiradi.'},
      {title: 'Muntazam jismoniy faollik', text: 'Hatto muʼtadil faollik ham sikl davomida kayfiyatni barqarorlashtirishga yordam beradi.'},
      {title: 'Ijtimoiy qoʻllab-quvvatlash', text: 'Ishongan kishingiz bilan gaplashish his qilayotgan narsangizni yengillashtirishi mumkin.'},
    ],
    section5Body: 'Siklingiz bilan bogʻliq kayfiyat oʻzgarishi odatda vaqtinchalik. Biroq baʼzi belgilar alohida eʼtiborga loyiq:',
    warningTitle: 'Eʼtibor berish kerak boʻlgan belgilar',
    concerningSigns: [
      'Kuchli qaygʻu yoki sikldan keyin ham davom etadigan qaygʻu',
      'Odatda zavqlanadigan narsalarga qiziqishning sezilarli yoʻqolishi',
      'Kundalik hayot yoki munosabatlarga sezilarli taʼsir',
      'Xalaqit beruvchi fikrlar yoki kuchli iztirob hissi',
    ],
    info2Title: 'Yordam mavjud',
    info2Text: 'Shifokor, doya yoki psixolog his qilayotgan narsangizni yaxshiroq tushunishga yordam berishi va zarur boʻlsa, qoʻshimcha yordamga yoʻnaltirishi mumkin.',
    tipTitle: 'Bilish foydali',
    tipText: 'Gormonlar va kayfiyat oʻrtasidagi bogʻliqlikni tanish, hamma narsani shu yagona izohga keltirmasdan, his qilayotgan narsangizni yaxshiroq tushunishga yordam beradi.',
    summaryPoints: [
      'Estrogen va progesteron tebranishlari kayfiyat bilan bogʻliq neyromediatorlarga bevosita taʼsir qiladi.',
      'Shuning uchun hayz oldi jizzakilikning haqiqiy biologik izohi bor.',
      'Har bir kayfiyat oʻzgarishi albatta siklga bogʻliq emas: hayotiy holatlar ham muhim.',
      'Uyqu, jismoniy faollik va ijtimoiy qoʻllab-quvvatlash kayfiyatni barqarorlashtirishning eng yaxshi ittifoqchilari.',
    ],
    disclaimerText: 'Maʼlumot uchun kontent. Bu maqola shaxsiy tibbiy yoki psixologik maslahatni almashtirmaydi. Shubha boʻlsa, sogʻliqni saqlash mutaxassisidan yoʻl-yoʻriq soʻrang.',
    shareMessage: 'Kayfiyat va gormonal tebranishlar — AWA',
  },
  az: {
    badge: 'MENSTRUAL DÖVR • ƏHVAL',
    title: 'Əhval və hormonal\ndalğalanmalar',
    metaDuration: '6 dəq oxu',
    metaType: 'Məqalə',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Əhvalınız nə üçün dövr boyu dəyişə bilər, lakin həmişə yox.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Əhval nə üçün dəyişə bilər',
      'Dövrün fazaları üzrə əhval',
      'Öz dəyişkənliklərinizi müşahidə etmək',
      'Kömək edə bilən vərdişlər',
      'Dəyişikliklər nə vaxt narahatedici olur',
      'Əsas nəticələr',
    ],
    section1Body: 'Östrogen və progesteronun dalğalanmaları əhvalla bağlı neyromediatorlara, məsələn, serotonin-ə birbaşa təsir edir.',
    info1Title: 'Yadda saxlayın',
    info1Text: 'Hər əhval dəyişkənliyi mütləq dövrlə bağlı deyil: həyat şəraiti, stress və yorğunluq da mühüm rol oynayır.',
    phaseMood: [
      {title: 'Aybaşı zamanı', text: 'Yorğunluq və emosional həssaslıq bir çox insan üçün adi haldır.'},
      {title: 'Ovulyasiya ətrafında', text: 'Bu, çox vaxt daha yaxşı enerji və daha güclü rifah hissi fazasıdır.'},
      {title: 'Aybaşıdan əvvəl', text: 'Əsəbilik və ya əhval dəyişkənliyi bu dövrdə daha çox rast gəlinir.'},
    ],
    section2Body: 'Premenstrual əsəbilik və ya menopauza dövrü əhval dəyişkənliyinin real bioloji izahı var, hətta onlar hər kəsdə eyni şəkildə təzahür etməsə belə.',
    observeHabits: [
      {title: 'Gündəlik tutmaq', text: 'Əhvalınızı və dövr fazanızı yazmaq öz qanunauyğunluqlarınızı görməyə kömək edir.'},
      {title: 'Qanunauyğunluqları müəyyən etmək', text: 'Özünüzü mühakimə etmədən: məqsəd hər şeyi idarə etmək deyil, özünüzü daha yaxşı tanımaqdır.'},
    ],
    section4Body: 'Yuxu, fiziki fəaliyyət və sosial dəstək əhvalı sabitləşdirmək üçün ən yaxşı müttəfiqlər olaraq qalır.',
    helpfulHabits: [
      {title: 'Kifayət qədər yuxu', text: 'Yuxusuzluq çox vaxt emosional həssaslığı artırır.'},
      {title: 'Müntəzəm fiziki fəaliyyət', text: 'Orta səviyyəli fəaliyyət belə dövr boyu əhvalı sabitləşdirməyə kömək edir.'},
      {title: 'Sosial dəstək', text: 'Etibar etdiyiniz biri ilə danışmaq hiss etdiyinizi yüngülləşdirə bilər.'},
    ],
    section5Body: 'Dövrlə bağlı əhval dəyişikliyi adətən müvəqqətidir. Bununla belə, bəzi əlamətlər xüsusi diqqətə layiqdir:',
    warningTitle: 'Diqqət ediləcək əlamətlər',
    concerningSigns: [
      'Şiddətli kədər və ya dövrdən sonra da davam edən kədər',
      'Adətən zövq aldığınız şeylərə marağın nəzərəçarpan itməsi',
      'Gündəlik həyatınıza və ya münasibətlərinizə əhəmiyyətli təsir',
      'Məcburi düşüncələr və ya əhəmiyyətli sıxıntı hissi',
    ],
    info2Title: 'Dəstək mövcuddur',
    info2Text: 'Həkim, mama və ya psixoloq hiss etdiyinizi daha yaxşı anlamağınıza kömək edə və lazım gələrsə, sizi əlavə dəstəyə yönəldə bilər.',
    tipTitle: 'Bilmək faydalıdır',
    tipText: 'Hormonlarla əhval arasındakı əlaqəni tanımaq hər şeyi bu tək izaha endirmədən hiss etdiyinizi daha yaxşı anlamağa kömək edə bilər.',
    summaryPoints: [
      'Östrogen və progesteronun dalğalanmaları əhvalla bağlı neyromediatorlara birbaşa təsir edir.',
      'Premenstrual əsəbiliyin buna görə real bioloji izahı var.',
      'Hər əhval dəyişkənliyi mütləq dövrlə bağlı deyil: həyat şəraiti də əhəmiyyətlidir.',
      'Yuxu, fiziki fəaliyyət və sosial dəstək əhvalı sabitləşdirmək üçün ən yaxşı müttəfiqlər olaraq qalır.',
    ],
    disclaimerText: 'Məlumat xarakterli məzmun. Bu məqalə fərdi tibbi və ya psixoloji məsləhəti əvəz etmir. Şübhə olarsa, tibb işçisindən məsləhət alın.',
    shareMessage: 'Əhval və hormonal dalğalanmalar — AWA',
  },
  ka: {
    badge: 'მენსტრუაციული ციკლი • ხასიათი',
    title: 'ხასიათი და ჰორმონული\nცვალებადობა',
    metaDuration: '6 წთ საკითხავი',
    metaType: 'სტატია',
    metaLevel: 'დამწყები',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'რატომ შეიძლება თქვენი ხასიათი ციკლის განმავლობაში იცვლებოდეს, თუმცა არა ყოველთვის.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'რატომ შეიძლება ხასიათი იცვლებოდეს',
      'ხასიათი ციკლის ფაზების მიხედვით',
      'თქვენი საკუთარი ცვალებადობის დაკვირვება',
      'ჩვევები, რომლებმაც შეიძლება უშველოს',
      'როდის ხდება ცვლილებები შემაშფოთებელი',
      'მთავარი დასკვნები',
    ],
    section1Body: 'ესტროგენისა და პროგესტერონის ცვალებადობა პირდაპირ მოქმედებს ხასიათთან დაკავშირებულ ნეიროტრანსმიტერებზე, როგორიცაა სეროტონინი.',
    info1Title: 'გაითვალისწინეთ',
    info1Text: 'ხასიათის ყოველი ცვლილება აუცილებლად თქვენს ციკლს არ უკავშირდება: ცხოვრებისეული გარემოებები, სტრესი და დაღლილობაც მნიშვნელოვან როლს თამაშობს.',
    phaseMood: [
      {title: 'მენსტრუაციის დროს', text: 'დაღლილობა და ემოციური მგრძნობელობა ბევრისთვის ხშირია.'},
      {title: 'ოვულაციის გარშემო', text: 'ეს ხშირად უკეთესი ენერგიისა და კეთილდღეობის უფრო დიდი განცდის ფაზაა.'},
      {title: 'მენსტრუაციამდე', text: 'გაღიზიანებადობა ან ხასიათის ცვალებადობა ამ დროს უფრო ხშირია.'},
    ],
    section2Body: 'მენსტრუაციამდელ გაღიზიანებადობას ან მენოპაუზის დროს ხასიათის ცვალებადობას ამიტომ რეალური ბიოლოგიური ახსნა აქვს, თუმცა ისინი ყველასთან ერთნაირად არ ვლინდება.',
    observeHabits: [
      {title: 'დღიურის წარმოება', text: 'თქვენი ხასიათისა და ციკლის ფაზის ჩაწერა გეხმარებათ საკუთარი კანონზომიერებების შემჩნევაში.'},
      {title: 'კანონზომიერებების გამოვლენა', text: 'საკუთარი თავის განსჯის გარეშე: მიზანია საკუთარი თავის უკეთ გაცნობა და არა ყველაფრის კონტროლი.'},
    ],
    section4Body: 'ძილი, ფიზიკური აქტივობა და სოციალური მხარდაჭერა რჩება ხასიათის სტაბილიზაციის საუკეთესო მოკავშირეებად.',
    helpfulHabits: [
      {title: 'საკმარისი ძილი', text: 'ძილის ნაკლებობა ხშირად ემოციურ მგრძნობელობას ამძაფრებს.'},
      {title: 'რეგულარული ფიზიკური აქტივობა', text: 'ზომიერი აქტივობაც კი ციკლის განმავლობაში ხასიათის სტაბილიზაციაში გეხმარებათ.'},
      {title: 'სოციალური მხარდაჭერა', text: 'ადამიანთან საუბარმა, ვისაც ენდობით, შეიძლება შეგრძნებები შეგიმსუბუქოთ.'},
    ],
    section5Body: 'თქვენს ციკლთან დაკავშირებული ხასიათის ცვლილება, როგორც წესი, დროებითია. თუმცა გარკვეული ნიშნები განსაკუთრებულ ყურადღებას იმსახურებს:',
    warningTitle: 'ნიშნები, რომლებსაც უნდა დააკვირდეთ',
    concerningSigns: [
      'ინტენსიური სევდა ან სევდა, რომელიც ციკლის მიღმა გრძელდება',
      'ინტერესის მკვეთრი დაკარგვა იმის მიმართ, რაც ჩვეულებრივ გიყვართ',
      'მნიშვნელოვანი გავლენა თქვენს ყოველდღიურ ცხოვრებაზე ან ურთიერთობებზე',
      'ინტრუზიული აზრები ან დისკომფორტის მნიშვნელოვანი განცდა',
    ],
    info2Title: 'მხარდაჭერა ხელმისაწვდომია',
    info2Text: 'ექიმს, ბებიაქალს ან ფსიქოლოგს შეუძლია დაგეხმაროთ უკეთ გაიგოთ, რასაც გრძნობთ, და საჭიროების შემთხვევაში დამატებით მხარდაჭერაზე მიგითითოთ.',
    tipTitle: 'კარგია ვიცოდეთ',
    tipText: 'ჰორმონებსა და ხასიათს შორის კავშირის აღიარებამ შეიძლება დაგეხმაროთ უკეთ გაიგოთ, რასაც გრძნობთ, ყველაფრის ამ ერთ ახსნამდე დაყვანის გარეშე.',
    summaryPoints: [
      'ესტროგენისა და პროგესტერონის ცვალებადობა პირდაპირ მოქმედებს ხასიათთან დაკავშირებულ ნეიროტრანსმიტერებზე.',
      'მენსტრუაციამდელ გაღიზიანებადობას ამიტომ რეალური ბიოლოგიური ახსნა აქვს.',
      'ხასიათის ყოველი ცვლილება აუცილებლად ციკლს არ უკავშირდება: ცხოვრებისეული გარემოებებიც მნიშვნელოვანია.',
      'ძილი, ფიზიკური აქტივობა და სოციალური მხარდაჭერა რჩება ხასიათის სტაბილიზაციის საუკეთესო მოკავშირეებად.',
    ],
    disclaimerText: 'საინფორმაციო შინაარსი. ეს სტატია პერსონალიზებულ სამედიცინო ან ფსიქოლოგიურ რჩევას არ ანაცვლებს. ეჭვის შემთხვევაში მიმართეთ ჯანდაცვის სპეციალისტს.',
    shareMessage: 'ხასიათი და ჰორმონული ცვალებადობა — AWA',
  },
  hy: {
    badge: 'ԴԱՇՏԱՆԱՅԻՆ ՑԻԿԼ • ՏՐԱՄԱԴՐՈՒԹՅՈՒՆ',
    title: 'Տրամադրություն և\nհորմոնալ տատանումներ',
    metaDuration: '6 ր կարդալու համար',
    metaType: 'Հոդված',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Ինչու կարող է ձեր տրամադրությունը տարբերվել ցիկլի ընթացքում, թեև ոչ միշտ:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Ինչու կարող է տրամադրությունը տարբերվել',
      'Տրամադրությունը ցիկլի փուլերի ընթացքում',
      'Դիտարկել ձեր սեփական տատանումները',
      'Սովորություններ, որոնք կարող են օգնել',
      'Երբ փոփոխությունները դառնում են անհանգստացնող',
      'Հիմնական եզրակացություններ',
    ],
    section1Body: 'Էստրոգենի և պրոգեստերոնի տատանումները ուղղակիորեն ազդում են տրամադրության հետ կապված նեյրոհաղորդիչների վրա, ինչպիսին է սերոտոնինը:',
    info1Title: 'Հիշեք',
    info1Text: 'Տրամադրության ամեն տատանում պարտադիր չէ կապված լինի ձեր ցիկլի հետ. կյանքի հանգամանքները, սթրեսը և հոգնածությունը նույնպես կարևոր դեր են խաղում:',
    phaseMood: [
      {title: 'Դաշտանի ընթացքում', text: 'Հոգնածությունը և հուզական զգայունությունը տարածված են շատերի մոտ:'},
      {title: 'Ձվազատման շուրջ', text: 'Սա հաճախ ավելի լավ էներգիայի և ավելի մեծ բարեկեցության զգացման փուլ է:'},
      {title: 'Դաշտանից առաջ', text: 'Այս ընթացքում դյուրագրգռությունը կամ տրամադրության տատանումները ավելի տարածված են:'},
    ],
    section2Body: 'Նախադաշտանային դյուրագրգռությունը կամ դաշտանադադարի տրամադրության տատանումները, հետևաբար, ունեն իրական կենսաբանական բացատրություն, թեև չեն դրսևորվում բոլորի մոտ նույն կերպ:',
    observeHabits: [
      {title: 'Օրագիր վարել', text: 'Ձեր տրամադրությունը և ցիկլի փուլը գրանցելը օգնում է նկատել ձեր սեփական օրինաչափությունները:'},
      {title: 'Օրինաչափություններ բացահայտել', text: 'Առանց ինքներդ ձեզ դատելու. նպատակը ինքներդ ձեզ ավելի լավ ճանաչելն է, այլ ոչ թե ամեն ինչ վերահսկելը:'},
    ],
    section4Body: 'Քունը, ֆիզիկական ակտիվությունը և սոցիալական աջակցությունը մնում են տրամադրությունը կայունացնելու լավագույն դաշնակիցները:',
    helpfulHabits: [
      {title: 'Բավարար քուն', text: 'Քնի պակասը հաճախ սաստկացնում է հուզական զգայունությունը:'},
      {title: 'Կանոնավոր ֆիզիկական ակտիվություն', text: 'Նույնիսկ չափավոր ակտիվությունը օգնում է կայունացնել տրամադրությունը ցիկլի ընթացքում:'},
      {title: 'Սոցիալական աջակցություն', text: 'Ձեր վստահած մարդու հետ խոսելը կարող է թեթևացնել ձեր զգացածը:'},
    ],
    section5Body: 'Ցիկլի հետ կապված տրամադրության փոփոխությունը սովորաբար ժամանակավոր է: Այդուհանդերձ, որոշ նշաններ հատուկ ուշադրության են արժանի.',
    warningTitle: 'Նշաններ, որոնց պետք է ուշադրություն դարձնել',
    concerningSigns: [
      'Ուժեղ տխրություն կամ տխրություն, որը շարունակվում է ցիկլից դուրս',
      'Ձեր սովորաբար հաճույք պատճառող բաների նկատմամբ հետաքրքրության արտահայտված կորուստ',
      'Ձեր առօրյա կյանքի կամ հարաբերությունների վրա զգալի ազդեցություն',
      'Ներխուժող մտքեր կամ անհարմարության զգալի զգացում',
    ],
    info2Title: 'Աջակցությունը հասանելի է',
    info2Text: 'Բժիշկը, մանկաբարձուհին կամ հոգեբանը կարող է օգնել ձեզ ավելի լավ հասկանալ ձեր զգացածը և, անհրաժեշտության դեպքում, ուղղորդել ձեզ հետագա աջակցության:',
    tipTitle: 'Լավ է իմանալ',
    tipText: 'Հորմոնների և տրամադրության կապը ճանաչելը կարող է օգնել ավելի լավ հասկանալ ձեր զգացածը՝ առանց ամեն ինչ այս մեկ բացատրությանը կրճատելու:',
    summaryPoints: [
      'Էստրոգենի և պրոգեստերոնի տատանումները ուղղակիորեն ազդում են տրամադրության հետ կապված նեյրոհաղորդիչների վրա:',
      'Նախադաշտանային դյուրագրգռությունը, հետևաբար, ունի իրական կենսաբանական բացատրություն:',
      'Տրամադրության ամեն տատանում պարտադիր չէ կապված լինի ցիկլի հետ. կյանքի հանգամանքները նույնպես կարևոր են:',
      'Քունը, ֆիզիկական ակտիվությունը և սոցիալական աջակցությունը մնում են տրամադրությունը կայունացնելու լավագույն դաշնակիցները:',
    ],
    disclaimerText: 'Տեղեկատվական բովանդակություն: Այս հոդվածը չի փոխարինում անհատականացված բժշկական կամ հոգեբանական խորհրդատվությանը: Կասկածի դեպքում խորհուրդ հարցրեք առողջապահության մասնագետից:',
    shareMessage: 'Տրամադրություն և հորմոնալ տատանումներ — AWA',
  },
  tg: {
    badge: 'ДАВРАИ ҲАЙЗ • КАЙФИЯТ',
    title: 'Кайфият ва тағйироти\nгормонӣ',
    metaDuration: '6 дақ барои хондан',
    metaType: 'Мақола',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Чаро кайфияти шумо дар давоми давра метавонад тағйир ёбад, гарчанде на ҳамеша.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Чаро кайфият метавонад тағйир ёбад',
      'Кайфият дар марҳилаҳои давра',
      'Мушоҳидаи тағйироти худ',
      'Одатҳое, ки метавонанд кумак кунанд',
      'Кай тағйирот нигаронкунанда мешавад',
      'Хулосаҳои асосӣ',
    ],
    section1Body: 'Тағйироти эстроген ва прогестерон мустақиман ба нейротрансмиттерҳои марбут ба кайфият, аз қабили серотонин, таъсир мерасонад.',
    info1Title: 'Дар хотир доред',
    info1Text: 'На ҳар тағйирёбии кайфият ҳатман бо давраи шумо алоқаманд аст: шароити зиндагӣ, стресс ва хастагӣ низ нақши муҳим доранд.',
    phaseMood: [
      {title: 'Ҳангоми ҳайз', text: 'Хастагӣ ва ҳассосияти ҳиссӣ барои бисёриҳо маъмул аст.'},
      {title: 'Дар атрофи овуляция', text: 'Ин аксар вақт марҳилаи қуввати беҳтар ва эҳсоси бештари некӯаҳволист.'},
      {title: 'Пеш аз ҳайз', text: 'Асабоният ё тағйироти кайфият дар ин вақт бештар маъмул аст.'},
    ],
    section2Body: 'Асабонияти пеш аз ҳайз ё тағйироти кайфият дар менопауза аз ин рӯ шарҳи биологии воқеӣ дорад, гарчанде ки онҳо барои ҳама ба як тарз зоҳир намешаванд.',
    observeHabits: [
      {title: 'Дафтари рӯзнома доштан', text: 'Навиштани кайфият ва марҳилаи давра ба шумо кумак мекунад намунаҳои худро пайдо кунед.'},
      {title: 'Муайян кардани намунаҳо', text: 'Бидуни доварӣ дар бораи худ: мақсад беҳтар шинохтани худ аст, на ҳамаро назорат кардан.'},
    ],
    section4Body: 'Хоб, фаъолияти ҷисмонӣ ва дастгирии иҷтимоӣ беҳтарин ёвар барои устувор кардани кайфият боқӣ мемонанд.',
    helpfulHabits: [
      {title: 'Хоби кофӣ', text: 'Камхобӣ аксар вақт ҳассосияти ҳиссиро зиёд мекунад.'},
      {title: 'Фаъолияти мунтазами ҷисмонӣ', text: 'Ҳатто фаъолияти мӯътадил ба устувор кардани кайфият дар давоми давра кумак мекунад.'},
      {title: 'Дастгирии иҷтимоӣ', text: 'Гап задан бо касе, ки ба ӯ боварӣ доред, метавонад он чиро, ки эҳсос мекунед, сабук кунад.'},
    ],
    section5Body: 'Тағйири кайфияте, ки бо давраи шумо алоқаманд аст, одатан муваққатӣ аст. Бо вуҷуди ин, баъзе нишонаҳо диққати махсусро сазоворанд:',
    warningTitle: 'Нишонаҳое, ки бояд пайгирӣ кард',
    concerningSigns: [
      'Ғамгинии шадид ё ғамгинӣ, ки аз давра берун идома меёбад',
      'Аз даст додани таваҷҷӯҳи равшан ба чизҳое, ки одатан аз онҳо лаззат мебаред',
      'Таъсири назаррас ба ҳаёти ҳаррӯза ё муносибатҳо',
      'Фикрҳои нохостаи халалрасон ё эҳсоси назарраси ноором',
    ],
    info2Title: 'Дастгирӣ дастрас аст',
    info2Text: 'Табиб, доя ё равоншинос метавонад ба шумо кумак кунад он чиро, ки эҳсос мекунед, беҳтар бифаҳмед ва, агар лозим бошад, ба дастгирии минбаъда равона кунад.',
    tipTitle: 'Донистан хуб аст',
    tipText: 'Шинохтани робитаи байни гормонҳо ва кайфият метавонад ба шумо кумак кунад он чиро, ки эҳсос мекунед, беҳтар бифаҳмед, бидуни он ки ҳама чизро ба ин як тавзеҳ кам кунед.',
    summaryPoints: [
      'Тағйироти эстроген ва прогестерон мустақиман ба нейротрансмиттерҳои марбут ба кайфият таъсир мерасонад.',
      'Асабонияти пеш аз ҳайз аз ин рӯ шарҳи биологии воқеӣ дорад.',
      'На ҳар тағйирёбии кайфият ҳатман бо давра алоқаманд аст: шароити зиндагӣ низ муҳим аст.',
      'Хоб, фаъолияти ҷисмонӣ ва дастгирии иҷтимоӣ беҳтарин ёвар барои устувор кардани кайфият боқӣ мемонанд.',
    ],
    disclaimerText: 'Мазмуни иттилоотӣ. Ин мақола маслиҳати шахсии тиббӣ ё равониро иваз намекунад. Дар сурати шубҳа аз мутахассиси соҳаи тиб роҳнамоӣ пурсед.',
    shareMessage: 'Кайфият ва тағйироти гормонӣ — AWA',
  },
  ky: {
    badge: 'ЕТЕК КИРИМ ЦИКЛИ • МААНАЙ',
    title: 'Маанай жана гормондук\nтермелүүлөр',
    metaDuration: '6 мүн окуу',
    metaType: 'Макала',
    metaLevel: 'Баштоочу',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Маанайыңыз цикл бою эмне үчүн өзгөрүшү мүмкүн, бирок ар дайым эмес.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Маанай эмне үчүн өзгөрүшү мүмкүн',
      'Циклдин фазалары боюнча маанай',
      'Өз өзгөрүүлөрүңүздү байкоо',
      'Жардам бере турган адаттар',
      'Өзгөрүүлөр тынчсыздандырганда',
      'Негизги жыйынтыктар',
    ],
    section1Body: 'Эстроген менен прогестерондун термелүүлөрү серотонин сыяктуу маанайга байланышкан нейротрансмиттерлерге түздөн-түз таасир этет.',
    info1Title: 'Эстен чыгарбаңыз',
    info1Text: 'Маанайдын ар бир өзгөрүшү сөзсүз циклиңиз менен байланышкан эмес: жашоо шарттары, стресс жана чарчоо да маанилүү роль ойнойт.',
    phaseMood: [
      {title: 'Етек кирим учурунда', text: 'Чарчоо жана эмоционалдык сезгичтик көптөгөн адамдарда кеңири таралган.'},
      {title: 'Овуляциянын тегерегинде', text: 'Бул көбүнчө жакшы энергия жана жыргалчылыктын көбүрөөк сезими фазасы.'},
      {title: 'Етек киримдин алдында', text: 'Бул мезгилде ачуулануу же маанайдын термелиши көбүрөөк кездешет.'},
    ],
    section2Body: 'Етек киримге чейинки ачуулануу же менопаузадагы маанайдын термелүүсүнүн чыныгы биологиялык түшүндүрмөсү бар, алар баарында бирдей көрүнбөсө да.',
    observeHabits: [
      {title: 'Журнал жүргүзүү', text: 'Маанайыңызды жана цикл фазаңызды жазуу өз мыйзам ченемдүүлүгүңүздү байкоого жардам берет.'},
      {title: 'Мыйзам ченемдүүлүктөрдү аныктоо', text: 'Өзүңүздү соттобостон: максат — өзүңүздү жакшыраак таануу, баарын көзөмөлдөө эмес.'},
    ],
    section4Body: 'Уйку, физикалык активдүүлүк жана социалдык колдоо маанайды турукташтыруунун эң жакшы жардамчылары бойдон калат.',
    helpfulHabits: [
      {title: 'Жетиштүү уйку', text: 'Уйкунун жетишсиздиги эмоционалдык сезгичтикти көбүнчө күчөтөт.'},
      {title: 'Үзгүлтүксүз физикалык активдүүлүк', text: 'Орточо активдүүлүк да цикл бою маанайды турукташтырууга жардам берет.'},
      {title: 'Социалдык колдоо', text: 'Ишенген адамыңыз менен сүйлөшүү сезгениңизди жеңилдетиши мүмкүн.'},
    ],
    section5Body: 'Циклиңиз менен байланышкан маанай өзгөрүшү адатта убактылуу. Ошентсе да, айрым белгилер өзгөчө көңүл бурууга татыйт:',
    warningTitle: 'Көңүл бура турган белгилер',
    concerningSigns: [
      'Күчтүү кайгы же циклден тышкары улана берген кайгы',
      'Адатта жактырган нерселерге кызыгуунун айкын жоголушу',
      'Күнүмдүк жашоого же мамилелерге олуттуу таасир',
      'Кирип алган ойлор же олуттуу кысымчылык сезими',
    ],
    info2Title: 'Колдоо бар',
    info2Text: 'Дарыгер, акушерка же психолог сезгениңизди жакшыраак түшүнүүгө жардам берип, керек болсо кошумча колдоого багыттай алат.',
    tipTitle: 'Билүү пайдалуу',
    tipText: 'Гормондор менен маанайдын ортосундагы байланышты таануу баарын бул бир түшүндүрмөгө жеткирбестен, сезгениңизди жакшыраак түшүнүүгө жардам бериши мүмкүн.',
    summaryPoints: [
      'Эстроген менен прогестерондун термелүүлөрү маанайга байланышкан нейротрансмиттерлерге түздөн-түз таасир этет.',
      'Етек киримге чейинки ачуулануунун ошондуктан чыныгы биологиялык түшүндүрмөсү бар.',
      'Маанайдын ар бир өзгөрүшү сөзсүз циклге байланыштуу эмес: жашоо шарттары да маанилүү.',
      'Уйку, физикалык активдүүлүк жана социалдык колдоо маанайды турукташтыруунун эң жакшы жардамчылары бойдон калат.',
    ],
    disclaimerText: 'Маалымат берүүчү мазмун. Бул макала жекелештирилген медициналык же психологиялык кеңешти алмаштырбайт. Күмөн болсо, ден соолук сактоо адисинен кеңеш сураңыз.',
    shareMessage: 'Маанай жана гормондук термелүүлөр — AWA',
  },
  tk: {
    badge: 'AÝBAŞY SIKLI • KEÝP',
    title: 'Keýp we gormonal\nyrgyldylar',
    metaDuration: '6 min okamak',
    metaType: 'Makala',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Barlanan mazmun',
    intro: 'Keýbiňiziň sikl dowamynda näme üçin üýtgäp biljekdigi, ýöne hemişe däl.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Keýp näme üçin üýtgäp biler',
      'Sikliň tapgyrlarynda keýp',
      'Öz üýtgeşmeleriňizi synlamak',
      'Kömek edip biljek endikler',
      'Üýtgeşmeler alada döredende',
      'Esasy netijeler',
    ],
    section1Body: 'Estrogen we progesteronyň yrgyldylary serotonin ýaly keýp bilen baglanyşykly neýromediatorlara göni täsir edýär.',
    info1Title: 'Ýatda saklaň',
    info1Text: 'Her keýp üýtgemesi sikl bilen hökman baglanyşykly däl: durmuş ýagdaýlary, stres we ýadawlyk hem möhüm rol oýnaýar.',
    phaseMood: [
      {title: 'Aýbaşy wagtynda', text: 'Ýadawlyk we duýgusal duýgurlyk köp adam üçin umumy zat.'},
      {title: 'Ovulýasiýa töwereginde', text: 'Bu köplenç has gowy energiýa we has uly abadançylyk duýgusy tapgyry.'},
      {title: 'Aýbaşydan öň', text: 'Gaharjaňlyk ýa-da keýp üýtgeşmeleri bu döwürde has ýygy.'},
    ],
    section2Body: 'Aýbaşydan öňki gaharjaňlygyň ýa-da menopauza keýp üýtgeşmeleriniň hakyky biologik düşündirişi bar, hatda olar hemmelerde deň ýüze çykmasa-da.',
    observeHabits: [
      {title: 'Gündelik ýöretmek', text: 'Keýbiňizi we sikl tapgyryňyzy ýazyp goýmak öz nusgaňyzy görmäge kömek edýär.'},
      {title: 'Nusgalary kesgitlemek', text: 'Özüňizi ýazgarmazdan: maksat hemme zady dolandyrmak däl-de, özüňizi has gowy tanamak.'},
    ],
    section4Body: 'Uky, fiziki işjeňlik we durmuş goldawy keýbi durnuklaşdyrmak üçin iň gowy kömekçiler bolup galýar.',
    helpfulHabits: [
      {title: 'Ýeterlik uky', text: 'Uky ýetmezçiligi köplenç duýgusal duýgurlygy artdyrýar.'},
      {title: 'Yzygiderli fiziki işjeňlik', text: 'Hatda ortaça işjeňlik hem sikl dowamynda keýbi durnuklaşdyrmaga kömek edýär.'},
      {title: 'Durmuş goldawy', text: 'Ynanýan adamyňyz bilen gürleşmek duýýanlaryňyzy ýeňilleşdirip biler.'},
    ],
    section5Body: 'Sikl bilen baglanyşykly keýp üýtgemesi adatça wagtlaýyn. Şeýle-de bolsa, käbir alamatlar aýratyn üns talap edýär:',
    warningTitle: 'Üns bermeli alamatlar',
    concerningSigns: [
      'Güýçli gam ýa-da sikldan soň hem dowam edýän gam',
      'Adatça lezzet alýan zatlaryňyza gyzyklanmanyň aýdyň ýitmegi',
      'Gündelik durmuşyňyza ýa-da gatnaşyklaryňyza möhüm täsir',
      'Gaýtalanýan pikirler ýa-da möhüm ejir duýgusy',
    ],
    info2Title: 'Goldaw elýeter',
    info2Text: 'Lukman, akuşerka ýa-da psiholog duýýanlaryňyzy has gowy düşünmäge kömek edip we zerur bolsa goşmaça goldawa ugrukdyryp biler.',
    tipTitle: 'Bilmek peýdaly',
    tipText: 'Gormonlar bilen keýbiň arasyndaky baglanyşygy ykrar etmek hemme zady diňe şu düşündirişe getirmän, duýýanlaryňyzy has gowy düşünmäge kömek edip biler.',
    summaryPoints: [
      'Estrogen we progesteronyň yrgyldylary keýp bilen baglanyşykly neýromediatorlara göni täsir edýär.',
      'Aýbaşydan öňki gaharjaňlygyň hakyky biologik düşündirişi bar.',
      'Her keýp üýtgemesi sikl bilen hökman baglanyşykly däl: durmuş ýagdaýlary hem möhüm.',
      'Uky, fiziki işjeňlik we durmuş goldawy keýbi durnuklaşdyrmak üçin iň gowy kömekçiler bolup galýar.',
    ],
    disclaimerText: 'Maglumat berýän mazmun. Bu makala şahsylaşdyrylan lukmançylyk ýa-da psihologiki maslahatyny çalyşmaýar. Şübhe bolsa, saglyk hünärmeninden ugrukdyrma soraň.',
    shareMessage: 'Keýp we gormonal yrgyldylar — AWA',
  },
} as const);

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

/* -------------------------------------------------------------------------- */
/* SCREEN                                                                     */
/* -------------------------------------------------------------------------- */

export default function MoodHormonesArticleScreen({
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

          <AwaText variant="titleSmall" style={styles.intro}>{content.intro}</AwaText>

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

          <AwaText variant="bodyMedium" style={styles.body}>{content.section1Body}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.infoCard}>
            <MaterialDesignIcons
              name="information-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <AwaText variant="titleSmall" emphasized>{content.info1Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.infoText}>{content.info1Text}</AwaText>
            </View>
          </AwaCard>

          {/* ================================================================= */}
          {/* SECTION 2                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>2. {content.topics[1]}</AwaText>

          <View style={styles.normalGrid}>
            {PHASE_MOOD_ICONS.map((icon, index) => {
              const item = content.phaseMood[index];
              return (
                <AwaCard variant="filled" padding="none" key={item.title} style={styles.normalCard}>
                  <View style={styles.normalIcon}>
                    <MaterialDesignIcons
                      name={icon as never}
                      size={20}
                      color={theme.colors.primary}
                    />
                  </View>

                  <AwaText variant="titleSmall" emphasized style={styles.normalTitle}>{item.title}</AwaText>
                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.normalText}>{item.text}</AwaText>
                </AwaCard>
              );
            })}
          </View>

          <AwaText variant="bodyMedium" style={styles.body}>{content.section2Body}</AwaText>

          {/* ================================================================= */}
          {/* SECTION 3                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.topics[2]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.comfortCard}>
            {OBSERVE_HABITS_ICONS.map((icon, index) => {
              const item = content.observeHabits[index];
              return (
                <View
                  key={item.title}
                  style={[
                    styles.comfortRow,
                    index < OBSERVE_HABITS_ICONS.length - 1 && styles.comfortRowBorder,
                  ]}>
                  <View style={styles.comfortIcon}>
                    <MaterialDesignIcons
                      name={icon as never}
                      size={19}
                      color={theme.colors.primary}
                    />
                  </View>

                  <View style={styles.comfortCopy}>
                    <AwaText variant="titleSmall" emphasized>{item.title}</AwaText>
                    <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.comfortText}>{item.text}</AwaText>
                  </View>
                </View>
              );
            })}
          </AwaCard>

          {/* ================================================================= */}
          {/* SECTION 4                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.topics[3]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>{content.section4Body}</AwaText>

          <View style={styles.normalGrid}>
            {HELPFUL_HABITS_ICONS.map((icon, index) => {
              const item = content.helpfulHabits[index];
              return (
                <AwaCard variant="filled" padding="none" key={item.title} style={styles.normalCard}>
                  <View style={styles.normalIcon}>
                    <MaterialDesignIcons
                      name={icon as never}
                      size={20}
                      color={theme.colors.primary}
                    />
                  </View>

                  <AwaText variant="titleSmall" emphasized style={styles.normalTitle}>{item.title}</AwaText>
                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.normalText}>{item.text}</AwaText>
                </AwaCard>
              );
            })}
          </View>

          {/* ================================================================= */}
          {/* SECTION 5                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>5. {content.topics[4]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>{content.section5Body}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <MaterialDesignIcons
                name="alert-circle-outline"
                size={22}
                color={theme.colors.warning}
              />

              <AwaText variant="titleSmall" emphasized style={styles.warningTitle}>{content.warningTitle}</AwaText>
            </View>

            {content.concerningSigns.map(item => (
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
              name="account-heart-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <AwaText variant="titleSmall" emphasized>{content.info2Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.infoText}>{content.info2Text}</AwaText>
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
