const { withAppBuildGradle, withMainApplication } = require('@expo/config-plugins');

/**
 * Expo config plugin to add TikTok Business SDK to Android build
 */
const withTikTokSDK = (config) => {
  // Modify app-level build.gradle
  config = withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      let buildGradle = config.modResults.contents;

      // Add repositories if not already present
      if (!buildGradle.includes("flatDir")) {
        // Find the repositories block and add flatDir
        const repositoriesRegex = /(repositories\s*{)/;
        if (repositoriesRegex.test(buildGradle)) {
          buildGradle = buildGradle.replace(
            repositoriesRegex,
            `$1
    flatDir {
        dirs 'libs'
    }`
          );
        } else {
          // If no repositories block exists, add one before dependencies
          const dependenciesRegex = /(dependencies\s*{)/;
          buildGradle = buildGradle.replace(
            dependenciesRegex,
            `repositories {
    flatDir {
        dirs 'libs'
    }
}

$1`
          );
        }
      }

      // Add compileOptions if not already present
      if (!buildGradle.includes("sourceCompatibility JavaVersion.VERSION")) {
        const androidBlockRegex = /(android\s*{)/;
        buildGradle = buildGradle.replace(
          androidBlockRegex,
          `$1
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }`
        );
      }

      // Add TikTok SDK and required dependencies
      if (!buildGradle.includes("tiktok-business-android-sdk")) {
        const dependenciesRegex = /(dependencies\s*{)/;
        buildGradle = buildGradle.replace(
          dependenciesRegex,
          `$1
    // TikTok Business SDK
    implementation(name: 'tiktok-business-android-sdk-1.6.0', ext: 'aar')
    // Required for TikTok SDK - app lifecycle
    implementation 'androidx.lifecycle:lifecycle-process:2.6.2'
    implementation 'androidx.lifecycle:lifecycle-common-java8:2.6.2'
    // Required for TikTok SDK - Google install referrer
    implementation 'com.android.installreferrer:installreferrer:2.2'`
        );
      }

      config.modResults.contents = buildGradle;
    }
    return config;
  });

  // Modify MainApplication.java to register the package
  config = withMainApplication(config, (config) => {
    if (config.modResults.language === 'java') {
      let mainApplication = config.modResults.contents;

      // Add import for TikTokSDKPackage
      if (!mainApplication.includes('import com.aiportrait.studio.TikTokSDKPackage;')) {
        const packageRegex = /(package com\.aiportrait\.studio;)/;
        mainApplication = mainApplication.replace(
          packageRegex,
          `$1

import com.aiportrait.studio.TikTokSDKPackage;`
        );
      }

      // Add package to the list
      if (!mainApplication.includes('new TikTokSDKPackage()')) {
        const packagesRegex = /(packages\.add\(new ModuleRegistryAdapter\(mModuleRegistryProvider\)\);)/;
        if (packagesRegex.test(mainApplication)) {
          mainApplication = mainApplication.replace(
            packagesRegex,
            `$1
        packages.add(new TikTokSDKPackage());`
          );
        } else {
          // Alternative pattern for different Expo versions
          const returnPackagesRegex = /(return packages;)/;
          mainApplication = mainApplication.replace(
            returnPackagesRegex,
            `packages.add(new TikTokSDKPackage());
        $1`
          );
        }
      }

      config.modResults.contents = mainApplication;
    }
    return config;
  });

  return config;
};

module.exports = withTikTokSDK;
