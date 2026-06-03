# EventBuddy — Design System (React Native / Expo)

> Based on the Airbnb design language, adapted for React Native and Expo.
> Every screen in the app must follow this file exactly.
> When building UI, read this file first. Do not invent colors, spacing, or styles.

---

## 1. Colors

Use these exact hex values everywhere. Never use hardcoded color strings in components — always reference these tokens.

```js
// theme/colors.js
export const colors = {
  // Brand
  primary:          '#ff385c',   // Rausch — main CTA, hearts, brand moments
  primaryActive:    '#e00b41',   // Press / pointer-down state
  primaryDisabled:  '#ffd1da',   // Disabled CTA tint

  // Surfaces
  canvas:           '#ffffff',   // Default page/screen background
  surfaceSoft:      '#f7f7f7',   // Subtle fill — disabled fields, filter bands
  surfaceStrong:    '#f2f2f2',   // Icon button backgrounds

  // Borders
  hairline:         '#dddddd',   // Default 1px dividers, card outlines
  hairlineSoft:     '#ebebeb',   // Light separators
  borderStrong:     '#c1c1c1',   // Disabled input outlines

  // Text
  ink:              '#222222',   // Headlines, body, primary nav — never pure black
  body:             '#3f3f3f',   // Long-form copy, review text
  muted:            '#6a6a6a',   // Sub-titles, inactive tabs, footer labels
  mutedSoft:        '#929292',   // Disabled link text
  onPrimary:        '#ffffff',   // White text on Rausch CTAs

  // Semantic
  error:            '#c13515',   // Form validation errors
  errorHover:       '#b32505',

  // Scrim
  scrim:            'rgba(0,0,0,0.50)',  // Modal backdrop
};
```

**Usage rules:**
- `primary` (#ff385c) appears max 1–2 times per screen — the single CTA button and active icons only
- 90% of every screen is `canvas` (white) + `ink` (near-black)
- Never use raw red, blue, or green — always use the tokens above
- No dark mode in the app

---

## 2. Typography

Load the font in `app/_layout.tsx` using `expo-font`. If Airbnb Cereal is unavailable, use **Inter** as the substitute.

```js
// theme/typography.js
export const fonts = {
  regular:      'Inter_400Regular',
  medium:       'Inter_500Medium',
  semiBold:     'Inter_600SemiBold',
  bold:         'Inter_700Bold',
};

export const typography = {
  // Display
  displayXl:   { fontSize: 28, fontFamily: fonts.bold,     lineHeight: 40 },  // Screen h1
  displayLg:   { fontSize: 22, fontFamily: fonts.medium,   lineHeight: 26 },  // Section title
  displayMd:   { fontSize: 21, fontFamily: fonts.bold,     lineHeight: 30 },  // Card section heads
  displaySm:   { fontSize: 20, fontFamily: fonts.semiBold, lineHeight: 24 },  // Sub-section titles
  ratingDisplay: { fontSize: 64, fontFamily: fonts.bold,   lineHeight: 70 },  // Rating numbers

  // Titles
  titleMd:     { fontSize: 16, fontFamily: fonts.semiBold, lineHeight: 20 },  // Card titles
  titleSm:     { fontSize: 16, fontFamily: fonts.medium,   lineHeight: 20 },  // Section heads

  // Body
  bodyMd:      { fontSize: 16, fontFamily: fonts.regular,  lineHeight: 24 },  // Running text
  bodySm:      { fontSize: 14, fontFamily: fonts.regular,  lineHeight: 20 },  // Card meta, dates, prices

  // UI
  caption:     { fontSize: 14, fontFamily: fonts.medium,   lineHeight: 18 },  // Field labels (Where / When)
  captionSm:   { fontSize: 13, fontFamily: fonts.regular,  lineHeight: 16 },  // Legal, footer fine print
  badge:       { fontSize: 11, fontFamily: fonts.semiBold, lineHeight: 13 },  // Floating badges
  microLabel:  { fontSize: 12, fontFamily: fonts.bold,     lineHeight: 16 },  // Amenity micro-labels
  uppercaseTag:{ fontSize: 8,  fontFamily: fonts.bold,     lineHeight: 10, letterSpacing: 0.32, textTransform: 'uppercase' }, // "NEW" tags
  buttonMd:    { fontSize: 16, fontFamily: fonts.medium,   lineHeight: 20 },  // Primary CTAs
  buttonSm:    { fontSize: 14, fontFamily: fonts.medium,   lineHeight: 20 },  // Pill / chip buttons
  navLink:     { fontSize: 16, fontFamily: fonts.semiBold, lineHeight: 20 },  // Tab labels
};
```

**Principles:**
- Display weights are intentionally modest — photography and cards carry visual hierarchy, not type
- The only loud typographic moment is `ratingDisplay` (64px/bold) — trust signals only
- Body text at 16px / 400 for readability on mobile

---

## 3. Spacing

```js
// theme/spacing.js
export const spacing = {
  xxs:     2,
  xs:      4,
  sm:      8,
  md:      12,
  base:    16,
  lg:      24,
  xl:      32,
  xxl:     48,
  section: 64,   // Major screen section padding
};
```

**Usage rules:**
- Card internal padding: `spacing.lg` (24) for host/reservation cards; `spacing.base` (16) for property card meta
- Between cards in a list: `spacing.base` (16)
- Between chips/tags: `spacing.sm` (8)
- Section vertical padding: `spacing.section` (64) for major bands; compress card grids to `spacing.base` (16) gap

---

## 4. Border Radius

```js
// theme/radius.js
export const radius = {
  sm:   8,     // Buttons, text inputs
  md:   14,    // Cards, modals, bottom sheets
  lg:   20,    // Larger cards
  xl:   32,    // Category strip chips
  full: 9999,  // Pills, search bar, avatars, orbs
};
```

**Shape language:** There are no hard corners anywhere. Every interactive element is rounded. The search bar and avatar are always `radius.full`.

---

## 5. Shadows

React Native uses platform-split shadow props. Use the same shadow tier everywhere — there is only one level of elevation in this system.

```js
// theme/shadows.js
import { Platform } from 'react-native';

export const shadow = {
  card: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
    },
    android: {
      elevation: 3,
    },
  }),

  // Hover-equivalent on mobile = pressed/focused state
  cardHover: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 10,
    },
    android: {
      elevation: 6,
    },
  }),
};
```

**Elevation rules:**
- 95% of surfaces are flat (no shadow)
- Cards get `shadow.card` — applied to property cards, search bar, dropdown sheets
- Floating badges get `shadow.cardHover`
- Never stack multiple shadow tiers

---

## 6. Components

### Buttons

```js
// Primary — Rausch fill
buttonPrimary: {
  backgroundColor: colors.primary,
  borderRadius: radius.sm,          // 8px
  height: 48,
  paddingHorizontal: spacing.lg,    // 24
  alignItems: 'center',
  justifyContent: 'center',
},
buttonPrimaryLabel: {
  ...typography.buttonMd,
  color: colors.onPrimary,
},

// Secondary — white with ink outline
buttonSecondary: {
  backgroundColor: colors.canvas,
  borderRadius: radius.sm,
  height: 48,
  borderWidth: 1,
  borderColor: colors.ink,
  paddingHorizontal: spacing.lg,
  alignItems: 'center',
  justifyContent: 'center',
},

// Tertiary — text only, no surface
buttonTertiary: {
  backgroundColor: 'transparent',
  paddingVertical: spacing.xs,
},
buttonTertiaryLabel: {
  ...typography.bodySm,
  color: colors.ink,
  textDecorationLine: 'underline',
},

// Pill — fully rounded CTA
buttonPill: {
  backgroundColor: colors.primary,
  borderRadius: radius.full,
  paddingVertical: spacing.sm,      // 10
  paddingHorizontal: spacing.lg,    // 24 (approx 20px original)
},
```

### Search Bar

```js
searchBar: {
  backgroundColor: colors.canvas,
  borderRadius: radius.full,
  height: 56,
  borderWidth: 1,
  borderColor: colors.hairline,
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: spacing.base,
  ...shadow.card,
},

// The red search button inside the bar
searchOrb: {
  width: 40,
  height: 40,
  borderRadius: radius.full,
  backgroundColor: colors.primary,
  alignItems: 'center',
  justifyContent: 'center',
},
```

### Cards

```js
// Property / Event Card
propertyCard: {
  backgroundColor: colors.canvas,
  borderRadius: radius.md,          // 14px
  overflow: 'hidden',
  marginBottom: spacing.base,
  ...shadow.card,
},

// Card image: aspect ratio 1:1 (or 4:5 for experience cards)
cardImage: {
  width: '100%',
  aspectRatio: 1,
  borderTopLeftRadius: radius.md,
  borderTopRightRadius: radius.md,
},

// Meta block beneath image
cardMeta: {
  padding: spacing.base,            // 16
},
cardTitle: {
  ...typography.titleMd,
  color: colors.ink,
  marginBottom: spacing.xs,
},
cardSubtext: {
  ...typography.bodySm,
  color: colors.muted,
},

// Floating badge on card image (top-left)
guestFavoriteBadge: {
  position: 'absolute',
  top: spacing.sm,
  left: spacing.sm,
  backgroundColor: colors.canvas,
  borderRadius: radius.full,
  paddingVertical: 4,
  paddingHorizontal: spacing.sm,
  ...shadow.cardHover,
},
guestFavoriteBadgeText: {
  ...typography.badge,
  color: colors.ink,
},

// Heart save icon (top-right)
heartButton: {
  position: 'absolute',
  top: spacing.sm,
  right: spacing.sm,
  width: 32,
  height: 32,
  borderRadius: radius.full,
  alignItems: 'center',
  justifyContent: 'center',
},
heartActive:   { color: colors.primary },
heartInactive: { color: colors.canvas  },
```

### Form Inputs

```js
textInput: {
  backgroundColor: colors.canvas,
  borderRadius: radius.sm,          // 8px
  height: 56,
  borderWidth: 1,
  borderColor: colors.hairline,
  paddingHorizontal: spacing.base,
  ...typography.bodyMd,
  color: colors.ink,
},

// Focus state — border becomes 2px ink
textInputFocused: {
  borderWidth: 2,
  borderColor: colors.ink,
},

// Label above input
inputLabel: {
  ...typography.caption,
  color: colors.muted,
  marginBottom: spacing.xs,
},

// Error state
textInputError: {
  borderColor: colors.error,
},
inputErrorText: {
  ...typography.bodySm,
  color: colors.error,
  marginTop: spacing.xs,
},
```

### Category Chips / Tag Pills

```js
chip: {
  backgroundColor: colors.surfaceSoft,
  borderRadius: radius.xl,           // 32px
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.md,
  marginRight: spacing.sm,
},
chipActive: {
  backgroundColor: colors.ink,
},
chipLabel: {
  ...typography.buttonSm,
  color: colors.ink,
},
chipLabelActive: {
  color: colors.canvas,
},
```

### Bottom Navigation

```js
tabBar: {
  backgroundColor: colors.canvas,
  borderTopWidth: 1,
  borderTopColor: colors.hairline,
  height: 64,
  paddingBottom: spacing.sm,
},
tabIcon: {
  size: 24,
},
tabIconActive:   { color: colors.ink },
tabIconInactive: { color: colors.muted },
// No text labels — icons only
```

### Avatar

```js
avatar: {
  borderRadius: radius.full,
  backgroundColor: colors.surfaceStrong,
},
avatarSm:  { width: 32,  height: 32  },
avatarMd:  { width: 48,  height: 48  },
avatarLg:  { width: 64,  height: 64  },
avatarXl:  { width: 96,  height: 96  },
```

### Dividers

```js
divider: {
  height: 1,
  backgroundColor: colors.hairline,
  marginVertical: spacing.lg,
},
dividerSoft: {
  height: 1,
  backgroundColor: colors.hairlineSoft,
  marginVertical: spacing.md,
},
```

---

## 7. Screen Layout Rules

```js
// Every screen's root container
screenContainer: {
  flex: 1,
  backgroundColor: colors.canvas,
},

// Standard horizontal padding for screen content
screenPadding: {
  paddingHorizontal: spacing.base,  // 16
},

// Section vertical spacing
sectionSpacing: {
  paddingVertical: spacing.section, // 64 for major bands
},
```

**Layout principles:**
- Header / hero bands: 64px vertical padding
- Card grids: 16px gap between cards — dense but not cramped
- Contrast: open header → dense card grid below = marketplace feel
- Lists: use `FlatList` or `ScrollView` with `contentContainerStyle={{ paddingBottom: spacing.xxl }}`
- Safe area: always wrap screens in `SafeAreaView` from `react-native-safe-area-context`

---

## 8. Touch Targets

| Element | Min Size | Notes |
|---|---|---|
| Primary CTA button | 48 × 48px | Full-width preferred |
| Search orb | 40 × 40px | Inside search bar |
| Heart save button | 32 × 32px | With 12px padding inside card |
| Tab bar icons | 48 × 48px touch area | |
| Date picker cells | 40 × 40px circular | |
| All tappable rows | min 48px height | |

---

## 9. Responsive Breakpoints (React Native)

Use `Dimensions.get('window').width` or `useWindowDimensions()`.

```js
export const breakpoints = {
  mobile: 0,    // < 744 — 1-column, stacked
  tablet: 744,  // 744–1128 — 2-column grids
  desktop: 1128 // > 1128 — 4-column grids (iPad large / web)
};
```

**Mobile (default — build first):**
- Cards: 1-column full width
- Search bar: full-width tappable pill → opens search overlay
- Bottom tab bar: 5 icons, no labels
- All lists: vertical scroll

**Tablet (iPad):**
- Cards: 2-column grid
- Search bar: full pill with all segments visible
- Tab bar: same as mobile

---

## 10. Animation Principles

- Transitions: `duration: 200ms`, `easing: Easing.out(Easing.ease)`
- Card press: `scale: 0.97` via `Animated.spring` or `Pressable` with feedback
- Modal: slide up from bottom, `duration: 300ms`
- Skeleton loaders: use `opacity` pulse `0.3 → 1 → 0.3`, `duration: 1000ms`, looping
- No dramatic animations — subtle and fast. The design trusts content, not motion.

---

## 11. Icons

Use **`@expo/vector-icons`** (Ionicons or Feather). Key icons:

| Use | Icon name (Ionicons) |
|---|---|
| Home | `home-outline` / `home` |
| Explore/Map | `map-outline` / `map` |
| Buddies | `people-outline` / `people` |
| Saved | `bookmark-outline` / `bookmark` |
| Profile | `person-outline` / `person` |
| Search | `search-outline` |
| Heart / Save | `heart-outline` / `heart` (fill = primary color) |
| Back arrow | `arrow-back` |
| Close | `close` |
| Location pin | `location-outline` |
| Calendar | `calendar-outline` |
| Star | `star` / `star-outline` |
| Chat | `chatbubble-outline` |
| Shield / Verified | `shield-checkmark-outline` |
| Settings | `settings-outline` |
| Share | `share-social-outline` |
| Add | `add-circle-outline` |

---

## 12. Key Don'ts

- ❌ Never hardcode `#ff0000`, `blue`, `black`, `white` — use tokens
- ❌ Never use `fontWeight: 'bold'` alone — use the `fonts.bold` family
- ❌ Never add heavy drop shadows — only `shadow.card` tier
- ❌ Never use hard corners (`borderRadius: 0`) on interactive elements
- ❌ Never use more than one instance of `colors.primary` as a background per screen
- ❌ Never build custom components for buttons, inputs, or cards — build shared components once and reuse
- ❌ Never skip `SafeAreaView` on any screen

---

*Design system for EventBuddy v1.0 — Airbnb-inspired, React Native / Expo.*