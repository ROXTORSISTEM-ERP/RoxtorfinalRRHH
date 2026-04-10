import React, { useState, useMemo, useRef } from 'react';
import { Product, Order, AppSettings, Agent, ServiceOrderItem, OrderStatus, Workshop, DesignSpecs, TaskStatus } from '../types';
import { sendOrderNotification } from '../services/whatsappService';
import { 
  User, 
  Hash, 
  Calendar, 
  ShoppingCart, 
  DollarSign, 
  FileText, 
  Camera, 
  Plus, 
  Trash2, 
  Save, 
  Search,
  MapPin,
  CreditCard,
  Ticket,
  Layers,
  AlertCircle,
  ImageIcon,
  X,
  UploadCloud,
  Zap,
  RefreshCw,
  ArrowRight,
  CheckCircle,
  Palette,
  Layout,
  Type,
  Scissors,
  Users,
  CheckSquare,
  ShieldCheck,
  Globe,
  MessageCircle
} from 'lucide-react';
import { DEPARTMENT_CHECKLISTS } from './Checklists';

interface Props {
  products: Product[];
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  agents: Agent[];
  workshops: Workshop[];
  currentStoreId: string;
  currentAgentId?: string | null;
  onSave: (order: Order) => void;
}

const ServiceOrderForm: React.FC<Props> = ({ products, settings, setSettings, agents, workshops, currentStoreId, currentAgentId, onSave }) => {
  const [customer, setCustomer] = useState({ name: '', ci: '', phone: '' });
  const [customerType, setCustomerType] = useState<'B2B' | 'B2C'>('B2C');
  const [dates, setDates] = useState({
    issue: new Date().toISOString().split('T')[0],
    delivery: ''
  });
  const [assignedWorkshopName, setAssignedWorkshopName] = useState('');
  const [orderItems, setOrderItems] = useState<ServiceOrderItem[]>([]);
  const [manualItem, setManualItem] = useState({ name: '', quantity: '1', priceUsd: '', priceBs: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [financials, setFinancials] = useState({ 
    abonoUsd: '', 
    abonoBs: '',
    paymentMethod: 'DOLARES $' as Order['paymentMethod'],
    paymentReference: ''
  });
  const [technicalDetails, setTechnicalDetails] = useState('');
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [assignedAgentId, setAssignedAgentId] = useState('');
  const [assignedWorkshopIds, setAssignedWorkshopIds] = useState<string[]>([]);
  const [initialStatus, setInitialStatus] = useState<OrderStatus>('pendiente');
  const [isLogistics, setIsLogistics] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState(currentStoreId);
  const [showDesignForm, setShowDesignForm] = useState(false);
  const [designSpecs, setDesignSpecs] = useState<DesignSpecs>({
    colors: '',
    position: '',
    personalizationName: '',
    personalizationLocation: '',
    threadOrDesignColors: '',
    additionalBackDesign: '',
    additionalSpecs: '',
    isApprovedByClient: false
  });
  const [currentStep, setCurrentStep] = useState<'main' | 'assignment' | 'checklist'>('main');
  const [savedOrderData, setSavedOrderData] = useState<Order | null>(null);
  const [checklistProgress, setChecklistProgress] = useState<Record<string, boolean>>({});
  const [sewingData, setSewingData] = useState({
    genderSelections: [{ gender: 'CABALLERO', size: 'M', quantity: 1 }],
    color: '',
    fabricType: ''
  });

  // 2. OPCIONES PARA LOS SELECTORES
  const GENDER_OPTIONS = ['CABALLERO', 'DAMA', 'NIÑO', 'NIÑA', 'UNISEX'];
  const TALLAS_OPTIONS = ['2', '4', '6', '8', '10', '12', '14', '16', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

  // Debajo de tus otros useState
const [orderGenerated, setOrderGenerated] = useState(false);
  
  const imageInputRef = useRef<HTMLInputElement>(null);

  const selectedStore = settings.stores.find(s => s.id === selectedStoreId) || settings.stores[0];

  const filteredProducts = useMemo(() => 
    products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())),
  [products, searchQuery]);

  const totalUsd = useMemo(() => 
    orderItems.reduce((acc, item) => acc + (Number(item.priceUsd) * Number(item.quantity)), 0),
  [orderItems]);

  const totalCommissionsUsd = useMemo(() => 
    orderItems.reduce((acc, item) => acc + (item.embroideryCommissionUsd || 0), 0),
  [orderItems]);

  const totalCostUsd = useMemo(() => 
    orderItems.reduce((acc, item) => acc + ((item.costUsd || 0) * Number(item.quantity)), 0),
  [orderItems]);

  const expectedUtilityUsd = totalUsd - totalCostUsd;
  const utilityMargin = totalUsd > 0 ? (expectedUtilityUsd / totalUsd) * 100 : 0;

  const totalBs = totalUsd * settings.bcvRate;
  const abonoUsdNum = parseFloat(financials.abonoUsd) || 0;
  const restanteUsd = totalUsd - abonoUsdNum;

  const addProductToOrder = (product: Product) => {
    const existing = orderItems.find(i => i.productId === product.id);
    if (existing) {
      updateItemQuantity(product.id, existing.quantity + 1);
    } else {
      const embroideryCommission = product.embroideryPriceComponent ? (product.embroideryPriceComponent * 0.1) : 0;
      setOrderItems([...orderItems, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        priceUsd: product.priceRetail,
        costUsd: product.costUsd || 0,
        embroideryCommissionUsd: embroideryCommission
      }]);
    }
  };

  const updateItemQuantity = (id: string, newQty: number) => {
    if (newQty < 1) return;
    setOrderItems(orderItems.map(item => {
      if (item.productId === id) {
        const originalProduct = products.find(p => p.id === id);
        let finalPrice = item.priceUsd;
        if (originalProduct) {
          finalPrice = newQty >= 12 && originalProduct.priceWholesale > 0 
            ? originalProduct.priceWholesale 
            : originalProduct.priceRetail;
        }
        const embroideryCommission = originalProduct?.embroideryPriceComponent ? (originalProduct.embroideryPriceComponent * 0.1 * newQty) : 0;
        return { ...item, quantity: newQty, priceUsd: finalPrice, embroideryCommissionUsd: embroideryCommission };
      }
      return item;
    }));
  };

  const handleManualPriceChange = (value: string, type: 'usd' | 'bs') => {
    const cleanValue = value.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleanValue) || 0;
    if (type === 'usd') {
      setManualItem({ 
        ...manualItem, 
        priceUsd: cleanValue, 
        priceBs: cleanValue ? (num * settings.bcvRate).toFixed(2) : '' 
      });
    } else {
      setManualItem({ 
        ...manualItem, 
        priceBs: cleanValue, 
        priceUsd: (settings.bcvRate > 0 && cleanValue) ? (num / settings.bcvRate).toFixed(2) : '' 
      });
    }
  };

  const addManualItem = () => {
    const priceUsdNum = parseFloat(manualItem.priceUsd) || 0;
    if (!manualItem.name || priceUsdNum <= 0) {
      alert("Ingrese nombre y precio para el ítem adicional.");
      return;
    }
    setOrderItems([...orderItems, {
      productId: `manual_${Date.now()}`,
      name: manualItem.name.toUpperCase(),
      quantity: parseInt(manualItem.quantity) || 1,
      priceUsd: priceUsdNum,
      costUsd: priceUsdNum * 0.4 // Estimación de costo base (60% margen)
    }]);
    setManualItem({ name: '', quantity: '1', priceUsd: '', priceBs: '' });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsProcessingImages(true);
    const processedImages: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validación básica de tipo
        if (!file.type.startsWith('image/')) continue;

        const result = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = () => reject("Error al leer el archivo");
          reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;
              const MAX_SIZE = 1000; 

              if (width > height) {
                if (width > MAX_SIZE) {
                  height *= MAX_SIZE / width;
                  width = MAX_SIZE;
                }
              } else {
                if (height > MAX_SIZE) {
                  width *= MAX_SIZE / height;
                  height = MAX_SIZE;
                }
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              
              if (ctx) {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.6));
              } else {
                reject("No se pudo obtener el contexto del canvas");
              }
            };
            img.onerror = () => reject("Error al cargar la imagen");
            img.src = event.target?.result as string;
          };
          reader.readAsDataURL(file);
        });
        processedImages.push(result);
      }

      setReferenceImages(prev => [...prev, ...processedImages]);
    } catch (error) {
      console.error("Error procesando imágenes:", error);
      alert("Hubo un error al optimizar las imágenes. Intenta con otra.");
    } finally {
      setIsProcessingImages(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };
  // 3. AHORA SÍ, LAS FUNCIONES QUE USAN ESOS ESTADOS
const handleSubmit = () => {
    const missing = [];
    if (!customer.name) missing.push("Nombre Cliente");
    if (!dates.delivery) missing.push("Fecha Estimada de Entrega");
    if (orderItems.length === 0) missing.push("Lista de Productos");
    if (!assignedAgentId) missing.push("Responsable Asignado");

    if (missing.length > 0) {
      setShowErrors(true);
      alert(`⚠️ CAMPOS PENDIENTES:\n\n- ${missing.join('\n- ')}`);
      return;
    }

    // Regla del 50% - Flujo de Caja
    const abonoUsdNum = parseFloat(financials.abonoUsd) || 0;
    const minAbono = totalUsd * 0.5;
    if (!isLogistics && abonoUsdNum < minAbono && totalUsd > 0) {
      alert(`🛑 ERROR DE CUMPLIMIENTO:\n\nEl abono mínimo obligatorio es del 50% ($${minAbono.toFixed(2)}).`);
      return;
    }

    if (!checklistProgress['protocolo_validado']) {
      alert("⚠️ PROTOCOLO NO VALIDADO.");
      return;
    }

    const selectedWorkshop = workshops.find(w => w.id === assignedWorkshopIds[0]);
    const isCostura = selectedWorkshop?.department === 'COSTURA';
    
    // MANTENEMOS TU CORRELATIVO ORIGINAL
    const orderNum = `${selectedStore.prefix}-${String(selectedStore.nextOrderNumber).padStart(4, '0')}`;
    
    const technicalPayload = {
      color_prenda: (sewingData.color || "").toUpperCase(),
      tipo_tela: (sewingData.fabricType || "").toUpperCase(),
      tallas_registro: sewingData.genderSelections
        .map(s => `• ${s.quantity}x TALLA ${s.size} (${s.gender})`)
        .join('\n'), 
      technicalDetails: (technicalDetails || "").toUpperCase(),
      resumen_diseno: showDesignForm 
        ? `${designSpecs.threadOrDesignColors || ''} - ${designSpecs.additionalSpecs || ''}`.toUpperCase() 
        : (technicalDetails || "").toUpperCase(),
      assigned_workshop_name: selectedWorkshop?.name || 'INTERNO',
      designSpecs: showDesignForm ? designSpecs : undefined,
      referenceImages,
      assignedAgentId,
      assignedWorkshopIds,
      paymentMethod: financials.paymentMethod,
      paymentReference: financials.paymentReference,
      issuingAgentId: currentAgentId || undefined
    };

    const finalOrder: Order = {
      id: Math.random().toString(36).substr(2, 9), // Tu ID aleatorio
      orderNumber: orderNum, // Tu formato de número
      storeId: selectedStoreId,
      customerName: customer.name.toUpperCase(),
      customerCi: customer.ci,
      customerPhone: customer.phone ? `+58${customer.phone}` : '',
      customerType,
      items: orderItems,
      totalUsd,
      totalBs,
      totalCommissionsUsd,
      expectedUtilityUsd,
      abonoUsd: abonoUsdNum,
      restanteUsd: totalUsd - abonoUsdNum,
      status: isCostura ? 'taller' : (assignedWorkshopIds.length > 0 ? 'taller' : initialStatus),
      isLogistics,
      taskStatus: isCostura ? 'confeccion' : (initialStatus === 'taller' ? 'confeccion' : 'esperando'),
      bcvRate: settings.bcvRate,
      issueDate: dates.issue.split('-').reverse().join('/'),
      deliveryDate: dates.delivery.split('-').reverse().join('/'),
      technicalDetails: technicalPayload,
      referenceImages,
      paymentMethod: financials.paymentMethod,
      paymentReference: financials.paymentReference,
      history: [{
        timestamp: Date.now(),
        agentId: currentAgentId || 'admin',
        action: `Abono Inicial Recibido: $${abonoUsdNum.toFixed(2)}. Ref: ${financials.paymentReference}`,
        status: isCostura ? 'taller' : (assignedWorkshopIds.length > 0 ? 'taller' : initialStatus)
      }]
    };

    // PROCESO DE GUARDADO
    onSave(finalOrder);

    // Actualización de correlativo en el Store
    const updatedStores = settings.stores.map(s => 
      s.id === selectedStoreId ? { ...s, nextOrderNumber: s.nextOrderNumber + 1 } : s
    );
    setSettings({ ...settings, stores: updatedStores });

    // Notificaciones y UI
    sendOrderNotification(finalOrder, 'orden', settings);
    
    // AUTOMATIZACIÓN DE ORDEN A TALLER (Regla -2 días)
    if (assignedWorkshopIds.length > 0) {
        const deliveryDateObj = new Date(dates.delivery);
        deliveryDateObj.setDate(deliveryDateObj.getDate() - 2);
        const workshopDate = deliveryDateObj.toLocaleDateString('es-VE');
        
        const message = `🛠 *ORDEN DE PRODUCCIÓN - ROXTOR*\n\n` +
          `*ORDEN:* #${finalOrder.orderNumber}\n` +
          `*FECHA LÍMITE TALLER:* ${workshopDate}\n` +
          `*CLIENTE:* ${finalOrder.customerName}\n` +
          `*DETALLE:* ${technicalPayload.tallas_registro}\n` +
          `*TELA:* ${technicalPayload.tipo_tela}\n` +
          `*COLOR:* ${technicalPayload.color_prenda}\n\n` +
          `_Favor confirmar recepción y materiales._`;
        
        window.open(`https://wa.me/${selectedWorkshop?.phone}?text=${encodeURIComponent(message)}`, '_blank');
    }

    setSavedOrderData(finalOrder);
    setCurrentStep('checklist'); 
    
    alert(`🚀 ORDEN ${finalOrder.orderNumber} LANZADA EXITOSAMENTE.`);
  };

  const resetForm = () => {
    // 1. Datos del Cliente y Productos
    setOrderItems([]);
    setCustomer({ name: '', ci: '', phone: '' });
    setOrderGenerated(false);
    
    // 2. Finanzas y Pagos
    setFinancials({ 
      abonoUsd: '', 
      abonoBs: '', 
      paymentMethod: 'DOLARES $' as any, 
      paymentReference: '' 
    });

    // 3. Gestión y Taller
    setTechnicalDetails('');
    setReferenceImages([]);
    if (imageInputRef.current) imageInputRef.current.value = ""; // Limpia el input de archivos
    setAssignedAgentId('');
    setAssignedWorkshopIds([]);
    setInitialStatus('pendiente');
    setIsLogistics(false);
    setShowErrors(false);
    setShowDesignForm(false);
    setChecklistProgress({});

    // 4. Configuración de Costura (Tallas y Telas)
    setSewingData({
      genderSelections: [{ gender: 'CABALLERO', size: 'M', quantity: 1 }],
      color: '',
      fabricType: ''
    });

    // 5. Especificaciones de Arte y Personalización
    setDesignSpecs({
      colors: '', 
      position: '', 
      personalizationName: '', 
      personalizationLocation: '',
      threadOrDesignColors: '', 
      additionalBackDesign: '', 
      additionalSpecs: '', 
      isApprovedByClient: false
    });

    // 6. Navegación y Tiempos
    setDates({
      issue: new Date().toISOString().split('T')[0],
      delivery: ''
    });
    setCurrentStep('main');
    setSavedOrderData(null);
    
    console.log("🧹 Mesa limpia en Roxtor. Listos para la siguiente orden.");
  };
       
return (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20 animate-in fade-in slide-in-from-bottom-6 duration-700 italic">
    {/* COLUMNA IZQUIERDA: DATOS Y PRODUCCIÓN */}
    <div className="lg:col-span-8 space-y-8">
      
      {/* SECCIÓN 1: ENCABEZADO Y FECHAS */}
      <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-8 shadow-sm space-y-8">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg rotate-3"><FileText size={24} /></div>
            <div>
              <h3 className="text-2xl font-black text-[#000814] uppercase tracking-tighter italic leading-none">Nueva Orden</h3>
              <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mt-1 italic">Sincronización Multi-Agente</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Próximo Nro.</span>
            <span className="text-3xl font-black text-rose-600 italic tracking-tighter">{selectedStore.prefix}-{String(selectedStore.nextOrderNumber).padStart(4, '0')}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Fecha Emisión</label>
            <input type="date" value={dates.issue} onChange={(e) => setDates({...dates, issue: e.target.value})} className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 text-slate-800 font-bold outline-none" />
          </div>
          <div className="space-y-2">
            <label className={`text-[10px] font-black uppercase tracking-widest ml-1 italic ${showErrors && !dates.delivery ? 'text-red-500' : 'text-slate-400'}`}>Fecha Entrega Estimada *</label>
            <input type="date" value={dates.delivery} onChange={(e) => setDates({...dates, delivery: e.target.value})} className={`w-full border-2 rounded-2xl px-5 py-4 text-slate-800 font-bold outline-none ${showErrors && !dates.delivery ? 'bg-red-50 border-red-200' : 'bg-white border-rose-100'}`} />
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: CLIENTE */}
      <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-8 shadow-sm space-y-6">
        <SectionHeader icon={<User size={20} className="text-rose-600" />} title="Identificación del Cliente" />
        <div className="flex gap-2 mb-4">
          <button onClick={() => setCustomerType('B2C')} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase italic transition-all ${customerType === 'B2C' ? 'bg-rose-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>Cliente B2C (Personal)</button>
          <button onClick={() => setCustomerType('B2B')} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase italic transition-all ${customerType === 'B2B' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>Cliente B2B (Empresa/Colegio)</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <InputGroup label="Nombre / Razón Social *" icon={<User size={14}/>} value={customer.name} error={showErrors && !customer.name} onChange={(e: any) => setCustomer({...customer, name: e.target.value})} />
          <InputGroup label="Cédula / RIF" icon={<Hash size={14}/>} value={customer.ci} onChange={(e: any) => setCustomer({...customer, ci: e.target.value})} />
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">WhatsApp Contacto</label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-sm text-rose-600">+58</span>
              <input type="text" className="w-full border-2 bg-slate-50 border-transparent rounded-2xl pl-14 pr-5 py-4 text-slate-800 font-bold focus:bg-white focus:border-rose-100 outline-none transition-all" value={customer.phone} onChange={(e) => setCustomer({...customer, phone: e.target.value})} placeholder="412 1234567" />
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 3: CATÁLOGO Y PRODUCTOS */}
      <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-8 shadow-sm space-y-8">
        <SectionHeader icon={<ShoppingCart size={20} className="text-rose-600" />} title="Servicios y Productos" />
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Buscar en Catálogo</label>
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input type="text" placeholder="Buscar por nombre..." className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-12 pr-5 py-4 text-slate-800 font-bold focus:bg-white focus:border-rose-100 outline-none transition-all" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            {searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-100 rounded-3xl shadow-2xl z-50 max-h-60 overflow-y-auto p-2">
                {filteredProducts.map(p => (
                  <button key={p.id} onClick={() => { addProductToOrder(p); setSearchQuery(''); }} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all">
                    <div className="flex flex-col items-start">
                      <span className="font-black text-slate-700 uppercase italic text-xs">{p.name}</span>
                      {p.targetAreas && <span className="text-[8px] font-bold text-emerald-600 uppercase italic flex items-center gap-1"><Globe size={10}/> {p.targetAreas}</span>}
                    </div>
                    <span className="font-black text-rose-600">${p.priceRetail}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-50 rounded-[2.5rem] p-6 border-2 border-dashed border-slate-200">
          <p className="text-[10px] font-black text-[#004ea1] uppercase italic mb-4 ml-2">¿Item no está en catálogo? Agrégalo manualmente:</p>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input type="text" placeholder="Nombre..." className="md:col-span-1 bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-xs font-black uppercase" value={manualItem.name} onChange={(e) => setManualItem({...manualItem, name: e.target.value})} />
            <input type="text" inputMode="numeric" placeholder="Cant." className="bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-xs font-black" value={manualItem.quantity} onChange={(e) => setManualItem({...manualItem, quantity: e.target.value.replace(/\D/g, '')})} />
            <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">$</span><input type="text" inputMode="decimal" placeholder="Precio $" className="w-full bg-white border-2 border-slate-100 rounded-xl pl-6 pr-4 py-3 text-xs font-black" value={manualItem.priceUsd} onChange={(e) => handleManualPriceChange(e.target.value, 'usd')} /></div>
            <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">Bs</span><input type="text" inputMode="decimal" placeholder="Precio Bs" className="w-full bg-white border-2 border-slate-100 rounded-xl pl-8 pr-4 py-3 text-xs font-black" value={manualItem.priceBs} onChange={(e) => handleManualPriceChange(e.target.value, 'bs')} /></div>
          </div>
          <button onClick={addManualItem} className="mt-4 w-full bg-[#004ea1] text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 transition-all"><Plus size={14}/> AÑADIR ÍTEM ADICIONAL</button>
        </div>

        <div className="overflow-hidden rounded-3xl border-2 border-slate-100">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase italic"><tr className="border-b border-slate-100"><th className="px-6 py-4">Cant.</th><th className="px-6 py-4">Descripción</th><th className="px-6 py-4">Unit. $</th><th className="px-6 py-4 text-right">Borrar</th></tr></thead>
            <tbody className="divide-y divide-slate-50">
              {orderItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors text-xs font-black uppercase">
                  <td className="px-6 py-4"><input type="number" value={item.quantity} onChange={(e) => updateItemQuantity(item.productId, parseInt(e.target.value) || 1)} className="w-12 bg-white border-2 rounded text-center font-black" /></td>
                  <td className="px-6 py-4 text-slate-700">{item.name}</td>
                  <td className="px-6 py-4 text-rose-600">${item.priceUsd}</td>
                  <td className="px-6 py-4 text-right"><button onClick={() => setOrderItems(orderItems.filter((_, i) => i !== idx))} className="text-slate-200 hover:text-red-500"><Trash2 size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    {/* SECCIÓN 4: CONFIGURACIÓN DE PRODUCCIÓN (Taller) */}
      <div className="bg-white border-4 border-slate-50 rounded-[2.5rem] p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <Scissors size={22} className="text-blue-600" />
          <h4 className="text-sm font-black uppercase italic text-slate-700 tracking-tighter">Configuración de Producción (Taller)</h4>
        </div>

        <div className="space-y-3">
          {sewingData.genderSelections.map((sel, idx) => (
            <div key={idx} className="flex flex-wrap md:flex-nowrap gap-2 items-center bg-slate-50 p-2 rounded-2xl border-2 border-slate-100">
              <select 
                className="flex-1 bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-[10px] font-black uppercase outline-none focus:border-blue-400" 
                value={sel.gender} 
                onChange={(e) => { 
                  const newSels = [...sewingData.genderSelections]; 
                  newSels[idx].gender = e.target.value; 
                  setSewingData({...sewingData, genderSelections: newSels}); 
                }}
              >
                {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>

              <select 
                className="w-24 bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-[10px] font-black uppercase outline-none focus:border-blue-400" 
                value={sel.size} 
                onChange={(e) => { 
                  const newSels = [...sewingData.genderSelections]; 
                  newSels[idx].size = e.target.value; 
                  setSewingData({...sewingData, genderSelections: newSels}); 
                }}
              >
                {TALLAS_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>

              <input 
                type="number" 
                placeholder="CANT" 
                className="w-20 bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-[10px] font-black outline-none focus:border-blue-400" 
                value={sel.quantity} 
                onChange={(e) => { 
                  const newSels = [...sewingData.genderSelections]; 
                  newSels[idx].quantity = parseInt(e.target.value) || 0; 
                  setSewingData({...sewingData, genderSelections: newSels}); 
                }} 
              />

              <button 
                onClick={() => setSewingData({...sewingData, genderSelections: sewingData.genderSelections.filter((_, i) => i !== idx)})} 
                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <Trash2 size={16}/>
              </button>
            </div>
          ))}

          <button 
            onClick={() => setSewingData({...sewingData, genderSelections: [...sewingData.genderSelections, { gender: 'CABALLERO', size: 'M', quantity: 1 }]})} 
            className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-[9px] font-black uppercase text-slate-400 hover:bg-slate-50 transition-all"
          >
            + Agregar Talla/Género
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            type="text" 
            placeholder="COLOR DE LA PRENDA" 
            className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xs font-bold uppercase outline-none focus:border-blue-200" 
            value={sewingData.color} 
            onChange={(e) => setSewingData({...sewingData, color: e.target.value})} 
          />
          <input 
            type="text" 
            placeholder="TIPO DE TELA" 
            className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xs font-bold uppercase outline-none focus:border-blue-200" 
            value={sewingData.fabricType} 
            onChange={(e) => setSewingData({...sewingData, fabricType: e.target.value})} 
          />
        </div>
      </div>

      {/* SECCIÓN 5: ESPECIFICACIONES DE DISEÑO Y ARTE */}
      <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Palette size={22} className="text-rose-600" />
            <h4 className="text-sm font-black uppercase italic text-slate-700 tracking-tighter">Especificaciones de Arte</h4>
          </div>
          <button 
            type="button"
            onClick={() => setShowDesignForm(!showDesignForm)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${showDesignForm ? 'bg-rose-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}
          >
            {showDesignForm ? '✓ DISEÑO ACTIVO' : '+ AGREGAR PERSONALIZACIÓN'}
          </button>
        </div>

        {showDesignForm && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-500">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-rose-600 uppercase italic ml-2">Colores Hilos / Viniles</label>
                <input type="text" placeholder="EJ: ROJO REY, BLANCO Y ORO..." className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 text-xs font-bold uppercase focus:bg-white focus:border-rose-100 outline-none" value={designSpecs.threadOrDesignColors} onChange={(e) => setDesignSpecs({...designSpecs, threadOrDesignColors: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase italic ml-2">Posición Principal (Logo/Insignia)</label>
                <input type="text" placeholder="EJ: PECHO IZQUIERDO, FRENTE CENTRO..." className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 text-xs font-bold uppercase focus:bg-white focus:border-rose-100 outline-none" value={designSpecs.position} onChange={(e) => setDesignSpecs({...designSpecs, position: e.target.value})} />
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase italic ml-2">Nombre / Texto</label>
                  <input type="text" placeholder="EJ: LUIS PÉREZ" className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 text-xs font-bold uppercase focus:bg-white focus:border-rose-100 outline-none" value={designSpecs.personalizationName} onChange={(e) => setDesignSpecs({...designSpecs, personalizationName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase italic ml-2">Ubicación Nombre</label>
                  <input type="text" placeholder="EJ: FRENTE DERECHO" className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 text-xs font-bold uppercase focus:bg-white focus:border-rose-100 outline-none" value={designSpecs.personalizationLocation} onChange={(e) => setDesignSpecs({...designSpecs, personalizationLocation: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase italic ml-2">Diseño Espalda (Cargo/Nro)</label>
                <input type="text" placeholder="EJ: LICENCIATURA, NRO 10, LOGO GRANDE..." className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 text-xs font-bold uppercase focus:bg-white focus:border-rose-100 outline-none" value={designSpecs.additionalBackDesign} onChange={(e) => setDesignSpecs({...designSpecs, additionalBackDesign: e.target.value})} />
              </div>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-rose-600 uppercase italic ml-2">Motivo General / Arte</label>
              <textarea placeholder="EJ: MOTIVO RAYO MCQUEEN..." className="w-full bg-rose-50/20 border-2 border-dashed border-rose-100 rounded-3xl p-5 text-xs font-bold uppercase min-h-[100px] outline-none focus:bg-white transition-all" value={designSpecs.additionalSpecs} onChange={(e) => setDesignSpecs({...designSpecs, additionalSpecs: e.target.value})} />
            </div>
          </div>
        )}
      </div>
    </div>

    {/* COLUMNA DERECHA: RESUMEN ECONÓMICO Y ACCIÓN */}
    <div className="lg:col-span-4 space-y-8">
      <div className="bg-[#000814] text-white rounded-[3rem] p-10 shadow-2xl space-y-8 border-4 border-white/5 relative overflow-hidden">
        <div className="relative z-10 space-y-6">
          <h4 className="text-xl font-black italic tracking-tighter uppercase border-b border-white/10 pb-4 text-center">Resumen Económico</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black text-slate-500 uppercase italic">Total Orden</span>
              <span className="text-4xl font-black italic tracking-tighter text-white">${totalUsd.toFixed(2)}</span>
            </div>
            <p className="text-[10px] text-rose-400 font-bold italic text-right">Bs. {totalBs.toLocaleString('es-VE')}</p>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between items-center"><span className="text-[8px] font-black text-slate-500 uppercase italic">Utilidad Proyectada</span><span className="text-sm font-black text-emerald-400 italic tracking-tighter">+${expectedUtilityUsd.toFixed(2)}</span></div>
              <div className="flex justify-between items-center"><span className="text-[8px] font-black text-slate-500 uppercase italic">Margen</span><span className="text-sm font-black text-emerald-400 italic tracking-tighter">{utilityMargin.toFixed(1)}%</span></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase italic block">Abono ($)</label>
                <input type="text" className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-5 py-4 text-white font-black text-2xl outline-none focus:border-rose-500 transition-all" value={financials.abonoUsd} onChange={(e) => { const val = e.target.value.replace(/[^0-9.]/g, ''); const num = parseFloat(val) || 0; setFinancials({...financials, abonoUsd: val, abonoBs: val ? (num * settings.bcvRate).toFixed(2) : '' }); }} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase italic block">Abono (Bs.)</label>
                <input type="text" className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-5 py-4 text-white font-black text-2xl outline-none focus:border-rose-500 transition-all" value={financials.abonoBs} onChange={(e) => { const val = e.target.value.replace(/[^0-9.]/g, ''); const num = parseFloat(val) || 0; setFinancials({...financials, abonoBs: val, abonoUsd: (settings.bcvRate > 0 && val) ? (num / settings.bcvRate).toFixed(2) : '' }); }} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase italic block">Método de Pago</label>
              <select className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-5 py-4 text-white font-black text-xs outline-none uppercase italic" value={financials.paymentMethod} onChange={(e) => setFinancials({...financials, paymentMethod: e.target.value as any})}>
                <option value="DOLARES $">DOLARES $</option>
                <option value="PAGO MOVIL">PAGO MOVIL</option>
                <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                <option value="EFECTIVO">EFECTIVO</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-8 shadow-sm space-y-6">
        <SectionHeader icon={<Plus size={20} className="text-rose-600" />} title="Gestión Operativa" />
        <div className="space-y-4">
          <select value={assignedAgentId} onChange={(e) => setAssignedAgentId(e.target.value)} className="w-full border-2 rounded-2xl px-5 py-4 text-xs font-black uppercase italic outline-none bg-slate-50 border-slate-100">
            <option value="">-- SELECCIONAR AGENTE --</option>
            {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          
          <div onClick={() => imageInputRef.current?.click()} className="w-full min-h-[120px] bg-slate-50 border-4 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:bg-rose-50 transition-all p-4">
             {referenceImages.length > 0 ? (
               <div className="grid grid-cols-3 gap-2 w-full">
                 {referenceImages.map((img, i) => <img key={i} src={img} className="w-full aspect-square object-cover rounded-xl" />)}
               </div>
             ) : (
               <p className="text-[10px] font-black text-slate-400 uppercase italic">Imágenes de Referencia</p>
             )}
             <input type="file" ref={imageInputRef} className="hidden" multiple accept="image/*" onChange={handleImageUpload} />
          </div>

          <div className="pt-6 space-y-6">
            <label className="flex items-center gap-5 cursor-pointer group">
              <input 
                type="checkbox" 
                className="hidden peer" 
                checked={!!checklistProgress['protocolo_validado']} 
                onChange={() => setChecklistProgress({ ...checklistProgress, 'protocolo_validado': !checklistProgress['protocolo_validado'] })} 
              />
              <div className="w-12 h-12 rounded-[1.2rem] border-2 border-slate-200 peer-checked:bg-emerald-500 peer-checked:border-emerald-500 flex items-center justify-center transition-all">
                <ShieldCheck size={28} className={checklistProgress['protocolo_validado'] ? "text-white" : "text-slate-200"} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase italic leading-none">Validación Protocolo</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase italic">Datos confirmados</p>
              </div>
            </label>

            {/* BOTÓN UNIFICADO: GUARDAR, ENVIAR A TALLER (SI APLICA) Y ABRIR RECIBO */}
            <button 
              onClick={handleSubmit} 
              disabled={!checklistProgress['protocolo_validado']}
              className={`w-full py-6 rounded-[2rem] font-black uppercase text-[11px] tracking-widest transition-all italic border-b-8 ${
                checklistProgress['protocolo_validado']
                  ? 'bg-blue-600 text-white border-blue-900 shadow-xl active:translate-y-1 active:border-b-4' 
                  : 'bg-slate-100 text-slate-300 border-transparent cursor-not-allowed'
              }`}
            >
              GENERAR Y PROCESAR PEDIDO 🚀
            </button>

            {/* NOTIFICACIONES POST-GUARDADO (Solo aparecen si no se abre el recibo automáticamente) */}
            {savedOrderData && (
              <div className="space-y-3 p-4 bg-emerald-50 rounded-[2rem] border-2 border-emerald-100 animate-in zoom-in-95 duration-300">
                <p className="text-[9px] font-black text-emerald-600 uppercase text-center mb-2 italic">✨ ¡Orden Registrada!</p>
                <div className="grid grid-cols-1 gap-2">
                  <button onClick={() => sendOrderNotification(savedOrderData, 'orden', settings)} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-md flex items-center justify-center gap-2">
                    <MessageCircle size={16} /> RE-ENVIAR AL CLIENTE
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

const SectionHeader = ({ icon, title }: any) => (
  <div className="flex items-center gap-4 mb-2">
    <div className="bg-slate-50 p-3 rounded-xl shadow-inner">{icon}</div>
    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tighter italic">{title}</h4>
  </div>
);

const InputGroup = ({ label, icon, value, onChange, placeholder, error }: any) => (
  <div className="space-y-2">
    <label className={`text-[10px] font-black uppercase tracking-widest ml-1 italic transition-colors ${error ? 'text-red-500' : 'text-slate-400'}`}>{label}</label>
    <div className="relative">
      <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${error ? 'text-red-400' : 'text-slate-300'}`}>{icon}</div>
      <input type="text" className={`w-full border-2 rounded-2xl pl-12 pr-5 py-4 text-slate-800 font-bold outline-none transition-all ${error ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-transparent focus:bg-white focus:border-rose-100'}`} value={value} onChange={onChange} placeholder={placeholder} />
    </div>
  </div>
);

export default ServiceOrderForm;
