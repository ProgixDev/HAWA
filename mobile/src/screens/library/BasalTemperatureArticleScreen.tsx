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

const ID = 'basaltemp-suivre-temperature';

const HERO = require('../../assets/images/library/featured-spm.png');

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const MEASURING_ICONS = ['thermometer', 'clock-outline', 'pencil-outline'] as const;

/* -------------------------------------------------------------------------- */
/* DATA                                                                       */
/* -------------------------------------------------------------------------- */

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'FERTILITÉ • TEMPÉRATURE BASALE',
    title: 'Suivre sa\ntempérature basale',
    metaDuration: '6 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Intermédiaire',
    metaValidated: 'Contenu validé',
    intro: 'Une méthode simple pour confirmer, après coup, que l’ovulation a bien eu lieu.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Qu’est-ce que la température basale ?',
      'Quand et comment la mesurer',
      'Repérer la hausse après l’ovulation',
      'Ce qui peut fausser une mesure',
      'Les limites de cette méthode',
      'Quand en parler à un professionnel',
      'À retenir',
    ],
    section1Body: 'La température basale est la température de ton corps au repos complet, avant toute activité. Elle varie très légèrement au fil du cycle, sous l’influence de tes hormones.',
    section2Body: 'Elle se mesure chaque matin, avant de te lever, toujours à la même heure et avec le même thermomètre.',
    measuringTips: [
      {title: 'Le même thermomètre', text: 'Utilise toujours le même thermomètre, idéalement basal (plus précis au dixième de degré).'},
      {title: 'La même heure', text: 'Mesure à heure fixe, avant de te lever, après au moins 3 heures de sommeil ininterrompu.'},
      {title: 'Noter aussitôt', text: 'Note la valeur immédiatement, avant même de te lever ou de parler.'},
    ],
    section3Body: 'La température basale augmente légèrement (0,2 à 0,5 °C) juste après l’ovulation, sous l’effet de la progestérone, et reste plus haute jusqu’aux règles suivantes.',
    curveTitle: 'À quoi ressemble la courbe',
    curveText: 'Plus basse en première partie de cycle, elle monte d’un cran après l’ovulation et s’y maintient — un profil qui ne devient lisible qu’après plusieurs jours de relevés.',
    disruptingFactors: [
      'Une nuit de sommeil courte ou agitée',
      'Un réveil à une heure inhabituelle',
      'De la fièvre ou une maladie',
      'De l’alcool la veille au soir',
      'Un décalage horaire récent',
    ],
    section5Body: 'Ce n’est pas une méthode prédictive mais confirmative : elle t’aide à mieux connaître ton propre cycle, une fois l’ovulation déjà passée — pas à l’anticiper.',
    section5Caption: 'La observer seule sur un ou deux cycles ne suffit généralement pas : le profil se dessine avec la répétition.',
    warningTitle: 'Bon à évoquer avec un professionnel',
    consultSituations: [
      'Aucune hausse de température ne se dessine sur plusieurs cycles complets',
      'Les températures restent très irrégulières malgré une mesure rigoureuse',
      'Tu as des questions sur ta fertilité que ce suivi seul ne peut pas résoudre',
    ],
    tipTitle: 'Bon à savoir',
    tipText: 'Associer la température basale à l’observation de ta glaire cervicale ou à des tests d’ovulation donne une image plus complète de ton cycle.',
    summaryPoints: [
      'La température basale augmente légèrement (0,2 à 0,5 °C) juste après l’ovulation, sous l’effet de la progestérone.',
      'Elle se mesure chaque matin, avant de se lever, toujours à la même heure et avec le même thermomètre.',
      'Ce n’est pas une méthode prédictive mais confirmative : elle t’aide à mieux connaître ton propre cycle.',
      'La combiner à d’autres signes (glaire cervicale, tests d’ovulation) donne une vision plus complète.',
    ],
    disclaimerText: 'Contenu informatif. Cet article ne remplace pas un avis médical personnalisé. En cas de doute, demande conseil à un professionnel de santé.',
    shareMessage: 'Suivre sa température basale — AWA',
  },
  en: {
    badge: 'FERTILITY • BASAL BODY TEMPERATURE',
    title: 'Tracking your\nbasal body temperature',
    metaDuration: '6 min read',
    metaType: 'Guide',
    metaLevel: 'Intermediate',
    metaValidated: 'Reviewed content',
    intro: 'A simple method to confirm, after the fact, that ovulation has occurred.',
    contentsTitle: 'In this article',
    topics: [
      'What is basal body temperature?',
      'When and how to measure it',
      'Spotting the rise after ovulation',
      'What can skew a reading',
      'The limits of this method',
      'When to talk to a professional',
      'Key takeaways',
    ],
    section1Body: 'Basal body temperature is the temperature of your body at complete rest, before any activity. It varies very slightly over the course of the cycle, under the influence of your hormones.',
    section2Body: 'It’s measured every morning, before you get up, always at the same time and with the same thermometer.',
    measuringTips: [
      {title: 'The same thermometer', text: 'Always use the same thermometer, ideally a basal one (more precise, to a tenth of a degree).'},
      {title: 'The same time', text: 'Measure at a fixed time, before getting up, after at least 3 hours of uninterrupted sleep.'},
      {title: 'Write it down right away', text: 'Write down the reading immediately, before even getting up or speaking.'},
    ],
    section3Body: 'Basal body temperature rises slightly (0.2 to 0.5°C) just after ovulation, under the effect of progesterone, and stays higher until your next period.',
    curveTitle: 'What the chart looks like',
    curveText: 'Lower in the first part of the cycle, it steps up after ovulation and stays there — a pattern that only becomes clear after several days of readings.',
    disruptingFactors: [
      'A short or restless night’s sleep',
      'Waking up at an unusual time',
      'Fever or illness',
      'Alcohol the night before',
      'Recent jet lag',
    ],
    section5Body: 'This isn’t a predictive method but a confirmative one: it helps you better understand your own cycle, once ovulation has already happened — not to anticipate it.',
    section5Caption: 'Observing it alone over one or two cycles usually isn’t enough: the pattern emerges with repetition.',
    warningTitle: 'Worth mentioning to a professional',
    consultSituations: [
      'No temperature rise appears over several complete cycles',
      'Temperatures stay very irregular despite careful measurement',
      'You have questions about your fertility that this tracking alone can’t answer',
    ],
    tipTitle: 'Good to know',
    tipText: 'Combining basal body temperature with observing your cervical mucus or ovulation tests gives a more complete picture of your cycle.',
    summaryPoints: [
      'Basal body temperature rises slightly (0.2 to 0.5°C) right after ovulation, under the effect of progesterone.',
      'It’s measured every morning, before getting up, always at the same time and with the same thermometer.',
      'This isn’t a predictive method but a confirmative one: it helps you better understand your own cycle.',
      'Combining it with other signs (cervical mucus, ovulation tests) gives a more complete picture.',
    ],
    disclaimerText: 'Informational content. This article doesn’t replace personalized medical advice. If in doubt, ask a healthcare professional for guidance.',
    shareMessage: 'Tracking basal body temperature — AWA',
  },
  es: {
    badge: 'FERTILIDAD • TEMPERATURA BASAL',
    title: 'Seguir tu\ntemperatura basal',
    metaDuration: '6 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenido validado',
    intro: 'Un método sencillo para confirmar, a posteriori, que la ovulación realmente ocurrió.',
    contentsTitle: 'En este artículo',
    topics: [
      '¿Qué es la temperatura basal?',
      'Cuándo y cómo medirla',
      'Detectar la subida después de la ovulación',
      'Qué puede alterar una medición',
      'Los límites de este método',
      'Cuándo hablarlo con un profesional',
      'Para recordar',
    ],
    section1Body: 'La temperatura basal es la temperatura de tu cuerpo en reposo completo, antes de cualquier actividad. Varía muy ligeramente a lo largo del ciclo, bajo la influencia de tus hormonas.',
    section2Body: 'Se mide cada mañana, antes de levantarte, siempre a la misma hora y con el mismo termómetro.',
    measuringTips: [
      {title: 'El mismo termómetro', text: 'Usa siempre el mismo termómetro, idealmente uno basal (más preciso, a la décima de grado).'},
      {title: 'La misma hora', text: 'Mide a una hora fija, antes de levantarte, después de al menos 3 horas de sueño ininterrumpido.'},
      {title: 'Anotar de inmediato', text: 'Anota el valor de inmediato, incluso antes de levantarte o de hablar.'},
    ],
    section3Body: 'La temperatura basal aumenta ligeramente (de 0,2 a 0,5 °C) justo después de la ovulación, por efecto de la progesterona, y permanece más alta hasta la siguiente regla.',
    curveTitle: 'A qué se parece la curva',
    curveText: 'Más baja en la primera parte del ciclo, sube un escalón después de la ovulación y se mantiene ahí: un perfil que solo se vuelve claro después de varios días de registros.',
    disruptingFactors: [
      'Una noche de sueño corta o agitada',
      'Despertarte a una hora inusual',
      'Fiebre o enfermedad',
      'Alcohol la noche anterior',
      'Un desfase horario reciente',
    ],
    section5Body: 'No es un método predictivo, sino confirmativo: te ayuda a conocer mejor tu propio ciclo, una vez que la ovulación ya ha pasado, no a anticiparla.',
    section5Caption: 'Observarla sola durante uno o dos ciclos generalmente no basta: el perfil se define con la repetición.',
    warningTitle: 'Bueno comentarlo con un profesional',
    consultSituations: [
      'No se observa ninguna subida de temperatura en varios ciclos completos',
      'Las temperaturas se mantienen muy irregulares a pesar de una medición rigurosa',
      'Tienes preguntas sobre tu fertilidad que este seguimiento por sí solo no puede resolver',
    ],
    tipTitle: 'Dato útil',
    tipText: 'Combinar la temperatura basal con la observación de tu moco cervical o con pruebas de ovulación te da una imagen más completa de tu ciclo.',
    summaryPoints: [
      'La temperatura basal aumenta ligeramente (de 0,2 a 0,5 °C) justo después de la ovulación, por efecto de la progesterona.',
      'Se mide cada mañana, antes de levantarte, siempre a la misma hora y con el mismo termómetro.',
      'No es un método predictivo, sino confirmativo: te ayuda a conocer mejor tu propio ciclo.',
      'Combinarla con otras señales (moco cervical, pruebas de ovulación) da una visión más completa.',
    ],
    disclaimerText: 'Contenido informativo. Este artículo no sustituye una opinión médica personalizada. Si tienes dudas, consulta a un profesional de la salud.',
    shareMessage: 'Seguir tu temperatura basal — AWA',
  },
  it: {
    badge: 'FERTILITÀ • TEMPERATURA BASALE',
    title: 'Monitorare la tua\ntemperatura basale',
    metaDuration: '6 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenuto validato',
    intro: 'Un metodo semplice per confermare, a posteriori, che l’ovulazione è avvenuta.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Che cos’è la temperatura basale?',
      'Quando e come misurarla',
      'Riconoscere l’aumento dopo l’ovulazione',
      'Cosa può alterare una misurazione',
      'I limiti di questo metodo',
      'Quando parlarne con un professionista',
      'Punti chiave',
    ],
    section1Body: 'La temperatura basale è la temperatura del tuo corpo a riposo completo, prima di qualsiasi attività. Varia molto lievemente nel corso del ciclo, sotto l’influenza dei tuoi ormoni.',
    section2Body: 'Si misura ogni mattina, prima di alzarti, sempre alla stessa ora e con lo stesso termometro.',
    measuringTips: [
      {
        title: 'Lo stesso termometro',
        text: 'Usa sempre lo stesso termometro, idealmente uno basale (più preciso, al decimo di grado).',
      },
      {
        title: 'Alla stessa ora',
        text: 'Misura a un’ora fissa, prima di alzarti, dopo almeno 3 ore di sonno ininterrotto.',
      },
      {
        title: 'Annotala subito',
        text: 'Annota subito la misurazione, prima ancora di alzarti o di parlare.',
      },
    ],
    section3Body: 'La temperatura basale aumenta leggermente (da 0,2 a 0,5°C) subito dopo l’ovulazione, per effetto del progesterone, e resta più alta fino al periodo mestruale successivo.',
    curveTitle: 'Che aspetto ha il grafico',
    curveText: 'Più bassa nella prima parte del ciclo, sale a gradino dopo l’ovulazione e vi rimane — un andamento che diventa chiaro solo dopo diversi giorni di misurazioni.',
    disruptingFactors: [
      'Una notte di sonno breve o agitata',
      'Svegliarsi a un’ora insolita',
      'Febbre o malattia',
      'Alcol la sera prima',
      'Jet lag recente',
    ],
    section5Body: 'Non è un metodo predittivo ma di conferma: ti aiuta a capire meglio il tuo ciclo, quando l’ovulazione è già avvenuta — non ad anticiparla.',
    section5Caption: 'Osservarla da sola per uno o due cicli di solito non basta: l’andamento emerge con la ripetizione.',
    warningTitle: 'Da riferire a un professionista',
    consultSituations: [
      'Non compare alcun aumento della temperatura nel corso di diversi cicli completi',
      'Le temperature restano molto irregolari nonostante misurazioni accurate',
      'Hai domande sulla tua fertilità a cui questo monitoraggio da solo non può rispondere',
    ],
    tipTitle: 'Da sapere',
    tipText: 'Combinare la temperatura basale con l’osservazione del muco cervicale o con i test di ovulazione offre un quadro più completo del tuo ciclo.',
    summaryPoints: [
      'La temperatura basale aumenta leggermente (da 0,2 a 0,5°C) subito dopo l’ovulazione, per effetto del progesterone.',
      'Si misura ogni mattina, prima di alzarsi, sempre alla stessa ora e con lo stesso termometro.',
      'Non è un metodo predittivo ma di conferma: ti aiuta a capire meglio il tuo ciclo.',
      'Combinarla con altri segni (muco cervicale, test di ovulazione) offre un quadro più completo.',
    ],
    disclaimerText: 'Contenuto informativo. Questo articolo non sostituisce un parere medico personalizzato. In caso di dubbi, chiedi consiglio a un professionista sanitario.',
    shareMessage: 'Monitorare la temperatura basale — AWA',
  },
  tr: {
    badge: 'DOĞURGANLIK • BAZAL VÜCUT SICAKLIĞI',
    title: 'Bazal vücut sıcaklığını\ntakip etmek',
    metaDuration: '6 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Orta düzey',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Yumurtlamanın gerçekleştiğini sonradan doğrulamak için basit bir yöntem.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Bazal vücut sıcaklığı nedir?',
      'Ne zaman ve nasıl ölçülür?',
      'Yumurtlamadan sonraki yükselişi fark etmek',
      'Ölçümü etkileyebilecek durumlar',
      'Bu yöntemin sınırları',
      'Ne zaman bir uzmana danışmalı?',
      'Akılda kalacaklar',
    ],
    section1Body: 'Bazal vücut sıcaklığı, vücudunun tam dinlenme halindeki, herhangi bir aktiviteden önceki sıcaklığıdır. Hormonlarının etkisiyle döngü boyunca çok hafif değişir.',
    section2Body: 'Her sabah, yataktan kalkmadan önce, hep aynı saatte ve aynı termometreyle ölçülür.',
    measuringTips: [
      {
        title: 'Aynı termometre',
        text: 'Hep aynı termometreyi kullan; mümkünse bazal termometre olsun (daha hassastır, derecenin onda birini gösterir).',
      },
      {
        title: 'Aynı saat',
        text: 'Sabit bir saatte, yataktan kalkmadan önce, en az 3 saat kesintisiz uykudan sonra ölç.',
      },
      {
        title: 'Hemen not al',
        text: 'Değeri, yataktan kalkmadan ve konuşmadan hemen önce not al.',
      },
    ],
    section3Body: 'Bazal vücut sıcaklığı, yumurtlamanın hemen ardından progesteronun etkisiyle hafifçe (0,2 ile 0,5 °C arasında) yükselir ve bir sonraki adetine kadar yüksek kalır.',
    curveTitle: 'Grafik nasıl görünür?',
    curveText: 'Döngünün ilk bölümünde daha düşük seyreder, yumurtlamadan sonra bir basamak yükselir ve yüksek kalır; bu örüntü ancak birkaç günlük ölçümden sonra netleşir.',
    disruptingFactors: [
      'Kısa veya bölünmüş bir uyku',
      'Alışılmadık bir saatte uyanmak',
      'Ateş veya hastalık',
      'Bir önceki akşam alkol almak',
      'Yakın zamanda yaşanan saat dilimi farkı (jet lag)',
    ],
    section5Body: 'Bu, öngörücü değil doğrulayıcı bir yöntemdir: yumurtlama gerçekleştikten sonra kendi döngünü daha iyi anlamana yardımcı olur; yumurtlamayı önceden tahmin etmeye yaramaz.',
    section5Caption: 'Tek başına bir veya iki döngü boyunca gözlemlemek genellikle yeterli olmaz: örüntü tekrarlarla ortaya çıkar.',
    warningTitle: 'Bir uzmana söylemeye değer',
    consultSituations: [
      'Birkaç tam döngü boyunca sıcaklıkta hiç yükseliş görülmüyor',
      'Dikkatli ölçüme rağmen sıcaklıklar çok düzensiz kalıyor',
      'Doğurganlığınla ilgili, bu takibin tek başına yanıtlayamadığı sorularınız var',
    ],
    tipTitle: 'Bilmekte fayda var',
    tipText: 'Bazal vücut sıcaklığını servikal mukus gözlemi veya ovülasyon testleriyle birlikte kullanmak, döngün hakkında daha eksiksiz bir tablo sunar.',
    summaryPoints: [
      'Bazal vücut sıcaklığı, yumurtlamanın hemen ardından progesteronun etkisiyle hafifçe (0,2 ile 0,5 °C arasında) yükselir.',
      'Her sabah, yataktan kalkmadan önce, hep aynı saatte ve aynı termometreyle ölçülür.',
      'Bu, öngörücü değil doğrulayıcı bir yöntemdir: kendi döngünü daha iyi anlamana yardımcı olur.',
      'Diğer belirtilerle (servikal mukus, ovülasyon testleri) birleştirildiğinde daha eksiksiz bir tablo sunar.',
    ],
    disclaimerText: 'Bilgilendirme amaçlı içerik. Bu makale kişiye özel tıbbi tavsiyenin yerini tutmaz. Şüphen varsa bir sağlık profesyonelinden yönlendirme iste.',
    shareMessage: 'Bazal vücut sıcaklığını takip etmek — AWA',
  },
  ru: {
    badge: 'ФЕРТИЛЬНОСТЬ • БАЗАЛЬНАЯ ТЕМПЕРАТУРА',
    title: 'Измерение\nбазальной температуры',
    metaDuration: '6 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Средний уровень',
    metaValidated: 'Проверенный материал',
    intro: 'Простой способ постфактум подтвердить, что овуляция произошла.',
    contentsTitle: 'В этой статье',
    topics: [
      'Что такое базальная температура?',
      'Когда и как её измерять',
      'Как заметить повышение после овуляции',
      'Что может исказить результат',
      'Ограничения этого метода',
      'Когда стоит обратиться к специалисту',
      'Главное',
    ],
    section1Body: 'Базальная температура — это температура вашего тела в состоянии полного покоя, до любой активности. Под влиянием гормонов она очень незначительно меняется в течение цикла.',
    section2Body: 'Её измеряют каждое утро, не вставая с постели, всегда в одно и то же время и одним и тем же термометром.',
    measuringTips: [
      {title: 'Один и тот же термометр', text: 'Всегда пользуйтесь одним и тем же термометром, желательно базальным (он точнее — до десятых долей градуса).'},
      {title: 'Одно и то же время', text: 'Измеряйте в одно и то же время, до того как встанете, после как минимум 3 часов непрерывного сна.'},
      {title: 'Записывайте сразу', text: 'Записывайте показание сразу, не вставая с постели и не разговаривая.'},
    ],
    section3Body: 'Базальная температура слегка повышается (на 0,2–0,5 °C) сразу после овуляции под действием прогестерона и остаётся повышенной до следующих месячных.',
    curveTitle: 'Как выглядит график',
    curveText: 'В первой части цикла температура ниже, после овуляции она ступенчато повышается и остаётся на этом уровне — эта картина становится ясной только после нескольких дней измерений.',
    disruptingFactors: [
      'Короткий или беспокойный сон',
      'Пробуждение в необычное время',
      'Повышенная температура или болезнь',
      'Алкоголь накануне вечером',
      'Недавняя смена часового пояса',
    ],
    section5Body: 'Это не прогностический, а подтверждающий метод: он помогает лучше понять свой цикл уже после того, как овуляция произошла, но не позволяет предсказать её заранее.',
    section5Caption: 'Наблюдения в течение одного-двух циклов обычно недостаточны: закономерность проявляется при повторении.',
    warningTitle: 'Стоит обсудить со специалистом',
    consultSituations: [
      'В течение нескольких полных циклов не наблюдается повышения температуры',
      'Температура остаётся очень нестабильной, несмотря на тщательные измерения',
      'У вас есть вопросы о фертильности, на которые одно только такое наблюдение не может ответить',
    ],
    tipTitle: 'Полезно знать',
    tipText: 'Сочетание базальной температуры с наблюдением за цервикальной слизью или тестами на овуляцию даёт более полную картину вашего цикла.',
    summaryPoints: [
      'Базальная температура слегка повышается (на 0,2–0,5 °C) сразу после овуляции под действием прогестерона.',
      'Её измеряют каждое утро, не вставая с постели, всегда в одно и то же время и одним и тем же термометром.',
      'Это не прогностический, а подтверждающий метод: он помогает лучше понять свой цикл.',
      'В сочетании с другими признаками (цервикальная слизь, тесты на овуляцию) он даёт более полную картину.',
    ],
    disclaimerText: 'Информационный материал. Эта статья не заменяет индивидуальную медицинскую консультацию. При сомнениях обратитесь за советом к медицинскому специалисту.',
    shareMessage: 'Измерение базальной температуры — AWA',
  },
  de: {
    badge: 'FRUCHTBARKEIT • BASALTEMPERATUR',
    title: 'Deine Basaltemperatur\nmessen',
    metaDuration: '6 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Fortgeschritten',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Eine einfache Methode, um im Nachhinein zu bestätigen, dass ein Eisprung stattgefunden hat.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Was ist die Basaltemperatur?',
      'Wann und wie du sie misst',
      'Den Anstieg nach dem Eisprung erkennen',
      'Was eine Messung verfälschen kann',
      'Die Grenzen dieser Methode',
      'Wann du mit Fachpersonal sprechen solltest',
      'Das Wichtigste in Kürze',
    ],
    section1Body: 'Die Basaltemperatur ist die Temperatur deines Körpers in völliger Ruhe, vor jeder Aktivität. Sie verändert sich im Laufe des Zyklus unter dem Einfluss deiner Hormone nur ganz geringfügig.',
    section2Body: 'Sie wird jeden Morgen gemessen, bevor du aufstehst, immer zur gleichen Zeit und mit demselben Thermometer.',
    measuringTips: [
      {title: 'Dasselbe Thermometer', text: 'Verwende immer dasselbe Thermometer, am besten ein Basalthermometer (genauer, auf ein Zehntelgrad).'},
      {title: 'Dieselbe Uhrzeit', text: 'Miss zu einer festen Uhrzeit, vor dem Aufstehen, nach mindestens 3 Stunden ungestörtem Schlaf.'},
      {title: 'Sofort notieren', text: 'Notiere den Messwert sofort, noch bevor du aufstehst oder sprichst.'},
    ],
    section3Body: 'Die Basaltemperatur steigt direkt nach dem Eisprung unter dem Einfluss von Progesteron leicht an (um 0,2 bis 0,5 °C) und bleibt bis zu deiner nächsten Periode erhöht.',
    curveTitle: 'So sieht die Kurve aus',
    curveText: 'Im ersten Teil des Zyklus liegt sie niedriger, nach dem Eisprung steigt sie stufenartig an und bleibt dort – ein Muster, das erst nach mehreren Tagen mit Messwerten deutlich wird.',
    disruptingFactors: [
      'Eine kurze oder unruhige Nacht',
      'Aufwachen zu einer ungewöhnlichen Uhrzeit',
      'Fieber oder Krankheit',
      'Alkohol am Vorabend',
      'Ein kürzlicher Jetlag',
    ],
    section5Body: 'Das ist keine vorhersagende, sondern eine bestätigende Methode: Sie hilft dir, deinen eigenen Zyklus besser zu verstehen, nachdem der Eisprung bereits stattgefunden hat – nicht, ihn vorherzusehen.',
    section5Caption: 'Sie nur über einen oder zwei Zyklen zu beobachten, reicht meist nicht aus: Das Muster zeigt sich erst durch Wiederholung.',
    warningTitle: 'Mit Fachpersonal besprechen',
    consultSituations: [
      'Über mehrere vollständige Zyklen hinweg tritt kein Temperaturanstieg auf',
      'Die Temperaturen bleiben trotz sorgfältiger Messung sehr unregelmäßig',
      'Du hast Fragen zu deiner Fruchtbarkeit, die diese Beobachtung allein nicht beantworten kann',
    ],
    tipTitle: 'Gut zu wissen',
    tipText: 'Wenn du die Basaltemperatur mit der Beobachtung deines Zervixschleims oder mit Ovulationstests kombinierst, erhältst du ein vollständigeres Bild deines Zyklus.',
    summaryPoints: [
      'Die Basaltemperatur steigt direkt nach dem Eisprung unter dem Einfluss von Progesteron leicht an (um 0,2 bis 0,5 °C).',
      'Sie wird jeden Morgen gemessen, vor dem Aufstehen, immer zur gleichen Zeit und mit demselben Thermometer.',
      'Das ist keine vorhersagende, sondern eine bestätigende Methode: Sie hilft dir, deinen eigenen Zyklus besser zu verstehen.',
      'In Kombination mit anderen Anzeichen (Zervixschleim, Ovulationstests) ergibt sich ein vollständigeres Bild.',
    ],
    disclaimerText: 'Informationsinhalt. Dieser Artikel ersetzt keine persönliche ärztliche Beratung. Bei Zweifeln lass dich von medizinischem Fachpersonal beraten.',
    shareMessage: 'Die Basaltemperatur messen – AWA',
  },
  zh: {
      badge: '生育力 • 基础体温',
      title: '记录你的\n基础体温',
      metaDuration: '阅读约 6 分钟',
      metaType: '指南',
      metaLevel: '进阶',
      metaValidated: '已审核内容',
      intro: '一种简单的方法，可以在事后确认排卵已经发生。',
      contentsTitle: '本文内容',
      topics: [
        '什么是基础体温？',
        '何时测量、如何测量',
        '识别排卵后的体温升高',
        '哪些因素会让读数出现偏差',
        '这种方法的局限',
        '什么时候该咨询专业人员',
        '要点回顾',
      ],
      section1Body: '基础体温是你的身体在完全静息状态下、任何活动之前的体温。它会在周期中受激素影响而发生非常细微的变化。',
      section2Body: '每天早晨起床前测量，始终在同一时间、使用同一支体温计。',
      measuringTips: [
        {
          title: '使用同一支体温计',
          text: '始终使用同一支体温计，最好是基础体温计（更精确，可精确到十分之一度）。',
        },
        {
          title: '在同一时间测量',
          text: '在固定的时间测量，起床之前，并且至少连续睡了 3 小时。',
        },
        {
          title: '马上记下来',
          text: '读数后立刻记录，在起身或说话之前。',
        },
      ],
      section3Body: '排卵之后，在孕酮的作用下，基础体温会略微升高（0.2 至 0.5°C），并一直保持在较高的水平，直到下一次月经来潮。',
      curveTitle: '曲线大致是什么样子',
      curveText: '在周期的前半段，体温较低；排卵后会阶梯式上升，并保持在较高的水平。这种模式要经过连续几天的测量才会变得清晰。',
      disruptingFactors: [
        '睡眠时间短或睡得不安稳',
        '在不寻常的时间醒来',
        '发热或生病',
        '前一晚饮酒',
        '最近有时差',
      ],
      section5Body: '这不是一种预测方法，而是一种确认方法：它帮助你在排卵已经发生之后，更好地了解自己的周期，而不是提前预知排卵。',
      section5Caption: '只观察一两个周期通常是不够的：规律需要通过重复才会显现出来。',
      warningTitle: '值得告诉专业人员的情况',
      consultSituations: [
        '连续几个完整周期都没有出现体温升高',
        '即使认真测量，体温仍然非常不规律',
        '你对自己的生育力有疑问，仅靠这种记录无法回答',
      ],
      tipTitle: '小贴士',
      tipText: '把基础体温与宫颈黏液的观察或排卵试纸结合起来，可以更完整地了解你的周期。',
      summaryPoints: [
        '在孕酮的作用下，基础体温会在排卵后略微升高（0.2 至 0.5°C）。',
        '每天早晨起床前测量，始终在同一时间、使用同一支体温计。',
        '这不是一种预测方法，而是一种确认方法：它帮助你更好地了解自己的周期。',
        '把它与其他表现（宫颈黏液、排卵试纸）结合起来，能得到更完整的了解。',
      ],
      disclaimerText: '仅供参考。本文不能替代个性化的医疗建议。如有疑问，请向医疗专业人员咨询。',
      shareMessage: '记录基础体温 — AWA',
    },
  id: {
    badge: 'KESUBURAN • SUHU TUBUH BASAL',
    title: 'Memantau\nsuhu tubuh basalmu',
    metaDuration: '6 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Menengah',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Metode sederhana untuk memastikan, setelah kejadiannya, bahwa ovulasi sudah terjadi.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Apa itu suhu tubuh basal?',
      'Kapan dan bagaimana mengukurnya',
      'Mengenali kenaikan setelah ovulasi',
      'Apa yang bisa memengaruhi hasil ukur',
      'Keterbatasan metode ini',
      'Kapan perlu bicara dengan tenaga profesional',
      'Poin penting',
    ],
    section1Body: 'Suhu tubuh basal adalah suhu tubuhmu saat benar-benar beristirahat, sebelum melakukan aktivitas apa pun. Suhu ini berubah sangat tipis sepanjang siklus, di bawah pengaruh hormonmu.',
    section2Body: 'Suhu ini diukur setiap pagi, sebelum bangun dari tempat tidur, selalu pada jam yang sama dan dengan termometer yang sama.',
    measuringTips: [
      {
        title: 'Termometer yang sama',
        text: 'Selalu gunakan termometer yang sama, sebaiknya termometer basal (lebih akurat, sampai sepersepuluh derajat).',
      },
      {
        title: 'Jam yang sama',
        text: 'Ukur pada jam yang tetap, sebelum bangun, setelah tidur tanpa terputus setidaknya 3 jam.',
      },
      {
        title: 'Langsung catat',
        text: 'Catat hasil pengukuran segera, bahkan sebelum bangun atau berbicara.',
      },
    ],
    section3Body: 'Suhu tubuh basal naik sedikit (0,2 hingga 0,5°C) tepat setelah ovulasi, karena pengaruh progesteron, dan tetap lebih tinggi sampai haid berikutnya.',
    curveTitle: 'Seperti apa bentuk grafiknya',
    curveText: 'Suhu lebih rendah pada paruh pertama siklus, lalu naik setelah ovulasi dan bertahan di sana — pola yang baru terlihat jelas setelah beberapa hari pengukuran.',
    disruptingFactors: [
      'Tidur yang singkat atau gelisah',
      'Bangun pada jam yang tidak biasa',
      'Demam atau sakit',
      'Alkohol pada malam sebelumnya',
      'Jet lag baru-baru ini',
    ],
    section5Body: 'Ini bukan metode untuk memprediksi, melainkan untuk mengonfirmasi: metode ini membantumu lebih memahami siklusmu sendiri, setelah ovulasi terjadi — bukan untuk mengantisipasinya.',
    section5Caption: 'Mengamatinya sendirian selama satu atau dua siklus biasanya belum cukup: polanya muncul lewat pengulangan.',
    warningTitle: 'Perlu disampaikan kepada tenaga profesional',
    consultSituations: [
      'Tidak ada kenaikan suhu selama beberapa siklus penuh',
      'Suhu tetap sangat tidak teratur meski pengukuran sudah dilakukan dengan cermat',
      'Kamu punya pertanyaan tentang kesuburanmu yang tidak bisa dijawab oleh pemantauan ini saja',
    ],
    tipTitle: 'Perlu diketahui',
    tipText: 'Menggabungkan suhu tubuh basal dengan pengamatan lendir serviks atau tes ovulasi memberi gambaran siklusmu yang lebih lengkap.',
    summaryPoints: [
      'Suhu tubuh basal naik sedikit (0,2 hingga 0,5°C) tepat setelah ovulasi, karena pengaruh progesteron.',
      'Suhu ini diukur setiap pagi, sebelum bangun, selalu pada jam yang sama dan dengan termometer yang sama.',
      'Ini bukan metode untuk memprediksi, melainkan untuk mengonfirmasi: membantumu lebih memahami siklusmu sendiri.',
      'Menggabungkannya dengan tanda lain (lendir serviks, tes ovulasi) memberi gambaran yang lebih lengkap.',
    ],
    disclaimerText: 'Konten informatif. Artikel ini tidak menggantikan saran medis yang dipersonalisasi. Jika ragu, mintalah bimbingan dari tenaga kesehatan.',
    shareMessage: 'Memantau suhu tubuh basal — AWA',
  },
  hi: {
    badge: 'प्रजनन क्षमता • बेसल शारीरिक तापमान',
    title: 'अपने बेसल शारीरिक\nतापमान को ट्रैक करना',
    metaDuration: '6 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'मध्यम',
    metaValidated: 'समीक्षा की गई सामग्री',
    intro: 'ओव्यूलेशन (अंडोत्सर्ग) हो चुकने के बाद उसकी पुष्टि करने का एक आसान तरीका।',
    contentsTitle: 'इस लेख में',
    topics: [
      'बेसल शारीरिक तापमान क्या है?',
      'कब और कैसे नापें',
      'ओव्यूलेशन के बाद की बढ़त पहचानना',
      'रीडिंग को क्या बिगाड़ सकता है',
      'इस तरीके की सीमाएँ',
      'विशेषज्ञ से कब बात करें',
      'मुख्य बातें',
    ],
    section1Body: 'बेसल शारीरिक तापमान आपके शरीर का वह तापमान है जो पूरे आराम की हालत में, किसी भी गतिविधि से पहले होता है। हार्मोन के असर से यह चक्र के दौरान बहुत हल्का-सा बदलता है।',
    section2Body: 'इसे हर सुबह, उठने से पहले, हमेशा एक ही समय पर और एक ही थर्मामीटर से नापा जाता है।',
    measuringTips: [
      {
        title: 'हमेशा एक ही थर्मामीटर',
        text: 'हमेशा एक ही थर्मामीटर इस्तेमाल करें, बेहतर होगा कि बेसल थर्मामीटर हो (ज़्यादा सटीक, डिग्री के दसवें हिस्से तक)।',
      },
      {
        title: 'हमेशा एक ही समय',
        text: 'एक तय समय पर नापें, उठने से पहले, कम से कम 3 घंटे की बिना टूटी नींद के बाद।',
      },
      {
        title: 'तुरंत लिख लें',
        text: 'रीडिंग तुरंत लिख लें, उठने या बात करने से भी पहले।',
      },
    ],
    section3Body: 'ओव्यूलेशन के ठीक बाद प्रोजेस्टेरोन के असर से बेसल शारीरिक तापमान थोड़ा बढ़ता है (0.2 से 0.5°C) और अगले पीरियड तक ऊँचा बना रहता है।',
    curveTitle: 'चार्ट कैसा दिखता है',
    curveText: 'चक्र के पहले हिस्से में यह कम रहता है, ओव्यूलेशन के बाद सीढ़ी की तरह ऊपर चढ़ता है और वहीं टिका रहता है — यह पैटर्न कई दिनों की रीडिंग के बाद ही साफ़ दिखता है।',
    disruptingFactors: [
      'छोटी या बेचैन नींद',
      'असामान्य समय पर जागना',
      'बुखार या बीमारी',
      'पिछली रात शराब का सेवन',
      'हाल ही में समय-क्षेत्र बदलने की थकान (जेट लैग)',
    ],
    section5Body: 'यह अनुमान लगाने वाला नहीं, बल्कि पुष्टि करने वाला तरीका है: ओव्यूलेशन हो जाने के बाद यह आपको अपना चक्र बेहतर समझने में मदद करता है — उसका पहले से अंदाज़ा लगाने में नहीं।',
    section5Caption: 'सिर्फ़ एक या दो चक्र देखना आमतौर पर काफ़ी नहीं होता: पैटर्न बार-बार दोहराव से उभरता है।',
    warningTitle: 'विशेषज्ञ को बताने लायक',
    consultSituations: [
      'कई पूरे चक्रों में तापमान में कोई बढ़त नहीं दिखती',
      'सावधानी से नापने के बावजूद तापमान बहुत अनियमित रहता है',
      'आपके मन में प्रजनन क्षमता को लेकर ऐसे सवाल हैं जिनका जवाब सिर्फ़ इस ट्रैकिंग से नहीं मिल सकता',
    ],
    tipTitle: 'जानने लायक',
    tipText: 'बेसल शारीरिक तापमान को सर्वाइकल म्यूकस के अवलोकन या ओव्यूलेशन टेस्ट के साथ मिलाने से आपके चक्र की ज़्यादा पूरी तस्वीर मिलती है।',
    summaryPoints: [
      'ओव्यूलेशन के ठीक बाद प्रोजेस्टेरोन के असर से बेसल शारीरिक तापमान थोड़ा बढ़ता है (0.2 से 0.5°C)।',
      'इसे हर सुबह, उठने से पहले, हमेशा एक ही समय पर और एक ही थर्मामीटर से नापा जाता है।',
      'यह अनुमान लगाने वाला नहीं, बल्कि पुष्टि करने वाला तरीका है: यह आपको अपना चक्र बेहतर समझने में मदद करता है।',
      'इसे दूसरे संकेतों (सर्वाइकल म्यूकस, ओव्यूलेशन टेस्ट) के साथ मिलाने से ज़्यादा पूरी तस्वीर मिलती है।',
    ],
    disclaimerText: 'जानकारी के लिए सामग्री। यह लेख व्यक्तिगत चिकित्सकीय सलाह का विकल्प नहीं है। संदेह होने पर किसी स्वास्थ्य विशेषज्ञ से सलाह लें।',
    shareMessage: 'बेसल शारीरिक तापमान को ट्रैक करना — AWA',
  },
  sq: {
    badge: 'PJELLORIA • TEMPERATURA BAZALE E TRUPIT',
    title: 'Ndjekja e temperaturës\nbazale të trupit',
    metaDuration: '6 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Mesatar',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Një metodë e thjeshtë për të konfirmuar, pasi ka ndodhur, se ovulacioni ka ndodhur.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Çfarë është temperatura bazale e trupit?',
      'Kur dhe si matet',
      'Dallimi i rritjes pas ovulacionit',
      'Çfarë mund ta shtrembërojë një matje',
      'Kufijtë e kësaj metode',
      'Kur duhet folur me një profesionist',
      'Pikat kryesore',
    ],
    section1Body: 'Temperatura bazale e trupit është temperatura e trupit tënd në pushim të plotë, para çdo aktiviteti. Ajo ndryshon shumë pak gjatë ciklit, nën ndikimin e hormoneve të tua.',
    section2Body: 'Matet çdo mëngjes, para se të ngrihesh, gjithmonë në të njëjtën orë dhe me të njëjtin termometër.',
    measuringTips: [
      {
        title: 'I njëjti termometër',
        text: 'Përdor gjithmonë të njëjtin termometër, mundësisht një termometër bazal (më i saktë, deri te një e dhjeta e gradës).',
      },
      {
        title: 'Në të njëjtën orë',
        text: 'Mat në një orë të caktuar, para se të ngrihesh, pas të paktën 3 orësh gjumë të pandërprerë.',
      },
      {
        title: 'Shënoje menjëherë',
        text: 'Shënoje vlerën menjëherë, edhe para se të ngrihesh ose të flasësh.',
      },
    ],
    section3Body: 'Temperatura bazale e trupit rritet pak (0.2 deri 0.5°C) menjëherë pas ovulacionit, nën efektin e progesteronit, dhe mbetet më e lartë deri në menstruacionet e ardhshme.',
    curveTitle: 'Si duket grafiku',
    curveText: 'Më e ulët në pjesën e parë të ciklit, ajo ngrihet si një shkallë pas ovulacionit dhe mbetet aty — një model që bëhet i qartë vetëm pas disa ditësh matjesh.',
    disruptingFactors: [
      'Një natë gjumi i shkurtër ose i trazuar',
      'Zgjimi në një orë të pazakontë',
      'Ethe ose sëmundje',
      'Alkool natën e kaluar',
      'Ndryshim i fortë i zonës kohore kohët e fundit',
    ],
    section5Body: 'Kjo nuk është metodë parashikuese, por konfirmuese: të ndihmon ta kuptosh më mirë ciklin tënd, pasi ovulacioni ka ndodhur tashmë — jo për ta parashikuar atë.',
    section5Caption: 'Ta vëzhgosh vetëm gjatë një ose dy cikleve zakonisht nuk mjafton: modeli shfaqet me përsëritjen.',
    warningTitle: 'Ia vlen t’i përmendet një profesionisti',
    consultSituations: [
      'Nuk shfaqet asnjë rritje e temperaturës gjatë disa cikleve të plota',
      'Temperaturat mbeten shumë të parregullta edhe pse i mat me kujdes',
      'Ke pyetje për pjellorinë që vetëm kjo ndjekje nuk mund t’i përgjigjet',
    ],
    tipTitle: 'Mirë është ta dish',
    tipText: 'Kombinimi i temperaturës bazale të trupit me vëzhgimin e mukusit cervikal ose me testet e ovulacionit jep një pamje më të plotë të ciklit tënd.',
    summaryPoints: [
      'Temperatura bazale e trupit rritet pak (0.2 deri 0.5°C) menjëherë pas ovulacionit, nën efektin e progesteronit.',
      'Matet çdo mëngjes, para se të ngrihesh, gjithmonë në të njëjtën orë dhe me të njëjtin termometër.',
      'Kjo nuk është metodë parashikuese, por konfirmuese: të ndihmon ta kuptosh më mirë ciklin tënd.',
      'Kombinimi me shenja të tjera (mukusi cervikal, testet e ovulacionit) jep një pamje më të plotë.',
    ],
    disclaimerText: 'Përmbajtje informuese. Ky artikull nuk zëvendëson këshillën e personalizuar mjekësore. Nëse ke dyshime, kërko udhëzim nga një profesionist i shëndetësisë.',
    shareMessage: 'Ndjekja e temperaturës bazale të trupit — AWA',
  },
  ja: {
    badge: '妊娠しやすさ・基礎体温',
    title: '基礎体温を\n記録する',
    metaDuration: '読了時間6分',
    metaType: 'ガイド',
    metaLevel: '中級',
    metaValidated: '確認済みコンテンツ',
    intro: '排卵が起きたことを、あとから確認するためのシンプルな方法です。',
    contentsTitle: 'この記事の内容',
    topics: [
      '基礎体温とは？',
      '測るタイミングと方法',
      '排卵後の上昇に気づく',
      '測定値に影響すること',
      'この方法の限界',
      '専門家に相談するとき',
      'ポイントのまとめ',
    ],
    section1Body: '基礎体温とは、活動を始める前の、完全に安静にしているときの体温です。ホルモンの影響で、周期の中でごくわずかに変化します。',
    section2Body: '毎朝、起き上がる前に、いつも同じ時刻に同じ体温計で測ります。',
    measuringTips: [
      {
        title: '同じ体温計を使う',
        text: 'いつも同じ体温計を使いましょう。できれば基礎体温計がおすすめです（0.1度単位で、より正確に測れます）。',
      },
      {
        title: '同じ時刻に測る',
        text: '決まった時刻に、起き上がる前に測ります。少なくとも3時間は中断せずに眠ったあとが望ましいです。',
      },
      {
        title: 'すぐに書き留める',
        text: '起き上がったり話したりする前に、測った値をすぐに書き留めましょう。',
      },
    ],
    section3Body: '基礎体温は、排卵の直後にプロゲステロンの働きでわずかに（0.2〜0.5°C）上昇し、次の生理まで高い状態が続きます。',
    curveTitle: 'グラフのようす',
    curveText: '周期の前半は低めで、排卵後に段階的に上がり、そのまま高い状態が続きます。このパターンは、数日分の測定を重ねてはじめてはっきりします。',
    disruptingFactors: [
      '睡眠が短い、または眠りが浅い夜',
      'いつもと違う時刻に目が覚めた',
      '発熱や体調不良',
      '前の晩の飲酒',
      '最近の時差ぼけ',
    ],
    section5Body: 'これは予測のための方法ではなく、確認のための方法です。排卵がすでに起きたあとで、自分の周期をよりよく理解するのに役立ちます。排卵を先に見越すためのものではありません。',
    section5Caption: '1〜2周期だけ観察しても、たいていは十分ではありません。繰り返すことでパターンが見えてきます。',
    warningTitle: '専門家に伝えたいこと',
    consultSituations: [
      '何周期か続けて測っても、体温の上昇が見られない',
      '丁寧に測っているのに、体温が非常に不安定なままである',
      'この記録だけでは答えが出ない、妊娠しやすさについての疑問がある',
    ],
    tipTitle: '知っておきたいこと',
    tipText: '基礎体温に、頸管粘液の観察や排卵検査薬を組み合わせると、周期をより総合的に把握できます。',
    summaryPoints: [
      '基礎体温は、排卵の直後にプロゲステロンの働きでわずかに（0.2〜0.5°C）上昇します。',
      '毎朝、起き上がる前に、いつも同じ時刻に同じ体温計で測ります。',
      'これは予測のための方法ではなく、確認のための方法で、自分の周期をよりよく理解するのに役立ちます。',
      'ほかのサイン（頸管粘液、排卵検査薬）と組み合わせると、より総合的に把握できます。',
    ],
    disclaimerText: '情報提供を目的としたコンテンツです。この記事は、個別の医学的なアドバイスに代わるものではありません。不安なときは、医療従事者に相談してください。',
    shareMessage: '基礎体温の記録 — AWA',
  },
} as const;

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

/* -------------------------------------------------------------------------- */
/* SCREEN                                                                     */
/* -------------------------------------------------------------------------- */

export default function BasalTemperatureArticleScreen({
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

          {/* ================================================================= */}
          {/* SECTION 2                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>2. {content.topics[1]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>{content.section2Body}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.comfortCard}>
            {content.measuringTips.map((item, index) => (
              <View
                key={item.title}
                style={[
                  styles.comfortRow,
                  index < content.measuringTips.length - 1 &&
                    styles.comfortRowBorder,
                ]}>
                <View style={styles.comfortIcon}>
                  <MaterialDesignIcons
                    name={MEASURING_ICONS[index] as never}
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
          {/* SECTION 3                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.topics[2]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>{content.section3Body}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.infoCard}>
            <MaterialDesignIcons
              name="chart-line"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <AwaText variant="titleSmall" emphasized>{content.curveTitle}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.infoText}>{content.curveText}</AwaText>
            </View>
          </AwaCard>

          {/* ================================================================= */}
          {/* SECTION 4                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.topics[3]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.disruptingFactors.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="checkbox-blank-circle-outline"
                  size={14}
                  color={theme.colors.primary}
                />

                <AwaText variant="bodySmall" style={styles.checkText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          {/* ================================================================= */}
          {/* SECTION 5                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>5. {content.topics[4]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>{content.section5Body}</AwaText>

          <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.caption}>{content.section5Caption}</AwaText>

          {/* ================================================================= */}
          {/* SECTION 6                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>6. {content.topics[5]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <MaterialDesignIcons
                name="calendar-account-outline"
                size={22}
                color={theme.colors.primary}
              />

              <AwaText variant="titleSmall" emphasized colorRole="onSurfaceVariant" style={[styles.warningTitle, styles.warningTitleNeutral]}>
                {content.warningTitle}
              </AwaText>
            </View>

            {content.consultSituations.map(item => (
              <View key={item} style={styles.warningRow}>
                <View style={styles.warningBullet}>
                  <MaterialDesignIcons
                    name="check"
                    size={16}
                    color={theme.colors.success}
                  />
                </View>

                <AwaText variant="bodySmall" style={styles.warningText}>{item}</AwaText>
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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>{content.topics[6]}</AwaText>

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
  caption: {marginTop: 12, fontStyle: 'italic'},

  infoCard: {
    marginTop: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoCopy: {flex: 1, marginLeft: 8},
  infoText: {marginTop: 3},

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

  checkList: {
    marginTop: 12,
    padding: 12,
  },
  checkRow: {flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8},
  checkText: {flex: 1},

  warningCard: {
    marginTop: 12,
    padding: 16,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },
  warningHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 12},
  warningTitle: {flex: 1, marginLeft: 8},
  warningTitleNeutral: {color: theme.colors.text},
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
