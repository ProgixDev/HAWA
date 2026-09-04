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

const ID = 'missedpills-que-faire-en-cas-doubli';

const CREAM = '#FCF9F5';
const INK = '#30283A';
const ROSE = '#B96778';
const BORDER = '#ECE5DF';
const MUTED = '#777078';
const BODY = '#4A444B';
const GREEN = '#789276';

const HERO = require('../../assets/images/library/regular-cycle-consult.png');

const REFERENCE_TIPS = [
  'Garder la notice accessible (photo dans le téléphone, par exemple)',
  'Contacter une pharmacienne en cas de doute rapide',
  'Consulter si l’oubli se répète souvent',
];

const CHECK_POINTS = [
  {
    icon: 'clock-outline',
    title: 'Réagir rapidement',
    text: 'Plus tu réagis rapidement après avoir constaté l’oubli, plus il est facile de suivre les recommandations adaptées.',
  },
  {
    icon: 'file-document-outline',
    title: 'Vérifier la notice',
    text: 'Les consignes peuvent varier selon le type exact de pilule et le nombre de comprimés oubliés.',
  },
  {
    icon: 'shield-check-outline',
    title: 'Prévoir une protection complémentaire',
    text: 'Dans certaines situations, un préservatif peut être recommandé pendant une période donnée.',
  },
];

const SITUATIONS = [
  {
    icon: 'pill',
    title: 'Un seul comprimé oublié',
    text: 'La conduite à tenir dépend principalement du délai depuis l’heure habituelle de prise.',
  },
  {
    icon: 'calendar-alert',
    title: 'Plusieurs comprimés oubliés',
    text: 'La situation nécessite une attention particulière et il est préférable de vérifier précisément la notice.',
  },
  {
    icon: 'help-circle-outline',
    title: 'Doute sur la conduite à tenir',
    text: 'Une pharmacie ou un professionnel de santé peut t’aider rapidement à identifier la bonne conduite.',
  },
];

const QUESTIONS = [
  'Quel type de pilule est-ce exactement ?',
  'Combien de temps s’est écoulé depuis l’heure habituelle ?',
  'Combien de comprimés ont été oubliés ?',
  'À quel moment de la plaquette l’oubli a-t-il eu lieu ?',
  'Y a-t-il eu un rapport sexuel non protégé récemment ?',
];

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function MissedPillsArticleScreen({
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
      message: 'Oubli de pilule : que faire ? — AWA',
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
          {/* CATEGORY */}

          <View style={styles.badge}>
            <Text style={styles.badgeText}>OUBLI DE PILULE</Text>
          </View>

          {/* TITLE */}

          <Text style={styles.title}>
            Oubli de pilule :{`\n`}que faire ?
          </Text>

          {/* METADATA */}

          <View style={styles.metas}>
            {[
              ['clock-outline', '7 min de lecture'],
              ['book-open-page-variant-outline', 'FAQ'],
              ['chart-bar', 'Intermédiaire'],
              ['shield-check-outline', 'Contenu validé'],
            ].map(([icon, text], index) => (
              <React.Fragment key={text}>
                {index > 0 ? <View style={styles.metaDivider} /> : null}

                <View style={styles.metaItem}>
                  <MaterialDesignIcons
                    name={icon as never}
                    color={MUTED}
                    size={17}
                  />

                  <Text style={styles.meta}>{text}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          {/* INTRO */}

          <Text style={styles.intro}>
            Un oubli de pilule peut arriver à tout le monde. La conduite à
            tenir dépend principalement du délai depuis l’oubli, du type de
            pilule et du moment où celui-ci survient dans la plaquette.
          </Text>

          {/* IMPORTANT */}

          <View style={styles.importantCard}>
            <View style={styles.importantIcon}>
              <MaterialDesignIcons
                name="information-outline"
                size={23}
                color={ROSE}
              />
            </View>

            <View style={styles.importantCopy}>
              <Text style={styles.importantTitle}>Le point essentiel</Text>

              <Text style={styles.importantText}>
                Ne panique pas. Vérifie d’abord le type exact de ta pilule et
                consulte sa notice pour connaître la conduite recommandée.
              </Text>
            </View>
          </View>

          {/* TABLE OF CONTENTS */}

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>Dans cet article</Text>

            {[
              'Moins de 12 heures de retard',
              'Plus de 12 heures de retard',
              'Les situations qui demandent plus d’attention',
              'La notice reste la référence',
              'Quand demander conseil',
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

          <Text style={styles.h2}>1. Moins de 12 heures de retard</Text>

          <Text style={styles.body}>
            Pour certaines pilules, un retard inférieur à 12 heures ne
            compromet généralement pas la protection contraceptive. Dans ce
            cas, la recommandation habituelle est de prendre le comprimé
            oublié dès que possible puis de poursuivre la plaquette à l’heure
            habituelle.
          </Text>

          <View style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>

              <Text style={styles.stepTitle}>Prends le comprimé</Text>
            </View>

            <Text style={styles.stepText}>
              Prends le comprimé dès que tu constates le retard.
            </Text>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>

              <Text style={styles.stepTitle}>Continue normalement</Text>
            </View>

            <Text style={styles.stepText}>
              Reprends ensuite ton rythme habituel pour les comprimés
              suivants.
            </Text>
          </View>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={ROSE}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Bon à savoir</Text>

              <Text style={styles.tipText}>
                Si tu as pris le comprimé oublié puis celui prévu à l’heure
                habituelle, il peut arriver que deux comprimés soient pris le
                même jour.
              </Text>
            </View>
          </View>

          {/* SECTION 2 */}

          <Text style={styles.h2}>2. Plus de 12 heures de retard</Text>

          <Text style={styles.body}>
            Lorsque le retard dépasse le délai prévu pour ta pilule, la
            protection peut être diminuée. La conduite à tenir dépend alors
            du type de pilule, du nombre de comprimés oubliés et de
            l’emplacement de l’oubli dans la plaquette.
          </Text>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-circle-outline"
              size={25}
              color="#B76568"
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Attention</Text>

              <Text style={styles.tipText}>
                Ne te fie pas uniquement au nombre d’heures indiqué ici :
                certaines pilules ont des consignes différentes. Consulte
                toujours la notice de ton médicament.
              </Text>
            </View>
          </View>

          {/* QUICK GUIDE */}

          <Text style={styles.h3}>Les premiers réflexes</Text>

          <View style={styles.checkList}>
            {CHECK_POINTS.map(item => (
              <View key={item.title} style={styles.checkRow}>
                <View style={styles.checkIcon}>
                  <MaterialDesignIcons
                    name={item.icon as never}
                    size={18}
                    color={GREEN}
                  />
                </View>

                <View style={styles.checkCopy}>
                  <Text style={styles.checkTitle}>{item.title}</Text>

                  <Text style={styles.checkText}>{item.text}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* SECTION 3 */}

          <Text style={styles.h2}>
            3. Les situations qui demandent plus d’attention
          </Text>

          <Text style={styles.body}>
            Toutes les situations ne se ressemblent pas. Certains oublis
            nécessitent une vérification plus précise des recommandations.
          </Text>

          <View style={styles.situationList}>
            {SITUATIONS.map(item => (
              <View key={item.title} style={styles.situationCard}>
                <View style={styles.situationIcon}>
                  <MaterialDesignIcons
                    name={item.icon as never}
                    size={21}
                    color={ROSE}
                  />
                </View>

                <View style={styles.situationCopy}>
                  <Text style={styles.situationTitle}>{item.title}</Text>

                  <Text style={styles.situationText}>{item.text}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* SECTION 4 */}

          <Text style={styles.h2}>4. La notice reste la référence</Text>

          <Text style={styles.body}>
            La notice de ta pilule donne les consignes précises correspondant
            au médicament que tu prends. Les recommandations peuvent être
            différentes selon qu’il s’agit d’une pilule combinée ou d’une
            pilule progestative seule.
          </Text>

          <View style={styles.referenceCard}>
            <View style={styles.referenceHeader}>
              <MaterialDesignIcons
                name="file-document-check-outline"
                size={23}
                color={ROSE}
              />

              <Text style={styles.referenceTitle}>
                Vérifications utiles
              </Text>
            </View>

            {REFERENCE_TIPS.map((item, index) => (
              <View key={item} style={styles.referenceRow}>
                <View style={styles.referenceNumber}>
                  <Text style={styles.referenceNumberText}>
                    {index + 1}
                  </Text>
                </View>

                <Text style={styles.referenceText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* MINI GUIDE */}

          <View style={styles.guideCard}>
            <View style={styles.guideHeader}>
              <MaterialDesignIcons
                name="compass-outline"
                size={23}
                color={ROSE}
              />

              <Text style={styles.guideTitle}>
                Pourquoi le moment de l’oubli compte ?
              </Text>
            </View>

            <Text style={styles.guideText}>
              Le moment où survient l’oubli dans la plaquette peut modifier
              la conduite à tenir. C’est pourquoi la notice précise souvent
              des recommandations différentes selon la semaine de prise.
            </Text>
          </View>

          {/* SECTION 5 */}

          <Text style={styles.h2}>5. Quand demander conseil</Text>

          <Text style={styles.body}>
            Si tu ne sais pas quelle conduite adopter, mieux vaut demander
            conseil plutôt que de rester dans le doute. Une pharmacie, une
            sage-femme ou un médecin peut t’aider à vérifier les
            recommandations adaptées à ta situation.
          </Text>

          <View style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <MaterialDesignIcons
                name="message-question-outline"
                size={23}
                color={ROSE}
              />

              <Text style={styles.questionTitle}>
                Les informations à préparer
              </Text>
            </View>

            {QUESTIONS.map((item, index) => (
              <View key={item} style={styles.questionRow}>
                <View style={styles.questionBullet}>
                  <Text style={styles.questionNumber}>{index + 1}</Text>
                </View>

                <Text style={styles.questionText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.professionalTip}>
            <MaterialDesignIcons
              name="doctor"
              size={25}
              color={ROSE}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Bon à savoir</Text>

              <Text style={styles.tipText}>
                Si un rapport sexuel non protégé a eu lieu autour de la
                période de l’oubli, demande rapidement conseil à un
                professionnel afin de connaître les options possibles.
              </Text>
            </View>
          </View>

          {/* REPEATED FORGETTING */}

          <Text style={styles.h3}>Si les oublis se répètent</Text>

          <Text style={styles.body}>
            Des oublis fréquents peuvent être le signe que le mode de prise
            quotidien ne correspond pas parfaitement à ton rythme de vie.
            N’hésite pas à en parler avec un professionnel de santé afin
            d’explorer d’autres options contraceptives.
          </Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="calendar-sync-outline"
              size={24}
              color={ROSE}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Une autre méthode ?</Text>

              <Text style={styles.tipText}>
                Si prendre un comprimé chaque jour est difficile à maintenir,
                il existe d’autres méthodes avec une fréquence d’utilisation
                différente.
              </Text>
            </View>
          </View>

          {/* SECTION 6 */}

          <Text style={styles.h2}>6. À retenir</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <MaterialDesignIcons
                name="check-decagram-outline"
                size={25}
                color={ROSE}
              />

              <Text style={styles.summaryTitle}>L’essentiel</Text>
            </View>

            <View style={styles.summaryItem}>
              <MaterialDesignIcons
                name="check"
                size={18}
                color={GREEN}
              />

              <Text style={styles.summaryText}>
                Réagis dès que tu constates l’oubli.
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <MaterialDesignIcons
                name="check"
                size={18}
                color={GREEN}
              />

              <Text style={styles.summaryText}>
                Vérifie le type exact de ta pilule.
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <MaterialDesignIcons
                name="check"
                size={18}
                color={GREEN}
              />

              <Text style={styles.summaryText}>
                Consulte la notice pour connaître la conduite précise.
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <MaterialDesignIcons
                name="check"
                size={18}
                color={GREEN}
              />

              <Text style={styles.summaryText}>
                Utilise une protection complémentaire si la notice le
                recommande.
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <MaterialDesignIcons
                name="check"
                size={18}
                color={GREEN}
              />

              <Text style={styles.summaryText}>
                Demande conseil en cas de doute ou de rapport à risque.
              </Text>
            </View>
          </View>

          {/* FINAL MESSAGE */}

          <View style={styles.finalTip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={25}
              color={ROSE}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>À retenir</Text>

              <Text style={styles.tipText}>
                Un oubli ne signifie pas automatiquement que ta
                contraception ne fonctionne plus. La bonne conduite dépend
                du type de pilule et des circonstances de l’oubli. En cas de
                doute, vérifie la notice et demande conseil rapidement.
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
              Cet article est fourni à titre informatif et ne remplace pas
              la notice de ton médicament ni un avis médical personnalisé.
              Les recommandations peuvent varier selon le type de pilule.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* READING CONTROLS */}

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
    color: MUTED,
  },

  intro: {
    marginTop: 17,
    fontSize: 14,
    lineHeight: 21,
    color: BODY,
    fontWeight: '500',
  },

  importantCard: {
    marginTop: 17,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    backgroundColor: '#F8EEF1',
    borderWidth: 1,
    borderColor: '#F0DDE3',
  },

  importantIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5E4E9',
  },

  importantCopy: {
    flex: 1,
    marginLeft: 11,
  },

  importantTitle: {
    fontSize: 13,
    color: INK,
    fontWeight: '800',
  },

  importantText: {
    marginTop: 4,
    fontSize: 11.5,
    lineHeight: 17,
    color: '#585057',
  },

  contents: {
    marginTop: 19,
    padding: 15,
    borderRadius: 13,
    backgroundColor: '#F8F2F4',
    borderWidth: 1,
    borderColor: '#EFE1E6',
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
    marginTop: 27,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: INK,
    fontWeight: '700',
  },

  h3: {
    marginTop: 22,
    fontSize: 16,
    lineHeight: 22,
    color: INK,
    fontWeight: '800',
  },

  body: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: BODY,
  },

  stepCard: {
    marginTop: 11,
    padding: 14,
    borderRadius: 13,
    backgroundColor: '#FBF8F5',
    borderWidth: 1,
    borderColor: '#EEE6E0',
  },

  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3DFE5',
  },

  stepNumberText: {
    fontSize: 12,
    color: ROSE,
    fontWeight: '800',
  },

  stepTitle: {
    marginLeft: 10,
    fontSize: 13,
    color: INK,
    fontWeight: '800',
  },

  stepText: {
    marginTop: 8,
    marginLeft: 40,
    fontSize: 11.5,
    lineHeight: 17,
    color: '#585057',
  },

  tip: {
    marginTop: 15,
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

  alert: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: '#F8E8E8',
    borderWidth: 1,
    borderColor: '#F1DADA',
  },

  checkList: {
    marginTop: 14,
    padding: 13,
    borderRadius: 13,
    backgroundColor: '#FBF8F5',
    borderWidth: 1,
    borderColor: '#EEE6E0',
  },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  checkIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDF2EB',
  },

  checkCopy: {
    flex: 1,
    marginLeft: 10,
  },

  checkTitle: {
    fontSize: 12.5,
    color: INK,
    fontWeight: '800',
  },

  checkText: {
    marginTop: 3,
    fontSize: 11.5,
    lineHeight: 17,
    color: '#585057',
  },

  situationList: {
    marginTop: 14,
    gap: 10,
  },

  situationCard: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 13,
    backgroundColor: '#FBF8F5',
    borderWidth: 1,
    borderColor: '#EEE6E0',
  },

  situationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5E8EC',
  },

  situationCopy: {
    flex: 1,
    marginLeft: 11,
  },

  situationTitle: {
    fontSize: 13,
    color: INK,
    fontWeight: '800',
  },

  situationText: {
    marginTop: 4,
    fontSize: 11.5,
    lineHeight: 17,
    color: '#585057',
  },

  referenceCard: {
    marginTop: 15,
    padding: 15,
    borderRadius: 14,
    backgroundColor: '#F8F2F4',
    borderWidth: 1,
    borderColor: '#EBDDE2',
  },

  referenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 13,
  },

  referenceTitle: {
    fontSize: 14,
    color: INK,
    fontWeight: '800',
  },

  referenceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 11,
  },

  referenceNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3DFE5',
  },

  referenceNumberText: {
    fontSize: 10,
    color: ROSE,
    fontWeight: '800',
  },

  referenceText: {
    flex: 1,
    marginLeft: 9,
    paddingTop: 2,
    fontSize: 12,
    lineHeight: 17,
    color: BODY,
  },

  guideCard: {
    marginTop: 15,
    padding: 15,
    borderRadius: 14,
    backgroundColor: '#F7F0EC',
    borderWidth: 1,
    borderColor: '#EEE2DA',
  },

  guideHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },

  guideTitle: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: INK,
    fontWeight: '800',
  },

  guideText: {
    marginTop: 9,
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
    borderWidth: 1,
    borderColor: '#EEDDE3',
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