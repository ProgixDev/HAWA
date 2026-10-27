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
const CONTENT = withBrazilianPortuguese('BasalTemperature', {
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
  ko: {
    badge: '임신 가능성 • 기초체온',
    title: '기초체온\n기록하기',
    metaDuration: '6분 읽기',
    metaType: '가이드',
    metaLevel: '중급',
    metaValidated: '검토된 콘텐츠',
    intro: '배란이 일어났는지를 사후에 확인할 수 있는 간단한 방법이에요.',
    contentsTitle: '이 아티클의 내용',
    topics: [
      '기초체온이란?',
      '언제, 어떻게 측정할까요',
      '배란 후 체온 상승 알아보기',
      '측정값에 영향을 줄 수 있는 것',
      '이 방법의 한계',
      '전문가와 상담해야 할 때',
      '핵심 정리',
    ],
    section1Body: '기초체온은 활동을 시작하기 전, 완전히 쉬고 있을 때의 체온이에요. 호르몬의 영향으로 주기 동안 아주 조금씩 달라져요.',
    section2Body: '매일 아침, 일어나기 전에, 항상 같은 시간에 같은 체온계로 측정해요.',
    measuringTips: [
      {
        title: '같은 체온계',
        text: '항상 같은 체온계를 사용해요. 기초체온계(0.1도 단위까지 더 정밀하게 측정)가 가장 좋아요.',
      },
      {
        title: '같은 시간',
        text: '일어나기 전, 최소 3시간 이상 끊기지 않고 잔 뒤 정해진 시간에 측정해요.',
      },
      {
        title: '바로 기록하기',
        text: '일어나거나 말하기 전에 측정값을 바로 적어 두어요.',
      },
    ],
    section3Body: '기초체온은 배란 직후 프로게스테론의 영향으로 약간(0.2~0.5°C) 오르고, 다음 생리까지 높은 상태가 이어져요.',
    curveTitle: '그래프는 이런 모양이에요',
    curveText: '주기 전반부에는 낮다가 배란 후에 한 단계 올라가 그대로 유지되는 모양이에요. 며칠간의 측정값이 쌓여야 패턴이 뚜렷해져요.',
    disruptingFactors: [
      '짧거나 뒤척인 수면',
      '평소와 다른 시간에 일어남',
      '발열이나 질병',
      '전날 밤의 음주',
      '최근의 시차',
    ],
    section5Body: '이 방법은 예측용이 아니라 확인용이에요. 배란이 이미 일어난 뒤에 나의 주기를 더 잘 이해하는 데 도움이 되며, 배란을 미리 알아내기 위한 것은 아니에요.',
    section5Caption: '한두 주기만 관찰해서는 보통 충분하지 않아요. 반복해서 기록해야 패턴이 드러나요.',
    warningTitle: '전문가에게 이야기해 볼 만한 경우',
    consultSituations: [
      '여러 주기를 완전히 측정해도 체온 상승이 나타나지 않아요',
      '꼼꼼히 측정해도 체온이 매우 불규칙해요',
      '이 기록만으로는 답하기 어려운 임신 가능성에 대한 궁금증이 있어요',
    ],
    tipTitle: '알아 두세요',
    tipText: '기초체온에 자궁 경부 점액 관찰이나 배란 테스트를 함께 활용하면 주기를 더 완전하게 파악할 수 있어요.',
    summaryPoints: [
      '기초체온은 배란 직후 프로게스테론의 영향으로 약간(0.2~0.5°C) 올라요.',
      '매일 아침, 일어나기 전에, 항상 같은 시간에 같은 체온계로 측정해요.',
      '이 방법은 예측용이 아니라 확인용이며, 나의 주기를 더 잘 이해하는 데 도움이 돼요.',
      '다른 신호(자궁 경부 점액, 배란 테스트)와 함께 활용하면 더 완전하게 파악할 수 있어요.',
    ],
    disclaimerText: '정보 제공 콘텐츠예요. 이 아티클은 개인에게 맞춘 의학적 조언을 대신하지 않아요. 걱정되는 점이 있다면 의료 전문가의 안내를 받아 보세요.',
    shareMessage: '기초체온 기록하기 — AWA',
  },
  'pt-PT': {
    badge: 'FERTILIDADE • TEMPERATURA CORPORAL BASAL',
    title: 'Acompanhar a sua\ntemperatura corporal basal',
    metaDuration: '6 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Intermédio',
    metaValidated: 'Conteúdo revisto',
    intro: 'Um método simples para confirmar, depois de ter acontecido, que houve ovulação.',
    contentsTitle: 'Neste artigo',
    topics: [
      'O que é a temperatura corporal basal?',
      'Quando e como medir',
      'Identificar a subida após a ovulação',
      'O que pode alterar uma medição',
      'Os limites deste método',
      'Quando falar com um profissional',
      'Pontos-chave',
    ],
    section1Body: 'A temperatura corporal basal é a temperatura do seu corpo em repouso completo, antes de qualquer atividade. Varia muito ligeiramente ao longo do ciclo, sob a influência das hormonas.',
    section2Body: 'Mede-se todas as manhãs, antes de se levantar, sempre à mesma hora e com o mesmo termómetro.',
    measuringTips: [
      {
        title: 'O mesmo termómetro',
        text: 'Use sempre o mesmo termómetro, idealmente um termómetro basal (mais preciso, ao décimo de grau).',
      },
      {
        title: 'A mesma hora',
        text: 'Meça a uma hora fixa, antes de se levantar, após pelo menos 3 horas de sono ininterrupto.',
      },
      {
        title: 'Anote logo',
        text: 'Anote o valor de imediato, antes mesmo de se levantar ou de falar.',
      },
    ],
    section3Body: 'A temperatura corporal basal sobe ligeiramente (0,2 a 0,5 °C) logo após a ovulação, por efeito da progesterona, e mantém-se mais elevada até ao período seguinte.',
    curveTitle: 'Como é o gráfico',
    curveText: 'Mais baixa na primeira parte do ciclo, sobe de patamar após a ovulação e mantém-se aí — um padrão que só se torna claro após vários dias de medições.',
    disruptingFactors: [
      'Uma noite de sono curta ou agitada',
      'Acordar a uma hora pouco habitual',
      'Febre ou doença',
      'Álcool na noite anterior',
      'Alteração recente de fuso horário',
    ],
    section5Body: 'Este não é um método preditivo, mas confirmativo: ajuda a compreender melhor o seu próprio ciclo, depois de a ovulação já ter acontecido — não a antecipá-la.',
    section5Caption: 'Observá-la apenas durante um ou dois ciclos geralmente não chega: o padrão revela-se com a repetição.',
    warningTitle: 'Convém falar com um profissional',
    consultSituations: [
      'Não surge nenhuma subida de temperatura ao longo de vários ciclos completos',
      'As temperaturas continuam muito irregulares apesar de uma medição cuidadosa',
      'Tem dúvidas sobre a sua fertilidade que este acompanhamento, por si só, não consegue esclarecer',
    ],
    tipTitle: 'Bom saber',
    tipText: 'Combinar a temperatura corporal basal com a observação do muco cervical ou com testes de ovulação dá uma imagem mais completa do seu ciclo.',
    summaryPoints: [
      'A temperatura corporal basal sobe ligeiramente (0,2 a 0,5 °C) logo após a ovulação, por efeito da progesterona.',
      'Mede-se todas as manhãs, antes de se levantar, sempre à mesma hora e com o mesmo termómetro.',
      'Este não é um método preditivo, mas confirmativo: ajuda a compreender melhor o seu próprio ciclo.',
      'Combiná-la com outros sinais (muco cervical, testes de ovulação) dá uma imagem mais completa.',
    ],
    disclaimerText: 'Conteúdo informativo. Este artigo não substitui o aconselhamento médico personalizado. Em caso de dúvida, peça orientação a um profissional de saúde.',
    shareMessage: 'Acompanhar a temperatura corporal basal — AWA',
  },
  bn: {
    badge: 'প্রজনন ক্ষমতা • বেসাল শরীরের তাপমাত্রা',
    title: 'আপনার বেসাল শরীরের\nতাপমাত্রা ট্র্যাক করা',
    metaDuration: 'পড়তে 6 মিনিট',
    metaType: 'গাইড',
    metaLevel: 'মধ্যম',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'ডিম্বস্ফোটন ঘটে গেছে কি না তা পরে নিশ্চিত করার একটি সহজ পদ্ধতি।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'বেসাল শরীরের তাপমাত্রা কী?',
      'কখন ও কীভাবে মাপবেন',
      'ডিম্বস্ফোটনের পর তাপমাত্রা বাড়া শনাক্ত করা',
      'যা পাঠকে বিভ্রান্ত করতে পারে',
      'এই পদ্ধতির সীমাবদ্ধতা',
      'কখন পেশাজীবীর সঙ্গে কথা বলবেন',
      'মূল কথা',
    ],
    section1Body: 'বেসাল শরীরের তাপমাত্রা হলো সম্পূর্ণ বিশ্রামে, কোনো কাজ শুরুর আগে আপনার শরীরের তাপমাত্রা। আপনার হরমোনের প্রভাবে চক্রের সময় এটি খুব সামান্য ওঠানামা করে।',
    section2Body: 'এটি প্রতিদিন সকালে, বিছানা থেকে ওঠার আগে, সবসময় একই সময়ে এবং একই থার্মোমিটার দিয়ে মাপা হয়।',
    measuringTips: [
      {
        title: 'একই থার্মোমিটার',
        text: 'সবসময় একই থার্মোমিটার ব্যবহার করুন, সম্ভব হলে বেসাল থার্মোমিটার (আরও নির্ভুল, দশমিক এক ডিগ্রি পর্যন্ত)।',
      },
      {
        title: 'একই সময়',
        text: 'নির্দিষ্ট সময়ে মাপুন, বিছানা থেকে ওঠার আগে, কমপক্ষে 3 ঘণ্টা বিরতিহীন ঘুমের পর।',
      },
      {
        title: 'সঙ্গে সঙ্গে লিখে রাখুন',
        text: 'ওঠার বা কথা বলার আগেই পাঠটি তখনই লিখে রাখুন।',
      },
    ],
    section3Body: 'প্রোজেস্টেরনের প্রভাবে ডিম্বস্ফোটনের ঠিক পরে বেসাল শরীরের তাপমাত্রা সামান্য বাড়ে (0.2 থেকে 0.5°C) এবং পরবর্তী মাসিক পর্যন্ত বেশি থাকে।',
    curveTitle: 'চার্ট দেখতে কেমন হয়',
    curveText: 'চক্রের প্রথম অংশে নিচু থাকে, ডিম্বস্ফোটনের পর ধাপে ধাপে উঠে সেখানেই থাকে — এই ধরনটি কয়েক দিনের পাঠের পরেই কেবল স্পষ্ট হয়।',
    disruptingFactors: [
      'স্বল্প বা অস্থির ঘুমের রাত',
      'অস্বাভাবিক সময়ে ঘুম থেকে ওঠা',
      'জ্বর বা অসুস্থতা',
      'আগের রাতে অ্যালকোহল',
      'সম্প্রতি জেট ল্যাগ',
    ],
    section5Body: 'এটি পূর্বাভাসের পদ্ধতি নয়, নিশ্চিতকরণের পদ্ধতি: ডিম্বস্ফোটন ঘটে যাওয়ার পর এটি আপনার নিজের চক্র আরও ভালোভাবে বুঝতে সাহায্য করে — আগেভাগে অনুমান করতে নয়।',
    section5Caption: 'এক বা দুই চক্র একা পর্যবেক্ষণ করা সাধারণত যথেষ্ট নয়: পুনরাবৃত্তির মাধ্যমেই ধরনটি ফুটে ওঠে।',
    warningTitle: 'পেশাজীবীকে জানানো ভালো',
    consultSituations: [
      'কয়েকটি সম্পূর্ণ চক্র ধরে তাপমাত্রা বাড়ার কোনো লক্ষণ দেখা যায় না',
      'সতর্কভাবে মাপার পরও তাপমাত্রা খুব অনিয়মিত থাকে',
      'আপনার প্রজনন ক্ষমতা নিয়ে এমন প্রশ্ন আছে যার উত্তর কেবল এই ট্র্যাকিং দিতে পারে না',
    ],
    tipTitle: 'জেনে রাখা ভালো',
    tipText: 'বেসাল শরীরের তাপমাত্রার সঙ্গে জরায়ুমুখের শ্লেষ্মা পর্যবেক্ষণ বা ডিম্বস্ফোটন পরীক্ষা একত্রে ব্যবহার করলে আপনার চক্রের আরও পূর্ণাঙ্গ চিত্র পাওয়া যায়।',
    summaryPoints: [
      'প্রোজেস্টেরনের প্রভাবে ডিম্বস্ফোটনের ঠিক পরে বেসাল শরীরের তাপমাত্রা সামান্য বাড়ে (0.2 থেকে 0.5°C)।',
      'এটি প্রতিদিন সকালে, বিছানা থেকে ওঠার আগে, সবসময় একই সময়ে এবং একই থার্মোমিটার দিয়ে মাপা হয়।',
      'এটি পূর্বাভাসের পদ্ধতি নয়, নিশ্চিতকরণের পদ্ধতি: এটি আপনার নিজের চক্র আরও ভালোভাবে বুঝতে সাহায্য করে।',
      'অন্যান্য লক্ষণের (জরায়ুমুখের শ্লেষ্মা, ডিম্বস্ফোটন পরীক্ষা) সঙ্গে একত্রে ব্যবহার করলে আরও পূর্ণাঙ্গ চিত্র পাওয়া যায়।',
    ],
    disclaimerText: 'তথ্যমূলক বিষয়বস্তু। এই নিবন্ধ ব্যক্তিগত চিকিৎসা পরামর্শের বিকল্প নয়। সন্দেহ থাকলে স্বাস্থ্যসেবা পেশাজীবীর পরামর্শ নিন।',
    shareMessage: 'বেসাল শরীরের তাপমাত্রা ট্র্যাক করা — AWA',
  },
  da: {
    badge: 'FERTILITET • BASALTEMPERATUR',
    title: 'Mål din\nbasaltemperatur',
    metaDuration: '6 min læsning',
    metaType: 'Guide',
    metaLevel: 'Mellem',
    metaValidated: 'Gennemgået indhold',
    intro: 'En enkel metode til bagefter at bekræfte, om ægløsning har fundet sted.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvad er basaltemperatur?',
      'Hvornår og hvordan måler du den',
      'Registrer temperaturstigning efter ægløsning',
      'Hvad kan forstyrre aflæsningerne',
      'Metodens begrænsninger',
      'Hvornår du bør tale med en fagperson',
      'Vigtige pointer',
    ],
    section1Body: 'Basaltemperatur er din kropstemperatur i fuldstændig hvile, inden du laver noget som helst. Den svinger meget lidt i løbet af din cyklus som følge af dine hormoner.',
    section2Body: 'Den måles hver morgen, inden du står op, altid på samme tidspunkt og med samme termometer.',
    measuringTips: [
      {
        title: 'Samme termometer',
        text: 'Brug altid det samme termometer, helst et basaltermometer (mere præcist, til en tiendedel af en grad).',
      },
      {
        title: 'Samme tidspunkt',
        text: 'Mål på et fast tidspunkt, inden du rejser dig, efter mindst 3 timers sammenhængende søvn.',
      },
      {
        title: 'Notér det med det samme',
        text: 'Skriv aflæsningen ned med det samme, inden du rejser dig eller taler.',
      },
    ],
    section3Body: 'Under påvirkning af progesteron stiger basaltemperaturen let (0,2 til 0,5°C) umiddelbart efter ægløsning og forbliver forhøjet frem til næste menstruation.',
    curveTitle: 'Sådan ser kurven ud',
    curveText: 'Lav i cyklussens første halvdel, så en gradvis stigning efter ægløsning, der holder sig — dette mønster bliver kun tydeligt over flere dages aflæsninger.',
    disruptingFactors: [
      'En nat med for lidt eller urolig søvn',
      'Opvågnen på et usædvanligt tidspunkt',
      'Feber eller sygdom',
      'Alkohol aftenen før',
      'Nylig jetlag',
    ],
    section5Body: 'Dette er en bekræftelsesmetode, ikke en forudsigelsesmetode: den hjælper dig med at forstå din egen cyklus bedre efter ægløsningen er sket — ikke til at forudsige den på forhånd.',
    section5Caption: 'At observere én eller to cyklusser alene er normalt ikke nok: mønsteret viser sig ved gentagelse.',
    warningTitle: 'Det er en god idé at konsultere en fagperson',
    consultSituations: [
      'Ingen tegn på temperaturstigning i løbet af flere fulde cyklusser',
      'Temperaturen forbliver meget uregelmæssig på trods af omhyggelig måling',
      'Du har spørgsmål om din fertilitet, som denne registrering alene ikke kan besvare',
    ],
    tipTitle: 'Godt at vide',
    tipText: 'At kombinere basaltemperatur med observation af livmoderhalssekret eller ægløsningstests giver et mere fuldstændigt billede af din cyklus.',
    summaryPoints: [
      'Under påvirkning af progesteron stiger basaltemperaturen let (0,2 til 0,5°C) umiddelbart efter ægløsning.',
      'Den måles hver morgen, inden du rejser dig, altid på samme tidspunkt og med samme termometer.',
      'Dette er en bekræftelsesmetode, ikke en forudsigelsesmetode: den hjælper dig med at forstå din cyklus bedre.',
      'Kombineret med andre tegn (livmoderhalssekret, ægløsningstests) giver den et mere fuldstændigt billede.',
    ],
    disclaimerText: 'Informativt indhold. Denne artikel er ikke en erstatning for personlig medicinsk rådgivning. Kontakt en sundhedsfaglig person, hvis du er i tvivl.',
    shareMessage: 'Mål din basaltemperatur — AWA',
  },
  sv: {
    badge: 'FERTILITET • BASALTEMPERATUR',
    title: 'Mål din\nbasaltemperatur',
    metaDuration: '6 min läsning',
    metaType: 'Guide',
    metaLevel: 'Mellem',
    metaValidated: 'Gennemgået indhold',
    intro: 'En enkel metode till bagefter at bekräfte, om äglösning har fundet sted.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvad ar basaltemperatur?',
      'Hvornår och hvordan måler du den',
      'Registrer temperaturstigning efter äglösning',
      'Hvad kan forstyrre afläsningerne',
      'Metodens begränsninger',
      'Hvornår du bör tale med en fagperson',
      'Vigtige pointer',
    ],
    section1Body: 'Basaltemperatur ar din kropstemperatur i fuldständig hvile, inden du laver noget som helst. Den svinger mycket lite i löbet av din cyklus som fölge av dina hormoner.',
    section2Body: 'Den måles hver morgen, inden du står op, alltid på samme tidspunkt och med samme termometer.',
    measuringTips: [
      {
        title: 'Samme termometer',
        text: 'Brug alltid det samme termometer, helst et basaltermometer (mere präcist, till en tiendedel av en grad).',
      },
      {
        title: 'Samme tidspunkt',
        text: 'Mål på et fast tidspunkt, inden du rejser dig, efter mindst 3 timers sammenhängende sövn.',
      },
      {
        title: 'Notér det med det samme',
        text: 'Skriv afläsningen ned med det samme, inden du rejser dig eller taler.',
      },
    ],
    section3Body: 'Under påvirkning av progesteron stiger basaltemperaturen let (0,2 till 0,5°C) umiddelbart efter äglösning och forbliver forhöjet frem till näste menstruation.',
    curveTitle: 'Sådan ser kurven ud',
    curveText: 'Lav i cyklussens förste halvdel, så en gradvis stigning efter äglösning, der holder sig — dette mönster bliver kun tydeligt over flere dages afläsninger.',
    disruptingFactors: [
      'En nat med for lite eller urolig sövn',
      'Opvågnen på et usädvanligt tidspunkt',
      'Feber eller sygdom',
      'Alkohol aftenen för',
      'Nylig jetlag',
    ],
    section5Body: 'Dette ar en bekräftelsesmetode, inte en forudsigelsesmetode: den hjälper dig med at forstå din egen cyklus bedre efter äglösningen ar sket — inte till at forudsige den på forhånd.',
    section5Caption: 'At observere én eller to cyklusser alene ar normalt inte nok: mönsteret viser sig ved gentagelse.',
    warningTitle: 'Det ar en god idé at konsultere en fagperson',
    consultSituations: [
      'Ingen tegn på temperaturstigning i löbet av flere fulde cyklusser',
      'Temperaturen forbliver mycket uregelmässig på trods av omhyggelig måling',
      'Du har spörgsmål om din fertilitet, som denne registrering alene inte kan besvare',
    ],
    tipTitle: 'Godt at vide',
    tipText: 'At kombinere basaltemperatur med observation av livmoderhalssekret eller äglösningstests giver et mere fuldständigt billede av din cyklus.',
    summaryPoints: [
      'Under påvirkning av progesteron stiger basaltemperaturen let (0,2 till 0,5°C) umiddelbart efter äglösning.',
      'Den måles hver morgen, inden du rejser dig, alltid på samme tidspunkt och med samme termometer.',
      'Dette ar en bekräftelsesmetode, inte en forudsigelsesmetode: den hjälper dig med at forstå din cyklus bedre.',
      'Kombineret med andre tegn (livmoderhalssekret, äglösningstests) giver den et mere fuldständigt billede.',
    ],
    disclaimerText: 'Informativt indhold. Denne artikel ar inte en erstatning for personlig medicinsk rådgivning. Kontakt en halsasfaglig person, hvis du ar i tvivl.',
    shareMessage: 'Mål din basaltemperatur — AWA',
  },
  nb: {
    badge: 'FRUKTBARHET • BASALTEMPERATUR',
    title: 'Følge\nbasaltemperaturen din',
    metaDuration: '6 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Middels',
    metaValidated: 'Gjennomgått innhold',
    intro: 'En enkel metode for å bekrefte i ettertid at eggløsningen har funnet sted.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Hva er basaltemperatur?',
      'Når og hvordan du måler den',
      'Oppdage stigningen etter eggløsningen',
      'Hva som kan forstyrre en måling',
      'Metodens begrensninger',
      'Når du bør snakke med helsepersonell',
      'Det viktigste å huske',
    ],
    section1Body: 'Basaltemperatur er kroppstemperaturen din i full hvile, før all aktivitet. Den varierer helt svakt gjennom syklusen, under påvirkning av hormonene dine.',
    section2Body: 'Den måles hver morgen, før du står opp, alltid til samme tid og med samme termometer.',
    measuringTips: [
      {title: 'Samme termometer', text: 'Bruk alltid samme termometer, helst et basaltermometer (mer nøyaktig, med tiendedels grad).'},
      {title: 'Samme tidspunkt', text: 'Mål til et fast tidspunkt, før du står opp, etter minst 3 timers uavbrutt søvn.'},
      {title: 'Skriv det ned med en gang', text: 'Noter målingen umiddelbart, før du så mye som står opp eller snakker.'},
    ],
    section3Body: 'Basaltemperaturen stiger litt (0,2 til 0,5 °C) rett etter eggløsningen, under påvirkning av progesteron, og holder seg høyere frem til neste mens.',
    curveTitle: 'Hvordan kurven ser ut',
    curveText: 'Lavere i første del av syklusen, stiger den et trinn etter eggløsningen og holder seg der – et mønster som først blir tydelig etter flere dagers målinger.',
    disruptingFactors: [
      'En kort eller urolig natts søvn',
      'Å våkne på et uvanlig tidspunkt',
      'Feber eller sykdom',
      'Alkohol kvelden før',
      'Nylig jetlag',
    ],
    section5Body: 'Dette er ikke en forutsigende metode, men en bekreftende: den hjelper deg å forstå din egen syklus bedre, etter at eggløsningen allerede har skjedd – ikke å forutse den.',
    section5Caption: 'Å observere den alene over én eller to sykluser er vanligvis ikke nok: mønsteret trer frem med gjentakelse.',
    warningTitle: 'Verdt å nevne for helsepersonell',
    consultSituations: [
      'Ingen temperaturstigning viser seg over flere hele sykluser',
      'Temperaturene forblir svært uregelmessige til tross for nøye måling',
      'Du har spørsmål om fruktbarheten din som denne sporingen alene ikke kan svare på',
    ],
    tipTitle: 'Godt å vite',
    tipText: 'Å kombinere basaltemperatur med observasjon av livmorhalsslim eller eggløsningstester gir et mer fullstendig bilde av syklusen din.',
    summaryPoints: [
      'Basaltemperaturen stiger litt (0,2 til 0,5 °C) rett etter eggløsningen, under påvirkning av progesteron.',
      'Den måles hver morgen, før du står opp, alltid til samme tid og med samme termometer.',
      'Dette er ikke en forutsigende metode, men en bekreftende: den hjelper deg å forstå din egen syklus bedre.',
      'Å kombinere den med andre tegn (livmorhalsslim, eggløsningstester) gir et mer fullstendig bilde.',
    ],
    disclaimerText: 'Informasjonsinnhold. Denne artikkelen erstatter ikke personlig medisinsk rådgivning. Ved tvil bør du be helsepersonell om veiledning.',
    shareMessage: 'Følge basaltemperaturen – AWA',
  },
  pl: {
    badge: 'PŁODNOŚĆ • PODSTAWOWA TEMPERATURA CIAŁA',
    title: 'Śledzenie podstawowej\ntemperatury ciała',
    metaDuration: '6 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Średnio zaawansowany',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Prosta metoda, która pozwala po fakcie potwierdzić, że owulacja nastąpiła.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Czym jest podstawowa temperatura ciała?',
      'Kiedy i jak ją mierzyć',
      'Rozpoznawanie wzrostu po owulacji',
      'Co może zaburzyć pomiar',
      'Ograniczenia tej metody',
      'Kiedy porozmawiać ze specjalistą',
      'Najważniejsze wnioski',
    ],
    section1Body: 'Podstawowa temperatura ciała to temperatura Twojego ciała w całkowitym spoczynku, przed jakąkolwiek aktywnością. Zmienia się bardzo nieznacznie w trakcie cyklu pod wpływem hormonów.',
    section2Body: 'Mierzy się ją każdego ranka, przed wstaniem z łóżka, zawsze o tej samej porze i tym samym termometrem.',
    measuringTips: [
      {title: 'Ten sam termometr', text: 'Zawsze używaj tego samego termometru, najlepiej termometru do pomiaru podstawowej temperatury (dokładniejszego, z dokładnością do jednej dziesiątej stopnia).'},
      {title: 'Ta sama pora', text: 'Mierz o stałej porze, przed wstaniem, po co najmniej 3 godzinach nieprzerwanego snu.'},
      {title: 'Zapisz od razu', text: 'Zapisz wynik natychmiast, jeszcze przed wstaniem i rozmową.'},
    ],
    section3Body: 'Podstawowa temperatura ciała wzrasta nieznacznie (o 0,2 do 0,5°C) tuż po owulacji pod wpływem progesteronu i utrzymuje się na wyższym poziomie do następnej miesiączki.',
    curveTitle: 'Jak wygląda wykres',
    curveText: 'Niższa w pierwszej części cyklu, po owulacji skokowo wzrasta i tak pozostaje — wzorzec, który staje się wyraźny dopiero po kilku dniach pomiarów.',
    disruptingFactors: [
      'Krótka lub niespokojna noc',
      'Przebudzenie o nietypowej porze',
      'Gorączka lub choroba',
      'Alkohol poprzedniego wieczoru',
      'Niedawna zmiana strefy czasowej',
    ],
    section5Body: 'To nie jest metoda przewidująca, lecz potwierdzająca: pomaga lepiej zrozumieć własny cykl, gdy owulacja już nastąpiła — a nie ją przewidzieć.',
    section5Caption: 'Obserwacja przez jeden lub dwa cykle zwykle nie wystarcza: wzorzec ujawnia się dopiero przy powtarzaniu.',
    warningTitle: 'Warto wspomnieć specjaliście',
    consultSituations: [
      'Przez kilka pełnych cykli nie pojawia się wzrost temperatury',
      'Temperatury pozostają bardzo nieregularne mimo starannych pomiarów',
      'Masz pytania o swoją płodność, na które samo to śledzenie nie odpowie',
    ],
    tipTitle: 'Warto wiedzieć',
    tipText: 'Połączenie podstawowej temperatury ciała z obserwacją śluzu szyjkowego lub testami owulacyjnymi daje pełniejszy obraz Twojego cyklu.',
    summaryPoints: [
      'Podstawowa temperatura ciała wzrasta nieznacznie (o 0,2 do 0,5°C) tuż po owulacji pod wpływem progesteronu.',
      'Mierzy się ją każdego ranka, przed wstaniem, zawsze o tej samej porze i tym samym termometrem.',
      'To nie jest metoda przewidująca, lecz potwierdzająca: pomaga lepiej zrozumieć własny cykl.',
      'Połączenie jej z innymi objawami (śluz szyjkowy, testy owulacyjne) daje pełniejszy obraz.',
    ],
    disclaimerText: 'Treść informacyjna. Ten artykuł nie zastępuje spersonalizowanej porady medycznej. W razie wątpliwości zasięgnij porady specjalisty.',
    shareMessage: 'Śledzenie podstawowej temperatury ciała — AWA',
  },
  uk: {
    badge: 'ФЕРТИЛЬНІСТЬ • БАЗАЛЬНА ТЕМПЕРАТУРА ТІЛА',
    title: 'Відстеження\nбазальної температури тіла',
    metaDuration: '6 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Середній',
    metaValidated: 'Перевірений вміст',
    intro: 'Простий метод, що дозволяє постфактум підтвердити, що овуляція відбулася.',
    contentsTitle: 'У цій статті',
    topics: [
      'Що таке базальна температура тіла?',
      'Коли і як її вимірювати',
      'Розпізнавання підвищення після овуляції',
      'Що може спотворити вимір',
      'Обмеження цього методу',
      'Коли поговорити зі спеціалістом',
      'Головні висновки',
    ],
    section1Body: 'Базальна температура тіла — це температура вашого тіла в повному спокої, перед будь-якою активністю. Вона дуже незначно змінюється протягом циклу під впливом гормонів.',
    section2Body: 'Її вимірюють щоранку, перш ніж вставати, завжди в один і той самий час і одним і тим самим термометром.',
    measuringTips: [
      {title: 'Той самий термометр', text: 'Завжди користуйтеся одним термометром, бажано базальним (точнішим, до десятої частки градуса).'},
      {title: 'Той самий час', text: 'Вимірюйте в сталий час, перш ніж вставати, після щонайменше 3 годин безперервного сну.'},
      {title: 'Записуйте одразу', text: 'Записуйте результат негайно, ще до того, як встати або заговорити.'},
    ],
    section3Body: 'Базальна температура тіла незначно підвищується (на 0,2–0,5°C) одразу після овуляції під дією прогестерону й залишається вищою до наступної менструації.',
    curveTitle: 'Як виглядає графік',
    curveText: 'Нижча в першій частині циклу, після овуляції вона сходинкою підвищується й залишається такою — закономірність, яка стає чіткою лише після кількох днів вимірів.',
    disruptingFactors: [
      'Короткий або неспокійний нічний сон',
      'Пробудження в незвичний час',
      'Гарячка чи хвороба',
      'Алкоголь напередодні ввечері',
      'Нещодавня зміна часових поясів',
    ],
    section5Body: 'Це не прогнозувальний, а підтверджувальний метод: він допомагає краще зрозуміти власний цикл після того, як овуляція вже відбулася, — а не передбачити її.',
    section5Caption: 'Спостереження самостійно протягом одного-двох циклів зазвичай недостатньо: закономірність проявляється з повторенням.',
    warningTitle: 'Варто згадати спеціалісту',
    consultSituations: [
      'Підвищення температури не з’являється протягом кількох повних циклів',
      'Температури залишаються дуже нерегулярними попри ретельні виміри',
      'У вас є запитання щодо фертильності, на які це відстеження саме не відповість',
    ],
    tipTitle: 'Варто знати',
    tipText: 'Поєднання базальної температури тіла зі спостереженням за цервікальним слизом або овуляційними тестами дає повнішу картину вашого циклу.',
    summaryPoints: [
      'Базальна температура тіла незначно підвищується (на 0,2–0,5°C) одразу після овуляції під дією прогестерону.',
      'Її вимірюють щоранку, перш ніж вставати, завжди в один і той самий час і одним термометром.',
      'Це не прогнозувальний, а підтверджувальний метод: він допомагає краще зрозуміти власний цикл.',
      'Поєднання з іншими ознаками (цервікальний слиз, овуляційні тести) дає повнішу картину.',
    ],
    disclaimerText: 'Інформаційний вміст. Ця стаття не замінює персоналізованої медичної поради. У разі сумнівів зверніться до медичного фахівця.',
    shareMessage: 'Відстеження базальної температури тіла — AWA',
  },
  cs: {
    badge: 'PLODNOST • BAZÁLNÍ TĚLESNÁ TEPLOTA',
    title: 'Sledování\nbazální tělesné teploty',
    metaDuration: '6 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Pokročilý',
    metaValidated: 'Ověřený obsah',
    intro: 'Jednoduchá metoda, jak dodatečně potvrdit, že proběhla ovulace.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Co je bazální tělesná teplota?',
      'Kdy a jak ji měřit',
      'Rozpoznání vzestupu po ovulaci',
      'Co může měření zkreslit',
      'Limity této metody',
      'Kdy se obrátit na odborníka',
      'Hlavní poznatky',
    ],
    section1Body: 'Bazální tělesná teplota je teplota vašeho těla v úplném klidu, před jakoukoli aktivitou. Pod vlivem hormonů se v průběhu cyklu velmi mírně mění.',
    section2Body: 'Měří se každé ráno, před vstáváním, vždy ve stejnou dobu a stejným teploměrem.',
    measuringTips: [
      {title: 'Stejný teploměr', text: 'Vždy používejte stejný teploměr, ideálně bazální (přesnější, na desetinu stupně).'},
      {title: 'Stejná doba', text: 'Měřte v pevně stanovenou dobu, před vstáváním, po alespoň 3 hodinách nepřerušovaného spánku.'},
      {title: 'Hned si to zapište', text: 'Hodnotu si zapište okamžitě, ještě než vstanete nebo promluvíte.'},
    ],
    section3Body: 'Bazální tělesná teplota se těsně po ovulaci vlivem progesteronu mírně zvýší (o 0,2 až 0,5 °C) a zůstává vyšší až do další menstruace.',
    curveTitle: 'Jak graf vypadá',
    curveText: 'V první části cyklu je nižší, po ovulaci skokově vzroste a zůstává na této úrovni — vzorec je zřetelný až po několika dnech měření.',
    disruptingFactors: [
      'Krátký nebo neklidný spánek',
      'Probuzení v neobvyklou dobu',
      'Horečka nebo nemoc',
      'Alkohol předchozí večer',
      'Nedávný posun časových pásem',
    ],
    section5Body: 'Nejde o prediktivní metodu, ale o potvrzující: pomáhá vám lépe porozumět vlastnímu cyklu poté, co ovulace již proběhla — nikoli ji předvídat.',
    section5Caption: 'Samotné pozorování během jednoho či dvou cyklů obvykle nestačí: vzorec se ukáže opakováním.',
    warningTitle: 'Stojí za to zmínit odborníkovi',
    consultSituations: [
      'Během několika celých cyklů se neobjeví žádný vzestup teploty',
      'Teploty zůstávají i při pečlivém měření velmi nepravidelné',
      'Máte otázky ohledně plodnosti, na které toto sledování samo odpovědět nemůže',
    ],
    tipTitle: 'Stojí za to vědět',
    tipText: 'Spojení bazální tělesné teploty s pozorováním cervikálního hlenu nebo ovulačními testy poskytuje úplnější obraz o vašem cyklu.',
    summaryPoints: [
      'Bazální tělesná teplota se těsně po ovulaci vlivem progesteronu mírně zvýší (o 0,2 až 0,5 °C).',
      'Měří se každé ráno, před vstáváním, vždy ve stejnou dobu a stejným teploměrem.',
      'Nejde o prediktivní metodu, ale o potvrzující: pomáhá lépe porozumět vlastnímu cyklu.',
      'Spojení s dalšími příznaky (cervikální hlen, ovulační testy) poskytuje úplnější obraz.',
    ],
    disclaimerText: 'Informativní obsah. Tento článek nenahrazuje individuální lékařskou radu. V případě pochybností požádejte o radu zdravotnického pracovníka.',
    shareMessage: 'Sledování bazální tělesné teploty — AWA',
  },
  sk: {
    badge: 'PLODNOSŤ • BAZÁLNA TELESNÁ TEPLOTA',
    title: 'Sledovanie\nbazálnej telesnej teploty',
    metaDuration: '6 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Stredne pokročilý',
    metaValidated: 'Overený obsah',
    intro: 'Jednoduchá metóda, ktorá dodatočne potvrdí, že došlo k ovulácii.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Čo je bazálna telesná teplota?',
      'Kedy a ako ju merať',
      'Rozpoznanie vzostupu po ovulácii',
      'Čo môže merania skresliť',
      'Limity tejto metódy',
      'Kedy sa poradiť s odborníkom',
      'Hlavné body',
    ],
    section1Body: 'Bazálna telesná teplota je teplota vášho tela v úplnom pokoji, pred akoukoľvek aktivitou. Počas cyklu sa pod vplyvom hormónov veľmi mierne mení.',
    section2Body: 'Meria sa každé ráno pred vstávaním, vždy v rovnakom čase a rovnakým teplomerom.',
    measuringTips: [
      {title: 'Rovnaký teplomer', text: 'Používajte stále ten istý teplomer, ideálne bazálny (presnejší, na desatinu stupňa).'},
      {title: 'Rovnaký čas', text: 'Merajte v pevne stanovenom čase, pred vstávaním, po aspoň 3 hodinách neprerušovaného spánku.'},
      {title: 'Zapíšte si to hneď', text: 'Hodnotu si zapíšte okamžite, ešte skôr, než vstanete alebo sa s niekým porozprávate.'},
    ],
    section3Body: 'Bazálna telesná teplota mierne stúpne (o 0,2 až 0,5 °C) hneď po ovulácii pod vplyvom progesterónu a zostáva vyššia až do ďalšej menštruácie.',
    curveTitle: 'Ako vyzerá graf',
    curveText: 'V prvej časti cyklu je nižšia, po ovulácii stúpne a zostane vyššie — tento vzor sa ukáže až po niekoľkých dňoch meraní.',
    disruptingFactors: [
      'Krátky alebo nepokojný spánok',
      'Zobudenie v nezvyčajnom čase',
      'Horúčka alebo choroba',
      'Alkohol predchádzajúci večer',
      'Nedávny posun časových pásiem',
    ],
    section5Body: 'Nie je to predikčná, ale potvrdzujúca metóda: pomáha vám lepšie pochopiť vlastný cyklus po tom, čo už k ovulácii došlo — nie ju predvídať.',
    section5Caption: 'Samotné sledovanie počas jedného alebo dvoch cyklov zvyčajne nestačí: vzor sa ukáže opakovaním.',
    warningTitle: 'Stojí za to spomenúť odborníkovi',
    consultSituations: [
      'Počas niekoľkých úplných cyklov sa neobjaví žiadny vzostup teploty',
      'Teploty zostávajú veľmi nepravidelné napriek starostlivému meraniu',
      'Máte otázky o svojej plodnosti, na ktoré toto sledovanie samo nedokáže odpovedať',
    ],
    tipTitle: 'Stojí za to vedieť',
    tipText: 'Kombinácia bazálnej telesnej teploty so sledovaním cervikálneho hlienu alebo ovulačných testov poskytuje úplnejší obraz o vašom cykle.',
    summaryPoints: [
      'Bazálna telesná teplota mierne stúpne (o 0,2 až 0,5 °C) hneď po ovulácii pod vplyvom progesterónu.',
      'Meria sa každé ráno pred vstávaním, vždy v rovnakom čase a rovnakým teplomerom.',
      'Nie je to predikčná, ale potvrdzujúca metóda: pomáha vám lepšie pochopiť vlastný cyklus.',
      'Kombinácia s ďalšími znakmi (cervikálny hlien, ovulačné testy) poskytuje úplnejší obraz.',
    ],
    disclaimerText: 'Informatívny obsah. Tento článok nenahrádza individuálnu lekársku radu. V prípade pochybností sa poraďte so zdravotníckym pracovníkom.',
    shareMessage: 'Sledovanie bazálnej telesnej teploty — AWA',
  },
  hu: {
    badge: 'TERMÉKENYSÉG • ALAPVETŐ TESTHŐMÉRSÉKLET',
    title: 'Az alapvető testhőmérséklet\nkövetése',
    metaDuration: '6 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Középhaladó',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'Egyszerű módszer annak utólagos megerősítésére, hogy megtörtént a peteérés.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Mi az alapvető testhőmérséklet?',
      'Mikor és hogyan mérd',
      'A peteérés utáni emelkedés felismerése',
      'Mi torzíthatja a mérést',
      'A módszer korlátai',
      'Mikor érdemes szakemberhez fordulni',
      'Legfontosabb tudnivalók',
    ],
    section1Body: 'Az alapvető testhőmérséklet a tested hőmérséklete teljes nyugalomban, bármilyen tevékenység előtt. A ciklus során a hormonjaid hatására nagyon kis mértékben változik.',
    section2Body: 'Minden reggel, felkelés előtt mérik, mindig ugyanabban az időpontban és ugyanazzal a hőmérővel.',
    measuringTips: [
      {title: 'Ugyanaz a hőmérő', text: 'Mindig ugyanazt a hőmérőt használd, lehetőleg alapvető testhőmérséklet mérésére szolgálót (pontosabb, tized fokra).'},
      {title: 'Ugyanaz az időpont', text: 'Fix időpontban mérj, felkelés előtt, legalább 3 óra megszakítás nélküli alvás után.'},
      {title: 'Azonnal jegyezd fel', text: 'Az értéket azonnal írd le, még mielőtt felkelnél vagy megszólalnál.'},
    ],
    section3Body: 'Az alapvető testhőmérséklet a peteérés után közvetlenül kissé (0,2–0,5 °C-kal) megemelkedik a progeszteron hatására, és a következő menstruációig magasabb marad.',
    curveTitle: 'Hogyan néz ki a diagram',
    curveText: 'A ciklus első részében alacsonyabb, a peteérés után lépcsőszerűen megemelkedik, és ott marad — ez a minta csak több napnyi mérés után válik világossá.',
    disruptingFactors: [
      'Rövid vagy nyugtalan alvás',
      'Szokatlan időpontban ébredés',
      'Láz vagy betegség',
      'Alkohol előző este',
      'Közelmúltbeli időeltolódás',
    ],
    section5Body: 'Ez nem előrejelző, hanem megerősítő módszer: segít jobban megérteni a saját ciklusodat, miután a peteérés már megtörtént — nem pedig megjósolni azt.',
    section5Caption: 'Egy-két ciklus megfigyelése önmagában általában nem elég: a minta az ismétlődés során rajzolódik ki.',
    warningTitle: 'Érdemes szakembernek jelezni',
    consultSituations: [
      'Több teljes cikluson át sem jelentkezik hőmérséklet-emelkedés',
      'A hőmérséklet gondos mérés ellenére is nagyon szabálytalan marad',
      'Kérdéseid vannak a termékenységeddel kapcsolatban, amelyekre ez a követés önmagában nem tud válaszolni',
    ],
    tipTitle: 'Érdemes tudni',
    tipText: 'Az alapvető testhőmérséklet kombinálása a méhnyaknyálka megfigyelésével vagy a peteérési tesztekkel teljesebb képet ad a ciklusodról.',
    summaryPoints: [
      'Az alapvető testhőmérséklet a peteérés után közvetlenül kissé (0,2–0,5 °C-kal) megemelkedik a progeszteron hatására.',
      'Minden reggel, felkelés előtt mérik, mindig ugyanabban az időpontban és ugyanazzal a hőmérővel.',
      'Ez nem előrejelző, hanem megerősítő módszer: segít jobban megérteni a saját ciklusodat.',
      'Más jelekkel (méhnyaknyálka, peteérési tesztek) kombinálva teljesebb képet ad.',
    ],
    disclaimerText: 'Tájékoztató jellegű tartalom. Ez a cikk nem helyettesíti a személyre szabott orvosi tanácsot. Kétség esetén kérj útmutatást egészségügyi szakembertől.',
    shareMessage: 'Az alapvető testhőmérséklet követése — AWA',
  },
  ro: {
    badge: 'FERTILITATE • TEMPERATURA BAZALĂ',
    title: 'Urmărirea\ntemperaturii bazale',
    metaDuration: '6 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Intermediar',
    metaValidated: 'Conținut revizuit',
    intro: 'O metodă simplă pentru a confirma, după ce s-a întâmplat, că a avut loc ovulația.',
    contentsTitle: 'În acest articol',
    topics: [
      'Ce este temperatura bazală?',
      'Când și cum se măsoară',
      'Recunoașterea creșterii de după ovulație',
      'Ce poate distorsiona o măsurătoare',
      'Limitele acestei metode',
      'Când să vorbești cu un profesionist',
      'Ce să reții',
    ],
    section1Body: 'Temperatura bazală este temperatura corpului tău în repaus complet, înainte de orice activitate. Ea variază foarte puțin pe parcursul ciclului, sub influența hormonilor.',
    section2Body: 'Se măsoară în fiecare dimineață, înainte de a te da jos din pat, mereu la aceeași oră și cu același termometru.',
    measuringTips: [
      {title: 'Același termometru', text: 'Folosește mereu același termometru, ideal unul bazal (mai precis, la zecimi de grad).'},
      {title: 'Aceeași oră', text: 'Măsoară la o oră fixă, înainte de a te da jos din pat, după cel puțin 3 ore de somn neîntrerupt.'},
      {title: 'Notează imediat', text: 'Notează valoarea imediat, înainte de a te ridica sau de a vorbi.'},
    ],
    section3Body: 'Temperatura bazală crește ușor (cu 0,2 până la 0,5 °C) imediat după ovulație, sub efectul progesteronului, și rămâne mai ridicată până la următoarea menstruație.',
    curveTitle: 'Cum arată graficul',
    curveText: 'Mai scăzută în prima parte a ciclului, temperatura urcă în trepte după ovulație și rămâne acolo — un tipar care devine clar abia după câteva zile de măsurători.',
    disruptingFactors: [
      'O noapte scurtă sau agitată',
      'Trezirea la o oră neobișnuită',
      'Febră sau boală',
      'Alcool în seara precedentă',
      'Decalaj orar recent',
    ],
    section5Body: 'Aceasta nu este o metodă predictivă, ci una de confirmare: te ajută să-ți înțelegi mai bine propriul ciclu, după ce ovulația a avut deja loc — nu să o anticipezi.',
    section5Caption: 'Observarea ei singură timp de unul sau două cicluri nu este de obicei suficientă: tiparul apare prin repetiție.',
    warningTitle: 'Merită menționat unui profesionist',
    consultSituations: [
      'Nu apare nicio creștere a temperaturii pe parcursul mai multor cicluri complete',
      'Temperaturile rămân foarte neregulate în ciuda unei măsurători atente',
      'Ai întrebări despre fertilitatea ta la care această monitorizare singură nu poate răspunde',
    ],
    tipTitle: 'Bine de știut',
    tipText: 'Combinarea temperaturii bazale cu observarea mucusului cervical sau cu testele de ovulație oferă o imagine mai completă a ciclului tău.',
    summaryPoints: [
      'Temperatura bazală crește ușor (cu 0,2 până la 0,5 °C) imediat după ovulație, sub efectul progesteronului.',
      'Se măsoară în fiecare dimineață, înainte de a te da jos din pat, mereu la aceeași oră și cu același termometru.',
      'Aceasta nu este o metodă predictivă, ci una de confirmare: te ajută să-ți înțelegi mai bine propriul ciclu.',
      'Combinarea ei cu alte semne (mucus cervical, teste de ovulație) oferă o imagine mai completă.',
    ],
    disclaimerText: 'Conținut cu caracter informativ. Acest articol nu înlocuiește sfatul medical personalizat. Dacă ai îndoieli, cere îndrumare unui profesionist din domeniul sănătății.',
    shareMessage: 'Urmărirea temperaturii bazale — AWA',
  },
  bg: {
    badge: 'ПЛОДОВИТОСТ • БАЗАЛНА ТЕМПЕРАТУРА',
    title: 'Проследяване на\nбазалната температура',
    metaDuration: '6 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Средно ниво',
    metaValidated: 'Проверено съдържание',
    intro: 'Прост метод да потвърдиш, след като се е случило, че овулацията е настъпила.',
    contentsTitle: 'В тази статия',
    topics: [
      'Какво е базалната температура?',
      'Кога и как се измерва',
      'Разпознаване на покачването след овулация',
      'Какво може да изкриви измерването',
      'Границите на този метод',
      'Кога да поговориш със специалист',
      'Какво да запомниш',
    ],
    section1Body: 'Базалната температура е температурата на тялото ти в пълна почивка, преди каквато и да е активност. Тя варира съвсем леко през цикъла, под влияние на хормоните ти.',
    section2Body: 'Измерва се всяка сутрин, преди да станеш от леглото, винаги по едно и също време и със същия термометър.',
    measuringTips: [
      {title: 'Същият термометър', text: 'Използвай винаги един и същи термометър, по възможност базален (по-точен, до десета от градуса).'},
      {title: 'Същият час', text: 'Измервай в определен час, преди да станеш, след поне 3 часа непрекъснат сън.'},
      {title: 'Запиши веднага', text: 'Запиши стойността веднага, преди дори да станеш или да заговориш.'},
    ],
    section3Body: 'Базалната температура се покачва леко (с 0,2 до 0,5 °C) веднага след овулацията, под действието на прогестерона, и остава по-висока до следващата менструация.',
    curveTitle: 'Как изглежда графиката',
    curveText: 'По-ниска в първата част на цикъла, температурата се покачва стъпаловидно след овулацията и остава там — модел, който става ясен едва след няколко дни измервания.',
    disruptingFactors: [
      'Кратка или неспокойна нощ',
      'Събуждане в необичаен час',
      'Температура или болест',
      'Алкохол предната вечер',
      'Скорошна смяна на часовата зона',
    ],
    section5Body: 'Това не е предсказателен метод, а потвърждаващ: помага ти да разбереш по-добре собствения си цикъл, след като овулацията вече е настъпила — а не да я предвидиш.',
    section5Caption: 'Наблюдението само през един или два цикъла обикновено не е достатъчно: моделът се появява с повторение.',
    warningTitle: 'Заслужава да се спомене на специалист',
    consultSituations: [
      'Не се появява покачване на температурата в продължение на няколко пълни цикъла',
      'Температурите остават много нередовни въпреки внимателното измерване',
      'Имаш въпроси за плодовитостта си, на които това проследяване само не може да отговори',
    ],
    tipTitle: 'Добре е да знаеш',
    tipText: 'Комбинирането на базалната температура с наблюдение на цервикалната слуз или с тестове за овулация дава по-пълна картина на цикъла ти.',
    summaryPoints: [
      'Базалната температура се покачва леко (с 0,2 до 0,5 °C) веднага след овулацията, под действието на прогестерона.',
      'Измерва се всяка сутрин, преди да станеш от леглото, винаги по едно и също време и със същия термометър.',
      'Това не е предсказателен метод, а потвърждаващ: помага ти да разбереш по-добре собствения си цикъл.',
      'Комбинирането ѝ с други признаци (цервикална слуз, тестове за овулация) дава по-пълна картина.',
    ],
    disclaimerText: 'Информационно съдържание. Тази статия не замества персонализирания медицински съвет. При съмнение поискай насоки от здравен специалист.',
    shareMessage: 'Проследяване на базалната температура — AWA',
  },
  sr: {
    badge: 'ПЛОДНОСТ • БАЗАЛНА ТЕЛЕСНА ТЕМПЕРАТУРА',
    title: 'Праћење твоје\nбазалне телесне температуре',
    metaDuration: '6 мин читања',
    metaType: 'Водич',
    metaLevel: 'Средњи ниво',
    metaValidated: 'Проверен садржај',
    intro: 'Једноставан метод да накнадно потврдиш да је овулација настала.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Шта је базална телесна температура?',
      'Када и како је мерити',
      'Препознавање пораста после овулације',
      'Шта може изобличити мерење',
      'Ограничења овог метода',
      'Када разговарати са стручњаком',
      'Шта да запамтиш',
    ],
    section1Body: 'Базална телесна температура је температура твог тела у потпуном мировању, пре сваке активности. Веома мало варира током циклуса, под утицајем твојих хормона.',
    section2Body: 'Мери се сваког јутра, пре устајања, увек у исто време и истим термометром.',
    measuringTips: [
      {title: 'Исти термометар', text: 'Увек користи исти термометар, по могућству базални (прецизнији, до десетине степена).'},
      {title: 'Исто време', text: 'Мери у утврђено време, пре устајања, после најмање 3 сата непрекинутог спавања.'},
      {title: 'Одмах запиши', text: 'Запиши мерење одмах, пре него што уопште устанеш или проговориш.'},
    ],
    section3Body: 'Базална телесна температура благо расте (0,2 до 0,5 °C) одмах после овулације, под дејством прогестерона, и остаје виша до следеће менструације.',
    curveTitle: 'Како изгледа графикон',
    curveText: 'Нижа у првом делу циклуса, после овулације се подиже и ту остаје — образац који постаје јасан тек после неколико дана мерења.',
    disruptingFactors: [
      'Кратка или немирна ноћ',
      'Буђење у необично време',
      'Температура или болест',
      'Алкохол претходне вечери',
      'Недавно путовање кроз временске зоне',
    ],
    section5Body: 'Ово није предиктивни већ потврдни метод: помаже ти да боље разумеш сопствени циклус, када је овулација већ настала — а не да је предвидиш.',
    section5Caption: 'Само посматрање током једног или два циклуса обично није довољно: образац се појављује понављањем.',
    warningTitle: 'Вреди споменути стручњаку',
    consultSituations: [
      'Током неколико потпуних циклуса не појављује се пораст температуре',
      'Температуре остају веома неравномерне упркос пажљивом мерењу',
      'Имаш питања о својој плодности на која само ово праћење не може да одговори',
    ],
    tipTitle: 'Добро је знати',
    tipText: 'Комбиновање базалне телесне температуре са посматрањем цервикалне слузи или тестовима овулације даје потпунију слику твог циклуса.',
    summaryPoints: [
      'Базална телесна температура благо расте (0,2 до 0,5 °C) одмах после овулације, под дејством прогестерона.',
      'Мери се сваког јутра, пре устајања, увек у исто време и истим термометром.',
      'Ово није предиктивни већ потврдни метод: помаже ти да боље разумеш сопствени циклус.',
      'Комбиновање са другим знацима (цервикална слуз, тестови овулације) даје потпунију слику.',
    ],
    disclaimerText: 'Информативни садржај. Овај чланак не замењује персонализовани медицински савет. При сумњи затражи савет од здравственог радника.',
    shareMessage: 'Праћење базалне телесне температуре — AWA',
  },
  hr: {
    badge: 'PLODNOST • BAZALNA TEMPERATURA',
    title: 'Praćenje tvoje\nbazalne temperature',
    metaDuration: '6 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Srednja razina',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Jednostavna metoda kojom naknadno potvrđuješ da je ovulacija nastupila.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Što je bazalna temperatura?',
      'Kada i kako je mjeriti',
      'Uočavanje porasta nakon ovulacije',
      'Što može iskriviti mjerenje',
      'Ograničenja ove metode',
      'Kada razgovarati sa stručnom osobom',
      'Ključne poruke',
    ],
    section1Body: 'Bazalna temperatura je temperatura tvog tijela u potpunom mirovanju, prije bilo kakve aktivnosti. Tijekom ciklusa neznatno varira pod utjecajem hormona.',
    section2Body: 'Mjeri se svako jutro, prije ustajanja, uvijek u isto vrijeme i istim toplomjerom.',
    measuringTips: [
      {title: 'Isti toplomjer', text: 'Uvijek koristi isti toplomjer, po mogućnosti bazalni (precizniji, na desetinku stupnja).'},
      {title: 'Isto vrijeme', text: 'Mjeri u točno određeno vrijeme, prije ustajanja, nakon najmanje 3 sata neprekinutog sna.'},
      {title: 'Zapiši odmah', text: 'Odmah zapiši izmjerenu vrijednost, prije ustajanja i razgovora.'},
    ],
    section3Body: 'Bazalna temperatura neznatno raste (0,2 do 0,5 °C) odmah nakon ovulacije, pod utjecajem progesterona, i ostaje viša do sljedeće menstruacije.',
    curveTitle: 'Kako izgleda grafikon',
    curveText: 'U prvom dijelu ciklusa je niža, nakon ovulacije skoči i ostaje na toj razini — obrazac koji postaje jasan tek nakon nekoliko dana mjerenja.',
    disruptingFactors: [
      'Kratak ili nemiran san',
      'Buđenje u neuobičajeno vrijeme',
      'Vrućica ili bolest',
      'Alkohol prethodne večeri',
      'Nedavna promjena vremenske zone',
    ],
    section5Body: 'Ovo nije metoda predviđanja nego potvrđivanja: pomaže ti bolje razumjeti vlastiti ciklus nakon što se ovulacija već dogodila — ne i unaprijed je predvidjeti.',
    section5Caption: 'Samostalno promatranje tijekom jednog ili dva ciklusa obično nije dovoljno: obrazac se pokazuje ponavljanjem.',
    warningTitle: 'Vrijedi spomenuti stručnoj osobi',
    consultSituations: [
      'Porast temperature ne pojavljuje se tijekom nekoliko potpunih ciklusa',
      'Temperature ostaju vrlo nepravilne unatoč pažljivom mjerenju',
      'Imaš pitanja o svojoj plodnosti na koja ovo praćenje samo ne može odgovoriti',
    ],
    tipTitle: 'Dobro je znati',
    tipText: 'Kombiniranjem bazalne temperature s promatranjem cervikalne sluzi ili testovima ovulacije dobiva se potpunija slika tvog ciklusa.',
    summaryPoints: [
      'Bazalna temperatura neznatno raste (0,2 do 0,5 °C) odmah nakon ovulacije, pod utjecajem progesterona.',
      'Mjeri se svako jutro, prije ustajanja, uvijek u isto vrijeme i istim toplomjerom.',
      'Ovo nije metoda predviđanja nego potvrđivanja: pomaže ti bolje razumjeti vlastiti ciklus.',
      'Kombinacija s drugim znakovima (cervikalna sluz, testovi ovulacije) daje potpuniju sliku.',
    ],
    disclaimerText: 'Informativni sadržaj. Ovaj članak ne zamjenjuje individualni medicinski savjet. U slučaju nedoumice zatraži savjet zdravstvenog djelatnika.',
    shareMessage: 'Praćenje bazalne temperature — AWA',
  },
  bs: {
    badge: 'PLODNOST • BAZALNA TEMPERATURA',
    title: 'Praćenje tvoje\nbazalne temperature',
    metaDuration: '6 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Srednja razina',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Jednostavna metoda kojom naknadno potvrđuješ da je ovulacija nastupila.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Što je bazalna temperatura?',
      'Kada i kako je mjeriti',
      'Uočavanje porasta nakon ovulacije',
      'Što može iskriviti mjerenje',
      'Ograničenja ove metode',
      'Kada razgovarati sa stručnom osobom',
      'Ključne poruke',
    ],
    section1Body: 'Bazalna temperatura je temperatura tvog tijela u potpunom mirovanju, prije bilo kakve aktivnosti. Tokom ciklusa neznatno varira pod utjecajem hormona.',
    section2Body: 'Mjeri se svako jutro, prije ustajanja, uvijek u isto vrijeme i istim toplomjerom.',
    measuringTips: [
      {title: 'Isti toplomjer', text: 'Uvijek koristi isti toplomjer, po mogućnosti bazalni (precizniji, na desetinku stupnja).'},
      {title: 'Isto vrijeme', text: 'Mjeri u tačno određeno vrijeme, prije ustajanja, nakon najmanje 3 sata neprekinutog sna.'},
      {title: 'Zapiši odmah', text: 'Odmah zapiši izmjerenu vrijednost, prije ustajanja i razgovora.'},
    ],
    section3Body: 'Bazalna temperatura neznatno raste (0,2 do 0,5 °C) odmah nakon ovulacije, pod utjecajem progesterona, i ostaje viša do sljedeće menstruacije.',
    curveTitle: 'Kako izgleda grafikon',
    curveText: 'U prvom dijelu ciklusa je niža, nakon ovulacije skoči i ostaje na toj razini — obrazac koji postaje jasan tek nakon nekoliko dana mjerenja.',
    disruptingFactors: [
      'Kratak ili nemiran san',
      'Buđenje u neuobičajeno vrijeme',
      'Vrućica ili bolest',
      'Alkohol prethodne večeri',
      'Nedavna promjena vremenske zone',
    ],
    section5Body: 'Ovo nije metoda predviđanja nego potvrđivanja: pomaže ti bolje razumjeti vlastiti ciklus nakon što se ovulacija već dogodila — ne i unaprijed je predvidjeti.',
    section5Caption: 'Samostalno promatranje tokom jednog ili dva ciklusa obično nije dovoljno: obrazac se pokazuje ponavljanjem.',
    warningTitle: 'Vrijedi spomenuti stručnoj osobi',
    consultSituations: [
      'Porast temperature ne pojavljuje se tokom nekoliko potpunih ciklusa',
      'Temperature ostaju vrlo nepravilne unatoč pažljivom mjerenju',
      'Imaš pitanja o svojoj plodnosti na koja ovo praćenje samo ne može odgovoriti',
    ],
    tipTitle: 'Dobro je znati',
    tipText: 'Kombiniranjem bazalne temperature s promatranjem cervikalne sluzi ili testovima ovulacije dobiva se potpunija slika tvog ciklusa.',
    summaryPoints: [
      'Bazalna temperatura neznatno raste (0,2 do 0,5 °C) odmah nakon ovulacije, pod utjecajem progesterona.',
      'Mjeri se svako jutro, prije ustajanja, uvijek u isto vrijeme i istim toplomjerom.',
      'Ovo nije metoda predviđanja nego potvrđivanja: pomaže ti bolje razumjeti vlastiti ciklus.',
      'Kombinacija s drugim znakovima (cervikalna sluz, testovi ovulacije) daje potpuniju sliku.',
    ],
    disclaimerText: 'Informativni sadržaj. Ovaj članak ne zamjenjuje individualni medicinski savjet. U slučaju nedoumice zatraži savjet zdravstvenog radnika.',
    shareMessage: 'Praćenje bazalne temperature — AWA',
  },
  sl: {
    badge: 'PLODNOST • BAZALNA TEMPERATURA',
    title: 'Spremljanje tvoje\nbazalne temperature',
    metaDuration: '6 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Srednja raven',
    metaValidated: 'Preverjena vsebina',
    intro: 'Preprosta metoda, s katero naknadno potrdiš, da je ovulacija nastopila.',
    contentsTitle: 'V tem članku',
    topics: [
      'Kaj je bazalna temperatura?',
      'Kdaj in kako jo meriti',
      'Prepoznavanje dviga po ovulaciji',
      'Kaj lahko popači meritev',
      'Omejitve te metode',
      'Kdaj se pogovoriti s strokovnjakom',
      'Ključna sporočila',
    ],
    section1Body: 'Bazalna temperatura je temperatura tvojega telesa v popolnem mirovanju, pred vsako dejavnostjo. Med ciklom se rahlo spreminja pod vplivom hormonov.',
    section2Body: 'Meri se vsako jutro, preden vstaneš, vedno ob isti uri in z istim termometrom.',
    measuringTips: [
      {title: 'Isti termometer', text: 'Vedno uporabljaj isti termometer, po možnosti bazalnega (natančnejšega, na desetinko stopinje).'},
      {title: 'Ista ura', text: 'Meri ob stalni uri, preden vstaneš, po vsaj 3 urah neprekinjenega spanca.'},
      {title: 'Zapiši takoj', text: 'Izmerjeno vrednost zapiši takoj, še preden vstaneš ali spregovoriš.'},
    ],
    section3Body: 'Bazalna temperatura rahlo naraste (za 0,2 do 0,5 °C) takoj po ovulaciji, pod vplivom progesterona, in ostane višja do naslednje menstruacije.',
    curveTitle: 'Kako izgleda graf',
    curveText: 'V prvem delu cikla je nižja, po ovulaciji skoči in ostane na tej ravni — vzorec, ki postane jasen šele po nekaj dneh merjenja.',
    disruptingFactors: [
      'Kratek ali nemiren spanec',
      'Bujenje ob nenavadni uri',
      'Vročina ali bolezen',
      'Alkohol prejšnji večer',
      'Nedavna sprememba časovnega pasu',
    ],
    section5Body: 'To ni metoda napovedovanja, ampak potrjevanja: pomaga ti bolje razumeti lasten cikel, ko se je ovulacija že zgodila — ne pa je predvideti vnaprej.',
    section5Caption: 'Samostojno opazovanje enega ali dveh ciklov običajno ni dovolj: vzorec se pokaže s ponavljanjem.',
    warningTitle: 'Vredno omeniti strokovnjaku',
    consultSituations: [
      'Dvig temperature se ne pojavi v več popolnih ciklih',
      'Temperature ostajajo zelo neredne kljub skrbnemu merjenju',
      'Imaš vprašanja o svoji plodnosti, na katera to spremljanje samo ne more odgovoriti',
    ],
    tipTitle: 'Vredno vedeti',
    tipText: 'S kombinacijo bazalne temperature z opazovanjem materničnovratne sluzi ali testi ovulacije dobiš popolnejšo sliko svojega cikla.',
    summaryPoints: [
      'Bazalna temperatura rahlo naraste (za 0,2 do 0,5 °C) takoj po ovulaciji, pod vplivom progesterona.',
      'Meri se vsako jutro, preden vstaneš, vedno ob isti uri in z istim termometrom.',
      'To ni metoda napovedovanja, ampak potrjevanja: pomaga ti bolje razumeti lasten cikel.',
      'Kombinacija z drugimi znaki (materničnovratna sluz, testi ovulacije) daje popolnejšo sliko.',
    ],
    disclaimerText: 'Informativna vsebina. Ta članek ne nadomešča osebnega zdravniškega nasveta. V primeru dvoma poišči nasvet zdravstvenega delavca.',
    shareMessage: 'Spremljanje bazalne temperature — AWA',
  },
  ne: {
    badge: 'उर्वरता • आधारभूत शारीरिक तापक्रम',
    title: 'आफ्नो आधारभूत शारीरिक\nतापक्रम अनुगमन',
    metaDuration: '6 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'मध्यम',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'अण्डोत्सर्ग भइसकेको कुरा पछि पुष्टि गर्ने एउटा सरल विधि।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'आधारभूत शारीरिक तापक्रम के हो?',
      'कहिले र कसरी नाप्ने',
      'अण्डोत्सर्गपछिको वृद्धि चिन्ने',
      'मापनलाई के ले बिगार्न सक्छ',
      'यो विधिका सीमाहरू',
      'व्यावसायिकसँग कहिले कुरा गर्ने',
      'मुख्य कुराहरू',
    ],
    section1Body: 'आधारभूत शारीरिक तापक्रम पूर्ण विश्रामको अवस्थामा, कुनै गतिविधिअघि, तपाईंको शरीरको तापक्रम हो। यो हर्मोनको प्रभावमा चक्रभरि निकै थोरै फेरिन्छ।',
    section2Body: 'यो हरेक बिहान, ओछ्यानबाट उठ्नुअघि, सधैँ एउटै समयमा र एउटै थर्मोमिटरले नापिन्छ।',
    measuringTips: [
      {title: 'एउटै थर्मोमिटर', text: 'सधैँ एउटै थर्मोमिटर प्रयोग गर्नुहोस्, आदर्श रूपमा आधारभूत तापक्रमको (दशांश डिग्रीसम्म बढी सही)।'},
      {title: 'एउटै समय', text: 'कम्तीमा 3 घण्टाको अवरोधरहित निद्रापछि, उठ्नुअघि निश्चित समयमा नाप्नुहोस्।'},
      {title: 'तुरुन्तै लेख्नुहोस्', text: 'उठ्नु वा बोल्नुअघि नै मापन तुरुन्तै लेख्नुहोस्।'},
    ],
    section3Body: 'अण्डोत्सर्गपछि तुरुन्तै प्रोजेस्टेरोनको प्रभावले आधारभूत शारीरिक तापक्रम थोरै (0.2 देखि 0.5°C) बढ्छ र अर्को महिनावारीसम्म उच्च रहन्छ।',
    curveTitle: 'चार्ट कस्तो देखिन्छ',
    curveText: 'चक्रको पहिलो भागमा कम हुने तापक्रम अण्डोत्सर्गपछि एक पाइला माथि जान्छ र त्यहीँ रहन्छ — यो ढाँचा केही दिनको मापनपछि मात्र स्पष्ट हुन्छ।',
    disruptingFactors: [
      'छोटो वा अशान्त निद्रा',
      'असामान्य समयमा ब्युँझनु',
      'ज्वरो वा बिमारी',
      'अघिल्लो रात मदिरा',
      'हालैको जेट ल्याग',
    ],
    section5Body: 'यो भविष्यवाणी गर्ने विधि होइन, पुष्टि गर्ने विधि हो: यसले अण्डोत्सर्ग भइसकेपछि तपाईंको आफ्नै चक्र राम्ररी बुझ्न मद्दत गर्छ — यसको पूर्वानुमान गर्न होइन।',
    section5Caption: 'एक-दुई चक्र मात्र अवलोकन गर्नु प्रायः पर्याप्त हुँदैन: ढाँचा दोहोरिएपछि स्पष्ट हुन्छ।',
    warningTitle: 'व्यावसायिकलाई बताउन लायक',
    consultSituations: [
      'धेरै पूरा चक्रमा कुनै तापक्रम वृद्धि देखिँदैन',
      'सावधानीपूर्वक नापे पनि तापक्रम निकै अनियमित रहन्छ',
      'तपाईंको उर्वरताबारे यो अनुगमनले मात्र उत्तर दिन नसक्ने प्रश्नहरू छन्',
    ],
    tipTitle: 'जान्न लायक',
    tipText: 'आधारभूत शारीरिक तापक्रमलाई गर्भाशयको मुखको तरल पदार्थको अवलोकन वा अण्डोत्सर्ग परीक्षणसँग जोड्दा तपाईंको चक्रको अझ पूर्ण चित्र पाइन्छ।',
    summaryPoints: [
      'प्रोजेस्टेरोनको प्रभावमा अण्डोत्सर्गपछि तुरुन्तै आधारभूत शारीरिक तापक्रम थोरै (0.2 देखि 0.5°C) बढ्छ।',
      'यो हरेक बिहान, उठ्नुअघि, सधैँ एउटै समयमा र एउटै थर्मोमिटरले नापिन्छ।',
      'यो भविष्यवाणी गर्ने विधि होइन, पुष्टि गर्ने विधि हो: यसले तपाईंलाई आफ्नै चक्र राम्ररी बुझ्न मद्दत गर्छ।',
      'अन्य संकेतहरू (गर्भाशयको मुखको तरल पदार्थ, अण्डोत्सर्ग परीक्षण) सँग जोड्दा अझ पूर्ण चित्र पाइन्छ।',
    ],
    disclaimerText: 'जानकारीमूलक सामग्री। यो लेखले व्यक्तिगत चिकित्सकीय सल्लाहको स्थान लिँदैन। शङ्का भए स्वास्थ्यकर्मीसँग मार्गदर्शन लिनुहोस्।',
    shareMessage: 'आधारभूत शारीरिक तापक्रमको अनुगमन — AWA',
  },
  si: {
    badge: 'සාරවත් බව • මූලික ශරීර උෂ්ණත්වය',
    title: 'ඔබේ මූලික ශරීර\nඋෂ්ණත්වය නිරීක්ෂණය කිරීම',
    metaDuration: 'කියවීමට මිනිත්තු 6',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'මධ්‍යම',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'ඩිම්බ මෝචනය සිදුවී ඇති බව පසුව තහවුරු කිරීමට සරල ක්‍රමයක්.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'මූලික ශරීර උෂ්ණත්වය යනු කුමක්ද?',
      'එය මනින්නේ කවදාද සහ කෙසේද',
      'ඩිම්බ මෝචනයෙන් පසු ඉහළ යාම හඳුනාගැනීම',
      'කියවීමක් වෙනස් කළ හැකි දේ',
      'මෙම ක්‍රමයේ සීමාවන්',
      'වෘත්තිකයෙකු සමඟ කතා කළ යුත්තේ කවදාද',
      'ප්‍රධාන කරුණු',
    ],
    section1Body: 'මූලික ශරීර උෂ්ණත්වය යනු කිසිදු ක්‍රියාකාරකමකට පෙර, සම්පූර්ණ විවේකයේ ඔබේ ශරීරයේ උෂ්ණත්වයයි. ඔබේ හෝමෝනවල බලපෑම යටතේ චක්‍රය පුරා එය ඉතා සුළු වශයෙන් වෙනස් වේ.',
    section2Body: 'එය සෑම උදෑසනකම, ඔබ නැගිටීමට පෙර, සැමවිටම එකම වේලාවට සහ එකම උෂ්ණත්වමානයෙන් මනිනු ලැබේ.',
    measuringTips: [
      {title: 'එකම උෂ්ණත්වමානය', text: 'සැමවිටම එකම උෂ්ණත්වමානය භාවිතා කරන්න, හැකි නම් මූලික ශරීර උෂ්ණත්වමානයක් (වඩා නිවැරදි, අංශක දහයෙන් එකකට).'},
      {title: 'එකම වේලාව', text: 'අඛණ්ඩ නින්ද පැය 3කට නොඅඩු වූ පසු, නැගිටීමට පෙර, ස්ථාවර වේලාවක මනින්න.'},
      {title: 'වහාම සටහන් කරන්න', text: 'නැගිටීමට හෝ කතා කිරීමට පවා පෙර, කියවීම වහාම ලියා තබන්න.'},
    ],
    section3Body: 'ඩිම්බ මෝචනයෙන් පසු වහාම, ප්‍රොජෙස්ටරෝන්වල බලපෑම යටතේ මූලික ශරීර උෂ්ණත්වය තරමක් (0.2 සිට 0.5°C දක්වා) ඉහළ යන අතර, ඔබේ ඊළඟ ඔසප් දක්වා ඉහළින් පවතී.',
    curveTitle: 'ප්‍රස්ථාරය පෙනෙන ආකාරය',
    curveText: 'චක්‍රයේ පළමු කොටසේ පහළින් පවතින එය, ඩිම්බ මෝචනයෙන් පසු පියවරක් ඉහළ ගොස් එහි පවතී — දින කිහිපයක කියවීම් පසුව පමණක් පැහැදිලි වන රටාවකි.',
    disruptingFactors: [
      'කෙටි හෝ නොසන්සුන් රාත්‍රී නින්දක්',
      'අසාමාන්‍ය වේලාවකට අවදි වීම',
      'උණ හෝ රෝගයක්',
      'පෙර දිනයේ රාත්‍රියේ මත්පැන්',
      'මෑතකදී කාල කලාප වෙනස්වීමක්',
    ],
    section5Body: 'මෙය පුරෝකථන ක්‍රමයක් නොව තහවුරු කිරීමේ ක්‍රමයකි: ඩිම්බ මෝචනය දැනටමත් සිදු වූ පසු, ඔබේම චක්‍රය වඩා හොඳින් තේරුම් ගැනීමට එය උපකාරී වේ — එය අපේක්ෂා කිරීමට නොවේ.',
    section5Caption: 'චක්‍ර එකක් හෝ දෙකක් පුරා තනිවම නිරීක්ෂණය කිරීම සාමාන්‍යයෙන් ප්‍රමාණවත් නොවේ: රටාව පුනරාවර්තනය සමඟ මතු වේ.',
    warningTitle: 'වෘත්තිකයෙකුට සඳහන් කිරීම වටී',
    consultSituations: [
      'සම්පූර්ණ චක්‍ර කිහිපයක් පුරා උෂ්ණත්ව ඉහළ යාමක් නොපෙනේ',
      'ප්‍රවේශමෙන් මැනුවද උෂ්ණත්වය ඉතා අක්‍රමවත්ව පවතී',
      'මෙම නිරීක්ෂණයට පමණක් පිළිතුරු දිය නොහැකි ඔබේ සාරවත් බව පිළිබඳ ප්‍රශ්න ඔබට ඇත',
    ],
    tipTitle: 'දැනගත යුතු දේ',
    tipText: 'මූලික ශරීර උෂ්ණත්වය ඔබේ ගර්භාෂ ග්‍රීවා ශ්ලේෂ්මල නිරීක්ෂණය හෝ ඩිම්බ මෝචන පරීක්ෂණ සමඟ ඒකාබද්ධ කිරීම ඔබේ චක්‍රයේ වඩා සම්පූර්ණ චිත්‍රයක් ලබා දෙයි.',
    summaryPoints: [
      'ප්‍රොජෙස්ටරෝන්වල බලපෑම යටතේ, ඩිම්බ මෝචනයෙන් පසු වහාම මූලික ශරීර උෂ්ණත්වය තරමක් (0.2 සිට 0.5°C දක්වා) ඉහළ යයි.',
      'එය සෑම උදෑසනකම, නැගිටීමට පෙර, සැමවිටම එකම වේලාවට සහ එකම උෂ්ණත්වමානයෙන් මනිනු ලැබේ.',
      'මෙය පුරෝකථන ක්‍රමයක් නොව තහවුරු කිරීමේ ක්‍රමයකි: එය ඔබේම චක්‍රය වඩා හොඳින් තේරුම් ගැනීමට උපකාරී වේ.',
      'එය වෙනත් සලකුණු (ගර්භාෂ ග්‍රීවා ශ්ලේෂ්මල, ඩිම්බ මෝචන පරීක්ෂණ) සමඟ ඒකාබද්ධ කිරීම වඩා සම්පූර්ණ චිත්‍රයක් ලබා දෙයි.',
    ],
    disclaimerText: 'තොරතුරු අන්තර්ගතයකි. මෙම ලිපිය පුද්ගලීකරණය කළ වෛද්‍ය උපදෙස් වෙනුවට නොපවතී. සැකයක් ඇත්නම්, මඟපෙන්වීමක් සඳහා සෞඛ්‍ය වෘත්තිකයෙකුගෙන් විමසන්න.',
    shareMessage: 'මූලික ශරීර උෂ්ණත්වය නිරීක්ෂණය කිරීම — AWA',
  },
  th: {
    badge: 'ภาวะเจริญพันธุ์ • อุณหภูมิร่างกายขณะพัก',
    title: 'การติดตาม\nอุณหภูมิร่างกายขณะพัก',
    metaDuration: 'อ่าน 6 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'ปานกลาง',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'วิธีง่าย ๆ เพื่อยืนยันภายหลังว่าการตกไข่เกิดขึ้นแล้ว',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'อุณหภูมิร่างกายขณะพักคืออะไร?',
      'ควรวัดเมื่อไรและอย่างไร',
      'การสังเกตการเพิ่มขึ้นหลังการตกไข่',
      'สิ่งที่ทำให้ค่าที่วัดคลาดเคลื่อนได้',
      'ข้อจำกัดของวิธีนี้',
      'เมื่อไรควรปรึกษาผู้เชี่ยวชาญ',
      'ประเด็นสำคัญ',
    ],
    section1Body: 'อุณหภูมิร่างกายขณะพักคืออุณหภูมิของร่างกายขณะพักสนิท ก่อนทำกิจกรรมใด ๆ ค่านี้เปลี่ยนแปลงเล็กน้อยมากตลอดรอบเดือนตามอิทธิพลของฮอร์โมน',
    section2Body: 'วัดทุกเช้าก่อนลุกจากเตียง ในเวลาเดิมและใช้เทอร์โมมิเตอร์อันเดิมเสมอ',
    measuringTips: [
      {title: 'เทอร์โมมิเตอร์อันเดิม', text: 'ใช้เทอร์โมมิเตอร์อันเดิมเสมอ ควรเป็นแบบวัดอุณหภูมิขณะพักโดยเฉพาะ (แม่นยำกว่า ละเอียดถึงหนึ่งในสิบองศา)'},
      {title: 'เวลาเดิม', text: 'วัดในเวลาที่กำหนดแน่นอน ก่อนลุกจากเตียง หลังนอนหลับต่อเนื่องอย่างน้อย 3 ชั่วโมง'},
      {title: 'จดทันที', text: 'จดค่าที่วัดทันที ก่อนลุกจากเตียงหรือพูดคุย'},
    ],
    section3Body: 'อุณหภูมิร่างกายขณะพักจะสูงขึ้นเล็กน้อย (0.2 ถึง 0.5 องศาเซลเซียส) หลังการตกไข่ทันที จากผลของโปรเจสเตอโรน และคงอยู่ในระดับสูงจนถึงประจำเดือนครั้งถัดไป',
    curveTitle: 'กราฟมีลักษณะอย่างไร',
    curveText: 'ต่ำกว่าในช่วงแรกของรอบเดือน แล้วขยับสูงขึ้นหลังการตกไข่และคงอยู่ที่ระดับนั้น — รูปแบบที่จะชัดเจนก็ต่อเมื่อวัดไปหลายวัน',
    disruptingFactors: [
      'การนอนที่สั้นหรือไม่สงบ',
      'การตื่นในเวลาที่ผิดไปจากปกติ',
      'ไข้หรือการเจ็บป่วย',
      'แอลกอฮอล์ในคืนก่อนหน้า',
      'อาการเจ็ตแล็กที่เพิ่งผ่านมา',
    ],
    section5Body: 'นี่ไม่ใช่วิธีทำนาย แต่เป็นวิธียืนยัน: ช่วยให้คุณเข้าใจรอบเดือนของตัวเองมากขึ้นหลังจากที่การตกไข่เกิดขึ้นแล้ว — ไม่ใช่เพื่อคาดการณ์ล่วงหน้า',
    section5Caption: 'การสังเกตเพียงรอบหรือสองรอบมักยังไม่เพียงพอ: รูปแบบจะปรากฏเมื่อทำซ้ำ',
    warningTitle: 'ควรแจ้งผู้เชี่ยวชาญ',
    consultSituations: [
      'ไม่พบการเพิ่มขึ้นของอุณหภูมิตลอดหลายรอบเดือนเต็ม',
      'อุณหภูมิยังคงไม่สม่ำเสมออย่างมากแม้วัดอย่างระมัดระวัง',
      'คุณมีคำถามเกี่ยวกับภาวะเจริญพันธุ์ที่การติดตามนี้อย่างเดียวตอบไม่ได้',
    ],
    tipTitle: 'ควรรู้',
    tipText: 'การใช้อุณหภูมิร่างกายขณะพักร่วมกับการสังเกตเมือกปากมดลูกหรือการตรวจการตกไข่ ให้ภาพรวมของรอบเดือนที่สมบูรณ์ยิ่งขึ้น',
    summaryPoints: [
      'อุณหภูมิร่างกายขณะพักสูงขึ้นเล็กน้อย (0.2 ถึง 0.5 องศาเซลเซียส) หลังการตกไข่ทันที จากผลของโปรเจสเตอโรน',
      'วัดทุกเช้าก่อนลุกจากเตียง ในเวลาเดิมและด้วยเทอร์โมมิเตอร์อันเดิมเสมอ',
      'นี่ไม่ใช่วิธีทำนาย แต่เป็นวิธียืนยัน: ช่วยให้คุณเข้าใจรอบเดือนของตัวเองมากขึ้น',
      'การใช้ร่วมกับสัญญาณอื่น (เมือกปากมดลูก การตรวจการตกไข่) ให้ภาพที่สมบูรณ์ยิ่งขึ้น',
    ],
    disclaimerText: 'เนื้อหาเพื่อให้ข้อมูล บทความนี้ไม่ได้ทดแทนคำแนะนำทางการแพทย์เฉพาะบุคคล หากมีข้อสงสัย โปรดขอคำแนะนำจากบุคลากรทางการแพทย์',
    shareMessage: 'การติดตามอุณหภูมิร่างกายขณะพัก — AWA',
  },
  vi: {
    badge: 'KHẢ NĂNG THỤ THAI • THÂN NHIỆT CƠ BẢN',
    title: 'Theo dõi\nthân nhiệt cơ bản của bạn',
    metaDuration: '6 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Trung cấp',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Một phương pháp đơn giản để xác nhận, sau khi sự việc đã xảy ra, rằng rụng trứng đã diễn ra.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Thân nhiệt cơ bản là gì?',
      'Khi nào và cách đo',
      'Nhận biết sự tăng nhiệt sau rụng trứng',
      'Điều gì có thể làm sai lệch kết quả đo',
      'Những hạn chế của phương pháp này',
      'Khi nào nên nói chuyện với chuyên gia',
      'Những điểm chính cần nhớ',
    ],
    section1Body: 'Thân nhiệt cơ bản là nhiệt độ cơ thể bạn khi hoàn toàn nghỉ ngơi, trước mọi hoạt động. Nó thay đổi rất nhẹ trong suốt chu kỳ, dưới tác động của nội tiết tố.',
    section2Body: 'Nó được đo mỗi buổi sáng, trước khi bạn ngồi dậy, luôn vào cùng một giờ và bằng cùng một nhiệt kế.',
    measuringTips: [
      {title: 'Cùng một nhiệt kế', text: 'Luôn dùng cùng một nhiệt kế, tốt nhất là nhiệt kế cơ bản (chính xác hơn, đến phần mười độ).'},
      {title: 'Cùng một giờ', text: 'Đo vào một giờ cố định, trước khi ngồi dậy, sau ít nhất 3 giờ ngủ liên tục.'},
      {title: 'Ghi lại ngay', text: 'Ghi lại kết quả ngay lập tức, trước cả khi ngồi dậy hay nói chuyện.'},
    ],
    section3Body: 'Thân nhiệt cơ bản tăng nhẹ (0,2 đến 0,5°C) ngay sau khi rụng trứng, dưới tác dụng của progesterone, và duy trì ở mức cao hơn cho đến kỳ kinh tiếp theo.',
    curveTitle: 'Biểu đồ trông như thế nào',
    curveText: 'Thấp hơn ở nửa đầu chu kỳ, nó tăng lên một bậc sau khi rụng trứng và duy trì ở đó — một quy luật chỉ trở nên rõ ràng sau nhiều ngày đo.',
    disruptingFactors: [
      'Một đêm ngủ ngắn hoặc không yên giấc',
      'Thức dậy vào giờ khác thường',
      'Sốt hoặc ốm',
      'Uống rượu bia tối hôm trước',
      'Vừa bị lệch múi giờ',
    ],
    section5Body: 'Đây không phải là phương pháp dự đoán mà là phương pháp xác nhận: nó giúp bạn hiểu rõ hơn chu kỳ của chính mình, sau khi rụng trứng đã xảy ra — không phải để đoán trước nó.',
    section5Caption: 'Chỉ quan sát một hoặc hai chu kỳ thường chưa đủ: quy luật sẽ hiện rõ khi lặp lại nhiều lần.',
    warningTitle: 'Nên trao đổi với chuyên gia',
    consultSituations: [
      'Không thấy nhiệt độ tăng qua nhiều chu kỳ trọn vẹn',
      'Nhiệt độ vẫn rất thất thường dù đã đo cẩn thận',
      'Bạn có thắc mắc về khả năng sinh sản mà chỉ riêng việc theo dõi này không thể giải đáp',
    ],
    tipTitle: 'Nên biết',
    tipText: 'Kết hợp thân nhiệt cơ bản với việc quan sát dịch nhầy cổ tử cung hoặc que thử rụng trứng sẽ cho bức tranh đầy đủ hơn về chu kỳ của bạn.',
    summaryPoints: [
      'Thân nhiệt cơ bản tăng nhẹ (0,2 đến 0,5°C) ngay sau khi rụng trứng, dưới tác dụng của progesterone.',
      'Nó được đo mỗi buổi sáng, trước khi ngồi dậy, luôn vào cùng một giờ và bằng cùng một nhiệt kế.',
      'Đây không phải là phương pháp dự đoán mà là phương pháp xác nhận: nó giúp bạn hiểu rõ hơn chu kỳ của chính mình.',
      'Kết hợp với các dấu hiệu khác (dịch nhầy cổ tử cung, que thử rụng trứng) sẽ cho bức tranh đầy đủ hơn.',
    ],
    disclaimerText: 'Nội dung mang tính thông tin. Bài viết này không thay thế lời khuyên y khoa cá nhân hóa. Nếu có nghi ngờ, hãy hỏi nhân viên y tế để được hướng dẫn.',
    shareMessage: 'Theo dõi thân nhiệt cơ bản — AWA',
  },
  uz: {
    badge: 'UNUMDORLIK • BAZAL TANA HARORATI',
    title: 'Bazal tana haroratini\nkuzatish',
    metaDuration: '6 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Oʻrta',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Ovulyatsiya sodir boʻlganini keyinchalik tasdiqlashning oddiy usuli.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Bazal tana harorati nima?',
      'Uni qachon va qanday oʻlchash kerak',
      'Ovulyatsiyadan keyingi koʻtarilishni payqash',
      'Oʻlchovni nima buzishi mumkin',
      'Bu usulning cheklovlari',
      'Qachon mutaxassis bilan gaplashish kerak',
      'Asosiy xulosalar',
    ],
    section1Body: 'Bazal tana harorati — tanangizning toʻliq dam holatida, har qanday faollikdan oldingi harorati. U sikl davomida gormonlaringiz taʼsirida juda ozgina oʻzgaradi.',
    section2Body: 'U har ertalab, oʻrindan turishdan oldin, doim bir vaqtda va bir xil termometr bilan oʻlchanadi.',
    measuringTips: [
      {title: 'Bir xil termometr', text: 'Doim bir xil termometrdan, ideal holda bazal termometrdan foydalaning (aniqroq, daraja oʻndan biriga qadar).'},
      {title: 'Bir xil vaqt', text: 'Kamida 3 soat uzluksiz uyqudan keyin, oʻrindan turishdan oldin, belgilangan vaqtda oʻlchang.'},
      {title: 'Darhol yozib qoʻying', text: 'Koʻrsatkichni oʻrindan turmasdan va gaplashmasdan darhol yozib qoʻying.'},
    ],
    section3Body: 'Bazal tana harorati ovulyatsiyadan keyin darhol progesteron taʼsirida ozgina (0,2 °C dan 0,5 °C gacha) koʻtariladi va keyingi hayzgacha yuqoriroq qoladi.',
    curveTitle: 'Grafik qanday koʻrinadi',
    curveText: 'Siklning birinchi qismida pastroq, ovulyatsiyadan keyin bir pogʻona koʻtariladi va shunday qoladi — bu qonuniyat faqat bir necha kunlik oʻlchovdan keyin ayon boʻladi.',
    disruptingFactors: [
      'Qisqa yoki bezovta uyqu',
      'Odatdan tashqari vaqtda uygʻonish',
      'Isitma yoki kasallik',
      'Oldingi kecha spirtli ichimlik',
      'Yaqinda vaqt mintaqasi oʻzgarishi',
    ],
    section5Body: 'Bu bashorat qiluvchi emas, balki tasdiqlovchi usul: u ovulyatsiya allaqachon sodir boʻlgandan keyin siklingizni yaxshiroq tushunishga yordam beradi — uni oldindan bilish uchun emas.',
    section5Caption: 'Uni yakka oʻzi bir-ikki sikl kuzatish odatda yetarli emas: qonuniyat takrorlanish bilan ayon boʻladi.',
    warningTitle: 'Mutaxassisga aytib qoʻyishga arziydi',
    consultSituations: [
      'Bir necha toʻliq sikl davomida harorat koʻtarilishi paydo boʻlmaydi',
      'Ehtiyotkor oʻlchashga qaramay harorat juda notekis qoladi',
      'Faqat shu kuzatuv javob bera olmaydigan unumdorlik haqida savollaringiz bor',
    ],
    tipTitle: 'Bilish foydali',
    tipText: 'Bazal tana haroratini bachadon boʻyni shilligini kuzatish yoki ovulyatsiya testlari bilan birlashtirish siklingiz haqida toʻliqroq tasavvur beradi.',
    summaryPoints: [
      'Bazal tana harorati ovulyatsiyadan keyin darhol progesteron taʼsirida ozgina (0,2 °C dan 0,5 °C gacha) koʻtariladi.',
      'U har ertalab, oʻrindan turishdan oldin, doim bir vaqtda va bir xil termometr bilan oʻlchanadi.',
      'Bu bashorat qiluvchi emas, balki tasdiqlovchi usul: u oʻz siklingizni yaxshiroq tushunishga yordam beradi.',
      'Uni boshqa belgilar (bachadon boʻyni shilligi, ovulyatsiya testlari) bilan birlashtirish toʻliqroq tasavvur beradi.',
    ],
    disclaimerText: 'Maʼlumot uchun kontent. Bu maqola shaxsiy tibbiy maslahatni almashtirmaydi. Shubha boʻlsa, sogʻliqni saqlash mutaxassisidan yoʻl-yoʻriq soʻrang.',
    shareMessage: 'Bazal tana haroratini kuzatish — AWA',
  },
  az: {
    badge: 'MÜNBİTLİK • BAZAL BƏDƏN TEMPERATURU',
    title: 'Bazal bədən temperaturunuzu\nizləmək',
    metaDuration: '6 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Orta',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Ovulyasiyanın baş verdiyini sonradan təsdiq etmək üçün sadə üsul.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Bazal bədən temperaturu nədir?',
      'Onu nə vaxt və necə ölçmək lazımdır',
      'Ovulyasiyadan sonrakı yüksəlişi görmək',
      'Ölçmə nəticəsini nə təhrif edə bilər',
      'Bu üsulun məhdudiyyətləri',
      'Nə vaxt mütəxəssislə danışmaq lazımdır',
      'Əsas nəticələr',
    ],
    section1Body: 'Bazal bədən temperaturu hər hansı fəaliyyətdən əvvəl, tam istirahət vəziyyətində bədəninizin temperaturudur. O, hormonların təsiri altında dövr boyu çox cüzi dəyişir.',
    section2Body: 'O, hər səhər, yataqdan qalxmazdan əvvəl, həmişə eyni vaxtda və eyni termometrlə ölçülür.',
    measuringTips: [
      {title: 'Eyni termometr', text: 'Həmişə eyni termometrdən, ideal halda bazal termometrdən istifadə edin (daha dəqiq, dərəcənin onda birinə qədər).'},
      {title: 'Eyni vaxt', text: 'Ən azı 3 saat fasiləsiz yuxudan sonra, yataqdan qalxmazdan əvvəl sabit vaxtda ölçün.'},
      {title: 'Dərhal yazın', text: 'Nəticəni hətta yataqdan qalxmadan və ya danışmadan əvvəl dərhal yazın.'},
    ],
    section3Body: 'Bazal bədən temperaturu ovulyasiyadan dərhal sonra progesteronun təsiri ilə bir qədər (0,2–0,5°C) yüksəlir və növbəti aybaşınıza qədər daha yüksək qalır.',
    curveTitle: 'Qrafik necə görünür',
    curveText: 'Dövrün ilk hissəsində aşağı olan temperatur ovulyasiyadan sonra pilləvari şəkildə qalxır və orada qalır — bu qanunauyğunluq yalnız bir neçə günlük ölçmədən sonra aydın olur.',
    disruptingFactors: [
      'Qısa və ya narahat yuxu',
      'Qeyri-adi vaxtda oyanmaq',
      'Hərarət və ya xəstəlik',
      'Əvvəlki axşam alkoqol',
      'Yaxınlarda saat qurşağı dəyişikliyi',
    ],
    section5Body: 'Bu, proqnozlaşdırıcı deyil, təsdiqləyici üsuldur: o, ovulyasiya artıq baş verdikdən sonra öz dövrünüzü daha yaxşı anlamağa kömək edir — onu qabaqcadan görməyə yox.',
    section5Caption: 'Onu bir və ya iki dövr ərzində tək müşahidə etmək adətən kifayət deyil: qanunauyğunluq təkrar ilə üzə çıxır.',
    warningTitle: 'Mütəxəssisə bildirməyə dəyər',
    consultSituations: [
      'Bir neçə tam dövr ərzində temperatur yüksəlişi görünmür',
      'Diqqətli ölçməyə baxmayaraq temperaturlar çox qeyri-müntəzəm qalır',
      'Münbitliyiniz barədə yalnız bu izləmənin cavablandıra bilmədiyi suallarınız var',
    ],
    tipTitle: 'Bilmək faydalıdır',
    tipText: 'Bazal bədən temperaturunu uşaqlıq boynu mukusunu müşahidə etməklə və ya ovulyasiya testləri ilə birləşdirmək dövrünüz haqqında daha tam təsəvvür verir.',
    summaryPoints: [
      'Bazal bədən temperaturu ovulyasiyadan dərhal sonra progesteronun təsiri ilə bir qədər (0,2–0,5°C) yüksəlir.',
      'O, hər səhər, yataqdan qalxmazdan əvvəl, həmişə eyni vaxtda və eyni termometrlə ölçülür.',
      'Bu, proqnozlaşdırıcı deyil, təsdiqləyici üsuldur: o, öz dövrünüzü daha yaxşı anlamağa kömək edir.',
      'Onu digər əlamətlərlə (uşaqlıq boynu mukusu, ovulyasiya testləri) birləşdirmək daha tam təsəvvür verir.',
    ],
    disclaimerText: 'Məlumat xarakterli məzmun. Bu məqalə fərdi tibbi məsləhəti əvəz etmir. Şübhə olarsa, tibb işçisindən məsləhət alın.',
    shareMessage: 'Bazal bədən temperaturunu izləmək — AWA',
  },
  ka: {
    badge: 'ფერტილობა • ბაზალური ტემპერატურა',
    title: 'თქვენი ბაზალური\nტემპერატურის კონტროლი',
    metaDuration: '6 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'საშუალო',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'მარტივი მეთოდი, რომელიც ოვულაციის მოხდენას შემდგომ ადასტურებს.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'რა არის ბაზალური ტემპერატურა?',
      'როდის და როგორ გავზომოთ',
      'ოვულაციის შემდგომი მატების შემჩნევა',
      'რამ შეიძლება გაზომვა დაამახინჯოს',
      'ამ მეთოდის შეზღუდვები',
      'როდის მივმართოთ სპეციალისტს',
      'მთავარი დასკვნები',
    ],
    section1Body: 'ბაზალური ტემპერატურა თქვენი სხეულის ტემპერატურაა სრული მოსვენების დროს, ნებისმიერ აქტივობამდე. ციკლის განმავლობაში ის ჰორმონების გავლენით ძალიან მცირედ იცვლება.',
    section2Body: 'ის ყოველ დილით იზომება, ადგომამდე, ყოველთვის ერთსა და იმავე დროს და ერთი და იმავე თერმომეტრით.',
    measuringTips: [
      {title: 'ერთი და იგივე თერმომეტრი', text: 'ყოველთვის ერთი და იმავე თერმომეტრი გამოიყენეთ, სასურველია ბაზალური (უფრო ზუსტი, გრადუსის მეათედამდე).'},
      {title: 'ერთი და იგივე დრო', text: 'გაზომეთ განსაზღვრულ დროს, ადგომამდე, მინიმუმ 3 საათის შეუწყვეტელი ძილის შემდეგ.'},
      {title: 'დაუყოვნებლივ ჩაიწერეთ', text: 'ჩაიწერეთ მაჩვენებელი დაუყოვნებლივ, ადგომამდე და ლაპარაკამდეც კი.'},
    ],
    section3Body: 'ბაზალური ტემპერატურა ოვულაციის შემდეგ პროგესტერონის ზემოქმედებით მცირედ იმატებს (0,2-დან 0,5°C-მდე) და შემდეგ მენსტრუაციამდე უფრო მაღალი რჩება.',
    curveTitle: 'როგორ გამოიყურება გრაფიკი',
    curveText: 'ციკლის პირველ ნაწილში უფრო დაბალია, ოვულაციის შემდეგ კი საფეხურისებრ იზრდება და ასე რჩება — სურათი ნათელი მხოლოდ რამდენიმე დღის გაზომვების შემდეგ ხდება.',
    disruptingFactors: [
      'მოკლე ან მოუსვენარი ღამის ძილი',
      'უჩვეულო დროს გაღვიძება',
      'ცხელება ან ავადმყოფობა',
      'ალკოჰოლი წინა საღამოს',
      'ახლახან დროის სარტყლის შეცვლა',
    ],
    section5Body: 'ეს პროგნოზირების არა, არამედ დადასტურების მეთოდია: ის გეხმარებათ საკუთარი ციკლის უკეთ გაგებაში მას შემდეგ, რაც ოვულაცია უკვე მოხდა — და არა მისი წინასწარ გამოცნობაში.',
    section5Caption: 'მხოლოდ ერთი ან ორი ციკლის დაკვირვება ხშირად საკმარისი არ არის: სურათი გამეორებასთან ერთად ჩნდება.',
    warningTitle: 'სპეციალისტთან ნახსენებად ღირს',
    consultSituations: [
      'რამდენიმე სრულ ციკლში ტემპერატურის მატება არ ჩანს',
      'ტემპერატურა ძალიან არარეგულარული რჩება ყურადღებიანი გაზომვის მიუხედავად',
      'თქვენს ფერტილობასთან დაკავშირებით გაქვთ შეკითხვები, რომელზეც ეს კონტროლი ვერ გიპასუხებთ',
    ],
    tipTitle: 'კარგია ვიცოდეთ',
    tipText: 'ბაზალური ტემპერატურის შერწყმა საშვილოსნოს ყელის ლორწოს დაკვირვებასთან ან ოვულაციის ტესტებთან თქვენი ციკლის უფრო სრულ სურათს გვაძლევს.',
    summaryPoints: [
      'ბაზალური ტემპერატურა ოვულაციის შემდეგ პროგესტერონის ზემოქმედებით მცირედ იმატებს (0,2-დან 0,5°C-მდე).',
      'ის ყოველ დილით იზომება, ადგომამდე, ყოველთვის ერთსა და იმავე დროს და ერთი და იმავე თერმომეტრით.',
      'ეს პროგნოზირების არა, არამედ დადასტურების მეთოდია: ის გეხმარებათ საკუთარი ციკლის უკეთ გაგებაში.',
      'სხვა ნიშნებთან (საშვილოსნოს ყელის ლორწო, ოვულაციის ტესტები) შერწყმა უფრო სრულ სურათს გვაძლევს.',
    ],
    disclaimerText: 'საინფორმაციო შინაარსი. ეს სტატია პერსონალიზებულ სამედიცინო რჩევას არ ანაცვლებს. ეჭვის შემთხვევაში მიმართეთ ჯანდაცვის სპეციალისტს.',
    shareMessage: 'ბაზალური ტემპერატურის კონტროლი — AWA',
  },
  hy: {
    badge: 'ՊՏՂԱԲԵՐՈՒԹՅՈՒՆ • ԲԱԶԱԼ ՋԵՐՄԱՍՏԻՃԱՆ',
    title: 'Բազալ ջերմաստիճանի\nհետևում',
    metaDuration: '6 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Միջին',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Պարզ մեթոդ՝ հետադարձ հաստատելու համար, որ ձվազատումը տեղի է ունեցել:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Ի՞նչ է բազալ ջերմաստիճանը:',
      'Երբ և ինչպես չափել այն',
      'Ձվազատումից հետո բարձրացման նկատումը',
      'Ինչը կարող է աղավաղել չափումը',
      'Այս մեթոդի սահմանափակումները',
      'Երբ խոսել մասնագետի հետ',
      'Հիմնական եզրակացություններ',
    ],
    section1Body: 'Բազալ ջերմաստիճանը ձեր մարմնի ջերմաստիճանն է լիակատար հանգստի վիճակում՝ ցանկացած գործունեությունից առաջ: Այն շատ թեթևակի փոխվում է ցիկլի ընթացքում՝ ձեր հորմոնների ազդեցությամբ:',
    section2Body: 'Այն չափվում է ամեն առավոտ՝ մահճակալից վեր կենալուց առաջ, միշտ նույն ժամին և նույն ջերմաչափով:',
    measuringTips: [
      {title: 'Նույն ջերմաչափը', text: 'Միշտ օգտագործեք նույն ջերմաչափը, նախընտրելի է՝ բազալը (ավելի ճշգրիտ, մինչև աստիճանի տասնորդական):'},
      {title: 'Նույն ժամը', text: 'Չափեք որոշակի ժամին՝ վեր կենալուց առաջ, առնվազն 3 ժամ անընդմեջ քնելուց հետո:'},
      {title: 'Գրեք անմիջապես', text: 'Գրանցեք ցուցմունքն անմիջապես՝ նույնիսկ վեր կենալուց կամ խոսելուց առաջ:'},
    ],
    section3Body: 'Բազալ ջերմաստիճանը թեթևակի բարձրանում է (0,2–0,5°C) ձվազատումից անմիջապես հետո՝ պրոգեստերոնի ազդեցությամբ, և մնում է բարձր մինչև հաջորդ դաշտանը:',
    curveTitle: 'Ինչպիսին է գրաֆիկը',
    curveText: 'Ցիկլի առաջին հատվածում ավելի ցածր լինելով՝ այն ձվազատումից հետո աստիճանաբար բարձրանում է և մնում այդ մակարդակում. օրինաչափությունը պարզ է դառնում միայն մի քանի օրվա չափումներից հետո:',
    disruptingFactors: [
      'Կարճ կամ անհանգիստ գիշերային քուն',
      'Անսովոր ժամին արթնանալը',
      'Ջերմություն կամ հիվանդություն',
      'Ալկոհոլ նախորդ երեկոյան',
      'Վերջերս ժամային գոտու փոփոխություն',
    ],
    section5Body: 'Սա կանխատեսող մեթոդ չէ, այլ հաստատող. այն օգնում է ավելի լավ հասկանալ ձեր սեփական ցիկլը, երբ ձվազատումը արդեն տեղի է ունեցել, և ոչ թե կանխատեսել այն:',
    section5Caption: 'Մեկ կամ երկու ցիկլի ընթացքում միայնակ դիտարկումը սովորաբար բավարար չէ. օրինաչափությունը հայտնվում է կրկնությամբ:',
    warningTitle: 'Արժե նշել մասնագետին',
    consultSituations: [
      'Մի քանի ամբողջական ցիկլերի ընթացքում ջերմաստիճանի բարձրացում չի երևում',
      'Ջերմաստիճանը մնում է շատ անկանոն՝ չնայած ուշադիր չափմանը',
      'Ունեք պտղաբերության վերաբերյալ հարցեր, որոնց այս հետևումը միայնակ չի կարող պատասխանել',
    ],
    tipTitle: 'Լավ է իմանալ',
    tipText: 'Բազալ ջերմաստիճանը արգանդի վզիկի լորձի դիտարկման կամ ձվազատման թեստերի հետ համադրելը տալիս է ձեր ցիկլի ավելի ամբողջական պատկերը:',
    summaryPoints: [
      'Բազալ ջերմաստիճանը թեթևակի բարձրանում է (0,2–0,5°C) ձվազատումից անմիջապես հետո՝ պրոգեստերոնի ազդեցությամբ:',
      'Այն չափվում է ամեն առավոտ՝ վեր կենալուց առաջ, միշտ նույն ժամին և նույն ջերմաչափով:',
      'Սա կանխատեսող մեթոդ չէ, այլ հաստատող. այն օգնում է ավելի լավ հասկանալ ձեր սեփական ցիկլը:',
      'Այլ նշանների (արգանդի վզիկի լորձ, ձվազատման թեստեր) հետ համադրելը տալիս է ավելի ամբողջական պատկեր:',
    ],
    disclaimerText: 'Տեղեկատվական բովանդակություն: Այս հոդվածը չի փոխարինում անհատականացված բժշկական խորհրդատվությանը: Կասկածի դեպքում դիմեք առողջապահության մասնագետի:',
    shareMessage: 'Բազալ ջերմաստիճանի հետևում — AWA',
  },
  tg: {
    badge: 'ҲОСИЛХЕЗӢ • ҲАРОРАТИ БАЗАЛИИ БАДАН',
    title: 'Пайгирии ҳарорати\nбазалии бадан',
    metaDuration: '6 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Миёна',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Усули оддӣ барои баъдан тасдиқ кардани он, ки овуляция рух додааст.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Ҳарорати базалии бадан чист?',
      'Кай ва чӣ тавр андоза гирифтан',
      'Дарёфти болоравӣ пас аз овуляция',
      'Чӣ метавонад хониши шуморо вайрон кунад',
      'Маҳдудиятҳои ин усул',
      'Кай бояд бо мутахассис гап зад',
      'Хулосаҳои асосӣ',
    ],
    section1Body: 'Ҳарорати базалии бадан ҳарорати бадани шумо дар оромии комил, пеш аз ҳар гуна фаъолият аст. Он дар давоми давра зери таъсири гормонҳо хеле андак тағйир меёбад.',
    section2Body: 'Он ҳар субҳ, пеш аз аз ҷо хестан, ҳамеша дар як вақт ва бо як ҳароратсанҷ андоза карда мешавад.',
    measuringTips: [
      {title: 'Як ҳароратсанҷ', text: 'Ҳамеша як ҳароратсанҷро истифода баред, беҳтараш базалӣ (дақиқтар, то як ҳиссаи даҳяки дараҷа).'},
      {title: 'Як вақт', text: 'Дар вақти муайян, пеш аз аз ҷо хестан, пас аз ақаллан 3 соат хоби бетанаффус андоза гиред.'},
      {title: 'Фавран сабт кунед', text: 'Хонишро фавран, ҳатто пеш аз аз ҷо хестан ё гап задан сабт кунед.'},
    ],
    section3Body: 'Ҳарорати базалии бадан ба қарибӣ пас аз овуляция зери таъсири прогестерон андаке (0,2 то 0,5°C) боло меравад ва то ҳайзи навбатӣ баландтар мемонад.',
    curveTitle: 'График чӣ гуна менамояд',
    curveText: 'Дар қисми аввали давра паст аст, пас аз овуляция як зина боло меравад ва дар ҳамон ҷо мемонад — ин намунаест, ки танҳо пас аз чанд рӯзи андозагирӣ рӯшан мегардад.',
    disruptingFactors: [
      'Хоби кӯтоҳ ё беқарор',
      'Бедор шудан дар вақти ғайриодатӣ',
      'Таб ё бемории дигар',
      'Машруботи спиртӣ шаби пеш',
      'Тағйири ба наздикӣ минтақаи вақт',
    ],
    section5Body: 'Ин усули пешгӯӣ нест, балки тасдиқкунанда аст: он ба шумо кумак мекунад давраи худро беҳтар бифаҳмед, пас аз он ки овуляция аллакай рух додааст — на барои пешбинии он.',
    section5Caption: 'Мушоҳидаи танҳо дар давоми як-ду давра одатан кифоя нест: намуна бо такрор пайдо мешавад.',
    warningTitle: 'Ба мутахассис гуфтан сазовор аст',
    consultSituations: [
      'Дар давоми чанд давраи пурра ягон болоравии ҳарорат пайдо намешавад',
      'Ҳароратҳо бо вуҷуди андозагирии бодиққат хеле номунтазам мемонанд',
      'Дар бораи ҳосилхезии худ саволҳое доред, ки ин пайгирии танҳо ба он ҷавоб дода наметавонад',
    ],
    tipTitle: 'Донистан хуб аст',
    tipText: 'Якҷоя кардани ҳарорати базалии бадан бо мушоҳидаи шилимшиқи гардани бачадон ё санҷишҳои овуляция тасвири пурратари давраи шуморо медиҳад.',
    summaryPoints: [
      'Ҳарорати базалии бадан дарҳол пас аз овуляция зери таъсири прогестерон андаке (0,2 то 0,5°C) боло меравад.',
      'Он ҳар субҳ, пеш аз аз ҷо хестан, ҳамеша дар як вақт ва бо як ҳароратсанҷ андоза карда мешавад.',
      'Ин усули пешгӯӣ нест, балки тасдиқкунанда аст: он ба шумо кумак мекунад давраи худро беҳтар бифаҳмед.',
      'Якҷоя кардани он бо нишонаҳои дигар (шилимшиқи гардани бачадон, санҷишҳои овуляция) тасвири пурратар медиҳад.',
    ],
    disclaimerText: 'Мазмуни иттилоотӣ. Ин мақола маслиҳати шахсии тиббиро иваз намекунад. Дар сурати шубҳа аз мутахассиси соҳаи тиб машварат пурсед.',
    shareMessage: 'Пайгирии ҳарорати базалии бадан — AWA',
  },
  ky: {
    badge: 'БОЙГО БҮТҮҮ • БАЗАЛДЫК ДЕНЕ ТЕМПЕРАТУРАСЫ',
    title: 'Базалдык дене температурасын\nкөзөмөлдөө',
    metaDuration: '6 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Орто',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Овуляция болгонун кийин ырастоонун жөнөкөй ыкмасы.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Базалдык дене температурасы деген эмне?',
      'Аны качан жана кантип өлчөө керек',
      'Овуляциядан кийинки көтөрүлүүнү байкоо',
      'Өлчөөнү эмне бурмалай алат',
      'Бул ыкманын чектөөлөрү',
      'Адис менен качан сүйлөшүү керек',
      'Негизги жыйынтыктар',
    ],
    section1Body: 'Базалдык дене температурасы — бул денеңиздин толук эс алуудагы, ар кандай активдүүлүктөн мурунку температурасы. Ал гормондорыңыздын таасири астында цикл бою өтө бир аз өзгөрөт.',
    section2Body: 'Аны күн сайын эртең менен, төшөктөн турардан мурун, ар дайым бир эле убакта жана бир эле термометр менен өлчөйт.',
    measuringTips: [
      {title: 'Бир эле термометр', text: 'Ар дайым бир эле термометрди колдонуңуз, мүмкүн болсо базалдык термометрди (так, градустун ондон бирине чейин).'},
      {title: 'Бир эле убакыт', text: 'Жок дегенде 3 саат үзгүлтүксүз уктагандан кийин, төшөктөн турардан мурун белгилүү бир убакта өлчөңүз.'},
      {title: 'Дароо жазып коюңуз', text: 'Төшөктөн турардан же сүйлөөдөн мурун эле көрсөткүчтү дароо жазып коюңуз.'},
    ],
    section3Body: 'Базалдык дене температурасы овуляциядан кийин эле прогестерондун таасири менен бир аз (0,2–0,5°C) көтөрүлөт жана кийинки етек киримге чейин жогору бойдон калат.',
    curveTitle: 'График кандай көрүнөт',
    curveText: 'Циклдин биринчи бөлүгүндө төмөн болуп, овуляциядан кийин кадам менен көтөрүлөт да ошол деңгээлде калат — бул мыйзам ченемдүүлүк бир нече күндүк өлчөөдөн кийин гана даана болот.',
    disruptingFactors: [
      'Кыска же тынчсыз уйку',
      'Адаттан тыш убакытта ойгонуу',
      'Ысытма же ооруу',
      'Мурунку күнү алкоголь',
      'Жакында убакыт алкактарынын өзгөрүшү',
    ],
    section5Body: 'Бул алдын ала айта турган эмес, тастыктай турган ыкма: ал овуляция болуп бүткөндөн кийин өз циклиңизди жакшыраак түшүнүүгө жардам берет — аны алдын ала билүү үчүн эмес.',
    section5Caption: 'Аны бир же эки цикл бою жалгыз байкоо көбүнчө жетишсиз: мыйзам ченемдүүлүк кайталангандан кийин ачылат.',
    warningTitle: 'Адисти билдирүүгө татыктуу учурлар',
    consultSituations: [
      'Бир нече толук цикл бою температуранын көтөрүлүшү байкалбайт',
      'Кылдат өлчөгөнгө карабастан температура өтө туруксуз бойдон калат',
      'Бойго бүтүү жөндөмдүүлүгүңүз боюнча суроолоруңуз бар, аларга бул көзөмөлдүн өзү жооп бере албайт',
    ],
    tipTitle: 'Билүү пайдалуу',
    tipText: 'Базалдык дене температурасын жатын моюнчасынын былжырын байкоо же овуляция тесттери менен айкалыштыруу циклиңиздин толук сүрөтүн берет.',
    summaryPoints: [
      'Базалдык дене температурасы овуляциядан кийин эле прогестерондун таасири менен бир аз (0,2–0,5°C) көтөрүлөт.',
      'Аны күн сайын эртең менен, төшөктөн турардан мурун, ар дайым бир эле убакта жана бир эле термометр менен өлчөйт.',
      'Бул алдын ала айта турган эмес, тастыктай турган ыкма: ал өз циклиңизди жакшыраак түшүнүүгө жардам берет.',
      'Аны башка белгилер (жатын моюнчасынын былжыры, овуляция тесттери) менен айкалыштыруу толугураак сүрөт берет.',
    ],
    disclaimerText: 'Маалымат берүүчү мазмун. Бул макала жекелештирилген медициналык кеңешти алмаштырбайт. Күмөн болсо, ден соолук сактоо адисинен кеңеш сураңыз.',
    shareMessage: 'Базалдык дене температурасын көзөмөлдөө — AWA',
  },
  tk: {
    badge: 'GÖWRELI BOLMAK UKYBY • BAZAL BEDEN TEMPERATURASY',
    title: 'Bazal beden temperaturasyny\nyzarlamak',
    metaDuration: '6 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Orta',
    metaValidated: 'Barlanan mazmun',
    intro: 'Ovulýasiýanyň bolandygyny soňundan tassyklamagyň ýönekeý usuly.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Bazal beden temperaturasy näme?',
      'Ony haçan we nähili ölçemeli',
      'Ovulýasiýadan soňky ýokarlanmany bellemek',
      'Ölçegi näme bulaşdyryp biler',
      'Bu usulyň çäkleri',
      'Hünärmen bilen haçan gürleşmeli',
      'Esasy netijeler',
    ],
    section1Body: 'Bazal beden temperaturasy — bedeniňiziň doly dynçda, islendik işjeňlikden öňki temperaturasy. Ol gormonlaryňyzyň täsiri astynda sikl dowamynda örän az üýtgeýär.',
    section2Body: 'Ony her irden, düşekden turmankaňyz, hemişe şol bir wagtda we şol bir termometr bilen ölçeýärler.',
    measuringTips: [
      {title: 'Şol bir termometr', text: 'Hemişe şol bir termometri ulanyň, mümkin bolsa bazal termometri (takyk, gradusyň ondan birine çenli).'},
      {title: 'Şol bir wagt', text: 'Iň az 3 sagat üzňüksiz uklandan soň, düşekden turmankaňyz belli bir wagtda ölçäň.'},
      {title: 'Derrew ýazyp goýuň', text: 'Düşekden turmankaňyz ýa-da gürlemänkäňiz ölçegi derrew ýazyp goýuň.'},
    ],
    section3Body: 'Bazal beden temperaturasy ovulýasiýadan soň progesteronyň täsiri bilen birneme (0,2–0,5°C) ýokarlanýar we indiki aýbaşa çenli ýokary galýar.',
    curveTitle: 'Grafik nähili görünýär',
    curveText: 'Siklin birinji böleginde pes bolup, ovulýasiýadan soň ädim bilen ýokarlanýar we şol derejede galýar — bu kanunalaýyklyk birnäçe günlük ölçegden soň aýdyň bolýar.',
    disruptingFactors: [
      'Gysga ýa-da biynjalyk uky',
      'Adaty däl wagtda oýanmak',
      'Ýokary gyzgyn ýa-da kesel',
      'Öňki gün alkogol',
      'Ýaňy wagt guşaklarynyň üýtgemegi',
    ],
    section5Body: 'Bu öňünden aýdýan däl, tassyklaýan usul: ol ovulýasiýa bolup geçenden soň öz sikliňizi has gowy düşünmäge ýardam berýär — ony öňünden bilmek üçin däl.',
    section5Caption: 'Ony bir ýa-da iki sikl dowamynda ýeke synlamak köplenç ýeterlik däl: kanunalaýyklyk gaýtalanandan soň aýdyňlaşýar.',
    warningTitle: 'Hünärmene aýtmaga mynasyp ýagdaýlar',
    consultSituations: [
      'Birnäçe doly sikl dowamynda temperaturanyň ýokarlanmasy bolmaýar',
      'Çylşyrymly ölçemäge garamazdan temperatura gaty durnuksyz galýar',
      'Göwreli bolmak ukybyňyz barada bu yzarlamanyň özi jogap berip bilmeýän soraglaryňyz bar',
    ],
    tipTitle: 'Bilmek peýdaly',
    tipText: 'Bazal beden temperaturasyny ýatgy boýnunyň ýaňsyny synlamak ýa-da ovulýasiýa synaglary bilen utgaşdyrmak sikliňiziň has doly suratyny berýär.',
    summaryPoints: [
      'Bazal beden temperaturasy ovulýasiýadan soň progesteronyň täsiri bilen birneme (0,2–0,5°C) ýokarlanýar.',
      'Ony her irden, düşekden turmankaňyz, hemişe şol bir wagtda we şol bir termometr bilen ölçeýärler.',
      'Bu öňünden aýdýan däl, tassyklaýan usul: ol öz sikliňizi has gowy düşünmäge ýardam berýär.',
      'Ony başga alamatlar (ýatgy boýnunyň ýaňsy, ovulýasiýa synaglary) bilen utgaşdyrmak has doly surat berýär.',
    ],
    disclaimerText: 'Maglumat berýän mazmun. Bu makala şahsylaşdyrylan lukmançylyk maslahatyny çalyşmaýar. Şübhe bolsa, saglyk hünärmeninden maslahat soraň.',
    shareMessage: 'Bazal beden temperaturasyny yzarlamak — AWA',
  },
} as const);

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
