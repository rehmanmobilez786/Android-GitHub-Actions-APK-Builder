export interface AndroidProjectFile {
  path: string;
  name: string;
  category: 'workflow' | 'gradle' | 'manifest' | 'source' | 'resource' | 'wrapper';
  description: string;
  content: string;
}

export const DEFAULT_ANDROID_FILES: AndroidProjectFile[] = [
  {
    path: '.github/workflows/android-build.yml',
    name: 'android-build.yml',
    category: 'workflow',
    description: 'GitHub Actions automated CI/CD workflow for testing, building debug APK & release',
    content: `name: Android CI & APK Build

on:
  push:
    branches: [ "main", "develop" ]
  pull_request:
    branches: [ "main" ]
  workflow_dispatch:
    inputs:
      build_type:
        description: 'Build Variant (debug or release)'
        required: true
        default: 'debug'
        type: choice
        options:
          - debug
          - release
          - both
      run_lint:
        description: 'Run Android Lint Checks'
        type: boolean
        default: true

jobs:
  build:
    name: Build Android APK
    runs-on: ubuntu-latest

    steps:
      - name: 📥 Checkout Repository
        uses: actions/checkout@v4

      - name: ☕ Setup Java 17 (Temurin)
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: 🐘 Setup Gradle Cache
        uses: gradle/actions/setup-gradle@v3
        with:
          cache-read-only: false

      - name: 🔑 Grant Execute Permission for Gradlew
        run: chmod +x gradlew || true

      - name: 🧹 Auto-Clean Conflicting Duplicate Files
        run: |
          echo "Checking and removing conflicting build files..."
          rm -f build.gradle.kts settings.gradle.kts app/build.gradle.kts app/settings.gradle.kts
          echo "✅ Conflicting KTS files cleaned."

      - name: 🔍 Run Android Lint
        if: \${{ github.event.inputs.run_lint != 'false' }}
        run: ./gradlew lintDebug --stacktrace

      - name: 🧪 Run Local Unit Tests
        run: ./gradlew testDebugUnitTest --stacktrace

      - name: 📦 Assemble Debug APK
        if: \${{ github.event.inputs.build_type == 'debug' || github.event.inputs.build_type == 'both' || github.event_name != 'workflow_dispatch' }}
        run: ./gradlew assembleDebug --stacktrace

      - name: 🚀 Assemble Release APK
        if: \${{ github.event.inputs.build_type == 'release' || github.event.inputs.build_type == 'both' }}
        run: ./gradlew assembleRelease --stacktrace

      - name: 📤 Upload Debug APK Artifact
        if: always() && hashFiles('app/build/outputs/apk/debug/*.apk') != ''
        uses: actions/upload-artifact@v4
        with:
          name: app-debug-apk
          path: app/build/outputs/apk/debug/*.apk
          retention-days: 14
`,
  },
  {
    path: '.github/workflows/deploy-pages.yml',
    name: 'deploy-pages.yml (GitHub Pages)',
    category: 'workflow',
    description: 'Automated GitHub Pages deployment to prevent mobile blank screen (ez786.github.io)',
    content: `name: Deploy to GitHub Pages

on:
  push:
    branches: ["main", "master"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build-and-deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci || npm install

      - name: Build production web app
        run: npm run build

      - name: Setup GitHub Pages
        uses: actions/configure-pages@v5

      - name: Upload Pages Artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`,
  },
  {
    path: 'app/build.gradle.kts',
    name: 'build.gradle.kts (App)',
    category: 'gradle',
    description: 'Application-level Gradle build configuration, SDK versions, dependencies',
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.example.githubactionapk"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.example.githubactionapk"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            applicationIdSuffix = ".debug"
            isDebuggable = true
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = false
        viewBinding = true
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")

    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
}
`,
  },
  {
    path: 'build.gradle.kts',
    name: 'build.gradle.kts (Project)',
    category: 'gradle',
    description: 'Top-level root project build configuration',
    content: `// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
}
`,
  },
  {
    path: 'settings.gradle.kts',
    name: 'settings.gradle.kts',
    category: 'gradle',
    description: 'Project settings and repository resolution management',
    content: `pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\\\.android.*")
                includeGroupByRegex("com\\\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "AndroidGitHubActionsAPK"
include(":app")
`,
  },
  {
    path: 'gradle.properties',
    name: 'gradle.properties',
    category: 'gradle',
    description: 'JVM args, AndroidX and parallel build configurations',
    content: `# Project-wide Gradle settings.
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
org.gradle.parallel=true
org.gradle.caching=true
`,
  },
  {
    path: 'gradle/wrapper/gradle-wrapper.properties',
    name: 'gradle-wrapper.properties',
    category: 'wrapper',
    description: 'Official Gradle wrapper distribution specification',
    content: `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.5-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`,
  },
  {
    path: 'gradlew',
    name: 'gradlew (Unix shell script)',
    category: 'wrapper',
    description: 'Gradle wrapper execution script for Linux/macOS GitHub Actions runners',
    content: `#!/bin/sh

# Gradle startup script for UN*X
# Executable by GitHub Actions runners (chmod +x gradlew)
APP_BASE_NAME=\`basename "$0"\`
APP_HOME="\`dirname "$0"\`"
DEFAULT_JVM_OPTS='"-Xmx64m" "-Xms64m"'

CLASSPATH=$APP_HOME/gradle/wrapper/gradle-wrapper.jar

if [ -n "$JAVA_HOME" ] ; then
    JAVACMD="$JAVA_HOME/bin/java"
else
    JAVACMD="java"
fi

exec "$JAVACMD" $DEFAULT_JVM_OPTS -jar "$CLASSPATH" "$@"
`,
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    name: 'AndroidManifest.xml',
    category: 'manifest',
    description: 'Android App manifest declaring package, permissions, and activities',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:allowBackup="true"
        android:icon="@android:drawable/sym_def_app_icon"
        android:label="GitHub Action APK"
        android:roundIcon="@android:drawable/sym_def_app_icon"
        android:supportsRtl="true"
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
`,
  },
  {
    path: 'app/src/main/java/com/example/myapp/MainActivity.kt',
    name: 'MainActivity.kt',
    category: 'source',
    description: 'Main activity Kotlin source code file',
    content: `package com.example.githubactionapk

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import android.widget.TextView

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val textView = TextView(this).apply {
            text = "Built successfully with GitHub Actions CI/CD! 🚀\\n\\nDownload: app-debug.apk"
            textSize = 18f
            setPadding(48, 48, 48, 48)
        }
        setContentView(textView)
    }
}
`,
  },
  {
    path: 'app/proguard-rules.pro',
    name: 'proguard-rules.pro',
    category: 'gradle',
    description: 'ProGuard / R8 code shrinking and obfuscation rules for release APKs',
    content: `# Add project specific ProGuard rules here.
-keepattributes *Annotation*
-keepclassmembers class * {
    @androidx.annotation.Keep <fields>;
    @androidx.annotation.Keep <methods>;
}
`,
  },
];
