
import { Order, OrderStatus, OrderHistory, ServiceOrderItem, AppSettings } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const createOrder = (
  customer: { name: string; ci: string; phone: string },
  items: ServiceOrderItem[],
  settings: AppSettings,
  currentStoreId: string,
  issuingAgentId?: string,
  issuingAgentName?: string
): Order => {
  const totalUsd = items.reduce((acc, item) => acc + (item.priceUsd * item.quantity), 0);
  const totalBs = totalUsd * settings.bcvRate;
  const store = settings.stores.find(s => s.id === currentStoreId) || settings.stores[0];
  const orderNumber = `${store.prefix}-${store.nextOrderNumber.toString().padStart(4, '0')}`;

  const newOrder: Order = {
    id: uuidv4(),
    orderNumber,
    storeId: currentStoreId,
    customerName: customer.name,
    customerCi: customer.ci,
    customerPhone: customer.phone,
    items,
    totalUsd,
    totalBs,
    abonoUsd: 0,
    restanteUsd: totalUsd,
    status: 'pendiente',
    taskStatus: 'esperando',
    history: [{
      timestamp: Date.now(),
      agentId: issuingAgentId || 'system',
      action: 'Creación de orden',
      status: 'pendiente'
    }],
    bcvRate: settings.bcvRate,
    issueDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    technicalDetails: {},
    referenceImages: [],
    paymentMethod: 'EFECTIVO',
    issuingAgentId,
    issuingAgentName
  };

  return newOrder;
};

export const updateOrderStatus = (
  order: Order,
  newStatus: OrderStatus,
  agentId: string
): Order => {
  const historyEntry: OrderHistory = {
    timestamp: Date.now(),
    agentId,
    action: `Cambio de estado a ${newStatus}`,
    status: newStatus
  };

  return {
    ...order,
    status: newStatus,
    history: [...order.history, historyEntry]
  };
};

export const addOrderPayment = (
  order: Order,
  amountUsd: number,
  method: Order['paymentMethod'],
  reference?: string
): Order => {
  const newAbono = order.abonoUsd + amountUsd;
  return {
    ...order,
    abonoUsd: newAbono,
    restanteUsd: Math.max(0, order.totalUsd - newAbono),
    paymentMethod: method,
    paymentReference: reference
  };
};
