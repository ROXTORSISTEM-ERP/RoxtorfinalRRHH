/**
 * ROXTOR INTELLIGENT RADAR - FRONTEND BRIDGE
 * Este archivo conecta la interfaz web con el servidor de Netlify/Vercel.
 */

export const callRoxtorAI = async (prompt: string, image?: string, options: any = {}) => {
  try {
    const response = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        image: image,
        ...options
      }),
    });

    if (!response.ok) {
      let errorMsg = `Error ${response.status}: Fallo en el Radar`;
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } else {
          const text = await response.text();
          console.error("🚨 Non-JSON error response:", text.substring(0, 200));
        }
      } catch (e) {
        console.error("🚨 Error parsing error response:", e);
      }
      throw new Error(errorMsg);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    } else {
      const text = await response.text();
      console.error("🚨 Unexpected non-JSON response:", text.substring(0, 200));
      return { suggested_reply: text };
    }
  } catch (error: any) {
    console.error("🚨 Error de conexión con el Cerebro Roxtor:", error);
    return {
      suggested_reply: error.message || "Lo siento, perdí conexión con la Sede Principal. Por favor, verifica tu internet o intenta de nuevo en unos segundos. ⚡",
      error: true
    };
  }
};

/**
 * Función genérica para llamar a la IA desde cualquier parte del ERP
 */
export const callAI = async (prompt: string, options: any = {}) => {
  try {
    const response = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        ...options
      }),
    });

    if (!response.ok) {
      let errorMsg = "Error en la comunicación con la IA";
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        }
      } catch (e) {}
      throw new Error(errorMsg);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      return data.suggested_reply || data;
    } else {
      return await response.text();
    }
  } catch (error: any) {
    console.error("Error callAI:", error);
    throw error;
  }
};

/**
 * Alias para mantener compatibilidad con otras partes del ERP
 */
export const generateWithAI = callRoxtorAI;

/**
 * Hook de seguridad: Ya no exponemos la API KEY al cliente.
 * El servidor se encarga de todo.
 */
export const getGeminiApiKey = () => "PROTECTED_BY_ROXTOR_SERVER";