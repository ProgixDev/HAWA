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
const CONTENT = withBrazilianPortuguese('VaginalRing', {
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
  id: {
    badge: 'CINCIN VAGINA',
    title: 'Cincin vagina\nkontrasepsi',
    metaDuration: '5 menit baca',
    metaType: 'Artikel',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Cincin yang lentur, dipakai selama tiga minggu.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Cara kerja cincin',
      'Pemasangan dan pelepasan',
      'Yang perlu kamu ketahui',
      'Poin penting',
    ],
    body1: 'Cincin ini adalah alat lentur yang terus-menerus melepaskan hormon dosis rendah langsung di dalam vagina, dengan kerja kontrasepsi yang sama seperti pil kombinasi.',
    flowTitle: 'Cara kerjanya',
    flowSteps: [
      {
        title: 'Cincin',
        text: 'Ditempatkan di dalam vagina',
      },
      {
        title: 'Hormon',
        text: 'Dilepaskan terus-menerus',
      },
      {
        title: 'Perlindungan',
        text: 'Kerja kontrasepsi',
      },
    ],
    body2: 'Kamu memasangnya sendiri, cincin tetap berada di tempatnya terus-menerus selama tiga minggu, lalu dilepas untuk jeda satu minggu, dan haid terjadi pada masa jeda itu.',
    calendarTitle: 'Ritme sederhana yang mudah diikuti',
    weekLabelActive: 'Cincin',
    weekLabelPause: 'Jeda',
    legendActive: 'Minggu dengan cincin',
    legendPause: 'Minggu jeda',
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Posisi pastinya di dalam vagina tidak perlu tepat agar cincin tetap efektif, sehingga penggunaannya mudah.',
    body3: 'Cincin ini memiliki beberapa hal praktis yang perlu diketahui sebelum kamu memilihnya.',
    careTips: [
      {
        title: 'Mudah digunakan',
        text: 'Kamu memasang dan melepasnya sendiri.',
      },
      {
        title: 'Ritme yang teratur',
        text: 'Cincin umumnya tetap berada di tempatnya selama tiga minggu.',
      },
      {
        title: 'Kerja yang berkelanjutan',
        text: 'Hormon dilepaskan terus-menerus selama masa pemakaian.',
      },
      {
        title: 'Tidak melindungi dari IMS',
        text: 'Perlindungan tambahan mungkin diperlukan tergantung situasinya.',
      },
    ],
    checkListTitle: 'Kebiasaan baik yang perlu dijaga',
    practicalSteps: [
      'Cuci tangan sebelum memasang atau melepasnya',
      'Pilih waktu yang mudah diingat agar jadwalnya terpantau',
      'Sesekali periksa bahwa cincin masih di tempatnya',
      'Baca leaflet jika cincin bergeser atau keluar sendiri',
    ],
    alertTitle: 'Harap diperhatikan',
    alertText: 'Cincin yang keluar sendiri atau bergeser dalam waktu lama mungkin memerlukan panduan khusus. Selalu periksa leaflet alatnya atau tanyakan kepada tenaga kesehatan jika kamu ragu.',
    summaryTitle: 'Intinya dalam 4 poin',
    summaryItems: [
      {
        title: 'Pemasangan yang mudah',
        text: 'Cincin bisa dipasang dan dilepas sendiri.',
      },
      {
        title: 'Ritme mingguan',
        text: 'Umumnya mengikuti siklus tiga minggu dengan jeda satu minggu.',
      },
      {
        title: 'Pemeriksaan sesekali',
        text: 'Memeriksa secara teratur bahwa cincin masih di tempatnya membantumu menggunakan alat ini dengan tenang.',
      },
      {
        title: 'Tidak melindungi dari IMS',
        text: 'Perlindungan yang sesuai mungkin diperlukan tergantung situasinya.',
      },
    ],
    tip2Title: 'Poin penting',
    tip2Text: 'Cincin vagina memadukan pelepasan hormon yang berkelanjutan dengan ritme pemakaian yang tidak memerlukan dosis harian. Namun, pilihan kontrasepsi sebaiknya disesuaikan dengan masing-masing orang dan dibicarakan dengan tenaga kesehatan.',
    shareMessage: 'Cincin vagina kontrasepsi — AWA',
  },
  hi: {
    badge: 'वजाइनल रिंग',
    title: 'गर्भनिरोधक\nवजाइनल रिंग',
    metaDuration: '5 मिनट का पाठ',
    metaType: 'लेख',
    metaLevel: 'शुरुआती',
    metaValidated: 'समीक्षा किया गया कंटेंट',
    intro: 'एक लचीली रिंग, जिसे तीन हफ़्ते तक पहना जाता है।',
    contentsTitle: 'इस लेख में',
    topics: [
      'रिंग कैसे काम करती है',
      'लगाना और निकालना',
      'क्या जानना ज़रूरी है',
      'मुख्य बातें',
    ],
    body1: 'रिंग एक लचीला साधन है जो लगातार कम मात्रा में हार्मोन सीधे योनि में छोड़ता है, और इसका गर्भनिरोधक असर कंबाइंड गोली जैसा ही होता है।',
    flowTitle: 'यह कैसे काम करती है',
    flowSteps: [
      {
        title: 'रिंग',
        text: 'योनि में लगाई जाती है',
      },
      {
        title: 'हार्मोन',
        text: 'लगातार रिसाव',
      },
      {
        title: 'सुरक्षा',
        text: 'गर्भनिरोधक असर',
      },
    ],
    body2: 'इसे आप खुद लगाती हैं, यह तीन हफ़्ते तक लगातार अपनी जगह पर रहती है, फिर एक हफ़्ते के ब्रेक के लिए निकाल दी जाती है, जिसमें आपका पीरियड होता है।',
    calendarTitle: 'फ़ॉलो करने के लिए एक आसान लय',
    weekLabelActive: 'रिंग',
    weekLabelPause: 'ब्रेक',
    legendActive: 'रिंग वाला हफ़्ता',
    legendPause: 'ब्रेक का हफ़्ता',
    tip1Title: 'जानना अच्छा रहेगा',
    tip1Text: 'असरदार होने के लिए योनि में इसकी जगह बिल्कुल सटीक होना ज़रूरी नहीं है, इसलिए इसका इस्तेमाल आसान है।',
    body3: 'रिंग चुनने से पहले इसके कई व्यावहारिक पहलू जान लेना अच्छा रहता है।',
    careTips: [
      {
        title: 'इस्तेमाल में आसान',
        text: 'आप इसे खुद लगाती और निकालती हैं।',
      },
      {
        title: 'नियमित लय',
        text: 'यह आमतौर पर तीन हफ़्ते तक अपनी जगह पर रहती है।',
      },
      {
        title: 'लगातार असर',
        text: 'इस्तेमाल की पूरी अवधि में हार्मोन लगातार छोड़े जाते हैं।',
      },
      {
        title: 'STI से बचाव नहीं करती',
        text: 'स्थिति के अनुसार अतिरिक्त सुरक्षा की ज़रूरत पड़ सकती है।',
      },
    ],
    checkListTitle: 'अपनाने लायक अच्छी आदतें',
    practicalSteps: [
      'लगाने या निकालने से पहले हाथ धो लें',
      'शेड्यूल याद रखने के लिए ऐसा समय चुनें जो आसानी से याद रहे',
      'बीच-बीच में देख लें कि यह अपनी जगह पर है',
      'अगर यह खिसक जाए या बाहर निकल जाए तो साथ आए पर्चे को देखें',
    ],
    alertTitle: 'ध्यान दें',
    alertText: 'रिंग के बाहर निकल जाने या लंबे समय तक अपनी जगह से खिसके रहने पर खास मार्गदर्शन की ज़रूरत पड़ सकती है। अगर आप निश्चित नहीं हैं, तो हमेशा साधन के साथ आया पर्चा देखें या किसी स्वास्थ्य विशेषज्ञ से पूछें।',
    summaryTitle: '4 मुख्य बातें',
    summaryItems: [
      {
        title: 'आसानी से लगाना',
        text: 'रिंग को आप खुद लगा और निकाल सकती हैं।',
      },
      {
        title: 'हफ़्तों की लय',
        text: 'आमतौर पर यह तीन हफ़्ते के चक्र और एक हफ़्ते के ब्रेक के हिसाब से चलती है।',
      },
      {
        title: 'बीच-बीच में जाँच',
        text: 'नियमित रूप से देखते रहना कि यह अपनी जगह पर है, आपको इसे बेफ़िक्र होकर इस्तेमाल करने में मदद करता है।',
      },
      {
        title: 'STI से कोई सुरक्षा नहीं',
        text: 'स्थिति के अनुसार उपयुक्त सुरक्षा की ज़रूरत पड़ सकती है।',
      },
    ],
    tip2Title: 'मुख्य बातें',
    tip2Text: 'वजाइनल रिंग लगातार हार्मोन छोड़ने को एक ऐसी लय के साथ जोड़ती है जिसमें रोज़ की खुराक की ज़रूरत नहीं पड़ती। फिर भी, गर्भनिरोध का चुनाव हर महिला के हिसाब से होना चाहिए और इस पर किसी स्वास्थ्य विशेषज्ञ से चर्चा करनी चाहिए।',
    shareMessage: 'गर्भनिरोधक वजाइनल रिंग — AWA',
  },
  sq: {
    badge: 'UNAZA VAGINALE',
    title: 'Unaza vaginale\nkontraceptive',
    metaDuration: '5 min lexim',
    metaType: 'Artikull',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Një unazë fleksibël, e veshur për tri javë.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Si funksionon unaza',
      'Vendosja dhe heqja',
      'Çfarë duhet të dish',
      'Pikat kryesore',
    ],
    body1: 'Unaza është një pajisje fleksibël që çliron vazhdimisht doza të ulëta hormonesh drejtpërdrejt në vaginë, me të njëjtin veprim kontraceptiv si një tabletë e kombinuar.',
    flowTitle: 'Si funksionon',
    flowSteps: [
      {
        title: 'Unaza',
        text: 'Vendoset në vaginë',
      },
      {
        title: 'Hormonet',
        text: 'Çlirim i vazhdueshëm',
      },
      {
        title: 'Mbrojtja',
        text: 'Veprim kontraceptiv',
      },
    ],
    body2: 'E vendos vetë, qëndron vazhdimisht në vend për tri javë, pastaj hiqet për një pushim njëjavor gjatë të cilit vijnë menstruacionet.',
    calendarTitle: 'Një ritëm i thjeshtë për t’u ndjekur',
    weekLabelActive: 'Unaza',
    weekLabelPause: 'Pushim',
    legendActive: 'Java me unazën',
    legendPause: 'Java e pushimit',
    tip1Title: 'Mirë është ta dish',
    tip1Text: 'Pozicioni i saktë i saj në vaginë nuk ka nevojë të jetë i përpiktë që të jetë efektive, gjë që e bën të thjeshtë për përdorim.',
    body3: 'Unaza ka disa pika praktike që vlen t’i dish përpara se ta zgjedhësh.',
    careTips: [
      {
        title: 'E thjeshtë për përdorim',
        text: 'E vendos dhe e heq vetë.',
      },
      {
        title: 'Ritëm i rregullt',
        text: 'Zakonisht qëndron në vend për tri javë.',
      },
      {
        title: 'Veprim i vazhdueshëm',
        text: 'Hormonet çlirohen vazhdimisht në të gjithë periudhën e përdorimit.',
      },
      {
        title: 'Nuk mbron nga IST-të',
        text: 'Mund të nevojitet mbrojtje shtesë sipas situatës.',
      },
    ],
    checkListTitle: 'Zakone të mira për t’i mbajtur',
    practicalSteps: [
      'Laji duart para se ta vendosësh ose ta heqësh',
      'Zgjidh një orë që është e lehtë për t’u mbajtur mend, për të ndjekur orarin',
      'Kontrollo herë pas here që është ende në vend',
      'Shiko fletushkën nëse lëviz ose del jashtë',
    ],
    alertTitle: 'Kujdes',
    alertText: 'Daljia jashtë ose zhvendosja e zgjatur mund të kërkojë udhëzime specifike. Kontrollo gjithmonë fletushkën e pajisjes ose pyet një profesionist të shëndetësisë nëse nuk je e sigurt.',
    summaryTitle: 'Thelbi në 4 pika',
    summaryItems: [
      {
        title: 'Vendosje e thjeshtë',
        text: 'Unazën mund ta vendosësh dhe ta heqësh vetë.',
      },
      {
        title: 'Ritëm javor',
        text: 'Zakonisht ndjek një cikël tri-javor me një pushim njëjavor.',
      },
      {
        title: 'Kontroll herë pas here',
        text: 'Të kontrollosh rregullisht që është në vend të ndihmon ta përdorësh pajisjen me qetësi.',
      },
      {
        title: 'Nuk mbron nga IST-të',
        text: 'Mund të nevojitet mbrojtje e përshtatshme sipas situatës.',
      },
    ],
    tip2Title: 'Pikat kryesore',
    tip2Text: 'Unaza vaginale kombinon çlirimin e vazhdueshëm të hormoneve me një ritëm përdorimi që shmang dozën e përditshme. Megjithatë, zgjedhja e kontracepsionit duhet të përshtatet për çdo person dhe të diskutohet me një profesionist të shëndetësisë.',
    shareMessage: 'Unaza vaginale kontraceptive — AWA',
  },
  ja: {
    badge: '腟リング',
    title: '避妊用の\n腟リング',
    metaDuration: '読了時間5分',
    metaType: '記事',
    metaLevel: '初級',
    metaValidated: '確認済みの内容',
    intro: '3週間つけて使う、柔らかいリングです。',
    contentsTitle: 'この記事の内容',
    topics: [
      'リングのしくみ',
      '挿入と取り出し',
      '知っておきたいこと',
      'ポイントのまとめ',
    ],
    body1: 'リングは柔らかい器具で、少量のホルモンを腟内に直接、継続的に放出します。避妊の作用は、複合ピルと同じです。',
    flowTitle: 'しくみ',
    flowSteps: [
      {
        title: 'リング',
        text: '腟内に入れます',
      },
      {
        title: 'ホルモン',
        text: '継続的に放出されます',
      },
      {
        title: '保護',
        text: '避妊の作用',
      },
    ],
    body2: 'ご自身で挿入し、3週間ずっとそのまま入れておきます。その後、取り出して1週間の休薬期間をとり、この間に生理が来ます。',
    calendarTitle: '覚えやすいシンプルなリズム',
    weekLabelActive: 'リング',
    weekLabelPause: '休薬',
    legendActive: 'リングを使う週',
    legendPause: '休薬の週',
    tip1Title: '知っておきたいこと',
    tip1Text: '腟内での正確な位置を気にしなくても効果があるので、使い方が簡単です。',
    body3: 'リングには、選ぶ前に知っておきたい実用的なポイントがいくつかあります。',
    careTips: [
      {
        title: '使い方が簡単',
        text: '挿入も取り出しも、ご自身でできます。',
      },
      {
        title: '規則的なリズム',
        text: '一般に、3週間入れたままにします。',
      },
      {
        title: '継続的な作用',
        text: '使用期間中、ホルモンが継続的に放出されます。',
      },
      {
        title: '性感染症は防げません',
        text: '状況によっては、追加の予防が必要になることがあります。',
      },
    ],
    checkListTitle: '続けたいよい習慣',
    practicalSteps: [
      '挿入や取り出しの前に手を洗う',
      '予定を管理しやすいよう、覚えやすい時間を選ぶ',
      'ときどき、まだ入っているかを確認する',
      'ずれたり出てしまったりしたときは、添付文書を確認する',
    ],
    alertTitle: 'ご注意ください',
    alertText: 'リングが出てしまったり、長い間ずれたままだったりした場合は、個別の対応が必要になることがあります。迷ったときは、必ず製品の添付文書を確認するか、医療従事者に相談してください。',
    summaryTitle: '4つのポイント',
    summaryItems: [
      {
        title: '簡単な挿入',
        text: 'リングは、ご自身で挿入して取り出せます。',
      },
      {
        title: '週単位のリズム',
        text: '一般に、3週間使用して1週間休む周期で使います。',
      },
      {
        title: 'ときどき確認',
        text: '入っているかをこまめに確認すると、安心して使えます。',
      },
      {
        title: '性感染症は防げません',
        text: '状況によっては、適切な予防が必要になることがあります。',
      },
    ],
    tip2Title: 'ポイントのまとめ',
    tip2Text: '腟リングは、ホルモンの継続的な放出と、毎日の服用が不要な使用リズムを兼ね備えています。ただし、避妊法の選択は一人ひとりに合わせて、医療従事者と相談して決める必要があります。',
    shareMessage: '避妊用の腟リング — AWA',
  },
  ko: {
    badge: '질링',
    title: '피임용\n질링',
    metaDuration: '읽는 데 5분',
    metaType: '아티클',
    metaLevel: '입문',
    metaValidated: '검토된 콘텐츠',
    intro: '3주 동안 착용하는 유연한 링이에요.',
    contentsTitle: '이 아티클의 내용',
    topics: [
      '링이 작용하는 방식',
      '삽입과 제거',
      '알아야 할 점',
      '핵심 정리',
    ],
    body1: '링은 질 안에서 낮은 용량의 호르몬을 지속적으로 직접 방출하는 유연한 기구예요. 복합 피임약과 같은 피임 작용을 해요.',
    flowTitle: '작용 방식',
    flowSteps: [
      {
        title: '링',
        text: '질 안에 넣어요',
      },
      {
        title: '호르몬',
        text: '지속적으로 퍼져요',
      },
      {
        title: '보호',
        text: '피임 작용',
      },
    ],
    body2: '직접 삽입하고 3주 동안 계속 그대로 둔 다음 제거해요. 이후 1주 동안 쉬는 기간에 생리가 시작돼요.',
    calendarTitle: '따라 하기 쉬운 리듬',
    weekLabelActive: '링',
    weekLabelPause: '휴식',
    legendActive: '링을 착용하는 주',
    legendPause: '쉬는 주',
    tip1Title: '알아두면 좋아요',
    tip1Text: '질 안에서의 정확한 위치가 꼭 정밀하지 않아도 효과가 있어서 사용하기 간단해요.',
    body3: '링을 선택하기 전에 알아 두면 좋은 실용적인 점이 몇 가지 있어요.',
    careTips: [
      {
        title: '간편한 사용',
        text: '직접 삽입하고 제거할 수 있어요.',
      },
      {
        title: '규칙적인 리듬',
        text: '보통 3주 동안 그대로 두어요.',
      },
      {
        title: '지속적인 작용',
        text: '사용하는 기간 내내 호르몬이 지속적으로 방출돼요.',
      },
      {
        title: '성병은 막아 주지 않아요',
        text: '상황에 따라 추가적인 보호가 필요할 수 있어요.',
      },
    ],
    checkListTitle: '지키면 좋은 습관',
    practicalSteps: [
      '삽입하거나 제거하기 전에 손을 씻어요',
      '일정을 챙기기 쉽도록 기억하기 쉬운 시간을 정해요',
      '가끔 링이 제자리에 있는지 확인해요',
      '링이 움직이거나 빠졌다면 설명서를 확인해요',
    ],
    alertTitle: '유의하세요',
    alertText: '링이 빠지거나 오랫동안 제자리에서 벗어났다면 별도의 안내가 필요할 수 있어요. 잘 모르겠다면 항상 제품 설명서를 확인하거나 의료 전문가에게 문의하세요.',
    summaryTitle: '4가지 핵심 정리',
    summaryItems: [
      {
        title: '간단한 삽입',
        text: '링은 직접 삽입하고 제거할 수 있어요.',
      },
      {
        title: '주 단위 리듬',
        text: '보통 3주 사용하고 1주 쉬는 주기를 따라요.',
      },
      {
        title: '가끔 확인하기',
        text: '링이 제자리에 있는지 정기적으로 확인하면 마음 편히 사용할 수 있어요.',
      },
      {
        title: '성병은 막아 주지 않아요',
        text: '상황에 따라 알맞은 보호가 필요할 수 있어요.',
      },
    ],
    tip2Title: '핵심 정리',
    tip2Text: '질링은 호르몬을 지속적으로 방출하면서도 매일 복용하지 않아도 되는 사용 리듬을 갖추고 있어요. 다만 피임 방법은 사람마다 알맞게 선택해야 하고, 의료 전문가와 상의하는 것이 좋아요.',
    shareMessage: '피임용 질링 — AWA',
  },
  'pt-PT': {
    badge: 'ANEL VAGINAL',
    title: 'O anel vaginal\ncontracetivo',
    metaDuration: '5 min de leitura',
    metaType: 'Artigo',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'Um anel flexível, usado durante três semanas.',
    contentsTitle: 'Neste artigo',
    topics: [
      'Como funciona o anel',
      'Inserção e remoção',
      'O que precisa de saber',
      'Pontos a reter',
    ],
    body1: 'O anel é um dispositivo flexível que liberta continuamente doses baixas de hormonas diretamente na vagina, com a mesma ação contracetiva de uma pílula combinada.',
    flowTitle: 'Como funciona',
    flowSteps: [
      {
        title: 'Anel',
        text: 'Colocado na vagina',
      },
      {
        title: 'Hormonas',
        text: 'Difusão contínua',
      },
      {
        title: 'Proteção',
        text: 'Ação contracetiva',
      },
    ],
    body2: 'É a própria pessoa que o insere, permanece no lugar de forma contínua durante três semanas e depois é retirado para uma pausa de uma semana, durante a qual ocorre o período.',
    calendarTitle: 'Um ritmo simples de seguir',
    weekLabelActive: 'Anel',
    weekLabelPause: 'Pausa',
    legendActive: 'Semana com o anel',
    legendPause: 'Semana de pausa',
    tip1Title: 'Bom saber',
    tip1Text: 'A sua posição exata na vagina não precisa de ser precisa para que seja eficaz, o que o torna simples de usar.',
    body3: 'O anel tem vários aspetos práticos que vale a pena conhecer antes de o escolher.',
    careTips: [
      {
        title: 'Simples de usar',
        text: 'Pode inseri-lo e retirá-lo por si.',
      },
      {
        title: 'Ritmo regular',
        text: 'Fica geralmente no lugar durante três semanas.',
      },
      {
        title: 'Ação contínua',
        text: 'As hormonas são libertadas de forma contínua durante todo o período de utilização.',
      },
      {
        title: 'Não protege contra IST',
        text: 'Pode ser necessária proteção adicional consoante a situação.',
      },
    ],
    checkListTitle: 'Bons hábitos a manter',
    practicalSteps: [
      'Lave as mãos antes de o inserir ou retirar',
      'Escolha uma hora fácil de memorizar para acompanhar o calendário',
      'Verifique de vez em quando se continua no lugar',
      'Consulte o folheto informativo se se deslocar ou for expulso',
    ],
    alertTitle: 'Atenção',
    alertText: 'Uma expulsão ou um deslocamento prolongado pode exigir orientações específicas. Consulte sempre o folheto informativo do dispositivo ou pergunte a um profissional de saúde em caso de dúvida.',
    summaryTitle: 'O essencial em 4 pontos',
    summaryItems: [
      {
        title: 'Inserção simples',
        text: 'O anel pode ser inserido e retirado pela própria pessoa.',
      },
      {
        title: 'Ritmo semanal',
        text: 'Segue geralmente um ciclo de três semanas com uma semana de pausa.',
      },
      {
        title: 'Verificação ocasional',
        text: 'Verificar regularmente se está no lugar ajuda a usar o dispositivo com tranquilidade.',
      },
      {
        title: 'Sem proteção contra IST',
        text: 'Pode ser necessária uma proteção adequada consoante a situação.',
      },
    ],
    tip2Title: 'Pontos a reter',
    tip2Text: 'O anel vaginal combina a libertação contínua de hormonas com um ritmo de utilização que dispensa uma toma diária. No entanto, a escolha da contraceção deve ser adaptada a cada pessoa e discutida com um profissional de saúde.',
    shareMessage: 'O anel vaginal contracetivo — AWA',
  },
  bn: {
    badge: 'যোনিপথের রিং',
    title: 'জন্মনিয়ন্ত্রণের\nযোনিপথের রিং',
    metaDuration: 'পড়তে 5 মিনিট',
    metaType: 'নিবন্ধ',
    metaLevel: 'প্রাথমিক',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'একটি নমনীয় রিং, যা তিন সপ্তাহ ধরে পরা হয়।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'রিং কীভাবে কাজ করে',
      'পরানো ও খোলা',
      'যা জানা দরকার',
      'মূল কথা',
    ],
    body1: 'রিং একটি নমনীয় উপকরণ, যা সরাসরি যোনিপথে অবিরাম অল্প মাত্রায় হরমোন নির্গত করে এবং সম্মিলিত জন্মনিয়ন্ত্রণ বড়ির মতোই জন্মনিয়ন্ত্রণে কাজ করে।',
    flowTitle: 'কীভাবে কাজ করে',
    flowSteps: [
      {
        title: 'রিং',
        text: 'যোনিপথে স্থাপন করা হয়',
      },
      {
        title: 'হরমোন',
        text: 'অবিরাম নির্গমন',
      },
      {
        title: 'সুরক্ষা',
        text: 'গর্ভনিরোধক কার্যকারিতা',
      },
    ],
    body2: 'আপনি নিজেই এটি পরাতে পারেন, এটি তিন সপ্তাহ ধরে টানা জায়গায় থাকে, তারপর এক সপ্তাহের বিরতির জন্য খুলে ফেলা হয়, আর এই বিরতিতে আপনার মাসিক হয়।',
    calendarTitle: 'অনুসরণ করার মতো সহজ ছন্দ',
    weekLabelActive: 'রিং',
    weekLabelPause: 'বিরতি',
    legendActive: 'রিং পরা থাকার সপ্তাহ',
    legendPause: 'বিরতির সপ্তাহ',
    tip1Title: 'জেনে রাখা ভালো',
    tip1Text: 'কার্যকর হওয়ার জন্য যোনিপথে এর অবস্থান একেবারে নিখুঁত হতে হয় না, যা এটি ব্যবহার করা সহজ করে তোলে।',
    body3: 'রিং বেছে নেওয়ার আগে এর কয়েকটি বাস্তব দিক জেনে রাখা ভালো।',
    careTips: [
      {
        title: 'ব্যবহার সহজ',
        text: 'আপনি নিজেই এটি পরাতে ও খুলতে পারেন।',
      },
      {
        title: 'নিয়মিত ছন্দ',
        text: 'এটি সাধারণত তিন সপ্তাহ জায়গায় থাকে।',
      },
      {
        title: 'অবিরাম কার্যকারিতা',
        text: 'ব্যবহারের পুরো সময় জুড়ে হরমোন অবিরাম নির্গত হয়।',
      },
      {
        title: 'যৌনবাহিত সংক্রমণ থেকে সুরক্ষা দেয় না',
        text: 'পরিস্থিতি অনুযায়ী অতিরিক্ত সুরক্ষার প্রয়োজন হতে পারে।',
      },
    ],
    checkListTitle: 'যেসব ভালো অভ্যাস মেনে চলবেন',
    practicalSteps: [
      'পরানো বা খোলার আগে হাত ধুয়ে নিন',
      'সময়সূচি মনে রাখার জন্য সহজে মনে রাখা যায় এমন একটি সময় বেছে নিন',
      'মাঝে মাঝে দেখে নিন যে এটি এখনও জায়গায় আছে কি না',
      'এটি সরে গেলে বা বেরিয়ে এলে সঙ্গে থাকা তথ্যপত্র দেখে নিন',
    ],
    alertTitle: 'মনে রাখবেন',
    alertText: 'রিং বেরিয়ে এলে বা দীর্ঘ সময় সরে থাকলে নির্দিষ্ট দিকনির্দেশনার প্রয়োজন হতে পারে। নিশ্চিত না হলে সবসময় উপকরণের সঙ্গে থাকা তথ্যপত্র দেখুন অথবা কোনো স্বাস্থ্যসেবা পেশাজীবীকে জিজ্ঞাসা করুন।',
    summaryTitle: '4টি পয়েন্টে মূল কথা',
    summaryItems: [
      {
        title: 'পরানো সহজ',
        text: 'রিং নিজেই পরানো ও খোলা যায়।',
      },
      {
        title: 'সাপ্তাহিক ছন্দ',
        text: 'এটি সাধারণত তিন সপ্তাহের চক্র অনুসরণ করে এবং তারপর এক সপ্তাহের বিরতি থাকে।',
      },
      {
        title: 'মাঝে মাঝে পরীক্ষা',
        text: 'নিয়মিত দেখে নেওয়া যে এটি জায়গায় আছে কি না, আপনাকে নিশ্চিন্তে উপকরণটি ব্যবহার করতে সাহায্য করে।',
      },
      {
        title: 'যৌনবাহিত সংক্রমণ থেকে সুরক্ষা নেই',
        text: 'পরিস্থিতি অনুযায়ী উপযুক্ত সুরক্ষার প্রয়োজন হতে পারে।',
      },
    ],
    tip2Title: 'মূল কথা',
    tip2Text: 'যোনিপথের রিং অবিরাম হরমোন নির্গমনের সঙ্গে এমন একটি ব্যবহারের ছন্দ মিলিয়েছে, যাতে প্রতিদিন ডোজ নিতে হয় না। তবে জন্মনিয়ন্ত্রণ পদ্ধতি প্রত্যেকের প্রয়োজন অনুযায়ী বেছে নেওয়া উচিত এবং কোনো স্বাস্থ্যসেবা পেশাজীবীর সঙ্গে আলোচনা করা উচিত।',
    shareMessage: 'জন্মনিয়ন্ত্রণের যোনিপথের রিং — AWA',
  },
  da: {
    badge: 'VAGINALRING',
    title: 'Præventions-\nvaginalringen',
    metaDuration: '5 min læsning',
    metaType: 'Artikel',
    metaLevel: 'Grundlæggende',
    metaValidated: 'Gennemgået indhold',
    intro: 'En fleksibel ring, der bæres i tre uger ad gangen.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvordan ringen virker',
      'Isætning og fjernelse',
      'Hvad du bør vide',
      'Vigtige pointer',
    ],
    body1: 'Ringen er lavet af et fleksibelt materiale, der frigiver en konstant lav dosis hormoner direkte i skeden, og den virker som prævention ligesom en kombinationspille.',
    flowTitle: 'Hvordan det virker',
    flowSteps: [
      {
        title: 'Ringen',
        text: 'Placeres i skeden',
      },
      {
        title: 'Hormoner',
        text: 'Kontinuerlig frigivelse',
      },
      {
        title: 'Beskyttelse',
        text: 'Kontraceptiv effekt',
      },
    ],
    body2: 'Du kan sætte den i selv; den sidder på plads i tre uger, derefter fjernes den for en uges pause, og i denne pause får du din menstruation.',
    calendarTitle: 'En enkel rytme at følge',
    weekLabelActive: 'Ring',
    weekLabelPause: 'Pause',
    legendActive: 'Uger med ring',
    legendPause: 'Pauseuge',
    tip1Title: 'Godt at vide',
    tip1Text: 'Dens placering i skeden behøver ikke at være helt præcis for at virke, hvilket gør den nem at bruge.',
    body3: 'Det er godt at kende et par praktiske aspekter ved ringen, inden du vælger den.',
    careTips: [
      {
        title: 'Nem at bruge',
        text: 'Du kan selv sætte den i og fjerne den.',
      },
      {
        title: 'Regelmæssig rytme',
        text: 'Den sidder normalt på plads i tre uger.',
      },
      {
        title: 'Kontinuerlig effekt',
        text: 'Hormoner frigives kontinuerligt i hele brugsperioden.',
      },
      {
        title: 'Beskytter ikke mod STI',
        text: 'Ekstra beskyttelse kan være nødvendig afhængigt af situationen.',
      },
    ],
    checkListTitle: 'Gode vaner at følge',
    practicalSteps: [
      'Vask hænder inden isætning eller fjernelse',
      'Vælg et tidspunkt, der er nemt at huske for at holde styr på planen',
      'Tjek ind imellem at den stadig er på plads',
      'Konsulter indlægssedlen, hvis den falder ud eller forskydes',
    ],
    alertTitle: 'Husk',
    alertText: 'Hvis ringen falder ud eller har siddet forkert i lang tid, kan specifik vejledning være nødvendig. Konsulter altid indlægssedlen eller spørg en sundhedsprofessionel ved tvivl.',
    summaryTitle: 'Vigtige pointer i 4 punkter',
    summaryItems: [
      {
        title: 'Nem at indsætte',
        text: 'Ringen kan sættes i og tages ud af dig selv.',
      },
      {
        title: 'Ugentlig rytme',
        text: 'Den følger normalt en tre-ugers cyklus efterfulgt af en uges pause.',
      },
      {
        title: 'Lejlighedsvis kontrol',
        text: 'At tjekke regelmæssigt at den er på plads hjælper dig med at bruge produktet trygt.',
      },
      {
        title: 'Ingen STI-beskyttelse',
        text: 'Passende beskyttelse kan være nødvendig afhængigt af situationen.',
      },
    ],
    tip2Title: 'Vigtigste pointer',
    tip2Text: 'Vaginalringen kombinerer kontinuerlig hormonudledning med en brugsrytme, der ikke kræver en daglig dosis. Dog bør præventionsmetoden vælges ud fra den enkeltes behov og drøftes med en sundhedsprofessionel.',
    shareMessage: 'Præventionsvaginalringen — AWA',
  },
  sv: {
    badge: 'VAGINALRING',
    title: 'Präventions-\nvaginalringen',
    metaDuration: '5 min läsning',
    metaType: 'Artikel',
    metaLevel: 'Grundläggende',
    metaValidated: 'Gennemgået indhold',
    intro: 'En fleksibel ring, der bäres i tre veckor ad gangen.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvordan ringen virker',
      'Isätning och fjernelse',
      'Hvad du bör vide',
      'Vigtige pointer',
    ],
    body1: 'Ringen ar lavet av et fleksibelt materiale, der frigiver en konstant lav dosis hormoner direkte i skeden, och den virker som prävention ligesom en kombinationspille.',
    flowTitle: 'Hvordan det virker',
    flowSteps: [
      {
        title: 'Ringen',
        text: 'Placeres i skeden',
      },
      {
        title: 'Hormoner',
        text: 'Kontinuerlig frigivelse',
      },
      {
        title: 'Beskyttelse',
        text: 'Kontraceptiv effekt',
      },
    ],
    body2: 'Du kan sätte den i selv; den sidder på plads i tre veckor, derefter fjernes den for en uges pause, och i denne pause får du din menstruation.',
    calendarTitle: 'En enkel rytme at fölge',
    weekLabelActive: 'Ring',
    weekLabelPause: 'Pause',
    legendActive: 'Uger med ring',
    legendPause: 'Pauseuge',
    tip1Title: 'Godt at vide',
    tip1Text: 'Dens placering i skeden behöver inte at väre helt präcis for att virke, hvilket gör den nem at bruge.',
    body3: 'Det ar godt at kende et par praktiske aspekter ved ringen, inden du välger den.',
    careTips: [
      {
        title: 'Nem at bruge',
        text: 'Du kan selv sätte den i och fjerne den.',
      },
      {
        title: 'Regelmässig rytme',
        text: 'Den sidder normalt på plads i tre veckor.',
      },
      {
        title: 'Kontinuerlig effekt',
        text: 'Hormoner frigives kontinuerligt i hele brugsperioden.',
      },
      {
        title: 'Beskytter inte mod STI',
        text: 'Ekstra beskyttelse kan väre nödvendig afhängigt av situationen.',
      },
    ],
    checkListTitle: 'Gode vaner at fölge',
    practicalSteps: [
      'Vask händer inden isätning eller fjernelse',
      'Välg et tidspunkt, der ar nemt at huske for att holde styr på planen',
      'Tjek ind imellem at den fortfarande ar på plads',
      'Konsulter indlägssedlen, hvis den falder ud eller forskydes',
    ],
    alertTitle: 'Husk',
    alertText: 'Hvis ringen falder ud eller har siddet forkert i lang tid, kan specifik vejledning väre nödvendig. Konsulter alltid indlägssedlen eller spörg en halsasprofessionel ved tvivl.',
    summaryTitle: 'Vigtige pointer i 4 punkter',
    summaryItems: [
      {
        title: 'Nem at indsätte',
        text: 'Ringen kan sättes i och tages ud av dig selv.',
      },
      {
        title: 'Ugentlig rytme',
        text: 'Den fölger normalt en tre-ugers cyklus efterfulgt av en uges pause.',
      },
      {
        title: 'Lejlighedsvis kontrol',
        text: 'At tjekke regelmässigt at den ar på plads hjälper dig med at bruge produktet trygt.',
      },
      {
        title: 'Ingen STI-beskyttelse',
        text: 'Passende beskyttelse kan väre nödvendig afhängigt av situationen.',
      },
    ],
    tip2Title: 'Vigtigste pointer',
    tip2Text: 'Vaginalringen kombinerer kontinuerlig hormonudledning med en brugsrytme, der inte kräver en daglig dosis. Dog bör präventionsmetoden välges ud fran den enkeltes behov och dröftes med en halsasprofessionel.',
    shareMessage: 'Präventionsvaginalringen — AWA',
  },
  nb: {
    badge: 'VAGINALRING',
    title: 'Den vaginale\nprevensjonsringen',
    metaDuration: '5 min lesing',
    metaType: 'Artikkel',
    metaLevel: 'Nybegynner',
    metaValidated: 'Gjennomgått innhold',
    intro: 'En myk ring som brukes i tre uker.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Hvordan ringen virker',
      'Innsetting og uttak',
      'Det du trenger å vite',
      'Det viktigste å huske',
    ],
    body1:
      'Ringen er en myk innretning som kontinuerlig frigjør lave doser hormoner direkte i skjeden, med samme prevensjonsvirkning som en kombinasjonspille.',
    flowTitle: 'Slik virker den',
    flowSteps: [
      {title: 'Ring', text: 'Settes inn i skjeden'},
      {title: 'Hormoner', text: 'Kontinuerlig avgivelse'},
      {title: 'Beskyttelse', text: 'Prevensjonsvirkning'},
    ],
    body2:
      'Du setter den inn selv, den blir værende kontinuerlig i tre uker, og deretter tas den ut for en ukes pause da mensen kommer.',
    calendarTitle: 'En enkel rytme å følge',
    weekLabelActive: 'Ring',
    weekLabelPause: 'Pause',
    legendActive: 'Uke med ring',
    legendPause: 'Pauseuke',
    tip1Title: 'Godt å vite',
    tip1Text:
      'Den nøyaktige plasseringen i skjeden trenger ikke være presis for at den skal virke, noe som gjør den enkel å bruke.',
    body3:
      'Ringen har flere praktiske punkter det er greit å kjenne til før du velger den.',
    careTips: [
      {title: 'Enkel å bruke', text: 'Du setter den inn og tar den ut selv.'},
      {title: 'Jevn rytme', text: 'Den blir vanligvis værende i tre uker.'},
      {title: 'Kontinuerlig virkning', text: 'Hormonene frigjøres kontinuerlig gjennom hele bruksperioden.'},
      {title: 'Beskytter ikke mot SOI', text: 'Ekstra beskyttelse kan trengs avhengig av situasjonen.'},
    ],
    checkListTitle: 'Gode vaner å beholde',
    practicalSteps: [
      'Vask hendene før du setter den inn eller tar den ut',
      'Velg et tidspunkt som er lett å huske, for å holde oversikt over planen',
      'Kontroller av og til at den fortsatt sitter på plass',
      'Les pakningsvedlegget hvis den forskyver seg eller støtes ut',
    ],
    alertTitle: 'Merk',
    alertText:
      'En utstøting eller langvarig forskyvning kan kreve spesifikk veiledning. Les alltid pakningsvedlegget til produktet eller spør helsepersonell hvis du er usikker.',
    summaryTitle: 'Det viktigste i 4 punkter',
    summaryItems: [
      {title: 'Enkel innsetting', text: 'Ringen kan settes inn og tas ut av deg selv.'},
      {title: 'Ukentlig rytme', text: 'Den følger vanligvis en tre ukers syklus med en ukes pause.'},
      {title: 'Av og til kontroll', text: 'Å kontrollere jevnlig at den sitter på plass hjelper deg å bruke produktet med ro i sinnet.'},
      {title: 'Ingen beskyttelse mot SOI', text: 'Egnet beskyttelse kan trengs avhengig av situasjonen.'},
    ],
    tip2Title: 'Det viktigste å huske',
    tip2Text:
      'Vaginalringen kombinerer kontinuerlig frigjøring av hormoner med en bruksrytme som unngår en daglig dose. Valget av prevensjon bør likevel tilpasses hver enkelt og diskuteres med helsepersonell.',
    shareMessage: 'Den vaginale prevensjonsringen – AWA',
  },
  pl: {
    badge: 'KRĄŻEK DOPOCHWOWY',
    title: 'Antykoncepcyjny\nkrążek dopochwowy',
    metaDuration: '5 min czytania',
    metaType: 'Artykuł',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Elastyczny krążek, noszony przez trzy tygodnie.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Jak działa krążek',
      'Wkładanie i wyjmowanie',
      'Co warto wiedzieć',
      'Najważniejsze wnioski',
    ],
    body1:
      'Krążek to elastyczne urządzenie, które stale uwalnia małe dawki hormonów bezpośrednio w pochwie, z takim samym działaniem antykoncepcyjnym jak tabletka złożona.',
    flowTitle: 'Jak to działa',
    flowSteps: [
      {title: 'Krążek', text: 'Umieszczony w pochwie'},
      {title: 'Hormony', text: 'Stałe uwalnianie'},
      {title: 'Ochrona', text: 'Działanie antykoncepcyjne'},
    ],
    body2:
      'Wkładasz go samodzielnie, pozostaje na miejscu nieprzerwanie przez trzy tygodnie, a następnie jest wyjmowany na tygodniową przerwę, podczas której występuje miesiączka.',
    calendarTitle: 'Prosty rytm do zapamiętania',
    weekLabelActive: 'Krążek',
    weekLabelPause: 'Przerwa',
    legendActive: 'Tydzień z krążkiem',
    legendPause: 'Tydzień przerwy',
    tip1Title: 'Warto wiedzieć',
    tip1Text:
      'Jego dokładne położenie w pochwie nie musi być precyzyjne, aby był skuteczny, co czyni go prostym w użyciu.',
    body3:
      'Krążek ma kilka praktycznych cech, które warto znać przed wyborem.',
    careTips: [
      {title: 'Prosty w użyciu', text: 'Wkładasz go i wyjmujesz samodzielnie.'},
      {title: 'Regularny rytm', text: 'Zazwyczaj pozostaje na miejscu przez trzy tygodnie.'},
      {title: 'Ciągłe działanie', text: 'Hormony są uwalniane nieprzerwanie przez cały okres stosowania.'},
      {title: 'Nie chroni przed chorobami przenoszonymi drogą płciową', text: 'W zależności od sytuacji może być potrzebna dodatkowa ochrona.'},
    ],
    checkListTitle: 'Dobre nawyki',
    practicalSteps: [
      'Umyj ręce przed włożeniem lub wyjęciem',
      'Wybierz porę, którą łatwo zapamiętać, aby pilnować harmonogramu',
      'Od czasu do czasu sprawdzaj, czy nadal jest na miejscu',
      'Sprawdź ulotkę, jeśli się przesunie lub zostanie wydalony',
    ],
    alertTitle: 'Zwróć uwagę',
    alertText:
      'Wydalenie lub długotrwałe przesunięcie może wymagać specjalnych wskazówek. Zawsze sprawdź ulotkę urządzenia lub zapytaj specjalistę, jeśli masz wątpliwości.',
    summaryTitle: 'Najważniejsze w 4 punktach',
    summaryItems: [
      {title: 'Proste wkładanie', text: 'Krążek można samodzielnie włożyć i wyjąć.'},
      {title: 'Tygodniowy rytm', text: 'Zazwyczaj stosuje się go w cyklu trzytygodniowym z tygodniową przerwą.'},
      {title: 'Okresowa kontrola', text: 'Regularne sprawdzanie, czy jest na miejscu, pozwala stosować go ze spokojem.'},
      {title: 'Brak ochrony przed chorobami przenoszonymi drogą płciową', text: 'W zależności od sytuacji może być potrzebna odpowiednia ochrona.'},
    ],
    tip2Title: 'Najważniejsze wnioski',
    tip2Text:
      'Krążek dopochwowy łączy ciągłe uwalnianie hormonów z rytmem stosowania, który pozwala uniknąć codziennej dawki. Wybór antykoncepcji powinien jednak być dostosowany do każdej osoby i omówiony ze specjalistą.',
    shareMessage: 'Antykoncepcyjny krążek dopochwowy — AWA',
  },
  uk: {
    badge: 'ВАГІНАЛЬНЕ КІЛЬЦЕ',
    title: 'Контрацептивне\nвагінальне кільце',
    metaDuration: '5 хв читання',
    metaType: 'Стаття',
    metaLevel: 'Початковий',
    metaValidated: 'Перевірений вміст',
    intro: 'Гнучке кільце, яке носять три тижні.',
    contentsTitle: 'У цій статті',
    topics: [
      'Як працює кільце',
      'Введення та вилучення',
      'Що варто знати',
      'Головні висновки',
    ],
    body1:
      'Кільце — гнучкий пристрій, що постійно вивільняє малі дози гормонів безпосередньо в піхві, із таким самим контрацептивним ефектом, як комбінована таблетка.',
    flowTitle: 'Як це працює',
    flowSteps: [
      {title: 'Кільце', text: 'Розміщується в піхві'},
      {title: 'Гормони', text: 'Безперервне вивільнення'},
      {title: 'Захист', text: 'Контрацептивна дія'},
    ],
    body2:
      'Ви вводите його самостійно, воно безперервно залишається на місці три тижні, потім його вилучають на тижневу перерву, під час якої настає менструація.',
    calendarTitle: 'Простий ритм, якого легко дотримуватися',
    weekLabelActive: 'Кільце',
    weekLabelPause: 'Перерва',
    legendActive: 'Тиждень із кільцем',
    legendPause: 'Тиждень перерви',
    tip1Title: 'Варто знати',
    tip1Text:
      'Його точне положення в піхві не має бути ідеальним для ефективності, що робить його простим у використанні.',
    body3:
      'Кільце має кілька практичних особливостей, які варто знати до вибору.',
    careTips: [
      {title: 'Просте у використанні', text: 'Ви вводите і вилучаєте його самостійно.'},
      {title: 'Регулярний ритм', text: 'Зазвичай воно залишається на місці три тижні.'},
      {title: 'Безперервна дія', text: 'Гормони вивільняються безперервно протягом усього періоду використання.'},
      {title: 'Не захищає від інфекцій, що передаються статевим шляхом', text: 'Залежно від ситуації може знадобитися додатковий захист.'},
    ],
    checkListTitle: 'Гарні звички',
    practicalSteps: [
      'Мийте руки перед введенням чи вилученням',
      'Оберіть час, який легко запам’ятати, щоб стежити за графіком',
      'Час від часу перевіряйте, чи воно на місці',
      'Зверніться до інструкції, якщо воно змістилося або випало',
    ],
    alertTitle: 'Зверніть увагу',
    alertText:
      'Випадіння або тривале зміщення може потребувати особливих вказівок. Завжди перевіряйте інструкцію до пристрою або запитайте медичного фахівця, якщо не впевнені.',
    summaryTitle: 'Головне у 4 пунктах',
    summaryItems: [
      {title: 'Просте введення', text: 'Кільце можна вводити й вилучати самостійно.'},
      {title: 'Тижневий ритм', text: 'Зазвичай дотримується трьохтижневого циклу з тижневою перервою.'},
      {title: 'Періодична перевірка', text: 'Регулярна перевірка, чи воно на місці, дає змогу користуватися пристроєм спокійно.'},
      {title: 'Немає захисту від інфекцій, що передаються статевим шляхом', text: 'Залежно від ситуації може знадобитися відповідний захист.'},
    ],
    tip2Title: 'Головні висновки',
    tip2Text:
      'Вагінальне кільце поєднує безперервне вивільнення гормонів із ритмом використання, що дозволяє уникнути щоденної дози. Проте вибір контрацепції має бути підібраний до кожної людини й обговорений із медичним фахівцем.',
    shareMessage: 'Контрацептивне вагінальне кільце — AWA',
  },
  cs: {
    badge: 'POŠEVNÍ KROUŽEK',
    title: 'Antikoncepční\npoševní kroužek',
    metaDuration: '5 min čtení',
    metaType: 'Článek',
    metaLevel: 'Začátečník',
    metaValidated: 'Ověřený obsah',
    intro: 'Pružný kroužek, který se nosí tři týdny.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Jak kroužek funguje',
      'Zavedení a vyjmutí',
      'Co potřebujete vědět',
      'Hlavní poznatky',
    ],
    body1:
      'Kroužek je pružná pomůcka, která nepřetržitě uvolňuje nízké dávky hormonů přímo v pochvě, se stejným antikoncepčním účinkem jako kombinovaná pilulka.',
    flowTitle: 'Jak funguje',
    flowSteps: [
      {title: 'Kroužek', text: 'Zavedený do pochvy'},
      {title: 'Hormony', text: 'Nepřetržité uvolňování'},
      {title: 'Ochrana', text: 'Antikoncepční účinek'},
    ],
    body2:
      'Zavádíte si ho sama, zůstává na místě nepřetržitě po dobu tří týdnů, poté se vyjme na týdenní přestávku, během níž nastane menstruace.',
    calendarTitle: 'Jednoduchý rytmus, který lze dodržet',
    weekLabelActive: 'Kroužek',
    weekLabelPause: 'Přestávka',
    legendActive: 'Týden s kroužkem',
    legendPause: 'Týden přestávky',
    tip1Title: 'Stojí za to vědět',
    tip1Text:
      'Jeho přesná poloha v pochvě nemusí být přesná, aby byl účinný, což usnadňuje jeho používání.',
    body3:
      'Kroužek má několik praktických bodů, které stojí za to znát před jeho výběrem.',
    careTips: [
      {title: 'Snadné používání', text: 'Zavádíte a vyjímáte ho sama.'},
      {title: 'Pravidelný rytmus', text: 'Obvykle zůstává na místě tři týdny.'},
      {title: 'Nepřetržitý účinek', text: 'Hormony se uvolňují nepřetržitě po celou dobu používání.'},
      {title: 'Nechrání před sexuálně přenosnými infekcemi', text: 'Podle situace může být nutná dodatečná ochrana.'},
    ],
    checkListTitle: 'Dobré návyky, které dodržovat',
    practicalSteps: [
      'Před zavedením nebo vyjmutím si umyjte ruce',
      'Zvolte snadno zapamatovatelnou dobu, abyste měla přehled o rozvrhu',
      'Občas zkontrolujte, zda je stále na místě',
      'Pokud se posune nebo vypadne, přečtěte si příbalový leták',
    ],
    alertTitle: 'Upozornění',
    alertText:
      'Vypadnutí nebo dlouhodobé posunutí může vyžadovat konkrétní pokyny. Vždy zkontrolujte příbalový leták pomůcky nebo požádejte o radu zdravotnického pracovníka, pokud si nejste jistá.',
    summaryTitle: 'To nejdůležitější ve 4 bodech',
    summaryItems: [
      {title: 'Snadné zavedení', text: 'Kroužek si můžete zavádět a vyjímat sama.'},
      {title: 'Týdenní rytmus', text: 'Obvykle se řídí třítýdenním cyklem s týdenní přestávkou.'},
      {title: 'Občasná kontrola', text: 'Pravidelná kontrola, zda je na místě, vám pomůže používat pomůcku s klidem.'},
      {title: 'Žádná ochrana před sexuálně přenosnými infekcemi', text: 'Podle situace může být nutná vhodná ochrana.'},
    ],
    tip2Title: 'Hlavní poznatky',
    tip2Text:
      'Poševní kroužek spojuje nepřetržité uvolňování hormonů s rytmem používání, který se vyhýbá denní dávce. Volba antikoncepce by však měla být přizpůsobena každé ženě a probrána se zdravotnickým pracovníkem.',
    shareMessage: 'Antikoncepční poševní kroužek — AWA',
  },
  sk: {
    badge: 'VAGINÁLNY KRÚŽOK',
    title: 'Antikoncepčný\nvaginálny krúžok',
    metaDuration: '5 min čítania',
    metaType: 'Článok',
    metaLevel: 'Začiatočník',
    metaValidated: 'Overený obsah',
    intro: 'Pružný krúžok, ktorý sa nosí tri týždne.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Ako krúžok funguje',
      'Zavedenie a vybratie',
      'Čo treba vedieť',
      'Hlavné body',
    ],
    body1:
      'Krúžok je pružná pomôcka, ktorá nepretržite uvoľňuje nízke dávky hormónov priamo v pošve, s rovnakým antikoncepčným účinkom ako kombinovaná tableta.',
    flowTitle: 'Ako funguje',
    flowSteps: [
      {title: 'Krúžok', text: 'Uložený v pošve'},
      {title: 'Hormóny', text: 'Nepretržité uvoľňovanie'},
      {title: 'Ochrana', text: 'Antikoncepčný účinok'},
    ],
    body2:
      'Zavediete si ho sama, zostáva na mieste nepretržite tri týždne a potom sa vyberie na týždennú prestávku, počas ktorej nastane menštruácia.',
    calendarTitle: 'Jednoduchý rytmus, ktorý treba dodržiavať',
    weekLabelActive: 'Krúžok',
    weekLabelPause: 'Prestávka',
    legendActive: 'Týždeň s krúžkom',
    legendPause: 'Týždeň prestávky',
    tip1Title: 'Stojí za to vedieť',
    tip1Text:
      'Jeho presná poloha v pošve nemusí byť presná, aby bol účinný, čo robí jeho používanie jednoduchým.',
    body3:
      'Krúžok má niekoľko praktických bodov, ktoré stojí za to poznať pred jeho výberom.',
    careTips: [
      {title: 'Jednoduché používanie', text: 'Zavediete a vyberiete ho sama.'},
      {title: 'Pravidelný rytmus', text: 'Zvyčajne zostáva na mieste tri týždne.'},
      {title: 'Nepretržitý účinok', text: 'Hormóny sa uvoľňujú nepretržite počas celého obdobia používania.'},
      {title: 'Nechráni pred STI', text: 'Podľa situácie môže byť potrebná dodatočná ochrana.'},
    ],
    checkListTitle: 'Dobré návyky, ktoré treba dodržiavať',
    practicalSteps: [
      'Pred zavedením alebo vybratím si umyte ruky',
      'Zvoľte si čas, ktorý si ľahko zapamätáte, aby ste mali prehľad o rozvrhu',
      'Občas skontrolujte, či je stále na mieste',
      'Ak sa posunie alebo vypadne, pozrite si písomnú informáciu',
    ],
    alertTitle: 'Upozornenie',
    alertText:
      'Vypadnutie alebo dlhodobé posunutie môže vyžadovať osobitné usmernenie. Vždy si pozrite písomnú informáciu k pomôcke alebo sa opýtajte zdravotníckeho pracovníka, ak si nie ste istá.',
    summaryTitle: 'To najdôležitejšie v 4 bodoch',
    summaryItems: [
      {title: 'Jednoduché zavedenie', text: 'Krúžok si môžete zaviesť a vybrať sama.'},
      {title: 'Týždenný rytmus', text: 'Zvyčajne sleduje trojtýždňový cyklus s týždňovou prestávkou.'},
      {title: 'Občasná kontrola', text: 'Pravidelná kontrola, či je na mieste, vám pomáha používať pomôcku s pokojom.'},
      {title: 'Žiadna ochrana pred STI', text: 'Podľa situácie môže byť potrebná vhodná ochrana.'},
    ],
    tip2Title: 'Hlavné body',
    tip2Text:
      'Vaginálny krúžok kombinuje nepretržité uvoľňovanie hormónov s rytmom používania, ktorý sa vyhýba dennej dávke. Voľba antikoncepcie by sa však mala prispôsobiť každej žene a prediskutovať so zdravotníckym pracovníkom.',
    shareMessage: 'Antikoncepčný vaginálny krúžok — AWA',
  },
  hu: {
    badge: 'HÜVELYGYŰRŰ',
    title: 'A fogamzásgátló\nhüvelygyűrű',
    metaDuration: '5 perc olvasás',
    metaType: 'Cikk',
    metaLevel: 'Kezdő',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'Rugalmas gyűrű, amelyet három hétig viselsz.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Hogyan működik a gyűrű',
      'Behelyezés és eltávolítás',
      'Amit tudnod kell',
      'Legfontosabb tudnivalók',
    ],
    body1:
      'A gyűrű rugalmas eszköz, amely folyamatosan alacsony dózisú hormonokat bocsát ki közvetlenül a hüvelyben, ugyanazzal a fogamzásgátló hatással, mint egy kombinált tabletta.',
    flowTitle: 'Hogyan működik',
    flowSteps: [
      {title: 'Gyűrű', text: 'A hüvelybe helyezve'},
      {title: 'Hormonok', text: 'Folyamatos leadás'},
      {title: 'Védelem', text: 'Fogamzásgátló hatás'},
    ],
    body2:
      'Magad helyezed be, három hétig folyamatosan a helyén marad, majd egyhetes szünetre eltávolítod, amely alatt a menstruációd jelentkezik.',
    calendarTitle: 'Egyszerű ritmus, amelyet követhetsz',
    weekLabelActive: 'Gyűrű',
    weekLabelPause: 'Szünet',
    legendActive: 'Hét a gyűrűvel',
    legendPause: 'Szünet hete',
    tip1Title: 'Érdemes tudni',
    tip1Text:
      'A hüvelyben elfoglalt pontos helyzetének nem kell pontosnak lennie ahhoz, hogy hatékony legyen, ami egyszerűvé teszi a használatát.',
    body3:
      'A gyűrűnek van néhány praktikus pontja, amelyet érdemes ismerni a kiválasztása előtt.',
    careTips: [
      {title: 'Egyszerű használat', text: 'Magad helyezed be és távolítod el.'},
      {title: 'Rendszeres ritmus', text: 'Általában három hétig marad a helyén.'},
      {title: 'Folyamatos hatás', text: 'A hormonok a használat teljes ideje alatt folyamatosan kiszabadulnak.'},
      {title: 'Nem véd az STI-k ellen', text: 'A helyzettől függően kiegészítő védelemre lehet szükség.'},
    ],
    checkListTitle: 'Jó szokások, amelyeket érdemes betartani',
    practicalSteps: [
      'Mosd meg a kezed a behelyezés vagy eltávolítás előtt',
      'Válassz könnyen megjegyezhető időpontot, hogy nyomon követhesd az ütemezést',
      'Alkalmanként ellenőrizd, hogy még a helyén van-e',
      'Ha elmozdul vagy kiesik, nézd meg a betegtájékoztatót',
    ],
    alertTitle: 'Figyelem',
    alertText:
      'A kiesés vagy a hosszan tartó elmozdulás külön útmutatást igényelhet. Mindig nézd meg az eszköz betegtájékoztatóját, vagy kérdezd meg egészségügyi szakembert, ha bizonytalan vagy.',
    summaryTitle: 'A lényeg 4 pontban',
    summaryItems: [
      {title: 'Egyszerű behelyezés', text: 'A gyűrűt magad is behelyezheted és eltávolíthatod.'},
      {title: 'Heti ritmus', text: 'Általában háromhetes ciklust követ egyhetes szünettel.'},
      {title: 'Alkalmankénti ellenőrzés', text: 'Ha rendszeresen ellenőrzöd, hogy a helyén van, nyugodtabban használhatod az eszközt.'},
      {title: 'Nincs védelem az STI-k ellen', text: 'A helyzettől függően megfelelő védelemre lehet szükség.'},
    ],
    tip2Title: 'Legfontosabb tudnivalók',
    tip2Text:
      'A hüvelygyűrű a folyamatos hormonleadást olyan használati ritmussal ötvözi, amely elkerüli a napi adagot. A fogamzásgátlás kiválasztását azonban minden nőhöz kell igazítani, és meg kell beszélni egészségügyi szakemberrel.',
    shareMessage: 'A fogamzásgátló hüvelygyűrű — AWA',
  },
  ro: {
    badge: 'INEL VAGINAL',
    title: 'Inelul contraceptiv\nvaginal',
    metaDuration: '5 min de citit',
    metaType: 'Articol',
    metaLevel: 'Începător',
    metaValidated: 'Conținut revizuit',
    intro: 'Un inel flexibil, purtat timp de trei săptămâni.',
    contentsTitle: 'În acest articol',
    topics: [
      'Cum funcționează inelul',
      'Introducerea și scoaterea',
      'Ce trebuie să știi',
      'Ce să reții',
    ],
    body1:
      'Inelul este un dispozitiv flexibil care eliberează continuu doze mici de hormoni direct în vagin, cu aceeași acțiune contraceptivă ca o pilulă combinată.',
    flowTitle: 'Cum funcționează',
    flowSteps: [
      {title: 'Inel', text: 'Plasat în vagin'},
      {title: 'Hormoni', text: 'Difuzie continuă'},
      {title: 'Protecție', text: 'Acțiune contraceptivă'},
    ],
    body2:
      'Îl introduci singură, rămâne în mod continuu pe loc timp de trei săptămâni, apoi este scos pentru o pauză de o săptămână în timpul căreia apare menstruația.',
    calendarTitle: 'Un ritm simplu de urmat',
    weekLabelActive: 'Inel',
    weekLabelPause: 'Pauză',
    legendActive: 'Săptămână cu inel',
    legendPause: 'Săptămână de pauză',
    tip1Title: 'Bine de știut',
    tip1Text:
      'Poziția lui exactă în vagin nu trebuie să fie precisă pentru ca el să fie eficient, ceea ce îl face simplu de folosit.',
    body3:
      'Inelul are mai multe aspecte practice care merită cunoscute înainte de a-l alege.',
    careTips: [
      {title: 'Simplu de folosit', text: 'Îl introduci și îl scoți singură.'},
      {title: 'Ritm regulat', text: 'Rămâne în general pe loc timp de trei săptămâni.'},
      {title: 'Acțiune continuă', text: 'Hormonii sunt eliberați continuu pe toată perioada de folosire.'},
      {title: 'Nu protejează împotriva ITS', text: 'Poate fi necesară o protecție suplimentară, în funcție de situație.'},
    ],
    checkListTitle: 'Obiceiuri bune de păstrat',
    practicalSteps: [
      'Spală-te pe mâini înainte de a-l introduce sau de a-l scoate',
      'Alege un moment ușor de ținut minte pentru a respecta programul',
      'Verifică din când în când dacă este încă la locul lui',
      'Consultă prospectul dacă se deplasează sau este expulzat',
    ],
    alertTitle: 'Atenție',
    alertText:
      'O expulzare sau o deplasare prelungită poate necesita îndrumări specifice. Verifică întotdeauna prospectul dispozitivului sau cere sfatul unui profesionist din domeniul sănătății dacă ai îndoieli.',
    summaryTitle: 'Esențialul în 4 puncte',
    summaryItems: [
      {title: 'Introducere simplă', text: 'Inelul poate fi introdus și scos de tine singură.'},
      {title: 'Ritm săptămânal', text: 'Urmează în general un ciclu de trei săptămâni cu o pauză de o săptămână.'},
      {title: 'Verificare ocazională', text: 'Verificarea regulată a faptului că este la locul lui te ajută să folosești dispozitivul cu liniște.'},
      {title: 'Nicio protecție împotriva ITS', text: 'Poate fi necesară o protecție potrivită, în funcție de situație.'},
    ],
    tip2Title: 'Ideea principală',
    tip2Text:
      'Inelul vaginal combină eliberarea continuă de hormoni cu un ritm de folosire care evită o doză zilnică. Totuși, alegerea contracepției trebuie adaptată fiecărei persoane și discutată cu un profesionist din domeniul sănătății.',
    shareMessage: 'Inelul contraceptiv vaginal — AWA',
  },
  bg: {
    badge: 'ВЛАГАЛИЩЕН ПРЪСТЕН',
    title: 'Контрацептивният\nвлагалищен пръстен',
    metaDuration: '5 мин четене',
    metaType: 'Статия',
    metaLevel: 'Начинаещ',
    metaValidated: 'Проверено съдържание',
    intro: 'Гъвкав пръстен, който се носи три седмици.',
    contentsTitle: 'В тази статия',
    topics: [
      'Как действа пръстенът',
      'Поставяне и изваждане',
      'Какво трябва да знаеш',
      'Какво да запомниш',
    ],
    body1:
      'Пръстенът е гъвкаво устройство, което непрекъснато освобождава ниски дози хормони директно във влагалището, със същото контрацептивно действие като комбинираното хапче.',
    flowTitle: 'Как действа',
    flowSteps: [
      {title: 'Пръстен', text: 'Поставя се във влагалището'},
      {title: 'Хормони', text: 'Непрекъснато освобождаване'},
      {title: 'Защита', text: 'Контрацептивно действие'},
    ],
    body2:
      'Поставяш го сама, остава непрекъснато на място три седмици, след което се изважда за едноседмична пауза, през която настъпва менструацията ти.',
    calendarTitle: 'Прост ритъм за спазване',
    weekLabelActive: 'Пръстен',
    weekLabelPause: 'Пауза',
    legendActive: 'Седмица с пръстена',
    legendPause: 'Седмица пауза',
    tip1Title: 'Добре е да знаеш',
    tip1Text:
      'Точното му положение във влагалището не е необходимо да е прецизно, за да е ефективен, което го прави прост за употреба.',
    body3:
      'Пръстенът има няколко практически точки, които си струва да знаеш, преди да го избереш.',
    careTips: [
      {title: 'Прост за употреба', text: 'Поставяш и изваждаш го сама.'},
      {title: 'Редовен ритъм', text: 'Обикновено остава на място три седмици.'},
      {title: 'Непрекъснато действие', text: 'Хормоните се освобождават непрекъснато през целия период на употреба.'},
      {title: 'Не предпазва от ППИ', text: 'Според ситуацията може да е нужна допълнителна защита.'},
    ],
    checkListTitle: 'Добри навици, които да запазиш',
    practicalSteps: [
      'Измивай ръцете си преди поставяне или изваждане',
      'Избери час, който е лесно да запомниш, за да следиш графика',
      'Проверявай от време на време дали все още е на място',
      'Провери листовката, ако се измести или изпадне',
    ],
    alertTitle: 'Обърни внимание',
    alertText:
      'Изпадане или продължително изместване може да изисква конкретни насоки. Винаги проверявай листовката на устройството или поискай съвет от здравен специалист, ако не си сигурна.',
    summaryTitle: 'Същественото в 4 точки',
    summaryItems: [
      {title: 'Просто поставяне', text: 'Пръстенът може да се поставя и изважда от самата теб.'},
      {title: 'Седмичен ритъм', text: 'Обикновено следва цикъл от три седмици с едноседмична пауза.'},
      {title: 'Периодична проверка', text: 'Редовната проверка дали е на място ти помага да използваш устройството спокойно.'},
      {title: 'Без защита от ППИ', text: 'Според ситуацията може да е нужна подходяща защита.'},
    ],
    tip2Title: 'Какво да запомниш',
    tip2Text:
      'Влагалищният пръстен съчетава непрекъснато освобождаване на хормони с ритъм на употреба, който избягва ежедневния прием. Изборът на контрацепция обаче трябва да е съобразен с всеки човек и обсъден със здравен специалист.',
    shareMessage: 'Контрацептивният влагалищен пръстен — AWA',
  },
  sr: {
    badge: 'ВАГИНАЛНИ ПРСТЕН',
    title: 'Контрацептивни\nвагинални прстен',
    metaDuration: '5 мин читања',
    metaType: 'Чланак',
    metaLevel: 'Почетник',
    metaValidated: 'Проверен садржај',
    intro: 'Флексибилан прстен који се носи три недеље.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Како прстен делује',
      'Стављање и вађење',
      'Шта треба да знаш',
      'Шта да запамтиш',
    ],
    body1:
      'Прстен је флексибилан уређај који непрекидно ослобађа ниске дозе хормона директно у вагини, са истим контрацептивним дејством као комбинована пилула.',
    flowTitle: 'Како делује',
    flowSteps: [
      {title: 'Прстен', text: 'Ставља се у вагину'},
      {title: 'Хормони', text: 'Непрекидно ослобађање'},
      {title: 'Заштита', text: 'Контрацептивно дејство'},
    ],
    body2:
      'Стављаш га сама, остаје непрекидно на месту три недеље, а затим се вади за једнонедељну паузу током које настаје твоја менструација.',
    calendarTitle: 'Једноставан ритам за праћење',
    weekLabelActive: 'Прстен',
    weekLabelPause: 'Пауза',
    legendActive: 'Недеља са прстеном',
    legendPause: 'Недеља паузе',
    tip1Title: 'Добро је знати',
    tip1Text:
      'Његов тачан положај у вагини не мора бити прецизан да би био ефикасан, што га чини једноставним за употребу.',
    body3:
      'Прстен има неколико практичних ствари које вреди знати пре него што га изабереш.',
    careTips: [
      {title: 'Једноставан за употребу', text: 'Стављаш и вадиш га сама.'},
      {title: 'Редован ритам', text: 'Обично остаје на месту три недеље.'},
      {title: 'Непрекидно дејство', text: 'Хормони се ослобађају непрекидно током целог периода употребе.'},
      {title: 'Не штити од ППИ', text: 'Зависно од ситуације може бити потребна допунска заштита.'},
    ],
    checkListTitle: 'Добре навике које треба задржати',
    practicalSteps: [
      'Опери руке пре стављања или вађења',
      'Изабери час који је лако запамтити да пратиш распоред',
      'Повремено провери да ли је и даље на месту',
      'Провери листић ако се помери или испадне',
    ],
    alertTitle: 'Обрати пажњу',
    alertText:
      'Испадање или продужено померање може захтевати посебне смернице. Увек провери листић уређаја или затражи савет од здравственог радника ако ниси сигурна.',
    summaryTitle: 'Основно у 4 тачке',
    summaryItems: [
      {title: 'Просто стављање', text: 'Прстен можеш сама да ставиш и извадиш.'},
      {title: 'Недељни ритам', text: 'Обично прати циклус од три недеље уз једнонедељну паузу.'},
      {title: 'Повремена провера', text: 'Редовна провера да ли је на месту помаже ти да уређај користиш спокојно.'},
      {title: 'Без заштите од ППИ', text: 'Зависно од ситуације може бити потребна одговарајућа заштита.'},
    ],
    tip2Title: 'Шта да запамтиш',
    tip2Text:
      'Вагинални прстен комбинује непрекидно ослобађање хормона са ритмом употребе који избегава дневну дозу. Избор контрацепције, међутим, треба да буде прилагођен свакој особи и разматран са здравственим радником.',
    shareMessage: 'Контрацептивни вагинални прстен — AWA',
  },
  hr: {
    badge: 'VAGINALNI PRSTEN',
    title: 'Kontracepcijski\nvaginalni prsten',
    metaDuration: '5 min čitanja',
    metaType: 'Članak',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Fleksibilan prsten koji se nosi tri tjedna.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Kako prsten djeluje',
      'Umetanje i vađenje',
      'Što trebaš znati',
      'Ključne poruke',
    ],
    body1:
      'Prsten je fleksibilno sredstvo koje kontinuirano otpušta niske doze hormona izravno u rodnicu, uz isto kontracepcijsko djelovanje kao kombinirana tableta.',
    flowTitle: 'Kako funkcionira',
    flowSteps: [
      {title: 'Prsten', text: 'Stavlja se u rodnicu'},
      {title: 'Hormoni', text: 'Kontinuirano otpuštanje'},
      {title: 'Zaštita', text: 'Kontracepcijsko djelovanje'},
    ],
    body2:
      'Sama ga umećeš, ostaje na mjestu kontinuirano tri tjedna, a zatim se vadi radi tjedna stanke tijekom koje nastupa menstruacija.',
    calendarTitle: 'Jednostavan ritam koji treba slijediti',
    weekLabelActive: 'Prsten',
    weekLabelPause: 'Stanka',
    legendActive: 'Tjedan s prstenom',
    legendPause: 'Tjedan stanke',
    tip1Title: 'Dobro je znati',
    tip1Text:
      'Njegov točan položaj u rodnici ne mora biti precizan da bi bio učinkovit, što ga čini jednostavnim za korištenje.',
    body3:
      'Prsten ima nekoliko praktičnih točaka koje vrijedi znati prije odabira.',
    careTips: [
      {title: 'Jednostavan za korištenje', text: 'Sama ga umećeš i vadiš.'},
      {title: 'Redovit ritam', text: 'Općenito ostaje na mjestu tri tjedna.'},
      {title: 'Kontinuirano djelovanje', text: 'Hormoni se otpuštaju kontinuirano tijekom cijelog razdoblja uporabe.'},
      {title: 'Ne štiti od SPI', text: 'Ovisno o situaciji može biti potrebna dodatna zaštita.'},
    ],
    checkListTitle: 'Dobre navike koje treba zadržati',
    practicalSteps: [
      'Operi ruke prije umetanja ili vađenja',
      'Odaberi vrijeme koje je lako zapamtiti kako bi pratila raspored',
      'Povremeno provjeri je li još na mjestu',
      'Pročitaj uputu ako se pomakne ili ispadne',
    ],
    alertTitle: 'Napomena',
    alertText:
      'Ispadanje ili dugotrajan pomak može zahtijevati posebne upute. Uvijek pročitaj uputu o proizvodu ili se obrati zdravstvenom djelatniku ako nisi sigurna.',
    summaryTitle: 'Najvažnije u 4 točke',
    summaryItems: [
      {title: 'Jednostavno umetanje', text: 'Prsten možeš sama umetnuti i izvaditi.'},
      {title: 'Tjedni ritam', text: 'Općenito slijedi ciklus od tri tjedna uz tjedan stanke.'},
      {title: 'Povremena provjera', text: 'Redovita provjera je li na mjestu pomaže ti da sredstvo koristiš mirno.'},
      {title: 'Bez zaštite od SPI', text: 'Ovisno o situaciji može biti potrebna prikladna zaštita.'},
    ],
    tip2Title: 'Ključne poruke',
    tip2Text:
      'Vaginalni prsten spaja kontinuirano otpuštanje hormona s ritmom korištenja koji izbjegava svakodnevnu dozu. Međutim, izbor kontracepcije treba prilagoditi svakoj osobi i o njemu razgovarati sa zdravstvenim djelatnikom.',
    shareMessage: 'Kontracepcijski vaginalni prsten — AWA',
  },
  bs: {
    badge: 'VAGINALNI PRSTEN',
    title: 'Kontracepcijski\nvaginalni prsten',
    metaDuration: '5 min čitanja',
    metaType: 'Članak',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Fleksibilan prsten koji se nosi tri sedmice.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Kako prsten djeluje',
      'Umetanje i vađenje',
      'Što trebaš znati',
      'Ključne poruke',
    ],
    body1:
      'Prsten je fleksibilno sredstvo koje kontinuirano otpušta niske doze hormona izravno u rodnicu, uz isto kontracepcijsko djelovanje kao kombinirana tableta.',
    flowTitle: 'Kako funkcionira',
    flowSteps: [
      {title: 'Prsten', text: 'Stavlja se u rodnicu'},
      {title: 'Hormoni', text: 'Kontinuirano otpuštanje'},
      {title: 'Zaštita', text: 'Kontracepcijsko djelovanje'},
    ],
    body2:
      'Sama ga umećeš, ostaje na mjestu kontinuirano tri sedmice, a zatim se vadi radi sedmice stanke tokom koje nastupa menstruacija.',
    calendarTitle: 'Jednostavan ritam koji treba slijediti',
    weekLabelActive: 'Prsten',
    weekLabelPause: 'Stanka',
    legendActive: 'Sedmica s prstenom',
    legendPause: 'Sedmica stanke',
    tip1Title: 'Dobro je znati',
    tip1Text:
      'Njegov točan položaj u rodnici ne mora biti precizan da bi bio učinkovit, što ga čini jednostavnim za korištenje.',
    body3:
      'Prsten ima nekoliko praktičnih točaka koje vrijedi znati prije odabira.',
    careTips: [
      {title: 'Jednostavan za korištenje', text: 'Sama ga umećeš i vadiš.'},
      {title: 'Redovit ritam', text: 'Općenito ostaje na mjestu tri sedmice.'},
      {title: 'Kontinuirano djelovanje', text: 'Hormoni se otpuštaju kontinuirano tokom cijelog razdoblja uporabe.'},
      {title: 'Ne štiti od SPI', text: 'Ovisno o situaciji može biti potrebna dodatna zaštita.'},
    ],
    checkListTitle: 'Dobre navike koje treba zadržati',
    practicalSteps: [
      'Operi ruke prije umetanja ili vađenja',
      'Odaberi vrijeme koje je lako zapamtiti kako bi pratila raspored',
      'Povremeno provjeri je li još na mjestu',
      'Pročitaj uputu ako se pomakne ili ispadne',
    ],
    alertTitle: 'Napomena',
    alertText:
      'Ispadanje ili dugotrajan pomak može zahtijevati posebne upute. Uvijek pročitaj uputu o proizvodu ili se obrati zdravstvenom radniku ako nisi sigurna.',
    summaryTitle: 'Najvažnije u 4 tačke',
    summaryItems: [
      {title: 'Jednostavno umetanje', text: 'Prsten možeš sama umetnuti i izvaditi.'},
      {title: 'Sedmični ritam', text: 'Općenito slijedi ciklus od tri sedmice uz sedmicu stanke.'},
      {title: 'Povremena provjera', text: 'Redovita provjera je li na mjestu pomaže ti da sredstvo koristiš mirno.'},
      {title: 'Bez zaštite od SPI', text: 'Ovisno o situaciji može biti potrebna prikladna zaštita.'},
    ],
    tip2Title: 'Ključne poruke',
    tip2Text:
      'Vaginalni prsten spaja kontinuirano otpuštanje hormona s ritmom korištenja koji izbjegava svakodnevnu dozu. Međutim, izbor kontracepcije treba prilagoditi svakoj osobi i o njemu razgovarati sa zdravstvenim radnikom.',
    shareMessage: 'Kontracepcijski vaginalni prsten — AWA',
  },
  sl: {
    badge: 'VAGINALNI OBROČEK',
    title: 'Kontracepcijski\nvaginalni obroček',
    metaDuration: '5 min branja',
    metaType: 'Članek',
    metaLevel: 'Začetnica',
    metaValidated: 'Preverjena vsebina',
    intro: 'Prožen obroček, ki se nosi tri tedne.',
    contentsTitle: 'V tem članku',
    topics: [
      'Kako obroček deluje',
      'Vstavljanje in odstranjevanje',
      'Kaj moraš vedeti',
      'Ključna sporočila',
    ],
    body1:
      'Obroček je prožna naprava, ki neprekinjeno sprošča nizke odmerke hormonov neposredno v nožnico, z enakim kontracepcijskim delovanjem kot kombinirana tableta.',
    flowTitle: 'Kako deluje',
    flowSteps: [
      {title: 'Obroček', text: 'Namesti se v nožnico'},
      {title: 'Hormoni', text: 'Neprekinjeno sproščanje'},
      {title: 'Zaščita', text: 'Kontracepcijsko delovanje'},
    ],
    body2:
      'Sama ga vstaviš, ostane na mestu neprekinjeno tri tedne, nato se odstrani za enotedenski odmor, med katerim nastopi menstruacija.',
    calendarTitle: 'Preprost ritem, ki mu je treba slediti',
    weekLabelActive: 'Obroček',
    weekLabelPause: 'Odmor',
    legendActive: 'Teden z obročkom',
    legendPause: 'Teden odmora',
    tip1Title: 'Vredno vedeti',
    tip1Text:
      'Njegov natančen položaj v nožnici ne mora biti precizen, da bi bil učinkovit, kar ga naredi preprostega za uporabo.',
    body3:
      'Obroček ima nekaj praktičnih točk, ki jih je vredno poznati pred izbiro.',
    careTips: [
      {title: 'Preprost za uporabo', text: 'Sama ga vstaviš in odstraniš.'},
      {title: 'Reden ritem', text: 'Na splošno ostane na mestu tri tedne.'},
      {title: 'Neprekinjeno delovanje', text: 'Hormoni se sproščajo neprekinjeno skozi celotno obdobje uporabe.'},
      {title: 'Ne ščiti pred SPO', text: 'Glede na situacijo je lahko potrebna dodatna zaščita.'},
    ],
    checkListTitle: 'Dobre navade, ki jih je treba ohraniti',
    practicalSteps: [
      'Umij si roke pred vstavljanjem ali odstranjevanjem',
      'Izberi čas, ki si ga je lahko zapomniti, da spremljaš urnik',
      'Občasno preveri, ali je še na mestu',
      'Preberi navodila, če se premakne ali izpade',
    ],
    alertTitle: 'Opomba',
    alertText:
      'Izpadanje ali dolgotrajen premik lahko zahteva posebna navodila. Vedno preberi navodila za izdelek ali se obrni na zdravstvenega delavca, če nisi prepričana.',
    summaryTitle: 'Najpomembnejše v 4 točkah',
    summaryItems: [
      {title: 'Preprosto vstavljanje', text: 'Obroček lahko sama vstaviš in odstraniš.'},
      {title: 'Tedenski ritem', text: 'Na splošno sledi tritedenskemu ciklu z enotedenskim odmorom.'},
      {title: 'Občasno preverjanje', text: 'Redno preverjanje, ali je na mestu, ti pomaga sredstvo uporabljati mirno.'},
      {title: 'Brez zaščite pred SPO', text: 'Glede na situacijo je lahko potrebna ustrezna zaščita.'},
    ],
    tip2Title: 'Ključna sporočila',
    tip2Text:
      'Vaginalni obroček združuje neprekinjeno sproščanje hormonov z ritmom uporabe, ki se izogne vsakodnevnemu odmerku. Vendar je treba izbiro kontracepcije prilagoditi vsaki osebi in o njej govoriti z zdravstvenim delavcem.',
    shareMessage: 'Kontracepcijski vaginalni obroček — AWA',
  },
  ne: {
    badge: 'योनि रिङ',
    title: 'गर्भनिरोधक\nयोनि रिङ',
    metaDuration: '5 मिनेट पढाइ',
    metaType: 'लेख',
    metaLevel: 'सुरुवाती',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'तीन हप्तासम्म लगाइने लचिलो रिङ।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'रिङले कसरी काम गर्छ',
      'राख्ने र झिक्ने',
      'तपाईंले जान्नुपर्ने कुराहरू',
      'मुख्य कुराहरू',
    ],
    body1:
      'रिङ एउटा लचिलो उपकरण हो जसले योनिमा सिधै कम मात्राका हर्मोनहरू निरन्तर निकाल्छ, संयुक्त चक्कीको जस्तै गर्भनिरोधक कार्यसहित।',
    flowTitle: 'यो कसरी काम गर्छ',
    flowSteps: [
      {title: 'रिङ', text: 'योनिमा राखिन्छ'},
      {title: 'हर्मोन', text: 'निरन्तर फैलिने'},
      {title: 'सुरक्षा', text: 'गर्भनिरोधक कार्य'},
    ],
    body2:
      'तपाईं आफैँ यसलाई राख्नुहुन्छ, यो तीन हप्तासम्म निरन्तर आफ्नो ठाउँमा रहन्छ, त्यसपछि एक हप्ताको विरामका लागि झिकिन्छ जसमा तपाईंको महिनावारी हुन्छ।',
    calendarTitle: 'पछ्याउन सरल लय',
    weekLabelActive: 'रिङ',
    weekLabelPause: 'विराम',
    legendActive: 'रिङसहितको हप्ता',
    legendPause: 'विरामको हप्ता',
    tip1Title: 'जान्न लायक',
    tip1Text:
      'यो प्रभावकारी हुन योनिमा यसको सही स्थान ठ्याक्कै हुनुपर्दैन, जसले यसलाई प्रयोग गर्न सरल बनाउँछ।',
    body3:
      'रिङका केही व्यावहारिक बुँदाहरू छान्नुअघि जान्नुपर्ने हुन्छन्।',
    careTips: [
      {title: 'प्रयोग गर्न सरल', text: 'तपाईं आफैँ यसलाई राख्नुहुन्छ र झिक्नुहुन्छ।'},
      {title: 'नियमित लय', text: 'यो सामान्यतया तीन हप्तासम्म आफ्नो ठाउँमा रहन्छ।'},
      {title: 'निरन्तर कार्य', text: 'प्रयोगको अवधिभरि हर्मोनहरू निरन्तर निस्कन्छन्।'},
      {title: 'STI बाट सुरक्षा दिँदैन', text: 'अवस्थाअनुसार थप सुरक्षा चाहिन सक्छ।'},
    ],
    checkListTitle: 'कायम राख्ने राम्रा बानीहरू',
    practicalSteps: [
      'राख्नुअघि वा झिक्नुअघि हात धुनुहोस्',
      'तालिकाको हिसाब राख्न सम्झन सजिलो समय छान्नुहोस्',
      'कहिलेकाहीँ यो अझै ठाउँमै छ कि जाँच्नुहोस्',
      'यो सर्यो वा बाहिर निस्क्यो भने पर्चा हेर्नुहोस्',
    ],
    alertTitle: 'कृपया ध्यान दिनुहोस्',
    alertText:
      'बाहिर निस्कनु वा लामो समयको सरेको अवस्थामा विशेष मार्गदर्शन चाहिन सक्छ। पक्का नभए सधैँ उपकरणको पर्चा जाँच्नुहोस् वा स्वास्थ्यकर्मीलाई सोध्नुहोस्।',
    summaryTitle: '4 बुँदामा आवश्यक कुराहरू',
    summaryItems: [
      {title: 'सरल राख्ने', text: 'रिङ आफैँ राख्न र झिक्न सकिन्छ।'},
      {title: 'साप्ताहिक लय', text: 'यसले सामान्यतया तीन हप्ताको चक्र र एक हप्ताको विराम पछ्याउँछ।'},
      {title: 'कहिलेकाहीँ जाँच', text: 'यो ठाउँमा छ कि नियमित जाँच्नाले उपकरण मनको शान्तिसँग प्रयोग गर्न मद्दत गर्छ।'},
      {title: 'STI बाट सुरक्षा छैन', text: 'अवस्थाअनुसार उपयुक्त सुरक्षा चाहिन सक्छ।'},
    ],
    tip2Title: 'मुख्य कुराहरू',
    tip2Text:
      'योनि रिङले निरन्तर हर्मोन निस्कने कुरालाई दैनिक मात्रा जोगाउने प्रयोग लयसँग जोड्छ। तथापि, गर्भनिरोधनको छनोट हरेक व्यक्तिअनुसार मिलाइनुपर्छ र स्वास्थ्यकर्मीसँग छलफल गरिनुपर्छ।',
    shareMessage: 'गर्भनिरोधक योनि रिङ — AWA',
  },
  si: {
    badge: 'යෝනි මුද්ද',
    title: 'ගර්භනිරෝධක\nයෝනි මුද්ද',
    metaDuration: 'කියවීමට මිනිත්තු 5',
    metaType: 'ලිපිය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'සති තුනක් පැළඳිය හැකි නම්‍යශීලී මුද්දක්.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'මුද්ද ක්‍රියා කරන ආකාරය',
      'ඇතුළු කිරීම සහ ඉවත් කිරීම',
      'ඔබ දැනගත යුතු දේ',
      'ප්‍රධාන කරුණු',
    ],
    body1:
      'මුද්ද යනු ඒකාබද්ධ පෙත්තට සමාන ගර්භනිරෝධන ක්‍රියාවකින් යුතුව, යෝනි මාර්ගයේම හෝමෝන අඩු මාත්‍රා අඛණ්ඩව මුදා හරින නම්‍යශීලී උපාංගයකි.',
    flowTitle: 'එය ක්‍රියා කරන ආකාරය',
    flowSteps: [
      {title: 'මුද්ද', text: 'යෝනි මාර්ගයේ තබනු ලැබේ'},
      {title: 'හෝමෝන', text: 'අඛණ්ඩ විසරණය'},
      {title: 'ආරක්ෂාව', text: 'ගර්භනිරෝධන ක්‍රියාව'},
    ],
    body2:
      'ඔබ එය ඔබම ඇතුළු කරයි, එය සති තුනක් අඛණ්ඩව ස්ථානයේ පවතී, පසුව ඔබේ ඔසප් සිදුවන සතියක විරාමයක් සඳහා එය ඉවත් කෙරේ.',
    calendarTitle: 'අනුගමනය කිරීමට සරල රිද්මයක්',
    weekLabelActive: 'මුද්ද',
    weekLabelPause: 'විරාමය',
    legendActive: 'මුද්ද සහිත සතිය',
    legendPause: 'විරාම සතිය',
    tip1Title: 'දැනගත යුතු දේ',
    tip1Text:
      'එය සඵල වීමට යෝනි මාර්ගයේ එහි නිශ්චිත ස්ථානය නිවැරදි විය යුතු නැත, එය භාවිතා කිරීමට සරල කරයි.',
    body3:
      'මුද්ද තෝරා ගැනීමට පෙර දැනගත යුතු ප්‍රායෝගික කරුණු කිහිපයක් ඇත.',
    careTips: [
      {title: 'භාවිතා කිරීමට සරලයි', text: 'ඔබ එය ඔබම ඇතුළු කර ඉවත් කරයි.'},
      {title: 'නිතිපතා රිද්මය', text: 'එය සාමාන්‍යයෙන් සති තුනක් ස්ථානයේ පවතී.'},
      {title: 'අඛණ්ඩ ක්‍රියාව', text: 'භාවිත කාලය පුරා හෝමෝන අඛණ්ඩව මුදා හරිනු ලැබේ.'},
      {title: 'STI වලින් ආරක්ෂා නොකරයි', text: 'තත්ත්වය අනුව අතිරේක ආරක්ෂාවක් අවශ්‍ය විය හැක.'},
    ],
    checkListTitle: 'තබාගත යුතු හොඳ පුරුදු',
    practicalSteps: [
      'එය ඇතුළු කිරීමට හෝ ඉවත් කිරීමට පෙර ඔබේ අත් සෝදන්න',
      'කාලසටහන නිරීක්ෂණය කිරීමට මතක තබාගැනීමට පහසු වේලාවක් තෝරන්න',
      'එය තවමත් ස්ථානයේ ඇත්දැයි ඉඳහිට පරීක්ෂා කරන්න',
      'එය ස්ථානයෙන් ඉවත් වුවහොත් හෝ පිටතට ගියහොත් පත්‍රිකාව පරීක්ෂා කරන්න',
    ],
    alertTitle: 'කරුණාකර සටහන් කරන්න',
    alertText:
      'පිටතට යාමක් හෝ දිගුකාලීන විස්ථාපනයක් විශේෂ මඟපෙන්වීමක් අවශ්‍ය විය හැක. ඔබට විශ්වාස නැත්නම් සැමවිටම උපාංගයේ පත්‍රිකාව පරීක්ෂා කරන්න හෝ සෞඛ්‍ය වෘත්තිකයෙකුගෙන් විමසන්න.',
    summaryTitle: 'කරුණු 4කින් අත්‍යවශ්‍ය දේ',
    summaryItems: [
      {title: 'සරල ඇතුළු කිරීම', text: 'මුද්ද ඔබටම ඇතුළු කර ඉවත් කළ හැක.'},
      {title: 'සතිපතා රිද්මය', text: 'එය සාමාන්‍යයෙන් සති තුනක චක්‍රයක් සහ සතියක විරාමයක් අනුගමනය කරයි.'},
      {title: 'ඉඳහිට පරීක්ෂාව', text: 'එය ස්ථානයේ ඇතැයි නිතිපතා පරීක්ෂා කිරීම, සන්සුන් සිතින් උපාංගය භාවිතා කිරීමට ඔබට උපකාරී වේ.'},
      {title: 'STI වලින් ආරක්ෂාවක් නැත', text: 'තත්ත්වය අනුව සුදුසු ආරක්ෂාවක් අවශ්‍ය විය හැක.'},
    ],
    tip2Title: 'ප්‍රධාන කරුණු',
    tip2Text:
      'යෝනි මුද්ද අඛණ්ඩ හෝමෝන මුදා හැරීම දෛනික මාත්‍රාවක් වළක්වන භාවිත රිද්මයක් සමඟ ඒකාබද්ධ කරයි. කෙසේ වෙතත්, ගර්භනිරෝධනයේ තේරීම සෑම පුද්ගලයෙකුටම සකස් කර සෞඛ්‍ය වෘත්තිකයෙකු සමඟ සාකච්ඡා කළ යුතුයි.',
    shareMessage: 'ගර්භනිරෝධක යෝනි මුද්ද — AWA',
  },
  th: {
    badge: 'ห่วงคุมกำเนิดทางช่องคลอด',
    title: 'ห่วงคุมกำเนิด\nทางช่องคลอด',
    metaDuration: 'อ่าน 5 นาที',
    metaType: 'บทความ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'ห่วงยืดหยุ่นที่ใส่ไว้สามสัปดาห์',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'ห่วงทำงานอย่างไร',
      'การใส่และการเอาออก',
      'สิ่งที่คุณต้องรู้',
      'ประเด็นสำคัญ',
    ],
    body1:
      'ห่วงคืออุปกรณ์ยืดหยุ่นที่ปล่อยฮอร์โมนขนาดต่ำอย่างต่อเนื่องโดยตรงในช่องคลอด ออกฤทธิ์คุมกำเนิดเช่นเดียวกับยาเม็ดแบบฮอร์โมนรวม',
    flowTitle: 'ทำงานอย่างไร',
    flowSteps: [
      {title: 'ห่วง', text: 'ใส่ในช่องคลอด'},
      {title: 'ฮอร์โมน', text: 'ปล่อยอย่างต่อเนื่อง'},
      {title: 'การป้องกัน', text: 'ออกฤทธิ์คุมกำเนิด'},
    ],
    body2:
      'คุณใส่เอง ห่วงอยู่ในตำแหน่งต่อเนื่องสามสัปดาห์ แล้วเอาออกเพื่อพักหนึ่งสัปดาห์ ซึ่งเป็นช่วงที่ประจำเดือนมา',
    calendarTitle: 'จังหวะง่าย ๆ ที่ติดตามได้',
    weekLabelActive: 'ห่วง',
    weekLabelPause: 'พัก',
    legendActive: 'สัปดาห์ที่ใส่ห่วง',
    legendPause: 'สัปดาห์พัก',
    tip1Title: 'ควรรู้',
    tip1Text:
      'ตำแหน่งที่แน่นอนในช่องคลอดไม่จำเป็นต้องแม่นยำเพื่อให้ได้ผล ทำให้ใช้งานง่าย',
    body3:
      'ห่วงมีประเด็นเชิงปฏิบัติหลายอย่างที่ควรรู้ก่อนเลือกใช้',
    careTips: [
      {title: 'ใช้งานง่าย', text: 'คุณใส่และเอาออกเอง'},
      {title: 'จังหวะสม่ำเสมอ', text: 'โดยทั่วไปอยู่ในตำแหน่งสามสัปดาห์'},
      {title: 'ออกฤทธิ์ต่อเนื่อง', text: 'ปล่อยฮอร์โมนอย่างต่อเนื่องตลอดช่วงเวลาที่ใช้'},
      {title: 'ไม่ป้องกันโรคติดต่อทางเพศสัมพันธ์', text: 'อาจต้องมีการป้องกันเพิ่มเติมตามสถานการณ์'},
    ],
    checkListTitle: 'นิสัยที่ดีที่ควรรักษาไว้',
    practicalSteps: [
      'ล้างมือก่อนใส่หรือเอาออก',
      'เลือกเวลาที่จำง่ายเพื่อติดตามตารางเวลา',
      'ตรวจเป็นครั้งคราวว่ายังอยู่ในตำแหน่ง',
      'ตรวจเอกสารกำกับหากห่วงเลื่อนหรือหลุดออก',
    ],
    alertTitle: 'โปรดทราบ',
    alertText:
      'การหลุดออกหรือเลื่อนนานอาจต้องการคำแนะนำเฉพาะ ตรวจเอกสารกำกับของอุปกรณ์เสมอหรือถามบุคลากรทางการแพทย์หากคุณไม่แน่ใจ',
    summaryTitle: 'สาระสำคัญใน 4 ข้อ',
    summaryItems: [
      {title: 'ใส่ง่าย', text: 'ใส่และเอาห่วงออกได้ด้วยตัวเอง'},
      {title: 'จังหวะรายสัปดาห์', text: 'โดยทั่วไปเป็นรอบสามสัปดาห์และพักหนึ่งสัปดาห์'},
      {title: 'ตรวจเป็นครั้งคราว', text: 'การตรวจเป็นประจำว่าอยู่ในตำแหน่งช่วยให้ใช้อุปกรณ์ได้อย่างสบายใจ'},
      {title: 'ไม่ป้องกันโรคติดต่อทางเพศสัมพันธ์', text: 'อาจต้องมีการป้องกันที่เหมาะสมตามสถานการณ์'},
    ],
    tip2Title: 'ประเด็นสำคัญ',
    tip2Text:
      'ห่วงคุมกำเนิดทางช่องคลอดผสานการปล่อยฮอร์โมนอย่างต่อเนื่องเข้ากับจังหวะการใช้ที่ไม่ต้องทานยาทุกวัน อย่างไรก็ตาม การเลือกวิธีคุมกำเนิดควรปรับให้เหมาะกับแต่ละคนและพูดคุยกับบุคลากรทางการแพทย์',
    shareMessage: 'ห่วงคุมกำเนิดทางช่องคลอด — AWA',
  },
  vi: {
    badge: 'VÒNG TRÁNH THAI ÂM ĐẠO',
    title: 'Vòng tránh thai\nâm đạo',
    metaDuration: '5 phút đọc',
    metaType: 'Bài viết',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Một chiếc vòng mềm dẻo, đeo trong ba tuần.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Vòng hoạt động như thế nào',
      'Đặt vào và tháo ra',
      'Những điều bạn cần biết',
      'Những điểm chính cần nhớ',
    ],
    body1:
      'Vòng là một dụng cụ mềm dẻo giải phóng liên tục liều thấp hormone trực tiếp trong âm đạo, với tác dụng tránh thai giống thuốc tránh thai kết hợp.',
    flowTitle: 'Cách nó hoạt động',
    flowSteps: [
      {title: 'Vòng', text: 'Được đặt trong âm đạo'},
      {title: 'Hormone', text: 'Khuếch tán liên tục'},
      {title: 'Bảo vệ', text: 'Tác dụng tránh thai'},
    ],
    body2:
      'Bạn tự đặt vào, nó nằm yên liên tục trong ba tuần, rồi được tháo ra để nghỉ một tuần, trong thời gian đó kỳ kinh xảy ra.',
    calendarTitle: 'Một nhịp điệu đơn giản để theo dõi',
    weekLabelActive: 'Vòng',
    weekLabelPause: 'Nghỉ',
    legendActive: 'Tuần đeo vòng',
    legendPause: 'Tuần nghỉ',
    tip1Title: 'Nên biết',
    tip1Text:
      'Vị trí chính xác của nó trong âm đạo không cần phải chính xác tuyệt đối để vòng có hiệu quả, điều này khiến việc sử dụng đơn giản.',
    body3:
      'Vòng có một số điểm thực tế đáng biết trước khi lựa chọn.',
    careTips: [
      {title: 'Dễ sử dụng', text: 'Bạn tự đặt vào và tháo ra.'},
      {title: 'Nhịp điệu đều đặn', text: 'Nó thường nằm yên trong ba tuần.'},
      {title: 'Tác dụng liên tục', text: 'Hormone được giải phóng liên tục trong suốt thời gian sử dụng.'},
      {title: 'Không bảo vệ khỏi STI', text: 'Có thể cần thêm biện pháp bảo vệ tùy theo tình huống.'},
    ],
    checkListTitle: 'Những thói quen tốt nên giữ',
    practicalSteps: [
      'Rửa tay trước khi đặt vào hoặc tháo ra',
      'Chọn một giờ dễ nhớ để theo dõi lịch trình',
      'Thỉnh thoảng kiểm tra xem vòng còn ở đúng vị trí không',
      'Xem tờ hướng dẫn nếu vòng bị lệch hoặc bị đẩy ra',
    ],
    alertTitle: 'Xin lưu ý',
    alertText:
      'Việc vòng bị đẩy ra hoặc lệch vị trí kéo dài có thể cần hướng dẫn cụ thể. Hãy luôn xem tờ hướng dẫn của dụng cụ hoặc hỏi nhân viên y tế nếu bạn không chắc chắn.',
    summaryTitle: 'Điều thiết yếu trong 4 điểm',
    summaryItems: [
      {title: 'Đặt vào đơn giản', text: 'Bạn có thể tự đặt vào và tháo vòng ra.'},
      {title: 'Nhịp điệu hằng tuần', text: 'Nó thường theo chu kỳ ba tuần với một tuần nghỉ.'},
      {title: 'Kiểm tra thỉnh thoảng', text: 'Thường xuyên kiểm tra vòng còn ở đúng vị trí giúp bạn dùng dụng cụ yên tâm.'},
      {title: 'Không bảo vệ khỏi STI', text: 'Có thể cần biện pháp bảo vệ phù hợp tùy theo tình huống.'},
    ],
    tip2Title: 'Những điểm chính cần nhớ',
    tip2Text:
      'Vòng tránh thai âm đạo kết hợp việc giải phóng hormone liên tục với một nhịp độ sử dụng tránh được việc dùng thuốc mỗi ngày. Tuy nhiên, việc chọn biện pháp tránh thai nên phù hợp với từng người và được trao đổi với nhân viên y tế.',
    shareMessage: 'Vòng tránh thai âm đạo — AWA',
  },
  uz: {
    badge: 'QIN HALQASI',
    title: 'Kontratseptiv\nqin halqasi',
    metaDuration: '5 daq oʻqish',
    metaType: 'Maqola',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Uch hafta taqiladigan elastik halqa.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Halqa qanday ishlaydi',
      'Kiritish va olish',
      'Nimalarni bilish kerak',
      'Asosiy xulosalar',
    ],
    body1:
      'Halqa — kam dozali gormonlarni toʻgʻridan-toʻgʻri qinda uzluksiz chiqaradigan elastik vosita, kombinatsiyalangan tabletka bilan bir xil kontratseptiv taʼsirga ega.',
    flowTitle: 'U qanday ishlaydi',
    flowSteps: [
      {title: 'Halqa', text: 'Qinga joylashtiriladi'},
      {title: 'Gormonlar', text: 'Uzluksiz tarqalish'},
      {title: 'Himoya', text: 'Kontratseptiv taʼsir'},
    ],
    body2:
      'Uni oʻzingiz kiritasiz, u uch hafta davomida uzluksiz joyida turadi, keyin bir haftalik tanaffus uchun olinadi va shu paytda hayz sodir boʻladi.',
    calendarTitle: 'Rioya qilish oson ritm',
    weekLabelActive: 'Halqa',
    weekLabelPause: 'Tanaffus',
    legendActive: 'Halqa bilan hafta',
    legendPause: 'Tanaffus haftasi',
    tip1Title: 'Bilish foydali',
    tip1Text:
      'Uning qindagi aniq joylashuvi samarali boʻlishi uchun aniq boʻlishi shart emas, bu uni ishlatishni oddiy qiladi.',
    body3:
      'Tanlashdan oldin halqaning bilish kerak boʻlgan bir nechta amaliy jihati bor.',
    careTips: [
      {title: 'Ishlatish oson', text: 'Uni oʻzingiz kiritasiz va olasiz.'},
      {title: 'Muntazam ritm', text: 'U odatda uch hafta joyida turadi.'},
      {title: 'Uzluksiz taʼsir', text: 'Gormonlar foydalanish davri davomida uzluksiz chiqadi.'},
      {title: 'JYYI dan himoya qilmaydi', text: 'Vaziyatga qarab qoʻshimcha himoya kerak boʻlishi mumkin.'},
    ],
    checkListTitle: 'Saqlash kerak boʻlgan yaxshi odatlar',
    practicalSteps: [
      'Kiritish yoki olishdan oldin qoʻllaringizni yuving',
      'Jadvalni kuzatish uchun eslab qolish oson vaqtni tanlang',
      'Vaqti-vaqti bilan hali joyida ekanini tekshiring',
      'Agar siljisa yoki tushib ketsa, qoʻllanma varaqasini tekshiring',
    ],
    alertTitle: 'Eʼtibor bering',
    alertText:
      'Halqaning tushib ketishi yoki uzoq muddat siljishi alohida yoʻl-yoʻriqni talab qilishi mumkin. Shubha boʻlsa, doim vositaning qoʻllanma varaqasini tekshiring yoki sogʻliqni saqlash mutaxassisidan soʻrang.',
    summaryTitle: '4 nuqtada asosiy jihatlar',
    summaryItems: [
      {title: 'Oddiy kiritish', text: 'Halqani oʻzingiz kiritishingiz va olishingiz mumkin.'},
      {title: 'Haftalik ritm', text: 'U odatda uch haftalik sikl va bir haftalik tanaffusga amal qiladi.'},
      {title: 'Vaqti-vaqti bilan tekshirish', text: 'Joyida ekanini muntazam tekshirish vositadan xotirjam foydalanishga yordam beradi.'},
      {title: 'JYYI dan himoya yoʻq', text: 'Vaziyatga qarab mos himoya kerak boʻlishi mumkin.'},
    ],
    tip2Title: 'Asosiy xulosalar',
    tip2Text:
      'Qin halqasi gormonlarning uzluksiz chiqishini kundalik dozadan qochadigan foydalanish ritmi bilan birlashtiradi. Biroq kontratseptsiyani tanlash har bir odamga moslashtirilishi va sogʻliqni saqlash mutaxassisi bilan muhokama qilinishi kerak.',
    shareMessage: 'Kontratseptiv qin halqasi — AWA',
  },
  az: {
    badge: 'VAGİNAL HALQA',
    title: 'Kontraseptiv\nvaginal halqa',
    metaDuration: '5 dəq oxu',
    metaType: 'Məqalə',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Üç həftə taxılan elastik halqa.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Halqa necə işləyir',
      'Yerləşdirmə və çıxarma',
      'Bilməli olduqlarınız',
      'Əsas nəticələr',
    ],
    body1:
      'Halqa vaginanın daxilində birbaşa aşağı dozada hormonları fasiləsiz buraxan elastik qurğudur və kombinə edilmiş hapla eyni kontraseptiv təsirə malikdir.',
    flowTitle: 'O necə işləyir',
    flowSteps: [
      {title: 'Halqa', text: 'Vaginaya yerləşdirilir'},
      {title: 'Hormonlar', text: 'Fasiləsiz yayılma'},
      {title: 'Qoruma', text: 'Kontraseptiv təsir'},
    ],
    body2:
      'Onu özünüz yerləşdirirsiniz, üç həftə fasiləsiz yerində qalır, sonra çıxarılır və bir həftəlik fasilə verilir, bu zaman aybaşınız başlayır.',
    calendarTitle: 'İzləmək üçün sadə ritm',
    weekLabelActive: 'Halqa',
    weekLabelPause: 'Fasilə',
    legendActive: 'Halqalı həftə',
    legendPause: 'Fasilə həftəsi',
    tip1Title: 'Bilmək faydalıdır',
    tip1Text:
      'Təsirli olması üçün vaginadakı dəqiq mövqeyinin dəqiq olması lazım deyil ki, bu da istifadəni sadə edir.',
    body3:
      'Halqanın seçməzdən əvvəl bilməyə dəyər bir neçə praktik məqamı var.',
    careTips: [
      {title: 'İstifadəsi sadədir', text: 'Onu özünüz yerləşdirir və çıxarırsınız.'},
      {title: 'Müntəzəm ritm', text: 'O, adətən üç həftə yerində qalır.'},
      {title: 'Fasiləsiz təsir', text: 'Hormonlar istifadə dövrü boyu fasiləsiz buraxılır.'},
      {title: 'CYÖİ-dən qorumur', text: 'Vəziyyətdən asılı olaraq əlavə qoruma lazım ola bilər.'},
    ],
    checkListTitle: 'Saxlamaq üçün yaxşı vərdişlər',
    practicalSteps: [
      'Yerləşdirməzdən və ya çıxarmazdan əvvəl əllərinizi yuyun',
      'Cədvəli izləmək üçün yadda saxlamaq asan olan vaxt seçin',
      'Hələ də yerində olduğunu arabir yoxlayın',
      'Yerini dəyişərsə və ya çıxarsa, təlimata baxın',
    ],
    alertTitle: 'Nəzərə alın',
    alertText:
      'Halqanın çıxması və ya uzun müddət yerini dəyişməsi xüsusi istiqamətləndirmə tələb edə bilər. Əmin deyilsinizsə, həmişə qurğunun təlimatına baxın və ya tibb işçisindən soruşun.',
    summaryTitle: '4 məqamda əsas məsələ',
    summaryItems: [
      {title: 'Sadə yerləşdirmə', text: 'Halqanı özünüz yerləşdirə və çıxara bilərsiniz.'},
      {title: 'Həftəlik ritm', text: 'O, adətən üç həftəlik dövrdən və bir həftəlik fasilədən ibarətdir.'},
      {title: 'Arabir yoxlama', text: 'Yerində olduğunu müntəzəm yoxlamaq qurğudan arxayın istifadə etməyə kömək edir.'},
      {title: 'CYÖİ-dən qorunma yoxdur', text: 'Vəziyyətdən asılı olaraq uyğun qoruma lazım ola bilər.'},
    ],
    tip2Title: 'Əsas nəticələr',
    tip2Text:
      'Vaginal halqa hormonların fasiləsiz buraxılmasını gündəlik doza tələb etməyən istifadə ritmi ilə birləşdirir. Bununla belə, kontrasepsiya seçimi hər şəxsə uyğunlaşdırılmalı və tibb işçisi ilə müzakirə edilməlidir.',
    shareMessage: 'Kontraseptiv vaginal halqa — AWA',
  },
  ka: {
    badge: 'ვაგინალური რგოლი',
    title: 'კონტრაცეპტიული\nვაგინალური რგოლი',
    metaDuration: '5 წთ საკითხავი',
    metaType: 'სტატია',
    metaLevel: 'დამწყები',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'მოქნილი რგოლი, რომელიც სამი კვირის განმავლობაში ტარდება.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'როგორ მუშაობს რგოლი',
      'ჩადგმა და ამოღება',
      'რა უნდა იცოდეთ',
      'მთავარი დასკვნები',
    ],
    body1:
      'რგოლი მოქნილი მოწყობილობაა, რომელიც უწყვეტად გამოყოფს ჰორმონების დაბალ დოზებს პირდაპირ ვაგინაში, კომბინირებული აბის იდენტური კონტრაცეპტიული მოქმედებით.',
    flowTitle: 'როგორ მუშაობს',
    flowSteps: [
      {title: 'რგოლი', text: 'ვაგინაში თავსდება'},
      {title: 'ჰორმონები', text: 'უწყვეტი გავრცელება'},
      {title: 'დაცვა', text: 'კონტრაცეპტიული მოქმედება'},
    ],
    body2:
      'მას თავად სვამთ, ის სამი კვირის განმავლობაში უწყვეტად რჩება თავის ადგილას, შემდეგ კი იხსნება ერთკვირიანი შესვენებისთვის, რომლის დროსაც მენსტრუაცია მოდის.',
    calendarTitle: 'მარტივი რიტმი, რომელსაც უნდა მიჰყვეთ',
    weekLabelActive: 'რგოლი',
    weekLabelPause: 'შესვენება',
    legendActive: 'კვირა რგოლით',
    legendPause: 'შესვენების კვირა',
    tip1Title: 'კარგია ვიცოდეთ',
    tip1Text:
      'ვაგინაში მისი ზუსტი მდებარეობა ზუსტი არ უნდა იყოს ეფექტიანობისთვის, რაც მის გამოყენებას ამარტივებს.',
    body3:
      'რგოლს აქვს რამდენიმე პრაქტიკული საკითხი, რომლებიც არჩევამდე უნდა იცოდეთ.',
    careTips: [
      {title: 'მარტივია გამოსაყენებლად', text: 'თავად სვამთ და იღებთ.'},
      {title: 'რეგულარული რიტმი', text: 'ის ზოგადად სამი კვირის განმავლობაში რჩება თავის ადგილას.'},
      {title: 'უწყვეტი მოქმედება', text: 'ჰორმონები უწყვეტად გამოიყოფა გამოყენების მთელი პერიოდის განმავლობაში.'},
      {title: 'არ იცავს სგგი-სგან', text: 'სიტუაციის მიხედვით შეიძლება დამატებითი დაცვა იყოს საჭირო.'},
    ],
    checkListTitle: 'კარგი ჩვევები, რომლებიც უნდა შეინარჩუნოთ',
    practicalSteps: [
      'ჩადგმამდე ან ამოღებამდე დაიბანეთ ხელები',
      'აირჩიეთ დრო, რომელიც ადვილად დასამახსოვრებელია, განრიგის დასაცავად',
      'დროდადრო შეამოწმეთ, რომ ის კვლავ თავის ადგილას არის',
      'თუ ის გადაადგილდა ან გამოვარდა, გადაამოწმეთ ინსტრუქცია',
    ],
    alertTitle: 'გაითვალისწინეთ',
    alertText:
      'გამოვარდნას ან ხანგრძლივ გადაადგილებას შეიძლება კონკრეტული მითითება დასჭირდეს. ყოველთვის გადაამოწმეთ მოწყობილობის ინსტრუქცია ან ჰკითხეთ ჯანდაცვის სპეციალისტს, თუ დარწმუნებული არ ხართ.',
    summaryTitle: 'მთავარი 4 პუნქტში',
    summaryItems: [
      {title: 'მარტივი ჩადგმა', text: 'რგოლის ჩადგმა და ამოღება თავადაც შეგიძლიათ.'},
      {title: 'ყოველკვირეული რიტმი', text: 'ის ზოგადად სამკვირიან ციკლს მისდევს ერთკვირიანი შესვენებით.'},
      {title: 'ხანდახან შემოწმება', text: 'რეგულარულად შემოწმება, რომ ის თავის ადგილას არის, მოწყობილობის სიმშვიდით გამოყენებაში გეხმარებათ.'},
      {title: 'სგგი-სგან დაცვის გარეშე', text: 'სიტუაციის მიხედვით შეიძლება შესაფერისი დაცვა იყოს საჭირო.'},
    ],
    tip2Title: 'მთავარი დასკვნები',
    tip2Text:
      'ვაგინალური რგოლი აერთიანებს ჰორმონების უწყვეტ გამოყოფას გამოყენების რიტმთან, რომელიც ყოველდღიურ დოზას გარიდებთ. თუმცა კონტრაცეფციის არჩევანი თითოეულ ადამიანს უნდა მოერგოს და ჯანდაცვის სპეციალისტთან განიხილოს.',
    shareMessage: 'კონტრაცეპტიული ვაგინალური რგოლი — AWA',
  },
  hy: {
    badge: 'ՀԵՇՏՈՑԱՅԻՆ ՕՂԱԿ',
    title: 'Հակաբեղմնավորիչ\nհեշտոցային օղակը',
    metaDuration: '5 ր կարդալու համար',
    metaType: 'Հոդված',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Ճկուն օղակ, որը կրվում է երեք շաբաթ:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Ինչպես է աշխատում օղակը',
      'Տեղադրում և հեռացում',
      'Ինչ պետք է իմանալ',
      'Հիմնական եզրակացություններ',
    ],
    body1:
      'Օղակը ճկուն սարք է, որն անընդհատ ազատում է հորմոնների ցածր դեղաչափեր անմիջապես հեշտոցում՝ համակցված հաբի հետ նույն հակաբեղմնավորիչ գործողությամբ:',
    flowTitle: 'Ինչպես է այն աշխատում',
    flowSteps: [
      {title: 'Օղակ', text: 'Տեղադրվում է հեշտոցում'},
      {title: 'Հորմոններ', text: 'Անընդհատ տարածում'},
      {title: 'Պաշտպանություն', text: 'Հակաբեղմնավորիչ գործողություն'},
    ],
    body2:
      'Այն տեղադրում եք ինքներդ, այն անընդհատ մնում է տեղում երեք շաբաթ, ապա հեռացվում է մեկ շաբաթ դադարով, որի ընթացքում տեղի է ունենում դաշտանը:',
    calendarTitle: 'Պարզ ռիթմ, որին պետք է հետևել',
    weekLabelActive: 'Օղակ',
    weekLabelPause: 'Դադար',
    legendActive: 'Շաբաթ օղակով',
    legendPause: 'Դադարի շաբաթ',
    tip1Title: 'Լավ է իմանալ',
    tip1Text:
      'Հեշտոցում դրա ճշգրիտ դիրքը պարտադիր չէ ճշգրիտ լինել՝ արդյունավետ լինելու համար, ինչը այն դարձնում է պարզ օգտագործման համար:',
    body3:
      'Օղակն ունի մի քանի գործնական կետ, որոնք արժե իմանալ ընտրելուց առաջ:',
    careTips: [
      {title: 'Պարզ օգտագործում', text: 'Դուք ինքներդ եք տեղադրում և հեռացնում այն:'},
      {title: 'Կանոնավոր ռիթմ', text: 'Այն սովորաբար մնում է տեղում երեք շաբաթ:'},
      {title: 'Անընդհատ գործողություն', text: 'Հորմոնները ազատվում են անընդհատ օգտագործման ողջ ժամանակահատվածում:'},
      {title: 'Չի պաշտպանում ՍՃՓՎ-ներից', text: 'Իրավիճակից կախված՝ կարող է անհրաժեշտ լինել լրացուցիչ պաշտպանություն:'},
    ],
    checkListTitle: 'Լավ սովորություններ, որոնք պետք է պահպանել',
    practicalSteps: [
      'Լվացեք ձեռքերը՝ տեղադրելուց կամ հեռացնելուց առաջ',
      'Ընտրեք հեշտ հիշվող ժամ՝ ժամանակացույցին հետևելու համար',
      'Երբեմն ստուգեք, որ այն դեռ տեղում է',
      'Ստուգեք հրահանգը, եթե այն տեղաշարժվում է կամ դուրս է մղվում',
    ],
    alertTitle: 'Խնդրում ենք ուշադրություն դարձնել',
    alertText:
      'Դուրս մղումը կամ երկարատև տեղաշարժը կարող է պահանջել հատուկ ուղղորդում: Միշտ ստուգեք սարքի հրահանգը կամ խորհուրդ հարցրեք առողջապահության մասնագետից, եթե վստահ չեք:',
    summaryTitle: 'Էականը 4 կետով',
    summaryItems: [
      {title: 'Պարզ տեղադրում', text: 'Օղակը կարելի է ինքնուրույն տեղադրել և հեռացնել:'},
      {title: 'Շաբաթական ռիթմ', text: 'Այն սովորաբար հետևում է երեք շաբաթվա ցիկլի՝ մեկ շաբաթ դադարով:'},
      {title: 'Պարբերական ստուգում', text: 'Կանոնավոր ստուգելը, որ այն տեղում է, օգնում է օգտագործել սարքը հանգիստ սրտով:'},
      {title: 'Պաշտպանություն ՍՃՓՎ-ներից չկա', text: 'Իրավիճակից կախված՝ կարող է անհրաժեշտ լինել համապատասխան պաշտպանություն:'},
    ],
    tip2Title: 'Հիմնական եզրակացություններ',
    tip2Text:
      'Հեշտոցային օղակը համադրում է հորմոնների անընդհատ ազատումը օգտագործման ռիթմի հետ, որը խուսափում է օրական դեղաչափից: Այդուհանդերձ, հակաբեղմնավորման ընտրությունը պետք է հարմարեցվի յուրաքանչյուր անձի և քննարկվի առողջապահության մասնագետի հետ:',
    shareMessage: 'Հակաբեղմնավորիչ հեշտոցային օղակը — AWA',
  },
  tg: {
    badge: 'ҲАЛҚАИ МАҲБАЛӢ',
    title: 'Ҳалқаи маҳбалии\nпешгирӣ аз ҳомиладорӣ',
    metaDuration: '5 дақ барои хондан',
    metaType: 'Мақола',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Ҳалқаи чандир, ки се ҳафта пӯшида мешавад.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Ҳалқа чӣ тавр кор мекунад',
      'Гузоштан ва баровардан',
      'Он чи бояд донист',
      'Хулосаҳои асосӣ',
    ],
    body1:
      'Ҳалқа дастгоҳи чандирест, ки дозаҳои паст гормонҳоро пайваста бевосита дар маҳбал озод мекунад, бо ҳамон таъсири пешгирикунанда мисли ҳаби омехта.',
    flowTitle: 'Чӣ тавр кор мекунад',
    flowSteps: [
      {title: 'Ҳалқа', text: 'Дар маҳбал гузошта мешавад'},
      {title: 'Гормонҳо', text: 'Паҳншавии доимӣ'},
      {title: 'Муҳофизат', text: 'Таъсири пешгирикунанда'},
    ],
    body2:
      'Шумо онро худатон мегузоред, он се ҳафта пайваста дар ҷояш мемонад, сипас барои танаффуси як ҳафта, ки дар он ҳайз рух медиҳад, баровардан мешавад.',
    calendarTitle: 'Суръати оддие, ки бояд пайравӣ кард',
    weekLabelActive: 'Ҳалқа',
    weekLabelPause: 'Танаффус',
    legendActive: 'Ҳафта бо ҳалқа',
    legendPause: 'Ҳафтаи танаффус',
    tip1Title: 'Донистан хуб аст',
    tip1Text:
      'Барои самаранок будан мавқеи дақиқи он дар маҳбал лозим нест, ки истифодаро осон мекунад.',
    body3:
      'Ҳалқа якчанд нуқтаи амалӣ дорад, ки пеш аз интихоби он донистан сазовор аст.',
    careTips: [
      {title: 'Истифодаи осон', text: 'Шумо онро худатон мегузоред ва мебароред.'},
      {title: 'Суръати мунтазам', text: 'Он одатан се ҳафта дар ҷояш мемонад.'},
      {title: 'Таъсири доимӣ', text: 'Гормонҳо дар тамоми давраи истифода пайваста озод мешаванд.'},
      {title: 'Аз СРҶ муҳофизат намекунад', text: 'Вобаста ба вазъият муҳофизати иловагӣ метавонад лозим шавад.'},
    ],
    checkListTitle: 'Одатҳои нек барои нигоҳ доштан',
    practicalSteps: [
      'Пеш аз гузоштан ё баровардан дастҳои худро бишӯед',
      'Вақтеро интихоб кунед, ки ба ёд мондан осон аст, то ҷадвалро пайгирӣ кунед',
      'Гоҳ-гоҳ санҷед, ки он ҳанӯз дар ҷояш аст',
      'Агар аз ҷой ҷунбид ё берун афтод, дастурамалро санҷед',
    ],
    alertTitle: 'Таваҷҷӯҳ кунед',
    alertText:
      'Берун афтодан ё ҷойивазкунии дарозмуддат метавонад роҳнамоии махсусро талаб кунад. Ҳамеша дастурамали дастгоҳро санҷед ё агар мутмаин набошед, аз мутахассиси соҳаи тиб пурсед.',
    summaryTitle: 'Муҳимтарин чизҳо дар 4 нукта',
    summaryItems: [
      {title: 'Гузоштани осон', text: 'Ҳалқаро худатон гузоштан ва баровардан мумкин аст.'},
      {title: 'Суръати ҳафтагӣ', text: 'Он одатан давраи се ҳафтаро бо танаффуси як ҳафта пайравӣ мекунад.'},
      {title: 'Санҷиши гоҳ-гоҳ', text: 'Мунтазам санҷидани ҷойгиршавии он ба шумо кумак мекунад дастгоҳро бо оромии хотир истифода баред.'},
      {title: 'Аз СРҶ муҳофизат нест', text: 'Вобаста ба вазъият муҳофизати мувофиқ метавонад лозим шавад.'},
    ],
    tip2Title: 'Хулосаҳои асосӣ',
    tip2Text:
      'Ҳалқаи маҳбалӣ озодшавии доимии гормонро бо суръати истифодае, ки қабули рӯзонаро пешгирӣ мекунад, омезиш медиҳад. Бо вуҷуди ин, интихоби пешгирӣ бояд ба ҳар шахс мутобиқ карда шавад ва бо мутахассиси соҳаи тиб муҳокима гардад.',
    shareMessage: 'Ҳалқаи маҳбалии пешгирӣ аз ҳомиладорӣ — AWA',
  },
  ky: {
    badge: 'КЫНАП ШАКЕКЧЕСИ',
    title: 'Контрацептивдик\nкынап шакекчеси',
    metaDuration: '5 мүн окуу',
    metaType: 'Макала',
    metaLevel: 'Баштоочу',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Үч жума тагылуучу ийкемдүү шакекче.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Шакекче кантип иштейт',
      'Киргизүү жана алуу',
      'Эмнени билүү керек',
      'Негизги жыйынтыктар',
    ],
    body1:
      'Шакекче — гормондордун аз дозаларын түздөн-түз кынапта үзгүлтүксүз бөлүп чыгарган ийкемдүү шайман, айкалышкан таблетка менен бирдей контрацептивдик таасири бар.',
    flowTitle: 'Ал кантип иштейт',
    flowSteps: [
      {title: 'Шакекче', text: 'Кынапка коюлат'},
      {title: 'Гормондор', text: 'Үзгүлтүксүз таркоо'},
      {title: 'Коргоо', text: 'Контрацептивдик таасир'},
    ],
    body2:
      'Аны өзүңүз киргизесиз, ал үч жума бою үзгүлтүксүз ордунда турат, андан кийин алынып, бир жумалык тыныгуу болот, ал учурда етек кирим болот.',
    calendarTitle: 'Ээрчүүгө жөнөкөй ритм',
    weekLabelActive: 'Шакекче',
    weekLabelPause: 'Тыныгуу',
    legendActive: 'Шакекчелүү жума',
    legendPause: 'Тыныгуу жумасы',
    tip1Title: 'Билүү пайдалуу',
    tip1Text:
      'Анын кынаптагы так абалы натыйжалуу болуш үчүн так болушу шарт эмес, бул аны колдонууну жөнөкөй кылат.',
    body3:
      'Шакекченин аны тандоодон мурун билүүгө татыктуу бир нече практикалык учуру бар.',
    careTips: [
      {title: 'Колдонууга жөнөкөй', text: 'Аны өзүңүз киргизип, аласыз.'},
      {title: 'Үзгүлтүксүз ритм', text: 'Ал адатта үч жума бою ордунда турат.'},
      {title: 'Үзгүлтүксүз таасир', text: 'Гормондор колдонуу мезгили бою үзгүлтүксүз бөлүнүп чыгат.'},
      {title: 'ЖЖБИден коргобойт', text: 'Абалга жараша кошумча коргонуу керек болушу мүмкүн.'},
    ],
    checkListTitle: 'Сактоого жакшы адаттар',
    practicalSteps: [
      'Киргизүүдөн же алуудан мурун колдорду жууңуз',
      'Графикти көзөмөлдөө үчүн эсте калуу оңой убакытты тандаңыз',
      'Анда-санда дагы эле ордунда экенин текшериңиз',
      'Ордунан жылып кетсе же түшүп калса, көрсөтмөнү караңыз',
    ],
    alertTitle: 'Көңүл буруңуз',
    alertText:
      'Түшүп калуу же узак убакыт ордунан жылуу өзгөчө жетекчиликти талап кылышы мүмкүн. Ишенбесеңиз, шаймандын көрсөтмөсүн текшериңиз же ден соолук сактоо адисинен сураңыз.',
    summaryTitle: '4 пунктта эң негизгиси',
    summaryItems: [
      {title: 'Жөнөкөй киргизүү', text: 'Шакекчени өзүңүз киргизип, ала аласыз.'},
      {title: 'Жумалык ритм', text: 'Ал адатта үч жумалык цикл менен бир жумалык тыныгууну ээрчийт.'},
      {title: 'Анда-санда текшерүү', text: 'Ордунда экенин үзгүлтүксүз текшерүү шайманды тынчтык менен колдонууга жардам берет.'},
      {title: 'ЖЖБИден коргоо жок', text: 'Абалга жараша ылайыктуу коргонуу керек болушу мүмкүн.'},
    ],
    tip2Title: 'Негизги жыйынтыктар',
    tip2Text:
      'Кынап шакекчеси гормондун үзгүлтүксүз бөлүнүп чыгышын күнүмдүк дозадан сактаган колдонуу ритми менен айкалыштырат. Бирок контрацепцияны тандоо ар бир адамга ылайыкталып, ден соолук сактоо адиси менен талкууланышы керек.',
    shareMessage: 'Контрацептивдик кынап шакекчеси — AWA',
  },
  tk: {
    badge: 'JYNSY ÝOL HALKASY',
    title: 'Göwrelilikden goraýjy\njynsy ýol halkasy',
    metaDuration: '5 min okamak',
    metaType: 'Makala',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Barlanan mazmun',
    intro: 'Üç hepde dowamynda dakylýan çeýe halka.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Halka nähili işleýär',
      'Ýerleşdirmek we aýyrmak',
      'Bilmeli zatlaryňyz',
      'Esasy netijeler',
    ],
    body1:
      'Halka gormonlaryň pes dozalaryny göni jynsy ýolda üznüksiz boşadýan, utgaşdyrylan tabletka bilen şol bir göwrelilikden goraýjy täsirli çeýe enjam.',
    flowTitle: 'Ol nähili işleýär',
    flowSteps: [
      {title: 'Halka', text: 'Jynsy ýola ýerleşdirilýär'},
      {title: 'Gormonlar', text: 'Üznüksiz ýaýramak'},
      {title: 'Goranyş', text: 'Göwrelilikden goraýjy täsir'},
    ],
    body2:
      'Ony özüňiz ýerleşdirýärsiňiz, ol üç hepde üznüksiz ornunda galýar, soňra aýbaşy bolýan bir hepdelik aralyk üçin aýrylýar.',
    calendarTitle: 'Eýermek üçin ýönekeý ritm',
    weekLabelActive: 'Halka',
    weekLabelPause: 'Aralyk',
    legendActive: 'Halkaly hepde',
    legendPause: 'Aralyk hepdesi',
    tip1Title: 'Bilmek peýdaly',
    tip1Text:
      'Onuň jynsy ýoldaky takyk ýerleşişi täsirli bolmagy üçin takyk bolmaly däl, bu ony ulanmagy ýönekeý edýär.',
    body3:
      'Halkany saýlamazdan öň bilmäge mynasyp birnäçe amaly nokat bar.',
    careTips: [
      {title: 'Ulanmaga ýönekeý', text: 'Ony özüňiz ýerleşdirýärsiňiz we aýyrýarsyňyz.'},
      {title: 'Yzygiderli ritm', text: 'Ol adatça üç hepde ornunda galýar.'},
      {title: 'Üznüksiz täsir', text: 'Gormonlar ulanyş döwri dowamynda üznüksiz boşadylýar.'},
      {title: 'JÝGÝ-den goramaýar', text: 'Ýagdaýa görä goşmaça goranyş gerek bolup biler.'},
    ],
    checkListTitle: 'Saklamaly gowy endikler',
    practicalSteps: [
      'Ýerleşdirmezden ýa-da aýyrmazdan öň eliňizi ýuwuň',
      'Tertibi yzarlamak üçin ýadyňyzda galmagy aňsat wagty saýlaň',
      'Wagtal-wagtal henizem ornundadygyny barlaň',
      'Süýşse ýa-da çykarylsa, görkezmäni barlaň',
    ],
    alertTitle: 'Üns beriň',
    alertText:
      'Çykarylmak ýa-da uzak wagtlaýyn süýşmek aýratyn ugrukdyrma talap edip biler. Şübhe bolsa, enjamyň görkezmesini barlaň ýa-da saglyk hünärmeninden soraň.',
    summaryTitle: '4 nokatda esasy zatlar',
    summaryItems: [
      {title: 'Ýönekeý ýerleşdirmek', text: 'Halkany özüňiz ýerleşdirip we aýryp bilersiňiz.'},
      {title: 'Hepdelik ritm', text: 'Ol adatça bir hepdelik aralyk bilen üç hepdelik sikle eýerýär.'},
      {title: 'Wagtal-wagtal barlag', text: 'Ornundadygyny yzygiderli barlamak enjamy asudalyk bilen ulanmaga kömek edýär.'},
      {title: 'JÝGÝ-den goranyş ýok', text: 'Ýagdaýa görä laýyk goranyş gerek bolup biler.'},
    ],
    tip2Title: 'Esasy netijeler',
    tip2Text:
      'Jynsy ýol halkasy gormonyň üznüksiz boşadylyşyny gündelik doza ýok ulanyş ritmi bilen utgaşdyrýar. Şeýle-de bolsa, göwrelilikden goranyş saýlawy her adama laýyk bolmaly we saglyk hünärmeni bilen maslahatlaşylmaly.',
    shareMessage: 'Göwrelilikden goraýjy jynsy ýol halkasy — AWA',
  },
} as const);

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
            <AwaIconButton
              accessibilityLabel={t('library.reader.back')}
              icon="chevron-left"
              iconSize={23}
              onPress={() => navigation.goBack()}
              variant="tonal"
            />

            <View style={styles.actions}>
              <AwaIconButton
                accessibilityLabel={t('library.screen.addBookmark')}
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

        {/* ARTICLE */}
        <View style={styles.article}>
          <View style={styles.badge}>
            <AwaText variant="labelSmall" emphasized colorRole="primary">{content.badge}</AwaText>
          </View>

          <AwaText variant="headlineMedium" weight="700" style={styles.title}>{content.title}</AwaText>

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

                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant">{text}</AwaText>
                </View>
              </React.Fragment>
            ))}
          </View>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.intro}>{content.intro}</AwaText>

          {/* TABLE OF CONTENTS */}
          <AwaCard variant="filled" padding="none" style={styles.contents}>
            <AwaText variant="titleMedium" emphasized style={styles.contentsTitle}>{content.contentsTitle}</AwaText>

            {content.topics.map((item, index) => (
              <View key={item} style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <AwaText variant="titleSmall" emphasized colorRole="primary" style={styles.contentNumber}>{index + 1}.</AwaText>

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

          {/* SECTION 1 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>1. {content.topics[0]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.body1}</AwaText>

          {/* VISUAL SCHEMA */}
          <AwaCard variant="filled" padding="none" style={styles.flowCard}>
            <AwaText variant="titleSmall" emphasized style={styles.flowTitle}>{content.flowTitle}</AwaText>

            <View style={styles.flow}>
              <View style={styles.flowStep}>
                <View style={styles.flowIcon}>
                  <MaterialDesignIcons
                    name="circle-outline"
                    size={25}
                    color={theme.colors.primary}
                  />
                </View>

                <AwaText variant="labelSmall" emphasized style={styles.flowStepTitle}>
                  {content.flowSteps[0].title}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.flowStepText}>
                  {content.flowSteps[0].text}
                </AwaText>
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

                <AwaText variant="labelSmall" emphasized style={styles.flowStepTitle}>
                  {content.flowSteps[1].title}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.flowStepText}>
                  {content.flowSteps[1].text}
                </AwaText>
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

                <AwaText variant="labelSmall" emphasized style={styles.flowStepTitle}>
                  {content.flowSteps[2].title}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.flowStepText}>
                  {content.flowSteps[2].text}
                </AwaText>
              </View>
            </View>
          </AwaCard>

          {/* SECTION 2 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>2. {content.topics[1]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.body2}</AwaText>

          {/* 3 WEEK SCHEMA */}
          <AwaCard variant="filled" padding="none" style={styles.calendarCard}>
            <AwaText variant="titleSmall" emphasized style={styles.calendarTitle}>{content.calendarTitle}</AwaText>

            <View style={styles.weekRow}>
              <View style={styles.weekItemActive}>
                <AwaText variant="titleMedium" emphasized colorRole="primary">1</AwaText>
                <AwaText variant="labelSmall" style={styles.weekLabel}>{content.weekLabelActive}</AwaText>
              </View>

              <View style={styles.weekItemActive}>
                <AwaText variant="titleMedium" emphasized colorRole="primary">2</AwaText>
                <AwaText variant="labelSmall" style={styles.weekLabel}>{content.weekLabelActive}</AwaText>
              </View>

              <View style={styles.weekItemActive}>
                <AwaText variant="titleMedium" emphasized colorRole="primary">3</AwaText>
                <AwaText variant="labelSmall" style={styles.weekLabel}>{content.weekLabelActive}</AwaText>
              </View>

              <View style={styles.weekItemPause}>
                <AwaText variant="titleMedium" emphasized colorRole="primary">4</AwaText>
                <AwaText variant="labelSmall" style={styles.weekLabel}>{content.weekLabelPause}</AwaText>
              </View>
            </View>

            <View style={styles.calendarLegend}>
              <View style={styles.legendDotActive} />

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant">{content.legendActive}</AwaText>

              <View style={styles.legendDotPause} />

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant">{content.legendPause}</AwaText>
            </View>
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.tip1Title}</AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>{content.tip1Text}</AwaText>
            </View>
          </AwaCard>

          {/* SECTION 3 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.topics[2]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.body3}</AwaText>

          {/* INFORMATION GRID */}
          <View style={styles.infoGrid}>
            {CARE_TIP_ICONS.map((icon, index) => (
              <AwaCard variant="filled" padding="none" key={content.careTips[index].title} style={styles.infoCard}>
                <View style={styles.infoIcon}>
                  <MaterialDesignIcons
                    name={icon as never}
                    size={23}
                    color={theme.colors.primary}
                  />
                </View>

                <AwaText variant="titleSmall" emphasized style={styles.infoTitle}>
                  {content.careTips[index].title}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.infoText}>
                  {content.careTips[index].text}
                </AwaText>
              </AwaCard>
            ))}
          </View>

          {/* PRACTICAL CHECKLIST */}
          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            <AwaText variant="titleSmall" emphasized style={styles.checkListTitle}>{content.checkListTitle}</AwaText>

            {content.practicalSteps.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.checkText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          {/* WARNING */}
          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.alertTitle}</AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>{content.alertText}</AwaText>
            </View>
          </AwaCard>

          {/* SECTION 4 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.topics[3]}</AwaText>

          {/* SUMMARY SCHEMA */}
          <AwaCard variant="filled" padding="none" style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <MaterialDesignIcons
                name="check-decagram-outline"
                size={25}
                color={theme.colors.primary}
              />

              <AwaText variant="titleSmall" emphasized style={styles.summaryTitle}>{content.summaryTitle}</AwaText>
            </View>

            <View style={styles.summaryItem}>
              <View style={styles.summaryNumber}>
                <AwaText variant="labelSmall" emphasized colorRole="primary">1</AwaText>
              </View>

              <View style={styles.summaryCopy}>
                <AwaText variant="titleSmall" emphasized>
                  {content.summaryItems[0].title}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.summaryItemText}>
                  {content.summaryItems[0].text}
                </AwaText>
              </View>
            </View>

            <View style={styles.summaryItem}>
              <View style={styles.summaryNumber}>
                <AwaText variant="labelSmall" emphasized colorRole="primary">2</AwaText>
              </View>

              <View style={styles.summaryCopy}>
                <AwaText variant="titleSmall" emphasized>
                  {content.summaryItems[1].title}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.summaryItemText}>
                  {content.summaryItems[1].text}
                </AwaText>
              </View>
            </View>

            <View style={styles.summaryItem}>
              <View style={styles.summaryNumber}>
                <AwaText variant="labelSmall" emphasized colorRole="primary">3</AwaText>
              </View>

              <View style={styles.summaryCopy}>
                <AwaText variant="titleSmall" emphasized>
                  {content.summaryItems[2].title}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.summaryItemText}>
                  {content.summaryItems[2].text}
                </AwaText>
              </View>
            </View>

            <View style={styles.summaryItem}>
              <View style={styles.summaryNumber}>
                <AwaText variant="labelSmall" emphasized colorRole="primary">4</AwaText>
              </View>

              <View style={styles.summaryCopy}>
                <AwaText variant="titleSmall" emphasized>
                  {content.summaryItems[3].title}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.summaryItemText}>
                  {content.summaryItems[3].text}
                </AwaText>
              </View>
            </View>
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="heart-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.tip2Title}</AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>{content.tip2Text}</AwaText>
            </View>
          </AwaCard>
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
    paddingBottom: 32,
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

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  metaDivider: {
    width: 1,
    height: 20,
    backgroundColor: theme.colors.border,
  },


  intro: {
    marginTop: 16,
  },

  contents: {
    marginTop: 20,
    padding: 16,
  },

  contentsTitle: {
    marginBottom: 8,
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
  },

  contentText: {
    flex: 1,
  },

  h2: {
    marginTop: 24,
  },

  body: {
    marginTop: 8,
  },

  /* FUNCTIONING SCHEMA */

  flowCard: {
    marginTop: 16,
    padding: 16,
  },

  flowTitle: {
    marginBottom: 16,
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
    marginTop: 8,
    textAlign: 'center',
  },

  flowStepText: {
    marginTop: 3,
    textAlign: 'center',
  },

  /* CALENDAR SCHEMA */

  calendarCard: {
    marginTop: 16,
    padding: 16,
  },

  calendarTitle: {
    marginBottom: 16,
  },

  weekRow: {
    flexDirection: 'row',
    gap: 8,
  },

  weekItemActive: {
    flex: 1,
    minHeight: 68,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  weekItemPause: {
    flex: 1,
    minHeight: 68,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },


  weekLabel: {
    marginTop: 3,
  },

  calendarLegend: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
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


  /* TIP */

  tip: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  tipCopy: {
    flex: 1,
    marginLeft: 12,
  },


  tipText: {
    marginTop: 3,
  },

  /* INFORMATION GRID */

  infoGrid: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },

  infoCard: {
    width: '48.5%',
    minHeight: 150,
    padding: 12,
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
    marginTop: 12,
  },

  infoText: {
    marginTop: 4,
  },

  /* CHECKLIST */

  checkList: {
    marginTop: 16,
    padding: 16,
  },

  checkListTitle: {
    marginBottom: 12,
  },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },

  checkText: {
    flex: 1,
  },

  /* ALERT */

  alert: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },

  /* SUMMARY */

  summaryCard: {
    marginTop: 16,
    padding: 16,
  },

  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },

  summaryTitle: {
    flex: 1,
  },

  summaryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  summaryNumber: {
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },


  summaryCopy: {
    flex: 1,
    marginLeft: 12,
  },


  summaryItemText: {
    marginTop: 2,
  },
  });
}
