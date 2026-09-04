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

const ID = 'hotflashes-bouffees-de-chaleur';

const CREAM = '#FCF9F5';
const INK = '#30283A';
const ROSE = '#B96778';
const BORDER = '#ECE5DF';
const MUTED = '#777078';
const BODY = '#4A444B';
const GREEN = '#789276';

const HERO = require('../../assets/images/library/tip-heat.png');

const TRIGGERS = [
  'La caféine et l’alcool',
  'Les plats épicés',
  'Le stress et les émotions fortes',
  'Une pièce surchauffée ou des vêtements trop couvrants',
];

const DAILY_HABITS = [
  ['tshirt-crew-outline', 'S’habiller en plusieurs couches légères'],
  ['weather-windy', 'Garder un espace frais et bien aéré'],
  ['meditation', 'Pratiquer une respiration lente en cas de bouffée'],
  ['cup-water', 'Boire de l’eau fraîche régulièrement'],
] as const;

const CONSULT_REASONS = [
  {
    icon: 'sleep',
    title: 'Quand le sommeil est perturbé',
    text: 'Des bouffées ou des sueurs nocturnes fréquentes qui provoquent des réveils répétés, une fatigue importante ou des difficultés à fonctionner normalement dans la journée.',
  },
  {
    icon: 'briefcase-outline',
    title: 'Quand le quotidien devient difficile',
    text: 'Si les bouffées de chaleur gênent ton travail, tes activités, tes déplacements, tes relations sociales ou simplement ton confort au quotidien.',
  },
  {
    icon: 'chart-line',
    title: 'Quand les symptômes deviennent plus fréquents',
    text: 'Une augmentation nette de la fréquence ou de l’intensité des symptômes mérite d’être discutée afin de rechercher les solutions les plus adaptées.',
  },
  {
    icon: 'medical-bag',
    title: 'Si tu souhaites un traitement',
    text: 'Des options hormonales et non hormonales peuvent être proposées selon la situation. Un professionnel peut t’aider à évaluer leurs bénéfices, leurs risques et leurs éventuelles contre-indications.',
  },
];

const EMERGENCY_SIGNS = [
  'Une douleur thoracique inhabituelle ou importante',
  'Un essoufflement soudain ou une difficulté importante à respirer',
  'Un malaise ou une perte de connaissance',
  'Une faiblesse brutale, un trouble de la parole ou de la vision',
  'Un gonflement douloureux et inhabituel d’une jambe',
];

const APPOINTMENT_QUESTIONS = [
  'À quelle fréquence les bouffées surviennent-elles ?',
  'Depuis combien de temps sont-elles présentes ?',
  'Surviennent-elles plutôt le jour, la nuit ou les deux ?',
  'Perturbent-elles ton sommeil ou tes activités ?',
  'As-tu identifié certains déclencheurs ?',
  'Prends-tu actuellement un traitement ou une contraception hormonale ?',
];

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ArticleReader'
>;

export default function HotFlashesArticleScreen({
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
      message: 'Apprivoiser les bouffées de chaleur — AWA',
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
          {/* BADGE */}

          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              BOUFFÉES DE CHALEUR
            </Text>
          </View>

          {/* TITLE */}

          <Text style={styles.title}>
            Apprivoiser les{'\n'}bouffées de chaleur
          </Text>

          {/* METADATA */}

          <View style={styles.metas}>
            {[
              ['clock-outline', '10 min de lecture'],
              [
                'book-open-page-variant-outline',
                'Article',
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

          {/* INTRO */}

          <Text style={styles.intro}>
            Pourquoi elles surviennent, comment identifier
            tes déclencheurs et quelles solutions peuvent
            aider lorsqu’elles deviennent gênantes.
          </Text>

          {/* TABLE OF CONTENTS */}

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>
              Dans cet article
            </Text>

            {[
              'Pourquoi les bouffées de chaleur surviennent',
              'Les sueurs nocturnes',
              'Les déclencheurs courants',
              'Des gestes qui aident au quotidien',
              'Quand en parler à un professionnel',
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
            1. Pourquoi les bouffées de chaleur surviennent
          </Text>

          <Text style={styles.body}>
            Les bouffées de chaleur sont très fréquentes
            pendant la transition vers la ménopause. Elles
            sont liées notamment aux variations hormonales
            qui modifient la façon dont le cerveau régule la
            température du corps.
          </Text>

          <Text style={styles.body}>
            Une petite variation de la température corporelle
            peut alors être ressentie comme une chaleur
            soudaine. Le corps réagit en dilatant les
            vaisseaux sanguins de la peau, ce qui peut
            provoquer une sensation de chaleur, des rougeurs
            et parfois une transpiration importante.
          </Text>

          <View style={styles.highlight}>
            <MaterialDesignIcons
              name="thermometer"
              size={23}
              color={ROSE}
            />

            <View style={styles.highlightCopy}>
              <Text style={styles.highlightTitle}>
                Chaque personne est différente
              </Text>

              <Text style={styles.highlightText}>
                Certaines femmes ressentent quelques
                épisodes par semaine, tandis que d’autres
                peuvent en avoir plusieurs par jour.
                L’intensité et la durée peuvent également
                varier.
              </Text>
            </View>
          </View>

          {/* SECTION 2 */}

          <Text style={styles.h2}>
            2. Les sueurs nocturnes
          </Text>

          <Text style={styles.body}>
            Lorsqu’elles surviennent pendant le sommeil, les
            bouffées de chaleur peuvent provoquer des sueurs
            nocturnes. Elles peuvent entraîner plusieurs
            réveils et rendre le sommeil moins réparateur.
          </Text>

          <Text style={styles.body}>
            Le manque de sommeil peut ensuite accentuer la
            fatigue, les difficultés de concentration et
            l’irritabilité pendant la journée. Il peut donc
            être utile de prendre en compte la qualité du
            sommeil lorsque tu évalues l’impact des symptômes.
          </Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={ROSE}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                Bon à savoir
              </Text>

              <Text style={styles.tipText}>
                Un pyjama en matière respirante, un linge de
                lit léger et une chambre suffisamment fraîche
                peuvent aider à limiter l’inconfort pendant
                la nuit.
              </Text>
            </View>
          </View>

          {/* SECTION 3 */}

          <Text style={styles.h2}>
            3. Les déclencheurs courants
          </Text>

          <Text style={styles.body}>
            Certains facteurs peuvent déclencher ou accentuer
            une bouffée de chaleur. Ils ne provoquent pas
            forcément de symptômes chez tout le monde, mais
            les identifier peut aider à mieux comprendre ton
            propre fonctionnement.
          </Text>

          <View style={styles.checkList}>
            {TRIGGERS.map(item => (
              <View
                key={item}
                style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={GREEN}
                />

                <Text style={styles.checkText}>
                  {item}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="notebook-edit-outline"
              size={24}
              color={ROSE}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                Petit réflexe utile
              </Text>

              <Text style={styles.tipText}>
                Pendant quelques semaines, note le moment où
                surviennent les bouffées, leur intensité et
                ce qui s’est passé juste avant. Cela peut
                t’aider à repérer des déclencheurs personnels.
              </Text>
            </View>
          </View>

          {/* SECTION 4 */}

          <Text style={styles.h2}>
            4. Des gestes qui aident au quotidien
          </Text>

          <View style={styles.daily}>
            {DAILY_HABITS.map(([icon, label]) => (
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

          <Text style={styles.body}>
            Ces mesures ne font pas disparaître
            systématiquement les bouffées, mais elles peuvent
            rendre les épisodes plus faciles à gérer et
            diminuer l’inconfort lorsqu’ils surviennent.
          </Text>

          {/* SECTION 5 */}

          <Text style={styles.h2}>
            5. Quand en parler à un professionnel
          </Text>

          <Text style={styles.body}>
            Les bouffées de chaleur sont fréquentes pendant la
            périménopause et la ménopause. Cependant, tu n’as
            pas besoin de simplement les supporter si elles
            deviennent difficiles à vivre. Un médecin ou une
            sage-femme peut évaluer tes symptômes et discuter
            avec toi des différentes possibilités.
          </Text>

          <Text style={styles.h3}>
            Quand prendre rendez-vous ?
          </Text>

          <Text style={styles.body}>
            Une consultation peut être particulièrement utile
            lorsque les symptômes ont un impact important sur
            ton quotidien ou lorsque tu souhaites connaître
            les options disponibles.
          </Text>

          <View style={styles.consultList}>
            {CONSULT_REASONS.map(item => (
              <View
                key={item.title}
                style={styles.consultCard}>
                <View style={styles.consultIcon}>
                  <MaterialDesignIcons
                    name={item.icon as never}
                    size={21}
                    color={ROSE}
                  />
                </View>

                <View style={styles.consultCopy}>
                  <Text style={styles.consultTitle}>
                    {item.title}
                  </Text>

                  <Text style={styles.consultText}>
                    {item.text}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.h3}>
            Ne pas tout attribuer à la ménopause
          </Text>

          <Text style={styles.body}>
            Une bouffée de chaleur peut avoir différentes
            causes. Certains symptômes peuvent également être
            liés à un médicament, à une autre condition
            médicale ou à un changement important dans ton
            état de santé. Si quelque chose te semble
            inhabituel, nouveau ou particulièrement intense,
            il est préférable d’en parler à un professionnel
            plutôt que de supposer automatiquement qu’il
            s’agit de la ménopause.
          </Text>

          {/* ALERT */}

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-circle-outline"
              size={24}
              color="#B76568"
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                Consulter rapidement
              </Text>

              <Text style={styles.tipText}>
                Une douleur thoracique, un essoufflement
                soudain, un malaise, une faiblesse brutale ou
                un gonflement douloureux inhabituel d’une
                jambe nécessitent un avis médical rapide.
              </Text>
            </View>
          </View>

          <Text style={styles.h3}>
            Quels signes doivent particulièrement attirer ton
            attention ?
          </Text>

          <View style={styles.warningList}>
            {EMERGENCY_SIGNS.map(item => (
              <View
                key={item}
                style={styles.warningRow}>
                <MaterialDesignIcons
                  name="alert-circle-outline"
                  size={18}
                  color="#B76568"
                />

                <Text style={styles.warningText}>
                  {item}
                </Text>
              </View>
            ))}
          </View>

          <Text style={styles.h3}>
            Quelles solutions peuvent être proposées ?
          </Text>

          <Text style={styles.body}>
            Si les bouffées de chaleur sont suffisamment
            gênantes pour nécessiter une prise en charge,
            plusieurs approches peuvent être envisagées.
            Selon ta situation, le professionnel peut discuter
            de mesures liées au mode de vie, de traitements
            non hormonaux ou, lorsque cela est approprié, d’un
            traitement hormonal.
          </Text>

          <View style={styles.highlight}>
            <MaterialDesignIcons
              name="medical-bag"
              size={23}
              color={ROSE}
            />

            <View style={styles.highlightCopy}>
              <Text style={styles.highlightTitle}>
                Un traitement se choisit au cas par cas
              </Text>

              <Text style={styles.highlightText}>
                L’âge, les symptômes, les antécédents
                médicaux, les traitements en cours et les
                préférences personnelles peuvent influencer
                les options proposées.
              </Text>
            </View>
          </View>

          <Text style={styles.h3}>
            Préparer ton rendez-vous
          </Text>

          <Text style={styles.body}>
            Arriver avec quelques informations peut rendre la
            consultation plus utile. Tu peux noter pendant
            quelques jours ou semaines la fréquence des
            épisodes, leur intensité et leur impact sur ton
            sommeil ou tes activités.
          </Text>

          {/* QUESTIONS */}

          <View style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <MaterialDesignIcons
                name="message-question-outline"
                size={22}
                color={ROSE}
              />

              <Text style={styles.questionTitle}>
                Informations utiles à préparer
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

          {/* PROFESSIONAL TIP */}

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
                Il n’est pas nécessaire d’attendre que les
                symptômes deviennent très importants pour en
                parler. Une consultation peut aussi servir
                simplement à comprendre ce qui se passe et à
                connaître les solutions disponibles.
              </Text>
            </View>
          </View>

          {/* SECTION 6 */}

          <Text style={styles.h2}>
            6. À retenir
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

            <View style={styles.summaryItem}>
              <MaterialDesignIcons
                name="check"
                size={18}
                color={GREEN}
              />

              <Text style={styles.summaryText}>
                Les bouffées de chaleur sont fréquentes
                pendant la transition ménopausique.
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <MaterialDesignIcons
                name="check"
                size={18}
                color={GREEN}
              />

              <Text style={styles.summaryText}>
                Identifier tes déclencheurs peut t’aider à
                mieux gérer les épisodes.
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <MaterialDesignIcons
                name="check"
                size={18}
                color={GREEN}
              />

              <Text style={styles.summaryText}>
                Des habitudes simples peuvent réduire
                l’inconfort au quotidien.
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <MaterialDesignIcons
                name="check"
                size={18}
                color={GREEN}
              />

              <Text style={styles.summaryText}>
                Si les symptômes perturbent ton sommeil ou ta
                vie quotidienne, parle-en à un professionnel.
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <MaterialDesignIcons
                name="check"
                size={18}
                color={GREEN}
              />

              <Text style={styles.summaryText}>
                Plusieurs options de prise en charge peuvent
                être discutées selon ta situation.
              </Text>
            </View>
          </View>

          {/* FINAL TIP */}

          <View style={styles.finalTip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={25}
              color={ROSE}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>
                À retenir
              </Text>

              <Text style={styles.tipText}>
                Les bouffées de chaleur sont courantes, mais
                elles ne doivent pas être minimisées lorsqu’elles
                affectent ton sommeil, ton travail ou ton
                bien-être. Observer tes symptômes et en parler
                à un professionnel permet de mieux comprendre
                leur origine et d’explorer les solutions
                adaptées.
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
              remplace pas un avis médical personnalisé.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* READING CONTROLS */}

      <ReadingControls
        articleId={ID}
        durationMinutes={10}
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

  checkList: {
    marginTop: 13,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FBF8F5',
    borderWidth: 1,
    borderColor: '#F0E9E3',
  },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },

  checkText: {
    flex: 1,
    color: BODY,
    fontSize: 12.5,
    lineHeight: 18,
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
    marginBottom: 10,
  },

  warningText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: BODY,
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