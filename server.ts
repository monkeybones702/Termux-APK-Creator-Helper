import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '2mb' }));

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function resolveModel(requested?: string): string {
  if (requested === 'lite' || requested === 'gemini-3.1-flash-lite') {
    return 'gemini-3.1-flash-lite';
  }
  if (requested === 'pro' || requested === 'gemini-3.1-pro-preview') {
    return 'gemini-3.8-flash';
  }
  return 'gemini-3.8-flash';
}

// 1. Multi-turn Brainstorming & Developer Chat
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages, projectConfig, modelType, systemRole } = req.body;
    const ai = getAiClient();
    const model = resolveModel(modelType);

    const pkg = projectConfig?.packageName || 'com.example.myapp';
    const appName = projectConfig?.appName || 'MyApp';
    const minSdk = projectConfig?.minSdk || 21;
    const targetSdk = projectConfig?.targetSdk || 33;

    const systemInstruction =
      systemRole ||
      `You are a Principal Android & Termux Systems Architect assisting a developer building "${appName}" (package: ${pkg}, minSdk: ${minSdk}, targetSdk: ${targetSdk}) directly inside Termux using openjdk-17, aapt, ecj, dx, and apksigner (no Gradle required).
Provide concrete, actionable architectural advice, Android SDK Java code snippets (compatible with standard android.jar without external AndroidX dependencies unless specified), XML layouts, and Termux shell tips. Keep answers clear, well-structured, and ready to implement.`;

    const formattedContents = Array.isArray(messages)
      ? messages.map((m: { role: string; content: string }) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }],
        }))
      : [{ role: 'user', parts: [{ text: String(messages || 'Hello') }] }];

    const response = await ai.models.generateContent({
      model,
      contents: formattedContents,
      config: {
        systemInstruction,
      },
    });

    res.json({
      text: response.text || 'No response generated.',
      modelUsed: model,
    });
  } catch (error: any) {
    console.error('Gemini chat error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to communicate with Gemini API.',
    });
  }
});

// 2. Generate / Update Exportable Android Project Code from Brainstorming or Feature Ideas
app.post('/api/gemini/generate-code', async (req, res) => {
  try {
    const { prompt, projectConfig, currentFiles, selectedIdeas } = req.body;
    const ai = getAiClient();

    const pkg = projectConfig?.packageName || 'com.example.myapp';
    const appName = projectConfig?.appName || 'MyApp';
    const minSdk = projectConfig?.minSdk || 21;
    const targetSdk = projectConfig?.targetSdk || 33;

    const ideasContext =
      Array.isArray(selectedIdeas) && selectedIdeas.length > 0
        ? `Selected Feature Ideas to integrate:\n- ${selectedIdeas.join('\n- ')}`
        : '';

    const fullPrompt = `Project Configuration:
- App Name: ${appName}
- Package Name: ${pkg}
- Min SDK: ${minSdk}
- Target SDK: ${targetSdk}

${ideasContext}

Developer Request / Chat Context:
${prompt || 'Generate complete, working Android Java & XML code incorporating the selected features.'}

Current Files Reference:
${JSON.stringify(currentFiles || {}, null, 2)}

Generate updated, self-contained Android source files that compile cleanly in Termux using standard android.jar (android.app.Activity, android.widget.*, android.os.Bundle, etc. — do NOT require external Gradle/AndroidX libraries so that ecj + aapt + dx compile them out of the box).
Return a JSON object containing:
1. "summary": A concise explanation of the code changes and features added.
2. "snippet": A highlighted code snippet showing the core new feature logic to display in chat.
3. "files": An array of file objects ({ "path": string, "description": string, "content": string }) for the project (always include AndroidManifest.xml, MainActivity.java, activity_main.xml, strings.xml, and build.sh, plus any additional Java classes if needed).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: fullPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: 'Summary of the generated code and features integrated.',
            },
            snippet: {
              type: Type.STRING,
              description: 'Key Java or XML snippet to preview directly in the chat thread.',
            },
            files: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  path: {
                    type: Type.STRING,
                    description: 'Relative file path, e.g. app/src/main/AndroidManifest.xml',
                  },
                  description: {
                    type: Type.STRING,
                    description: 'What this file does and what was updated.',
                  },
                  content: {
                    type: Type.STRING,
                    description: 'Complete file content ready to write via heredoc.',
                  },
                },
                required: ['path', 'description', 'content'],
              },
            },
          },
          required: ['summary', 'snippet', 'files'],
        },
      },
    });

    const rawText = response.text?.trim() || '{}';
    const parsed = JSON.parse(rawText);
    res.json(parsed);
  } catch (error: any) {
    console.error('Gemini code generation error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate code with Gemini.',
    });
  }
});

// 3. Web Search Grounding for App Idea Summary & Competitor Analysis
app.post('/api/gemini/search', async (req, res) => {
  try {
    const { query, projectConfig, selectedIdeas } = req.body;
    const ai = getAiClient();

    const appName = projectConfig?.appName || 'MyApp';
    const pkg = projectConfig?.packageName || 'com.example.myapp';
    const ideasList =
      Array.isArray(selectedIdeas) && selectedIdeas.length > 0
        ? selectedIdeas.join(', ')
        : 'on-device Termux APK compilation, Java/XML bootstrapping, and AI code generation';

    const searchPrompt =
      query ||
      `Search the web for mobile apps and developer tools similar to "${appName}" (${pkg}) which focuses on: ${ideasList}.
Provide:
1. Executive Summary of our app idea and its core functions.
2. Similar Existing Apps & Tools found on the web.
3. Key Architectural & Functional Differences (comparing our lightweight Termux CLI + AI workflow against traditional IDEs, cloud builders, and competitors).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: searchPrompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = rawChunks
      .filter((c: any) => c.web?.uri)
      .map((c: any) => ({
        title: c.web.title || c.web.uri,
        uri: c.web.uri,
      }));

    res.json({
      text: response.text || 'No analysis returned.',
      sources,
    });
  } catch (error: any) {
    console.error('Gemini search grounding error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to perform web-grounded search.',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
