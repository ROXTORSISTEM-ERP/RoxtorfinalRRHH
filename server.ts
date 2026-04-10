import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

// 🔥 NUEVOS IMPORTS IA MODULAR
import { radarAI } from "./src/ai/radar";
import { auditAI } from "./src/ai/audit";
import { inventoryAI } from "./src/ai/inventory";
import { reportAI } from "./src/ai/report";
import { detectModule } from "./src/ai/detectModule";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // 🔥 API: Radar AI (AHORA MODULAR)
  app.post("/api/ai/analyze", async (req, res) => {
    const {
      prompt,
      image,
      model: requestedModel,
      systemInstruction,
      responseMimeType,
      modalities,
      module // 👈 NUEVO (opcional)
    } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;

    console.log(`[AI Request] Module: ${module || 'auto'}, Model: ${requestedModel || 'default'}, Prompt length: ${prompt?.length || 0}`);

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      console.error("🚨 GEMINI_API_KEY is missing or using placeholder in environment variables.");
      return res.status(500).json({ 
        error: "GEMINI_API_KEY no configurada. Por favor, ve al panel de 'Secrets' (índice de llave) en AI Studio y agrega una variable llamada GEMINI_API_KEY con tu llave de Google AI.",
        details: "API_KEY_MISSING"
      });
    }

    try {
      let selectedModule = module;

      // 🧠 AUTO-DETECCIÓN SI NO VIENE DEFINIDO
      if (!selectedModule && prompt) {
        try {
          selectedModule = await detectModule(prompt);
        } catch (e) {
          console.warn("⚠️ detectModule falló, usando radar por defecto");
          selectedModule = "radar";
        }
      }

      let result: any;

      // 🔥 ROUTER INTELIGENTE
      switch (selectedModule) {
        case "radar":
          result = await radarAI(prompt, image);
          break;
 
        case "audit":
          result = await auditAI(prompt, image);
          break;
 
        case "inventory":
          result = await inventoryAI(prompt, image);
          break;
 
        case "report":
          result = await reportAI(prompt, image);
          break;

        default:
          // 🔁 FALLBACK → lógica original (NO SE ROMPE NADA)
          const genAI = new GoogleGenerativeAI(apiKey);
          const modelName = requestedModel || "gemini-1.5-flash";

          const modelOptions: any = {
            model: modelName,
            systemInstruction: systemInstruction || undefined
          };

          if (req.body.tools) {
            modelOptions.tools = req.body.tools;
          }

          const model = genAI.getGenerativeModel(modelOptions);

          const parts: any[] = [{ text: prompt || "Analiza esto" }];

          if (image) {
            const mimeTypeMatch = image.match(/^data:([^;]+);base64,/);
            const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";
            const base64Data = image.split(",")[1] || image;

            parts.push({
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            });
          }

          const generationConfig: any = {};
          if (responseMimeType) generationConfig.responseMimeType = responseMimeType;
          if (modalities) generationConfig.responseModalities = modalities;

          const aiResult = await model.generateContent({
            contents: [{ role: 'user', parts }],
            generationConfig
          });

          const response = await aiResult.response;

          if (modalities && modalities.includes('AUDIO')) {
            const audioPart = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
            if (audioPart) {
              return res.json({
                audioData: audioPart.inlineData.data,
                text: response.text()
              });
            }
          }

          const text = response.text();

          try {
            if (responseMimeType === 'application/json' || text.trim().startsWith('{')) {
              const jsonMatch = text.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                return res.json(JSON.parse(jsonMatch[0]));
              }
            }
            return res.json({ suggested_reply: text });
          } catch {
            return res.json({ suggested_reply: text });
          }
      }

      // 🔥 RESPUESTA ESTÁNDAR MODULAR
      return res.json({
        module: selectedModule,
        suggested_reply: result
      });

    } catch (error: any) {
      console.error("AI Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware para desarrollo
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
