import { ProjectConfig } from '../types';

export interface ScannedConfigResult {
  detectedFormat: 'json' | 'manifest_xml' | 'properties' | 'bash_script' | 'yaml_text';
  rawFileName: string;
  fieldsFoundCount: number;
  extracted: {
    name?: string;
    packageName?: string;
    minSdk?: number;
    targetSdk?: number;
    versionCode?: number;
    versionName?: string;
    permissions?: string[];
    selectedIdeas?: string[];
    notes?: string;
  };
  warnings: string[];
}

// Generate Blank Export Templates to be filled out
export function getBlankJsonTemplate(): string {
  return JSON.stringify(
    {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      title: 'Termux APK Project Configuration Template',
      description: 'Fill in this blank configuration and upload it to the scanner to populate all input boxes automatically.',
      appName: 'MyAwesomeApp',
      packageName: 'com.example.myawesomeapp',
      minSdk: 21,
      targetSdk: 34,
      versionCode: 1,
      versionName: '1.0.0',
      permissions: [
        'android.permission.INTERNET',
        'android.permission.VIBRATE',
        'android.permission.POST_NOTIFICATIONS',
      ],
      features: [
        'Material UI Theme',
        'SharedPreferences Persistence',
        'Termux Shell Executor View',
      ],
      notes: 'Custom offline Android tool built natively on Termux.',
    },
    null,
    2
  );
}

export function getBlankPropertiesTemplate(): string {
  return `# ====================================================================
# Termux APK Creator - Blank Project Configuration Input Template
# ====================================================================
# Instructions:
# 1. Fill out or modify the values below.
# 2. Save this file (e.g., project.properties or .env).
# 3. Drag and drop or upload this file into the "Scan & Input" modal.
# ====================================================================

APP_NAME=MyAwesomeApp
PACKAGE_NAME=com.example.myawesomeapp
MIN_SDK=21
TARGET_SDK=34
VERSION_CODE=1
VERSION_NAME=1.0.0
PERMISSIONS=android.permission.INTERNET, android.permission.VIBRATE, android.permission.POST_NOTIFICATIONS
FEATURES=Material UI Theme, SharedPreferences Persistence
NOTES=Native Termux APK compiled with aapt, ecj, dx, and apksigner
`;
}

export function getBlankManifestXmlTemplate(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<!-- 
  Termux APK Creator - Blank Manifest Template
  Fill in your package name, SDK levels, and permissions below, then upload back to the system.
-->
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.myawesomeapp"
    android:versionCode="1"
    android:versionName="1.0.0">

    <uses-sdk
        android:minSdkVersion="21"
        android:targetSdkVersion="34" />

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application
        android:label="MyAwesomeApp"
        android:allowBackup="true"
        android:theme="@android:style/Theme.DeviceDefault.NoActionBar">
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`;
}

// Helper to trigger browser file download
export function triggerTextDownload(fileName: string, content: string, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

// Core Scanner & Parser Engine
export function parseUploadedConfigFile(fileName: string, content: string): ScannedConfigResult {
  const warnings: string[] = [];
  const extracted: ScannedConfigResult['extracted'] = {};
  let detectedFormat: ScannedConfigResult['detectedFormat'] = 'yaml_text';

  const cleanContent = content.trim();

  // 1. Check for JSON format
  if (
    (cleanContent.startsWith('{') && cleanContent.endsWith('}')) ||
    fileName.toLowerCase().endsWith('.json')
  ) {
    try {
      const parsed = JSON.parse(cleanContent);
      detectedFormat = 'json';

      // App Name
      if (parsed.appName || parsed.name || parsed.app_name || parsed.title) {
        extracted.name = String(parsed.appName || parsed.name || parsed.app_name || parsed.title).trim();
      }

      // Package Name
      if (parsed.packageName || parsed.package_name || parsed.package || parsed.applicationId) {
        extracted.packageName = String(
          parsed.packageName || parsed.package_name || parsed.package || parsed.applicationId
        ).trim().toLowerCase();
      }

      // Min SDK
      const rawMin = parsed.minSdk ?? parsed.minSdkVersion ?? parsed.min_sdk;
      if (rawMin !== undefined && !isNaN(Number(rawMin))) {
        extracted.minSdk = Math.max(14, Math.min(35, Number(rawMin)));
      }

      // Target SDK
      const rawTarget = parsed.targetSdk ?? parsed.targetSdkVersion ?? parsed.target_sdk;
      if (rawTarget !== undefined && !isNaN(Number(rawTarget))) {
        extracted.targetSdk = Math.max(21, Math.min(35, Number(rawTarget)));
      }

      // Version Code & Name
      if (parsed.versionCode !== undefined && !isNaN(Number(parsed.versionCode))) {
        extracted.versionCode = Number(parsed.versionCode);
      }
      if (parsed.versionName) {
        extracted.versionName = String(parsed.versionName).trim();
      }

      // Permissions
      if (Array.isArray(parsed.permissions)) {
        extracted.permissions = parsed.permissions
          .map((p: any) => String(p).trim())
          .filter((p: string) => p.length > 0);
      }

      // Selected Ideas / Features
      if (Array.isArray(parsed.features || parsed.selectedIdeas || parsed.ideas)) {
        extracted.selectedIdeas = (parsed.features || parsed.selectedIdeas || parsed.ideas)
          .map((i: any) => String(i).trim())
          .filter((i: string) => i.length > 0);
      }

      // Notes
      if (parsed.notes || parsed.description) {
        extracted.notes = String(parsed.notes || parsed.description).trim();
      }
    } catch (e: any) {
      warnings.push(`JSON syntax parse error: ${e.message}. Attempting regex fallback.`);
    }
  }

  // 2. Check for XML Manifest format
  if (
    detectedFormat !== 'json' &&
    (cleanContent.includes('<manifest') || fileName.toLowerCase().endsWith('.xml'))
  ) {
    detectedFormat = 'manifest_xml';

    // Package Name
    const pkgMatch = cleanContent.match(/package\s*=\s*["']([^"']+)["']/i);
    if (pkgMatch && pkgMatch[1]) {
      extracted.packageName = pkgMatch[1].trim().toLowerCase();
    }

    // Version Code & Name
    const vCodeMatch = cleanContent.match(/android:versionCode\s*=\s*["'](\d+)["']/i);
    if (vCodeMatch && vCodeMatch[1]) {
      extracted.versionCode = Number(vCodeMatch[1]);
    }
    const vNameMatch = cleanContent.match(/android:versionName\s*=\s*["']([^"']+)["']/i);
    if (vNameMatch && vNameMatch[1]) {
      extracted.versionName = vNameMatch[1].trim();
    }

    // Min SDK
    const minSdkMatch = cleanContent.match(/android:minSdkVersion\s*=\s*["'](\d+)["']/i);
    if (minSdkMatch && minSdkMatch[1]) {
      extracted.minSdk = Math.max(14, Math.min(35, Number(minSdkMatch[1])));
    }

    // Target SDK
    const targetSdkMatch = cleanContent.match(/android:targetSdkVersion\s*=\s*["'](\d+)["']/i);
    if (targetSdkMatch && targetSdkMatch[1]) {
      extracted.targetSdk = Math.max(21, Math.min(35, Number(targetSdkMatch[1])));
    }

    // App Label / Name
    const labelMatch = cleanContent.match(/android:label\s*=\s*["']([^"']+)["']/i);
    if (labelMatch && labelMatch[1]) {
      const rawLabel = labelMatch[1].trim();
      if (!rawLabel.startsWith('@string/')) {
        extracted.name = rawLabel;
      } else if (extracted.packageName) {
        // Derive clean name from package last segment if string reference
        const segments = extracted.packageName.split('.');
        const last = segments[segments.length - 1];
        extracted.name = last ? last.charAt(0).toUpperCase() + last.slice(1) : 'MyApp';
      }
    }

    // Permissions
    const permMatches = Array.from(
      cleanContent.matchAll(/<uses-permission[^>]+android:name\s*=\s*["']([^"']+)["']/gi)
    );
    if (permMatches.length > 0) {
      extracted.permissions = Array.from(
        new Set(permMatches.map((m) => m[1].trim()))
      );
    }
  }

  // 3. Check for Bash build.sh Script format
  if (
    detectedFormat !== 'json' &&
    detectedFormat !== 'manifest_xml' &&
    (cleanContent.startsWith('#!') || cleanContent.includes('ANDROID_JAR') || fileName.toLowerCase().endsWith('.sh'))
  ) {
    detectedFormat = 'bash_script';

    const minSdkMatch = cleanContent.match(/MIN_SDK_VERSION\s*=\s*(\d+)/i);
    if (minSdkMatch && minSdkMatch[1]) {
      extracted.minSdk = Number(minSdkMatch[1]);
    }

    const targetSdkMatch = cleanContent.match(/TARGET_SDK_VERSION\s*=\s*(\d+)/i);
    if (targetSdkMatch && targetSdkMatch[1]) {
      extracted.targetSdk = Number(targetSdkMatch[1]);
    }

    const headerMatch = cleanContent.match(/===\s*Building\s+([^(]+)\s*\(([^)]+)\)\s*===/i);
    if (headerMatch) {
      if (headerMatch[1]) extracted.name = headerMatch[1].trim();
      if (headerMatch[2]) extracted.packageName = headerMatch[2].trim().toLowerCase();
    }

    const pkgDirectMatch = cleanContent.match(/build\/gen\/([a-zA-Z0-9_/]+)\/R\.java/i);
    if (pkgDirectMatch && pkgDirectMatch[1] && !extracted.packageName) {
      extracted.packageName = pkgDirectMatch[1].replace(/\//g, '.');
    }
  }

  // 4. Check for Key-Value Properties (.properties / .env / .ini / txt)
  if (
    detectedFormat === 'yaml_text' ||
    fileName.toLowerCase().endsWith('.properties') ||
    fileName.toLowerCase().endsWith('.env')
  ) {
    const lines = cleanContent.split('\n');
    let propertiesMatchCount = 0;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#') || line.startsWith('//')) continue;

      const delimiter = line.includes('=') ? '=' : line.includes(':') ? ':' : null;
      if (!delimiter) continue;

      const [rawKey, ...rest] = line.split(delimiter);
      const key = rawKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '');
      const val = rest.join(delimiter).trim().replace(/^["']|["']$/g, '');

      if (!key || !val) continue;

      if (['APP_NAME', 'NAME', 'APPLICATION_NAME', 'TITLE'].includes(key)) {
        extracted.name = val;
        propertiesMatchCount++;
      } else if (['PACKAGE_NAME', 'PACKAGE', 'APPLICATION_ID', 'PKG'].includes(key)) {
        extracted.packageName = val.toLowerCase();
        propertiesMatchCount++;
      } else if (['MIN_SDK', 'MIN_SDK_VERSION', 'MINSDK'].includes(key)) {
        const num = Number(val);
        if (!isNaN(num)) {
          extracted.minSdk = Math.max(14, Math.min(35, num));
          propertiesMatchCount++;
        }
      } else if (['TARGET_SDK', 'TARGET_SDK_VERSION', 'TARGETSDK'].includes(key)) {
        const num = Number(val);
        if (!isNaN(num)) {
          extracted.targetSdk = Math.max(21, Math.min(35, num));
          propertiesMatchCount++;
        }
      } else if (['VERSION_CODE', 'BUILD_NUMBER'].includes(key)) {
        const num = Number(val);
        if (!isNaN(num)) {
          extracted.versionCode = num;
          propertiesMatchCount++;
        }
      } else if (['VERSION_NAME', 'VERSION'].includes(key)) {
        extracted.versionName = val;
        propertiesMatchCount++;
      } else if (['PERMISSIONS', 'USES_PERMISSIONS'].includes(key)) {
        extracted.permissions = val
          .split(',')
          .map((p) => p.trim())
          .filter((p) => p.length > 0);
        propertiesMatchCount++;
      } else if (['FEATURES', 'SELECTED_IDEAS', 'MODULES'].includes(key)) {
        extracted.selectedIdeas = val
          .split(',')
          .map((i) => i.trim())
          .filter((i) => i.length > 0);
        propertiesMatchCount++;
      } else if (['NOTES', 'DESCRIPTION', 'SUMMARY'].includes(key)) {
        extracted.notes = val;
        propertiesMatchCount++;
      }
    }

    if (propertiesMatchCount > 0) {
      detectedFormat = 'properties';
    }
  }

  // 5. Fallback Heuristic Regex Scanning across arbitrary document content
  if (!extracted.packageName) {
    const reverseDomainRegex = /\b([a-z][a-z0-9_]*\.[a-z][a-z0-9_]+(?:\.[a-z][a-z0-9_]+)+)\b/i;
    const match = cleanContent.match(reverseDomainRegex);
    if (match && match[1] && !match[1].startsWith('org.w3c') && !match[1].startsWith('http')) {
      extracted.packageName = match[1].toLowerCase();
      warnings.push(`Inferred package name "${extracted.packageName}" via reverse-domain pattern matching.`);
    }
  }

  // Validate Reverse Domain Package Format
  if (extracted.packageName) {
    const pkgValid = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(extracted.packageName);
    if (!pkgValid) {
      warnings.push(`Extracted package name "${extracted.packageName}" does not strictly follow reverse-domain format (e.g., com.example.app).`);
    }
  }

  // Calculate field counts
  let count = 0;
  if (extracted.name) count++;
  if (extracted.packageName) count++;
  if (extracted.minSdk !== undefined) count++;
  if (extracted.targetSdk !== undefined) count++;
  if (extracted.versionCode !== undefined) count++;
  if (extracted.versionName !== undefined) count++;
  if (extracted.permissions && extracted.permissions.length > 0) count++;
  if (extracted.selectedIdeas && extracted.selectedIdeas.length > 0) count++;
  if (extracted.notes) count++;

  return {
    detectedFormat,
    rawFileName: fileName,
    fieldsFoundCount: count,
    extracted,
    warnings,
  };
}

// Map scanned result into a clean ProjectConfig
export function applyScannedToProjectConfig(
  current: ProjectConfig,
  scanned: ScannedConfigResult['extracted']
): ProjectConfig {
  const updated: ProjectConfig = {
    ...current,
    name: scanned.name?.trim() || current.name,
    packageName: scanned.packageName?.trim().toLowerCase() || current.packageName,
    minSdk: scanned.minSdk || current.minSdk,
    targetSdk: scanned.targetSdk || current.targetSdk,
    versionCode: scanned.versionCode || current.versionCode || 1,
    versionName: scanned.versionName || current.versionName || '1.0.0',
    permissions:
      scanned.permissions && scanned.permissions.length > 0
        ? scanned.permissions
        : current.permissions || ['android.permission.INTERNET', 'android.permission.VIBRATE'],
    selectedIdeas:
      scanned.selectedIdeas && scanned.selectedIdeas.length > 0
        ? Array.from(new Set([...current.selectedIdeas, ...scanned.selectedIdeas]))
        : current.selectedIdeas,
    notes: scanned.notes || current.notes || '',
    updatedAt: new Date().toISOString(),
  };

  return updated;
}
