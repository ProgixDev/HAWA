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

const ID = 'pcos-cycle-ovulation-fertilite';

const HERO = require('../../assets/images/library/featured-cycle.png');

const TRACKING_TIPS = [
'Noter la date du premier jour de chaque cycle, même lorsque les cycles sont très espacés',
'Observer les changements de glaire cervicale au fil du cycle',
'Noter d’éventuelles douleurs pelviennes ou autres signes pouvant accompagner l’ovulation',
'Éviter de se baser uniquement sur une durée moyenne de 28 jours pour prédire l’ovulation',
'Utiliser les tests d’ovulation avec prudence et, si besoin, demander conseil à un professionnel',
'Partager les informations recueillies avec un professionnel de santé en cas de désir de grossesse',
];

const OVULATION_SIGNS = [
'Modification de la glaire cervicale, qui peut devenir plus abondante, transparente et filante',
'Légère douleur ou gêne pelvienne chez certaines femmes',
'Variation de la température corporelle après l’ovulation',
'Modification de la sensation d’humidité vaginale',
'Éventuelle augmentation de la libido chez certaines femmes',
];

const FERTILITY_POINTS = [
'Le SOPK n’entraîne pas automatiquement une infertilité',
'La principale difficulté vient souvent d’une ovulation irrégulière ou imprévisible',
'Une ovulation peut survenir même lorsque les cycles sont très longs',
'Une prise en charge adaptée peut améliorer les chances de conception',
'Le parcours de fertilité dépend de chaque personne et de nombreux autres facteurs',
];

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function PcosCycleFertilityArticleScreen({
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
message: 'Cycle, ovulation et fertilité dans le SOPK — AWA',
});
};

return (
<View style={styles.screen}>
<StatusBar translucent backgroundColor="transparent" barStyle={theme.statusBarStyle} />

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
        Cycle, ovulation{`\n`}et fertilité dans le SOPK
      </Text>

      <View style={styles.metas}>
        {[
          ['clock-outline', '8 min de lecture'],
          ['book-open-page-variant-outline', 'Guide'],
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
        Avec le SOPK, le cycle peut devenir long, irrégulier et parfois
        difficile à prévoir. Comprendre ce qui se passe autour de
        l’ovulation permet de mieux interpréter son cycle et de mieux
        comprendre les questions liées à la fertilité.
      </Text>

      <View style={styles.contents}>
        <Text style={styles.contentsTitle}>Dans cet article</Text>

        {[
          'Pourquoi le cycle devient irrégulier',
          'Ce qui se passe autour de l’ovulation',
          'Comment reconnaître une ovulation',
          'SOPK et fertilité',
          'Pourquoi les applications peuvent être moins précises',
          'Suivre son cycle avec le SOPK',
          'Quand consulter pour un désir de grossesse',
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
        1. Pourquoi le cycle devient irrégulier
      </Text>

      <Text style={styles.body}>
        Le cycle menstruel dépend d’une succession coordonnée de signaux
        hormonaux. Dans le SOPK, cette organisation peut être perturbée,
        notamment au niveau du développement des follicules et de
        l’ovulation.
      </Text>

      <Text style={styles.body}>
        Les ovaires peuvent contenir de nombreux petits follicules qui
        commencent leur développement sans qu’un follicule dominant
        arrive régulièrement à maturité. L’ovulation peut alors être
        retardée, survenir de manière imprévisible ou ne pas avoir lieu
        pendant certains cycles.
      </Text>

      <Text style={styles.body}>
        C’est l’une des raisons pour lesquelles certaines personnes
        atteintes de SOPK ont des cycles de 35, 45 ou parfois davantage
        de jours, tandis que d’autres peuvent avoir des cycles plus
        proches d’une durée habituelle.
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
            La durée d’un cycle ne permet pas, à elle seule, de savoir
            si une ovulation a eu lieu. Deux cycles de même durée peuvent
            avoir une histoire hormonale différente.
          </Text>
        </View>
      </View>

      <Text style={styles.h2}>2. Ce qui se passe autour de l’ovulation</Text>

      <Text style={styles.body}>
        L’ovulation correspond à la libération d’un ovocyte par un ovaire.
        Elle intervient après une phase de maturation folliculaire et
        précède la phase lutéale du cycle.
      </Text>

      <Text style={styles.body}>
        Dans un cycle régulier, l’ovulation est souvent située au milieu
        du cycle. Mais avec le SOPK, cette règle simple ne fonctionne pas
        toujours. L’ovulation peut être beaucoup plus tardive ou ne pas
        se produire au cours d’un cycle donné.
      </Text>

      <View style={styles.infoCard}>
        <MaterialDesignIcons
          name="information-outline"
          size={23}
          color={theme.colors.primary}
        />

        <View style={styles.tipCopy}>
          <Text style={styles.tipTitle}>Pourquoi cela compte</Text>

          <Text style={styles.tipText}>
            Lorsque l’ovulation est imprévisible, il devient plus
            difficile d’estimer la période fertile uniquement à partir
            des dates des règles.
          </Text>
        </View>
      </View>

      <Text style={styles.h2}>
        3. Comment reconnaître une ovulation
      </Text>

      <Text style={styles.body}>
        Il existe plusieurs signes corporels pouvant accompagner les
        changements hormonaux autour de l’ovulation. Ils peuvent être
        utiles pour mieux observer son propre cycle, mais aucun signe
        isolé ne permet de confirmer avec certitude une ovulation.
      </Text>

      <View style={styles.checkList}>
        {OVULATION_SIGNS.map(item => (
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

      <Text style={styles.body}>
        La glaire cervicale est notamment intéressante à observer. À
        l’approche de la période fertile, elle peut devenir plus
        abondante, transparente, glissante et extensible. Cependant, son
        aspect peut varier d’une personne à l’autre et d’un cycle à
        l’autre.
      </Text>

      <View style={styles.alert}>
        <MaterialDesignIcons
          name="alert-outline"
          size={24}
          color={theme.colors.warning}
        />

        <View style={styles.tipCopy}>
          <Text style={styles.tipTitle}>Attention aux prédictions</Text>

          <Text style={styles.tipText}>
            Avec des cycles très irréguliers, une date d’ovulation
            calculée automatiquement à partir des cycles précédents peut
            être très approximative. Une prédiction n’est pas une
            confirmation médicale de l’ovulation.
          </Text>
        </View>
      </View>

      <Text style={styles.h2}>4. SOPK et fertilité</Text>

      <Text style={styles.body}>
        Le SOPK peut rendre la conception plus difficile principalement
        lorsque l’ovulation est peu fréquente ou difficile à prévoir.
        Toutefois, avoir un SOPK ne signifie pas être stérile.
      </Text>

      <Text style={styles.body}>
        Certaines femmes atteintes de SOPK ovulent régulièrement et
        conçoivent sans difficulté particulière. Pour d’autres,
        l’ovulation est suffisamment irrégulière pour nécessiter une
        évaluation et éventuellement une prise en charge médicale.
      </Text>

      <View style={styles.checkList}>
        {FERTILITY_POINTS.map(item => (
          <View key={item} style={styles.checkRow}>
            <MaterialDesignIcons
              name="heart-pulse"
              size={18}
              color={theme.colors.primary}
            />

            <Text style={styles.checkText}>{item}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.body}>
        La fertilité ne dépend d’ailleurs pas uniquement de l’ovulation.
        L’âge, la qualité du sperme du partenaire, l’état des trompes,
        l’endomètre et d’autres facteurs peuvent également intervenir.
        C’est pourquoi une évaluation globale est importante lorsqu’une
        grossesse tarde à survenir.
      </Text>

      <Text style={styles.h2}>
        5. Pourquoi les applications peuvent être moins précises
      </Text>

      <Text style={styles.body}>
        Les applications de suivi menstruel utilisent généralement les
        données des cycles précédents pour proposer des estimations.
        Lorsque les cycles sont relativement réguliers, ces estimations
        peuvent être utiles pour se repérer.
      </Text>

      <Text style={styles.body}>
        Avec le SOPK, la variabilité des cycles peut cependant rendre ces
        calculs moins fiables. Une application ne peut pas savoir avec
        certitude qu’une ovulation a eu lieu uniquement parce qu’une date
        théorique est atteinte.
      </Text>

      <View style={styles.tip}>
        <MaterialDesignIcons
          name="calendar-clock"
          size={24}
          color={theme.colors.primary}
        />

        <View style={styles.tipCopy}>
          <Text style={styles.tipTitle}>À utiliser comme repère</Text>

          <Text style={styles.tipText}>
            Le suivi numérique est surtout intéressant pour observer les
            tendances de ton propre cycle et conserver un historique à
            partager avec ton professionnel de santé.
          </Text>
        </View>
      </View>

      <Text style={styles.h2}>6. Suivre son cycle avec le SOPK</Text>

      <Text style={styles.body}>
        Un suivi régulier peut aider à mieux comprendre les variations
        personnelles. Il ne s’agit pas de chercher à rendre le cycle
        parfaitement prévisible, mais plutôt de recueillir suffisamment
        d’informations pour identifier des tendances.
      </Text>

      <View style={styles.checkList}>
        {TRACKING_TIPS.map(item => (
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

      <Text style={styles.body}>
        Il peut également être utile de noter les symptômes associés :
        douleurs, acné, changements de glaire, saignements inhabituels,
        humeur, sommeil ou autres observations personnelles. Ces
        informations peuvent aider à donner une vision plus complète du
        cycle.
      </Text>

      <Text style={styles.h2}>
        7. Quand consulter pour un désir de grossesse
      </Text>

      <Text style={styles.body}>
        Une consultation peut être pertinente avant même de commencer
        les essais lorsque les cycles sont très irréguliers, très espacés
        ou lorsqu’une absence prolongée de règles est observée.
      </Text>

      <Text style={styles.body}>
        Un professionnel pourra rechercher les causes des irrégularités,
        évaluer l’ovulation et proposer, si nécessaire, une stratégie
        adaptée au projet de grossesse.
      </Text>

      <View style={styles.alert}>
        <MaterialDesignIcons
          name="doctor"
          size={24}
          color={theme.colors.warning}
        />

        <View style={styles.tipCopy}>
          <Text style={styles.tipTitle}>Quand demander conseil</Text>

          <Text style={styles.tipText}>
            Si tes règles sont très espacées, si tu n’as pas de règles
            pendant plusieurs mois, ou si une grossesse ne survient pas
            malgré des rapports réguliers, parle-en à un professionnel
            de santé.
          </Text>
        </View>
      </View>

      <Text style={styles.h2}>8. À retenir</Text>

      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <MaterialDesignIcons
            name="bookmark-check-outline"
            size={23}
            color={theme.colors.primary}
          />

          <Text style={styles.summaryTitle}>Les points essentiels</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryNumber}>01</Text>

          <Text style={styles.summaryText}>
            Le SOPK peut rendre les cycles longs et imprévisibles.
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryNumber}>02</Text>

          <Text style={styles.summaryText}>
            L’ovulation peut être irrégulière ou absente certains cycles.
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryNumber}>03</Text>

          <Text style={styles.summaryText}>
            Un cycle irrégulier ne signifie pas automatiquement absence
            de fertilité.
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryNumber}>04</Text>

          <Text style={styles.summaryText}>
            Les prédictions basées uniquement sur le calendrier peuvent
            être moins fiables avec le SOPK.
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryNumber}>05</Text>

          <Text style={styles.summaryText}>
            Observer son cycle et conserver un historique peut être
            utile, notamment lors d’une consultation.
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
          <Text style={styles.tipTitle}>Un dernier mot</Text>

          <Text style={styles.tipText}>
            Le SOPK ne se manifeste pas de la même manière chez toutes
            les femmes. Ton cycle peut évoluer avec le temps. Le suivi
            est là pour t’aider à mieux comprendre ton fonctionnement,
            pas pour remplacer un avis médical.
          </Text>
        </View>
      </View>

      <Text style={styles.disclaimer}>
        Cet article a une vocation informative et éducative. Il ne
        constitue pas un diagnostic médical et ne remplace pas une
        consultation avec un professionnel de santé.
      </Text>
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
width: 24,
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
marginTop: 24,
fontFamily: 'serif',
fontSize: 21,
lineHeight: 27,
color: theme.colors.text,
fontWeight: '700',
},

body: {
marginTop: 9,
fontSize: 14,
lineHeight: 22,
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
marginBottom: 11,
},

checkText: {
flex: 1,
color: theme.colors.textSecondary,
fontSize: 12.5,
lineHeight: 18,
},

alert: {
marginTop: 14,
padding: 14,
flexDirection: 'row',
alignItems: 'flex-start',
borderRadius: 12,
backgroundColor: withAlpha(theme.colors.warning, 0.12),
},

infoCard: {
marginTop: 14,
padding: 14,
flexDirection: 'row',
alignItems: 'flex-start',
borderRadius: 12,
backgroundColor: withAlpha(theme.colors.primary, 0.08),
borderWidth: 1,
borderColor: theme.colors.border,
},

tip: {
marginTop: 15,
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

summaryCard: {
marginTop: 15,
padding: 15,
borderRadius: 14,
backgroundColor: theme.colors.surfaceSecondary,
borderWidth: 1,
borderColor: theme.colors.border,
},

summaryHeader: {
flexDirection: 'row',
alignItems: 'center',
gap: 9,
marginBottom: 12,
},

summaryTitle: {
fontSize: 14,
color: theme.colors.text,
fontWeight: '800',
},

summaryRow: {
flexDirection: 'row',
alignItems: 'flex-start',
marginTop: 10,
},

summaryNumber: {
width: 31,
fontSize: 10,
color: theme.colors.primary,
fontWeight: '800',
marginTop: 2,
},

summaryText: {
flex: 1,
fontSize: 12.5,
lineHeight: 18,
color: theme.colors.textSecondary,
},

disclaimer: {
marginTop: 22,
paddingHorizontal: 4,
fontSize: 10.5,
lineHeight: 16,
textAlign: 'center',
color: theme.colors.textMuted,
},
});
}
