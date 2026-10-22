export interface AndroidSdkVersion {
  apiLevel: number;
  versionName: string;
  codeName: string;
  releaseYear: number;
  minSupportedJava: string;
  recommendedEcjFlags: string;
  recommendedDxFlags: string;
  recommendedAaptFlags: string;
  signatureSchemes: string[];
  keyChanges: string[];
  securityNotes: string;
  isPopular?: boolean;
}

export const ANDROID_SDK_VERSIONS: AndroidSdkVersion[] = [
  {
    apiLevel: 21,
    versionName: 'Android 5.0',
    codeName: 'Lollipop',
    releaseYear: 2014,
    minSupportedJava: '1.7',
    recommendedEcjFlags: '-1.7 -encoding UTF-8',
    recommendedDxFlags: '--min-sdk-version=21',
    recommendedAaptFlags: '--min-sdk-version 21 --target-sdk-version 21',
    signatureSchemes: ['v1 (JAR)'],
    keyChanges: [
      'ART (Android Runtime) replaces Dalvik as default VM',
      'Native 64-bit architecture support',
      'Material Design theme introduced',
    ],
    securityNotes: 'Legacy TLS 1.0/1.1 enabled by default. No scoped storage enforcement.',
  },
  {
    apiLevel: 22,
    versionName: 'Android 5.1',
    codeName: 'Lollipop MR1',
    releaseYear: 2015,
    minSupportedJava: '1.7',
    recommendedEcjFlags: '-1.7 -encoding UTF-8',
    recommendedDxFlags: '--min-sdk-version=22',
    recommendedAaptFlags: '--min-sdk-version 22 --target-sdk-version 22',
    signatureSchemes: ['v1 (JAR)'],
    keyChanges: [
      'Multi-SIM support APIs',
      'Carrier billing services',
      'Stability and ART runtime optimizations',
    ],
    securityNotes: 'Legacy permission model with all permissions granted at install time.',
  },
  {
    apiLevel: 23,
    versionName: 'Android 6.0',
    codeName: 'Marshmallow',
    releaseYear: 2015,
    minSupportedJava: '1.7',
    recommendedEcjFlags: '-1.7 -encoding UTF-8',
    recommendedDxFlags: '--min-sdk-version=23',
    recommendedAaptFlags: '--min-sdk-version 23 --target-sdk-version 23',
    signatureSchemes: ['v1 (JAR)'],
    keyChanges: [
      'Runtime Permissions introduced (checkSelfPermission, requestPermissions)',
      'Doze Mode and App Standby battery optimizations',
      'FingerprintManager native hardware APIs',
    ],
    securityNotes: 'Dangerous permissions require runtime prompt. Apache HTTP client removed.',
    isPopular: true,
  },
  {
    apiLevel: 24,
    versionName: 'Android 7.0',
    codeName: 'Nougat',
    releaseYear: 2016,
    minSupportedJava: '1.8',
    recommendedEcjFlags: '-1.8 -encoding UTF-8',
    recommendedDxFlags: '--min-sdk-version=24',
    recommendedAaptFlags: '--min-sdk-version 24 --target-sdk-version 24',
    signatureSchemes: ['v1 (JAR)', 'v2 (Full APK)'],
    keyChanges: [
      'APK Signature Scheme v2 introduced (faster verification, tamper protection)',
      'Java 8 language features (lambdas, default methods) supported in toolchain',
      'Multi-window split-screen mode support',
    ],
    securityNotes: 'Direct Boot mode and file-based encryption introduced.',
  },
  {
    apiLevel: 25,
    versionName: 'Android 7.1',
    codeName: 'Nougat MR1',
    releaseYear: 2016,
    minSupportedJava: '1.8',
    recommendedEcjFlags: '-1.8 -encoding UTF-8',
    recommendedDxFlags: '--min-sdk-version=25',
    recommendedAaptFlags: '--min-sdk-version 25 --target-sdk-version 25',
    signatureSchemes: ['v1 (JAR)', 'v2 (Full APK)'],
    keyChanges: [
      'App Shortcuts API for launcher quick actions',
      'Round icon resources (android:roundIcon)',
      'Storage Manager intent APIs',
    ],
    securityNotes: 'Network security config introduced for custom CA certificates.',
  },
  {
    apiLevel: 26,
    versionName: 'Android 8.0',
    codeName: 'Oreo',
    releaseYear: 2017,
    minSupportedJava: '1.8',
    recommendedEcjFlags: '-1.8 -encoding UTF-8',
    recommendedDxFlags: '--min-sdk-version=26',
    recommendedAaptFlags: '--min-sdk-version 26 --target-sdk-version 26',
    signatureSchemes: ['v1 (JAR)', 'v2 (Full APK)'],
    keyChanges: [
      'Notification Channels mandatory for all posted notifications',
      'Background execution limits on implicit broadcasts and services',
      'Autofill framework and Picture-in-Picture (PiP) support',
    ],
    securityNotes: 'Strict limits on background location polling and background services.',
    isPopular: true,
  },
  {
    apiLevel: 27,
    versionName: 'Android 8.1',
    codeName: 'Oreo MR1',
    releaseYear: 2017,
    minSupportedJava: '1.8',
    recommendedEcjFlags: '-1.8 -encoding UTF-8',
    recommendedDxFlags: '--min-sdk-version=27',
    recommendedAaptFlags: '--min-sdk-version 27 --target-sdk-version 27',
    signatureSchemes: ['v1 (JAR)', 'v2 (Full APK)'],
    keyChanges: [
      'Neural Networks API (NNAPI) for on-device machine learning',
      'Shared memory APIs (SharedMemory)',
      'Memory optimizations for Android Go edition',
    ],
    securityNotes: 'Safer browsing APIs enabled through WebView provider.',
  },
  {
    apiLevel: 28,
    versionName: 'Android 9.0',
    codeName: 'Pie',
    releaseYear: 2018,
    minSupportedJava: '1.8',
    recommendedEcjFlags: '-1.8 -encoding UTF-8',
    recommendedDxFlags: '--min-sdk-version=28',
    recommendedAaptFlags: '--min-sdk-version 28 --target-sdk-version 28',
    signatureSchemes: ['v1 (JAR)', 'v2 (Full APK)', 'v3 (Key Rotation)'],
    keyChanges: [
      'APK Signature Scheme v3 with key rotation history introduced',
      'Cleartext HTTP (non-HTTPS) traffic disabled by default',
      'Display cutout / notch support APIs',
    ],
    securityNotes: 'HTTP traffic blocked unless android:usesCleartextTraffic="true" is set.',
    isPopular: true,
  },
  {
    apiLevel: 29,
    versionName: 'Android 10',
    codeName: 'Q',
    releaseYear: 2019,
    minSupportedJava: '1.8',
    recommendedEcjFlags: '-1.8 -encoding UTF-8',
    recommendedDxFlags: '--min-sdk-version=29',
    recommendedAaptFlags: '--min-sdk-version 29 --target-sdk-version 29',
    signatureSchemes: ['v1 (JAR)', 'v2 (Full APK)', 'v3 (Key Rotation)'],
    keyChanges: [
      'Scoped Storage introduced for /sdcard external storage access',
      'System-wide Dark Theme support',
      'Gesture navigation insets APIs',
    ],
    securityNotes: 'Direct file path access deprecated in favor of Storage Access Framework (SAF).',
  },
  {
    apiLevel: 30,
    versionName: 'Android 11',
    codeName: 'Red Velvet Cake',
    releaseYear: 2020,
    minSupportedJava: '1.8',
    recommendedEcjFlags: '-1.8 -encoding UTF-8',
    recommendedDxFlags: '--min-sdk-version=30',
    recommendedAaptFlags: '--min-sdk-version 30 --target-sdk-version 30',
    signatureSchemes: ['v1 (JAR)', 'v2 (Full APK)', 'v3 (Key Rotation)'],
    keyChanges: [
      'Package Visibility filtering requires <queries> block in AndroidManifest.xml',
      'Enforced Scoped Storage without requestLegacyExternalStorage flag',
      'One-time permission grants for Location, Camera, and Microphone',
    ],
    securityNotes: 'Apps cannot inspect other installed packages without <queries> declaration.',
  },
  {
    apiLevel: 31,
    versionName: 'Android 12',
    codeName: 'Snow Cone',
    releaseYear: 2021,
    minSupportedJava: '1.8',
    recommendedEcjFlags: '-1.8 -encoding UTF-8',
    recommendedDxFlags: '--min-sdk-version=31',
    recommendedAaptFlags: '--min-sdk-version 31 --target-sdk-version 31',
    signatureSchemes: ['v1 (JAR)', 'v2 (Full APK)', 'v3 (Key Rotation)'],
    keyChanges: [
      'android:exported="true|false" mandatory on all <activity>, <service>, <receiver>',
      'Material You dynamic color palettes',
      'Approximate vs Precise location permission toggle',
    ],
    securityNotes: 'Build or install will fail if intent-filter exists without explicit android:exported.',
    isPopular: true,
  },
  {
    apiLevel: 32,
    versionName: 'Android 12L',
    codeName: 'Snow Cone v2',
    releaseYear: 2022,
    minSupportedJava: '1.8',
    recommendedEcjFlags: '-1.8 -encoding UTF-8',
    recommendedDxFlags: '--min-sdk-version=32',
    recommendedAaptFlags: '--min-sdk-version 32 --target-sdk-version 32',
    signatureSchemes: ['v1 (JAR)', 'v2 (Full APK)', 'v3 (Key Rotation)'],
    keyChanges: [
      'Foldable and tablet dual-pane taskbar optimizations',
      'Enhanced activity embedding and letterboxing',
      'Large screen display metrics',
    ],
    securityNotes: 'Continuation of strict Android 12 component export and security rules.',
  },
  {
    apiLevel: 33,
    versionName: 'Android 13',
    codeName: 'Tiramisu',
    releaseYear: 2022,
    minSupportedJava: '1.8',
    recommendedEcjFlags: '-1.8 -encoding UTF-8',
    recommendedDxFlags: '--min-sdk-version=33',
    recommendedAaptFlags: '--min-sdk-version 33 --target-sdk-version 33',
    signatureSchemes: ['v1 (JAR)', 'v2 (Full APK)', 'v3 (Key Rotation)'],
    keyChanges: [
      'POST_NOTIFICATIONS runtime permission required before showing alerts',
      'Granular media permissions (READ_MEDIA_IMAGES, READ_MEDIA_VIDEO)',
      'Per-app language preferences',
    ],
    securityNotes: 'Apps targeting API 33 must explicitly request POST_NOTIFICATIONS.',
    isPopular: true,
  },
  {
    apiLevel: 34,
    versionName: 'Android 14',
    codeName: 'Upside Down Cake',
    releaseYear: 2023,
    minSupportedJava: '1.8',
    recommendedEcjFlags: '-1.8 -encoding UTF-8',
    recommendedDxFlags: '--min-sdk-version=34',
    recommendedAaptFlags: '--min-sdk-version 34 --target-sdk-version 34',
    signatureSchemes: ['v1 (JAR)', 'v2 (Full APK)', 'v3 (Key Rotation)'],
    keyChanges: [
      'Foreground Service Types mandatory (camera, location, mediaPlayback, etc.)',
      'Partial photo access (READ_MEDIA_VISUAL_USER_SELECTED)',
      'Implicit intent restrictions on broadcast receivers',
    ],
    securityNotes: 'Foreground services must specify android:foregroundServiceType in manifest.',
    isPopular: true,
  },
  {
    apiLevel: 35,
    versionName: 'Android 15',
    codeName: 'Vanilla Ice Cream',
    releaseYear: 2024,
    minSupportedJava: '1.8',
    recommendedEcjFlags: '-1.8 -encoding UTF-8',
    recommendedDxFlags: '--min-sdk-version=35',
    recommendedAaptFlags: '--min-sdk-version 35 --target-sdk-version 35',
    signatureSchemes: ['v1 (JAR)', 'v2 (Full APK)', 'v3 (Key Rotation)'],
    keyChanges: [
      '16KB page alignment support required for native binaries & ART',
      'Edge-to-edge layout enforcement by default (deprecated fitSystemWindows)',
      'Private Space protected profile integration',
    ],
    securityNotes: '16KB ELF page size compliance required for future Android 15+ hardware.',
    isPopular: true,
  },
];

export function getSdkConfig(apiLevel: number): AndroidSdkVersion {
  return (
    ANDROID_SDK_VERSIONS.find((v) => v.apiLevel === apiLevel) ||
    ANDROID_SDK_VERSIONS[ANDROID_SDK_VERSIONS.length - 1]
  );
}

export function generateSdkBuildScriptConstants(minSdk: number, targetSdk: number): string {
  const minInfo = getSdkConfig(minSdk);
  const targetInfo = getSdkConfig(targetSdk);

  const isV3Active = targetSdk >= 28;
  const isExportedRequired = targetSdk >= 31;
  const is16KbRelevant = targetSdk >= 35;

  return `# ==========================================
# Android SDK Toolchain Constants
# ==========================================
MIN_SDK_VERSION=${minSdk}        # ${minInfo.versionName} (${minInfo.codeName})
TARGET_SDK_VERSION=${targetSdk}     # ${targetInfo.versionName} (${targetInfo.codeName})

# AAPT Resource Packaging Flags
AAPT_FLAGS="--min-sdk-version $MIN_SDK_VERSION --target-sdk-version $TARGET_SDK_VERSION"

# ECJ Java Compiler Compliance Flags
ECJ_FLAGS="${targetInfo.recommendedEcjFlags}"

# DX Dalvik Bytecode Converter Flags
DX_FLAGS="${minInfo.recommendedDxFlags}"

# APKSigner Cryptographic Signature Flags
APKSIGNER_FLAGS="--v1-signing-enabled true --v2-signing-enabled true${isV3Active ? ' --v3-signing-enabled true' : ''}"

# Platform Rules:
# - android:exported="true|false": ${isExportedRequired ? 'MANDATORY (API 31+)' : 'Optional'}
# - Cleartext HTTP: ${targetSdk >= 28 ? 'BLOCKED by default (API 28+)' : 'Permitted'}
# - Notification Permission: ${targetSdk >= 33 ? 'POST_NOTIFICATIONS required (API 33+)' : 'Automatic'}
# - 16KB Page Alignment: ${is16KbRelevant ? 'Enforced for native binaries (API 35+)' : 'Standard 4KB'}
`;
}
