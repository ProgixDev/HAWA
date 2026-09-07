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

const ID = 'menstruationpurity-statut-de-purete';

const HERO = require('../../assets/images/library/spm-water.png');

const ART = {
  process: require('../../assets/images/library/rules-process.png'),
  ghusl: require('../../assets/images/library/tip-water.png'),
};

const RELIGIOUS_DISCLAIMER =
  'Ce contenu est purement éducatif. Les questions religieuses doivent être validées par des savants qualifiés. AWA ne délivre pas de fatwas ni de décisions religieuses personnalisées.';

const DURING_PERIOD = [
  'Le dhikr (évocation de Dieu) et les invocations (du’a)',
  'L’écoute ou la lecture de contenus éducatifs et spirituels',
  'Le soutien à la pratique religieuse de ses proches',
  'La réflexion et l’apprentissage religieux',
];

const DOUBT_MARKERS = [
  'Observer l’absence totale de saignement, et non une simple diminution',
  'Laisser passer un temps suffisant avant de conclure à la fin des règles',
  'Se baser sur une observation claire plutôt que sur une simple impression',
  'Tenir compte de ton propre rythme habituel, qui peut varier d’un cycle à l’autre',
];

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function MenstruationPurityArticleScreen({
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
      message: 'Statut de pureté : les bases — AWA',
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
            <Text style={styles.badgeText}>RÈGLES & PURETÉ</Text>
          </View>

          <Text style={styles.title}>
            Statut de pureté :{`\n`}les bases
          </Text>

          <View style={styles.metas}>
            {[
              ['clock-outline', '6 min de lecture'],
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
            Comprendre le lien entre le cycle et l’état de pureté rituelle,
            pour aborder cette période avec plus de clarté.
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
              'Comprendre ce que signifie la pureté rituelle',
              'Règles et dispense d’adoration',
              'Après les règles : reconnaître le retour à la pureté',
              'Le ghusl : comprendre son rôle',
              'Que faire lorsqu’on n’est pas sûre ?',
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

          <Text style={styles.h2}>
            1. Comprendre ce que signifie la pureté rituelle
          </Text>

          <Text style={styles.body}>
            Dans la tradition islamique, la pureté rituelle (tahara) désigne
            l’état requis pour accomplir certains actes d’adoration, comme
            la prière. Elle ne renvoie pas à une notion de propreté au sens
            courant, mais à un état spécifique reconnu par le fiqh, qui
            évolue selon les étapes du cycle féminin.
          </Text>

          <Text style={styles.h2}>2. Règles et dispense d’adoration</Text>

          <Text style={styles.body}>
            Pendant les règles, la femme est dispensée de certains actes
            d’adoration, en particulier la prière et le jeûne du Ramadan,
            qui pourra être rattrapé plus tard. Cette dispense est reconnue
            comme une facilité, et non comme une sanction.
          </Text>

          <View style={styles.checkList}>
            <Text style={styles.checkListTitle}>
              Ce qui reste accessible pendant les règles
            </Text>

            {DURING_PERIOD.map(item => (
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
              name="alert-outline"
              size={24}
              color={theme.colors.warning}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>À noter</Text>
              <Text style={styles.tipText}>
                Certains détails (comme la lecture directe du Coran ou
                l’accès à la mosquée) peuvent varier selon les écoles
                juridiques ; mieux vaut se référer à l’avis suivi
                habituellement ou à un savant qualifié pour ces cas précis.
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>
            3. Après les règles : reconnaître le retour à la pureté
          </Text>

          <Text style={styles.body}>
            La fin des règles marque le retour progressif vers l’état de
            pureté rituelle. Sur le plan physique, cela correspond à l’arrêt
            du saignement, un repère que différentes traditions savantes
            peuvent définir avec des nuances légèrement différentes.
          </Text>

          <View style={styles.visualCard}>
            <Image
              source={ART.process}
              resizeMode="cover"
              style={styles.visualImage}
            />

            <View style={styles.visualCopy}>
              <Text style={styles.visualTitle}>Un processus physiologique</Text>

              <Text style={styles.visualText}>
                Comprendre les étapes du cycle aide à mieux repérer le
                moment où les règles se terminent réellement.
              </Text>
            </View>
          </View>

          <Text style={styles.body}>
            Une fois ce repère observé, le ghusl (grande ablution) permet de
            renouer avec la pureté rituelle et de reprendre les actes
            d’adoration suspendus.
          </Text>

          <Text style={styles.h2}>4. Le ghusl : comprendre son rôle</Text>

          <Text style={styles.body}>
            Le ghusl est une grande ablution rituelle qui consiste à laver
            l’intégralité du corps avec l’intention de se purifier. Il
            marque la fin de l’état de dispense et permet de reprendre la
            prière normalement, sans qu’il soit nécessaire de rattraper les
            prières manquées pendant les règles.
          </Text>

          <View style={styles.visualCard}>
            <Image
              source={ART.ghusl}
              resizeMode="cover"
              style={styles.visualImage}
            />

            <View style={styles.visualCopy}>
              <Text style={styles.visualTitle}>Un rituel de purification</Text>

              <Text style={styles.visualText}>
                Le déroulement précis du ghusl peut varier légèrement selon
                les écoles juridiques suivies.
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
                Si tu ne connais pas les étapes précises suivies dans ton
                école, une personne de confiance ou un savant qualifié
                pourra te les expliquer clairement.
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>
            5. Que faire lorsqu’on n’est pas sûre ?
          </Text>

          <Text style={styles.body}>
            Il est fréquent de ressentir un doute sur la fin réelle des
            règles, notamment lorsque le saignement diminue progressivement
            plutôt que de s’arrêter net.
          </Text>

          <View style={styles.checkList}>
            <Text style={styles.checkListTitle}>Quelques repères utiles</Text>

            {DOUBT_MARKERS.map(item => (
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
                En cas de saignements prolongés, irréguliers, ou de doute
                persistant, ces situations méritent d’être évoquées avec un
                savant qualifié, qui pourra t’orienter selon ta situation
                personnelle. Ce contenu reste informatif et ne remplace pas
                un avis religieux individualisé.
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>6. À retenir</Text>

          <View style={styles.tip}>
            <MaterialDesignIcons
              name="lightbulb-outline"
              size={24}
              color={theme.colors.primary}
            />

            <View style={styles.tipCopy}>
              <Text style={styles.tipTitle}>Bon à savoir</Text>
              <Text style={styles.tipText}>
                Ces repères sont des rappels éducatifs généraux. Chaque
                situation peut avoir ses particularités : en cas de doute,
                le dialogue avec un savant ou une savante qualifiée reste la
                meilleure ressource pour une réponse adaptée.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={6} scrollRef={scrollRef} />
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
  checkList: {
    marginTop: 15,
    padding: 13,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
  },
  checkListTitle: {marginBottom: 9, fontSize: 13, color: theme.colors.text, fontWeight: '800'},
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
