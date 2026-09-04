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

const ID = 'pcos-diagnostic-examens';

const CREAM = '#FCF9F5';
const INK = '#30283A';
const ROSE = '#B96778';
const BORDER = '#ECE5DF';

const HERO = require('../../assets/images/library/featured-spm.png');

const APPOINTMENT_QUESTIONS = [
  'Depuis quand tes cycles sont-ils irréguliers ?',
  'As-tu remarqué de l’acné, une pilosité ou une perte de cheveux inhabituelles ?',
  'Y a-t-il des antécédents de SOPK ou de diabète dans ta famille ?',
  'As-tu un désir de grossesse à court ou moyen terme ?',
];

const DIAGNOSIS_STEPS = [
  {
    number: '01',
    icon: 'clipboard-text-outline',
    title: 'Interrogatoire',
    text: 'Le professionnel recueille ton histoire : cycles, symptômes, antécédents et traitements.',
  },
  {
    number: '02',
    icon: 'stethoscope',
    title: 'Examen clinique',
    text: 'Il recherche notamment des signes d’excès d’androgènes et évalue ton état général.',
  },
  {
    number: '03',
    icon: 'flask-outline',
    title: 'Bilan sanguin',
    text: 'Des analyses hormonales et métaboliques peuvent être demandées pour préciser la situation.',
  },
  {
    number: '04',
    icon: 'ultrasound',
    title: 'Échographie',
    text: 'Elle peut compléter le bilan en observant l’aspect des ovaires.',
  },
] as const;

const BLOOD_TESTS = [
  {
    icon: 'test-tube',
    title: 'Androgènes',
    text: 'Testostérone et autres hormones selon le contexte.',
  },
  {
    icon: 'water-outline',
    title: 'Fonction thyroïdienne',
    text: 'Permet notamment d’écarter certaines causes de cycles irréguliers.',
  },
  {
    icon: 'chart-line',
    title: 'Bilan métabolique',
    text: 'Glycémie, parfois bilan lipidique selon les facteurs de risque.',
  },
];

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function PcosDiagnosisArticleScreen({
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
      message: 'Diagnostic du SOPK : examens et bilan — AWA',
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
          <Image source={HERO} resizeMode="cover" style={styles.hero} />

          <View
            style={[
              styles.top,
              {
                paddingTop: getTopPadding(insets.top, true),
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
                  name={saved ? 'bookmark' : 'bookmark-outline'}
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
            <Text style={styles.badgeText}>SOPK</Text>
          </View>

          <Text style={styles.title}>
            Diagnostic du SOPK :{'\n'}examens et bilan
          </Text>

          {/* METADATA */}
          <View style={styles.metas}>
            {[
              ['clock-outline', '7 min de lecture'],
              ['book-open-page-variant-outline', 'Guide'],
              ['chart-bar', 'Intermédiaire'],
              ['shield-check-outline', 'Contenu validé'],
            ].map(([icon, text], index) => (
              <React.Fragment key={text}>
                {index > 0 ? <View style={styles.metaDivider} /> : null}

                <View style={styles.metaItem}>
                  <MaterialDesignIcons
                    name={icon as never}
                    color="#8A8190"
                    size={17}
                  />

                  <Text style={styles.meta}>{text}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          <Text style={styles.intro}>
            Comment le SOPK est diagnostiqué, quels examens peuvent être
            proposés et comment préparer sereinement ta consultation.
          </Text>

          {/* SOMMAIRE */}
          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>Dans cet article</Text>

            {[
              'Comprendre le bilan diagnostique',
              'Les principales étapes du bilan',
              'La prise de sang hormonale',
              'L’échographie pelvienne',
              'Ce que le diagnostic ne dit pas',
              'Préparer sa consultation',
              'À retenir',
            ].map((item, index) => (
              <View key={item} style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <Text style={styles.contentNumber}>{index + 1}.</Text>

                  <Text style={styles.contentText}>{item}</Text>
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
            1. Comprendre le bilan diagnostique
          </Text>

          <Text style={styles.body}>
            Le diagnostic du syndrome des ovaires polykystiques ne repose pas
            sur un seul examen. Le professionnel de santé rassemble plusieurs
            informations : l’histoire des cycles, les symptômes éventuels,
            l’examen clinique, les analyses biologiques et, selon la situation,
            une échographie.
          </Text>

          <Text style={styles.body}>
            L’objectif est à la fois de rechercher les caractéristiques
            compatibles avec un SOPK et d’écarter d’autres causes pouvant
            expliquer des règles irrégulières ou certains symptômes hormonaux.
          </Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={ROSE}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Bon à savoir</Text>

              <Text style={styles.tipText}>
                Le diagnostic est toujours personnalisé. Deux femmes ayant
                un SOPK peuvent avoir des symptômes et des résultats
                d’examens très différents.
              </Text>
            </View>
          </View>

          {/* SECTION 2 */}
          <Text style={styles.h2}>
            2. Les principales étapes du bilan
          </Text>

          <Text style={styles.body}>
            Le bilan peut suivre plusieurs étapes. Elles ne sont pas
            nécessairement toutes réalisées de la même façon chez chaque
            personne.
          </Text>

          {/* DIAGNOSTIC STEPS */}
          <View style={styles.stepsContainer}>
            {DIAGNOSIS_STEPS.map(step => (
              <View key={step.number} style={styles.stepCard}>
                <View style={styles.stepTop}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>
                      {step.number}
                    </Text>
                  </View>

                  <MaterialDesignIcons
                    name={step.icon as never}
                    size={24}
                    color={ROSE}
                  />
                </View>

                <Text style={styles.stepTitle}>{step.title}</Text>

                <Text style={styles.stepText}>{step.text}</Text>
              </View>
            ))}
          </View>

          {/* FLOW */}
          <View style={styles.flowCard}>
            <View style={styles.flowHeader}>
              <MaterialDesignIcons
                name="format-list-numbered"
                size={20}
                color={ROSE}
              />

              <Text style={styles.flowTitle}>
                Le parcours en un coup d’œil
              </Text>
            </View>

            <View style={styles.flowLine}>
              <View style={styles.flowDot} />
              <Text style={styles.flowText}>Histoire et symptômes</Text>
            </View>

            <View style={styles.flowLine}>
              <View style={styles.flowDot} />
              <Text style={styles.flowText}>Examen clinique</Text>
            </View>

            <View style={styles.flowLine}>
              <View style={styles.flowDot} />
              <Text style={styles.flowText}>Analyses selon le contexte</Text>
            </View>

            <View style={styles.flowLine}>
              <View style={styles.flowDot} />
              <Text style={styles.flowText}>Échographie si nécessaire</Text>
            </View>
          </View>

          {/* SECTION 3 */}
          <Text style={styles.h2}>
            3. La prise de sang hormonale
          </Text>

          <Text style={styles.body}>
            Une prise de sang peut être proposée pour rechercher des signes
            d’excès d’androgènes, évaluer certaines hormones impliquées dans
            le fonctionnement reproductif et rechercher d’autres causes
            possibles des symptômes.
          </Text>

          <Text style={styles.body}>
            Les analyses choisies dépendent de ton âge, de tes symptômes,
            de ton histoire médicale et de ce que le professionnel cherche
            à vérifier.
          </Text>

          <View style={styles.testsGrid}>
            {BLOOD_TESTS.map(test => (
              <View key={test.title} style={styles.testCard}>
                <View style={styles.testIcon}>
                  <MaterialDesignIcons
                    name={test.icon as never}
                    size={22}
                    color={ROSE}
                  />
                </View>

                <Text style={styles.testTitle}>{test.title}</Text>

                <Text style={styles.testText}>{test.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color="#B76568"
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Important</Text>

              <Text style={styles.tipText}>
                Les résultats hormonaux doivent être interprétés avec le
                contexte clinique. Une valeur isolée ne permet généralement
                pas, à elle seule, de conclure à un SOPK.
              </Text>
            </View>
          </View>

          {/* SECTION 4 */}
          <Text style={styles.h2}>
            4. L’échographie pelvienne
          </Text>

          <Text style={styles.body}>
            Une échographie peut être utilisée pour observer l’aspect des
            ovaires et rechercher notamment un nombre important de petits
            follicules. Elle permet également au professionnel de rechercher
            d’autres éléments pouvant expliquer certains symptômes.
          </Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={ROSE}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Bon à savoir</Text>

              <Text style={styles.tipText}>
                Voir de nombreux follicules à l’échographie ne signifie pas
                automatiquement que tu as un SOPK. Le résultat doit être
                interprété avec les autres éléments du bilan.
              </Text>
            </View>
          </View>

          {/* SECTION 5 */}
          <Text style={styles.h2}>
            5. Ce que le diagnostic ne dit pas
          </Text>

          <Text style={styles.body}>
            Recevoir un diagnostic de SOPK ne permet pas de prédire exactement
            ton évolution future. Le syndrome peut se manifester de manière
            très différente d’une personne à l’autre.
          </Text>

          <View style={styles.mythList}>
            <View style={styles.mythRow}>
              <MaterialDesignIcons
                name="close-circle-outline"
                size={19}
                color="#B76568"
              />

              <Text style={styles.mythText}>
                Le SOPK ne signifie pas automatiquement infertilité.
              </Text>
            </View>

            <View style={styles.mythRow}>
              <MaterialDesignIcons
                name="close-circle-outline"
                size={19}
                color="#B76568"
              />

              <Text style={styles.mythText}>
                Le SOPK ne signifie pas forcément avoir des kystes.
              </Text>
            </View>

            <View style={styles.mythRow}>
              <MaterialDesignIcons
                name="close-circle-outline"
                size={19}
                color="#B76568"
              />

              <Text style={styles.mythText}>
                Le diagnostic ne détermine pas à lui seul le traitement.
              </Text>
            </View>

            <View style={styles.mythRow}>
              <MaterialDesignIcons
                name="close-circle-outline"
                size={19}
                color="#B76568"
              />

              <Text style={styles.mythText}>
                Une échographie normale n’exclut pas nécessairement le SOPK.
              </Text>
            </View>
          </View>

          {/* SECTION 6 */}
          <Text style={styles.h2}>
            6. Préparer sa consultation
          </Text>

          <Text style={styles.body}>
            Quelques informations préparées à l’avance peuvent aider le
            professionnel à comprendre ton histoire et à choisir les examens
            les plus pertinents.
          </Text>

          <View style={styles.checkList}>
            {APPOINTMENT_QUESTIONS.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color="#789276"
                />

                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.preparationCard}>
            <View style={styles.preparationHeader}>
              <MaterialDesignIcons
                name="notebook-edit-outline"
                size={22}
                color={ROSE}
              />

              <Text style={styles.preparationTitle}>
                Petit conseil avant le rendez-vous
              </Text>
            </View>

            <Text style={styles.preparationText}>
              Si possible, note les dates de tes dernières règles, la durée
              approximative de tes cycles, les symptômes que tu observes et
              les traitements ou compléments que tu prends.
            </Text>
          </View>

          {/* SECTION 7 */}
          <Text style={styles.h2}>7. À retenir</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <MaterialDesignIcons
                name="check-decagram-outline"
                size={24}
                color={ROSE}
              />

              <Text style={styles.summaryTitle}>
                L’essentiel du bilan
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryNumber}>01</Text>

              <Text style={styles.summaryText}>
                Le diagnostic repose sur plusieurs éléments, pas sur un seul
                examen.
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryNumber}>02</Text>

              <Text style={styles.summaryText}>
                Une prise de sang peut rechercher certains déséquilibres
                hormonaux et éliminer d’autres causes.
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryNumber}>03</Text>

              <Text style={styles.summaryText}>
                Une échographie peut compléter le bilan selon la situation.
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryNumber}>04</Text>

              <Text style={styles.summaryText}>
                Les résultats doivent toujours être interprétés par un
                professionnel de santé.
              </Text>
            </View>
          </View>

          <View style={styles.finalTip}>
            <MaterialDesignIcons
              name="heart-outline"
              size={24}
              color={ROSE}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>À retenir</Text>

              <Text style={styles.tipText}>
                Un bilan de SOPK n’est pas un examen unique ni un jugement
                définitif. Il sert à comprendre ton fonctionnement hormonal,
                à rechercher d’autres causes possibles et à construire un
                accompagnement adapté à ta situation.
              </Text>
            </View>
          </View>

          <View style={styles.disclaimer}>
            <MaterialDesignIcons
              name="information-outline"
              size={18}
              color="#8A8190"
            />

            <Text style={styles.disclaimerText}>
              Cet article est informatif et ne remplace pas une consultation
              médicale ni l’interprétation personnalisée de tes examens.
            </Text>
          </View>
        </View>
      </ScrollView>

      <ReadingControls
        articleId={ID}
        durationMinutes={7}
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
    fontSize: 11,
    color: ROSE,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  title: {
    marginTop: 12,
    fontFamily: 'serif',
    fontSize: 25,
    lineHeight: 31,
    color: INK,
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
    backgroundColor: '#DDD5DA',
  },

  meta: {
    fontSize: 10,
    color: '#777078',
  },

  intro: {
    marginTop: 17,
    fontSize: 14,
    lineHeight: 21,
    color: '#49424A',
    fontWeight: '500',
  },

  contents: {
    marginTop: 19,
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
    width: 24,
    color: ROSE,
    fontSize: 12,
    fontWeight: '800',
  },

  contentText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 17,
    color: INK,
  },

  h2: {
    marginTop: 26,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: INK,
    fontWeight: '700',
  },

  body: {
    marginTop: 9,
    fontSize: 14,
    lineHeight: 21,
    color: '#4A444B',
  },

  /* PRINCIPALES ÉTAPES */

  stepsContainer: {
    marginTop: 15,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 9,
  },

  stepCard: {
    width: '48.5%',
    minHeight: 178,
    padding: 13,
    borderRadius: 13,
    backgroundColor: '#FBF7F4',
    borderWidth: 1,
    borderColor: '#EEE5DF',
  },

  stepTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  stepNumber: {
    width: 31,
    height: 31,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3DFE5',
  },

  stepNumberText: {
    fontSize: 10,
    color: ROSE,
    fontWeight: '900',
  },

  stepTitle: {
    marginTop: 13,
    fontSize: 14,
    color: INK,
    fontWeight: '800',
  },

  stepText: {
    marginTop: 6,
    fontSize: 11.5,
    lineHeight: 17,
    color: '#5C555C',
  },

  /* PARCOURS */

  flowCard: {
    marginTop: 14,
    padding: 15,
    borderRadius: 13,
    backgroundColor: '#F8F2F4',
  },

  flowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 11,
  },

  flowTitle: {
    fontSize: 13,
    color: INK,
    fontWeight: '800',
  },

  flowLine: {
    minHeight: 31,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  flowDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: ROSE,
  },

  flowText: {
    fontSize: 12,
    color: '#514A51',
  },

  /* ANALYSES */

  testsGrid: {
    marginTop: 14,
    gap: 8,
  },

  testCard: {
    padding: 13,
    borderRadius: 12,
    backgroundColor: '#FBF8F5',
    borderWidth: 1,
    borderColor: '#EEE7E1',
  },

  testIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5E8EC',
  },

  testTitle: {
    marginTop: 9,
    fontSize: 13,
    color: INK,
    fontWeight: '800',
  },

  testText: {
    marginTop: 4,
    fontSize: 11.5,
    lineHeight: 17,
    color: '#5A535A',
  },

  /* CHECK LIST */

  checkList: {
    marginTop: 13,
    padding: 13,
    borderRadius: 12,
    backgroundColor: '#FBF8F5',
  },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },

  checkText: {
    flex: 1,
    color: '#4A444B',
    fontSize: 12,
    lineHeight: 17,
  },

  /* MYTHES */

  mythList: {
    marginTop: 13,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FBF6F4',
  },

  mythRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginBottom: 10,
  },

  mythText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: '#514A51',
  },

  /* TIP */

  tip: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: '#F5EBEF',
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

  /* ALERT */

  alert: {
    marginTop: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: '#F8E8E8',
  },

  /* PREPARATION */

  preparationCard: {
    marginTop: 14,
    padding: 15,
    borderRadius: 13,
    backgroundColor: '#F8F2F4',
    borderWidth: 1,
    borderColor: '#EEE1E5',
  },

  preparationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  preparationTitle: {
    flex: 1,
    fontSize: 13,
    color: INK,
    fontWeight: '800',
  },

  preparationText: {
    marginTop: 9,
    fontSize: 12,
    lineHeight: 18,
    color: '#575057',
  },

  /* SUMMARY */

  summaryCard: {
    marginTop: 14,
    padding: 15,
    borderRadius: 14,
    backgroundColor: '#F7EEF1',
  },

  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },

  summaryTitle: {
    fontSize: 14,
    color: INK,
    fontWeight: '800',
  },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 11,
  },

  summaryNumber: {
    width: 31,
    fontSize: 10,
    color: ROSE,
    fontWeight: '900',
    paddingTop: 2,
  },

  summaryText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#514A51',
  },

  finalTip: {
    marginTop: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: '#F5EBEF',
  },

  disclaimer: {
    marginTop: 18,
    paddingHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },

  disclaimerText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 16,
    color: '#8A8190',
  },
});