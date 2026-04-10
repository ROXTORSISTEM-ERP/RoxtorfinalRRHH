import { runAI } from "../utils/aiServer";

export async function inventoryAI(data: any, image?: string) {
  let prompt = typeof data === 'string' ? data : "";

  if (image && !prompt) {
    prompt = `
      ERES EL EXPERTO EN ESCANEO DE PRODUCTOS DE ROXTOR.
      Analiza la imagen adjunta. Puede ser un producto físico, una etiqueta o una página de catálogo.
      
      TAREA:
      1. Identifica el producto.
      2. Extrae el nombre, material/tela, y precios si son visibles.
      3. Si es un catálogo, extrae TODOS los productos visibles.
      
      FORMATO DE RESPUESTA (JSON):
      {
        "items": [
          {
            "name": "NOMBRE EN MAYÚSCULAS",
            "priceRetail": 0.0,
            "priceWholesale": 0.0,
            "material": "TELA/MATERIAL",
            "targetAreas": "ÁREA DE USO",
            "additionalConsiderations": "RECARGOS O NOTAS",
            "description": "DESCRIPCIÓN BREVE"
          }
        ],
        "suggested_reply": "Resumen de lo que encontraste"
      }
    `;
  } else if (!image) {
    prompt = `
      Actúa como sistema de INVENTARIO INTELIGENTE de ROXTOR.
      Analiza los siguientes datos de inventario:
      ${JSON.stringify(data)}
      
      Detecta:
      - productos con bajo stock
      - sobrestock
      - desperdicio
      - inconsistencias
      
      Sugiere:
      - reposición
      - ajuste de compras
      - optimización
      
      Responde en JSON:
      {
        "low_stock": [],
        "overstock": [],
        "issues": [],
        "recommendations": [],
        "suggested_reply": "Resumen ejecutivo para la gerencia"
      }
    `;
  }

  return await runAI(prompt, undefined, image);
}
