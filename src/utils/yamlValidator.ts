import { WorkflowConfig, ValidationIssue } from '../types';

export function validateWorkflowConfig(config: WorkflowConfig): {
  issues: ValidationIssue[];
  score: number;
} {
  const issues: ValidationIssue[] = [];
  let deductions = 0;

  // Check 1: Java Version compatibility with modern AGP
  if (config.environment.javaVersion === '8' || config.environment.javaVersion === '11') {
    deductions += 15;
    issues.push({
      type: 'warning',
      message: `Java ${config.environment.javaVersion} is selected. Modern Android Gradle Plugin (AGP 8.0+) requires JDK 17 or higher.`,
      recommendation: 'Upgrade JDK version to 17 or 21 for modern Android builds.',
    });
  }

  // Check 2: Caching
  if (!config.environment.enableGradleCache) {
    deductions += 20;
    issues.push({
      type: 'warning',
      message: 'Gradle caching is disabled.',
      recommendation: 'Enable gradle/actions/setup-gradle@v3 to speed up build execution by 60-80%.',
    });
  }

  // Check 3: Triggers
  if (
    config.triggers.pushBranches.length === 0 &&
    config.triggers.prBranches.length === 0 &&
    config.triggers.tagPatterns.length === 0 &&
    !config.triggers.workflowDispatch
  ) {
    deductions += 30;
    issues.push({
      type: 'error',
      message: 'No trigger events configured for this workflow.',
      recommendation: 'Add at least one push branch, PR branch, tag pattern, or manual trigger.',
    });
  }

  // Check 4: Keystore Secrets
  if (config.signing.enableKeystoreSigning) {
    if (!config.signing.keystoreSecretName || !config.signing.aliasSecretName) {
      deductions += 25;
      issues.push({
        type: 'error',
        message: 'Keystore signing is enabled but required secret names are blank.',
        recommendation: 'Specify secret names such as KEYSTORE_BASE64 and RELEASE_KEY_ALIAS.',
      });
    }
  } else if (config.buildVariants.buildReleaseApk || config.buildVariants.buildReleaseAab) {
    deductions += 10;
    issues.push({
      type: 'info',
      message: 'Release APK/AAB builds enabled without Keystore Signing.',
      recommendation: 'Ensure your Gradle build produces unsigned binaries or configure automated keystore signing.',
    });
  }

  // Check 5: Quality checks
  if (!config.qualityChecks.runAndroidLint && !config.qualityChecks.runUnitTests) {
    deductions += 15;
    issues.push({
      type: 'warning',
      message: 'No quality checks (Lint or Unit Tests) are enabled.',
      recommendation: 'Enable unit testing or Android Lint checks to prevent regressions in pull requests.',
    });
  }

  // Check 6: Deployments
  if (config.deployments.enableGooglePlay && !config.buildVariants.buildReleaseAab) {
    deductions += 20;
    issues.push({
      type: 'error',
      message: 'Google Play Store deployment is enabled but Android App Bundle (AAB) build is disabled.',
      recommendation: 'Enable "Build Release Android App Bundle (AAB)" in Build Variants.',
    });
  }

  const score = Math.max(0, 100 - deductions);

  return {
    issues,
    score,
  };
}
