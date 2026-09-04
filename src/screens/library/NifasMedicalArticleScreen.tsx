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

const ID = 'nifas-aspects-medicaux';

const CREAM = '#FCF9F5';
const INK = '#30283A';
const ROSE = '#B96778';
const BORDER = '#ECE5DF';
const BODY = '#4A444B';
const MUTED = '#777078';
const GREEN = '#789276';
const SOFT_ROSE = '#F3DFE5';
const CARD = '#FBF8F5';

const HERO = require('../../assets/images/library/featured-spm.png');

/* -------------------------------------------------------------------------- */
/* DATA */
/* -------------------------------------------------------------------------- */

const NIFAS_STAGES = [
  {
    icon: 'hospital-box-outline',
    number: '01',
    title: 'Après l’accouchement',
    subtitle: 'Début du post-partum',
    text:
      'Le corps commence progressivement sa récupération après la naissance.',
  },
  {
    icon: 'water-outline',
    number: '02',
    title: 'Les lochies',
    subtitle: 'Pertes post-accouchement',
    text:
      'Les pertes évoluent progressivement en quantité et en couleur.',
  },
  {
    icon: 'chart-timeline-variant',
    number: '03',
    title: 'Diminution progressive',
    subtitle: 'Sur plusieurs semaines',
    text:
      'Les pertes diminuent généralement au fil du temps.',
  },
  {
    icon: 'calendar-check-outline',
    number: '04',
    title: 'Retour progressif',
    subtitle: 'Vers le cycle habituel',
    text:
      'Le cycle menstruel peut ensuite reprendre progressivement.',
  },
] as const;

const LOCHIA_EVOLUTION = [
  {
    icon: 'numeric-1-circle-outline',
    color: ROSE,
    title: 'Lochies rouges',
    period: 'Premiers jours',
    text:
      'Les pertes sont généralement rouges et peuvent être plus abondantes au début.',
  },
  {
    icon: 'numeric-2-circle-outline',
    color: '#C58A93',
    title: 'Lochies rosées / brunâtres',
    period: 'Après quelques jours',
    text:
      'La couleur peut devenir plus claire ou brunâtre tandis que le flux diminue.',
  },
  {
    icon: 'numeric-3-circle-outline',
    color: GREEN,
    title: 'Lochies blanchâtres',
    period: 'Semaines suivantes',
    text:
      'Les pertes deviennent progressivement plus claires et moins abondantes.',
  },
] as const;

const CARE_TIPS = [
  {
    icon: 'shower',
    title: 'Hygiène douce',
    text:
      'Garde une hygiène quotidienne simple et confortable.',
  },
  {
    icon: 'bed-outline',
    title: 'Repos',
    text:
      'Accorde à ton corps du temps pour récupérer.',
  },
  {
    icon: 'cup-water',
    title: 'Hydratation',
    text:
      'Pense à boire régulièrement selon tes besoins.',
  },
  {
    icon: 'food-apple-outline',
    title: 'Alimentation',
    text:
      'Une alimentation variée accompagne la récupération.',
  },
] as const;

const WARNING_SIGNS = [
  'Une odeur forte ou inhabituelle des pertes',
  'De la fièvre ou un état général qui se dégrade',
  'Un saignement qui devient soudainement très abondant',
  'Une douleur importante, persistante ou inhabituelle',
  'Un symptôme nouveau qui t’inquiète',
] as const;

const SUMMARY = [
  'Le nifas est un terme utilisé dans le cadre religieux après l’accouchement.',
  'Sur le plan médical, les pertes post-accouchement sont appelées lochies.',
  'Les lochies évoluent progressivement en couleur et en quantité.',
  'Le repos, l’hygiène douce et une bonne hydratation accompagnent la récupération.',
  'Un changement inhabituel ou préoccupant mérite un avis professionnel.',
] as const;

/* -------------------------------------------------------------------------- */
/* TYPES */
/* -------------------------------------------------------------------------- */

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ArticleReader'
>;

/* -------------------------------------------------------------------------- */
/* SCREEN */
/* -------------------------------------------------------------------------- */

export default function NifasMedicalArticleScreen({
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
      message: 'Le nifas : aspects médicaux — AWA',
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
        ]}
      >
        {/* ---------------------------------------------------------------- */}
        {/* HERO */}
        {/* ---------------------------------------------------------------- */}

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
                paddingTop: getTopPadding(insets.top, true),
              },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retour"
              onPress={() => navigation.goBack()}
              style={({pressed}) => [
                styles.circle,
                pressed && styles.pressed,
              ]}
            >
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
                ]}
              >
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
                ]}
              >
                <MaterialDesignIcons
                  name="share-variant-outline"
                  size={20}
                  color={ROSE}
                />
              </Pressable>
            </View>
          </View>
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* ARTICLE */}
        {/* ---------------------------------------------------------------- */}

        <View style={styles.article}>
          {/* Badge */}

          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              POST-PARTUM • NIFAS
            </Text>
          </View>

          {/* Title */}

          <Text style={styles.title}>
            Le nifas :{'\n'}
            aspects médicaux
          </Text>

          {/* Metadata */}

          <View style={styles.metas}>
            {[
              ['clock-outline', '5 min de lecture'],
              [
                'book-open-page-variant-outline',
                'Guide',
              ],
              ['chart-bar', 'Débutant'],
              [
                'shield-check-outline',
                'Contenu informatif',
              ],
            ].map(([icon, text], index) => (
              <React.Fragment key={text}>
                {index > 0 ? (
                  <View style={styles.metaDivider} />
                ) : null}

                <View style={styles.metaItem}>
                  <MaterialDesignIcons
                    name={icon as never}
                    color={MUTED}
                    size={16}
                  />

                  <Text style={styles.meta}>
                    {text}
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          {/* Introduction */}

          <Text style={styles.intro}>
            Après la naissance, le corps traverse une
            période de récupération progressive.
            Comprendre les pertes post-accouchement,
            leur évolution et les signes qui doivent
            attirer l’attention peut aider à vivre cette
            période avec davantage de repères.
          </Text>

          {/* ---------------------------------------------------------------- */}
          {/* CONTENTS */}
          {/* ---------------------------------------------------------------- */}

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>
              Dans cet article
            </Text>

            {[
              'Comprendre le terme nifas',
              'Le schéma médical après la naissance',
              'L’évolution des lochies',
              'Prendre soin de soi',
              'Quand demander conseil ?',
              'À retenir',
            ].map((item, index) => (
              <View
                key={item}
                style={styles.contentRow}
              >
                <View style={styles.contentLeft}>
                  <Text style={styles.contentNumber}>
                    {String(index + 1).padStart(2, '0')}
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

          {/* ---------------------------------------------------------------- */}
          {/* SECTION 1 */}
          {/* ---------------------------------------------------------------- */}

          <Text style={styles.h2}>
            1. Comprendre le terme « nifas »
          </Text>

          <Text style={styles.body}>
            Le terme « nifas » appartient au vocabulaire
            religieux et désigne la période liée aux
            saignements qui suivent l’accouchement dans
            les règles de jurisprudence islamique.
          </Text>

          <Text style={styles.body}>
            Sur le plan médical, les pertes observées
            après l’accouchement sont appelées
            « lochies ». Ces deux notions peuvent être
            étudiées séparément : l’une relève d’un cadre
            religieux, l’autre décrit un phénomène
            physiologique.
          </Text>

          {/* Distinction card */}

          <View style={styles.distinctionCard}>
            <View style={styles.distinctionItem}>
              <View style={styles.distinctionIcon}>
                <MaterialDesignIcons
                  name="book-open-variant"
                  size={21}
                  color={ROSE}
                />
              </View>

              <View style={styles.distinctionCopy}>
                <Text style={styles.distinctionTitle}>
                  Nifas
                </Text>

                <Text style={styles.distinctionText}>
                  Notion relevant du cadre religieux
                  après l’accouchement.
                </Text>
              </View>
            </View>

            <View style={styles.distinctionDivider} />

            <View style={styles.distinctionItem}>
              <View style={styles.distinctionIcon}>
                <MaterialDesignIcons
                  name="medical-bag"
                  size={21}
                  color={ROSE}
                />
              </View>

              <View style={styles.distinctionCopy}>
                <Text style={styles.distinctionTitle}>
                  Lochies
                </Text>

                <Text style={styles.distinctionText}>
                  Terme médical utilisé pour les pertes
                  post-accouchement.
                </Text>
              </View>
            </View>
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* SECTION 2 */}
          {/* ---------------------------------------------------------------- */}

          <Text style={styles.h2}>
            2. Le schéma médical après la naissance
          </Text>

          <Text style={styles.body}>
            La récupération post-partum se fait
            progressivement. Les pertes post-accouchement
            évoluent généralement avec le temps tandis
            que l’utérus poursuit son retour vers son état
            habituel.
          </Text>

          {/* SCHEMA */}

          <View style={styles.schemaCard}>
            <View style={styles.schemaHeader}>
              <View style={styles.schemaHeaderIcon}>
                <MaterialDesignIcons
                  name="chart-timeline-variant"
                  size={22}
                  color={ROSE}
                />
              </View>

              <View style={styles.schemaHeaderCopy}>
                <Text style={styles.schemaTitle}>
                  Évolution post-accouchement
                </Text>

                <Text style={styles.schemaSubtitle}>
                  Repère médical simplifié
                </Text>
              </View>
            </View>

            <View style={styles.schemaTimeline}>
              {NIFAS_STAGES.map((stage, index) => (
                <View
                  key={stage.number}
                  style={styles.schemaStage}
                >
                  <View style={styles.schemaRail}>
                    <View style={styles.schemaNode}>
                      <Text
                        style={styles.schemaNodeNumber}
                      >
                        {stage.number}
                      </Text>
                    </View>

                    {index <
                    NIFAS_STAGES.length - 1 ? (
                      <View
                        style={styles.schemaConnector}
                      />
                    ) : null}
                  </View>

                  <View style={styles.schemaContent}>
                    <View
                      style={styles.schemaStageTop}
                    >
                      <View
                        style={styles.schemaStageIcon}
                      >
                        <MaterialDesignIcons
                          name={stage.icon as never}
                          size={19}
                          color={ROSE}
                        />
                      </View>

                      <View
                        style={styles.schemaStageHeading}
                      >
                        <Text
                          style={
                            styles.schemaStageTitle
                          }
                        >
                          {stage.title}
                        </Text>

                        <Text
                          style={
                            styles.schemaStageSubtitle
                          }
                        >
                          {stage.subtitle}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={styles.schemaStageText}
                    >
                      {stage.text}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* SECTION 3 */}
          {/* ---------------------------------------------------------------- */}

          <Text style={styles.h2}>
            3. L’évolution des lochies
          </Text>

          <Text style={styles.body}>
            Les lochies changent généralement
            progressivement de couleur et diminuent en
            quantité. Leur évolution peut cependant
            varier d’une personne à l’autre.
          </Text>

          <View style={styles.evolutionCard}>
            {LOCHIA_EVOLUTION.map((item, index) => (
              <View
                key={item.title}
                style={styles.evolutionItem}
              >
                <View style={styles.evolutionLeft}>
                  <View style={styles.evolutionIcon}>
                    <MaterialDesignIcons
                      name={item.icon as never}
                      size={21}
                      color={item.color}
                    />
                  </View>

                  {index <
                  LOCHIA_EVOLUTION.length - 1 ? (
                    <View
                      style={
                        styles.evolutionConnector
                      }
                    />
                  ) : null}
                </View>

                <View style={styles.evolutionCopy}>
                  <Text style={styles.evolutionTitle}>
                    {item.title}
                  </Text>

                  <Text
                    style={styles.evolutionPeriod}
                  >
                    {item.period}
                  </Text>

                  <Text style={styles.evolutionText}>
                    {item.text}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Info */}

          <View style={styles.infoCard}>
            <MaterialDesignIcons
              name="information-outline"
              size={22}
              color={ROSE}
            />

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>
                À retenir
              </Text>

              <Text style={styles.infoText}>
                La couleur et la quantité des lochies
                peuvent évoluer progressivement.
                L’évolution exacte n’est pas identique
                chez toutes les personnes.
              </Text>
            </View>
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* SECTION 4 */}
          {/* ---------------------------------------------------------------- */}

          <Text style={styles.h2}>
            4. Prendre soin de soi
          </Text>

          <Text style={styles.body}>
            Pendant cette période, quelques habitudes
            simples peuvent contribuer au confort et
            accompagner la récupération du corps.
          </Text>

          <View style={styles.careGrid}>
            {CARE_TIPS.map(item => (
              <View
                key={item.title}
                style={styles.careCard}
              >
                <View style={styles.careIcon}>
                  <MaterialDesignIcons
                    name={item.icon as never}
                    size={22}
                    color={ROSE}
                  />
                </View>

                <Text style={styles.careTitle}>
                  {item.title}
                </Text>

                <Text style={styles.careText}>
                  {item.text}
                </Text>
              </View>
            ))}
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* SECTION 5 */}
          {/* ---------------------------------------------------------------- */}

          <Text style={styles.h2}>
            5. Quand demander conseil ?
          </Text>

          <Text style={styles.body}>
            Certaines situations nécessitent de demander
            rapidement conseil à un professionnel de
            santé, notamment lorsqu’un changement paraît
            important, soudain ou inhabituel.
          </Text>

          <View style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <View style={styles.warningHeaderIcon}>
                <MaterialDesignIcons
                  name="alert-outline"
                  size={22}
                  color="#B76568"
                />
              </View>

              <View style={styles.warningHeaderCopy}>
                <Text style={styles.warningTitle}>
                  Signes à ne pas ignorer
                </Text>

                <Text
                  style={styles.warningSubtitle}
                >
                  Demande un avis professionnel si
                  nécessaire
                </Text>
              </View>
            </View>

            {WARNING_SIGNS.map(item => (
              <View
                key={item}
                style={styles.warningRow}
              >
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

          {/* ---------------------------------------------------------------- */}
          {/* TIP */}
          {/* ---------------------------------------------------------------- */}

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
                Chaque récupération post-partum est
                différente. Les informations de cet
                article sont destinées à donner des
                repères généraux et ne remplacent pas
                une consultation médicale.
              </Text>
            </View>
          </View>

          {/* ---------------------------------------------------------------- */}
          {/* SUMMARY */}
          {/* ---------------------------------------------------------------- */}

          <Text style={styles.h2}>
            À retenir
          </Text>

          <View style={styles.summaryCard}>
            {SUMMARY.map(item => (
              <View
                key={item}
                style={styles.summaryRow}
              >
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={GREEN}
                />

                <Text style={styles.summaryText}>
                  {item}
                </Text>
              </View>
            ))}
          </View>

          {/* Disclaimer */}

          <View style={styles.disclaimer}>
            <MaterialDesignIcons
              name="shield-outline"
              size={18}
              color="#8A8190"
            />

            <Text style={styles.disclaimerText}>
              Contenu informatif. Les informations
              médicales présentées ici sont générales
              et ne remplacent pas l’avis d’un
              professionnel de santé. Pour les questions
              religieuses spécifiques, il est recommandé
              de se référer à une source religieuse
              qualifiée.
            </Text>
          </View>
        </View>
      </ScrollView>

      <ReadingControls
        articleId={ID}
        durationMinutes={5}
        scrollRef={scrollRef}
      />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* STYLES */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: CREAM,
  },

  scroll: {
    paddingBottom: 30,
  },

  /* HERO */

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
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: BORDER,
  },

  pressed: {
    opacity: 0.72,
  },

  /* ARTICLE */

  article: {
    marginTop: -15,
    padding: 20,
    paddingBottom: 30,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: CREAM,
  },

  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: SOFT_ROSE,
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
    gap: 9,
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  metaDivider: {
    width: 1,
    height: 18,
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

  /* CONTENTS */

  contents: {
    marginTop: 20,
    padding: 15,
    borderRadius: 14,
    backgroundColor: '#F8F2F4',
    borderWidth: 1,
    borderColor: '#EBDDE2',
  },

  contentsTitle: {
    marginBottom: 7,
    fontSize: 15,
    color: INK,
    fontWeight: '800',
  },

  contentRow: {
    minHeight: 41,
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
    width: 31,
    color: ROSE,
    fontSize: 10.5,
    fontWeight: '800',
  },

  contentText: {
    flex: 1,
    fontSize: 12.2,
    lineHeight: 17,
    color: INK,
  },

  /* HEADINGS */

  h2: {
    marginTop: 28,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: INK,
    fontWeight: '700',
  },

  body: {
    marginTop: 9,
    fontSize: 14,
    lineHeight: 21.5,
    color: BODY,
  },

  /* DISTINCTION */

  distinctionCard: {
    marginTop: 15,
    padding: 14,
    borderRadius: 14,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: '#EEE6E0',
  },

  distinctionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  distinctionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SOFT_ROSE,
  },

  distinctionCopy: {
    flex: 1,
    marginLeft: 10,
  },

  distinctionTitle: {
    fontSize: 13,
    color: INK,
    fontWeight: '800',
  },

  distinctionText: {
    marginTop: 3,
    fontSize: 10.8,
    lineHeight: 16,
    color: '#625A61',
  },

  distinctionDivider: {
    height: 1,
    marginVertical: 13,
    backgroundColor: '#EEE6E0',
  },

  /* SCHEMA */

  schemaCard: {
    marginTop: 15,
    padding: 15,
    borderRadius: 16,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: '#EDE3DE',
  },

  schemaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE4DF',
  },

  schemaHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SOFT_ROSE,
  },

  schemaHeaderCopy: {
    flex: 1,
    marginLeft: 10,
  },

  schemaTitle: {
    fontSize: 13.5,
    color: INK,
    fontWeight: '800',
  },

  schemaSubtitle: {
    marginTop: 2,
    fontSize: 10,
    color: MUTED,
  },

  schemaTimeline: {
    marginTop: 4,
  },

  schemaStage: {
    minHeight: 102,
    flexDirection: 'row',
  },

  schemaRail: {
    width: 42,
    alignItems: 'center',
    position: 'relative',
  },

  schemaNode: {
    width: 32,
    height: 32,
    marginTop: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SOFT_ROSE,
    borderWidth: 1,
    borderColor: '#E8D0D7',
    zIndex: 2,
  },

  schemaNodeNumber: {
    fontSize: 9,
    color: ROSE,
    fontWeight: '900',
  },

  schemaConnector: {
    position: 'absolute',
    top: 48,
    bottom: 0,
    width: 2,
    backgroundColor: '#E7D9DE',
  },

  schemaContent: {
    flex: 1,
    paddingTop: 13,
    paddingLeft: 9,
    paddingBottom: 10,
  },

  schemaStageTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  schemaStageIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8ECEF',
  },

  schemaStageHeading: {
    flex: 1,
    marginLeft: 8,
  },

  schemaStageTitle: {
    fontSize: 12.5,
    color: INK,
    fontWeight: '800',
  },

  schemaStageSubtitle: {
    marginTop: 1,
    fontSize: 9.5,
    color: ROSE,
    fontWeight: '700',
  },

  schemaStageText: {
    marginTop: 7,
    fontSize: 10.7,
    lineHeight: 16,
    color: '#585057',
  },

  /* EVOLUTION */

  evolutionCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: '#EEE6E0',
  },

  evolutionItem: {
    minHeight: 91,
    flexDirection: 'row',
  },

  evolutionLeft: {
    width: 40,
    alignItems: 'center',
    position: 'relative',
  },

  evolutionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7EAED',
    zIndex: 2,
  },

  evolutionConnector: {
    position: 'absolute',
    top: 34,
    bottom: 0,
    width: 1.5,
    backgroundColor: '#E5D7DC',
  },

  evolutionCopy: {
    flex: 1,
    marginLeft: 8,
    paddingBottom: 13,
  },

  evolutionTitle: {
    fontSize: 12.5,
    color: INK,
    fontWeight: '800',
  },

  evolutionPeriod: {
    marginTop: 2,
    fontSize: 9.5,
    color: ROSE,
    fontWeight: '700',
  },

  evolutionText: {
    marginTop: 4,
    fontSize: 10.8,
    lineHeight: 16,
    color: '#585057',
  },

  /* INFO */

  infoCard: {
    marginTop: 14,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 13,
    backgroundColor: '#F8EEF1',
    borderWidth: 1,
    borderColor: '#F0DDE3',
  },

  infoCopy: {
    flex: 1,
    marginLeft: 9,
  },

  infoTitle: {
    fontSize: 12.5,
    color: INK,
    fontWeight: '800',
  },

  infoText: {
    marginTop: 3,
    fontSize: 10.8,
    lineHeight: 16,
    color: '#585057',
  },

  /* CARE */

  careGrid: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },

  careCard: {
    width: '48%',
    minHeight: 135,
    padding: 12,
    borderRadius: 13,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: '#EEE6E0',
  },

  careIcon: {
    width: 37,
    height: 37,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5E8EC',
  },

  careTitle: {
    marginTop: 9,
    fontSize: 12,
    color: INK,
    fontWeight: '800',
  },

  careText: {
    marginTop: 4,
    fontSize: 10.4,
    lineHeight: 15.5,
    color: '#585057',
  },

  /* WARNING */

  warningCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FCF5F3',
    borderWidth: 1,
    borderColor: '#F1DFDB',
  },

  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0DFDB',
  },

  warningHeaderIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7E8E5',
  },

  warningHeaderCopy: {
    flex: 1,
    marginLeft: 9,
  },

  warningTitle: {
    fontSize: 12.5,
    color: INK,
    fontWeight: '800',
  },

  warningSubtitle: {
    marginTop: 2,
    fontSize: 9.8,
    color: '#8A6E6D',
  },

  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },

  warningText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 17,
    color: BODY,
  },

  /* TIP */

  tip: {
    marginTop: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 13,
    backgroundColor: '#F5EBEF',
    borderWidth: 1,
    borderColor: '#EEDDE2',
  },

  tipCopy: {
    flex: 1,
    marginLeft: 10,
  },

  tipTitle: {
    fontSize: 13,
    color: INK,
    fontWeight: '800',
  },

  tipText: {
    marginTop: 4,
    fontSize: 11.2,
    lineHeight: 17,
    color: '#585057',
  },

  /* SUMMARY */

  summaryCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#F8F2F4',
    borderWidth: 1,
    borderColor: '#EBDDE2',
  },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 11,
  },

  summaryText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 17,
    color: BODY,
  },

  /* DISCLAIMER */

  disclaimer: {
    marginTop: 18,
    paddingHorizontal: 3,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },

  disclaimerText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 15,
    color: '#8A8190',
  },
});