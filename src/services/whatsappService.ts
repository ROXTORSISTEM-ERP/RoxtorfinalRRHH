import { Order, AppSettings } from '../types';

// Nueva interfaz para el envío desde la bandeja de entrada
interface SendParams {
  to: string;
  body?: string;
  templateName?: string;
  variables?: string[];
  agentId?: string;
  config?: { 
    accessToken: string, 
    phoneNumberId: string, 
    businessAccountId: string 
  };
}

/**
 * Función Maestra: Usada por WhatsAppInbox y el sistema automático
 */
export const sendWhatsappMessage = async (params: SendParams | any, toArg?: string, bodyArg?: string, agentIdArg?: string) => {
  // Esta lógica permite que la función acepte el formato nuevo (objeto) o el viejo (argumentos separados)
  const isNewFormat = params && typeof params === 'object' && 'to' in params;
  
  const to = isNewFormat ? params.to : toArg;
  const body = isNewFormat ? params.body : bodyArg;
  const templateName = isNewFormat ? params.templateName : null;
  const variables = isNewFormat ? params.variables : null;
  const agent_id = isNewFormat ? params.agentId : agentIdArg;

  try {
    const response = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: to?.replace(/\D/g, ''),
        message: body,
        template: templateName,
        variables: variables, // Para el server.ts
        agent_id
      })
    });
    return await response.json();
  } catch (error) {
    console.error("Error en whatsappService:", error);
    return { success: false };
  }
};

/**
 * Envío de Plantillas (Manteniendo compatibilidad con tu código previo)
 */
export const sendWhatsappTemplate = async (config: any, to: string, templateName: string, components: any[], agent_id?: string) => {
  try {
    const response = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: to.replace(/\D/g, ''),
        template: templateName,
        components,
        agent_id
      })
    });
    return await response.json();
  } catch (error) {
    console.error("Error enviando plantilla:", error);
    throw error;
  }
};

/**
 * Notificaciones Automáticas (Tu lógica de negocio de Roxtor PZO)
 */
export const sendOrderNotification = async (order: Order, type: 'inicio' | 'orden' | 'cobranza' | 'diseno' | 'listo', settings: AppSettings) => {
  if (!settings.whatsappConfig?.enabled || !order.customerPhone) return;

  const customerFirstName = order.customerName.split(' ')[0];
  const orderUrl = `${window.location.origin}/recibo/${order.orderNumber}`;
  const cleanPhone = order.customerPhone.replace(/\D/g, '');

  // 1. Lógica de Plantillas Oficiales
  if (settings.whatsappConfig.useTemplates) {
    let templateName = "";
    let components: any[] = [];

    switch (type) {
      case 'inicio': templateName = "bienvenida_roxtor"; break;
      case 'orden': templateName = "pedido_confirmado_roxtor"; break;
      case 'cobranza': templateName = "datos_pendientes_roxtor"; break;
      case 'diseno': templateName = "revision_diseno_roxtor"; break;
      case 'listo': templateName = "pedido_listo_roxtor"; break;
    }

    if (templateName) {
      // Mapeo básico de variables para las notificaciones automáticas
      const vars = [customerFirstName, order.orderNumber, orderUrl];
      return sendWhatsappMessage({
        to: cleanPhone,
        templateName,
        variables: vars
      });
    }
  }

  // 2. Fallback Mensaje Plano (Si no hay plantillas)
  let message = "";
  switch (type) {
    case 'inicio': message = `¡Hola ${customerFirstName}! 👋 Bienvenido a ROXTOR PZO.`; break;
    case 'orden': message = `🔸 ORDEN: ${order.orderNumber}. Recibo: ${orderUrl}`; break;
    case 'cobranza': message = `🔔 PAGO PENDIENTE: Orden ${order.orderNumber}`; break;
    case 'diseno': message = `🎨 DISEÑO LISTO: Ver aquí ${orderUrl}`; break;
    case 'listo': 
      const storeName = order.orderNumber.startsWith('P') ? 'Sede Principal Vista al Sol' : order.orderNumber.startsWith('C') ? 'Sede Centro San Felix' : 'nuestra tienda';
      message = `✅ ¡PEDIDO LISTO! 🦖\n\nOrden: ${order.orderNumber}\n📍 Retirar en: *${storeName}*\n🔗 Ver Recibo: ${orderUrl}`; 
      break;
  }

  return sendWhatsappMessage({ to: cleanPhone, body: message });
};