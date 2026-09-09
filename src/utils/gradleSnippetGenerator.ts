import { WorkflowConfig } from '../types';

export function generateKotlinDslSigningConfig(config: WorkflowConfig): string {
  const { signing } = config;
  return `// app/build.gradle.kts (Kotlin DSL)
import java.io.File
import java.util.Properties

android {
    signingConfigs {
        create("release") {
            // Read keystore credentials safely from Environment Variables (GitHub Actions)
            val storeFilePath = System.getenv("RELEASE_STORE_FILE") ?: "release.jks"
            val storePasswordEnv = System.getenv("RELEASE_STORE_PASSWORD")
            val keyAliasEnv = System.getenv("RELEASE_KEY_ALIAS")
            val keyPasswordEnv = System.getenv("RELEASE_KEY_PASSWORD")

            if (!storePasswordEnv.isNullOrEmpty() && File(storeFilePath).exists()) {
                storeFile = File(storeFilePath)
                storePassword = storePasswordEnv
                keyAlias = keyAliasEnv
                keyPassword = keyPasswordEnv
                println("✅ Using Keystore Signing from GitHub Secrets: $storeFilePath")
            } else {
                println("⚠️ Release keystore missing or secrets not set; falling back to debug signing.")
            }
        }
    }

    buildTypes {
        getByName("release") {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            
            // Attach release signing config if available
            val releaseSigning = signingConfigs.findByName("release")
            if (releaseSigning != null && releaseSigning.storeFile?.exists() == true) {
                signingConfig = releaseSigning
            } else {
                signingConfig = signingConfigs.getByName("debug")
            }
        }
    }
}`;
}

export function generateGroovyDslSigningConfig(config: WorkflowConfig): string {
  return `// app/build.gradle (Groovy DSL)
android {
    signingConfigs {
        release {
            def storeFilePath = System.getenv("RELEASE_STORE_FILE") ?: "release.jks"
            def storePasswordEnv = System.getenv("RELEASE_STORE_PASSWORD")
            def keyAliasEnv = System.getenv("RELEASE_KEY_ALIAS")
            def keyPasswordEnv = System.getenv("RELEASE_KEY_PASSWORD")

            if (storePasswordEnv && file(storeFilePath).exists()) {
                storeFile = file(storeFilePath)
                storePassword = storePasswordEnv
                keyAlias = keyAliasEnv
                keyPassword = keyPasswordEnv
                println "✅ Using Keystore Signing from GitHub Secrets: " + storeFilePath
            } else {
                println "⚠️ Release keystore missing or secrets not set; falling back to debug signing."
            }
        }
    }

    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            
            if (signingConfigs.release.storeFile && signingConfigs.release.storeFile.exists()) {
                signingConfig signingConfigs.release
            } else {
                signingConfig signingConfigs.debug
            }
        }
    }
}`;
}
