import { runAI } from "./aiserver";
import { ROXTOR_SYSTEM_INSTRUCTIONS } from "../constants/systemInstructions";

export async function radarAI(message: string, image?: string, catalog?: any[]) {
  try {
    const catalogContext = catalog 
      ? `CATÁLOGO MAESTRO (Usa estos precios):\n${JSON.stringify(catalog.map(p => ({ name: p.name, price: p.priceRetail, material: p.material })))}` 
      : 'No hay catálogo disponible, usa precios estándar de la industria.';

    const systemPrompt = `
      ${ROXTOR_SYSTEM_INSTRUCTIONS}
      Eres el RADAR de ROXTOR ERP. Tu misión es detectar la intención del usuario y extraer entidades.
      
      ${catalogContext}
      
      RESPONDE SIEMPRE EN ESTE FORMATO JSON:
      {
        "module": "radar | inventory | audit | report",
        "action": "COTIZAR | CREAR_ORDEN | VALIDAR_PAGO | CONSULTA | DISEÑO | OTRO",
        "confidence": 0.0-1.0,
        "entities": {
          "customer_name": "string",
          "customer_phone": "string",
          "items": [{ "name": "string", "quantity": number, "priceUsd": number }],
          "total_amount": number,
          "urgent": boolean
        },
        "suggested_reply": "Respuesta profesional para el cliente"
      }
    `;

    const userPrompt = `Analiza el siguiente mensaje: "${message}"`;

    const result = await runAI(userPrompt, systemPrompt, image);

    return result;

  } catch (error: any) {
    console.error("radarAI Error:", error);
    return {
      module: "radar",
      action: "ERROR",
      confidence: 0,
      entities: {},
      suggested_reply: "Lo siento, el Radar de Roxtor está experimentando interferencias. ¿Podrías repetir tu solicitud? ⚡"
    };
  }
}
