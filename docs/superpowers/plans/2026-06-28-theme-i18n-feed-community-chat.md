# Light/Dark + EN/Burmese for Feed, Community & Chat — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Feed, Community, and Chat surfaces respond to the light/dark appearance setting and the English/Burmese language setting, with no hardcoded hex colors or inline English UI strings left in these files.

**Architecture:** Follow the app's established pattern — every component calls `useTheme()`/`useI18n()` and builds its styles via a module-level `createStyles(colors, font)` factory wrapped in `useMemo`. Hardcoded hex → semantic palette tokens; inline English → `t()` keys. Remove the redundant per-screen `useFonts` (fonts load centrally in `App.js`).

**Tech Stack:** React Native 0.85 (Expo ~56), `react-i18next`, `react-native-maps` 1.27.2, `react-native-reanimated`. Theme tokens in `constants/theme.js`; locales in `i18n/locales/{en,my}.json`.

**Spec:** `docs/superpowers/specs/2026-06-28-theme-i18n-feed-community-chat-design.md`

---

## Important notes for the executor

**No test runner exists.** `package.json` has only `start/android/ios/web` — no Jest, no lint. So "tests" here are **automated grep sweeps** (a real red→green check: confirm hardcoded literals exist before, confirm they're gone after) plus a **manual visual sweep** in `expo start`. Do not invent unit tests.

**Commit caveat:** The working tree currently holds extensive *uncommitted* work (the theming system, new screens, etc. — all part of the user's in-progress feature). Before the first commit, **ask the user** whether to (a) commit per-task, (b) commit everything together at the end, or (c) not commit and leave changes in the working tree. Default to (c) until told otherwise. Every commit step below is therefore conditional.

**Verification recipe (used in every task):**
- Red: `grep` the target file for hex color literals + quoted English UI strings → expect matches.
- Convert.
- Green: same `grep` → expect **no** matches.
- Manual: `npx expo start`, open the screen, toggle Settings → Appearance (light/dark) and Language (EN/မြန်မာ); confirm correct rendering and no crash.

---

## Global color map (single source of truth — apply to every file)

Context values: `useTheme()` → `colors` (alias `c` in `createStyles`); `useI18n()` → `font` (alias `f`, with `f.regular|medium|semibold|bold`).

| Literal | Token | Notes |
|---|---|---|
| `#fff` / `#ffffff` (page/card/sheet bg) | `c.bg` | |
| `#fff` (text/icon **on** a primary/colored bg) | keep `'#fff'` | foreground on color |
| `#000`, `#191c1e` | `c.text` | |
| `#444653` | `c.textSecondary` | |
| `#757684` | `c.textTertiary` | |
| `#8E8E93` | `c.muted` | |
| `#666`, `#555` | `c.textTertiary` / `c.textSecondary` | `#555` → secondary |
| `#ccc`, `#c4c5d5`, `#d1d3d6` | `c.borderStrong` | handle bars, placeholders |
| `#e0e3e5` (divider/border) | `c.border` | |
| `#e0e3e5` (skeleton shimmer bg) | `c.surfaceAlt` | |
| `#E5E5E5` | `c.headerBorder` | |
| `#eceef0`, `#F5F5F5` | `c.surfaceAlt` | |
| `#f2f4f6` | `c.surface` | |
| `#00288e`, `#007AFF` | `c.primary` | |
| `#0058be` | `c.primaryEnd` | ChatScreen fabFinding |
| `#ba1a1a` | `c.error` | |
| `rgba(0,0,0,0.4/0.5)` scrims/backdrops | `c.overlay` | |
| `rgba(0,40,142,0.04/0.08)` primary tints | `c.surfaceAlt` / `c.surface` | selected card / icon wrap |
| `#FFB800` | keep (star) | matches `c.star` |
| `#FF4500` / `#7193FF` | keep (vote active) | brand identity |
| `#34c759` | keep (status green) | brand identity |
| `rgba(186,26,26,0.10)` | keep (error tint) | no errorTint token |
| `rgba(255,255,255,0.x)` | keep | foreground on color/image |
| `rgba(0,0,0,0.6)` adBadge | keep | overlay on arbitrary image |

Fonts: `Inter_400Regular`→`f.regular`, `Inter_500Medium`→`f.medium`, `Inter_600SemiBold`→`f.semibold`, `Inter_700Bold`→`f.bold`.

---

## File structure

| File | Responsibility |
|---|---|
| `constants/mapStyles.js` (new) | `{ light: [], dark: [...] }` arrays for `react-native-maps` `customMapStyle`. |
| `i18n/locales/en.json`, `i18n/locales/my.json` | New keys: extend `common`, add `feed`, `community`. |
| `screens/ChatScreen.js` | Theme + i18n (reuse `chat.*`). |
| `screens/ConversationScreen.js` | Theme + i18n (reuse `conversation.*`, `common.cancel`). |
| `components/CommentModal.js` | Theme + i18n (`feed.comment.*`, `common.time`). |
| `screens/FeedScreen.js` | Theme + i18n (`tabs.feed`, `common.seeMore/seeLess`); VoteIcons call-site colors. |
| `screens/CommunityScreen.js` | Theme + i18n (`community.*`, category label lookup); dark map style. |
| `screens/ShopDetailsScreen.js` | Theme + i18n (`community.shop.*`, `common.time`); dark map style. |

`components/VoteIcons.js` needs **no change** — colors are passed at call sites.

---

## Task 1: Create dark map styles

**Files:**
- Create: `constants/mapStyles.js`

- [ ] **Step 1: Create the file**

```js
// customMapStyle arrays for react-native-maps. Pass `mapStyles[isDark ? 'dark' : 'light']`
// to <MapView customMapStyle={...} />. Light is the default (empty) style.
export const mapStyles = {
  light: [],
  dark: [
    { elementType: 'geometry', color: '#1b1e24' },
    { elementType: 'labels.text.stroke', color: '#1b1e24' },
    { elementType: 'labels.text.fill', color: '#8b909a' },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', color: '#c2c6ce' },
    { featureType: 'poi', elementType: 'labels.text.fill', color: '#8b909a' },
    { featureType: 'poi.park', elementType: 'geometry', color: '#242831' },
    { featureType: 'road', elementType: 'geometry', color: '#2a2f38' },
    { featureType: 'road', elementType: 'labels.text.fill', color: '#8b909a' },
    { featureType: 'road.highway', elementType: 'geometry', color: '#3a3f4a' },
    { featureType: 'transit', elementType: 'geometry', color: '#2a2f38' },
    { featureType: 'transit.station', elementType: 'labels.text.fill', color: '#8b909a' },
    { featureType: 'water', elementType: 'geometry', color: '#0f1115' },
    { featureType: 'water', elementType: 'labels.text.fill', color: '#8b909a' },
  ],
};
```

- [ ] **Step 2: Verify it imports cleanly**

Run: `node -e "require('./constants/mapStyles.js'); console.log('ok')"` — expect `ok` (plain JS, no RN deps). If `node` isn't available, skip; the import is exercised in Tasks 7 & 8.

- [ ] **Step 3: Commit (conditional — see caveat)**

```bash
git add constants/mapStyles.js
git commit -m "feat: add light/dark map style constants"
```

---

## Task 2: Add i18n keys (en + my)

Adds all new strings up front so screen tasks only wire `t()`. Burmese (`my.json`) values are **best-effort drafts — flag for native review** in the PR.

**Files:**
- Modify: `i18n/locales/en.json`
- Modify: `i18n/locales/my.json`

- [ ] **Step 1: Extend `common` in en.json**

Add these keys inside the existing `"common": { ... }` object (keep existing keys):

```json
    "seeMore": "See more",
    "seeLess": "See less",
    "time": {
      "now": "now",
      "m": "{{count}}m",
      "h": "{{count}}h",
      "d": "{{count}}d"
    }
```

- [ ] **Step 2: Extend `common` in my.json (draft — needs native review)**

```json
    "seeMore": "ပိုပြီး",
    "seeLess": "လျှော့ပြီး",
    "time": {
      "now": "ယခု",
      "m": "{{count}}မိနစ်",
      "h": "{{count}}နာရီ",
      "d": "{{count}}ရက်"
    }
```

- [ ] **Step 3: Add `feed` namespace to en.json**

Insert as a new top-level key (e.g. after `"chat"` or at the end before the final `}`):

```json
  "feed": {
    "comment": {
      "title": "Comments",
      "placeholder": "Add a comment...",
      "empty": "No comments yet",
      "emptySub": "Be the first to share your thoughts",
      "anonymous": "User"
    }
  }
```

- [ ] **Step 4: Add `feed` namespace to my.json (draft — needs native review)**

```json
  "feed": {
    "comment": {
      "title": "မှတ်ချက်များ",
      "placeholder": "မှတ်ချက်တစ်ခု ထည့်ပါ...",
      "empty": "မှတ်ချက်များ မရှိသေးပါ",
      "emptySub": "သင့်အတွေးအခေါ်ကို ပထမဆုံး မျှဝေပါ",
      "anonymous": "အသုံးပြုသူ"
    }
  }
```

- [ ] **Step 5: Add `community` namespace to en.json**

```json
  "community": {
    "searchPlaceholder": "Search locations...",
    "empty": "No locations found",
    "cat": {
      "all": "All",
      "food": "Food & Dining",
      "retail": "Retail & Groceries",
      "health": "Healthcare & Wellness",
      "services": "Professional Services",
      "community": "Community & Culture"
    },
    "shop": {
      "sectionLocation": "Location",
      "writeReview": "Write a review",
      "yourReview": "Your review",
      "yourRating": "Your rating",
      "yourFeedback": "Your feedback",
      "feedbackPlaceholder": "Share your experience...",
      "charsNeeded": "{{count}} more characters needed",
      "charsCount": "{{count}}/500",
      "postReview": "Post review",
      "updateReview": "Update review",
      "reviews": "Reviews",
      "reviewsWithCount": "Reviews ({{count}})",
      "emptyReviews": "No reviews yet",
      "emptyReviewsSub": "Be the first to share your experience",
      "errorTitle": "Something went wrong",
      "errorBody": "Could not post your review. Please try again.",
      "rateLimitTitle": "Slow down",
      "rateLimitBody": "You are posting reviews too quickly. Please try again in a moment.",
      "unverifiedTitle": "Verify your email",
      "unverifiedBody": "Please verify your email before posting a review."
    }
  }
```

- [ ] **Step 6: Add `community` namespace to my.json (draft — needs native review)**

```json
  "community": {
    "searchPlaceholder": "နေရာများ ရှာဖွေပါ...",
    "empty": "နေရာများ မတွေ့ပါ",
    "cat": {
      "all": "အားလုံး",
      "food": "အစားအသောက်",
      "retail": "လက်လီနှင့် ပစ္စည်းများ",
      "health": "ကျန်းမာရေးနှင့် ကျန်းမာရေးစောင့်ရှောက်မှု",
      "services": "ပြည်သူ့ဝန်ဆောင်မှုများ",
      "community": "အသိုင်းအဝိုင်းနှင့် ယဉ်ကျေးမှု"
    },
    "shop": {
      "sectionLocation": "တည်နေရာ",
      "writeReview": "သုံးသပ်ချက် ရေးပါ",
      "yourReview": "သင့်သုံးသပ်ချက်",
      "yourRating": "သင့်အဆင့်သတ်မှတ်ချက်",
      "yourFeedback": "သင့်ထင်မြင်ချက်",
      "feedbackPlaceholder": "သင့်အတွေ့အကြုံကို မျှဝေပါ...",
      "charsNeeded": "စာလုံး {{count}} လုံး ထပ်လိုပါသည်",
      "charsCount": "{{count}}/500",
      "postReview": "သုံးသပ်ချက် တင်ပါ",
      "updateReview": "သုံးသပ်ချက် ပြင်ပါ",
      "reviews": "သုံးသပ်ချက်များ",
      "reviewsWithCount": "သုံးသပ်ချက်များ ({{count}})",
      "emptyReviews": "သုံးသပ်ချက်များ မရှိသေးပါ",
      "emptyReviewsSub": "သင့်အတွေ့အကြုံကို ပထမဆုံး မျှဝေပါ",
      "errorTitle": "အမှားအယွင်း ဖြစ်နေပါသည်",
      "errorBody": "သုံးသပ်ချက် တင်၍ မရပါ။ ထပ်မံ ကြိုးစားပါ။",
      "rateLimitTitle": "နည်နည်း နှေးပါ",
      "rateLimitBody": "သုံးသပ်ချက်များ အလွန်အမင်း တင်နေပါသည်။ ခဏ ထပ်ကြိုးစားပါ။",
      "unverifiedTitle": "အီးမေးလ် စစ်ဆေးပါ",
      "unverifiedBody": "သုံးသပ်ချက် တင်မီ အီးမေးလ် စစ်ဆေးပါ။"
    }
  }
```

- [ ] **Step 7: Verify both files are valid JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('i18n/locales/en.json','utf8')); JSON.parse(require('fs').readFileSync('i18n/locales/my.json','utf8')); console.log('valid')"` — expect `valid`.

- [ ] **Step 8: Commit (conditional)**

```bash
git add i18n/locales/en.json i18n/locales/my.json
git commit -m "i18n: add feed & community namespaces (EN + draft MY)"
```

---

## Conversion recipe (applied per file in Tasks 3–8)

Each target file follows the same mechanical steps. The task body lists file-specifics only.

1. **Imports:** add `import { useTheme } from '../contexts/ThemeContext';` and `import { useI18n } from '../contexts/I18nContext';`. Remove the `useFonts` + `Inter_*` import block from `@expo-google-fonts/inter`.
2. **Stylesheet → factory:** rename `const styles = StyleSheet.create({ ... })` → `function createStyles(c, f) { return StyleSheet.create({ ... }) }`. Inside, replace every hardcoded color/font per the **Global color map**.
3. **Each component** (including `memo` row components) gets, as its first lines:
   ```js
   const { colors } = useTheme();
   const { t, font } = useI18n();
   const styles = useMemo(() => createStyles(colors, font), [colors, font]);
   ```
   Add `useMemo` to the React import if missing. Components that don't render text may omit `t`; those that don't need font may destructure only what they use — but `colors`+`font` are always needed for `createStyles`.
4. **Remove `useFonts`:** delete the `const [fontsLoaded] = useFonts({...})` block and any `if (!fontsLoaded) return null;` gate (App.js loads fonts centrally).
5. **Strings:** replace inline English per the file's string map with `t('...')`.
6. **Verify:** grep sweep (red gone) + manual visual.

---

## Task 3: ChatScreen

**Files:** Modify `screens/ChatScreen.js` (347 lines). Reuses existing `chat.*` keys — no new strings.

- [ ] **Step 1: Red — confirm hardcoded literals**

Run: `grep -nE "#[0-9A-Fa-f]{3,6}|'(Chats|No conversations yet|Meet new people|Discover and connect)" screens/ChatScreen.js` — expect many matches.

- [ ] **Step 2: Apply the conversion recipe**

Component list that needs hooks+`createStyles`: `ChatItem` (memo) and `ChatScreen`. Both share the single `createStyles` for the file.

Remove `const PRIMARY = '#00288e';` (line 24) — replaced by `colors.primary`.

File-specific color notes:
- `fabFinding` `#0058be` → `c.primaryEnd`.
- `emptyIconWrap` `rgba(0, 40, 142, 0.08)` → `c.surface`.
- `fabDot` `#34c759` → keep; `borderColor: '#fff'` → keep (on green).
- `unreadBadgeText`, `meetButtonText`, ActivityIndicator `#fff`, Ionicons `#fff` on FAB → keep (on primary).
- `chatTime`/`chatPreview` `#8E8E93` → `c.muted`.

String map:
| Current | Replacement |
|---|---|
| `<Text style={styles.headerTitle}>Chats</Text>` | `{t('chat.title')}` |
| `<Text style={styles.emptyTitle}>No conversations yet</Text>` | `{t('chat.emptyTitle')}` |
| `Discover and connect with people from your community.` | `{t('chat.emptySubtitle')}` |
| `<Text style={styles.meetButtonText}>Meet new people</Text>` | `{t('chat.meetNewPeople')}` |

Leave `MOCK_CHATS` preview/name strings as-is (mock content, not chrome).

- [ ] **Step 3: Green — confirm clean**

Run: `grep -nE "#00288e|#0058be|#fff|#000|#8E8E93|#444653|#757684|'(Chats|No conversations yet|Meet new people|Discover)" screens/ChatScreen.js` — expect **no** matches (the `#fff` on-color keeps are inside JSX `color="#fff"` / style `color: '#fff'`; if any remain they must be the intentional on-color ones — verify each is foreground-on-primary/green).

- [ ] **Step 4: Manual verify** — `npx expo start`, open Chat tab; toggle light/dark + EN/မြန်မာ; check header, list rows, unread badge, FAB, empty state, "Meet new people".

- [ ] **Step 5: Commit (conditional)** — `git add screens/ChatScreen.js && git commit -m "feat(chat): theme + i18n for chat list"`

---

## Task 4: ConversationScreen

**Files:** Modify `screens/ConversationScreen.js` (904 lines). Reuses `conversation.*` + `common.cancel`. No new strings.

- [ ] **Step 1: Red** — `grep -nE "#[0-9A-Fa-f]{3,6}|'(Delivered|Sending|Today|Yesterday|GIFs|Search GIFs|Message|End this chat|End chat|Cancel|Ad)" screens/ConversationScreen.js`

- [ ] **Step 2: Apply the conversion recipe**

Components needing hooks+`createStyles`: `MessageBubble` (memo), `ConfirmDialog`, `GifPicker`, `ConversationScreen`.

Remove `const PRIMARY` and `const DESTRUCTIVE` (lines 31–32) → use `colors.primary` / `colors.error`.

File-specific notes:
- `dialogIconWrap` `rgba(186, 26, 26, 0.10)` → keep (error tint).
- `adBadge` `rgba(0,0,0,0.6)` and `adBadgeText` `#fff` → keep (on image).
- `dialogOverlay` `rgba(0,0,0,0.5)`, `pickerBackdrop` `rgba(0,0,0,0.4)` → `c.overlay`.
- All `#fff` on bubbles/dialog/picker foregrounds and `bubbleTextMine` → keep.

String map:
| Current | Replacement |
|---|---|
| `{message.status === 'delivered' ? 'Delivered' : 'Sending…'}` | `message.status === 'delivered' ? t('conversation.delivered') : t('conversation.sending')` |
| `formatDaySeparator` returns `'Today'` / `'Yesterday'` | `return t('conversation.today')` / `return t('conversation.yesterday')` (pass `t` in, or call `useI18n` inside `formatDaySeparator`'s caller — see note below) |
| `pickerTitle` `GIFs` | `{t('conversation.gifs')}` |
| `placeholder="Search GIFs"` | `placeholder={t('conversation.searchGifs')}` |
| `gifButtonLabel` `GIF` | keep `GIF` (brand abbrev) |
| `placeholder="Message…"` | `placeholder={t('conversation.messagePlaceholder')}` |
| ConfirmDialog `title="End this chat?"` | pass `t('conversation.endChatTitle')` |
| `message="This conversation…"` | pass `t('conversation.endChatMessage')` |
| `confirmLabel="End chat"` | pass `t('conversation.endChat')` |
| ConfirmDialog hardcoded `<Text>Cancel</Text>` | `{t('common.cancel')}` (ConfirmDialog must call `useI18n`) |
| `adBadgeText` `Ad` | keep `Ad` |

**Note on `formatDaySeparator`/`formatTime`:** these are module-level pure functions. `formatDaySeparator` needs `t`. Simplest: convert it to accept `t` as a parameter and update its caller in `MessageBubble` (which already calls `useI18n`) to `formatDaySeparator(message.createdAt, t)`. `formatTime` (the clock time) has no translatable text — leave as-is.

- [ ] **Step 3: Green** — `grep -nE "#00288e|#ba1a1a|#fff|#000|#f2f4f6|#191c1e|#8E8E93|#c4c5d5|#757684|#444653|'(Delivered|Sending|Today|Yesterday|GIFs|Search GIFs|Message…|End this chat|End chat|Cancel)" screens/ConversationScreen.js` — expect only intentional on-color `#fff` keeps; no string matches.

- [ ] **Step 4: Manual verify** — open a chat; check bubbles (mine=primary, theirs=surface), time/date separators localize, delivered/sending, GIF picker, end-chat dialog (Cancel/End chat localize).

- [ ] **Step 5: Commit (conditional)** — `git add screens/ConversationScreen.js && git commit -m "feat(chat): theme + i18n for conversation"`

---

## Task 5: CommentModal

**Files:** Modify `components/CommentModal.js` (547 lines). Uses `feed.comment.*` + `common.time`.

- [ ] **Step 1: Red** — `grep -nE "#[0-9A-Fa-f]{3,6}|'(Comments|No comments yet|Be the first|Add a comment|User|now)" components/CommentModal.js`

- [ ] **Step 2: Apply the conversion recipe**

Components needing hooks+`createStyles`: `SkeletonBox`, `SkeletonComment`, `CommentItem` (memo), `CommentModal`. (`SkeletonBox`/`SkeletonComment` are tiny; they still need `colors` for the shimmer bg — give them the hook+`useMemo` too, or accept `colors` via a prop. Simplest: each calls `useTheme()` + builds a minimal local style. To avoid over-splitting, give `SkeletonBox` a `useTheme`+inline `backgroundColor: colors.surfaceAlt` and drop its reliance on the shared stylesheet for that one value.)

File-specific notes:
- `sheet` `borderColor: '#000'` → `c.borderStrong`.
- `handleBar` `#d1d3d6` → `c.borderStrong`.
- `sheetTitle`/`commentTime`/`commentAvatar` borderColor/send active `#00288e` → `c.primary`.
- close icon `#666`, empty icon `#c4c5d5`, send-disabled `#c4c5d5` → `c.textTertiary` / `c.borderStrong`.
- skeleton `#e0e3e5` → `c.surfaceAlt`.
- `backdrop` `rgba(0,0,0,0.4)` → `c.overlay`.

String map:
| Current | Replacement |
|---|---|
| `sheetTitle` `Comments` | `{t('feed.comment.title')}` |
| `emptyText` `No comments yet` | `{t('feed.comment.empty')}` |
| `emptySubtext` `Be the first to share your thoughts` | `{t('feed.comment.emptySub')}` |
| `placeholder="Add a comment..."` | `placeholder={t('feed.comment.placeholder')}` |
| `CommentItem` fallback `'User'` | `t('feed.comment.anonymous')` |
| `formatTimeAgo` `'now'`/`${diffMins}m`/`${diffHours}h`/`${diffDays}d` | localize via `t` (see note) |

**Note on `formatTimeAgo`:** it's a module-level pure function. Convert to `formatTimeAgo(isoString, t)` and return `t('common.time.now')`, `t('common.time.m', { count: diffMins })`, `t('common.time.h', { count: diffHours })`, `t('common.time.d', { count: diffDays })`. Update its caller in `CommentItem` to pass `t`. Keep the `toLocaleDateString` branch as-is (date format).

- [ ] **Step 3: Green** — `grep -nE "#[0-9A-Fa-f]{3,6}|'(Comments|No comments yet|Be the first|Add a comment|User)" components/CommentModal.js` — expect no matches (intentional on-color `#fff`/keeps only if any; this file has none besides none-on-color).

- [ ] **Step 4: Manual verify** — open Feed, tap a post's comment icon; check sheet title, input placeholder, empty state, posting a comment, relative timestamps, close button. Toggle theme/locale.

- [ ] **Step 5: Commit (conditional)** — `git add components/CommentModal.js && git commit -m "feat(feed): theme + i18n for comment sheet"`

---

## Task 6: FeedScreen (+ VoteIcons call-sites)

**Files:** Modify `screens/FeedScreen.js` (690 lines). Uses `tabs.feed` (header) + `common.seeMore/seeLess`.

- [ ] **Step 1: Red** — `grep -nE "#[0-9A-Fa-f]{3,6}|'(Feed|See More|See Less)" screens/FeedScreen.js`

- [ ] **Step 2: Apply the conversion recipe**

Components needing hooks+`createStyles`: `PostTags`, `ImageCarousel`, `Post` (memo), `SkeletonBox`, `SkeletonPost`, `FeedHeader`, `FeedScreen`.

Remove the `useFonts` import block (lines 21–27) and `const [fontsLoaded] = useFonts({...})` + `if (!fontsLoaded) return null;`.

File-specific notes:
- `TAG_COLORS` map → keep all values (category identity colors). The fallback `'#666'` in `PostTags` → use `colors.textTertiary` (so `PostTags` needs `useTheme`).
- `Post` vote icons: `color={userVote === 'up' ? '#FF4500' : '#666'}` → `'#FF4500'` stays; `'#666'` → `colors.textTertiary`. Same for down `'#7193FF'` / `'#666'`. Comment icon `Ionicons name="chatbubble-outline" color="#666"` → `colors.textTertiary`.
- `actionCount`/`seeMore` `#666` → `c.textTertiary`.
- `loadingMore` ActivityIndicator `#007AFF` → `colors.primary`.
- `timestamp`/`authorName` `#00288e` → `c.primary`. (Delete the unused `authorName` style.)
- `dotsBackground` `rgba(0,0,0,0.4)` → `c.overlay`; dot whites → keep.

String map:
| Current | Replacement |
|---|---|
| `FeedHeader` `<Text style={styles.headerTitle}>Feed</Text>` | `{t('tabs.feed')}` (`FeedHeader` needs `useI18n`) |
| `See More` | `{t('common.seeMore')}` |
| `See Less` | `{t('common.seeLess')}` |

- [ ] **Step 3: Confirm VoteIcons needs no change**

Run: `grep -nE "useTheme|useI18n|'#000'|'#666'" components/VoteIcons.js` — VoteIcons takes `color` as a prop (default `'#000'`, never used since FeedScreen always passes explicit colors). **No change required.** (If you want, the default could become neutral, but it's unreachable — leave it.)

- [ ] **Step 4: Green** — `grep -nE "#fff|#E5E5E5|#000|#00288e|#333|#666|#F5F5F5|#007AFF|'(Feed|See More|See Less)" screens/FeedScreen.js` — expect no matches except intentional keeps inside `TAG_COLORS` and vote-active `#FF4500`/`#7193FF`.

- [ ] **Step 5: Manual verify** — Feed tab; check posts (title, author, timestamp, body, see more/less, tags), carousel + dots, vote buttons (active vs inactive color), comment count, skeletons, pull-refresh + load-more. Toggle theme/locale.

- [ ] **Step 6: Commit (conditional)** — `git add screens/FeedScreen.js && git commit -m "feat(feed): theme + i18n for feed"`

---

## Task 7: CommunityScreen (+ category labels + dark map)

**Files:** Modify `screens/CommunityScreen.js` (484 lines). Uses `community.*`; dark map from Task 1.

- [ ] **Step 1: Red** — `grep -nE "#[0-9A-Fa-f]{3,6}|'(Search locations|No locations found)" screens/CommunityScreen.js`

- [ ] **Step 2: Apply the conversion recipe**

Components needing hooks+`createStyles`: `ShopCard` (memo) and `CommunityScreen`.

Remove the `useFonts` import block and `if (!fontsLoaded) return null;`.

File-specific notes:
- `ShopCard` icon `color={isSelected ? '#00288e' : '#ccc'}` → `colors.primary` / `colors.borderStrong`.
- cardImage placeholder icon, star `#FFB800` → keep; `cardRatingText` `#444653` → `c.textSecondary`; `cardCategory` `#00288e` → `c.primary`.
- `cardSelected` border `#00288e` → `c.primary`; bg `rgba(0,40,142,0.04)` → `c.surfaceAlt`; `cardAccent` `#00288e` → `c.primary`.
- `expandBtn` icon `#555` → `c.textSecondary`; `expandBtn` bg `#fff` → `c.bg`.
- `emptyText` `#757684` → `c.textTertiary`; empty icon `#e0e3e5` → `c.borderStrong`; loading ActivityIndicator `#00288e` → `c.primary`.
- filter chip active `#00288e` → `c.primary`; inactive icon `#666` → `c.textTertiary`.
- search clear icon `#e0e3e5` → `c.borderStrong`; placeholder/search icon `#757684` → `c.textTertiary`.
- markerPin `#00288e` → `c.primary`; border `#fff` → keep.

String map:
| Current | Replacement |
|---|---|
| `placeholder="Search locations..."` | `placeholder={t('community.searchPlaceholder')}` |
| `emptyText` `No locations found` | `{t('community.empty')}` |
| filter chip label `{cat.label}` | `{t(\`community.cat.${cat.id}\`, { defaultValue: cat.label })}` |

- [ ] **Step 3: Add dark map style**

Add `import { mapStyles } from '../constants/mapStyles';`. In `CommunityScreen`, on the `<MapView>` add:
```jsx
customMapStyle={mapStyles[colors.isDark ? 'dark' : 'light']}
```

- [ ] **Step 4: Green** — `grep -nE "#fff|#E5E5E5|#00288e|#f2f4f6|#e0e3e5|#191c1e|#444653|#757684|#ccc|#555|#666|'(Search locations|No locations found)" screens/CommunityScreen.js` — expect no matches except keeps (`#FFB800`, marker border `#fff`).

- [ ] **Step 5: Manual verify** — Community tab; check map (verify it darkens in dark mode), shop cards (selected vs not), search, filter chips (labels localize incl. "All"), empty state, marker. Tap a selected card → ShopDetails still opens. Toggle theme/locale.

- [ ] **Step 6: Commit (conditional)** — `git add screens/CommunityScreen.js && git commit -m "feat(community): theme + i18n + dark map for community"`

---

## Task 8: ShopDetailsScreen

**Files:** Modify `screens/ShopDetailsScreen.js` (810 lines). Uses `community.shop.*` + `common.time/seeMore/seeLess`; dark map from Task 1.

- [ ] **Step 1: Red** — `grep -nE "#[0-9A-Fa-f]{3,6}|'(Location|Write a review|Your review|Your rating|Your feedback|Share your experience|Post review|Update review|Reviews|See more|See less|Edited|New|No reviews yet|Be the first|now)" screens/ShopDetailsScreen.js`

- [ ] **Step 2: Apply the conversion recipe**

Components needing hooks+`createStyles`: `Stars`, `Avatar` (local), `ImageCarousel`, `ReviewItem` (memo), `ShopDetailsScreen`.

The module-level color consts (lines 33–41: `PRIMARY, STAR, UPVOTE, DOWNVOTE, TEXT, TEXT_SECONDARY, TEXT_TERTIARY, SURFACE, BORDER`) are **deleted** — their usages move into `createStyles(c, f)` as `c.*`, and inline usages in component bodies become `colors.*`. `STAR/UPVOTE/DOWNVOTE` stay as literal hex inside `createStyles`/inline (brand identity).

Remove the `useFonts` import block and `if (!fontsLoaded || !shop) return null;` → becomes `if (!shop) return null;`.

File-specific notes:
- All `TEXT` → `c.text`, `TEXT_SECONDARY` → `c.textSecondary`, `TEXT_TERTIARY` → `c.textTertiary`, `SURFACE` → `c.surface`, `BORDER` → `c.border`, `PRIMARY` → `c.primary`.
- `Stars` empty `#c4c5d5` → `c.borderStrong`; filled `STAR` keep.
- `feedbackScroll` bg `#fff` → `c.bg`.
- markerPin border `#fff` → keep; shadowColor `#000` → keep.
- carouselDot whites → keep.

String map:
| Current | Replacement |
|---|---|
| `formatTimeAgo` `'now'/m/h/d` | localize — convert to `formatTimeAgo(iso, t)`, use `common.time.*` (same pattern as CommentModal Task 5) |
| `Stars`-adjacent `'Edited'` (`reviewEdited`) | `{t(...)}` — add via `t('common.edited')`? **No new key needed if minimal:** reuse — actually add `community.shop.edited`. See Step 3. |
| `'See less'` / `'See more'` | `t('common.seeLess')` / `t('common.seeMore')` |
| avgDisplay `'New'` | `t('community.shop.new')` — **add key** (see Step 3) |
| `'Location'` sectionLabel | `t('community.shop.sectionLocation')` |
| `{myReviewId ? 'Your review' : 'Write a review'}` | `t(myReviewId ? 'community.shop.yourReview' : 'community.shop.writeReview')` |
| `'Your rating'` / `'Your feedback'` | `t('community.shop.yourRating')` / `t('community.shop.yourFeedback')` |
| `placeholder="Share your experience..."` | `placeholder={t('community.shop.feedbackPlaceholder')}` |
| fieldHint `${...} more characters needed` | `t('community.shop.charsNeeded', { count: MIN_FEEDBACK_LEN - feedback.trim().length })` |
| fieldHint `${feedback.length}/500` | `t('community.shop.charsCount', { count: feedback.length })` |
| submitText `{myReviewId ? 'Update review' : 'Post review'}` | `t(myReviewId ? 'community.shop.updateReview' : 'community.shop.postReview')` |
| sectionLabel `{hasReviews ? \`Reviews (${reviewCount})\` : 'Reviews'}` | `hasReviews ? t('community.shop.reviewsWithCount', { count: reviewCount }) : t('community.shop.reviews')` |
| `'No reviews yet'` / `'Be the first to share your experience'` | `t('community.shop.emptyReviews')` / `t('community.shop.emptyReviewsSub')` |
| `Alert.alert('Slow down', 'You are posting…')` | `Alert.alert(t('community.shop.rateLimitTitle'), t('community.shop.rateLimitBody'))` |
| `Alert.alert('Verify your email', 'Please verify…')` | `Alert.alert(t('community.shop.unverifiedTitle'), t('community.shop.unverifiedBody'))` |
| `Alert.alert('Something went wrong', 'Could not post…')` | `Alert.alert(t('community.shop.errorTitle'), t('community.shop.errorBody'))` |

- [ ] **Step 3: Add the two missing keys**

Two strings weren't in Task 2's `community.shop`: `new` and `edited`. Add to **en.json** `community.shop`: `"new": "New"` and `"edited": "Edited"`. Add to **my.json** `community.shop`: `"new": "အသစ်"` and `"edited": "တည်းဖြတ်ပြီး"` (draft — native review). Re-run the JSON validity check from Task 2 Step 7.

- [ ] **Step 4: Add dark map style**

`import { mapStyles } from '../constants/mapStyles';` and on the details `<MapView>` add `customMapStyle={mapStyles[colors.isDark ? 'dark' : 'light']}`.

- [ ] **Step 5: Green** — `grep -nE "#fff|#00288e|#FFB800|#FF4500|#7193FF|#191c1e|#444653|#757684|#f2f4f6|#e0e3e5|#c4c5d5|'(Location|Write a review|Your review|Your rating|Your feedback|Share your experience|Post review|Update review|Reviews|See more|See less|Edited|New|No reviews yet|Be the first|now)" screens/ShopDetailsScreen.js` — expect no matches except intentional keeps (`#FFB800`, `#FF4500`, `#7193FF`, on-color `#fff`).

- [ ] **Step 6: Manual verify** — Community → tap a selected shop card; check photos carousel, shop name/category/rating, location map (darkens), write-review form (rating stars, feedback, char counter, submit), review list (author, stars, time, edited, see more/less, vote buttons), empty state, error alerts (force an error if possible). Toggle theme/locale.

- [ ] **Step 7: Commit (conditional)** — `git add screens/ShopDetailsScreen.js i18n/locales/en.json i18n/locales/my.json && git commit -m "feat(community): theme + i18n + dark map for shop details"`

---

## Task 9: Final acceptance sweep

- [ ] **Step 1: Grep all in-scope files for leftover literals**

Run:
```bash
grep -nE "#[0-9A-Fa-f]{6}" screens/FeedScreen.js screens/CommunityScreen.js screens/ChatScreen.js screens/ConversationScreen.js screens/ShopDetailsScreen.js components/CommentModal.js
```
Acceptable remaining hits are **only**: `TAG_COLORS` values in FeedScreen, `#FFB800`/`#FF4500`/`#7193FF`/`#34c759` (brand), and on-color `#fff`. Anything else is a miss → fix.

- [ ] **Step 2: Grep for leftover inline English UI strings**

Run:
```bash
grep -nE ">(Feed|Chats|Comments|See More|See Less|No comments|No reviews|No locations|Reviews|Location|Write a review|Meet new people|No conversations|Delivered|Sending)" screens/FeedScreen.js screens/CommunityScreen.js screens/ChatScreen.js screens/ConversationScreen.js screens/ShopDetailsScreen.js components/CommentModal.js
```
Expect no matches.

- [ ] **Step 3: Full manual sweep**

`npx expo start`. In Settings, cycle Appearance (light / dark / system) and Language (EN / မြန်မာ). Walk every surface: Feed (posts, comments sheet), Community (map, cards, chips, shop details), Chat (list, conversation, GIF picker, end-chat). Confirm: no crashes, fonts render in both locales, `memo` rows recycle smoothly in lists, theme/locale updates live without restart.

- [ ] **Step 4: Update the spec's risk list (optional)** — strike the resolved "confirm" items in the design doc.

- [ ] **Step 5: Final commit (conditional)** — `git add -A && git commit -m "feat: complete light/dark + EN/Burmese across feed, community, chat"` (only if the user chose to commit).

---

## Spec coverage / self-review

- **Scope (spec → task):** Feed = Task 6 (screen) + Task 5 (CommentModal) + Task 6 Step 3 (VoteIcons confirmed no-op). Community = Task 7 + Task 8. Chat = Task 3 + Task 4. ✓
- **Approach A** (hooks per component + shared `createStyles`) → Conversion recipe + every task's component list. ✓
- **Theme mapping** (no new tokens) → Global color map; verified against every literal found in all 7 files. ✓
- **Dark map style** → Task 1 (constants) + Task 7 Step 3 + Task 8 Step 4. ✓
- **i18n: reuse chat/conversation** → Tasks 3, 4. **New feed/community** → Task 2 (+ Task 8 Step 3 adds `new`/`edited`). **Burmese drafted + flagged** → Task 2 + PR note. ✓
- **Remove redundant useFonts** → recipe step 4 + each task. ✓
- **Author/timestamp → primary** → Feed Task 6, Comment Task 5 (`commentTime`), ShopDetails Task 8 (`reviewTime`/`reviewAuthor` context). ✓
- **Verification** → grep red/green per task + Task 9 acceptance. ✓
- **Placeholder scan:** none — every step has concrete code, exact commands, or exact mapping tables.
- **Type/key consistency:** `common.time/seeMore/seeLess`, `feed.comment.*`, `community.*/community.shop.*`, `chat.*`, `conversation.*` referenced identically across tasks. `formatTimeAgo(iso, t)` signature used consistently in Tasks 5 & 8.
