# Settings Redesign — Phase 1 (Design)

**Date:** 2026-06-28
**Status:** Approved (design)
**Author:** lofi-tf

## Goal

Turn Settings from a modal into a real, navigable screen, give the Home header an animated logo, and build a clean, professional, Feed-styled settings experience covering nine items in sensible groups. Phase 1 delivers everything that needs **no backend changes**; the two backend-dependent features (delete account, report/feedback) are deferred to Phase 2.

## Phase split (by backend dependency)

- **Phase 1 (this spec — no backend changes):** navigation refactor, animated logo, settings shell with all 9 rows grouped, dark-mode switch, language, edit profile, change password, change email, permission management, about us. Delete / Report / Feedback rows are present but route to a `ComingSoon` placeholder.
- **Phase 2 (separate spec later — new backend infra):** Delete account (Supabase Edge Function + cascade SQL), Report problem + Send feedback (`feedback` table + RLS), replacing the `ComingSoon` placeholders.

Rationale: Phase 1 ships immediately with zero deploy/SQL dependencies.

## Context — patterns to follow

- **Theming:** every component calls `useTheme()` (`{ colors }`, alias `c` in `createStyles`) and `useI18n()` (`{ t, font }`), builds styles via a module-level `function createStyles(c, f)` + `useMemo(() => createStyles(colors, font), [colors, font])`. Established by HomeScreen/SettingsScreen/FeedScreen.
- **Navigation:** the app already nests a native stack inside a tab (`navigation/ChatNavigator.js`: `ChatList`/`Conversation`/`FindFriends`/`Matching`, all `headerShown: false` with custom headers). Phase 1 mirrors this for settings.
- **Feed design language (the target aesthetic):** flat surfaces, hairline separators (`headerBorder`), large bold title, `primary` accents, generous spacing, no heavy shadows.
- **Theme tokens** (`constants/theme.js`): `bg, surface, surfaceAlt, border, borderStrong, headerBorder, text, textSecondary, textTertiary, muted, primary, primaryEnd, error, star, overlay, bubbleTheirs, isDark`.
- **Auth:** `useAuth()` exposes `{ user, profile, updateUserProfile }`. `profile` = `{ username, full_name, avatar_url, ... }`; `user.email` is the auth email.
- **Supabase:** `supabaseClient` (default export) from `services/supabaseClient.js`. Auth methods available client-side: `supabaseClient.auth.updateUser({ password })`, `.updateUser({ email })`, `.signOut()`.
- **Avatars:** preset SVG avatars keyed `boy1..4`, `girl1..4` (see `components/CommentModal.js` `AVATAR_MAP` and `components/Avatar.js`). No image-picker library is installed, so avatar editing reuses these presets.

## Architecture

### 1. Navigation

Wrap `MainTabs` in a root native stack. Add `navigation/SettingsStack.js` — a native stack (`headerShown: false`) with routes:

```
SettingsStack
├─ Settings            (grouped list — the hub)
├─ EditProfile
├─ ChangePassword
├─ ChangeEmail
├─ Permissions
├─ About
└─ ComingSoon          (param: titleKey) — Phase-1 placeholder
```

`App.js` changes:
- Root `Stack = createNativeStackNavigator()`, `headerShown: false`.
- Routes: `Main` → `MainTabs`; `Settings` → `SettingsStack`.
- `MainTabs` unchanged internally.

Home gear handler: `navigation.navigate('Settings')` (replaces the `<Modal>` toggle). The `settingsOpen` state and `<Modal>` in HomeScreen are removed.

### 2. Home header + animated logo

New `components/AppLogo.js`:
- SVG rounded-square mark (~`size`×`size`, default 36) with a `primary`→`primaryEnd` linear gradient fill and a white **sunrise motif** (semicircle + short rays) — a nod to "mingalabar" (greeting/morning).
- Animation (`react-native-reanimated`): on mount, scale 0.8→1 + opacity 0→1 (entrance, ~400ms); idle loop gently pulses the ray opacity/scale (~2.4s loop, subtle). Uses `useSharedValue` + `useAnimatedStyle` + `withTiming`/`withRepeat`.
- Props: `{ size = 36 }`. Self-contained (no theme prop — reads `useTheme()` for the gradient colors so it tracks light/dark).

HomeScreen header: `AppLogo` on the left (replacing the "Mingalabar SG" wordmark `Text`), gear `TouchableOpacity` on the right (unchanged icon, new `onPress`).

### 3. Settings screen (hub) — `screens/SettingsScreen.js` (rewrite)

Feed-styled. Structure:
- **Header:** back chevron (→ `navigation.goBack()`) + large title `t('settings.title')`.
- **Profile card** (top): `Avatar` (from `profile.avatar_url`) + `profile.username` + `user.email`. Whole card tappable → `EditProfile`.
- **Grouped sections** (rounded cards: `backgroundColor: bg`, `borderRadius: 14`, `borderWidth: 1 borderColor border`; rows inside separated by hairline `border` at marginLeft ~50). Section label above each: uppercase, `textTertiary`, `f.semibold`.

Groups & rows:

| Group | Row | Trailing | Action |
|---|---|---|---|
| *(profile card)* | — | — | → EditProfile |
| **Preferences** | Dark mode | `<Switch>` | `setMode(value ? 'dark' : 'light')` |
| **Preferences** | Language | current locale label + `›` | opens Language picker modal |
| **Account** | Change password | `›` | → ChangePassword |
| **Account** | Change email | `›` | → ChangeEmail |
| **Privacy** | Permission management | `›` | → Permissions |
| **Support** | Report a problem | `›` | → ComingSoon (`titleKey: settings.reportProblem`) |
| **Support** | Send feedback | `›` | → ComingSoon (`settings.sendFeedback`) |
| **About** | About us | `›` | → About |
| **Danger zone** | Delete account | (red) | → ComingSoon (`settings.deleteAccount`) — Phase 2 wires real flow |

Row component: leading icon in a small rounded tinted square (`surfaceAlt` bg, `primary` icon), label (`text`, `f.medium`), trailing affordance. Danger row uses `error` color.

**Dark switch semantics:** `value = resolved === 'dark'` (reflects current resolved appearance, including the initial `system` default); `onValueChange(v) => setMode(v ? 'dark' : 'light')`. This honors the chosen binary behavior (on=dark, off=light) while showing the correct state on first load. `ThemeContext` code is unchanged.

**Language picker:** a lightweight inline `Modal` (consistent with the app's modal usage) listing EN / မြန်မာ with a check on the active one; calls `setLocale`. (Replaces the old language card.)

### 4. Sub-screens (Phase 1, all real & client-side)

Common shell for each: header (back chevron + title), themed `SafeArea`/`ScrollView`, Feed-styled inputs (rounded `surface` fields with `border`), `primary` submit button, error text in `error`. Each uses `createStyles(colors, font)`.

**EditProfileScreen**
- Fields: avatar (tap → grid of preset SVG avatars `boy1..4/girl1..4`, selected highlights with `primary` ring), username (`TextInput`), full name (`TextInput`).
- Pre-fills from `profile`.
- Save → `updateUserProfile({ username, full_name, avatar_url })`; on success, success toast/alert + `navigation.goBack()`.
- Validation: username non-empty.

**ChangePasswordScreen**
- Fields: new password, confirm password. (No "current password" — Supabase updates the password via the active session; if it requires recent re-auth it returns an error we surface.)
- Validation: length ≥ 8, new === confirm.
- Save → `await supabaseClient.auth.updateUser({ password })`; success alert + back. Surface Supabase errors (e.g. weak-password / requires-reauth) in `error`.

**ChangeEmailScreen**
- Field: new email.
- Validation: basic email format.
- Save → `await supabaseClient.auth.updateUser({ email })`; show an info alert that Supabase sends confirmation links to **both** the old and new address and the change completes only after confirmation. Navigate back.

**PermissionsScreen**
- Static list of the app's permission categories with a short description each (Location → Community map; Notifications → alerts; etc.).
- A button → `Linking.openSettings()` opens the OS app settings. (No permission-status query libs; honest about scope.)

**AboutScreen**
- Static: app name ("Mingalabar SG"), version (read via `expo-constants`: `Constants.expoConfig?.version || '1.0.0'`), one-line purpose, a line for the Myanmar-in-Singapore community. Privacy Policy / Terms rows → `ComingSoon` (Phase 1; real pages can come later).

**ComingSoonScreen**
- Props/route param: `titleKey`. Renders an icon + `t('common.comingSoon')` + the feature title. Used by Report / Feedback / Delete in Phase 1.

### 5. i18n

New/extended keys in `i18n/locales/{en,my}.json` (EN + drafted Burmese, flagged for native review):
- `common.comingSoon`
- `settings.*`: `title`, `darkMode`, `language`, group labels (`account`, `preferences`, `privacy`, `support`, `about`, `dangerZone`), and every row label: `editProfile`, `changePassword`, `changeEmail`, `permissionManagement`, `reportProblem`, `sendFeedback`, `aboutUs`, `deleteAccount`.
- `editProfile.*`: `title`, `username`, `fullName`, `chooseAvatar`, `save`, `hintUsernameRequired`, `saved`.
- `changePassword.*`: `title`, `newPassword`, `confirmPassword`, `submit`, `errLength`, `errMismatch`, `success`, `errWeak`/generic.
- `changeEmail.*`: `title`, `newEmail`, `submit`, `errInvalid`, `success`, `confirmNote`.
- `permissions.*`: `title`, `openSettings`, `location`, `locationDesc`, `notifications`, `notificationsDesc`, …
- `about.*`: `title`, `version`, `tagline`, `community`.

## Files (Phase 1)

**New:**
- `navigation/SettingsStack.js`
- `components/AppLogo.js`
- `screens/EditProfileScreen.js`
- `screens/ChangePasswordScreen.js`
- `screens/ChangeEmailScreen.js`
- `screens/PermissionsScreen.js`
- `screens/AboutScreen.js`
- `screens/ComingSoonScreen.js`

**Modify:**
- `App.js` — root stack wrapping MainTabs; remove nothing else.
- `screens/HomeScreen.js` — `AppLogo` in header; gear → `navigation.navigate('Settings')`; remove `<Modal>` + `settingsOpen`.
- `screens/SettingsScreen.js` — full rewrite to the grouped hub.
- `i18n/locales/en.json`, `i18n/locales/my.json` — new keys.

**Unchanged:** `contexts/ThemeContext.js` (switch just calls `setMode('dark'|'light')`), `services/*`.

## Design principles (Feed-matched)

- Large title header, flat surfaces, hairline dividers, `primary` accents, `error` for destructive only.
- Every screen themed via `createStyles(colors, font)`; no hardcoded hex; every label via `t()`.
- Inputs: rounded `surface`/`bg` fields with `border`; primary submit button; disabled state when invalid.
- Grouped cards for settings rows (rounded, bordered) — professional and consistent with the token system.

## Verification

- Toggle dark/light (switch flips appearance live); switch EN↔မြန်မာ (all new labels translate).
- Home: logo animates on mount; gear opens Settings as a pushed screen with working back gesture.
- Settings: every row navigates correctly; profile card → EditProfile; Dark switch persists across restart; Language picker changes locale.
- EditProfile: change avatar/username/fullName → saves → profile card + Home greeting update.
- ChangePassword: validation blocks mismatched/short; success on valid; errors surfaced.
- ChangeEmail: format validation; success alert with confirmation note.
- Permissions: "open settings" launches OS settings.
- About: renders version + tagline.
- Grep sweep: no hardcoded hex / inline English in new files; en/my key parity; all `t()` keys resolve.
- No regressions in Home/Feed/Community/Chat from the nav refactor.

## Out of scope (Phase 2, separate spec)

- Delete account: Supabase Edge Function (`delete_user`, service_role) + cascade SQL + real confirmation flow.
- Report problem + Send feedback: `feedback` table migration + RLS + real form screens (replace `ComingSoon`).
- Photo upload for avatar (would add `expo-image-picker` + storage) — not requested; EditProfile uses preset SVG avatars.
- Matching/Login/Avatar/Splash/Onboarding screens (unrelated).
