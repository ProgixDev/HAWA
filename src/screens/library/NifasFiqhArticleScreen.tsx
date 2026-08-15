import React, { useEffect, useRef, useState } from 'react';
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
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ReadingControls from '../../components/articles/ReadingControls';
import type { RootStackParamList } from '../../navigation/AppNavigator';
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

const ID = 'nifasfiqh-repere-fiqh';
const HERO = require('../../assets/images/library/nifas-fiqh-hero.png');
const PURPLE = '#43306D';
const LAVENDER = '#F1EBFB';

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

const CONTENTS = [
  ['book-open-page-variant-outline', 'Qu’est-ce que le nifas ?'],
  ['clock-outline', 'Sa durée selon les références juridiques'],
  ['mosque-outline', 'Prière pendant le nifas'],
  ['water-outline', 'Jeûne pendant le nifas'],
  ['water-check-outline', 'Purification et reprise des adorations'],
  ['help-circle-outline', 'Questions fréquentes'],
] as const;

function Callout({
  icon,
  title,
  children,
  gold = false,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
  gold?: boolean;
}): React.JSX.Element {
  return (
    <View style={[styles.callout, gold && styles.calloutGold]}>
      <View style={[styles.calloutIcon, gold && styles.calloutIconGold]}>
        <MaterialDesignIcons
          name={icon as never}
          size={22}
          color={gold ? '#8B621C' : '#7951C8'}
        />
      </View>
      <View style={styles.calloutCopy}>
        <Text style={[styles.calloutTitle, gold && styles.goldText]}>
          {title}
        </Text>
        <Text style={[styles.calloutText, gold && styles.goldText]}>
          {children}
        </Text>
      </View>
    </View>
  );
}

export default function NifasFiqhArticleScreen({
  navigation,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    let mounted = true;
    loadLibraryState().then(() => mounted && setSaved(isArticleBookmarked(ID)));
    return () => {
      mounted = false;
    };
  }, []);
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
        contentContainerStyle={{
          paddingBottom: getBottomPadding(
            insets.bottom,
            READING_CONTROLS_SPACE,
          ),
        }}
      >
        <View style={styles.heroWrap}>
          <Image source={HERO} resizeMode="cover" style={styles.hero} />
          <View
            style={[
              styles.top,
              { paddingTop: getTopPadding(insets.top, true) },
            ]}
          >
            <Pressable
              accessibilityLabel="Retour"
              accessibilityRole="button"
              onPress={navigation.goBack}
              style={styles.circle}
            >
              <MaterialDesignIcons
                name="chevron-left"
                size={25}
                color={PURPLE}
              />
            </Pressable>
            <View style={styles.actions}>
              <Pressable
                accessibilityLabel="Favori"
                accessibilityRole="button"
                onPress={() => setSaved(toggleBookmark(ID))}
                style={styles.circle}
              >
                <MaterialDesignIcons
                  name={saved ? 'bookmark' : 'bookmark-outline'}
                  size={21}
                  color={PURPLE}
                />
              </Pressable>
              <Pressable
                accessibilityLabel="Partager"
                accessibilityRole="button"
                onPress={() =>
                  Share.share({
                    message: 'Le nifas en pratique religieuse — AWA',
                  })
                }
                style={styles.circle}
              >
                <MaterialDesignIcons
                  name="share-variant-outline"
                  size={21}
                  color={PURPLE}
                />
              </Pressable>
            </View>
          </View>
        </View>
        <View style={styles.article}>
          <View style={styles.badges}>
            <Text style={styles.badge}>Nifas (fiqh)</Text>
            <View style={styles.eduBadge}>
              <MaterialDesignIcons
                name="school-outline"
                size={15}
                color="#9A6A1F"
              />
              <Text style={styles.eduText}>Contenu éducatif</Text>
            </View>
          </View>
          <Text style={styles.title}>Le nifas en pratique religieuse</Text>
          <View style={styles.meta}>
            <MaterialDesignIcons
              name="clock-outline"
              size={18}
              color="#827793"
            />
            <Text style={styles.metaText}>6 min de lecture</Text>
            <Text style={styles.dot}>•</Text>
            <MaterialDesignIcons
              name="school-outline"
              size={18}
              color="#827793"
            />
            <Text style={styles.metaText}>FAQ</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.metaText}>Débutant</Text>
          </View>
          <Text style={styles.intro}>
            Comprendre le nifas après l’accouchement, sa durée et les principaux
            repères liés à la prière, au jeûne et à la purification.
          </Text>
          <Callout
            gold
            icon="information-outline"
            title="Information importante"
          >
            Ce contenu est purement éducatif. Les questions religieuses doivent
            être validées par des savants qualifiés. AWA ne délivre pas de
            fatwas ni de décisions religieuses personnalisées.
          </Callout>
          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>Dans cet article</Text>
            {CONTENTS.map(([icon, title], index) => (
              <View key={title} style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <View style={styles.contentIcon}>
                    <MaterialDesignIcons
                      name={icon as never}
                      size={18}
                      color="#7951C8"
                    />
                  </View>
                  <Text style={styles.contentText}>
                    {index + 1}. {title}
                  </Text>
                </View>
                <MaterialDesignIcons
                  name="chevron-right"
                  size={20}
                  color="#735B9B"
                />
              </View>
            ))}
          </View>
          <Section title="1. Qu’est-ce que le nifas ?">
            <Text style={styles.body}>
              Le nifas désigne, dans la pratique religieuse, la période liée aux
              pertes de sang après l’accouchement. Les lochies décrivent
              l’aspect médical et physiologique de ces pertes ; le nifas est
              leur classification religieuse. Ces deux notions ne doivent pas
              être confondues.
            </Text>
            <Callout icon="lightbulb-outline" title="À retenir">
              AWA sépare volontairement les informations médicales sur les
              lochies des repères religieux sur le nifas.
            </Callout>
          </Section>
          <Section title="2. Sa durée selon les références juridiques">
            <Text style={styles.question}>
              Combien de temps dure le nifas ?
            </Text>
            <Text style={styles.body}>
              La durée maximale peut varier selon l’école juridique ou la
              référence religieuse suivie. 40 jours est une référence
              fréquemment retenue, sans être présentée comme une règle
              universelle par AWA.
            </Text>
            <Callout gold icon="calendar-star" title="Repère souvent utilisé">
              Une référence fréquemment retenue est de 40 jours, mais AWA ne
              présente pas ce chiffre comme une vérité unique pour toutes les
              écoles juridiques. Suis la référence religieuse que tu as choisie.
            </Callout>
          </Section>
          <Section title="3. Prière pendant le nifas">
            <View style={styles.qa}>
              <Text style={styles.question}>
                Dois-je prier pendant le nifas ?
              </Text>
              <Text style={styles.body}>
                Pendant une période reconnue comme nifas selon la référence
                suivie, la prière rituelle est suspendue. AWA ne classe pas
                automatiquement les saignements et ne fournit pas de décision
                personnalisée. Aucun compteur de prières manquées n’est ajouté
                pour cette période.
              </Text>
            </View>
          </Section>
          <Section title="4. Jeûne pendant le nifas">
            <Text style={styles.question}>
              Puis-je jeûner pendant le nifas ?
            </Text>
            <Text style={styles.body}>
              Le jeûne obligatoire n’est pas accompli pendant une période
              reconnue comme nifas. Les jours concernés sont ensuite traités par
              le rattrapage approprié, selon la référence suivie.
            </Text>
            <Callout
              icon="calendar-refresh-outline"
              title="Organiser, sans décider"
            >
              AWA peut t’aider à mémoriser ou organiser les jours concernés,
              sans émettre de décision religieuse personnalisée.
            </Callout>
          </Section>
          <Section title="5. Purification et reprise des adorations">
            <Text style={styles.body}>
              La reprise dépend des signes observés et de la référence
              religieuse suivie.
            </Text>
            <View style={styles.steps}>
              {[
                'Observer la fin des pertes',
                'Effectuer la purification rituelle',
                'Reprendre les actes d’adoration concernés',
              ].map((label, index) => (
                <View key={label} style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{label}</Text>
                </View>
              ))}
            </View>
            <Callout gold icon="alert-outline" title="En cas de doute">
              Si les saignements persistent au-delà de la durée maximale retenue
              par la référence suivie, leur statut religieux peut changer. Un
              avis qualifié est recommandé.
            </Callout>
          </Section>
          <Section title="6. Questions fréquentes">
            <Faq
              q="Le nifas dure-t-il toujours 40 jours ?"
              a="Non. 40 jours est une référence fréquemment utilisée, mais les références juridiques peuvent différer."
            />
            <Faq
              q="Que faire si les pertes s’arrêtent avant 40 jours ?"
              a="La reprise des actes d’adoration dépend des signes observés et de la référence religieuse suivie."
            />
            <Faq
              q="Et si les saignements continuent longtemps ?"
              a="S’ils dépassent la durée maximale retenue, leur statut religieux peut changer : demande un avis qualifié."
            />
            <Faq
              q="AWA peut-elle dire exactement si mes pertes sont encore du nifas ?"
              a="Non. AWA donne des repères éducatifs généraux et ne délivre ni fatwa ni décision personnalisée."
            />
          </Section>
          <Callout icon="shield-check-outline" title="Un repère, pas une fatwa">
            Les situations personnelles peuvent être différentes. En cas de
            doute, rapproche-toi d’un savant qualifié ou d’une organisation
            religieuse reconnue.
          </Callout>
        </View>
      </ScrollView>
      <ReadingControls
        articleId={ID}
        durationMinutes={6}
        scrollRef={scrollRef}
      />
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>{title}</Text>
      {children}
    </View>
  );
}
function Faq({ q, a }: { q: string; a: string }): React.JSX.Element {
  return (
    <View style={styles.faq}>
      <Text style={styles.faqQ}>{q}</Text>
      <Text style={styles.faqA}>{a}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FCFAFF' },
  heroWrap: { height: 270 },
  hero: { width: '100%', height: '100%' },
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actions: { flexDirection: 'row', gap: 9 },
  circle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.91)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  article: {
    marginTop: -20,
    padding: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#FCFAFF',
  },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: {
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: '#E9E0FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    color: '#6743B6',
    fontSize: 12,
    fontWeight: '800',
  },
  eduBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    backgroundColor: '#FBEFD9',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  eduText: { color: '#9A6A1F', fontSize: 12, fontWeight: '800' },
  title: {
    marginTop: 15,
    color: PURPLE,
    fontFamily: 'serif',
    fontSize: 31,
    lineHeight: 38,
    fontWeight: '800',
  },
  meta: {
    marginTop: 15,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 7,
  },
  metaText: { color: '#7E7392', fontSize: 14 },
  dot: { color: '#7E7392', fontSize: 15 },
  intro: {
    marginTop: 18,
    color: '#342856',
    fontSize: 17,
    lineHeight: 25,
    fontWeight: '600',
  },
  callout: {
    marginTop: 18,
    flexDirection: 'row',
    borderRadius: 19,
    backgroundColor: LAVENDER,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E7DDF7',
  },
  calloutGold: { backgroundColor: '#FBF0DD', borderColor: '#F1DFC0' },
  calloutIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E7DBFA',
  },
  calloutIconGold: { backgroundColor: '#F5E2BD' },
  calloutCopy: { flex: 1, marginLeft: 11 },
  calloutTitle: { color: PURPLE, fontSize: 15, fontWeight: '800' },
  calloutText: { marginTop: 4, color: '#62557B', fontSize: 14, lineHeight: 20 },
  goldText: { color: '#745116' },
  contents: {
    marginTop: 20,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEE8F4',
    padding: 16,
  },
  contentsTitle: {
    color: PURPLE,
    fontFamily: 'serif',
    fontSize: 21,
    fontWeight: '800',
    marginBottom: 8,
  },
  contentRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ECE6F2',
  },
  contentLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 10,
  },
  contentIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0E9FA',
  },
  contentText: { flex: 1, color: '#3F315F', fontSize: 14, lineHeight: 19 },
  section: { marginTop: 30 },
  h2: {
    color: PURPLE,
    fontFamily: 'serif',
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '800',
  },
  body: { marginTop: 11, color: '#382B58', fontSize: 16, lineHeight: 24 },
  question: {
    marginTop: 11,
    color: '#4B386B',
    fontSize: 16,
    fontWeight: '800',
  },
  qa: {
    marginTop: 12,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE5F1',
    padding: 15,
  },
  steps: { marginTop: 15, gap: 9 },
  step: {
    minHeight: 51,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: '#EEE8F4',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9DDF9',
  },
  stepNumberText: { color: '#6743B6', fontWeight: '800' },
  stepText: {
    flex: 1,
    marginLeft: 11,
    color: '#3C2E5A',
    fontSize: 14,
    fontWeight: '700',
  },
  faq: {
    marginTop: 10,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEE8F4',
    padding: 14,
  },
  faqQ: { color: PURPLE, fontSize: 15, fontWeight: '800' },
  faqA: { marginTop: 6, color: '#665B79', fontSize: 14, lineHeight: 20 },
});
