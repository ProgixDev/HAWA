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
  nb: {
    badge: 'PREVENSJONSPLASTER',
    title: 'Prevensjons-\nplasteret',
    metaDuration: '5 min lesing',
    metaType: 'Artikkel',
    metaLevel: 'Nybegynner',
    metaValidated: 'Gjennomgått innhold',
    intro: 'Et ukentlig alternativ til den daglige p-pillen.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Hvordan plasteret virker',
      'Plan for påsetting',
      'Det du trenger å vite',
      'Det viktigste å huske',
    ],
    section1Body:
      'Plasteret frigjør hormoner kontinuerlig gjennom huden og virker på en måte som kan sammenlignes med kombinasjonspillen: det hindrer eggløsning og gjør livmorhalsslimet tykkere.',
    tip1Title: 'Godt å vite',
    tip1Text:
      'Hovedfordelen er at det ikke krever en daglig dose.',
    section2Body:
      'Plasteret byttes vanligvis én gang i uken i tre uker, etterfulgt av en uke uten plaster.',
    applicationTips: [
      'Bytt påsettingssted hver gang',
      'Kontroller at det fortsatt sitter godt fast',
      'Sett det på ren, tørr hud',
    ],
    sectionIntro:
      'De viktigste punktene å kjenne til før og under bruk.',
    facts: [
      {title: 'Hver uke', text: 'Plasteret byttes én gang i uken.'},
      {title: 'Tørr hud', text: 'Det må settes på ren, tørr hud.'},
      {title: 'Beskyttelse', text: 'Det virker kontinuerlig når det brukes riktig.'},
      {title: 'Vær oppmerksom på', text: 'Lokal irritasjon kan noen ganger oppstå.'},
    ],
    comparisonTitle: 'Fordeler og begrensninger',
    advantageTitle: 'Fordeler',
    advantages: [
      '• Én påsetting i uken',
      '• Ingen daglig dose',
      '• Kontinuerlig frigjøring av hormoner',
    ],
    limitTitle: 'Begrensninger',
    limits: [
      'Beskytter ikke mot SOI',
      'Kan gi hudirritasjon',
      'Krever at man holder seg til byttetidspunktene',
    ],
    alertTitle: 'Merk',
    alertText:
      'Lett irritasjon kan oppstå på påsettingsstedet. Å bytte påsettingssted kan bidra til å begrense dette.',
    rememberTitle: 'De 3 viktigste',
    remember: [
      'Bytt plaster hver uke.',
      'Kontroller jevnlig at det sitter godt fast.',
      'Spør helsepersonell om råd ved behov.',
    ],
    shareMessage: 'Prevensjonsplasteret – AWA',
  },
  pl: {
    badge: 'PLASTER ANTYKONCEPCYJNY',
    title: 'Plaster\nantykoncepcyjny',
    metaDuration: '5 min czytania',
    metaType: 'Artykuł',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Cotygodniowa alternatywa dla codziennej tabletki.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Jak działa plaster',
      'Harmonogram stosowania',
      'Co warto wiedzieć',
      'Najważniejsze wnioski',
    ],
    section1Body:
      'Plaster stale uwalnia hormony przez skórę, działając w sposób porównywalny do tabletki złożonej: zapobiega owulacji i zagęszcza śluz szyjkowy.',
    tip1Title: 'Warto wiedzieć',
    tip1Text:
      'Jego główną zaletą jest to, że nie wymaga codziennej dawki.',
    section2Body:
      'Plaster zmienia się zazwyczaj raz w tygodniu przez trzy tygodnie, po czym następuje tydzień bez plastra.',
    applicationTips: [
      'Za każdym razem zmieniaj miejsce przyklejenia',
      'Sprawdzaj, czy nadal mocno się trzyma',
      'Przyklejaj go na czystą, suchą skórę',
    ],
    sectionIntro:
      'Najważniejsze informacje przed użyciem i w trakcie stosowania.',
    facts: [
      {title: 'Co tydzień', text: 'Plaster wymienia się raz w tygodniu.'},
      {title: 'Sucha skóra', text: 'Należy go przyklejać na czystą, suchą skórę.'},
      {title: 'Ochrona', text: 'Przy prawidłowym stosowaniu działa nieprzerwanie.'},
      {title: 'Zwróć uwagę', text: 'Czasem może wystąpić miejscowe podrażnienie.'},
    ],
    comparisonTitle: 'Zalety i ograniczenia',
    advantageTitle: 'Zalety',
    advantages: [
      '• Jedno przyklejenie tygodniowo',
      '• Brak codziennej dawki',
      '• Ciągłe uwalnianie hormonów',
    ],
    limitTitle: 'Ograniczenia',
    limits: [
      'Nie chroni przed chorobami przenoszonymi drogą płciową',
      'Może powodować podrażnienie skóry',
      'Wymaga przestrzegania harmonogramu wymiany',
    ],
    alertTitle: 'Zwróć uwagę',
    alertText:
      'W miejscu przyklejenia może pojawić się lekkie podrażnienie. Zmienianie miejsc przyklejenia może pomóc je ograniczyć.',
    rememberTitle: '3 najważniejsze zasady',
    remember: [
      'Zmieniaj plaster co tydzień.',
      'Regularnie sprawdzaj, czy dobrze się trzyma.',
      'W razie potrzeby poproś o radę specjalistę.',
    ],
    shareMessage: 'Plaster antykoncepcyjny — AWA',
  },
  uk: {
    badge: 'КОНТРАЦЕПТИВНИЙ ПЛАСТИР',
    title: 'Контрацептивний\nпластир',
    metaDuration: '5 хв читання',
    metaType: 'Стаття',
    metaLevel: 'Початковий',
    metaValidated: 'Перевірений вміст',
    intro: 'Щотижнева альтернатива щоденній таблетці.',
    contentsTitle: 'У цій статті',
    topics: [
      'Як працює пластир',
      'Графік застосування',
      'Що варто знати',
      'Головні висновки',
    ],
    section1Body:
      'Пластир постійно вивільняє гормони через шкіру, діючи подібно до комбінованої таблетки: він запобігає овуляції та згущує цервікальний слиз.',
    tip1Title: 'Варто знати',
    tip1Text:
      'Його головна перевага в тому, що не потребує щоденної дози.',
    section2Body:
      'Пластир зазвичай змінюють раз на тиждень протягом трьох тижнів, після чого настає тиждень без пластиру.',
    applicationTips: [
      'Щоразу змінюйте місце накладання',
      'Перевіряйте, чи він усе ще міцно тримається',
      'Накладайте його на чисту суху шкіру',
    ],
    sectionIntro:
      'Ключові моменти, які варто знати до та під час застосування.',
    facts: [
      {title: 'Щотижня', text: 'Пластир змінюють раз на тиждень.'},
      {title: 'Суха шкіра', text: 'Його слід накладати на чисту суху шкіру.'},
      {title: 'Захист', text: 'За правильного застосування він діє безперервно.'},
      {title: 'Зверніть увагу', text: 'Іноді може виникнути місцеве подразнення.'},
    ],
    comparisonTitle: 'Переваги та обмеження',
    advantageTitle: 'Переваги',
    advantages: [
      '• Одне накладання на тиждень',
      '• Без щоденної дози',
      '• Безперервне вивільнення гормонів',
    ],
    limitTitle: 'Обмеження',
    limits: [
      'Не захищає від інфекцій, що передаються статевим шляхом',
      'Може викликати подразнення шкіри',
      'Потребує дотримання графіка заміни',
    ],
    alertTitle: 'Зверніть увагу',
    alertText:
      'У місці накладання може з’явитися легке подразнення. Чергування місць накладання може допомогти його обмежити.',
    rememberTitle: '3 головні речі',
    remember: [
      'Змінюйте пластир щотижня.',
      'Регулярно перевіряйте, чи він добре тримається.',
      'За потреби попросіть поради в медичного працівника.',
    ],
    shareMessage: 'Контрацептивний пластир — AWA',
  },
  cs: {
    badge: 'ANTIKONCEPČNÍ NÁPLAST',
    title: 'Antikoncepční\nnáplast',
    metaDuration: '5 min čtení',
    metaType: 'Článek',
    metaLevel: 'Začátečník',
    metaValidated: 'Ověřený obsah',
    intro: 'Týdenní alternativa k denní pilulce.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Jak náplast funguje',
      'Rozvrh aplikace',
      'Co potřebujete vědět',
      'Hlavní poznatky',
    ],
    section1Body:
      'Náplast průběžně uvolňuje hormony přes kůži a působí způsobem srovnatelným s kombinovanou pilulkou: zabraňuje ovulaci a zahušťuje cervikální hlen.',
    tip1Title: 'Stojí za to vědět',
    tip1Text:
      'Jejím hlavním přínosem je, že nevyžaduje denní dávku.',
    section2Body:
      'Náplast se obvykle mění jednou týdně po dobu tří týdnů, po nichž následuje týden bez náplasti.',
    applicationTips: [
      'Pokaždé měňte místo aplikace',
      'Kontrolujte, zda stále pevně drží',
      'Aplikujte ji na čistou, suchou kůži',
    ],
    sectionIntro:
      'Klíčové body, které je třeba znát před použitím i během něj.',
    facts: [
      {title: 'Každý týden', text: 'Náplast se mění jednou týdně.'},
      {title: 'Suchá kůže', text: 'Musí se aplikovat na čistou, suchou kůži.'},
      {title: 'Ochrana', text: 'Při správném používání působí nepřetržitě.'},
      {title: 'Na co dát pozor', text: 'Občas se může objevit místní podráždění.'},
    ],
    comparisonTitle: 'Výhody a limity',
    advantageTitle: 'Výhody',
    advantages: [
      '• Jedna aplikace týdně',
      '• Žádná denní dávka',
      '• Nepřetržité uvolňování hormonů',
    ],
    limitTitle: 'Limity',
    limits: [
      'Nechrání před sexuálně přenosnými infekcemi',
      'Může způsobit podráždění kůže',
      'Vyžaduje dodržování rozvrhu výměn',
    ],
    alertTitle: 'Upozornění',
    alertText:
      'V místě aplikace se může objevit mírné podráždění. Střídání míst aplikace to může pomoci omezit.',
    rememberTitle: '3 základní věci',
    remember: [
      'Měňte náplast každý týden.',
      'Pravidelně kontrolujte, zda dobře drží.',
      'V případě potřeby požádejte o radu zdravotnického pracovníka.',
    ],
    shareMessage: 'Antikoncepční náplast — AWA',
  },
  sk: {
    badge: 'ANTIKONCEPČNÁ NÁPLASŤ',
    title: 'Antikoncepčná\nnáplasť',
    metaDuration: '5 min čítania',
    metaType: 'Článok',
    metaLevel: 'Začiatočník',
    metaValidated: 'Overený obsah',
    intro: 'Týždenná alternatíva ku každodennej tablete.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Ako náplasť funguje',
      'Rozvrh aplikácie',
      'Čo treba vedieť',
      'Hlavné body',
    ],
    section1Body:
      'Náplasť nepretržite uvoľňuje hormóny cez kožu a pôsobí podobne ako kombinovaná tableta: bráni ovulácii a zahusťuje cervikálny hlien.',
    tip1Title: 'Stojí za to vedieť',
    tip1Text:
      'Jej hlavnou výhodou je, že nevyžaduje dennú dávku.',
    section2Body:
      'Náplasť sa zvyčajne vymieňa raz týždenne počas troch týždňov, po ktorých nasleduje týždeň bez náplasti.',
    applicationTips: [
      'Pri každej výmene zmeňte miesto aplikácie',
      'Skontrolujte, či stále pevne drží',
      'Aplikujte ju na čistú a suchú pokožku',
    ],
    sectionIntro:
      'Kľúčové body, ktoré treba poznať pred používaním aj počas neho.',
    facts: [
      {title: 'Každý týždeň', text: 'Náplasť sa vymieňa raz týždenne.'},
      {title: 'Suchá pokožka', text: 'Musí sa aplikovať na čistú a suchú pokožku.'},
      {title: 'Ochrana', text: 'Pri správnom používaní pôsobí nepretržite.'},
      {title: 'Pozor na', text: 'Občas sa môže objaviť miestne podráždenie.'},
    ],
    comparisonTitle: 'Výhody a obmedzenia',
    advantageTitle: 'Výhody',
    advantages: [
      '• Jedna aplikácia týždenne',
      '• Žiadna denná dávka',
      '• Nepretržité uvoľňovanie hormónov',
    ],
    limitTitle: 'Obmedzenia',
    limits: [
      'Nechráni pred STI',
      'Môže spôsobiť podráždenie kože',
      'Vyžaduje dodržiavanie rozvrhu výmeny',
    ],
    alertTitle: 'Upozornenie',
    alertText:
      'Na mieste aplikácie sa môže objaviť mierne podráždenie. Striedanie miest aplikácie môže pomôcť ho obmedziť.',
    rememberTitle: '3 základné veci',
    remember: [
      'Náplasť meňte každý týždeň.',
      'Pravidelne kontrolujte, či dobre drží.',
      'V prípade potreby požiadajte o radu zdravotníckeho pracovníka.',
    ],
    shareMessage: 'Antikoncepčná náplasť — AWA',
  },
  hu: {
    badge: 'FOGAMZÁSGÁTLÓ TAPASZ',
    title: 'A fogamzásgátló\ntapasz',
    metaDuration: '5 perc olvasás',
    metaType: 'Cikk',
    metaLevel: 'Kezdő',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'Heti alternatíva a napi tablettához.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Hogyan működik a tapasz',
      'A felhelyezés ütemezése',
      'Amit tudnod kell',
      'Legfontosabb tudnivalók',
    ],
    section1Body:
      'A tapasz folyamatosan hormonokat bocsát ki a bőrön keresztül, a kombinált tablettához hasonló módon működve: megakadályozza a peteérést, és sűrűbbé teszi a méhnyaknyálkát.',
    tip1Title: 'Érdemes tudni',
    tip1Text:
      'Fő előnye, hogy nem igényel napi adagot.',
    section2Body:
      'A tapaszt általában hetente egyszer cserélik három héten át, amelyet egy tapasz nélküli hét követ.',
    applicationTips: [
      'Minden alkalommal változtasd a felhelyezés helyét',
      'Ellenőrizd, hogy még szilárdan tapad-e',
      'Tiszta, száraz bőrre helyezd fel',
    ],
    sectionIntro:
      'A kulcspontok, amelyeket a használat előtt és alatt érdemes tudni.',
    facts: [
      {title: 'Minden héten', text: 'A tapaszt hetente egyszer cserélik.'},
      {title: 'Száraz bőr', text: 'Tiszta, száraz bőrre kell felhelyezni.'},
      {title: 'Védelem', text: 'Helyes használat esetén folyamatosan hat.'},
      {title: 'Figyelj arra', text: 'Alkalmanként helyi irritáció léphet fel.'},
    ],
    comparisonTitle: 'Előnyök és korlátok',
    advantageTitle: 'Előnyök',
    advantages: [
      '• Hetente egy felhelyezés',
      '• Nincs napi adag',
      '• Folyamatos hormonleadás',
    ],
    limitTitle: 'Korlátok',
    limits: [
      'Nem véd az STI-k ellen',
      'Bőrirritációt okozhat',
      'A cserék ütemezésének betartását igényli',
    ],
    alertTitle: 'Figyelem',
    alertText:
      'A felhelyezés helyén enyhe irritáció jelentkezhet. A felhelyezési helyek váltogatása segíthet ezt korlátozni.',
    rememberTitle: 'A 3 legfontosabb',
    remember: [
      'Cseréld a tapaszt minden héten.',
      'Rendszeresen ellenőrizd, hogy jól tapad-e.',
      'Szükség esetén kérj tanácsot egészségügyi szakembertől.',
    ],
    shareMessage: 'A fogamzásgátló tapasz — AWA',
  },
  ro: {
    badge: 'PLASTURE CONTRACEPTIV',
    title: 'Plasturele\ncontraceptiv',
    metaDuration: '5 min de citit',
    metaType: 'Articol',
    metaLevel: 'Începător',
    metaValidated: 'Conținut revizuit',
    intro: 'O alternativă săptămânală la pilula zilnică.',
    contentsTitle: 'În acest articol',
    topics: [
      'Cum funcționează plasturele',
      'Programul de aplicare',
      'Ce trebuie să știi',
      'Ce să reții',
    ],
    section1Body:
      'Plasturele eliberează continuu hormoni prin piele, funcționând într-un mod comparabil cu pilula combinată: împiedică ovulația și îngroașă mucusul cervical.',
    tip1Title: 'Bine de știut',
    tip1Text:
      'Principalul său avantaj este că nu necesită o doză zilnică.',
    section2Body:
      'Plasturele se schimbă în general o dată pe săptămână, timp de trei săptămâni, urmate de o săptămână fără plasture.',
    applicationTips: [
      'Schimbă locul de aplicare de fiecare dată',
      'Verifică dacă este încă bine lipit',
      'Aplică-l pe piele curată și uscată',
    ],
    sectionIntro:
      'Punctele-cheie de știut înainte și în timpul folosirii.',
    facts: [
      {title: 'În fiecare săptămână', text: 'Plasturele se înlocuiește o dată pe săptămână.'},
      {title: 'Piele uscată', text: 'Trebuie aplicat pe piele curată și uscată.'},
      {title: 'Protecție', text: 'Funcționează continuu atunci când este folosit corect.'},
      {title: 'De urmărit', text: 'Uneori poate apărea o iritație locală.'},
    ],
    comparisonTitle: 'Avantaje și limite',
    advantageTitle: 'Avantaje',
    advantages: [
      '• O aplicare pe săptămână',
      '• Fără doză zilnică',
      '• Eliberare continuă de hormoni',
    ],
    limitTitle: 'Limite',
    limits: [
      'Nu protejează împotriva ITS',
      'Poate provoca iritații ale pielii',
      'Necesită respectarea calendarului de înlocuire',
    ],
    alertTitle: 'Atenție',
    alertText:
      'O ușoară iritație poate apărea la locul de aplicare. Alternarea locurilor de aplicare poate ajuta la limitarea ei.',
    rememberTitle: 'Cele 3 lucruri esențiale',
    remember: [
      'Schimbă plasturele în fiecare săptămână.',
      'Verifică regulat dacă se lipește bine.',
      'Cere sfatul unui profesionist din domeniul sănătății, la nevoie.',
    ],
    shareMessage: 'Plasturele contraceptiv — AWA',
  },
  bg: {
    badge: 'КОНТРАЦЕПТИВЕН ПЛАСТИР',
    title: 'Контрацептивният\nпластир',
    metaDuration: '5 мин четене',
    metaType: 'Статия',
    metaLevel: 'Начинаещ',
    metaValidated: 'Проверено съдържание',
    intro: 'Седмична алтернатива на ежедневното хапче.',
    contentsTitle: 'В тази статия',
    topics: [
      'Как действа пластирът',
      'График на поставяне',
      'Какво трябва да знаеш',
      'Какво да запомниш',
    ],
    section1Body:
      'Пластирът непрекъснато освобождава хормони през кожата и действа по начин, сравним с комбинираното хапче: предотвратява овулацията и сгъстява цервикалната слуз.',
    tip1Title: 'Добре е да знаеш',
    tip1Text:
      'Основното му предимство е, че не изисква ежедневен прием.',
    section2Body:
      'Пластирът обикновено се сменя веднъж седмично в продължение на три седмици, последвани от една седмица без пластир.',
    applicationTips: [
      'Сменяй мястото на поставяне всеки път',
      'Проверявай дали все още е здраво залепен',
      'Поставяй го върху чиста и суха кожа',
    ],
    sectionIntro:
      'Основните неща, които да знаеш преди и по време на употреба.',
    facts: [
      {title: 'Всяка седмица', text: 'Пластирът се сменя веднъж седмично.'},
      {title: 'Суха кожа', text: 'Трябва да се поставя върху чиста и суха кожа.'},
      {title: 'Защита', text: 'Действа непрекъснато, когато се използва правилно.'},
      {title: 'Внимание', text: 'Понякога може да се появи местно дразнене.'},
    ],
    comparisonTitle: 'Предимства и ограничения',
    advantageTitle: 'Предимства',
    advantages: [
      '• Едно поставяне седмично',
      '• Без ежедневен прием',
      '• Непрекъснато освобождаване на хормони',
    ],
    limitTitle: 'Ограничения',
    limits: [
      'Не предпазва от ППИ',
      'Може да предизвика дразнене на кожата',
      'Изисква спазване на графика за смяна',
    ],
    alertTitle: 'Обърни внимание',
    alertText:
      'На мястото на поставяне може да се появи леко дразнене. Редуването на местата на поставяне може да помогне да се ограничи.',
    rememberTitle: 'Трите основни неща',
    remember: [
      'Сменяй пластира всяка седмица.',
      'Проверявай редовно дали залепва добре.',
      'При нужда поискай съвет от здравен специалист.',
    ],
    shareMessage: 'Контрацептивният пластир — AWA',
  },
  sr: {
    badge: 'КОНТРАЦЕПТИВНИ ФЛАСТЕР',
    title: 'Контрацептивни\nфластер',
    metaDuration: '5 мин читања',
    metaType: 'Чланак',
    metaLevel: 'Почетник',
    metaValidated: 'Проверен садржај',
    intro: 'Седмична алтернатива дневној пилули.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Како фластер делује',
      'Распоред стављања',
      'Шта треба да знаш',
      'Шта да запамтиш',
    ],
    section1Body:
      'Фластер непрекидно ослобађа хормоне кроз кожу и делује на начин упоредив са комбинованом пилулом: спречава овулацију и згушњава цервикалну слуз.',
    tip1Title: 'Добро је знати',
    tip1Text:
      'Његова главна предност је да не захтева дневну дозу.',
    section2Body:
      'Фластер се обично мења једном недељно током три недеље, а затим следи једна недеља без фластера.',
    applicationTips: [
      'Сваки пут промени место стављања',
      'Провери да ли је и даље чврсто залепљен',
      'Стави га на чисту, суву кожу',
    ],
    sectionIntro:
      'Кључне ствари које треба знати пре и током употребе.',
    facts: [
      {title: 'Сваке недеље', text: 'Фластер се мења једном недељно.'},
      {title: 'Сува кожа', text: 'Мора се ставити на чисту, суву кожу.'},
      {title: 'Заштита', text: 'Делује непрекидно када се правилно користи.'},
      {title: 'Пази', text: 'Понекад може доћи до локалне иритације.'},
    ],
    comparisonTitle: 'Предности и ограничења',
    advantageTitle: 'Предности',
    advantages: [
      '• Једно стављање недељно',
      '• Без дневне дозе',
      '• Непрекидно ослобађање хормона',
    ],
    limitTitle: 'Ограничења',
    limits: [
      'Не штити од ППИ',
      'Може изазвати иритацију коже',
      'Захтева придржавање распореда замене',
    ],
    alertTitle: 'Обрати пажњу',
    alertText:
      'На месту стављања може се појавити лагана иритација. Смењивање места стављања може помоћи да се ово ограничи.',
    rememberTitle: 'Три основна правила',
    remember: [
      'Мењај фластер сваке недеље.',
      'Редовно проверавај да ли добро належе.',
      'По потреби затражи савет од здравственог радника.',
    ],
    shareMessage: 'Контрацептивни фластер — AWA',
  },
  hr: {
    badge: 'KONTRACEPCIJSKI FLASTER',
    title: 'Kontracepcijski\nflaster',
    metaDuration: '5 min čitanja',
    metaType: 'Članak',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Tjedna alternativa svakodnevnoj tableti.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Kako flaster djeluje',
      'Raspored primjene',
      'Što trebaš znati',
      'Ključne poruke',
    ],
    section1Body:
      'Flaster kontinuirano otpušta hormone kroz kožu, a djeluje na način usporediv s kombiniranom tabletom: sprječava ovulaciju i zgušnjava cervikalnu sluz.',
    tip1Title: 'Dobro je znati',
    tip1Text:
      'Njegova je glavna prednost što ne zahtijeva svakodnevnu dozu.',
    section2Body:
      'Flaster se općenito mijenja jednom tjedno tijekom tri tjedna, nakon čega slijedi tjedan bez flastera.',
    applicationTips: [
      'Svaki put promijeni mjesto primjene',
      'Provjeri je li još čvrsto zalijepljen',
      'Zalijepi ga na čistu, suhu kožu',
    ],
    sectionIntro:
      'Ključne točke koje treba znati prije i tijekom uporabe.',
    facts: [
      {title: 'Svaki tjedan', text: 'Flaster se mijenja jednom tjedno.'},
      {title: 'Suha koža', text: 'Mora se zalijepiti na čistu, suhu kožu.'},
      {title: 'Zaštita', text: 'Djeluje kontinuirano kada se pravilno koristi.'},
      {title: 'Na što paziti', text: 'Ponekad se može javiti lokalna iritacija.'},
    ],
    comparisonTitle: 'Prednosti i ograničenja',
    advantageTitle: 'Prednosti',
    advantages: [
      '• Jedna primjena tjedno',
      '• Nema svakodnevne doze',
      '• Kontinuirano otpuštanje hormona',
    ],
    limitTitle: 'Ograničenja',
    limits: [
      'Ne štiti od SPI',
      'Može uzrokovati iritaciju kože',
      'Zahtijeva pridržavanje rasporeda zamjene',
    ],
    alertTitle: 'Napomena',
    alertText:
      'Na mjestu primjene može se pojaviti blaga iritacija. Izmjenjivanje mjesta primjene može je pomoći ograničiti.',
    rememberTitle: '3 najvažnije stvari',
    remember: [
      'Mijenjaj flaster svaki tjedan.',
      'Redovito provjeravaj prianja li dobro.',
      'Po potrebi zatraži savjet zdravstvenog djelatnika.',
    ],
    shareMessage: 'Kontracepcijski flaster — AWA',
  },
  bs: {
    badge: 'KONTRACEPCIJSKI FLASTER',
    title: 'Kontracepcijski\nflaster',
    metaDuration: '5 min čitanja',
    metaType: 'Članak',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Sedmična alternativa svakodnevnoj tableti.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Kako flaster djeluje',
      'Raspored primjene',
      'Što trebaš znati',
      'Ključne poruke',
    ],
    section1Body:
      'Flaster kontinuirano otpušta hormone kroz kožu, a djeluje na način usporediv s kombiniranom tabletom: sprječava ovulaciju i zgušnjava cervikalnu sluz.',
    tip1Title: 'Dobro je znati',
    tip1Text:
      'Njegova je glavna prednost što ne zahtijeva svakodnevnu dozu.',
    section2Body:
      'Flaster se općenito mijenja jednom sedmično tokom tri sedmice, nakon čega slijedi sedmica bez flastera.',
    applicationTips: [
      'Svaki put promijeni mjesto primjene',
      'Provjeri je li još čvrsto zalijepljen',
      'Zalijepi ga na čistu, suhu kožu',
    ],
    sectionIntro:
      'Ključne tačke koje treba znati prije i tokom uporabe.',
    facts: [
      {title: 'Svaka sedmica', text: 'Flaster se mijenja jednom sedmično.'},
      {title: 'Suha koža', text: 'Mora se zalijepiti na čistu, suhu kožu.'},
      {title: 'Zaštita', text: 'Djeluje kontinuirano kada se pravilno koristi.'},
      {title: 'Na što paziti', text: 'Ponekad se može javiti lokalna iritacija.'},
    ],
    comparisonTitle: 'Prednosti i ograničenja',
    advantageTitle: 'Prednosti',
    advantages: [
      '• Jedna primjena sedmično',
      '• Nema svakodnevne doze',
      '• Kontinuirano otpuštanje hormona',
    ],
    limitTitle: 'Ograničenja',
    limits: [
      'Ne štiti od SPI',
      'Može uzrokovati iritaciju kože',
      'Zahtijeva pridržavanje rasporeda zamjene',
    ],
    alertTitle: 'Napomena',
    alertText:
      'Na mjestu primjene može se pojaviti blaga iritacija. Izmjenjivanje mjesta primjene može je pomoći ograničiti.',
    rememberTitle: '3 najvažnije stvari',
    remember: [
      'Mijenjaj flaster svaka sedmica.',
      'Redovito provjeravaj prianja li dobro.',
      'Po potrebi zatraži savjet zdravstvenog radnika.',
    ],
    shareMessage: 'Kontracepcijski flaster — AWA',
  },
  sl: {
    badge: 'KONTRACEPCIJSKI OBLIŽ',
    title: 'Kontracepcijski\nobliž',
    metaDuration: '5 min branja',
    metaType: 'Članek',
    metaLevel: 'Začetnica',
    metaValidated: 'Preverjena vsebina',
    intro: 'Tedenska alternativa vsakodnevni tableti.',
    contentsTitle: 'V tem članku',
    topics: [
      'Kako obliž deluje',
      'Razpored lepljenja',
      'Kaj moraš vedeti',
      'Ključna sporočila',
    ],
    section1Body:
      'Obliž neprekinjeno sprošča hormone skozi kožo in deluje na način, primerljiv s kombinirano tableto: preprečuje ovulacijo in zgošča materničnovratno sluz.',
    tip1Title: 'Vredno vedeti',
    tip1Text:
      'Njegova glavna prednost je, da ne zahteva vsakodnevnega odmerka.',
    section2Body:
      'Obliž se na splošno menja enkrat tedensko tri tedne, nato sledi teden brez obliža.',
    applicationTips: [
      'Vsakič zamenjaj mesto lepljenja',
      'Preveri, ali je še trdno prilepljen',
      'Nalepi ga na čisto, suho kožo',
    ],
    sectionIntro:
      'Ključne točke, ki jih je treba vedeti pred uporabo in med njo.',
    facts: [
      {title: 'Vsak teden', text: 'Obliž se zamenja enkrat tedensko.'},
      {title: 'Suha koža', text: 'Nalepiti ga je treba na čisto, suho kožo.'},
      {title: 'Zaščita', text: 'Deluje neprekinjeno, ko se pravilno uporablja.'},
      {title: 'Na kaj paziti', text: 'Včasih se lahko pojavi lokalno draženje.'},
    ],
    comparisonTitle: 'Prednosti in omejitve',
    advantageTitle: 'Prednosti',
    advantages: [
      '• Ena uporaba na teden',
      '• Brez vsakodnevnega odmerka',
      '• Neprekinjeno sproščanje hormonov',
    ],
    limitTitle: 'Omejitve',
    limits: [
      'Ne ščiti pred SPO',
      'Lahko povzroči draženje kože',
      'Zahteva upoštevanje urnika menjave',
    ],
    alertTitle: 'Opomba',
    alertText:
      'Na mestu lepljenja se lahko pojavi rahlo draženje. Izmenjavanje mest lepljenja ga lahko pomaga omejiti.',
    rememberTitle: '3 najpomembnejše stvari',
    remember: [
      'Menjaj obliž vsak teden.',
      'Redno preverjaj, ali dobro prijema.',
      'Po potrebi poišči nasvet zdravstvenega delavca.',
    ],
    shareMessage: 'Kontracepcijski obliž — AWA',
  },
  ne: {
    badge: 'गर्भनिरोधक प्याच',
    title: 'गर्भनिरोधक\nप्याच',
    metaDuration: '5 मिनेट पढाइ',
    metaType: 'लेख',
    metaLevel: 'सुरुवाती',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'दैनिक चक्कीको साप्ताहिक विकल्प।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'प्याचले कसरी काम गर्छ',
      'टाँस्ने तालिका',
      'तपाईंले जान्नुपर्ने कुराहरू',
      'मुख्य कुराहरू',
    ],
    section1Body:
      'प्याचले छालामार्फत निरन्तर हर्मोन निकाल्छ, संयुक्त चक्कीसँग तुलना गर्न मिल्ने तरिकाले काम गर्दै: यसले अण्डोत्सर्ग रोक्छ र गर्भाशयको मुखको तरल पदार्थ बाक्लो बनाउँछ।',
    tip1Title: 'जान्न लायक',
    tip1Text:
      'यसको मुख्य फाइदा यो हो कि यसलाई दैनिक मात्रा चाहिँदैन।',
    section2Body:
      'प्याच सामान्यतया तीन हप्तासम्म हप्तामा एक पटक बदलिन्छ, त्यसपछि एक हप्ता प्याचबिना।',
    applicationTips: [
      'हरेक पटक टाँस्ने ठाउँ बदल्नुहोस्',
      'यो अझै बलियोसँग टाँसिएको छ कि जाँच्नुहोस्',
      'सफा, सुख्खा छालामा टाँस्नुहोस्',
    ],
    sectionIntro:
      'प्रयोग गर्नुअघि र प्रयोगको क्रममा जान्नुपर्ने मुख्य बुँदाहरू।',
    facts: [
      {title: 'हरेक हप्ता', text: 'प्याच हप्तामा एक पटक बदलिन्छ।'},
      {title: 'सुख्खा छाला', text: 'यसलाई सफा, सुख्खा छालामा टाँस्नुपर्छ।'},
      {title: 'सुरक्षा', text: 'सही प्रयोग गर्दा यसले निरन्तर काम गर्छ।'},
      {title: 'ध्यान दिनुहोस्', text: 'स्थानीय जलन कहिलेकाहीँ हुन सक्छ।'},
    ],
    comparisonTitle: 'फाइदा र सीमाहरू',
    advantageTitle: 'फाइदाहरू',
    advantages: [
      '• हप्तामा एक पटक टाँस्ने',
      '• दैनिक मात्रा छैन',
      '• निरन्तर हर्मोन निस्कने',
    ],
    limitTitle: 'सीमाहरू',
    limits: [
      'STI बाट सुरक्षा दिँदैन',
      'छालामा जलन गराउन सक्छ',
      'बदल्ने तालिका पालना गर्नुपर्छ',
    ],
    alertTitle: 'कृपया ध्यान दिनुहोस्',
    alertText:
      'टाँसिएको ठाउँमा हल्का जलन देखिन सक्छ। टाँस्ने ठाउँहरू पालैपालो बदल्दा यसलाई सीमित गर्न मद्दत मिल्छ।',
    rememberTitle: '3 आवश्यक कुराहरू',
    remember: [
      'हरेक हप्ता प्याच बदल्नुहोस्।',
      'यो राम्ररी टाँसिएको छ कि नियमित रूपमा जाँच्नुहोस्।',
      'आवश्यक परे स्वास्थ्यकर्मीसँग सल्लाह लिनुहोस्।',
    ],
    shareMessage: 'गर्भनिरोधक प्याच — AWA',
  },
  si: {
    badge: 'ගර්භනිරෝධක පැච්',
    title: 'ගර්භනිරෝධක\nපැච්',
    metaDuration: 'කියවීමට මිනිත්තු 5',
    metaType: 'ලිපිය',
    metaLevel: 'ආරම්භක',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'දෛනික පෙත්තට සතිපතා විකල්පයක්.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'පැච් එක ක්‍රියා කරන ආකාරය',
      'යෙදීමේ කාලසටහන',
      'ඔබ දැනගත යුතු දේ',
      'ප්‍රධාන කරුණු',
    ],
    section1Body:
      'පැච් එක සම හරහා අඛණ්ඩව හෝමෝන මුදා හරියි, ඒකාබද්ධ පෙත්තට සමාන ආකාරයකින් ක්‍රියා කරයි: එය ඩිම්බ මෝචනය වළක්වා ගර්භාෂ ග්‍රීවා ශ්ලේෂ්මල ඝන කරයි.',
    tip1Title: 'දැනගත යුතු දේ',
    tip1Text:
      'එහි ප්‍රධාන වාසිය නම් එයට දෛනික මාත්‍රාවක් අවශ්‍ය නොවීමයි.',
    section2Body:
      'පැච් එක සාමාන්‍යයෙන් සති තුනක් සඳහා සතියකට වරක් වෙනස් කරන අතර, පසුව පැච් එකක් නොමැතිව සතියක් පවතී.',
    applicationTips: [
      'සෑම වතාවකම යෙදීමේ ස්ථානය වෙනස් කරන්න',
      'එය තවමත් තදින් ඇලී ඇත්දැයි පරීක්ෂා කරන්න',
      'එය පිරිසිදු, වියළි සමට යොදන්න',
    ],
    sectionIntro:
      'භාවිතයට පෙර සහ භාවිතය අතරතුර දැනගත යුතු ප්‍රධාන කරුණු.',
    facts: [
      {title: 'සෑම සතියකම', text: 'පැච් එක සතියකට වරක් ප්‍රතිස්ථාපනය කෙරේ.'},
      {title: 'වියළි සම', text: 'එය පිරිසිදු, වියළි සමට යෙදිය යුතුයි.'},
      {title: 'ආරක්ෂාව', text: 'නිවැරදිව භාවිතා කළ විට එය අඛණ්ඩව ක්‍රියා කරයි.'},
      {title: 'අවධානයෙන් සිටින්න', text: 'ස්ථානීය කෝපනය සමහර විට සිදුවිය හැක.'},
    ],
    comparisonTitle: 'වාසි සහ සීමාවන්',
    advantageTitle: 'වාසි',
    advantages: [
      '• සතියකට එක් යෙදීමක්',
      '• දෛනික මාත්‍රාවක් නැත',
      '• අඛණ්ඩ හෝමෝන මුදා හැරීම',
    ],
    limitTitle: 'සීමාවන්',
    limits: [
      'STI වලින් ආරක්ෂා නොකරයි',
      'සමේ කෝපනයක් ඇති කළ හැක',
      'ප්‍රතිස්ථාපන කාලසටහන අනුගමනය කිරීම අවශ්‍ය වේ',
    ],
    alertTitle: 'කරුණාකර සටහන් කරන්න',
    alertText:
      'යෙදීමේ ස්ථානයේ සුළු කෝපනයක් දිස්විය හැක. යෙදීමේ ස්ථාන මාරුවෙන් මාරුවට භාවිතා කිරීම මෙය සීමා කිරීමට උපකාරී විය හැක.',
    rememberTitle: 'අත්‍යවශ්‍ය කරුණු 3',
    remember: [
      'සෑම සතියකම පැච් එක වෙනස් කරන්න.',
      'එය හොඳින් ඇලෙමින් තිබේදැයි නිතිපතා පරීක්ෂා කරන්න.',
      'අවශ්‍ය නම් සෞඛ්‍ය වෘත්තිකයෙකුගෙන් උපදෙස් ඉල්ලන්න.',
    ],
    shareMessage: 'ගර්භනිරෝධක පැච් — AWA',
  },
  th: {
    badge: 'แผ่นแปะคุมกำเนิด',
    title: 'แผ่นแปะ\nคุมกำเนิด',
    metaDuration: 'อ่าน 5 นาที',
    metaType: 'บทความ',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'ทางเลือกรายสัปดาห์แทนยาเม็ดรายวัน',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'แผ่นแปะทำงานอย่างไร',
      'ตารางการแปะ',
      'สิ่งที่คุณต้องรู้',
      'ประเด็นสำคัญ',
    ],
    section1Body:
      'แผ่นแปะปล่อยฮอร์โมนผ่านผิวหนังอย่างต่อเนื่อง ทำงานในลักษณะเทียบเคียงกับยาเม็ดแบบฮอร์โมนรวม: ป้องกันการตกไข่และทำให้เมือกปากมดลูกข้นขึ้น',
    tip1Title: 'ควรรู้',
    tip1Text:
      'ข้อดีหลักคือไม่ต้องทานยาทุกวัน',
    section2Body:
      'โดยทั่วไปเปลี่ยนแผ่นแปะสัปดาห์ละครั้งเป็นเวลาสามสัปดาห์ ตามด้วยหนึ่งสัปดาห์ที่ไม่ใช้แผ่นแปะ',
    applicationTips: [
      'เปลี่ยนตำแหน่งที่แปะทุกครั้ง',
      'ตรวจสอบว่ายังติดแน่นอยู่',
      'แปะบนผิวที่สะอาดและแห้ง',
    ],
    sectionIntro:
      'ประเด็นสำคัญที่ควรรู้ก่อนและระหว่างการใช้',
    facts: [
      {title: 'ทุกสัปดาห์', text: 'เปลี่ยนแผ่นแปะสัปดาห์ละครั้ง'},
      {title: 'ผิวแห้ง', text: 'ต้องแปะบนผิวที่สะอาดและแห้ง'},
      {title: 'การป้องกัน', text: 'ทำงานต่อเนื่องเมื่อใช้อย่างถูกต้อง'},
      {title: 'สิ่งที่ควรระวัง', text: 'อาจเกิดการระคายเคืองเฉพาะที่ได้บางครั้ง'},
    ],
    comparisonTitle: 'ข้อดีและข้อจำกัด',
    advantageTitle: 'ข้อดี',
    advantages: [
      '• แปะสัปดาห์ละครั้ง',
      '• ไม่ต้องทานยาทุกวัน',
      '• ปล่อยฮอร์โมนอย่างต่อเนื่อง',
    ],
    limitTitle: 'ข้อจำกัด',
    limits: [
      'ไม่ป้องกันโรคติดต่อทางเพศสัมพันธ์',
      'อาจทำให้ผิวหนังระคายเคือง',
      'ต้องปฏิบัติตามตารางการเปลี่ยน',
    ],
    alertTitle: 'โปรดทราบ',
    alertText:
      'อาจมีอาการระคายเคืองเล็กน้อยที่ตำแหน่งที่แปะ การสลับตำแหน่งที่แปะช่วยจำกัดได้',
    rememberTitle: '3 สิ่งสำคัญ',
    remember: [
      'เปลี่ยนแผ่นแปะทุกสัปดาห์',
      'ตรวจสอบเป็นประจำว่ายังติดแน่นอยู่',
      'ขอคำแนะนำจากบุคลากรทางการแพทย์หากจำเป็น',
    ],
    shareMessage: 'แผ่นแปะคุมกำเนิด — AWA',
  },
  vi: {
    badge: 'MIẾNG DÁN TRÁNH THAI',
    title: 'Miếng dán\ntránh thai',
    metaDuration: '5 phút đọc',
    metaType: 'Bài viết',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Một lựa chọn thay thế hằng tuần cho thuốc uống mỗi ngày.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Miếng dán hoạt động như thế nào',
      'Lịch dán',
      'Những điều bạn cần biết',
      'Những điểm chính cần nhớ',
    ],
    section1Body:
      'Miếng dán giải phóng hormone liên tục qua da, hoạt động theo cách tương tự thuốc tránh thai kết hợp: nó ngăn rụng trứng và làm đặc dịch nhầy cổ tử cung.',
    tip1Title: 'Nên biết',
    tip1Text:
      'Ưu điểm chính của nó là không cần uống thuốc mỗi ngày.',
    section2Body:
      'Miếng dán thường được thay mỗi tuần một lần trong ba tuần, sau đó là một tuần không dán.',
    applicationTips: [
      'Thay đổi vị trí dán mỗi lần',
      'Kiểm tra xem nó còn dính chắc không',
      'Dán lên vùng da sạch, khô',
    ],
    sectionIntro:
      'Những điểm chính cần biết trước và trong khi sử dụng.',
    facts: [
      {title: 'Mỗi tuần', text: 'Miếng dán được thay mỗi tuần một lần.'},
      {title: 'Da khô', text: 'Phải dán lên vùng da sạch, khô.'},
      {title: 'Bảo vệ', text: 'Nó hoạt động liên tục khi được sử dụng đúng cách.'},
      {title: 'Cần chú ý', text: 'Đôi khi có thể xảy ra kích ứng tại chỗ.'},
    ],
    comparisonTitle: 'Ưu điểm & hạn chế',
    advantageTitle: 'Ưu điểm',
    advantages: [
      '• Mỗi tuần chỉ dán một lần',
      '• Không cần uống thuốc mỗi ngày',
      '• Giải phóng hormone liên tục',
    ],
    limitTitle: 'Hạn chế',
    limits: [
      'Không bảo vệ khỏi các bệnh lây truyền qua đường tình dục (STI)',
      'Có thể gây kích ứng da',
      'Cần tuân thủ lịch thay miếng dán',
    ],
    alertTitle: 'Xin lưu ý',
    alertText:
      'Có thể xuất hiện kích ứng nhẹ tại vị trí dán. Luân phiên các vị trí dán có thể giúp hạn chế điều này.',
    rememberTitle: '3 điều thiết yếu',
    remember: [
      'Thay miếng dán mỗi tuần.',
      'Thường xuyên kiểm tra xem nó còn dính chắc không.',
      'Hỏi lời khuyên của nhân viên y tế nếu cần.',
    ],
    shareMessage: 'Miếng dán tránh thai — AWA',
  },
  uz: {
    badge: 'KONTRATSEPTIV PLASTIR',
    title: 'Kontratseptiv\nplastir',
    metaDuration: '5 daq oʻqish',
    metaType: 'Maqola',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Kundalik tabletkaga haftalik muqobil.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Plastir qanday ishlaydi',
      'Yopishtirish jadvali',
      'Nimalarni bilish kerak',
      'Asosiy xulosalar',
    ],
    section1Body:
      'Plastir teri orqali uzluksiz gormonlar chiqaradi va kombinatsiyalangan tabletkaga oʻxshash ishlaydi: ovulyatsiyani oldini oladi va bachadon boʻyni shilligini quyuqlashtiradi.',
    tip1Title: 'Bilish foydali',
    tip1Text:
      'Uning asosiy afzalligi — kundalik doza talab qilmasligi.',
    section2Body:
      'Plastir odatda uch hafta davomida haftada bir marta almashtiriladi, undan keyin bir hafta plastirsiz tanaffus qilinadi.',
    applicationTips: [
      'Har safar yopishtirish joyini oʻzgartiring',
      'Hali mahkam yopishganini tekshiring',
      'Uni toza, quruq terining ustiga yopishtiring',
    ],
    sectionIntro:
      'Foydalanishdan oldin va davomida bilish kerak boʻlgan asosiy nuqtalar.',
    facts: [
      {title: 'Har hafta', text: 'Plastir haftada bir marta almashtiriladi.'},
      {title: 'Quruq teri', text: 'U toza, quruq teriga yopishtirilishi kerak.'},
      {title: 'Himoya', text: 'Toʻgʻri ishlatilganda u uzluksiz ishlaydi.'},
      {title: 'Eʼtibor bering', text: 'Mahalliy tirnash baʼzan boʻlishi mumkin.'},
    ],
    comparisonTitle: 'Afzalliklar va cheklovlar',
    advantageTitle: 'Afzalliklar',
    advantages: [
      '• Haftada bir marta yopishtirish',
      '• Kundalik doza yoʻq',
      '• Gormonlarning uzluksiz chiqishi',
    ],
    limitTitle: 'Cheklovlar',
    limits: [
      'JYYI dan himoya qilmaydi',
      'Teri tirnashiga sabab boʻlishi mumkin',
      'Almashtirish jadvaliga rioya qilishni talab qiladi',
    ],
    alertTitle: 'Eʼtibor bering',
    alertText:
      'Yopishtirish joyida yengil tirnash paydo boʻlishi mumkin. Yopishtirish joylarini navbatlashtirish uni cheklashga yordam beradi.',
    rememberTitle: '3 muhim jihat',
    remember: [
      'Plastirni har hafta almashtiring.',
      'Yaxshi yopishganini muntazam tekshiring.',
      'Kerak boʻlsa, sogʻliqni saqlash mutaxassisidan maslahat soʻrang.',
    ],
    shareMessage: 'Kontratseptiv plastir — AWA',
  },
  az: {
    badge: 'KONTRASEPTİV YAMAQ',
    title: 'Kontraseptiv\nyamaq',
    metaDuration: '5 dəq oxu',
    metaType: 'Məqalə',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Gündəlik hapa həftəlik alternativ.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Yamaq necə işləyir',
      'Tətbiq cədvəli',
      'Bilməli olduqlarınız',
      'Əsas nəticələr',
    ],
    section1Body:
      'Yamaq hormonları dəri vasitəsilə fasiləsiz buraxır və kombinə edilmiş hapa bənzər şəkildə işləyir: ovulyasiyanın qarşısını alır və uşaqlıq boynu mukusunu qatılaşdırır.',
    tip1Title: 'Bilmək faydalıdır',
    tip1Text:
      'Onun əsas üstünlüyü gündəlik doza tələb etməməsidir.',
    section2Body:
      'Yamaq adətən üç həftə ərzində həftədə bir dəfə dəyişdirilir, ardınca yamaqsız bir həftə gəlir.',
    applicationTips: [
      'Hər dəfə tətbiq yerini dəyişin',
      'Hələ də möhkəm yapışdığını yoxlayın',
      'Təmiz, quru dəriyə yapışdırın',
    ],
    sectionIntro:
      'İstifadədən əvvəl və istifadə zamanı bilinməli əsas məqamlar.',
    facts: [
      {title: 'Hər həftə', text: 'Yamaq həftədə bir dəfə dəyişdirilir.'},
      {title: 'Quru dəri', text: 'O, təmiz, quru dəriyə yapışdırılmalıdır.'},
      {title: 'Qoruma', text: 'Düzgün istifadə edildikdə fasiləsiz işləyir.'},
      {title: 'Diqqət edin', text: 'Bəzən yerli qıcıqlanma ola bilər.'},
    ],
    comparisonTitle: 'Üstünlüklər və məhdudiyyətlər',
    advantageTitle: 'Üstünlüklər',
    advantages: [
      '• Həftədə bir tətbiq',
      '• Gündəlik doza yoxdur',
      '• Hormonların fasiləsiz buraxılması',
    ],
    limitTitle: 'Məhdudiyyətlər',
    limits: [
      'CYÖİ-dən qorumur',
      'Dəridə qıcıqlanma yarada bilər',
      'Dəyişmə cədvəlinə riayət tələb edir',
    ],
    alertTitle: 'Nəzərə alın',
    alertText:
      'Tətbiq yerində yüngül qıcıqlanma ola bilər. Tətbiq yerlərini növbələşdirmək bunu məhdudlaşdırmağa kömək edə bilər.',
    rememberTitle: '3 əsas məqam',
    remember: [
      'Yamağı hər həftə dəyişin.',
      'Yaxşı yapışıb-yapışmadığını müntəzəm yoxlayın.',
      'Lazım gələrsə, tibb işçisindən məsləhət alın.',
    ],
    shareMessage: 'Kontraseptiv yamaq — AWA',
  },
  ka: {
    badge: 'კონტრაცეპტიული პლასტირი',
    title: 'კონტრაცეპტიული\nპლასტირი',
    metaDuration: '5 წთ საკითხავი',
    metaType: 'სტატია',
    metaLevel: 'დამწყები',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'ყოველკვირეული ალტერნატივა ყოველდღიური აბისა.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'როგორ მუშაობს პლასტირი',
      'დადების განრიგი',
      'რა უნდა იცოდეთ',
      'მთავარი დასკვნები',
    ],
    section1Body:
      'პლასტირი კანის გავლით უწყვეტად გამოყოფს ჰორმონებს და კომბინირებულ აბთან შესადარებლად მუშაობს: ის ოვულაციას აღკვეთს და საშვილოსნოს ყელის ლორწოს ასქელებს.',
    tip1Title: 'კარგია ვიცოდეთ',
    tip1Text:
      'მისი მთავარი უპირატესობა ისაა, რომ ყოველდღიურ დოზას არ მოითხოვს.',
    section2Body:
      'პლასტირი ზოგადად კვირაში ერთხელ იცვლება სამი კვირის განმავლობაში, რასაც ერთი კვირა პლასტირის გარეშე მოსდევს.',
    applicationTips: [
      'ყოველ ჯერზე შეცვალეთ დადების ადგილი',
      'შეამოწმეთ, რომ ის კვლავ მყარად არის მიკრული',
      'დაიდეთ სუფთა, მშრალ კანზე',
    ],
    sectionIntro:
      'ძირითადი საკითხები, რომლებიც გამოყენებამდე და გამოყენების დროს უნდა იცოდეთ.',
    facts: [
      {title: 'ყოველ კვირას', text: 'პლასტირი კვირაში ერთხელ იცვლება.'},
      {title: 'მშრალი კანი', text: 'ის სუფთა, მშრალ კანზე უნდა დაიდოს.'},
      {title: 'დაცვა', text: 'სწორი გამოყენებისას ის უწყვეტად მუშაობს.'},
      {title: 'ყურადღება მიაქციეთ', text: 'ადგილობრივი გაღიზიანება ზოგჯერ შეიძლება მოხდეს.'},
    ],
    comparisonTitle: 'უპირატესობები და შეზღუდვები',
    advantageTitle: 'უპირატესობები',
    advantages: [
      '• ერთი დადება კვირაში',
      '• ყოველდღიური დოზის გარეშე',
      '• ჰორმონების უწყვეტი გამოყოფა',
    ],
    limitTitle: 'შეზღუდვები',
    limits: [
      'არ იცავს სგგი-სგან',
      'შეიძლება კანის გაღიზიანება გამოიწვიოს',
      'შეცვლის განრიგის დაცვას მოითხოვს',
    ],
    alertTitle: 'გაითვალისწინეთ',
    alertText:
      'დადების ადგილზე შეიძლება მცირედი გაღიზიანება გამოჩნდეს. დადების ადგილების მონაცვლეობამ შეიძლება ამის შეზღუდვაში დაგეხმაროთ.',
    rememberTitle: '3 არსებითი საკითხი',
    remember: [
      'შეცვალეთ პლასტირი ყოველ კვირას.',
      'რეგულარულად შეამოწმეთ, კარგად არის თუ არა მიკრული.',
      'საჭიროების შემთხვევაში ჰკითხეთ რჩევა ჯანდაცვის სპეციალისტს.',
    ],
    shareMessage: 'კონტრაცეპტიული პლასტირი — AWA',
  },
  hy: {
    badge: 'ՀԱԿԱԲԵՂՄՆԱՎՈՐԻՉ ՊԼԱՍՏՐ',
    title: 'Հակաբեղմնավորիչ\nպլաստրը',
    metaDuration: '5 ր կարդալու համար',
    metaType: 'Հոդված',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Շաբաթական այլընտրանք օրական հաբին:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Ինչպես է աշխատում պլաստրը',
      'Կիրառման ժամանակացույց',
      'Ինչ պետք է իմանալ',
      'Հիմնական եզրակացություններ',
    ],
    section1Body:
      'Պլաստրը անընդհատ ազատում է հորմոններ մաշկի միջոցով՝ աշխատելով համակցված հաբին համեմատելի եղանակով. այն կանխում է ձվազատումը և թանձրացնում արգանդի վզիկի լորձը:',
    tip1Title: 'Լավ է իմանալ',
    tip1Text:
      'Դրա հիմնական առավելությունն այն է, որ օրական դեղաչափ չի պահանջում:',
    section2Body:
      'Պլաստրը սովորաբար փոխվում է շաբաթը մեկ անգամ երեք շաբաթ շարունակ, որին հաջորդում է մեկ շաբաթ առանց պլաստրի:',
    applicationTips: [
      'Ամեն անգամ փոխեք կիրառման վայրը',
      'Ստուգեք, որ այն դեռ ամուր կպած է',
      'Կիրառեք մաքուր, չոր մաշկի վրա',
    ],
    sectionIntro:
      'Հիմնական կետերը, որ պետք է իմանալ օգտագործելուց առաջ և օգտագործման ընթացքում:',
    facts: [
      {title: 'Ամեն շաբաթ', text: 'Պլաստրը փոխարինվում է շաբաթը մեկ անգամ:'},
      {title: 'Չոր մաշկ', text: 'Այն պետք է կիրառվի մաքուր, չոր մաշկի վրա:'},
      {title: 'Պաշտպանություն', text: 'Ճիշտ օգտագործման դեպքում այն աշխատում է անընդհատ:'},
      {title: 'Ուշադրություն դարձրեք', text: 'Երբեմն կարող է առաջանալ տեղային գրգռում:'},
    ],
    comparisonTitle: 'Առավելություններ և սահմանափակումներ',
    advantageTitle: 'Առավելություններ',
    advantages: [
      '• Շաբաթական մեկ կիրառում',
      '• Օրական դեղաչափ չկա',
      '• Հորմոնների անընդհատ ազատում',
    ],
    limitTitle: 'Սահմանափակումներ',
    limits: [
      'Չի պաշտպանում ՍՃՓՎ-ներից',
      'Կարող է առաջացնել մաշկի գրգռում',
      'Պահանջում է հետևել փոխարինման ժամանակացույցին',
    ],
    alertTitle: 'Խնդրում ենք ուշադրություն դարձնել',
    alertText:
      'Կիրառման վայրում կարող է հայտնվել թեթև գրգռում: Կիրառման վայրերը հերթափոխելը կարող է օգնել սահմանափակել դա:',
    rememberTitle: '3 էականը',
    remember: [
      'Փոխեք պլաստրը ամեն շաբաթ:',
      'Կանոնավոր ստուգեք, որ այն լավ է կպած:',
      'Անհրաժեշտության դեպքում խորհուրդ հարցրեք առողջապահության մասնագետից:',
    ],
    shareMessage: 'Հակաբեղմնավորիչ պլաստրը — AWA',
  },
  tg: {
    badge: 'ПЛАСТИРИ ПЕШГИРӢ',
    title: 'Пластири\nпешгирӣ аз ҳомиладорӣ',
    metaDuration: '5 дақ барои хондан',
    metaType: 'Мақола',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Алтернативаи ҳафтагӣ ба ҳаби рӯзона.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Пластир чӣ тавр кор мекунад',
      'Ҷадвали истифода',
      'Он чи бояд донист',
      'Хулосаҳои асосӣ',
    ],
    section1Body:
      'Пластир гормонҳоро пайваста тавассути пӯст озод мекунад ва монанди ҳаби омехта кор мекунад: он аз овуляция пешгирӣ мекунад ва шилимшиқи гардани бачадонро ғализ мекунад.',
    tip1Title: 'Донистан хуб аст',
    tip1Text:
      'Афзалияти асосии он ин аст, ки қабули рӯзонаро талаб намекунад.',
    section2Body:
      'Пластир одатан як бор дар як ҳафта, се ҳафта иваз карда мешавад, баъд як ҳафта бе пластир.',
    applicationTips: [
      'Ҷои истифодаро ҳар дафъа иваз кунед',
      'Санҷед, ки он ҳанӯз мустаҳкам часпидааст',
      'Онро ба пӯсти тоза ва хушк часпонед',
    ],
    sectionIntro:
      'Нуктаҳои асосие, ки пеш аз истифода ва ҳангоми он бояд донист.',
    facts: [
      {title: 'Ҳар ҳафта', text: 'Пластир як бор дар як ҳафта иваз карда мешавад.'},
      {title: 'Пӯсти хушк', text: 'Он бояд ба пӯсти тоза ва хушк часпонда шавад.'},
      {title: 'Муҳофизат', text: 'Ҳангоми дуруст истифода шудан он пайваста кор мекунад.'},
      {title: 'Диққат кунед', text: 'Асабонияти маҳаллӣ баъзан метавонад рух диҳад.'},
    ],
    comparisonTitle: 'Афзалиятҳо ва маҳдудиятҳо',
    advantageTitle: 'Афзалиятҳо',
    advantages: [
      '• Як истифода дар як ҳафта',
      '• Қабули рӯзона нест',
      '• Озодшавии пайвастаи гормонҳо',
    ],
    limitTitle: 'Маҳдудиятҳо',
    limits: [
      'Аз СРҶ муҳофизат намекунад',
      'Метавонад асабонияти пӯстро ба вуҷуд орад',
      'Риояи ҷадвали ивазро талаб мекунад',
    ],
    alertTitle: 'Таваҷҷӯҳ кунед',
    alertText:
      'Асабонияти андак метавонад дар ҷои истифода пайдо шавад. Иваз кардани ҷойҳои истифода метавонад ба маҳдуд кардани он кумак кунад.',
    rememberTitle: '3 чизи асосӣ',
    remember: [
      'Пластирро ҳар ҳафта иваз кунед.',
      'Мунтазам санҷед, ки хуб мечаспад.',
      'Дар сурати зарурат аз мутахассиси соҳаи тиб маслиҳат пурсед.',
    ],
    shareMessage: 'Пластири пешгирӣ аз ҳомиладорӣ — AWA',
  },
  ky: {
    badge: 'КОНТРАЦЕПТИВДИК ПЛАСТЫРЬ',
    title: 'Контрацептивдик\nпластырь',
    metaDuration: '5 мүн окуу',
    metaType: 'Макала',
    metaLevel: 'Баштоочу',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Күнүмдүк таблеткага жумалык альтернатива.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Пластырь кантип иштейт',
      'Колдонуу графиги',
      'Эмнени билүү керек',
      'Негизги жыйынтыктар',
    ],
    section1Body:
      'Пластырь гормондорду тери аркылуу үзгүлтүксүз бөлүп чыгарат, айкалышкан таблеткага салыштырмалуу иштейт: ал овуляцияны болтурбайт жана жатын моюнчасынын былжырын коюулантат.',
    tip1Title: 'Билүү пайдалуу',
    tip1Text:
      'Анын негизги артыкчылыгы — күнүмдүк дозаны талап кылбайт.',
    section2Body:
      'Пластырь адатта үч жума бою жумасына бир жолу алмаштырылат, андан кийин пластырьсыз бир жума болот.',
    applicationTips: [
      'Ар жолу жабыштыруу жерин өзгөртүңүз',
      'Дагы эле бекем жабышканын текшериңиз',
      'Таза, кургак теришке жабыштырыңыз',
    ],
    sectionIntro:
      'Колдонуудан мурун жана учурунда билүүгө тийиш болгон негизги учурлар.',
    facts: [
      {title: 'Жума сайын', text: 'Пластырь жумасына бир жолу алмаштырылат.'},
      {title: 'Кургак тери', text: 'Аны таза, кургак теришке жабыштыруу керек.'},
      {title: 'Коргоо', text: 'Туура колдонулганда ал үзгүлтүксүз иштейт.'},
      {title: 'Көңүл буруңуз', text: 'Жергиликтүү дүүлүгүү кээде болушу мүмкүн.'},
    ],
    comparisonTitle: 'Артыкчылыктары жана чектөөлөрү',
    advantageTitle: 'Артыкчылыктары',
    advantages: [
      '• Жумасына бир жолу колдонуу',
      '• Күнүмдүк доза жок',
      '• Гормондун үзгүлтүксүз бөлүнүп чыгышы',
    ],
    limitTitle: 'Чектөөлөрү',
    limits: [
      'ЖЖБИден коргобойт',
      'Териде дүүлүгүү жаратышы мүмкүн',
      'Алмаштыруу графигин сактоону талап кылат',
    ],
    alertTitle: 'Көңүл буруңуз',
    alertText:
      'Жабыштыруу жеринде бир аз дүүлүгүү пайда болушу мүмкүн. Жабыштыруу жерин алмаштыруу муну чектөөгө жардам бериши мүмкүн.',
    rememberTitle: '3 негизги нерсе',
    remember: [
      'Пластырьды жума сайын алмаштырыңыз.',
      'Жакшы жабышканын үзгүлтүксүз текшериңиз.',
      'Керек болсо, ден соолук сактоо адисинен кеңеш сураңыз.',
    ],
    shareMessage: 'Контрацептивдик пластырь — AWA',
  },
  tk: {
    badge: 'GÖWRELILIKDEN GORAÝJY PLASTYR',
    title: 'Göwrelilikden goraýjy\nplastyr',
    metaDuration: '5 min okamak',
    metaType: 'Makala',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Barlanan mazmun',
    intro: 'Gündelik tabletka hepdelik alternatiwa.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Plastyr nähili işleýär',
      'Ýapyşdyrmak tertibi',
      'Bilmeli zatlaryňyz',
      'Esasy netijeler',
    ],
    section1Body:
      'Plastyr gormonlary deri arkaly üznüksiz boşadýar, utgaşdyrylan tabletka bilen deňeşdirilýän usulda işleýär: ol ovulýasiýanyň öňüni alýar we ýatgy boýnunyň ýaňsyny galyňlaşdyrýar.',
    tip1Title: 'Bilmek peýdaly',
    tip1Text:
      'Onuň esasy artykmaçlygy gündelik doza talap etmeýändigi.',
    section2Body:
      'Plastyr adatça üç hepde dowamynda hepdede bir gezek çalşylýar, soňra plastyrsyz bir hepde bolýar.',
    applicationTips: [
      'Her gezek ýapyşdyrmak ýerini çalşyň',
      'Henizem berk ýapyşýandygyny barlaň',
      'Ony arassa, gury derä ýapyşdyryň',
    ],
    sectionIntro:
      'Ulanmazdan öň we ulanýan wagtyňyz bilmeli esasy nokatlar.',
    facts: [
      {title: 'Her hepde', text: 'Plastyr hepdede bir gezek çalşylýar.'},
      {title: 'Gury deri', text: 'Ol arassa, gury derä ýapyşdyrylmaly.'},
      {title: 'Goranyş', text: 'Dogry ulanylanda ol üznüksiz işleýär.'},
      {title: 'Üns bermeli', text: 'Ýerli gyjyndyrma käwagt bolup biler.'},
    ],
    comparisonTitle: 'Artykmaçlyklar we çäkler',
    advantageTitle: 'Artykmaçlyklar',
    advantages: [
      '• Hepdede bir ýapyşdyrmak',
      '• Gündelik doza ýok',
      '• Gormonyň üznüksiz boşadylyşy',
    ],
    limitTitle: 'Çäkler',
    limits: [
      'JÝGÝ-den goramaýar',
      'Deri gyjyndyrmasyna sebäp bolup biler',
      'Çalyşyş tertibine eýermegi talap edýär',
    ],
    alertTitle: 'Üns beriň',
    alertText:
      'Ýapyşdyrylan ýerde ýeňil gyjyndyrma peýda bolup biler. Ýapyşdyrmak ýerlerini çalşyrmak muny çäklemäge kömek edip biler.',
    rememberTitle: '3 esasy zat',
    remember: [
      'Plastyry her hepde çalşyň.',
      'Gowy ýapyşýandygyny yzygiderli barlaň.',
      'Zerur bolsa, saglyk hünärmeninden maslahat soraň.',
    ],
    shareMessage: 'Göwrelilikden goraýjy plastyr — AWA',
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
