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

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

const ID = 'postpartum-retour-de-couches-freemium';

const HERO = require('../../assets/images/library/featured-cycle.png');

/* -------------------------------------------------------------------------- */
/* DATA — language-neutral (icons/numbers only; text lives in CONTENT below) */
/* -------------------------------------------------------------------------- */

const CYCLE_STAGES_META = [
  {number: '01', icon: 'baby-face-outline'},
  {number: '02', icon: 'clock-outline'},
  {number: '03', icon: 'baby-bottle-outline'},
  {number: '04', icon: 'calendar-month-outline'},
  {number: '05', icon: 'chart-timeline-variant'},
] as const;

const OBSERVATIONS_META = [
  {icon: 'calendar-outline'},
  {icon: 'clock-outline'},
  {icon: 'water-outline'},
] as const;

/* -------------------------------------------------------------------------- */
/* CONTENT — PHASE 7L bilingual editorial content. Article identity (ID,     */
/* images, bookmark/progress keys, JSX structure) is untouched; only this    */
/* object changes per language. The French text below is byte-identical to  */
/* the original — never retyped, only moved into the `fr` key — so the app  */
/* remains fully bilingual rather than having French replaced by English.   */
/* -------------------------------------------------------------------------- */

const CONTENT = {
  fr: {
    badge: 'FREEMIUM • POST-PARTUM',
    title: 'Le retour de couches,\nà quoi s’attendre',
    metaDuration: '5 min de lecture',
    metaType: 'Guide',
    intro: 'Après l’accouchement, le retour des règles peut prendre un certain temps. Le délai varie notamment selon l’allaitement et chaque personne peut vivre cette période différemment.',
    shareMessage: 'Le retour de couches, à quoi s’attendre — AWA',
    h2_1: '1. Qu’est-ce que le retour de couches ?',
    body1: 'Le « retour de couches » désigne le retour des règles après l’accouchement. Le cycle menstruel ne reprend pas forcément immédiatement son rythme habituel.',
    highlightTitle: 'À retenir',
    highlightText: 'Il n’existe pas une date unique valable pour toutes les personnes.',
    h2_2: '2. Quand les règles peuvent-elles revenir ?',
    body2: 'Le délai dépend notamment de l’allaitement. Sans allaitement, le retour peut généralement survenir autour de 6 à 8 semaines. Avec un allaitement exclusif, il peut être retardé de plusieurs mois.',
    simpleInfoTitle1: 'Sans allaitement',
    simpleInfoText1: 'En général autour de 6 à 8 semaines.',
    simpleInfoTitle2: 'Avec allaitement exclusif',
    simpleInfoText2: 'Le retour peut être retardé de plusieurs mois.',
    h2_3: '3. Le schéma du retour du cycle',
    body3: 'Le retour du cycle se fait progressivement après l’accouchement. L’allaitement peut influencer le moment où les règles réapparaissent.',
    schemaTitle: 'Retour progressif du cycle',
    schemaSubtitle: 'Un repère général, étape par étape',
    cycleStages: [
      {title: 'Après l’accouchement', text: 'Le cycle menstruel s’interrompt temporairement après la naissance.'},
      {title: 'Période post-partum', text: 'Le corps récupère progressivement et le rythme hormonal évolue.'},
      {title: 'Allaitement', text: 'L’allaitement peut retarder le retour des règles, mais son effet varie selon chaque personne.'},
      {title: 'Retour des règles', text: 'Les premières règles peuvent revenir après quelques semaines ou plusieurs mois.'},
      {title: 'Premiers cycles', text: 'Les cycles peuvent être irréguliers avant de retrouver progressivement leur rythme habituel.'},
    ],
    schemaNoteText: 'Il n’existe pas de calendrier identique pour tout le monde. Le moment du retour des règles peut varier selon la personne, notamment en fonction de l’allaitement.',
    h2_4: '4. Les premiers cycles',
    body4: 'Lorsque les règles reviennent, les premiers cycles peuvent être différents de ceux d’avant la grossesse. Ils peuvent notamment être irréguliers au début.',
    card1Title: 'Rythme variable',
    card1Text: 'Le cycle peut mettre du temps à retrouver un rythme familier.',
    card2Title: 'Flux différent',
    card2Text: 'Le flux peut être différent de celui observé avant la grossesse.',
    h2_5: '5. Que peux-tu observer ?',
    body5: 'Un suivi simple permet de mieux observer l’évolution du cycle au fil du temps.',
    observations: [
      {title: 'Les dates', text: 'Note le premier jour des règles.'},
      {title: 'Le rythme', text: 'Observe progressivement l’intervalle entre les cycles.'},
      {title: 'Le flux', text: 'Observe simplement les changements par rapport à ton habitude.'},
    ],
    h2_6: '6. Quand demander conseil ?',
    body6: 'Si quelque chose te semble inhabituel, persistant ou préoccupant, demande conseil à un professionnel de santé.',
    warningSigns: [
      'Des saignements qui te semblent inhabituels',
      'Une douleur importante ou persistante',
      'De la fièvre ou un malaise important',
      'Un symptôme nouveau qui t’inquiète',
    ],
    summaryTitle: 'À retenir',
    summaryPoints: [
      'Le retour de couches correspond au retour des règles après l’accouchement.',
      'L’allaitement peut retarder le retour des règles.',
      'Les premiers cycles peuvent être irréguliers.',
      'Noter les dates peut aider à suivre l’évolution du cycle.',
    ],
    disclaimerText: 'Contenu informatif. Les délais peuvent varier selon chaque situation et ne remplacent pas un avis médical.',
  },
  en: {
    badge: 'FREEMIUM • POSTPARTUM',
    title: 'Return of periods after birth,\nwhat to expect',
    metaDuration: '5 min read',
    metaType: 'Guide',
    intro: 'After giving birth, the return of your period can take some time. The timing varies depending on breastfeeding, among other things, and each person may experience this period differently.',
    shareMessage: 'Return of periods after birth, what to expect — AWA',
    h2_1: '1. What is the return of periods after birth?',
    body1: 'The “return of periods” refers to your period coming back after giving birth. The menstrual cycle doesn’t necessarily return to its usual rhythm right away.',
    highlightTitle: 'Key point',
    highlightText: 'There’s no single timeline that applies to everyone.',
    h2_2: '2. When can your period come back?',
    body2: 'The timing largely depends on breastfeeding. Without breastfeeding, your period can generally return around 6 to 8 weeks. With exclusive breastfeeding, it may be delayed by several months.',
    simpleInfoTitle1: 'Without breastfeeding',
    simpleInfoText1: 'Generally around 6 to 8 weeks.',
    simpleInfoTitle2: 'With exclusive breastfeeding',
    simpleInfoText2: 'The return can be delayed by several months.',
    h2_3: '3. The pattern of the cycle’s return',
    body3: 'The cycle returns gradually after giving birth. Breastfeeding can influence when your period reappears.',
    schemaTitle: 'Gradual return of the cycle',
    schemaSubtitle: 'A general guide, step by step',
    cycleStages: [
      {title: 'After giving birth', text: 'The menstrual cycle pauses temporarily after birth.'},
      {title: 'Postpartum period', text: 'The body recovers gradually and hormone levels shift.'},
      {title: 'Breastfeeding', text: 'Breastfeeding may delay the return of your period, but its effect varies from person to person.'},
      {title: 'Return of periods', text: 'Your first period may return after a few weeks or several months.'},
      {title: 'First cycles', text: 'Cycles may be irregular before gradually settling back into their usual rhythm.'},
    ],
    schemaNoteText: 'There’s no identical timeline for everyone. When your period returns can vary from person to person, particularly depending on breastfeeding.',
    h2_4: '4. The first cycles',
    body4: 'When your period returns, the first cycles may differ from those before pregnancy. In particular, they may be irregular at first.',
    card1Title: 'Variable rhythm',
    card1Text: 'The cycle may take time to settle back into a familiar rhythm.',
    card2Title: 'Different flow',
    card2Text: 'The flow may be different from what you observed before pregnancy.',
    h2_5: '5. What can you observe?',
    body5: 'Simple tracking helps you better observe how your cycle evolves over time.',
    observations: [
      {title: 'Dates', text: 'Note the first day of your period.'},
      {title: 'Rhythm', text: 'Gradually observe the interval between cycles.'},
      {title: 'Flow', text: 'Simply observe any changes compared to what’s usual for you.'},
    ],
    h2_6: '6. When should you seek advice?',
    body6: 'If something seems unusual, persistent, or concerning, seek advice from a healthcare professional.',
    warningSigns: [
      'Bleeding that seems unusual to you',
      'Significant or persistent pain',
      'Fever or significant discomfort',
      'Any new symptom that worries you',
    ],
    summaryTitle: 'Key takeaways',
    summaryPoints: [
      'The return of periods after birth refers to your period coming back after giving birth.',
      'Breastfeeding may delay the return of your period.',
      'The first cycles may be irregular.',
      'Noting the dates can help you track how your cycle evolves.',
    ],
    disclaimerText: 'Informational content. Timelines may vary depending on each situation and do not replace medical advice.',
  },
  es: {
    badge: 'FREEMIUM • POSPARTO',
    title: 'El regreso de la regla tras el parto,\nqué esperar',
    metaDuration: '5 min de lectura',
    metaType: 'Guía',
    intro: 'Después del parto, el regreso de la regla puede tardar un tiempo. El plazo varía sobre todo según la lactancia, y cada persona puede vivir este periodo de forma diferente.',
    shareMessage: 'El regreso de la regla tras el parto, qué esperar — AWA',
    h2_1: '1. ¿Qué es el regreso de la regla tras el parto?',
    body1: 'El «regreso de la regla» designa el regreso de las reglas después del parto. El ciclo menstrual no retoma necesariamente de inmediato su ritmo habitual.',
    highlightTitle: 'Para recordar',
    highlightText: 'No existe una fecha única válida para todas las personas.',
    h2_2: '2. ¿Cuándo pueden volver las reglas?',
    body2: 'El plazo depende sobre todo de la lactancia. Sin lactancia, el regreso puede producirse generalmente entre las 6 y las 8 semanas. Con lactancia exclusiva, puede retrasarse varios meses.',
    simpleInfoTitle1: 'Sin lactancia',
    simpleInfoText1: 'Generalmente entre las 6 y las 8 semanas.',
    simpleInfoTitle2: 'Con lactancia exclusiva',
    simpleInfoText2: 'El regreso puede retrasarse varios meses.',
    h2_3: '3. El esquema del regreso del ciclo',
    body3: 'El regreso del ciclo se produce progresivamente después del parto. La lactancia puede influir en el momento en que reaparecen las reglas.',
    schemaTitle: 'Regreso progresivo del ciclo',
    schemaSubtitle: 'Una referencia general, paso a paso',
    cycleStages: [
      {title: 'Después del parto', text: 'El ciclo menstrual se interrumpe temporalmente después del nacimiento.'},
      {title: 'Periodo posparto', text: 'El cuerpo se recupera progresivamente y el ritmo hormonal evoluciona.'},
      {title: 'Lactancia', text: 'La lactancia puede retrasar el regreso de las reglas, pero su efecto varía según cada persona.'},
      {title: 'Regreso de las reglas', text: 'Las primeras reglas pueden volver después de algunas semanas o varios meses.'},
      {title: 'Primeros ciclos', text: 'Los ciclos pueden ser irregulares antes de recuperar progresivamente su ritmo habitual.'},
    ],
    schemaNoteText: 'No existe un calendario idéntico para todo el mundo. El momento del regreso de las reglas puede variar según la persona, especialmente en función de la lactancia.',
    h2_4: '4. Los primeros ciclos',
    body4: 'Cuando vuelven las reglas, los primeros ciclos pueden ser diferentes a los de antes del embarazo. En particular, pueden ser irregulares al principio.',
    card1Title: 'Ritmo variable',
    card1Text: 'El ciclo puede tardar en recuperar un ritmo familiar.',
    card2Title: 'Flujo diferente',
    card2Text: 'El flujo puede ser diferente del observado antes del embarazo.',
    h2_5: '5. ¿Qué puedes observar?',
    body5: 'Un seguimiento simple permite observar mejor la evolución del ciclo a lo largo del tiempo.',
    observations: [
      {title: 'Las fechas', text: 'Anota el primer día de las reglas.'},
      {title: 'El ritmo', text: 'Observa progresivamente el intervalo entre ciclos.'},
      {title: 'El flujo', text: 'Observa simplemente los cambios respecto a lo que es habitual para ti.'},
    ],
    h2_6: '6. ¿Cuándo pedir consejo?',
    body6: 'Si algo te parece inusual, persistente o preocupante, pide consejo a un profesional de la salud.',
    warningSigns: [
      'Un sangrado que te parezca inusual',
      'Un dolor importante o persistente',
      'Fiebre o un malestar importante',
      'Un síntoma nuevo que te preocupe',
    ],
    summaryTitle: 'Para recordar',
    summaryPoints: [
      'El regreso de la regla corresponde al regreso de las reglas después del parto.',
      'La lactancia puede retrasar el regreso de las reglas.',
      'Los primeros ciclos pueden ser irregulares.',
      'Anotar las fechas puede ayudar a seguir la evolución del ciclo.',
    ],
    disclaimerText: 'Contenido informativo. Los plazos pueden variar según cada situación y no sustituyen una opinión médica.',
  },
  it: {
    badge: 'FREEMIUM • POST-PARTUM',
    title: 'Il ritorno del ciclo dopo il parto,\ncosa aspettarsi',
    metaDuration: '5 min di lettura',
    metaType: 'Guida',
    intro: 'Dopo il parto, il ritorno del periodo mestruale può richiedere del tempo. I tempi variano, tra l’altro, in base all’allattamento, e ogni persona può vivere questa fase in modo diverso.',
    shareMessage: 'Il ritorno del ciclo dopo il parto, cosa aspettarsi — AWA',
    h2_1: '1. Cos’è il ritorno del ciclo dopo il parto?',
    body1: 'Il «ritorno del ciclo» indica la ricomparsa del periodo mestruale dopo il parto. Il ciclo mestruale non riprende necessariamente subito il suo ritmo abituale.',
    highlightTitle: 'Punto chiave',
    highlightText: 'Non esiste una tempistica unica valida per tutte.',
    h2_2: '2. Quando può tornare il periodo mestruale?',
    body2: 'I tempi dipendono in gran parte dall’allattamento. Senza allattamento, il periodo mestruale può in genere tornare intorno alle 6-8 settimane. Con l’allattamento esclusivo, può essere ritardato di diversi mesi.',
    simpleInfoTitle1: 'Senza allattamento',
    simpleInfoText1: 'In genere intorno alle 6-8 settimane.',
    simpleInfoTitle2: 'Con allattamento esclusivo',
    simpleInfoText2: 'Il ritorno può essere ritardato di diversi mesi.',
    h2_3: '3. Come ritorna il ciclo',
    body3: 'Il ciclo ritorna gradualmente dopo il parto. L’allattamento può influire sul momento in cui il periodo mestruale ricompare.',
    schemaTitle: 'Ritorno graduale del ciclo',
    schemaSubtitle: 'Una guida generale, passo dopo passo',
    cycleStages: [
      {
        title: 'Dopo il parto',
        text: 'Il ciclo mestruale si interrompe temporaneamente dopo il parto.',
      },
      {
        title: 'Periodo post-partum',
        text: 'Il corpo si riprende gradualmente e i livelli ormonali cambiano.',
      },
      {
        title: 'Allattamento',
        text: 'L’allattamento può ritardare il ritorno del periodo mestruale, ma il suo effetto varia da persona a persona.',
      },
      {
        title: 'Ritorno del ciclo',
        text: 'Il primo periodo mestruale può tornare dopo alcune settimane o diversi mesi.',
      },
      {
        title: 'Primi cicli',
        text: 'I cicli possono essere irregolari prima di ritrovare gradualmente il loro ritmo abituale.',
      },
    ],
    schemaNoteText: 'Non esiste una tempistica identica per tutte. Il momento in cui il periodo mestruale ritorna può variare da persona a persona, in particolare in base all’allattamento.',
    h2_4: '4. I primi cicli',
    body4: 'Quando il periodo mestruale ritorna, i primi cicli possono essere diversi da quelli precedenti alla gravidanza. In particolare, all’inizio possono essere irregolari.',
    card1Title: 'Ritmo variabile',
    card1Text: 'Il ciclo può impiegare del tempo per ritrovare un ritmo familiare.',
    card2Title: 'Flusso diverso',
    card2Text: 'Il flusso può essere diverso da quello che osservavi prima della gravidanza.',
    h2_5: '5. Cosa puoi osservare?',
    body5: 'Un monitoraggio semplice ti aiuta a osservare meglio come evolve il tuo ciclo nel tempo.',
    observations: [
      {
        title: 'Date',
        text: 'Annota il primo giorno del periodo mestruale.',
      },
      {
        title: 'Ritmo',
        text: 'Osserva gradualmente l’intervallo tra i cicli.',
      },
      {
        title: 'Flusso',
        text: 'Osserva semplicemente eventuali cambiamenti rispetto a ciò che è abituale per te.',
      },
    ],
    h2_6: '6. Quando chiedere un parere?',
    body6: 'Se qualcosa ti sembra insolito, persistente o preoccupante, chiedi un parere a un operatore sanitario.',
    warningSigns: [
      'Sanguinamento che ti sembra insolito',
      'Dolore intenso o persistente',
      'Febbre o disagio importante',
      'Qualsiasi nuovo sintomo che ti preoccupa',
    ],
    summaryTitle: 'Punti essenziali',
    summaryPoints: [
      'Il ritorno del ciclo dopo il parto indica la ricomparsa del periodo mestruale dopo il parto.',
      'L’allattamento può ritardare il ritorno del periodo mestruale.',
      'I primi cicli possono essere irregolari.',
      'Annotare le date può aiutarti a seguire l’evoluzione del tuo ciclo.',
    ],
    disclaimerText: 'Contenuto informativo. I tempi possono variare in base a ogni situazione e non sostituiscono il parere medico.',
  },
  tr: {
    badge: 'FREEMIUM • DOĞUM SONRASI',
    title: 'Doğumdan sonra adetin dönüşü,\nneyi beklemeli',
    metaDuration: '5 dk okuma',
    metaType: 'Rehber',
    intro: 'Doğum yaptıktan sonra adetinin geri dönmesi biraz zaman alabilir. Zamanlama, diğer etkenlerin yanı sıra emzirmeye göre değişir ve her kişi bu dönemi farklı yaşayabilir.',
    shareMessage: 'Doğumdan sonra adetin dönüşü, neyi beklemeli — AWA',
    h2_1: '1. Doğumdan sonra adetin dönüşü nedir?',
    body1: '“Adetin dönüşü”, doğum yaptıktan sonra adetinin yeniden başlamasını ifade eder. Adet döngüsü mutlaka hemen olağan ritmine dönmez.',
    highlightTitle: 'Önemli nokta',
    highlightText: 'Herkes için geçerli tek bir zaman çizelgesi yoktur.',
    h2_2: '2. Adetin ne zaman geri gelebilir?',
    body2: 'Zamanlama büyük ölçüde emzirmeye bağlıdır. Emzirmediysen adetin genellikle yaklaşık 6 ila 8 hafta civarında geri dönebilir. Yalnızca anne sütüyle besliyorsan birkaç ay gecikebilir.',
    simpleInfoTitle1: 'Emzirmiyorsan',
    simpleInfoText1: 'Genellikle yaklaşık 6 ila 8 hafta.',
    simpleInfoTitle2: 'Yalnızca anne sütüyle besliyorsan',
    simpleInfoText2: 'Dönüş birkaç ay gecikebilir.',
    h2_3: '3. Döngünün geri dönüş düzeni',
    body3: 'Döngü, doğumdan sonra kademeli olarak geri döner. Emzirme, adetinin yeniden ne zaman başlayacağını etkileyebilir.',
    schemaTitle: 'Döngünün kademeli dönüşü',
    schemaSubtitle: 'Adım adım genel bir rehber',
    cycleStages: [
      {
        title: 'Doğumdan sonra',
        text: 'Adet döngüsü doğumdan sonra geçici olarak durur.',
      },
      {
        title: 'Doğum sonrası dönem',
        text: 'Vücut kademeli olarak toparlanır ve hormon düzeyleri değişir.',
      },
      {
        title: 'Emzirme',
        text: 'Emzirme adetinin dönüşünü geciktirebilir, ancak etkisi kişiden kişiye değişir.',
      },
      {
        title: 'Adetin dönüşü',
        text: 'İlk adetin birkaç hafta ya da birkaç ay sonra geri dönebilir.',
      },
      {
        title: 'İlk döngüler',
        text: 'Döngüler, yavaş yavaş olağan ritmine oturmadan önce düzensiz olabilir.',
      },
    ],
    schemaNoteText: 'Herkes için aynı bir zaman çizelgesi yoktur. Adetinin ne zaman döneceği, özellikle emzirmeye bağlı olarak kişiden kişiye değişebilir.',
    h2_4: '4. İlk döngüler',
    body4: 'Adetin geri döndüğünde ilk döngüler gebelikten önceki döngülerden farklı olabilir. Özellikle başlangıçta düzensiz olabilirler.',
    card1Title: 'Değişken ritim',
    card1Text: 'Döngünün tanıdık bir ritme yeniden oturması zaman alabilir.',
    card2Title: 'Farklı akış',
    card2Text: 'Akış, gebelikten önce gözlemlediğinden farklı olabilir.',
    h2_5: '5. Neleri gözlemleyebilirsin?',
    body5: 'Basit bir takip, döngünün zaman içinde nasıl evrildiğini daha iyi gözlemlemene yardımcı olur.',
    observations: [
      {
        title: 'Tarihler',
        text: 'Adetinin ilk gününü not et.',
      },
      {
        title: 'Ritim',
        text: 'Döngüler arasındaki aralığı zamanla gözlemle.',
      },
      {
        title: 'Akış',
        text: 'Senin için olağan olana kıyasla herhangi bir değişiklik olup olmadığını sadece gözlemle.',
      },
    ],
    h2_6: '6. Ne zaman görüş almalısın?',
    body6: 'Bir şey olağan dışı, geçmeyen ya da endişe verici görünüyorsa bir sağlık profesyonelinden görüş al.',
    warningSigns: [
      'Sana olağan dışı görünen kanama',
      'Belirgin veya geçmeyen ağrı',
      'Ateş veya belirgin rahatsızlık',
      'Seni endişelendiren yeni bir belirti',
    ],
    summaryTitle: 'Önemli noktalar',
    summaryPoints: [
      'Doğumdan sonra adetin dönüşü, doğum yaptıktan sonra adetinin yeniden başlaması anlamına gelir.',
      'Emzirme adetinin dönüşünü geciktirebilir.',
      'İlk döngüler düzensiz olabilir.',
      'Tarihleri not etmek, döngünün nasıl evrildiğini takip etmene yardımcı olabilir.',
    ],
    disclaimerText: 'Bilgilendirme amaçlı içerik. Zaman çizelgeleri her duruma göre değişebilir ve tıbbi tavsiyenin yerini tutmaz.',
  },
  ru: {
    badge: 'FREEMIUM • ПОСЛЕРОДОВОЙ ПЕРИОД',
    title: 'Возвращение месячных после родов:\nчего ожидать',
    metaDuration: '5 мин чтения',
    metaType: 'Руководство',
    intro: 'После родов месячным может потребоваться время, чтобы вернуться. Сроки зависят, среди прочего, от грудного вскармливания, и каждая женщина может переживать этот период по-своему.',
    shareMessage: 'Возвращение месячных после родов: чего ожидать — AWA',
    h2_1: '1. Что такое возвращение месячных после родов?',
    body1: '«Возвращение месячных» означает, что менструация возобновляется после родов. Менструальный цикл не обязательно сразу возвращается к привычному ритму.',
    highlightTitle: 'Главное',
    highlightText: 'Единых сроков, подходящих всем, не существует.',
    h2_2: '2. Когда могут вернуться месячные?',
    body2: 'Сроки во многом зависят от грудного вскармливания. Если вы не кормите грудью, месячные обычно возвращаются примерно через 6–8 недель. При исключительно грудном вскармливании они могут задержаться на несколько месяцев.',
    simpleInfoTitle1: 'Без грудного вскармливания',
    simpleInfoText1: 'Обычно примерно через 6–8 недель.',
    simpleInfoTitle2: 'При исключительно грудном вскармливании',
    simpleInfoText2: 'Возвращение может задержаться на несколько месяцев.',
    h2_3: '3. Как постепенно возвращается цикл',
    body3: 'После родов цикл возвращается постепенно. Грудное вскармливание может влиять на то, когда появятся месячные.',
    schemaTitle: 'Постепенное возвращение цикла',
    schemaSubtitle: 'Общий ориентир, шаг за шагом',
    cycleStages: [
      {title: 'После родов', text: 'После родов менструальный цикл временно приостанавливается.'},
      {title: 'Послеродовой период', text: 'Организм постепенно восстанавливается, а уровень гормонов меняется.'},
      {title: 'Грудное вскармливание', text: 'Грудное вскармливание может отсрочить возвращение месячных, но его влияние у разных женщин различается.'},
      {title: 'Возвращение месячных', text: 'Первые месячные могут вернуться через несколько недель или через несколько месяцев.'},
      {title: 'Первые циклы', text: 'Циклы могут быть нерегулярными, прежде чем постепенно вернуться к привычному ритму.'},
    ],
    schemaNoteText: 'Одинаковых для всех сроков не существует. Когда вернутся месячные, у разных женщин может отличаться, в частности в зависимости от грудного вскармливания.',
    h2_4: '4. Первые циклы',
    body4: 'Когда месячные возвращаются, первые циклы могут отличаться от тех, что были до беременности. В частности, поначалу они могут быть нерегулярными.',
    card1Title: 'Непостоянный ритм',
    card1Text: 'Циклу может потребоваться время, чтобы снова стать привычным по ритму.',
    card2Title: 'Другой характер выделений',
    card2Text: 'Выделения могут отличаться от тех, что вы наблюдали до беременности.',
    h2_5: '5. За чем можно наблюдать?',
    body5: 'Простой учёт помогает лучше видеть, как со временем меняется ваш цикл.',
    observations: [
      {title: 'Даты', text: 'Отмечайте первый день месячных.'},
      {title: 'Ритм', text: 'Постепенно наблюдайте за интервалом между циклами.'},
      {title: 'Выделения', text: 'Просто замечайте любые изменения по сравнению с привычными для вас.'},
    ],
    h2_6: '6. Когда стоит обратиться за советом?',
    body6: 'Если что-то кажется необычным, не проходит или вызывает беспокойство, обратитесь за советом к медицинскому специалисту.',
    warningSigns: [
      'Кровотечение, которое кажется вам необычным',
      'Сильная или не проходящая боль',
      'Повышенная температура или выраженное недомогание',
      'Любой новый симптом, который вас беспокоит',
    ],
    summaryTitle: 'Главное',
    summaryPoints: [
      'Возвращение месячных после родов означает, что менструация возобновляется после родов.',
      'Грудное вскармливание может отсрочить возвращение месячных.',
      'Первые циклы могут быть нерегулярными.',
      'Отмечать даты полезно, чтобы следить за тем, как меняется ваш цикл.',
    ],
    disclaimerText: 'Информационный материал. Сроки могут различаться в зависимости от ситуации и не заменяют консультацию врача.',
  },
  de: {
    badge: 'FREEMIUM • WOCHENBETT',
    title: 'Rückkehr der Periode nach der Geburt –\nwas dich erwartet',
    metaDuration: '5 Min. Lesezeit',
    metaType: 'Ratgeber',
    intro: 'Nach der Geburt kann es etwas dauern, bis deine Periode zurückkehrt. Der Zeitpunkt hängt unter anderem vom Stillen ab, und jede Frau kann diese Zeit anders erleben.',
    shareMessage: 'Rückkehr der Periode nach der Geburt – was dich erwartet — AWA',
    h2_1: '1. Was ist die Rückkehr der Periode nach der Geburt?',
    body1: 'Mit „Rückkehr der Periode“ ist gemeint, dass deine Periode nach der Geburt wieder einsetzt. Der Menstruationszyklus findet nicht unbedingt sofort zu seinem gewohnten Rhythmus zurück.',
    highlightTitle: 'Wichtig',
    highlightText: 'Es gibt keinen einheitlichen Zeitplan, der für alle gilt.',
    h2_2: '2. Wann kann deine Periode zurückkehren?',
    body2: 'Der Zeitpunkt hängt stark vom Stillen ab. Wenn du nicht stillst, kann deine Periode in der Regel nach etwa 6 bis 8 Wochen zurückkehren. Beim ausschließlichen Stillen kann sie sich um mehrere Monate verzögern.',
    simpleInfoTitle1: 'Ohne Stillen',
    simpleInfoText1: 'In der Regel nach etwa 6 bis 8 Wochen.',
    simpleInfoTitle2: 'Mit ausschließlichem Stillen',
    simpleInfoText2: 'Die Rückkehr kann sich um mehrere Monate verzögern.',
    h2_3: '3. Wie der Zyklus zurückkehrt',
    body3: 'Nach der Geburt kehrt der Zyklus schrittweise zurück. Das Stillen kann beeinflussen, wann deine Periode wieder auftritt.',
    schemaTitle: 'Schrittweise Rückkehr des Zyklus',
    schemaSubtitle: 'Eine allgemeine Orientierung, Schritt für Schritt',
    cycleStages: [
      {title: 'Nach der Geburt', text: 'Der Menstruationszyklus pausiert nach der Geburt vorübergehend.'},
      {title: 'Wochenbett', text: 'Der Körper erholt sich allmählich, und die Hormonspiegel verändern sich.'},
      {title: 'Stillen', text: 'Das Stillen kann die Rückkehr deiner Periode verzögern, aber die Wirkung ist von Frau zu Frau verschieden.'},
      {title: 'Rückkehr der Periode', text: 'Deine erste Periode kann nach wenigen Wochen oder erst nach mehreren Monaten zurückkehren.'},
      {title: 'Erste Zyklen', text: 'Die Zyklen können zunächst unregelmäßig sein, bevor sie sich nach und nach wieder in ihren gewohnten Rhythmus einpendeln.'},
    ],
    schemaNoteText: 'Es gibt keinen Zeitplan, der für alle gleich ist. Wann deine Periode zurückkehrt, kann von Frau zu Frau verschieden sein, insbesondere je nachdem, ob du stillst.',
    h2_4: '4. Die ersten Zyklen',
    body4: 'Wenn deine Periode zurückkehrt, können die ersten Zyklen anders sein als vor der Schwangerschaft. Vor allem können sie anfangs unregelmäßig sein.',
    card1Title: 'Wechselnder Rhythmus',
    card1Text: 'Es kann dauern, bis sich der Zyklus wieder in einen vertrauten Rhythmus einpendelt.',
    card2Title: 'Andere Blutung',
    card2Text: 'Die Blutung kann anders sein als das, was du vor der Schwangerschaft beobachtet hast.',
    h2_5: '5. Was kannst du beobachten?',
    body5: 'Ein einfaches Tracking hilft dir, besser zu beobachten, wie sich dein Zyklus im Laufe der Zeit entwickelt.',
    observations: [
      {title: 'Daten', text: 'Notiere den ersten Tag deiner Periode.'},
      {title: 'Rhythmus', text: 'Beobachte nach und nach den Abstand zwischen den Zyklen.'},
      {title: 'Blutung', text: 'Achte einfach auf Veränderungen im Vergleich zu dem, was für dich üblich ist.'},
    ],
    h2_6: '6. Wann solltest du dich beraten lassen?',
    body6: 'Wenn dir etwas ungewöhnlich, anhaltend oder besorgniserregend vorkommt, lass dich von medizinischem Fachpersonal beraten.',
    warningSigns: [
      'Blutungen, die dir ungewöhnlich vorkommen',
      'Starke oder anhaltende Schmerzen',
      'Fieber oder deutliches Unwohlsein',
      'Jedes neue Symptom, das dich beunruhigt',
    ],
    summaryTitle: 'Das Wichtigste in Kürze',
    summaryPoints: [
      'Mit der Rückkehr der Periode nach der Geburt ist gemeint, dass deine Periode nach der Geburt wieder einsetzt.',
      'Das Stillen kann die Rückkehr deiner Periode verzögern.',
      'Die ersten Zyklen können unregelmäßig sein.',
      'Das Notieren der Daten kann dir helfen, zu verfolgen, wie sich dein Zyklus entwickelt.',
    ],
    disclaimerText: 'Informationsinhalt. Zeitangaben können je nach Situation variieren und ersetzen keine ärztliche Beratung.',
  },
  zh: {
      badge: '免费 • 产后',
      title: '产后月经恢复，\n你可以期待什么',
      metaDuration: '阅读约 5 分钟',
      metaType: '指南',
      intro: '生完宝宝后，月经恢复可能需要一些时间。恢复的时间会受到母乳喂养等因素影响，每个人的经历也可能不同。',
      shareMessage: '产后月经恢复，你可以期待什么 — AWA',
      h2_1: '1. 什么是产后月经恢复？',
      body1: '“月经恢复”是指分娩后月经重新来潮。月经周期不一定会马上回到原来的节律。',
      highlightTitle: '关键一点',
      highlightText: '并没有一个适用于所有人的统一时间表。',
      h2_2: '2. 月经什么时候会回来？',
      body2: '时间在很大程度上取决于母乳喂养。不进行母乳喂养时，月经通常在大约 6 到 8 周后恢复。纯母乳喂养时，可能会推迟数月。',
      simpleInfoTitle1: '不进行母乳喂养',
      simpleInfoText1: '通常在大约 6 到 8 周。',
      simpleInfoTitle2: '纯母乳喂养',
      simpleInfoText2: '月经恢复可能推迟数月。',
      h2_3: '3. 周期恢复的过程',
      body3: '分娩后，月经周期会逐渐恢复。母乳喂养可能影响月经重新出现的时间。',
      schemaTitle: '周期逐步恢复',
      schemaSubtitle: '一个循序渐进的大致参考',
      cycleStages: [
        {
          title: '分娩后',
          text: '分娩后，月经周期会暂时停止。',
        },
        {
          title: '产后阶段',
          text: '身体逐渐恢复，激素水平也在变化。',
        },
        {
          title: '母乳喂养',
          text: '母乳喂养可能推迟月经的恢复，但影响因人而异。',
        },
        {
          title: '月经恢复',
          text: '第一次月经可能在几周后或数月后恢复。',
        },
        {
          title: '最初的几个周期',
          text: '周期一开始可能不规律，之后逐渐回到原来的节律。',
        },
      ],
      schemaNoteText: '并没有人人相同的时间表。月经何时恢复因人而异，尤其与母乳喂养有关。',
      h2_4: '4. 最初的几个周期',
      body4: '月经恢复后，最初的几个周期可能与孕前不同。尤其是一开始可能不规律。',
      card1Title: '节律不固定',
      card1Text: '周期可能需要一些时间，才能回到熟悉的节律。',
      card2Title: '经量不同',
      card2Text: '经量可能与孕前观察到的不一样。',
      h2_5: '5. 你可以观察什么？',
      body5: '简单的记录可以帮你更好地观察周期随时间的变化。',
      observations: [
        {
          title: '日期',
          text: '记下月经的第一天。',
        },
        {
          title: '节律',
          text: '逐步留意两次周期之间的间隔。',
        },
        {
          title: '经量',
          text: '留意与你平时相比有什么变化即可。',
        },
      ],
      h2_6: '6. 什么时候应该寻求建议？',
      body6: '如果有什么让你觉得异常、持续或令人担心，请向医疗专业人员咨询。',
      warningSigns: [
        '你觉得异常的出血',
        '明显或持续的疼痛',
        '发热或明显不适',
        '任何让你担心的新症状',
      ],
      summaryTitle: '要点回顾',
      summaryPoints: [
        '产后月经恢复，是指分娩后月经重新来潮。',
        '母乳喂养可能推迟月经的恢复。',
        '最初的几个周期可能不规律。',
        '记下日期，有助于你了解周期的变化。',
      ],
      disclaimerText: '仅供参考。具体时间可能因个人情况而异，不能替代医疗建议。',
    },
  id: {
    badge: 'FREEMIUM • PASCAPERSALINAN',
    title: 'Kembalinya haid setelah melahirkan,\napa yang bisa diharapkan',
    metaDuration: '5 menit baca',
    metaType: 'Panduan',
    intro: 'Setelah melahirkan, haid bisa butuh waktu untuk kembali. Waktunya bervariasi, antara lain bergantung pada menyusui, dan setiap orang bisa mengalami masa ini dengan cara yang berbeda.',
    shareMessage: 'Kembalinya haid setelah melahirkan, apa yang bisa diharapkan — AWA',
    h2_1: '1. Apa itu kembalinya haid setelah melahirkan?',
    body1: '“Kembalinya haid” berarti haidmu datang lagi setelah melahirkan. Siklus menstruasi belum tentu langsung kembali ke ritme biasanya.',
    highlightTitle: 'Poin utama',
    highlightText: 'Tidak ada satu jadwal yang berlaku untuk semua orang.',
    h2_2: '2. Kapan haidmu bisa kembali?',
    body2: 'Waktunya sangat bergantung pada menyusui. Tanpa menyusui, haid umumnya dapat kembali sekitar 6 sampai 8 minggu. Dengan menyusui eksklusif, haid bisa tertunda beberapa bulan.',
    simpleInfoTitle1: 'Tanpa menyusui',
    simpleInfoText1: 'Umumnya sekitar 6 sampai 8 minggu.',
    simpleInfoTitle2: 'Dengan menyusui eksklusif',
    simpleInfoText2: 'Kembalinya haid bisa tertunda beberapa bulan.',
    h2_3: '3. Pola kembalinya siklus',
    body3: 'Siklus kembali secara bertahap setelah melahirkan. Menyusui dapat memengaruhi kapan haidmu muncul lagi.',
    schemaTitle: 'Kembalinya siklus secara bertahap',
    schemaSubtitle: 'Gambaran umum, langkah demi langkah',
    cycleStages: [
      {
        title: 'Setelah melahirkan',
        text: 'Siklus menstruasi berhenti sementara setelah persalinan.',
      },
      {
        title: 'Masa pascapersalinan',
        text: 'Tubuh pulih secara bertahap dan kadar hormon bergeser.',
      },
      {
        title: 'Menyusui',
        text: 'Menyusui dapat menunda kembalinya haidmu, tetapi pengaruhnya berbeda-beda pada setiap orang.',
      },
      {
        title: 'Kembalinya haid',
        text: 'Haid pertamamu bisa kembali setelah beberapa minggu atau beberapa bulan.',
      },
      {
        title: 'Siklus-siklus pertama',
        text: 'Siklus bisa tidak teratur sebelum berangsur kembali ke ritme biasanya.',
      },
    ],
    schemaNoteText: 'Tidak ada jadwal yang sama untuk semua orang. Waktu kembalinya haidmu bisa berbeda dari satu orang ke orang lain, terutama bergantung pada menyusui.',
    h2_4: '4. Siklus-siklus pertama',
    body4: 'Saat haidmu kembali, siklus-siklus pertama mungkin berbeda dari sebelum hamil. Misalnya, pada awalnya siklus bisa tidak teratur.',
    card1Title: 'Ritme yang bervariasi',
    card1Text: 'Siklus mungkin butuh waktu untuk kembali ke ritme yang dikenal.',
    card2Title: 'Aliran yang berbeda',
    card2Text: 'Aliran darah haid bisa berbeda dari yang kamu amati sebelum hamil.',
    h2_5: '5. Apa yang bisa kamu amati?',
    body5: 'Pencatatan sederhana membantumu mengamati perkembangan siklusmu dari waktu ke waktu.',
    observations: [
      {
        title: 'Tanggal',
        text: 'Catat hari pertama haidmu.',
      },
      {
        title: 'Ritme',
        text: 'Amati jarak antarsiklus secara bertahap.',
      },
      {
        title: 'Aliran',
        text: 'Cukup amati perubahan dibandingkan dengan yang biasa kamu alami.',
      },
    ],
    h2_6: '6. Kapan sebaiknya meminta saran?',
    body6: 'Jika ada yang terasa tidak biasa, berlangsung terus-menerus, atau mengkhawatirkan, mintalah saran dari tenaga kesehatan.',
    warningSigns: [
      'Perdarahan yang terasa tidak biasa bagimu',
      'Nyeri hebat atau terus-menerus',
      'Demam atau rasa tidak nyaman yang hebat',
      'Gejala baru apa pun yang membuatmu khawatir',
    ],
    summaryTitle: 'Poin penting',
    summaryPoints: [
      'Kembalinya haid setelah melahirkan berarti haidmu datang lagi setelah persalinan.',
      'Menyusui dapat menunda kembalinya haidmu.',
      'Siklus-siklus pertama bisa tidak teratur.',
      'Mencatat tanggal dapat membantumu memantau perkembangan siklusmu.',
    ],
    disclaimerText: 'Konten informatif. Jadwal dapat bervariasi tergantung pada tiap situasi dan tidak menggantikan saran medis.',
  },
  hi: {
    badge: 'फ़्रीमियम • प्रसवोत्तर',
    title: 'प्रसव के बाद पीरियड की वापसी,\nक्या उम्मीद रखें',
    metaDuration: '5 मिनट में पढ़ें',
    metaType: 'गाइड',
    intro: 'बच्चे को जन्म देने के बाद पीरियड लौटने में कुछ समय लग सकता है। यह समय कई बातों पर, ख़ासकर स्तनपान पर, निर्भर करता है और हर महिला का अनुभव अलग हो सकता है।',
    shareMessage: 'प्रसव के बाद पीरियड की वापसी, क्या उम्मीद रखें — AWA',
    h2_1: '1. प्रसव के बाद पीरियड की वापसी क्या है?',
    body1: '“पीरियड की वापसी” का मतलब है बच्चे को जन्म देने के बाद आपके पीरियड का फिर से शुरू होना। मासिक चक्र ज़रूरी नहीं कि तुरंत अपनी पुरानी लय में लौट आए।',
    highlightTitle: 'ज़रूरी बात',
    highlightText: 'ऐसी कोई एक समय-सीमा नहीं है जो सब पर लागू हो।',
    h2_2: '2. आपका पीरियड कब लौट सकता है?',
    body2: 'समय काफ़ी हद तक स्तनपान पर निर्भर करता है। स्तनपान न कराने पर पीरियड आम तौर पर लगभग 6 से 8 हफ़्तों में लौट सकता है। केवल स्तनपान कराने पर इसमें कई महीनों की देरी हो सकती है।',
    simpleInfoTitle1: 'स्तनपान न कराने पर',
    simpleInfoText1: 'आम तौर पर लगभग 6 से 8 हफ़्तों में।',
    simpleInfoTitle2: 'केवल स्तनपान कराने पर',
    simpleInfoText2: 'वापसी में कई महीनों की देरी हो सकती है।',
    h2_3: '3. चक्र के लौटने का क्रम',
    body3: 'प्रसव के बाद चक्र धीरे-धीरे लौटता है। स्तनपान इस बात को प्रभावित कर सकता है कि पीरियड कब दोबारा आएगा।',
    schemaTitle: 'चक्र की धीरे-धीरे वापसी',
    schemaSubtitle: 'एक सामान्य गाइड, कदम-दर-कदम',
    cycleStages: [
      {
        title: 'प्रसव के बाद',
        text: 'जन्म के बाद मासिक चक्र कुछ समय के लिए रुक जाता है।',
      },
      {
        title: 'प्रसवोत्तर समय',
        text: 'शरीर धीरे-धीरे ठीक होता है और हॉर्मोन का स्तर बदलता है।',
      },
      {
        title: 'स्तनपान',
        text: 'स्तनपान पीरियड की वापसी में देरी कर सकता है, लेकिन इसका असर हर महिला में अलग होता है।',
      },
      {
        title: 'पीरियड की वापसी',
        text: 'आपका पहला पीरियड कुछ हफ़्तों या कई महीनों के बाद लौट सकता है।',
      },
      {
        title: 'शुरुआती चक्र',
        text: 'चक्र शुरू में अनियमित हो सकते हैं और फिर धीरे-धीरे अपनी सामान्य लय में आ सकते हैं।',
      },
    ],
    schemaNoteText: 'सबके लिए एक जैसी समय-सीमा नहीं होती। पीरियड कब लौटेगा, यह हर महिला में अलग हो सकता है, ख़ासकर स्तनपान के अनुसार।',
    h2_4: '4. शुरुआती चक्र',
    body4: 'पीरियड लौटने पर शुरुआती चक्र गर्भावस्था से पहले के चक्रों से अलग हो सकते हैं। ख़ास तौर पर, शुरू में वे अनियमित हो सकते हैं।',
    card1Title: 'बदलती लय',
    card1Text: 'चक्र को अपनी जानी-पहचानी लय में लौटने में समय लग सकता है।',
    card2Title: 'अलग फ़्लो',
    card2Text: 'फ़्लो वैसा न हो जैसा आपने गर्भावस्था से पहले देखा था।',
    h2_5: '5. आप क्या देख सकती हैं?',
    body5: 'सरल ट्रैकिंग से आप समय के साथ अपने चक्र में आने वाले बदलावों को बेहतर ढंग से देख पाती हैं।',
    observations: [
      {
        title: 'तारीख़ें',
        text: 'अपने पीरियड का पहला दिन नोट करें।',
      },
      {
        title: 'लय',
        text: 'धीरे-धीरे दो चक्रों के बीच के अंतर पर ध्यान दें।',
      },
      {
        title: 'फ़्लो',
        text: 'अपने सामान्य फ़्लो की तुलना में कोई बदलाव हो, तो उसे बस देखती रहें।',
      },
    ],
    h2_6: '6. सलाह कब लेनी चाहिए?',
    body6: 'अगर कुछ असामान्य, लगातार बना रहने वाला या चिंताजनक लगे, तो किसी स्वास्थ्य विशेषज्ञ से सलाह लें।',
    warningSigns: [
      'ऐसा रक्तस्राव जो आपको असामान्य लगे',
      'तेज़ या लगातार बना रहने वाला दर्द',
      'बुखार या काफ़ी बेचैनी',
      'कोई भी नया लक्षण जो आपको चिंतित करे',
    ],
    summaryTitle: 'मुख्य बातें',
    summaryPoints: [
      'प्रसव के बाद पीरियड की वापसी का मतलब है बच्चे को जन्म देने के बाद पीरियड का फिर से शुरू होना।',
      'स्तनपान पीरियड की वापसी में देरी कर सकता है।',
      'शुरुआती चक्र अनियमित हो सकते हैं।',
      'तारीख़ें नोट करने से आप अपने चक्र में आ रहे बदलावों पर नज़र रख सकती हैं।',
    ],
    disclaimerText: 'जानकारी के लिए सामग्री। समय-सीमाएँ हर स्थिति में अलग हो सकती हैं और चिकित्सकीय सलाह का विकल्प नहीं हैं।',
  },
  sq: {
    badge: 'FREEMIUM • PAS LINDJES',
    title: 'Rikthimi i menstruacioneve pas lindjes,\nçfarë të presësh',
    metaDuration: '5 min lexim',
    metaType: 'Udhëzues',
    intro: 'Pas lindjes, rikthimi i menstruacioneve mund të marrë kohë. Koha ndryshon ndër të tjera sipas ushqyerjes me gji dhe çdo person mund ta përjetojë këtë periudhë ndryshe.',
    shareMessage: 'Rikthimi i menstruacioneve pas lindjes, çfarë të presësh — AWA',
    h2_1: '1. Çfarë është rikthimi i menstruacioneve pas lindjes?',
    body1: '“Rikthimi i menstruacioneve” nënkupton kthimin e menstruacioneve pas lindjes. Cikli menstrual nuk kthehet domosdoshmërisht menjëherë në ritmin e zakonshëm.',
    highlightTitle: 'Pika kryesore',
    highlightText: 'Nuk ka një afat të vetëm që vlen për të gjitha.',
    h2_2: '2. Kur mund të kthehen menstruacionet?',
    body2: 'Koha varet kryesisht nga ushqyerja me gji. Pa ushqyerje me gji, menstruacionet mund të kthehen përgjithësisht rreth 6 deri në 8 javë. Me ushqyerje ekskluzive me gji, kthimi mund të vonohet disa muaj.',
    simpleInfoTitle1: 'Pa ushqyerje me gji',
    simpleInfoText1: 'Përgjithësisht rreth 6 deri në 8 javë.',
    simpleInfoTitle2: 'Me ushqyerje ekskluzive me gji',
    simpleInfoText2: 'Kthimi mund të vonohet disa muaj.',
    h2_3: '3. Skema e rikthimit të ciklit',
    body3: 'Cikli kthehet gradualisht pas lindjes. Ushqyerja me gji mund të ndikojë te koha kur shfaqen sërish menstruacionet.',
    schemaTitle: 'Rikthimi gradual i ciklit',
    schemaSubtitle: 'Një udhëzues i përgjithshëm, hap pas hapi',
    cycleStages: [
      {
        title: 'Pas lindjes',
        text: 'Cikli menstrual ndalon përkohësisht pas lindjes.',
      },
      {
        title: 'Periudha pas lindjes',
        text: 'Trupi rimëkëmbet gradualisht dhe nivelet e hormoneve ndryshojnë.',
      },
      {
        title: 'Ushqyerja me gji',
        text: 'Ushqyerja me gji mund ta vonojë rikthimin e menstruacioneve, por efekti i saj ndryshon nga një person te tjetri.',
      },
      {
        title: 'Rikthimi i menstruacioneve',
        text: 'Menstruacionet e para mund të kthehen pas disa javësh ose disa muajsh.',
      },
      {
        title: 'Ciklet e para',
        text: 'Ciklet mund të jenë të parregullta përpara se të rikthehen gradualisht në ritmin e zakonshëm.',
      },
    ],
    schemaNoteText: 'Nuk ka një afat identik për të gjitha. Koha e rikthimit të menstruacioneve mund të ndryshojë nga një person te tjetri, veçanërisht sipas ushqyerjes me gji.',
    h2_4: '4. Ciklet e para',
    body4: 'Kur kthehen menstruacionet, ciklet e para mund të ndryshojnë nga ato para shtatzënisë. Në veçanti, në fillim mund të jenë të parregullta.',
    card1Title: 'Ritëm i ndryshueshëm',
    card1Text: 'Cikli mund të ketë nevojë për kohë që të rikthehet në një ritëm të njohur.',
    card2Title: 'Rrjedhje e ndryshme',
    card2Text: 'Rrjedhja e gjakut mund të jetë ndryshe nga ajo që vëzhgoje para shtatzënisë.',
    h2_5: '5. Çfarë mund të vëzhgosh?',
    body5: 'Një ndjekje e thjeshtë të ndihmon ta vëzhgosh më mirë si evoluon cikli yt me kalimin e kohës.',
    observations: [
      {
        title: 'Datat',
        text: 'Shëno ditën e parë të menstruacioneve.',
      },
      {
        title: 'Ritmi',
        text: 'Vëzhgo gradualisht intervalin mes cikleve.',
      },
      {
        title: 'Rrjedhja',
        text: 'Thjesht vëzhgo çdo ndryshim krahasuar me atë që është e zakonshme për ty.',
      },
    ],
    h2_6: '6. Kur duhet të kërkosh këshillë?',
    body6: 'Nëse diçka duket e pazakontë, e vazhdueshme ose shqetësuese, kërko këshillë nga një profesionist i shëndetësisë.',
    warningSigns: [
      'Gjakderdhje që të duket e pazakontë',
      'Dhimbje e fortë ose e vazhdueshme',
      'Ethe ose shqetësim i madh',
      'Çdo simptomë e re që të shqetëson',
    ],
    summaryTitle: 'Çfarë të mbash mend',
    summaryPoints: [
      'Rikthimi i menstruacioneve pas lindjes nënkupton kthimin e menstruacioneve pas lindjes.',
      'Ushqyerja me gji mund ta vonojë rikthimin e menstruacioneve.',
      'Ciklet e para mund të jenë të parregullta.',
      'Shënimi i datave mund të të ndihmojë të ndjekësh si evoluon cikli yt.',
    ],
    disclaimerText: 'Përmbajtje informuese. Afatet mund të ndryshojnë sipas çdo situate dhe nuk zëvendësojnë këshillën mjekësore.',
  },
  ja: {
    badge: 'フリーミアム • 産後',
    title: '産後の生理の再開、\n知っておきたいこと',
    metaDuration: '読了目安5分',
    metaType: 'ガイド',
    intro: '出産後、生理が戻るまでには時間がかかることがあります。時期は授乳の状況などによって異なり、感じ方も人それぞれです。',
    shareMessage: '産後の生理の再開、知っておきたいこと — AWA',
    h2_1: '1. 産後の生理の再開とは？',
    body1: '「生理の再開」とは、出産後に生理が戻ってくることをいいます。生理周期がすぐに以前のリズムに戻るとは限りません。',
    highlightTitle: 'ポイント',
    highlightText: 'すべての人に当てはまる、ひとつの時期というものはありません。',
    h2_2: '2. 生理はいつ戻る？',
    body2: '時期は主に授乳の状況によって変わります。授乳をしていない場合、一般的に生理は6〜8週間ごろに戻ることがあります。完全母乳の場合は、数か月遅れることがあります。',
    simpleInfoTitle1: '授乳をしていない場合',
    simpleInfoText1: '一般的に6〜8週間ごろです。',
    simpleInfoTitle2: '完全母乳の場合',
    simpleInfoText2: '再開が数か月遅れることがあります。',
    h2_3: '3. 周期が戻っていく流れ',
    body3: '周期は出産後、少しずつ戻っていきます。授乳は、生理が再開する時期に影響することがあります。',
    schemaTitle: '周期が少しずつ戻っていく流れ',
    schemaSubtitle: 'ステップごとに見る、一般的な目安',
    cycleStages: [
      {
        title: '出産後',
        text: '出産後、生理周期は一時的に止まります。',
      },
      {
        title: '産後の時期',
        text: '体は少しずつ回復し、ホルモンの状態も移り変わります。',
      },
      {
        title: '授乳',
        text: '授乳によって生理の再開が遅れることがありますが、その影響には個人差があります。',
      },
      {
        title: '生理の再開',
        text: '最初の生理は、数週間後に戻ることもあれば、数か月後になることもあります。',
      },
      {
        title: '最初の数回の周期',
        text: '周期は最初のうち不規則なことがあり、その後少しずつ以前のリズムに落ち着いていきます。',
      },
    ],
    schemaNoteText: '全員に同じ時期というものはありません。生理が戻る時期は人によって異なり、特に授乳の状況によって変わります。',
    h2_4: '4. 最初の数回の周期',
    body4: '生理が戻ったとき、最初の数回の周期は妊娠前とは違うことがあります。特に、最初のうちは不規則になることがあります。',
    card1Title: 'リズムの変化',
    card1Text: '周期が、なじみのあるリズムに落ち着くまでに時間がかかることがあります。',
    card2Title: '経血量の違い',
    card2Text: '経血量が、妊娠前に見ていたものとは違うことがあります。',
    h2_5: '5. 何を観察できる？',
    body5: '簡単な記録をつけると、周期が時間とともにどう変化していくかを観察しやすくなります。',
    observations: [
      {
        title: '日付',
        text: '生理の初日を記録します。',
      },
      {
        title: 'リズム',
        text: '周期と周期の間隔を、少しずつ観察していきます。',
      },
      {
        title: '経血量',
        text: 'いつもの状態と比べて変化がないか、ただ見ておきます。',
      },
    ],
    h2_6: '6. 相談したほうがよいのはどんなとき？',
    body6: 'いつもと違う、続いている、気になると感じることがあれば、医療従事者に相談してください。',
    warningSigns: [
      'いつもと違うと感じる出血',
      '強い痛み、または続く痛み',
      '発熱や、強い不調',
      '気になる新しい症状',
    ],
    summaryTitle: '重要なポイント',
    summaryPoints: [
      '産後の生理の再開とは、出産後に生理が戻ってくることをいいます。',
      '授乳によって、生理の再開が遅れることがあります。',
      '最初の数回の周期は不規則なことがあります。',
      '日付を記録しておくと、周期の変化を追いやすくなります。',
    ],
    disclaimerText: '情報提供を目的とした内容です。時期は状況によって異なることがあり、医師のアドバイスに代わるものではありません。',
  },
} as const;

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ArticleReader'
>;

/* -------------------------------------------------------------------------- */
/* SCREEN                                                                     */
/* -------------------------------------------------------------------------- */

export default function PostpartumPeriodReturnFreemiumArticleScreen({
  navigation,
}: Props): React.JSX.Element {
  const {t, i18n} = useTranslation();
  const lang = resolveEditorialLanguage(i18n.language);
  const content = CONTENT[lang];
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [saved, setSaved] = useState(false);

  /* ------------------------------------------------------------------------ */
  /* BOOKMARK                                                                 */
  /* ------------------------------------------------------------------------ */

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

  /* ------------------------------------------------------------------------ */
  /* SHARE                                                                    */
  /* ------------------------------------------------------------------------ */

  const handleShare = async () => {
    try {
      await Share.share({
        message: content.shareMessage,
      });
    } catch {
      // Share cancelled or unavailable.
    }
  };

  /* ------------------------------------------------------------------------ */
  /* RENDER                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <View style={styles.screen}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={theme.statusBarStyle}
      />

      <ScrollView
        ref={scrollRef}
        onScroll={event => {
          saveScrollPosition(
            ID,
            event.nativeEvent.contentOffset.y,
          );
        }}
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
        ]}
      >
        {/* ================================================================== */}
        {/* HERO                                                               */}
        {/* ================================================================== */}

        <View style={styles.heroWrap}>
          <Image
            source={HERO}
            resizeMode="cover"
            style={styles.hero}
          />

          <View
            style={[
              styles.top,
              {
                paddingTop: getTopPadding(
                  insets.top,
                  true,
                ),
              },
            ]}
          >
            {/* BACK */}
            <AwaIconButton
              accessibilityLabel={t('library.reader.back')}
              icon="chevron-left"
              iconSize={23}
              onPress={() => navigation.goBack()}
              variant="tonal"
            />

            {/* ACTIONS */}
            <View style={styles.actions}>
              <AwaIconButton
                accessibilityLabel={
                  saved ? t('library.screen.removeBookmark') : t('library.screen.addBookmark')
                }
                icon={
                    saved
                      ? 'bookmark'
                      : 'bookmark-outline'
                  }
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

        {/* ================================================================== */}
        {/* ARTICLE                                                            */}
        {/* ================================================================== */}

        <View style={styles.article}>

          {/* ---------------------------------------------------------------- */}
          {/* BADGE                                                            */}
          {/* ---------------------------------------------------------------- */}

          <View style={styles.badge}>
            <AwaText variant="labelSmall" emphasized colorRole="primary">
              {content.badge}
            </AwaText>
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* TITLE                                                            */}
          {/* ---------------------------------------------------------------- */}

          <AwaText variant="headlineMedium" weight="700" style={styles.title}>
            {content.title}
          </AwaText>

          {/* ---------------------------------------------------------------- */}
          {/* METADATA                                                         */}
          {/* ---------------------------------------------------------------- */}

          <View style={styles.metas}>
            <View style={styles.metaItem}>
              <MaterialDesignIcons
                name="clock-outline"
                size={16}
                color={theme.colors.textMuted}
              />

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant">
                {content.metaDuration}
              </AwaText>
            </View>

            <View style={styles.metaDivider} />

            <View style={styles.metaItem}>
              <MaterialDesignIcons
                name="book-open-page-variant-outline"
                size={16}
                color={theme.colors.textMuted}
              />

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant">
                {content.metaType}
              </AwaText>
            </View>
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* INTRODUCTION                                                     */}
          {/* ---------------------------------------------------------------- */}

          <AwaText variant="titleSmall" colorRole="onSurfaceVariant" style={styles.intro}>
            {content.intro}
          </AwaText>

          {/* ================================================================= */}
          {/* SECTION 1                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            {content.h2_1}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body1}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.highlight}>
            <MaterialDesignIcons
              name="information-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.highlightCopy}>
              <AwaText variant="titleSmall" emphasized>
                {content.highlightTitle}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.highlightText}>
                {content.highlightText}
              </AwaText>
            </View>
          </AwaCard>

          {/* ================================================================= */}
          {/* SECTION 2                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            {content.h2_2}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body2}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.simpleInfo}>

            <View style={styles.simpleInfoRow}>
              <MaterialDesignIcons
                name="calendar-clock-outline"
                size={23}
                color={theme.colors.primary}
              />

              <View style={styles.simpleInfoCopy}>
                <AwaText variant="titleSmall" emphasized>
                  {content.simpleInfoTitle1}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.simpleInfoText}>
                  {content.simpleInfoText1}
                </AwaText>
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.simpleInfoRow}>
              <MaterialDesignIcons
                name="baby-bottle-outline"
                size={23}
                color={theme.colors.primary}
              />

              <View style={styles.simpleInfoCopy}>
                <AwaText variant="titleSmall" emphasized>
                  {content.simpleInfoTitle2}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.simpleInfoText}>
                  {content.simpleInfoText2}
                </AwaText>
              </View>
            </View>

          </AwaCard>

          {/* ================================================================= */}
          {/* SECTION 3 — SCHEMA                                                */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            {content.h2_3}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body3}
          </AwaText>

          {/* TIMELINE CARD */}

          <AwaCard variant="filled" padding="none" style={styles.schemaCard}>

            {/* HEADER */}

            <View style={styles.schemaHeader}>
              <View style={styles.schemaHeaderIcon}>
                <MaterialDesignIcons
                  name="chart-timeline-variant"
                  size={23}
                  color={theme.colors.primary}
                />
              </View>

              <View style={styles.schemaHeaderCopy}>
                <AwaText variant="titleSmall" emphasized>
                  {content.schemaTitle}
                </AwaText>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.schemaSubtitle}>
                  {content.schemaSubtitle}
                </AwaText>
              </View>
            </View>

            {/* TIMELINE */}

            <View style={styles.timeline}>
              {CYCLE_STAGES_META.map((meta, index) => {
                const isLast =
                  index === CYCLE_STAGES_META.length - 1;
                const stage = content.cycleStages[index];

                return (
                  <View
                    key={meta.number}
                    style={styles.timelineItem}
                  >

                    {/* TIMELINE LEFT */}

                    <View style={styles.timelineLeft}>

                      <View style={styles.timelineNode}>
                        <AwaText variant="labelSmall" emphasized colorRole="primary">
                          {meta.number}
                        </AwaText>
                      </View>

                      {!isLast && (
                        <View style={styles.timelineLine} />
                      )}
                    </View>

                    {/* TIMELINE CONTENT */}

                    <View style={styles.timelineContent}>

                      <View style={styles.timelineTitleRow}>
                        <MaterialDesignIcons
                          name={meta.icon as never}
                          size={17}
                          color={theme.colors.primary}
                        />

                        <AwaText variant="titleSmall" emphasized style={styles.timelineTitle}>
                          {stage.title}
                        </AwaText>
                      </View>

                      <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.timelineText}>
                        {stage.text}
                      </AwaText>

                    </View>
                  </View>
                );
              })}
            </View>

            {/* NOTE */}

            <View style={styles.schemaNote}>
              <MaterialDesignIcons
                name="information-outline"
                size={18}
                color={theme.colors.primary}
              />

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.schemaNoteText}>
                {content.schemaNoteText}
              </AwaText>
            </View>

          </AwaCard>

          {/* ================================================================= */}
          {/* SECTION 4                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            {content.h2_4}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body4}
          </AwaText>

          <View style={styles.cards}>

            <AwaCard variant="filled" padding="none" style={styles.smallCard}>
              <View style={styles.cardIcon}>
                <MaterialDesignIcons
                  name="calendar-alert-outline"
                  size={21}
                  color={theme.colors.primary}
                />
              </View>

              <AwaText variant="titleSmall" emphasized style={styles.cardTitle}>
                {content.card1Title}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.cardText}>
                {content.card1Text}
              </AwaText>
            </AwaCard>

            <AwaCard variant="filled" padding="none" style={styles.smallCard}>
              <View style={styles.cardIcon}>
                <MaterialDesignIcons
                  name="water-outline"
                  size={21}
                  color={theme.colors.primary}
                />
              </View>

              <AwaText variant="titleSmall" emphasized style={styles.cardTitle}>
                {content.card2Title}
              </AwaText>

              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.cardText}>
                {content.card2Text}
              </AwaText>
            </AwaCard>

          </View>

          {/* ================================================================= */}
          {/* SECTION 5                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            {content.h2_5}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body5}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.observationCard}>
            {OBSERVATIONS_META.map((meta, index) => {
              const observation = content.observations[index];

              return (
                <View
                  key={observation.title}
                  style={styles.observationRow}
                >
                  <View style={styles.observationIcon}>
                    <MaterialDesignIcons
                      name={meta.icon as never}
                      size={19}
                      color={theme.colors.primary}
                    />
                  </View>

                  <View style={styles.observationCopy}>
                    <AwaText variant="titleSmall" emphasized>
                      {observation.title}
                    </AwaText>

                    <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.observationText}>
                      {observation.text}
                    </AwaText>
                  </View>
                </View>
              );
            })}
          </AwaCard>

          {/* ================================================================= */}
          {/* SECTION 6                                                         */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            {content.h2_6}
          </AwaText>

          <AwaText variant="bodyMedium" colorRole="onSurfaceVariant" style={styles.body}>
            {content.body6}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.warningCard}>
            {content.warningSigns.map(item => (
              <View
                key={item}
                style={styles.warningRow}
              >
                <MaterialDesignIcons
                  name="alert-circle-outline"
                  size={18}
                  color={theme.colors.warning}
                />

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.warningText}>
                  {item}
                </AwaText>
              </View>
            ))}
          </AwaCard>

          {/* ================================================================= */}
          {/* SUMMARY                                                           */}
          {/* ================================================================= */}

          <AwaText variant="titleLarge" emphasized style={styles.h2}>
            {content.summaryTitle}
          </AwaText>

          <AwaCard variant="filled" padding="none" style={styles.summaryCard}>
            {content.summaryPoints.map(item => (
              <View
                key={item}
                style={styles.summaryRow}
              >
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.summaryText}>
                  {item}
                </AwaText>
              </View>
            ))}
          </AwaCard>

          {/* ================================================================= */}
          {/* DISCLAIMER                                                        */}
          {/* ================================================================= */}

          <View style={styles.disclaimer}>
            <MaterialDesignIcons
              name="shield-outline"
              size={18}
              color={theme.colors.textMuted}
            />

            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.disclaimerText}>
              {content.disclaimerText}
            </AwaText>
          </View>

        </View>
      </ScrollView>

      {/* ==================================================================== */}
      {/* READING CONTROLS                                                     */}
      {/* ==================================================================== */}

      <ReadingControls
        articleId={ID}
        durationMinutes={5}
        scrollRef={scrollRef}
      />
    </View>
  );
}

/* ========================================================================== */
/* STYLES                                                                      */
/* ========================================================================== */

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  /* ------------------------------------------------------------------------ */
  /* SCREEN                                                                   */
  /* ------------------------------------------------------------------------ */

  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  scroll: {
    paddingBottom: 32,
  },

  /* ------------------------------------------------------------------------ */
  /* HERO                                                                     */
  /* ------------------------------------------------------------------------ */

  heroWrap: {
    height: 235,
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



  /* ------------------------------------------------------------------------ */
  /* ARTICLE                                                                  */
  /* ------------------------------------------------------------------------ */

  article: {
    marginTop: -16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
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

  /* ------------------------------------------------------------------------ */
  /* METADATA                                                                 */
  /* ------------------------------------------------------------------------ */

  metas: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  metaDivider: {
    width: 1,
    height: 18,
    backgroundColor: theme.colors.border,
  },


  /* ------------------------------------------------------------------------ */
  /* INTRO                                                                    */
  /* ------------------------------------------------------------------------ */

  intro: {
    marginTop: 16,
  },

  /* ------------------------------------------------------------------------ */
  /* HEADINGS & BODY                                                          */
  /* ------------------------------------------------------------------------ */

  h2: {
    marginTop: 28,
  },

  body: {
    marginTop: 8,
  },

  /* ------------------------------------------------------------------------ */
  /* HIGHLIGHT                                                                */
  /* ------------------------------------------------------------------------ */

  highlight: {
    marginTop: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  highlightCopy: {
    flex: 1,
    marginLeft: 8,
  },


  highlightText: {
    marginTop: 3,
  },

  /* ------------------------------------------------------------------------ */
  /* SIMPLE INFO                                                              */
  /* ------------------------------------------------------------------------ */

  simpleInfo: {
    marginTop: 16,
    padding: 16,
  },

  simpleInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  simpleInfoCopy: {
    flex: 1,
    marginLeft: 12,
  },


  simpleInfoText: {
    marginTop: 3,
  },

  separator: {
    height: 1,
    marginVertical: 12,
    backgroundColor: theme.colors.border,
  },

  /* ------------------------------------------------------------------------ */
  /* CYCLE SCHEMA                                                             */
  /* ------------------------------------------------------------------------ */

  schemaCard: {
    marginTop: 16,
    padding: 16,
  },

  schemaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },

  schemaHeaderIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  schemaHeaderCopy: {
    flex: 1,
    marginLeft: 12,
  },


  schemaSubtitle: {
    marginTop: 3,
  },

  /* ------------------------------------------------------------------------ */
  /* TIMELINE                                                                 */
  /* ------------------------------------------------------------------------ */

  timeline: {
    marginTop: 8,
  },

  timelineItem: {
    flexDirection: 'row',
    minHeight: 88,
  },

  timelineLeft: {
    width: 44,
    alignItems: 'center',
    position: 'relative',
  },

  timelineNode: {
    width: 34,
    height: 34,
    marginTop: 16,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    zIndex: 2,
  },


  timelineLine: {
    position: 'absolute',
    top: 48,
    bottom: 0,
    width: 1.5,
    backgroundColor: theme.colors.border,
  },

  timelineContent: {
    flex: 1,
    paddingTop: 12,
    paddingLeft: 12,
    paddingBottom: 12,
  },

  timelineTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  timelineTitle: {
    flex: 1,
  },

  timelineText: {
    marginTop: 4,
  },

  /* ------------------------------------------------------------------------ */
  /* SCHEMA NOTE                                                              */
  /* ------------------------------------------------------------------------ */

  schemaNote: {
    marginTop: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  schemaNoteText: {
    flex: 1,
    marginLeft: 8,
  },

  /* ------------------------------------------------------------------------ */
  /* SMALL CARDS                                                              */
  /* ------------------------------------------------------------------------ */

  cards: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },

  smallCard: {
    flex: 1,
    minHeight: 135,
    padding: 12,
  },

  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  cardTitle: {
    marginTop: 8,
  },

  cardText: {
    marginTop: 4,
  },

  /* ------------------------------------------------------------------------ */
  /* OBSERVATION CARD                                                         */
  /* ------------------------------------------------------------------------ */

  observationCard: {
    marginTop: 12,
    padding: 16,
  },

  observationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  observationIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  observationCopy: {
    flex: 1,
    marginLeft: 8,
  },


  observationText: {
    marginTop: 2,
  },

  /* ------------------------------------------------------------------------ */
  /* WARNING CARD                                                             */
  /* ------------------------------------------------------------------------ */

  warningCard: {
    marginTop: 12,
    padding: 12,
  },

  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },

  warningText: {
    flex: 1,
  },

  /* ------------------------------------------------------------------------ */
  /* SUMMARY                                                                  */
  /* ------------------------------------------------------------------------ */

  summaryCard: {
    marginTop: 12,
    padding: 16,
  },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },

  summaryText: {
    flex: 1,
  },

  /* ------------------------------------------------------------------------ */
  /* DISCLAIMER                                                               */
  /* ------------------------------------------------------------------------ */

  disclaimer: {
    marginTop: 20,
    paddingHorizontal: 3,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },

  disclaimerText: {
    flex: 1,
  },
  });
}
