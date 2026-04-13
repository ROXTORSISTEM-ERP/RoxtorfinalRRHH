import { runAI } from "./aiserver";
import { ROXTOR_SYSTEM_INSTRUCTIONS } from "../constants/systemInstructions";

export async function detectModule(message: string): Promise<string> {
  try {
    const systemPrompt = `
      ${ROXTOR_SYSTEM_INSTRUCTIONS}
      Eres el Clasificador de Intenciones de ROXTOR. 
      Tu única tarea es clasificar el mensaje del usuario en uno de los módulos del ERP.
      
      MÓDULOS:
      - radar: Ventas, pedidos, clientes, cotizaciones, atención al cliente.
      - audit: Finanzas, gastos, ingresos, auditoría, contabilidad.
      - inventory: Stock, materiales, productos, telas, almacén.
      - report: Métricas, KPIs, análisis estratégico, reportes globales.
      
      RESPONDE SIEMPRE EN ESTE FORMATO JSON:
      {
        "module": "radar | audit | inventory | report",
        "confidence": 0.0-1.0
      }
    `;

    const userPrompt = `Clasifica este mensaje: "${message}"`;

    const result = await runAI(userPrompt, systemPrompt);
    
    const module = result.module || "radar";

    if (["radar", "audit", "inventory", "report"].includes(module)) {
      return module;
    }

    return "radar";
  } catch (error) {
    console.error("detectModule error:", error);
    return "radar";
  }
}
