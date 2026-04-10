import { runAI } from "../utils/aiServer";

export async function auditAI(data: any, image?: string) {
  const prompt = typeof data === 'string' ? data : `
Actúa como CFO y Auditor de ROXTOR.

Analiza los siguientes datos financieros o documentos:

${JSON.stringify(data)}

Evalúa:

- flujo de caja
- margen operativo
- gastos innecesarios
- eficiencia

Responde OBLIGATORIAMENTE en este formato:

[STATUS]: (Óptimo / Alerta / Crítico)
[ANÁLISIS DE DATOS]: 
[CUESTIONAMIENTO]:
[ACCIÓN DE MEJORA]:
`;

  return await runAI(prompt, undefined, image);
}
