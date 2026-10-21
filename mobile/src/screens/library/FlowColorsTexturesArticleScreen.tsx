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
import {withBrazilianPortuguese} from '../../i18n/ptBrEditorial';

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
const CONTENT = withBrazilianPortuguese('FlowColorsTextures', {
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
  hi: {
    badge: 'चक्र और सेहत',
    title: 'पीरियड का फ़्लो: रंग और\nबनावट को समझें',
    metaDuration: '4 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'शुरुआती',
    metaValidated: 'समीक्षित सामग्री',
    intro: 'आपके पीरियड का रंग और बनावट आपके हार्मोनल स्वास्थ्य के बारे में काफ़ी कुछ बताते हैं। अपने चक्र को बेहतर समझने के लिए इन्हें पढ़ना सीखें।',
    contentsTitle: 'इस लेख में',
    contents: [
      'पीरियड के फ़्लो के रंग',
      'फ़्लो की बनावट',
      'हर रंग क्या संकेत दे सकता है',
      'कब चिंता करनी चाहिए?',
      'खुद को बेहतर जानने के हमारे सुझाव',
    ],
    colors: [
      {
        name: 'चटक लाल',
        text: 'ताज़ा फ़्लो, नया रक्त। पीरियड की शुरुआत में आम है।',
      },
      {
        name: 'गहरा लाल',
        text: 'पुराना रक्त, पीरियड के बीच के दिनों में सामान्य।',
      },
      {
        name: 'भूरा',
        text: 'ऑक्सीकृत रक्त, अक्सर पीरियड के अंत में।',
      },
      {
        name: 'गुलाबी',
        text: 'हल्के फ़्लो या हार्मोनल बदलाव का संकेत हो सकता है।',
      },
      {
        name: 'नारंगी',
        text: 'संक्रमण या असंतुलन से जुड़ा हो सकता है।',
      },
    ],
    textures: [
      {
        name: 'पतला',
        text: 'तरल फ़्लो, बिना थक्कों के।',
      },
      {
        name: 'मलाईदार',
        text: 'गाढ़ी, चिकनी बनावट।',
      },
      {
        name: 'थक्के',
        text: 'रक्त के छोटे या बड़े थक्के।',
      },
      {
        name: 'तंतुनुमा / म्यूकस',
        text: 'खिंचने वाला, साफ़ या सफ़ेदी लिए हुए।',
      },
      {
        name: 'ऊतक',
        text: 'ऊतक या झिल्ली के टुकड़े।',
      },
    ],
    meanings: [
      {
        name: 'चटक से गहरा लाल',
        text: 'सामान्य चक्र। आपका शरीर गर्भाशय की परत को बाहर निकाल रहा है।',
      },
      {
        name: 'भूरा',
        text: 'पुराना रक्त, चिंता की कोई बात नहीं।',
      },
      {
        name: 'गुलाबी',
        text: 'पीरियड की शुरुआत/अंत में या हार्मोनल असंतुलन के साथ हो सकता है।',
      },
      {
        name: 'नारंगी',
        text: 'अगर तेज़ गंध, खुजली या दर्द साथ हो तो ध्यान रखें।',
      },
    ],
    warningTitle: 'इन संकेतों पर ध्यान दें',
    warningItems: [
      'बहुत ज़्यादा रक्तस्राव (हर 1–2 घंटे में पैड/प्रोटेक्शन बदलना पड़े)',
      'बार-बार बहुत बड़े थक्के निकलना',
      'लगातार बनी रहने वाली बदबू या खुजली',
      'असामान्य रूप से तेज़ दर्द',
    ],
    advice: [
      {
        title: 'अपने फ़्लो को देखें',
        text: 'हर महीने होने वाले बदलाव नोट करें।',
      },
      {
        title: 'सही प्रोटेक्शन चुनें',
        text: 'अपने फ़्लो और आराम के अनुसार।',
      },
      {
        title: 'अपने शरीर की सुनें',
        text: 'यह आपको ज़रूरी संकेत देता है।',
      },
      {
        title: 'शक हो तो',
        text: 'स्वास्थ्य विशेषज्ञ से बात करें।',
      },
    ],
    shareMessage: 'पीरियड का फ़्लो: रंग और बनावट को समझें — AWA',
  },
  sq: {
    badge: 'CIKLI & MIREQENIA',
    title: 'Rrjedhja e menstruacioneve: t’i kuptojmë\nngjyrat dhe teksturat',
    metaDuration: '4 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Ngjyra dhe teksturë e menstruacioneve të tua thonë shumë për shëndetin tënd hormonal. Mëso t’i lexosh për ta kuptuar më mirë ciklin tënd.',
    contentsTitle: 'Në këtë artikull',
    contents: [
      'Ngjyrat e rrjedhjes menstruale',
      'Teksturat e rrjedhjes',
      'Çfarë mund të tregojë çdo ngjyrë',
      'Kur duhet të shqetësohesh?',
      'Këshillat tona për ta njohur më mirë veten',
    ],
    colors: [
      {
        name: 'E kuqe e ndezur',
        text: 'Rrjedhje e freskët, gjak i ri. E zakonshme në fillim të menstruacioneve.',
      },
      {
        name: 'E kuqe e errët',
        text: 'Gjak më i vjetër, normale në mes të ciklit.',
      },
      {
        name: 'Kafe',
        text: 'Gjak i oksiduar, shpesh në fund të menstruacioneve.',
      },
      {
        name: 'Rozë',
        text: 'Mund të tregojë rrjedhje të lehtë ose një ndryshim hormonal.',
      },
      {
        name: 'Portokalli',
        text: 'Mund të lidhet me një infeksion ose një çekuilibër.',
      },
    ],
    textures: [
      {
        name: 'E lëngshme',
        text: 'Rrjedhje e lëngët, pa copëza.',
      },
      {
        name: 'Kremoze',
        text: 'Teksturë e trashë dhe e butë.',
      },
      {
        name: 'Mpiksje',
        text: 'Mpiksje të vogla ose të mëdha gjaku.',
      },
      {
        name: 'Fije / Mukozë',
        text: 'E shtrirë, e tejdukshme ose e bardhë.',
      },
      {
        name: 'Ind',
        text: 'Copa indi ose membrane mukoze.',
      },
    ],
    meanings: [
      {
        name: 'E kuqe e ndezur deri në të errët',
        text: 'Cikël normal. Trupi yt po heq shtresën e mitrës.',
      },
      {
        name: 'Kafe',
        text: 'Gjak më i vjetër, nuk ka çfarë të shqetësohesh.',
      },
      {
        name: 'Rozë',
        text: 'Mund të ndodhë në fillim/fund të menstruacioneve ose me një çekuilibër hormonal.',
      },
      {
        name: 'Portokalli',
        text: 'Vëre në vëzhgim nëse shoqërohet me erë të fortë, kruarje ose dhimbje.',
      },
    ],
    warningTitle: 'Shenja për t’u vënë re',
    warningItems: [
      'Gjakderdhje shumë e bollshme (ndërrim i mbrojtëses çdo 1–2 orë)',
      'Dalje e rregullt e mpiksjeve shumë të mëdha',
      'Erë e keqe ose kruarje që vazhdon',
      'Dhimbje e pazakontë e fortë',
    ],
    advice: [
      {
        title: 'Vëzhgo rrjedhjen tënde',
        text: 'Shëno çdo ndryshim çdo muaj.',
      },
      {
        title: 'Zgjidh mbrojtësen e duhur',
        text: 'Sipas rrjedhjes sate dhe rehatisë sate.',
      },
      {
        title: 'Dëgjo trupin tënd',
        text: 'Ai të jep sinjale të çmuara.',
      },
      {
        title: 'Nëse ke dyshime',
        text: 'Flit me një profesionist të shëndetësisë.',
      },
    ],
    shareMessage: 'Rrjedhja e menstruacioneve: t’i kuptojmë ngjyrat dhe teksturat — AWA',
  },
  ja: {
    badge: '周期とウェルネス',
    title: '経血の色と質感を\n知ろう',
    metaDuration: '読了4分',
    metaType: 'ガイド',
    metaLevel: '初級',
    metaValidated: '確認済みの内容',
    intro: '経血の色や質感は、ホルモンの状態について多くのことを教えてくれます。読み取り方を知って、周期への理解を深めましょう。',
    contentsTitle: 'この記事の内容',
    contents: [
      '経血の色',
      '経血の質感',
      'それぞれの色が示すこと',
      '気をつけたいのはどんなとき？',
      '自分を知るためのヒント',
    ],
    colors: [
      {
        name: '鮮やかな赤',
        text: '新しい血液で、出たばかりの経血です。生理の始まりによく見られます。',
      },
      {
        name: '暗い赤',
        text: '時間のたった血液で、生理の中ほどでは普通に見られます。',
      },
      {
        name: '茶色',
        text: '酸化した血液で、生理の終わりごろによく見られます。',
      },
      {
        name: 'ピンク',
        text: '経血量が少ないか、ホルモンの変化を示していることがあります。',
      },
      {
        name: 'オレンジ',
        text: '感染症やバランスの乱れと関係していることがあります。',
      },
    ],
    textures: [
      {
        name: 'さらさら',
        text: '液状で、塊のない経血です。',
      },
      {
        name: 'クリーム状',
        text: 'とろみがあり、なめらかな質感です。',
      },
      {
        name: '血の塊',
        text: '小さな、または大きな血の塊です。',
      },
      {
        name: '糸を引く / 粘液状',
        text: 'よく伸びて、透明または白っぽいものです。',
      },
      {
        name: '組織片',
        text: '組織や粘膜のかけらのようなものです。',
      },
    ],
    meanings: [
      {
        name: '鮮やかな赤〜暗い赤',
        text: '正常な周期です。体が子宮内膜を排出しています。',
      },
      {
        name: '茶色',
        text: '時間のたった血液で、心配はいりません。',
      },
      {
        name: 'ピンク',
        text: '生理の始まりや終わりに見られたり、ホルモンバランスの乱れで起こったりすることがあります。',
      },
      {
        name: 'オレンジ',
        text: '強いにおい、かゆみ、痛みを伴う場合は、様子を見ておきましょう。',
      },
    ],
    warningTitle: '気をつけたい兆候',
    warningItems: [
      '非常に多い出血（1〜2時間ごとに生理用品を替える）',
      '非常に大きな塊が何度も出る',
      '悪臭やかゆみが続く',
      'いつもと違う強い痛み',
    ],
    advice: [
      {
        title: '経血を観察する',
        text: '毎月の変化を記録しましょう。',
      },
      {
        title: '合った生理用品を選ぶ',
        text: '経血量と快適さに合わせて選びましょう。',
      },
      {
        title: '体の声に耳を傾ける',
        text: '体は大切なサインを送ってくれます。',
      },
      {
        title: '迷ったときは',
        text: '医療従事者に相談しましょう。',
      },
    ],
    shareMessage: '経血の色と質感を知ろう — AWA',
  },
  ko: {
    badge: '주기와 웰니스',
    title: '생리 출혈:\n색과 질감 이해하기',
    metaDuration: '읽는 데 4분',
    metaType: '가이드',
    metaLevel: '입문',
    metaValidated: '검토된 콘텐츠',
    intro: '생리의 색과 질감은 호르몬 건강에 대해 많은 것을 알려 줘요. 읽는 법을 익혀서 내 주기를 더 잘 이해해 보세요.',
    contentsTitle: '이 아티클에서 다루는 내용',
    contents: [
      '생리 출혈의 색',
      '출혈의 질감',
      '색마다 어떤 의미일 수 있을까요?',
      '언제 걱정해야 할까요?',
      '나를 더 잘 알기 위한 팁',
    ],
    colors: [
      {
        name: '선홍색',
        text: '갓 나온 신선한 피예요. 생리 초반에 흔해요.',
      },
      {
        name: '짙은 붉은색',
        text: '오래된 피로, 생리 중반에는 정상이에요.',
      },
      {
        name: '갈색',
        text: '산화된 피로, 생리 끝날 무렵에 자주 보여요.',
      },
      {
        name: '분홍색',
        text: '출혈량이 적거나 호르몬 변화가 있다는 뜻일 수 있어요.',
      },
      {
        name: '주황색',
        text: '감염이나 불균형과 관련이 있을 수 있어요.',
      },
    ],
    textures: [
      {
        name: '묽은 질감',
        text: '덩어리 없이 흐르는 액체 같은 출혈이에요.',
      },
      {
        name: '크림 같은 질감',
        text: '되직하고 매끈한 질감이에요.',
      },
      {
        name: '혈괴',
        text: '작거나 큰 핏덩어리예요.',
      },
      {
        name: '끈적임 / 점액',
        text: '늘어나는 느낌이고 투명하거나 희뿌연 색이에요.',
      },
      {
        name: '조직',
        text: '조직이나 점막 조각이에요.',
      },
    ],
    meanings: [
      {
        name: '선홍색에서 짙은 붉은색',
        text: '정상적인 주기예요. 몸이 자궁내막을 배출하고 있어요.',
      },
      {
        name: '갈색',
        text: '오래된 피로, 걱정하지 않아도 돼요.',
      },
      {
        name: '분홍색',
        text: '생리 초반이나 끝 무렵, 또는 호르몬 불균형일 때 나타날 수 있어요.',
      },
      {
        name: '주황색',
        text: '강한 냄새, 가려움, 통증이 함께 있다면 주의 깊게 지켜보세요.',
      },
    ],
    warningTitle: '주의해야 할 신호',
    warningItems: [
      '출혈량이 매우 많을 때(1~2시간마다 생리용품을 교체해야 하는 경우)',
      '아주 큰 혈괴가 자주 나올 때',
      '나쁜 냄새나 가려움이 계속될 때',
      '평소보다 유난히 심한 통증',
    ],
    advice: [
      {
        title: '출혈 관찰하기',
        text: '매달 달라진 점을 기록해 보세요.',
      },
      {
        title: '알맞은 생리용품 고르기',
        text: '출혈량과 편안함에 맞춰 선택하세요.',
      },
      {
        title: '내 몸의 말에 귀 기울이기',
        text: '몸은 소중한 신호를 보내 줘요.',
      },
      {
        title: '의심스럽다면',
        text: '의료 전문가와 상담하세요.',
      },
    ],
    shareMessage: '생리 출혈: 색과 질감 이해하기 — AWA',
  },
  'pt-PT': {
    badge: 'CICLO E BEM-ESTAR',
    title: 'Fluxo menstrual: compreender\ncores e texturas',
    metaDuration: '4 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'A cor e a textura do seu período dizem muito sobre a sua saúde hormonal. Aprenda a interpretá-las para compreender melhor o seu ciclo.',
    contentsTitle: 'Neste artigo',
    contents: [
      'As cores do fluxo menstrual',
      'As texturas do fluxo',
      'O que cada cor pode indicar',
      'Quando se deve preocupar?',
      'As nossas dicas para se conhecer melhor',
    ],
    colors: [
      {
        name: 'Vermelho vivo',
        text: 'Fluxo recente, sangue novo. Frequente no início do período.',
      },
      {
        name: 'Vermelho escuro',
        text: 'Sangue mais antigo, normal a meio do período.',
      },
      {
        name: 'Castanho',
        text: 'Sangue oxidado, muitas vezes no fim do período.',
      },
      {
        name: 'Rosa',
        text: 'Pode indicar um fluxo ligeiro ou uma alteração hormonal.',
      },
      {
        name: 'Laranja',
        text: 'Pode estar associado a uma infeção ou a um desequilíbrio.',
      },
    ],
    textures: [
      {
        name: 'Fluida',
        text: 'Fluxo líquido, sem grumos.',
      },
      {
        name: 'Cremosa',
        text: 'Textura espessa e homogénea.',
      },
      {
        name: 'Coágulos',
        text: 'Pequenos ou grandes coágulos de sangue.',
      },
      {
        name: 'Filante / Muco',
        text: 'Elástico, transparente ou esbranquiçado.',
      },
      {
        name: 'Tecido',
        text: 'Fragmentos de tecido ou de mucosa.',
      },
    ],
    meanings: [
      {
        name: 'Vermelho vivo a escuro',
        text: 'Ciclo normal. O seu corpo está a eliminar o revestimento do útero.',
      },
      {
        name: 'Castanho',
        text: 'Sangue mais antigo, nada com que se preocupar.',
      },
      {
        name: 'Rosa',
        text: 'Pode ocorrer no início/fim do período ou num desequilíbrio hormonal.',
      },
      {
        name: 'Laranja',
        text: 'Fique atenta se vier acompanhado de odor forte, comichão ou dor.',
      },
    ],
    warningTitle: 'Sinais a vigiar',
    warningItems: [
      'Hemorragia muito abundante (trocar de proteção a cada 1–2 horas)',
      'Eliminar regularmente coágulos muito grandes',
      'Mau cheiro ou comichão persistentes',
      'Dor invulgarmente intensa',
    ],
    advice: [
      {
        title: 'Observe o seu fluxo',
        text: 'Anote as alterações todos os meses.',
      },
      {
        title: 'Escolha a proteção certa',
        text: 'Em função do seu fluxo e do seu conforto.',
      },
      {
        title: 'Ouça o seu corpo',
        text: 'Ele dá-lhe sinais valiosos.',
      },
      {
        title: 'Em caso de dúvida',
        text: 'Fale com um profissional de saúde.',
      },
    ],
    shareMessage: 'Fluxo menstrual: compreender cores e texturas — AWA',
  },
  bn: {
    badge: 'চক্র ও সুস্থতা',
    title: 'মাসিকের রক্তক্ষরণ: রং ও\nগঠন বোঝা',
    metaDuration: 'পড়তে 4 মিনিট',
    metaType: 'গাইড',
    metaLevel: 'প্রাথমিক',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'আপনার মাসিকের রং ও গঠন আপনার হরমোনজনিত স্বাস্থ্য সম্পর্কে অনেক কিছু বলে। আপনার চক্র আরও ভালোভাবে বুঝতে এগুলো পড়তে শিখুন।',
    contentsTitle: 'এই নিবন্ধে',
    contents: [
      'মাসিকের রক্তের রং',
      'রক্তক্ষরণের গঠন',
      'প্রতিটি রং কী নির্দেশ করতে পারে',
      'কখন চিন্তিত হবেন?',
      'নিজেকে আরও ভালোভাবে জানার জন্য আমাদের টিপস',
    ],
    colors: [
      {
        name: 'উজ্জ্বল লাল',
        text: 'তাজা রক্তক্ষরণ, নতুন রক্ত। মাসিকের শুরুতে এটি সাধারণ।',
      },
      {
        name: 'গাঢ় লাল',
        text: 'পুরোনো রক্ত, চক্রের মাঝামাঝি সময়ে স্বাভাবিক।',
      },
      {
        name: 'বাদামি',
        text: 'জারিত রক্ত, প্রায়ই মাসিকের শেষে দেখা যায়।',
      },
      {
        name: 'গোলাপি',
        text: 'হালকা রক্তক্ষরণ বা হরমোনের পরিবর্তন নির্দেশ করতে পারে।',
      },
      {
        name: 'কমলা',
        text: 'সংক্রমণ বা ভারসাম্যহীনতার সঙ্গে সম্পর্কিত হতে পারে।',
      },
    ],
    textures: [
      {
        name: 'তরল',
        text: 'পাতলা রক্তক্ষরণ, কোনো চাকা ছাড়া।',
      },
      {
        name: 'ক্রিমের মতো',
        text: 'ঘন, মসৃণ গঠন।',
      },
      {
        name: 'রক্তের চাকা',
        text: 'ছোট বা বড় রক্তের চাকা।',
      },
      {
        name: 'সুতার মতো / শ্লেষ্মা',
        text: 'টানলে বাড়ে এমন, স্বচ্ছ বা সাদাটে।',
      },
      {
        name: 'টিস্যু',
        text: 'টিস্যু বা শ্লেষ্মা ঝিল্লির টুকরো।',
      },
    ],
    meanings: [
      {
        name: 'উজ্জ্বল থেকে গাঢ় লাল',
        text: 'স্বাভাবিক চক্র। আপনার শরীর জরায়ুর আস্তরণ ঝরিয়ে দিচ্ছে।',
      },
      {
        name: 'বাদামি',
        text: 'পুরোনো রক্ত, চিন্তার কিছু নেই।',
      },
      {
        name: 'গোলাপি',
        text: 'মাসিকের শুরুতে/শেষে অথবা হরমোনের ভারসাম্যহীনতায় দেখা দিতে পারে।',
      },
      {
        name: 'কমলা',
        text: 'তীব্র গন্ধ, চুলকানি বা ব্যথা থাকলে নজর রাখুন।',
      },
    ],
    warningTitle: 'যেসব লক্ষণে নজর রাখবেন',
    warningItems: [
      'খুব বেশি রক্তক্ষরণ (প্রতি 1–2 ঘণ্টায় সুরক্ষা বদলাতে হওয়া)',
      'নিয়মিতভাবে খুব বড় রক্তের চাকা বের হওয়া',
      'ক্রমাগত দুর্গন্ধ বা চুলকানি',
      'অস্বাভাবিক তীব্র ব্যথা',
    ],
    advice: [
      {
        title: 'আপনার রক্তক্ষরণ পর্যবেক্ষণ করুন',
        text: 'প্রতি মাসে যেকোনো পরিবর্তন লিখে রাখুন।',
      },
      {
        title: 'সঠিক সুরক্ষা বেছে নিন',
        text: 'আপনার রক্তক্ষরণের পরিমাণ ও স্বাচ্ছন্দ্য অনুযায়ী।',
      },
      {
        title: 'নিজের শরীরের কথা শুনুন',
        text: 'এটি আপনাকে মূল্যবান সংকেত দেয়।',
      },
      {
        title: 'সন্দেহ হলে',
        text: 'একজন স্বাস্থ্যসেবা পেশাজীবীর সঙ্গে কথা বলুন।',
      },
    ],
    shareMessage: 'মাসিকের রক্তক্ষরণ: রং ও গঠন বোঝা — AWA',
  },
} as const);

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
