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
  ms: {
    badge: 'KEHAMILAN • AKTIVITI FIZIKAL',
    title: 'Kekal aktif\nsemasa kehamilan',
    metaDuration: '5 min bacaan',
    metaType: 'Panduan',
    metaLevel: 'Permulaan',
    metaValidated: 'Kandungan disemak',
    intro: 'Kekal aktif dengan lembut, dengan selamat, pada setiap trimester.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Aktiviti yang disyorkan',
      'Apa yang lebih baik dielakkan',
      'Mendengar isyarat tubuh anda',
      'Nota',
      'Perkara penting',
    ],
    body1: 'Berjalan, berenang dan yoga prenatal biasanya disyorkan sepanjang kehamilan, pada rentak yang sepadan dengan perasaan anda.',
    recommended: ['Berjalan', 'Berenang', 'Yoga prenatal'],
    body2: 'Elakkan sukan berimpak tinggi atau aktiviti dengan risiko jatuh, terutamanya mulai trimester kedua:',
    toAvoid: [
      'Sukan berimpak tinggi (berlari intensif, sukan raket yang laju)',
      'Aktiviti dengan risiko jatuh (ski, menunggang kuda, berbasikal di kawasan yang kasar)',
      'Sukan sentuhan atau pertarungan',
      'Usaha yang intensif di tempat tinggi atau dalam cuaca yang sangat panas',
    ],
    listenSigns: [
      'Sesak nafas atau pening yang luar biasa',
      'Sakit, pendarahan atau kontraksi semasa bersenam',
      'Keletihan yang tidak hilang selepas berehat',
    ],
    neutralText: 'Sentiasa dengar isyarat tubuh anda dan berbincang dengan bidan atau doktor anda sebelum memulakan atau menukar aktiviti fizikal.',
    tipTitle: 'Elok diketahui',
    tipText: 'Aktiviti yang lembut dan tetap bermanfaat bagi kebanyakan kehamilan: kuncinya ialah menyesuaikan keamatan dengan setiap peringkat dan dengan perasaan anda.',
    shareMessage: 'Kekal aktif semasa kehamilan — AWA',
  },
  so: {
    badge: 'UUR • FIRFIRCOONI JIDHEED',
    title: 'Firfircooni inta\nuurka jiro',
    metaDuration: '5 daq akhris',
    metaType: 'Hage',
    metaLevel: 'Bilow',
    metaValidated: 'Macluumaad la dib-u-eegay',
    intro: 'Sii wadidda firfircooni jilicsan, si ammaan ah, saddex-bille kasta.',
    contentsTitle: 'Maqaalkan dhexdiisa',
    topics: [
      'Hawlaha lagula taliyo',
      'Waxa ugu fiican in laga fogaado',
      'U dhegaysiga calaamadaha jidhkaaga',
      'Ogow',
      'Qodob muhiim ah',
    ],
    body1: 'Socodka, dabaasha, iyo yoga uurka ayaa guud ahaan lagula taliyaa uurka oo dhan, xawaare la jaan qaadaya sida aad dareemayso.',
    recommended: ['Socod', 'Dabaal', 'Yoga uurka'],
    body2: 'Ka fogow isboortiyada saameynta weyn leh ama hawlaha khatarta dhicitaanka leh, gaar ahaan laga bilaabo saddex-billaha labaad:',
    toAvoid: [
      'Isboortiyada saameynta weyn leh (orod xoog badan, isboortiyada raakadda oo degdeg ah)',
      'Hawlaha khatarta dhicitaanka leh (ski, fardo-fuulid, baaskiil dhul adag)',
      'Isboortiyada xiriirka ama dagaalka',
      'Dadaal xoog badan oo dhul sare ah ama kulayl xad dhaaf ah',
    ],
    listenSigns: [
      'Neef-qabasho ama meemis aan caadi ahayn',
      'Xanuun, dhiigbax, ama isku-uruurin inta dadaalku socdo',
      'Daal aan tagin ka dib nasasho',
    ],
    neutralText: 'Mar walba u dhegeyso calaamadaha jidhkaaga oo la hadal umulistaada ama dhakhtarkaaga ka hor intaadan bilaabin ama beddelin firfircooni jidheed.',
    tipTitle: 'Waxtar leh in la ogaado',
    tipText: 'Firfircooni jilicsan, joogto ah waa mid faa’iido leh inta badan uurrada: furaha waa hagaajinta xoogga heer kasta iyo sida aad dareemayso.',
    shareMessage: 'Firfircooni inta uurka jiro — AWA',
  },
  sw: {
    badge: 'UJAUZITO • SHUGHULI ZA MWILI',
    title: 'Kubaki mchangamfu\nwakati wa ujauzito',
    metaDuration: 'Dakika 5 za kusoma',
    metaType: 'Mwongozo',
    metaLevel: 'Mwanzo',
    metaValidated: 'Maudhui yaliyokaguliwa',
    intro: 'Kubaki mchangamfu kwa upole, kwa usalama, katika kila trimesta.',
    contentsTitle: 'Katika makala hii',
    topics: [
      'Shughuli zinazopendekezwa',
      'Kinachofaa zaidi kuepukwa',
      'Kusikiliza ishara za mwili wako',
      'Kumbuka',
      'Jambo kuu la kukumbuka',
    ],
    body1: 'Kutembea, kuogelea, na yoga ya wajawazito kwa kawaida hupendekezwa katika ujauzito wote, kwa mwendo unaolingana na unavyojisikia.',
    recommended: ['Kutembea', 'Kuogelea', 'Yoga ya wajawazito'],
    body2: 'Epuka michezo yenye mshtuko mkubwa au shughuli zenye hatari ya kuanguka, hasa kuanzia trimesta ya pili:',
    toAvoid: [
      'Michezo yenye mshtuko mkubwa (kukimbia kwa kasi, michezo ya raketi ya kasi)',
      'Shughuli zenye hatari ya kuanguka (kuteleza kwenye theluji, kupanda farasi, kuendesha baiskeli kwenye ardhi mbaya)',
      'Michezo ya kugusana au ya mapigano',
      'Juhudi kali mahali pa juu au kwenye joto kali sana',
    ],
    listenSigns: [
      'Upungufu wa pumzi au kizunguzungu kisicho cha kawaida',
      'Maumivu, kutokwa damu, au mikazo wakati wa juhudi',
      'Uchovu usioisha baada ya kupumzika',
    ],
    neutralText: 'Sikiliza daima ishara za mwili wako na zungumza na mkunga au daktari wako kabla ya kuanza au kubadilisha shughuli ya mwili.',
    tipTitle: 'Vyema kujua',
    tipText: 'Shughuli za upole na za mara kwa mara zina manufaa kwa ujauzito mwingi: jambo kuu ni kurekebisha ukali kulingana na kila hatua na unavyojisikia.',
    shareMessage: 'Kubaki mchangamfu wakati wa ujauzito — AWA',
  },
  kk: {
    badge: 'ЖҮКТІЛІК • ДЕНЕ БЕЛСЕНДІЛІГІ',
    title: 'Жүктілік кезінде\nбелсенді болу',
    metaDuration: '5 мин оқу',
    metaType: 'Нұсқаулық',
    metaLevel: 'Бастауыш',
    metaValidated: 'Тексерілген мазмұн',
    intro: 'Әр триместрде жұмсақ, қауіпсіз түрде белсенді болып қалу.',
    contentsTitle: 'Осы мақалада',
    topics: [
      'Ұсынылатын белсенділіктер',
      'Нені болдырмаған жөн',
      'Денеңіздің белгілерін тыңдау',
      'Ескерту',
      'Негізгі қорытынды',
    ],
    body1: 'Серуендеу, жүзу және жүкті әйелдерге арналған йога жүктілік бойы, өзіңізді қалай сезінетініңізге сай қарқынмен әдетте ұсынылады.',
    recommended: ['Серуендеу', 'Жүзу', 'Жүкті әйелдерге арналған йога'],
    body2: 'Жоғары соққылы спорттан немесе құлау қаупі бар белсенділіктерден, әсіресе екінші триместрден бастап, аулақ болыңыз:',
    toAvoid: [
      'Жоғары соққылы спорт (қарқынды жүгіру, жылдам ракеткалы спорт)',
      'Құлау қаупі бар белсенділіктер (шаңғы, ат спорты, тегіс емес жерде велосипед тебу)',
      'Жанасу немесе жекпе-жек спорты',
      'Биіктікте немесе өте ыстық жерде қарқынды күш салу',
    ],
    listenSigns: [
      'Әдеттен тыс тыныс жетіспеушілігі немесе бас айналу',
      'Күш салу кезіндегі ауыру, қан кету немесе жиырылулар',
      'Демалғаннан кейін де басылмайтын шаршау',
    ],
    neutralText: 'Денеңіздің белгілерін әрқашан тыңдаңыз және дене белсенділігін бастамас немесе өзгертпес бұрын акушеріңізбен немесе дәрігеріңізбен сөйлесіңіз.',
    tipTitle: 'Білуге тиісті',
    tipText: 'Жұмсақ, тұрақты белсенділік жүктіліктердің көпшілігіне пайдалы: негізгі нәрсе — қарқындылықты әр кезеңге және өзіңізді қалай сезінетініңізге бейімдеу.',
    shareMessage: 'Жүктілік кезінде белсенді болу — AWA',
  },
  wo: {
    badge: 'ËMB • JËFU YARAM',
    title: 'Nekk ci jëf\nci sa ëmb',
    metaDuration: '5 simili jàng',
    metaType: 'Ndigal',
    metaLevel: 'Tàmbali',
    metaValidated: 'Mbind bu ñu seetlu',
    intro: 'Nekk ci jëf ak lewet, ak aar, ci trimestr bu nekk.',
    contentsTitle: 'Ci bind bii',
    topics: [
      'Jëf yi ñuy digal',
      'Li gëna baax a moytu',
      'Déglu màndargay sa yaram',
      'Teg',
      'Li am solo',
    ],
    body1: 'Dox, dox ci ndox ak yoga ngir ëmb ñuy digal leen ci ëmb gépp, ci ritm bu méngoo naka nga di dégg.',
    recommended: ['Dox', 'Dox ci ndox', 'Yoga ngir ëmb'],
    body2: 'Moytu sport yu metti walla jëf yu am ndiggalu daanu, lool ci trimestr bu ñaareel:',
    toAvoid: [
      'Sport yu metti (daw bu metti, sport yu raket yu gaaw)',
      'Jëf yu am ndiggalu daanu (ski, yëngu fas, welo ci suuf bu mbootaay)',
      'Sport yu laal walla yu xeex',
      'Coono bu metti ci kaw walla ci tàngoor bu ëpp',
    ],
    listenSigns: [
      'Noppiku bu jafe walla doxandéem bu cosaanul',
      'Metit, deret walla tëx yu bérëb ndey ci jamonoy jëf',
      'Sonn bu dem te noppalu ba noppi',
    ],
    neutralText: 'Déglul saa su ne màndargay sa yaram te wax ak sa ndey-jur walla sa doktoor balaa nga tàmbali walla soppi benn jëfu yaram.',
    tipTitle: 'Lu baax a xam',
    tipText: 'Jëf bu lewet te bu sax am njariñ ci ëmb yu bari: li am solo mooy defar dayo bi ci ñaar fuñ bu nekk ak naka nga di dégg.',
    shareMessage: 'Nekk ci jëf ci sa ëmb — AWA',
  },
  ha: {
    badge: 'CIKI • MOTSA JIKI',
    title: 'Ci gaba da motsa jiki\nlokacin ciki',
    metaDuration: 'karatun minti 5',
    metaType: 'Jagora',
    metaLevel: 'Mafari',
    metaValidated: 'Abun da aka duba',
    intro: 'Ci gaba da motsa jiki a hankali, cikin aminci, a kowane kashi.',
    contentsTitle: 'A cikin wannan labari',
    topics: [
      'Ayyukan da aka ba da shawara',
      'Abin da ya fi kyau a guje wa',
      'Sauraron alamomin jikinki',
      'Lura',
      'Muhimmin abu',
    ],
    body1: 'Tafiya, ninƙaya, da yoga na ciki gabaɗaya ana ba da shawarar su a duk lokacin ciki, bisa saurin da ya dace da yadda kike ji.',
    recommended: ['Tafiya', 'Ninƙaya', 'Yoga na ciki'],
    body2: 'Guje wa wasanni masu tasiri mai yawa ko ayyukan da ke da haɗarin faɗuwa, musamman daga kashi na biyu:',
    toAvoid: [
      'Wasanni masu tasiri mai yawa (gudu mai tsanani, wasannin racquet masu sauri)',
      'Ayyukan da ke da haɗarin faɗuwa (wasan kankara, hawan doki, hawan keke a hanya mai tsauri)',
      'Wasannin gwagwarmaya ko faɗa',
      'Ƙoƙari mai tsanani a tudu mai tsayi ko zafi mai tsanani',
    ],
    listenSigns: [
      'Ƙarancin numfashi ko jiri ba na al’ada ba',
      'Ciwo, zubar jini, ko matsewa yayin ƙoƙari',
      'Gajiya da ba ta ƙarewa bayan hutu',
    ],
    neutralText: 'Koyaushe saurari alamomin jikinki kuma yi magana da ungozomarki ko likitanki kafin fara ko canza motsa jiki.',
    tipTitle: 'Abin da ya dace a sani',
    tipText: 'Motsa jiki mai laushi, na yau da kullum yana da amfani ga yawancin ciki: mabuɗin shi ne daidaita ƙarfi da kowane mataki da yadda kike ji.',
    shareMessage: 'Ci gaba da motsa jiki lokacin ciki — AWA',
  },
  am: {
    badge: 'እርግዝና • የአካል እንቅስቃሴ',
    title: 'በእርግዝና ጊዜ\nንቁ መሆን',
    metaDuration: '5 ደቂቃ ንባብ',
    metaType: 'መመሪያ',
    metaLevel: 'ጀማሪ',
    metaValidated: 'የተገመገመ ይዘት',
    intro: 'በእያንዳንዱ ሦስት ወር ጊዜ በቀስታና በደህንነት ንቁ መሆን።',
    contentsTitle: 'በዚህ ጽሑፍ ውስጥ',
    topics: [
      'የሚመከሩ እንቅስቃሴዎች',
      'ቢወገድ የሚሻለው',
      'የሰውነትሽን ምልክቶች ማዳመጥ',
      'ማስታወሻ',
      'ዋና ነጥብ',
    ],
    body1: 'የእግር ጉዞ፣ መዋኘት እና ለእርጉዞች የተዘጋጀ ዮጋ በአጠቃላይ በእርግዝና ጊዜ ሁሉ ይመከራሉ፣ ከሚሰማሽ ጋር በሚስማማ ፍጥነት።',
    recommended: ['የእግር ጉዞ', 'መዋኘት', 'ለእርጉዞች ዮጋ'],
    body2: 'ከፍተኛ ድንጋጤ ያላቸው ስፖርቶችን ወይም የመውደቅ አደጋ ያላቸውን እንቅስቃሴዎች አስወግጂ፣ በተለይ ከሁለተኛው ሦስት ወር ጀምሮ፦',
    toAvoid: [
      'ከፍተኛ ድንጋጤ ያላቸው ስፖርቶች (ከባድ ሩጫ፣ ፈጣን የራኬት ስፖርቶች)',
      'የመውደቅ አደጋ ያላቸው እንቅስቃሴዎች (ስኪንግ፣ ፈረስ ግልቢያ፣ በወጣ ገባ መሬት ላይ ብስክሌት)',
      'የግንኙነት ወይም የትግል ስፖርቶች',
      'በከፍታ ቦታ ወይም በከፍተኛ ሙቀት ከባድ ጥረት',
    ],
    listenSigns: [
      'ያልተለመደ የትንፋሽ ማጠር ወይም ማዞር',
      'በጥረት ጊዜ ህመም፣ ደም መፍሰስ ወይም መኮማተር',
      'ከእረፍት በኋላ የማይጠፋ ድካም',
    ],
    neutralText: 'ሁልጊዜ የሰውነትሽን ምልክቶች አዳምጪ እና የአካል እንቅስቃሴ ከመጀመርሽ ወይም ከመቀየርሽ በፊት ከሚድዋይፍሽ ወይም ከሐኪምሽ ጋር ተነጋገሪ።',
    tipTitle: 'ማወቅ ጠቃሚ ነው',
    tipText: 'ለስላሳ፣ መደበኛ እንቅስቃሴ ለአብዛኞቹ እርግዝናዎች ጠቃሚ ነው፦ ቁልፉ ጥንካሬውን ከእያንዳንዱ ደረጃ እና ከሚሰማሽ ጋር ማስተካከል ነው።',
    shareMessage: 'በእርግዝና ጊዜ ንቁ መሆን — AWA',
  },
  nl: {
    badge: 'ZWANGERSCHAP • LICHAMELIJKE ACTIVITEIT',
    title: 'Actief blijven\ntijdens de zwangerschap',
    metaDuration: '5 min lezen',
    metaType: 'Gids',
    metaLevel: 'Beginner',
    metaValidated: 'Gecontroleerde inhoud',
    intro: 'Rustig actief blijven, veilig, in elk trimester.',
    contentsTitle: 'In dit artikel',
    topics: [
      'Aanbevolen activiteiten',
      'Wat je het beste vermijdt',
      'Luisteren naar de signalen van je lichaam',
      'Opmerking',
      'Belangrijkste punt',
    ],
    body1: 'Wandelen, zwemmen en zwangerschapsyoga worden over het algemeen tijdens de hele zwangerschap aanbevolen, in een tempo dat past bij hoe je je voelt.',
    recommended: ['Wandelen', 'Zwemmen', 'Zwangerschapsyoga'],
    body2: 'Vermijd sporten met hoge impact of activiteiten met valrisico, vooral vanaf het tweede trimester:',
    toAvoid: [
      'Sporten met hoge impact (intensief hardlopen, snelle racketsporten)',
      'Activiteiten met valrisico (skiën, paardrijden, fietsen op ruw terrein)',
      'Contact- of vechtsporten',
      'Intensieve inspanning op hoogte of in extreme hitte',
    ],
    listenSigns: [
      'Ongewone kortademigheid of duizeligheid',
      'Pijn, bloedverlies of samentrekkingen tijdens inspanning',
      'Vermoeidheid die na rust niet overgaat',
    ],
    neutralText: 'Luister altijd naar de signalen van je lichaam en praat met je verloskundige of arts voordat je een lichamelijke activiteit begint of verandert.',
    tipTitle: 'Goed om te weten',
    tipText: 'Zachte, regelmatige activiteit is gunstig bij de meeste zwangerschappen: de sleutel is de intensiteit aan te passen aan elke fase en aan hoe je je voelt.',
    shareMessage: 'Actief blijven tijdens de zwangerschap — AWA',
  },
  fi: {
    badge: 'RASKAUS • LIIKUNTA',
    title: 'Aktiivisena pysyminen\nraskauden aikana',
    metaDuration: '5 min lukuaika',
    metaType: 'Opas',
    metaLevel: 'Aloittelija',
    metaValidated: 'Tarkistettu sisältö',
    intro: 'Rauhallisesti aktiivisena pysyminen, turvallisesti, jokaisessa kolmanneksessa.',
    contentsTitle: 'Tässä artikkelissa',
    topics: [
      'Suositeltavat toiminnot',
      'Mitä on parasta välttää',
      'Kehosi signaalien kuunteleminen',
      'Huomautus',
      'Tärkein asia',
    ],
    body1: 'Kävelyä, uintia ja raskausjoogaa suositellaan yleensä koko raskauden ajan olosi mukaisessa tahdissa.',
    recommended: ['Kävely', 'Uinti', 'Raskausjooga'],
    body2: 'Vältä voimakasta rasitusta sisältäviä urheilulajeja tai toimintoja, joihin liittyy kaatumisen riski, erityisesti toisesta kolmanneksesta alkaen:',
    toAvoid: [
      'Voimakasta rasitusta sisältävät urheilulajit (intensiivinen juoksu, nopeatempoiset mailapelit)',
      'Toiminnot, joihin liittyy kaatumisen riski (laskettelu, ratsastus, pyöräily epätasaisessa maastossa)',
      'Kontakti- tai kamppailulajit',
      'Intensiivinen rasitus korkealla tai äärimmäisessä kuumuudessa',
    ],
    listenSigns: [
      'Epätavallinen hengenahdistus tai huimaus',
      'Kipu, vuoto tai supistukset rasituksen aikana',
      'Väsymys, joka ei hellitä levon jälkeen',
    ],
    neutralText: 'Kuuntele aina kehosi signaaleja ja puhu kätilösi tai lääkärisi kanssa ennen liikunnan aloittamista tai muuttamista.',
    tipTitle: 'Hyvä tietää',
    tipText: 'Lempeä, säännöllinen liikunta on hyödyllistä useimmissa raskauksissa: avain on mukauttaa voimakkuus kuhunkin vaiheeseen ja olosi mukaan.',
    shareMessage: 'Aktiivisena pysyminen raskauden aikana — AWA',
  },
  el: {
    badge: 'ΕΓΚΥΜΟΣΥΝΗ • ΣΩΜΑΤΙΚΗ ΔΡΑΣΤΗΡΙΟΤΗΤΑ',
    title: 'Παραμένοντας δραστήρια\nστην εγκυμοσύνη',
    metaDuration: '5 λεπτά ανάγνωσης',
    metaType: 'Οδηγός',
    metaLevel: 'Αρχάριο',
    metaValidated: 'Ελεγμένο περιεχόμενο',
    intro: 'Παραμένοντας ήπια δραστήρια, με ασφάλεια, σε κάθε τρίμηνο.',
    contentsTitle: 'Σε αυτό το άρθρο',
    topics: [
      'Συνιστώμενες δραστηριότητες',
      'Τι είναι καλύτερα να αποφεύγεται',
      'Ακούγοντας τα σήματα του σώματός σου',
      'Σημείωση',
      'Βασικό συμπέρασμα',
    ],
    body1: 'Το περπάτημα, η κολύμβηση και η προγεννητική γιόγκα συνιστώνται γενικά σε όλη τη διάρκεια της εγκυμοσύνης, με ρυθμό που ταιριάζει στο πώς νιώθεις.',
    recommended: ['Περπάτημα', 'Κολύμβηση', 'Προγεννητική γιόγκα'],
    body2: 'Απόφυγε αθλήματα ή δραστηριότητες υψηλής κρούσης ή με κίνδυνο πτώσης, ιδίως από το δεύτερο τρίμηνο και μετά:',
    toAvoid: [
      'Αθλήματα υψηλής κρούσης (έντονο τρέξιμο, αθλήματα ρακέτας με γρήγορο ρυθμό)',
      'Δραστηριότητες με κίνδυνο πτώσης (σκι, ιππασία, ποδηλασία σε ανώμαλο έδαφος)',
      'Αθλήματα επαφής ή μάχης',
      'Έντονη προσπάθεια σε υψόμετρο ή σε ακραία ζέστη',
    ],
    listenSigns: [
      'Ασυνήθιστη δύσπνοια ή ζάλη',
      'Πόνος, αιμορραγία ή συσπάσεις κατά την προσπάθεια',
      'Κόπωση που δεν περνά μετά την ξεκούραση',
    ],
    neutralText: 'Άκου πάντα τα σήματα του σώματός σου και μίλησε με τη μαία ή τον γιατρό σου πριν ξεκινήσεις ή αλλάξεις μια σωματική δραστηριότητα.',
    tipTitle: 'Καλό είναι να γνωρίζεις',
    tipText: 'Η ήπια, τακτική δραστηριότητα είναι ωφέλιμη για τις περισσότερες εγκυμοσύνες: το κλειδί είναι η προσαρμογή της έντασης σε κάθε στάδιο και στο πώς νιώθεις.',
    shareMessage: 'Παραμένοντας δραστήρια στην εγκυμοσύνη — AWA',
  },
  fil: {
    badge: 'PAGBUBUNTIS • PISIKAL NA AKTIBIDAD',
    title: 'Pananatiling aktibo\nsa panahon ng pagbubuntis',
    metaDuration: '5 min na babasahin',
    metaType: 'Gabay',
    metaLevel: 'Baguhan',
    metaValidated: 'Sinuring nilalaman',
    intro: 'Pananatiling banayad na aktibo, nang ligtas, sa bawat trimester.',
    contentsTitle: 'Sa artikulong ito',
    topics: [
      'Mga inirerekomendang gawain',
      'Ang pinakamainam na iwasan',
      'Pakikinig sa mga senyales ng iyong katawan',
      'Paalala',
      'Pangunahing dapat tandaan',
    ],
    body1: 'Karaniwang inirerekomenda sa buong pagbubuntis ang paglalakad, paglangoy, at prenatal yoga, sa bilis na tugma sa nararamdaman mo.',
    recommended: ['Paglalakad', 'Paglangoy', 'Prenatal yoga'],
    body2: 'Iwasan ang mga isport o gawaing may malakas na impact o may panganib na mahulog, lalo na mula sa ikalawang trimester:',
    toAvoid: [
      'Mga isport na may malakas na impact (matinding pagtakbo, mabilis na racquet sports)',
      'Mga gawaing may panganib na mahulog (pag-iiski, pangangabayo, pagbibisikleta sa magaspang na lupa)',
      'Mga contact o combat sport',
      'Matinding pagsisikap sa mataas na lugar o sa matinding init',
    ],
    listenSigns: [
      'Hindi pangkaraniwang hirap sa paghinga o pagkahilo',
      'Sakit, pagdurugo, o pagkontrata habang nag-eehersisyo',
      'Pagod na hindi nawawala pagkatapos magpahinga',
    ],
    neutralText: 'Palaging pakinggan ang mga senyales ng iyong katawan at makipag-usap sa iyong midwife o doktor bago magsimula o magbago ng pisikal na aktibidad.',
    tipTitle: 'Mabuting malaman',
    tipText: 'Kapaki-pakinabang sa karamihan ng pagbubuntis ang banayad at regular na aktibidad: ang susi ay iangkop ang tindi sa bawat yugto at sa nararamdaman mo.',
    shareMessage: 'Pananatiling aktibo sa panahon ng pagbubuntis — AWA',
  },
  ta: {
    badge: 'கர்ப்பம் • உடல் செயல்பாடு',
    title: 'கர்ப்ப காலத்தில்\nசுறுசுறுப்பாக இருத்தல்',
    metaDuration: '5 நிமிடம் படிக்க',
    metaType: 'வழிகாட்டி',
    metaLevel: 'தொடக்க நிலை',
    metaValidated: 'மதிப்பாய்வு செய்யப்பட்ட உள்ளடக்கம்',
    intro: 'ஒவ்வொரு மூன்று மாதத்திலும் மென்மையாக, பாதுகாப்பாக, சுறுசுறுப்பாக இருத்தல்.',
    contentsTitle: 'இந்தக் கட்டுரையில்',
    topics: [
      'பரிந்துரைக்கப்படும் செயல்பாடுகள்',
      'தவிர்ப்பது நல்லது',
      'உங்கள் உடலின் சமிக்ஞைகளைக் கேட்டல்',
      'குறிப்பு',
      'முக்கியக் குறிப்பு',
    ],
    body1: 'நடைப்பயிற்சி, நீச்சல் மற்றும் கர்ப்பகால யோகா பொதுவாகக் கர்ப்பம் முழுவதும், நீங்கள் உணரும் வேகத்துக்கு ஏற்ப, பரிந்துரைக்கப்படுகின்றன.',
    recommended: ['நடைப்பயிற்சி', 'நீச்சல்', 'கர்ப்பகால யோகா'],
    body2: 'அதிக அதிர்ச்சி தரும் விளையாட்டுகளையோ கீழே விழும் அபாயமுள்ள செயல்பாடுகளையோ, குறிப்பாக இரண்டாவது மூன்று மாதத்திலிருந்து, தவிருங்கள்:',
    toAvoid: [
      'அதிக அதிர்ச்சி தரும் விளையாட்டுகள் (தீவிர ஓட்டம், வேகமான ராக்கெட் விளையாட்டுகள்)',
      'கீழே விழும் அபாயமுள்ள செயல்பாடுகள் (பனிச்சறுக்கு, குதிரையேற்றம், கரடுமுரடான நிலத்தில் சைக்கிள் ஓட்டுதல்)',
      'தொடர்பு அல்லது சண்டை விளையாட்டுகள்',
      'உயரமான இடத்திலோ கடும் வெப்பத்திலோ தீவிர உழைப்பு',
    ],
    listenSigns: [
      'வழக்கத்துக்கு மாறான மூச்சுத் திணறல் அல்லது தலைச்சுற்றல்',
      'உழைப்பின்போது வலி, இரத்தப்போக்கு அல்லது சுருக்கங்கள்',
      'ஓய்வெடுத்த பின்னும் நீங்காத சோர்வு',
    ],
    neutralText: 'உங்கள் உடலின் சமிக்ஞைகளை எப்போதும் கவனியுங்கள், ஒரு உடல் செயல்பாட்டைத் தொடங்கும் முன் அல்லது மாற்றும் முன் உங்கள் மருத்துவச்சி அல்லது மருத்துவரிடம் பேசுங்கள்.',
    tipTitle: 'தெரிந்துகொள்ளுங்கள்',
    tipText: 'மென்மையான, ஒழுங்கான செயல்பாடு பெரும்பாலான கர்ப்பங்களுக்கு நன்மை தரும்: ஒவ்வொரு கட்டத்துக்கும் நீங்கள் உணரும் விதத்துக்கும் ஏற்பத் தீவிரத்தை மாற்றியமைப்பதே முக்கியம்.',
    shareMessage: 'கர்ப்ப காலத்தில் சுறுசுறுப்பாக இருத்தல் — AWA',
  },
  te: {
    badge: 'గర్భం • శారీరక కార్యకలాపం',
    title: 'గర్భధారణ సమయంలో\nచురుకుగా ఉండటం',
    metaDuration: '5 నిమిషాల పఠనం',
    metaType: 'గైడ్',
    metaLevel: 'ప్రారంభ స్థాయి',
    metaValidated: 'మదింపు చేసిన కంటెంట్',
    intro: 'ప్రతి త్రైమాసికంలో మృదువుగా, సురక్షితంగా చురుకుగా ఉండటం.',
    contentsTitle: 'ఈ వ్యాసంలో',
    topics: [
      'సిఫార్సు చేయబడే కార్యకలాపాలు',
      'తప్పించుకోవడం మంచిది',
      'మీ శరీర సంకేతాలను వినడం',
      'గమనిక',
      'ముఖ్య సారాంశం',
    ],
    body1: 'నడక, ఈత, గర్భకాల యోగా సాధారణంగా గర్భధారణ అంతటా, మీకు అనిపించే వేగానికి అనుగుణంగా సిఫార్సు చేయబడతాయి.',
    recommended: ['నడక', 'ఈత', 'గర్భకాల యోగా'],
    body2: 'అధిక అదురుపాటు ఉన్న క్రీడలను లేదా పడిపోయే ప్రమాదం ఉన్న కార్యకలాపాలను, ముఖ్యంగా రెండవ త్రైమాసికం నుండి, తప్పించుకోండి:',
    toAvoid: [
      'అధిక అదురుపాటు క్రీడలు (తీవ్ర పరుగు, వేగమైన రాకెట్ క్రీడలు)',
      'పడిపోయే ప్రమాదం ఉన్న కార్యకలాపాలు (స్కీయింగ్, గుర్రపు స్వారీ, కఠినమైన భూభాగంలో సైక్లింగ్)',
      'సంపర్క లేదా పోరాట క్రీడలు',
      'ఎత్తైన ప్రదేశంలో లేదా తీవ్రమైన వేడిలో తీవ్ర శ్రమ',
    ],
    listenSigns: [
      'అసాధారణ శ్వాస ఇబ్బంది లేదా తలతిరుగుడు',
      'శ్రమ సమయంలో నొప్పి, రక్తస్రావం లేదా సంకోచాలు',
      'విశ్రాంతి తీసుకున్న తర్వాత కూడా పోని అలసట',
    ],
    neutralText: 'మీ శరీర సంకేతాలను ఎల్లప్పుడూ వినండి, ఒక శారీరక కార్యకలాపాన్ని మొదలుపెట్టే ముందు లేదా మార్చే ముందు మీ మంత్రసాని లేదా వైద్యులతో మాట్లాడండి.',
    tipTitle: 'తెలుసుకోవాల్సినవి',
    tipText: 'మృదువైన, క్రమమైన కార్యకలాపం చాలా గర్భాలకు ప్రయోజనకరం: ప్రతి దశకు, మీకు అనిపించే విధానానికి అనుగుణంగా తీవ్రతను మార్చడమే కీలకం.',
    shareMessage: 'గర్భధారణ సమయంలో చురుకుగా ఉండటం — AWA',
  },
  mr: {
    badge: 'गर्भारपण • शारीरिक हालचाल',
    title: 'गर्भारपणात\nसक्रिय राहणे',
    metaDuration: '5 मिनिटे वाचन',
    metaType: 'मार्गदर्शक',
    metaLevel: 'प्रारंभ स्तर',
    metaValidated: 'पुनरावलोकन केलेला मजकूर',
    intro: 'प्रत्येक तिमाहीत हळुवारपणे, सुरक्षितपणे सक्रिय राहणे.',
    contentsTitle: 'या लेखात',
    topics: [
      'शिफारस केलेल्या हालचाली',
      'काय टाळणे चांगले',
      'तुमच्या शरीराचे संकेत ऐकणे',
      'टीप',
      'मुख्य मुद्दा',
    ],
    body1: 'चालणे, पोहणे आणि गर्भारपणासाठीचा योग हे साधारणपणे संपूर्ण गर्भारपणात, तुम्हाला जुळणाऱ्या गतीने शिफारस केले जातात.',
    recommended: ['चालणे', 'पोहणे', 'गर्भारपणासाठीचा योग'],
    body2: 'जोराचा आघात होणारे खेळ किंवा पडण्याचा धोका असलेल्या हालचाली टाळा, विशेषतः दुसऱ्या तिमाहीपासून:',
    toAvoid: [
      'जोराचा आघात होणारे खेळ (तीव्र धावणे, वेगवान रॅकेट खेळ)',
      'पडण्याचा धोका असलेल्या हालचाली (स्कीइंग, घोडेस्वारी, खडबडीत भूभागावर सायकलिंग)',
      'संपर्क किंवा झुंजीचे खेळ',
      'उंचीवर किंवा अति उष्णतेत तीव्र श्रम',
    ],
    listenSigns: [
      'असामान्य धाप लागणे किंवा चक्कर येणे',
      'श्रमादरम्यान वेदना, रक्तस्राव किंवा आकुंचने',
      'विश्रांतीनंतरही न जाणारा थकवा',
    ],
    neutralText: 'तुमच्या शरीराचे संकेत नेहमी ऐका आणि शारीरिक हालचाल सुरू करण्यापूर्वी किंवा बदलण्यापूर्वी तुमच्या दाईशी किंवा डॉक्टरांशी बोला.',
    tipTitle: 'हे जाणून घ्या',
    tipText: 'हळुवार, नियमित हालचाल बहुतेक गर्भारपणांसाठी फायदेशीर आहे: प्रत्येक टप्प्याला आणि तुम्हाला कसे वाटते त्यानुसार तीव्रता जुळवणे हीच गुरुकिल्ली आहे.',
    shareMessage: 'गर्भारपणात सक्रिय राहणे — AWA',
  },
  gu: {
    badge: 'ગર્ભાવસ્થા • શારીરિક પ્રવૃત્તિ',
    title: 'ગર્ભાવસ્થા દરમિયાન\nસક્રિય રહેવું',
    metaDuration: '5 મિનિટ વાંચન',
    metaType: 'માર્ગદર્શિકા',
    metaLevel: 'પ્રારંભિક સ્તર',
    metaValidated: 'પુનરાવલોકન કરેલી સામગ્રી',
    intro: 'દરેક ત્રિમાસિકમાં સુરક્ષિત રીતે હળવું સક્રિય રહેવું.',
    contentsTitle: 'આ લેખમાં',
    topics: [
      'ભલામણ કરેલી પ્રવૃત્તિઓ',
      'શું ટાળવું વધુ સારું',
      'તમારા શરીરના સંકેતો સાંભળવા',
      'નોંધ',
      'મુખ્ય મુદ્દો',
    ],
    body1: 'ચાલવું, તરવું અને પ્રસૂતિ પહેલાંનો યોગ સામાન્ય રીતે સમગ્ર ગર્ભાવસ્થા દરમિયાન ભલામણ કરાય છે, તમને જેવું લાગે તે ગતિએ.',
    recommended: ['ચાલવું', 'તરવું', 'પ્રસૂતિ પહેલાંનો યોગ'],
    body2: 'ઝટકા લાગે તેવી રમતો કે પડવાનું જોખમ હોય તેવી પ્રવૃત્તિઓ ટાળો, ખાસ કરીને બીજા ત્રિમાસિકથી:',
    toAvoid: [
      'ઝટકા લાગે તેવી રમતો (તીવ્ર દોડ, ઝડપી રેકેટ રમતો)',
      'પડવાનું જોખમ હોય તેવી પ્રવૃત્તિઓ (સ્કીઇંગ, ઘોડેસવારી, ખરબચડા રસ્તા પર સાઇકલ ચલાવવી)',
      'સંપર્ક કે લડાઈવાળી રમતો',
      'ઊંચાઈ પર કે અતિશય ગરમીમાં તીવ્ર શ્રમ',
    ],
    listenSigns: [
      'અસામાન્ય શ્વાસ ચઢવો કે ચક્કર આવવા',
      'શ્રમ દરમિયાન દુખાવો, રક્તસ્રાવ કે સંકોચન',
      'આરામ પછી પણ દૂર ન થતો થાક',
    ],
    neutralText: 'હંમેશાં તમારા શરીરના સંકેતો સાંભળો અને શારીરિક પ્રવૃત્તિ શરૂ કરતા કે બદલતા પહેલાં તમારી મિડવાઇફ અથવા ડૉક્ટર સાથે વાત કરો.',
    tipTitle: 'જાણવા જેવું',
    tipText: 'હળવી, નિયમિત પ્રવૃત્તિ મોટા ભાગની ગર્ભાવસ્થા માટે લાભદાયી છે: મુખ્ય વાત દરેક તબક્કા અને તમને કેવું લાગે છે તે પ્રમાણે તીવ્રતા ગોઠવવાની છે.',
    shareMessage: 'ગર્ભાવસ્થા દરમિયાન સક્રિય રહેવું — AWA',
  },
  pa: {
    badge: 'ਗਰਭ-ਅਵਸਥਾ • ਸਰੀਰਕ ਸਰਗਰਮੀ',
    title: 'ਗਰਭ-ਅਵਸਥਾ ਦੌਰਾਨ\nਸਰਗਰਮ ਰਹਿਣਾ',
    metaDuration: '5 ਮਿੰਟ ਪੜ੍ਹਨ',
    metaType: 'ਗਾਈਡ',
    metaLevel: 'ਸ਼ੁਰੂਆਤੀ ਪੱਧਰ',
    metaValidated: 'ਸਮੀਖਿਆ ਕੀਤੀ ਸਮੱਗਰੀ',
    intro: 'ਹਰ ਤਿਮਾਹੀ ਵਿੱਚ ਹਲਕੇ ਢੰਗ ਨਾਲ, ਸੁਰੱਖਿਅਤ ਤਰੀਕੇ ਨਾਲ ਸਰਗਰਮ ਰਹਿਣਾ।',
    contentsTitle: 'ਇਸ ਲੇਖ ਵਿੱਚ',
    topics: [
      'ਸਿਫ਼ਾਰਸ਼ ਕੀਤੀਆਂ ਸਰਗਰਮੀਆਂ',
      'ਕਿਸ ਤੋਂ ਬਚਣਾ ਬਿਹਤਰ ਹੈ',
      'ਆਪਣੇ ਸਰੀਰ ਦੇ ਸੰਕੇਤ ਸੁਣਨਾ',
      'ਨੋਟ',
      'ਮੁੱਖ ਨੁਕਤਾ',
    ],
    body1: 'ਪੈਦਲ ਚੱਲਣਾ, ਤੈਰਾਕੀ ਅਤੇ ਗਰਭ-ਅਵਸਥਾ ਦਾ ਯੋਗ ਆਮ ਤੌਰ ਉੱਤੇ ਪੂਰੀ ਗਰਭ-ਅਵਸਥਾ ਦੌਰਾਨ ਸਿਫ਼ਾਰਸ਼ ਕੀਤੇ ਜਾਂਦੇ ਹਨ, ਉਸ ਰਫ਼ਤਾਰ ਨਾਲ ਜੋ ਤੁਹਾਡੇ ਮਹਿਸੂਸ ਕਰਨ ਨਾਲ ਮੇਲ ਖਾਂਦੀ ਹੋਵੇ।',
    recommended: ['ਪੈਦਲ ਚੱਲਣਾ', 'ਤੈਰਾਕੀ', 'ਗਰਭ-ਅਵਸਥਾ ਦਾ ਯੋਗ'],
    body2: 'ਜ਼ੋਰਦਾਰ ਝਟਕਿਆਂ ਵਾਲੀਆਂ ਖੇਡਾਂ ਜਾਂ ਡਿੱਗਣ ਦੇ ਖ਼ਤਰੇ ਵਾਲੀਆਂ ਸਰਗਰਮੀਆਂ ਤੋਂ ਬਚੋ, ਖ਼ਾਸ ਕਰਕੇ ਦੂਜੀ ਤਿਮਾਹੀ ਤੋਂ ਬਾਅਦ:',
    toAvoid: [
      'ਜ਼ੋਰਦਾਰ ਝਟਕਿਆਂ ਵਾਲੀਆਂ ਖੇਡਾਂ (ਤੇਜ਼ ਦੌੜ, ਤੇਜ਼ ਰਫ਼ਤਾਰ ਵਾਲੀਆਂ ਰੈਕੇਟ ਖੇਡਾਂ)',
      'ਡਿੱਗਣ ਦੇ ਖ਼ਤਰੇ ਵਾਲੀਆਂ ਸਰਗਰਮੀਆਂ (ਸਕੀਇੰਗ, ਘੋੜਸਵਾਰੀ, ਉੱਬੜ-ਖਾਬੜ ਰਾਹਾਂ ਉੱਤੇ ਸਾਈਕਲ ਚਲਾਉਣਾ)',
      'ਸੰਪਰਕ ਵਾਲੀਆਂ ਜਾਂ ਲੜਾਈ ਵਾਲੀਆਂ ਖੇਡਾਂ',
      'ਉਚਾਈ ਉੱਤੇ ਜਾਂ ਬਹੁਤ ਗਰਮੀ ਵਿੱਚ ਤੀਬਰ ਮਿਹਨਤ',
    ],
    listenSigns: [
      'ਅਸਾਧਾਰਨ ਸਾਹ ਚੜ੍ਹਨਾ ਜਾਂ ਚੱਕਰ ਆਉਣਾ',
      'ਮਿਹਨਤ ਦੌਰਾਨ ਦਰਦ, ਖ਼ੂਨ ਵਹਿਣਾ ਜਾਂ ਸੰਕੁਚਨ',
      'ਥਕਾਵਟ ਜੋ ਆਰਾਮ ਕਰਨ ਤੋਂ ਬਾਅਦ ਵੀ ਨਾ ਜਾਵੇ',
    ],
    neutralText: 'ਹਮੇਸ਼ਾ ਆਪਣੇ ਸਰੀਰ ਦੇ ਸੰਕੇਤ ਸੁਣੋ ਅਤੇ ਕੋਈ ਸਰੀਰਕ ਸਰਗਰਮੀ ਸ਼ੁਰੂ ਕਰਨ ਜਾਂ ਬਦਲਣ ਤੋਂ ਪਹਿਲਾਂ ਆਪਣੀ ਮਿਡਵਾਈਫ਼ ਜਾਂ ਡਾਕਟਰ ਨਾਲ ਗੱਲ ਕਰੋ।',
    tipTitle: 'ਜਾਣਨ ਯੋਗ',
    tipText: 'ਹਲਕੀ, ਨਿਯਮਿਤ ਸਰਗਰਮੀ ਜ਼ਿਆਦਾਤਰ ਗਰਭ-ਅਵਸਥਾਵਾਂ ਲਈ ਫ਼ਾਇਦੇਮੰਦ ਹੈ: ਅਸਲ ਗੱਲ ਇਹ ਹੈ ਕਿ ਤੀਬਰਤਾ ਨੂੰ ਹਰ ਪੜਾਅ ਅਤੇ ਤੁਹਾਡੇ ਮਹਿਸੂਸ ਕਰਨ ਮੁਤਾਬਕ ਢਾਲਿਆ ਜਾਵੇ।',
    shareMessage: 'ਗਰਭ-ਅਵਸਥਾ ਦੌਰਾਨ ਸਰਗਰਮ ਰਹਿਣਾ — AWA',
  },
  my: {
    badge: 'ကိုယ်ဝန်ဆောင်ခြင်း • ကိုယ်လက်လှုပ်ရှားမှု',
    title: 'ကိုယ်ဝန်ဆောင်စဉ်\nတက်ကြွစွာနေခြင်း',
    metaDuration: 'ဖတ်ချိန် 5 မိနစ်',
    metaType: 'လမ်းညွှန်',
    metaLevel: 'အခြေခံအဆင့်',
    metaValidated: 'ပြန်လည်သုံးသပ်ပြီး အကြောင်းအရာ',
    intro: 'သုံးလပတ်တိုင်းတွင် ညင်သာစွာ၊ လုံခြုံစွာ တက်ကြွနေခြင်း။',
    contentsTitle: 'ဤဆောင်းပါးတွင်',
    topics: [
      'အကြံပြုထားသော လုပ်ငန်းများ',
      'ရှောင်ရှားသင့်သည့်အရာများ',
      'သင့်ခန္ဓာကိုယ်၏ အချက်ပြမှုများကို နားထောင်ခြင်း',
      'မှတ်ချက်',
      'အဓိကအချက်',
    ],
    body1: 'လမ်းလျှောက်ခြင်း၊ ရေကူးခြင်းနှင့် ကိုယ်ဝန်ဆောင်များအတွက် ယောဂကို ကိုယ်ဝန်ဆောင်ကာလတစ်လျှောက်လုံး သင့်ခံစားချက်နှင့်ကိုက်ညီသော အရှိန်ဖြင့် ယေဘုယျအားဖြင့် အကြံပြုသည်။',
    recommended: ['လမ်းလျှောက်ခြင်း', 'ရေကူးခြင်း', 'ကိုယ်ဝန်ဆောင်များအတွက် ယောဂ'],
    body2: 'ပြင်းထန်စွာ ထိခိုက်မှုရှိသော အားကစားများ သို့မဟုတ် ပြုတ်ကျနိုင်ခြေရှိသော လုပ်ငန်းများကို အထူးသဖြင့် ဒုတိယသုံးလပတ်မှစ၍ ရှောင်ပါ။',
    toAvoid: [
      'ပြင်းထန်စွာ ထိခိုက်မှုရှိသော အားကစားများ (ပြင်းထန်သော ပြေးခြင်း၊ အမြန်ဆော့ရသော ရက်ကက်အားကစားများ)',
      'ပြုတ်ကျနိုင်ခြေရှိသော လုပ်ငန်းများ (စကီးစီးခြင်း၊ မြင်းစီးခြင်း၊ ကြမ်းတမ်းသောမြေပေါ် စက်ဘီးစီးခြင်း)',
      'ထိတွေ့ပြိုင်ဆိုင်ရသော သို့မဟုတ် တိုက်ခိုက်ရေးအားကစားများ',
      'မြင့်သောနေရာတွင် သို့မဟုတ် အလွန်ပူသောရာသီဥတုတွင် ပြင်းထန်စွာ ကြိုးစားခြင်း',
    ],
    listenSigns: [
      'ပုံမှန်မဟုတ်သော အသက်ရှူကျပ်ခြင်း သို့မဟုတ် ခေါင်းမူးခြင်း',
      'လှုပ်ရှားနေစဉ် နာကျင်ခြင်း၊ သွေးထွက်ခြင်း သို့မဟုတ် သားအိမ်ကျုံ့ခြင်း',
      'အနားယူပြီးနောက်လည်း မပျောက်သော ပင်ပန်းနွမ်းနယ်ခြင်း',
    ],
    neutralText: 'သင့်ခန္ဓာကိုယ်၏ အချက်ပြမှုများကို အမြဲနားထောင်ပါ။ ကိုယ်လက်လှုပ်ရှားမှုတစ်ခု မစမီ သို့မဟုတ် မပြောင်းမီ သင့်သားဖွားဆရာမ သို့မဟုတ် ဆရာဝန်နှင့် ပြောဆိုပါ။',
    tipTitle: 'သိထားသင့်သည်',
    tipText: 'ညင်သာပြီး ပုံမှန်ဖြစ်သော လှုပ်ရှားမှုသည် ကိုယ်ဝန်အများစုအတွက် အကျိုးရှိသည်။ အဓိကမှာ အဆင့်တိုင်းနှင့် သင့်ခံစားချက်အလိုက် ပြင်းအားကို လိုက်လျောညီထွေဖြစ်စေခြင်းဖြစ်သည်။',
    shareMessage: 'ကိုယ်ဝန်ဆောင်စဉ် တက်ကြွစွာနေခြင်း — AWA',
  },
  km: {
    badge: 'ការមានផ្ទៃពោះ • សកម្មភាពរាងកាយ',
    title: 'ការរក្សាសកម្មភាព\nក្នុងអំឡុងមានផ្ទៃពោះ',
    metaDuration: 'អាន 5 នាទី',
    metaType: 'មគ្គុទ្ទេសក៍',
    metaLevel: 'កម្រិតដំបូង',
    metaValidated: 'មាតិកាបានពិនិត្យ',
    intro: 'ការរក្សាសកម្មភាពស្រាលៗដោយសុវត្ថិភាព នៅគ្រប់ត្រីមាស។',
    contentsTitle: 'ក្នុងអត្ថបទនេះ',
    topics: [
      'សកម្មភាពដែលបានណែនាំ',
      'អ្វីដែលល្អបំផុតគួរជៀសវាង',
      'ការស្តាប់សញ្ញាពីរាងកាយរបស់អ្នក',
      'ចំណាំ',
      'ចំណុចសំខាន់',
    ],
    body1: 'ការដើរ ការហែលទឹក និងយូហ្គាសម្រាប់ស្ត្រីមានផ្ទៃពោះ ជាទូទៅត្រូវបានណែនាំពេញមួយការមានផ្ទៃពោះ ក្នុងល្បឿនដែលស្របតាមអារម្មណ៍របស់អ្នក។',
    recommended: ['ការដើរ', 'ការហែលទឹក', 'យូហ្គាសម្រាប់ស្ត្រីមានផ្ទៃពោះ'],
    body2: 'ជៀសវាងកីឡាដែលមានការប៉ះទង្គិចខ្លាំង ឬសកម្មភាពដែលមានហានិភ័យដួល ជាពិសេសចាប់ពីត្រីមាសទីពីរតទៅ៖',
    toAvoid: [
      'កីឡាដែលមានការប៉ះទង្គិចខ្លាំង (ការរត់ខ្លាំង កីឡាវាយកូនបាល់ដែលមានល្បឿនលឿន)',
      'សកម្មភាពដែលមានហានិភ័យដួល (ជិះស្គី ជិះសេះ ជិះកង់នៅលើដីរដុប)',
      'កីឡាប៉ះពាល់រាងកាយ ឬកីឡាប្រយុទ្ធ',
      'ការប្រឹងប្រែងខ្លាំងនៅកន្លែងខ្ពស់ ឬក្នុងកម្តៅខ្លាំង',
    ],
    listenSigns: [
      'ដង្ហើមខ្លី ឬវិលមុខមិនធម្មតា',
      'ការឈឺចាប់ ការហូរឈាម ឬការកន្ត្រាក់ស្បូនក្នុងអំឡុងពេលប្រឹងប្រែង',
      'ការអស់កម្លាំងដែលមិនបាត់ទោះបីបានសម្រាករួច',
    ],
    neutralText: 'ត្រូវស្តាប់សញ្ញាពីរាងកាយរបស់អ្នកជានិច្ច ហើយពិភាក្សាជាមួយឆ្មប ឬវេជ្ជបណ្ឌិតរបស់អ្នក មុននឹងចាប់ផ្តើម ឬផ្លាស់ប្តូរសកម្មភាពរាងកាយ។',
    tipTitle: 'គួរដឹង',
    tipText: 'សកម្មភាពស្រាលៗ និងទៀងទាត់មានប្រយោជន៍សម្រាប់ការមានផ្ទៃពោះភាគច្រើន៖ ចំណុចសំខាន់គឺសម្របកម្រិតទៅតាមដំណាក់កាលនីមួយៗ និងអារម្មណ៍របស់អ្នក។',
    shareMessage: 'ការរក្សាសកម្មភាពក្នុងអំឡុងមានផ្ទៃពោះ — AWA',
  },
  lo: {
    badge: 'ການຖືພາ • ກິດຈະກຳທາງກາຍ',
    title: 'ຮັກສາຮ່າງກາຍໃຫ້ຄ່ອງແຄ້ວ\nລະຫວ່າງການຖືພາ',
    metaDuration: 'ອ່ານ 5 ນາທີ',
    metaType: 'ຄູ່ມື',
    metaLevel: 'ລະດັບເລີ່ມຕົ້ນ',
    metaValidated: 'ເນື້ອຫາທີ່ຜ່ານການກວດສອບ',
    intro: 'ການເຄື່ອນໄຫວຮ່າງກາຍແບບນຸ້ມນວນຢ່າງປອດໄພ ໃນທຸກໄຕມາດ.',
    contentsTitle: 'ໃນບົດຄວາມນີ້',
    topics: [
      'ກິດຈະກຳທີ່ແນະນຳ',
      'ສິ່ງທີ່ຄວນຫຼີກລ່ຽງ',
      'ຟັງສັນຍານຈາກຮ່າງກາຍຂອງທ່ານ',
      'ໝາຍເຫດ',
      'ຈຸດສຳຄັນ',
    ],
    body1: 'ການຍ່າງ, ການລອຍນ້ຳ ແລະ ໂຍຄະສຳລັບແມ່ຍິງຖືພາ ໂດຍທົ່ວໄປແນະນຳໃຫ້ເຮັດຕະຫຼອດການຖືພາ ດ້ວຍຈັງຫວະທີ່ເໝາະກັບຄວາມຮູ້ສຶກຂອງທ່ານ.',
    recommended: ['ການຍ່າງ', 'ການລອຍນ້ຳ', 'ໂຍຄະສຳລັບແມ່ຍິງຖືພາ'],
    body2: 'ຫຼີກລ່ຽງກິລາທີ່ມີແຮງກະທົບສູງ ຫຼື ກິດຈະກຳທີ່ມີຄວາມສ່ຽງຈະລົ້ມ ໂດຍສະເພາະຕັ້ງແຕ່ໄຕມາດທີສອງເປັນຕົ້ນໄປ:',
    toAvoid: [
      'ກິລາທີ່ມີແຮງກະທົບສູງ (ການແລ່ນຫນັກ, ກິລາໄມ້ຕີທີ່ມີຈັງຫວະໄວ)',
      'ກິດຈະກຳທີ່ມີຄວາມສ່ຽງຈະລົ້ມ (ການສະກີ, ການຂີ່ມ້າ, ການຂີ່ລົດຖີບໃນເສັ້ນທາງຂຸຂຣະ)',
      'ກິລາທີ່ມີການປະທະ ຫຼື ການຕໍ່ສູ້',
      'ການອອກແຮງຢ່າງໜັກຢູ່ທີ່ສູງ ຫຼື ໃນອາກາດຮ້ອນຈັດ',
    ],
    listenSigns: [
      'ຫາຍໃຈຕື້ນ ຫຼື ວິນຫົວຜິດປົກກະຕິ',
      'ເຈັບປວດ, ເລືອດອອກ ຫຼື ມົດລູກບີບຕົວໃນຂະນະອອກແຮງ',
      'ອາການອ່ອນເພຍທີ່ບໍ່ຫາຍໄປຫຼັງຈາກພັກຜ່ອນ',
    ],
    neutralText: 'ຟັງສັນຍານຈາກຮ່າງກາຍຂອງທ່ານສະເໝີ ແລະ ປຶກສາໝໍຕຳແຍ ຫຼື ແພດຂອງທ່ານກ່ອນເລີ່ມ ຫຼື ປ່ຽນກິດຈະກຳທາງກາຍ.',
    tipTitle: 'ຄວນຮູ້',
    tipText: 'ກິດຈະກຳແບບນຸ້ມນວນ ແລະ ສະໝ່ຳສະເໝີ ມີປະໂຫຍດຕໍ່ການຖືພາສ່ວນໃຫຍ່: ສິ່ງສຳຄັນແມ່ນປັບຄວາມໜັກໃຫ້ເໝາະກັບແຕ່ລະໄລຍະ ແລະ ຄວາມຮູ້ສຶກຂອງທ່ານ.',
    shareMessage: 'ຮັກສາຮ່າງກາຍໃຫ້ຄ່ອງແຄ້ວລະຫວ່າງການຖືພາ — AWA',
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
