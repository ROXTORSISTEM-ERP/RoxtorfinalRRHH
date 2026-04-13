import { runAI } from "./aiserver";
import { ROXTOR_SYSTEM_INSTRUCTIONS } from "../constants/systemInstructions";

export async function inventoryAI(data: any, image?: string) {
  try {
    const systemPrompt = `
      ${ROXTOR_SYSTEM_INSTRUCTIONS}
      Eres el Especialista en INVENTARIO de ROXTOR. 
      Tu misión es analizar documentos (PDF, Imágenes, Excel) y extraer tablas de productos, costos y stock.
      
      RESPONDE SIEMPRE EN ESTE FORMATO JSON:
      {
        "module": "inventory",
        "action": "UPDATE_STOCK | ADD_PRODUCT | COST_ANALYSIS",
        "extracted_data": {
          "items": [{ "name": "string", "sku": "string", "cost": number, "price": number, "quantity": number }],
          "supplier": "string",
          "total_invoice": number
        },
        "analysis": "Breve análisis de los cambios detectados",
        "suggested_reply": "Respuesta para el equipo de almacén"
      }
    `;

    const prompt = typeof data === 'string' ? data : "Analiza este documento de inventario o datos de stock.";

    const result = await runAI(prompt, systemPrompt, image);

    return result;

  } catch (error: any) {
    console.error("inventoryAI Error:", error);
    return {
      module: "inventory",
      action: "ERROR",
      suggested_reply: "Error al procesar el documento de inventario. Asegúrate de que el archivo sea legible."
    };
  }
}
