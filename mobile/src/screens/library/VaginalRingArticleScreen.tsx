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
