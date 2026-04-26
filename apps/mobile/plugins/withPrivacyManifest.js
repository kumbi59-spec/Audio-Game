// Expo config plugin — injects PrivacyInfo.xcprivacy into the iOS build.
// Required for all apps targeting iOS 17+ submitted after May 2024.
// https://developer.apple.com/documentation/bundleresources/privacy_manifest_files

const { withDangerousMod } = require("@expo/config-plugins");
const path = require("path");
const fs = require("fs");

const PRIVACY_MANIFEST = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <!-- We do not use any data for cross-app tracking -->
  <key>NSPrivacyTracking</key>
  <false/>

  <!-- Domains used for tracking (none) -->
  <key>NSPrivacyTrackingDomains</key>
  <array/>

  <!-- Required-reason APIs used by this app and its SDK dependencies -->
  <key>NSPrivacyAccessedAPITypes</key>
  <array>
    <!-- NSUserDefaults — used for app preferences and audio settings -->
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>CA92.1</string>
      </array>
    </dict>
    <!-- File timestamp APIs — used by Expo and React Native internals -->
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryFileTimestamp</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>C617.1</string>
      </array>
    </dict>
    <!-- System boot time — used by performance monitoring in RN runtime -->
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategorySystemBootTime</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>35F9.1</string>
      </array>
    </dict>
    <!-- Disk space — used by Expo modules to check available storage -->
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryDiskSpace</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>E174.1</string>
      </array>
    </dict>
  </array>

  <!-- Data collected by this app -->
  <key>NSPrivacyCollectedDataTypes</key>
  <array>
    <!-- Email address for account creation -->
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypeEmailAddress</string>
      <key>NSPrivacyCollectedDataTypeLinked</key>
      <true/>
      <key>NSPrivacyCollectedDataTypeTracking</key>
      <false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array>
        <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
      </array>
    </dict>
    <!-- Audio — voice input processed locally for in-game commands only -->
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypeAudioData</string>
      <key>NSPrivacyCollectedDataTypeLinked</key>
      <false/>
      <key>NSPrivacyCollectedDataTypeTracking</key>
      <false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array>
        <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
      </array>
    </dict>
    <!-- Game play data (session progress, character state) -->
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypeGameplayContent</string>
      <key>NSPrivacyCollectedDataTypeLinked</key>
      <true/>
      <key>NSPrivacyCollectedDataTypeTracking</key>
      <false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array>
        <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
      </array>
    </dict>
  </array>
</dict>
</plist>`;

/** @type {import('@expo/config-plugins').ConfigPlugin} */
const withPrivacyManifest = (config) =>
  withDangerousMod(config, [
    "ios",
    (config) => {
      const iosDir = path.join(config.modRequest.platformProjectRoot);
      const dest = path.join(iosDir, "EchoQuest", "PrivacyInfo.xcprivacy");
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, PRIVACY_MANIFEST, "utf8");
      return config;
    },
  ]);

module.exports = withPrivacyManifest;
