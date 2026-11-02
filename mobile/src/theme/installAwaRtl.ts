import {I18nManager, Platform, StyleSheet, type TextStyle} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

// RIGHT-TO-LEFT ICONS. Every icon in AWA is a MaterialDesignIcons glyph. Under a right-to-left layout (Arabic) the DIRECTIONAL glyphs — chevrons,
// arrows, previous / next — must point the other way: a "back" chevron-left becomes a chevron pointing right, and a month calendar whose previous
// button now sits on the right keeps "previous" pointing away from the grid. This layer mirrors them in one place instead of in the ~270 files that
// draw icons. It does nothing at all while the layout is left-to-right, so the other 62 languages are untouched.
//
// Not mirrored: every glyph that is not a left/right pointer (logos, medical or object icons, clocks, charts ...), and bidirectional arrows
// (arrow-left-right). A call site that must keep a fixed direction passes `style={{transform: [{scaleX: 1}]}}`-free artwork or a non-directional glyph.

const DIRECTIONAL = /^(?:chevron|arrow)(?:-double)?-(?:left|right)(?:-(?!left|right)[a-z0-9]+)*$|^skip-(?:next|previous)(?:-[a-z]+)*$|^step-(?:forward|backward)(?:-[0-9]+)?$|^(?:undo|redo)(?:-variant)?$|^page-(?:first|last)$|^format-(?:indent|unindent)-(?:increase|decrease)$/;

export const isDirectionalIconName = (name: unknown): boolean => typeof name === 'string' && DIRECTIONAL.test(name);

type IconRenderable = {render?: (props: Record<string, unknown>, ref: unknown) => unknown; __awaRtl?: boolean};

/** Wraps the icon component's render so directional glyphs are mirrored while the layout is right-to-left (exported for tests). Returns the remover. */
export function patchAwaIconMirror(component: IconRenderable): () => void {
  const original = component.render;
  if (typeof original !== 'function' || component.__awaRtl) {
    return () => undefined;
  }
  component.__awaRtl = true;
  component.render = function awaIconRender(this: unknown, props: Record<string, unknown>, ref: unknown) {
    if (I18nManager.isRTL && isDirectionalIconName(props.name)) {
      // the glyph's own transform (a rotated chevron …) is kept: the mirror is appended to it, not substituted for it
      const flat = StyleSheet.flatten(props.style as TextStyle) ?? {};
      const existing = Array.isArray(flat.transform) ? flat.transform : [];
      const next = {...props, style: [flat, {transform: [...existing, {scaleX: -1}]}]};
      return original.call(this, next, ref);
    }
    return original.call(this, props, ref);
  };
  return () => {
    component.render = original;
    component.__awaRtl = false;
  };
}

/** Installs the right-to-left icon mirroring (Android only, like the typography layer). */
export function installAwaRtl(): () => void {
  if (Platform.OS !== 'android') {
    return () => undefined;
  }
  return patchAwaIconMirror(MaterialDesignIcons as unknown as IconRenderable);
}
