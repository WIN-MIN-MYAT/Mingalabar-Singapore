# Light/Dark Mode + EN/Burmese for Feed, Community & Chat

**Date:** 2026-06-28
**Status:** Approved (design)
**Author:** lofi-tf

## Goal

Extend the app's existing theming (`ThemeContext`) and internationalization (`I18nContext`) system to the last unconverted user-facing surfaces: the Feed, Community, and Chat areas. After this work, every screen a user reaches from the tab bar responds to the light/dark/system appearance setting and to the English/Burmese language setting — with no hardcoded hex colors or inline English UI strings left in these surfaces.

## Context — the established pattern

Four screens are already converted and define the convention to follow:
`HomeScreen`, `GuideScreen`, `SettingsScreen`, `FindFriendsScreen` (plus the shared `CustomTabBar`).

Canonical pattern (see `screens/SettingsScreen.js`):

```js
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';

function createStyles(c, f) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    title: { fontFamily: f.bold, color: c.text, ... },
    // ...
  });
}

export default function SomeScreen() {
  const { colors } = useTheme();
  const { t, font } = useI18n();
  const styles = useMemo(() => createStyles(colors, font), [colors, font]);
  // ...text via t('namespace.key'), colors via styles or colors.x
}
```

Key facts:
- `useTheme()` → `{ mode, resolved, colors, setMode, ready }`. `mode` is `'light' | 'dark' | 'system'`; `colors` is the resolved semantic palette.
- `useI18n()` → `{ t, locale, setLocale, font }`. `font` is a weight→family map (`regular/medium/semibold/bold`), Inter for English, NotoSansMyanmar for Burmese.
- Fonts load **centrally** in `App.js` (`useFonts`). Per-screen `useFonts` calls are redundant and are removed.
- Semantic tokens live in `constants/theme.js` (`palettes.light` / `palettes.dark`).
- Existing translated namespaces in `i18n/locales/{en,my}.json`: `common`, `tabs`, `settings`, `home`, `guide`, `findFriends`, `matching`, `chat`, `conversation`.

## Scope

**In:**
- **Feed:** `screens/FeedScreen.js`, `components/CommentModal.js`, `components/VoteIcons.js` (call-site colors only)
- **Community:** `screens/CommunityScreen.js`, `screens/ShopDetailsScreen.js`
- **Chat:** `screens/ChatScreen.js`, `screens/ConversationScreen.js`
- **i18n:** `i18n/locales/en.json`, `i18n/locales/my.json`

**Out (explicit, possible follow-ups):** `MatchingScreen` (strings already exist in `matching.*`), `LoginScreen`, `AvatarScreen`, `SplashScreen`, `OnboardingScreen`.

## Approach — how multi-component files get themed

Converted screens so far are single-component. The targets contain memoized subcomponents (`Post`, `ImageCarousel`, `SkeletonPost` in Feed; `MessageBubble` in Conversation; `ShopCard`, `ChatItem`) plus a module-level `StyleSheet`.

**Decision: Approach A — hooks in every component, one shared `createStyles(colors, font)` per file.**

Each component — including `memo`-wrapped row components — calls `useTheme()`/`useI18n()` and derives its styles via `useMemo(() => createStyles(colors, font), [colors, font])`, where `createStyles` is a single module-level factory for the whole file.

Why:
- `colors` and `font` are context values with **stable references** between renders (context value is memoized; palette object is constant per `resolved` value). So `useMemo` returns the same styles object and `memo()` still short-circuits re-renders unless theme/locale actually changes. FlatList recycling stays correct.
- Matches the existing pattern exactly; no prop drilling; each component is self-contained and independently readable.
- Diverging (prop-drilling `colors`/`font`, or inline dynamic styles) would break convention and increase surface area.

Rejected alternatives:
- **B (parent builds styles, passes down):** prop-drills colors through every child; diverges from convention.
- **C (inline dynamic styles, no factory):** inconsistent with codebase; loses the clean separation.

Per file this means: convert the module-level `const styles = StyleSheet.create({...})` into `function createStyles(c, f) { return StyleSheet.create({...}); }`, replace every hardcoded value with `c.*`/`f.*`, and add the hooks+`useMemo` line to each component in the file.

## Theme mapping

The existing palette covers every value in scope. **No new tokens are required.**

| Hardcoded (current) | Semantic token | Notes |
|---|---|---|
| `#fff`, `#ffffff` page/card bg | `bg` | |
| `#f2f4f6`, `#F5F5F5` surfaces, carousel bg | `surface` / `surfaceAlt` | |
| `#E5E5E5`, `#e0e3e5` dividers, skeleton shimmer | `headerBorder` / `surfaceAlt` | |
| `#000`, `#191c1e` titles | `text` | |
| `#333` body text | `textSecondary` | |
| `#666` counts, hints, inactive icons | `textTertiary` | |
| `#00288e`, `#007AFF` accents | `primary` | incl. author/timestamp (honors commit `602d42f`) |
| `#ba1a1a` end-chat / destructive | `error` | |
| their-bubble bg | `bubbleTheirs` | already a token |
| `rgba(0,0,0,0.4)` scrims | `overlay` | |

**Kept fixed (brand/identity, intentionally theme-independent)** — same principle as HomeScreen keeping its rail tint colors:
- Vote-active colors `#FF4500` (up) / `#7193FF` (down).
- `TAG_COLORS` category map.
- Star `#FFB800`.

Only the **inactive** variants of these (e.g. `#666`) move to `textTertiary`.

### Dark-mode map style (Community)

CommunityScreen renders a map (bottom-sheet over map). Gate a `customMapStyle` array on `colors.isDark`:
- Light / unset: `customMapStyle` omitted (or `[]`) → default map.
- Dark: a standard dark map style JSON array (desaturated roads/land, dark water). Implemented as a small `constants/mapStyles.js` exporting `{ light: [], dark: [...] }`, selected via `mapStyles[resolved]` or `colors.isDark ? mapStyles.dark : mapStyles.light`.

## i18n plan

**Reuse (no new strings):**
- Chat → `chat.*` (title, emptyTitle, emptySubtitle, meetNewPeople).
- Conversation → `conversation.*` (messagePlaceholder, delivered, sending, today, yesterday, endChatTitle, endChatMessage, endChat, gifs, searchGifs).

**New namespaces (added to both en.json and my.json):**
- `feed.*` — e.g. `title` ("Feed"/"သတင်းများ"), `seeMore`, `seeLess`, plus CommentModal strings (comment placeholder, send/post action, "Comments" header, empty comments state, replying-to affordance).
- `community.*` — e.g. `title`, search placeholder, shop-card labels, category chips, "open"/"directions" actions, distance/accessibility labels, and ShopDetailsScreen content (call, directions, hours, etc.).
- Any common strings shared across these surfaces go under `common.*` (extend existing).

**Burmese authoring:** I draft best-effort `my.json` entries for the new keys, matching the wording style of the existing (human-translated) `my.json` content. Since JSON cannot hold comments, the "needs native review" flag lives in the spec/PR description, not in the file — the PR will list every drafted Burmese key explicitly so a native speaker knows exactly which strings to verify.

**Cleanup:** remove inline English UI strings ("Feed", "See More", "See Less", hardcoded placeholders, etc.) in favor of `t()`. Drop the unused `authorName` style in FeedScreen and the redundant `useFonts`/`Inter_*` imports (and the `if (!fontsLoaded) return null` gate — App.js already gates on font load).

## Files touched

| File | Change |
|---|---|
| `screens/FeedScreen.js` | `createStyles` factory + hooks in `PostTags`/`ImageCarousel`/`Post`/`SkeletonBox`/`SkeletonPost`/`FeedHeader`/`FeedScreen`; theme map; `feed.*` strings; remove `useFonts`. |
| `screens/CommunityScreen.js` | same refactor for `ShopCard`/`CommunityScreen`; theme map; dark map style; `community.*` strings; remove `useFonts`. |
| `screens/ShopDetailsScreen.js` | same refactor; theme map; `community.*` strings; remove `useFonts`. |
| `screens/ChatScreen.js` | same refactor for `ChatItem`/`ChatScreen`; theme map; `chat.*` strings; remove `useFonts`. |
| `screens/ConversationScreen.js` | same refactor for `MessageBubble` + others; theme map (`PRIMARY`→`primary`, `DESTRUCTIVE`→`error`); `conversation.*` strings; remove `useFonts`. |
| `components/CommentModal.js` | `createStyles` + hooks; theme map; `feed.*` strings. |
| `components/VoteIcons.js` | Likely **no internal change** — colors are passed at call sites (FeedScreen). Confirm during planning; if any internal default color exists, theme it. |
| `i18n/locales/en.json` | add `feed.*`, `community.*`; extend `common.*` as needed. |
| `i18n/locales/my.json` | mirror new keys with drafted Burmese (flagged for native review). |
| `constants/mapStyles.js` (new) | `{ light: [], dark: [...] }` map style arrays. |

## Verification

Manual sweep on device/emulator, both appearance modes (light/dark/system) and both locales (EN/မြန်မာ), on each converted surface:
- **Feed:** post rows (title, author, timestamp, body, see more/less, tags), image carousel + dots, vote buttons (active vs inactive), comments count, comment bottom sheet (CommentModal) incl. input + send + empty state, skeleton loading, pull-to-refresh + load-more spinner.
- **Community:** map (verify dark style switches), shop cards, category/filter chips, search, drill into ShopDetailsScreen (all labels + actions).
- **Chat:** conversation list, empty state + "meet new people" CTA.
- **Conversation:** message bubbles (mine vs theirs), input + placeholder, delivered/sending states, date separators (today/yesterday), end-chat sheet, GIF picker.

Acceptance checks:
- No hardcoded hex or inline English UI string remains in the in-scope files (grep sweep).
- No crash from removed `useFonts`; fonts render correctly in both locales.
- `memo` row components still recycle correctly in FlatLists (no per-row re-render storms).
- Toggling theme/locale in Settings updates all in-scope screens live (no restart needed).

## Risks / open items deferred to planning

- Full per-file string inventory for `feed.*` / `community.*` is enumerated during implementation planning (this spec fixes namespaces + approach, not every key).
- Confirm `VoteIcons` needs no internal change.
- Confirm CommunityScreen map library (`react-native-maps` assumed) and that `customMapStyle` is the correct prop.
- ConversationScreen (904 lines) and CommentModal (547 lines) are the largest refactors — plan sequenced so each file is converted and verified independently.
