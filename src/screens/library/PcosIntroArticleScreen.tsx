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

const ID = 'pcos-comprendre-sopk';

const CREAM = '#FCF9F5';
const INK = '#30283A';
const ROSE = '#B96778';
const BORDER = '#ECE5DF';
const MUTED = '#777078';

const HERO = require('../../assets/images/library/featured-comfort-hero.png');

const POSSIBLE_SIGNS = [
'Des cycles irréguliers, très espacés ou parfois absents',
'Une ovulation irrégulière ou difficile à prévoir',
'Une acné persistante, notamment sur le bas du visage',
'Une pilosité plus importante sur le visage, le torse ou le corps',
'Une perte de cheveux de type hormonal',
'Une prise de poids ou des difficultés à perdre du poids',
'Des difficultés à concevoir',
];

const DIAGNOSTIC_POINTS = [
'Cycles irréguliers ou ovulation peu fréquente',
'Signes d’un excès d’androgènes : acné, pilosité, chute de cheveux ou résultats biologiques',
'Aspect ovarien compatible avec un SOPK à l’échographie, lorsque cet examen est indiqué',
];

const FACTORS = [
'Prédisposition familiale et facteurs génétiques',
'Dérèglements de l’ovulation',
'Excès relatif d’androgènes',
'Résistance à l’insuline chez certaines femmes',
'Facteurs métaboliques et environnementaux',
];

const MYTHS = [
'Le SOPK signifie forcément « avoir des kystes » : le nom peut être trompeur. Le diagnostic ne repose pas uniquement sur la présence de kystes.',
'Toutes les femmes ayant un SOPK sont en surpoids : le SOPK peut concerner des femmes de toutes corpulences.',
'Le SOPK empêche forcément une grossesse : l’ovulation peut être irrégulière, mais une grossesse reste possible.',
'Un seul symptôme suffit pour diagnostiquer un SOPK : le diagnostic nécessite une évaluation globale.',
'Le SOPK disparaît simplement avec l’âge : son expression peut évoluer au cours de la vie, mais le suivi reste important.',
];

const LIFESTYLE = [
'Avoir une alimentation variée et régulière, adaptée à ses besoins',
'Pratiquer une activité physique régulière que l’on peut maintenir dans le temps',
'Veiller à un sommeil suffisamment régulier',
'Suivre l’évolution des cycles et des symptômes',
'Ne pas culpabiliser en cas de variation de poids ou de symptômes',
];

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

export default function PcosIntroArticleScreen({
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
message: 'Comprendre le SOPK — AWA',
});
};

return (
<View style={styles.screen}>
<StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

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

    <View style={styles.article}>
      {/* HEADER */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          SOPK • GUIDE ESSENTIEL
        </Text>
      </View>

      <Text style={styles.title}>
        Comprendre{`\n`}le SOPK
      </Text>

      <View style={styles.metas}>
        {[
          ['clock-outline', '10 min de lecture'],
          ['book-open-page-variant-outline', 'Guide'],
          ['chart-bar', 'Débutant'],
          ['shield-check-outline', 'Contenu éducatif'],
        ].map(([icon, text], index) => (
          <React.Fragment key={text}>
            {index > 0 ? (
              <View style={styles.metaDivider} />
            ) : null}

            <View style={styles.metaItem}>
              <MaterialDesignIcons
                name={icon as never}
                color="#8A8190"
                size={17}
              />

              <Text style={styles.meta}>
                {text}
              </Text>
            </View>
          </React.Fragment>
        ))}
      </View>

      <Text style={styles.intro}>
        Le syndrome des ovaires polykystiques,
        souvent appelé SOPK, est un trouble
        hormonal fréquent qui peut influencer
        les cycles, l’ovulation, la peau, les
        cheveux, le métabolisme et parfois la
        fertilité.
      </Text>

      <Text style={styles.introSecondary}>
        Son expression varie beaucoup d’une
        femme à l’autre. Comprendre le SOPK
        permet surtout de mieux identifier ses
        symptômes, de savoir quand demander un
        avis médical et de suivre son évolution
        sans culpabiliser.
      </Text>

      {/* CONTENTS */}
      <View style={styles.contents}>
        <Text style={styles.contentsTitle}>
          Dans cet article
        </Text>

        {[
          'Qu’est-ce que le SOPK ?',
          'Pourquoi le SOPK apparaît-il ?',
          'Les principaux signes',
          'Comment le diagnostic est-il posé ?',
          'SOPK et ovulation',
          'SOPK et fertilité',
          'SOPK et poids / métabolisme',
          'Peau, cheveux et pilosité',
          'Comment prendre en charge le SOPK ?',
          'Idées reçues',
          'Quand consulter ?',
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

      {/* 1 */}
      <Text style={styles.h2}>
        1. Qu’est-ce que le SOPK ?
      </Text>

      <Text style={styles.body}>
        Le syndrome des ovaires polykystiques
        (SOPK) est un trouble hormonal fréquent
        qui peut modifier le fonctionnement
        habituel des ovaires et l’équilibre de
        certaines hormones.
      </Text>

      <Text style={styles.body}>
        Chez certaines femmes, le principal
        problème est une ovulation irrégulière.
        Chez d’autres, ce sont plutôt l’acné,
        la pilosité, la chute de cheveux ou des
        manifestations métaboliques qui attirent
        l’attention.
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
            Malgré son nom, le SOPK ne signifie
            pas nécessairement que les ovaires
            contiennent des « kystes ». Le terme
            historique peut être trompeur et
            l’échographie n’est pas à elle seule
            suffisante pour poser le diagnostic.
          </Text>
        </View>
      </View>

      {/* 2 */}
      <Text style={styles.h2}>
        2. Pourquoi le SOPK apparaît-il ?
      </Text>

      <Text style={styles.body}>
        Il n’existe pas une seule cause du SOPK.
        Son apparition semble résulter de
        plusieurs facteurs qui peuvent se
        combiner : prédisposition familiale,
        fonctionnement hormonal, ovulation,
        métabolisme et facteurs individuels.
      </Text>

      <View style={styles.checkList}>
        {FACTORS.map(item => (
          <View
            key={item}
            style={styles.checkRow}>
            <MaterialDesignIcons
              name="circle-small"
              size={20}
              color={ROSE}
            />

            <Text style={styles.checkText}>
              {item}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.neutralBox}>
        <MaterialDesignIcons
          name="information-outline"
          size={22}
          color="#85727E"
        />

        <Text style={styles.neutralText}>
          Le SOPK n’est pas une faute personnelle.
          Il ne résulte pas simplement d’un manque
          de volonté, d’une mauvaise alimentation
          ou d’un manque d’activité physique.
        </Text>
      </View>

      {/* 3 */}
      <Text style={styles.h2}>
        3. Les principaux signes
      </Text>

      <Text style={styles.body}>
        Le SOPK peut se manifester de manière très
        différente. Certaines femmes présentent
        plusieurs symptômes tandis que d’autres
        n’en remarquent que très peu.
      </Text>

      <View style={styles.checkList}>
        {POSSIBLE_SIGNS.map(item => (
          <View
            key={item}
            style={styles.checkRow}>
            <MaterialDesignIcons
              name="check-circle-outline"
              size={18}
              color="#789276"
            />

            <Text style={styles.checkText}>
              {item}
            </Text>
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
          <Text style={styles.tipTitle}>
            Important
          </Text>

          <Text style={styles.tipText}>
            La présence d’un de ces symptômes ne
            signifie pas automatiquement que tu as
            un SOPK. Plusieurs autres situations
            peuvent provoquer des symptômes
            similaires.
          </Text>
        </View>
      </View>

      {/* 4 */}
      <Text style={styles.h2}>
        4. Comment le diagnostic est-il posé ?
      </Text>

      <Text style={styles.body}>
        Le diagnostic du SOPK est médical. Le
        professionnel de santé commence
        généralement par discuter des cycles,
        des symptômes, des antécédents et des
        traitements éventuels.
      </Text>

      <Text style={styles.body}>
        Selon la situation, des analyses
        hormonales et une échographie peuvent
        également être proposées.
      </Text>

      <View style={styles.numberedCard}>
        {DIAGNOSTIC_POINTS.map((item, index) => (
          <View
            key={item}
            style={styles.numberedRow}>
            <View style={styles.numberCircle}>
              <Text style={styles.numberCircleText}>
                {index + 1}
              </Text>
            </View>

            <Text style={styles.numberedText}>
              {item}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.body}>
        Le médecin doit également rechercher
        d’autres causes possibles d’irrégularité
        des cycles ou d’excès d’androgènes avant
        de retenir un diagnostic de SOPK.
      </Text>

      {/* 5 */}
      <Text style={styles.h2}>
        5. SOPK et ovulation
      </Text>

      <Text style={styles.body}>
        L’ovulation correspond à la libération
        d’un ovocyte par l’ovaire. Dans le SOPK,
        l’ovulation peut être moins fréquente ou
        plus difficile à prévoir.
      </Text>

      <Text style={styles.body}>
        Cela peut expliquer pourquoi les cycles
        sont parfois longs, irréguliers ou
        difficiles à anticiper.
      </Text>

      <View style={styles.highlightBox}>
        <MaterialDesignIcons
          name="calendar-heart"
          size={23}
          color={ROSE}
        />

        <View style={styles.highlightCopy}>
          <Text style={styles.highlightTitle}>
            Suivre son cycle
          </Text>

          <Text style={styles.highlightText}>
            Noter les dates des règles, les
            symptômes et les éventuels signes
            d’ovulation peut aider à mieux
            comprendre son propre fonctionnement.
          </Text>
        </View>
      </View>

      {/* 6 */}
      <Text style={styles.h2}>
        6. SOPK et fertilité
      </Text>

      <Text style={styles.body}>
        Comme l’ovulation peut être irrégulière,
        certaines femmes ayant un SOPK peuvent
        rencontrer plus de difficultés à concevoir.
      </Text>

      <Text style={styles.body}>
        Cela ne signifie cependant pas que le SOPK
        empêche automatiquement une grossesse.
        De nombreuses femmes ayant un SOPK
        conçoivent naturellement ou avec un
        accompagnement médical adapté.
      </Text>

      <View style={styles.tip}>
        <MaterialDesignIcons
          name="heart-outline"
          size={24}
          color={ROSE}
        />

        <View style={styles.tipCopy}>
          <Text style={styles.tipTitle}>
            À retenir
          </Text>

          <Text style={styles.tipText}>
            Difficultés à concevoir ne signifie pas
            impossibilité de concevoir. Si une
            grossesse est souhaitée, un médecin ou
            une sage-femme peut proposer une
            stratégie adaptée à la situation.
          </Text>
        </View>
      </View>

      {/* 7 */}
      <Text style={styles.h2}>
        7. SOPK et poids / métabolisme
      </Text>

      <Text style={styles.body}>
        Le SOPK peut être associé à des
        modifications du métabolisme, notamment
        chez certaines femmes une résistance à
        l’insuline.
      </Text>

      <Text style={styles.body}>
        Cependant, le poids ne permet pas à lui
        seul de diagnostiquer ou d’exclure un SOPK.
        Une femme mince peut avoir un SOPK, tout
        comme une femme en surpoids peut ne pas
        en avoir.
      </Text>

      <View style={styles.neutralBox}>
        <MaterialDesignIcons
          name="scale-balance"
          size={22}
          color="#85727E"
        />

        <Text style={styles.neutralText}>
          Le suivi doit prendre en compte la santé
          globale et pas uniquement le chiffre
          affiché sur la balance.
        </Text>
      </View>

      {/* 8 */}
      <Text style={styles.h2}>
        8. Peau, cheveux et pilosité
      </Text>

      <Text style={styles.body}>
        Un excès relatif d’androgènes peut
        influencer les glandes sébacées et les
        follicules pileux.
      </Text>

      <Text style={styles.body}>
        Cela peut se traduire par une acné
        persistante, une pilosité plus importante
        ou une perte de cheveux selon les femmes.
      </Text>

      <View style={styles.checkList}>
        {[
          'Acné hormonale',
          'Pilosité faciale ou corporelle plus importante',
          'Cheveux plus fins ou chute de cheveux',
        ].map(item => (
          <View
            key={item}
            style={styles.checkRow}>
            <MaterialDesignIcons
              name="check-circle-outline"
              size={18}
              color="#789276"
            />

            <Text style={styles.checkText}>
              {item}
            </Text>
          </View>
        ))}
      </View>

      {/* 9 */}
      <Text style={styles.h2}>
        9. Comment prendre en charge le SOPK ?
      </Text>

      <Text style={styles.body}>
        Il n’existe pas une seule prise en charge
        valable pour toutes les femmes. Le choix
        dépend des symptômes, des objectifs et de
        la situation médicale.
      </Text>

      <Text style={styles.body}>
        L’objectif peut être différent selon les
        périodes de la vie : régulariser les cycles,
        améliorer certains symptômes, protéger la
        santé métabolique ou accompagner un projet
        de grossesse.
      </Text>

      <View style={styles.sectionMiniTitle}>
        <MaterialDesignIcons
          name="heart-pulse"
          size={20}
          color={ROSE}
        />

        <Text style={styles.sectionMiniTitleText}>
          Habitudes favorables à la santé
        </Text>
      </View>

      <View style={styles.checkList}>
        {LIFESTYLE.map(item => (
          <View
            key={item}
            style={styles.checkRow}>
            <MaterialDesignIcons
              name="check-circle-outline"
              size={18}
              color="#789276"
            />

            <Text style={styles.checkText}>
              {item}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.body}>
        Selon les besoins, un professionnel de santé
        peut également proposer des traitements
        pour certains symptômes ou pour accompagner
        un projet de grossesse.
      </Text>

      <View style={styles.alert}>
        <MaterialDesignIcons
          name="doctor"
          size={24}
          color="#B76568"
        />

        <View style={styles.tipCopy}>
          <Text style={styles.tipTitle}>
            Pas d’automédication
          </Text>

          <Text style={styles.tipText}>
            Les traitements hormonaux, les
            médicaments métaboliques et les
            compléments alimentaires doivent être
            discutés avec un professionnel de santé.
          </Text>
        </View>
      </View>

      {/* 10 */}
      <Text style={styles.h2}>
        10. Idées reçues sur le SOPK
      </Text>

      <View style={styles.checkList}>
        {MYTHS.map(item => (
          <View
            key={item}
            style={styles.checkRow}>
            <MaterialDesignIcons
              name="close-circle-outline"
              size={18}
              color="#B76568"
            />

            <Text style={styles.checkText}>
              {item}
            </Text>
          </View>
        ))}
      </View>

      {/* 11 */}
      <Text style={styles.h2}>
        11. Quand consulter ?
      </Text>

      <Text style={styles.body}>
        Un avis médical est particulièrement
        pertinent lorsque les cycles deviennent
        très irréguliers, disparaissent pendant
        plusieurs mois, ou lorsqu’apparaissent
        des symptômes inhabituels.
      </Text>

      <View style={styles.consultCard}>
        {[
          [
            'calendar-alert',
            'Cycles très irréguliers ou absents',
          ],
          [
            'face-woman-shimmer',
            'Acné ou pilosité inhabituelle',
          ],
          [
            'hair-dryer',
            'Chute de cheveux importante',
          ],
          [
            'baby-heart-outline',
            'Difficultés à concevoir',
          ],
          [
            'alert-circle-outline',
            'Symptômes qui évoluent rapidement',
          ],
        ].map(([icon, text]) => (
          <View
            key={text}
            style={styles.consultRow}>
            <View style={styles.consultIcon}>
              <MaterialDesignIcons
                name={icon as never}
                size={18}
                color={ROSE}
              />
            </View>

            <Text style={styles.consultText}>
              {text}
            </Text>
          </View>
        ))}
      </View>

      {/* 12 */}
      <Text style={styles.h2}>
        12. À retenir
      </Text>

      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <MaterialDesignIcons
            name="check-decagram-outline"
            size={24}
            color={ROSE}
          />

          <Text style={styles.summaryTitle}>
            Les points essentiels
          </Text>
        </View>

        {[
          'Le SOPK est un trouble hormonal fréquent.',
          'Il peut se manifester de nombreuses façons.',
          'Toutes les femmes ayant un SOPK ne présentent pas les mêmes symptômes.',
          'Le poids ne suffit pas à diagnostiquer ou exclure un SOPK.',
          'Le diagnostic nécessite une évaluation médicale globale.',
          'Le SOPK peut influencer l’ovulation et parfois la fertilité.',
          'Une prise en charge personnalisée permet de répondre aux besoins de chaque femme.',
        ].map(item => (
          <View
            key={item}
            style={styles.summaryRow}>
            <MaterialDesignIcons
              name="check"
              size={17}
              color="#789276"
            />

            <Text style={styles.summaryText}>
              {item}
            </Text>
          </View>
        ))}
      </View>

      {/* FINAL NOTE */}
      <View style={styles.finalNote}>
        <MaterialDesignIcons
          name="shield-check-outline"
          size={23}
          color="#85727E"
        />

        <View style={styles.finalNoteCopy}>
          <Text style={styles.finalNoteTitle}>
            Un guide pour mieux comprendre
          </Text>

          <Text style={styles.finalNoteText}>
            Cet article est destiné à l’information
            générale et ne remplace pas une
            consultation médicale. Chaque situation
            est différente : en cas de doute ou de
            symptômes persistants, demande conseil
            à un professionnel de santé.
          </Text>
        </View>
      </View>
    </View>
  </ScrollView>

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
gap: 10,
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
fontSize: 9.5,
color: '#777078',
},

intro: {
marginTop: 17,
fontSize: 14,
lineHeight: 21,
color: '#49424A',
fontWeight: '600',
},

introSecondary: {
marginTop: 9,
fontSize: 13.5,
lineHeight: 20.5,
color: MUTED,
},

contents: {
marginTop: 20,
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
width: 25,
color: ROSE,
fontSize: 11.5,
fontWeight: '800',
},

contentText: {
flex: 1,
fontSize: 12.3,
lineHeight: 17,
color: INK,
},

h2: {
marginTop: 25,
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
color: '#4A444B',
},

tip: {
marginTop: 16,
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

alert: {
marginTop: 15,
padding: 14,
flexDirection: 'row',
alignItems: 'flex-start',
borderRadius: 12,
backgroundColor: '#F8E8E8',
},

neutralBox: {
marginTop: 15,
padding: 14,
flexDirection: 'row',
alignItems: 'flex-start',
gap: 9,
borderRadius: 12,
backgroundColor: '#F1EDEF',
},

neutralText: {
flex: 1,
fontSize: 11.5,
lineHeight: 17,
color: '#5C535B',
},

numberedCard: {
marginTop: 14,
padding: 14,
borderRadius: 13,
backgroundColor: '#FBF8F5',
borderWidth: 1,
borderColor: BORDER,
},

numberedRow: {
flexDirection: 'row',
alignItems: 'flex-start',
marginBottom: 13,
},

numberCircle: {
width: 27,
height: 27,
borderRadius: 14,
alignItems: 'center',
justifyContent: 'center',
backgroundColor: '#F3DFE5',
},

numberCircleText: {
color: ROSE,
fontSize: 11,
fontWeight: '800',
},

numberedText: {
flex: 1,
marginLeft: 10,
paddingTop: 3,
color: '#4A444B',
fontSize: 12,
lineHeight: 17,
},

highlightBox: {
marginTop: 15,
padding: 14,
flexDirection: 'row',
alignItems: 'flex-start',
borderRadius: 13,
backgroundColor: '#F7EFF2',
borderWidth: 1,
borderColor: '#EADBE0',
},

highlightCopy: {
flex: 1,
marginLeft: 10,
},

highlightTitle: {
color: INK,
fontSize: 13,
fontWeight: '800',
},

highlightText: {
marginTop: 4,
color: '#5A5158',
fontSize: 11.5,
lineHeight: 17,
},

sectionMiniTitle: {
marginTop: 17,
flexDirection: 'row',
alignItems: 'center',
gap: 8,
},

sectionMiniTitleText: {
color: INK,
fontSize: 13,
fontWeight: '800',
},

consultCard: {
marginTop: 14,
padding: 13,
borderRadius: 13,
backgroundColor: '#FBF7F4',
borderWidth: 1,
borderColor: BORDER,
},

consultRow: {
minHeight: 43,
flexDirection: 'row',
alignItems: 'center',
marginBottom: 7,
},

consultIcon: {
width: 34,
height: 34,
borderRadius: 10,
alignItems: 'center',
justifyContent: 'center',
backgroundColor: '#F4E4E8',
},

consultText: {
flex: 1,
marginLeft: 10,
color: '#4A444B',
fontSize: 12,
lineHeight: 17,
},

summaryCard: {
marginTop: 15,
padding: 15,
borderRadius: 14,
backgroundColor: '#F7EFF2',
borderWidth: 1,
borderColor: '#E8DADF',
},

summaryHeader: {
flexDirection: 'row',
alignItems: 'center',
gap: 9,
marginBottom: 12,
},

summaryTitle: {
color: INK,
fontSize: 15,
fontWeight: '800',
},

summaryRow: {
flexDirection: 'row',
alignItems: 'flex-start',
gap: 8,
marginBottom: 9,
},

summaryText: {
flex: 1,
color: '#514950',
fontSize: 12,
lineHeight: 17,
},

finalNote: {
marginTop: 18,
padding: 14,
flexDirection: 'row',
alignItems: 'flex-start',
borderRadius: 13,
backgroundColor: '#F1EDEF',
},

finalNoteCopy: {
flex: 1,
marginLeft: 10,
},

finalNoteTitle: {
color: INK,
fontSize: 13,
fontWeight: '800',
},

finalNoteText: {
marginTop: 4,
color: '#5C535B',
fontSize: 11,
lineHeight: 16.5,
},
});