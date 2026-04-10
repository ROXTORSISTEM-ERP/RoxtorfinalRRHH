import { runAI } from "../utils/aiServer";

export async function reportAI(data: any, image?: string) {
  const prompt = typeof data === 'string' ? data : `
Actúa como sistema de REPORTES de ROXTOR.

Datos:

${JSON.stringify(data)}

Genera:

- resumen de ventas
- rentabilidad
- rendimiento de producción
- recomendaciones

Responde en JSON:

{
  "sales_summary": "",
  "profitability": "",
  "production": "",
  "recommendations": []
}
`;

  return await runAI(prompt, undefined, image);
}
