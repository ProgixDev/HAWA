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
  da: {
    badge: 'CYKLUS OG VELVÆRE',
    title: 'Menstruationsblødning:\nforstå farver og konsistens',
    metaDuration: '4 min læsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemgået indhold',
    intro: 'Farven og konsistensen af din menstruation fortæller meget om dit hormonelle helbred. Lær at læse dem for bedre at forstå din cyklus.',
    contentsTitle: 'I denne artikel',
    contents: [
      'Menstruationsblødningens farver',
      'Blødningens konsistens',
      'Hvad hver farve kan betyde',
      'Hvornår skal du bekymre dig?',
      'Vores tips til bedre at kende dig selv',
    ],
    colors: [
      {
        name: 'Klar rød',
        text: 'Frisk blødning, nyt blod. Normalt i starten af menstruationen.',
      },
      {
        name: 'Mørk rød',
        text: 'Ældre blod, normalt midt i cyklussen.',
      },
      {
        name: 'Brun',
        text: 'Oxideret blod, ses ofte mod slutningen af menstruationen.',
      },
      {
        name: 'Lyserød',
        text: 'Kan indikere let blødning eller hormonelle forandringer.',
      },
      {
        name: 'Orange',
        text: 'Kan være forbundet med infektion eller ubalance.',
      },
    ],
    textures: [
      {
        name: 'Flydende',
        text: 'Tynd blødning uden klumper.',
      },
      {
        name: 'Cremet',
        text: 'Tyk, glat konsistens.',
      },
      {
        name: 'Blodklumper',
        text: 'Små eller store blodklumper.',
      },
      {
        name: 'Trådformet / slim',
        text: 'Strækker sig, gennemsigtig eller hvidlig.',
      },
      {
        name: 'Vævsstykker',
        text: 'Stykker af væv eller slimhinde.',
      },
    ],
    meanings: [
      {
        name: 'Klar til mørk rød',
        text: 'Normal cyklus. Din krop støder livmoderslimlinden af.',
      },
      {
        name: 'Brun',
        text: 'Gammelt blod, intet at bekymre sig om.',
      },
      {
        name: 'Lyserød',
        text: 'Kan forekomme i starten/slutningen af menstruationen eller ved hormonel ubalance.',
      },
      {
        name: 'Orange',
        text: 'Vær opmærksom, hvis der er kraftig lugt, kløe eller smerter.',
      },
    ],
    warningTitle: 'Tegn du bør holde øje med',
    warningItems: [
      'Meget kraftig blødning (skal skifte bind/tampon hver 1–2 time)',
      'Regelmæssigt meget store blodklumper',
      'Vedvarende ubehagelig lugt eller kløe',
      'Usædvanligt stærke smerter',
    ],
    advice: [
      {
        title: 'Observer din blødning',
        text: 'Notér enhver forandring fra måned til måned.',
      },
      {
        title: 'Vælg den rette beskyttelse',
        text: 'Tilpasset mængden af din blødning og din komfort.',
      },
      {
        title: 'Lyt til din krop',
        text: 'Den sender dig værdifulde signaler.',
      },
      {
        title: 'Hvis du er i tvivl',
        text: 'Tal med en sundhedsfaglig person.',
      },
    ],
    shareMessage: 'Menstruationsblødning: forstå farver og konsistens — AWA',
  },
  sv: {
    badge: 'CYKLUS OG VELVÄRE',
    title: 'Menstruationsblödning:\nforstå farver och konsistens',
    metaDuration: '4 min läsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemgået indhold',
    intro: 'Farven och konsistensen av din menstruation fortäller mycket om ditt hormonelle helbred. Lär at läse dem for bedre at forstå din cyklus.',
    contentsTitle: 'I denne artikel',
    contents: [
      'Menstruationsblödningens farver',
      'Blödningens konsistens',
      'Hvad hver farve kan betyde',
      'Hvornår skal du bekymre dig?',
      'Vores tips till bedre at kende dig selv',
    ],
    colors: [
      {
        name: 'Klar röd',
        text: 'Frisk blödning, nyt blod. Normalt i starten av menstruationen.',
      },
      {
        name: 'Mörk röd',
        text: 'Äldre blod, normalt midt i cyklussen.',
      },
      {
        name: 'Brun',
        text: 'Oxideret blod, ses ofta mod slutningen av menstruationen.',
      },
      {
        name: 'Lyseröd',
        text: 'Kan indikere let blödning eller hormonelle forandringer.',
      },
      {
        name: 'Orange',
        text: 'Kan väre forbundet med infektion eller ubalance.',
      },
    ],
    textures: [
      {
        name: 'Flydende',
        text: 'Tynd blödning uden klumper.',
      },
      {
        name: 'Cremet',
        text: 'Tyk, glat konsistens.',
      },
      {
        name: 'Blodklumper',
        text: 'Små eller store blodklumper.',
      },
      {
        name: 'Trådformet / slim',
        text: 'Sträkker sig, gennemsigtig eller hvidlig.',
      },
      {
        name: 'Vävsstykker',
        text: 'Stykker av väv eller slimhinde.',
      },
    ],
    meanings: [
      {
        name: 'Klar till mörk röd',
        text: 'Normal cyklus. Din krop stöder livmoderslimlinden av.',
      },
      {
        name: 'Brun',
        text: 'Gammelt blod, intet at bekymre sig om.',
      },
      {
        name: 'Lyseröd',
        text: 'Kan forekomme i starten/slutningen av menstruationen eller ved hormonel ubalance.',
      },
      {
        name: 'Orange',
        text: 'Vär opmärksom, hvis der ar kraftig lugt, klöe eller smerter.',
      },
    ],
    warningTitle: 'Tegn du bör holde öje med',
    warningItems: [
      'Meget kraftig blödning (skal skifte bind/tampon hver 1–2 time)',
      'Regelmässigt mycket store blodklumper',
      'Vedvarende ubehagelig lugt eller klöe',
      'Usädvanligt stärke smerter',
    ],
    advice: [
      {
        title: 'Observer din blödning',
        text: 'Notér enhver forandring fran måned till måned.',
      },
      {
        title: 'Välg den rette beskyttelse',
        text: 'Tilpasset mängden av din blödning och din komfort.',
      },
      {
        title: 'Lyt till din krop',
        text: 'Den sender dig värdifulde signaler.',
      },
      {
        title: 'Hvis du ar i tvivl',
        text: 'Tal med en halsasfaglig person.',
      },
    ],
    shareMessage: 'Menstruationsblödning: forstå farver och konsistens — AWA',
  },
  nb: {
    badge: 'SYKLUS OG VELVÆRE',
    title: 'Menstruasjonsblødning: forstå\nfarger og konsistens',
    metaDuration: '4 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Nybegynner',
    metaValidated: 'Gjennomgått innhold',
    intro:
      'Fargen og konsistensen på mensen sier mye om den hormonelle helsen din. Lær å tolke dem for å forstå syklusen din bedre.',
    contentsTitle: 'I denne artikkelen',
    contents: [
      'Fargene på menstruasjonsblødningen',
      'Konsistensen på blødningen',
      'Hva hver farge kan tyde på',
      'Når bør du bekymre deg?',
      'Våre tips for å kjenne deg selv bedre',
    ],
    colors: [
      {name: 'Knallrød', text: 'Fersk blødning, nytt blod. Vanlig i starten av mensen.'},
      {name: 'Mørkerød', text: 'Eldre blod, normalt midt i mensen.'},
      {name: 'Brun', text: 'Oksidert blod, ofte mot slutten av mensen.'},
      {name: 'Rosa', text: 'Kan tyde på lett blødning eller en hormonell endring.'},
      {name: 'Oransje', text: 'Kan være knyttet til en infeksjon eller en ubalanse.'},
    ],
    textures: [
      {name: 'Flytende', text: 'Flytende blødning, uten klumper.'},
      {name: 'Kremaktig', text: 'Tykk, jevn konsistens.'},
      {name: 'Blodpropper', text: 'Små eller store blodpropper.'},
      {name: 'Trådaktig / slim', text: 'Strekkbart, klart eller hvitaktig.'},
      {name: 'Vev', text: 'Biter av vev eller slimhinne.'},
    ],
    meanings: [
      {name: 'Knallrød til mørkerød', text: 'Normal syklus. Kroppen din støter ut livmorslimhinnen.'},
      {name: 'Brun', text: 'Eldre blod, ikke noe å bekymre seg for.'},
      {name: 'Rosa', text: 'Kan forekomme i starten/slutten av mensen eller ved en hormonell ubalanse.'},
      {name: 'Oransje', text: 'Følg med hvis det er ledsaget av sterk lukt, kløe eller smerte.'},
    ],
    warningTitle: 'Tegn å være oppmerksom på',
    warningItems: [
      'Svært kraftig blødning (bytte beskyttelse hver 1.–2. time)',
      'Jevnlig avgang av svært store blodpropper',
      'Vedvarende vond lukt eller kløe',
      'Uvanlig sterke smerter',
    ],
    advice: [
      {title: 'Observer blødningen din', text: 'Noter eventuelle endringer hver måned.'},
      {title: 'Velg riktig beskyttelse', text: 'Ut fra blødningen og komforten din.'},
      {title: 'Lytt til kroppen din', text: 'Den gir deg verdifulle signaler.'},
      {title: 'Ved tvil', text: 'Snakk med helsepersonell.'},
    ],
    shareMessage: 'Menstruasjonsblødning: forstå farger og konsistens – AWA',
  },
  pl: {
    badge: 'CYKL I DOBROSTAN',
    title: 'Krwawienie miesiączkowe: zrozumieć\nkolory i konsystencje',
    metaDuration: '4 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść zweryfikowana',
    intro:
      'Kolor i konsystencja krwawienia wiele mówią o Twoim zdrowiu hormonalnym. Naucz się je odczytywać, by lepiej rozumieć swój cykl.',
    contentsTitle: 'W tym artykule',
    contents: [
      'Kolory krwawienia miesiączkowego',
      'Konsystencje krwawienia',
      'Co może oznaczać każdy kolor',
      'Kiedy warto się niepokoić?',
      'Nasze wskazówki, jak lepiej poznać siebie',
    ],
    colors: [
      {name: 'Jasnoczerwony', text: 'Świeże krwawienie, nowa krew. Częste na początku miesiączki.'},
      {name: 'Ciemnoczerwony', text: 'Starsza krew, normalna w środku cyklu.'},
      {name: 'Brązowy', text: 'Utleniona krew, często pod koniec miesiączki.'},
      {name: 'Różowy', text: 'Może wskazywać na skąpe krwawienie lub zmianę hormonalną.'},
      {name: 'Pomarańczowy', text: 'Może być związany z infekcją lub zaburzeniem równowagi.'},
    ],
    textures: [
      {name: 'Płynna', text: 'Płynne krwawienie, bez grudek.'},
      {name: 'Kremowa', text: 'Gęsta, gładka konsystencja.'},
      {name: 'Skrzepy', text: 'Małe lub duże skrzepy krwi.'},
      {name: 'Ciągnąca się / śluzowa', text: 'Rozciągliwa, przejrzysta lub biaława.'},
      {name: 'Tkankowa', text: 'Fragmenty tkanki lub błony śluzowej.'},
    ],
    meanings: [
      {name: 'Od jasno- do ciemnoczerwonego', text: 'Prawidłowy cykl. Twoje ciało usuwa błonę śluzową macicy.'},
      {name: 'Brązowy', text: 'Starsza krew, nie ma powodu do niepokoju.'},
      {name: 'Różowy', text: 'Może pojawiać się na początku/końcu miesiączki lub przy zaburzeniu równowagi hormonalnej.'},
      {name: 'Pomarańczowy', text: 'Obserwuj, jeśli towarzyszy mu silny zapach, swędzenie lub ból.'},
    ],
    warningTitle: 'Oznaki, na które warto zwracać uwagę',
    warningItems: [
      'Bardzo obfite krwawienie (zmiana środka ochrony co 1–2 godziny)',
      'Regularne oddawanie bardzo dużych skrzepów',
      'Uporczywy nieprzyjemny zapach lub swędzenie',
      'Wyjątkowo silny ból',
    ],
    advice: [
      {title: 'Obserwuj swoje krwawienie', text: 'Zapisuj zmiany w każdym miesiącu.'},
      {title: 'Wybierz odpowiedni środek ochrony', text: 'W zależności od obfitości krwawienia i komfortu.'},
      {title: 'Słuchaj swojego ciała', text: 'Daje Ci cenne sygnały.'},
      {title: 'W razie wątpliwości', text: 'Porozmawiaj ze specjalistą.'},
    ],
    shareMessage: 'Krwawienie miesiączkowe: zrozumieć kolory i konsystencje — AWA',
  },
  uk: {
    badge: 'ЦИКЛ І САМОПОЧУТТЯ',
    title: 'Менструальні виділення: розуміння\nкольорів і текстур',
    metaDuration: '4 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Початковий',
    metaValidated: 'Перевірений вміст',
    intro:
      'Колір і текстура вашої менструації багато говорять про ваше гормональне здоров’я. Навчіться їх читати, щоб краще розуміти свій цикл.',
    contentsTitle: 'У цій статті',
    contents: [
      'Кольори менструальних виділень',
      'Текстури виділень',
      'Що може означати кожен колір',
      'Коли варто турбуватися?',
      'Наші поради, як краще пізнати себе',
    ],
    colors: [
      {name: 'Яскраво-червоний', text: 'Свіжі виділення, нова кров. Часто на початку менструації.'},
      {name: 'Темно-червоний', text: 'Старіша кров, нормальна в середині циклу.'},
      {name: 'Коричневий', text: 'Окиснена кров, часто наприкінці менструації.'},
      {name: 'Рожевий', text: 'Може вказувати на слабкі виділення або гормональну зміну.'},
      {name: 'Помаранчевий', text: 'Може бути пов’язаний з інфекцією або порушенням рівноваги.'},
    ],
    textures: [
      {name: 'Рідка', text: 'Рідкі виділення, без грудочок.'},
      {name: 'Кремоподібна', text: 'Густа, гладка текстура.'},
      {name: 'Згустки', text: 'Малі або великі згустки крові.'},
      {name: 'Тягуча / слизова', text: 'Тягуча, прозора або білувата.'},
      {name: 'Тканинна', text: 'Шматочки тканини або слизової оболонки.'},
    ],
    meanings: [
      {name: 'Від яскраво- до темно-червоного', text: 'Нормальний цикл. Ваше тіло виводить слизову оболонку матки.'},
      {name: 'Коричневий', text: 'Старіша кров, нічого тривожного.'},
      {name: 'Рожевий', text: 'Може траплятися на початку/в кінці менструації або при гормональному дисбалансі.'},
      {name: 'Помаранчевий', text: 'Спостерігайте, якщо його супроводжують різкий запах, свербіж або біль.'},
    ],
    warningTitle: 'Ознаки, на які варто звертати увагу',
    warningItems: [
      'Дуже рясна кровотеча (зміна засобу гігієни кожні 1–2 години)',
      'Регулярне виділення дуже великих згустків',
      'Стійкий неприємний запах або свербіж',
      'Незвично сильний біль',
    ],
    advice: [
      {title: 'Спостерігайте виділення', text: 'Занотовуйте зміни щомісяця.'},
      {title: 'Оберіть відповідний засіб гігієни', text: 'Залежно від виділень і вашого комфорту.'},
      {title: 'Прислухайтеся до тіла', text: 'Воно дає вам цінні сигнали.'},
      {title: 'У разі сумнівів', text: 'Поговоріть із медичним фахівцем.'},
    ],
    shareMessage: 'Менструальні виділення: розуміння кольорів і текстур — AWA',
  },
  cs: {
    badge: 'CYKLUS A POHODA',
    title: 'Menstruační krvácení: pochopení\nbarev a konzistence',
    metaDuration: '4 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Začátečník',
    metaValidated: 'Ověřený obsah',
    intro:
      'Barva a konzistence menstruace vypovídají hodně o vašem hormonálním zdraví. Naučte se je číst, abyste lépe porozuměla svému cyklu.',
    contentsTitle: 'V tomto článku',
    contents: [
      'Barvy menstruačního krvácení',
      'Konzistence krvácení',
      'Co může každá barva naznačovat',
      'Kdy mít obavy?',
      'Naše tipy, jak se lépe poznat',
    ],
    colors: [
      {name: 'Jasně červená', text: 'Čerstvé krvácení, nová krev. Běžná na začátku menstruace.'},
      {name: 'Tmavě červená', text: 'Starší krev, normální uprostřed cyklu.'},
      {name: 'Hnědá', text: 'Zoxidovaná krev, často na konci menstruace.'},
      {name: 'Růžová', text: 'Může naznačovat slabé krvácení nebo hormonální změnu.'},
      {name: 'Oranžová', text: 'Může souviset s infekcí nebo nerovnováhou.'},
    ],
    textures: [
      {name: 'Tekutá', text: 'Tekuté krvácení, bez shluků.'},
      {name: 'Krémová', text: 'Hustá, hladká konzistence.'},
      {name: 'Sraženiny', text: 'Malé nebo velké krevní sraženiny.'},
      {name: 'Vláknitá / hlen', text: 'Tažná, čirá nebo bělavá.'},
      {name: 'Tkáň', text: 'Kousky tkáně nebo sliznice.'},
    ],
    meanings: [
      {name: 'Jasně až tmavě červená', text: 'Normální cyklus. Vaše tělo odlučuje děložní sliznici.'},
      {name: 'Hnědá', text: 'Starší krev, není se čeho obávat.'},
      {name: 'Růžová', text: 'Může se objevit na začátku/konci menstruace nebo při hormonální nerovnováze.'},
      {name: 'Oranžová', text: 'Sledujte ji, pokud je doprovázena silným zápachem, svěděním nebo bolestí.'},
    ],
    warningTitle: 'Příznaky, kterých si všímat',
    warningItems: [
      'Velmi silné krvácení (výměna ochrany každé 1–2 hodiny)',
      'Pravidelné odcházení velmi velkých sraženin',
      'Přetrvávající nepříjemný zápach nebo svědění',
      'Neobvykle intenzivní bolest',
    ],
    advice: [
      {title: 'Pozorujte své krvácení', text: 'Poznamenávejte si změny každý měsíc.'},
      {title: 'Zvolte správnou ochranu', text: 'Podle množství krvácení a svého pohodlí.'},
      {title: 'Naslouchejte svému tělu', text: 'Dává vám cenné signály.'},
      {title: 'V případě pochybností', text: 'Promluvte si se zdravotnickým pracovníkem.'},
    ],
    shareMessage: 'Menstruační krvácení: pochopení barev a konzistence — AWA',
  },
  sk: {
    badge: 'CYKLUS A POHODA',
    title: 'Menštruačné krvácanie: pochopenie\nfarieb a štruktúr',
    metaDuration: '4 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Začiatočník',
    metaValidated: 'Overený obsah',
    intro:
      'Farba a štruktúra vašej menštruácie veľa prezrádzajú o vašom hormonálnom zdraví. Naučte sa ich čítať, aby ste lepšie porozumeli svojmu cyklu.',
    contentsTitle: 'V tomto článku',
    contents: [
      'Farby menštruačného krvácania',
      'Štruktúry krvácania',
      'Čo môže každá farba naznačovať',
      'Kedy by ste mali mať obavy?',
      'Naše tipy, ako sa lepšie spoznať',
    ],
    colors: [
      {name: 'Jasne červená', text: 'Čerstvé krvácanie, nová krv. Bežná na začiatku menštruácie.'},
      {name: 'Tmavočervená', text: 'Staršia krv, normálna v strede menštruácie.'},
      {name: 'Hnedá', text: 'Zoxidovaná krv, často na konci menštruácie.'},
      {name: 'Ružová', text: 'Môže naznačovať slabé krvácanie alebo hormonálnu zmenu.'},
      {name: 'Oranžová', text: 'Môže súvisieť s infekciou alebo nerovnováhou.'},
    ],
    textures: [
      {name: 'Tekutá', text: 'Tekuté krvácanie, bez zrazenín.'},
      {name: 'Krémová', text: 'Hustá, hladká štruktúra.'},
      {name: 'Zrazeniny', text: 'Malé alebo veľké krvné zrazeniny.'},
      {name: 'Vláknitá / hlien', text: 'Ťahavá, číra alebo belavá.'},
      {name: 'Tkanivo', text: 'Kúsky tkaniva alebo sliznice.'},
    ],
    meanings: [
      {name: 'Jasne až tmavo červená', text: 'Normálny cyklus. Vaše telo odlupuje sliznicu maternice.'},
      {name: 'Hnedá', text: 'Staršia krv, niet sa čoho obávať.'},
      {name: 'Ružová', text: 'Môže sa objaviť na začiatku/konci menštruácie alebo pri hormonálnej nerovnováhe.'},
      {name: 'Oranžová', text: 'Sledujte ju, ak ju sprevádza silný zápach, svrbenie alebo bolesť.'},
    ],
    warningTitle: 'Znaky, ktoré treba sledovať',
    warningItems: [
      'Veľmi silné krvácanie (výmena pomôcky každú 1 – 2 hodiny)',
      'Pravidelné vylučovanie veľmi veľkých zrazenín',
      'Pretrvávajúci zlý zápach alebo svrbenie',
      'Nezvyčajne intenzívna bolesť',
    ],
    advice: [
      {title: 'Sledujte svoje krvácanie', text: 'Zaznamenávajte zmeny každý mesiac.'},
      {title: 'Zvoľte správnu pomôcku', text: 'Podľa intenzity krvácania a vášho pohodlia.'},
      {title: 'Počúvajte svoje telo', text: 'Dáva vám cenné signály.'},
      {title: 'Pri pochybnostiach', text: 'Porozprávajte sa so zdravotníckym pracovníkom.'},
    ],
    shareMessage: 'Menštruačné krvácanie: pochopenie farieb a štruktúr — AWA',
  },
  hu: {
    badge: 'CIKLUS ÉS JÓLÉT',
    title: 'Menstruációs vérzés: a színek\nés az állagok megértése',
    metaDuration: '4 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Kezdő',
    metaValidated: 'Ellenőrzött tartalom',
    intro:
      'A menstruációd színe és állaga sokat elárul a hormonális egészségedről. Tanuld meg olvasni őket, hogy jobban megértsd a ciklusodat.',
    contentsTitle: 'Ebben a cikkben',
    contents: [
      'A menstruációs vérzés színei',
      'A vérzés állagai',
      'Mit jelezhet az egyes szín',
      'Mikor kell aggódnod?',
      'Tippjeink a jobb önismerethez',
    ],
    colors: [
      {name: 'Élénkvörös', text: 'Friss vérzés, új vér. Gyakori a menstruáció elején.'},
      {name: 'Sötétvörös', text: 'Régebbi vér, a menstruáció közepén normális.'},
      {name: 'Barna', text: 'Oxidálódott vér, gyakran a menstruáció végén.'},
      {name: 'Rózsaszín', text: 'Gyenge vérzést vagy hormonális változást jelezhet.'},
      {name: 'Narancssárga', text: 'Fertőzéssel vagy egyensúlyzavarral függhet össze.'},
    ],
    textures: [
      {name: 'Folyékony', text: 'Híg vérzés, rögök nélkül.'},
      {name: 'Krémes', text: 'Sűrű, sima állag.'},
      {name: 'Vérrögök', text: 'Kisebb vagy nagyobb vérrögök.'},
      {name: 'Nyúlós / nyálkás', text: 'Nyúlós, átlátszó vagy fehéres.'},
      {name: 'Szövetdarabok', text: 'Szövet- vagy nyálkahártya-darabok.'},
    ],
    meanings: [
      {name: 'Élénk- és sötétvörös', text: 'Normális ciklus. A tested leválasztja a méhnyálkahártyát.'},
      {name: 'Barna', text: 'Régebbi vér, nincs ok aggodalomra.'},
      {name: 'Rózsaszín', text: 'Előfordulhat a menstruáció elején/végén vagy hormonális egyensúlyzavar esetén.'},
      {name: 'Narancssárga', text: 'Figyeld, ha erős szag, viszketés vagy fájdalom kíséri.'},
    ],
    warningTitle: 'Figyelendő jelek',
    warningItems: [
      'Nagyon erős vérzés (a higiéniai termék cseréje 1–2 óránként)',
      'Rendszeresen nagyon nagy vérrögök távoznak',
      'Tartós kellemetlen szag vagy viszketés',
      'Szokatlanul intenzív fájdalom',
    ],
    advice: [
      {title: 'Figyeld meg a vérzésedet', text: 'Jegyezd fel a változásokat minden hónapban.'},
      {title: 'Válaszd ki a megfelelő terméket', text: 'A vérzésed erőssége és a kényelmed alapján.'},
      {title: 'Figyelj a testedre', text: 'Értékes jeleket ad neked.'},
      {title: 'Kétség esetén', text: 'Beszélj egészségügyi szakemberrel.'},
    ],
    shareMessage: 'Menstruációs vérzés: a színek és az állagok megértése — AWA',
  },
  ro: {
    badge: 'CICLU ȘI BUNĂSTARE',
    title: 'Fluxul menstrual: înțelegerea\nculorilor și a texturilor',
    metaDuration: '4 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Începător',
    metaValidated: 'Conținut revizuit',
    intro:
      'Culoarea și textura menstruației spun multe despre sănătatea ta hormonală. Învață să le citești pentru a-ți înțelege mai bine ciclul.',
    contentsTitle: 'În acest articol',
    contents: [
      'Culorile fluxului menstrual',
      'Texturile fluxului',
      'Ce poate indica fiecare culoare',
      'Când ar trebui să fii îngrijorată?',
      'Sfaturile noastre pentru a te cunoaște mai bine',
    ],
    colors: [
      {name: 'Roșu aprins', text: 'Flux proaspăt, sânge nou. Frecvent la începutul menstruației.'},
      {name: 'Roșu închis', text: 'Sânge mai vechi, normal la mijlocul ciclului.'},
      {name: 'Maro', text: 'Sânge oxidat, adesea la sfârșitul menstruației.'},
      {name: 'Roz', text: 'Poate indica un flux ușor sau o schimbare hormonală.'},
      {name: 'Portocaliu', text: 'Poate fi legat de o infecție sau de un dezechilibru.'},
    ],
    textures: [
      {name: 'Fluid', text: 'Flux lichid, fără cheaguri.'},
      {name: 'Cremos', text: 'Textură groasă, netedă.'},
      {name: 'Cheaguri', text: 'Cheaguri de sânge mici sau mari.'},
      {name: 'Filant / Mucus', text: 'Elastic, limpede sau albicios.'},
      {name: 'Țesut', text: 'Bucăți de țesut sau de mucoasă.'},
    ],
    meanings: [
      {name: 'De la roșu aprins la roșu închis', text: 'Ciclu normal. Corpul tău elimină mucoasa uterină.'},
      {name: 'Maro', text: 'Sânge mai vechi, nimic de care să te îngrijorezi.'},
      {name: 'Roz', text: 'Poate apărea la începutul/sfârșitul menstruației sau în cazul unui dezechilibru hormonal.'},
      {name: 'Portocaliu', text: 'Urmărește-l dacă este însoțit de un miros puternic, mâncărime sau durere.'},
    ],
    warningTitle: 'Semne de urmărit',
    warningItems: [
      'Sângerare foarte abundentă (schimbarea protecției la fiecare 1–2 ore)',
      'Eliminarea regulată de cheaguri foarte mari',
      'Miros neplăcut sau mâncărime persistente',
      'Durere neobișnuit de intensă',
    ],
    advice: [
      {title: 'Observă-ți fluxul', text: 'Notează orice schimbări în fiecare lună.'},
      {title: 'Alege protecția potrivită', text: 'În funcție de flux și de confortul tău.'},
      {title: 'Ascultă-ți corpul', text: 'Îți oferă semnale prețioase.'},
      {title: 'Dacă ai îndoieli', text: 'Vorbește cu un profesionist din domeniul sănătății.'},
    ],
    shareMessage: 'Fluxul menstrual: înțelegerea culorilor și a texturilor — AWA',
  },
  bg: {
    badge: 'ЦИКЪЛ И БЛАГОПОЛУЧИЕ',
    title: 'Менструален поток: разбиране\nна цветовете и консистенциите',
    metaDuration: '4 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Начинаещ',
    metaValidated: 'Проверено съдържание',
    intro:
      'Цветът и консистенцията на менструацията ти говорят много за хормоналното ти здраве. Научи се да ги разчиташ, за да разбираш по-добре цикъла си.',
    contentsTitle: 'В тази статия',
    contents: [
      'Цветовете на менструалния поток',
      'Консистенциите на потока',
      'Какво може да показва всеки цвят',
      'Кога трябва да се тревожиш?',
      'Нашите съвети, за да се познаваш по-добре',
    ],
    colors: [
      {name: 'Ярко червено', text: 'Пресен поток, нова кръв. Често в началото на менструацията.'},
      {name: 'Тъмночервено', text: 'По-стара кръв, нормално в средата на цикъла.'},
      {name: 'Кафяво', text: 'Окислена кръв, често в края на менструацията.'},
      {name: 'Розово', text: 'Може да показва слаб поток или хормонална промяна.'},
      {name: 'Оранжево', text: 'Може да е свързано с инфекция или дисбаланс.'},
    ],
    textures: [
      {name: 'Течен', text: 'Течен поток, без бучки.'},
      {name: 'Кремообразен', text: 'Гъста, гладка консистенция.'},
      {name: 'Съсиреци', text: 'Малки или големи кръвни съсиреци.'},
      {name: 'Нишковиден / Слуз', text: 'Разтегливо, бистро или белезникаво.'},
      {name: 'Тъкан', text: 'Парчета тъкан или лигавица.'},
    ],
    meanings: [
      {name: 'От ярко до тъмночервено', text: 'Нормален цикъл. Тялото ти отделя маточната лигавица.'},
      {name: 'Кафяво', text: 'По-стара кръв, нищо тревожно.'},
      {name: 'Розово', text: 'Може да се появи в началото/края на менструацията или при хормонален дисбаланс.'},
      {name: 'Оранжево', text: 'Следи го, ако е придружено от силна миризма, сърбеж или болка.'},
    ],
    warningTitle: 'Признаци, които да следиш',
    warningItems: [
      'Много силно кървене (смяна на защитата на всеки 1–2 часа)',
      'Редовно отделяне на много големи съсиреци',
      'Упорита неприятна миризма или сърбеж',
      'Необичайно силна болка',
    ],
    advice: [
      {title: 'Наблюдавай потока си', text: 'Отбелязвай всички промени всеки месец.'},
      {title: 'Избери подходящата защита', text: 'Според потока и комфорта ти.'},
      {title: 'Вслушвай се в тялото си', text: 'То ти дава ценни сигнали.'},
      {title: 'При съмнение', text: 'Поговори със здравен специалист.'},
    ],
    shareMessage: 'Менструален поток: разбиране на цветовете и консистенциите — AWA',
  },
  sr: {
    badge: 'ЦИКЛУС И БЛАГОСТАЊЕ',
    title: 'Менструални проток: разумевање\nбоја и текстура',
    metaDuration: '4 мин читања',
    metaType: 'Водич',
    metaLevel: 'Почетник',
    metaValidated: 'Проверен садржај',
    intro:
      'Боја и текстура твоје менструације говоре много о твом хормонском здрављу. Научи да их читаш како би боље разумела свој циклус.',
    contentsTitle: 'У овом чланку',
    contents: [
      'Боје менструалног протока',
      'Текстуре протока',
      'Шта свака боја може указивати',
      'Када треба да будеш забринута?',
      'Наши савети за боље упознавање себе',
    ],
    colors: [
      {name: 'Јарко црвена', text: 'Свеж проток, нова крв. Чест на почетку менструације.'},
      {name: 'Тамно црвена', text: 'Старија крв, нормална у средини циклуса.'},
      {name: 'Смеђа', text: 'Оксидисана крв, често на крају менструације.'},
      {name: 'Розе', text: 'Може указивати на слаб проток или хормонску промену.'},
      {name: 'Наранџаста', text: 'Може бити повезана са инфекцијом или неравнотежом.'},
    ],
    textures: [
      {name: 'Течан', text: 'Течан проток, без грудвица.'},
      {name: 'Кремаст', text: 'Густа, глатка текстура.'},
      {name: 'Угрушци', text: 'Мали или велики угрушци крви.'},
      {name: 'Жилав / слуз', text: 'Развлачив, бистар или беличаст.'},
      {name: 'Ткиво', text: 'Комадићи ткива или слузокоже.'},
    ],
    meanings: [
      {name: 'Јарко до тамно црвена', text: 'Нормалан циклус. Твоје тело одбацује лигавицу материце.'},
      {name: 'Смеђа', text: 'Старија крв, нема разлога за бригу.'},
      {name: 'Розе', text: 'Може се јавити на почетку/крају менструације или при хормонском дисбалансу.'},
      {name: 'Наранџаста', text: 'Прати је ако је праћена јаким мирисом, сврабом или болом.'},
    ],
    warningTitle: 'Знаци на које треба обратити пажњу',
    warningItems: [
      'Веома обилно крварење (промена заштите сваких 1–2 сата)',
      'Редовно избацивање веома великих угрушака',
      'Упоран непријатан мирис или свраб',
      'Необично јак бол',
    ],
    advice: [
      {title: 'Посматрај свој проток', text: 'Бележи све промене сваког месеца.'},
      {title: 'Изабери праву заштиту', text: 'Према свом протоку и удобности.'},
      {title: 'Слушај своје тело', text: 'Оно ти даје драгоцене сигнале.'},
      {title: 'При сумњи', text: 'Разговарај са здравственим радником.'},
    ],
    shareMessage: 'Менструални проток: разумевање боја и текстура — AWA',
  },
  hr: {
    badge: 'CIKLUS I DOBROBIT',
    title: 'Menstrualni protok: razumijevanje\nboja i tekstura',
    metaDuration: '4 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro:
      'Boja i tekstura tvoje menstruacije govore mnogo o tvom hormonskom zdravlju. Nauči ih čitati kako bi bolje razumjela svoj ciklus.',
    contentsTitle: 'U ovom članku',
    contents: [
      'Boje menstrualnog protoka',
      'Teksture protoka',
      'Što svaka boja može značiti',
      'Kada treba biti zabrinuta?',
      'Naši savjeti za bolje poznavanje sebe',
    ],
    colors: [
      {name: 'Svijetlocrvena', text: 'Svjež protok, nova krv. Uobičajena na početku menstruacije.'},
      {name: 'Tamnocrvena', text: 'Starija krv, normalna sredinom menstruacije.'},
      {name: 'Smeđa', text: 'Oksidirana krv, često pri kraju menstruacije.'},
      {name: 'Ružičasta', text: 'Može upućivati na slab protok ili hormonsku promjenu.'},
      {name: 'Narančasta', text: 'Može biti povezana s infekcijom ili neravnotežom.'},
    ],
    textures: [
      {name: 'Tekuća', text: 'Tekući protok, bez grudica.'},
      {name: 'Kremasta', text: 'Gusta, glatka tekstura.'},
      {name: 'Ugrušci', text: 'Mali ili veliki krvni ugrušci.'},
      {name: 'Vlaknasta / sluz', text: 'Rastezljiva, bistra ili bjelkasta.'},
      {name: 'Tkivo', text: 'Komadići tkiva ili sluznice.'},
    ],
    meanings: [
      {name: 'Svijetla do tamnocrvena', text: 'Normalan ciklus. Tvoje tijelo odbacuje sluznicu maternice.'},
      {name: 'Smeđa', text: 'Starija krv, nema razloga za zabrinutost.'},
      {name: 'Ružičasta', text: 'Može se javiti na početku/kraju menstruacije ili kod hormonske neravnoteže.'},
      {name: 'Narančasta', text: 'Prati je ako je praćena jakim mirisom, svrbežom ili boli.'},
    ],
    warningTitle: 'Znakovi na koje treba paziti',
    warningItems: [
      'Vrlo obilno krvarenje (mijenjanje zaštite svakih 1–2 sata)',
      'Redovito izbacivanje vrlo velikih ugrušaka',
      'Dugotrajan neugodan miris ili svrbež',
      'Neobično jaka bol',
    ],
    advice: [
      {title: 'Promatraj svoj protok', text: 'Svaki mjesec zabilježi sve promjene.'},
      {title: 'Odaberi pravu zaštitu', text: 'Prema svom protoku i ugodi.'},
      {title: 'Slušaj svoje tijelo', text: 'Daje ti dragocjene signale.'},
      {title: 'U slučaju nedoumice', text: 'Razgovaraj sa zdravstvenim djelatnikom.'},
    ],
    shareMessage: 'Menstrualni protok: razumijevanje boja i tekstura — AWA',
  },
  bs: {
    badge: 'CIKLUS I DOBROBIT',
    title: 'Menstrualni protok: razumijevanje\nboja i tekstura',
    metaDuration: '4 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro:
      'Boja i tekstura tvoje menstruacije govore mnogo o tvom hormonskom zdravlju. Nauči ih čitati kako bi bolje razumjela svoj ciklus.',
    contentsTitle: 'U ovom članku',
    contents: [
      'Boje menstrualnog protoka',
      'Teksture protoka',
      'Što svaka boja može značiti',
      'Kada treba biti zabrinuta?',
      'Naši savjeti za bolje poznavanje sebe',
    ],
    colors: [
      {name: 'Svijetlocrvena', text: 'Svjež protok, nova krv. Uobičajena na početku menstruacije.'},
      {name: 'Tamnocrvena', text: 'Starija krv, normalna sredinom menstruacije.'},
      {name: 'Smeđa', text: 'Oksidirana krv, često pri kraju menstruacije.'},
      {name: 'Ružičasta', text: 'Može upućivati na slab protok ili hormonsku promjenu.'},
      {name: 'Narančasta', text: 'Može biti povezana s infekcijom ili neravnotežom.'},
    ],
    textures: [
      {name: 'Tekuća', text: 'Tekući protok, bez grudica.'},
      {name: 'Kremasta', text: 'Gusta, glatka tekstura.'},
      {name: 'Ugrušci', text: 'Mali ili veliki krvni ugrušci.'},
      {name: 'Vlaknasta / sluz', text: 'Rastezljiva, bistra ili bjelkasta.'},
      {name: 'Tkivo', text: 'Komadići tkiva ili sluznice.'},
    ],
    meanings: [
      {name: 'Svijetla do tamnocrvena', text: 'Normalan ciklus. Tvoje tijelo odbacuje sluznicu maternice.'},
      {name: 'Smeđa', text: 'Starija krv, nema razloga za zabrinutost.'},
      {name: 'Ružičasta', text: 'Može se javiti na početku/kraju menstruacije ili kod hormonske neravnoteže.'},
      {name: 'Narančasta', text: 'Prati je ako je praćena jakim mirisom, svrbežom ili boli.'},
    ],
    warningTitle: 'Znakovi na koje treba paziti',
    warningItems: [
      'Vrlo obilno krvarenje (mijenjanje zaštite svakih 1–2 sata)',
      'Redovito izbacivanje vrlo velikih ugrušaka',
      'Dugotrajan neugodan miris ili svrbež',
      'Neobično jaka bol',
    ],
    advice: [
      {title: 'Promatraj svoj protok', text: 'Svaki mjesec zabilježi sve promjene.'},
      {title: 'Odaberi pravu zaštitu', text: 'Prema svom protoku i ugodi.'},
      {title: 'Slušaj svoje tijelo', text: 'Daje ti dragocjene signale.'},
      {title: 'U slučaju nedoumice', text: 'Razgovaraj sa zdravstvenim radnikom.'},
    ],
    shareMessage: 'Menstrualni protok: razumijevanje boja i tekstura — AWA',
  },
  sl: {
    badge: 'CIKEL IN DOBRO POČUTJE',
    title: 'Menstrualni tok: razumevanje\nbarv in tekstur',
    metaDuration: '4 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Začetnica',
    metaValidated: 'Preverjena vsebina',
    intro:
      'Barva in tekstura tvoje menstruacije veliko povesta o tvojem hormonskem zdravju. Nauči se ju brati, da bolje razumeš svoj cikel.',
    contentsTitle: 'V tem članku',
    contents: [
      'Barve menstrualnega toka',
      'Teksture toka',
      'Kaj lahko pomeni vsaka barva',
      'Kdaj je treba biti zaskrbljena?',
      'Naši nasveti za boljše poznavanje sebe',
    ],
    colors: [
      {name: 'Svetlo rdeča', text: 'Svež tok, nova kri. Običajna na začetku menstruacije.'},
      {name: 'Temno rdeča', text: 'Starejša kri, normalna sredi menstruacije.'},
      {name: 'Rjava', text: 'Oksidirana kri, pogosto pri koncu menstruacije.'},
      {name: 'Roza', text: 'Lahko kaže na šibek tok ali hormonsko spremembo.'},
      {name: 'Oranžna', text: 'Lahko je povezana z okužbo ali neravnovesjem.'},
    ],
    textures: [
      {name: 'Tekoča', text: 'Tekoč tok, brez grudic.'},
      {name: 'Kremasta', text: 'Gosta, gladka tekstura.'},
      {name: 'Strdki', text: 'Majhni ali veliki krvni strdki.'},
      {name: 'Nitasta / sluz', text: 'Raztegljiva, bistra ali beličasta.'},
      {name: 'Tkivo', text: 'Koščki tkiva ali sluznice.'},
    ],
    meanings: [
      {name: 'Svetla do temno rdeča', text: 'Normalen cikel. Tvoje telo odmetava sluznico maternice.'},
      {name: 'Rjava', text: 'Starejša kri, ni razloga za zaskrbljenost.'},
      {name: 'Roza', text: 'Lahko se pojavi na začetku/koncu menstruacije ali ob hormonskem neravnovesju.'},
      {name: 'Oranžna', text: 'Spremljaj jo, če jo spremljajo močan vonj, srbenje ali bolečina.'},
    ],
    warningTitle: 'Znaki, na katere je treba paziti',
    warningItems: [
      'Zelo obilna krvavitev (menjava zaščite vsake 1–2 uri)',
      'Redno izločanje zelo velikih strdkov',
      'Dolgotrajen neprijeten vonj ali srbenje',
      'Nenavadno huda bolečina',
    ],
    advice: [
      {title: 'Opazuj svoj tok', text: 'Vsak mesec zabeleži morebitne spremembe.'},
      {title: 'Izberi pravo zaščito', text: 'Glede na svoj tok in udobje.'},
      {title: 'Prisluhni svojemu telesu', text: 'Daje ti dragocene signale.'},
      {title: 'Ob dvomu', text: 'Pogovori se z zdravstvenim delavcem.'},
    ],
    shareMessage: 'Menstrualni tok: razumevanje barv in tekstur — AWA',
  },
  ne: {
    badge: 'चक्र र भलाइ',
    title: 'महिनावारीको बहाव: रङ र\nबनावट बुझ्नुहोस्',
    metaDuration: '4 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'सुरुवाती',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro:
      'तपाईंको महिनावारीको रङ र बनावटले तपाईंको हर्मोनल स्वास्थ्यबारे धेरै कुरा बताउँछ। आफ्नो चक्र राम्ररी बुझ्न तिनलाई पढ्न सिक्नुहोस्।',
    contentsTitle: 'यो लेखमा',
    contents: [
      'महिनावारीको बहावका रङहरू',
      'बहावका बनावटहरू',
      'हरेक रङले के जनाउन सक्छ',
      'कहिले चिन्तित हुनुपर्छ?',
      'आफूलाई राम्ररी चिन्न मद्दत गर्ने हाम्रा सुझावहरू',
    ],
    colors: [
      {name: 'चटक रातो', text: 'ताजा बहाव, नयाँ रगत। महिनावारीको सुरुमा सामान्य।'},
      {name: 'गाढा रातो', text: 'पुरानो रगत, चक्रको बीचमा सामान्य।'},
      {name: 'खैरो', text: 'अक्सिडाइज भएको रगत, प्रायः महिनावारीको अन्त्यमा।'},
      {name: 'गुलाबी', text: 'हल्का बहाव वा हर्मोनल परिवर्तन जनाउन सक्छ।'},
      {name: 'सुन्तला रङ', text: 'सङ्क्रमण वा असन्तुलनसँग जोडिएको हुन सक्छ।'},
    ],
    textures: [
      {name: 'तरल', text: 'तरल बहाव, डल्लाबिना।'},
      {name: 'क्रिमजस्तो', text: 'बाक्लो, चिल्लो बनावट।'},
      {name: 'गाँठा', text: 'साना वा ठूला रगतका गाँठाहरू।'},
      {name: 'धागोजस्तो / तरल पदार्थ', text: 'तानिने, स्पष्ट वा सेतोजस्तो।'},
      {name: 'तन्तु', text: 'तन्तु वा म्युकस झिल्लीका टुक्राहरू।'},
    ],
    meanings: [
      {name: 'चटकदेखि गाढा रातो', text: 'सामान्य चक्र। तपाईंको शरीरले गर्भाशयको अस्तर झारिरहेको छ।'},
      {name: 'खैरो', text: 'पुरानो रगत, चिन्ता गर्नुपर्ने केही छैन।'},
      {name: 'गुलाबी', text: 'महिनावारीको सुरु/अन्त्यमा वा हर्मोनल असन्तुलनमा देखिन सक्छ।'},
      {name: 'सुन्तला रङ', text: 'कडा गन्ध, चिलाउने वा दुखाइ साथै भए नजर राख्नुहोस्।'},
    ],
    warningTitle: 'ध्यान दिनुपर्ने संकेतहरू',
    warningItems: [
      'निकै धेरै रक्तस्राव (हरेक 1–2 घण्टामा सुरक्षा बदल्नुपर्ने)',
      'नियमित रूपमा निकै ठूला गाँठा निस्कनु',
      'लगातार खराब गन्ध वा चिलाउने',
      'असामान्य रूपमा तीव्र दुखाइ',
    ],
    advice: [
      {title: 'आफ्नो बहाव अवलोकन गर्नुहोस्', text: 'हरेक महिना कुनै परिवर्तन टिप्नुहोस्।'},
      {title: 'सही सुरक्षा छान्नुहोस्', text: 'आफ्नो बहाव र सहजताको आधारमा।'},
      {title: 'आफ्नो शरीरको कुरा सुन्नुहोस्', text: 'यसले तपाईंलाई बहुमूल्य संकेतहरू दिन्छ।'},
      {title: 'शङ्का लागे', text: 'स्वास्थ्यकर्मीसँग कुरा गर्नुहोस्।'},
    ],
    shareMessage: 'महिनावारीको बहाव: रङ र बनावट बुझ्नुहोस् — AWA',
  },
  si: {
    badge: 'චක්‍රය සහ යහපැවැත්ම',
    title: 'ඔසප් ගලනය: වර්ණ සහ\nසැකැස්ම තේරුම් ගැනීම',
    metaDuration: 'කියවීමට මිනිත්තු 4',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro:
      'ඔබේ ඔසප්වල වර්ණය සහ සැකැස්ම ඔබේ හෝමෝන සෞඛ්‍යය ගැන බොහෝ දේ කියයි. ඔබේ චක්‍රය වඩා හොඳින් තේරුම් ගැනීමට ඒවා කියවීමට ඉගෙන ගන්න.',
    contentsTitle: 'මෙම ලිපියේ',
    contents: [
      'ඔසප් ගලනයේ වර්ණ',
      'ගලනයේ සැකැස්ම',
      'සෑම වර්ණයක්ම පෙන්විය හැක්කේ කුමක්ද',
      'ඔබ කනස්සල්ලට පත්විය යුත්තේ කවදාද?',
      'ඔබ ගැන වඩා හොඳින් දැනගැනීමට අපගේ ඉඟි',
    ],
    colors: [
      {name: 'ලා රතු', text: 'නැවුම් ගලනය, අලුත් ලේ. ඔබේ ඔසප් ආරම්භයේදී පොදුයි.'},
      {name: 'තද රතු', text: 'පැරණි ලේ, චක්‍රයේ මැදදී සාමාන්‍යයි.'},
      {name: 'දුඹුරු', text: 'ඔක්සිකරණය වූ ලේ, බොහෝ විට ඔබේ ඔසප් අවසානයේදී.'},
      {name: 'රෝස', text: 'සැහැල්ලු ගලනයක් හෝ හෝමෝන වෙනසක් පෙන්විය හැක.'},
      {name: 'තැඹිලි', text: 'ආසාදනයක් හෝ අසමතුලිතතාවක් සමඟ සම්බන්ධ විය හැක.'},
    ],
    textures: [
      {name: 'ද්‍රව', text: 'ගැටි නොමැති ද්‍රව ගලනය.'},
      {name: 'ක්‍රීම් වැනි', text: 'ඝන, සුමට සැකැස්ම.'},
      {name: 'ලේ කැට', text: 'කුඩා හෝ විශාල ලේ කැට.'},
      {name: 'නූල් වැනි / ශ්ලේෂ්මල', text: 'දිගු විය හැකි, පැහැදිලි හෝ සුදුපැහැති.'},
      {name: 'පටක', text: 'පටක හෝ ශ්ලේෂ්මල පටලයේ කැබලි.'},
    ],
    meanings: [
      {name: 'ලා රතු සිට තද රතු දක්වා', text: 'සාමාන්‍ය චක්‍රය. ඔබේ ශරීරය ගර්භාෂ අස්තරය ඉවත් කරයි.'},
      {name: 'දුඹුරු', text: 'පැරණි ලේ, කනස්සල්ලට කරුණක් නැත.'},
      {name: 'රෝස', text: 'ඔබේ ඔසප් ආරම්භයේ/අවසානයේදී හෝ හෝමෝන අසමතුලිතතාවක් සමඟ ඇතිවිය හැක.'},
      {name: 'තැඹිලි', text: 'දැඩි ගඳක්, කසන සුළු බවක් හෝ වේදනාවක් සමඟ නම් නිරීක්ෂණය කරන්න.'},
    ],
    warningTitle: 'අවධානයට ලක් කළ යුතු සලකුණු',
    warningItems: [
      'ඉතා වැඩි ලේ ගැලීම (පැය 1–2කට වරක් ආරක්ෂාව වෙනස් කිරීම)',
      'නිතිපතා ඉතා විශාල ලේ කැට පිට කිරීම',
      'දිගටම පවතින දුර්ගන්ධය හෝ කසන සුළු බව',
      'අසාමාන්‍ය ලෙස දැඩි වේදනාව',
    ],
    advice: [
      {title: 'ඔබේ ගලනය නිරීක්ෂණය කරන්න', text: 'සෑම මසකම ඕනෑම වෙනස්කමක් සටහන් කරන්න.'},
      {title: 'නිවැරදි ආරක්ෂාව තෝරන්න', text: 'ඔබේ ගලනය සහ ඔබේ සුවපහසුව අනුව.'},
      {title: 'ඔබේ ශරීරයට සවන් දෙන්න', text: 'එය ඔබට වටිනා සංඥා ලබා දෙයි.'},
      {title: 'සැකයක් ඇත්නම්', text: 'සෞඛ්‍ය වෘත්තිකයෙකු සමඟ කතා කරන්න.'},
    ],
    shareMessage: 'ඔසප් ගලනය: වර්ණ සහ සැකැස්ම තේරුම් ගැනීම — AWA',
  },
  th: {
    badge: 'รอบเดือนและความเป็นอยู่ที่ดี',
    title: 'ปริมาณประจำเดือน: ทำความเข้าใจ\nสีและลักษณะเนื้อ',
    metaDuration: 'อ่าน 4 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro:
      'สีและลักษณะเนื้อของประจำเดือนบอกเรื่องสุขภาพฮอร์โมนของคุณได้มาก เรียนรู้ที่จะอ่านมันเพื่อเข้าใจรอบเดือนของคุณดียิ่งขึ้น',
    contentsTitle: 'ในบทความนี้',
    contents: [
      'สีของประจำเดือน',
      'ลักษณะเนื้อของประจำเดือน',
      'แต่ละสีอาจบ่งบอกอะไร',
      'เมื่อไรควรกังวล?',
      'เคล็ดลับของเราเพื่อช่วยให้คุณรู้จักตัวเองมากขึ้น',
    ],
    colors: [
      {name: 'แดงสด', text: 'เลือดสดใหม่ พบบ่อยในช่วงต้นของประจำเดือน'},
      {name: 'แดงเข้ม', text: 'เลือดที่เก่ากว่า เป็นปกติกลางรอบเดือน'},
      {name: 'น้ำตาล', text: 'เลือดที่ถูกออกซิไดซ์ มักพบตอนท้ายของประจำเดือน'},
      {name: 'ชมพู', text: 'อาจบ่งบอกถึงปริมาณน้อยหรือการเปลี่ยนแปลงของฮอร์โมน'},
      {name: 'ส้ม', text: 'อาจเกี่ยวข้องกับการติดเชื้อหรือความไม่สมดุล'},
    ],
    textures: [
      {name: 'เหลว', text: 'ปริมาณเป็นของเหลว ไม่เป็นก้อน'},
      {name: 'ข้นคล้ายครีม', text: 'เนื้อข้นและเนียน'},
      {name: 'ลิ่มเลือด', text: 'ลิ่มเลือดก้อนเล็กหรือใหญ่'},
      {name: 'เป็นเส้น / เมือก', text: 'ยืดได้ ใสหรือขาวขุ่น'},
      {name: 'เนื้อเยื่อ', text: 'ชิ้นเนื้อเยื่อหรือเยื่อเมือก'},
    ],
    meanings: [
      {name: 'แดงสดถึงแดงเข้ม', text: 'รอบเดือนปกติ ร่างกายกำลังผลัดเยื่อบุโพรงมดลูก'},
      {name: 'น้ำตาล', text: 'เลือดที่เก่ากว่า ไม่มีอะไรต้องกังวล'},
      {name: 'ชมพู', text: 'อาจเกิดขึ้นตอนต้น/ท้ายประจำเดือน หรือเมื่อฮอร์โมนไม่สมดุล'},
      {name: 'ส้ม', text: 'ควรเฝ้าสังเกตหากมีกลิ่นแรง คัน หรือปวดร่วมด้วย'},
    ],
    warningTitle: 'สัญญาณที่ควรสังเกต',
    warningItems: [
      'เลือดออกมากผิดปกติ (เปลี่ยนอุปกรณ์ทุก 1–2 ชั่วโมง)',
      'มีลิ่มเลือดก้อนใหญ่มากเป็นประจำ',
      'มีกลิ่นเหม็นหรืออาการคันต่อเนื่อง',
      'ปวดรุนแรงผิดปกติ',
    ],
    advice: [
      {title: 'สังเกตปริมาณของคุณ', text: 'จดการเปลี่ยนแปลงทุกเดือน'},
      {title: 'เลือกอุปกรณ์ที่เหมาะสม', text: 'ตามปริมาณและความสบายของคุณ'},
      {title: 'ฟังเสียงร่างกายของคุณ', text: 'ร่างกายให้สัญญาณที่มีค่าแก่คุณ'},
      {title: 'หากสงสัย', text: 'พูดคุยกับบุคลากรทางการแพทย์'},
    ],
    shareMessage: 'ปริมาณประจำเดือน: ทำความเข้าใจสีและลักษณะเนื้อ — AWA',
  },
  vi: {
    badge: 'CHU KỲ & SỨC KHỎE',
    title: 'Lượng kinh nguyệt: hiểu về\nmàu sắc và kết cấu',
    metaDuration: '4 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung đã được thẩm định',
    intro:
      'Màu sắc và kết cấu của máu kinh nói lên nhiều điều về sức khỏe nội tiết của bạn. Hãy học cách đọc chúng để hiểu rõ hơn chu kỳ của mình.',
    contentsTitle: 'Trong bài viết này',
    contents: [
      'Màu sắc của máu kinh',
      'Kết cấu của máu kinh',
      'Mỗi màu có thể cho biết điều gì',
      'Khi nào nên lo lắng?',
      'Lời khuyên của chúng tôi để giúp bạn hiểu mình hơn',
    ],
    colors: [
      {name: 'Đỏ tươi', text: 'Máu mới, tươi. Thường gặp ở đầu kỳ kinh.'},
      {name: 'Đỏ sẫm', text: 'Máu cũ hơn, bình thường ở giữa chu kỳ.'},
      {name: 'Nâu', text: 'Máu bị oxy hóa, thường ở cuối kỳ kinh.'},
      {name: 'Hồng', text: 'Có thể cho thấy lượng kinh ít hoặc một thay đổi nội tiết.'},
      {name: 'Cam', text: 'Có thể liên quan đến nhiễm trùng hoặc mất cân bằng.'},
    ],
    textures: [
      {name: 'Loãng', text: 'Máu dạng lỏng, không vón cục.'},
      {name: 'Dạng kem', text: 'Kết cấu đặc, mịn.'},
      {name: 'Cục máu đông', text: 'Cục máu đông nhỏ hoặc lớn.'},
      {name: 'Dạng sợi / Dịch nhầy', text: 'Kéo giãn được, trong hoặc trắng đục.'},
      {name: 'Mô', text: 'Các mảnh mô hoặc niêm mạc.'},
    ],
    meanings: [
      {name: 'Đỏ tươi đến đỏ sẫm', text: 'Chu kỳ bình thường. Cơ thể bạn đang bong lớp niêm mạc tử cung.'},
      {name: 'Nâu', text: 'Máu cũ hơn, không có gì đáng lo.'},
      {name: 'Hồng', text: 'Có thể xảy ra ở đầu/cuối kỳ kinh hoặc khi mất cân bằng nội tiết.'},
      {name: 'Cam', text: 'Hãy theo dõi nếu đi kèm mùi nồng, ngứa hoặc đau.'},
    ],
    warningTitle: 'Những dấu hiệu cần chú ý',
    warningItems: [
      'Ra máu rất nhiều (phải thay sản phẩm vệ sinh mỗi 1–2 giờ)',
      'Thường xuyên ra cục máu đông rất lớn',
      'Mùi hôi hoặc ngứa kéo dài',
      'Cơn đau dữ dội bất thường',
    ],
    advice: [
      {title: 'Quan sát lượng kinh của bạn', text: 'Ghi lại mọi thay đổi mỗi tháng.'},
      {title: 'Chọn sản phẩm vệ sinh phù hợp', text: 'Dựa trên lượng kinh và sự thoải mái của bạn.'},
      {title: 'Lắng nghe cơ thể bạn', text: 'Nó đưa ra cho bạn những tín hiệu quý giá.'},
      {title: 'Nếu có nghi ngờ', text: 'Hãy nói chuyện với nhân viên y tế.'},
    ],
    shareMessage: 'Lượng kinh nguyệt: hiểu về màu sắc và kết cấu — AWA',
  },
  uz: {
    badge: 'SIKL VA FAROVONLIK',
    title: 'Hayz oqimi: ranglar va\nquyuqlikni tushunish',
    metaDuration: '4 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Tasdiqlangan kontent',
    intro:
      'Hayzingizning rangi va quyuqligi gormonal salomatligingiz haqida koʻp narsa aytadi. Siklingizni yaxshiroq tushunish uchun ularni oʻqishni oʻrganing.',
    contentsTitle: 'Ushbu maqolada',
    contents: [
      'Hayz oqimining ranglari',
      'Oqimning quyuqligi',
      'Har bir rang nimani anglatishi mumkin',
      'Qachon xavotirlanish kerak?',
      'Oʻzingizni yaxshiroq tanish uchun maslahatlarimiz',
    ],
    colors: [
      {name: 'Yorqin qizil', text: 'Yangi oqim, yangi qon. Hayzning boshida keng tarqalgan.'},
      {name: 'Toʻq qizil', text: 'Eskiroq qon, sikl oʻrtasida meʼyoriy.'},
      {name: 'Jigarrang', text: 'Oksidlangan qon, koʻpincha hayzning oxirida.'},
      {name: 'Pushti', text: 'Yengil oqim yoki gormonal oʻzgarishni bildirishi mumkin.'},
      {name: 'Toʻq sariq', text: 'Infeksiya yoki muvozanat buzilishi bilan bogʻliq boʻlishi mumkin.'},
    ],
    textures: [
      {name: 'Suyuq', text: 'Laxtasiz suyuq oqim.'},
      {name: 'Qaymoqsimon', text: 'Quyuq, silliq quyuqlik.'},
      {name: 'Laxtalar', text: 'Kichik yoki katta qon laxtalari.'},
      {name: 'Ipsimon / Shilliq', text: 'Choʻziluvchan, shaffof yoki oqish.'},
      {name: 'Toʻqima', text: 'Toʻqima yoki shilliq parda boʻlaklari.'},
    ],
    meanings: [
      {name: 'Yorqin qizildan toʻq qizilgacha', text: 'Normal sikl. Tanangiz bachadon qavatini toʻkmoqda.'},
      {name: 'Jigarrang', text: 'Eskiroq qon, xavotirga hech narsa yoʻq.'},
      {name: 'Pushti', text: 'Hayzning boshida/oxirida yoki gormonal muvozanat buzilganda boʻlishi mumkin.'},
      {name: 'Toʻq sariq', text: 'Agar kuchli hid, qichishish yoki ogʻriq bilan birga boʻlsa, kuzatib boring.'},
    ],
    warningTitle: 'Eʼtibor berish kerak boʻlgan belgilar',
    warningItems: [
      'Juda koʻp qon ketishi (himoya vositasini har 1–2 soatda almashtirish)',
      'Muntazam juda katta laxtalar chiqishi',
      'Doimiy yoqimsiz hid yoki qichishish',
      'Odatdan tashqari kuchli ogʻriq',
    ],
    advice: [
      {title: 'Oqimingizni kuzating', text: 'Har oy har qanday oʻzgarishni yozib boring.'},
      {title: 'Toʻgʻri himoya vositasini tanlang', text: 'Oqimingiz va qulayligingizga qarab.'},
      {title: 'Tanangizni tinglang', text: 'U sizga qimmatli signallar beradi.'},
      {title: 'Shubha boʻlsa', text: 'Sogʻliqni saqlash mutaxassisi bilan gaplashing.'},
    ],
    shareMessage: 'Hayz oqimi: ranglar va quyuqlikni tushunish — AWA',
  },
  az: {
    badge: 'DÖVR VƏ RIFAH',
    title: 'Aybaşı axını: rəngləri\nvə teksturaları anlamaq',
    metaDuration: '4 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Yoxlanılmış məzmun',
    intro:
      'Aybaşınızın rəngi və teksturası hormonal sağlamlığınız haqqında çox şey deyir. Dövrünüzü daha yaxşı anlamaq üçün onları oxumağı öyrənin.',
    contentsTitle: 'Bu məqalədə',
    contents: [
      'Aybaşı axınının rəngləri',
      'Axının teksturaları',
      'Hər rəng nəyi göstərə bilər',
      'Nə vaxt narahat olmaq lazımdır?',
      'Özünüzü daha yaxşı tanımağa kömək edən məsləhətlərimiz',
    ],
    colors: [
      {name: 'Parlaq qırmızı', text: 'Təzə axın, yeni qan. Aybaşının əvvəlində geniş yayılıb.'},
      {name: 'Tünd qırmızı', text: 'Köhnə qan, dövrün ortasında normaldır.'},
      {name: 'Qəhvəyi', text: 'Oksidləşmiş qan, çox vaxt aybaşının sonunda olur.'},
      {name: 'Çəhrayı', text: 'Zəif axını və ya hormonal dəyişikliyi göstərə bilər.'},
      {name: 'Narıncı', text: 'İnfeksiya və ya disbalansla əlaqəli ola bilər.'},
    ],
    textures: [
      {name: 'Maye', text: 'Laxtasız maye axın.'},
      {name: 'Kremvari', text: 'Qatı, hamar tekstura.'},
      {name: 'Laxtalar', text: 'Kiçik və ya iri qan laxtaları.'},
      {name: 'Selikli / Mukus', text: 'Dartılan, şəffaf və ya ağımtıl.'},
      {name: 'Toxuma', text: 'Toxuma və ya selikli qişa parçaları.'},
    ],
    meanings: [
      {name: 'Parlaq qırmızıdan tünd qırmızıya', text: 'Normal dövr. Bədəniniz uşaqlıq selikli qişasını atır.'},
      {name: 'Qəhvəyi', text: 'Köhnə qan, narahat olmağa əsas yoxdur.'},
      {name: 'Çəhrayı', text: 'Aybaşının əvvəlində/sonunda və ya hormonal disbalansla ola bilər.'},
      {name: 'Narıncı', text: 'Güclü qoxu, qaşınma və ya ağrı ilə müşayiət olunarsa, diqqətlə izləyin.'},
    ],
    warningTitle: 'Diqqət ediləcək əlamətlər',
    warningItems: [
      'Çox bol qanaxma (qoruyucu vasitəni hər 1–2 saatdan bir dəyişmək)',
      'Müntəzəm olaraq çox iri laxtaların ifraz olunması',
      'Davamlı pis qoxu və ya qaşınma',
      'Qeyri-adi şiddətli ağrı',
    ],
    advice: [
      {title: 'Axınınızı müşahidə edin', text: 'Hər ay hər hansı dəyişikliyi qeyd edin.'},
      {title: 'Düzgün qoruyucu vasitəni seçin', text: 'Axınınıza və rahatlığınıza görə.'},
      {title: 'Bədəninizi dinləyin', text: 'O, sizə qiymətli siqnallar verir.'},
      {title: 'Şübhə olarsa', text: 'Tibb işçisi ilə danışın.'},
    ],
    shareMessage: 'Aybaşı axını: rəngləri və teksturaları anlamaq — AWA',
  },
  ka: {
    badge: 'ციკლი და კეთილდღეობა',
    title: 'მენსტრუაციული ნაკადი: ფერებისა\nდა ტექსტურების გაგება',
    metaDuration: '4 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'დამწყები',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro:
      'თქვენი მენსტრუაციის ფერი და ტექსტურა ბევრს ამბობს თქვენი ჰორმონული ჯანმრთელობის შესახებ. ისწავლეთ მათი წაკითხვა, რომ ციკლი უკეთ გაიგოთ.',
    contentsTitle: 'ამ სტატიაში',
    contents: [
      'მენსტრუაციული ნაკადის ფერები',
      'ნაკადის ტექსტურები',
      'რაზე შეიძლება მიუთითებდეს თითოეული ფერი',
      'როდის უნდა შეგაწუხოთ?',
      'ჩვენი რჩევები საკუთარი თავის უკეთ გასაცნობად',
    ],
    colors: [
      {name: 'ნათელი წითელი', text: 'ახალი ნაკადი, ახალი სისხლი. გავრცელებულია მენსტრუაციის დასაწყისში.'},
      {name: 'მუქი წითელი', text: 'უფრო ძველი სისხლი, ციკლის შუაში ნორმალურია.'},
      {name: 'ყავისფერი', text: 'დაჟანგული სისხლი, ხშირად მენსტრუაციის ბოლოს.'},
      {name: 'ვარდისფერი', text: 'შეიძლება მიუთითებდეს მსუბუქ ნაკადზე ან ჰორმონულ ცვლილებაზე.'},
      {name: 'ნარინჯისფერი', text: 'შეიძლება ინფექციას ან დისბალანსს უკავშირდებოდეს.'},
    ],
    textures: [
      {name: 'თხევადი', text: 'თხევადი ნაკადი, გუნდების გარეშე.'},
      {name: 'კრემისებრი', text: 'სქელი, გლუვი ტექსტურა.'},
      {name: 'შრატები', text: 'სისხლის პატარა ან დიდი შრატები.'},
      {name: 'ძაფისებრი / ლორწო', text: 'გაჭიმვადი, გამჭვირვალე ან მოთეთრო.'},
      {name: 'ქსოვილი', text: 'ქსოვილის ან ლორწოვანი გარსის ნაჭრები.'},
    ],
    meanings: [
      {name: 'ნათელიდან მუქ წითლამდე', text: 'ნორმალური ციკლი. თქვენი სხეული საშვილოსნოს გარსს ათავისუფლებს.'},
      {name: 'ყავისფერი', text: 'უფრო ძველი სისხლი, შესაშფოთებელი არაფერია.'},
      {name: 'ვარდისფერი', text: 'შეიძლება მენსტრუაციის დასაწყისში/ბოლოს ან ჰორმონული დისბალანსისას გამოჩნდეს.'},
      {name: 'ნარინჯისფერი', text: 'დააკვირდით, თუ თან ახლავს ძლიერი სუნი, ქავილი ან ტკივილი.'},
    ],
    warningTitle: 'ნიშნები, რომლებსაც უნდა დააკვირდეთ',
    warningItems: [
      'ძალიან უხვი სისხლდენა (დამცავი საშუალების შეცვლა ყოველ 1–2 საათში)',
      'რეგულარულად ძალიან დიდი შრატების გამოყოფა',
      'მუდმივი უსიამოვნო სუნი ან ქავილი',
      'უჩვეულოდ ძლიერი ტკივილი',
    ],
    advice: [
      {title: 'დააკვირდით თქვენს ნაკადს', text: 'აღნიშნეთ ყოველთვიური ცვლილებები.'},
      {title: 'აირჩიეთ სწორი დამცავი საშუალება', text: 'თქვენი ნაკადისა და კომფორტის მიხედვით.'},
      {title: 'მოუსმინეთ თქვენს სხეულს', text: 'ის ღირებულ სიგნალებს გაძლევთ.'},
      {title: 'ეჭვის შემთხვევაში', text: 'ესაუბრეთ ჯანდაცვის სპეციალისტს.'},
    ],
    shareMessage: 'მენსტრუაციული ნაკადი: ფერებისა და ტექსტურების გაგება — AWA',
  },
  hy: {
    badge: 'ՑԻԿԼ ԵՎ ԲԱՐԵԿԵՑՈՒԹՅՈՒՆ',
    title: 'Դաշտանային արտահոսք. հասկանալ\nգույներն ու խտությունները',
    metaDuration: '4 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Վերանայված բովանդակություն',
    intro:
      'Ձեր դաշտանի գույնն ու խտությունը շատ բան են ասում ձեր հորմոնալ առողջության մասին: Սովորեք կարդալ դրանք՝ ձեր ցիկլն ավելի լավ հասկանալու համար:',
    contentsTitle: 'Այս հոդվածում',
    contents: [
      'Դաշտանային արտահոսքի գույները',
      'Արտահոսքի խտությունները',
      'Ինչ կարող է ցույց տալ յուրաքանչյուր գույն',
      'Ե՞րբ պետք է անհանգստանալ',
      'Մեր խորհուրդները՝ ինքներդ ձեզ ավելի լավ ճանաչելու համար',
    ],
    colors: [
      {name: 'Վառ կարմիր', text: 'Թարմ արտահոսք, նոր արյուն: Տարածված է դաշտանի սկզբում:'},
      {name: 'Մուգ կարմիր', text: 'Ավելի հին արյուն, նորմալ է ցիկլի կեսին:'},
      {name: 'Շագանակագույն', text: 'Օքսիդացած արյուն, հաճախ դաշտանի վերջում:'},
      {name: 'Վարդագույն', text: 'Կարող է ցույց տալ թեթև արտահոսք կամ հորմոնալ փոփոխություն:'},
      {name: 'Նարնջագույն', text: 'Կարող է կապված լինել վարակի կամ անհավասարակշռության հետ:'},
    ],
    textures: [
      {name: 'Հեղուկ', text: 'Հեղուկ արտահոսք՝ առանց գնդիկների:'},
      {name: 'Սերուցքանման', text: 'Թանձր, հարթ խտություն:'},
      {name: 'Մակարդուկներ', text: 'Արյան փոքր կամ մեծ մակարդուկներ:'},
      {name: 'Թելանման / Լորձ', text: 'Ձգվող, թափանցիկ կամ սպիտակավուն:'},
      {name: 'Հյուսվածք', text: 'Հյուսվածքի կամ լորձաթաղանթի կտորներ:'},
    ],
    meanings: [
      {name: 'Վառից մինչև մուգ կարմիր', text: 'Նորմալ ցիկլ: Ձեր մարմինը մաքրում է արգանդի լորձաթաղանթը:'},
      {name: 'Շագանակագույն', text: 'Ավելի հին արյուն, անհանգստանալու պատճառ չկա:'},
      {name: 'Վարդագույն', text: 'Կարող է առաջանալ դաշտանի սկզբում/վերջում կամ հորմոնալ անհավասարակշռության դեպքում:'},
      {name: 'Նարնջագույն', text: 'Հետևեք, եթե ուղեկցվում է սուր հոտով, քորով կամ ցավով:'},
    ],
    warningTitle: 'Նշաններ, որոնց պետք է ուշադրություն դարձնել',
    warningItems: [
      'Շատ առատ արյունահոսություն (պաշտպանության միջոցը փոխել 1–2 ժամը մեկ)',
      'Կանոնավոր շատ մեծ մակարդուկների արտազատում',
      'Շարունակական վատ հոտ կամ քոր',
      'Անսովոր ուժեղ ցավ',
    ],
    advice: [
      {title: 'Դիտարկեք ձեր արտահոսքը', text: 'Գրանցեք ամեն ամսվա փոփոխությունները:'},
      {title: 'Ընտրեք ճիշտ պաշտպանություն', text: 'Ձեր արտահոսքին և հարմարավետությանը համապատասխան:'},
      {title: 'Լսեք ձեր մարմինը', text: 'Այն ձեզ արժեքավոր ազդանշաններ է տալիս:'},
      {title: 'Կասկածի դեպքում', text: 'Խոսեք առողջապահության մասնագետի հետ:'},
    ],
    shareMessage: 'Դաշտանային արտահոսք. հասկանալ գույներն ու խտությունները — AWA',
  },
  tg: {
    badge: 'ДАВРА ВА НЕКӮАҲВОЛӢ',
    title: 'Ҷараёни ҳайз: фаҳмидани\nранг ва сохтор',
    metaDuration: '4 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни баррасишуда',
    intro:
      'Ранг ва сохтори ҳайзи шумо дар бораи саломатии гормонии шумо бисёр чизҳо мегӯяд. Хондани онҳоро биомӯзед, то давраи худро беҳтар бифаҳмед.',
    contentsTitle: 'Дар ин мақола',
    contents: [
      'Рангҳои ҷараёни ҳайз',
      'Сохторҳои ҷараён',
      'Ҳар ранг чиро метавонад нишон диҳад',
      'Кай бояд нигарон шуд?',
      'Маслиҳатҳои мо барои беҳтар шинохтани худ',
    ],
    colors: [
      {name: 'Сурхи равшан', text: 'Ҷараёни тоза, хуни нав. Дар оғози ҳайз маъмул аст.'},
      {name: 'Сурхи тира', text: 'Хуни кӯҳнатар, дар миёнаи давра муқаррарӣ аст.'},
      {name: 'Қаҳваранг', text: 'Хуни оксидшуда, аксар вақт дар охири ҳайз.'},
      {name: 'Гулобӣ', text: 'Метавонад ҷараёни сабук ё тағйироти гормониро нишон диҳад.'},
      {name: 'Норинҷӣ', text: 'Метавонад бо сироят ё номутавозунӣ алоқаманд бошад.'},
    ],
    textures: [
      {name: 'Моеъ', text: 'Ҷараёни обакӣ, бе лахта.'},
      {name: 'Қаймоқмонанд', text: 'Сохтори ғализ ва ҳамвор.'},
      {name: 'Лахтаҳо', text: 'Лахтаҳои хурд ё калони хун.'},
      {name: 'Риштамонанд / Шилимшиқ', text: 'Кашишшаванда, шаффоф ё сафедтоб.'},
      {name: 'Бофта', text: 'Пораҳои бофта ё пардаи луобӣ.'},
    ],
    meanings: [
      {name: 'Сурхи равшан то тира', text: 'Давраи муқаррарӣ. Бадани шумо қабати бачадонро рехта истодааст.'},
      {name: 'Қаҳваранг', text: 'Хуни кӯҳнатар, чизе нест, ки нигарон кунад.'},
      {name: 'Гулобӣ', text: 'Метавонад дар оғоз/охири ҳайз ё бо номутавозунии гормонӣ рух диҳад.'},
      {name: 'Норинҷӣ', text: 'Агар бо бӯи тез, хориш ё дард ҳамроҳ бошад, назорат кунед.'},
    ],
    warningTitle: 'Нишонаҳое, ки бояд пайгирӣ кард',
    warningItems: [
      'Хунравии хеле зиёд (ивази воситаи муҳофизат ҳар 1–2 соат)',
      'Мунтазам гузаштани лахтаҳои хеле калон',
      'Бӯи бади доимӣ ё хориш',
      'Дарди ғайриоддӣ шадид',
    ],
    advice: [
      {title: 'Ҷараёни худро мушоҳида кунед', text: 'Ҳар моҳ тағйиротро қайд кунед.'},
      {title: 'Воситаи муҳофизати дурустро интихоб кунед', text: 'Мувофиқи ҷараён ва роҳатии худ.'},
      {title: 'Ба бадани худ гӯш диҳед', text: 'Он ба шумо сигналҳои арзанда медиҳад.'},
      {title: 'Дар сурати шубҳа', text: 'Бо мутахассиси соҳаи тиб гап занед.'},
    ],
    shareMessage: 'Ҷараёни ҳайз: фаҳмидани ранг ва сохтор — AWA',
  },
  ky: {
    badge: 'ЦИКЛ ЖАНА ЖЫРГАЛЧЫЛЫК',
    title: 'Етек кирим агымы: түстөрдү жана\nтекстураларды түшүнүү',
    metaDuration: '4 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Баштоочу',
    metaValidated: 'Текшерилген мазмун',
    intro:
      'Етек киримиңиздин түсү жана текстурасы гормондук ден соолугуңуз жөнүндө көп нерсени айтат. Циклиңизди жакшыраак түшүнүү үчүн аларды окууну үйрөнүңүз.',
    contentsTitle: 'Бул макалада',
    contents: [
      'Етек кирим агымынын түстөрү',
      'Агымдын текстуралары',
      'Ар бир түс эмнени көрсөтүшү мүмкүн',
      'Качан санааркоо керек?',
      'Өзүңүздү жакшыраак таанууга жардам берген кеңештерибиз',
    ],
    colors: [
      {name: 'Жаркын кызыл', text: 'Жаңы агым, жаңы кан. Етек кирим башталганда кеңири таралган.'},
      {name: 'Кара кызыл', text: 'Эскирээк кан, цикл ортосунда кадимки.'},
      {name: 'Күрөң', text: 'Кычкылданган кан, көбүнчө етек кирим аякташында.'},
      {name: 'Кызгылт', text: 'Жеңил агымды же гормондук өзгөрүүнү көрсөтүшү мүмкүн.'},
      {name: 'Кызгылт сары', text: 'Инфекция же тең салмактуулуктун бузулушу менен байланышкан болушу мүмкүн.'},
    ],
    textures: [
      {name: 'Суюк', text: 'Уюткусуз суюк агым.'},
      {name: 'Каймактуу', text: 'Коюу, жылмакай текстура.'},
      {name: 'Уютмалар', text: 'Кичине же чоң кан уютмалары.'},
      {name: 'Жиптей / Былжыр', text: 'Созулуучу, тунук же агыш.'},
      {name: 'Ткан', text: 'Ткан же былжыр челдин бөлүкчөлөрү.'},
    ],
    meanings: [
      {name: 'Жаркын кызылдан кара кызылга чейин', text: 'Нормалдуу цикл. Денеңиз жатындын ички катмарын чыгарып жатат.'},
      {name: 'Күрөң', text: 'Эскирээк кан, санааркоого негиз жок.'},
      {name: 'Кызгылт', text: 'Етек киримдин башталышында/аякташында же гормондук тең салмактуулук бузулганда болушу мүмкүн.'},
      {name: 'Кызгылт сары', text: 'Күчтүү жыт, кычышуу же оору менен коштолсо, көз салып турунуз.'},
    ],
    warningTitle: 'Көңүл бура турган белгилер',
    warningItems: [
      'Өтө көп кан кетүү (коргонуу каражатын ар 1–2 саатта алмаштыруу)',
      'Үзгүлтүксүз абдан чоң уютмалардын чыгышы',
      'Улана берген жаман жыт же кычышуу',
      'Адаттан тыш күчтүү оору',
    ],
    advice: [
      {title: 'Агымыңызды байкаңыз', text: 'Ар айда өзгөрүүлөрдү жазып коюңуз.'},
      {title: 'Туура коргонууну тандаңыз', text: 'Агымыңызга жана ыңгайлуулугуңузга жараша.'},
      {title: 'Денеңизди угуңуз', text: 'Ал сизге баалуу сигналдарды берет.'},
      {title: 'Күмөн болсо', text: 'Ден соолук сактоо адиси менен сүйлөшүңүз.'},
    ],
    shareMessage: 'Етек кирим агымы: түстөрдү жана текстураларды түшүнүү — AWA',
  },
  tk: {
    badge: 'SIKL WE ABADANÇYLYK',
    title: 'Aýbaşy gan akmasy: reňkleri we\nkonsistensiýalaryny düşünmek',
    metaDuration: '4 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Barlanan mazmun',
    intro:
      'Aýbaşyňyzyň reňki we konsistensiýasy gormonal saglygyňyz hakda köp zat aýdýar. Sikliňizi has gowy düşünmek üçin olary okamagy öwreniň.',
    contentsTitle: 'Bu makalada',
    contents: [
      'Aýbaşy gan akmasynyň reňkleri',
      'Gan akmanyň konsistensiýalary',
      'Her reňk nämäni görkezip biler',
      'Haçan alada etmeli?',
      'Özüňizi has gowy tanamaga kömek edýän maslahatlarymyz',
    ],
    colors: [
      {name: 'Açyk gyzyl', text: 'Täze gan akma, täze gan. Aýbaşynyň başynda ýygy.'},
      {name: 'Goýy gyzyl', text: 'Köne gan, sikliň ortasynda adaty.'},
      {name: 'Goňur', text: 'Okislenen gan, köplenç aýbaşynyň ahyrynda.'},
      {name: 'Gülgüne', text: 'Ýeňil gan akmany ýa-da gormonal üýtgeşmäni görkezip biler.'},
      {name: 'Mämişi', text: 'Ýokançlyk ýa-da deňagramsyzlyk bilen baglanyşykly bolup biler.'},
    ],
    textures: [
      {name: 'Suwuk', text: 'Suwuk gan akma, bölejiksiz.'},
      {name: 'Kremsi', text: 'Galyň, ýumşak konsistensiýa.'},
      {name: 'Ganyň ýygyndylary', text: 'Kiçi ýa-da uly gan ýygyndylary.'},
      {name: 'Ýüpli / Ýaňs', text: 'Çozulýan, arassa ýa-da ak.'},
      {name: 'Dokuma', text: 'Dokuma ýa-da selekeý perdäniň bölekleri.'},
    ],
    meanings: [
      {name: 'Açykdan goýy gyzyla çenli', text: 'Adaty sikl. Bedeniňiz ýatgy içki gatlagyny taşlaýar.'},
      {name: 'Goňur', text: 'Köne gan, alada üçin sebäp ýok.'},
      {name: 'Gülgüne', text: 'Aýbaşynyň başynda/ahyrynda ýa-da gormonal deňagramsyzlyk bilen bolup biler.'},
      {name: 'Mämişi', text: 'Güýçli ys, gyjyma ýa-da agyry bilen bile bolsa, gözegçilikde saklaň.'},
    ],
    warningTitle: 'Üns bermeli alamatlar',
    warningItems: [
      'Gaty köp gan akma (goranyş serişdesini her 1–2 sagatdan çalyşmak)',
      'Yzygiderli gaty uly gan ýygyndylarynyň çykmagy',
      'Dowamly erbet ys ýa-da gyjyma',
      'Adaty däl güýçli agyry',
    ],
    advice: [
      {title: 'Gan akmaňyzy synlaň', text: 'Her aý islendik üýtgeşmäni belläň.'},
      {title: 'Dogry goranyş serişdesini saýlaň', text: 'Gan akmaňyza we rahatlygyňyza görä.'},
      {title: 'Bedeniňize gulak asyň', text: 'Ol size gymmatly signallar berýär.'},
      {title: 'Şübhe bolsa', text: 'Saglyk hünärmeni bilen gürleşiň.'},
    ],
    shareMessage: 'Aýbaşy gan akmasy: reňkleri we konsistensiýalaryny düşünmek — AWA',
  },
  ms: {
    badge: 'KITARAN & KESEJAHTERAAN',
    title: 'Aliran haid: memahami\nwarna dan tekstur',
    metaDuration: '4 min bacaan',
    metaType: 'Panduan',
    metaLevel: 'Permulaan',
    metaValidated: 'Kandungan disemak',
    intro:
      'Warna dan tekstur haid anda banyak menceritakan tentang kesihatan hormon anda. Belajar membacanya untuk memahami kitaran anda dengan lebih baik.',
    contentsTitle: 'Dalam artikel ini',
    contents: [
      'Warna aliran haid',
      'Tekstur aliran',
      'Apa yang mungkin ditunjukkan oleh setiap warna',
      'Bila anda patut bimbang?',
      'Petua kami untuk membantu anda mengenali diri dengan lebih baik',
    ],
    colors: [
      {name: 'Merah terang', text: 'Aliran segar, darah baharu. Lazim pada permulaan haid anda.'},
      {name: 'Merah gelap', text: 'Darah yang lebih lama, normal pada pertengahan kitaran.'},
      {name: 'Perang', text: 'Darah yang teroksida, selalunya pada penghujung haid anda.'},
      {name: 'Merah jambu', text: 'Mungkin menunjukkan aliran yang ringan atau perubahan hormon.'},
      {name: 'Jingga', text: 'Mungkin berkaitan dengan jangkitan atau ketidakseimbangan.'},
    ],
    textures: [
      {name: 'Cair', text: 'Aliran cecair, tanpa gumpalan.'},
      {name: 'Berkrim', text: 'Tekstur yang pekat dan licin.'},
      {name: 'Darah beku', text: 'Darah beku yang kecil atau besar.'},
      {name: 'Berjuntai / Lendir', text: 'Kenyal, jernih atau keputihan.'},
      {name: 'Tisu', text: 'Kepingan tisu atau membran mukus.'},
    ],
    meanings: [
      {name: 'Merah terang hingga gelap', text: 'Kitaran normal. Tubuh anda menggugurkan lapisan rahim.'},
      {name: 'Perang', text: 'Darah yang lebih lama, tiada apa yang perlu dibimbangkan.'},
      {name: 'Merah jambu', text: 'Mungkin berlaku pada permulaan/penghujung haid anda atau dengan ketidakseimbangan hormon.'},
      {name: 'Jingga', text: 'Perhatikan jika disertai bau yang kuat, gatal atau sakit.'},
    ],
    warningTitle: 'Tanda yang perlu diperhatikan',
    warningItems: [
      'Pendarahan yang sangat banyak (menukar perlindungan setiap 1–2 jam)',
      'Kerap mengeluarkan darah beku yang sangat besar',
      'Bau busuk atau gatal yang berterusan',
      'Sakit yang luar biasa kuat',
    ],
    advice: [
      {title: 'Perhatikan aliran anda', text: 'Catat sebarang perubahan setiap bulan.'},
      {title: 'Pilih perlindungan yang sesuai', text: 'Berdasarkan aliran dan keselesaan anda.'},
      {title: 'Dengarlah tubuh anda', text: 'Ia memberi anda isyarat yang berharga.'},
      {title: 'Jika ragu-ragu', text: 'Berbincanglah dengan pengamal penjagaan kesihatan.'},
    ],
    shareMessage: 'Aliran haid: memahami warna dan tekstur — AWA',
  },
  so: {
    badge: 'WAREEG & FAYOOBAAN',
    title: 'Socodka caadada: fahamka\nmidabada iyo dhumucda',
    metaDuration: '4 daq akhris',
    metaType: 'Hage',
    metaLevel: 'Bilow',
    metaValidated: 'Macluumaad la dib-u-eegay',
    intro:
      'Midabka iyo dhumucda caadadaadu waxay wax badan ka sheegaan caafimaadka hormoonkaaga. Baro sida loo akhriyo si aad si wanaagsan u fahanto wareeggaaga.',
    contentsTitle: 'Maqaalkan dhexdiisa',
    contents: [
      'Midabada socodka caadada',
      'Dhumucda socodka',
      'Waxa midab kasta muujin karo',
      'Goorma ayaa la walwalaa?',
      'Talooyinkayaga kaa caawinaya inaad naftaada si wanaagsan u barato',
    ],
    colors: [
      {name: 'Casaan dhalaalaya', text: 'Socod cusub, dhiig cusub. Caadi ah bilowga caadadaada.'},
      {name: 'Casaan madow', text: 'Dhiig ka duug ah, caadi ah wareegga bartamihiisa.'},
      {name: 'Bunni', text: 'Dhiig oksijiin ku dhacay, inta badan dhammaadka caadadaada.'},
      {name: 'Ruuxdhalaal', text: 'Wuxuu muujin karaa socod fudud ama isbeddel hormoon.'},
      {name: 'Liinta', text: 'Wuxuu la xiriiri karaa caabuq ama dheelitir la’aan.'},
    ],
    textures: [
      {name: 'Dareere', text: 'Socod dareere ah, xinjiro la’aan.'},
      {name: 'Kareem leh', text: 'Dhumuc weyn, jilicsan.'},
      {name: 'Xinjiro', text: 'Xinjiro dhiig ah oo yar ama weyn.'},
      {name: 'Dheeraada / Dheecaan', text: 'Is-dheeraada, cad ama cadcad.'},
      {name: 'Unug', text: 'Qaybo unug ah ama xuub dheecaan leh.'},
    ],
    meanings: [
      {name: 'Casaan dhalaalaya ilaa casaan madow', text: 'Wareeg caadi ah. Jidhkaagu wuxuu ka saaraa dahaarka ilmo-galeenka.'},
      {name: 'Bunni', text: 'Dhiig ka duug ah, wax laga walaacsan yahay ma jiro.'},
      {name: 'Ruuxdhalaal', text: 'Wuxuu dhici karaa bilowga/dhammaadka caadadaada ama marka hormoonku dheelitir la’aan yahay.'},
      {name: 'Liinta', text: 'Indho-indheeyo haddii ay la socoto ur xoog leh, cuncun, ama xanuun.'},
    ],
    warningTitle: 'Calaamadaha la eego',
    warningItems: [
      'Dhiigbax aad u culus (beddelidda ilaalinta 1–2 saacadood kasta)',
      'Soo saarista si joogto ah xinjiro aad u waaweyn',
      'Ur xun ama cuncun sii socota',
      'Xanuun aan caadi ahayn oo xoog badan',
    ],
    advice: [
      {title: 'Indho-indheeyo socodkaaga', text: 'Xus isbeddel kasta bil kasta.'},
      {title: 'Dooro ilaalinta saxda ah', text: 'Iyadoo lagu salaynayo socodkaaga iyo raaxadaada.'},
      {title: 'U dhegeyso jidhkaaga', text: 'Wuxuu ku siiyaa calaamado qiimo leh.'},
      {title: 'Haddii aad shaki qabto', text: 'La hadal xirfadle caafimaad.'},
    ],
    shareMessage: 'Socodka caadada: fahamka midabada iyo dhumucda — AWA',
  },
  sw: {
    badge: 'MZUNGUKO NA USTAWI',
    title: 'Mtiririko wa hedhi: kuelewa\nrangi na umbile',
    metaDuration: 'Dakika 4 za kusoma',
    metaType: 'Mwongozo',
    metaLevel: 'Mwanzo',
    metaValidated: 'Maudhui yaliyokaguliwa',
    intro:
      'Rangi na umbile la hedhi yako vinasema mengi kuhusu afya ya homoni zako. Jifunze kuvisoma ili kuelewa vizuri zaidi mzunguko wako.',
    contentsTitle: 'Katika makala hii',
    contents: [
      'Rangi za mtiririko wa hedhi',
      'Umbile la mtiririko',
      'Kila rangi inaweza kuashiria nini',
      'Wakati gani uwe na wasiwasi?',
      'Vidokezo vyetu vya kukusaidia kujijua vizuri zaidi',
    ],
    colors: [
      {name: 'Nyekundu angavu', text: 'Mtiririko mpya, damu mpya. Ni ya kawaida mwanzoni mwa hedhi yako.'},
      {name: 'Nyekundu iliyokolea', text: 'Damu ya zamani zaidi, ya kawaida katikati ya mzunguko.'},
      {name: 'Kahawia', text: 'Damu iliyooksidishwa, mara nyingi mwishoni mwa hedhi yako.'},
      {name: 'Waridi', text: 'Inaweza kuashiria mtiririko mwepesi au mabadiliko ya homoni.'},
      {name: 'Rangi ya machungwa', text: 'Inaweza kuhusiana na maambukizi au kutokuwa na usawa.'},
    ],
    textures: [
      {name: 'Majimaji', text: 'Mtiririko wa kimiminika, bila mabonge.'},
      {name: 'Kama krimu', text: 'Umbile zito na laini.'},
      {name: 'Mabonge', text: 'Mabonge madogo au makubwa ya damu.'},
      {name: 'Nyuzinyuzi / Ute', text: 'Unaonyooka, safi au mweupe.'},
      {name: 'Tishu', text: 'Vipande vya tishu au utando laini.'},
    ],
    meanings: [
      {name: 'Nyekundu angavu hadi iliyokolea', text: 'Mzunguko wa kawaida. Mwili wako unamwaga utando wa mji wa uzazi.'},
      {name: 'Kahawia', text: 'Damu ya zamani zaidi, hakuna cha kuwa na wasiwasi.'},
      {name: 'Waridi', text: 'Inaweza kutokea mwanzoni/mwishoni mwa hedhi yako au kwa kutokuwa na usawa wa homoni.'},
      {name: 'Rangi ya machungwa', text: 'Ifuatilie ikiambatana na harufu kali, muwasho, au maumivu.'},
    ],
    warningTitle: 'Dalili za kuzingatia',
    warningItems: [
      'Kutokwa damu nyingi sana (kubadilisha kinga kila saa 1–2)',
      'Kutoa mara kwa mara mabonge makubwa sana',
      'Harufu mbaya au muwasho wa kuendelea',
      'Maumivu makali isivyo kawaida',
    ],
    advice: [
      {title: 'Chunguza mtiririko wako', text: 'Andika mabadiliko yoyote kila mwezi.'},
      {title: 'Chagua kinga inayofaa', text: 'Kulingana na mtiririko wako na faraja yako.'},
      {title: 'Sikiliza mwili wako', text: 'Unakupa ishara za thamani.'},
      {title: 'Ukiwa na shaka', text: 'Zungumza na mtaalamu wa afya.'},
    ],
    shareMessage: 'Mtiririko wa hedhi: kuelewa rangi na umbile — AWA',
  },
  kk: {
    badge: 'ЦИКЛ ЖӘНЕ ӘЛ-АУҚАТ',
    title: 'Етеккір көлемі: түстер мен\nқұрылымды түсіну',
    metaDuration: '4 мин оқу',
    metaType: 'Нұсқаулық',
    metaLevel: 'Бастауыш',
    metaValidated: 'Тексерілген мазмұн',
    intro:
      'Етеккіріңіздің түсі мен құрылымы гормондық денсаулығыңыз туралы көп нәрсе айтады. Циклыңызды жақсырақ түсіну үшін оларды оқуды үйреніңіз.',
    contentsTitle: 'Осы мақалада',
    contents: [
      'Етеккір көлемінің түстері',
      'Көлемнің құрылымы',
      'Әр түс нені көрсетуі мүмкін',
      'Қашан алаңдау керек?',
      'Өзіңізді жақсырақ білуге көмектесетін кеңестеріміз',
    ],
    colors: [
      {name: 'Ашық қызыл', text: 'Жаңа көлем, жаңа қан. Етеккірдің басында жиі кездеседі.'},
      {name: 'Қою қызыл', text: 'Ескірек қан, цикл ортасында қалыпты.'},
      {name: 'Қоңыр', text: 'Тотыққан қан, көбіне етеккірдің соңында.'},
      {name: 'Қызғылт', text: 'Жеңіл көлемді немесе гормондық өзгерісті көрсетуі мүмкін.'},
      {name: 'Қызғылт сары', text: 'Инфекциямен немесе тепе-теңдіктің бұзылуымен байланысты болуы мүмкін.'},
    ],
    textures: [
      {name: 'Сұйық', text: 'Ұйындысыз сұйық көлем.'},
      {name: 'Кілегейлі', text: 'Қою, тегіс құрылым.'},
      {name: 'Ұйындылар', text: 'Қанның кіші немесе үлкен ұйындылары.'},
      {name: 'Жіпше / Шырыш', text: 'Созылғыш, мөлдір немесе ақшыл.'},
      {name: 'Тін', text: 'Тін немесе шырышты қабық бөліктері.'},
    ],
    meanings: [
      {name: 'Ашық қызылдан қою қызылға дейін', text: 'Қалыпты цикл. Денеңіз жатыр қабатын тастап жатыр.'},
      {name: 'Қоңыр', text: 'Ескірек қан, алаңдайтын ештеңе жоқ.'},
      {name: 'Қызғылт', text: 'Етеккірдің басында/соңында немесе гормондық тепе-теңсіздікте болуы мүмкін.'},
      {name: 'Қызғылт сары', text: 'Күшті иіс, қышу немесе ауырумен бірге жүрсе, бақылаңыз.'},
    ],
    warningTitle: 'Назар аударатын белгілер',
    warningItems: [
      'Өте мол қан кету (қорғаныс құралын әр 1–2 сағат сайын ауыстыру)',
      'Үнемі өте үлкен ұйындылардың шығуы',
      'Тұрақты жағымсыз иіс немесе қышу',
      'Әдеттен тыс қатты ауыру',
    ],
    advice: [
      {title: 'Көлемді бақылаңыз', text: 'Ай сайын кез келген өзгерісті жазып қойыңыз.'},
      {title: 'Дұрыс қорғанысты таңдаңыз', text: 'Көлеміңіз бен жайлылығыңызға қарай.'},
      {title: 'Денеңізді тыңдаңыз', text: 'Ол сізге құнды белгілер береді.'},
      {title: 'Күмән туындаса', text: 'Медицина маманымен сөйлесіңіз.'},
    ],
    shareMessage: 'Етеккір көлемі: түстер мен құрылымды түсіну — AWA',
  },
  wo: {
    badge: 'WËRSËG AK WÉR',
    title: 'Deret bu règle: xam\nkuloor ak anam',
    metaDuration: '4 simili jàng',
    metaType: 'Ndigal',
    metaLevel: 'Tàmbali',
    metaValidated: 'Mbind bu ñu seetlu',
    intro:
      'Kuloor ak anamu sa règle dafay wax lu bari ci sa wérum hormon. Jàng leen ngir gën a xam sa wërsëg.',
    contentsTitle: 'Ci bind bii',
    contents: [
      'Kuloor yu deret bu règle',
      'Anam yu deret bi',
      'Li kuloor bu nekk mën a wone',
      'Kañ ngay tiital?',
      'Sunu ndigal ngir dimbli nga gën a xam sa bopp',
    ],
    colors: [
      {name: 'Xonq bu leer', text: 'Deret bu bees. Daa feeñ ci tàmbalig sa règle.'},
      {name: 'Xonq bu lëndëm', text: 'Deret bu yàgg, daa jub ci digg wërsëg bi.'},
      {name: 'Ñuul-xonq', text: 'Deret bu oksidé, daa feeñ ci jeexu sa règle.'},
      {name: 'Roos', text: 'Mën na wone deret bu neex walla soppi bu hormon.'},
      {name: 'Oraŋ', text: 'Mën na bokk ak benn feebar walla benn jubluñ.'},
    ],
    textures: [
      {name: 'Ndox', text: 'Deret bu daw, te amul dëgër.'},
      {name: 'Ni kirem', text: 'Anam bu dëgmal, bu neex.'},
      {name: 'Deret yu dëgër', text: 'Deret yu dëgër yu ndaw walla yu mag.'},
      {name: 'Delloo / Ndox', text: 'Bu xëtt, bu leer walla bu weex.'},
      {name: 'Yaram', text: 'Cér yu yaram walla yu membaran.'},
    ],
    meanings: [
      {name: 'Xonq bu leer ba bu lëndëm', text: 'Wërsëg bu cosaan. Sa yaram dafay tëx sa jëmmu ndey.'},
      {name: 'Ñuul-xonq', text: 'Deret bu yàgg, amul lu war a tiital.'},
      {name: 'Roos', text: 'Mën na am ci tàmbali/jeexu sa règle walla ak jubluñ hormon.'},
      {name: 'Oraŋ', text: 'Teg ko bu mu ànd ak xeeñ bu metti, kàmbu walla metit.'},
    ],
    warningTitle: 'Màndarga yu war a teg',
    warningItems: [
      'Deret bu bari lool (soppi aar ci 1–2 waxtu)',
      'Deret yu dëgër yu mag lool yu dellusi',
      'Xeeñ bu bon walla kàmbu bu sax',
      'Metit bu metti lu cosaan',
    ],
    advice: [
      {title: 'Seetlu sa deret', text: 'Bind soppi bu nekk ci weer ak weer.'},
      {title: 'Tànn aar bu méngoo', text: 'Ci sa deret ak sa neex.'},
      {title: 'Déglul sa yaram', text: 'Dafay la joxe màndarga yu am njariñ.'},
      {title: 'Bu am xel-ñaar', text: 'Wax ak benn liggéeykatu wér.'},
    ],
    shareMessage: 'Deret bu règle: xam kuloor ak anam — AWA',
  },
  ha: {
    badge: 'ZAGAYE & JIN DAƊI',
    title: 'Jinin haila: fahimtar\nlaunuka da yanayi',
    metaDuration: 'karatun minti 4',
    metaType: 'Jagora',
    metaLevel: 'Mafari',
    metaValidated: 'Abun da aka duba',
    intro:
      'Launi da yanayin hailarki suna faɗin abubuwa da yawa game da lafiyar hormone ɗinki. Koyi karanta su don fahimtar zagayenki da kyau.',
    contentsTitle: 'A cikin wannan labari',
    contents: [
      'Launukan jinin haila',
      'Yanayin jinin',
      'Abin da kowane launi zai iya nuna',
      'Yaushe ya kamata ki damu?',
      'Shawarwarinmu don taimaka miki ki san kanki da kyau',
    ],
    colors: [
      {name: 'Ja mai haske', text: 'Jini sabo. Ya zama ruwan dare a farkon hailarki.'},
      {name: 'Ja mai duhu', text: 'Jini tsoho, al’ada a tsakiyar zagaye.'},
      {name: 'Launin ruwan ƙasa', text: 'Jini da iskar oxygen ta shafa, galibi a ƙarshen hailarki.'},
      {name: 'Ruwan hoda', text: 'Zai iya nuna jini kaɗan ko sauyin hormone.'},
      {name: 'Orange', text: 'Zai iya alaƙa da kamuwa da cuta ko rashin daidaito.'},
    ],
    textures: [
      {name: 'Ruwa-ruwa', text: 'Jini mai ruwa, ba tare da gudaji ba.'},
      {name: 'Mai tsami-tsami', text: 'Yanayi mai kauri, santsi.'},
      {name: 'Gudajen jini', text: 'Ƙanana ko manyan gudajen jini.'},
      {name: 'Mai mikewa / Majina', text: 'Mai mikewa, bayyananne ko fari-fari.'},
      {name: 'Naman jiki', text: 'Guntayen nama ko fatar ciki.'},
    ],
    meanings: [
      {name: 'Ja mai haske zuwa mai duhu', text: 'Zagaye na al’ada. Jikinki yana zubar da bangon mahaifa.'},
      {name: 'Launin ruwan ƙasa', text: 'Jini tsoho, babu abin damuwa.'},
      {name: 'Ruwan hoda', text: 'Zai iya faruwa a farko/ƙarshen hailarki ko tare da rashin daidaiton hormone.'},
      {name: 'Orange', text: 'Kula idan yana tare da ƙamshi mai ƙarfi, ƙaiƙayi, ko ciwo.'},
    ],
    warningTitle: 'Alamomin da za a lura da su',
    warningItems: [
      'Zubar jini mai yawa sosai (canza kariya kowace sa’a 1–2)',
      'Fitar manyan gudajen jini akai-akai',
      'Ƙamshi mara kyau ko ƙaiƙayi mai dawwama',
      'Ciwo mai ƙarfi ba na al’ada ba',
    ],
    advice: [
      {title: 'Lura da jinin hailarki', text: 'Rubuta duk wani sauyi kowane wata.'},
      {title: 'Zaɓi kariya mai dacewa', text: 'Bisa yawan jininki da jin daɗinki.'},
      {title: 'Saurari jikinki', text: 'Yana ba ki alamomi masu amfani.'},
      {title: 'Idan kina cikin shakka', text: 'Yi magana da ma’aikacin lafiya.'},
    ],
    shareMessage: 'Jinin haila: fahimtar launuka da yanayi — AWA',
  },
  am: {
    badge: 'ዑደት እና ደህንነት',
    title: 'የወር አበባ ፍሰት፦ ቀለሞችንና\nይዘቶችን መረዳት',
    metaDuration: '4 ደቂቃ ንባብ',
    metaType: 'መመሪያ',
    metaLevel: 'ጀማሪ',
    metaValidated: 'የተረጋገጠ ይዘት',
    intro:
      'የወር አበባሽ ቀለምና ይዘት ስለ ሆርሞን ጤናሽ ብዙ ይናገራሉ። ዑደትሽን በተሻለ ለመረዳት እነሱን ማንበብ ተማሪ።',
    contentsTitle: 'በዚህ ጽሑፍ ውስጥ',
    contents: [
      'የወር አበባ ፍሰት ቀለሞች',
      'የፍሰት ይዘቶች',
      'እያንዳንዱ ቀለም ምን ሊያመለክት ይችላል',
      'መቼ መጨነቅ ይገባሻል?',
      'ራስሽን በተሻለ እንድታውቂ የሚረዱ ምክሮቻችን',
    ],
    colors: [
      {name: 'ደማቅ ቀይ', text: 'አዲስ ፍሰት፣ አዲስ ደም። በወር አበባሽ ጅማሬ የተለመደ።'},
      {name: 'ጥቁር ቀይ', text: 'የቆየ ደም፣ በዑደቱ መሃል የተለመደ።'},
      {name: 'ቡናማ', text: 'ኦክሳይድ የሆነ ደም፣ ብዙውን ጊዜ በወር አበባሽ መጨረሻ።'},
      {name: 'ሮዝ', text: 'ቀላል ፍሰት ወይም የሆርሞን ለውጥ ሊያመለክት ይችላል።'},
      {name: 'ብርቱካናማ', text: 'ከኢንፌክሽን ወይም ከሚዛን መዛባት ጋር ሊያያዝ ይችላል።'},
    ],
    textures: [
      {name: 'ፈሳሽ', text: 'ያለ መርጋት ፈሳሽ ፍሰት።'},
      {name: 'ክሬም መሰል', text: 'ወፍራም፣ ለስላሳ ይዘት።'},
      {name: 'የደም መርጋት', text: 'ትናንሽ ወይም ትላልቅ የደም መርጋቶች።'},
      {name: 'ክር መሰል / ንፋጭ', text: 'ተለጣጭ፣ ጥርት ያለ ወይም ነጭ-ነጭ።'},
      {name: 'ሕብረ ሕዋስ', text: 'የሕብረ ሕዋስ ወይም የሽፋን ቁርጥራጮች።'},
    ],
    meanings: [
      {name: 'ከደማቅ እስከ ጥቁር ቀይ', text: 'መደበኛ ዑደት። ሰውነትሽ የማህፀን ሽፋን እያፈሰሰ ነው።'},
      {name: 'ቡናማ', text: 'የቆየ ደም፣ የሚያሳስብ ነገር የለም።'},
      {name: 'ሮዝ', text: 'በወር አበባሽ ጅማሬ/መጨረሻ ወይም በሆርሞን ሚዛን መዛባት ሊከሰት ይችላል።'},
      {name: 'ብርቱካናማ', text: 'ከጠንካራ ሽታ፣ ከማሳከክ ወይም ከህመም ጋር ከሆነ ተከታተይው።'},
    ],
    warningTitle: 'ልብ ልትይባቸው የሚገቡ ምልክቶች',
    warningItems: [
      'በጣም ብዙ ደም መፍሰስ (መከላከያን በየ1–2 ሰዓት መቀየር)',
      'አዘውትሮ በጣም ትላልቅ የደም መርጋቶች መውጣት',
      'የሚቀጥል መጥፎ ሽታ ወይም ማሳከክ',
      'ያልተለመደ ከባድ ህመም',
    ],
    advice: [
      {title: 'ፍሰትሽን ታዘቢ', text: 'በየወሩ ማንኛውንም ለውጥ ጻፊ።'},
      {title: 'ትክክለኛውን መከላከያ ምረጪ', text: 'በፍሰትሽና በምቾትሽ መሠረት።'},
      {title: 'ሰውነትሽን አዳምጪ', text: 'ጠቃሚ ምልክቶችን ይሰጥሻል።'},
      {title: 'ጥርጣሬ ካለ', text: 'ከጤና ባለሙያ ጋር ተነጋገሪ።'},
    ],
    shareMessage: 'የወር አበባ ፍሰት፦ ቀለሞችንና ይዘቶችን መረዳት — AWA',
  },
  nl: {
    badge: 'CYCLUS & WELZIJN',
    title: 'Menstruatiebloeding: kleuren\nen texturen begrijpen',
    metaDuration: '4 min lezen',
    metaType: 'Gids',
    metaLevel: 'Beginner',
    metaValidated: 'Gecontroleerde inhoud',
    intro:
      'De kleur en textuur van je menstruatie zeggen veel over je hormonale gezondheid. Leer ze lezen om je cyclus beter te begrijpen.',
    contentsTitle: 'In dit artikel',
    contents: [
      'De kleuren van menstruatiebloed',
      'De texturen van de bloeding',
      'Wat elke kleur kan aanduiden',
      'Wanneer moet je je zorgen maken?',
      'Onze tips om jezelf beter te leren kennen',
    ],
    colors: [
      {name: 'Helderrood', text: 'Verse bloeding, nieuw bloed. Gebruikelijk aan het begin van je menstruatie.'},
      {name: 'Donkerrood', text: 'Ouder bloed, normaal halverwege de cyclus.'},
      {name: 'Bruin', text: 'Geoxideerd bloed, vaak aan het einde van je menstruatie.'},
      {name: 'Roze', text: 'Kan wijzen op een lichte bloeding of een hormonale verandering.'},
      {name: 'Oranje', text: 'Kan verband houden met een infectie of een verstoring.'},
    ],
    textures: [
      {name: 'Vloeibaar', text: 'Vloeibare bloeding, zonder klonten.'},
      {name: 'Romig', text: 'Dikke, gladde textuur.'},
      {name: 'Stolsels', text: 'Kleine of grote bloedstolsels.'},
      {name: 'Draderig / Slijmerig', text: 'Rekbaar, helder of witachtig.'},
      {name: 'Weefsel', text: 'Stukjes weefsel of slijmvlies.'},
    ],
    meanings: [
      {name: 'Helderrood tot donkerrood', text: 'Normale cyclus. Je lichaam stoot het baarmoederslijmvlies af.'},
      {name: 'Bruin', text: 'Ouder bloed, niets om je zorgen over te maken.'},
      {name: 'Roze', text: 'Kan aan het begin/einde van je menstruatie of bij een hormonale verstoring voorkomen.'},
      {name: 'Oranje', text: 'In de gaten houden als het gepaard gaat met een sterke geur, jeuk of pijn.'},
    ],
    warningTitle: 'Tekenen om op te letten',
    warningItems: [
      'Zeer hevig bloedverlies (bescherming elke 1–2 uur verwisselen)',
      'Regelmatig zeer grote stolsels verliezen',
      'Aanhoudende slechte geur of jeuk',
      'Ongewoon hevige pijn',
    ],
    advice: [
      {title: 'Observeer je bloeding', text: 'Noteer elke maand eventuele veranderingen.'},
      {title: 'Kies de juiste bescherming', text: 'Op basis van je bloeding en je comfort.'},
      {title: 'Luister naar je lichaam', text: 'Het geeft je waardevolle signalen.'},
      {title: 'Bij twijfel', text: 'Praat met een zorgverlener.'},
    ],
    shareMessage: 'Menstruatiebloeding: kleuren en texturen begrijpen — AWA',
  },
  fi: {
    badge: 'KIERTO JA HYVINVOINTI',
    title: 'Kuukautisvuoto: värien ja\nrakenteiden ymmärtäminen',
    metaDuration: '4 min lukuaika',
    metaType: 'Opas',
    metaLevel: 'Aloittelija',
    metaValidated: 'Tarkistettu sisältö',
    intro:
      'Kuukautistesi väri ja rakenne kertovat paljon hormonaalisesta terveydestäsi. Opi lukemaan niitä ymmärtääksesi kiertoasi paremmin.',
    contentsTitle: 'Tässä artikkelissa',
    contents: [
      'Kuukautisvuodon värit',
      'Vuodon rakenteet',
      'Mitä kukin väri voi tarkoittaa',
      'Milloin pitäisi huolestua?',
      'Vinkkimme itsetuntemuksen lisäämiseen',
    ],
    colors: [
      {name: 'Kirkkaanpunainen', text: 'Tuore vuoto, uusi veri. Yleinen kuukautisten alussa.'},
      {name: 'Tummanpunainen', text: 'Vanhempaa verta, normaalia kierron keskivaiheilla.'},
      {name: 'Ruskea', text: 'Hapettunutta verta, usein kuukautisten lopussa.'},
      {name: 'Vaaleanpunainen', text: 'Voi viitata niukkaan vuotoon tai hormonaaliseen muutokseen.'},
      {name: 'Oranssi', text: 'Voi liittyä infektioon tai epätasapainoon.'},
    ],
    textures: [
      {name: 'Nestemäinen', text: 'Juokseva vuoto ilman möykkyjä.'},
      {name: 'Kermamainen', text: 'Paksu, sileä rakenne.'},
      {name: 'Hyytymät', text: 'Pieniä tai suuria verihyytymiä.'},
      {name: 'Rihmamainen / lima', text: 'Venyvä, kirkas tai valkeahko.'},
      {name: 'Kudos', text: 'Kudoksen tai limakalvon paloja.'},
    ],
    meanings: [
      {name: 'Kirkkaanpunaisesta tummanpunaiseen', text: 'Normaali kierto. Kehosi poistaa kohdun limakalvoa.'},
      {name: 'Ruskea', text: 'Vanhempaa verta, ei syytä huoleen.'},
      {name: 'Vaaleanpunainen', text: 'Voi esiintyä kuukautisten alussa/lopussa tai hormonaalisen epätasapainon yhteydessä.'},
      {name: 'Oranssi', text: 'Seuraa tilannetta, jos mukana on voimakas haju, kutina tai kipu.'},
    ],
    warningTitle: 'Huomioitavat merkit',
    warningItems: [
      'Hyvin runsas vuoto (suojan vaihto 1–2 tunnin välein)',
      'Säännöllisesti erittäin suurten hyytymien poistuminen',
      'Pitkäkestoinen paha haju tai kutina',
      'Epätavallisen voimakas kipu',
    ],
    advice: [
      {title: 'Havainnoi vuotoasi', text: 'Kirjaa muutokset joka kuukausi.'},
      {title: 'Valitse oikea suoja', text: 'Vuotosi ja mukavuutesi mukaan.'},
      {title: 'Kuuntele kehoasi', text: 'Se antaa sinulle arvokkaita signaaleja.'},
      {title: 'Epäselvässä tilanteessa', text: 'Puhu terveydenhuollon ammattilaisen kanssa.'},
    ],
    shareMessage: 'Kuukautisvuoto: värien ja rakenteiden ymmärtäminen — AWA',
  },
  el: {
    badge: 'ΚΥΚΛΟΣ ΚΑΙ ΕΥΕΞΙΑ',
    title: 'Εμμηνορροϊκή ροή: κατανοώντας\nχρώματα και υφές',
    metaDuration: '4 λεπτά ανάγνωσης',
    metaType: 'Οδηγός',
    metaLevel: 'Αρχάριο',
    metaValidated: 'Ελεγμένο περιεχόμενο',
    intro:
      'Το χρώμα και η υφή της περιόδου σου λένε πολλά για την ορμονική σου υγεία. Μάθε να τα διαβάζεις για να κατανοείς καλύτερα τον κύκλο σου.',
    contentsTitle: 'Σε αυτό το άρθρο',
    contents: [
      'Τα χρώματα της εμμηνορροϊκής ροής',
      'Οι υφές της ροής',
      'Τι μπορεί να υποδεικνύει κάθε χρώμα',
      'Πότε πρέπει να ανησυχείς;',
      'Οι συμβουλές μας για να γνωρίσεις καλύτερα τον εαυτό σου',
    ],
    colors: [
      {name: 'Έντονο κόκκινο', text: 'Φρέσκια ροή, νέο αίμα. Συχνό στην αρχή της περιόδου.'},
      {name: 'Σκούρο κόκκινο', text: 'Παλαιότερο αίμα, φυσιολογικό στα μέσα του κύκλου.'},
      {name: 'Καφέ', text: 'Οξειδωμένο αίμα, συχνά στο τέλος της περιόδου.'},
      {name: 'Ροζ', text: 'Μπορεί να υποδεικνύει ελαφριά ροή ή ορμονική αλλαγή.'},
      {name: 'Πορτοκαλί', text: 'Μπορεί να συνδέεται με λοίμωξη ή ανισορροπία.'},
    ],
    textures: [
      {name: 'Ρευστή', text: 'Υγρή ροή, χωρίς σβώλους.'},
      {name: 'Κρεμώδης', text: 'Πηχτή, λεία υφή.'},
      {name: 'Θρόμβοι', text: 'Μικροί ή μεγάλοι θρόμβοι αίματος.'},
      {name: 'Νηματώδης / βλέννα', text: 'Ελαστική, διαυγής ή υπόλευκη.'},
      {name: 'Ιστός', text: 'Κομμάτια ιστού ή βλεννογόνου.'},
    ],
    meanings: [
      {name: 'Έντονο έως σκούρο κόκκινο', text: 'Φυσιολογικός κύκλος. Το σώμα σου αποβάλλει το επιθήλιο της μήτρας.'},
      {name: 'Καφέ', text: 'Παλαιότερο αίμα, δεν υπάρχει λόγος ανησυχίας.'},
      {name: 'Ροζ', text: 'Μπορεί να εμφανιστεί στην αρχή/στο τέλος της περιόδου ή με ορμονική ανισορροπία.'},
      {name: 'Πορτοκαλί', text: 'Παρακολούθησέ το αν συνοδεύεται από έντονη μυρωδιά, φαγούρα ή πόνο.'},
    ],
    warningTitle: 'Σημάδια που πρέπει να προσέχεις',
    warningItems: [
      'Πολύ έντονη αιμορραγία (αλλαγή προστασίας κάθε 1–2 ώρες)',
      'Τακτική αποβολή πολύ μεγάλων θρόμβων',
      'Επίμονη κακοσμία ή φαγούρα',
      'Ασυνήθιστα έντονος πόνος',
    ],
    advice: [
      {title: 'Παρατήρησε τη ροή σου', text: 'Σημείωσε τυχόν αλλαγές κάθε μήνα.'},
      {title: 'Επίλεξε τη σωστή προστασία', text: 'Ανάλογα με τη ροή και την άνεσή σου.'},
      {title: 'Άκου το σώμα σου', text: 'Σου δίνει πολύτιμα σήματα.'},
      {title: 'Αν έχεις αμφιβολίες', text: 'Μίλησε με έναν επαγγελματία υγείας.'},
    ],
    shareMessage: 'Εμμηνορροϊκή ροή: κατανοώντας χρώματα και υφές — AWA',
  },
  fil: {
    badge: 'SIKLO AT KAGINHAWAAN',
    title: 'Daloy ng regla: pag-unawa sa\nmga kulay at tekstura',
    metaDuration: '4 min na babasahin',
    metaType: 'Gabay',
    metaLevel: 'Baguhan',
    metaValidated: 'Sinuring nilalaman',
    intro:
      'Maraming sinasabi ang kulay at tekstura ng iyong regla tungkol sa iyong hormonal na kalusugan. Matutunan itong basahin para mas maunawaan ang iyong siklo.',
    contentsTitle: 'Sa artikulong ito',
    contents: [
      'Ang mga kulay ng daloy ng regla',
      'Ang mga tekstura ng daloy',
      'Ano ang maaaring ipahiwatig ng bawat kulay',
      'Kailan dapat mag-alala?',
      'Mga payo namin para mas makilala mo ang sarili mo',
    ],
    colors: [
      {name: 'Matingkad na pula', text: 'Sariwang daloy, bagong dugo. Karaniwan sa simula ng iyong regla.'},
      {name: 'Madilim na pula', text: 'Mas lumang dugo, normal sa kalagitnaan ng siklo.'},
      {name: 'Kayumanggi', text: 'Na-oxidize na dugo, madalas sa katapusan ng iyong regla.'},
      {name: 'Rosas', text: 'Maaaring magpahiwatig ng magaang daloy o pagbabago sa hormone.'},
      {name: 'Kahel', text: 'Maaaring may kaugnayan sa impeksyon o hindi balanse.'},
    ],
    textures: [
      {name: 'Likido', text: 'Malabnaw na daloy, walang buo-buo.'},
      {name: 'Malapot at makinis', text: 'Makapal at makinis na tekstura.'},
      {name: 'Mga namuong dugo', text: 'Maliit o malaking namuong dugo.'},
      {name: 'Malagkit / Mucus', text: 'Nababanat, malinaw o maputi.'},
      {name: 'Tisyu', text: 'Mga piraso ng tisyu o mucous membrane.'},
    ],
    meanings: [
      {name: 'Matingkad hanggang madilim na pula', text: 'Normal na siklo. Inaalis ng iyong katawan ang lining ng matris.'},
      {name: 'Kayumanggi', text: 'Mas lumang dugo, walang dapat ikabahala.'},
      {name: 'Rosas', text: 'Maaaring mangyari sa simula/katapusan ng iyong regla o kapag may hormonal na hindi balanse.'},
      {name: 'Kahel', text: 'Bantayan ito kung may kasamang matapang na amoy, pangangati, o sakit.'},
    ],
    warningTitle: 'Mga senyales na dapat bantayan',
    warningItems: [
      'Napakalakas na pagdurugo (nagpapalit ng proteksyon kada 1–2 oras)',
      'Regular na paglabas ng napakalalaking namuong dugo',
      'Patuloy na masamang amoy o pangangati',
      'Hindi pangkaraniwang matinding sakit',
    ],
    advice: [
      {title: 'Obserbahan ang iyong daloy', text: 'Itala ang anumang pagbabago bawat buwan.'},
      {title: 'Piliin ang tamang proteksyon', text: 'Batay sa iyong daloy at ginhawa.'},
      {title: 'Pakinggan ang iyong katawan', text: 'Nagbibigay ito sa iyo ng mahahalagang senyales.'},
      {title: 'Kung nag-aalinlangan', text: 'Makipag-usap sa isang propesyonal sa kalusugan.'},
    ],
    shareMessage: 'Daloy ng regla: pag-unawa sa mga kulay at tekstura — AWA',
  },
  ta: {
    badge: 'சுழற்சியும் நலமும்',
    title: 'மாதவிடாய் ஓட்டம்: நிறங்களையும்\nதன்மைகளையும் புரிந்துகொள்ளுதல்',
    metaDuration: '4 நிமிடம் படிக்க',
    metaType: 'வழிகாட்டி',
    metaLevel: 'தொடக்க நிலை',
    metaValidated: 'சரிபார்க்கப்பட்ட உள்ளடக்கம்',
    intro:
      'உங்கள் மாதவிடாயின் நிறமும் தன்மையும் உங்கள் ஹார்மோன் ஆரோக்கியத்தைப் பற்றி நிறையச் சொல்கின்றன. உங்கள் சுழற்சியை நன்கு புரிந்துகொள்ள அவற்றை வாசிக்கக் கற்றுக்கொள்ளுங்கள்.',
    contentsTitle: 'இந்தக் கட்டுரையில்',
    contents: [
      'மாதவிடாய் ஓட்டத்தின் நிறங்கள்',
      'ஓட்டத்தின் தன்மைகள்',
      'ஒவ்வொரு நிறமும் எதைக் குறிக்கலாம்',
      'எப்போது கவலைப்பட வேண்டும்?',
      'உங்களை நன்கு அறிய எங்கள் குறிப்புகள்',
    ],
    colors: [
      {name: 'பிரகாசமான சிவப்பு', text: 'புதிய ஓட்டம், புதிய இரத்தம். உங்கள் மாதவிடாயின் தொடக்கத்தில் பொதுவானது.'},
      {name: 'அடர் சிவப்பு', text: 'பழைய இரத்தம், சுழற்சியின் நடுவில் இயல்பானது.'},
      {name: 'பழுப்பு', text: 'ஆக்சிஜனேற்றமடைந்த இரத்தம், பெரும்பாலும் உங்கள் மாதவிடாயின் முடிவில்.'},
      {name: 'இளஞ்சிவப்பு', text: 'லேசான ஓட்டத்தை அல்லது ஹார்மோன் மாற்றத்தைக் குறிக்கலாம்.'},
      {name: 'ஆரஞ்சு', text: 'ஒரு தொற்று அல்லது சமநிலையின்மையுடன் தொடர்புடையதாக இருக்கலாம்.'},
    ],
    textures: [
      {name: 'திரவம்', text: 'கட்டிகள் இல்லாத திரவ ஓட்டம்.'},
      {name: 'க்ரீம் போன்றது', text: 'அடர்த்தியான, மென்மையான தன்மை.'},
      {name: 'இரத்தக் கட்டிகள்', text: 'சிறிய அல்லது பெரிய இரத்தக் கட்டிகள்.'},
      {name: 'இழுபடும் / சளி', text: 'இழுபடும், தெளிவான அல்லது வெண்மையான.'},
      {name: 'திசு', text: 'திசு அல்லது சளிச்சவ்வின் துண்டுகள்.'},
    ],
    meanings: [
      {name: 'பிரகாசமான முதல் அடர் சிவப்பு வரை', text: 'இயல்பான சுழற்சி. உங்கள் உடல் கருப்பையின் உள்படலத்தை வெளியேற்றுகிறது.'},
      {name: 'பழுப்பு', text: 'பழைய இரத்தம், கவலைப்பட எதுவும் இல்லை.'},
      {name: 'இளஞ்சிவப்பு', text: 'உங்கள் மாதவிடாயின் தொடக்கத்தில்/முடிவில் அல்லது ஹார்மோன் சமநிலையின்மையுடன் ஏற்படலாம்.'},
      {name: 'ஆரஞ்சு', text: 'வலுவான மணம், அரிப்பு அல்லது வலியுடன் சேர்ந்து வந்தால் கவனியுங்கள்.'},
    ],
    warningTitle: 'கவனிக்க வேண்டிய அறிகுறிகள்',
    warningItems: [
      'மிக அதிகமான இரத்தப்போக்கு (ஒவ்வொரு 1–2 மணிநேரத்துக்கும் பாதுகாப்பை மாற்றுதல்)',
      'தொடர்ந்து மிகப் பெரிய இரத்தக் கட்டிகள் வெளியேறுதல்',
      'தொடர்ந்த துர்நாற்றம் அல்லது அரிப்பு',
      'வழக்கத்துக்கு மாறான தீவிர வலி',
    ],
    advice: [
      {title: 'உங்கள் ஓட்டத்தைக் கவனியுங்கள்', text: 'ஒவ்வொரு மாதமும் ஏதேனும் மாற்றங்களைக் குறியுங்கள்.'},
      {title: 'சரியான பாதுகாப்பைத் தேர்ந்தெடுங்கள்', text: 'உங்கள் ஓட்டத்தையும் வசதியையும் அடிப்படையாகக் கொண்டு.'},
      {title: 'உங்கள் உடலுக்குச் செவிகொடுங்கள்', text: 'அது உங்களுக்கு மதிப்புமிக்க சமிக்ஞைகளைத் தருகிறது.'},
      {title: 'சந்தேகம் இருந்தால்', text: 'ஒரு சுகாதார நிபுணரிடம் பேசுங்கள்.'},
    ],
    shareMessage: 'மாதவிடாய் ஓட்டம்: நிறங்களையும் தன்மைகளையும் புரிந்துகொள்ளுதல் — AWA',
  },
  te: {
    badge: 'చక్రం & శ్రేయస్సు',
    title: 'నెలసరి రక్తస్రావం: రంగులు,\nస్వభావాలను అర్థం చేసుకోవడం',
    metaDuration: '4 నిమిషాల పఠనం',
    metaType: 'గైడ్',
    metaLevel: 'ప్రారంభ స్థాయి',
    metaValidated: 'మదింపు చేసిన కంటెంట్',
    intro:
      'మీ నెలసరి రంగు, స్వభావం మీ హార్మోన్ ఆరోగ్యం గురించి చాలా చెబుతాయి. మీ చక్రాన్ని మరింత బాగా అర్థం చేసుకోవడానికి వాటిని చదవడం నేర్చుకోండి.',
    contentsTitle: 'ఈ వ్యాసంలో',
    contents: [
      'నెలసరి రక్తస్రావపు రంగులు',
      'రక్తస్రావపు స్వభావాలు',
      'ప్రతి రంగు ఏమి సూచించవచ్చు',
      'ఎప్పుడు ఆందోళన చెందాలి?',
      'మిమ్మల్ని మీరు బాగా తెలుసుకోవడానికి మా చిట్కాలు',
    ],
    colors: [
      {name: 'ప్రకాశవంతమైన ఎరుపు', text: 'తాజా రక్తస్రావం, కొత్త రక్తం. మీ నెలసరి ఆరంభంలో సాధారణం.'},
      {name: 'ముదురు ఎరుపు', text: 'పాత రక్తం, చక్రం మధ్యలో సహజం.'},
      {name: 'గోధుమ', text: 'ఆక్సీకరణ చెందిన రక్తం, తరచుగా మీ నెలసరి చివరలో.'},
      {name: 'గులాబీ', text: 'తేలికపాటి రక్తస్రావాన్ని లేదా హార్మోన్ మార్పును సూచించవచ్చు.'},
      {name: 'నారింజ', text: 'ఇన్ఫెక్షన్‌తో లేదా అసమతుల్యతతో ముడిపడి ఉండవచ్చు.'},
    ],
    textures: [
      {name: 'ద్రవంగా', text: 'గడ్డలు లేకుండా ద్రవ రక్తస్రావం.'},
      {name: 'క్రీమ్ లాగా', text: 'చిక్కని, నునుపైన స్వభావం.'},
      {name: 'గడ్డలు', text: 'చిన్న లేదా పెద్ద రక్తపు గడ్డలు.'},
      {name: 'తీగల్లా / స్రావం', text: 'సాగేలా, స్పష్టంగా లేదా తెల్లగా.'},
      {name: 'కణజాలం', text: 'కణజాలం లేదా శ్లేష్మ పొర ముక్కలు.'},
    ],
    meanings: [
      {name: 'ప్రకాశవంతం నుండి ముదురు ఎరుపు', text: 'సాధారణ చక్రం. మీ శరీరం కాపు కణజాల పొరను వెలుపలికి పంపుతోంది.'},
      {name: 'గోధుమ', text: 'పాత రక్తం, ఆందోళన చెందాల్సిన అవసరం లేదు.'},
      {name: 'గులాబీ', text: 'మీ నెలసరి ఆరంభంలో/చివరలో లేదా హార్మోన్ అసమతుల్యతతో జరగవచ్చు.'},
      {name: 'నారింజ', text: 'బలమైన వాసన, దురద లేదా నొప్పితో కలిసి వస్తే గమనించండి.'},
    ],
    warningTitle: 'గమనించాల్సిన సంకేతాలు',
    warningItems: [
      'చాలా ఎక్కువ రక్తస్రావం (ప్రతి 1–2 గంటలకు రక్షణను మార్చాల్సి రావడం)',
      'క్రమం తప్పకుండా చాలా పెద్ద గడ్డలు పడటం',
      'కొనసాగే దుర్వాసన లేదా దురద',
      'అసాధారణంగా తీవ్రమైన నొప్పి',
    ],
    advice: [
      {title: 'మీ రక్తస్రావాన్ని గమనించండి', text: 'ప్రతి నెలా ఏవైనా మార్పులను గమనించండి.'},
      {title: 'సరైన రక్షణను ఎంచుకోండి', text: 'మీ రక్తస్రావం, మీ సౌకర్యం ఆధారంగా.'},
      {title: 'మీ శరీరం మాట వినండి', text: 'అది మీకు విలువైన సంకేతాలు ఇస్తుంది.'},
      {title: 'సందేహం ఉంటే', text: 'ఒక ఆరోగ్య నిపుణుడితో మాట్లాడండి.'},
    ],
    shareMessage: 'నెలసరి రక్తస్రావం: రంగులు, స్వభావాలను అర్థం చేసుకోవడం — AWA',
  },
  mr: {
    badge: 'पाळी आणि सुदृढता',
    title: 'पाळीचा स्राव: रंग आणि\nपोत समजून घेणे',
    metaDuration: '4 मिनिटे वाचन',
    metaType: 'मार्गदर्शक',
    metaLevel: 'प्रारंभ स्तर',
    metaValidated: 'पुनरावलोकन केलेला मजकूर',
    intro:
      'तुमच्या पाळीचा रंग आणि पोत तुमच्या हार्मोनल आरोग्याबद्दल बरेच काही सांगतात. तुमची पाळी अधिक चांगली समजण्यासाठी ते वाचायला शिका.',
    contentsTitle: 'या लेखात',
    contents: [
      'पाळीच्या स्रावाचे रंग',
      'स्रावाचे पोत',
      'प्रत्येक रंग काय दर्शवू शकतो',
      'काळजी केव्हा करावी?',
      'स्वतःला अधिक चांगले जाणून घेण्यास मदत करणाऱ्या आमच्या टिपा',
    ],
    colors: [
      {name: 'चमकदार लाल', text: 'ताजा स्राव, नवीन रक्त. तुमच्या पाळीच्या सुरुवातीला सामान्य.'},
      {name: 'गडद लाल', text: 'जुने रक्त, पाळीच्या मध्यभागी सामान्य.'},
      {name: 'तपकिरी', text: 'ऑक्सिडाइज झालेले रक्त, बहुतेकदा तुमच्या पाळीच्या शेवटी.'},
      {name: 'गुलाबी', text: 'हलका स्राव किंवा हार्मोनल बदल दर्शवू शकतो.'},
      {name: 'नारिंगी', text: 'संसर्ग किंवा असंतुलनाशी जोडलेला असू शकतो.'},
    ],
    textures: [
      {name: 'पातळ', text: 'गुठळ्यांशिवाय द्रव स्राव.'},
      {name: 'क्रीमसारखा', text: 'घट्ट, गुळगुळीत पोत.'},
      {name: 'गुठळ्या', text: 'रक्ताच्या लहान किंवा मोठ्या गुठळ्या.'},
      {name: 'धाग्यासारखा / श्लेष्मा', text: 'ताणला जाणारा, स्वच्छ किंवा पांढरट.'},
      {name: 'ऊती', text: 'ऊतींचे किंवा श्लेष्मल पटलाचे तुकडे.'},
    ],
    meanings: [
      {name: 'चमकदार ते गडद लाल', text: 'सामान्य पाळी. तुमचे शरीर गर्भाशयाची पटल बाहेर टाकत आहे.'},
      {name: 'तपकिरी', text: 'जुने रक्त, काळजी करण्यासारखे काही नाही.'},
      {name: 'गुलाबी', text: 'तुमच्या पाळीच्या सुरुवातीला/शेवटी किंवा हार्मोनल असंतुलनात दिसू शकते.'},
      {name: 'नारिंगी', text: 'तीव्र वास, खाज किंवा वेदनेसह असल्यास लक्ष ठेवा.'},
    ],
    warningTitle: 'लक्ष ठेवायची चिन्हे',
    warningItems: [
      'खूप जास्त रक्तस्राव (दर 1–2 तासांनी संरक्षण बदलावे लागणे)',
      'नियमितपणे खूप मोठ्या गुठळ्या पडणे',
      'कायम राहणारा दुर्गंध किंवा खाज',
      'असामान्यपणे तीव्र वेदना',
    ],
    advice: [
      {title: 'तुमच्या स्रावाचे निरीक्षण करा', text: 'दर महिन्याला कोणतेही बदल नोंदवा.'},
      {title: 'योग्य संरक्षण निवडा', text: 'तुमच्या स्रावावर आणि आरामावर आधारित.'},
      {title: 'तुमच्या शरीराचे ऐका', text: 'ते तुम्हाला मौल्यवान संकेत देते.'},
      {title: 'शंका असल्यास', text: 'आरोग्य व्यावसायिकाशी बोला.'},
    ],
    shareMessage: 'पाळीचा स्राव: रंग आणि पोत समजून घेणे — AWA',
  },
  gu: {
    badge: 'ચક્ર અને સુખાકારી',
    title: 'માસિકનો સ્રાવ: રંગો અને\nબનાવટ સમજવી',
    metaDuration: '4 મિનિટ વાંચન',
    metaType: 'માર્ગદર્શિકા',
    metaLevel: 'પ્રારંભિક સ્તર',
    metaValidated: 'પુનરાવલોકન કરેલી સામગ્રી',
    intro:
      'તમારા માસિકનો રંગ અને બનાવટ તમારા હોર્મોનના આરોગ્ય વિશે ઘણું કહી જાય છે. તમારા ચક્રને વધુ સારી રીતે સમજવા માટે તેમને વાંચતાં શીખો.',
    contentsTitle: 'આ લેખમાં',
    contents: [
      'માસિકના સ્રાવના રંગો',
      'સ્રાવની બનાવટ',
      'દરેક રંગ શું સૂચવી શકે',
      'ક્યારે ચિંતા કરવી જોઈએ?',
      'પોતાને વધુ સારી રીતે ઓળખવા માટેની અમારી સલાહ',
    ],
    colors: [
      {name: 'ચળકતો લાલ', text: 'તાજો સ્રાવ, નવું લોહી. માસિકની શરૂઆતમાં સામાન્ય.'},
      {name: 'ઘેરો લાલ', text: 'જૂનું લોહી, ચક્રની વચ્ચે સામાન્ય.'},
      {name: 'બદામી', text: 'ઓક્સિડાઇઝ થયેલું લોહી, ઘણી વાર માસિકના અંતે.'},
      {name: 'ગુલાબી', text: 'હળવો સ્રાવ અથવા હોર્મોનમાં ફેરફાર સૂચવી શકે.'},
      {name: 'નારંગી', text: 'ચેપ કે અસંતુલન સાથે જોડાયેલો હોઈ શકે.'},
    ],
    textures: [
      {name: 'પ્રવાહી', text: 'પ્રવાહી સ્રાવ, ગઠ્ઠા વગરનો.'},
      {name: 'ક્રીમી', text: 'ઘટ્ટ, સુંવાળી બનાવટ.'},
      {name: 'ગઠ્ઠા', text: 'લોહીના નાના કે મોટા ગઠ્ઠા.'},
      {name: 'તારવાળો / ચીકણો સ્રાવ', text: 'ખેંચાય તેવો, સ્પષ્ટ કે સફેદ.'},
      {name: 'પેશી', text: 'પેશી કે શ્લેષ્મ પટલના ટુકડા.'},
    ],
    meanings: [
      {name: 'ચળકતા લાલથી ઘેરો લાલ', text: 'સામાન્ય ચક્ર. તમારું શરીર ગર્ભાશયનું અસ્તર બહાર કાઢી રહ્યું છે.'},
      {name: 'બદામી', text: 'જૂનું લોહી, ચિંતા કરવા જેવું કંઈ નથી.'},
      {name: 'ગુલાબી', text: 'માસિકની શરૂઆત/અંતે અથવા હોર્મોનના અસંતુલન સાથે થઈ શકે.'},
      {name: 'નારંગી', text: 'જો તીવ્ર ગંધ, ખંજવાળ કે દુખાવો સાથે હોય તો તેના પર ધ્યાન રાખો.'},
    ],
    warningTitle: 'ધ્યાન રાખવા જેવા સંકેતો',
    warningItems: [
      'ખૂબ વધારે રક્તસ્રાવ (દર 1–2 કલાકે સંરક્ષણ બદલવું પડે)',
      'નિયમિત રીતે ખૂબ મોટા ગઠ્ઠા નીકળવા',
      'સતત દુર્ગંધ કે ખંજવાળ',
      'અસામાન્ય રીતે તીવ્ર દુખાવો',
    ],
    advice: [
      {title: 'તમારા સ્રાવનું અવલોકન કરો', text: 'દર મહિને થતા કોઈ પણ ફેરફાર નોંધો.'},
      {title: 'યોગ્ય સંરક્ષણ પસંદ કરો', text: 'તમારા સ્રાવ અને તમારા આરામ પ્રમાણે.'},
      {title: 'તમારા શરીરને સાંભળો', text: 'તે તમને મૂલ્યવાન સંકેતો આપે છે.'},
      {title: 'શંકા હોય તો', text: 'આરોગ્ય વ્યાવસાયિક સાથે વાત કરો.'},
    ],
    shareMessage: 'માસિકનો સ્રાવ: રંગો અને બનાવટ સમજવી — AWA',
  },
  pa: {
    badge: 'ਚੱਕਰ ਅਤੇ ਤੰਦਰੁਸਤੀ',
    title: 'ਮਾਹਵਾਰੀ ਦਾ ਵਹਾਅ: ਰੰਗਾਂ ਅਤੇ\nਬਣਤਰ ਨੂੰ ਸਮਝਣਾ',
    metaDuration: '4 ਮਿੰਟ ਪੜ੍ਹਨ',
    metaType: 'ਗਾਈਡ',
    metaLevel: 'ਸ਼ੁਰੂਆਤੀ ਪੱਧਰ',
    metaValidated: 'ਸਮੀਖਿਆ ਕੀਤੀ ਸਮੱਗਰੀ',
    intro:
      'ਤੁਹਾਡੀ ਮਾਹਵਾਰੀ ਦਾ ਰੰਗ ਅਤੇ ਬਣਤਰ ਤੁਹਾਡੀ ਹਾਰਮੋਨ ਸਿਹਤ ਬਾਰੇ ਬਹੁਤ ਕੁਝ ਦੱਸਦੇ ਹਨ। ਆਪਣੇ ਚੱਕਰ ਨੂੰ ਬਿਹਤਰ ਸਮਝਣ ਲਈ ਇਨ੍ਹਾਂ ਨੂੰ ਪੜ੍ਹਨਾ ਸਿੱਖੋ।',
    contentsTitle: 'ਇਸ ਲੇਖ ਵਿੱਚ',
    contents: [
      'ਮਾਹਵਾਰੀ ਦੇ ਵਹਾਅ ਦੇ ਰੰਗ',
      'ਵਹਾਅ ਦੀ ਬਣਤਰ',
      'ਹਰ ਰੰਗ ਕੀ ਦਰਸਾ ਸਕਦਾ ਹੈ',
      'ਚਿੰਤਾ ਕਦੋਂ ਕਰਨੀ ਚਾਹੀਦੀ ਹੈ?',
      'ਆਪਣੇ ਆਪ ਨੂੰ ਬਿਹਤਰ ਜਾਣਨ ਲਈ ਸਾਡੀਆਂ ਸਲਾਹਾਂ',
    ],
    colors: [
      {name: 'ਚਮਕਦਾਰ ਲਾਲ', text: 'ਤਾਜ਼ਾ ਵਹਾਅ, ਨਵਾਂ ਖ਼ੂਨ। ਮਾਹਵਾਰੀ ਦੀ ਸ਼ੁਰੂਆਤ ਵਿੱਚ ਆਮ ਹੈ।'},
      {name: 'ਗੂੜ੍ਹਾ ਲਾਲ', text: 'ਪੁਰਾਣਾ ਖ਼ੂਨ, ਚੱਕਰ ਦੇ ਵਿਚਕਾਰ ਆਮ ਹੈ।'},
      {name: 'ਭੂਰਾ', text: 'ਆਕਸੀਕ੍ਰਿਤ ਖ਼ੂਨ, ਅਕਸਰ ਮਾਹਵਾਰੀ ਦੇ ਅੰਤ ਵਿੱਚ।'},
      {name: 'ਗੁਲਾਬੀ', text: 'ਹਲਕਾ ਵਹਾਅ ਜਾਂ ਹਾਰਮੋਨ ਵਿੱਚ ਬਦਲਾਅ ਦਰਸਾ ਸਕਦਾ ਹੈ।'},
      {name: 'ਸੰਤਰੀ', text: 'ਲਾਗ ਜਾਂ ਅਸੰਤੁਲਨ ਨਾਲ ਜੁੜਿਆ ਹੋ ਸਕਦਾ ਹੈ।'},
    ],
    textures: [
      {name: 'ਪਤਲਾ', text: 'ਤਰਲ ਵਹਾਅ, ਬਿਨਾਂ ਥੱਕਿਆਂ ਦੇ।'},
      {name: 'ਮਲਾਈਦਾਰ', text: 'ਗਾੜ੍ਹੀ, ਮੁਲਾਇਮ ਬਣਤਰ।'},
      {name: 'ਥੱਕੇ', text: 'ਖ਼ੂਨ ਦੇ ਛੋਟੇ ਜਾਂ ਵੱਡੇ ਥੱਕੇ।'},
      {name: 'ਲੇਸਦਾਰ / ਰਿਸਾਅ', text: 'ਖਿੱਚਣ ਵਾਲਾ, ਸਾਫ਼ ਜਾਂ ਚਿੱਟਾ।'},
      {name: 'ਟਿਸ਼ੂ', text: 'ਟਿਸ਼ੂ ਜਾਂ ਝਿੱਲੀ ਦੇ ਟੁਕੜੇ।'},
    ],
    meanings: [
      {name: 'ਚਮਕਦਾਰ ਤੋਂ ਗੂੜ੍ਹਾ ਲਾਲ', text: 'ਆਮ ਚੱਕਰ। ਤੁਹਾਡਾ ਸਰੀਰ ਬੱਚੇਦਾਨੀ ਦੀ ਅੰਦਰਲੀ ਪਰਤ ਨੂੰ ਬਾਹਰ ਕੱਢ ਰਿਹਾ ਹੈ।'},
      {name: 'ਭੂਰਾ', text: 'ਪੁਰਾਣਾ ਖ਼ੂਨ, ਚਿੰਤਾ ਦੀ ਕੋਈ ਗੱਲ ਨਹੀਂ।'},
      {name: 'ਗੁਲਾਬੀ', text: 'ਮਾਹਵਾਰੀ ਦੀ ਸ਼ੁਰੂਆਤ/ਅੰਤ ਵਿੱਚ ਜਾਂ ਹਾਰਮੋਨ ਦੇ ਅਸੰਤੁਲਨ ਨਾਲ ਹੋ ਸਕਦਾ ਹੈ।'},
      {name: 'ਸੰਤਰੀ', text: 'ਜੇ ਤੇਜ਼ ਬਦਬੂ, ਖੁਜਲੀ ਜਾਂ ਦਰਦ ਨਾਲ ਹੋਵੇ ਤਾਂ ਨਜ਼ਰ ਰੱਖੋ।'},
    ],
    warningTitle: 'ਧਿਆਨ ਦੇਣ ਯੋਗ ਸੰਕੇਤ',
    warningItems: [
      'ਬਹੁਤ ਜ਼ਿਆਦਾ ਖ਼ੂਨ (ਹਰ 1–2 ਘੰਟਿਆਂ ਬਾਅਦ ਸਾਮਾਨ ਬਦਲਣਾ)',
      'ਨਿਯਮਿਤ ਤੌਰ \'ਤੇ ਬਹੁਤ ਵੱਡੇ ਥੱਕੇ ਨਿਕਲਣਾ',
      'ਲਗਾਤਾਰ ਬੁਰੀ ਬਦਬੂ ਜਾਂ ਖੁਜਲੀ',
      'ਅਸਧਾਰਨ ਤੌਰ \'ਤੇ ਤੇਜ਼ ਦਰਦ',
    ],
    advice: [
      {title: 'ਆਪਣੇ ਵਹਾਅ ਨੂੰ ਦੇਖੋ', text: 'ਹਰ ਮਹੀਨੇ ਹੋਣ ਵਾਲੇ ਬਦਲਾਅ ਨੋਟ ਕਰੋ।'},
      {title: 'ਸਹੀ ਬਚਾਅ ਵਾਲਾ ਸਾਮਾਨ ਚੁਣੋ', text: 'ਆਪਣੇ ਵਹਾਅ ਅਤੇ ਆਰਾਮ ਦੇ ਆਧਾਰ \'ਤੇ।'},
      {title: 'ਆਪਣੇ ਸਰੀਰ ਦੀ ਸੁਣੋ', text: 'ਇਹ ਤੁਹਾਨੂੰ ਕੀਮਤੀ ਸੰਕੇਤ ਦਿੰਦਾ ਹੈ।'},
      {title: 'ਸ਼ੱਕ ਹੋਵੇ ਤਾਂ', text: 'ਸਿਹਤ ਮਾਹਿਰ ਨਾਲ ਗੱਲ ਕਰੋ।'},
    ],
    shareMessage: 'ਮਾਹਵਾਰੀ ਦਾ ਵਹਾਅ: ਰੰਗਾਂ ਅਤੇ ਬਣਤਰ ਨੂੰ ਸਮਝਣਾ — AWA',
  },
  my: {
    badge: 'ရာသီစက်ဝန်းနှင့် ကျန်းမာရေး',
    title: 'ရာသီသွေးထွက်ပုံ၊ အရောင်များနှင့်\nအသွေးအသားများကို နားလည်ခြင်း',
    metaDuration: 'ဖတ်ချိန် 4 မိနစ်',
    metaType: 'လမ်းညွှန်',
    metaLevel: 'အခြေခံအဆင့်',
    metaValidated: 'ပြန်လည်သုံးသပ်ပြီး အကြောင်းအရာ',
    intro:
      'သင့်ရာသီသွေး၏ အရောင်နှင့် အသွေးအသားသည် သင့်ဟော်မုန်းကျန်းမာရေးအကြောင်း အများအပြား ပြောပြနိုင်သည်။ သင့်ရာသီစက်ဝန်းကို ပိုမိုနားလည်ရန် ၎င်းတို့ကို ဖတ်တတ်အောင် လေ့လာပါ။',
    contentsTitle: 'ဤဆောင်းပါးတွင်',
    contents: [
      'ရာသီသွေး၏ အရောင်များ',
      'ရာသီသွေး၏ အသွေးအသားများ',
      'အရောင်တစ်ခုချင်းစီက ဘာကို ဖော်ပြနိုင်သလဲ',
      'ဘယ်အချိန်မှာ စိုးရိမ်သင့်သလဲ။',
      'သင့်ကိုယ်သင် ပိုသိစေရန် ကျွန်ုပ်တို့၏ အကြံပြုချက်များ',
    ],
    colors: [
      {name: 'တောက်ပသော အနီရောင်', text: 'လတ်ဆတ်သောသွေး၊ သွေးသစ်ဖြစ်သည်။ ရာသီသွေးလာစအချိန်တွင် အဖြစ်များသည်။'},
      {name: 'အနီရင့်ရောင်', text: 'သွေးအဟောင်းဖြစ်ပြီး ရာသီစက်ဝန်း အလယ်ပိုင်းတွင် ပုံမှန်ဖြစ်သည်။'},
      {name: 'အညိုရောင်', text: 'အောက်ဆီဂျင်ဓာတ်ပြုပြီး သွေးဖြစ်ပြီး ရာသီသွေး ပြီးခါနီးတွင် မကြာခဏ တွေ့ရသည်။'},
      {name: 'ပန်းရောင်', text: 'သွေးထွက်ပမာဏ နည်းခြင်း သို့မဟုတ် ဟော်မုန်းပြောင်းလဲမှုကို ဖော်ပြနိုင်သည်။'},
      {name: 'လိမ္မော်ရောင်', text: 'ရောဂါကူးစက်ခြင်း သို့မဟုတ် မညီမျှမှုနှင့် ဆက်စပ်နိုင်သည်။'},
    ],
    textures: [
      {name: 'ပျော့ပျော့ရည်ရည်', text: 'အရည်သွေးထွက်ခြင်း၊ ခဲခြင်းမရှိပါ။'},
      {name: 'ခရင်မ်ကဲ့သို့', text: 'ပျစ်ပျစ်နှင့် ချောမွေ့သော အသွေးအသား။'},
      {name: 'သွေးခဲများ', text: 'သွေးခဲအသေးအကြီး။'},
      {name: 'အမျှင်လိုက် / အချွဲ', text: 'ဆန့်နိုင်ပြီး ကြည်လင်သော သို့မဟုတ် အဖြူရောင်ရှိသည်။'},
      {name: 'အတစ်အဆစ်', text: 'အသားစ သို့မဟုတ် အချွဲမြှေးပါးအစများ။'},
    ],
    meanings: [
      {name: 'တောက်ပသော အနီမှ အနီရင့်ရောင်', text: 'ပုံမှန်ရာသီစက်ဝန်း။ သင့်ခန္ဓာကိုယ်သည် သားအိမ်အတွင်းလွှာကို ထုတ်လွှတ်နေခြင်းဖြစ်သည်။'},
      {name: 'အညိုရောင်', text: 'သွေးအဟောင်းဖြစ်ပြီး စိုးရိမ်စရာမရှိပါ။'},
      {name: 'ပန်းရောင်', text: 'ရာသီသွေး စတင်ချိန်/ပြီးဆုံးချိန်တွင် သို့မဟုတ် ဟော်မုန်းမညီမျှမှုနှင့်အတူ ဖြစ်ပေါ်နိုင်သည်။'},
      {name: 'လိမ္မော်ရောင်', text: 'အနံ့ပြင်းခြင်း၊ ယားယံခြင်း သို့မဟုတ် နာကျင်ခြင်းတို့နှင့်အတူ ဖြစ်ပါက စောင့်ကြည့်ပါ။'},
    ],
    warningTitle: 'သတိပြုရန် လက္ခဏာများ',
    warningItems: [
      'သွေးထွက်ပမာဏ အလွန်များခြင်း (ကာကွယ်ရေးပစ္စည်းကို 1-2 နာရီတစ်ကြိမ် လဲရခြင်း)',
      'အလွန်ကြီးသော သွေးခဲများ ပုံမှန်ထွက်ခြင်း',
      'မကောင်းသောအနံ့ သို့မဟုတ် ယားယံခြင်း ဆက်လက်ရှိနေခြင်း',
      'ပုံမှန်မဟုတ်လောက်အောင် ပြင်းထန်သော နာကျင်ခြင်း',
    ],
    advice: [
      {title: 'သင့်ရာသီသွေးကို လေ့လာပါ', text: 'လစဉ် ပြောင်းလဲမှုများကို မှတ်ထားပါ။'},
      {title: 'သင့်လျော်သော ကာကွယ်ရေးပစ္စည်းကို ရွေးချယ်ပါ', text: 'သင့်သွေးထွက်ပမာဏနှင့် သက်တောင့်သက်သာရှိမှုအပေါ် မူတည်၍ ရွေးပါ။'},
      {title: 'သင့်ခန္ဓာကိုယ်ကို နားထောင်ပါ', text: 'ခန္ဓာကိုယ်က တန်ဖိုးရှိသော အချက်ပြမှုများ ပေးသည်။'},
      {title: 'သံသယရှိပါက', text: 'ကျန်းမာရေးပညာရှင်နှင့် ပြောဆိုပါ။'},
    ],
    shareMessage: 'ရာသီသွေးထွက်ပုံ၊ အရောင်များနှင့် အသွေးအသားများကို နားလည်ခြင်း — AWA',
  },
  km: {
    badge: 'វដ្តរដូវ និងសុខុមាលភាព',
    title: 'បរិមាណឈាមរដូវ៖ ការយល់ដឹងអំពី\nពណ៌ និងសភាពរបស់វា',
    metaDuration: 'អាន 4 នាទី',
    metaType: 'មគ្គុទ្ទេសក៍',
    metaLevel: 'កម្រិតដំបូង',
    metaValidated: 'មាតិកាបានពិនិត្យ',
    intro:
      'ពណ៌ និងសភាពនៃឈាមរដូវរបស់អ្នកបង្ហាញច្រើនអំពីសុខភាពអរម៉ូនរបស់អ្នក។ រៀនអានវា ដើម្បីយល់ពីវដ្តរដូវរបស់អ្នកឱ្យកាន់តែច្បាស់។',
    contentsTitle: 'ក្នុងអត្ថបទនេះ',
    contents: [
      'ពណ៌នៃឈាមរដូវ',
      'សភាពនៃឈាមរដូវ',
      'អ្វីដែលពណ៌នីមួយៗអាចបង្ហាញ',
      'តើពេលណាត្រូវព្រួយបារម្ភ?',
      'ដំបូន្មានរបស់យើងដើម្បីជួយអ្នកស្គាល់ខ្លួនឯងកាន់តែប្រសើរ',
    ],
    colors: [
      {name: 'ក្រហមភ្លឺ', text: 'ឈាមស្រស់ ឈាមថ្មី។ ជារឿងធម្មតានៅដើមរដូវរបស់អ្នក។'},
      {name: 'ក្រហមចាស់', text: 'ឈាមចាស់ជាងមុន ធម្មតាក្នុងអំឡុងពាក់កណ្តាលវដ្ត។'},
      {name: 'ត្នោត', text: 'ឈាមដែលកត់សុីរួច ជារឿយៗនៅចុងរដូវរបស់អ្នក។'},
      {name: 'ផ្កាឈូក', text: 'អាចបង្ហាញពីបរិមាណឈាមតិច ឬការប្រែប្រួលអរម៉ូន។'},
      {name: 'ទឹកក្រូច', text: 'អាចទាក់ទងនឹងការឆ្លងមេរោគ ឬភាពមិនមានតុល្យភាព។'},
    ],
    textures: [
      {name: 'រាវ', text: 'ឈាមរាវ គ្មានដុំ។'},
      {name: 'ក្រែម', text: 'សភាពខាប់ រលោង។'},
      {name: 'កំណកឈាម', text: 'កំណកឈាមតូច ឬធំ។'},
      {name: 'ជាខ្សែ / ទឹករំអិល', text: 'អាចលាតបាន ថ្លា ឬស។'},
      {name: 'ជាលិកា', text: 'ដុំជាលិកា ឬភ្នាសរំអិល។'},
    ],
    meanings: [
      {name: 'ក្រហមភ្លឺដល់ក្រហមចាស់', text: 'វដ្តធម្មតា។ រាងកាយរបស់អ្នកកំពុងបញ្ចេញស្រទាប់ខាងក្នុងនៃស្បូន។'},
      {name: 'ត្នោត', text: 'ឈាមចាស់ជាងមុន មិនមានអ្វីត្រូវព្រួយបារម្ភទេ។'},
      {name: 'ផ្កាឈូក', text: 'អាចកើតឡើងនៅដើម/ចុងរដូវរបស់អ្នក ឬនៅពេលមានភាពមិនមានតុល្យភាពអរម៉ូន។'},
      {name: 'ទឹកក្រូច', text: 'គួរតាមដានប្រសិនបើមានក្លិនខ្លាំង រមាស់ ឬឈឺចាប់ជាមួយ។'},
    ],
    warningTitle: 'សញ្ញាដែលត្រូវសង្កេត',
    warningItems: [
      'ហូរឈាមខ្លាំងណាស់ (ប្តូរគ្រឿងការពាររៀងរាល់ 1–2 ម៉ោង)',
      'ចេញកំណកឈាមធំៗជាប្រចាំ',
      'ក្លិនមិនល្អ ឬរមាស់ជាប់រហូត',
      'ឈឺខ្លាំងមិនធម្មតា',
    ],
    advice: [
      {title: 'សង្កេតមើលឈាមរដូវរបស់អ្នក', text: 'កត់ត្រាការផ្លាស់ប្តូរណាមួយនៅរៀងរាល់ខែ។'},
      {title: 'ជ្រើសរើសគ្រឿងការពារឱ្យត្រឹមត្រូវ', text: 'ផ្អែកលើបរិមាណឈាមរដូវ និងភាពស្រួលរបស់អ្នក។'},
      {title: 'ស្តាប់រាងកាយរបស់អ្នក', text: 'វាផ្តល់សញ្ញាមានតម្លៃដល់អ្នក។'},
      {title: 'ប្រសិនបើមានការសង្ស័យ', text: 'ពិភាក្សាជាមួយអ្នកជំនាញសុខាភិបាល។'},
    ],
    shareMessage: 'បរិមាណឈាមរដូវ៖ ការយល់ដឹងអំពីពណ៌ និងសភាពរបស់វា — AWA',
  },
  lo: {
    badge: 'ຮອບເດືອນ ແລະ ສຸຂະພາບ',
    title: 'ປະລິມານເລືອດປະຈຳເດືອນ: ເຂົ້າໃຈ\nສີ ແລະ ລັກສະນະເນື້ອ',
    metaDuration: 'ອ່ານ 4 ນາທີ',
    metaType: 'ຄູ່ມື',
    metaLevel: 'ລະດັບເລີ່ມຕົ້ນ',
    metaValidated: 'ເນື້ອຫາທີ່ຜ່ານການກວດສອບ',
    intro:
      'ສີ ແລະ ລັກສະນະເນື້ອຂອງປະຈຳເດືອນບອກຫຼາຍຢ່າງກ່ຽວກັບສຸຂະພາບຮໍໂມນຂອງທ່ານ. ຮຽນຮູ້ທີ່ຈະອ່ານມັນ ເພື່ອເຂົ້າໃຈຮອບເດືອນຂອງທ່ານດີຂຶ້ນ.',
    contentsTitle: 'ໃນບົດຄວາມນີ້',
    contents: [
      'ສີຂອງເລືອດປະຈຳເດືອນ',
      'ລັກສະນະເນື້ອຂອງເລືອດປະຈຳເດືອນ',
      'ແຕ່ລະສີອາດບົ່ງບອກຫຍັງ',
      'ເມື່ອໃດຄວນເປັນຫ່ວງ?',
      'ຄຳແນະນຳຂອງພວກເຮົາເພື່ອຊ່ວຍໃຫ້ທ່ານຮູ້ຈັກຕົນເອງດີຂຶ້ນ',
    ],
    colors: [
      {name: 'ແດງສົດ', text: 'ເລືອດສົດ ເລືອດໃໝ່. ພົບໄດ້ທົ່ວໄປໃນຕອນເລີ່ມມີປະຈຳເດືອນ.'},
      {name: 'ແດງເຂັ້ມ', text: 'ເລືອດເກົ່າກວ່າ ເປັນເລື່ອງປົກກະຕິໃນກາງຮອບເດືອນ.'},
      {name: 'ນ້ຳຕານ', text: 'ເລືອດທີ່ຖືກອົກຊິໄດສ໌ ມັກພົບໃນຕອນທ້າຍປະຈຳເດືອນ.'},
      {name: 'ສີບົວ', text: 'ອາດບົ່ງບອກວ່າເລືອດອອກເລັກນ້ອຍ ຫຼື ຮໍໂມນປ່ຽນແປງ.'},
      {name: 'ສີສົ້ມ', text: 'ອາດກ່ຽວຂ້ອງກັບການຕິດເຊື້ອ ຫຼື ຄວາມບໍ່ສົມດຸນ.'},
    ],
    textures: [
      {name: 'ເປັນນ້ຳ', text: 'ເລືອດເປັນນ້ຳ ບໍ່ມີກ້ອນ.'},
      {name: 'ຂຸ້ນຄືຄຣີມ', text: 'ເນື້ອຂຸ້ນ ລຽບເນຽນ.'},
      {name: 'ກ້ອນເລືອດ', text: 'ກ້ອນເລືອດຂະໜາດນ້ອຍ ຫຼື ໃຫຍ່.'},
      {name: 'ເປັນເສັ້ນ / ເມືອກ', text: 'ຢືດໄດ້ ໃສ ຫຼື ຂາວນວນ.'},
      {name: 'ເປັນຊິ້ນເນື້ອເຍື່ອ', text: 'ຊິ້ນເນື້ອເຍື່ອ ຫຼື ເຍື່ອເມືອກ.'},
    ],
    meanings: [
      {name: 'ແດງສົດເຖິງແດງເຂັ້ມ', text: 'ຮອບເດືອນປົກກະຕິ. ຮ່າງກາຍຂອງທ່ານກຳລັງຂັບເຍື່ອບຸມົດລູກອອກ.'},
      {name: 'ນ້ຳຕານ', text: 'ເລືອດເກົ່າ ບໍ່ຕ້ອງເປັນຫ່ວງ.'},
      {name: 'ສີບົວ', text: 'ອາດເກີດໃນຕອນເລີ່ມ/ທ້າຍປະຈຳເດືອນ ຫຼື ເວລາຮໍໂມນບໍ່ສົມດຸນ.'},
      {name: 'ສີສົ້ມ', text: 'ຄວນເຝົ້າສັງເກດ ຖ້າມີກິ່ນແຮງ, ຄັນ ຫຼື ເຈັບຮ່ວມດ້ວຍ.'},
    ],
    warningTitle: 'ສັນຍານທີ່ຄວນສັງເກດ',
    warningItems: [
      'ເລືອດອອກຫຼາຍຫຼາຍ (ປ່ຽນອຸປະກອນປ້ອງກັນທຸກ 1–2 ຊົ່ວໂມງ)',
      'ມີກ້ອນເລືອດໃຫຍ່ຫຼາຍອອກມາເປັນປະຈຳ',
      'ມີກິ່ນເໝັນ ຫຼື ອາການຄັນທີ່ບໍ່ຫາຍ',
      'ເຈັບຮຸນແຮງຜິດປົກກະຕິ',
    ],
    advice: [
      {title: 'ສັງເກດປະລິມານເລືອດຂອງທ່ານ', text: 'ຈົດບັນທຶກການປ່ຽນແປງທຸກເດືອນ.'},
      {title: 'ເລືອກອຸປະກອນປ້ອງກັນທີ່ເໝາະສົມ', text: 'ຕາມປະລິມານເລືອດ ແລະ ຄວາມສະບາຍຂອງທ່ານ.'},
      {title: 'ຟັງສຽງຮ່າງກາຍຂອງທ່ານ', text: 'ມັນໃຫ້ສັນຍານທີ່ມີຄ່າແກ່ທ່ານ.'},
      {title: 'ຖ້າສົງໄສ', text: 'ປຶກສາຜູ້ຊ່ຽວຊານດ້ານສຸຂະພາບ.'},
    ],
    shareMessage: 'ປະລິມານເລືອດປະຈຳເດືອນ: ເຂົ້າໃຈສີ ແລະ ລັກສະນະເນື້ອ — AWA',
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
