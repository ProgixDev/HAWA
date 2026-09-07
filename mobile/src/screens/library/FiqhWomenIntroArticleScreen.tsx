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

const ID = 'fiqhwomen-introduction';

const HERO = require('../../assets/images/library/rules-hero.png');

const ART = {
  importance: require('../../assets/images/library/cycle-phases-hero.png'),
  madhahib: require('../../assets/images/library/popular-phases.png'),
  consult: require('../../assets/images/library/spm-consult.png'),
  awaRole: require('../../assets/images/library/featured-tracking-hero.png'),
};

const RELIGIOUS_DISCLAIMER =
  'Ce contenu est purement éducatif. Les questions religieuses doivent être validées par des savants qualifiés. AWA ne délivre pas de fatwas ni de décisions religieuses personnalisées.';

const TOPICS = [
  ['calendar-month-outline', 'Les règles et le cycle menstruel'],
  ['water-outline', 'Le sang menstruel et son statut'],
  ['shield-check-outline', 'La pureté rituelle'],
  ['shower', 'Le ghusl après les règles'],
  ['mosque', 'La prière pendant et après les règles'],
  ['moon-waning-crescent', 'Le jeûne du Ramadan et les jours à rattraper'],
  ['help-circle-outline', 'Les saignements particuliers (istihâda)'],
  ['baby-face-outline', 'Le nifas après l’accouchement'],
  ['account-heart-outline', 'La vie quotidienne et la pratique religieuse'],
] as const;

const AWA_ROLE = [
  'Comprendre les notions de base du fiqh féminin',
  'Mieux appréhender son cycle, d’un point de vue médical et religieux',
  'Identifier les questions qui nécessitent l’avis d’un savant qualifié',
  'Se repérer entre les différences de madhahib sans confusion',
  'Accéder à des explications éducatives claires et neutres',
  'Distinguer une information médicale d’une décision religieuse',
  'Suivre les informations utiles à sa pratique religieuse, si besoin',
  'Préparer des questions précises à poser à un savant qualifié',
];

const WHEN_TO_ASK = [
  'Une situation personnelle ne correspond à aucun cas classique (saignement inhabituel, doute prolongé...)',
  'Plusieurs avis semblent se contredire et tu ne sais pas lequel suivre',
  'Une décision religieuse a un impact important sur ta pratique quotidienne',
  'Tu ressens le besoin d’un accompagnement adapté à ta situation personnelle',
];

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function FiqhWomenIntroArticleScreen({
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

  const handleShare = () => {
    Share.share({
      message: 'Le fiqh féminin, une introduction — AWA',
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
              accessibilityLabel="Retour"
              onPress={() => navigation.goBack()}
              style={({pressed}) => [styles.circle, pressed && styles.pressed]}>
              <MaterialDesignIcons name="chevron-left" size={23} color={theme.colors.text} />
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
                  color={theme.colors.primary}
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
                  color={theme.colors.primary}
                />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.article}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>FIQH FÉMININ</Text>
          </View>

          <Text style={styles.title}>
            Le fiqh féminin,{`\n`}une introduction
          </Text>

          <View style={styles.metas}>
            {[
              ['clock-outline', '7 min de lecture'],
              ['book-open-page-variant-outline', 'Guide'],
              ['chart-bar', 'Débutant'],
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
            Un aperçu complet des grands sujets abordés dans le fiqh
            féminin, entre pratique religieuse et vie quotidienne.
          </Text>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="information-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Information importante</Text>
              <Text style={styles.tipText}>{RELIGIOUS_DISCLAIMER}</Text>
            </View>
          </View>

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>Dans cet article</Text>

            {[
              'Ce que couvre le fiqh féminin',
              'Pourquoi le fiqh féminin est-il important ?',
              'Les écoles juridiques (madhab)',
              'Fiqh, santé et pratique quotidienne',
              'Le rôle éducatif d’AWA',
              'Quand demander conseil à une personne qualifiée ?',
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

          <Text style={styles.h2}>1. Ce que couvre le fiqh féminin</Text>

          <Text style={styles.body}>
            Le fiqh féminin est le champ de la jurisprudence islamique (fiqh)
            qui s’intéresse aux questions pratiques liées au corps et au
            culte des femmes. Il aide à comprendre comment concilier la vie
            religieuse quotidienne avec les différentes étapes du cycle
            féminin.
          </Text>

          <View style={styles.daily}>
            {TOPICS.map(([icon, label]) => (
              <View key={label} style={styles.dailyItem}>
                <MaterialDesignIcons
                  name={icon as never}
                  color={theme.colors.primary}
                  size={25}
                />

                <Text style={styles.dailyText}>{label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.body}>
            Le fiqh est un champ d’interprétation juridique : certaines
            questions font l’objet d’avis différents selon les savants et
            les écoles de pensée, sans qu’un avis soit à lui seul absolu.
          </Text>

          <Text style={styles.h2}>
            2. Pourquoi le fiqh féminin est-il important ?
          </Text>

          <Text style={styles.body}>
            Comprendre le fiqh féminin permet de vivre sa pratique religieuse
            avec plus de sérénité, sans confusion, aux moments où le corps
            traverse des étapes spécifiques (règles, grossesse, post-partum,
            ménopause). Cela aide aussi à distinguer ce qui relève d’une
            obligation, d’une dispense ou d’une simple recommandation.
          </Text>

          <View style={styles.visualCard}>
            <Image
              source={ART.importance}
              resizeMode="cover"
              style={styles.visualImage}
            />

            <View style={styles.visualCopy}>
              <Text style={styles.visualTitle}>
                Une pratique religieuse apaisée
              </Text>

              <Text style={styles.visualText}>
                Savoir ce qui est attendu à chaque étape du cycle permet
                d’aborder sa foi avec plus de confiance.
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>3. Les écoles juridiques (madhab)</Text>

          <Text style={styles.body}>
            Un madhab désigne une école de pensée juridique, c’est-à-dire
            une méthode structurée que des savants utilisent pour
            interpréter les sources religieuses (Coran, Sunna, consensus,
            raisonnement) et répondre aux questions pratiques de la vie
            quotidienne. Plusieurs écoles existent, car les savants n’ont
            pas toujours suivi la même méthodologie ni interprété les mêmes
            textes de la même manière.
          </Text>

          <Image
            source={ART.madhahib}
            resizeMode="cover"
            style={styles.wideImage}
          />

          <Text style={styles.body}>
            C’est pourquoi certaines questions liées aux règles, à la
            pureté rituelle, à la prière ou au jeûne peuvent faire l’objet
            d’avis différents selon les savants consultés. Une divergence
            d’opinion ne signifie pas qu’un avis serait « faux » : elle
            reflète des méthodologies et des lectures différentes des
            mêmes sources.
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
                Il est courant de suivre l’approche ou le madhab
                traditionnellement suivi dans sa famille ou sa communauté.
              </Text>
            </View>
          </View>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>À noter</Text>
              <Text style={styles.tipText}>
                Lorsqu’une situation religieuse précise reste incertaine,
                il est tout à fait approprié de demander l’avis d’un savant
                ou d’une savante qualifiée.
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>
            4. Fiqh, santé et pratique quotidienne
          </Text>

          <Text style={styles.body}>
            Les informations médicales sur le cycle (durée, symptômes,
            phases hormonales) et les règles religieuses qui en découlent
            (pureté, prière, jeûne) répondent à deux logiques différentes :
            l’une décrit un phénomène biologique, l’autre définit un cadre
            de pratique spirituelle. Les deux peuvent se compléter, mais ne
            doivent pas être confondues.
          </Text>

          <View style={styles.visualCard}>
            <Image
              source={ART.consult}
              resizeMode="cover"
              style={styles.visualImage}
            />

            <View style={styles.visualCopy}>
              <Text style={styles.visualTitle}>
                Deux regards complémentaires
              </Text>

              <Text style={styles.visualText}>
                Le suivi médical du cycle et les repères religieux qui en
                découlent apportent chacun un éclairage utile.
              </Text>
            </View>
          </View>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Bon à savoir</Text>
              <Text style={styles.tipText}>
                Un professionnel de santé peut répondre aux questions
                médicales ; un savant qualifié reste la référence pour les
                questions religieuses.
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>5. Le rôle éducatif d’AWA</Text>

          <Text style={styles.body}>
            AWA accompagne les utilisatrices dans la compréhension de leur
            cycle, à la croisée de la santé et de la pratique religieuse,
            avec une approche pédagogique et respectueuse des différences
            entre écoles.
          </Text>

          <Image
            source={ART.awaRole}
            resizeMode="cover"
            style={styles.wideImage}
          />

          <View style={styles.checkList}>
            {AWA_ROLE.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-circle-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Information importante</Text>
              <Text style={styles.tipText}>
                AWA est un outil éducatif et informatif : elle ne remplace
                en aucun cas l’avis d’un savant ou d’une autorité religieuse
                qualifiée.
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>
            6. Quand demander conseil à une personne qualifiée ?
          </Text>

          <Text style={styles.body}>
            Certaines situations méritent d’être posées directement à un
            savant ou une savante de confiance, notamment lorsque :
          </Text>

          <View style={styles.checkList}>
            {WHEN_TO_ASK.map(item => (
              <View key={item} style={styles.checkRow}>
                <MaterialDesignIcons
                  name="check-circle-outline"
                  size={18}
                  color={theme.colors.success}
                />

                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.h2}>7. À retenir</Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Bon à savoir</Text>
              <Text style={styles.tipText}>
                Le fiqh féminin est un champ vivant d’interprétation, avec
                des avis parfois différents selon les écoles. AWA t’aide à
                comprendre les bases et à structurer tes questions, mais
                l’avis d’un savant qualifié reste la référence pour toute
                décision religieuse personnelle.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={7} scrollRef={scrollRef} />
    </View>
  );
}

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
  badgeText: {fontSize: 11, color: theme.colors.primary, fontWeight: '800'},
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
  metaItem: {flexDirection: 'row', alignItems: 'center', gap: 5},
  metaDivider: {width: 1, height: 20, backgroundColor: theme.colors.border},
  meta: {fontSize: 10, color: theme.colors.textMuted},
  intro: {
    marginTop: 17,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.text,
    fontWeight: '500',
  },
  alert: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },
  contents: {
    marginTop: 19,
    padding: 15,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  contentsTitle: {marginBottom: 7, fontSize: 15, color: theme.colors.text, fontWeight: '800'},
  contentRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contentLeft: {flex: 1, flexDirection: 'row', alignItems: 'center'},
  contentNumber: {width: 24, color: theme.colors.primary, fontSize: 12, fontWeight: '800'},
  contentText: {flex: 1, fontSize: 12.5, lineHeight: 17, color: theme.colors.text},
  h2: {
    marginTop: 24,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 27,
    color: theme.colors.text,
    fontWeight: '700',
  },
  body: {marginTop: 8, fontSize: 14, lineHeight: 21, color: theme.colors.textSecondary},
  visualCard: {
    marginTop: 15,
    minHeight: 98,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  visualImage: {width: 72, height: 72, borderRadius: 12},
  visualCopy: {flex: 1, marginLeft: 12},
  visualTitle: {color: theme.colors.text, fontSize: 13, lineHeight: 17, fontWeight: '800'},
  visualText: {marginTop: 4, color: theme.colors.textMuted, fontSize: 11, lineHeight: 16},
  wideImage: {width: '100%', height: 120, marginTop: 14, borderRadius: 12},
  daily: {marginTop: 13, flexDirection: 'row', flexWrap: 'wrap', gap: 8},
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
  checkList: {
    marginTop: 13,
    padding: 13,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 9,
  },
  checkText: {flex: 1, color: theme.colors.textSecondary, fontSize: 12, lineHeight: 17},
  tip: {
    marginTop: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.08),
  },
  tipCopy: {flex: 1, marginLeft: 11},
  tipTitle: {fontSize: 13, color: theme.colors.text, fontWeight: '800'},
  tipText: {marginTop: 3, fontSize: 11.5, lineHeight: 17, color: theme.colors.textMuted},
  });
}
