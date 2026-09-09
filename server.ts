import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "5mb" }));

// Helper to get Gemini Client safely
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured.");
  }
  return new GoogleGenAI({ apiKey });
}

// AI Customizer endpoint for GitHub Actions workflow tuning
app.post("/api/ai/customize-workflow", async (req, res) => {
  try {
    const { prompt, currentYaml } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    const ai = getGeminiClient();
    
    const systemInstruction = `You are a DevOps and Android CI/CD expert specializing in GitHub Actions, Gradle, Android Gradle Plugin (AGP), Android SDK, Keystore signing, and release automation.
Your task is to take a request from a developer and either modify or generate a clean, modern, production-ready GitHub Actions workflow YAML file for Android.
Rules:
1. Always use modern, current GitHub Actions versions (e.g., actions/checkout@v4, actions/setup-java@v4, gradle/actions/setup-gradle@v3, rstore/upload-google-play@v1, wbailey/firebase-app-distribution@v1).
2. Ensure proper caching, security best practices (secrets for keystore, passwords, tokens), and fast execution.
3. Respond in JSON format:
{
  "explanation": "Brief summary of changes made or workflow built",
  "yaml": "The full, valid YAML file content",
  "recommendedSecrets": ["List", "of", "required", "GitHub", "secrets"],
  "tips": ["Tip 1", "Tip 2"]
}
Do not return markdown code blocks in the JSON fields; return raw unescaped strings in JSON.`;

    const contents = [
      {
        role: "user",
        parts: [
          {
            text: `Developer Request: "${prompt}"\n\nCurrent Workflow YAML (if any):\n\`\`\`yaml\n${currentYaml || "None"}\n\`\`\`\n\nGenerate the updated/new GitHub Actions workflow JSON as specified.`
          }
        ]
      }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      }
    });

    const responseText = response.text || "{}";
    const parsed = JSON.parse(responseText);
    return res.json(parsed);
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    return res.status(500).json({
      error: err.message || "Failed to customize workflow with Gemini AI.",
    });
  }
});

// AI Auto-Fix Endpoint for Android CI/CD & Gradle Build Errors
app.post("/api/ai/fix-build-error", async (req, res) => {
  try {
    const { errorLog, failedStep, currentYaml, projectFilesSummary } = req.body;
    if (!errorLog) {
      return res.status(400).json({ error: "Error log is required." });
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are an expert Android Build Engineer and GitHub Actions DevOps Specialist.
A developer encountered a build failure during an Android GitHub Actions CI/CD run.
Your task is to analyze the error log, diagnose the root cause, provide an automatic fix, and return the fixed workflow YAML and/or gradle configuration.
Support both English and Urdu explanation in your response so users understand clearly.

Respond in strict JSON format:
{
  "diagnosis": "Clear explanation of what broke (in English and concise Urdu summary)",
  "rootCause": "Technical root cause (e.g., AGP 8.x requires JDK 17, Permission denied for ./gradlew, Missing SDK Platform 34, Keystore Base64 decode syntax error)",
  "fixSummary": "Summary of exact automatic fix applied",
  "fixedYaml": "Complete corrected GitHub Actions workflow YAML string (if workflow needed fix)",
  "fixedSnippet": "Any gradle or manifest snippet that needs to be updated (if applicable)",
  "fixedFileName": "Filename where the snippet belongs (e.g., app/build.gradle.kts or .github/workflows/android-build.yml)",
  "actionSteps": ["Step 1 to prevent this", "Step 2"],
  "resolved": true
}
Do not include markdown code ticks outside the JSON; return raw valid JSON.`;

    const userPrompt = `Failed CI/CD Step: ${failedStep || "Android Gradle Build"}
Current Workflow YAML:
\`\`\`yaml
${currentYaml || "Not provided"}
\`\`\`

Project Files Summary:
${projectFilesSummary || "Standard Android Project (app/build.gradle.kts, gradlew, AndroidManifest.xml)"}

Build Error Log:
\`\`\`
${errorLog}
\`\`\`

Diagnose this Android build failure and produce the corrected workflow or build configuration to automatically resolve it.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json(parsed);
  } catch (err: any) {
    console.error("AI Build Error Fixer Error:", err);
    return res.status(500).json({
      error: err.message || "Failed to auto-fix build error with Gemini AI.",
    });
  }
});

// Vite & Static file serving middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
