import { WorkflowConfig, LineAnnotation } from '../types';

export function generateWorkflowYaml(config: WorkflowConfig): { yaml: string; annotations: LineAnnotation[] } {
  const {
    workflowName,
    triggers,
    environment,
    qualityChecks,
    buildVariants,
    signing,
    deployments,
    notifications,
    matrix,
  } = config;

  const lines: string[] = [];
  const annotations: LineAnnotation[] = [];

  const addLine = (text: string, annotation?: Omit<LineAnnotation, 'line'>) => {
    lines.push(text);
    if (annotation) {
      annotations.push({
        line: lines.length,
        ...annotation,
      });
    }
  };

  // Workflow Header
  addLine(`# ==============================================================================`);
  addLine(`# Universal Android CI/CD GitHub Actions Workflow`);
  addLine(`# Generated with Android Workflow Generator`);
  addLine(`# ==============================================================================`);
  addLine(`name: ${workflowName}`);
  addLine(``);

  // Triggers
  addLine(`on:`, {
    stepName: 'Triggers',
    description: 'Defines git events (push, pull request, tags, manual dispatch) that trigger this workflow.',
    category: 'setup',
  });

  if (triggers.pushBranches.length > 0) {
    addLine(`  push:`);
    addLine(`    branches:`);
    triggers.pushBranches.forEach((b) => addLine(`      - '${b}'`));
    if (triggers.tagPatterns.length > 0) {
      addLine(`    tags:`);
      triggers.tagPatterns.forEach((t) => addLine(`      - '${t}'`));
    }
  }

  if (triggers.prBranches.length > 0) {
    addLine(`  pull_request:`);
    addLine(`    branches:`);
    triggers.prBranches.forEach((b) => addLine(`      - '${b}'`));
  }

  if (triggers.workflowDispatch) {
    addLine(`  workflow_dispatch:`);
    addLine(`    inputs:`);
    addLine(`      release_note:`);
    addLine(`        description: 'Optional release notes for this build'`);
    addLine(`        required: false`);
    addLine(`        default: 'Automated CI/CD Build'`);
  }

  addLine(``);

  // Environment / Global Concurrency
  addLine(`concurrency:`);
  addLine(`  group: \${{ github.workflow }}-\${{ github.ref }}`);
  addLine(`  cancel-in-progress: \${{ github.event_name == 'pull_request' }}`);
  addLine(``);

  // Jobs
  addLine(`jobs:`);

  // --- JOB 1: LINT AND UNIT TESTS ---
  if (qualityChecks.runAndroidLint || qualityChecks.runUnitTests || qualityChecks.runDetekt) {
    addLine(`  quality-checks:`);
    addLine(`    name: 🔍 Lint & Unit Testing`);
    addLine(`    runs-on: ${environment.runnerOS}`);
    addLine(`    steps:`);

    addLine(`      - name: 📥 Checkout Repository`, {
      stepName: 'Checkout Code',
      description: 'Fetches code from GitHub with full depth for accurate versioning.',
      category: 'setup',
    });
    addLine(`        uses: actions/checkout@v4`);
    addLine(`        with:`);
    addLine(`          fetch-depth: 0`);

    addLine(`      - name: ☕ Set up JDK ${environment.javaVersion} (${environment.javaDistro})`, {
      stepName: 'Setup Java',
      description: `Installs Java ${environment.javaVersion} SDK required by Android Gradle Plugin.`,
      category: 'setup',
    });
    addLine(`        uses: actions/setup-java@v4`);
    addLine(`        with:`);
    addLine(`          distribution: '${environment.javaDistro}'`);
    addLine(`          java-version: '${environment.javaVersion}'`);

    if (environment.enableGradleCache) {
      addLine(`      - name: ⚡ Setup & Cache Gradle`, {
        stepName: 'Cache Gradle Dependencies',
        description: 'Caches Gradle wrapper, dependencies, and build outputs using official setup-gradle action.',
        category: 'cache',
      });
      addLine(`        uses: gradle/actions/setup-gradle@v3`);
      addLine(`        with:`);
      addLine(`          cache-disabled: false`);
    }

    addLine(`      - name: 🔑 Make Gradle Wrapper Executable`);
    addLine(`        run: chmod +x ./gradlew`);

    if (qualityChecks.runAndroidLint) {
      addLine(`      - name: 🧹 Run Android Lint Check`, {
        stepName: 'Android Lint',
        description: 'Analyzes Android code for performance, UX, security, and accessibility defects.',
        category: 'build',
      });
      addLine(`        run: ./gradlew lintDebug --stacktrace`);

      if (qualityChecks.uploadSarifReport) {
        addLine(`      - name: 🛡️ Upload SARIF Lint Report to GitHub Security`);
        addLine(`        uses: github/codeql-action/upload-sarif@v3`);
        addLine(`        if: always()`);
        addLine(`        with:`);
        addLine(`          sarif_file: app/build/reports/lint-results-debug.sarif`);
      }
    }

    if (qualityChecks.runDetekt) {
      addLine(`      - name: 🔎 Run Detekt Static Analysis`);
      addLine(`        run: ./gradlew detekt`);
    }

    if (qualityChecks.runUnitTests) {
      addLine(`      - name: 🧪 Run JUnit Unit Tests`, {
        stepName: 'Unit Tests',
        description: 'Executes all Android local unit tests using Gradle.',
        category: 'build',
      });
      addLine(`        run: ./gradlew testDebugUnitTest --stacktrace`);

      if (qualityChecks.uploadTestResults) {
        addLine(`      - name: 📊 Upload Test Results Artifact`);
        addLine(`        uses: actions/upload-artifact@v4`);
        addLine(`        if: always()`);
        addLine(`        with:`);
        addLine(`          name: unit-test-results`);
        addLine(`          path: app/build/reports/tests/testDebugUnitTest/`);
        addLine(`          retention-days: ${deployments.artifactRetentionDays}`);
      }
    }

    addLine(``);
  }

  // --- JOB 2: BUILD & SIGN BINARIES ---
  addLine(`  build-and-package:`);
  addLine(`    name: 📦 Build & Sign Android Binaries`);
  if (qualityChecks.runAndroidLint || qualityChecks.runUnitTests) {
    addLine(`    needs: quality-checks`);
  }
  addLine(`    runs-on: ${environment.runnerOS}`);

  if (matrix.enableMatrix) {
    addLine(`    strategy:`);
    addLine(`      matrix:`);
    addLine(`        flavor: [${matrix.matrixFlavors.map((f) => `'${f}'`).join(', ')}]`);
    addLine(`        buildType: [${matrix.matrixBuildTypes.map((b) => `'${b}'`).join(', ')}]`);
  }

  addLine(`    steps:`);

  addLine(`      - name: 📥 Checkout Repository`);
  addLine(`        uses: actions/checkout@v4`);

  addLine(`      - name: ☕ Set up JDK ${environment.javaVersion}`);
  addLine(`        uses: actions/setup-java@v4`);
  addLine(`        with:`);
  addLine(`          distribution: '${environment.javaDistro}'`);
  addLine(`          java-version: '${environment.javaVersion}'`);

  if (environment.enableGradleCache) {
    addLine(`      - name: ⚡ Setup Gradle Cache`);
    addLine(`        uses: gradle/actions/setup-gradle@v3`);
  }

  addLine(`      - name: 🔑 Make Gradle Wrapper Executable`);
  addLine(`        run: chmod +x ./gradlew || true`);

  addLine(`      - name: 🧹 Auto-Clean Conflicting Duplicate Files`, {
    stepName: 'Remove Conflicting Files',
    description: 'Deletes duplicate .kts build files (build.gradle.kts, settings.gradle.kts) to prevent fatal Gradle collision errors.',
    category: 'build',
  });
  addLine(`        run: |`);
  addLine(`          echo "Removing conflicting build files if present..."`);
  addLine(`          rm -f build.gradle.kts settings.gradle.kts app/build.gradle.kts app/settings.gradle.kts`);
  addLine(`          echo "✅ Conflicting KTS files cleaned."`);

  // Decode Keystore Step
  if (signing.enableKeystoreSigning) {
    addLine(`      - name: 🔐 Decode & Restore Release Keystore`, {
      stepName: 'Decode Base64 Keystore',
      description: 'Converts base64 encoded keystore secret back into a binary .jks file on disk securely.',
      category: 'security',
    });
    addLine(`        env:`);
    addLine(`          KEYSTORE_BASE64: \${{ secrets.${signing.keystoreSecretName} }}`);
    addLine(`        run: |`);
    addLine(`          if [ -z "$KEYSTORE_BASE64" ]; then`);
    addLine(`            echo "❌ Error: Secret ${signing.keystoreSecretName} is missing or empty!"`);
    addLine(`            exit 1`);
    addLine(`          fi`);
    addLine(`          mkdir -p $(dirname "${signing.keystorePath}")`);
    addLine(`          echo "$KEYSTORE_BASE64" | base64 --decode > ${signing.keystorePath}`);
    addLine(`          echo "✅ Keystore restored to ${signing.keystorePath}"`);
  }

  // Gradle Build Commands
  const envVars = signing.enableKeystoreSigning
    ? `        env:
          RELEASE_STORE_FILE: \${{ github.workspace }}/${signing.keystorePath}
          RELEASE_KEY_ALIAS: \${{ secrets.${signing.aliasSecretName} }}
          RELEASE_STORE_PASSWORD: \${{ secrets.${signing.storePasswordSecretName} }}
          RELEASE_KEY_PASSWORD: \${{ secrets.${signing.keyPasswordSecretName} }}`
    : '';

  if (matrix.enableMatrix) {
    addLine(`      - name: 🏗️ Build Matrix Variant (\${{ matrix.flavor }}\${{ matrix.buildType }})`, {
      stepName: 'Matrix Gradle Build',
      description: 'Executes parallel build for the target flavor and build type.',
      category: 'build',
    });
    if (envVars) addLine(envVars);
    addLine(`        run: ./gradlew assemble\${{ matrix.flavor }}\${{ matrix.buildType }}`);
  } else {
    if (buildVariants.buildDebugApk) {
      addLine(`      - name: 🛠️ Build Debug APK`, {
        stepName: 'Build Debug APK',
        description: 'Compiles debug APK binary for instant installation & QA testing.',
        category: 'build',
      });
      addLine(`        run: ./gradlew assembleDebug --stacktrace`);
    }

    if (buildVariants.buildReleaseApk) {
      addLine(`      - name: 🚀 Build Release APK`, {
        stepName: 'Build Release APK',
        description: 'Compiles release APK binary with optional R8/Proguard code shrinking.',
        category: 'build',
      });
      if (envVars) addLine(envVars);
      addLine(`        run: ./gradlew assembleRelease --stacktrace`);
    }

    if (buildVariants.buildReleaseAab) {
      addLine(`      - name: 📦 Build Release Android App Bundle (AAB)`, {
        stepName: 'Build AAB Bundle',
        description: 'Generates optimized AAB bundle format required for Google Play Store publishing.',
        category: 'build',
      });
      if (envVars) addLine(envVars);
      addLine(`        run: ./gradlew bundleRelease --stacktrace`);
    }
  }

  // Upload Artifacts
  if (deployments.uploadArtifacts) {
    addLine(`      - name: 📤 Upload Build Artifacts (APK / AAB)`, {
      stepName: 'Upload Artifacts',
      description: 'Saves built APK and AAB binaries to GitHub Actions workflow summary page.',
      category: 'deploy',
    });
    addLine(`        uses: actions/upload-artifact@v4`);
    addLine(`        with:`);
    addLine(`          name: android-build-outputs`);
    addLine(`          path: |`);
    addLine(`            app/build/outputs/apk/**/*.apk`);
    addLine(`            app/build/outputs/bundle/**/*.aab`);
    addLine(`          retention-days: ${deployments.artifactRetentionDays}`);
  }

  // Clean Keystore Security Step
  if (signing.enableKeystoreSigning) {
    addLine(`      - name: 🧹 Securely Clean Keystore File`);
    addLine(`        if: always()`);
    addLine(`        run: rm -f ${signing.keystorePath}`);
  }

  addLine(``);

  // --- JOB 3: PUBLISH TO GITHUB RELEASES ---
  if (deployments.createGithubRelease) {
    addLine(`  github-release:`);
    addLine(`    name: 🏷️ Publish GitHub Release`);
    addLine(`    needs: build-and-package`);
    if (deployments.githubReleaseOnTagOnly) {
      addLine(`    if: startsWith(github.ref, 'refs/tags/')`);
    }
    addLine(`    runs-on: ${environment.runnerOS}`);
    addLine(`    steps:`);
    addLine(`      - name: 📥 Download Build Artifacts`);
    addLine(`        uses: actions/download-artifact@v4`);
    addLine(`        with:`);
    addLine(`          name: android-build-outputs`);
    addLine(`          path: ./release-artifacts`);

    addLine(`      - name: 📢 Create GitHub Release with Binaries`, {
      stepName: 'GitHub Release Upload',
      description: 'Creates a public tag release with compiled APKs and AABs attached.',
      category: 'deploy',
    });
    addLine(`        uses: softprops/action-gh-release@v2`);
    addLine(`        with:`);
    addLine(`          files: ./release-artifacts/**/*`);
    addLine(`          generate_release_notes: true`);
    addLine(`          draft: false`);
    addLine(`          prerelease: false`);
    addLine(`        env:`);
    addLine(`          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}`);
    addLine(``);
  }

  // --- JOB 4: FIREBASE APP DISTRIBUTION ---
  if (deployments.enableFirebaseAppDistribution) {
    addLine(`  firebase-distribution:`);
    addLine(`    name: 🔥 Distribute to Firebase App Testers`);
    addLine(`    needs: build-and-package`);
    addLine(`    runs-on: ${environment.runnerOS}`);
    addLine(`    steps:`);
    addLine(`      - name: 📥 Download Release APK`);
    addLine(`        uses: actions/download-artifact@v4`);
    addLine(`        with:`);
    addLine(`          name: android-build-outputs`);
    addLine(`          path: ./dist-artifacts`);

    addLine(`      - name: 📲 Upload APK to Firebase App Distribution`, {
      stepName: 'Firebase App Distribution',
      description: 'Pushes the release APK directly to internal QA testers via Firebase.',
      category: 'deploy',
    });
    addLine(`        uses: wbailey/firebase-app-distribution@v1.0.0`);
    addLine(`        with:`);
    addLine(`          appId: \${{ secrets.${deployments.firebaseAppIdSecret} }}`);
    addLine(`          token: \${{ secrets.${deployments.firebaseTokenSecret} }}`);
    addLine(`          groups: '${deployments.firebaseGroups}'`);
    addLine(`          file: ./dist-artifacts/app-release.apk`);
    addLine(`          releaseNotes: 'Automated CI/CD build from commit \${{ github.sha }}'`);
    addLine(``);
  }

  // --- JOB 5: GOOGLE PLAY STORE PUBLISHING ---
  if (deployments.enableGooglePlay) {
    addLine(`  play-store-deployment:`);
    addLine(`    name: 🛍️ Publish to Google Play Store (${deployments.googlePlayTrack})`);
    addLine(`    needs: build-and-package`);
    addLine(`    if: startsWith(github.ref, 'refs/tags/') || github.event_name == 'workflow_dispatch'`);
    addLine(`    runs-on: ${environment.runnerOS}`);
    addLine(`    steps:`);
    addLine(`      - name: 📥 Download App Bundle (AAB)`);
    addLine(`        uses: actions/download-artifact@v4`);
    addLine(`        with:`);
    addLine(`          name: android-build-outputs`);
    addLine(`          path: ./play-artifacts`);

    addLine(`      - name: 🛒 Upload AAB to Google Play Store Track`, {
      stepName: 'Google Play Store Upload',
      description: `Publishes the Android App Bundle to the Google Play Store ${deployments.googlePlayTrack} track.`,
      category: 'deploy',
    });
    addLine(`        uses: rstore/upload-google-play@v1`);
    addLine(`        with:`);
    addLine(`          serviceAccountJsonPlainText: \${{ secrets.${deployments.googlePlayJsonSecret} }}`);
    addLine(`          packageName: 'com.example.androidapp' # Update with your Android package name`);
    addLine(`          releaseFiles: './play-artifacts/**/*.aab'`);
    addLine(`          track: '${deployments.googlePlayTrack}'`);
    addLine(`          status: 'completed'`);
    addLine(``);
  }

  // --- JOB 6: NOTIFICATIONS ---
  if (notifications.enableSlack || notifications.enableDiscord) {
    addLine(`  notify-team:`);
    addLine(`    name: 🔔 Send Build Notifications`);
    addLine(`    needs: [build-and-package]`);
    addLine(`    if: always()`);
    addLine(`    runs-on: ${environment.runnerOS}`);
    addLine(`    steps:`);

    if (notifications.enableSlack) {
      addLine(`      - name: 💬 Send Slack Webhook Alert`, {
        stepName: 'Slack Notification',
        description: 'Notifies team channel on Slack regarding build status (success/failure).',
        category: 'deploy',
      });
      addLine(`        uses: slackapi/slack-github-action@v1.26.0`);
      addLine(`        with:`);
      addLine(`          payload: |`);
      addLine(`            {`);
      addLine(`              "text": "Android Build Status: \${{ needs.build-and-package.result == 'success' && '✅ SUCCESS' || '❌ FAILED' }} \\nRepo: \${{ github.repository }} \\nBranch: \${{ github.ref_name }} \\nCommit: \${{ github.sha }}"`);
      addLine(`            }`);
      addLine(`        env:`);
      addLine(`          SLACK_WEBHOOK_URL: \${{ secrets.${notifications.slackWebhookSecret} }}`);
      addLine(`          SLACK_WEBHOOK_TYPE: INCOMING_WEBHOOK`);
    }

    if (notifications.enableDiscord) {
      addLine(`      - name: 💬 Send Discord Notification`);
      addLine(`        uses: Ilshadur/action-discord@master`);
      addLine(`        env:`);
      addLine(`          DISCORD_WEBHOOK: \${{ secrets.${notifications.discordWebhookSecret} }}`);
      addLine(`        with:`);
      addLine(`          args: 'Android CI/CD Build \${{ github.sha }} completed with status: \${{ needs.build-and-package.result }}'`);
    }
  }

  return {
    yaml: lines.join('\n'),
    annotations,
  };
}
