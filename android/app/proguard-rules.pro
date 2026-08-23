# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Preserve line numbers for debugging stack traces
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# --- Capacitor plugin system ---
# Capacitor loads plugins via reflection, so all plugin classes must be kept.
-keep class com.getcapacitor.** { *; }
-keep class com.getcapacitor.plugin.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }

# Keep all classes in the app's package (plugin registrations)
-keep class com.krepych.communal.** { *; }

# --- Camera plugin ---
-keep class com.capacitorjs.plugins.camera.** { *; }

# --- Local Notifications plugin ---
-keep class com.capacitorjs.plugins.localnotifications.** { *; }

# --- WebView JavaScript interface ---
# Capacitor injects a JS bridge interface into the WebView
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# --- Cordova plugins (if any) ---
-keep class org.apache.cordova.** { *; }
