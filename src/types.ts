export type JavaDistro = 'temurin' | 'zulu' | 'corretto' | 'liberca';
export type JavaVersion = '17' | '21' | '11' | '8';
export type RunnerOS = 'ubuntu-latest' | 'ubuntu-22.04' | 'macos-latest' | 'windows-latest';

export interface WorkflowConfig {
  workflowName: string;
  filename: string;
  triggers: {
    pushBranches: string[];
    prBranches: string[];
    tagPatterns: string[];
    workflowDispatch: boolean;
    cronSchedule?: string;
  };
  environment: {
    runnerOS: RunnerOS;
    javaVersion: JavaVersion;
    javaDistro: JavaDistro;
    enableGradleCache: boolean;
    gradleVersion?: string;
    agpBuildCache: boolean;
  };
  qualityChecks: {
    runUnitTests: boolean;
    runAndroidLint: boolean;
    uploadSarifReport: boolean;
    runDetekt: boolean;
    uploadTestResults: boolean;
  };
  buildVariants: {
    buildDebugApk: boolean;
    buildReleaseApk: boolean;
    buildReleaseAab: boolean;
    buildFlavors: string[]; // e.g. ['dev', 'prod']
    splitByAbi: boolean;
  };
  signing: {
    enableKeystoreSigning: boolean;
    keystoreSecretName: string;
    aliasSecretName: string;
    storePasswordSecretName: string;
    keyPasswordSecretName: string;
    keystorePath: string; // e.g., app/release.jks or app/keystore.jks
  };
  deployments: {
    uploadArtifacts: boolean;
    artifactRetentionDays: number;
    createGithubRelease: boolean;
    githubReleaseOnTagOnly: boolean;
    enableFirebaseAppDistribution: boolean;
    firebaseAppIdSecret: string;
    firebaseTokenSecret: string;
    firebaseGroups: string;
    enableGooglePlay: boolean;
    googlePlayTrack: 'internal' | 'alpha' | 'beta' | 'production';
    googlePlayJsonSecret: string;
  };
  notifications: {
    enableSlack: boolean;
    slackWebhookSecret: string;
    enableDiscord: boolean;
    discordWebhookSecret: string;
  };
  matrix: {
    enableMatrix: boolean;
    matrixFlavors: string[];
    matrixBuildTypes: string[];
  };
}

export interface PresetDefinition {
  id: string;
  name: string;
  description: string;
  badge: string;
  config: WorkflowConfig;
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  recommendation?: string;
}

export interface LineAnnotation {
  line: number;
  stepName: string;
  description: string;
  category: 'setup' | 'security' | 'cache' | 'build' | 'deploy';
}

export type AccountStatus = 'active' | 'suspended' | 'blocked';

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  action: string;
  severity: 'info' | 'warning' | 'danger';
  details: string;
}

export interface AccountSecurity {
  status: AccountStatus;
  reason?: string;
  suspendedAt?: string;
  blockedIp?: string;
  riskScore: number; // 0 to 100
  twoFactorEnabled: boolean;
  autoGuardEnabled: boolean;
  recoveryPin: string;
  auditLogs: SecurityAuditLog[];
}

export interface ApkBuildHistoryItem {
  id: string;
  buildNumber: number;
  timestamp: string;
  appName: string;
  packageName: string;
  versionName: string;
  versionCode: number;
  variant: 'debug' | 'release';
  status: 'success' | 'failed';
  apkFileName: string;
  apkSize: string;
  sha256: string;
  workflowYaml: string;
  projectFilesSummary?: {
    filesCount: number;
    gradleVersion?: string;
    compileSdk?: string;
  };
  projectFilesSnapshot?: {
    path: string;
    name: string;
    content: string;
  }[];
  notes?: string;
  triggeredBy: 'manual' | 'auto_push' | 'rebuild_edit';
  durationSeconds: number;
  changesSummary?: string;
}


