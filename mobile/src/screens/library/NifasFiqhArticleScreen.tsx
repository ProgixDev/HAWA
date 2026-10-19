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

const ID = 'nifasfiqh-repere-fiqh';

const HERO = require('../../assets/images/library/nifas-fiqh-hero.png');

// PHASE 7L.2 — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
//
// RELIGIOUS CONTENT: "nifas" is kept untranslated in both languages. Every
// hedge/attribution present in the French ("selon la référence suivie",
// "selon l'école juridique", "une référence fréquemment retenue", etc.) is
// preserved in English with the same scope — no ruling is strengthened,
// invented, or resolved beyond what the French source states.
const CONTENT = {
  fr: {
    badge: 'NIFAS (FIQH)',
    title: 'Le nifas en\npratique religieuse',
    metaDuration: '6 min de lecture',
    metaType: 'FAQ',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Comprendre le nifas, sa durée, la prière, le jeûne et la reprise des adorations après l’accouchement.',
    disclaimerTitle: 'Information importante',
    disclaimerText: 'Ce contenu est purement éducatif. Les questions religieuses doivent être validées par des savants qualifiés. AWA ne délivre pas de fatwas ni de décisions religieuses personnalisées.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Qu’est-ce que le nifas ?',
      'Sa durée selon les références juridiques',
      'Prière pendant le nifas',
      'Jeûne pendant le nifas',
      'Purification et reprise des adorations',
      'Questions fréquentes',
    ],
    section1Body: 'Le nifas désigne, dans la pratique religieuse, la période liée aux pertes de sang après l’accouchement. Les lochies décrivent l’aspect médical et physiologique de ces pertes ; le nifas est leur classification religieuse. Ces deux notions ne doivent pas être confondues.',
    tip1Title: 'À retenir',
    tip1Text: 'AWA sépare volontairement les informations médicales sur les lochies des repères religieux sur le nifas.',
    question1: 'Combien de temps dure le nifas ?',
    section2Body: 'La durée maximale peut varier selon l’école juridique ou la référence religieuse suivie. 40 jours est une référence fréquemment retenue, sans être présentée comme une règle universelle par AWA.',
    tip2Title: 'Repère souvent utilisé',
    tip2Text: 'Une référence fréquemment retenue est de 40 jours, mais AWA ne présente pas ce chiffre comme une vérité unique pour toutes les écoles juridiques. Suis la référence religieuse que tu as choisie.',
    question2: 'Dois-je prier pendant le nifas ?',
    section3Body: 'Pendant une période reconnue comme nifas selon la référence suivie, la prière rituelle est suspendue. AWA ne classe pas automatiquement les saignements et ne fournit pas de décision personnalisée. Aucun compteur de prières manquées n’est ajouté pour cette période.',
    question3: 'Puis-je jeûner pendant le nifas ?',
    section4Body: 'Le jeûne obligatoire n’est pas accompli pendant une période reconnue comme nifas. Les jours concernés sont ensuite traités par le rattrapage approprié, selon la référence suivie.',
    tip3Title: 'Organiser, sans décider',
    tip3Text: 'AWA peut t’aider à mémoriser ou organiser les jours concernés, sans émettre de décision religieuse personnalisée.',
    section5Body: 'La reprise dépend des signes observés et de la référence religieuse suivie.',
    steps: [
      'Observer la fin des pertes',
      'Effectuer la purification rituelle',
      'Reprendre les actes d’adoration concernés',
    ],
    alert2Title: 'En cas de doute',
    alert2Text: 'Si les saignements persistent au-delà de la durée maximale retenue par la référence suivie, leur statut religieux peut changer. Un avis qualifié est recommandé.',
    faq: [
      {
        q: 'Le nifas dure-t-il toujours 40 jours ?',
        a: 'Non. 40 jours est une référence fréquemment utilisée, mais les références juridiques peuvent différer.',
      },
      {
        q: 'Que faire si les pertes s’arrêtent avant 40 jours ?',
        a: 'La reprise des actes d’adoration dépend des signes observés et de la référence religieuse suivie.',
      },
      {
        q: 'Et si les saignements continuent longtemps ?',
        a: 'S’ils dépassent la durée maximale retenue, leur statut religieux peut changer : demande un avis qualifié.',
      },
      {
        q: 'AWA peut-elle dire exactement si mes pertes sont encore du nifas ?',
        a: 'Non. AWA donne des repères éducatifs généraux et ne délivre ni fatwa ni décision personnalisée.',
      },
    ],
    alert3Title: 'Un repère, pas une fatwa',
    alert3Text: 'Les situations personnelles peuvent être différentes. En cas de doute, rapproche-toi d’un savant qualifié ou d’une organisation religieuse reconnue.',
    shareMessage: 'Le nifas en pratique religieuse — AWA',
  },
  en: {
    badge: 'NIFAS (FIQH)',
    title: 'Nifas in\nreligious practice',
    metaDuration: '6 min read',
    metaType: 'FAQ',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'Understanding nifas, its duration, prayer, fasting, and the resumption of acts of worship after childbirth.',
    disclaimerTitle: 'Important information',
    disclaimerText: 'This content is purely educational. Religious questions should be validated by qualified scholars. AWA does not issue fatwas or personalized religious rulings.',
    contentsTitle: 'In this article',
    topics: [
      'What is nifas?',
      'Its duration according to jurisprudential references',
      'Prayer during nifas',
      'Fasting during nifas',
      'Purification and resumption of acts of worship',
      'Frequently asked questions',
    ],
    section1Body: 'In religious practice, nifas refers to the period linked to the bleeding after childbirth. Lochia describes the medical and physiological aspect of this bleeding; nifas is its religious classification. These two notions should not be confused.',
    tip1Title: 'Key takeaway',
    tip1Text: 'AWA deliberately separates the medical information about lochia from the religious markers about nifas.',
    question1: 'How long does nifas last?',
    section2Body: 'The maximum duration may vary according to the school of jurisprudence or the religious reference followed. 40 days is a frequently used reference, without being presented by AWA as a universal rule.',
    tip2Title: 'A commonly used marker',
    tip2Text: 'A frequently used reference is 40 days, but AWA does not present this figure as the one truth for all schools of jurisprudence. Follow the religious reference you have chosen.',
    question2: 'Should I pray during nifas?',
    section3Body: 'During a period recognized as nifas according to the reference followed, ritual prayer is suspended. AWA does not automatically classify bleeding and does not provide a personalized decision. No missed-prayer counter is added for this period.',
    question3: 'Can I fast during nifas?',
    section4Body: 'The obligatory fast is not performed during a period recognized as nifas. The days concerned are then handled through the appropriate make-up, according to the reference followed.',
    tip3Title: 'Organizing, without deciding',
    tip3Text: 'AWA can help you keep track of or organize the days concerned, without issuing a personalized religious decision.',
    section5Body: 'Resumption depends on the signs observed and the religious reference followed.',
    steps: [
      'Observe the end of the bleeding',
      'Perform the ritual purification',
      'Resume the acts of worship concerned',
    ],
    alert2Title: 'In case of doubt',
    alert2Text: 'If the bleeding persists beyond the maximum duration adopted by the reference followed, its religious status may change. A qualified opinion is recommended.',
    faq: [
      {
        q: 'Does nifas always last 40 days?',
        a: 'No. 40 days is a frequently used reference, but jurisprudential references may differ.',
      },
      {
        q: 'What should I do if the bleeding stops before 40 days?',
        a: 'The resumption of acts of worship depends on the signs observed and the religious reference followed.',
      },
      {
        q: 'What if the bleeding continues for a long time?',
        a: 'If it exceeds the maximum duration adopted, its religious status may change: ask for a qualified opinion.',
      },
      {
        q: 'Can AWA say exactly whether my bleeding is still nifas?',
        a: 'No. AWA provides general educational markers and does not issue a fatwa or a personalized decision.',
      },
    ],
    alert3Title: 'A marker, not a fatwa',
    alert3Text: 'Personal situations can differ. In case of doubt, reach out to a qualified scholar or a recognized religious organization.',
    shareMessage: 'Nifas in religious practice — AWA',
  },
  es: {
    badge: 'NIFAS (FIQH)',
    title: 'El nifas en la\npráctica religiosa',
    metaDuration: '6 min de lectura',
    metaType: 'Preguntas frecuentes',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'Comprender el nifas, su duración, la oración, el ayuno y la reanudación de las adoraciones después del parto.',
    disclaimerTitle: 'Información importante',
    disclaimerText: 'Este contenido es puramente educativo. Las preguntas religiosas deben ser validadas por eruditos cualificados. AWA no emite fatuas ni decisiones religiosas personalizadas.',
    contentsTitle: 'En este artículo',
    topics: [
      '¿Qué es el nifas?',
      'Su duración según las referencias jurídicas',
      'Oración durante el nifas',
      'Ayuno durante el nifas',
      'Purificación y reanudación de las adoraciones',
      'Preguntas frecuentes',
    ],
    section1Body: 'El nifas designa, en la práctica religiosa, el periodo relacionado con las pérdidas de sangre después del parto. Los loquios describen el aspecto médico y fisiológico de estas pérdidas; el nifas es su clasificación religiosa. Estas dos nociones no deben confundirse.',
    tip1Title: 'Para recordar',
    tip1Text: 'AWA separa deliberadamente la información médica sobre los loquios de las referencias religiosas sobre el nifas.',
    question1: '¿Cuánto dura el nifas?',
    section2Body: 'La duración máxima puede variar según la escuela jurídica o la referencia religiosa seguida. 40 días es una referencia frecuentemente utilizada, sin que AWA la presente como una regla universal.',
    tip2Title: 'Referencia frecuentemente utilizada',
    tip2Text: 'Una referencia frecuentemente utilizada es la de 40 días, pero AWA no presenta esta cifra como una verdad única para todas las escuelas jurídicas. Sigue la referencia religiosa que hayas elegido.',
    question2: '¿Debo rezar durante el nifas?',
    section3Body: 'Durante un periodo reconocido como nifas según la referencia seguida, la oración ritual queda suspendida. AWA no clasifica automáticamente los sangrados y no ofrece una decisión personalizada. No se añade ningún contador de oraciones no realizadas para este periodo.',
    question3: '¿Puedo ayunar durante el nifas?',
    section4Body: 'El ayuno obligatorio no se realiza durante un periodo reconocido como nifas. Los días correspondientes se tratan después mediante la recuperación adecuada, según la referencia seguida.',
    tip3Title: 'Organizar, sin decidir',
    tip3Text: 'AWA puede ayudarte a recordar u organizar los días correspondientes, sin emitir una decisión religiosa personalizada.',
    section5Body: 'La reanudación depende de los signos observados y de la referencia religiosa seguida.',
    steps: [
      'Observar el fin de las pérdidas',
      'Realizar la purificación ritual',
      'Reanudar los actos de adoración correspondientes',
    ],
    alert2Title: 'En caso de duda',
    alert2Text: 'Si los sangrados persisten más allá de la duración máxima adoptada por la referencia seguida, su estatus religioso puede cambiar. Se recomienda una opinión cualificada.',
    faq: [
      {
        q: '¿El nifas dura siempre 40 días?',
        a: 'No. 40 días es una referencia frecuentemente utilizada, pero las referencias jurídicas pueden diferir.',
      },
      {
        q: '¿Qué hacer si las pérdidas se detienen antes de los 40 días?',
        a: 'La reanudación de los actos de adoración depende de los signos observados y de la referencia religiosa seguida.',
      },
      {
        q: '¿Y si los sangrados continúan durante mucho tiempo?',
        a: 'Si superan la duración máxima adoptada, su estatus religioso puede cambiar: pide una opinión cualificada.',
      },
      {
        q: '¿Puede AWA decir con exactitud si mis pérdidas siguen siendo nifas?',
        a: 'No. AWA ofrece referencias educativas generales y no emite fatuas ni decisiones personalizadas.',
      },
    ],
    alert3Title: 'Una referencia, no una fatua',
    alert3Text: 'Las situaciones personales pueden ser diferentes. En caso de duda, acércate a un erudito cualificado o a una organización religiosa reconocida.',
    shareMessage: 'El nifas en la práctica religiosa — AWA',
  },
  it: {
    badge: 'NIFAS (FIQH)',
    title: 'Il Nifas nella\npratica religiosa',
    metaDuration: '6 min di lettura',
    metaType: 'FAQ',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'Capire il Nifas, la sua durata, la preghiera, il digiuno e la ripresa degli atti di culto dopo il parto.',
    disclaimerTitle: 'Informazione importante',
    disclaimerText: 'Questo contenuto ha uno scopo puramente educativo. Le questioni religiose dovrebbero essere validate da studiosi qualificati. AWA non emette fatwa né pareri religiosi personalizzati.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Che cos’è il Nifas?',
      'La sua durata secondo i riferimenti giurisprudenziali',
      'La preghiera durante il Nifas',
      'Il digiuno durante il Nifas',
      'Purificazione e ripresa degli atti di culto',
      'Domande frequenti',
    ],
    section1Body: 'Nella pratica religiosa, il Nifas indica il periodo legato al sanguinamento dopo il parto. Le lochiazioni descrivono l’aspetto medico e fisiologico di questo sanguinamento; il Nifas ne è la classificazione religiosa. Queste due nozioni non vanno confuse.',
    tip1Title: 'Punto chiave',
    tip1Text: 'AWA separa deliberatamente le informazioni mediche sulle lochiazioni dai riferimenti religiosi sul Nifas.',
    question1: 'Quanto dura il Nifas?',
    section2Body: 'La durata massima può variare a seconda della scuola giurisprudenziale o del riferimento religioso seguito. 40 giorni è un riferimento usato di frequente, senza che AWA lo presenti come una regola universale.',
    tip2Title: 'Un riferimento di uso comune',
    tip2Text: 'Un riferimento usato di frequente è 40 giorni, ma AWA non presenta questa cifra come l’unica verità per tutte le scuole giurisprudenziali. Segui il riferimento religioso che hai scelto.',
    question2: 'Devo pregare durante il Nifas?',
    section3Body: 'Durante un periodo riconosciuto come Nifas secondo il riferimento seguito, la preghiera rituale è sospesa. AWA non classifica automaticamente il sanguinamento e non fornisce una decisione personalizzata. Per questo periodo non viene aggiunto alcun contatore di preghiere perse.',
    question3: 'Posso digiunare durante il Nifas?',
    section4Body: 'Il digiuno obbligatorio non si pratica durante un periodo riconosciuto come Nifas. I giorni interessati vengono poi gestiti con il recupero appropriato, secondo il riferimento seguito.',
    tip3Title: 'Organizzare, senza decidere',
    tip3Text: 'AWA può aiutarti a tenere traccia o a organizzare i giorni interessati, senza emettere una decisione religiosa personalizzata.',
    section5Body: 'La ripresa dipende dai segni osservati e dal riferimento religioso seguito.',
    steps: [
      'Osservare la fine del sanguinamento',
      'Eseguire la purificazione rituale',
      'Riprendere gli atti di culto interessati',
    ],
    alert2Title: 'In caso di dubbio',
    alert2Text: 'Se il sanguinamento persiste oltre la durata massima adottata dal riferimento seguito, il suo status religioso può cambiare. Si raccomanda un parere qualificato.',
    faq: [
      {
        q: 'Il Nifas dura sempre 40 giorni?',
        a: 'No. 40 giorni è un riferimento usato di frequente, ma i riferimenti giurisprudenziali possono differire.',
      },
      {
        q: 'Che cosa devo fare se il sanguinamento si ferma prima di 40 giorni?',
        a: 'La ripresa degli atti di culto dipende dai segni osservati e dal riferimento religioso seguito.',
      },
      {
        q: 'E se il sanguinamento continua a lungo?',
        a: 'Se supera la durata massima adottata, il suo status religioso può cambiare: chiedi un parere qualificato.',
      },
      {
        q: 'AWA può dirmi esattamente se il mio sanguinamento è ancora Nifas?',
        a: 'No. AWA fornisce riferimenti educativi generali e non emette una fatwa né una decisione personalizzata.',
      },
    ],
    alert3Title: 'Un riferimento, non una fatwa',
    alert3Text: 'Le situazioni personali possono differire. In caso di dubbio, rivolgiti a uno studioso qualificato o a un’organizzazione religiosa riconosciuta.',
    shareMessage: 'Il Nifas nella pratica religiosa — AWA',
  },
  tr: {
    badge: 'NİFAS (FIKIH)',
    title: 'Dini uygulamada\nnifas',
    metaDuration: '6 dk okuma',
    metaType: 'SSS',
    metaLevel: 'Başlangıç',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Nifası, süresini, namazı, orucu ve doğumdan sonra ibadetlere yeniden başlamayı anlamak.',
    disclaimerTitle: 'Önemli bilgi',
    disclaimerText: 'Bu içerik tamamen eğitim amaçlıdır. Dinî sorular yetkin âlimlere danışılarak teyit edilmelidir. AWA fetva vermez ve kişiye özel dinî hüküm bildirmez.',
    contentsTitle: 'Bu makalede',
    topics: [
      'Nifas nedir?',
      'Fıkıh kaynaklarına göre süresi',
      'Nifas sırasında namaz',
      'Nifas sırasında oruç',
      'Temizlenme ve ibadetlere yeniden başlama',
      'Sık sorulan sorular',
    ],
    section1Body: 'Dinî uygulamada nifas, doğumdan sonraki kanamayla bağlantılı dönemi ifade eder. Loşya bu kanamanın tıbbi ve fizyolojik yönünü tanımlar; nifas ise onun dinî sınıflandırmasıdır. Bu iki kavram birbirine karıştırılmamalıdır.',
    tip1Title: 'Akılda tutulacak nokta',
    tip1Text: 'AWA, loşya hakkındaki tıbbi bilgiyi nifasa ilişkin dinî ölçütlerden bilinçli olarak ayırır.',
    question1: 'Nifas ne kadar sürer?',
    section2Body: 'En uzun süre, izlenen fıkıh mezhebine veya dinî kaynağa göre değişebilir. 40 gün sık kullanılan bir ölçüttür; ancak AWA bunu evrensel bir kural olarak sunmaz.',
    tip2Title: 'Sık kullanılan bir ölçüt',
    tip2Text: 'Sık kullanılan bir ölçüt 40 gündür; ancak AWA bu rakamı tüm fıkıh mezhepleri için tek doğru olarak sunmaz. Seçtiğin dinî kaynağı takip et.',
    question2: 'Nifas sırasında namaz kılmalı mıyım?',
    section3Body: 'İzlenen kaynağa göre nifas olarak kabul edilen bir dönemde farz namaz kılınmaz. AWA kanamayı otomatik olarak sınıflandırmaz ve kişiye özel bir karar vermez. Bu dönem için kaçırılmış namaz sayacına ekleme yapılmaz.',
    question3: 'Nifas sırasında oruç tutabilir miyim?',
    section4Body: 'Nifas olarak kabul edilen bir dönemde farz oruç tutulmaz. İlgili günler, izlenen kaynağa göre uygun kaza yoluyla telafi edilir.',
    tip3Title: 'Düzenlemek, karar vermeden',
    tip3Text: 'AWA, kişiye özel bir dinî karar vermeden, ilgili günleri takip etmene veya düzenlemene yardımcı olabilir.',
    section5Body: 'Yeniden başlama, gözlemlenen işaretlere ve izlenen dinî kaynağa bağlıdır.',
    steps: [
      'Kanamanın bittiğini gözlemle',
      'Ritüel temizliği (gusül) yap',
      'İlgili ibadetlere yeniden başla',
    ],
    alert2Title: 'Şüphe durumunda',
    alert2Text: 'Kanama, izlenen kaynağın benimsediği en uzun süreyi aşarsa, dinî hükmü değişebilir. Yetkin bir görüş alınması tavsiye edilir.',
    faq: [
      {
        q: 'Nifas her zaman 40 gün mü sürer?',
        a: 'Hayır. 40 gün sık kullanılan bir ölçüttür, ancak fıkıh kaynakları farklılık gösterebilir.',
      },
      {
        q: 'Kanama 40 günden önce kesilirse ne yapmalıyım?',
        a: 'İbadetlere yeniden başlama, gözlemlenen işaretlere ve izlenen dinî kaynağa bağlıdır.',
      },
      {
        q: 'Kanama uzun süre devam ederse ne olur?',
        a: 'Benimsenen en uzun süreyi aşarsa dinî hükmü değişebilir: yetkin bir görüş al.',
      },
      {
        q: 'AWA kanamamın hâlâ nifas olup olmadığını kesin olarak söyleyebilir mi?',
        a: 'Hayır. AWA genel ve eğitici ölçütler sunar; fetva ya da kişiye özel bir karar vermez.',
      },
    ],
    alert3Title: 'Bir ölçüt, fetva değil',
    alert3Text: 'Kişisel durumlar farklılık gösterebilir. Şüphe durumunda yetkin bir âlime veya tanınmış bir dinî kuruma başvur.',
    shareMessage: 'Dini uygulamada nifas — AWA',
  },
  ru: {
    badge: 'НИФАС (ФИКХ)',
    title: 'Нифас в\nрелигиозной практике',
    metaDuration: '6 мин чтения',
    metaType: 'Вопросы и ответы',
    metaLevel: 'Для начинающих',
    metaValidated: 'Проверенный материал',
    intro: 'О нифасе, его продолжительности, намазе, посте и возобновлении богослужения после родов.',
    disclaimerTitle: 'Важная информация',
    disclaimerText: 'Этот материал носит исключительно образовательный характер. Религиозные вопросы следует уточнять у квалифицированных богословов. AWA не выносит фетв и не даёт персональных религиозных заключений.',
    contentsTitle: 'В этой статье',
    topics: [
      'Что такое нифас?',
      'Продолжительность согласно фикхским источникам',
      'Намаз во время нифаса',
      'Пост во время нифаса',
      'Очищение и возобновление богослужения',
      'Часто задаваемые вопросы',
    ],
    section1Body: 'В религиозной практике нифасом называют период, связанный с кровотечением после родов. Лохии описывают медицинскую и физиологическую сторону этого кровотечения, а нифас — его религиозную классификацию. Эти два понятия не следует путать.',
    tip1Title: 'Главное',
    tip1Text: 'AWA намеренно разделяет медицинскую информацию о лохиях и религиозные ориентиры о нифасе.',
    question1: 'Сколько длится нифас?',
    section2Body: 'Максимальная продолжительность может различаться в зависимости от школы фикха или религиозного источника, которому вы следуете. 40 дней — часто используемый ориентир, но AWA не представляет его как универсальное правило.',
    tip2Title: 'Часто используемый ориентир',
    tip2Text: 'Часто используемый ориентир — 40 дней, однако AWA не представляет эту цифру как единственную истину для всех школ фикха. Следуйте религиозному источнику, который вы выбрали.',
    question2: 'Нужно ли совершать намаз во время нифаса?',
    section3Body: 'В период, признаваемый нифасом согласно выбранному источнику, обязательный намаз не совершается. AWA не классифицирует кровотечение автоматически и не даёт персонального решения. За этот период счётчик пропущенных намазов не ведётся.',
    question3: 'Можно ли поститься во время нифаса?',
    section4Body: 'Обязательный пост не соблюдается в период, признаваемый нифасом. Затронутые дни затем восполняются в установленном порядке согласно выбранному источнику.',
    tip3Title: 'Помочь организовать, не принимая решений',
    tip3Text: 'AWA может помочь вам отмечать и упорядочивать затронутые дни, не выдавая персонального религиозного решения.',
    section5Body: 'Возобновление зависит от наблюдаемых признаков и выбранного религиозного источника.',
    steps: [
      'Дождаться окончания кровотечения',
      'Совершить ритуальное очищение',
      'Возобновить соответствующее богослужение',
    ],
    alert2Title: 'В случае сомнений',
    alert2Text: 'Если кровотечение продолжается дольше максимального срока, принятого в выбранном источнике, его религиозный статус может измениться. Рекомендуется обратиться к квалифицированному специалисту.',
    faq: [
      {
        q: 'Всегда ли нифас длится 40 дней?',
        a: 'Нет. 40 дней — часто используемый ориентир, но фикхские источники могут различаться.',
      },
      {
        q: 'Что делать, если кровотечение прекратилось раньше 40 дней?',
        a: 'Возобновление богослужения зависит от наблюдаемых признаков и выбранного религиозного источника.',
      },
      {
        q: 'Что, если кровотечение продолжается долго?',
        a: 'Если оно превышает принятый максимальный срок, его религиозный статус может измениться: обратитесь за квалифицированным мнением.',
      },
      {
        q: 'Может ли AWA точно сказать, остаётся ли моё кровотечение нифасом?',
        a: 'Нет. AWA даёт общие образовательные ориентиры и не выносит фетв и персональных решений.',
      },
    ],
    alert3Title: 'Ориентир, а не фетва',
    alert3Text: 'Личные ситуации могут различаться. В случае сомнений обратитесь к квалифицированному богослову или признанной религиозной организации.',
    shareMessage: 'Нифас в религиозной практике — AWA',
  },
  de: {
    badge: 'NIFAS (FIQH)',
    title: 'Nifas in der\nreligiösen Praxis',
    metaDuration: '6 Min. Lesezeit',
    metaType: 'Häufige Fragen',
    metaLevel: 'Einsteiger',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Nifas verstehen: seine Dauer, das Gebet, das Fasten und die Wiederaufnahme der Gottesdienste nach der Geburt.',
    disclaimerTitle: 'Wichtiger Hinweis',
    disclaimerText: 'Dieser Inhalt ist rein bildend. Religiöse Fragen sollten von qualifizierten Gelehrten geklärt werden. AWA erteilt keine Fatwas oder persönlichen religiösen Urteile.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Was ist Nifas?',
      'Seine Dauer nach den rechtlichen Referenzen',
      'Das Gebet während des Nifas',
      'Das Fasten während des Nifas',
      'Reinigung und Wiederaufnahme der Gottesdienste',
      'Häufig gestellte Fragen',
    ],
    section1Body: 'In der religiösen Praxis bezeichnet Nifas die Zeit, die mit der Blutung nach der Geburt verbunden ist. Der Wochenfluss beschreibt den medizinischen und körperlichen Aspekt dieser Blutung; Nifas ist ihre religiöse Einordnung. Diese beiden Begriffe sollten nicht verwechselt werden.',
    tip1Title: 'Das Wichtigste',
    tip1Text: 'AWA trennt bewusst die medizinischen Informationen zum Wochenfluss von den religiösen Orientierungspunkten zum Nifas.',
    question1: 'Wie lange dauert das Nifas?',
    section2Body: 'Die maximale Dauer kann je nach Rechtsschule oder befolgter religiöser Referenz unterschiedlich sein. 40 Tage sind eine häufig verwendete Referenz, werden von AWA aber nicht als allgemeingültige Regel dargestellt.',
    tip2Title: 'Ein häufig verwendeter Richtwert',
    tip2Text: 'Eine häufig verwendete Referenz sind 40 Tage, doch AWA stellt diese Zahl nicht als die eine Wahrheit für alle Rechtsschulen dar. Folge der religiösen Referenz, für die du dich entschieden hast.',
    question2: 'Soll ich während des Nifas beten?',
    section3Body: 'In einer Zeit, die nach der befolgten Referenz als Nifas gilt, ist das rituelle Gebet ausgesetzt. AWA ordnet Blutungen nicht automatisch ein und trifft keine persönliche Entscheidung. Für diese Zeit wird kein Zähler für versäumte Gebete geführt.',
    question3: 'Kann ich während des Nifas fasten?',
    section4Body: 'Das verpflichtende Fasten wird in einer Zeit, die als Nifas gilt, nicht durchgeführt. Die betroffenen Tage werden dann gemäß der befolgten Referenz auf die vorgesehene Weise nachgeholt.',
    tip3Title: 'Ordnen, ohne zu entscheiden',
    tip3Text: 'AWA kann dir helfen, die betroffenen Tage festzuhalten oder zu ordnen, ohne eine persönliche religiöse Entscheidung zu treffen.',
    section5Body: 'Die Wiederaufnahme hängt von den beobachteten Zeichen und der befolgten religiösen Referenz ab.',
    steps: [
      'Das Ende der Blutung beobachten',
      'Die rituelle Reinigung vollziehen',
      'Die betroffenen Gottesdienste wieder aufnehmen',
    ],
    alert2Title: 'Bei Zweifeln',
    alert2Text: 'Wenn die Blutung über die von der befolgten Referenz angenommene Höchstdauer hinaus anhält, kann sich ihr religiöser Status ändern. Eine fachkundige Auskunft wird empfohlen.',
    faq: [
      {
        q: 'Dauert das Nifas immer 40 Tage?',
        a: 'Nein. 40 Tage sind eine häufig verwendete Referenz, aber die rechtlichen Referenzen können voneinander abweichen.',
      },
      {
        q: 'Was soll ich tun, wenn die Blutung vor 40 Tagen aufhört?',
        a: 'Die Wiederaufnahme der Gottesdienste hängt von den beobachteten Zeichen und der befolgten religiösen Referenz ab.',
      },
      {
        q: 'Was ist, wenn die Blutung lange anhält?',
        a: 'Wenn sie die angenommene Höchstdauer überschreitet, kann sich ihr religiöser Status ändern: Hole eine fachkundige Auskunft ein.',
      },
      {
        q: 'Kann AWA genau sagen, ob meine Blutung noch Nifas ist?',
        a: 'Nein. AWA liefert allgemeine bildende Orientierungspunkte und erteilt weder eine Fatwa noch eine persönliche Entscheidung.',
      },
    ],
    alert3Title: 'Ein Orientierungspunkt, keine Fatwa',
    alert3Text: 'Persönliche Situationen können sich unterscheiden. Wende dich bei Zweifeln an eine qualifizierte Gelehrte oder einen qualifizierten Gelehrten oder an eine anerkannte religiöse Organisation.',
    shareMessage: 'Nifas in der religiösen Praxis – AWA',
  },
  zh: {
      badge: '产后恶露期（Nifas）• 教法',
      title: '宗教实践中的\n产后恶露期（Nifas）',
      metaDuration: '阅读约 6 分钟',
      metaType: '常见问题',
      metaLevel: '入门',
      metaValidated: '已审阅内容',
      intro: '了解产后恶露期（Nifas）、它的时长、礼拜、斋戒，以及分娩后恢复各项功修。',
      disclaimerTitle: '重要提示',
      disclaimerText: '本内容纯属科普。宗教问题应由有资质的学者来确认。AWA 不发布法特瓦（fatwa），也不提供针对个人的宗教裁定。',
      contentsTitle: '本文内容',
      topics: [
        '什么是产后恶露期（Nifas）？',
        '教法依据中的时长',
        '产后恶露期间的礼拜',
        '产后恶露期间的斋戒',
        '洁净与恢复功修',
        '常见问题',
      ],
      section1Body: '在宗教实践中，Nifas 指与分娩后出血相关的时期。恶露描述的是这种出血在医学和生理方面的情况；Nifas 则是它在宗教上的归类。这两个概念不应混为一谈。',
      tip1Title: '要点',
      tip1Text: 'AWA 有意将恶露的医学信息与 Nifas 的宗教标准区分开来。',
      question1: 'Nifas 会持续多久？',
      section2Body: '最长时限可能因所遵循的教法学派或宗教依据而异。40 天是常被采用的参考，但 AWA 并不将其作为通行的统一规则。',
      tip2Title: '常用的参考标准',
      tip2Text: '常被采用的参考是 40 天，但 AWA 并不将这个数字呈现为适用于所有学派的唯一标准。请遵循你所选择的宗教依据。',
      question2: 'Nifas 期间需要礼拜吗？',
      section3Body: '在按所遵循的依据被认定为 Nifas 的期间，礼拜功修暂停。AWA 不会自动对出血进行归类，也不提供针对个人的裁定。这段时间不会增加漏拜计数。',
      question3: 'Nifas 期间可以斋戒吗？',
      section4Body: '在被认定为 Nifas 的期间，不履行义务斋戒。相关的日子随后按照所遵循的依据，通过相应的补斋来处理。',
      tip3Title: '帮助整理，而不代为裁定',
      tip3Text: 'AWA 可以帮助你记录或整理相关的日子，但不会给出针对个人的宗教裁定。',
      section5Body: '何时恢复，取决于观察到的迹象以及所遵循的宗教依据。',
      steps: [
        '观察出血何时结束',
        '完成礼仪性的洁净（大净）',
        '恢复相关的功修',
      ],
      alert2Title: '如有疑问',
      alert2Text: '如果出血持续超过所遵循依据采用的最长时限，它在宗教上的状态可能会改变。建议向有资质的人士咨询。',
      faq: [
        {
          q: 'Nifas 一定是 40 天吗？',
          a: '不一定。40 天是常被采用的参考，但不同教法依据之间可能存在差异。',
        },
        {
          q: '如果出血在 40 天之前停止，该怎么办？',
          a: '恢复功修取决于观察到的迹象以及所遵循的宗教依据。',
        },
        {
          q: '如果出血持续很长时间呢？',
          a: '如果超过所采用的最长时限，它在宗教上的状态可能会改变：请向有资质的人士咨询。',
        },
        {
          q: 'AWA 能确切地告诉我，我的出血是否仍属于 Nifas 吗？',
          a: '不能。AWA 只提供一般性的科普参考，不发布法特瓦，也不提供针对个人的裁定。',
        },
      ],
      alert3Title: '是参考标准，不是法特瓦',
      alert3Text: '个人情况可能各不相同。如有疑问，请咨询有资质的学者或公认的宗教机构。',
      shareMessage: '宗教实践中的产后恶露期（Nifas） — AWA',
    },
  id: {
    badge: 'NIFAS (FIKIH)',
    title: 'Nifas dalam\npraktik ibadah',
    metaDuration: '6 menit baca',
    metaType: 'FAQ',
    metaLevel: 'Pemula',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Memahami nifas, lamanya, salat, puasa, dan dimulainya kembali ibadah setelah persalinan.',
    disclaimerTitle: 'Informasi penting',
    disclaimerText: 'Konten ini murni bersifat edukatif. Pertanyaan keagamaan sebaiknya divalidasi oleh ulama yang berkompeten. AWA tidak mengeluarkan fatwa atau keputusan keagamaan yang bersifat personal.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Apa itu nifas?',
      'Lamanya menurut rujukan fikih',
      'Salat saat nifas',
      'Puasa saat nifas',
      'Bersuci dan dimulainya kembali ibadah',
      'Pertanyaan yang sering diajukan',
    ],
    section1Body: 'Dalam praktik ibadah, nifas merujuk pada masa yang berkaitan dengan perdarahan setelah persalinan. Lokia menggambarkan aspek medis dan fisiologis dari perdarahan ini; nifas adalah klasifikasi keagamaannya. Kedua pengertian ini tidak boleh dicampuradukkan.',
    tip1Title: 'Poin utama',
    tip1Text: 'AWA sengaja memisahkan informasi medis tentang lokia dari penanda keagamaan tentang nifas.',
    question1: 'Berapa lama nifas berlangsung?',
    section2Body: 'Batas maksimalnya dapat berbeda menurut mazhab fikih atau rujukan keagamaan yang diikuti. 40 hari adalah rujukan yang sering digunakan, tanpa disajikan oleh AWA sebagai aturan universal.',
    tip2Title: 'Penanda yang umum digunakan',
    tip2Text: 'Rujukan yang sering digunakan adalah 40 hari, tetapi AWA tidak menyajikan angka ini sebagai satu-satunya kebenaran bagi semua mazhab fikih. Ikutilah rujukan keagamaan yang telah kamu pilih.',
    question2: 'Apakah aku harus salat saat nifas?',
    section3Body: 'Selama masa yang diakui sebagai nifas menurut rujukan yang diikuti, salat ditiadakan. AWA tidak mengklasifikasikan perdarahan secara otomatis dan tidak memberikan keputusan personal. Tidak ada penghitung salat yang terlewat yang ditambahkan untuk masa ini.',
    question3: 'Bolehkah aku berpuasa saat nifas?',
    section4Body: 'Puasa wajib tidak dilakukan selama masa yang diakui sebagai nifas. Hari-hari yang bersangkutan kemudian diganti melalui qada yang sesuai, menurut rujukan yang diikuti.',
    tip3Title: 'Mengatur, tanpa memutuskan',
    tip3Text: 'AWA dapat membantumu mencatat atau mengatur hari-hari yang bersangkutan, tanpa mengeluarkan keputusan keagamaan yang bersifat personal.',
    section5Body: 'Dimulainya kembali ibadah bergantung pada tanda yang diamati dan rujukan keagamaan yang diikuti.',
    steps: [
      'Amati berakhirnya perdarahan',
      'Lakukan bersuci',
      'Mulai kembali ibadah yang bersangkutan',
    ],
    alert2Title: 'Jika ragu',
    alert2Text: 'Jika perdarahan berlanjut melampaui batas maksimal yang dipakai oleh rujukan yang diikuti, status keagamaannya bisa berubah. Disarankan meminta pendapat dari pihak yang berkompeten.',
    faq: [
      {
        q: 'Apakah nifas selalu berlangsung 40 hari?',
        a: 'Tidak. 40 hari adalah rujukan yang sering digunakan, tetapi rujukan fikih bisa berbeda.',
      },
      {
        q: 'Apa yang harus dilakukan jika perdarahan berhenti sebelum 40 hari?',
        a: 'Dimulainya kembali ibadah bergantung pada tanda yang diamati dan rujukan keagamaan yang diikuti.',
      },
      {
        q: 'Bagaimana jika perdarahan berlanjut dalam waktu lama?',
        a: 'Jika melampaui batas maksimal yang dipakai, status keagamaannya bisa berubah: mintalah pendapat dari pihak yang berkompeten.',
      },
      {
        q: 'Bisakah AWA memastikan dengan tepat apakah perdarahanku masih nifas?',
        a: 'Tidak. AWA memberikan penanda edukatif yang bersifat umum dan tidak mengeluarkan fatwa atau keputusan personal.',
      },
    ],
    alert3Title: 'Sebuah penanda, bukan fatwa',
    alert3Text: 'Situasi pribadi bisa berbeda. Jika ragu, hubungi ulama yang berkompeten atau lembaga keagamaan yang diakui.',
    shareMessage: 'Nifas dalam praktik ibadah — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function NifasFiqhArticleScreen({
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

          <AwaText variant="bodyMedium" style={styles.intro}>
            {content.intro}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="information-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.disclaimerTitle}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>{content.disclaimerText}</AwaText>
            </View>
          </AwaCard>

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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>1. {content.topics[0]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section1Body}
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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            2. {content.topics[1]}
          </AwaText>

          <AwaText variant="titleSmall" emphasized style={styles.question}>{content.question1}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section2Body}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="calendar-star"
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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.topics[2]}</AwaText>

          <AwaText variant="titleSmall" emphasized style={styles.question}>{content.question2}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section3Body}
          </AwaText>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.topics[3]}</AwaText>

          <AwaText variant="titleSmall" emphasized style={styles.question}>{content.question3}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section4Body}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="calendar-refresh-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.tip3Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.tip3Text}
              </AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            5. {content.topics[4]}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.section5Body}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.steps.map((label, index) => (
              <View key={label} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.checkText}>
                  {index + 1}. {label}
                </AwaText>
              </View>
            ))}
          </AwaCard>

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.alert2Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.alert2Text}
              </AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>6. {content.topics[5]}</AwaText>

          {content.faq.map(item => (
            <View key={item.q} style={styles.faqItem}>
              <AwaText variant="titleSmall" emphasized style={styles.question}>{item.q}</AwaText>
              <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{item.a}</AwaText>
            </View>
          ))}

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="shield-check-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.alert3Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>
                {content.alert3Text}
              </AwaText>
            </View>
          </AwaCard>
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={6} scrollRef={scrollRef} />
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
  alert: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
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
  question: {marginTop: 16},
  body: {marginTop: 8},
  tip: {
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipCopy: {flex: 1, marginLeft: 12},
  tipText: {marginTop: 3},
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
  faqItem: {marginBottom: 4},
  });
}
