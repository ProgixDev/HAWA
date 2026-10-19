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
import {
  isArticleBookmarked,
  loadLibraryState,
  saveScrollPosition,
  toggleBookmark,
} from '../../state/libraryStore';
import ReadingControls from '../../components/articles/ReadingControls';
import {AwaCard} from '../../components/ui/AwaCard';
import {AwaIconButton} from '../../components/ui/AwaIconButton';
import {AwaText} from '../../components/ui/AwaText';
import {getBottomPadding, getTopPadding, READING_CONTROLS_SPACE} from '../../theme/spacing';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {resolveEditorialLanguage} from '../../i18n/editorialLanguage';

const ID = 'flow-colors-textures';

const HERO = require('../../assets/images/library/flow-colors-hero.png');
const WARNING = require('../../assets/images/library/flow-colors-warning.png');

// fixed: these hex values are real educational flow-color swatches (this
// article's actual subject matter), not generic UI chrome — they must stay
// literal regardless of theme so the color example itself is accurate.
// Only the label/description TEXT moves into the bilingual CONTENT object
// below (CONTENT.fr.colors / CONTENT.en.colors), keyed by index to stay
// aligned with these swatches.
const COLOR_SWATCHES = [
  '#C42031',
  '#7F2D31',
  '#9E7462',
  '#E66770',
  '#F47B2A',
] as const;

// Images stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below (CONTENT.fr.textures / CONTENT.en.textures), keyed by index
// to stay aligned with these illustrations.
const TEXTURE_IMAGES = [
  require('../../assets/images/library/flow-texture-fluid.png'),
  require('../../assets/images/library/flow-texture-creamy.png'),
  require('../../assets/images/library/flow-texture-clots.png'),
  require('../../assets/images/library/flow-texture-mucus.png'),
  require('../../assets/images/library/flow-texture-tissue.png'),
] as const;

// fixed: same reasoning as COLOR_SWATCHES above — these dots illustrate the
// actual flow-color meanings discussed in the text, not decorative UI
// chrome. Only the label/description TEXT moves into CONTENT.fr.meanings /
// CONTENT.en.meanings, keyed by index to stay aligned with these dots.
const MEANING_DOTS = ['#B8182D', '#A97864', '#E45F6B', '#F47B2A'] as const;

// Icon names are not natural language — only TEXT moves into
// CONTENT.fr.advice / CONTENT.en.advice, keyed by index to stay aligned
// with these icons.
const ADVICE_ICONS = [
  'calendar-month-outline',
  'shield-cross-outline',
  'heart-outline',
  'doctor',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// hex swatches, icons, bookmark/progress keys, JSX structure) is untouched;
// only this object changes per language. The French text below is
// byte-identical to the original — never retyped, only moved into the `fr`
// key — so the app remains fully bilingual rather than having French
// replaced by English.
const CONTENT = {
  fr: {
    badge: 'CYCLE & BIEN-ÊTRE',
    title: 'Flux menstruel : comprendre\nles couleurs et textures',
    metaDuration: '4 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro:
      'La couleur et la texture de tes règles en disent long sur ta santé hormonale. Apprends à les décrypter pour mieux comprendre ton cycle.',
    contentsTitle: 'Dans cet article',
    contents: [
      'Les couleurs du flux menstruel',
      'Les textures du flux',
      'Ce que chaque couleur peut indiquer',
      'Quand faut-il s’inquiéter ?',
      'Nos conseils pour mieux te connaître',
    ],
    colors: [
      {name: 'Rouge vif', text: 'Flux frais, nouveau sang. Fréquent en début de règles.'},
      {name: 'Rouge foncé', text: 'Sang plus ancien, normal en milieu de cycle.'},
      {name: 'Marron', text: 'Sang oxydé, souvent en fin de règles.'},
      {name: 'Rose', text: 'Peut indiquer un flux léger ou un changement hormonal.'},
      {name: 'Orange', text: 'Peut être lié à une infection ou à un déséquilibre.'},
    ],
    textures: [
      {name: 'Fluide', text: 'Flux liquide, sans grumeaux.'},
      {name: 'Crémeux', text: 'Texture épaisse et homogène.'},
      {name: 'Caillots', text: 'Petits ou gros caillots de sang.'},
      {name: 'Filaire / Mucus', text: 'Élastique, transparent ou blanchâtre.'},
      {name: 'Tissus', text: 'Morceaux de tissu ou de muqueuse.'},
    ],
    meanings: [
      {name: 'Rouge vif à foncé', text: 'Cycle normal. Ton corps élimine la muqueuse utérine.'},
      {name: 'Marron', text: 'Sang plus ancien, rien d’inquiétant.'},
      {name: 'Rose', text: 'Peut survenir en cas de début/fin de règles ou de déséquilibre hormonal.'},
      {name: 'Orange', text: 'Surveille si accompagné d’odeur forte, démangeaisons ou douleurs.'},
    ],
    warningTitle: 'Signes à surveiller',
    warningItems: [
      'Saignements très abondants (changer de protection toutes les 1–2 h)',
      'Présence de très gros caillots régulièrement',
      'Mauvaise odeur persistante ou démangeaisons',
      'Douleurs intenses inhabituelles',
    ],
    advice: [
      {title: 'Observe ton flux', text: 'Note les changements chaque mois.'},
      {title: 'Choisis la protection adaptée', text: 'Selon ton flux et ton confort.'},
      {title: 'Écoute ton corps', text: 'Il te donne des signaux précieux.'},
      {title: 'En cas de doute', text: 'Parle-en à un·e professionnel·le de santé.'},
    ],
    shareMessage: 'Flux menstruel : comprendre les couleurs et textures — AWA',
  },
  en: {
    badge: 'CYCLE & WELLNESS',
    title: 'Period flow: understanding\ncolors and textures',
    metaDuration: '4 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro:
      'The color and texture of your period say a lot about your hormonal health. Learn to read them to better understand your cycle.',
    contentsTitle: 'In this article',
    contents: [
      'The colors of period flow',
      'The textures of flow',
      'What each color may indicate',
      'When should you be concerned?',
      'Our tips to help you know yourself better',
    ],
    colors: [
      {name: 'Bright red', text: 'Fresh flow, new blood. Common at the start of your period.'},
      {name: 'Dark red', text: 'Older blood, normal in the middle of the cycle.'},
      {name: 'Brown', text: 'Oxidized blood, often at the end of your period.'},
      {name: 'Pink', text: 'May indicate light flow or a hormonal change.'},
      {name: 'Orange', text: 'May be linked to an infection or an imbalance.'},
    ],
    textures: [
      {name: 'Fluid', text: 'Liquid flow, without clumps.'},
      {name: 'Creamy', text: 'Thick, smooth texture.'},
      {name: 'Clots', text: 'Small or large blood clots.'},
      {name: 'Stringy / Mucus', text: 'Stretchy, clear or whitish.'},
      {name: 'Tissue', text: 'Pieces of tissue or mucous membrane.'},
    ],
    meanings: [
      {name: 'Bright to dark red', text: 'Normal cycle. Your body is shedding the uterine lining.'},
      {name: 'Brown', text: 'Older blood, nothing to worry about.'},
      {name: 'Pink', text: 'May occur at the start/end of your period or with a hormonal imbalance.'},
      {name: 'Orange', text: 'Keep an eye on it if accompanied by a strong odor, itching, or pain.'},
    ],
    warningTitle: 'Signs to watch for',
    warningItems: [
      'Very heavy bleeding (changing protection every 1–2 hours)',
      'Regularly passing very large clots',
      'Persistent bad odor or itching',
      'Unusually intense pain',
    ],
    advice: [
      {title: 'Observe your flow', text: 'Note any changes each month.'},
      {title: 'Choose the right protection', text: 'Based on your flow and your comfort.'},
      {title: 'Listen to your body', text: 'It gives you valuable signals.'},
      {title: 'If in doubt', text: 'Talk to a healthcare professional.'},
    ],
    shareMessage: 'Period flow: understanding colors and textures — AWA',
  },
  es: {
    badge: 'CICLO Y BIENESTAR',
    title: 'Flujo menstrual: entender\nlos colores y las texturas',
    metaDuration: '4 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro:
      'El color y la textura de tu período dicen mucho sobre tu salud hormonal. Aprende a interpretarlos para entender mejor tu ciclo.',
    contentsTitle: 'En este artículo',
    contents: [
      'Los colores del flujo menstrual',
      'Las texturas del flujo',
      'Qué puede indicar cada color',
      '¿Cuándo hay que preocuparse?',
      'Nuestros consejos para conocerte mejor',
    ],
    colors: [
      {name: 'Rojo vivo', text: 'Flujo fresco, sangre nueva. Frecuente al inicio del período.'},
      {name: 'Rojo oscuro', text: 'Sangre más antigua, normal a mitad del ciclo.'},
      {name: 'Marrón', text: 'Sangre oxidada, frecuente al final del período.'},
      {name: 'Rosa', text: 'Puede indicar un flujo ligero o un cambio hormonal.'},
      {name: 'Naranja', text: 'Puede estar relacionado con una infección o un desequilibrio.'},
    ],
    textures: [
      {name: 'Fluido', text: 'Flujo líquido, sin grumos.'},
      {name: 'Cremoso', text: 'Textura espesa y homogénea.'},
      {name: 'Coágulos', text: 'Coágulos de sangre pequeños o grandes.'},
      {name: 'Filamentoso / Mucoso', text: 'Elástico, transparente o blanquecino.'},
      {name: 'Tejido', text: 'Fragmentos de tejido o de mucosa.'},
    ],
    meanings: [
      {name: 'Del rojo vivo al oscuro', text: 'Ciclo normal. Tu cuerpo elimina el revestimiento uterino.'},
      {name: 'Marrón', text: 'Sangre más antigua, no es motivo de preocupación.'},
      {name: 'Rosa', text: 'Puede aparecer al inicio o al final del período, o con un desequilibrio hormonal.'},
      {name: 'Naranja', text: 'Presta atención si va acompañado de olor fuerte, picor o dolor.'},
    ],
    warningTitle: 'Señales que hay que vigilar',
    warningItems: [
      'Sangrado muy abundante (cambiar de protección cada 1-2 horas)',
      'Presencia frecuente de coágulos muy grandes',
      'Mal olor persistente o picor',
      'Dolores intensos e inusuales',
    ],
    advice: [
      {title: 'Observa tu flujo', text: 'Anota los cambios cada mes.'},
      {title: 'Elige la protección adecuada', text: 'Según tu flujo y tu comodidad.'},
      {title: 'Escucha a tu cuerpo', text: 'Te da señales valiosas.'},
      {title: 'Si tienes dudas', text: 'Habla con un profesional de la salud.'},
    ],
    shareMessage: 'Flujo menstrual: entender los colores y las texturas — AWA',
  },
  it: {
    badge: 'CICLO E BENESSERE',
    title: 'Il flusso mestruale: capire\ncolori e consistenze',
    metaDuration: '4 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Il colore e la consistenza del tuo flusso dicono molto sulla tua salute ormonale. Impara a leggerli per capire meglio il tuo ciclo.',
    contentsTitle: 'In questo articolo',
    contents: [
      'I colori del flusso mestruale',
      'Le consistenze del flusso',
      'Cosa può indicare ogni colore',
      'Quando preoccuparsi?',
      'I nostri consigli per conoscerti meglio',
    ],
    colors: [
      {
        name: 'Rosso vivo',
        text: 'Flusso fresco, sangue nuovo. Comune all’inizio del ciclo.',
      },
      {
        name: 'Rosso scuro',
        text: 'Sangue più vecchio, normale a metà del ciclo.',
      },
      {
        name: 'Marrone',
        text: 'Sangue ossidato, spesso alla fine del ciclo.',
      },
      {
        name: 'Rosa',
        text: 'Può indicare un flusso leggero o un cambiamento ormonale.',
      },
      {
        name: 'Arancione',
        text: 'Può essere legato a un’infezione o a uno squilibrio.',
      },
    ],
    textures: [
      {
        name: 'Fluido',
        text: 'Flusso liquido, senza grumi.',
      },
      {
        name: 'Cremoso',
        text: 'Consistenza densa e liscia.',
      },
      {
        name: 'Coaguli',
        text: 'Coaguli di sangue piccoli o grandi.',
      },
      {
        name: 'Filante / Mucoso',
        text: 'Elastico, trasparente o biancastro.',
      },
      {
        name: 'Tessuto',
        text: 'Frammenti di tessuto o di mucosa.',
      },
    ],
    meanings: [
      {
        name: 'Da rosso vivo a rosso scuro',
        text: 'Ciclo normale. Il tuo corpo sta eliminando il rivestimento dell’utero.',
      },
      {
        name: 'Marrone',
        text: 'Sangue più vecchio, nulla di preoccupante.',
      },
      {
        name: 'Rosa',
        text: 'Può comparire all’inizio/alla fine del ciclo o con uno squilibrio ormonale.',
      },
      {
        name: 'Arancione',
        text: 'Tienilo d’occhio se è accompagnato da un odore forte, prurito o dolore.',
      },
    ],
    warningTitle: 'Segnali a cui fare attenzione',
    warningItems: [
      'Sanguinamento molto abbondante (cambio della protezione ogni 1–2 ore)',
      'Eliminare regolarmente coaguli molto grandi',
      'Cattivo odore o prurito persistenti',
      'Dolore insolitamente intenso',
    ],
    advice: [
      {
        title: 'Osserva il tuo flusso',
        text: 'Annota ogni mese eventuali cambiamenti.',
      },
      {
        title: 'Scegli la protezione giusta',
        text: 'In base al tuo flusso e al tuo comfort.',
      },
      {
        title: 'Ascolta il tuo corpo',
        text: 'Ti dà segnali preziosi.',
      },
      {
        title: 'In caso di dubbio',
        text: 'Parlane con un operatore sanitario.',
      },
    ],
    shareMessage: 'Il flusso mestruale: capire colori e consistenze — AWA',
  },
  tr: {
    badge: 'DÖNGÜ VE İYİ OLUŞ',
    title: 'Adet akışı: renkleri ve\ndokuları anlamak',
    metaDuration: '4 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Adetinin rengi ve dokusu hormonal sağlığın hakkında çok şey söyler. Döngünü daha iyi anlamak için bunları okumayı öğren.',
    contentsTitle: 'Bu makalede',
    contents: [
      'Adet akışının renkleri',
      'Akışın dokuları',
      'Her rengin neye işaret edebileceği',
      'Ne zaman endişelenmeli?',
      'Kendini daha iyi tanıman için önerilerimiz',
    ],
    colors: [
      {
        name: 'Parlak kırmızı',
        text: 'Taze akış, yeni kan. Adetin başında yaygındır.',
      },
      {
        name: 'Koyu kırmızı',
        text: 'Daha eski kan; döngünün orta döneminde normaldir.',
      },
      {
        name: 'Kahverengi',
        text: 'Oksitlenmiş kan; çoğunlukla adetin sonunda görülür.',
      },
      {
        name: 'Pembe',
        text: 'Hafif bir akışa ya da hormonal bir değişime işaret edebilir.',
      },
      {
        name: 'Turuncu',
        text: 'Bir enfeksiyonla ya da bir dengesizlikle bağlantılı olabilir.',
      },
    ],
    textures: [
      {
        name: 'Akışkan',
        text: 'Sıvı akış, pıhtısız.',
      },
      {
        name: 'Kremsi',
        text: 'Koyu, pürüzsüz doku.',
      },
      {
        name: 'Pıhtılar',
        text: 'Küçük ya da büyük kan pıhtıları.',
      },
      {
        name: 'İpliksi / Mukus',
        text: 'Esneyen, şeffaf ya da beyazımsı.',
      },
      {
        name: 'Doku parçaları',
        text: 'Doku ya da mukoza parçaları.',
      },
    ],
    meanings: [
      {
        name: 'Parlak ile koyu kırmızı arası',
        text: 'Normal döngü. Bedenin rahim iç zarını atıyor.',
      },
      {
        name: 'Kahverengi',
        text: 'Daha eski kan, endişelenecek bir şey yok.',
      },
      {
        name: 'Pembe',
        text: 'Adetin başında/sonunda ya da hormonal bir dengesizlikle ortaya çıkabilir.',
      },
      {
        name: 'Turuncu',
        text: 'Keskin bir koku, kaşıntı ya da ağrı eşlik ediyorsa takip et.',
      },
    ],
    warningTitle: 'Dikkat edilecek belirtiler',
    warningItems: [
      'Çok yoğun kanama (koruyucu ürünü 1–2 saatte bir değiştirmek)',
      'Düzenli olarak çok büyük pıhtılar gelmesi',
      'Geçmeyen kötü koku ya da kaşıntı',
      'Alışılmadık derecede şiddetli ağrı',
    ],
    advice: [
      {
        title: 'Akışını gözlemle',
        text: 'Her ay görülen değişiklikleri not et.',
      },
      {
        title: 'Doğru koruyucuyu seç',
        text: 'Akışına ve konforuna göre seç.',
      },
      {
        title: 'Bedenini dinle',
        text: 'Sana değerli sinyaller verir.',
      },
      {
        title: 'Şüphe duyarsan',
        text: 'Bir sağlık uzmanıyla konuş.',
      },
    ],
    shareMessage: 'Adet akışı: renkleri ve dokuları anlamak — AWA',
  },
  ru: {
    badge: 'ЦИКЛ И САМОЧУВСТВИЕ',
    title: 'Менструальные выделения: как понять\nцвет и консистенцию',
    metaDuration: '4 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro:
      'Цвет и консистенция месячных многое говорят о вашем гормональном здоровье. Научитесь их понимать, чтобы лучше знать свой цикл.',
    contentsTitle: 'В этой статье',
    contents: [
      'Цвета менструальных выделений',
      'Консистенция выделений',
      'О чём может говорить каждый цвет',
      'Когда стоит беспокоиться?',
      'Наши советы, как лучше узнать себя',
    ],
    colors: [
      {name: 'Ярко-красный', text: 'Свежие выделения, новая кровь. Часто бывает в начале месячных.'},
      {name: 'Тёмно-красный', text: 'Более старая кровь, нормально для середины месячных.'},
      {name: 'Коричневый', text: 'Окислившаяся кровь, часто в конце месячных.'},
      {name: 'Розовый', text: 'Может указывать на скудные выделения или гормональное изменение.'},
      {name: 'Оранжевый', text: 'Может быть связан с инфекцией или нарушением баланса.'},
    ],
    textures: [
      {name: 'Жидкие', text: 'Жидкие выделения без сгустков.'},
      {name: 'Кремообразные', text: 'Густая, гладкая консистенция.'},
      {name: 'Сгустки', text: 'Небольшие или крупные сгустки крови.'},
      {name: 'Тягучие / слизистые', text: 'Тянущиеся, прозрачные или беловатые.'},
      {name: 'Фрагменты ткани', text: 'Кусочки ткани или слизистой оболочки.'},
    ],
    meanings: [
      {name: 'От ярко-красного до тёмно-красного', text: 'Нормальный цикл. Ваш организм выводит слизистую оболочку матки.'},
      {name: 'Коричневый', text: 'Более старая кровь, поводов для беспокойства нет.'},
      {name: 'Розовый', text: 'Может появляться в начале или в конце месячных либо при гормональном дисбалансе.'},
      {name: 'Оранжевый', text: 'Следите за этим, если есть резкий запах, зуд или боль.'},
    ],
    warningTitle: 'Признаки, на которые стоит обратить внимание',
    warningItems: [
      'Очень обильное кровотечение (смена средства гигиены каждые 1–2 часа)',
      'Регулярное выделение очень крупных сгустков',
      'Стойкий неприятный запах или зуд',
      'Необычно сильная боль',
    ],
    advice: [
      {title: 'Наблюдайте за выделениями', text: 'Отмечайте изменения каждый месяц.'},
      {title: 'Выбирайте подходящее средство гигиены', text: 'С учётом ваших выделений и вашего комфорта.'},
      {title: 'Прислушивайтесь к своему телу', text: 'Оно подаёт вам ценные сигналы.'},
      {title: 'Если есть сомнения', text: 'Обратитесь к медицинскому специалисту.'},
    ],
    shareMessage: 'Менструальные выделения: как понять цвет и консистенцию — AWA',
  },
  de: {
    badge: 'ZYKLUS & WOHLBEFINDEN',
    title: 'Menstruationsblut: Farben\nund Konsistenz verstehen',
    metaDuration: '4 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro:
      'Farbe und Konsistenz deiner Periode verraten viel über deine hormonelle Gesundheit. Lerne, sie zu deuten, um deinen Zyklus besser zu verstehen.',
    contentsTitle: 'In diesem Artikel',
    contents: [
      'Die Farben der Regelblutung',
      'Die Konsistenz der Blutung',
      'Was jede Farbe bedeuten kann',
      'Wann solltest du aufmerksam werden?',
      'Unsere Tipps, damit du dich besser kennenlernst',
    ],
    colors: [
      {name: 'Hellrot', text: 'Frische Blutung, neues Blut. Häufig zu Beginn deiner Periode.'},
      {name: 'Dunkelrot', text: 'Älteres Blut, normal in der Mitte der Periode.'},
      {name: 'Braun', text: 'Oxidiertes Blut, oft am Ende deiner Periode.'},
      {name: 'Rosa', text: 'Kann auf eine schwache Blutung oder eine hormonelle Veränderung hinweisen.'},
      {name: 'Orange', text: 'Kann mit einer Infektion oder einem Ungleichgewicht zusammenhängen.'},
    ],
    textures: [
      {name: 'Flüssig', text: 'Flüssige Blutung ohne Klümpchen.'},
      {name: 'Cremig', text: 'Dicke, glatte Konsistenz.'},
      {name: 'Blutgerinnsel', text: 'Kleine oder große Blutklumpen.'},
      {name: 'Fadenziehend / Schleimig', text: 'Dehnbar, klar oder weißlich.'},
      {name: 'Gewebe', text: 'Gewebestücke oder Schleimhautfetzen.'},
    ],
    meanings: [
      {name: 'Hellrot bis dunkelrot', text: 'Normaler Zyklus. Dein Körper stößt die Gebärmutterschleimhaut ab.'},
      {name: 'Braun', text: 'Älteres Blut, kein Grund zur Sorge.'},
      {name: 'Rosa', text: 'Kann zu Beginn oder am Ende der Periode oder bei einem hormonellen Ungleichgewicht auftreten.'},
      {name: 'Orange', text: 'Behalte es im Auge, wenn es von starkem Geruch, Juckreiz oder Schmerzen begleitet wird.'},
    ],
    warningTitle: 'Warnzeichen, auf die du achten solltest',
    warningItems: [
      'Sehr starke Blutung (Wechsel der Hygieneartikel alle 1–2 Stunden)',
      'Regelmäßiger Abgang sehr großer Blutgerinnsel',
      'Anhaltender unangenehmer Geruch oder Juckreiz',
      'Ungewöhnlich starke Schmerzen',
    ],
    advice: [
      {title: 'Beobachte deine Blutung', text: 'Notiere jeden Monat alle Veränderungen.'},
      {title: 'Wähle den passenden Schutz', text: 'Je nach Stärke deiner Blutung und deinem Komfort.'},
      {title: 'Hör auf deinen Körper', text: 'Er gibt dir wertvolle Signale.'},
      {title: 'Bei Zweifeln', text: 'Sprich mit medizinischem Fachpersonal.'},
    ],
    shareMessage: 'Menstruationsblut: Farben und Konsistenz verstehen — AWA',
  },
  zh: {
      badge: '周期与健康',
      title: '经血：读懂\n颜色与质地',
      metaDuration: '阅读约 4 分钟',
      metaType: '指南',
      metaLevel: '入门',
      metaValidated: '已审核内容',
      intro: '经血的颜色和质地，能透露不少你的激素健康状况。学会观察它们，更好地了解自己的周期。',
      contentsTitle: '本文内容',
      contents: [
        '经血的颜色',
        '经血的质地',
        '每种颜色可能意味着什么',
        '什么时候该担心？',
        '帮你更了解自己的小建议',
      ],
      colors: [
        {
          name: '鲜红色',
          text: '新鲜的血液，刚排出的经血。月经刚开始时很常见。',
        },
        {
          name: '暗红色',
          text: '较陈旧的血液，在月经中段属于正常现象。',
        },
        {
          name: '棕色',
          text: '被氧化的血液，通常出现在月经快结束时。',
        },
        {
          name: '粉色',
          text: '可能提示经量较少，或有激素变化。',
        },
        {
          name: '橙色',
          text: '可能与感染或失衡有关。',
        },
      ],
      textures: [
        {
          name: '稀薄',
          text: '液态的经血，没有血块。',
        },
        {
          name: '浓稠',
          text: '质地浓稠而顺滑。',
        },
        {
          name: '血块',
          text: '大大小小的血凝块。',
        },
        {
          name: '拉丝 / 黏液',
          text: '有拉丝感，透明或偏白。',
        },
        {
          name: '组织',
          text: '一小块一小块的组织或黏膜。',
        },
      ],
      meanings: [
        {
          name: '鲜红色到暗红色',
          text: '周期正常。你的身体正在排出子宫内膜。',
        },
        {
          name: '棕色',
          text: '较陈旧的血液，无需担心。',
        },
        {
          name: '粉色',
          text: '可能出现在月经开始或结束时，也可能与激素失衡有关。',
        },
        {
          name: '橙色',
          text: '如果伴有明显异味、瘙痒或疼痛，请留意观察。',
        },
      ],
      warningTitle: '需要留意的信号',
      warningItems: [
        '出血量非常大（每 1 到 2 小时就要更换卫生用品）',
        '经常排出非常大的血块',
        '持续的异味或瘙痒',
        '异常剧烈的疼痛',
      ],
      advice: [
        {
          title: '观察你的经血',
          text: '记下每个月的变化。',
        },
        {
          title: '选择合适的卫生用品',
          text: '根据你的经量和舒适感来选择。',
        },
        {
          title: '倾听身体的声音',
          text: '它会给你很有价值的信号。',
        },
        {
          title: '如有疑问',
          text: '向医疗专业人员咨询。',
        },
      ],
      shareMessage: '经血：读懂颜色与质地 — AWA',
    },
  id: {
    badge: 'SIKLUS & KESEHATAN',
    title: 'Aliran darah haid: memahami\nwarna dan teksturnya',
    metaDuration: '4 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Warna dan tekstur darah haidmu banyak bercerita tentang kesehatan hormonalmu. Pelajari cara membacanya untuk lebih memahami siklusmu.',
    contentsTitle: 'Dalam artikel ini',
    contents: [
      'Warna aliran darah haid',
      'Tekstur aliran darah',
      'Apa yang mungkin ditunjukkan tiap warna',
      'Kapan kamu perlu waspada?',
      'Tips kami untuk membantumu mengenal dirimu lebih baik',
    ],
    colors: [
      {
        name: 'Merah terang',
        text: 'Aliran segar, darah baru. Umum terjadi di awal haid.',
      },
      {
        name: 'Merah tua',
        text: 'Darah yang lebih lama, wajar di pertengahan haid.',
      },
      {
        name: 'Cokelat',
        text: 'Darah yang teroksidasi, sering muncul di akhir haid.',
      },
      {
        name: 'Merah muda',
        text: 'Bisa menandakan aliran yang ringan atau perubahan hormon.',
      },
      {
        name: 'Oranye',
        text: 'Bisa berkaitan dengan infeksi atau ketidakseimbangan.',
      },
    ],
    textures: [
      {
        name: 'Cair',
        text: 'Aliran encer, tanpa gumpalan.',
      },
      {
        name: 'Berkrim',
        text: 'Tekstur kental dan halus.',
      },
      {
        name: 'Gumpalan',
        text: 'Gumpalan darah kecil atau besar.',
      },
      {
        name: 'Berserabut / Lendir',
        text: 'Kenyal, bening atau keputihan.',
      },
      {
        name: 'Jaringan',
        text: 'Serpihan jaringan atau selaput lendir.',
      },
    ],
    meanings: [
      {
        name: 'Merah terang hingga merah tua',
        text: 'Siklus normal. Tubuhmu sedang meluruhkan lapisan rahim.',
      },
      {
        name: 'Cokelat',
        text: 'Darah yang lebih lama, tidak perlu dikhawatirkan.',
      },
      {
        name: 'Merah muda',
        text: 'Bisa terjadi di awal/akhir haid atau saat hormon tidak seimbang.',
      },
      {
        name: 'Oranye',
        text: 'Perhatikan jika disertai bau menyengat, gatal, atau nyeri.',
      },
    ],
    warningTitle: 'Tanda yang perlu diwaspadai',
    warningItems: [
      'Perdarahan sangat deras (mengganti pembalut setiap 1–2 jam)',
      'Sering mengeluarkan gumpalan yang sangat besar',
      'Bau tidak sedap atau gatal yang menetap',
      'Nyeri yang luar biasa hebat',
    ],
    advice: [
      {
        title: 'Amati aliran darahmu',
        text: 'Catat setiap perubahan tiap bulan.',
      },
      {
        title: 'Pilih pelindung yang tepat',
        text: 'Sesuaikan dengan aliran darah dan kenyamananmu.',
      },
      {
        title: 'Dengarkan tubuhmu',
        text: 'Tubuhmu memberimu sinyal yang berharga.',
      },
      {
        title: 'Jika ragu',
        text: 'Bicaralah dengan tenaga kesehatan.',
      },
    ],
    shareMessage: 'Aliran darah haid: memahami warna dan teksturnya — AWA',
  },
} as const;

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ArticleReader'
>;

export default function FlowColorsTexturesArticleScreen({
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
    let active = true;

    loadLibraryState().then(() => {
      if (active) {
        setSaved(isArticleBookmarked(ID));
      }
    });

    return () => {
      active = false;
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
          saveScrollPosition(
            ID,
            event.nativeEvent.contentOffset.y,
          )
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
          <Image
            source={HERO}
            resizeMode="cover"
            style={styles.hero}
          />

          <View
            style={[
              styles.top,
              {
                paddingTop: getTopPadding(insets.top, true),
              },
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
                accessibilityLabel={t('libraryArticle.bookmarkA11y')}
                icon={
                    saved
                      ? 'bookmark'
                      : 'bookmark-outline'
                  }
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
            <AwaText variant="labelSmall" emphasized colorRole="primary">
              {content.badge}
            </AwaText>
          </View>

          <AwaText variant="headlineMedium" weight="700" style={styles.title}>
            {content.title}
          </AwaText>

          {/* MÉTADONNÉES */}
          <View style={styles.metas}>
            <View style={styles.metaTopRow}>
              <View style={styles.metaItem}>
                <MaterialDesignIcons
                  name="clock-outline"
                  size={19}
                  color={theme.colors.textMuted}
                />
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant">
                  {content.metaDuration}
                </AwaText>
              </View>

              <View style={styles.metaDivider} />

              <View style={styles.metaItem}>
                <MaterialDesignIcons
                  name="book-open-page-variant-outline"
                  size={19}
                  color={theme.colors.textMuted}
                />
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant">
                  {content.metaType}
                </AwaText>
              </View>

              <View style={styles.metaDivider} />

              <View style={styles.metaItem}>
                <MaterialDesignIcons
                  name="chart-bar"
                  size={19}
                  color={theme.colors.textMuted}
                />
                <AwaText variant="bodySmall" colorRole="onSurfaceVariant">
                  {content.metaLevel}
                </AwaText>
              </View>
            </View>

            <View style={styles.metaValidatedRow}>
              <MaterialDesignIcons
                name="shield-check-outline"
                size={19}
                color={theme.colors.textMuted}
              />
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant">
                {content.metaValidated}
              </AwaText>
            </View>
          </View>

          <AwaText variant="bodyMedium" style={styles.intro}>
            {content.intro}
          </AwaText>

          {/* SOMMAIRE */}
          <AwaCard variant="filled" padding="none" style={styles.contents}>
            <AwaText variant="titleSmall" emphasized style={styles.contentsTitle}>
              {content.contentsTitle}
            </AwaText>

            {content.contents.map((item, index) => (
              <View
                key={item}
                style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <AwaText variant="labelSmall" emphasized colorRole="primary" style={styles.contentNumber}>
                    {index + 1}.
                  </AwaText>

                  <AwaText variant="bodySmall" style={styles.contentText}>
                    {item}
                  </AwaText>
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
          <AwaText variant="titleLarge" emphasized style={styles.sectionTitle}>
            1. {content.contents[0]}
          </AwaText>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cards}>
            {content.colors.map(({name, text}, index) => (
              <View
                key={COLOR_SWATCHES[index]}
                style={styles.smallCard}>
                <View style={styles.dropIcon}>
                  <MaterialDesignIcons
                    name="water"
                    size={34}
                    color={COLOR_SWATCHES[index]}
                  />
                </View>

                <AwaText variant="titleSmall" emphasized style={styles.cardTitle}>
                  {name}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.cardText}>
                  {text}
                </AwaText>
              </View>
            ))}
          </ScrollView>

          {/* SECTION 2 */}
          <AwaText variant="titleLarge" emphasized style={styles.sectionTitle}>
            2. {content.contents[1]}
          </AwaText>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cards}>
            {content.textures.map(({name, text}, index) => (
              <View
                key={index}
                style={styles.smallCard}>
                <Image
                  source={TEXTURE_IMAGES[index]}
                  resizeMode="cover"
                  style={styles.textureImage}
                />

                <AwaText variant="titleSmall" emphasized style={styles.cardTitle}>
                  {name}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.cardText}>
                  {text}
                </AwaText>
              </View>
            ))}
          </ScrollView>

          {/* SECTION 3 */}
          <AwaText variant="titleLarge" emphasized style={styles.sectionTitle}>
            3. {content.contents[2]}
          </AwaText>

          <View style={styles.meanings}>
            {content.meanings.map(({name, text}, index) => (
              <View
                key={MEANING_DOTS[index]}
                style={styles.meaning}>
                <View
                  style={[
                    styles.dot,
                    {backgroundColor: MEANING_DOTS[index]},
                  ]}
                />

                <View style={styles.meaningCopy}>
                  <AwaText variant="labelSmall" emphasized>
                    {name}
                  </AwaText>

                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.meaningText}>
                    {text}
                  </AwaText>
                </View>
              </View>
            ))}
          </View>

          {/* SECTION 4 */}
          <AwaText variant="titleLarge" emphasized style={styles.sectionTitle}>
            4. {content.contents[3]}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.warning}>
            <Image
              source={WARNING}
              resizeMode="cover"
              style={styles.warningImage}
            />

            <View style={styles.warningOverlay}>
              <View style={styles.warningHeader}>
                <View style={styles.warningIcon}>
                  <MaterialDesignIcons
                    name="alert-circle-outline"
                    size={22}
                    color={theme.colors.warning}
                  />
                </View>

                <AwaText variant="titleSmall" emphasized style={styles.warningTitle}>
                  {content.warningTitle}
                </AwaText>
              </View>

              <View style={styles.warningList}>
                {content.warningItems.map(item => (
                  <View
                    key={item}
                    style={styles.warningRow}>
                    <View style={styles.warningBullet} />
                    <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.warningText}>
                      {item}
                    </AwaText>
                  </View>
                ))}
              </View>
            </View>
          </AwaCard>

          {/* SECTION 5 */}
          <AwaText variant="titleLarge" emphasized style={styles.sectionTitle}>
            5. {content.contents[4]}
          </AwaText>

          <View style={styles.advice}>
            {content.advice.map(({title, text}, index) => (
              <View
                key={title}
                style={styles.adviceCard}>
                <View style={styles.adviceIcon}>
                  <MaterialDesignIcons
                    name={ADVICE_ICONS[index] as never}
                    size={24}
                    color={theme.colors.primary}
                  />
                </View>

                <AwaText variant="labelSmall" emphasized style={styles.adviceTitle}>
                  {title}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.adviceText}>
                  {text}
                </AwaText>
              </View>
            ))}
          </View>

        </View>
      </ScrollView>

      <ReadingControls
        articleId={ID}
        durationMinutes={4}
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
    paddingBottom: 28,
  },

  heroWrap: {
    height: 255,
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
  },

  metaTopRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  metaDivider: {
    width: 1,
    height: 20,
    marginHorizontal: 12,
    backgroundColor: theme.colors.border,
  },

  metaValidatedRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    minHeight: 36,
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
    width: 23,
  },

  contentText: {
    flex: 1,
  },

  sectionTitle: {
    marginTop: 24,
    marginBottom: 12,
  },

  cards: {
    gap: 8,
    paddingRight: 8,
    paddingBottom: 3,
  },

  smallCard: {
    width: 136,
    minHeight: 178,
    padding: 12,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },

  dropIcon: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  textureImage: {
    width: 84,
    height: 68,
    borderRadius: 12,
  },

  cardTitle: {
    marginTop: 8,
    textAlign: 'center',
  },

  cardText: {
    marginTop: 8,
    textAlign: 'center',
  },

  meanings: {
    gap: 8,
  },

  meaning: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  dot: {
    width: 23,
    height: 23,
    borderRadius: 12,
    marginRight: 12,
  },

  meaningCopy: {
    flex: 1,
  },


  meaningText: {
    marginTop: 3,
  },

  warning: {
    marginTop: 3,
    overflow: 'hidden',
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },

  warningImage: {
    width: '100%',
    height: 120,
  },

  warningOverlay: {
    padding: 12,
  },

  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  warningIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(theme.colors.warning, 0.18),
  },

  warningTitle: {
    marginLeft: 12,
  },

  warningList: {
    marginTop: 12,
    gap: 8,
  },

  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  warningBullet: {
    width: 5,
    height: 5,
    marginTop: 8,
    marginRight: 8,
    borderRadius: 3,
    backgroundColor: theme.colors.warning,
  },

  warningText: {
    flex: 1,
  },

  advice: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  adviceCard: {
    width: '48.7%',
    minHeight: 124,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },

  adviceIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  adviceTitle: {
    marginTop: 8,
    textAlign: 'center',
  },

  adviceText: {
    marginTop: 4,
    textAlign: 'center',
  },

  });
}
