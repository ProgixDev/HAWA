---
name: Google (Material 3) — AWA colors
colors:
  background: "#FCFAFF"  # lavender white, not stark white — theme.colors.background
  foreground: "#2F2258"  # deep violet ink, never flat black — theme.colors.text
  brand: "#6D4AE8"      # Primary — AWA purple, from the logo — theme.colors.primary
  muted: "#746D92"      # Outline/Muted — theme.colors.textSecondary
  border: "rgba(109,74,232,0.14)"  # Outline — theme.colors.border (control borders: roles.outline "#958EAC")
  card: "#FFFFFF"       # Surface — theme.colors.surface (Surface Variant: theme.colors.surfaceSecondary "#F7F3FF")
  accent: "#DC7B82"     # Secondary — AWA rose — theme.colors.secondary
  success: "#3E8E56"    # theme.colors.success
  danger: "#D9534F"     # Error — theme.colors.danger

  dark:
    background: "#12111C"
    foreground: "#F1EFFA"
    muted: "#B3AECB"
    border: "rgba(156,140,224,0.18)"
    card: "#1C1A2B"
    brand: "#9C8CE0"    # brightened purple for dark contrast
    accent: "#6E64A8"
    success: "#6FB58C"
    danger: "#D97C88"

  trueBlack:            # Dark + the True Black switch: only these two values change
    background: "#030304"
    card: "#0B0B10"

typography:
  fontFamily:
    display: "Fraunces"        # 400/500/600 — screen titles only, used sparingly
    sans: "Inter"              # 400/500/600 — lists, descriptions, buttons
    mono: "IBM Plex Mono"      # 400/500 — env vars, checksums, file sizes/dates, secrets
  body:
    fontSize: "16px"
    lineHeight: "1.5"
    fontWeight: "400"
  heading:
    fontWeight: "500"
    letterSpacing: "0"

rounded:
  default: "12px" # M3 uses 12px for cards/buttons by default
  md: "12px"
  lg: "16px"
  full: "9999px"
---

# Design System: Google (Material 3) — AWA colors

## Overview
Material 3 (Material You) is Google’s latest evolution of its design language. It is defined by personalization, accessibility, and an adaptive color system that responds to the user's environment.

## Design Philosophy
1. **Material You:** The brand is the user. The system uses dynamic color extraction to create a unique tonal palette based on the user's wallpaper.
2. **Adaptive Accessibility:** Uses a tonal palette system (0–100) to guarantee contrast ratios across any color combination.
3. **Personal & Expressive:** Moves away from the rigid grid of Material 2 toward softer shapes, larger interactive targets, and playful motion.
4. **Coherent Hierarchy:** Uses three tiers of tokens (Reference, System, Component) to manage complexity across platforms.

## Colors
- **Purple Primary:** Brand color `#6D4AE8` (from the logo) anchors the palette — lavender-tinted neutrals throughout, one calm rose accent, no clashing saturated hues.
- **The Tonal System:** Colors are defined by their luminance rather than just hue. Primary, Secondary, and Tertiary roles each have their own tonal range.
- **Surface Variant:** Used for secondary containers and cards to create subtle depth without relying on heavy shadows.
- **On-Colors:** A strict system where every background color has a corresponding "On" color (e.g., `On Primary`) for high-contrast text and icons.
- **AWA palettes:** the user's context is the chosen palette and appearance mode (System, Light, Dark, optional True Black), not the wallpaper.

### Material 3 roles → AWA tokens
Read colors through `useAwaTokens()` (`theme.colors.*`, `roles.*`). Palettes are defined in `mobile/src/config/awaThemes.ts`; Light, Dark and True Black are resolved in `mobile/src/theme/awaThemeTokens.ts` and `semanticRoles.ts`. Never hard-code the values below. Values are AWA Original.

| Material 3 role (key) | AWA token | Light | Dark |
|---|---|---|---|
| Background (`background`) | `theme.colors.background` → `roles.background` | `#FCFAFF` | `#12111C` |
| Page background | `theme.gradients.pageBackground`, locations 0 · 0.32 · 0.7 · 1 | `#FAF8FD` · `#F4EFFA` · `#EEE7F7` · `#E9E1F3` | `#12111C` · `#181625` · `#1F1D30` · `#242238` |
| On Background / On Surface (`foreground`) | `theme.colors.text` → `roles.onBackground`, `roles.onSurface` | `#2F2258` | `#F1EFFA` |
| Primary (`brand`) | `theme.colors.primary` → `roles.primary` | `#6D4AE8` | `#9C8CE0` |
| On Primary | `roles.onPrimary` | `#FFFFFF` | `#1A1626` |
| Primary Container / On Primary Container | `theme.colors.primarySoft` → `roles.primaryContainer` / `roles.onPrimaryContainer` | `#F7F3FF` / `#2F2258` | `#282544` / `#F1EFFA` |
| Secondary (`accent`) / On Secondary | `theme.colors.secondary` → `roles.secondary` / `roles.onSecondary` | `#DC7B82` / `#1A1626` | `#6E64A8` / `#FFFFFF` |
| Tertiary | not defined in AWA; use Secondary | — | — |
| Surface (`card`) | `theme.colors.surface` → `roles.surface` | `#FFFFFF` | `#1C1A2B` |
| Surface Variant | `theme.colors.surfaceSecondary` → `roles.surfaceVariant` / `roles.surfaceContainer` | `#F7F3FF` | `#242238` |
| On Surface Variant (`muted`) | `theme.colors.textSecondary` → `roles.onSurfaceVariant` | `#746D92` | `#B3AECB` |
| Outline | `roles.outline` (control borders, >= 3:1) | `#958EAC` | `#6B677C` |
| Outline Variant (`border`) | `theme.colors.border` → `roles.outlineVariant` | `rgba(109,74,232,0.14)` | `rgba(156,140,224,0.18)` |
| Error (`danger`) / On Error | `theme.colors.danger` → `roles.error` / `roles.onError` | `#D9534F` / `#1A1626` | `#D97C88` / `#1A1626` |
| Success (`success`) | `theme.colors.success` → `roles.success` | `#3E8E56` | `#6FB58C` |
| Warning | `theme.colors.warning` → `roles.warning` | `#D89A3E` | `#D0A25C` |

- `roles.onPrimary` follows the real luminance of the fill: white on AWA Original Light, the ink `#1A1626` on the lighter palette fills.
- For text, use `roles.accessible.onSurfaceVariant`, `roles.accessible.primaryAsText`, `roles.accessible.dangerText` (and the success / warning equivalents): the same color when it already passes WCAG AA, the smallest shift otherwise.
- AWA's own `theme.colors.accent` is the deep brand ink (`#2F2258` Light, `#C9BEFA` Dark) used for headings and the navigation bar; it is not the Secondary role above.

### Palettes and modes
Six palettes, each with a Light and a Dark variant. AWA Original is free and the default; the other five are Premium (without Premium the theme falls back to AWA Original). **True Black** applies to Dark only: `background` `#030304`, Surface `#0B0B10`, everything else as Dark.

| Palette | Light (primary · secondary · background · surface · text) | Dark (primary · secondary · background · surface · text) |
|---|---|---|
| AWA Original | `#6D4AE8` · `#DC7B82` · `#FCFAFF` · `#FFFFFF` · `#2F2258` | `#9C8CE0` · `#6E64A8` · `#12111C` · `#1C1A2B` · `#F1EFFA` |
| Lavender Night | `#8C74D6` · `#B79CF2` · `#F6F2FE` · `#FFFFFF` · `#2A2145` | `#B79CF2` · `#8C74D6` · `#1C1730` · `#2A2145` · `#F5F1FF` |
| Rose Quartz | `#C08B93` · `#D9AFAE` · `#FBF3F1` · `#FFFFFF` · `#4A2E37` | `#E3B4BC` · `#D9AFAE` · `#241A1C` · `#2E2224` · `#F7EBEA` |
| Sage Serenity | `#7C9473` · `#A9B98F` · `#F6F5EE` · `#FFFFFF` · `#3B3A2E` | `#A9C29E` · `#A9B98F` · `#1C201A` · `#242A21` · `#EFF2EA` |
| Ocean Calm | `#5C8CA6` · `#8FB4C4` · `#F2F7F9` · `#FFFFFF` · `#233238` | `#8FBCD3` · `#8FB4C4` · `#141E22` · `#1B282D` · `#E9F2F5` |
| Warm Sand | `#B08A5C` · `#CBA97C` · `#FAF5EC` · `#FFFFFF` · `#4A3A28` | `#D9B486` · `#CBA97C` · `#221B12` · `#2C2418` · `#F5ECDF` |

Medical, fertility, calendar and spiritual colors stay in their feature files and are not Material roles. The Premium brand colors (gold `#FFD85F`, violet `#4F2A96`) are kept as they are.

## Typography
- **Fraunces (display):** Warm serif, used sparingly for screen titles only. 400/500/600.
- **Inter (body):** Primary workhorse face — lists, descriptions, buttons. 400/500/600.
- **IBM Plex Mono (mono):** Fixed-width — env vars, checksums, file sizes/dates, secrets. 400/500.
- Fonts live in `mobile/assets/fonts/`.

### Font requirements
The three families are free (SIL OFL 1.1, Google Fonts) and are **not bundled in AWA yet**. Coverage was checked glyph by glyph against the app's UI dictionaries (6,185 strings per language, 6,361 in Russian) and its 73 library articles.

| Family | Static files (weights) | fr · en · es · it · de · tr | ru | zh |
|---|---|---|---|---|
| Fraunces | `Fraunces-Regular` 400, `Fraunces-Medium` 500, `Fraunces-SemiBold` 600 (~0.07 MB each) | complete | none (no Cyrillic) | none |
| Inter | `Inter-Regular`, `Inter-Medium`, `Inter-SemiBold` (~0.33 MB each) | complete | complete | none |
| IBM Plex Mono | `IBMPlexMono-Regular` 400, `IBMPlexMono-Medium` 500 (~0.14 MB each) | complete | complete | none |

- **Install:** keep the sources in `mobile/assets/fonts/` and copy the `.ttf` files to `mobile/android/app/src/main/assets/fonts/`. React Native 0.80 resolves `fontFamily` to the file name without extension, and an asset family offers only regular and bold, so each weight is its own family (`fontFamily: "Inter-Medium"`, no `fontWeight`). The alternative is an XML font family in `res/font` registered with `ReactFontManager.addCustomFont` (numeric weights from API 28; `minSdk` is 24).
- **Static weights:** Google Fonts ships Fraunces and Inter as variable fonts (IBM Plex Mono is static). Cut 400/500/600 with `fontTools.varLib.instancer`. Fraunces has no named 500 instance and its defaults are `opsz` 9, `SOFT` 0, `WONK` 1: fix `opsz` and `WONK` once for all three weights. Ship each `OFL.txt` with the files.
- **Fallback:** a glyph missing from the bundled family is drawn per character by the Android system fonts. Chinese is always drawn by the platform CJK font; Russian titles set in Fraunces use the platform face; so do symbols and emoji (✓ → ♡ ⓘ). The language names «Русский» and «简体中文» appear in the language selector of every language.

## Components
- **FAB (Floating Action Button):** Now often larger and square-rounded (`16px`) rather than a perfect circle.
- **Navigation Bar:** A horizontal bottom bar with large, rounded pill-shaped indicators for the active state.
- **Cards:** Feature a standard `12px` rounding and often use the "Surface Variant" color instead of a border.

## Visual Effects
- **Dynamic Color:** The primary visual flourish. The entire UI shifts its hue to match the user's context.
- **Soft Shadows:** Uses very subtle, multi-layered shadows that feel more like "ambient occlusion" than traditional drop shadows.
- **State Layers:** Interactive elements use an overlay (usually `8%` to `12%` opacity) to indicate hover and focus states.
