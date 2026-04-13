import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

/**
 * ROXTOR AI CORE ENGINE
 * Centralized motor for all AI operations in the ERP.
 */

const getApiKey = () => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    throw new Error("🚨 CONFIGURATION ERROR: GEMINI_API_KEY is missing or invalid in environment variables. Please check your Secrets/Env settings.");
  }

  return apiKey;
};

export async function runAI(
  prompt: string,
  systemInstruction: string,
  image?: string,
  mimeType: string = "image/jpeg"
) {
  try {
    const genAI = new GoogleGenerativeAI(getApiKey());
    
    // Configuración del modelo con systemInstruction nativo
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: {
        role: "system",
        parts: [{ text: systemInstruction }]
      }
    });

    const parts: any[] = [{ text: prompt }];

    if (image) {
      // Limpieza de base64 si viene con el prefijo data:image/...
      const base64Data = image.includes("base64,") 
        ? image.split("base64,")[1] 
        : image;
      
      // Detección dinámica de mimeType si no se provee
      let finalMimeType = mimeType;
      if (image.startsWith("data:")) {
        const match = image.match(/^data:([^;]+);base64,/);
        if (match) finalMimeType = match[1];
      }

      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: finalMimeType,
        },
      });
    }

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0.2, // Baja temperatura para mayor consistencia en JSON
        topP: 0.8,
        topK: 40,
      },
    });

    const response = await result.response;
    let text = response.text().trim();

    // 🔥 LIMPIEZA ROBUSTA DE MARKDOWN JSON
    // Elimina bloques ```json ... ``` o ``` ... ```
    text = text.replace(/```json\s?|```\s?/g, "").trim();

    // 🔥 PARSEO SEGURO
    try {
      return JSON.parse(text);
    } catch (e) {
      console.warn("⚠️ AI returned non-structured text, attempting to extract JSON block:", text);
      
      // Intento de rescate: buscar el primer { y el último }
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (innerError) {
          console.error("❌ Failed to parse extracted JSON block");
        }
      }

      // Si falla todo, devolver como suggested_reply para no romper el flujo
      return { suggested_reply: text, raw: text };
    }
  } catch (error: any) {
    console.error("🚨 ROXTOR AI CORE ERROR:", error.message);
    throw new Error(`AI_ENGINE_FAILURE: ${error.message}`);
  }
}
