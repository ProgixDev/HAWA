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

const ID = 'pcos-peau-pilosite-symptomes';

const HERO = require('../../assets/images/library/cycle-phases-hero.png');

const CARE_HABITS = [
  ['face-woman-outline', 'Une routine de peau douce et régulière'],
  ['weather-sunny', 'Une protection solaire quotidienne'],
  ['bowl-mix-outline', 'Une alimentation équilibrée'],
  ['account-heart-outline', 'De la patience : les résultats prennent du temps'],
] as const;

const SKIN_SIGNS = [
  'Une acné persistante, notamment sur le bas du visage',
  'Une peau plus grasse qu’auparavant',
  'Des poussées d’acné qui suivent parfois les variations hormonales',
  'Des marques ou cicatrices laissées après les poussées',
];

const HAIR_SIGNS = [
  'Une pilosité plus visible sur le visage',
  'Des poils plus épais au niveau du menton ou de la lèvre supérieure',
  'Une pilosité pouvant apparaître sur la poitrine, le ventre ou le dos',
  'Un amincissement progressif des cheveux au niveau du sommet du crâne',
];

const PRACTICAL_TIPS = [
  'Choisir des produits non agressifs et éviter de multiplier les soins irritants',
  'Nettoyer la peau sans la décaper, matin et soir si nécessaire',
  'Utiliser une protection solaire lorsque la peau est exposée',
  'Éviter de percer les boutons afin de limiter les marques et cicatrices',
  'Demander conseil à un professionnel si les symptômes persistent ou s’aggravent',
];

const IDEAS_RECEIVED = [
  'Avoir de l’acné ne signifie pas automatiquement avoir un SOPK',
  'Une pilosité visible n’est pas forcément liée uniquement aux hormones',
  'Le SOPK peut concerner des femmes de toutes corpulences',
  'Les symptômes peuvent évoluer avec le temps et ne sont pas identiques chez toutes les femmes',
];

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function PcosSkinHairArticleScreen({
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
      message: 'Peau, pilosité et symptômes visibles du SOPK — AWA',
    });
  };

  const contents = [
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
  ];

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
              <MaterialDesignIcons
                name="chevron-left"
                size={23}
                color={theme.colors.text}
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
            <Text style={styles.badgeText}>SOPK</Text>
          </View>

          <Text style={styles.title}>
            Peau, pilosité et{`\n`}symptômes visibles
          </Text>

          <View style={styles.metas}>
            {[
              ['clock-outline', '9 min de lecture'],
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
            Le SOPK peut se manifester par des changements visibles de la
            peau, de la pilosité ou des cheveux. Comprendre leur origine
            permet de mieux les identifier et de savoir quelles solutions
            peuvent être envisagées.
          </Text>

          <View style={styles.infoBanner}>
            <MaterialDesignIcons
              name="information-outline"
              size={21}
              color={theme.colors.primary}
            />

            <Text style={styles.infoBannerText}>
              Ces manifestations sont fréquentes, mais elles ne sont ni
              obligatoires ni suffisantes à elles seules pour diagnostiquer
              un SOPK.
            </Text>
          </View>

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>Dans cet article</Text>

            {contents.map((item, index) => (
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

          <Text style={styles.h2}>
            1. Pourquoi ces symptômes apparaissent
          </Text>

          <Text style={styles.body}>
            Le SOPK peut s’accompagner d’une production ou d’une activité
            accrue des androgènes, des hormones également présentes
            naturellement chez la femme. Lorsque leur effet est plus marqué,
            elles peuvent influencer les glandes sébacées, les follicules
            pileux et le cycle de croissance des cheveux.
          </Text>

          <Text style={styles.body}>
            C’est notamment cette influence hormonale qui peut expliquer
            l’apparition d’une acné persistante, d’une pilosité plus
            importante ou, chez certaines femmes, d’un amincissement des
            cheveux.
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
                Les symptômes visibles ne reflètent pas forcément la gravité
                du SOPK. Une femme peut avoir plusieurs manifestations
                visibles, tandis qu’une autre peut présenter peu ou pas de
                symptômes cutanés.
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>2. L’acné hormonale</Text>

          <Text style={styles.body}>
            L’acné associée aux variations hormonales peut apparaître ou
            persister après l’adolescence. Elle peut notamment concerner le
            menton, la mâchoire, le bas des joues ou parfois le cou.
          </Text>

          <Text style={styles.body}>
            Chez certaines personnes, les lésions sont profondes, sensibles
            et récurrentes. Elles peuvent également laisser des marques
            pigmentées ou des cicatrices lorsqu’elles sont manipulées ou
            lorsqu’elles sont particulièrement inflammatoires.
          </Text>

          <View style={styles.sectionCard}>
            <Text style={styles.cardTitle}>Signes cutanés possibles</Text>

            {SKIN_SIGNS.map(item => (
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

          <Text style={styles.h2}>3. La pilosité excessive</Text>

          <Text style={styles.body}>
            L’hirsutisme correspond à une pilosité terminale plus importante
            dans certaines zones habituellement moins concernées chez la
            femme. Dans le contexte du SOPK, il peut être lié à l’action des
            androgènes sur les follicules pileux.
          </Text>

          <Text style={styles.body}>
            Les zones fréquemment concernées sont le menton, la lèvre
            supérieure, la poitrine, le ventre ou le dos. L’importance de la
            pilosité varie considérablement d’une personne à l’autre.
          </Text>

          <View style={styles.sectionCard}>
            <Text style={styles.cardTitle}>Manifestations possibles</Text>

            {HAIR_SIGNS.map(item => (
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
              <Text style={styles.tipTitle}>Bon à savoir</Text>
              <Text style={styles.tipText}>
                La pilosité dépend aussi de facteurs génétiques et
                individuels. Une pilosité importante ne signifie donc pas
                automatiquement qu’un SOPK est présent.
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>4. Le dégarnissement capillaire</Text>

          <Text style={styles.body}>
            Certaines femmes présentant un SOPK remarquent également une
            diminution de la densité des cheveux. L’amincissement peut être
            particulièrement visible au niveau du sommet du crâne ou de la
            ligne centrale.
          </Text>

          <Text style={styles.body}>
            Cette manifestation peut être progressive. Il est important de
            distinguer une chute de cheveux liée aux hormones d’autres causes
            possibles, comme une carence, un problème thyroïdien, certains
            médicaments ou une période de stress important.
          </Text>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>À noter</Text>
              <Text style={styles.tipText}>
                Une chute de cheveux importante, rapide ou inhabituelle mérite
                une évaluation médicale afin d’en rechercher la cause.
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>5. Prendre soin de sa peau</Text>

          <Text style={styles.body}>
            Une routine simple et régulière est généralement préférable à
            l’accumulation de nombreux produits. L’objectif est de nettoyer,
            hydrater et protéger la peau tout en limitant les agressions qui
            peuvent entretenir l’irritation.
          </Text>

          <View style={styles.daily}>
            {CARE_HABITS.map(([icon, label]) => (
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

          <Text style={styles.h2}>6. Prendre soin de ses cheveux</Text>

          <Text style={styles.body}>
            Lorsque les cheveux deviennent plus fins, il peut être utile de
            limiter les agressions répétées : chaleur excessive, coiffures
            très serrées ou traitements chimiques fréquents.
          </Text>

          <Text style={styles.body}>
            Une consultation dermatologique peut être intéressante si la
            perte de densité progresse, afin de déterminer la cause et de
            discuter des traitements disponibles.
          </Text>

          <View style={styles.practicalBox}>
            <View style={styles.practicalHeader}>
              <MaterialDesignIcons
                name="heart-outline"
                size={22}
                color={theme.colors.primary}
              />

              <Text style={styles.practicalTitle}>Conseils pratiques</Text>
            </View>

            {PRACTICAL_TIPS.map((item, index) => (
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

          <Text style={styles.h2}>
            7. Ce qui peut aider au quotidien
          </Text>

          <Text style={styles.body}>
            La prise en charge dépend des symptômes, de leur intensité, de
            leur impact sur la qualité de vie et des objectifs de chaque
            femme. Il peut être utile d’agir sur plusieurs aspects plutôt que
            de chercher une seule solution.
          </Text>

          <View style={styles.twoColumn}>
            <View style={styles.miniCard}>
              <MaterialDesignIcons
                name="face-woman-outline"
                size={25}
                color={theme.colors.primary}
              />
              <Text style={styles.miniTitle}>Peau</Text>
              <Text style={styles.miniText}>
                Routine adaptée et avis dermatologique si nécessaire.
              </Text>
            </View>

            <View style={styles.miniCard}>
              <MaterialDesignIcons
                name="content-cut"
                size={25}
                color={theme.colors.primary}
              />
              <Text style={styles.miniTitle}>Pilosité</Text>
              <Text style={styles.miniText}>
                Solutions esthétiques ou médicales selon la situation.
              </Text>
            </View>

            <View style={styles.miniCard}>
              <MaterialDesignIcons
                name="hair-dryer-outline"
                size={25}
                color={theme.colors.primary}
              />
              <Text style={styles.miniTitle}>Cheveux</Text>
              <Text style={styles.miniText}>
                Identifier la cause avant de choisir un traitement.
              </Text>
            </View>

            <View style={styles.miniCard}>
              <MaterialDesignIcons
                name="account-heart-outline"
                size={25}
                color={theme.colors.primary}
              />
              <Text style={styles.miniTitle}>Bien-être</Text>
              <Text style={styles.miniText}>
                Prendre en compte l’impact émotionnel des symptômes.
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>8. Quand consulter</Text>

          <Text style={styles.body}>
            Il est conseillé d’en parler à un professionnel de santé lorsque
            l’acné devient persistante ou douloureuse, lorsque la pilosité
            augmente rapidement, lorsque les cheveux s’affinent de façon
            importante ou lorsque ces changements s’accompagnent de cycles
            très irréguliers.
          </Text>

          <Text style={styles.body}>
            Un dermatologue peut prendre en charge les manifestations de la
            peau et des cheveux. Un gynécologue ou un autre professionnel
            compétent peut également évaluer le contexte hormonal et les
            autres manifestations éventuelles du SOPK.
          </Text>

          <View style={styles.alert}>
            <MaterialDesignIcons
              name="medical-bag"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Consulte si nécessaire</Text>
              <Text style={styles.tipText}>
                Une apparition rapide et importante de pilosité, une chute de
                cheveux brutale ou des changements hormonaux inhabituels
                nécessitent un avis médical.
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>9. Idées reçues</Text>

          <View style={styles.mythList}>
            {IDEAS_RECEIVED.map(item => (
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

            <Text style={styles.quoteText}>
              Les symptômes visibles du SOPK peuvent être gênants, mais ils
              ne définissent pas ta féminité, ta valeur ou ton hygiène.
            </Text>
          </View>

          <Text style={styles.h2}>10. À retenir</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <MaterialDesignIcons
                name="check-decagram-outline"
                size={24}
                color={theme.colors.primary}
              />

              <Text style={styles.summaryTitle}>L’essentiel</Text>
            </View>

            <View style={styles.summaryRow}>
              <MaterialDesignIcons
                name="check"
                size={18}
                color={theme.colors.success}
              />
              <Text style={styles.summaryText}>
                Le SOPK peut influencer la peau, la pilosité et les cheveux.
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <MaterialDesignIcons
                name="check"
                size={18}
                color={theme.colors.success}
              />
              <Text style={styles.summaryText}>
                Les manifestations sont très variables d’une femme à l’autre.
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <MaterialDesignIcons
                name="check"
                size={18}
                color={theme.colors.success}
              />
              <Text style={styles.summaryText}>
                Un symptôme isolé ne suffit pas à diagnostiquer un SOPK.
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <MaterialDesignIcons
                name="check"
                size={18}
                color={theme.colors.success}
              />
              <Text style={styles.summaryText}>
                Des solutions existent pour améliorer les symptômes.
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <MaterialDesignIcons
                name="check"
                size={18}
                color={theme.colors.success}
              />
              <Text style={styles.summaryText}>
                Un accompagnement médical peut aider à choisir une prise en
                charge adaptée.
              </Text>
            </View>
          </View>

          <View style={styles.finalTip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={25}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>À retenir</Text>
              <Text style={styles.tipText}>
                L’acné, la pilosité ou la chute de cheveux peuvent être des
                manifestations du SOPK, mais elles ne sont pas une fatalité.
                Une prise en charge personnalisée peut permettre de mieux
                contrôler les symptômes et d’améliorer le confort au quotidien.
              </Text>
            </View>
          </View>

          <View style={styles.disclaimer}>
            <MaterialDesignIcons
              name="shield-check-outline"
              size={19}
              color={theme.colors.textMuted}
            />

            <Text style={styles.disclaimerText}>
              Cet article est informatif et ne remplace pas une consultation
              médicale, un diagnostic ou un traitement personnalisé.
            </Text>
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
