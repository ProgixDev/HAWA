import React, {memo, useEffect, useRef, useState} from 'react';
import {AccessibilityInfo, Animated, Easing, I18nManager, Pressable, StyleSheet, Text, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {Defs, Ellipse, LinearGradient as SvgGradient, Path, Polygon, Stop} from 'react-native-svg';

// AWA Premium promo card (Profile): a fixed brand-identity surface (dark violet, lavender button) that is the same in every theme, like the
// Premium sheet. A drawn diamond floats gently, its sparkles twinkle, its orbit ring breathes and a soft light sweeps across the button.
// Every loop stops when the phone asks for reduced motion. Nothing here touches the Premium state: it only shows what it is given.

type Props = {
  title: string;
  subtitle: string;
  buttonLabel: string;
  accessibilityLabel: string;
  accessibilityHint: string;
  onPress: () => void;
};

const INK = '#2A1058';
const BUTTON_BG = '#E6DAFF';

// A four-point sparkle, centred on (0, 0) in a 2r box.
const sparklePath = (r: number): string => `M0 ${-r} Q${r * 0.12} ${-r * 0.12} ${r} 0 Q${r * 0.12} ${r * 0.12} 0 ${r} Q${-r * 0.12} ${r * 0.12} ${-r} 0 Q${-r * 0.12} ${-r * 0.12} 0 ${-r} Z`;

function Sparkle({x, y, size, delay, still}: {x: number; y: number; size: number; delay: number; still: boolean}): React.JSX.Element {
  const twinkle = useRef(new Animated.Value(still ? 1 : 0.25)).current;
  useEffect(() => {
    if (still) {
      twinkle.setValue(1);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(twinkle, {toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
        Animated.timing(twinkle, {toValue: 0.25, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delay, still, twinkle]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.sparkle, {left: x - size, top: y - size, opacity: twinkle, transform: [{scale: twinkle.interpolate({inputRange: [0.25, 1], outputRange: [0.7, 1.1]})}]}]}>
      <Svg height={size * 2} width={size * 2} viewBox={`${-size} ${-size} ${size * 2} ${size * 2}`}>
        <Path d={sparklePath(size)} fill="#FFFFFF" />
      </Svg>
    </Animated.View>
  );
}

function Diamond(): React.JSX.Element {
  return (
    <Svg height={86} width={100} viewBox="0 0 100 86">
      <Defs>
        <SvgGradient id="gemTop" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#E9D8FF" />
          <Stop offset="1" stopColor="#A978F2" />
        </SvgGradient>
        <SvgGradient id="gemLeft" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#B88CFF" />
          <Stop offset="1" stopColor="#6B3DD0" />
        </SvgGradient>
        <SvgGradient id="gemRight" x1="1" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#9566F0" />
          <Stop offset="1" stopColor="#4C27A6" />
        </SvgGradient>
        <SvgGradient id="gemCenter" x1="0.5" y1="0" x2="0.5" y2="1">
          <Stop offset="0" stopColor="#C9A8FF" />
          <Stop offset="1" stopColor="#7A4BE0" />
        </SvgGradient>
      </Defs>
      {/* girdle band, then pavilion facets, then the crown */}
      <Polygon fill="url(#gemLeft)" points="8,30 50,80 33,30" />
      <Polygon fill="url(#gemCenter)" points="33,30 50,80 67,30" />
      <Polygon fill="url(#gemRight)" points="92,30 50,80 67,30" />
      <Polygon fill="url(#gemTop)" points="8,30 22,10 33,30" />
      <Polygon fill="#F4EAFF" opacity={0.95} points="22,10 40,10 33,30" />
      <Polygon fill="#D9BFFF" points="40,10 60,10 67,30 33,30" />
      <Polygon fill="#C7A5FF" points="60,10 78,10 67,30" />
      <Polygon fill="url(#gemRight)" opacity={0.85} points="78,10 92,30 67,30" />
      <Path d="M8 30 L22 10 L78 10 L92 30 L50 80 Z" fill="none" stroke="#F3E8FF" strokeLinejoin="round" strokeOpacity={0.75} strokeWidth={1.2} />
      <Path d="M8 30 L92 30 M33 30 L40 10 M67 30 L60 10 M33 30 L50 80 M67 30 L50 80" fill="none" stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={0.8} />
    </Svg>
  );
}

function PremiumPromoCardBase({title, subtitle, buttonLabel, accessibilityLabel, accessibilityHint, onPress}: Props): React.JSX.Element {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [buttonWidth, setButtonWidth] = useState(0);
  const float = useRef(new Animated.Value(0)).current;
  const orbit = useRef(new Animated.Value(0)).current;
  const sweep = useRef(new Animated.Value(0)).current;
  const wave = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then(reduce => {
        if (active) {
          setReduceMotion(reduce);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      return undefined;
    }
    const loops = [
      Animated.loop(
        Animated.sequence([
          Animated.timing(float, {toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
          Animated.timing(float, {toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
        ]),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(orbit, {toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
          Animated.timing(orbit, {toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
        ]),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.delay(1800),
          Animated.timing(sweep, {toValue: 1, duration: 1300, easing: Easing.inOut(Easing.cubic), useNativeDriver: true}),
          Animated.timing(sweep, {toValue: 0, duration: 0, useNativeDriver: true}),
        ]),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(wave, {toValue: 1, duration: 4200, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
          Animated.timing(wave, {toValue: 0, duration: 4200, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
        ]),
      ),
    ];
    loops.forEach(loop => loop.start());
    return () => loops.forEach(loop => loop.stop());
  }, [float, orbit, reduceMotion, sweep, wave]);

  const sweepWidth = 90;
  const sweepX = sweep.interpolate({inputRange: [0, 1], outputRange: [-sweepWidth, Math.max(buttonWidth, sweepWidth) + sweepWidth]});

  return (
    <Pressable accessibilityHint={accessibilityHint} accessibilityLabel={accessibilityLabel} accessibilityRole="button" onPress={onPress}>
      <LinearGradient
        colors={['#46209A', '#2D1362', '#1C0C40']}
        end={{x: 1, y: 1}}
        locations={[0, 0.55, 1]}
        start={{x: 0, y: 0}}
        style={styles.card}>
        {/* a soft lighter wave in the lower right corner, drifting very slowly */}
        <Animated.View
          pointerEvents="none"
          style={[styles.wave, {opacity: wave.interpolate({inputRange: [0, 1], outputRange: [0.5, 0.85]}), transform: [{translateX: wave.interpolate({inputRange: [0, 1], outputRange: [0, -8]})}]}]}
        />
        <Animated.View
          pointerEvents="none"
          style={[styles.glow, {opacity: orbit.interpolate({inputRange: [0, 1], outputRange: [0.35, 0.7]})}]}
        />

        <View style={[styles.topRow, I18nManager.isRTL && styles.topRowRtl]}>
          <View style={styles.gemBox}>
            <Animated.View style={{transform: [{translateY: float.interpolate({inputRange: [0, 1], outputRange: [3, -3]})}]}}>
              <Diamond />
            </Animated.View>
            <Animated.View pointerEvents="none" style={[styles.orbitWrap, {opacity: orbit.interpolate({inputRange: [0, 1], outputRange: [0.55, 1]})}]}>
              <Svg height={40} width={116} viewBox="0 0 116 40">
                <Ellipse cx={58} cy={20} fill="none" rx={55} ry={11} stroke="#F2A9FF" strokeOpacity={0.9} strokeWidth={1.4} transform="rotate(-9 58 20)" />
              </Svg>
            </Animated.View>
            <Sparkle delay={0} size={7} still={reduceMotion} x={22} y={10} />
            <Sparkle delay={500} size={4} still={reduceMotion} x={96} y={30} />
            <Sparkle delay={1000} size={6} still={reduceMotion} x={96} y={92} />
            <Sparkle delay={300} size={3} still={reduceMotion} x={6} y={46} />
          </View>

          <View style={styles.divider} />

          <View style={styles.copy}>
            <Text adjustsFontSizeToFit minimumFontScale={0.6} numberOfLines={1} style={styles.title}>
              {title}
            </Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
        </View>

        <View onLayout={event => setButtonWidth(event.nativeEvent.layout.width)} style={styles.button}>
          <Text numberOfLines={1} style={styles.buttonText}>
            {buttonLabel}
          </Text>
          <Animated.View pointerEvents="none" style={[styles.sweep, {width: sweepWidth, transform: [{translateX: sweepX}, {skewX: '-18deg'}]}]}>
            <LinearGradient
              colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.65)', 'rgba(255,255,255,0)']}
              end={{x: 1, y: 0}}
              start={{x: 0, y: 0}}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    marginTop: 16,
    marginBottom: 18,
    padding: 16,
    borderWidth: 1.4,
    borderColor: 'rgba(190,150,255,0.75)',
    borderRadius: 22,
    shadowColor: '#251059',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 5},
    elevation: 5,
  },
  wave: {
    position: 'absolute',
    right: -70,
    bottom: -60,
    width: 210,
    height: 150,
    borderTopLeftRadius: 150,
    borderRadius: 90,
    backgroundColor: 'rgba(140,100,235,0.28)',
  },
  glow: {
    position: 'absolute',
    left: -40,
    top: -40,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(170,120,255,0.20)',
  },
  sparkle: {position: 'absolute'},
  topRow: {flexDirection: 'row', alignItems: 'center'},
  topRowRtl: {flexDirection: 'row-reverse'},
  gemBox: {width: 108, height: 100, alignItems: 'center', justifyContent: 'center'},
  orbitWrap: {position: 'absolute', left: -4, top: 44},
  divider: {width: StyleSheet.hairlineWidth * 2, alignSelf: 'stretch', marginHorizontal: 10, marginVertical: 6, backgroundColor: 'rgba(214,190,255,0.35)'},
  copy: {flex: 1, minWidth: 0},
  title: {color: '#FFFFFF', fontFamily: 'serif', fontSize: 22, fontWeight: '600'},
  subtitle: {marginTop: 6, color: '#EADFFF', fontSize: 13, lineHeight: 19},
  button: {
    overflow: 'hidden',
    minHeight: 52,
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: 26,
    backgroundColor: BUTTON_BG,
  },
  buttonText: {color: INK, fontSize: 17, fontWeight: '800'},
  sweep: {position: 'absolute', top: 0, bottom: 0, left: 0},
});

export const PremiumPromoCard = memo(PremiumPromoCardBase);
