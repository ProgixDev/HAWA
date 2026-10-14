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

const ID = 'ring-anneau-vaginal';

const HERO = require('../../assets/images/library/popular-phases.png');

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const CARE_TIP_ICONS = [
  'hand-heart-outline',
  'calendar-week-outline',
  'shield-check-outline',
  'alert-circle-outline',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'ANNEAU VAGINAL',
    title: 'L’anneau vaginal\ncontraceptif',
    metaDuration: '5 min de lecture',
    metaType: 'Article',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Un anneau souple, posé pour trois semaines.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Comment fonctionne l’anneau',
      'La pose et le retrait',
      'Ce qu’il faut savoir',
      'À retenir',
    ],
    body1:
      'L’anneau est un dispositif souple qui libère en continu de faibles doses d’hormones directement au niveau vaginal, avec la même action contraceptive qu’une pilule combinée.',
    flowTitle: 'Son fonctionnement',
    flowSteps: [
      {title: 'Anneau', text: 'Placé dans le vagin'},
      {title: 'Hormones', text: 'Diffusion continue'},
      {title: 'Protection', text: 'Action contraceptive'},
    ],
    body2:
      'Il se place soi-même, reste en continu pendant trois semaines, puis est retiré pour une semaine de pause pendant laquelle les règles surviennent.',
    calendarTitle: 'Un rythme simple à suivre',
    weekLabelActive: 'Anneau',
    weekLabelPause: 'Pause',
    legendActive: 'Période avec anneau',
    legendPause: 'Semaine de pause',
    tip1Title: 'Bon à savoir',
    tip1Text:
      'Sa position exacte dans le vagin n’a pas besoin d’être précise pour être efficace, ce qui le rend simple à utiliser.',
    body3:
      'L’anneau présente plusieurs points pratiques à connaître avant de l’adopter.',
    careTips: [
      {title: 'Simple à utiliser', text: 'Il se pose et se retire soi-même.'},
      {title: 'Rythme régulier', text: 'Il reste généralement en place pendant trois semaines.'},
      {title: 'Action continue', text: 'Les hormones sont diffusées en continu pendant la période d’utilisation.'},
      {title: 'Ne protège pas des IST', text: 'Une protection supplémentaire peut être nécessaire selon la situation.'},
    ],
    checkListTitle: 'Les bons réflexes',
    practicalSteps: [
      'Se laver les mains avant la pose ou le retrait',
      'Choisir un moment facile à retenir pour suivre le calendrier',
      'Vérifier occasionnellement qu’il est toujours en place',
      'Consulter la notice en cas de déplacement ou d’expulsion',
    ],
    alertTitle: 'À noter',
    alertText:
      'Une expulsion ou un déplacement prolongé peut nécessiter des consignes particulières. Consulte toujours la notice du dispositif ou demande conseil à un professionnel de santé en cas de doute.',
    summaryTitle: 'L’essentiel en 4 points',
    summaryItems: [
      {title: 'Pose simple', text: 'L’anneau peut être posé et retiré soi-même.'},
      {title: 'Rythme hebdomadaire', text: 'Il suit généralement un cycle de trois semaines avec une semaine de pause.'},
      {title: 'Contrôle occasionnel', text: 'Vérifier régulièrement sa présence aide à utiliser le dispositif sereinement.'},
      {title: 'Pas de protection contre les IST', text: 'Une protection adaptée peut être nécessaire selon la situation.'},
    ],
    tip2Title: 'À retenir',
    tip2Text:
      'L’anneau vaginal combine une diffusion hormonale continue avec un rythme d’utilisation qui évite une prise quotidienne. Le choix d’une contraception doit toutefois être adapté à chaque personne et discuté avec un professionnel de santé.',
    shareMessage: 'L’anneau vaginal contraceptif — AWA',
  },
  en: {
    badge: 'VAGINAL RING',
    title: 'The contraceptive\nvaginal ring',
    metaDuration: '5 min read',
    metaType: 'Article',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'A flexible ring, worn for three weeks.',
    contentsTitle: 'In this article',
    topics: [
      'How the ring works',
      'Insertion and removal',
      'What you need to know',
      'Key takeaways',
    ],
    body1:
      'The ring is a flexible device that continuously releases low doses of hormones directly in the vagina, with the same contraceptive action as a combined pill.',
    flowTitle: 'How it works',
    flowSteps: [
      {title: 'Ring', text: 'Placed in the vagina'},
      {title: 'Hormones', text: 'Continuous diffusion'},
      {title: 'Protection', text: 'Contraceptive action'},
    ],
    body2:
      'You insert it yourself, it stays in place continuously for three weeks, then it’s removed for a one-week break during which your period occurs.',
    calendarTitle: 'A simple rhythm to follow',
    weekLabelActive: 'Ring',
    weekLabelPause: 'Break',
    legendActive: 'Week with the ring',
    legendPause: 'Break week',
    tip1Title: 'Good to know',
    tip1Text:
      'Its exact position in the vagina doesn’t need to be precise for it to be effective, which makes it simple to use.',
    body3:
      'The ring has several practical points worth knowing before choosing it.',
    careTips: [
      {title: 'Simple to use', text: 'You insert and remove it yourself.'},
      {title: 'Regular rhythm', text: 'It generally stays in place for three weeks.'},
      {title: 'Continuous action', text: 'Hormones are released continuously throughout the period of use.'},
      {title: 'Doesn’t protect against STIs', text: 'Additional protection may be needed depending on the situation.'},
    ],
    checkListTitle: 'Good habits to keep',
    practicalSteps: [
      'Wash your hands before inserting or removing it',
      'Choose a time that’s easy to remember to keep track of the schedule',
      'Occasionally check that it’s still in place',
      'Check the leaflet if it shifts or is expelled',
    ],
    alertTitle: 'Please note',
    alertText:
      'An expulsion or prolonged displacement may require specific guidance. Always check the device’s leaflet or ask a healthcare professional if you’re unsure.',
    summaryTitle: 'The essentials in 4 points',
    summaryItems: [
      {title: 'Simple insertion', text: 'The ring can be inserted and removed by yourself.'},
      {title: 'Weekly rhythm', text: 'It generally follows a three-week cycle with a one-week break.'},
      {title: 'Occasional check', text: 'Checking regularly that it’s in place helps you use the device with peace of mind.'},
      {title: 'No protection against STIs', text: 'Suitable protection may be needed depending on the situation.'},
    ],
    tip2Title: 'Key takeaways',
    tip2Text:
      'The vaginal ring combines continuous hormone release with a usage rhythm that avoids a daily dose. However, the choice of contraception should be tailored to each person and discussed with a healthcare professional.',
    shareMessage: 'The contraceptive vaginal ring — AWA',
  },
  es: {
    badge: 'ANILLO VAGINAL',
    title: 'El anillo vaginal\nanticonceptivo',
    metaDuration: '5 min de lectura',
    metaType: 'Artículo',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Un anillo flexible, que se coloca durante tres semanas.',
    contentsTitle: 'En este artículo',
    topics: [
      'Cómo funciona el anillo',
      'La colocación y la extracción',
      'Lo que hay que saber',
      'Lo esencial',
    ],
    body1:
      'El anillo es un dispositivo flexible que libera de forma continua dosis bajas de hormonas directamente a nivel vaginal, con la misma acción anticonceptiva que una píldora combinada.',
    flowTitle: 'Su funcionamiento',
    flowSteps: [
      {title: 'Anillo', text: 'Colocado en la vagina'},
      {title: 'Hormonas', text: 'Difusión continua'},
      {title: 'Protección', text: 'Acción anticonceptiva'},
    ],
    body2:
      'Te lo colocas tú misma, permanece de forma continua durante tres semanas y después se retira para una semana de descanso, durante la cual se produce la menstruación.',
    calendarTitle: 'Un ritmo sencillo de seguir',
    weekLabelActive: 'Anillo',
    weekLabelPause: 'Descanso',
    legendActive: 'Semana con anillo',
    legendPause: 'Semana de descanso',
    tip1Title: 'DATO ÚTIL',
    tip1Text:
      'Su posición exacta en la vagina no necesita ser precisa para que sea eficaz, lo que lo hace sencillo de usar.',
    body3:
      'El anillo presenta varios aspectos prácticos que conviene conocer antes de adoptarlo.',
    careTips: [
      {title: 'Fácil de usar', text: 'Puedes colocarlo y retirarlo tú misma.'},
      {title: 'Ritmo regular', text: 'Generalmente permanece colocado durante tres semanas.'},
      {title: 'Acción continua', text: 'Las hormonas se liberan de forma continua durante el período de uso.'},
      {title: 'No protege de las ITS', text: 'Puede ser necesaria una protección adicional según la situación.'},
    ],
    checkListTitle: 'Los buenos hábitos',
    practicalSteps: [
      'Lávate las manos antes de colocarlo o retirarlo',
      'Elige un momento fácil de recordar para seguir el calendario',
      'Comprueba de vez en cuando que sigue colocado',
      'Consulta el prospecto en caso de desplazamiento o expulsión',
    ],
    alertTitle: 'A tener en cuenta',
    alertText:
      'Una expulsión o un desplazamiento prolongado puede requerir instrucciones particulares. Consulta siempre el prospecto del dispositivo o pide consejo a un profesional de la salud en caso de duda.',
    summaryTitle: 'Lo esencial en 4 puntos',
    summaryItems: [
      {title: 'Colocación sencilla', text: 'Puedes colocarlo y retirarlo tú misma.'},
      {title: 'Ritmo semanal', text: 'Generalmente sigue un ciclo de tres semanas con una semana de descanso.'},
      {title: 'Control ocasional', text: 'Comprobar regularmente su presencia ayuda a usar el dispositivo con tranquilidad.'},
      {title: 'Sin protección frente a las ITS', text: 'Puede ser necesaria una protección adecuada según la situación.'},
    ],
    tip2Title: 'Para recordar',
    tip2Text:
      'El anillo vaginal combina una liberación hormonal continua con un ritmo de uso que evita una toma diaria. Sin embargo, la elección de una anticoncepción debe adaptarse a cada persona y hablarse con un profesional de la salud.',
    shareMessage: 'El anillo vaginal anticonceptivo — AWA',
  },
  it: {
    badge: 'ANELLO VAGINALE',
    title: 'L’anello vaginale\ncontraccettivo',
    metaDuration: '5 min di lettura',
    metaType: 'Articolo',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Un anello flessibile, da portare per tre settimane.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Come funziona l’anello',
      'Inserimento e rimozione',
      'Cosa devi sapere',
      'Punti chiave',
    ],
    body1: 'L’anello è un dispositivo flessibile che rilascia in modo continuo basse dosi di ormoni direttamente in vagina, con la stessa azione contraccettiva di una pillola combinata.',
    flowTitle: 'Come funziona',
    flowSteps: [
      {
        title: 'Anello',
        text: 'Posizionato in vagina',
      },
      {
        title: 'Ormoni',
        text: 'Diffusione continua',
      },
      {
        title: 'Protezione',
        text: 'Azione contraccettiva',
      },
    ],
    body2: 'Lo inserisci da sola, resta in sede in modo continuo per tre settimane, poi viene rimosso per una pausa di una settimana durante la quale arriva il periodo mestruale.',
    calendarTitle: 'Un ritmo semplice da seguire',
    weekLabelActive: 'Anello',
    weekLabelPause: 'Pausa',
    legendActive: 'Settimana con l’anello',
    legendPause: 'Settimana di pausa',
    tip1Title: 'Da sapere',
    tip1Text: 'La sua posizione esatta in vagina non deve essere precisa perché sia efficace, il che lo rende semplice da usare.',
    body3: 'L’anello ha diversi aspetti pratici che vale la pena conoscere prima di sceglierlo.',
    careTips: [
      {
        title: 'Semplice da usare',
        text: 'Lo inserisci e lo rimuovi da sola.',
      },
      {
        title: 'Ritmo regolare',
        text: 'In genere resta in sede per tre settimane.',
      },
      {
        title: 'Azione continua',
        text: 'Gli ormoni vengono rilasciati in modo continuo per tutto il periodo di utilizzo.',
      },
      {
        title: 'Non protegge dalle infezioni sessualmente trasmissibili',
        text: 'A seconda della situazione, può essere necessaria una protezione aggiuntiva.',
      },
    ],
    checkListTitle: 'Buone abitudini da mantenere',
    practicalSteps: [
      'Lavati le mani prima di inserirlo o rimuoverlo',
      'Scegli un momento facile da ricordare per tenere traccia del calendario',
      'Controlla di tanto in tanto che sia ancora in sede',
      'Consulta il foglio illustrativo se si sposta o viene espulso',
    ],
    alertTitle: 'Attenzione',
    alertText: 'Un’espulsione o uno spostamento prolungato possono richiedere indicazioni specifiche. Consulta sempre il foglio illustrativo del dispositivo o rivolgiti a un’operatrice o a un operatore sanitario se hai dubbi.',
    summaryTitle: 'L’essenziale in 4 punti',
    summaryItems: [
      {
        title: 'Inserimento semplice',
        text: 'L’anello può essere inserito e rimosso da sola.',
      },
      {
        title: 'Ritmo settimanale',
        text: 'In genere segue un ciclo di tre settimane con una settimana di pausa.',
      },
      {
        title: 'Controllo occasionale',
        text: 'Controllare regolarmente che sia in sede ti aiuta a usare il dispositivo con serenità.',
      },
      {
        title: 'Nessuna protezione dalle IST',
        text: 'A seconda della situazione, può essere necessaria una protezione adeguata.',
      },
    ],
    tip2Title: 'Punti chiave',
    tip2Text: 'L’anello vaginale combina un rilascio continuo di ormoni con un ritmo di utilizzo che evita l’assunzione quotidiana. Tuttavia, la scelta della contraccezione dovrebbe essere adattata a ciascuna persona e discussa con un’operatrice o un operatore sanitario.',
    shareMessage: 'L’anello vaginale contraccettivo — AWA',
  },
  tr: {
    badge: 'VAJİNAL HALKA',
    title: 'Doğum kontrol\nvajinal halkası',
    metaDuration: '5 dk okuma',
    metaType: 'Makale',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Üç hafta boyunca takılan esnek bir halka.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Halka nasıl çalışır',
      'Takma ve çıkarma',
      'Bilmen gerekenler',
      'Akılda tutulacaklar',
    ],
    body1: 'Halka, düşük dozda hormonları doğrudan vajinada sürekli olarak salan esnek bir cihazdır; kombine hapla aynı doğum kontrol etkisine sahiptir.',
    flowTitle: 'Nasıl çalışır',
    flowSteps: [
      {
        title: 'Halka',
        text: 'Vajinaya yerleştirilir',
      },
      {
        title: 'Hormonlar',
        text: 'Sürekli salınım',
      },
      {
        title: 'Koruma',
        text: 'Doğum kontrol etkisi',
      },
    ],
    body2: 'Halkayı kendin takarsın, üç hafta boyunca kesintisiz yerinde kalır, ardından bir haftalık ara için çıkarılır; adet kanaman bu ara sırasında olur.',
    calendarTitle: 'Takip etmesi kolay bir ritim',
    weekLabelActive: 'Halka',
    weekLabelPause: 'Ara',
    legendActive: 'Halkalı hafta',
    legendPause: 'Ara haftası',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Vajinadaki tam konumunun kesin olması etkili olması için gerekmez; bu da kullanımını kolaylaştırır.',
    body3: 'Halkayı seçmeden önce bilmeye değer birkaç pratik nokta vardır.',
    careTips: [
      {
        title: 'Kullanımı kolay',
        text: 'Kendin takar ve çıkarırsın.',
      },
      {
        title: 'Düzenli ritim',
        text: 'Genellikle üç hafta boyunca yerinde kalır.',
      },
      {
        title: 'Sürekli etki',
        text: 'Hormonlar kullanım süresi boyunca sürekli olarak salınır.',
      },
      {
        title: 'Cinsel yolla bulaşan enfeksiyonlardan korumaz',
        text: 'Duruma göre ek koruma gerekebilir.',
      },
    ],
    checkListTitle: 'Sürdürmeye değer iyi alışkanlıklar',
    practicalSteps: [
      'Takmadan veya çıkarmadan önce ellerini yıka',
      'Takvimi takip etmek için hatırlaması kolay bir zaman seç',
      'Arada bir hâlâ yerinde olup olmadığını kontrol et',
      'Yerinden kayarsa ya da dışarı çıkarsa kullanım kılavuzuna bak',
    ],
    alertTitle: 'Lütfen dikkat',
    alertText: 'Dışarı çıkma ya da uzun süreli yer değiştirme özel bir yönlendirme gerektirebilir. Emin değilsen her zaman cihazın kullanım kılavuzuna bak veya bir sağlık profesyoneline danış.',
    summaryTitle: '4 maddede özet',
    summaryItems: [
      {
        title: 'Kolay takılır',
        text: 'Halkayı kendin takıp çıkarabilirsin.',
      },
      {
        title: 'Haftalık ritim',
        text: 'Genellikle üç haftalık bir döngüyü ve ardından bir haftalık arayı izler.',
      },
      {
        title: 'Ara sıra kontrol',
        text: 'Yerinde olup olmadığını düzenli olarak kontrol etmek, cihazı içiniz rahat kullanmana yardımcı olur.',
      },
      {
        title: 'Cinsel yolla bulaşan enfeksiyonlara karşı koruma yok',
        text: 'Duruma göre uygun bir koruma gerekebilir.',
      },
    ],
    tip2Title: 'Akılda tutulacaklar',
    tip2Text: 'Vajinal halka, sürekli hormon salınımını günlük doz gerektirmeyen bir kullanım ritmiyle bir araya getirir. Yine de doğum kontrol seçimi kişiye göre uyarlanmalı ve bir sağlık profesyoneliyle konuşulmalıdır.',
    shareMessage: 'Doğum kontrol vajinal halkası — AWA',
  },
  ru: {
    badge: 'ВЛАГАЛИЩНОЕ КОЛЬЦО',
    title: 'Контрацептивное\nвлагалищное кольцо',
    metaDuration: '5 мин чтения',
    metaType: 'Статья',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'Гибкое кольцо, которое носят три недели.',
    contentsTitle: 'В этой статье',
    topics: [
      'Как действует кольцо',
      'Введение и извлечение',
      'Что нужно знать',
      'Главное',
    ],
    body1:
      'Кольцо — это гибкое устройство, которое непрерывно высвобождает низкие дозы гормонов прямо во влагалище и действует как контрацептив так же, как комбинированные таблетки.',
    flowTitle: 'Как оно действует',
    flowSteps: [
      {title: 'Кольцо', text: 'Вводится во влагалище'},
      {title: 'Гормоны', text: 'Непрерывное высвобождение'},
      {title: 'Защита', text: 'Контрацептивное действие'},
    ],
    body2:
      'Вы вводите его самостоятельно, оно остаётся на месте непрерывно в течение трёх недель, затем его извлекают на недельный перерыв, во время которого наступают месячные.',
    calendarTitle: 'Простой ритм, которого легко придерживаться',
    weekLabelActive: 'Кольцо',
    weekLabelPause: 'Перерыв',
    legendActive: 'Неделя с кольцом',
    legendPause: 'Неделя перерыва',
    tip1Title: 'ПОЛЕЗНО ЗНАТЬ',
    tip1Text:
      'Чтобы кольцо было эффективным, его точное положение во влагалище не обязательно должно быть строго определённым, поэтому им просто пользоваться.',
    body3:
      'У кольца есть несколько практических особенностей, которые стоит знать, прежде чем его выбрать.',
    careTips: [
      {title: 'Простое в использовании', text: 'Вы вводите и извлекаете его самостоятельно.'},
      {title: 'Регулярный ритм', text: 'Как правило, оно остаётся на месте три недели.'},
      {title: 'Непрерывное действие', text: 'Гормоны высвобождаются непрерывно на протяжении всего периода использования.'},
      {title: 'Не защищает от ИППП', text: 'В зависимости от ситуации может потребоваться дополнительная защита.'},
    ],
    checkListTitle: 'Полезные привычки',
    practicalSteps: [
      'Вымойте руки перед введением или извлечением',
      'Выберите время, которое легко запомнить, чтобы не сбиться с графика',
      'Время от времени проверяйте, что кольцо на месте',
      'Если оно сместилось или выпало, сверьтесь с инструкцией-вкладышем',
    ],
    alertTitle: 'Обратите внимание',
    alertText:
      'Выпадение или длительное смещение кольца может потребовать особых действий. Если вы не уверены, всегда сверяйтесь с инструкцией-вкладышем к устройству или обращайтесь к медицинскому специалисту.',
    summaryTitle: 'Главное в 4 пунктах',
    summaryItems: [
      {title: 'Простое введение', text: 'Кольцо можно вводить и извлекать самостоятельно.'},
      {title: 'Недельный ритм', text: 'Как правило, схема включает три недели с кольцом и одну неделю перерыва.'},
      {title: 'Периодическая проверка', text: 'Регулярная проверка того, что кольцо на месте, помогает пользоваться устройством спокойно.'},
      {title: 'Нет защиты от ИППП', text: 'В зависимости от ситуации может потребоваться подходящая защита.'},
    ],
    tip2Title: 'Главное',
    tip2Text:
      'Влагалищное кольцо сочетает непрерывное высвобождение гормонов с ритмом использования, который избавляет от ежедневного приёма. Однако выбор контрацепции должен подбираться индивидуально и обсуждаться с медицинским специалистом.',
    shareMessage: 'Контрацептивное влагалищное кольцо — AWA',
  },
  de: {
    badge: 'VAGINALRING',
    title: 'Der Verhütungs-\nvaginalring',
    metaDuration: '5 Min. Lesezeit',
    metaType: 'Artikel',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Ein flexibler Ring, der drei Wochen lang getragen wird.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'So wirkt der Ring',
      'Einsetzen und Entfernen',
      'Was du wissen solltest',
      'Das Wichtigste in Kürze',
    ],
    body1:
      'Der Ring ist ein flexibles Produkt, das kontinuierlich niedrig dosierte Hormone direkt in der Scheide freisetzt und dieselbe verhütende Wirkung hat wie eine Kombinationspille.',
    flowTitle: 'So funktioniert er',
    flowSteps: [
      {title: 'Ring', text: 'In die Scheide eingesetzt'},
      {title: 'Hormone', text: 'Kontinuierliche Abgabe'},
      {title: 'Schutz', text: 'Verhütende Wirkung'},
    ],
    body2:
      'Du setzt ihn selbst ein, er bleibt drei Wochen lang durchgehend an Ort und Stelle und wird dann für eine einwöchige Pause entfernt, in der deine Periode eintritt.',
    calendarTitle: 'Ein einfacher Rhythmus',
    weekLabelActive: 'Ring',
    weekLabelPause: 'Pause',
    legendActive: 'Woche mit Ring',
    legendPause: 'Pausenwoche',
    tip1Title: 'Gut zu wissen',
    tip1Text:
      'Seine genaue Position in der Scheide muss nicht exakt sein, damit er wirkt, was die Anwendung einfach macht.',
    body3:
      'Der Ring hat einige praktische Eigenschaften, die du vor der Entscheidung kennen solltest.',
    careTips: [
      {title: 'Einfache Anwendung', text: 'Du setzt ihn selbst ein und entfernst ihn selbst.'},
      {title: 'Regelmäßiger Rhythmus', text: 'Er bleibt in der Regel drei Wochen lang an Ort und Stelle.'},
      {title: 'Kontinuierliche Wirkung', text: 'Die Hormone werden während der gesamten Anwendungsdauer kontinuierlich freigesetzt.'},
      {title: 'Kein Schutz vor sexuell übertragbaren Infektionen', text: 'Je nach Situation kann zusätzlicher Schutz nötig sein.'},
    ],
    checkListTitle: 'Gute Gewohnheiten',
    practicalSteps: [
      'Wasche dir vor dem Einsetzen oder Entfernen die Hände',
      'Wähle eine leicht zu merkende Uhrzeit, um den Überblick über den Plan zu behalten',
      'Prüfe gelegentlich, ob er noch richtig sitzt',
      'Lies den Beipackzettel, wenn er verrutscht oder ausgestoßen wird',
    ],
    alertTitle: 'Bitte beachten',
    alertText:
      'Ein Herausrutschen oder ein längeres Verrutschen kann besondere Hinweise erfordern. Lies immer den Beipackzettel des Produkts oder frag medizinisches Fachpersonal, wenn du unsicher bist.',
    summaryTitle: 'Das Wesentliche in 4 Punkten',
    summaryItems: [
      {title: 'Einfaches Einsetzen', text: 'Den Ring kannst du selbst einsetzen und entfernen.'},
      {title: 'Wochenrhythmus', text: 'In der Regel folgt er einem Dreiwochenzyklus mit einer Woche Pause.'},
      {title: 'Gelegentliche Kontrolle', text: 'Wenn du regelmäßig prüfst, ob er sitzt, kannst du ihn mit Ruhe anwenden.'},
      {title: 'Kein Schutz vor sexuell übertragbaren Infektionen', text: 'Je nach Situation kann ein geeigneter Schutz nötig sein.'},
    ],
    tip2Title: 'Das Wichtigste in Kürze',
    tip2Text:
      'Der Vaginalring verbindet eine kontinuierliche Hormonabgabe mit einem Anwendungsrhythmus, der eine tägliche Einnahme überflüssig macht. Die Wahl der Verhütung sollte jedoch individuell erfolgen und mit medizinischem Fachpersonal besprochen werden.',
    shareMessage: 'Der Verhütungsvaginalring — AWA',
  },
  zh: {
      badge: '阴道环',
      title: '避孕阴道环',
      metaDuration: '阅读约 5 分钟',
      metaType: '文章',
      metaLevel: '入门',
      metaValidated: '经审阅的内容',
      intro: '一枚柔软的环，佩戴三周。',
      contentsTitle: '本文内容',
      topics: [
        '阴道环如何起作用',
        '放入与取出',
        '你需要了解的事',
        '要点回顾',
      ],
      body1: '阴道环是一种柔软的装置，会在阴道内持续释放低剂量激素，避孕作用与复方避孕药相同。',
      flowTitle: '它如何起作用',
      flowSteps: [
        {
          title: '阴道环',
          text: '放入阴道内',
        },
        {
          title: '激素',
          text: '持续释放',
        },
        {
          title: '保护',
          text: '发挥避孕作用',
        },
      ],
      body2: '你可以自己放入，它会连续留在原位三周，然后取出，休息一周，月经会在这一周内来潮。',
      calendarTitle: '简单易记的节奏',
      weekLabelActive: '佩戴',
      weekLabelPause: '休息',
      legendActive: '佩戴阴道环的一周',
      legendPause: '休息周',
      tip1Title: '小贴士',
      tip1Text: '它在阴道内的具体位置不需要很精确也能有效，因此使用起来很简单。',
      body3: '在选择阴道环之前，有几个实用的要点值得了解。',
      careTips: [
        {
          title: '使用简单',
          text: '你可以自己放入和取出。',
        },
        {
          title: '节奏规律',
          text: '它通常会留在原位三周。',
        },
        {
          title: '持续起效',
          text: '在整个使用期间，激素会持续释放。',
        },
        {
          title: '不能预防性传播感染',
          text: '视情况而定，可能需要额外的防护。',
        },
      ],
      checkListTitle: '值得保持的好习惯',
      practicalSteps: [
        '放入或取出前先洗手',
        '选一个容易记住的时间，方便掌握时间安排',
        '不时检查它是否仍在原位',
        '如果它移位或脱出，请查看说明书',
      ],
      alertTitle: '请注意',
      alertText: '阴道环脱出或长时间移位，可能需要特定的处理指引。如果不确定，请务必查看产品说明书，或咨询医疗专业人员。',
      summaryTitle: '4 个要点速览',
      summaryItems: [
        {
          title: '放入简单',
          text: '阴道环可以由你自己放入和取出。',
        },
        {
          title: '按周的节奏',
          text: '通常以三周为一个周期，之后休息一周。',
        },
        {
          title: '偶尔检查',
          text: '定期确认它在原位，有助于你更安心地使用。',
        },
        {
          title: '不能预防性传播感染',
          text: '视情况而定，可能需要合适的防护。',
        },
      ],
      tip2Title: '要点回顾',
      tip2Text: '阴道环将持续的激素释放与无需每天服药的使用节奏结合在一起。不过，避孕方式的选择应因人而异，并与医疗专业人员讨论。',
      shareMessage: '避孕阴道环 — AWA',
    },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function VaginalRingArticleScreen({
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

  const handleShare = () => {
    Share.share({
      message: content.shareMessage,
    });
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
        {/* HERO */}
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
              onPress={() => navigation.goBack()}
              style={({pressed}) => [
                styles.circle,
                pressed && styles.pressed,
              ]}>
              <MaterialDesignIcons
                name="chevron-left"
                size={23}
                color={theme.colors.text}
              />
            </Pressable>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('library.screen.addBookmark')}
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

        {/* ARTICLE */}
        <View style={styles.article}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{content.badge}</Text>
          </View>

          <Text style={styles.title}>{content.title}</Text>

          {/* META */}
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

          {/* TABLE OF CONTENTS */}
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

          {/* SECTION 1 */}
          <Text style={styles.h2}>1. {content.topics[0]}</Text>

          <Text style={styles.body}>{content.body1}</Text>

          {/* VISUAL SCHEMA */}
          <View style={styles.flowCard}>
            <Text style={styles.flowTitle}>{content.flowTitle}</Text>

            <View style={styles.flow}>
              <View style={styles.flowStep}>
                <View style={styles.flowIcon}>
                  <MaterialDesignIcons
                    name="circle-outline"
                    size={25}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.flowStepTitle}>
                  {content.flowSteps[0].title}
                </Text>

                <Text style={styles.flowStepText}>
                  {content.flowSteps[0].text}
                </Text>
              </View>

              <MaterialDesignIcons
                name="arrow-right"
                size={20}
                color={theme.colors.textMuted}
              />

              <View style={styles.flowStep}>
                <View style={styles.flowIcon}>
                  <MaterialDesignIcons
                    name="water-outline"
                    size={25}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.flowStepTitle}>
                  {content.flowSteps[1].title}
                </Text>

                <Text style={styles.flowStepText}>
                  {content.flowSteps[1].text}
                </Text>
              </View>

              <MaterialDesignIcons
                name="arrow-right"
                size={20}
                color={theme.colors.textMuted}
              />

              <View style={styles.flowStep}>
                <View style={styles.flowIcon}>
                  <MaterialDesignIcons
                    name="shield-check-outline"
                    size={25}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.flowStepTitle}>
                  {content.flowSteps[2].title}
                </Text>

                <Text style={styles.flowStepText}>
                  {content.flowSteps[2].text}
                </Text>
              </View>
            </View>
          </View>

          {/* SECTION 2 */}
          <Text style={styles.h2}>2. {content.topics[1]}</Text>

          <Text style={styles.body}>{content.body2}</Text>

          {/* 3 WEEK SCHEMA */}
          <View style={styles.calendarCard}>
            <Text style={styles.calendarTitle}>{content.calendarTitle}</Text>

            <View style={styles.weekRow}>
              <View style={styles.weekItemActive}>
                <Text style={styles.weekNumber}>1</Text>
                <Text style={styles.weekLabel}>{content.weekLabelActive}</Text>
              </View>

              <View style={styles.weekItemActive}>
                <Text style={styles.weekNumber}>2</Text>
                <Text style={styles.weekLabel}>{content.weekLabelActive}</Text>
              </View>

              <View style={styles.weekItemActive}>
                <Text style={styles.weekNumber}>3</Text>
                <Text style={styles.weekLabel}>{content.weekLabelActive}</Text>
              </View>

              <View style={styles.weekItemPause}>
                <Text style={styles.weekNumber}>4</Text>
                <Text style={styles.weekLabel}>{content.weekLabelPause}</Text>
              </View>
            </View>

            <View style={styles.calendarLegend}>
              <View style={styles.legendDotActive} />

              <Text style={styles.legendText}>{content.legendActive}</Text>

              <View style={styles.legendDotPause} />

              <Text style={styles.legendText}>{content.legendPause}</Text>
            </View>
          </View>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.tip1Title}</Text>

              <Text style={styles.tipText}>{content.tip1Text}</Text>
            </View>
          </View>

          {/* SECTION 3 */}
          <Text style={styles.h2}>3. {content.topics[2]}</Text>

          <Text style={styles.body}>{content.body3}</Text>

          {/* INFORMATION GRID */}
          <View style={styles.infoGrid}>
            {CARE_TIP_ICONS.map((icon, index) => (
              <View key={content.careTips[index].title} style={styles.infoCard}>
                <View style={styles.infoIcon}>
                  <MaterialDesignIcons
                    name={icon as never}
                    size={23}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.infoTitle}>
                  {content.careTips[index].title}
                </Text>

                <Text style={styles.infoText}>
                  {content.careTips[index].text}
                </Text>
              </View>
            ))}
          </View>

          {/* PRACTICAL CHECKLIST */}
          <View style={styles.checkList}>
            <Text style={styles.checkListTitle}>{content.checkListTitle}</Text>

            {content.practicalSteps.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* WARNING */}
          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.alertTitle}</Text>

              <Text style={styles.tipText}>{content.alertText}</Text>
            </View>
          </View>

          {/* SECTION 4 */}
          <Text style={styles.h2}>4. {content.topics[3]}</Text>

          {/* SUMMARY SCHEMA */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <MaterialDesignIcons
                name="check-decagram-outline"
                size={25}
                color={theme.colors.primary}
              />

              <Text style={styles.summaryTitle}>{content.summaryTitle}</Text>
            </View>

            <View style={styles.summaryItem}>
              <View style={styles.summaryNumber}>
                <Text style={styles.summaryNumberText}>1</Text>
              </View>

              <View style={styles.summaryCopy}>
                <Text style={styles.summaryItemTitle}>
                  {content.summaryItems[0].title}
                </Text>

                <Text style={styles.summaryItemText}>
                  {content.summaryItems[0].text}
                </Text>
              </View>
            </View>

            <View style={styles.summaryItem}>
              <View style={styles.summaryNumber}>
                <Text style={styles.summaryNumberText}>2</Text>
              </View>

              <View style={styles.summaryCopy}>
                <Text style={styles.summaryItemTitle}>
                  {content.summaryItems[1].title}
                </Text>

                <Text style={styles.summaryItemText}>
                  {content.summaryItems[1].text}
                </Text>
              </View>
            </View>

            <View style={styles.summaryItem}>
              <View style={styles.summaryNumber}>
                <Text style={styles.summaryNumberText}>3</Text>
              </View>

              <View style={styles.summaryCopy}>
                <Text style={styles.summaryItemTitle}>
                  {content.summaryItems[2].title}
                </Text>

                <Text style={styles.summaryItemText}>
                  {content.summaryItems[2].text}
                </Text>
              </View>
            </View>

            <View style={styles.summaryItem}>
              <View style={styles.summaryNumber}>
                <Text style={styles.summaryNumberText}>4</Text>
              </View>

              <View style={styles.summaryCopy}>
                <Text style={styles.summaryItemTitle}>
                  {content.summaryItems[3].title}
                </Text>

                <Text style={styles.summaryItemText}>
                  {content.summaryItems[3].text}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="heart-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.tip2Title}</Text>

              <Text style={styles.tipText}>{content.tip2Text}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <ReadingControls
        articleId={ID}
        durationMinutes={5}
        scrollRef={scrollRef}
      />
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  scroll: {
    paddingBottom: 30,
  },

  heroWrap: {
    height: 245,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  hero: {
    width: '100%',
    height: '100%',
  },

  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  actions: {
    flexDirection: 'row',
    gap: 8,
  },

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

  pressed: {
    opacity: 0.74,
  },

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
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '800',
  },

  title: {
    marginTop: 12,
    fontFamily: 'serif',
    fontSize: 25,
    lineHeight: 31,
    color: theme.colors.text,
    fontWeight: '700',
  },

  metas: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  metaDivider: {
    width: 1,
    height: 20,
    backgroundColor: theme.colors.border,
  },

  meta: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },

  intro: {
    marginTop: 17,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },

  contents: {
    marginTop: 19,
    padding: 15,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  contentsTitle: {
    marginBottom: 7,
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '800',
  },

  contentRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  contentLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  contentNumber: {
    width: 24,
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },

  contentText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 17,
    color: theme.colors.text,
  },

  h2: {
    marginTop: 24,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: theme.colors.text,
    fontWeight: '700',
  },

  body: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textSecondary,
  },

  /* FUNCTIONING SCHEMA */

  flowCard: {
    marginTop: 14,
    padding: 15,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  flowTitle: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '800',
    marginBottom: 15,
  },

  flow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  flowStep: {
    flex: 1,
    alignItems: 'center',
  },

  flowIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  flowStepTitle: {
    marginTop: 7,
    fontSize: 11.5,
    color: theme.colors.text,
    fontWeight: '800',
    textAlign: 'center',
  },

  flowStepText: {
    marginTop: 3,
    fontSize: 9.5,
    lineHeight: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },

  /* CALENDAR SCHEMA */

  calendarCard: {
    marginTop: 14,
    padding: 15,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  calendarTitle: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '800',
    marginBottom: 14,
  },

  weekRow: {
    flexDirection: 'row',
    gap: 7,
  },

  weekItemActive: {
    flex: 1,
    minHeight: 68,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  weekItemPause: {
    flex: 1,
    minHeight: 68,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  weekNumber: {
    fontSize: 18,
    color: theme.colors.primary,
    fontWeight: '800',
  },

  weekLabel: {
    marginTop: 3,
    fontSize: 10,
    color: theme.colors.text,
    fontWeight: '700',
  },

  calendarLegend: {
    marginTop: 13,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
  },

  legendDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },

  legendDotPause: {
    marginLeft: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.textMuted,
  },

  legendText: {
    fontSize: 9.5,
    color: theme.colors.textMuted,
  },

  /* TIP */

  tip: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
  },

  tipCopy: {
    flex: 1,
    marginLeft: 11,
  },

  tipTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  tipText: {
    marginTop: 3,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  /* INFORMATION GRID */

  infoGrid: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 9,
  },

  infoCard: {
    width: '48.5%',
    minHeight: 150,
    padding: 13,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  infoTitle: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 16,
    color: theme.colors.text,
    fontWeight: '800',
  },

  infoText: {
    marginTop: 5,
    fontSize: 10.5,
    lineHeight: 15,
    color: theme.colors.textSecondary,
  },

  /* CHECKLIST */

  checkList: {
    marginTop: 14,
    padding: 14,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  checkListTitle: {
    marginBottom: 11,
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '800',
  },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 9,
  },

  checkText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },

  /* ALERT */

  alert: {
    marginTop: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },

  /* SUMMARY */

  summaryCard: {
    marginTop: 14,
    padding: 15,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 14,
  },

  summaryTitle: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '800',
  },

  summaryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 13,
  },

  summaryNumber: {
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  summaryNumberText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '800',
  },

  summaryCopy: {
    flex: 1,
    marginLeft: 10,
  },

  summaryItemTitle: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '800',
  },

  summaryItemText: {
    marginTop: 2,
    fontSize: 10.5,
    lineHeight: 15,
    color: theme.colors.textSecondary,
  },
  });
}
