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

const ID = 'religiousfaq-questions-frequentes';

const HERO = require('../../assets/images/library/popular-flower.png');

const RELIGIOUS_DISCLAIMER =
  'Ce contenu est purement éducatif. Les questions religieuses doivent être validées par des savants qualifiés. AWA ne délivre pas de fatwas ni de décisions religieuses personnalisées.';

const FAQ_ITEMS = [
  [
    'Qu’est-ce que le fiqh féminin ?',
    'Le fiqh féminin regroupe les règles pratiques qui concernent spécifiquement le corps et le culte des femmes : cycle, pureté, prière, jeûne, nifas et istihâda.',
  ],
  [
    'Quels sont les grands sujets couverts par le fiqh féminin ?',
    'Il aborde notamment les règles et le cycle, la pureté rituelle, le ghusl, la prière et le jeûne pendant et après les règles, le nifas et l’istihâda.',
  ],
  [
    'Quelle est la différence entre règles, saignements post-partum et saignements irréguliers ?',
    'Les règles (hayd) suivent le cycle habituel, le nifas survient après l’accouchement, et l’Istihâda désigne un saignement irrégulier, hors cycle. Chacun suit un statut différent.',
  ],
  [
    'Qu’advient-il de la prière pendant les règles ?',
    'La prière est suspendue pendant cette période : il s’agit d’une dispense reconnue, à vivre sans culpabilité.',
  ],
  [
    'Qu’advient-il du jeûne pendant les règles ?',
    'Le jeûne est également suspendu ; les jours non jeûnés sont rattrapés plus tard (qadaa), en dehors du Ramadan.',
  ],
  [
    'Pourquoi les prières manquées ne sont-elles généralement pas rattrapées, contrairement au jeûne ?',
    'Cette différence tient à la nature des deux actes : la prière est quotidienne et répétée, tandis que le jeûne est annuel et concentré sur un mois. Suivre la dispense fait pleinement partie de la pratique religieuse.',
  ],
  [
    'Quand la prière reprend-elle après les règles ?',
    'Dès que les règles sont terminées et que le ghusl a été effectué, la prière reprend normalement, sans délai.',
  ],
  [
    'Quel est le rôle du ghusl ?',
    'Le ghusl est la grande ablution qui permet de retrouver l’état de pureté rituelle nécessaire pour reprendre la prière et d’autres actes d’adoration.',
  ],
  [
    'Que faire si on n’est pas sûre que les règles sont terminées ?',
    'Observer l’absence totale de saignement pendant un temps suffisant, plutôt que de se fier à une impression ponctuelle, aide à clarifier la situation.',
  ],
  [
    'Peut-on pratiquer d’autres formes d’adoration pendant les règles ?',
    'Oui : le dhikr, les invocations, la charité, l’apprentissage religieux et d’autres gestes de bienveillance restent accessibles.',
  ],
  [
    'Pourquoi certaines réponses peuvent-elles varier selon la situation ?',
    'Le fiqh est un champ d’interprétation : les avis peuvent varier selon les écoles juridiques et les circonstances personnelles, sans qu’un avis soit à lui seul absolu.',
  ],
];

const DOUBT_SITUATIONS = [
  'Il y a une incertitude sur la fin réelle des règles',
  'La nature d’un saignement reste incertaine (règles, istihâda, autre)',
  'Un doute persiste sur la nécessité d’effectuer le ghusl',
  'La question de la reprise de la prière reste incertaine',
  'Des informations contradictoires ont été trouvées en ligne',
];

const KEY_POINTS = [
  'Le fiqh féminin couvre de nombreux aspects de la pratique religieuse des femmes',
  'Certains détails peuvent légitimement varier selon les écoles',
  'Une information générale ne remplace pas un avis religieux personnalisé',
  'Un doute persistant mérite d’être posé à un savant qualifié',
  'Le rôle d’AWA est éducatif, non de délivrer des fatwas',
];

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function ReligiousFaqArticleScreen({
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
      message: 'Questions fréquentes de fiqh féminin — AWA',
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
            <Text style={styles.badgeText}>QUESTIONS FRÉQUENTES</Text>
          </View>

          <Text style={styles.title}>
            Questions fréquentes{`\n`}de fiqh féminin
          </Text>

          <View style={styles.metas}>
            {[
              ['clock-outline', '8 min de lecture'],
              ['book-open-page-variant-outline', 'FAQ'],
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
            Les interrogations les plus posées sur le fiqh féminin, réunies
            en un endroit avec des réponses claires.
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
              'Les questions qui reviennent souvent',
              'Des écoles juridiques qui peuvent varier',
              'En cas de doute persistant',
              'Points clés à retenir',
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

          <Text style={styles.h2}>1. Les questions qui reviennent souvent</Text>

          <Text style={styles.body}>
            De nombreuses questions autour du cycle, de la prière et du
            jeûne reviennent régulièrement d’une femme à l’autre. Voici des
            réponses générales aux plus fréquentes ; pour aller plus loin,
            chaque thème est aussi développé dans un article dédié.
          </Text>

          <View style={styles.faqList}>
            {FAQ_ITEMS.map(([question, answer], index) => (
              <View
                key={question}
                style={[
                  styles.faqItem,
                  index === 0 && styles.faqItemFirst,
                ]}>
                <Text style={styles.faqQuestion}>{question}</Text>
                <Text style={styles.faqAnswer}>{answer}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.h2}>2. Des écoles juridiques qui peuvent varier</Text>

          <Text style={styles.body}>
            Le fiqh islamique comporte des différences d’interprétation
            reconnues sur certains points de détail. Ces différences
            existent depuis des siècles et sont considérées comme
            légitimes au sein de la tradition religieuse.
          </Text>

          <Text style={styles.body}>
            Selon la source consultée, une même question peut ainsi
            recevoir des réponses légèrement différentes. Cela ne signifie
            pas qu’une réponse serait automatiquement fausse : cela reflète
            des méthodologies et des lectures différentes des mêmes
            sources.
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
                Suivre une source qualifiée de manière cohérente, plutôt que
                de changer constamment d’avis selon les réponses trouvées,
                aide à garder une pratique claire et sereine.
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>3. En cas de doute persistant</Text>

          <Text style={styles.body}>
            Certaines situations restent difficiles à trancher à partir
            d’une seule explication générale. C’est notamment le cas
            lorsque :
          </Text>

          <View style={styles.checkList}>
            {DOUBT_SITUATIONS.map(item => (
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
                Lorsqu’une situation est personnelle, complexe ou
                persistante, elle ne peut pas être résolue par une
                information générale. Le recours à un savant ou une savante
                qualifiée, capable de tenir compte de ta situation précise,
                reste alors la meilleure approche. AWA ne délivre pas de
                fatwas ni de décisions religieuses personnalisées.
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>4. Points clés à retenir</Text>

          <View style={styles.checkList}>
            {KEY_POINTS.map(item => (
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
        </View>
      </ScrollView>

      <ReadingControls articleId={ID} durationMinutes={8} scrollRef={scrollRef} />
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
  faqList: {marginTop: 4},
  faqItem: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  faqItemFirst: {marginTop: 16, paddingTop: 0, borderTopWidth: 0},
  faqQuestion: {fontSize: 14.5, lineHeight: 20, color: theme.colors.text, fontWeight: '800'},
  faqAnswer: {
    marginTop: 5,
    fontSize: 13.5,
    lineHeight: 20,
    color: theme.colors.textSecondary,
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
