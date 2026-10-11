# Run on the iOS Simulator and release to the App Store

Intention is a standard Expo app. EAS Build compiles it in the cloud and EAS Submit uploads it,
so App Store builds don't need a Mac. Running the **iOS Simulator** always needs a Mac with Xcode.

## What you need

|                                                                                           | For the Simulator | For the App Store |
| ----------------------------------------------------------------------------------------- | :---------------: | :---------------: |
| A Mac with [Xcode](https://apps.apple.com/app/xcode/id497799835) (installs the Simulator) |        ✅         |         —         |
| A free [Expo account](https://expo.dev/signup)                                            | for cloud builds  |        ✅         |
| [Apple Developer Program](https://developer.apple.com/programs/) membership ($99/year)    |         —         |        ✅         |
| A public **privacy policy URL** and **support URL**                                       |         —         |        ✅         |

## 1. Run it in the iOS Simulator

Pick one way.

### A. Build on your Mac (fastest once Xcode is installed)

```sh
npm install
npm run ios          # = npx expo run:ios — compiles the app and opens it in the Simulator
```

The first build takes a few minutes. After that, `npm start` reloads code changes instantly.
To pick a specific simulator: `npx expo run:ios --device "iPhone 17 Pro"`.

### B. Build in the cloud, install on the Simulator

```sh
npx eas-cli@latest login
npx eas-cli@latest init          # once: links the project to your Expo account
npm run build:simulator          # EAS "development" profile, built for the Simulator
```

When the build finishes, answer **Y** to install it on the Simulator, or later run
`npx eas-cli@latest build:run -p ios --latest`. Then start the dev server with `npm start`.

> `npm start` now targets this development build. To use **Expo Go** instead, run `npm run start:go`.

### On a real iPhone (optional)

```sh
npx eas-cli@latest device:create   # once: register your iPhone
npm run build:device               # development build for registered devices
```

## 2. Before the first App Store build

- [ ] **Bundle identifier.** `app.json → ios.bundleIdentifier` is `com.agebold.intention`. It must
      be unique and can't change after release; edit it now if you prefer another one.
- [ ] **App name.** The store name is `Intention` (`store.config.json → title`). App Store names are
      unique; if it's taken, choose another (up to 30 characters), e.g. "Intention: Mindful Unlock".
      The home-screen name (`app.json → name`) can stay "Intention".
- [ ] **Privacy policy and support pages.** Publish [PRIVACY.md](PRIVACY.md) (fill in your contact
      email first) and a support page anywhere public, e.g. GitHub Pages or Notion. Add both URLs to
      `store.config.json → apple.info.en-US` as `privacyPolicyUrl` and `supportUrl`.
- [ ] **Review contact.** Add your name, email and phone to `store.config.json → apple.review`
      (`firstName`, `lastName`, `email`, `phone`). Apple only uses them if they have questions.
- [ ] **Copyright.** Add `"copyright": "2026 Your Name"` under `store.config.json → apple`.
- [ ] **Screenshots.** Drafts are in [`store/screenshots/iphone-6.9`](../store/screenshots/iphone-6.9)
      (1290 × 2796, accepted for the 6.9" iPhone slot). They're rendered from the web build, so for
      the final listing capture the same screens in the Simulator ("iPhone 17 Pro Max") with
      **⌘S** or `xcrun simctl io booted screenshot shot.png`, and upload them in App Store Connect.

## 3. Build and upload

```sh
npm run build:production     # EAS creates certificates and provisioning profiles for you
npm run submit:ios           # uploads the latest build to App Store Connect / TestFlight
```

- On the first run EAS asks for your Apple ID, registers the bundle identifier and enables the
  needed capabilities (Push Notifications, Time Sensitive Notifications) automatically.
- `submit` creates the App Store Connect app record if it doesn't exist yet.
- Build numbers increase automatically (`eas.json → appVersionSource: remote`). For each new
  App Store version, raise `version` in `app.json` (1.0.0 → 1.0.1 or 1.1.0).

## 4. Store listing and review

```sh
npx eas-cli@latest metadata:push    # sends store.config.json: name, subtitle, description,
                                    # keywords, categories, age rating, review notes
```

Then in [App Store Connect](https://appstoreconnect.apple.com):

1. **App Privacy:** answer **"Data Not Collected"** (nothing leaves the device; see
   [APPLE_REVIEW.md](APPLE_REVIEW.md)).
2. **Screenshots:** upload the 6.9" set.
3. **TestFlight:** install the build on your iPhone and run through the flow once:
   onboarding → Begin → wait for a reminder → Time's up.
4. **Submit for review.** Typical review takes 1–3 days.

## What's in the build

|                  |                                                                                                 |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| Version          | 1.0.0 (build number managed by EAS)                                                             |
| Devices          | iPhone only, iOS 16.4 or later, portrait                                                        |
| Permissions      | Notifications (asked in context), Microphone + Speech Recognition (only when the mic is tapped) |
| Capabilities     | Push Notifications (local only), Time Sensitive Notifications                                   |
| Privacy manifest | No tracking, no collected data, UserDefaults reason `CA92.1`                                    |
| Encryption       | `ITSAppUsesNonExemptEncryption = NO` (no export compliance paperwork)                           |
| Icons            | Light, dark and tinted variants                                                                 |
