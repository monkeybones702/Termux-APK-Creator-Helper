import { FeatureIdea, ProjectConfig, ProjectFile } from '../types';

export const FEATURE_CATEGORIES = [
  'All Categories',
  'UI & Navigation',
  'Termux & Shell',
  'Data & Offline Storage',
  'Network, Web & AI',
  'Hardware & Sensors',
  'Security & Auth',
  'Media & Background',
] as const;

export const EXTENSIVE_FEATURE_IDEAS: FeatureIdea[] = [
  // UI & Navigation
  {
    id: 'ui-tabs',
    title: 'Multi-View Tab Switcher',
    category: 'UI & Navigation',
    description: 'Zero-dependency tab bar using LinearLayout and ViewFlipper for fast screen switching.',
    promptTemplate: 'Add a Multi-View Tab Switcher to our Android app using standard Android SDK LinearLayout buttons and a ViewFlipper so users can switch between Home, Logs, and Settings views.',
    codeEnhancementHint: 'Add a ViewFlipper with 3 views and top tab navigation buttons in activity_main.xml and MainActivity.java.',
  },
  {
    id: 'ui-dark-theme',
    title: 'Dynamic Dark / High-Contrast Theme Toggle',
    category: 'UI & Navigation',
    description: 'Runtime palette toggle saving user theme preference in SharedPreferences.',
    promptTemplate: 'Implement a Dynamic Dark / High-Contrast Theme Toggle in MainActivity that updates background and text colors at runtime and persists the choice in SharedPreferences.',
    codeEnhancementHint: 'Add runtime color theme switching and SharedPreferences persistence to MainActivity.java.',
  },
  {
    id: 'ui-searchable-list',
    title: 'Searchable ListView with Live Filter',
    category: 'UI & Navigation',
    description: 'EditText filter bar wired to an ArrayAdapter ListView for instant client-side filtering.',
    promptTemplate: 'Add a Searchable ListView with an EditText search bar and TextWatcher so users can filter items in real time.',
    codeEnhancementHint: 'Add an EditText and ListView with ArrayAdapter live filtering in MainActivity.java and activity_main.xml.',
  },
  {
    id: 'ui-dialog-builder',
    title: 'AlertDialog Input & Confirmation Modals',
    category: 'UI & Navigation',
    description: 'Native AlertDialog.Builder modals with custom EditText input prompts.',
    promptTemplate: 'Show how to add native AlertDialog modals with custom text input and action callbacks into our app.',
    codeEnhancementHint: 'Add an AlertDialog.Builder prompt with an EditText input field triggered by a button.',
  },
  {
    id: 'ui-swipe-gestures',
    title: 'Touch & Swipe Gesture Detector',
    category: 'UI & Navigation',
    description: 'Custom GestureDetector.SimpleOnGestureListener for left/right swipe actions.',
    promptTemplate: 'Integrate a GestureDetector in MainActivity to detect swipe left, swipe right, and double-tap gestures on the main workspace.',
    codeEnhancementHint: 'Implement GestureDetector.SimpleOnGestureListener in MainActivity.java with visual feedback.',
  },

  // Termux & Shell
  {
    id: 'termux-shell-exec',
    title: 'Native Shell Command Runner',
    category: 'Termux & Shell',
    description: 'Execute local shell commands via ProcessBuilder and stream stdout/stderr to a console view.',
    promptTemplate: 'Build a Native Shell Command Runner inside our APK using ProcessBuilder that executes shell commands (like uname -a, df -h, or ping) and streams stdout/stderr into a scrollable monospace TextView.',
    codeEnhancementHint: 'Add a command input, Execute button, ProcessBuilder runner on a background Thread, and monospace output console.',
  },
  {
    id: 'termux-intent-bridge',
    title: 'Termux RunCommandService Intent Bridge',
    category: 'Termux & Shell',
    description: 'Send explicit intents to com.termux.app.RunCommandService to run scripts in Termux.',
    promptTemplate: 'How do we configure AndroidManifest.xml permissions (com.termux.permission.RUN_COMMAND) and build an Intent in MainActivity to trigger scripts inside Termux via RunCommandService?',
    codeEnhancementHint: 'Add com.termux.permission.RUN_COMMAND to AndroidManifest.xml and a helper method to dispatch Termux RunCommandService intents.',
  },
  {
    id: 'termux-clipboard-share',
    title: 'Clipboard Manager & Share Intent Receiver',
    category: 'Termux & Shell',
    description: 'Copy/paste directly to Android ClipboardManager and accept shared text from other apps.',
    promptTemplate: 'Add ClipboardManager copy/paste buttons and configure an ACTION_SEND intent-filter in AndroidManifest.xml so our APK appears in the Android Share sheet.',
    codeEnhancementHint: 'Add ClipboardManager copy/paste support and handle incoming Intent.ACTION_SEND text in MainActivity.java.',
  },
  {
    id: 'termux-logcat-viewer',
    title: 'In-App Logcat Diagnostic Console',
    category: 'Termux & Shell',
    description: 'Capture and display live app logcat lines inside the app UI for zero-PC debugging.',
    promptTemplate: 'Create an In-App Logcat Diagnostic Console that runs "logcat -d -v time" for our process and displays the logs inside a scrollable view for on-device debugging.',
    codeEnhancementHint: 'Add a diagnostic log viewer function reading logcat output into a ScrollView.',
  },

  // Data & Offline Storage
  {
    id: 'data-sqlite',
    title: 'SQLiteOpenHelper Local Database CRUD',
    category: 'Data & Offline Storage',
    description: 'Embedded SQLite database table with insert, query, and delete methods.',
    promptTemplate: 'Design an embedded SQLiteOpenHelper subclass in our APK to store structured user records locally with create, list, and delete operations.',
    codeEnhancementHint: 'Add an inner SQLiteOpenHelper class with table creation, insertRecord, and getAllRecords methods.',
  },
  {
    id: 'data-shared-prefs',
    title: 'SharedPreferences Config & State Manager',
    category: 'Data & Offline Storage',
    description: 'Persist user settings, counters, and draft inputs automatically across app restarts.',
    promptTemplate: 'Add a SharedPreferences state manager that automatically saves and restores form fields and app counters in onPause and onResume.',
    codeEnhancementHint: 'Add SharedPreferences load and save logic in MainActivity onCreate and onPause.',
  },
  {
    id: 'data-json-backup',
    title: 'JSON File Export & Import Manager',
    category: 'Data & Offline Storage',
    description: 'Serialize app data using org.json.JSONObject and save/load from app-specific storage.',
    promptTemplate: 'Implement a JSON File Export & Import feature using org.json.JSONArray and FileOutputStream so users can back up and restore their data as JSON.',
    codeEnhancementHint: 'Add org.json serialization and file read/write methods using getFilesDir().',
  },
  {
    id: 'data-csv-exporter',
    title: 'CSV Report Generator & Share Trigger',
    category: 'Data & Offline Storage',
    description: 'Format captured records into RFC-4180 CSV and share via Android Intent.',
    promptTemplate: 'Add a CSV Report Generator that formats app data as CSV text and opens an Android Share chooser intent.',
    codeEnhancementHint: 'Add CSV string builder and Intent.ACTION_SEND share trigger.',
  },

  // Network, Web & AI
  {
    id: 'net-http-client',
    title: 'Async REST HTTP JSON Client',
    category: 'Network, Web & AI',
    description: 'Background thread HttpURLConnection GET/POST client with UI thread Handler callback.',
    promptTemplate: 'Write a clean, zero-dependency HTTP client using HttpURLConnection, background Thread, and Handler(Looper.getMainLooper()) to fetch JSON from a REST API and update the UI.',
    codeEnhancementHint: 'Add INTERNET permission in AndroidManifest.xml and an async HttpURLConnection helper in MainActivity.java.',
  },
  {
    id: 'net-webview-bridge',
    title: 'Hybrid WebView with JavaScript Bridge',
    category: 'Network, Web & AI',
    description: 'Embedded Android WebView with @JavascriptInterface for two-way JS-to-Java calls.',
    promptTemplate: 'Add a WebView component with JavaScript enabled and a @JavascriptInterface class so HTML/JS UI can call native Android Toast and storage APIs.',
    codeEnhancementHint: 'Add a WebView and JavascriptInterface bridge method in MainActivity.java.',
  },
  {
    id: 'net-connectivity-monitor',
    title: 'Network Connectivity & Latency Checker',
    category: 'Network, Web & AI',
    description: 'Inspect active network state via ConnectivityManager and measure endpoint response time in ms.',
    promptTemplate: 'Add a Network Connectivity & Latency Checker using ConnectivityManager and a timed HTTP HEAD request to display connection status and latency in milliseconds.',
    codeEnhancementHint: 'Add ACCESS_NETWORK_STATE permission and a latency ping checker.',
  },
  {
    id: 'net-webhook-dispatcher',
    title: 'Custom Webhook Payload Dispatcher',
    category: 'Network, Web & AI',
    description: 'Send JSON POST payloads to custom webhook URLs with status code inspection.',
    promptTemplate: 'Create a Webhook Payload Dispatcher that sends a JSON POST body to a user-specified endpoint and displays the HTTP response status and headers.',
    codeEnhancementHint: 'Add a POST JSON request helper using HttpURLConnection.',
  },

  // Hardware & Sensors
  {
    id: 'hw-sensor-monitor',
    title: 'Accelerometer & Gyroscope Live Telemetry',
    category: 'Hardware & Sensors',
    description: 'Read X/Y/Z axis sensor values via SensorManager and detect device shake events.',
    promptTemplate: 'Integrate SensorManager and SensorEventListener to show live X, Y, Z accelerometer telemetry and trigger an action when the user shakes the phone.',
    codeEnhancementHint: 'Implement SensorEventListener in MainActivity to read TYPE_ACCELEROMETER and detect shake threshold.',
  },
  {
    id: 'hw-battery-telemetry',
    title: 'Battery Health, Voltage & Thermal Monitor',
    category: 'Hardware & Sensors',
    description: 'BroadcastReceiver for ACTION_BATTERY_CHANGED reading level %, temperature, and voltage.',
    promptTemplate: 'Add a Battery & Thermal Monitor using a BroadcastReceiver for Intent.ACTION_BATTERY_CHANGED to display charge percentage, voltage (mV), and temperature (°C).',
    codeEnhancementHint: 'Register an ACTION_BATTERY_CHANGED BroadcastReceiver in MainActivity displaying battery level and temperature.',
  },
  {
    id: 'hw-torch-flashlight',
    title: 'CameraManager Flashlight Strobe & Toggle',
    category: 'Hardware & Sensors',
    description: 'Direct hardware torch control via CameraManager.setTorchMode.',
    promptTemplate: 'Show how to toggle the device flashlight on and off using CameraManager.setTorchMode in Android API 23+.',
    codeEnhancementHint: 'Add CameraManager setTorchMode toggle method with error handling.',
  },
  {
    id: 'hw-haptic-feedback',
    title: 'Haptic Vibration Pattern Controller',
    category: 'Hardware & Sensors',
    description: 'Trigger custom tactile feedback waveforms using Android Vibrator service.',
    promptTemplate: 'Add a Haptic Vibration Pattern Controller using the Vibrator system service and VIBRATE permission in AndroidManifest.xml.',
    codeEnhancementHint: 'Add VIBRATE permission to AndroidManifest.xml and a haptic pulse helper in MainActivity.java.',
  },

  // Security & Auth
  {
    id: 'sec-keyguard-lock',
    title: 'Device Credential / PIN Gatekeeper',
    category: 'Security & Auth',
    description: 'Verify device lock screen PIN/biometrics via KeyguardManager before revealing sensitive views.',
    promptTemplate: 'Use KeyguardManager.createConfirmDeviceCredentialIntent to require the user to unlock with their device PIN or fingerprint before accessing protected app features.',
    codeEnhancementHint: 'Add KeyguardManager device credential check in MainActivity.java.',
  },
  {
    id: 'sec-aes-crypto',
    title: 'AES-GCM Local Vault Encryption',
    category: 'Security & Auth',
    description: 'Encrypt and decrypt sensitive notes or API tokens using javax.crypto.Cipher and AndroidKeyStore.',
    promptTemplate: 'Implement an AES-GCM encryption helper using javax.crypto.Cipher and Base64 so sensitive strings are encrypted before saving to SharedPreferences.',
    codeEnhancementHint: 'Add javax.crypto AES encrypt/decrypt utility methods with Base64 encoding.',
  },
  {
    id: 'sec-runtime-permissions',
    title: 'Runtime Permission Audit & Request Flow',
    category: 'Security & Auth',
    description: 'Check checkSelfPermission and requestPermissions with clear status reporting.',
    promptTemplate: 'Add a Runtime Permission Audit screen that checks granted/denied status of manifest permissions and triggers requestPermissions for Android 6.0+.',
    codeEnhancementHint: 'Add checkSelfPermission and requestPermissions handling in MainActivity.java.',
  },

  // Media & Background
  {
    id: 'media-tts',
    title: 'Native Text-to-Speech (TTS) Reader',
    category: 'Media & Background',
    description: 'Synthesize spoken audio offline using android.speech.tts.TextToSpeech.',
    promptTemplate: 'Integrate android.speech.tts.TextToSpeech into MainActivity so the app can speak status updates or user-entered text aloud.',
    codeEnhancementHint: 'Initialize android.speech.tts.TextToSpeech in MainActivity with a Speak button and proper onDestroy shutdown.',
  },
  {
    id: 'media-tone-synth',
    title: 'DTMF & Audio Tone Generator',
    category: 'Media & Background',
    description: 'Play instant audio feedback beeps and tones using android.media.ToneGenerator.',
    promptTemplate: 'Add an audio feedback helper using android.media.ToneGenerator so button presses and build completions play distinct acoustic tones.',
    codeEnhancementHint: 'Add ToneGenerator beep helper in MainActivity.java.',
  },
  {
    id: 'bg-countdown-timer',
    title: 'Precision CountDownTimer & Stopwatch',
    category: 'Media & Background',
    description: 'Millisecond-accurate CountDownTimer with progress updates and completion alert.',
    promptTemplate: 'Add a configurable CountDownTimer and Stopwatch module with start, pause, reset controls and completion sound/toast.',
    codeEnhancementHint: 'Add android.os.CountDownTimer controls and tabular timer display to MainActivity.java.',
  },
  {
    id: 'bg-alarm-scheduler',
    title: 'AlarmManager Scheduled Task Trigger',
    category: 'Media & Background',
    description: 'Schedule deferred intents using AlarmManager and PendingIntent.',
    promptTemplate: 'Show how to schedule a background reminder or task using AlarmManager and a BroadcastReceiver.',
    codeEnhancementHint: 'Add AlarmManager scheduling logic with PendingIntent.',
  },
  {
    id: 'ui-viewflipper-tabs',
    title: 'Multi-View Tab Switcher (ViewFlipper)',
    category: 'UI & Navigation',
    description: 'High-contrast navigation bar using LinearLayout and instant ViewFlipper transitions.',
    promptTemplate: 'Implement a Multi-View Tab Switcher using ViewFlipper for Home, Logs, and Settings sections, with bottom navigation buttons.',
    codeEnhancementHint: 'Use ViewFlipper and setDisplayedChild() to switch between XML layout sections.',
  },
];

import {
  generateSdkBuildScriptConstants,
  getSdkConfig,
} from './sdkVersions';

export function generateDefaultProjectFiles(config: ProjectConfig): ProjectFile[] {
  const pkg = config.packageName || 'com.example.myapp';
  const appName = config.name || 'MyApp';
  const minSdk = config.minSdk || 21;
  const targetSdk = config.targetSdk || 33;
  const pkgPath = pkg.replace(/\./g, '/');

  const targetSdkInfo = getSdkConfig(targetSdk);
  const minSdkInfo = getSdkConfig(minSdk);
  const sdkConstantsHeader = generateSdkBuildScriptConstants(minSdk, targetSdk);

  const manifestXml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${pkg}"
    android:versionCode="1"
    android:versionName="1.0">

    <uses-sdk
        android:minSdkVersion="${minSdk}"
        android:targetSdkVersion="${targetSdk}" />

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.VIBRATE" />${
      targetSdk >= 33
        ? '\n    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />'
        : ''
    }

    <application
        android:allowBackup="true"
        android:label="@string/app_name"
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
</manifest>`;

  const mainActivityJava = `package ${pkg};

import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

public class MainActivity extends Activity {
    private int clickCount = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        final TextView statusText = findViewById(R.id.status_text);
        Button actionButton = findViewById(R.id.action_button);

        actionButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                clickCount++;
                statusText.setText("${appName} active · Trigger count: " + clickCount);
                Toast.makeText(MainActivity.this, "Event #" + clickCount + " processed", Toast.LENGTH_SHORT).show();
            }
        });
    }
}`;

  const activityMainXml = `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:gravity="center"
    android:padding="24dp"
    android:background="#0F172A">

    <TextView
        android:id="@+id/title_text"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="@string/app_name"
        android:textSize="24sp"
        android:textStyle="bold"
        android:textColor="#F8FAFC"
        android:layout_marginBottom="12dp" />

    <TextView
        android:id="@+id/status_text"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="@string/welcome_message"
        android:textSize="15sp"
        android:textColor="#94A3B8"
        android:gravity="center"
        android:layout_marginBottom="24dp" />

    <Button
        android:id="@+id/action_button"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Run Diagnostic Action"
        android:paddingLeft="20dp"
        android:paddingRight="20dp" />

</LinearLayout>`;

  const stringsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${appName}</string>
    <string name="welcome_message">Compiled natively on Android via Termux (${pkg})</string>
</resources>`;

  const buildSh = `#!/data/data/com.termux/files/usr/bin/bash
set -e

echo "=== Building ${appName} (${pkg}) ==="
ANDROID_JAR="$PREFIX/share/aapt/android.jar"
if [ ! -f "$ANDROID_JAR" ]; then
  ANDROID_JAR="$PREFIX/lib/android/android.jar"
fi

${sdkConstantsHeader}

mkdir -p build/gen build/obj build/apk

echo "[1/6] Packaging resources and generating R.java with aapt (API $TARGET_SDK_VERSION)..."
aapt package -f -m $AAPT_FLAGS \\
  -J build/gen \\
  -M app/src/main/AndroidManifest.xml \\
  -S app/src/main/res \\
  -I "$ANDROID_JAR" \\
  -F build/apk/app.unsigned.apk

echo "[2/6] Compiling Java sources and R.java with ecj ($ECJ_FLAGS)..."
ecj $ECJ_FLAGS -d build/obj -classpath "$ANDROID_JAR" -sourcepath app/src/main/java:build/gen \\
  build/gen/${pkgPath}/R.java \\
  app/src/main/java/${pkgPath}/MainActivity.java

echo "[3/6] Converting .class files into classes.dex with dx ($DX_FLAGS)..."
dx --dex $DX_FLAGS --output=classes.dex build/obj

echo "[4/6] Bundling classes.dex into raw APK with aapt add..."
cp build/apk/app.unsigned.apk app.raw.apk
aapt add app.raw.apk classes.dex

echo "[5/6] Checking debug.keystore and signing APK with apksigner..."
if [ ! -f debug.keystore ]; then
  keytool -genkeypair -v \\
    -keystore debug.keystore \\
    -alias androiddebugkey \\
    -keyalg RSA -keysize 2048 -validity 10000 \\
    -storepass android -keypass android \\
    -dname "CN=Android Debug,O=Android,C=US"
fi

apksigner sign $APKSIGNER_FLAGS \\
  --ks debug.keystore \\
  --ks-key-alias androiddebugkey \\
  --ks-pass pass:android \\
  --key-pass pass:android \\
  --out app.apk \\
  app.raw.apk

rm -f classes.dex app.raw.apk
echo "[6/6] Launching APK installer via termux-open..."
termux-open app.apk
echo "=== Build Complete: app.apk (Target SDK: $TARGET_SDK_VERSION) ==="`;

  return [
    {
      path: 'app/src/main/AndroidManifest.xml',
      description: 'Application manifest defining package identity, SDK targets, permissions, and launcher activity.',
      content: manifestXml,
    },
    {
      path: `app/src/main/java/${pkgPath}/MainActivity.java`,
      description: 'Primary Android Activity entry point handling UI lifecycle and interactive events.',
      content: mainActivityJava,
    },
    {
      path: 'app/src/main/res/layout/activity_main.xml',
      description: 'Main screen XML layout hierarchy.',
      content: activityMainXml,
    },
    {
      path: 'app/src/main/res/values/strings.xml',
      description: 'String resources for localization and manifest references.',
      content: stringsXml,
    },
    {
      path: 'build.sh',
      description: '6-stage Termux compilation, DEX conversion, keystore signing, and APK launch pipeline.',
      content: buildSh,
    },
  ];
}

export function buildCompositeBootstrapScript(files: ProjectFile[]): string {
  const dirs = Array.from(
    new Set(
      files
        .map((f) => {
          const lastSlash = f.path.lastIndexOf('/');
          return lastSlash > 0 ? f.path.substring(0, lastSlash) : null;
        })
        .filter(Boolean)
    )
  );

  const lines: string[] = [
    '#!/data/data/com.termux/files/usr/bin/bash',
    'set -e',
    '',
    '# Create project directory structure',
    `mkdir -p ${dirs.join(' ')}`,
    '',
  ];

  for (const file of files) {
    lines.push(`# Write ${file.path}`);
    lines.push(`cat << 'EOF' > ${file.path}`);
    lines.push(file.content);
    lines.push('EOF');
    lines.push('');
  }

  lines.push('chmod +x build.sh');
  lines.push('echo "Project files bootstrapped! Run ./build.sh to compile and install."');

  return lines.join('\n');
}
