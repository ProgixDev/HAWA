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
const CONTENT = withBrazilianPortuguese('NifasFiqh', {
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
  hi: {
    badge: 'निफ़ास (फ़िक़्ह)',
    title: 'धार्मिक आचरण में\nनिफ़ास',
    metaDuration: '6 मिनट में पढ़ें',
    metaType: 'अक्सर पूछे जाने वाले सवाल',
    metaLevel: 'शुरुआती',
    metaValidated: 'समीक्षित सामग्री',
    intro: 'निफ़ास, उसकी अवधि, नमाज़, रोज़े और प्रसव के बाद इबादत दोबारा शुरू करने के बारे में समझ।',
    disclaimerTitle: 'ज़रूरी जानकारी',
    disclaimerText: 'यह सामग्री पूरी तरह शैक्षणिक है। धार्मिक सवालों की पुष्टि योग्य उलमा से करानी चाहिए। AWA फ़तवे या व्यक्तिगत धार्मिक हुक्म जारी नहीं करता।',
    contentsTitle: 'इस लेख में',
    topics: [
      'निफ़ास क्या है?',
      'फ़िक़्ही संदर्भों के अनुसार इसकी अवधि',
      'निफ़ास में नमाज़',
      'निफ़ास में रोज़ा',
      'पाकी और इबादत की दोबारा शुरुआत',
      'अक्सर पूछे जाने वाले सवाल',
    ],
    section1Body: 'धार्मिक आचरण में निफ़ास का मतलब प्रसव के बाद होने वाले रक्तस्राव से जुड़ी अवधि है। लोकिया इस रक्तस्राव का चिकित्सकीय और शारीरिक पहलू बताता है, जबकि निफ़ास उसका धार्मिक वर्गीकरण है। इन दोनों बातों को आपस में नहीं मिलाना चाहिए।',
    tip1Title: 'ज़रूरी बात',
    tip1Text: 'AWA जान-बूझकर लोकिया की चिकित्सकीय जानकारी को निफ़ास के धार्मिक मानकों से अलग रखता है।',
    question1: 'निफ़ास कितने दिन चलता है?',
    section2Body: 'अधिकतम अवधि फ़िक़्ह के मसलक या अपनाए गए धार्मिक संदर्भ के अनुसार अलग हो सकती है। 40 दिन अक्सर इस्तेमाल होने वाला संदर्भ है, लेकिन AWA इसे सार्वभौमिक नियम के रूप में पेश नहीं करता।',
    tip2Title: 'आम तौर पर इस्तेमाल होने वाला मानक',
    tip2Text: 'अक्सर इस्तेमाल होने वाला एक संदर्भ 40 दिन है, लेकिन AWA इस आँकड़े को सभी फ़िक़्ही मतों के लिए एकमात्र सच के रूप में पेश नहीं करता। आपने जिस धार्मिक संदर्भ को चुना है, उसी का पालन करें।',
    question2: 'क्या निफ़ास में मुझे नमाज़ पढ़नी चाहिए?',
    section3Body: 'जिस अवधि को अपनाए गए संदर्भ के अनुसार निफ़ास माना जाए, उसमें नमाज़ अदा करना स्थगित रहता है। AWA रक्तस्राव को अपने आप वर्गीकृत नहीं करता और कोई व्यक्तिगत फ़ैसला नहीं देता। इस अवधि के लिए छूटी हुई नमाज़ों की कोई गिनती नहीं जोड़ी जाती।',
    question3: 'क्या निफ़ास में मैं रोज़ा रख सकती हूँ?',
    section4Body: 'जिस अवधि को निफ़ास माना जाए, उसमें फ़र्ज़ रोज़ा नहीं रखा जाता। संबंधित दिनों की भरपाई अपनाए गए संदर्भ के अनुसार उचित क़ज़ा के ज़रिए की जाती है।',
    tip3Title: 'व्यवस्थित करना, फ़ैसला देना नहीं',
    tip3Text: 'AWA संबंधित दिनों का हिसाब रखने या उन्हें व्यवस्थित करने में आपकी मदद कर सकता है, बिना कोई व्यक्तिगत धार्मिक फ़ैसला दिए।',
    section5Body: 'दोबारा शुरुआत देखे गए संकेतों और अपनाए गए धार्मिक संदर्भ पर निर्भर करती है।',
    steps: [
      'रक्तस्राव के रुकने पर ध्यान दें',
      'धार्मिक तौर पर पाकी हासिल करें',
      'संबंधित इबादतें फिर से शुरू करें',
    ],
    alert2Title: 'संदेह की स्थिति में',
    alert2Text: 'अगर रक्तस्राव अपनाए गए संदर्भ की अधिकतम अवधि के बाद भी जारी रहे, तो उसकी धार्मिक हैसियत बदल सकती है। किसी योग्य व्यक्ति की राय लेने की सलाह दी जाती है।',
    faq: [
      {
        q: 'क्या निफ़ास हमेशा 40 दिन चलता है?',
        a: 'नहीं। 40 दिन अक्सर इस्तेमाल होने वाला संदर्भ है, लेकिन फ़िक़्ही संदर्भ अलग-अलग हो सकते हैं।',
      },
      {
        q: 'अगर रक्तस्राव 40 दिन से पहले रुक जाए तो क्या करूँ?',
        a: 'इबादत की दोबारा शुरुआत देखे गए संकेतों और अपनाए गए धार्मिक संदर्भ पर निर्भर करती है।',
      },
      {
        q: 'अगर रक्तस्राव लंबे समय तक जारी रहे तो क्या होगा?',
        a: 'अगर यह अपनाई गई अधिकतम अवधि से आगे चला जाए, तो इसकी धार्मिक हैसियत बदल सकती है। किसी योग्य व्यक्ति की राय लें।',
      },
      {
        q: 'क्या AWA ठीक-ठीक बता सकता है कि मेरा रक्तस्राव अब भी निफ़ास है या नहीं?',
        a: 'नहीं। AWA सामान्य शैक्षणिक मानक देता है और कोई फ़तवा या व्यक्तिगत फ़ैसला जारी नहीं करता।',
      },
    ],
    alert3Title: 'एक मानक, फ़तवा नहीं',
    alert3Text: 'व्यक्तिगत हालात अलग हो सकते हैं। संदेह की स्थिति में किसी योग्य आलिम या किसी मान्यता प्राप्त धार्मिक संस्था से संपर्क करें।',
    shareMessage: 'धार्मिक आचरण में निफ़ास — AWA',
  },
  sq: {
    badge: 'NIFASI (FIKHU)',
    title: 'Nifasi në\npraktikën fetare',
    metaDuration: '6 min lexim',
    metaType: 'Pyetje të shpeshta',
    metaLevel: 'Fillestar',
    metaValidated: 'Përmbajtje e shqyrtuar',
    intro: 'Të kuptojmë nifasin, kohëzgjatjen e tij, namazin, agjërimin dhe rifillimin e akteve të adhurimit pas lindjes.',
    disclaimerTitle: 'Informacion i rëndësishëm',
    disclaimerText: 'Kjo përmbajtje është thjesht edukative. Pyetjet fetare duhet të vlerësohen nga dijetarë të kualifikuar. AWA nuk jep fetva dhe as vendime fetare të personalizuara.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Çfarë është nifasi?',
      'Kohëzgjatja e tij sipas referencave të fikhut',
      'Namazi gjatë nifasit',
      'Agjërimi gjatë nifasit',
      'Pastrimi dhe rifillimi i akteve të adhurimit',
      'Pyetje të shpeshta',
    ],
    section1Body: 'Në praktikën fetare, nifasi nënkupton periudhën e lidhur me gjakderdhjen pas lindjes. Lohia përshkruan aspektin mjekësor dhe fiziologjik të kësaj gjakderdhjeje; nifasi është klasifikimi i saj fetar. Këto dy nocione nuk duhen ngatërruar.',
    tip1Title: 'Pika kryesore',
    tip1Text: 'AWA i ndan qëllimisht informacionet mjekësore për lohinë nga shënuesit fetarë për nifasin.',
    question1: 'Sa zgjat nifasi?',
    section2Body: 'Kohëzgjatja maksimale mund të ndryshojë sipas shkollës së fikhut ose referencës fetare që ndiqet. 40 ditë është një referencë e përdorur shpesh, pa u paraqitur nga AWA si rregull universal.',
    tip2Title: 'Një shënues i përdorur zakonisht',
    tip2Text: 'Një referencë e përdorur shpesh është 40 ditë, por AWA nuk e paraqet këtë shifër si të vetmen të vërtetë për të gjitha shkollat e fikhut. Ndiq referencën fetare që ke zgjedhur.',
    question2: 'A duhet të falem gjatë nifasit?',
    section3Body: 'Gjatë një periudhe të njohur si nifas sipas referencës që ndiqet, namazi rital pezullohet. AWA nuk e klasifikon automatikisht gjakderdhjen dhe nuk jep një vendim të personalizuar. Për këtë periudhë nuk shtohet asnjë numërues namazesh të humbura.',
    question3: 'A mund të agjëroj gjatë nifasit?',
    section4Body: 'Agjërimi i detyrueshëm nuk kryhet gjatë një periudhe të njohur si nifas. Ditët në fjalë trajtohen pastaj me kazanë e duhur, sipas referencës që ndiqet.',
    tip3Title: 'Të organizojmë, pa vendosur',
    tip3Text: 'AWA mund të të ndihmojë t’i ndjekësh ose t’i organizosh ditët në fjalë, pa dhënë një vendim fetar të personalizuar.',
    section5Body: 'Rifillimi varet nga shenjat e vërejtura dhe nga referenca fetare që ndiqet.',
    steps: [
      'Vëzhgo mbarimin e gjakderdhjes',
      'Kryej pastrimin rital',
      'Rifillo aktet e adhurimit në fjalë',
    ],
    alert2Title: 'Në rast dyshimi',
    alert2Text: 'Nëse gjakderdhja vazhdon përtej kohëzgjatjes maksimale të miratuar nga referenca që ndiqet, statusi i saj fetar mund të ndryshojë. Rekomandohet një mendim i kualifikuar.',
    faq: [
      {
        q: 'A zgjat nifasi gjithmonë 40 ditë?',
        a: 'Jo. 40 ditë është një referencë e përdorur shpesh, por referencat e fikhut mund të ndryshojnë.',
      },
      {
        q: 'Çfarë duhet të bëj nëse gjakderdhja ndalon para 40 ditëve?',
        a: 'Rifillimi i akteve të adhurimit varet nga shenjat e vërejtura dhe nga referenca fetare që ndiqet.',
      },
      {
        q: 'Çfarë ndodh nëse gjakderdhja vazhdon për një kohë të gjatë?',
        a: 'Nëse tejkalon kohëzgjatjen maksimale të miratuar, statusi i saj fetar mund të ndryshojë: kërko një mendim të kualifikuar.',
      },
      {
        q: 'A mund të më thotë AWA saktësisht nëse gjakderdhja ime është ende nifas?',
        a: 'Jo. AWA jep shënues të përgjithshëm edukativë dhe nuk jep fetva ose vendim të personalizuar.',
      },
    ],
    alert3Title: 'Një shënues, jo një fetva',
    alert3Text: 'Situatat personale mund të ndryshojnë. Në rast dyshimi, drejtohu te një dijetar i kualifikuar ose te një organizatë fetare e njohur.',
    shareMessage: 'Nifasi në praktikën fetare — AWA',
  },
  ja: {
    badge: 'ニファース（イスラーム法学）',
    title: '宗教実践における\nニファース',
    metaDuration: '読了目安6分',
    metaType: 'よくある質問',
    metaLevel: '初級',
    metaValidated: '確認済みの内容',
    intro: 'ニファースとその期間、礼拝、断食、そして出産後の宗教的行為の再開について理解します。',
    disclaimerTitle: '大切なお知らせ',
    disclaimerText: 'この内容は、あくまで教育を目的としたものです。宗教上の疑問は、資格のある学者に確認してください。AWAはファトワーや、個人に向けた宗教的な裁定を出しません。',
    contentsTitle: 'この記事の内容',
    topics: [
      'ニファースとは',
      '法学上の典拠による期間',
      'ニファース中の礼拝',
      'ニファース中の断食',
      '清めと宗教的行為の再開',
      'よくある質問',
    ],
    section1Body: '宗教実践において、ニファースとは、出産後の出血に関係する期間を指します。悪露はこの出血の医学的・生理的な側面を表し、ニファースはその宗教上の分類です。この2つの概念を混同しないようにしてください。',
    tip1Title: 'ポイント',
    tip1Text: 'AWAは、悪露についての医学的な情報と、ニファースについての宗教上の目安を、意図的に分けています。',
    question1: 'ニファースはどのくらい続きますか？',
    section2Body: '最長の期間は、従う法学派や宗教上の典拠によって異なることがあります。40日はよく使われる目安ですが、AWAはこれをすべてに共通するルールとして示してはいません。',
    tip2Title: 'よく使われる目安',
    tip2Text: 'よく使われる目安は40日ですが、AWAはこの数字をすべての法学派に共通する唯一の正解として示してはいません。ご自身が選んだ宗教上の典拠に従ってください。',
    question2: 'ニファース中は礼拝をすべきですか？',
    section3Body: '従っている典拠に照らしてニファースと認められる期間中は、儀礼としての礼拝は一時的に免除されます。AWAは出血を自動的に分類することはなく、個人に向けた判断も示しません。この期間について、礼拝をしなかった回数のカウントは加算されません。',
    question3: 'ニファース中は断食できますか？',
    section4Body: '義務の断食は、ニファースと認められる期間中は行われません。該当する日については、従っている典拠に応じて、適切な埋め合わせの形で対応します。',
    tip3Title: '整理するお手伝いであり、判断はしません',
    tip3Text: 'AWAは、該当する日を記録したり整理したりするお手伝いはできますが、個人に向けた宗教上の判断は出しません。',
    section5Body: '再開できるかどうかは、観察されたサインと、従っている宗教上の典拠によって決まります。',
    steps: [
      '出血が終わったことを確認する',
      '儀礼としての清めを行う',
      '該当する宗教的行為を再開する',
    ],
    alert2Title: '迷ったときは',
    alert2Text: '出血が、従っている典拠で採用されている最長の期間を超えて続く場合、その宗教上の位置づけが変わることがあります。資格のある方の見解を求めることをおすすめします。',
    faq: [
      {
        q: 'ニファースは必ず40日続きますか？',
        a: 'いいえ。40日はよく使われる目安ですが、法学上の典拠によって異なることがあります。',
      },
      {
        q: '出血が40日より前に止まった場合はどうすればよいですか？',
        a: '宗教的行為を再開できるかどうかは、観察されたサインと、従っている宗教上の典拠によって決まります。',
      },
      {
        q: '出血が長く続く場合はどうなりますか？',
        a: '採用されている最長の期間を超える場合、その宗教上の位置づけが変わることがあります。資格のある方の見解を求めてください。',
      },
      {
        q: 'AWAは、自分の出血がまだニファースかどうかを正確に教えてくれますか？',
        a: 'いいえ。AWAが示すのは一般的な教育上の目安であり、ファトワーや個人に向けた判断は出しません。',
      },
    ],
    alert3Title: '目安であって、ファトワーではありません',
    alert3Text: '個人の状況はさまざまです。迷ったときは、資格のある学者や、広く認められている宗教団体に相談してください。',
    shareMessage: '宗教実践におけるニファース — AWA',
  },
  ko: {
    badge: '니파스 (피크흐)',
    title: '종교 생활에서의\n니파스',
    metaDuration: '6분 읽기',
    metaType: '자주 묻는 질문',
    metaLevel: '입문',
    metaValidated: '검토된 콘텐츠',
    intro: '니파스, 그 기간, 예배, 금식, 그리고 출산 후 예배 행위의 재개에 대해 알아봐요.',
    disclaimerTitle: '중요한 안내',
    disclaimerText: '이 콘텐츠는 순수하게 교육용이에요. 종교와 관련된 질문은 자격을 갖춘 학자(울라마)에게 확인받아야 해요. AWA는 파트와나 개인별 종교 판단을 내리지 않아요.',
    contentsTitle: '이 아티클에서 다루는 내용',
    topics: [
      '니파스란?',
      '법학적 기준에 따른 기간',
      '니파스 중의 예배',
      '니파스 중의 금식',
      '정화와 예배 행위의 재개',
      '자주 묻는 질문',
    ],
    section1Body: '종교 생활에서 니파스는 출산 후 출혈과 관련된 기간을 가리켜요. 오로는 이 출혈의 의학적, 생리적인 면을 설명하고, 니파스는 그 출혈의 종교적인 분류예요. 이 두 개념은 혼동하지 말아야 해요.',
    tip1Title: '핵심',
    tip1Text: 'AWA는 오로에 대한 의학 정보와 니파스에 대한 종교적 기준을 일부러 구분해서 보여 줘요.',
    question1: '니파스는 얼마나 이어지나요?',
    section2Body: '최대 기간은 따르는 법학파나 종교적 기준에 따라 다를 수 있어요. 40일이 자주 쓰이는 기준이지만, AWA는 이를 모든 경우에 통하는 규칙으로 제시하지 않아요.',
    tip2Title: '자주 쓰이는 기준',
    tip2Text: '자주 쓰이는 기준은 40일이지만, AWA는 이 수치를 모든 법학파에 통하는 유일한 진리로 제시하지 않아요. 선택한 종교적 기준을 따르세요.',
    question2: '니파스 중에도 예배를 해야 하나요?',
    section3Body: '따르는 기준에 따라 니파스로 인정되는 기간에는 의례 예배가 중단돼요. AWA는 출혈을 자동으로 분류하지 않고 개인별 판단도 제공하지 않아요. 이 기간에 대해서는 놓친 예배 횟수가 추가되지 않아요.',
    question3: '니파스 중에도 금식할 수 있나요?',
    section4Body: '의무 금식은 니파스로 인정되는 기간에는 하지 않아요. 해당하는 날들은 따르는 기준에 맞는 카다(보충)로 처리해요.',
    tip3Title: '정리를 돕되, 판단하지는 않아요',
    tip3Text: 'AWA는 해당하는 날들을 기록하고 정리하는 데 도움을 줄 수 있지만, 개인별 종교 판단을 내리지는 않아요.',
    section5Body: '재개 여부는 관찰한 신호와 따르는 종교적 기준에 따라 달라져요.',
    steps: [
      '출혈이 끝났는지 살펴보기',
      '의례 정화하기',
      '해당하는 예배 행위 다시 시작하기',
    ],
    alert2Title: '확실하지 않을 때',
    alert2Text: '출혈이 따르는 기준에서 정한 최대 기간을 넘어서도 계속되면 그 종교적 지위가 달라질 수 있어요. 자격을 갖춘 사람의 의견을 구하는 것이 좋아요.',
    faq: [
      {
        q: '니파스는 항상 40일 동안 이어지나요?',
        a: '아니요. 40일은 자주 쓰이는 기준이지만, 법학적 기준은 서로 다를 수 있어요.',
      },
      {
        q: '40일이 되기 전에 출혈이 멈추면 어떻게 해야 하나요?',
        a: '예배 행위의 재개는 관찰한 신호와 따르는 종교적 기준에 따라 달라져요.',
      },
      {
        q: '출혈이 오랫동안 계속되면요?',
        a: '정한 최대 기간을 넘으면 그 종교적 지위가 달라질 수 있어요. 자격을 갖춘 사람의 의견을 구하세요.',
      },
      {
        q: 'AWA가 내 출혈이 아직 니파스인지 정확히 알려 줄 수 있나요?',
        a: '아니요. AWA는 일반적인 교육용 기준을 제공할 뿐 파트와나 개인별 판단을 내리지 않아요.',
      },
    ],
    alert3Title: '하나의 기준일 뿐, 파트와가 아니에요',
    alert3Text: '개인의 상황은 다를 수 있어요. 확실하지 않을 때는 자격을 갖춘 학자(울라마)나 공인된 종교 단체에 문의하세요.',
    shareMessage: '종교 생활에서의 니파스 — AWA',
  },
  'pt-PT': {
    badge: 'NIFAS (FIQH)',
    title: 'O nifas na\nprática religiosa',
    metaDuration: '6 min de leitura',
    metaType: 'FAQ',
    metaLevel: 'Iniciante',
    metaValidated: 'Conteúdo revisto',
    intro: 'Compreender o nifas, a sua duração, a oração, o jejum e a retoma dos atos de culto após o parto.',
    disclaimerTitle: 'Informação importante',
    disclaimerText: 'Este conteúdo é puramente educativo. As questões religiosas devem ser validadas por sábios qualificados. A AWA não emite fatwas nem pareceres religiosos personalizados.',
    contentsTitle: 'Neste artigo',
    topics: [
      'O que é o nifas?',
      'A sua duração segundo as referências jurisprudenciais',
      'A oração durante o nifas',
      'O jejum durante o nifas',
      'Purificação e retoma dos atos de culto',
      'Perguntas frequentes',
    ],
    section1Body: 'Na prática religiosa, o nifas designa o período ligado ao sangramento após o parto. Os lóquios descrevem o aspeto médico e fisiológico deste sangramento; o nifas é a sua classificação religiosa. Estas duas noções não devem ser confundidas.',
    tip1Title: 'Ponto essencial',
    tip1Text: 'A AWA separa deliberadamente a informação médica sobre os lóquios dos marcadores religiosos sobre o nifas.',
    question1: 'Quanto tempo dura o nifas?',
    section2Body: 'A duração máxima pode variar consoante a escola jurídica ou a referência religiosa seguida. 40 dias é uma referência frequentemente utilizada, sem ser apresentada pela AWA como uma regra universal.',
    tip2Title: 'Um marcador comummente utilizado',
    tip2Text: 'Uma referência frequentemente utilizada é de 40 dias, mas a AWA não apresenta este valor como a única verdade para todas as escolas jurídicas. Siga a referência religiosa que escolheu.',
    question2: 'Devo orar durante o nifas?',
    section3Body: 'Durante um período reconhecido como nifas segundo a referência seguida, a oração ritual fica suspensa. A AWA não classifica automaticamente um sangramento e não fornece uma decisão personalizada. Não é acrescentado nenhum contador de orações em falta para este período.',
    question3: 'Posso jejuar durante o nifas?',
    section4Body: 'O jejum obrigatório não é realizado durante um período reconhecido como nifas. Os dias em causa são então tratados através da compensação adequada, segundo a referência seguida.',
    tip3Title: 'Organizar, sem decidir',
    tip3Text: 'A AWA pode ajudá-la a acompanhar ou organizar os dias em causa, sem emitir uma decisão religiosa personalizada.',
    section5Body: 'A retoma depende dos sinais observados e da referência religiosa seguida.',
    steps: [
      'Observar o fim do sangramento',
      'Realizar a purificação ritual',
      'Retomar os atos de culto em causa',
    ],
    alert2Title: 'Em caso de dúvida',
    alert2Text: 'Se o sangramento persistir para além da duração máxima adotada pela referência seguida, o seu estatuto religioso pode mudar. Recomenda-se um parecer qualificado.',
    faq: [
      {
        q: 'O nifas dura sempre 40 dias?',
        a: 'Não. 40 dias é uma referência frequentemente utilizada, mas as referências jurisprudenciais podem diferir.',
      },
      {
        q: 'O que fazer se o sangramento parar antes dos 40 dias?',
        a: 'A retoma dos atos de culto depende dos sinais observados e da referência religiosa seguida.',
      },
      {
        q: 'E se o sangramento continuar durante muito tempo?',
        a: 'Se ultrapassar a duração máxima adotada, o seu estatuto religioso pode mudar: peça um parecer qualificado.',
      },
      {
        q: 'A AWA pode dizer exatamente se o meu sangramento ainda é nifas?',
        a: 'Não. A AWA fornece marcadores educativos gerais e não emite fatwas nem decisões personalizadas.',
      },
    ],
    alert3Title: 'Um marcador, não uma fatwa',
    alert3Text: 'As situações pessoais podem diferir. Em caso de dúvida, contacte um sábio qualificado ou uma organização religiosa reconhecida.',
    shareMessage: 'O nifas na prática religiosa — AWA',
  },
  bn: {
    badge: 'নিফাস (ফিকহ)',
    title: 'ধর্মীয় অনুশীলনে\nনিফাস',
    metaDuration: '6 মিনিটের পাঠ',
    metaType: 'প্রশ্নোত্তর',
    metaLevel: 'প্রাথমিক',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'নিফাস, এর সময়কাল, নামাজ, রোজা এবং প্রসবের পর ইবাদত পুনরায় শুরু করা বোঝা।',
    disclaimerTitle: 'গুরুত্বপূর্ণ তথ্য',
    disclaimerText: 'এই বিষয়বস্তু সম্পূর্ণ শিক্ষামূলক। ধর্মীয় প্রশ্নের উত্তর যোগ্য আলেমদের কাছ থেকে যাচাই করে নেওয়া উচিত। AWA কোনো ফতোয়া বা ব্যক্তিগত ধর্মীয় সিদ্ধান্ত দেয় না।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'নিফাস কী?',
      'ফিকহি সূত্র অনুযায়ী এর সময়কাল',
      'নিফাসের সময় নামাজ',
      'নিফাসের সময় রোজা',
      'পবিত্রতা অর্জন ও ইবাদত পুনরায় শুরু করা',
      'সচরাচর জিজ্ঞাসিত প্রশ্ন',
    ],
    section1Body: 'ধর্মীয় অনুশীলনে নিফাস বলতে প্রসবের পরের রক্তস্রাবের সঙ্গে যুক্ত সময়কে বোঝায়। লোকিয়া এই রক্তস্রাবের চিকিৎসাগত ও শারীরবৃত্তীয় দিকটি বর্ণনা করে; নিফাস হলো এর ধর্মীয় শ্রেণিবিন্যাস। এই দুটি ধারণাকে গুলিয়ে ফেলা উচিত নয়।',
    tip1Title: 'মূল কথা',
    tip1Text: 'AWA ইচ্ছাকৃতভাবে লোকিয়া সম্পর্কিত চিকিৎসা তথ্যকে নিফাস সম্পর্কিত ধর্মীয় নির্দেশক থেকে আলাদা রাখে।',
    question1: 'নিফাস কত দিন স্থায়ী হয়?',
    section2Body: 'সর্বোচ্চ সময়কাল অনুসরণ করা ফিকহি মাযহাব বা ধর্মীয় সূত্র অনুযায়ী ভিন্ন হতে পারে। 40 দিন একটি বহুল ব্যবহৃত সূত্র, তবে AWA এটিকে সর্বজনীন বিধান হিসেবে উপস্থাপন করে না।',
    tip2Title: 'একটি বহুল ব্যবহৃত নির্দেশক',
    tip2Text: 'একটি বহুল ব্যবহৃত সূত্র হলো 40 দিন, কিন্তু AWA এই সংখ্যাকে সব মাযহাবের জন্য একমাত্র সত্য হিসেবে উপস্থাপন করে না। আপনার বেছে নেওয়া ধর্মীয় সূত্র অনুসরণ করুন।',
    question2: 'নিফাসের সময় কি আমার নামাজ পড়া উচিত?',
    section3Body: 'অনুসরণ করা সূত্র অনুযায়ী নিফাস হিসেবে স্বীকৃত সময়ে ধর্মীয় নামাজ স্থগিত থাকে। AWA স্বয়ংক্রিয়ভাবে রক্তস্রাবকে শ্রেণিবদ্ধ করে না এবং ব্যক্তিগত সিদ্ধান্ত দেয় না। এই সময়ের জন্য ছুটে যাওয়া নামাজের কোনো গণনা যোগ করা হয় না।',
    question3: 'নিফাসের সময় কি আমি রোজা রাখতে পারি?',
    section4Body: 'নিফাস হিসেবে স্বীকৃত সময়ে ফরজ রোজা রাখা হয় না। সংশ্লিষ্ট দিনগুলো অনুসরণ করা সূত্র অনুযায়ী যথাযথ কাজার মাধ্যমে পূরণ করা হয়।',
    tip3Title: 'সাজিয়ে রাখা, সিদ্ধান্ত দেওয়া নয়',
    tip3Text: 'AWA আপনাকে সংশ্লিষ্ট দিনগুলোর হিসাব রাখতে বা সাজিয়ে রাখতে সাহায্য করতে পারে, কোনো ব্যক্তিগত ধর্মীয় সিদ্ধান্ত না দিয়েই।',
    section5Body: 'পুনরায় শুরু করা নির্ভর করে পর্যবেক্ষণ করা লক্ষণ এবং অনুসরণ করা ধর্মীয় সূত্রের ওপর।',
    steps: [
      'রক্তস্রাব শেষ হওয়া লক্ষ করুন',
      'ধর্মীয় রীতি অনুযায়ী পবিত্রতা অর্জন করুন',
      'সংশ্লিষ্ট ইবাদত পুনরায় শুরু করুন',
    ],
    alert2Title: 'সন্দেহ থাকলে',
    alert2Text: 'অনুসরণ করা সূত্র যে সর্বোচ্চ সময়কাল গ্রহণ করেছে, রক্তস্রাব তা ছাড়িয়ে গেলে এর ধর্মীয় অবস্থান বদলে যেতে পারে। একটি যোগ্য মতামত নেওয়া উত্তম।',
    faq: [
      {
        q: 'নিফাস কি সবসময় 40 দিন স্থায়ী হয়?',
        a: 'না। 40 দিন একটি বহুল ব্যবহৃত সূত্র, তবে ফিকহি সূত্রগুলোর মধ্যে ভিন্নতা থাকতে পারে।',
      },
      {
        q: '40 দিনের আগে রক্তস্রাব বন্ধ হয়ে গেলে কী করব?',
        a: 'ইবাদত পুনরায় শুরু করা নির্ভর করে পর্যবেক্ষণ করা লক্ষণ এবং অনুসরণ করা ধর্মীয় সূত্রের ওপর।',
      },
      {
        q: 'রক্তস্রাব দীর্ঘ সময় চলতে থাকলে কী হবে?',
        a: 'তা গৃহীত সর্বোচ্চ সময়কাল ছাড়িয়ে গেলে এর ধর্মীয় অবস্থান বদলে যেতে পারে: একটি যোগ্য মতামত নিন।',
      },
      {
        q: 'AWA কি ঠিক বলতে পারে আমার রক্তস্রাব এখনো নিফাস কি না?',
        a: 'না। AWA সাধারণ শিক্ষামূলক নির্দেশক দেয়, কোনো ফতোয়া বা ব্যক্তিগত সিদ্ধান্ত দেয় না।',
      },
    ],
    alert3Title: 'একটি নির্দেশক, ফতোয়া নয়',
    alert3Text: 'ব্যক্তিগত পরিস্থিতি ভিন্ন হতে পারে। সন্দেহ থাকলে একজন যোগ্য আলেম বা স্বীকৃত কোনো ধর্মীয় প্রতিষ্ঠানের সঙ্গে যোগাযোগ করুন।',
    shareMessage: 'ধর্মীয় অনুশীলনে নিফাস — AWA',
  },
  da: {
    badge: 'NIFAS (FIQH)',
    title: 'Nifas i\nreligiøs praksis',
    metaDuration: '6 min læsning',
    metaType: 'FAQ',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemgået indhold',
    intro: 'Forstå nifas (barselsblodet), dens varighed, bøn, faste og genoptagelsen af religiøse handlinger efter fødslen.',
    disclaimerTitle: 'Vigtig information',
    disclaimerText: 'Dette indhold er udelukkende vejledende. Religiøse spørgsmål bør bekræftes af kvalificerede lærde. AWA udsteder ikke fatwas eller personaliserede religiøse afgørelser.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvad er nifas?',
      'Dens varighed ifølge fiqh-referencer',
      'Bøn under nifas',
      'Faste under nifas',
      'Renselse og genoptagelse af religiøse handlinger',
      'Ofte stillede spørgsmål',
    ],
    section1Body: 'I religiøs praksis betegner nifas den periode, der er knyttet til blødning efter fødslen. Barselsudflåd (lochia) beskriver det medicinske og fysiologiske aspekt af denne blødning; nifas er dens religiøse klassifikation. Disse to begreber må ikke forveksles.',
    tip1Title: 'Vigtigt at huske',
    tip1Text: 'AWA adskiller bevidst den medicinske information om barselsudflåd fra de religiøse retningslinjer for nifas.',
    question1: 'Hvor længe varer nifas?',
    section2Body: 'Den maksimale varighed kan variere afhængigt af den juridiske skole eller den religiøse reference, du følger. 40 dage er en hyppigt brugt reference, uden at AWA præsenterer dette som en universel regel.',
    tip2Title: 'En hyppigt brugt retningslinje',
    tip2Text: 'En hyppigt brugt reference er 40 dage, men AWA præsenterer ikke dette tal som den eneste sandhed for alle juridiske skoler. Følg den religiøse reference, du har valgt.',
    question2: 'Skal jeg bede under nifas?',
    section3Body: 'I en periode, der anerkendes som nifas ifølge den fulgte reference, er den rituelle bøn (salat) suspenderet. AWA klassificerer ikke automatisk blødning og giver ingen personaliseret afgørelse. Der tilføjes ingen tæller for mistede bønner i denne periode.',
    question3: 'Kan jeg faste under nifas?',
    section4Body: 'Den obligatoriske faste udføres ikke i en periode, der anerkendes som nifas. De berørte dage håndteres efterfølgende med den passende erstatningsfaste, ifølge den fulgte reference.',
    tip3Title: 'Organisere, ikke beslutte',
    tip3Text: 'AWA kan hjælpe dig med at holde styr på eller organisere de berørte dage, uden at udstede en personaliseret religiøs afgørelse.',
    section5Body: 'Genoptagelsen afhænger af de observerede tegn og den fulgte religiøse reference.',
    steps: [
      'Observer blødningens ophør',
      'Udfør den rituelle renselse',
      'Genoptag de berørte religiøse handlinger',
    ],
    alert2Title: 'Ved tvivl',
    alert2Text: 'Hvis blødningen fortsætter ud over den maksimale varighed, der er vedtaget af den fulgte reference, kan dens religiøse status ændre sig. En kvalificeret udtalelse anbefales.',
    faq: [
      {
        q: 'Varer nifas altid 40 dage?',
        a: 'Nej. 40 dage er en hyppigt brugt reference, men fiqh-referencer kan afvige.',
      },
      {
        q: 'Hvad skal jeg gøre, hvis blødningen stopper før 40 dage?',
        a: 'Genoptagelsen af religiøse handlinger afhænger af de observerede tegn og den fulgte religiøse reference.',
      },
      {
        q: 'Hvad hvis blødningen fortsætter i lang tid?',
        a: 'Hvis den overstiger den vedtagne maksimale varighed, kan dens religiøse status ændre sig: søg en kvalificeret udtalelse.',
      },
      {
        q: 'Kan AWA præcist afgøre, om min blødning stadig er nifas?',
        a: 'Nej. AWA giver generelle vejledende oplysninger og udsteder hverken fatwa eller personaliserede afgørelser.',
      },
    ],
    alert3Title: 'En retningslinje, ikke en fatwa',
    alert3Text: 'Personlige situationer kan afvige. Kontakt ved tvivl en kvalificeret lærd eller en anerkendt religiøs organisation.',
    shareMessage: 'Nifas i religiøs praksis — AWA',
  },
  da: {
    badge: 'NIFAS (FIQH)',
    title: 'Nifas i\nreligiös praksis',
    metaDuration: '6 min läsning',
    metaType: 'FAQ',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemgået indhold',
    intro: 'Forstå nifas (barselsblodet), dens varighed, bön, faste och genoptagelsen av religiöse handlinger efter födslen.',
    disclaimerTitle: 'Vigtig information',
    disclaimerText: 'Dette indhold ar udelukkende vejledende. Religiöse spörgsmål bör bekräftes av kvalificerede lärde. AWA udsteder inte fatwas eller personaliserede religiöse afgörelser.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvad ar nifas?',
      'Dens varighed ifölge fiqh-referencer',
      'Bön under nifas',
      'Faste under nifas',
      'Renselse och genoptagelse av religiöse handlinger',
      'Ofte stillede spörgsmål',
    ],
    section1Body: 'I religiös praksis betegner nifas den periode, der ar knyttet till blödning efter födslen. Barselsudflåd (lochia) beskriver det medicinske och fysiologiske aspekt av denne blödning; nifas ar dens religiöse klassifikation. Disse to begreber må inte forveksles.',
    tip1Title: 'Vigtigt at huske',
    tip1Text: 'AWA adskiller bevidst den medicinske information om barselsudflåd fran de religiöse retningslinjer for nifas.',
    question1: 'Hvor länge varer nifas?',
    section2Body: 'Den maksimale varighed kan variere afhängigt av den juridiske skole eller den religiöse reference, du fölger. 40 dagar ar en hyppigt brugt reference, uden at AWA präsenterer dette som en universel regel.',
    tip2Title: 'En hyppigt brugt retningslinje',
    tip2Text: 'En hyppigt brugt reference ar 40 dagar, men AWA präsenterer inte dette tal som den eneste sandhed for alla juridiske skoler. Fölg den religiöse reference, du har valgt.',
    question2: 'Skal jag bede under nifas?',
    section3Body: 'I en periode, der anerkendes som nifas ifölge den fulgte reference, ar den rituelle bön (salat) suspenderet. AWA klassificerer inte automatisk blödning och giver ingen personaliseret afgörelse. Der tilföjes ingen täller for mistede bönner i denne periode.',
    question3: 'Kan jag faste under nifas?',
    section4Body: 'Den obligatoriske faste udföres inte i en periode, der anerkendes som nifas. De berörte dagar håndteres efterfölgende med den passende erstatningsfaste, ifölge den fulgte reference.',
    tip3Title: 'Organisere, inte beslutte',
    tip3Text: 'AWA kan hjälpe dig med at holde styr på eller organisere de berörte dagar, uden at udstede en personaliseret religiös afgörelse.',
    section5Body: 'Genoptagelsen afhänger av de observerede tegn och den fulgte religiöse reference.',
    steps: [
      'Observer blödningens ophör',
      'Udför den rituelle renselse',
      'Genoptag de berörte religiöse handlinger',
    ],
    alert2Title: 'Ved tvivl',
    alert2Text: 'Hvis blödningen fortsätter ud over den maksimale varighed, der ar vedtaget av den fulgte reference, kan dens religiöse status ändre sig. En kvalificeret udtalelse anbefales.',
    faq: [
      {
        q: 'Varer nifas alltid 40 dage?',
        a: 'Nej. 40 dagar ar en hyppigt brugt reference, men fiqh-referencer kan afvige.',
      },
      {
        q: 'Hvad skal jag göre, hvis blödningen stopper för 40 dage?',
        a: 'Genoptagelsen av religiöse handlinger afhänger av de observerede tegn och den fulgte religiöse reference.',
      },
      {
        q: 'Hvad hvis blödningen fortsätter i lang tid?',
        a: 'Hvis den overstiger den vedtagne maksimale varighed, kan dens religiöse status ändre sig: sög en kvalificeret udtalelse.',
      },
      {
        q: 'Kan AWA präcist afgöre, om min blödning fortfarande ar nifas?',
        a: 'Nej. AWA giver generelle vejledende oplysninger och udsteder hverken fatwa eller personaliserede afgörelser.',
      },
    ],
    alert3Title: 'En retningslinje, inte en fatwa',
    alert3Text: 'Personlige situationer kan afvige. Kontakt ved tvivl en kvalificeret lärd eller en anerkendt religiös organisation.',
    shareMessage: 'Nifas i religiös praksis — AWA',
  },
  sv: {
    badge: 'NIFAS (FIQH)',
    title: 'Nifas i\nreligiös praksis',
    metaDuration: '6 min läsning',
    metaType: 'FAQ',
    metaLevel: 'Begynder',
    metaValidated: 'Gennemgået indhold',
    intro: 'Forstå nifas (barselsblodet), dens varighed, bön, faste och genoptagelsen av religiöse handlinger efter födslen.',
    disclaimerTitle: 'Vigtig information',
    disclaimerText: 'Dette indhold ar udelukkende vejledende. Religiöse spörgsmål bör bekräftes av kvalificerede lärde. AWA udsteder inte fatwas eller personaliserede religiöse afgörelser.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvad ar nifas?',
      'Dens varighed ifölge fiqh-referencer',
      'Bön under nifas',
      'Faste under nifas',
      'Renselse och genoptagelse av religiöse handlinger',
      'Ofte stillede spörgsmål',
    ],
    section1Body: 'I religiös praksis betegner nifas den periode, der ar knyttet till blödning efter födslen. Barselsudflåd (lochia) beskriver det medicinske och fysiologiske aspekt av denne blödning; nifas ar dens religiöse klassifikation. Disse to begreber må inte forveksles.',
    tip1Title: 'Vigtigt at huske',
    tip1Text: 'AWA adskiller bevidst den medicinske information om barselsudflåd fran de religiöse retningslinjer for nifas.',
    question1: 'Hvor länge varer nifas?',
    section2Body: 'Den maksimale varighed kan variere afhängigt av den juridiske skole eller den religiöse reference, du fölger. 40 dagar ar en hyppigt brugt reference, uden at AWA präsenterer dette som en universel regel.',
    tip2Title: 'En hyppigt brugt retningslinje',
    tip2Text: 'En hyppigt brugt reference ar 40 dagar, men AWA präsenterer inte dette tal som den eneste sandhed for alla juridiske skoler. Fölg den religiöse reference, du har valgt.',
    question2: 'Skal jag bede under nifas?',
    section3Body: 'I en periode, der anerkendes som nifas ifölge den fulgte reference, ar den rituelle bön (salat) suspenderet. AWA klassificerer inte automatisk blödning och giver ingen personaliseret afgörelse. Der tilföjes ingen täller for mistede bönner i denne periode.',
    question3: 'Kan jag faste under nifas?',
    section4Body: 'Den obligatoriske faste udföres inte i en periode, der anerkendes som nifas. De berörte dagar håndteres efterfölgende med den passende erstatningsfaste, ifölge den fulgte reference.',
    tip3Title: 'Organisere, inte beslutte',
    tip3Text: 'AWA kan hjälpe dig med at holde styr på eller organisere de berörte dagar, uden at udstede en personaliseret religiös afgörelse.',
    section5Body: 'Genoptagelsen afhänger av de observerede tegn och den fulgte religiöse reference.',
    steps: [
      'Observer blödningens ophör',
      'Udför den rituelle renselse',
      'Genoptag de berörte religiöse handlinger',
    ],
    alert2Title: 'Ved tvivl',
    alert2Text: 'Hvis blödningen fortsätter ud over den maksimale varighed, der ar vedtaget av den fulgte reference, kan dens religiöse status ändre sig. En kvalificeret udtalelse anbefales.',
    faq: [
      {
        q: 'Varer nifas alltid 40 dage?',
        a: 'Nej. 40 dagar ar en hyppigt brugt reference, men fiqh-referencer kan afvige.',
      },
      {
        q: 'Hvad skal jag göre, hvis blödningen stopper för 40 dage?',
        a: 'Genoptagelsen av religiöse handlinger afhänger av de observerede tegn och den fulgte religiöse reference.',
      },
      {
        q: 'Hvad hvis blödningen fortsätter i lang tid?',
        a: 'Hvis den overstiger den vedtagne maksimale varighed, kan dens religiöse status ändre sig: sög en kvalificeret udtalelse.',
      },
      {
        q: 'Kan AWA präcist afgöre, om min blödning fortfarande ar nifas?',
        a: 'Nej. AWA giver generelle vejledende oplysninger och udsteder hverken fatwa eller personaliserede afgörelser.',
      },
    ],
    alert3Title: 'En retningslinje, inte en fatwa',
    alert3Text: 'Personlige situationer kan afvige. Kontakt ved tvivl en kvalificeret lärd eller en anerkendt religiös organisation.',
    shareMessage: 'Nifas i religiös praksis — AWA',
  },
} as const);

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
