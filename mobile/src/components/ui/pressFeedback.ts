import type {PressableProps, PressableStateCallbackType, StyleProp, ViewStyle} from 'react-native';

import {compositeOver, parseColor, toHex} from '../../theme/contrast';
import {stateLayer} from '../../theme/semanticRoles';

// Pressed feedback for the shared components (decision D2): a subtle Material 3 state layer with an opacity fallback.
// No Android ripple and NO extra overlay view: the layer is folded into the pressable's own background colour, so a
// component never adds a host node or a nested Pressable.

/** Opacity used when a state layer cannot be computed (an unparsable colour). Legacy values range 0.72 – 0.85. */
export const PRESSED_FALLBACK_OPACITY = 0.82;

/**
 * The style to apply while pressed.
 * @param base      the component's resting background colour, or `undefined` / 'transparent' when it has none
 * @param layerColor the colour of the content on top of the surface (Material: the state layer uses the content colour)
 */
export function pressedStyle(base: string | undefined, layerColor: string): ViewStyle {
  try {
    if (base === undefined || base === 'transparent') {
      return {backgroundColor: stateLayer(layerColor, 'pressed')};
    }
    const resting = parseColor(base);
    if (resting.a < 1) {
      // translucent resting colour (e.g. an alpha tint): put the layer on top of it by stacking alpha, not by compositing
      return {backgroundColor: stateLayer(layerColor, 'pressed')};
    }
    return {backgroundColor: toHex(compositeOver(stateLayer(layerColor, 'pressed'), base))};
  } catch {
    return {opacity: PRESSED_FALLBACK_OPACITY};
  }
}

/** A Pressable `style` prop (object or function) resolved for one interaction state. */
export function resolvePressableStyle(
  style: PressableProps['style'],
  state: PressableStateCallbackType,
): StyleProp<ViewStyle> {
  return typeof style === 'function' ? style(state) : style;
}
