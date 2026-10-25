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
import {CYCLE_PHASES_HERO, resolveEditorialImage} from '../../i18n/editorialImages';
import {withBrazilianPortuguese} from '../../i18n/ptBrEditorial';

const ID = 'patch-le-patch-contraceptif';

const HERO = CYCLE_PHASES_HERO;

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const PATCH_FACT_ICONS = [
  'calendar-week-outline',
  'water-outline',
  'shield-check-outline',
  'alert-circle-outline',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = withBrazilianPortuguese('Patch', {
  fr: {
    badge: 'PATCH CONTRACEPTIF',
    title: 'Le patch\ncontraceptif',
    metaDuration: '5 min de lecture',
    metaType: 'Article',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Une alternative hebdomadaire à la pilule quotidienne.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Comment fonctionne le patch',
      'Le rythme d’application',
      'Ce qu’il faut savoir',
      'À retenir',
    ],
    section1Body:
      'Le patch diffuse en continu des hormones à travers la peau, avec une action comparable à celle de la pilule combinée : il empêche l’ovulation et épaissit la glaire cervicale.',
    tip1Title: 'Bon à savoir',
    tip1Text:
      'Son principal avantage est de ne pas nécessiter une prise quotidienne.',
    section2Body:
      'Le patch se change généralement une fois par semaine pendant trois semaines, suivies d’une semaine sans patch.',
    applicationTips: [
      'Changer de zone d’application à chaque pose',
      'Vérifier qu’il reste bien collé',
      'Le poser sur une peau propre et sèche',
    ],
    sectionIntro:
      'Les points essentiels à connaître avant et pendant son utilisation.',
    facts: [
      {title: 'Chaque semaine', text: 'Le patch se remplace une fois par semaine.'},
      {title: 'Peau sèche', text: 'Il doit être posé sur une peau propre et sèche.'},
      {title: 'Protection', text: 'Il agit en continu lorsqu’il est utilisé correctement.'},
      {title: 'À surveiller', text: 'Une irritation locale peut parfois apparaître.'},
    ],
    comparisonTitle: 'Avantages & limites',
    advantageTitle: 'Avantages',
    advantages: [
      '• Une application par semaine',
      '• Pas de prise quotidienne',
      '• Diffusion hormonale continue',
    ],
    limitTitle: 'Limites',
    limits: [
      'Ne protège pas des IST',
      'Peut provoquer une irritation cutanée',
      'Nécessite de respecter le rythme de remplacement',
    ],
    alertTitle: 'À noter',
    alertText:
      'Une légère irritation peut apparaître à l’endroit de la pose. Alterner les zones d’application peut aider à limiter ce problème.',
    rememberTitle: 'Les 3 essentiels',
    remember: [
      'Changer le patch chaque semaine.',
      'Vérifier régulièrement son adhérence.',
      'Demander conseil à un professionnel de santé si nécessaire.',
    ],
    shareMessage: 'Le patch contraceptif — AWA',
  },
  en: {
    badge: 'CONTRACEPTIVE PATCH',
    title: 'The contraceptive\npatch',
    metaDuration: '5 min read',
    metaType: 'Article',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'A weekly alternative to the daily pill.',
    contentsTitle: 'In this article',
    topics: [
      'How the patch works',
      'Application schedule',
      'What you need to know',
      'Key takeaways',
    ],
    section1Body:
      'The patch continuously releases hormones through the skin, working in a way comparable to the combined pill: it prevents ovulation and thickens cervical mucus.',
    tip1Title: 'Good to know',
    tip1Text:
      'Its main advantage is that it doesn’t require a daily dose.',
    section2Body:
      'The patch is generally changed once a week for three weeks, followed by one week without a patch.',
    applicationTips: [
      'Change the application site each time',
      'Check that it’s still firmly stuck',
      'Apply it to clean, dry skin',
    ],
    sectionIntro:
      'The key points to know before and during use.',
    facts: [
      {title: 'Every week', text: 'The patch is replaced once a week.'},
      {title: 'Dry skin', text: 'It must be applied to clean, dry skin.'},
      {title: 'Protection', text: 'It works continuously when used correctly.'},
      {title: 'Watch for', text: 'Local irritation can sometimes occur.'},
    ],
    comparisonTitle: 'Advantages & limitations',
    advantageTitle: 'Advantages',
    advantages: [
      '• One application per week',
      '• No daily dose',
      '• Continuous hormone release',
    ],
    limitTitle: 'Limitations',
    limits: [
      'Doesn’t protect against STIs',
      'May cause skin irritation',
      'Requires sticking to the replacement schedule',
    ],
    alertTitle: 'Please note',
    alertText:
      'Slight irritation may appear at the application site. Alternating application sites can help limit this.',
    rememberTitle: 'The 3 essentials',
    remember: [
      'Change the patch every week.',
      'Check regularly that it’s sticking well.',
      'Ask a healthcare professional for advice if needed.',
    ],
    shareMessage: 'The contraceptive patch — AWA',
  },
  es: {
    badge: 'PARCHE ANTICONCEPTIVO',
    title: 'El parche\nanticonceptivo',
    metaDuration: '5 min de lectura',
    metaType: 'Artículo',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Una alternativa semanal a la píldora diaria.',
    contentsTitle: 'En este artículo',
    topics: [
      'Cómo funciona el parche',
      'El ritmo de aplicación',
      'Lo que hay que saber',
      'Lo esencial',
    ],
    section1Body:
      'El parche libera hormonas de forma continua a través de la piel, con una acción comparable a la de la píldora combinada: impide la ovulación y espesa el moco cervical.',
    tip1Title: 'DATO ÚTIL',
    tip1Text:
      'Su principal ventaja es que no requiere una toma diaria.',
    section2Body:
      'El parche se cambia generalmente una vez por semana durante tres semanas, seguidas de una semana sin parche.',
    applicationTips: [
      'Cambiar de zona de aplicación en cada colocación',
      'Comprobar que sigue bien pegado',
      'Colocarlo sobre una piel limpia y seca',
    ],
    sectionIntro:
      'Los puntos esenciales que hay que conocer antes y durante su uso.',
    facts: [
      {title: 'Cada semana', text: 'El parche se sustituye una vez por semana.'},
      {title: 'Piel seca', text: 'Debe colocarse sobre una piel limpia y seca.'},
      {title: 'Protección', text: 'Actúa de forma continua cuando se usa correctamente.'},
      {title: 'A vigilar', text: 'A veces puede aparecer una irritación local.'},
    ],
    comparisonTitle: 'Ventajas y límites',
    advantageTitle: 'Ventajas',
    advantages: [
      '• Una aplicación por semana',
      '• Sin toma diaria',
      '• Liberación hormonal continua',
    ],
    limitTitle: 'Límites',
    limits: [
      'No protege de las ITS',
      'Puede provocar irritación cutánea',
      'Requiere respetar el ritmo de sustitución',
    ],
    alertTitle: 'A tener en cuenta',
    alertText:
      'Puede aparecer una ligera irritación en el lugar de la aplicación. Alternar las zonas de aplicación puede ayudar a limitar este problema.',
    rememberTitle: 'Los 3 esenciales',
    remember: [
      'Cambia el parche cada semana.',
      'Comprueba regularmente que se mantiene adherido.',
      'Pide consejo a un profesional de la salud si es necesario.',
    ],
    shareMessage: 'El parche anticonceptivo — AWA',
  },
  it: {
    badge: 'CEROTTO CONTRACCETTIVO',
    title: 'Il cerotto\ncontraccettivo',
    metaDuration: '5 min di lettura',
    metaType: 'Articolo',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Un’alternativa settimanale alla pillola quotidiana.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Come funziona il cerotto',
      'Calendario di applicazione',
      'Cosa devi sapere',
      'Punti chiave',
    ],
    section1Body: 'Il cerotto rilascia continuamente ormoni attraverso la pelle, con un funzionamento paragonabile a quello della pillola combinata: impedisce l’ovulazione e ispessisce il muco cervicale.',
    tip1Title: 'Da sapere',
    tip1Text: 'Il suo principale vantaggio è che non richiede una dose quotidiana.',
    section2Body: 'Il cerotto viene generalmente cambiato una volta a settimana per tre settimane, seguite da una settimana senza cerotto.',
    applicationTips: [
      'Cambia la zona di applicazione ogni volta',
      'Controlla che sia ancora ben attaccato',
      'Applicalo su pelle pulita e asciutta',
    ],
    sectionIntro: 'I punti chiave da conoscere prima e durante l’uso.',
    facts: [
      {
        title: 'Ogni settimana',
        text: 'Il cerotto si sostituisce una volta a settimana.',
      },
      {
        title: 'Pelle asciutta',
        text: 'Deve essere applicato su pelle pulita e asciutta.',
      },
      {
        title: 'Protezione',
        text: 'Agisce in modo continuo se usato correttamente.',
      },
      {
        title: 'Da tenere d’occhio',
        text: 'A volte può comparire un’irritazione locale.',
      },
    ],
    comparisonTitle: 'Vantaggi e limiti',
    advantageTitle: 'Vantaggi',
    advantages: [
      '• Un’applicazione a settimana',
      '• Nessuna dose quotidiana',
      '• Rilascio continuo di ormoni',
    ],
    limitTitle: 'Limiti',
    limits: [
      'Non protegge dalle infezioni sessualmente trasmissibili',
      'Può causare irritazione cutanea',
      'Richiede di rispettare il calendario di sostituzione',
    ],
    alertTitle: 'Attenzione',
    alertText: 'Una lieve irritazione può comparire nella zona di applicazione. Alternare le zone di applicazione può aiutare a limitarla.',
    rememberTitle: 'I 3 punti essenziali',
    remember: [
      'Cambia il cerotto ogni settimana.',
      'Controlla regolarmente che aderisca bene.',
      'Chiedi consiglio a un professionista sanitario se necessario.',
    ],
    shareMessage: 'Il cerotto contraccettivo — AWA',
  },
  tr: {
    badge: 'DOĞUM KONTROL FLASTERİ',
    title: 'Doğum kontrol\nflasteri',
    metaDuration: '5 dk okuma',
    metaType: 'Makale',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Günlük hapa haftalık bir alternatif.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Flaster nasıl çalışır?',
      'Uygulama takvimi',
      'Bilmen gerekenler',
      'Akılda kalacaklar',
    ],
    section1Body: 'Flaster, hormonları cilt yoluyla sürekli olarak salar ve kombine hapa benzer şekilde çalışır: yumurtlamayı engeller ve servikal mukusu kalınlaştırır.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Başlıca avantajı, günlük doz gerektirmemesidir.',
    section2Body: 'Flaster genellikle üç hafta boyunca haftada bir değiştirilir, ardından bir hafta flastersiz geçirilir.',
    applicationTips: [
      'Her seferinde uygulama bölgesini değiştir',
      'Hâlâ sıkıca yapışıp yapışmadığını kontrol et',
      'Temiz ve kuru cilde uygula',
    ],
    sectionIntro: 'Kullanımdan önce ve kullanım sırasında bilinmesi gereken temel noktalar.',
    facts: [
      {
        title: 'Her hafta',
        text: 'Flaster haftada bir değiştirilir.',
      },
      {
        title: 'Kuru cilt',
        text: 'Temiz ve kuru cilde uygulanmalıdır.',
      },
      {
        title: 'Koruma',
        text: 'Doğru kullanıldığında sürekli olarak etki eder.',
      },
      {
        title: 'Dikkat et',
        text: 'Bazen bölgesel tahriş görülebilir.',
      },
    ],
    comparisonTitle: 'Avantajlar ve sınırlamalar',
    advantageTitle: 'Avantajlar',
    advantages: [
      '• Haftada bir uygulama',
      '• Günlük doz yok',
      '• Sürekli hormon salımı',
    ],
    limitTitle: 'Sınırlamalar',
    limits: [
      'Cinsel yolla bulaşan enfeksiyonlardan korumaz',
      'Cilt tahrişine neden olabilir',
      'Değiştirme takvimine uymayı gerektirir',
    ],
    alertTitle: 'Dikkat',
    alertText: 'Uygulama bölgesinde hafif tahriş görülebilir. Uygulama bölgelerini dönüşümlü kullanmak bunu sınırlamaya yardımcı olabilir.',
    rememberTitle: '3 temel nokta',
    remember: [
      'Flasteri her hafta değiştir.',
      'İyi yapışıp yapışmadığını düzenli olarak kontrol et.',
      'Gerekirse bir sağlık profesyonelinden tavsiye iste.',
    ],
    shareMessage: 'Doğum kontrol flasteri — AWA',
  },
  ru: {
    badge: 'КОНТРАЦЕПТИВНЫЙ ПЛАСТЫРЬ',
    title: 'Контрацептивный\nпластырь',
    metaDuration: '5 мин чтения',
    metaType: 'Статья',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'Еженедельная альтернатива ежедневным таблеткам.',
    contentsTitle: 'В этой статье',
    topics: [
      'Как действует пластырь',
      'График наклеивания',
      'Что нужно знать',
      'Главное',
    ],
    section1Body:
      'Пластырь непрерывно высвобождает гормоны через кожу и действует подобно комбинированным таблеткам: он подавляет овуляцию и делает цервикальную слизь более густой.',
    tip1Title: 'ПОЛЕЗНО ЗНАТЬ',
    tip1Text:
      'Его главное преимущество в том, что не нужно принимать ежедневную дозу.',
    section2Body:
      'Пластырь, как правило, меняют раз в неделю в течение трёх недель, после чего следует неделя без пластыря.',
    applicationTips: [
      'Каждый раз меняйте место наклеивания',
      'Проверяйте, что он по-прежнему плотно держится',
      'Наклеивайте на чистую, сухую кожу',
    ],
    sectionIntro:
      'Главное, что нужно знать до начала и во время использования.',
    facts: [
      {title: 'Каждую неделю', text: 'Пластырь заменяют раз в неделю.'},
      {title: 'Сухая кожа', text: 'Его необходимо наклеивать на чистую, сухую кожу.'},
      {title: 'Защита', text: 'При правильном использовании он действует непрерывно.'},
      {title: 'Что учитывать', text: 'Иногда может возникать местное раздражение.'},
    ],
    comparisonTitle: 'Преимущества и ограничения',
    advantageTitle: 'Преимущества',
    advantages: [
      '• Одно наклеивание в неделю',
      '• Не нужна ежедневная доза',
      '• Непрерывное высвобождение гормонов',
    ],
    limitTitle: 'Ограничения',
    limits: [
      'Не защищает от ИППП',
      'Может вызывать раздражение кожи',
      'Требует соблюдения графика замены',
    ],
    alertTitle: 'Обратите внимание',
    alertText:
      'В месте наклеивания может появиться лёгкое раздражение. Чередование мест наклеивания помогает его ограничить.',
    rememberTitle: '3 главных правила',
    remember: [
      'Меняйте пластырь каждую неделю.',
      'Регулярно проверяйте, что он хорошо держится.',
      'При необходимости обратитесь за советом к медицинскому специалисту.',
    ],
    shareMessage: 'Контрацептивный пластырь — AWA',
  },
  de: {
    badge: 'VERHÜTUNGSPFLASTER',
    title: 'Das Verhütungs-\npflaster',
    metaDuration: '5 Min. Lesezeit',
    metaType: 'Artikel',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Eine wöchentliche Alternative zur täglichen Pille.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'So wirkt das Pflaster',
      'Anwendungsplan',
      'Was du wissen solltest',
      'Das Wichtigste in Kürze',
    ],
    section1Body:
      'Das Pflaster gibt Hormone kontinuierlich über die Haut ab und wirkt ähnlich wie die Kombinationspille: Es verhindert den Eisprung und macht den Zervixschleim zähflüssiger.',
    tip1Title: 'Gut zu wissen',
    tip1Text:
      'Sein wichtigster Vorteil ist, dass du nicht täglich daran denken musst.',
    section2Body:
      'Das Pflaster wird in der Regel drei Wochen lang einmal pro Woche gewechselt, gefolgt von einer Woche ohne Pflaster.',
    applicationTips: [
      'Wechsle die Klebestelle jedes Mal',
      'Prüfe, ob es noch fest haftet',
      'Klebe es auf saubere, trockene Haut',
    ],
    sectionIntro:
      'Die wichtigsten Punkte, die du vor und während der Anwendung kennen solltest.',
    facts: [
      {title: 'Jede Woche', text: 'Das Pflaster wird einmal pro Woche gewechselt.'},
      {title: 'Trockene Haut', text: 'Es muss auf saubere, trockene Haut geklebt werden.'},
      {title: 'Schutz', text: 'Bei korrekter Anwendung wirkt es durchgehend.'},
      {title: 'Beachten', text: 'Manchmal kann es zu örtlichen Hautreizungen kommen.'},
    ],
    comparisonTitle: 'Vorteile & Einschränkungen',
    advantageTitle: 'Vorteile',
    advantages: [
      '• Eine Anwendung pro Woche',
      '• Keine tägliche Einnahme',
      '• Kontinuierliche Hormonabgabe',
    ],
    limitTitle: 'Einschränkungen',
    limits: [
      'Schützt nicht vor sexuell übertragbaren Infektionen',
      'Kann Hautreizungen verursachen',
      'Erfordert, den Wechselplan einzuhalten',
    ],
    alertTitle: 'Bitte beachten',
    alertText:
      'An der Klebestelle kann eine leichte Reizung auftreten. Die Klebestelle abzuwechseln kann helfen, dies zu begrenzen.',
    rememberTitle: 'Die 3 wichtigsten Punkte',
    remember: [
      'Wechsle das Pflaster jede Woche.',
      'Prüfe regelmäßig, ob es gut haftet.',
      'Lass dich bei Bedarf von medizinischem Fachpersonal beraten.',
    ],
    shareMessage: 'Das Verhütungspflaster — AWA',
  },
  zh: {
      badge: '避孕贴',
      title: '避孕贴',
      metaDuration: '阅读约 5 分钟',
      metaType: '文章',
      metaLevel: '入门',
      metaValidated: '经审阅的内容',
      intro: '每周一次，是每日服药之外的另一种选择。',
      contentsTitle: '本文内容',
      topics: [
        '避孕贴如何起作用',
        '贴用时间安排',
        '你需要了解的事',
        '要点回顾',
      ],
      section1Body: '避孕贴通过皮肤持续释放激素，作用方式与复方避孕药相似：抑制排卵，并使宫颈黏液变稠。',
      tip1Title: '小贴士',
      tip1Text: '它的主要优点是不需要每天服药。',
      section2Body: '避孕贴通常每周更换一次，连续三周，之后休息一周，不贴。',
      applicationTips: [
        '每次更换贴用的位置',
        '检查它是否仍然贴牢',
        '贴在清洁、干燥的皮肤上',
      ],
      sectionIntro: '使用前和使用期间需要了解的要点。',
      facts: [
        {
          title: '每周更换',
          text: '避孕贴每周更换一次。',
        },
        {
          title: '皮肤干燥',
          text: '必须贴在清洁、干燥的皮肤上。',
        },
        {
          title: '保护',
          text: '正确使用时，它会持续起效。',
        },
        {
          title: '需要留意',
          text: '有时会出现局部刺激。',
        },
      ],
      comparisonTitle: '优点与局限',
      advantageTitle: '优点',
      advantages: [
        '• 每周只需贴一次',
        '• 无需每日服药',
        '• 激素持续释放',
      ],
      limitTitle: '局限',
      limits: [
        '不能预防性传播感染',
        '可能引起皮肤刺激',
        '需要按时更换',
      ],
      alertTitle: '请注意',
      alertText: '贴用部位可能会出现轻微刺激。轮换贴用部位有助于减少这种情况。',
      rememberTitle: '3 个要点',
      remember: [
        '每周更换一次避孕贴。',
        '定期检查它是否贴牢。',
        '如有需要，请向医疗专业人员咨询。',
      ],
      shareMessage: '避孕贴 — AWA',
    },
  id: {
    badge: 'KOYO KONTRASEPSI',
    title: 'Koyo\nkontrasepsi',
    metaDuration: '5 menit baca',
    metaType: 'Artikel',
    metaLevel: 'Pemula',
    metaValidated: 'Konten yang telah ditinjau',
    intro: 'Alternatif mingguan pengganti pil harian.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Cara kerja koyo',
      'Jadwal pemasangan',
      'Yang perlu kamu ketahui',
      'Poin-poin penting',
    ],
    section1Body: 'Koyo melepaskan hormon secara terus-menerus melalui kulit, dengan cara kerja yang sebanding dengan pil kombinasi: mencegah ovulasi dan mengentalkan lendir serviks.',
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Keunggulan utamanya adalah tidak perlu dikonsumsi setiap hari.',
    section2Body: 'Koyo umumnya diganti seminggu sekali selama tiga minggu, lalu diikuti satu minggu tanpa koyo.',
    applicationTips: [
      'Ganti lokasi penempelan setiap kali',
      'Periksa bahwa koyo masih menempel dengan kuat',
      'Tempelkan pada kulit yang bersih dan kering',
    ],
    sectionIntro: 'Hal-hal penting yang perlu diketahui sebelum dan selama pemakaian.',
    facts: [
      {
        title: 'Setiap minggu',
        text: 'Koyo diganti seminggu sekali.',
      },
      {
        title: 'Kulit kering',
        text: 'Koyo harus ditempelkan pada kulit yang bersih dan kering.',
      },
      {
        title: 'Perlindungan',
        text: 'Koyo bekerja terus-menerus bila digunakan dengan benar.',
      },
      {
        title: 'Waspadai',
        text: 'Iritasi lokal terkadang bisa terjadi.',
      },
    ],
    comparisonTitle: 'Kelebihan & keterbatasan',
    advantageTitle: 'Kelebihan',
    advantages: [
      '• Satu kali pemasangan per minggu',
      '• Tanpa dosis harian',
      '• Pelepasan hormon yang terus-menerus',
    ],
    limitTitle: 'Keterbatasan',
    limits: [
      'Tidak melindungi dari infeksi menular seksual',
      'Dapat menyebabkan iritasi kulit',
      'Perlu mematuhi jadwal penggantian',
    ],
    alertTitle: 'Harap diperhatikan',
    alertText: 'Iritasi ringan bisa muncul di lokasi penempelan. Berganti-ganti lokasi penempelan dapat membantu membatasinya.',
    rememberTitle: '3 hal penting',
    remember: [
      'Ganti koyo setiap minggu.',
      'Periksa secara berkala bahwa koyo menempel dengan baik.',
      'Mintalah saran tenaga kesehatan bila perlu.',
    ],
    shareMessage: 'Koyo kontrasepsi — AWA',
  },
  hi: {
    badge: 'गर्भनिरोधक पैच',
    title: 'गर्भनिरोधक\nपैच',
    metaDuration: '5 मिनट में पढ़ें',
    metaType: 'लेख',
    metaLevel: 'शुरुआती',
    metaValidated: 'जाँची गई जानकारी',
    intro: 'रोज़ की गोली का साप्ताहिक विकल्प।',
    contentsTitle: 'इस लेख में',
    topics: [
      'पैच कैसे काम करता है',
      'पैच लगाने का शेड्यूल',
      'क्या जानना ज़रूरी है',
      'मुख्य बातें',
    ],
    section1Body: 'पैच त्वचा के ज़रिए लगातार हार्मोन छोड़ता है और कंबाइंड गोली जैसा ही काम करता है: यह ओव्यूलेशन (अंडोत्सर्ग) को रोकता है और गर्भाशय ग्रीवा के म्यूकस को गाढ़ा करता है।',
    tip1Title: 'जानना अच्छा रहेगा',
    tip1Text: 'इसका मुख्य फ़ायदा यह है कि इसमें रोज़ खुराक लेने की ज़रूरत नहीं होती।',
    section2Body: 'पैच आमतौर पर तीन हफ़्ते तक हफ़्ते में एक बार बदला जाता है, उसके बाद एक हफ़्ता बिना पैच के रहना होता है।',
    applicationTips: [
      'हर बार पैच लगाने की जगह बदलें',
      'जाँचते रहें कि वह अब भी मज़बूती से चिपका है',
      'इसे साफ़ और सूखी त्वचा पर लगाएँ',
    ],
    sectionIntro: 'इस्तेमाल से पहले और इस्तेमाल के दौरान जानने लायक मुख्य बातें।',
    facts: [
      {
        title: 'हर हफ़्ते',
        text: 'पैच हफ़्ते में एक बार बदला जाता है।',
      },
      {
        title: 'सूखी त्वचा',
        text: 'इसे साफ़ और सूखी त्वचा पर लगाना ज़रूरी है।',
      },
      {
        title: 'सुरक्षा',
        text: 'सही तरह से इस्तेमाल करने पर यह लगातार काम करता है।',
      },
      {
        title: 'ध्यान रखें',
        text: 'कभी-कभी उस जगह पर जलन हो सकती है।',
      },
    ],
    comparisonTitle: 'फ़ायदे और सीमाएँ',
    advantageTitle: 'फ़ायदे',
    advantages: [
      '• हफ़्ते में सिर्फ़ एक बार लगाना',
      '• रोज़ की खुराक नहीं',
      '• हार्मोन लगातार मिलते रहना',
    ],
    limitTitle: 'सीमाएँ',
    limits: [
      'यौन संचारित संक्रमणों (STI) से सुरक्षा नहीं देता',
      'त्वचा में जलन हो सकती है',
      'बदलने के शेड्यूल का पालन करना ज़रूरी है',
    ],
    alertTitle: 'ध्यान दें',
    alertText: 'पैच लगाने की जगह पर हल्की जलन हो सकती है। हर बार जगह बदलने से इसे कम करने में मदद मिल सकती है।',
    rememberTitle: '3 ज़रूरी बातें',
    remember: [
      'पैच हर हफ़्ते बदलें।',
      'नियमित रूप से जाँचें कि वह ठीक से चिपका है।',
      'ज़रूरत हो तो किसी स्वास्थ्य विशेषज्ञ से सलाह लें।',
    ],
    shareMessage: 'गर्भनिरोधक पैच — AWA',
  },
  sq: {
    badge: 'ARNA KONTRACEPTIVE',
    title: 'Arna\nkontraceptive',
    metaDuration: '5 min lexim',
    metaType: 'Artikull',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Një alternativë javore ndaj tabletës ditore.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Si funksionon arna',
      'Orari i vendosjes',
      'Çfarë duhet të dish',
      'Pikat kryesore',
    ],
    section1Body: 'Arna çliron vazhdimisht hormone përmes lëkurës dhe funksionon në mënyrë të ngjashme me tabletën e kombinuar: parandalon ovulacionin dhe e trashë mukusin e qafës së mitrës.',
    tip1Title: 'Mirë është ta dish',
    tip1Text: 'Avantazhi i saj kryesor është se nuk kërkon një dozë të përditshme.',
    section2Body: 'Arna ndërrohet përgjithësisht një herë në javë për tri javë, e ndjekur nga një javë pa arnë.',
    applicationTips: [
      'Ndërro vendin e vendosjes çdo herë',
      'Kontrollo që të jetë ende e ngjitur mirë',
      'Vendose në lëkurë të pastër dhe të thatë',
    ],
    sectionIntro: 'Pikat kryesore që duhen ditur para dhe gjatë përdorimit.',
    facts: [
      {
        title: 'Çdo javë',
        text: 'Arna zëvendësohet një herë në javë.',
      },
      {
        title: 'Lëkurë e thatë',
        text: 'Duhet vendosur në lëkurë të pastër dhe të thatë.',
      },
      {
        title: 'Mbrojtja',
        text: 'Vepron vazhdimisht kur përdoret saktë.',
      },
      {
        title: 'Kujdes',
        text: 'Ndonjëherë mund të shfaqet acarim lokal.',
      },
    ],
    comparisonTitle: 'Avantazhet dhe kufizimet',
    advantageTitle: 'Avantazhet',
    advantages: [
      '• Një vendosje në javë',
      '• Pa dozë të përditshme',
      '• Çlirim i vazhdueshëm i hormoneve',
    ],
    limitTitle: 'Kufizimet',
    limits: [
      'Nuk mbron nga infeksionet seksualisht të transmetueshme',
      'Mund të shkaktojë acarim të lëkurës',
      'Kërkon respektimin e orarit të zëvendësimit',
    ],
    alertTitle: 'Kujdes',
    alertText: 'Në vendin e vendosjes mund të shfaqet një acarim i lehtë. Ndërrimi i vendeve të vendosjes mund ta kufizojë atë.',
    rememberTitle: '3 gjërat thelbësore',
    remember: [
      'Ndërro arnën çdo javë.',
      'Kontrollo rregullisht që të ngjitet mirë.',
      'Kërko këshillë nga një profesionist i shëndetësisë, nëse të duhet.',
    ],
    shareMessage: 'Arna kontraceptive — AWA',
  },
  ja: {
    badge: '避妊パッチ',
    title: '避妊\nパッチ',
    metaDuration: '読了5分',
    metaType: '記事',
    metaLevel: '初級',
    metaValidated: '監修済みの内容',
    intro: '毎日飲むピルの代わりになる、週1回の方法です。',
    contentsTitle: 'この記事の内容',
    topics: [
      'パッチのしくみ',
      '貼り替えのスケジュール',
      '知っておきたいこと',
      'ポイントのまとめ',
    ],
    section1Body: 'パッチは皮膚から少しずつホルモンを放出し続けます。働きは複合ピルに近く、排卵を抑え、子宮頸管の粘液を濃くします。',
    tip1Title: '知っておきたいこと',
    tip1Text: '最大の利点は、毎日飲む必要がないことです。',
    section2Body: 'パッチは一般的に、週に1回、3週間続けて貼り替え、その後の1週間はパッチを貼らずに過ごします。',
    applicationTips: [
      '貼る場所は毎回変える',
      'しっかり貼れているか確認する',
      '清潔で乾いた皮膚に貼る',
    ],
    sectionIntro: '使用前と使用中に知っておきたいポイントです。',
    facts: [
      {
        title: '毎週',
        text: 'パッチは週に1回貼り替えます。',
      },
      {
        title: '乾いた皮膚',
        text: '清潔で乾いた皮膚に貼る必要があります。',
      },
      {
        title: '避妊効果',
        text: '正しく使えば、効果が途切れることなく続きます。',
      },
      {
        title: '注意すること',
        text: '貼った部分に刺激が出ることがあります。',
      },
    ],
    comparisonTitle: '利点と限界',
    advantageTitle: '利点',
    advantages: [
      '• 貼るのは週に1回',
      '• 毎日の服用が不要',
      '• ホルモンが継続的に放出される',
    ],
    limitTitle: '限界',
    limits: [
      '性感染症は防げない',
      '皮膚に刺激が出ることがある',
      '貼り替えのスケジュールを守る必要がある',
    ],
    alertTitle: 'ご注意',
    alertText: '貼った部分に軽い刺激が出ることがあります。貼る場所を交代させると、やわらげやすくなります。',
    rememberTitle: '大切な3つのこと',
    remember: [
      'パッチは毎週貼り替える。',
      'しっかり貼れているか、こまめに確認する。',
      '必要に応じて、医療従事者に相談する。',
    ],
    shareMessage: '避妊パッチ — AWA',
  },
  ko: {
    badge: '피임 패치',
    title: '피임\n패치',
    metaDuration: '5분 읽기',
    metaType: '아티클',
    metaLevel: '입문',
    metaValidated: '검토된 콘텐츠',
    intro: '매일 먹는 피임약 대신 일주일에 한 번 쓰는 방법이에요.',
    contentsTitle: '이 아티클에서는',
    topics: [
      '패치가 작동하는 방식',
      '붙이는 일정',
      '알아 두어야 할 점',
      '핵심 정리',
    ],
    section1Body: '패치는 피부를 통해 호르몬을 계속 방출해요. 복합 피임약과 비슷한 방식으로 작동해서 배란을 막고 자궁 경부 점액을 끈끈하게 만들어요.',
    tip1Title: '알아 두면 좋아요',
    tip1Text: '매일 복용할 필요가 없다는 점이 가장 큰 장점이에요.',
    section2Body: '패치는 보통 3주 동안 일주일에 한 번씩 교체하고, 그다음 1주는 패치를 붙이지 않아요.',
    applicationTips: [
      '붙일 때마다 부위를 바꿔요',
      '아직 단단히 붙어 있는지 확인해요',
      '깨끗하고 마른 피부에 붙여요',
    ],
    sectionIntro: '사용 전과 사용 중에 알아 두어야 할 핵심 사항이에요.',
    facts: [
      {
        title: '매주',
        text: '패치는 일주일에 한 번 교체해요.',
      },
      {
        title: '마른 피부',
        text: '깨끗하고 마른 피부에 붙여야 해요.',
      },
      {
        title: '보호 효과',
        text: '올바르게 사용하면 계속해서 효과가 있어요.',
      },
      {
        title: '주의할 점',
        text: '붙인 부위에 자극이 생기는 경우가 간혹 있어요.',
      },
    ],
    comparisonTitle: '장점과 한계',
    advantageTitle: '장점',
    advantages: [
      '• 일주일에 한 번만 붙이면 돼요',
      '• 매일 복용할 필요가 없어요',
      '• 호르몬이 계속 방출돼요',
    ],
    limitTitle: '한계',
    limits: [
      '성매개 감염병은 막아 주지 않아요',
      '피부 자극이 생길 수 있어요',
      '교체 일정을 지켜야 해요',
    ],
    alertTitle: '참고하세요',
    alertText: '붙인 부위에 약간의 자극이 생길 수 있어요. 붙이는 부위를 번갈아 바꾸면 자극을 줄이는 데 도움이 될 수 있어요.',
    rememberTitle: '꼭 기억할 3가지',
    remember: [
      '패치는 매주 교체해요.',
      '잘 붙어 있는지 정기적으로 확인해요.',
      '필요하면 의료 전문가에게 조언을 구해요.',
    ],
    shareMessage: '피임 패치 — AWA',
  },
  'pt-PT': {
    badge: 'ADESIVO CONTRACETIVO',
    title: 'O adesivo\ncontracetivo',
    metaDuration: '5 min de leitura',
    metaType: 'Artigo',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'Uma alternativa semanal à pílula diária.',
    contentsTitle: 'Neste artigo',
    topics: [
      'Como funciona o adesivo',
      'Calendário de aplicação',
      'O que precisa de saber',
      'Pontos essenciais',
    ],
    section1Body: 'O adesivo liberta hormonas de forma contínua através da pele, funcionando de modo comparável à pílula combinada: impede a ovulação e espessa o muco cervical.',
    tip1Title: 'Bom saber',
    tip1Text: 'A sua principal vantagem é não exigir uma toma diária.',
    section2Body: 'O adesivo é geralmente mudado uma vez por semana durante três semanas, seguidas de uma semana sem adesivo.',
    applicationTips: [
      'Mude o local de aplicação de cada vez',
      'Verifique se continua bem colado',
      'Aplique-o numa pele limpa e seca',
    ],
    sectionIntro: 'Os pontos-chave a conhecer antes e durante a utilização.',
    facts: [
      {
        title: 'Todas as semanas',
        text: 'O adesivo é substituído uma vez por semana.',
      },
      {
        title: 'Pele seca',
        text: 'Deve ser aplicado numa pele limpa e seca.',
      },
      {
        title: 'Proteção',
        text: 'Funciona de forma contínua quando usado corretamente.',
      },
      {
        title: 'Atenção a',
        text: 'Pode por vezes ocorrer irritação local.',
      },
    ],
    comparisonTitle: 'Vantagens e limitações',
    advantageTitle: 'Vantagens',
    advantages: [
      '• Uma aplicação por semana',
      '• Sem toma diária',
      '• Libertação contínua de hormonas',
    ],
    limitTitle: 'Limitações',
    limits: [
      'Não protege contra infeções sexualmente transmissíveis',
      'Pode causar irritação na pele',
      'Exige o cumprimento do calendário de substituição',
    ],
    alertTitle: 'Atenção',
    alertText: 'Pode surgir uma ligeira irritação no local de aplicação. Alternar os locais de aplicação pode ajudar a limitá-la.',
    rememberTitle: 'Os 3 pontos essenciais',
    remember: [
      'Mude o adesivo todas as semanas.',
      'Verifique regularmente se está bem colado.',
      'Peça aconselhamento a um profissional de saúde, se necessário.',
    ],
    shareMessage: 'O adesivo contracetivo — AWA',
  },
  bn: {
    badge: 'জন্মনিয়ন্ত্রণ প্যাচ',
    title: 'জন্মনিয়ন্ত্রণ\nপ্যাচ',
    metaDuration: 'পড়তে 5 মিনিট',
    metaType: 'নিবন্ধ',
    metaLevel: 'প্রাথমিক',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'প্রতিদিনের বড়ির একটি সাপ্তাহিক বিকল্প।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'প্যাচ কীভাবে কাজ করে',
      'ব্যবহারের সময়সূচি',
      'যা জানা দরকার',
      'মূল কথা',
    ],
    section1Body: 'প্যাচ ত্বকের মাধ্যমে ক্রমাগত হরমোন নিঃসরণ করে এবং সম্মিলিত বড়ির মতোই কাজ করে: এটি ডিম্বস্ফোটন প্রতিরোধ করে এবং জরায়ুমুখের শ্লেষ্মা ঘন করে তোলে।',
    tip1Title: 'জেনে রাখা ভালো',
    tip1Text: 'এর প্রধান সুবিধা হলো প্রতিদিন কোনো মাত্রা নিতে হয় না।',
    section2Body: 'সাধারণত তিন সপ্তাহ ধরে সপ্তাহে একবার প্যাচ বদলানো হয়, এরপর এক সপ্তাহ কোনো প্যাচ ব্যবহার করা হয় না।',
    applicationTips: [
      'প্রতিবার প্যাচ লাগানোর জায়গা বদলান',
      'দেখে নিন প্যাচ এখনও ভালোভাবে লেগে আছে কি না',
      'পরিষ্কার, শুকনো ত্বকে লাগান',
    ],
    sectionIntro: 'ব্যবহারের আগে ও ব্যবহারের সময় যেসব মূল বিষয় জানা দরকার।',
    facts: [
      {
        title: 'প্রতি সপ্তাহে',
        text: 'সপ্তাহে একবার প্যাচ বদলাতে হয়।',
      },
      {
        title: 'শুকনো ত্বক',
        text: 'পরিষ্কার, শুকনো ত্বকে লাগাতে হবে।',
      },
      {
        title: 'সুরক্ষা',
        text: 'সঠিকভাবে ব্যবহার করলে এটি ক্রমাগত কাজ করে।',
      },
      {
        title: 'লক্ষ রাখুন',
        text: 'কখনো কখনো ত্বকের জায়গায় জ্বালা হতে পারে।',
      },
    ],
    comparisonTitle: 'সুবিধা ও সীমাবদ্ধতা',
    advantageTitle: 'সুবিধা',
    advantages: [
      '• সপ্তাহে একবার লাগানো',
      '• প্রতিদিন মাত্রা নিতে হয় না',
      '• ক্রমাগত হরমোন নিঃসরণ',
    ],
    limitTitle: 'সীমাবদ্ধতা',
    limits: [
      'যৌনবাহিত সংক্রমণ থেকে সুরক্ষা দেয় না',
      'ত্বকে জ্বালা হতে পারে',
      'বদলানোর সময়সূচি মেনে চলতে হয়',
    ],
    alertTitle: 'লক্ষ্য করুন',
    alertText: 'প্যাচ লাগানোর জায়গায় সামান্য জ্বালা দেখা দিতে পারে। লাগানোর জায়গা পালা করে বদলালে এটি কমাতে সাহায্য হতে পারে।',
    rememberTitle: '3টি জরুরি কথা',
    remember: [
      'প্রতি সপ্তাহে প্যাচ বদলান।',
      'নিয়মিত দেখে নিন প্যাচ ভালোভাবে লেগে আছে কি না।',
      'প্রয়োজনে স্বাস্থ্যসেবা পেশাজীবীর পরামর্শ নিন।',
    ],
    shareMessage: 'জন্মনিয়ন্ত্রণ প্যাচ — AWA',
  },
  da: {
    badge: 'PRÆVENTIONSPLASTER',
    title: 'Præventions-\nplasteret',
    metaDuration: '5 min læsning',
    metaType: 'Artikel',
    metaLevel: 'Grundlæggende',
    metaValidated: 'Gennemgået indhold',
    intro: 'Et ugentligt alternativ til den daglige pille.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvordan plasteret virker',
      'Brugsplan',
      'Hvad du bør vide',
      'Vigtige pointer',
    ],
    section1Body: 'Plasteret frigiver konstant hormoner gennem huden og virker ligesom en kombinationspille: det forhindrer ægløsning og fortykker livmoderhalsslim.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Dets vigtigste fordel er, at der ikke skal tages en daglig dosis.',
    section2Body: 'Typisk skiftes plasteret én gang om ugen i tre uger, efterfulgt af en uge uden plaster.',
    applicationTips: [
      'Skift påføringssted ved hvert nyt plaster',
      'Kontroller at plasteret stadig sidder godt fast',
      'Påfør på ren, tør hud',
    ],
    sectionIntro: 'Vigtige ting at vide inden og under brugen.',
    facts: [
      {
        title: 'Hver uge',
        text: 'Plasteret skiftes én gang om ugen.',
      },
      {
        title: 'Tør hud',
        text: 'Skal påføres på ren, tør hud.',
      },
      {
        title: 'Beskyttelse',
        text: 'Det virker kontinuerligt ved korrekt brug.',
      },
      {
        title: 'Hold øje',
        text: 'Hudirritation på påføringsstedet kan sommetider forekomme.',
      },
    ],
    comparisonTitle: 'Fordele og begrænsninger',
    advantageTitle: 'Fordele',
    advantages: [
      '• Påsættes én gang om ugen',
      '• Ingen daglig dosis',
      '• Kontinuerlig hormonudledning',
    ],
    limitTitle: 'Begrænsninger',
    limits: [
      'Beskytter ikke mod seksuelt overførte infektioner',
      'Kan give hudirritation',
      'Skifteplanen skal overholdes',
    ],
    alertTitle: 'Bemærk',
    alertText: 'Let irritation kan forekomme på påføringsstedet. At skifte påføringssteder kan hjælpe med at reducere dette.',
    rememberTitle: '3 vigtige ting at huske',
    remember: [
      'Skift plasteret hver uge.',
      'Tjek regelmæssigt at plasteret sidder godt fast.',
      'Kontakt en sundhedsprofessionel om nødvendigt.',
    ],
    shareMessage: 'Præventionsplasteret — AWA',
  },
  da: {
    badge: 'PRÄVENTIONSPLASTER',
    title: 'Präventions-\nplasteret',
    metaDuration: '5 min läsning',
    metaType: 'Artikel',
    metaLevel: 'Grundläggende',
    metaValidated: 'Gennemgået indhold',
    intro: 'Et veckantligt alternativ till den daglige pille.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvordan plasteret virker',
      'Brugsplan',
      'Hvad du bör vide',
      'Vigtige pointer',
    ],
    section1Body: 'Plasteret frigiver konstant hormoner gennem huden och virker ligesom en kombinationspille: det forhindrer äglösning och fortykker livmoderhalsslim.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Dets vigtigste fordel ar, at der inte skal tages en daglig dosis.',
    section2Body: 'Typisk skiftes plasteret én gang om veckan i tre veckor, efterfulgt av en vecka uden plaster.',
    applicationTips: [
      'Skift påföringssted ved hvert nyt plaster',
      'Kontroller at plasteret fortfarande sidder godt fast',
      'Påför på ren, tör hud',
    ],
    sectionIntro: 'Vigtige ting at vide inden och under brugen.',
    facts: [
      {
        title: 'Hver uge',
        text: 'Plasteret skiftes én gang om veckan.',
      },
      {
        title: 'Tör hud',
        text: 'Skal påföres på ren, tör hud.',
      },
      {
        title: 'Beskyttelse',
        text: 'Det virker kontinuerligt ved korrekt brug.',
      },
      {
        title: 'Hold öje',
        text: 'Hudirritation på påföringsstedet kan sommetider forekomme.',
      },
    ],
    comparisonTitle: 'Fordele och begränsninger',
    advantageTitle: 'Fordele',
    advantages: [
      '• Påsättes én gang om veckan',
      '• Ingen daglig dosis',
      '• Kontinuerlig hormonudledning',
    ],
    limitTitle: 'Begränsninger',
    limits: [
      'Beskytter inte mod seksuelt overförte infektioner',
      'Kan give hudirritation',
      'Skifteplanen skal overholdes',
    ],
    alertTitle: 'Bemärk',
    alertText: 'Let irritation kan forekomme på påföringsstedet. At skifte påföringssteder kan hjälpe med at reducere dette.',
    rememberTitle: '3 vigtige ting at huske',
    remember: [
      'Skift plasteret hver vecka.',
      'Tjek regelmässigt at plasteret sidder godt fast.',
      'Kontakt en halsasprofessionel om nödvendigt.',
    ],
    shareMessage: 'Präventionsplasteret — AWA',
  },
  sv: {
    badge: 'PRÄVENTIONSPLASTER',
    title: 'Präventions-\nplasteret',
    metaDuration: '5 min läsning',
    metaType: 'Artikel',
    metaLevel: 'Grundläggende',
    metaValidated: 'Gennemgået indhold',
    intro: 'Et veckantligt alternativ till den daglige pille.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvordan plasteret virker',
      'Brugsplan',
      'Hvad du bör vide',
      'Vigtige pointer',
    ],
    section1Body: 'Plasteret frigiver konstant hormoner gennem huden och virker ligesom en kombinationspille: det forhindrer äglösning och fortykker livmoderhalsslim.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Dets vigtigste fordel ar, at der inte skal tages en daglig dosis.',
    section2Body: 'Typisk skiftes plasteret én gang om veckan i tre veckor, efterfulgt av en vecka uden plaster.',
    applicationTips: [
      'Skift påföringssted ved hvert nyt plaster',
      'Kontroller at plasteret fortfarande sidder godt fast',
      'Påför på ren, tör hud',
    ],
    sectionIntro: 'Vigtige ting at vide inden och under brugen.',
    facts: [
      {
        title: 'Hver uge',
        text: 'Plasteret skiftes én gang om veckan.',
      },
      {
        title: 'Tör hud',
        text: 'Skal påföres på ren, tör hud.',
      },
      {
        title: 'Beskyttelse',
        text: 'Det virker kontinuerligt ved korrekt brug.',
      },
      {
        title: 'Hold öje',
        text: 'Hudirritation på påföringsstedet kan sommetider forekomme.',
      },
    ],
    comparisonTitle: 'Fordele och begränsninger',
    advantageTitle: 'Fordele',
    advantages: [
      '• Påsättes én gang om veckan',
      '• Ingen daglig dosis',
      '• Kontinuerlig hormonudledning',
    ],
    limitTitle: 'Begränsninger',
    limits: [
      'Beskytter inte mod seksuelt overförte infektioner',
      'Kan give hudirritation',
      'Skifteplanen skal overholdes',
    ],
    alertTitle: 'Bemärk',
    alertText: 'Let irritation kan forekomme på påföringsstedet. At skifte påföringssteder kan hjälpe med at reducere dette.',
    rememberTitle: '3 vigtige ting at huske',
    remember: [
      'Skift plasteret hver vecka.',
      'Tjek regelmässigt at plasteret sidder godt fast.',
      'Kontakt en halsasprofessionel om nödvendigt.',
    ],
    shareMessage: 'Präventionsplasteret — AWA',
  },
} as const);

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function PatchArticleScreen({
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
          <Image source={resolveEditorialImage(HERO, lang)} resizeMode="cover" style={styles.hero} />

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

          {/* METADATA */}
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

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section1Body}</AwaText>

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

          {/* SECTION 2 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>2. {content.topics[1]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section2Body}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.applicationTips.map(item => (
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

          {/* SECTION 3 */}
          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.topics[2]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.sectionIntro}>{content.sectionIntro}</AwaText>

          {/* VISUAL FACT CARDS */}
          <View style={styles.factGrid}>
            {content.facts.map((item, index) => (
              <AwaCard variant="filled" padding="none" key={item.title} style={styles.factCard}>
                <View style={styles.factIcon}>
                  <MaterialDesignIcons
                    name={PATCH_FACT_ICONS[index] as never}
                    size={23}
                    color={theme.colors.primary}
                  />
                </View>

                <AwaText variant="titleSmall" emphasized>{item.title}</AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.factText}>{item.text}</AwaText>
              </AwaCard>
            ))}
          </View>

          {/* ADVANTAGES / LIMITS SCHEMA */}
          <AwaCard variant="filled" padding="none" style={styles.comparisonCard}>
            <View style={styles.comparisonHeader}>
              <MaterialDesignIcons
                name="scale-balance"
                size={22}
                color={theme.colors.primary}
              />

              <AwaText variant="titleMedium" emphasized>
                {content.comparisonTitle}
              </AwaText>
            </View>

            <View style={styles.comparisonColumns}>
              {/* ADVANTAGES */}
              <View style={styles.column}>
                <View style={styles.columnTitleRow}>
                  <MaterialDesignIcons
                    name="check-circle"
                    size={18}
                    color={theme.colors.success}
                  />

                  <AwaText variant="titleSmall" emphasized colorRole="success">{content.advantageTitle}</AwaText>
                </View>

                {content.advantages.map(item => (
                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" key={item} style={styles.columnItem}>
                    {item}
                  </AwaText>
                ))}
              </View>

              {/* LIMITS */}
              <View style={styles.column}>
                <View style={styles.columnTitleRow}>
                  <MaterialDesignIcons
                    name="alert-circle"
                    size={18}
                    color={theme.colors.warning}
                  />

                  <AwaText variant="titleSmall" emphasized colorRole="warning">{content.limitTitle}</AwaText>
                </View>

                {content.limits.map(item => (
                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" key={item} style={styles.columnItem}>
                    • {item}
                  </AwaText>
                ))}
              </View>
            </View>
          </AwaCard>

          {/* ALERT */}
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

          <AwaCard variant="filled" padding="none" style={styles.rememberCard}>
            <View style={styles.rememberIcon}>
              <MaterialDesignIcons
                name="check-decagram-outline"
                size={26}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.rememberContent}>
              <AwaText variant="titleSmall" emphasized style={styles.rememberTitle}>
                {content.rememberTitle}
              </AwaText>

              {content.remember.map((item, index) => (
                <View key={item} style={styles.rememberRow}>
                  <AwaText variant="labelSmall" emphasized colorRole="primary" style={styles.rememberNumber}>
                    {String(index + 1).padStart(2, '0')}
                  </AwaText>
                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.rememberText}>{item}</AwaText>
                </View>
              ))}
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

  sectionIntro: {
    marginTop: 8,
  },

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

  checkText: {
    flex: 1,
  },

  /* FACT CARDS */

  factGrid: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },

  factCard: {
    width: '48.5%',
    minHeight: 145,
    padding: 12,
  },

  factIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    marginBottom: 8,
  },


  factText: {
    marginTop: 4,
  },

  /* COMPARISON */

  comparisonCard: {
    marginTop: 16,
    padding: 16,
  },

  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },


  comparisonColumns: {
    flexDirection: 'row',
    gap: 12,
  },

  column: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
  },

  columnTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },



  columnItem: {
    marginBottom: 8,
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

  /* ALERT */

  alert: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },

  /* REMEMBER */

  rememberCard: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
  },

  rememberIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  rememberContent: {
    flex: 1,
    marginLeft: 12,
  },

  rememberTitle: {
    marginBottom: 8,
  },

  rememberRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },

  rememberNumber: {
    width: 28,
    marginTop: 2,
  },

  rememberText: {
    flex: 1,
  },
  });
}
