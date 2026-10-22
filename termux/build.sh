#!/bin/bash
# Simple Termux APK Build Script

APP_NAME="MyApp"
PACKAGE_NAME="com.example.myapp"
ANDROID_JAR="$PREFIX/lib/android/android.jar"

echo "Step 1: Packaging resources..."
aapt package -f -M AndroidManifest.xml -S res -I $ANDROID_JAR -F app.apk.unaligned

echo "Step 2: Compiling Java..."
ecj -d obj -classpath $ANDROID_JAR:obj src/MainActivity.java
ecj -d obj -classpath $ANDROID_JAR:obj R.java

echo "Step 3: Converting to DEX..."
dx --dex --output=classes.dex obj

echo "Step 4: Adding DEX to APK..."
aapt add app.apk.unaligned classes.dex

echo "Step 5: Signing APK..."
keytool -genkeypair -validity 1000 -dname "CN=debug" -keystore debug.keystore -storepass android -keypass android -alias debug
apksigner sign --ks debug.keystore --ks-pass pass:android app.apk.unaligned

echo "Step 6: Installing..."
termux-open app.apk.unaligned
