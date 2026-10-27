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

const ID = 'lhtests-comprendre-tests-ovulation';

const HERO = require('../../assets/images/library/spm-consult.png');

/* -------------------------------------------------------------------------- */
/* DATA — icons stay language-neutral; TEXT moves into the bilingual CONTENT  */
/* object below, keyed by index to stay aligned with these icons.            */
/* -------------------------------------------------------------------------- */

const TESTING_TIP_ICONS = ['calendar-range', 'clock-outline', 'cup-water'] as const;

/* -------------------------------------------------------------------------- */
/* CONTENT — PHASE 7L bilingual editorial content. Article identity (ID,     */
/* images, bookmark/progress keys, JSX structure) is untouched; only this    */
/* object changes per language. The French text below is byte-identical to  */
/* the original — never retyped, only moved into the `fr` key — so the app  */
/* remains fully bilingual rather than having French replaced by English.   */
/* -------------------------------------------------------------------------- */

const CONTENT = withBrazilianPortuguese('LhTests', {
  fr: {
    badge: 'FERTILITÉ • TESTS D’OVULATION',
    title: 'Comprendre les tests\nd’ovulation (LH)',
    metaDuration: '6 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Intermédiaire',
    metaValidated: 'Contenu validé',
    intro: 'Comment fonctionnent ces bandelettes, et quand les utiliser.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Qu’est-ce que la LH ?',
      'Comment fonctionnent ces tests',
      'Quand commencer à tester',
      'Interpréter un résultat',
      'Faux positifs et limites',
      'Les combiner à d’autres signes',
      'À retenir',
    ],
    section1Body:
      'La LH (hormone lutéinisante) est produite par le cerveau et pilote le fonctionnement des ovaires. Les tests d’ovulation détectent le pic de cette hormone, qui déclenche la libération de l’ovule 24 à 36 heures après.',
    section2Body:
      'Une bandelette urinaire mesure le taux de LH : une ligne test aussi foncée ou plus foncée que la ligne de contrôle indique un pic.',
    section3Body:
      'Il est conseillé de commencer les tests quelques jours avant la date d’ovulation estimée par ton cycle.',
    testingTips: [
      {
        title: 'Se baser sur ton cycle',
        text: 'Commence quelques jours avant la date d’ovulation estimée par la longueur moyenne de tes cycles.',
      },
      {
        title: 'Tester à heure fixe',
        text: 'Idéalement en milieu de journée, en évitant la première urine du matin.',
      },
      {
        title: 'Éviter de trop diluer',
        text: 'Limite les grandes quantités de boisson dans les heures qui précèdent le test.',
      },
    ],
    section4Body:
      'Un résultat positif signale le moment le plus fertile pour les rapports dans les 1 à 2 jours qui suivent. Un résultat négatif signifie simplement que le pic n’a pas encore eu lieu.',
    limitations: [
      'Le SOPK peut donner des taux de LH naturellement plus élevés, brouillant la lecture',
      'Certains traitements de fertilité peuvent influencer le résultat',
      'Une urine très diluée peut donner un faux négatif',
      'Un test de moins bonne qualité peut être moins fiable',
    ],
    infoTitle: 'À garder en tête',
    infoText:
      'Un pic de LH indique un signal hormonal déclencheur, mais ne garantit pas à lui seul que l’ovule a effectivement été libéré.',
    tipTitle: 'Bon à savoir',
    tipText:
      'Associer les tests d’ovulation à ta température basale ou à l’observation de ta glaire cervicale donne une image plus complète de ton cycle.',
    summaryPoints: [
      'Les tests d’ovulation détectent le pic de l’hormone LH, qui déclenche la libération de l’ovule 24 à 36 heures après.',
      'Il est conseillé de commencer les tests quelques jours avant la date d’ovulation estimée par ton cycle.',
      'Un résultat positif signale le moment le plus fertile pour les rapports dans les 1 à 2 jours qui suivent.',
      'Un pic de LH ne garantit pas à lui seul que l’ovulation a effectivement eu lieu.',
    ],
    disclaimerText:
      'Contenu informatif. Cet article ne remplace pas un avis médical personnalisé. En cas de doute, demande conseil à un professionnel de santé.',
    shareMessage: 'Comprendre les tests d’ovulation (LH) — AWA',
  },
  en: {
    badge: 'FERTILITY • OVULATION TESTS',
    title: 'Understanding ovulation\ntests (LH)',
    metaDuration: '6 min read',
    metaType: 'Guide',
    metaLevel: 'Intermediate',
    metaValidated: 'Reviewed content',
    intro: 'How these strips work, and when to use them.',
    contentsTitle: 'In this article',
    topics: [
      'What is LH?',
      'How these tests work',
      'When to start testing',
      'Interpreting a result',
      'False positives and limitations',
      'Combining them with other signs',
      'Key takeaways',
    ],
    section1Body:
      'LH (luteinizing hormone) is produced by the brain and controls how the ovaries function. Ovulation tests detect the surge in this hormone, which triggers the release of the egg 24 to 36 hours later.',
    section2Body:
      'A urine test strip measures LH levels: a test line as dark as or darker than the control line indicates a surge.',
    section3Body:
      'It’s recommended to start testing a few days before the ovulation date estimated from your cycle.',
    testingTips: [
      {
        title: 'Base it on your cycle',
        text: 'Start a few days before the ovulation date estimated from the average length of your cycles.',
      },
      {
        title: 'Test at the same time each day',
        text: 'Ideally around midday, avoiding your first urine of the morning.',
      },
      {
        title: 'Avoid diluting your urine',
        text: 'Limit large amounts of fluids in the hours before the test.',
      },
    ],
    section4Body:
      'A positive result signals the most fertile time for intercourse over the following 1 to 2 days. A negative result simply means the surge hasn’t happened yet.',
    limitations: [
      'PCOS can cause naturally higher LH levels, which can blur the reading',
      'Certain fertility treatments can affect the result',
      'Very diluted urine can give a false negative',
      'A lower-quality test can be less reliable',
    ],
    infoTitle: 'Keep in mind',
    infoText:
      'An LH surge indicates a triggering hormonal signal, but on its own it doesn’t guarantee that the egg was actually released.',
    tipTitle: 'Good to know',
    tipText:
      'Combining ovulation tests with your basal body temperature or cervical mucus observation gives a fuller picture of your cycle.',
    summaryPoints: [
      'Ovulation tests detect the LH surge, which triggers the release of the egg 24 to 36 hours later.',
      'It’s recommended to start testing a few days before the ovulation date estimated from your cycle.',
      'A positive result signals the most fertile time for intercourse over the following 1 to 2 days.',
      'An LH surge on its own doesn’t guarantee that ovulation actually occurred.',
    ],
    disclaimerText:
      'Informational content. This article does not replace personalized medical advice. If in doubt, seek guidance from a healthcare professional.',
    shareMessage: 'Understanding ovulation tests (LH) — AWA',
  },
  es: {
    badge: 'FERTILIDAD • PRUEBAS DE OVULACIÓN',
    title: 'Comprender las pruebas\nde ovulación (LH)',
    metaDuration: '6 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenido validado',
    intro: 'Cómo funcionan estas tiras, y cuándo usarlas.',
    contentsTitle: 'En este artículo',
    topics: [
      '¿Qué es la LH?',
      'Cómo funcionan estas pruebas',
      'Cuándo empezar a hacerte las pruebas',
      'Interpretar un resultado',
      'Falsos positivos y límites',
      'Combinarlas con otras señales',
      'Para recordar',
    ],
    section1Body:
      'La LH (hormona luteinizante) es producida por el cerebro y controla el funcionamiento de los ovarios. Las pruebas de ovulación detectan el pico de esta hormona, que desencadena la liberación del óvulo entre 24 y 36 horas después.',
    section2Body:
      'Una tira de orina mide el nivel de LH: una línea de prueba tan oscura o más oscura que la línea de control indica un pico.',
    section3Body:
      'Se recomienda empezar las pruebas unos días antes de la fecha de ovulación estimada según tu ciclo.',
    testingTips: [
      {
        title: 'Basarte en tu ciclo',
        text: 'Empieza unos días antes de la fecha de ovulación estimada según la duración media de tus ciclos.',
      },
      {
        title: 'Probar a una hora fija',
        text: 'Idealmente a mediodía, evitando la primera orina de la mañana.',
      },
      {
        title: 'Evitar diluir demasiado',
        text: 'Limita las grandes cantidades de líquido en las horas previas a la prueba.',
      },
    ],
    section4Body:
      'Un resultado positivo señala el momento más fértil para las relaciones sexuales en el 1 o 2 días siguientes. Un resultado negativo simplemente significa que el pico aún no ha ocurrido.',
    limitations: [
      'El SOP puede dar niveles de LH naturalmente más altos, lo que dificulta la lectura',
      'Algunos tratamientos de fertilidad pueden influir en el resultado',
      'Una orina muy diluida puede dar un falso negativo',
      'Una prueba de menor calidad puede ser menos fiable',
    ],
    infoTitle: 'Ten en cuenta',
    infoText:
      'Un pico de LH indica una señal hormonal desencadenante, pero por sí solo no garantiza que el óvulo se haya liberado realmente.',
    tipTitle: 'Dato útil',
    tipText:
      'Combinar las pruebas de ovulación con tu temperatura basal o con la observación de tu moco cervical te da una imagen más completa de tu ciclo.',
    summaryPoints: [
      'Las pruebas de ovulación detectan el pico de la hormona LH, que desencadena la liberación del óvulo entre 24 y 36 horas después.',
      'Se recomienda empezar las pruebas unos días antes de la fecha de ovulación estimada según tu ciclo.',
      'Un resultado positivo señala el momento más fértil para las relaciones sexuales en el 1 o 2 días siguientes.',
      'Un pico de LH por sí solo no garantiza que la ovulación haya ocurrido realmente.',
    ],
    disclaimerText:
      'Contenido informativo. Este artículo no sustituye una opinión médica personalizada. Si tienes dudas, consulta a un profesional de la salud.',
    shareMessage: 'Comprender las pruebas de ovulación (LH) — AWA',
  },
  it: {
    badge: 'FERTILITÀ • TEST DI OVULAZIONE',
    title: 'Capire i test\ndi ovulazione (LH)',
    metaDuration: '6 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenuto validato',
    intro: 'Come funzionano queste strisce e quando usarle.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Che cos’è l’LH?',
      'Come funzionano questi test',
      'Quando iniziare a fare il test',
      'Interpretare un risultato',
      'Falsi positivi e limiti',
      'Abbinarli ad altri segnali',
      'Punti chiave',
    ],
    section1Body: 'L’LH (ormone luteinizzante) è prodotto dal cervello e regola il funzionamento delle ovaie. I test di ovulazione rilevano il picco di questo ormone, che innesca il rilascio dell’ovulo da 24 a 36 ore dopo.',
    section2Body: 'Una striscia reattiva sulle urine misura i livelli di LH: una linea del test scura quanto la linea di controllo, o più scura, indica un picco.',
    section3Body: 'Si consiglia di iniziare a fare il test qualche giorno prima della data di ovulazione stimata in base al tuo ciclo.',
    testingTips: [
      {
        title: 'Parti dal tuo ciclo',
        text: 'Inizia qualche giorno prima della data di ovulazione stimata in base alla durata media dei tuoi cicli.',
      },
      {
        title: 'Fai il test alla stessa ora ogni giorno',
        text: 'Idealmente verso mezzogiorno, evitando le prime urine del mattino.',
      },
      {
        title: 'Evita di diluire le urine',
        text: 'Limita le grandi quantità di liquidi nelle ore che precedono il test.',
      },
    ],
    section4Body: 'Un risultato positivo indica il momento più fertile per avere rapporti nei 1-2 giorni successivi. Un risultato negativo significa semplicemente che il picco non c’è ancora stato.',
    limitations: [
      'La PCOS può causare livelli di LH naturalmente più alti, che possono falsare la lettura',
      'Alcuni trattamenti per la fertilità possono influire sul risultato',
      'Urine molto diluite possono dare un falso negativo',
      'Un test di qualità inferiore può essere meno affidabile',
    ],
    infoTitle: 'Da tenere a mente',
    infoText: 'Un picco di LH indica un segnale ormonale di innesco, ma da solo non garantisce che l’ovulo sia stato effettivamente rilasciato.',
    tipTitle: 'Da sapere',
    tipText: 'Abbinare i test di ovulazione alla temperatura basale o all’osservazione del muco cervicale offre un quadro più completo del tuo ciclo.',
    summaryPoints: [
      'I test di ovulazione rilevano il picco di LH, che innesca il rilascio dell’ovulo da 24 a 36 ore dopo.',
      'Si consiglia di iniziare a fare il test qualche giorno prima della data di ovulazione stimata in base al tuo ciclo.',
      'Un risultato positivo indica il momento più fertile per avere rapporti nei 1-2 giorni successivi.',
      'Un picco di LH da solo non garantisce che l’ovulazione sia effettivamente avvenuta.',
    ],
    disclaimerText: 'Contenuto informativo. Questo articolo non sostituisce un parere medico personalizzato. In caso di dubbi, rivolgiti a un professionista sanitario.',
    shareMessage: 'Capire i test di ovulazione (LH) — AWA',
  },
  tr: {
    badge: 'DOĞURGANLIK • OVÜLASYON TESTLERİ',
    title: 'Ovülasyon testlerini (LH)\nanlamak',
    metaDuration: '6 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Orta düzey',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Bu test şeritleri nasıl çalışır ve ne zaman kullanılmalı?',
    contentsTitle: 'Bu makalede',
    topics: [
      'LH nedir?',
      'Bu testler nasıl çalışır?',
      'Teste ne zaman başlanmalı?',
      'Sonucu yorumlamak',
      'Yanlış pozitifler ve sınırlamalar',
      'Diğer belirtilerle birlikte kullanmak',
      'Akılda kalacaklar',
    ],
    section1Body: 'LH (luteinleştirici hormon) beyin tarafından üretilir ve yumurtalıkların işleyişini kontrol eder. Ovülasyon testleri, bu hormondaki ani yükselişi saptar; bu yükseliş, 24 ile 36 saat sonra yumurtanın salınmasını tetikler.',
    section2Body: 'İdrar test şeridi LH düzeyini ölçer: kontrol çizgisi kadar koyu veya ondan daha koyu bir test çizgisi, hormonda ani bir yükselişe işaret eder.',
    section3Body: 'Testlere, döngüne göre tahmin edilen yumurtlama tarihinden birkaç gün önce başlaman önerilir.',
    testingTips: [
      {
        title: 'Döngünü temel al',
        text: 'Döngülerinin ortalama uzunluğuna göre tahmin edilen yumurtlama tarihinden birkaç gün önce başla.',
      },
      {
        title: 'Her gün aynı saatte test yap',
        text: 'İdeal olarak öğlen civarında yap; sabahın ilk idrarından kaçın.',
      },
      {
        title: 'İdrarını seyreltmekten kaçın',
        text: 'Testten önceki saatlerde çok miktarda sıvı almayı sınırla.',
      },
    ],
    section4Body: 'Pozitif bir sonuç, takip eden 1 ile 2 gün boyunca cinsel ilişki için en verimli zamanı gösterir. Negatif bir sonuç ise yalnızca hormondaki yükselişin henüz gerçekleşmediği anlamına gelir.',
    limitations: [
      'PKOS doğal olarak daha yüksek LH düzeylerine yol açabilir ve bu da okumayı belirsizleştirebilir',
      'Bazı doğurganlık tedavileri sonucu etkileyebilir',
      'Çok seyreltilmiş idrar yanlış negatif sonuç verebilir',
      'Daha düşük kaliteli bir test daha az güvenilir olabilir',
    ],
    infoTitle: 'Aklında bulunsun',
    infoText: 'LH yükselişi tetikleyici bir hormonal sinyale işaret eder, ancak tek başına yumurtanın gerçekten salındığını garanti etmez.',
    tipTitle: 'Bilmekte fayda var',
    tipText: 'Ovülasyon testlerini bazal vücut sıcaklığın veya servikal mukus gözlemiyle birlikte kullanmak, döngün hakkında daha eksiksiz bir tablo sunar.',
    summaryPoints: [
      'Ovülasyon testleri, 24 ile 36 saat sonra yumurtanın salınmasını tetikleyen LH yükselişini saptar.',
      'Testlere, döngüne göre tahmin edilen yumurtlama tarihinden birkaç gün önce başlaman önerilir.',
      'Pozitif bir sonuç, takip eden 1 ile 2 gün boyunca cinsel ilişki için en verimli zamanı gösterir.',
      'LH yükselişi tek başına yumurtlamanın gerçekten gerçekleştiğini garanti etmez.',
    ],
    disclaimerText: 'Bilgilendirme amaçlı içerik. Bu makale kişiye özel tıbbi tavsiyenin yerini tutmaz. Şüphen varsa bir sağlık profesyonelinden yönlendirme iste.',
    shareMessage: 'Ovülasyon testlerini (LH) anlamak — AWA',
  },
  ru: {
    badge: 'ФЕРТИЛЬНОСТЬ • ТЕСТЫ НА ОВУЛЯЦИЮ',
    title: 'Понимаем тесты\nна овуляцию (ЛГ)',
    metaDuration: '6 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Средний уровень',
    metaValidated: 'Проверенный материал',
    intro: 'Как работают эти тест-полоски и когда ими пользоваться.',
    contentsTitle: 'В этой статье',
    topics: [
      'Что такое ЛГ?',
      'Как работают эти тесты',
      'Когда начинать тестирование',
      'Как интерпретировать результат',
      'Ложноположительные результаты и ограничения',
      'Сочетание с другими признаками',
      'Главное',
    ],
    section1Body:
      'ЛГ (лютеинизирующий гормон) вырабатывается в головном мозге и регулирует работу яичников. Тесты на овуляцию определяют резкий всплеск этого гормона, который запускает выход яйцеклетки через 24–36 часов.',
    section2Body:
      'Тест-полоска измеряет уровень ЛГ в моче: тестовая линия, такая же тёмная, как контрольная, или темнее её, указывает на всплеск.',
    section3Body:
      'Рекомендуется начинать тестирование за несколько дней до даты овуляции, рассчитанной по вашему циклу.',
    testingTips: [
      {
        title: 'Ориентируйтесь на свой цикл',
        text: 'Начинайте за несколько дней до даты овуляции, рассчитанной по средней продолжительности ваших циклов.',
      },
      {
        title: 'Тестируйтесь каждый день в одно и то же время',
        text: 'Лучше всего около полудня, избегая первой утренней порции мочи.',
      },
      {
        title: 'Не разбавляйте мочу',
        text: 'Ограничьте приём большого количества жидкости в часы перед тестом.',
      },
    ],
    section4Body:
      'Положительный результат указывает на наиболее фертильное время для полового акта в течение следующих 1–2 дней. Отрицательный результат означает лишь то, что всплеск ещё не произошёл.',
    limitations: [
      'СПКЯ может вызывать естественно повышенный уровень ЛГ, что способно затруднить интерпретацию',
      'Некоторые виды лечения бесплодия могут влиять на результат',
      'Сильно разбавленная моча может дать ложноотрицательный результат',
      'Тест более низкого качества может быть менее надёжным',
    ],
    infoTitle: 'Важно помнить',
    infoText:
      'Всплеск ЛГ — это запускающий гормональный сигнал, но сам по себе он не гарантирует, что яйцеклетка действительно вышла.',
    tipTitle: 'Полезно знать',
    tipText:
      'Сочетание тестов на овуляцию с измерением базальной температуры или наблюдением за цервикальной слизью даёт более полную картину вашего цикла.',
    summaryPoints: [
      'Тесты на овуляцию определяют всплеск ЛГ, который запускает выход яйцеклетки через 24–36 часов.',
      'Рекомендуется начинать тестирование за несколько дней до даты овуляции, рассчитанной по вашему циклу.',
      'Положительный результат указывает на наиболее фертильное время для полового акта в течение следующих 1–2 дней.',
      'Всплеск ЛГ сам по себе не гарантирует, что овуляция действительно произошла.',
    ],
    disclaimerText:
      'Информационный материал. Эта статья не заменяет индивидуальную медицинскую консультацию. При сомнениях обратитесь за советом к медицинскому специалисту.',
    shareMessage: 'Понимаем тесты на овуляцию (ЛГ) — AWA',
  },
  de: {
    badge: 'FRUCHTBARKEIT • OVULATIONSTESTS',
    title: 'Ovulationstests\n(LH) verstehen',
    metaDuration: '6 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Fortgeschritten',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Wie diese Teststreifen funktionieren und wann du sie anwenden kannst.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Was ist LH?',
      'Wie diese Tests funktionieren',
      'Wann du mit dem Testen beginnen solltest',
      'Ein Ergebnis deuten',
      'Falsch-positive Ergebnisse und Grenzen',
      'Kombination mit anderen Anzeichen',
      'Das Wichtigste in Kürze',
    ],
    section1Body:
      'LH (luteinisierendes Hormon) wird vom Gehirn gebildet und steuert die Funktion der Eierstöcke. Ovulationstests erkennen den Anstieg dieses Hormons, der 24 bis 36 Stunden später die Freisetzung der Eizelle auslöst.',
    section2Body:
      'Ein Urin-Teststreifen misst den LH-Wert: Eine Testlinie, die so dunkel wie die Kontrolllinie oder dunkler ist, zeigt einen Anstieg an.',
    section3Body:
      'Es wird empfohlen, einige Tage vor dem Eisprungtermin zu beginnen, der aus deinem Zyklus geschätzt wird.',
    testingTips: [
      {
        title: 'Richte dich nach deinem Zyklus',
        text: 'Beginne einige Tage vor dem Eisprungtermin, der anhand der durchschnittlichen Länge deiner Zyklen geschätzt wird.',
      },
      {
        title: 'Täglich zur gleichen Zeit testen',
        text: 'Am besten gegen Mittag, und nicht mit dem ersten Morgenurin.',
      },
      {
        title: 'Urin nicht verdünnen',
        text: 'Trinke in den Stunden vor dem Test nicht zu große Flüssigkeitsmengen.',
      },
    ],
    section4Body:
      'Ein positives Ergebnis weist auf die fruchtbarste Zeit für Geschlechtsverkehr in den folgenden 1 bis 2 Tagen hin. Ein negatives Ergebnis bedeutet lediglich, dass der Anstieg noch nicht stattgefunden hat.',
    limitations: [
      'PCOS kann zu natürlicherweise höheren LH-Werten führen, was die Auswertung verwischen kann',
      'Bestimmte Fruchtbarkeitsbehandlungen können das Ergebnis beeinflussen',
      'Sehr verdünnter Urin kann ein falsch-negatives Ergebnis liefern',
      'Ein Test von geringerer Qualität kann weniger zuverlässig sein',
    ],
    infoTitle: 'Gut zu beachten',
    infoText:
      'Ein LH-Anstieg zeigt ein auslösendes hormonelles Signal an, garantiert für sich allein aber nicht, dass die Eizelle tatsächlich freigesetzt wurde.',
    tipTitle: 'Gut zu wissen',
    tipText:
      'Wenn du Ovulationstests mit deiner Basaltemperatur oder der Beobachtung deines Zervixschleims kombinierst, erhältst du ein vollständigeres Bild deines Zyklus.',
    summaryPoints: [
      'Ovulationstests erkennen den LH-Anstieg, der 24 bis 36 Stunden später die Freisetzung der Eizelle auslöst.',
      'Es wird empfohlen, einige Tage vor dem aus deinem Zyklus geschätzten Eisprungtermin mit dem Testen zu beginnen.',
      'Ein positives Ergebnis weist auf die fruchtbarste Zeit für Geschlechtsverkehr in den folgenden 1 bis 2 Tagen hin.',
      'Ein LH-Anstieg allein garantiert nicht, dass der Eisprung tatsächlich stattgefunden hat.',
    ],
    disclaimerText:
      'Informationsinhalt. Dieser Artikel ersetzt keine persönliche ärztliche Beratung. Bei Zweifeln lass dich von medizinischem Fachpersonal beraten.',
    shareMessage: 'Ovulationstests (LH) verstehen – AWA',
  },
  zh: {
      badge: '生育力 • 排卵试纸',
      title: '了解排卵试纸\n（LH 检测）',
      metaDuration: '阅读约 6 分钟',
      metaType: '指南',
      metaLevel: '进阶',
      metaValidated: '已审核内容',
      intro: '这些试纸是怎么起作用的，以及什么时候使用。',
      contentsTitle: '本文内容',
      topics: [
        '什么是 LH？',
        '这些检测如何起作用',
        '什么时候开始检测',
        '如何解读结果',
        '假阳性与局限',
        '与其他表现结合使用',
        '要点回顾',
      ],
      section1Body: 'LH（黄体生成素）由大脑分泌，调控卵巢的功能。排卵试纸检测的是这种激素的峰值，它会在 24 到 36 小时后促使卵子排出。',
      section2Body: '尿液试纸可以检测 LH 水平：检测线与对照线一样深或比对照线更深，就表示出现了峰值。',
      section3Body: '建议在根据你的周期估算出的排卵日之前几天开始检测。',
      testingTips: [
        {
          title: '根据你的周期来安排',
          text: '在根据你周期的平均长度估算出的排卵日之前几天开始。',
        },
        {
          title: '每天在同一时间检测',
          text: '最好在中午前后，避开早晨的第一次尿液。',
        },
        {
          title: '避免稀释尿液',
          text: '检测前的几个小时里，不要一次喝大量的水。',
        },
      ],
      section4Body: '结果呈阳性，表示接下来 1 到 2 天是同房受孕机会最高的时期。结果呈阴性，只是说明峰值还没有出现。',
      limitations: [
        'PCOS 可能使 LH 水平天然偏高，从而让读数变得模糊',
        '某些促孕治疗可能影响结果',
        '尿液过度稀释可能导致假阴性',
        '质量较差的试纸可能不够可靠',
      ],
      infoTitle: '请记住',
      infoText: 'LH 峰值表示出现了触发排卵的激素信号，但仅凭它并不能保证卵子真的已经排出。',
      tipTitle: '小贴士',
      tipText: '把排卵试纸与基础体温或宫颈黏液的观察结合起来，可以更完整地了解你的周期。',
      summaryPoints: [
        '排卵试纸检测的是 LH 峰值，它会在 24 到 36 小时后促使卵子排出。',
        '建议在根据你的周期估算出的排卵日之前几天开始检测。',
        '结果呈阳性，表示接下来 1 到 2 天是同房受孕机会最高的时期。',
        '仅凭 LH 峰值，并不能保证排卵确实发生。',
      ],
      disclaimerText: '仅供参考。本文不能替代个性化的医疗建议。如有疑问，请向医疗专业人员寻求指导。',
      shareMessage: '了解排卵试纸（LH 检测） — AWA',
    },
  id: {
    badge: 'KESUBURAN • TES OVULASI',
    title: 'Memahami tes\novulasi (LH)',
    metaDuration: '6 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Menengah',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Cara kerja strip ini, dan kapan menggunakannya.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Apa itu LH?',
      'Cara kerja tes ini',
      'Kapan mulai melakukan tes',
      'Membaca hasil tes',
      'Hasil positif palsu dan keterbatasannya',
      'Menggabungkannya dengan tanda lain',
      'Poin penting',
    ],
    section1Body: 'LH (hormon luteinisasi) dihasilkan oleh otak dan mengatur cara kerja ovarium. Tes ovulasi mendeteksi lonjakan hormon ini, yang memicu pelepasan sel telur 24 hingga 36 jam kemudian.',
    section2Body: 'Strip tes urine mengukur kadar LH: garis tes yang sama gelap atau lebih gelap daripada garis kontrol menandakan adanya lonjakan.',
    section3Body: 'Disarankan untuk mulai melakukan tes beberapa hari sebelum tanggal ovulasi yang diperkirakan dari siklusmu.',
    testingTips: [
      {
        title: 'Sesuaikan dengan siklusmu',
        text: 'Mulai beberapa hari sebelum tanggal ovulasi yang diperkirakan dari rata-rata panjang siklusmu.',
      },
      {
        title: 'Tes pada jam yang sama setiap hari',
        text: 'Idealnya sekitar tengah hari, hindari urine pertama di pagi hari.',
      },
      {
        title: 'Hindari mengencerkan urine',
        text: 'Batasi minum dalam jumlah besar pada beberapa jam sebelum tes.',
      },
    ],
    section4Body: 'Hasil positif menandakan waktu paling subur untuk berhubungan intim dalam 1 hingga 2 hari berikutnya. Hasil negatif hanya berarti lonjakan belum terjadi.',
    limitations: [
      'PCOS dapat menyebabkan kadar LH yang secara alami lebih tinggi, sehingga hasil bisa menjadi kabur',
      'Beberapa terapi kesuburan dapat memengaruhi hasil',
      'Urine yang sangat encer dapat memberi hasil negatif palsu',
      'Tes dengan kualitas lebih rendah bisa kurang andal',
    ],
    infoTitle: 'Perlu diingat',
    infoText: 'Lonjakan LH menunjukkan adanya sinyal hormonal pemicu, tetapi dengan sendirinya tidak menjamin bahwa sel telur benar-benar telah dilepaskan.',
    tipTitle: 'Perlu diketahui',
    tipText: 'Menggabungkan tes ovulasi dengan suhu tubuh basal atau pengamatan lendir serviks memberi gambaran siklusmu yang lebih lengkap.',
    summaryPoints: [
      'Tes ovulasi mendeteksi lonjakan LH, yang memicu pelepasan sel telur 24 hingga 36 jam kemudian.',
      'Disarankan untuk mulai melakukan tes beberapa hari sebelum tanggal ovulasi yang diperkirakan dari siklusmu.',
      'Hasil positif menandakan waktu paling subur untuk berhubungan intim dalam 1 hingga 2 hari berikutnya.',
      'Lonjakan LH saja tidak menjamin bahwa ovulasi benar-benar terjadi.',
    ],
    disclaimerText: 'Konten informatif. Artikel ini tidak menggantikan saran medis yang dipersonalisasi. Jika ragu, mintalah bimbingan dari tenaga kesehatan.',
    shareMessage: 'Memahami tes ovulasi (LH) — AWA',
  },
  hi: {
    badge: 'प्रजनन क्षमता • ओव्यूलेशन टेस्ट',
    title: 'ओव्यूलेशन टेस्ट (LH)\nको समझें',
    metaDuration: '6 मिनट का पाठ',
    metaType: 'गाइड',
    metaLevel: 'मध्यम',
    metaValidated: 'समीक्षा किया गया कंटेंट',
    intro: 'ये स्ट्रिप कैसे काम करती हैं, और इन्हें कब इस्तेमाल करें।',
    contentsTitle: 'इस लेख में',
    topics: [
      'LH क्या है?',
      'ये टेस्ट कैसे काम करते हैं',
      'टेस्ट कब शुरू करें',
      'नतीजे को कैसे समझें',
      'गलत पॉज़िटिव और सीमाएँ',
      'दूसरे संकेतों के साथ जोड़ना',
      'मुख्य बातें',
    ],
    section1Body: 'LH (ल्यूटिनाइज़िंग हार्मोन) दिमाग में बनता है और अंडाशय के काम को नियंत्रित करता है। ओव्यूलेशन (अंडोत्सर्ग) टेस्ट इस हार्मोन में आने वाले उछाल को पकड़ते हैं, जिसके 24 से 36 घंटे बाद अंडा निकलता है।',
    section2Body: 'यूरिन टेस्ट स्ट्रिप LH का स्तर मापती है: अगर टेस्ट लाइन कंट्रोल लाइन जितनी गहरी या उससे ज़्यादा गहरी हो, तो यह उछाल का संकेत है।',
    section3Body: 'आपके चक्र से अनुमानित ओव्यूलेशन की तारीख़ से कुछ दिन पहले टेस्ट शुरू करने की सलाह दी जाती है।',
    testingTips: [
      {
        title: 'अपने चक्र को आधार बनाएँ',
        text: 'अपने चक्रों की औसत अवधि से अनुमानित ओव्यूलेशन की तारीख़ से कुछ दिन पहले शुरू करें।',
      },
      {
        title: 'रोज़ एक ही समय पर टेस्ट करें',
        text: 'आदर्श रूप से दोपहर के आसपास, सुबह के पहले यूरिन से बचते हुए।',
      },
      {
        title: 'यूरिन को पतला होने से बचाएँ',
        text: 'टेस्ट से पहले के घंटों में बहुत ज़्यादा तरल पदार्थ लेने से बचें।',
      },
    ],
    section4Body: 'पॉज़िटिव नतीजा अगले 1 से 2 दिनों में संभोग के लिए सबसे उपजाऊ समय का संकेत देता है। नेगेटिव नतीजे का मतलब बस इतना है कि उछाल अभी नहीं आया है।',
    limitations: [
      'पॉलीसिस्टिक ओवरी सिंड्रोम (PCOS) में LH का स्तर स्वाभाविक रूप से ज़्यादा हो सकता है, जिससे नतीजा समझना मुश्किल हो सकता है',
      'प्रजनन क्षमता के कुछ इलाज नतीजे को प्रभावित कर सकते हैं',
      'बहुत पतला यूरिन गलत नेगेटिव नतीजा दे सकता है',
      'कम गुणवत्ता वाला टेस्ट कम भरोसेमंद हो सकता है',
    ],
    infoTitle: 'याद रखें',
    infoText: 'LH का उछाल एक हार्मोनल संकेत दिखाता है, लेकिन अकेले इससे यह पक्का नहीं होता कि अंडा सच में निकल चुका है।',
    tipTitle: 'जानना अच्छा रहेगा',
    tipText: 'ओव्यूलेशन टेस्ट को अपने बेसल तापमान या सर्वाइकल म्यूकस के अवलोकन के साथ जोड़ने से आपके चक्र की ज़्यादा पूरी तस्वीर मिलती है।',
    summaryPoints: [
      'ओव्यूलेशन टेस्ट LH के उछाल को पकड़ते हैं, जिसके 24 से 36 घंटे बाद अंडा निकलता है।',
      'आपके चक्र से अनुमानित ओव्यूलेशन की तारीख़ से कुछ दिन पहले टेस्ट शुरू करने की सलाह दी जाती है।',
      'पॉज़िटिव नतीजा अगले 1 से 2 दिनों में संभोग के लिए सबसे उपजाऊ समय का संकेत देता है।',
      'अकेले LH का उछाल यह पक्का नहीं करता कि ओव्यूलेशन सच में हुआ है।',
    ],
    disclaimerText: 'यह जानकारी सिर्फ़ सामान्य जानकारी के लिए है। यह लेख व्यक्तिगत चिकित्सकीय सलाह का विकल्प नहीं है। संदेह होने पर किसी स्वास्थ्य विशेषज्ञ से सलाह लें।',
    shareMessage: 'ओव्यूलेशन टेस्ट (LH) को समझें — AWA',
  },
  sq: {
    badge: 'PJELLORIA • TESTET E OVULACIONIT',
    title: 'Të kuptosh testet\ne ovulacionit (LH)',
    metaDuration: '6 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Mesatar',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Si funksionojnë këto shirita dhe kur duhet t’i përdorësh.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Çfarë është LH?',
      'Si funksionojnë këto teste',
      'Kur duhet të fillosh testimin',
      'Interpretimi i një rezultati',
      'Rezultatet e rreme pozitive dhe kufizimet',
      'Kombinimi me shenja të tjera',
      'Pikat kryesore',
    ],
    section1Body: 'LH (hormoni luteinizues) prodhohet nga truri dhe kontrollon funksionimin e vezoreve. Testet e ovulacionit zbulojnë rritjen e befasishme të këtij hormoni, e cila shkakton çlirimin e vezës 24 deri në 36 orë më vonë.',
    section2Body: 'Një shirit testimi urine mat nivelet e LH: një vijë testi po aq e errët sa ose më e errët se vija e kontrollit tregon një rritje të befasishme.',
    section3Body: 'Rekomandohet të fillosh testimin disa ditë përpara datës së ovulacionit të vlerësuar nga cikli yt.',
    testingTips: [
      {
        title: 'Bazoje te cikli yt',
        text: 'Fillo disa ditë përpara datës së ovulacionit të vlerësuar nga gjatësia mesatare e cikleve të tua.',
      },
      {
        title: 'Testo çdo ditë në të njëjtën orë',
        text: 'Në mënyrë ideale rreth mesditës, duke shmangur urinën e parë të mëngjesit.',
      },
      {
        title: 'Shmang holluarjen e urinës',
        text: 'Kufizo sasitë e mëdha të lëngjeve në orët para testit.',
      },
    ],
    section4Body: 'Një rezultat pozitiv tregon kohën më pjellore për marrëdhënie intime në 1 deri në 2 ditët në vijim. Një rezultat negativ thjesht do të thotë se rritja e befasishme nuk ka ndodhur ende.',
    limitations: [
      'PCOS mund të shkaktojë nivele natyrisht më të larta LH, gjë që mund ta turbullojë leximin',
      'Disa trajtime pjellorie mund ta ndikojnë rezultatin',
      'Urina shumë e holluar mund të japë një rezultat të rremë negativ',
      'Një test me cilësi më të ulët mund të jetë më pak i besueshëm',
    ],
    infoTitle: 'Mbaje në mendje',
    infoText: 'Një rritje e befasishme e LH tregon një sinjal hormonal nxitës, por vetëm për vete nuk garanton që veza u çlirua në të vërtetë.',
    tipTitle: 'Mirë është ta dish',
    tipText: 'Kombinimi i testeve të ovulacionit me temperaturën tënde bazale ose me vëzhgimin e mukusit të qafës së mitrës jep një pamje më të plotë të ciklit tënd.',
    summaryPoints: [
      'Testet e ovulacionit zbulojnë rritjen e befasishme të LH, e cila shkakton çlirimin e vezës 24 deri në 36 orë më vonë.',
      'Rekomandohet të fillosh testimin disa ditë përpara datës së ovulacionit të vlerësuar nga cikli yt.',
      'Një rezultat pozitiv tregon kohën më pjellore për marrëdhënie intime në 1 deri në 2 ditët në vijim.',
      'Një rritje e befasishme e LH vetëm për vete nuk garanton që ovulacioni ka ndodhur në të vërtetë.',
    ],
    disclaimerText: 'Përmbajtje informuese. Ky artikull nuk zëvendëson këshillën mjekësore të personalizuar. Në rast dyshimi, kërko orientim nga një profesionist i shëndetësisë.',
    shareMessage: 'Të kuptosh testet e ovulacionit (LH) — AWA',
  },
  ja: {
    badge: '妊娠しやすさ • 排卵検査薬',
    title: '排卵検査薬（LH）を\n理解する',
    metaDuration: '読了時間6分',
    metaType: 'ガイド',
    metaLevel: '中級',
    metaValidated: '確認済みの内容',
    intro: '検査薬のしくみと、使うタイミングを解説します。',
    contentsTitle: 'この記事の内容',
    topics: [
      'LHとは？',
      '検査薬のしくみ',
      '検査を始めるタイミング',
      '結果の見方',
      '偽陽性と限界',
      'ほかのサインとの組み合わせ',
      'ポイントのまとめ',
    ],
    section1Body: 'LH（黄体形成ホルモン）は脳で作られ、卵巣のはたらきを調整します。排卵検査薬は、このホルモンの急増（サージ）を検出します。このサージが、24〜36時間後の卵子の放出を促します。',
    section2Body: '尿検査用のスティックでLHの濃度を測ります。判定ラインが、コントロールラインと同じ濃さか、それより濃い場合は、サージが起きていることを示します。',
    section3Body: '周期から推定した排卵日の数日前から、検査を始めることをおすすめします。',
    testingTips: [
      {
        title: '周期に合わせる',
        text: '周期の平均的な長さから推定した排卵日の、数日前から始めます。',
      },
      {
        title: '毎日同じ時間に検査する',
        text: 'できれば昼ごろがよく、朝いちばんの尿は避けます。',
      },
      {
        title: '尿を薄めないようにする',
        text: '検査の数時間前は、水分を一度に大量にとるのを控えます。',
      },
    ],
    section4Body: '陽性の結果は、その後1〜2日間が、性交にもっとも適した時期であることを示します。陰性の結果は、まだサージが起きていないことを意味するだけです。',
    limitations: [
      'PCOSでは、もともとLHが高めになることがあり、判定が見分けにくくなることがあります',
      '不妊治療の中には、結果に影響するものがあります',
      '尿がとても薄いと、偽陰性になることがあります',
      '品質が劣る検査薬は、信頼性が低いことがあります',
    ],
    infoTitle: '心に留めておきたいこと',
    infoText: 'LHサージは、排卵を促すホルモンの合図を示しますが、それだけで卵子が実際に放出されたとは言い切れません。',
    tipTitle: '知っておきたいこと',
    tipText: '排卵検査薬を基礎体温や子宮頸管粘液の観察と組み合わせると、周期の全体像がよりつかみやすくなります。',
    summaryPoints: [
      '排卵検査薬はLHサージを検出します。このサージが、24〜36時間後の卵子の放出を促します。',
      '周期から推定した排卵日の数日前から、検査を始めることをおすすめします。',
      '陽性の結果は、その後1〜2日間が、性交にもっとも適した時期であることを示します。',
      'LHサージだけでは、排卵が実際に起きたとは言い切れません。',
    ],
    disclaimerText: '情報提供を目的とした内容です。この記事は、個別の医療上の助言に代わるものではありません。不安がある場合は、医療従事者に相談してください。',
    shareMessage: '排卵検査薬（LH）を理解する — AWA',
  },
  ko: {
    badge: '임신 가능성 • 배란 테스트',
    title: '배란 테스트(LH)\n이해하기',
    metaDuration: '읽는 데 6분',
    metaType: '가이드',
    metaLevel: '중급',
    metaValidated: '검토된 콘텐츠',
    intro: '테스트 스틱이 작동하는 방식과 사용하기 좋은 때를 알아봐요.',
    contentsTitle: '이 아티클의 내용',
    topics: [
      'LH란 무엇일까요?',
      '이 테스트가 작동하는 방식',
      '테스트를 시작하는 시기',
      '결과 해석하기',
      '위양성과 한계',
      '다른 신호와 함께 활용하기',
      '핵심 정리',
    ],
    section1Body: 'LH(황체형성호르몬)는 뇌에서 만들어지며 난소의 기능을 조절해요. 배란 테스트는 이 호르몬이 급증하는 것을 감지하는데, 급증하고 24~36시간 뒤에 난자가 배출돼요.',
    section2Body: '소변 테스트 스틱으로 LH 수치를 측정해요. 테스트 선이 대조 선과 같거나 더 진하면 LH 급증을 뜻해요.',
    section3Body: '주기를 바탕으로 예상한 배란일보다 며칠 앞서 테스트를 시작하는 것이 좋아요.',
    testingTips: [
      {
        title: '내 주기를 기준으로 하기',
        text: '평균 주기 길이로 예상한 배란일보다 며칠 앞서 시작해요.',
      },
      {
        title: '매일 같은 시간에 테스트하기',
        text: '아침 첫 소변은 피하고 한낮 무렵이 가장 좋아요.',
      },
      {
        title: '소변이 묽어지지 않게 하기',
        text: '테스트 몇 시간 전에는 수분을 한꺼번에 많이 마시지 않도록 해요.',
      },
    ],
    section4Body: '양성 결과는 그 후 1~2일 동안이 성관계에 가장 임신 가능성이 높은 시기라는 신호예요. 음성 결과는 아직 LH 급증이 일어나지 않았다는 뜻일 뿐이에요.',
    limitations: [
      '다낭성 난소 증후군(PCOS)이 있으면 LH 수치가 원래 더 높을 수 있어서 결과를 읽기 어려울 수 있어요',
      '일부 난임 치료가 결과에 영향을 줄 수 있어요',
      '소변이 매우 묽으면 위음성이 나올 수 있어요',
      '품질이 낮은 테스트는 신뢰도가 떨어질 수 있어요',
    ],
    infoTitle: '기억해 두세요',
    infoText: 'LH 급증은 배란을 유발하는 호르몬 신호를 나타내지만, 그것만으로 난자가 실제로 배출되었다는 것을 보장하지는 않아요.',
    tipTitle: '알아두면 좋아요',
    tipText: '배란 테스트를 기초체온이나 자궁 경부 점액 관찰과 함께 활용하면 주기를 더 폭넓게 파악할 수 있어요.',
    summaryPoints: [
      '배란 테스트는 LH 급증을 감지하며, 급증하고 24~36시간 뒤에 난자가 배출돼요.',
      '주기를 바탕으로 예상한 배란일보다 며칠 앞서 테스트를 시작하는 것이 좋아요.',
      '양성 결과는 그 후 1~2일 동안이 성관계에 가장 임신 가능성이 높은 시기라는 신호예요.',
      'LH 급증만으로는 실제로 배란이 일어났다는 것을 보장하지 않아요.',
    ],
    disclaimerText: '정보 제공용 콘텐츠예요. 이 아티클은 개인별 맞춤 의학적 조언을 대신하지 않아요. 궁금한 점이 있다면 의료 전문가에게 안내를 받으세요.',
    shareMessage: '배란 테스트(LH) 이해하기 — AWA',
  },
  'pt-PT': {
    badge: 'FERTILIDADE • TESTES DE OVULAÇÃO',
    title: 'Compreender os testes\nde ovulação (LH)',
    metaDuration: '6 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Intermédio',
    metaValidated: 'Conteúdo revisto',
    intro: 'Como funcionam estas tiras e quando as usar.',
    contentsTitle: 'Neste artigo',
    topics: [
      'O que é a LH?',
      'Como funcionam estes testes',
      'Quando começar a testar',
      'Interpretar um resultado',
      'Falsos positivos e limitações',
      'Combiná-los com outros sinais',
      'Pontos a reter',
    ],
    section1Body: 'A LH (hormona luteinizante) é produzida pelo cérebro e controla o funcionamento dos ovários. Os testes de ovulação detetam o pico desta hormona, que desencadeia a libertação do óvulo 24 a 36 horas depois.',
    section2Body: 'Uma tira de teste de urina mede os níveis de LH: uma linha de teste tão escura ou mais escura do que a linha de controlo indica um pico.',
    section3Body: 'Recomenda-se começar a testar alguns dias antes da data de ovulação estimada a partir do seu ciclo.',
    testingTips: [
      {
        title: 'Baseie-se no seu ciclo',
        text: 'Comece alguns dias antes da data de ovulação estimada a partir da duração média dos seus ciclos.',
      },
      {
        title: 'Teste à mesma hora todos os dias',
        text: 'De preferência por volta do meio-dia, evitando a primeira urina da manhã.',
      },
      {
        title: 'Evite diluir a urina',
        text: 'Limite grandes quantidades de líquidos nas horas que antecedem o teste.',
      },
    ],
    section4Body: 'Um resultado positivo assinala o período de maior fertilidade para as relações sexuais nos 1 a 2 dias seguintes. Um resultado negativo significa apenas que o pico ainda não ocorreu.',
    limitations: [
      'A SOP pode causar níveis de LH naturalmente mais elevados, o que pode dificultar a interpretação do resultado',
      'Certos tratamentos de fertilidade podem afetar o resultado',
      'Uma urina muito diluída pode dar um falso negativo',
      'Um teste de menor qualidade pode ser menos fiável',
    ],
    infoTitle: 'A ter presente',
    infoText: 'Um pico de LH indica um sinal hormonal desencadeador, mas, por si só, não garante que o óvulo tenha sido de facto libertado.',
    tipTitle: 'Bom saber',
    tipText: 'Combinar os testes de ovulação com a temperatura corporal basal ou com a observação do muco cervical dá uma imagem mais completa do seu ciclo.',
    summaryPoints: [
      'Os testes de ovulação detetam o pico de LH, que desencadeia a libertação do óvulo 24 a 36 horas depois.',
      'Recomenda-se começar a testar alguns dias antes da data de ovulação estimada a partir do seu ciclo.',
      'Um resultado positivo assinala o período de maior fertilidade para as relações sexuais nos 1 a 2 dias seguintes.',
      'Um pico de LH, por si só, não garante que a ovulação tenha realmente ocorrido.',
    ],
    disclaimerText: 'Conteúdo informativo. Este artigo não substitui um aconselhamento médico personalizado. Em caso de dúvida, procure a orientação de um profissional de saúde.',
    shareMessage: 'Compreender os testes de ovulação (LH) — AWA',
  },
  bn: {
    badge: 'প্রজনন ক্ষমতা • ডিম্বস্ফোটন পরীক্ষা',
    title: 'ডিম্বস্ফোটন পরীক্ষা (এলএইচ)\nবুঝুন',
    metaDuration: '6 মিনিটের পাঠ',
    metaType: 'গাইড',
    metaLevel: 'মাঝারি',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'এই স্ট্রিপগুলো কীভাবে কাজ করে এবং কখন ব্যবহার করবেন।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'এলএইচ কী?',
      'এই পরীক্ষাগুলো কীভাবে কাজ করে',
      'কখন পরীক্ষা শুরু করবেন',
      'ফলাফল ব্যাখ্যা করা',
      'ভুল পজিটিভ ও সীমাবদ্ধতা',
      'অন্যান্য লক্ষণের সঙ্গে মিলিয়ে দেখা',
      'মূল কথা',
    ],
    section1Body: 'এলএইচ (লিউটিনাইজিং হরমোন) মস্তিষ্কে তৈরি হয় এবং ডিম্বাশয়ের কার্যক্রম নিয়ন্ত্রণ করে। ডিম্বস্ফোটন পরীক্ষা এই হরমোনের হঠাৎ বৃদ্ধি শনাক্ত করে, যা 24 থেকে 36 ঘণ্টা পর ডিম্বাণু নির্গমন ঘটায়।',
    section2Body: 'প্রস্রাবের টেস্ট স্ট্রিপ এলএইচের মাত্রা মাপে: কন্ট্রোল লাইনের মতো বা তার চেয়ে গাঢ় টেস্ট লাইন হঠাৎ বৃদ্ধির ইঙ্গিত দেয়।',
    section3Body: 'আপনার চক্র থেকে আন্দাজ করা ডিম্বস্ফোটনের তারিখের কয়েক দিন আগে থেকে পরীক্ষা শুরু করা ভালো।',
    testingTips: [
      {
        title: 'আপনার চক্রের ওপর ভিত্তি করুন',
        text: 'আপনার চক্রের গড় দৈর্ঘ্য থেকে আন্দাজ করা ডিম্বস্ফোটনের তারিখের কয়েক দিন আগে শুরু করুন।',
      },
      {
        title: 'প্রতিদিন একই সময়ে পরীক্ষা করুন',
        text: 'আদর্শভাবে দুপুরের দিকে, সকালের প্রথম প্রস্রাব এড়িয়ে।',
      },
      {
        title: 'প্রস্রাব পাতলা হতে দেবেন না',
        text: 'পরীক্ষার আগের কয়েক ঘণ্টায় বেশি পরিমাণে তরল পান সীমিত রাখুন।',
      },
    ],
    section4Body: 'পজিটিভ ফলাফল পরবর্তী 1 থেকে 2 দিনে সহবাসের জন্য সবচেয়ে উর্বর সময়ের ইঙ্গিত দেয়। নেগেটিভ ফলাফলের অর্থ কেবল এই যে হঠাৎ বৃদ্ধি এখনও ঘটেনি।',
    limitations: [
      'পিসিওএসে স্বাভাবিকভাবেই এলএইচের মাত্রা বেশি থাকতে পারে, যা পাঠকে অস্পষ্ট করতে পারে',
      'কিছু প্রজনন চিকিৎসা ফলাফলকে প্রভাবিত করতে পারে',
      'খুব পাতলা প্রস্রাবে ভুল নেগেটিভ ফলাফল আসতে পারে',
      'নিম্নমানের পরীক্ষা কম নির্ভরযোগ্য হতে পারে',
    ],
    infoTitle: 'মনে রাখবেন',
    infoText: 'এলএইচের হঠাৎ বৃদ্ধি একটি হরমোনজনিত সংকেত নির্দেশ করে, কিন্তু এটি একা নিশ্চিত করে না যে ডিম্বাণু সত্যিই নির্গত হয়েছে।',
    tipTitle: 'জেনে রাখা ভালো',
    tipText: 'ডিম্বস্ফোটন পরীক্ষার সঙ্গে আপনার বেসাল শরীরের তাপমাত্রা বা জরায়ুমুখের শ্লেষ্মা পর্যবেক্ষণ মিলিয়ে দেখলে আপনার চক্রের একটি পূর্ণতর চিত্র পাওয়া যায়।',
    summaryPoints: [
      'ডিম্বস্ফোটন পরীক্ষা এলএইচের হঠাৎ বৃদ্ধি শনাক্ত করে, যা 24 থেকে 36 ঘণ্টা পর ডিম্বাণু নির্গমন ঘটায়।',
      'আপনার চক্র থেকে আন্দাজ করা ডিম্বস্ফোটনের তারিখের কয়েক দিন আগে থেকে পরীক্ষা শুরু করা ভালো।',
      'পজিটিভ ফলাফল পরবর্তী 1 থেকে 2 দিনে সহবাসের জন্য সবচেয়ে উর্বর সময়ের ইঙ্গিত দেয়।',
      'এলএইচের হঠাৎ বৃদ্ধি একা নিশ্চিত করে না যে ডিম্বস্ফোটন সত্যিই ঘটেছে।',
    ],
    disclaimerText: 'তথ্যমূলক বিষয়বস্তু। এই নিবন্ধ ব্যক্তিগত চিকিৎসা পরামর্শের বিকল্প নয়। সন্দেহ থাকলে কোনো স্বাস্থ্যসেবা পেশাজীবীর পরামর্শ নিন।',
    shareMessage: 'ডিম্বস্ফোটন পরীক্ষা (এলএইচ) বুঝুন — AWA',
  },
  da: {
    badge: 'FERTILITET • ÆGLØSNINGSTESTS',
    title: 'Forstå\nægløsningstests (LH)',
    metaDuration: '6 min læsning',
    metaType: 'Guide',
    metaLevel: 'Mellem',
    metaValidated: 'Gennemgået indhold',
    intro: 'Hvordan disse teststrimler virker, og hvornår du skal bruge dem.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvad er LH?',
      'Hvordan fungerer disse tests',
      'Hvornår begynder du at teste',
      'Fortolkning af resultaterne',
      'Falske positiver og begrænsninger',
      'Kombination med andre tegn',
      'Vigtige pointer',
    ],
    section1Body: 'LH (luteiniserende hormon) produceres i hjernen og styrer æggestokkenes funktion. Ægløsningstests registrerer den pludselige stigning i dette hormon, som 24 til 36 timer senere udløser frigivelsen af et æg.',
    section2Body: 'Urin-teststrimler måler LH-niveauet: en testlinje der er lige så mørk som eller mørkere end kontrollinjen indikerer en pludselig stigning.',
    section3Body: 'Det anbefales at begynde at teste et par dage inden den estimerede ægløsningsdato baseret på din cyklus.',
    testingTips: [
      {
        title: 'Tag udgangspunkt i din cyklus',
        text: 'Begynd et par dage før den estimerede ægløsningsdato baseret på din gennemsnitlige cykluslængde.',
      },
      {
        title: 'Test på samme tid hver dag',
        text: 'Ideelt set midt på dagen og undgå den allerførste morgenurin.',
      },
      {
        title: 'Undgå fortyndet urin',
        text: 'Begræns indtagelse af store mængder væske i timerne op til testen.',
      },
    ],
    section4Body: 'Et positivt resultat indikerer den mest frugtbare periode i de næste 1 til 2 dage for samleje. Et negativt resultat betyder blot, at den pludselige stigning endnu ikke har fundet sted.',
    limitations: [
      'Ved PCOS kan LH-niveauerne naturligt være forhøjede, hvilket kan gøre aflæsningerne uklare',
      'Visse fertilitetsbehandlinger kan påvirke resultaterne',
      'Meget fortyndet urin kan give falske negative resultater',
      'Tests af lav kvalitet er måske mindre pålidelige',
    ],
    infoTitle: 'Husk',
    infoText: 'En pludselig LH-stigning indikerer et hormonelt signal, men bekræfter ikke alene, at et æg faktisk er blevet frigivet.',
    tipTitle: 'Godt at vide',
    tipText: 'At kombinere ægløsningstests med observation af din basaltemperatur eller livmoderhalssekret giver et mere fuldstændigt billede af din cyklus.',
    summaryPoints: [
      'Ægløsningstests registrerer den pludselige LH-stigning, som 24 til 36 timer senere udløser frigivelsen af et æg.',
      'Det anbefales at begynde at teste et par dage inden den estimerede ægløsningsdato.',
      'Et positivt resultat indikerer den mest frugtbare periode i de næste 1 til 2 dage.',
      'En pludselig LH-stigning bekræfter ikke alene, at ægløsning faktisk har fundet sted.',
    ],
    disclaimerText: 'Informativt indhold. Denne artikel er ikke en erstatning for personlig medicinsk rådgivning. Kontakt en sundhedsfaglig person, hvis du er i tvivl.',
    shareMessage: 'Forstå ægløsningstests (LH) — AWA',
  },
  sv: {
    badge: 'FERTILITET • ÄGLÖSNINGSTESTS',
    title: 'Forstå\näglösningstests (LH)',
    metaDuration: '6 min läsning',
    metaType: 'Guide',
    metaLevel: 'Mellem',
    metaValidated: 'Gennemgået indhold',
    intro: 'Hvordan disse teststrimler virker, och hvornår du skal bruge dem.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvad ar LH?',
      'Hvordan fungerer disse tests',
      'Hvornår begynder du at teste',
      'Fortolkning av resultaterne',
      'Falske positiver och begränsninger',
      'Kombination med andre tegn',
      'Vigtige pointer',
    ],
    section1Body: 'LH (luteiniserende hormon) produceres i hjernen och styrer äggestokkenes funktion. Äglösningstests registrerer den pludselige stigning i dette hormon, som 24 till 36 timer senere udlöser frigivelsen av et äg.',
    section2Body: 'Urin-teststrimler måler LH-niveauet: en testlinje der ar lige så mörk som eller mörkere end kontrollinjen indikerer en pludselig stigning.',
    section3Body: 'Det anbefales at begynde at teste et par dagar inden den estimerede äglösningsdato baseret på din cyklus.',
    testingTips: [
      {
        title: 'Tag udgangspunkt i din cyklus',
        text: 'Begynd et par dagar för den estimerede äglösningsdato baseret på din gennemsnitlige cykluslängde.',
      },
      {
        title: 'Test på samme tid hver dag',
        text: 'Ideelt set midt på dagen och undgå den allerförste morgenurin.',
      },
      {
        title: 'Undgå fortyndet urin',
        text: 'Begräns indtagelse av store mängder väske i timerne op till testen.',
      },
    ],
    section4Body: 'Et positivt resultat indikerer den mest frugtbare periode i de näste 1 till 2 dagar for samleje. Et negativt resultat betyder blot, at den pludselige stigning annu inte har fundet sted.',
    limitations: [
      'Ved PCOS kan LH-niveauerne naturligt väre forhöjede, hvilket kan göre afläsningerne uklare',
      'Visse fertilitetsbehandlinger kan påvirke resultaterne',
      'Meget fortyndet urin kan give falske negative resultater',
      'Tests av lav kvalitet ar måske mindre pålidelige',
    ],
    infoTitle: 'Husk',
    infoText: 'En pludselig LH-stigning indikerer et hormonelt signal, men bekräfter inte alene, at et äg faktisk ar blevet frigivet.',
    tipTitle: 'Godt at vide',
    tipText: 'At kombinere äglösningstests med observation av din basaltemperatur eller livmoderhalssekret giver et mere fuldständigt billede av din cyklus.',
    summaryPoints: [
      'Äglösningstests registrerer den pludselige LH-stigning, som 24 till 36 timer senere udlöser frigivelsen av et äg.',
      'Det anbefales at begynde at teste et par dagar inden den estimerede äglösningsdato.',
      'Et positivt resultat indikerer den mest frugtbare periode i de näste 1 till 2 dagar.',
      'En pludselig LH-stigning bekräfter inte alene, at äglösning faktisk har fundet sted.',
    ],
    disclaimerText: 'Informativt indhold. Denne artikel ar inte en erstatning for personlig medicinsk rådgivning. Kontakt en halsasfaglig person, hvis du ar i tvivl.',
    shareMessage: 'Forstå äglösningstests (LH) — AWA',
  },
  nb: {
    badge: 'FRUKTBARHET • EGGLØSNINGSTESTER',
    title: 'Forstå eggløsnings-\ntester (LH)',
    metaDuration: '6 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Middels',
    metaValidated: 'Gjennomgått innhold',
    intro: 'Hvordan disse strimlene fungerer, og når du bør bruke dem.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Hva er LH?',
      'Hvordan disse testene fungerer',
      'Når du bør begynne å teste',
      'Tolke et resultat',
      'Falske positive og begrensninger',
      'Kombinere dem med andre tegn',
      'Det viktigste å huske',
    ],
    section1Body:
      'LH (luteiniserende hormon) produseres av hjernen og styrer hvordan eggstokkene fungerer. Eggløsningstester påviser stigningen i dette hormonet, som utløser frigjøringen av egget 24 til 36 timer senere.',
    section2Body:
      'En teststrimmel for urin måler LH-nivået: en testlinje som er like mørk som eller mørkere enn kontrollinjen, tyder på en stigning.',
    section3Body:
      'Det anbefales å begynne å teste noen dager før eggløsningsdatoen som er beregnet ut fra syklusen din.',
    testingTips: [
      {
        title: 'Ta utgangspunkt i syklusen din',
        text: 'Begynn noen dager før eggløsningsdatoen som er beregnet ut fra gjennomsnittslengden på syklusene dine.',
      },
      {
        title: 'Test til samme tid hver dag',
        text: 'Helst rundt middagstid, og unngå den første urinen om morgenen.',
      },
      {
        title: 'Unngå å fortynne urinen',
        text: 'Begrens store mengder væske i timene før testen.',
      },
    ],
    section4Body:
      'Et positivt resultat viser den mest fruktbare tiden for samleie de neste 1 til 2 dagene. Et negativt resultat betyr bare at stigningen ikke har kommet ennå.',
    limitations: [
      'PCOS kan gi naturlig høyere LH-nivåer, noe som kan gjøre avlesningen uklar',
      'Visse fruktbarhetsbehandlinger kan påvirke resultatet',
      'Svært fortynnet urin kan gi et falskt negativt resultat',
      'En test av lavere kvalitet kan være mindre pålitelig',
    ],
    infoTitle: 'Husk',
    infoText:
      'En LH-stigning viser et utløsende hormonelt signal, men alene garanterer den ikke at egget faktisk ble frigjort.',
    tipTitle: 'Godt å vite',
    tipText:
      'Å kombinere eggløsningstester med basaltemperaturen eller observasjon av livmorhalsslim gir et mer fullstendig bilde av syklusen din.',
    summaryPoints: [
      'Eggløsningstester påviser LH-stigningen, som utløser frigjøringen av egget 24 til 36 timer senere.',
      'Det anbefales å begynne å teste noen dager før eggløsningsdatoen som er beregnet ut fra syklusen din.',
      'Et positivt resultat viser den mest fruktbare tiden for samleie de neste 1 til 2 dagene.',
      'En LH-stigning alene garanterer ikke at eggløsningen faktisk skjedde.',
    ],
    disclaimerText:
      'Informasjonsinnhold. Denne artikkelen erstatter ikke personlig medisinsk rådgivning. Ved tvil bør du søke veiledning hos helsepersonell.',
    shareMessage: 'Forstå eggløsningstester (LH) – AWA',
  },
  pl: {
    badge: 'PŁODNOŚĆ • TESTY OWULACYJNE',
    title: 'Zrozumieć testy\nowulacyjne (LH)',
    metaDuration: '6 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Średnio zaawansowany',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Jak działają te paski i kiedy ich używać.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Czym jest LH?',
      'Jak działają te testy',
      'Kiedy zacząć testowanie',
      'Interpretacja wyniku',
      'Wyniki fałszywie dodatnie i ograniczenia',
      'Łączenie z innymi objawami',
      'Najważniejsze wnioski',
    ],
    section1Body:
      'LH (hormon luteinizujący) jest produkowany przez mózg i steruje pracą jajników. Testy owulacyjne wykrywają wyrzut tego hormonu, który wywołuje uwolnienie komórki jajowej 24 do 36 godzin później.',
    section2Body:
      'Test paskowy z moczu mierzy poziom LH: linia testowa tak ciemna jak linia kontrolna lub ciemniejsza wskazuje na wyrzut.',
    section3Body:
      'Zaleca się rozpoczęcie testowania kilka dni przed datą owulacji szacowaną na podstawie cyklu.',
    testingTips: [
      {
        title: 'Oprzyj się na swoim cyklu',
        text: 'Zacznij kilka dni przed datą owulacji szacowaną na podstawie średniej długości Twoich cykli.',
      },
      {
        title: 'Testuj codziennie o tej samej porze',
        text: 'Najlepiej około południa, unikając pierwszego porannego moczu.',
      },
      {
        title: 'Unikaj rozcieńczania moczu',
        text: 'Ogranicz duże ilości płynów w godzinach poprzedzających test.',
      },
    ],
    section4Body:
      'Wynik dodatni wskazuje najbardziej płodny czas na współżycie w ciągu kolejnych 1 do 2 dni. Wynik ujemny oznacza po prostu, że wyrzut jeszcze nie nastąpił.',
    limitations: [
      'PCOS może powodować naturalnie podwyższony poziom LH, co może zaburzać odczyt',
      'Niektóre terapie wspomagające płodność mogą wpływać na wynik',
      'Bardzo rozcieńczony mocz może dać wynik fałszywie ujemny',
      'Test gorszej jakości może być mniej wiarygodny',
    ],
    infoTitle: 'Pamiętaj',
    infoText:
      'Wyrzut LH wskazuje na wyzwalający sygnał hormonalny, ale sam w sobie nie gwarantuje, że komórka jajowa została faktycznie uwolniona.',
    tipTitle: 'Warto wiedzieć',
    tipText:
      'Łączenie testów owulacyjnych z podstawową temperaturą ciała lub obserwacją śluzu szyjkowego daje pełniejszy obraz Twojego cyklu.',
    summaryPoints: [
      'Testy owulacyjne wykrywają wyrzut LH, który wywołuje uwolnienie komórki jajowej 24 do 36 godzin później.',
      'Zaleca się rozpoczęcie testowania kilka dni przed datą owulacji szacowaną na podstawie cyklu.',
      'Wynik dodatni wskazuje najbardziej płodny czas na współżycie w ciągu kolejnych 1 do 2 dni.',
      'Sam wyrzut LH nie gwarantuje, że owulacja faktycznie nastąpiła.',
    ],
    disclaimerText:
      'Treść informacyjna. Ten artykuł nie zastępuje spersonalizowanej porady medycznej. W razie wątpliwości zasięgnij porady specjalisty.',
    shareMessage: 'Zrozumieć testy owulacyjne (LH) — AWA',
  },
  uk: {
    badge: 'ФЕРТИЛЬНІСТЬ • ОВУЛЯЦІЙНІ ТЕСТИ',
    title: 'Розуміння овуляційних\nтестів (ЛГ)',
    metaDuration: '6 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Середній',
    metaValidated: 'Перевірений вміст',
    intro: 'Як працюють ці смужки та коли ними користуватися.',
    contentsTitle: 'У цій статті',
    topics: [
      'Що таке ЛГ?',
      'Як працюють ці тести',
      'Коли починати тестування',
      'Інтерпретація результату',
      'Хибнопозитивні результати та обмеження',
      'Поєднання з іншими ознаками',
      'Головні висновки',
    ],
    section1Body:
      'ЛГ (лютеїнізувальний гормон) виробляється мозком і керує роботою яєчників. Овуляційні тести виявляють сплеск цього гормону, який запускає вихід яйцеклітини через 24–36 годин.',
    section2Body:
      'Тест-смужка вимірює рівень ЛГ у сечі: тестова лінія такої ж інтенсивності, як контрольна, або темніша вказує на сплеск.',
    section3Body:
      'Рекомендовано починати тестування за кілька днів до дати овуляції, оціненої за вашим циклом.',
    testingTips: [
      {
        title: 'Спирайтеся на свій цикл',
        text: 'Починайте за кілька днів до дати овуляції, оціненої за середньою тривалістю ваших циклів.',
      },
      {
        title: 'Тестуйте щодня в один і той самий час',
        text: 'Ідеально близько полудня, уникаючи першої ранкової сечі.',
      },
      {
        title: 'Не розбавляйте сечу',
        text: 'Обмежте велику кількість рідини за кілька годин до тесту.',
      },
    ],
    section4Body:
      'Позитивний результат вказує на найфертильніший час для статевого акту протягом наступних 1–2 днів. Негативний результат просто означає, що сплеск ще не відбувся.',
    limitations: [
      'СПКЯ може спричиняти природно підвищений рівень ЛГ, що може спотворювати результат',
      'Деякі методи лікування безпліддя можуть впливати на результат',
      'Дуже розбавлена сеча може дати хибнонегативний результат',
      'Тест гіршої якості може бути менш надійним',
    ],
    infoTitle: 'Пам’ятайте',
    infoText:
      'Сплеск ЛГ вказує на запускний гормональний сигнал, але сам по собі не гарантує, що яйцеклітина справді вийшла.',
    tipTitle: 'Варто знати',
    tipText:
      'Поєднання овуляційних тестів із базальною температурою тіла чи спостереженням за цервікальним слизом дає повнішу картину вашого циклу.',
    summaryPoints: [
      'Овуляційні тести виявляють сплеск ЛГ, який запускає вихід яйцеклітини через 24–36 годин.',
      'Рекомендовано починати тестування за кілька днів до дати овуляції, оціненої за вашим циклом.',
      'Позитивний результат вказує на найфертильніший час для статевого акту протягом наступних 1–2 днів.',
      'Сплеск ЛГ сам по собі не гарантує, що овуляція справді відбулася.',
    ],
    disclaimerText:
      'Інформаційний вміст. Ця стаття не замінює персоналізованої медичної поради. У разі сумнівів зверніться до медичного фахівця.',
    shareMessage: 'Розуміння овуляційних тестів (ЛГ) — AWA',
  },
  cs: {
    badge: 'PLODNOST • OVULAČNÍ TESTY',
    title: 'Pochopení ovulačních\ntestů (LH)',
    metaDuration: '6 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Pokročilý',
    metaValidated: 'Ověřený obsah',
    intro: 'Jak tyto proužky fungují a kdy je použít.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Co je LH?',
      'Jak tyto testy fungují',
      'Kdy začít testovat',
      'Jak vyložit výsledek',
      'Falešně pozitivní výsledky a limity',
      'Spojení s dalšími příznaky',
      'Hlavní poznatky',
    ],
    section1Body:
      'LH (luteinizační hormon) je produkován mozkem a řídí fungování vaječníků. Ovulační testy zachycují vzestup tohoto hormonu, který o 24 až 36 hodin později spouští uvolnění vajíčka.',
    section2Body:
      'Proužek na testování moči měří hladinu LH: testovací linie stejně tmavá nebo tmavší než kontrolní linie značí vzestup.',
    section3Body:
      'Doporučuje se začít testovat několik dní před datem ovulace odhadnutým podle vašeho cyklu.',
    testingTips: [
      {
        title: 'Vycházejte ze svého cyklu',
        text: 'Začněte několik dní před datem ovulace odhadnutým podle průměrné délky vašich cyklů.',
      },
      {
        title: 'Testujte každý den ve stejnou dobu',
        text: 'Ideálně kolem poledne, bez použití první ranní moči.',
      },
      {
        title: 'Nezřeďte moč',
        text: 'V hodinách před testem omezte větší množství tekutin.',
      },
    ],
    section4Body:
      'Pozitivní výsledek značí nejplodnější dobu pro pohlavní styk v následujících 1 až 2 dnech. Negativní výsledek jednoduše znamená, že k vzestupu zatím nedošlo.',
    limitations: [
      'PCOS může způsobovat přirozeně vyšší hladinu LH, což může zkreslit odečet',
      'Některé léčby plodnosti mohou výsledek ovlivnit',
      'Velmi zředěná moč může dát falešně negativní výsledek',
      'Test nižší kvality může být méně spolehlivý',
    ],
    infoTitle: 'Mějte na paměti',
    infoText:
      'Vzestup LH značí spouštěcí hormonální signál, ale sám o sobě nezaručuje, že se vajíčko skutečně uvolnilo.',
    tipTitle: 'Stojí za to vědět',
    tipText:
      'Spojení ovulačních testů s bazální tělesnou teplotou nebo pozorováním cervikálního hlenu poskytuje úplnější obraz o vašem cyklu.',
    summaryPoints: [
      'Ovulační testy zachycují vzestup LH, který o 24 až 36 hodin později spouští uvolnění vajíčka.',
      'Doporučuje se začít testovat několik dní před datem ovulace odhadnutým podle vašeho cyklu.',
      'Pozitivní výsledek značí nejplodnější dobu pro pohlavní styk v následujících 1 až 2 dnech.',
      'Samotný vzestup LH nezaručuje, že k ovulaci skutečně došlo.',
    ],
    disclaimerText:
      'Informativní obsah. Tento článek nenahrazuje individuální lékařskou radu. V případě pochybností požádejte o radu zdravotnického pracovníka.',
    shareMessage: 'Pochopení ovulačních testů (LH) — AWA',
  },
  sk: {
    badge: 'PLODNOSŤ • OVULAČNÉ TESTY',
    title: 'Pochopenie ovulačných\ntestov (LH)',
    metaDuration: '6 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Stredne pokročilý',
    metaValidated: 'Overený obsah',
    intro: 'Ako tieto prúžky fungujú a kedy ich použiť.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Čo je LH?',
      'Ako tieto testy fungujú',
      'Kedy začať testovať',
      'Interpretácia výsledku',
      'Falošne pozitívne výsledky a limity',
      'Kombinácia s ďalšími znakmi',
      'Hlavné body',
    ],
    section1Body:
      'LH (luteinizačný hormón) vytvára mozog a riadi fungovanie vaječníkov. Ovulačné testy zachytávajú vzostup tohto hormónu, ktorý spúšťa uvoľnenie vajíčka o 24 až 36 hodín neskôr.',
    section2Body:
      'Testovací prúžok z moču meria hladinu LH: testovacia čiara rovnako tmavá alebo tmavšia ako kontrolná čiara naznačuje vzostup.',
    section3Body:
      'Odporúča sa začať testovať niekoľko dní pred dátumom ovulácie odhadnutým z vášho cyklu.',
    testingTips: [
      {
        title: 'Vychádzajte z vášho cyklu',
        text: 'Začnite niekoľko dní pred dátumom ovulácie odhadnutým z priemernej dĺžky vašich cyklov.',
      },
      {
        title: 'Testujte každý deň v rovnakom čase',
        text: 'Ideálne okolo poludnia, vyhnite sa prvému ranému moču.',
      },
      {
        title: 'Vyhnite sa nariedeniu moču',
        text: 'Obmedzte veľké množstvá tekutín v hodinách pred testom.',
      },
    ],
    section4Body:
      'Pozitívny výsledok signalizuje najplodnejší čas na pohlavný styk v nasledujúcich 1 až 2 dňoch. Negatívny výsledok jednoducho znamená, že vzostup ešte nenastal.',
    limitations: [
      'PCOS môže spôsobovať prirodzene vyššie hladiny LH, čo môže zahmliť odčítanie',
      'Niektoré liečby plodnosti môžu výsledok ovplyvniť',
      'Veľmi nariedený moč môže dať falošne negatívny výsledok',
      'Menej kvalitný test môže byť menej spoľahlivý',
    ],
    infoTitle: 'Pamätajte',
    infoText:
      'Vzostup LH naznačuje spúšťací hormonálny signál, ale sám osebe nezaručuje, že sa vajíčko skutočne uvoľnilo.',
    tipTitle: 'Stojí za to vedieť',
    tipText:
      'Kombinácia ovulačných testov s bazálnou telesnou teplotou alebo pozorovaním cervikálneho hlienu poskytuje úplnejší obraz o vašom cykle.',
    summaryPoints: [
      'Ovulačné testy zachytávajú vzostup LH, ktorý spúšťa uvoľnenie vajíčka o 24 až 36 hodín neskôr.',
      'Odporúča sa začať testovať niekoľko dní pred dátumom ovulácie odhadnutým z vášho cyklu.',
      'Pozitívny výsledok signalizuje najplodnejší čas na pohlavný styk v nasledujúcich 1 až 2 dňoch.',
      'Samotný vzostup LH nezaručuje, že ovulácia skutočne nastala.',
    ],
    disclaimerText:
      'Informatívny obsah. Tento článok nenahrádza individuálnu lekársku radu. V prípade pochybností sa poraďte so zdravotníckym pracovníkom.',
    shareMessage: 'Pochopenie ovulačných testov (LH) — AWA',
  },
  hu: {
    badge: 'TERMÉKENYSÉG • PETEÉRÉSI TESZTEK',
    title: 'A peteérési\ntesztek (LH) megértése',
    metaDuration: '6 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Középhaladó',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'Hogyan működnek ezek a csíkok, és mikor érdemes használni őket.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Mi az LH?',
      'Hogyan működnek ezek a tesztek',
      'Mikor kezdd a tesztelést',
      'Az eredmény értelmezése',
      'Álpozitív eredmények és korlátok',
      'Kombinálás más jelekkel',
      'Legfontosabb tudnivalók',
    ],
    section1Body:
      'Az LH (luteinizáló hormon) az agyban termelődik, és szabályozza a petefészkek működését. A peteérési tesztek ennek a hormonnak a hirtelen megemelkedését érzékelik, amely 24–36 órával később kiváltja a petesejt kiszabadulását.',
    section2Body:
      'A vizeletes tesztcsík az LH-szintet méri: a kontrollcsíkkal azonos vagy annál sötétebb tesztcsík emelkedést jelez.',
    section3Body:
      'Ajánlott a tesztelést néhány nappal a ciklusodból becsült peteérési dátum előtt kezdeni.',
    testingTips: [
      {
        title: 'A ciklusodra támaszkodj',
        text: 'Kezdd a ciklusaid átlagos hosszából becsült peteérési dátum előtt néhány nappal.',
      },
      {
        title: 'Minden nap ugyanabban az időpontban tesztelj',
        text: 'Ideális esetben dél körül, a reggeli első vizeletet kerülve.',
      },
      {
        title: 'Kerüld a vizeleted hígítását',
        text: 'A teszt előtti órákban korlátozd a nagy mennyiségű folyadék fogyasztását.',
      },
    ],
    section4Body:
      'A pozitív eredmény a nemi élet szempontjából a legtermékenyebb időt jelzi a következő 1–2 napra. A negatív eredmény egyszerűen azt jelenti, hogy az emelkedés még nem történt meg.',
    limitations: [
      'A PCOS természetesen magasabb LH-szintet okozhat, ami elhomályosíthatja a leolvasást',
      'Egyes termékenységi kezelések befolyásolhatják az eredményt',
      'A nagyon híg vizelet álnegatív eredményt adhat',
      'Egy gyengébb minőségű teszt kevésbé lehet megbízható',
    ],
    infoTitle: 'Tartsd észben',
    infoText:
      'Az LH-emelkedés egy kiváltó hormonális jelet jelez, de önmagában nem garantálja, hogy a petesejt valóban kiszabadult.',
    tipTitle: 'Érdemes tudni',
    tipText:
      'A peteérési tesztek kombinálása az alapvető testhőmérséklettel vagy a méhnyaknyálka megfigyelésével teljesebb képet ad a ciklusodról.',
    summaryPoints: [
      'A peteérési tesztek az LH-emelkedést érzékelik, amely 24–36 órával később kiváltja a petesejt kiszabadulását.',
      'Ajánlott a tesztelést néhány nappal a ciklusodból becsült peteérési dátum előtt kezdeni.',
      'A pozitív eredmény a nemi élet szempontjából a legtermékenyebb időt jelzi a következő 1–2 napra.',
      'Az LH-emelkedés önmagában nem garantálja, hogy a peteérés valóban megtörtént.',
    ],
    disclaimerText:
      'Tájékoztató jellegű tartalom. Ez a cikk nem helyettesíti a személyre szabott orvosi tanácsot. Kétség esetén kérj útmutatást egészségügyi szakembertől.',
    shareMessage: 'A peteérési tesztek (LH) megértése — AWA',
  },
  ro: {
    badge: 'FERTILITATE • TESTE DE OVULAȚIE',
    title: 'Înțelegerea testelor\nde ovulație (LH)',
    metaDuration: '6 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Intermediar',
    metaValidated: 'Conținut revizuit',
    intro: 'Cum funcționează aceste benzi de testare și când să le folosești.',
    contentsTitle: 'În acest articol',
    topics: [
      'Ce este LH?',
      'Cum funcționează aceste teste',
      'Când să începi testarea',
      'Interpretarea unui rezultat',
      'Fals pozitive și limite',
      'Combinarea cu alte semne',
      'Ce să reții',
    ],
    section1Body:
      'LH (hormonul luteinizant) este produs de creier și controlează funcționarea ovarelor. Testele de ovulație detectează creșterea bruscă a acestui hormon, care declanșează eliberarea ovulului la 24-36 de ore distanță.',
    section2Body:
      'O bandă de testare urinară măsoară nivelul de LH: o linie de test la fel de închisă sau mai închisă decât linia de control indică un vârf.',
    section3Body:
      'Se recomandă să începi testarea cu câteva zile înainte de data ovulației estimată pe baza ciclului tău.',
    testingTips: [
      {
        title: 'Bazează-te pe ciclul tău',
        text: 'Începe cu câteva zile înainte de data ovulației estimată pe baza duratei medii a ciclurilor tale.',
      },
      {
        title: 'Testează la aceeași oră în fiecare zi',
        text: 'Ideal în jurul prânzului, evitând prima urină de dimineață.',
      },
      {
        title: 'Evită diluarea urinei',
        text: 'Limitează cantitățile mari de lichide în orele dinaintea testului.',
      },
    ],
    section4Body:
      'Un rezultat pozitiv semnalează momentul cel mai fertil pentru raporturi intime în următoarele 1-2 zile. Un rezultat negativ înseamnă pur și simplu că vârful nu a avut încă loc.',
    limitations: [
      'SOP poate provoca niveluri de LH natural mai ridicate, ceea ce poate încețoșa citirea',
      'Anumite tratamente de fertilitate pot afecta rezultatul',
      'O urină foarte diluată poate da un fals negativ',
      'Un test de calitate mai slabă poate fi mai puțin fiabil',
    ],
    infoTitle: 'De ținut minte',
    infoText:
      'Un vârf de LH indică un semnal hormonal declanșator, dar singur nu garantează că ovulul a fost efectiv eliberat.',
    tipTitle: 'Bine de știut',
    tipText:
      'Combinarea testelor de ovulație cu temperatura bazală sau cu observarea mucusului cervical oferă o imagine mai completă a ciclului tău.',
    summaryPoints: [
      'Testele de ovulație detectează vârful de LH, care declanșează eliberarea ovulului la 24-36 de ore distanță.',
      'Se recomandă să începi testarea cu câteva zile înainte de data ovulației estimată pe baza ciclului tău.',
      'Un rezultat pozitiv semnalează momentul cel mai fertil pentru raporturi intime în următoarele 1-2 zile.',
      'Un vârf de LH singur nu garantează că ovulația a avut efectiv loc.',
    ],
    disclaimerText:
      'Conținut cu caracter informativ. Acest articol nu înlocuiește sfatul medical personalizat. Dacă ai îndoieli, cere îndrumare unui profesionist din domeniul sănătății.',
    shareMessage: 'Înțelegerea testelor de ovulație (LH) — AWA',
  },
  bg: {
    badge: 'ПЛОДОВИТОСТ • ТЕСТОВЕ ЗА ОВУЛАЦИЯ',
    title: 'Разбиране на тестовете\nза овулация (LH)',
    metaDuration: '6 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Средно ниво',
    metaValidated: 'Проверено съдържание',
    intro: 'Как работят тези тест ленти и кога да ги използваш.',
    contentsTitle: 'В тази статия',
    topics: [
      'Какво е LH?',
      'Как работят тези тестове',
      'Кога да започнеш тестването',
      'Тълкуване на резултата',
      'Фалшиво положителни резултати и ограничения',
      'Комбиниране с други признаци',
      'Какво да запомниш',
    ],
    section1Body:
      'LH (лутеинизиращият хормон) се произвежда от мозъка и контролира функционирането на яйчниците. Тестовете за овулация откриват пика на този хормон, който задейства освобождаването на яйцеклетката 24 до 36 часа по-късно.',
    section2Body:
      'Тест лента за урина измерва нивото на LH: тестова линия, толкова тъмна или по-тъмна от контролната линия, показва пик.',
    section3Body:
      'Препоръчва се да започнеш тестването няколко дни преди датата на овулация, изчислена от цикъла ти.',
    testingTips: [
      {
        title: 'Базирай се на цикъла си',
        text: 'Започни няколко дни преди датата на овулация, изчислена от средната продължителност на циклите ти.',
      },
      {
        title: 'Тествай по едно и също време всеки ден',
        text: 'В идеалния случай около обяд, като избягваш първата сутрешна урина.',
      },
      {
        title: 'Избягвай разреждането на урината',
        text: 'Ограничи големите количества течности в часовете преди теста.',
      },
    ],
    section4Body:
      'Положителен резултат сигнализира най-плодовития момент за полови контакти през следващите 1 до 2 дни. Отрицателен резултат просто означава, че пикът още не е настъпил.',
    limitations: [
      'СПКЯ може да причини естествено по-високи нива на LH, което може да замъгли отчитането',
      'Някои лечения за плодовитост могат да повлияят на резултата',
      'Много разредена урина може да даде фалшиво отрицателен резултат',
      'Тест с по-ниско качество може да е по-малко надежден',
    ],
    infoTitle: 'Помни',
    infoText:
      'Пикът на LH показва задействащ хормонален сигнал, но сам по себе си не гарантира, че яйцеклетката наистина е била освободена.',
    tipTitle: 'Добре е да знаеш',
    tipText:
      'Комбинирането на тестовете за овулация с базалната температура или наблюдението на цервикалната слуз дава по-пълна картина на цикъла ти.',
    summaryPoints: [
      'Тестовете за овулация откриват пика на LH, който задейства освобождаването на яйцеклетката 24 до 36 часа по-късно.',
      'Препоръчва се да започнеш тестването няколко дни преди датата на овулация, изчислена от цикъла ти.',
      'Положителен резултат сигнализира най-плодовития момент за полови контакти през следващите 1 до 2 дни.',
      'Пикът на LH сам по себе си не гарантира, че овулацията наистина е настъпила.',
    ],
    disclaimerText:
      'Информационно съдържание. Тази статия не замества персонализирания медицински съвет. При съмнение поискай насоки от здравен специалист.',
    shareMessage: 'Разбиране на тестовете за овулация (LH) — AWA',
  },
  sr: {
    badge: 'ПЛОДНОСТ • ТЕСТОВИ ОВУЛАЦИЈЕ',
    title: 'Разумевање тестова\nовулације (LH)',
    metaDuration: '6 мин читања',
    metaType: 'Водич',
    metaLevel: 'Средњи ниво',
    metaValidated: 'Проверен садржај',
    intro: 'Како ове траке функционишу и када их користити.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Шта је LH?',
      'Како ови тестови функционишу',
      'Када почети са тестирањем',
      'Тумачење резултата',
      'Лажно позитивни резултати и ограничења',
      'Комбиновање са другим знацима',
      'Шта да запамтиш',
    ],
    section1Body:
      'LH (лутеинизирајући хормон) производи мозак и контролише функционисање јајника. Тестови овулације откривају пик овог хормона, који покреће ослобађање јајне ћелије 24 до 36 сати касније.',
    section2Body:
      'Трака за тест урина мери ниво LH: линија теста једнако тамна или тамнија од контролне линије указује на пик.',
    section3Body:
      'Препоручује се да почнеш са тестирањем неколико дана пре датума овулације процењеног на основу твог циклуса.',
    testingTips: [
      {
        title: 'Ослони се на свој циклус',
        text: 'Почни неколико дана пре датума овулације процењеног на основу просечног трајања твојих циклуса.',
      },
      {
        title: 'Тестирај се у исто време сваког дана',
        text: 'У идеалном случају око подне, избегавајући прву јутарњу мокраћу.',
      },
      {
        title: 'Избегавај разређивање урина',
        text: 'Ограничи велике количине течности у сатима пре теста.',
      },
    ],
    section4Body:
      'Позитиван резултат сигнализира најплоднији тренутак за односе током наредних 1 до 2 дана. Негативан резултат једноставно значи да се пик још није десио.',
    limitations: [
      'ПЦОС може изазвати природно више нивое LH, што може замаглити очитавање',
      'Одређене терапије плодности могу утицати на резултат',
      'Веома разређен урин може дати лажно негативан резултат',
      'Тест лошијег квалитета може бити мање поуздан',
    ],
    infoTitle: 'Имај на уму',
    infoText:
      'Пик LH указује на покретачки хормонски сигнал, али сам по себи не гарантује да је јајна ћелија заиста ослобођена.',
    tipTitle: 'Добро је знати',
    tipText:
      'Комбиновање тестова овулације са базалном телесном температуром или посматрањем цервикалне слузи даје потпунију слику твог циклуса.',
    summaryPoints: [
      'Тестови овулације откривају пик LH, који покреће ослобађање јајне ћелије 24 до 36 сати касније.',
      'Препоручује се да почнеш са тестирањем неколико дана пре датума овулације процењеног на основу твог циклуса.',
      'Позитиван резултат сигнализира најплоднији тренутак за односе током наредних 1 до 2 дана.',
      'Пик LH сам по себи не гарантује да је овулација заиста настала.',
    ],
    disclaimerText:
      'Информативни садржај. Овај чланак не замењује персонализовани медицински савет. При сумњи потражи смернице од здравственог радника.',
    shareMessage: 'Разумевање тестова овулације (LH) — AWA',
  },
  hr: {
    badge: 'PLODNOST • TESTOVI OVULACIJE',
    title: 'Razumijevanje testova\novulacije (LH)',
    metaDuration: '6 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Srednja razina',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Kako ove trakice funkcioniraju i kada ih koristiti.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Što je LH?',
      'Kako ovi testovi funkcioniraju',
      'Kada početi s testiranjem',
      'Tumačenje rezultata',
      'Lažno pozitivni rezultati i ograničenja',
      'Kombiniranje s drugim znakovima',
      'Ključne poruke',
    ],
    section1Body:
      'LH (luteinizirajući hormon) stvara mozak i on kontrolira rad jajnika. Testovi ovulacije otkrivaju porast ovog hormona, koji 24 do 36 sati kasnije pokreće oslobađanje jajne stanice.',
    section2Body:
      'Trakica za test mokraće mjeri razinu LH: testna linija jednako tamna kao kontrolna linija ili tamnija od nje označava porast.',
    section3Body:
      'Preporučuje se početi s testiranjem nekoliko dana prije datuma ovulacije procijenjenog na temelju tvog ciklusa.',
    testingTips: [
      {
        title: 'Osloni se na svoj ciklus',
        text: 'Počni nekoliko dana prije datuma ovulacije procijenjenog prema prosječnoj duljini tvojih ciklusa.',
      },
      {
        title: 'Testiraj svaki dan u isto vrijeme',
        text: 'Idealno oko podneva, izbjegavajući prvu jutarnju mokraću.',
      },
      {
        title: 'Izbjegavaj razrjeđivanje mokraće',
        text: 'Ograniči veće količine tekućine u satima prije testa.',
      },
    ],
    section4Body:
      'Pozitivan rezultat signalizira najplodnije vrijeme za spolni odnos tijekom sljedećih 1 do 2 dana. Negativan rezultat jednostavno znači da porast još nije nastupio.',
    limitations: [
      'PCOS može uzrokovati prirodno više razine LH, što može zamutiti očitanje',
      'Određene terapije plodnosti mogu utjecati na rezultat',
      'Jako razrijeđena mokraća može dati lažno negativan rezultat',
      'Test niže kvalitete može biti manje pouzdan',
    ],
    infoTitle: 'Imaj na umu',
    infoText:
      'Porast LH označava hormonski signal koji pokreće ovulaciju, ali sam po sebi ne jamči da je jajna stanica doista oslobođena.',
    tipTitle: 'Dobro je znati',
    tipText:
      'Kombiniranjem testova ovulacije s bazalnom temperaturom ili promatranjem cervikalne sluzi dobiva se potpunija slika tvog ciklusa.',
    summaryPoints: [
      'Testovi ovulacije otkrivaju porast LH, koji 24 do 36 sati kasnije pokreće oslobađanje jajne stanice.',
      'Preporučuje se početi s testiranjem nekoliko dana prije datuma ovulacije procijenjenog na temelju tvog ciklusa.',
      'Pozitivan rezultat signalizira najplodnije vrijeme za spolni odnos tijekom sljedećih 1 do 2 dana.',
      'Sam porast LH ne jamči da se ovulacija doista dogodila.',
    ],
    disclaimerText:
      'Informativni sadržaj. Ovaj članak ne zamjenjuje individualni medicinski savjet. U slučaju nedoumice zatraži savjet zdravstvenog djelatnika.',
    shareMessage: 'Razumijevanje testova ovulacije (LH) — AWA',
  },
  bs: {
    badge: 'PLODNOST • TESTOVI OVULACIJE',
    title: 'Razumijevanje testova\novulacije (LH)',
    metaDuration: '6 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Srednja razina',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Kako ove trakice funkcioniraju i kada ih koristiti.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Što je LH?',
      'Kako ovi testovi funkcioniraju',
      'Kada početi s testiranjem',
      'Tumačenje rezultata',
      'Lažno pozitivni rezultati i ograničenja',
      'Kombiniranje s drugim znakovima',
      'Ključne poruke',
    ],
    section1Body:
      'LH (luteinizirajući hormon) stvara mozak i on kontrolira rad jajnika. Testovi ovulacije otkrivaju porast ovog hormona, koji 24 do 36 sati kasnije pokreće oslobađanje jajne stanice.',
    section2Body:
      'Trakica za test mokraće mjeri razinu LH: testna linija jednako tamna kao kontrolna linija ili tamnija od nje označava porast.',
    section3Body:
      'Preporučuje se početi s testiranjem nekoliko dana prije datuma ovulacije procijenjenog na temelju tvog ciklusa.',
    testingTips: [
      {
        title: 'Osloni se na svoj ciklus',
        text: 'Počni nekoliko dana prije datuma ovulacije procijenjenog prema prosječnoj duljini tvojih ciklusa.',
      },
      {
        title: 'Testiraj svaki dan u isto vrijeme',
        text: 'Idealno oko podneva, izbjegavajući prvu jutarnju mokraću.',
      },
      {
        title: 'Izbjegavaj razrjeđivanje mokraće',
        text: 'Ograniči veće količine tekućine u satima prije testa.',
      },
    ],
    section4Body:
      'Pozitivan rezultat signalizira najplodnije vrijeme za spolni odnos tokom sljedećih 1 do 2 dana. Negativan rezultat jednostavno znači da porast još nije nastupio.',
    limitations: [
      'PCOS može uzrokovati prirodno više razine LH, što može zamutiti očitanje',
      'Određene terapije plodnosti mogu utjecati na rezultat',
      'Jako razrijeđena mokraća može dati lažno negativan rezultat',
      'Test niže kvalitete može biti manje pouzdan',
    ],
    infoTitle: 'Imaj na umu',
    infoText:
      'Porast LH označava hormonski signal koji pokreće ovulaciju, ali sam po sebi ne jamči da je jajna stanica doista oslobođena.',
    tipTitle: 'Dobro je znati',
    tipText:
      'Kombiniranjem testova ovulacije s bazalnom temperaturom ili promatranjem cervikalne sluzi dobiva se potpunija slika tvog ciklusa.',
    summaryPoints: [
      'Testovi ovulacije otkrivaju porast LH, koji 24 do 36 sati kasnije pokreće oslobađanje jajne stanice.',
      'Preporučuje se početi s testiranjem nekoliko dana prije datuma ovulacije procijenjenog na temelju tvog ciklusa.',
      'Pozitivan rezultat signalizira najplodnije vrijeme za spolni odnos tokom sljedećih 1 do 2 dana.',
      'Sam porast LH ne jamči da se ovulacija doista dogodila.',
    ],
    disclaimerText:
      'Informativni sadržaj. Ovaj članak ne zamjenjuje individualni medicinski savjet. U slučaju nedoumice zatraži savjet zdravstvenog radnika.',
    shareMessage: 'Razumijevanje testova ovulacije (LH) — AWA',
  },
  sl: {
    badge: 'PLODNOST • TESTI OVULACIJE',
    title: 'Razumevanje testov\novulacije (LH)',
    metaDuration: '6 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Srednja raven',
    metaValidated: 'Preverjena vsebina',
    intro: 'Kako ti testni lističi delujejo in kdaj jih uporabiti.',
    contentsTitle: 'V tem članku',
    topics: [
      'Kaj je LH?',
      'Kako ti testi delujejo',
      'Kdaj začeti s testiranjem',
      'Razlaga rezultata',
      'Lažno pozitivni rezultati in omejitve',
      'Kombiniranje z drugimi znaki',
      'Ključna sporočila',
    ],
    section1Body:
      'LH (luteinizirajoči hormon) proizvajajo možgani in nadzira delovanje jajčnikov. Testi ovulacije zaznajo porast tega hormona, ki 24 do 36 ur pozneje sproži sprostitev jajčne celice.',
    section2Body:
      'Testni lističi za seč merijo raven LH: testna črta, enako temna kot kontrolna črta ali temnejša od nje, označuje porast.',
    section3Body:
      'Priporočljivo je začeti s testiranjem nekaj dni pred datumom ovulacije, ocenjenim na podlagi tvojega cikla.',
    testingTips: [
      {
        title: 'Zanesi se na svoj cikel',
        text: 'Začni nekaj dni pred datumom ovulacije, ocenjenim glede na povprečno dolžino tvojih ciklov.',
      },
      {
        title: 'Testiraj vsak dan ob isti uri',
        text: 'Idealno okoli poldneva, izogibaj se prvemu jutranjemu seču.',
      },
      {
        title: 'Izogibaj se razredčevanju seča',
        text: 'Omeji večje količine tekočine v urah pred testom.',
      },
    ],
    section4Body:
      'Pozitiven rezultat nakazuje najplodnejši čas za spolni odnos v naslednjih 1 do 2 dneh. Negativen rezultat preprosto pomeni, da porast še ni nastopil.',
    limitations: [
      'PCOS lahko povzroči naravno višje ravni LH, kar lahko zamegli odčitek',
      'Določena zdravljenja plodnosti lahko vplivajo na rezultat',
      'Zelo razredčen seč lahko da lažno negativen rezultat',
      'Test nižje kakovosti je lahko manj zanesljiv',
    ],
    infoTitle: 'Imej v mislih',
    infoText:
      'Porast LH označuje hormonski signal, ki sproži ovulacijo, a sam po sebi ne zagotavlja, da je bila jajčna celica res sproščena.',
    tipTitle: 'Vredno vedeti',
    tipText:
      'S kombinacijo testov ovulacije z bazalno temperaturo ali opazovanjem materničnovratne sluzi dobiš popolnejšo sliko svojega cikla.',
    summaryPoints: [
      'Testi ovulacije zaznajo porast LH, ki 24 do 36 ur pozneje sproži sprostitev jajčne celice.',
      'Priporočljivo je začeti s testiranjem nekaj dni pred datumom ovulacije, ocenjenim na podlagi tvojega cikla.',
      'Pozitiven rezultat nakazuje najplodnejši čas za spolni odnos v naslednjih 1 do 2 dneh.',
      'Sam porast LH ne zagotavlja, da je ovulacija res nastopila.',
    ],
    disclaimerText:
      'Informativna vsebina. Ta članek ne nadomešča osebnega zdravniškega nasveta. V primeru dvoma poišči nasvet zdravstvenega delavca.',
    shareMessage: 'Razumevanje testov ovulacije (LH) — AWA',
  },
  ne: {
    badge: 'उर्वरता • अण्डोत्सर्ग परीक्षण',
    title: 'अण्डोत्सर्ग परीक्षण (LH)\nबुझ्नुहोस्',
    metaDuration: '6 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'मध्यम',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'यी पट्टीहरू कसरी काम गर्छन्, र कहिले प्रयोग गर्ने।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'LH के हो?',
      'यी परीक्षणहरू कसरी काम गर्छन्',
      'परीक्षण कहिलेदेखि सुरु गर्ने',
      'नतिजाको व्याख्या',
      'गलत सकारात्मक र सीमाहरू',
      'अन्य संकेतहरूसँग जोड्ने',
      'मुख्य कुराहरू',
    ],
    section1Body:
      'LH (ल्युटिनाइजिङ हर्मोन) मस्तिष्कले उत्पादन गर्छ र अण्डाशयहरूको कामलाई नियन्त्रण गर्छ। अण्डोत्सर्ग परीक्षणले यो हर्मोनको उछाल पत्ता लगाउँछ, जसले 24 देखि 36 घण्टापछि अण्डा निस्कन ट्रिगर गर्छ।',
    section2Body:
      'पिसाबको परीक्षण पट्टीले LH को स्तर नाप्छ: कन्ट्रोल रेखाजत्तिकै वा त्योभन्दा गाढा परीक्षण रेखाले उछाल जनाउँछ।',
    section3Body:
      'आफ्नो चक्रबाट अनुमानित अण्डोत्सर्गको मितिभन्दा केही दिनअघिदेखि परीक्षण सुरु गर्न सिफारिस गरिन्छ।',
    testingTips: [
      {
        title: 'आफ्नो चक्रमा आधारित बनाउनुहोस्',
        text: 'आफ्ना चक्रहरूको औसत अवधिबाट अनुमानित अण्डोत्सर्गको मितिभन्दा केही दिनअघि सुरु गर्नुहोस्।',
      },
      {
        title: 'हरेक दिन एउटै समयमा परीक्षण गर्नुहोस्',
        text: 'आदर्श रूपमा मध्यान्हतिर, बिहानको पहिलो पिसाब नलिई।',
      },
      {
        title: 'पिसाबलाई पातलो हुनबाट जोगाउनुहोस्',
        text: 'परीक्षणअघिका घण्टाहरूमा धेरै मात्रामा तरल पदार्थ सीमित गर्नुहोस्।',
      },
    ],
    section4Body:
      'सकारात्मक नतिजाले आगामी 1 देखि 2 दिनमा सम्भोगका लागि सबैभन्दा उर्वर समय जनाउँछ। नकारात्मक नतिजाको अर्थ उछाल अझै नभएको मात्र हो।',
    limitations: [
      'PCOS ले स्वाभाविक रूपमा उच्च LH स्तर निम्त्याउन सक्छ, जसले पठनलाई धमिलो बनाउन सक्छ',
      'केही उर्वरता उपचारहरूले नतिजालाई असर गर्न सक्छन्',
      'निकै पातलो पिसाबले गलत नकारात्मक दिन सक्छ',
      'कम गुणस्तरको परीक्षण कम भरपर्दो हुन सक्छ',
    ],
    infoTitle: 'मनमा राख्नुहोस्',
    infoText:
      'LH को उछालले ट्रिगर गर्ने हर्मोनल संकेत जनाउँछ, तर आफैँमा यसले अण्डा वास्तवमै निस्किएको ग्यारेन्टी दिँदैन।',
    tipTitle: 'जान्न लायक',
    tipText:
      'अण्डोत्सर्ग परीक्षणलाई आधारभूत शारीरिक तापक्रम वा गर्भाशयको मुखको तरल पदार्थको अवलोकनसँग जोड्दा तपाईंको चक्रको अझ पूर्ण चित्र पाइन्छ।',
    summaryPoints: [
      'अण्डोत्सर्ग परीक्षणले LH को उछाल पत्ता लगाउँछ, जसले 24 देखि 36 घण्टापछि अण्डा निस्कन ट्रिगर गर्छ।',
      'आफ्नो चक्रबाट अनुमानित अण्डोत्सर्गको मितिभन्दा केही दिनअघिदेखि परीक्षण सुरु गर्न सिफारिस गरिन्छ।',
      'सकारात्मक नतिजाले आगामी 1 देखि 2 दिनमा सम्भोगका लागि सबैभन्दा उर्वर समय जनाउँछ।',
      'आफैँमा LH को उछालले अण्डोत्सर्ग वास्तवमै भयो भन्ने ग्यारेन्टी दिँदैन।',
    ],
    disclaimerText:
      'जानकारीमूलक सामग्री। यो लेखले व्यक्तिगत चिकित्सकीय सल्लाहको स्थान लिँदैन। शङ्का भए स्वास्थ्यकर्मीसँग मार्गदर्शन लिनुहोस्।',
    shareMessage: 'अण्डोत्सर्ग परीक्षण (LH) बुझ्नुहोस् — AWA',
  },
  si: {
    badge: 'සාරවත් බව • ඩිම්බ මෝචන පරීක්ෂණ',
    title: 'ඩිම්බ මෝචන (LH)\nපරීක්ෂණ තේරුම් ගැනීම',
    metaDuration: 'කියවීමට මිනිත්තු 6',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'මධ්‍යම',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'මෙම පටි ක්‍රියා කරන ආකාරය සහ ඒවා භාවිතා කළ යුත්තේ කවදාද.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'LH යනු කුමක්ද?',
      'මෙම පරීක්ෂණ ක්‍රියා කරන ආකාරය',
      'පරීක්ෂා කිරීම ආරම්භ කළ යුත්තේ කවදාද',
      'ප්‍රතිඵලයක් අර්ථකථනය කිරීම',
      'වැරදි ධනාත්මක ප්‍රතිඵල සහ සීමාවන්',
      'වෙනත් සලකුණු සමඟ ඒකාබද්ධ කිරීම',
      'ප්‍රධාන කරුණු',
    ],
    section1Body:
      'LH (ලූටිනයිසින් හෝමෝනය) මොළය විසින් නිපදවන අතර ඩිම්බකෝෂ ක්‍රියා කරන ආකාරය පාලනය කරයි. ඩිම්බ මෝචන පරීක්ෂණ මෙම හෝමෝනයේ ඉහළ යාම හඳුනාගනී, එය පැය 24 සිට 36 කට පසු ඩිම්බය නිකුත් වීමට හේතු වේ.',
    section2Body:
      'මුත්‍රා පරීක්ෂණ පටියක් LH මට්ටම් මනිනු ලබයි: පාලන රේඛාව තරම්ම තද හෝ ඊට වඩා තද පරීක්ෂණ රේඛාවක් ඉහළ යාමක් දක්වයි.',
    section3Body:
      'ඔබේ චක්‍රයෙන් ඇස්තමේන්තු කළ ඩිම්බ මෝචන දිනයට දින කිහිපයකට පෙර පරීක්ෂා කිරීම ආරම්භ කිරීම නිර්දේශිතයි.',
    testingTips: [
      {
        title: 'ඔබේ චක්‍රය මත පදනම් වන්න',
        text: 'ඔබේ චක්‍රවල සාමාන්‍ය දිගෙන් ඇස්තමේන්තු කළ ඩිම්බ මෝචන දිනයට දින කිහිපයකට පෙර ආරම්භ කරන්න.',
      },
      {
        title: 'සෑම දිනකම එකම වේලාවේ පරීක්ෂා කරන්න',
        text: 'ඉතා සුදුසු වන්නේ මධ්‍යාහ්නය වටා, උදෑසන පළමු මුත්‍රා වළක්වා.',
      },
      {
        title: 'ඔබේ මුත්‍රා තනුක කිරීම වළක්වන්න',
        text: 'පරීක්ෂණයට පෙර පැය කිහිපය තුළ විශාල ද්‍රව ප්‍රමාණ සීමා කරන්න.',
      },
    ],
    section4Body:
      'ධනාත්මක ප්‍රතිඵලයක් ඉදිරි දින 1 සිට 2 දක්වා සංසර්ගය සඳහා වඩාත්ම සාරවත් කාලය දක්වයි. ඍණාත්මක ප්‍රතිඵලයක් අදහස් කරන්නේ ඉහළ යාම තවම සිදු නොවූ බව පමණි.',
    limitations: [
      'PCOS ස්වභාවිකවම ඉහළ LH මට්ටම් ඇති කළ හැකි අතර, එය කියවීම අපැහැදිලි කළ හැක',
      'සමහර සාරවත් බව ප්‍රතිකාර ප්‍රතිඵලයට බලපෑ හැක',
      'ඉතා තනුක මුත්‍රා වැරදි ඍණාත්මක ප්‍රතිඵලයක් දිය හැක',
      'අඩු ගුණාත්මක පරීක්ෂණයක් අඩු විශ්වාසදායක විය හැක',
    ],
    infoTitle: 'මතක තබාගන්න',
    infoText:
      'LH ඉහළ යාමක් අවුලුවන හෝමෝන සංඥාවක් දක්වයි, නමුත් තනිවම එය ඩිම්බය සැබවින්ම නිකුත් වූ බව සහතික නොකරයි.',
    tipTitle: 'දැනගත යුතු දේ',
    tipText:
      'ඩිම්බ මෝචන පරීක්ෂණ ඔබේ මූලික ශරීර උෂ්ණත්වය හෝ ගර්භාෂ ග්‍රීවා ශ්ලේෂ්මල නිරීක්ෂණය සමඟ ඒකාබද්ධ කිරීම ඔබේ චක්‍රයේ වඩා සම්පූර්ණ චිත්‍රයක් ලබා දෙයි.',
    summaryPoints: [
      'ඩිම්බ මෝචන පරීක්ෂණ LH ඉහළ යාම හඳුනාගනී, එය පැය 24 සිට 36 කට පසු ඩිම්බය නිකුත් වීමට හේතු වේ.',
      'ඔබේ චක්‍රයෙන් ඇස්තමේන්තු කළ ඩිම්බ මෝචන දිනයට දින කිහිපයකට පෙර පරීක්ෂා කිරීම ආරම්භ කිරීම නිර්දේශිතයි.',
      'ධනාත්මක ප්‍රතිඵලයක් ඉදිරි දින 1 සිට 2 දක්වා සංසර්ගය සඳහා වඩාත්ම සාරවත් කාලය දක්වයි.',
      'තනිවම LH ඉහළ යාමක් ඩිම්බ මෝචනය සැබවින්ම සිදු වූ බව සහතික නොකරයි.',
    ],
    disclaimerText:
      'තොරතුරු අන්තර්ගතයකි. මෙම ලිපිය පුද්ගලීකරණය කළ වෛද්‍ය උපදෙස් වෙනුවට නොපවතී. සැකයක් ඇත්නම්, සෞඛ්‍ය වෘත්තිකයෙකුගෙන් මඟපෙන්වීමක් ලබා ගන්න.',
    shareMessage: 'ඩිම්බ මෝචන (LH) පරීක්ෂණ තේරුම් ගැනීම — AWA',
  },
  th: {
    badge: 'ภาวะเจริญพันธุ์ • การตรวจการตกไข่',
    title: 'ทำความเข้าใจ\nการตรวจการตกไข่ (LH)',
    metaDuration: 'อ่าน 6 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'ปานกลาง',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'แถบทดสอบเหล่านี้ทำงานอย่างไร และควรใช้เมื่อไร',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'LH คืออะไร?',
      'การตรวจเหล่านี้ทำงานอย่างไร',
      'ควรเริ่มตรวจเมื่อไร',
      'การแปลผล',
      'ผลบวกลวงและข้อจำกัด',
      'การใช้ร่วมกับสัญญาณอื่น',
      'ประเด็นสำคัญ',
    ],
    section1Body:
      'LH (ฮอร์โมนลูทีนไนซิง) ผลิตจากสมองและควบคุมการทำงานของรังไข่ การตรวจการตกไข่ตรวจจับการเพิ่มขึ้นอย่างรวดเร็วของฮอร์โมนนี้ ซึ่งกระตุ้นให้ปล่อยไข่ 24 ถึง 36 ชั่วโมงต่อมา',
    section2Body:
      'แถบทดสอบปัสสาวะวัดระดับ LH: เส้นทดสอบที่เข้มเท่ากับหรือเข้มกว่าเส้นควบคุมบ่งบอกถึงการเพิ่มขึ้นอย่างรวดเร็ว',
    section3Body:
      'แนะนำให้เริ่มตรวจก่อนวันตกไข่ที่ประมาณจากรอบเดือนของคุณไม่กี่วัน',
    testingTips: [
      {
        title: 'อิงจากรอบเดือนของคุณ',
        text: 'เริ่มก่อนวันตกไข่ที่ประมาณจากความยาวเฉลี่ยของรอบเดือนของคุณไม่กี่วัน',
      },
      {
        title: 'ตรวจเวลาเดิมทุกวัน',
        text: 'ควรเป็นช่วงเที่ยง หลีกเลี่ยงปัสสาวะครั้งแรกของเช้า',
      },
      {
        title: 'หลีกเลี่ยงการทำให้ปัสสาวะเจือจาง',
        text: 'จำกัดการดื่มน้ำปริมาณมากในชั่วโมงก่อนการตรวจ',
      },
    ],
    section4Body:
      'ผลบวกบ่งบอกถึงช่วงเวลาที่เจริญพันธุ์ที่สุดสำหรับการมีเพศสัมพันธ์ใน 1 ถึง 2 วันถัดไป ผลลบหมายความเพียงว่าการเพิ่มขึ้นอย่างรวดเร็วยังไม่เกิดขึ้น',
    limitations: [
      'PCOS อาจทำให้ระดับ LH สูงตามธรรมชาติ ซึ่งทำให้การอ่านผลไม่ชัด',
      'การรักษาภาวะเจริญพันธุ์บางอย่างอาจส่งผลต่อผลตรวจ',
      'ปัสสาวะที่เจือจางมากอาจให้ผลลบลวง',
      'ชุดตรวจคุณภาพต่ำกว่าอาจเชื่อถือได้น้อยกว่า',
    ],
    infoTitle: 'โปรดจำไว้',
    infoText:
      'การเพิ่มขึ้นอย่างรวดเร็วของ LH บ่งบอกถึงสัญญาณฮอร์โมนที่กระตุ้น แต่ตัวมันเองไม่ได้รับประกันว่าไข่ถูกปล่อยออกมาจริง',
    tipTitle: 'ควรรู้',
    tipText:
      'การใช้การตรวจการตกไข่ร่วมกับอุณหภูมิร่างกายขณะพักหรือการสังเกตเมือกปากมดลูก ให้ภาพรวมของรอบเดือนที่สมบูรณ์ยิ่งขึ้น',
    summaryPoints: [
      'การตรวจการตกไข่ตรวจจับการเพิ่มขึ้นอย่างรวดเร็วของ LH ซึ่งกระตุ้นให้ปล่อยไข่ 24 ถึง 36 ชั่วโมงต่อมา',
      'แนะนำให้เริ่มตรวจก่อนวันตกไข่ที่ประมาณจากรอบเดือนของคุณไม่กี่วัน',
      'ผลบวกบ่งบอกถึงช่วงเวลาที่เจริญพันธุ์ที่สุดสำหรับการมีเพศสัมพันธ์ใน 1 ถึง 2 วันถัดไป',
      'การเพิ่มขึ้นอย่างรวดเร็วของ LH เพียงอย่างเดียวไม่ได้รับประกันว่าการตกไข่เกิดขึ้นจริง',
    ],
    disclaimerText:
      'เนื้อหาเพื่อให้ข้อมูล บทความนี้ไม่ได้ทดแทนคำแนะนำทางการแพทย์เฉพาะบุคคล หากมีข้อสงสัย โปรดขอคำแนะนำจากบุคลากรทางการแพทย์',
    shareMessage: 'ทำความเข้าใจการตรวจการตกไข่ (LH) — AWA',
  },
  vi: {
    badge: 'KHẢ NĂNG THỤ THAI • QUE THỬ RỤNG TRỨNG',
    title: 'Hiểu về que thử\nrụng trứng (LH)',
    metaDuration: '6 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Trung cấp',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Các que thử này hoạt động như thế nào và khi nào nên dùng.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'LH là gì?',
      'Các que thử này hoạt động như thế nào',
      'Khi nào nên bắt đầu thử',
      'Đọc kết quả',
      'Dương tính giả và những hạn chế',
      'Kết hợp với các dấu hiệu khác',
      'Những điểm chính cần nhớ',
    ],
    section1Body:
      'LH (hormone tạo hoàng thể) do não sản xuất và điều khiển hoạt động của buồng trứng. Que thử rụng trứng phát hiện đợt tăng vọt của hormone này, đợt tăng vọt kích hoạt việc phóng thích trứng sau 24 đến 36 giờ.',
    section2Body:
      'Que thử nước tiểu đo nồng độ LH: vạch thử đậm bằng hoặc đậm hơn vạch chứng cho thấy có đợt tăng vọt.',
    section3Body:
      'Nên bắt đầu thử vài ngày trước ngày rụng trứng ước tính dựa trên chu kỳ của bạn.',
    testingTips: [
      {
        title: 'Dựa trên chu kỳ của bạn',
        text: 'Bắt đầu vài ngày trước ngày rụng trứng ước tính dựa trên độ dài trung bình của các chu kỳ của bạn.',
      },
      {
        title: 'Thử vào cùng một giờ mỗi ngày',
        text: 'Tốt nhất vào khoảng giữa trưa, tránh nước tiểu đầu tiên buổi sáng.',
      },
      {
        title: 'Tránh làm loãng nước tiểu',
        text: 'Hạn chế uống nhiều nước trong những giờ trước khi thử.',
      },
    ],
    section4Body:
      'Kết quả dương tính cho thấy thời điểm dễ thụ thai nhất để quan hệ trong 1 đến 2 ngày tiếp theo. Kết quả âm tính chỉ đơn giản có nghĩa là đợt tăng vọt chưa xảy ra.',
    limitations: [
      'PCOS có thể khiến nồng độ LH cao hơn một cách tự nhiên, làm nhiễu việc đọc kết quả',
      'Một số phương pháp điều trị vô sinh có thể ảnh hưởng đến kết quả',
      'Nước tiểu quá loãng có thể cho kết quả âm tính giả',
      'Que thử chất lượng thấp hơn có thể kém tin cậy hơn',
    ],
    infoTitle: 'Hãy ghi nhớ',
    infoText:
      'Đợt tăng vọt LH cho thấy một tín hiệu nội tiết kích hoạt, nhưng tự nó không đảm bảo rằng trứng thực sự đã được phóng thích.',
    tipTitle: 'Nên biết',
    tipText:
      'Kết hợp que thử rụng trứng với thân nhiệt cơ bản hoặc việc quan sát dịch nhầy cổ tử cung sẽ cho bức tranh đầy đủ hơn về chu kỳ của bạn.',
    summaryPoints: [
      'Que thử rụng trứng phát hiện đợt tăng vọt LH, đợt tăng vọt kích hoạt việc phóng thích trứng sau 24 đến 36 giờ.',
      'Nên bắt đầu thử vài ngày trước ngày rụng trứng ước tính dựa trên chu kỳ của bạn.',
      'Kết quả dương tính cho thấy thời điểm dễ thụ thai nhất để quan hệ trong 1 đến 2 ngày tiếp theo.',
      'Một đợt tăng vọt LH tự nó không đảm bảo rằng rụng trứng thực sự đã xảy ra.',
    ],
    disclaimerText:
      'Nội dung mang tính thông tin. Bài viết này không thay thế lời khuyên y khoa cá nhân hóa. Nếu có nghi ngờ, hãy tìm hướng dẫn từ nhân viên y tế.',
    shareMessage: 'Hiểu về que thử rụng trứng (LH) — AWA',
  },
  uz: {
    badge: 'UNUMDORLIK • OVULYATSIYA TESTLARI',
    title: 'Ovulyatsiya (LH)\ntestlarini tushunish',
    metaDuration: '6 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Oʻrta',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Bu test chiziqlari qanday ishlaydi va ulardan qachon foydalanish kerak.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'LH nima?',
      'Bu testlar qanday ishlaydi',
      'Test qilishni qachon boshlash kerak',
      'Natijani talqin qilish',
      'Yolgʻon ijobiy natijalar va cheklovlar',
      'Boshqa belgilar bilan birlashtirish',
      'Asosiy xulosalar',
    ],
    section1Body:
      'LH (lyuteinlashtiruvchi gormon) miyada ishlab chiqariladi va tuxumdonlar ishini boshqaradi. Ovulyatsiya testlari bu gormonning keskin oshishini aniqlaydi, u 24 soatdan 36 soatgacha vaqtdan keyin tuxum hujayra chiqishiga sabab boʻladi.',
    section2Body:
      'Siydik test chizigʻi LH darajasini oʻlchaydi: nazorat chizigʻi kabi toʻq yoki undan toʻqroq test chizigʻi keskin oshishni bildiradi.',
    section3Body:
      'Test qilishni siklingizdan taxmin qilingan ovulyatsiya sanasidan bir necha kun oldin boshlash tavsiya etiladi.',
    testingTips: [
      {
        title: 'Siklingizga tayaning',
        text: 'Sikllaringizning oʻrtacha uzunligidan taxmin qilingan ovulyatsiya sanasidan bir necha kun oldin boshlang.',
      },
      {
        title: 'Har kuni bir vaqtda test qiling',
        text: 'Ideal holda kunning oʻrtasida, ertalabki birinchi siydikdan qoching.',
      },
      {
        title: 'Siydikni suyultirmang',
        text: 'Testdan oldingi soatlarda koʻp suyuqlik ichishni cheklang.',
      },
    ],
    section4Body:
      'Ijobiy natija keyingi 1 kundan 2 kungacha jinsiy aloqa uchun eng unumdor vaqtni bildiradi. Salbiy natija esa shunchaki keskin oshish hali sodir boʻlmaganini anglatadi.',
    limitations: [
      'PCOS tabiiy ravishda yuqoriroq LH darajasiga olib kelishi va oʻlchovni xiralashtirishi mumkin',
      'Baʼzi unumdorlik davolanishlari natijaga taʼsir qilishi mumkin',
      'Juda suyultirilgan siydik yolgʻon salbiy natija berishi mumkin',
      'Sifati pastroq test kamroq ishonchli boʻlishi mumkin',
    ],
    infoTitle: 'Esda tuting',
    infoText:
      'LH ning keskin oshishi qoʻzgʻatuvchi gormonal signalni bildiradi, lekin yakka oʻzi tuxum hujayra haqiqatan chiqqanini kafolatlamaydi.',
    tipTitle: 'Bilish foydali',
    tipText:
      'Ovulyatsiya testlarini bazal tana harorati yoki bachadon boʻyni shilligini kuzatish bilan birlashtirish siklingiz haqida toʻliqroq tasavvur beradi.',
    summaryPoints: [
      'Ovulyatsiya testlari LH ning keskin oshishini aniqlaydi, u 24 soatdan 36 soatgacha vaqtdan keyin tuxum hujayra chiqishiga sabab boʻladi.',
      'Test qilishni siklingizdan taxmin qilingan ovulyatsiya sanasidan bir necha kun oldin boshlash tavsiya etiladi.',
      'Ijobiy natija keyingi 1 kundan 2 kungacha jinsiy aloqa uchun eng unumdor vaqtni bildiradi.',
      'LH ning yakka oʻzi keskin oshishi ovulyatsiya haqiqatan sodir boʻlganini kafolatlamaydi.',
    ],
    disclaimerText:
      'Maʼlumot uchun kontent. Bu maqola shaxsiy tibbiy maslahatni almashtirmaydi. Shubha boʻlsa, sogʻliqni saqlash mutaxassisidan yoʻl-yoʻriq soʻrang.',
    shareMessage: 'Ovulyatsiya (LH) testlarini tushunish — AWA',
  },
  az: {
    badge: 'MÜNBİTLİK • OVULYASİYA TESTLƏRİ',
    title: 'Ovulyasiya testlərini (LH)\nanlamaq',
    metaDuration: '6 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Orta',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Bu zolaqlar necə işləyir və onlardan nə vaxt istifadə etmək lazımdır.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'LH nədir?',
      'Bu testlər necə işləyir',
      'Test etməyə nə vaxt başlamaq lazımdır',
      'Nəticəni şərh etmək',
      'Yalançı müsbət nəticələr və məhdudiyyətlər',
      'Digər əlamətlərlə birləşdirmək',
      'Əsas nəticələr',
    ],
    section1Body:
      'LH (lüteinləşdirici hormon) beyin tərəfindən istehsal olunur və yumurtalıqların fəaliyyətini idarə edir. Ovulyasiya testləri bu hormonun kəskin artımını aşkar edir və bu artım 24–36 saat sonra yumurtahüceyrənin ayrılmasına səbəb olur.',
    section2Body:
      'Sidik test zolağı LH səviyyəsini ölçür: nəzarət xəttindən eyni dərəcədə tünd və ya daha tünd test xətti artımı göstərir.',
    section3Body:
      'Test etməyə dövrünüzə əsasən təxmin edilən ovulyasiya tarixindən bir neçə gün əvvəl başlamaq tövsiyə olunur.',
    testingTips: [
      {
        title: 'Dövrünüzə əsaslanın',
        text: 'Dövrlərinizin orta uzunluğuna əsasən təxmin edilən ovulyasiya tarixindən bir neçə gün əvvəl başlayın.',
      },
      {
        title: 'Hər gün eyni vaxtda test edin',
        text: 'İdeal halda günorta ətrafında, səhərin ilk sidiyindən qaçaraq.',
      },
      {
        title: 'Sidiyi durulaşdırmaqdan çəkinin',
        text: 'Testdən əvvəlki saatlarda çox miqdarda maye qəbulunu məhdudlaşdırın.',
      },
    ],
    section4Body:
      'Müsbət nəticə sonrakı 1–2 gün ərzində cinsi əlaqə üçün ən münbit vaxtı bildirir. Mənfi nəticə sadəcə artımın hələ baş vermədiyini göstərir.',
    limitations: [
      'PKOS təbii olaraq daha yüksək LH səviyyələrinə səbəb ola bilər ki, bu da nəticənin oxunmasını bulandıra bilər',
      'Bəzi münbitlik müalicələri nəticəyə təsir edə bilər',
      'Çox durulaşmış sidik yalançı mənfi nəticə verə bilər',
      'Daha aşağı keyfiyyətli test daha az etibarlı ola bilər',
    ],
    infoTitle: 'Yadda saxlayın',
    infoText:
      'LH artımı tətikləyici hormonal siqnalı göstərir, lakin tək başına yumurtahüceyrənin həqiqətən ayrıldığına zəmanət vermir.',
    tipTitle: 'Bilmək faydalıdır',
    tipText:
      'Ovulyasiya testlərini bazal bədən temperaturunuz və ya uşaqlıq boynu mukusunun müşahidəsi ilə birləşdirmək dövrünüz haqqında daha tam təsəvvür verir.',
    summaryPoints: [
      'Ovulyasiya testləri LH artımını aşkar edir və bu artım 24–36 saat sonra yumurtahüceyrənin ayrılmasına səbəb olur.',
      'Test etməyə dövrünüzə əsasən təxmin edilən ovulyasiya tarixindən bir neçə gün əvvəl başlamaq tövsiyə olunur.',
      'Müsbət nəticə sonrakı 1–2 gün ərzində cinsi əlaqə üçün ən münbit vaxtı bildirir.',
      'Tək LH artımı ovulyasiyanın həqiqətən baş verdiyinə zəmanət vermir.',
    ],
    disclaimerText:
      'Məlumat xarakterli məzmun. Bu məqalə fərdi tibbi məsləhəti əvəz etmir. Şübhə olarsa, tibb işçisindən məsləhət alın.',
    shareMessage: 'Ovulyasiya testlərini (LH) anlamaq — AWA',
  },
  ka: {
    badge: 'ფერტილობა • ოვულაციის ტესტები',
    title: 'ოვულაციის (LH)\nტესტების გაგება',
    metaDuration: '6 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'საშუალო',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'როგორ მუშაობს ეს ზოლები და როდის გამოვიყენოთ.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'რა არის LH?',
      'როგორ მუშაობს ეს ტესტები',
      'როდის დავიწყოთ ტესტირება',
      'შედეგის ინტერპრეტაცია',
      'ცრუ დადებითი შედეგები და შეზღუდვები',
      'სხვა ნიშნებთან შერწყმა',
      'მთავარი დასკვნები',
    ],
    section1Body:
      'LH (ლუტეინიზებელი ჰორმონი) გამოიმუშავება ტვინის მიერ და აკონტროლებს საკვერცხეების მუშაობას. ოვულაციის ტესტები ამ ჰორმონის მატებას აღმოაჩენს, რომელიც კვერცხუჯრედის გამოთავისუფლებას 24-დან 36 საათში იწვევს.',
    section2Body:
      'შარდის სატესტო ზოლი LH-ის დონეს ზომავს: საკონტროლო ხაზის ტოლი ან მასზე მუქი სატესტო ხაზი მატებაზე მიუთითებს.',
    section3Body:
      'რეკომენდებულია ტესტირების დაწყება თქვენი ციკლის მიხედვით შეფასებული ოვულაციის თარიღამდე რამდენიმე დღით ადრე.',
    testingTips: [
      {
        title: 'დაეყრდენით თქვენს ციკლს',
        text: 'დაიწყეთ თქვენი ციკლების საშუალო ხანგრძლივობის მიხედვით შეფასებული ოვულაციის თარიღამდე რამდენიმე დღით ადრე.',
      },
      {
        title: 'ტესტირება ყოველდღე ერთსა და იმავე დროს',
        text: 'იდეალურად შუადღისას, დილის პირველი შარდის თავიდან აცილებით.',
      },
      {
        title: 'შარდის გაზავება აარიდეთ',
        text: 'ტესტამდე რამდენიმე საათის განმავლობაში დიდი რაოდენობით სითხეები შეზღუდეთ.',
      },
    ],
    section4Body:
      'დადებითი შედეგი ყველაზე ფერტილურ დროზე მიუთითებს სქესობრივი კავშირისთვის მომდევნო 1-დან 2 დღემდე. უარყოფითი შედეგი უბრალოდ ნიშნავს, რომ მატება ჯერ არ მოხდარა.',
    limitations: [
      'PCOS-მა შეიძლება ბუნებრივად უფრო მაღალი LH-ის დონე გამოიწვიოს, რამაც ჩვენება დაბინდოს',
      'ფერტილობის ზოგიერთმა მკურნალობამ შეიძლება შედეგზე იმოქმედოს',
      'ძალიან გაზავებულმა შარდმა შეიძლება ცრუ უარყოფითი შედეგი მისცეს',
      'დაბალი ხარისხის ტესტი შეიძლება ნაკლებად სანდო იყოს',
    ],
    infoTitle: 'გაითვალისწინეთ',
    infoText:
      'LH-ის მატება გამომწვევ ჰორმონულ სიგნალზე მიუთითებს, მაგრამ თავისთავად იმის გარანტიას არ იძლევა, რომ კვერცხუჯრედი ნამდვილად გამოთავისუფლდა.',
    tipTitle: 'კარგია ვიცოდეთ',
    tipText:
      'ოვულაციის ტესტების შერწყმა ბაზალურ ტემპერატურასთან ან საშვილოსნოს ყელის ლორწოს დაკვირვებასთან თქვენი ციკლის უფრო სრულ სურათს გვაძლევს.',
    summaryPoints: [
      'ოვულაციის ტესტები LH-ის მატებას აღმოაჩენს, რომელიც კვერცხუჯრედის გამოთავისუფლებას 24-დან 36 საათში იწვევს.',
      'რეკომენდებულია ტესტირების დაწყება თქვენი ციკლის მიხედვით შეფასებული ოვულაციის თარიღამდე რამდენიმე დღით ადრე.',
      'დადებითი შედეგი ყველაზე ფერტილურ დროზე მიუთითებს სქესობრივი კავშირისთვის მომდევნო 1-დან 2 დღემდე.',
      'LH-ის მატება თავისთავად იმის გარანტიას არ იძლევა, რომ ოვულაცია ნამდვილად მოხდა.',
    ],
    disclaimerText:
      'საინფორმაციო შინაარსი. ეს სტატია პერსონალიზებულ სამედიცინო რჩევას არ ანაცვლებს. ეჭვის შემთხვევაში მიმართეთ ჯანდაცვის სპეციალისტს.',
    shareMessage: 'ოვულაციის (LH) ტესტების გაგება — AWA',
  },
  hy: {
    badge: 'ՊՏՂԱԲԵՐՈՒԹՅՈՒՆ • ՁՎԱԶԱՏՄԱՆ ԹԵՍՏԵՐ',
    title: 'Հասկանալ ձվազատման\nթեստերը (LH)',
    metaDuration: '6 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Միջին',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Ինչպես են աշխատում այս շերտիկները և երբ օգտագործել դրանք:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Ի՞նչ է LH-ն',
      'Ինչպես են աշխատում այս թեստերը',
      'Երբ սկսել թեստավորումը',
      'Արդյունքի մեկնաբանում',
      'Կեղծ դրական արդյունքներ և սահմանափակումներ',
      'Համադրել այլ նշանների հետ',
      'Հիմնական եզրակացություններ',
    ],
    section1Body:
      'LH-ն (լյուտեինացնող հորմոն) արտադրվում է ուղեղի կողմից և վերահսկում է ձվարանների աշխատանքը: Ձվազատման թեստերը հայտնաբերում են այս հորմոնի թռիչքը, որն առաջացնում է ձվաբջջի ազատումը 24–36 ժամ հետո:',
    section2Body:
      'Մեզի թեստային շերտիկը չափում է LH-ի մակարդակը. թեստային գիծը, որը նույնքան մուգ է կամ ավելի մուգ, քան հսկիչ գիծը, ցույց է տալիս թռիչք:',
    section3Body:
      'Խորհուրդ է տրվում սկսել թեստավորումը ձեր ցիկլից գնահատված ձվազատման ամսաթվից մի քանի օր առաջ:',
    testingTips: [
      {
        title: 'Հիմնվեք ձեր ցիկլի վրա',
        text: 'Սկսեք ձեր ցիկլերի միջին տևողությունից գնահատված ձվազատման ամսաթվից մի քանի օր առաջ:',
      },
      {
        title: 'Թեստավորեք ամեն օր նույն ժամին',
        text: 'Իդեալականը կեսօրվա շուրջ է՝ խուսափելով առավոտյան առաջին մեզից:',
      },
      {
        title: 'Խուսափեք մեզը նոսրացնելուց',
        text: 'Թեստից առաջ մի քանի ժամվա ընթացքում սահմանափակեք հեղուկների մեծ քանակը:',
      },
    ],
    section4Body:
      'Դրական արդյունքը ազդանշան է հաջորդ 1–2 օրվա ընթացքում սեռական հարաբերության համար ամենապտղաբեր ժամանակի մասին: Բացասական արդյունքը պարզապես նշանակում է, որ թռիչքը դեռ տեղի չի ունեցել:',
    limitations: [
      'PCOS-ը կարող է բնականորեն առաջացնել LH-ի ավելի բարձր մակարդակ, ինչը կարող է մշուշել ցուցմունքը',
      'Պտղաբերության որոշ բուժումներ կարող են ազդել արդյունքի վրա',
      'Շատ նոսրացված մեզը կարող է տալ կեղծ բացասական արդյունք',
      'Ավելի ցածր որակի թեստը կարող է ավելի քիչ հուսալի լինել',
    ],
    infoTitle: 'Հիշեք',
    infoText:
      'LH-ի թռիչքը ցույց է տալիս հորմոնալ գործարկող ազդանշան, սակայն միայնակ չի երաշխավորում, որ ձվաբջիջն իրականում ազատվել է:',
    tipTitle: 'Լավ է իմանալ',
    tipText:
      'Ձվազատման թեստերը բազալ ջերմաստիճանի կամ արգանդի վզիկի լորձի դիտարկման հետ համադրելը տալիս է ձեր ցիկլի ավելի ամբողջական պատկերը:',
    summaryPoints: [
      'Ձվազատման թեստերը հայտնաբերում են LH-ի թռիչքը, որն առաջացնում է ձվաբջջի ազատումը 24–36 ժամ հետո:',
      'Խորհուրդ է տրվում սկսել թեստավորումը ձեր ցիկլից գնահատված ձվազատման ամսաթվից մի քանի օր առաջ:',
      'Դրական արդյունքը ազդանշան է հաջորդ 1–2 օրվա ընթացքում սեռական հարաբերության համար ամենապտղաբեր ժամանակի մասին:',
      'LH-ի թռիչքը միայնակ չի երաշխավորում, որ ձվազատումն իրականում տեղի է ունեցել:',
    ],
    disclaimerText:
      'Տեղեկատվական բովանդակություն: Այս հոդվածը չի փոխարինում անհատականացված բժշկական խորհրդատվությանը: Կասկածի դեպքում խորհուրդ հարցրեք առողջապահության մասնագետից:',
    shareMessage: 'Հասկանալ ձվազատման թեստերը (LH) — AWA',
  },
  tg: {
    badge: 'ҲОСИЛХЕЗӢ • САНҶИШҲОИ ОВУЛЯЦИЯ',
    title: 'Фаҳмидани санҷишҳои\nовуляция (LH)',
    metaDuration: '6 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Миёна',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Ин навораҳо чӣ тавр кор мекунанд ва кай онҳоро истифода бурдан лозим аст.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'LH чист?',
      'Ин санҷишҳо чӣ тавр кор мекунанд',
      'Санҷишро кай оғоз кардан лозим аст',
      'Тафсири натиҷа',
      'Натиҷаҳои нодурусти мусбат ва маҳдудиятҳо',
      'Якҷоя кардан бо нишонаҳои дигар',
      'Хулосаҳои асосӣ',
    ],
    section1Body:
      'LH (гормони лютеинкунанда) аз ҷониби майна тавлид мешавад ва кори тухмдонҳоро идора мекунад. Санҷишҳои овуляция афзоиши ногаҳонии ин гормонро ошкор мекунанд, ки 24 то 36 соат баъд озод шудани тухмселро ба вуҷуд меорад.',
    section2Body:
      'Навори санҷиши пешоб сатҳи LH-ро андоза мекунад: хатти санҷиш, ки ба қадри хатти назоратӣ ё торитар аст, афзоишро нишон медиҳад.',
    section3Body:
      'Тавсия дода мешавад, ки санҷишро чанд рӯз пеш аз санаи овуляция, ки аз давраи шумо тахмин шудааст, оғоз кунед.',
    testingTips: [
      {
        title: 'Ба давраи худ такя кунед',
        text: 'Чанд рӯз пеш аз санаи овуляцияи аз дарозии миёнаи давраҳои шумо тахминшуда оғоз кунед.',
      },
      {
        title: 'Ҳар рӯз дар як вақт санҷед',
        text: 'Беҳтараш наздики нисфирӯзӣ, аз пешоби аввали субҳ худдорӣ карда.',
      },
      {
        title: 'Аз ғафс нашудани пешоб худдорӣ кунед',
        text: 'Дар соатҳои пеш аз санҷиш нӯшидани моеъи зиёдро маҳдуд кунед.',
      },
    ],
    section4Body:
      'Натиҷаи мусбат вақти ҳосилхезтаринро барои наздикӣ дар 1 то 2 рӯзи минбаъда нишон медиҳад. Натиҷаи манфӣ танҳо маънои онро дорад, ки афзоиш ҳанӯз рух надодааст.',
    limitations: [
      'PCOS метавонад сатҳи табиатан баландтари LH-ро ба вуҷуд орад, ки хонишро норавшан мекунад',
      'Баъзе табобатҳои ҳосилхезӣ метавонанд ба натиҷа таъсир расонанд',
      'Пешоби хеле обакӣ метавонад натиҷаи нодурусти манфӣ диҳад',
      'Санҷиши сифати пасттар метавонад камтар боэътимод бошад',
    ],
    infoTitle: 'Дар хотир доред',
    infoText:
      'Афзоиши LH сигнали гормонии оғозкунандаро нишон медиҳад, вале худ ба худ кафолат намедиҳад, ки тухмсел воқеан озод шудааст.',
    tipTitle: 'Донистан хуб аст',
    tipText:
      'Якҷоя кардани санҷишҳои овуляция бо ҳарорати базалии бадан ё мушоҳидаи шилимшиқи гардани бачадон тасвири пурратари давраи шуморо медиҳад.',
    summaryPoints: [
      'Санҷишҳои овуляция афзоиши LH-ро ошкор мекунанд, ки 24 то 36 соат баъд озод шудани тухмселро ба вуҷуд меорад.',
      'Тавсия дода мешавад, ки санҷишро чанд рӯз пеш аз санаи овуляцияи аз давраи шумо тахминшуда оғоз кунед.',
      'Натиҷаи мусбат вақти ҳосилхезтаринро барои наздикӣ дар 1 то 2 рӯзи минбаъда нишон медиҳад.',
      'Афзоиши LH худ ба худ кафолат намедиҳад, ки овуляция воқеан рух додааст.',
    ],
    disclaimerText:
      'Мазмуни иттилоотӣ. Ин мақола маслиҳати шахсии тиббиро иваз намекунад. Дар сурати шубҳа аз мутахассиси соҳаи тиб роҳнамоӣ пурсед.',
    shareMessage: 'Фаҳмидани санҷишҳои овуляция (LH) — AWA',
  },
  ky: {
    badge: 'БОЙГО БҮТҮҮ • ОВУЛЯЦИЯ ТЕСТТЕРИ',
    title: 'Овуляция тесттерин (ЛГ)\nтүшүнүү',
    metaDuration: '6 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Орто',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Бул тилкелер кантип иштейт жана аларды качан колдонуу керек.',
    contentsTitle: 'Бул макалада',
    topics: [
      'ЛГ деген эмне?',
      'Бул тесттер кантип иштейт',
      'Тестти качан баштоо керек',
      'Жыйынтыкты чечмелөө',
      'Жалган оң жыйынтыктар жана чектөөлөр',
      'Аларды башка белгилер менен айкалыштыруу',
      'Негизги жыйынтыктар',
    ],
    section1Body:
      'ЛГ (лютеинизациялоочу гормон) мээде өндүрүлөт жана жумурткалыктардын иштешин башкарат. Овуляция тесттери бул гормондун кескин көтөрүлүшүн аныктайт, ал 24–36 сааттан кийин жумурткалуу клетканын чыгышын козгойт.',
    section2Body:
      'Заара тест тилкеси ЛГ деңгээлин өлчөйт: тест сызыгы көзөмөл сызыгындай же андан да кара болсо, кескин көтөрүлүштү көрсөтөт.',
    section3Body:
      'Тестти циклиңизден болжолдонгон овуляция күнүнөн бир нече күн мурун баштоо сунушталат.',
    testingTips: [
      {
        title: 'Циклиңизге таянып баштаңыз',
        text: 'Циклдериңиздин орточо узактыгынан болжолдонгон овуляция күнүнөн бир нече күн мурун баштаңыз.',
      },
      {
        title: 'Күн сайын бир эле убакта тестиңиз',
        text: 'Идеалында түш ченде, эртең мененки биринчи зааранан сактанып.',
      },
      {
        title: 'Зааранын суюлушуна жол бербеңиз',
        text: 'Тесттен мурунку сааттарда көп өлчөмдө суюктук ичүүнү чектеңиз.',
      },
    ],
    section4Body:
      'Оң жыйынтык кийинки 1–2 күндө жыныстык катнаш үчүн эң ыңгайлуу убакытты көрсөтөт. Терс жыйынтык кескин көтөрүлүш азырынча болгон эмес дегенди гана билдирет.',
    limitations: [
      'PCOS табигый түрдө жогору ЛГ деңгээлин жаратышы мүмкүн, бул окулган көрсөткүчтү бүдөмүктөтөт',
      'Айрым бойго бүтүү жөндөмдүүлүгүн дарылоолор жыйынтыкка таасир этиши мүмкүн',
      'Өтө суюлган заара жалган терс жыйынтык бериши мүмкүн',
      'Сапаты төмөнүрөөк тест ишенимдүүлүгү азыраак болушу мүмкүн',
    ],
    infoTitle: 'Эстен чыгарбаңыз',
    infoText:
      'ЛГ кескин көтөрүлүшү козгогуч гормондук сигналды көрсөтөт, бирок өзү жумурткалуу клетка чындап чыкканына кепилдик бербейт.',
    tipTitle: 'Билүү пайдалуу',
    tipText:
      'Овуляция тесттерин базалдык дене температураңыз же жатын моюнчасынын былжырын байкоо менен айкалыштыруу циклиңиздин толугураак сүрөтүн берет.',
    summaryPoints: [
      'Овуляция тесттери ЛГ кескин көтөрүлүшүн аныктайт, ал 24–36 сааттан кийин жумурткалуу клетканын чыгышын козгойт.',
      'Тестти циклиңизден болжолдонгон овуляция күнүнөн бир нече күн мурун баштоо сунушталат.',
      'Оң жыйынтык кийинки 1–2 күндө жыныстык катнаш үчүн эң ыңгайлуу убакытты көрсөтөт.',
      'ЛГ кескин көтөрүлүшү өзү овуляция чындап болгонуна кепилдик бербейт.',
    ],
    disclaimerText:
      'Маалымат берүүчү мазмун. Бул макала жекелештирилген медициналык кеңешти алмаштырбайт. Күмөн болсо, ден соолук сактоо адисинен кеңеш сураңыз.',
    shareMessage: 'Овуляция тесттерин (ЛГ) түшүнүү — AWA',
  },
  tk: {
    badge: 'GÖWRELI BOLMAK UKYBY • OVULÝASIÝA SYNAGLARY',
    title: 'Ovulýasiýa synaglaryny (LH)\ndüşünmek',
    metaDuration: '6 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Orta',
    metaValidated: 'Barlanan mazmun',
    intro: 'Bu zolaklar nähili işleýär we olary haçan ulanmaly.',
    contentsTitle: 'Bu makalada',
    topics: [
      'LH näme?',
      'Bu synaglar nähili işleýär',
      'Synagy haçan başlamaly',
      'Netijäni düşündirmek',
      'Ýalňyş oňyn netijeler we çäkler',
      'Beýleki alamatlar bilen utgaşdyrmak',
      'Esasy netijeler',
    ],
    section1Body:
      'LH (lýuteinleşdirýji gormon) beýni tarapyndan öndürilýär we ýumurtgalygyň işleýşini dolandyrýar. Ovulýasiýa synaglary bu gormonyň göterilmesini anyklaýar, ol 24–36 sagatdan ýumurtganyň çykmagyny başlaýar.',
    section2Body:
      'Peşew synag zolagy LH derejesini ölçeýär: dolandyryş çyzygy ýaly goýy ýa-da ondan goýy synag çyzygy göterilmäni görkezýär.',
    section3Body:
      'Sikliňiz boýunça çaklanylýan ovulýasiýa senesinden birnäçe gün öň synagy başlamak maslahat berilýär.',
    testingTips: [
      {
        title: 'Sikliňize daýanyň',
        text: 'Siklleriňiziň ortaça uzynlygyndan çaklanylýan ovulýasiýa senesinden birnäçe gün öň başlaň.',
      },
      {
        title: 'Her gün şol bir wagtda synag ediň',
        text: 'Ideal ýagdaýda günortan töweregi, irden ilkinji peşewden gaça durup.',
      },
      {
        title: 'Peşewiňizi suwlandyrmakdan gaça durmaň',
        text: 'Synagdan öňki sagatlarda köp mukdarda suwuklyk içmegi çäkläň.',
      },
    ],
    section4Body:
      'Oňyn netije indiki 1–2 günde jynsy gatnaşyk üçin iň amatly wagty görkezýär. Otrisatel netije diňe göterilmäniň heniz bolmandygyny aňladýar.',
    limitations: [
      'PCOS tebigy ýagdaýda has ýokary LH derejesine sebäp bolup biler, bu okalyşy bulaşdyryp biler',
      'Käbir göwreli bolmak bejergileri netijä täsir edip biler',
      'Gaty suwlandyrylan peşew ýalňyş otrisatel netije berip biler',
      'Hili pes synag has az ygtybarly bolup biler',
    ],
    infoTitle: 'Ýatda saklaň',
    infoText:
      'LH göterilmesi gozgaýjy gormonal signaly görkezýär, ýöne ýeke özi ýumurtganyň hakykatdan çykandygyny kepillendirmeýär.',
    tipTitle: 'Bilmek peýdaly',
    tipText:
      'Ovulýasiýa synaglaryny bazal beden temperaturasy ýa-da ýatgy boýnunyň ýaňsyny synlamak bilen utgaşdyrmak sikliňiziň has doly suratyny berýär.',
    summaryPoints: [
      'Ovulýasiýa synaglary 24–36 sagatdan ýumurtganyň çykmagyny başladýan LH göterilmesini anyklaýar.',
      'Sikliňiz boýunça çaklanylýan ovulýasiýa senesinden birnäçe gün öň synagy başlamak maslahat berilýär.',
      'Oňyn netije indiki 1–2 günde jynsy gatnaşyk üçin iň amatly wagty görkezýär.',
      'LH göterilmesi ýeke özi ovulýasiýanyň hakykatdan bolandygyny kepillendirmeýär.',
    ],
    disclaimerText:
      'Maglumat berýän mazmun. Bu makala şahsylaşdyrylan lukmançylyk maslahatyny çalyşmaýar. Şübhe bolsa, saglyk hünärmeninden ugrukdyrma soraň.',
    shareMessage: 'Ovulýasiýa synaglaryny (LH) düşünmek — AWA',
  },
} as const);

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

/* -------------------------------------------------------------------------- */
/* SCREEN                                                                     */
/* -------------------------------------------------------------------------- */

export default function LhTestsArticleScreen({
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
              <View key={index} style={styles.contentRow}>
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

          {/* ================================================================= */}
          {/* SECTION 3                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.topics[2]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>{content.section3Body}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.comfortCard}>
            {TESTING_TIP_ICONS.map((icon, index) => (
              <View
                key={icon}
                style={[
                  styles.comfortRow,
                  index < TESTING_TIP_ICONS.length - 1 && styles.comfortRowBorder,
                ]}>
                <View style={styles.comfortIcon}>
                  <MaterialDesignIcons
                    name={icon as never}
                    size={19}
                    color={theme.colors.primary}
                  />
                </View>

                <View style={styles.comfortCopy}>
                  <AwaText variant="titleSmall" emphasized>{content.testingTips[index].title}</AwaText>
                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.comfortText}>{content.testingTips[index].text}</AwaText>
                </View>
              </View>
            ))}
          </AwaCard>

          {/* ================================================================= */}
          {/* SECTION 4                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.topics[3]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>{content.section4Body}</AwaText>

          {/* ================================================================= */}
          {/* SECTION 5                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>5. {content.topics[4]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.limitations.map((item, index) => (
              <View key={index} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="checkbox-blank-circle-outline"
                  size={14}
                  color={theme.colors.primary}
                />

                <AwaText variant="bodySmall" style={styles.checkText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

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
            {content.summaryPoints.map((item, index) => (
              <View key={index} style={styles.summaryRow}>
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

  infoCard: {
    marginTop: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoCopy: {flex: 1, marginLeft: 8},
  infoText: {marginTop: 3},

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
