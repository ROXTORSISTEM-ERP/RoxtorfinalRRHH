import { GoogleGenerativeAI } from "@google/generative-ai";
import { ROXTOR_SYSTEM_INSTRUCTIONS } from "../constants/systemInstructions";

/**
 * ROXTOR AI SERVER UTILITY
 * Este archivo maneja la comunicación directa con Gemini desde el backend.
 */

const getApiKey = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no configurada en el servidor.");
  }
  if (apiKey.length < 10) {
    console.warn("⚠️ GEMINI_API_KEY parece ser demasiado corta o inválida.");
  }
  return apiKey;
};

export async function runAI(prompt: string, systemInstruction?: string, image?: string) {
  try {
    const genAI = new GoogleGenerativeAI(getApiKey());
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: systemInstruction || ROXTOR_SYSTEM_INSTRUCTIONS
    });

    const parts: any[] = [{ text: prompt }];

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

    const result = await model.generateContent({
      contents: [{ role: 'user', parts }]
    });
    const response = await result.response;
    const text = response.text();

    // Intentar parsear si parece JSON
    if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.warn("⚠️ Fallo al parsear JSON de IA, devolviendo texto plano");
      }
    }

    return text;
  } catch (error) {
    console.error("🚨 runAI Error:", error);
    throw error;
  }
}
