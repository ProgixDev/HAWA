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
  nb: {
    badge: 'MENSTRUASJONSSYKLUS',
    titleLine1: 'Ernæring og syklusen din:',
    titleLine2: 'det kroppen din liker',
    metaDuration: '4 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Nybegynner',
    metaValidated: 'Gjennomgått innhold',
    intro:
      'Kostholdet ditt påvirker energien, humøret, hormonene og det generelle velværet ditt gjennom syklusen.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Ernæringsbehov etter fase',
      'Mat du bør prioritere',
      'Mat du bør begrense',
      'Eksempler på balanserte måltider',
    ],
    section1Body:
      'Kroppen din har ikke de samme behovene gjennom hele syklusen. Å justere det du spiser, kan gjøre en reell forskjell.',
    phases: [
      {
        title: 'Menstruasjonsfase',
        days: 'Dag 1 til 5',
        body: 'Prioriter jern, magnesium og B-vitaminer.',
      },
      {
        title: 'Follikelfase',
        days: 'Dag 6 til 14',
        body: 'Fokuser på mager proteinkilde og friske grønnsaker.',
      },
      {
        title: 'Eggløsningsfase',
        days: 'Rundt dag 14',
        body: 'Velg antioksidanter og omega-3.',
      },
      {
        title: 'Lutealfase',
        days: 'Dag 15 til 28',
        body: 'Støtt nervesystemet og begrens betennelse.',
      },
    ],
    foods: [
      {title: 'Jern', body: 'Linser, spinat, magert kjøtt, kikerter.'},
      {title: 'Magnesium', body: 'Mandler, gresskarkjerner, mørk sjokolade, banan.'},
      {title: 'Omega-3', body: 'Laks, sardiner, valnøtter, linfrø.'},
      {title: 'Protein', body: 'Egg, tofu, fjærkre, gresk yoghurt, quinoa.'},
      {title: 'Fiber og antioksidanter', body: 'Bær, avokado, brokkoli, gulrøtter.'},
    ],
    limits: [
      {title: 'For mye salt'},
      {title: 'Sukkerholdig mat'},
      {title: 'Ultraprosessert mat'},
      {title: 'For mye koffein'},
      {title: 'Alkohol'},
    ],
    limitText: 'Nyt med måte for å bidra til å holde balansen.',
    meals: [
      {tag: 'Frokost', body: 'Havregrøt, bær, mandler og chiafrø'},
      {tag: 'Lunsj', body: 'Laks, quinoa, dampet brokkoli og olivenolje'},
      {tag: 'Mellommåltid', body: 'Naturell yoghurt, blåbær og linfrø'},
      {tag: 'Middag', body: 'Linsesuppe, ovnsbakte grønnsaker og grovt brød'},
    ],
    shareMessage: 'Ernæring og syklusen din: det kroppen din liker – AWA',
  },
  pl: {
    badge: 'CYKL MIESIĄCZKOWY',
    titleLine1: 'Odżywianie a Twój cykl:',
    titleLine2: 'co lubi Twoje ciało',
    metaDuration: '4 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść zweryfikowana',
    intro:
      'To, co jesz, wpływa na Twoją energię, nastrój, hormony i ogólne samopoczucie przez cały cykl.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Potrzeby żywieniowe w poszczególnych fazach',
      'Produkty, które warto wybierać',
      'Produkty do ograniczenia',
      'Przykłady zbilansowanych posiłków',
    ],
    section1Body:
      'Twoje ciało nie ma tych samych potrzeb przez cały cykl. Dostosowanie tego, co jesz, może naprawdę coś zmienić.',
    phases: [
      {
        title: 'Faza menstruacyjna',
        days: 'Dni 1–5',
        body: 'Postaw na żelazo, magnez i witaminy z grupy B.',
      },
      {
        title: 'Faza folikularna',
        days: 'Dni 6–14',
        body: 'Skup się na chudym białku i świeżych warzywach.',
      },
      {
        title: 'Faza owulacyjna',
        days: 'Około 14. dnia',
        body: 'Wybieraj przeciwutleniacze i kwasy omega-3.',
      },
      {
        title: 'Faza lutealna',
        days: 'Dni 15–28',
        body: 'Wspieraj układ nerwowy i ograniczaj stan zapalny.',
      },
    ],
    foods: [
      {title: 'Żelazo', body: 'Soczewica, szpinak, chude mięso, ciecierzyca.'},
      {title: 'Magnez', body: 'Migdały, pestki dyni, gorzka czekolada, banan.'},
      {title: 'Omega-3', body: 'Łosoś, sardynki, orzechy włoskie, siemię lniane.'},
      {title: 'Białko', body: 'Jajka, tofu, drób, jogurt grecki, komosa ryżowa.'},
      {title: 'Błonnik i przeciwutleniacze', body: 'Jagody, awokado, brokuły, marchew.'},
    ],
    limits: [
      {title: 'Nadmiar soli'},
      {title: 'Słodkie produkty'},
      {title: 'Żywność ultraprzetworzona'},
      {title: 'Nadmiar kofeiny'},
      {title: 'Alkohol'},
    ],
    limitText: 'Spożywaj z umiarem, by zachować równowagę.',
    meals: [
      {tag: 'Śniadanie', body: 'Owsianka, jagody, migdały i nasiona chia'},
      {tag: 'Obiad', body: 'Łosoś, komosa ryżowa, brokuły na parze i oliwa z oliwek'},
      {tag: 'Przekąska', body: 'Jogurt naturalny, borówki i siemię lniane'},
      {tag: 'Kolacja', body: 'Zupa z soczewicy, pieczone warzywa i chleb pełnoziarnisty'},
    ],
    shareMessage: 'Odżywianie a Twój cykl: co lubi Twoje ciało — AWA',
  },
  uk: {
    badge: 'МЕНСТРУАЛЬНИЙ ЦИКЛ',
    titleLine1: 'Харчування та ваш цикл:',
    titleLine2: 'що любить ваше тіло',
    metaDuration: '4 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Початковий',
    metaValidated: 'Перевірений вміст',
    intro:
      'Ваше харчування впливає на енергію, настрій, гормони та загальне самопочуття протягом усього циклу.',
    contentsTitle: 'У цій статті',
    topics: [
      'Харчові потреби за фазами',
      'Продукти, яким варто надавати перевагу',
      'Продукти, які слід обмежити',
      'Приклади збалансованих страв',
    ],
    section1Body:
      'Ваше тіло має різні потреби протягом циклу. Коригування того, що ви їсте, може справді змінити ситуацію.',
    phases: [
      {
        title: 'Менструальна фаза',
        days: 'Дні 1–5',
        body: 'Надавайте перевагу залізу, магнію та вітамінам групи B.',
      },
      {
        title: 'Фолікулярна фаза',
        days: 'Дні 6–14',
        body: 'Зосередьтеся на пісному білку та свіжих овочах.',
      },
      {
        title: 'Овуляторна фаза',
        days: 'Близько 14-го дня',
        body: 'Обирайте антиоксиданти й омега-3.',
      },
      {
        title: 'Лютеїнова фаза',
        days: 'Дні 15–28',
        body: 'Підтримуйте нервову систему та обмежуйте запалення.',
      },
    ],
    foods: [
      {title: 'Залізо', body: 'Сочевиця, шпинат, пісне м’ясо, нут.'},
      {title: 'Магній', body: 'Мигдаль, гарбузове насіння, чорний шоколад, банан.'},
      {title: 'Омега-3', body: 'Лосось, сардини, волоські горіхи, насіння льону.'},
      {title: 'Білок', body: 'Яйця, тофу, птиця, грецький йогурт, кіноа.'},
      {title: 'Клітковина й антиоксиданти', body: 'Ягоди, авокадо, броколі, морква.'},
    ],
    limits: [
      {title: 'Надлишок солі'},
      {title: 'Солодощі'},
      {title: 'Ультрапереробна їжа'},
      {title: 'Надлишок кофеїну'},
      {title: 'Алкоголь'},
    ],
    limitText: 'Вживайте помірно, щоб підтримувати рівновагу.',
    meals: [
      {tag: 'Сніданок', body: 'Вівсянка, ягоди, мигдаль і насіння чіа'},
      {tag: 'Обід', body: 'Лосось, кіноа, броколі на пару та оливкова олія'},
      {tag: 'Перекус', body: 'Натуральний йогурт, лохина й насіння льону'},
      {tag: 'Вечеря', body: 'Суп із сочевиці, запечені овочі та цільнозерновий хліб'},
    ],
    shareMessage: 'Харчування та ваш цикл: що любить ваше тіло — AWA',
  },
  cs: {
    badge: 'MENSTRUAČNÍ CYKLUS',
    titleLine1: 'Výživa a váš cyklus:',
    titleLine2: 'co vaše tělo miluje',
    metaDuration: '4 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Začátečník',
    metaValidated: 'Ověřený obsah',
    intro:
      'Vaše strava ovlivňuje energii, náladu, hormony a celkovou pohodu v průběhu celého cyklu.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Nutriční potřeby podle fáze',
      'Potraviny, které upřednostnit',
      'Potraviny, které omezit',
      'Příklady vyvážených jídel',
    ],
    section1Body:
      'Vaše tělo nemá v průběhu cyklu stále stejné potřeby. Úprava toho, co jíte, může udělat skutečný rozdíl.',
    phases: [
      {
        title: 'Menstruační fáze',
        days: '1. až 5. den',
        body: 'Upřednostněte železo, hořčík a vitaminy skupiny B.',
      },
      {
        title: 'Folikulární fáze',
        days: '6. až 14. den',
        body: 'Zaměřte se na libové bílkoviny a čerstvou zeleninu.',
      },
      {
        title: 'Ovulační fáze',
        days: 'Kolem 14. dne',
        body: 'Zvolte antioxidanty a omega-3 mastné kyseliny.',
      },
      {
        title: 'Luteální fáze',
        days: '15. až 28. den',
        body: 'Podpořte nervový systém a omezte záněty.',
      },
    ],
    foods: [
      {title: 'Železo', body: 'Čočka, špenát, libové maso, cizrna.'},
      {title: 'Hořčík', body: 'Mandle, dýňová semínka, hořká čokoláda, banán.'},
      {title: 'Omega-3', body: 'Losos, sardinky, vlašské ořechy, lněné semínko.'},
      {title: 'Bílkoviny', body: 'Vejce, tofu, drůbež, řecký jogurt, quinoa.'},
      {title: 'Vláknina a antioxidanty', body: 'Bobule, avokádo, brokolice, mrkev.'},
    ],
    limits: [
      {title: 'Nadbytek soli'},
      {title: 'Sladké potraviny'},
      {title: 'Vysoce zpracované potraviny'},
      {title: 'Nadbytek kofeinu'},
      {title: 'Alkohol'},
    ],
    limitText: 'Užívejte s mírou, abyste pomohla udržet svou rovnováhu.',
    meals: [
      {tag: 'Snídaně', body: 'Ovesná kaše, bobule, mandle a chia'},
      {tag: 'Oběd', body: 'Losos, quinoa, brokolice na páře a olivový olej'},
      {tag: 'Svačina', body: 'Neslazený jogurt, borůvky a lněné semínko'},
      {tag: 'Večeře', body: 'Čočková polévka, pečená zelenina a celozrnný chléb'},
    ],
    shareMessage: 'Výživa a váš cyklus: co vaše tělo miluje — AWA',
  },
  sk: {
    badge: 'MENŠTRUAČNÝ CYKLUS',
    titleLine1: 'Výživa a váš cyklus:',
    titleLine2: 'čo vaše telo miluje',
    metaDuration: '4 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Začiatočník',
    metaValidated: 'Overený obsah',
    intro:
      'Vaša strava ovplyvňuje energiu, náladu, hormóny a celkovú pohodu počas celého cyklu.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Nutričné potreby podľa fázy',
      'Potraviny, ktoré uprednostniť',
      'Potraviny, ktoré obmedziť',
      'Príklady vyvážených jedál',
    ],
    section1Body:
      'Vaše telo nemá počas cyklu rovnaké potreby. Úprava toho, čo jete, môže mať skutočný význam.',
    phases: [
      {
        title: 'Menštruačná fáza',
        days: '1. až 5. deň',
        body: 'Uprednostnite železo, horčík a vitamíny skupiny B.',
      },
      {
        title: 'Folikulárna fáza',
        days: '6. až 14. deň',
        body: 'Zamerajte sa na chudé bielkoviny a čerstvú zeleninu.',
      },
      {
        title: 'Ovulačná fáza',
        days: 'Okolo 14. dňa',
        body: 'Vyberajte antioxidanty a omega-3.',
      },
      {
        title: 'Luteálna fáza',
        days: '15. až 28. deň',
        body: 'Podporte nervový systém a obmedzte zápal.',
      },
    ],
    foods: [
      {title: 'Železo', body: 'Šošovica, špenát, chudé mäso, cícer.'},
      {title: 'Horčík', body: 'Mandle, tekvicové semienka, horká čokoláda, banán.'},
      {title: 'Omega-3', body: 'Losos, sardinky, vlašské orechy, ľanové semienko.'},
      {title: 'Bielkoviny', body: 'Vajcia, tofu, hydina, grécky jogurt, quinoa.'},
      {title: 'Vláknina a antioxidanty', body: 'Bobuľoviny, avokádo, brokolica, mrkva.'},
    ],
    limits: [
      {title: 'Nadbytok soli'},
      {title: 'Sladké potraviny'},
      {title: 'Ultraspracované potraviny'},
      {title: 'Nadbytok kofeínu'},
      {title: 'Alkohol'},
    ],
    limitText: 'Užívajte si s mierou, aby ste pomohli udržať rovnováhu.',
    meals: [
      {tag: 'Raňajky', body: 'Ovsená kaša, bobuľoviny, mandle a chia'},
      {tag: 'Obed', body: 'Losos, quinoa, brokolica na pare a olivový olej'},
      {tag: 'Desiata', body: 'Biely jogurt, čučoriedky a ľanové semienko'},
      {tag: 'Večera', body: 'Šošovicová polievka, pečená zelenina a celozrnný chlieb'},
    ],
    shareMessage: 'Výživa a váš cyklus: čo vaše telo miluje — AWA',
  },
  hu: {
    badge: 'MENSTRUÁCIÓS CIKLUS',
    titleLine1: 'Táplálkozás és a ciklusod:',
    titleLine2: 'amit a tested szeret',
    metaDuration: '4 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Kezdő',
    metaValidated: 'Ellenőrzött tartalom',
    intro:
      'Az étrended befolyásolja az energiádat, a hangulatodat, a hormonjaidat és az általános jóléted a ciklusod során.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Táplálkozási szükségletek szakaszonként',
      'Előnyben részesítendő ételek',
      'Korlátozandó ételek',
      'Példák kiegyensúlyozott étkezésekre',
    ],
    section1Body:
      'A tested szükségletei nem azonosak a ciklus során. Az étrended hozzáigazítása valódi különbséget jelenthet.',
    phases: [
      {
        title: 'Menstruációs szakasz',
        days: '1–5. nap',
        body: 'Részesítsd előnyben a vasat, a magnéziumot és a B-vitaminokat.',
      },
      {
        title: 'Follikuláris szakasz',
        days: '6–14. nap',
        body: 'Összpontosíts a sovány fehérjékre és a friss zöldségekre.',
      },
      {
        title: 'Peteérési szakasz',
        days: 'Körülbelül a 14. nap',
        body: 'Válassz antioxidánsokat és omega-3-at.',
      },
      {
        title: 'Luteális szakasz',
        days: '15–28. nap',
        body: 'Támogasd az idegrendszeredet, és korlátozd a gyulladást.',
      },
    ],
    foods: [
      {title: 'Vas', body: 'Lencse, spenót, sovány húsok, csicseriborsó.'},
      {title: 'Magnézium', body: 'Mandula, tökmag, étcsokoládé, banán.'},
      {title: 'Omega-3', body: 'Lazac, szardínia, dió, lenmag.'},
      {title: 'Fehérje', body: 'Tojás, tofu, baromfi, görög joghurt, quinoa.'},
      {title: 'Rost és antioxidánsok', body: 'Bogyós gyümölcsök, avokádó, brokkoli, sárgarépa.'},
    ],
    limits: [
      {title: 'A túlzott só'},
      {title: 'Cukros ételek'},
      {title: 'Ultrafeldolgozott élelmiszerek'},
      {title: 'A túlzott koffein'},
      {title: 'Alkohol'},
    ],
    limitText: 'Mértékkel élvezd, hogy segíts fenntartani az egyensúlyodat.',
    meals: [
      {tag: 'Reggeli', body: 'Zabkása, bogyós gyümölcsök, mandula és chia'},
      {tag: 'Ebéd', body: 'Lazac, quinoa, párolt brokkoli és olívaolaj'},
      {tag: 'Tízórai', body: 'Natúr joghurt, áfonya és lenmag'},
      {tag: 'Vacsora', body: 'Lencseleves, sült zöldségek és teljes kiőrlésű kenyér'},
    ],
    shareMessage: 'Táplálkozás és a ciklusod: amit a tested szeret — AWA',
  },
  ro: {
    badge: 'CICLUL MENSTRUAL',
    titleLine1: 'Alimentația și ciclul tău:',
    titleLine2: 'ce îi place corpului tău',
    metaDuration: '4 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Începător',
    metaValidated: 'Conținut revizuit',
    intro:
      'Alimentația ta îți influențează energia, starea de spirit, hormonii și starea generală de bine pe tot parcursul ciclului.',
    contentsTitle: 'În acest articol',
    topics: [
      'Nevoile nutriționale pe faze',
      'Alimente de favorizat',
      'Alimente de limitat',
      'Exemple de mese echilibrate',
    ],
    section1Body:
      'Corpul tău nu are aceleași nevoi pe tot parcursul ciclului. Ajustarea a ceea ce mănânci poate face o diferență reală.',
    phases: [
      {
        title: 'Faza menstruală',
        days: 'Zilele 1 până la 5',
        body: 'Favorizează fierul, magneziul și vitaminele B.',
      },
      {
        title: 'Faza foliculară',
        days: 'Zilele 6 până la 14',
        body: 'Concentrează-te pe proteine slabe și legume proaspete.',
      },
      {
        title: 'Faza ovulatorie',
        days: 'În jurul zilei 14',
        body: 'Alege antioxidanți și omega-3.',
      },
      {
        title: 'Faza luteală',
        days: 'Zilele 15 până la 28',
        body: 'Susține-ți sistemul nervos și limitează inflamația.',
      },
    ],
    foods: [
      {title: 'Fier', body: 'Linte, spanac, carne slabă, năut.'},
      {title: 'Magneziu', body: 'Migdale, semințe de dovleac, ciocolată neagră, banană.'},
      {title: 'Omega-3', body: 'Somon, sardine, nuci, semințe de in.'},
      {title: 'Proteine', body: 'Ouă, tofu, carne de pasăre, iaurt grecesc, quinoa.'},
      {title: 'Fibre și antioxidanți', body: 'Fructe de pădure, avocado, broccoli, morcovi.'},
    ],
    limits: [
      {title: 'Excesul de sare'},
      {title: 'Alimentele dulci'},
      {title: 'Alimentele ultraprocesate'},
      {title: 'Excesul de cafeină'},
      {title: 'Alcoolul'},
    ],
    limitText: 'Bucură-te de ele cu moderație pentru a-ți menține echilibrul.',
    meals: [
      {tag: 'Mic dejun', body: 'Terci de ovăz, fructe de pădure, migdale și chia'},
      {tag: 'Prânz', body: 'Somon, quinoa, broccoli la abur și ulei de măsline'},
      {tag: 'Gustare', body: 'Iaurt simplu, afine și semințe de in'},
      {tag: 'Cină', body: 'Supă de linte, legume coapte și pâine integrală'},
    ],
    shareMessage: 'Alimentația și ciclul tău: ce îi place corpului tău — AWA',
  },
  bg: {
    badge: 'МЕНСТРУАЛЕН ЦИКЪЛ',
    titleLine1: 'Храненето и цикълът ти:',
    titleLine2: 'какво обича тялото ти',
    metaDuration: '4 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Начинаещ',
    metaValidated: 'Проверено съдържание',
    intro:
      'Храненето ти влияе на енергията, настроението, хормоните и общото ти благополучие през целия цикъл.',
    contentsTitle: 'В тази статия',
    topics: [
      'Хранителни нужди по фази',
      'Храни, които да предпочиташ',
      'Храни, които да ограничаваш',
      'Примери за балансирани ястия',
    ],
    section1Body:
      'Тялото ти няма едни и същи нужди през целия цикъл. Нагаждането на онова, което ядеш, може да направи реална разлика.',
    phases: [
      {
        title: 'Менструална фаза',
        days: 'Дни 1 до 5',
        body: 'Предпочитай желязо, магнезий и витамини от група B.',
      },
      {
        title: 'Фоликуларна фаза',
        days: 'Дни 6 до 14',
        body: 'Наблегни на постни протеини и пресни зеленчуци.',
      },
      {
        title: 'Овулаторна фаза',
        days: 'Около 14-ия ден',
        body: 'Избирай антиоксиданти и омега-3.',
      },
      {
        title: 'Лутеинова фаза',
        days: 'Дни 15 до 28',
        body: 'Подкрепяй нервната си система и ограничавай възпалението.',
      },
    ],
    foods: [
      {title: 'Желязо', body: 'Леща, спанак, постно месо, нахут.'},
      {title: 'Магнезий', body: 'Бадеми, тиквени семки, тъмен шоколад, банан.'},
      {title: 'Омега-3', body: 'Сьомга, сардини, орехи, ленено семе.'},
      {title: 'Протеини', body: 'Яйца, тофу, птиче месо, гръцко кисело мляко, киноа.'},
      {title: 'Фибри и антиоксиданти', body: 'Горски плодове, авокадо, броколи, моркови.'},
    ],
    limits: [
      {title: 'Излишък от сол'},
      {title: 'Сладки храни'},
      {title: 'Силно преработени храни'},
      {title: 'Излишък от кофеин'},
      {title: 'Алкохол'},
    ],
    limitText: 'Консумирай умерено, за да поддържаш равновесието си.',
    meals: [
      {tag: 'Закуска', body: 'Овесена каша, горски плодове, бадеми и чиа'},
      {tag: 'Обяд', body: 'Сьомга, киноа, броколи на пара и зехтин'},
      {tag: 'Междинна закуска', body: 'Натурално кисело мляко, боровинки и ленено семе'},
      {tag: 'Вечеря', body: 'Супа от леща, печени зеленчуци и пълнозърнест хляб'},
    ],
    shareMessage: 'Храненето и цикълът ти: какво обича тялото ти — AWA',
  },
  sr: {
    badge: 'МЕНСТРУАЛНИ ЦИКЛУС',
    titleLine1: 'Исхрана и твој циклус:',
    titleLine2: 'шта воли твоје тело',
    metaDuration: '4 мин читања',
    metaType: 'Водич',
    metaLevel: 'Почетник',
    metaValidated: 'Проверен садржај',
    intro:
      'Твоја исхрана утиче на твоју енергију, расположење, хормоне и опште благостање током целог циклуса.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Хранљиве потребе по фазама',
      'Храна коју треба преферирати',
      'Храна коју треба ограничити',
      'Примери уравнотежених оброка',
    ],
    section1Body:
      'Твоје тело нема исте потребе током целог циклуса. Прилагођавање онога што једеш може направити стварну разлику.',
    phases: [
      {
        title: 'Менструална фаза',
        days: 'Дани 1 до 5',
        body: 'Преферирај гвожђе, магнезијум и витамине групе B.',
      },
      {
        title: 'Фоликуларна фаза',
        days: 'Дани 6 до 14',
        body: 'Стави нагласак на посне беланчевине и свеже поврће.',
      },
      {
        title: 'Овулаторна фаза',
        days: 'Око 14. дана',
        body: 'Бирај антиоксиданте и омега-3.',
      },
      {
        title: 'Лутеална фаза',
        days: 'Дани 15 до 28',
        body: 'Подржи нервни систем и ограничи запаљење.',
      },
    ],
    foods: [
      {title: 'Гвожђе', body: 'Сочиво, спанаћ, посно месо, леблебије.'},
      {title: 'Магнезијум', body: 'Бадеми, семенке бундеве, тамна чоколада, банана.'},
      {title: 'Омега-3', body: 'Лосос, сардине, ораси, ленено семе.'},
      {title: 'Беланчевине', body: 'Јаја, тофу, живина, грчки јогурт, киноа.'},
      {title: 'Влакна и антиоксиданти', body: 'Бобичасто воће, авокадо, броколи, шаргарепа.'},
    ],
    limits: [
      {title: 'Вишак соли'},
      {title: 'Слатка храна'},
      {title: 'Високо прерађена храна'},
      {title: 'Вишак кофеина'},
      {title: 'Алкохол'},
    ],
    limitText: 'Конзумирај умерено да би одржала равнотежу.',
    meals: [
      {tag: 'Доручак', body: 'Овсена каша, бобичасто воће, бадеми и чиа'},
      {tag: 'Ручак', body: 'Лосос, киноа, броколи на пари и маслиново уље'},
      {tag: 'Ужина', body: 'Природни јогурт, боровнице и ленено семе'},
      {tag: 'Вечера', body: 'Чорба од сочива, печено поврће и хлеб од целог зрна'},
    ],
    shareMessage: 'Исхрана и твој циклус: шта воли твоје тело — AWA',
  },
  hr: {
    badge: 'MENSTRUALNI CIKLUS',
    titleLine1: 'Prehrana i tvoj ciklus:',
    titleLine2: 'što tvoje tijelo voli',
    metaDuration: '4 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro:
      'Tvoja prehrana utječe na energiju, raspoloženje, hormone i opću dobrobit tijekom cijelog ciklusa.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Prehrambene potrebe po fazama',
      'Namirnice kojima treba dati prednost',
      'Namirnice koje treba ograničiti',
      'Primjeri uravnoteženih obroka',
    ],
    section1Body:
      'Tvoje tijelo nema iste potrebe tijekom cijelog ciklusa. Prilagodba onoga što jedeš može napraviti stvarnu razliku.',
    phases: [
      {
        title: 'Menstrualna faza',
        days: '1. do 5. dan',
        body: 'Daj prednost željezu, magneziju i vitaminima B.',
      },
      {
        title: 'Folikularna faza',
        days: '6. do 14. dan',
        body: 'Usredotoči se na nemasne bjelančevine i svježe povrće.',
      },
      {
        title: 'Ovulacijska faza',
        days: 'Oko 14. dana',
        body: 'Odaberi antioksidanse i omega-3 masne kiseline.',
      },
      {
        title: 'Lutealna faza',
        days: '15. do 28. dan',
        body: 'Podrži živčani sustav i ograniči upalu.',
      },
    ],
    foods: [
      {title: 'Željezo', body: 'Leća, špinat, nemasno meso, slanutak.'},
      {title: 'Magnezij', body: 'Bademi, sjemenke bundeve, tamna čokolada, banana.'},
      {title: 'Omega-3', body: 'Losos, srdele, orasi, laneno sjeme.'},
      {title: 'Bjelančevine', body: 'Jaja, tofu, perad, grčki jogurt, kvinoja.'},
      {title: 'Vlakna i antioksidansi', body: 'Bobičasto voće, avokado, brokula, mrkva.'},
    ],
    limits: [
      {title: 'Višak soli'},
      {title: 'Slatka hrana'},
      {title: 'Ultraprerađena hrana'},
      {title: 'Višak kofeina'},
      {title: 'Alkohol'},
    ],
    limitText: 'Uživaj umjereno kako bi pomogla održati ravnotežu.',
    meals: [
      {tag: 'Doručak', body: 'Zobena kaša, bobičasto voće, bademi i chia'},
      {tag: 'Ručak', body: 'Losos, kvinoja, kuhana brokula i maslinovo ulje'},
      {tag: 'Užina', body: 'Obični jogurt, borovnice i laneno sjeme'},
      {tag: 'Večera', body: 'Juha od leće, pečeno povrće i integralni kruh'},
    ],
    shareMessage: 'Prehrana i tvoj ciklus: što tvoje tijelo voli — AWA',
  },
  bs: {
    badge: 'MENSTRUALNI CIKLUS',
    titleLine1: 'Ishrana i tvoj ciklus:',
    titleLine2: 'što tvoje tijelo voli',
    metaDuration: '4 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro:
      'Tvoja ishrana utječe na energiju, raspoloženje, hormone i opću dobrobit tokom cijelog ciklusa.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Prehrambene potrebe po fazama',
      'Namirnice kojima treba dati prednost',
      'Namirnice koje treba ograničiti',
      'Primjeri uravnoteženih obroka',
    ],
    section1Body:
      'Tvoje tijelo nema iste potrebe tokom cijelog ciklusa. Prilagodba onoga što jedeš može napraviti stvarnu razliku.',
    phases: [
      {
        title: 'Menstrualna faza',
        days: '1. do 5. dan',
        body: 'Daj prednost željezu, magneziju i vitaminima B.',
      },
      {
        title: 'Folikularna faza',
        days: '6. do 14. dan',
        body: 'Usredotoči se na nemasne bjelančevine i svježe povrće.',
      },
      {
        title: 'Ovulacijska faza',
        days: 'Oko 14. dana',
        body: 'Odaberi antioksidanse i omega-3 masne kiseline.',
      },
      {
        title: 'Lutealna faza',
        days: '15. do 28. dan',
        body: 'Podrži nervni sistem i ograniči upalu.',
      },
    ],
    foods: [
      {title: 'Željezo', body: 'Leća, špinat, nemasno meso, slanutak.'},
      {title: 'Magnezij', body: 'Bademi, sjemenke bundeve, tamna čokolada, banana.'},
      {title: 'Omega-3', body: 'Losos, srdele, orasi, laneno sjeme.'},
      {title: 'Bjelančevine', body: 'Jaja, tofu, perad, grčki jogurt, kvinoja.'},
      {title: 'Vlakna i antioksidansi', body: 'Bobičasto voće, avokado, brokula, mrkva.'},
    ],
    limits: [
      {title: 'Višak soli'},
      {title: 'Slatka hrana'},
      {title: 'Ultraprerađena hrana'},
      {title: 'Višak kofeina'},
      {title: 'Alkohol'},
    ],
    limitText: 'Uživaj umjereno kako bi pomogla održati ravnotežu.',
    meals: [
      {tag: 'Doručak', body: 'Zobena kaša, bobičasto voće, bademi i chia'},
      {tag: 'Ručak', body: 'Losos, kvinoja, kuhana brokula i maslinovo ulje'},
      {tag: 'Užina', body: 'Obični jogurt, borovnice i laneno sjeme'},
      {tag: 'Večera', body: 'Juha od leće, pečeno povrće i integralni hljeb'},
    ],
    shareMessage: 'Ishrana i tvoj ciklus: što tvoje tijelo voli — AWA',
  },
  sl: {
    badge: 'MENSTRUALNI CIKEL',
    titleLine1: 'Prehrana in tvoj cikel:',
    titleLine2: 'kaj ima tvoje telo rado',
    metaDuration: '4 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Začetnica',
    metaValidated: 'Preverjena vsebina',
    intro:
      'Tvoja prehrana vpliva na energijo, razpoloženje, hormone in splošno dobro počutje skozi celoten cikel.',
    contentsTitle: 'V tem članku',
    topics: [
      'Prehranske potrebe po fazah',
      'Živila, ki jim je treba dati prednost',
      'Živila, ki jih je treba omejiti',
      'Primeri uravnoteženih obrokov',
    ],
    section1Body:
      'Tvoje telo nima enakih potreb skozi celoten cikel. Prilagoditev tega, kar ješ, lahko naredi resnično razliko.',
    phases: [
      {
        title: 'Menstrualna faza',
        days: '1. do 5. dan',
        body: 'Daj prednost železu, magneziju in vitaminom B.',
      },
      {
        title: 'Folikularna faza',
        days: '6. do 14. dan',
        body: 'Osredotoči se na pusto beljakovinsko hrano in svežo zelenjavo.',
      },
      {
        title: 'Ovulacijska faza',
        days: 'Okoli 14. dne',
        body: 'Izberi antioksidante in omega-3 maščobne kisline.',
      },
      {
        title: 'Lutealna faza',
        days: '15. do 28. dan',
        body: 'Podpri živčni sistem in omeji vnetje.',
      },
    ],
    foods: [
      {title: 'Železo', body: 'Leča, špinača, pusto meso, čičerika.'},
      {title: 'Magnezij', body: 'Mandlji, bučna semena, temna čokolada, banana.'},
      {title: 'Omega-3', body: 'Losos, sardele, orehi, laneno seme.'},
      {title: 'Beljakovine', body: 'Jajca, tofu, perutnina, grški jogurt, kvinoja.'},
      {title: 'Vlaknine in antioksidanti', body: 'Jagodičevje, avokado, brokoli, korenje.'},
    ],
    limits: [
      {title: 'Presežek soli'},
      {title: 'Sladka živila'},
      {title: 'Ultrapredelana živila'},
      {title: 'Presežek kofeina'},
      {title: 'Alkohol'},
    ],
    limitText: 'Uživaj zmerno, da ohraniš ravnovesje.',
    meals: [
      {tag: 'Zajtrk', body: 'Ovsena kaša, jagodičevje, mandlji in chia'},
      {tag: 'Kosilo', body: 'Losos, kvinoja, kuhan brokoli in oljčno olje'},
      {tag: 'Malica', body: 'Navaden jogurt, borovnice in laneno seme'},
      {tag: 'Večerja', body: 'Lečina juha, pečena zelenjava in polnozrnat kruh'},
    ],
    shareMessage: 'Prehrana in tvoj cikel: kaj ima tvoje telo rado — AWA',
  },
  ne: {
    badge: 'मासिक चक्र',
    titleLine1: 'पोषण र तपाईंको चक्र:',
    titleLine2: 'तपाईंको शरीरले के मन पराउँछ',
    metaDuration: '4 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'सुरुवाती',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro:
      'तपाईंको खानपानले चक्रभरि तपाईंको ऊर्जा, मनोदशा, हर्मोन र समग्र भलाइलाई प्रभाव पार्छ।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'चरणअनुसार पोषणका आवश्यकताहरू',
      'प्राथमिकता दिनुपर्ने खानेकुराहरू',
      'सीमित गर्नुपर्ने खानेकुराहरू',
      'सन्तुलित खानाका उदाहरणहरू',
    ],
    section1Body:
      'तपाईंको शरीरलाई चक्रभरि उस्तै आवश्यकता हुँदैन। आफ्नो खानपान मिलाउँदा साँच्चै फरक पर्न सक्छ।',
    phases: [
      {
        title: 'महिनावारी चरण',
        days: 'दिन 1 देखि 5',
        body: 'आइरन, म्याग्नेसियम र बी भिटामिनलाई प्राथमिकता दिनुहोस्।',
      },
      {
        title: 'फोलिकुलर चरण',
        days: 'दिन 6 देखि 14',
        body: 'कम बोसोको प्रोटिन र ताजा तरकारीमा ध्यान दिनुहोस्।',
      },
      {
        title: 'अण्डोत्सर्ग चरण',
        days: 'दिन 14 को वरिपरि',
        body: 'एन्टिअक्सिडेन्ट र ओमेगा-3 छान्नुहोस्।',
      },
      {
        title: 'ल्युटियल चरण',
        days: 'दिन 15 देखि 28',
        body: 'आफ्नो स्नायु प्रणालीलाई साथ दिनुहोस् र सूजन सीमित गर्नुहोस्।',
      },
    ],
    foods: [
      {title: 'आइरन', body: 'मसुरो, पालुङ्गो, कम बोसोको मासु, चना।'},
      {title: 'म्याग्नेसियम', body: 'बदाम, फर्सीका बीउ, कालो चकलेट, केरा।'},
      {title: 'ओमेगा-3', body: 'सामन माछा, सार्डिन, ओखर, अलसी।'},
      {title: 'प्रोटिन', body: 'अण्डा, टोफु, कुखुराको मासु, ग्रीक दही, क्विनोआ।'},
      {title: 'रेशा र एन्टिअक्सिडेन्ट', body: 'बेरी, एभोकाडो, ब्रोकाउली, गाजर।'},
    ],
    limits: [
      {title: 'अत्यधिक नुन'},
      {title: 'गुलिया खानेकुराहरू'},
      {title: 'अति-प्रशोधित खानेकुराहरू'},
      {title: 'अत्यधिक क्याफिन'},
      {title: 'मदिरा'},
    ],
    limitText: 'आफ्नो सन्तुलन कायम राख्न मद्दत गर्न मध्यम मात्रामा आनन्द लिनुहोस्।',
    meals: [
      {tag: 'बिहानको खाना', body: 'दलिया, बेरी, बदाम र चिया बीउ'},
      {tag: 'दिउँसोको खाना', body: 'सामन माछा, क्विनोआ, वाफमा पकाएको ब्रोकाउली र जैतुनको तेल'},
      {tag: 'खाजा', body: 'सादा दही, ब्लुबेरी र अलसी'},
      {tag: 'बेलुकाको खाना', body: 'मसुरोको सुप, भुटेका तरकारी र पूरा अन्नको रोटी'},
    ],
    shareMessage: 'पोषण र तपाईंको चक्र: तपाईंको शरीरले के मन पराउँछ — AWA',
  },
  si: {
    badge: 'ඔසප් චක්‍රය',
    titleLine1: 'පෝෂණය සහ ඔබේ චක්‍රය:',
    titleLine2: 'ඔබේ ශරීරය ප්‍රිය කරන දේ',
    metaDuration: 'කියවීමට මිනිත්තු 4',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro:
      'ඔබේ ආහාර වේල ඔබේ චක්‍රය පුරා ඔබේ ශක්තියට, ඔබේ මනෝභාවයට, ඔබේ හෝමෝනවලට සහ ඔබේ සමස්ත යහපැවැත්මට බලපායි.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'අවධිය අනුව පෝෂණ අවශ්‍යතා',
      'ප්‍රමුඛත්වය දිය යුතු ආහාර',
      'සීමා කළ යුතු ආහාර',
      'සමතුලිත ආහාර වේල් සඳහා උදාහරණ',
    ],
    section1Body:
      'ඔබේ ශරීරයට ඔබේ චක්‍රය පුරා එකම අවශ්‍යතා නොමැත. ඔබ අනුභව කරන දේ සකස් කිරීම සැබෑ වෙනසක් ඇති කළ හැක.',
    phases: [
      {
        title: 'ඔසප් අවධිය',
        days: 'දින 1 සිට 5 දක්වා',
        body: 'යකඩ, මැග්නීසියම් සහ B විටමින් වලට ප්‍රමුඛත්වය දෙන්න.',
      },
      {
        title: 'ෆොලිකුලර් අවධිය',
        days: 'දින 6 සිට 14 දක්වා',
        body: 'මේද රහිත ප්‍රෝටීන් සහ නැවුම් එළවළු කෙරෙහි අවධානය යොමු කරන්න.',
      },
      {
        title: 'ඩිම්බ මෝචන අවධිය',
        days: '14 වන දිනය පමණ',
        body: 'ප්‍රති-ඔක්සිකාරක සහ ඔමේගා-3 තෝරන්න.',
      },
      {
        title: 'ලූටියල් අවධිය',
        days: 'දින 15 සිට 28 දක්වා',
        body: 'ඔබේ ස්නායු පද්ධතියට සහාය වී ආහාරදාහය සීමා කරන්න.',
      },
    ],
    foods: [
      {title: 'යකඩ', body: 'පරිප්පු, නිවිති, මේද රහිත මස්, කඩල.'},
      {title: 'මැග්නීසියම්', body: 'බාදම්, වට්ටක්කා ඇට, තද චොකලට්, කෙසෙල්.'},
      {title: 'ඔමේගා-3', body: 'සැමන්, සාඩින්, වොල්නට්, හණ ඇට.'},
      {title: 'ප්‍රෝටීන්', body: 'බිත්තර, ටෝෆු, කුකුල් මස්, ග්‍රීක් යෝගට්, ක්වීනෝවා.'},
      {title: 'තන්තු සහ ප්‍රති-ඔක්සිකාරක', body: 'බෙරි, අලිගැටපේර, බ්‍රොකොලි, කැරට්.'},
    ],
    limits: [
      {title: 'අධික ලුණු'},
      {title: 'සීනි සහිත ආහාර'},
      {title: 'අති සැකසූ ආහාර'},
      {title: 'අධික කැෆේන්'},
      {title: 'මත්පැන්'},
    ],
    limitText: 'ඔබේ සමතුලිතතාව පවත්වා ගැනීමට උපකාරී වන පරිදි මධ්‍යස්ථව භුක්ති විඳින්න.',
    meals: [
      {tag: 'උදෑසන ආහාරය', body: 'පෝරිජ්, බෙරි, බාදම් සහ චියා'},
      {tag: 'දිවා ආහාරය', body: 'සැමන්, ක්වීනෝවා, ගුලි කළ බ්‍රොකොලි සහ ඔලිව් තෙල්'},
      {tag: 'කෙටි ආහාරය', body: 'සරල යෝගට්, බ්ලූබෙරි සහ හණ ඇට'},
      {tag: 'රාත්‍රී ආහාරය', body: 'පරිප්පු සුප්, තම්බා එළවළු සහ සම්පූර්ණ ධාන්‍ය පාන්'},
    ],
    shareMessage: 'පෝෂණය සහ ඔබේ චක්‍රය: ඔබේ ශරීරය ප්‍රිය කරන දේ — AWA',
  },
  th: {
    badge: 'รอบเดือน',
    titleLine1: 'โภชนาการกับรอบเดือนของคุณ:',
    titleLine2: 'สิ่งที่ร่างกายของคุณชอบ',
    metaDuration: 'อ่าน 4 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro:
      'อาหารของคุณมีอิทธิพลต่อพลังงาน อารมณ์ ฮอร์โมน และความเป็นอยู่ที่ดีโดยรวมของคุณตลอดรอบเดือน',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'ความต้องการทางโภชนาการในแต่ละระยะ',
      'อาหารที่ควรเลือก',
      'อาหารที่ควรจำกัด',
      'ตัวอย่างมื้ออาหารที่สมดุล',
    ],
    section1Body:
      'ร่างกายของคุณมีความต้องการไม่เหมือนกันตลอดรอบเดือน การปรับสิ่งที่คุณกินสร้างความแตกต่างได้จริง',
    phases: [
      {
        title: 'ระยะมีประจำเดือน',
        days: 'วันที่ 1 ถึง 5',
        body: 'เลือกธาตุเหล็ก แมกนีเซียม และวิตามินบี',
      },
      {
        title: 'ระยะฟอลลิคูลาร์',
        days: 'วันที่ 6 ถึง 14',
        body: 'เน้นโปรตีนไร้มันและผักสด',
      },
      {
        title: 'ระยะตกไข่',
        days: 'ราววันที่ 14',
        body: 'เลือกสารต้านอนุมูลอิสระและโอเมก้า-3',
      },
      {
        title: 'ระยะลูเทียล',
        days: 'วันที่ 15 ถึง 28',
        body: 'สนับสนุนระบบประสาทและจำกัดการอักเสบ',
      },
    ],
    foods: [
      {title: 'ธาตุเหล็ก', body: 'ถั่วเลนทิล ผักโขม เนื้อไร้มัน ถั่วชิกพี'},
      {title: 'แมกนีเซียม', body: 'อัลมอนด์ เมล็ดฟักทอง ดาร์กช็อกโกแลต กล้วย'},
      {title: 'โอเมก้า-3', body: 'แซลมอน ซาร์ดีน วอลนัต เมล็ดแฟลกซ์'},
      {title: 'โปรตีน', body: 'ไข่ เต้าหู้ สัตว์ปีก โยเกิร์ตกรีก ควินัว'},
      {title: 'ใยอาหารและสารต้านอนุมูลอิสระ', body: 'เบอร์รี อะโวคาโด บรอกโคลี แครอท'},
    ],
    limits: [
      {title: 'เกลือมากเกินไป'},
      {title: 'อาหารหวาน'},
      {title: 'อาหารแปรรูปสูง'},
      {title: 'คาเฟอีนมากเกินไป'},
      {title: 'แอลกอฮอล์'},
    ],
    limitText: 'รับประทานในปริมาณพอเหมาะเพื่อช่วยรักษาสมดุลของคุณ',
    meals: [
      {tag: 'มื้อเช้า', body: 'โจ๊กโอ๊ต เบอร์รี อัลมอนด์ และเมล็ดเชีย'},
      {tag: 'มื้อกลางวัน', body: 'แซลมอน ควินัว บรอกโคลีนึ่ง และน้ำมันมะกอก'},
      {tag: 'ของว่าง', body: 'โยเกิร์ตรสธรรมชาติ บลูเบอร์รี และเมล็ดแฟลกซ์'},
      {tag: 'มื้อเย็น', body: 'ซุปถั่วเลนทิล ผักอบ และขนมปังโฮลเกรน'},
    ],
    shareMessage: 'โภชนาการกับรอบเดือนของคุณ: สิ่งที่ร่างกายของคุณชอบ — AWA',
  },
  vi: {
    badge: 'CHU KỲ KINH NGUYỆT',
    titleLine1: 'Dinh dưỡng và chu kỳ của bạn:',
    titleLine2: 'điều cơ thể bạn yêu thích',
    metaDuration: '4 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung đã được thẩm định',
    intro:
      'Chế độ ăn của bạn ảnh hưởng đến năng lượng, tâm trạng, nội tiết và sức khỏe tổng thể trong suốt chu kỳ.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Nhu cầu dinh dưỡng theo từng giai đoạn',
      'Thực phẩm nên ưu tiên',
      'Thực phẩm nên hạn chế',
      'Ví dụ về các bữa ăn cân bằng',
    ],
    section1Body:
      'Cơ thể bạn không có cùng nhu cầu trong suốt chu kỳ. Điều chỉnh những gì bạn ăn có thể tạo nên khác biệt thực sự.',
    phases: [
      {
        title: 'Giai đoạn hành kinh',
        days: 'Ngày 1 đến 5',
        body: 'Ưu tiên sắt, magiê và vitamin nhóm B.',
      },
      {
        title: 'Giai đoạn nang trứng',
        days: 'Ngày 6 đến 14',
        body: 'Tập trung vào đạm nạc và rau tươi.',
      },
      {
        title: 'Giai đoạn rụng trứng',
        days: 'Khoảng ngày 14',
        body: 'Chọn chất chống oxy hóa và omega-3.',
      },
      {
        title: 'Giai đoạn hoàng thể',
        days: 'Ngày 15 đến 28',
        body: 'Hỗ trợ hệ thần kinh và hạn chế viêm.',
      },
    ],
    foods: [
      {title: 'Sắt', body: 'Đậu lăng, rau chân vịt, thịt nạc, đậu gà.'},
      {title: 'Magiê', body: 'Hạnh nhân, hạt bí ngô, sô cô la đen, chuối.'},
      {title: 'Omega-3', body: 'Cá hồi, cá mòi, óc chó, hạt lanh.'},
      {title: 'Đạm', body: 'Trứng, đậu phụ, thịt gia cầm, sữa chua Hy Lạp, quinoa.'},
      {title: 'Chất xơ & chất chống oxy hóa', body: 'Quả mọng, bơ, bông cải xanh, cà rốt.'},
    ],
    limits: [
      {title: 'Quá nhiều muối'},
      {title: 'Thực phẩm nhiều đường'},
      {title: 'Thực phẩm chế biến siêu công nghiệp'},
      {title: 'Quá nhiều caffeine'},
      {title: 'Rượu bia'},
    ],
    limitText: 'Thưởng thức ở mức vừa phải để giúp duy trì sự cân bằng của bạn.',
    meals: [
      {tag: 'Bữa sáng', body: 'Cháo yến mạch, quả mọng, hạnh nhân và hạt chia'},
      {tag: 'Bữa trưa', body: 'Cá hồi, quinoa, bông cải xanh hấp và dầu ô liu'},
      {tag: 'Bữa phụ', body: 'Sữa chua không đường, việt quất và hạt lanh'},
      {tag: 'Bữa tối', body: 'Súp đậu lăng, rau củ nướng và bánh mì nguyên cám'},
    ],
    shareMessage: 'Dinh dưỡng và chu kỳ của bạn: điều cơ thể bạn yêu thích — AWA',
  },
  uz: {
    badge: 'HAYZ SIKLI',
    titleLine1: 'Ovqatlanish va siklingiz:',
    titleLine2: 'tanangiz nimani yaxshi koʻradi',
    metaDuration: '4 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Tasdiqlangan kontent',
    intro:
      'Ovqatlanishingiz sikl davomida energiyangizga, kayfiyatingizga, gormonlaringizga va umumiy farovonligingizga taʼsir qiladi.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Bosqichlar boʻyicha oziqaviy ehtiyojlar',
      'Afzal koʻriladigan oziq-ovqatlar',
      'Cheklanadigan oziq-ovqatlar',
      'Muvozanatli ovqat namunalari',
    ],
    section1Body:
      'Tanangizning ehtiyojlari sikl davomida bir xil emas. Ovqatlanishingizni moslashtirish sezilarli farq qilishi mumkin.',
    phases: [
      {
        title: 'Hayz bosqichi',
        days: '1-kundan 5-kungacha',
        body: 'Temir, magniy va B vitaminlarini afzal koʻring.',
      },
      {
        title: 'Follikulyar bosqich',
        days: '6-kundan 14-kungacha',
        body: 'Yogʻsiz oqsil va yangi sabzavotlarga eʼtibor bering.',
      },
      {
        title: 'Ovulyatsiya bosqichi',
        days: 'Taxminan 14-kun',
        body: 'Antioksidantlar va omega-3 ni tanlang.',
      },
      {
        title: 'Lyuteal bosqich',
        days: '15-kundan 28-kungacha',
        body: 'Asab tizimingizni qoʻllab-quvvatlang va yalligʻlanishni cheklang.',
      },
    ],
    foods: [
      {title: 'Temir', body: 'Yasmiq, ismaloq, yogʻsiz goʻsht, nohat.'},
      {title: 'Magniy', body: 'Bodom, qovoq urugʻi, qora shokolad, banan.'},
      {title: 'Omega-3', body: 'Losos, sardina, yongʻoq, zigʻir urugʻi.'},
      {title: 'Oqsil', body: 'Tuxum, tofu, parranda goʻshti, yunon yogurti, kinoa.'},
      {title: 'Tolalar va antioksidantlar', body: 'Rezavorlar, avokado, brokkoli, sabzi.'},
    ],
    limits: [
      {title: 'Ortiqcha tuz'},
      {title: 'Shirin oziq-ovqatlar'},
      {title: 'Ultra qayta ishlangan oziq-ovqatlar'},
      {title: 'Ortiqcha kofein'},
      {title: 'Spirtli ichimliklar'},
    ],
    limitText: 'Muvozanatingizni saqlashga yordam berish uchun meʼyorida isteʼmol qiling.',
    meals: [
      {tag: 'Nonushta', body: 'Bugʻdoy boʻtqasi, rezavorlar, bodom va chia'},
      {tag: 'Tushlik', body: 'Losos, kinoa, bugʻda pishirilgan brokkoli va zaytun moyi'},
      {tag: 'Gazak', body: 'Oddiy yogurt, qora smorodina va zigʻir urugʻi'},
      {tag: 'Kechki ovqat', body: 'Yasmiq shoʻrva, qovurilgan sabzavotlar va butun donli non'},
    ],
    shareMessage: 'Ovqatlanish va siklingiz: tanangiz nimani yaxshi koʻradi — AWA',
  },
  az: {
    badge: 'MENSTRUAL DÖVR',
    titleLine1: 'Qidalanma və dövrünüz:',
    titleLine2: 'bədəninizin sevdikləri',
    metaDuration: '4 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Yoxlanılmış məzmun',
    intro:
      'Qidalanmanız dövr boyu enerjinizə, əhvalınıza, hormonlarınıza və ümumi rifahınıza təsir edir.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Fazalar üzrə qida ehtiyacları',
      'Üstünlük veriləcək qidalar',
      'Məhdudlaşdırılacaq qidalar',
      'Balanslı yemək nümunələri',
    ],
    section1Body:
      'Bədəninizin ehtiyacları dövr boyu eyni deyil. Yediklərinizi tənzimləmək real fərq yarada bilər.',
    phases: [
      {
        title: 'Menstrual faza',
        days: '1-ci gündən 5-ci günə qədər',
        body: 'Dəmirə, maqneziuma və B vitaminlərinə üstünlük verin.',
      },
      {
        title: 'Follikulyar faza',
        days: '6-cı gündən 14-cü günə qədər',
        body: 'Yağsız zülala və təzə tərəvəzə diqqət yetirin.',
      },
      {
        title: 'Ovulyator faza',
        days: '14-cü gün ətrafında',
        body: 'Antioksidantları və omeqa-3-ü seçin.',
      },
      {
        title: 'Lutein fazası',
        days: '15-ci gündən 28-ci günə qədər',
        body: 'Sinir sisteminizi dəstəkləyin və iltihabı məhdudlaşdırın.',
      },
    ],
    foods: [
      {title: 'Dəmir', body: 'Mərcimək, ispanaq, yağsız ət, noxud.'},
      {title: 'Maqnezium', body: 'Badam, qabaq toxumu, tünd şokolad, banan.'},
      {title: 'Omeqa-3', body: 'Qızılbalıq, sardina, qoz, kətan toxumu.'},
      {title: 'Zülal', body: 'Yumurta, tofu, quş əti, yunan qatığı, kinoa.'},
      {title: 'Lif və antioksidantlar', body: 'Giləmeyvə, avokado, brokoli, kök.'},
    ],
    limits: [
      {title: 'Həddindən artıq duz'},
      {title: 'Şirin qidalar'},
      {title: 'Ultra-emal olunmuş qidalar'},
      {title: 'Həddindən artıq kofeyn'},
      {title: 'Alkoqol'},
    ],
    limitText: 'Tarazlığınızı saxlamağa kömək etmək üçün ölçülü şəkildə istehlak edin.',
    meals: [
      {tag: 'Səhər yeməyi', body: 'Yulaf bubırı, giləmeyvə, badam və çia'},
      {tag: 'Nahar', body: 'Qızılbalıq, kinoa, buxarda bişmiş brokoli və zeytun yağı'},
      {tag: 'Ara yemək', body: 'Sadə qatıq, qaragilə və kətan toxumu'},
      {tag: 'Şam yeməyi', body: 'Mərcimək şorbası, qızardılmış tərəvəz və bütövdənli çörək'},
    ],
    shareMessage: 'Qidalanma və dövrünüz: bədəninizin sevdikləri — AWA',
  },
  ka: {
    badge: 'მენსტრუაციული ციკლი',
    titleLine1: 'კვება და თქვენი ციკლი:',
    titleLine2: 'რას აფასებს თქვენი სხეული',
    metaDuration: '4 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'დამწყები',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro:
      'თქვენი კვება გავლენას ახდენს თქვენს ენერგიაზე, ხასიათზე, ჰორმონებსა და საერთო კეთილდღეობაზე მთელი ციკლის განმავლობაში.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'კვებითი საჭიროებები ფაზების მიხედვით',
      'საკვები, რომელსაც უპირატესობა უნდა მიეცეს',
      'საკვები, რომელიც უნდა შეიზღუდოს',
      'დაბალანსებული კვების მაგალითები',
    ],
    section1Body:
      'თქვენს სხეულს ციკლის განმავლობაში ერთნაირი საჭიროებები არ აქვს. იმის მორგებას, რასაც ჭამთ, შეუძლია რეალური განსხვავება შექმნას.',
    phases: [
      {
        title: 'მენსტრუაციული ფაზა',
        days: '1-დან 5 დღემდე',
        body: 'მიანიჭეთ უპირატესობა რკინას, მაგნიუმსა და B ჯგუფის ვიტამინებს.',
      },
      {
        title: 'ფოლიკულური ფაზა',
        days: '6-დან 14 დღემდე',
        body: 'ყურადღება გაამახვილეთ უცხიმო ცილასა და ახალ ბოსტნეულზე.',
      },
      {
        title: 'ოვულაციური ფაზა',
        days: 'დაახლოებით მე-14 დღე',
        body: 'აირჩიეთ ანტიოქსიდანტები და ომეგა-3.',
      },
      {
        title: 'ლუტეალური ფაზა',
        days: '15-დან 28 დღემდე',
        body: 'დაუჭირეთ მხარი თქვენს ნერვულ სისტემას და შეზღუდეთ ანთება.',
      },
    ],
    foods: [
      {title: 'რკინა', body: ' element: ოსპი, ისპანახი, უცხიმო ხორცი, ბარდა.'},
      {title: 'მაგნიუმი', body: 'ნუში, გოგრის თესლი, მუქი შოკოლადი, ბანანი.'},
      {title: 'ომეგა-3', body: 'ორაგული, სარდინი, ნიგოზი, სელის თესლი.'},
      {title: 'ცილა', body: 'კვერცხი, ტოფუ, ფრინველის ხორცი, ბერძნული იოგურტი, კინოა.'},
      {title: 'ბოჭკო და ანტიოქსიდანტები', body: 'კენკრა, ავოკადო, ბროკოლი, სტაფილო.'},
    ],
    limits: [
      {title: 'მარილის სიჭარბე'},
      {title: 'ტკბილი საკვები'},
      {title: 'ულტრამოდამუშავებული საკვები'},
      {title: 'კოფეინის სიჭარბე'},
      {title: 'ალკოჰოლი'},
    ],
    limitText: 'მიირთვით ზომიერად, რომ ბალანსის შენარჩუნებაში დაგეხმაროთ.',
    meals: [
      {tag: 'საუზმე', body: 'ფაფა, კენკრა, ნუში და ჩია'},
      {tag: 'სადილი', body: 'ორაგული, კინოა, ორთქლზე მოხარშული ბროკოლი და ზეითუნის ზეთი'},
      {tag: 'ორსაათიანი', body: 'უშაქრო იოგურტი, მოცვი და სელის თესლი'},
      {tag: 'ვახშამი', body: 'ოსპის სუპი, შემწვარი ბოსტნეული და მთლიანმარცვლოვანი პური'},
    ],
    shareMessage: 'კვება და თქვენი ციკლი: რას აფასებს თქვენი სხეული — AWA',
  },
  hy: {
    badge: 'ԴԱՇՏԱՆԱՅԻՆ ՑԻԿԼ',
    titleLine1: 'Սնունդ և ձեր ցիկլը.',
    titleLine2: 'ինչ է սիրում ձեր մարմինը',
    metaDuration: '4 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Վերանայված բովանդակություն',
    intro:
      'Ձեր սննդակարգն ազդում է ձեր էներգիայի, տրամադրության, հորմոնների և ընդհանուր բարեկեցության վրա ամբողջ ցիկլի ընթացքում:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Սննդային կարիքները՝ ըստ փուլերի',
      'Սնունդ, որին պետք է նախապատվություն տալ',
      'Սնունդ, որը պետք է սահմանափակել',
      'Հավասարակշռված ճաշերի օրինակներ',
    ],
    section1Body:
      'Ձեր մարմինը ամբողջ ցիկլի ընթացքում նույն կարիքները չունի: Ձեր ուտածը հարմարեցնելը կարող է իրական փոփոխություն մտցնել:',
    phases: [
      {
        title: 'Դաշտանային փուլ',
        days: '1-ից 5-րդ օրեր',
        body: 'Նախապատվություն տվեք երկաթին, մագնեզիումին և B խմբի վիտամիններին:',
      },
      {
        title: 'Ֆոլիկուլային փուլ',
        days: '6-ից 14-րդ օրեր',
        body: 'Կենտրոնացեք նիհար սպիտակուցի և թարմ բանջարեղենի վրա:',
      },
      {
        title: 'Ձվազատման փուլ',
        days: 'Մոտ 14-րդ օրը',
        body: 'Ընտրեք հակաօքսիդանտներ և օմեգա-3:',
      },
      {
        title: 'Լյուտեալ փուլ',
        days: '15-ից 28-րդ օրեր',
        body: 'Աջակցեք ձեր նյարդային համակարգին և սահմանափակեք բորբոքումը:',
      },
    ],
    foods: [
      {title: 'Երկաթ', body: 'Ոսպ, սպանախ, նիհար միս, սիսեռ:'},
      {title: 'Մագնեզիում', body: 'Նուշ, դդմի սերմեր, մուգ շոկոլադ, բանան:'},
      {title: 'Օմեգա-3', body: 'Սաղմոն, սարդինա, ընկույզ, կտավատի սերմեր:'},
      {title: 'Սպիտակուց', body: 'Ձու, տոֆու, թռչնամիս, հունական յոգուրտ, քինոա:'},
      {title: 'Մանրաթել և հակաօքսիդանտներ', body: 'Հատապտուղներ, ավոկադո, բրոկոլի, գազար:'},
    ],
    limits: [
      {title: 'Աղի ավելցուկ'},
      {title: 'Քաղցր սնունդ'},
      {title: 'Գերմշակված սնունդ'},
      {title: 'Կոֆեինի ավելցուկ'},
      {title: 'Ալկոհոլ'},
    ],
    limitText: 'Օգտագործեք չափավոր՝ ձեր հավասարակշռությունը պահպանելու համար:',
    meals: [
      {tag: 'Նախաճաշ', body: 'Վարսակի շիլա, հատապտուղներ, նուշ և չիա'},
      {tag: 'Ճաշ', body: 'Սաղմոն, քինոա, գոլորշու վրա եփած բրոկոլի և ձիթապտղի յուղ'},
      {tag: 'Խորտիկ', body: 'Բնական յոգուրտ, հապալաս և կտավատի սերմեր'},
      {tag: 'Ընթրիք', body: 'Ոսպով ապուր, բովված բանջարեղեն և ամբողջահատիկ հաց'},
    ],
    shareMessage: 'Սնունդ և ձեր ցիկլը. ինչ է սիրում ձեր մարմինը — AWA',
  },
  tg: {
    badge: 'ДАВРАИ ҲАЙЗ',
    titleLine1: 'Ғизо ва давраи шумо:',
    titleLine2: 'он чи бадани шумо дӯст медорад',
    metaDuration: '4 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни баррасишуда',
    intro:
      'Ғизои шумо ба қувват, кайфият, гормонҳо ва некӯаҳволии умумии шумо дар давоми давра таъсир мерасонад.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Эҳтиёҷоти ғизоӣ аз рӯи марҳила',
      'Хӯрокҳое, ки афзал донистан лозим аст',
      'Хӯрокҳое, ки маҳдуд кардан лозим аст',
      'Намунаҳои хӯроки мутавозин',
    ],
    section1Body:
      'Бадани шумо дар давоми давра эҳтиёҷоти якхела надорад. Танзими он чи мехӯред, метавонад фарқи воқеӣ ба вуҷуд орад.',
    phases: [
      {
        title: 'Марҳилаи ҳайз',
        days: 'Рӯзҳои 1 то 5',
        body: 'Оҳан, магний ва витаминҳои гурӯҳи B-ро афзал донед.',
      },
      {
        title: 'Марҳилаи фолликулярӣ',
        days: 'Рӯзҳои 6 то 14',
        body: 'Ба сафедаи камчарб ва сабзавоти тоза таваҷҷӯҳ кунед.',
      },
      {
        title: 'Марҳилаи овуляция',
        days: 'Тақрибан рӯзи 14',
        body: 'Антиоксидантҳо ва омега-3-ро интихоб кунед.',
      },
      {
        title: 'Марҳилаи лютеалӣ',
        days: 'Рӯзҳои 15 то 28',
        body: 'Системаи асабии худро дастгирӣ кунед ва илтиҳобро маҳдуд намоед.',
      },
    ],
    foods: [
      {title: 'Оҳан', body: 'Наск, исфаноҷ, гӯшти камчарб, нахӯд.'},
      {title: 'Магний', body: 'Бодом, тухмии каду, шоколади талх, банан.'},
      {title: 'Омега-3', body: 'Лосос, сардина, чормағз, зағир.'},
      {title: 'Сафеда', body: 'Тухм, тофу, парранда, йогурти юнонӣ, киноа.'},
      {title: 'Нахи ғизоӣ ва антиоксидантҳо', body: 'Буттамеваҳо, авокадо, брокколи, сабзӣ.'},
    ],
    limits: [
      {title: 'Намаки зиёд'},
      {title: 'Хӯрокҳои ширин'},
      {title: 'Хӯрокҳои хеле коркардшуда'},
      {title: 'Кофеини зиёд'},
      {title: 'Машруботи спиртӣ'},
    ],
    limitText: 'Бо меъёр лаззат баред, то ба нигоҳ доштани тавозуни худ кумак кунед.',
    meals: [
      {tag: 'Наҳорӣ', body: 'Шӯрбои ҷавдор, буттамеваҳо, бодом ва чиа'},
      {tag: 'Хӯроки нисфирӯзӣ', body: 'Лосос, киноа, брокколии буғӣ ва равғани зайтун'},
      {tag: 'Нонушта', body: 'Йогурти оддӣ, голубика ва зағир'},
      {tag: 'Хӯроки шом', body: 'Шӯрбои наск, сабзавоти бирёншуда ва нони ғалладонаи пурра'},
    ],
    shareMessage: 'Ғизо ва давраи шумо: он чи бадани шумо дӯст медорад — AWA',
  },
  ky: {
    badge: 'ЕТЕК КИРИМ ЦИКЛИ',
    titleLine1: 'Тамактануу жана циклиңиз:',
    titleLine2: 'денеңиз эмнени жакшы көрөт',
    metaDuration: '4 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Баштоочу',
    metaValidated: 'Текшерилген мазмун',
    intro:
      'Тамактанууңуз цикл бою энергияңызга, маанайыңызга, гормондоруңузга жана жалпы жыргалчылыгыңызга таасир этет.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Фаза боюнча тамактануу муктаждыктары',
      'Артыкчылык бере турган азыктар',
      'Чектөө керек болгон азыктар',
      'Тең салмактуу тамактардын мисалдары',
    ],
    section1Body:
      'Денеңизге цикл бою бирдей муктаждык керек эмес. Эмне жегениңизди тууралоо чыныгы айырмачылык жаратышы мүмкүн.',
    phases: [
      {
        title: 'Етек кирим фазасы',
        days: '1-күндөн 5-күнгө чейин',
        body: 'Темирге, магнийге жана В витаминдерине артыкчылык бериңиз.',
      },
      {
        title: 'Фолликулярдык фаза',
        days: '6-күндөн 14-күнгө чейин',
        body: 'Майсыз белокко жана жаңы жашылчаларга басым жасаңыз.',
      },
      {
        title: 'Овуляциялык фаза',
        days: 'Болжол менен 14-күн',
        body: 'Антиоксиданттарды жана омега-3ти тандаңыз.',
      },
      {
        title: 'Лютеиндик фаза',
        days: '15-күндөн 28-күнгө чейин',
        body: 'Нерв системаңызды колдоңуз жана сезгенүүнү чектеңиз.',
      },
    ],
    foods: [
      {title: 'Темир', body: 'Жасмык, шпинат, майсыз эт, нокот.'},
      {title: 'Магний', body: 'Бадам, ашкабак уругу, кара шоколад, банан.'},
      {title: 'Омега-3', body: 'Лосось, сардина, грек жаңгагы, зыгыр уругу.'},
      {title: 'Белок', body: 'Жумуртка, тофу, канаттуу эти, грек йогурту, киноа.'},
      {title: 'Була жана антиоксиданттар', body: 'Мөмө-жемиштер, авокадо, брокколи, сабиз.'},
    ],
    limits: [
      {title: 'Ашыкча туз'},
      {title: 'Таттуу азыктар'},
      {title: 'Ультра-иштетилген азыктар'},
      {title: 'Ашыкча кофеин'},
      {title: 'Алкоголь'},
    ],
    limitText: 'Тең салмактуулугуңузду сактоого жардам берүү үчүн орточо өлчөмдө жеңиз.',
    meals: [
      {tag: 'Эртең мененки тамак', body: 'Сулу ботко, мөмөлөр, бадам жана чиа'},
      {tag: 'Түшкү тамак', body: 'Лосось, киноа, бууда бышырылган брокколи жана зайтун майы'},
      {tag: 'Жеңил тамак', body: 'Таза йогурт, черника жана зыгыр уругу'},
      {tag: 'Кечки тамак', body: 'Жасмык сорпосу, бышырылган жашылчалар жана тулуп унунан нан'},
    ],
    shareMessage: 'Тамактануу жана циклиңиз: денеңиз эмнени жакшы көрөт — AWA',
  },
  tk: {
    badge: 'AÝBAŞY SIKLI',
    titleLine1: 'Iýmitlenmek we sikliňiz:',
    titleLine2: 'bedeniňiz nämäni gowy görýär',
    metaDuration: '4 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Barlanan mazmun',
    intro:
      'Iýmitlenmegiňiz sikl dowamynda energiýaňyza, keýbiňize, gormonlaryňyza we umumy abadançylygyňyza täsir edýär.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Tapgyra görä iýmit zerurlyklary',
      'Artykmaçlyk berilmeli iýmitler',
      'Çäklenmeli iýmitler',
      'Deňagramly tagam mysallary',
    ],
    section1Body:
      'Bedeniňiziň zerurlyklary sikl dowamynda şol bir däl. Iýýän zatlaryňyzy sazlamak hakyky tapawut döredip biler.',
    phases: [
      {
        title: 'Aýbaşy tapgyry',
        days: '1-nji günden 5-nji güne çenli',
        body: 'Demre, magniýe we B witaminlerine artykmaçlyk beriň.',
      },
      {
        title: 'Follikulýar tapgyr',
        days: '6-njy günden 14-nji güne çenli',
        body: 'Ýagsyz belogy we täze gök önümlere üns beriň.',
      },
      {
        title: 'Ovulýasiýa tapgyry',
        days: 'Takmynan 14-nji gün',
        body: 'Antioksidantlary we omega-3-leri saýlaň.',
      },
      {
        title: 'Lýuteal tapgyr',
        days: '15-nji günden 28-nji güne çenli',
        body: 'Nerw ulgamyňyza goldaw beriň we ýangyny çäklediň.',
      },
    ],
    foods: [
      {title: 'Demir', body: 'Mäş, ysmanak, ýagsyz et, nohut.'},
      {title: 'Magniý', body: 'Badam, gawun çigidi, gara şokolad, banan.'},
      {title: 'Omega-3', body: 'Losos, sardin, hozlar, zygyr tohumy.'},
      {title: 'Belok', body: 'Ýumurtga, tofu, guş eti, grek gatygy, kinoa.'},
      {title: 'Süýümlik we antioksidantlar', body: 'Gögem miweler, awokado, brokkoli, käşir.'},
    ],
    limits: [
      {title: 'Aşa köp duz'},
      {title: 'Şekerli iýmitler'},
      {title: 'Ultra-işlenen iýmitler'},
      {title: 'Aşa köp kofein'},
      {title: 'Alkogol'},
    ],
    limitText: 'Deňagramlylygyňyzy saklamaga kömek etmek üçin ölçegde lezzet alyň.',
    meals: [
      {tag: 'Ertirlik', body: 'Ýarma ertirligi, gögem miweler, badam we çia'},
      {tag: 'Günortanlyk', body: 'Losos, kinoa, bugda bişirilen brokkoli we zeýtun ýagy'},
      {tag: 'Aralyk iýmit', body: 'Ýönekeý gatyk, gögem miweler we zygyr tohumy'},
      {tag: 'Agşamlyk', body: 'Mäş çorbasy, gowrulan gök önümler we bütin däneli çörek'},
    ],
    shareMessage: 'Iýmitlenmek we sikliňiz: bedeniňiz nämäni gowy görýär — AWA',
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
