import React, {useEffect, useMemo, useRef, useState} from 'react';
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

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

const ID = 'hormones-menopause-equilibre';

const HERO = require('../../assets/images/library/rules-hero.png');

/* -------------------------------------------------------------------------- */
/* DATA                                                                       */
/* -------------------------------------------------------------------------- */

const KEY_HORMONES = [
  {
    icon: 'flower-outline',
    title: 'Œstrogènes',
    text: 'Influencent le cycle, la peau, les os, le cœur et une partie de la régulation du sommeil et de l’humeur.',
  },
  {
    icon: 'moon-waning-crescent',
    title: 'Progestérone',
    text: 'Produite après l’ovulation, elle a un effet plutôt apaisant et prépare le corps à une éventuelle grossesse.',
  },
  {
    icon: 'radar',
    title: 'FSH et LH',
    text: 'Pilotées par le cerveau, elles stimulent les ovaires ; leurs niveaux évoluent quand ceux-ci répondent différemment.',
  },
] as const;

const ESTROGEN_SYMPTOMS = [
  'Bouffées de chaleur',
  'Sueurs nocturnes',
  'Sécheresse vaginale',
  'Modifications du cycle',
  'Sensibilité émotionnelle',
  'Changements du sommeil',
] as const;

const COMMON_SYMPTOMS = [
  'Cycles irréguliers',
  'Bouffées de chaleur',
  'Sueurs nocturnes',
  'Troubles du sommeil',
  'Changements d’humeur',
  'Fatigue',
  'Sécheresse vaginale',
  'Changements de la libido',
  'Difficultés de concentration',
] as const;

const TRACKING_ITEMS = [
  'Les dates de ton cycle',
  'Tes symptômes au fil des jours',
  'Ton sommeil',
  'Ton humeur',
  'Tes bouffées de chaleur',
  'Les changements de saignements',
  'Ce qui semble déclencher certains symptômes',
] as const;

const CONSULT_SITUATIONS = [
  'Des symptômes qui affectent significativement ton quotidien',
  'Des troubles du sommeil persistants',
  'Des bouffées de chaleur très gênantes',
  'Un symptôme nouveau ou inhabituel',
  'Des changements importants dans tes saignements',
  'Des questions sur les options de traitement',
  'Des préoccupations liées à la sécheresse vaginale ou à ta vie sexuelle',
] as const;

const SOLUTIONS = [
  {
    icon: 'walk',
    title: 'Mesures de mode de vie',
    text: 'Activité physique, alimentation, gestion du stress et du sommeil.',
  },
  {
    icon: 'leaf',
    title: 'Traitements non hormonaux',
    text: 'Certaines options peuvent cibler des symptômes précis, selon la situation.',
  },
  {
    icon: 'pill',
    title: 'Traitements hormonaux',
    text: 'Discutés avec un médecin lorsque cela correspond à ton profil et à tes besoins.',
  },
] as const;

const SUMMARY_POINTS = [
  'Les changements hormonaux font partie intégrante de la transition ménopausique.',
  'Les taux d’hormones peuvent fluctuer fortement pendant la périménopause, sans baisse parfaitement linéaire.',
  'Les symptômes varient beaucoup d’une personne à l’autre, et d’un mois à l’autre.',
  'Observer tes symptômes peut t’aider à mieux repérer tes propres tendances.',
  'Un professionnel de santé peut t’accompagner si les symptômes deviennent difficiles à gérer.',
] as const;

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

/* -------------------------------------------------------------------------- */
/* SCREEN                                                                     */
/* -------------------------------------------------------------------------- */

export default function MenopauseHormonesArticleScreen({
  navigation,
}: Props): React.JSX.Element {
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

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Les hormones pendant la ménopause — AWA',
      });
    } catch {
      // Partage annulé ou indisponible.
    }
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
        {/* ==================================================================== */}
        {/* HERO                                                                 */}
        {/* ==================================================================== */}

        <View style={styles.heroWrap}>
          <Image source={HERO} resizeMode="cover" style={styles.hero} />

          <View
            style={[
              styles.top,
              {paddingTop: getTopPadding(insets.top, true)},
            ]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retour"
              hitSlop={8}
              onPress={() => navigation.goBack()}
              style={({pressed}) => [styles.circle, pressed && styles.pressed]}>
              <MaterialDesignIcons name="chevron-left" size={23} color={theme.colors.text} />
            </Pressable>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  saved ? 'Retirer des favoris' : 'Ajouter aux favoris'
                }
                hitSlop={8}
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
                accessibilityLabel="Partager"
                hitSlop={8}
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

        {/* ==================================================================== */}
        {/* ARTICLE                                                             */}
        {/* ==================================================================== */}

        <View style={styles.article}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              PÉRIMÉNOPAUSE & MÉNOPAUSE • HORMONES
            </Text>
          </View>

          <Text style={styles.title}>
            Les hormones{`\n`}pendant la ménopause
          </Text>

          <View style={styles.metas}>
            {[
              ['clock-outline', '10 min de lecture'],
              ['book-open-page-variant-outline', 'Article'],
              ['chart-bar', 'Intermédiaire'],
              ['shield-check-outline', 'Contenu validé'],
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

          <Text style={styles.intro}>
            À l’approche de la ménopause, tes hormones ne s’arrêtent pas
            brutalement : elles fluctuent, ce qui explique à la fois les
            changements de cycle et la diversité des symptômes possibles.
          </Text>

          {/* -------------------------------------------------------------- */}
          {/* CONTENTS                                                        */}
          {/* -------------------------------------------------------------- */}

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>Dans cet article</Text>

            {[
              'Les principales hormones concernées',
              'Que se passe-t-il pendant la périménopause ?',
              'Quand les œstrogènes fluctuent',
              'Le rôle de la progestérone',
              'Pourquoi les symptômes peuvent varier',
              'Les symptômes les plus fréquents',
              'Hormones et sommeil',
              'Hormones et humeur',
              'Peut-on mesurer les hormones ?',
              'Comment mieux observer les changements',
              'Quand consulter un professionnel ?',
              'Quelles solutions peuvent être proposées ?',
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
                  color={theme.colors.primary}
                />
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* SECTION 1                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>1. Les principales hormones concernées</Text>

          <Text style={styles.body}>
            Trois grandes hormones évoluent pendant cette transition, chacune
            avec un rôle différent :
          </Text>

          <View style={styles.normalGrid}>
            {KEY_HORMONES.map(item => (
              <View key={item.title} style={styles.normalCard}>
                <View style={styles.normalIcon}>
                  <MaterialDesignIcons
                    name={item.icon as never}
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.normalTitle}>{item.title}</Text>
                <Text style={styles.normalText}>{item.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.infoCard}>
            <MaterialDesignIcons
              name="information-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>À noter</Text>
              <Text style={styles.infoText}>
                Les taux d’hormones ne diminuent pas de façon parfaitement
                linéaire pendant la périménopause : ils peuvent fluctuer,
                monter et descendre, avant de se stabiliser à un niveau plus
                bas après la ménopause.
              </Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SECTION 2                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>
            2. Que se passe-t-il pendant la périménopause ?
          </Text>

          <Text style={styles.body}>
            Les ovaires répondent progressivement de façon moins régulière
            aux signaux hormonaux envoyés par le cerveau. C’est ce qui rend
            les cycles irréguliers et explique pourquoi les symptômes peuvent
            changer d’un mois à l’autre.
          </Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Bon à savoir</Text>
              <Text style={styles.tipText}>
                Il est tout à fait possible d’avoir des symptômes marqués un
                mois, puis presque aucun le mois suivant. Ce n’est pas
                anormal : cela reflète simplement les fluctuations
                hormonales de cette période.
              </Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SECTION 3                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>3. Quand les œstrogènes fluctuent</Text>

          <Text style={styles.body}>
            Les variations d’œstrogènes peuvent être associées à plusieurs
            changements :
          </Text>

          <View style={styles.checkList}>
            {ESTROGEN_SYMPTOMS.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="checkbox-blank-circle-outline"
                  size={14}
                  color={theme.colors.primary}
                />

                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.body}>
            Ces symptômes peuvent avoir plusieurs causes : ils ne sont pas
            systématiquement liés aux hormones, et leur intensité varie
            beaucoup d’une personne à l’autre.
          </Text>

          {/* ================================================================= */}
          {/* SECTION 4                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>4. Le rôle de la progestérone</Text>

          <Text style={styles.body}>
            La progestérone n’est produite qu’après l’ovulation. Or, pendant
            la périménopause, l’ovulation elle-même devient plus irrégulière
            — ce qui rend sa production moins prévisible.
          </Text>

          <Text style={styles.body}>
            Cette irrégularité explique en partie les changements observés
            dans le cycle : durée variable, règles parfois plus ou moins
            abondantes qu’avant.
          </Text>

          {/* ================================================================= */}
          {/* SECTION 5                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>5. Pourquoi les symptômes peuvent varier</Text>

          <Text style={styles.body}>
            Au-delà des fluctuations hormonales, plusieurs facteurs
            s’ajoutent : la qualité du sommeil, le niveau de stress, le mode
            de vie, et les différences propres à chaque personne.
          </Text>

          <View style={styles.highlight}>
            <Text style={styles.highlightText}>
              « Chaque femme vit la transition différemment. »
            </Text>
          </View>

          {/* ================================================================= */}
          {/* SECTION 6                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>6. Les symptômes les plus fréquents</Text>

          <View style={styles.checkList}>
            {COMMON_SYMPTOMS.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="checkbox-blank-circle-outline"
                  size={14}
                  color={theme.colors.primary}
                />

                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.caption}>
            Cette liste est informative : elle ne constitue pas un
            diagnostic. Chaque personne vit une combinaison différente de
            ces changements.
          </Text>

          {/* ================================================================= */}
          {/* SECTION 7                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>7. Hormones et sommeil</Text>

          <Text style={styles.body}>
            Les sueurs nocturnes peuvent interrompre le sommeil, ce qui
            entraîne fatigue et difficultés de concentration le lendemain —
            un enchaînement fréquent pendant cette période.
          </Text>

          <View style={styles.infoCard}>
            <MaterialDesignIcons
              name="weather-night"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>Astuce pratique</Text>
              <Text style={styles.infoText}>
                Une chambre fraîche, des vêtements légers et une routine de
                coucher stable peuvent aider à limiter ces réveils.
              </Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SECTION 8                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>8. Hormones et humeur</Text>

          <Text style={styles.body}>
            Les fluctuations hormonales peuvent coïncider avec des
            changements d’humeur, sans en être la seule explication : le
            sommeil, le stress, les changements de vie et les symptômes
            physiques jouent aussi un rôle.
          </Text>

          <View style={styles.infoCard}>
            <MaterialDesignIcons
              name="heart-outline"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>Pour te rassurer</Text>
              <Text style={styles.infoText}>
                Se sentir plus émotive pendant cette période ne veut pas
                dire qu’il y a un problème : c’est une expérience courante,
                qui peut avoir plusieurs origines à la fois.
              </Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SECTION 9                                                         */}
          {/* ================================================================= */}

          <Text style={styles.h2}>9. Peut-on mesurer les hormones ?</Text>

          <Text style={styles.body}>
            Les taux d’hormones peuvent varier considérablement d’un jour à
            l’autre pendant la périménopause. Un dosage isolé ne donne donc
            pas toujours une image complète de la situation.
          </Text>

          <View style={styles.infoCard}>
            <MaterialDesignIcons
              name="test-tube"
              size={23}
              color={theme.colors.primary}
            />

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>À garder en tête</Text>
              <Text style={styles.infoText}>
                L’évaluation médicale dépend surtout de ton âge, de tes
                symptômes et de ton historique de cycles — pas uniquement
                d’un chiffre isolé.
              </Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SECTION 10                                                        */}
          {/* ================================================================= */}

          <Text style={styles.h2}>10. Comment mieux observer les changements</Text>

          <Text style={styles.body}>
            Noter ce que tu vis mois après mois t’aide à repérer tes propres
            tendances plutôt qu’à te comparer :
          </Text>

          <View style={styles.comfortCard}>
            {TRACKING_ITEMS.map((item, index) => (
              <View
                key={item}
                style={[
                  styles.trackingRow,
                  index < TRACKING_ITEMS.length - 1 &&
                    styles.comfortRowBorder,
                ]}>
                <MaterialDesignIcons
                  name="pencil-outline"
                  size={16}
                  color={theme.colors.primary}
                />

                <Text style={styles.trackingText}>{item}</Text>
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
              <Text style={styles.tipTitle}>Petit réflexe utile</Text>
              <Text style={styles.tipText}>
                Le suivi de ton cycle dans AWA peut t’aider à repérer tes
                propres tendances au fil des mois, sans effort particulier.
              </Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SECTION 11                                                        */}
          {/* ================================================================= */}

          <Text style={styles.h2}>11. Quand consulter un professionnel ?</Text>

          <Text style={styles.body}>
            La plupart de ces situations relèvent d’une consultation de
            routine, à ton rythme :
          </Text>

          <View style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <MaterialDesignIcons
                name="calendar-account-outline"
                size={22}
                color={theme.colors.primary}
              />

              <Text style={[styles.warningTitle, styles.warningTitleNeutral]}>
                Bon à évoquer avec un professionnel
              </Text>
            </View>

            {CONSULT_SITUATIONS.map(item => (
              <View key={item} style={styles.warningRow}>
                <View style={styles.warningBullet}>
                  <MaterialDesignIcons
                    name="check"
                    size={16}
                    color={theme.colors.success}
                  />
                </View>

                <Text style={styles.warningText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.infoCard}>
            <MaterialDesignIcons
              name="alert-circle-outline"
              size={23}
              color={theme.colors.warning}
            />

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>Un cas à part</Text>
              <Text style={styles.infoText}>
                Des saignements très abondants ou inhabituels méritent, eux,
                d’être signalés plus rapidement à un professionnel de santé.
              </Text>
            </View>
          </View>

          {/* ================================================================= */}
          {/* SECTION 12                                                        */}
          {/* ================================================================= */}

          <Text style={styles.h2}>
            12. Quelles solutions peuvent être proposées ?
          </Text>

          <Text style={styles.body}>
            Selon la situation, un professionnel peut évoquer différentes
            pistes :
          </Text>

          <View style={styles.normalGrid}>
            {SOLUTIONS.map(item => (
              <View key={item.title} style={styles.normalCard}>
                <View style={styles.normalIcon}>
                  <MaterialDesignIcons
                    name={item.icon as never}
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.normalTitle}>{item.title}</Text>
                <Text style={styles.normalText}>{item.text}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.caption}>
            Ces décisions restent individualisées : elles dépendent de tes
            antécédents, de tes symptômes, des risques et de tes
            préférences personnelles.
          </Text>

          {/* ================================================================= */}
          {/* SUMMARY                                                           */}
          {/* ================================================================= */}

          <Text style={styles.h2}>13. À retenir</Text>

          <View style={styles.summaryCard}>
            {SUMMARY_POINTS.map(item => (
              <View key={item} style={styles.summaryRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <Text style={styles.summaryText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* ================================================================= */}
          {/* DISCLAIMER                                                        */}
          {/* ================================================================= */}

          <View style={styles.disclaimer}>
            <MaterialDesignIcons
              name="shield-outline"
              size={18}
              color={theme.colors.textMuted}
            />

            <Text style={styles.disclaimerText}>
              Contenu informatif. Cet article ne remplace pas un avis
              médical personnalisé. En cas de doute, demande conseil à un
              professionnel de santé.
            </Text>
          </View>
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={10} scrollRef={scrollRef} />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* STYLES                                                                     */
/* -------------------------------------------------------------------------- */

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  screen: {flex: 1, backgroundColor: theme.colors.background},
  scroll: {paddingBottom: 30},

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
  pressed: {opacity: 0.74},

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
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  title: {
    marginTop: 12,
    fontFamily: 'serif',
    fontSize: 27,
    lineHeight: 32,
    color: theme.colors.text,
    fontWeight: '700',
  },

  metas: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  metaItem: {flexDirection: 'row', alignItems: 'center', gap: 5},
  metaDivider: {width: 1, height: 20, backgroundColor: theme.colors.border},
  meta: {fontSize: 9.5, color: theme.colors.textMuted},

  intro: {
    marginTop: 17,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },

  contents: {
    marginTop: 20,
    padding: 15,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  contentsTitle: {marginBottom: 7, fontSize: 15, color: theme.colors.text, fontWeight: '800'},
  contentRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contentLeft: {flex: 1, flexDirection: 'row', alignItems: 'center'},
  contentNumber: {width: 25, color: theme.colors.primary, fontSize: 11.5, fontWeight: '800'},
  contentText: {flex: 1, fontSize: 12.3, lineHeight: 17, color: theme.colors.text},

  h2: {
    marginTop: 27,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: theme.colors.text,
    fontWeight: '700',
  },
  body: {marginTop: 9, fontSize: 14, lineHeight: 21.5, color: theme.colors.textSecondary},
  caption: {marginTop: 10, fontSize: 11, lineHeight: 16, color: theme.colors.textMuted, fontStyle: 'italic'},

  infoCard: {
    marginTop: 14,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoCopy: {flex: 1, marginLeft: 9},
  infoTitle: {fontSize: 12.5, color: theme.colors.text, fontWeight: '800'},
  infoText: {marginTop: 3, fontSize: 11.5, lineHeight: 17, color: theme.colors.textSecondary},

  normalGrid: {marginTop: 13, gap: 9},
  normalCard: {
    padding: 13,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  normalIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  normalTitle: {marginTop: 8, fontSize: 12.5, color: theme.colors.text, fontWeight: '800'},
  normalText: {marginTop: 4, fontSize: 11, lineHeight: 16, color: theme.colors.textSecondary},

  checkList: {
    marginTop: 13,
    padding: 13,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  checkRow: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 6,
    paddingRight: 6,
  },
  checkText: {flex: 1, color: theme.colors.textSecondary, fontSize: 12, lineHeight: 16},

  highlight: {
    marginTop: 15,
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderRadius: 15,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  highlightText: {
    fontFamily: 'serif',
    fontSize: 16,
    lineHeight: 23,
    color: theme.colors.text,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  comfortCard: {
    marginTop: 13,
    paddingHorizontal: 13,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  comfortRowBorder: {borderBottomWidth: 1, borderBottomColor: theme.colors.border},
  trackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 12,
  },
  trackingText: {flex: 1, fontSize: 12.5, lineHeight: 17, color: theme.colors.textSecondary},

  warningCard: {
    marginTop: 13,
    padding: 14,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  warningHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 12},
  warningTitle: {flex: 1, marginLeft: 8, fontSize: 12.5, color: theme.colors.textSecondary, fontWeight: '800'},
  warningTitleNeutral: {color: theme.colors.text},
  warningRow: {flexDirection: 'row', alignItems: 'flex-start', marginBottom: 9},
  warningBullet: {width: 20, alignItems: 'flex-start'},
  warningText: {flex: 1, marginLeft: 5, color: theme.colors.textSecondary, fontSize: 11.5, lineHeight: 17},

  tip: {
    marginTop: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tipCopy: {flex: 1, marginLeft: 11},
  tipTitle: {fontSize: 13, color: theme.colors.text, fontWeight: '800'},
  tipText: {marginTop: 4, fontSize: 11.5, lineHeight: 17, color: theme.colors.textSecondary},

  summaryCard: {
    marginTop: 13,
    padding: 14,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  summaryRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10},
  summaryText: {flex: 1, fontSize: 11.5, lineHeight: 17, color: theme.colors.textSecondary},

  disclaimer: {
    marginTop: 18,
    paddingHorizontal: 3,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },
  disclaimerText: {flex: 1, fontSize: 10, lineHeight: 15, color: theme.colors.textMuted},
  });
}
