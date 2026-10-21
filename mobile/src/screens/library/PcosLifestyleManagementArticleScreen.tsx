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

const ID = 'pcos-mode-de-vie-prise-en-charge';

const HERO = require('../../assets/images/library/spm-yoga.png');

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('PcosLifestyleManagement', {
  fr: {
    badge: 'SOPK',
    title: 'Mode de vie et\nprise en charge du SOPK',
    metaDuration: '7 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Les options de prise en charge du SOPK, et des habitudes simples pour accompagner ton quotidien.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Un accompagnement construit avec un professionnel',
      'Alimentation équilibrée',
      'Activité physique adaptée',
      'Sommeil et gestion du stress',
      'Bien-être émotionnel',
      'Signaux qui méritent une attention rapide',
      'À retenir',
    ],
    nutritionTips: [
      'Privilégier les fibres (légumes, légumineuses, céréales complètes)',
      'Répartir les repas pour éviter les grandes fringales',
      'Limiter les sucres rapides et les produits très transformés',
      'Pas d’aliment interdit : viser un équilibre global plutôt que des règles strictes',
    ],
    section1Body: 'Il n’existe pas de traitement unique du SOPK : la prise en charge est adaptée à tes symptômes, tes priorités (cycle, fertilité, peau, poids) et ta situation personnelle. Elle peut associer mesures d’hygiène de vie, traitements hormonaux ou autres options selon les besoins.',
    section3Body: 'Une activité physique régulière, même modérée (marche rapide, vélo, renforcement léger), aide à soutenir l’équilibre hormonal et métabolique. L’essentiel est la régularité, plus que l’intensité.',
    section4Body: 'Un sommeil suffisant et des moments de détente réguliers contribuent à limiter l’impact du stress sur l’équilibre hormonal, qui peut lui-même influencer les symptômes du SOPK.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'De petits changements durables sont souvent plus efficaces sur le long terme que des changements radicaux difficiles à maintenir.',
    section5Body: 'Vivre avec le SOPK peut peser sur le moral, notamment à cause de symptômes visibles ou de doutes sur la fertilité. Ces émotions sont légitimes : en parler à un proche ou à un professionnel fait pleinement partie d’une prise en charge complète.',
    alertTitle: 'Consulter si',
    alertText: 'Des douleurs pelviennes intenses ou inhabituelles, des saignements très abondants ou prolongés, une fatigue extrême ou une soif persistante inhabituelle, ou un mal-être émotionnel qui s’installe dans la durée.',
    tip2Title: 'Bon à savoir',
    tip2Text: 'Le SOPK se gère au quotidien avec des habitudes simples et un suivi médical régulier : chaque petit ajustement compte, à ton propre rythme.',
    shareMessage: 'Mode de vie et prise en charge du SOPK — AWA',
  },
  en: {
    badge: 'PCOS',
    title: 'PCOS lifestyle and\nmanagement',
    metaDuration: '7 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'Management options for PCOS, and simple habits to support your everyday life.',
    contentsTitle: 'In this article',
    topics: [
      'Care built together with a professional',
      'Balanced diet',
      'Suitable physical activity',
      'Sleep and stress management',
      'Emotional well-being',
      'Signs that call for prompt attention',
      'Key takeaways',
    ],
    nutritionTips: [
      'Favor fiber (vegetables, legumes, whole grains)',
      'Spread meals out to avoid intense hunger',
      'Limit fast sugars and highly processed foods',
      'No food is off-limits: aim for overall balance rather than strict rules',
    ],
    section1Body: 'There is no single treatment for PCOS: management is tailored to your symptoms, your priorities (cycle, fertility, skin, weight), and your personal situation. It can combine lifestyle measures, hormonal treatments, or other options depending on your needs.',
    section3Body: 'Regular physical activity, even moderate (brisk walking, cycling, light strength training), helps support hormonal and metabolic balance. Consistency matters more than intensity.',
    section4Body: 'Getting enough sleep and taking regular moments to relax help limit the impact of stress on hormonal balance, which can in turn influence PCOS symptoms.',
    tip1Title: 'Good to know',
    tip1Text: 'Small, lasting changes are often more effective in the long run than radical changes that are hard to maintain.',
    section5Body: 'Living with PCOS can weigh on your mood, especially because of visible symptoms or worries about fertility. These feelings are valid: talking to someone close to you or to a professional is a full part of comprehensive care.',
    alertTitle: 'See a doctor if',
    alertText: 'Intense or unusual pelvic pain, very heavy or prolonged bleeding, extreme fatigue or unusual persistent thirst, or emotional distress that settles in over time.',
    tip2Title: 'Good to know',
    tip2Text: 'PCOS is managed day to day with simple habits and regular medical follow-up: every small adjustment counts, at your own pace.',
    shareMessage: 'PCOS lifestyle and management — AWA',
  },
  es: {
    badge: 'SOP',
    title: 'Estilo de vida y\nmanejo del SOP',
    metaDuration: '7 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Las opciones de manejo del SOP, y hábitos sencillos para acompañar tu día a día.',
    contentsTitle: 'En este artículo',
    topics: [
      'Un acompañamiento construido con un profesional',
      'Alimentación equilibrada',
      'Actividad física adaptada',
      'Sueño y manejo del estrés',
      'Bienestar emocional',
      'Señales que merecen atención rápida',
      'Para recordar',
    ],
    nutritionTips: [
      'Priorizar la fibra (verduras, legumbres, cereales integrales)',
      'Repartir las comidas para evitar grandes hambres',
      'Limitar los azúcares rápidos y los productos muy procesados',
      'Ningún alimento prohibido: apuntar a un equilibrio global más que a reglas estrictas',
    ],
    section1Body: 'No existe un tratamiento único para el SOP: el manejo se adapta a tus síntomas, tus prioridades (ciclo, fertilidad, piel, peso) y tu situación personal. Puede combinar medidas de estilo de vida, tratamientos hormonales u otras opciones según las necesidades.',
    section3Body: 'Una actividad física regular, incluso moderada (caminar a paso rápido, bicicleta, fortalecimiento ligero), ayuda a sostener el equilibrio hormonal y metabólico. Lo esencial es la regularidad, más que la intensidad.',
    section4Body: 'Un sueño suficiente y momentos de relajación regulares contribuyen a limitar el impacto del estrés sobre el equilibrio hormonal, que a su vez puede influir en los síntomas del SOP.',
    tip1Title: 'Dato útil',
    tip1Text: 'Pequeños cambios duraderos suelen ser más eficaces a largo plazo que cambios radicales difíciles de mantener.',
    section5Body: 'Vivir con el SOP puede pesar en el ánimo, especialmente por síntomas visibles o dudas sobre la fertilidad. Estas emociones son legítimas: hablar de ello con alguien cercano o con un profesional forma plenamente parte de un manejo completo.',
    alertTitle: 'Consultar si',
    alertText: 'Dolores pélvicos intensos o inusuales, sangrados muy abundantes o prolongados, una fatiga extrema o una sed persistente inusual, o un malestar emocional que se instala en el tiempo.',
    tip2Title: 'Dato útil',
    tip2Text: 'El SOP se maneja día a día con hábitos sencillos y un seguimiento médico regular: cada pequeño ajuste cuenta, a tu propio ritmo.',
    shareMessage: 'Estilo de vida y manejo del SOP — AWA',
  },
  it: {
    badge: 'PCOS',
    title: 'PCOS: stile di vita e\ngestione',
    metaDuration: '7 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Le opzioni di gestione della PCOS e semplici abitudini per sostenere la tua vita quotidiana.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Un percorso di cura costruito insieme a un professionista',
      'Alimentazione equilibrata',
      'Attività fisica adatta',
      'Sonno e gestione dello stress',
      'Benessere emotivo',
      'Segnali che richiedono attenzione tempestiva',
      'Punti chiave',
    ],
    nutritionTips: [
      'Privilegia le fibre (verdure, legumi, cereali integrali)',
      'Distribuisci i pasti nell’arco della giornata per evitare una fame intensa',
      'Limita gli zuccheri semplici e gli alimenti molto processati',
      'Nessun alimento è vietato: punta all’equilibrio generale piuttosto che a regole rigide',
    ],
    section1Body: 'Non esiste un trattamento unico per la PCOS: la gestione viene adattata ai tuoi sintomi, alle tue priorità (ciclo, fertilità, pelle, peso) e alla tua situazione personale. Può combinare misure legate allo stile di vita, terapie ormonali o altre opzioni, a seconda delle tue esigenze.',
    section3Body: 'Un’attività fisica regolare, anche moderata (camminata a passo svelto, bicicletta, esercizi di rinforzo muscolare leggeri), aiuta a sostenere l’equilibrio ormonale e metabolico. La costanza conta più dell’intensità.',
    section4Body: 'Dormire a sufficienza e concederti regolarmente momenti di relax aiuta a limitare l’impatto dello stress sull’equilibrio ormonale, che a sua volta può influenzare i sintomi della PCOS.',
    tip1Title: 'Da sapere',
    tip1Text: 'Piccoli cambiamenti duraturi sono spesso più efficaci a lungo termine rispetto a cambiamenti radicali difficili da mantenere.',
    section5Body: 'Convivere con la PCOS può pesare sull’umore, soprattutto a causa dei sintomi visibili o delle preoccupazioni sulla fertilità. Queste emozioni sono legittime: parlarne con una persona a te vicina o con un professionista fa pienamente parte di una cura completa.',
    alertTitle: 'Rivolgiti al medico se',
    alertText: 'Hai dolore pelvico intenso o insolito, sanguinamento molto abbondante o prolungato, stanchezza estrema o sete insolita e persistente, oppure un disagio emotivo che si protrae nel tempo.',
    tip2Title: 'Da sapere',
    tip2Text: 'La PCOS si gestisce giorno per giorno con abitudini semplici e un follow-up medico regolare: ogni piccolo aggiustamento conta, al tuo ritmo.',
    shareMessage: 'PCOS: stile di vita e gestione — AWA',
  },
  tr: {
    badge: 'PKOS',
    title: 'PKOS’ta yaşam tarzı ve\nyönetim',
    metaDuration: '7 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'PKOS için yönetim seçenekleri ve gündelik hayatını destekleyecek basit alışkanlıklar.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Bir uzmanla birlikte oluşturulan bakım',
      'Dengeli beslenme',
      'Uygun fiziksel aktivite',
      'Uyku ve stres yönetimi',
      'Duygusal iyi oluş',
      'Hemen ilgilenilmesi gereken belirtiler',
      'Akılda tutulacaklar',
    ],
    nutritionTips: [
      'Lifli besinleri tercih et (sebzeler, baklagiller, tam tahıllar)',
      'Yoğun açlık yaşamamak için öğünleri güne yay',
      'Hızlı emilen şekerleri ve çok işlenmiş gıdaları sınırla',
      'Hiçbir besin yasak değildir: katı kurallar yerine genel dengeyi hedefle',
    ],
    section1Body: 'PKOS için tek bir tedavi yoktur: yönetim; belirtilerine, önceliklerine (döngü, doğurganlık, cilt, kilo) ve kişisel durumuna göre şekillenir. İhtiyaçlarına bağlı olarak yaşam tarzı önlemlerini, hormonal tedavileri ya da diğer seçenekleri bir araya getirebilir.',
    section3Body: 'Düzenli fiziksel aktivite, orta düzeyde bile olsa (tempolu yürüyüş, bisiklet, hafif kuvvet antrenmanı), hormonal ve metabolik dengeyi desteklemeye yardımcı olur. Süreklilik, yoğunluktan daha önemlidir.',
    section4Body: 'Yeterli uyumak ve düzenli olarak dinlenme anları yaşamak, stresin hormonal denge üzerindeki etkisini sınırlamaya yardımcı olur; bu da PKOS belirtilerini etkileyebilir.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Küçük ve kalıcı değişiklikler, sürdürülmesi zor köklü değişikliklere kıyasla uzun vadede çoğu zaman daha etkilidir.',
    section5Body: 'PKOS ile yaşamak, özellikle görünür belirtiler ya da doğurganlıkla ilgili kaygılar nedeniyle ruh halin üzerinde ağırlık yapabilir. Bu duygular geçerlidir: yakınındaki biriyle ya da bir uzmanla konuşmak, bütüncül bakımın tam anlamıyla bir parçasıdır.',
    alertTitle: 'Şu durumlarda bir doktora başvur',
    alertText: 'Şiddetli ya da olağandışı pelvik ağrı, çok yoğun veya uzayan kanama, aşırı yorgunluk ya da olağandışı ve süregelen susuzluk hissi, ya da zamanla yerleşen duygusal sıkıntı.',
    tip2Title: 'Bilmekte fayda var',
    tip2Text: 'PKOS, basit alışkanlıklar ve düzenli tıbbi takiple gün be gün yönetilir: her küçük ayar önemlidir, kendi hızında.',
    shareMessage: 'PKOS’ta yaşam tarzı ve yönetim — AWA',
  },
  ru: {
    badge: 'СПКЯ',
    title: 'Образ жизни и\nведение СПКЯ',
    metaDuration: '7 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'Варианты ведения СПКЯ и простые привычки, которые поддержат вас в повседневной жизни.',
    contentsTitle: 'В этой статье',
    topics: [
      'Помощь, выстроенная вместе со специалистом',
      'Сбалансированное питание',
      'Подходящая физическая активность',
      'Сон и управление стрессом',
      'Эмоциональное благополучие',
      'Признаки, требующие скорого внимания',
      'Главное',
    ],
    nutritionTips: [
      'Отдавайте предпочтение клетчатке (овощи, бобовые, цельнозерновые продукты)',
      'Распределяйте приёмы пищи, чтобы не допускать сильного голода',
      'Ограничивайте быстрые сахара и сильно переработанные продукты',
      'Запрещённых продуктов нет: стремитесь к общему балансу, а не к строгим правилам',
    ],
    section1Body: 'Единого лечения СПКЯ не существует: подход подбирается с учётом ваших симптомов, ваших приоритетов (цикл, фертильность, кожа, вес) и вашей личной ситуации. Он может сочетать меры по изменению образа жизни, гормональные препараты или другие варианты в зависимости от ваших потребностей.',
    section3Body: 'Регулярная физическая активность, даже умеренная (быстрая ходьба, велосипед, лёгкие силовые тренировки), помогает поддерживать гормональный и обменный баланс. Регулярность важнее интенсивности.',
    section4Body: 'Достаточный сон и регулярные моменты расслабления помогают ограничить влияние стресса на гормональный баланс, который, в свою очередь, может влиять на симптомы СПКЯ.',
    tip1Title: 'Полезно знать',
    tip1Text: 'Небольшие, но устойчивые изменения зачастую эффективнее в долгосрочной перспективе, чем радикальные перемены, которые трудно поддерживать.',
    section5Body: 'Жизнь с СПКЯ может отражаться на настроении, особенно из-за заметных симптомов или тревог о фертильности. Эти чувства имеют право на существование: разговор с близким человеком или со специалистом — полноценная часть комплексной помощи.',
    alertTitle: 'Обратитесь к врачу, если',
    alertText: 'Сильная или необычная боль в области таза, очень обильное или продолжительное кровотечение, крайняя усталость или необычная стойкая жажда, а также эмоциональное неблагополучие, которое со временем усиливается.',
    tip2Title: 'Полезно знать',
    tip2Text: 'СПКЯ ведут изо дня в день с помощью простых привычек и регулярного медицинского наблюдения: каждая небольшая корректировка важна — в вашем собственном темпе.',
    shareMessage: 'Образ жизни и ведение СПКЯ — AWA',
  },
  de: {
    badge: 'PCOS',
    title: 'PCOS: Lebensstil und\nUmgang im Alltag',
    metaDuration: '7 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Möglichkeiten im Umgang mit PCOS und einfache Gewohnheiten, die deinen Alltag unterstützen.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Gemeinsam mit Fachpersonal aufgebaute Betreuung',
      'Ausgewogene Ernährung',
      'Passende körperliche Aktivität',
      'Schlaf und Stressbewältigung',
      'Emotionales Wohlbefinden',
      'Anzeichen, die zeitnah Aufmerksamkeit brauchen',
      'Das Wichtigste in Kürze',
    ],
    nutritionTips: [
      'Setze auf Ballaststoffe (Gemüse, Hülsenfrüchte, Vollkornprodukte)',
      'Verteile deine Mahlzeiten über den Tag, um starken Hunger zu vermeiden',
      'Schränke schnell verfügbaren Zucker und stark verarbeitete Lebensmittel ein',
      'Kein Lebensmittel ist verboten: Achte auf ein insgesamt ausgewogenes Bild statt auf strenge Regeln',
    ],
    section1Body: 'Es gibt nicht die eine Behandlung für PCOS: Der Umgang damit wird an deine Beschwerden, deine Prioritäten (Zyklus, Fruchtbarkeit, Haut, Gewicht) und deine persönliche Situation angepasst. Er kann Maßnahmen im Lebensstil, hormonelle Behandlungen oder weitere Optionen kombinieren – je nach deinem Bedarf.',
    section3Body: 'Regelmäßige körperliche Aktivität, auch in moderater Form (zügiges Gehen, Radfahren, leichtes Krafttraining), unterstützt das hormonelle und metabolische Gleichgewicht. Regelmäßigkeit zählt mehr als Intensität.',
    section4Body: 'Ausreichend Schlaf und regelmäßige Momente der Entspannung helfen, die Auswirkungen von Stress auf das hormonelle Gleichgewicht zu begrenzen, das wiederum die PCOS-Symptome beeinflussen kann.',
    tip1Title: 'Gut zu wissen',
    tip1Text: 'Kleine, dauerhafte Veränderungen sind auf lange Sicht oft wirksamer als radikale Umstellungen, die sich schwer durchhalten lassen.',
    section5Body: 'Mit PCOS zu leben kann auf die Stimmung drücken, besonders wegen sichtbarer Symptome oder Sorgen um die Fruchtbarkeit. Diese Gefühle sind berechtigt: Mit einer vertrauten Person oder mit Fachpersonal darüber zu sprechen, gehört ganz selbstverständlich zu einer umfassenden Betreuung.',
    alertTitle: 'Such ärztlichen Rat, wenn',
    alertText: 'starke oder ungewöhnliche Unterleibsschmerzen, sehr starke oder anhaltende Blutungen, extreme Erschöpfung oder ungewöhnlich anhaltender Durst auftreten oder eine seelische Belastung, die sich mit der Zeit festsetzt.',
    tip2Title: 'Gut zu wissen',
    tip2Text: 'PCOS wird im Alltag mit einfachen Gewohnheiten und regelmäßiger ärztlicher Begleitung gemanagt: Jede kleine Anpassung zählt – in deinem eigenen Tempo.',
    shareMessage: 'PCOS: Lebensstil und Umgang im Alltag – AWA',
  },
  zh: {
      badge: '多囊卵巢综合征（PCOS）',
      title: 'PCOS 的生活方式\n与管理',
      metaDuration: '阅读约 7 分钟',
      metaType: '指南',
      metaLevel: '入门',
      metaValidated: '已审阅内容',
      intro: 'PCOS 的管理方式，以及支持日常生活的简单习惯。',
      contentsTitle: '本文内容',
      topics: [
        '与专业人员共同制定的诊疗方案',
        '均衡饮食',
        '适合自己的运动',
        '睡眠与压力管理',
        '情绪健康',
        '需要尽快关注的信号',
        '要点回顾',
      ],
      nutritionTips: [
        '多选择富含纤维的食物（蔬菜、豆类、全谷物）',
        '分散进餐，避免过度饥饿',
        '限制快速吸收的糖和高度加工的食品',
        '没有绝对不能吃的食物：追求整体均衡，而不是严格的规则',
      ],
      section1Body: 'PCOS 没有单一的治疗方法：管理方式要根据你的症状、你关注的重点（月经周期、生育力、皮肤、体重）和你个人的情况来制定。视你的需要，可以结合生活方式调整、激素类药物或其他选择。',
      section3Body: '规律的运动，即使强度适中（快走、骑自行车、轻度力量训练），也有助于维持激素和代谢的平衡。坚持比强度更重要。',
      section4Body: '保证充足的睡眠、定期安排放松的时刻，有助于减轻压力对激素平衡的影响，而这反过来又可能影响 PCOS 的症状。',
      tip1Title: '小贴士',
      tip1Text: '从长远来看，细小而持久的改变，往往比难以坚持的剧烈改变更有效。',
      section5Body: '与 PCOS 共处可能会影响你的情绪，尤其是因为看得见的症状或对生育力的担忧。这些感受都是合理的：和身边的人或专业人员聊一聊，本身就是全面照护的一部分。',
      alertTitle: '出现以下情况请就医',
      alertText: '剧烈或异常的盆腔疼痛、出血量很大或持续时间很长、极度疲劳或异常持续的口渴，或是随着时间推移逐渐加重的情绪困扰。',
      tip2Title: '小贴士',
      tip2Text: 'PCOS 要靠简单的日常习惯和规律的医疗随访来管理：每一个小小的调整都有意义，按你自己的节奏来就好。',
      shareMessage: 'PCOS 的生活方式与管理 — AWA',
    },
  id: {
    badge: 'PCOS',
    title: 'Gaya hidup dan\npenanganan PCOS',
    metaDuration: '7 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Pilihan penanganan sindrom ovarium polikistik (PCOS), serta kebiasaan sederhana untuk menunjang keseharianmu.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Perawatan yang disusun bersama tenaga kesehatan',
      'Pola makan seimbang',
      'Aktivitas fisik yang sesuai',
      'Tidur dan pengelolaan stres',
      'Kesejahteraan emosional',
      'Tanda yang perlu segera diperhatikan',
      'Poin penting',
    ],
    nutritionTips: [
      'Utamakan serat (sayuran, kacang-kacangan, biji-bijian utuh)',
      'Atur jarak antarwaktu makan agar tidak terlalu lapar',
      'Batasi gula sederhana dan makanan yang sangat diolah',
      'Tidak ada makanan yang terlarang: cari keseimbangan secara keseluruhan, bukan aturan yang ketat',
    ],
    section1Body: 'Tidak ada satu pengobatan tunggal untuk PCOS: penanganannya disesuaikan dengan gejalamu, prioritasmu (siklus, kesuburan, kulit, berat badan), dan situasi pribadimu. Penanganan bisa menggabungkan perubahan gaya hidup, pengobatan hormonal, atau pilihan lain sesuai kebutuhanmu.',
    section3Body: 'Aktivitas fisik yang teratur, bahkan yang sedang (jalan cepat, bersepeda, latihan kekuatan ringan), membantu menunjang keseimbangan hormonal dan metabolisme. Konsistensi lebih penting daripada intensitas.',
    section4Body: 'Tidur yang cukup dan waktu relaksasi yang teratur membantu membatasi dampak stres pada keseimbangan hormon, yang pada gilirannya bisa memengaruhi gejala PCOS.',
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Perubahan kecil yang bertahan lama sering kali lebih efektif dalam jangka panjang daripada perubahan drastis yang sulit dipertahankan.',
    section5Body: 'Hidup dengan PCOS bisa memengaruhi suasana hatimu, terutama karena gejala yang terlihat atau kekhawatiran soal kesuburan. Perasaan ini wajar: berbicara dengan orang terdekat atau tenaga profesional adalah bagian utuh dari perawatan yang menyeluruh.',
    alertTitle: 'Temui dokter jika',
    alertText: 'Nyeri panggul yang hebat atau tidak biasa, perdarahan yang sangat deras atau berkepanjangan, kelelahan ekstrem atau rasa haus yang menetap dan tidak biasa, atau tekanan emosional yang berlarut-larut.',
    tip2Title: 'Perlu diketahui',
    tip2Text: 'PCOS ditangani sehari-hari dengan kebiasaan sederhana dan pemantauan medis yang teratur: setiap penyesuaian kecil berarti, sesuai kecepatanmu sendiri.',
    shareMessage: 'Gaya hidup dan penanganan PCOS — AWA',
  },
  hi: {
    badge: 'PCOS',
    title: 'PCOS: जीवनशैली और\nप्रबंधन',
    metaDuration: '7 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'शुरुआती',
    metaValidated: 'समीक्षित सामग्री',
    intro: 'पॉलीसिस्टिक ओवरी सिंड्रोम (PCOS) के प्रबंधन के विकल्प, और रोज़मर्रा की ज़िंदगी में सहारा देने वाली आसान आदतें।',
    contentsTitle: 'इस लेख में',
    topics: [
      'विशेषज्ञ के साथ मिलकर बनाई गई देखभाल',
      'संतुलित आहार',
      'उपयुक्त शारीरिक गतिविधि',
      'नींद और तनाव का प्रबंधन',
      'भावनात्मक सेहत',
      'जिन संकेतों पर तुरंत ध्यान देना ज़रूरी है',
      'मुख्य बातें',
    ],
    nutritionTips: [
      'फ़ाइबर को प्राथमिकता दें (सब्ज़ियाँ, दालें, साबुत अनाज)',
      'भोजन को बाँटकर खाएँ ताकि बहुत तेज़ भूख न लगे',
      'तेज़ी से घुलने वाली चीनी और अत्यधिक प्रोसेस्ड खाने को सीमित करें',
      'कोई भी खाना पूरी तरह वर्जित नहीं है: सख़्त नियमों की जगह समग्र संतुलन का लक्ष्य रखें',
    ],
    section1Body: 'PCOS का कोई एक इलाज नहीं है: प्रबंधन आपके लक्षणों, आपकी प्राथमिकताओं (चक्र, प्रजनन क्षमता, त्वचा, वज़न) और आपकी निजी स्थिति के अनुसार तय होता है। इसमें आपकी ज़रूरत के हिसाब से जीवनशैली के उपाय, हार्मोनल उपचार या अन्य विकल्प शामिल हो सकते हैं।',
    section3Body: 'नियमित शारीरिक गतिविधि, भले ही मध्यम हो (तेज़ चलना, साइकिल चलाना, हल्की स्ट्रेंथ ट्रेनिंग), हार्मोनल और मेटाबॉलिक संतुलन को सहारा देती है। तीव्रता से ज़्यादा नियमितता मायने रखती है।',
    section4Body: 'भरपूर नींद लेना और नियमित रूप से आराम के पल निकालना तनाव के हार्मोनल संतुलन पर पड़ने वाले असर को सीमित करने में मदद करता है, जो बदले में PCOS के लक्षणों को प्रभावित कर सकता है।',
    tip1Title: 'जानने लायक बात',
    tip1Text: 'छोटे, टिकाऊ बदलाव अक्सर लंबे समय में उन बड़े बदलावों से ज़्यादा असरदार होते हैं जिन्हें निभाना मुश्किल हो।',
    section5Body: 'PCOS के साथ जीना आपके मूड पर भारी पड़ सकता है, खासकर दिखने वाले लक्षणों या प्रजनन क्षमता की चिंताओं की वजह से। ये भावनाएँ जायज़ हैं: अपने किसी करीबी या किसी विशेषज्ञ से बात करना समग्र देखभाल का एक पूरा हिस्सा है।',
    alertTitle: 'डॉक्टर को दिखाएँ अगर',
    alertText: 'पेल्विक में तेज़ या असामान्य दर्द, बहुत ज़्यादा या लंबे समय तक रक्तस्राव, बहुत ज़्यादा थकान या असामान्य रूप से लगातार प्यास, या भावनात्मक परेशानी जो समय के साथ बनी रहे।',
    tip2Title: 'जानने लायक बात',
    tip2Text: 'PCOS को रोज़ की आसान आदतों और नियमित चिकित्सकीय निगरानी से संभाला जाता है: हर छोटा बदलाव मायने रखता है, आपकी अपनी गति से।',
    shareMessage: 'PCOS: जीवनशैली और प्रबंधन — AWA',
  },
  sq: {
    badge: 'PCOS',
    title: 'Mënyra e jetesës dhe\nmenaxhimi i PCOS',
    metaDuration: '7 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Mundësitë e menaxhimit të PCOS dhe zakone të thjeshta për të mbështetur përditshmërinë tënde.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Kujdes i ndërtuar së bashku me një profesionist',
      'Ushqim i ekuilibruar',
      'Aktivitet fizik i përshtatshëm',
      'Gjumi dhe menaxhimi i stresit',
      'Mirëqenia emocionale',
      'Shenja që kërkojnë vëmendje të shpejtë',
      'Pikat kryesore',
    ],
    nutritionTips: [
      'Zgjidh ushqime me fibra (perime, bishtajore, drithëra integrale)',
      'Shpërndaji vaktet gjatë ditës për të shmangur uri të fortë',
      'Kufizo sheqernat e shpejta dhe ushqimet shumë të përpunuara',
      'Asnjë ushqim nuk është i ndaluar: synoje ekuilibrin e përgjithshëm, jo rregullat e rrepta',
    ],
    section1Body: 'Nuk ka një trajtim të vetëm për PCOS: menaxhimi përshtatet me simptomat e tua, me përparësitë e tua (cikli, pjelloria, lëkura, pesha) dhe me situatën tënde personale. Mund të kombinojë masa të mënyrës së jetesës, trajtime hormonale ose opsione të tjera sipas nevojave të tua.',
    section3Body: 'Aktiviteti fizik i rregullt, edhe i moderuar (ecje me hap të shpejtë, çiklizëm, ushtrime të lehta forcimi), ndihmon në mbështetjen e ekuilibrit hormonal dhe metabolik. Rregullsia ka më shumë rëndësi se intensiteti.',
    section4Body: 'Të flesh sa duhet dhe të marrësh rregullisht çaste çlodhjeje ndihmon të kufizohet ndikimi i stresit te ekuilibri hormonal, i cili nga ana e tij mund të ndikojë në simptomat e PCOS.',
    tip1Title: 'Mirë është ta dish',
    tip1Text: 'Ndryshimet e vogla dhe të qëndrueshme janë shpesh më efektive në afat të gjatë se ndryshimet radikale që është e vështirë t’i mbash.',
    section5Body: 'Të jetosh me PCOS mund të rëndojë gjendjen tënde shpirtërore, sidomos për shkak të simptomave të dukshme ose shqetësimeve për pjellorinë. Këto ndjenja janë të ligjshme: të flasësh me dikë të afërt ose me një profesionist është pjesë e plotë e kujdesit gjithëpërfshirës.',
    alertTitle: 'Shko te mjeku nëse',
    alertText: 'Ke dhimbje të fortë ose të pazakontë në legen, gjakderdhje shumë të bollshme ose të zgjatur, lodhje ekstreme ose etje të pazakontë që vazhdon, ose shqetësim emocional që po vendoset me kalimin e kohës.',
    tip2Title: 'Mirë është ta dish',
    tip2Text: 'PCOS menaxhohet çdo ditë me zakone të thjeshta dhe ndjekje të rregullt mjekësore: çdo rregullim i vogël ka vlerë, me ritmin tënd.',
    shareMessage: 'Mënyra e jetesës dhe menaxhimi i PCOS — AWA',
  },
  ja: {
    badge: 'PCOS',
    title: 'PCOSと生活習慣、\nそのケア',
    metaDuration: '読了7分',
    metaType: 'ガイド',
    metaLevel: '初級',
    metaValidated: '確認済みの内容',
    intro: 'PCOSのケアの選択肢と、毎日を支えるシンプルな習慣を紹介します。',
    contentsTitle: 'この記事の内容',
    topics: [
      '専門家と一緒に築くケア',
      'バランスのよい食事',
      '無理のない運動',
      '睡眠とストレスへの対処',
      '心の健やかさ',
      '早めの対応が必要な兆候',
      'この記事のポイント',
    ],
    nutritionTips: [
      '食物繊維（野菜、豆類、全粒穀物）を意識する',
      '強い空腹を避けるため、食事の間隔を空けすぎない',
      '糖質の多い甘いものや、加工度の高い食品を控える',
      '食べてはいけないものはありません。厳しいルールよりも、全体のバランスを目指しましょう',
    ],
    section1Body: 'PCOSには唯一の治療法というものはなく、症状、優先したいこと（周期、妊娠しやすさ、肌、体重）、そしてご自身の状況に合わせてケアを組み立てます。必要に応じて、生活習慣の工夫、ホルモン療法、そのほかの選択肢を組み合わせることもあります。',
    section3Body: '早歩き、サイクリング、軽い筋力トレーニングなど、中程度の運動でも、定期的に行うことでホルモンや代謝のバランスを支えられます。強さよりも続けることが大切です。',
    section4Body: '十分に眠り、こまめにリラックスする時間をとることは、ストレスがホルモンバランスに与える影響を和らげるのに役立ち、ひいてはPCOSの症状にも影響することがあります。',
    tip1Title: '知っておきたいこと',
    tip1Text: '続けにくい大きな変化よりも、小さくても長く続けられる変化のほうが、長い目で見ると効果的なことが多いものです。',
    section5Body: 'PCOSとともに生きることは、目に見える症状や妊娠しやすさへの不安などから、気持ちの負担になることがあります。そうした気持ちは自然なものです。身近な人や専門家に話すことも、総合的なケアの大切な一部です。',
    alertTitle: '次のような場合は医師の診察を',
    alertText: '強い、またはいつもと違う骨盤の痛み、非常に多い、または長引く出血、極度の疲れやいつもと違う続く喉の渇き、あるいは時間とともに強まる心のつらさ。',
    tip2Title: '知っておきたいこと',
    tip2Text: 'PCOSは、シンプルな習慣と定期的な医療的フォローで日々向き合っていきます。小さな調整の一つひとつが力になります。ご自身のペースで進めましょう。',
    shareMessage: 'PCOSと生活習慣、そのケア — AWA',
  },
  ko: {
    badge: 'PCOS',
    title: 'PCOS 생활 습관과\n관리',
    metaDuration: '읽는 데 7분',
    metaType: '가이드',
    metaLevel: '입문',
    metaValidated: '검토된 콘텐츠',
    intro: 'PCOS 관리 방법과 일상을 돕는 간단한 습관을 알아봐요.',
    contentsTitle: '이 아티클에서 다루는 내용',
    topics: [
      '전문가와 함께 만드는 관리',
      '균형 잡힌 식단',
      '알맞은 신체 활동',
      '수면과 스트레스 관리',
      '정서적 웰빙',
      '빨리 살펴봐야 할 신호',
      '핵심 정리',
    ],
    nutritionTips: [
      '식이섬유를 챙기세요(채소, 콩류, 통곡물).',
      '심한 허기를 피하도록 식사를 나누어 드세요.',
      '당이 빨리 흡수되는 음식과 가공도가 높은 음식은 줄이세요.',
      '먹으면 안 되는 음식은 없어요. 엄격한 규칙보다 전반적인 균형을 목표로 하세요.',
    ],
    section1Body: 'PCOS에 모두에게 맞는 단 하나의 치료법은 없어요. 증상과 우선순위(주기, 임신 가능성, 피부, 체중), 개인 상황에 맞춰 관리해요. 필요에 따라 생활 습관 개선, 호르몬 치료, 또는 다른 방법을 함께 쓸 수 있어요.',
    section3Body: '빠르게 걷기, 자전거 타기, 가벼운 근력 운동처럼 적당한 강도라도 규칙적으로 신체 활동을 하면 호르몬과 대사의 균형을 지키는 데 도움이 돼요. 강도보다 꾸준함이 더 중요해요.',
    section4Body: '충분히 자고 규칙적으로 긴장을 풀어 주면 스트레스가 호르몬 균형에 미치는 영향을 줄일 수 있어요. 호르몬 균형은 다시 PCOS 증상에 영향을 줄 수 있어요.',
    tip1Title: '알아 두면 좋아요',
    tip1Text: '유지하기 어려운 급격한 변화보다 작지만 오래가는 변화가 장기적으로 더 효과적인 경우가 많아요.',
    section5Body: 'PCOS와 함께 살다 보면 눈에 보이는 증상이나 임신 가능성에 대한 걱정 때문에 기분이 무거워질 수 있어요. 그런 감정은 충분히 그럴 수 있는 것이에요. 가까운 사람이나 전문가에게 이야기하는 것도 종합적인 관리의 중요한 부분이에요.',
    alertTitle: '이럴 때는 의사를 만나세요',
    alertText: '심하거나 평소와 다른 골반 통증, 매우 많거나 오래 지속되는 출혈, 극심한 피로나 평소와 다른 지속적인 갈증, 또는 시간이 지나도 이어지는 정서적 힘듦이 있을 때예요.',
    tip2Title: '알아 두면 좋아요',
    tip2Text: 'PCOS는 간단한 습관과 정기적인 진료로 일상에서 관리해 나가요. 작은 조정 하나하나가 모두 의미 있으니, 내 속도에 맞춰 천천히 해 보세요.',
    shareMessage: 'PCOS 생활 습관과 관리 — AWA',
  },
  'pt-PT': {
    badge: 'SOP',
    title: 'SOP: estilo de vida e\nacompanhamento',
    metaDuration: '7 min de leitura',
    metaType: 'Guia',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'As opções de acompanhamento da síndrome do ovário poliquístico (SOP) e hábitos simples para apoiar o seu dia a dia.',
    contentsTitle: 'Neste artigo',
    topics: [
      'Cuidados construídos em conjunto com um profissional',
      'Alimentação equilibrada',
      'Atividade física adequada',
      'Sono e gestão do stress',
      'Bem-estar emocional',
      'Sinais que exigem atenção rápida',
      'Pontos-chave',
    ],
    nutritionTips: [
      'Privilegie as fibras (legumes, leguminosas, cereais integrais)',
      'Distribua as refeições ao longo do dia para evitar fome intensa',
      'Limite os açúcares de absorção rápida e os alimentos muito processados',
      'Nenhum alimento é proibido: procure o equilíbrio global em vez de regras rígidas',
    ],
    section1Body: 'Não existe um tratamento único para a SOP: o acompanhamento é adaptado aos seus sintomas, às suas prioridades (ciclo, fertilidade, pele, peso) e à sua situação pessoal. Pode combinar medidas de estilo de vida, tratamentos hormonais ou outras opções, consoante as suas necessidades.',
    section3Body: 'A atividade física regular, mesmo moderada (caminhada rápida, ciclismo, musculação leve), ajuda a apoiar o equilíbrio hormonal e metabólico. A regularidade conta mais do que a intensidade.',
    section4Body: 'Dormir o suficiente e reservar momentos regulares de relaxamento ajudam a limitar o impacto do stress no equilíbrio hormonal, o que pode, por sua vez, influenciar os sintomas da SOP.',
    tip1Title: 'Bom saber',
    tip1Text: 'Pequenas mudanças duradouras são muitas vezes mais eficazes a longo prazo do que mudanças radicais difíceis de manter.',
    section5Body: 'Viver com SOP pode pesar no humor, em especial devido aos sintomas visíveis ou às preocupações com a fertilidade. Estes sentimentos são legítimos: falar com alguém próximo ou com um profissional faz plenamente parte de um acompanhamento completo.',
    alertTitle: 'Consulte um médico se tiver',
    alertText: 'Dor pélvica intensa ou invulgar, hemorragia muito abundante ou prolongada, cansaço extremo ou sede persistente invulgar, ou sofrimento emocional que se instala com o tempo.',
    tip2Title: 'Bom saber',
    tip2Text: 'A SOP gere-se no dia a dia com hábitos simples e um acompanhamento médico regular: cada pequeno ajuste conta, ao seu ritmo.',
    shareMessage: 'SOP: estilo de vida e acompanhamento — AWA',
  },
  bn: {
    badge: 'পিসিওএস',
    title: 'পিসিওএস: জীবনযাত্রা ও\nব্যবস্থাপনা',
    metaDuration: 'পড়তে 7 মিনিট',
    metaType: 'গাইড',
    metaLevel: 'প্রাথমিক',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'পলিসিস্টিক ওভারি সিনড্রোমের (পিসিওএস) ব্যবস্থাপনার বিকল্প এবং দৈনন্দিন জীবনে সহায়তা করার মতো সহজ অভ্যাস।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'পেশাজীবীর সঙ্গে মিলে গড়ে তোলা যত্ন',
      'সুষম খাবার',
      'উপযুক্ত শারীরিক কার্যকলাপ',
      'ঘুম ও মানসিক চাপ সামলানো',
      'মানসিক সুস্থতা',
      'যেসব লক্ষণে দ্রুত মনোযোগ দরকার',
      'মূল কথা',
    ],
    nutritionTips: [
      'ফাইবারকে অগ্রাধিকার দিন (সবজি, ডাল-শিমজাতীয় খাবার, গোটা শস্য)',
      'তীব্র ক্ষুধা এড়াতে খাবার ভাগ করে খান',
      'দ্রুত শোষিত চিনি ও অতি প্রক্রিয়াজাত খাবার সীমিত করুন',
      'কোনো খাবারই নিষিদ্ধ নয়: কঠোর নিয়মের বদলে সামগ্রিক ভারসাম্যের লক্ষ্য রাখুন',
    ],
    section1Body: 'পিসিওএসের কোনো একক চিকিৎসা নেই: ব্যবস্থাপনা আপনার উপসর্গ, আপনার অগ্রাধিকার (চক্র, প্রজনন ক্ষমতা, ত্বক, ওজন) এবং ব্যক্তিগত অবস্থা অনুযায়ী সাজানো হয়। প্রয়োজন অনুযায়ী এতে জীবনযাত্রার পরিবর্তন, হরমোনাল চিকিৎসা বা অন্যান্য বিকল্প একসঙ্গে থাকতে পারে।',
    section3Body: 'নিয়মিত শারীরিক কার্যকলাপ, মাঝারি হলেও (জোরে হাঁটা, সাইকেল চালানো, হালকা শক্তি প্রশিক্ষণ), হরমোন ও বিপাকের ভারসাম্য বজায় রাখতে সাহায্য করে। তীব্রতার চেয়ে ধারাবাহিকতা বেশি গুরুত্বপূর্ণ।',
    section4Body: 'পর্যাপ্ত ঘুম এবং নিয়মিত বিশ্রামের মুহূর্ত হরমোনের ভারসাম্যের ওপর মানসিক চাপের প্রভাব সীমিত করতে সাহায্য করে, যা পালাক্রমে পিসিওএসের উপসর্গকেও প্রভাবিত করতে পারে।',
    tip1Title: 'জেনে রাখা ভালো',
    tip1Text: 'ধরে রাখা কঠিন এমন আমূল পরিবর্তনের চেয়ে ছোট ও টেকসই পরিবর্তন দীর্ঘমেয়াদে প্রায়ই বেশি কার্যকর।',
    section5Body: 'পিসিওএস নিয়ে বেঁচে থাকা আপনার মেজাজের ওপর চাপ ফেলতে পারে, বিশেষ করে দৃশ্যমান উপসর্গ বা প্রজনন ক্ষমতা নিয়ে দুশ্চিন্তার কারণে। এই অনুভূতিগুলো বৈধ: কাছের কারও সঙ্গে বা একজন পেশাজীবীর সঙ্গে কথা বলা সামগ্রিক যত্নের একটি পূর্ণাঙ্গ অংশ।',
    alertTitle: 'ডাক্তার দেখান যদি',
    alertText: 'তলপেটে তীব্র বা অস্বাভাবিক ব্যথা, খুব বেশি বা দীর্ঘস্থায়ী রক্তক্ষরণ, চরম ক্লান্তি বা অস্বাভাবিক ক্রমাগত পিপাসা, অথবা সময়ের সঙ্গে বেড়ে চলা মানসিক কষ্ট থাকে।',
    tip2Title: 'জেনে রাখা ভালো',
    tip2Text: 'পিসিওএস প্রতিদিন সহজ অভ্যাস এবং নিয়মিত চিকিৎসাগত ফলো-আপের মাধ্যমে সামলানো হয়: প্রতিটি ছোট সমন্বয়ই গুরুত্বপূর্ণ, আপনার নিজের গতিতে।',
    shareMessage: 'পিসিওএস: জীবনযাত্রা ও ব্যবস্থাপনা — AWA',
  },
} as const);

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function PcosLifestyleManagementArticleScreen({
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

        <View style={styles.article}>
          <View style={styles.badge}>
            <AwaText variant="labelSmall" emphasized colorRole="primary">{content.badge}</AwaText>
          </View>

          <AwaText variant="headlineMedium" weight="700" style={styles.title}>
            {content.title}
          </AwaText>

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

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.intro}>
            {content.intro}
          </AwaText>

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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            1. {content.topics[0]}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section1Body}
          </AwaText>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>2. {content.topics[1]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.nutritionTips.map(item => (
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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.topics[2]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section3Body}
          </AwaText>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.topics[3]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section4Body}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.tip1Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.tip1Text}
              </AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>5. {content.topics[4]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section5Body}
          </AwaText>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            6. {content.topics[5]}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="alert-circle-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.alertTitle}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.alertText}
              </AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>7. {content.topics[6]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.tip2Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.tip2Text}
              </AwaText>
            </View>
          </AwaCard>
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={7} scrollRef={scrollRef} />
    </View>
  );
}

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
  contentNumber: {width: 24},
  contentText: {flex: 1},
  h2: {
    marginTop: 24,
  },
  body: {marginTop: 8},
  checkList: {
    marginTop: 12,
    padding: 12,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  checkText: {flex: 1},
  alert: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },
  tip: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipCopy: {flex: 1, marginLeft: 12},
  tipText: {marginTop: 3},
  });
}
