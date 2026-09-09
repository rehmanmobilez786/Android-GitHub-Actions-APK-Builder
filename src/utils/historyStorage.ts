import { ApkBuildHistoryItem } from '../types';
import { AndroidProjectFile, DEFAULT_ANDROID_FILES } from '../data/defaultAndroidProject';

const HISTORY_STORAGE_KEY = 'android_apk_build_history_v1';

export const INITIAL_DEFAULT_HISTORY: ApkBuildHistoryItem[] = [
  {
    id: 'build-102',
    buildNumber: 102,
    timestamp: '2026-09-09 11:45:10',
    appName: 'GitHub Action APK',
    packageName: 'com.example.githubactionapk',
    versionName: '1.0.1',
    versionCode: 2,
    variant: 'debug',
    status: 'success',
    apkFileName: 'app-debug.apk',
    apkSize: '14.8 MB',
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    workflowYaml: '',
    durationSeconds: 78,
    triggeredBy: 'manual',
    notes: 'Updated Android SDK target to 34 and enabled ViewBinding optimization.',
    changesSummary: 'Version bumped to 1.0.1 (Build 2). Target SDK 34 verified.',
    projectFilesSummary: {
      filesCount: 10,
      gradleVersion: '8.5',
      compileSdk: '34',
    },
    projectFilesSnapshot: DEFAULT_ANDROID_FILES.map((f) => ({
      path: f.path,
      name: f.name,
      content: f.content,
    })),
  },
  {
    id: 'build-101',
    buildNumber: 101,
    timestamp: '2026-09-08 17:20:30',
    appName: 'GitHub Action APK',
    packageName: 'com.example.githubactionapk',
    versionName: '1.0.0',
    versionCode: 1,
    variant: 'debug',
    status: 'success',
    apkFileName: 'app-debug.apk',
    apkSize: '14.6 MB',
    sha256: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
    workflowYaml: '',
    durationSeconds: 92,
    triggeredBy: 'auto_push',
    notes: 'Initial production bootstrap build with automated GitHub Actions CI/CD.',
    changesSummary: 'Initial APK build release v1.0.0 (Build 1).',
    projectFilesSummary: {
      filesCount: 10,
      gradleVersion: '8.5',
      compileSdk: '34',
    },
    projectFilesSnapshot: DEFAULT_ANDROID_FILES.map((f) => ({
      path: f.path,
      name: f.name,
      content: f.content,
    })),
  },
];

export function generateSafeSha256(): string {
  try {
    if (
      typeof window !== 'undefined' &&
      window.crypto &&
      typeof window.crypto.getRandomValues === 'function'
    ) {
      const shaBytes = new Uint8Array(32);
      window.crypto.getRandomValues(shaBytes);
      return Array.from(shaBytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch (e) {
    // fallback
  }
  return Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

function sanitizeHistoryItem(item: any, fallbackIndex: number): ApkBuildHistoryItem {
  if (!item || typeof item !== 'object') {
    return {
      id: `build-${100 + fallbackIndex}`,
      buildNumber: 100 + fallbackIndex,
      timestamp: new Date().toLocaleString(),
      appName: 'GitHub Action APK',
      packageName: 'com.example.githubactionapk',
      versionName: '1.0.0',
      versionCode: 1,
      variant: 'debug',
      status: 'success',
      apkFileName: 'app-debug.apk',
      apkSize: '14.8 MB',
      sha256: generateSafeSha256(),
      workflowYaml: '',
      durationSeconds: 75,
      triggeredBy: 'manual',
      notes: 'Sanitized recovery build record.',
      changesSummary: 'Initial build',
      projectFilesSummary: {
        filesCount: 10,
        gradleVersion: '8.5',
        compileSdk: '34',
      },
      projectFilesSnapshot: [],
    };
  }

  const buildNum = Number(item.buildNumber) || 100 + fallbackIndex;
  const variant: 'debug' | 'release' = item.variant === 'release' ? 'release' : 'debug';
  const status: 'success' | 'failed' = item.status === 'failed' ? 'failed' : 'success';

  return {
    id: String(item.id || `build-${buildNum}`),
    buildNumber: buildNum,
    timestamp: String(item.timestamp || new Date().toLocaleString()),
    appName: String(item.appName || 'GitHub Action APK'),
    packageName: String(item.packageName || 'com.example.githubactionapk'),
    versionName: String(item.versionName || '1.0.0'),
    versionCode: Number(item.versionCode) || 1,
    variant,
    status,
    apkFileName: String(item.apkFileName || `app-${variant}.apk`),
    apkSize: String(item.apkSize || '14.8 MB'),
    sha256: String(item.sha256 || generateSafeSha256()),
    workflowYaml: String(item.workflowYaml || ''),
    durationSeconds: Number(item.durationSeconds) || 75,
    triggeredBy: item.triggeredBy === 'rebuild_edit' || item.triggeredBy === 'auto_push' ? item.triggeredBy : 'manual',
    notes: String(item.notes || ''),
    changesSummary: String(item.changesSummary || ''),
    projectFilesSummary: item.projectFilesSummary || {
      filesCount: 10,
      gradleVersion: '8.5',
      compileSdk: '34',
    },
    projectFilesSnapshot: Array.isArray(item.projectFilesSnapshot) ? item.projectFilesSnapshot : [],
  };
}

export function getBuildHistory(): ApkBuildHistoryItem[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return INITIAL_DEFAULT_HISTORY;
    }
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) {
      safeSetLocalStorage(HISTORY_STORAGE_KEY, INITIAL_DEFAULT_HISTORY);
      return INITIAL_DEFAULT_HISTORY;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const cleaned = parsed.map((item, idx) => sanitizeHistoryItem(item, idx));
      return cleaned;
    }
    return INITIAL_DEFAULT_HISTORY;
  } catch (err) {
    console.warn('Failed to load build history from localStorage, using defaults:', err);
    return INITIAL_DEFAULT_HISTORY;
  }
}

function safeSetLocalStorage(key: string, data: any): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn('localStorage.setItem failed (possibly quota exceeded or disabled):', err);
    // If quota exceeded, try stripping snapshot code to save space
    try {
      if (Array.isArray(data)) {
        const lightweight = data.slice(0, 15).map((item) => ({
          ...item,
          projectFilesSnapshot: undefined,
        }));
        window.localStorage.setItem(key, JSON.stringify(lightweight));
      }
    } catch {
      // ignore
    }
  }
}

export function saveBuildHistory(history: ApkBuildHistoryItem[]): void {
  safeSetLocalStorage(HISTORY_STORAGE_KEY, history);
}

export function addBuildToHistory(build: ApkBuildHistoryItem): ApkBuildHistoryItem[] {
  const current = getBuildHistory();
  const sanitized = sanitizeHistoryItem(build, 0);
  const updated = [sanitized, ...current].slice(0, 30);
  saveBuildHistory(updated);
  return updated;
}

export function deleteBuildFromHistory(id: string): ApkBuildHistoryItem[] {
  const current = getBuildHistory();
  const updated = current.filter((item) => item.id !== id);
  saveBuildHistory(updated);
  return updated;
}

export function resetBuildHistoryToDefaults(): ApkBuildHistoryItem[] {
  saveBuildHistory(INITIAL_DEFAULT_HISTORY);
  return INITIAL_DEFAULT_HISTORY;
}

export interface BuildEditFormValues {
  appName: string;
  packageName: string;
  versionName: string;
  versionCode: number;
  compileSdk: number;
  minSdk: number;
  variant: 'debug' | 'release';
  greetingText: string;
  notes: string;
}

/**
 * Apply modified build properties into Android project files (build.gradle.kts, AndroidManifest.xml, MainActivity.kt)
 */
export function applyModificationsToProjectFiles(
  files: AndroidProjectFile[],
  values: BuildEditFormValues
): AndroidProjectFile[] {
  return files.map((file) => {
    let newContent = file.content;

    // 1. Update AndroidManifest.xml (app label)
    if (file.path.includes('AndroidManifest.xml')) {
      newContent = newContent.replace(
        /android:label="[^"]*"/g,
        `android:label="${values.appName}"`
      );
    }

    // 2. Update app/build.gradle.kts (versionName, versionCode, applicationId, compileSdk, minSdk)
    if (file.path.includes('build.gradle.kts') && file.path.includes('app')) {
      // Version Name
      newContent = newContent.replace(
        /versionName\s*=\s*"[^"]*"/g,
        `versionName = "${values.versionName}"`
      );
      // Version Code
      newContent = newContent.replace(
        /versionCode\s*=\s*\d+/g,
        `versionCode = ${values.versionCode}`
      );
      // Application ID
      newContent = newContent.replace(
        /applicationId\s*=\s*"[^"]*"/g,
        `applicationId = "${values.packageName}"`
      );
      // Namespace
      newContent = newContent.replace(
        /namespace\s*=\s*"[^"]*"/g,
        `namespace = "${values.packageName}"`
      );
      // Compile SDK
      newContent = newContent.replace(
        /compileSdk\s*=\s*\d+/g,
        `compileSdk = ${values.compileSdk}`
      );
      // Min SDK
      newContent = newContent.replace(
        /minSdk\s*=\s*\d+/g,
        `minSdk = ${values.minSdk}`
      );
      // Target SDK
      newContent = newContent.replace(
        /targetSdk\s*=\s*\d+/g,
        `targetSdk = ${values.compileSdk}`
      );
    }

    // 3. Update MainActivity.kt
    if (file.path.includes('MainActivity.kt')) {
      if (values.greetingText) {
        newContent = newContent.replace(
          /val greeting = "[^"]*"/g,
          `val greeting = "${values.greetingText}"`
        );
      }
    }

    return {
      ...file,
      content: newContent,
    };
  });
}
