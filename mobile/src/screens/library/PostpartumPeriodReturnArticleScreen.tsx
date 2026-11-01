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

const CONTENT = withBrazilianPortuguese('PostpartumPeriodReturn', {
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
  ko: {
    badge: 'FREEMIUM • 산후',
    title: '출산 후 생리 재개,\n어떻게 될까요',
    metaDuration: '읽는 데 5분',
    metaType: '가이드',
    intro: '출산 후 생리가 다시 시작되기까지는 시간이 걸릴 수 있어요. 시기는 특히 모유 수유 여부에 따라 달라지고, 사람마다 이 시기를 다르게 겪을 수 있어요.',
    shareMessage: '출산 후 생리 재개, 어떻게 될까요 — AWA',
    h2_1: '1. 출산 후 생리 재개란?',
    body1: '“생리 재개”는 출산 후 생리가 다시 시작되는 것을 말해요. 생리 주기가 반드시 바로 평소의 리듬으로 돌아오는 것은 아니에요.',
    highlightTitle: '핵심',
    highlightText: '모든 사람에게 똑같이 적용되는 시기는 없어요.',
    h2_2: '2. 생리는 언제 다시 시작할 수 있나요?',
    body2: '시기는 주로 모유 수유 여부에 따라 달라져요. 모유 수유를 하지 않으면 보통 6~8주쯤에 생리가 다시 시작될 수 있어요. 완전 모유 수유를 하면 몇 달 늦어질 수 있어요.',
    simpleInfoTitle1: '모유 수유를 하지 않을 때',
    simpleInfoText1: '보통 6~8주쯤이에요.',
    simpleInfoTitle2: '완전 모유 수유를 할 때',
    simpleInfoText2: '재개가 몇 달 늦어질 수 있어요.',
    h2_3: '3. 주기가 돌아오는 과정',
    body3: '출산 후 주기는 조금씩 돌아와요. 모유 수유는 생리가 다시 시작되는 시기에 영향을 줄 수 있어요.',
    schemaTitle: '주기가 조금씩 돌아오는 과정',
    schemaSubtitle: '단계별로 보는 일반적인 안내',
    cycleStages: [
      {
        title: '출산 직후',
        text: '출산 후에는 생리 주기가 일시적으로 멈춰요.',
      },
      {
        title: '산후 기간',
        text: '몸이 조금씩 회복되고 호르몬 수치가 달라져요.',
      },
      {
        title: '모유 수유',
        text: '모유 수유는 생리가 다시 시작되는 것을 늦출 수 있지만, 그 영향은 사람마다 달라요.',
      },
      {
        title: '생리 재개',
        text: '첫 생리는 몇 주 뒤에 다시 시작할 수도, 몇 달 뒤에 시작할 수도 있어요.',
      },
      {
        title: '첫 주기들',
        text: '주기가 불규칙할 수 있고, 이후 조금씩 평소의 리듬으로 자리 잡아요.',
      },
    ],
    schemaNoteText: '모든 사람에게 똑같은 시기는 없어요. 생리가 다시 시작되는 시기는 특히 모유 수유 여부에 따라 사람마다 달라질 수 있어요.',
    h2_4: '4. 첫 주기들',
    body4: '생리가 다시 시작되면 첫 주기들은 임신 전과 다를 수 있어요. 특히 처음에는 불규칙할 수 있어요.',
    card1Title: '달라지는 리듬',
    card1Text: '주기가 익숙한 리듬으로 자리 잡기까지 시간이 걸릴 수 있어요.',
    card2Title: '달라진 출혈량',
    card2Text: '출혈량이 임신 전에 보던 것과 다를 수 있어요.',
    h2_5: '5. 무엇을 관찰할 수 있나요?',
    body5: '간단히 기록해 두면 시간이 지나면서 주기가 어떻게 달라지는지 더 잘 살펴볼 수 있어요.',
    observations: [
      {
        title: '날짜',
        text: '생리 첫째 날을 기록해요.',
      },
      {
        title: '리듬',
        text: '주기 사이의 간격을 조금씩 살펴봐요.',
      },
      {
        title: '출혈량',
        text: '평소와 비교해 달라진 점이 있는지 가볍게 살펴봐요.',
      },
    ],
    h2_6: '6. 언제 조언을 구해야 할까요?',
    body6: '평소와 다르거나, 계속되거나, 걱정되는 점이 있으면 의료 전문가에게 조언을 구하세요.',
    warningSigns: [
      '평소와 다르다고 느껴지는 출혈',
      '심하거나 계속되는 통증',
      '열이 나거나 몸이 많이 불편함',
      '걱정되는 새로운 증상',
    ],
    summaryTitle: '핵심 정리',
    summaryPoints: [
      '출산 후 생리 재개는 출산 후 생리가 다시 시작되는 것을 말해요.',
      '모유 수유는 생리가 다시 시작되는 것을 늦출 수 있어요.',
      '첫 주기들은 불규칙할 수 있어요.',
      '날짜를 기록해 두면 주기가 어떻게 달라지는지 살펴보는 데 도움이 될 수 있어요.',
    ],
    disclaimerText: '정보 제공용 콘텐츠예요. 시기는 상황에 따라 다를 수 있으며 의학적 조언을 대신하지 않아요.',
  },
  'pt-PT': {
    badge: 'FREEMIUM • PÓS-PARTO',
    title: 'Regresso do período após o parto,\no que esperar',
    metaDuration: '5 min de leitura',
    metaType: 'Guia',
    intro: 'Depois do parto, o regresso do período pode demorar algum tempo. O momento varia, entre outros fatores, consoante a amamentação, e cada pessoa pode viver esta fase de forma diferente.',
    shareMessage: 'Regresso do período após o parto, o que esperar — AWA',
    h2_1: '1. O que é o regresso do período após o parto?',
    body1: 'O “regresso do período” designa o reaparecimento da menstruação depois do parto. O ciclo menstrual não retoma necessariamente o seu ritmo habitual de imediato.',
    highlightTitle: 'Ponto essencial',
    highlightText: 'Não existe um calendário único que se aplique a todas as pessoas.',
    h2_2: '2. Quando pode o período regressar?',
    body2: 'O momento depende em grande parte da amamentação. Sem amamentação, o período pode regressar, em geral, por volta das 6 a 8 semanas. Com amamentação exclusiva, pode atrasar-se vários meses.',
    simpleInfoTitle1: 'Sem amamentação',
    simpleInfoText1: 'Geralmente por volta das 6 a 8 semanas.',
    simpleInfoTitle2: 'Com amamentação exclusiva',
    simpleInfoText2: 'O regresso pode atrasar-se vários meses.',
    h2_3: '3. O esquema do regresso do ciclo',
    body3: 'O ciclo regressa de forma gradual depois do parto. A amamentação pode influenciar o momento em que o período reaparece.',
    schemaTitle: 'Regresso gradual do ciclo',
    schemaSubtitle: 'Um guia geral, passo a passo',
    cycleStages: [
      {
        title: 'Após o parto',
        text: 'O ciclo menstrual faz uma pausa temporária depois do parto.',
      },
      {
        title: 'Período pós-parto',
        text: 'O corpo recupera gradualmente e os níveis hormonais alteram-se.',
      },
      {
        title: 'Amamentação',
        text: 'A amamentação pode atrasar o regresso do período, mas o seu efeito varia de pessoa para pessoa.',
      },
      {
        title: 'Regresso do período',
        text: 'O primeiro período pode regressar após algumas semanas ou vários meses.',
      },
      {
        title: 'Primeiros ciclos',
        text: 'Os ciclos podem ser irregulares antes de retomarem gradualmente o seu ritmo habitual.',
      },
    ],
    schemaNoteText: 'Não existe um calendário idêntico para todas. O momento em que o período regressa pode variar de pessoa para pessoa, em particular consoante a amamentação.',
    h2_4: '4. Os primeiros ciclos',
    body4: 'Quando o período regressa, os primeiros ciclos podem ser diferentes dos anteriores à gravidez. Em particular, podem ser irregulares no início.',
    card1Title: 'Ritmo variável',
    card1Text: 'O ciclo pode demorar algum tempo a retomar um ritmo familiar.',
    card2Title: 'Fluxo diferente',
    card2Text: 'O fluxo pode ser diferente do que observava antes da gravidez.',
    h2_5: '5. O que pode observar?',
    body5: 'Um acompanhamento simples ajuda a observar melhor a evolução do seu ciclo ao longo do tempo.',
    observations: [
      {
        title: 'Datas',
        text: 'Anote o primeiro dia do seu período.',
      },
      {
        title: 'Ritmo',
        text: 'Observe gradualmente o intervalo entre os ciclos.',
      },
      {
        title: 'Fluxo',
        text: 'Observe simplesmente as alterações em relação ao que é habitual para si.',
      },
    ],
    h2_6: '6. Quando deve procurar aconselhamento?',
    body6: 'Se algo lhe parecer invulgar, persistente ou preocupante, procure o aconselhamento de um profissional de saúde.',
    warningSigns: [
      'Uma hemorragia que lhe pareça invulgar',
      'Dor significativa ou persistente',
      'Febre ou mal-estar significativo',
      'Qualquer sintoma novo que a preocupe',
    ],
    summaryTitle: 'Pontos essenciais',
    summaryPoints: [
      'O regresso do período após o parto designa o reaparecimento da menstruação depois de dar à luz.',
      'A amamentação pode atrasar o regresso do período.',
      'Os primeiros ciclos podem ser irregulares.',
      'Anotar as datas pode ajudar a acompanhar a evolução do seu ciclo.',
    ],
    disclaimerText: 'Conteúdo informativo. Os prazos podem variar consoante cada situação e não substituem o aconselhamento médico.',
  },
  bn: {
    badge: 'ফ্রিমিয়াম • প্রসবোত্তর',
    title: 'প্রসবের পর মাসিক ফিরে আসা,\nকী আশা করবেন',
    metaDuration: 'পড়তে 5 মিনিট',
    metaType: 'গাইড',
    intro: 'সন্তান জন্ম দেওয়ার পর আপনার মাসিক ফিরতে কিছু সময় লাগতে পারে। সময়টি অন্যান্য বিষয়ের পাশাপাশি বুকের দুধ খাওয়ানোর ওপর নির্ভর করে এবং প্রত্যেকে এই সময়টি আলাদাভাবে অনুভব করতে পারেন।',
    shareMessage: 'প্রসবের পর মাসিক ফিরে আসা, কী আশা করবেন — AWA',
    h2_1: '1. প্রসবের পর মাসিক ফিরে আসা কী?',
    body1: '“মাসিক ফিরে আসা” বলতে সন্তান জন্ম দেওয়ার পর আপনার মাসিক আবার শুরু হওয়াকে বোঝায়। মাসিক চক্র যে সঙ্গে সঙ্গে আগের ছন্দে ফিরে আসবে এমন নয়।',
    highlightTitle: 'মূল কথা',
    highlightText: 'এমন কোনো একক সময়সীমা নেই যা সবার জন্য প্রযোজ্য।',
    h2_2: '2. আপনার মাসিক কখন ফিরতে পারে?',
    body2: 'সময়টি মূলত বুকের দুধ খাওয়ানোর ওপর নির্ভর করে। বুকের দুধ না খাওয়ালে সাধারণত প্রায় 6 থেকে 8 সপ্তাহের মধ্যে মাসিক ফিরতে পারে। শুধু বুকের দুধ খাওয়ালে তা কয়েক মাস পর্যন্ত পিছিয়ে যেতে পারে।',
    simpleInfoTitle1: 'বুকের দুধ না খাওয়ালে',
    simpleInfoText1: 'সাধারণত প্রায় 6 থেকে 8 সপ্তাহে।',
    simpleInfoTitle2: 'শুধু বুকের দুধ খাওয়ালে',
    simpleInfoText2: 'ফিরে আসতে কয়েক মাস দেরি হতে পারে।',
    h2_3: '3. চক্র ফিরে আসার ধরন',
    body3: 'সন্তান জন্মের পর চক্র ধীরে ধীরে ফিরে আসে। বুকের দুধ খাওয়ানো মাসিক আবার কখন দেখা দেবে তা প্রভাবিত করতে পারে।',
    schemaTitle: 'চক্রের ধীরে ধীরে ফিরে আসা',
    schemaSubtitle: 'ধাপে ধাপে একটি সাধারণ নির্দেশিকা',
    cycleStages: [
      {
        title: 'সন্তান জন্মের পর',
        text: 'প্রসবের পর মাসিক চক্র সাময়িকভাবে থেমে থাকে।',
      },
      {
        title: 'প্রসবোত্তর সময়',
        text: 'শরীর ধীরে ধীরে সুস্থ হয় এবং হরমোনের মাত্রা বদলায়।',
      },
      {
        title: 'বুকের দুধ খাওয়ানো',
        text: 'বুকের দুধ খাওয়ানো মাসিক ফিরে আসা পিছিয়ে দিতে পারে, তবে এর প্রভাব একেক জনের একেক রকম।',
      },
      {
        title: 'মাসিক ফিরে আসা',
        text: 'আপনার প্রথম মাসিক কয়েক সপ্তাহ বা কয়েক মাস পরে ফিরতে পারে।',
      },
      {
        title: 'প্রথম কয়েকটি চক্র',
        text: 'ধীরে ধীরে স্বাভাবিক ছন্দে ফেরার আগে চক্র অনিয়মিত হতে পারে।',
      },
    ],
    schemaNoteText: 'সবার জন্য অভিন্ন কোনো সময়সীমা নেই। মাসিক কখন ফিরবে তা একেক জনের একেক রকম হতে পারে, বিশেষ করে বুকের দুধ খাওয়ানোর ওপর নির্ভর করে।',
    h2_4: '4. প্রথম কয়েকটি চক্র',
    body4: 'মাসিক ফিরে এলে প্রথম কয়েকটি চক্র গর্ভধারণের আগের চক্র থেকে আলাদা হতে পারে। বিশেষ করে শুরুতে সেগুলো অনিয়মিত হতে পারে।',
    card1Title: 'পরিবর্তনশীল ছন্দ',
    card1Text: 'চক্রের পরিচিত ছন্দে ফিরতে সময় লাগতে পারে।',
    card2Title: 'ভিন্ন রক্তক্ষরণ',
    card2Text: 'রক্তক্ষরণ গর্ভধারণের আগে আপনি যা লক্ষ করেছিলেন তার থেকে আলাদা হতে পারে।',
    h2_5: '5. আপনি কী লক্ষ করতে পারেন?',
    body5: 'সহজ ট্র্যাকিং আপনার চক্র সময়ের সঙ্গে কীভাবে বদলাচ্ছে তা ভালোভাবে লক্ষ করতে সাহায্য করে।',
    observations: [
      {
        title: 'তারিখ',
        text: 'আপনার মাসিকের প্রথম দিনটি লিখে রাখুন।',
      },
      {
        title: 'ছন্দ',
        text: 'ধীরে ধীরে এক চক্র থেকে আরেক চক্রের মধ্যবর্তী ব্যবধান লক্ষ করুন।',
      },
      {
        title: 'রক্তক্ষরণ',
        text: 'আপনার জন্য যা স্বাভাবিক তার তুলনায় কোনো পরিবর্তন হলে শুধু তা লক্ষ করুন।',
      },
    ],
    h2_6: '6. কখন পরামর্শ নেবেন?',
    body6: 'কিছু অস্বাভাবিক, দীর্ঘস্থায়ী বা দুশ্চিন্তার মনে হলে স্বাস্থ্যসেবা পেশাজীবীর পরামর্শ নিন।',
    warningSigns: [
      'আপনার কাছে অস্বাভাবিক মনে হওয়া রক্তক্ষরণ',
      'তীব্র বা দীর্ঘস্থায়ী ব্যথা',
      'জ্বর বা উল্লেখযোগ্য অস্বস্তি',
      'নতুন কোনো উপসর্গ যা আপনাকে চিন্তিত করে',
    ],
    summaryTitle: 'মূল কথা',
    summaryPoints: [
      'প্রসবের পর মাসিক ফিরে আসা বলতে সন্তান জন্ম দেওয়ার পর আপনার মাসিক আবার শুরু হওয়াকে বোঝায়।',
      'বুকের দুধ খাওয়ানো মাসিক ফিরে আসা পিছিয়ে দিতে পারে।',
      'প্রথম কয়েকটি চক্র অনিয়মিত হতে পারে।',
      'তারিখ লিখে রাখলে আপনার চক্র কীভাবে বদলাচ্ছে তা অনুসরণ করতে সাহায্য হতে পারে।',
    ],
    disclaimerText: 'তথ্যমূলক বিষয়বস্তু। সময়সীমা প্রতিটি পরিস্থিতি অনুযায়ী ভিন্ন হতে পারে এবং এটি চিকিৎসা পরামর্শের বিকল্প নয়।',
  },
  da: {
    badge: 'Freemium • Efterfødsel',
    title: 'Menstruationens tilbagevenden\nefter fødslen – hvad du kan forvente',
    metaDuration: '5 minutters læsning',
    metaType: 'Guide',
    intro: 'Efter at have født kan det tage noget tid, før din menstruation vender tilbage. Tidspunktet afhænger bl.a. af, om du ammer, og alle oplever denne periode forskelligt.',
    shareMessage: 'Menstruationens tilbagevenden efter fødslen – hvad du kan forvente — AWA',
    h2_1: '1. Hvad er menstruationens tilbagevenden efter fødslen?',
    body1: '"Menstruationens tilbagevenden" henviser til, at din menstruation starter igen efter, at du har født. Din cyklus vender ikke nødvendigvis tilbage til sin tidligere rytme med det samme.',
    highlightTitle: 'Vigtigt at vide',
    highlightText: 'Der er ingen enkelt tidsramme, der gælder for alle.',
    h2_2: '2. Hvornår kan din menstruation vende tilbage?',
    body2: 'Tidspunktet afhænger primært af, om du ammer. Hvis du ikke ammer, kan menstruationen typisk vende tilbage inden for ca. 6 til 8 uger. Hvis du ammer fuldt ud, kan det blive forsinket i flere måneder.',
    simpleInfoTitle1: 'Hvis du ikke ammer',
    simpleInfoText1: 'Typisk inden for ca. 6 til 8 uger.',
    simpleInfoTitle2: 'Hvis du ammer fuldt ud',
    simpleInfoText2: 'Tilbagevenden kan blive forsinket i flere måneder.',
    h2_3: '3. Hvordan cyklussen vender gradvist tilbage',
    body3: 'Efter fødslen vender cyklussen gradvist tilbage. Amning kan påvirke, hvornår menstruationen viser sig igen.',
    schemaTitle: 'Cyklussens gradvise tilbagevenden',
    schemaSubtitle: 'En generel vejledning trin for trin',
    cycleStages: [
      {
        title: 'Efter fødslen',
        text: 'Menstruationscyklussen er midlertidigt sat på pause efter fødslen.',
      },
      {
        title: 'Efterfødselsperioden',
        text: 'Kroppen restituerer gradvist, og hormonniveauerne ændrer sig.',
      },
      {
        title: 'Amning',
        text: 'Amning kan forsinke menstruationens tilbagevenden, men effekten varierer fra person til person.',
      },
      {
        title: 'Menstruationens tilbagevenden',
        text: 'Din første menstruation kan vende tilbage efter nogle uger eller måneder.',
      },
      {
        title: 'De første cyklusser',
        text: 'Cyklussen kan være uregelmæssig, inden den gradvist finder sin normale rytme.',
      },
    ],
    schemaNoteText: 'Der er ingen ensartet tidsramme for alle. Hvornår menstruationen vender tilbage, varierer fra person til person, særligt afhængigt af amning.',
    h2_4: '4. De første cyklusser',
    body4: 'Når menstruationen vender tilbage, kan de første cyklusser adskille sig fra dem, du kendte før graviditeten. De kan særligt i starten være uregelmæssige.',
    card1Title: 'Variabel rytme',
    card1Text: 'Det kan tage tid at vende tilbage til en velkendt cyklusrytme.',
    card2Title: 'Anderledes blødning',
    card2Text: 'Blødningen kan adskille sig fra det, du oplevede før graviditeten.',
    h2_5: '5. Hvad kan du bemærke?',
    body5: 'En enkel form for sporing kan hjælpe dig med at følge, hvordan din cyklus ændrer sig over tid.',
    observations: [
      {
        title: 'Dato',
        text: 'Notér den første dag af din menstruation.',
      },
      {
        title: 'Rytme',
        text: 'Læg gradvist mærke til intervallet fra en cyklus til den næste.',
      },
      {
        title: 'Blødning',
        text: 'Notér blot eventuelle ændringer sammenlignet med, hvad der er normalt for dig.',
      },
    ],
    h2_6: '6. Hvornår bør du søge råd?',
    body6: 'Søg råd hos en sundhedsprofessionel, hvis noget virker usædvanligt, vedvarende eller bekymrende.',
    warningSigns: [
      'Blødning der virker unormal for dig',
      'Stærke eller vedvarende smerter',
      'Feber eller betydeligt ubehag',
      'Nye symptomer der bekymrer dig',
    ],
    summaryTitle: 'Vigtigt at huske',
    summaryPoints: [
      'Menstruationens tilbagevenden efter fødslen betyder, at din menstruation starter igen.',
      'Amning kan forsinke menstruationens tilbagevenden.',
      'De første cyklusser kan være uregelmæssige.',
      'At notere datoer kan hjælpe dig med at følge, hvordan din cyklus ændrer sig.',
    ],
    disclaimerText: 'Informativt indhold. Tidsrammer kan variere afhængigt af den enkelte situation og erstatter ikke medicinsk rådgivning.',
  },
  sv: {
    badge: 'Freemium • Efterfödsel',
    title: 'Menstruationens tilbagevenden\nefter födslen – hvad du kan forvente',
    metaDuration: '5 minutters läsning',
    metaType: 'Guide',
    intro: 'Efter at have födt kan det tage noget tid, för din menstruation vender tilbage. Tidspunktet afhänger bl.a. av, om du ammer, och alla oplever denne periode forskelligt.',
    shareMessage: 'Menstruationens tilbagevenden efter födslen – hvad du kan forvente — AWA',
    h2_1: '1. Hvad ar menstruationens tilbagevenden efter födslen?',
    body1: '"Menstruationens tilbagevenden" henviser till, at din menstruation starter igen efter, at du har födt. Din cyklus vender inte nödvendigvis tilbage till sin tidligere rytme med det samme.',
    highlightTitle: 'Vigtigt at vide',
    highlightText: 'Der ar ingen enkelt tidsramme, der gälder for alle.',
    h2_2: '2. Hvornår kan din menstruation vende tilbage?',
    body2: 'Tidspunktet afhänger primärt av, om du ammer. Hvis du inte ammer, kan menstruationen typisk vende tilbage inden for ca. 6 till 8 veckor. Hvis du ammer fuldt ud, kan det blive forsinket i flere måneder.',
    simpleInfoTitle1: 'Hvis du inte ammer',
    simpleInfoText1: 'Typisk inden for ca. 6 till 8 veckor.',
    simpleInfoTitle2: 'Hvis du ammer fuldt ud',
    simpleInfoText2: 'Tilbagevenden kan blive forsinket i flere måneder.',
    h2_3: '3. Hvordan cyklussen vender gradvist tilbage',
    body3: 'Efter födslen vender cyklussen gradvist tilbage. Amning kan påvirke, hvornår menstruationen viser sig igen.',
    schemaTitle: 'Cyklussens gradvise tilbagevenden',
    schemaSubtitle: 'En generel vejledning trin for trin',
    cycleStages: [
      {
        title: 'Efter födslen',
        text: 'Menstruationscyklussen ar midlertidigt sat på pause efter födslen.',
      },
      {
        title: 'Efterfödselsperioden',
        text: 'Kroppen restituerer gradvist, och hormonniveauerne ändrer sig.',
      },
      {
        title: 'Amning',
        text: 'Amning kan forsinke menstruationens tilbagevenden, men effekten varierer fran person till person.',
      },
      {
        title: 'Menstruationens tilbagevenden',
        text: 'Din förste menstruation kan vende tilbage efter nogle veckor eller måneder.',
      },
      {
        title: 'De förste cyklusser',
        text: 'Cyklussen kan väre uregelmässig, inden den gradvist finder sin normale rytme.',
      },
    ],
    schemaNoteText: 'Der ar ingen ensartet tidsramme for alle. Hvornår menstruationen vender tilbage, varierer fran person till person, särligt afhängigt av amning.',
    h2_4: '4. De förste cyklusser',
    body4: 'Når menstruationen vender tilbage, kan de förste cyklusser adskille sig fran dem, du kendte för graviditeten. De kan särligt i starten väre uregelmässige.',
    card1Title: 'Variabel rytme',
    card1Text: 'Det kan tage tid at vende tilbage till en velkendt cyklusrytme.',
    card2Title: 'Anderledes blödning',
    card2Text: 'Blödningen kan adskille sig fran det, du oplevede för graviditeten.',
    h2_5: '5. Hvad kan du bemärke?',
    body5: 'En enkel form for sporing kan hjälpe dig med at fölge, hvordan din cyklus ändrer sig over tid.',
    observations: [
      {
        title: 'Dato',
        text: 'Notér den förste dag av din menstruation.',
      },
      {
        title: 'Rytme',
        text: 'Läg gradvist märke till intervallet fran en cyklus till den näste.',
      },
      {
        title: 'Blödning',
        text: 'Notér blot eventuelle ändringer sammenlignet med, hvad der ar normalt for dig.',
      },
    ],
    h2_6: '6. Hvornår bör du söge råd?',
    body6: 'Sög råd hos en halsasprofessionel, hvis noget virker usädvanligt, vedvarende eller bekymrende.',
    warningSigns: [
      'Blödning der virker unormal for dig',
      'Stärke eller vedvarende smerter',
      'Feber eller betydeligt ubehag',
      'Nye symtom der bekymrer dig',
    ],
    summaryTitle: 'Vigtigt at huske',
    summaryPoints: [
      'Menstruationens tilbagevenden efter födslen betyder, at din menstruation starter igen.',
      'Amning kan forsinke menstruationens tilbagevenden.',
      'De förste cyklusser kan väre uregelmässige.',
      'At notere datoer kan hjälpe dig med at fölge, hvordan din cyklus ändrer sig.',
    ],
    disclaimerText: 'Informativt indhold. Tidsrammer kan variere afhängigt av den enkelte situation och erstatter inte medicinsk rådgivning.',
  },
  nb: {
    badge: 'FREEMIUM • BARSELTID',
    title: 'Mensens tilbakekomst etter fødselen,\nhva du kan forvente',
    metaDuration: '5 min lesing',
    metaType: 'Veiledning',
    intro: 'Etter fødselen kan det ta litt tid før mensen kommer tilbake. Tidspunktet varierer blant annet avhengig av amming, og hver enkelt kan oppleve denne perioden forskjellig.',
    shareMessage: 'Mensens tilbakekomst etter fødselen, hva du kan forvente – AWA',
    h2_1: '1. Hva er mensens tilbakekomst etter fødselen?',
    body1: '«Mensens tilbakekomst» betegner at mensen kommer tilbake etter fødselen. Menstruasjonssyklusen går ikke nødvendigvis tilbake til sin vanlige rytme med en gang.',
    highlightTitle: 'Hovedpunkt',
    highlightText: 'Det finnes ingen enkelt tidsplan som gjelder for alle.',
    h2_2: '2. Når kan mensen komme tilbake?',
    body2: 'Tidspunktet avhenger i stor grad av amming. Uten amming kan mensen vanligvis komme tilbake etter omtrent 6 til 8 uker. Med full amming kan den bli forsinket i flere måneder.',
    simpleInfoTitle1: 'Uten amming',
    simpleInfoText1: 'Vanligvis rundt 6 til 8 uker.',
    simpleInfoTitle2: 'Med full amming',
    simpleInfoText2: 'Tilbakekomsten kan bli forsinket i flere måneder.',
    h2_3: '3. Forløpet for syklusens tilbakekomst',
    body3: 'Syklusen kommer gradvis tilbake etter fødselen. Amming kan påvirke når mensen dukker opp igjen.',
    schemaTitle: 'Gradvis tilbakekomst av syklusen',
    schemaSubtitle: 'En generell veiledning, steg for steg',
    cycleStages: [
      {title: 'Etter fødselen', text: 'Menstruasjonssyklusen pauser midlertidig etter fødselen.'},
      {title: 'Barseltiden', text: 'Kroppen kommer seg gradvis, og hormonnivåene endrer seg.'},
      {title: 'Amming', text: 'Amming kan forsinke mensens tilbakekomst, men effekten varierer fra person til person.'},
      {title: 'Mensens tilbakekomst', text: 'Den første mensen kan komme tilbake etter noen uker eller flere måneder.'},
      {title: 'De første syklusene', text: 'Syklusene kan være uregelmessige før de gradvis faller tilbake til sin vanlige rytme.'},
    ],
    schemaNoteText: 'Det finnes ingen identisk tidsplan for alle. Når mensen kommer tilbake, kan variere fra person til person, særlig avhengig av amming.',
    h2_4: '4. De første syklusene',
    body4: 'Når mensen kommer tilbake, kan de første syklusene være annerledes enn de var før svangerskapet. De kan særlig være uregelmessige i begynnelsen.',
    card1Title: 'Varierende rytme',
    card1Text: 'Syklusen kan trenge tid for å falle tilbake i en kjent rytme.',
    card2Title: 'Annerledes blødning',
    card2Text: 'Blødningen kan være annerledes enn det du observerte før svangerskapet.',
    h2_5: '5. Hva kan du observere?',
    body5: 'Enkel sporing hjelper deg å observere bedre hvordan syklusen utvikler seg over tid.',
    observations: [
      {title: 'Datoer', text: 'Noter første dag av mensen.'},
      {title: 'Rytme', text: 'Observer gradvis tiden mellom syklusene.'},
      {title: 'Blødning', text: 'Se rett og slett etter endringer sammenlignet med det som er vanlig for deg.'},
    ],
    h2_6: '6. Når bør du søke råd?',
    body6: 'Hvis noe virker uvanlig, vedvarende eller bekymringsfullt, bør du søke råd hos helsepersonell.',
    warningSigns: [
      'Blødning som virker uvanlig for deg',
      'Betydelig eller vedvarende smerte',
      'Feber eller betydelig ubehag',
      'Ethvert nytt symptom som bekymrer deg',
    ],
    summaryTitle: 'Det viktigste å huske',
    summaryPoints: [
      'Mensens tilbakekomst etter fødselen betegner at mensen kommer tilbake etter fødselen.',
      'Amming kan forsinke mensens tilbakekomst.',
      'De første syklusene kan være uregelmessige.',
      'Å notere datoene kan hjelpe deg å følge hvordan syklusen utvikler seg.',
    ],
    disclaimerText: 'Informasjonsinnhold. Tidsrommene kan variere avhengig av hver enkelt situasjon og erstatter ikke medisinsk rådgivning.',
  },
  pl: {
    badge: 'FREEMIUM • POŁÓG',
    title: 'Powrót miesiączek po porodzie,\nczego się spodziewać',
    metaDuration: '5 min czytania',
    metaType: 'Poradnik',
    intro: 'Po porodzie powrót miesiączki może zająć trochę czasu. Termin zależy między innymi od karmienia piersią, a każda osoba może przeżywać ten okres inaczej.',
    shareMessage: 'Powrót miesiączek po porodzie, czego się spodziewać — AWA',
    h2_1: '1. Czym jest powrót miesiączek po porodzie?',
    body1: '„Powrót miesiączek” oznacza, że po porodzie wraca miesiączka. Cykl menstruacyjny nie musi od razu wrócić do zwykłego rytmu.',
    highlightTitle: 'Najważniejsze',
    highlightText: 'Nie ma jednego terminu, który dotyczy wszystkich.',
    h2_2: '2. Kiedy może wrócić miesiączka?',
    body2: 'Termin w dużej mierze zależy od karmienia piersią. Bez karmienia piersią miesiączka może zwykle wrócić po około 6 do 8 tygodniach. Przy wyłącznym karmieniu piersią może się opóźnić o kilka miesięcy.',
    simpleInfoTitle1: 'Bez karmienia piersią',
    simpleInfoText1: 'Zwykle po około 6 do 8 tygodniach.',
    simpleInfoTitle2: 'Przy wyłącznym karmieniu piersią',
    simpleInfoText2: 'Powrót może się opóźnić o kilka miesięcy.',
    h2_3: '3. Schemat powrotu cyklu',
    body3: 'Cykl wraca stopniowo po porodzie. Karmienie piersią może wpływać na to, kiedy miesiączka się pojawi.',
    schemaTitle: 'Stopniowy powrót cyklu',
    schemaSubtitle: 'Ogólny przewodnik, krok po kroku',
    cycleStages: [
      {title: 'Po porodzie', text: 'Cykl menstruacyjny jest po porodzie tymczasowo wstrzymany.'},
      {title: 'Okres poporodowy', text: 'Organizm stopniowo wraca do formy, a poziomy hormonów się zmieniają.'},
      {title: 'Karmienie piersią', text: 'Karmienie piersią może opóźniać powrót miesiączki, ale jego wpływ jest różny u poszczególnych osób.'},
      {title: 'Powrót miesiączek', text: 'Pierwsza miesiączka może wrócić po kilku tygodniach lub kilku miesiącach.'},
      {title: 'Pierwsze cykle', text: 'Cykle mogą być nieregularne, zanim stopniowo wrócą do swojego zwykłego rytmu.'},
    ],
    schemaNoteText: 'Nie ma identycznego terminu dla wszystkich. Moment powrotu miesiączki może się różnić u poszczególnych osób, zwłaszcza w zależności od karmienia piersią.',
    h2_4: '4. Pierwsze cykle',
    body4: 'Gdy miesiączka wraca, pierwsze cykle mogą różnić się od tych sprzed ciąży. W szczególności na początku mogą być nieregularne.',
    card1Title: 'Zmienny rytm',
    card1Text: 'Cykl może potrzebować czasu, by wrócić do znajomego rytmu.',
    card2Title: 'Inne krwawienie',
    card2Text: 'Krwawienie może być inne niż to, które obserwowałaś przed ciążą.',
    h2_5: '5. Co możesz obserwować?',
    body5: 'Proste śledzenie pomaga lepiej obserwować, jak Twój cykl zmienia się w czasie.',
    observations: [
      {title: 'Daty', text: 'Zapisz pierwszy dzień miesiączki.'},
      {title: 'Rytm', text: 'Stopniowo obserwuj odstęp między cyklami.'},
      {title: 'Krwawienie', text: 'Po prostu obserwuj wszelkie zmiany w porównaniu z tym, co jest dla Ciebie zwykłe.'},
    ],
    h2_6: '6. Kiedy zasięgnąć porady?',
    body6: 'Jeśli coś wydaje się nietypowe, uporczywe lub niepokojące, zasięgnij porady specjalisty.',
    warningSigns: [
      'Krwawienie, które wydaje Ci się nietypowe',
      'Silny lub uporczywy ból',
      'Gorączka lub znaczny dyskomfort',
      'Każdy nowy objaw, który Cię niepokoi',
    ],
    summaryTitle: 'Najważniejsze wnioski',
    summaryPoints: [
      'Powrót miesiączek po porodzie oznacza, że po porodzie wraca miesiączka.',
      'Karmienie piersią może opóźniać powrót miesiączki.',
      'Pierwsze cykle mogą być nieregularne.',
      'Zapisywanie dat może pomóc śledzić, jak zmienia się Twój cykl.',
    ],
    disclaimerText: 'Treść informacyjna. Terminy mogą się różnić w zależności od sytuacji i nie zastępują porady lekarskiej.',
  },
  uk: {
    badge: 'FREEMIUM • ПІСЛЯ ПОЛОГІВ',
    title: 'Повернення менструацій після пологів,\nчого очікувати',
    metaDuration: '5 хв читання',
    metaType: 'Посібник',
    intro: 'Після пологів повернення менструації може зайняти певний час. Термін залежить, зокрема, від грудного вигодовування, і кожна людина може переживати цей період по-різному.',
    shareMessage: 'Повернення менструацій після пологів, чого очікувати — AWA',
    h2_1: '1. Що таке повернення менструацій після пологів?',
    body1: '«Повернення менструацій» означає, що після пологів знову настає менструація. Менструальний цикл не обов’язково одразу повертається до звичного ритму.',
    highlightTitle: 'Головне',
    highlightText: 'Не існує єдиного строку, який стосується всіх.',
    h2_2: '2. Коли може повернутися менструація?',
    body2: 'Термін значною мірою залежить від грудного вигодовування. Без грудного вигодовування менструація зазвичай може повернутися приблизно за 6–8 тижнів. За виключно грудного вигодовування вона може затриматися на кілька місяців.',
    simpleInfoTitle1: 'Без грудного вигодовування',
    simpleInfoText1: 'Зазвичай приблизно за 6–8 тижнів.',
    simpleInfoTitle2: 'За виключно грудного вигодовування',
    simpleInfoText2: 'Повернення може затриматися на кілька місяців.',
    h2_3: '3. Схема повернення циклу',
    body3: 'Цикл повертається поступово після пологів. Грудне вигодовування може впливати на те, коли знову з’явиться менструація.',
    schemaTitle: 'Поступове повернення циклу',
    schemaSubtitle: 'Загальний орієнтир, крок за кроком',
    cycleStages: [
      {title: 'Після пологів', text: 'Менструальний цикл після пологів тимчасово призупиняється.'},
      {title: 'Післяпологовий період', text: 'Тіло поступово відновлюється, а рівні гормонів змінюються.'},
      {title: 'Грудне вигодовування', text: 'Грудне вигодовування може затримувати повернення менструації, але його вплив різниться в різних людей.'},
      {title: 'Повернення менструацій', text: 'Перша менструація може повернутися через кілька тижнів або кілька місяців.'},
      {title: 'Перші цикли', text: 'Цикли можуть бути нерегулярними, перш ніж поступово повернуться до звичного ритму.'},
    ],
    schemaNoteText: 'Ідентичного строку для всіх не існує. Момент повернення менструації може різнитися в різних людей, зокрема залежно від грудного вигодовування.',
    h2_4: '4. Перші цикли',
    body4: 'Коли менструація повертається, перші цикли можуть відрізнятися від тих, що були до вагітності. Зокрема, на початку вони можуть бути нерегулярними.',
    card1Title: 'Змінний ритм',
    card1Text: 'Циклу може знадобитися час, щоб повернутися до знайомого ритму.',
    card2Title: 'Інші виділення',
    card2Text: 'Виділення можуть відрізнятися від тих, які ви спостерігали до вагітності.',
    h2_5: '5. Що можна спостерігати?',
    body5: 'Просте відстеження допомагає краще спостерігати, як змінюється ваш цикл з часом.',
    observations: [
      {title: 'Дати', text: 'Занотуйте перший день менструації.'},
      {title: 'Ритм', text: 'Поступово спостерігайте інтервал між циклами.'},
      {title: 'Виділення', text: 'Просто спостерігайте за будь-якими змінами порівняно з вашою нормою.'},
    ],
    h2_6: '6. Коли звертатися за порадою?',
    body6: 'Якщо щось здається нетиповим, стійким або тривожним, зверніться за порадою до медичного фахівця.',
    warningSigns: [
      'Кровотеча, що здається вам нетиповою',
      'Сильний або стійкий біль',
      'Гарячка або значний дискомфорт',
      'Будь-який новий симптом, що вас турбує',
    ],
    summaryTitle: 'Головні висновки',
    summaryPoints: [
      'Повернення менструацій після пологів означає, що після пологів знову настає менструація.',
      'Грудне вигодовування може затримувати повернення менструації.',
      'Перші цикли можуть бути нерегулярними.',
      'Запис дат може допомогти стежити за тим, як змінюється ваш цикл.',
    ],
    disclaimerText: 'Інформаційний вміст. Строки можуть відрізнятися залежно від ситуації й не замінюють медичної поради.',
  },
  cs: {
    badge: 'FREEMIUM • PO PORODU',
    title: 'Návrat menstruace po porodu,\nco očekávat',
    metaDuration: '5 min čtení',
    metaType: 'Průvodce',
    intro: 'Po porodu může návrat menstruace nějakou dobu trvat. Načasování se liší mimo jiné podle kojení a každá žena může toto období prožívat jinak.',
    shareMessage: 'Návrat menstruace po porodu, co očekávat — AWA',
    h2_1: '1. Co je návrat menstruace po porodu?',
    body1: '„Návrat menstruace“ označuje, že se vám po porodu vrací menstruace. Menstruační cyklus se nemusí hned vrátit do svého obvyklého rytmu.',
    highlightTitle: 'Klíčový bod',
    highlightText: 'Neexistuje jediný časový průběh, který by platil pro všechny.',
    h2_2: '2. Kdy se může menstruace vrátit?',
    body2: 'Načasování do značné míry závisí na kojení. Bez kojení se menstruace obecně může vrátit kolem 6 až 8 týdnů. Při výhradním kojení se může zpozdit o několik měsíců.',
    simpleInfoTitle1: 'Bez kojení',
    simpleInfoText1: 'Obecně kolem 6 až 8 týdnů.',
    simpleInfoTitle2: 'S výhradním kojením',
    simpleInfoText2: 'Návrat se může zpozdit o několik měsíců.',
    h2_3: '3. Průběh návratu cyklu',
    body3: 'Cyklus se po porodu vrací postupně. Kojení může ovlivnit, kdy se menstruace znovu objeví.',
    schemaTitle: 'Postupný návrat cyklu',
    schemaSubtitle: 'Obecný průvodce, krok za krokem',
    cycleStages: [
      {title: 'Po porodu', text: 'Menstruační cyklus se po porodu dočasně pozastaví.'},
      {title: 'Období po porodu', text: 'Tělo se postupně zotavuje a mění se hladiny hormonů.'},
      {title: 'Kojení', text: 'Kojení může návrat menstruace zpozdit, ale jeho účinek se liší od ženy k ženě.'},
      {title: 'Návrat menstruace', text: 'První menstruace se může vrátit po několika týdnech nebo několika měsících.'},
      {title: 'První cykly', text: 'Cykly mohou být nepravidelné, než se postupně ustálí v obvyklém rytmu.'},
    ],
    schemaNoteText: 'Neexistuje stejný časový průběh pro všechny. Kdy se menstruace vrátí, se může u jednotlivých žen lišit, zejména podle kojení.',
    h2_4: '4. První cykly',
    body4: 'Když se menstruace vrátí, první cykly se mohou lišit od těch před těhotenstvím. Zejména mohou být zpočátku nepravidelné.',
    card1Title: 'Proměnlivý rytmus',
    card1Text: 'Cyklu může chvíli trvat, než se ustálí v známém rytmu.',
    card2Title: 'Odlišné krvácení',
    card2Text: 'Krvácení může být jiné, než jaké jste pozorovala před těhotenstvím.',
    h2_5: '5. Co můžete sledovat?',
    body5: 'Jednoduché sledování vám pomůže lépe pozorovat, jak se váš cyklus v čase vyvíjí.',
    observations: [
      {title: 'Data', text: 'Poznamenejte si první den menstruace.'},
      {title: 'Rytmus', text: 'Postupně sledujte odstup mezi cykly.'},
      {title: 'Krvácení', text: 'Jednoduše sledujte případné změny oproti tomu, co je pro vás obvyklé.'},
    ],
    h2_6: '6. Kdy vyhledat radu?',
    body6: 'Pokud se vám něco zdá neobvyklé, přetrvávající nebo znepokojivé, požádejte o radu zdravotnického pracovníka.',
    warningSigns: [
      'Krvácení, které se vám zdá neobvyklé',
      'Výrazná nebo přetrvávající bolest',
      'Horečka nebo výrazné nepohodlí',
      'Jakýkoli nový příznak, který vás znepokojuje',
    ],
    summaryTitle: 'Hlavní poznatky',
    summaryPoints: [
      'Návrat menstruace po porodu znamená, že se vám po porodu vrací menstruace.',
      'Kojení může návrat menstruace zpozdit.',
      'První cykly mohou být nepravidelné.',
      'Zapisování dat vám může pomoci sledovat, jak se váš cyklus vyvíjí.',
    ],
    disclaimerText: 'Informativní obsah. Časové průběhy se mohou lišit podle jednotlivých situací a nenahrazují lékařskou radu.',
  },
  sk: {
    badge: 'FREEMIUM • PO PÔRODE',
    title: 'Návrat menštruácie po pôrode,\nčo očakávať',
    metaDuration: '5 min čítania',
    metaType: 'Sprievodca',
    intro: 'Po pôrode môže návrat menštruácie chvíľu trvať. Načasovanie sa líši okrem iného podľa dojčenia a každá žena môže toto obdobie prežívať inak.',
    shareMessage: 'Návrat menštruácie po pôrode, čo očakávať — AWA',
    h2_1: '1. Čo je návrat menštruácie po pôrode?',
    body1: '„Návrat menštruácie“ označuje, že sa po pôrode vaša menštruácia vráti. Menštruačný cyklus sa nemusí hneď vrátiť k obvyklému rytmu.',
    highlightTitle: 'Kľúčový bod',
    highlightText: 'Neexistuje jediný časový rámec, ktorý by platil pre všetky ženy.',
    h2_2: '2. Kedy sa môže menštruácia vrátiť?',
    body2: 'Načasovanie veľmi závisí od dojčenia. Bez dojčenia sa menštruácia môže vo všeobecnosti vrátiť okolo 6. až 8. týždňa. Pri výlučnom dojčení sa môže oneskoriť o niekoľko mesiacov.',
    simpleInfoTitle1: 'Bez dojčenia',
    simpleInfoText1: 'Vo všeobecnosti okolo 6 až 8 týždňov.',
    simpleInfoTitle2: 'Pri výlučnom dojčení',
    simpleInfoText2: 'Návrat sa môže oneskoriť o niekoľko mesiacov.',
    h2_3: '3. Priebeh návratu cyklu',
    body3: 'Cyklus sa po pôrode vracia postupne. Dojčenie môže ovplyvniť, kedy sa menštruácia znova objaví.',
    schemaTitle: 'Postupný návrat cyklu',
    schemaSubtitle: 'Všeobecný sprievodca, krok za krokom',
    cycleStages: [
      {title: 'Po pôrode', text: 'Menštruačný cyklus sa po pôrode dočasne pozastaví.'},
      {title: 'Obdobie po pôrode', text: 'Telo sa postupne zotavuje a hladiny hormónov sa menia.'},
      {title: 'Dojčenie', text: 'Dojčenie môže návrat menštruácie oddialiť, ale jeho účinok sa líši od ženy k žene.'},
      {title: 'Návrat menštruácie', text: 'Vaša prvá menštruácia sa môže vrátiť po niekoľkých týždňoch alebo mesiacoch.'},
      {title: 'Prvé cykly', text: 'Cykly môžu byť nepravidelné, kým sa postupne neustália na obvyklom rytme.'},
    ],
    schemaNoteText: 'Neexistuje identický časový rámec pre všetky ženy. Čas návratu menštruácie sa môže líšiť od ženy k žene, najmä podľa dojčenia.',
    h2_4: '4. Prvé cykly',
    body4: 'Keď sa menštruácia vráti, prvé cykly sa môžu líšiť od tých pred tehotenstvom. Najmä môžu byť spočiatku nepravidelné.',
    card1Title: 'Premenlivý rytmus',
    card1Text: 'Cyklu môže chvíľu trvať, kým sa vráti k známemu rytmu.',
    card2Title: 'Odlišné krvácanie',
    card2Text: 'Krvácanie sa môže líšiť od toho, čo ste pozorovali pred tehotenstvom.',
    h2_5: '5. Čo môžete sledovať?',
    body5: 'Jednoduché sledovanie vám pomáha lepšie pozorovať, ako sa váš cyklus v čase vyvíja.',
    observations: [
      {title: 'Dátumy', text: 'Poznačte si prvý deň menštruácie.'},
      {title: 'Rytmus', text: 'Postupne sledujte odstup medzi cyklami.'},
      {title: 'Krvácanie', text: 'Jednoducho sledujte zmeny oproti tomu, čo je pre vás obvyklé.'},
    ],
    h2_6: '6. Kedy vyhľadať radu?',
    body6: 'Ak sa vám niečo zdá nezvyčajné, pretrvávajúce alebo znepokojujúce, poraďte sa so zdravotníckym pracovníkom.',
    warningSigns: [
      'Krvácanie, ktoré sa vám zdá nezvyčajné',
      'Výrazná alebo pretrvávajúca bolesť',
      'Horúčka alebo výrazné nepohodlie',
      'Akýkoľvek nový príznak, ktorý vás znepokojuje',
    ],
    summaryTitle: 'Hlavné body',
    summaryPoints: [
      'Návrat menštruácie po pôrode znamená, že sa po pôrode vaša menštruácia vráti.',
      'Dojčenie môže návrat menštruácie oddialiť.',
      'Prvé cykly môžu byť nepravidelné.',
      'Zaznamenávanie dátumov vám môže pomôcť sledovať vývoj cyklu.',
    ],
    disclaimerText: 'Informatívny obsah. Časové rámce sa môžu líšiť podľa každej situácie a nenahrádzajú lekársku radu.',
  },
  hu: {
    badge: 'FREEMIUM • SZÜLÉS UTÁN',
    title: 'A menstruáció visszatérése szülés után,\nmire számíts',
    metaDuration: '5 perc olvasás',
    metaType: 'Útmutató',
    intro: 'A szülés után a menstruáció visszatérése eltarthat egy ideig. Az időzítés többek között a szoptatástól függően változik, és minden nő másként élheti meg ezt az időszakot.',
    shareMessage: 'A menstruáció visszatérése szülés után, mire számíts — AWA',
    h2_1: '1. Mi a menstruáció visszatérése szülés után?',
    body1: 'A „menstruáció visszatérése” azt jelenti, hogy a menstruációd szülés után újra megjelenik. A menstruációs ciklus nem feltétlenül tér vissza azonnal a szokásos ritmusához.',
    highlightTitle: 'Kulcspont',
    highlightText: 'Nincs egyetlen, mindenkire érvényes időkeret.',
    h2_2: '2. Mikor térhet vissza a menstruációd?',
    body2: 'Az időzítés nagyban függ a szoptatástól. Szoptatás nélkül a menstruáció általában körülbelül 6–8 hét körül térhet vissza. Kizárólagos szoptatás esetén több hónappal is késhet.',
    simpleInfoTitle1: 'Szoptatás nélkül',
    simpleInfoText1: 'Általában körülbelül 6–8 hét.',
    simpleInfoTitle2: 'Kizárólagos szoptatás esetén',
    simpleInfoText2: 'A visszatérés több hónappal késhet.',
    h2_3: '3. A ciklus visszatérésének menete',
    body3: 'A ciklus a szülés után fokozatosan tér vissza. A szoptatás befolyásolhatja, mikor jelenik meg újra a menstruációd.',
    schemaTitle: 'A ciklus fokozatos visszatérése',
    schemaSubtitle: 'Általános útmutató, lépésről lépésre',
    cycleStages: [
      {title: 'A szülés után', text: 'A menstruációs ciklus a szülés után átmenetileg szünetel.'},
      {title: 'Szülés utáni időszak', text: 'A test fokozatosan felépül, és a hormonszintek változnak.'},
      {title: 'Szoptatás', text: 'A szoptatás késleltetheti a menstruáció visszatérését, de hatása nőnként eltér.'},
      {title: 'A menstruáció visszatérése', text: 'Az első menstruációd néhány hét vagy több hónap után térhet vissza.'},
      {title: 'Az első ciklusok', text: 'A ciklusok szabálytalanok lehetnek, mielőtt fokozatosan visszatérnének a szokásos ritmusukhoz.'},
    ],
    schemaNoteText: 'Nincs mindenkinél azonos időkeret. A menstruáció visszatérésének ideje nőnként eltérhet, különösen a szoptatástól függően.',
    h2_4: '4. Az első ciklusok',
    body4: 'Amikor a menstruáció visszatér, az első ciklusok eltérhetnek a terhesség előttiektől. Különösen szabálytalanok lehetnek az elején.',
    card1Title: 'Változó ritmus',
    card1Text: 'A ciklusnak időbe telhet, mire visszatér egy ismerős ritmushoz.',
    card2Title: 'Eltérő vérzés',
    card2Text: 'A vérzés eltérhet attól, amit a terhesség előtt megfigyeltél.',
    h2_5: '5. Mit figyelhetsz meg?',
    body5: 'Az egyszerű követés segít jobban megfigyelni, hogyan alakul a ciklusod az idő során.',
    observations: [
      {title: 'Dátumok', text: 'Jegyezd fel a menstruációd első napját.'},
      {title: 'Ritmus', text: 'Fokozatosan figyeld meg a ciklusok közötti időközt.'},
      {title: 'Vérzés', text: 'Egyszerűen figyeld meg a változásokat a számodra szokásoshoz képest.'},
    ],
    h2_6: '6. Mikor kérj tanácsot?',
    body6: 'Ha valami szokatlannak, tartósnak vagy aggasztónak tűnik, kérj tanácsot egészségügyi szakembertől.',
    warningSigns: [
      'Vérzés, amely szokatlannak tűnik',
      'Jelentős vagy tartós fájdalom',
      'Láz vagy jelentős kellemetlenség',
      'Bármilyen új tünet, amely aggaszt',
    ],
    summaryTitle: 'Legfontosabb tudnivalók',
    summaryPoints: [
      'A menstruáció szülés utáni visszatérése azt jelenti, hogy a menstruációd szülés után újra megjelenik.',
      'A szoptatás késleltetheti a menstruáció visszatérését.',
      'Az első ciklusok szabálytalanok lehetnek.',
      'A dátumok feljegyzése segíthet követni a ciklusod alakulását.',
    ],
    disclaimerText: 'Tájékoztató jellegű tartalom. Az időkeretek helyzetenként eltérhetnek, és nem helyettesítik az orvosi tanácsot.',
  },
  ro: {
    badge: 'FREEMIUM • POSTNATAL',
    title: 'Revenirea menstruației după naștere,\nla ce să te aștepți',
    metaDuration: '5 min de citit',
    metaType: 'Ghid',
    intro: 'După naștere, revenirea menstruației poate dura ceva timp. Momentul variază, printre altele, în funcție de alăptare, iar fiecare persoană poate trăi această perioadă diferit.',
    shareMessage: 'Revenirea menstruației după naștere, la ce să te aștepți — AWA',
    h2_1: '1. Ce este revenirea menstruației după naștere?',
    body1: '„Revenirea menstruației” desemnează reapariția menstruației după naștere. Ciclul menstrual nu revine neapărat imediat la ritmul său obișnuit.',
    highlightTitle: 'Punct-cheie',
    highlightText: 'Nu există un singur calendar care să se aplice tuturor.',
    h2_2: '2. Când poate reveni menstruația?',
    body2: 'Momentul depinde în mare măsură de alăptare. Fără alăptare, menstruația poate reveni în general în jurul a 6 până la 8 săptămâni. Cu alăptare exclusivă, poate fi întârziată cu mai multe luni.',
    simpleInfoTitle1: 'Fără alăptare',
    simpleInfoText1: 'În general în jurul a 6 până la 8 săptămâni.',
    simpleInfoTitle2: 'Cu alăptare exclusivă',
    simpleInfoText2: 'Revenirea poate fi întârziată cu mai multe luni.',
    h2_3: '3. Tiparul revenirii ciclului',
    body3: 'Ciclul revine treptat după naștere. Alăptarea poate influența momentul reapariției menstruației.',
    schemaTitle: 'Revenirea treptată a ciclului',
    schemaSubtitle: 'Un ghid general, pas cu pas',
    cycleStages: [
      {title: 'După naștere', text: 'Ciclul menstrual se întrerupe temporar după naștere.'},
      {title: 'Perioada postnatală', text: 'Corpul își revine treptat, iar nivelurile hormonale se schimbă.'},
      {title: 'Alăptarea', text: 'Alăptarea poate întârzia revenirea menstruației, dar efectul ei variază de la o persoană la alta.'},
      {title: 'Revenirea menstruației', text: 'Prima ta menstruație poate reveni după câteva săptămâni sau după mai multe luni.'},
      {title: 'Primele cicluri', text: 'Ciclurile pot fi neregulate înainte de a-și relua treptat ritmul obișnuit.'},
    ],
    schemaNoteText: 'Nu există un calendar identic pentru toată lumea. Momentul revenirii menstruației poate varia de la o persoană la alta, în special în funcție de alăptare.',
    h2_4: '4. Primele cicluri',
    body4: 'Când menstruația revine, primele cicluri pot diferi de cele dinaintea sarcinii. În special, pot fi neregulate la început.',
    card1Title: 'Ritm variabil',
    card1Text: 'Ciclului îi poate lua timp să-și reia un ritm familiar.',
    card2Title: 'Flux diferit',
    card2Text: 'Fluxul poate fi diferit de cel observat înainte de sarcină.',
    h2_5: '5. Ce poți observa?',
    body5: 'O urmărire simplă te ajută să observi mai bine cum evoluează ciclul tău în timp.',
    observations: [
      {title: 'Date', text: 'Notează prima zi a menstruației.'},
      {title: 'Ritm', text: 'Observă treptat intervalul dintre cicluri.'},
      {title: 'Flux', text: 'Observă pur și simplu orice schimbări față de ceea ce este obișnuit pentru tine.'},
    ],
    h2_6: '6. Când ar trebui să ceri un sfat?',
    body6: 'Dacă ceva ți se pare neobișnuit, persistent sau îngrijorător, cere sfatul unui profesionist din domeniul sănătății.',
    warningSigns: [
      'O sângerare care ți se pare neobișnuită',
      'Durere importantă sau persistentă',
      'Febră sau un disconfort important',
      'Orice simptom nou care te îngrijorează',
    ],
    summaryTitle: 'Ce să reții',
    summaryPoints: [
      'Revenirea menstruației după naștere desemnează reapariția menstruației după naștere.',
      'Alăptarea poate întârzia revenirea menstruației.',
      'Primele cicluri pot fi neregulate.',
      'Notarea datelor te poate ajuta să urmărești evoluția ciclului tău.',
    ],
    disclaimerText: 'Conținut cu caracter informativ. Intervalele pot varia în funcție de fiecare situație și nu înlocuiesc sfatul medical.',
  },
  bg: {
    badge: 'FREEMIUM • СЛЕД РАЖДАНЕ',
    title: 'Връщане на менструацията след раждане,\nкакво да очакваш',
    metaDuration: '5 мин четене',
    metaType: 'Ръководство',
    intro: 'След раждане връщането на менструацията може да отнеме време. Времето варира, наред с други неща, според кърменето, и всеки човек може да преживее този период по различен начин.',
    shareMessage: 'Връщане на менструацията след раждане, какво да очакваш — AWA',
    h2_1: '1. Какво е връщането на менструацията след раждане?',
    body1: '„Връщането на менструацията“ означава, че менструацията ти се връща след раждане. Менструалният цикъл не се връща непременно веднага към обичайния си ритъм.',
    highlightTitle: 'Основно',
    highlightText: 'Няма единен срок, който важи за всички.',
    h2_2: '2. Кога може да се върне менструацията?',
    body2: 'Времето зависи до голяма степен от кърменето. Без кърмене менструацията обикновено може да се върне около 6 до 8 седмици. При изключително кърмене може да се забави с няколко месеца.',
    simpleInfoTitle1: 'Без кърмене',
    simpleInfoText1: 'Обикновено около 6 до 8 седмици.',
    simpleInfoTitle2: 'При изключително кърмене',
    simpleInfoText2: 'Връщането може да се забави с няколко месеца.',
    h2_3: '3. Картината на връщането на цикъла',
    body3: 'Цикълът се връща постепенно след раждане. Кърменето може да влияе на момента, в който менструацията се появява отново.',
    schemaTitle: 'Постепенно връщане на цикъла',
    schemaSubtitle: 'Общо ръководство, стъпка по стъпка',
    cycleStages: [
      {title: 'След раждане', text: 'Менструалният цикъл временно се прекъсва след раждането.'},
      {title: 'Следродов период', text: 'Тялото се възстановява постепенно и хормоналните нива се променят.'},
      {title: 'Кърмене', text: 'Кърменето може да забави връщането на менструацията, но ефектът му варира от човек на човек.'},
      {title: 'Връщане на менструацията', text: 'Първата ти менструация може да се върне след няколко седмици или няколко месеца.'},
      {title: 'Първите цикли', text: 'Циклите могат да са нередовни, преди постепенно да се върнат към обичайния си ритъм.'},
    ],
    schemaNoteText: 'Няма еднакъв срок за всички. Моментът на връщане на менструацията може да варира от човек на човек, особено според кърменето.',
    h2_4: '4. Първите цикли',
    body4: 'Когато менструацията се върне, първите цикли могат да се различават от тези преди бременността. По-специално, в началото може да са нередовни.',
    card1Title: 'Променлив ритъм',
    card1Text: 'Цикълът може да има нужда от време, за да се установи отново в познат ритъм.',
    card2Title: 'Различен поток',
    card2Text: 'Потокът може да е различен от онзи, който си наблюдавала преди бременността.',
    h2_5: '5. Какво можеш да наблюдаваш?',
    body5: 'Простото проследяване ти помага да наблюдаваш по-добре как се развива цикълът ти във времето.',
    observations: [
      {title: 'Дати', text: 'Отбелязвай първия ден от менструацията си.'},
      {title: 'Ритъм', text: 'Постепенно наблюдавай интервала между циклите.'},
      {title: 'Поток', text: 'Просто наблюдавай евентуалните промени спрямо обичайното за теб.'},
    ],
    h2_6: '6. Кога да потърсиш съвет?',
    body6: 'Ако нещо ти се струва необичайно, упорито или тревожно, потърси съвет от здравен специалист.',
    warningSigns: [
      'Кървене, което ти се струва необичайно',
      'Значителна или упорита болка',
      'Температура или значителен дискомфорт',
      'Всеки нов симптом, който те тревожи',
    ],
    summaryTitle: 'Какво да запомниш',
    summaryPoints: [
      'Връщането на менструацията след раждане означава, че менструацията ти се връща след раждането.',
      'Кърменето може да забави връщането на менструацията.',
      'Първите цикли могат да са нередовни.',
      'Отбелязването на датите може да ти помогне да следиш как се развива цикълът ти.',
    ],
    disclaimerText: 'Информационно съдържание. Сроковете могат да варират според всяка ситуация и не заместват медицинския съвет.',
  },
  sr: {
    badge: 'FREEMIUM • ПОСЛЕ ПОРОЂАЈА',
    title: 'Повратак менструације после порођаја,\nшта да очекујеш',
    metaDuration: '5 мин читања',
    metaType: 'Водич',
    intro: 'После порођаја повратак менструације може потрајати. Време варира, између осталог, према дојењу, а свака особа овај период може проживети другачије.',
    shareMessage: 'Повратак менструације после порођаја, шта да очекујеш — AWA',
    h2_1: '1. Шта је повратак менструације после порођаја?',
    body1: '„Повратак менструације“ означава да ти се менструација враћа после порођаја. Менструални циклус се не враћа нужно одмах у свој уобичајени ритам.',
    highlightTitle: 'Основно',
    highlightText: 'Не постоји јединствен рок који важи за све.',
    h2_2: '2. Када се менструација може вратити?',
    body2: 'Време углавном зависи од дојења. Без дојења менструација се обично може вратити око 6 до 8 недеља. При искључивом дојењу може се одгодити за неколико месеци.',
    simpleInfoTitle1: 'Без дојења',
    simpleInfoText1: 'Обично око 6 до 8 недеља.',
    simpleInfoTitle2: 'При искључивом дојењу',
    simpleInfoText2: 'Повратак се може одгодити за неколико месеци.',
    h2_3: '3. Слика повратка циклуса',
    body3: 'Циклус се враћа постепено после порођаја. Дојење може утицати на то када се менструација поново појави.',
    schemaTitle: 'Постепен повратак циклуса',
    schemaSubtitle: 'Опште упутство, корак по корак',
    cycleStages: [
      {title: 'После порођаја', text: 'Менструални циклус се привремено прекида после порођаја.'},
      {title: 'Период после порођаја', text: 'Тело се постепено опоравља и мењају се хормонски нивои.'},
      {title: 'Дојење', text: 'Дојење може одгодити повратак менструације, али његов ефекат варира од особе до особе.'},
      {title: 'Повратак менструације', text: 'Твоја прва менструација може се вратити после неколико недеља или неколико месеци.'},
      {title: 'Први циклуси', text: 'Циклуси могу бити нередовни пре него што се постепено врате у свој уобичајени ритам.'},
    ],
    schemaNoteText: 'Не постоји исти рок за све. Тренутак повратка менструације може варирати од особе до особе, нарочито према дојењу.',
    h2_4: '4. Први циклуси',
    body4: 'Када се менструација врати, први циклуси могу се разликовати од оних пре трудноће. Нарочито, у почетку могу бити нередовни.',
    card1Title: 'Променљив ритам',
    card1Text: 'Циклусу може бити потребно време да се поново устали у познатом ритму.',
    card2Title: 'Другачији проток',
    card2Text: 'Проток може бити другачији од онога што си посматрала пре трудноће.',
    h2_5: '5. Шта можеш посматрати?',
    body5: 'Једноставно праћење помаже ти да боље посматраш како се твој циклус мења током времена.',
    observations: [
      {title: 'Датуми', text: 'Бележи први дан своје менструације.'},
      {title: 'Ритам', text: 'Постепено посматрај интервал између циклуса.'},
      {title: 'Проток', text: 'Једноставно посматрај евентуалне промене у односу на уобичајено за тебе.'},
    ],
    h2_6: '6. Када потражити савет?',
    body6: 'Ако ти се нешто чини необично, упорно или забрињавајуће, потражи савет од здравственог радника.',
    warningSigns: [
      'Крварење које ти се чини необичним',
      'Значајан или упоран бол',
      'Температура или значајна нелагодност',
      'Сваки нови симптом који те брине',
    ],
    summaryTitle: 'Шта да запамтиш',
    summaryPoints: [
      'Повратак менструације после порођаја значи да ти се менструација враћа после порођаја.',
      'Дојење може одгодити повратак менструације.',
      'Први циклуси могу бити нередовни.',
      'Бележење датума може ти помоћи да пратиш како се твој циклус мења.',
    ],
    disclaimerText: 'Информативни садржај. Рокови могу варирати зависно од сваке ситуације и не замењују медицински савет.',
  },
  hr: {
    badge: 'FREEMIUM • NAKON PORODA',
    title: 'Povratak menstruacije nakon poroda,\nšto očekivati',
    metaDuration: '5 min čitanja',
    metaType: 'Vodič',
    intro: 'Nakon poroda povratak menstruacije može potrajati. Vrijeme se razlikuje, među ostalim, ovisno o dojenju, a svaka žena ovo razdoblje može proživjeti drugačije.',
    shareMessage: 'Povratak menstruacije nakon poroda, što očekivati — AWA',
    h2_1: '1. Što je povratak menstruacije nakon poroda?',
    body1: '„Povratak menstruacije“ označava ponovnu pojavu menstruacije nakon poroda. Menstrualni ciklus se ne vraća nužno odmah u uobičajeni ritam.',
    highlightTitle: 'Ključna točka',
    highlightText: 'Ne postoji jedinstven rok koji vrijedi za sve.',
    h2_2: '2. Kada se menstruacija može vratiti?',
    body2: 'Vrijeme uvelike ovisi o dojenju. Bez dojenja menstruacija se općenito može vratiti oko 6 do 8 tjedana. Uz isključivo dojenje može se odgoditi za nekoliko mjeseci.',
    simpleInfoTitle1: 'Bez dojenja',
    simpleInfoText1: 'Općenito oko 6 do 8 tjedana.',
    simpleInfoTitle2: 'Uz isključivo dojenje',
    simpleInfoText2: 'Povratak se može odgoditi za nekoliko mjeseci.',
    h2_3: '3. Obrazac povratka ciklusa',
    body3: 'Ciklus se nakon poroda vraća postupno. Dojenje može utjecati na to kada se menstruacija ponovno pojavi.',
    schemaTitle: 'Postupan povratak ciklusa',
    schemaSubtitle: 'Opći vodič, korak po korak',
    cycleStages: [
      {title: 'Nakon poroda', text: 'Menstrualni ciklus se nakon poroda privremeno zaustavlja.'},
      {title: 'Poslijeporođajno razdoblje', text: 'Tijelo se postupno oporavlja, a razine hormona se mijenjaju.'},
      {title: 'Dojenje', text: 'Dojenje može odgoditi povratak menstruacije, ali se njegov učinak razlikuje od osobe do osobe.'},
      {title: 'Povratak menstruacije', text: 'Tvoja prva menstruacija može se vratiti nakon nekoliko tjedana ili nekoliko mjeseci.'},
      {title: 'Prvi ciklusi', text: 'Ciklusi mogu biti nepravilni prije nego što se postupno vrate u uobičajeni ritam.'},
    ],
    schemaNoteText: 'Ne postoji identičan raspored za sve. Trenutak povratka menstruacije može se razlikovati od osobe do osobe, osobito ovisno o dojenju.',
    h2_4: '4. Prvi ciklusi',
    body4: 'Kad se menstruacija vrati, prvi ciklusi mogu se razlikovati od onih prije trudnoće. Osobito mogu biti nepravilni na početku.',
    card1Title: 'Promjenjiv ritam',
    card1Text: 'Ciklusu može trebati vremena da se vrati u poznati ritam.',
    card2Title: 'Drugačiji protok',
    card2Text: 'Protok može biti drugačiji od onoga što si primjećivala prije trudnoće.',
    h2_5: '5. Što možeš promatrati?',
    body5: 'Jednostavno praćenje pomaže ti bolje promatrati kako se tvoj ciklus mijenja tijekom vremena.',
    observations: [
      {title: 'Datumi', text: 'Zabilježi prvi dan menstruacije.'},
      {title: 'Ritam', text: 'Postupno promatraj razmak između ciklusa.'},
      {title: 'Protok', text: 'Jednostavno promatraj sve promjene u odnosu na ono što je uobičajeno za tebe.'},
    ],
    h2_6: '6. Kada zatražiti savjet?',
    body6: 'Ako ti se nešto čini neobičnim, dugotrajnim ili zabrinjavajućim, zatraži savjet zdravstvenog djelatnika.',
    warningSigns: [
      'Krvarenje koje ti se čini neobičnim',
      'Jaka ili dugotrajna bol',
      'Vrućica ili izražena nelagoda',
      'Svaki novi simptom koji te brine',
    ],
    summaryTitle: 'Ključne poruke',
    summaryPoints: [
      'Povratak menstruacije nakon poroda označava ponovnu pojavu menstruacije nakon poroda.',
      'Dojenje može odgoditi povratak menstruacije.',
      'Prvi ciklusi mogu biti nepravilni.',
      'Bilježenje datuma može ti pomoći pratiti kako se tvoj ciklus mijenja.',
    ],
    disclaimerText: 'Informativni sadržaj. Rokovi se mogu razlikovati ovisno o svakoj situaciji i ne zamjenjuju liječnički savjet.',
  },
  bs: {
    badge: 'FREEMIUM • NAKON PORODA',
    title: 'Povratak menstruacije nakon porođaja,\nšta očekivati',
    metaDuration: '5 min čitanja',
    metaType: 'Vodič',
    intro: 'Nakon porođaja povratak menstruacije može potrajati. Vrijeme se razlikuje, među ostalim, ovisno o dojenju, a svaka žena ovo razdoblje može proživjeti drugačije.',
    shareMessage: 'Povratak menstruacije nakon porođaja, što očekivati — AWA',
    h2_1: '1. Što je povratak menstruacije nakon porođaja?',
    body1: '„Povratak menstruacije“ označava ponovnu pojavu menstruacije nakon porođaja. Menstrualni ciklus se ne vraća nužno odmah u uobičajeni ritam.',
    highlightTitle: 'Ključna tačka',
    highlightText: 'Ne postoji jedinstven rok koji vrijedi za sve.',
    h2_2: '2. Kada se menstruacija može vratiti?',
    body2: 'Vrijeme uvelike ovisi o dojenju. Bez dojenja menstruacija se općenito može vratiti oko 6 do 8 sedmica. Uz isključivo dojenje može se odgoditi za nekoliko mjeseci.',
    simpleInfoTitle1: 'Bez dojenja',
    simpleInfoText1: 'Općenito oko 6 do 8 sedmica.',
    simpleInfoTitle2: 'Uz isključivo dojenje',
    simpleInfoText2: 'Povratak se može odgoditi za nekoliko mjeseci.',
    h2_3: '3. Obrazac povratka ciklusa',
    body3: 'Ciklus se nakon porođaja vraća postupno. Dojenje može utjecati na to kada se menstruacija ponovno pojavi.',
    schemaTitle: 'Postupan povratak ciklusa',
    schemaSubtitle: 'Opći vodič, korak po korak',
    cycleStages: [
      {title: 'Nakon porođaja', text: 'Menstrualni ciklus se nakon porođaja privremeno zaustavlja.'},
      {title: 'Poslijeporođajno razdoblje', text: 'Tijelo se postupno oporavlja, a razine hormona se mijenjaju.'},
      {title: 'Dojenje', text: 'Dojenje može odgoditi povratak menstruacije, ali se njegov učinak razlikuje od osobe do osobe.'},
      {title: 'Povratak menstruacije', text: 'Tvoja prva menstruacija može se vratiti nakon nekoliko sedmica ili nekoliko mjeseci.'},
      {title: 'Prvi ciklusi', text: 'Ciklusi mogu biti nepravilni prije nego što se postupno vrate u uobičajeni ritam.'},
    ],
    schemaNoteText: 'Ne postoji identičan raspored za sve. Trenutak povratka menstruacije može se razlikovati od osobe do osobe, osobito ovisno o dojenju.',
    h2_4: '4. Prvi ciklusi',
    body4: 'Kad se menstruacija vrati, prvi ciklusi mogu se razlikovati od onih prije trudnoće. Osobito mogu biti nepravilni na početku.',
    card1Title: 'Promjenjiv ritam',
    card1Text: 'Ciklusu može trebati vremena da se vrati u poznati ritam.',
    card2Title: 'Drugačiji protok',
    card2Text: 'Protok može biti drugačiji od onoga što si primjećivala prije trudnoće.',
    h2_5: '5. Što možeš promatrati?',
    body5: 'Jednostavno praćenje pomaže ti bolje promatrati kako se tvoj ciklus mijenja tokom vremena.',
    observations: [
      {title: 'Datumi', text: 'Zabilježi prvi dan menstruacije.'},
      {title: 'Ritam', text: 'Postupno promatraj razmak između ciklusa.'},
      {title: 'Protok', text: 'Jednostavno promatraj sve promjene u odnosu na ono što je uobičajeno za tebe.'},
    ],
    h2_6: '6. Kada zatražiti savjet?',
    body6: 'Ako ti se nešta čini neobičnim, dugotrajnim ili zabrinjavajućim, zatraži savjet zdravstvenog radnika.',
    warningSigns: [
      'Krvarenje koje ti se čini neobičnim',
      'Jaka ili dugotrajna bol',
      'Vrućica ili izražena nelagoda',
      'Svaki novi simptom koji te brine',
    ],
    summaryTitle: 'Ključne poruke',
    summaryPoints: [
      'Povratak menstruacije nakon porođaja označava ponovnu pojavu menstruacije nakon porođaja.',
      'Dojenje može odgoditi povratak menstruacije.',
      'Prvi ciklusi mogu biti nepravilni.',
      'Bilježenje datuma može ti pomoći pratiti kako se tvoj ciklus mijenja.',
    ],
    disclaimerText: 'Informativni sadržaj. Rokovi se mogu razlikovati ovisno o svakoj situaciji i ne zamjenjuju ljekarski savjet.',
  },
  sl: {
    badge: 'FREEMIUM • PO PORODU',
    title: 'Vrnitev menstruacije po porodu,\nkaj pričakovati',
    metaDuration: '5 min branja',
    metaType: 'Vodnik',
    intro: 'Po porodu lahko vrnitev menstruacije traja. Čas se razlikuje, med drugim glede na dojenje, vsaka ženska pa to obdobje lahko doživi drugače.',
    shareMessage: 'Vrnitev menstruacije po porodu, kaj pričakovati — AWA',
    h2_1: '1. Kaj je vrnitev menstruacije po porodu?',
    body1: '„Vrnitev menstruacije“ pomeni ponovno pojavitev menstruacije po porodu. Menstrualni cikel se ne vrne nujno takoj v običajen ritem.',
    highlightTitle: 'Ključna točka',
    highlightText: 'Ne obstaja enoten rok, ki bi veljal za vse.',
    h2_2: '2. Kdaj se menstruacija lahko vrne?',
    body2: 'Čas je v veliki meri odvisen od dojenja. Brez dojenja se menstruacija na splošno lahko vrne okoli 6 do 8 tednov. Ob izključnem dojenju se lahko odloži za nekaj mesecev.',
    simpleInfoTitle1: 'Brez dojenja',
    simpleInfoText1: 'Na splošno okoli 6 do 8 tednov.',
    simpleInfoTitle2: 'Ob izključnem dojenju',
    simpleInfoText2: 'Vrnitev se lahko odloži za nekaj mesecev.',
    h2_3: '3. Vzorec vrnitve cikla',
    body3: 'Cikel se po porodu vrača postopoma. Dojenje lahko vpliva na to, kdaj se menstruacija znova pojavi.',
    schemaTitle: 'Postopna vrnitev cikla',
    schemaSubtitle: 'Splošen vodnik, korak za korakom',
    cycleStages: [
      {title: 'Po porodu', text: 'Menstrualni cikel se po porodu začasno ustavi.'},
      {title: 'Poporodno obdobje', text: 'Telo se postopoma opomore, ravni hormonov se spreminjajo.'},
      {title: 'Dojenje', text: 'Dojenje lahko odloži vrnitev menstruacije, vendar se njegov učinek razlikuje od osebe do osebe.'},
      {title: 'Vrnitev menstruacije', text: 'Tvoja prva menstruacija se lahko vrne po nekaj tednih ali nekaj mesecih.'},
      {title: 'Prvi cikli', text: 'Cikli so lahko neredni, preden se postopoma vrnejo v običajen ritem.'},
    ],
    schemaNoteText: 'Ne obstaja enak časovni razpored za vse. Trenutek vrnitve menstruacije se lahko razlikuje od osebe do osebe, zlasti glede na dojenje.',
    h2_4: '4. Prvi cikli',
    body4: 'Ko se menstruacija vrne, se lahko prvi cikli razlikujejo od tistih pred nosečnostjo. Zlasti so lahko na začetku neredni.',
    card1Title: 'Spremenljiv ritem',
    card1Text: 'Ciklu lahko traja, da se vrne v znan ritem.',
    card2Title: 'Drugačen tok',
    card2Text: 'Tok je lahko drugačen od tistega, ki si ga opažala pred nosečnostjo.',
    h2_5: '5. Kaj lahko opazuješ?',
    body5: 'Preprosto spremljanje ti pomaga bolje opazovati, kako se tvoj cikel spreminja skozi čas.',
    observations: [
      {title: 'Datumi', text: 'Zabeleži prvi dan menstruacije.'},
      {title: 'Ritem', text: 'Postopoma opazuj razmik med cikli.'},
      {title: 'Tok', text: 'Preprosto opazuj morebitne spremembe v primerjavi s tem, kar je zate običajno.'},
    ],
    h2_6: '6. Kdaj poiskati nasvet?',
    body6: 'Če se ti kaj zdi nenavadno, dolgotrajno ali zaskrbljujoče, poišči nasvet zdravstvenega delavca.',
    warningSigns: [
      'Krvavitev, ki se ti zdi nenavadna',
      'Huda ali dolgotrajna bolečina',
      'Vročina ali izrazita nelagodnost',
      'Vsak nov simptom, ki te skrbi',
    ],
    summaryTitle: 'Ključna sporočila',
    summaryPoints: [
      'Vrnitev menstruacije po porodu pomeni ponovno pojavitev menstruacije po porodu.',
      'Dojenje lahko odloži vrnitev menstruacije.',
      'Prvi cikli so lahko neredni.',
      'Beleženje datumov ti lahko pomaga spremljati, kako se tvoj cikel spreminja.',
    ],
    disclaimerText: 'Informativna vsebina. Roki se lahko razlikujejo glede na vsako situacijo in ne nadomeščajo zdravniškega nasveta.',
  },
  ne: {
    badge: 'फ्रिमियम • सुत्केरीपछि',
    title: 'प्रसवपछि महिनावारी फर्कने,\nके अपेक्षा गर्ने',
    metaDuration: '5 मिनेट पढाइ',
    metaType: 'मार्गदर्शन',
    intro: 'प्रसवपछि, तपाईंको महिनावारी फर्कन केही समय लाग्न सक्छ। समय स्तनपान लगायतका कुरामा निर्भर गरेर फरक पर्छ, र हरेक व्यक्तिले यो अवधि फरक ढङ्गले अनुभव गर्न सक्छ।',
    shareMessage: 'प्रसवपछि महिनावारी फर्कने, के अपेक्षा गर्ने — AWA',
    h2_1: '1. प्रसवपछि महिनावारी फर्कनु भनेको के हो?',
    body1: '“महिनावारी फर्कनु” ले प्रसवपछि तपाईंको महिनावारी फेरि आउनुलाई जनाउँछ। मासिक चक्र अनिवार्य रूपमा तुरुन्तै आफ्नो सामान्य लयमा फर्किँदैन।',
    highlightTitle: 'मुख्य बुँदा',
    highlightText: 'सबैमा लागू हुने कुनै एउटै समयतालिका छैन।',
    h2_2: '2. तपाईंको महिनावारी कहिले फर्कन सक्छ?',
    body2: 'समय धेरै हदसम्म स्तनपानमा निर्भर गर्छ। स्तनपानबिना, तपाईंको महिनावारी सामान्यतया करिब 6 देखि 8 हप्तामा फर्कन सक्छ। पूर्ण स्तनपानसहित, यो धेरै महिनासम्म ढिलो हुन सक्छ।',
    simpleInfoTitle1: 'स्तनपानबिना',
    simpleInfoText1: 'सामान्यतया करिब 6 देखि 8 हप्ता।',
    simpleInfoTitle2: 'पूर्ण स्तनपानसहित',
    simpleInfoText2: 'फिर्ती धेरै महिनासम्म ढिलो हुन सक्छ।',
    h2_3: '3. चक्र फर्कने ढाँचा',
    body3: 'प्रसवपछि चक्र बिस्तारै फर्कन्छ। स्तनपानले तपाईंको महिनावारी फेरि कहिले देखिन्छ भन्नेलाई प्रभाव पार्न सक्छ।',
    schemaTitle: 'चक्रको क्रमिक फिर्ती',
    schemaSubtitle: 'एउटा सामान्य मार्गदर्शन, चरणबद्ध',
    cycleStages: [
      {title: 'प्रसवपछि', text: 'जन्मपछि मासिक चक्र अस्थायी रूपमा रोकिन्छ।'},
      {title: 'सुत्केरीपछिको अवधि', text: 'शरीर बिस्तारै निको हुन्छ र हर्मोनको स्तर फेरिन्छ।'},
      {title: 'स्तनपान', text: 'स्तनपानले तपाईंको महिनावारी फर्कन ढिलो गर्न सक्छ, तर यसको असर व्यक्तिपिच्छे फरक हुन्छ।'},
      {title: 'महिनावारी फर्कने', text: 'तपाईंको पहिलो महिनावारी केही हप्ता वा धेरै महिनापछि फर्कन सक्छ।'},
      {title: 'पहिला चक्रहरू', text: 'चक्रहरू बिस्तारै सामान्य लयमा फर्कनुअघि अनियमित हुन सक्छन्।'},
    ],
    schemaNoteText: 'सबैका लागि उस्तै समयतालिका हुँदैन। तपाईंको महिनावारी कहिले फर्कन्छ व्यक्तिपिच्छे, विशेष गरी स्तनपानअनुसार, फरक हुन सक्छ।',
    h2_4: '4. पहिला चक्रहरू',
    body4: 'तपाईंको महिनावारी फर्कँदा, पहिला चक्रहरू गर्भावस्थाअघिका चक्रभन्दा फरक हुन सक्छन्। विशेष गरी, ती सुरुमा अनियमित हुन सक्छन्।',
    card1Title: 'फेरिने लय',
    card1Text: 'चक्रलाई परिचित लयमा फर्कन समय लाग्न सक्छ।',
    card2Title: 'फरक बहाव',
    card2Text: 'बहाव गर्भावस्थाअघि तपाईंले देखेकोभन्दा फरक हुन सक्छ।',
    h2_5: '5. तपाईं के अवलोकन गर्न सक्नुहुन्छ?',
    body5: 'सरल अनुगमनले तपाईंलाई समयसँगै आफ्नो चक्र कसरी बदलिन्छ राम्ररी अवलोकन गर्न मद्दत गर्छ।',
    observations: [
      {title: 'मितिहरू', text: 'आफ्नो महिनावारीको पहिलो दिन टिप्नुहोस्।'},
      {title: 'लय', text: 'चक्रहरूबीचको अन्तराल बिस्तारै अवलोकन गर्नुहोस्।'},
      {title: 'बहाव', text: 'तपाईंका लागि सामान्य भएकोसँग तुलना गर्दा कुनै परिवर्तन केवल अवलोकन गर्नुहोस्।'},
    ],
    h2_6: '6. सल्लाह कहिले लिनुपर्छ?',
    body6: 'केही कुरा असामान्य, लगातार वा चिन्ताजनक लागे, स्वास्थ्यकर्मीसँग सल्लाह लिनुहोस्।',
    warningSigns: [
      'तपाईंलाई असामान्य लाग्ने रक्तस्राव',
      'ठूलो वा लगातार दुखाइ',
      'ज्वरो वा ठूलो असहजता',
      'तपाईंलाई चिन्तित बनाउने कुनै नयाँ लक्षण',
    ],
    summaryTitle: 'मुख्य कुराहरू',
    summaryPoints: [
      'प्रसवपछि महिनावारी फर्कनु भनेको प्रसवपछि तपाईंको महिनावारी फेरि आउनु हो।',
      'स्तनपानले तपाईंको महिनावारी फर्कन ढिलो गर्न सक्छ।',
      'पहिला चक्रहरू अनियमित हुन सक्छन्।',
      'मितिहरू टिप्नाले तपाईंको चक्र कसरी बदलिन्छ अनुगमन गर्न मद्दत गर्न सक्छ।',
    ],
    disclaimerText: 'जानकारीमूलक सामग्री। समयतालिकाहरू हरेक अवस्थाअनुसार फरक हुन सक्छन् र चिकित्सकीय सल्लाहको स्थान लिँदैनन्।',
  },
  si: {
    badge: 'FREEMIUM • ප්‍රසූතියෙන් පසු',
    title: 'ප්‍රසූතියෙන් පසු ඔසප් නැවත පැමිණීම,\nඅපේක්ෂා කළ යුත්තේ කුමක්ද',
    metaDuration: 'කියවීමට මිනිත්තු 5',
    metaType: 'මාර්ගෝපදේශය',
    intro: 'ප්‍රසූතියෙන් පසු, ඔබේ ඔසප් නැවත පැමිණීමට කාලයක් ගත විය හැක. කාලය, අනෙක් දේ අතර, මව්කිරි පෙවීම අනුව වෙනස් වන අතර, සෑම පුද්ගලයෙකුටම මෙම කාලය වෙනස් ලෙස අත්විඳිය හැක.',
    shareMessage: 'ප්‍රසූතියෙන් පසු ඔසප් නැවත පැමිණීම, අපේක්ෂා කළ යුත්තේ කුමක්ද — AWA',
    h2_1: '1. ප්‍රසූතියෙන් පසු ඔසප් නැවත පැමිණීම යනු කුමක්ද?',
    body1: '“ඔසප් නැවත පැමිණීම” යන්නෙන් ප්‍රසූතියෙන් පසු ඔබේ ඔසප් නැවත පැමිණීම අදහස් කෙරේ. ඔසප් චක්‍රය අනිවාර්යයෙන්ම වහාම එහි සුපුරුදු රිද්මයට නැවත නොපැමිණේ.',
    highlightTitle: 'ප්‍රධාන කරුණ',
    highlightText: 'සෑම කෙනෙකුටම අදාළ වන තනි කාල රාමුවක් නැත.',
    h2_2: '2. ඔබේ ඔසප් නැවත පැමිණිය හැක්කේ කවදාද?',
    body2: 'කාලය බොහෝ දුරට රඳා පවතින්නේ මව්කිරි පෙවීම මතය. මව්කිරි පෙවීමකින් තොරව, ඔබේ ඔසප් සාමාන්‍යයෙන් සති 6 සිට 8 දක්වා නැවත පැමිණිය හැක. සම්පූර්ණයෙන්ම මව්කිරි පෙවීමත් සමඟ, එය මාස කිහිපයකින් ප්‍රමාද විය හැක.',
    simpleInfoTitle1: 'මව්කිරි පෙවීමකින් තොරව',
    simpleInfoText1: 'සාමාන්‍යයෙන් සති 6 සිට 8 දක්වා.',
    simpleInfoTitle2: 'සම්පූර්ණයෙන්ම මව්කිරි පෙවීමත් සමඟ',
    simpleInfoText2: 'නැවත පැමිණීම මාස කිහිපයකින් ප්‍රමාද විය හැක.',
    h2_3: '3. චක්‍රය නැවත පැමිණීමේ රටාව',
    body3: 'ප්‍රසූතියෙන් පසු චක්‍රය ක්‍රමයෙන් නැවත පැමිණේ. මව්කිරි පෙවීමට ඔබේ ඔසප් නැවත දිස්වන වේලාවට බලපෑ හැක.',
    schemaTitle: 'චක්‍රය ක්‍රමයෙන් නැවත පැමිණීම',
    schemaSubtitle: 'පියවරෙන් පියවර සාමාන්‍ය මාර්ගෝපදේශයක්',
    cycleStages: [
      {title: 'ප්‍රසූතියෙන් පසු', text: 'ප්‍රසූතියෙන් පසු ඔසප් චක්‍රය තාවකාලිකව නතර වේ.'},
      {title: 'ප්‍රසූතියෙන් පසු කාලය', text: 'ශරීරය ක්‍රමයෙන් යථා තත්ත්වයට පැමිණෙන අතර හෝමෝන මට්ටම් මාරු වේ.'},
      {title: 'මව්කිරි පෙවීම', text: 'මව්කිරි පෙවීම ඔබේ ඔසප් නැවත පැමිණීම ප්‍රමාද කළ හැකි නමුත්, එහි බලපෑම පුද්ගලයාගෙන් පුද්ගලයාට වෙනස් වේ.'},
      {title: 'ඔසප් නැවත පැමිණීම', text: 'ඔබේ පළමු ඔසප් සති කිහිපයකින් හෝ මාස කිහිපයකින් නැවත පැමිණිය හැක.'},
      {title: 'පළමු චක්‍ර', text: 'චක්‍ර ක්‍රමයෙන් ඒවායේ සුපුරුදු රිද්මයට නැවත පැමිණීමට පෙර අක්‍රමවත් විය හැක.'},
    ],
    schemaNoteText: 'සෑම කෙනෙකුටම සමාන කාල රාමුවක් නැත. ඔබේ ඔසප් නැවත පැමිණෙන වේලාව, විශේෂයෙන් මව්කිරි පෙවීම අනුව, පුද්ගලයාගෙන් පුද්ගලයාට වෙනස් විය හැක.',
    h2_4: '4. පළමු චක්‍ර',
    body4: 'ඔබේ ඔසප් නැවත පැමිණෙන විට, පළමු චක්‍ර ගර්භණී කාලයට පෙර ඒවාට වඩා වෙනස් විය හැක. විශේෂයෙන්, ඒවා මුලදී අක්‍රමවත් විය හැක.',
    card1Title: 'වෙනස් වන රිද්මය',
    card1Text: 'චක්‍රයට හුරුපුරුදු රිද්මයකට නැවත හැඩගැසීමට කාලය ගත විය හැක.',
    card2Title: 'වෙනස් ගලනය',
    card2Text: 'ගලනය ගර්භණී කාලයට පෙර ඔබ නිරීක්ෂණය කළ දේට වඩා වෙනස් විය හැක.',
    h2_5: '5. ඔබට නිරීක්ෂණය කළ හැක්කේ කුමක්ද?',
    body5: 'සරල නිරීක්ෂණය කාලයත් සමඟ ඔබේ චක්‍රය වෙනස් වන ආකාරය වඩා හොඳින් නිරීක්ෂණය කිරීමට ඔබට උපකාරී වේ.',
    observations: [
      {title: 'දින', text: 'ඔබේ ඔසප්වල පළමු දිනය සටහන් කරන්න.'},
      {title: 'රිද්මය', text: 'චක්‍ර අතර පරතරය ක්‍රමයෙන් නිරීක්ෂණය කරන්න.'},
      {title: 'ගලනය', text: 'ඔබට සුපුරුදු දේට සාපේක්ෂව ඕනෑම වෙනස්කම් සරලව නිරීක්ෂණය කරන්න.'},
    ],
    h2_6: '6. ඔබ උපදෙස් ඉල්ලිය යුත්තේ කවදාද?',
    body6: 'යමක් අසාමාන්‍ය, දිගටම පවතින, හෝ කනස්සල්ලට කරුණක් ලෙස පෙනේ නම්, සෞඛ්‍ය වෘත්තිකයෙකුගෙන් උපදෙස් ලබා ගන්න.',
    warningSigns: [
      'ඔබට අසාමාන්‍ය ලෙස පෙනෙන ලේ ගැලීම',
      'සැලකිය යුතු හෝ දිගටම පවතින වේදනාව',
      'උණ හෝ සැලකිය යුතු අපහසුතාව',
      'ඔබව කනස්සල්ලට පත් කරන ඕනෑම නව රෝග ලක්ෂණයක්',
    ],
    summaryTitle: 'ප්‍රධාන කරුණු',
    summaryPoints: [
      'ප්‍රසූතියෙන් පසු ඔසප් නැවත පැමිණීම යනු ප්‍රසූතියෙන් පසු ඔබේ ඔසප් නැවත පැමිණීමයි.',
      'මව්කිරි පෙවීම ඔබේ ඔසප් නැවත පැමිණීම ප්‍රමාද කළ හැක.',
      'පළමු චක්‍ර අක්‍රමවත් විය හැක.',
      'දින සටහන් කිරීම ඔබේ චක්‍රය වෙනස් වන ආකාරය නිරීක්ෂණය කිරීමට ඔබට උපකාරී විය හැක.',
    ],
    disclaimerText: 'තොරතුරු අන්තර්ගතයකි. කාල රාමු සෑම තත්ත්වයක් අනුව වෙනස් විය හැකි අතර වෛද්‍ය උපදෙස් වෙනුවට නොපවතී.',
  },
  th: {
    badge: 'ฟรีเมียม • หลังคลอด',
    title: 'การกลับมาของประจำเดือนหลังคลอด\nสิ่งที่คาดหวังได้',
    metaDuration: 'อ่าน 5 นาที',
    metaType: 'คู่มือ',
    intro: 'หลังคลอด การกลับมาของประจำเดือนอาจใช้เวลา ช่วงเวลาแตกต่างกันไปตามการให้นมแม่เป็นต้น และแต่ละคนอาจประสบช่วงนี้ต่างกัน',
    shareMessage: 'การกลับมาของประจำเดือนหลังคลอด สิ่งที่คาดหวังได้ — AWA',
    h2_1: '1. การกลับมาของประจำเดือนหลังคลอดคืออะไร?',
    body1: '“การกลับมาของประจำเดือน” หมายถึงประจำเดือนกลับมาหลังคลอด รอบเดือนไม่จำเป็นต้องกลับสู่จังหวะปกติทันที',
    highlightTitle: 'ประเด็นสำคัญ',
    highlightText: 'ไม่มีกรอบเวลาเดียวที่ใช้ได้กับทุกคน',
    h2_2: '2. ประจำเดือนกลับมาได้เมื่อไร?',
    body2: 'ช่วงเวลาส่วนใหญ่ขึ้นอยู่กับการให้นมแม่ หากไม่ให้นมแม่ ประจำเดือนมักกลับมาราว 6 ถึง 8 สัปดาห์ หากให้นมแม่อย่างเดียว อาจล่าช้าไปหลายเดือน',
    simpleInfoTitle1: 'หากไม่ให้นมแม่',
    simpleInfoText1: 'โดยทั่วไปราว 6 ถึง 8 สัปดาห์',
    simpleInfoTitle2: 'หากให้นมแม่อย่างเดียว',
    simpleInfoText2: 'การกลับมาอาจล่าช้าไปหลายเดือน',
    h2_3: '3. รูปแบบการกลับมาของรอบเดือน',
    body3: 'รอบเดือนกลับมาทีละน้อยหลังคลอด การให้นมแม่อาจมีอิทธิพลต่อเวลาที่ประจำเดือนปรากฏอีกครั้ง',
    schemaTitle: 'การกลับมาของรอบเดือนทีละน้อย',
    schemaSubtitle: 'แนวทางทั่วไป ทีละขั้น',
    cycleStages: [
      {title: 'หลังคลอด', text: 'รอบเดือนหยุดชั่วคราวหลังคลอด'},
      {title: 'ช่วงหลังคลอด', text: 'ร่างกายค่อย ๆ ฟื้นตัวและระดับฮอร์โมนเปลี่ยนไป'},
      {title: 'การให้นมแม่', text: 'การให้นมแม่อาจทำให้ประจำเดือนกลับมาช้าลง แต่ผลแตกต่างกันในแต่ละคน'},
      {title: 'การกลับมาของประจำเดือน', text: 'ประจำเดือนครั้งแรกอาจกลับมาหลังไม่กี่สัปดาห์หรือหลายเดือน'},
      {title: 'รอบเดือนแรก ๆ', text: 'รอบเดือนอาจไม่สม่ำเสมอก่อนจะค่อย ๆ กลับสู่จังหวะปกติ'},
    ],
    schemaNoteText: 'ไม่มีกรอบเวลาเหมือนกันสำหรับทุกคน เวลาที่ประจำเดือนกลับมาอาจต่างกันในแต่ละคน โดยเฉพาะตามการให้นมแม่',
    h2_4: '4. รอบเดือนแรก ๆ',
    body4: 'เมื่อประจำเดือนกลับมา รอบเดือนแรก ๆ อาจต่างจากก่อนตั้งครรภ์ โดยเฉพาะอาจไม่สม่ำเสมอในช่วงแรก',
    card1Title: 'จังหวะที่แปรผัน',
    card1Text: 'รอบเดือนอาจใช้เวลากลับสู่จังหวะที่คุ้นเคย',
    card2Title: 'ปริมาณที่ต่างออกไป',
    card2Text: 'ปริมาณอาจต่างจากที่คุณสังเกตก่อนตั้งครรภ์',
    h2_5: '5. คุณสังเกตอะไรได้บ้าง?',
    body5: 'การติดตามง่าย ๆ ช่วยให้คุณสังเกตว่ารอบเดือนเปลี่ยนไปอย่างไรตามเวลา',
    observations: [
      {title: 'วันที่', text: 'จดวันแรกของประจำเดือนของคุณ'},
      {title: 'จังหวะ', text: 'ค่อย ๆ สังเกตช่วงห่างระหว่างรอบเดือน'},
      {title: 'ปริมาณ', text: 'เพียงสังเกตการเปลี่ยนแปลงเมื่อเทียบกับที่เป็นปกติสำหรับคุณ'},
    ],
    h2_6: '6. เมื่อไรควรขอคำแนะนำ?',
    body6: 'หากมีสิ่งที่ดูผิดปกติ คงอยู่ หรือน่ากังวล ให้ขอคำแนะนำจากบุคลากรทางการแพทย์',
    warningSigns: [
      'เลือดที่ออกดูผิดปกติสำหรับคุณ',
      'อาการปวดมากหรือต่อเนื่อง',
      'ไข้หรือความไม่สบายมาก',
      'อาการใหม่ที่ทำให้คุณกังวล',
    ],
    summaryTitle: 'ประเด็นสำคัญ',
    summaryPoints: [
      'การกลับมาของประจำเดือนหลังคลอดหมายถึงประจำเดือนกลับมาหลังคลอด',
      'การให้นมแม่อาจทำให้ประจำเดือนกลับมาช้าลง',
      'รอบเดือนแรก ๆ อาจไม่สม่ำเสมอ',
      'การจดวันที่ช่วยให้ติดตามว่ารอบเดือนเปลี่ยนไปอย่างไร',
    ],
    disclaimerText: 'เนื้อหาเพื่อให้ข้อมูล กรอบเวลาอาจแตกต่างกันตามแต่ละสถานการณ์ และไม่ได้ทดแทนคำแนะนำทางการแพทย์',
  },
  vi: {
    badge: 'FREEMIUM • SAU SINH',
    title: 'Kỳ kinh trở lại sau sinh,\nđiều cần biết',
    metaDuration: '5 phút đọc',
    metaType: 'Hướng dẫn',
    intro: 'Sau khi sinh, kỳ kinh trở lại có thể cần một thời gian. Thời điểm khác nhau tùy thuộc vào việc cho con bú, cùng nhiều yếu tố khác, và mỗi người có thể trải qua giai đoạn này khác nhau.',
    shareMessage: 'Kỳ kinh trở lại sau sinh, điều cần biết — AWA',
    h2_1: '1. Kỳ kinh trở lại sau sinh là gì?',
    body1: '“Kỳ kinh trở lại” chỉ việc kỳ kinh của bạn quay lại sau khi sinh. Chu kỳ kinh nguyệt không nhất thiết trở lại nhịp điệu thông thường ngay lập tức.',
    highlightTitle: 'Điểm chính',
    highlightText: 'Không có một mốc thời gian duy nhất áp dụng cho tất cả mọi người.',
    h2_2: '2. Khi nào kỳ kinh có thể trở lại?',
    body2: 'Thời điểm phần lớn phụ thuộc vào việc cho con bú. Nếu không cho con bú, kỳ kinh thường có thể trở lại vào khoảng 6 đến 8 tuần. Nếu cho con bú hoàn toàn, nó có thể bị trì hoãn vài tháng.',
    simpleInfoTitle1: 'Không cho con bú',
    simpleInfoText1: 'Thường khoảng 6 đến 8 tuần.',
    simpleInfoTitle2: 'Cho con bú hoàn toàn',
    simpleInfoText2: 'Kỳ kinh trở lại có thể bị trì hoãn vài tháng.',
    h2_3: '3. Quy luật chu kỳ trở lại',
    body3: 'Chu kỳ trở lại dần dần sau khi sinh. Việc cho con bú có thể ảnh hưởng đến thời điểm kỳ kinh xuất hiện lại.',
    schemaTitle: 'Chu kỳ trở lại dần dần',
    schemaSubtitle: 'Một hướng dẫn chung, từng bước một',
    cycleStages: [
      {title: 'Sau khi sinh', text: 'Chu kỳ kinh nguyệt tạm dừng sau khi sinh.'},
      {title: 'Giai đoạn sau sinh', text: 'Cơ thể hồi phục dần và nồng độ hormone thay đổi.'},
      {title: 'Cho con bú', text: 'Việc cho con bú có thể làm trì hoãn kỳ kinh trở lại, nhưng tác động của nó khác nhau giữa từng người.'},
      {title: 'Kỳ kinh trở lại', text: 'Kỳ kinh đầu tiên của bạn có thể trở lại sau vài tuần hoặc vài tháng.'},
      {title: 'Những chu kỳ đầu tiên', text: 'Các chu kỳ có thể không đều trước khi dần ổn định trở lại nhịp điệu thông thường.'},
    ],
    schemaNoteText: 'Không có một mốc thời gian giống hệt nhau cho tất cả mọi người. Thời điểm kỳ kinh trở lại có thể khác nhau giữa từng người, đặc biệt tùy theo việc cho con bú.',
    h2_4: '4. Những chu kỳ đầu tiên',
    body4: 'Khi kỳ kinh trở lại, những chu kỳ đầu tiên có thể khác với trước khi mang thai. Đặc biệt, chúng có thể không đều lúc ban đầu.',
    card1Title: 'Nhịp điệu thay đổi',
    card1Text: 'Chu kỳ có thể cần thời gian để ổn định trở lại một nhịp điệu quen thuộc.',
    card2Title: 'Lượng kinh khác',
    card2Text: 'Lượng kinh có thể khác với những gì bạn quan sát được trước khi mang thai.',
    h2_5: '5. Bạn có thể quan sát những gì?',
    body5: 'Theo dõi đơn giản giúp bạn quan sát tốt hơn chu kỳ thay đổi thế nào theo thời gian.',
    observations: [
      {title: 'Ngày', text: 'Ghi lại ngày đầu tiên của kỳ kinh.'},
      {title: 'Nhịp điệu', text: 'Dần dần quan sát khoảng cách giữa các chu kỳ.'},
      {title: 'Lượng kinh', text: 'Chỉ cần quan sát mọi thay đổi so với những gì bình thường với bạn.'},
    ],
    h2_6: '6. Khi nào nên tìm lời khuyên?',
    body6: 'Nếu có điều gì có vẻ bất thường, kéo dài hoặc đáng lo, hãy tìm lời khuyên từ nhân viên y tế.',
    warningSigns: [
      'Ra máu có vẻ bất thường với bạn',
      'Đau đáng kể hoặc kéo dài',
      'Sốt hoặc khó chịu đáng kể',
      'Bất kỳ triệu chứng mới nào khiến bạn lo lắng',
    ],
    summaryTitle: 'Những điểm chính cần nhớ',
    summaryPoints: [
      'Kỳ kinh trở lại sau sinh chỉ việc kỳ kinh của bạn quay lại sau khi sinh.',
      'Việc cho con bú có thể làm trì hoãn kỳ kinh trở lại.',
      'Những chu kỳ đầu tiên có thể không đều.',
      'Ghi lại các ngày có thể giúp bạn theo dõi chu kỳ thay đổi thế nào.',
    ],
    disclaimerText: 'Nội dung mang tính thông tin. Các mốc thời gian có thể khác nhau tùy từng hoàn cảnh và không thay thế lời khuyên y khoa.',
  },
  uz: {
    badge: 'FREEMIUM • TUGʻRUQDAN KEYIN',
    title: 'Tugʻruqdan keyin hayzning qaytishi,\nnimalarni kutish kerak',
    metaDuration: '5 daq oʻqish',
    metaType: 'Qoʻllanma',
    intro: 'Tugʻruqdan keyin hayzning qaytishi biroz vaqt olishi mumkin. Vaqt, jumladan, emizishga qarab farq qiladi va har kim bu davrni boshqacha boshdan kechirishi mumkin.',
    shareMessage: 'Tugʻruqdan keyin hayzning qaytishi, nimalarni kutish kerak — AWA',
    h2_1: '1. Tugʻruqdan keyin hayzning qaytishi nima?',
    body1: '“Hayzning qaytishi” tugʻruqdan keyin hayzingiz qaytishini bildiradi. Hayz sikli albatta darhol odatiy ritmiga qaytmaydi.',
    highlightTitle: 'Asosiy nuqta',
    highlightText: 'Hamma uchun amal qiladigan yagona muddat yoʻq.',
    h2_2: '2. Hayz qachon qaytishi mumkin?',
    body2: 'Vaqt asosan emizishga bogʻliq. Emizmasdan hayz odatda taxminan 6 haftadan 8 haftagacha qaytishi mumkin. Faqat emizish bilan esa u bir necha oyga kechikishi mumkin.',
    simpleInfoTitle1: 'Emizmasdan',
    simpleInfoText1: 'Odatda taxminan 6 haftadan 8 haftagacha.',
    simpleInfoTitle2: 'Faqat emizish bilan',
    simpleInfoText2: 'Qaytish bir necha oyga kechikishi mumkin.',
    h2_3: '3. Siklning qaytish ketma-ketligi',
    body3: 'Sikl tugʻruqdan keyin asta-sekin qaytadi. Emizish hayz qachon paydo boʻlishiga taʼsir qilishi mumkin.',
    schemaTitle: 'Siklning asta-sekin qaytishi',
    schemaSubtitle: 'Umumiy yoʻl-yoʻriq, bosqichma-bosqich',
    cycleStages: [
      {title: 'Tugʻruqdan keyin', text: 'Hayz sikli tugʻruqdan keyin vaqtincha toʻxtaydi.'},
      {title: 'Tugʻruqdan keyingi davr', text: 'Tana asta-sekin tiklanadi va gormon darajalari oʻzgaradi.'},
      {title: 'Emizish', text: 'Emizish hayzning qaytishini kechiktirishi mumkin, lekin uning taʼsiri odamdan odamga farq qiladi.'},
      {title: 'Hayzning qaytishi', text: 'Birinchi hayzingiz bir necha haftadan yoki bir necha oydan keyin qaytishi mumkin.'},
      {title: 'Dastlabki sikllar', text: 'Sikllar odatiy ritmiga asta-sekin tushishdan oldin notekis boʻlishi mumkin.'},
    ],
    schemaNoteText: 'Hamma uchun bir xil muddat yoʻq. Hayzning qaytish vaqti, ayniqsa emizishga qarab, odamdan odamga farq qilishi mumkin.',
    h2_4: '4. Dastlabki sikllar',
    body4: 'Hayz qaytganda, dastlabki sikllar homiladorlikdan oldingilardan farq qilishi mumkin. Xususan, ular dastlab notekis boʻlishi mumkin.',
    card1Title: 'Oʻzgaruvchan ritm',
    card1Text: 'Siklning tanish ritmga tushishi uchun vaqt kerak boʻlishi mumkin.',
    card2Title: 'Boshqacha oqim',
    card2Text: 'Oqim homiladorlikdan oldin kuzatganingizdan farq qilishi mumkin.',
    h2_5: '5. Nimani kuzatish mumkin?',
    body5: 'Oddiy kuzatuv siklingiz vaqt oʻtishi bilan qanday oʻzgarishini yaxshiroq kuzatishga yordam beradi.',
    observations: [
      {title: 'Sanalar', text: 'Hayzingizning birinchi kunini yozib qoʻying.'},
      {title: 'Ritm', text: 'Sikllar oraligʻini asta-sekin kuzating.'},
      {title: 'Oqim', text: 'Siz uchun odatiy boʻlganiga nisbatan har qanday oʻzgarishni shunchaki kuzating.'},
    ],
    h2_6: '6. Qachon maslahat olish kerak?',
    body6: 'Agar nimadir odatdan tashqari, doimiy yoki xavotirli tuyulsa, sogʻliqni saqlash mutaxassisidan maslahat oling.',
    warningSigns: [
      'Sizga odatdan tashqari tuyuladigan qon ketishi',
      'Sezilarli yoki doimiy ogʻriq',
      'Isitma yoki sezilarli noqulaylik',
      'Sizni xavotirga soladigan har qanday yangi alomat',
    ],
    summaryTitle: 'Asosiy xulosalar',
    summaryPoints: [
      'Tugʻruqdan keyin hayzning qaytishi tugʻruqdan keyin hayzingiz qaytishini bildiradi.',
      'Emizish hayzning qaytishini kechiktirishi mumkin.',
      'Dastlabki sikllar notekis boʻlishi mumkin.',
      'Sanalarni yozib borish siklingiz qanday oʻzgarishini kuzatishga yordam beradi.',
    ],
    disclaimerText: 'Maʼlumot uchun kontent. Muddatlar har bir vaziyatga qarab farq qilishi mumkin va tibbiy maslahatni almashtirmaydi.',
  },
  az: {
    badge: 'FREEMIUM • DOĞUŞDAN SONRA',
    title: 'Doğuşdan sonra aybaşının qayıtması,\nnələri gözləmək olar',
    metaDuration: '5 dəq oxu',
    metaType: 'Bələdçi',
    intro: 'Doğuşdan sonra aybaşınızın qayıtması bir qədər vaxt apara bilər. Vaxt, digər amillərlə yanaşı, əmizdirmədən asılı olaraq dəyişir və hər kəs bu dövrü fərqli yaşaya bilər.',
    shareMessage: 'Doğuşdan sonra aybaşının qayıtması, nələri gözləmək olar — AWA',
    h2_1: '1. Doğuşdan sonra aybaşının qayıtması nədir?',
    body1: '“Aybaşının qayıtması” doğuşdan sonra aybaşınızın yenidən başlamasına deyilir. Menstrual dövr mütləq dərhal adi ritminə qayıtmır.',
    highlightTitle: 'Əsas məqam',
    highlightText: 'Hamıya aid olan yeganə vaxt cədvəli yoxdur.',
    h2_2: '2. Aybaşınız nə vaxt qayıda bilər?',
    body2: 'Vaxt əsasən əmizdirmədən asılıdır. Əmizdirmə olmadıqda aybaşınız adətən təxminən 6–8 həftədə qayıda bilər. Eksklüziv əmizdirmə zamanı bu, bir neçə ay gecikə bilər.',
    simpleInfoTitle1: 'Əmizdirmə olmadan',
    simpleInfoText1: 'Adətən təxminən 6–8 həftə.',
    simpleInfoTitle2: 'Eksklüziv əmizdirmə ilə',
    simpleInfoText2: 'Qayıdış bir neçə ay gecikə bilər.',
    h2_3: '3. Dövrün qayıtma qanunauyğunluğu',
    body3: 'Dövr doğuşdan sonra tədricən qayıdır. Əmizdirmə aybaşınızın yenidən görünmə vaxtına təsir edə bilər.',
    schemaTitle: 'Dövrün tədricən qayıdışı',
    schemaSubtitle: 'Addım-addım ümumi bələdçi',
    cycleStages: [
      {title: 'Doğuşdan sonra', text: 'Menstrual dövr doğuşdan sonra müvəqqəti dayanır.'},
      {title: 'Doğuşdan sonrakı dövr', text: 'Bədən tədricən bərpa olunur və hormon səviyyələri dəyişir.'},
      {title: 'Əmizdirmə', text: 'Əmizdirmə aybaşınızın qayıtmasını gecikdirə bilər, lakin onun təsiri şəxsdən şəxsə dəyişir.'},
      {title: 'Aybaşının qayıtması', text: 'İlk aybaşınız bir neçə həftədən sonra və ya bir neçə aydan sonra qayıda bilər.'},
      {title: 'İlk dövrlər', text: 'Dövrlər adi ritmə tədricən oturmazdan əvvəl qeyri-müntəzəm ola bilər.'},
    ],
    schemaNoteText: 'Hamı üçün eyni vaxt cədvəli yoxdur. Aybaşınızın qayıtma vaxtı, xüsusilə əmizdirmədən asılı olaraq, şəxsdən şəxsə dəyişə bilər.',
    h2_4: '4. İlk dövrlər',
    body4: 'Aybaşınız qayıdanda ilk dövrlər hamiləlikdən əvvəlkilərdən fərqli ola bilər. Xüsusilə, əvvəlcə qeyri-müntəzəm ola bilər.',
    card1Title: 'Dəyişən ritm',
    card1Text: 'Dövrün tanış ritmə oturması vaxt apara bilər.',
    card2Title: 'Fərqli axın',
    card2Text: 'Axın hamiləlikdən əvvəl müşahidə etdiyinizdən fərqli ola bilər.',
    h2_5: '5. Nəyi müşahidə edə bilərsiniz?',
    body5: 'Sadə izləmə dövrünüzün zamanla necə dəyişdiyini daha yaxşı müşahidə etməyə kömək edir.',
    observations: [
      {title: 'Tarixlər', text: 'Aybaşınızın ilk gününü qeyd edin.'},
      {title: 'Ritm', text: 'Dövrlər arasındakı aralığı tədricən müşahidə edin.'},
      {title: 'Axın', text: 'Sizin üçün adi olandan hər hansı dəyişikliyi sadəcə müşahidə edin.'},
    ],
    h2_6: '6. Nə vaxt məsləhət almaq lazımdır?',
    body6: 'Nəsə qeyri-adi, davamlı və ya narahatedici görünürsə, tibb işçisindən məsləhət alın.',
    warningSigns: [
      'Sizə qeyri-adi görünən qanaxma',
      'Əhəmiyyətli və ya davamlı ağrı',
      'Hərarət və ya əhəmiyyətli narahatlıq',
      'Sizi narahat edən istənilən yeni simptom',
    ],
    summaryTitle: 'Əsas nəticələr',
    summaryPoints: [
      'Doğuşdan sonra aybaşının qayıtması doğuşdan sonra aybaşınızın yenidən başlaması deməkdir.',
      'Əmizdirmə aybaşınızın qayıtmasını gecikdirə bilər.',
      'İlk dövrlər qeyri-müntəzəm ola bilər.',
      'Tarixləri qeyd etmək dövrünüzün necə dəyişdiyini izləməyə kömək edə bilər.',
    ],
    disclaimerText: 'Məlumat xarakterli məzmun. Vaxt cədvəlləri hər vəziyyətdən asılı olaraq dəyişə bilər və tibbi məsləhəti əvəz etmir.',
  },
  ka: {
    badge: 'FREEMIUM • მშობიარობის შემდგომი პერიოდი',
    title: 'მენსტრუაციის დაბრუნება მშობიარობის შემდეგ,\nრას უნდა ელოდეთ',
    metaDuration: '5 წთ საკითხავი',
    metaType: 'გზამკვლევი',
    intro: 'მშობიარობის შემდეგ მენსტრუაციის დაბრუნებას შეიძლება გარკვეული დრო დასჭირდეს. დრო, სხვა ფაქტორებთან ერთად, ძუძუთი კვებაზეა დამოკიდებული და თითოეულმა ადამიანმა ეს პერიოდი შეიძლება განსხვავებულად განიცადოს.',
    shareMessage: 'მენსტრუაციის დაბრუნება მშობიარობის შემდეგ, რას უნდა ელოდეთ — AWA',
    h2_1: '1. რა არის მენსტრუაციის დაბრუნება მშობიარობის შემდეგ?',
    body1: '„მენსტრუაციის დაბრუნება“ ნიშნავს თქვენი მენსტრუაციის ხელახლა გამოჩენას მშობიარობის შემდეგ. მენსტრუაციული ციკლი აუცილებლად დაუყოვნებლივ არ უბრუნდება თავის ჩვეულ რიტმს.',
    highlightTitle: 'მთავარი საკითხი',
    highlightText: 'ერთი ვადა, რომელიც ყველას ეხება, არ არსებობს.',
    h2_2: '2. როდის შეიძლება დაბრუნდეს თქვენი მენსტრუაცია?',
    body2: 'ვადა დიდწილად ძუძუთი კვებაზეა დამოკიდებული. ძუძუთი კვების გარეშე თქვენი მენსტრუაცია, როგორც წესი, დაახლოებით 6-დან 8 კვირამდე შეიძლება დაბრუნდეს. ექსკლუზიური ძუძუთი კვების დროს ის რამდენიმე თვით შეიძლება დაგვიანდეს.',
    simpleInfoTitle1: 'ძუძუთი კვების გარეშე',
    simpleInfoText1: 'ზოგადად დაახლოებით 6-დან 8 კვირამდე.',
    simpleInfoTitle2: 'ექსკლუზიური ძუძუთი კვებისას',
    simpleInfoText2: 'დაბრუნება რამდენიმე თვით შეიძლება დაგვიანდეს.',
    h2_3: '3. ციკლის დაბრუნების სურათი',
    body3: 'ციკლი მშობიარობის შემდეგ ეტაპობრივად ბრუნდება. ძუძუთი კვებამ შეიძლება გავლენა მოახდინოს მენსტრუაციის ხელახლა გამოჩენის დროზე.',
    schemaTitle: 'ციკლის ეტაპობრივი დაბრუნება',
    schemaSubtitle: 'ზოგადი გზამკვლევი, ნაბიჯ-ნაბიჯ',
    cycleStages: [
      {title: 'მშობიარობის შემდეგ', text: 'მენსტრუაციული ციკლი მშობიარობის შემდეგ დროებით ჩერდება.'},
      {title: 'მშობიარობის შემდგომი პერიოდი', text: 'სხეული ეტაპობრივად გამოჯანმრთელდება და ჰორმონების დონე იცვლება.'},
      {title: 'ძუძუთი კვება', text: 'ძუძუთი კვებამ შეიძლება მენსტრუაციის დაბრუნება შეაგვიანოს, მაგრამ მისი ეფექტი ადამიანიდან ადამიანამდე განსხვავდება.'},
      {title: 'მენსტრუაციის დაბრუნება', text: 'თქვენი პირველი მენსტრუაცია რამდენიმე კვირის ან რამდენიმე თვის შემდეგ შეიძლება დაბრუნდეს.'},
      {title: 'პირველი ციკლები', text: 'ციკლები შეიძლება არარეგულარული იყოს, სანამ ეტაპობრივად ჩვეულ რიტმს დაუბრუნდება.'},
    ],
    schemaNoteText: 'ყველასთვის იდენტური ვადა არ არსებობს. მენსტრუაციის დაბრუნების დრო ადამიანიდან ადამიანამდე შეიძლება განსხვავდებოდეს, განსაკუთრებით ძუძუთი კვების მიხედვით.',
    h2_4: '4. პირველი ციკლები',
    body4: 'როცა მენსტრუაცია ბრუნდება, პირველი ციკლები შეიძლება ორსულობამდელისგან განსხვავდებოდეს. კერძოდ, თავიდან ისინი შეიძლება არარეგულარული იყოს.',
    card1Title: 'ცვალებადი რიტმი',
    card1Text: 'ციკლს შეიძლება დრო დასჭირდეს ნაცნობ რიტმში დასაბრუნებლად.',
    card2Title: 'განსხვავებული ნაკადი',
    card2Text: 'ნაკადი შეიძლება ორსულობამდე დაკვირვებულისგან განსხვავდებოდეს.',
    h2_5: '5. რა შეიძლება დააკვირდეთ?',
    body5: 'მარტივი კონტროლი გეხმარებათ უკეთ დააკვირდეთ, როგორ იცვლება თქვენი ციკლი დროთა განმავლობაში.',
    observations: [
      {title: 'თარიღები', text: 'აღნიშნეთ თქვენი მენსტრუაციის პირველი დღე.'},
      {title: 'რიტმი', text: 'ეტაპობრივად დააკვირდით ციკლებს შორის ინტერვალს.'},
      {title: 'ნაკადი', text: 'უბრალოდ დააკვირდით ცვლილებებს თქვენთვის ჩვეულთან შედარებით.'},
    ],
    h2_6: '6. როდის უნდა ითხოვოთ რჩევა?',
    body6: 'თუ რამე უჩვეულოდ, გაგრძელებულად ან შემაშფოთებლად გეჩვენებათ, მიმართეთ ჯანდაცვის სპეციალისტის რჩევას.',
    warningSigns: [
      'სისხლდენა, რომელიც თქვენთვის უჩვეულო ჩანს',
      'მნიშვნელოვანი ან გაგრძელებული ტკივილი',
      'ცხელება ან მნიშვნელოვანი დისკომფორტი',
      'ნებისმიერი ახალი სიმპტომი, რომელიც გაწუხებთ',
    ],
    summaryTitle: 'მთავარი დასკვნები',
    summaryPoints: [
      'მენსტრუაციის დაბრუნება მშობიარობის შემდეგ ნიშნავს თქვენი მენსტრუაციის ხელახლა გამოჩენას მშობიარობის შემდეგ.',
      'ძუძუთი კვებამ შეიძლება მენსტრუაციის დაბრუნება შეაგვიანოს.',
      'პირველი ციკლები შეიძლება არარეგულარული იყოს.',
      'თარიღების აღნიშვნა გეხმარებათ თქვენი ციკლის ცვლილების კონტროლში.',
    ],
    disclaimerText: 'საინფორმაციო შინაარსი. ვადები თითოეული სიტუაციის მიხედვით შეიძლება განსხვავდებოდეს და სამედიცინო რჩევას არ ანაცვლებს.',
  },
  hy: {
    badge: 'FREEMIUM • ՀԵՏԾՆՆԴՅԱՆ ՇՐՋԱՆ',
    title: 'Դաշտանի վերադարձը ծննդաբերությունից հետո,\nինչ սպասել',
    metaDuration: '5 ր կարդալու համար',
    metaType: 'Ուղեցույց',
    intro: 'Ծննդաբերությունից հետո ձեր դաշտանի վերադարձը կարող է ժամանակ պահանջել: Ժամանակը տարբերվում է, ի թիվս այլոց, կրծքով կերակրումից կախված, և յուրաքանչյուր մարդ կարող է այս շրջանն ապրել տարբեր կերպ:',
    shareMessage: 'Դաշտանի վերադարձը ծննդաբերությունից հետո, ինչ սպասել — AWA',
    h2_1: '1. Ի՞նչ է դաշտանի վերադարձը ծննդաբերությունից հետո',
    body1: '«Դաշտանի վերադարձը» նշանակում է, որ ձեր դաշտանը վերադառնում է ծննդաբերությունից հետո: Դաշտանային ցիկլը պարտադիր չէ անմիջապես վերադառնա իր սովորական ռիթմին:',
    highlightTitle: 'Հիմնական կետ',
    highlightText: 'Չկա մեկ ժամանակացույց, որը կիրառվում է բոլորի համար:',
    h2_2: '2. Ե՞րբ կարող է դաշտանը վերադառնալ',
    body2: 'Ժամանակը մեծապես կախված է կրծքով կերակրումից: Առանց կրծքով կերակրման՝ ձեր դաշտանը սովորաբար կարող է վերադառնալ մոտ 6–8 շաբաթից: Բացառապես կրծքով կերակրելիս այն կարող է ուշանալ մի քանի ամսով:',
    simpleInfoTitle1: 'Առանց կրծքով կերակրման',
    simpleInfoText1: 'Սովորաբար մոտ 6–8 շաբաթից:',
    simpleInfoTitle2: 'Բացառապես կրծքով կերակրելիս',
    simpleInfoText2: 'Վերադարձը կարող է ուշանալ մի քանի ամսով:',
    h2_3: '3. Ցիկլի վերադարձի օրինաչափությունը',
    body3: 'Ցիկլը աստիճանաբար վերադառնում է ծննդաբերությունից հետո: Կրծքով կերակրումը կարող է ազդել դաշտանի կրկին հայտնվելու ժամանակի վրա:',
    schemaTitle: 'Ցիկլի աստիճանական վերադարձ',
    schemaSubtitle: 'Ընդհանուր ուղեցույց՝ քայլ առ քայլ',
    cycleStages: [
      {title: 'Ծննդաբերությունից հետո', text: 'Դաշտանային ցիկլը ժամանակավորապես դադարում է ծննդաբերությունից հետո:'},
      {title: 'Հետծննդյան շրջան', text: 'Մարմինը աստիճանաբար վերականգնվում է, և հորմոնների մակարդակները տեղաշարժվում են:'},
      {title: 'Կրծքով կերակրում', text: 'Կրծքով կերակրումը կարող է հետաձգել ձեր դաշտանի վերադարձը, սակայն դրա ազդեցությունը տարբերվում է մարդուց մարդ:'},
      {title: 'Դաշտանի վերադարձ', text: 'Ձեր առաջին դաշտանը կարող է վերադառնալ մի քանի շաբաթից կամ մի քանի ամսից:'},
      {title: 'Առաջին ցիկլերը', text: 'Ցիկլերը կարող են անկանոն լինել՝ նախքան աստիճանաբար իրենց սովորական ռիթմին վերադառնալը:'},
    ],
    schemaNoteText: 'Չկա բոլորի համար նույնական ժամանակացույց: Դաշտանի վերադարձի ժամանակը կարող է տարբերվել մարդուց մարդ, մասնավորապես կրծքով կերակրումից կախված:',
    h2_4: '4. Առաջին ցիկլերը',
    body4: 'Երբ դաշտանը վերադառնում է, առաջին ցիկլերը կարող են տարբերվել հղիությունից առաջվանից: Մասնավորապես, դրանք կարող են սկզբում անկանոն լինել:',
    card1Title: 'Փոփոխական ռիթմ',
    card1Text: 'Ցիկլին կարող է ժամանակ պահանջվել՝ ծանոթ ռիթմին վերադառնալու համար:',
    card2Title: 'Տարբեր արտահոսք',
    card2Text: 'Արտահոսքը կարող է տարբերվել հղիությունից առաջ դիտարկածից:',
    h2_5: '5. Ինչ կարող եք դիտարկել',
    body5: 'Պարզ հետևումը օգնում է ավելի լավ դիտարկել, թե ինչպես է ձեր ցիկլը փոխվում ժամանակի ընթացքում:',
    observations: [
      {title: 'Ամսաթվեր', text: 'Գրանցեք ձեր դաշտանի առաջին օրը:'},
      {title: 'Ռիթմ', text: 'Աստիճանաբար դիտարկեք ցիկլերի միջև ընկած ժամանակահատվածը:'},
      {title: 'Արտահոսք', text: 'Պարզապես դիտարկեք ցանկացած փոփոխություն ձեզ համար սովորականի համեմատ:'},
    ],
    h2_6: '6. Ե՞րբ խորհուրդ հարցնել',
    body6: 'Եթե ինչ-որ բան անսովոր, շարունակական կամ անհանգստացնող է թվում, խորհուրդ հարցրեք առողջապահության մասնագետից:',
    warningSigns: [
      'Արյունահոսություն, որն ձեզ անսովոր է թվում',
      'Զգալի կամ շարունակական ցավ',
      'Ջերմություն կամ զգալի անհարմարություն',
      'Ցանկացած նոր ախտանիշ, որն անհանգստացնում է ձեզ',
    ],
    summaryTitle: 'Հիմնական եզրակացություններ',
    summaryPoints: [
      'Դաշտանի վերադարձը ծննդաբերությունից հետո նշանակում է, որ ձեր դաշտանը վերադառնում է ծննդաբերությունից հետո:',
      'Կրծքով կերակրումը կարող է հետաձգել ձեր դաշտանի վերադարձը:',
      'Առաջին ցիկլերը կարող են անկանոն լինել:',
      'Ամսաթվերը գրանցելը կարող է օգնել հետևել ձեր ցիկլի փոփոխությանը:',
    ],
    disclaimerText: 'Տեղեկատվական բովանդակություն: Ժամկետները կարող են տարբերվել՝ կախված յուրաքանչյուր իրավիճակից, և չեն փոխարինում բժշկական խորհրդատվությանը:',
  },
  tg: {
    badge: 'FREEMIUM • ДАВРАИ БАЪДИЗОӢ',
    title: 'Бозгашти ҳайз пас аз таваллуд,\nчӣ интизор шудан лозим аст',
    metaDuration: '5 дақ барои хондан',
    metaType: 'Роҳнамо',
    intro: 'Пас аз таваллуд бозгашти ҳайзи шумо метавонад вақт гирад. Мӯҳлат, аз ҷумла, вобаста ба шири додан фарқ мекунад ва ҳар шахс метавонад ин давраро ба таври гуногун аз сар гузаронад.',
    shareMessage: 'Бозгашти ҳайз пас аз таваллуд, чӣ интизор шудан лозим аст — AWA',
    h2_1: '1. Бозгашти ҳайз пас аз таваллуд чист?',
    body1: '«Бозгашти ҳайз» маънои баргаштани ҳайзи шуморо пас аз таваллуд дорад. Давраи ҳайз ҳатман фавран ба суръати одатии худ бозгашт намекунад.',
    highlightTitle: 'Нуктаи асосӣ',
    highlightText: 'Ягон мӯҳлати ягона вуҷуд надорад, ки барои ҳама татбиқ шавад.',
    h2_2: '2. Ҳайз кай метавонад баргардад?',
    body2: 'Мӯҳлат асосан ба шири додан вобаста аст. Бе шири додан ҳайз одатан тақрибан дар 6 то 8 ҳафта баргашта метавонад. Бо шири додани истисноӣ он метавонад якчанд моҳ ба таъхир афтад.',
    simpleInfoTitle1: 'Бе шири додан',
    simpleInfoText1: 'Одатан тақрибан дар 6 то 8 ҳафта.',
    simpleInfoTitle2: 'Бо шири додани истисноӣ',
    simpleInfoText2: 'Бозгашт метавонад якчанд моҳ ба таъхир афтад.',
    h2_3: '3. Тарзи бозгашти давра',
    body3: 'Давра пас аз таваллуд тадриҷан бармегардад. Шири додан метавонад ба вақти дубора пайдо шудани ҳайз таъсир расонад.',
    schemaTitle: 'Бозгашти тадриҷии давра',
    schemaSubtitle: 'Роҳнамои умумӣ, қадам ба қадам',
    cycleStages: [
      {title: 'Пас аз таваллуд', text: 'Давраи ҳайз пас аз таваллуд муваққатан қатъ мешавад.'},
      {title: 'Давраи баъдизоӣ', text: 'Бадан тадриҷан барқарор мешавад ва сатҳи гормонҳо тағйир меёбад.'},
      {title: 'Шири додан', text: 'Шири додан метавонад бозгашти ҳайзро ба таъхир андозад, вале таъсири он аз шахс ба шахс фарқ мекунад.'},
      {title: 'Бозгашти ҳайз', text: 'Ҳайзи аввали шумо метавонад пас аз чанд ҳафта ё якчанд моҳ баргардад.'},
      {title: 'Давраҳои аввал', text: 'Давраҳо метавонанд номунтазам бошанд, пеш аз он ки тадриҷан ба суръати одатии худ бозгарданд.'},
    ],
    schemaNoteText: 'Мӯҳлати якхела барои ҳама вуҷуд надорад. Вақти бозгашти ҳайзи шумо аз шахс ба шахс, хусусан вобаста ба шири додан, фарқ карда метавонад.',
    h2_4: '4. Давраҳои аввал',
    body4: 'Вақте ки ҳайз бармегардад, давраҳои аввал метавонанд аз давраҳои пеш аз ҳомиладорӣ фарқ кунанд. Хусусан, онҳо дар аввал метавонанд номунтазам бошанд.',
    card1Title: 'Суръати тағйирёбанда',
    card1Text: 'Давра метавонад барои бозгашт ба суръати ошно вақт гирад.',
    card2Title: 'Ҷараёни гуногун',
    card2Text: 'Ҷараён метавонад аз он чи пеш аз ҳомиладорӣ мушоҳида мекардед, фарқ кунад.',
    h2_5: '5. Чиро мушоҳида кардан мумкин аст?',
    body5: 'Пайгирии оддӣ ба шумо кумак мекунад тағйирёбии давраи худро бо мурури замон беҳтар мушоҳида кунед.',
    observations: [
      {title: 'Санаҳо', text: 'Рӯзи аввали ҳайзи худро қайд кунед.'},
      {title: 'Суръат', text: 'Тадриҷан фосилаи байни давраҳоро мушоҳида кунед.'},
      {title: 'Ҷараён', text: 'Танҳо ҳар тағйиротро нисбат ба он чи барои шумо муқаррарӣ аст, мушоҳида кунед.'},
    ],
    h2_6: '6. Кай маслиҳат пурсидан лозим аст?',
    body6: 'Агар чизе ғайриоддӣ, доимӣ ё нигаронкунанда ба назар расад, аз мутахассиси соҳаи тиб маслиҳат пурсед.',
    warningSigns: [
      'Хунравие, ки ба назари шумо ғайриоддӣ менамояд',
      'Дарди назаррас ё доимӣ',
      'Таб ё нороҳатии назаррас',
      'Ҳар нишонаи нав, ки шуморо нигарон мекунад',
    ],
    summaryTitle: 'Хулосаҳои асосӣ',
    summaryPoints: [
      'Бозгашти ҳайз пас аз таваллуд маънои баргаштани ҳайзи шуморо пас аз таваллуд дорад.',
      'Шири додан метавонад бозгашти ҳайзро ба таъхир андозад.',
      'Давраҳои аввал метавонанд номунтазам бошанд.',
      'Қайд кардани санаҳо метавонад ба пайгирии тағйирёбии давраи шумо кумак кунад.',
    ],
    disclaimerText: 'Мазмуни иттилоотӣ. Мӯҳлатҳо вобаста ба ҳар вазъият метавонанд гуногун бошанд ва маслиҳати тиббиро иваз намекунанд.',
  },
  ky: {
    badge: 'FREEMIUM • ТӨРӨТТӨН КИЙИН',
    title: 'Төрөттөн кийин етек киримдин кайтышы,\nэмне күтүү керек',
    metaDuration: '5 мүн окуу',
    metaType: 'Колдонмо',
    intro: 'Төрөттөн кийин етек киримдин кайтышы бир аз убакыт алышы мүмкүн. Мөөнөт, атап айтканда, эмчек эмизүүгө жараша айырмаланат жана ар бир адам бул мезгилди ар башка башынан өткөрүшү мүмкүн.',
    shareMessage: 'Төрөттөн кийин етек киримдин кайтышы, эмне күтүү керек — AWA',
    h2_1: '1. Төрөттөн кийин етек киримдин кайтышы деген эмне?',
    body1: '«Етек киримдин кайтышы» — төрөттөн кийин етек киримиңиздин кайра келиши. Етек кирим цикли сөзсүз дароо адаттагы ритмине кайтпайт.',
    highlightTitle: 'Негизги учур',
    highlightText: 'Баарына тиешелүү бирден-бир мөөнөт жок.',
    h2_2: '2. Етек кирим качан кайтып келиши мүмкүн?',
    body2: 'Мөөнөт көбүнчө эмчек эмизүүгө көз каранды. Эмчек эмизбегенде етек кирим жалпысынан болжол менен 6–8 жумада кайтышы мүмкүн. Толугу менен эмчек эмизгенде ал бир нече айга кечигиши мүмкүн.',
    simpleInfoTitle1: 'Эмчек эмизбегенде',
    simpleInfoText1: 'Жалпысынан болжол менен 6–8 жума.',
    simpleInfoTitle2: 'Толугу менен эмчек эмизгенде',
    simpleInfoText2: 'Кайтышы бир нече айга кечигиши мүмкүн.',
    h2_3: '3. Циклдин кайтышынын мыйзам ченемдүүлүгү',
    body3: 'Цикл төрөттөн кийин акырындап кайтат. Эмчек эмизүү етек кирим кайра качан пайда болорун таасир этиши мүмкүн.',
    schemaTitle: 'Циклдин акырындык менен кайтышы',
    schemaSubtitle: 'Жалпы колдонмо, кадам сайын',
    cycleStages: [
      {title: 'Төрөттөн кийин', text: 'Етек кирим цикли төрөттөн кийин убактылуу токтойт.'},
      {title: 'Төрөттөн кийинки мезгил', text: 'Дене акырындап калыбына келет жана гормон деңгээли өзгөрөт.'},
      {title: 'Эмчек эмизүү', text: 'Эмчек эмизүү етек киримдин кайтышын кечиктириши мүмкүн, бирок анын таасири адамдан адамга айырмаланат.'},
      {title: 'Етек киримдин кайтышы', text: 'Биринчи етек кирим бир нече жумадан же бир нече айдан кийин кайтышы мүмкүн.'},
      {title: 'Биринчи циклдер', text: 'Циклдер адаттагы ритмине акырындап кайтканга чейин туура эмес болушу мүмкүн.'},
    ],
    schemaNoteText: 'Баарына бирдей мөөнөт жок. Етек киримдин кайтышы адамдан адамга, айрыкча эмчек эмизүүгө жараша айырмаланышы мүмкүн.',
    h2_4: '4. Биринчи циклдер',
    body4: 'Етек кирим кайтканда, биринчи циклдер курсактуулуктан мурункулардан айырмаланышы мүмкүн. Атап айтканда, алар башында туура эмес болушу мүмкүн.',
    card1Title: 'Өзгөрүлмө ритм',
    card1Text: 'Циклге тааныш ритмге кайтууга убакыт кетиши мүмкүн.',
    card2Title: 'Башка агым',
    card2Text: 'Агым курсактуулуктан мурун байкагандан башкача болушу мүмкүн.',
    h2_5: '5. Эмнени байкай аласыз?',
    body5: 'Жөнөкөй көзөмөл циклиңиздин убакыттын өтүшү менен кандай өзгөрөрүн жакшыраак байкоого жардам берет.',
    observations: [
      {title: 'Күндөр', text: 'Етек киримиңиздин биринчи күнүн жазып коюңуз.'},
      {title: 'Ритм', text: 'Циклдердин ортосундагы аралыкты акырындап байкаңыз.'},
      {title: 'Агым', text: 'Өзүңүз үчүн адаттагыга салыштырмалуу ар кандай өзгөрүүлөрдү жөн гана байкаңыз.'},
    ],
    h2_6: '6. Кеңешти качан сурап кайрылуу керек?',
    body6: 'Эгер бир нерсе адаттан тыш, улана берген же тынчсыздандырган көрүнсө, ден соолук сактоо адисинен кеңеш сураңыз.',
    warningSigns: [
      'Сизге адаттан тыш көрүнгөн кан кетүү',
      'Олуттуу же улана берген оору',
      'Ысытма же олуттуу ыңгайсыздык',
      'Тынчсыздандырган ар кандай жаңы белги',
    ],
    summaryTitle: 'Негизги жыйынтыктар',
    summaryPoints: [
      'Төрөттөн кийин етек киримдин кайтышы — төрөттөн кийин етек киримдин кайра келиши.',
      'Эмчек эмизүү етек киримдин кайтышын кечиктириши мүмкүн.',
      'Биринчи циклдер туура эмес болушу мүмкүн.',
      'Күндөрдү жазып коюу циклиңиздин кандай өзгөрөрүн көзөмөлдөөгө жардам бериши мүмкүн.',
    ],
    disclaimerText: 'Маалымат берүүчү мазмун. Мөөнөттөр ар бир абалга жараша айырмаланышы мүмкүн жана медициналык кеңешти алмаштырбайт.',
  },
  tk: {
    badge: 'FREEMIUM • DOGRANDAN SOŇ',
    title: 'Dograndan soň aýbaşynyň gaýdyp gelmegi,\nnämä garaşmaly',
    metaDuration: '5 min okamak',
    metaType: 'Gollanma',
    intro: 'Dograndan soň aýbaşyňyzyň gaýdyp gelmegi biraz wagt alyp biler. Möhlet, beýleki zatlar bilen birlikde, emdirmäge baglylykda tapawutlanýar we her adam bu döwri başgaça başdan geçirip biler.',
    shareMessage: 'Dograndan soň aýbaşynyň gaýdyp gelmegi, nämä garaşmaly — AWA',
    h2_1: '1. Dograndan soň aýbaşynyň gaýdyp gelmegi näme?',
    body1: '«Aýbaşynyň gaýdyp gelmegi» dograndan soň aýbaşyňyzyň täzeden gelmegini aňladýar. Aýbaşy sikli adaty ritmine derrew gaýdyp gelmeli däl.',
    highlightTitle: 'Esasy nokat',
    highlightText: 'Hemmelere degişli ýeke möhlet ýok.',
    h2_2: '2. Aýbaşyňyz haçan gaýdyp gelip biler?',
    body2: 'Möhlet esasan emdirmä bagly. Emdirmesiz aýbaşyňyz adatça takmynan 6–8 hepdede gaýdyp gelip biler. Aýratyn emdirme bilen ol birnäçe aýa gijikdirilip biler.',
    simpleInfoTitle1: 'Emdirmesiz',
    simpleInfoText1: 'Adatça takmynan 6–8 hepde.',
    simpleInfoTitle2: 'Aýratyn emdirme bilen',
    simpleInfoText2: 'Gaýdyp gelmek birnäçe aýa gijikdirilip biler.',
    h2_3: '3. Sikliň gaýdyp gelişiniň nusgasy',
    body3: 'Sikl dograndan soň ýuwaş-ýuwaşdan gaýdyp gelýär. Emdirme aýbaşyňyzyň täzeden peýda bolýan wagtyna täsir edip biler.',
    schemaTitle: 'Sikliň ýuwaş-ýuwaşdan gaýdyp gelmegi',
    schemaSubtitle: 'Umumy gollanma, ädimme-ädim',
    cycleStages: [
      {title: 'Dograndan soň', text: 'Aýbaşy sikli dograndan soň wagtlaýyn togtaýar.'},
      {title: 'Dograndan soňky döwür', text: 'Beden ýuwaş-ýuwaşdan dikelýär we gormon derejeleri süýşýär.'},
      {title: 'Emdirmek', text: 'Emdirme aýbaşyňyzyň gaýdyp gelmegini gijikdirip biler, ýöne onuň täsiri adamdan adama tapawutlanýar.'},
      {title: 'Aýbaşynyň gaýdyp gelmegi', text: 'Ilkinji aýbaşyňyz birnäçe hepdeden ýa-da birnäçe aýdan soň gaýdyp gelip biler.'},
      {title: 'Ilkinji sikller', text: 'Sikller ýuwaş-ýuwaşdan adaty ritmine ornaşmazdan öň düzgünsiz bolup biler.'},
    ],
    schemaNoteText: 'Hemmeler üçin birmeňzeş möhlet ýok. Aýbaşyňyzyň gaýdyp gelýän wagty, aýratyn-da emdirmä baglylykda, adamdan adama tapawutlanyp biler.',
    h2_4: '4. Ilkinji sikller',
    body4: 'Aýbaşyňyz gaýdyp gelende, ilkinji sikller göwreliligden öňküden tapawutly bolup biler. Aýratyn-da, olar başda düzgünsiz bolup biler.',
    card1Title: 'Üýtgeýän ritm',
    card1Text: 'Siklde tanyş ritme ornaşmak üçin wagt gerek bolup biler.',
    card2Title: 'Başga gan akma',
    card2Text: 'Gan akma göwreliligden öň synlanylandan tapawutly bolup biler.',
    h2_5: '5. Nämäni synlap bilersiňiz?',
    body5: 'Ýönekeý yzarlama sikliňiziň wagtyň geçmegi bilen nähili üýtgeýändigini has gowy synlamaga kömek edýär.',
    observations: [
      {title: 'Seneler', text: 'Aýbaşyňyzyň ilkinji gününi belläň.'},
      {title: 'Ritm', text: 'Siklleriň arasyndaky aralygy ýuwaş-ýuwaşdan synlaň.'},
      {title: 'Gan akma', text: 'Siziň üçin adatydan tapawutly islendik üýtgeşmäni ýönekeý synlaň.'},
    ],
    h2_6: '6. Maslahaty haçan soramaly?',
    body6: 'Bir zat adaty däl, dowamly ýa-da alada goýýan ýaly görünse, saglyk hünärmeninden maslahat soraň.',
    warningSigns: [
      'Siziň üçin adaty däl bolup görünýän gan akma',
      'Möhüm ýa-da dowamly agyry',
      'Gyzgyn ýa-da möhüm biynjalyk',
      'Sizi alada goýýan islendik täze alamat',
    ],
    summaryTitle: 'Esasy netijeler',
    summaryPoints: [
      'Dograndan soň aýbaşynyň gaýdyp gelmegi aýbaşyňyzyň dograndan soň täzeden gelmegini aňladýar.',
      'Emdirme aýbaşyňyzyň gaýdyp gelmegini gijikdirip biler.',
      'Ilkinji sikller düzgünsiz bolup biler.',
      'Seneleri bellemek sikliňiziň nähili üýtgeýändigini yzarlamaga kömek edip biler.',
    ],
    disclaimerText: 'Maglumat berýän mazmun. Möhletler her ýagdaýa görä tapawutlanyp biler we lukmançylyk maslahatyny çalyşmaýar.',
  },
  ms: {
    badge: 'FREEMIUM • SELEPAS BERSALIN',
    title: 'Kembalinya haid selepas bersalin,\napa yang dijangka',
    metaDuration: '5 min bacaan',
    metaType: 'Panduan',
    intro: 'Selepas bersalin, kembalinya haid anda boleh mengambil sedikit masa. Masanya berbeza bergantung pada penyusuan, antara lain, dan setiap orang mungkin mengalami tempoh ini secara berbeza.',
    shareMessage: 'Kembalinya haid selepas bersalin, apa yang dijangka — AWA',
    h2_1: '1. Apakah kembalinya haid selepas bersalin?',
    body1: '“Kembalinya haid” merujuk kepada haid anda kembali selepas bersalin. Kitaran haid tidak semestinya kembali kepada rentak biasanya dengan serta-merta.',
    highlightTitle: 'Perkara utama',
    highlightText: 'Tiada satu garis masa yang terpakai kepada semua orang.',
    h2_2: '2. Bila haid anda boleh kembali?',
    body2: 'Masanya sebahagian besarnya bergantung pada penyusuan. Tanpa penyusuan, haid anda biasanya boleh kembali sekitar 6 hingga 8 minggu. Dengan penyusuan susu ibu eksklusif, ia mungkin tertangguh selama beberapa bulan.',
    simpleInfoTitle1: 'Tanpa penyusuan',
    simpleInfoText1: 'Biasanya sekitar 6 hingga 8 minggu.',
    simpleInfoTitle2: 'Dengan penyusuan susu ibu eksklusif',
    simpleInfoText2: 'Kembalinya boleh tertangguh selama beberapa bulan.',
    h2_3: '3. Corak kembalinya kitaran',
    body3: 'Kitaran kembali secara beransur-ansur selepas bersalin. Penyusuan boleh mempengaruhi bila haid anda muncul semula.',
    schemaTitle: 'Kembalinya kitaran secara beransur-ansur',
    schemaSubtitle: 'Panduan umum, langkah demi langkah',
    cycleStages: [
      {title: 'Selepas bersalin', text: 'Kitaran haid terhenti buat sementara waktu selepas bersalin.'},
      {title: 'Tempoh selepas bersalin', text: 'Tubuh pulih secara beransur-ansur dan tahap hormon berubah.'},
      {title: 'Penyusuan', text: 'Penyusuan mungkin menangguhkan kembalinya haid anda, tetapi kesannya berbeza dari seorang ke seorang.'},
      {title: 'Kembalinya haid', text: 'Haid pertama anda mungkin kembali selepas beberapa minggu atau beberapa bulan.'},
      {title: 'Kitaran pertama', text: 'Kitaran mungkin tidak teratur sebelum beransur-ansur kembali kepada rentak biasanya.'},
    ],
    schemaNoteText: 'Tiada garis masa yang sama bagi semua orang. Bila haid anda kembali boleh berbeza dari seorang ke seorang, terutamanya bergantung pada penyusuan.',
    h2_4: '4. Kitaran pertama',
    body4: 'Apabila haid anda kembali, kitaran pertama mungkin berbeza daripada yang sebelum kehamilan. Khususnya, ia mungkin tidak teratur pada mulanya.',
    card1Title: 'Rentak yang berubah-ubah',
    card1Text: 'Kitaran mungkin mengambil masa untuk kembali kepada rentak yang dikenali.',
    card2Title: 'Aliran yang berbeza',
    card2Text: 'Aliran mungkin berbeza daripada apa yang anda perhatikan sebelum kehamilan.',
    h2_5: '5. Apa yang boleh anda perhatikan?',
    body5: 'Penjejakan yang mudah membantu anda memerhati bagaimana kitaran anda berkembang dari semasa ke semasa dengan lebih baik.',
    observations: [
      {title: 'Tarikh', text: 'Catat hari pertama haid anda.'},
      {title: 'Rentak', text: 'Perhatikan secara beransur-ansur jarak antara kitaran.'},
      {title: 'Aliran', text: 'Perhatikan sahaja sebarang perubahan berbanding apa yang lazim bagi anda.'},
    ],
    h2_6: '6. Bila anda patut meminta nasihat?',
    body6: 'Jika sesuatu nampak luar biasa, berterusan atau membimbangkan, dapatkan nasihat daripada pengamal penjagaan kesihatan.',
    warningSigns: [
      'Pendarahan yang nampak luar biasa kepada anda',
      'Sakit yang ketara atau berterusan',
      'Demam atau ketidakselesaan yang ketara',
      'Sebarang simptom baharu yang membimbangkan anda',
    ],
    summaryTitle: 'Perkara penting untuk diingat',
    summaryPoints: [
      'Kembalinya haid selepas bersalin merujuk kepada haid anda kembali selepas bersalin.',
      'Penyusuan mungkin menangguhkan kembalinya haid anda.',
      'Kitaran pertama mungkin tidak teratur.',
      'Mencatat tarikh boleh membantu anda menjejaki bagaimana kitaran anda berkembang.',
    ],
    disclaimerText: 'Kandungan bersifat maklumat. Garis masa mungkin berbeza bergantung pada setiap keadaan dan tidak menggantikan nasihat perubatan.',
  },
  so: {
    badge: 'FREEMIUM • DHALMADA KA DIB',
    title: 'Soo noqoshada caadada dhalmada ka dib,\nwaxa la filayo',
    metaDuration: '5 daq akhris',
    metaType: 'Hage',
    intro: 'Dhalmada ka dib, soo noqoshada caadadaadu way qaadan kartaa waqti. Waqtigu wuu kala duwanaan karaa iyadoo ku xiran nuujinta, iyo waxyaabo kale, mid kastaana wuxuu muddadan ku maraa si ka duwan.',
    shareMessage: 'Soo noqoshada caadada dhalmada ka dib, waxa la filayo — AWA',
    h2_1: '1. Waa maxay soo noqoshada caadada dhalmada ka dib?',
    body1: '“Soo noqoshada caadada” waxay tilmaamaysaa caadadaada oo soo noqota dhalmada ka dib. Wareegga caadadu lagama maarmaan ahan inuu isla markiiba ku laabto xawaarihiisa caadiga ah.',
    highlightTitle: 'Qodob muhiim ah',
    highlightText: 'Jadwal keliya oo qof walba khuseeya ma jiro.',
    h2_2: '2. Goorma ayay caadadaadu soo noqon kartaa?',
    body2: 'Waqtigu wuxuu inta badan ku xiran yahay nuujinta. Nuujin la’aan, caadadaadu guud ahaan way soo noqon kartaa qiyaastii 6 ilaa 8 toddobaad. Nuujin gaar ah, way daahi kartaa dhowr bilood.',
    simpleInfoTitle1: 'Nuujin la’aan',
    simpleInfoText1: 'Guud ahaan qiyaastii 6 ilaa 8 toddobaad.',
    simpleInfoTitle2: 'Nuujin gaar ah',
    simpleInfoText2: 'Soo noqoshadu way daahi kartaa dhowr bilood.',
    h2_3: '3. Qaabka soo noqoshada wareegga',
    body3: 'Wareeggu wuxuu soo noqdaa tartiib dhalmada ka dib. Nuujintu waxay saameyn kartaa goorta caadadaadu soo muuqato mar kale.',
    schemaTitle: 'Soo noqosho tartiib ah oo wareegga',
    schemaSubtitle: 'Hage guud, tallaabo tallaabo',
    cycleStages: [
      {title: 'Dhalmada ka dib', text: 'Wareegga caadada wuu hakadaa ku meel gaar dhalmada ka dib.'},
      {title: 'Muddada dhalmada ka dib', text: 'Jidhku tartiib ayuu u bogsadaa heerarka hormoonkuna way isbeddelaan.'},
      {title: 'Nuujin', text: 'Nuujintu waxay daahin kartaa soo noqoshada caadadaada, laakiin saameyntiisa way ku kala duwan tahay qof ilaa qof.'},
      {title: 'Soo noqoshada caadada', text: 'Caadadaadii ugu horreysay way soo noqon kartaa ka dib dhowr toddobaad ama dhowr bilood.'},
      {title: 'Wareegyada ugu horreeya', text: 'Wareegyadu waxay noqon karaan kuwo aan joogto ahayn ka hor intaysan tartiib u degin xawaarahooda caadiga ah.'},
    ],
    schemaNoteText: 'Jadwal isku mid ah ma jiro qof walba. Goorta caadadaadu soo noqoto way ku kala duwanaan kartaa qof ilaa qof, gaar ahaan iyadoo ku xiran nuujinta.',
    h2_4: '4. Wareegyada ugu horreeya',
    body4: 'Marka caadadaadu soo noqoto, wareegyada ugu horreeya waxay ka duwanaan karaan kuwa ka horreeyay uurka. Gaar ahaan, waxay noqon karaan kuwo aan joogto ahayn bilowga.',
    card1Title: 'Xawaare kala duwan',
    card1Text: 'Wareeggu wuxuu qaadan karaa waqti si uu dib ugu degdo xawaare la yaqaan.',
    card2Title: 'Socod ka duwan',
    card2Text: 'Socodku wuu ka duwanaan karaa waxa aad ogaatay ka hor uurka.',
    h2_5: '5. Maxaad indho-indheyn kartaa?',
    body5: 'La socod fudud ayaa kaa caawinaya inaad si wanaagsan u indho-indheyso sida wareeggaagu waqti ka dib u isbeddelo.',
    observations: [
      {title: 'Taariikho', text: 'Xus maalinta koowaad ee caadadaada.'},
      {title: 'Xawaare', text: 'Tartiib u indho-indheeyo muddada u dhexeysa wareegyada.'},
      {title: 'Socod', text: 'Si fudud u indho-indheeyo isbeddel kasta marka loo eego waxa kuu caadi ah.'},
    ],
    h2_6: '6. Goorma talo la raadsadaa?',
    body6: 'Haddii wax u muuqdaan kuwo aan caadi ahayn, sii socda, ama walaac leh, talo ka raadso xirfadle caafimaad.',
    warningSigns: [
      'Dhiigbax kuu muuqda mid aan caadi ahayn',
      'Xanuun weyn ama sii socda',
      'Qandho ama raaxo-darro weyn',
      'Astaan cusub oo ku walaaciya',
    ],
    summaryTitle: 'Qodobbada muhiimka ah',
    summaryPoints: [
      'Soo noqoshada caadada dhalmada ka dib waxay tilmaamaysaa caadadaada oo soo noqota dhalmada ka dib.',
      'Nuujintu waxay daahin kartaa soo noqoshada caadadaada.',
      'Wareegyada ugu horreeya waxay noqon karaan kuwo aan joogto ahayn.',
      'Xusidda taariikhaha ayaa kaa caawin karta la socodka sida wareeggaagu u isbeddelo.',
    ],
    disclaimerText: 'Macluumaad. Jadwalka waqtiyada wuu ku kala duwanaan karaa iyadoo ku xiran xaalad kasta mana bedelo talo caafimaad.',
  },
  sw: {
    badge: 'FREEMIUM • BAADA YA KUJIFUNGUA',
    title: 'Kurejea kwa hedhi baada ya kujifungua,\nnini cha kutarajia',
    metaDuration: 'Dakika 5 za kusoma',
    metaType: 'Mwongozo',
    intro: 'Baada ya kujifungua, kurejea kwa hedhi yako kunaweza kuchukua muda. Wakati hutofautiana kulingana na kunyonyesha, miongoni mwa mambo mengine, na kila mtu anaweza kupitia kipindi hiki kwa njia tofauti.',
    shareMessage: 'Kurejea kwa hedhi baada ya kujifungua, nini cha kutarajia — AWA',
    h2_1: '1. Kurejea kwa hedhi baada ya kujifungua ni nini?',
    body1: '“Kurejea kwa hedhi” kunarejelea hedhi yako kuanza tena baada ya kujifungua. Mzunguko wa hedhi si lazima urejee mdundo wake wa kawaida mara moja.',
    highlightTitle: 'Jambo kuu',
    highlightText: 'Hakuna ratiba moja inayomhusu kila mtu.',
    h2_2: '2. Hedhi yako inaweza kurejea lini?',
    body2: 'Wakati unategemea sana kunyonyesha. Bila kunyonyesha, hedhi yako kwa kawaida inaweza kurejea karibu wiki 6 hadi 8. Kwa kunyonyesha pekee, inaweza kucheleweshwa kwa miezi kadhaa.',
    simpleInfoTitle1: 'Bila kunyonyesha',
    simpleInfoText1: 'Kwa kawaida karibu wiki 6 hadi 8.',
    simpleInfoTitle2: 'Kwa kunyonyesha pekee',
    simpleInfoText2: 'Kurejea kunaweza kucheleweshwa kwa miezi kadhaa.',
    h2_3: '3. Mwenendo wa kurejea kwa mzunguko',
    body3: 'Mzunguko hurejea polepole baada ya kujifungua. Kunyonyesha kunaweza kuathiri wakati hedhi yako inapoonekana tena.',
    schemaTitle: 'Kurejea polepole kwa mzunguko',
    schemaSubtitle: 'Mwongozo wa jumla, hatua kwa hatua',
    cycleStages: [
      {title: 'Baada ya kujifungua', text: 'Mzunguko wa hedhi husimama kwa muda baada ya kuzaliwa.'},
      {title: 'Kipindi cha baada ya kujifungua', text: 'Mwili hupona polepole na viwango vya homoni hubadilika.'},
      {title: 'Kunyonyesha', text: 'Kunyonyesha kunaweza kuchelewesha kurejea kwa hedhi yako, lakini athari yake hutofautiana kati ya mtu na mtu.'},
      {title: 'Kurejea kwa hedhi', text: 'Hedhi yako ya kwanza inaweza kurejea baada ya wiki chache au miezi kadhaa.'},
      {title: 'Mizunguko ya kwanza', text: 'Mizunguko inaweza kuwa isiyo ya mpangilio kabla ya kutulia polepole kwenye mdundo wake wa kawaida.'},
    ],
    schemaNoteText: 'Hakuna ratiba inayofanana kwa kila mtu. Wakati hedhi yako inaporejea unaweza kutofautiana kati ya mtu na mtu, hasa kulingana na kunyonyesha.',
    h2_4: '4. Mizunguko ya kwanza',
    body4: 'Hedhi yako inaporejea, mizunguko ya kwanza inaweza kutofautiana na ile ya kabla ya ujauzito. Hasa, inaweza kuwa isiyo ya mpangilio mwanzoni.',
    card1Title: 'Mdundo unaobadilika',
    card1Text: 'Mzunguko unaweza kuchukua muda kutulia tena kwenye mdundo unaoufahamu.',
    card2Title: 'Mtiririko tofauti',
    card2Text: 'Mtiririko unaweza kuwa tofauti na ule uliouona kabla ya ujauzito.',
    h2_5: '5. Unaweza kuchunguza nini?',
    body5: 'Ufuatiliaji rahisi unakusaidia kuchunguza vizuri jinsi mzunguko wako unavyobadilika kadiri muda unavyopita.',
    observations: [
      {title: 'Tarehe', text: 'Andika siku ya kwanza ya hedhi yako.'},
      {title: 'Mdundo', text: 'Chunguza polepole muda kati ya mizunguko.'},
      {title: 'Mtiririko', text: 'Chunguza tu mabadiliko yoyote ikilinganishwa na kilicho cha kawaida kwako.'},
    ],
    h2_6: '6. Wakati gani utafute ushauri?',
    body6: 'Ikiwa kitu kinaonekana si cha kawaida, cha kuendelea, au cha kutia wasiwasi, tafuta ushauri wa mtaalamu wa afya.',
    warningSigns: [
      'Kutokwa damu kunakoonekana si kwa kawaida kwako',
      'Maumivu makubwa au ya kuendelea',
      'Homa au usumbufu mkubwa',
      'Dalili yoyote mpya inayokutia wasiwasi',
    ],
    summaryTitle: 'Mambo muhimu ya kukumbuka',
    summaryPoints: [
      'Kurejea kwa hedhi baada ya kujifungua kunarejelea hedhi yako kuanza tena baada ya kujifungua.',
      'Kunyonyesha kunaweza kuchelewesha kurejea kwa hedhi yako.',
      'Mizunguko ya kwanza inaweza kuwa isiyo ya mpangilio.',
      'Kuandika tarehe kunaweza kukusaidia kufuatilia jinsi mzunguko wako unavyobadilika.',
    ],
    disclaimerText: 'Maudhui ya taarifa. Muda unaweza kutofautiana kulingana na kila hali na hauchukui nafasi ya ushauri wa kitabibu.',
  },
  kk: {
    badge: 'FREEMIUM • БОСАНҒАННАН КЕЙІН',
    title: 'Босанғаннан кейін етеккірдің қайта келуі,\nнені күту керек',
    metaDuration: '5 мин оқу',
    metaType: 'Нұсқаулық',
    intro: 'Босанғаннан кейін етеккіріңіздің қайта келуі біраз уақыт алуы мүмкін. Уақыт, басқа факторлармен қатар, емізуге байланысты өзгереді және әр адам бұл кезеңді әртүрлі бастан кешіруі мүмкін.',
    shareMessage: 'Босанғаннан кейін етеккірдің қайта келуі, нені күту керек — AWA',
    h2_1: '1. Босанғаннан кейін етеккірдің қайта келуі дегеніміз не?',
    body1: '“Етеккірдің қайта келуі” босанғаннан кейін етеккіріңіздің қайта басталуын білдіреді. Етеккір циклі міндетті түрде бірден әдеттегі ырғағына оралмайды.',
    highlightTitle: 'Негізгі нүкте',
    highlightText: 'Барлығына қолданылатын жалғыз мерзім жоқ.',
    h2_2: '2. Етеккіріңіз қашан қайта келуі мүмкін?',
    body2: 'Мерзім негізінен емізуге байланысты. Емізбесеңіз, етеккіріңіз әдетте шамамен 6-дан 8 аптада қайта келуі мүмкін. Тек емізген кезде ол бірнеше айға кешігуі мүмкін.',
    simpleInfoTitle1: 'Емізбегенде',
    simpleInfoText1: 'Әдетте шамамен 6-дан 8 аптада.',
    simpleInfoTitle2: 'Тек емізгенде',
    simpleInfoText2: 'Қайта келуі бірнеше айға кешігуі мүмкін.',
    h2_3: '3. Циклдің қайта келу үлгісі',
    body3: 'Босанғаннан кейін цикл біртіндеп қайта оралады. Емізу етеккіріңіздің қашан қайта пайда болатынына әсер етуі мүмкін.',
    schemaTitle: 'Циклдің біртіндеп қайта оралуы',
    schemaSubtitle: 'Жалпы нұсқаулық, қадам-қадаммен',
    cycleStages: [
      {title: 'Босанғаннан кейін', text: 'Етеккір циклі босанғаннан кейін уақытша тоқтайды.'},
      {title: 'Босанғаннан кейінгі кезең', text: 'Дене біртіндеп қалпына келеді және гормон деңгейлері өзгереді.'},
      {title: 'Емізу', text: 'Емізу етеккіріңіздің қайта келуін кешіктіруі мүмкін, бірақ оның әсері әр адамда әртүрлі.'},
      {title: 'Етеккірдің қайта келуі', text: 'Бірінші етеккіріңіз бірнеше аптадан немесе бірнеше айдан кейін қайта келуі мүмкін.'},
      {title: 'Алғашқы циклдер', text: 'Циклдер әдеттегі ырғағына біртіндеп оралғанға дейін тұрақсыз болуы мүмкін.'},
    ],
    schemaNoteText: 'Барлығына бірдей мерзім жоқ. Етеккіріңіздің қайта келу уақыты, әсіресе емізуге байланысты, әр адамда әртүрлі болуы мүмкін.',
    h2_4: '4. Алғашқы циклдер',
    body4: 'Етеккіріңіз қайта келгенде, алғашқы циклдер жүктілікке дейінгілерден өзгеше болуы мүмкін. Атап айтқанда, олар басында тұрақсыз болуы мүмкін.',
    card1Title: 'Өзгермелі ырғақ',
    card1Text: 'Циклдің таныс ырғаққа қайта орнығуына уақыт кетуі мүмкін.',
    card2Title: 'Басқа көлем',
    card2Text: 'Көлем жүктілікке дейін байқағаныңыздан өзгеше болуы мүмкін.',
    h2_5: '5. Нені бақылай аласыз?',
    body5: 'Қарапайым бақылау циклыңыздың уақыт өте қалай өзгеретінін жақсырақ бақылауға көмектеседі.',
    observations: [
      {title: 'Күндер', text: 'Етеккіріңіздің бірінші күнін жазыңыз.'},
      {title: 'Ырғақ', text: 'Циклдер арасындағы аралықты біртіндеп бақылаңыз.'},
      {title: 'Көлем', text: 'Өзіңіз үшін әдеттегімен салыстырғанда кез келген өзгерісті жай ғана бақылаңыз.'},
    ],
    h2_6: '6. Кеңесті қашан сұрау керек?',
    body6: 'Бірдеңе әдеттен тыс, тұрақты немесе алаңдатарлық болып көрінсе, медицина маманынан кеңес сұраңыз.',
    warningSigns: [
      'Сізге әдеттен тыс көрінетін қан кету',
      'Айтарлықтай немесе тұрақты ауыру',
      'Қызба немесе айтарлықтай жайсыздық',
      'Сізді алаңдататын кез келген жаңа белгі',
    ],
    summaryTitle: 'Негізгі қорытындылар',
    summaryPoints: [
      'Босанғаннан кейін етеккірдің қайта келуі босанғаннан кейін етеккіріңіздің қайта оралуын білдіреді.',
      'Емізу етеккіріңіздің қайта келуін кешіктіруі мүмкін.',
      'Алғашқы циклдер тұрақсыз болуы мүмкін.',
      'Күндерді жазып қою циклыңыздың қалай өзгеретінін бақылауға көмектесе алады.',
    ],
    disclaimerText: 'Ақпараттық мазмұн. Мерзімдер әр жағдайға байланысты өзгеруі мүмкін және медициналық кеңестің орнын баспайды.',
  },
  wo: {
    badge: 'FREEMIUM • GINNAAW JUR',
    title: 'Dellusig règle ginnaaw jur,\nlu ñuy xaar',
    metaDuration: '5 simili jàng',
    metaType: 'Ndigal',
    intro: 'Ginnaaw jur, dellusig sa règle mën na jël jamono. Waxtu bi wuute na ci nàmm, ak yeneen, te ku nekk mën na dund jamono jii ci anamam.',
    shareMessage: 'Dellusig règle ginnaaw jur, lu ñuy xaar — AWA',
    h2_1: '1. Lan mooy dellusig règle ginnaaw jur?',
    body1: '“Dellusig règle” mooy sa règle di dellu ginnaaw jur. Wërsëgu weer du war a dellu saa su ne ci ritmam bu cosaan ci gaaw.',
    highlightTitle: 'Li am solo',
    highlightText: 'Amul benn arminaat rekk bu méngoo ñépp.',
    h2_2: '2. Kañ la sa règle mën a dellusi?',
    body2: 'Waxtu bi dafay sukkandiku lool ci nàmm. Bu amul nàmm, sa règle mën na dellusi ci wetu 6 ba 8 ayu-bés. Bu nàmm rekk, mën na yeex ay weer.',
    simpleInfoTitle1: 'Te nàmm amul',
    simpleInfoText1: 'Ci yoon, ci wetu 6 ba 8 ayu-bés.',
    simpleInfoTitle2: 'Ak nàmm rekk',
    simpleInfoText2: 'Dellusi bi mën na yeex ay weer.',
    h2_3: '3. Naka wërsëg bi di dellusi',
    body3: 'Wërsëg bi dafay dellusi tuuti-tuuti ginnaaw jur. Nàmm mën na jëm ci kañ la sa règle di dellu feeñ.',
    schemaTitle: 'Dellusig wërsëg bu tuuti-tuuti',
    schemaSubtitle: 'Benn ndigal bu yaatu, ñaar fuñ ak ñaar fuñ',
    cycleStages: [
      {title: 'Ginnaaw jur', text: 'Wërsëgu weer dafay taxaw ci diir bu gàtt ginnaaw jur.'},
      {title: 'Jamonoy ginnaaw jur', text: 'Yaram bi dafay wér tuuti-tuuti te dayoy hormon yi di soppiku.'},
      {title: 'Nàmm', text: 'Nàmm mën na yeexal dellusig sa règle, waaye jëm bi wuute na ci nit ak nit.'},
      {title: 'Dellusig règle', text: 'Sa règle bu njëkk mën na dellu ginnaaw ay ayu-bés walla ay weer.'},
      {title: 'Wërsëg yu njëkk', text: 'Wërsëg yi mën nañu jubul balaa ñu dellu ci ritmam bu cosaan tuuti-tuuti.'},
    ],
    schemaNoteText: 'Amul benn arminaat bu bokk ci ñépp. Kañ la sa règle di dellusi mën na wuute ci nit ak nit, lool ci nàmm.',
    h2_4: '4. Wërsëg yu njëkk',
    body4: 'Bu sa règle dellusee, wërsëg yu njëkk mën nañu wuute ak yi jiitu ëmb. Lool, mën nañu jubul ci njëkk.',
    card1Title: 'Ritm bu soppiku',
    card1Text: 'Wërsëg bi mën na jël jamono ngir dellu ci benn ritm bu xam.',
    card2Title: 'Deret bu wuute',
    card2Text: 'Deret bi mën na wuute ak li nga amoon balaa ëmb.',
    h2_5: '5. Lan nga mën a seetlu?',
    body5: 'Benn topp bu yomb dafay dimbli nga gën a seetlu naka sa wërsëg di soppiku ci jamono.',
    observations: [
      {title: 'Bés', text: 'Bind bu njëkk fanu sa règle.'},
      {title: 'Ritm', text: 'Seetlu tuuti-tuuti diir bi diggante wërsëg yi.'},
      {title: 'Deret', text: 'Seetlu rekk soppi yi ci li cosaan ngir yaw.'},
    ],
    h2_6: '6. Kañ ngay seet ndigal?',
    body6: 'Bu benn lu mel ni cosaanul, sax walla tiital, seet ndigalu benn liggéeykatu wér.',
    warningSigns: [
      'Deret bu mel ni cosaanul ngir yaw',
      'Metit bu am solo walla bu sax',
      'Tàngoor walla anam bu mat bu di ñaaw',
      'Benn màndarga bu bees bu tiital la',
    ],
    summaryTitle: 'Li am solo',
    summaryPoints: [
      'Dellusig règle ginnaaw jur mooy sa règle di dellu ginnaaw jur.',
      'Nàmm mën na yeexal dellusig sa règle.',
      'Wërsëg yu njëkk mën nañu jubul.',
      'Bind bési yi mën na dimbli nga topp naka sa wërsëg di soppiku.',
    ],
    disclaimerText: 'Mbind ngir xibaar. Waxtu yi mën nañu wuute ci mbir bu nekk te duñu wuutu ndigalu doktoor.',
  },
  ha: {
    badge: 'KYAUTA • BAYAN HAIHUWA',
    title: 'Dawowar haila bayan haihuwa,\nabin da za a tsammata',
    metaDuration: 'karatun minti 5',
    metaType: 'Jagora',
    intro: 'Bayan haihuwa, dawowar hailarki na iya ɗaukar lokaci. Lokacin ya bambanta bisa shayarwa, a cikin wasu abubuwa, kuma kowane mutum na iya rayuwar wannan lokaci daban.',
    shareMessage: 'Dawowar haila bayan haihuwa, abin da za a tsammata — AWA',
    h2_1: '1. Menene dawowar haila bayan haihuwa?',
    body1: '“Dawowar haila” tana nufin hailarki ta dawo bayan haihuwa. Zagayen haila ba lallai ba ne ya koma tsarinsa na al’ada nan take.',
    highlightTitle: 'Muhimmin abu',
    highlightText: 'Babu lokaci guda ɗaya da ya shafi kowa.',
    h2_2: '2. Yaushe hailarki za ta iya dawowa?',
    body2: 'Lokacin ya dogara sosai ga shayarwa. Ba tare da shayarwa ba, hailarki yawanci na iya dawowa a kusa da makonni 6 zuwa 8. Tare da shayarwa kaɗai, ana iya jinkirta shi na watanni da dama.',
    simpleInfoTitle1: 'Ba tare da shayarwa ba',
    simpleInfoText1: 'Yawanci a kusa da makonni 6 zuwa 8.',
    simpleInfoTitle2: 'Tare da shayarwa kaɗai',
    simpleInfoText2: 'Dawowar na iya jinkirta na watanni da dama.',
    h2_3: '3. Tsarin dawowar zagaye',
    body3: 'Zagaye yana dawowa a hankali bayan haihuwa. Shayarwa na iya shafar lokacin da hailarki ke sake bayyana.',
    schemaTitle: 'Dawowar zagaye a hankali',
    schemaSubtitle: 'Jagora gama gari, mataki-mataki',
    cycleStages: [
      {title: 'Bayan haihuwa', text: 'Zagayen haila yana tsayawa na ɗan lokaci bayan haihuwa.'},
      {title: 'Lokacin bayan haihuwa', text: 'Jiki yana murmurewa a hankali kuma matakan hormone suna canzawa.'},
      {title: 'Shayarwa', text: 'Shayarwa na iya jinkirta dawowar hailarki, amma tasirinta ya bambanta daga mutum zuwa mutum.'},
      {title: 'Dawowar haila', text: 'Hailarki ta farko na iya dawowa bayan makonni kaɗan ko watanni da dama.'},
      {title: 'Zagaye na farko', text: 'Zagaye na iya zama marasa tsari kafin su koma tsarinsu na al’ada a hankali.'},
    ],
    schemaNoteText: 'Babu lokaci iri ɗaya ga kowa. Lokacin dawowar hailarki na iya bambanta daga mutum zuwa mutum, musamman bisa shayarwa.',
    h2_4: '4. Zagaye na farko',
    body4: 'Lokacin da hailarki ta dawo, zagaye na farko na iya bambanta da na kafin ciki. Musamman, na iya zama marasa tsari a farko.',
    card1Title: 'Tsari mai canzawa',
    card1Text: 'Zagaye na iya ɗaukar lokaci kafin ya koma tsari da aka saba.',
    card2Title: 'Yawan jini daban',
    card2Text: 'Yawan jini na iya bambanta da abin da kika lura kafin ciki.',
    h2_5: '5. Me za ki iya lura?',
    body5: 'Bin diddigi mai sauƙi yana taimaka miki ki fi lura da yadda zagayenki ke ci gaba a kan lokaci.',
    observations: [
      {title: 'Ranaku', text: 'Rubuta ranar farko ta hailarki.'},
      {title: 'Tsari', text: 'Lura da tazarar tsakanin zagaye a hankali.'},
      {title: 'Yawan jini', text: 'Kawai lura da duk wani sauyi idan aka kwatanta da abin da ya saba gare ki.'},
    ],
    h2_6: '6. Yaushe ya kamata ki nemi shawara?',
    body6: 'Idan wani abu ya yi kama da ba na al’ada ba, mai dawwama, ko mai damuwa, nemi shawara daga ma’aikacin lafiya.',
    warningSigns: [
      'Zubar jini da ya yi kama da ba na al’ada ba a gare ki',
      'Ciwo mai yawa ko mai dawwama',
      'Zazzabi ko rashin jin daɗi mai yawa',
      'Duk wata sabuwar alama da ke damun ki',
    ],
    summaryTitle: 'Muhimman abubuwa',
    summaryPoints: [
      'Dawowar haila bayan haihuwa tana nufin hailarki ta dawo bayan haihuwa.',
      'Shayarwa na iya jinkirta dawowar hailarki.',
      'Zagaye na farko na iya zama marasa tsari.',
      'Rubuta ranaku na iya taimaka miki ki bi yadda zagayenki ke ci gaba.',
    ],
    disclaimerText: 'Abun bayani. Lokuta na iya bambanta bisa kowane yanayi kuma ba sa maye gurbin shawarar likita.',
  },
  am: {
    badge: 'ነፃ • ከወሊድ በኋላ',
    title: 'ከወሊድ በኋላ የወር አበባ መመለስ፣\nምን መጠበቅ',
    metaDuration: '5 ደቂቃ ንባብ',
    metaType: 'መመሪያ',
    intro: 'ከወለድሽ በኋላ የወር አበባሽ መመለስ ጊዜ ሊወስድ ይችላል። ጊዜው ከሌሎች ነገሮች በተጨማሪ በጡት ማጥባት ላይ ይወሰናል፣ እና እያንዳንዱ ሰው ይህን ጊዜ በተለየ መንገድ ሊያሳልፍ ይችላል።',
    shareMessage: 'ከወሊድ በኋላ የወር አበባ መመለስ፣ ምን መጠበቅ — AWA',
    h2_1: '1. ከወሊድ በኋላ የወር አበባ መመለስ ምንድን ነው?',
    body1: '“የወር አበባ መመለስ” ከወሊድ በኋላ የወር አበባሽ ተመልሶ መምጣቱን ያመለክታል። የወር አበባ ዑደት ወዲያውኑ ወደ ተለመደው ሪትሙ መመለስ የግድ አይደለም።',
    highlightTitle: 'ዋና ነጥብ',
    highlightText: 'ለሁሉም የሚሠራ አንድ ብቻ የጊዜ ሰሌዳ የለም።',
    h2_2: '2. የወር አበባሽ መቼ ሊመለስ ይችላል?',
    body2: 'ጊዜው በአብዛኛው በጡት ማጥባት ላይ ይወሰናል። ጡት ሳታጠቢ የወር አበባሽ በአጠቃላይ ከ6 እስከ 8 ሳምንታት አካባቢ ሊመለስ ይችላል። ብቻ ጡት በማጥባት ደግሞ ለበርካታ ወራት ሊዘገይ ይችላል።',
    simpleInfoTitle1: 'ጡት ሳታጠቢ',
    simpleInfoText1: 'በአጠቃላይ ከ6 እስከ 8 ሳምንታት አካባቢ።',
    simpleInfoTitle2: 'ብቻ ጡት በማጥባት',
    simpleInfoText2: 'መመለሱ ለበርካታ ወራት ሊዘገይ ይችላል።',
    h2_3: '3. የዑደቱ መመለስ ዘይቤ',
    body3: 'ዑደቱ ከወሊድ በኋላ ቀስ በቀስ ይመለሳል። ጡት ማጥባት የወር አበባሽ መቼ እንደሚታይ ሊነካ ይችላል።',
    schemaTitle: 'የዑደቱ ቀስ በቀስ መመለስ',
    schemaSubtitle: 'አጠቃላይ መመሪያ፣ ደረጃ በደረጃ',
    cycleStages: [
      {title: 'ከወሊድ በኋላ', text: 'የወር አበባ ዑደት ከወሊድ በኋላ ለጊዜው ይቆማል።'},
      {title: 'ከወሊድ በኋላ ጊዜ', text: 'ሰውነት ቀስ በቀስ ያገግማል እና የሆርሞን ደረጃዎች ይለዋወጣሉ።'},
      {title: 'ጡት ማጥባት', text: 'ጡት ማጥባት የወር አበባሽ መመለስን ሊያዘገይ ይችላል፣ ነገር ግን ተጽእኖው ከሰው ወደ ሰው ይለያያል።'},
      {title: 'የወር አበባ መመለስ', text: 'የመጀመሪያው የወር አበባሽ ከጥቂት ሳምንታት ወይም ከበርካታ ወራት በኋላ ሊመለስ ይችላል።'},
      {title: 'የመጀመሪያዎቹ ዑደቶች', text: 'ዑደቶቹ ቀስ በቀስ ወደ ተለመደው ሪትማቸው ከመመለሳቸው በፊት መደበኛ ላይሆኑ ይችላሉ።'},
    ],
    schemaNoteText: 'ለሁሉም ተመሳሳይ የጊዜ ሰሌዳ የለም። የወር አበባሽ የሚመለስበት ጊዜ በተለይ በጡት ማጥባት ላይ በመመሥረት ከሰው ወደ ሰው ሊለያይ ይችላል።',
    h2_4: '4. የመጀመሪያዎቹ ዑደቶች',
    body4: 'የወር አበባሽ ሲመለስ የመጀመሪያዎቹ ዑደቶች ከእርግዝና በፊት ከነበሩት ሊለዩ ይችላሉ። በተለይ በመጀመሪያ መደበኛ ላይሆኑ ይችላሉ።',
    card1Title: 'ተለዋዋጭ ሪትም',
    card1Text: 'ዑደቱ ወደ ለመደው ሪትም ለመመለስ ጊዜ ሊወስድ ይችላል።',
    card2Title: 'የተለየ ፍሰት',
    card2Text: 'ፍሰቱ ከእርግዝና በፊት ካስተዋልሽው ሊለይ ይችላል።',
    h2_5: '5. ምን ማስተዋል ትችያለሽ?',
    body5: 'ቀላል መከታተል ዑደትሽ በጊዜ ሂደት እንዴት እንደሚለወጥ በተሻለ እንድታስተውዪ ይረዳሻል።',
    observations: [
      {title: 'ቀኖች', text: 'የወር አበባሽን የመጀመሪያ ቀን ጻፊ።'},
      {title: 'ሪትም', text: 'በዑደቶች መካከል ያለውን ክፍተት ቀስ በቀስ ታዘቢ።'},
      {title: 'ፍሰት', text: 'ለአንቺ ከተለመደው ጋር ሲነጻጸር ማንኛውንም ለውጥ በቀላሉ ታዘቢ።'},
    ],
    h2_6: '6. ምክር መቼ መፈለግ አለብሽ?',
    body6: 'የሆነ ነገር ያልተለመደ፣ የሚቆይ ወይም አሳሳቢ የሚመስል ከሆነ፣ ከጤና ባለሙያ ምክር ጠይቂ።',
    warningSigns: [
      'ለአንቺ ያልተለመደ የሚመስል ደም መፍሰስ',
      'ከፍተኛ ወይም የሚቆይ ህመም',
      'ትኩሳት ወይም ከፍተኛ ምቾት ማጣት',
      'የሚያሳስብሽ ማንኛውም አዲስ ምልክት',
    ],
    summaryTitle: 'ዋና ዋና ነጥቦች',
    summaryPoints: [
      'ከወሊድ በኋላ የወር አበባ መመለስ ከወለድሽ በኋላ የወር አበባሽ ተመልሶ መምጣቱን ያመለክታል።',
      'ጡት ማጥባት የወር አበባሽ መመለስን ሊያዘገይ ይችላል።',
      'የመጀመሪያዎቹ ዑደቶች መደበኛ ላይሆኑ ይችላሉ።',
      'ቀኖቹን መጻፍ ዑደትሽ እንዴት እንደሚለወጥ ለመከታተል ሊረዳሽ ይችላል።',
    ],
    disclaimerText: 'የመረጃ ይዘት። የጊዜ ሰሌዳዎች እንደ እያንዳንዱ ሁኔታ ሊለያዩ ይችላሉ እና የሕክምና ምክርን አይተኩም።',
  },
  nl: {
    badge: 'FREEMIUM • POSTPARTUM',
    title: 'Terugkeer van de menstruatie na de bevalling,\nwat kun je verwachten',
    metaDuration: '5 min lezen',
    metaType: 'Gids',
    intro: 'Na de bevalling kan het even duren voordat je menstruatie terugkomt. Het tijdstip verschilt onder meer naargelang de borstvoeding, en iedereen kan deze periode anders beleven.',
    shareMessage: 'Terugkeer van de menstruatie na de bevalling, wat kun je verwachten — AWA',
    h2_1: '1. Wat is de terugkeer van de menstruatie na de bevalling?',
    body1: 'De “terugkeer van de menstruatie” verwijst naar het terugkomen van je menstruatie na de bevalling. De menstruatiecyclus keert niet per se meteen terug naar zijn gebruikelijke ritme.',
    highlightTitle: 'Belangrijk punt',
    highlightText: 'Er is geen enkel tijdschema dat voor iedereen geldt.',
    h2_2: '2. Wanneer kan je menstruatie terugkomen?',
    body2: 'Het tijdstip hangt grotendeels af van de borstvoeding. Zonder borstvoeding kan je menstruatie over het algemeen rond 6 tot 8 weken terugkeren. Bij uitsluitend borstvoeding kan het enkele maanden worden uitgesteld.',
    simpleInfoTitle1: 'Zonder borstvoeding',
    simpleInfoText1: 'Over het algemeen rond 6 tot 8 weken.',
    simpleInfoTitle2: 'Bij uitsluitend borstvoeding',
    simpleInfoText2: 'De terugkeer kan enkele maanden worden uitgesteld.',
    h2_3: '3. Het verloop van de terugkeer van de cyclus',
    body3: 'De cyclus keert na de bevalling geleidelijk terug. Borstvoeding kan beïnvloeden wanneer je menstruatie weer verschijnt.',
    schemaTitle: 'Geleidelijke terugkeer van de cyclus',
    schemaSubtitle: 'Een algemene leidraad, stap voor stap',
    cycleStages: [
      {title: 'Na de bevalling', text: 'De menstruatiecyclus ligt na de bevalling tijdelijk stil.'},
      {title: 'Postpartumperiode', text: 'Het lichaam herstelt geleidelijk en de hormoonspiegels verschuiven.'},
      {title: 'Borstvoeding', text: 'Borstvoeding kan de terugkeer van je menstruatie uitstellen, maar het effect verschilt van persoon tot persoon.'},
      {title: 'Terugkeer van de menstruatie', text: 'Je eerste menstruatie kan na enkele weken of meerdere maanden terugkeren.'},
      {title: 'Eerste cycli', text: 'Cycli kunnen onregelmatig zijn voordat ze geleidelijk weer hun gebruikelijke ritme vinden.'},
    ],
    schemaNoteText: 'Er is geen identiek tijdschema voor iedereen. Het moment waarop je menstruatie terugkeert kan van persoon tot persoon verschillen, vooral naargelang de borstvoeding.',
    h2_4: '4. De eerste cycli',
    body4: 'Wanneer je menstruatie terugkeert, kunnen de eerste cycli verschillen van die vóór de zwangerschap. Ze kunnen in het begin vooral onregelmatig zijn.',
    card1Title: 'Wisselend ritme',
    card1Text: 'De cyclus kan tijd nodig hebben om weer een vertrouwd ritme te vinden.',
    card2Title: 'Ander bloedverlies',
    card2Text: 'Het bloedverlies kan anders zijn dan wat je vóór de zwangerschap opmerkte.',
    h2_5: '5. Wat kun je waarnemen?',
    body5: 'Eenvoudig bijhouden helpt je beter te zien hoe je cyclus zich in de loop van de tijd ontwikkelt.',
    observations: [
      {title: 'Data', text: 'Noteer de eerste dag van je menstruatie.'},
      {title: 'Ritme', text: 'Observeer geleidelijk het interval tussen cycli.'},
      {title: 'Bloedverlies', text: 'Merk gewoon eventuele veranderingen op ten opzichte van wat voor jou gebruikelijk is.'},
    ],
    h2_6: '6. Wanneer moet je advies vragen?',
    body6: 'Als iets ongewoon, aanhoudend of zorgwekkend lijkt, vraag dan advies aan een zorgprofessional.',
    warningSigns: [
      'Bloedverlies dat je ongewoon lijkt',
      'Aanzienlijke of aanhoudende pijn',
      'Koorts of aanzienlijk onwel zijn',
      'Elk nieuw symptoom dat je zorgen baart',
    ],
    summaryTitle: 'Belangrijkste punten',
    summaryPoints: [
      'De terugkeer van de menstruatie na de bevalling verwijst naar het terugkomen van je menstruatie na de bevalling.',
      'Borstvoeding kan de terugkeer van je menstruatie uitstellen.',
      'De eerste cycli kunnen onregelmatig zijn.',
      'De data noteren kan je helpen de ontwikkeling van je cyclus te volgen.',
    ],
    disclaimerText: 'Informatieve inhoud. Tijdschema’s kunnen per situatie verschillen en vervangen geen medisch advies.',
  },
  fi: {
    badge: 'FREEMIUM • SYNNYTYKSEN JÄLKEEN',
    title: 'Kuukautisten paluu synnytyksen jälkeen,\nmitä odottaa',
    metaDuration: '5 min lukuaika',
    metaType: 'Opas',
    intro: 'Synnytyksen jälkeen kuukautisten paluu voi viedä aikaa. Ajankohta vaihtelee muun muassa imetyksen mukaan, ja jokainen voi kokea tämän ajanjakson eri tavalla.',
    shareMessage: 'Kuukautisten paluu synnytyksen jälkeen, mitä odottaa — AWA',
    h2_1: '1. Mikä on kuukautisten paluu synnytyksen jälkeen?',
    body1: '“Kuukautisten paluu” tarkoittaa kuukautisten palaamista synnytyksen jälkeen. Kuukautiskierto ei välttämättä palaa heti tavanomaiseen rytmiinsä.',
    highlightTitle: 'Tärkeä kohta',
    highlightText: 'Kaikille yhteistä aikataulua ei ole.',
    h2_2: '2. Milloin kuukautiset voivat palata?',
    body2: 'Ajankohta riippuu suurelta osin imetyksestä. Ilman imetystä kuukautiset voivat yleensä palata noin 6–8 viikon kohdalla. Täysimetyksellä paluu voi viivästyä useita kuukausia.',
    simpleInfoTitle1: 'Ilman imetystä',
    simpleInfoText1: 'Yleensä noin 6–8 viikkoa.',
    simpleInfoTitle2: 'Täysimetyksellä',
    simpleInfoText2: 'Paluu voi viivästyä useita kuukausia.',
    h2_3: '3. Kierron paluun kaava',
    body3: 'Kierto palaa synnytyksen jälkeen asteittain. Imetys voi vaikuttaa siihen, milloin kuukautiset ilmaantuvat uudelleen.',
    schemaTitle: 'Kierron asteittainen paluu',
    schemaSubtitle: 'Yleinen opas vaihe vaiheelta',
    cycleStages: [
      {title: 'Synnytyksen jälkeen', text: 'Kuukautiskierto keskeytyy tilapäisesti synnytyksen jälkeen.'},
      {title: 'Synnytyksen jälkeinen aika', text: 'Keho toipuu asteittain ja hormonitasot muuttuvat.'},
      {title: 'Imetys', text: 'Imetys voi viivästyttää kuukautisten paluuta, mutta sen vaikutus vaihtelee ihmisestä toiseen.'},
      {title: 'Kuukautisten paluu', text: 'Ensimmäiset kuukautisesi voivat palata muutaman viikon tai usean kuukauden kuluttua.'},
      {title: 'Ensimmäiset kierrot', text: 'Kierrot voivat olla epäsäännöllisiä ennen kuin ne vähitellen asettuvat takaisin tavanomaiseen rytmiinsä.'},
    ],
    schemaNoteText: 'Kaikille identtistä aikataulua ei ole. Kuukautisten paluun ajankohta voi vaihdella ihmisestä toiseen erityisesti imetyksen mukaan.',
    h2_4: '4. Ensimmäiset kierrot',
    body4: 'Kun kuukautiset palaavat, ensimmäiset kierrot voivat poiketa ennen raskautta olleista. Ne voivat erityisesti olla aluksi epäsäännöllisiä.',
    card1Title: 'Vaihteleva rytmi',
    card1Text: 'Kierto voi tarvita aikaa asettuakseen takaisin tuttuun rytmiin.',
    card2Title: 'Erilainen vuoto',
    card2Text: 'Vuoto voi olla erilainen kuin se, jonka havaitsit ennen raskautta.',
    h2_5: '5. Mitä voit havainnoida?',
    body5: 'Yksinkertainen seuranta auttaa havainnoimaan paremmin, miten kiertosi kehittyy ajan myötä.',
    observations: [
      {title: 'Päivämäärät', text: 'Kirjaa kuukautistesi ensimmäinen päivä.'},
      {title: 'Rytmi', text: 'Havainnoi asteittain kiertojen välistä aikaväliä.'},
      {title: 'Vuoto', text: 'Huomaa yksinkertaisesti mahdolliset muutokset verrattuna sinulle tavanomaiseen.'},
    ],
    h2_6: '6. Milloin pitäisi pyytää neuvoa?',
    body6: 'Jos jokin vaikuttaa epätavalliselta, pitkäkestoiselta tai huolestuttavalta, pyydä neuvoa terveydenhuollon ammattilaiselta.',
    warningSigns: [
      'Vuoto, joka vaikuttaa sinusta epätavalliselta',
      'Merkittävä tai pitkäkestoinen kipu',
      'Kuume tai merkittävä huono olo',
      'Mikä tahansa uusi oire, joka huolestuttaa sinua',
    ],
    summaryTitle: 'Tärkeimmät asiat',
    summaryPoints: [
      'Kuukautisten paluu synnytyksen jälkeen tarkoittaa kuukautisten palaamista synnytyksen jälkeen.',
      'Imetys voi viivästyttää kuukautisten paluuta.',
      'Ensimmäiset kierrot voivat olla epäsäännöllisiä.',
      'Päivämäärien kirjaaminen voi auttaa seuraamaan kiertosi kehitystä.',
    ],
    disclaimerText: 'Tiedoksi tarkoitettua sisältöä. Aikataulut voivat vaihdella tilanteen mukaan, eivätkä ne korvaa lääketieteellistä neuvontaa.',
  },
  el: {
    badge: 'FREEMIUM • ΛΟΧΕΙΑ',
    title: 'Επιστροφή της περιόδου μετά τον τοκετό,\nτι να περιμένεις',
    metaDuration: '5 λεπτά ανάγνωσης',
    metaType: 'Οδηγός',
    intro: 'Μετά τον τοκετό, η επιστροφή της περιόδου σου μπορεί να πάρει λίγο χρόνο. Ο χρόνος διαφέρει ανάλογα, μεταξύ άλλων, με τον θηλασμό και κάθε γυναίκα μπορεί να βιώσει αυτή την περίοδο διαφορετικά.',
    shareMessage: 'Επιστροφή της περιόδου μετά τον τοκετό, τι να περιμένεις — AWA',
    h2_1: '1. Τι είναι η επιστροφή της περιόδου μετά τον τοκετό;',
    body1: 'Η «επιστροφή της περιόδου» αναφέρεται στην επανεμφάνιση της περιόδου σου μετά τον τοκετό. Ο έμμηνος κύκλος δεν επανέρχεται αναγκαστικά αμέσως στον συνηθισμένο του ρυθμό.',
    highlightTitle: 'Βασικό σημείο',
    highlightText: 'Δεν υπάρχει ένα μόνο χρονοδιάγραμμα που ισχύει για όλες.',
    h2_2: '2. Πότε μπορεί να επιστρέψει η περίοδός σου;',
    body2: 'Ο χρόνος εξαρτάται σε μεγάλο βαθμό από τον θηλασμό. Χωρίς θηλασμό, η περίοδός σου μπορεί γενικά να επιστρέψει γύρω στις 6 έως 8 εβδομάδες. Με αποκλειστικό θηλασμό, μπορεί να καθυστερήσει αρκετούς μήνες.',
    simpleInfoTitle1: 'Χωρίς θηλασμό',
    simpleInfoText1: 'Γενικά γύρω στις 6 έως 8 εβδομάδες.',
    simpleInfoTitle2: 'Με αποκλειστικό θηλασμό',
    simpleInfoText2: 'Η επιστροφή μπορεί να καθυστερήσει αρκετούς μήνες.',
    h2_3: '3. Το μοτίβο επιστροφής του κύκλου',
    body3: 'Ο κύκλος επιστρέφει σταδιακά μετά τον τοκετό. Ο θηλασμός μπορεί να επηρεάσει το πότε επανεμφανίζεται η περίοδός σου.',
    schemaTitle: 'Σταδιακή επιστροφή του κύκλου',
    schemaSubtitle: 'Ένας γενικός οδηγός, βήμα βήμα',
    cycleStages: [
      {title: 'Μετά τον τοκετό', text: 'Ο έμμηνος κύκλος διακόπτεται προσωρινά μετά τον τοκετό.'},
      {title: 'Λοχεία', text: 'Το σώμα αναρρώνει σταδιακά και τα επίπεδα ορμονών μεταβάλλονται.'},
      {title: 'Θηλασμός', text: 'Ο θηλασμός μπορεί να καθυστερήσει την επιστροφή της περιόδου σου, αλλά η επίδρασή του διαφέρει από γυναίκα σε γυναίκα.'},
      {title: 'Επιστροφή της περιόδου', text: 'Η πρώτη σου περίοδος μπορεί να επιστρέψει μετά από λίγες εβδομάδες ή αρκετούς μήνες.'},
      {title: 'Οι πρώτοι κύκλοι', text: 'Οι κύκλοι μπορεί να είναι ακανόνιστοι πριν σταδιακά ξαναβρούν τον συνηθισμένο τους ρυθμό.'},
    ],
    schemaNoteText: 'Δεν υπάρχει πανομοιότυπο χρονοδιάγραμμα για όλες. Το πότε επιστρέφει η περίοδός σου μπορεί να διαφέρει από γυναίκα σε γυναίκα, ιδίως ανάλογα με τον θηλασμό.',
    h2_4: '4. Οι πρώτοι κύκλοι',
    body4: 'Όταν επιστρέψει η περίοδός σου, οι πρώτοι κύκλοι μπορεί να διαφέρουν από εκείνους πριν την εγκυμοσύνη. Συγκεκριμένα, μπορεί να είναι ακανόνιστοι στην αρχή.',
    card1Title: 'Μεταβλητός ρυθμός',
    card1Text: 'Ο κύκλος μπορεί να χρειαστεί χρόνο για να ξαναβρεί έναν οικείο ρυθμό.',
    card2Title: 'Διαφορετική ροή',
    card2Text: 'Η ροή μπορεί να είναι διαφορετική από όσα παρατηρούσες πριν την εγκυμοσύνη.',
    h2_5: '5. Τι μπορείς να παρατηρείς;',
    body5: 'Μια απλή παρακολούθηση σε βοηθά να παρατηρείς καλύτερα πώς εξελίσσεται ο κύκλος σου με τον καιρό.',
    observations: [
      {title: 'Ημερομηνίες', text: 'Σημείωσε την πρώτη ημέρα της περιόδου σου.'},
      {title: 'Ρυθμός', text: 'Παρατήρησε σταδιακά το διάστημα ανάμεσα στους κύκλους.'},
      {title: 'Ροή', text: 'Απλώς παρατήρησε τυχόν αλλαγές σε σύγκριση με το συνηθισμένο για σένα.'},
    ],
    h2_6: '6. Πότε πρέπει να ζητήσεις συμβουλή;',
    body6: 'Αν κάτι φαίνεται ασυνήθιστο, επίμονο ή ανησυχητικό, ζήτησε συμβουλή από έναν επαγγελματία υγείας.',
    warningSigns: [
      'Αιμορραγία που σου φαίνεται ασυνήθιστη',
      'Σημαντικός ή επίμονος πόνος',
      'Πυρετός ή σημαντική δυσφορία',
      'Οποιοδήποτε νέο σύμπτωμα που σε ανησυχεί',
    ],
    summaryTitle: 'Βασικά συμπεράσματα',
    summaryPoints: [
      'Η επιστροφή της περιόδου μετά τον τοκετό αναφέρεται στην επανεμφάνιση της περιόδου σου μετά τον τοκετό.',
      'Ο θηλασμός μπορεί να καθυστερήσει την επιστροφή της περιόδου σου.',
      'Οι πρώτοι κύκλοι μπορεί να είναι ακανόνιστοι.',
      'Η καταγραφή των ημερομηνιών μπορεί να σε βοηθήσει να παρακολουθείς την εξέλιξη του κύκλου σου.',
    ],
    disclaimerText: 'Ενημερωτικό περιεχόμενο. Οι χρόνοι μπορεί να διαφέρουν ανάλογα με κάθε περίπτωση και δεν αντικαθιστούν την ιατρική συμβουλή.',
  },
  fil: {
    badge: 'FREEMIUM • PAGKATAPOS MANGANAK',
    title: 'Pagbabalik ng regla pagkatapos manganak,\nano ang aasahan',
    metaDuration: '5 min na babasahin',
    metaType: 'Gabay',
    intro: 'Pagkatapos manganak, maaaring abutin ng ilang panahon ang pagbabalik ng iyong regla. Nag-iiba ang tiyempo depende, bukod sa iba pa, sa pagpapasuso, at maaaring maranasan ng bawat tao ang panahong ito nang magkaiba.',
    shareMessage: 'Pagbabalik ng regla pagkatapos manganak, ano ang aasahan — AWA',
    h2_1: '1. Ano ang pagbabalik ng regla pagkatapos manganak?',
    body1: 'Ang “pagbabalik ng regla” ay tumutukoy sa pagbabalik ng iyong regla pagkatapos manganak. Hindi kinakailangang agad bumalik sa karaniwan nitong ritmo ang siklo ng regla.',
    highlightTitle: 'Pangunahing punto',
    highlightText: 'Walang iisang takdang panahon na naaangkop sa lahat.',
    h2_2: '2. Kailan maaaring bumalik ang iyong regla?',
    body2: 'Malaking bahagi ng tiyempo ay nakadepende sa pagpapasuso. Kung hindi nagpapasuso, karaniwang maaaring bumalik ang iyong regla sa humigit-kumulang 6 hanggang 8 linggo. Kung eksklusibong nagpapasuso, maaari itong maantala nang ilang buwan.',
    simpleInfoTitle1: 'Kung hindi nagpapasuso',
    simpleInfoText1: 'Karaniwang humigit-kumulang 6 hanggang 8 linggo.',
    simpleInfoTitle2: 'Kung eksklusibong nagpapasuso',
    simpleInfoText2: 'Maaaring maantala nang ilang buwan ang pagbabalik.',
    h2_3: '3. Ang pattern ng pagbabalik ng siklo',
    body3: 'Unti-unting bumabalik ang siklo pagkatapos manganak. Maaaring makaimpluwensya ang pagpapasuso sa kung kailan muling lilitaw ang iyong regla.',
    schemaTitle: 'Unti-unting pagbabalik ng siklo',
    schemaSubtitle: 'Isang pangkalahatang gabay, hakbang-hakbang',
    cycleStages: [
      {title: 'Pagkatapos manganak', text: 'Pansamantalang humihinto ang siklo ng regla pagkatapos manganak.'},
      {title: 'Panahon pagkatapos manganak', text: 'Unti-unting gumagaling ang katawan at nagbabago ang antas ng hormone.'},
      {title: 'Pagpapasuso', text: 'Maaaring maantala ng pagpapasuso ang pagbabalik ng iyong regla, ngunit nag-iiba ang epekto nito sa bawat tao.'},
      {title: 'Pagbabalik ng regla', text: 'Maaaring bumalik ang iyong unang regla pagkalipas ng ilang linggo o ilang buwan.'},
      {title: 'Unang mga siklo', text: 'Maaaring hindi regular ang mga siklo bago unti-unting bumalik sa karaniwang ritmo.'},
    ],
    schemaNoteText: 'Walang magkaparehong takdang panahon para sa lahat. Maaaring mag-iba sa bawat tao ang kung kailan babalik ang iyong regla, partikular depende sa pagpapasuso.',
    h2_4: '4. Ang unang mga siklo',
    body4: 'Kapag bumalik ang iyong regla, maaaring magkaiba ang unang mga siklo sa mga bago magbuntis. Partikular, maaaring hindi regular ang mga ito sa simula.',
    card1Title: 'Nag-iiba-ibang ritmo',
    card1Text: 'Maaaring abutin ng oras ang siklo bago bumalik sa pamilyar na ritmo.',
    card2Title: 'Ibang daloy',
    card2Text: 'Maaaring magkaiba ang daloy sa naobserbahan mo bago magbuntis.',
    h2_5: '5. Ano ang maaari mong obserbahan?',
    body5: 'Ang simpleng pagsubaybay ay tumutulong na mas maobserbahan kung paano nagbabago ang iyong siklo sa paglipas ng panahon.',
    observations: [
      {title: 'Mga petsa', text: 'Itala ang unang araw ng iyong regla.'},
      {title: 'Ritmo', text: 'Unti-unting obserbahan ang pagitan ng mga siklo.'},
      {title: 'Daloy', text: 'Simpleng obserbahan ang anumang pagbabago kumpara sa nakasanayan mo.'},
    ],
    h2_6: '6. Kailan dapat humingi ng payo?',
    body6: 'Kung tila hindi pangkaraniwan, patuloy, o nakababahala ang anumang bagay, humingi ng payo sa propesyonal sa kalusugan.',
    warningSigns: [
      'Pagdurugong tila hindi pangkaraniwan sa iyo',
      'Malaki o patuloy na sakit',
      'Lagnat o malaking kakulangan sa ginhawa',
      'Anumang bagong sintomas na bumabagabag sa iyo',
    ],
    summaryTitle: 'Mahahalagang tandaan',
    summaryPoints: [
      'Ang pagbabalik ng regla pagkatapos manganak ay tumutukoy sa pagbabalik ng iyong regla pagkatapos manganak.',
      'Maaaring maantala ng pagpapasuso ang pagbabalik ng iyong regla.',
      'Maaaring hindi regular ang unang mga siklo.',
      'Ang pagtatala ng mga petsa ay makakatulong na subaybayan kung paano nagbabago ang iyong siklo.',
    ],
    disclaimerText: 'Impormatibong nilalaman. Maaaring mag-iba ang mga takdang panahon depende sa bawat sitwasyon at hindi pumapalit sa payong medikal.',
  },
  ta: {
    badge: 'இலவசம் • பிரசவத்திற்குப் பின்',
    title: 'பிரசவத்திற்குப் பின் மாதவிடாய் திரும்புதல்,\nஎதை எதிர்பார்க்கலாம்',
    metaDuration: '5 நிமிடம் படிக்க',
    metaType: 'வழிகாட்டி',
    intro: 'குழந்தை பிறந்த பின், உங்கள் மாதவிடாய் திரும்ப சிறிது நேரம் ஆகலாம். இதன் நேரம் தாய்ப்பாலூட்டுதல் உட்பட பலவற்றைப் பொறுத்து மாறுபடும், ஒவ்வொருவரும் இந்தக் காலத்தை வேறுபட்ட விதத்தில் அனுபவிக்கலாம்.',
    shareMessage: 'பிரசவத்திற்குப் பின் மாதவிடாய் திரும்புதல், எதை எதிர்பார்க்கலாம் — AWA',
    h2_1: '1. பிரசவத்துக்குப் பின் மாதவிடாய் திரும்புதல் என்றால் என்ன?',
    body1: '“மாதவிடாய் திரும்புதல்” என்பது குழந்தை பிறந்த பின் உங்கள் மாதவிடாய் மீண்டும் வருவதைக் குறிக்கிறது. மாதவிடாய்ச் சுழற்சி உடனே அதன் வழக்கமான தாளத்துக்குத் திரும்ப வேண்டும் என்பதில்லை.',
    highlightTitle: 'முக்கியப் புள்ளி',
    highlightText: 'எல்லோருக்கும் பொருந்தும் ஒரே காலவரிசை இல்லை.',
    h2_2: '2. உங்கள் மாதவிடாய் எப்போது திரும்பலாம்?',
    body2: 'நேரம் பெரும்பாலும் தாய்ப்பாலூட்டுதலைப் பொறுத்தது. தாய்ப்பாலூட்டாமல் இருந்தால், உங்கள் மாதவிடாய் பொதுவாக 6 முதல் 8 வாரங்களில் திரும்பலாம். பிரத்யேகத் தாய்ப்பாலூட்டலுடன், அது பல மாதங்கள் தாமதமாகலாம்.',
    simpleInfoTitle1: 'தாய்ப்பாலூட்டாமல்',
    simpleInfoText1: 'பொதுவாக சுமார் 6 முதல் 8 வாரங்கள்.',
    simpleInfoTitle2: 'பிரத்யேகத் தாய்ப்பாலூட்டலுடன்',
    simpleInfoText2: 'திரும்புதல் பல மாதங்கள் தாமதமாகலாம்.',
    h2_3: '3. சுழற்சி திரும்புவதன் அமைப்பு',
    body3: 'குழந்தை பிறந்த பின் சுழற்சி படிப்படியாகத் திரும்புகிறது. தாய்ப்பாலூட்டுதல் உங்கள் மாதவிடாய் மீண்டும் தோன்றும் நேரத்தைப் பாதிக்கலாம்.',
    schemaTitle: 'சுழற்சி படிப்படியாகத் திரும்புதல்',
    schemaSubtitle: 'படிப்படியான ஒரு பொது வழிகாட்டி',
    cycleStages: [
      {title: 'குழந்தை பிறந்த பின்', text: 'பிரசவத்துக்குப் பின் மாதவிடாய்ச் சுழற்சி தற்காலிகமாக நின்றுவிடுகிறது.'},
      {title: 'பிரசவத்திற்குப் பின் காலம்', text: 'உடல் படிப்படியாக மீள்கிறது, ஹார்மோன் அளவுகள் மாறுகின்றன.'},
      {title: 'தாய்ப்பாலூட்டுதல்', text: 'தாய்ப்பாலூட்டுதல் உங்கள் மாதவிடாய் திரும்புவதைத் தாமதப்படுத்தலாம், ஆனால் அதன் விளைவு ஒருவருக்கு ஒருவர் மாறுபடும்.'},
      {title: 'மாதவிடாய் திரும்புதல்', text: 'உங்கள் முதல் மாதவிடாய் சில வாரங்களிலோ பல மாதங்களிலோ திரும்பலாம்.'},
      {title: 'முதல் சுழற்சிகள்', text: 'சுழற்சிகள் படிப்படியாக அவற்றின் வழக்கமான தாளத்துக்குத் திரும்பும் முன் ஒழுங்கற்றதாக இருக்கலாம்.'},
    ],
    schemaNoteText: 'எல்லோருக்கும் ஒரே காலவரிசை இல்லை. உங்கள் மாதவிடாய் திரும்பும் நேரம், குறிப்பாகத் தாய்ப்பாலூட்டுதலைப் பொறுத்து, ஒருவருக்கு ஒருவர் மாறுபடலாம்.',
    h2_4: '4. முதல் சுழற்சிகள்',
    body4: 'உங்கள் மாதவிடாய் திரும்பும்போது, முதல் சுழற்சிகள் கர்ப்பத்துக்கு முந்தையவற்றிலிருந்து வேறுபடலாம். குறிப்பாக, தொடக்கத்தில் அவை ஒழுங்கற்றதாக இருக்கலாம்.',
    card1Title: 'மாறுபடும் தாளம்',
    card1Text: 'சுழற்சி ஒரு பழக்கமான தாளத்துக்குத் திரும்ப நேரம் எடுக்கலாம்.',
    card2Title: 'வேறுபட்ட இரத்தப்போக்கு',
    card2Text: 'இரத்தப்போக்கு கர்ப்பத்துக்கு முன் நீங்கள் கவனித்ததிலிருந்து வேறுபடலாம்.',
    h2_5: '5. நீங்கள் என்ன கவனிக்கலாம்?',
    body5: 'எளிய கண்காணிப்பு காலப்போக்கில் உங்கள் சுழற்சி எப்படி மாறுகிறது என்பதை நன்கு கவனிக்க உதவுகிறது.',
    observations: [
      {title: 'தேதிகள்', text: 'உங்கள் மாதவிடாயின் முதல் நாளைக் குறியுங்கள்.'},
      {title: 'தாளம்', text: 'சுழற்சிகளுக்கு இடையிலான இடைவெளியைப் படிப்படியாகக் கவனியுங்கள்.'},
      {title: 'இரத்தப்போக்கு', text: 'உங்களுக்கு வழக்கமானதுடன் ஒப்பிடும்போது ஏற்படும் மாற்றங்களை எளிமையாகக் கவனியுங்கள்.'},
    ],
    h2_6: '6. ஆலோசனையை எப்போது கேட்க வேண்டும்?',
    body6: 'ஏதேனும் வழக்கத்துக்கு மாறாக, நீடிப்பதாக அல்லது கவலையளிப்பதாகத் தோன்றினால், ஒரு சுகாதார நிபுணரின் ஆலோசனையைப் பெறுங்கள்.',
    warningSigns: [
      'உங்களுக்கு வழக்கத்துக்கு மாறாகத் தோன்றும் இரத்தப்போக்கு',
      'குறிப்பிடத்தக்க அல்லது நீடிக்கும் வலி',
      'காய்ச்சல் அல்லது குறிப்பிடத்தக்க அசௌகரியம்',
      'உங்களைக் கவலைப்படுத்தும் ஏதேனும் புதிய அறிகுறி',
    ],
    summaryTitle: 'முக்கியக் குறிப்புகள்',
    summaryPoints: [
      'பிரசவத்துக்குப் பின் மாதவிடாய் திரும்புதல் என்பது குழந்தை பிறந்த பின் உங்கள் மாதவிடாய் மீண்டும் வருவதைக் குறிக்கிறது.',
      'தாய்ப்பாலூட்டுதல் உங்கள் மாதவிடாய் திரும்புவதைத் தாமதப்படுத்தலாம்.',
      'முதல் சுழற்சிகள் ஒழுங்கற்றதாக இருக்கலாம்.',
      'தேதிகளைக் குறிப்பது உங்கள் சுழற்சி எப்படி மாறுகிறது என்பதைக் கண்காணிக்க உதவலாம்.',
    ],
    disclaimerText: 'தகவல் உள்ளடக்கம். காலவரிசைகள் ஒவ்வொரு சூழ்நிலையையும் பொறுத்து மாறுபடலாம், மருத்துவ ஆலோசனைக்கு மாற்றல்ல.',
  },
  te: {
    badge: 'ఉచితం • ప్రసవానంతరం',
    title: 'ప్రసవం తర్వాత నెలసరి తిరిగి రావడం,\nఏమి ఆశించాలి',
    metaDuration: '5 నిమిషాల పఠనం',
    metaType: 'గైడ్',
    intro: 'బిడ్డకు జన్మనిచ్చిన తర్వాత, మీ నెలసరి తిరిగి రావడానికి కొంత సమయం పట్టవచ్చు. సమయం తల్లిపాలు ఇవ్వడం సహా అనేక అంశాలను బట్టి మారుతుంది, ప్రతి ఒక్కరూ ఈ కాలాన్ని భిన్నంగా అనుభవించవచ్చు.',
    shareMessage: 'ప్రసవం తర్వాత నెలసరి తిరిగి రావడం, ఏమి ఆశించాలి — AWA',
    h2_1: '1. ప్రసవం తర్వాత నెలసరి తిరిగి రావడం అంటే ఏమిటి?',
    body1: '“నెలసరి తిరిగి రావడం” అంటే బిడ్డకు జన్మనిచ్చిన తర్వాత మీ నెలసరి మళ్లీ రావడం. నెలసరి చక్రం వెంటనే తన సాధారణ లయకు తిరిగి రావాలని ఏమీ లేదు.',
    highlightTitle: 'ముఖ్యమైన అంశం',
    highlightText: 'అందరికీ వర్తించే ఒకే కాలపట్టిక లేదు.',
    h2_2: '2. మీ నెలసరి ఎప్పుడు తిరిగి రావచ్చు?',
    body2: 'సమయం చాలావరకు తల్లిపాలు ఇవ్వడంపై ఆధారపడి ఉంటుంది. తల్లిపాలు ఇవ్వకపోతే, మీ నెలసరి సాధారణంగా సుమారు 6 నుండి 8 వారాల్లో తిరిగి రావచ్చు. కేవలం తల్లిపాలు ఇస్తుంటే, అది అనేక నెలలు ఆలస్యం కావచ్చు.',
    simpleInfoTitle1: 'తల్లిపాలు ఇవ్వకుండా',
    simpleInfoText1: 'సాధారణంగా సుమారు 6 నుండి 8 వారాలు.',
    simpleInfoTitle2: 'కేవలం తల్లిపాలతో',
    simpleInfoText2: 'తిరిగి రావడం అనేక నెలలు ఆలస్యం కావచ్చు.',
    h2_3: '3. చక్రం తిరిగి రావడం యొక్క తీరు',
    body3: 'బిడ్డకు జన్మనిచ్చిన తర్వాత చక్రం క్రమంగా తిరిగి వస్తుంది. తల్లిపాలు ఇవ్వడం మీ నెలసరి మళ్లీ కనిపించే సమయాన్ని ప్రభావితం చేయవచ్చు.',
    schemaTitle: 'చక్రం క్రమంగా తిరిగి రావడం',
    schemaSubtitle: 'అడుగు అడుగునా ఒక సాధారణ మార్గదర్శి',
    cycleStages: [
      {title: 'బిడ్డకు జన్మనిచ్చిన తర్వాత', text: 'ప్రసవం తర్వాత నెలసరి చక్రం తాత్కాలికంగా ఆగిపోతుంది.'},
      {title: 'ప్రసవానంతర కాలం', text: 'శరీరం క్రమంగా కోలుకుంటుంది, హార్మోన్ స్థాయిలు మారతాయి.'},
      {title: 'తల్లిపాలు ఇవ్వడం', text: 'తల్లిపాలు ఇవ్వడం మీ నెలసరి తిరిగి రావడాన్ని ఆలస్యం చేయవచ్చు, కానీ దాని ప్రభావం ఒకరి నుండి మరొకరికి మారుతుంది.'},
      {title: 'నెలసరి తిరిగి రావడం', text: 'మీ మొదటి నెలసరి కొన్ని వారాల తర్వాత లేదా అనేక నెలల తర్వాత తిరిగి రావచ్చు.'},
      {title: 'మొదటి చక్రాలు', text: 'చక్రాలు క్రమంగా వాటి సాధారణ లయకు తిరిగి రాకముందు అస్తవ్యస్తంగా ఉండవచ్చు.'},
    ],
    schemaNoteText: 'అందరికీ ఒకే కాలపట్టిక లేదు. మీ నెలసరి తిరిగి వచ్చే సమయం, ముఖ్యంగా తల్లిపాలు ఇవ్వడాన్ని బట్టి, ఒకరి నుండి మరొకరికి మారవచ్చు.',
    h2_4: '4. మొదటి చక్రాలు',
    body4: 'మీ నెలసరి తిరిగి వచ్చినప్పుడు, మొదటి చక్రాలు గర్భధారణకు ముందువాటికి భిన్నంగా ఉండవచ్చు. ముఖ్యంగా, ఆరంభంలో అవి అస్తవ్యస్తంగా ఉండవచ్చు.',
    card1Title: 'మారుతూ ఉండే లయ',
    card1Text: 'చక్రం ఒక పరిచిత లయలో స్థిరపడటానికి సమయం పట్టవచ్చు.',
    card2Title: 'భిన్నమైన రక్తస్రావం',
    card2Text: 'రక్తస్రావం గర్భధారణకు ముందు మీరు గమనించిన దానికి భిన్నంగా ఉండవచ్చు.',
    h2_5: '5. మీరు ఏమి గమనించవచ్చు?',
    body5: 'సరళమైన ట్రాకింగ్ కాలక్రమేణా మీ చక్రం ఎలా మారుతుందో మరింత బాగా గమనించడానికి సహాయపడుతుంది.',
    observations: [
      {title: 'తేదీలు', text: 'మీ నెలసరి మొదటి రోజును గమనించండి.'},
      {title: 'లయ', text: 'చక్రాల మధ్య అంతరాన్ని క్రమంగా గమనించండి.'},
      {title: 'రక్తస్రావం', text: 'మీకు సాధారణమైనదానితో పోలిస్తే ఏవైనా మార్పులను సరళంగా గమనించండి.'},
    ],
    h2_6: '6. మీరు సలహాను ఎప్పుడు కోరాలి?',
    body6: 'ఏదైనా అసాధారణంగా, కొనసాగేదిగా లేదా ఆందోళన కలిగించేదిగా అనిపిస్తే, ఒక ఆరోగ్య నిపుణుడి సలహా తీసుకోండి.',
    warningSigns: [
      'మీకు అసాధారణంగా అనిపించే రక్తస్రావం',
      'గణనీయమైన లేదా కొనసాగే నొప్పి',
      'జ్వరం లేదా గణనీయమైన అసౌకర్యం',
      'మిమ్మల్ని ఆందోళనపెట్టే ఏదైనా కొత్త లక్షణం',
    ],
    summaryTitle: 'ముఖ్యాంశాలు',
    summaryPoints: [
      'ప్రసవం తర్వాత నెలసరి తిరిగి రావడం అంటే బిడ్డకు జన్మనిచ్చిన తర్వాత మీ నెలసరి మళ్లీ రావడం.',
      'తల్లిపాలు ఇవ్వడం మీ నెలసరి తిరిగి రావడాన్ని ఆలస్యం చేయవచ్చు.',
      'మొదటి చక్రాలు అస్తవ్యస్తంగా ఉండవచ్చు.',
      'తేదీలను గమనించడం మీ చక్రం ఎలా మారుతుందో ట్రాక్ చేయడానికి సహాయపడవచ్చు.',
    ],
    disclaimerText: 'సమాచార కంటెంట్. కాలపట్టికలు ప్రతి పరిస్థితిని బట్టి మారవచ్చు, వైద్య సలహాకు ప్రత్యామ్నాయం కావు.',
  },
  mr: {
    badge: 'फ्रीमियम • प्रसूतीनंतर',
    title: 'प्रसूतीनंतर पाळी परत येणे,\nकाय अपेक्षित आहे',
    metaDuration: '5 मिनिटे वाचन',
    metaType: 'मार्गदर्शक',
    intro: 'बाळाला जन्म दिल्यानंतर, तुमची पाळी परत येण्यास थोडा वेळ लागू शकतो. वेळ विशेषतः स्तनपानावर अवलंबून बदलते आणि प्रत्येक व्यक्ती हा काळ वेगळ्या प्रकारे अनुभवू शकते.',
    shareMessage: 'प्रसूतीनंतर पाळी परत येणे, काय अपेक्षित आहे — AWA',
    h2_1: '1. प्रसूतीनंतर पाळी परत येणे म्हणजे काय?',
    body1: '“पाळी परत येणे” म्हणजे बाळाला जन्म दिल्यानंतर तुमची पाळी पुन्हा येणे. मासिक पाळी लगेचच तिच्या नेहमीच्या लयीत परत येतेच असे नाही.',
    highlightTitle: 'मुख्य मुद्दा',
    highlightText: 'प्रत्येकासाठी लागू होणारी एकच कालमर्यादा नाही.',
    h2_2: '2. तुमची पाळी केव्हा परत येऊ शकते?',
    body2: 'वेळ मुख्यतः स्तनपानावर अवलंबून असतो. स्तनपान न केल्यास, तुमची पाळी साधारणपणे सुमारे 6 ते 8 आठवड्यांत परत येऊ शकते. केवळ स्तनपान केल्यास, ती अनेक महिने लांबू शकते.',
    simpleInfoTitle1: 'स्तनपानाशिवाय',
    simpleInfoText1: 'साधारणपणे सुमारे 6 ते 8 आठवडे.',
    simpleInfoTitle2: 'केवळ स्तनपानासह',
    simpleInfoText2: 'परत येणे अनेक महिने लांबू शकते.',
    h2_3: '3. पाळी परत येण्याचा नमुना',
    body3: 'बाळाला जन्म दिल्यानंतर पाळी हळूहळू परत येते. स्तनपान तुमची पाळी केव्हा पुन्हा दिसते यावर परिणाम करू शकते.',
    schemaTitle: 'पाळी हळूहळू परत येणे',
    schemaSubtitle: 'एक सर्वसाधारण मार्गदर्शक, पायरी पायरीने',
    cycleStages: [
      {title: 'बाळाला जन्म दिल्यानंतर', text: 'प्रसूतीनंतर मासिक पाळी तात्पुरती थांबते.'},
      {title: 'प्रसूतीनंतरचा काळ', text: 'शरीर हळूहळू बरे होते आणि हार्मोन्सची पातळी बदलते.'},
      {title: 'स्तनपान', text: 'स्तनपान तुमची पाळी परत येणे लांबवू शकते, पण त्याचा परिणाम एका व्यक्तीपासून दुसऱ्या व्यक्तीपर्यंत बदलतो.'},
      {title: 'पाळी परत येणे', text: 'तुमची पहिली पाळी काही आठवड्यांनंतर किंवा अनेक महिन्यांनंतर परत येऊ शकते.'},
      {title: 'पहिली पाळीचक्रे', text: 'पाळी त्यांच्या नेहमीच्या लयीत हळूहळू स्थिर होण्यापूर्वी अनियमित असू शकते.'},
    ],
    schemaNoteText: 'प्रत्येकासाठी सारखी कालमर्यादा नाही. तुमची पाळी केव्हा परत येते ते एका व्यक्तीपासून दुसऱ्या व्यक्तीपर्यंत, विशेषतः स्तनपानानुसार, बदलू शकते.',
    h2_4: '4. पहिली पाळीचक्रे',
    body4: 'तुमची पाळी परत आल्यावर, पहिली पाळीचक्रे गर्भारपणापूर्वीच्या पाळ्यांपेक्षा वेगळी असू शकतात. विशेषतः, ती सुरुवातीला अनियमित असू शकतात.',
    card1Title: 'बदलती लय',
    card1Text: 'पाळी ओळखीच्या लयीत पुन्हा स्थिर होण्यास वेळ लागू शकतो.',
    card2Title: 'वेगळा स्राव',
    card2Text: 'स्राव तुम्ही गर्भारपणापूर्वी पाहिलेल्या स्रावापेक्षा वेगळा असू शकतो.',
    h2_5: '5. तुम्ही काय निरीक्षण करू शकता?',
    body5: 'साधा मागोवा तुम्हाला कालांतराने तुमची पाळी कशी बदलते ते अधिक चांगले पाहण्यास मदत करतो.',
    observations: [
      {title: 'तारखा', text: 'तुमच्या पाळीचा पहिला दिवस नोंदवा.'},
      {title: 'लय', text: 'पाळ्यांमधील अंतराचे हळूहळू निरीक्षण करा.'},
      {title: 'स्राव', text: 'तुमच्यासाठी नेहमीच्या स्रावाच्या तुलनेत कोणतेही बदल फक्त पाहा.'},
    ],
    h2_6: '6. सल्ला केव्हा घ्यावा?',
    body6: 'काही असामान्य, कायम राहणारे किंवा चिंताजनक वाटल्यास, आरोग्य व्यावसायिकाचा सल्ला घ्या.',
    warningSigns: [
      'तुम्हाला असामान्य वाटणारा रक्तस्राव',
      'लक्षणीय किंवा कायम राहणारी वेदना',
      'ताप किंवा लक्षणीय अस्वस्थता',
      'तुम्हाला काळजीत टाकणारे कोणतेही नवीन लक्षण',
    ],
    summaryTitle: 'मुख्य मुद्दे',
    summaryPoints: [
      'प्रसूतीनंतर पाळी परत येणे म्हणजे बाळाला जन्म दिल्यानंतर तुमची पाळी पुन्हा येणे.',
      'स्तनपान तुमची पाळी परत येणे लांबवू शकते.',
      'पहिली पाळीचक्रे अनियमित असू शकतात.',
      'तारखा नोंदवल्याने तुमची पाळी कशी बदलते याचा मागोवा घेण्यास मदत होऊ शकते.',
    ],
    disclaimerText: 'माहितीपर मजकूर. कालमर्यादा प्रत्येक परिस्थितीनुसार बदलू शकतात आणि वैद्यकीय सल्ल्याची जागा घेत नाहीत.',
  },
  gu: {
    badge: 'ફ્રીમિયમ • પ્રસૂતિ પછી',
    title: 'પ્રસૂતિ પછી માસિક પાછું આવવું,\nશું અપેક્ષા રાખવી',
    metaDuration: '5 મિનિટ વાંચન',
    metaType: 'માર્ગદર્શિકા',
    intro: 'પ્રસૂતિ પછી, તમારું માસિક પાછું આવવામાં થોડો સમય લાગી શકે છે. સમય અન્ય બાબતો ઉપરાંત સ્તનપાન પર આધાર રાખીને બદલાય છે, અને દરેક વ્યક્તિ આ સમયગાળો અલગ રીતે અનુભવી શકે છે.',
    shareMessage: 'પ્રસૂતિ પછી માસિક પાછું આવવું, શું અપેક્ષા રાખવી — AWA',
    h2_1: '1. પ્રસૂતિ પછી માસિક પાછું આવવું એટલે શું?',
    body1: '“માસિક પાછું આવવું” એટલે પ્રસૂતિ પછી તમારું માસિક ફરી શરૂ થવું. માસિક ચક્ર તરત જ તેની સામાન્ય લયમાં પાછું આવે એવું જરૂરી નથી.',
    highlightTitle: 'મુખ્ય મુદ્દો',
    highlightText: 'એવી કોઈ એક સમયરેખા નથી જે બધાને લાગુ પડે.',
    h2_2: '2. તમારું માસિક ક્યારે પાછું આવી શકે?',
    body2: 'સમય મોટા ભાગે સ્તનપાન પર આધાર રાખે છે. સ્તનપાન ન કરાવતાં હો તો, તમારું માસિક સામાન્ય રીતે લગભગ 6 થી 8 અઠવાડિયામાં પાછું આવી શકે છે. ફક્ત સ્તનપાન કરાવતાં હો તો, તે ઘણા મહિના મોડું થઈ શકે છે.',
    simpleInfoTitle1: 'સ્તનપાન વિના',
    simpleInfoText1: 'સામાન્ય રીતે લગભગ 6 થી 8 અઠવાડિયા.',
    simpleInfoTitle2: 'ફક્ત સ્તનપાન સાથે',
    simpleInfoText2: 'પાછું આવવામાં ઘણા મહિના મોડું થઈ શકે છે.',
    h2_3: '3. ચક્ર પાછું આવવાની રીત',
    body3: 'પ્રસૂતિ પછી ચક્ર ધીમે ધીમે પાછું આવે છે. સ્તનપાન તમારું માસિક ફરી ક્યારે દેખાય તેને પ્રભાવિત કરી શકે છે.',
    schemaTitle: 'ચક્રનું ધીમે ધીમે પાછું આવવું',
    schemaSubtitle: 'એક સામાન્ય માર્ગદર્શિકા, પગલું દર પગલું',
    cycleStages: [
      {title: 'પ્રસૂતિ પછી', text: 'પ્રસૂતિ પછી માસિક ચક્ર અસ્થાયી રૂપે અટકી જાય છે.'},
      {title: 'પ્રસૂતિ પછીનો સમયગાળો', text: 'શરીર ધીમે ધીમે સ્વસ્થ થાય છે અને હોર્મોનનું સ્તર બદલાય છે.'},
      {title: 'સ્તનપાન', text: 'સ્તનપાન તમારું માસિક પાછું આવવામાં વિલંબ કરી શકે છે, પરંતુ તેની અસર વ્યક્તિએ વ્યક્તિએ બદલાય છે.'},
      {title: 'માસિક પાછું આવવું', text: 'તમારું પહેલું માસિક થોડા અઠવાડિયા અથવા ઘણા મહિના પછી પાછું આવી શકે છે.'},
      {title: 'પહેલાં ચક્ર', text: 'ધીમે ધીમે તેની સામાન્ય લયમાં સ્થિર થતાં પહેલાં ચક્ર અનિયમિત હોઈ શકે છે.'},
    ],
    schemaNoteText: 'બધા માટે એકસરખી સમયરેખા હોતી નથી. તમારું માસિક ક્યારે પાછું આવે તે વ્યક્તિએ વ્યક્તિએ બદલાઈ શકે છે, ખાસ કરીને સ્તનપાન પર આધાર રાખીને.',
    h2_4: '4. પહેલાં ચક્ર',
    body4: 'જ્યારે તમારું માસિક પાછું આવે, ત્યારે પહેલાં ચક્ર ગર્ભાવસ્થા પહેલાંનાં ચક્રથી અલગ હોઈ શકે છે. ખાસ કરીને, શરૂઆતમાં તે અનિયમિત હોઈ શકે છે.',
    card1Title: 'બદલાતી લય',
    card1Text: 'ચક્રને પરિચિત લયમાં સ્થિર થવામાં સમય લાગી શકે છે.',
    card2Title: 'અલગ સ્રાવ',
    card2Text: 'સ્રાવ ગર્ભાવસ્થા પહેલાં તમે જોયો હતો તેનાથી અલગ હોઈ શકે છે.',
    h2_5: '5. તમે શું જોઈ શકો?',
    body5: 'સરળ નોંધ રાખવાથી સમય સાથે તમારું ચક્ર કેવી રીતે બદલાય છે તે વધુ સારી રીતે જોવામાં મદદ મળે છે.',
    observations: [
      {title: 'તારીખો', text: 'તમારા માસિકના પહેલા દિવસની નોંધ કરો.'},
      {title: 'લય', text: 'ચક્રો વચ્ચેના અંતરને ધીમે ધીમે જુઓ.'},
      {title: 'સ્રાવ', text: 'તમારા માટે સામાન્ય હોય તેની સરખામણીમાં કોઈ ફેરફાર થાય તો ફક્ત તે જુઓ.'},
    ],
    h2_6: '6. ક્યારે સલાહ લેવી જોઈએ?',
    body6: 'જો કંઈ અસામાન્ય, સતત રહેતું અથવા ચિંતાજનક લાગે, તો આરોગ્ય વ્યાવસાયિકની સલાહ લો.',
    warningSigns: [
      'તમને અસામાન્ય લાગતો રક્તસ્રાવ',
      'નોંધપાત્ર અથવા સતત દુખાવો',
      'તાવ અથવા નોંધપાત્ર અસ્વસ્થતા',
      'કોઈ પણ નવું લક્ષણ જે તમને ચિંતા કરાવે',
    ],
    summaryTitle: 'મુખ્ય મુદ્દા',
    summaryPoints: [
      'પ્રસૂતિ પછી માસિક પાછું આવવું એટલે પ્રસૂતિ પછી તમારું માસિક ફરી શરૂ થવું.',
      'સ્તનપાન તમારું માસિક પાછું આવવામાં વિલંબ કરી શકે છે.',
      'પહેલાં ચક્ર અનિયમિત હોઈ શકે છે.',
      'તારીખોની નોંધ રાખવાથી તમારું ચક્ર કેવી રીતે બદલાય છે તે જોવામાં મદદ મળી શકે છે.',
    ],
    disclaimerText: 'માહિતી માટેની સામગ્રી. સમયરેખા દરેક પરિસ્થિતિ પ્રમાણે બદલાઈ શકે છે અને તબીબી સલાહનું સ્થાન લેતી નથી.',
  },
  pa: {
    badge: 'ਫ੍ਰੀਮੀਅਮ • ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ',
    title: 'ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਮਾਹਵਾਰੀ ਦੀ ਵਾਪਸੀ,\nਕੀ ਉਮੀਦ ਰੱਖੀਏ',
    metaDuration: '5 ਮਿੰਟ ਪੜ੍ਹਨ',
    metaType: 'ਗਾਈਡ',
    intro: 'ਬੱਚੇ ਨੂੰ ਜਨਮ ਦੇਣ ਤੋਂ ਬਾਅਦ ਮਾਹਵਾਰੀ ਦੀ ਵਾਪਸੀ ਵਿੱਚ ਕੁਝ ਸਮਾਂ ਲੱਗ ਸਕਦਾ ਹੈ। ਇਸਦਾ ਸਮਾਂ ਹੋਰ ਗੱਲਾਂ ਦੇ ਨਾਲ-ਨਾਲ ਛਾਤੀ ਦਾ ਦੁੱਧ ਪਿਲਾਉਣ \'ਤੇ ਨਿਰਭਰ ਕਰਦਾ ਹੈ, ਅਤੇ ਹਰ ਵਿਅਕਤੀ ਇਸ ਦੌਰ ਨੂੰ ਵੱਖਰੇ ਢੰਗ ਨਾਲ ਮਹਿਸੂਸ ਕਰ ਸਕਦਾ ਹੈ।',
    shareMessage: 'ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਮਾਹਵਾਰੀ ਦੀ ਵਾਪਸੀ, ਕੀ ਉਮੀਦ ਰੱਖੀਏ — AWA',
    h2_1: '1. ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਮਾਹਵਾਰੀ ਦੀ ਵਾਪਸੀ ਕੀ ਹੈ?',
    body1: '“ਮਾਹਵਾਰੀ ਦੀ ਵਾਪਸੀ” ਦਾ ਮਤਲਬ ਹੈ ਬੱਚੇ ਨੂੰ ਜਨਮ ਦੇਣ ਤੋਂ ਬਾਅਦ ਤੁਹਾਡੀ ਮਾਹਵਾਰੀ ਦਾ ਮੁੜ ਸ਼ੁਰੂ ਹੋਣਾ। ਮਾਹਵਾਰੀ ਚੱਕਰ ਜ਼ਰੂਰੀ ਨਹੀਂ ਕਿ ਤੁਰੰਤ ਆਪਣੀ ਆਮ ਲੈਅ ਵਿੱਚ ਮੁੜ ਆ ਜਾਵੇ।',
    highlightTitle: 'ਅਹਿਮ ਨੁਕਤਾ',
    highlightText: 'ਕੋਈ ਇੱਕ ਸਮਾਂ-ਸੀਮਾ ਨਹੀਂ ਹੈ ਜੋ ਹਰ ਕਿਸੇ \'ਤੇ ਲਾਗੂ ਹੋਵੇ।',
    h2_2: '2. ਮਾਹਵਾਰੀ ਕਦੋਂ ਵਾਪਸ ਆ ਸਕਦੀ ਹੈ?',
    body2: 'ਸਮਾਂ ਕਾਫ਼ੀ ਹੱਦ ਤੱਕ ਛਾਤੀ ਦਾ ਦੁੱਧ ਪਿਲਾਉਣ \'ਤੇ ਨਿਰਭਰ ਕਰਦਾ ਹੈ। ਦੁੱਧ ਨਾ ਪਿਲਾਉਣ ਦੀ ਸਥਿਤੀ ਵਿੱਚ, ਮਾਹਵਾਰੀ ਆਮ ਤੌਰ \'ਤੇ ਲਗਭਗ 6 ਤੋਂ 8 ਹਫ਼ਤਿਆਂ ਵਿੱਚ ਮੁੜ ਆ ਸਕਦੀ ਹੈ। ਸਿਰਫ਼ ਛਾਤੀ ਦਾ ਦੁੱਧ ਪਿਲਾਉਣ ਨਾਲ ਇਸ ਵਿੱਚ ਕਈ ਮਹੀਨਿਆਂ ਦੀ ਦੇਰੀ ਹੋ ਸਕਦੀ ਹੈ।',
    simpleInfoTitle1: 'ਛਾਤੀ ਦਾ ਦੁੱਧ ਪਿਲਾਏ ਬਿਨਾਂ',
    simpleInfoText1: 'ਆਮ ਤੌਰ \'ਤੇ ਲਗਭਗ 6 ਤੋਂ 8 ਹਫ਼ਤੇ।',
    simpleInfoTitle2: 'ਸਿਰਫ਼ ਛਾਤੀ ਦਾ ਦੁੱਧ ਪਿਲਾਉਣ ਨਾਲ',
    simpleInfoText2: 'ਵਾਪਸੀ ਵਿੱਚ ਕਈ ਮਹੀਨਿਆਂ ਦੀ ਦੇਰੀ ਹੋ ਸਕਦੀ ਹੈ।',
    h2_3: '3. ਚੱਕਰ ਦੀ ਵਾਪਸੀ ਦਾ ਢੰਗ',
    body3: 'ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਚੱਕਰ ਹੌਲੀ-ਹੌਲੀ ਮੁੜ ਆਉਂਦਾ ਹੈ। ਛਾਤੀ ਦਾ ਦੁੱਧ ਪਿਲਾਉਣਾ ਇਸ ਗੱਲ ਨੂੰ ਪ੍ਰਭਾਵਿਤ ਕਰ ਸਕਦਾ ਹੈ ਕਿ ਮਾਹਵਾਰੀ ਕਦੋਂ ਮੁੜ ਦਿਖਾਈ ਦੇਵੇ।',
    schemaTitle: 'ਚੱਕਰ ਦੀ ਹੌਲੀ-ਹੌਲੀ ਵਾਪਸੀ',
    schemaSubtitle: 'ਇੱਕ ਆਮ ਗਾਈਡ, ਕਦਮ ਦਰ ਕਦਮ',
    cycleStages: [
      {title: 'ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ', text: 'ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਮਾਹਵਾਰੀ ਚੱਕਰ ਕੁਝ ਸਮੇਂ ਲਈ ਰੁਕ ਜਾਂਦਾ ਹੈ।'},
      {title: 'ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਦਾ ਦੌਰ', text: 'ਸਰੀਰ ਹੌਲੀ-ਹੌਲੀ ਠੀਕ ਹੁੰਦਾ ਹੈ ਅਤੇ ਹਾਰਮੋਨਾਂ ਦੇ ਪੱਧਰ ਬਦਲਦੇ ਹਨ।'},
      {title: 'ਛਾਤੀ ਦਾ ਦੁੱਧ ਪਿਲਾਉਣਾ', text: 'ਛਾਤੀ ਦਾ ਦੁੱਧ ਪਿਲਾਉਣ ਨਾਲ ਮਾਹਵਾਰੀ ਦੀ ਵਾਪਸੀ ਵਿੱਚ ਦੇਰੀ ਹੋ ਸਕਦੀ ਹੈ, ਪਰ ਇਸਦਾ ਅਸਰ ਹਰ ਵਿਅਕਤੀ ਵਿੱਚ ਵੱਖਰਾ ਹੁੰਦਾ ਹੈ।'},
      {title: 'ਮਾਹਵਾਰੀ ਦੀ ਵਾਪਸੀ', text: 'ਤੁਹਾਡੀ ਪਹਿਲੀ ਮਾਹਵਾਰੀ ਕੁਝ ਹਫ਼ਤਿਆਂ ਜਾਂ ਕਈ ਮਹੀਨਿਆਂ ਬਾਅਦ ਮੁੜ ਆ ਸਕਦੀ ਹੈ।'},
      {title: 'ਪਹਿਲੇ ਚੱਕਰ', text: 'ਆਪਣੀ ਆਮ ਲੈਅ ਵਿੱਚ ਹੌਲੀ-ਹੌਲੀ ਵਾਪਸ ਆਉਣ ਤੋਂ ਪਹਿਲਾਂ ਚੱਕਰ ਅਨਿਯਮਿਤ ਹੋ ਸਕਦੇ ਹਨ।'},
    ],
    schemaNoteText: 'ਹਰ ਕਿਸੇ ਲਈ ਇੱਕੋ ਜਿਹੀ ਸਮਾਂ-ਸੀਮਾ ਨਹੀਂ ਹੁੰਦੀ। ਮਾਹਵਾਰੀ ਕਦੋਂ ਮੁੜ ਆਉਂਦੀ ਹੈ, ਇਹ ਹਰ ਵਿਅਕਤੀ ਵਿੱਚ ਵੱਖਰਾ ਹੋ ਸਕਦਾ ਹੈ, ਖ਼ਾਸ ਕਰਕੇ ਛਾਤੀ ਦਾ ਦੁੱਧ ਪਿਲਾਉਣ ਮੁਤਾਬਕ।',
    h2_4: '4. ਪਹਿਲੇ ਚੱਕਰ',
    body4: 'ਜਦੋਂ ਮਾਹਵਾਰੀ ਮੁੜ ਆਉਂਦੀ ਹੈ, ਤਾਂ ਪਹਿਲੇ ਚੱਕਰ ਗਰਭ-ਅਵਸਥਾ ਤੋਂ ਪਹਿਲਾਂ ਵਾਲੇ ਚੱਕਰਾਂ ਨਾਲੋਂ ਵੱਖਰੇ ਹੋ ਸਕਦੇ ਹਨ। ਖ਼ਾਸ ਕਰਕੇ, ਸ਼ੁਰੂ ਵਿੱਚ ਇਹ ਅਨਿਯਮਿਤ ਹੋ ਸਕਦੇ ਹਨ।',
    card1Title: 'ਬਦਲਦੀ ਲੈਅ',
    card1Text: 'ਚੱਕਰ ਨੂੰ ਜਾਣੀ-ਪਛਾਣੀ ਲੈਅ ਵਿੱਚ ਮੁੜ ਆਉਣ ਲਈ ਸਮਾਂ ਲੱਗ ਸਕਦਾ ਹੈ।',
    card2Title: 'ਵੱਖਰਾ ਵਹਾਅ',
    card2Text: 'ਵਹਾਅ ਉਸ ਨਾਲੋਂ ਵੱਖਰਾ ਹੋ ਸਕਦਾ ਹੈ ਜੋ ਤੁਸੀਂ ਗਰਭ-ਅਵਸਥਾ ਤੋਂ ਪਹਿਲਾਂ ਦੇਖਿਆ ਸੀ।',
    h2_5: '5. ਤੁਸੀਂ ਕੀ ਦੇਖ ਸਕਦੇ ਹੋ?',
    body5: 'ਸਰਲ ਰਿਕਾਰਡ ਤੁਹਾਨੂੰ ਇਹ ਬਿਹਤਰ ਢੰਗ ਨਾਲ ਦੇਖਣ ਵਿੱਚ ਮਦਦ ਕਰਦਾ ਹੈ ਕਿ ਤੁਹਾਡਾ ਚੱਕਰ ਸਮੇਂ ਦੇ ਨਾਲ ਕਿਵੇਂ ਬਦਲਦਾ ਹੈ।',
    observations: [
      {title: 'ਤਾਰੀਖ਼ਾਂ', text: 'ਆਪਣੀ ਮਾਹਵਾਰੀ ਦਾ ਪਹਿਲਾ ਦਿਨ ਲਿਖੋ।'},
      {title: 'ਲੈਅ', text: 'ਚੱਕਰਾਂ ਵਿਚਕਾਰ ਵਕਫ਼ੇ ਨੂੰ ਹੌਲੀ-ਹੌਲੀ ਦੇਖੋ।'},
      {title: 'ਵਹਾਅ', text: 'ਆਪਣੀ ਆਮ ਹਾਲਤ ਦੇ ਮੁਕਾਬਲੇ ਕਿਸੇ ਵੀ ਬਦਲਾਅ ਨੂੰ ਸਿਰਫ਼ ਦੇਖੋ।'},
    ],
    h2_6: '6. ਸਲਾਹ ਕਦੋਂ ਲੈਣੀ ਚਾਹੀਦੀ ਹੈ?',
    body6: 'ਜੇ ਕੁਝ ਅਸਾਧਾਰਨ, ਲਗਾਤਾਰ ਜਾਂ ਚਿੰਤਾਜਨਕ ਲੱਗੇ, ਤਾਂ ਸਿਹਤ ਮਾਹਿਰ ਦੀ ਸਲਾਹ ਲਓ।',
    warningSigns: [
      'ਖ਼ੂਨ ਵਹਿਣਾ ਜੋ ਤੁਹਾਨੂੰ ਅਸਾਧਾਰਨ ਲੱਗੇ',
      'ਤੇਜ਼ ਜਾਂ ਲਗਾਤਾਰ ਦਰਦ',
      'ਬੁਖ਼ਾਰ ਜਾਂ ਕਾਫ਼ੀ ਬੇਆਰਾਮੀ',
      'ਕੋਈ ਵੀ ਨਵਾਂ ਲੱਛਣ ਜੋ ਤੁਹਾਨੂੰ ਚਿੰਤਤ ਕਰੇ',
    ],
    summaryTitle: 'ਮੁੱਖ ਨੁਕਤੇ',
    summaryPoints: [
      'ਜਣੇਪੇ ਤੋਂ ਬਾਅਦ ਮਾਹਵਾਰੀ ਦੀ ਵਾਪਸੀ ਦਾ ਮਤਲਬ ਹੈ ਬੱਚੇ ਨੂੰ ਜਨਮ ਦੇਣ ਤੋਂ ਬਾਅਦ ਮਾਹਵਾਰੀ ਦਾ ਮੁੜ ਆਉਣਾ।',
      'ਛਾਤੀ ਦਾ ਦੁੱਧ ਪਿਲਾਉਣ ਨਾਲ ਮਾਹਵਾਰੀ ਦੀ ਵਾਪਸੀ ਵਿੱਚ ਦੇਰੀ ਹੋ ਸਕਦੀ ਹੈ।',
      'ਪਹਿਲੇ ਚੱਕਰ ਅਨਿਯਮਿਤ ਹੋ ਸਕਦੇ ਹਨ।',
      'ਤਾਰੀਖ਼ਾਂ ਲਿਖਣ ਨਾਲ ਤੁਸੀਂ ਆਪਣੇ ਚੱਕਰ ਦੇ ਬਦਲਾਅ ਨੂੰ ਦੇਖ ਸਕਦੇ ਹੋ।',
    ],
    disclaimerText: 'ਜਾਣਕਾਰੀ ਲਈ ਸਮੱਗਰੀ। ਸਮਾਂ-ਸੀਮਾਵਾਂ ਹਰ ਸਥਿਤੀ ਮੁਤਾਬਕ ਵੱਖਰੀਆਂ ਹੋ ਸਕਦੀਆਂ ਹਨ ਅਤੇ ਡਾਕਟਰੀ ਸਲਾਹ ਦੀ ਥਾਂ ਨਹੀਂ ਲੈਂਦੀਆਂ।',
  },
  my: {
    badge: 'ဖရီးမီယံ • မီးဖွားပြီးနောက်',
    title: 'မွေးဖွားပြီးနောက် ရာသီပြန်လာခြင်း\nဘာတွေမျှော်လင့်နိုင်မလဲ',
    metaDuration: 'ဖတ်ချိန် 5 မိနစ်',
    metaType: 'လမ်းညွှန်',
    intro: 'ကလေးမွေးဖွားပြီးနောက် ရာသီပြန်လာရန် အချိန်အတန်ကြာနိုင်သည်။ အချိန်ကာလသည် အခြားအချက်များအပြင် နို့တိုက်ခြင်းအပေါ်မူတည်၍ ကွာခြားပြီး လူတစ်ဦးချင်းစီသည် ဤကာလကို မတူညီစွာ ကြုံတွေ့နိုင်သည်။',
    shareMessage: 'မွေးဖွားပြီးနောက် ရာသီပြန်လာခြင်း၊ ဘာတွေမျှော်လင့်နိုင်မလဲ — AWA',
    h2_1: '1. မွေးဖွားပြီးနောက် ရာသီပြန်လာခြင်း ဆိုတာ ဘာလဲ။',
    body1: '“ရာသီပြန်လာခြင်း” ဆိုသည်မှာ ကလေးမွေးဖွားပြီးနောက် သင့်ရာသီ ပြန်လာခြင်းကို ဆိုလိုသည်။ ရာသီစက်ဝန်းသည် ပုံမှန်လည်ပတ်မှုသို့ ချက်ချင်း ပြန်ရောက်ရန် မလိုအပ်ပါ။',
    highlightTitle: 'အဓိကအချက်',
    highlightText: 'လူတိုင်းအတွက် သက်ဆိုင်သည့် အချိန်ဇယားတစ်ခုတည်း မရှိပါ။',
    h2_2: '2. ရာသီသည် ဘယ်အချိန် ပြန်လာနိုင်သလဲ။',
    body2: 'အချိန်ကာလသည် နို့တိုက်ခြင်းအပေါ် အများအားဖြင့် မူတည်သည်။ နို့မတိုက်လျှင် ရာသီသည် ယေဘုယျအားဖြင့် 6 ပတ်မှ 8 ပတ်ခန့်တွင် ပြန်လာနိုင်သည်။ နို့ချည်းသက်သက် တိုက်လျှင် လအနည်းငယ်ကြာ နှောင့်နှေးနိုင်သည်။',
    simpleInfoTitle1: 'နို့မတိုက်လျှင်',
    simpleInfoText1: 'ယေဘုယျအားဖြင့် 6 ပတ်မှ 8 ပတ်ခန့်။',
    simpleInfoTitle2: 'နို့ချည်းသက်သက် တိုက်လျှင်',
    simpleInfoText2: 'ပြန်လာချိန်သည် လအနည်းငယ်ကြာ နှောင့်နှေးနိုင်သည်။',
    h2_3: '3. ရာသီစက်ဝန်း ပြန်လာသည့် ပုံစံ',
    body3: 'ကလေးမွေးဖွားပြီးနောက် ရာသီစက်ဝန်းသည် တဖြည်းဖြည်း ပြန်လာသည်။ နို့တိုက်ခြင်းသည် သင့်ရာသီ ပြန်ပေါ်လာချိန်ကို သက်ရောက်နိုင်သည်။',
    schemaTitle: 'ရာသီစက်ဝန်း တဖြည်းဖြည်း ပြန်လာခြင်း',
    schemaSubtitle: 'ယေဘုယျလမ်းညွှန်၊ အဆင့်ဆင့်',
    cycleStages: [
      {title: 'ကလေးမွေးဖွားပြီးနောက်', text: 'ကလေးမွေးဖွားပြီးနောက် ရာသီစက်ဝန်းသည် ယာယီ ရပ်နားသည်။'},
      {title: 'ကလေးမွေးပြီးနောက်ကာလ', text: 'ခန္ဓာကိုယ်သည် တဖြည်းဖြည်း ပြန်လည်ကောင်းမွန်လာပြီး ဟော်မုန်းအဆင့်များ ပြောင်းလဲသည်။'},
      {title: 'နို့တိုက်ခြင်း', text: 'နို့တိုက်ခြင်းသည် သင့်ရာသီ ပြန်လာခြင်းကို နှောင့်နှေးစေနိုင်သော်လည်း ၎င်း၏သက်ရောက်မှုသည် လူတစ်ဦးနှင့်တစ်ဦး ကွာခြားသည်။'},
      {title: 'ရာသီပြန်လာခြင်း', text: 'သင့်ပထမဆုံးရာသီသည် ရက်သတ္တပတ်အနည်းငယ် သို့မဟုတ် လအနည်းငယ်ကြာမှ ပြန်လာနိုင်သည်။'},
      {title: 'ပထမဆုံး ရာသီစက်ဝန်းများ', text: 'ရာသီစက်ဝန်းများသည် ပုံမှန်လည်ပတ်မှုသို့ တဖြည်းဖြည်း ပြန်မရောက်မီ မမှန်ကန်နိုင်ပါ။'},
    ],
    schemaNoteText: 'လူတိုင်းအတွက် တူညီသော အချိန်ဇယား မရှိပါ။ သင့်ရာသီ ပြန်လာသည့်အချိန်သည် အထူးသဖြင့် နို့တိုက်ခြင်းအပေါ်မူတည်၍ လူတစ်ဦးနှင့်တစ်ဦး ကွာခြားနိုင်သည်။',
    h2_4: '4. ပထမဆုံး ရာသီစက်ဝန်းများ',
    body4: 'ရာသီပြန်လာသောအခါ ပထမဆုံး ရာသီစက်ဝန်းများသည် ကိုယ်ဝန်မဆောင်မီက ရာသီစက်ဝန်းများနှင့် ကွာခြားနိုင်သည်။ အထူးသဖြင့် အစပိုင်းတွင် မမှန်ကန်နိုင်ပါ။',
    card1Title: 'ပြောင်းလဲနိုင်သော လည်ပတ်မှု',
    card1Text: 'ရာသီစက်ဝန်းသည် ရင်းနှီးသော လည်ပတ်မှုသို့ ပြန်ရောက်ရန် အချိန်ယူနိုင်သည်။',
    card2Title: 'မတူညီသော သွေးထွက်ပမာဏ',
    card2Text: 'သွေးထွက်ပမာဏသည် ကိုယ်ဝန်မဆောင်မီက သင်သတိပြုမိခဲ့သည်နှင့် ကွာခြားနိုင်သည်။',
    h2_5: '5. သင် ဘာတွေကို လေ့လာနိုင်သလဲ။',
    body5: 'ရိုးရှင်းသော မှတ်တမ်းတင်ခြင်းသည် သင့်ရာသီစက်ဝန်း အချိန်ကြာလာသည်နှင့်အမျှ ဘယ်လိုပြောင်းလဲသည်ကို ပိုကောင်းစွာ လေ့လာရန် ကူညီသည်။',
    observations: [
      {title: 'ရက်စွဲများ', text: 'သင့်ရာသီ၏ ပထမဆုံးနေ့ကို မှတ်ထားပါ။'},
      {title: 'လည်ပတ်မှု', text: 'ရာသီစက်ဝန်းများကြား ကွာဟချက်ကို တဖြည်းဖြည်း လေ့လာပါ။'},
      {title: 'သွေးထွက်ပမာဏ', text: 'သင့်အတွက် ပုံမှန်ဖြစ်သည်နှင့် နှိုင်းယှဉ်ပြီး ပြောင်းလဲမှုများကို ရိုးရိုးလေ့လာပါ။'},
    ],
    h2_6: '6. အကြံဉာဏ်ကို ဘယ်အချိန်တောင်းသင့်သလဲ။',
    body6: 'တစ်စုံတစ်ရာ ထူးဆန်းသယောင်၊ ဆက်လက်ဖြစ်နေသယောင် သို့မဟုတ် စိုးရိမ်စရာဖြစ်သယောင် ရှိလျှင် ကျန်းမာရေးပညာရှင်၏ အကြံဉာဏ်ကို ရယူပါ။',
    warningSigns: [
      'သင့်အတွက် ထူးဆန်းသယောင်ရှိသော သွေးထွက်ခြင်း',
      'သိသာသော သို့မဟုတ် ဆက်လက်ဖြစ်နေသော နာကျင်မှု',
      'ဖျားနာခြင်း သို့မဟုတ် သိသာသော အဆင်မပြေမှု',
      'သင့်ကို စိုးရိမ်စေသော ရောဂါလက္ခဏာသစ်တစ်ခုခု',
    ],
    summaryTitle: 'အဓိကအချက်များ',
    summaryPoints: [
      'မွေးဖွားပြီးနောက် ရာသီပြန်လာခြင်းဆိုသည်မှာ ကလေးမွေးဖွားပြီးနောက် သင့်ရာသီ ပြန်လာခြင်းကို ဆိုလိုသည်။',
      'နို့တိုက်ခြင်းသည် သင့်ရာသီ ပြန်လာခြင်းကို နှောင့်နှေးစေနိုင်သည်။',
      'ပထမဆုံး ရာသီစက်ဝန်းများသည် မမှန်ကန်နိုင်ပါ။',
      'ရက်စွဲများကို မှတ်ထားခြင်းသည် သင့်ရာသီစက်ဝန်း ဘယ်လိုပြောင်းလဲသည်ကို မှတ်တမ်းတင်ရန် ကူညီနိုင်သည်။',
    ],
    disclaimerText: 'အချက်အလက်ပေးရန် အကြောင်းအရာ။ အချိန်ကာလများသည် အခြေအနေတစ်ခုချင်းစီအလိုက် ကွာခြားနိုင်ပြီး ဆေးဘက်ဆိုင်ရာ အကြံပြုချက်ကို အစားထိုးခြင်းမရှိပါ။',
  },
  km: {
    badge: 'ឥតគិតថ្លៃ • ក្រោយសម្រាលកូន',
    title: 'ការត្រឡប់មកវិញនៃរដូវក្រោយសម្រាលកូន\nអ្វីដែលអាចរំពឹងទុក',
    metaDuration: 'អាន 5 នាទី',
    metaType: 'មគ្គុទ្ទេសក៍',
    intro: 'ក្រោយសម្រាលកូន ការត្រឡប់មកវិញនៃរដូវរបស់អ្នកអាចត្រូវការពេលខ្លះ។ ពេលវេលាខុសគ្នា អាស្រ័យលើការបំបៅដោះ ក្នុងចំណោមកត្តាផ្សេងទៀត ហើយមនុស្សម្នាក់ៗអាចមានបទពិសោធន៍ខុសគ្នាក្នុងអំឡុងពេលនេះ។',
    shareMessage: 'ការត្រឡប់មកវិញនៃរដូវក្រោយសម្រាលកូន អ្វីដែលអាចរំពឹងទុក — AWA',
    h2_1: '1. តើការត្រឡប់មកវិញនៃរដូវក្រោយសម្រាលកូនជាអ្វី?',
    body1: '“ការត្រឡប់មកវិញនៃរដូវ” សំដៅលើរដូវរបស់អ្នកត្រឡប់មកវិញក្រោយសម្រាលកូន។ វដ្តរដូវមិនចាំបាច់ត្រឡប់ទៅចង្វាក់ធម្មតាភ្លាមៗទេ។',
    highlightTitle: 'ចំណុចសំខាន់',
    highlightText: 'មិនមានពេលវេលាតែមួយដែលអនុវត្តចំពោះមនុស្សគ្រប់គ្នាទេ។',
    h2_2: '2. តើរដូវរបស់អ្នកអាចត្រឡប់មកវិញនៅពេលណា?',
    body2: 'ពេលវេលាភាគច្រើនអាស្រ័យលើការបំបៅដោះ។ បើគ្មានការបំបៅដោះ រដូវរបស់អ្នកជាទូទៅអាចត្រឡប់មកវិញប្រហែល 6 ដល់ 8 សប្តាហ៍។ ប្រសិនបើបំបៅដោះតែមួយមុខ វាអាចយឺតរហូតដល់ច្រើនខែ។',
    simpleInfoTitle1: 'បើគ្មានការបំបៅដោះ',
    simpleInfoText1: 'ជាទូទៅប្រហែល 6 ដល់ 8 សប្តាហ៍។',
    simpleInfoTitle2: 'បើបំបៅដោះតែមួយមុខ',
    simpleInfoText2: 'ការត្រឡប់មកវិញអាចយឺតរហូតដល់ច្រើនខែ។',
    h2_3: '3. លំនាំនៃការត្រឡប់មកវិញនៃវដ្តរដូវ',
    body3: 'វដ្តរដូវត្រឡប់មកវិញបន្តិចម្តងៗក្រោយសម្រាលកូន។ ការបំបៅដោះអាចជះឥទ្ធិពលដល់ពេលដែលរដូវរបស់អ្នកលេចឡើងម្តងទៀត។',
    schemaTitle: 'ការត្រឡប់មកវិញបន្តិចម្តងៗនៃវដ្តរដូវ',
    schemaSubtitle: 'ការណែនាំទូទៅ ជាជំហានៗ',
    cycleStages: [
      {title: 'ក្រោយសម្រាលកូន', text: 'វដ្តរដូវផ្អាកជាបណ្តោះអាសន្នក្រោយសម្រាលកូន។'},
      {title: 'អំឡុងពេលក្រោយសម្រាលកូន', text: 'រាងកាយជាសះស្បើយបន្តិចម្តងៗ ហើយកម្រិតអរម៉ូនផ្លាស់ប្តូរ។'},
      {title: 'ការបំបៅដោះ', text: 'ការបំបៅដោះអាចពន្យារពេលការត្រឡប់មកវិញនៃរដូវរបស់អ្នក ប៉ុន្តែផលប៉ះពាល់របស់វាខុសគ្នាពីមនុស្សម្នាក់ទៅម្នាក់ទៀត។'},
      {title: 'ការត្រឡប់មកវិញនៃរដូវ', text: 'រដូវដំបូងរបស់អ្នកអាចត្រឡប់មកវិញក្រោយពីរបីសប្តាហ៍ ឬច្រើនខែ។'},
      {title: 'វដ្តដំបូងៗ', text: 'វដ្តអាចមិនទៀងទាត់ មុននឹងត្រឡប់ទៅចង្វាក់ធម្មតារបស់វាបន្តិចម្តងៗ។'},
    ],
    schemaNoteText: 'មិនមានពេលវេលាដូចគ្នាសម្រាប់មនុស្សគ្រប់គ្នាទេ។ ពេលដែលរដូវរបស់អ្នកត្រឡប់មកវិញអាចខុសគ្នាពីមនុស្សម្នាក់ទៅម្នាក់ទៀត ជាពិសេសអាស្រ័យលើការបំបៅដោះ។',
    h2_4: '4. វដ្តដំបូងៗ',
    body4: 'នៅពេលរដូវត្រឡប់មកវិញ វដ្តដំបូងៗអាចខុសពីវដ្តមុនពេលមានផ្ទៃពោះ។ ជាពិសេស វាអាចមិនទៀងទាត់នៅដំបូង។',
    card1Title: 'ចង្វាក់ប្រែប្រួល',
    card1Text: 'វដ្តអាចត្រូវការពេលដើម្បីត្រឡប់ទៅចង្វាក់ដែលធ្លាប់ស្គាល់។',
    card2Title: 'បរិមាណឈាមរដូវខុសគ្នា',
    card2Text: 'បរិមាណឈាមរដូវអាចខុសពីអ្វីដែលអ្នកធ្លាប់សង្កេតឃើញមុនពេលមានផ្ទៃពោះ។',
    h2_5: '5. តើអ្នកអាចសង្កេតអ្វីខ្លះ?',
    body5: 'ការតាមដានដ៏សាមញ្ញជួយឱ្យអ្នកសង្កេតឃើញពីរបៀបដែលវដ្តរបស់អ្នកវិវត្តតាមពេលវេលាបានប្រសើរជាងមុន។',
    observations: [
      {title: 'កាលបរិច្ឆេទ', text: 'កត់ត្រាថ្ងៃដំបូងនៃរដូវរបស់អ្នក។'},
      {title: 'ចង្វាក់', text: 'សង្កេតមើលចន្លោះរវាងវដ្តបន្តិចម្តងៗ។'},
      {title: 'បរិមាណឈាមរដូវ', text: 'គ្រាន់តែសង្កេតមើលការផ្លាស់ប្តូរណាមួយបើធៀបនឹងអ្វីដែលធម្មតាសម្រាប់អ្នក។'},
    ],
    h2_6: '6. ពេលណាគួរសុំដំបូន្មាន?',
    body6: 'ប្រសិនបើមានអ្វីមួយដែលមើលទៅមិនធម្មតា បន្តកើតមាន ឬគួរឱ្យបារម្ភ សូមសុំដំបូន្មានពីអ្នកជំនាញសុខាភិបាល។',
    warningSigns: [
      'ឈាមចេញដែលអ្នកមើលឃើញថាមិនធម្មតា',
      'ការឈឺចាប់ខ្លាំង ឬបន្តកើតមាន',
      'គ្រុនក្តៅ ឬអស់កម្លាំងខ្លាំង',
      'រោគសញ្ញាថ្មីណាមួយដែលធ្វើឱ្យអ្នកព្រួយបារម្ភ',
    ],
    summaryTitle: 'ចំណុចសំខាន់ៗ',
    summaryPoints: [
      'ការត្រឡប់មកវិញនៃរដូវក្រោយសម្រាលកូន សំដៅលើរដូវរបស់អ្នកត្រឡប់មកវិញក្រោយសម្រាលកូន។',
      'ការបំបៅដោះអាចពន្យារពេលការត្រឡប់មកវិញនៃរដូវរបស់អ្នក។',
      'វដ្តដំបូងៗអាចមិនទៀងទាត់។',
      'ការកត់ត្រាកាលបរិច្ឆេទអាចជួយអ្នកតាមដានពីរបៀបដែលវដ្តរបស់អ្នកវិវត្ត។',
    ],
    disclaimerText: 'មាតិកាព័ត៌មាន។ ពេលវេលាអាចខុសគ្នាអាស្រ័យលើស្ថានភាពនីមួយៗ ហើយមិនជំនួសដំបូន្មានវេជ្ជសាស្ត្រទេ។',
  },
  lo: {
    badge: 'ຟຣີມຽມ • ຫຼັງຄອດ',
    title: 'ປະຈຳເດືອນກັບມາຫຼັງຄອດ,\nສິ່ງທີ່ຄວນຄາດຫວັງ',
    metaDuration: 'ອ່ານ 5 ນາທີ',
    metaType: 'ຄູ່ມື',
    intro: 'ຫຼັງການເກີດລູກ ປະຈຳເດືອນອາດໃຊ້ເວລາສອງສາມເດືອນຈຶ່ງກັບມາ. ໄລຍະເວລາແຕກຕ່າງກັນຕາມຫຼາຍປັດໄຈ ລວມທັງການລ້ຽງລູກດ້ວຍນົມແມ່ ແລະ ແຕ່ລະຄົນອາດປະສົບກັບໄລຍະນີ້ແຕກຕ່າງກັນ.',
    shareMessage: 'ປະຈຳເດືອນກັບມາຫຼັງຄອດ, ສິ່ງທີ່ຄວນຄາດຫວັງ — AWA',
    h2_1: '1. ປະຈຳເດືອນກັບມາຫຼັງຄອດແມ່ນຫຍັງ?',
    body1: '“ປະຈຳເດືອນກັບມາ” ໝາຍເຖິງການທີ່ປະຈຳເດືອນກັບມາມີອີກຫຼັງການເກີດລູກ. ຮອບເດືອນບໍ່ຈຳເປັນຕ້ອງກັບມາເປັນຈັງຫວະປົກກະຕິທັນທີ.',
    highlightTitle: 'ຈຸດສຳຄັນ',
    highlightText: 'ບໍ່ມີກຳນົດເວລາດຽວທີ່ໃຊ້ໄດ້ກັບທຸກຄົນ.',
    h2_2: '2. ປະຈຳເດືອນສາມາດກັບມາເມື່ອໃດ?',
    body2: 'ໄລຍະເວລາຂຶ້ນກັບການລ້ຽງລູກດ້ວຍນົມແມ່ເປັນສ່ວນຫຼາຍ. ຖ້າບໍ່ລ້ຽງລູກດ້ວຍນົມແມ່ ປະຈຳເດືອນໂດຍທົ່ວໄປສາມາດກັບມາປະມານ 6 ຫາ 8 ອາທິດ. ຖ້າລ້ຽງລູກດ້ວຍນົມແມ່ຢ່າງດຽວ ອາດຊ້າອອກໄປຫຼາຍເດືອນ.',
    simpleInfoTitle1: 'ບໍ່ລ້ຽງລູກດ້ວຍນົມແມ່',
    simpleInfoText1: 'ໂດຍທົ່ວໄປປະມານ 6 ຫາ 8 ອາທິດ.',
    simpleInfoTitle2: 'ລ້ຽງລູກດ້ວຍນົມແມ່ຢ່າງດຽວ',
    simpleInfoText2: 'ການກັບມາອາດຊ້າອອກໄປຫຼາຍເດືອນ.',
    h2_3: '3. ຮູບແບບການກັບມາຂອງຮອບເດືອນ',
    body3: 'ຮອບເດືອນຄ່ອຍໆກັບມາຫຼັງການເກີດລູກ. ການລ້ຽງລູກດ້ວຍນົມແມ່ສາມາດມີຜົນຕໍ່ເວລາທີ່ປະຈຳເດືອນກັບມາ.',
    schemaTitle: 'ການກັບມາຂອງຮອບເດືອນເທື່ອລະກ້າວ',
    schemaSubtitle: 'ຄູ່ມືທົ່ວໄປ, ເທື່ອລະຂັ້ນຕອນ',
    cycleStages: [
      {title: 'ຫຼັງການເກີດລູກ', text: 'ຮອບເດືອນຢຸດຊົ່ວຄາວຫຼັງການເກີດລູກ.'},
      {title: 'ໄລຍະຫຼັງຄອດ', text: 'ຮ່າງກາຍຄ່ອຍໆຟື້ນຕົວ ແລະ ລະດັບຮໍໂມນປ່ຽນແປງ.'},
      {title: 'ການລ້ຽງລູກດ້ວຍນົມແມ່', text: 'ການລ້ຽງລູກດ້ວຍນົມແມ່ອາດເຮັດໃຫ້ປະຈຳເດືອນກັບມາຊ້າລົງ ແຕ່ຜົນກະທົບແຕກຕ່າງກັນໄປໃນແຕ່ລະຄົນ.'},
      {title: 'ປະຈຳເດືອນກັບມາ', text: 'ປະຈຳເດືອນຄັ້ງທຳອິດອາດກັບມາຫຼັງຈາກສອງສາມອາທິດ ຫຼື ຫຼາຍເດືອນ.'},
      {title: 'ຮອບເດືອນຊຸດທຳອິດ', text: 'ຮອບເດືອນອາດບໍ່ສະໝ່ຳສະເໝີກ່ອນຈະຄ່ອຍໆກັບມາເປັນຈັງຫວະປົກກະຕິ.'},
    ],
    schemaNoteText: 'ບໍ່ມີກຳນົດເວລາທີ່ຄືກັນສຳລັບທຸກຄົນ. ເວລາທີ່ປະຈຳເດືອນກັບມາອາດແຕກຕ່າງກັນໄປໃນແຕ່ລະຄົນ ໂດຍສະເພາະຂຶ້ນກັບການລ້ຽງລູກດ້ວຍນົມແມ່.',
    h2_4: '4. ຮອບເດືອນຊຸດທຳອິດ',
    body4: 'ເມື່ອປະຈຳເດືອນກັບມາ ຮອບເດືອນຊຸດທຳອິດອາດແຕກຕ່າງຈາກກ່ອນຖືພາ. ໂດຍສະເພາະ ໃນເບື້ອງຕົ້ນອາດບໍ່ສະໝ່ຳສະເໝີ.',
    card1Title: 'ຈັງຫວະປ່ຽນແປງ',
    card1Text: 'ຮອບເດືອນອາດໃຊ້ເວລາເພື່ອກັບມາເປັນຈັງຫວະທີ່ຄຸ້ນເຄີຍ.',
    card2Title: 'ປະລິມານເລືອດປະຈຳເດືອນແຕກຕ່າງ',
    card2Text: 'ປະລິມານເລືອດປະຈຳເດືອນອາດແຕກຕ່າງຈາກທີ່ທ່ານເຄີຍສັງເກດກ່ອນຖືພາ.',
    h2_5: '5. ທ່ານສາມາດສັງເກດຫຍັງໄດ້ແດ່?',
    body5: 'ການຕິດຕາມແບບງ່າຍໆຊ່ວຍໃຫ້ທ່ານສັງເກດເຫັນການປ່ຽນແປງຂອງຮອບເດືອນຕາມເວລາໄດ້ດີຂຶ້ນ.',
    observations: [
      {title: 'ວັນທີ', text: 'ບັນທຶກມື້ທຳອິດຂອງປະຈຳເດືອນ.'},
      {title: 'ຈັງຫວະ', text: 'ຄ່ອຍໆສັງເກດໄລຍະຫ່າງລະຫວ່າງຮອບເດືອນ.'},
      {title: 'ປະລິມານເລືອດປະຈຳເດືອນ', text: 'ສັງເກດການປ່ຽນແປງທຽບກັບສິ່ງທີ່ເປັນປົກກະຕິສຳລັບທ່ານ.'},
    ],
    h2_6: '6. ເວລາໃດຄວນຂໍຄຳແນະນຳ?',
    body6: 'ຖ້າມີບາງຢ່າງທີ່ເບິ່ງຜິດປົກກະຕິ, ເປັນຕໍ່ເນື່ອງ ຫຼື ໜ້າກັງວົນ ໃຫ້ຂໍຄຳແນະນຳຈາກຜູ້ຊ່ຽວຊານດ້ານສຸຂະພາບ.',
    warningSigns: [
      'ເລືອດອອກທີ່ທ່ານເຫັນວ່າຜິດປົກກະຕິ',
      'ເຈັບຫຼາຍ ຫຼື ເຈັບຕໍ່ເນື່ອງ',
      'ມີໄຂ້ ຫຼື ຮູ້ສຶກບໍ່ສະບາຍຫຼາຍ',
      'ອາການໃໝ່ໃດໆທີ່ທ່ານກັງວົນ',
    ],
    summaryTitle: 'ຈຸດສຳຄັນ',
    summaryPoints: [
      'ປະຈຳເດືອນກັບມາຫຼັງຄອດ ໝາຍເຖິງການທີ່ປະຈຳເດືອນກັບມາມີອີກຫຼັງການເກີດລູກ.',
      'ການລ້ຽງລູກດ້ວຍນົມແມ່ອາດເຮັດໃຫ້ປະຈຳເດືອນກັບມາຊ້າລົງ.',
      'ຮອບເດືອນຊຸດທຳອິດອາດບໍ່ສະໝ່ຳສະເໝີ.',
      'ການບັນທຶກວັນທີສາມາດຊ່ວຍໃຫ້ທ່ານຕິດຕາມການປ່ຽນແປງຂອງຮອບເດືອນ.',
    ],
    disclaimerText: 'ນີ້ແມ່ນຂໍ້ມູນທົ່ວໄປ ແລະ ບໍ່ແທນຄຳແນະນຳຂອງແພດ. ໄລຍະເວລາອາດແຕກຕ່າງກັນຕາມແຕ່ລະສະຖານະການ.',
  },
} as const);

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
