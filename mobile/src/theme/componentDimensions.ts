// PROPOSED component dimensions for AWA (Phase 1, additive, ISOLATED).
//
// EVERY value in this file is a PROPOSAL. The Material 3 JSON export (material3-tokens-normalized.json) contains NO
// component dimensions — it only has colours, the type scale, font theme and corner radii. The numbers below come from
// the published Material 3 component guidance as the author understands it, plus AWA observations, and have NOT been
// verified against the official Figma kit (.fig) or m3.material.io. Do not treat them as official Material 3
// specifications, and do not apply them to a screen without that verification and an explicit approval.
//
// Consumed by: nothing in the application yet.

import {awaShapes, type AwaShapeToken} from './shapes';

export type AwaDimensionProvenance = 'proposal-m3-docs-unverified' | 'proposal-awa-decision' | 'observed-in-awa';

export type AwaDimensionProposal = {
  readonly provenance: AwaDimensionProvenance;
  /** Always false in this file: nothing here is verified against the official kit. */
  readonly verified: false;
  /** Short human note. */
  readonly note: string;
};

export type AwaButtonHeightProposal = AwaDimensionProposal & {
  readonly compact: number;
  readonly default: number;
  readonly large: number;
};

export type AwaNumberProposal = AwaDimensionProposal & {readonly value: number};
export type AwaShapeProposal = AwaDimensionProposal & {readonly shape: AwaShapeToken; readonly radius: number};

const shape = (token: AwaShapeToken, provenance: AwaDimensionProvenance, note: string): AwaShapeProposal => ({
  provenance,
  verified: false,
  note,
  shape: token,
  radius: awaShapes[token],
});

const value = (n: number, provenance: AwaDimensionProvenance, note: string): AwaNumberProposal => ({
  provenance,
  verified: false,
  note,
  value: n,
});

export const AWA_COMPONENT_DIMENSION_PROPOSALS = {
  button: {
    // Corrected in Phase 2: only `compact` (40) corresponds to the published Material 3 container height, and even that
    // is UNVERIFIED against the kit. `default` (48) and `large` (56) are AWA-SPECIFIC proposals (they mirror the
    // 48 dp touch target and AWA's observed primary CTAs); they are not Google specifications.
    provenance: 'proposal-awa-decision',
    verified: false,
    note: 'compact 40 mirrors the published M3 container height (unverified); default 48 and large 56 are AWA proposals. AWA CTAs observed today: minHeight 42, 50, 52, 54, 56, 57, 60, 65.',
    compact: 40,
    default: 48,
    large: 56,
  } as AwaButtonHeightProposal,
  buttonShape: shape('full', 'proposal-m3-docs-unverified', 'Pill buttons. Observed radii today: 12–27.'),
  iconButtonTouchTarget: value(48, 'proposal-m3-docs-unverified', 'Visual 40, touch target 48. Observed boxes: 40/42/44/46.'),
  iconButtonVisual: value(40, 'proposal-m3-docs-unverified', 'Visual box of an icon button.'),
  textFieldHeight: value(56, 'proposal-m3-docs-unverified', 'Observed minHeight today: 48–62.'),
  textFieldShape: shape('medium', 'proposal-awa-decision', 'Observed radii today: 13–16.'),
  chipHeight: value(32, 'proposal-m3-docs-unverified', 'Filter / assist chip.'),
  chipShape: shape('small', 'proposal-m3-docs-unverified', 'Chip corners.'),
  listItemOneLineMinHeight: value(56, 'proposal-m3-docs-unverified', 'One-line list item.'),
  switchWidth: value(52, 'proposal-m3-docs-unverified', 'The app uses the native Switch today.'),
  switchHeight: value(32, 'proposal-m3-docs-unverified', 'The app uses the native Switch today.'),
  cardShape: shape('medium', 'proposal-awa-decision', 'Observed card radii today: 18–28 (homeRadii.card = 26).'),
  cardPadding: value(16, 'proposal-awa-decision', 'Observed card padding today: 10–18.'),
  sheetShape: shape('extraLarge', 'proposal-m3-docs-unverified', 'Bottom sheet / dialog top corners.'),
  dialogShape: shape('extraLarge', 'proposal-m3-docs-unverified', 'Dialogs.'),
  topBarHeight: value(64, 'proposal-m3-docs-unverified', 'AWA uses custom headers.'),
  // The floating tab bar is an AWA component; its pill height is read by getFloatingTabBarClearance (spacing.ts).
  floatingTabBarPill: value(58, 'observed-in-awa', 'CustomBottomTabBar pill height; documented exception, do not change.'),
} as const;

export type AwaComponentDimensionKey = keyof typeof AWA_COMPONENT_DIMENSION_PROPOSALS;

export const AWA_COMPONENT_DIMENSION_KEYS = Object.keys(AWA_COMPONENT_DIMENSION_PROPOSALS) as AwaComponentDimensionKey[];
