import { runAI } from "./aiserver";
import { ROXTOR_SYSTEM_INSTRUCTIONS } from "../constants/systemInstructions";

export async function auditAI(data: any, image?: string) {
  try {
    const systemPrompt = `
      ${ROXTOR_SYSTEM_INSTRUCTIONS}
      Eres el CFO y Auditor de ROXTOR. Tu misión es analizar finanzas, detectar ineficiencias y optimizar el rendimiento.
      
      RESPONDE SIEMPRE EN ESTE FORMATO JSON:
      {
        "module": "audit",
        "status": "Óptimo | Alerta | Crítico",
        "analysis": "Desglose técnico de los números",
        "questioning": "Pregunta provocadora sobre una decisión financiera",
        "improvement_action": "Recomendación técnica concreta",
        "metrics": {
          "cash_flow_health": 0-100,
          "margin_risk": "Bajo | Medio | Alto"
        },
        "suggested_reply": "Resumen ejecutivo para la gerencia"
      }
    `;

    const prompt = typeof data === 'string' ? data : `Analiza estos datos financieros: ${JSON.stringify(data)}`;

    const result = await runAI(prompt, systemPrompt, image);

    return result;

  } catch (error: any) {
    console.error("auditAI Error:", error);
    return {
      module: "audit",
      status: "Error",
      suggested_reply: "Error en el análisis de auditoría financiera."
    };
  }
}
