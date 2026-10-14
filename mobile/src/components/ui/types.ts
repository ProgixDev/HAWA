import type {AwaRoles} from '../../theme/semanticRoles';

// Shared types for the Phase 2 UI components (src/components/ui). Nothing here talks to a screen or a feature.

/** Colour roles a UI component may be asked for. All of them exist on `AwaRoles` (Phase 1). */
export type AwaColorRole =
  | 'onSurface'
  | 'onSurfaceVariant'
  | 'onBackground'
  | 'primary'
  | 'onPrimary'
  | 'onPrimaryContainer'
  | 'error'
  | 'onError'
  | 'success'
  | 'warning'
  | 'inverseOnSurface';

/** Legacy font weights an existing screen may need to keep while it is migrated (D4). */
export type AwaLegacyWeight = '400' | '500' | '600' | '700' | '800' | '900';

/**
 * The colour for a role. With `accessible` (the default, decision D3) the roles that are not WCAG-AA-safe on every
 * palette resolve to their AA-safe companion from `roles.accessible`; the raw token is returned when `accessible` is
 * false or when the role has no companion.
 */
export function resolveColorRole(roles: AwaRoles, role: AwaColorRole, accessible: boolean = true): string {
  if (accessible) {
    switch (role) {
      case 'onSurfaceVariant':
        return roles.accessible.onSurfaceVariant;
      case 'primary':
        return roles.accessible.primaryAsText;
      case 'success':
        return roles.accessible.successText;
      case 'warning':
        return roles.accessible.warningText;
      case 'error':
        return roles.accessible.dangerText;
      default:
        break;
    }
  }
  return roles[role];
}
