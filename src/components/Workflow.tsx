
import React, { useState, useMemo, useEffect } from 'react';
import { Order, OrderStatus, AppSettings, TaskStatus, Agent, Workshop, Product, DesignSpecs, Debt, RadarAlert, OrderHistory } from '../types';
import { sendOrderNotification } from '../services/whatsappService';
import { 
  Printer, 
  X,
  Users,
  Calendar,
  MessageCircle,
  ChevronRight,
  ImageIcon,
  Download,
  Plus,
  Trash2,
  Palette,
  FileText,
  Wallet,
  Coins,
  Clock,
  Activity,
  PackageCheck,
  Search,
  Warehouse,
  Database,
  ImagePlus,
  ArrowRightLeft,
  ArrowRight,
  DollarSign,
  CheckSquare,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Bell
} from 'lucide-react';
import OrderReceipt from './OrderReceipt';
import { DEPARTMENT_CHECKLISTS } from './Checklists';

interface Props {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  settings: AppSettings;
  agents: Agent[];
  workshops: Workshop[];
  products: Product[];
  debts: Debt[];
  setDebts: React.Dispatch<React.SetStateAction<Debt[]>>;
  radarAlerts: RadarAlert[];
  setRadarAlerts: React.Dispatch<React.SetStateAction<RadarAlert[]>>;
}

interface GenderQty {
  gender: string;
  quantity: number;
  size: string;
}

const Workflow: React.FC<Props> = ({ orders, setOrders, settings, agents, workshops, products, debts, setDebts, radarAlerts, setRadarAlerts }) => {
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<Order | null>(null);
  const [paymentModalOrder, setPaymentModalOrder] = useState<Order | null>(null);
  const [dispatchPaymentModal, setDispatchPaymentModal] = useState<Order | null>(null);
  const [transferModalOrder, setTransferModalOrder] = useState<Order | null>(null);
  const [workshopAssignModal, setWorkshopAssignModal] = useState<Order | null>(null);
  const [sewingFormModal, setSewingFormModal] = useState<{ order: Order, workshop: Workshop } | null>(null);
  const [generalWorkshopModal, setGeneralWorkshopModal] = useState<{ order: Order, workshop: Workshop } | null>(null);
  const [imageGalleryModal, setImageGalleryModal] = useState<Order | null>(null);
  const [designSpecsModal, setDesignSpecsModal] = useState<Order | null>(null);
  const [finalDesignModal, setFinalDesignModal] = useState<Order | null>(null);
  const [isUploadingDesign, setIsUploadingDesign] = useState(false);
  const [checklistModal, setChecklistModal] = useState<{ order: Order, deptId: string, onComplete: () => void } | null>(null);
  const [checklistProgress, setChecklistProgress] = useState<Record<string, boolean>>({});
  
  const [showWorkshopHistory, setShowWorkshopHistory] = useState(false);
  
  const [filterAgentId, setFilterAgentId] = useState<string>('');
  const [deliveryFilter, setDeliveryFilter] = useState('');
  
  useEffect(() => {
    const handleAutoFinish = (e: any) => {
      const orderId = e.detail;
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      setOrders(prev => prev.map(o => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          status: 'completado',
          taskStatus: 'terminado',
          isDelivered: true,
          // BLINDAJE CRÍTICO
          history: [...(o.history || []), { 
            timestamp: Date.now(), 
            agentId: 'system', 
            action: 'FINALIZADO TODO (MODO AUTO) - Checklist omitido por automatización', 
            status: 'completado' 
          }]
        };
      }));
    };

    window.addEventListener('autoFinishOrder', handleAutoFinish);
    return () => window.removeEventListener('autoFinishOrder', handleAutoFinish);
  }, [orders, setOrders]);

  const updateTaskStatus = (orderId: string, newStatus: TaskStatus, actionText?: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      let action = actionText || `Tarea movida a ${newStatus.toUpperCase()}`;
      return {
        ...order,
        taskStatus: newStatus,
        // BLINDAJE CRÍTICO
        history: [...(order.history || []), { 
          timestamp: Date.now(), 
          agentId: order.assignedAgentId || 'system', 
          action, 
          status: order.status 
        }]
      };
    }));
  };

 const [paymentData, setPaymentData] = useState({ 
    amount: 0, 
    amountBs: 0, 
    method: 'DOLARES $' as Order['paymentMethod'], 
    reference: '' 
  });

  const [dispatchPaymentData, setDispatchPaymentData] = useState({ 
    amountUsd: 0, 
    amountBs: 0, 
    method: 'DOLARES $' as Order['paymentMethod'], 
    reference: '' 
  });

  const [transferData, setTransferData] = useState<{ agentId: string, nextStatus: OrderStatus }>({
    agentId: '',
    nextStatus: 'pendiente'
  });

  const [sewingData, setSewingData] = useState({
    productName: '',
    isManualProduct: false,
    manualProductName: '',
    genderSelections: [{ gender: 'DAMA', quantity: 1, size: 'S' }] as GenderQty[],
    fabricType: '',
    color: '',
    observations: '',
    referenceImage: '' // Nueva imagen de referencia para taller
  });

  const [generalWorkshopData, setGeneralWorkshopData] = useState({
    productName: '',
    isManualProduct: false,
    manualProductName: '',
    quantity: 1,
    specifications: '',
    referenceNote: '',
    referenceImage: '' // Nueva imagen de referencia para taller
  });

  const TALLAS_OPTIONS = ["18m", "2", "4", "6", "8", "10", "12", "14", "16", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "MUESTRA"];
  const GENDER_OPTIONS = ["NIÑOS UNISEX", "DAMA", "CABALLERO"];

  const isNearDeadline = (deliveryDateStr: string) => {
    if (!deliveryDateStr) return false;
    try {
      const parts = deliveryDateStr.split('/');
      if (parts.length !== 3) return false;
      const [day, month, year] = parts.map(Number);
      const deliveryDate = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffTime = deliveryDate.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) <= 3;
    } catch (e) { return false; }
  };

  const triggerCustomerNotification = (order: Order) => {
    const cleanPhone = order.customerPhone.replace(/\D/g, '');
    const phone = cleanPhone.startsWith('58') ? cleanPhone : `58${cleanPhone}`;
    let message = `¡Hola ${order.customerName.split(' ')[0]}! 😊 Tu pedido *${order.orderNumber}* ya está listo en *${settings.businessName}*.\n\n`;
    
    if (order.restanteUsd > 0) {
      message += `📌 *SALDO PENDIENTE:* $${order.restanteUsd.toFixed(2)}\n`;
      message += `Bs. ${(order.restanteUsd * settings.bcvRate).toLocaleString('es-VE')}\n\n`;
      
      if (settings.pagoMovil) {
        message += `*DATOS DE PAGO MÓVIL:*\n`;
        message += `🏦 Banco: ${settings.pagoMovil.bank}\n`;
        message += `🆔 C.I/RIF: ${settings.pagoMovil.idNumber}\n`;
        message += `📱 Teléfono: ${settings.pagoMovil.phone}\n\n`;
      }
    }
    
    message += `📍 Pasa retirando cuando gustes. ¡Gracias! 🦖`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

   const handleApplyPayment = () => {
    if (!paymentModalOrder || paymentData.amount <= 0) return;
    try {
      setOrders(prev => prev.map(order => {
        if (order.id !== paymentModalOrder.id) return order;
        const currentAbono = order.abonoUsd || 0;
        const totalOrden = order.totalUsd || 0;
        const newAbono = currentAbono + paymentData.amount;
        
        return {
          ...order,
          abonoUsd: newAbono,
          restanteUsd: Math.max(0, totalOrden - newAbono),
          history: [...(order.history || []), { 
            timestamp: Date.now(), 
            agentId: 'admin', 
            action: `Abono Adicional: $${paymentData.amount.toFixed(2)} / Bs. ${paymentData.amountBs.toFixed(2)} (${paymentData.method}) - Ref: ${paymentData.reference}`, 
            status: order.status 
          }]
        };
      }));
    } finally {
      setPaymentModalOrder(null);
      setPaymentData({ amount: 0, amountBs: 0, method: 'DOLARES $', reference: '' });
    }
  };
  
  const showChecklist = (order: Order, deptId: string, onComplete: () => void) => {
    setChecklistModal({ order, deptId, onComplete });
    setChecklistProgress({});
  };

  const handleApplyDispatchPayment = () => {
    if (!dispatchPaymentModal) return;
    setOrders(prev => prev.map(order => {
      if (order.id !== dispatchPaymentModal.id) return order;
      return {
        ...order,
        finalPaymentAmountUsd: dispatchPaymentData.amountUsd,
        finalPaymentAmountBs: dispatchPaymentData.amountBs,
        finalPaymentMethod: dispatchPaymentData.method,
        finalPaymentReference: dispatchPaymentData.reference,
        abonoUsd: order.abonoUsd + dispatchPaymentData.amountUsd,
        restanteUsd: Math.max(0, order.restanteUsd - dispatchPaymentData.amountUsd),
        isDelivered: true,
        history: [...order.history, { 
          timestamp: Date.now(), 
          agentId: 'admin', 
          action: `Pago Final y Despacho: $${dispatchPaymentData.amountUsd.toFixed(2)} (${dispatchPaymentData.method}) - Ref: ${dispatchPaymentData.reference}`, 
          status: 'completado' 
        }]
      };
    }));
    
    // Enviar mensaje automático al finalizar - REMOVIDO POR SOLICITUD DE USUARIO
    // triggerCustomerNotification(dispatchPaymentModal);
    
    setDispatchPaymentModal(null);
    setDispatchPaymentData({ amountUsd: 0, amountBs: 0, method: 'DOLARES $', reference: '' });
  };

  const handleWorkshopAssignment = (workshop: Workshop) => {
    if (!workshopAssignModal) return;
    const order = workshopAssignModal;
    const firstItem = order.items?.[0];
    if (workshop.department === 'COSTURA') {
      setSewingFormModal({ order, workshop });
      setWorkshopAssignModal(null);
      setSewingData({
        productName: firstItem?.productId || 'MANUAL',
        isManualProduct: !products.some(p => p.id === firstItem?.productId),
        manualProductName: !products.some(p => p.id === firstItem?.productId) ? (firstItem?.name || '') : '',
        genderSelections: [{ gender: 'DAMA', quantity: firstItem?.quantity || 1, size: 'S' }],
        fabricType: '', 
        color: '', 
        observations: order.workshopObservations || '',
        referenceImage: order.workshopReferenceImage || ''
      });
    } else {
      setGeneralWorkshopModal({ order, workshop });
      setWorkshopAssignModal(null);
      setGeneralWorkshopData({
        productName: firstItem?.productId || 'MANUAL',
        isManualProduct: !products.some(p => p.id === firstItem?.productId),
        manualProductName: !products.some(p => p.id === firstItem?.productId) ? (firstItem?.name || '') : '',
        quantity: firstItem?.quantity || 1,
        specifications: order.workshopObservations || '', 
        referenceNote: '',
        referenceImage: order.workshopReferenceImage || ''
      });
    }
  };

 // Función mejorada: Al recibir de taller, abrimos transferencia para reasignar responsable
  const handleReceiveFromWorkshop = (order: Order) => {
    setTransferModalOrder(order);
    setTransferData({
        agentId: '', // Forzamos a elegir un nuevo responsable
        nextStatus: 'diseño' // Sugerimos diseño como siguiente paso lógico
    });

    // Actualizar estado de flujo de taller a 'Entregado'
    setOrders(prev => prev.map(o => {
      if (o.id === order.id) {
        const updatedWorkflowStatus = { ...(o.workshopWorkflowStatus || {}) };
        
        // Marcamos como entregado para todos los talleres asignados
        if (o.assignedWorkshopIds) {
          o.assignedWorkshopIds.forEach(wid => {
            if (updatedWorkflowStatus[wid] !== 'Entregado') {
              updatedWorkflowStatus[wid] = 'Entregado';
            }
          });
        }

        return { 
          ...o, 
          workshopWorkflowStatus: updatedWorkflowStatus,
          // EL SEGURO: Usamos (o.history || []) para que nunca sea nulo
          history: [...(o.history || []), { 
            timestamp: Date.now(), 
            agentId: 'admin', 
            action: 'RECIBIDO DE TALLER - Pendiente reasignación de fase', 
            status: o.status 
          }]
        };
      }
      return o;
    }));
  };

const sendSewingWhatsApp = async () => {
  if (!sewingFormModal) return;
  const { order, workshop } = sewingFormModal;
  
  // 1. Fecha Límite Segura (Evita crash si deliveryDate es null o mal formato)
  let workshopDeadline = 'Pendiente';
  if (order?.deliveryDate && order.deliveryDate.includes('/')) {
    const dateParts = order.deliveryDate.split('/');
    const d = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
    d.setDate(d.getDate() - 2);
    workshopDeadline = d.toLocaleDateString('es-VE');
  }

  const breakdown = (sewingData.genderSelections || []).map(g => `• [${g.size}] - ${g.quantity}x ${g.gender}`).join('\n');
      
  let msg = `*ORDEN DE PRODUCCIÓN ROXTOR (COSTURA)* 🧵\n`;
  msg += `📌 ID: ${order.orderNumber}\n`;
  msg += `--------------------------------\n`;
  msg += `📐 DESGLOSE DE TALLAS:\n${breakdown}\n\n`;
  msg += `🎨 COLOR: ${sewingData.color?.toUpperCase()}\n`;
  msg += `🧵 TELA: ${sewingData.fabricType?.toUpperCase() || 'MICRODURAZNO'}\n`;
  if (sewingData.observations) msg += `📝 NOTAS: ${sewingData.observations}\n`;
  msg += `\n📅 *ENTREGA TALLER:* ${workshopDeadline}\n`;
  msg += `\nFavor confirmar recepción. 🦖`;
  
  // Limpieza del teléfono para evitar errores en wa.me
  const cleanPhone = (workshop?.phone || '').replace(/\D/g, '');
  window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  
  // Calcular Deuda por Confección (Blindado)
  const totalQty = (sewingData.genderSelections || []).reduce((acc, g) => acc + g.quantity, 0);
  const productNameToMatch = sewingData.isManualProduct 
    ? sewingData.manualProductName 
    : (products.find(p => p.id === sewingData.productName)?.name || '');

  const laborPrice = (workshop?.laborPrices || []).find(lp => 
    productNameToMatch.toLowerCase().includes(lp.garmentType.toLowerCase())
  )?.priceUsd || 0;

  if (laborPrice > 0) {
    const newDebt: Debt = {
      id: Math.random().toString(36).substr(2, 9),
      creditorName: workshop.name,
      description: `CONFECCIÓN ORDEN #${order.orderNumber}: ${totalQty}x ${productNameToMatch}`,
      totalAmountUsd: laborPrice * totalQty,
      dateAcquired: new Date().toLocaleDateString('es-VE'),
      payments: [],
      status: 'pendiente'
    };
    setDebts(prev => [...(prev || []), newDebt]);
  }

  // Actualizar estado local con BLINDAJE
  setOrders(prev => (prev || []).map(o => o.id === order.id ? {
    ...o, 
    assignedWorkshopIds: [...(o.assignedWorkshopIds || []), workshop.id], 
    taskStatus: 'confeccion', 
    workshopReferenceImage: sewingData.referenceImage || o.workshopReferenceImage,
    workshopObservations: sewingData.observations || o.workshopObservations,
    history: [...(o.history || []), { 
      timestamp: Date.now(), 
      agentId: o.assignedAgentId || 'admin', 
      action: `[TASK_OK] Enviado a taller: ${workshop.name}${sewingData.observations ? ' - Notas: ' + sewingData.observations : ''}`, 
      status: 'taller' 
    }] 
  } : o));

  setSewingFormModal(null);
};
 const sendGeneralWorkshopWhatsApp = async () => {
  if (!generalWorkshopModal) return;
  const { order, workshop } = generalWorkshopModal;
      
  let msg = `*ORDEN DE PRODUCCIÓN ROXTOR* 🛠️\n`;
  msg += `📌 ID: ${order.orderNumber}\n`;
  msg += `🏢 ÁREA: ${workshop.department || 'Producción'}\n`;
  msg += `🔢 CANTIDAD: ${generalWorkshopData.quantity}\n`;
  if (generalWorkshopData.specifications) msg += `📝 ESPECIFICACIONES: ${generalWorkshopData.specifications}\n`;
  msg += `\nFavor confirmar recepción. 🦖`;

  const cleanPhone = (workshop?.phone || '').replace(/\D/g, '');
  window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  
  // Calcular Deuda General (Blindado)
  const totalQty = generalWorkshopData.quantity || 0;
  const productNameToMatch = generalWorkshopData.isManualProduct 
    ? generalWorkshopData.manualProductName 
    : (products.find(p => p.id === generalWorkshopData.productName)?.name || '');

  const laborPrice = (workshop?.laborPrices || []).find(lp => 
    productNameToMatch.toLowerCase().includes(lp.garmentType.toLowerCase())
  )?.priceUsd || 0;

  if (laborPrice > 0) {
    const newDebt: Debt = {
      id: Math.random().toString(36).substr(2, 9),
      creditorName: workshop.name,
      description: `PRODUCCIÓN ${workshop.department} ORDEN #${order.orderNumber}: ${totalQty}x ${productNameToMatch}`,
      totalAmountUsd: laborPrice * totalQty,
      dateAcquired: new Date().toLocaleDateString('es-VE'),
      payments: [],
      status: 'pendiente'
    };
    setDebts(prev => [...(prev || []), newDebt]);
  }

  // Actualizar estado local con BLINDAJE
  setOrders(prev => (prev || []).map(o => o.id === order.id ? {
    ...o, 
    assignedWorkshopIds: [...(o.assignedWorkshopIds || []), workshop.id], 
    taskStatus: 'confeccion', 
    workshopReferenceImage: generalWorkshopData.referenceImage || o.workshopReferenceImage,
    workshopObservations: generalWorkshopData.specifications || o.workshopObservations,
    history: [...(o.history || []), { 
      timestamp: Date.now(), 
      agentId: o.assignedAgentId || 'admin', 
      action: `[TASK_OK] Enviado a taller ${workshop.department}: ${workshop.name}`, 
      status: 'taller' 
    }] 
  } : o));

  setGeneralWorkshopModal(null);
};

  const handleTransferPhase = () => {
    if (!transferModalOrder) return;
    setOrders(prev => prev.map(order => {
      if (order.id !== transferModalOrder.id) return order;
      
      if (transferData.nextStatus === 'diseño') {
        sendOrderNotification(order, 'diseno', settings);
      }

      const agentName = agents.find(a => a.id === transferData.agentId)?.name || 'mismo agente';

      return {
        ...order,
        status: transferData.nextStatus,
        assignedAgentId: transferData.agentId || order.assignedAgentId,
        taskStatus: 'esperando',
        // CORRECCIÓN: Blindaje de history
        history: [...(order.history || []), { 
          timestamp: Date.now(), 
          agentId: 'admin', 
          action: `Reasignado a ${agentName} en fase ${transferData.nextStatus.toUpperCase()}`, 
          status: transferData.nextStatus 
        }]
      };
    }));
    setTransferModalOrder(null);
  };
  const handleDeleteReferenceImage = (orderId: string, imageIndex: number) => {
    if (!confirm("¿Seguro que desea eliminar esta imagen de referencia?")) return;
    
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      const newImages = order.referenceImages.filter((_, i) => i !== imageIndex);
      
      // Actualizar también el modal si está abierto
      if (imageGalleryModal && imageGalleryModal.id === orderId) {
        setImageGalleryModal({ ...order, referenceImages: newImages });
      }
      
      return {
        ...order,
        referenceImages: newImages,
        history: [...order.history, { 
          timestamp: Date.now(), 
          agentId: 'admin', 
          action: `Imagen de referencia #${imageIndex + 1} eliminada`, 
          status: order.status 
        }]
      };
    }));
  };

  const handleDeleteFinalDesign = (orderId: string) => {
    if (!confirm("¿Seguro que desea eliminar el diseño final?")) return;
    
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      
      // Actualizar también el modal si está abierto
      if (finalDesignModal && finalDesignModal.id === orderId) {
        setFinalDesignModal({ ...order, finalDesignUrl: undefined });
      }
      
      return {
        ...order,
        finalDesignUrl: undefined,
        // CORRECCIÓN: Blindaje de historial para evitar que el borrado falle
        history: [...(order.history || []), { 
          timestamp: Date.now(), 
          agentId: 'admin', 
          action: `Diseño final eliminado`, 
          status: order.status 
        }]
      };
    }));
    
    console.log(`Diseño eliminado de la orden ${orderId} y evento registrado en historial.`);
  };

  const handleApproveDesign = (orderId: string) => {
    setOrders(prev => prev.map((order): Order => {
      if (order.id !== orderId) return order;
      
      const updatedSpecs: DesignSpecs = { ...order.designSpecs, isApprovedByClient: true, approvedAt: Date.now() };
      
    return {
      ...order,
      designSpecs: updatedSpecs,
      // CORRECCIÓN: Blindaje con paréntesis y fallback a arreglo vacío
      history: [...(order.history || []), { 
        timestamp: Date.now(), 
        agentId: order.assignedAgentId || 'designer', 
        action: 'DISEÑO APROBADO DIRECTAMENTE - Listo para producción', 
        status: order.status 
      }]
    };
  }));
  setDesignSpecsModal(null);
  console.log(`Orden #${orderId} enviada a producción con historial blindado.`);
};

  const handleUploadFinalDesign = async (e: React.ChangeEvent<HTMLInputElement>, order: Order) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingDesign(true);
    try {
      const optimizedImage = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxDimension = 1200;
            if (width > height) {
              if (width > maxDimension) { height *= maxDimension / width; width = maxDimension; }
            } else {
              if (height > maxDimension) { width *= maxDimension / height; height = maxDimension; }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
          };
          img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
      });

      setOrders(prev => prev.map(o => o.id === order.id ? {
        ...o,
        finalDesignUrl: optimizedImage,
        designSpecs: o.designSpecs 
          ? { ...o.designSpecs, isApprovedByClient: true, approvedAt: Date.now() } 
          : { isApprovedByClient: true, approvedAt: Date.now() },
        history: [...(o.history || []), { 
          timestamp: Date.now(), 
          agentId: o.assignedAgentId || 'designer', 
          action: 'DISEÑO FINAL CARGADO Y APROBADO', 
          status: o.status 
        }]
      } : o));
      
      setFinalDesignModal(null);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsUploadingDesign(false);
    }
  }; // <--- AQUÍ ESTABA EL ERROR, YA ESTÁ CERRADO

  const updateDesignSpecs = (orderId: string, specs: DesignSpecs) => {
    setOrders(prev => prev.map((order): Order => {
      if (order.id !== orderId) return order;
      return {
        ...order,
        designSpecs: specs,
        history: [...(order.history || []), { 
          timestamp: Date.now(), 
          agentId: order.assignedAgentId || 'designer', 
          action: 'Especificaciones de diseño actualizadas', 
          status: order.status 
        }]
      };
    }));
  };

  const handleValidatePayment = async (order: Order) => {
  // 1. Definimos el siguiente estado (Gerencia / Pendiente)
  const nextStatus = 'pendiente';

  try {
    // 2. Preparamos el historial blindado (si o.history no existe, usa [])
    const newHistoryEntry: OrderHistory = { 
      timestamp: Date.now(), 
      agentId: 'admin', 
      action: 'Pago Validado - Movido a Pendiente', 
      status: nextStatus 
    };

    // 4. Notificamos y actualizamos el estado local
    sendOrderNotification(order, 'orden', settings);

    setOrders(prev => prev.map(o => o.id === order.id ? {
      ...o,
      status: nextStatus,
      history: [...(o.history || []), newHistoryEntry] // <--- Blindaje aquí también
    } : o));

    console.log(`Orden #${order.orderNumber} validada correctamente.`);

  } catch (error: any) {
    console.error("Error al validar pago:", error.message);
    // Aquí podrías poner una alerta para saber que falló la conexión
  }
};
  const filteredOrders = filterAgentId ? orders.filter(o => o.assignedAgentId === filterAgentId) : orders;

  const handleDeleteWorkshopReference = (orderId: string) => {
    if (!confirm("¿Eliminar imagen y notas de taller para liberar espacio?")) return;
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, workshopReferenceImage: undefined, workshopObservations: undefined } : o));
  };

  const ordersWithWorkshopImages = useMemo(() => orders.filter(o => o.workshopReferenceImage).length, [orders]);

  const readyForDelivery = useMemo(() => orders.filter(o => o.status === 'completado' && !o.isDelivered && !o.isLogistics && (o.customerName.toLowerCase().includes(deliveryFilter.toLowerCase()) || o.orderNumber.includes(deliveryFilter))), [orders, deliveryFilter]);

  // Fixed: Added key property to props type to avoid TypeScript error on line 290
 const RenderColumn = ({ status, label }: { status: OrderStatus, label: string, key?: string }) => (
    <div className="space-y-4 min-w-[280px] flex-1">
      <div className="bg-[#000814] text-white px-5 py-3 rounded-2xl flex items-center justify-between shadow-lg">
        <h3 className="text-[10px] font-black uppercase tracking-widest italic">{label}</h3>
        <span className="bg-white/10 px-2 py-0.5 rounded-lg text-[10px] font-black">{filteredOrders.filter(o => o.status === status).length}</span>
      </div>
      <div className="space-y-5 max-h-[600px] overflow-y-auto no-scrollbar pb-4 px-1">
        {filteredOrders.filter(o => o.status === status).map((order, idx) => {
          const urgent = isNearDeadline(order.deliveryDate);
          return (
            <div key={`${order.id}-${idx}`} className={`bg-white border-2 border-slate-50 rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl transition-all relative flex flex-col h-full border-l-[12px] ${urgent ? 'border-l-rose-500' : 'border-l-[#004ea1]'}`}>
               <div className="flex flex-col mb-4">
                 <div className="flex justify-between items-start mb-2">
                   <h5 className="text-[9px] font-black text-slate-400 uppercase italic tracking-widest truncate max-w-[130px]">{order.customerName}</h5>
                   <div className="flex gap-1.5">
                    {order.designSpecs && (
                      <button 
                        onClick={() => setDesignSpecsModal(order)} 
                        className={`p-1.5 rounded-xl transition-all ${order.designSpecs.isApprovedByClient ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600 animate-pulse'}`}
                        title="Especificaciones de Diseño"
                      >
                        <Palette size={12} />
                      </button>
                    )}
                    
                    {order.referenceImages?.length > 0 && <button onClick={() => setImageGalleryModal(order)} className="p-1.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><ImageIcon size={12} /></button>}
                    
                    <button 
                      onClick={() => setFinalDesignModal(order)} 
                      className={`p-1.5 rounded-xl transition-all ${order.finalDesignUrl ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-400 hover:bg-[#000814] hover:text-white'}`}
                      title="Cargar Diseño Final"
                    >
                      <CheckCircle2 size={12} />
                    </button>

                    {/* NUEVO BOTÓN: FICHA TÉCNICA DINÁMICA */}
                    {(order.taskStatus === 'confeccion' || order.status === 'taller') && (
                      <button 
                        onClick={() => {
                          const workshopId = order.assignedWorkshopIds?.[0];
                          const workshop = workshops.find(w => w.id === workshopId);
                          if (workshop?.department === 'COSTURA') {
                            setSewingFormModal({ order, workshop });
                          } else if (workshop) {
                            setGeneralWorkshopModal({ order, workshop });
                          } else {
                            setWorkshopAssignModal(order);
                          }
                        }}
                        className={`p-1.5 rounded-xl transition-all ${!order.workshopObservations ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-amber-100 text-amber-600 hover:bg-[#000814] hover:text-white'}`}
                        title="Ficha Técnica de Taller"
                      >
                        <CheckCircle2 size={12} />
                      </button>
                    )}

                    <button onClick={() => setSelectedOrderForPrint(order)} className="p-1.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-[#000814] hover:text-white transition-all"><Printer size={12} /></button>
                    
                    {order.workshopReferenceImage && (
                      <button 
                        onClick={() => handleDeleteWorkshopReference(order.id)}
                        className="p-1.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all"
                        title="Eliminar Referencia de Taller"
                      >
                        <Database size={12} />
                      </button>
                    )}
                   </div>
                 </div>
                 <p className="text-4xl font-black text-[#000814] italic tracking-tighter mb-2">#{order.orderNumber}</p>
                 <div className="flex items-center gap-2 text-slate-400 font-black italic text-[9px]"><Calendar size={12} className={urgent ? 'text-rose-500' : 'text-[#004ea1]'} /> {order.deliveryDate}</div>
               </div>

               <div className="mt-auto space-y-3">
                  <div className="p-4 bg-slate-50 rounded-[1.5rem] border-2 border-slate-100">
                    <div className="flex justify-between items-center text-[8px] font-black uppercase italic mb-3">
                      <span className="text-slate-400">ESTADO TAREA:</span>
                      <span className={`font-black ${order.taskStatus === 'confeccion' ? 'text-rose-500 animate-pulse' : 'text-[#004ea1]'}`}>{order.taskStatus === 'confeccion' ? 'EN TALLER EXTERNO' : order.taskStatus.toUpperCase()}</span>
                    </div>

                    <div className="space-y-2">
                        {order.status === 'Por Validar' && (
                          <button 
                            onClick={() => handleValidatePayment(order)}
                            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest italic border-b-4 border-emerald-800 active:translate-y-1 flex items-center justify-center gap-2 shadow-lg"
                          >
                            <Wallet size={16}/> VALIDAR PAGO WEB
                          </button>
                        )}

                        {order.taskStatus === 'esperando' && order.status !== 'Por Validar' && (
                          <button 
                            onClick={() => {
                              const deptId = order.status === 'pendiente' ? 'ventas' : (order.status === 'diseño' ? 'recepcion' : 'operaciones');
                              showChecklist(order, deptId, () => {
                                if (order.status === 'taller') setWorkshopAssignModal(order);
                                else updateTaskStatus(order.id, 'proceso');
                              });
                            }} 
                            className="w-full bg-[#000814] text-white py-3 rounded-xl font-black text-[9px] uppercase tracking-widest italic border-b-4 border-slate-800"
                          >
                            EMPEZAR TRABAJO
                          </button>
                        )}
                        
                        {order.taskStatus === 'proceso' && (
                          <div className="space-y-2">
                            {order.status === 'diseño' && order.designSpecs && !order.designSpecs.isApprovedByClient && (
                              <button 
                                onClick={() => handleApproveDesign(order.id)}
                                className="w-full bg-rose-600 text-white py-3 rounded-xl font-black text-[9px] uppercase tracking-widest italic border-b-4 border-rose-800 animate-bounce"
                              >
                                APROBAR DISEÑO DIRECTAMENTE
                              </button>
                            )}
                            <button 
                              onClick={() => {
                                const deptId = 'operaciones';
                                showChecklist(order, deptId, () => {
                                  if (order.status === 'taller') setWorkshopAssignModal(order);
                                  else updateTaskStatus(order.id, 'terminado');
                                });
                              }} 
                              className="w-full bg-emerald-600 text-white py-3 rounded-xl font-black text-[9px] uppercase tracking-widest italic border-b-4 border-emerald-800"
                            >
                              {order.status === 'taller' ? 'ENVIAR A TALLER (MAQUILA)' : 'MARCAR LISTO'}
                            </button>
                          </div>
                        )}

                        {order.taskStatus === 'confeccion' && (
                          <div className="grid grid-cols-1 gap-2">
                            {/* Botón Maestro: Recibir y Reasignar Responsable */}
                            <button onClick={() => handleReceiveFromWorkshop(order)} className="w-full bg-rose-500 text-white py-3 rounded-xl font-black text-[9px] uppercase tracking-widest italic shadow-lg border-b-4 border-rose-700 animate-pulse">RECIBIR Y REASIGNAR</button>
                            <button onClick={() => setWorkshopAssignModal(order)} className="w-full bg-[#004ea1] text-white py-2 rounded-xl font-black text-[8px] uppercase tracking-widest italic border-b-2 border-blue-900">+ OTRO TALLER</button>
                          </div>
                        )}

                        {order.taskStatus === 'terminado' && (
                          <button onClick={() => { setTransferModalOrder(order); setTransferData({ agentId: order.assignedAgentId || '', nextStatus: order.status }); }} className="w-full bg-[#004ea1] text-white py-3 rounded-xl font-black text-[9px] uppercase tracking-widest italic border-b-4 border-blue-900">PASAR A SIGUIENTE FASE</button>
                        )}

                        <button 
                          onClick={() => {
                            setOrders(prev => prev.map(o => o.id === order.id ? {...o, status: 'completado', taskStatus: 'terminado'} : o));
                            sendOrderNotification(order, 'listo', settings);
                          }} 
                          className="w-full border border-slate-200 text-slate-400 py-2 rounded-lg font-black text-[8px] uppercase hover:text-emerald-500 transition-colors italic"
                        >
                          FINALIZAR TOTAL
                        </button>
                    </div>
                  </div>
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const resolveAlert = (id: string, response: 'available' | 'taller') => {
    setRadarAlerts(prev => prev.map(a => a.id === id ? { 
      ...a, 
      status: 'resolved', 
      agentResponse: response,
      resolvedAt: Date.now() 
    } : a));
  };

// 1. Función para Notificar al Taller
  const sendWorkshopDelayNotification = async (alert: RadarAlert) => {
    const orderNumberMatch = alert.message.match(/#([\w-]+)/);
    const orderNumber = orderNumberMatch ? orderNumberMatch[1] : 'N/A';
    const order = orders.find(o => o.orderNumber === orderNumber);
    
    if (!order || !order.assignedWorkshopIds || order.assignedWorkshopIds.length === 0) {
      window.alert(`La orden #${orderNumber} aún no tiene un taller vinculado.`);
      return;
    }

    const workshopId = order.assignedWorkshopIds[0];
    const workshop = workshops.find(w => w.id === workshopId);

    if (workshop) {
      const msg = `⚠️ *ALERTA DE PRIORIDAD ROXTOR* ⚠️\n\nHola ${workshop.name}, la orden *#${orderNumber}* presenta un retraso. Por Favor avísanos como va el pedido, para informarle al cliente . 🦖`;
      const cleanPhone = workshop.phone.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  // 2. Función para Notificar al Cliente
  const sendClientDelayNotification = (alert: RadarAlert) => {
    const orderNumberMatch = alert.message.match(/#([\w-]+)/);
    const orderNumber = orderNumberMatch ? orderNumberMatch[1] : 'N/A';
    
    const rawPhone = alert.customerPhone || orders.find(o => o.orderNumber === orderNumber)?.customerPhone;
    
    if (!rawPhone) {
      window.alert("No se encontró el teléfono del cliente.");
      return;
    }

    const cleanPhone = rawPhone.replace(/\D/g, '');
    const phone = cleanPhone.startsWith('58') ? cleanPhone : `58${cleanPhone}`;
    const msg = `Hola ${alert.customerName?.split(' ')[0] || 'Cliente'}, te informamos que tu pedido *#${orderNumber}* presenta un ligero retraso técnico. 🦖\n\nEstamos trabajando para entregarte lo antes posible con la calidad Roxtor. ¡Gracias por tu paciencia!`;
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-500">
      {/* Alertas del Radar AI */}
      {radarAlerts.filter(a => a.status === 'pending').length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-100 rounded-[2.5rem] p-8 animate-pulse mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-rose-900 italic uppercase tracking-tighter">ALERTAS CRÍTICAS RADAR AI</h3>
              <p className="text-rose-500 font-bold text-[10px] uppercase tracking-widest italic">Atención inmediata requerida</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {radarAlerts.filter(a => a.status === 'pending').map(alert => {
              const isWorkshopDelay = alert.message?.includes('DEMORA TALLER');
              const isOrderRequest = alert.type === 'order_request';
              
              return (
                <div key={alert.id} className="bg-white border border-rose-100 rounded-2xl p-6 flex flex-col md:flex-row justify-between gap-4 shadow-sm">
                  <div className="space-y-1 flex-1">
                    <p className="text-rose-600 font-black italic text-sm">{alert.message || alert.title}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase italic">
                      {alert.customerName || 'Cliente no identificado'} {alert.customerPhone ? `• ${alert.customerPhone}` : ''}
                    </p>
                    {isOrderRequest && alert.description && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[10px] text-slate-600 font-medium italic">{alert.description}</p>
                        {alert.metadata?.customerId && (
                          <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">C.I: {alert.metadata.customerId}</p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
                    {isWorkshopDelay ? (
                      <>
                        <button 
                          onClick={() => sendWorkshopDelayNotification(alert)} 
                          className="flex-1 md:flex-none bg-rose-600 text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase italic flex items-center justify-center gap-2 hover:bg-rose-700 transition-all"
                        >
                          <MessageCircle size={14} /> NOTIFICAR A TALLER
                        </button>
                        <button 
                          onClick={() => sendClientDelayNotification(alert)} 
                          className="flex-1 md:flex-none bg-[#004ea1] text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase italic flex items-center justify-center gap-2 hover:bg-blue-700 transition-all"
                        >
                          <MessageCircle size={14} /> NOTIFICAR AL CLIENTE
                        </button>
                        <button 
                          onClick={() => resolveAlert(alert.id, 'taller')} 
                          className="flex-1 md:flex-none bg-slate-100 text-slate-400 px-4 py-2 rounded-xl font-black text-[9px] uppercase italic hover:bg-slate-200 transition-all"
                        >
                          DESCARTAR
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => resolveAlert(alert.id, 'available')} 
                          className="flex-1 md:flex-none bg-emerald-500 text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase italic flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all"
                        >
                          <MessageCircle size={14} /> NOTIFICAR ESTATUS
                        </button>
                        <button 
                          onClick={() => resolveAlert(alert.id, 'taller')} 
                          className="flex-1 md:flex-none bg-blue-500 text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase italic flex items-center justify-center gap-2 hover:bg-blue-600 transition-all"
                        >
                          <DollarSign size={14} /> DAR PRESUPUESTO
                        </button>
                        <button 
                          onClick={() => resolveAlert(alert.id, 'taller')} 
                          className="flex-1 md:flex-none bg-slate-100 text-slate-400 px-4 py-2 rounded-xl font-black text-[9px] uppercase italic hover:bg-slate-200 transition-all"
                        >
                          DESCARTAR
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Control de Producción - BLOQUE BLINDADO */}
<div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
  <div className="flex items-center gap-4">
    <div className="w-2 h-8 bg-[#000814] rounded-full" />
    <h2 className="text-xl font-black text-[#000814] uppercase italic">Control de Producción</h2>
    
    {/* Este botón abre el modal que ya arreglamos antes */}
    <button 
      onClick={() => setShowWorkshopHistory(true)} 
      className="ml-4 px-4 py-2 bg-rose-500 text-white text-[9px] font-black uppercase italic rounded-xl flex items-center gap-2 hover:bg-rose-600 transition-all"
    >
      <Clock size={14} /> VER TRABAJOS EN TALLER
    </button>
  </div>

  <div className="flex items-center gap-3 bg-white border-2 border-slate-100 rounded-2xl px-5 py-3 shadow-sm">
    <Users size={16} className="text-slate-400" />
    <span className="text-[10px] font-black text-slate-400 uppercase italic">Filtrar Responsable:</span>
    
    <select 
      value={filterAgentId} 
      onChange={(e) => setFilterAgentId(e.target.value)} 
      className="text-[10px] font-black uppercase italic text-[#004ea1] bg-transparent outline-none cursor-pointer"
    >
      <option value="">TODOS LOS AGENTES</option>
      {/* SEGURO: Si Supabase aún no carga los agentes o vienen mal, el sistema no se rompe */}
      {(agents || []).length > 0 && agents.map(a => (
        <option key={a.id} value={a.id}>{a.name}</option>
      ))}
    </select>
  </div>
</div>

      <div className="space-y-16">
        {[{ row: 'Validación WEB', statuses: [{ id: 'Por Validar', label: 'Pagos por Validar' }] }, { row: 'Entrada y Maquila', statuses: [{ id: 'pendiente', label: 'Cola Pendiente' }, { id: 'taller', label: 'Maquila / Externo / Logística' }] }, { row: 'Estaciones de Trabajo', statuses: [{ id: 'diseño', label: 'Diseño Estación' }, { id: 'impresión', label: 'Impresión / Ploteo' }, { id: 'bordado', label: 'Área Bordados' }] }, { row: 'Acabados', statuses: [{ id: 'sublimación', label: 'Sublimación' }, { id: 'corte_vinil', label: 'Cortes Vinil' }, { id: 'planchado', label: 'Planchado Final' }] }].map((group, idx) => (
          <div key={idx} className="space-y-8">
            <div className="flex items-center gap-5"><span className="px-4 py-1.5 bg-[#000814] text-[9px] font-black text-white uppercase italic tracking-widest rounded-full">{group.row}</span><div className="h-px bg-slate-100 flex-1" /></div>
            <div className="flex overflow-x-auto no-scrollbar gap-6 pb-4">{group.statuses.map(s => <RenderColumn key={s.id} status={s.id as OrderStatus} label={s.label} />)}</div>
          </div>
        ))}
      </div>

      <div className="space-y-10 pt-20 border-t border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4"><div className="w-2 h-12 bg-emerald-500 rounded-full" /><h2 className="text-4xl font-black text-[#000814] uppercase italic tracking-tighter">Despacho y Entrega</h2></div>
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input type="text" placeholder="Buscar cliente..." className="pl-14 pr-8 py-5 bg-white border-2 border-slate-100 rounded-3xl text-xs font-black uppercase italic outline-none w-full md:w-80 shadow-sm" value={deliveryFilter} onChange={(e) => setDeliveryFilter(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {readyForDelivery.map(order => (
            <div key={order.id} className="bg-white border-2 border-slate-50 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all border-l-[12px] border-l-emerald-500 overflow-hidden flex flex-col h-full italic">
               <div className="mb-6">
                 <div className="flex justify-between items-start mb-3">
                   <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{order.customerName}</h5>
                   <div className={`px-3 py-1 rounded-xl text-[8px] font-black uppercase italic ${order.restanteUsd > 0 ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-emerald-100 text-emerald-600'}`}>{order.restanteUsd > 0 ? 'DEUDA PENDIENTE' : 'SOLVENTE'}</div>
                 </div>
                 <p className="text-5xl font-black text-[#000814] tracking-tighter mb-3">#{order.orderNumber}</p>
                 
                 {order.restanteUsd > 0 && (
                   <div className="bg-rose-600 text-white text-[9px] font-black p-3 rounded-2xl text-center animate-pulse mt-2 border-b-4 border-rose-800">
                     ⚠️ NO ENTREGAR SIN COBRAR SALDO
                   </div>
                 )}
               </div>
                <div className="mt-auto space-y-4">
                  <div className={`flex justify-between items-center p-6 rounded-[2rem] border-2 ${order.restanteUsd > 0 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}><span className="text-[10px] font-black text-slate-400 uppercase">SALDO:</span><span className={`text-3xl font-black ${order.restanteUsd > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>${order.restanteUsd.toFixed(2)}</span></div>
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <button 
  onClick={async () => {
    const res = await sendOrderNotification(order, 'listo', settings);
    
    if (!res || !res.success) {
      const phone = order.customerPhone.replace(/\D/g, '').startsWith('58') ? order.customerPhone.replace(/\D/g, '') : `58${order.customerPhone.replace(/\D/g, '')}`;
      const montoBs = (order.restanteUsd * settings.bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2 });
      
      // Construcción del mensaje condicional
      let msg = `✅ *Te escribimos desde ROXTOR: ¡TU PEDIDO ESTÁ LISTO!* \n\nHola ${order.customerName.split(' ')[0]}, tu orden *#${order.orderNumber}* ya está listo para ser Retirado. 🦖`;
      
      if (order.restanteUsd > 0) {
        msg += `\n\n📌 *Nota:* Presenta un saldo de *$${order.restanteUsd.toFixed(2)}* (${montoBs} Bs. Tasa BCV: ${settings.bcvRate}).`;
      }
      
      msg += `\n\n¡Favor realiza el pago y envia soporte para su revision, Te esperamos!`;
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    }
  }} 
  className="bg-emerald-500 text-white py-4 rounded-[1.5rem] font-black text-[9px] uppercase tracking-widest italic border-b-4 border-emerald-700 active:translate-y-1 flex items-center justify-center gap-2"
>
  <MessageCircle size={16}/> NOTIFICAR
</button>
                      <button onClick={() => setSelectedOrderForPrint(order)} className="bg-blue-500 text-white py-4 rounded-[1.5rem] font-black text-[9px] uppercase tracking-widest italic border-b-4 border-blue-700 active:translate-y-1 flex items-center justify-center gap-2">
                        <FileText size={16}/> RECIBO
                      </button>
                    </div>
                    
                    {order.restanteUsd > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => {
                            setPaymentModalOrder(order);
                            setPaymentData({
                              amount: order.restanteUsd,
                              amountBs: order.restanteUsd * settings.bcvRate,
                              method: 'DOLARES $',
                              reference: ''
                            });
                          }}
                          className="py-4 bg-rose-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest italic border-b-4 border-rose-800 active:translate-y-1 flex items-center justify-center gap-2 transition-all"
                        >
                          <DollarSign size={16}/> COBRAR
                        </button>
                        <button 
  onClick={async () => {
    const res = await sendOrderNotification(order, 'cobranza', settings);
    
    if (!res || !res.success) {
      const phone = order.customerPhone.replace(/\D/g, '').startsWith('58') ? order.customerPhone.replace(/\D/g, '') : `58${order.customerPhone.replace(/\D/g, '')}`;
      const montoBs = (order.restanteUsd * settings.bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2 });
      
      const msg = `⏳ *Te escribimos desde ROXTOR: RECORDATORIO DE PAGO* \n\nHola ${order.customerName.split(' ')[0]}, recordamos que tu orden *#${order.orderNumber}* tiene un saldo pendiente de *$${order.restanteUsd.toFixed(2)}* (${montoBs} Bs).\n\n Por Favor realiza tu pago y envia reportar tu pago al *4249635252*. 🦖\n\n*Roxtor Soluciones Creativas*`;
      
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    }
  }}
  className="py-4 bg-amber-500 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest italic border-b-4 border-amber-700 active:translate-y-1 flex items-center justify-center gap-2 transition-all"
>
  <Bell size={16}/> RECORDAR
</button>
                      </div>
                    )}

                    <button 
                      onClick={() => {
                        setDispatchPaymentModal(order);
                        setDispatchPaymentData({
                          amountUsd: order.restanteUsd,
                          amountBs: order.restanteUsd * settings.bcvRate,
                          method: 'DOLARES $',
                          reference: ''
                        });
                      }} 
                      className={`w-full py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest italic border-b-4 active:translate-y-1 flex items-center justify-center gap-3 transition-all ${order.restanteUsd > 0 ? 'bg-[#000814] text-white border-slate-800 hover:bg-slate-900' : 'bg-emerald-600 text-white border-emerald-800 hover:bg-emerald-700'}`}
                    >
                      {order.restanteUsd > 0 ? (
                        <><PackageCheck size={18}/> COBRAR Y DESPACHAR</>
                      ) : (
                        <><PackageCheck size={18}/> FINALIZAR DESPACHO</>
                      )}
                    </button>
                  </div>
               </div>
            </div>
          ))}
        </div>
      </div>

      {transferModalOrder && (
        <div className="fixed inset-0 z-[200] bg-[#000814]/90 backdrop-blur-xl flex items-center justify-center p-6 italic">
          <div className="bg-white w-full max-w-md rounded-[4rem] p-10 shadow-2xl space-y-8 animate-in zoom-in-95">
            <div className="flex justify-between items-center">
              <h4 className="text-2xl font-black uppercase italic tracking-tighter text-[#000814]">Recibir y Reasignar</h4>
              <button onClick={() => setTransferModalOrder(null)}><X size={28}/></button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase italic ml-1">Fase Siguiente de Producción:</label>
                <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 text-xs font-black uppercase italic outline-none" value={transferData.nextStatus} onChange={(e) => setTransferData({...transferData, nextStatus: e.target.value as OrderStatus})}>
                  <option value="pendiente">COLA DE ESPERA</option><option value="diseño">ESTACIÓN DE DISEÑO</option><option value="impresión">PLOTEO / IMPRESIÓN</option><option value="bordado">BORDADOS</option><option value="sublimación">SUBLIMACIÓN</option><option value="corte_vinil">CORTE VINIL</option><option value="planchado">PLANCHADO FINAL</option><option value="completado">MARCAR LISTO / DESPACHO</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-rose-600 uppercase italic ml-1">Nuevo Agente Encargado *</label>
                <select className="w-full bg-rose-50/30 border-2 border-rose-100 rounded-2xl p-5 text-xs font-black uppercase italic outline-none" value={transferData.agentId} onChange={(e) => setTransferData({...transferData, agentId: e.target.value})}>
                  <option value="">-- SELECCIONAR AGENTE --</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.name} ({a.role})</option>)}
                </select>
                <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase italic ml-1">Recibes de taller y entregas la tarea a este compañero.</p>
              </div>
            </div>
            <button 
              onClick={handleTransferPhase} 
              disabled={!transferData.agentId}
              className="w-full bg-[#000814] text-white py-6 rounded-[2.5rem] font-black uppercase shadow-2xl hover:bg-blue-600 italic text-xs tracking-widest border-b-8 border-slate-900 active:translate-y-1 transition-all disabled:opacity-30"
            >
              CONFIRMAR REASIGNACIÓN <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

     {showWorkshopHistory && (
  <div className="fixed inset-0 z-[250] bg-[#000814]/95 backdrop-blur-2xl flex items-center justify-center p-6 italic">
    <div className="bg-white w-full max-w-4xl rounded-[4rem] p-10 shadow-2xl space-y-8 animate-in zoom-in-95 flex flex-col max-h-[90vh]">
      <div className="flex justify-between items-center border-b border-slate-100 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg">
            <Clock size={24} />
          </div>
          <div>
            <h4 className="text-2xl font-black uppercase italic tracking-tighter text-[#000814]">Trabajos en Talleres Externos</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase italic">Historial de órdenes en proceso de confección / maquila</p>
          </div>
        </div>
        <button onClick={() => setShowWorkshopHistory(false)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-red-500 transition-all">
          <X size={24}/>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-2">
        {/* SEGURO 1: Blindaje de orders */}
        {(orders || []).filter(o => o?.taskStatus === 'confeccion').length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
              <Activity size={40} />
            </div>
            <p className="text-xs font-black text-slate-300 uppercase italic tracking-widest">No hay trabajos activos en talleres externos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(orders || []).filter(o => o?.taskStatus === 'confeccion').map(order => {
              const safeHistory = order?.history || [];
              const lastWorkshopAction = [...safeHistory].reverse().find(h => h.action?.includes('Enviado a taller'));
              
              return (
                <div key={order.id} className="bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] p-6 hover:border-rose-200 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase italic tracking-widest leading-none mb-1">{order.customerName}</p>
                      <h5 className="text-2xl font-black text-[#000814] italic tracking-tighter">#{order.orderNumber}</h5>
                    </div>
                    <div className="bg-rose-100 text-rose-600 px-3 py-1 rounded-xl text-[8px] font-black uppercase italic animate-pulse">
                      EN TALLER
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-slate-500">
                      <Warehouse size={14} className="text-rose-500" />
                      <p className="text-[10px] font-black uppercase italic">
                        {lastWorkshopAction?.action?.split(': ')[1] || 'Taller Desconocido'}
                      </p>
                    </div>
                    
                    {lastWorkshopAction?.action?.includes('Notas:') && (
                      <div className="bg-white p-3 rounded-2xl border border-slate-200">
                        <p className="text-[8px] font-black text-slate-400 uppercase italic mb-1">Especificaciones:</p>
                        <p className="text-[10px] font-bold text-slate-700 italic">
                          {lastWorkshopAction.action.split('Notas: ')[1]}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock size={12} />
                        <span className="text-[9px] font-black uppercase italic">
                          {lastWorkshopAction?.timestamp
                            ? new Date(lastWorkshopAction.timestamp).toLocaleDateString()
                            : 'Sin fecha'}
                        </span>
                      </div>

                      <button 
                        onClick={() => handleReceiveFromWorkshop(order)}
                        className="px-4 py-2 bg-[#000814] text-white text-[8px] font-black uppercase italic rounded-xl hover:bg-rose-500 transition-all"
                      >
                        RECIBIR
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  </div>
)}
                
{finalDesignModal && (
  <div className="fixed inset-0 z-[300] bg-[#000814]/90 backdrop-blur-xl flex items-center justify-center p-6 italic">
    <div className="bg-white w-full max-w-md rounded-[4rem] p-10 shadow-2xl space-y-8 animate-in zoom-in-95">
      <div className="flex justify-between items-center">
        <h4 className="text-2xl font-black uppercase italic tracking-tighter text-[#000814]">Diseño Final</h4>
        <button onClick={() => setFinalDesignModal(null)}><X size={28}/></button>
      </div>
      
      <div className="space-y-6">
        {finalDesignModal.finalDesignUrl ? (
          <div className="space-y-4">
            <div className="aspect-square w-full rounded-3xl overflow-hidden border-4 border-emerald-100 shadow-inner bg-slate-50 relative group">
              <img src={finalDesignModal.finalDesignUrl} className="w-full h-full object-contain" alt="Diseño Final" />
              <button 
                onClick={() => handleDeleteFinalDesign(finalDesignModal.id)}
                className="absolute top-4 right-4 p-3 bg-rose-500 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                title="Eliminar Diseño Final"
              >
                <Trash2 size={20} />
              </button>
            </div>
            <p className="text-[10px] font-black text-emerald-600 uppercase italic text-center">DISEÑO CARGADO Y OPTIMIZADO</p>
          </div>
        ) : (
          <div className="py-12 border-4 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center space-y-4 text-slate-300">
            <Palette size={64} />
            <p className="text-xs font-black uppercase italic">Sin diseño cargado</p>
          </div>
        )}

        <div className="space-y-4">
          <label className="block w-full">
            <span className="sr-only">Elegir archivo</span>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => handleUploadFinalDesign(e, finalDesignModal)}
              disabled={isUploadingDesign}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-4 file:px-8 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:italic file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all cursor-pointer"
            />
          </label>
          {isUploadingDesign && (
            <div className="flex items-center justify-center gap-3 text-blue-600 animate-pulse">
              <Loader2 className="animate-spin" size={20} />
              <span className="text-[10px] font-black uppercase italic">Optimizando y subiendo...</span>
            </div>
          )}
        </div>
      </div>

      <div className="pt-4">
        <button 
          onClick={() => {
            const msg = `🎨 *ROXTOR: TU DISEÑO ESTÁ LISTO* \n\nHola ${finalDesignModal.customerName.split(' ')[0]}, adjunto el diseño final de tu orden *${finalDesignModal.orderNumber}* para tu revisión.\n\nFavor confirmar si todo está correcto para proceder con la producción.`;
            window.open(`https://wa.me/${finalDesignModal.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
          }}
          disabled={!finalDesignModal.finalDesignUrl}
          className="w-full bg-[#000814] text-white py-6 rounded-[2.5rem] font-black uppercase shadow-2xl hover:bg-emerald-600 italic text-xs tracking-widest border-b-8 border-slate-900 active:translate-y-1 transition-all disabled:opacity-30 flex items-center justify-center gap-3"
        >
          <MessageCircle size={18} /> ENVIAR POR WHATSAPP
        </button>
      </div>
    </div>
  </div>
)}

{selectedOrderForPrint && (
<OrderReceipt 
  order={selectedOrderForPrint} 
  settings={settings} 
  workshops={workshops}
  onClose={() => setSelectedOrderForPrint(null)} 
/>
)}

{designSpecsModal && (
<div className="fixed inset-0 z-[300] bg-[#000814]/95 backdrop-blur-2xl flex items-center justify-center p-6 italic">
  <div className="bg-white w-full max-w-2xl rounded-[4rem] p-10 shadow-2xl space-y-8 animate-in zoom-in-95 flex flex-col max-h-[90vh]">
    {/* ... Contenido del modal ... */}
    <div className="pt-6 border-t border-slate-100">
      <button 
        onClick={() => setDesignSpecsModal(null)}
        className="w-full bg-[#000814] text-white py-6 rounded-[2.5rem] font-black uppercase italic text-xs tracking-widest border-b-8 border-slate-900"
      >
        CERRAR Y GUARDAR CAMBIOS
      </button>
    </div>
  </div>
</div>
)}

      {/* --- MODALES DE PROTOCOLO Y TALLER --- */}
      {checklistModal && (
        <div className="fixed inset-0 z-[400] bg-[#000814]/95 backdrop-blur-2xl flex items-center justify-center p-6 italic">
          <div className="bg-white w-full max-w-2xl rounded-[4rem] p-10 shadow-2xl space-y-8 animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-slate-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <CheckSquare size={24} />
                </div>
                <div>
                  <h4 className="text-2xl font-black uppercase italic tracking-tighter text-[#000814]">Validación de Protocolo</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase italic">Orden #{checklistModal.order.orderNumber} - {DEPARTMENT_CHECKLISTS.find(d => d.id === checklistModal.deptId)?.name}</p>
                </div>
              </div>
              <button onClick={() => setChecklistModal(null)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-red-500 transition-all">
                <X size={24}/>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 pr-2">
              <div className="bg-amber-50 border-2 border-amber-100 p-6 rounded-3xl flex items-start gap-4">
                <AlertCircle className="text-amber-500 shrink-0" size={24} />
                <p className="text-[10px] font-bold text-amber-800 uppercase italic leading-relaxed">
                  Para avanzar en el flujo, debe confirmar que ha cumplido con los siguientes pasos de calidad. Esto impacta su Índice de Disciplina Operativa.
                </p>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => setChecklistProgress(prev => ({ ...prev, 'all-steps': !prev['all-steps'] }))}
                  className={`w-full flex items-center gap-6 p-8 rounded-[3rem] border-2 transition-all text-left ${
                    checklistProgress['all-steps'] 
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                      : 'bg-slate-50 border-transparent text-slate-500 hover:border-slate-100'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all ${
                    checklistProgress['all-steps'] ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 bg-white'
                  }`}>
                    {checklistProgress['all-steps'] && <CheckCircle2 size={24} />}
                  </div>
                  <span className="text-sm font-black uppercase leading-tight italic tracking-tight">
                    He cumplido con los pasos requeridos para la máxima eficiencia de la operatividad
                  </span>
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex gap-4">
              <button 
                onClick={() => setChecklistModal(null)}
                className="flex-1 bg-slate-100 text-slate-400 py-6 rounded-[2.5rem] font-black uppercase italic text-xs tracking-widest"
              >
                CANCELAR
              </button>
              <button 
                onClick={() => {
                  if (!checklistProgress['all-steps']) {
                    alert("⚠️ DEBE CONFIRMAR EL CUMPLIMIENTO DE LOS PASOS.");
                    return;
                  }
                  checklistModal.onComplete();
                  setChecklistModal(null);
                }}
                className={`flex-[2] py-6 rounded-[2.5rem] font-black uppercase italic text-xs tracking-widest border-b-8 shadow-xl transition-all ${
                  checklistProgress['all-steps']
                  ? 'bg-[#000814] text-white border-slate-800 hover:bg-emerald-600'
                  : 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed'
                }`}
              >
                CONFIRMAR Y CONTINUAR
              </button>
            </div>
          </div>
        </div>
      )}

      {workshopAssignModal && (
        <div className="fixed inset-0 z-[160] bg-[#000814]/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[4rem] p-10 shadow-2xl space-y-8 animate-in zoom-in-95">
            <div className="flex justify-between items-center"><div className="flex items-center gap-3 text-[#004ea1]"><Warehouse size={28}/><h4 className="text-2xl font-black uppercase italic tracking-tighter text-[#000814]">Vincular Taller</h4></div><button onClick={() => setWorkshopAssignModal(null)}><X size={28}/></button></div>
            <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-2">{workshops.map(w => (<button key={w.id} onClick={() => handleWorkshopAssignment(w)} className="w-full p-6 bg-slate-50 border-2 rounded-[2.5rem] hover:border-[#004ea1] hover:bg-white flex items-center justify-between group shadow-sm transition-all text-left"><div><p className="font-black text-[#000814] uppercase text-sm italic">{w.name}</p><p className="text-[10px] font-bold text-slate-400 uppercase italic tracking-widest">{w.department}</p></div><ChevronRight className="text-slate-300 group-hover:text-[#004ea1]" size={24} /></button>))}</div>
          </div>
        </div>
      )}

      {sewingFormModal && (
        <div className="fixed inset-0 z-[170] bg-[#000814]/95 backdrop-blur-2xl flex items-center justify-center p-4 overflow-y-auto italic">
           <div className="bg-white w-full max-w-2xl rounded-[4rem] p-10 shadow-2xl space-y-8 border-8 border-white/10 my-auto animate-in slide-in-from-bottom-10">
              <div className="flex justify-between items-start border-b border-slate-100 pb-6"><div><h4 className="text-2xl font-black text-[#000814] uppercase italic tracking-tighter">Producción Textil</h4><p className="text-[10px] font-bold text-slate-400 uppercase italic">Taller: {sewingFormModal.workshop.name}</p></div><button onClick={() => setSewingFormModal(null)} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-red-500 transition-all"><X size={20}/></button></div>
              <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 italic">Producto</label><select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-xs font-black uppercase italic outline-none" value={sewingData.productName} onChange={(e) => setSewingData({...sewingData, productName: e.target.value, isManualProduct: e.target.value === 'MANUAL'})}><option value="MANUAL">-- ITEM PERSONALIZADO --</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>{sewingData.isManualProduct && <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 italic">Nombre Manual</label><input type="text" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-xs font-black uppercase italic outline-none" value={sewingData.manualProductName} onChange={(e) => setSewingData({...sewingData, manualProductName: e.target.value})} /></div>}</div>
                 <div className="space-y-4 bg-slate-50/50 p-6 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                    <div className="flex justify-between items-center mb-2"><label className="text-[10px] font-black uppercase text-slate-400 italic">Curva de Tallas</label><button onClick={() => setSewingData({...sewingData, genderSelections: [...sewingData.genderSelections, { gender: 'DAMA', quantity: 1, size: 'S' }]})} className="bg-[#004ea1] text-white p-2.5 rounded-xl font-black text-[10px] uppercase italic shadow-lg">+ AÑADIR</button></div>
                    <div className="space-y-3">{sewingData.genderSelections.map((item, idx) => (<div key={idx} className="flex gap-3"><select className="flex-1 bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-[10px] font-black uppercase italic" value={item.gender} onChange={(e) => { const updated = [...sewingData.genderSelections]; updated[idx].gender = e.target.value; setSewingData({...sewingData, genderSelections: updated}); }}>{GENDER_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select><select className="w-24 bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-[10px] font-black uppercase italic" value={item.size} onChange={(e) => { const updated = [...sewingData.genderSelections]; updated[idx].size = e.target.value; setSewingData({...sewingData, genderSelections: updated}); }}>{TALLAS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select><input type="number" className="w-20 bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-[10px] font-black" value={item.quantity} onChange={(e) => { const updated = [...sewingData.genderSelections]; updated[idx].quantity = parseInt(e.target.value) || 1; setSewingData({...sewingData, genderSelections: updated}); }} /><button onClick={() => setSewingData({...sewingData, genderSelections: sewingData.genderSelections.filter((_, i) => i !== idx)})} className="p-3 text-slate-300 hover:text-red-500"><Trash2 size={16}/></button></div>))}</div>
                 </div>
                 <div className="grid grid-cols-2 gap-6"><div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 italic">Color Prenda</label><input type="text" className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-xs font-black uppercase italic" value={sewingData.color} onChange={(e) => setSewingData({...sewingData, color: e.target.value})} /></div><div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 italic">Tipo Tela</label><input type="text" className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-xs font-black uppercase italic" value={sewingData.fabricType} onChange={(e) => setSewingData({...sewingData, fabricType: e.target.value})} /></div></div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 italic">Notas / Especificaciones Adicionales</label>
                    <textarea 
                      className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-xs font-black uppercase italic min-h-[100px] outline-none focus:bg-white focus:border-blue-100 transition-all" 
                      placeholder="Ej: Bordado en pecho izquierdo, hilos dorados..."
                      value={sewingData.observations} 
                      onChange={(e) => setSewingData({...sewingData, observations: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 italic">Imagen de Referencia (Mockup/Paño)</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="file" 
                        accept="image/*"
                        className="hidden" 
                        id="workshop-ref-sewing"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setSewingData({...sewingData, referenceImage: reader.result as string});
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <label htmlFor="workshop-ref-sewing" className="flex-1 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all">
                        {sewingData.referenceImage ? (
                          <div className="relative w-full aspect-video">
                            <img src={sewingData.referenceImage} className="w-full h-full object-contain rounded-xl" />
                            <button onClick={(e) => { e.preventDefault(); setSewingData({...sewingData, referenceImage: ''}); }} className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full"><X size={14}/></button>
                          </div>
                        ) : (
                          <>
                            <ImagePlus className="text-slate-300 mb-2" size={32} />
                            <span className="text-[9px] font-black text-slate-400 uppercase italic">Subir Referencia Técnica</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                  <button onClick={sendSewingWhatsApp} className="w-full bg-[#000814] text-white py-6 rounded-[2.5rem] font-black uppercase text-[11px] flex items-center justify-center gap-4 italic shadow-2xl border-b-8 border-slate-900 active:translate-y-1"><MessageCircle size={22} className="text-emerald-400" /> ENVIAR SOLICITUD A TALLER</button>
              </div>
           </div>
        </div>
      )}

      {/* --- MODAL MAQUILA GENERAL --- */}
      {generalWorkshopModal && (
        <div className="fixed inset-0 z-[170] bg-[#000814]/95 backdrop-blur-2xl flex items-center justify-center p-4 overflow-y-auto italic">
           <div className="bg-white w-full max-w-xl rounded-[4rem] p-10 shadow-2xl space-y-8 border-8 border-white/10 my-auto animate-in slide-in-from-bottom-10">
              <div className="flex justify-between items-start border-b border-slate-100 pb-6">
                <div>
                  <h4 className="text-2xl font-black text-[#000814] uppercase italic tracking-tighter">Maquila: {generalWorkshopModal.workshop.department}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase italic">Taller: {generalWorkshopModal.workshop.name}</p>
                </div>
                <button onClick={() => setGeneralWorkshopModal(null)} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-red-500 transition-all">
                  <X size={20}/>
                </button>
              </div>

              <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 italic">Producto</label>
                      <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-xs font-black uppercase italic outline-none" value={generalWorkshopData.productName} onChange={(e) => setGeneralWorkshopData({...generalWorkshopData, productName: e.target.value, isManualProduct: e.target.value === 'MANUAL'})}>
                        <option value="MANUAL">-- ITEM PERSONALIZADO --</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    {generalWorkshopData.isManualProduct && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 italic">Descripción Manual</label>
                        <input type="text" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-xs font-black uppercase italic outline-none" value={generalWorkshopData.manualProductName} onChange={(e) => setGeneralWorkshopData({...generalWorkshopData, manualProductName: e.target.value})} />
                      </div>
                    )}
                 </div>

                 <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 italic">Cantidad</label>
                      <input type="number" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-xs font-black" value={generalWorkshopData.quantity} onChange={(e) => setGeneralWorkshopData({...generalWorkshopData, quantity: parseInt(e.target.value) || 1})} />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 italic">Especificaciones</label>
                      <input type="text" placeholder="Ej: Vinil Glitter / UV Print" className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-xs font-black uppercase italic" value={generalWorkshopData.specifications} onChange={(e) => setGeneralWorkshopData({...generalWorkshopData, specifications: e.target.value})} />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 italic">Imagen de Referencia</label>
                    <div className="flex items-center gap-4">
                      <input type="file" accept="image/*" className="hidden" id="workshop-ref-general" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setGeneralWorkshopData({...generalWorkshopData, referenceImage: reader.result as string});
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <label htmlFor="workshop-ref-general" className="flex-1 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all">
                        {generalWorkshopData.referenceImage ? (
                          <div className="relative w-full aspect-video">
                            <img src={generalWorkshopData.referenceImage} className="w-full h-full object-contain rounded-xl" />
                            <button onClick={(e) => { e.preventDefault(); setGeneralWorkshopData({...generalWorkshopData, referenceImage: ''}); }} className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full"><X size={14}/></button>
                          </div>
                        ) : (
                          <>
                            <ImagePlus className="text-slate-300 mb-2" size={32} />
                            <span className="text-[9px] font-black text-slate-400 uppercase italic">Subir Referencia Técnica</span>
                          </>
                        )}
                      </label>
                    </div>
                 </div>
                 <button onClick={sendGeneralWorkshopWhatsApp} className="w-full bg-[#000814] text-white py-6 rounded-[2.5rem] font-black uppercase flex items-center justify-center gap-4 italic shadow-2xl border-b-8 border-slate-900 active:translate-y-1">
                   <MessageCircle size={22} className="text-emerald-400" /> ENVIAR PEDIDO A TALLER
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* --- OTROS MODALES (GALERÍA, DESPACHO, PAGOS) --- */}
      {imageGalleryModal && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col p-8 animate-in fade-in italic">
          <div className="flex justify-between items-center mb-10">
            <div className="space-y-1">
              <h4 className="text-white text-2xl font-black uppercase italic tracking-tighter">Archivo de Referencia</h4>
              <p className="text-slate-500 text-xs font-bold uppercase italic">Orden #{imageGalleryModal.orderNumber}</p>
            </div>
            <button onClick={() => setImageGalleryModal(null)} className="p-2"><X size={32} className="text-white hover:text-red-500"/></button>
          </div>
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-10 overflow-y-auto no-scrollbar p-6">
            {imageGalleryModal.referenceImages.map((img, i) => (
              <div key={i} className="aspect-square rounded-[4rem] overflow-hidden border-8 border-white/10 relative group shadow-2xl">
                <img src={img} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm gap-4">
                  <a href={img} download={`REF_${imageGalleryModal.orderNumber}_${i + 1}.png`} className="p-4 bg-white/10 rounded-full hover:bg-white/20 transition-all text-white">
                    <Download size={32} />
                  </a>
                  <button onClick={() => handleDeleteReferenceImage(imageGalleryModal.id, i)} className="p-4 bg-rose-500/20 rounded-full hover:bg-rose-500 transition-all text-white">
                    <Trash2 size={32} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {dispatchPaymentModal && (
        <div className="fixed inset-0 z-[200] bg-[#000814]/90 backdrop-blur-xl flex items-center justify-center p-6 italic">
          <div className="bg-white w-full max-w-md rounded-[4rem] p-10 shadow-2xl space-y-8 animate-in zoom-in-95">
            <div className="flex justify-between items-center">
              <h4 className="text-2xl font-black uppercase italic tracking-tighter text-[#000814]">Registro de Despacho</h4>
              <button onClick={() => setDispatchPaymentModal(null)}><X size={28}/></button>
            </div>
            <div className="space-y-6">
              <div className="bg-emerald-50 p-6 rounded-3xl border-2 border-emerald-100 text-center">
                <p className="text-[10px] font-black text-emerald-600 uppercase italic mb-1">Saldo a Cancelar</p>
                <p className="text-4xl font-black text-[#000814] italic tracking-tighter">${dispatchPaymentModal.restanteUsd.toFixed(2)}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Monto $" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xs font-black" value={dispatchPaymentData.amountUsd} onChange={(e) => setDispatchPaymentData({...dispatchPaymentData, amountUsd: parseFloat(e.target.value) || 0, amountBs: (parseFloat(e.target.value) || 0) * settings.bcvRate})} />
                <input type="number" placeholder="Monto Bs" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xs font-black" value={dispatchPaymentData.amountBs} onChange={(e) => setDispatchPaymentData({...dispatchPaymentData, amountBs: parseFloat(e.target.value) || 0, amountUsd: (parseFloat(e.target.value) || 0) / settings.bcvRate})} />
              </div>
              <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 text-xs font-black uppercase italic" value={dispatchPaymentData.method} onChange={(e) => setDispatchPaymentData({...dispatchPaymentData, method: e.target.value as any})}>
                  <option value="DOLARES $">DOLARES $</option>
                  <option value="PAGO MOVIL">PAGO MOVIL</option>
                  <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                  <option value="EFECTIVO">EFECTIVO</option>
              </select>
              <input type="text" placeholder="REFERENCIA" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 text-xs font-black uppercase" value={dispatchPaymentData.reference} onChange={(e) => setDispatchPaymentData({...dispatchPaymentData, reference: e.target.value})} />
            </div>
            <button onClick={handleApplyDispatchPayment} className="w-full bg-emerald-600 text-white py-6 rounded-[2.5rem] font-black uppercase shadow-2xl border-b-8 border-emerald-800 active:translate-y-1 transition-all">
              FINALIZAR Y DESPACHAR <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {paymentModalOrder && (
        <div className="fixed inset-0 z-[200] bg-[#000814]/90 backdrop-blur-xl flex items-center justify-center p-6 italic">
          <div className="bg-white w-full max-w-md rounded-[4rem] p-10 shadow-2xl space-y-8 animate-in zoom-in-95">
            <div className="flex justify-between items-center">
              <h4 className="text-2xl font-black uppercase italic tracking-tighter text-[#000814]">Registrar Abono</h4>
              <button onClick={() => setPaymentModalOrder(null)}><X size={28}/></button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="Monto $" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 text-xs font-black" value={paymentData.amount || ''} onChange={(e) => setPaymentData({...paymentData, amount: parseFloat(e.target.value) || 0, amountBs: (parseFloat(e.target.value) || 0) * settings.bcvRate})} />
                  <input type="number" placeholder="Monto Bs" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 text-xs font-black" value={paymentData.amountBs || ''} onChange={(e) => setPaymentData({...paymentData, amountBs: parseFloat(e.target.value) || 0, amount: (parseFloat(e.target.value) || 0) / settings.bcvRate})} />
              </div>
              <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 text-xs font-black uppercase italic" value={paymentData.method} onChange={(e) => setPaymentData({...paymentData, method: e.target.value as any})}>
                  <option value="DOLARES $">DOLARES $</option>
                  <option value="PAGO MOVIL">PAGO MOVIL</option>
                  <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                  <option value="EFECTIVO">EFECTIVO</option>
              </select>
              <input type="text" placeholder="REFERENCIA" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 text-xs font-black uppercase" value={paymentData.reference} onChange={(e) => setPaymentData({...paymentData, reference: e.target.value})} />
            </div>
            <button onClick={handleApplyPayment} className="w-full bg-[#000814] text-white py-6 rounded-[2.5rem] font-black uppercase shadow-2xl border-b-8 border-slate-900 active:translate-y-1 transition-all">
              CONFIRMAR PAGO <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div> 
  ); 
};

export default Workflow;
