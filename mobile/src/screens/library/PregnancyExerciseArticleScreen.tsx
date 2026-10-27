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
import {EDITORIAL_IMAGE_ALT, resolveEditorialImage, PREGNANCY_EXERCISE_HERO} from '../../i18n/editorialImages';
import {withBrazilianPortuguese} from '../../i18n/ptBrEditorial';

const ID = 'exercise-bouger-enceinte';

const HERO = PREGNANCY_EXERCISE_HERO;

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const RECOMMENDED_ICONS = ['walk', 'swim', 'yoga'] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('PregnancyExercise', {
  fr: {
    badge: 'GROSSESSE • ACTIVITÉ PHYSIQUE',
    title: 'Bouger pendant\nla grossesse',
    metaDuration: '5 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Rester active en douceur, en toute sécurité, à chaque trimestre.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Les activités recommandées',
      'Ce qu’il vaut mieux éviter',
      'Écouter les signaux de ton corps',
      'À noter',
      'À retenir',
    ],
    body1: 'La marche, la natation et le yoga prénatal sont généralement recommandés tout au long de la grossesse, à un rythme adapté à ton ressenti.',
    recommended: ['Marche', 'Natation', 'Yoga prénatal'],
    body2: 'Éviter les sports à impact ou à risque de chute, surtout à partir du deuxième trimestre :',
    toAvoid: [
      'Sports à impact (course intensive, sports de raquette rapides)',
      'Activités avec risque de chute (ski, équitation, vélo en terrain accidenté)',
      'Sports de contact ou de combat',
      'Efforts intenses en altitude ou forte chaleur',
    ],
    listenSigns: [
      'Essoufflement inhabituel ou vertiges',
      'Douleurs, saignements ou contractions pendant l’effort',
      'Fatigue qui ne passe pas après le repos',
    ],
    neutralText: 'Toujours écouter les signaux de ton corps et en parler à ta sage-femme ou ton médecin avant de commencer ou de modifier une activité physique.',
    tipTitle: 'Bon à savoir',
    tipText: 'Une activité douce et régulière est bénéfique pour la plupart des grossesses : l’essentiel est d’adapter l’intensité à chaque étape et à ton propre ressenti.',
    shareMessage: 'Bouger pendant la grossesse — AWA',
  },
  en: {
    badge: 'PREGNANCY • PHYSICAL ACTIVITY',
    title: 'Staying active\nduring pregnancy',
    metaDuration: '5 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'Staying gently active, safely, at every trimester.',
    contentsTitle: 'In this article',
    topics: [
      'Recommended activities',
      'What’s best to avoid',
      'Listening to your body’s signals',
      'Note',
      'Key takeaway',
    ],
    body1: 'Walking, swimming, and prenatal yoga are generally recommended throughout pregnancy, at a pace that matches how you feel.',
    recommended: ['Walking', 'Swimming', 'Prenatal yoga'],
    body2: 'Avoid high-impact sports or activities with a risk of falling, especially from the second trimester onward:',
    toAvoid: [
      'High-impact sports (intense running, fast-paced racquet sports)',
      'Activities with a risk of falling (skiing, horseback riding, cycling on rough terrain)',
      'Contact or combat sports',
      'Intense exertion at altitude or in extreme heat',
    ],
    listenSigns: [
      'Unusual shortness of breath or dizziness',
      'Pain, bleeding, or contractions during exertion',
      'Fatigue that doesn’t go away after resting',
    ],
    neutralText: 'Always listen to your body’s signals and talk to your midwife or doctor before starting or changing a physical activity.',
    tipTitle: 'Good to know',
    tipText: 'Gentle, regular activity is beneficial for most pregnancies: the key is adapting the intensity to each stage and to how you feel.',
    shareMessage: 'Staying active during pregnancy — AWA',
  },
  es: {
    badge: 'EMBARAZO • ACTIVIDAD FÍSICA',
    title: 'Moverte durante\nel embarazo',
    metaDuration: '5 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Mantenerte activa con suavidad, con toda seguridad, en cada trimestre.',
    contentsTitle: 'En este artículo',
    topics: [
      'Las actividades recomendadas',
      'Lo que es mejor evitar',
      'Escuchar las señales de tu cuerpo',
      'Para tener en cuenta',
      'Para recordar',
    ],
    body1: 'Caminar, nadar y el yoga prenatal generalmente se recomiendan durante todo el embarazo, a un ritmo adaptado a cómo te sientas.',
    recommended: ['Caminar', 'Natación', 'Yoga prenatal'],
    body2: 'Evita los deportes de impacto o con riesgo de caída, sobre todo a partir del segundo trimestre:',
    toAvoid: [
      'Deportes de impacto (carrera intensa, deportes de raqueta rápidos)',
      'Actividades con riesgo de caída (esquí, equitación, bicicleta en terreno accidentado)',
      'Deportes de contacto o de combate',
      'Esfuerzos intensos en altitud o con mucho calor',
    ],
    listenSigns: [
      'Falta de aire inusual o mareos',
      'Dolor, sangrado o contracciones durante el esfuerzo',
      'Fatiga que no desaparece después de descansar',
    ],
    neutralText: 'Escucha siempre las señales de tu cuerpo y habla con tu partera o tu médico antes de empezar o modificar una actividad física.',
    tipTitle: 'DATO ÚTIL',
    tipText: 'Una actividad suave y regular es beneficiosa para la mayoría de los embarazos: lo esencial es adaptar la intensidad a cada etapa y a cómo te sientas.',
    shareMessage: 'Moverte durante el embarazo — AWA',
  },
  it: {
    badge: 'GRAVIDANZA • ATTIVITÀ FISICA',
    title: 'Restare attiva\ndurante la gravidanza',
    metaDuration: '5 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Restare attiva con dolcezza e in sicurezza, in ogni trimestre.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Attività consigliate',
      'Cosa è meglio evitare',
      'Ascoltare i segnali del tuo corpo',
      'Nota',
      'Punto chiave',
    ],
    body1: 'Camminare, nuotare e fare yoga prenatale sono in genere attività consigliate per tutta la gravidanza, a un ritmo adatto a come ti senti.',
    recommended: [
      'Camminata',
      'Nuoto',
      'Yoga prenatale',
    ],
    body2: 'Evita gli sport ad alto impatto o le attività con rischio di caduta, soprattutto dal secondo trimestre in poi:',
    toAvoid: [
      'Sport ad alto impatto (corsa intensa, sport con la racchetta a ritmo sostenuto)',
      'Attività con rischio di caduta (sci, equitazione, ciclismo su terreni accidentati)',
      'Sport di contatto o da combattimento',
      'Sforzi intensi in quota o con caldo estremo',
    ],
    listenSigns: [
      'Mancanza di fiato o capogiri insoliti',
      'Dolore, sanguinamento o contrazioni durante lo sforzo',
      'Stanchezza che non passa dopo il riposo',
    ],
    neutralText: 'Ascolta sempre i segnali del tuo corpo e parlane con la tua ostetrica o il tuo medico prima di iniziare o modificare un’attività fisica.',
    tipTitle: 'Da sapere',
    tipText: 'Un’attività dolce e regolare è benefica per la maggior parte delle gravidanze: l’importante è adattare l’intensità a ogni fase e a come ti senti.',
    shareMessage: 'Restare attiva durante la gravidanza — AWA',
  },
  tr: {
    badge: 'GEBELİK • FİZİKSEL AKTİVİTE',
    title: 'Gebelikte\naktif kalmak',
    metaDuration: '5 dk okuma',
    metaType: 'Rehber',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Her trimesterde nazikçe ve güvenle aktif kalmak.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Önerilen aktiviteler',
      'Kaçınmak daha iyi olanlar',
      'Bedeninin sinyallerini dinlemek',
      'Not',
      'Öne çıkan nokta',
    ],
    body1: 'Yürüyüş, yüzme ve gebelik yogası, kendini nasıl hissettiğine uygun bir tempoda, gebelik boyunca genellikle önerilir.',
    recommended: [
      'Yürüyüş',
      'Yüzme',
      'Gebelik yogası',
    ],
    body2: 'Özellikle ikinci trimesterden itibaren yüksek etkili sporlardan veya düşme riski taşıyan aktivitelerden kaçın:',
    toAvoid: [
      'Yüksek etkili sporlar (yoğun koşu, hızlı tempolu raket sporları)',
      'Düşme riski taşıyan aktiviteler (kayak, at binme, engebeli arazide bisiklet)',
      'Temaslı veya dövüş sporları',
      'Yüksek rakımda veya aşırı sıcakta yoğun efor',
    ],
    listenSigns: [
      'Alışılmadık nefes darlığı veya baş dönmesi',
      'Efor sırasında ağrı, kanama veya kasılmalar',
      'Dinlenince geçmeyen yorgunluk',
    ],
    neutralText: 'Bedeninin sinyallerini her zaman dinle ve fiziksel bir aktiviteye başlamadan ya da onu değiştirmeden önce ebenle veya doktorunla konuş.',
    tipTitle: 'Bilmekte fayda var',
    tipText: 'Nazik ve düzenli aktivite çoğu gebelik için yararlıdır: önemli olan yoğunluğu her evreye ve kendini nasıl hissettiğine göre ayarlamaktır.',
    shareMessage: 'Gebelikte aktif kalmak — AWA',
  },
  ru: {
    badge: 'БЕРЕМЕННОСТЬ • ФИЗИЧЕСКАЯ АКТИВНОСТЬ',
    title: 'Оставаться активной\nво время беременности',
    metaDuration: '5 мин чтения',
    metaType: 'Руководство',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'Оставаться мягко активной безопасно на каждом триместре.',
    contentsTitle: 'В этой статье',
    topics: [
      'Рекомендуемые виды активности',
      'Чего лучше избегать',
      'Прислушиваться к сигналам тела',
      'Примечание',
      'Главный вывод',
    ],
    body1: 'Ходьба, плавание и йога для беременных, как правило, рекомендуются на протяжении всей беременности в темпе, соответствующем вашему самочувствию.',
    recommended: ['Ходьба', 'Плавание', 'Йога для беременных'],
    body2: 'Избегайте видов спорта с высокой ударной нагрузкой и занятий с риском падения, особенно начиная со второго триместра:',
    toAvoid: [
      'Виды спорта с высокой ударной нагрузкой (интенсивный бег, быстрые игры с ракеткой)',
      'Занятия с риском падения (лыжи, верховая езда, езда на велосипеде по пересечённой местности)',
      'Контактные виды спорта и единоборства',
      'Интенсивные нагрузки на высоте или в сильную жару',
    ],
    listenSigns: [
      'Необычная одышка или головокружение',
      'Боль, кровянистые выделения или схватки во время нагрузки',
      'Усталость, которая не проходит после отдыха',
    ],
    neutralText: 'Всегда прислушивайтесь к сигналам своего тела и поговорите с акушеркой или врачом, прежде чем начинать или менять физическую активность.',
    tipTitle: 'Полезно знать',
    tipText: 'Мягкая регулярная активность полезна при большинстве беременностей: главное — подбирать интенсивность в соответствии с этапом и вашим самочувствием.',
    shareMessage: 'Оставаться активной во время беременности — AWA',
  },
  de: {
    badge: 'SCHWANGERSCHAFT • KÖRPERLICHE AKTIVITÄT',
    title: 'In der Schwangerschaft\naktiv bleiben',
    metaDuration: '5 Min. Lesezeit',
    metaType: 'Ratgeber',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Sanft und sicher aktiv bleiben, in jedem Trimester.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Empfohlene Aktivitäten',
      'Was du besser vermeidest',
      'Auf die Signale deines Körpers hören',
      'Hinweis',
      'Das Wichtigste',
    ],
    body1: 'Spazierengehen, Schwimmen und Yoga für Schwangere werden während der gesamten Schwangerschaft in der Regel empfohlen, in einem Tempo, das zu deinem Befinden passt.',
    recommended: ['Spazierengehen', 'Schwimmen', 'Schwangerschaftsyoga'],
    body2: 'Vermeide Sportarten mit hoher Belastung oder mit Sturzrisiko, besonders ab dem zweiten Trimester:',
    toAvoid: [
      'Sportarten mit hoher Stoßbelastung (intensives Laufen, schnelle Rückschlagsportarten)',
      'Aktivitäten mit Sturzrisiko (Skifahren, Reiten, Radfahren im unebenen Gelände)',
      'Kontakt- oder Kampfsportarten',
      'Intensive Anstrengung in großer Höhe oder bei extremer Hitze',
    ],
    listenSigns: [
      'Ungewöhnliche Atemnot oder Schwindel',
      'Schmerzen, Blutungen oder Kontraktionen bei Anstrengung',
      'Müdigkeit, die auch nach Ausruhen nicht vergeht',
    ],
    neutralText: 'Höre immer auf die Signale deines Körpers und sprich mit deiner Hebamme oder deiner Ärztin bzw. deinem Arzt, bevor du eine körperliche Aktivität beginnst oder änderst.',
    tipTitle: 'Gut zu wissen',
    tipText: 'Sanfte, regelmäßige Bewegung tut den meisten Schwangerschaften gut: Entscheidend ist, die Intensität an jede Phase und an dein Befinden anzupassen.',
    shareMessage: 'In der Schwangerschaft aktiv bleiben — AWA',
  },
  zh: {
      badge: '怀孕 • 体育活动',
      title: '孕期保持\n适度活动',
      metaDuration: '阅读约 5 分钟',
      metaType: '指南',
      metaLevel: '入门',
      metaValidated: '已审核内容',
      intro: '在孕期的每个阶段，安全、轻柔地保持活动。',
      contentsTitle: '本文内容',
      topics: [
        '推荐的活动',
        '最好避免的活动',
        '倾听身体的信号',
        '注意',
        '核心要点',
      ],
      body1: '散步、游泳和孕妇瑜伽通常适合整个孕期，按照你自己的感觉调整节奏即可。',
      recommended: [
        '散步',
        '游泳',
        '孕妇瑜伽',
      ],
      body2: '请避免高冲击运动或有跌倒风险的活动，尤其是从孕中期开始：',
      toAvoid: [
        '高冲击运动（高强度跑步、节奏快的球拍类运动）',
        '有跌倒风险的活动（滑雪、骑马、在崎岖路面骑行）',
        '接触性或搏击类运动',
        '在高海拔地区或极端高温下的高强度运动',
      ],
      listenSigns: [
        '异常的气短或头晕',
        '运动时出现疼痛、出血或宫缩',
        '休息后仍不缓解的疲倦',
      ],
      neutralText: '请始终倾听身体发出的信号，在开始或调整任何体育活动之前，先咨询你的助产士或医生。',
      tipTitle: '小贴士',
      tipText: '轻柔而规律的活动，对大多数孕期都有益：关键是根据每个阶段和你的感觉来调整强度。',
      shareMessage: '孕期保持适度活动 — AWA',
    },
  id: {
    badge: 'KEHAMILAN • AKTIVITAS FISIK',
    title: 'Tetap aktif\nselama kehamilan',
    metaDuration: '5 menit baca',
    metaType: 'Panduan',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Tetap aktif dengan lembut, dengan aman, di setiap trimester.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Aktivitas yang dianjurkan',
      'Yang sebaiknya dihindari',
      'Mendengarkan sinyal tubuhmu',
      'Catatan',
      'Poin penting',
    ],
    body1: 'Berjalan kaki, berenang, dan yoga prenatal umumnya dianjurkan sepanjang kehamilan, dengan tempo yang sesuai dengan kondisimu.',
    recommended: [
      'Berjalan kaki',
      'Berenang',
      'Yoga prenatal',
    ],
    body2: 'Hindari olahraga berdampak tinggi atau aktivitas yang berisiko jatuh, terutama mulai trimester kedua:',
    toAvoid: [
      'Olahraga berdampak tinggi (lari intens, olahraga raket dengan tempo cepat)',
      'Aktivitas yang berisiko jatuh (ski, berkuda, bersepeda di medan kasar)',
      'Olahraga kontak atau bela diri',
      'Aktivitas berat di ketinggian atau di cuaca yang sangat panas',
    ],
    listenSigns: [
      'Sesak napas atau pusing yang tidak biasa',
      'Nyeri, perdarahan, atau kontraksi saat beraktivitas',
      'Kelelahan yang tidak hilang setelah beristirahat',
    ],
    neutralText: 'Selalu dengarkan sinyal tubuhmu dan bicarakan dengan bidan atau dokter sebelum memulai atau mengubah aktivitas fisik.',
    tipTitle: 'Perlu diketahui',
    tipText: 'Aktivitas yang lembut dan teratur bermanfaat bagi sebagian besar kehamilan: kuncinya adalah menyesuaikan intensitas dengan setiap tahap dan dengan kondisimu.',
    shareMessage: 'Tetap aktif selama kehamilan — AWA',
  },
  hi: {
    badge: 'गर्भावस्था • शारीरिक गतिविधि',
    title: 'गर्भावस्था में\nसक्रिय रहें',
    metaDuration: '5 मिनट में पढ़ें',
    metaType: 'गाइड',
    metaLevel: 'शुरुआती',
    metaValidated: 'समीक्षित सामग्री',
    intro: 'हर तिमाही में सुरक्षित तरीक़े से हल्का-फुल्का सक्रिय रहना।',
    contentsTitle: 'इस लेख में',
    topics: [
      'सुझाई गई गतिविधियाँ',
      'किनसे बचना बेहतर है',
      'अपने शरीर के संकेत सुनना',
      'ध्यान दें',
      'मुख्य बात',
    ],
    body1: 'पैदल चलना, तैराकी और प्रेगनेंसी योगा आमतौर पर पूरी गर्भावस्था में सुझाए जाते हैं, उस रफ़्तार से जो आपकी सेहत के हिसाब से ठीक हो।',
    recommended: [
      'पैदल चलना',
      'तैराकी',
      'प्रेगनेंसी योगा',
    ],
    body2: 'ज़्यादा झटके वाले खेलों या गिरने के जोखिम वाली गतिविधियों से बचें, ख़ासकर दूसरी तिमाही से आगे:',
    toAvoid: [
      'ज़्यादा झटके वाले खेल (तेज़ दौड़, तेज़ रफ़्तार वाले रैकेट खेल)',
      'गिरने के जोखिम वाली गतिविधियाँ (स्कीइंग, घुड़सवारी, ऊबड़-खाबड़ रास्ते पर साइकिल चलाना)',
      'संपर्क वाले या लड़ाई के खेल',
      'ऊँचाई पर या बहुत गर्मी में ज़ोरदार मेहनत',
    ],
    listenSigns: [
      'असामान्य साँस फूलना या चक्कर आना',
      'मेहनत के दौरान दर्द, रक्तस्राव या संकुचन',
      'आराम के बाद भी दूर न होने वाली थकान',
    ],
    neutralText: 'अपने शरीर के संकेतों को हमेशा सुनें और कोई शारीरिक गतिविधि शुरू करने या बदलने से पहले अपनी दाई-नर्स (मिडवाइफ़) या डॉक्टर से बात करें।',
    tipTitle: 'जानना अच्छा है',
    tipText: 'हल्की और नियमित गतिविधि ज़्यादातर गर्भावस्थाओं के लिए फ़ायदेमंद होती है: मुख्य बात है हर चरण और अपनी सेहत के हिसाब से मेहनत की मात्रा तय करना।',
    shareMessage: 'गर्भावस्था में सक्रिय रहें — AWA',
  },
  sq: {
    badge: 'SHTATZËNIA • AKTIVITETI FIZIK',
    title: 'Të mbetesh aktive\ngjatë shtatzënisë',
    metaDuration: '5 min lexim',
    metaType: 'Udhëzues',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e shqyrtuar',
    intro: 'Të qëndrosh e lëvizshme butësisht dhe në siguri, në çdo tremujor.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Aktivitetet e rekomanduara',
      'Çfarë është më mirë të shmangësh',
      'Dëgjimi i sinjaleve të trupit tënd',
      'Shënim',
      'Çfarë të mbash mend',
    ],
    body1: 'Ecja, noti dhe joga për shtatzëni rekomandohen përgjithësisht gjatë gjithë shtatzënisë, me një ritëm që përputhet me mënyrën si ndihesh.',
    recommended: [
      'Ecja',
      'Noti',
      'Joga për shtatzëni',
    ],
    body2: 'Shmang sportet me ndikim të lartë ose aktivitetet me rrezik rënieje, sidomos nga tremujori i dytë e në vazhdim:',
    toAvoid: [
      'Sportet me ndikim të lartë (vrapim intensiv, sporte me raketë me ritëm të shpejtë)',
      'Aktivitetet me rrezik rënieje (ski, kalërim, çiklizëm në terren të vështirë)',
      'Sportet me kontakt ose luftarake',
      'Përpjekjet e forta në lartësi ose në nxehtësi ekstreme',
    ],
    listenSigns: [
      'Gulçim ose marramendje e pazakontë',
      'Dhimbje, gjakderdhje ose kontraksione gjatë përpjekjes fizike',
      'Lodhje që nuk kalon pas pushimit',
    ],
    neutralText: 'Dëgjo gjithmonë sinjalet e trupit tënd dhe flit me maminë ose mjekun para se të nisësh ose të ndryshosh një aktivitet fizik.',
    tipTitle: 'Mirë është të dish',
    tipText: 'Aktiviteti i butë dhe i rregullt është i dobishëm për shumicën e shtatzënive: çelësi është ta përshtatësh intensitetin me çdo fazë dhe me mënyrën si ndihesh.',
    shareMessage: 'Të mbetesh aktive gjatë shtatzënisë — AWA',
  },
  ja: {
    badge: '妊娠 • 運動',
    title: '妊娠中も\n体を動かし続ける',
    metaDuration: '読了時間5分',
    metaType: 'ガイド',
    metaLevel: '初級',
    metaValidated: '確認済みの内容',
    intro: '妊娠のどの時期でも、安全に、無理のない範囲で体を動かしましょう。',
    contentsTitle: 'この記事の内容',
    topics: [
      'おすすめの運動',
      '避けたほうがよいこと',
      '体のサインに耳を傾ける',
      'ご注意',
      '大切なポイント',
    ],
    body1: 'ウォーキング、水泳、マタニティヨガは、体調に合ったペースであれば、妊娠中を通して一般的におすすめされています。',
    recommended: [
      'ウォーキング',
      '水泳',
      'マタニティヨガ',
    ],
    body2: 'とくに妊娠中期以降は、衝撃の強いスポーツや、転倒のおそれがある運動は避けましょう。',
    toAvoid: [
      '衝撃の強いスポーツ（激しいランニング、テンポの速いラケットスポーツ）',
      '転倒のおそれがある運動（スキー、乗馬、悪路でのサイクリング）',
      '接触を伴うスポーツや格闘技',
      '高地や極端な暑さの中での激しい運動',
    ],
    listenSigns: [
      'いつもと違う息切れやめまい',
      '運動中の痛み、出血、お腹の張り（収縮）',
      '休んでも治まらない疲れ',
    ],
    neutralText: '体のサインには常に耳を傾け、運動を始めたり変えたりする前に、助産師または医師に相談してください。',
    tipTitle: '知っておきたいこと',
    tipText: '穏やかで規則的な運動は、ほとんどの妊娠にとって有益です。大切なのは、時期や体調に合わせて強度を調整することです。',
    shareMessage: '妊娠中も体を動かし続ける — AWA',
  },
  ko: {
    badge: '임신 • 신체 활동',
    title: '임신 중에도\n활동적으로 지내기',
    metaDuration: '5분 읽기',
    metaType: '가이드',
    metaLevel: '초급',
    metaValidated: '검토된 콘텐츠',
    intro: '임신 초기, 중기, 후기 모두 안전하게 가볍게 몸을 움직여요.',
    contentsTitle: '이 아티클의 내용',
    topics: [
      '권장되는 활동',
      '피하는 것이 좋은 활동',
      '몸의 신호에 귀 기울이기',
      '참고',
      '핵심 정리',
    ],
    body1: '걷기, 수영, 임산부 요가는 컨디션에 맞는 속도로 하면 임신 기간 내내 일반적으로 권장돼요.',
    recommended: [
      '걷기',
      '수영',
      '임산부 요가',
    ],
    body2: '충격이 큰 운동이나 넘어질 위험이 있는 활동은 피하세요. 특히 임신 중기부터는 더 주의해야 해요.',
    toAvoid: [
      '충격이 큰 운동(강도 높은 달리기, 빠르게 진행되는 라켓 스포츠)',
      '넘어질 위험이 있는 활동(스키, 승마, 험한 길에서 자전거 타기)',
      '접촉 또는 격투 스포츠',
      '고지대나 극심한 더위에서의 강한 운동',
    ],
    listenSigns: [
      '평소와 다른 숨 가쁨이나 어지러움',
      '운동 중 통증, 출혈 또는 수축',
      '쉬어도 가시지 않는 피로',
    ],
    neutralText: '항상 몸의 신호에 귀 기울이고, 신체 활동을 시작하거나 바꾸기 전에 조산사나 의사와 상담하세요.',
    tipTitle: '알아 두세요',
    tipText: '가볍고 규칙적인 활동은 대부분의 임신에 도움이 돼요. 중요한 것은 시기와 컨디션에 맞게 강도를 조절하는 거예요.',
    shareMessage: '임신 중에도 활동적으로 지내기 — AWA',
  },
  'pt-PT': {
    badge: 'GRAVIDEZ • ATIVIDADE FÍSICA',
    title: 'Manter-se ativa\ndurante a gravidez',
    metaDuration: 'Leitura de 5 min',
    metaType: 'Guia',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'Manter uma atividade suave, em segurança, em cada trimestre.',
    contentsTitle: 'Neste artigo',
    topics: [
      'Atividades recomendadas',
      'O que é melhor evitar',
      'Escutar os sinais do seu corpo',
      'Nota',
      'A reter',
    ],
    body1: 'A caminhada, a natação e o ioga para grávidas são geralmente recomendados ao longo de toda a gravidez, a um ritmo adequado ao que sente.',
    recommended: [
      'Caminhada',
      'Natação',
      'Ioga para grávidas',
    ],
    body2: 'Evite desportos de alto impacto ou atividades com risco de queda, sobretudo a partir do segundo trimestre:',
    toAvoid: [
      'Desportos de alto impacto (corrida intensa, desportos de raquete a ritmo rápido)',
      'Atividades com risco de queda (esqui, equitação, ciclismo em terreno acidentado)',
      'Desportos de contacto ou de combate',
      'Esforço intenso em altitude ou com calor extremo',
    ],
    listenSigns: [
      'Falta de ar ou tonturas fora do habitual',
      'Dor, perdas de sangue ou contrações durante o esforço',
      'Cansaço que não passa com o repouso',
    ],
    neutralText: 'Escute sempre os sinais do seu corpo e fale com a sua parteira ou com o seu médico antes de iniciar ou alterar uma atividade física.',
    tipTitle: 'Bom saber',
    tipText: 'Uma atividade suave e regular é benéfica para a maioria das gravidezes: o essencial é adaptar a intensidade a cada fase e ao que sente.',
    shareMessage: 'Manter-se ativa durante a gravidez — AWA',
  },
  bn: {
    badge: 'গর্ভাবস্থা • শারীরিক কার্যকলাপ',
    title: 'গর্ভাবস্থায়\nসক্রিয় থাকা',
    metaDuration: '5 মিনিটের পাঠ',
    metaType: 'গাইড',
    metaLevel: 'নতুনদের জন্য',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'প্রতিটি ত্রৈমাসিকে নিরাপদে, মৃদুভাবে সক্রিয় থাকা।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'প্রস্তাবিত কার্যকলাপ',
      'যা এড়িয়ে চলাই ভালো',
      'শরীরের সংকেত শোনা',
      'লক্ষণীয়',
      'মূল কথা',
    ],
    body1: 'গর্ভাবস্থার পুরো সময়জুড়ে হাঁটা, সাঁতার এবং প্রসবপূর্ব যোগব্যায়াম সাধারণত সুপারিশ করা হয়, আপনি যেমন বোধ করেন সেই গতিতে।',
    recommended: [
      'হাঁটা',
      'সাঁতার',
      'প্রসবপূর্ব যোগব্যায়াম',
    ],
    body2: 'বিশেষ করে দ্বিতীয় ত্রৈমাসিক থেকে শুরু করে জোরালো ঝাঁকুনি বা আঘাতযুক্ত খেলাধুলা অথবা পড়ে যাওয়ার ঝুঁকিযুক্ত কার্যকলাপ এড়িয়ে চলুন:',
    toAvoid: [
      'উচ্চ আঘাতের ক্রীড়া (তীব্র দৌড়, দ্রুত গতির র্যাকেট খেলা)',
      'পড়ে যাওয়ার ঝুঁকিযুক্ত কার্যকলাপ (স্কিইং, ঘোড়ায় চড়া, এবড়োখেবড়ো পথে সাইকেল চালানো)',
      'সংস্পর্শভিত্তিক বা মারামারির ক্রীড়া',
      'উচ্চতায় বা প্রচণ্ড গরমে তীব্র পরিশ্রম',
    ],
    listenSigns: [
      'অস্বাভাবিক শ্বাসকষ্ট বা মাথা ঘোরা',
      'পরিশ্রমের সময় ব্যথা, রক্তপাত বা সংকোচন',
      'বিশ্রামের পরও না কমা ক্লান্তি',
    ],
    neutralText: 'সবসময় শরীরের সংকেত শুনুন, এবং কোনো শারীরিক কার্যকলাপ শুরু বা পরিবর্তন করার আগে আপনার ধাত্রী বা ডাক্তারের সঙ্গে কথা বলুন।',
    tipTitle: 'জেনে রাখা ভালো',
    tipText: 'মৃদু ও নিয়মিত কার্যকলাপ বেশিরভাগ গর্ভাবস্থার জন্য উপকারী: মূল কথা হলো প্রতিটি পর্যায় এবং আপনার অনুভূতি অনুযায়ী তীব্রতা মানিয়ে নেওয়া।',
    shareMessage: 'গর্ভাবস্থায় সক্রিয় থাকা — AWA',
  },
  da: {
    badge: 'GRAVIDITET • FYSISK AKTIVITET',
    title: 'At holde sig aktiv\nunder graviditeten',
    metaDuration: '5 min. læsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemset indhold',
    intro: 'At holde sig skånsomt aktiv, sikkert, i hvert trimester.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Anbefalede aktiviteter',
      'Hvad du bør undgå',
      'At lytte til din krops signaler',
      'Bemærk',
      'Vigtigste pointer',
    ],
    body1: 'Gåture, svømning og prænatal yoga anbefales generelt i hele graviditeten i et tempo, der passer til, hvordan du har det.',
    recommended: ['Gåture', 'Svømning', 'Prænatal yoga'],
    body2: 'Undgå sportsgrene med høj belastning eller risiko for fald, særligt fra det andet trimester:',
    toAvoid: [
      'Sportsgrene med høj belastning (intensiv løb, hurtige racketsportsgrene)',
      'Aktiviteter med risiko for fald (ski, ridning, cykling på ujævnt terræn)',
      'Kontakt- eller kampsport',
      'Intens anstrengelse i stor højde eller ekstrem varme',
    ],
    listenSigns: [
      'Usædvanlig åndenød eller svimmelhed',
      'Smerter, blødning eller veer under anstrengelse',
      'Træthed der ikke forsvinder efter hvile',
    ],
    neutralText: 'Lyt altid til din krops signaler, og tal med din jordemoder eller læge, inden du starter eller ændrer en fysisk aktivitet.',
    tipTitle: 'Godt at vide',
    tipText: 'Skånsom, regelmæssig aktivitet er gavnlig for de fleste graviditeter: nøglen er at tilpasse intensiteten til hvert trin og til, hvordan du har det.',
    shareMessage: 'At holde sig aktiv under graviditeten — AWA',
  },
  sv: {
    badge: 'GRAVIDITET • FYSISK AKTIVITET',
    title: 'At holde sig aktiv\nunder graviditeten',
    metaDuration: '5 min. läsning',
    metaType: 'Guide',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemset indhold',
    intro: 'At holde sig skånsomt aktiv, sikkert, i hvert trimester.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Anbefalede aktiviteter',
      'Hvad du bör undgå',
      'At lytte till din krops signaler',
      'Bemärk',
      'Vigtigste pointer',
    ],
    body1: 'Gåture, svömning och pränatal yoga anbefales generelt i hele graviditeten i et tempo, der passer till, hvordan du har det.',
    recommended: ['Gåture', 'Svömning', 'Pränatal yoga'],
    body2: 'Undgå sportsgrene med höj belastning eller risiko for fald, särligt fran det andet trimester:',
    toAvoid: [
      'Sportsgrene med höj belastning (intensiv löb, hurtige racketsportsgrene)',
      'Aktiviteter med risiko for fald (ski, ridning, cykling på ujävnt terrän)',
      'Kontakt- eller kampsport',
      'Intens anstrengelse i stor höjde eller ekstrem varme',
    ],
    listenSigns: [
      'Usädvanlig åndenöd eller svimmelhed',
      'Smerter, blödning eller veer under anstrengelse',
      'Träthed der inte forsvinder efter hvile',
    ],
    neutralText: 'Lyt alltid till din krops signaler, och tal med din jordemoder eller läge, inden du starter eller ändrer en fysisk aktivitet.',
    tipTitle: 'Godt at vide',
    tipText: 'Skånsom, regelmässig aktivitet ar gavnlig for de fleste graviditeter: nöglen ar at tilpasse intensiteten till hvert trin och till, hvordan du har det.',
    shareMessage: 'At holde sig aktiv under graviditeten — AWA',
  },
  nb: {
    badge: 'SVANGERSKAP • FYSISK AKTIVITET',
    title: 'Være aktiv\nunder svangerskapet',
    metaDuration: '5 min lesing',
    metaType: 'Veiledning',
    metaLevel: 'Nybegynner',
    metaValidated: 'Gjennomgått innhold',
    intro: 'Å være mildt aktiv, trygt, i hvert trimester.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Anbefalte aktiviteter',
      'Det som er best å unngå',
      'Lytte til kroppens signaler',
      'Merk',
      'Det viktigste å huske',
    ],
    body1: 'Gåing, svømming og gravidyoga anbefales vanligvis gjennom hele svangerskapet, i et tempo som passer hvordan du føler deg.',
    recommended: ['Gåing', 'Svømming', 'Gravidyoga'],
    body2: 'Unngå idrett med høy belastning eller aktiviteter med fallrisiko, særlig fra andre trimester:',
    toAvoid: [
      'Idrett med høy belastning (intens løping, ballspill med racket i høyt tempo)',
      'Aktiviteter med fallrisiko (ski, ridning, sykling i ulendt terreng)',
      'Kontakt- eller kampsport',
      'Intens anstrengelse i høyden eller i ekstrem varme',
    ],
    listenSigns: [
      'Uvanlig kortpustethet eller svimmelhet',
      'Smerte, blødning eller sammentrekninger under anstrengelse',
      'Tretthet som ikke går over etter hvile',
    ],
    neutralText: 'Lytt alltid til kroppens signaler og snakk med jordmoren eller legen din før du begynner med eller endrer en fysisk aktivitet.',
    tipTitle: 'Godt å vite',
    tipText: 'Mild, regelmessig aktivitet er gunstig for de fleste svangerskap: det viktigste er å tilpasse intensiteten til hvert trinn og til hvordan du føler deg.',
    shareMessage: 'Være aktiv under svangerskapet – AWA',
  },
  pl: {
    badge: 'CIĄŻA • AKTYWNOŚĆ FIZYCZNA',
    title: 'Aktywność\nw czasie ciąży',
    metaDuration: '5 min czytania',
    metaType: 'Poradnik',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Delikatna aktywność, bezpiecznie, w każdym trymestrze.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Zalecane aktywności',
      'Czego lepiej unikać',
      'Słuchanie sygnałów ciała',
      'Uwaga',
      'Najważniejsze do zapamiętania',
    ],
    body1: 'Spacery, pływanie i joga dla kobiet w ciąży są na ogół zalecane przez całą ciążę, w tempie dostosowanym do Twojego samopoczucia.',
    recommended: ['Spacery', 'Pływanie', 'Joga dla kobiet w ciąży'],
    body2: 'Unikaj sportów o dużym obciążeniu i aktywności z ryzykiem upadku, zwłaszcza od drugiego trymestru:',
    toAvoid: [
      'Sporty o dużym obciążeniu (intensywne bieganie, szybkie gry rakietowe)',
      'Aktywności z ryzykiem upadku (narciarstwo, jazda konna, jazda na rowerze po nierównym terenie)',
      'Sporty kontaktowe lub walki',
      'Intensywny wysiłek na wysokości lub w ekstremalnym upale',
    ],
    listenSigns: [
      'Nietypowa duszność lub zawroty głowy',
      'Ból, krwawienie lub skurcze podczas wysiłku',
      'Zmęczenie, które nie mija po odpoczynku',
    ],
    neutralText: 'Zawsze słuchaj sygnałów swojego ciała i porozmawiaj z położną lub lekarzem, zanim zaczniesz lub zmienisz aktywność fizyczną.',
    tipTitle: 'Warto wiedzieć',
    tipText: 'Delikatna, regularna aktywność jest korzystna w większości ciąż: kluczem jest dostosowanie intensywności do etapu i do samopoczucia.',
    shareMessage: 'Aktywność w czasie ciąży — AWA',
  },
  uk: {
    badge: 'ВАГІТНІСТЬ • ФІЗИЧНА АКТИВНІСТЬ',
    title: 'Активність\nпід час вагітності',
    metaDuration: '5 хв читання',
    metaType: 'Посібник',
    metaLevel: 'Початковий',
    metaValidated: 'Перевірений вміст',
    intro: 'М’яка активність, безпечно, у кожному триместрі.',
    contentsTitle: 'У цій статті',
    topics: [
      'Рекомендовані види активності',
      'Чого краще уникати',
      'Прислухайтеся до сигналів свого тіла',
      'Зверніть увагу',
      'Головне',
    ],
    body1: 'Ходьба, плавання та йога для вагітних зазвичай рекомендовані протягом усієї вагітності, у темпі, що відповідає вашому самопочуттю.',
    recommended: ['Ходьба', 'Плавання', 'Йога для вагітних'],
    body2: 'Уникайте видів спорту з високим навантаженням або активностей із ризиком падіння, особливо з другого триместру:',
    toAvoid: [
      'Види спорту з високим навантаженням (інтенсивний біг, швидкі ігри з ракеткою)',
      'Активності з ризиком падіння (лижі, верхова їзда, їзда на велосипеді по нерівній місцевості)',
      'Контактні види спорту та єдиноборства',
      'Інтенсивні навантаження на висоті або в надзвичайну спеку',
    ],
    listenSigns: [
      'Незвична задишка або запаморочення',
      'Біль, кровотеча або перейми під час навантаження',
      'Втома, що не минає після відпочинку',
    ],
    neutralText: 'Завжди прислухайтеся до сигналів свого тіла й поговоріть із акушеркою чи лікарем, перш ніж розпочинати або змінювати фізичну активність.',
    tipTitle: 'Варто знати',
    tipText: 'М’яка, регулярна активність корисна при більшості вагітностей: головне — підібрати інтенсивність до етапу та самопочуття.',
    shareMessage: 'Активність під час вагітності — AWA',
  },
  cs: {
    badge: 'TĚHOTENSTVÍ • FYZICKÁ AKTIVITA',
    title: 'Aktivní\nběhem těhotenství',
    metaDuration: '5 min čtení',
    metaType: 'Průvodce',
    metaLevel: 'Začátečník',
    metaValidated: 'Ověřený obsah',
    intro: 'Zůstat jemně aktivní, bezpečně, v každém trimestru.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Doporučené aktivity',
      'Čemu se nejlépe vyhnout',
      'Naslouchání signálům svého těla',
      'Poznámka',
      'Hlavní poznatek',
    ],
    body1: 'Chůze, plavání a prenatální jóga se obecně doporučují během celého těhotenství, tempem odpovídajícím tomu, jak se cítíte.',
    recommended: ['Chůze', 'Plavání', 'Prenatální jóga'],
    body2: 'Vyhýbejte se sportům s vysokým nárazem nebo aktivitám s rizikem pádu, zejména od druhého trimestru:',
    toAvoid: [
      'Sporty s vysokým nárazem (intenzivní běh, rychlé raketové sporty)',
      'Aktivity s rizikem pádu (lyžování, jízda na koni, jízda na kole v nerovném terénu)',
      'Kontaktní nebo bojové sporty',
      'Intenzivní námaha ve vysoké nadmořské výšce nebo v extrémním horku',
    ],
    listenSigns: [
      'Neobvyklá dušnost nebo závrať',
      'Bolest, krvácení nebo stahy během námahy',
      'Únava, která po odpočinku nepřejde',
    ],
    neutralText: 'Vždy naslouchejte signálům svého těla a před zahájením nebo změnou fyzické aktivity si promluvte se svou porodní asistentkou nebo lékařem.',
    tipTitle: 'Stojí za to vědět',
    tipText: 'Jemná, pravidelná aktivita je prospěšná pro většinu těhotenství: klíčové je přizpůsobit intenzitu každé fázi a tomu, jak se cítíte.',
    shareMessage: 'Aktivní během těhotenství — AWA',
  },
  sk: {
    badge: 'TEHOTENSTVO • FYZICKÁ AKTIVITA',
    title: 'Ostať aktívna\npočas tehotenstva',
    metaDuration: '5 min čítania',
    metaType: 'Sprievodca',
    metaLevel: 'Začiatočník',
    metaValidated: 'Overený obsah',
    intro: 'Ostať jemne aktívna, bezpečne, v každom trimestri.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Odporúčané aktivity',
      'Čomu sa je najlepšie vyhnúť',
      'Počúvanie signálov tela',
      'Poznámka',
      'Hlavný bod',
    ],
    body1: 'Chôdza, plávanie a prenatálna joga sa vo všeobecnosti odporúčajú počas celého tehotenstva, tempom zodpovedajúcim tomu, ako sa cítite.',
    recommended: ['Chôdza', 'Plávanie', 'Prenatálna joga'],
    body2: 'Vyhnite sa športom s veľkým nárazom alebo aktivitám s rizikom pádu, najmä od druhého trimestra:',
    toAvoid: [
      'Športy s veľkým nárazom (intenzívny beh, rýchle raketové športy)',
      'Aktivity s rizikom pádu (lyžovanie, jazdenie na koni, bicyklovanie v náročnom teréne)',
      'Kontaktné alebo bojové športy',
      'Intenzívna námaha vo vysokej nadmorskej výške alebo v extrémnom teple',
    ],
    listenSigns: [
      'Nezvyčajná dýchavičnosť alebo závraty',
      'Bolesť, krvácanie alebo sťahy počas námahy',
      'Únava, ktorá po odpočinku neustupuje',
    ],
    neutralText: 'Vždy počúvajte signály svojho tela a pred začatím alebo zmenou fyzickej aktivity sa poraďte s pôrodnou asistentkou alebo lekárom.',
    tipTitle: 'Stojí za to vedieť',
    tipText: 'Jemná, pravidelná aktivita je prospešná pre väčšinu tehotenstiev: kľúčom je prispôsobiť intenzitu každej etape a tomu, ako sa cítite.',
    shareMessage: 'Ostať aktívna počas tehotenstva — AWA',
  },
  hu: {
    badge: 'TERHESSÉG • TESTMOZGÁS',
    title: 'Aktívnak maradni\na terhesség alatt',
    metaDuration: '5 perc olvasás',
    metaType: 'Útmutató',
    metaLevel: 'Kezdő',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'Kíméletesen aktívnak maradni, biztonságosan, minden trimeszterben.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Ajánlott tevékenységek',
      'Amit érdemes elkerülni',
      'A tested jelzéseinek figyelése',
      'Megjegyzés',
      'Legfontosabb tudnivaló',
    ],
    body1: 'A gyaloglás, az úszás és a várandós jóga általában a terhesség egész ideje alatt ajánlott, a közérzetednek megfelelő tempóban.',
    recommended: ['Gyaloglás', 'Úszás', 'Várandós jóga'],
    body2: 'Kerüld a nagy ütéssel járó sportokat vagy az eséssel járó kockázatot hordozó tevékenységeket, különösen a második trimeszter után:',
    toAvoid: [
      'Nagy ütéssel járó sportok (intenzív futás, gyors tempójú ütős sportok)',
      'Eséssel járó kockázatú tevékenységek (síelés, lovaglás, kerékpározás nehéz terepen)',
      'Kontakt- vagy küzdősportok',
      'Intenzív megterhelés magasságban vagy extrém hőségben',
    ],
    listenSigns: [
      'Szokatlan légszomj vagy szédülés',
      'Fájdalom, vérzés vagy összehúzódások megterhelés közben',
      'Fáradtság, amely pihenés után sem múlik el',
    ],
    neutralText: 'Mindig figyelj a tested jelzéseire, és beszélj a szülésznőddel vagy az orvosoddal, mielőtt megkezdesz vagy módosítasz egy fizikai tevékenységet.',
    tipTitle: 'Érdemes tudni',
    tipText: 'A kíméletes, rendszeres aktivitás a legtöbb terhesség számára előnyös: a kulcs az intenzitás hozzáigazítása az egyes szakaszokhoz és a közérzetedhez.',
    shareMessage: 'Aktívnak maradni a terhesség alatt — AWA',
  },
  ro: {
    badge: 'SARCINĂ • ACTIVITATE FIZICĂ',
    title: 'Rămânerea activă\nîn timpul sarcinii',
    metaDuration: '5 min de citit',
    metaType: 'Ghid',
    metaLevel: 'Începător',
    metaValidated: 'Conținut revizuit',
    intro: 'Să rămâi activă cu blândețe, în siguranță, în fiecare trimestru.',
    contentsTitle: 'În acest articol',
    topics: [
      'Activități recomandate',
      'Ce este mai bine să eviți',
      'Ascultarea semnalelor corpului tău',
      'De reținut',
      'Ideea principală',
    ],
    body1: 'Mersul pe jos, înotul și yoga prenatală sunt în general recomandate pe tot parcursul sarcinii, într-un ritm care corespunde cu felul în care te simți.',
    recommended: ['Mers pe jos', 'Înot', 'Yoga prenatală'],
    body2: 'Evită sporturile cu impact puternic sau activitățile cu risc de cădere, mai ales începând cu al doilea trimestru:',
    toAvoid: [
      'Sporturi cu impact puternic (alergare intensă, sporturi cu rachetă într-un ritm alert)',
      'Activități cu risc de cădere (schi, echitație, ciclism pe teren accidentat)',
      'Sporturi de contact sau de luptă',
      'Efort intens la altitudine sau în caniculă',
    ],
    listenSigns: [
      'Lipsă de aer sau amețeală neobișnuite',
      'Durere, sângerare sau contracții în timpul efortului',
      'Oboseală care nu trece după odihnă',
    ],
    neutralText: 'Ascultă întotdeauna semnalele corpului tău și vorbește cu moașa sau cu medicul tău înainte de a începe sau de a schimba o activitate fizică.',
    tipTitle: 'Bine de știut',
    tipText: 'O activitate blândă și regulată este benefică pentru majoritatea sarcinilor: cheia este adaptarea intensității la fiecare etapă și la felul în care te simți.',
    shareMessage: 'Rămânerea activă în timpul sarcinii — AWA',
  },
  bg: {
    badge: 'БРЕМЕННОСТ • ФИЗИЧЕСКА АКТИВНОСТ',
    title: 'Да останеш активна\nпо време на бременност',
    metaDuration: '5 мин четене',
    metaType: 'Ръководство',
    metaLevel: 'Начинаещ',
    metaValidated: 'Проверено съдържание',
    intro: 'Да останеш нежно активна, безопасно, във всеки триместър.',
    contentsTitle: 'В тази статия',
    topics: [
      'Препоръчвани дейности',
      'Какво е най-добре да избягваш',
      'Вслушване в сигналите на тялото ти',
      'Забележка',
      'Основно',
    ],
    body1: 'Ходенето, плуването и йогата за бременни обикновено се препоръчват през цялата бременност, в темпо, което съответства на усещането ти.',
    recommended: ['Ходене', 'Плуване', 'Йога за бременни'],
    body2: 'Избягвай спортове с висок удар или дейности с риск от падане, особено от втория триместър нататък:',
    toAvoid: [
      'Спортове с висок удар (интензивно бягане, бързи спортове с ракета)',
      'Дейности с риск от падане (ски, езда, колоездене по неравен терен)',
      'Контактни спортове или бойни изкуства',
      'Интензивно натоварване на голяма височина или при силна жега',
    ],
    listenSigns: [
      'Необичаен задух или световъртеж',
      'Болка, кървене или контракции по време на усилие',
      'Умора, която не отшумява след почивка',
    ],
    neutralText: 'Винаги се вслушвай в сигналите на тялото си и поговори с акушерката или лекаря си, преди да започнеш или промениш физическа активност.',
    tipTitle: 'Добре е да знаеш',
    tipText: 'Нежната, редовна активност е полезна при повечето бременности: важното е интензивността да се нагажда към всеки етап и към усещането ти.',
    shareMessage: 'Да останеш активна по време на бременност — AWA',
  },
  sr: {
    badge: 'ТРУДНОЋА • ФИЗИЧКА АКТИВНОСТ',
    title: 'Остајање активном\nтоком трудноће',
    metaDuration: '5 мин читања',
    metaType: 'Водич',
    metaLevel: 'Почетник',
    metaValidated: 'Проверен садржај',
    intro: 'Остајање нежно активном, безбедно, у сваком триместру.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Препоручене активности',
      'Шта је најбоље избегавати',
      'Слушање сигнала свог тела',
      'Напомена',
      'Основно',
    ],
    body1: 'Ходање, пливање и јога за труднице обично се препоручују током целе трудноће, у темпу који одговара твом осећању.',
    recommended: ['Ходање', 'Пливање', 'Јога за труднице'],
    body2: 'Избегавај спортове са великим ударом или активности са ризиком од пада, нарочито од другог триместра надаље:',
    toAvoid: [
      'Спортови са великим ударом (интензивно трчање, брзи спортови са рекетом)',
      'Активности са ризиком од пада (скијање, јахање, бициклизам по неравном терену)',
      'Контактни спортови или борилачке вештине',
      'Интензивно напрезање на великој надморској висини или у екстремној врућини',
    ],
    listenSigns: [
      'Необичан недостатак даха или вртоглавица',
      'Бол, крварење или контракције током напора',
      'Умор који не пролази после одмора',
    ],
    neutralText: 'Увек слушај сигнале свог тела и разговарај са бабицом или лекаром пре започињања или промене физичке активности.',
    tipTitle: 'Добро је знати',
    tipText: 'Нежна, редовна активност је корисна код већине трудноћа: кључно је прилагодити интензитет свакој фази и свом осећању.',
    shareMessage: 'Остајање активном током трудноће — AWA',
  },
  hr: {
    badge: 'TRUDNOĆA • TJELESNA AKTIVNOST',
    title: 'Ostani aktivna\ntijekom trudnoće',
    metaDuration: '5 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Ostati blago aktivna, na siguran način, u svakom trimestru.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Preporučene aktivnosti',
      'Što je najbolje izbjegavati',
      'Slušanje signala svog tijela',
      'Napomena',
      'Ključna poruka',
    ],
    body1: 'Hodanje, plivanje i joga za trudnice općenito se preporučuju tijekom cijele trudnoće, tempom koji odgovara tvom osjećaju.',
    recommended: ['Hodanje', 'Plivanje', 'Joga za trudnice'],
    body2: 'Izbjegavaj sportove s jakim udarcima ili aktivnosti s rizikom od pada, osobito od drugog trimestra nadalje:',
    toAvoid: [
      'Sportovi s jakim udarcima (intenzivno trčanje, brzi sportovi s reketom)',
      'Aktivnosti s rizikom od pada (skijanje, jahanje, vožnja bicikla po neravnom terenu)',
      'Kontaktni ili borilački sportovi',
      'Intenzivan napor na visini ili u ekstremnoj vrućini',
    ],
    listenSigns: [
      'Neobičan nedostatak zraka ili vrtoglavica',
      'Bol, krvarenje ili kontrakcije tijekom napora',
      'Umor koji ne prolazi nakon odmora',
    ],
    neutralText: 'Uvijek slušaj signale svog tijela i razgovaraj s babicom ili liječnikom prije početka ili promjene tjelesne aktivnosti.',
    tipTitle: 'Dobro je znati',
    tipText: 'Blaga, redovita aktivnost korisna je za većinu trudnoća: ključno je prilagoditi intenzitet svakoj fazi i svom osjećaju.',
    shareMessage: 'Ostani aktivna tijekom trudnoće — AWA',
  },
  bs: {
    badge: 'TRUDNOĆA • TJELESNA AKTIVNOST',
    title: 'Ostani aktivna\ntijekom trudnoće',
    metaDuration: '5 min čitanja',
    metaType: 'Vodič',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Ostati blago aktivna, na siguran način, u svakom trimestru.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Preporučene aktivnosti',
      'Što je najbolje izbjegavati',
      'Slušanje signala svog tijela',
      'Napomena',
      'Ključna poruka',
    ],
    body1: 'Hodanje, plivanje i joga za trudnice općenito se preporučuju tokom cijele trudnoće, tempom koji odgovara tvom osjećaju.',
    recommended: ['Hodanje', 'Plivanje', 'Joga za trudnice'],
    body2: 'Izbjegavaj sportove s jakim udarcima ili aktivnosti s rizikom od pada, osobito od drugog trimestra nadalje:',
    toAvoid: [
      'Sportovi s jakim udarcima (intenzivno trčanje, brzi sportovi s reketom)',
      'Aktivnosti s rizikom od pada (skijanje, jahanje, vožnja bicikla po neravnom terenu)',
      'Kontaktni ili borilački sportovi',
      'Intenzivan napor na visini ili u ekstremnoj vrućini',
    ],
    listenSigns: [
      'Neobičan nedostatak zraka ili vrtoglavica',
      'Bol, krvarenje ili kontrakcije tokom napora',
      'Umor koji ne prolazi nakon odmora',
    ],
    neutralText: 'Uvijek slušaj signale svog tijela i razgovaraj s babicom ili ljekarom prije početka ili promjene tjelesne aktivnosti.',
    tipTitle: 'Dobro je znati',
    tipText: 'Blaga, redovita aktivnost korisna je za većinu trudnoća: ključno je prilagoditi intenzitet svakoj fazi i svom osjećaju.',
    shareMessage: 'Ostani aktivna tokom trudnoće — AWA',
  },
  sl: {
    badge: 'NOSEČNOST • TELESNA DEJAVNOST',
    title: 'Ostani aktivna\nmed nosečnostjo',
    metaDuration: '5 min branja',
    metaType: 'Vodnik',
    metaLevel: 'Začetnica',
    metaValidated: 'Preverjena vsebina',
    intro: 'Ostati nežno aktivna, na varen način, v vsakem trimesečju.',
    contentsTitle: 'V tem članku',
    topics: [
      'Priporočene dejavnosti',
      'Česa je najbolje izogibati',
      'Poslušanje signalov svojega telesa',
      'Opomba',
      'Ključno sporočilo',
    ],
    body1: 'Hoja, plavanje in joga za nosečnice se na splošno priporočajo skozi celotno nosečnost, s tempom, ki ustreza tvojemu počutju.',
    recommended: ['Hoja', 'Plavanje', 'Joga za nosečnice'],
    body2: 'Izogibaj se športom z močnimi udarci ali dejavnostim s tveganjem za padec, zlasti od drugega trimesečja naprej:',
    toAvoid: [
      'Športi z močnimi udarci (intenziven tek, hitri športi z loparjem)',
      'Dejavnosti s tveganjem za padec (smučanje, jahanje, kolesarjenje po neravnem terenu)',
      'Kontaktni ali borilni športi',
      'Intenziven napor na višini ali v skrajni vročini',
    ],
    listenSigns: [
      'Nenavadno pomanjkanje zraka ali omotica',
      'Bolečina, krvavitev ali popadki med naporom',
      'Utrujenost, ki ne mine po počitku',
    ],
    neutralText: 'Vedno prisluhni signalom svojega telesa in se pogovori z babico ali zdravnikom, preden začneš ali spremeniš telesno dejavnost.',
    tipTitle: 'Vredno vedeti',
    tipText: 'Nežna, redna dejavnost je koristna za večino nosečnosti: ključno je prilagoditi intenzivnost vsaki fazi in svojemu počutju.',
    shareMessage: 'Ostani aktivna med nosečnostjo — AWA',
  },
  ne: {
    badge: 'गर्भावस्था • शारीरिक गतिविधि',
    title: 'गर्भावस्थामा\nसक्रिय रहनुहोस्',
    metaDuration: '5 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    metaLevel: 'सुरुवाती',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'हरेक त्रैमासिकमा कोमलतापूर्वक, सुरक्षित रूपमा सक्रिय रहनुहोस्।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'सिफारिस गरिएका गतिविधिहरू',
      'के जोगिनु राम्रो',
      'आफ्नो शरीरका संकेतहरू सुन्ने',
      'टिप्पणी',
      'मुख्य कुरा',
    ],
    body1: 'हिँडाइ, पौडी र गर्भवतीका लागि योग गर्भावस्थाभर, तपाईंलाई कस्तो लाग्छ त्यससँग मिल्ने गतिमा, सामान्यतया सिफारिस गरिन्छन्।',
    recommended: ['हिँडाइ', 'पौडी', 'गर्भवतीका लागि योग'],
    body2: 'उच्च-प्रभावका खेलकुद वा लड्ने जोखिम भएका गतिविधिहरूबाट जोगिनुहोस्, विशेष गरी दोस्रो त्रैमासिकदेखि:',
    toAvoid: [
      'उच्च-प्रभावका खेलकुद (तीव्र दौड, छिटो गतिका र्याकेट खेलकुद)',
      'लड्ने जोखिम भएका गतिविधिहरू (स्कीइङ, घोडचढी, कठिन भू-भागमा साइकल चलाउने)',
      'सम्पर्क वा लडाइँका खेलकुद',
      'उचाइ वा चरम गर्मीमा तीव्र परिश्रम',
    ],
    listenSigns: [
      'असामान्य सास फेर्न गाह्रो वा चक्कर',
      'परिश्रमको समयमा दुखाइ, रक्तस्राव वा खुम्चाइ',
      'आराम गरेपछि पनि नहराउने थकान',
    ],
    neutralText: 'सधैँ आफ्नो शरीरका संकेतहरू सुन्नुहोस् र कुनै शारीरिक गतिविधि सुरु गर्नु वा बदल्नुअघि आफ्नी सुँडेनी वा चिकित्सकसँग कुरा गर्नुहोस्।',
    tipTitle: 'जान्न लायक',
    tipText: 'कोमल, नियमित गतिविधि अधिकांश गर्भावस्थाका लागि लाभदायक हुन्छ: मुख्य कुरा हरेक चरण र तपाईंलाई कस्तो लाग्छ त्यसअनुसार तीव्रता मिलाउनु हो।',
    shareMessage: 'गर्भावस्थामा सक्रिय रहनुहोस् — AWA',
  },
  si: {
    badge: 'ගර්භණී කාලය • ශාරීරික ක්‍රියාකාරකම',
    title: 'ගර්භණී කාලය තුළ\nක්‍රියාශීලීව සිටීම',
    metaDuration: 'කියවීමට මිනිත්තු 5',
    metaType: 'මාර්ගෝපදේශය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'සෑම ත්‍රෛමාසිකයකම, ආරක්ෂිතව, මෘදුවට ක්‍රියාශීලීව සිටීම.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'නිර්දේශිත ක්‍රියාකාරකම්',
      'වළක්වා ගැනීම වඩාත් හොඳ දේ',
      'ඔබේ ශරීරයේ සංඥාවලට සවන් දීම',
      'සටහන',
      'ප්‍රධාන කරුණ',
    ],
    body1: 'ඇවිදීම, පිහිනීම සහ ගර්භණී යෝග ගර්භණී කාලය පුරා, ඔබට දැනෙන ආකාරයට ගැළපෙන වේගයෙන්, සාමාන්‍යයෙන් නිර්දේශ කෙරේ.',
    recommended: ['ඇවිදීම', 'පිහිනීම', 'ගර්භණී යෝග'],
    body2: 'ඉහළ බලපෑම් ක්‍රීඩා හෝ වැටීමේ අවදානමක් ඇති ක්‍රියාකාරකම්, විශේෂයෙන් දෙවන ත්‍රෛමාසිකයේ සිට, වළක්වන්න:',
    toAvoid: [
      'ඉහළ බලපෑම් ක්‍රීඩා (දැඩි දිවීම, වේගවත් රැකට් ක්‍රීඩා)',
      'වැටීමේ අවදානමක් ඇති ක්‍රියාකාරකම් (ස්කී කිරීම, අශ්ව ධාවනය, රළු භූමියේ පාපැදි ධාවනය)',
      'ස්පර්ශ හෝ සටන් ක්‍රීඩා',
      'උන්නතාංශයේදී හෝ අධික උණුසුමේදී දැඩි වෙහෙස',
    ],
    listenSigns: [
      'අසාමාන්‍ය හුස්ම හිරවීම හෝ හිස කැරකීම',
      'වෙහෙසෙන විට වේදනාව, ලේ ගැලීම හෝ සංකෝචන',
      'විවේක ගැනීමෙන් පසු පහව නොයන වෙහෙස',
    ],
    neutralText: 'සෑම විටම ඔබේ ශරීරයේ සංඥාවලට සවන් දී ශාරීරික ක්‍රියාකාරකමක් ආරම්භ කිරීමට හෝ වෙනස් කිරීමට පෙර ඔබේ ප්‍රසව හෙදිය හෝ වෛද්‍යවරයා සමඟ කතා කරන්න.',
    tipTitle: 'දැනගත යුතු දේ',
    tipText: 'මෘදු, නිතිපතා ක්‍රියාකාරකම බොහෝ ගර්භණී කාලයන්ට ප්‍රයෝජනවත්: ප්‍රධානම දේ නම් තීව්‍රතාව සෑම අවධියකටම සහ ඔබට දැනෙන ආකාරයට සකස් කිරීමයි.',
    shareMessage: 'ගර්භණී කාලය තුළ ක්‍රියාශීලීව සිටීම — AWA',
  },
  th: {
    badge: 'การตั้งครรภ์ • กิจกรรมทางกาย',
    title: 'ออกกำลังกาย\nระหว่างตั้งครรภ์',
    metaDuration: 'อ่าน 5 นาที',
    metaType: 'คู่มือ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'เคลื่อนไหวเบา ๆ อย่างปลอดภัย ในทุกไตรมาส',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'กิจกรรมที่แนะนำ',
      'สิ่งที่ควรหลีกเลี่ยง',
      'ฟังสัญญาณจากร่างกายของคุณ',
      'หมายเหตุ',
      'ประเด็นสำคัญ',
    ],
    body1: 'การเดิน ว่ายน้ำ และโยคะสำหรับคนท้อง โดยทั่วไปแนะนำตลอดการตั้งครรภ์ ในจังหวะที่เหมาะกับความรู้สึกของคุณ',
    recommended: ['การเดิน', 'การว่ายน้ำ', 'โยคะสำหรับคนท้อง'],
    body2: 'หลีกเลี่ยงกีฬาที่มีแรงกระแทกสูงหรือกิจกรรมที่เสี่ยงต่อการหกล้ม โดยเฉพาะตั้งแต่ไตรมาสที่สองเป็นต้นไป:',
    toAvoid: [
      'กีฬาที่มีแรงกระแทกสูง (วิ่งหนัก กีฬาแร็กเก็ตจังหวะเร็ว)',
      'กิจกรรมที่เสี่ยงต่อการหกล้ม (เล่นสกี ขี่ม้า ปั่นจักรยานบนทางขรุขระ)',
      'กีฬาที่มีการปะทะหรือการต่อสู้',
      'การออกแรงหนักบนที่สูงหรือในอากาศร้อนจัด',
    ],
    listenSigns: [
      'หายใจลำบากหรือเวียนศีรษะผิดปกติ',
      'ปวด เลือดออก หรือมดลูกบีบตัวระหว่างออกแรง',
      'ความเหนื่อยล้าที่ไม่หายไปหลังพัก',
    ],
    neutralText: 'ฟังสัญญาณจากร่างกายของคุณเสมอ และพูดคุยกับผดุงครรภ์หรือแพทย์ก่อนเริ่มหรือเปลี่ยนกิจกรรมทางกาย',
    tipTitle: 'ควรรู้',
    tipText: 'กิจกรรมเบา ๆ สม่ำเสมอเป็นประโยชน์ต่อการตั้งครรภ์ส่วนใหญ่: สิ่งสำคัญคือปรับความหนักให้เหมาะกับแต่ละระยะและความรู้สึกของคุณ',
    shareMessage: 'ออกกำลังกายระหว่างตั้งครรภ์ — AWA',
  },
  vi: {
    badge: 'THAI KỲ • HOẠT ĐỘNG THỂ CHẤT',
    title: 'Duy trì vận động\ntrong thai kỳ',
    metaDuration: '5 phút đọc',
    metaType: 'Hướng dẫn',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Duy trì vận động nhẹ nhàng, an toàn, ở mọi tam cá nguyệt.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Các hoạt động được khuyến nghị',
      'Điều tốt nhất nên tránh',
      'Lắng nghe các tín hiệu của cơ thể',
      'Lưu ý',
      'Điểm chính cần nhớ',
    ],
    body1: 'Đi bộ, bơi lội và yoga cho bà bầu thường được khuyến nghị trong suốt thai kỳ, với nhịp độ phù hợp với cảm giác của bạn.',
    recommended: ['Đi bộ', 'Bơi lội', 'Yoga cho bà bầu'],
    body2: 'Hãy tránh các môn thể thao va đập mạnh hoặc hoạt động có nguy cơ ngã, đặc biệt từ tam cá nguyệt thứ hai trở đi:',
    toAvoid: [
      'Các môn thể thao va đập mạnh (chạy cường độ cao, các môn vợt nhịp độ nhanh)',
      'Hoạt động có nguy cơ ngã (trượt tuyết, cưỡi ngựa, đạp xe trên địa hình gồ ghề)',
      'Các môn thể thao đối kháng hoặc võ thuật',
      'Gắng sức mạnh ở độ cao hoặc trong thời tiết quá nóng',
    ],
    listenSigns: [
      'Khó thở hoặc chóng mặt bất thường',
      'Đau, ra máu hoặc co thắt trong khi gắng sức',
      'Mệt mỏi không hết sau khi nghỉ ngơi',
    ],
    neutralText: 'Hãy luôn lắng nghe các tín hiệu của cơ thể và nói chuyện với nữ hộ sinh hoặc bác sĩ của bạn trước khi bắt đầu hoặc thay đổi một hoạt động thể chất.',
    tipTitle: 'Nên biết',
    tipText: 'Hoạt động nhẹ nhàng, đều đặn có lợi cho hầu hết các thai kỳ: điều quan trọng là điều chỉnh cường độ theo từng giai đoạn và theo cảm giác của bạn.',
    shareMessage: 'Duy trì vận động trong thai kỳ — AWA',
  },
  uz: {
    badge: 'HOMILADORLIK • JISMONIY FAOLLIK',
    title: 'Homiladorlik davrida\nfaol boʻlish',
    metaDuration: '5 daq oʻqish',
    metaType: 'Qoʻllanma',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Har bir trimestrda xavfsiz tarzda yengil faol boʻlib qolish.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Tavsiya etilgan faollik turlari',
      'Nimadan saqlanish yaxshi',
      'Tanangiz signallarini tinglash',
      'Eslatma',
      'Asosiy xulosa',
    ],
    body1: 'Piyoda yurish, suzish va homiladorlar uchun yoga butun homiladorlik davomida, oʻzingizni qanday his qilishingizga mos surʼatda odatda tavsiya etiladi.',
    recommended: ['Piyoda yurish', 'Suzish', 'Homiladorlar uchun yoga'],
    body2: 'Yuqori zarbali sport turlaridan yoki yiqilish xavfi boʻlgan faollikdan, ayniqsa ikkinchi trimestrdan boshlab saqlaning:',
    toAvoid: [
      'Yuqori zarbali sport turlari (intensiv yugurish, tez surʼatli raketkali oʻyinlar)',
      'Yiqilish xavfi boʻlgan faollik (changʻi, ot minish, notekis yerda velosiped)',
      'Kontaktli yoki jang sport turlari',
      'Balandlikda yoki haddan tashqari issiqda kuchli zoʻriqish',
    ],
    listenSigns: [
      'Odatdan tashqari nafas qisilishi yoki bosh aylanishi',
      'Zoʻriqish paytida ogʻriq, qon ketishi yoki qisqarishlar',
      'Dam olgandan keyin ham yoʻqolmaydigan charchoq',
    ],
    neutralText: 'Doim tanangiz signallarini tinglang va jismoniy faollikni boshlash yoki oʻzgartirishdan oldin doyangiz yoki shifokoringiz bilan gaplashing.',
    tipTitle: 'Bilish foydali',
    tipText: 'Yengil, muntazam faollik koʻpchilik homiladorliklar uchun foydali: asosiysi — shiddatni har bir bosqichga va oʻzingizni his qilishingizga moslashtirish.',
    shareMessage: 'Homiladorlik davrida faol boʻlish — AWA',
  },
  az: {
    badge: 'HAMİLƏLİK • FİZİKİ FƏALİYYƏT',
    title: 'Hamiləlik zamanı\naktiv qalmaq',
    metaDuration: '5 dəq oxu',
    metaType: 'Bələdçi',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Hər trimestrdə mülayim şəkildə, təhlükəsiz aktiv qalmaq.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Tövsiyə olunan fəaliyyətlər',
      'Nədən qaçmaq daha yaxşıdır',
      'Bədəninizin siqnallarını dinləmək',
      'Qeyd',
      'Əsas nəticə',
    ],
    body1: 'Gəzinti, üzgüçülük və hamilələr üçün yoqa hamiləlik boyu, özünüzü necə hiss etdiyinizə uyğun templə ümumiyyətlə tövsiyə olunur.',
    recommended: ['Gəzinti', 'Üzgüçülük', 'Hamilələr üçün yoqa'],
    body2: 'Yüksək təsirli idman növlərindən və ya yıxılma riski olan fəaliyyətlərdən, xüsusilə ikinci trimestrdən başlayaraq, qaçının:',
    toAvoid: [
      'Yüksək təsirli idman növləri (intensiv qaçış, sürətli raketka oyunları)',
      'Yıxılma riski olan fəaliyyətlər (xizək, atçılıq, çətin relyefdə velosiped)',
      'Kontakt və ya döyüş idman növləri',
      'Yüksəklikdə və ya həddindən artıq istidə intensiv güc sərfi',
    ],
    listenSigns: [
      'Qeyri-adi nəfəs darlığı və ya başgicəllənmə',
      'Güc sərfi zamanı ağrı, qanaxma və ya yığılmalar',
      'İstirahətdən sonra keçməyən yorğunluq',
    ],
    neutralText: 'Həmişə bədəninizin siqnallarını dinləyin və fiziki fəaliyyətə başlamazdan və ya onu dəyişməzdən əvvəl mamanız və ya həkiminizlə danışın.',
    tipTitle: 'Bilmək faydalıdır',
    tipText: 'Mülayim, müntəzəm fəaliyyət əksər hamiləliklər üçün faydalıdır: əsas məsələ intensivliyi hər mərhələyə və özünüzü necə hiss etdiyinizə uyğunlaşdırmaqdır.',
    shareMessage: 'Hamiləlik zamanı aktiv qalmaq — AWA',
  },
  ka: {
    badge: 'ორსულობა • ფიზიკური აქტივობა',
    title: 'აქტიურობის შენარჩუნება\nორსულობის დროს',
    metaDuration: '5 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    metaLevel: 'დამწყები',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'რბილად აქტიურად დარჩენა, უსაფრთხოდ, ყოველ ტრიმესტრში.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'რეკომენდებული აქტივობები',
      'რისი თავიდან აცილებაა უმჯობესი',
      'თქვენი სხეულის სიგნალებისთვის ყურის მიგდება',
      'შენიშვნა',
      'მთავარი დასკვნა',
    ],
    body1: 'სიარული, ცურვა და ორსულთა იოგა ზოგადად რეკომენდებულია მთელი ორსულობის განმავლობაში, თქვენი თვითგრძნობის შესაბამისი ტემპით.',
    recommended: ['სიარული', 'ცურვა', 'ორსულთა იოგა'],
    body2: 'აარიდეთ თავი მაღალი დარტყმის სპორტს ან ვარდნის რისკის მქონე აქტივობებს, განსაკუთრებით მეორე ტრიმესტრიდან:',
    toAvoid: [
      'მაღალი დარტყმის სპორტი (ინტენსიური სირბილი, სწრაფი რაკეტებიანი სპორტი)',
      'ვარდნის რისკის მქონე აქტივობები (თხილამურები, ცხენოსნობა, ველოსიპედით სიარული უსწორმასწორო რელიეფზე)',
      'კონტაქტური ან საბრძოლო სპორტი',
      'ინტენსიური დატვირთვა სიმაღლეზე ან უკიდურეს სიცხეში',
    ],
    listenSigns: [
      'უჩვეულო სუნთქვის უკმარისობა ან თავბრუსხვევა',
      'ტკივილი, სისხლდენა ან შეკუმშვები დატვირთვისას',
      'დაღლილობა, რომელიც დასვენების შემდეგ არ გადის',
    ],
    neutralText: 'ყოველთვის მიაქციეთ ყურადღება თქვენი სხეულის სიგნალებს და ფიზიკური აქტივობის დაწყებამდე ან შეცვლამდე ესაუბრეთ ბებიაქალს ან ექიმს.',
    tipTitle: 'კარგია ვიცოდეთ',
    tipText: 'რბილი, რეგულარული აქტივობა ორსულობების უმრავლესობისთვის სასარგებლოა: მთავარია ინტენსივობის მორგება თითოეულ ეტაპსა და თქვენს თვითგრძნობაზე.',
    shareMessage: 'აქტიურობის შენარჩუნება ორსულობის დროს — AWA',
  },
  hy: {
    badge: 'ՀՂԻՈՒԹՅՈՒՆ • ՖԻԶԻԿԱԿԱՆ ԱԿՏԻՎՈՒԹՅՈՒՆ',
    title: 'Ակտիվ մնալ\nհղիության ընթացքում',
    metaDuration: '5 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Մեղմորեն ակտիվ մնալ՝ անվտանգ, յուրաքանչյուր եռամսյակում:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Խորհուրդ տրվող գործունեություն',
      'Ինչից ավելի լավ է խուսափել',
      'Լսել ձեր մարմնի ազդանշանները',
      'Նշում',
      'Հիմնական եզրակացություն',
    ],
    body1: 'Քայլքը, լողը և նախածննդյան յոգան սովորաբար խորհուրդ են տրվում ողջ հղիության ընթացքում՝ ձեր ինքնազգացողությանը համապատասխան տեմպով:',
    recommended: ['Քայլք', 'Լող', 'Նախածննդյան յոգա'],
    body2: 'Խուսափեք բարձր հարվածային սպորտից կամ ընկնելու վտանգ ունեցող գործունեությունից, հատկապես երկրորդ եռամսյակից սկսած.',
    toAvoid: [
      'Բարձր հարվածային սպորտ (ինտենսիվ վազք, արագ տեմպով ռակետային սպորտ)',
      'Ընկնելու վտանգ ունեցող գործունեություն (դահուկ, ձիարշավ, հեծանվավարություն անհարթ տեղանքում)',
      'Շփումային կամ մենամարտային սպորտ',
      'Ինտենսիվ ջանք բարձրադիր վայրում կամ ծայրահեղ շոգում',
    ],
    listenSigns: [
      'Անսովոր շնչահեղձություն կամ գլխապտույտ',
      'Ցավ, արյունահոսություն կամ կծկումներ ջանքի ժամանակ',
      'Հոգնածություն, որը չի անցնում հանգստանալուց հետո',
    ],
    neutralText: 'Միշտ լսեք ձեր մարմնի ազդանշանները և խոսեք ձեր մանկաբարձուհու կամ բժշկի հետ՝ նախքան ֆիզիկական ակտիվություն սկսելը կամ փոխելը:',
    tipTitle: 'Լավ է իմանալ',
    tipText: 'Մեղմ, կանոնավոր ակտիվությունը օգտակար է հղիությունների մեծ մասի համար. գլխավորը ինտենսիվությունը յուրաքանչյուր փուլին և ձեր ինքնազգացողությանը հարմարեցնելն է:',
    shareMessage: 'Ակտիվ մնալ հղիության ընթացքում — AWA',
  },
  tg: {
    badge: 'ҲОМИЛАДОРӢ • ФАЪОЛИЯТИ ҶИСМОНӢ',
    title: 'Фаъол мондан\nҳангоми ҳомиладорӣ',
    metaDuration: '5 дақ барои хондан',
    metaType: 'Роҳнамо',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Нарм фаъол мондан, бехатар, дар ҳар триместр.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Фаъолиятҳои тавсияшаванда',
      'Аз чӣ беҳтар аст худдорӣ кард',
      'Гӯш додан ба сигналҳои бадани худ',
      'Қайд',
      'Хулосаи асосӣ',
    ],
    body1: 'Пиёдагардӣ, шиноварӣ ва йогаи ҳомиладорӣ одатан дар тамоми давраи ҳомиладорӣ тавсия дода мешаванд, бо суръате, ки ба эҳсоси шумо мувофиқ аст.',
    recommended: ['Пиёдагардӣ', 'Шиноварӣ', 'Йогаи ҳомиладорӣ'],
    body2: 'Аз варзишҳои бо зарбаи баланд ё фаъолиятҳои дорои хатари афтидан, хусусан аз триместри дуюм, худдорӣ кунед:',
    toAvoid: [
      'Варзишҳои бо зарбаи баланд (давидани шадид, варзишҳои ракеткавии босуръат)',
      'Фаъолиятҳои дорои хатари афтидан (лижаронӣ, аспсаворӣ, велосипедронӣ дар роҳи нобаробар)',
      'Варзишҳои тамосӣ ё мубориза',
      'Кӯшиши шадид дар баландӣ ё гармии шадид',
    ],
    listenSigns: [
      'Тангии ғайриоддии нафас ё чарх задани сар',
      'Дард, хунравӣ ё кашишҳо ҳангоми кӯшиш',
      'Хастагие, ки пас аз истироҳат аз байн намеравад',
    ],
    neutralText: 'Ҳамеша ба сигналҳои бадани худ гӯш диҳед ва пеш аз оғоз ё тағйири фаъолияти ҷисмонӣ бо доя ё табиби худ гап занед.',
    tipTitle: 'Донистан хуб аст',
    tipText: 'Фаъолияти нарм ва мунтазам барои аксари ҳомиладориҳо судманд аст: муҳим мутобиқ кардани шиддат ба ҳар марҳила ва эҳсоси шумост.',
    shareMessage: 'Фаъол мондан ҳангоми ҳомиладорӣ — AWA',
  },
  ky: {
    badge: 'КУРСАКТУУЛУК • ФИЗИКАЛЫК АКТИВДҮҮЛҮК',
    title: 'Курсактуулук убагында\nактивдүү болуу',
    metaDuration: '5 мүн окуу',
    metaType: 'Колдонмо',
    metaLevel: 'Баштоочу',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Ар бир триместрде жумшак, коопсуз активдүү болуу.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Сунушталган иш-аракеттер',
      'Эмнеден сактануу жакшы',
      'Денеңиздин сигналдарын угуу',
      'Эскертүү',
      'Негизги жыйынтык',
    ],
    body1: 'Басуу, сууда сүзүү жана төрөткө чейинки йога жалпысынан курсактуулук бою, өзүңүздү кандай сезгениңизге шайкеш темпте сунушталат.',
    recommended: ['Басуу', 'Сууда сүзүү', 'Төрөткө чейинки йога'],
    body2: 'Жогорку соккулуу спорттон же жыгылуу коркунучу бар иш-аракеттерден, айрыкча экинчи триместрден баштап, сактаныңыз:',
    toAvoid: [
      'Жогорку соккулуу спорт (интенсивдүү чуркоо, ылдам ракеткалуу оюндар)',
      'Жыгылуу коркунучу бар иш-аракеттер (лыжа, ат минүү, кыйын жолдо велосипед тебүү)',
      'Контакттуу же күрөш спорту',
      'Бийиктикте же ысык аба ырайында күчтүү чыңалуу',
    ],
    listenSigns: [
      'Адаттан тыш дем жетишсиздиги же баш айлануу',
      'Чыңалуу учурунда оору, кан кетүү же жыйрылуулар',
      'Эс алгандан кийин да кетпеген чарчоо',
    ],
    neutralText: 'Денеңиздин сигналдарын ар дайым угуңуз жана физикалык активдүүлүктү баштоодон же өзгөртүүдөн мурун акушеркаңыз же дарыгериңиз менен сүйлөшүңүз.',
    tipTitle: 'Билүү пайдалуу',
    tipText: 'Жумшак, үзгүлтүксүз активдүүлүк көпчүлүк курсактуулук үчүн пайдалуу: негизгиси — интенсивдүүлүктү ар бир этапка жана өзүңүздү кандай сезгениңизге ыңгайлаштыруу.',
    shareMessage: 'Курсактуулук убагында активдүү болуу — AWA',
  },
  tk: {
    badge: 'GÖWRELILIK • FIZIKI IŞJEŇLIK',
    title: 'Göwrelilik wagtynda\nişjeň galmak',
    metaDuration: '5 min okamak',
    metaType: 'Gollanma',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Barlanan mazmun',
    intro: 'Her trimestrde ýumşak, howpsuz işjeň galmak.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Maslahat berilýän işjeňlikler',
      'Nämeden gaça durmak has gowy',
      'Bedeniňiziň signallaryna gulak asmak',
      'Bellik',
      'Esasy netije',
    ],
    body1: 'Ýöremek, ýüzmek we göwreliler üçin ýoga umuman göwrelilik dowamynda, özüňizi nähili duýýandygyňyza laýyk ritmde, maslahat berilýär.',
    recommended: ['Ýöremek', 'Ýüzmek', 'Göwreliler üçin ýoga'],
    body2: 'Uly täsirli sportlardan ýa-da ýykylma howpy bolan işjeňliklerden, aýratyn-da 2-nji trimestrden başlap, gaça duruň:',
    toAvoid: [
      'Uly täsirli sportlar (güýçli ylgamak, çalt templi rakeka sportlary)',
      'Ýykylma howpy bolan işjeňlikler (lyža, at münmek, hamar bolmadyk ýerde welosiped sürmek)',
      'Kontaktly ýa-da söweş sportlary',
      'Beýiklikde ýa-da aşa yssyda güýçli dartgynlyk',
    ],
    listenSigns: [
      'Adaty däl dem ýetmezçiligi ýa-da kelle aýlanmasy',
      'Dartgynlyk wagtynda agyry, gan akma ýa-da gysylmalar',
      'Dynç alandan soň hem ýitmeýän ýadawlyk',
    ],
    neutralText: 'Hemişe bedeniňiziň signallaryna gulak asyň we fiziki işjeňligi başlamazdan ýa-da üýtgetmezden öň akuşerka ýa-da lukmanyňyz bilen gürleşiň.',
    tipTitle: 'Bilmek peýdaly',
    tipText: 'Ýumşak, yzygiderli işjeňlik aglaba göwrelilikler üçin peýdaly: esasy zat intensiwligi her tapgyra we özüňizi nähili duýýandygyňyza uýgunlaşdyrmak.',
    shareMessage: 'Göwrelilik wagtynda işjeň galmak — AWA',
  },
} as const);

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function PregnancyExerciseArticleScreen({
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
          <Image accessible accessibilityLabel={EDITORIAL_IMAGE_ALT.pregnancyExercise[lang]} accessibilityRole="image" source={resolveEditorialImage(HERO, lang)} resizeMode="cover" style={styles.hero} />

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

          <AwaText variant="titleSmall" style={styles.intro}>
            {content.intro}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.contents}>
            <AwaText variant="titleMedium" emphasized style={styles.contentsTitle}>{content.contentsTitle}</AwaText>

            {content.topics.map((item, index) => (
              <View key={item} style={styles.contentRow}>
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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>1. {content.topics[0]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.body1}
          </AwaText>

          <View style={styles.daily}>
            {RECOMMENDED_ICONS.map((icon, index) => (
              <View key={icon} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={icon as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <AwaText variant="bodySmall" style={styles.dailyText}>{content.recommended[index]}</AwaText>
              </View>
            ))}
          </View>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>2. {content.topics[1]}</AwaText>

          <AwaText variant="bodyMedium" style={styles.body}>
            {content.body2}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.toAvoid.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="close-circle-outline"
                  size={18}
                  color={theme.colors.warning}
                />

                <AwaText variant="bodySmall" style={styles.checkText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.topics[2]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.consultCard}>
            {content.listenSigns.map(item => (
              <View key={item} style={styles.consultRow}>
                <View style={styles.consultIcon}>
                  <MaterialDesignIcons
                    name="alert-circle-outline"
                    size={18}
                    color={theme.colors.primary}
                  />
                </View>

                <AwaText variant="bodySmall" style={styles.consultText}>{item}</AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.topics[3]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.neutralBox}>
            <MaterialDesignIcons
              name="information-outline"
              size={22}
              color={theme.colors.textMuted}
            />

            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.neutralText}>
              {content.neutralText}
            </AwaText>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>5. {content.topics[4]}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.tipTitle}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.tipText}
              </AwaText>
            </View>
          </AwaCard>
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={5} scrollRef={scrollRef} />
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
  contentNumber: {width: 25},
  contentText: {flex: 1},
  h2: {
    marginTop: 24,
  },
  body: {marginTop: 8},
  daily: {marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  dailyItem: {
    width: '48.7%',
    minHeight: 108,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
  },
  dailyText: {
    marginTop: 8,
    textAlign: 'center',
  },
  checkList: {
    marginTop: 12,
    padding: 12,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  checkText: {flex: 1},
  consultCard: {
    marginTop: 16,
    padding: 12,
  },
  consultRow: {
    minHeight: 43,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  consultIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  consultText: {
    flex: 1,
    marginLeft: 12,
  },
  neutralBox: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  neutralText: {flex: 1},
  tip: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipCopy: {flex: 1, marginLeft: 12},
  tipText: {marginTop: 4},
  });
}
