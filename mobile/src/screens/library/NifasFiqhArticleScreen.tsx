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
  nb: {
    badge: 'NIFAS (FIQH)',
    title: 'Nifas i\nreligiøs praksis',
    metaDuration: '6 min lesing',
    metaType: 'Vanlige spørsmål',
    metaLevel: 'Nybegynner',
    metaValidated: 'Gjennomgått innhold',
    intro: 'Forstå nifas, varigheten, bønn, faste og gjenopptakelse av gudstjenestehandlinger etter fødselen.',
    disclaimerTitle: 'Viktig informasjon',
    disclaimerText: 'Dette innholdet er rent pedagogisk. Religiøse spørsmål bør avklares av kvalifiserte lærde. AWA utsteder ikke fatwaer eller personlige religiøse avgjørelser.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Hva er nifas?',
      'Varigheten ifølge rettslige referanser',
      'Bønn under nifas',
      'Faste under nifas',
      'Renselse og gjenopptakelse av gudstjenestehandlinger',
      'Ofte stilte spørsmål',
    ],
    section1Body: 'I religiøs praksis betegner nifas perioden knyttet til blødningen etter fødselen. Barselblødning (lochia) beskriver den medisinske og fysiologiske siden av denne blødningen; nifas er dens religiøse klassifisering. Disse to begrepene må ikke forveksles.',
    tip1Title: 'Det viktigste å huske',
    tip1Text: 'AWA skiller bevisst den medisinske informasjonen om barselblødning fra de religiøse markørene om nifas.',
    question1: 'Hvor lenge varer nifas?',
    section2Body: 'Maksimal varighet kan variere etter rettsskole eller den religiøse referansen som følges. 40 dager er en ofte brukt referanse, uten at AWA presenterer det som en universell regel.',
    tip2Title: 'En ofte brukt markør',
    tip2Text: 'En ofte brukt referanse er 40 dager, men AWA presenterer ikke dette tallet som den ene sannheten for alle rettsskoler. Følg den religiøse referansen du har valgt.',
    question2: 'Skal jeg be under nifas?',
    section3Body: 'I en periode som anerkjennes som nifas ifølge referansen som følges, er den rituelle bønnen suspendert. AWA klassifiserer ikke blødning automatisk og gir ingen personlig avgjørelse. Ingen teller for bønner som er gått glipp av, legges til for denne perioden.',
    question3: 'Kan jeg faste under nifas?',
    section4Body: 'Den obligatoriske fasten utføres ikke i en periode som anerkjennes som nifas. Dagene det gjelder, håndteres da gjennom passende innhenting, i samsvar med referansen som følges.',
    tip3Title: 'Organisere, uten å avgjøre',
    tip3Text: 'AWA kan hjelpe deg å holde oversikt over eller organisere dagene det gjelder, uten å gi en personlig religiøs avgjørelse.',
    section5Body: 'Gjenopptakelsen avhenger av tegnene som observeres og den religiøse referansen som følges.',
    steps: [
      'Observer at blødningen er over',
      'Utfør den rituelle renselsen',
      'Gjenoppta gudstjenestehandlingene det gjelder',
    ],
    alert2Title: 'Ved tvil',
    alert2Text: 'Hvis blødningen vedvarer utover maksimal varighet som er vedtatt i referansen som følges, kan dens religiøse status endre seg. En kvalifisert uttalelse anbefales.',
    faq: [
      {
        q: 'Varer nifas alltid 40 dager?',
        a: 'Nei. 40 dager er en ofte brukt referanse, men de rettslige referansene kan være forskjellige.',
      },
      {
        q: 'Hva bør jeg gjøre hvis blødningen stopper før 40 dager?',
        a: 'Gjenopptakelsen av gudstjenestehandlinger avhenger av tegnene som observeres og den religiøse referansen som følges.',
      },
      {
        q: 'Hva hvis blødningen fortsetter lenge?',
        a: 'Hvis den overstiger den vedtatte maksimale varigheten, kan dens religiøse status endre seg: be om en kvalifisert uttalelse.',
      },
      {
        q: 'Kan AWA si nøyaktig om blødningen min fortsatt er nifas?',
        a: 'Nei. AWA gir generelle pedagogiske markører og utsteder ikke en fatwa eller en personlig avgjørelse.',
      },
    ],
    alert3Title: 'En markør, ikke en fatwa',
    alert3Text: 'Personlige situasjoner kan være forskjellige. Ved tvil, ta kontakt med en kvalifisert lærd eller en anerkjent religiøs organisasjon.',
    shareMessage: 'Nifas i religiøs praksis – AWA',
  },
  pl: {
    badge: 'NIFAS (FIKH)',
    title: 'Nifas w praktyce\nreligijnej',
    metaDuration: '6 min czytania',
    metaType: 'FAQ',
    metaLevel: 'Początkujący',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Zrozumieć nifas, jego czas trwania, modlitwę, post i wznowienie aktów kultu po porodzie.',
    disclaimerTitle: 'Ważna informacja',
    disclaimerText: 'Ta treść ma wyłącznie charakter edukacyjny. Kwestie religijne powinni weryfikować wykwalifikowani uczeni. AWA nie wydaje fatw ani spersonalizowanych orzeczeń religijnych.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Czym jest nifas?',
      'Jego czas trwania według źródeł prawniczych',
      'Modlitwa podczas nifas',
      'Post podczas nifas',
      'Oczyszczenie i wznowienie aktów kultu',
      'Najczęściej zadawane pytania',
    ],
    section1Body: 'W praktyce religijnej nifas oznacza okres związany z krwawieniem po porodzie. Lochia opisują medyczny i fizjologiczny aspekt tego krwawienia; nifas jest jego klasyfikacją religijną. Tych dwóch pojęć nie należy mylić.',
    tip1Title: 'Najważniejsze do zapamiętania',
    tip1Text: 'AWA celowo oddziela informacje medyczne o lochiach od znaczników religijnych dotyczących nifas.',
    question1: 'Jak długo trwa nifas?',
    section2Body: 'Maksymalny czas trwania może się różnić w zależności od szkoły prawa lub przyjętego źródła religijnego. 40 dni to często stosowany punkt odniesienia, jednak AWA nie przedstawia go jako uniwersalnej zasady.',
    tip2Title: 'Powszechnie stosowany znacznik',
    tip2Text: 'Często stosowanym punktem odniesienia jest 40 dni, ale AWA nie przedstawia tej liczby jako jedynej prawdy dla wszystkich szkół prawa. Kieruj się wybranym przez siebie źródłem religijnym.',
    question2: 'Czy mam się modlić podczas nifas?',
    section3Body: 'W okresie uznawanym za nifas według przyjętego źródła modlitwa rytualna jest zawieszona. AWA nie klasyfikuje krwawienia automatycznie i nie podaje spersonalizowanego rozstrzygnięcia. Dla tego okresu nie jest dodawany żaden licznik opuszczonych modlitw.',
    question3: 'Czy mogę pościć podczas nifas?',
    section4Body: 'Obowiązkowego postu nie wykonuje się w okresie uznawanym za nifas. Dni, których to dotyczy, są następnie odrabiane w odpowiedni sposób, według przyjętego źródła.',
    tip3Title: 'Porządkowanie, bez rozstrzygania',
    tip3Text: 'AWA może pomóc Ci śledzić lub porządkować dni, których to dotyczy, bez wydawania spersonalizowanego rozstrzygnięcia religijnego.',
    section5Body: 'Wznowienie zależy od obserwowanych oznak i przyjętego źródła religijnego.',
    steps: [
      'Zaobserwuj koniec krwawienia',
      'Wykonaj rytualne oczyszczenie',
      'Wznów odpowiednie akty kultu',
    ],
    alert2Title: 'W razie wątpliwości',
    alert2Text: 'Jeśli krwawienie utrzymuje się dłużej niż maksymalny czas przyjęty w stosowanym źródle, jego status religijny może się zmienić. Zalecana jest opinia wykwalifikowanej osoby.',
    faq: [
      {
        q: 'Czy nifas zawsze trwa 40 dni?',
        a: 'Nie. 40 dni to często stosowany punkt odniesienia, ale źródła prawnicze mogą się różnić.',
      },
      {
        q: 'Co zrobić, jeśli krwawienie ustanie przed upływem 40 dni?',
        a: 'Wznowienie aktów kultu zależy od obserwowanych oznak i przyjętego źródła religijnego.',
      },
      {
        q: 'Co, jeśli krwawienie trwa długo?',
        a: 'Jeśli przekracza przyjęty maksymalny czas, jego status religijny może się zmienić: poproś o opinię wykwalifikowanej osoby.',
      },
      {
        q: 'Czy AWA może dokładnie powiedzieć, czy moje krwawienie to nadal nifas?',
        a: 'Nie. AWA podaje ogólne znaczniki edukacyjne i nie wydaje fatwy ani spersonalizowanego rozstrzygnięcia.',
      },
    ],
    alert3Title: 'Znacznik, a nie fatwa',
    alert3Text: 'Sytuacje osobiste mogą się różnić. W razie wątpliwości zwróć się do wykwalifikowanego uczonego lub uznanej organizacji religijnej.',
    shareMessage: 'Nifas w praktyce religijnej — AWA',
  },
  uk: {
    badge: 'НІФАС (ФІКХ)',
    title: 'Ніфас у релігійній\nпрактиці',
    metaDuration: '6 хв читання',
    metaType: 'Запитання',
    metaLevel: 'Початковий',
    metaValidated: 'Перевірений вміст',
    intro: 'Розуміння ніфасу, його тривалості, молитви, посту та відновлення актів богослужіння після пологів.',
    disclaimerTitle: 'Важлива інформація',
    disclaimerText: 'Цей вміст має виключно навчальний характер. Релігійні питання мають перевіряти кваліфіковані вчені. AWA не виносить фетв і не дає персоналізованих релігійних висновків.',
    contentsTitle: 'У цій статті',
    topics: [
      'Що таке ніфас?',
      'Його тривалість за правовими джерелами',
      'Молитва під час ніфасу',
      'Піст під час ніфасу',
      'Очищення та відновлення актів богослужіння',
      'Поширені запитання',
    ],
    section1Body: 'У релігійній практиці ніфас означає період, пов’язаний із кровотечею після пологів. Лохії описують медичний і фізіологічний аспект цієї кровотечі; ніфас — це її релігійна класифікація. Ці два поняття не слід плутати.',
    tip1Title: 'Головне',
    tip1Text: 'AWA навмисно розділяє медичну інформацію про лохії та релігійні орієнтири щодо ніфасу.',
    question1: 'Скільки триває ніфас?',
    section2Body: 'Максимальна тривалість може відрізнятися залежно від школи правознавства або релігійного джерела, якого дотримуються. 40 днів — часто вживаний орієнтир, який AWA не подає як універсальне правило.',
    tip2Title: 'Поширено вживаний орієнтир',
    tip2Text: 'Часто вживаний орієнтир — 40 днів, але AWA не подає цю цифру як єдину істину для всіх шкіл правознавства. Дотримуйтеся обраного вами релігійного джерела.',
    question2: 'Чи слід молитися під час ніфасу?',
    section3Body: 'У період, що визнається ніфасом згідно з обраним джерелом, ритуальна молитва призупиняється. AWA не класифікує кровотечу автоматично й не виносить персоналізованого рішення. Для цього періоду лічильник пропущених молитов не додається.',
    question3: 'Чи можна постити під час ніфасу?',
    section4Body: 'Обов’язковий піст не виконується в період, що визнається ніфасом. Відповідні дні потім відпрацьовуються належним чином, згідно з обраним джерелом.',
    tip3Title: 'Упорядкування, без вирішення',
    tip3Text: 'AWA може допомогти вам вести облік або впорядкувати відповідні дні, не виносячи персоналізованого релігійного рішення.',
    section5Body: 'Відновлення залежить від спостережуваних ознак та обраного релігійного джерела.',
    steps: [
      'Спостерігайте завершення кровотечі',
      'Виконайте ритуальне очищення',
      'Відновіть відповідні акти богослужіння',
    ],
    alert2Title: 'У разі сумніву',
    alert2Text: 'Якщо кровотеча триває довше за максимальну тривалість, прийняту в обраному джерелі, її релігійний статус може змінитися. Рекомендується кваліфікована думка.',
    faq: [
      {
        q: 'Чи завжди ніфас триває 40 днів?',
        a: 'Ні. 40 днів — часто вживаний орієнтир, але правові джерела можуть відрізнятися.',
      },
      {
        q: 'Що робити, якщо кровотеча припинилася до 40 днів?',
        a: 'Відновлення актів богослужіння залежить від спостережуваних ознак та обраного релігійного джерела.',
      },
      {
        q: 'А якщо кровотеча триває довго?',
        a: 'Якщо вона перевищує прийняту максимальну тривалість, її релігійний статус може змінитися: попросіть кваліфіковану думку.',
      },
      {
        q: 'Чи може AWA точно сказати, чи моя кровотеча все ще ніфас?',
        a: 'Ні. AWA подає загальні навчальні орієнтири й не виносить фетви чи персоналізованого рішення.',
      },
    ],
    alert3Title: 'Орієнтир, а не фетва',
    alert3Text: 'Особисті ситуації можуть відрізнятися. У разі сумнівів зверніться до кваліфікованого вченого або визнаної релігійної організації.',
    shareMessage: 'Ніфас у релігійній практиці — AWA',
  },
  cs: {
    badge: 'NIFÁS (FIQH)',
    title: 'Nifás v\nnáboženské praxi',
    metaDuration: '6 min čtení',
    metaType: 'Časté dotazy',
    metaLevel: 'Začátečník',
    metaValidated: 'Ověřený obsah',
    intro: 'Pochopení nifásu, jeho délky, modlitby, půstu a obnovení bohoslužeb po porodu.',
    disclaimerTitle: 'Důležitá informace',
    disclaimerText: 'Tento obsah je čistě vzdělávací. Náboženské otázky by měly být konzultovány s kvalifikovanými učenci. AWA nevydává fatwy ani osobní náboženská stanoviska.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Co je nifás?',
      'Jeho délka podle právních pramenů',
      'Modlitba během nifásu',
      'Půst během nifásu',
      'Očista a obnovení bohoslužeb',
      'Často kladené otázky',
    ],
    section1Body: 'V náboženské praxi označuje nifás období spojené s krvácením po porodu. Lochie popisují lékařskou a fyziologickou stránku tohoto krvácení; nifás je jeho náboženské zařazení. Tyto dva pojmy by se neměly zaměňovat.',
    tip1Title: 'Hlavní poznatek',
    tip1Text: 'AWA záměrně odděluje zdravotní informace o lochiích od náboženských orientačních bodů o nifásu.',
    question1: 'Jak dlouho nifás trvá?',
    section2Body: 'Maximální délka se může lišit podle právní školy nebo sledovaného náboženského zdroje. 40 dní je často používaný referenční údaj, aniž by jej AWA předkládala jako univerzální pravidlo.',
    tip2Title: 'Běžně používaný orientační bod',
    tip2Text: 'Často používaným referenčním údajem je 40 dní, ale AWA toto číslo nepředkládá jako jedinou pravdu pro všechny právní školy. Řiďte se náboženským zdrojem, který jste si zvolila.',
    question2: 'Mám se během nifásu modlit?',
    section3Body: 'Během období uznaného jako nifás podle sledovaného zdroje je rituální modlitba pozastavena. AWA krvácení automaticky neklasifikuje a neposkytuje osobní rozhodnutí. Pro toto období se nepřidává žádné počítadlo vynechaných modliteb.',
    question3: 'Mohu se během nifásu postit?',
    section4Body: 'Povinný půst se během období uznaného jako nifás nevykonává. Dotčené dny se pak řeší vhodným nahrazením, podle sledovaného zdroje.',
    tip3Title: 'Organizovat, nikoli rozhodovat',
    tip3Text: 'AWA vám může pomoci sledovat nebo uspořádat dotčené dny, aniž by vydávala osobní náboženské rozhodnutí.',
    section5Body: 'Obnovení závisí na pozorovaných příznacích a sledovaném náboženském zdroji.',
    steps: [
      'Sledujte konec krvácení',
      'Proveďte rituální očistu',
      'Obnovte dotčené úkony bohoslužby',
    ],
    alert2Title: 'V případě pochybností',
    alert2Text: 'Pokud krvácení přetrvává po uplynutí maximální délky přijaté sledovaným zdrojem, jeho náboženské postavení se může změnit. Doporučuje se kvalifikovaný názor.',
    faq: [
      {
        q: 'Trvá nifás vždy 40 dní?',
        a: 'Ne. 40 dní je často používaný referenční údaj, ale právní prameny se mohou lišit.',
      },
      {
        q: 'Co mám dělat, když krvácení skončí před 40 dny?',
        a: 'Obnovení bohoslužeb závisí na pozorovaných příznacích a sledovaném náboženském zdroji.',
      },
      {
        q: 'Co když krvácení pokračuje dlouho?',
        a: 'Pokud překročí přijatou maximální délku, jeho náboženské postavení se může změnit: požádejte o kvalifikovaný názor.',
      },
      {
        q: 'Může AWA přesně říct, zda moje krvácení je stále nifás?',
        a: 'Ne. AWA poskytuje obecné vzdělávací orientační body a nevydává fatwu ani osobní rozhodnutí.',
      },
    ],
    alert3Title: 'Orientační bod, nikoli fatwa',
    alert3Text: 'Osobní situace se mohou lišit. V případě pochybností se obraťte na kvalifikovaného učence nebo uznávanou náboženskou organizaci.',
    shareMessage: 'Nifás v náboženské praxi — AWA',
  },
  sk: {
    badge: 'NIFÁS (FIQH)',
    title: 'Nifás v\nnáboženskej praxi',
    metaDuration: '6 min čítania',
    metaType: 'Často kladené otázky',
    metaLevel: 'Začiatočník',
    metaValidated: 'Overený obsah',
    intro: 'Pochopenie nifásu, jeho trvania, modlitby, pôstu a obnovenia úkonov bohoslužby po pôrode.',
    disclaimerTitle: 'Dôležitá informácia',
    disclaimerText: 'Tento obsah je čisto vzdelávací. Náboženské otázky by mali potvrdiť kvalifikovaní učenci. AWA nevydáva fatwy ani individuálne náboženské rozhodnutia.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Čo je nifás?',
      'Jeho trvanie podľa právnych referencií',
      'Modlitba počas nifásu',
      'Pôst počas nifásu',
      'Očista a obnovenie úkonov bohoslužby',
      'Často kladené otázky',
    ],
    section1Body: 'V náboženskej praxi nifás označuje obdobie súvisiace s krvácaním po pôrode. Lóchie opisujú lekársku a fyziologickú stránku tohto krvácania; nifás je jeho náboženské zaradenie. Tieto dva pojmy by sa nemali zamieňať.',
    tip1Title: 'Hlavný bod',
    tip1Text: 'AWA zámerne oddeľuje lekárske informácie o lóchiách od náboženských orientačných bodov o nifáse.',
    question1: 'Ako dlho trvá nifás?',
    section2Body: 'Maximálne trvanie sa môže líšiť podľa právnej školy alebo nasledovanej náboženskej referencie. 40 dní je často používaná referencia, ktorú však AWA neprezentuje ako univerzálne pravidlo.',
    tip2Title: 'Bežne používaný orientačný bod',
    tip2Text: 'Často používanou referenciou je 40 dní, ale AWA toto číslo neprezentuje ako jedinú pravdu pre všetky právne školy. Riaďte sa náboženskou referenciou, ktorú ste si zvolili.',
    question2: 'Mám sa počas nifásu modliť?',
    section3Body: 'Počas obdobia uznaného ako nifás podľa nasledovanej referencie je rituálna modlitba pozastavená. AWA krvácanie automaticky nezaraďuje a neposkytuje individuálne rozhodnutie. Pre toto obdobie sa nepridáva žiadne počítadlo vynechaných modlitieb.',
    question3: 'Môžem sa počas nifásu postiť?',
    section4Body: 'Povinný pôst sa počas obdobia uznaného ako nifás nevykonáva. Dotknuté dni sa potom riešia vhodným nahradením podľa nasledovanej referencie.',
    tip3Title: 'Organizovať, bez rozhodovania',
    tip3Text: 'AWA vám môže pomôcť sledovať alebo usporiadať dotknuté dni, bez vydávania individuálneho náboženského rozhodnutia.',
    section5Body: 'Obnovenie závisí od pozorovaných znakov a nasledovanej náboženskej referencie.',
    steps: [
      'Sledujte koniec krvácania',
      'Vykonajte rituálnu očistu',
      'Obnovte príslušné úkony bohoslužby',
    ],
    alert2Title: 'V prípade pochybností',
    alert2Text: 'Ak krvácanie pretrváva po maximálnom trvaní prijatom nasledovanou referenciou, jeho náboženské postavenie sa môže zmeniť. Odporúča sa kvalifikovaný názor.',
    faq: [
      {
        q: 'Trvá nifás vždy 40 dní?',
        a: 'Nie. 40 dní je často používaná referencia, ale právne referencie sa môžu líšiť.',
      },
      {
        q: 'Čo mám robiť, ak krvácanie skončí pred 40 dňami?',
        a: 'Obnovenie úkonov bohoslužby závisí od pozorovaných znakov a nasledovanej náboženskej referencie.',
      },
      {
        q: 'Čo ak krvácanie pokračuje dlho?',
        a: 'Ak prekročí prijaté maximálne trvanie, jeho náboženské postavenie sa môže zmeniť: požiadajte o kvalifikovaný názor.',
      },
      {
        q: 'Môže AWA presne povedať, či moje krvácanie ešte je nifás?',
        a: 'Nie. AWA poskytuje všeobecné vzdelávacie orientačné body a nevydáva fatwu ani individuálne rozhodnutie.',
      },
    ],
    alert3Title: 'Orientačný bod, nie fatwa',
    alert3Text: 'Osobné situácie sa môžu líšiť. V prípade pochybností sa obráťte na kvalifikovaného učenca alebo uznávanú náboženskú organizáciu.',
    shareMessage: 'Nifás v náboženskej praxi — AWA',
  },
  hu: {
    badge: 'NIFÁSZ (FIQH)',
    title: 'A nifász a\nvallási gyakorlatban',
    metaDuration: '6 perc olvasás',
    metaType: 'GYIK',
    metaLevel: 'Kezdő',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'A nifász, annak időtartama, az ima, a böjt és az istentiszteleti cselekmények szülés utáni folytatásának megértése.',
    disclaimerTitle: 'Fontos információ',
    disclaimerText: 'Ez a tartalom kizárólag ismeretterjesztő. A vallási kérdéseket kvalifikált tudósoknak kell megerősíteniük. Az AWA nem ad ki fatwákat vagy személyre szóló vallási döntéseket.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Mi a nifász?',
      'Időtartama a jogi referenciák szerint',
      'Ima a nifász alatt',
      'Böjt a nifász alatt',
      'Megtisztulás és az istentiszteleti cselekmények folytatása',
      'Gyakran ismételt kérdések',
    ],
    section1Body: 'A vallási gyakorlatban a nifász a szülés utáni vérzéshez kapcsolódó időszakot jelöli. A gyermekágyi vérzés ennek a vérzésnek az orvosi és élettani oldalát írja le; a nifász a vallási besorolása. Ezt a két fogalmat nem szabad összekeverni.',
    tip1Title: 'Legfontosabb tudnivaló',
    tip1Text: 'Az AWA szándékosan elválasztja a gyermekágyi vérzésre vonatkozó orvosi információkat a nifászra vonatkozó vallási támpontoktól.',
    question1: 'Meddig tart a nifász?',
    section2Body: 'A maximális időtartam a jogi iskolától vagy a követett vallási referenciától függően eltérhet. A 40 nap gyakran használt referencia, amelyet az AWA azonban nem általános szabályként mutat be.',
    tip2Title: 'Gyakran használt támpont',
    tip2Text: 'Gyakran használt referencia a 40 nap, de az AWA ezt a számot nem az egyetlen igazságként mutatja be minden jogi iskola számára. Kövesd az általad választott vallási referenciát.',
    question2: 'Imádkozzam a nifász alatt?',
    section3Body: 'A követett referencia szerint nifászként elismert időszak alatt a rituális ima fel van függesztve. Az AWA automatikusan nem sorolja be a vérzést, és nem ad személyre szabott döntést. Erre az időszakra nem adódik hozzá kihagyott imák számlálója.',
    question3: 'Böjtölhetek a nifász alatt?',
    section4Body: 'A kötelező böjtöt nem végzik nifászként elismert időszak alatt. Az érintett napokat ezután a követett referencia szerinti megfelelő bepótlással kezelik.',
    tip3Title: 'Szervezés, döntés nélkül',
    tip3Text: 'Az AWA segíthet nyomon követni vagy megszervezni az érintett napokat, személyre szabott vallási döntés kiadása nélkül.',
    section5Body: 'A folytatás a megfigyelt jelektől és a követett vallási referenciától függ.',
    steps: [
      'Figyeld meg a vérzés végét',
      'Végezd el a rituális megtisztulást',
      'Folytasd az érintett istentiszteleti cselekményeket',
    ],
    alert2Title: 'Kétség esetén',
    alert2Text: 'Ha a vérzés meghaladja a követett referencia által elfogadott maximális időtartamot, vallási státusza megváltozhat. Kvalifikált vélemény kérése javasolt.',
    faq: [
      {
        q: 'A nifász mindig 40 napig tart?',
        a: 'Nem. A 40 nap gyakran használt referencia, de a jogi referenciák eltérhetnek.',
      },
      {
        q: 'Mit tegyek, ha a vérzés 40 nap előtt megszűnik?',
        a: 'Az istentiszteleti cselekmények folytatása a megfigyelt jelektől és a követett vallási referenciától függ.',
      },
      {
        q: 'Mi van, ha a vérzés hosszan tart?',
        a: 'Ha meghaladja az elfogadott maximális időtartamot, vallási státusza megváltozhat: kérj kvalifikált véleményt.',
      },
      {
        q: 'Meg tudja mondani az AWA pontosan, hogy a vérzésem még nifász-e?',
        a: 'Nem. Az AWA általános ismeretterjesztő támpontokat nyújt, és nem ad ki fatwát vagy személyre szabott döntést.',
      },
    ],
    alert3Title: 'Támpont, nem fatwa',
    alert3Text: 'A személyes helyzetek eltérhetnek. Kétség esetén fordulj egy kvalifikált tudóshoz vagy egy elismert vallási szervezethez.',
    shareMessage: 'A nifász a vallási gyakorlatban — AWA',
  },
  ro: {
    badge: 'NIFAS (FIQH)',
    title: 'Nifas în\npractica religioasă',
    metaDuration: '6 min de citit',
    metaType: 'Întrebări frecvente',
    metaLevel: 'Începător',
    metaValidated: 'Conținut revizuit',
    intro: 'Înțelegerea nifas-ului, a duratei lui, a rugăciunii, a postului și a reluării actelor de cult după naștere.',
    disclaimerTitle: 'Informație importantă',
    disclaimerText: 'Acest conținut este pur educativ. Întrebările religioase trebuie validate de savanți calificați. AWA nu emite fatwa și nici hotărâri religioase personalizate.',
    contentsTitle: 'În acest articol',
    topics: [
      'Ce este nifas-ul?',
      'Durata lui conform referințelor jurisprudențiale',
      'Rugăciunea în timpul nifas-ului',
      'Postul în timpul nifas-ului',
      'Purificarea și reluarea actelor de cult',
      'Întrebări frecvente',
    ],
    section1Body: 'În practica religioasă, nifas desemnează perioada legată de sângerarea de după naștere. Lohiile descriu aspectul medical și fiziologic al acestei sângerări; nifas-ul este încadrarea ei religioasă. Aceste două noțiuni nu trebuie confundate.',
    tip1Title: 'Ideea principală',
    tip1Text: 'AWA separă în mod deliberat informațiile medicale despre lohii de reperele religioase despre nifas.',
    question1: 'Cât durează nifas-ul?',
    section2Body: 'Durata maximă poate varia în funcție de școala de jurisprudență sau de referința religioasă urmată. 40 de zile este un reper frecvent folosit, fără a fi prezentat de AWA ca o regulă universală.',
    tip2Title: 'Un reper folosit frecvent',
    tip2Text: 'O referință frecvent folosită este de 40 de zile, dar AWA nu prezintă această cifră ca singurul adevăr pentru toate școlile de jurisprudență. Urmează referința religioasă pe care ai ales-o.',
    question2: 'Trebuie să mă rog în timpul nifas-ului?',
    section3Body: 'În timpul unei perioade recunoscute ca nifas conform referinței urmate, rugăciunea rituală este suspendată. AWA nu clasifică automat sângerarea și nu oferă o decizie personalizată. Nu se adaugă niciun contor de rugăciuni ratate pentru această perioadă.',
    question3: 'Pot posti în timpul nifas-ului?',
    section4Body: 'Postul obligatoriu nu se efectuează în timpul unei perioade recunoscute ca nifas. Zilele vizate sunt apoi tratate prin recuperarea potrivită, conform referinței urmate.',
    tip3Title: 'A organiza, fără a decide',
    tip3Text: 'AWA te poate ajuta să ții evidența sau să organizezi zilele vizate, fără a emite o decizie religioasă personalizată.',
    section5Body: 'Reluarea depinde de semnele observate și de referința religioasă urmată.',
    steps: [
      'Observă sfârșitul sângerării',
      'Efectuează purificarea rituală',
      'Reia actele de cult vizate',
    ],
    alert2Title: 'În caz de îndoială',
    alert2Text: 'Dacă sângerarea persistă dincolo de durata maximă adoptată de referința urmată, statutul ei religios se poate schimba. Se recomandă o părere calificată.',
    faq: [
      {
        q: 'Nifas-ul durează întotdeauna 40 de zile?',
        a: 'Nu. 40 de zile este un reper frecvent folosit, dar referințele jurisprudențiale pot diferi.',
      },
      {
        q: 'Ce fac dacă sângerarea se oprește înainte de 40 de zile?',
        a: 'Reluarea actelor de cult depinde de semnele observate și de referința religioasă urmată.',
      },
      {
        q: 'Ce se întâmplă dacă sângerarea continuă mult timp?',
        a: 'Dacă depășește durata maximă adoptată, statutul ei religios se poate schimba: cere o părere calificată.',
      },
      {
        q: 'Poate AWA să spună exact dacă sângerarea mea este încă nifas?',
        a: 'Nu. AWA oferă repere educative generale și nu emite o fatwa sau o decizie personalizată.',
      },
    ],
    alert3Title: 'Un reper, nu o fatwa',
    alert3Text: 'Situațiile personale pot diferi. În caz de îndoială, adresează-te unui savant calificat sau unei organizații religioase recunoscute.',
    shareMessage: 'Nifas în practica religioasă — AWA',
  },
  bg: {
    badge: 'НИФАС (ФИКХ)',
    title: 'Нифас в религиозната\nпрактика',
    metaDuration: '6 мин четене',
    metaType: 'Чести въпроси',
    metaLevel: 'Начинаещ',
    metaValidated: 'Проверено съдържание',
    intro: 'Разбиране на нифаса, продължителността му, молитвата, поста и възобновяването на богослужението след раждане.',
    disclaimerTitle: 'Важна информация',
    disclaimerText: 'Това съдържание е чисто образователно. Религиозните въпроси трябва да бъдат валидирани от квалифицирани учени. AWA не издава фетви и не дава персонализирани религиозни решения.',
    contentsTitle: 'В тази статия',
    topics: [
      'Какво е нифас?',
      'Продължителността му според юридическите референции',
      'Молитвата по време на нифас',
      'Постът по време на нифас',
      'Очистване и възобновяване на богослужението',
      'Чести въпроси',
    ],
    section1Body: 'В религиозната практика нифас означава периода, свързан с кървенето след раждане. Лохиите описват медицинския и физиологичния аспект на това кървене; нифасът е неговата религиозна класификация. Тези две понятия не бива да се бъркат.',
    tip1Title: 'Основното',
    tip1Text: 'AWA умишлено разграничава медицинската информация за лохиите от религиозните ориентири за нифаса.',
    question1: 'Колко продължава нифасът?',
    section2Body: 'Максималната продължителност може да варира според школата на правото или следваната религиозна референция. 40 дни е често използван ориентир, без AWA да го представя като универсално правило.',
    tip2Title: 'Често използван ориентир',
    tip2Text: 'Често използван ориентир е 40 дни, но AWA не представя тази цифра като единствената истина за всички школи на правото. Следвай религиозната референция, която си избрала.',
    question2: 'Трябва ли да се моля по време на нифас?',
    section3Body: 'През период, признат за нифас според следваната референция, ритуалната молитва е преустановена. AWA не класифицира автоматично кървенето и не дава персонализирано решение. За този период не се добавя брояч на пропуснати молитви.',
    question3: 'Мога ли да постя по време на нифас?',
    section4Body: 'Задължителният пост не се изпълнява през период, признат за нифас. Съответните дни се наваксват по подходящ начин, според следваната референция.',
    tip3Title: 'Организиране, без да се решава',
    tip3Text: 'AWA може да ти помогне да следиш или организираш съответните дни, без да издава персонализирано религиозно решение.',
    section5Body: 'Възобновяването зависи от наблюдаваните признаци и от следваната религиозна референция.',
    steps: [
      'Наблюдавай края на кървенето',
      'Извърши ритуалното очистване',
      'Възобнови съответното богослужение',
    ],
    alert2Title: 'При съмнение',
    alert2Text: 'Ако кървенето продължава след максималната продължителност, възприета от следваната референция, религиозният му статус може да се промени. Препоръчва се квалифицирано мнение.',
    faq: [
      {
        q: 'Нифасът винаги ли продължава 40 дни?',
        a: 'Не. 40 дни е често използван ориентир, но юридическите референции могат да се различават.',
      },
      {
        q: 'Какво да направя, ако кървенето спре преди 40 дни?',
        a: 'Възобновяването на богослужението зависи от наблюдаваните признаци и от следваната религиозна референция.',
      },
      {
        q: 'Ами ако кървенето продължава дълго?',
        a: 'Ако надвиши възприетата максимална продължителност, религиозният му статус може да се промени: поискай квалифицирано мнение.',
      },
      {
        q: 'Може ли AWA да каже точно дали кървенето ми все още е нифас?',
        a: 'Не. AWA дава общи образователни ориентири и не издава фетва или персонализирано решение.',
      },
    ],
    alert3Title: 'Ориентир, не фетва',
    alert3Text: 'Личните ситуации могат да се различават. При съмнение се обърни към квалифициран учен или признат религиозен орган.',
    shareMessage: 'Нифас в религиозната практика — AWA',
  },
  sr: {
    badge: 'НИФАС (ФИКХ)',
    title: 'Нифас у верској\nпракси',
    metaDuration: '6 мин читања',
    metaType: 'Честа питања',
    metaLevel: 'Почетник',
    metaValidated: 'Проверен садржај',
    intro: 'Разумевање нифаса, његовог трајања, молитве, поста и настављања богослужења после порођаја.',
    disclaimerTitle: 'Важна информација',
    disclaimerText: 'Овај садржај је искључиво образовни. Верска питања треба да потврде квалификовани учењаци. AWA не издаје фетве нити персонализоване верске пресуде.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Шта је нифас?',
      'Његово трајање према правним референцама',
      'Молитва током нифаса',
      'Пост током нифаса',
      'Очишћење и настављање богослужења',
      'Често постављана питања',
    ],
    section1Body: 'У верској пракси нифас означава период везан за крварење после порођаја. Лохије описују медицински и физиолошки аспект овог крварења; нифас је његова верска класификација. Ова два појма не треба мешати.',
    tip1Title: 'Основно',
    tip1Text: 'AWA намерно раздваја медицинске информације о лохијама од верских оријентира о нифасу.',
    question1: 'Колико траје нифас?',
    section2Body: 'Максимално трајање може варирати зависно од правне школе или изабране верске референце. 40 дана је често коришћен оријентир, без да га AWA представља као универзално правило.',
    tip2Title: 'Често коришћен оријентир',
    tip2Text: 'Често коришћена референца је 40 дана, али AWA ову цифру не представља као једину истину за све правне школе. Следи верску референцу коју си изабрала.',
    question2: 'Да ли треба да се молим током нифаса?',
    section3Body: 'Током периода признатог као нифас према изабраној референци, ритуална молитва је преустављена. AWA не класификује аутоматски крварење и не даје персонализовану одлуку. За овај период се не додаје бројач пропуштених молитви.',
    question3: 'Могу ли да постим током нифаса?',
    section4Body: 'Обавезни пост се не изводи током периода признатог као нифас. Одговарајући дани се затим надокнађују на одговарајући начин, према изабраној референци.',
    tip3Title: 'Организовање, без одлучивања',
    tip3Text: 'AWA ти може помоћи да пратиш или организујеш одговарајуће дане, без издавања персонализоване верске одлуке.',
    section5Body: 'Настављање зависи од уочених знакова и изабране верске референце.',
    steps: [
      'Посматрај крај крварења',
      'Изврши ритуално очишћење',
      'Настави одговарајуће богослужење',
    ],
    alert2Title: 'При сумњи',
    alert2Text: 'Ако крварење траје дуже од максималног трајања које усваја изабрана референца, његов верски статус може се променити. Препоручује се квалификовано мишљење.',
    faq: [
      {
        q: 'Да ли нифас увек траје 40 дана?',
        a: 'Не. 40 дана је често коришћен оријентир, али правне референце могу да се разликују.',
      },
      {
        q: 'Шта да радим ако крварење престане пре 40 дана?',
        a: 'Настављање богослужења зависи од уочених знакова и изабране верске референце.',
      },
      {
        q: 'Шта ако крварење траје дуго?',
        a: 'Ако премаши усвојено максимално трајање, његов верски статус може се променити: затражи квалификовано мишљење.',
      },
      {
        q: 'Може ли AWA тачно рећи да ли је моје крварење још нифас?',
        a: 'Не. AWA даје опште образовне оријентире и не издаје фетву нити персонализовану одлуку.',
      },
    ],
    alert3Title: 'Оријентир, а не фетва',
    alert3Text: 'Личне ситуације могу да се разликују. При сумњи обрати се квалификованом учењаку или признатој верској организацији.',
    shareMessage: 'Нифас у верској пракси — AWA',
  },
  hr: {
    badge: 'NIFAS (FIKH)',
    title: 'Nifas u\nvjerskoj praksi',
    metaDuration: '6 min čitanja',
    metaType: 'Česta pitanja',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Razumijevanje nifasa, njegova trajanja, molitve, posta i nastavka bogoslužnih čina nakon poroda.',
    disclaimerTitle: 'Važna informacija',
    disclaimerText: 'Ovaj je sadržaj isključivo edukativan. Vjerska pitanja trebaju potvrditi kvalificirani učenjaci. AWA ne izdaje fetve niti individualne vjerske presude.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Što je nifas?',
      'Njegovo trajanje prema pravnim izvorima',
      'Molitva tijekom nifasa',
      'Post tijekom nifasa',
      'Pročišćenje i nastavak bogoslužnih čina',
      'Često postavljana pitanja',
    ],
    section1Body: 'U vjerskoj praksi nifas označava razdoblje povezano s krvarenjem nakon poroda. Lohije opisuju medicinski i fiziološki aspekt tog krvarenja; nifas je njegova vjerska klasifikacija. Ta dva pojma ne treba brkati.',
    tip1Title: 'Ključna poruka',
    tip1Text: 'AWA namjerno odvaja medicinske informacije o lohijama od vjerskih oznaka o nifasu.',
    question1: 'Koliko traje nifas?',
    section2Body: 'Najveće trajanje može se razlikovati ovisno o pravnoj školi ili vjerskom izvoru koji se slijedi. 40 dana često je korištena referenca, ali je AWA ne predstavlja kao univerzalno pravilo.',
    tip2Title: 'Često korištena oznaka',
    tip2Text: 'Često korištena referenca je 40 dana, ali AWA ne predstavlja taj broj kao jedinu istinu za sve pravne škole. Slijedi vjerski izvor koji si odabrala.',
    question2: 'Trebam li moliti tijekom nifasa?',
    section3Body: 'Tijekom razdoblja koje se prema slijeđenom izvoru priznaje kao nifas, ritualna molitva je suspendirana. AWA automatski ne klasificira krvarenje i ne daje osobnu odluku. Za to se razdoblje ne dodaje nikakav brojač propuštenih molitvi.',
    question3: 'Mogu li postiti tijekom nifasa?',
    section4Body: 'Obvezni post ne obavlja se tijekom razdoblja priznatog kao nifas. Dani na koje se to odnosi zatim se rješavaju odgovarajućom nadoknadom, prema slijeđenom izvoru.',
    tip3Title: 'Organiziranje, bez odlučivanja',
    tip3Text: 'AWA ti može pomoći pratiti ili organizirati dane na koje se to odnosi, bez izdavanja osobne vjerske odluke.',
    section5Body: 'Nastavak ovisi o uočenim znakovima i slijeđenom vjerskom izvoru.',
    steps: [
      'Primijeti kraj krvarenja',
      'Obavi ritualno pročišćenje',
      'Nastavi bogoslužne čine na koje se to odnosi',
    ],
    alert2Title: 'U slučaju sumnje',
    alert2Text: 'Ako krvarenje traje dulje od najvećeg trajanja koje usvaja slijeđeni izvor, njegov vjerski status može se promijeniti. Preporučuje se kvalificirano mišljenje.',
    faq: [
      {
        q: 'Traje li nifas uvijek 40 dana?',
        a: 'Ne. 40 dana često je korištena referenca, ali se pravni izvori mogu razlikovati.',
      },
      {
        q: 'Što učiniti ako krvarenje prestane prije 40 dana?',
        a: 'Nastavak bogoslužnih čina ovisi o uočenim znakovima i slijeđenom vjerskom izvoru.',
      },
      {
        q: 'Što ako krvarenje potraje dugo?',
        a: 'Ako premaši usvojeno najveće trajanje, njegov vjerski status može se promijeniti: zatraži kvalificirano mišljenje.',
      },
      {
        q: 'Može li AWA točno reći je li moje krvarenje još nifas?',
        a: 'Ne. AWA pruža opće edukativne oznake i ne izdaje fetvu niti osobnu odluku.',
      },
    ],
    alert3Title: 'Oznaka, a ne fetva',
    alert3Text: 'Osobne situacije mogu se razlikovati. U slučaju sumnje obrati se kvalificiranom učenjaku ili priznatoj vjerskoj organizaciji.',
    shareMessage: 'Nifas u vjerskoj praksi — AWA',
  },
  bs: {
    badge: 'NIFAS (FIKH)',
    title: 'Nifas u\nvjerskoj praksi',
    metaDuration: '6 min čitanja',
    metaType: 'Česta pitanja',
    metaLevel: 'Početnica',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Razumijevanje nifasa, njegova trajanja, molitve, posta i nastavka bogoslužnih čina nakon porođaja.',
    disclaimerTitle: 'Važna informacija',
    disclaimerText: 'Ovaj je sadržaj isključivo edukativan. Vjerska pitanja trebaju potvrditi kvalificirani učenjaci. AWA ne izdaje fetve niti individualne vjerske presude.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Što je nifas?',
      'Njegovo trajanje prema pravnim izvorima',
      'Molitva tokom nifasa',
      'Post tokom nifasa',
      'Pročišćenje i nastavak bogoslužnih čina',
      'Često postavljana pitanja',
    ],
    section1Body: 'U vjerskoj praksi nifas označava razdoblje povezano s krvarenjem nakon porođaja. Lohije opisuju medicinski i fiziološki aspekt tog krvarenja; nifas je njegova vjerska klasifikacija. Ta dva pojma ne treba brkati.',
    tip1Title: 'Ključna poruka',
    tip1Text: 'AWA namjerno odvaja medicinske informacije o lohijama od vjerskih oznaka o nifasu.',
    question1: 'Koliko traje nifas?',
    section2Body: 'Najveće trajanje može se razlikovati ovisno o pravnoj školi ili vjerskom izvoru koji se slijedi. 40 dana često je korištena referenca, ali je AWA ne predstavlja kao univerzalno pravilo.',
    tip2Title: 'Često korištena oznaka',
    tip2Text: 'Često korištena referenca je 40 dana, ali AWA ne predstavlja taj broj kao jedinu istinu za sve pravne škole. Slijedi vjerski izvor koji si odabrala.',
    question2: 'Trebam li moliti tokom nifasa?',
    section3Body: 'Tokom razdoblja koje se prema slijeđenom izvoru priznaje kao nifas, ritualna molitva je suspendirana. AWA automatski ne klasificira krvarenje i ne daje osobnu odluku. Za to se razdoblje ne dodaje nikakav brojač propuštenih molitvi.',
    question3: 'Mogu li postiti tokom nifasa?',
    section4Body: 'Obvezni post ne obavlja se tokom razdoblja priznatog kao nifas. Dani na koje se to odnosi zatim se rješavaju odgovarajućom nadoknadom, prema slijeđenom izvoru.',
    tip3Title: 'Organiziranje, bez odlučivanja',
    tip3Text: 'AWA ti može pomoći pratiti ili organizirati dane na koje se to odnosi, bez izdavanja osobne vjerske odluke.',
    section5Body: 'Nastavak ovisi o uočenim znakovima i slijeđenom vjerskom izvoru.',
    steps: [
      'Primijeti kraj krvarenja',
      'Obavi ritualno pročišćenje',
      'Nastavi bogoslužne čine na koje se to odnosi',
    ],
    alert2Title: 'U slučaju sumnje',
    alert2Text: 'Ako krvarenje traje dulje od najvećeg trajanja koje usvaja slijeđeni izvor, njegov vjerski status može se promijeniti. Preporučuje se kvalificirano mišljenje.',
    faq: [
      {
        q: 'Traje li nifas uvijek 40 dana?',
        a: 'Ne. 40 dana često je korištena referenca, ali se pravni izvori mogu razlikovati.',
      },
      {
        q: 'Što učiniti ako krvarenje prestane prije 40 dana?',
        a: 'Nastavak bogoslužnih čina ovisi o uočenim znakovima i slijeđenom vjerskom izvoru.',
      },
      {
        q: 'Što ako krvarenje potraje dugo?',
        a: 'Ako premaši usvojeno najveće trajanje, njegov vjerski status može se promijeniti: zatraži kvalificirano mišljenje.',
      },
      {
        q: 'Može li AWA tačno reći je li moje krvarenje još nifas?',
        a: 'Ne. AWA pruža opće edukativne oznake i ne izdaje fetvu niti osobnu odluku.',
      },
    ],
    alert3Title: 'Oznaka, a ne fetva',
    alert3Text: 'Osobne situacije mogu se razlikovati. U slučaju sumnje obrati se kvalificiranom učenjaku ili priznatoj vjerskoj organizaciji.',
    shareMessage: 'Nifas u vjerskoj praksi — AWA',
  },
  sl: {
    badge: 'NIFAS (FIKH)',
    title: 'Nifas v\nverski praksi',
    metaDuration: '6 min branja',
    metaType: 'Pogosta vprašanja',
    metaLevel: 'Začetnica',
    metaValidated: 'Preverjena vsebina',
    intro: 'Razumevanje nifasa, njegovega trajanja, molitve, posta in nadaljevanja bogoslužnih dejanj po porodu.',
    disclaimerTitle: 'Pomembna informacija',
    disclaimerText: 'Ta vsebina je izključno izobraževalna. Verska vprašanja naj potrdijo kvalificirani učenjaki. AWA ne izdaja fetv ali osebnih verskih razsodb.',
    contentsTitle: 'V tem članku',
    topics: [
      'Kaj je nifas?',
      'Njegovo trajanje glede na pravne vire',
      'Molitev med nifasom',
      'Post med nifasom',
      'Očiščenje in nadaljevanje bogoslužnih dejanj',
      'Pogosto zastavljena vprašanja',
    ],
    section1Body: 'V verski praksi nifas pomeni obdobje, povezano s krvavitvijo po porodu. Lohije opisujejo medicinski in fiziološki vidik te krvavitve; nifas je njegova verska klasifikacija. Teh dveh pojmov ne smemo zamenjevati.',
    tip1Title: 'Ključno sporočilo',
    tip1Text: 'AWA namerno ločuje medicinske informacije o lohijah od verskih oznak o nifasu.',
    question1: 'Koliko traja nifas?',
    section2Body: 'Največje trajanje se lahko razlikuje glede na pravno šolo ali verski vir, ki mu sledimo. 40 dni je pogosto uporabljena referenca, vendar je AWA ne predstavlja kot univerzalnega pravila.',
    tip2Title: 'Pogosto uporabljena oznaka',
    tip2Text: 'Pogosto uporabljena referenca je 40 dni, vendar AWA te številke ne predstavlja kot edine resnice za vse pravne šole. Sledi verskemu viru, ki si ga izbrala.',
    question2: 'Ali naj molim med nifasom?',
    section3Body: 'Med obdobjem, ki se po viru, ki mu sledimo, priznava kot nifas, je ritualna molitev suspendirana. AWA samodejno ne klasificira krvavitve in ne daje osebne odločitve. Za to obdobje se ne doda noben števec zamujenih molitev.',
    question3: 'Ali lahko postim med nifasom?',
    section4Body: 'Obvezni post se ne opravlja med obdobjem, priznanim kot nifas. Dnevi, na katere se to nanaša, se nato rešujejo z ustrezno nadomestitvijo, glede na vir, ki mu sledimo.',
    tip3Title: 'Organiziranje, brez odločanja',
    tip3Text: 'AWA ti lahko pomaga spremljati ali organizirati dneve, na katere se to nanaša, brez izdajanja osebne verske odločitve.',
    section5Body: 'Nadaljevanje je odvisno od opaženih znakov in verskega vira, ki mu sledimo.',
    steps: [
      'Opazi konec krvavitve',
      'Opravi ritualno očiščenje',
      'Nadaljuj bogoslužna dejanja, na katera se to nanaša',
    ],
    alert2Title: 'V primeru dvoma',
    alert2Text: 'Če krvavitev traja dlje od največjega trajanja, ki ga sprejema vir, ki mu sledimo, se njen verski status lahko spremeni. Priporoča se kvalificirano mnenje.',
    faq: [
      {
        q: 'Ali nifas vedno traja 40 dni?',
        a: 'Ne. 40 dni je pogosto uporabljena referenca, vendar se pravni viri lahko razlikujejo.',
      },
      {
        q: 'Kaj storiti, če krvavitev preneha pred 40 dnevi?',
        a: 'Nadaljevanje bogoslužnih dejanj je odvisno od opaženih znakov in verskega vira, ki mu sledimo.',
      },
      {
        q: 'Kaj, če krvavitev traja dolgo?',
        a: 'Če preseže sprejeto največje trajanje, se njen verski status lahko spremeni: zaprosi za kvalificirano mnenje.',
      },
      {
        q: 'Ali AWA lahko natančno pove, ali je moja krvavitev še nifas?',
        a: 'Ne. AWA nudi splošne izobraževalne oznake in ne izdaja fetve ali osebne odločitve.',
      },
    ],
    alert3Title: 'Oznaka, ne fetva',
    alert3Text: 'Osebne situacije se lahko razlikujejo. V primeru dvoma se obrni na kvalificiranega učenjaka ali priznano versko organizacijo.',
    shareMessage: 'Nifas v verski praksi — AWA',
  },
  ne: {
    badge: 'निफास (फिक्ह)',
    title: 'धार्मिक अभ्यासमा\nनिफास',
    metaDuration: '6 मिनेट पढाइ',
    metaType: 'बारम्बार सोधिने प्रश्न',
    metaLevel: 'सुरुवाती',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'निफास, यसको अवधि, नमाज, रोजा र प्रसवपछि इबादत फेरि सुरु गर्ने कुरा बुझ्ने।',
    disclaimerTitle: 'महत्त्वपूर्ण जानकारी',
    disclaimerText: 'यो सामग्री पूर्ण रूपमा शैक्षिक हो। धार्मिक प्रश्नहरू योग्य विद्वानहरूद्वारा प्रमाणित गराउनुपर्छ। AWA ले फतवा वा व्यक्तिगत धार्मिक निर्णय जारी गर्दैन।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'निफास के हो?',
      'फिक्हका सन्दर्भहरूअनुसार यसको अवधि',
      'निफासको समयमा नमाज',
      'निफासको समयमा रोजा',
      'शुद्धीकरण र इबादत फेरि सुरु गर्ने',
      'बारम्बार सोधिने प्रश्नहरू',
    ],
    section1Body: 'धार्मिक अभ्यासमा, निफासले प्रसवपछिको रक्तस्रावसँग जोडिएको अवधिलाई जनाउँछ। लोकियाले यो रक्तस्रावको चिकित्सकीय र शारीरिक पक्षको वर्णन गर्छ; निफास यसको धार्मिक वर्गीकरण हो। यी दुई अवधारणालाई मिसाउनु हुँदैन।',
    tip1Title: 'मुख्य कुरा',
    tip1Text: 'AWA ले लोकियाबारे चिकित्सकीय जानकारीलाई निफासबारे धार्मिक सूचकहरूबाट जानाजानी छुट्ट्याउँछ।',
    question1: 'निफास कति लामो हुन्छ?',
    section2Body: 'अधिकतम अवधि फिक्हको विचारधारा वा पछ्याइएको धार्मिक सन्दर्भअनुसार फरक हुन सक्छ। 40 दिन बारम्बार प्रयोग गरिने सन्दर्भ हो, तर AWA ले यसलाई सार्वभौम नियमका रूपमा प्रस्तुत गर्दैन।',
    tip2Title: 'सामान्यतया प्रयोग गरिने सूचक',
    tip2Text: 'बारम्बार प्रयोग गरिने सन्दर्भ 40 दिन हो, तर AWA ले यो सङ्ख्यालाई सबै फिक्हका विचारधाराका लागि एकमात्र सत्यका रूपमा प्रस्तुत गर्दैन। आफूले छानेको धार्मिक सन्दर्भ पछ्याउनुहोस्।',
    question2: 'निफासको समयमा मैले नमाज पढ्नुपर्छ?',
    section3Body: 'पछ्याइएको सन्दर्भअनुसार निफासका रूपमा मान्यता दिइएको अवधिमा, अनुष्ठानिक नमाज स्थगित हुन्छ। AWA ले रक्तस्रावलाई स्वतः वर्गीकृत गर्दैन र व्यक्तिगत निर्णय दिँदैन। यो अवधिका लागि छुटेको नमाजको कुनै गणक थपिँदैन।',
    question3: 'निफासको समयमा म रोजा राख्न सक्छु?',
    section4Body: 'निफासका रूपमा मान्यता दिइएको अवधिमा अनिवार्य रोजा राखिँदैन। सम्बन्धित दिनहरू त्यसपछि पछ्याइएको सन्दर्भअनुसार उपयुक्त कजाद्वारा सम्हालिन्छन्।',
    tip3Title: 'निर्णय नगरी, व्यवस्थित गर्ने',
    tip3Text: 'AWA ले व्यक्तिगत धार्मिक निर्णय जारी नगरी, सम्बन्धित दिनहरूको हिसाब राख्न वा व्यवस्थित गर्न तपाईंलाई मद्दत गर्न सक्छ।',
    section5Body: 'फेरि सुरु गर्ने कुरा अवलोकन गरिएका संकेत र पछ्याइएको धार्मिक सन्दर्भमा निर्भर गर्छ।',
    steps: [
      'रक्तस्रावको अन्त्य अवलोकन गर्नुहोस्',
      'अनुष्ठानिक शुद्धीकरण गर्नुहोस्',
      'सम्बन्धित इबादतका कार्यहरू फेरि सुरु गर्नुहोस्',
    ],
    alert2Title: 'शङ्का भएमा',
    alert2Text: 'पछ्याइएको सन्दर्भले अपनाएको अधिकतम अवधिभन्दा बढी रक्तस्राव रहिरहेमा, यसको धार्मिक हैसियत बदलिन सक्छ। योग्य रायको सिफारिस गरिन्छ।',
    faq: [
      {
        q: 'के निफास सधैँ 40 दिन नै रहन्छ?',
        a: 'होइन। 40 दिन बारम्बार प्रयोग गरिने सन्दर्भ हो, तर फिक्हका सन्दर्भहरू फरक हुन सक्छन्।',
      },
      {
        q: 'रक्तस्राव 40 दिनअघि नै रोकिएमा मैले के गर्ने?',
        a: 'इबादतका कार्यहरू फेरि सुरु गर्ने कुरा अवलोकन गरिएका संकेत र पछ्याइएको धार्मिक सन्दर्भमा निर्भर गर्छ।',
      },
      {
        q: 'रक्तस्राव लामो समय जारी रहेमा के हुन्छ?',
        a: 'यदि यो अपनाइएको अधिकतम अवधिभन्दा बढी भयो भने, यसको धार्मिक हैसियत बदलिन सक्छ: योग्य रायको लागि सोध्नुहोस्।',
      },
      {
        q: 'के AWA ले मेरो रक्तस्राव अझै निफास हो कि होइन ठ्याक्कै भन्न सक्छ?',
        a: 'सक्दैन। AWA ले सामान्य शैक्षिक सूचकहरू प्रदान गर्छ र फतवा वा व्यक्तिगत निर्णय जारी गर्दैन।',
      },
    ],
    alert3Title: 'एउटा सूचक, फतवा होइन',
    alert3Text: 'व्यक्तिगत अवस्थाहरू फरक हुन सक्छन्। शङ्का भएमा, कुनै योग्य विद्वान वा मान्यताप्राप्त धार्मिक संस्थासँग सम्पर्क गर्नुहोस्।',
    shareMessage: 'धार्मिक अभ्यासमा निफास — AWA',
  },
  si: {
    badge: 'නිෆාස් (ෆික්හ්)',
    title: 'ආගමික පුරුදුවල\nනිෆාස්',
    metaDuration: 'කියවීමට මිනිත්තු 6',
    metaType: 'නිති අසන ප්‍රශ්න',
    metaLevel: 'ආරම්භක',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'නිෆාස්, එහි කාලය, සලාත්, උපවාසය සහ ප්‍රසූතියෙන් පසු නමස්කාර ක්‍රියා නැවත ආරම්භ කිරීම තේරුම් ගැනීම.',
    disclaimerTitle: 'වැදගත් තොරතුරු',
    disclaimerText: 'මෙම අන්තර්ගතය සම්පූර්ණයෙන්ම අධ්‍යාපනික වේ. ආගමික ප්‍රශ්න සුදුසුකම් ලත් විද්වතුන් විසින් තහවුරු කළ යුතුයි. AWA ෆත්වා හෝ පුද්ගලීකරණය කළ ආගමික තීන්දු නිකුත් නොකරයි.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'නිෆාස් යනු කුමක්ද?',
      'නීති විද්‍යාත්මක යොමු අනුව එහි කාලය',
      'නිෆාස් අතරතුර සලාත්',
      'නිෆාස් අතරතුර උපවාසය',
      'පිරිසිදු කිරීම සහ නමස්කාර ක්‍රියා නැවත ආරම්භ කිරීම',
      'නිතර අසන ප්‍රශ්න',
    ],
    section1Body: 'ආගමික පුරුදුවල, නිෆාස් යනු ප්‍රසූතියෙන් පසු ලේ ගැලීමට සම්බන්ධ කාලය දක්වයි. ප්‍රසූතියෙන් පසු ස්‍රාවය මෙම ලේ ගැලීමේ වෛද්‍ය සහ කායික අංගය විස්තර කරයි; නිෆාස් යනු එහි ආගමික වර්ගීකරණයයි. මෙම සංකල්ප දෙක ව්‍යාකූල නොකළ යුතුයි.',
    tip1Title: 'ප්‍රධාන කරුණ',
    tip1Text: 'AWA හිතාමතාම ප්‍රසූතියෙන් පසු ස්‍රාවය පිළිබඳ වෛද්‍ය තොරතුරු නිෆාස් පිළිබඳ ආගමික සලකුණුවලින් වෙන් කරයි.',
    question1: 'නිෆාස් කොපමණ කාලයක් පවතීද?',
    section2Body: 'උපරිම කාලය නීති චින්තන ධාරාව හෝ අනුගමනය කරන ආගමික යොමුව අනුව වෙනස් විය හැක. දින 40 නිතර භාවිතා වන යොමුවක් වන අතර, AWA විසින් එය විශ්වීය රීතියක් ලෙස ඉදිරිපත් නොකෙරේ.',
    tip2Title: 'නිතර භාවිතා වන සලකුණක්',
    tip2Text: 'නිතර භාවිතා වන යොමුවක් දින 40කි, නමුත් AWA මෙම සංඛ්‍යාව සියලු නීති චින්තන ධාරා සඳහා එකම සත්‍යය ලෙස ඉදිරිපත් නොකරයි. ඔබ තෝරාගත් ආගමික යොමුව අනුගමනය කරන්න.',
    question2: 'නිෆාස් අතරතුර මම සලාත් කළ යුතුද?',
    section3Body: 'අනුගමනය කරන යොමුවට අනුව නිෆාස් ලෙස පිළිගත් කාලයක් තුළ, ආචාරික සලාත් අත්හිටුවනු ලැබේ. AWA ලේ ගැලීම ස්වයංක්‍රීයව වර්ගීකරණය නොකරන අතර පුද්ගලීකරණය කළ තීරණයක් ලබා නොදේ. මෙම කාලය සඳහා මග හැරුණු සලාත් ගණකයක් එක් නොකෙරේ.',
    question3: 'නිෆාස් අතරතුර මට උපවාසය තැබිය හැකිද?',
    section4Body: 'අනිවාර්ය උපවාසය නිෆාස් ලෙස පිළිගත් කාලයක් තුළ ඉටු නොකෙරේ. අදාළ දින එවිට අනුගමනය කරන යොමුවට අනුව සුදුසු පිරිමැසීම හරහා හසුරුවනු ලැබේ.',
    tip3Title: 'තීරණය නොකර, සංවිධානය කිරීම',
    tip3Text: 'AWA ට පුද්ගලීකරණය කළ ආගමික තීරණයක් නිකුත් නොකර, අදාළ දින නිරීක්ෂණය කිරීමට හෝ සංවිධානය කිරීමට ඔබට උදව් කළ හැක.',
    section5Body: 'නැවත ආරම්භ කිරීම රඳා පවතින්නේ නිරීක්ෂණය කළ සලකුණු සහ අනුගමනය කරන ආගමික යොමුව මතය.',
    steps: [
      'ලේ ගැලීමේ අවසානය නිරීක්ෂණය කරන්න',
      'ආචාරික පිරිසිදු කිරීම ඉටු කරන්න',
      'අදාළ නමස්කාර ක්‍රියා නැවත ආරම්භ කරන්න',
    ],
    alert2Title: 'සැකයක් ඇති විට',
    alert2Text: 'ලේ ගැලීම අනුගමනය කරන යොමුව විසින් අනුගමනය කරන උපරිම කාලයෙන් ඔබ්බට පවතී නම්, එහි ආගමික තත්ත්වය වෙනස් විය හැක. සුදුසුකම් ලත් මතයක් නිර්දේශ කෙරේ.',
    faq: [
      {
        q: 'නිෆාස් සෑම විටම දින 40ක් පවතීද?',
        a: 'නැහැ. දින 40 නිතර භාවිතා වන යොමුවකි, නමුත් නීති විද්‍යාත්මක යොමු වෙනස් විය හැක.',
      },
      {
        q: 'ලේ ගැලීම දින 40කට පෙර නතර වුවහොත් මම කළ යුත්තේ කුමක්ද?',
        a: 'නමස්කාර ක්‍රියා නැවත ආරම්භ කිරීම රඳා පවතින්නේ නිරීක්ෂණය කළ සලකුණු සහ අනුගමනය කරන ආගමික යොමුව මතය.',
      },
      {
        q: 'ලේ ගැලීම දිගු කලක් පවතී නම් කුමක් කළ යුතුද?',
        a: 'එය අනුගමනය කළ උපරිම කාලය ඉක්මවන්නේ නම්, එහි ආගමික තත්ත්වය වෙනස් විය හැක: සුදුසුකම් ලත් මතයක් ඉල්ලන්න.',
      },
      {
        q: 'මගේ ලේ ගැලීම තවමත් නිෆාස්ද යන්න AWA ට හරියටම පැවසිය හැකිද?',
        a: 'නැහැ. AWA සාමාන්‍ය අධ්‍යාපනික සලකුණු ලබා දෙන අතර ෆත්වාවක් හෝ පුද්ගලීකරණය කළ තීරණයක් නිකුත් නොකරයි.',
      },
    ],
    alert3Title: 'සලකුණක්, ෆත්වාවක් නොවේ',
    alert3Text: 'පෞද්ගලික තත්ත්වයන් වෙනස් විය හැක. සැකයක් ඇති විට, සුදුසුකම් ලත් විද්වතෙකු හෝ පිළිගත් ආගමික සංවිධානයක් අමතන්න.',
    shareMessage: 'ආගමික පුරුදුවල නිෆාස් — AWA',
  },
  th: {
    badge: 'นิฟาส (ฟิกฮ์)',
    title: 'นิฟาสใน\nการปฏิบัติศาสนกิจ',
    metaDuration: 'อ่าน 6 นาที',
    metaType: 'คำถามที่พบบ่อย',
    metaLevel: 'เริ่มต้น',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'ทำความเข้าใจนิฟาส ระยะเวลา การละหมาด การถือศีลอด และการกลับมาปฏิบัติศาสนกิจหลังคลอด',
    disclaimerTitle: 'ข้อมูลสำคัญ',
    disclaimerText: 'เนื้อหานี้เพื่อการเรียนรู้เท่านั้น คำถามทางศาสนาควรได้รับการตรวจสอบโดยผู้รู้ที่มีคุณวุฒิ AWA ไม่ออกฟัตวาหรือข้อวินิจฉัยทางศาสนาเฉพาะบุคคล',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'นิฟาสคืออะไร?',
      'ระยะเวลาตามแหล่งอ้างอิงทางนิติศาสตร์',
      'การละหมาดระหว่างนิฟาส',
      'การถือศีลอดระหว่างนิฟาส',
      'การชำระล้างและการกลับมาปฏิบัติศาสนกิจ',
      'คำถามที่พบบ่อย',
    ],
    section1Body: 'ในการปฏิบัติศาสนกิจ นิฟาสหมายถึงช่วงเวลาที่เกี่ยวข้องกับเลือดที่ออกหลังคลอด น้ำคาวปลาอธิบายด้านการแพทย์และสรีรวิทยาของเลือดนี้ นิฟาสคือการจัดประเภททางศาสนาของมัน ไม่ควรสับสนสองแนวคิดนี้',
    tip1Title: 'ประเด็นสำคัญ',
    tip1Text: 'AWA แยกข้อมูลทางการแพทย์เรื่องน้ำคาวปลาออกจากเครื่องหมายทางศาสนาเรื่องนิฟาสโดยเจตนา',
    question1: 'นิฟาสนานเท่าไร?',
    section2Body: 'ระยะเวลาสูงสุดอาจต่างกันตามสำนักนิติศาสตร์หรือแหล่งอ้างอิงทางศาสนาที่ปฏิบัติตาม 40 วันเป็นแหล่งอ้างอิงที่ใช้บ่อย โดย AWA ไม่ได้นำเสนอว่าเป็นกฎสากล',
    tip2Title: 'เครื่องหมายที่ใช้กันทั่วไป',
    tip2Text: 'แหล่งอ้างอิงที่ใช้บ่อยคือ 40 วัน แต่ AWA ไม่ได้นำเสนอตัวเลขนี้ว่าเป็นความจริงเดียวสำหรับทุกสำนักนิติศาสตร์ ปฏิบัติตามแหล่งอ้างอิงทางศาสนาที่คุณเลือก',
    question2: 'ฉันควรละหมาดระหว่างนิฟาสหรือไม่?',
    section3Body: 'ในช่วงเวลาที่ถือเป็นนิฟาสตามแหล่งอ้างอิงที่ปฏิบัติตาม การละหมาดตามพิธีกรรมถูกระงับ AWA ไม่จัดประเภทเลือดที่ออกโดยอัตโนมัติและไม่ให้การตัดสินใจเฉพาะบุคคล ไม่มีการเพิ่มตัวนับการละหมาดที่พลาดสำหรับช่วงนี้',
    question3: 'ฉันถือศีลอดระหว่างนิฟาสได้หรือไม่?',
    section4Body: 'ไม่ทำการถือศีลอดที่เป็นข้อบังคับในช่วงเวลาที่ถือเป็นนิฟาส วันที่เกี่ยวข้องจะจัดการด้วยการชดเชยที่เหมาะสมตามแหล่งอ้างอิงที่ปฏิบัติตาม',
    tip3Title: 'การจัดระเบียบ โดยไม่ตัดสินใจ',
    tip3Text: 'AWA ช่วยคุณติดตามหรือจัดระเบียบวันที่เกี่ยวข้องได้ โดยไม่ให้การตัดสินใจทางศาสนาเฉพาะบุคคล',
    section5Body: 'การกลับมาปฏิบัติขึ้นอยู่กับสัญญาณที่สังเกตได้และแหล่งอ้างอิงทางศาสนาที่ปฏิบัติตาม',
    steps: [
      'สังเกตการสิ้นสุดของเลือดที่ออก',
      'ทำการชำระล้างตามพิธีกรรม',
      'กลับมาปฏิบัติศาสนกิจที่เกี่ยวข้อง',
    ],
    alert2Title: 'เมื่อสงสัย',
    alert2Text: 'หากเลือดยังออกเกินระยะเวลาสูงสุดที่แหล่งอ้างอิงที่ปฏิบัติตามกำหนด สถานะทางศาสนาของเลือดอาจเปลี่ยนไป แนะนำให้ขอความเห็นจากผู้มีคุณวุฒิ',
    faq: [
      {
        q: 'นิฟาสนาน 40 วันเสมอหรือไม่?',
        a: 'ไม่ 40 วันเป็นแหล่งอ้างอิงที่ใช้บ่อย แต่แหล่งอ้างอิงทางนิติศาสตร์อาจต่างกัน',
      },
      {
        q: 'ฉันควรทำอย่างไรหากเลือดหยุดก่อน 40 วัน?',
        a: 'การกลับมาปฏิบัติศาสนกิจขึ้นอยู่กับสัญญาณที่สังเกตได้และแหล่งอ้างอิงทางศาสนาที่ปฏิบัติตาม',
      },
      {
        q: 'ถ้าเลือดออกต่อเนื่องนานล่ะ?',
        a: 'หากเกินระยะเวลาสูงสุดที่ใช้ สถานะทางศาสนาของเลือดอาจเปลี่ยนไป: โปรดขอความเห็นจากผู้มีคุณวุฒิ',
      },
      {
        q: 'AWA บอกได้แน่ชัดหรือไม่ว่าเลือดของฉันยังเป็นนิฟาสอยู่?',
        a: 'ไม่ AWA ให้เครื่องหมายเพื่อการเรียนรู้ทั่วไปและไม่ออกฟัตวาหรือการตัดสินใจเฉพาะบุคคล',
      },
    ],
    alert3Title: 'เครื่องหมาย ไม่ใช่ฟัตวา',
    alert3Text: 'สถานการณ์ส่วนบุคคลอาจต่างกัน เมื่อสงสัย โปรดติดต่อผู้รู้ที่มีคุณวุฒิหรือองค์กรศาสนาที่ได้รับการยอมรับ',
    shareMessage: 'นิฟาสในการปฏิบัติศาสนกิจ — AWA',
  },
  vi: {
    badge: 'NIFAS (FIQH)',
    title: 'Nifas trong\nthực hành tôn giáo',
    metaDuration: '6 phút đọc',
    metaType: 'Câu hỏi thường gặp',
    metaLevel: 'Cơ bản',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Hiểu về nifas, thời gian, cầu nguyện, nhịn ăn và việc tiếp tục các hành vi thờ phượng sau khi sinh.',
    disclaimerTitle: 'Thông tin quan trọng',
    disclaimerText: 'Nội dung này hoàn toàn mang tính giáo dục. Các vấn đề tôn giáo cần được các học giả có thẩm quyền thẩm định. AWA không đưa ra fatwa hay phán quyết tôn giáo cá nhân hóa.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Nifas là gì?',
      'Thời gian của nó theo các tham chiếu luật học',
      'Cầu nguyện trong thời gian nifas',
      'Nhịn ăn trong thời gian nifas',
      'Thanh tẩy và tiếp tục các hành vi thờ phượng',
      'Câu hỏi thường gặp',
    ],
    section1Body: 'Trong thực hành tôn giáo, nifas chỉ giai đoạn liên quan đến việc ra máu sau khi sinh. Sản dịch mô tả khía cạnh y học và sinh lý của việc ra máu này; nifas là sự phân loại tôn giáo của nó. Hai khái niệm này không nên bị nhầm lẫn.',
    tip1Title: 'Điểm chính cần nhớ',
    tip1Text: 'AWA cố ý tách riêng thông tin y học về sản dịch với các dấu mốc tôn giáo về nifas.',
    question1: 'Nifas kéo dài bao lâu?',
    section2Body: 'Thời gian tối đa có thể khác nhau tùy theo trường phái luật học hoặc nguồn tham chiếu tôn giáo được theo. 40 ngày là một tham chiếu thường được sử dụng, mà AWA không trình bày như một quy tắc phổ quát.',
    tip2Title: 'Một dấu mốc thường được sử dụng',
    tip2Text: 'Một tham chiếu thường được sử dụng là 40 ngày, nhưng AWA không trình bày con số này như chân lý duy nhất cho mọi trường phái luật học. Hãy theo nguồn tham chiếu tôn giáo mà bạn đã chọn.',
    question2: 'Tôi có phải cầu nguyện trong thời gian nifas không?',
    section3Body: 'Trong một giai đoạn được công nhận là nifas theo nguồn tham chiếu được theo, việc cầu nguyện nghi lễ được tạm ngưng. AWA không tự động phân loại tình trạng ra máu và không đưa ra quyết định cá nhân hóa. Không có bộ đếm buổi cầu nguyện bị bỏ lỡ nào được thêm cho giai đoạn này.',
    question3: 'Tôi có thể nhịn ăn trong thời gian nifas không?',
    section4Body: 'Việc nhịn ăn bắt buộc không được thực hiện trong giai đoạn được công nhận là nifas. Các ngày liên quan sau đó được xử lý bằng việc bù lại phù hợp, theo nguồn tham chiếu được theo.',
    tip3Title: 'Sắp xếp, mà không quyết định',
    tip3Text: 'AWA có thể giúp bạn theo dõi hoặc sắp xếp các ngày liên quan, mà không đưa ra quyết định tôn giáo cá nhân hóa.',
    section5Body: 'Việc tiếp tục phụ thuộc vào các dấu hiệu quan sát được và nguồn tham chiếu tôn giáo được theo.',
    steps: [
      'Quan sát việc ra máu kết thúc',
      'Thực hiện thanh tẩy nghi lễ',
      'Tiếp tục các hành vi thờ phượng liên quan',
    ],
    alert2Title: 'Khi nghi ngờ',
    alert2Text: 'Nếu việc ra máu kéo dài vượt quá thời gian tối đa mà nguồn tham chiếu được theo chấp nhận, tình trạng tôn giáo của nó có thể thay đổi. Nên có ý kiến của người có chuyên môn.',
    faq: [
      {
        q: 'Nifas có luôn kéo dài 40 ngày không?',
        a: 'Không. 40 ngày là một tham chiếu thường được sử dụng, nhưng các tham chiếu luật học có thể khác nhau.',
      },
      {
        q: 'Tôi nên làm gì nếu việc ra máu dừng trước 40 ngày?',
        a: 'Việc tiếp tục các hành vi thờ phượng phụ thuộc vào các dấu hiệu quan sát được và nguồn tham chiếu tôn giáo được theo.',
      },
      {
        q: 'Nếu việc ra máu tiếp diễn lâu thì sao?',
        a: 'Nếu nó vượt quá thời gian tối đa được chấp nhận, tình trạng tôn giáo của nó có thể thay đổi: hãy hỏi ý kiến người có chuyên môn.',
      },
      {
        q: 'AWA có thể cho biết chính xác việc ra máu của tôi có còn là nifas không?',
        a: 'Không. AWA cung cấp các dấu mốc giáo dục chung và không đưa ra fatwa hay quyết định cá nhân hóa.',
      },
    ],
    alert3Title: 'Một dấu mốc, không phải fatwa',
    alert3Text: 'Hoàn cảnh cá nhân có thể khác nhau. Khi nghi ngờ, hãy liên hệ một học giả có thẩm quyền hoặc một tổ chức tôn giáo được công nhận.',
    shareMessage: 'Nifas trong thực hành tôn giáo — AWA',
  },
  uz: {
    badge: 'NIFOS (FIQH)',
    title: 'Diniy amaliyotda\nnifos',
    metaDuration: '6 daq oʻqish',
    metaType: 'Savol-javob',
    metaLevel: 'Boshlangʻich',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Nifosni, uning davomiyligini, namoz, roʻza va tugʻruqdan keyin ibodatlarning qayta boshlanishini tushunish.',
    disclaimerTitle: 'Muhim maʼlumot',
    disclaimerText: 'Bu kontent faqat taʼlimiy xarakterga ega. Diniy savollarni malakali ulamolar bilan tasdiqlash kerak. AWA fatvo yoki shaxsiy diniy hukm chiqarmaydi.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Nifos nima?',
      'Uning fiqhiy manbalarga koʻra davomiyligi',
      'Nifos paytida namoz',
      'Nifos paytida roʻza',
      'Poklanish va ibodatlarning qayta boshlanishi',
      'Koʻp beriladigan savollar',
    ],
    section1Body: 'Diniy amaliyotda nifos tugʻruqdan keyingi qon ketishi bilan bogʻliq davrni bildiradi. Lohiya bu qon ketishining tibbiy va fiziologik jihatini tasvirlaydi; nifos esa uning diniy tasnifi. Bu ikki tushunchani aralashtirmaslik kerak.',
    tip1Title: 'Asosiy xulosa',
    tip1Text: 'AWA lohiya haqidagi tibbiy maʼlumotni nifos haqidagi diniy belgilardan ataylab ajratadi.',
    question1: 'Nifos qancha davom etadi?',
    section2Body: 'Maksimal davomiylik fiqhiy maktabga yoki amal qilinadigan diniy manbaga qarab farq qilishi mumkin. 40 kun tez-tez ishlatiladigan tayanch, ammo AWA uni universal qoida sifatida taqdim etmaydi.',
    tip2Title: 'Keng ishlatiladigan belgi',
    tip2Text: 'Tez-tez ishlatiladigan tayanch — 40 kun, lekin AWA bu raqamni barcha fiqhiy maktablar uchun yagona haqiqat sifatida taqdim etmaydi. Oʻzingiz tanlagan diniy manbaga amal qiling.',
    question2: 'Nifos paytida namoz oʻqishim kerakmi?',
    section3Body: 'Amal qilinadigan manbaga koʻra nifos deb tan olingan davrda ritual namoz toʻxtatiladi. AWA qon ketishini avtomatik tasniflamaydi va shaxsiy qaror bermaydi. Bu davr uchun oʻtkazib yuborilgan namoz hisoblagichi qoʻshilmaydi.',
    question3: 'Nifos paytida roʻza tutsam boʻladimi?',
    section4Body: 'Farz roʻza nifos deb tan olingan davrda tutilmaydi. Tegishli kunlar amal qilinadigan manbaga koʻra mos qazo orqali hal qilinadi.',
    tip3Title: 'Tartibga solish, hukm chiqarmasdan',
    tip3Text: 'AWA tegishli kunlarni kuzatib borishga yoki tartibga solishga yordam berishi mumkin, shaxsiy diniy qaror chiqarmasdan.',
    section5Body: 'Qayta boshlash kuzatilgan belgilarga va amal qilinadigan diniy manbaga bogʻliq.',
    steps: [
      'Qon ketishining tugashini kuzating',
      'Ritual poklanishni bajaring',
      'Tegishli ibodatlarni qayta boshlang',
    ],
    alert2Title: 'Shubha boʻlsa',
    alert2Text: 'Agar qon ketishi amal qilinadigan manba qabul qilgan maksimal davomiylikdan oshib davom etsa, uning diniy holati oʻzgarishi mumkin. Malakali fikr tavsiya etiladi.',
    faq: [
      {
        q: 'Nifos har doim 40 kun davom etadimi?',
        a: 'Yoʻq. 40 kun tez-tez ishlatiladigan tayanch, ammo fiqhiy manbalar farq qilishi mumkin.',
      },
      {
        q: 'Qon ketishi 40 kundan oldin toʻxtasa nima qilish kerak?',
        a: 'Ibodatlarni qayta boshlash kuzatilgan belgilarga va amal qilinadigan diniy manbaga bogʻliq.',
      },
      {
        q: 'Qon ketishi uzoq davom etsa-chi?',
        a: 'Agar u qabul qilingan maksimal davomiylikdan oshsa, uning diniy holati oʻzgarishi mumkin: malakali fikr soʻrang.',
      },
      {
        q: 'AWA qon ketishim hali nifosmi yoki yoʻqligini aniq ayta oladimi?',
        a: 'Yoʻq. AWA umumiy taʼlimiy belgilarni beradi va fatvo yoki shaxsiy qaror chiqarmaydi.',
      },
    ],
    alert3Title: 'Belgi, fatvo emas',
    alert3Text: 'Shaxsiy vaziyatlar farq qilishi mumkin. Shubha boʻlsa, malakali olimga yoki tan olingan diniy tashkilotga murojaat qiling.',
    shareMessage: 'Diniy amaliyotda nifos — AWA',
  },
  az: {
    badge: 'NİFAS (FİQH)',
    title: 'Dini təcrübədə\nnifas',
    metaDuration: '6 dəq oxu',
    metaType: 'FAQ',
    metaLevel: 'Başlanğıc',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Nifası, onun müddətini, namazı, orucu və doğuşdan sonra ibadət aktlarının bərpasını anlamaq.',
    disclaimerTitle: 'Vacib məlumat',
    disclaimerText: 'Bu məzmun tamamilə təhsil xarakterlidir. Dini suallar səlahiyyətli alimlər tərəfindən təsdiqlənməlidir. AWA fətva və ya fərdi dini hökmlər vermir.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'Nifas nədir?',
      'Hüquqi istinadlara görə onun müddəti',
      'Nifas zamanı namaz',
      'Nifas zamanı oruc',
      'Paklanma və ibadət aktlarının bərpası',
      'Tez-tez verilən suallar',
    ],
    section1Body: 'Dini təcrübədə nifas doğuşdan sonrakı qanaxma ilə bağlı dövrə deyilir. Loxiya bu qanaxmanın tibbi və fizioloji aspektini təsvir edir; nifas isə onun dini təsnifatıdır. Bu iki anlayış qarışdırılmamalıdır.',
    tip1Title: 'Əsas nəticə',
    tip1Text: 'AWA loxiya barədə tibbi məlumatı nifas barədə dini göstəricilərdən qəsdən ayırır.',
    question1: 'Nifas nə qədər davam edir?',
    section2Body: 'Maksimum müddət əməl edilən hüquq məktəbindən və ya dini istinaddan asılı olaraq dəyişə bilər. 40 gün tez-tez istifadə olunan istinaddır, lakin AWA bunu universal qayda kimi təqdim etmir.',
    tip2Title: 'Tez-tez istifadə olunan göstərici',
    tip2Text: 'Tez-tez istifadə olunan istinad 40 gündür, lakin AWA bu rəqəmi bütün hüquq məktəbləri üçün yeganə həqiqət kimi təqdim etmir. Seçdiyiniz dini istinada əməl edin.',
    question2: 'Nifas zamanı namaz qılmalıyam?',
    section3Body: 'Əməl edilən istinada görə nifas kimi tanınan dövrdə ritual namaz dayandırılır. AWA qanaxmanı avtomatik təsnif etmir və fərdi qərar vermir. Bu dövr üçün buraxılmış namazların heç bir sayğacı əlavə edilmir.',
    question3: 'Nifas zamanı oruc tuta bilərəmmi?',
    section4Body: 'Vacib oruc nifas kimi tanınan dövrdə tutulmur. Aidiyyatı olan günlər sonra əməl edilən istinada uyğun olaraq müvafiq qəza ilə həll olunur.',
    tip3Title: 'Qərar vermədən təşkil etmək',
    tip3Text: 'AWA fərdi dini qərar vermədən aidiyyatı olan günləri izləməyə və ya təşkil etməyə kömək edə bilər.',
    section5Body: 'Bərpa müşahidə olunan əlamətlərdən və əməl edilən dini istinaddan asılıdır.',
    steps: [
      'Qanaxmanın sonunu müşahidə edin',
      'Ritual paklanmanı yerinə yetirin',
      'Aidiyyatı olan ibadət aktlarını bərpa edin',
    ],
    alert2Title: 'Şübhə olarsa',
    alert2Text: 'Qanaxma əməl edilən istinadın qəbul etdiyi maksimum müddətdən artıq davam edərsə, onun dini statusu dəyişə bilər. Səlahiyyətli fikir tövsiyə olunur.',
    faq: [
      {
        q: 'Nifas həmişə 40 gün davam edir?',
        a: 'Xeyr. 40 gün tez-tez istifadə olunan istinaddır, lakin hüquqi istinadlar fərqlənə bilər.',
      },
      {
        q: 'Qanaxma 40 gündən əvvəl dayanarsa, nə etməliyəm?',
        a: 'İbadət aktlarının bərpası müşahidə olunan əlamətlərdən və əməl edilən dini istinaddan asılıdır.',
      },
      {
        q: 'Qanaxma uzun müddət davam edərsə?',
        a: 'O, qəbul edilmiş maksimum müddəti keçərsə, onun dini statusu dəyişə bilər: səlahiyyətli fikir soruşun.',
      },
      {
        q: 'AWA qanaxmamın hələ də nifas olub-olmadığını dəqiq deyə bilərmi?',
        a: 'Xeyr. AWA ümumi təhsil göstəriciləri təqdim edir və fətva və ya fərdi qərar vermir.',
      },
    ],
    alert3Title: 'Göstərici, fətva deyil',
    alert3Text: 'Şəxsi vəziyyətlər fərqli ola bilər. Şübhə olarsa, səlahiyyətli alimə və ya tanınmış dini təşkilata müraciət edin.',
    shareMessage: 'Dini təcrübədə nifas — AWA',
  },
  ka: {
    badge: 'ნიფასი (ფიქჰი)',
    title: 'ნიფასი\nრელიგიურ პრაქტიკაში',
    metaDuration: '6 წთ საკითხავი',
    metaType: 'ხშირი კითხვები',
    metaLevel: 'დამწყები',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'ნიფასის, მისი ხანგრძლივობის, ლოცვის, მარხვისა და მშობიარობის შემდეგ ღვთისმსახურების აქტების განახლების გაგება.',
    disclaimerTitle: 'მნიშვნელოვანი ინფორმაცია',
    disclaimerText: 'ეს შინაარსი წმინდა საგანმანათლებლოა. რელიგიური საკითხები კვალიფიციურ მეცნიერებთან უნდა დადასტურდეს. AWA არ გასცემს ფეტვებს ან პერსონალიზებულ რელიგიურ განაჩენს.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'რა არის ნიფასი?',
      'მისი ხანგრძლივობა სამართლებრივი წყაროების მიხედვით',
      'ლოცვა ნიფასის დროს',
      'მარხვა ნიფასის დროს',
      'განწმენდა და ღვთისმსახურების აქტების განახლება',
      'ხშირად დასმული კითხვები',
    ],
    section1Body: 'რელიგიურ პრაქტიკაში ნიფასი ნიშნავს მშობიარობის შემდგომ სისხლდენასთან დაკავშირებულ პერიოდს. ლოხია ამ სისხლდენის სამედიცინო და ფიზიოლოგიურ ასპექტს აღწერს; ნიფასი მისი რელიგიური კლასიფიკაციაა. ეს ორი ცნება არ უნდა აგვერიოს.',
    tip1Title: 'მთავარი დასკვნა',
    tip1Text: 'AWA განზრახ ჰყოფს ლოხიის შესახებ სამედიცინო ინფორმაციას ნიფასის შესახებ რელიგიური მარკერებისგან.',
    question1: 'რამდენ ხანს გრძელდება ნიფასი?',
    section2Body: 'მაქსიმალური ხანგრძლივობა შეიძლება განსხვავდებოდეს მიყოლილი სამართლებრივი სკოლის ან რელიგიური წყაროს მიხედვით. 40 დღე ხშირად გამოყენებული საორიენტაციო წერტილია, თუმცა AWA მას უნივერსალურ წესად არ წარმოადგენს.',
    tip2Title: 'ხშირად გამოყენებული მარკერი',
    tip2Text: 'ხშირად გამოყენებული საორიენტაციო წერტილია 40 დღე, მაგრამ AWA ამ რიცხვს ყველა სამართლებრივი სკოლისთვის ერთადერთ ჭეშმარიტებად არ წარმოადგენს. მიჰყევით თქვენ მიერ არჩეულ რელიგიურ წყაროს.',
    question2: 'უნდა ვილოცო ნიფასის დროს?',
    section3Body: 'პერიოდის განმავლობაში, რომელიც მიყოლილი წყაროს მიხედვით ნიფასად არის აღიარებული, რიტუალური ლოცვა შეჩერებულია. AWA სისხლდენას ავტომატურად არ აკლასიფიცირებს და პერსონალიზებულ გადაწყვეტილებას არ იძლევა. ამ პერიოდისთვის გამოტოვებული ლოცვების მთვლელი არ ემატება.',
    question3: 'შემიძლია მარხვა ნიფასის დროს?',
    section4Body: 'სავალდებულო მარხვა არ სრულდება პერიოდის განმავლობაში, რომელიც ნიფასად არის აღიარებული. შესაბამისი დღეები შემდეგ სათანადო ანაზღაურებით იმართება, მიყოლილი წყაროს მიხედვით.',
    tip3Title: 'მოწესრიგება, გადაწყვეტილების გარეშე',
    tip3Text: 'AWA-ს შეუძლია დაგეხმაროთ შესაბამისი დღეების აღრიცხვასა ან მოწესრიგებაში, პერსონალიზებული რელიგიური გადაწყვეტილების გარეშე.',
    section5Body: 'განახლება დამოკიდებულია დაკვირვებულ ნიშნებზე და მიყოლილ რელიგიურ წყაროზე.',
    steps: [
      'დააკვირდით სისხლდენის დასრულებას',
      'შეასრულეთ რიტუალური განწმენდა',
      'განაახლეთ შესაბამისი ღვთისმსახურების აქტები',
    ],
    alert2Title: 'ეჭვის შემთხვევაში',
    alert2Text: 'თუ სისხლდენა მიყოლილი წყაროს მიერ მიღებულ მაქსიმალურ ხანგრძლივობას აღემატება, მისი რელიგიური სტატუსი შეიძლება შეიცვალოს. რეკომენდებულია კვალიფიციური აზრი.',
    faq: [
      {
        q: 'ნიფასი ყოველთვის 40 დღე გრძელდება?',
        a: 'არა. 40 დღე ხშირად გამოყენებული საორიენტაციო წერტილია, მაგრამ სამართლებრივი წყაროები შეიძლება განსხვავდებოდეს.',
      },
      {
        q: 'რა გავაკეთო, თუ სისხლდენა 40 დღემდე წყდება?',
        a: 'ღვთისმსახურების აქტების განახლება დამოკიდებულია დაკვირვებულ ნიშნებზე და მიყოლილ რელიგიურ წყაროზე.',
      },
      {
        q: 'რა მოხდება, თუ სისხლდენა დიდხანს გრძელდება?',
        a: 'თუ ის მიღებულ მაქსიმალურ ხანგრძლივობას აღემატება, მისი რელიგიური სტატუსი შეიძლება შეიცვალოს: ითხოვეთ კვალიფიციური აზრი.',
      },
      {
        q: 'შეუძლია AWA-ს ზუსტად თქვას, არის თუ არა ჩემი სისხლდენა კვლავ ნიფასი?',
        a: 'არა. AWA გთავაზობთ ზოგად საგანმანათლებლო მარკერებს და არ გასცემს ფეტვას ან პერსონალიზებულ გადაწყვეტილებას.',
      },
    ],
    alert3Title: 'მარკერი და არა ფეტვა',
    alert3Text: 'პირადი სიტუაციები შეიძლება განსხვავდებოდეს. ეჭვის შემთხვევაში მიმართეთ კვალიფიციურ მეცნიერს ან აღიარებულ რელიგიურ ორგანიზაციას.',
    shareMessage: 'ნიფასი რელიგიურ პრაქტიკაში — AWA',
  },
  hy: {
    badge: 'ՆԻՖԱՍ (ՖԻՔՀ)',
    title: 'Նիֆասը\nկրոնական պրակտիկայում',
    metaDuration: '6 ր կարդալու համար',
    metaType: 'ՀՏՀ',
    metaLevel: 'Սկսնակ',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Հասկանալ նիֆասը, դրա տևողությունը, աղոթքը, պահքը և ծննդաբերությունից հետո պաշտամունքային գործողությունների վերսկսումը:',
    disclaimerTitle: 'Կարևոր տեղեկություն',
    disclaimerText: 'Այս բովանդակությունը զուտ կրթական է: Կրոնական հարցերը պետք է վավերացվեն որակավորված գիտնականների կողմից: AWA-ն ֆեթվաներ կամ անհատականացված կրոնական դատավճիռներ չի տալիս:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Ի՞նչ է նիֆասը',
      'Դրա տևողությունը՝ ըստ իրավագիտական հղումների',
      'Աղոթք նիֆասի ընթացքում',
      'Պահք նիֆասի ընթացքում',
      'Մաքրագործում և պաշտամունքային գործողությունների վերսկսում',
      'Հաճախակի տրվող հարցեր',
    ],
    section1Body: 'Կրոնական պրակտիկայում նիֆասը նշանակում է ծննդաբերությունից հետո արյունահոսության հետ կապված ժամանակահատված: Լոխիան նկարագրում է այս արյունահոսության բժշկական և ֆիզիոլոգիական կողմը. նիֆասը դրա կրոնական դասակարգումն է: Այս երկու հասկացությունները չպետք է շփոթվեն:',
    tip1Title: 'Հիմնական եզրակացություն',
    tip1Text: 'AWA-ն միտումնավոր առանձնացնում է լոխիայի մասին բժշկական տեղեկությունը նիֆասի մասին կրոնական ուղենիշներից:',
    question1: 'Որքա՞ն է տևում նիֆասը',
    section2Body: 'Առավելագույն տևողությունը կարող է տարբերվել՝ կախված իրավագիտական դպրոցից կամ հետևվող կրոնական հղումից: 40 օրը հաճախ օգտագործվող հղում է, բայց AWA-ն այն չի ներկայացնում որպես համընդհանուր կանոն:',
    tip2Title: 'Հաճախ օգտագործվող ուղենիշ',
    tip2Text: 'Հաճախ օգտագործվող հղում է 40 օրը, սակայն AWA-ն այս թիվը չի ներկայացնում որպես միակ ճշմարտություն բոլոր իրավագիտական դպրոցների համար: Հետևեք ձեր ընտրած կրոնական հղմանը:',
    question2: 'Պե՞տք է աղոթել նիֆասի ընթացքում',
    section3Body: 'Հետևվող հղմանը համապատասխան՝ նիֆաս ճանաչված ժամանակահատվածում ծիսական աղոթքը կասեցվում է: AWA-ն ինքնաբերաբար չի դասակարգում արյունահոսությունը և անհատականացված որոշում չի տալիս: Այս ժամանակահատվածի համար բաց թողնված աղոթքների հաշվիչ չի ավելացվում:',
    question3: 'Կարո՞ղ եմ պահք պահել նիֆասի ընթացքում',
    section4Body: 'Պարտադիր պահքը չի պահվում նիֆաս ճանաչված ժամանակահատվածում: Համապատասխան օրերը այնուհետև մշակվում են պատշաճ փոխհատուցմամբ՝ ըստ հետևվող հղման:',
    tip3Title: 'Կազմակերպել՝ առանց որոշելու',
    tip3Text: 'AWA-ն կարող է օգնել ձեզ հետևել կամ կազմակերպել համապատասխան օրերը՝ առանց անհատականացված կրոնական որոշում տալու:',
    section5Body: 'Վերսկսումը կախված է դիտարկված նշաններից և հետևվող կրոնական հղումից:',
    steps: [
      'Դիտարկեք արյունահոսության ավարտը',
      'Կատարեք ծիսական մաքրագործումը',
      'Վերսկսեք համապատասխան պաշտամունքային գործողությունները',
    ],
    alert2Title: 'Կասկածի դեպքում',
    alert2Text: 'Եթե արյունահոսությունը շարունակվում է հետևվող հղման ընդունած առավելագույն տևողությունից ավելի, դրա կրոնական կարգավիճակը կարող է փոխվել: Խորհուրդ է տրվում որակավորված կարծիք:',
    faq: [
      {
        q: 'Նիֆասը միշտ 40 օր տևո՞ւմ է',
        a: 'Ոչ: 40 օրը հաճախ օգտագործվող հղում է, սակայն իրավագիտական հղումները կարող են տարբերվել:',
      },
      {
        q: 'Ի՞նչ անել, եթե արյունահոսությունը դադարում է 40 օրից առաջ',
        a: 'Պաշտամունքային գործողությունների վերսկսումը կախված է դիտարկված նշաններից և հետևվող կրոնական հղումից:',
      },
      {
        q: 'Ի՞նչ անել, եթե արյունահոսությունը շարունակվում է երկար ժամանակ',
        a: 'Եթե այն գերազանցում է ընդունած առավելագույն տևողությունը, դրա կրոնական կարգավիճակը կարող է փոխվել. խնդրեք որակավորված կարծիք:',
      },
      {
        q: 'Կարո՞ղ է AWA-ն ճշգրիտ ասել, թե արդյոք իմ արյունահոսությունը դեռ նիֆաս է',
        a: 'Ոչ: AWA-ն տալիս է ընդհանուր կրթական ուղենիշներ և չի տալիս ֆեթվա կամ անհատականացված որոշում:',
      },
    ],
    alert3Title: 'Ուղենիշ, ոչ թե ֆեթվա',
    alert3Text: 'Անձնական իրավիճակները կարող են տարբերվել: Կասկածի դեպքում դիմեք որակավորված գիտնականի կամ ճանաչված կրոնական կազմակերպության:',
    shareMessage: 'Նիֆասը կրոնական պրակտիկայում — AWA',
  },
  tg: {
    badge: 'НИФОС (ФИҚҲ)',
    title: 'Нифос дар\nамалияи динӣ',
    metaDuration: '6 дақ барои хондан',
    metaType: 'Саволу ҷавоб',
    metaLevel: 'Ибтидоӣ',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Фаҳмидани нифос, давомнокии он, намоз, рӯза ва аз сар гирифтани амалҳои ибодат пас аз таваллуд.',
    disclaimerTitle: 'Маълумоти муҳим',
    disclaimerText: 'Ин мазмун комилан таълимист. Масъалаҳои динӣ бояд аз ҷониби олимони салоҳиятдор тасдиқ карда шаванд. AWA фатво ё ҳукмҳои шахсии динӣ намедиҳад.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Нифос чист?',
      'Давомнокии он аз рӯи манбаъҳои фиқҳӣ',
      'Намоз ҳангоми нифос',
      'Рӯза ҳангоми нифос',
      'Покшавӣ ва аз сар гирифтани амалҳои ибодат',
      'Саволҳои зуд-зуд додашаванда',
    ],
    section1Body: 'Дар амалияи динӣ нифос давраеро мефаҳмонад, ки бо хунравии пас аз таваллуд алоқаманд аст. Лохия ҷанбаи тиббӣ ва физиологии ин хунравиро тавсиф мекунад; нифос таснифи динии он аст. Ин ду мафҳумро набояд омехта кард.',
    tip1Title: 'Хулосаи асосӣ',
    tip1Text: 'AWA ба таври ҳадафмандона маълумоти тиббӣ дар бораи лохияро аз нишонаҳои динӣ дар бораи нифос ҷудо мекунад.',
    question1: 'Нифос чӣ қадар давом мекунад?',
    section2Body: 'Давомнокии ҳадди аксар вобаста ба мазҳаби фиқҳӣ ё манбаи динии пайравишаванда метавонад гуногун бошад. 40 рӯз нишонаи зуд-зуд истифодашаванда аст, бидуни он ки AWA онро ҳамчун қоидаи умумӣ пешниҳод кунад.',
    tip2Title: 'Нишонаи маъмулан истифодашаванда',
    tip2Text: 'Нишонаи зуд-зуд истифодашаванда 40 рӯз аст, вале AWA ин рақамро ҳамчун ягона ҳақиқат барои ҳамаи мазҳабҳои фиқҳӣ пешниҳод намекунад. Манбаи динии интихобкардаи худро пайравӣ кунед.',
    question2: 'Оё ман бояд ҳангоми нифос намоз бихонам?',
    section3Body: 'Ҳангоми даврае, ки мувофиқи манбаи пайравишаванда нифос шинохта мешавад, намози маросимӣ қатъ мегардад. AWA хунравиро худкор тасниф намекунад ва қарори шахсӣ намедиҳад. Барои ин давра ҳисобкунаки намозҳои аз даст рафта илова карда намешавад.',
    question3: 'Оё ман метавонам ҳангоми нифос рӯза бигирам?',
    section4Body: 'Рӯзаи фарз дар давраи нифос иҷро намешавад. Рӯзҳои марбутро он гоҳ тавассути қазои мувофиқ, мувофиқи манбаи пайравишаванда, ҷуброн мекунанд.',
    tip3Title: 'Ташкил кардан, бидуни ҳукм',
    tip3Text: 'AWA метавонад ба шумо кумак кунад рӯзҳои марбутро пайгирӣ ё ташкил кунед, бидуни додани қарори шахсии динӣ.',
    section5Body: 'Аз сар гирифтан ба нишонаҳои мушоҳидашуда ва манбаи динии пайравишаванда вобаста аст.',
    steps: [
      'Анҷоми хунравиро мушоҳида кунед',
      'Покшавии маросимиро иҷро кунед',
      'Амалҳои ибодати марбутро аз сар гиред',
    ],
    alert2Title: 'Дар сурати шубҳа',
    alert2Text: 'Агар хунравӣ аз ҳадди аксари давомнокии аз ҷониби манбаи пайравишаванда қабулшуда зиёд идома ёбад, мақоми динии он метавонад тағйир ёбад. Назари салоҳиятдор тавсия дода мешавад.',
    faq: [
      {
        q: 'Оё нифос ҳамеша 40 рӯз давом мекунад?',
        a: 'Не. 40 рӯз нишонаи зуд-зуд истифодашаванда аст, вале манбаъҳои фиқҳӣ метавонанд фарқ кунанд.',
      },
      {
        q: 'Агар хунравӣ пеш аз 40 рӯз қатъ шавад, чӣ кор кунам?',
        a: 'Аз сар гирифтани амалҳои ибодат ба нишонаҳои мушоҳидашуда ва манбаи динии пайравишаванда вобаста аст.',
      },
      {
        q: 'Агар хунравӣ муддати дароз идома ёбад, чӣ?',
        a: 'Агар он аз ҳадди аксари қабулшуда зиёд шавад, мақоми динии он метавонад тағйир ёбад: назари салоҳиятдор пурсед.',
      },
      {
        q: 'Оё AWA метавонад дақиқ бигӯяд, ки оё хунравии ман ҳанӯз нифос аст?',
        a: 'Не. AWA нишонаҳои умумии таълимӣ медиҳад ва фатво ё қарори шахсӣ намедиҳад.',
      },
    ],
    alert3Title: 'Нишона, на фатво',
    alert3Text: 'Вазъиятҳои шахсӣ метавонанд гуногун бошанд. Дар сурати шубҳа, бо олими салоҳиятдор ё ташкилоти динии эътирофшуда тамос гиред.',
    shareMessage: 'Нифос дар амалияи динӣ — AWA',
  },
  ky: {
    badge: 'НИФАС (ФИКХ)',
    title: 'Диний практикадагы\nнифас',
    metaDuration: '6 мүн окуу',
    metaType: 'КБС',
    metaLevel: 'Баштоочу',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Нифасты, анын узактыгын, намазды, орозону жана төрөттөн кийин ибадаттарды улантууну түшүнүү.',
    disclaimerTitle: 'Маанилүү маалымат',
    disclaimerText: 'Бул мазмун таза билим берүү максатында. Диний суроолорду квалификациялуу окумуштуулар текшериши керек. AWA фатва же жекелештирилген диний чечимдерди чыгарбайт.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Нифас деген эмне?',
      'Анын узактыгы укуктук булактарга ылайык',
      'Нифас учурундагы намаз',
      'Нифас учурундагы орозо',
      'Тазалануу жана ибадаттарды улантуу',
      'Көп берилүүчү суроолор',
    ],
    section1Body: 'Диний практикада нифас төрөттөн кийинки кан кетүү менен байланышкан мезгилди билдирет. Лохия бул кан кетүүнүн медициналык жана физиологиялык жагын сүрөттөйт; нифас — анын диний классификациясы. Бул эки түшүнүктү чаташтырууга болбойт.',
    tip1Title: 'Негизги жыйынтык',
    tip1Text: 'AWA лохия жөнүндөгү медициналык маалыматты нифас жөнүндөгү диний белгилерден атайылап бөлөт.',
    question1: 'Нифас канча убакыт созулат?',
    section2Body: 'Максималдуу узактык ээрчилген фикх мектебине же диний шилтемеге жараша айырмаланышы мүмкүн. 40 күн көп колдонулган шилтеме, бирок AWA аны универсалдуу эреже катары көрсөтпөйт.',
    tip2Title: 'Көп колдонулган белги',
    tip2Text: 'Көп колдонулган шилтеме — 40 күн, бирок AWA бул санды бардык фикх мектептери үчүн бирден-бир чындык катары көрсөтпөйт. Өзүңүз тандаган диний шилтемени ээрчиңиз.',
    question2: 'Нифас учурунда намаз окушум керекпи?',
    section3Body: 'Ээрчилген шилтемеге ылайык нифас деп таанылган мезгилде ибадаттык намаз токтотулат. AWA кан кетүүнү автоматтык түрдө классификациялабайт жана жекелештирилген чечим бербейт. Бул мезгил үчүн өткөрүлгөн намаздардын эсептегичи кошулбайт.',
    question3: 'Нифас учурунда орозо кармасам болобу?',
    section4Body: 'Милдеттүү орозо нифас деп таанылган мезгилде кармалбайт. Тиешелүү күндөр андан кийин ээрчилген шилтемеге ылайык тийиштүү казо аркылуу жөнгө салынат.',
    tip3Title: 'Чечим чыгарбай уюштуруу',
    tip3Text: 'AWA жекелештирилген диний чечим чыгарбастан, тиешелүү күндөрдү көзөмөлдөөгө же уюштурууга жардам бере алат.',
    section5Body: 'Улантуу байкалган белгилерге жана ээрчилген диний шилтемеге көз каранды.',
    steps: [
      'Кан кетүүнүн аякташын байкаңыз',
      'Ибадаттык тазалануу жасаңыз',
      'Тиешелүү ибадаттарды улантыңыз',
    ],
    alert2Title: 'Күмөн болгондо',
    alert2Text: 'Эгер кан кетүү ээрчилген шилтеме кабыл алган максималдуу узактыктан ашып уланса, анын диний макамы өзгөрүшү мүмкүн. Квалификациялуу пикир сунушталат.',
    faq: [
      {
        q: 'Нифас ар дайым 40 күн созулабы?',
        a: 'Жок. 40 күн көп колдонулган шилтеме, бирок укуктук булактар айырмаланышы мүмкүн.',
      },
      {
        q: 'Кан кетүү 40 күнгө чейин токтосо эмне кылуу керек?',
        a: 'Ибадаттарды улантуу байкалган белгилерге жана ээрчилген диний шилтемеге көз каранды.',
      },
      {
        q: 'Кан кетүү узакка созулса эмне болот?',
        a: 'Эгер ал кабыл алынган максималдуу узактыктан ашса, анын диний макамы өзгөрүшү мүмкүн: квалификациялуу пикир сураңыз.',
      },
      {
        q: 'AWA менин кан кетүүм дагы эле нифас экенин так айта алабы?',
        a: 'Жок. AWA жалпы билим берүүчү белгилерди берет жана фатва же жекелештирилген чечим чыгарбайт.',
      },
    ],
    alert3Title: 'Белги, фатва эмес',
    alert3Text: 'Жеке абалдар айырмаланышы мүмкүн. Күмөн болсо, квалификациялуу окумуштууга же таанылган диний уюмга кайрылыңыз.',
    shareMessage: 'Диний практикадагы нифас — AWA',
  },
  tk: {
    badge: 'NIFAS (FIKH)',
    title: 'Dini tejribede\nnifas',
    metaDuration: '6 min okamak',
    metaType: 'KBS',
    metaLevel: 'Başlaýjy',
    metaValidated: 'Barlanan mazmun',
    intro: 'Nifasy, onuň dowamlylygyny, namazy, orazany we dograndan soň ybadatlaryň täzeden başlanmagyny düşünmek.',
    disclaimerTitle: 'Möhüm maglumat',
    disclaimerText: 'Bu mazmun diňe bilim berýär. Dini soraglary bilimli alymlar tassyklamaly. AWA fatwa ýa-da şahsylaşdyrylan dini hökümler bermeýär.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Nifas näme?',
      'Onuň hukuk çeşmelerine görä dowamlylygy',
      'Nifas wagtynda namaz',
      'Nifas wagtynda oraza',
      'Arassalanmak we ybadatlaryň täzeden başlamagy',
      'Köp berilýän soraglar',
    ],
    section1Body: 'Dini tejribede nifas dograndan soňky gan akma bilen baglanyşykly döwri aňladýar. Lohiýa bu gan akmanyň lukmançylyk we fiziologik tarapyny suratlandyrýar; nifas onuň dini toparlanmasy. Bu iki düşünjäni bulaşdyrmaly däl.',
    tip1Title: 'Esasy netije',
    tip1Text: 'AWA lohiýa barada lukmançylyk maglumatyny nifas barada dini belliklerden bilkastlaýyn aýyrýar.',
    question1: 'Nifas näçe wagt dowam edýär?',
    section2Body: 'Iň uly dowamlylyk hukuk mekdebine ýa-da eýerilýän dini çeşmä görä tapawutlanyp biler. 40 gün köplenç ulanylýan ýörelge, ýöne AWA muny umumy düzgün hökmünde görkezmeýär.',
    tip2Title: 'Köplenç ulanylýan bellik',
    tip2Text: 'Köplenç ulanylýan ýörelge 40 gün, ýöne AWA bu sanyň ähli hukuk mekdepleri üçin ýeke-täk hakykatdygyny görkezmeýär. Saýlan dini çeşmäňize eýeriň.',
    question2: 'Nifas wagtynda namaz okamalymy?',
    section3Body: 'Eýerilýän çeşma görä nifas hasaplanýan döwürde ritual namaz togtadylýar. AWA gan akmany awtomatiki toparlamaýar we şahsylaşdyrylan karar bermeýär. Bu döwür üçin sypdyrylan namaz sanawjysy goşulmaýar.',
    question3: 'Nifas wagtynda oraza tutup bilemmi?',
    section4Body: 'Borç oraza nifas hasaplanýan döwürde tutulmaýar. Degişli günler soňra eýerilýän çeşma görä laýyk dolmak arkaly çözülýär.',
    tip3Title: 'Karar bermän guramak',
    tip3Text: 'AWA şahsylaşdyrylan dini karar bermän, degişli günleri yzarlamaga ýa-da guramaga kömek edip biler.',
    section5Body: 'Täzeden başlamak synlanylan alamatlara we eýerilýän dini çeşma bagly.',
    steps: [
      'Gan akmanyň gutarýandygyny synlaň',
      'Ritual arassalanmagy ýerine ýetiriň',
      'Degişli ybadatlary täzeden başlaň',
    ],
    alert2Title: 'Şübhe bolanda',
    alert2Text: 'Gan akma eýerilýän çeşme tarapyndan kabul edilen iň uly dowamlylykdan geçip dowam etse, onuň dini ýagdaýy üýtgäp biler. Bilimli adamyň pikiri maslahat berilýär.',
    faq: [
      {
        q: 'Nifas hemişe 40 gün dowam edýärmi?',
        a: 'Ýok. 40 gün köplenç ulanylýan ýörelge, ýöne hukuk çeşmeleri tapawutlanyp biler.',
      },
      {
        q: 'Gan akma 40 günden öň kesilse, näme etmeli?',
        a: 'Ybadatlaryň täzeden başlamagy synlanylan alamatlara we eýerilýän dini çeşma bagly.',
      },
      {
        q: 'Gan akma uzak wagt dowam etse näme?',
        a: 'Ol kabul edilen iň uly dowamlylykdan geçse, onuň dini ýagdaýy üýtgäp biler: bilimli adamyň pikirini soraň.',
      },
      {
        q: 'AWA gan akmamyň henizem nifasdygyny takyk aýdyp bilermi?',
        a: 'Ýok. AWA umumy bilim beriji bellikleri berýär we fatwa ýa-da şahsylaşdyrylan karar bermeýär.',
      },
    ],
    alert3Title: 'Bellik, fatwa däl',
    alert3Text: 'Şahsy ýagdaýlar tapawutlanyp biler. Şübhe bolanda, bilimli alym ýa-da ykrar edilen dini guramaga ýüz tutuň.',
    shareMessage: 'Dini tejribede nifas — AWA',
  },
  ms: {
    badge: 'NIFAS (FIQH)',
    title: 'Nifas dalam\namalan agama',
    metaDuration: '6 min bacaan',
    metaType: 'Soalan Lazim',
    metaLevel: 'Permulaan',
    metaValidated: 'Kandungan disemak',
    intro: 'Memahami nifas, tempohnya, solat, puasa dan menyambung semula ibadah selepas bersalin.',
    disclaimerTitle: 'Maklumat penting',
    disclaimerText: 'Kandungan ini semata-mata bersifat pendidikan. Persoalan agama perlu disahkan oleh ulama yang layak. AWA tidak mengeluarkan fatwa atau hukum agama yang diperibadikan.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Apakah nifas?',
      'Tempohnya mengikut rujukan fiqh',
      'Solat semasa nifas',
      'Puasa semasa nifas',
      'Penyucian dan menyambung semula ibadah',
      'Soalan yang kerap ditanya',
    ],
    section1Body: 'Dalam amalan agama, nifas merujuk kepada tempoh yang berkaitan dengan pendarahan selepas bersalin. Lokia menerangkan aspek perubatan dan fisiologi pendarahan ini; nifas ialah klasifikasi agamanya. Kedua-dua konsep ini tidak boleh dikelirukan.',
    tip1Title: 'Perkara penting',
    tip1Text: 'AWA dengan sengaja memisahkan maklumat perubatan tentang lokia daripada penanda agama tentang nifas.',
    question1: 'Berapa lamakah nifas berlangsung?',
    section2Body: 'Tempoh maksimum boleh berbeza mengikut mazhab atau rujukan agama yang diikuti. 40 hari ialah rujukan yang kerap digunakan, tanpa dikemukakan oleh AWA sebagai peraturan sejagat.',
    tip2Title: 'Penanda yang lazim digunakan',
    tip2Text: 'Rujukan yang kerap digunakan ialah 40 hari, tetapi AWA tidak mengemukakan angka ini sebagai satu-satunya kebenaran bagi semua mazhab. Ikutilah rujukan agama yang telah anda pilih.',
    question2: 'Patutkah saya bersolat semasa nifas?',
    section3Body: 'Semasa tempoh yang diiktiraf sebagai nifas mengikut rujukan yang diikuti, solat ritual ditangguhkan. AWA tidak mengklasifikasikan pendarahan secara automatik dan tidak memberikan keputusan yang diperibadikan. Tiada pembilang solat yang terlepas ditambah untuk tempoh ini.',
    question3: 'Bolehkah saya berpuasa semasa nifas?',
    section4Body: 'Puasa wajib tidak dilaksanakan semasa tempoh yang diiktiraf sebagai nifas. Hari-hari yang berkenaan kemudiannya diuruskan melalui penggantian yang sesuai, mengikut rujukan yang diikuti.',
    tip3Title: 'Menyusun, tanpa memutuskan',
    tip3Text: 'AWA boleh membantu anda menjejaki atau menyusun hari-hari yang berkenaan, tanpa mengeluarkan keputusan agama yang diperibadikan.',
    section5Body: 'Penyambungan semula bergantung pada tanda yang diperhatikan dan rujukan agama yang diikuti.',
    steps: [
      'Perhatikan berakhirnya pendarahan',
      'Lakukan penyucian ritual',
      'Sambung semula ibadah yang berkenaan',
    ],
    alert2Title: 'Jika ragu-ragu',
    alert2Text: 'Jika pendarahan berterusan melepasi tempoh maksimum yang diterima pakai oleh rujukan yang diikuti, status agamanya mungkin berubah. Pendapat yang layak disyorkan.',
    faq: [
      {
        q: 'Adakah nifas sentiasa berlangsung 40 hari?',
        a: 'Tidak. 40 hari ialah rujukan yang kerap digunakan, tetapi rujukan fiqh boleh berbeza.',
      },
      {
        q: 'Apa yang perlu saya lakukan jika pendarahan berhenti sebelum 40 hari?',
        a: 'Penyambungan semula ibadah bergantung pada tanda yang diperhatikan dan rujukan agama yang diikuti.',
      },
      {
        q: 'Bagaimana jika pendarahan berterusan untuk tempoh yang lama?',
        a: 'Jika ia melebihi tempoh maksimum yang diterima pakai, status agamanya mungkin berubah: mintalah pendapat yang layak.',
      },
      {
        q: 'Bolehkah AWA mengatakan dengan tepat sama ada pendarahan saya masih nifas?',
        a: 'Tidak. AWA menyediakan penanda pendidikan umum dan tidak mengeluarkan fatwa atau keputusan yang diperibadikan.',
      },
    ],
    alert3Title: 'Satu penanda, bukan fatwa',
    alert3Text: 'Keadaan peribadi boleh berbeza. Jika ragu-ragu, hubungi ulama yang layak atau organisasi agama yang diiktiraf.',
    shareMessage: 'Nifas dalam amalan agama — AWA',
  },
  so: {
    badge: 'NIFAAS (FIQHI)',
    title: 'Nifaas cibaadada\ndhexdeeda',
    metaDuration: '6 daq akhris',
    metaType: 'FAQ',
    metaLevel: 'Bilow',
    metaValidated: 'Macluumaad la dib-u-eegay',
    intro: 'Fahamka nifaaska, muddadiisa, salaadda, soonka, iyo dib u bilaabista cibaadooyinka dhalmada ka dib.',
    disclaimerTitle: 'Macluumaad muhiim ah',
    disclaimerText: 'Macluumaadkani waa waxbarasho oo keliya. Su’aalaha diinta waa in ay xaqiijiyaan culimo xirfad leh. AWA ma soo saaro fatwooyin ama xukummo diineed oo shakhsi ah.',
    contentsTitle: 'Maqaalkan dhexdiisa',
    topics: [
      'Waa maxay nifaaska?',
      'Muddadiisa marka loo eego tixrac fiqhi',
      'Salaadda inta nifaas jiro',
      'Soonka inta nifaas jiro',
      'Nadiifinta iyo dib u bilaabista cibaadooyinka',
      'Su’aalaha inta badan la weydiiyo',
    ],
    section1Body: 'Cibaadada dhexdeeda, nifaaska waxay tilmaamaysaa muddada la xiriirta dhiigbaxa dhalmada ka dib. Lochia waxay sharxdaa dhinaca caafimaadka iyo jidh-dhiska ee dhiigbaxan; nifaas waa kala saarkiisa diineed. Labadan fikradood waa in aan la isku qaldin.',
    tip1Title: 'Qodob muhiim ah',
    tip1Text: 'AWA si ula kac ah ayuu u kala saaraa macluumaadka caafimaad ee lochia iyo calaamadaha diineed ee nifaaska.',
    question1: 'Intee in le’eg ayuu nifaaska socdaa?',
    section2Body: 'Muddada ugu badan way ku kala duwanaan kartaa iyadoo ku xiran dugsiga fiqhiga ama tixraaca diineed ee la raaco. 40 maalmood waa tixraac inta badan la isticmaalo, adigoon AWA u soo bandhigin inuu yahay xeer caalami ah.',
    tip2Title: 'Calaamad inta badan la isticmaalo',
    tip2Text: 'Tixraac inta badan la isticmaalo waa 40 maalmood, laakiin AWA ma soo bandhigo tirada inay tahay runta keliya ee dhammaan madaaris fiqhiga. Raac tixraaca diineed ee aad dooratay.',
    question2: 'Ma tukadaa inta nifaas jiro?',
    section3Body: 'Inta lagu jiro muddo la aqoonsaday inay nifaas tahay marka loo eego tixraaca la raaco, salaadda cibaadada waa la hakiyaa. AWA si toos ah uma kala saaro dhiigbaxa mana bixiyo go’aan shakhsi ah. Tiriye salaado la dhaafay looma darin muddadan.',
    question3: 'Ma soomi karaa inta nifaas jiro?',
    section4Body: 'Soonka waajibka ah lama qabto inta lagu jiro muddo la aqoonsaday inay nifaas tahay. Maalmaha khuseeya markaas waxaa lagu maamulaa soo celinta ku habboon, marka loo eego tixraaca la raaco.',
    tip3Title: 'Habayn, go’aan la’aan',
    tip3Text: 'AWA wuxuu kaa caawin karaa la socodka ama habaynta maalmaha khuseeya, isagoo aan soo saarin go’aan diineed oo shakhsi ah.',
    section5Body: 'Dib u bilaabistu waxay ku xiran tahay calaamadaha la arkay iyo tixraaca diineed ee la raaco.',
    steps: [
      'Indho-indheeyo dhammaadka dhiigbaxa',
      'Samee nadiifinta cibaadada',
      'Dib u bilow cibaadooyinka khuseeya',
    ],
    alert2Title: 'Haddii shaki jiro',
    alert2Text: 'Haddii dhiigbaxu sii socdo ka dib muddada ugu badan ee uu qaatay tixraaca la raaco, xaaladdiisa diineed waxay beddelmi kartaa. Ra’yi xirfad leh ayaa lagula talinayaa.',
    faq: [
      {
        q: 'Nifaaska mar walba ma socdaa 40 maalmood?',
        a: 'Maya. 40 maalmood waa tixraac inta badan la isticmaalo, laakiin tixraacyada fiqhigu way kala duwanaan karaan.',
      },
      {
        q: 'Maxaan sameeyaa haddii dhiigbaxu joogsado ka hor 40 maalmood?',
        a: 'Dib u bilaabista cibaadooyinku waxay ku xiran tahay calaamadaha la arkay iyo tixraaca diineed ee la raaco.',
      },
      {
        q: 'Maxaa dhacaya haddii dhiigbaxu waqti dheer sii socdo?',
        a: 'Haddii uu dhaafo muddada ugu badan ee la qaatay, xaaladdiisa diineed waxay beddelmi kartaa: weydiiso ra’yi xirfad leh.',
      },
      {
        q: 'AWA ma sheegi karaa si sax ah haddii dhiigbaxaygu weli yahay nifaas?',
        a: 'Maya. AWA wuxuu bixiyaa calaamado waxbarasho oo guud mana soo saaro fatwo ama go’aan shakhsi ah.',
      },
    ],
    alert3Title: 'Calaamad, ma aha fatwo',
    alert3Text: 'Xaaladaha shakhsi ahaaneed way kala duwanaan karaan. Haddii shaki jiro, la xiriir culimo xirfad leh ama hay’ad diineed la aqoonsan yahay.',
    shareMessage: 'Nifaas cibaadada dhexdeeda — AWA',
  },
  sw: {
    badge: 'NIFASI (FIQHI)',
    title: 'Nifasi katika\nibada',
    metaDuration: 'Dakika 6 za kusoma',
    metaType: 'Maswali na majibu',
    metaLevel: 'Mwanzo',
    metaValidated: 'Maudhui yaliyokaguliwa',
    intro: 'Kuelewa nifasi, muda wake, swala, saumu, na kuanza tena ibada baada ya kujifungua.',
    disclaimerTitle: 'Taarifa muhimu',
    disclaimerText: 'Maudhui haya ni ya kielimu tu. Masuala ya kidini yanapaswa kuthibitishwa na wanazuoni waliohitimu. AWA haitoi fatwa wala hukumu za kidini zilizobinafsishwa.',
    contentsTitle: 'Katika makala hii',
    topics: [
      'Nifasi ni nini?',
      'Muda wake kulingana na rejeo za kifiqhi',
      'Swala wakati wa nifasi',
      'Saumu wakati wa nifasi',
      'Kujitakasa na kuanza tena ibada',
      'Maswali yanayoulizwa mara kwa mara',
    ],
    section1Body: 'Katika ibada, nifasi inarejelea kipindi kinachohusiana na kutokwa damu baada ya kujifungua. Lochia inaeleza upande wa kitabibu na kifiziolojia wa kutokwa damu huku; nifasi ni uainishaji wake wa kidini. Dhana hizi mbili hazipaswi kuchanganywa.',
    tip1Title: 'Jambo kuu la kukumbuka',
    tip1Text: 'AWA inatenganisha kwa makusudi taarifa za kitabibu kuhusu lochia na alama za kidini kuhusu nifasi.',
    question1: 'Nifasi inadumu kwa muda gani?',
    section2Body: 'Muda wa juu zaidi unaweza kutofautiana kulingana na madhehebu ya fiqhi au rejeo la kidini linalofuatwa. Siku 40 ni rejeo linalotumiwa mara kwa mara, bila kuwasilishwa na AWA kuwa kanuni ya jumla.',
    tip2Title: 'Alama inayotumiwa kwa kawaida',
    tip2Text: 'Rejeo linalotumiwa mara kwa mara ni siku 40, lakini AWA haiwasilishi nambari hii kuwa ukweli pekee kwa madhehebu yote ya fiqhi. Fuata rejeo la kidini ulilochagua.',
    question2: 'Je, niswali wakati wa nifasi?',
    section3Body: 'Wakati wa kipindi kinachotambuliwa kuwa nifasi kulingana na rejeo linalofuatwa, swala ya kiibada imesitishwa. AWA haiainishi kutokwa damu kiotomatiki na haitoi uamuzi uliobinafsishwa. Hakuna kaunta ya swala zilizoachwa inayoongezwa kwa kipindi hiki.',
    question3: 'Je, naweza kufunga wakati wa nifasi?',
    section4Body: 'Saumu ya wajibu haifanywi wakati wa kipindi kinachotambuliwa kuwa nifasi. Siku husika kisha hushughulikiwa kupitia ulipaji unaofaa, kulingana na rejeo linalofuatwa.',
    tip3Title: 'Kupanga, bila kuamua',
    tip3Text: 'AWA inaweza kukusaidia kufuatilia au kupanga siku husika, bila kutoa uamuzi wa kidini uliobinafsishwa.',
    section5Body: 'Kuanza tena kunategemea dalili zilizoonekana na rejeo la kidini linalofuatwa.',
    steps: [
      'Chunguza mwisho wa kutokwa damu',
      'Fanya kujitakasa kwa kiibada',
      'Anza tena ibada husika',
    ],
    alert2Title: 'Ukiwa na shaka',
    alert2Text: 'Ikiwa kutokwa damu kunaendelea zaidi ya muda wa juu uliopitishwa na rejeo linalofuatwa, hadhi yake ya kidini inaweza kubadilika. Maoni ya mtu aliyehitimu yanapendekezwa.',
    faq: [
      {
        q: 'Je, nifasi hudumu siku 40 kila mara?',
        a: 'Hapana. Siku 40 ni rejeo linalotumiwa mara kwa mara, lakini rejeo za kifiqhi zinaweza kutofautiana.',
      },
      {
        q: 'Nifanye nini ikiwa kutokwa damu kunakoma kabla ya siku 40?',
        a: 'Kuanza tena ibada kunategemea dalili zilizoonekana na rejeo la kidini linalofuatwa.',
      },
      {
        q: 'Je, ikiwa kutokwa damu kunaendelea kwa muda mrefu?',
        a: 'Ikiwa kunazidi muda wa juu uliopitishwa, hadhi yake ya kidini inaweza kubadilika: omba maoni ya mtu aliyehitimu.',
      },
      {
        q: 'Je, AWA inaweza kusema hasa kama kutokwa damu kwangu bado ni nifasi?',
        a: 'Hapana. AWA inatoa alama za jumla za kielimu na haitoi fatwa wala uamuzi uliobinafsishwa.',
      },
    ],
    alert3Title: 'Alama, si fatwa',
    alert3Text: 'Hali binafsi zinaweza kutofautiana. Ukiwa na shaka, wasiliana na mwanazuoni aliyehitimu au shirika la kidini linalotambuliwa.',
    shareMessage: 'Nifasi katika ibada — AWA',
  },
  kk: {
    badge: 'НИФАС (ФИҚҺ)',
    title: 'Ғибадаттағы\nнифас',
    metaDuration: '6 мин оқу',
    metaType: 'ЖҚС',
    metaLevel: 'Бастауыш',
    metaValidated: 'Тексерілген мазмұн',
    intro: 'Нифасты, оның ұзақтығын, намазды, оразаны және босанғаннан кейін ғибадатты қайта бастауды түсіну.',
    disclaimerTitle: 'Маңызды ақпарат',
    disclaimerText: 'Бұл мазмұн тек білім беруге арналған. Діни сұрақтарды білікті ғалымдар растауы тиіс. AWA фатуа немесе жекелендірілген діни үкімдер бермейді.',
    contentsTitle: 'Осы мақалада',
    topics: [
      'Нифас дегеніміз не?',
      'Оның ұзақтығы фиқһ анықтамаларына сай',
      'Нифас кезіндегі намаз',
      'Нифас кезіндегі ораза',
      'Тазару және ғибадатты қайта бастау',
      'Жиі қойылатын сұрақтар',
    ],
    section1Body: 'Ғибадатта нифас босанғаннан кейінгі қан кетумен байланысты кезеңді білдіреді. Лохия бұл қан кетудің медициналық және физиологиялық жағын сипаттайды; нифас — оның діни жіктелуі. Бұл екі ұғымды араластыруға болмайды.',
    tip1Title: 'Негізгі қорытынды',
    tip1Text: 'AWA лохия туралы медициналық ақпаратты нифас туралы діни белгілерден әдейі бөліп көрсетеді.',
    question1: 'Нифас қанша уақытқа созылады?',
    section2Body: 'Ең ұзақ мерзім фиқһ мектебіне немесе ұстанатын діни анықтамаға қарай өзгеруі мүмкін. 40 күн — жиі қолданылатын анықтама, бірақ AWA оны әмбебап ереже ретінде ұсынбайды.',
    tip2Title: 'Жиі қолданылатын белгі',
    tip2Text: 'Жиі қолданылатын анықтама — 40 күн, бірақ AWA бұл көрсеткішті барлық фиқһ мектептері үшін жалғыз шындық ретінде ұсынбайды. Өзіңіз таңдаған діни анықтаманы ұстаныңыз.',
    question2: 'Нифас кезінде намаз оқуым керек пе?',
    section3Body: 'Ұсталатын анықтамаға сай нифас деп танылған кезеңде ғибадаттық намаз тоқтатылады. AWA қан кетуді автоматты түрде жіктемейді және жекелендірілген шешім бермейді. Бұл кезең үшін өткізіп алынған намаз санауышы қосылмайды.',
    question3: 'Нифас кезінде ораза ұстай аламын ба?',
    section4Body: 'Міндетті ораза нифас деп танылған кезеңде ұсталмайды. Сонда қатысты күндер ұсталатын анықтамаға сай тиісті қаза арқылы шешіледі.',
    tip3Title: 'Ұйымдастыру, шешім қабылдамау',
    tip3Text: 'AWA қатысты күндерді жекелендірілген діни шешім шығармай-ақ бақылауға немесе ұйымдастыруға көмектесе алады.',
    section5Body: 'Қайта бастау байқалған белгілерге және ұсталатын діни анықтамаға байланысты.',
    steps: [
      'Қан кетудің аяқталуын бақылаңыз',
      'Ғибадаттық тазаруды орындаңыз',
      'Қатысты ғибадаттарды қайта бастаңыз',
    ],
    alert2Title: 'Күмән туындаса',
    alert2Text: 'Қан кету ұсталатын анықтама қабылдаған ең ұзақ мерзімнен асып жалғасса, оның діни мәртебесі өзгеруі мүмкін. Білікті пікір ұсынылады.',
    faq: [
      {
        q: 'Нифас әрқашан 40 күнге созыла ма?',
        a: 'Жоқ. 40 күн — жиі қолданылатын анықтама, бірақ фиқһ анықтамалары әртүрлі болуы мүмкін.',
      },
      {
        q: 'Қан кету 40 күннен бұрын тоқтаса, не істеуім керек?',
        a: 'Ғибадаттарды қайта бастау байқалған белгілерге және ұсталатын діни анықтамаға байланысты.',
      },
      {
        q: 'Қан кету ұзақ уақыт жалғасса ше?',
        a: 'Ол қабылданған ең ұзақ мерзімнен асса, оның діни мәртебесі өзгеруі мүмкін: білікті пікір сұраңыз.',
      },
      {
        q: 'AWA менің қан кетуімнің әлі нифас екенін нақты айта ала ма?',
        a: 'Жоқ. AWA жалпы білім беру белгілерін ұсынады және фатуа немесе жекелендірілген шешім бермейді.',
      },
    ],
    alert3Title: 'Белгі, фатуа емес',
    alert3Text: 'Жеке жағдайлар әртүрлі болуы мүмкін. Күмән туындаса, білікті ғалымға немесе танылған діни ұйымға хабарласыңыз.',
    shareMessage: 'Ғибадаттағы нифас — AWA',
  },
  wo: {
    badge: 'NIFAS (FIQH)',
    title: 'Nifas ci\njëfu diine',
    metaDuration: '6 simili jàng',
    metaType: 'Laaj',
    metaLevel: 'Tàmbali',
    metaValidated: 'Mbind bu ñu seetlu',
    intro: 'Xam nifas, diiram, jàng, woor ak tàmbaliwaat ibaada yi ginnaaw jur.',
    disclaimerTitle: 'Xibaar bu am solo',
    disclaimerText: 'Mbind mii ngir njàng rekk la. Laaj yu diine war nañu ñu dëggal leen ak ay jàngalekat yu am kàttan. AWA du génne fatwa walla dogal yu diine yu sa bopp.',
    contentsTitle: 'Ci bind bii',
    topics: [
      'Lan mooy nifas?',
      'Diiram ci anam yu fiqh',
      'Jàng ci nifas',
      'Woor ci nifas',
      'Set ak tàmbaliwaat ibaada yi',
      'Laaj yu ñu bari',
    ],
    section1Body: 'Ci jëfu diine, nifas mooy jamono bu jëm ci deret ginnaaw jur. Lochia dafay wone pàrt bu wér ak bu fisiyoloji bu deret bii; nifas mooy xeetam bu diine. Ñaari xalaat yii war nañu bañ a jaaxal leen.',
    tip1Title: 'Li am solo',
    tip1Text: 'AWA dafay séddale ci yaatu xibaar yu wér ci lochia ak màndargay diine yu nifas.',
    question1: 'Ñaata la nifas di yàgg?',
    section2Body: 'Diir bu ëpp mën na wuute ci daara bu fiqh walla ci anam bu diine bi ñuy topp. 40 fan benn anam la bu ñu di jëfandikoo bu bari, te AWA du ko wone ni yoon bu bokk ci ñépp.',
    tip2Title: 'Benn màndarga bu ñuy jëfandikoo bu bari',
    tip2Text: 'Benn anam bu ñuy jëfandikoo bu bari mooy 40 fan, waaye AWA du wone lim bii ni benn dëgg ngir daara yépp yu fiqh. Topp ndigalu diine bi nga tànn.',
    question2: 'War naa jàng ci nifas?',
    section3Body: 'Ci jamono bu ñu xam ni nifas ci anam bi ñuy topp, jàngu diine dafay taxaw. AWA du jëfandikoo deret bu nekk ci boppam te du joxe benn dogal bu sa bopp. Amul limukaayu jàng bu ñu fàtte bu ñuy yokk ngir jamono jii.',
    question3: 'Mën naa woor ci nifas?',
    section4Body: 'Woor bu ñu war duñu ko def ci jamono bu ñu xam ni nifas. Fan yi ñu jëm ci dees na leen yor ci sottali bu méngoo, ci anam bi ñuy topp.',
    tip3Title: 'Tëral te dogal amul',
    tip3Text: 'AWA mën na la dimbli nga topp walla tëral fan yi ñu jëm ci, te du génne benn dogal bu diine bu sa bopp.',
    section5Body: 'Tàmbaliwaat dafay sukkandiku ci màndarga yi ñu gis ak anam bu diine bi ñuy topp.',
    steps: [
      'Seetlu jeexu deret bi',
      'Def set bu diine',
      'Tàmbaliwaat ibaada yi ñu jëm',
    ],
    alert2Title: 'Bu am xel-ñaar',
    alert2Text: 'Bu deret bi kontine ci kaw diir bu ëpp bi anam bi ñuy topp jàpp, anamu diine bi mën na soppiku. Benn ndigal bu am kàttan ñu digal ko.',
    faq: [
      {
        q: 'Nifas daa yàgg saa su ne 40 fan?',
        a: 'Déedéet. 40 fan benn anam la bu ñuy jëfandikoo bu bari, waaye anam yu fiqh yi mën nañu wuute.',
      },
      {
        q: 'Lan laa war a def bu deret bi taxaw balaa 40 fan?',
        a: 'Tàmbaliwaat ibaada yi dafay sukkandiku ci màndarga yi ñu gis ak anam bu diine bi ñuy topp.',
      },
      {
        q: 'Lan lay am bu deret bi kontine lu yàgg?',
        a: 'Bu mu weesu diir bu ëpp bi ñu jàpp, anamam bu diine mën na soppiku: ñaanal benn ndigal bu am kàttan.',
      },
      {
        q: 'AWA mën na wax bu leer ndax sama deret nifas la ba tey?',
        a: 'Déedéet. AWA dafay joxe màndarga yu njàng yu yaatu te du génne fatwa walla benn dogal bu sa bopp.',
      },
    ],
    alert3Title: 'Benn màndarga, du fatwa',
    alert3Text: 'Mbir yu sa bopp mën nañu wuute. Bu am xel-ñaar, jokkoo ak benn jàngalekat bu am kàttan walla benn mbooloom diine bu ñu xam.',
    shareMessage: 'Nifas ci jëfu diine — AWA',
  },
  ha: {
    badge: 'NIFASI (FIQHU)',
    title: 'Nifasi a\ncikin ibada',
    metaDuration: 'karatun minti 6',
    metaType: 'Tambayoyi',
    metaLevel: 'Mafari',
    metaValidated: 'Abun da aka duba',
    intro: 'Fahimtar nifasi, tsawonsa, sallah, azumi, da komawa ga ayyukan ibada bayan haihuwa.',
    disclaimerTitle: 'Muhimmin bayani',
    disclaimerText: 'Wannan abun ilimantarwa ne kawai. Ya kamata ƙwararrun malamai su tabbatar da tambayoyin addini. AWA ba ta ba da fatawa ko hukunce-hukuncen addini na keɓaɓɓu.',
    contentsTitle: 'A cikin wannan labari',
    topics: [
      'Menene nifasi?',
      'Tsawonsa bisa nassoshin fiqhu',
      'Sallah lokacin nifasi',
      'Azumi lokacin nifasi',
      'Tsarkakewa da komawa ga ayyukan ibada',
      'Tambayoyin da ake yawan yi',
    ],
    section1Body: 'A cikin ibada, nifasi yana nufin lokacin da ke da alaƙa da zubar jinin bayan haihuwa. Lochia tana bayyana ɓangaren likita da na jiki na wannan zubar jini; nifasi shi ne rabe-raben addininsa. Bai kamata a haɗa waɗannan ra’ayoyi biyu ba.',
    tip1Title: 'Muhimmin abu',
    tip1Text: 'AWA tana raba bayanin likita game da lochia da alamomin addini game da nifasi da gangan.',
    question1: 'Tsawon nawa nifasi yake ɗauka?',
    section2Body: 'Mafi tsawon lokaci na iya bambanta bisa mazhabar fiqhu ko nassin addini da ake bi. Kwana 40 nassi ne da ake yawan amfani da shi, ba tare da AWA ta gabatar da shi a matsayin ƙa’ida ta kowa ba.',
    tip2Title: 'Alama da ake yawan amfani da ita',
    tip2Text: 'Nassi da ake yawan amfani da shi kwana 40 ne, amma AWA ba ta gabatar da wannan lamba a matsayin gaskiya guda ɗaya ga duk mazhabobin fiqhu ba. Bi nassin addini da kika zaɓa.',
    question2: 'Shin zan yi sallah lokacin nifasi?',
    section3Body: 'A lokacin da aka amince da shi a matsayin nifasi bisa nassin da ake bi, ana dakatar da sallar ibada. AWA ba ta rarraba zubar jini kai tsaye ba kuma ba ta ba da hukunci na mutum ba. Ba a ƙara kirgen sallolin da aka rasa don wannan lokaci ba.',
    question3: 'Zan iya yin azumi lokacin nifasi?',
    section4Body: 'Ba a yin azumi na wajibi a lokacin da aka amince da shi a matsayin nifasi. Ana kula da kwanakin da abin ya shafa ta hanyar rama da ta dace, bisa nassin da ake bi.',
    tip3Title: 'Tsarawa, ba yanke hukunci ba',
    tip3Text: 'AWA za ta iya taimaka miki ki bi diddigin ko ki tsara kwanakin da abin ya shafa, ba tare da ba da hukuncin addini na mutum ba.',
    section5Body: 'Komawa ya dogara ga alamomin da aka lura da su da nassin addini da ake bi.',
    steps: [
      'Lura da ƙarshen zubar jini',
      'Yi tsarkakewar ibada',
      'Koma ga ayyukan ibada da abin ya shafa',
    ],
    alert2Title: 'Idan akwai shakka',
    alert2Text: 'Idan zubar jinin ya ci gaba bayan mafi tsawon lokaci da nassin da ake bi ya ɗauka, matsayinsa na addini na iya canzawa. Ana ba da shawarar ra’ayin ƙwararre.',
    faq: [
      {
        q: 'Shin nifasi koyaushe yana ɗaukar kwana 40?',
        a: 'A’a. Kwana 40 nassi ne da ake yawan amfani da shi, amma nassoshin fiqhu na iya bambanta.',
      },
      {
        q: 'Me zan yi idan zubar jinin ya tsaya kafin kwana 40?',
        a: 'Komawa ga ayyukan ibada ya dogara ga alamomin da aka lura da su da nassin addini da ake bi.',
      },
      {
        q: 'Idan zubar jinin ya ci gaba na dogon lokaci fa?',
        a: 'Idan ya wuce mafi tsawon lokaci da aka ɗauka, matsayinsa na addini na iya canzawa: nemi ra’ayin ƙwararre.',
      },
      {
        q: 'Shin AWA za ta iya faɗa daidai ko zubar jinina har yanzu nifasi ne?',
        a: 'A’a. AWA tana ba da alamomi gama gari na ilimantarwa kuma ba ta ba da fatawa ko hukunci na mutum ba.',
      },
    ],
    alert3Title: 'Alama, ba fatawa ba',
    alert3Text: 'Yanayin mutum na iya bambanta. Idan akwai shakka, tuntuɓi ƙwararren malami ko sanannen ƙungiyar addini.',
    shareMessage: 'Nifasi a cikin ibada — AWA',
  },
  am: {
    badge: 'ኒፋስ (ፊቅህ)',
    title: 'ኒፋስ በሃይማኖታዊ\nተግባር',
    metaDuration: '6 ደቂቃ ንባብ',
    metaType: 'ተደጋጋሚ ጥያቄዎች',
    metaLevel: 'ጀማሪ',
    metaValidated: 'የተረጋገጠ ይዘት',
    intro: 'ኒፋስን፣ ቆይታውን፣ ሶላትን፣ ጾምን እና ከወሊድ በኋላ ወደ አምልኮ ተግባራት መመለስን መረዳት።',
    disclaimerTitle: 'አስፈላጊ መረጃ',
    disclaimerText: 'ይህ ይዘት ትምህርታዊ ብቻ ነው። የሃይማኖት ጥያቄዎች በብቁ ሊቃውንት ሊረጋገጡ ይገባል። AWA ፈትዋ ወይም የግል የሃይማኖት ብይን አይሰጥም።',
    contentsTitle: 'በዚህ ጽሑፍ ውስጥ',
    topics: [
      'ኒፋስ ምንድን ነው?',
      'በፊቅህ ማመሳከሪያዎች መሠረት ቆይታው',
      'በኒፋስ ጊዜ ሶላት',
      'በኒፋስ ጊዜ ጾም',
      'ጽዳትና ወደ አምልኮ ተግባራት መመለስ',
      'ተደጋጋሚ ጥያቄዎች',
    ],
    section1Body: 'በሃይማኖታዊ ተግባር፣ ኒፋስ ከወሊድ በኋላ ከሚፈሰው ደም ጋር የተያያዘውን ጊዜ ያመለክታል። ሎኪያ የዚህን ደም መፍሰስ የሕክምናና የፊዚዮሎጂ ገጽታ ይገልጻል፤ ኒፋስ ሃይማኖታዊ ምደባው ነው። እነዚህ ሁለት ጽንሰ ሐሳቦች መደባለቅ የለባቸውም።',
    tip1Title: 'ዋና ነጥብ',
    tip1Text: 'AWA ስለ ሎኪያ የሕክምና መረጃን ከኒፋስ ሃይማኖታዊ ምልክቶች ሆን ብሎ ይለያል።',
    question1: 'ኒፋስ ምን ያህል ጊዜ ይቆያል?',
    section2Body: 'ከፍተኛው ቆይታ በሚከተለው የፊቅህ ትምህርት ቤት ወይም የሃይማኖት ማመሳከሪያ መሠረት ሊለያይ ይችላል። 40 ቀናት በተደጋጋሚ የሚጠቀሙበት ማመሳከሪያ ነው፣ በAWA እንደ ሁለንተናዊ ደንብ ሳይቀርብ።',
    tip2Title: 'በተለምዶ የሚጠቀሙበት ምልክት',
    tip2Text: 'በተደጋጋሚ የሚጠቀሙበት ማመሳከሪያ 40 ቀናት ነው፣ ነገር ግን AWA ይህን አኃዝ ለሁሉም የፊቅህ ትምህርት ቤቶች እንደ አንድ እውነት አያቀርብም። የመረጥሽውን የሃይማኖት ማመሳከሪያ ተከተዪ።',
    question2: 'በኒፋስ ጊዜ ሶላት መስገድ አለብኝ?',
    section3Body: 'በሚከተለው ማመሳከሪያ መሠረት እንደ ኒፋስ በተታወቀ ጊዜ፣ የአምልኮ ሶላት ይቆማል። AWA ደም መፍሰስን በራስ-ሰር አይመድብም እና የግል ውሳኔ አይሰጥም። ለዚህ ጊዜ የተረሱ ሶላቶች ቆጣሪ አይጨመርም።',
    question3: 'በኒፋስ ጊዜ መጾም እችላለሁ?',
    section4Body: 'የግዴታ ጾም እንደ ኒፋስ በተታወቀ ጊዜ አይፈጸምም። የሚመለከታቸው ቀናት ከዚያ በሚከተለው ማመሳከሪያ መሠረት በተገቢው ማካሻ ይስተናገዳሉ።',
    tip3Title: 'ማደራጀት፣ ያለ መወሰን',
    tip3Text: 'AWA የግል ሃይማኖታዊ ውሳኔ ሳይሰጥ የሚመለከታቸውን ቀናት እንድትከታተዪ ወይም እንድታደራጂ ሊረዳሽ ይችላል።',
    section5Body: 'መቀጠል በታዩት ምልክቶችና በሚከተለው የሃይማኖት ማመሳከሪያ ላይ ይወሰናል።',
    steps: [
      'የደም መፍሰሱን ማብቃት ታዘቢ',
      'የአምልኮ ጽዳትን አከናውኚ',
      'የሚመለከታቸውን የአምልኮ ተግባራት ቀጥዪ',
    ],
    alert2Title: 'ጥርጣሬ ካለ',
    alert2Text: 'ደም መፍሰሱ በሚከተለው ማመሳከሪያ ከተወሰደው ከፍተኛ ቆይታ በላይ ከቀጠለ፣ ሃይማኖታዊ ሁኔታው ሊለወጥ ይችላል። የብቁ ሰው ራይ ይመከራል።',
    faq: [
      {
        q: 'ኒፋስ ሁልጊዜ 40 ቀናት ይቆያል?',
        a: 'አይደለም። 40 ቀናት በተደጋጋሚ የሚጠቀሙበት ማመሳከሪያ ነው፣ ነገር ግን የፊቅህ ማመሳከሪያዎች ሊለያዩ ይችላሉ።',
      },
      {
        q: 'ደም መፍሰሱ ከ40 ቀናት በፊት ቢቆም ምን ማድረግ አለብኝ?',
        a: 'ወደ አምልኮ ተግባራት መመለስ በታዩት ምልክቶችና በሚከተለው የሃይማኖት ማመሳከሪያ ላይ ይወሰናል።',
      },
      {
        q: 'ደም መፍሰሱ ለረዥም ጊዜ ከቀጠለስ?',
        a: 'ከተወሰደው ከፍተኛ ቆይታ ካለፈ ሃይማኖታዊ ሁኔታው ሊለወጥ ይችላል፦ የብቁ ሰው ራይ ጠይቂ።',
      },
      {
        q: 'AWA ደም መፍሰሴ አሁንም ኒፋስ መሆኑን በትክክል ሊናገር ይችላል?',
        a: 'አይችልም። AWA አጠቃላይ ትምህርታዊ ምልክቶችን ይሰጣል እንጂ ፈትዋ ወይም የግል ውሳኔ አይሰጥም።',
      },
    ],
    alert3Title: 'ምልክት እንጂ ፈትዋ አይደለም',
    alert3Text: 'የግል ሁኔታዎች ሊለያዩ ይችላሉ። ጥርጣሬ ካለ ብቁ ሊቅን ወይም የታወቀ የሃይማኖት ድርጅትን አነጋግሪ።',
    shareMessage: 'ኒፋስ በሃይማኖታዊ ተግባር — AWA',
  },
  nl: {
    badge: 'NIFAS (FIQH)',
    title: 'Nifas in de\nreligieuze praktijk',
    metaDuration: '6 min lezen',
    metaType: 'Veelgestelde vragen',
    metaLevel: 'Beginner',
    metaValidated: 'Gecontroleerde inhoud',
    intro: 'Nifas, de duur, het gebed, het vasten en het hervatten van de aanbidding na de bevalling begrijpen.',
    disclaimerTitle: 'Belangrijke informatie',
    disclaimerText: 'Deze inhoud is uitsluitend educatief. Religieuze vragen moeten door bevoegde geleerden worden gevalideerd. AWA geeft geen fatwa’s of persoonlijke religieuze uitspraken.',
    contentsTitle: 'In dit artikel',
    topics: [
      'Wat is nifas?',
      'De duur volgens juridische referenties',
      'Gebed tijdens nifas',
      'Vasten tijdens nifas',
      'Reiniging en hervatting van de aanbidding',
      'Veelgestelde vragen',
    ],
    section1Body: 'In de religieuze praktijk verwijst nifas naar de periode die samenhangt met het bloedverlies na de bevalling. Lochia beschrijft het medische en fysiologische aspect van dit bloedverlies; nifas is de religieuze classificatie ervan. Deze twee begrippen mogen niet worden verward.',
    tip1Title: 'Belangrijk punt',
    tip1Text: 'AWA scheidt bewust de medische informatie over lochia van de religieuze markeringen over nifas.',
    question1: 'Hoelang duurt nifas?',
    section2Body: 'De maximale duur kan verschillen naargelang de rechtsschool of de gevolgde religieuze referentie. 40 dagen is een veelgebruikte referentie, zonder dat AWA die als universele regel presenteert.',
    tip2Title: 'Een gangbare markering',
    tip2Text: 'Een veelgebruikte referentie is 40 dagen, maar AWA presenteert dit getal niet als de enige waarheid voor alle rechtsscholen. Volg de religieuze referentie die je hebt gekozen.',
    question2: 'Moet ik bidden tijdens nifas?',
    section3Body: 'Tijdens een periode die volgens de gevolgde referentie als nifas wordt erkend, is het rituele gebed opgeschort. AWA classificeert bloedverlies niet automatisch en geeft geen persoonlijke beslissing. Voor deze periode wordt geen teller van gemiste gebeden toegevoegd.',
    question3: 'Mag ik vasten tijdens nifas?',
    section4Body: 'Het verplichte vasten wordt niet verricht tijdens een periode die als nifas wordt erkend. De betreffende dagen worden dan afgehandeld door het passende inhalen, volgens de gevolgde referentie.',
    tip3Title: 'Organiseren, zonder te beslissen',
    tip3Text: 'AWA kan je helpen de betreffende dagen bij te houden of te organiseren, zonder een persoonlijke religieuze beslissing te geven.',
    section5Body: 'Het hervatten hangt af van de waargenomen tekenen en de gevolgde religieuze referentie.',
    steps: [
      'Observeer het einde van het bloedverlies',
      'Verricht de rituele reiniging',
      'Hervat de betreffende daden van aanbidding',
    ],
    alert2Title: 'Bij twijfel',
    alert2Text: 'Als het bloedverlies langer aanhoudt dan de maximale duur die door de gevolgde referentie wordt aangehouden, kan de religieuze status ervan veranderen. Een bevoegde mening wordt aanbevolen.',
    faq: [
      {
        q: 'Duurt nifas altijd 40 dagen?',
        a: 'Nee. 40 dagen is een veelgebruikte referentie, maar juridische referenties kunnen verschillen.',
      },
      {
        q: 'Wat moet ik doen als het bloedverlies vóór 40 dagen stopt?',
        a: 'Het hervatten van de aanbidding hangt af van de waargenomen tekenen en de gevolgde religieuze referentie.',
      },
      {
        q: 'En als het bloedverlies lang aanhoudt?',
        a: 'Als het de aangehouden maximale duur overschrijdt, kan de religieuze status veranderen: vraag een bevoegde mening.',
      },
      {
        q: 'Kan AWA precies zeggen of mijn bloedverlies nog nifas is?',
        a: 'Nee. AWA geeft algemene educatieve markeringen en geeft geen fatwa of persoonlijke beslissing.',
      },
    ],
    alert3Title: 'Een markering, geen fatwa',
    alert3Text: 'Persoonlijke situaties kunnen verschillen. Neem bij twijfel contact op met een bevoegd geleerde of een erkende religieuze organisatie.',
    shareMessage: 'Nifas in de religieuze praktijk — AWA',
  },
  fi: {
    badge: 'NIFAS (FIQH)',
    title: 'Nifas uskonnollisessa\nharjoituksessa',
    metaDuration: '6 min lukuaika',
    metaType: 'UKK',
    metaLevel: 'Aloittelija',
    metaValidated: 'Tarkistettu sisältö',
    intro: 'Nifasin, sen keston, rukouksen, paaston ja jumalanpalveluksen jatkamisen ymmärtäminen synnytyksen jälkeen.',
    disclaimerTitle: 'Tärkeää tietoa',
    disclaimerText: 'Tämä sisältö on puhtaasti opetuksellista. Uskonnolliset kysymykset tulee validoida päteviltä oppineilta. AWA ei anna fatwoja eikä henkilökohtaisia uskonnollisia päätöksiä.',
    contentsTitle: 'Tässä artikkelissa',
    topics: [
      'Mikä on nifas?',
      'Sen kesto oikeudellisten viitteiden mukaan',
      'Rukous nifasin aikana',
      'Paasto nifasin aikana',
      'Puhdistautuminen ja jumalanpalveluksen jatkaminen',
      'Usein kysytyt kysymykset',
    ],
    section1Body: 'Uskonnollisessa harjoituksessa nifas tarkoittaa synnytyksen jälkeiseen vuotoon liittyvää ajanjaksoa. Lochia kuvaa tämän vuodon lääketieteellistä ja fysiologista puolta; nifas on sen uskonnollinen luokitus. Näitä kahta käsitettä ei pidä sekoittaa.',
    tip1Title: 'Tärkein asia',
    tip1Text: 'AWA erottaa tarkoituksella lochiaa koskevat lääketieteelliset tiedot nifasia koskevista uskonnollisista merkeistä.',
    question1: 'Kuinka kauan nifas kestää?',
    section2Body: 'Enimmäiskesto voi vaihdella noudatetun oikeuskoulukunnan tai uskonnollisen viitteen mukaan. 40 päivää on usein käytetty viite, jota AWA ei esitä yleispätevänä sääntönä.',
    tip2Title: 'Yleisesti käytetty merkki',
    tip2Text: 'Usein käytetty viite on 40 päivää, mutta AWA ei esitä tätä lukua ainoana totuutena kaikille oikeuskoulukunnille. Noudata valitsemaasi uskonnollista viitettä.',
    question2: 'Pitäisikö minun rukoilla nifasin aikana?',
    section3Body: 'Noudatetun viitteen mukaan nifasiksi tunnustetun jakson aikana rituaalinen rukous on keskeytetty. AWA ei luokittele vuotoa automaattisesti eikä anna henkilökohtaista päätöstä. Tälle jaksolle ei lisätä väliin jääneiden rukousten laskuria.',
    question3: 'Voinko paastota nifasin aikana?',
    section4Body: 'Pakollista paastoa ei suoriteta nifasiksi tunnustetun jakson aikana. Kyseiset päivät hoidetaan sitten asianmukaisella korvaamisella noudatetun viitteen mukaisesti.',
    tip3Title: 'Järjestäminen päättämättä',
    tip3Text: 'AWA voi auttaa pitämään kirjaa kyseisistä päivistä tai järjestämään niitä antamatta henkilökohtaista uskonnollista päätöstä.',
    section5Body: 'Jatkaminen riippuu havaituista merkeistä ja noudatetusta uskonnollisesta viitteestä.',
    steps: [
      'Havainnoi vuodon päättyminen',
      'Suorita rituaalinen puhdistautuminen',
      'Jatka kyseisiä jumalanpalveluksia',
    ],
    alert2Title: 'Epäselvässä tilanteessa',
    alert2Text: 'Jos vuoto jatkuu noudatetun viitteen hyväksymän enimmäiskeston yli, sen uskonnollinen asema voi muuttua. Pätevän mielipiteen kysyminen on suositeltavaa.',
    faq: [
      {
        q: 'Kestääkö nifas aina 40 päivää?',
        a: 'Ei. 40 päivää on usein käytetty viite, mutta oikeudelliset viitteet voivat poiketa toisistaan.',
      },
      {
        q: 'Mitä minun pitäisi tehdä, jos vuoto loppuu ennen 40 päivää?',
        a: 'Jumalanpalveluksen jatkaminen riippuu havaituista merkeistä ja noudatetusta uskonnollisesta viitteestä.',
      },
      {
        q: 'Entä jos vuoto jatkuu pitkään?',
        a: 'Jos se ylittää hyväksytyn enimmäiskeston, sen uskonnollinen asema voi muuttua: pyydä pätevää mielipidettä.',
      },
      {
        q: 'Voiko AWA sanoa tarkasti, onko vuotoni vielä nifasia?',
        a: 'Ei. AWA antaa yleisiä opetuksellisia merkkejä eikä anna fatwaa tai henkilökohtaista päätöstä.',
      },
    ],
    alert3Title: 'Merkki, ei fatwa',
    alert3Text: 'Henkilökohtaiset tilanteet voivat poiketa toisistaan. Epäselvässä tilanteessa ota yhteyttä pätevään oppineeseen tai tunnustettuun uskonnolliseen järjestöön.',
    shareMessage: 'Nifas uskonnollisessa harjoituksessa — AWA',
  },
  el: {
    badge: 'ΝΙΦΑΣ (ΦΙΚΧ)',
    title: 'Το νιφάς στη\nθρησκευτική πρακτική',
    metaDuration: '6 λεπτά ανάγνωσης',
    metaType: 'Συχνές ερωτήσεις',
    metaLevel: 'Αρχάριο',
    metaValidated: 'Ελεγμένο περιεχόμενο',
    intro: 'Κατανοώντας το νιφάς, τη διάρκειά του, την προσευχή, τη νηστεία και την επανέναρξη των πράξεων λατρείας μετά τον τοκετό.',
    disclaimerTitle: 'Σημαντική πληροφορία',
    disclaimerText: 'Αυτό το περιεχόμενο είναι καθαρά εκπαιδευτικό. Τα θρησκευτικά ζητήματα πρέπει να επικυρώνονται από ειδικούς θεολόγους. Το AWA δεν εκδίδει φετβά ούτε εξατομικευμένες θρησκευτικές αποφάσεις.',
    contentsTitle: 'Σε αυτό το άρθρο',
    topics: [
      'Τι είναι το νιφάς;',
      'Η διάρκειά του σύμφωνα με νομικές αναφορές',
      'Προσευχή κατά το νιφάς',
      'Νηστεία κατά το νιφάς',
      'Καθαρμός και επανέναρξη των πράξεων λατρείας',
      'Συχνές ερωτήσεις',
    ],
    section1Body: 'Στη θρησκευτική πρακτική, το νιφάς αναφέρεται στην περίοδο που συνδέεται με την αιμορραγία μετά τον τοκετό. Τα λοχιακά υγρά περιγράφουν την ιατρική και φυσιολογική πλευρά αυτής της αιμορραγίας· το νιφάς είναι η θρησκευτική της κατηγοριοποίηση. Αυτές οι δύο έννοιες δεν πρέπει να συγχέονται.',
    tip1Title: 'Βασικό συμπέρασμα',
    tip1Text: 'Το AWA διαχωρίζει σκόπιμα τις ιατρικές πληροφορίες για τα λοχιακά υγρά από τα θρησκευτικά σημεία αναφοράς για το νιφάς.',
    question1: 'Πόσο διαρκεί το νιφάς;',
    section2Body: 'Η μέγιστη διάρκεια μπορεί να διαφέρει ανάλογα με τη νομική σχολή ή τη θρησκευτική αναφορά που ακολουθείται. Οι 40 ημέρες είναι μια συχνά χρησιμοποιούμενη αναφορά, χωρίς να παρουσιάζονται από το AWA ως καθολικός κανόνας.',
    tip2Title: 'Ένα συχνά χρησιμοποιούμενο σημείο αναφοράς',
    tip2Text: 'Μια συχνά χρησιμοποιούμενη αναφορά είναι οι 40 ημέρες, αλλά το AWA δεν παρουσιάζει αυτόν τον αριθμό ως τη μοναδική αλήθεια για όλες τις νομικές σχολές. Ακολούθησε τη θρησκευτική αναφορά που έχεις επιλέξει.',
    question2: 'Πρέπει να προσεύχομαι κατά το νιφάς;',
    section3Body: 'Σε μια περίοδο που αναγνωρίζεται ως νιφάς σύμφωνα με την αναφορά που ακολουθείται, η τελετουργική προσευχή αναστέλλεται. Το AWA δεν κατηγοριοποιεί αυτόματα την αιμορραγία και δεν παρέχει εξατομικευμένη απόφαση. Δεν προστίθεται μετρητής προσευχών που χάθηκαν για αυτή την περίοδο.',
    question3: 'Μπορώ να νηστεύω κατά το νιφάς;',
    section4Body: 'Η υποχρεωτική νηστεία δεν εκτελείται κατά τη διάρκεια μιας περιόδου που αναγνωρίζεται ως νιφάς. Οι ημέρες που αφορά αντιμετωπίζονται τότε μέσω της κατάλληλης αναπλήρωσης, σύμφωνα με την αναφορά που ακολουθείται.',
    tip3Title: 'Οργάνωση, χωρίς απόφαση',
    tip3Text: 'Το AWA μπορεί να σε βοηθήσει να παρακολουθείς ή να οργανώνεις τις ημέρες που αφορά, χωρίς να εκδίδει εξατομικευμένη θρησκευτική απόφαση.',
    section5Body: 'Η επανέναρξη εξαρτάται από τα σημάδια που παρατηρούνται και από τη θρησκευτική αναφορά που ακολουθείται.',
    steps: [
      'Παρατήρησε το τέλος της αιμορραγίας',
      'Εκτέλεσε τον τελετουργικό καθαρμό',
      'Ξανάρχισε τις σχετικές πράξεις λατρείας',
    ],
    alert2Title: 'Σε περίπτωση αμφιβολίας',
    alert2Text: 'Αν η αιμορραγία συνεχίζεται πέρα από τη μέγιστη διάρκεια που υιοθετεί η αναφορά που ακολουθείται, η θρησκευτική της κατάσταση μπορεί να αλλάξει. Συνιστάται εξειδικευμένη γνώμη.',
    faq: [
      {
        q: 'Διαρκεί το νιφάς πάντα 40 ημέρες;',
        a: 'Όχι. Οι 40 ημέρες είναι μια συχνά χρησιμοποιούμενη αναφορά, αλλά οι νομικές αναφορές μπορεί να διαφέρουν.',
      },
      {
        q: 'Τι πρέπει να κάνω αν η αιμορραγία σταματήσει πριν τις 40 ημέρες;',
        a: 'Η επανέναρξη των πράξεων λατρείας εξαρτάται από τα σημάδια που παρατηρούνται και από τη θρησκευτική αναφορά που ακολουθείται.',
      },
      {
        q: 'Τι γίνεται αν η αιμορραγία συνεχίζεται για πολύ καιρό;',
        a: 'Αν ξεπεράσει τη μέγιστη διάρκεια που υιοθετείται, η θρησκευτική της κατάσταση μπορεί να αλλάξει: ζήτησε εξειδικευμένη γνώμη.',
      },
      {
        q: 'Μπορεί το AWA να πει με ακρίβεια αν η αιμορραγία μου είναι ακόμη νιφάς;',
        a: 'Όχι. Το AWA παρέχει γενικά εκπαιδευτικά σημεία αναφοράς και δεν εκδίδει φετβά ούτε εξατομικευμένη απόφαση.',
      },
    ],
    alert3Title: 'Ένα σημείο αναφοράς, όχι φετβά',
    alert3Text: 'Οι προσωπικές περιπτώσεις μπορεί να διαφέρουν. Σε περίπτωση αμφιβολίας, απευθύνσου σε έναν ειδικό θεολόγο ή σε έναν αναγνωρισμένο θρησκευτικό οργανισμό.',
    shareMessage: 'Το νιφάς στη θρησκευτική πρακτική — AWA',
  },
  fil: {
    badge: 'NIFAS (FIQH)',
    title: 'Nifas sa\ngawaing panrelihiyon',
    metaDuration: '6 min na babasahin',
    metaType: 'FAQ',
    metaLevel: 'Baguhan',
    metaValidated: 'Sinuring nilalaman',
    intro: 'Pag-unawa sa nifas, sa tagal nito, sa dasal, sa pag-aayuno, at sa pagpapatuloy ng mga gawaing pagsamba pagkatapos manganak.',
    disclaimerTitle: 'Mahalagang impormasyon',
    disclaimerText: 'Pang-edukasyon lamang ang nilalamang ito. Dapat patunayan ng mga kuwalipikadong iskolar ang mga usaping panrelihiyon. Hindi naglalabas ang AWA ng mga fatwa o personalisadong hatol panrelihiyon.',
    contentsTitle: 'Sa artikulong ito',
    topics: [
      'Ano ang nifas?',
      'Ang tagal nito ayon sa mga sanggunian ng jurisprudensya',
      'Dasal habang may nifas',
      'Pag-aayuno habang may nifas',
      'Pagpapadalisay at pagpapatuloy ng mga gawaing pagsamba',
      'Mga madalas itanong',
    ],
    section1Body: 'Sa gawaing panrelihiyon, ang nifas ay tumutukoy sa panahong kaugnay ng pagdurugo pagkatapos manganak. Inilalarawan ng lochia ang medikal at pisyolohikal na aspeto ng pagdurugong ito; ang nifas ay ang panrelihiyong klasipikasyon nito. Hindi dapat pagsamahin ang dalawang konseptong ito.',
    tip1Title: 'Mahalagang tandaan',
    tip1Text: 'Sadyang pinaghihiwalay ng AWA ang medikal na impormasyon tungkol sa lochia mula sa mga panrelihiyong palatandaan tungkol sa nifas.',
    question1: 'Gaano katagal ang nifas?',
    section2Body: 'Maaaring mag-iba ang pinakamataas na tagal ayon sa paaralan ng jurisprudensya o sa sangguniang panrelihiyong sinusunod. Ang 40 araw ay madalas gamiting sanggunian, nang hindi ipinapakita ng AWA bilang pangkalahatang tuntunin.',
    tip2Title: 'Isang karaniwang ginagamit na palatandaan',
    tip2Text: 'Ang 40 araw ay madalas gamiting sanggunian, ngunit hindi ipinapakita ng AWA ang bilang na ito bilang iisang katotohanan para sa lahat ng paaralan ng jurisprudensya. Sundin ang sangguniang panrelihiyon na pinili mo.',
    question2: 'Dapat ba akong magdasal habang may nifas?',
    section3Body: 'Sa panahong kinikilalang nifas ayon sa sangguniang sinusunod, nasuspinde ang ritwal na dasal. Hindi awtomatikong inuuri ng AWA ang pagdurugo at hindi ito nagbibigay ng personalisadong desisyon. Walang counter ng hindi nagawang dasal na idinaragdag para sa panahong ito.',
    question3: 'Maaari ba akong mag-ayuno habang may nifas?',
    section4Body: 'Hindi isinasagawa ang obligadong pag-aayuno sa panahong kinikilalang nifas. Ang mga araw na kasangkot ay pinangangasiwaan sa pamamagitan ng angkop na pagbawi, ayon sa sangguniang sinusunod.',
    tip3Title: 'Pag-aayos, nang hindi nagpapasya',
    tip3Text: 'Matutulungan ka ng AWA na subaybayan o ayusin ang mga araw na kasangkot, nang hindi naglalabas ng personalisadong desisyong panrelihiyon.',
    section5Body: 'Nakadepende ang pagpapatuloy sa mga obserbadong senyales at sa sangguniang panrelihiyong sinusunod.',
    steps: [
      'Obserbahan ang pagtatapos ng pagdurugo',
      'Isagawa ang ritwal na pagpapadalisay',
      'Ipagpatuloy ang mga kaugnay na gawaing pagsamba',
    ],
    alert2Title: 'Kung nag-aalinlangan',
    alert2Text: 'Kung nagpapatuloy ang pagdurugo nang lampas sa pinakamataas na tagal na tinanggap ng sangguniang sinusunod, maaaring magbago ang katayuang panrelihiyon nito. Inirerekomenda ang kuwalipikadong opinyon.',
    faq: [
      {
        q: 'Laging 40 araw ba ang nifas?',
        a: 'Hindi. Ang 40 araw ay madalas gamiting sanggunian, ngunit maaaring magkaiba ang mga sanggunian ng jurisprudensya.',
      },
      {
        q: 'Ano ang gagawin kung huminto ang pagdurugo bago ang 40 araw?',
        a: 'Nakadepende ang pagpapatuloy ng mga gawaing pagsamba sa mga obserbadong senyales at sa sangguniang panrelihiyong sinusunod.',
      },
      {
        q: 'Paano kung matagal na nagpapatuloy ang pagdurugo?',
        a: 'Kung lumampas ito sa tinanggap na pinakamataas na tagal, maaaring magbago ang katayuang panrelihiyon nito: humingi ng kuwalipikadong opinyon.',
      },
      {
        q: 'Masasabi ba ng AWA nang eksakto kung nifas pa rin ang aking pagdurugo?',
        a: 'Hindi. Nagbibigay ang AWA ng pangkalahatang pang-edukasyong palatandaan at hindi ito naglalabas ng fatwa o personalisadong desisyon.',
      },
    ],
    alert3Title: 'Isang palatandaan, hindi fatwa',
    alert3Text: 'Maaaring magkakaiba ang mga personal na sitwasyon. Kung nag-aalinlangan, lumapit sa kuwalipikadong iskolar o kinikilalang organisasyong panrelihiyon.',
    shareMessage: 'Nifas sa gawaing panrelihiyon — AWA',
  },
  ta: {
    badge: 'நிஃபாஸ் (ஃபிக்ஹ்)',
    title: 'மார்க்க வழிபாட்டில்\nநிஃபாஸ்',
    metaDuration: '6 நிமிடம் படிக்க',
    metaType: 'கேள்வி-பதில்',
    metaLevel: 'தொடக்க நிலை',
    metaValidated: 'சரிபார்க்கப்பட்ட உள்ளடக்கம்',
    intro: 'நிஃபாஸ், அதன் கால அளவு, தொழுகை, நோன்பு மற்றும் பிரசவத்துக்குப் பின் வழிபாடுகளை மீண்டும் தொடங்குவதைப் புரிந்துகொள்ளுதல்.',
    disclaimerTitle: 'முக்கியத் தகவல்',
    disclaimerText: 'இந்த உள்ளடக்கம் முற்றிலும் கல்விசார்ந்தது. மார்க்கம் தொடர்பான கேள்விகள் தகுதிவாய்ந்த அறிஞர்களால் சரிபார்க்கப்பட வேண்டும். AWA பத்வாக்களையோ தனிப்பட்ட மார்க்கத் தீர்ப்புகளையோ வழங்குவதில்லை.',
    contentsTitle: 'இந்தக் கட்டுரையில்',
    topics: [
      'நிஃபாஸ் என்றால் என்ன?',
      'மார்க்கச் சட்டச் சான்றுகளின்படி அதன் கால அளவு',
      'நிஃபாஸின்போது தொழுகை',
      'நிஃபாஸின்போது நோன்பு',
      'தூய்மைப்படுத்தலும் வழிபாடுகளை மீண்டும் தொடங்குதலும்',
      'அடிக்கடி கேட்கப்படும் கேள்விகள்',
    ],
    section1Body: 'மார்க்க வழிபாட்டில், நிஃபாஸ் என்பது பிரசவத்துக்குப் பிந்தைய இரத்தப்போக்குடன் தொடர்புடைய காலத்தைக் குறிக்கிறது. இந்த இரத்தப்போக்கின் மருத்துவ மற்றும் உடலியல் பக்கத்தை லோகியா விவரிக்கிறது; நிஃபாஸ் அதன் மார்க்க வகைப்பாடு. இந்த இரண்டு கருத்துகளையும் குழப்பிக்கொள்ளக் கூடாது.',
    tip1Title: 'முக்கியக் குறிப்பு',
    tip1Text: 'லோகியா பற்றிய மருத்துவத் தகவலை நிஃபாஸ் பற்றிய மார்க்கக் குறிப்புகளிலிருந்து AWA வேண்டுமென்றே பிரிக்கிறது.',
    question1: 'நிஃபாஸ் எவ்வளவு காலம் நீடிக்கும்?',
    section2Body: 'அதிகபட்ச கால அளவு மார்க்கச் சட்டப் பிரிவு அல்லது பின்பற்றப்படும் மார்க்கச் சான்றைப் பொறுத்து மாறுபடலாம். 40 நாட்கள் அடிக்கடி பயன்படுத்தப்படும் ஒரு சான்று, ஆனால் AWA அதை உலகளாவிய விதியாக முன்வைப்பதில்லை.',
    tip2Title: 'பொதுவாகப் பயன்படுத்தப்படும் ஒரு குறிப்பு',
    tip2Text: 'அடிக்கடி பயன்படுத்தப்படும் ஒரு சான்று 40 நாட்கள், ஆனால் எல்லா மார்க்கச் சட்டப் பிரிவுகளுக்கும் இந்த எண்ணை ஒரே உண்மையாக AWA முன்வைப்பதில்லை. நீங்கள் தேர்ந்தெடுத்த மார்க்கச் சான்றைப் பின்பற்றுங்கள்.',
    question2: 'நிஃபாஸின்போது நான் தொழ வேண்டுமா?',
    section3Body: 'பின்பற்றப்படும் சான்றின்படி நிஃபாஸாக அங்கீகரிக்கப்பட்ட காலத்தில், வழிபாட்டுத் தொழுகை நிறுத்தி வைக்கப்படுகிறது. AWA இரத்தப்போக்கைத் தானாக வகைப்படுத்துவதில்லை, தனிப்பட்ட தீர்மானத்தை வழங்குவதுமில்லை. இந்தக் காலத்துக்குத் தவறிய தொழுகை எண்ணிக்கை எதுவும் சேர்க்கப்படுவதில்லை.',
    question3: 'நிஃபாஸின்போது நான் நோன்பு நோற்கலாமா?',
    section4Body: 'நிஃபாஸாக அங்கீகரிக்கப்பட்ட காலத்தில் கடமையான நோன்பு நோற்கப்படுவதில்லை. தொடர்புடைய நாட்கள் பின்பற்றப்படும் சான்றின்படி பொருத்தமான களா மூலம் கையாளப்படுகின்றன.',
    tip3Title: 'ஒழுங்கமைத்தல், தீர்மானிக்காமல்',
    tip3Text: 'தனிப்பட்ட மார்க்கத் தீர்மானத்தை வழங்காமல், தொடர்புடைய நாட்களைக் கண்காணிக்க அல்லது ஒழுங்கமைக்க AWA உங்களுக்கு உதவலாம்.',
    section5Body: 'மீண்டும் தொடங்குதல் கவனிக்கப்பட்ட அறிகுறிகளையும் பின்பற்றப்படும் மார்க்கச் சான்றையும் பொறுத்தது.',
    steps: [
      'இரத்தப்போக்கின் முடிவைக் கவனியுங்கள்',
      'வழிபாட்டுத் தூய்மைப்படுத்தலைச் செய்யுங்கள்',
      'தொடர்புடைய வழிபாடுகளை மீண்டும் தொடங்குங்கள்',
    ],
    alert2Title: 'சந்தேகம் இருந்தால்',
    alert2Text: 'பின்பற்றப்படும் சான்று ஏற்றுக்கொண்ட அதிகபட்ச கால அளவுக்கு அப்பாலும் இரத்தப்போக்கு நீடித்தால், அதன் மார்க்க நிலை மாறலாம். ஒரு தகுதிவாய்ந்த கருத்து பரிந்துரைக்கப்படுகிறது.',
    faq: [
      {
        q: 'நிஃபாஸ் எப்போதும் 40 நாட்கள் நீடிக்குமா?',
        a: 'இல்லை. 40 நாட்கள் அடிக்கடி பயன்படுத்தப்படும் ஒரு சான்று, ஆனால் மார்க்கச் சட்டச் சான்றுகள் வேறுபடலாம்.',
      },
      {
        q: '40 நாட்களுக்கு முன் இரத்தப்போக்கு நின்றால் நான் என்ன செய்ய வேண்டும்?',
        a: 'வழிபாடுகளை மீண்டும் தொடங்குவது கவனிக்கப்பட்ட அறிகுறிகளையும் பின்பற்றப்படும் மார்க்கச் சான்றையும் பொறுத்தது.',
      },
      {
        q: 'இரத்தப்போக்கு நீண்ட நேரம் தொடர்ந்தால் என்ன?',
        a: 'அது ஏற்றுக்கொண்ட அதிகபட்ச கால அளவை மீறினால், அதன் மார்க்க நிலை மாறலாம்: ஒரு தகுதிவாய்ந்த கருத்தைக் கேளுங்கள்.',
      },
      {
        q: 'என் இரத்தப்போக்கு இன்னும் நிஃபாஸா என்பதை AWA துல்லியமாகச் சொல்ல முடியுமா?',
        a: 'இல்லை. AWA பொதுவான கல்விசார் குறிப்புகளை வழங்குகிறது, பத்வாவையோ தனிப்பட்ட தீர்மானத்தையோ வழங்குவதில்லை.',
      },
    ],
    alert3Title: 'ஒரு குறிப்பு, பத்வா அல்ல',
    alert3Text: 'தனிப்பட்ட சூழ்நிலைகள் வேறுபடலாம். சந்தேகம் இருந்தால், ஒரு தகுதிவாய்ந்த அறிஞரை அல்லது அங்கீகரிக்கப்பட்ட மார்க்க அமைப்பை அணுகுங்கள்.',
    shareMessage: 'மார்க்க வழிபாட்டில் நிஃபாஸ் — AWA',
  },
  te: {
    badge: 'నిఫాస్ (ఫిఖ్హ్)',
    title: 'మార్గదర్శక ఆచరణలో\nనిఫాస్',
    metaDuration: '6 నిమిషాల పఠనం',
    metaType: 'తరచుగా అడిగే ప్రశ్నలు',
    metaLevel: 'ప్రారంభ స్థాయి',
    metaValidated: 'మదింపు చేసిన కంటెంట్',
    intro: 'నిఫాస్‌ను, దాని వ్యవధిని, నమాజ్‌ను, ఉపవాసాన్ని, ప్రసవం తర్వాత ఆరాధనలను తిరిగి మొదలుపెట్టడాన్ని అర్థం చేసుకోవడం.',
    disclaimerTitle: 'ముఖ్యమైన సమాచారం',
    disclaimerText: 'ఈ కంటెంట్ పూర్తిగా విద్యాపరమైనది. మార్గదర్శక ప్రశ్నలను అర్హులైన పండితులతో ధృవీకరించాలి. AWA ఫత్వాలను లేదా వ్యక్తిగత మార్గదర్శక తీర్పులను ఇవ్వదు.',
    contentsTitle: 'ఈ వ్యాసంలో',
    topics: [
      'నిఫాస్ అంటే ఏమిటి?',
      'న్యాయశాస్త్ర సూచనల ప్రకారం దాని వ్యవధి',
      'నిఫాస్ సమయంలో నమాజ్',
      'నిఫాస్ సమయంలో ఉపవాసం',
      'శుద్ధీకరణ, ఆరాధనలను తిరిగి మొదలుపెట్టడం',
      'తరచుగా అడిగే ప్రశ్నలు',
    ],
    section1Body: 'మార్గదర్శక ఆచరణలో, నిఫాస్ అంటే ప్రసవం తర్వాత రక్తస్రావంతో ముడిపడిన కాలం. లోచియా ఈ రక్తస్రావం యొక్క వైద్య, శారీరక కోణాన్ని వివరిస్తుంది; నిఫాస్ దాని మార్గదర్శక వర్గీకరణ. ఈ రెండు భావనలను కలగలపకూడదు.',
    tip1Title: 'ముఖ్య సారాంశం',
    tip1Text: 'AWA ఉద్దేశపూర్వకంగా లోచియా గురించిన వైద్య సమాచారాన్ని నిఫాస్ గురించిన మార్గదర్శక సూచికల నుండి వేరు చేస్తుంది.',
    question1: 'నిఫాస్ ఎంతకాలం ఉంటుంది?',
    section2Body: 'గరిష్ఠ వ్యవధి అనుసరించే న్యాయశాస్త్ర మజ్హబ్‌ను లేదా మార్గదర్శక సూచనను బట్టి మారవచ్చు. 40 రోజులు తరచుగా ఉపయోగించే సూచన, అయితే AWA దాన్ని విశ్వజనీన నియమంగా ప్రదర్శించదు.',
    tip2Title: 'సాధారణంగా ఉపయోగించే ఒక సూచిక',
    tip2Text: 'తరచుగా ఉపయోగించే సూచన 40 రోజులు, కానీ AWA ఈ సంఖ్యను అన్ని మజ్హబ్‌లకు ఒకే సత్యంగా ప్రదర్శించదు. మీరు ఎంచుకున్న మార్గదర్శక సూచనను అనుసరించండి.',
    question2: 'నిఫాస్ సమయంలో నేను నమాజ్ చేయాలా?',
    section3Body: 'అనుసరించే సూచన ప్రకారం నిఫాస్‌గా గుర్తించబడిన కాలంలో, సంప్రదాయ నమాజ్ నిలిపివేయబడుతుంది. AWA రక్తస్రావాన్ని ఆటోమేటిక్‌గా వర్గీకరించదు, వ్యక్తిగతీకరించిన నిర్ణయం ఇవ్వదు. ఈ కాలానికి తప్పిన నమాజ్‌ల లెక్కింపు ఏదీ జోడించబడదు.',
    question3: 'నిఫాస్ సమయంలో నేను ఉపవాసం ఉండవచ్చా?',
    section4Body: 'నిఫాస్‌గా గుర్తించబడిన కాలంలో తప్పనిసరి ఉపవాసం నిర్వర్తించబడదు. అప్పుడు సంబంధిత రోజులను అనుసరించే సూచన ప్రకారం తగిన చెల్లింపు ద్వారా చూసుకుంటారు.',
    tip3Title: 'నిర్ణయించకుండా, క్రమబద్ధీకరించడం',
    tip3Text: 'AWA వ్యక్తిగతీకరించిన మార్గదర్శక నిర్ణయం ఇవ్వకుండా, సంబంధిత రోజులను ట్రాక్ చేయడానికి లేదా క్రమబద్ధీకరించడానికి మీకు సహాయపడగలదు.',
    section5Body: 'తిరిగి మొదలుపెట్టడం గమనించిన సంకేతాలపై, అనుసరించే మార్గదర్శక సూచనపై ఆధారపడి ఉంటుంది.',
    steps: [
      'రక్తస్రావం ముగింపును గమనించండి',
      'సంప్రదాయ శుద్ధీకరణ చేయండి',
      'సంబంధిత ఆరాధనలను తిరిగి మొదలుపెట్టండి',
    ],
    alert2Title: 'సందేహం ఉంటే',
    alert2Text: 'అనుసరించే సూచన అంగీకరించిన గరిష్ఠ వ్యవధిని దాటి రక్తస్రావం కొనసాగితే, దాని మార్గదర్శక స్థితి మారవచ్చు. అర్హత కలిగిన అభిప్రాయం సిఫార్సు చేయబడుతుంది.',
    faq: [
      {
        q: 'నిఫాస్ ఎల్లప్పుడూ 40 రోజులు ఉంటుందా?',
        a: 'కాదు. 40 రోజులు తరచుగా ఉపయోగించే సూచన, కానీ న్యాయశాస్త్ర సూచనలు భిన్నంగా ఉండవచ్చు.',
      },
      {
        q: 'రక్తస్రావం 40 రోజులకు ముందే ఆగిపోతే నేను ఏం చేయాలి?',
        a: 'ఆరాధనలను తిరిగి మొదలుపెట్టడం గమనించిన సంకేతాలపై, అనుసరించే మార్గదర్శక సూచనపై ఆధారపడి ఉంటుంది.',
      },
      {
        q: 'రక్తస్రావం ఎక్కువ కాలం కొనసాగితే ఏం చేయాలి?',
        a: 'ఇది అంగీకరించిన గరిష్ఠ వ్యవధిని మించితే, దాని మార్గదర్శక స్థితి మారవచ్చు: అర్హత కలిగిన అభిప్రాయం కోరండి.',
      },
      {
        q: 'నా రక్తస్రావం ఇంకా నిఫాసేనా కాదా అని AWA ఖచ్చితంగా చెప్పగలదా?',
        a: 'చెప్పలేదు. AWA సాధారణ విద్యాపరమైన సూచికలను అందిస్తుంది, ఫత్వా లేదా వ్యక్తిగతీకరించిన నిర్ణయం ఇవ్వదు.',
      },
    ],
    alert3Title: 'ఒక సూచిక, ఫత్వా కాదు',
    alert3Text: 'వ్యక్తిగత పరిస్థితులు భిన్నంగా ఉండవచ్చు. సందేహం ఉంటే, అర్హత కలిగిన పండితుడిని లేదా గుర్తింపు పొందిన మార్గదర్శక సంస్థను సంప్రదించండి.',
    shareMessage: 'మార్గదర్శక ఆచరణలో నిఫాస్ — AWA',
  },
  mr: {
    badge: 'निफास (फिक्ह)',
    title: 'धार्मिक आचरणातील\nनिफास',
    metaDuration: '6 मिनिटे वाचन',
    metaType: 'वारंवार विचारले जाणारे प्रश्न',
    metaLevel: 'प्रारंभ स्तर',
    metaValidated: 'पुनरावलोकन केलेला मजकूर',
    intro: 'निफास, त्याचा कालावधी, नमाज, रोजे आणि प्रसूतीनंतर उपासना पुन्हा सुरू करणे समजून घेणे.',
    disclaimerTitle: 'महत्त्वाची माहिती',
    disclaimerText: 'हा मजकूर पूर्णपणे शैक्षणिक आहे. धार्मिक प्रश्न पात्र विद्वानांकडून प्रमाणित करून घ्यावेत. AWA फतवे किंवा वैयक्तिक धार्मिक निर्णय देत नाही.',
    contentsTitle: 'या लेखात',
    topics: [
      'निफास म्हणजे काय?',
      'फिक्हच्या संदर्भांनुसार त्याचा कालावधी',
      'निफासदरम्यान नमाज',
      'निफासदरम्यान रोजे',
      'शुद्धीकरण आणि उपासना पुन्हा सुरू करणे',
      'वारंवार विचारले जाणारे प्रश्न',
    ],
    section1Body: 'धार्मिक आचरणात, निफास म्हणजे प्रसूतीनंतरच्या रक्तस्रावाशी संबंधित काळ. लोकिया या रक्तस्रावाच्या वैद्यकीय आणि शारीरिक बाजूचे वर्णन करतो; निफास हे त्याचे धार्मिक वर्गीकरण आहे. या दोन संकल्पनांची गल्लत करू नये.',
    tip1Title: 'मुख्य मुद्दा',
    tip1Text: 'AWA लोकियाबद्दलची वैद्यकीय माहिती आणि निफासबद्दलच्या धार्मिक खुणा जाणूनबुजून वेगळ्या ठेवते.',
    question1: 'निफास किती काळ चालतो?',
    section2Body: 'कमाल कालावधी फिक्हच्या मजहबनुसार किंवा पाळल्या जाणाऱ्या धार्मिक संदर्भानुसार बदलू शकतो. 40 दिवस हा वारंवार वापरला जाणारा संदर्भ आहे, मात्र AWA तो सार्वत्रिक नियम म्हणून मांडत नाही.',
    tip2Title: 'सामान्यपणे वापरली जाणारी खूण',
    tip2Text: 'वारंवार वापरला जाणारा संदर्भ 40 दिवस आहे, पण AWA हा आकडा सर्व मजहबांसाठी एकमेव सत्य म्हणून मांडत नाही. तुम्ही निवडलेल्या धार्मिक संदर्भाचे पालन करा.',
    question2: 'निफासदरम्यान मी नमाज पढली पाहिजे का?',
    section3Body: 'पाळल्या जाणाऱ्या संदर्भानुसार निफास म्हणून मान्य असलेल्या काळात, आचार नमाज स्थगित असते. AWA रक्तस्रावाचे आपोआप वर्गीकरण करत नाही आणि वैयक्तिक निर्णय देत नाही. या काळासाठी चुकलेल्या नमाजांची कोणतीही मोजणी जोडली जात नाही.',
    question3: 'निफासदरम्यान मी रोजा ठेवू शकते का?',
    section4Body: 'निफास म्हणून मान्य असलेल्या काळात बंधनकारक रोजा ठेवला जात नाही. संबंधित दिवस मग पाळल्या जाणाऱ्या संदर्भानुसार योग्य भरून काढण्याच्या पद्धतीने हाताळले जातात.',
    tip3Title: 'नीट मांडणे, निर्णय न देता',
    tip3Text: 'AWA वैयक्तिक धार्मिक निर्णय न देता संबंधित दिवसांचा मागोवा ठेवण्यास किंवा ते नीट मांडण्यास तुम्हाला मदत करू शकते.',
    section5Body: 'उपासना पुन्हा सुरू करणे निरीक्षण केलेल्या चिन्हांवर आणि पाळल्या जाणाऱ्या धार्मिक संदर्भावर अवलंबून असते.',
    steps: [
      'रक्तस्राव संपल्याचे निरीक्षण करा',
      'आचार शुद्धीकरण करा',
      'संबंधित उपासना पुन्हा सुरू करा',
    ],
    alert2Title: 'शंका असल्यास',
    alert2Text: 'पाळल्या जाणाऱ्या संदर्भाने स्वीकारलेल्या कमाल कालावधीपलीकडे रक्तस्राव टिकल्यास, त्याची धार्मिक स्थिती बदलू शकते. पात्र मत घेण्याची शिफारस केली जाते.',
    faq: [
      {
        q: 'निफास नेहमी 40 दिवसांचाच असतो का?',
        a: 'नाही. 40 दिवस हा वारंवार वापरला जाणारा संदर्भ आहे, पण फिक्हचे संदर्भ वेगळे असू शकतात.',
      },
      {
        q: 'रक्तस्राव 40 दिवसांपूर्वी थांबला तर मी काय करावे?',
        a: 'उपासना पुन्हा सुरू करणे निरीक्षण केलेल्या चिन्हांवर आणि पाळल्या जाणाऱ्या धार्मिक संदर्भावर अवलंबून असते.',
      },
      {
        q: 'रक्तस्राव बराच काळ चालू राहिला तर?',
        a: 'स्वीकारलेल्या कमाल कालावधीपेक्षा तो जास्त झाल्यास, त्याची धार्मिक स्थिती बदलू शकते: पात्र मत विचारा.',
      },
      {
        q: 'माझा रक्तस्राव अजूनही निफास आहे का हे AWA नेमके सांगू शकते का?',
        a: 'नाही. AWA सर्वसाधारण शैक्षणिक खुणा देते आणि फतवा किंवा वैयक्तिक निर्णय देत नाही.',
      },
    ],
    alert3Title: 'एक खूण, फतवा नव्हे',
    alert3Text: 'वैयक्तिक परिस्थिती वेगळ्या असू शकतात. शंका असल्यास, पात्र विद्वानाशी किंवा मान्यताप्राप्त धार्मिक संस्थेशी संपर्क साधा.',
    shareMessage: 'धार्मिक आचरणातील निफास — AWA',
  },
  gu: {
    badge: 'નિફાસ (ફિક્હ)',
    title: 'ધાર્મિક આચરણમાં\nનિફાસ',
    metaDuration: '6 મિનિટ વાંચન',
    metaType: 'વારંવાર પૂછાતા પ્રશ્નો',
    metaLevel: 'પ્રારંભિક સ્તર',
    metaValidated: 'પુનરાવલોકન કરેલી સામગ્રી',
    intro: 'નિફાસ, તેનો સમયગાળો, નમાઝ, રોઝા અને પ્રસૂતિ પછી ઇબાદત ફરી શરૂ કરવા વિશે સમજો.',
    disclaimerTitle: 'મહત્ત્વની માહિતી',
    disclaimerText: 'આ સામગ્રી સંપૂર્ણપણે શૈક્ષણિક છે. ધાર્મિક પ્રશ્નોની પુષ્ટિ લાયક વિદ્વાનો પાસે કરાવવી જોઈએ. AWA ફતવા કે વ્યક્તિગત ધાર્મિક ચુકાદા આપતું નથી.',
    contentsTitle: 'આ લેખમાં',
    topics: [
      'નિફાસ શું છે?',
      'ફિક્હના સંદર્ભો મુજબ તેનો સમયગાળો',
      'નિફાસ દરમિયાન નમાઝ',
      'નિફાસ દરમિયાન રોઝા',
      'પાકી અને ઇબાદત ફરી શરૂ કરવી',
      'વારંવાર પૂછાતા પ્રશ્નો',
    ],
    section1Body: 'ધાર્મિક આચરણમાં, નિફાસ એટલે પ્રસૂતિ પછીના રક્તસ્રાવ સાથે જોડાયેલો સમયગાળો. લોચિયા આ રક્તસ્રાવનું તબીબી અને શારીરિક પાસું વર્ણવે છે; નિફાસ તેનું ધાર્મિક વર્ગીકરણ છે. આ બે બાબતોને ગૂંચવવી ન જોઈએ.',
    tip1Title: 'મુખ્ય મુદ્દો',
    tip1Text: 'AWA જાણીજોઈને લોચિયા વિશેની તબીબી માહિતીને નિફાસ વિશેના ધાર્મિક માપદંડોથી અલગ રાખે છે.',
    question1: 'નિફાસ કેટલા સમય સુધી ચાલે છે?',
    section2Body: 'અનુસરવામાં આવતા ફિક્હના મત અથવા ધાર્મિક સંદર્ભ પ્રમાણે મહત્તમ સમયગાળો અલગ હોઈ શકે છે. 40 દિવસ વારંવાર વપરાતો સંદર્ભ છે, પરંતુ AWA તેને સર્વમાન્ય નિયમ તરીકે રજૂ કરતું નથી.',
    tip2Title: 'સામાન્ય રીતે વપરાતો માપદંડ',
    tip2Text: 'વારંવાર વપરાતો સંદર્ભ 40 દિવસનો છે, પરંતુ AWA આ આંકડાને બધા ફિક્હના મતો માટે એકમાત્ર સાચો ગણાવતું નથી. તમે પસંદ કરેલા ધાર્મિક સંદર્ભને અનુસરો.',
    question2: 'શું નિફાસ દરમિયાન મારે નમાઝ પઢવી જોઈએ?',
    section3Body: 'અનુસરવામાં આવતા સંદર્ભ મુજબ નિફાસ તરીકે ઓળખાયેલા સમયગાળા દરમિયાન વિધિવત નમાઝ સ્થગિત રહે છે. AWA રક્તસ્રાવનું આપોઆપ વર્ગીકરણ કરતું નથી અને વ્યક્તિગત નિર્ણય આપતું નથી. આ સમયગાળા માટે ચૂકેલી નમાઝની કોઈ ગણતરી ઉમેરાતી નથી.',
    question3: 'શું હું નિફાસ દરમિયાન રોઝા રાખી શકું?',
    section4Body: 'નિફાસ તરીકે ઓળખાયેલા સમયગાળા દરમિયાન ફરજિયાત રોઝા રાખવામાં આવતા નથી. સંબંધિત દિવસો પછી અનુસરવામાં આવતા સંદર્ભ મુજબ યોગ્ય કઝા દ્વારા પૂરા કરવામાં આવે છે.',
    tip3Title: 'આયોજન, નિર્ણય વિના',
    tip3Text: 'AWA સંબંધિત દિવસોનો હિસાબ રાખવામાં અથવા તેનું આયોજન કરવામાં મદદ કરી શકે છે, વ્યક્તિગત ધાર્મિક નિર્ણય આપ્યા વિના.',
    section5Body: 'ઇબાદત ફરી શરૂ કરવી એ જોવા મળેલા સંકેતો અને અનુસરવામાં આવતા ધાર્મિક સંદર્ભ પર આધાર રાખે છે.',
    steps: [
      'રક્તસ્રાવ બંધ થવાનું અવલોકન કરો',
      'વિધિવત પાકી મેળવો',
      'સંબંધિત ઇબાદત ફરી શરૂ કરો',
    ],
    alert2Title: 'શંકાના કિસ્સામાં',
    alert2Text: 'જો રક્તસ્રાવ અનુસરવામાં આવતા સંદર્ભે અપનાવેલા મહત્તમ સમયગાળાથી વધુ ચાલુ રહે, તો તેની ધાર્મિક સ્થિતિ બદલાઈ શકે છે. લાયક વ્યક્તિનો અભિપ્રાય લેવાની ભલામણ છે.',
    faq: [
      {
        q: 'શું નિફાસ હંમેશાં 40 દિવસ ચાલે છે?',
        a: 'ના. 40 દિવસ વારંવાર વપરાતો સંદર્ભ છે, પરંતુ ફિક્હના સંદર્ભો અલગ હોઈ શકે છે.',
      },
      {
        q: 'જો રક્તસ્રાવ 40 દિવસ પહેલાં બંધ થઈ જાય તો શું કરવું?',
        a: 'ઇબાદત ફરી શરૂ કરવી એ જોવા મળેલા સંકેતો અને અનુસરવામાં આવતા ધાર્મિક સંદર્ભ પર આધાર રાખે છે.',
      },
      {
        q: 'જો રક્તસ્રાવ લાંબા સમય સુધી ચાલુ રહે તો?',
        a: 'જો તે અપનાવેલા મહત્તમ સમયગાળાથી વધી જાય, તો તેની ધાર્મિક સ્થિતિ બદલાઈ શકે છે: લાયક વ્યક્તિનો અભિપ્રાય લો.',
      },
      {
        q: 'શું AWA ચોક્કસ કહી શકે કે મારો રક્તસ્રાવ હજી નિફાસ છે કે નહીં?',
        a: 'ના. AWA સામાન્ય શૈક્ષણિક માપદંડો આપે છે અને ફતવો કે વ્યક્તિગત નિર્ણય આપતું નથી.',
      },
    ],
    alert3Title: 'એક માપદંડ, ફતવો નહીં',
    alert3Text: 'વ્યક્તિગત પરિસ્થિતિઓ અલગ હોઈ શકે છે. શંકા હોય તો લાયક વિદ્વાન અથવા માન્ય ધાર્મિક સંસ્થાનો સંપર્ક કરો.',
    shareMessage: 'ધાર્મિક આચરણમાં નિફાસ — AWA',
  },
  pa: {
    badge: 'ਨਿਫ਼ਾਸ (ਫ਼ਿਕਹ)',
    title: 'ਧਾਰਮਿਕ ਅਮਲ ਵਿੱਚ\nਨਿਫ਼ਾਸ',
    metaDuration: '6 ਮਿੰਟ ਪੜ੍ਹਨ',
    metaType: 'ਅਕਸਰ ਪੁੱਛੇ ਜਾਂਦੇ ਸਵਾਲ',
    metaLevel: 'ਸ਼ੁਰੂਆਤੀ ਪੱਧਰ',
    metaValidated: 'ਸਮੀਖਿਆ ਕੀਤੀ ਸਮੱਗਰੀ',
    intro: 'ਨਿਫ਼ਾਸ, ਉਸ ਦੀ ਮਿਆਦ, ਨਮਾਜ਼, ਰੋਜ਼ਾ ਅਤੇ ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਇਬਾਦਤ ਦੁਬਾਰਾ ਸ਼ੁਰੂ ਕਰਨ ਨੂੰ ਸਮਝਣਾ।',
    disclaimerTitle: 'ਜ਼ਰੂਰੀ ਜਾਣਕਾਰੀ',
    disclaimerText: 'ਇਹ ਸਮੱਗਰੀ ਪੂਰੀ ਤਰ੍ਹਾਂ ਜਾਣਕਾਰੀ ਲਈ ਹੈ। ਧਾਰਮਿਕ ਸਵਾਲਾਂ ਦੀ ਪੁਸ਼ਟੀ ਯੋਗ ਵਿਦਵਾਨਾਂ ਤੋਂ ਕਰਵਾਉਣੀ ਚਾਹੀਦੀ ਹੈ। AWA ਫ਼ਤਵੇ ਜਾਂ ਨਿੱਜੀ ਧਾਰਮਿਕ ਹੁਕਮ ਜਾਰੀ ਨਹੀਂ ਕਰਦਾ।',
    contentsTitle: 'ਇਸ ਲੇਖ ਵਿੱਚ',
    topics: [
      'ਨਿਫ਼ਾਸ ਕੀ ਹੈ?',
      'ਫ਼ਿਕਹ ਦੇ ਹਵਾਲਿਆਂ ਅਨੁਸਾਰ ਇਸ ਦੀ ਮਿਆਦ',
      'ਨਿਫ਼ਾਸ ਦੌਰਾਨ ਨਮਾਜ਼',
      'ਨਿਫ਼ਾਸ ਦੌਰਾਨ ਰੋਜ਼ਾ',
      'ਪਾਕੀ ਅਤੇ ਇਬਾਦਤ ਦੁਬਾਰਾ ਸ਼ੁਰੂ ਕਰਨਾ',
      'ਅਕਸਰ ਪੁੱਛੇ ਜਾਂਦੇ ਸਵਾਲ',
    ],
    section1Body: 'ਧਾਰਮਿਕ ਅਮਲ ਵਿੱਚ, ਨਿਫ਼ਾਸ ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਹੋਣ ਵਾਲੇ ਖ਼ੂਨ ਨਾਲ ਜੁੜੇ ਸਮੇਂ ਨੂੰ ਕਿਹਾ ਜਾਂਦਾ ਹੈ। ਲੋਕੀਆ ਇਸ ਖ਼ੂਨ ਦੇ ਡਾਕਟਰੀ ਅਤੇ ਸਰੀਰਕ ਪੱਖ ਨੂੰ ਦੱਸਦਾ ਹੈ; ਨਿਫ਼ਾਸ ਇਸ ਦੀ ਧਾਰਮਿਕ ਸ਼੍ਰੇਣੀ ਹੈ। ਇਨ੍ਹਾਂ ਦੋਵਾਂ ਧਾਰਨਾਵਾਂ ਨੂੰ ਆਪਸ ਵਿੱਚ ਰਲਾਉਣਾ ਨਹੀਂ ਚਾਹੀਦਾ।',
    tip1Title: 'ਮੁੱਖ ਨੁਕਤਾ',
    tip1Text: 'AWA ਜਾਣਬੁੱਝ ਕੇ ਲੋਕੀਆ ਬਾਰੇ ਡਾਕਟਰੀ ਜਾਣਕਾਰੀ ਨੂੰ ਨਿਫ਼ਾਸ ਬਾਰੇ ਧਾਰਮਿਕ ਹਵਾਲਿਆਂ ਤੋਂ ਵੱਖ ਰੱਖਦਾ ਹੈ।',
    question1: 'ਨਿਫ਼ਾਸ ਕਿੰਨਾ ਚਿਰ ਰਹਿੰਦਾ ਹੈ?',
    section2Body: 'ਵੱਧ ਤੋਂ ਵੱਧ ਮਿਆਦ ਫ਼ਿਕਹ ਦੇ ਮਸਲਕ ਜਾਂ ਅਪਣਾਏ ਗਏ ਧਾਰਮਿਕ ਹਵਾਲੇ ਮੁਤਾਬਕ ਵੱਖ ਹੋ ਸਕਦੀ ਹੈ। 40 ਦਿਨ ਇੱਕ ਆਮ ਤੌਰ \'ਤੇ ਵਰਤਿਆ ਜਾਣ ਵਾਲਾ ਹਵਾਲਾ ਹੈ, ਜਿਸ ਨੂੰ AWA ਸਾਰਿਆਂ ਲਈ ਇੱਕੋ ਜਿਹਾ ਨਿਯਮ ਬਣਾ ਕੇ ਪੇਸ਼ ਨਹੀਂ ਕਰਦਾ।',
    tip2Title: 'ਆਮ ਤੌਰ \'ਤੇ ਵਰਤਿਆ ਜਾਣ ਵਾਲਾ ਹਵਾਲਾ',
    tip2Text: 'ਆਮ ਤੌਰ \'ਤੇ ਵਰਤਿਆ ਜਾਣ ਵਾਲਾ ਹਵਾਲਾ 40 ਦਿਨ ਹੈ, ਪਰ AWA ਇਸ ਅੰਕੜੇ ਨੂੰ ਸਾਰੇ ਮਸਲਕਾਂ ਲਈ ਇੱਕੋ-ਇੱਕ ਸੱਚ ਵਜੋਂ ਪੇਸ਼ ਨਹੀਂ ਕਰਦਾ। ਤੁਸੀਂ ਜਿਸ ਧਾਰਮਿਕ ਹਵਾਲੇ ਨੂੰ ਚੁਣਿਆ ਹੈ, ਉਸ ਦੀ ਪਾਲਣਾ ਕਰੋ।',
    question2: 'ਕੀ ਮੈਨੂੰ ਨਿਫ਼ਾਸ ਦੌਰਾਨ ਨਮਾਜ਼ ਪੜ੍ਹਨੀ ਚਾਹੀਦੀ ਹੈ?',
    section3Body: 'ਅਪਣਾਏ ਗਏ ਹਵਾਲੇ ਅਨੁਸਾਰ ਜਿਸ ਸਮੇਂ ਨੂੰ ਨਿਫ਼ਾਸ ਮੰਨਿਆ ਜਾਂਦਾ ਹੈ, ਉਸ ਦੌਰਾਨ ਰਸਮੀ ਨਮਾਜ਼ ਮੁਲਤਵੀ ਰਹਿੰਦੀ ਹੈ। AWA ਖ਼ੂਨ ਨੂੰ ਆਪਣੇ-ਆਪ ਵਰਗੀਕ੍ਰਿਤ ਨਹੀਂ ਕਰਦਾ ਅਤੇ ਨਿੱਜੀ ਫ਼ੈਸਲਾ ਨਹੀਂ ਦਿੰਦਾ। ਇਸ ਸਮੇਂ ਲਈ ਛੁੱਟੀਆਂ ਨਮਾਜ਼ਾਂ ਦਾ ਕੋਈ ਕਾਊਂਟਰ ਨਹੀਂ ਜੋੜਿਆ ਜਾਂਦਾ।',
    question3: 'ਕੀ ਮੈਂ ਨਿਫ਼ਾਸ ਦੌਰਾਨ ਰੋਜ਼ਾ ਰੱਖ ਸਕਦੀ ਹਾਂ?',
    section4Body: 'ਫ਼ਰਜ਼ ਰੋਜ਼ਾ ਉਸ ਸਮੇਂ ਦੌਰਾਨ ਨਹੀਂ ਰੱਖਿਆ ਜਾਂਦਾ ਜਿਸ ਨੂੰ ਨਿਫ਼ਾਸ ਮੰਨਿਆ ਜਾਵੇ। ਸਬੰਧਤ ਦਿਨਾਂ ਦੀ ਭਰਪਾਈ ਫਿਰ ਅਪਣਾਏ ਗਏ ਹਵਾਲੇ ਅਨੁਸਾਰ ਢੁਕਵੇਂ ਕਜ਼ਾ ਰਾਹੀਂ ਕੀਤੀ ਜਾਂਦੀ ਹੈ।',
    tip3Title: 'ਤਰਤੀਬ ਦੇਣਾ, ਫ਼ੈਸਲਾ ਨਹੀਂ',
    tip3Text: 'AWA ਸਬੰਧਤ ਦਿਨਾਂ ਦਾ ਹਿਸਾਬ ਰੱਖਣ ਜਾਂ ਉਨ੍ਹਾਂ ਨੂੰ ਤਰਤੀਬ ਦੇਣ ਵਿੱਚ ਤੁਹਾਡੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹੈ, ਪਰ ਕੋਈ ਨਿੱਜੀ ਧਾਰਮਿਕ ਫ਼ੈਸਲਾ ਜਾਰੀ ਨਹੀਂ ਕਰਦਾ।',
    section5Body: 'ਦੁਬਾਰਾ ਸ਼ੁਰੂ ਕਰਨਾ ਦੇਖੇ ਗਏ ਸੰਕੇਤਾਂ ਅਤੇ ਅਪਣਾਏ ਗਏ ਧਾਰਮਿਕ ਹਵਾਲੇ \'ਤੇ ਨਿਰਭਰ ਕਰਦਾ ਹੈ।',
    steps: [
      'ਖ਼ੂਨ ਦੇ ਰੁਕਣ ਨੂੰ ਧਿਆਨ ਨਾਲ ਦੇਖੋ',
      'ਰਸਮੀ ਪਾਕੀ (ਗ਼ੁਸਲ) ਕਰੋ',
      'ਸਬੰਧਤ ਇਬਾਦਤ ਦੁਬਾਰਾ ਸ਼ੁਰੂ ਕਰੋ',
    ],
    alert2Title: 'ਸ਼ੱਕ ਦੀ ਸੂਰਤ ਵਿੱਚ',
    alert2Text: 'ਜੇ ਖ਼ੂਨ ਅਪਣਾਏ ਗਏ ਹਵਾਲੇ ਦੀ ਵੱਧ ਤੋਂ ਵੱਧ ਮਿਆਦ ਤੋਂ ਬਾਅਦ ਵੀ ਜਾਰੀ ਰਹੇ, ਤਾਂ ਇਸ ਦੀ ਧਾਰਮਿਕ ਸਥਿਤੀ ਬਦਲ ਸਕਦੀ ਹੈ। ਕਿਸੇ ਯੋਗ ਵਿਦਵਾਨ ਦੀ ਰਾਇ ਲੈਣ ਦੀ ਸਿਫ਼ਾਰਸ਼ ਕੀਤੀ ਜਾਂਦੀ ਹੈ।',
    faq: [
      {
        q: 'ਕੀ ਨਿਫ਼ਾਸ ਹਮੇਸ਼ਾ 40 ਦਿਨ ਰਹਿੰਦਾ ਹੈ?',
        a: 'ਨਹੀਂ। 40 ਦਿਨ ਆਮ ਤੌਰ \'ਤੇ ਵਰਤਿਆ ਜਾਣ ਵਾਲਾ ਹਵਾਲਾ ਹੈ, ਪਰ ਫ਼ਿਕਹ ਦੇ ਹਵਾਲੇ ਵੱਖ ਹੋ ਸਕਦੇ ਹਨ।',
      },
      {
        q: 'ਜੇ 40 ਦਿਨਾਂ ਤੋਂ ਪਹਿਲਾਂ ਖ਼ੂਨ ਰੁਕ ਜਾਵੇ ਤਾਂ ਕੀ ਕਰਨਾ ਚਾਹੀਦਾ ਹੈ?',
        a: 'ਇਬਾਦਤ ਦੁਬਾਰਾ ਸ਼ੁਰੂ ਕਰਨਾ ਦੇਖੇ ਗਏ ਸੰਕੇਤਾਂ ਅਤੇ ਅਪਣਾਏ ਗਏ ਧਾਰਮਿਕ ਹਵਾਲੇ \'ਤੇ ਨਿਰਭਰ ਕਰਦਾ ਹੈ।',
      },
      {
        q: 'ਜੇ ਖ਼ੂਨ ਲੰਮੇ ਸਮੇਂ ਤੱਕ ਜਾਰੀ ਰਹੇ ਤਾਂ ਕੀ ਹੋਵੇਗਾ?',
        a: 'ਜੇ ਇਹ ਅਪਣਾਈ ਗਈ ਵੱਧ ਤੋਂ ਵੱਧ ਮਿਆਦ ਤੋਂ ਵਧ ਜਾਵੇ, ਤਾਂ ਇਸ ਦੀ ਧਾਰਮਿਕ ਸਥਿਤੀ ਬਦਲ ਸਕਦੀ ਹੈ: ਕਿਸੇ ਯੋਗ ਵਿਦਵਾਨ ਦੀ ਰਾਇ ਲਓ।',
      },
      {
        q: 'ਕੀ AWA ਠੀਕ-ਠੀਕ ਦੱਸ ਸਕਦਾ ਹੈ ਕਿ ਮੇਰਾ ਖ਼ੂਨ ਅਜੇ ਵੀ ਨਿਫ਼ਾਸ ਹੈ ਜਾਂ ਨਹੀਂ?',
        a: 'ਨਹੀਂ। AWA ਆਮ ਜਾਣਕਾਰੀ ਵਾਲੇ ਹਵਾਲੇ ਦਿੰਦਾ ਹੈ ਅਤੇ ਫ਼ਤਵਾ ਜਾਂ ਨਿੱਜੀ ਫ਼ੈਸਲਾ ਜਾਰੀ ਨਹੀਂ ਕਰਦਾ।',
      },
    ],
    alert3Title: 'ਇੱਕ ਹਵਾਲਾ, ਫ਼ਤਵਾ ਨਹੀਂ',
    alert3Text: 'ਨਿੱਜੀ ਹਾਲਾਤ ਵੱਖ ਹੋ ਸਕਦੇ ਹਨ। ਸ਼ੱਕ ਦੀ ਸੂਰਤ ਵਿੱਚ ਕਿਸੇ ਯੋਗ ਵਿਦਵਾਨ ਜਾਂ ਮਾਨਤਾ ਪ੍ਰਾਪਤ ਧਾਰਮਿਕ ਸੰਸਥਾ ਨਾਲ ਸੰਪਰਕ ਕਰੋ।',
    shareMessage: 'ਧਾਰਮਿਕ ਅਮਲ ਵਿੱਚ ਨਿਫ਼ਾਸ — AWA',
  },
  my: {
    badge: 'နီဖာစ် (ဖစ်ခ်ဟ်)',
    title: 'ဘာသာရေးအလေ့အကျင့်တွင်\nနီဖာစ်',
    metaDuration: 'ဖတ်ချိန် 6 မိနစ်',
    metaType: 'မကြာခဏမေးလေ့ရှိသော မေးခွန်းများ',
    metaLevel: 'အခြေခံအဆင့်',
    metaValidated: 'ပြန်လည်သုံးသပ်ပြီး အကြောင်းအရာ',
    intro: 'နီဖာစ်၊ ၎င်း၏ကြာချိန်၊ ဆွလာသ်၊ ရိုဇာနှင့် ကလေးမွေးဖွားပြီးနောက် ဣဗာဒသ်ဆိုင်ရာ လုပ်ငန်းများ ပြန်လည်စတင်ခြင်းကို နားလည်ခြင်း။',
    disclaimerTitle: 'အရေးကြီးသော အချက်အလက်',
    disclaimerText: 'ဤအကြောင်းအရာသည် ပညာပေးရန်သက်သက်ဖြစ်သည်။ ဘာသာရေးဆိုင်ရာ မေးခွန်းများကို အရည်အချင်းပြည့်မီသော ပညာရှင်များ (ဥလမာများ) ဖြင့် အတည်ပြုသင့်သည်။ AWA သည် ဖတ်ဝါများ သို့မဟုတ် ကိုယ်ပိုင်ဘာသာရေးဆုံးဖြတ်ချက်များ မထုတ်ပြန်ပါ။',
    contentsTitle: 'ဤဆောင်းပါးတွင်',
    topics: [
      'နီဖာစ်ဆိုသည်မှာ အဘယ်နည်း။',
      'ဖစ်ခ်ဟ်ကိုးကားချက်များအလိုက် ၎င်း၏ကြာချိန်',
      'နီဖာစ်အတွင်း ဆွလာသ်',
      'နီဖာစ်အတွင်း ရိုဇာ',
      'သန့်ရှင်းမှုနှင့် ဣဗာဒသ်လုပ်ငန်းများ ပြန်လည်စတင်ခြင်း',
      'မကြာခဏမေးလေ့ရှိသော မေးခွန်းများ',
    ],
    section1Body: 'ဘာသာရေးအလေ့အကျင့်တွင် နီဖာစ်ဆိုသည်မှာ ကလေးမွေးဖွားပြီးနောက် သွေးထွက်ခြင်းနှင့် ဆက်စပ်သော ကာလကို ရည်ညွှန်းသည်။ မီးဖွားပြီးနောက်သွေးသည် ဤသွေးထွက်ခြင်း၏ ဆေးဘက်ဆိုင်ရာနှင့် ဇီဝဗေဒဆိုင်ရာ ရှုထောင့်ကို ဖော်ပြပြီး နီဖာစ်မှာ ၎င်း၏ ဘာသာရေးအမျိုးအစားခွဲခြားမှုဖြစ်သည်။ ဤအယူအဆနှစ်ခုကို မရောထွေးသင့်ပါ။',
    tip1Title: 'အဓိကအချက်',
    tip1Text: 'AWA သည် မီးဖွားပြီးနောက်သွေးအကြောင်း ဆေးဘက်ဆိုင်ရာအချက်အလက်များကို နီဖာစ်အကြောင်း ဘာသာရေးအမှတ်အသားများနှင့် ရည်ရွယ်ချက်ရှိရှိ ခွဲထားသည်။',
    question1: 'နီဖာစ်သည် ဘယ်လောက်ကြာသလဲ။',
    section2Body: 'အများဆုံးကြာချိန်သည် လိုက်နာသော ဖစ်ခ်ဟ်ဆိုင်ရာ ဂိုဏ်း သို့မဟုတ် ဘာသာရေးကိုးကားချက်အလိုက် ကွဲပြားနိုင်သည်။ 40 ရက်သည် မကြာခဏသုံးသော ကိုးကားချက်ဖြစ်သော်လည်း AWA က ၎င်းကို ဆက်စပ်ကျယ်ပြန့်သော စည်းမျဉ်းတစ်ခုအဖြစ် မတင်ပြပါ။',
    tip2Title: 'မကြာခဏသုံးသော အမှတ်အသား',
    tip2Text: 'မကြာခဏသုံးသော ကိုးကားချက်မှာ 40 ရက်ဖြစ်သော်လည်း AWA သည် ဤကိန်းဂဏန်းကို ဖစ်ခ်ဟ်ဂိုဏ်းအားလုံးအတွက် တစ်ခုတည်းသော အမှန်တရားအဖြစ် မတင်ပြပါ။ သင်ရွေးချယ်ထားသော ဘာသာရေးကိုးကားချက်ကို လိုက်နာပါ။',
    question2: 'နီဖာစ်အတွင်း ဆွလာသ်ကျင့်သင့်သလား။',
    section3Body: 'လိုက်နာသော ကိုးကားချက်အရ နီဖာစ်ဟု သတ်မှတ်သော ကာလအတွင်း ဆွလာသ်ကို ရပ်ထားသည်။ AWA သည် သွေးထွက်ခြင်းကို အလိုအလျောက် အမျိုးအစားမခွဲဘဲ ကိုယ်ပိုင်ဆုံးဖြတ်ချက်လည်း မပေးပါ။ ဤကာလအတွက် မကျင့်ခဲ့သော ဆွလာသ်ကောင်တာ မထည့်ပါ။',
    question3: 'နီဖာစ်အတွင်း ရိုဇာထားနိုင်သလား။',
    section4Body: 'မဖြစ်မနေ ရိုဇာကို နီဖာစ်ဟု သတ်မှတ်သော ကာလအတွင်း မထားပါ။ သက်ဆိုင်သောရက်များကို လိုက်နာသော ကိုးကားချက်အရ သင့်လျော်သော ကဇာဖြင့် ဆောင်ရွက်သည်။',
    tip3Title: 'ဆုံးဖြတ်ခြင်းမပြုဘဲ စီစဉ်ခြင်း',
    tip3Text: 'AWA သည် ကိုယ်ပိုင်ဘာသာရေးဆုံးဖြတ်ချက် မထုတ်ပြန်ဘဲ သက်ဆိုင်သောရက်များကို မှတ်တမ်းတင်ရန် သို့မဟုတ် စီစဉ်ရန် ကူညီနိုင်သည်။',
    section5Body: 'ပြန်လည်စတင်ခြင်းသည် တွေ့ရှိသော လက္ခဏာများနှင့် လိုက်နာသော ဘာသာရေးကိုးကားချက်ပေါ် မူတည်သည်။',
    steps: [
      'သွေးထွက်ခြင်း ပြီးဆုံးသည်ကို လေ့လာပါ',
      'ဂုစ်လ်ဖြင့် သန့်ရှင်းမှုပြုလုပ်ပါ',
      'သက်ဆိုင်သော ဣဗာဒသ်လုပ်ငန်းများကို ပြန်လည်စတင်ပါ',
    ],
    alert2Title: 'သံသယရှိလျှင်',
    alert2Text: 'လိုက်နာသောကိုးကားချက်က ခံယူထားသော အများဆုံးကြာချိန်ထက် သွေးထွက်ခြင်း ကျော်လွန်၍ ဆက်ရှိနေလျှင် ၎င်း၏ ဘာသာရေးအဆင့်အတန်း ပြောင်းလဲနိုင်သည်။ အရည်အချင်းပြည့်မီသူ၏ ထင်မြင်ချက်ကို အကြံပြုသည်။',
    faq: [
      {
        q: 'နီဖာစ်သည် အမြဲတမ်း 40 ရက် ကြာသလား။',
        a: 'မကြာပါ။ 40 ရက်သည် မကြာခဏသုံးသော ကိုးကားချက်ဖြစ်သော်လည်း ဖစ်ခ်ဟ်ဆိုင်ရာ ကိုးကားချက်များ ကွဲပြားနိုင်သည်။',
      },
      {
        q: 'သွေးထွက်ခြင်း 40 ရက်မတိုင်မီ ရပ်သွားလျှင် ဘာလုပ်သင့်သလဲ။',
        a: 'ဣဗာဒသ်လုပ်ငန်းများ ပြန်လည်စတင်ခြင်းသည် တွေ့ရှိသော လက္ခဏာများနှင့် လိုက်နာသော ဘာသာရေးကိုးကားချက်ပေါ် မူတည်သည်။',
      },
      {
        q: 'သွေးထွက်ခြင်း ကြာရှည်စွာ ဆက်ရှိနေလျှင် ဘာဖြစ်မလဲ။',
        a: 'ခံယူထားသော အများဆုံးကြာချိန်ကို ကျော်လွန်လျှင် ၎င်း၏ ဘာသာရေးအဆင့်အတန်း ပြောင်းလဲနိုင်သည်- အရည်အချင်းပြည့်မီသူ၏ ထင်မြင်ချက်ကို တောင်းပါ။',
      },
      {
        q: 'ကျွန်မ၏ သွေးထွက်ခြင်းသည် နီဖာစ်ဆက်ဖြစ်နေသေးသလားဆိုသည်ကို AWA က အတိအကျ ပြောနိုင်သလား။',
        a: 'မပြောနိုင်ပါ။ AWA သည် ယေဘုယျ ပညာပေးအမှတ်အသားများကိုသာ ပေးပြီး ဖတ်ဝါ သို့မဟုတ် ကိုယ်ပိုင်ဆုံးဖြတ်ချက် မထုတ်ပြန်ပါ။',
      },
    ],
    alert3Title: 'အမှတ်အသားတစ်ခု၊ ဖတ်ဝါမဟုတ်',
    alert3Text: 'ကိုယ်ရေးကိုယ်တာ အခြေအနေများ ကွဲပြားနိုင်သည်။ သံသယရှိလျှင် အရည်အချင်းပြည့်မီသော ပညာရှင် သို့မဟုတ် အသိအမှတ်ပြုထားသော ဘာသာရေးအဖွဲ့အစည်းကို ဆက်သွယ်ပါ။',
    shareMessage: 'ဘာသာရေးအလေ့အကျင့်တွင် နီဖာစ် — AWA',
  },
  km: {
    badge: 'និហ្វាស់ (ហ្វិកហ៍)',
    title: 'និហ្វាស់ក្នុង\nការប្រតិបត្តិសាសនា',
    metaDuration: 'អាន 6 នាទី',
    metaType: 'សំណួរដែលសួរញឹកញាប់',
    metaLevel: 'កម្រិតដំបូង',
    metaValidated: 'មាតិកាបានពិនិត្យ',
    intro: 'ការយល់ដឹងអំពីនិហ្វាស់ រយៈពេលរបស់វា សឡាត់ ការបួស និងការបន្តប្រតិបត្តិការគោរពប្រណិប័តន៍ឡើងវិញក្រោយការសម្រាលកូន។',
    disclaimerTitle: 'ព័ត៌មានសំខាន់',
    disclaimerText: 'មាតិកានេះមានគោលបំណងអប់រំតែប៉ុណ្ណោះ។ សំណួរខាងសាសនាគួរតែត្រូវបានបញ្ជាក់ដោយអ្នកប្រាជ្ញសាសនាដែលមានសមត្ថភាព។ AWA មិនចេញហ្វាតវ៉ា ឬសេចក្តីសម្រេចខាងសាសនាផ្ទាល់ខ្លួនឡើយ។',
    contentsTitle: 'ក្នុងអត្ថបទនេះ',
    topics: [
      'និហ្វាស់ជាអ្វី?',
      'រយៈពេលរបស់វាតាមឯកសារយោងខាងនីតិសាស្ត្រ',
      'សឡាត់ក្នុងអំឡុងនិហ្វាស់',
      'ការបួសក្នុងអំឡុងនិហ្វាស់',
      'ការជំរះកាយ និងការបន្តការគោរពប្រណិប័តន៍ឡើងវិញ',
      'សំណួរដែលសួរញឹកញាប់',
    ],
    section1Body: 'ក្នុងការប្រតិបត្តិសាសនា និហ្វាស់សំដៅលើរយៈពេលដែលទាក់ទងនឹងការហូរឈាមក្រោយការសម្រាលកូន។ ឈាមក្រោយសម្រាលពិពណ៌នាអំពីផ្នែកវេជ្ជសាស្ត្រ និងសរីរវិទ្យានៃការហូរឈាមនេះ ចំណែកនិហ្វាស់គឺជាការចាត់ថ្នាក់តាមសាសនារបស់វា។ គំនិតទាំងពីរនេះមិនគួរច្រលំគ្នាទេ។',
    tip1Title: 'ចំណុចសំខាន់',
    tip1Text: 'AWA បំបែកព័ត៌មានវេជ្ជសាស្ត្រអំពីឈាមក្រោយសម្រាល ចេញពីចំណុចយោងខាងសាសនាអំពីនិហ្វាស់ដោយចេតនា។',
    question1: 'តើនិហ្វាស់មានរយៈពេលប៉ុន្មាន?',
    section2Body: 'រយៈពេលអតិបរមាអាចខុសគ្នាតាមសាលាគតិនីតិសាស្ត្រ ឬឯកសារយោងខាងសាសនាដែលត្រូវបានអនុវត្តតាម។ 40 ថ្ងៃគឺជាឯកសារយោងដែលប្រើញឹកញាប់ ដោយ AWA មិនបង្ហាញថាជាច្បាប់សកលឡើយ។',
    tip2Title: 'ចំណុចយោងដែលប្រើជាទូទៅ',
    tip2Text: 'ឯកសារយោងដែលប្រើញឹកញាប់គឺ 40 ថ្ងៃ ប៉ុន្តែ AWA មិនបង្ហាញលេខនេះថាជាសេចក្តីពិតតែមួយសម្រាប់គ្រប់សាលាគតិនីតិសាស្ត្រឡើយ។ សូមអនុវត្តតាមឯកសារយោងខាងសាសនាដែលអ្នកបានជ្រើសរើស។',
    question2: 'តើខ្ញុំត្រូវសឡាត់ក្នុងអំឡុងនិហ្វាស់ឬទេ?',
    section3Body: 'ក្នុងអំឡុងពេលដែលត្រូវបានទទួលស្គាល់ថាជានិហ្វាស់តាមឯកសារយោងដែលអនុវត្តតាម សឡាត់តាមពិធីត្រូវបានផ្អាក។ AWA មិនចាត់ថ្នាក់ការហូរឈាមដោយស្វ័យប្រវត្តិ ហើយមិនផ្តល់សេចក្តីសម្រេចផ្ទាល់ខ្លួនឡើយ។ គ្មានការរាប់សឡាត់ដែលខកខានត្រូវបានបន្ថែមសម្រាប់រយៈពេលនេះទេ។',
    question3: 'តើខ្ញុំអាចបួសក្នុងអំឡុងនិហ្វាស់បានឬទេ?',
    section4Body: 'ការបួសកាតព្វកិច្ចមិនត្រូវបានអនុវត្តក្នុងអំឡុងពេលដែលត្រូវបានទទួលស្គាល់ថាជានិហ្វាស់ឡើយ។ បន្ទាប់មក ថ្ងៃដែលពាក់ព័ន្ធត្រូវបានដោះស្រាយតាមរយៈការបួសសងវិញដែលសមស្រប តាមឯកសារយោងដែលអនុវត្តតាម។',
    tip3Title: 'ការរៀបចំ ដោយមិនសម្រេចជំនួស',
    tip3Text: 'AWA អាចជួយអ្នកតាមដាន ឬរៀបចំថ្ងៃដែលពាក់ព័ន្ធ ដោយមិនចេញសេចក្តីសម្រេចខាងសាសនាផ្ទាល់ខ្លួនឡើយ។',
    section5Body: 'ការបន្តឡើងវិញអាស្រ័យលើសញ្ញាដែលបានសង្កេតឃើញ និងឯកសារយោងខាងសាសនាដែលអនុវត្តតាម។',
    steps: [
      'សង្កេតមើលការឈប់ហូរឈាម',
      'អនុវត្តការងូតទឹកជំរះតាមពិធី',
      'បន្តការគោរពប្រណិប័តន៍ដែលពាក់ព័ន្ធឡើងវិញ',
    ],
    alert2Title: 'ក្នុងករណីសង្ស័យ',
    alert2Text: 'ប្រសិនបើការហូរឈាមបន្តលើសពីរយៈពេលអតិបរមាដែលឯកសារយោងដែលអនុវត្តតាមបានកំណត់ ស្ថានភាពខាងសាសនារបស់វាអាចផ្លាស់ប្តូរ។ ការសុំយោបល់ពីអ្នកមានសមត្ថភាពត្រូវបានណែនាំ។',
    faq: [
      {
        q: 'តើនិហ្វាស់មានរយៈពេល 40 ថ្ងៃជានិច្ចឬទេ?',
        a: 'ទេ។ 40 ថ្ងៃគឺជាឯកសារយោងដែលប្រើញឹកញាប់ ប៉ុន្តែឯកសារយោងខាងនីតិសាស្ត្រអាចខុសគ្នា។',
      },
      {
        q: 'តើខ្ញុំត្រូវធ្វើអ្វី ប្រសិនបើការហូរឈាមឈប់មុន 40 ថ្ងៃ?',
        a: 'ការបន្តការគោរពប្រណិប័តន៍ឡើងវិញអាស្រ័យលើសញ្ញាដែលបានសង្កេតឃើញ និងឯកសារយោងខាងសាសនាដែលអនុវត្តតាម។',
      },
      {
        q: 'ចុះប្រសិនបើការហូរឈាមបន្តយូរ?',
        a: 'ប្រសិនបើវាលើសពីរយៈពេលអតិបរមាដែលបានកំណត់ ស្ថានភាពខាងសាសនារបស់វាអាចផ្លាស់ប្តូរ៖ សូមសុំយោបល់ពីអ្នកមានសមត្ថភាព។',
      },
      {
        q: 'តើ AWA អាចប្រាប់ច្បាស់ថាការហូរឈាមរបស់ខ្ញុំនៅតែជានិហ្វាស់ឬទេ?',
        a: 'ទេ។ AWA ផ្តល់ចំណុចយោងអប់រំទូទៅ ហើយមិនចេញហ្វាតវ៉ា ឬសេចក្តីសម្រេចផ្ទាល់ខ្លួនឡើយ។',
      },
    ],
    alert3Title: 'ចំណុចយោង មិនមែនហ្វាតវ៉ាទេ',
    alert3Text: 'ស្ថានភាពផ្ទាល់ខ្លួនអាចខុសគ្នា។ ក្នុងករណីសង្ស័យ សូមទាក់ទងអ្នកប្រាជ្ញសាសនាដែលមានសមត្ថភាព ឬអង្គការសាសនាដែលមានការទទួលស្គាល់។',
    shareMessage: 'និហ្វាស់ក្នុងការប្រតិបត្តិសាសនា — AWA',
  },
  lo: {
    badge: 'ນີຟາດ (ຟິກຮ໌)',
    title: 'ນີຟາດໃນ\nການປະຕິບັດທາງສາສະໜາ',
    metaDuration: 'ອ່ານ 6 ນາທີ',
    metaType: 'ຄຳຖາມທີ່ພົບເລື້ອຍ',
    metaLevel: 'ລະດັບເລີ່ມຕົ້ນ',
    metaValidated: 'ເນື້ອຫາທີ່ຜ່ານການກວດສອບ',
    intro: 'ເຂົ້າໃຈນີຟາດ, ໄລຍະເວລາ, ການລະໝາດ, ການຖືສິນອົດ ແລະ ການກັບມາປະຕິບັດການນະມັດສະການຫຼັງການເກີດລູກ.',
    disclaimerTitle: 'ຂໍ້ມູນສຳຄັນ',
    disclaimerText: 'ເນື້ອຫານີ້ມີຈຸດປະສົງເພື່ອການສຶກສາເທົ່ານັ້ນ. ຄຳຖາມທາງສາສະໜາຄວນໄດ້ຮັບການຢືນຢັນຈາກນັກປາດສາສະໜາທີ່ມີຄຸນວຸດທິ. AWA ບໍ່ອອກຟັດວາ ຫຼື ຄຳຕັດສິນທາງສາສະໜາສະເພາະບຸກຄົນ.',
    contentsTitle: 'ໃນບົດຄວາມນີ້',
    topics: [
      'ນີຟາດແມ່ນຫຍັງ?',
      'ໄລຍະເວລາຕາມແຫຼ່ງອ້າງອີງທາງນິຕິສາດອິດສະລາມ',
      'ການລະໝາດໃນໄລຍະນີຟາດ',
      'ການຖືສິນອົດໃນໄລຍະນີຟາດ',
      'ການຊຳລະລ້າງ ແລະ ການກັບມາປະຕິບັດການນະມັດສະການ',
      'ຄຳຖາມທີ່ພົບເລື້ອຍ',
    ],
    section1Body: 'ໃນການປະຕິບັດທາງສາສະໜາ, ນີຟາດໝາຍເຖິງໄລຍະທີ່ກ່ຽວຂ້ອງກັບການມີເລືອດອອກຫຼັງການເກີດລູກ. ເລືອດຫຼັງຄອດອະທິບາຍດ້ານການແພດ ແລະ ດ້ານສະລີລະວິທະຍາຂອງເລືອດທີ່ອອກນີ້; ນີຟາດແມ່ນການຈັດປະເພດທາງສາສະໜາຂອງມັນ. ສອງແນວຄິດນີ້ບໍ່ຄວນສັບສົນກັນ.',
    tip1Title: 'ຈຸດສຳຄັນ',
    tip1Text: 'AWA ແຍກຂໍ້ມູນທາງການແພດກ່ຽວກັບເລືອດຫຼັງຄອດອອກຈາກຕົວຊີ້ວັດທາງສາສະໜາກ່ຽວກັບນີຟາດຢ່າງຕັ້ງໃຈ.',
    question1: 'ນີຟາດດົນເທົ່າໃດ?',
    section2Body: 'ໄລຍະເວລາສູງສຸດອາດແຕກຕ່າງກັນຕາມສຳນັກນິຕິສາດ ຫຼື ແຫຼ່ງອ້າງອີງທາງສາສະໜາທີ່ຕິດຕາມ. 40 ວັນເປັນຕົວອ້າງອີງທີ່ໃຊ້ກັນເລື້ອຍໆ, ໂດຍ AWA ບໍ່ໄດ້ນຳສະເໜີເປັນກົດທົ່ວໄປ.',
    tip2Title: 'ຕົວຊີ້ວັດທີ່ໃຊ້ກັນທົ່ວໄປ',
    tip2Text: 'ຕົວອ້າງອີງທີ່ໃຊ້ກັນເລື້ອຍໆແມ່ນ 40 ວັນ, ແຕ່ AWA ບໍ່ນຳສະເໜີຕົວເລກນີ້ວ່າເປັນຄວາມຈິງດຽວສຳລັບທຸກສຳນັກນິຕິສາດ. ໃຫ້ຕິດຕາມແຫຼ່ງອ້າງອີງທາງສາສະໜາທີ່ທ່ານເລືອກ.',
    question2: 'ຂ້ອຍຕ້ອງລະໝາດໃນໄລຍະນີຟາດບໍ?',
    section3Body: 'ໃນໄລຍະທີ່ຖືວ່າເປັນນີຟາດຕາມແຫຼ່ງອ້າງອີງທີ່ຕິດຕາມ, ການລະໝາດຕາມພິທີຈະຖືກງົດໄວ້. AWA ບໍ່ຈັດປະເພດເລືອດທີ່ອອກໂດຍອັດຕະໂນມັດ ແລະ ບໍ່ໃຫ້ຄຳຕັດສິນສະເພາະບຸກຄົນ. ບໍ່ມີການເພີ່ມຕົວນັບການລະໝາດທີ່ຂາດສຳລັບໄລຍະນີ້.',
    question3: 'ຂ້ອຍຖືສິນອົດໃນໄລຍະນີຟາດໄດ້ບໍ?',
    section4Body: 'ການຖືສິນອົດທີ່ເປັນຂໍ້ບັງຄັບບໍ່ປະຕິບັດໃນໄລຍະທີ່ຖືວ່າເປັນນີຟາດ. ວັນທີ່ກ່ຽວຂ້ອງຈະຖືກຈັດການດ້ວຍການຖືສິນອົດຊົດທີ່ເໝາະສົມ, ຕາມແຫຼ່ງອ້າງອີງທີ່ຕິດຕາມ.',
    tip3Title: 'ການຈັດລະບຽບ, ໂດຍບໍ່ຕັດສິນ',
    tip3Text: 'AWA ສາມາດຊ່ວຍທ່ານຕິດຕາມ ຫຼື ຈັດລະບຽບວັນທີ່ກ່ຽວຂ້ອງ, ໂດຍບໍ່ໃຫ້ຄຳຕັດສິນທາງສາສະໜາສະເພາະບຸກຄົນ.',
    section5Body: 'ການກັບມາປະຕິບັດຂຶ້ນກັບສັນຍານທີ່ສັງເກດເຫັນ ແລະ ແຫຼ່ງອ້າງອີງທາງສາສະໜາທີ່ຕິດຕາມ.',
    steps: [
      'ສັງເກດການສິ້ນສຸດຂອງເລືອດທີ່ອອກ',
      'ເຮັດການຊຳລະລ້າງຕາມພິທີ',
      'ກັບມາປະຕິບັດການນະມັດສະການທີ່ກ່ຽວຂ້ອງ',
    ],
    alert2Title: 'ໃນກໍລະນີສົງໄສ',
    alert2Text: 'ຖ້າເລືອດຍັງອອກເກີນໄລຍະເວລາສູງສຸດທີ່ແຫຼ່ງອ້າງອີງທີ່ຕິດຕາມຍອມຮັບ, ສະຖານະທາງສາສະໜາຂອງມັນອາດປ່ຽນແປງ. ແນະນຳໃຫ້ຂໍຄວາມເຫັນຈາກຜູ້ມີຄຸນວຸດທິ.',
    faq: [
      {
        q: 'ນີຟາດດົນ 40 ວັນສະເໝີບໍ?',
        a: 'ບໍ່. 40 ວັນເປັນຕົວອ້າງອີງທີ່ໃຊ້ກັນເລື້ອຍໆ, ແຕ່ແຫຼ່ງອ້າງອີງທາງນິຕິສາດອາດແຕກຕ່າງກັນ.',
      },
      {
        q: 'ຄວນເຮັດແນວໃດຖ້າເລືອດຢຸດກ່ອນ 40 ວັນ?',
        a: 'ການກັບມາປະຕິບັດການນະມັດສະການຂຶ້ນກັບສັນຍານທີ່ສັງເກດເຫັນ ແລະ ແຫຼ່ງອ້າງອີງທາງສາສະໜາທີ່ຕິດຕາມ.',
      },
      {
        q: 'ຈະເປັນແນວໃດຖ້າເລືອດອອກຕໍ່ເນື່ອງດົນ?',
        a: 'ຖ້າເກີນໄລຍະເວລາສູງສຸດທີ່ຍອມຮັບ, ສະຖານະທາງສາສະໜາຂອງມັນອາດປ່ຽນແປງ: ໃຫ້ຂໍຄວາມເຫັນຈາກຜູ້ມີຄຸນວຸດທິ.',
      },
      {
        q: 'AWA ບອກໄດ້ແນ່ນອນບໍວ່າເລືອດຂອງຂ້ອຍຍັງເປັນນີຟາດຢູ່?',
        a: 'ບໍ່ໄດ້. AWA ໃຫ້ຕົວຊີ້ວັດທົ່ວໄປເພື່ອການສຶກສາ ແລະ ບໍ່ອອກຟັດວາ ຫຼື ຄຳຕັດສິນສະເພາະບຸກຄົນ.',
      },
    ],
    alert3Title: 'ເປັນຕົວຊີ້ວັດ, ບໍ່ແມ່ນຟັດວາ',
    alert3Text: 'ສະຖານະການສ່ວນບຸກຄົນອາດແຕກຕ່າງກັນ. ໃນກໍລະນີສົງໄສ, ໃຫ້ຕິດຕໍ່ນັກປາດສາສະໜາທີ່ມີຄຸນວຸດທິ ຫຼື ອົງກອນທາງສາສະໜາທີ່ເປັນທີ່ຍອມຮັບ.',
    shareMessage: 'ນີຟາດໃນການປະຕິບັດທາງສາສະໜາ — AWA',
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
