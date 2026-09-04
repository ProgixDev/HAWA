import React, {useEffect, useRef, useState} from 'react';
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

const ID = 'exercise-renforcer-perinee';

const CREAM = '#FCF9F5';
const INK = '#30283A';
const ROSE = '#B96778';
const BORDER = '#ECE5DF';
const MUTED = '#777078';
const BODY = '#4A444B';
const GREEN = '#789276';

const HERO = require('../../assets/images/library/featured-comfort-hero.png');

const EXERCISES = [
  ['weather-windy', 'Respiration'],
  ['human-handsup', 'Contraction douce'],
  ['arrow-up-bold-circle-outline', 'Contraction longue'],
  ['gesture-tap-button', 'Contractions rapides'],
] as const;

const BENEFITS = [
  {
    icon: 'water-outline',
    title: 'Mieux contrôler la vessie',
    text: 'Le plancher pelvien participe au contrôle de la vessie. Le renforcer progressivement peut aider à réduire certaines fuites urinaires.',
  },
  {
    icon: 'toilet',
    title: 'Soutenir les fonctions intestinales',
    text: 'Ces muscles participent également au contrôle des gaz et des selles et contribuent au soutien des organes pelviens.',
  },
  {
    icon: 'human-female',
    title: 'Soutenir les organes pelviens',
    text: 'Le plancher pelvien forme une véritable base musculaire qui participe au soutien de la vessie, de l’utérus et de l’intestin.',
  },
  {
    icon: 'heart-pulse',
    title: 'Retrouver progressivement ses sensations',
    text: 'Une rééducation adaptée peut aussi contribuer à retrouver une meilleure conscience et un meilleur contrôle de cette zone.',
  },
];

const WARNING_SIGNS = [
  'Des fuites urinaires lorsque tu tousses, éternues, ris ou fais un effort',
  'Une sensation de pesanteur ou de pression dans le bas du bassin',
  'La sensation qu’une masse ou quelque chose descend dans le vagin',
  'Des difficultés à retenir les gaz ou les selles',
  'Une douleur persistante au niveau du périnée',
  'Une douleur pendant ou après les rapports sexuels',
  'Une difficulté à identifier ou à contracter correctement les muscles du périnée',
];

const COMMON_MISTAKES = [
  'Contracter les fesses ou les cuisses au lieu du plancher pelvien',
  'Bloquer sa respiration pendant la contraction',
  'Contracter en permanence sans laisser les muscles se relâcher',
  'Faire les exercices uniquement pendant quelques jours puis arrêter',
  'Arrêter d’uriner volontairement pour vérifier la contraction',
];

const DAILY_TIPS = [
  ['clock-outline', 'Associer les exercices à une habitude quotidienne'],
  ['human-sitting', 'Commencer dans une position confortable'],
  ['weather-windy', 'Respirer normalement pendant les contractions'],
  ['sleep', 'Respecter les temps de relâchement'],
  ['chart-line', 'Augmenter progressivement la difficulté'],
  ['doctor', 'Demander conseil en cas de doute'],
] as const;

const APPOINTMENT_QUESTIONS = [
  'Est-ce que mes symptômes sont compatibles avec une faiblesse du plancher pelvien ?',
  'Est-ce que je réalise correctement les contractions ?',
  'Combien de répétitions dois-je faire chaque jour ?',
  'Puis-je reprendre la course, le sport ou les exercices à impact ?',
  'Ai-je besoin d’une rééducation avec une sage-femme ou un kinésithérapeute ?',
  'Ma cicatrice, ma déchirure ou ma césarienne nécessite-t-elle des précautions particulières ?',
];

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ArticleReader'
>;

export default function PerineumStrengtheningArticleScreen({
  navigation,
}: Props): React.JSX.Element {
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
      message:
        'Renforcer son périnée après l’accouchement — AWA',
    });
  };

  return (
    <View style={styles.screen}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      <ScrollView
        ref={scrollRef}
        onScroll={event =>
          saveScrollPosition(
            ID,
            event.nativeEvent.contentOffset.y,
          )
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
            ]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retour"
              onPress={() => navigation.goBack()}
              style={({pressed}) => [
                styles.circle,
                pressed && styles.pressed,
              ]}>
              <MaterialDesignIcons
                name="chevron-left"
                size={23}
                color={INK}
              />
            </Pressable>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ajouter aux favoris"
                onPress={handleBookmark}
                style={({pressed}) => [
                  styles.circle,
                  pressed && styles.pressed,
                ]}>
                <MaterialDesignIcons
                  name={
                    saved
                      ? 'bookmark'
                      : 'bookmark-outline'
                  }
                  size={20}
                  color={ROSE}
                />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Partager"
                onPress={handleShare}
                style={({pressed}) => [
                  styles.circle,
                  pressed && styles.pressed,
                ]}>
                <MaterialDesignIcons
                  name="share-variant-outline"
                  size={20}
                  color={ROSE}
                />
              </Pressable>
            </View>
          </View>
        </View>

        {/* ARTICLE */}

        <View style={styles.article}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              POST-PARTUM • RÉCUPÉRATION
            </Text>
          </View>

          <Text style={styles.title}>
            Renforcer son périnée{'\n'}après l’accouchement
          </Text>

          <View style={styles.metas}>
            {[
              ['clock-outline', '8 min de lecture'],
              [
                'book-open-page-variant-outline',
                'Guide',
              ],
              ['chart-bar', 'Débutant'],
              ['shield-check-outline', 'Contenu validé'],
            ].map(([icon, text], index) => (
              <React.Fragment key={text}>
                {index > 0 ? (
                  <View style={styles.metaDivider} />
                ) : null}

                <View style={styles.metaItem}>
                  <MaterialDesignIcons
                    name={icon as never}
                    color={MUTED}
                    size={17}
                  />

                  <Text style={styles.meta}>
                    {text}
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          <Text style={styles.intro}>
            Après la grossesse et l’accouchement, le plancher
            pelvien a besoin de temps pour récupérer. Des
            exercices simples, réguliers et progressifs peuvent
            aider à retrouver force, contrôle et confiance,
            sans chercher à aller trop vite.
          </Text>

          {/* TABLE OF CONTENTS */}

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>
              Dans cet article
            </Text>

            {[
              'Comprendre le rôle du périnée',
              'Pourquoi l’accouchement le sollicite',
              'Quand commencer la rééducation',
              'Apprendre à contracter correctement',
              'Construire une routine progressive',
              'Les erreurs à éviter',
              'Quand demander de l’aide',
              'Reprendre le sport progressivement',
              'Préparer une consultation',
              'À retenir',
            ].map((item, index) => (
              <View
                key={item}
                style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <Text style={styles.contentNumber}>
                    {index + 1}.
                  </Text>

                  <Text style={styles.contentText}>
                    {item}
                  </Text>
                </View>

                <MaterialDesignIcons
                  name="chevron-right"
                  size={17}
                  color={ROSE}
                />
              </View>
            ))}
          </View>

          {/* SECTION 1 */}

          <Text style={styles.h2}>
            1. Comprendre le rôle du périnée
          </Text>

          <Text style={styles.body}>
            Le périnée, aussi appelé plancher pelvien, est un
            ensemble de muscles situé à la base du bassin. Il
            participe notamment au contrôle de la vessie et de
            l’intestin et contribue au soutien des organes
            pelviens.
          </Text>

          <Text style={styles.body}>
            Pendant la grossesse, ces muscles doivent supporter
            une charge supplémentaire pendant plusieurs mois.
            Ils sont également fortement sollicités au moment
            de l’accouchement.
          </Text>

          <View style={styles.highlight}>
            <MaterialDesignIcons
              name="human-female"
              size={24}
              color={ROSE}
            />

            <View style={styles.highlightCopy}>
              <Text style={styles.highlightTitle}>
                Un muscle discret mais essentiel
              </Text>

              <Text style={styles.highlightText}>
                Le plancher pelvien intervient dans plusieurs
                fonctions quotidiennes : retenir les urines et
                les selles, contrôler les gaz, soutenir les
                organes pelviens et participer à certaines
                fonctions sexuelles.
              </Text>
            </View>
          </View>


          {/* BENEFITS */}
          <Text style={styles.h2}>
            Les bénéfices d’un plancher pelvien renforcé
          </Text>

          <Text style={styles.body}>
            Un renforcement progressif et correctement réalisé peut contribuer
            à améliorer le contrôle et le soutien du plancher pelvien.
          </Text>

          <View style={styles.benefitsGrid}>
            {BENEFITS.map(item => (
              <View key={item.title} style={styles.benefitCard}>
                <View style={styles.benefitIcon}>
                  <MaterialDesignIcons
                    name={item.icon as never}
                    size={22}
                    color={ROSE}
                  />
                </View>

                <Text style={styles.benefitTitle}>
                  {item.title}
                </Text>

                <Text style={styles.benefitText}>
                  {item.text}
                </Text>
              </View>
            ))}
          </View>

          {/* SECTION 2 */}

          <Text style={styles.h2}>
            2. Pourquoi la grossesse et l’accouchement le
            sollicitent
          </Text>

          <Text style={styles.body}>
            La grossesse exerce progressivement davantage de
            pression sur le plancher pelvien. L’accouchement
            vaginal peut ensuite étirer fortement les muscles
            et les tissus de cette région.
          </Text>

          <Text style={styles.body}>
            Une césarienne n’épargne pas pour autant totalement
            le plancher pelvien : la grossesse elle-même reste
            une période importante pour ces muscles.
          </Text>

          <Text style={styles.body}>
            Après la naissance, il est donc normal que la
            récupération demande du temps. Certaines femmes ne
            ressentent presque aucun symptôme, tandis que
            d’autres peuvent observer des fuites, une sensation
            de pesanteur ou une diminution du contrôle musculaire.
          </Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="information-outline"
              size={24}
              color={ROSE}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                Chaque récupération est différente
              </Text>

              <Text style={styles.tipText}>
                Le type d’accouchement, une déchirure ou une
                épisiotomie, la présence de douleurs et l’état
                général après la naissance peuvent influencer
                la récupération.
              </Text>
            </View>
          </View>

          {/* SECTION 3 */}

          <Text style={styles.h2}>
            3. Quand commencer la rééducation ?
          </Text>

          <Text style={styles.body}>
            Après un accouchement sans complication, des
            contractions douces du plancher pelvien peuvent
            généralement être reprises progressivement. Il
            reste toutefois important d’adapter les exercices à
            ta situation et de demander conseil si tu as eu une
            complication, une douleur importante ou une
            intervention particulière.
          </Text>

          <Text style={styles.body}>
            Si tu as une sonde urinaire, certaines
            recommandations conseillent d’attendre son retrait
            et le retour d’une miction normale avant de
            commencer les exercices du périnée.
          </Text>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-circle-outline"
              size={24}
              color="#B76568"
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                Ne force pas sur une douleur
              </Text>

              <Text style={styles.tipText}>
                Une douleur importante, une aggravation des
                symptômes, une plaie qui cicatrise mal ou une
                inquiétude particulière justifient un avis
                auprès d’une sage-femme, d’un médecin ou d’un
                professionnel de la rééducation.
              </Text>
            </View>
          </View>

          {/* SECTION 4 */}

          <Text style={styles.h2}>
            4. Apprendre à contracter correctement
          </Text>

          <Text style={styles.body}>
            Pour identifier le mouvement, imagine que tu veux
            retenir simultanément un gaz et une envie d’uriner.
            Le mouvement recherché est une sensation de
            contraction et de remontée vers l’intérieur.
          </Text>

          <Text style={styles.body}>
            L’objectif n’est pas de serrer très fort tout le
            corps. Les fesses, les cuisses et les abdominaux
            doivent rester aussi détendus que possible, tandis
            que la respiration continue normalement.
          </Text>

          <View style={styles.daily}>
            {EXERCISES.map(([icon, label]) => (
              <View
                key={label}
                style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={icon as never}
                  color={ROSE}
                  size={25}
                />

                <Text style={styles.dailyText}>
                  {label}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.highlight}>
            <MaterialDesignIcons
              name="target"
              size={24}
              color={ROSE}
            />

            <View style={styles.highlightCopy}>
              <Text style={styles.highlightTitle}>
                Le relâchement est aussi important
              </Text>

              <Text style={styles.highlightText}>
                Après chaque contraction, laisse complètement
                les muscles se relâcher. Une bonne rééducation
                ne consiste pas à garder le périnée contracté
                toute la journée.
              </Text>
            </View>
          </View>

          {/* SECTION 5 */}

          <Text style={styles.h2}>
            5. Construire une routine progressive
          </Text>

          <Text style={styles.body}>
            Au début, le plus important est d’apprendre à
            identifier les muscles et à effectuer correctement
            le mouvement. La régularité compte davantage que
            l’intensité.
          </Text>

          <Text style={styles.h3}>
            Les contractions longues
          </Text>

          <Text style={styles.body}>
            Contracte doucement le plancher pelvien puis
            maintiens la contraction pendant quelques secondes,
            sans bloquer ta respiration. Relâche ensuite
            complètement avant de recommencer.
          </Text>

          <Text style={styles.h3}>
            Les contractions courtes
          </Text>

          <Text style={styles.body}>
            Une fois le mouvement maîtrisé, de petites
            contractions rapides peuvent être ajoutées. Elles
            permettent de travailler la capacité à contracter
            rapidement les muscles lorsqu’une pression
            abdominale augmente, par exemple avant de tousser ou
            d’éternuer.
          </Text>

          <View style={styles.dailyTips}>
            {DAILY_TIPS.map(([icon, label]) => (
              <View
                key={label}
                style={styles.dailyTipRow}>
                <View style={styles.dailyTipIcon}>
                  <MaterialDesignIcons
                    name={icon as never}
                    size={19}
                    color={ROSE}
                  />
                </View>

                <Text style={styles.dailyTipText}>
                  {label}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="calendar-check-outline"
              size={24}
              color={ROSE}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                La régularité avant tout
              </Text>

              <Text style={styles.tipText}>
                Associer les exercices à une habitude déjà
                présente dans ta journée peut faciliter leur
                régularité : après une tétée, après le brossage
                des dents ou à un autre moment qui te convient.
              </Text>
            </View>
          </View>

          {/* SECTION 6 */}

          <Text style={styles.h2}>
            6. Les erreurs fréquentes à éviter
          </Text>

          <Text style={styles.body}>
            Les exercices du périnée semblent simples, mais il
            est facile de compenser avec d’autres muscles ou de
            faire trop d’efforts.
          </Text>

          <View style={styles.warningList}>
            {COMMON_MISTAKES.map(item => (
              <View
                key={item}
                style={styles.warningRow}>
                <MaterialDesignIcons
                  name="close-circle-outline"
                  size={18}
                  color="#B76568"
                />

                <Text style={styles.warningText}>
                  {item}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={ROSE}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                À ne pas faire
              </Text>

              <Text style={styles.tipText}>
                Il n’est pas recommandé de pratiquer les
                exercices en interrompant volontairement le
                jet d’urine. Cette méthode ne permet pas
                d’entraîner correctement le périnée et peut
                perturber le fonctionnement normal de la vessie.
              </Text>
            </View>
          </View>

          {/* SECTION 7 */}

          <Text style={styles.h2}>
            7. Quels symptômes doivent inciter à consulter ?
          </Text>

          <Text style={styles.body}>
            Les petites fuites ou une sensation inhabituelle
            peuvent parfois apparaître après l’accouchement.
            Elles ne doivent cependant pas être ignorées si
            elles persistent, s’aggravent ou gênent ta vie
            quotidienne.
          </Text>

          <View style={styles.consultList}>
            {WARNING_SIGNS.map((item, index) => (
              <View
                key={item}
                style={styles.consultCard}>
                <View style={styles.consultIcon}>
                  <MaterialDesignIcons
                    name="alert-circle-outline"
                    size={21}
                    color={ROSE}
                  />
                </View>

                <View style={styles.consultCopy}>
                  <Text style={styles.consultTitle}>
                    {index + 1}. Quand demander conseil ?
                  </Text>

                  <Text style={styles.consultText}>
                    {item}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.body}>
            Une sage-femme, un médecin ou un kinésithérapeute
            spécialisé en rééducation pelvi-périnéale peut
            vérifier la fonction musculaire et proposer un
            programme adapté.
          </Text>

          {/* SECTION 8 */}

          <Text style={styles.h2}>
            8. Et après une déchirure, une épisiotomie ou une
            césarienne ?
          </Text>

          <Text style={styles.body}>
            Une déchirure ou une épisiotomie nécessite une
            attention particulière pendant la cicatrisation.
            La reprise des activités doit respecter la douleur,
            l’état de la cicatrice et les recommandations
            données après l’accouchement.
          </Text>

          <Text style={styles.body}>
            Après une césarienne, la récupération concerne
            également la paroi abdominale et la cicatrice.
            Même si l’accouchement n’a pas été vaginal, la
            grossesse a tout de même sollicité le plancher
            pelvien.
          </Text>

          <View style={styles.highlight}>
            <MaterialDesignIcons
              name="doctor"
              size={24}
              color={ROSE}
            />

            <View style={styles.highlightCopy}>
              <Text style={styles.highlightTitle}>
                Une prise en charge personnalisée peut aider
              </Text>

              <Text style={styles.highlightText}>
                En cas de déchirure importante, de douleur, de
                symptômes urinaires ou intestinaux ou de
                difficultés persistantes, un bilan auprès d’un
                professionnel de santé peut être particulièrement
                utile.
              </Text>
            </View>
          </View>

          {/* SECTION 9 */}

          <Text style={styles.h2}>
            9. Reprendre le sport progressivement
          </Text>

          <Text style={styles.body}>
            La reprise du mouvement après l’accouchement doit
            être progressive. La marche et les mouvements doux
            peuvent généralement reprendre selon ton état et
            ton ressenti, tandis que les activités à fort impact
            demandent davantage de prudence.
          </Text>

          <Text style={styles.body}>
            Avant de reprendre la course, les sauts ou les
            entraînements très intenses, il est préférable
            d’évaluer la récupération du plancher pelvien et de
            tenir compte des éventuels symptômes.
          </Text>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="run-fast"
              size={24}
              color="#B76568"
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                Ne pas brûler les étapes
              </Text>

              <Text style={styles.tipText}>
                Des fuites, une sensation de pesanteur ou une
                douleur pendant ou après l’exercice sont des
                signes qu’il faut ralentir et demander conseil
                avant d’augmenter l’intensité.
              </Text>
            </View>
          </View>

          {/* SECTION 10 */}

          <Text style={styles.h2}>
            10. Quand consulter un spécialiste ?
          </Text>

          <Text style={styles.body}>
            Une rééducation pelvi-périnéale avec une sage-femme
            ou un kinésithérapeute peut être utile si tu ne
            sais pas si tu contractes correctement, si tes
            symptômes persistent ou si tu souhaites reprendre
            certaines activités physiques en toute confiance.
          </Text>

          <View style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <MaterialDesignIcons
                name="message-question-outline"
                size={22}
                color={ROSE}
              />

              <Text style={styles.questionTitle}>
                Questions utiles à poser
              </Text>
            </View>

            {APPOINTMENT_QUESTIONS.map(
              (item, index) => (
                <View
                  key={item}
                  style={styles.questionRow}>
                  <View style={styles.questionBullet}>
                    <Text style={styles.questionNumber}>
                      {index + 1}
                    </Text>
                  </View>

                  <Text style={styles.questionText}>
                    {item}
                  </Text>
                </View>
              ),
            )}
          </View>

          <View style={styles.professionalTip}>
            <MaterialDesignIcons
              name="doctor"
              size={25}
              color={ROSE}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                Bon à savoir
              </Text>

              <Text style={styles.tipText}>
                Consulter ne signifie pas forcément que quelque
                chose va mal. Une séance peut simplement servir
                à vérifier la technique, évaluer la récupération
                et apprendre à progresser correctement.
              </Text>
            </View>
          </View>

          {/* SECTION 11 */}

          <Text style={styles.h2}>
            11. Une récupération qui prend du temps
          </Text>

          <Text style={styles.body}>
            Après la naissance, il est normal de ne pas retrouver
            immédiatement les mêmes sensations ou la même force
            musculaire qu’avant la grossesse.
          </Text>

          <Text style={styles.body}>
            L’objectif n’est pas de faire le plus grand nombre
            de contractions possible. Il s’agit plutôt de
            retrouver progressivement une bonne coordination
            entre contraction et relâchement, puis de pouvoir
            utiliser ces muscles naturellement dans les activités
            quotidiennes.
          </Text>

          <View style={styles.highlight}>
            <MaterialDesignIcons
              name="progress-check"
              size={24}
              color={ROSE}
            />

            <View style={styles.highlightCopy}>
              <Text style={styles.highlightTitle}>
                Petit progrès = vrai progrès
              </Text>

              <Text style={styles.highlightText}>
                Une meilleure perception du mouvement, quelques
                secondes de contraction supplémentaires ou une
                diminution des fuites sont déjà des signes
                encourageants.
              </Text>
            </View>
          </View>

          {/* SUMMARY */}

          <Text style={styles.h2}>
            12. À retenir
          </Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <MaterialDesignIcons
                name="check-decagram-outline"
                size={25}
                color={ROSE}
              />

              <Text style={styles.summaryTitle}>
                L’essentiel
              </Text>
            </View>

            {[
              'La grossesse et l’accouchement sollicitent fortement le plancher pelvien.',
              'Une récupération progressive est normale après la naissance.',
              'Les exercices doivent privilégier la qualité du mouvement plutôt que la force.',
              'La respiration et le relâchement sont aussi importants que la contraction.',
              'Les fuites urinaires, la pesanteur ou la douleur persistante méritent un avis professionnel.',
              'Une rééducation avec une sage-femme ou un kinésithérapeute peut aider à retrouver un meilleur contrôle.',
              'La reprise du sport doit être progressive, surtout pour les activités à impact.',
            ].map(item => (
              <View
                key={item}
                style={styles.summaryItem}>
                <MaterialDesignIcons
                  name="check"
                  size={18}
                  color={GREEN}
                />

                <Text style={styles.summaryText}>
                  {item}
                </Text>
              </View>
            ))}
          </View>

          {/* FINAL TIP */}

          <View style={styles.finalTip}>
            <MaterialDesignIcons
              name="heart-outline"
              size={25}
              color={ROSE}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                Prends le temps de récupérer
              </Text>

              <Text style={styles.tipText}>
                Après l’accouchement, ton corps a traversé
                beaucoup de changements. Le périnée mérite la
                même attention que les autres parties du corps :
                progressivement, régulièrement et sans pression.
              </Text>
            </View>
          </View>

          {/* DISCLAIMER */}

          <View style={styles.disclaimer}>
            <MaterialDesignIcons
              name="shield-outline"
              size={19}
              color="#8A8190"
            />

            <Text style={styles.disclaimerText}>
              Cet article a une vocation informative et ne
              remplace pas un avis médical personnalisé. En cas
              de douleur, de symptômes persistants ou de doute
              concernant ta récupération, demande conseil à un
              professionnel de santé.
            </Text>
          </View>
        </View>
      </ScrollView>

      <ReadingControls
        articleId={ID}
        durationMinutes={8}
        scrollRef={scrollRef}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: CREAM,
  },

  scroll: {
    paddingBottom: 30,
  },

  heroWrap: {
    height: 245,
    backgroundColor: '#EFE3D5',
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
    backgroundColor: 'rgba(255,255,255,0.90)',
    borderWidth: 1,
    borderColor: BORDER,
  },

  pressed: {
    opacity: 0.74,
  },

  article: {
    marginTop: -15,
    padding: 20,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: CREAM,
  },

  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#F3DFE5',
  },

  badgeText: {
    fontSize: 10,
    color: ROSE,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  title: {
    marginTop: 12,
    fontFamily: 'serif',
    fontSize: 27,
    lineHeight: 32,
    color: INK,
    fontWeight: '700',
  },

  metas: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  metaDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#DDD5DA',
  },

  meta: {
    fontSize: 9.5,
    color: MUTED,
  },

  intro: {
    marginTop: 17,
    fontSize: 14,
    lineHeight: 21,
    color: BODY,
    fontWeight: '600',
  },

  contents: {
    marginTop: 20,
    padding: 15,
    borderRadius: 13,
    backgroundColor: '#F8F2F4',
  },

  contentsTitle: {
    marginBottom: 7,
    fontSize: 15,
    color: INK,
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
    color: ROSE,
    fontSize: 11.5,
    fontWeight: '800',
  },

  contentText: {
    flex: 1,
    fontSize: 12.3,
    lineHeight: 17,
    color: INK,
  },

  h2: {
    marginTop: 27,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: INK,
    fontWeight: '700',
  },

  h3: {
    marginTop: 21,
    fontSize: 16,
    lineHeight: 22,
    color: INK,
    fontWeight: '800',
  },

  body: {
    marginTop: 9,
    fontSize: 14,
    lineHeight: 21.5,
    color: BODY,
  },

  highlight: {
    marginTop: 16,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 13,
    backgroundColor: '#F8EEF1',
    borderWidth: 1,
    borderColor: '#F0DDE3',
  },

  highlightCopy: {
    flex: 1,
    marginLeft: 11,
  },

  highlightTitle: {
    fontSize: 13,
    color: INK,
    fontWeight: '800',
  },

  highlightText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: '#585057',
  },

  tip: {
    marginTop: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: '#F5EBEF',
    borderWidth: 1,
    borderColor: '#EEDDE3',
  },

  tipCopy: {
    flex: 1,
    marginLeft: 11,
  },

  tipTitle: {
    fontSize: 13,
    color: INK,
    fontWeight: '800',
  },

  tipText: {
    marginTop: 4,
    fontSize: 11.5,
    lineHeight: 17,
    color: '#585057',
  },


  benefitsGrid: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },

  benefitCard: {
    width: '48.5%',
    padding: 13,
    borderRadius: 13,
    backgroundColor: '#FBF8F5',
    borderWidth: 1,
    borderColor: '#EEE6E0',
  },

  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5E8EC',
  },

  benefitTitle: {
    marginTop: 9,
    fontSize: 12.5,
    lineHeight: 17,
    color: INK,
    fontWeight: '800',
  },

  benefitText: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 16.5,
    color: '#585057',
  },

  daily: {
    marginTop: 13,
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
    backgroundColor: '#FBF5F6',
    borderWidth: 1,
    borderColor: '#F0E4E8',
  },

  dailyText: {
    marginTop: 7,
    fontSize: 11,
    lineHeight: 16,
    color: INK,
    textAlign: 'center',
  },

  dailyTips: {
    marginTop: 14,
    padding: 14,
    borderRadius: 13,
    backgroundColor: '#FBF8F5',
    borderWidth: 1,
    borderColor: '#EEE6E0',
  },

  dailyTipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  dailyTipIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5E8EC',
  },

  dailyTipText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 12,
    lineHeight: 17,
    color: BODY,
  },

  warningList: {
    marginTop: 13,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FCF5F3',
    borderWidth: 1,
    borderColor: '#F1DFDB',
  },

  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 11,
  },

  warningText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: BODY,
  },

  alert: {
    marginTop: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: '#F8E8E8',
    borderWidth: 1,
    borderColor: '#F1DADA',
  },

  consultList: {
    marginTop: 14,
    gap: 10,
  },

  consultCard: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 13,
    backgroundColor: '#FBF8F5',
    borderWidth: 1,
    borderColor: '#EEE6E0',
  },

  consultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5E8EC',
  },

  consultCopy: {
    flex: 1,
    marginLeft: 11,
  },

  consultTitle: {
    fontSize: 13,
    lineHeight: 18,
    color: INK,
    fontWeight: '800',
  },

  consultText: {
    marginTop: 4,
    fontSize: 11.5,
    lineHeight: 17,
    color: '#585057',
  },

  questionCard: {
    marginTop: 15,
    padding: 15,
    borderRadius: 14,
    backgroundColor: '#FBF8F5',
    borderWidth: 1,
    borderColor: '#EDE4DE',
  },

  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 13,
  },

  questionTitle: {
    flex: 1,
    fontSize: 14,
    color: INK,
    fontWeight: '800',
  },

  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 11,
  },

  questionBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3DFE5',
  },

  questionNumber: {
    fontSize: 10,
    color: ROSE,
    fontWeight: '800',
  },

  questionText: {
    flex: 1,
    marginLeft: 9,
    paddingTop: 2,
    fontSize: 12,
    lineHeight: 17,
    color: BODY,
  },

  professionalTip: {
    marginTop: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: '#F7F0EC',
    borderWidth: 1,
    borderColor: '#EEE2DA',
  },

  summaryCard: {
    marginTop: 15,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#F8F2F4',
    borderWidth: 1,
    borderColor: '#EBDDE2',
  },

  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 13,
  },

  summaryTitle: {
    fontSize: 14,
    color: INK,
    fontWeight: '800',
  },

  summaryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },

  summaryText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: BODY,
  },

  finalTip: {
    marginTop: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 13,
    backgroundColor: '#F5EBEF',
  },

  disclaimer: {
    marginTop: 20,
    paddingHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },

  disclaimerText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 16,
    color: '#8A8190',
  },
});