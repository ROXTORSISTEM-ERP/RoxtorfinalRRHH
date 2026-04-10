import { runAI } from "../utils/aiServer";
import { ROXTOR_SYSTEM_INSTRUCTIONS } from "../constants/systemInstructions";

export async function detectModule(message: string): Promise<string> {
  try {
    const prompt = `
Clasifica el siguiente mensaje en UNO de estos módulos:

- radar → ventas, pedidos, clientes, cotizaciones
- audit → finanzas, gastos, ingresos, contabilidad
- inventory → stock, materiales, productos, telas
- report → métricas, reportes, análisis general

Mensaje:
${message}

Responde SOLO una palabra:
radar | audit | inventory | report
`;

    const text = await runAI(prompt, ROXTOR_SYSTEM_INSTRUCTIONS);
    const cleanedText = String(text).trim().toLowerCase();

    if (["radar", "audit", "inventory", "report"].includes(cleanedText)) {
      return cleanedText;
    }

    return "radar"; // fallback seguro
  } catch (error) {
    console.error("detectModule error:", error);
    return "radar";
  }
}
