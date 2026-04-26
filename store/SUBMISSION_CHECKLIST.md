# EchoQuest — App Store Submission Checklist

## One-time Setup

- [ ] Run `eas login` and authenticate with your Expo account
- [ ] Run `eas init` inside `apps/mobile/` to create the EAS project and get the **projectId**
- [ ] Replace `REPLACE_WITH_EAS_PROJECT_ID` in `app.json` with the real projectId
- [ ] Fill in `eas.json` submit section: `appleId`, `ascAppId`, `appleTeamId`
- [ ] Set up Google Play service account and save to `apps/mobile/google-service-account.json` (gitignored)

## Assets (replace placeholders in `apps/mobile/assets/`)

- [ ] `icon.png` — 1024×1024 PNG, no transparency, no rounded corners (OS clips it)
- [ ] `adaptive-icon.png` — 1024×1024 PNG foreground on transparent background
- [ ] `splash.png` — 1284×2778 PNG centered logo on `#0d0d0d` background
- [ ] Run `node scripts/generate-assets.mjs` after installing `canvas` (`pnpm add -D canvas`) to regenerate all screenshots from updated artwork

## App Store Connect (iOS)

- [ ] Create app record in App Store Connect with bundle ID `com.echoquest.app`
- [ ] Set primary category: **Games → Role Playing**
- [ ] Set secondary category: **Entertainment**
- [ ] Age rating: **4+** (no objectionable content; AI content is filtered)
- [ ] Content rights: confirm you own or have rights to all content
- [ ] Encryption: **No** (set via `usesNonExemptEncryption: false` in app.json)
- [ ] Upload screenshots for each required device size:
  - iPhone 6.7" (1290×2796) — `store/screenshots/ios/iphone67-*.png`
  - iPhone 6.5" (1242×2688) — `store/screenshots/ios/iphone65-*.png`
  - iPad Pro 13" (2064×2752) — generate if supporting iPad
- [ ] Fill in App Store Connect review information from `store/ios/metadata/review_information.json`
- [ ] Create demo account (`reviewer@echoquest.app`) and pre-activate Storyteller tier
- [ ] Set up In-App Purchase products for subscriptions (Storyteller, Creator) and minute packs

## Google Play Console (Android)

- [ ] Create app in Play Console with package `com.echoquest.app`
- [ ] Complete store listing from `store/android/en-US/`
- [ ] Set content rating: complete the content rating questionnaire (expected: **Everyone**)
- [ ] Upload phone screenshots — `store/screenshots/android/phone-*.png`
- [ ] Set up Google Play Billing products matching Stripe/RevenueCat SKUs
- [ ] Declare data safety form:
  - Data collected: Email address (account), Audio (voice input, not stored), Gameplay content
  - No cross-app tracking

## EAS Secrets (set via `eas secret:create`)

```
ANTHROPIC_API_KEY
API_BASE_URL           # production API URL
ELEVENLABS_API_KEY
REVENUECAT_IOS_KEY
REVENUECAT_ANDROID_KEY
```

## Build & Submit Commands

```bash
# Inside apps/mobile/

# iOS production build
eas build --platform ios --profile production

# Android production build
eas build --platform android --profile production

# Submit to App Store (after build completes)
eas submit --platform ios --profile production

# Submit to Play Store
eas submit --platform android --profile production

# Or build + submit in one step
eas build --platform all --profile production --auto-submit
```

## Privacy Manifest (iOS 17+)

The `plugins/withPrivacyManifest.js` config plugin auto-generates `PrivacyInfo.xcprivacy`
during `expo prebuild`. Declared APIs:
- `NSPrivacyAccessedAPICategoryUserDefaults` (CA92.1) — app preferences
- `NSPrivacyAccessedAPICategoryFileTimestamp` (C617.1) — Expo/RN internals
- `NSPrivacyAccessedAPICategorySystemBootTime` (35F9.1) — RN performance
- `NSPrivacyAccessedAPICategoryDiskSpace` (E174.1) — Expo storage checks

If App Store review flags additional required-reason API usage, add entries to the plugin.

## Post-Submission

- [ ] Monitor TestFlight crash reports before releasing to all users
- [ ] Set up App Store promotional artwork (optional but improves featuring chances)
- [ ] Submit accessibility information to Apple's accessibility team for consideration in the App Store Accessibility section
