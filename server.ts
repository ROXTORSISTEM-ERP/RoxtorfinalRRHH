import express from "express";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

// 🔥 NUEVOS IMPORTS IA MODULAR
import { radarAI } from "./src/ai/radar";
import { auditAI } from "./src/ai/audit";
import { inventoryAI } from "./src/ai/inventory";
import { reportAI } from "./src/ai/report";
import { detectModule } from "./src/ai/detectModule";
import { runAI } from "./src/ai/aiserver";
import serverless from "serverless-http";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  app.get("/api", (req, res) => {
    res.json({ message: "Roxtor API Root", endpoints: ["/health", "/ai/test", "/ai/analyze"] });
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.post("/api/config/gemini-key", (req, res) => {
    const { key } = req.body;
    if (setRuntimeGeminiKey(key)) {
      console.log("✅ GEMINI_API_KEY actualizada en tiempo de ejecución.");
      res.json({ success: true, message: "Clave configurada correctamente." });
    } else {
      res.status(400).json({ error: "Formato de clave inválido. Debe empezar con AIza..." });
    }
  });

  // 🔥 WEBHOOK WHATSAPP (META)
  app.get("/api/webhook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "roxtor_token_123";

    if (mode && token) {
      if (mode === "subscribe" && token === verifyToken) {
        console.log("WEBHOOK_VERIFIED");
        res.status(200).send(challenge);
      } else {
        res.sendStatus(403);
      }
    } else {
      res.sendStatus(400);
    }
  });

  app.post("/api/webhook", async (req, res) => {
    const body = req.body;
    if (body.object === "whatsapp_business_account") {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const message = value?.messages?.[0];

      if (message && message.text?.body) {
        const from = message.from;
        const text = message.text.body;
        console.log(`[Webhook] Mensaje de ${from}: ${text}`);
        
        try {
          // Procesar con Radar AI
          const aiResponse = await radarAI(text);
          console.log("[Webhook AI Response]", aiResponse);
          
          // Enviar respuesta de vuelta al cliente
          const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
          const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

          if (accessToken && phoneNumberId && aiResponse.suggested_reply) {
            await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                messaging_product: "whatsapp",
                to: from,
                type: "text",
                text: { body: aiResponse.suggested_reply }
              })
            });
          }
        } catch (e) {
          console.error("[Webhook Error]", e);
        }
      }
      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  });

  // 🔥 API: Test AI Connection
  app.get("/api/ai/test", async (req, res) => {
    console.log("🔍 [AI Test] Iniciando validación de conexión...");
    try {
      const result = await runAI(
        "Responde SOLO en JSON: {\"ok\": true, \"status\": \"connected\"}",
        "Eres un sistema de diagnóstico de ROXTOR ERP. Responde siempre en JSON puro."
      );
      
      console.log("✅ [AI Test] Conexión exitosa:", result);
      res.json({
        success: true,
        message: "Conexión con Gemini establecida correctamente.",
        result
      });
    } catch (error: any) {
      console.error("❌ [AI Test] Error de conexión:", error.message);
      res.status(500).json({
        success: false,
        error: "Fallo en la conexión con Gemini",
        details: error.message,
        help: "Verifica que GEMINI_API_KEY esté configurada en los Secretos del proyecto."
      });
    }
  });

  // 🔥 API: Radar AI (AHORA MODULAR)
  app.post("/api/ai/radar", async (req, res) => {
    const { message, image, catalog } = req.body;
    try {
      const result = await radarAI(message, image, catalog);
      res.json(result);
    } catch (error: any) {
      console.error("Radar API Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

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

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
      console.error("🚨 GEMINI_API_KEY is missing or using placeholder in environment variables.");
      return res.status(500).json({ 
        error: "GEMINI_API_KEY no configurada. Por favor, ve al panel de 'Settings' -> 'Secrets' en AI Studio y agrega una variable llamada GEMINI_API_KEY con tu llave de Google AI. Si ya la agregaste, asegúrate de que el nombre sea exacto.",
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
          // 🔁 FALLBACK → usa el Core unificado
          result = await runAI(prompt || "Analiza esto", systemInstruction || "Eres un asistente útil del ERP Roxtor.", image);
      }

      // 🔥 RESPUESTA ESTÁNDAR MODULAR
      // Aseguramos que la respuesta sea un objeto JSON válido
      return res.json(result.module ? result : {
        module: selectedModule || "auto",
        ...result
      });

    } catch (error: any) {
      console.error("AI Error:", error);
      res.status(500).json({ 
        error: "Error en el motor de IA de Roxtor",
        details: error.message 
      });
    }
  });

  // 🔥 API: Enviar WhatsApp (META)
  app.post("/api/whatsapp/send", async (req, res) => {
    const { to, message, template, variables } = req.body;
    const { 
      accessToken, 
      phoneNumberId 
    } = { 
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN, 
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID 
    };

    if (!accessToken || !phoneNumberId) {
      console.warn("⚠️ WhatsApp Config missing in environment.");
      return res.status(500).json({ error: "WhatsApp no configurado en el servidor." });
    }

    try {
      const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
      const body: any = {
        messaging_product: "whatsapp",
        to: to,
      };

      if (template) {
        body.type = "template";
        body.template = {
          name: template,
          language: { code: "es" },
          components: variables ? [{
            type: "body",
            parameters: variables.map((v: string) => ({ type: "text", text: v }))
          }] : []
        };
      } else {
        body.type = "text";
        body.text = { body: message };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("WhatsApp Send Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware para desarrollo
  if (process.env.NODE_ENV !== "production" && !process.env.NETLIFY && !process.env.VERCEL) {
    try {
      // Usamos un string para el import para que el bundler no lo analice estáticamente
      const vitePkg = "vite";
      const { createServer: createViteServer } = await import(vitePkg);
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn("⚠️ No se pudo cargar Vite, saltando...");
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Solo escuchar si NO estamos en Netlify/Vercel
  if (!process.env.NETLIFY && !process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  return app;
}

const appPromise = startServer();

// Exportar para Vercel/Netlify
export const handler = serverless(async (req: any, res: any) => {
  const app = await appPromise;
  return app(req, res);
});
