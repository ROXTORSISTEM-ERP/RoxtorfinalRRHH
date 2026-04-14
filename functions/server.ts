import express from "express";
import path from "path";
import dotenv from "dotenv";
import serverless from "serverless-http";

// 🔥 IA MODULAR
import { radarAI } from "../src/ai/radar";
import { auditAI } from "../src/ai/audit";
import { inventoryAI } from "../src/ai/inventory";
import { reportAI } from "../src/ai/report";
import { detectModule } from "../src/ai/detectModule";
import { runAI } from "../src/ai/aiserver";

dotenv.config();

// 🔐 Helper seguro para URLs
function safeURL(url?: string) {
  try {
    if (!url) return null;
    if (!url.startsWith("http")) return null;
    return new URL(url);
  } catch {
    return null;
  }
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: "50mb" }));

  // 🔹 ROOT API
  app.get("/api", (req, res) => {
    res.json({
      message: "ROXTOR API",
      endpoints: ["/api/health", "/api/ai/test", "/api/ai/analyze"],
    });
  });

  // 🔹 HEALTH CHECK
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // 🔹 TEST IA
  app.get("/api/ai/test", async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          success: false,
          error: "GEMINI_API_KEY no configurada",
        });
      }

      const result = await runAI(
        'Responde SOLO en JSON: {"ok": true}',
        "Responde siempre JSON puro"
      );

      res.json({ success: true, result });
    } catch (error: any) {
      console.error("AI TEST ERROR:", error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // 🔹 ANALYZE (CORE IA)
  app.post("/api/ai/analyze", async (req, res) => {
    const { prompt, image, module } = req.body;

    try {
      let selectedModule = module;

      if (!selectedModule && prompt) {
        selectedModule = await detectModule(prompt);
      }

      let result;

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
          result = await runAI(prompt || "Analiza esto");
      }

      res.json(result);
    } catch (error: any) {
      console.error("AI ERROR:", error.message);
      res.status(500).json({
        error: "AI_ENGINE_FAILURE",
        details: error.message,
      });
    }
  });

  // 🔹 WEBHOOK WHATSAPP
  app.get("/api/webhook", (req, res) => {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

    if (
      req.query["hub.mode"] === "subscribe" &&
      req.query["hub.verify_token"] === verifyToken
    ) {
      return res.status(200).send(req.query["hub.challenge"]);
    }

    res.sendStatus(403);
  });

  app.post("/api/webhook", async (req, res) => {
    try {
      const message = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

      if (message?.text?.body) {
        const text = message.text.body;
        const from = message.from;

        const ai = await radarAI(text);

        if (ai?.suggested_reply) {
          const url = safeURL(
            `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`
          );

          if (!url) {
            console.error("URL inválida WhatsApp");
            return res.sendStatus(200);
          }

          await fetch(url.toString(), {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: from,
              type: "text",
              text: { body: ai.suggested_reply },
            }),
          });
        }
      }

      res.sendStatus(200);
    } catch (error) {
      console.error("WEBHOOK ERROR:", error);
      res.sendStatus(500);
    }
  });

 // ✅ SOLUCIÓN FINAL (PARA PATH-TO-REGEXP V8+)
  if (!process.env.NETLIFY && !process.env.VERCEL) {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));

    // Cambiamos '*' por '/:splat*' que es lo que Netlify entiende mejor
    app.get("/:splat*", (req, res) => {
      if (!req.path.startsWith("/api")) {
        res.sendFile(path.join(distPath, "index.html"));
      } else {
        res.status(404).json({ error: "API endpoint not found" });
      }
    });
  }

  return app;
}

// 🔥 SERVERLESS EXPORT CON MANEJO DE ERRORES
let cachedApp: any = null;
let serverlessHandler: any = null;

export const handler = async (event: any, context: any) => {
  try {
    if (!cachedApp) {
      cachedApp = await startServer();
    }
    
    if (!serverlessHandler) {
      serverlessHandler = serverless(cachedApp);
    }
    
    return await serverlessHandler(event, context);
  } catch (error: any) {
    console.error("Error en el handler de Netlify:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: "Error interno en la función de Netlify",
        details: error.message 
      })
    };
  }
};
