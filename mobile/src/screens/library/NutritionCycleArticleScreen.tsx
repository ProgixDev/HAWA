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

import ReadingControls from '../../components/articles/ReadingControls';
import {AwaCard} from '../../components/ui/AwaCard';
import {AwaIconButton} from '../../components/ui/AwaIconButton';
import {AwaText} from '../../components/ui/AwaText';
import type {RootStackParamList} from '../../navigation/AppNavigator';
import {
  isArticleBookmarked,
  loadLibraryState,
  saveScrollPosition,
  toggleBookmark,
} from '../../state/libraryStore';
import {getBottomPadding, getTopPadding, READING_CONTROLS_SPACE} from '../../theme/spacing';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {
  onPrimaryTextColor,
  type ResolvedAwaTheme,
} from '../../theme/awaThemeTokens';
import {resolveEditorialLanguage} from '../../i18n/editorialLanguage';
import {withBrazilianPortuguese} from '../../i18n/ptBrEditorial';

const ID = 'nutrition-conception-fertilite';

const HERO = require('../../assets/images/library/nutrition-hero.png');

// Images/icons stay language-neutral — only TEXT moves into the bilingual
// CONTENT object below, keyed by index to stay aligned with these assets.
const FOOD_IMAGES = [
  require('../../assets/images/library/food-iron.png'),
  require('../../assets/images/library/food-magnesium.png'),
  require('../../assets/images/library/food-omega.png'),
  require('../../assets/images/library/food-protein.png'),
  require('../../assets/images/library/food-fibre.png'),
] as const;

const MEAL_IMAGES = [
  require('../../assets/images/library/meal-breakfast.png'),
  require('../../assets/images/library/meal-lunch.png'),
  require('../../assets/images/library/meal-snack.png'),
  require('../../assets/images/library/meal-dinner.png'),
] as const;

const PHASE_ICONS = ['water', 'flower', 'circle', 'leaf'] as const;

const LIMIT_ICONS = [
  'shaker-outline',
  'cupcake',
  'hamburger',
  'coffee-outline',
  'glass-cocktail',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('NutritionCycle', {
  fr: {
    badge: 'CYCLE MENSTRUEL',
    titleLine1: 'Alimentation et cycle :',
    titleLine2: 'ce que ton corps aime',
    metaDuration: '4 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro:
      'Ton alimentation influence ton énergie, ton humeur, tes hormones et ton bien-être général tout au long de ton cycle.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Les besoins nutritionnels selon les phases',
      'Les aliments à privilégier',
      'Les aliments à limiter',
      'Exemples de repas équilibrés',
    ],
    section1Body:
      'Ton corps n’a pas les mêmes besoins tout au long du cycle. Adapter ton alimentation peut faire une vraie différence.',
    phases: [
      {
        title: 'Phase menstruelle',
        days: 'Jours 1 à 5',
        body: 'Privilégie le fer, le magnésium et les vitamines B.',
      },
      {
        title: 'Phase folliculaire',
        days: 'Jours 6 à 14',
        body: 'Mise sur les protéines maigres et les légumes frais.',
      },
      {
        title: 'Phase ovulatoire',
        days: 'Autour du jour 14',
        body: 'Choisis antioxydants et oméga-3.',
      },
      {
        title: 'Phase lutéale',
        days: 'Jours 15 à 28',
        body: 'Soutiens ton système nerveux et limite l’inflammation.',
      },
    ],
    foods: [
      {title: 'Fer', body: 'Lentilles, épinards, viandes maigres, pois chiches.'},
      {title: 'Magnésium', body: 'Amandes, graines de courge, chocolat noir, banane.'},
      {title: 'Oméga-3', body: 'Saumon, sardines, noix, graines de lin.'},
      {title: 'Protéines', body: 'Œufs, tofu, volaille, yaourt grec, quinoa.'},
      {title: 'Fibres & antioxydants', body: 'Fruits rouges, avocat, brocolis, carottes.'},
    ],
    limits: [
      {title: 'Excès de sel'},
      {title: 'Produits sucrés'},
      {title: 'Ultra-transformés'},
      {title: 'Excès de caféine'},
      {title: 'Alcool'},
    ],
    limitText: 'À consommer avec modération pour préserver ton équilibre.',
    meals: [
      {tag: 'Petit-déjeuner', body: 'Porridge, fruits rouges, amandes et chia'},
      {tag: 'Déjeuner', body: 'Saumon, quinoa, brocoli vapeur et huile d’olive'},
      {tag: 'Collation', body: 'Yaourt nature, myrtilles et graines de lin'},
      {tag: 'Dîner', body: 'Soupe de lentilles, légumes rôtis et pain complet'},
    ],
    shareMessage: 'Alimentation et cycle : ce que ton corps aime — AWA',
  },
  en: {
    badge: 'MENSTRUAL CYCLE',
    titleLine1: 'Nutrition and your cycle:',
    titleLine2: 'what your body loves',
    metaDuration: '4 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro:
      'Your diet influences your energy, your mood, your hormones, and your overall well-being throughout your cycle.',
    contentsTitle: 'In this article',
    topics: [
      'Nutritional needs by phase',
      'Foods to favor',
      'Foods to limit',
      'Examples of balanced meals',
    ],
    section1Body:
      'Your body doesn’t have the same needs throughout your cycle. Adjusting what you eat can make a real difference.',
    phases: [
      {
        title: 'Menstrual phase',
        days: 'Days 1 to 5',
        body: 'Favor iron, magnesium, and B vitamins.',
      },
      {
        title: 'Follicular phase',
        days: 'Days 6 to 14',
        body: 'Focus on lean protein and fresh vegetables.',
      },
      {
        title: 'Ovulatory phase',
        days: 'Around day 14',
        body: 'Choose antioxidants and omega-3s.',
      },
      {
        title: 'Luteal phase',
        days: 'Days 15 to 28',
        body: 'Support your nervous system and limit inflammation.',
      },
    ],
    foods: [
      {title: 'Iron', body: 'Lentils, spinach, lean meats, chickpeas.'},
      {title: 'Magnesium', body: 'Almonds, pumpkin seeds, dark chocolate, banana.'},
      {title: 'Omega-3', body: 'Salmon, sardines, walnuts, flaxseed.'},
      {title: 'Protein', body: 'Eggs, tofu, poultry, Greek yogurt, quinoa.'},
      {title: 'Fiber & antioxidants', body: 'Berries, avocado, broccoli, carrots.'},
    ],
    limits: [
      {title: 'Excess salt'},
      {title: 'Sugary foods'},
      {title: 'Ultra-processed foods'},
      {title: 'Excess caffeine'},
      {title: 'Alcohol'},
    ],
    limitText: 'Enjoy in moderation to help maintain your balance.',
    meals: [
      {tag: 'Breakfast', body: 'Porridge, berries, almonds, and chia'},
      {tag: 'Lunch', body: 'Salmon, quinoa, steamed broccoli, and olive oil'},
      {tag: 'Snack', body: 'Plain yogurt, blueberries, and flaxseed'},
      {tag: 'Dinner', body: 'Lentil soup, roasted vegetables, and whole-grain bread'},
    ],
    shareMessage: 'Nutrition and your cycle: what your body loves — AWA',
  },
  es: {
    badge: 'CICLO MENSTRUAL',
    titleLine1: 'Alimentación y ciclo:',
    titleLine2: 'lo que le gusta a tu cuerpo',
    metaDuration: '4 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro:
      'Tu alimentación influye en tu energía, tu estado de ánimo, tus hormonas y tu bienestar general a lo largo de todo tu ciclo.',
    contentsTitle: 'En este artículo',
    topics: [
      'Las necesidades nutricionales según la fase',
      'Los alimentos que debes priorizar',
      'Los alimentos que debes limitar',
      'Ejemplos de comidas equilibradas',
    ],
    section1Body:
      'Tu cuerpo no tiene las mismas necesidades a lo largo del ciclo. Adaptar tu alimentación puede marcar una verdadera diferencia.',
    phases: [
      {
        title: 'Fase menstrual',
        days: 'Días 1 a 5',
        body: 'Prioriza el hierro, el magnesio y las vitaminas del grupo B.',
      },
      {
        title: 'Fase folicular',
        days: 'Días 6 a 14',
        body: 'Apuesta por las proteínas magras y las verduras frescas.',
      },
      {
        title: 'Fase ovulatoria',
        days: 'Alrededor del día 14',
        body: 'Elige antioxidantes y omega-3.',
      },
      {
        title: 'Fase lútea',
        days: 'Días 15 a 28',
        body: 'Apoya tu sistema nervioso y limita la inflamación.',
      },
    ],
    foods: [
      {title: 'Hierro', body: 'Lentejas, espinacas, carnes magras, garbanzos.'},
      {title: 'Magnesio', body: 'Almendras, semillas de calabaza, chocolate negro, plátano.'},
      {title: 'Omega-3', body: 'Salmón, sardinas, nueces, semillas de lino.'},
      {title: 'Proteínas', body: 'Huevos, tofu, aves, yogur griego, quinoa.'},
      {title: 'Fibra y antioxidantes', body: 'Frutos rojos, aguacate, brócoli, zanahorias.'},
    ],
    limits: [
      {title: 'Exceso de sal'},
      {title: 'Productos azucarados'},
      {title: 'Ultraprocesados'},
      {title: 'Exceso de cafeína'},
      {title: 'Alcohol'},
    ],
    limitText: 'Consume con moderación para preservar tu equilibrio.',
    meals: [
      {tag: 'Desayuno', body: 'Porridge, frutos rojos, almendras y chía'},
      {tag: 'Almuerzo', body: 'Salmón, quinoa, brócoli al vapor y aceite de oliva'},
      {tag: 'Merienda', body: 'Yogur natural, arándanos y semillas de lino'},
      {tag: 'Cena', body: 'Sopa de lentejas, verduras asadas y pan integral'},
    ],
    shareMessage: 'Alimentación y ciclo: lo que le gusta a tu cuerpo — AWA',
  },
  it: {
    badge: 'CICLO MESTRUALE',
    titleLine1: 'Alimentazione e ciclo:',
    titleLine2: 'ciò che il tuo corpo ama',
    metaDuration: '4 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'La tua alimentazione influenza la tua energia, il tuo umore, i tuoi ormoni e il tuo benessere generale durante tutto il ciclo.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Esigenze nutrizionali per fase',
      'Alimenti da privilegiare',
      'Alimenti da limitare',
      'Esempi di pasti equilibrati',
    ],
    section1Body: 'Il tuo corpo non ha le stesse esigenze durante tutto il ciclo. Adattare ciò che mangi può fare una vera differenza.',
    phases: [
      {
        title: 'Fase mestruale',
        days: 'Giorni da 1 a 5',
        body: 'Privilegia ferro, magnesio e vitamine del gruppo B.',
      },
      {
        title: 'Fase follicolare',
        days: 'Giorni da 6 a 14',
        body: 'Punta su proteine magre e verdure fresche.',
      },
      {
        title: 'Fase ovulatoria',
        days: 'Intorno al giorno 14',
        body: 'Scegli antiossidanti e omega-3.',
      },
      {
        title: 'Fase luteale',
        days: 'Giorni da 15 a 28',
        body: 'Sostieni il sistema nervoso e limita l’infiammazione.',
      },
    ],
    foods: [
      {
        title: 'Ferro',
        body: 'Lenticchie, spinaci, carni magre, ceci.',
      },
      {
        title: 'Magnesio',
        body: 'Mandorle, semi di zucca, cioccolato fondente, banana.',
      },
      {
        title: 'Omega-3',
        body: 'Salmone, sardine, noci, semi di lino.',
      },
      {
        title: 'Proteine',
        body: 'Uova, tofu, pollame, yogurt greco, quinoa.',
      },
      {
        title: 'Fibre e antiossidanti',
        body: 'Frutti di bosco, avocado, broccoli, carote.',
      },
    ],
    limits: [
      {
        title: 'Eccesso di sale',
      },
      {
        title: 'Alimenti zuccherati',
      },
      {
        title: 'Alimenti ultraprocessati',
      },
      {
        title: 'Eccesso di caffeina',
      },
      {
        title: 'Alcol',
      },
    ],
    limitText: 'Consumali con moderazione per aiutarti a mantenere il tuo equilibrio.',
    meals: [
      {
        tag: 'Colazione',
        body: 'Porridge, frutti di bosco, mandorle e semi di chia',
      },
      {
        tag: 'Pranzo',
        body: 'Salmone, quinoa, broccoli al vapore e olio d’oliva',
      },
      {
        tag: 'Spuntino',
        body: 'Yogurt naturale, mirtilli e semi di lino',
      },
      {
        tag: 'Cena',
        body: 'Zuppa di lenticchie, verdure arrosto e pane integrale',
      },
    ],
    shareMessage: 'Alimentazione e ciclo: ciò che il tuo corpo ama — AWA',
  },
  tr: {
    badge: 'ADET DÖNGÜSÜ',
    titleLine1: 'Beslenme ve döngün:',
    titleLine2: 'vücudunun sevdikleri',
    metaDuration: '4 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Beslenmen, döngün boyunca enerjini, ruh halini, hormonlarını ve genel iyi oluşunu etkiler.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Evrelere göre beslenme ihtiyaçları',
      'Tercih edilecek besinler',
      'Sınırlanacak besinler',
      'Dengeli öğün örnekleri',
    ],
    section1Body: 'Vücudunun ihtiyaçları döngü boyunca aynı değildir. Ne yediğini ayarlamak gerçek bir fark yaratabilir.',
    phases: [
      {
        title: 'Adet evresi',
        days: '1. ila 5. günler',
        body: 'Demir, magnezyum ve B vitaminlerini tercih et.',
      },
      {
        title: 'Foliküler evre',
        days: '6. ila 14. günler',
        body: 'Yağsız proteine ve taze sebzelere odaklan.',
      },
      {
        title: 'Yumurtlama evresi',
        days: '14. gün civarı',
        body: 'Antioksidanları ve omega-3’leri seç.',
      },
      {
        title: 'Luteal evre',
        days: '15. ila 28. günler',
        body: 'Sinir sistemini destekle ve iltihabı sınırla.',
      },
    ],
    foods: [
      {
        title: 'Demir',
        body: 'Mercimek, ıspanak, yağsız etler, nohut.',
      },
      {
        title: 'Magnezyum',
        body: 'Badem, kabak çekirdeği, bitter çikolata, muz.',
      },
      {
        title: 'Omega-3',
        body: 'Somon, sardalya, ceviz, keten tohumu.',
      },
      {
        title: 'Protein',
        body: 'Yumurta, tofu, kümes hayvanı eti, Yunan yoğurdu, kinoa.',
      },
      {
        title: 'Lif ve antioksidanlar',
        body: 'Orman meyveleri, avokado, brokoli, havuç.',
      },
    ],
    limits: [
      {
        title: 'Aşırı tuz',
      },
      {
        title: 'Şekerli besinler',
      },
      {
        title: 'Aşırı işlenmiş besinler',
      },
      {
        title: 'Aşırı kafein',
      },
      {
        title: 'Alkol',
      },
    ],
    limitText: 'Dengeni korumana yardımcı olmak için ölçülü tüket.',
    meals: [
      {
        tag: 'Kahvaltı',
        body: 'Yulaf lapası, orman meyveleri, badem ve chia',
      },
      {
        tag: 'Öğle yemeği',
        body: 'Somon, kinoa, buharda brokoli ve zeytinyağı',
      },
      {
        tag: 'Ara öğün',
        body: 'Sade yoğurt, yaban mersini ve keten tohumu',
      },
      {
        tag: 'Akşam yemeği',
        body: 'Mercimek çorbası, fırınlanmış sebzeler ve tam tahıllı ekmek',
      },
    ],
    shareMessage: 'Beslenme ve döngün: vücudunun sevdikleri — AWA',
  },
  ru: {
    badge: 'МЕНСТРУАЛЬНЫЙ ЦИКЛ',
    titleLine1: 'Питание и ваш цикл:',
    titleLine2: 'что нравится вашему организму',
    metaDuration: '4 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro:
      'Питание влияет на вашу энергию, настроение, гормоны и общее самочувствие на протяжении всего цикла.',
    contentsTitle: 'В этой статье',
    topics: [
      'Потребности в питании по фазам',
      'Что стоит предпочитать',
      'Что стоит ограничивать',
      'Примеры сбалансированных приёмов пищи',
    ],
    section1Body:
      'Потребности вашего организма не одинаковы на протяжении всего цикла. Корректировка рациона может заметно улучшить самочувствие.',
    phases: [
      {
        title: 'Менструальная фаза',
        days: 'Дни 1–5',
        body: 'Отдавайте предпочтение железу, магнию и витаминам группы B.',
      },
      {
        title: 'Фолликулярная фаза',
        days: 'Дни 6–14',
        body: 'Делайте упор на нежирный белок и свежие овощи.',
      },
      {
        title: 'Овуляторная фаза',
        days: 'Около 14-го дня',
        body: 'Выбирайте антиоксиданты и омега-3.',
      },
      {
        title: 'Лютеиновая фаза',
        days: 'Дни 15–28',
        body: 'Поддерживайте нервную систему и ограничивайте воспаление.',
      },
    ],
    foods: [
      {title: 'Железо', body: 'Чечевица, шпинат, нежирное мясо, нут.'},
      {title: 'Магний', body: 'Миндаль, тыквенные семечки, тёмный шоколад, банан.'},
      {title: 'Омега-3', body: 'Лосось, сардины, грецкие орехи, семена льна.'},
      {title: 'Белок', body: 'Яйца, тофу, птица, греческий йогурт, киноа.'},
      {title: 'Клетчатка и антиоксиданты', body: 'Ягоды, авокадо, брокколи, морковь.'},
    ],
    limits: [
      {title: 'Избыток соли'},
      {title: 'Сладкие продукты'},
      {title: 'Ультрапереработанные продукты'},
      {title: 'Избыток кофеина'},
      {title: 'Алкоголь'},
    ],
    limitText: 'Употребляйте в умеренных количествах, чтобы поддерживать баланс.',
    meals: [
      {tag: 'Завтрак', body: 'Овсяная каша, ягоды, миндаль и чиа'},
      {tag: 'Обед', body: 'Лосось, киноа, брокколи на пару и оливковое масло'},
      {tag: 'Перекус', body: 'Натуральный йогурт, черника и семена льна'},
      {tag: 'Ужин', body: 'Чечевичный суп, запечённые овощи и цельнозерновой хлеб'},
    ],
    shareMessage: 'Питание и ваш цикл: что нравится вашему организму — AWA',
  },
  de: {
    badge: 'MENSTRUATIONSZYKLUS',
    titleLine1: 'Ernährung und dein Zyklus:',
    titleLine2: 'was dein Körper liebt',
    metaDuration: '4 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro:
      'Deine Ernährung beeinflusst über den ganzen Zyklus hinweg deine Energie, deine Stimmung, deine Hormone und dein allgemeines Wohlbefinden.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Nährstoffbedarf je nach Phase',
      'Lebensmittel, die du bevorzugen kannst',
      'Lebensmittel, die du einschränken kannst',
      'Beispiele für ausgewogene Mahlzeiten',
    ],
    section1Body:
      'Dein Körper hat nicht über den ganzen Zyklus hinweg den gleichen Bedarf. Wenn du anpasst, was du isst, kann das einen echten Unterschied machen.',
    phases: [
      {
        title: 'Menstruationsphase',
        days: 'Tag 1 bis 5',
        body: 'Bevorzuge Eisen, Magnesium und B-Vitamine.',
      },
      {
        title: 'Follikelphase',
        days: 'Tag 6 bis 14',
        body: 'Setze auf mageres Eiweiß und frisches Gemüse.',
      },
      {
        title: 'Ovulationsphase',
        days: 'Um Tag 14',
        body: 'Wähle Antioxidantien und Omega-3-Fettsäuren.',
      },
      {
        title: 'Lutealphase',
        days: 'Tag 15 bis 28',
        body: 'Unterstütze dein Nervensystem und schränke Entzündungen ein.',
      },
    ],
    foods: [
      {title: 'Eisen', body: 'Linsen, Spinat, mageres Fleisch, Kichererbsen.'},
      {title: 'Magnesium', body: 'Mandeln, Kürbiskerne, dunkle Schokolade, Banane.'},
      {title: 'Omega-3', body: 'Lachs, Sardinen, Walnüsse, Leinsamen.'},
      {title: 'Eiweiß', body: 'Eier, Tofu, Geflügel, griechischer Joghurt, Quinoa.'},
      {title: 'Ballaststoffe & Antioxidantien', body: 'Beeren, Avocado, Brokkoli, Karotten.'},
    ],
    limits: [
      {title: 'Zu viel Salz'},
      {title: 'Zuckerhaltige Lebensmittel'},
      {title: 'Stark verarbeitete Lebensmittel'},
      {title: 'Zu viel Koffein'},
      {title: 'Alkohol'},
    ],
    limitText: 'In Maßen genießen, um dein Gleichgewicht zu unterstützen.',
    meals: [
      {tag: 'Frühstück', body: 'Haferbrei, Beeren, Mandeln und Chiasamen'},
      {tag: 'Mittagessen', body: 'Lachs, Quinoa, gedünsteter Brokkoli und Olivenöl'},
      {tag: 'Snack', body: 'Naturjoghurt, Heidelbeeren und Leinsamen'},
      {tag: 'Abendessen', body: 'Linsensuppe, geröstetes Gemüse und Vollkornbrot'},
    ],
    shareMessage: 'Ernährung und dein Zyklus: was dein Körper liebt — AWA',
  },
  zh: {
      badge: '月经周期',
      titleLine1: '饮食与你的周期：',
      titleLine2: '你的身体喜欢什么',
      metaDuration: '阅读约 4 分钟',
      metaType: '指南',
      metaLevel: '入门',
      metaValidated: '已审核内容',
      intro: '在整个周期中，饮食会影响你的精力、情绪、激素和整体状态。',
      contentsTitle: '本文内容',
      topics: [
        '各阶段的营养需求',
        '适合多吃的食物',
        '需要少吃的食物',
        '均衡饮食示例',
      ],
      section1Body: '在整个周期中，你的身体需求并不相同。适当调整饮食，可以带来明显的不同。',
      phases: [
        {
          title: '月经期',
          days: '第 1 至 5 天',
          body: '多补充铁、镁和 B 族维生素。',
        },
        {
          title: '卵泡期',
          days: '第 6 至 14 天',
          body: '注重瘦肉蛋白和新鲜蔬菜。',
        },
        {
          title: '排卵期',
          days: '第 14 天前后',
          body: '选择富含抗氧化物质和 omega-3 的食物。',
        },
        {
          title: '黄体期',
          days: '第 15 至 28 天',
          body: '呵护神经系统，减少炎症。',
        },
      ],
      foods: [
        {
          title: '铁',
          body: '扁豆、菠菜、瘦肉、鹰嘴豆。',
        },
        {
          title: '镁',
          body: '杏仁、南瓜子、黑巧克力、香蕉。',
        },
        {
          title: 'omega-3',
          body: '三文鱼、沙丁鱼、核桃、亚麻籽。',
        },
        {
          title: '蛋白质',
          body: '鸡蛋、豆腐、禽肉、希腊酸奶、藜麦。',
        },
        {
          title: '膳食纤维与抗氧化物质',
          body: '浆果、牛油果、西蓝花、胡萝卜。',
        },
      ],
      limits: [
        {
          title: '过多的盐',
        },
        {
          title: '含糖食物',
        },
        {
          title: '超加工食品',
        },
        {
          title: '过多的咖啡因',
        },
        {
          title: '酒精',
        },
      ],
      limitText: '适量享用，有助于维持你的平衡。',
      meals: [
        {
          tag: '早餐',
          body: '燕麦粥、浆果、杏仁和奇亚籽',
        },
        {
          tag: '午餐',
          body: '三文鱼、藜麦、清蒸西蓝花和橄榄油',
        },
        {
          tag: '加餐',
          body: '原味酸奶、蓝莓和亚麻籽',
        },
        {
          tag: '晚餐',
          body: '扁豆汤、烤蔬菜和全麦面包',
        },
      ],
      shareMessage: '饮食与你的周期：你的身体喜欢什么 — AWA',
    },
  id: {
    badge: 'SIKLUS MENSTRUASI',
    titleLine1: 'Nutrisi dan siklusmu:',
    titleLine2: 'yang disukai tubuhmu',
    metaDuration: '4 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Pola makanmu memengaruhi energi, suasana hati, hormon, dan kesehatanmu secara keseluruhan sepanjang siklus.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Kebutuhan nutrisi di tiap fase',
      'Makanan yang dianjurkan',
      'Makanan yang perlu dibatasi',
      'Contoh menu makan seimbang',
    ],
    section1Body: 'Kebutuhan tubuhmu tidak sama sepanjang siklus. Menyesuaikan apa yang kamu makan bisa membuat perbedaan yang nyata.',
    phases: [
      {
        title: 'Fase menstruasi',
        days: 'Hari ke-1 sampai ke-5',
        body: 'Utamakan zat besi, magnesium, dan vitamin B.',
      },
      {
        title: 'Fase folikuler',
        days: 'Hari ke-6 sampai ke-14',
        body: 'Fokus pada protein tanpa lemak dan sayuran segar.',
      },
      {
        title: 'Fase ovulasi',
        days: 'Sekitar hari ke-14',
        body: 'Pilih antioksidan dan omega-3.',
      },
      {
        title: 'Fase luteal',
        days: 'Hari ke-15 sampai ke-28',
        body: 'Dukung sistem sarafmu dan batasi peradangan.',
      },
    ],
    foods: [
      {
        title: 'Zat besi',
        body: 'Lentil, bayam, daging tanpa lemak, buncis kabuli.',
      },
      {
        title: 'Magnesium',
        body: 'Almon, biji labu, cokelat hitam, pisang.',
      },
      {
        title: 'Omega-3',
        body: 'Salmon, sarden, kenari, biji rami.',
      },
      {
        title: 'Protein',
        body: 'Telur, tahu, unggas, yogurt Yunani, quinoa.',
      },
      {
        title: 'Serat & antioksidan',
        body: 'Beri-berian, alpukat, brokoli, wortel.',
      },
    ],
    limits: [
      {
        title: 'Garam berlebih',
      },
      {
        title: 'Makanan manis',
      },
      {
        title: 'Makanan ultra-olahan',
      },
      {
        title: 'Kafein berlebih',
      },
      {
        title: 'Alkohol',
      },
    ],
    limitText: 'Nikmati secukupnya agar keseimbanganmu tetap terjaga.',
    meals: [
      {
        tag: 'Sarapan',
        body: 'Bubur oat, beri-berian, almon, dan chia',
      },
      {
        tag: 'Makan siang',
        body: 'Salmon, quinoa, brokoli kukus, dan minyak zaitun',
      },
      {
        tag: 'Camilan',
        body: 'Yogurt plain, blueberry, dan biji rami',
      },
      {
        tag: 'Makan malam',
        body: 'Sup lentil, sayuran panggang, dan roti gandum utuh',
      },
    ],
    shareMessage: 'Nutrisi dan siklusmu: yang disukai tubuhmu — AWA',
  },
  hi: {
    badge: 'मासिक चक्र',
    titleLine1: 'पोषण और आपका चक्र:',
    titleLine2: 'जो आपके शरीर को पसंद है',
    metaDuration: '4 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'शुरुआती',
    metaValidated: 'समीक्षित सामग्री',
    intro: 'आपका आहार पूरे चक्र में आपकी ऊर्जा, मूड, हार्मोन और समग्र सेहत को प्रभावित करता है।',
    contentsTitle: 'इस लेख में',
    topics: [
      'हर चरण की पोषण ज़रूरतें',
      'किन चीज़ों को प्राथमिकता दें',
      'किन चीज़ों को सीमित करें',
      'संतुलित भोजन के उदाहरण',
    ],
    section1Body: 'आपके शरीर की ज़रूरतें पूरे चक्र में एक जैसी नहीं रहतीं। अपने खान-पान को उसके अनुसार ढालने से सचमुच फ़र्क़ पड़ सकता है।',
    phases: [
      {
        title: 'मासिक धर्म का चरण',
        days: 'दिन 1 से 5',
        body: 'आयरन, मैग्नीशियम और B विटामिन को प्राथमिकता दें।',
      },
      {
        title: 'फ़ॉलिकुलर चरण',
        days: 'दिन 6 से 14',
        body: 'कम चर्बी वाले प्रोटीन और ताज़ी सब्ज़ियों पर ध्यान दें।',
      },
      {
        title: 'ओव्यूलेशन का चरण',
        days: 'दिन 14 के आसपास',
        body: 'एंटीऑक्सीडेंट और ओमेगा-3 चुनें।',
      },
      {
        title: 'ल्यूटियल चरण',
        days: 'दिन 15 से 28',
        body: 'अपने तंत्रिका तंत्र को सहारा दें और सूजन को सीमित करें।',
      },
    ],
    foods: [
      {
        title: 'आयरन',
        body: 'दालें, पालक, कम चर्बी वाला मांस, चने।',
      },
      {
        title: 'मैग्नीशियम',
        body: 'बादाम, कद्दू के बीज, डार्क चॉकलेट, केला।',
      },
      {
        title: 'ओमेगा-3',
        body: 'सैल्मन, सार्डिन, अखरोट, अलसी।',
      },
      {
        title: 'प्रोटीन',
        body: 'अंडे, टोफ़ू, मुर्गा, ग्रीक योगर्ट, क्विनोआ।',
      },
      {
        title: 'फ़ाइबर और एंटीऑक्सीडेंट',
        body: 'बेरीज़, एवोकाडो, ब्रोकली, गाजर।',
      },
    ],
    limits: [
      {
        title: 'ज़्यादा नमक',
      },
      {
        title: 'मीठी चीज़ें',
      },
      {
        title: 'अत्यधिक प्रोसेस्ड खाना',
      },
      {
        title: 'ज़्यादा कैफ़ीन',
      },
      {
        title: 'अल्कोहल',
      },
    ],
    limitText: 'संतुलन बनाए रखने के लिए इन्हें सीमित मात्रा में लें।',
    meals: [
      {
        tag: 'नाश्ता',
        body: 'दलिया, बेरीज़, बादाम और चिया',
      },
      {
        tag: 'दोपहर का खाना',
        body: 'सैल्मन, क्विनोआ, भाप में पकी ब्रोकली और जैतून का तेल',
      },
      {
        tag: 'स्नैक',
        body: 'सादा दही, ब्लूबेरी और अलसी',
      },
      {
        tag: 'रात का खाना',
        body: 'दाल का सूप, भुनी हुई सब्ज़ियाँ और साबुत अनाज की रोटी',
      },
    ],
    shareMessage: 'पोषण और आपका चक्र: जो आपके शरीर को पसंद है — AWA',
  },
  sq: {
    badge: 'CIKLI MENSTRUAL',
    titleLine1: 'Ushqimi dhe cikli yt:',
    titleLine2: 'ajo që e do trupi yt',
    metaDuration: '4 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Ushqimi yt ndikon në energjinë, gjendjen shpirtërore, hormonet dhe mirëqenien tënde të përgjithshme gjatë gjithë ciklit.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Nevojat ushqimore sipas fazës',
      'Ushqimet që duhen preferuar',
      'Ushqimet që duhen kufizuar',
      'Shembuj vaktesh të ekuilibruara',
    ],
    section1Body: 'Trupi yt nuk ka të njëjtat nevoja gjatë gjithë ciklit. Përshtatja e asaj që ha mund të bëjë një dallim të vërtetë.',
    phases: [
      {
        title: 'Faza menstruale',
        days: 'Ditët 1 deri në 5',
        body: 'Zgjidh hekurin, magnezin dhe vitaminat B.',
      },
      {
        title: 'Faza folikulare',
        days: 'Ditët 6 deri në 14',
        body: 'Përqendrohu te proteinat e pakta dhe perimet e freskëta.',
      },
      {
        title: 'Faza e ovulacionit',
        days: 'Rreth ditës 14',
        body: 'Zgjidh antioksidantët dhe omega-3.',
      },
      {
        title: 'Faza luteale',
        days: 'Ditët 15 deri në 28',
        body: 'Mbështet sistemin nervor dhe kufizo inflamacionin.',
      },
    ],
    foods: [
      {
        title: 'Hekuri',
        body: 'Thjerrëza, spinaq, mish pa yndyrë, qiqra.',
      },
      {
        title: 'Magnezi',
        body: 'Bajame, fara kungulli, çokollatë e zezë, banane.',
      },
      {
        title: 'Omega-3',
        body: 'Salmon, sardele, arra, fara liri.',
      },
      {
        title: 'Proteinat',
        body: 'Vezë, tofu, shpendë, kos grek, kinoa.',
      },
      {
        title: 'Fibrat & antioksidantët',
        body: 'Fruta të egra, avokado, brokoli, karota.',
      },
    ],
    limits: [
      {
        title: 'Kripa e tepërt',
      },
      {
        title: 'Ushqimet e ëmbla',
      },
      {
        title: 'Ushqimet ultra të përpunuara',
      },
      {
        title: 'Kafeina e tepërt',
      },
      {
        title: 'Alkooli',
      },
    ],
    limitText: 'Konsumoji me moderim për të ndihmuar në ruajtjen e ekuilibrit tënd.',
    meals: [
      {
        tag: 'Mëngjesi',
        body: 'Qull tërshëre, fruta të egra, bajame dhe chia',
      },
      {
        tag: 'Dreka',
        body: 'Salmon, kinoa, brokoli i zier me avull dhe vaj ulliri',
      },
      {
        tag: 'Ushqim i lehtë',
        body: 'Kos natyral, boronica dhe fara liri',
      },
      {
        tag: 'Darka',
        body: 'Supë thjerrëzash, perime të pjekura dhe bukë integrale',
      },
    ],
    shareMessage: 'Ushqimi dhe cikli yt: ajo që e do trupi yt — AWA',
  },
  ja: {
    badge: '生理周期',
    titleLine1: '栄養と生理周期：',
    titleLine2: '体が喜ぶ食べ方',
    metaDuration: '読了4分',
    metaType: 'ガイド',
    metaLevel: '初級',
    metaValidated: '確認済みの内容',
    intro: '食事は、周期を通じて、元気、気分、ホルモン、そして心身の健やかさに影響します。',
    contentsTitle: 'この記事の内容',
    topics: [
      'フェーズごとに必要な栄養',
      '積極的にとりたい食品',
      '控えたい食品',
      'バランスのよい食事の例',
    ],
    section1Body: '体に必要なものは、周期を通じて同じではありません。食べるものを調整すると、大きな違いが生まれます。',
    phases: [
      {
        title: '月経期',
        days: '1〜5日目',
        body: '鉄分、マグネシウム、ビタミンB群を意識しましょう。',
      },
      {
        title: '卵胞期',
        days: '6〜14日目',
        body: '脂肪の少ないたんぱく質と新鮮な野菜を中心にしましょう。',
      },
      {
        title: '排卵期',
        days: '14日目ごろ',
        body: '抗酸化成分とオメガ3を選びましょう。',
      },
      {
        title: '黄体期',
        days: '15〜28日目',
        body: '神経系を支え、炎症を抑える食事を心がけましょう。',
      },
    ],
    foods: [
      {
        title: '鉄分',
        body: 'レンズ豆、ほうれん草、脂肪の少ない肉、ひよこ豆。',
      },
      {
        title: 'マグネシウム',
        body: 'アーモンド、かぼちゃの種、ダークチョコレート、バナナ。',
      },
      {
        title: 'オメガ3',
        body: 'サケ、イワシ、クルミ、亜麻仁。',
      },
      {
        title: 'たんぱく質',
        body: '卵、豆腐、鶏肉などの家禽肉、ギリシャヨーグルト、キヌア。',
      },
      {
        title: '食物繊維と抗酸化成分',
        body: 'ベリー類、アボカド、ブロッコリー、にんじん。',
      },
    ],
    limits: [
      {
        title: '塩分のとりすぎ',
      },
      {
        title: '甘い食べ物',
      },
      {
        title: '超加工食品',
      },
      {
        title: 'カフェインのとりすぎ',
      },
      {
        title: 'アルコール',
      },
    ],
    limitText: 'ほどほどに楽しんで、バランスを保ちましょう。',
    meals: [
      {
        tag: '朝食',
        body: 'オートミールのお粥、ベリー類、アーモンド、チアシード',
      },
      {
        tag: '昼食',
        body: 'サケ、キヌア、蒸したブロッコリー、オリーブオイル',
      },
      {
        tag: '間食',
        body: 'プレーンヨーグルト、ブルーベリー、亜麻仁',
      },
      {
        tag: '夕食',
        body: 'レンズ豆のスープ、焼き野菜、全粒粉のパン',
      },
    ],
    shareMessage: '栄養と生理周期：体が喜ぶ食べ方 — AWA',
  },
  ko: {
    badge: '생리 주기',
    titleLine1: '영양과 주기:',
    titleLine2: '내 몸이 좋아하는 것',
    metaDuration: '읽는 데 4분',
    metaType: '가이드',
    metaLevel: '입문',
    metaValidated: '검토된 콘텐츠',
    intro: '식단은 주기 내내 에너지, 기분, 호르몬, 전반적인 웰빙에 영향을 줘요.',
    contentsTitle: '이 아티클에서 다루는 내용',
    topics: [
      '단계별 영양 필요량',
      '챙겨 먹으면 좋은 음식',
      '줄이면 좋은 음식',
      '균형 잡힌 식사 예시',
    ],
    section1Body: '몸이 필요로 하는 것은 주기 내내 똑같지 않아요. 먹는 것을 조금 조정하면 확실한 차이를 느낄 수 있어요.',
    phases: [
      {
        title: '월경기',
        days: '1~5일째',
        body: '철분, 마그네슘, 비타민 B를 챙기세요.',
      },
      {
        title: '난포기',
        days: '6~14일째',
        body: '기름기 적은 단백질과 신선한 채소에 집중하세요.',
      },
      {
        title: '배란기',
        days: '14일째 무렵',
        body: '항산화 성분과 오메가3를 선택하세요.',
      },
      {
        title: '황체기',
        days: '15~28일째',
        body: '신경계를 돌보고 염증을 줄이세요.',
      },
    ],
    foods: [
      {
        title: '철분',
        body: '렌틸콩, 시금치, 기름기 적은 고기, 병아리콩.',
      },
      {
        title: '마그네슘',
        body: '아몬드, 호박씨, 다크 초콜릿, 바나나.',
      },
      {
        title: '오메가3',
        body: '연어, 정어리, 호두, 아마씨.',
      },
      {
        title: '단백질',
        body: '달걀, 두부, 가금류, 그릭 요거트, 퀴노아.',
      },
      {
        title: '식이섬유와 항산화 성분',
        body: '베리류, 아보카도, 브로콜리, 당근.',
      },
    ],
    limits: [
      {
        title: '과도한 염분',
      },
      {
        title: '단 음식',
      },
      {
        title: '초가공식품',
      },
      {
        title: '과도한 카페인',
      },
      {
        title: '알코올',
      },
    ],
    limitText: '적당히 즐기면 균형을 유지하는 데 도움이 돼요.',
    meals: [
      {
        tag: '아침',
        body: '오트밀 죽, 베리류, 아몬드, 치아씨드',
      },
      {
        tag: '점심',
        body: '연어, 퀴노아, 찐 브로콜리, 올리브 오일',
      },
      {
        tag: '간식',
        body: '플레인 요거트, 블루베리, 아마씨',
      },
      {
        tag: '저녁',
        body: '렌틸콩 수프, 구운 채소, 통곡물 빵',
      },
    ],
    shareMessage: '영양과 주기: 내 몸이 좋아하는 것 — AWA',
  },
  'pt-PT': {
    badge: 'CICLO MENSTRUAL',
    titleLine1: 'Alimentação e o seu ciclo:',
    titleLine2: 'o que o seu corpo adora',
    metaDuration: '4 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'A sua alimentação influencia a sua energia, o seu humor, as suas hormonas e o seu bem-estar geral ao longo do ciclo.',
    contentsTitle: 'Neste artigo',
    topics: [
      'Necessidades nutricionais por fase',
      'Alimentos a privilegiar',
      'Alimentos a limitar',
      'Exemplos de refeições equilibradas',
    ],
    section1Body: 'O seu corpo não tem as mesmas necessidades ao longo do ciclo. Ajustar o que come pode fazer uma diferença real.',
    phases: [
      {
        title: 'Fase menstrual',
        days: 'Dias 1 a 5',
        body: 'Privilegie o ferro, o magnésio e as vitaminas do complexo B.',
      },
      {
        title: 'Fase folicular',
        days: 'Dias 6 a 14',
        body: 'Aposte em proteínas magras e legumes frescos.',
      },
      {
        title: 'Fase ovulatória',
        days: 'Por volta do dia 14',
        body: 'Escolha antioxidantes e ómega-3.',
      },
      {
        title: 'Fase lútea',
        days: 'Dias 15 a 28',
        body: 'Apoie o sistema nervoso e limite a inflamação.',
      },
    ],
    foods: [
      {
        title: 'Ferro',
        body: 'Lentilhas, espinafres, carnes magras, grão-de-bico.',
      },
      {
        title: 'Magnésio',
        body: 'Amêndoas, sementes de abóbora, chocolate preto, banana.',
      },
      {
        title: 'Ómega-3',
        body: 'Salmão, sardinhas, nozes, linhaça.',
      },
      {
        title: 'Proteínas',
        body: 'Ovos, tofu, aves, iogurte grego, quinoa.',
      },
      {
        title: 'Fibras e antioxidantes',
        body: 'Frutos silvestres, abacate, brócolos, cenouras.',
      },
    ],
    limits: [
      {
        title: 'Excesso de sal',
      },
      {
        title: 'Alimentos açucarados',
      },
      {
        title: 'Alimentos ultraprocessados',
      },
      {
        title: 'Excesso de cafeína',
      },
      {
        title: 'Álcool',
      },
    ],
    limitText: 'Desfrute com moderação para ajudar a manter o seu equilíbrio.',
    meals: [
      {
        tag: 'Pequeno-almoço',
        body: 'Papas de aveia, frutos silvestres, amêndoas e chia',
      },
      {
        tag: 'Almoço',
        body: 'Salmão, quinoa, brócolos cozidos a vapor e azeite',
      },
      {
        tag: 'Lanche',
        body: 'Iogurte natural, mirtilos e linhaça',
      },
      {
        tag: 'Jantar',
        body: 'Sopa de lentilhas, legumes assados e pão integral',
      },
    ],
    shareMessage: 'Alimentação e o seu ciclo: o que o seu corpo adora — AWA',
  },
  bn: {
    badge: 'মাসিক চক্র',
    titleLine1: 'খাবার ও আপনার চক্র:',
    titleLine2: 'আপনার শরীর যা পছন্দ করে',
    metaDuration: 'পড়তে 4 মিনিট',
    metaType: 'গাইড',
    metaLevel: 'প্রাথমিক',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'আপনার খাদ্যাভ্যাস চক্র জুড়ে আপনার শক্তি, মেজাজ, হরমোন এবং সামগ্রিক সুস্থতাকে প্রভাবিত করে।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'পর্যায় অনুযায়ী পুষ্টির চাহিদা',
      'যেসব খাবার বেছে নেবেন',
      'যেসব খাবার সীমিত করবেন',
      'সুষম খাবারের উদাহরণ',
    ],
    section1Body: 'চক্রের সব সময়ে আপনার শরীরের একই চাহিদা থাকে না। খাবারে সামান্য সমন্বয় করলে সত্যিই পার্থক্য হতে পারে।',
    phases: [
      {
        title: 'মাসিক পর্যায়',
        days: '1 থেকে 5 তম দিন',
        body: 'আয়রন, ম্যাগনেসিয়াম ও বি ভিটামিনকে অগ্রাধিকার দিন।',
      },
      {
        title: 'ফলিকুলার পর্যায়',
        days: '6 থেকে 14তম দিন',
        body: 'চর্বিহীন প্রোটিন ও তাজা সবজিতে মনোযোগ দিন।',
      },
      {
        title: 'ডিম্বস্ফোটন পর্যায়',
        days: '14 তম দিনের আশপাশে',
        body: 'অ্যান্টিঅক্সিডেন্ট ও ওমেগা-3 বেছে নিন।',
      },
      {
        title: 'লিউটিয়াল পর্যায়',
        days: '15 থেকে 28তম দিন',
        body: 'আপনার স্নায়ুতন্ত্রকে সহায়তা করুন এবং প্রদাহ সীমিত রাখুন।',
      },
    ],
    foods: [
      {
        title: 'আয়রন',
        body: 'মসুর ডাল, পালংশাক, চর্বিহীন মাংস, ছোলা।',
      },
      {
        title: 'ম্যাগনেসিয়াম',
        body: 'বাদাম, কুমড়োর বীজ, ডার্ক চকোলেট, কলা।',
      },
      {
        title: 'ওমেগা-3',
        body: 'স্যালমন, সার্ডিন, আখরোট, তিসির বীজ।',
      },
      {
        title: 'প্রোটিন',
        body: 'ডিম, টফু, মুরগির মাংস, গ্রিক দই, কিনোয়া।',
      },
      {
        title: 'ফাইবার ও অ্যান্টিঅক্সিডেন্ট',
        body: 'বেরি, অ্যাভোকাডো, ব্রকলি, গাজর।',
      },
    ],
    limits: [
      {
        title: 'অতিরিক্ত লবণ',
      },
      {
        title: 'চিনিযুক্ত খাবার',
      },
      {
        title: 'অতি প্রক্রিয়াজাত খাবার',
      },
      {
        title: 'অতিরিক্ত ক্যাফেইন',
      },
      {
        title: 'অ্যালকোহল',
      },
    ],
    limitText: 'ভারসাম্য বজায় রাখতে পরিমিত পরিমাণে উপভোগ করুন।',
    meals: [
      {
        tag: 'সকালের নাশতা',
        body: 'ওটস পরিজ, বেরি, বাদাম ও চিয়া',
      },
      {
        tag: 'দুপুরের খাবার',
        body: 'স্যালমন, কিনোয়া, বাষ্পে সেদ্ধ ব্রকলি ও অলিভ অয়েল',
      },
      {
        tag: 'হালকা নাশতা',
        body: 'সাদা দই, ব্লুবেরি ও তিসির বীজ',
      },
      {
        tag: 'রাতের খাবার',
        body: 'মসুর ডালের স্যুপ, ভাজা সবজি ও গমের আটার রুটি',
      },
    ],
    shareMessage: 'খাবার ও আপনার চক্র: আপনার শরীর যা পছন্দ করে — AWA',
  },
  da: {
    badge: 'MENSTRUATIONSCYKLUS',
    titleLine1: 'Mad og din cyklus:',
    titleLine2: 'hvad din krop holder af',
    metaDuration: '4 min læsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemgået indhold',
    intro: 'Din kost påvirker din energi, dit humør, dine hormoner og dit generelle velbefindende i løbet af cyklussen.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Ernæringsbehov i de forskellige faser',
      'Fødevarer at vælge',
      'Fødevarer at begrænse',
      'Eksempler på afbalancerede måltider',
    ],
    section1Body: 'Din krop har ikke de samme behov på alle tidspunkter i cyklussen. Mindre justeringer i kosten kan virkelig gøre en forskel.',
    phases: [
      {
        title: 'Menstruationsfasen',
        days: 'Dag 1 til 5',
        body: 'Prioriter jern, magnesium og B-vitaminer.',
      },
      {
        title: 'Follikelfasen',
        days: 'Dag 6 til 14',
        body: 'Fokuser på magert protein og friske grøntsager.',
      },
      {
        title: 'Ægløsningsfasen',
        days: 'Omkring dag 14',
        body: 'Vælg antioxidanter og omega-3.',
      },
      {
        title: 'Lutealfasen',
        days: 'Dag 15 til 28',
        body: 'Støt dit nervesystem og begræns betændelse.',
      },
    ],
    foods: [
      {
        title: 'Jern',
        body: 'Linser, spinat, magert kød, kikærter.',
      },
      {
        title: 'Magnesium',
        body: 'Nødder, græskarkerner, mørk chokolade, bananer.',
      },
      {
        title: 'Omega-3',
        body: 'Laks, sardiner, valnødder, hørfrø.',
      },
      {
        title: 'Protein',
        body: 'Æg, tofu, kylling, græsk yoghurt, quinoa.',
      },
      {
        title: 'Fibre og antioxidanter',
        body: 'Bær, avocado, broccoli, gulerødder.',
      },
    ],
    limits: [
      {
        title: 'For meget salt',
      },
      {
        title: 'Sukkerholdige fødevarer',
      },
      {
        title: 'Ultraforarbejdede produkter',
      },
      {
        title: 'For meget koffein',
      },
      {
        title: 'Alkohol',
      },
    ],
    limitText: 'Nyd dem med måde for at bevare balancen.',
    meals: [
      {
        tag: 'Morgenmad',
        body: 'Havregrød, bær, nødder og chiafrø',
      },
      {
        tag: 'Frokost',
        body: 'Laks, quinoa, dampet broccoli og olivenolie',
      },
      {
        tag: 'Mellemmåltid',
        body: 'Naturyoghurt, blåbær og hørfrø',
      },
      {
        tag: 'Aftensmad',
        body: 'Linsesuppe, bagte grøntsager og fuldkornsbrød',
      },
    ],
    shareMessage: 'Mad og din cyklus: hvad din krop holder af — AWA',
  },
  da: {
    badge: 'MENSTRUATIONSCYKLUS',
    titleLine1: 'Mad och din cyklus:',
    titleLine2: 'hvad din krop holder af',
    metaDuration: '4 min läsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemgået indhold',
    intro: 'Din kost påvirker din energi, ditt humör, dina hormoner och ditt generelle velbefindende i löbet av cyklussen.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Ernäringsbehov i de forskellige faser',
      'Födevarer at välge',
      'Födevarer at begränse',
      'Eksempler på afbalancerede måltider',
    ],
    section1Body: 'Din krop har inte de samme behov på alla tidspunkter i cyklussen. Mindre justeringer i kosten kan virkelig göre en forskel.',
    phases: [
      {
        title: 'Menstruationsfasen',
        days: 'Dag 1 till 5',
        body: 'Prioriter jern, magnesium och B-vitaminer.',
      },
      {
        title: 'Follikelfasen',
        days: 'Dag 6 till 14',
        body: 'Fokuser på magert protein och friske gröntsager.',
      },
      {
        title: 'Äglösningsfasen',
        days: 'Omkring dag 14',
        body: 'Välg antioxidanter och omega-3.',
      },
      {
        title: 'Lutealfasen',
        days: 'Dag 15 till 28',
        body: 'Stöt ditt nervesystem och begräns betändelse.',
      },
    ],
    foods: [
      {
        title: 'Jern',
        body: 'Linser, spinat, magert köd, kikärter.',
      },
      {
        title: 'Magnesium',
        body: 'Nödder, gräskarkerner, mörk chokolade, bananer.',
      },
      {
        title: 'Omega-3',
        body: 'Laks, sardiner, valnödder, hörfrö.',
      },
      {
        title: 'Protein',
        body: 'Äg, tofu, kylling, gräsk yoghurt, quinoa.',
      },
      {
        title: 'Fibre och antioxidanter',
        body: 'Bär, avocado, broccoli, gulerödder.',
      },
    ],
    limits: [
      {
        title: 'For mycket salt',
      },
      {
        title: 'Sukkerholdige födevarer',
      },
      {
        title: 'Ultraforarbejdede produkter',
      },
      {
        title: 'For mycket koffein',
      },
      {
        title: 'Alkohol',
      },
    ],
    limitText: 'Nyd dem med måde for att bevare balancen.',
    meals: [
      {
        tag: 'Morgenmad',
        body: 'Havregröd, bär, nödder och chiafrö',
      },
      {
        tag: 'Frokost',
        body: 'Laks, quinoa, dampet broccoli och olivenolie',
      },
      {
        tag: 'Mellemmåltid',
        body: 'Naturyoghurt, blåbär och hörfrö',
      },
      {
        tag: 'Aftensmad',
        body: 'Linsesuppe, bagte gröntsager och fuldkornsbröd',
      },
    ],
    shareMessage: 'Mad och din cyklus: hvad din krop holder av — AWA',
  },
  sv: {
    badge: 'MENSTRUATIONSCYKLUS',
    titleLine1: 'Mad och din cyklus:',
    titleLine2: 'hvad din krop holder af',
    metaDuration: '4 min läsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemgået indhold',
    intro: 'Din kost påvirker din energi, ditt humör, dina hormoner och ditt generelle velbefindende i löbet av cyklussen.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Ernäringsbehov i de forskellige faser',
      'Födevarer at välge',
      'Födevarer at begränse',
      'Eksempler på afbalancerede måltider',
    ],
    section1Body: 'Din krop har inte de samme behov på alla tidspunkter i cyklussen. Mindre justeringer i kosten kan virkelig göre en forskel.',
    phases: [
      {
        title: 'Menstruationsfasen',
        days: 'Dag 1 till 5',
        body: 'Prioriter jern, magnesium och B-vitaminer.',
      },
      {
        title: 'Follikelfasen',
        days: 'Dag 6 till 14',
        body: 'Fokuser på magert protein och friske gröntsager.',
      },
      {
        title: 'Äglösningsfasen',
        days: 'Omkring dag 14',
        body: 'Välg antioxidanter och omega-3.',
      },
      {
        title: 'Lutealfasen',
        days: 'Dag 15 till 28',
        body: 'Stöt ditt nervesystem och begräns betändelse.',
      },
    ],
    foods: [
      {
        title: 'Jern',
        body: 'Linser, spinat, magert köd, kikärter.',
      },
      {
        title: 'Magnesium',
        body: 'Nödder, gräskarkerner, mörk chokolade, bananer.',
      },
      {
        title: 'Omega-3',
        body: 'Laks, sardiner, valnödder, hörfrö.',
      },
      {
        title: 'Protein',
        body: 'Äg, tofu, kylling, gräsk yoghurt, quinoa.',
      },
      {
        title: 'Fibre och antioxidanter',
        body: 'Bär, avocado, broccoli, gulerödder.',
      },
    ],
    limits: [
      {
        title: 'For mycket salt',
      },
      {
        title: 'Sukkerholdige födevarer',
      },
      {
        title: 'Ultraforarbejdede produkter',
      },
      {
        title: 'For mycket koffein',
      },
      {
        title: 'Alkohol',
      },
    ],
    limitText: 'Nyd dem med måde for att bevare balancen.',
    meals: [
      {
        tag: 'Morgenmad',
        body: 'Havregröd, bär, nödder och chiafrö',
      },
      {
        tag: 'Frokost',
        body: 'Laks, quinoa, dampet broccoli och olivenolie',
      },
      {
        tag: 'Mellemmåltid',
        body: 'Naturyoghurt, blåbär och hörfrö',
      },
      {
        tag: 'Aftensmad',
        body: 'Linsesuppe, bagte gröntsager och fuldkornsbröd',
      },
    ],
    shareMessage: 'Mad och din cyklus: hvad din krop holder av — AWA',
  },
} as const);

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ArticleReader'
>;

export default function NutritionCycleArticleScreen({
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

        <View style={styles.article}>
          <View style={styles.badge}>
            <AwaText variant="labelSmall" emphasized colorRole="primary">
              {content.badge}
            </AwaText>
          </View>

          <AwaText variant="headlineMedium" weight="700" style={styles.title}>
            {content.titleLine1}{`\n`}
            {content.titleLine2}
          </AwaText>

          {/* META COMME TA CAPTURE */}
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

          <AwaText variant="titleSmall" style={styles.intro}>
            {content.intro}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.contents}>
            <AwaText variant="titleSmall" emphasized style={styles.contentsTitle}>
              {content.contentsTitle}
            </AwaText>

            {content.topics.map((item, index) => (
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
          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            1. {content.topics[0]}
          </AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.section1Body}
          </AwaText>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}>
            {content.phases.map((phase, index) => (
              <View
                key={phase.title}
                style={styles.phase}>
                <View style={styles.phaseIcon}>
                  <MaterialDesignIcons
                    name={PHASE_ICONS[index] as never}
                    size={25}
                    color={theme.colors.primary}
                  />
                </View>

                <AwaText variant="titleSmall" emphasized style={styles.cardTitle}>
                  {phase.title}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.days}>
                  {phase.days}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.cardBody}>
                  {phase.body}
                </AwaText>
              </View>
            ))}
          </ScrollView>

          {/* SECTION 2 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            2. {content.topics[1]}
          </AwaText>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}>
            {content.foods.map((food, index) => (
              <View key={food.title} style={styles.food}>
                <Image
                  source={FOOD_IMAGES[index]}
                  resizeMode="cover"
                  style={styles.foodImage}
                />

                <AwaText variant="titleSmall" emphasized style={styles.cardTitle}>
                  {food.title}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.cardBody}>
                  {food.body}
                </AwaText>
              </View>
            ))}
          </ScrollView>

          {/* SECTION 3 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            3. {content.topics[2]}
          </AwaText>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}>
            {content.limits.map((limit, index) => (
              <View
                key={limit.title}
                style={styles.limit}>
                <View style={styles.limitIcon}>
                  <MaterialDesignIcons
                    name={LIMIT_ICONS[index] as never}
                    size={26}
                    color={theme.colors.primary}
                  />
                </View>

                <AwaText variant="titleSmall" emphasized style={styles.cardTitle}>
                  {limit.title}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.limitText}>
                  {content.limitText}
                </AwaText>
              </View>
            ))}
          </ScrollView>

          {/* SECTION 4 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            4. {content.topics[3]}
          </AwaText>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}>
            {content.meals.map((meal, index) => (
              <View
                key={meal.tag}
                style={styles.meal}>
                <Image
                  source={MEAL_IMAGES[index]}
                  resizeMode="cover"
                  style={styles.mealImage}
                />

                <AwaText variant="labelSmall" style={styles.mealTag}>
                  {meal.tag}
                </AwaText>

                <AwaText variant="bodySmall" style={styles.mealText}>
                  {meal.body}
                </AwaText>
              </View>
            ))}
          </ScrollView>

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
    // avant 28
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
    // avant 15
  },

  contents: {
    marginTop: 20,
    padding: 16,
  },

  contentsTitle: {
    marginBottom: 8,
  },

  contentRow: {
    minHeight: 35,
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

  h2: {
    marginTop: 24,
    // avant 22
  },

  body: {
    marginTop: 8,
    // avant 14
  },

  row: {
    gap: 8,
    paddingTop: 12,
    paddingBottom: 3,
  },

  phase: {
    width: 145,
    minHeight: 198,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
  },

  phaseIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  food: {
    width: 138,
    minHeight: 195,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
  },

  foodImage: {
    width: '100%',
    height: 88,
  },

  cardTitle: {
    marginTop: 8,
    paddingHorizontal: 8,
    // avant 13
    textAlign: 'center',
  },

  days: {
    marginTop: 4,
  },

  cardBody: {
    marginTop: 8,
    paddingHorizontal: 8,
    // avant 11.5
    textAlign: 'center',
  },

  limit: {
    width: 122,
    minHeight: 148,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
  },

  limitIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  limitText: {
    marginTop: 8,
    textAlign: 'center',
  },

  meal: {
    width: 168,
    minHeight: 195,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
  },

  mealImage: {
    width: '100%',
    height: 105,
  },

  mealTag: {
    position: 'absolute',
    top: 0,
    left: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: theme.colors.primary,
    color: onPrimaryTextColor(theme),
  },

  mealText: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  });
}
