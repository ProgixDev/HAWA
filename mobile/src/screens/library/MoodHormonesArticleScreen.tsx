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
