import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  Image,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import ReadingControls from '../../components/articles/ReadingControls';
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

const ID = 'pcos-peau-pilosite-symptomes';

const HERO = require('../../assets/images/library/cycle-phases-hero.png');

// Icons stay language-neutral — only TEXT moves into the bilingual CONTENT
// object below, keyed by index to stay aligned with these icons.
const CARE_HABIT_ICONS = [
  'face-woman-outline',
  'weather-sunny',
  'bowl-mix-outline',
  'account-heart-outline',
] as const;

const MINI_CARD_ICONS = [
  'face-woman-outline',
  'content-cut',
  'hair-dryer-outline',
  'account-heart-outline',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'SOPK',
    title: 'Peau, pilosité et\nsymptômes visibles',
    metaDuration: '9 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro: 'Le SOPK peut se manifester par des changements visibles de la peau, de la pilosité ou des cheveux. Comprendre leur origine permet de mieux les identifier et de savoir quelles solutions peuvent être envisagées.',
    infoBannerText: 'Ces manifestations sont fréquentes, mais elles ne sont ni obligatoires ni suffisantes à elles seules pour diagnostiquer un SOPK.',
    contentsTitle: 'Dans cet article',
    contents: [
      'Pourquoi ces symptômes apparaissent',
      'L’acné hormonale',
      'La pilosité excessive',
      'Le dégarnissement capillaire',
      'Prendre soin de sa peau',
      'Prendre soin de ses cheveux',
      'Ce qui peut aider au quotidien',
      'Quand consulter',
      'Idées reçues',
      'À retenir',
    ],
    section1Body1: 'Le SOPK peut s’accompagner d’une production ou d’une activité accrue des androgènes, des hormones également présentes naturellement chez la femme. Lorsque leur effet est plus marqué, elles peuvent influencer les glandes sébacées, les follicules pileux et le cycle de croissance des cheveux.',
    section1Body2: 'C’est notamment cette influence hormonale qui peut expliquer l’apparition d’une acné persistante, d’une pilosité plus importante ou, chez certaines femmes, d’un amincissement des cheveux.',
    tip1Title: 'Bon à savoir',
    tip1Text: 'Les symptômes visibles ne reflètent pas forcément la gravité du SOPK. Une femme peut avoir plusieurs manifestations visibles, tandis qu’une autre peut présenter peu ou pas de symptômes cutanés.',
    section2Body1: 'L’acné associée aux variations hormonales peut apparaître ou persister après l’adolescence. Elle peut notamment concerner le menton, la mâchoire, le bas des joues ou parfois le cou.',
    section2Body2: 'Chez certaines personnes, les lésions sont profondes, sensibles et récurrentes. Elles peuvent également laisser des marques pigmentées ou des cicatrices lorsqu’elles sont manipulées ou lorsqu’elles sont particulièrement inflammatoires.',
    skinSignsTitle: 'Signes cutanés possibles',
    skinSigns: [
      'Une acné persistante, notamment sur le bas du visage',
      'Une peau plus grasse qu’auparavant',
      'Des poussées d’acné qui suivent parfois les variations hormonales',
      'Des marques ou cicatrices laissées après les poussées',
    ],
    section3Body1: 'L’hirsutisme correspond à une pilosité terminale plus importante dans certaines zones habituellement moins concernées chez la femme. Dans le contexte du SOPK, il peut être lié à l’action des androgènes sur les follicules pileux.',
    section3Body2: 'Les zones fréquemment concernées sont le menton, la lèvre supérieure, la poitrine, le ventre ou le dos. L’importance de la pilosité varie considérablement d’une personne à l’autre.',
    hairSignsTitle: 'Manifestations possibles',
    hairSigns: [
      'Une pilosité plus visible sur le visage',
      'Des poils plus épais au niveau du menton ou de la lèvre supérieure',
      'Une pilosité pouvant apparaître sur la poitrine, le ventre ou le dos',
      'Un amincissement progressif des cheveux au niveau du sommet du crâne',
    ],
    tip2Title: 'Bon à savoir',
    tip2Text: 'La pilosité dépend aussi de facteurs génétiques et individuels. Une pilosité importante ne signifie donc pas automatiquement qu’un SOPK est présent.',
    section4Body1: 'Certaines femmes présentant un SOPK remarquent également une diminution de la densité des cheveux. L’amincissement peut être particulièrement visible au niveau du sommet du crâne ou de la ligne centrale.',
    section4Body2: 'Cette manifestation peut être progressive. Il est important de distinguer une chute de cheveux liée aux hormones d’autres causes possibles, comme une carence, un problème thyroïdien, certains médicaments ou une période de stress important.',
    alert1Title: 'À noter',
    alert1Text: 'Une chute de cheveux importante, rapide ou inhabituelle mérite une évaluation médicale afin d’en rechercher la cause.',
    section5Body: 'Une routine simple et régulière est généralement préférable à l’accumulation de nombreux produits. L’objectif est de nettoyer, hydrater et protéger la peau tout en limitant les agressions qui peuvent entretenir l’irritation.',
    careHabits: [
      'Une routine de peau douce et régulière',
      'Une protection solaire quotidienne',
      'Une alimentation équilibrée',
      'De la patience : les résultats prennent du temps',
    ],
    section6Body1: 'Lorsque les cheveux deviennent plus fins, il peut être utile de limiter les agressions répétées : chaleur excessive, coiffures très serrées ou traitements chimiques fréquents.',
    section6Body2: 'Une consultation dermatologique peut être intéressante si la perte de densité progresse, afin de déterminer la cause et de discuter des traitements disponibles.',
    practicalTitle: 'Conseils pratiques',
    practicalTips: [
      'Choisir des produits non agressifs et éviter de multiplier les soins irritants',
      'Nettoyer la peau sans la décaper, matin et soir si nécessaire',
      'Utiliser une protection solaire lorsque la peau est exposée',
      'Éviter de percer les boutons afin de limiter les marques et cicatrices',
      'Demander conseil à un professionnel si les symptômes persistent ou s’aggravent',
    ],
    section7Body: 'La prise en charge dépend des symptômes, de leur intensité, de leur impact sur la qualité de vie et des objectifs de chaque femme. Il peut être utile d’agir sur plusieurs aspects plutôt que de chercher une seule solution.',
    miniCards: [
      {title: 'Peau', text: 'Routine adaptée et avis dermatologique si nécessaire.'},
      {title: 'Pilosité', text: 'Solutions esthétiques ou médicales selon la situation.'},
      {title: 'Cheveux', text: 'Identifier la cause avant de choisir un traitement.'},
      {title: 'Bien-être', text: 'Prendre en compte l’impact émotionnel des symptômes.'},
    ],
    section8Body1: 'Il est conseillé d’en parler à un professionnel de santé lorsque l’acné devient persistante ou douloureuse, lorsque la pilosité augmente rapidement, lorsque les cheveux s’affinent de façon importante ou lorsque ces changements s’accompagnent de cycles très irréguliers.',
    section8Body2: 'Un dermatologue peut prendre en charge les manifestations de la peau et des cheveux. Un gynécologue ou un autre professionnel compétent peut également évaluer le contexte hormonal et les autres manifestations éventuelles du SOPK.',
    alert2Title: 'Consulte si nécessaire',
    alert2Text: 'Une apparition rapide et importante de pilosité, une chute de cheveux brutale ou des changements hormonaux inhabituels nécessitent un avis médical.',
    ideasReceived: [
      'Avoir de l’acné ne signifie pas automatiquement avoir un SOPK',
      'Une pilosité visible n’est pas forcément liée uniquement aux hormones',
      'Le SOPK peut concerner des femmes de toutes corpulences',
      'Les symptômes peuvent évoluer avec le temps et ne sont pas identiques chez toutes les femmes',
    ],
    quoteText: 'Les symptômes visibles du SOPK peuvent être gênants, mais ils ne définissent pas ta féminité, ta valeur ou ton hygiène.',
    summaryTitle: 'L’essentiel',
    summaryItems: [
      'Le SOPK peut influencer la peau, la pilosité et les cheveux.',
      'Les manifestations sont très variables d’une femme à l’autre.',
      'Un symptôme isolé ne suffit pas à diagnostiquer un SOPK.',
      'Des solutions existent pour améliorer les symptômes.',
      'Un accompagnement médical peut aider à choisir une prise en charge adaptée.',
    ],
    finalTipTitle: 'À retenir',
    finalTipText: 'L’acné, la pilosité ou la chute de cheveux peuvent être des manifestations du SOPK, mais elles ne sont pas une fatalité. Une prise en charge personnalisée peut permettre de mieux contrôler les symptômes et d’améliorer le confort au quotidien.',
    disclaimerText: 'Cet article est informatif et ne remplace pas une consultation médicale, un diagnostic ou un traitement personnalisé.',
    shareMessage: 'Peau, pilosité et symptômes visibles du SOPK — AWA',
  },
  en: {
    badge: 'PCOS',
    title: 'Skin, hair, and\nvisible symptoms',
    metaDuration: '9 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro: 'PCOS can cause visible changes in the skin, body hair, or scalp hair. Understanding where they come from makes it easier to recognize them and to know what solutions may be considered.',
    infoBannerText: 'These signs are common, but on their own they are neither required nor enough to diagnose PCOS.',
    contentsTitle: 'In this article',
    contents: [
      'Why these symptoms appear',
      'Hormonal acne',
      'Excess hair growth',
      'Hair thinning',
      'Taking care of your skin',
      'Taking care of your hair',
      'What can help day to day',
      'When to see a doctor',
      'Common misconceptions',
      'Key takeaways',
    ],
    section1Body1: 'PCOS can involve increased production or activity of androgens, hormones that are also naturally present in women. When their effect is more pronounced, they can influence the sebaceous glands, the hair follicles, and the hair growth cycle.',
    section1Body2: 'This hormonal influence is largely what can explain the appearance of persistent acne, increased hair growth, or, in some women, hair thinning.',
    tip1Title: 'Good to know',
    tip1Text: 'Visible symptoms don’t necessarily reflect how severe PCOS is. One woman may have several visible symptoms, while another may have few or none at all.',
    section2Body1: 'Acne linked to hormonal changes can appear or persist beyond adolescence. It tends to affect the chin, jawline, lower cheeks, or sometimes the neck.',
    section2Body2: 'In some people, the lesions are deep, tender, and recurring. They can also leave pigmented marks or scars when they’re picked at or when they’re especially inflamed.',
    skinSignsTitle: 'Possible skin signs',
    skinSigns: [
      'Persistent acne, especially on the lower face',
      'Skin that is oilier than before',
      'Acne flare-ups that sometimes follow hormonal changes',
      'Marks or scars left after flare-ups',
    ],
    section3Body1: 'Hirsutism refers to increased terminal hair growth in areas not usually affected in women. In the context of PCOS, it can be linked to the effect of androgens on the hair follicles.',
    section3Body2: 'The areas most commonly affected are the chin, upper lip, chest, abdomen, or back. How much hair growth occurs varies considerably from person to person.',
    hairSignsTitle: 'Possible signs',
    hairSigns: [
      'More visible hair growth on the face',
      'Coarser hair on the chin or upper lip',
      'Hair growth that can appear on the chest, abdomen, or back',
      'Gradual thinning of hair at the crown of the head',
    ],
    tip2Title: 'Good to know',
    tip2Text: 'Hair growth also depends on genetic and individual factors. Noticeable hair growth doesn’t automatically mean PCOS is present.',
    section4Body1: 'Some women with PCOS also notice a decrease in hair density. The thinning can be especially visible at the crown of the head or along the center part.',
    section4Body2: 'This can develop gradually. It’s important to distinguish hormone-related hair loss from other possible causes, such as a deficiency, a thyroid issue, certain medications, or a period of significant stress.',
    alert1Title: 'Worth noting',
    alert1Text: 'Hair loss that is significant, rapid, or unusual deserves a medical evaluation to look into the cause.',
    section5Body: 'A simple, consistent routine is generally better than layering on many products. The goal is to cleanse, hydrate, and protect the skin while limiting anything that can keep irritation going.',
    careHabits: [
      'A gentle, consistent skincare routine',
      'Daily sun protection',
      'A balanced diet',
      'Patience: results take time',
    ],
    section6Body1: 'When hair becomes finer, it can help to limit repeated stress on it: excessive heat, very tight hairstyles, or frequent chemical treatments.',
    section6Body2: 'A dermatology consultation can be worthwhile if hair density keeps decreasing, to help determine the cause and discuss available treatments.',
    practicalTitle: 'Practical tips',
    practicalTips: [
      'Choose gentle products and avoid layering on multiple irritating treatments',
      'Cleanse the skin without stripping it, morning and evening if needed',
      'Use sun protection when the skin is exposed',
      'Avoid picking at blemishes to limit marks and scarring',
      'Ask a professional for advice if symptoms persist or get worse',
    ],
    section7Body: 'Management depends on the symptoms, how intense they are, their impact on quality of life, and each woman’s goals. It can help to work on several fronts rather than looking for a single solution.',
    miniCards: [
      {title: 'Skin', text: 'A suitable routine and dermatology advice if needed.'},
      {title: 'Hair growth', text: 'Cosmetic or medical solutions depending on the situation.'},
      {title: 'Hair', text: 'Identify the cause before choosing a treatment.'},
      {title: 'Well-being', text: 'Take the emotional impact of symptoms into account.'},
    ],
    section8Body1: 'It’s a good idea to talk to a healthcare professional when acne becomes persistent or painful, when hair growth increases quickly, when hair thins noticeably, or when these changes come with very irregular cycles.',
    section8Body2: 'A dermatologist can manage skin and hair symptoms. A gynecologist or another qualified professional can also assess the hormonal context and any other possible signs of PCOS.',
    alert2Title: 'See a doctor if needed',
    alert2Text: 'Rapid, significant hair growth, sudden hair loss, or unusual hormonal changes call for medical advice.',
    ideasReceived: [
      'Having acne doesn’t automatically mean you have PCOS',
      'Visible hair growth isn’t necessarily linked to hormones alone',
      'PCOS can affect women of any body type',
      'Symptoms can change over time and aren’t the same for every woman',
    ],
    quoteText: 'The visible symptoms of PCOS can be frustrating, but they don’t define your femininity, your worth, or your hygiene.',
    summaryTitle: 'The essentials',
    summaryItems: [
      'PCOS can affect the skin, body hair, and scalp hair.',
      'Symptoms vary widely from woman to woman.',
      'A single symptom isn’t enough to diagnose PCOS.',
      'Solutions exist to help improve symptoms.',
      'Medical support can help you choose the right approach for you.',
    ],
    finalTipTitle: 'Key takeaways',
    finalTipText: 'Acne, excess hair growth, or hair loss can be symptoms of PCOS, but they aren’t inevitable. A personalized approach can help you manage symptoms better and feel more comfortable day to day.',
    disclaimerText: 'This article is for information only and doesn’t replace a medical consultation, diagnosis, or personalized treatment.',
    shareMessage: 'Skin, hair, and visible PCOS symptoms — AWA',
  },
  es: {
    badge: 'SOP',
    title: 'Piel, vello y\nsíntomas visibles',
    metaDuration: '9 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro: 'El SOP puede manifestarse mediante cambios visibles en la piel, el vello o el cabello. Comprender su origen permite identificarlos mejor y saber qué soluciones pueden considerarse.',
    infoBannerText: 'Estas manifestaciones son frecuentes, pero no son obligatorias ni suficientes por sí solas para diagnosticar un SOP.',
    contentsTitle: 'En este artículo',
    contents: [
      'Por qué aparecen estos síntomas',
      'El acné hormonal',
      'El vello excesivo',
      'El adelgazamiento capilar',
      'Cuidar tu piel',
      'Cuidar tu cabello',
      'Lo que puede ayudar en el día a día',
      'Cuándo consultar',
      'Ideas falsas',
      'Para recordar',
    ],
    section1Body1: 'El SOP puede acompañarse de una producción o una actividad aumentada de los andrógenos, hormonas que también están presentes de forma natural en la mujer. Cuando su efecto es más marcado, pueden influir en las glándulas sebáceas, los folículos pilosos y el ciclo de crecimiento del cabello.',
    section1Body2: 'Es precisamente esta influencia hormonal la que puede explicar la aparición de un acné persistente, un vello más abundante o, en algunas mujeres, un adelgazamiento del cabello.',
    tip1Title: 'Dato útil',
    tip1Text: 'Los síntomas visibles no reflejan forzosamente la gravedad del SOP. Una mujer puede tener varias manifestaciones visibles, mientras que otra puede presentar pocos o ningún síntoma cutáneo.',
    section2Body1: 'El acné asociado a las variaciones hormonales puede aparecer o persistir después de la adolescencia. Suele afectar al mentón, la mandíbula, la parte baja de las mejillas o, a veces, el cuello.',
    section2Body2: 'En algunas personas, las lesiones son profundas, sensibles y recurrentes. También pueden dejar marcas pigmentadas o cicatrices cuando se manipulan o cuando son especialmente inflamatorias.',
    skinSignsTitle: 'Posibles signos cutáneos',
    skinSigns: [
      'Un acné persistente, especialmente en la parte baja del rostro',
      'Una piel más grasa que antes',
      'Brotes de acné que a veces siguen las variaciones hormonales',
      'Marcas o cicatrices dejadas tras los brotes',
    ],
    section3Body1: 'El hirsutismo corresponde a un vello terminal más abundante en zonas habitualmente menos afectadas en la mujer. En el contexto del SOP, puede estar relacionado con la acción de los andrógenos sobre los folículos pilosos.',
    section3Body2: 'Las zonas frecuentemente afectadas son el mentón, el labio superior, el pecho, el vientre o la espalda. La cantidad de vello varía considerablemente de una persona a otra.',
    hairSignsTitle: 'Manifestaciones posibles',
    hairSigns: [
      'Un vello más visible en el rostro',
      'Pelos más gruesos en el mentón o el labio superior',
      'Vello que puede aparecer en el pecho, el vientre o la espalda',
      'Un adelgazamiento progresivo del cabello en la coronilla',
    ],
    tip2Title: 'Dato útil',
    tip2Text: 'El vello también depende de factores genéticos e individuales. Un vello abundante no significa, por tanto, automáticamente que haya un SOP.',
    section4Body1: 'Algunas mujeres con SOP también notan una disminución de la densidad del cabello. El adelgazamiento puede ser especialmente visible en la coronilla o en la raya central.',
    section4Body2: 'Esta manifestación puede ser progresiva. Es importante distinguir una caída de cabello relacionada con las hormonas de otras posibles causas, como una carencia, un problema tiroideo, ciertos medicamentos o un periodo de estrés importante.',
    alert1Title: 'A tener en cuenta',
    alert1Text: 'Una caída de cabello importante, rápida o inusual merece una evaluación médica para buscar su causa.',
    section5Body: 'Una rutina sencilla y regular suele ser preferible a la acumulación de numerosos productos. El objetivo es limpiar, hidratar y proteger la piel limitando a la vez las agresiones que pueden mantener la irritación.',
    careHabits: [
      'Una rutina de piel suave y regular',
      'Una protección solar diaria',
      'Una alimentación equilibrada',
      'Paciencia: los resultados llevan tiempo',
    ],
    section6Body1: 'Cuando el cabello se vuelve más fino, puede ser útil limitar las agresiones repetidas: calor excesivo, peinados muy tirantes o tratamientos químicos frecuentes.',
    section6Body2: 'Una consulta dermatológica puede ser interesante si la pérdida de densidad progresa, para determinar la causa y hablar de los tratamientos disponibles.',
    practicalTitle: 'Consejos prácticos',
    practicalTips: [
      'Elegir productos no agresivos y evitar multiplicar los cuidados irritantes',
      'Limpiar la piel sin resecarla, mañana y noche si es necesario',
      'Usar protección solar cuando la piel esté expuesta',
      'Evitar pinchar los granos para limitar marcas y cicatrices',
      'Pedir consejo a un profesional si los síntomas persisten o empeoran',
    ],
    section7Body: 'El manejo depende de los síntomas, de su intensidad, de su impacto en la calidad de vida y de los objetivos de cada mujer. Puede ser útil actuar en varios aspectos en lugar de buscar una única solución.',
    miniCards: [
      {title: 'Piel', text: 'Rutina adaptada y opinión dermatológica si es necesario.'},
      {title: 'Vello', text: 'Soluciones estéticas o médicas según la situación.'},
      {title: 'Cabello', text: 'Identificar la causa antes de elegir un tratamiento.'},
      {title: 'Bienestar', text: 'Tener en cuenta el impacto emocional de los síntomas.'},
    ],
    section8Body1: 'Se recomienda hablar con un profesional de salud cuando el acné se vuelve persistente o doloroso, cuando el vello aumenta rápidamente, cuando el cabello se adelgaza de forma importante o cuando estos cambios se acompañan de ciclos muy irregulares.',
    section8Body2: 'Un dermatólogo puede manejar las manifestaciones de la piel y del cabello. Un ginecólogo u otro profesional competente también puede evaluar el contexto hormonal y las demás posibles manifestaciones del SOP.',
    alert2Title: 'Consulta si es necesario',
    alert2Text: 'Una aparición rápida e importante de vello, una caída de cabello brusca o cambios hormonales inusuales requieren una opinión médica.',
    ideasReceived: [
      'Tener acné no significa automáticamente tener SOP',
      'Un vello visible no está necesariamente relacionado solo con las hormonas',
      'El SOP puede afectar a mujeres de todas las complexiones',
      'Los síntomas pueden evolucionar con el tiempo y no son iguales en todas las mujeres',
    ],
    quoteText: 'Los síntomas visibles del SOP pueden resultar molestos, pero no definen tu feminidad, tu valor ni tu higiene.',
    summaryTitle: 'Lo esencial',
    summaryItems: [
      'El SOP puede influir en la piel, el vello y el cabello.',
      'Las manifestaciones varían mucho de una mujer a otra.',
      'Un síntoma aislado no basta para diagnosticar un SOP.',
      'Existen soluciones para mejorar los síntomas.',
      'Un acompañamiento médico puede ayudar a elegir un manejo adecuado.',
    ],
    finalTipTitle: 'Para recordar',
    finalTipText: 'El acné, el vello o la caída de cabello pueden ser manifestaciones del SOP, pero no son una fatalidad. Un manejo personalizado puede permitir controlar mejor los síntomas y mejorar el confort en el día a día.',
    disclaimerText: 'Este artículo es informativo y no sustituye una consulta médica, un diagnóstico ni un tratamiento personalizado.',
    shareMessage: 'Piel, vello y síntomas visibles del SOP — AWA',
  },
} as const;

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function PcosSkinHairArticleScreen({
  navigation,
}: Props): React.JSX.Element {
  const {t, i18n} = useTranslation();
  const lang = i18n.language === 'fr' ? 'fr' : i18n.language === 'es' ? 'es' : 'en';
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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('library.reader.back')}
              onPress={() => navigation.goBack()}
              style={({pressed}) => [styles.circle, pressed && styles.pressed]}>
              <MaterialDesignIcons
                name="chevron-left"
                size={23}
                color={theme.colors.text}
              />
            </Pressable>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('library.screen.addBookmark')}
                onPress={handleBookmark}
                style={({pressed}) => [
                  styles.circle,
                  pressed && styles.pressed,
                ]}>
                <MaterialDesignIcons
                  name={saved ? 'bookmark' : 'bookmark-outline'}
                  size={20}
                  color={theme.colors.primary}
                />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('libraryArticle.shareA11y')}
                onPress={handleShare}
                style={({pressed}) => [
                  styles.circle,
                  pressed && styles.pressed,
                ]}>
                <MaterialDesignIcons
                  name="share-variant-outline"
                  size={20}
                  color={theme.colors.primary}
                />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.article}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{content.badge}</Text>
          </View>

          <Text style={styles.title}>{content.title}</Text>

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

                  <Text style={styles.meta}>{text}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          <Text style={styles.intro}>{content.intro}</Text>

          <View style={styles.infoBanner}>
            <MaterialDesignIcons
              name="information-outline"
              size={21}
              color={theme.colors.primary}
            />

            <Text style={styles.infoBannerText}>{content.infoBannerText}</Text>
          </View>

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>{content.contentsTitle}</Text>

            {content.contents.map((item, index) => (
              <View key={item} style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <Text style={styles.contentNumber}>{index + 1}.</Text>
                  <Text style={styles.contentText}>{item}</Text>
                </View>

                <MaterialDesignIcons
                  name="chevron-right"
                  size={17}
                  color={theme.colors.primary}
                />
              </View>
            ))}
          </View>

          <Text style={styles.h2}>1. {content.contents[0]}</Text>

          <Text style={styles.body}>{content.section1Body1}</Text>

          <Text style={styles.body}>{content.section1Body2}</Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.tip1Title}</Text>
              <Text style={styles.tipText}>{content.tip1Text}</Text>
            </View>
          </View>

          <Text style={styles.h2}>2. {content.contents[1]}</Text>

          <Text style={styles.body}>{content.section2Body1}</Text>

          <Text style={styles.body}>{content.section2Body2}</Text>

          <View style={styles.sectionCard}>
            <Text style={styles.cardTitle}>{content.skinSignsTitle}</Text>

            {content.skinSigns.map(item => (
              <View key={item} style={styles.cardRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <Text style={styles.cardText}>{item}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.h2}>3. {content.contents[2]}</Text>

          <Text style={styles.body}>{content.section3Body1}</Text>

          <Text style={styles.body}>{content.section3Body2}</Text>

          <View style={styles.sectionCard}>
            <Text style={styles.cardTitle}>{content.hairSignsTitle}</Text>

            {content.hairSigns.map(item => (
              <View key={item} style={styles.cardRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <Text style={styles.cardText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.tip2Title}</Text>
              <Text style={styles.tipText}>{content.tip2Text}</Text>
            </View>
          </View>

          <Text style={styles.h2}>4. {content.contents[3]}</Text>

          <Text style={styles.body}>{content.section4Body1}</Text>

          <Text style={styles.body}>{content.section4Body2}</Text>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.alert1Title}</Text>
              <Text style={styles.tipText}>{content.alert1Text}</Text>
            </View>
          </View>

          <Text style={styles.h2}>5. {content.contents[4]}</Text>

          <Text style={styles.body}>{content.section5Body}</Text>

          <View style={styles.daily}>
            {CARE_HABIT_ICONS.map((icon, index) => (
              <View key={icon} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={icon as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <Text style={styles.dailyText}>{content.careHabits[index]}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.h2}>6. {content.contents[5]}</Text>

          <Text style={styles.body}>{content.section6Body1}</Text>

          <Text style={styles.body}>{content.section6Body2}</Text>

          <View style={styles.practicalBox}>
            <View style={styles.practicalHeader}>
              <MaterialDesignIcons
                name="heart-outline"
                size={22}
                color={theme.colors.primary}
              />

              <Text style={styles.practicalTitle}>{content.practicalTitle}</Text>
            </View>

            {content.practicalTips.map((item, index) => (
              <View key={item} style={styles.practicalRow}>
                <View style={styles.practicalNumber}>
                  <Text style={styles.practicalNumberText}>
                    {index + 1}
                  </Text>
                </View>

                <Text style={styles.practicalText}>{item}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.h2}>7. {content.contents[6]}</Text>

          <Text style={styles.body}>{content.section7Body}</Text>

          <View style={styles.twoColumn}>
            {MINI_CARD_ICONS.map((icon, index) => (
              <View key={icon} style={styles.miniCard}>
                <MaterialDesignIcons
                  name={icon as never}
                  size={25}
                  color={theme.colors.primary}
                />
                <Text style={styles.miniTitle}>
                  {content.miniCards[index].title}
                </Text>
                <Text style={styles.miniText}>
                  {content.miniCards[index].text}
                </Text>
              </View>
            ))}
          </View>

          <Text style={styles.h2}>8. {content.contents[7]}</Text>

          <Text style={styles.body}>{content.section8Body1}</Text>

          <Text style={styles.body}>{content.section8Body2}</Text>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="medical-bag"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.alert2Title}</Text>
              <Text style={styles.tipText}>{content.alert2Text}</Text>
            </View>
          </View>

          <Text style={styles.h2}>9. {content.contents[8]}</Text>

          <View style={styles.mythList}>
            {content.ideasReceived.map(item => (
              <View key={item} style={styles.mythRow}>
                <MaterialDesignIcons
                  name="close-circle-outline"
                  size={19}
                  color={theme.colors.warning}
                />

                <Text style={styles.mythText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.quoteBox}>
            <MaterialDesignIcons
              name="format-quote-open"
              size={28}
              color={theme.colors.primary}
            />

            <Text style={styles.quoteText}>{content.quoteText}</Text>
          </View>

          <Text style={styles.h2}>10. {content.contents[9]}</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <MaterialDesignIcons
                name="check-decagram-outline"
                size={24}
                color={theme.colors.primary}
              />

              <Text style={styles.summaryTitle}>{content.summaryTitle}</Text>
            </View>

            {content.summaryItems.map(item => (
              <View key={item} style={styles.summaryRow}>
                <MaterialDesignIcons
                  name="check"
                  size={18}
                  color={theme.colors.success}
                />
                <Text style={styles.summaryText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.finalTip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={25}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>{content.finalTipTitle}</Text>
              <Text style={styles.tipText}>{content.finalTipText}</Text>
            </View>
          </View>

          <View style={styles.disclaimer}>
            <MaterialDesignIcons
              name="shield-check-outline"
              size={19}
              color={theme.colors.textMuted}
            />

            <Text style={styles.disclaimerText}>{content.disclaimerText}</Text>
          </View>
        </View>
      </ScrollView>

      <ReadingControls
        articleId={ID}
        durationMinutes={9}
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
    paddingBottom: 30,
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

  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(theme.colors.surface, 0.90),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  pressed: {
    opacity: 0.74,
  },

  article: {
    marginTop: -15,
    padding: 20,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: theme.colors.background,
  },

  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: theme.colors.primarySoft,
  },

  badgeText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '800',
  },

  title: {
    marginTop: 12,
    fontFamily: 'serif',
    fontSize: 25,
    lineHeight: 31,
    color: theme.colors.text,
    fontWeight: '700',
  },

  metas: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  metaDivider: {
    width: 1,
    height: 20,
    backgroundColor: theme.colors.border,
  },

  meta: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },

  intro: {
    marginTop: 17,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },

  infoBanner: {
    marginTop: 15,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  infoBannerText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  contents: {
    marginTop: 19,
    padding: 15,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  contentsTitle: {
    marginBottom: 7,
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '800',
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
    width: 25,
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },

  contentText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 17,
    color: theme.colors.text,
  },

  h2: {
    marginTop: 26,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: theme.colors.text,
    fontWeight: '700',
  },

  body: {
    marginTop: 9,
    fontSize: 14,
    lineHeight: 21.5,
    color: theme.colors.textSecondary,
  },

  tip: {
    marginTop: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
  },

  tipCopy: {
    flex: 1,
    marginLeft: 11,
  },

  tipTitle: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  tipText: {
    marginTop: 4,
    fontSize: 11.5,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  sectionCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  cardTitle: {
    marginBottom: 11,
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '800',
  },

  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },

  cardText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  daily: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  dailyItem: {
    width: '48.7%',
    minHeight: 108,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  dailyText: {
    marginTop: 7,
    fontSize: 11,
    lineHeight: 16,
    color: theme.colors.text,
    textAlign: 'center',
  },

  alert: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },

  practicalBox: {
    marginTop: 17,
    padding: 15,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  practicalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 13,
  },

  practicalTitle: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '800',
  },

  practicalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 11,
  },

  practicalNumber: {
    width: 23,
    height: 23,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  practicalNumberText: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '800',
  },

  practicalText: {
    flex: 1,
    marginLeft: 9,
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  twoColumn: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  miniCard: {
    width: '48.7%',
    minHeight: 135,
    padding: 13,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    alignItems: 'center',
  },

  miniTitle: {
    marginTop: 8,
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '800',
  },

  miniText: {
    marginTop: 5,
    fontSize: 10.5,
    lineHeight: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },

  mythList: {
    marginTop: 14,
    padding: 13,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  mythRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 11,
  },

  mythText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  quoteBox: {
    marginTop: 17,
    padding: 17,
    borderRadius: 14,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    alignItems: 'center',
  },

  quoteText: {
    marginTop: 6,
    fontFamily: 'serif',
    fontSize: 16,
    lineHeight: 23,
    color: theme.colors.text,
    textAlign: 'center',
    fontWeight: '600',
  },

  summaryCard: {
    marginTop: 14,
    padding: 15,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 13,
  },

  summaryTitle: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '800',
  },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },

  summaryText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.textSecondary,
  },

  finalTip: {
    marginTop: 17,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 13,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
  },

  disclaimer: {
    marginTop: 20,
    paddingTop: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },

  disclaimerText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 15.5,
    color: theme.colors.textMuted,
  },
  });
}
