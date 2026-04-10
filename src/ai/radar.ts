import { runAI } from "../utils/aiServer";

export async function radarAI(message: string, image?: string) {
  const prompt = message || `
Actúa como RADAR AI de ROXTOR.

Tarea:
Procesar el siguiente mensaje de cliente y extraer:

- nombre
- cedula o rif
- telefono
- producto
- cantidad
- tipo de cliente (B2B o B2C)
- descripcion del diseño

Luego:
- valida con lógica ROXTOR
- detecta intención
- sugiere siguiente paso

Mensaje:
${message}

Responde SOLO en JSON válido con esta estructura:

{
  "client": {
    "name": "",
    "id": "",
    "phone": ""
  },
  "order": {
    "product": "",
    "quantity": 0,
    "type": "",
    "design": ""
  },
  "intent": "VENTA | CONSULTA | RECLAMO",
  "next_step": "",
  "actions": [
    { "type": "CREATE_ORDER", "data": { ... } },
    { "type": "SEND_NOTIFICATION", "data": { "message": "..." } }
  ]
}
`;

  return await runAI(prompt, undefined, image);
}
