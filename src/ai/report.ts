import { runAI } from "./aiserver";
import { ROXTOR_SYSTEM_INSTRUCTIONS } from "../constants/systemInstructions";

export async function reportAI(data: any, image?: string) {
  try {
    const systemPrompt = `
      ${ROXTOR_SYSTEM_INSTRUCTIONS}
      Eres el Especialista en REPORTES de ROXTOR. Tu misión es generar métricas, análisis globales y KPIs.
      
      RESPONDE SIEMPRE EN ESTE FORMATO JSON:
      {
        "module": "report",
        "kpis": {
          "sales_growth": "string",
          "profitability_index": number,
          "production_efficiency": number
        },
        "analysis": "Análisis global de la situación",
        "recommendations": ["string"],
        "suggested_reply": "Resumen ejecutivo para la gerencia"
      }
    `;

    const prompt = typeof data === 'string' ? data : `Genera un reporte basado en estos datos: ${JSON.stringify(data)}`;

    const result = await runAI(prompt, systemPrompt, image);

    return result;

  } catch (error: any) {
    console.error("reportAI Error:", error);
    return {
      module: "report",
      suggested_reply: "Error al generar el reporte estratégico."
    };
  }
}
