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
  da: {
    badge: 'ISTIHADHA',
    title: 'Forståelse af istihadha',
    metaDuration: '7 min læsning',
    metaType: 'FAQ',
    metaLevel: 'Mellemniveau',
    metaValidated: 'Gennemgået indhold',
    intro: 'Skelnen mellem uregelmæssig blødning og din normale menstruation, med generelle tegn der kan guide dig.',
    disclaimerTitle: 'Vigtig information',
    disclaimerText: 'Dette indhold er rent uddannelsesmæssigt. Religiøse spørgsmål bør valideres af kvalificerede lærde. AWA udsteder ikke fatwas eller personaliserede religiøse afgørelser.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvad er istihadha (unormal blødning)?',
      'Hvorfor kan det være svært at identificere?',
      'Forskelle mellem haidh og istihadha',
      'Hvordan observerer du blødningen?',
      'Bøn og faste under istihadha',
      'Hvad gør du i tilfælde af tvivl?',
      'Vigtige pointer',
    ],
    section1Body: 'Istihadha (unormal blødning) refererer til blødning, der opstår uden for den sædvanlige menstruationscyklus, eller som fortsætter ud over den menstruationsvarighed, der er anerkendt af islamisk tradition. I modsætning til haidh (menstruation) eller nifas (barselsblodet) har den ikke den samme rituelle status: den betragtes generelt som blødning af en anden karakter, sommetider forbundet med en medicinsk årsag.',
    note1Title: 'Bemærk venligst',
    note1Text: 'Dette indhold forklarer begrebet i generelle vendinger; det giver dig ikke mulighed for at afgøre, om en specifik blødningshændelse svarer til istihadha i din personlige situation.',
    section2Body: 'Det kan være svært at skelne istihadha fra menstruation eller en uregelmæssig cyklus, fordi blødningen sommetider kan ligne hinanden, variere i intensitet eller fortsætte på en usædvanlig måde. Denne vanskelighed er anerkendt af de lærde selv, hvilket forklarer, hvorfor der findes flere tilgange til at identificere den.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Det er normalt ikke med det samme at vide, hvad usædvanlig blødning svarer til; denne usikkerhed er en almindelig situation, ikke en fejl fra din side.',
    section3Body: 'Visse elementer kan hjælpe med at guide din tankegang, uden at være universelle regler, da de præcise tegn varierer i henhold til retsskolerne.',
    differences: [
      ['calendar-clock-outline', 'Varighed sammenlignet med din sædvanlige cyklus'],
      ['repeat-variant', 'Regelmæssighed eller usædvanlig karakter af blødningen'],
      ['water-outline', 'Hvordan blødningen udvikler sig over tid'],
      ['clipboard-pulse-outline', 'Mulig tilstedeværelse af en kendt medicinsk årsag'],
    ],
    note2Title: 'Bemærk venligst',
    note2Text: 'Disse elementer er generelle tegn, ikke absolutte kriterier: de kan fortolkes forskelligt af lærde og retsskoler.',
    section4Body: 'At tage sig tid til at observere din blødning over flere dage, uden at haste, hjælper dig med bedre at forstå din egen situation, inden du drager en konklusion.',
    checkList1Title: 'Nogle praktiske tips',
    observeTips: [
      'Notér startdatoen og, hvis muligt, den sædvanlige varighed af dine cyklusser',
      'Observer, om blødningen følger et mønster tæt på dine tidligere menstruationer',
      'Stol ikke på en enkelt isoleret dag alene',
      'Registrer disse observationer, hvis du planlægger at konsultere en lærd eller sundhedspersonale',
    ],
    section5Body: 'I tilfælde af istihadha er salat/bøn og faste generelt fortsat obligatorisk, i modsætning til under menstruation. Hygiejnemæssige forholdsregler (som passende beskyttelse) anbefales for at tillade fortsættelse af gudsdyrkelse, i henhold til de metoder, der undervises af de forskellige retsskoler.',
    tip2Title: 'Godt at vide',
    tip2Text: 'De præcise forholdsregler (som fornyelse af ablution) kan variere afhængigt af den fulgte retsskole; at henvise til den mening, du sædvanligvis følger, eller en kvalificeret lærd hjælper dig med at anvende dem korrekt.',
    section6Body: 'Vedvarende tvivl om blødningens natur er en almindelig situation og bør ikke være en kilde til overdreven bekymring.',
    doubtSteps: [
      'Henvis til din egne menstruationers sædvanlige varighed og rytme',
      'Konsultér en sundhedsprofessionel, hvis blødningen er usædvanlig eller langvarig',
      'Bed en kvalificeret lærd om sin mening om den religiøse dimension',
      'Husk, at et generelt svar ikke erstatter vejledning tilpasset din situation',
    ],
    alert2Title: 'Vigtig information',
    alert2Text: 'Dette indhold er og forbliver uddannelsesmæssigt og generelt: det udgør ikke en fatwa eller en individuel religiøs afgørelse. For enhver personlig situation, især i tilfælde af langvarig tvivl, forbliver meningen fra en kvalificeret lærd referencen.',
    tip3Title: 'Godt at vide',
    tip3Text: 'Istihadha er et begreb, der skelner usædvanlig blødning fra haidh eller nifas (barselsblodet), med specifikke konsekvenser for salat/bøn og faste. I tilfælde af tvivl forbliver omhyggelig observation og meningen fra en kvalificeret lærd de bedste ressourcer.',
    shareMessage: 'Forståelse af istihadha — AWA',
  },
  sv: {
    badge: 'ISTIHADHA',
    title: 'Forståelse av istihadha',
    metaDuration: '7 min läsning',
    metaType: 'FAQ',
    metaLevel: 'Mellemniveau',
    metaValidated: 'Gennemgået indhold',
    intro: 'Skelnen mellem uregelmässig blödning och din normale menstruation, med generelle tegn der kan guide dig.',
    disclaimerTitle: 'Vigtig information',
    disclaimerText: 'Dette indhold ar rent uddannelsesmässigt. Religiöse spörgsmål bör valideres av kvalificerede lärde. AWA udsteder inte fatwas eller personaliserede religiöse afgörelser.',
    contentsTitle: 'I denne artikel',
    topics: [
      'Hvad ar istihadha (unormal blödning)?',
      'Hvorfor kan det väre svärt at identificere?',
      'Forskelle mellem haidh och istihadha',
      'Hvordan observerer du blödningen?',
      'Bön och faste under istihadha',
      'Hvad gör du i tilfälde av tvivl?',
      'Vigtige pointer',
    ],
    section1Body: 'Istihadha (unormal blödning) refererer till blödning, der opstår uden for den sädvanlige menstruationscyklus, eller som fortsätter ud over den menstruationsvarighed, der ar anerkendt av islamisk tradition. I modsätning till haidh (menstruation) eller nifas (barselsblodet) har den inte den samme rituelle status: den betragtes generelt som blödning av en anden karakter, sommetider forbundet med en medicinsk årsag.',
    note1Title: 'Bemärk venligst',
    note1Text: 'Dette indhold forklarer begrebet i generelle vendinger; det giver dig inte mulighed for att afgöre, om en specifik blödningshändelse svarer till istihadha i din personlige situation.',
    section2Body: 'Det kan väre svärt at skelne istihadha fran menstruation eller en uregelmässig cyklus, fordi blödningen sommetider kan ligne hinanden, variere i intensitet eller fortsätte på en usädvanlig måde. Denne vanskelighed ar anerkendt av de lärde selv, hvilket forklarer, hvorfor der findes flere tilgange till at identificere den.',
    tip1Title: 'Godt at vide',
    tip1Text: 'Det ar normalt inte med det samme at vide, hvad usädvanlig blödning svarer til; denne usikkerhed ar en almindelig situation, inte en fejl fran din side.',
    section3Body: 'Visse elementer kan hjälpe med at guide din tankegang, uden at väre universelle regler, da de präcise tegn varierer i henhold till retsskolerne.',
    differences: [
      ['calendar-clock-outline', 'Varighed sammenlignet med din sädvanlige cyklus'],
      ['repeat-variant', 'Regelmässighed eller usädvanlig karakter av blödningen'],
      ['water-outline', 'Hvordan blödningen udvikler sig over tid'],
      ['clipboard-pulse-outline', 'Mulig tilstedevärelse av en kendt medicinsk årsag'],
    ],
    note2Title: 'Bemärk venligst',
    note2Text: 'Disse elementer ar generelle tegn, inte absolutte kriterier: de kan fortolkes forskelligt av lärde och retsskoler.',
    section4Body: 'At tage sig tid till at observere din blödning over flere dagar, uden at haste, hjälper dig med bedre at forstå din egen situation, inden du drager en konklusion.',
    checkList1Title: 'Nogle praktiske tips',
    observeTips: [
      'Notér startdatoen och, hvis muligt, den sädvanlige varighed av dina cyklusser',
      'Observer, om blödningen fölger et mönster tät på dina tidligere menstruationer',
      'Stol inte på en enkelt isoleret dag alene',
      'Registrer disse observationer, hvis du planlägger at konsultere en lärd eller halsaspersonale',
    ],
    section5Body: 'I tilfälde av istihadha ar salat/bön och faste generelt fortsat obligatorisk, i modsätning till under menstruation. Hygiejnemässige forholdsregler (som passende beskyttelse) anbefales for att tillade fortsättelse av gudsdyrkelse, i henhold till de metoder, der undervises av de forskellige retsskoler.',
    tip2Title: 'Godt at vide',
    tip2Text: 'De präcise forholdsregler (som fornyelse av ablution) kan variere afhängigt av den fulgte retsskole; at henvise till den mening, du sädvanligvis fölger, eller en kvalificeret lärd hjälper dig med at anvende dem korrekt.',
    section6Body: 'Vedvarende tvivl om blödningens natur ar en almindelig situation och bör inte väre en kilde till overdreven bekymring.',
    doubtSteps: [
      'Henvis till din egne menstruationers sädvanlige varighed och rytme',
      'Konsultér en halsasprofessionel, hvis blödningen ar usädvanlig eller langvarig',
      'Bed en kvalificeret lärd om sin mening om den religiöse dimension',
      'Husk, at et generelt svar inte erstatter vejledning tilpasset din situation',
    ],
    alert2Title: 'Vigtig information',
    alert2Text: 'Dette indhold ar och forbliver uddannelsesmässigt och generelt: det udgör inte en fatwa eller en individuel religiös afgörelse. For enhver personlig situation, isär i tilfälde av langvarig tvivl, forbliver meningen fran en kvalificeret lärd referencen.',
    tip3Title: 'Godt at vide',
    tip3Text: 'Istihadha ar et begreb, der skelner usädvanlig blödning fran haidh eller nifas (barselsblodet), med specifikke konsekvenser for salat/bön och faste. I tilfälde av tvivl forbliver omhyggelig observation och meningen fran en kvalificeret lärd de bedste ressourcer.',
    shareMessage: 'Forståelse av istihadha — AWA',
  },
  nb: {
    badge: 'ISTIHADA',
    title: 'Forstå istihada',
    metaDuration: '7 min lesing',
    metaType: 'Vanlige spørsmål',
    metaLevel: 'Middels',
    metaValidated: 'Gjennomgått innhold',
    intro: 'Skille uregelmessig blødning fra en vanlig mens, med generelle markører som veiledning.',
    disclaimerTitle: 'Viktig informasjon',
    disclaimerText: 'Dette innholdet er rent pedagogisk. Religiøse spørsmål bør avklares av kvalifiserte lærde. AWA utsteder ikke fatwaer eller personlige religiøse avgjørelser.',
    contentsTitle: 'I denne artikkelen',
    topics: [
      'Hva er istihada?',
      'Hvorfor kan den være vanskelig å kjenne igjen?',
      'Forskjeller mellom menstruasjon og istihada',
      'Hvordan observerer du blødningen?',
      'Bønn og faste under istihada',
      'Hva bør du gjøre ved tvil?',
      'Det viktigste å huske',
    ],
    section1Body: 'Istihada betegner blødning som oppstår utenfor den vanlige menstruasjonssyklusen, eller som fortsetter utover varigheten på menstruasjonen slik den er anerkjent i den islamske tradisjonen. I motsetning til menstruasjon (hayd) eller nifas (blødning etter fødsel) har den ikke samme rituelle status: den regnes vanligvis som blødning av en annen karakter, noen ganger knyttet til en medisinsk årsak.',
    note1Title: 'Merk',
    note1Text: 'Dette innholdet forklarer begrepet i generelle trekk; det lar deg ikke avgjøre om en bestemt blødning tilsvarer istihada i din personlige situasjon.',
    section2Body: 'Det kan være vanskelig å skille istihada fra menstruasjon eller en uregelmessig syklus, fordi blødningen noen ganger kan se lik ut, variere i styrke eller fortsette på en uvanlig måte. Denne vanskeligheten anerkjennes av de lærde selv, noe som forklarer hvorfor det finnes flere tilnærminger for å kjenne den igjen.',
    tip1Title: 'Godt å vite',
    tip1Text: 'Det er normalt å ikke vite med en gang hva en uvanlig blødning svarer til; denne usikkerheten er en vanlig situasjon, ikke en feil fra din side.',
    section3Body: 'Visse elementer kan hjelpe deg å tenke gjennom saken, uten å være universelle regler, siden de presise markørene varierer etter rettsskolene.',
    differences: [
      ['calendar-clock-outline', 'Varighet sammenlignet med din vanlige syklus'],
      ['repeat-variant', 'Regelmessighet eller uvanlig karakter ved blødningen'],
      ['water-outline', 'Hvordan blødningen utvikler seg over tid'],
      ['clipboard-pulse-outline', 'Mulig tilstedeværelse av en kjent medisinsk årsak'],
    ],
    note2Title: 'Merk',
    note2Text: 'Disse elementene er generelle markører, ikke absolutte kriterier: de kan tolkes ulikt av lærde og rettsskoler.',
    section4Body: 'Å ta seg tid til å observere blødningen over flere dager, uten hast, hjelper deg å forstå din egen situasjon bedre før du trekker en konklusjon.',
    checkList1Title: 'Noen praktiske pekepinner',
    observeTips: [
      'Noter startdatoen og, hvis mulig, den vanlige lengden på syklusene dine',
      'Observer om blødningen følger et mønster som ligner de tidligere menstruasjonene dine',
      'Ikke bygg bare på én enkelt isolert dag',
      'Noter disse observasjonene hvis du skal rådføre deg med en lærd eller helsepersonell',
    ],
    section5Body: 'Ved istihada forblir bønn og faste vanligvis obligatorisk, i motsetning til under menstruasjon. Hygienetiltak (som egnet beskyttelse) anbefales da for at gudstjenesten kan fortsette, i samsvar med metodene som læres av de ulike rettsskolene.',
    tip2Title: 'Godt å vite',
    tip2Text: 'De presise tiltakene (som å fornye avvaskingen) kan variere avhengig av rettsskolen som følges; å holde seg til uttalelsen du vanligvis følger eller til en kvalifisert lærd hjelper deg å anvende dem riktig.',
    section6Body: 'Vedvarende tvil om blødningens karakter er en vanlig situasjon, og bør ikke være en kilde til overdreven bekymring.',
    doubtSteps: [
      'Hold deg til den vanlige varigheten og rytmen på dine egne menstruasjoner',
      'Kontakt helsepersonell hvis blødningen er uvanlig eller langvarig',
      'Spør en kvalifisert lærd om uttalelsen om den religiøse siden',
      'Husk at et generelt svar ikke erstatter veiledning tilpasset din situasjon',
    ],
    alert2Title: 'Viktig informasjon',
    alert2Text: 'Dette innholdet er fortsatt pedagogisk og generelt: det utgjør ikke en fatwa eller en individuell religiøs avgjørelse. For enhver personlig situasjon, særlig ved langvarig tvil, er uttalelsen fra en kvalifisert lærd fortsatt referansen.',
    tip3Title: 'Godt å vite',
    tip3Text: 'Istihada er et begrep som skiller uvanlig blødning fra menstruasjon eller nifas, med spesifikke følger for bønn og faste. Ved tvil er nøye observasjon og uttalelsen fra en kvalifisert lærd fortsatt de beste ressursene.',
    shareMessage: 'Forstå istihada – AWA',
  },
  pl: {
    badge: 'ISTIHADA',
    title: 'Zrozumieć istihadę',
    metaDuration: '7 min czytania',
    metaType: 'FAQ',
    metaLevel: 'Średnio zaawansowany',
    metaValidated: 'Treść zweryfikowana',
    intro: 'Odróżnianie nieregularnego krwawienia od zwykłej miesiączki, z ogólnymi wskazówkami pomagającymi się zorientować.',
    disclaimerTitle: 'Ważna informacja',
    disclaimerText: 'Ta treść ma wyłącznie charakter edukacyjny. Kwestie religijne powinni weryfikować wykwalifikowani uczeni. AWA nie wydaje fatw ani spersonalizowanych orzeczeń religijnych.',
    contentsTitle: 'W tym artykule',
    topics: [
      'Czym jest istihada?',
      'Dlaczego trudno ją rozpoznać?',
      'Różnice między menstruacją a istihadą',
      'Jak obserwować krwawienie?',
      'Modlitwa i post podczas istihady',
      'Co zrobić w razie wątpliwości?',
      'Najważniejsze wnioski',
    ],
    section1Body: 'Istihada oznacza krwawienie występujące poza zwykłym cyklem menstruacyjnym lub trwające dłużej niż czas menstruacji uznawany przez tradycję islamską. W przeciwieństwie do menstruacji (hajd) czy nifas (krwawienia po porodzie) nie ma tego samego statusu rytualnego: zasadniczo uważa się je za krwawienie innej natury, czasem związane z przyczyną medyczną.',
    note1Title: 'Zwróć uwagę',
    note1Text: 'Ta treść wyjaśnia pojęcie w sposób ogólny; nie pozwala ustalić, czy konkretne krwawienie odpowiada istihadzie w Twojej osobistej sytuacji.',
    section2Body: 'Trudno odróżnić istihadę od menstruacji lub nieregularnego cyklu, ponieważ krwawienie może czasem wyglądać podobnie, zmieniać natężenie lub utrzymywać się w nietypowy sposób. Tę trudność dostrzegają sami uczeni, co wyjaśnia, dlaczego istnieje kilka podejść do jej rozpoznawania.',
    tip1Title: 'Warto wiedzieć',
    tip1Text: 'To normalne, że nie od razu wiesz, czemu odpowiada nietypowe krwawienie; ta niepewność jest częstą sytuacją, a nie Twoim błędem.',
    section3Body: 'Niektóre elementy mogą pomóc w zastanowieniu się, nie będąc uniwersalnymi regułami, ponieważ dokładne znaczniki różnią się w zależności od szkół prawa.',
    differences: [
      ['calendar-clock-outline', 'Czas trwania w porównaniu z Twoim zwykłym cyklem'],
      ['repeat-variant', 'Regularność lub nietypowy charakter krwawienia'],
      ['water-outline', 'Jak krwawienie zmienia się w czasie'],
      ['clipboard-pulse-outline', 'Możliwa znana przyczyna medyczna'],
    ],
    note2Title: 'Zwróć uwagę',
    note2Text: 'Te elementy to ogólne znaczniki, a nie bezwzględne kryteria: uczeni i szkoły prawa mogą je interpretować różnie.',
    section4Body: 'Poświęcenie czasu na obserwację krwawienia przez kilka dni, bez pośpiechu, pomaga lepiej zrozumieć własną sytuację, zanim wyciągnie się wniosek.',
    checkList1Title: 'Kilka praktycznych wskazówek',
    observeTips: [
      'Zanotuj datę początku i, jeśli to możliwe, zwykłą długość swoich cykli',
      'Zaobserwuj, czy krwawienie przebiega według wzorca zbliżonego do Twoich poprzednich miesiączek',
      'Nie opieraj się tylko na jednym odosobnionym dniu',
      'Zapisuj te obserwacje, jeśli planujesz konsultację z uczonym lub lekarzem',
    ],
    section5Body: 'W przypadku istihady modlitwa i post zasadniczo pozostają obowiązkowe, w przeciwieństwie do menstruacji. Zalecane są wtedy środki ostrożności higienicznej (takie jak odpowiednia ochrona), aby umożliwić kontynuowanie kultu, zgodnie z metodami nauczanymi przez różne szkoły prawa.',
    tip2Title: 'Warto wiedzieć',
    tip2Text: 'Dokładne środki ostrożności (takie jak ponawianie ablucji) mogą się różnić w zależności od przestrzeganej szkoły prawa; odwołanie się do opinii, której zwykle przestrzegasz, lub do wykwalifikowanego uczonego pomaga zastosować je prawidłowo.',
    section6Body: 'Uporczywa wątpliwość co do charakteru krwawienia to częsta sytuacja i nie powinna być źródłem nadmiernego niepokoju.',
    doubtSteps: [
      'Odwołaj się do zwykłego czasu trwania i rytmu swoich miesiączek',
      'Skonsultuj się ze specjalistą, jeśli krwawienie jest nietypowe lub przedłużone',
      'Poproś wykwalifikowanego uczonego o opinię w kwestii religijnej',
      'Pamiętaj, że ogólna odpowiedź nie zastępuje wskazówek dopasowanych do Twojej sytuacji',
    ],
    alert2Title: 'Ważna informacja',
    alert2Text: 'Ta treść pozostaje edukacyjna i ogólna: nie stanowi fatwy ani indywidualnego orzeczenia religijnego. W każdej osobistej sytuacji, zwłaszcza przy długotrwałych wątpliwościach, punktem odniesienia pozostaje opinia wykwalifikowanego uczonego.',
    tip3Title: 'Warto wiedzieć',
    tip3Text: 'Istihada to pojęcie odróżniające nietypowe krwawienie od menstruacji lub nifas, z określonymi konsekwencjami dla modlitwy i postu. W razie wątpliwości uważna obserwacja i opinia wykwalifikowanego uczonego pozostają najlepszymi źródłami.',
    shareMessage: 'Zrozumieć istihadę — AWA',
  },
  uk: {
    badge: 'ІСТИХАДА',
    title: 'Розуміння істихади',
    metaDuration: '7 хв читання',
    metaType: 'Запитання',
    metaLevel: 'Середній',
    metaValidated: 'Перевірений вміст',
    intro: 'Відрізнення нерегулярної кровотечі від звичайної менструації із загальними орієнтирами, що допоможуть зорієнтуватися.',
    disclaimerTitle: 'Важлива інформація',
    disclaimerText: 'Цей вміст має виключно навчальний характер. Релігійні питання мають перевіряти кваліфіковані вчені. AWA не виносить фетв і не дає персоналізованих релігійних висновків.',
    contentsTitle: 'У цій статті',
    topics: [
      'Що таке істихада?',
      'Чому її важко розпізнати?',
      'Відмінності між менструацією та істихадою',
      'Як спостерігати кровотечу?',
      'Молитва і піст під час істихади',
      'Що робити у разі сумніву?',
      'Головні висновки',
    ],
    section1Body: 'Істихада означає кровотечу, що виникає поза звичайним менструальним циклом або триває довше за тривалість менструації, визнану ісламською традицією. На відміну від менструації (хайд) чи ніфасу (кровотеча після пологів), вона не має такого самого ритуального статусу: загалом її вважають кровотечею іншої природи, іноді пов’язаною з медичною причиною.',
    note1Title: 'Зверніть увагу',
    note1Text: 'Цей вміст пояснює поняття в загальних рисах; він не дозволяє визначити, чи конкретна кровотеча відповідає істихаді у вашій особистій ситуації.',
    section2Body: 'Істихаду буває важко відрізнити від менструації чи нерегулярного циклу, адже кровотеча іноді може виглядати схоже, змінюватися за інтенсивністю або тривати незвичним чином. Цю складність визнають і самі вчені, чим пояснюється існування кількох підходів до її розпізнавання.',
    tip1Title: 'Варто знати',
    tip1Text: 'Нормально не знати одразу, чому відповідає нетипова кровотеча; ця невизначеність — поширена ситуація, а не ваша помилка.',
    section3Body: 'Деякі елементи можуть допомогти в міркуваннях, не будучи універсальними правилами, адже точні орієнтири різняться залежно від шкіл правознавства.',
    differences: [
      ['calendar-clock-outline', 'Тривалість порівняно з вашим звичним циклом'],
      ['repeat-variant', 'Регулярність або нетиповий характер кровотечі'],
      ['water-outline', 'Як кровотеча змінюється з часом'],
      ['clipboard-pulse-outline', 'Можлива наявність відомої медичної причини'],
    ],
    note2Title: 'Зверніть увагу',
    note2Text: 'Ці елементи — загальні орієнтири, а не абсолютні критерії: вчені та школи правознавства можуть тлумачити їх по-різному.',
    section4Body: 'Приділення часу спостереженню за кровотечею протягом кількох днів, без поспіху, допомагає краще зрозуміти власну ситуацію, перш ніж робити висновок.',
    checkList1Title: 'Кілька практичних підказок',
    observeTips: [
      'Занотуйте дату початку та, якщо можливо, звичну тривалість ваших циклів',
      'Спостерігайте, чи кровотеча має характер, близький до ваших попередніх менструацій',
      'Не спирайтеся лише на один окремий день',
      'Записуйте ці спостереження, якщо плануєте звернутися до вченого або лікаря',
    ],
    section5Body: 'У разі істихади молитва і піст зазвичай залишаються обов’язковими, на відміну від менструації. Тоді рекомендовано застосовувати гігієнічні запобіжні заходи (як-от відповідний засіб гігієни), щоб дозволити продовжувати богослужіння, згідно з методами, яких навчають різні школи правознавства.',
    tip2Title: 'Варто знати',
    tip2Text: 'Точні запобіжні заходи (як-от поновлення омовіння) можуть відрізнятися залежно від школи правознавства, якої дотримуються; звернення до думки, якої ви зазвичай дотримуєтеся, або до кваліфікованого вченого допомагає застосовувати їх правильно.',
    section6Body: 'Стійкий сумнів щодо характеру кровотечі — поширена ситуація й не повинен бути джерелом надмірного занепокоєння.',
    doubtSteps: [
      'Спирайтеся на звичну тривалість і ритм ваших власних менструацій',
      'Зверніться до медичного фахівця, якщо кровотеча нетипова або тривала',
      'Попросіть кваліфікованого вченого висловити думку щодо релігійного виміру',
      'Пам’ятайте, що загальна відповідь не замінює настанов, підібраних до вашої ситуації',
    ],
    alert2Title: 'Важлива інформація',
    alert2Text: 'Цей вміст залишається навчальним і загальним: він не є фетвою чи індивідуальним релігійним висновком. У будь-якій особистій ситуації, особливо в разі тривалого сумніву, орієнтиром залишається думка кваліфікованого вченого.',
    tip3Title: 'Варто знати',
    tip3Text: 'Істихада — поняття, що відрізняє нетипову кровотечу від менструації чи ніфасу, з певними наслідками для молитви й посту. У разі сумніву уважне спостереження та думка кваліфікованого вченого залишаються найкращими джерелами.',
    shareMessage: 'Розуміння істихади — AWA',
  },
  cs: {
    badge: 'ISTIHÁDA',
    title: 'Pochopení istihády',
    metaDuration: '7 min čtení',
    metaType: 'Časté dotazy',
    metaLevel: 'Pokročilý',
    metaValidated: 'Ověřený obsah',
    intro: 'Rozlišení nepravidelného krvácení od běžné menstruace, s obecnými orientačními body, které vás mohou vést.',
    disclaimerTitle: 'Důležitá informace',
    disclaimerText: 'Tento obsah je čistě vzdělávací. Náboženské otázky by měly být konzultovány s kvalifikovanými učenci. AWA nevydává fatwy ani osobní náboženská stanoviska.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Co je istihada?',
      'Proč může být obtížné ji rozpoznat?',
      'Rozdíly mezi menstruací a istihádou',
      'Jak krvácení pozorovat?',
      'Modlitba a půst během istihády',
      'Co dělat v případě pochybností?',
      'Hlavní poznatky',
    ],
    section1Body: 'Istihada označuje krvácení, které se objevuje mimo obvyklý menstruační cyklus nebo které pokračuje po uplynutí doby menstruace uznávané islámskou tradicí. Na rozdíl od menstruace (hajd) nebo nifásu (krvácení po porodu) nemá stejné rituální postavení: obecně se považuje za krvácení jiné povahy, někdy souvisejícího se zdravotní příčinou.',
    note1Title: 'Upozornění',
    note1Text: 'Tento obsah vysvětluje pojem obecně; neumožňuje vám určit, zda konkrétní krvácení ve vaší osobní situaci odpovídá istihádě.',
    section2Body: 'Istihadu může být obtížné odlišit od menstruace nebo nepravidelného cyklu, protože krvácení může někdy vypadat podobně, lišit se v intenzitě nebo pokračovat neobvyklým způsobem. Tuto obtíž uznávají i sami učenci, což vysvětluje, proč existuje několik přístupů k jejímu rozpoznání.',
    tip1Title: 'Stojí za to vědět',
    tip1Text: 'Je normální nevědět hned, čemu neobvyklé krvácení odpovídá; tato nejistota je běžná situace, nikoli vaše chyba.',
    section3Body: 'Některé prvky mohou usměrnit vaše uvažování, aniž by šlo o univerzální pravidla, protože přesné orientační body se liší podle právních škol.',
    differences: [
      ['calendar-clock-outline', 'Délka ve srovnání s vaším obvyklým cyklem'],
      ['repeat-variant', 'Pravidelnost nebo neobvyklá povaha krvácení'],
      ['water-outline', 'Jak se krvácení vyvíjí v čase'],
      ['clipboard-pulse-outline', 'Možná přítomnost známé zdravotní příčiny'],
    ],
    note2Title: 'Upozornění',
    note2Text: 'Tyto prvky jsou obecné orientační body, nikoli absolutní kritéria: učenci a právní školy je mohou vykládat různě.',
    section4Body: 'Věnovat čas pozorování krvácení po několik dní, bez spěchu, vám pomůže lépe pochopit vlastní situaci, než vyvodíte závěr.',
    checkList1Title: 'Několik praktických rad',
    observeTips: [
      'Poznamenejte si datum začátku a, je-li to možné, obvyklou délku svých cyklů',
      'Sledujte, zda krvácení sleduje vzorec blízký vašim předchozím menstruacím',
      'Nespoléhejte se jen na jediný izolovaný den',
      'Tato pozorování si zaznamenejte, pokud plánujete navštívit učence nebo zdravotnického pracovníka',
    ],
    section5Body: 'V případě istihády modlitba a půst obecně zůstávají povinné, na rozdíl od menstruace. Hygienická opatření (například vhodná ochrana) se pak doporučují, aby bylo možné pokračovat v bohoslužbě, podle postupů vyučovaných různými právními školami.',
    tip2Title: 'Stojí za to vědět',
    tip2Text: 'Přesná opatření (například obnovování rituální očisty) se mohou lišit podle právní školy, kterou se řídíte; odkaz na názor, který obvykle sledujete, nebo na kvalifikovaného učence vám pomůže je správně uplatňovat.',
    section6Body: 'Přetrvávající pochybnost o povaze krvácení je běžná situace a neměla by být zdrojem nadměrných obav.',
    doubtSteps: [
      'Vyjděte z obvyklé délky a rytmu vlastních menstruací',
      'Navštivte zdravotnického pracovníka, pokud je krvácení neobvyklé nebo dlouhodobé',
      'Požádejte kvalifikovaného učence o názor na náboženský rozměr',
      'Pamatujte, že obecná odpověď nenahrazuje vedení přizpůsobené vaší situaci',
    ],
    alert2Title: 'Důležitá informace',
    alert2Text: 'Tento obsah zůstává vzdělávací a obecný: nepředstavuje fatwu ani individuální náboženské stanovisko. Pro jakoukoli osobní situaci, zejména při dlouhotrvající pochybnosti, zůstává referencí názor kvalifikovaného učence.',
    tip3Title: 'Stojí za to vědět',
    tip3Text: 'Istihada je pojem, který odlišuje neobvyklé krvácení od menstruace nebo nifásu, se specifickými důsledky pro modlitbu a půst. V případě pochybností zůstávají nejlepšími zdroji pečlivé pozorování a názor kvalifikovaného učence.',
    shareMessage: 'Pochopení istihády — AWA',
  },
  sk: {
    badge: 'ISTIHÁDA',
    title: 'Pochopenie istihády',
    metaDuration: '7 min čítania',
    metaType: 'Často kladené otázky',
    metaLevel: 'Stredne pokročilý',
    metaValidated: 'Overený obsah',
    intro: 'Rozlíšenie nepravidelného krvácania od vašej obvyklej menštruácie so všeobecnými orientačnými bodmi.',
    disclaimerTitle: 'Dôležitá informácia',
    disclaimerText: 'Tento obsah je čisto vzdelávací. Náboženské otázky by mali potvrdiť kvalifikovaní učenci. AWA nevydáva fatwy ani individuálne náboženské rozhodnutia.',
    contentsTitle: 'V tomto článku',
    topics: [
      'Čo je istihada?',
      'Prečo môže byť ťažké ju rozpoznať?',
      'Rozdiely medzi menštruáciou a istihádou',
      'Ako krvácanie pozorovať?',
      'Modlitba a pôst počas istihády',
      'Čo robiť v prípade pochybností?',
      'Hlavné body',
    ],
    section1Body: 'Istihada označuje krvácanie, ktoré sa objavuje mimo obvyklého menštruačného cyklu alebo pokračuje po uplynutí trvania menštruácie uznávaného islamskou tradíciou. Na rozdiel od menštruácie (hajd) alebo nifásu (krvácanie po pôrode) nemá rovnaké rituálne postavenie: vo všeobecnosti sa považuje za krvácanie inej povahy, niekedy spojené s lekárskou príčinou.',
    note1Title: 'Upozornenie',
    note1Text: 'Tento obsah vysvetľuje pojem vo všeobecnosti; neumožňuje vám určiť, či konkrétne krvácanie vo vašej osobnej situácii zodpovedá istihádu.',
    section2Body: 'Istihádu môže byť ťažké odlíšiť od menštruácie alebo nepravidelného cyklu, pretože krvácanie môže niekedy vyzerať podobne, líšiť sa intenzitou alebo pokračovať nezvyčajným spôsobom. Túto ťažkosť uznávajú aj sami učenci, čo vysvetľuje, prečo existuje niekoľko prístupov k jej určeniu.',
    tip1Title: 'Stojí za to vedieť',
    tip1Text: 'Je normálne nevedieť hneď, čomu nezvyčajné krvácanie zodpovedá; táto neistota je bežná situácia, nie vaša chyba.',
    section3Body: 'Niektoré prvky môžu pomôcť usmerniť vaše uvažovanie, bez toho, aby boli univerzálnymi pravidlami, pretože presné orientačné body sa líšia podľa právnych škôl.',
    differences: [
      ['calendar-clock-outline', 'Trvanie v porovnaní s vaším obvyklým cyklom'],
      ['repeat-variant', 'Pravidelnosť alebo nezvyčajná povaha krvácania'],
      ['water-outline', 'Ako sa krvácanie v čase vyvíja'],
      ['clipboard-pulse-outline', 'Možná prítomnosť známej lekárskej príčiny'],
    ],
    note2Title: 'Upozornenie',
    note2Text: 'Tieto prvky sú všeobecné orientačné body, nie absolútne kritériá: učenci a právne školy ich môžu vykladať odlišne.',
    section4Body: 'Ak si dáte čas pozorovať svoje krvácanie niekoľko dní, bez ponáhľania, pomôže vám to lepšie pochopiť vlastnú situáciu pred vyvodením záveru.',
    checkList1Title: 'Niekoľko praktických odporúčaní',
    observeTips: [
      'Poznačte si dátum začiatku a, ak je to možné, obvyklú dĺžku vašich cyklov',
      'Sledujte, či krvácanie sleduje vzorec podobný vašim predchádzajúcim menštruáciám',
      'Nespoliehajte sa len na jediný izolovaný deň',
      'Tieto pozorovania si zaznamenajte, ak plánujete poradiť sa s učencom alebo zdravotníckym pracovníkom',
    ],
    section5Body: 'V prípade istihády modlitba a pôst vo všeobecnosti zostávajú povinné, na rozdiel od menštruácie. Hygienické opatrenia (napríklad vhodná pomôcka) sa potom odporúčajú, aby bolo možné pokračovať v bohoslužbe podľa metód vyučovaných rôznymi právnymi školami.',
    tip2Title: 'Stojí za to vedieť',
    tip2Text: 'Presné opatrenia (napríklad obnovenie obmytia) sa môžu líšiť podľa nasledovanej právnej školy; odkaz na názor, ktorý zvyčajne nasledujete, alebo na kvalifikovaného učenca vám pomôže uplatniť ich správne.',
    section6Body: 'Pretrvávajúca pochybnosť o povahe krvácania je bežná situácia a nemala by byť zdrojom nadmerných obáv.',
    doubtSteps: [
      'Vychádzajte z obvyklého trvania a rytmu vlastných menštruácií',
      'Ak je krvácanie nezvyčajné alebo dlhotrvajúce, vyhľadajte zdravotníckeho pracovníka',
      'Požiadajte kvalifikovaného učenca o názor na náboženský rozmer',
      'Pamätajte, že všeobecná odpoveď nenahrádza usmernenie prispôsobené vašej situácii',
    ],
    alert2Title: 'Dôležitá informácia',
    alert2Text: 'Tento obsah zostáva vzdelávací a všeobecný: nie je fatwou ani individuálnym náboženským rozhodnutím. Pri každej osobnej situácii, najmä pri dlhotrvajúcej pochybnosti, zostáva referenciou názor kvalifikovaného učenca.',
    tip3Title: 'Stojí za to vedieť',
    tip3Text: 'Istihada je pojem, ktorý odlišuje nezvyčajné krvácanie od menštruácie alebo nifásu, s osobitnými dôsledkami pre modlitbu a pôst. V prípade pochybností zostáva starostlivé pozorovanie a názor kvalifikovaného učenca najlepším zdrojom.',
    shareMessage: 'Pochopenie istihády — AWA',
  },
  hu: {
    badge: 'ISTIHÁDA',
    title: 'Az istihada megértése',
    metaDuration: '7 perc olvasás',
    metaType: 'GYIK',
    metaLevel: 'Középhaladó',
    metaValidated: 'Ellenőrzött tartalom',
    intro: 'A szabálytalan vérzés megkülönböztetése a szokásos menstruációdtól, általános támpontokkal.',
    disclaimerTitle: 'Fontos információ',
    disclaimerText: 'Ez a tartalom kizárólag ismeretterjesztő. A vallási kérdéseket kvalifikált tudósoknak kell megerősíteniük. Az AWA nem ad ki fatwákat vagy személyre szóló vallási döntéseket.',
    contentsTitle: 'Ebben a cikkben',
    topics: [
      'Mi az istihada?',
      'Miért lehet nehéz azonosítani?',
      'A menstruáció és az istihada közötti különbségek',
      'Hogyan figyeld meg a vérzést?',
      'Ima és böjt az istihada alatt',
      'Mit tegyél kétség esetén?',
      'Legfontosabb tudnivalók',
    ],
    section1Body: 'Az istihada a szokásos menstruációs cikluson kívül jelentkező, vagy az iszlám hagyomány által elismert menstruációs időtartamon túl folytatódó vérzést jelöli. A menstruációtól (hajd) vagy a nifásztól (szülés utáni vérzés) eltérően nincs azonos rituális státusza: általában más természetű vérzésnek tekintik, amely néha orvosi okhoz kapcsolódik.',
    note1Title: 'Figyelem',
    note1Text: 'Ez a tartalom általános módon magyarázza a fogalmat; nem teszi lehetővé annak eldöntését, hogy egy konkrét vérzés a te személyes helyzetedben istihadának felel-e meg.',
    section2Body: 'Az istihadát nehéz megkülönböztetni a menstruációtól vagy a szabálytalan ciklustól, mert a vérzés néha hasonlónak tűnhet, erőssége változhat, vagy szokatlan módon folytatódhat. Ezt a nehézséget maguk a tudósok is elismerik, ami megmagyarázza, miért létezik több megközelítés az azonosítására.',
    tip1Title: 'Érdemes tudni',
    tip1Text: 'Normális, hogy nem tudod azonnal, mire utal egy szokatlan vérzés; ez a bizonytalanság gyakori helyzet, nem a te hibád.',
    section3Body: 'Egyes elemek segíthetnek a gondolkodásod irányításában, anélkül, hogy általános szabályok lennének, mivel a pontos támpontok a jogi iskoláktól függően eltérnek.',
    differences: [
      ['calendar-clock-outline', 'Az időtartam a szokásos ciklusodhoz képest'],
      ['repeat-variant', 'A vérzés rendszeressége vagy szokatlan jellege'],
      ['water-outline', 'Hogyan alakul a vérzés az idő során'],
      ['clipboard-pulse-outline', 'Ismert orvosi ok lehetséges jelenléte'],
    ],
    note2Title: 'Figyelem',
    note2Text: 'Ezek az elemek általános támpontok, nem abszolút kritériumok: a tudósok és a jogi iskolák eltérően értelmezhetik őket.',
    section4Body: 'Ha időt szánsz a vérzésed több napon át tartó megfigyelésére, sietség nélkül, az segít jobban megérteni a saját helyzetedet, mielőtt következtetést vonnál le.',
    checkList1Title: 'Néhány gyakorlati tudnivaló',
    observeTips: [
      'Jegyezd fel a kezdő dátumot és — ha lehetséges — a ciklusaid szokásos hosszát',
      'Figyeld meg, hogy a vérzés a korábbi menstruációidhoz hasonló mintát követ-e',
      'Ne hagyatkozz csak egyetlen elszigetelt napra',
      'Jegyezd fel ezeket a megfigyeléseket, ha tudóshoz vagy egészségügyi szakemberhez készülsz fordulni',
    ],
    section5Body: 'Az istihada esetén az ima és a böjt általában kötelező marad, a menstruációval ellentétben. Higiéniai óvintézkedések (például megfelelő védelem) ilyenkor ajánlottak, hogy az istentisztelet folytatható legyen, a különböző jogi iskolák által tanított módszerek szerint.',
    tip2Title: 'Érdemes tudni',
    tip2Text: 'A pontos óvintézkedések (például az abdesztelés megújítása) a követett jogi iskolától függően eltérhetnek; a szokásosan követett véleményre vagy egy kvalifikált tudósra hivatkozás segít helyesen alkalmazni őket.',
    section6Body: 'A vérzés természetével kapcsolatos tartós kétség gyakori helyzet, és nem szabad túlzott aggodalom forrásává válnia.',
    doubtSteps: [
      'Támaszkodj a saját menstruációid szokásos időtartamára és ritmusára',
      'Fordulj egészségügyi szakemberhez, ha a vérzés szokatlan vagy hosszan tartó',
      'Kérd ki egy kvalifikált tudós véleményét a vallási szempontról',
      'Ne feledd, hogy egy általános válasz nem helyettesíti a helyzetedhez igazított útmutatást',
    ],
    alert2Title: 'Fontos információ',
    alert2Text: 'Ez a tartalom ismeretterjesztő és általános marad: nem fatwa és nem egyéni vallási döntés. Bármely személyes helyzetben, különösen tartós kétség esetén, a kvalifikált tudós véleménye marad az irányadó.',
    tip3Title: 'Érdemes tudni',
    tip3Text: 'Az istihada olyan fogalom, amely megkülönbözteti a szokatlan vérzést a menstruációtól vagy a nifásztól, az ima és a böjt tekintetében sajátos következményekkel. Kétség esetén a gondos megfigyelés és a kvalifikált tudós véleménye marad a legjobb forrás.',
    shareMessage: 'Az istihada megértése — AWA',
  },
  ro: {
    badge: 'ISTIHÂDA',
    title: 'Înțelegerea Istihâda',
    metaDuration: '7 min de citit',
    metaType: 'Întrebări frecvente',
    metaLevel: 'Intermediar',
    metaValidated: 'Conținut revizuit',
    intro: 'Cum deosebești o sângerare neregulată de menstruația ta obișnuită, cu repere generale care să te ghideze.',
    disclaimerTitle: 'Informație importantă',
    disclaimerText: 'Acest conținut este pur educativ. Întrebările religioase trebuie validate de savanți calificați. AWA nu emite fatwa și nici hotărâri religioase personalizate.',
    contentsTitle: 'În acest articol',
    topics: [
      'Ce este Istihâda?',
      'De ce poate fi greu de identificat?',
      'Diferențele dintre menstruație și Istihâda',
      'Cum observi sângerarea?',
      'Rugăciunea și postul în timpul Istihâdei',
      'Ce faci în caz de îndoială?',
      'Ce să reții',
    ],
    section1Body: 'Istihâda desemnează sângerarea care apare în afara ciclului menstrual obișnuit sau care continuă dincolo de durata menstruației recunoscută de tradiția islamică. Spre deosebire de menstruație (hayd) sau de nifas (sângerarea de după naștere), ea nu are același statut ritual: este în general considerată o sângerare de altă natură, uneori legată de o cauză medicală.',
    note1Title: 'Atenție',
    note1Text: 'Acest conținut explică noțiunea în termeni generali; el nu îți permite să stabilești dacă o anumită sângerare corespunde Istihâdei în situația ta personală.',
    section2Body: 'Poate fi greu să deosebești Istihâda de menstruație sau de un ciclu neregulat, deoarece sângerarea poate arăta uneori asemănător, poate varia în intensitate sau poate continua într-un mod neobișnuit. Această dificultate este recunoscută de savanții înșiși, ceea ce explică de ce există mai multe abordări pentru identificarea ei.',
    tip1Title: 'Bine de știut',
    tip1Text: 'Este normal să nu știi imediat cu ce corespunde o sângerare neobișnuită; această incertitudine este o situație frecventă, nu o greșeală a ta.',
    section3Body: 'Anumite elemente pot ajuta la orientarea reflecției tale, fără a fi reguli universale, deoarece reperele precise variază în funcție de școlile de jurisprudență.',
    differences: [
      ['calendar-clock-outline', 'Durata în raport cu ciclul tău obișnuit'],
      ['repeat-variant', 'Regularitatea sau caracterul neobișnuit al sângerării'],
      ['water-outline', 'Cum evoluează sângerarea în timp'],
      ['clipboard-pulse-outline', 'Posibila prezență a unei cauze medicale cunoscute'],
    ],
    note2Title: 'Atenție',
    note2Text: 'Aceste elemente sunt repere generale, nu criterii absolute: ele pot fi interpretate diferit de savanți și de școlile de jurisprudență.',
    section4Body: 'Faptul că îți iei timp să-ți observi sângerarea timp de mai multe zile, fără grabă, te ajută să-ți înțelegi mai bine propria situație înainte de a trage o concluzie.',
    checkList1Title: 'Câteva repere practice',
    observeTips: [
      'Notează data de început și, dacă este posibil, durata obișnuită a ciclurilor tale',
      'Observă dacă sângerarea urmează un tipar apropiat de menstruațiile tale anterioare',
      'Nu te baza doar pe o singură zi izolată',
      'Înregistrează aceste observații dacă ai de gând să consulți un savant sau un profesionist din domeniul sănătății',
    ],
    section5Body: 'În cazul Istihâdei, rugăciunea și postul rămân în general obligatorii, spre deosebire de perioada menstruației. Precauțiile de igienă (precum o protecție potrivită) sunt atunci recomandate pentru a permite continuarea cultului, conform metodelor predate de diferitele școli de jurisprudență.',
    tip2Title: 'Bine de știut',
    tip2Text: 'Precauțiile precise (precum reînnoirea ablațiunilor) pot varia în funcție de școala de jurisprudență urmată; raportarea la părerea pe care o urmezi de obicei sau la un savant calificat te ajută să le aplici corect.',
    section6Body: 'Îndoiala persistentă cu privire la natura unei sângerări este o situație frecventă și nu ar trebui să fie o sursă de îngrijorare excesivă.',
    doubtSteps: [
      'Raportează-te la durata și ritmul obișnuit ale propriilor tale menstruații',
      'Consultă un profesionist din domeniul sănătății dacă sângerarea este neobișnuită sau prelungită',
      'Cere părerea unui savant calificat cu privire la dimensiunea religioasă',
      'Ține minte că un răspuns general nu înlocuiește o îndrumare adaptată situației tale',
    ],
    alert2Title: 'Informație importantă',
    alert2Text: 'Acest conținut rămâne educativ și general: nu constituie o fatwa sau o hotărâre religioasă individuală. Pentru orice situație personală, în special în caz de îndoială prelungită, părerea unui savant calificat rămâne referința.',
    tip3Title: 'Bine de știut',
    tip3Text: 'Istihâda este o noțiune care deosebește sângerarea neobișnuită de menstruație sau de nifas, cu implicații specifice pentru rugăciune și post. În caz de îndoială, observarea atentă și părerea unui savant calificat rămân cele mai bune resurse.',
    shareMessage: 'Înțelegerea Istihâdei — AWA',
  },
  bg: {
    badge: 'ИСТИХАДА',
    title: 'Разбиране на истихада',
    metaDuration: '7 мин четене',
    metaType: 'Чести въпроси',
    metaLevel: 'Средно ниво',
    metaValidated: 'Проверено съдържание',
    intro: 'Как да различиш нередовното кървене от обичайната си менструация, с общи ориентири, които да те насочват.',
    disclaimerTitle: 'Важна информация',
    disclaimerText: 'Това съдържание е чисто образователно. Религиозните въпроси трябва да бъдат валидирани от квалифицирани учени. AWA не издава фетви и не дава персонализирани религиозни решения.',
    contentsTitle: 'В тази статия',
    topics: [
      'Какво е истихада?',
      'Защо може да е трудно да се определи?',
      'Разлики между менструацията и истихада',
      'Как да наблюдаваш кървенето?',
      'Молитвата и постът по време на истихада',
      'Какво да направиш при съмнение?',
      'Какво да запомниш',
    ],
    section1Body: 'Истихада означава кървене, което настъпва извън обичайния менструален цикъл или продължава отвъд продължителността на менструацията, призната от ислямската традиция. За разлика от менструацията (хайд) или нифаса (кървенето след раждане), тя няма същия ритуален статут: обикновено се счита за кървене от различно естество, понякога свързано с медицинска причина.',
    note1Title: 'Обърни внимание',
    note1Text: 'Това съдържание обяснява понятието в общи линии; то не ти позволява да определиш дали конкретно кървене съответства на истихада в личната ти ситуация.',
    section2Body: 'Може да е трудно да се различи истихада от менструация или от нередовен цикъл, защото кървенето понякога може да изглежда подобно, да варира по интензитет или да продължава по необичаен начин. Тази трудност е призната от самите учени, което обяснява защо съществуват няколко подхода за нейното определяне.',
    tip1Title: 'Добре е да знаеш',
    tip1Text: 'Нормално е да не знаеш веднага на какво съответства необичайното кървене; тази несигурност е честа ситуация, а не грешка от твоя страна.',
    section3Body: 'Някои елементи могат да помогнат за насочване на разсъжденията ти, без да са универсални правила, тъй като точните ориентири варират според школите на правото.',
    differences: [
      ['calendar-clock-outline', 'Продължителност в сравнение с обичайния ти цикъл'],
      ['repeat-variant', 'Редовност или необичаен характер на кървенето'],
      ['water-outline', 'Как се развива кървенето във времето'],
      ['clipboard-pulse-outline', 'Възможно наличие на позната медицинска причина'],
    ],
    note2Title: 'Обърни внимание',
    note2Text: 'Тези елементи са общи ориентири, а не абсолютни критерии: те могат да бъдат тълкувани по различен начин от учените и школите на правото.',
    section4Body: 'Да отделиш време да наблюдаваш кървенето си в продължение на няколко дни, без да бързаш, ти помага да разбереш по-добре собствената си ситуация, преди да стигнеш до извод.',
    checkList1Title: 'Някои практически насоки',
    observeTips: [
      'Отбележи началната дата и, ако е възможно, обичайната продължителност на циклите си',
      'Наблюдавай дали кървенето следва модел, близък до предишните ти менструации',
      'Не се позовавай само на един изолиран ден',
      'Запиши тези наблюдения, ако смяташ да се консултираш с учен или здравен специалист',
    ],
    section5Body: 'При истихада молитвата и постът обикновено остават задължителни, за разлика от периода на менструация. Тогава се препоръчват хигиенни предпазни мерки (като подходяща защита), за да може богослужението да продължи, според методите, преподавани от различните школи на правото.',
    tip2Title: 'Добре е да знаеш',
    tip2Text: 'Точните предпазни мерки (като подновяване на абдеста) могат да варират според следваната школа на правото; позоваването на мнението, което обикновено следваш, или на квалифициран учен ти помага да ги прилагаш правилно.',
    section6Body: 'Упоритото съмнение относно естеството на кървенето е честа ситуация и не бива да е източник на прекомерна тревога.',
    doubtSteps: [
      'Позовавай се на обичайната продължителност и ритъм на собствените си менструации',
      'Консултирай се със здравен специалист, ако кървенето е необичайно или продължително',
      'Поискай мнението на квалифициран учен по религиозното измерение',
      'Помни, че общият отговор не заменя насоки, приспособени към ситуацията ти',
    ],
    alert2Title: 'Важна информация',
    alert2Text: 'Това съдържание остава образователно и общо: то не представлява фетва или индивидуално религиозно решение. За всяка лична ситуация, особено при продължително съмнение, мнението на квалифициран учен остава референцията.',
    tip3Title: 'Добре е да знаеш',
    tip3Text: 'Истихада е понятие, което различава необичайното кървене от менструацията или нифаса, със специфични последици за молитвата и поста. При съмнение внимателното наблюдение и мнението на квалифициран учен остават най-добрите ресурси.',
    shareMessage: 'Разбиране на истихада — AWA',
  },
  sr: {
    badge: 'ИСТИХАДА',
    title: 'Разумевање истихаде',
    metaDuration: '7 мин читања',
    metaType: 'Честа питања',
    metaLevel: 'Средњи ниво',
    metaValidated: 'Проверен садржај',
    intro: 'Разликовање нередовног крварења од уобичајене менструације, уз опште оријентире који ће те водити.',
    disclaimerTitle: 'Важна информација',
    disclaimerText: 'Овај садржај је искључиво образовни. Верска питања треба да потврде квалификовани учењаци. AWA не издаје фетве нити персонализоване верске пресуде.',
    contentsTitle: 'У овом чланку',
    topics: [
      'Шта је истихада?',
      'Зашто је може бити тешко препознати?',
      'Разлике између менструације и истихаде',
      'Како посматрати крварење?',
      'Молитва и пост током истихаде',
      'Шта урадити у случају сумње?',
      'Шта да запамтиш',
    ],
    section1Body: 'Истихада означава крварење које се јавља ван уобичајеног менструалног циклуса или које траје дуже од трајања менструације признатог у исламској традицији. За разлику од менструације (хајд) или нифаса (крварење после порођаја), она нема исти ритуални статус: обично се сматра крварењем другачије природе, понекад повезаним са медицинским узроком.',
    note1Title: 'Обрати пажњу',
    note1Text: 'Овај садржај објашњава појам у општим цртама; он ти не омогућава да одредиш да ли одређено крварење одговара истихади у твојој личној ситуацији.',
    section2Body: 'Може бити тешко разликовати истихаду од менструације или нередовног циклуса, јер крварење понекад може изгледати слично, варирати у интензитету или трајати на необичан начин. Ову тешкоћу признају и сами учењаци, што објашњава зашто постоји неколико приступа за њено утврђивање.',
    tip1Title: 'Добро је знати',
    tip1Text: 'Нормално је не знати одмах чему одговара необично крварење; ова неизвесност је честа ситуација, а не твоја грешка.',
    section3Body: 'Одређени елементи могу усмерити твоје размишљање, а да нису универзална правила, јер се прецизне ознаке разликују према правним школама.',
    differences: [
      ['calendar-clock-outline', 'Трајање у поређењу са твојим уобичајеним циклусом'],
      ['repeat-variant', 'Редовност или необична природа крварења'],
      ['water-outline', 'Како се крварење развија током времена'],
      ['clipboard-pulse-outline', 'Могуће присуство познатог медицинског узрока'],
    ],
    note2Title: 'Обрати пажњу',
    note2Text: 'Ови елементи су опште ознаке, а не апсолутни критеријуми: учењаци и правне школе могу их различито тумачити.',
    section4Body: 'Одвајање времена да посматраш своје крварење током неколико дана, без журбе, помаже ти да боље разумеш сопствену ситуацију пре него што донесеш закључак.',
    checkList1Title: 'Неке практичне смернице',
    observeTips: [
      'Забележи датум почетка и, ако је могуће, уобичајено трајање својих циклуса',
      'Посматрај да ли крварење прати образац близак твојим претходним менструацијама',
      'Не ослањај се само на један изоловани дан',
      'Запиши ова запажања ако планираш да се консултујеш са учењаком или здравственим радником',
    ],
    section5Body: 'У случају истихаде молитва и пост обично остају обавезни, за разлику од периода менструације. Хигијенске мере предострожности (као што је одговарајућа заштита) тада се препоручују да би богослужење могло да се настави, према методама које предају различите правне школе.',
    tip2Title: 'Добро је знати',
    tip2Text: 'Прецизне мере предострожности (као што је обнављање абдеста) могу варирати зависно од правне школе коју пратиш; позивање на мишљење које уобичајено пратиш или на квалификованог учењака помаже ти да их правилно примењујеш.',
    section6Body: 'Упорна сумња у природу крварења је честа ситуација и не би требало да буде извор претеране бриге.',
    doubtSteps: [
      'Позови се на уобичајено трајање и ритам својих менструација',
      'Консултуј здравственог радника ако је крварење необично или продужено',
      'Затражи мишљење квалификованог учењака о верској димензији',
      'Имај на уму да општи одговор не замењује смернице прилагођене твојој ситуацији',
    ],
    alert2Title: 'Важна информација',
    alert2Text: 'Овај садржај остаје образовни и општи: он не представља фетву нити индивидуалну верску пресуду. За сваку личну ситуацију, нарочито при дуготрајној сумњи, мишљење квалификованог учењака остаје референца.',
    tip3Title: 'Добро је знати',
    tip3Text: 'Истихада је појам који разликује необично крварење од менструације или нифаса, са посебним последицама за молитву и пост. При сумњи, пажљиво посматрање и мишљење квалификованог учењака остају најбољи ресурси.',
    shareMessage: 'Разумевање истихаде — AWA',
  },
  hr: {
    badge: 'ISTIHADA',
    title: 'Razumijevanje istihade',
    metaDuration: '7 min čitanja',
    metaType: 'Česta pitanja',
    metaLevel: 'Srednja razina',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Razlikovanje nepravilnog krvarenja od uobičajene menstruacije, uz opće pokazatelje koji ti mogu pomoći.',
    disclaimerTitle: 'Važna informacija',
    disclaimerText: 'Ovaj je sadržaj isključivo edukativan. Vjerska pitanja trebaju potvrditi kvalificirani učenjaci. AWA ne izdaje fetve niti individualne vjerske presude.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Što je istihada?',
      'Zašto ju može biti teško prepoznati?',
      'Razlike između menstruacije i istihade',
      'Kako promatrati krvarenje?',
      'Molitva i post tijekom istihade',
      'Što učiniti u slučaju sumnje?',
      'Ključne poruke',
    ],
    section1Body: 'Istihada označava krvarenje koje se javlja izvan uobičajenog menstrualnog ciklusa ili koje traje dulje od trajanja menstruacije priznatog u islamskoj tradiciji. Za razliku od menstruacije (hajd) ili nifasa (krvarenje nakon poroda), nema isti ritualni status: općenito se smatra krvarenjem drugačije prirode, ponekad povezanim s medicinskim uzrokom.',
    note1Title: 'Napomena',
    note1Text: 'Ovaj sadržaj objašnjava pojam u općim crtama; ne omogućuje ti da utvrdiš odgovara li određeno krvarenje istihadi u tvojoj osobnoj situaciji.',
    section2Body: 'Istihadu može biti teško razlikovati od menstruacije ili nepravilnog ciklusa jer krvarenje ponekad može izgledati slično, razlikovati se po intenzitetu ili se nastaviti na neobičan način. Tu poteškoću priznaju i sami učenjaci, što objašnjava zašto postoji nekoliko pristupa njezinu prepoznavanju.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Normalno je ne znati odmah čemu odgovara neobično krvarenje; ta je neizvjesnost uobičajena situacija, a ne tvoja pogreška.',
    section3Body: 'Određeni elementi mogu ti pomoći usmjeriti razmišljanje, ali nisu univerzalna pravila jer se točni pokazatelji razlikuju prema pravnim školama.',
    differences: [
      ['calendar-clock-outline', 'Trajanje u odnosu na tvoj uobičajeni ciklus'],
      ['repeat-variant', 'Pravilnost ili neobičnost krvarenja'],
      ['water-outline', 'Kako se krvarenje mijenja tijekom vremena'],
      ['clipboard-pulse-outline', 'Moguća prisutnost poznatog medicinskog uzroka'],
    ],
    note2Title: 'Napomena',
    note2Text: 'Ti su elementi opći pokazatelji, a ne apsolutni kriteriji: učenjaci i pravne škole mogu ih tumačiti različito.',
    section4Body: 'Odvajanje vremena za promatranje krvarenja tijekom nekoliko dana, bez žurbe, pomaže ti bolje razumjeti vlastitu situaciju prije donošenja zaključka.',
    checkList1Title: 'Neke praktične smjernice',
    observeTips: [
      'Zabilježi datum početka i, ako je moguće, uobičajenu duljinu svojih ciklusa',
      'Promatraj slijedi li krvarenje obrazac blizak tvojim prethodnim menstruacijama',
      'Ne oslanjaj se samo na jedan izoliran dan',
      'Zapiši ta opažanja ako planiraš posavjetovati se s učenjakom ili zdravstvenim djelatnikom',
    ],
    section5Body: 'U slučaju istihade molitva i post općenito ostaju obvezni, za razliku od menstruacije. Higijenske mjere opreza (poput prikladne zaštite) tada se preporučuju kako bi se bogoslužje moglo nastaviti, prema metodama koje podučavaju različite pravne škole.',
    tip2Title: 'Dobro je znati',
    tip2Text: 'Točne mjere opreza (poput obnavljanja abdesta) mogu se razlikovati ovisno o pravnoj školi koja se slijedi; oslanjanje na mišljenje koje obično slijediš ili na kvalificiranog učenjaka pomaže ti ih pravilno primijeniti.',
    section6Body: 'Trajna sumnja u narav krvarenja uobičajena je situacija i ne bi smjela biti izvor pretjerane zabrinutosti.',
    doubtSteps: [
      'Osloni se na uobičajeno trajanje i ritam vlastitih menstruacija',
      'Posavjetuj se sa zdravstvenim djelatnikom ako je krvarenje neobično ili dugotrajno',
      'Zatraži od kvalificiranog učenjaka mišljenje o vjerskoj dimenziji',
      'Imaj na umu da opći odgovor ne zamjenjuje vodstvo prilagođeno tvojoj situaciji',
    ],
    alert2Title: 'Važna informacija',
    alert2Text: 'Ovaj sadržaj ostaje edukativan i općenit: ne predstavlja fetvu niti individualnu vjersku presudu. Za svaku osobnu situaciju, osobito u slučaju dugotrajne sumnje, mjerodavno ostaje mišljenje kvalificiranog učenjaka.',
    tip3Title: 'Dobro je znati',
    tip3Text: 'Istihada je pojam koji razlikuje neobično krvarenje od menstruacije ili nifasa, s posebnim posljedicama za molitvu i post. U slučaju sumnje, pažljivo promatranje i mišljenje kvalificiranog učenjaka ostaju najbolji izvori.',
    shareMessage: 'Razumijevanje istihade — AWA',
  },
  bs: {
    badge: 'ISTIHADA',
    title: 'Razumijevanje istihade',
    metaDuration: '7 min čitanja',
    metaType: 'Česta pitanja',
    metaLevel: 'Srednja razina',
    metaValidated: 'Provjeren sadržaj',
    intro: 'Razlikovanje nepravilnog krvarenja od uobičajene menstruacije, uz opće pokazatelje koji ti mogu pomoći.',
    disclaimerTitle: 'Važna informacija',
    disclaimerText: 'Ovaj je sadržaj isključivo edukativan. Vjerska pitanja trebaju potvrditi kvalificirani učenjaci. AWA ne izdaje fetve niti individualne vjerske presude.',
    contentsTitle: 'U ovom članku',
    topics: [
      'Što je istihada?',
      'Zašta ju može biti teško prepoznati?',
      'Razlike između menstruacije i istihade',
      'Kako promatrati krvarenje?',
      'Molitva i post tokom istihade',
      'Što učiniti u slučaju sumnje?',
      'Ključne poruke',
    ],
    section1Body: 'Istihada označava krvarenje koje se javlja izvan uobičajenog menstrualnog ciklusa ili koje traje dulje od trajanja menstruacije priznatog u islamskoj tradiciji. Za razliku od menstruacije (hajd) ili nifasa (krvarenje nakon porođaja), nema isti ritualni status: općenito se smatra krvarenjem drugačije prirode, ponekad povezanim s medicinskim uzrokom.',
    note1Title: 'Napomena',
    note1Text: 'Ovaj sadržaj objašnjava pojam u općim crtama; ne omogućuje ti da utvrdiš odgovara li određeno krvarenje istihadi u tvojoj osobnoj situaciji.',
    section2Body: 'Istihadu može biti teško razlikovati od menstruacije ili nepravilnog ciklusa jer krvarenje ponekad može izgledati slično, razlikovati se po intenzitetu ili se nastaviti na neobičan način. Tu poteškoću priznaju i sami učenjaci, što objašnjava zašta postoji nekoliko pristupa njezinu prepoznavanju.',
    tip1Title: 'Dobro je znati',
    tip1Text: 'Normalno je ne znati odmah čemu odgovara neobično krvarenje; ta je neizvjesnost uobičajena situacija, a ne tvoja pogreška.',
    section3Body: 'Određeni elementi mogu ti pomoći usmjeriti razmišljanje, ali nisu univerzalna pravila jer se tačni pokazatelji razlikuju prema pravnim školama.',
    differences: [
      ['calendar-clock-outline', 'Trajanje u odnosu na tvoj uobičajeni ciklus'],
      ['repeat-variant', 'Pravilnost ili neobičnost krvarenja'],
      ['water-outline', 'Kako se krvarenje mijenja tokom vremena'],
      ['clipboard-pulse-outline', 'Moguća prisutnost poznatog medicinskog uzroka'],
    ],
    note2Title: 'Napomena',
    note2Text: 'Ti su elementi opći pokazatelji, a ne apsolutni kriteriji: učenjaci i pravne škole mogu ih tumačiti različito.',
    section4Body: 'Odvajanje vremena za promatranje krvarenja tokom nekoliko dana, bez žurbe, pomaže ti bolje razumjeti vlastitu situaciju prije donošenja zaključka.',
    checkList1Title: 'Neke praktične smjernice',
    observeTips: [
      'Zabilježi datum početka i, ako je moguće, uobičajenu duljinu svojih ciklusa',
      'Promatraj slijedi li krvarenje obrazac blizak tvojim prethodnim menstruacijama',
      'Ne oslanjaj se samo na jedan izoliran dan',
      'Zapiši ta opažanja ako planiraš posavjetovati se s učenjakom ili zdravstvenim radnikom',
    ],
    section5Body: 'U slučaju istihade molitva i post općenito ostaju obvezni, za razliku od menstruacije. Higijenske mjere opreza (poput prikladne zaštite) tada se preporučuju kako bi se bogoslužje moglo nastaviti, prema metodama koje podučavaju različite pravne škole.',
    tip2Title: 'Dobro je znati',
    tip2Text: 'Tačne mjere opreza (poput obnavljanja abdesta) mogu se razlikovati ovisno o pravnoj školi koja se slijedi; oslanjanje na mišljenje koje obično slijediš ili na kvalificiranog učenjaka pomaže ti ih pravilno primijeniti.',
    section6Body: 'Trajna sumnja u narav krvarenja uobičajena je situacija i ne bi smjela biti izvor pretjerane zabrinutosti.',
    doubtSteps: [
      'Osloni se na uobičajeno trajanje i ritam vlastitih menstruacija',
      'Posavjetuj se sa zdravstvenim radnikom ako je krvarenje neobično ili dugotrajno',
      'Zatraži od kvalificiranog učenjaka mišljenje o vjerskoj dimenziji',
      'Imaj na umu da opći odgovor ne zamjenjuje vodstvo prilagođeno tvojoj situaciji',
    ],
    alert2Title: 'Važna informacija',
    alert2Text: 'Ovaj sadržaj ostaje edukativan i općenit: ne predstavlja fetvu niti individualnu vjersku presudu. Za svaku osobnu situaciju, osobito u slučaju dugotrajne sumnje, mjerodavno ostaje mišljenje kvalificiranog učenjaka.',
    tip3Title: 'Dobro je znati',
    tip3Text: 'Istihada je pojam koji razlikuje neobično krvarenje od menstruacije ili nifasa, s posebnim posljedicama za molitvu i post. U slučaju sumnje, pažljivo promatranje i mišljenje kvalificiranog učenjaka ostaju najbolji izvori.',
    shareMessage: 'Razumijevanje istihade — AWA',
  },
  sl: {
    badge: 'ISTIHADA',
    title: 'Razumevanje istihade',
    metaDuration: '7 min branja',
    metaType: 'Pogosta vprašanja',
    metaLevel: 'Srednja raven',
    metaValidated: 'Preverjena vsebina',
    intro: 'Razlikovanje nepravilne krvavitve od običajne menstruacije, s splošnimi kazalniki, ki ti lahko pomagajo.',
    disclaimerTitle: 'Pomembna informacija',
    disclaimerText: 'Ta vsebina je izključno izobraževalna. Verska vprašanja naj potrdijo kvalificirani učenjaki. AWA ne izdaja fetv ali osebnih verskih razsodb.',
    contentsTitle: 'V tem članku',
    topics: [
      'Kaj je istihada?',
      'Zakaj jo je lahko težko prepoznati?',
      'Razlike med menstruacijo in istihado',
      'Kako opazovati krvavitev?',
      'Molitev in post med istihado',
      'Kaj storiti v primeru dvoma?',
      'Ključna sporočila',
    ],
    section1Body: 'Istihada pomeni krvavitev, ki se pojavi izven običajnega menstrualnega cikla ali ki traja dlje od trajanja menstruacije, priznanega v islamski tradiciji. Za razliko od menstruacije (hajd) ali nifasa (krvavitev po porodu) nima enakega ritualnega statusa: na splošno se šteje za krvavitev drugačne narave, včasih povezano z zdravstvenim vzrokom.',
    note1Title: 'Opomba',
    note1Text: 'Ta vsebina pojasnjuje pojem na splošno; ne omogoča ti ugotoviti, ali določena krvavitev v tvoji osebni situaciji ustreza istihadi.',
    section2Body: 'Istihado je lahko težko razlikovati od menstruacije ali nepravilnega cikla, ker krvavitev včasih izgleda podobno, se razlikuje po intenzivnosti ali se nadaljuje na nenavaden način. To težavo priznavajo tudi sami učenjaki, kar pojasnjuje, zakaj obstaja več pristopov k njenemu prepoznavanju.',
    tip1Title: 'Vredno vedeti',
    tip1Text: 'Normalno je ne vedeti takoj, čemu ustreza nenavadna krvavitev; ta negotovost je običajna situacija, ne tvoja napaka.',
    section3Body: 'Nekateri elementi ti lahko pomagajo usmeriti razmišljanje, vendar niso univerzalna pravila, saj se natančni kazalniki razlikujejo glede na pravne šole.',
    differences: [
      ['calendar-clock-outline', 'Trajanje v primerjavi z običajnim ciklom'],
      ['repeat-variant', 'Pravilnost ali nenavadnost krvavitve'],
      ['water-outline', 'Kako se krvavitev spreminja skozi čas'],
      ['clipboard-pulse-outline', 'Možna prisotnost znanega zdravstvenega vzroka'],
    ],
    note2Title: 'Opomba',
    note2Text: 'Ti elementi so splošni kazalniki, ne absolutni kriteriji: učenjaki in pravne šole jih lahko razlagajo različno.',
    section4Body: 'Če si vzameš čas za opazovanje krvavitve več dni, brez naglice, ti pomaga bolje razumeti lastno situacijo, preden narediš zaključek.',
    checkList1Title: 'Nekaj praktičnih smernic',
    observeTips: [
      'Zabeleži datum začetka in, če je mogoče, običajno dolžino svojih ciklov',
      'Opazuj, ali krvavitev sledi vzorcu, podobnemu tvojim prejšnjim menstruacijam',
      'Ne zanašaj se samo na en izoliran dan',
      'Zapiši ta opažanja, če nameravaš posvetovati se z učenjakom ali zdravstvenim delavcem',
    ],
    section5Body: 'V primeru istihade molitev in post na splošno ostajata obvezna, za razliko od menstruacije. Higienski previdnostni ukrepi (kot je ustrezna zaščita) se nato priporočajo, da se bogoslužje lahko nadaljuje, po metodah, ki jih učijo različne pravne šole.',
    tip2Title: 'Vredno vedeti',
    tip2Text: 'Natančni previdnostni ukrepi (kot je obnavljanje abdesta) se lahko razlikujejo glede na pravno šolo, ki ji slediš; zanašanje na mnenje, ki mu običajno slediš, ali na kvalificiranega učenjaka ti pomaga, da jih pravilno uporabljaš.',
    section6Body: 'Trajen dvom o naravi krvavitve je običajna situacija in ne bi smel biti vir pretirane zaskrbljenosti.',
    doubtSteps: [
      'Zanesi se na običajno trajanje in ritem lastnih menstruacij',
      'Posvetuj se z zdravstvenim delavcem, če je krvavitev nenavadna ali dolgotrajna',
      'Prosi kvalificiranega učenjaka za mnenje o verski razsežnosti',
      'Imej v mislih, da splošen odgovor ne nadomešča vodstva, prilagojenega tvoji situaciji',
    ],
    alert2Title: 'Pomembna informacija',
    alert2Text: 'Ta vsebina ostaja izobraževalna in splošna: ne predstavlja fetve ali individualne verske razsodbe. Za vsako osebno situacijo, zlasti v primeru dolgotrajnega dvoma, ostaja merodajno mnenje kvalificiranega učenjaka.',
    tip3Title: 'Vredno vedeti',
    tip3Text: 'Istihada je pojem, ki razlikuje nenavadno krvavitev od menstruacije ali nifasa, s posebnimi posledicami za molitev in post. V primeru dvoma ostajata skrbno opazovanje in mnenje kvalificiranega učenjaka najboljša vira.',
    shareMessage: 'Razumevanje istihade — AWA',
  },
  ne: {
    badge: 'इस्तिहाजा',
    title: 'इस्तिहाजा बुझ्नुहोस्',
    metaDuration: '7 मिनेट पढाइ',
    metaType: 'बारम्बार सोधिने प्रश्न',
    metaLevel: 'मध्यम',
    metaValidated: 'समीक्षा गरिएको सामग्री',
    intro: 'सामान्य महिनावारीबाट अनियमित रक्तस्राव छुट्ट्याउने, तपाईंलाई मार्गदर्शन गर्न मद्दत गर्ने सामान्य सङ्केतहरूसहित।',
    disclaimerTitle: 'महत्त्वपूर्ण जानकारी',
    disclaimerText: 'यो सामग्री पूर्ण रूपमा शैक्षिक हो। धार्मिक प्रश्नहरू योग्य विद्वानहरूद्वारा प्रमाणित गराउनुपर्छ। AWA ले फतवा वा व्यक्तिगत धार्मिक निर्णय जारी गर्दैन।',
    contentsTitle: 'यो लेखमा',
    topics: [
      'इस्तिहाजा के हो?',
      'यसलाई चिन्न किन गाह्रो हुन सक्छ?',
      'महिनावारी र इस्तिहाजाबीचका भिन्नताहरू',
      'रक्तस्राव कसरी अवलोकन गर्ने?',
      'इस्तिहाजाको समयमा नमाज र रोजा',
      'शङ्का भए के गर्ने?',
      'मुख्य कुराहरू',
    ],
    section1Body: 'इस्तिहाजाले सामान्य मासिक चक्रबाहिर हुने वा इस्लामी परम्पराले मान्यता दिएको महिनावारीको अवधिभन्दा बढी चल्ने रक्तस्रावलाई जनाउँछ। महिनावारी (हैज) वा निफास (प्रसवपछिको रक्तस्राव) भन्दा फरक, यसको उही अनुष्ठानिक हैसियत हुँदैन: यसलाई सामान्यतया फरक प्रकृतिको रक्तस्राव मानिन्छ, कहिलेकाहीँ चिकित्सकीय कारणसँग जोडिएको।',
    note1Title: 'कृपया ध्यान दिनुहोस्',
    note1Text: 'यो सामग्रीले अवधारणालाई सामान्य रूपमा व्याख्या गर्छ; यसले तपाईंको व्यक्तिगत अवस्थामा कुनै विशेष रक्तस्राव इस्तिहाजासँग मेल खान्छ कि खाँदैन भनेर निर्धारण गर्न दिँदैन।',
    section2Body: 'इस्तिहाजालाई महिनावारी वा अनियमित चक्रबाट छुट्ट्याउन गाह्रो हुन सक्छ, किनभने रक्तस्राव कहिलेकाहीँ उस्तै देखिन सक्छ, तीव्रतामा फरक पर्न सक्छ, वा असामान्य ढङ्गले चल्न सक्छ। यो कठिनाइलाई विद्वानहरू आफैँले मान्यता दिएका छन्, जसले किन यसलाई पहिचान गर्ने धेरै दृष्टिकोण छन् भन्ने व्याख्या गर्छ।',
    tip1Title: 'जान्न लायक',
    tip1Text: 'असामान्य रक्तस्राव केसँग मेल खान्छ भन्ने तुरुन्तै थाहा नहुनु सामान्य हो; यो अनिश्चितता सामान्य अवस्था हो, तपाईंको गल्ती होइन।',
    section3Body: 'केही तत्त्वहरूले तपाईंको सोचलाई मार्गदर्शन गर्न मद्दत गर्न सक्छन्, सार्वभौम नियम नभई, किनभने सही सूचकहरू फिक्हका विचारधाराअनुसार फरक हुन्छन्।',
    differences: [
      ['calendar-clock-outline', 'तपाईंको सामान्य चक्रको तुलनामा अवधि'],
      ['repeat-variant', 'रक्तस्रावको नियमितता वा असामान्य प्रकृति'],
      ['water-outline', 'समयसँगै रक्तस्राव कसरी बदलिन्छ'],
      ['clipboard-pulse-outline', 'ज्ञात चिकित्सकीय कारणको सम्भावित उपस्थिति'],
    ],
    note2Title: 'कृपया ध्यान दिनुहोस्',
    note2Text: 'यी तत्त्वहरू सामान्य सूचक हुन्, निरपेक्ष मापदण्ड होइनन्: तिनलाई विद्वान र फिक्हका विचारधाराहरूले फरक ढङ्गले व्याख्या गर्न सक्छन्।',
    section4Body: 'हतार नगरी, धेरै दिनसम्म आफ्नो रक्तस्राव अवलोकन गर्न समय लिँदा निष्कर्षमा पुग्नुअघि आफ्नो अवस्था राम्ररी बुझ्न मद्दत मिल्छ।',
    checkList1Title: 'केही व्यावहारिक सङ्केतहरू',
    observeTips: [
      'सुरु मिति र, सम्भव भए, आफ्ना चक्रहरूको सामान्य अवधि टिप्नुहोस्',
      'रक्तस्रावले तपाईंका अघिल्ला महिनावारीको नजिकको ढाँचा पछ्याउँछ कि अवलोकन गर्नुहोस्',
      'एउटा मात्र एक्लो दिनमा भर नपर्नुहोस्',
      'विद्वान वा स्वास्थ्यकर्मीसँग परामर्श गर्ने योजना भए यी अवलोकनहरू अभिलेख गर्नुहोस्',
    ],
    section5Body: 'इस्तिहाजाको अवस्थामा, महिनावारीको विपरीत, नमाज र रोजा सामान्यतया अनिवार्य नै रहन्छन्। त्यसपछि इबादत जारी राख्न सकियोस् भनेर सरसफाइका सावधानीहरू (जस्तै उपयुक्त सुरक्षा) फिक्हका विभिन्न विचारधाराले सिकाएको तरिकाअनुसार सिफारिस गरिन्छन्।',
    tip2Title: 'जान्न लायक',
    tip2Text: 'सही सावधानीहरू (जस्तै वुजु नवीकरण गर्ने) पछ्याइएको फिक्हको विचारधाराअनुसार फरक हुन सक्छन्; तपाईंले सामान्यतया पछ्याउने रायलाई वा योग्य विद्वानलाई हेर्नाले तिनलाई सही रूपमा लागू गर्न मद्दत गर्छ।',
    section6Body: 'रक्तस्रावको प्रकृतिबारे लगातार शङ्का एउटा सामान्य अवस्था हो, र यो अत्यधिक चिन्ताको स्रोत हुनु हुँदैन।',
    doubtSteps: [
      'आफ्नै महिनावारीको सामान्य अवधि र लयलाई सन्दर्भ बनाउनुहोस्',
      'रक्तस्राव असामान्य वा लामो भए स्वास्थ्यकर्मीसँग परामर्श गर्नुहोस्',
      'धार्मिक पक्षबारे योग्य विद्वानको राय सोध्नुहोस्',
      'सामान्य उत्तरले तपाईंको अवस्थाअनुकूल मार्गदर्शनको स्थान लिँदैन भन्ने मनमा राख्नुहोस्',
    ],
    alert2Title: 'महत्त्वपूर्ण जानकारी',
    alert2Text: 'यो सामग्री शैक्षिक र सामान्य नै रहन्छ: यो फतवा वा व्यक्तिगत धार्मिक निर्णय होइन। कुनै पनि व्यक्तिगत अवस्थाका लागि, विशेष गरी लामो शङ्का भएमा, योग्य विद्वानको राय नै सन्दर्भ रहन्छ।',
    tip3Title: 'जान्न लायक',
    tip3Text: 'इस्तिहाजा एउटा अवधारणा हो जसले असामान्य रक्तस्रावलाई महिनावारी वा निफासबाट छुट्ट्याउँछ, नमाज र रोजाका लागि विशेष प्रभावसहित। शङ्का भएमा, ध्यानपूर्वक अवलोकन र योग्य विद्वानको राय नै सबैभन्दा राम्रा स्रोत रहन्छन्।',
    shareMessage: 'इस्तिहाजा बुझ्नुहोस् — AWA',
  },
  si: {
    badge: 'ඉස්තිහාදා',
    title: 'ඉස්තිහාදා තේරුම් ගැනීම',
    metaDuration: 'කියවීමට මිනිත්තු 7',
    metaType: 'නිති අසන ප්‍රශ්න',
    metaLevel: 'මධ්‍යම',
    metaValidated: 'සමාලෝචනය කළ අන්තර්ගතය',
    intro: 'ඔබට මඟපෙන්වීමට සාමාන්‍ය යොමු ලක්ෂ්‍ය සහිතව, අක්‍රමවත් ලේ ගැලීම ඔබේ සාමාන්‍ය ඔසප්වලින් වෙන්කර හඳුනාගැනීම.',
    disclaimerTitle: 'වැදගත් තොරතුරු',
    disclaimerText: 'මෙම අන්තර්ගතය සම්පූර්ණයෙන්ම අධ්‍යාපනික වේ. ආගමික ප්‍රශ්න සුදුසුකම් ලත් විද්වතුන් විසින් තහවුරු කළ යුතුයි. AWA ෆත්වා හෝ පුද්ගලීකරණය කළ ආගමික තීන්දු නිකුත් නොකරයි.',
    contentsTitle: 'මෙම ලිපියේ',
    topics: [
      'ඉස්තිහාදා යනු කුමක්ද?',
      'එය හඳුනාගැනීම අපහසු විය හැක්කේ ඇයි?',
      'ඔසප් සහ ඉස්තිහාදා අතර වෙනස්කම්',
      'ලේ ගැලීම නිරීක්ෂණය කරන්නේ කෙසේද?',
      'ඉස්තිහාදා අතරතුර සලාත් සහ උපවාසය',
      'සැකයක් ඇති විට කළ යුත්තේ කුමක්ද?',
      'ප්‍රධාන කරුණු',
    ],
    section1Body: 'ඉස්තිහාදා යනු සාමාන්‍ය ඔසප් චක්‍රයෙන් පිටත සිදුවන, හෝ ඉස්ලාමීය සම්ප්‍රදාය විසින් පිළිගත් ඔසප්වල කාලය ඉක්මවා දිගටම පවතින ලේ ගැලීමයි. ඔසප් (හයිද්) හෝ නිෆාස් (ප්‍රසූතියෙන් පසු ලේ ගැලීම) මෙන් නොව, එයට එකම ආචාරික තත්ත්වය නොමැත: එය සාමාන්‍යයෙන් වෙනස් ස්වභාවයක ලේ ගැලීමක් ලෙස සැලකෙන අතර, සමහර විට වෛද්‍ය හේතුවකට සම්බන්ධ වේ.',
    note1Title: 'කරුණාකර සටහන් කරන්න',
    note1Text: 'මෙම අන්තර්ගතය සංකල්පය සාමාන්‍ය වචනවලින් පැහැදිලි කරයි; නිශ්චිත ලේ ගැලීමක් ඔබේ පෞද්ගලික තත්ත්වයේ ඉස්තිහාදාවට අනුරූප වේදැයි තීරණය කිරීමට එය ඔබට ඉඩ නොදේ.',
    section2Body: 'ඉස්තිහාදා ඔසප්වලින් හෝ අක්‍රමවත් චක්‍රයකින් වෙන්කර හඳුනාගැනීම අපහසු විය හැක, මන්ද ලේ ගැලීම සමහර විට සමාන ලෙස පෙනිය හැකි, තීව්‍රතාවයෙන් වෙනස් විය හැකි, හෝ අසාමාන්‍ය ආකාරයෙන් දිගටම පැවතිය හැකි බැවිනි. මෙම අපහසුව විද්වතුන්ම පිළිගන්නා අතර, එය හඳුනාගැනීමට ප්‍රවේශ කිහිපයක් පවතින්නේ ඇයිදැයි පැහැදිලි කරයි.',
    tip1Title: 'දැනගත යුතු දේ',
    tip1Text: 'අසාමාන්‍ය ලේ ගැලීමක් අනුරූප වන්නේ කුමකටදැයි වහාම නොදැන සිටීම සාමාන්‍යයි; මෙම අවිනිශ්චිතභාවය ඔබේ වරදක් නොව පොදු තත්ත්වයකි.',
    section3Body: 'නිශ්චිත සලකුණු නීති චින්තන ධාරා අනුව වෙනස් වන බැවින්, විශ්වීය රීති නොවී, ඔබේ සිතුවිලි මඟ පෙන්වීමට සමහර අංග උපකාරී විය හැක.',
    differences: [
      ['calendar-clock-outline', 'ඔබේ සාමාන්‍ය චක්‍රයට සාපේක්ෂව කාලය'],
      ['repeat-variant', 'ලේ ගැලීමේ නිතිපතා බව හෝ අසාමාන්‍ය ස්වභාවය'],
      ['water-outline', 'කාලයත් සමඟ ලේ ගැලීම වෙනස් වන ආකාරය'],
      ['clipboard-pulse-outline', 'දන්නා වෛද්‍ය හේතුවක් තිබිය හැකි බව'],
    ],
    note2Title: 'කරුණාකර සටහන් කරන්න',
    note2Text: 'මෙම අංග සාමාන්‍ය යොමු ලක්ෂ්‍ය මිස නිරපේක්ෂ නිර්ණායක නොවේ: ඒවා විද්වතුන් සහ නීති චින්තන ධාරා විසින් වෙනස් ලෙස අර්ථකථනය කළ හැක.',
    section4Body: 'ඔබේ ලේ ගැලීම දින කිහිපයක් පුරා, ඉක්මන් නොවී නිරීක්ෂණය කිරීමට කාලය ගැනීම, නිගමනයකට එළඹීමට පෙර ඔබේම තත්ත්වය වඩා හොඳින් තේරුම් ගැනීමට උපකාරී වේ.',
    checkList1Title: 'ප්‍රායෝගික යොමු කිහිපයක්',
    observeTips: [
      'ආරම්භක දිනය සහ, හැකි නම්, ඔබේ චක්‍රවල සාමාන්‍ය දිග සටහන් කරන්න',
      'ලේ ගැලීම ඔබේ පෙර ඔසප්වලට සමීප රටාවක් අනුගමනය කරන්නේදැයි නිරීක්ෂණය කරන්න',
      'තනි හුදකලා දිනයක් මත පමණක් විශ්වාසය නොතබන්න',
      'ඔබ විද්වතෙකු හෝ සෞඛ්‍ය වෘත්තිකයෙකු හමුවීමට සැලසුම් කරන්නේ නම් මෙම නිරීක්ෂණ සටහන් කරන්න',
    ],
    section5Body: 'ඉස්තිහාදා අවස්ථාවේදී, සලාත් සහ උපවාසය ඔසප් කාලයට වෙනස්ව සාමාන්‍යයෙන් අනිවාර්යව පවතී. එවිට නමස්කාරය දිගටම කරගෙන යාමට ඉඩ දීමට සනීපාරක්ෂක පූර්වාරක්ෂාවන් (සුදුසු ආරක්ෂාව වැනි) නීති චින්තන ධාරා විසින් උගන්වන ක්‍රම අනුව නිර්දේශ කෙරේ.',
    tip2Title: 'දැනගත යුතු දේ',
    tip2Text: 'නිශ්චිත පූර්වාරක්ෂාවන් (වුළූ අලුත් කිරීම වැනි) අනුගමනය කරන නීති චින්තන ධාරාව අනුව වෙනස් විය හැක; ඔබ සාමාන්‍යයෙන් අනුගමනය කරන මතයට හෝ සුදුසුකම් ලත් විද්වතෙකුට යොමු වීම ඒවා නිවැරදිව යෙදීමට ඔබට උපකාරී වේ.',
    section6Body: 'ලේ ගැලීමේ ස්වභාවය පිළිබඳ දිගටම පවතින සැකය පොදු තත්ත්වයක් වන අතර, අධික කනස්සල්ලට මූලාශ්‍රයක් නොවිය යුතුයි.',
    doubtSteps: [
      'ඔබේම ඔසප්වල සාමාන්‍ය කාලය සහ රිද්මය යොමු කරන්න',
      'ලේ ගැලීම අසාමාන්‍ය හෝ දිගුකාලීන නම් සෞඛ්‍ය වෘත්තිකයෙකු හමුවන්න',
      'ආගමික මානය පිළිබඳව සුදුසුකම් ලත් විද්වතෙකුගෙන් ඔහුගේ මතය විමසන්න',
      'සාමාන්‍ය පිළිතුරක් ඔබේ තත්ත්වයට ගැළපෙන මඟපෙන්වීමක් වෙනුවට නොපවතින බව මතක තබාගන්න',
    ],
    alert2Title: 'වැදගත් තොරතුරු',
    alert2Text: 'මෙම අන්තර්ගතය අධ්‍යාපනික සහ සාමාන්‍ය ලෙස පවතී: එය ෆත්වාවක් හෝ තනි ආගමික තීන්දුවක් නොවේ. ඕනෑම පෞද්ගලික තත්ත්වයක් සඳහා, විශේෂයෙන් දිගුකාලීන සැකයකදී, සුදුසුකම් ලත් විද්වතෙකුගේ මතය යොමුව ලෙස පවතී.',
    tip3Title: 'දැනගත යුතු දේ',
    tip3Text: 'ඉස්තිහාදා යනු අසාමාන්‍ය ලේ ගැලීම ඔසප් හෝ නිෆාස්වලින් වෙන්කරන, සලාත් සහ උපවාසය සඳහා විශේෂ ඇඟවුම් සහිත සංකල්පයකි. සැකයක් ඇති විට, ප්‍රවේශමෙන් නිරීක්ෂණය කිරීම සහ සුදුසුකම් ලත් විද්වතෙකුගේ මතය හොඳම සම්පත් ලෙස පවතී.',
    shareMessage: 'ඉස්තිහාදා තේරුම් ගැනීම — AWA',
  },
  th: {
    badge: 'อิสติฮาเฎาะฮ์',
    title: 'ทำความเข้าใจอิสติฮาเฎาะฮ์',
    metaDuration: 'อ่าน 7 นาที',
    metaType: 'คำถามที่พบบ่อย',
    metaLevel: 'ปานกลาง',
    metaValidated: 'เนื้อหาที่ผ่านการตรวจสอบ',
    intro: 'แยกเลือดที่ออกผิดปกติออกจากประจำเดือนปกติ ด้วยแนวทางทั่วไปที่ช่วยนำทาง',
    disclaimerTitle: 'ข้อมูลสำคัญ',
    disclaimerText: 'เนื้อหานี้เพื่อการเรียนรู้เท่านั้น คำถามทางศาสนาควรได้รับการตรวจสอบโดยผู้รู้ที่มีคุณวุฒิ AWA ไม่ออกฟัตวาหรือข้อวินิจฉัยทางศาสนาเฉพาะบุคคล',
    contentsTitle: 'ในบทความนี้',
    topics: [
      'อิสติฮาเฎาะฮ์คืออะไร?',
      'ทำไมจึงอาจระบุได้ยาก?',
      'ความแตกต่างระหว่างประจำเดือนกับอิสติฮาเฎาะฮ์',
      'สังเกตเลือดที่ออกอย่างไร?',
      'การละหมาดและการถือศีลอดระหว่างอิสติฮาเฎาะฮ์',
      'ควรทำอย่างไรเมื่อสงสัย?',
      'ประเด็นสำคัญ',
    ],
    section1Body: 'อิสติฮาเฎาะฮ์หมายถึงเลือดที่ออกนอกเหนือรอบเดือนตามปกติ หรือที่ออกต่อเนื่องเกินระยะเวลาประจำเดือนที่ประเพณีอิสลามยอมรับ ต่างจากประจำเดือน (หัยฎ์) หรือนิฟาส (เลือดหลังคลอด) ตรงที่ไม่มีสถานะตามพิธีกรรมเหมือนกัน: โดยทั่วไปถือเป็นเลือดที่มีลักษณะต่างออกไป บางครั้งเกี่ยวข้องกับสาเหตุทางการแพทย์',
    note1Title: 'โปรดทราบ',
    note1Text: 'เนื้อหานี้อธิบายแนวคิดโดยทั่วไป ไม่ได้ช่วยให้คุณระบุได้ว่าเลือดที่ออกในกรณีใดกรณีหนึ่งตรงกับอิสติฮาเฎาะฮ์ในสถานการณ์ส่วนตัวของคุณหรือไม่',
    section2Body: 'การแยกอิสติฮาเฎาะฮ์ออกจากประจำเดือนหรือรอบเดือนที่ไม่สม่ำเสมออาจทำได้ยาก เพราะเลือดที่ออกบางครั้งดูคล้ายกัน ปริมาณต่างกัน หรือออกต่อเนื่องอย่างผิดปกติ ผู้รู้เองก็ยอมรับความยากนี้ จึงมีหลายแนวทางในการระบุ',
    tip1Title: 'ควรรู้',
    tip1Text: 'เป็นเรื่องปกติที่จะไม่รู้ทันทีว่าเลือดที่ออกผิดปกติตรงกับอะไร ความไม่แน่ใจนี้เป็นสถานการณ์ทั่วไป ไม่ใช่ความผิดพลาดของคุณ',
    section3Body: 'องค์ประกอบบางอย่างช่วยนำทางความคิดของคุณ โดยไม่ใช่กฎสากล เพราะเครื่องหมายที่แน่ชัดแตกต่างกันตามสำนักนิติศาสตร์',
    differences: [
      ['calendar-clock-outline', 'ระยะเวลาเมื่อเทียบกับรอบเดือนปกติของคุณ'],
      ['repeat-variant', 'ความสม่ำเสมอหรือลักษณะผิดปกติของเลือดที่ออก'],
      ['water-outline', 'การเปลี่ยนแปลงของเลือดที่ออกตามเวลา'],
      ['clipboard-pulse-outline', 'การมีสาเหตุทางการแพทย์ที่ทราบอยู่หรือไม่'],
    ],
    note2Title: 'โปรดทราบ',
    note2Text: 'องค์ประกอบเหล่านี้เป็นเครื่องหมายทั่วไป ไม่ใช่เกณฑ์สัมบูรณ์: ผู้รู้และสำนักนิติศาสตร์อาจตีความต่างกัน',
    section4Body: 'การใช้เวลาสังเกตเลือดที่ออกเป็นเวลาหลายวันโดยไม่รีบร้อน ช่วยให้คุณเข้าใจสถานการณ์ของตัวเองดีขึ้นก่อนสรุป',
    checkList1Title: 'ข้อแนะนำเชิงปฏิบัติบางประการ',
    observeTips: [
      'จดวันที่เริ่มต้น และหากทำได้ ความยาวรอบเดือนตามปกติของคุณ',
      'สังเกตว่าเลือดที่ออกเป็นรูปแบบใกล้เคียงกับประจำเดือนก่อนหน้าของคุณหรือไม่',
      'อย่าอาศัยวันใดวันหนึ่งที่โดดเดี่ยวเพียงวันเดียว',
      'บันทึกการสังเกตเหล่านี้หากคุณวางแผนจะปรึกษาผู้รู้หรือบุคลากรทางการแพทย์',
    ],
    section5Body: 'ในกรณีอิสติฮาเฎาะฮ์ การละหมาดและการถือศีลอดโดยทั่วไปยังคงเป็นหน้าที่ ต่างจากระหว่างมีประจำเดือน จึงแนะนำให้ป้องกันด้านสุขอนามัย (เช่น อุปกรณ์ที่เหมาะสม) เพื่อให้ปฏิบัติศาสนกิจต่อไปได้ ตามวิธีที่สำนักนิติศาสตร์ต่าง ๆ สอน',
    tip2Title: 'ควรรู้',
    tip2Text: 'ข้อควรระวังที่แน่ชัด (เช่น การทำน้ำละหมาดใหม่) อาจต่างกันตามสำนักนิติศาสตร์ที่ปฏิบัติตาม การอ้างอิงความเห็นที่คุณปฏิบัติตามตามปกติหรือผู้รู้ที่มีคุณวุฒิช่วยให้คุณปฏิบัติได้ถูกต้อง',
    section6Body: 'ความสงสัยที่ยืดเยื้อเกี่ยวกับลักษณะของเลือดที่ออกเป็นสถานการณ์ทั่วไป และไม่ควรเป็นแหล่งของความกังวลมากเกินไป',
    doubtSteps: [
      'อ้างอิงระยะเวลาและจังหวะตามปกติของประจำเดือนของคุณเอง',
      'ปรึกษาบุคลากรทางการแพทย์หากเลือดที่ออกผิดปกติหรือยาวนาน',
      'ขอความเห็นจากผู้รู้ที่มีคุณวุฒิเกี่ยวกับมิติทางศาสนา',
      'โปรดจำไว้ว่าคำตอบทั่วไปไม่ได้ทดแทนคำแนะนำที่เหมาะกับสถานการณ์ของคุณ',
    ],
    alert2Title: 'ข้อมูลสำคัญ',
    alert2Text: 'เนื้อหานี้ยังคงเป็นเพื่อการเรียนรู้และเป็นข้อมูลทั่วไป: ไม่ใช่ฟัตวาหรือข้อวินิจฉัยทางศาสนาเฉพาะบุคคล สำหรับสถานการณ์ส่วนตัวใด ๆ โดยเฉพาะเมื่อสงสัยยืดเยื้อ ความเห็นของผู้รู้ที่มีคุณวุฒิยังคงเป็นแหล่งอ้างอิง',
    tip3Title: 'ควรรู้',
    tip3Text: 'อิสติฮาเฎาะฮ์เป็นแนวคิดที่แยกเลือดที่ออกผิดปกติออกจากประจำเดือนหรือนิฟาส พร้อมนัยเฉพาะต่อการละหมาดและการถือศีลอด เมื่อสงสัย การสังเกตอย่างรอบคอบและความเห็นของผู้รู้ที่มีคุณวุฒิยังคงเป็นแหล่งที่ดีที่สุด',
    shareMessage: 'ทำความเข้าใจอิสติฮาเฎาะฮ์ — AWA',
  },
  vi: {
    badge: 'ISTIHÂDA',
    title: 'Hiểu về Istihâda',
    metaDuration: '7 phút đọc',
    metaType: 'Câu hỏi thường gặp',
    metaLevel: 'Trung cấp',
    metaValidated: 'Nội dung đã được thẩm định',
    intro: 'Phân biệt ra máu bất thường với kỳ kinh thông thường của bạn, cùng những mốc chung để định hướng.',
    disclaimerTitle: 'Thông tin quan trọng',
    disclaimerText: 'Nội dung này hoàn toàn mang tính giáo dục. Các vấn đề tôn giáo cần được các học giả có thẩm quyền thẩm định. AWA không đưa ra fatwa hay phán quyết tôn giáo cá nhân hóa.',
    contentsTitle: 'Trong bài viết này',
    topics: [
      'Istihâda là gì?',
      'Tại sao có thể khó nhận biết?',
      'Sự khác biệt giữa kinh nguyệt và Istihâda',
      'Cách quan sát tình trạng ra máu?',
      'Cầu nguyện và nhịn ăn trong thời gian Istihâda',
      'Nên làm gì khi nghi ngờ?',
      'Những điểm chính cần nhớ',
    ],
    section1Body: 'Istihâda chỉ tình trạng ra máu xảy ra ngoài chu kỳ kinh nguyệt thông thường, hoặc kéo dài vượt quá thời gian kinh nguyệt được truyền thống Hồi giáo công nhận. Khác với kinh nguyệt (hayd) hay nifas (ra máu sau sinh), nó không có cùng tình trạng nghi lễ: nó thường được coi là ra máu có bản chất khác, đôi khi liên quan đến một nguyên nhân y khoa.',
    note1Title: 'Xin lưu ý',
    note1Text: 'Nội dung này giải thích khái niệm một cách chung chung; nó không cho phép bạn xác định một lần ra máu cụ thể có phải là Istihâda trong hoàn cảnh cá nhân của bạn hay không.',
    section2Body: 'Có thể khó phân biệt Istihâda với kinh nguyệt hoặc chu kỳ không đều, vì tình trạng ra máu đôi khi có thể trông giống nhau, thay đổi về cường độ hoặc kéo dài một cách bất thường. Chính các học giả cũng thừa nhận khó khăn này, điều đó giải thích tại sao có nhiều cách tiếp cận để nhận biết nó.',
    tip1Title: 'Nên biết',
    tip1Text: 'Việc không biết ngay lập tức một lần ra máu bất thường tương ứng với điều gì là bình thường; sự không chắc chắn này là một tình huống phổ biến, không phải lỗi của bạn.',
    section3Body: 'Một số yếu tố có thể giúp định hướng suy nghĩ của bạn, nhưng không phải là quy tắc phổ quát, vì các mốc cụ thể khác nhau tùy theo các trường phái luật học.',
    differences: [
      ['calendar-clock-outline', 'Thời gian so với chu kỳ thông thường của bạn'],
      ['repeat-variant', 'Tính đều đặn hoặc tính bất thường của việc ra máu'],
      ['water-outline', 'Tình trạng ra máu thay đổi như thế nào theo thời gian'],
      ['clipboard-pulse-outline', 'Khả năng có một nguyên nhân y khoa đã biết'],
    ],
    note2Title: 'Xin lưu ý',
    note2Text: 'Những yếu tố này là các mốc chung, không phải tiêu chí tuyệt đối: chúng có thể được các học giả và trường phái luật học diễn giải khác nhau.',
    section4Body: 'Dành thời gian quan sát tình trạng ra máu trong vài ngày, không vội vàng, giúp bạn hiểu rõ hơn hoàn cảnh của chính mình trước khi đi đến kết luận.',
    checkList1Title: 'Một vài gợi ý thực tế',
    observeTips: [
      'Ghi lại ngày bắt đầu và, nếu có thể, độ dài thông thường của các chu kỳ của bạn',
      'Quan sát xem tình trạng ra máu có theo một quy luật gần với các kỳ kinh trước của bạn không',
      'Đừng chỉ dựa vào một ngày riêng lẻ',
      'Ghi lại những quan sát này nếu bạn định hỏi ý kiến một học giả hoặc nhân viên y tế',
    ],
    section5Body: 'Trong trường hợp Istihâda, cầu nguyện và nhịn ăn nhìn chung vẫn là bắt buộc, khác với trong kỳ kinh. Khi đó, nên có các biện pháp vệ sinh phòng ngừa (như dùng sản phẩm vệ sinh phù hợp) để có thể tiếp tục thờ phượng, theo các phương pháp được các trường phái luật học dạy.',
    tip2Title: 'Nên biết',
    tip2Text: 'Các biện pháp phòng ngừa cụ thể (như làm lại wudu) có thể khác nhau tùy theo trường phái luật học mà bạn theo; việc tham khảo ý kiến mà bạn thường theo hoặc một học giả có thẩm quyền giúp bạn áp dụng chúng đúng cách.',
    section6Body: 'Việc còn nghi ngờ về bản chất của tình trạng ra máu là một tình huống phổ biến, và không nên là nguồn gốc của sự lo lắng quá mức.',
    doubtSteps: [
      'Tham khảo thời gian và nhịp độ thông thường của các kỳ kinh của chính bạn',
      'Hỏi ý kiến nhân viên y tế nếu tình trạng ra máu bất thường hoặc kéo dài',
      'Hỏi ý kiến một học giả có thẩm quyền về khía cạnh tôn giáo',
      'Hãy nhớ rằng một câu trả lời chung không thay thế sự hướng dẫn phù hợp với tình huống của bạn',
    ],
    alert2Title: 'Thông tin quan trọng',
    alert2Text: 'Nội dung này vẫn mang tính giáo dục và chung chung: nó không phải là fatwa hay phán quyết tôn giáo cá nhân. Với mọi tình huống cá nhân, đặc biệt khi nghi ngờ kéo dài, ý kiến của một học giả có thẩm quyền vẫn là tham chiếu.',
    tip3Title: 'Nên biết',
    tip3Text: 'Istihâda là một khái niệm phân biệt ra máu bất thường với kinh nguyệt hoặc nifas, với những hệ quả cụ thể đối với cầu nguyện và nhịn ăn. Khi nghi ngờ, quan sát cẩn thận và ý kiến của một học giả có thẩm quyền vẫn là những nguồn tham khảo tốt nhất.',
    shareMessage: 'Hiểu về Istihâda — AWA',
  },
  uz: {
    badge: 'ISTIHOZA',
    title: 'Istihozani tushunish',
    metaDuration: '7 daq oʻqish',
    metaType: 'Savol-javob',
    metaLevel: 'Oʻrta',
    metaValidated: 'Tasdiqlangan kontent',
    intro: 'Notekis qon ketishini odatiy hayzdan farqlash, yoʻl koʻrsatuvchi umumiy belgilar bilan.',
    disclaimerTitle: 'Muhim maʼlumot',
    disclaimerText: 'Bu kontent faqat taʼlimiy xarakterga ega. Diniy savollarni malakali ulamolar bilan tasdiqlash kerak. AWA fatvo yoki shaxsiy diniy hukm chiqarmaydi.',
    contentsTitle: 'Ushbu maqolada',
    topics: [
      'Istihoza nima?',
      'Nima uchun uni aniqlash qiyin boʻlishi mumkin?',
      'Hayz va istihoza oʻrtasidagi farqlar',
      'Qon ketishini qanday kuzatish kerak?',
      'Istihoza paytida namoz va roʻza',
      'Shubha boʻlsa nima qilish kerak?',
      'Asosiy xulosalar',
    ],
    section1Body: 'Istihoza odatiy hayz siklidan tashqarida sodir boʻladigan yoki islom anʼanasi tan olgan hayz davomiyligidan oshib davom etadigan qon ketishini bildiradi. Hayz (haydʻ) yoki nifos (tugʻruqdan keyingi qon ketishi) dan farqli ravishda, u bir xil ritual holatga ega emas: u odatda boshqa xususiyatdagi, baʼzan tibbiy sabab bilan bogʻliq qon ketishi hisoblanadi.',
    note1Title: 'Eʼtibor bering',
    note1Text: 'Bu kontent tushunchani umumiy tarzda tushuntiradi; u shaxsiy vaziyatingizda muayyan qon ketishi istihozaga mos kelishini aniqlashga imkon bermaydi.',
    section2Body: 'Istihozani hayzdan yoki notekis sikldan farqlash qiyin boʻlishi mumkin, chunki qon ketishi baʼzan oʻxshash koʻrinishi, kuchi boʻyicha farq qilishi yoki odatdan tashqari davom etishi mumkin. Bu qiyinchilikni ulamolarning oʻzlari ham tan oladi, shuning uchun uni aniqlashning bir necha yondashuvi mavjud.',
    tip1Title: 'Bilish foydali',
    tip1Text: 'Odatdan tashqari qon ketishi nimaga mos kelishini darhol bilmaslik normal; bu noaniqlik keng tarqalgan vaziyat, sizning xatoingiz emas.',
    section3Body: 'Baʼzi elementlar fikringizni yoʻnaltirishga yordam berishi mumkin, ular universal qoidalar emas, chunki aniq belgilar fiqhiy maktablarga qarab farq qiladi.',
    differences: [
      ['calendar-clock-outline', 'Odatiy siklingizga nisbatan davomiylik'],
      ['repeat-variant', 'Qon ketishining muntazamligi yoki odatdan tashqari xususiyati'],
      ['water-outline', 'Qon ketishi vaqt oʻtishi bilan qanday oʻzgaradi'],
      ['clipboard-pulse-outline', 'Maʼlum tibbiy sababning mumkin boʻlgan mavjudligi'],
    ],
    note2Title: 'Eʼtibor bering',
    note2Text: 'Bu elementlar umumiy belgilar, mutlaq mezonlar emas: ularni ulamolar va fiqhiy maktablar turlicha talqin qilishi mumkin.',
    section4Body: 'Xulosa chiqarishdan oldin qon ketishingizni bir necha kun davomida, shoshilmasdan kuzatish vaziyatingizni yaxshiroq tushunishga yordam beradi.',
    checkList1Title: 'Baʼzi amaliy tayanch nuqtalar',
    observeTips: [
      'Boshlanish sanasini va, iloji boʻlsa, sikllaringizning odatiy uzunligini yozib qoʻying',
      'Qon ketishi oldingi hayzlaringizga yaqin qonuniyatga amal qilishini kuzating',
      'Faqat bitta alohida kunga tayanmang',
      'Agar olim yoki sogʻliqni saqlash mutaxassisiga murojaat qilmoqchi boʻlsangiz, bu kuzatuvlarni yozib qoʻying',
    ],
    section5Body: 'Istihoza holatida namoz va roʻza, hayzdan farqli ravishda, odatda majburiy boʻlib qoladi. Shunda ibodatni davom ettirish uchun gigiyena choralari (masalan, mos himoya vositasi) tavsiya etiladi, turli fiqhiy maktablar oʻrgatadigan usullarga koʻra.',
    tip2Title: 'Bilish foydali',
    tip2Text: 'Aniq ehtiyot choralari (masalan, tahoratni yangilash) amal qilinadigan fiqhiy maktabga qarab farq qilishi mumkin; odatda amal qiladigan fikringizga yoki malakali olimga murojaat qilish ularni toʻgʻri qoʻllashga yordam beradi.',
    section6Body: 'Qon ketishining xususiyati haqida doimiy shubha keng tarqalgan vaziyat va haddan tashqari xavotir manbai boʻlmasligi kerak.',
    doubtSteps: [
      'Oʻz hayzlaringizning odatiy davomiyligi va ritmiga murojaat qiling',
      'Agar qon ketishi odatdan tashqari yoki uzoq davom etsa, sogʻliqni saqlash mutaxassisiga murojaat qiling',
      'Diniy jihat boʻyicha malakali olimdan fikr soʻrang',
      'Umumiy javob vaziyatingizga mos yoʻl-yoʻriqni almashtirmasligini esda tuting',
    ],
    alert2Title: 'Muhim maʼlumot',
    alert2Text: 'Bu kontent taʼlimiy va umumiy xarakterda qoladi: u fatvo yoki individual diniy hukm hisoblanmaydi. Har qanday shaxsiy vaziyat uchun, ayniqsa uzoq davom etgan shubha boʻlsa, malakali olimning fikri tayanch boʻlib qoladi.',
    tip3Title: 'Bilish foydali',
    tip3Text: 'Istihoza — odatdan tashqari qon ketishini hayz yoki nifosdan ajratadigan, namoz va roʻza uchun maxsus oqibatlarga ega tushuncha. Shubha boʻlsa, ehtiyotkor kuzatuv va malakali olimning fikri eng yaxshi manba boʻlib qoladi.',
    shareMessage: 'Istihozani tushunish — AWA',
  },
  az: {
    badge: 'İSTİHAZA',
    title: 'İstihazanı anlamaq',
    metaDuration: '7 dəq oxu',
    metaType: 'FAQ',
    metaLevel: 'Orta',
    metaValidated: 'Yoxlanılmış məzmun',
    intro: 'Qeyri-müntəzəm qanaxmanı adi aybaşınızdan fərqləndirmək — sizi istiqamətləndirməyə kömək edən ümumi göstəricilərlə.',
    disclaimerTitle: 'Vacib məlumat',
    disclaimerText: 'Bu məzmun tamamilə təhsil xarakterlidir. Dini suallar səlahiyyətli alimlər tərəfindən təsdiqlənməlidir. AWA fətva və ya fərdi dini hökmlər vermir.',
    contentsTitle: 'Bu məqalədə',
    topics: [
      'İstihaza nədir?',
      'Onu müəyyən etmək nə üçün çətin ola bilər?',
      'Aybaşı ilə istihaza arasındakı fərqlər',
      'Qanaxmanı necə müşahidə etmək olar?',
      'İstihaza zamanı namaz və oruc',
      'Şübhə olarsa, nə etmək lazımdır?',
      'Əsas nəticələr',
    ],
    section1Body: 'İstihaza adi menstrual dövrdən kənar baş verən və ya İslam ənənəsində tanınan aybaşı müddətindən artıq davam edən qanaxmaya deyilir. Aybaşıdan (heyz) və ya nifasdan (doğuşdan sonrakı qanaxma) fərqli olaraq, onun eyni ritual statusu yoxdur: o, adətən başqa xarakterli qanaxma hesab edilir və bəzən tibbi səbəblə bağlı ola bilər.',
    note1Title: 'Nəzərə alın',
    note1Text: 'Bu məzmun anlayışı ümumi şəkildə izah edir; o, konkret qanaxmanın şəxsi vəziyyətinizdə istihazaya uyğun olub-olmadığını müəyyən etməyə imkan vermir.',
    section2Body: 'İstihazanı aybaşıdan və ya qeyri-müntəzəm dövrdən fərqləndirmək çətin ola bilər, çünki qanaxma bəzən oxşar görünə, intensivliyi dəyişə və ya qeyri-adi şəkildə davam edə bilər. Bu çətinliyi alimlərin özləri də tanıyır, bu da onu müəyyən etmək üçün bir neçə yanaşmanın mövcud olmasını izah edir.',
    tip1Title: 'Bilmək faydalıdır',
    tip1Text: 'Qeyri-adi qanaxmanın nəyə uyğun gəldiyini dərhal bilməmək normaldır; bu qeyri-müəyyənlik geniş yayılmış vəziyyətdir, sizin səhviniz deyil.',
    section3Body: 'Bəzi elementlər düşüncənizi istiqamətləndirməyə kömək edə bilər, lakin onlar universal qayda deyil, çünki dəqiq göstəricilər hüquq məktəblərinə görə dəyişir.',
    differences: [
      ['calendar-clock-outline', 'Adi dövrünüzə nisbətən müddət'],
      ['repeat-variant', 'Qanaxmanın müntəzəmliyi və ya qeyri-adi xarakteri'],
      ['water-outline', 'Qanaxmanın zamanla necə dəyişdiyi'],
      ['clipboard-pulse-outline', 'Məlum tibbi səbəbin mümkün olması'],
    ],
    note2Title: 'Nəzərə alın',
    note2Text: 'Bu elementlər ümumi göstəricilərdir, mütləq meyarlar deyil: onlar alimlər və hüquq məktəbləri tərəfindən fərqli şərh oluna bilər.',
    section4Body: 'Qanaxmanızı tələsmədən bir neçə gün ərzində müşahidə etmək üçün vaxt ayırmaq nəticə çıxarmazdan əvvəl öz vəziyyətinizi daha yaxşı anlamağa kömək edir.',
    checkList1Title: 'Bəzi praktik göstərişlər',
    observeTips: [
      'Başlanğıc tarixini və mümkünsə, dövrlərinizin adi uzunluğunu qeyd edin',
      'Qanaxmanın əvvəlki aybaşılarınıza yaxın qanunauyğunluğa uyğun olub-olmadığını müşahidə edin',
      'Yalnız tək bir təcrid olunmuş günə arxalanmayın',
      'Alimə və ya tibb işçisinə müraciət etməyi planlaşdırırsınızsa, bu müşahidələri qeyd edin',
    ],
    section5Body: 'İstihaza halında namaz və oruc, aybaşıdan fərqli olaraq, adətən vacib qalır. Bu zaman ibadətin davam etməsinə imkan vermək üçün müxtəlif hüquq məktəblərinin öyrətdiyi qaydalara uyğun olaraq gigiyena ehtiyat tədbirləri (məsələn, uyğun qoruyucu vasitə) tövsiyə olunur.',
    tip2Title: 'Bilmək faydalıdır',
    tip2Text: 'Dəqiq ehtiyat tədbirləri (məsələn, dəstəmazın yenilənməsi) əməl edilən hüquq məktəbindən asılı olaraq dəyişə bilər; adətən əməl etdiyiniz fikrə və ya səlahiyyətli alimə müraciət etmək onları düzgün tətbiq etməyə kömək edir.',
    section6Body: 'Qanaxmanın xarakteri barədə davamlı şübhə geniş yayılmış vəziyyətdir və həddindən artıq narahatlıq mənbəyi olmamalıdır.',
    doubtSteps: [
      'Öz aybaşılarınızın adi müddətinə və ritminə müraciət edin',
      'Qanaxma qeyri-adi və ya uzunmüddətlidirsə, tibb işçisi ilə məsləhətləşin',
      'Dini aspekt barədə səlahiyyətli alimdən fikir soruşun',
      'Yadda saxlayın ki, ümumi cavab vəziyyətinizə uyğun istiqamətləndirməni əvəz etmir',
    ],
    alert2Title: 'Vacib məlumat',
    alert2Text: 'Bu məzmun təhsil və ümumi xarakterli qalır: o, fətva və ya fərdi dini hökm təşkil etmir. İstənilən şəxsi vəziyyət üçün, xüsusilə uzunmüddətli şübhə halında, səlahiyyətli alimin fikri istinad olaraq qalır.',
    tip3Title: 'Bilmək faydalıdır',
    tip3Text: 'İstihaza qeyri-adi qanaxmanı aybaşıdan və ya nifasdan fərqləndirən, namaz və oruc üçün konkret nəticələri olan anlayışdır. Şübhə olarsa, diqqətli müşahidə və səlahiyyətli alimin fikri ən yaxşı mənbələr olaraq qalır.',
    shareMessage: 'İstihazanı anlamaq — AWA',
  },
  ka: {
    badge: 'ისთიჰადა',
    title: 'ისთიჰადას გაგება',
    metaDuration: '7 წთ საკითხავი',
    metaType: 'ხშირი კითხვები',
    metaLevel: 'საშუალო',
    metaValidated: 'გადამოწმებული შინაარსი',
    intro: 'არარეგულარული სისხლდენის განსხვავება თქვენი ჩვეულებრივი მენსტრუაციისგან, ზოგადი მარკერებით, რომლებიც გიწევთ გზის გაკვლევაში.',
    disclaimerTitle: 'მნიშვნელოვანი ინფორმაცია',
    disclaimerText: 'ეს შინაარსი წმინდა საგანმანათლებლოა. რელიგიური საკითხები კვალიფიციურ მეცნიერებთან უნდა დადასტურდეს. AWA არ გასცემს ფეტვებს ან პერსონალიზებულ რელიგიურ განაჩენს.',
    contentsTitle: 'ამ სტატიაში',
    topics: [
      'რა არის ისთიჰადა?',
      'რატომ შეიძლება მისი ამოცნობა რთული იყოს?',
      'განსხვავებები მენსტრუაციასა და ისთიჰადას შორის',
      'როგორ დავაკვირდეთ სისხლდენას?',
      'ლოცვა და მარხვა ისთიჰადას დროს',
      'რა გავაკეთოთ ეჭვის შემთხვევაში?',
      'მთავარი დასკვნები',
    ],
    section1Body: 'ისთიჰადა ნიშნავს სისხლდენას, რომელიც ჩვეულებრივი მენსტრუაციული ციკლის გარეთ ხდება ან გრძელდება ისლამური ტრადიციით აღიარებულ მენსტრუაციის ხანგრძლივობაზე მეტ ხანს. მენსტრუაციისგან (ჰაიდი) ან ნიფასისგან (სისხლდენა მშობიარობის შემდეგ) განსხვავებით, მას იგივე რიტუალური სტატუსი არ აქვს: ის ზოგადად განსხვავებული ბუნების სისხლდენად ითვლება, ზოგჯერ სამედიცინო მიზეზთან დაკავშირებული.',
    note1Title: 'გაითვალისწინეთ',
    note1Text: 'ეს შინაარსი ცნებას ზოგადად განმარტავს; ის არ გაძლევთ საშუალებას განსაზღვროთ, შეესაბამება თუ არა კონკრეტული სისხლდენა ისთიჰადას თქვენს პირად სიტუაციაში.',
    section2Body: 'ისთიჰადის მენსტრუაციისგან ან არარეგულარული ციკლისგან გარჩევა შეიძლება რთული იყოს, რადგან სისხლდენა ზოგჯერ მსგავსად გამოიყურება, ინტენსივობით განსხვავდება ან უჩვეულოდ გრძელდება. ამ სირთულეს თავად მეცნიერებიც აღიარებენ, რაც ხსნის, რატომ არსებობს მისი გამოსავლენად რამდენიმე მიდგომა.',
    tip1Title: 'კარგია ვიცოდეთ',
    tip1Text: 'ნორმალურია, რომ დაუყოვნებლივ არ იცოდეთ, რას შეესაბამება უჩვეულო სისხლდენა; ეს გაურკვევლობა გავრცელებული სიტუაციაა და თქვენი შეცდომა არ არის.',
    section3Body: 'გარკვეულ ელემენტებს შეუძლია თქვენი მსჯელობის წარმართვა, თუმცა ისინი უნივერსალური წესები არ არის, რადგან ზუსტი მარკერები სამართლებრივი სკოლების მიხედვით განსხვავდება.',
    differences: [
      ['calendar-clock-outline', 'ხანგრძლივობა თქვენს ჩვეულებრივ ციკლთან შედარებით'],
      ['repeat-variant', 'სისხლდენის რეგულარულობა ან უჩვეულო ხასიათი'],
      ['water-outline', 'როგორ იცვლება სისხლდენა დროთა განმავლობაში'],
      ['clipboard-pulse-outline', 'ცნობილი სამედიცინო მიზეზის შესაძლო არსებობა'],
    ],
    note2Title: 'გაითვალისწინეთ',
    note2Text: 'ეს ელემენტები ზოგადი მარკერებია და არა აბსოლუტური კრიტერიუმები: მეცნიერებისა და სამართლებრივი სკოლების მიერ მათი ინტერპრეტაცია განსხვავებულად შეიძლება მოხდეს.',
    section4Body: 'რამდენიმე დღის განმავლობაში სისხლდენაზე დაკვირვებისთვის დროის დათმობა, აჩქარების გარეშე, დასკვნის გაკეთებამდე თქვენი საკუთარი სიტუაციის უკეთ გაგებაში გეხმარებათ.',
    checkList1Title: 'რამდენიმე პრაქტიკული მინიშნება',
    observeTips: [
      'აღნიშნეთ დაწყების თარიღი და, თუ შესაძლებელია, თქვენი ციკლების ჩვეულებრივი ხანგრძლივობა',
      'დააკვირდით, მისდევს თუ არა სისხლდენა თქვენი წინა მენსტრუაციების მსგავს სურათს',
      'არ დაეყრდნოთ მხოლოდ ერთ იზოლირებულ დღეს',
      'ჩაიწერეთ ეს დაკვირვებები, თუ მეცნიერთან ან ჯანდაცვის სპეციალისტთან კონსულტაციას აპირებთ',
    ],
    section5Body: 'ისთიჰადას შემთხვევაში ლოცვა და მარხვა ზოგადად სავალდებულო რჩება, მენსტრუაციისგან განსხვავებით. ჰიგიენური სიფრთხილის ზომები (მაგალითად, შესაფერისი დამცავი საშუალება) მაშინ რეკომენდებულია ღვთისმსახურების გასაგრძელებლად, სხვადასხვა სამართლებრივი სკოლის მიერ ნასწავლი მეთოდების მიხედვით.',
    tip2Title: 'კარგია ვიცოდეთ',
    tip2Text: 'ზუსტი სიფრთხილის ზომები (მაგალითად, აბდესტის განახლება) შეიძლება განსხვავდებოდეს თქვენ მიერ მიყოლილი სამართლებრივი სკოლის მიხედვით; იმ მოსაზრებისადმი მიმართვა, რომელსაც ჩვეულებრივ მისდევთ, ან კვალიფიციურ მეცნიერთან მიმართვა გეხმარებათ მათ სწორად გამოყენებაში.',
    section6Body: 'სისხლდენის ბუნებაში გაგრძელებული ეჭვი გავრცელებული სიტუაციაა და ზედმეტი შფოთვის წყარო არ უნდა იყოს.',
    doubtSteps: [
      'მიმართეთ თქვენი საკუთარი მენსტრუაციების ჩვეულებრივ ხანგრძლივობასა და რიტმს',
      'მიმართეთ ჯანდაცვის სპეციალისტს, თუ სისხლდენა უჩვეულოა ან ხანგრძლივი',
      'სთხოვეთ კვალიფიციურ მეცნიერს მისი აზრი რელიგიურ ასპექტზე',
      'გახსოვდეთ, რომ ზოგადი პასუხი თქვენს სიტუაციაზე მორგებულ მითითებას არ ანაცვლებს',
    ],
    alert2Title: 'მნიშვნელოვანი ინფორმაცია',
    alert2Text: 'ეს შინაარსი რჩება საგანმანათლებლო და ზოგადი: ის არ წარმოადგენს ფეტვას ან ინდივიდუალურ რელიგიურ განაჩენს. ნებისმიერ პირად სიტუაციაში, განსაკუთრებით გაგრძელებული ეჭვის შემთხვევაში, კვალიფიციური მეცნიერის აზრი რჩება საორიენტაციო წყაროდ.',
    tip3Title: 'კარგია ვიცოდეთ',
    tip3Text: 'ისთიჰადა ცნებაა, რომელიც უჩვეულო სისხლდენას მენსტრუაციისა თუ ნიფასისგან განასხვავებს, ლოცვასა და მარხვაზე კონკრეტული გავლენით. ეჭვის შემთხვევაში ყურადღებიანი დაკვირვება და კვალიფიციური მეცნიერის აზრი საუკეთესო წყაროდ რჩება.',
    shareMessage: 'ისთიჰადას გაგება — AWA',
  },
  hy: {
    badge: 'ԻՍԹԻՀԱԴԱ',
    title: 'Հասկանալ իսթիհադան',
    metaDuration: '7 ր կարդալու համար',
    metaType: 'ՀՏՀ',
    metaLevel: 'Միջին',
    metaValidated: 'Վերանայված բովանդակություն',
    intro: 'Անկանոն արյունահոսությունը տարբերակել ձեր սովորական դաշտանից՝ ընդհանուր ուղենիշներով, որոնք կօգնեն ուղղորդել ձեզ:',
    disclaimerTitle: 'Կարևոր տեղեկություն',
    disclaimerText: 'Այս բովանդակությունը զուտ կրթական է: Կրոնական հարցերը պետք է վավերացվեն որակավորված գիտնականների կողմից: AWA-ն ֆեթվաներ կամ անհատականացված կրոնական դատավճիռներ չի տալիս:',
    contentsTitle: 'Այս հոդվածում',
    topics: [
      'Ի՞նչ է իսթիհադան',
      'Ինչու կարող է դժվար լինել այն բացահայտել',
      'Տարբերությունները դաշտանի և իսթիհադայի միջև',
      'Ինչպես դիտարկել արյունահոսությունը',
      'Աղոթք և պահք իսթիհադայի ընթացքում',
      'Ի՞նչ անել կասկածի դեպքում',
      'Հիմնական եզրակացություններ',
    ],
    section1Body: 'Իսթիհադան նշանակում է արյունահոսություն, որը տեղի է ունենում սովորական դաշտանային ցիկլից դուրս կամ շարունակվում է իսլամական ավանդույթով ճանաչված դաշտանի տևողությունից ավելի: Ի տարբերություն դաշտանի (հայդ) կամ նիֆասի (ծննդաբերությունից հետո արյունահոսություն)՝ այն չունի նույն ծիսական կարգավիճակը. այն սովորաբար համարվում է այլ բնույթի արյունահոսություն, երբեմն կապված բժշկական պատճառի հետ:',
    note1Title: 'Խնդրում ենք ուշադրություն դարձնել',
    note1Text: 'Այս բովանդակությունը բացատրում է հասկացությունը ընդհանուր տերմիններով. այն թույլ չի տալիս որոշել՝ կոնկրետ արյունահոսությունը համապատասխանո՞ւմ է իսթիհադային ձեր անձնական իրավիճակում:',
    section2Body: 'Իսթիհադան դաշտանից կամ անկանոն ցիկլից տարբերակելը կարող է դժվար լինել, քանի որ արյունահոսությունը երբեմն կարող է նման երևալ, տարբեր ինտենսիվություն ունենալ կամ շարունակվել անսովոր կերպով: Այս դժվարությունը ճանաչվում է հենց գիտնականների կողմից, ինչը բացատրում է, թե ինչու գոյություն ունեն այն բացահայտելու մի քանի մոտեցումներ:',
    tip1Title: 'Լավ է իմանալ',
    tip1Text: 'Նորմալ է անմիջապես չիմանալ, թե անսովոր արյունահոսությունը ինչին է համապատասխանում. այս անորոշությունը տարածված իրավիճակ է, այլ ոչ թե ձեր սխալը:',
    section3Body: 'Որոշ տարրեր կարող են օգնել ուղղորդել ձեր մտածողությունը՝ առանց համընդհանուր կանոններ լինելու, քանի որ ճշգրիտ ուղենիշները տարբերվում են իրավագիտական դպրոցներով:',
    differences: [
      ['calendar-clock-outline', 'Տևողությունը ձեր սովորական ցիկլի համեմատ'],
      ['repeat-variant', 'Արյունահոսության կանոնավորությունը կամ անսովոր բնույթը'],
      ['water-outline', 'Ինչպես է արյունահոսությունը փոխվում ժամանակի ընթացքում'],
      ['clipboard-pulse-outline', 'Հայտնի բժշկական պատճառի հնարավոր առկայություն'],
    ],
    note2Title: 'Խնդրում ենք ուշադրություն դարձնել',
    note2Text: 'Այս տարրերը ընդհանուր ուղենիշներ են, ոչ թե բացարձակ չափանիշներ. գիտնականները և իրավագիտական դպրոցները կարող են դրանք տարբեր կերպ մեկնաբանել:',
    section4Body: 'Մի քանի օր շարունակ ձեր արյունահոսությունը դիտարկելու համար ժամանակ տրամադրելը՝ առանց շտապելու, օգնում է ավելի լավ հասկանալ ձեր իրավիճակը՝ նախքան եզրակացության գալը:',
    checkList1Title: 'Մի քանի գործնական ցուցում',
    observeTips: [
      'Նշեք սկզբի ամսաթիվը և, հնարավորության դեպքում, ձեր ցիկլերի սովորական տևողությունը',
      'Դիտարկեք՝ արդյոք արյունահոսությունը հետևում է ձեր նախորդ դաշտաններին մոտ օրինաչափության',
      'Մի հիմնվեք միայն մեկ մեկուսացված օրվա վրա',
      'Գրանցեք այս դիտարկումները, եթե նախատեսում եք դիմել գիտնականի կամ առողջապահության մասնագետի',
    ],
    section5Body: 'Իսթիհադայի դեպքում աղոթքը և պահքը սովորաբար մնում են պարտադիր, ի տարբերություն դաշտանի ժամանակի: Այդ դեպքում խորհուրդ են տրվում հիգիենիկ նախազգուշական միջոցներ (օրինակ՝ համապատասխան պաշտպանություն)՝ պաշտամունքը շարունակելու համար՝ ըստ տարբեր իրավագիտական դպրոցների ուսուցանած եղանակների:',
    tip2Title: 'Լավ է իմանալ',
    tip2Text: 'Ճշգրիտ նախազգուշական միջոցները (օրինակ՝ կրկնակի աբդեստ) կարող են տարբերվել՝ կախված հետևվող իրավագիտական դպրոցից. ձեր սովորաբար հետևվող կարծիքին կամ որակավորված գիտնականին դիմելը օգնում է դրանք ճիշտ կիրառել:',
    section6Body: 'Արյունահոսության բնույթի շուրջ շարունակական կասկածը տարածված իրավիճակ է և չպետք է չափազանց անհանգստության աղբյուր լինի:',
    doubtSteps: [
      'Հղվեք ձեր սեփական դաշտանների սովորական տևողությանը և ռիթմին',
      'Դիմեք առողջապահության մասնագետի, եթե արյունահոսությունը անսովոր է կամ երկարատև',
      'Խնդրեք որակավորված գիտնականի կարծիքը կրոնական կողմի վերաբերյալ',
      'Հիշեք, որ ընդհանուր պատասխանը չի փոխարինում ձեր իրավիճակին համապատասխան ուղղորդմանը',
    ],
    alert2Title: 'Կարևոր տեղեկություն',
    alert2Text: 'Այս բովանդակությունը մնում է կրթական և ընդհանուր. այն չի հանդիսանում ֆեթվա կամ անհատական կրոնական դատավճիռ: Ցանկացած անձնական իրավիճակի համար, մասնավորապես երկարատև կասկածի դեպքում, որակավորված գիտնականի կարծիքը մնում է հիմնական հղումը:',
    tip3Title: 'Լավ է իմանալ',
    tip3Text: 'Իսթիհադան հասկացություն է, որը տարբերակում է անսովոր արյունահոսությունը դաշտանից կամ նիֆասից՝ աղոթքի և պահքի համար հատուկ հետևանքներով: Կասկածի դեպքում ուշադիր դիտարկումը և որակավորված գիտնականի կարծիքը մնում են լավագույն ռեսուրսները:',
    shareMessage: 'Հասկանալ իսթիհադան — AWA',
  },
  tg: {
    badge: 'ИСТИҲОЗА',
    title: 'Фаҳмидани истиҳоза',
    metaDuration: '7 дақ барои хондан',
    metaType: 'Саволу ҷавоб',
    metaLevel: 'Миёна',
    metaValidated: 'Мазмуни баррасишуда',
    intro: 'Фарқ кардани хунравии номунтазам аз ҳайзи одатии шумо, бо нишонаҳои умумӣ барои роҳнамоӣ.',
    disclaimerTitle: 'Маълумоти муҳим',
    disclaimerText: 'Ин мазмун комилан таълимист. Масъалаҳои динӣ бояд аз ҷониби олимони салоҳиятдор тасдиқ карда шаванд. AWA фатво ё ҳукмҳои шахсии динӣ намедиҳад.',
    contentsTitle: 'Дар ин мақола',
    topics: [
      'Истиҳоза чист?',
      'Чаро муайян кардани он мушкил буда метавонад?',
      'Фарқиятҳои байни ҳайз ва истиҳоза',
      'Хунравиро чӣ тавр мушоҳида кардан?',
      'Намоз ва рӯза ҳангоми истиҳоза',
      'Дар сурати шубҳа чӣ кор кардан лозим аст?',
      'Хулосаҳои асосӣ',
    ],
    section1Body: 'Истиҳоза хунравиро мефаҳмонад, ки берун аз давраи муқаррарии ҳайз рух медиҳад ё аз давомнокии ҳайзи аз ҷониби анъанаи исломӣ шинохташуда зиёдтар идома меёбад. Бар хилофи ҳайз ё нифос (хунравии пас аз таваллуд), он ҳамон мақоми маросимиро надорад: он одатан хунравии хусусияти дигар ҳисоб мешавад, ки баъзан бо сабаби тиббӣ алоқаманд аст.',
    note1Title: 'Таваҷҷӯҳ кунед',
    note1Text: 'Ин мазмун мафҳумро ба таври умумӣ шарҳ медиҳад; он ба шумо имкон намедиҳад муайян кунед, ки оё хунравии мушаххас дар вазъияти шахсии шумо истиҳоза аст.',
    section2Body: 'Фарқ кардани истиҳоза аз ҳайз ё давраи номунтазам метавонад душвор бошад, зеро хунравӣ баъзан метавонад монанд намояд, шиддаташ гуногун бошад ё ба таври ғайриоддӣ идома ёбад. Ин душвориро худи олимон эътироф мекунанд, ки сабаби вуҷуд доштани якчанд равиш барои муайян кардани онро шарҳ медиҳад.',
    tip1Title: 'Донистан хуб аст',
    tip1Text: 'Муқаррарӣ аст, ки фавран надонед хунравии ғайриоддӣ ба чӣ мувофиқ аст; ин номуайянӣ ҳолати маъмул аст, на хатои шумо.',
    section3Body: 'Баъзе унсурҳо метавонанд ба роҳнамоии фикри шумо кумак кунанд, бидуни он ки қоидаҳои умумӣ бошанд, зеро нишонаҳои дақиқ вобаста ба мазҳабҳои фиқҳӣ гуногунанд.',
    differences: [
      ['calendar-clock-outline', 'Давомнокӣ дар муқоиса бо давраи одатии шумо'],
      ['repeat-variant', 'Мунтазамӣ ё хусусияти ғайриоддии хунравӣ'],
      ['water-outline', 'Чӣ тавр хунравӣ бо мурури замон тағйир меёбад'],
      ['clipboard-pulse-outline', 'Мавҷудияти эҳтимолии сабаби маълуми тиббӣ'],
    ],
    note2Title: 'Таваҷҷӯҳ кунед',
    note2Text: 'Ин унсурҳо нишонаҳои умумӣ мебошанд, на меъёрҳои мутлақ: олимон ва мазҳабҳои фиқҳӣ метавонанд онҳоро ба таври гуногун тафсир кунанд.',
    section4Body: 'Вақт ҷудо кардан барои мушоҳидаи хунравии худ дар давоми чанд рӯз, бидуни шитоб, ба шумо кумак мекунад вазъияти худро пеш аз хулоса баровардан беҳтар бифаҳмед.',
    checkList1Title: 'Чанд ишораи амалӣ',
    observeTips: [
      'Санаи оғоз ва, агар имкон бошад, дарозии одатии давраҳои худро қайд кунед',
      'Мушоҳида кунед, ки оё хунравӣ намунаеро, ки ба ҳайзҳои пештараи шумо наздик аст, пайравӣ мекунад',
      'Танҳо ба як рӯзи ҷудогона такя накунед',
      'Агар ният доред бо олим ё мутахассиси соҳаи тиб машварат кунед, ин мушоҳидаҳоро сабт кунед',
    ],
    section5Body: 'Дар ҳолати истиҳоза намоз ва рӯза одатан ҳатмӣ мемонанд, бар хилофи давраи ҳайз. Чораҳои гигиенӣ (масалан, воситаи муҳофизати мувофиқ) он гоҳ тавсия дода мешаванд, то ибодат аз рӯи усулҳои аз ҷониби мазҳабҳои гуногуни фиқҳӣ таълимдодашуда идома ёбад.',
    tip2Title: 'Донистан хуб аст',
    tip2Text: 'Чораҳои дақиқ (масалан, таҷдиди таҳорат) вобаста ба мазҳаби фиқҳии пайравишаванда метавонанд гуногун бошанд; муроҷиат ба назаре, ки одатан пайравӣ мекунед, ё олими салоҳиятдор ба шумо кумак мекунад онҳоро дуруст татбиқ кунед.',
    section6Body: 'Шубҳаи доимӣ дар бораи хусусияти хунравӣ ҳолати маъмул аст ва набояд сарчашмаи нигаронии аз ҳад зиёд бошад.',
    doubtSteps: [
      'Ба давомнокӣ ва суръати одатии ҳайзи худ муроҷиат кунед',
      'Агар хунравӣ ғайриоддӣ ё дарозмуддат бошад, бо мутахассиси соҳаи тиб машварат кунед',
      'Аз олими салоҳиятдор дар бораи ҷанбаи динӣ назари ӯро пурсед',
      'Дар хотир доред, ки посухи умумӣ роҳнамоии мувофиқ ба вазъияти шуморо иваз намекунад',
    ],
    alert2Title: 'Маълумоти муҳим',
    alert2Text: 'Ин мазмун таълимӣ ва умумӣ мемонад: он фатво ё ҳукми шахсии динӣ нест. Барои ҳар вазъияти шахсӣ, хусусан дар сурати шубҳаи дарозмуддат, назари олими салоҳиятдор манбаи асосӣ боқӣ мемонад.',
    tip3Title: 'Донистан хуб аст',
    tip3Text: 'Истиҳоза мафҳумест, ки хунравии ғайриоддиро аз ҳайз ё нифос фарқ мекунад, бо оқибатҳои махсус барои намоз ва рӯза. Дар сурати шубҳа, мушоҳидаи бодиққат ва назари олими салоҳиятдор беҳтарин манбаъҳо мемонанд.',
    shareMessage: 'Фаҳмидани истиҳоза — AWA',
  },
  ky: {
    badge: 'ИСТИХАЗА',
    title: 'Истихазаны түшүнүү',
    metaDuration: '7 мүн окуу',
    metaType: 'КБС',
    metaLevel: 'Орто',
    metaValidated: 'Текшерилген мазмун',
    intro: 'Туура эмес кан кетүүнү адаттагы етек киримден айырмалоо, багыт берүүчү жалпы таяныч чекиттер менен.',
    disclaimerTitle: 'Маанилүү маалымат',
    disclaimerText: 'Бул мазмун таза билим берүү максатында. Диний суроолорду квалификациялуу окумуштуулар текшериши керек. AWA фатва же жекелештирилген диний чечимдерди чыгарбайт.',
    contentsTitle: 'Бул макалада',
    topics: [
      'Истихаза деген эмне?',
      'Аны аныктоо эмне үчүн кыйын болушу мүмкүн?',
      'Етек кирим менен истихазанын ортосундагы айырмачылыктар',
      'Кан кетүүнү кантип байкоо керек?',
      'Истихаза учурундагы намаз жана орозо',
      'Күмөн болгондо эмне кылуу керек?',
      'Негизги жыйынтыктар',
    ],
    section1Body: 'Истихаза — адаттагы етек кирим циклинен тышкары пайда болгон же ислам салты тааныган етек кирим узактыгынан ашып уланган кан кетүү. Етек киримден (хайз) же нифастан (төрөттөн кийинки кан кетүү) айырмаланып, анын ибадаттык макамы башкача: ал адатта башка мүнөздөгү, кээде медициналык себеп менен байланышкан кан кетүү деп эсептелет.',
    note1Title: 'Көңүл буруңуз',
    note1Text: 'Бул мазмун түшүнүктү жалпы түрдө түшүндүрөт; ал белгилүү бир кан кетүү сиздин жеке абалыңызда истихазага туура келеби же жокпу, аны аныктоого мүмкүндүк бербейт.',
    section2Body: 'Истихазаны етек киримден же туура эмес циклден айырмалоо кыйын болушу мүмкүн, анткени кан кетүү кээде окшош көрүнүп, курчтугу өзгөрүп же адаттан тыш уланышы мүмкүн. Бул кыйынчылыкты окумуштуулардын өздөрү таанышат, ошондуктан аны аныктоонун бир нече ыкмасы бар.',
    tip1Title: 'Билүү пайдалуу',
    tip1Text: 'Адаттан тыш кан кетүү эмнеге туура келерин дароо билбөө кадимки көрүнүш; бул белгисиздик кеңири таралган абал, сиздин катаңыз эмес.',
    section3Body: 'Айрым элементтер ойлонууңузга багыт берүүгө жардам бере алат, бирок алар универсалдуу эрежелер эмес, анткени так белгилер фикх мектептерине жараша айырмаланат.',
    differences: [
      ['calendar-clock-outline', 'Адаттагы циклиңизге салыштырмалуу узактык'],
      ['repeat-variant', 'Кан кетүүнүн үзгүлтүксүздүгү же адаттан тыш мүнөзү'],
      ['water-outline', 'Кан кетүү убакыттын өтүшү менен кандай өзгөрөт'],
      ['clipboard-pulse-outline', 'Белгилүү медициналык себептин болушу мүмкүн экени'],
    ],
    note2Title: 'Көңүл буруңуз',
    note2Text: 'Бул элементтер жалпы таяныч чекиттер, абсолюттук критерийлер эмес: аларды окумуштуулар жана фикх мектептери ар башка чечмелеши мүмкүн.',
    section4Body: 'Кан кетүүңүздү бир нече күн бою шашпай байкоого убакыт бөлүү жыйынтык чыгарардан мурун өз абалыңызды жакшыраак түшүнүүгө жардам берет.',
    checkList1Title: 'Бир нече практикалык кеңеш',
    observeTips: [
      'Башталган күндү жана мүмкүн болсо циклдериңиздин адаттагы узактыгын жазып коюңуз',
      'Кан кетүү мурунку етек киримдериңизге жакын мыйзам ченемдүүлүктү ээрчийби — байкаңыз',
      'Жалгыз гана бир күнгө таянбаңыз',
      'Окумуштуу же ден соолук сактоо адисине кайрылууну пландап жатсаңыз, бул байкоолорду жазып коюңуз',
    ],
    section5Body: 'Истихаза учурунда, етек киримден айырмаланып, намаз жана орозо жалпысынан милдеттүү бойдон калат. Ошондо ибадатты улантуу үчүн гигиеналык сактык чаралары (мисалы, ылайыктуу коргонуу) фикх мектептери үйрөткөн ыкмаларга ылайык сунушталат.',
    tip2Title: 'Билүү пайдалуу',
    tip2Text: 'Так сактык чаралары (мисалы, даарат алууну жаңылоо) ээрчилген фикх мектебине жараша айырмаланышы мүмкүн; адатта ээрчип жүргөн пикириңизге же квалификациялуу окумуштууга кайрылуу аларды туура колдонууга жардам берет.',
    section6Body: 'Кан кетүүнүн мүнөзү жөнүндө улана берген күмөн кеңири таралган абал жана ашыкча санааркоого булак болбошу керек.',
    doubtSteps: [
      'Өз етек киримдериңиздин адаттагы узактыгына жана ритмине кайрылыңыз',
      'Кан кетүү адаттан тыш же узакка созулса, ден соолук сактоо адисине кайрылыңыз',
      'Диний жагы боюнча квалификациялуу окумуштуунун пикирин сураңыз',
      'Жалпы жооп абалыңызга ылайыкталган жетекчиликти алмаштырбасын эстен чыгарбаңыз',
    ],
    alert2Title: 'Маанилүү маалымат',
    alert2Text: 'Бул мазмун билим берүүчү жана жалпы бойдон калат: ал фатва же жеке диний чечим эмес. Ар кандай жеке абал үчүн, айрыкча узакка созулган күмөндө, квалификациялуу окумуштуунун пикири шилтеме бойдон калат.',
    tip3Title: 'Билүү пайдалуу',
    tip3Text: 'Истихаза — адаттан тыш кан кетүүнү етек киримден же нифастан айырмалаган түшүнүк, намазга жана орозого өзгөчө таасири менен. Күмөн болгондо кылдат байкоо жана квалификациялуу окумуштуунун пикири эң жакшы булак бойдон калат.',
    shareMessage: 'Истихазаны түшүнүү — AWA',
  },
  tk: {
    badge: 'ISTIHAZA',
    title: 'Istihazany düşünmek',
    metaDuration: '7 min okamak',
    metaType: 'KBS',
    metaLevel: 'Orta',
    metaValidated: 'Barlanan mazmun',
    intro: 'Düzgünsiz gan akmany adaty aýbaşyňyzdan tapawutlandyrmak, size ugur görkezmek üçin umumy bellikler bilen.',
    disclaimerTitle: 'Möhüm maglumat',
    disclaimerText: 'Bu mazmun diňe bilim berýär. Dini soraglary bilimli alymlar tassyklamaly. AWA fatwa ýa-da şahsylaşdyrylan dini hökümler bermeýär.',
    contentsTitle: 'Bu makalada',
    topics: [
      'Istihaza näme?',
      'Ony kesgitlemek näme üçin kyn bolup biler?',
      'Aýbaşy bilen istihazanyň tapawutlary',
      'Gan akmany nähili synlamaly?',
      'Istihaza wagtynda namaz we oraza',
      'Şübhe bolanda näme etmeli?',
      'Esasy netijeler',
    ],
    section1Body: 'Istihaza adaty aýbaşy sikliniň daşynda bolýan ýa-da yslam däbi tarapyndan ykrar edilen aýbaşy dowamlylygyndan geçip dowam edýän gan akmany aňladýar. Aýbaşydan (haýz) ýa-da nifasdan (dograndan soňky gan akma) tapawutlylykda, onuň şol bir dini ýagdaýy ýok: ol adatça başga häsiýetli, käwagt lukmançylyk sebäp bilen baglanyşykly gan akma hasaplanýar.',
    note1Title: 'Üns beriň',
    note1Text: 'Bu mazmun düşünjäni umumy manyda düşündirýär; belli bir gan akmanyň siziň şahsy ýagdaýyňyzda istihazadygyny kesgitlemäge mümkinçilik bermeýär.',
    section2Body: 'Istihazany aýbaşydan ýa-da düzgünsiz siklden tapawutlandyrmak kyn bolup biler, sebäbi gan akma käwagt meňzeş görünip, güýçlüligi boýunça üýtgäp ýa-da adaty bolmadyk görnüşde dowam edip biler. Bu kynçylygy alymlaryň özleri ykrar edýär, bu bolsa ony kesgitlemegiň birnäçe çemeleşmesiniň näme üçin barlygyny düşündirýär.',
    tip1Title: 'Bilmek peýdaly',
    tip1Text: 'Adaty däl gan akmanyň näme bilen baglanyşyklydygyny derrew bilmezlik adaty zat; bu näbellilik umumy ýagdaý, siziň ýalňyşlygyňyz däl.',
    section3Body: 'Käbir elementler pikirlenmäňize ugur görkezmäge kömek edip biler, umumy düzgünler bolmazdan, sebäbi takyk bellikler hukuk mekdeplerine görä tapawutlanýar.',
    differences: [
      ['calendar-clock-outline', 'Adaty sikliňize garanyňda dowamlylyk'],
      ['repeat-variant', 'Gan akmanyň yzygiderliligi ýa-da adaty däl häsiýeti'],
      ['water-outline', 'Gan akmanyň wagtyň geçmegi bilen nähili üýtgeýşi'],
      ['clipboard-pulse-outline', 'Belli lukmançylyk sebäbiň mümkin barlygy'],
    ],
    note2Title: 'Üns beriň',
    note2Text: 'Bu elementler umumy bellikler, mutlak ölçegler däl: olar alymlar we hukuk mekdepleri tarapyndan dürli düşündirilip bilner.',
    section4Body: 'Gan akmaňyzy birnäçe gün dowamynda howlukman synlamaga wagt bölmek, netije çykarmazdan öň öz ýagdaýyňyzy has gowy düşünmäge kömek edýär.',
    checkList1Title: 'Käbir amaly görkezmeler',
    observeTips: [
      'Başlanýan senäni we mümkin bolsa siklleriňiziň adaty uzynlygyny belläň',
      'Gan akmanyň öňki aýbaşylaryňyza ýakyn nusga eýerýändigini synlaň',
      'Diňe ýeke aýry güne daýanmaň',
      'Alym ýa-da saglyk hünärmeni bilen maslahatlaşmagy meýilleşdirýän bolsaňyz, bu synlamalary ýazyp goýuň',
    ],
    section5Body: 'Istihaza ýagdaýynda namaz we oraza, aýbaşydan tapawutlylykda, adatça borç bolup galýar. Şonda ybadatyň dowam etmegine mümkinçilik bermek üçin arassaçylyk çäreleri (meselem, laýyk goranyş serişdesi) hukuk mekdepleriniň öwredýän usullaryna görä maslahat berilýär.',
    tip2Title: 'Bilmek peýdaly',
    tip2Text: 'Takyk çäreler (meselem, täret almagy täzelemek) eýerilýän hukuk mekdebine görä tapawutlanyp biler; adatça eýerýän pikiriňize ýa-da bilimli alyma ýüz tutmak olary dogry ulanmaga kömek edýär.',
    section6Body: 'Gan akmanyň häsiýeti barada dowamly şübhe umumy ýagdaý, aşa alada üçin sebäp bolmaly däl.',
    doubtSteps: [
      'Öz aýbaşylaryňyzyň adaty dowamlylygyna we ritmine ýüz tutuň',
      'Gan akma adaty däl ýa-da uzak dowam edýän bolsa, saglyk hünärmeni bilen maslahatlaşyň',
      'Dini taýdan bilimli alymdan pikirini soraň',
      'Umumy jogabyň ýagdaýyňyza laýyk ugrukdyrmany çalyşmaýandygyny ýatda saklaň',
    ],
    alert2Title: 'Möhüm maglumat',
    alert2Text: 'Bu mazmun bilim beriji we umumy bolup galýar: ol fatwa ýa-da aýry-aýry dini hökümi düzmeýär. Islendik şahsy ýagdaý üçin, aýratyn-da uzak şübhe ýagdaýynda, bilimli alymyň pikiri esasy çeşme bolup galýar.',
    tip3Title: 'Bilmek peýdaly',
    tip3Text: 'Istihaza adaty däl gan akmany aýbaşydan ýa-da nifasdan tapawutlandyrýan, namaza we oraza aýratyn täsiri bolan düşünje. Şübhe bolanda, üns bilen synlamak we bilimli alymyň pikiri iň gowy çeşmeler bolup galýar.',
    shareMessage: 'Istihazany düşünmek — AWA',
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
