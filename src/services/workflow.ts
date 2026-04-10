
import { Order, OrderStatus, AppSettings, Message } from '../types';
import { updateOrderStatus } from './orders';
import { sendWhatsappMessage } from './whatsappService';

export type ERPAction = 
  | { type: 'CREATE_ORDER'; data: any }
  | { type: 'UPDATE_STATUS'; data: { orderId: string; status: OrderStatus; agentId: string } }
  | { type: 'SEND_NOTIFICATION'; data: { phone: string; message: string; orderNumber?: string } }
  | { type: 'ASSIGN_WORKSHOP'; data: { orderId: string; workshopId: string } }
  | { type: 'ALERT_LOW_STOCK'; data: { productId: string; currentStock: number } };

export const executeAction = async (
  action: ERPAction,
  context: { 
    orders: Order[]; 
    setOrders: (orders: Order[]) => void;
    settings: AppSettings;
    currentAgentId?: string;
  }
) => {
  const { orders, setOrders, settings, currentAgentId } = context;

  switch (action.type) {
    case 'UPDATE_STATUS': {
      const { orderId, status, agentId } = action.data;
      const order = orders.find(o => o.id === orderId);
      if (order) {
        const updatedOrder = updateOrderStatus(order, status, agentId);
        setOrders(orders.map(o => o.id === orderId ? updatedOrder : o));
        
        // Auto-notification on status change
        if (settings.whatsappConfig?.enabled) {
          await sendWhatsappMessage({ to: order.customerPhone, body: `Hola ${order.customerName}, tu orden ${order.orderNumber} ha pasado al estado: ${status}.` });
        }
      }
      break;
    }

    case 'SEND_NOTIFICATION': {
      const { phone, message } = action.data;
      if (settings.whatsappConfig?.enabled) {
        await sendWhatsappMessage({ to: phone, body: message });
      } else {
        console.log(`[Simulated WhatsApp to ${phone}]: ${message}`);
      }
      break;
    }

    case 'CREATE_ORDER': {
      // This would be called by the AI or a manual form
      // The actual creation logic is in orders.ts, but this could trigger post-creation flows
      break;
    }

    default:
      console.warn(`Acción no reconocida: ${(action as any).type}`);
  }
};

export const handleWorkflowTransition = async (
  order: Order,
  nextStatus: OrderStatus,
  agentId: string,
  settings: AppSettings
) => {
  // 1. Update status
  const updatedOrder = updateOrderStatus(order, nextStatus, agentId);
  
  // 2. Logic based on status
  switch (nextStatus) {
    case 'diseño':
      console.log(`Orden ${order.orderNumber} en fase de DISEÑO.`);
      break;
    case 'taller':
      console.log(`Orden ${order.orderNumber} enviada a TALLER.`);
      break;
    case 'completado':
      // Notify client
      const message = `¡Buenas noticias! Tu pedido ${order.orderNumber} está LISTO para ser retirado. Te esperamos en ${settings.businessName}.`;
      await sendWhatsappMessage({ to: order.customerPhone, body: message });
      break;
  }

  return updatedOrder;
};
