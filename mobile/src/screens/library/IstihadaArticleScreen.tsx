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

const ID = 'istihada-comprendre-les-saignements';

const HERO = require('../../assets/images/library/featured-tracking-hero.png');

const ART = {
  observe: require('../../assets/images/library/flow-texture-creamy.png'),
};

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
//
// RELIGIOUS CONTENT: "Istihâda" is kept untranslated in both languages
// (it is an Islamic jurisprudence term, not a generic word for bleeding).
// Every hedge ("généralement" / "generally", "selon les écoles
// juridiques" / "according to the schools of jurisprudence", "parfois" /
// "sometimes") and every scholarly-attribution phrase is preserved as-is
// across languages — no ruling is stated more strongly in English than in
// the French source.
const CONTENT = withBrazilianPortuguese('Istihada', {
  fr: {
    badge: 'ISTIHÂDA',
    title: 'Comprendre l’Istihâda',
    metaDuration: '7 min de lecture',
    metaType: 'FAQ',
    metaLevel: 'Intermédiaire',
    metaValidated: 'Contenu validé',
    intro: 'Distinguer un saignement irrégulier des règles habituelles, avec des repères généraux pour t’orienter.',
    disclaimerTitle: 'Information importante',
    disclaimerText: 'Ce contenu est purement éducatif. Les questions religieuses doivent être validées par des savants qualifiés. AWA ne délivre pas de fatwas ni de décisions religieuses personnalisées.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Qu’est-ce que l’Istihâda ?',
      'Pourquoi peut-elle être difficile à identifier ?',
      'Les différences entre menstruation et Istihâda',
      'Comment observer les saignements ?',
      'Prière et jeûne pendant l’Istihâda',
      'Que faire en cas de doute ?',
      'À retenir',
    ],
    section1Body: 'L’Istihâda désigne un saignement qui survient en dehors du cycle menstruel habituel, ou qui se prolonge au-delà de la durée des règles reconnue par la tradition islamique. Contrairement aux règles (hayd) ou au nifas (saignement après l’accouchement), elle n’a pas le même statut rituel : elle est généralement considérée comme un saignement de nature différente, parfois lié à une cause médicale.',
    note1Title: 'À noter',
    note1Text: 'Ce contenu explique le concept de manière générale ; il ne permet pas de déterminer si un saignement précis correspond à une Istihâda dans ta situation personnelle.',
    section2Body: 'Il peut être difficile de distinguer l’Istihâda des règles ou d’un cycle irrégulier, car les saignements peuvent parfois se ressembler, varier en intensité, ou se prolonger de façon inhabituelle. Cette difficulté est reconnue par les savants eux-mêmes, ce qui explique l’existence de plusieurs approches pour l’identifier.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Il est normal de ne pas savoir immédiatement à quoi correspond un saignement inhabituel ; ce doute est une situation courante, pas une erreur de ta part.',
    section3Body: 'Certains éléments peuvent aider à orienter la réflexion, sans constituer des règles universelles, car les repères précis varient selon les écoles juridiques.',
    differences: [
      ['calendar-clock-outline', 'Durée par rapport à ton cycle habituel'],
      ['repeat-variant', 'Régularité ou caractère inhabituel du saignement'],
      ['water-outline', 'Évolution du saignement dans le temps'],
      ['clipboard-pulse-outline', 'Présence éventuelle d’une cause médicale connue'],
    ],
    note2Title: 'À noter',
    note2Text: 'Ces éléments sont des repères généraux et non des critères absolus : ils peuvent être interprétés différemment selon les savants et les écoles juridiques.',
    section4Body: 'Prendre le temps d’observer ses saignements sur plusieurs jours, sans précipitation, aide à mieux comprendre sa propre situation avant d’en tirer une conclusion.',
    checkList1Title: 'Quelques repères pratiques',
    observeTips: [
      'Noter la date de début et, si possible, la durée habituelle de tes cycles',
      'Observer si le saignement suit une évolution proche de tes règles précédentes',
      'Ne pas te baser uniquement sur une seule journée isolée',
      'Consigner ces observations si tu prévois de consulter un savant ou un professionnel de santé',
    ],
    section5Body: 'Dans le cas de l’Istihâda, la prière et le jeûne restent généralement obligatoires, à la différence des règles. Des précautions d’hygiène (comme des protections adaptées) sont alors recommandées pour permettre la pratique du culte, selon les modalités enseignées par les différentes écoles juridiques.',
    tip2Title: 'Bon à savoir',
    tip2Text: 'Les précautions précises (comme le renouvellement des ablutions) peuvent varier selon l’école juridique suivie ; se référer à l’avis habituellement suivi ou à un savant qualifié aide à les appliquer correctement.',
    section6Body: 'Un doute persistant sur la nature d’un saignement est une situation fréquente, qui ne doit pas être source d’inquiétude excessive.',
    doubtSteps: [
      'Te référer à la durée et au rythme habituels de tes propres règles',
      'Consulter un professionnel de santé si le saignement est inhabituel ou prolongé',
      'Demander l’avis d’un savant ou d’une savante qualifiée pour la dimension religieuse',
      'Garder à l’esprit qu’une réponse générale ne remplace pas un avis adapté à ta situation',
    ],
    alert2Title: 'Information importante',
    alert2Text: 'Ce contenu reste éducatif et général : il ne constitue pas une fatwa ni une décision religieuse individuelle. Pour toute situation personnelle, en particulier en cas de doute prolongé, l’avis d’un savant qualifié reste la référence.',
    tip3Title: 'Bon à savoir',
    tip3Text: 'L’Istihâda est un concept qui distingue un saignement inhabituel des règles ou du nifas, avec des implications spécifiques sur la prière et le jeûne. En cas de doute, l’observation attentive et l’avis d’un savant qualifié restent les meilleures ressources.',
    shareMessage: 'Comprendre l’Istihâda — AWA',
  },
  en: {
    badge: 'ISTIHÂDA',
    title: 'Understanding Istihâda',
    metaDuration: '7 min read',
    metaType: 'FAQ',
    metaLevel: 'Intermediate',
    metaValidated: 'Reviewed content',
    intro: 'Distinguishing irregular bleeding from your usual period, with general markers to help guide you.',
    disclaimerTitle: 'Important information',
    disclaimerText: 'This content is purely educational. Religious questions should be validated by qualified scholars. AWA does not issue fatwas or personalized religious rulings.',
    contentsTitle: 'In this article',
    topics: [
      'What is Istihâda?',
      'Why can it be difficult to identify?',
      'Differences between menstruation and Istihâda',
      'How to observe the bleeding?',
      'Prayer and fasting during Istihâda',
      'What to do in case of doubt?',
      'Key takeaways',
    ],
    section1Body: 'Istihâda refers to bleeding that occurs outside the usual menstrual cycle, or that continues beyond the duration of menstruation recognized by Islamic tradition. Unlike menstruation (hayd) or nifas (bleeding after childbirth), it does not have the same ritual status: it is generally considered to be bleeding of a different nature, sometimes linked to a medical cause.',
    note1Title: 'Please note',
    note1Text: 'This content explains the concept in general terms; it does not allow you to determine whether a specific instance of bleeding corresponds to Istihâda in your personal situation.',
    section2Body: 'It can be difficult to distinguish Istihâda from menstruation or an irregular cycle, because the bleeding can sometimes look similar, vary in intensity, or continue in an unusual way. This difficulty is recognized by scholars themselves, which explains why several approaches exist to identify it.',
    tip1Title: 'Good to know',
    tip1Text: 'It is normal not to know right away what unusual bleeding corresponds to; this uncertainty is a common situation, not a mistake on your part.',
    section3Body: 'Certain elements can help guide your thinking, without being universal rules, since the precise markers vary according to the schools of jurisprudence.',
    differences: [
      ['calendar-clock-outline', 'Duration compared to your usual cycle'],
      ['repeat-variant', 'Regularity or unusual nature of the bleeding'],
      ['water-outline', 'How the bleeding evolves over time'],
      ['clipboard-pulse-outline', 'Possible presence of a known medical cause'],
    ],
    note2Title: 'Please note',
    note2Text: 'These elements are general markers, not absolute criteria: they may be interpreted differently by scholars and schools of jurisprudence.',
    section4Body: 'Taking the time to observe your bleeding over several days, without rushing, helps you better understand your own situation before drawing a conclusion.',
    checkList1Title: 'Some practical pointers',
    observeTips: [
      'Note the start date and, if possible, the usual length of your cycles',
      'Observe whether the bleeding follows a pattern close to your previous periods',
      'Do not rely on a single isolated day alone',
      'Record these observations if you plan to consult a scholar or a healthcare professional',
    ],
    section5Body: 'In the case of Istihâda, prayer and fasting generally remain obligatory, unlike during menstruation. Hygiene precautions (such as suitable protection) are then recommended to allow worship to continue, according to the methods taught by the different schools of jurisprudence.',
    tip2Title: 'Good to know',
    tip2Text: 'The precise precautions (such as renewing ablutions) may vary depending on the school of jurisprudence followed; referring to the opinion you usually follow or to a qualified scholar helps you apply them correctly.',
    section6Body: 'Persistent doubt about the nature of bleeding is a common situation, and should not be a source of excessive worry.',
    doubtSteps: [
      'Refer to the usual duration and rhythm of your own periods',
      'Consult a healthcare professional if the bleeding is unusual or prolonged',
      'Ask a qualified scholar for their opinion on the religious dimension',
      'Keep in mind that a general answer does not replace guidance suited to your situation',
    ],
    alert2Title: 'Important information',
    alert2Text: 'This content remains educational and general: it does not constitute a fatwa or an individual religious ruling. For any personal situation, especially in case of prolonged doubt, the opinion of a qualified scholar remains the reference.',
    tip3Title: 'Good to know',
    tip3Text: 'Istihâda is a concept that distinguishes unusual bleeding from menstruation or nifas, with specific implications for prayer and fasting. In case of doubt, careful observation and the opinion of a qualified scholar remain the best resources.',
    shareMessage: 'Understanding Istihâda — AWA',
  },
  es: {
    badge: 'ISTIHADA',
    title: 'Comprender la Istihada',
    metaDuration: '7 min de lectura',
    metaType: 'Preguntas frecuentes',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenido validado',
    intro: 'Distinguir un sangrado irregular de la menstruación habitual, con referencias generales para orientarte.',
    disclaimerTitle: 'Información importante',
    disclaimerText: 'Este contenido es puramente educativo. Las preguntas religiosas deben ser validadas por eruditos cualificados. AWA no emite fatuas ni decisiones religiosas personalizadas.',
    contentsTitle: 'En este artículo',
    topics: [
      '¿Qué es la Istihada?',
      '¿Por qué puede ser difícil de identificar?',
      'Las diferencias entre la menstruación y la Istihada',
      '¿Cómo observar el sangrado?',
      'Oración y ayuno durante la Istihada',
      '¿Qué hacer en caso de duda?',
      'Para recordar',
    ],
    section1Body: 'La Istihada designa un sangrado que se produce fuera del ciclo menstrual habitual, o que se prolonga más allá de la duración de la menstruación reconocida por la tradición islámica. A diferencia de la menstruación (hayd) o del nifas (sangrado después del parto), no tiene el mismo estatus ritual: se considera generalmente un sangrado de naturaleza diferente, a veces vinculado a una causa médica.',
    note1Title: 'Para tener en cuenta',
    note1Text: 'Este contenido explica el concepto de manera general; no permite determinar si un sangrado concreto corresponde a una Istihada en tu situación personal.',
    section2Body: 'Puede resultar difícil distinguir la Istihada de la menstruación o de un ciclo irregular, porque los sangrados a veces pueden parecerse, variar en intensidad o prolongarse de forma inusual. Esta dificultad es reconocida por los propios eruditos, lo que explica que existan varios enfoques para identificarla.',
    tip1Title: 'Bueno saberlo',
    tip1Text: 'Es normal no saber de inmediato a qué corresponde un sangrado inusual; esta duda es una situación habitual, no un error por tu parte.',
    section3Body: 'Algunos elementos pueden ayudar a orientar la reflexión, sin constituir reglas universales, ya que las referencias precisas varían según las escuelas jurídicas.',
    differences: [
      ['calendar-clock-outline', 'Duración en comparación con tu ciclo habitual'],
      ['repeat-variant', 'Regularidad o carácter inusual del sangrado'],
      ['water-outline', 'Evolución del sangrado a lo largo del tiempo'],
      ['clipboard-pulse-outline', 'Posible presencia de una causa médica conocida'],
    ],
    note2Title: 'Para tener en cuenta',
    note2Text: 'Estos elementos son referencias generales y no criterios absolutos: pueden interpretarse de forma diferente según los eruditos y las escuelas jurídicas.',
    section4Body: 'Tomarse el tiempo de observar el sangrado durante varios días, sin precipitarse, ayuda a comprender mejor la propia situación antes de sacar una conclusión.',
    checkList1Title: 'Algunas pautas prácticas',
    observeTips: [
      'Anotar la fecha de inicio y, si es posible, la duración habitual de tus ciclos',
      'Observar si el sangrado sigue una evolución cercana a la de tus menstruaciones anteriores',
      'No basarte únicamente en un solo día aislado',
      'Registrar estas observaciones si prevés consultar a un erudito o a un profesional de la salud',
    ],
    section5Body: 'En el caso de la Istihada, la oración y el ayuno siguen siendo generalmente obligatorios, a diferencia de la menstruación. Entonces se recomiendan precauciones de higiene (como protecciones adecuadas) para permitir la práctica del culto, según las modalidades enseñadas por las distintas escuelas jurídicas.',
    tip2Title: 'Bueno saberlo',
    tip2Text: 'Las precauciones precisas (como la renovación de las abluciones) pueden variar según la escuela jurídica seguida; referirse a la opinión que se suele seguir o a un erudito cualificado ayuda a aplicarlas correctamente.',
    section6Body: 'Una duda persistente sobre la naturaleza de un sangrado es una situación frecuente, que no debe ser motivo de preocupación excesiva.',
    doubtSteps: [
      'Referirte a la duración y al ritmo habituales de tu propia menstruación',
      'Consultar a un profesional de la salud si el sangrado es inusual o prolongado',
      'Pedir la opinión de un erudito o una erudita cualificada para la dimensión religiosa',
      'Tener presente que una respuesta general no sustituye un consejo adaptado a tu situación',
    ],
    alert2Title: 'Información importante',
    alert2Text: 'Este contenido sigue siendo educativo y general: no constituye una fatua ni una decisión religiosa individual. Para cualquier situación personal, en particular en caso de duda prolongada, la opinión de un erudito cualificado sigue siendo la referencia.',
    tip3Title: 'Bueno saberlo',
    tip3Text: 'La Istihada es un concepto que distingue un sangrado inusual de la menstruación o del nifas, con implicaciones específicas en la oración y el ayuno. En caso de duda, la observación atenta y la opinión de un erudito cualificado siguen siendo los mejores recursos.',
    shareMessage: 'Comprender la Istihada — AWA',
  },
  it: {
    badge: 'ISTIHADA',
    title: 'Capire l’Istihâda',
    metaDuration: '7 min di lettura',
    metaType: 'FAQ',
    metaLevel: 'Intermedio',
    metaValidated: 'Contenuto validato',
    intro: 'Distinguere un sanguinamento irregolare dalle tue mestruazioni abituali, con alcuni riferimenti generali che possono orientarti.',
    disclaimerTitle: 'Informazione importante',
    disclaimerText: 'Questo contenuto ha uno scopo puramente educativo. Le questioni religiose dovrebbero essere validate da studiosi qualificati. AWA non emette fatwa né pareri religiosi personalizzati.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Che cos’è l’Istihâda?',
      'Perché può essere difficile riconoscerla?',
      'Differenze tra mestruazioni e Istihâda',
      'Come osservare il sanguinamento?',
      'Preghiera e digiuno durante l’Istihâda',
      'Cosa fare in caso di dubbio?',
      'Punti chiave',
    ],
    section1Body: 'L’Istihâda indica un sanguinamento che si verifica al di fuori del normale ciclo mestruale, oppure che continua oltre la durata delle mestruazioni riconosciuta dalla tradizione islamica. A differenza delle mestruazioni (hayd) o del nifas (sanguinamento dopo il parto), non ha lo stesso status rituale: è generalmente considerata un sanguinamento di natura diversa, talvolta legato a una causa medica.',
    note1Title: 'Attenzione',
    note1Text: 'Questo contenuto spiega il concetto in termini generali; non permette di stabilire se uno specifico sanguinamento corrisponda a Istihâda nella tua situazione personale.',
    section2Body: 'Può essere difficile distinguere l’Istihâda dalle mestruazioni o da un ciclo irregolare, perché il sanguinamento può talvolta sembrare simile, variare di intensità o proseguire in modo insolito. Questa difficoltà è riconosciuta dagli stessi studiosi, il che spiega perché esistono diversi approcci per individuarla.',
    tip1Title: 'Da sapere',
    tip1Text: 'È normale non sapere subito a cosa corrisponda un sanguinamento insolito; questa incertezza è una situazione comune, non un tuo errore.',
    section3Body: 'Alcuni elementi possono aiutarti a orientare la tua riflessione, senza essere regole universali, poiché i riferimenti precisi variano a seconda delle scuole giuridiche.',
    differences: [
      [
        'calendar-clock-outline',
        'Durata rispetto al tuo ciclo abituale',
      ],
      [
        'repeat-variant',
        'Regolarità o carattere insolito del sanguinamento',
      ],
      [
        'water-outline',
        'Come evolve il sanguinamento nel tempo',
      ],
      [
        'clipboard-pulse-outline',
        'Possibile presenza di una causa medica nota',
      ],
    ],
    note2Title: 'Attenzione',
    note2Text: 'Questi elementi sono riferimenti generali, non criteri assoluti: possono essere interpretati in modo diverso dagli studiosi e dalle scuole giuridiche.',
    section4Body: 'Prenderti il tempo di osservare il sanguinamento per diversi giorni, senza fretta, ti aiuta a comprendere meglio la tua situazione prima di trarre una conclusione.',
    checkList1Title: 'Alcuni consigli pratici',
    observeTips: [
      'Annota la data di inizio e, se possibile, la durata abituale dei tuoi cicli',
      'Osserva se il sanguinamento segue un andamento simile a quello delle tue mestruazioni precedenti',
      'Non basarti su un solo giorno isolato',
      'Registra queste osservazioni se prevedi di consultare uno studioso o un professionista sanitario',
    ],
    section5Body: 'In caso di Istihâda, la preghiera e il digiuno restano generalmente obbligatori, a differenza di quanto avviene durante le mestruazioni. Si raccomandano allora precauzioni igieniche (come una protezione adeguata) per poter continuare il culto, secondo le modalità insegnate dalle diverse scuole giuridiche.',
    tip2Title: 'Da sapere',
    tip2Text: 'Le precauzioni precise (come rinnovare le abluzioni) possono variare a seconda della scuola giuridica seguita; fare riferimento al parere che segui abitualmente o a uno studioso qualificato ti aiuta ad applicarle correttamente.',
    section6Body: 'Un dubbio persistente sulla natura di un sanguinamento è una situazione comune e non dovrebbe essere motivo di eccessiva preoccupazione.',
    doubtSteps: [
      'Fai riferimento alla durata e al ritmo abituali delle tue mestruazioni',
      'Consulta un professionista sanitario se il sanguinamento è insolito o prolungato',
      'Chiedi il parere di uno studioso qualificato sulla dimensione religiosa',
      'Ricorda che una risposta generale non sostituisce una guida adatta alla tua situazione',
    ],
    alert2Title: 'Informazione importante',
    alert2Text: 'Questo contenuto resta educativo e generale: non costituisce una fatwa né un parere religioso individuale. Per qualsiasi situazione personale, soprattutto in caso di dubbio prolungato, il parere di uno studioso qualificato resta il riferimento.',
    tip3Title: 'Da sapere',
    tip3Text: 'L’Istihâda è un concetto che distingue un sanguinamento insolito dalle mestruazioni o dal nifas, con implicazioni specifiche per la preghiera e il digiuno. In caso di dubbio, un’osservazione attenta e il parere di uno studioso qualificato restano le risorse migliori.',
    shareMessage: 'Capire l’Istihâda — AWA',
  },
  tr: {
    badge: 'İSTİHAZE',
    title: 'İstihazeyi anlamak',
    metaDuration: '7 dk okuma',
    metaType: 'SSS',
    metaLevel: 'Orta düzey',
    metaValidated: 'Gözden geçirilmiş içerik',
    intro: 'Düzensiz kanamayı olağan adetinden ayırt etmek için yol gösterebilecek genel ölçütler.',
    disclaimerTitle: 'Önemli bilgi',
    disclaimerText: 'Bu içerik tamamen eğitim amaçlıdır. Dinî sorular yetkin âlimlere danışılarak netleştirilmelidir. AWA fetva ya da kişiye özel dinî hüküm vermez.',
    contentsTitle: 'Bu makalede',
    topics: [
      'İstihaze nedir?',
      'Neden fark etmek zor olabilir?',
      'Adet (hayız) ile istihaze arasındaki farklar',
      'Kanama nasıl gözlemlenir?',
      'İstihaze sırasında namaz ve oruç',
      'Şüphe halinde ne yapmalı?',
      'Akılda kalacaklar',
    ],
    section1Body: 'İstihaze, olağan adet döngüsünün dışında gerçekleşen ya da İslam geleneğinde kabul edilen hayız süresinin ötesinde devam eden kanamayı ifade eder. Hayızdan ya da nifastan (doğum sonrası kanama) farklı olarak aynı ibadet hükmüne sahip değildir: genellikle farklı nitelikte bir kanama olarak kabul edilir ve zaman zaman tıbbi bir nedene bağlı olabilir.',
    note1Title: 'Not',
    note1Text: 'Bu içerik kavramı genel hatlarıyla açıklar; belirli bir kanamanın senin kişisel durumunda istihazeye karşılık gelip gelmediğini belirlemene imkân vermez.',
    section2Body: 'İstihazeyi adetten ya da düzensiz bir döngüden ayırt etmek zor olabilir; çünkü kanama bazen benzer görünebilir, yoğunluğu değişebilir ya da alışılmadık şekilde sürebilir. Bu zorluk âlimler tarafından da kabul edilir; bu nedenle onu belirlemek için birden fazla yaklaşım vardır.',
    tip1Title: 'Bilmekte fayda var',
    tip1Text: 'Olağandışı bir kanamanın neye karşılık geldiğini hemen bilememek normaldir; bu belirsizlik yaygın bir durumdur, senin bir hatan değildir.',
    section3Body: 'Bazı unsurlar, evrensel kurallar olmaksızın, düşünmene yol gösterebilir; çünkü kesin ölçütler fıkıh mezheplerine göre değişir.',
    differences: [
      [
        'calendar-clock-outline',
        'Olağan döngüne kıyasla süre',
      ],
      [
        'repeat-variant',
        'Kanamanın düzenli ya da alışılmadık olması',
      ],
      [
        'water-outline',
        'Kanamanın zaman içinde nasıl seyrettiği',
      ],
      [
        'clipboard-pulse-outline',
        'Bilinen bir tıbbi nedenin olabileceği',
      ],
    ],
    note2Title: 'Not',
    note2Text: 'Bu unsurlar genel ölçütlerdir, mutlak kriter değildir: âlimler ve fıkıh mezhepleri tarafından farklı yorumlanabilirler.',
    section4Body: 'Kanamanı acele etmeden birkaç gün boyunca gözlemlemek, bir sonuca varmadan önce kendi durumunu daha iyi anlamana yardımcı olur.',
    checkList1Title: 'Bazı pratik hatırlatmalar',
    observeTips: [
      'Başlangıç tarihini ve mümkünse döngülerinin olağan uzunluğunu not al',
      'Kanamanın önceki adetlerine yakın bir seyir izleyip izlemediğini gözlemle',
      'Yalnızca tek bir güne dayanma',
      'Bir âlime ya da bir sağlık profesyoneline danışmayı düşünüyorsan bu gözlemleri kaydet',
    ],
    section5Body: 'İstihaze halinde, adet döneminin aksine namaz ve oruç genellikle farz olmaya devam eder. İbadetin sürdürülebilmesi için hijyen önlemleri (uygun bir ped gibi) tavsiye edilir; bunlar farklı fıkıh mezheplerinin öğrettiği yöntemlere göre uygulanır.',
    tip2Title: 'Bilmekte fayda var',
    tip2Text: 'Kesin önlemler (abdestin yenilenmesi gibi) uyulan fıkıh mezhebine göre değişebilir; genellikle uyduğun görüşe ya da yetkin bir âlime başvurmak bunları doğru uygulamana yardımcı olur.',
    section6Body: 'Kanamanın niteliği konusunda süregelen şüphe yaygın bir durumdur ve aşırı bir endişe kaynağı olmamalıdır.',
    doubtSteps: [
      'Kendi adetlerinin olağan süresine ve düzenine bak',
      'Kanama olağandışıysa ya da uzuyorsa bir sağlık profesyoneline danış',
      'Dinî boyutu hakkında yetkin bir âlimin görüşünü sor',
      'Genel bir cevabın, durumuna uygun bir yönlendirmenin yerini tutmadığını unutma',
    ],
    alert2Title: 'Önemli bilgi',
    alert2Text: 'Bu içerik eğitim amaçlı ve genel kalır: fetva ya da kişiye özel bir dinî hüküm teşkil etmez. Her kişisel durumda, özellikle şüphe uzadığında, yetkin bir âlimin görüşü esas başvuru kaynağıdır.',
    tip3Title: 'Bilmekte fayda var',
    tip3Text: 'İstihaze, olağandışı kanamayı adetten ya da nifastan ayıran ve namaz ile oruç açısından kendine özgü sonuçları olan bir kavramdır. Şüphe halinde dikkatli gözlem ve yetkin bir âlimin görüşü en iyi başvuru kaynaklarıdır.',
    shareMessage: 'İstihazeyi anlamak — AWA',
  },
  ru: {
    badge: 'ИСТИХАДА',
    title: 'Понимание истихады',
    metaDuration: '7 мин чтения',
    metaType: 'Вопросы и ответы',
    metaLevel: 'Средний уровень',
    metaValidated: 'Проверенный материал',
    intro: 'Как отличить нерегулярное кровотечение от обычных месячных: общие ориентиры, которые помогут разобраться.',
    disclaimerTitle: 'Важная информация',
    disclaimerText: 'Этот материал носит исключительно образовательный характер. Религиозные вопросы следует уточнять у квалифицированных богословов. AWA не выносит фетв и не даёт персональных религиозных заключений.',
    contentsTitle: 'В этой статье',
    topics: [
      'Что такое истихада?',
      'Почему её бывает трудно определить?',
      'Различия между менструацией и истихадой',
      'Как наблюдать за кровотечением?',
      'Намаз и пост во время истихады',
      'Что делать при сомнениях?',
      'Главное',
    ],
    section1Body: 'Истихада — это кровотечение, которое возникает вне обычного менструального цикла или продолжается дольше срока менструации, признаваемого исламской традицией. В отличие от менструации (хайд) или нифаса (кровотечения после родов), оно не имеет такого же ритуального статуса: его, как правило, считают кровотечением иной природы, порой связанным с медицинской причиной.',
    note1Title: 'Обратите внимание',
    note1Text: 'Этот материал объясняет понятие в общих чертах; он не позволяет определить, соответствует ли конкретное кровотечение истихаде в вашей личной ситуации.',
    section2Body: 'Отличить истихаду от менструации или от нерегулярного цикла может быть трудно, поскольку кровотечение порой выглядит похоже, меняется по интенсивности или продолжается необычным образом. Эту сложность признают и сами богословы, поэтому существует несколько подходов к её определению.',
    tip1Title: 'Полезно знать',
    tip1Text: 'Не сразу понимать, чему соответствует необычное кровотечение, — это нормально; такая неопределённость — обычная ситуация, а не ваша ошибка.',
    section3Body: 'Некоторые элементы могут помочь в размышлении, не являясь универсальными правилами, поскольку точные признаки различаются в зависимости от мазхабов.',
    differences: [
      ['calendar-clock-outline', 'Продолжительность по сравнению с вашим обычным циклом'],
      ['repeat-variant', 'Регулярность или необычный характер кровотечения'],
      ['water-outline', 'Как кровотечение меняется со временем'],
      ['clipboard-pulse-outline', 'Возможное наличие известной медицинской причины'],
    ],
    note2Title: 'Обратите внимание',
    note2Text: 'Эти элементы — общие ориентиры, а не абсолютные критерии: богословы и мазхабы могут толковать их по-разному.',
    section4Body: 'Если не торопясь понаблюдать за кровотечением в течение нескольких дней, можно лучше понять собственную ситуацию, прежде чем делать вывод.',
    checkList1Title: 'Несколько практических советов',
    observeTips: [
      'Отметьте дату начала и, если возможно, обычную длительность ваших циклов',
      'Понаблюдайте, соответствует ли кровотечение картине ваших прежних месячных',
      'Не опирайтесь только на один отдельный день',
      'Записывайте эти наблюдения, если планируете обратиться к богослову или медицинскому специалисту',
    ],
    section5Body: 'При истихаде намаз и пост, как правило, остаются обязательными — в отличие от менструации. В этом случае рекомендуются гигиенические меры (например, подходящее средство гигиены), позволяющие продолжать богослужение в соответствии со способами, которым учат разные мазхабы.',
    tip2Title: 'Полезно знать',
    tip2Text: 'Точные меры предосторожности (например, обновление омовения) могут различаться в зависимости от мазхаба, которого вы придерживаетесь; обратившись к мнению, которого вы обычно придерживаетесь, или к квалифицированному богослову, вы сможете применять их правильно.',
    section6Body: 'Сохраняющееся сомнение относительно природы кровотечения — обычная ситуация, и она не должна становиться поводом для чрезмерной тревоги.',
    doubtSteps: [
      'Ориентируйтесь на обычную продолжительность и ритм ваших собственных месячных',
      'Обратитесь к медицинскому специалисту, если кровотечение необычное или затяжное',
      'Спросите мнение квалифицированного богослова о религиозной стороне вопроса',
      'Помните, что общий ответ не заменяет рекомендации, подходящие именно для вашей ситуации',
    ],
    alert2Title: 'Важная информация',
    alert2Text: 'Этот материал остаётся образовательным и общим: он не является фетвой или индивидуальным религиозным заключением. В любой личной ситуации, особенно при затянувшемся сомнении, ориентиром остаётся мнение квалифицированного богослова.',
    tip3Title: 'Полезно знать',
    tip3Text: 'Истихада — это понятие, которое отличает необычное кровотечение от менструации или нифаса и имеет особые последствия для намаза и поста. При сомнениях лучшие помощники — внимательное наблюдение и мнение квалифицированного богослова.',
    shareMessage: 'Понимание истихады — AWA',
  },
  de: {
    badge: 'ISTIHADA',
    title: 'Istihada verstehen',
    metaDuration: '7 Min. Lesezeit',
    metaType: 'Häufige Fragen',
    metaLevel: 'Fortgeschritten',
    metaValidated: 'Geprüfter Inhalt',
    intro: 'Unregelmäßige Blutungen von deiner gewohnten Periode unterscheiden – mit allgemeinen Anhaltspunkten zur Orientierung.',
    disclaimerTitle: 'Wichtiger Hinweis',
    disclaimerText: 'Dieser Inhalt dient ausschließlich der Bildung. Religiöse Fragen sollten von qualifizierten Gelehrten geklärt werden. AWA spricht keine Fatwas und keine persönlichen religiösen Urteile aus.',
    contentsTitle: 'In diesem Artikel',
    topics: [
      'Was ist Istihada?',
      'Warum ist sie manchmal schwer zu erkennen?',
      'Unterschiede zwischen Menstruation und Istihada',
      'Wie beobachtest du die Blutung?',
      'Gebet und Fasten bei Istihada',
      'Was tun bei Zweifeln?',
      'Das Wichtigste in Kürze',
    ],
    section1Body: 'Istihada bezeichnet eine Blutung, die außerhalb des gewohnten Menstruationszyklus auftritt oder über die in der islamischen Tradition anerkannte Dauer der Menstruation hinaus anhält. Anders als die Menstruation (Hayd) oder das Nifas (Blutung nach der Geburt) hat sie nicht denselben rituellen Status: Sie gilt im Allgemeinen als Blutung anderer Art, die manchmal mit einer medizinischen Ursache zusammenhängt.',
    note1Title: 'Bitte beachten',
    note1Text: 'Dieser Inhalt erklärt das Konzept in allgemeiner Form; er erlaubt es dir nicht festzustellen, ob eine bestimmte Blutung in deiner persönlichen Situation einer Istihada entspricht.',
    section2Body: 'Istihada von der Menstruation oder einem unregelmäßigen Zyklus zu unterscheiden, kann schwierig sein, weil die Blutung manchmal ähnlich aussieht, unterschiedlich stark ausfällt oder ungewöhnlich weiterläuft. Diese Schwierigkeit wird auch von den Gelehrten selbst anerkannt, weshalb es mehrere Ansätze gibt, sie zu bestimmen.',
    tip1Title: 'Gut zu wissen',
    tip1Text: 'Es ist normal, nicht sofort zu wissen, wozu eine ungewöhnliche Blutung gehört; diese Unsicherheit kommt häufig vor und ist kein Fehler von dir.',
    section3Body: 'Einige Elemente können dir bei der Einordnung helfen, ohne allgemeingültige Regeln zu sein, da die genauen Kriterien je nach Rechtsschule variieren.',
    differences: [
      ['calendar-clock-outline', 'Dauer im Vergleich zu deinem gewohnten Zyklus'],
      ['repeat-variant', 'Regelmäßigkeit oder ungewöhnliche Art der Blutung'],
      ['water-outline', 'Wie sich die Blutung im Laufe der Zeit entwickelt'],
      ['clipboard-pulse-outline', 'Mögliche bekannte medizinische Ursache'],
    ],
    note2Title: 'Bitte beachten',
    note2Text: 'Diese Elemente sind allgemeine Anhaltspunkte und keine absoluten Kriterien: Gelehrte und Rechtsschulen können sie unterschiedlich auslegen.',
    section4Body: 'Wenn du dir Zeit nimmst und deine Blutung über mehrere Tage ohne Eile beobachtest, kannst du deine eigene Situation besser verstehen, bevor du zu einem Schluss kommst.',
    checkList1Title: 'Einige praktische Hinweise',
    observeTips: [
      'Notiere das Startdatum und, wenn möglich, die übliche Länge deiner Zyklen',
      'Beobachte, ob die Blutung einem Muster folgt, das deinen früheren Perioden ähnelt',
      'Verlasse dich nicht allein auf einen einzelnen Tag',
      'Halte diese Beobachtungen fest, wenn du eine Gelehrte, einen Gelehrten oder medizinisches Fachpersonal aufsuchen möchtest',
    ],
    section5Body: 'Bei Istihada bleiben Gebet und Fasten im Allgemeinen verpflichtend – anders als während der Menstruation. Hygienemaßnahmen (wie ein geeigneter Schutz) werden dann empfohlen, damit der Gottesdienst fortgesetzt werden kann, nach den Methoden, die die verschiedenen Rechtsschulen lehren.',
    tip2Title: 'Gut zu wissen',
    tip2Text: 'Die genauen Vorkehrungen (etwa das Erneuern der Waschung) können je nach befolgter Rechtsschule variieren; wenn du dich an die Meinung hältst, der du üblicherweise folgst, oder eine qualifizierte Gelehrte oder einen qualifizierten Gelehrten fragst, kannst du sie richtig anwenden.',
    section6Body: 'Anhaltende Zweifel über die Art einer Blutung kommen häufig vor und sollten kein Anlass für übermäßige Sorge sein.',
    doubtSteps: [
      'Orientiere dich an der üblichen Dauer und dem Rhythmus deiner eigenen Perioden',
      'Such medizinisches Fachpersonal auf, wenn die Blutung ungewöhnlich ist oder lange anhält',
      'Frag eine qualifizierte Gelehrte oder einen qualifizierten Gelehrten nach der Einschätzung zur religiösen Seite',
      'Denk daran, dass eine allgemeine Antwort keine Begleitung ersetzt, die zu deiner Situation passt',
    ],
    alert2Title: 'Wichtiger Hinweis',
    alert2Text: 'Dieser Inhalt bleibt bildend und allgemein: Er ist weder eine Fatwa noch ein individuelles religiöses Urteil. Für jede persönliche Situation, besonders bei länger anhaltenden Zweifeln, bleibt die Einschätzung einer qualifizierten Gelehrten oder eines qualifizierten Gelehrten maßgeblich.',
    tip3Title: 'Gut zu wissen',
    tip3Text: 'Istihada ist ein Konzept, das ungewöhnliche Blutungen von der Menstruation oder dem Nifas unterscheidet und besondere Auswirkungen auf Gebet und Fasten hat. Bei Zweifeln sind sorgfältige Beobachtung und die Einschätzung einer qualifizierten Gelehrten oder eines qualifizierten Gelehrten die besten Anlaufstellen.',
    shareMessage: 'Istihada verstehen – AWA',
  },
  zh: {
      badge: '伊斯提哈达',
      title: '了解伊斯提哈达（Istihada）',
      metaDuration: '阅读约 7 分钟',
      metaType: '常见问题',
      metaLevel: '进阶',
      metaValidated: '已审核内容',
      intro: '如何区分不规律出血与平常的月经，并提供一些通用的参考标志来帮助你判断。',
      disclaimerTitle: '重要提示',
      disclaimerText: '本内容纯属科普。宗教方面的问题应由有资质的学者来确认。AWA 不发布法特瓦（fatwa），也不提供针对个人的宗教判断。',
      contentsTitle: '本文内容',
      topics: [
        '什么是 Istihada？',
        '为什么可能难以辨别？',
        '月经与 Istihada 的区别',
        '如何观察出血情况？',
        'Istihada 期间的礼拜与斋戒',
        '有疑问时怎么办？',
        '要点回顾',
      ],
      section1Body: 'Istihada 指发生在平常月经周期之外的出血，或者持续时间超出伊斯兰传统所认定的月经时长的出血。它不同于月经（hayd）或产后恶露期（Nifas，分娩后的出血），在礼仪层面的地位也不一样：它通常被认为是性质不同的出血，有时与某种医学原因有关。',
      note1Title: '请注意',
      note1Text: '本内容只是概括地解释这一概念，无法让你据此判断某一次具体的出血在你个人的情况下是否属于 Istihada。',
      section2Body: '要把 Istihada 与月经或不规律的周期区分开可能并不容易，因为出血有时看起来很相似，强度也会变化，或者以不寻常的方式持续。学者们自己也承认这种困难，所以才存在多种辨别它的方法。',
      tip1Title: '小贴士',
      tip1Text: '一时不清楚异常出血属于哪种情况是正常的；这种不确定很常见，不是你的过错。',
      section3Body: '有些因素可以帮助你理清思路，但它们不是放之四海而皆准的规则，因为具体的判断标志会因不同的教法学派而有所差异。',
      differences: [
        [
          'calendar-clock-outline',
          '与你平常周期相比的持续时间',
        ],
        [
          'repeat-variant',
          '出血是否规律，或是否异常',
        ],
        [
          'water-outline',
          '出血随时间的变化情况',
        ],
        [
          'clipboard-pulse-outline',
          '是否可能存在已知的医学原因',
        ],
      ],
      note2Title: '请注意',
      note2Text: '这些因素只是一般性的参考标志，而不是绝对的标准：学者和各教法学派对它们的解读可能不同。',
      section4Body: '花几天时间从容地观察自己的出血情况，不要着急，这有助于你在下结论之前更好地了解自己的情况。',
      checkList1Title: '一些实用的提示',
      observeTips: [
        '记下开始日期，如果可以，也记下你平常的周期长度',
        '观察出血是否与你以往的月经规律相近',
        '不要只凭某一个孤立的日子来判断',
        '如果打算咨询学者或医疗专业人员，请把这些观察记录下来',
      ],
      section5Body: '在 Istihada 的情况下，礼拜和斋戒通常仍然是必须履行的，这一点与月经期间不同。此时建议做好清洁防护（例如使用合适的卫生用品），以便能够继续礼拜，具体做法依各教法学派所教导的方式而定。',
      tip2Title: '小贴士',
      tip2Text: '具体的防护措施（例如重新做小净）可能因你所遵循的教法学派而不同；参考你平常遵循的观点，或请教有资质的学者，有助于你正确地去做。',
      section6Body: '对出血的性质一直存疑是很常见的情况，不必为此过度担忧。',
      doubtSteps: [
        '参照你自己月经通常的时长和节律',
        '如果出血异常或持续时间较长，请咨询医疗专业人员',
        '就宗教层面的问题，请教有资质的学者的意见',
        '请记住，一般性的回答不能替代针对你个人情况的指导',
      ],
      alert2Title: '重要提示',
      alert2Text: '本内容仍属科普和概述性质：它不构成法特瓦（fatwa），也不是针对个人的宗教判断。对于任何个人情况，尤其是长时间存疑时，仍应以有资质的学者的意见为准。',
      tip3Title: '小贴士',
      tip3Text: 'Istihada 是一个用来把异常出血与月经或产后恶露期（Nifas）区分开的概念，对礼拜和斋戒有特定的影响。有疑问时，仔细观察并请教有资质的学者，仍然是最好的依靠。',
      shareMessage: '了解伊斯提哈达（Istihada） — AWA',
    },
  id: {
    badge: 'ISTIHADAH',
    title: 'Memahami Istihadah',
    metaDuration: '7 menit baca',
    metaType: 'FAQ',
    metaLevel: 'Menengah',
    metaValidated: 'Konten telah ditinjau',
    intro: 'Membedakan perdarahan tidak teratur dari haid biasa, dengan penanda umum sebagai panduan.',
    disclaimerTitle: 'Informasi penting',
    disclaimerText: 'Konten ini murni bersifat edukatif. Pertanyaan keagamaan sebaiknya dipastikan kepada ulama yang kompeten. AWA tidak mengeluarkan fatwa atau keputusan keagamaan yang dipersonalisasi.',
    contentsTitle: 'Dalam artikel ini',
    topics: [
      'Apa itu Istihadah?',
      'Mengapa sulit dikenali?',
      'Perbedaan antara haid dan Istihadah',
      'Bagaimana mengamati perdarahan?',
      'Salat dan puasa saat Istihadah',
      'Apa yang dilakukan jika ragu?',
      'Poin-poin penting',
    ],
    section1Body: 'Istihadah adalah perdarahan yang terjadi di luar siklus haid yang biasa, atau yang berlanjut melampaui lamanya haid yang dikenal dalam tradisi Islam. Berbeda dengan haid (hayd) atau nifas (perdarahan setelah melahirkan), perdarahan ini tidak memiliki status ibadah yang sama: umumnya dianggap sebagai perdarahan yang berbeda sifatnya, kadang berkaitan dengan penyebab medis.',
    note1Title: 'Harap diperhatikan',
    note1Text: 'Konten ini menjelaskan konsep tersebut secara umum; konten ini tidak memungkinkanmu menentukan apakah suatu perdarahan tertentu termasuk Istihadah dalam situasi pribadimu.',
    section2Body: 'Istihadah bisa sulit dibedakan dari haid atau siklus yang tidak teratur, karena perdarahannya kadang terlihat mirip, intensitasnya bervariasi, atau berlanjut dengan cara yang tidak biasa. Kesulitan ini diakui oleh para ulama sendiri, sehingga ada beberapa pendekatan untuk mengenalinya.',
    tip1Title: 'Perlu diketahui',
    tip1Text: 'Wajar jika kamu tidak langsung tahu perdarahan yang tidak biasa itu termasuk jenis apa; ketidakpastian ini hal yang umum, bukan kesalahanmu.',
    section3Body: 'Beberapa hal bisa membantu memandu pertimbanganmu, tanpa menjadi aturan yang berlaku universal, karena penanda yang tepat berbeda-beda menurut mazhab fikih.',
    differences: [
      [
        'calendar-clock-outline',
        'Lama perdarahan dibandingkan siklusmu yang biasa',
      ],
      [
        'repeat-variant',
        'Keteraturan atau sifat perdarahan yang tidak biasa',
      ],
      [
        'water-outline',
        'Bagaimana perdarahan berkembang dari waktu ke waktu',
      ],
      [
        'clipboard-pulse-outline',
        'Kemungkinan adanya penyebab medis yang diketahui',
      ],
    ],
    note2Title: 'Harap diperhatikan',
    note2Text: 'Hal-hal ini adalah penanda umum, bukan kriteria mutlak: ulama dan mazhab fikih bisa menafsirkannya secara berbeda.',
    section4Body: 'Meluangkan waktu untuk mengamati perdarahanmu selama beberapa hari, tanpa terburu-buru, membantumu memahami situasimu sendiri dengan lebih baik sebelum menarik kesimpulan.',
    checkList1Title: 'Beberapa petunjuk praktis',
    observeTips: [
      'Catat tanggal mulai dan, jika memungkinkan, lama siklusmu yang biasa',
      'Amati apakah perdarahan mengikuti pola yang mirip dengan haid-haidmu sebelumnya',
      'Jangan hanya bergantung pada satu hari yang terpisah',
      'Catat pengamatan ini jika kamu berencana berkonsultasi dengan ulama atau tenaga kesehatan',
    ],
    section5Body: 'Pada kasus Istihadah, salat dan puasa umumnya tetap wajib, berbeda dengan saat haid. Tindakan kebersihan (seperti memakai pembalut yang sesuai) kemudian dianjurkan agar ibadah tetap bisa dilakukan, sesuai cara yang diajarkan oleh berbagai mazhab fikih.',
    tip2Title: 'Perlu diketahui',
    tip2Text: 'Langkah-langkah yang tepat (seperti memperbarui wudu) bisa berbeda menurut mazhab yang diikuti; merujuk pada pendapat yang biasa kamu ikuti atau bertanya kepada ulama yang kompeten membantumu menerapkannya dengan benar.',
    section6Body: 'Keraguan yang berlanjut tentang sifat suatu perdarahan adalah hal yang umum, dan tidak perlu menjadi sumber kekhawatiran berlebihan.',
    doubtSteps: [
      'Rujuk lama dan ritme haidmu yang biasa',
      'Konsultasikan dengan tenaga kesehatan jika perdarahan tidak biasa atau berkepanjangan',
      'Tanyakan pendapat ulama yang kompeten mengenai sisi keagamaannya',
      'Ingat bahwa jawaban yang umum tidak menggantikan bimbingan yang sesuai dengan situasimu',
    ],
    alert2Title: 'Informasi penting',
    alert2Text: 'Konten ini tetap bersifat edukatif dan umum: bukan fatwa atau keputusan keagamaan individual. Untuk setiap situasi pribadi, terutama jika keraguan berlanjut, pendapat ulama yang kompeten tetap menjadi rujukan.',
    tip3Title: 'Perlu diketahui',
    tip3Text: 'Istihadah adalah konsep yang membedakan perdarahan tidak biasa dari haid atau nifas, dengan konsekuensi tertentu bagi salat dan puasa. Jika ragu, pengamatan yang cermat dan pendapat ulama yang kompeten tetap menjadi sumber terbaik.',
    shareMessage: 'Memahami Istihadah — AWA',
  },
  hi: {
    badge: 'इस्तिहाज़ा',
    title: 'इस्तिहाज़ा को समझना',
    metaDuration: '7 मिनट में पढ़ें',
    metaType: 'अक्सर पूछे जाने वाले सवाल',
    metaLevel: 'मध्यम',
    metaValidated: 'समीक्षा किया गया लेख',
    intro: 'अनियमित रक्तस्राव को आपके सामान्य पीरियड से अलग पहचानना, कुछ सामान्य संकेतों की मदद से।',
    disclaimerTitle: 'ज़रूरी जानकारी',
    disclaimerText: 'यह लेख केवल जानकारी के लिए है। धार्मिक सवालों की पुष्टि योग्य उलमा से करवानी चाहिए। AWA फ़तवे या व्यक्तिगत धार्मिक निर्णय जारी नहीं करता।',
    contentsTitle: 'इस लेख में',
    topics: [
      'इस्तिहाज़ा क्या है?',
      'इसे पहचानना मुश्किल क्यों हो सकता है?',
      'मासिक धर्म और इस्तिहाज़ा में अंतर',
      'रक्तस्राव को कैसे देखें?',
      'इस्तिहाज़ा के दौरान नमाज़ और रोज़ा',
      'संदेह की स्थिति में क्या करें?',
      'मुख्य बातें',
    ],
    section1Body: 'इस्तिहाज़ा उस रक्तस्राव को कहते हैं जो सामान्य मासिक चक्र के बाहर होता है, या जो इस्लामी परंपरा में मान्य मासिक धर्म की अवधि के बाद भी जारी रहता है। माहवारी या निफ़ास (प्रसव के बाद का रक्तस्राव) के विपरीत, इसकी धार्मिक हैसियत वैसी नहीं होती: इसे आम तौर पर अलग प्रकृति का रक्तस्राव माना जाता है, जो कभी-कभी किसी चिकित्सीय कारण से जुड़ा होता है।',
    note1Title: 'ध्यान दें',
    note1Text: 'यह लेख अवधारणा को सामान्य रूप से समझाता है; इससे आप यह तय नहीं कर सकतीं कि आपकी अपनी स्थिति में कोई रक्तस्राव इस्तिहाज़ा है या नहीं।',
    section2Body: 'इस्तिहाज़ा को मासिक धर्म या अनियमित चक्र से अलग पहचानना मुश्किल हो सकता है, क्योंकि रक्तस्राव कभी-कभी एक जैसा दिख सकता है, उसकी मात्रा बदल सकती है, या वह असामान्य ढंग से जारी रह सकता है। यह कठिनाई उलमा भी मानते हैं, इसीलिए इसे पहचानने के कई तरीके मौजूद हैं।',
    tip1Title: 'जानना अच्छा है',
    tip1Text: 'असामान्य रक्तस्राव क्या है, यह तुरंत न समझ पाना स्वाभाविक है; यह अनिश्चितता एक आम स्थिति है, इसमें आपकी कोई ग़लती नहीं है।',
    section3Body: 'कुछ बातें आपको सोचने में मदद कर सकती हैं, लेकिन ये सार्वभौमिक नियम नहीं हैं, क्योंकि सटीक संकेत फ़िक़्ही मसलकों के अनुसार अलग-अलग होते हैं।',
    differences: [
      [
        'calendar-clock-outline',
        'आपके सामान्य चक्र की तुलना में अवधि',
      ],
      [
        'repeat-variant',
        'रक्तस्राव की नियमितता या उसका असामान्य होना',
      ],
      [
        'water-outline',
        'समय के साथ रक्तस्राव में बदलाव',
      ],
      [
        'clipboard-pulse-outline',
        'किसी ज्ञात चिकित्सीय कारण की संभावना',
      ],
    ],
    note2Title: 'ध्यान दें',
    note2Text: 'ये बातें सामान्य संकेत हैं, अंतिम कसौटी नहीं: उलमा और फ़िक़्ही मसलक इनकी अलग-अलग व्याख्या कर सकते हैं।',
    section4Body: 'जल्दबाज़ी किए बिना कई दिनों तक अपने रक्तस्राव को देखने से, किसी नतीजे पर पहुँचने से पहले आप अपनी स्थिति को बेहतर समझ पाती हैं।',
    checkList1Title: 'कुछ व्यावहारिक सुझाव',
    observeTips: [
      'शुरुआत की तारीख़ लिखें और संभव हो तो अपने चक्रों की सामान्य लंबाई भी',
      'देखें कि रक्तस्राव आपके पिछले पीरियड्स जैसे ढर्रे पर चल रहा है या नहीं',
      'सिर्फ़ किसी एक दिन के आधार पर फ़ैसला न करें',
      'अगर आप किसी आलिमा/आलिम या स्वास्थ्य विशेषज्ञ से मिलने वाली हैं, तो ये अवलोकन दर्ज करके रखें',
    ],
    section5Body: 'इस्तिहाज़ा की स्थिति में नमाज़ और रोज़ा आम तौर पर मासिक धर्म के विपरीत फ़र्ज़ रहते हैं। इबादत जारी रखने के लिए तब साफ़-सफ़ाई के एहतियात (जैसे उचित सुरक्षा का इस्तेमाल) की सलाह दी जाती है, जो अलग-अलग फ़िक़्ही मसलकों में सिखाए गए तरीक़ों के अनुसार होते हैं।',
    tip2Title: 'जानना अच्छा है',
    tip2Text: 'सटीक एहतियात (जैसे वुज़ू दोहराना) आप जिस फ़िक़्ही मसलक का पालन करती हैं, उसके अनुसार अलग हो सकते हैं; उन्हें सही ढंग से अपनाने के लिए अपने मसलक की राय देखें या किसी योग्य आलिम/आलिमा से पूछें।',
    section6Body: 'रक्तस्राव की प्रकृति को लेकर लगातार संदेह होना एक आम स्थिति है, और इसे अत्यधिक चिंता का कारण नहीं बनना चाहिए।',
    doubtSteps: [
      'अपने पीरियड्स की सामान्य अवधि और लय को आधार बनाएँ',
      'अगर रक्तस्राव असामान्य या लंबा खिंचे तो स्वास्थ्य विशेषज्ञ से मिलें',
      'धार्मिक पहलू पर किसी योग्य आलिम/आलिमा से राय लें',
      'याद रखें कि सामान्य जवाब आपकी स्थिति के अनुसार मार्गदर्शन की जगह नहीं ले सकता',
    ],
    alert2Title: 'ज़रूरी जानकारी',
    alert2Text: 'यह लेख जानकारी और सामान्य समझ तक सीमित है: यह कोई फ़तवा या व्यक्तिगत धार्मिक निर्णय नहीं है। किसी भी व्यक्तिगत स्थिति में, ख़ासकर लंबे संदेह की सूरत में, किसी योग्य आलिम/आलिमा की राय ही आधार रहती है।',
    tip3Title: 'जानना अच्छा है',
    tip3Text: 'इस्तिहाज़ा एक ऐसी अवधारणा है जो असामान्य रक्तस्राव को मासिक धर्म या निफ़ास से अलग करती है, और नमाज़ व रोज़े के लिए इसके विशेष मायने हैं। संदेह की स्थिति में ध्यान से देखना और किसी योग्य आलिम/आलिमा की राय लेना सबसे अच्छे सहारे हैं।',
    shareMessage: 'इस्तिहाज़ा को समझना — AWA',
  },
  sq: {
    badge: 'ISTIHADAJA',
    title: 'Të kuptojmë istihadanë',
    metaDuration: '7 min lexim',
    metaType: 'Pyetje të shpeshta',
    metaLevel: 'Mesatar',
    metaValidated: 'Përmbajtje e rishikuar',
    intro: 'Si ta dallosh gjakderdhjen e parregullt nga menstruacionet e zakonshme, me disa shenja të përgjithshme që të orientojnë.',
    disclaimerTitle: 'Informacion i rëndësishëm',
    disclaimerText: 'Kjo përmbajtje është thjesht edukative. Çështjet fetare duhen vërtetuar nga dijetarë të kualifikuar. AWA nuk jep fetva dhe as vendime fetare të personalizuara.',
    contentsTitle: 'Në këtë artikull',
    topics: [
      'Çfarë është istihadaja?',
      'Pse mund të jetë e vështirë ta dallosh?',
      'Dallimet midis menstruacionit dhe istihadasë',
      'Si ta vëzhgosh gjakderdhjen?',
      'Namazi dhe agjërimi gjatë istihadasë',
      'Çfarë të bësh në rast dyshimi?',
      'Në pak fjalë',
    ],
    section1Body: 'Istihadaja është gjakderdhja që ndodh jashtë ciklit menstrual të zakonshëm, ose që vazhdon përtej kohëzgjatjes së menstruacionit të njohur nga tradita islame. Ndryshe nga menstruacioni (hajdi) ose nifasi (gjakderdhja pas lindjes), ajo nuk ka të njëjtin status rituali: zakonisht konsiderohet gjakderdhje me natyrë tjetër, që herë-herë lidhet me një shkak mjekësor.',
    note1Title: 'Mos harro',
    note1Text: 'Kjo përmbajtje e shpjegon konceptin në terma të përgjithshëm; ajo nuk të lejon të përcaktosh nëse një gjakderdhje e caktuar përbën istihada në situatën tënde personale.',
    section2Body: 'Mund të jetë e vështirë ta dallosh istihadanë nga menstruacioni ose nga një cikël i parregullt, sepse gjakderdhja ndonjëherë mund të duket e ngjashme, të ndryshojë në intensitet ose të vazhdojë në mënyrë të pazakontë. Këtë vështirësi e njohin vetë dijetarët, prandaj ekzistojnë disa qasje për ta identifikuar.',
    tip1Title: 'Mirë është ta dish',
    tip1Text: 'Është normale të mos e dish menjëherë me çfarë përkon një gjakderdhje e pazakontë; kjo pasiguri është një situatë e zakonshme, jo gabim yti.',
    section3Body: 'Disa elemente mund të të ndihmojnë në reflektim, pa qenë rregulla universale, pasi shenjat e sakta ndryshojnë sipas shkollave të jurisprudencës.',
    differences: [
      [
        'calendar-clock-outline',
        'Kohëzgjatja krahasuar me ciklin tënd të zakonshëm',
      ],
      [
        'repeat-variant',
        'Rregullsia ose natyra e pazakontë e gjakderdhjes',
      ],
      [
        'water-outline',
        'Si ndryshon gjakderdhja me kalimin e kohës',
      ],
      [
        'clipboard-pulse-outline',
        'Prania e mundshme e një shkaku mjekësor të njohur',
      ],
    ],
    note2Title: 'Mos harro',
    note2Text: 'Këta elemente janë shenja të përgjithshme, jo kritere absolute: dijetarët dhe shkollat e jurisprudencës mund t’i interpretojnë ndryshe.',
    section4Body: 'Të marrësh kohë ta vëzhgosh gjakderdhjen për disa ditë, pa nxitim, të ndihmon ta kuptosh më mirë situatën tënde përpara se të arrish në një përfundim.',
    checkList1Title: 'Disa orientime praktike',
    observeTips: [
      'Shëno datën e fillimit dhe, nëse mundesh, gjatësinë e zakonshme të cikleve të tua',
      'Vëzhgo nëse gjakderdhja ndjek një model të afërt me menstruacionet e tua të mëparshme',
      'Mos u mbështet vetëm te një ditë e vetme e veçuar',
      'Regjistro këto vëzhgime nëse planifikon të konsultohesh me një dijetar ose me një profesionist të shëndetësisë',
    ],
    section5Body: 'Në rastin e istihadasë, namazi dhe agjërimi zakonisht mbeten detyrime, ndryshe nga gjatë menstruacionit. Atëherë rekomandohen masa higjienike (si mbrojtja e përshtatshme) që adhurimi të vazhdojë, sipas mënyrave që mësojnë shkollat e ndryshme të jurisprudencës.',
    tip2Title: 'Mirë është ta dish',
    tip2Text: 'Masat e sakta (si përtëritja e abdesteve) mund të ndryshojnë sipas shkollës së jurisprudencës që ndjek; t’i referohesh mendimit që ndjek zakonisht ose një dijetari të kualifikuar të ndihmon t’i zbatosh drejt.',
    section6Body: 'Dyshimi i vazhdueshëm për natyrën e gjakderdhjes është një situatë e zakonshme dhe nuk duhet të jetë burim shqetësimi të tepruar.',
    doubtSteps: [
      'Mbështetu te kohëzgjatja dhe ritmi i zakonshëm i menstruacioneve të tua',
      'Konsultohu me një profesionist të shëndetësisë nëse gjakderdhja është e pazakontë ose zgjatet',
      'Pyet një dijetar të kualifikuar për mendimin e tij në aspektin fetar',
      'Mbaj mend se një përgjigje e përgjithshme nuk zëvendëson udhëzimin e përshtatur për situatën tënde',
    ],
    alert2Title: 'Informacion i rëndësishëm',
    alert2Text: 'Kjo përmbajtje mbetet edukative dhe e përgjithshme: ajo nuk përbën fetva dhe as vendim fetar individual. Për çdo situatë personale, sidomos në rast dyshimi të zgjatur, mendimi i një dijetari të kualifikuar mbetet pika e referimit.',
    tip3Title: 'Mirë është ta dish',
    tip3Text: 'Istihadaja është një koncept që e dallon gjakderdhjen e pazakontë nga menstruacioni ose nifasi, me pasoja të veçanta për namazin dhe agjërimin. Në rast dyshimi, vëzhgimi i kujdesshëm dhe mendimi i një dijetari të kualifikuar mbeten burimet më të mira.',
    shareMessage: 'Të kuptojmë istihadanë — AWA',
  },
  ja: {
    badge: 'イスティハーダ',
    title: 'イスティハーダを理解する',
    metaDuration: '読了時間7分',
    metaType: 'よくある質問',
    metaLevel: '中級',
    metaValidated: '確認済みコンテンツ',
    intro: 'いつもの生理とは異なる出血を見分けるための、一般的な目安をご紹介します。',
    disclaimerTitle: '大切なお知らせ',
    disclaimerText: 'この内容は教育を目的としたものです。宗教上の疑問は、資格のある学者に確認してください。AWAはファトワーや個別の宗教的判断を出しません。',
    contentsTitle: 'この記事の内容',
    topics: [
      'イスティハーダとは？',
      'なぜ見分けるのが難しいのでしょうか？',
      '月経とイスティハーダの違い',
      '出血をどのように観察するか',
      'イスティハーダ中の礼拝と断食',
      '迷ったときはどうすればよいでしょうか？',
      '重要なポイント',
    ],
    section1Body: 'イスティハーダとは、通常の生理周期の外で起こる出血、またはイスラームの伝統で認められている月経の期間を超えて続く出血のことです。月経（ハイド）や産後の出血（ニファース）とは、儀礼上の位置づけが同じではありません。一般的には性質の異なる出血とされ、医学的な原因が関係している場合もあります。',
    note1Title: 'ご注意ください',
    note1Text: 'この内容は概念を一般的に説明するものです。ご自身の具体的な出血がイスティハーダにあたるかどうかを判断できるものではありません。',
    section2Body: 'イスティハーダは、月経や不規則な周期と見分けるのが難しいことがあります。出血が似て見えたり、量が変わったり、普段とは違う形で続いたりするためです。この難しさは学者たち自身も認めており、見分けるために複数の考え方があるのはそのためです。',
    tip1Title: '知っておきたいこと',
    tip1Text: 'いつもと違う出血が何にあたるのか、すぐにはわからないのは自然なことです。よくある状況であり、あなたの落ち度ではありません。',
    section3Body: '考えるうえで助けになる要素はいくつかありますが、普遍的な決まりではありません。正確な目安は法学派によって異なるためです。',
    differences: [
      [
        'calendar-clock-outline',
        '普段の周期と比べた期間',
      ],
      [
        'repeat-variant',
        '出血の規則性、または普段と違う点',
      ],
      [
        'water-outline',
        '時間の経過に伴う出血の変化',
      ],
      [
        'clipboard-pulse-outline',
        'わかっている医学的な原因の可能性',
      ],
    ],
    note2Title: 'ご注意ください',
    note2Text: 'これらの要素は一般的な目安であり、絶対的な基準ではありません。学者や法学派によって解釈が異なることがあります。',
    section4Body: '数日かけて、あわてずに出血の様子を観察すると、結論を出す前にご自身の状況をよりよく理解できます。',
    checkList1Title: '実践のためのヒント',
    observeTips: [
      '開始日と、できれば普段の周期の長さを記録しましょう',
      '出血がこれまでの生理に近い経過をたどっているかを観察しましょう',
      'ある1日だけを根拠にしないようにしましょう',
      '学者や医療従事者に相談するときのために、観察したことを記録しておきましょう',
    ],
    section5Body: 'イスティハーダの場合、月経中とは異なり、礼拝と断食は一般的に引き続き義務とされます。礼拝を続けられるよう、適切な生理用品の使用など、衛生面の配慮が勧められます。方法は各法学派が教えるところに従います。',
    tip2Title: '知っておきたいこと',
    tip2Text: 'ウドゥー（小さな清め）をやり直すなど、具体的な配慮は、従っている法学派によって異なることがあります。普段従っている見解や、資格のある学者に確認すると、正しく行うことができます。',
    section6Body: '出血の性質について疑問が続くのはよくあることで、過度に心配する必要はありません。',
    doubtSteps: [
      'ご自身の生理の普段の期間とリズムを参考にしましょう',
      '出血がいつもと違う場合や長引く場合は、医療従事者に相談しましょう',
      '宗教面については、資格のある学者に意見を求めましょう',
      '一般的な答えは、ご自身の状況に合わせた助言の代わりにはならないことを心に留めておきましょう',
    ],
    alert2Title: '大切なお知らせ',
    alert2Text: 'この内容は教育を目的とした一般的なものであり、ファトワーや個別の宗教的判断ではありません。個人的な状況、とくに疑問が長く続く場合は、資格のある学者の意見が基準となります。',
    tip3Title: '知っておきたいこと',
    tip3Text: 'イスティハーダは、いつもと違う出血を月経やニファースと区別する概念で、礼拝や断食に特有の影響があります。迷ったときは、丁寧な観察と、資格のある学者の意見が最も頼りになります。',
    shareMessage: 'イスティハーダを理解する — AWA',
  },
  ko: {
    badge: '이스티하다',
    title: '이스티하다 이해하기',
    metaDuration: '7분 읽기',
    metaType: '자주 묻는 질문',
    metaLevel: '중급',
    metaValidated: '검토된 콘텐츠',
    intro: '평소 생리와 다른 불규칙한 출혈을 구분하는 데 도움이 되는 일반적인 기준을 알아봐요.',
    disclaimerTitle: '중요한 안내',
    disclaimerText: '이 콘텐츠는 교육을 목적으로 해요. 종교적인 질문은 자격을 갖춘 학자에게 확인해야 해요. AWA는 파트와나 개인별 종교 판단을 내리지 않아요.',
    contentsTitle: '이 아티클에서 다루는 내용',
    topics: [
      '이스티하다란 무엇일까요?',
      '왜 구분하기 어려울 수 있을까요?',
      '월경과 이스티하다의 차이',
      '출혈을 어떻게 관찰할까요?',
      '이스티하다 중의 예배와 금식',
      '확신이 서지 않을 때는 어떻게 할까요?',
      '핵심 정리',
    ],
    section1Body: '이스티하다는 평소 생리 주기 밖에서 나타나는 출혈이나, 이슬람 전통에서 인정하는 월경 기간을 넘어 이어지는 출혈을 가리켜요. 월경(하이드)이나 니파스(출산 후 출혈)와는 의례상의 지위가 같지 않아요. 일반적으로 성격이 다른 출혈로 여겨지며, 때로는 의학적인 원인과 관련이 있을 수 있어요.',
    note1Title: '참고해 주세요',
    note1Text: '이 콘텐츠는 개념을 일반적으로 설명할 뿐이에요. 내가 겪은 특정 출혈이 개인적인 상황에서 이스티하다에 해당하는지를 판단할 수는 없어요.',
    section2Body: '출혈의 모양이 비슷해 보이거나 양이 달라지거나 평소와 다르게 이어질 수 있어서, 이스티하다를 월경이나 불규칙한 주기와 구분하기는 어려울 수 있어요. 학자들조차 이 어려움을 인정하고 있으며, 그래서 이를 구분하는 여러 접근 방식이 있어요.',
    tip1Title: '알아 두면 좋아요',
    tip1Text: '평소와 다른 출혈이 무엇에 해당하는지 바로 알지 못하는 것은 자연스러운 일이에요. 이런 불확실함은 흔한 상황이며 잘못이 아니에요.',
    section3Body: '정확한 기준은 법학파에 따라 다르기 때문에 보편적인 규칙은 아니지만, 몇 가지 요소가 생각을 정리하는 데 도움이 될 수 있어요.',
    differences: [
      [
        'calendar-clock-outline',
        '평소 주기와 비교한 기간',
      ],
      [
        'repeat-variant',
        '출혈의 규칙성 또는 평소와 다른 정도',
      ],
      [
        'water-outline',
        '시간이 지나며 출혈이 달라지는 양상',
      ],
      [
        'clipboard-pulse-outline',
        '알려진 의학적 원인이 있을 가능성',
      ],
    ],
    note2Title: '참고해 주세요',
    note2Text: '이 요소들은 절대적인 기준이 아니라 일반적인 지표예요. 학자와 법학파에 따라 다르게 해석될 수 있어요.',
    section4Body: '서두르지 않고 며칠 동안 출혈을 차분히 관찰하면, 결론을 내리기 전에 내 상황을 더 잘 이해하는 데 도움이 돼요.',
    checkList1Title: '실용적인 팁',
    observeTips: [
      '시작한 날짜를 적어 두고, 가능하면 평소 주기의 길이도 함께 적어요',
      '출혈이 이전 생리와 비슷한 흐름을 보이는지 살펴봐요',
      '하루만 보고 판단하지 않아요',
      '학자나 의료 전문가와 상담할 계획이라면 이런 관찰 내용을 기록해 두어요',
    ],
    section5Body: '이스티하다인 경우 월경 때와 달리 예배와 금식은 일반적으로 계속 의무로 남아 있어요. 그래서 예배를 이어갈 수 있도록 적절한 보호대 사용 같은 위생 조치가 권장되며, 구체적인 방법은 법학파마다 가르치는 바가 달라요.',
    tip2Title: '알아 두면 좋아요',
    tip2Text: '우두(소정화)를 다시 하는 것과 같은 구체적인 조치는 따르는 법학파에 따라 다를 수 있어요. 평소 따르는 견해를 참고하거나 자격을 갖춘 학자에게 물어보면 올바르게 적용하는 데 도움이 돼요.',
    section6Body: '출혈의 성격에 대해 계속 의문이 드는 것은 흔한 일이며, 지나치게 걱정할 일이 아니에요.',
    doubtSteps: [
      '내 생리의 평소 기간과 리듬을 참고해요',
      '출혈이 평소와 다르거나 오래 이어지면 의료 전문가와 상담해요',
      '종교적인 측면은 자격을 갖춘 학자에게 의견을 물어봐요',
      '일반적인 답변은 내 상황에 맞는 안내를 대신할 수 없다는 점을 기억해요',
    ],
    alert2Title: '중요한 안내',
    alert2Text: '이 콘텐츠는 교육을 위한 일반적인 내용이며 파트와나 개인별 종교 판단이 아니에요. 개인적인 상황, 특히 의문이 오래 이어질 때는 자격을 갖춘 학자의 의견이 기준이 돼요.',
    tip3Title: '알아 두면 좋아요',
    tip3Text: '이스티하다는 평소와 다른 출혈을 월경이나 니파스와 구분하는 개념으로, 예배와 금식에 관해 특별한 의미를 가져요. 확신이 서지 않을 때는 세심한 관찰과 자격을 갖춘 학자의 의견이 가장 좋은 도움이 돼요.',
    shareMessage: '이스티하다 이해하기 — AWA',
  },
  'pt-PT': {
    badge: 'ISTIHADA',
    title: 'Compreender a istihada',
    metaDuration: '7 min de leitura',
    metaType: 'Perguntas frequentes',
    metaLevel: 'Intermédio',
    metaValidated: 'Conteúdo revisto',
    intro: 'Distinguir um sangramento irregular do seu período habitual, com referências gerais para a orientar.',
    disclaimerTitle: 'Informação importante',
    disclaimerText: 'Este conteúdo é puramente educativo. As questões religiosas devem ser validadas por sábios qualificados. A AWA não emite fatwas nem pareceres religiosos personalizados.',
    contentsTitle: 'Neste artigo',
    topics: [
      'O que é a istihada?',
      'Porque pode ser difícil de identificar?',
      'Diferenças entre a menstruação e a istihada',
      'Como observar o sangramento?',
      'Oração e jejum durante a istihada',
      'O que fazer em caso de dúvida?',
      'Pontos essenciais',
    ],
    section1Body: 'A istihada designa um sangramento que ocorre fora do ciclo menstrual habitual, ou que se prolonga para além da duração da menstruação reconhecida pela tradição islâmica. Ao contrário da menstruação (hayd) ou do nifas (sangramento após o parto), não tem o mesmo estatuto ritual: é geralmente considerado um sangramento de natureza diferente, por vezes ligada a uma causa médica.',
    note1Title: 'Atenção',
    note1Text: 'Este conteúdo explica o conceito em termos gerais; não permite determinar se um sangramento concreto corresponde à istihada na sua situação pessoal.',
    section2Body: 'Pode ser difícil distinguir a istihada da menstruação ou de um ciclo irregular, porque o sangramento pode por vezes parecer semelhante, variar de intensidade ou prolongar-se de forma incomum. Esta dificuldade é reconhecida pelos próprios sábios, o que explica a existência de várias abordagens para a identificar.',
    tip1Title: 'Bom saber',
    tip1Text: 'É normal não saber de imediato a que corresponde um sangramento fora do comum; esta incerteza é uma situação frequente, não um erro da sua parte.',
    section3Body: 'Certos elementos podem ajudar a orientar a sua reflexão, sem serem regras universais, pois as referências precisas variam consoante as escolas jurídicas.',
    differences: [
      [
        'calendar-clock-outline',
        'Duração em comparação com o seu ciclo habitual',
      ],
      [
        'repeat-variant',
        'Regularidade ou caráter incomum do sangramento',
      ],
      [
        'water-outline',
        'Evolução do sangramento ao longo do tempo',
      ],
      [
        'clipboard-pulse-outline',
        'Eventual presença de uma causa médica conhecida',
      ],
    ],
    note2Title: 'Atenção',
    note2Text: 'Estes elementos são referências gerais, não critérios absolutos: podem ser interpretados de forma diferente pelos sábios e pelas escolas jurídicas.',
    section4Body: 'Dedicar tempo a observar o seu sangramento durante vários dias, sem pressa, ajuda a compreender melhor a sua própria situação antes de tirar uma conclusão.',
    checkList1Title: 'Algumas indicações práticas',
    observeTips: [
      'Anote a data de início e, se possível, a duração habitual dos seus ciclos',
      'Observe se o sangramento segue um padrão próximo dos seus períodos anteriores',
      'Não se baseie apenas num único dia isolado',
      'Registe estas observações se pensa consultar um sábio ou um profissional de saúde',
    ],
    section5Body: 'No caso da istihada, a oração e o jejum geralmente continuam a ser obrigatórios, ao contrário do que acontece durante a menstruação. Recomendam-se então precauções de higiene (como uma proteção adequada) para permitir que o culto prossiga, segundo os métodos ensinados pelas diferentes escolas jurídicas.',
    tip2Title: 'Bom saber',
    tip2Text: 'As precauções precisas (como renovar as abluções) podem variar consoante a escola jurídica seguida; recorrer à opinião que habitualmente segue ou a um sábio qualificado ajuda a aplicá-las corretamente.',
    section6Body: 'A dúvida persistente sobre a natureza de um sangramento é uma situação frequente e não deve ser motivo de preocupação excessiva.',
    doubtSteps: [
      'Tenha como referência a duração e o ritmo habituais dos seus próprios períodos',
      'Consulte um profissional de saúde se o sangramento for fora do comum ou prolongado',
      'Peça a opinião de um sábio qualificado sobre a vertente religiosa',
      'Não esqueça que uma resposta geral não substitui uma orientação adaptada à sua situação',
    ],
    alert2Title: 'Informação importante',
    alert2Text: 'Este conteúdo permanece educativo e geral: não constitui uma fatwa nem um parecer religioso individual. Em qualquer situação pessoal, sobretudo em caso de dúvida prolongada, a opinião de um sábio qualificado continua a ser a referência.',
    tip3Title: 'Bom saber',
    tip3Text: 'A istihada é um conceito que distingue um sangramento fora do comum da menstruação ou do nifas, com implicações específicas para a oração e o jejum. Em caso de dúvida, a observação atenta e a opinião de um sábio qualificado continuam a ser os melhores recursos.',
    shareMessage: 'Compreender a istihada — AWA',
  },
  bn: {
    badge: 'ইস্তিহাযা',
    title: 'ইস্তিহাযা বোঝা',
    metaDuration: '7 মিনিটের পাঠ',
    metaType: 'প্রশ্নোত্তর',
    metaLevel: 'মধ্যম',
    metaValidated: 'পর্যালোচিত বিষয়বস্তু',
    intro: 'আপনার স্বাভাবিক মাসিক থেকে অনিয়মিত রক্তক্ষরণকে আলাদা করা, পথ দেখানোর জন্য কিছু সাধারণ নির্দেশক সহ।',
    disclaimerTitle: 'গুরুত্বপূর্ণ তথ্য',
    disclaimerText: 'এই বিষয়বস্তু সম্পূর্ণ শিক্ষামূলক। ধর্মীয় প্রশ্নের উত্তর যোগ্য আলেমদের কাছ থেকে যাচাই করে নেওয়া উচিত। AWA কোনো ফতোয়া বা ব্যক্তিগত ধর্মীয় সিদ্ধান্ত দেয় না।',
    contentsTitle: 'এই নিবন্ধে',
    topics: [
      'ইস্তিহাযা কী?',
      'চিনতে কেন কঠিন হতে পারে?',
      'মাসিক ও ইস্তিহাযার মধ্যে পার্থক্য',
      'রক্তক্ষরণ কীভাবে পর্যবেক্ষণ করবেন?',
      'ইস্তিহাযার সময় নামাজ ও রোজা',
      'সন্দেহ হলে কী করবেন?',
      'মূল কথা',
    ],
    section1Body: 'ইস্তিহাযা হলো এমন রক্তক্ষরণ যা স্বাভাবিক মাসিক চক্রের বাইরে ঘটে, অথবা ইসলামি ঐতিহ্যে স্বীকৃত মাসিকের সময়কাল পেরিয়েও চলতে থাকে। মাসিক (হায়েজ) বা নিফাস (সন্তান প্রসবের পরের রক্তস্রাব) থেকে ভিন্ন, এর ধর্মীয় বিধানগত মর্যাদা একই নয়: সাধারণত একে ভিন্ন প্রকৃতির রক্তক্ষরণ হিসেবে গণ্য করা হয়, যা কখনো কখনো কোনো চিকিৎসাগত কারণের সঙ্গে সম্পর্কিত।',
    note1Title: 'মনে রাখবেন',
    note1Text: 'এই বিষয়বস্তু ধারণাটি সাধারণভাবে ব্যাখ্যা করে; আপনার ব্যক্তিগত অবস্থায় কোনো নির্দিষ্ট রক্তক্ষরণ ইস্তিহাযা কি না, তা এর মাধ্যমে নির্ধারণ করা যায় না।',
    section2Body: 'ইস্তিহাযাকে মাসিক বা অনিয়মিত চক্র থেকে আলাদা করা কঠিন হতে পারে, কারণ রক্তক্ষরণ কখনো কখনো একই রকম দেখায়, পরিমাণে তারতম্য হয়, বা অস্বাভাবিকভাবে চলতে থাকে। এই কঠিনতা আলেমরাও স্বীকার করেন, আর সে কারণেই এটি চিহ্নিত করার একাধিক পদ্ধতি রয়েছে।',
    tip1Title: 'জেনে রাখা ভালো',
    tip1Text: 'অস্বাভাবিক রক্তক্ষরণ কোন ধরনের, তা সঙ্গে সঙ্গে না জানা স্বাভাবিক; এই অনিশ্চয়তা একটি সাধারণ পরিস্থিতি, আপনার কোনো ভুল নয়।',
    section3Body: 'কিছু বিষয় আপনার চিন্তা করতে সাহায্য করতে পারে, তবে এগুলো সর্বজনীন নিয়ম নয়, কারণ সুনির্দিষ্ট নির্দেশক ফিকহের মাযহাবভেদে ভিন্ন হয়।',
    differences: [
      [
        'calendar-clock-outline',
        'আপনার স্বাভাবিক চক্রের তুলনায় সময়কাল',
      ],
      [
        'repeat-variant',
        'রক্তক্ষরণের নিয়মিততা বা অস্বাভাবিক প্রকৃতি',
      ],
      [
        'water-outline',
        'সময়ের সঙ্গে রক্তক্ষরণ কীভাবে পরিবর্তিত হয়',
      ],
      [
        'clipboard-pulse-outline',
        'কোনো জানা চিকিৎসাগত কারণ থাকার সম্ভাবনা',
      ],
    ],
    note2Title: 'মনে রাখবেন',
    note2Text: 'এগুলো সাধারণ নির্দেশক, চূড়ান্ত মানদণ্ড নয়: আলেম ও মাযহাবভেদে এগুলোর ব্যাখ্যা ভিন্ন হতে পারে।',
    section4Body: 'তাড়াহুড়ো না করে কয়েক দিন ধরে আপনার রক্তক্ষরণ পর্যবেক্ষণ করলে কোনো সিদ্ধান্তে পৌঁছানোর আগে নিজের অবস্থা আরও ভালোভাবে বুঝতে পারবেন।',
    checkList1Title: 'কিছু ব্যবহারিক পরামর্শ',
    observeTips: [
      'শুরুর তারিখ লিখে রাখুন এবং সম্ভব হলে আপনার চক্রের স্বাভাবিক দৈর্ঘ্যও লিখুন',
      'লক্ষ্য করুন রক্তক্ষরণ আপনার আগের মাসিকের কাছাকাছি কোনো ধরনে চলছে কি না',
      'শুধু একটি বিচ্ছিন্ন দিনের ওপর নির্ভর করবেন না',
      'কোনো আলেম বা স্বাস্থ্যসেবা পেশাজীবীর সঙ্গে পরামর্শ করার পরিকল্পনা থাকলে এই পর্যবেক্ষণগুলো লিখে রাখুন',
    ],
    section5Body: 'ইস্তিহাযার ক্ষেত্রে সাধারণত নামাজ ও রোজা বাধ্যতামূলক থাকে, মাসিকের সময়ের মতো নয়। তখন ইবাদত চালিয়ে যাওয়ার জন্য স্বাস্থ্যবিধিগত সতর্কতা (যেমন উপযুক্ত সুরক্ষা ব্যবহার) গ্রহণ করা ভালো, বিভিন্ন মাযহাবে শেখানো পদ্ধতি অনুসারে।',
    tip2Title: 'জেনে রাখা ভালো',
    tip2Text: 'সুনির্দিষ্ট সতর্কতা (যেমন অজু নবায়ন করা) আপনি যে মাযহাব অনুসরণ করেন তার ওপর নির্ভর করে ভিন্ন হতে পারে; আপনি যে মত সাধারণত অনুসরণ করেন সেটি দেখে নিলে বা কোনো যোগ্য আলেমের কাছে জানলে সেগুলো সঠিকভাবে পালন করতে পারবেন।',
    section6Body: 'রক্তক্ষরণের প্রকৃতি নিয়ে দীর্ঘস্থায়ী সন্দেহ একটি সাধারণ পরিস্থিতি, এবং এটি অতিরিক্ত দুশ্চিন্তার কারণ হওয়া উচিত নয়।',
    doubtSteps: [
      'আপনার নিজের মাসিকের স্বাভাবিক সময়কাল ও ছন্দ দেখে নিন',
      'রক্তক্ষরণ অস্বাভাবিক বা দীর্ঘস্থায়ী হলে স্বাস্থ্যসেবা পেশাজীবীর পরামর্শ নিন',
      'ধর্মীয় দিক নিয়ে একজন যোগ্য আলেমের মত জিজ্ঞাসা করুন',
      'মনে রাখুন, একটি সাধারণ উত্তর আপনার অবস্থার উপযোগী দিকনির্দেশনার বিকল্প নয়',
    ],
    alert2Title: 'গুরুত্বপূর্ণ তথ্য',
    alert2Text: 'এই বিষয়বস্তু শিক্ষামূলক ও সাধারণ থাকে: এটি কোনো ফতোয়া বা ব্যক্তিগত ধর্মীয় সিদ্ধান্ত নয়। যেকোনো ব্যক্তিগত পরিস্থিতিতে, বিশেষ করে দীর্ঘস্থায়ী সন্দেহের ক্ষেত্রে, একজন যোগ্য আলেমের মতই মূল নির্ভরযোগ্য।',
    tip3Title: 'জেনে রাখা ভালো',
    tip3Text: 'ইস্তিহাযা এমন একটি ধারণা যা অস্বাভাবিক রক্তক্ষরণকে মাসিক বা নিফাস থেকে আলাদা করে, এবং নামাজ ও রোজার ক্ষেত্রে এর নির্দিষ্ট প্রভাব রয়েছে। সন্দেহ হলে সতর্ক পর্যবেক্ষণ এবং একজন যোগ্য আলেমের মত সবচেয়ে ভালো সহায়ক।',
    shareMessage: 'ইস্তিহাযা বোঝা — AWA',
  },
} as const);

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function IstihadaArticleScreen({
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

          <AwaText variant="bodyMedium" style={styles.intro}>{content.intro}</AwaText>

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

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section1Body}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.note1Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>{content.note1Text}</AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>2. {content.topics[1]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section2Body}</AwaText>

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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>3. {content.topics[2]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section3Body}</AwaText>

          <View style={styles.daily}>
            {content.differences.map(([icon, label]) => (
              <View key={label} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={icon as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <AwaText variant="bodySmall" style={styles.dailyText}>{label}</AwaText>
              </View>
            ))}
          </View>

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.note2Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>{content.note2Text}</AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>4. {content.topics[3]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section4Body}</AwaText>

          <Image
            source={ART.observe}
            resizeMode="cover"
            style={styles.wideImage}
          />

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            <AwaText variant="titleSmall" emphasized style={styles.checkListTitle}>{content.checkList1Title}</AwaText>

            {content.observeTips.map(item => (
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

          <AwaText variant="titleLarge" emphasized style={styles.h2}>5. {content.topics[4]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section5Body}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.tip2Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>{content.tip2Text}</AwaText>
            </View>
          </AwaCard>

          <AwaText variant="titleLarge" emphasized style={styles.h2}>6. {content.topics[5]}</AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>{content.section6Body}</AwaText>

          <AwaCard variant="filled" padding="none" style={styles.checkList}>
            {content.doubtSteps.map(item => (
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

          <AwaCard variant="filled" padding="none" style={styles.alert}>
            <MaterialDesignIcons
              name="alert-circle-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <AwaText variant="titleSmall" emphasized>{content.alert2Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>{content.alert2Text}</AwaText>
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
              <AwaText variant="titleSmall" emphasized>{content.tip3Title}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.tipText}>{content.tip3Text}</AwaText>
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
  body: {marginTop: 8},
  wideImage: {width: '100%', height: 120, marginTop: 16, borderRadius: 12},
  daily: {marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  dailyItem: {
    width: '48.7%',
    minHeight: 108,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  dailyText: {
    marginTop: 8,
    textAlign: 'center',
  },
  checkList: {
    marginTop: 12,
    padding: 12,
  },
  checkListTitle: {marginBottom: 8},
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  checkText: {flex: 1},
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
