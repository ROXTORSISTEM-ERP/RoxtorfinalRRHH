
import React, { useState, useMemo, useEffect } from 'react';
import { Product, Order, AppSettings, ServiceOrderItem } from '../types';
import { 
  User, 
  Hash, 
  Calendar, 
  ShoppingCart, 
  DollarSign, 
  FileText, 
  Plus, 
  Trash2, 
  Save, 
  Search, 
  MapPin, 
  CreditCard, 
  Ticket, 
  Zap, 
  CheckCircle2, 
  RefreshCw, 
  Coins, 
  ArrowRight, 
  AlertCircle,
  CheckSquare,
  ShieldCheck,
  Globe
} from 'lucide-react';
import { DEPARTMENT_CHECKLISTS } from './Checklists';

interface Props {
  products: Product[];
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  currentStoreId: string;
  onSave: (order: Order) => void;
}

const DirectSaleForm: React.FC<Props> = ({ products, settings, setSettings, currentStoreId, onSave }) => {
  const [customer, setCustomer] = useState({ name: '', ci: '', phone: '' });
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [orderItems, setOrderItems] = useState<ServiceOrderItem[]>([]);
  const [manualItem, setManualItem] = useState({ name: '', quantity: '1', priceUsd: '', priceBs: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  
  const [perceived, setPerceived] = useState({ usd: '', bs: '' });
  
  const [financials, setFinancials] = useState({ 
    abonoUsd: 0, 
    paymentMethod: 'EFECTIVO' as Order['paymentMethod'],
    paymentReference: ''
  });
  const [selectedStoreId, setSelectedStoreId] = useState(currentStoreId);
  const [currentStep, setCurrentStep] = useState<'main' | 'checklist'>('main');
  const [savedOrderData, setSavedOrderData] = useState<Order | null>(null);
  const [checklistProgress, setChecklistProgress] = useState<Record<string, boolean>>({});
  const [isAnonymous, setIsAnonymous] = useState(false);

  const selectedStore = settings.stores.find(s => s.id === selectedStoreId) || settings.stores[0];

  const filteredProducts = useMemo(() => 
    products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())),
  [products, searchQuery]);

  const totalUsd = useMemo(() => 
    orderItems.reduce((acc, item) => acc + (Number(item.priceUsd) * Number(item.quantity)), 0),
  [orderItems]);

  const totalBs = totalUsd * settings.bcvRate;

  const totalPerceivedUsd = (parseFloat(perceived.usd) || 0) + (settings.bcvRate > 0 ? (parseFloat(perceived.bs) || 0) / settings.bcvRate : 0);
  const changeUsd = Math.max(0, totalPerceivedUsd - totalUsd);
  const changeBs = changeUsd * settings.bcvRate;

  useEffect(() => {
    setFinancials(prev => ({ 
      ...prev, 
      abonoUsd: Number(Math.min(totalUsd, totalPerceivedUsd).toFixed(2)) 
    }));
  }, [totalPerceivedUsd, totalUsd]);

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

  const addProductToOrder = (product: Product) => {
    const existing = orderItems.find(i => i.productId === product.id);
    if (existing) {
      setOrderItems(orderItems.map(item => 
        item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setOrderItems([...orderItems, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        priceUsd: product.priceRetail
      }]);
    }
  };

  const addManualItem = () => {
    if (!manualItem.name) {
      alert("Debe asignar un nombre al producto manual.");
      return;
    }
    if (parseFloat(manualItem.priceUsd) <= 0) {
      alert("El precio del producto manual debe ser mayor a $0.");
      return;
    }
    setOrderItems([...orderItems, {
      productId: `manual_${Date.now()}`,
      name: manualItem.name.toUpperCase(),
      quantity: parseInt(manualItem.quantity) || 1,
      priceUsd: parseFloat(manualItem.priceUsd) || 0
    }]);
    setManualItem({ name: '', quantity: '1', priceUsd: '', priceBs: '' });
  };

  const handleSubmit = () => {
    const missingFields = [];
    if (!isAnonymous) {
      if (!customer.name) missingFields.push("Nombre del Cliente");
      if (!customer.ci) missingFields.push("Cédula / RIF");
      if (!customer.phone) missingFields.push("Teléfono");
    }
    if (orderItems.length === 0) missingFields.push("Al menos un producto en la lista");
    if (!checklistProgress['protocolo_validado']) missingFields.push("Validación de Protocolo");

    if (missingFields.length > 0) {
      setShowErrors(true);
      alert(`⚠️ ERROR DE VALIDACIÓN:\n\nFaltan los siguientes datos obligatorios:\n- ${missingFields.join('\n- ')}`);
      return;
    }

    // ENFORCEMENT: 50% Deposit (Minimum for any order)
    const minAbono = totalUsd * 0.5;
    if (totalPerceivedUsd < minAbono) {
      alert(`🛑 ERROR DE CUMPLIMIENTO:\n\nEl pago mínimo obligatorio es del 50% ($${minAbono.toFixed(2)}).\n\nPara ventas directas se recomienda el 100%, pero el sistema exige al menos el 50% para procesar.`);
      return;
    }

    const directSaleNum = `NE-${String(selectedStore.nextDirectSaleNumber).padStart(4, '0')}`;
    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      orderNumber: directSaleNum,
      storeId: selectedStoreId,
      customerName: isAnonymous ? "VENTA LIBRE" : customer.name.toUpperCase(),
      customerCi: isAnonymous ? "S/C" : customer.ci,
      customerPhone: !isAnonymous && customer.phone ? `+58${customer.phone}` : '',
      items: orderItems,
      totalUsd,
      totalBs,
      abonoUsd: financials.abonoUsd,
      restanteUsd: Math.max(0, totalUsd - financials.abonoUsd),
      status: 'completado',
      taskStatus: 'terminado',
      isDirectSale: true,
      history: [{
        timestamp: Date.now(),
        agentId: 'admin',
        action: `Venta Directa Procesada. Cobro: $${financials.abonoUsd.toFixed(2)}. Percibido: $${totalPerceivedUsd.toFixed(2)}. Vuelto: $${changeUsd.toFixed(2)}. Ref: ${financials.paymentReference}`,
        status: 'completado'
      }],
      bcvRate: settings.bcvRate,
      issueDate: issueDate.split('-').reverse().join('/'),
      deliveryDate: issueDate.split('-').reverse().join('/'),
      technicalDetails: 'VENTA DIRECTA AL INSTANTE',
      referenceImages: [],
      paymentMethod: financials.paymentMethod,
      paymentReference: financials.paymentReference
    };

    const updatedStores = settings.stores.map(s => 
      s.id === selectedStoreId ? { ...s, nextDirectSaleNumber: (s.nextDirectSaleNumber || 1) + 1 } : s
    );
    setSettings({ ...settings, stores: updatedStores });

    onSave(newOrder);
    setSavedOrderData(newOrder);
    setCurrentStep('checklist');
  };

  const confirmChecklist = () => {
    const ventasChecklist = DEPARTMENT_CHECKLISTS.find(d => d.id === 'ventas');
    if (ventasChecklist) {
      const completedCount = ventasChecklist.items.filter((_, i) => checklistProgress[`ventas-${i}`]).length;
      if (completedCount < ventasChecklist.items.length) {
        alert("⚠️ DEBE COMPLETAR TODOS LOS PASOS DEL CHECKLIST DE VENTAS ANTES DE FINALIZAR.");
        return;
      }
    }
    
    if (savedOrderData) {
      const updatedStores = settings.stores.map(s => 
        s.id === selectedStoreId ? { ...s, nextDirectSaleNumber: (s.nextDirectSaleNumber || 1) + 1 } : s
      );
      setSettings({ ...settings, stores: updatedStores });
      alert(`✅ Venta Exitosa: Nota de Entrega ${savedOrderData.orderNumber} generada.`);
    }

    resetForm();
  };

  const resetForm = () => {
    setOrderItems([]);
    setCustomer({ name: '', ci: '', phone: '' });
    setFinancials({ abonoUsd: 0, paymentMethod: 'EFECTIVO' as any, paymentReference: '' });
    setPerceived({ usd: '', bs: '' });
    setShowErrors(false);
    setChecklistProgress({});
    setSavedOrderData(null);
    setCurrentStep('main');
  };

  if (currentStep === 'checklist') {
    const ventasChecklist = DEPARTMENT_CHECKLISTS.find(d => d.id === 'ventas')!;
    const completedCount = ventasChecklist.items.filter((_, i) => checklistProgress[`ventas-${i}`]).length;
    const progress = (completedCount / ventasChecklist.items.length) * 100;

    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in zoom-in-95 duration-500 italic">
        <div className="bg-[#000814] text-white rounded-[3rem] p-10 shadow-2xl space-y-8 border-4 border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12"><CheckSquare size={200}/></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-emerald-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-lg rotate-3">
                <CheckSquare size={32} />
              </div>
              <div>
                <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Protocolo de Venta Directa</h3>
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-1 italic">Verificación Final de Calidad</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-10 shadow-sm space-y-8">
          <div className="flex justify-between items-center">
            <h4 className="text-xl font-black text-slate-800 uppercase italic">Pasos Obligatorios</h4>
            <span className={`text-sm font-black italic ${progress === 100 ? 'text-emerald-500' : 'text-slate-400'}`}>
              {completedCount}/{ventasChecklist.items.length} COMPLETADOS
            </span>
          </div>

          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`} 
              style={{ width: `${progress}%` }} 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ventasChecklist.items.map((item, index) => {
              const itemKey = `ventas-${index}`;
              return (
                <button 
                  key={itemKey}
                  onClick={() => setChecklistProgress(prev => ({ ...prev, [itemKey]: !prev[itemKey] }))}
                  className={`flex items-start gap-4 p-6 rounded-3xl border-2 transition-all text-left ${
                    checklistProgress[itemKey] 
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                      : 'bg-slate-50 border-transparent text-slate-500 hover:border-slate-100'
                  }`}
                >
                  <div className={`mt-0.5 w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all ${
                    checklistProgress[itemKey] ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 bg-white'
                  }`}>
                    {checklistProgress[itemKey] && <CheckCircle2 size={14} />}
                  </div>
                  <span className="text-xs font-black uppercase leading-tight italic">{item}</span>
                </button>
              );
            })}
          </div>

          {progress === 100 && (
            <div className="bg-emerald-50 p-6 rounded-[2rem] flex items-center gap-4 animate-in zoom-in-95 border-2 border-emerald-100">
              <ShieldCheck size={32} className="text-emerald-500" />
              <div>
                <p className="text-sm font-black text-emerald-700 uppercase italic">Venta Validada</p>
                <p className="text-[10px] font-bold text-emerald-600/60 uppercase italic">Todo en orden para entregar el producto al cliente.</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button 
            onClick={() => setCurrentStep('main')}
            className="flex-1 bg-slate-100 text-slate-400 py-6 rounded-[2.5rem] font-black uppercase text-[11px] tracking-widest hover:bg-slate-200 transition-all italic"
          >
            VOLVER
          </button>
          <button 
            onClick={confirmChecklist}
            className={`flex-[2] py-6 rounded-[2.5rem] font-black uppercase text-[11px] tracking-widest shadow-2xl transition-all border-b-8 italic flex items-center justify-center gap-3 ${
              progress === 100 
                ? 'bg-[#000814] text-white hover:bg-emerald-600 border-slate-800' 
                : 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 size={20} /> FINALIZAR VENTA <ArrowRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
      
      <div className="lg:col-span-8 space-y-8">
        <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-8 shadow-sm space-y-8">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#004ea1] text-white rounded-2xl flex items-center justify-center shadow-lg rotate-3">
                <Zap size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-[#000814] uppercase tracking-tighter italic leading-none">Venta Directa</h3>
                <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mt-1 italic">{settings.slogan}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Nota de Entrega Nro.</span>
              <span className="text-3xl font-black text-[#004ea1] italic tracking-tighter">
                NE-{String(selectedStore.nextDirectSaleNumber).padStart(4, '0')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Fecha de Venta</label>
              <input 
                type="date" 
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 text-slate-800 font-bold focus:bg-white focus:border-blue-100 outline-none transition-all"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Sede de Venta</label>
              <div className="flex gap-2">
                {settings.stores.map(s => {
                  const isCentro = s.name.toUpperCase().includes('CENTRO');
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStoreId(s.id)}
                      className={`flex-1 py-3 rounded-xl border-2 transition-all font-black uppercase text-[9px] tracking-widest italic ${
                        selectedStoreId === s.id 
                          ? (isCentro ? 'bg-rose-600 text-white border-rose-600 shadow-md' : 'bg-[#004ea1] text-white border-[#004ea1] shadow-md')
                          : 'bg-slate-50 text-slate-400 border-slate-100'
                      }`}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-8 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <SectionHeader icon={<User size={20} className="text-[#004ea1]" />} title="Datos del Comprador" />
            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-4 py-2 rounded-xl border-2 border-slate-100 hover:bg-blue-50 transition-all">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              <span className="text-[10px] font-black uppercase italic text-slate-600">Sin personalizar</span>
            </label>
          </div>
          {!isAnonymous && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-300">
              <InputGroup 
                label="Nombre del Cliente *" 
                icon={<User size={14}/>} 
                value={customer.name} 
                error={showErrors && !customer.name}
                onChange={(e: any) => setCustomer({...customer, name: e.target.value})}
              />
              <InputGroup 
                label="Cédula / RIF *" 
                icon={<Hash size={14}/>} 
                value={customer.ci} 
                error={showErrors && !customer.ci}
                onChange={(e: any) => setCustomer({...customer, ci: e.target.value})}
              />
              <InputGroup 
                label="Teléfono *" 
                icon={<DollarSign size={14}/>} 
                value={customer.phone} 
                error={showErrors && !customer.phone}
                onChange={(e: any) => setCustomer({...customer, phone: e.target.value})}
                placeholder="412 1234567"
              />
            </div>
          )}
          {isAnonymous && (
            <div className="p-4 bg-blue-50 rounded-2xl border-2 border-blue-100 flex items-center gap-3 animate-in zoom-in-95 duration-300">
              <Zap className="text-blue-600" size={20} />
              <p className="text-[10px] font-black uppercase italic text-blue-700">Venta rápida activada: Los datos del cliente se guardarán como "VENTA LIBRE".</p>
            </div>
          )}
        </div>

        <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-8 shadow-sm space-y-8">
          <SectionHeader icon={<ShoppingCart size={20} className="text-[#004ea1]" />} title="Productos a Entregar" />
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Catálogo de Productos</label>
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="text" 
                placeholder="Buscar item..." 
                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-12 pr-5 py-4 text-slate-800 font-bold focus:bg-white focus:border-blue-100 outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-100 rounded-3xl shadow-2xl z-50 max-h-60 overflow-y-auto p-2">
                  {filteredProducts.map(p => (
                    <button 
                      key={p.id} 
                      onClick={() => { addProductToOrder(p); setSearchQuery(''); }}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-black text-slate-700 uppercase italic text-xs">{p.name}</span>
                        {p.targetAreas && (
                          <span className="text-[8px] font-bold text-emerald-600 uppercase italic flex items-center gap-1">
                            <Globe size={10}/> {p.targetAreas}
                          </span>
                        )}
                      </div>
                      <span className="font-black text-[#004ea1]">${p.priceRetail}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={`bg-slate-50/50 rounded-[2rem] p-6 border-2 border-dashed ${showErrors && orderItems.length === 0 ? 'border-red-400 bg-red-50/20' : 'border-slate-200'}`}>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 italic flex items-center gap-2">
              <RefreshCw size={12} className="text-[#004ea1]" /> Carga de ítem personalizado:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <input 
                type="text" placeholder="Nombre ítem" 
                className="md:col-span-1 bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-xs font-bold uppercase"
                value={manualItem.name} onChange={(e) => setManualItem({...manualItem, name: e.target.value})}
              />
              <input 
                type="text" 
                inputMode="numeric"
                placeholder="Cant." 
                className="bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-xs font-bold"
                value={manualItem.quantity} onChange={(e) => setManualItem({...manualItem, quantity: e.target.value.replace(/\D/g, '')})}
              />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-slate-400 text-[10px]">$</span>
                <input 
                  type="text" 
                  inputMode="decimal"
                  placeholder="Precio $" 
                  className="w-full bg-white border-2 border-slate-100 rounded-xl pl-8 pr-4 py-3 text-xs font-bold"
                  value={manualItem.priceUsd} 
                  onChange={(e) => handleManualPriceChange(e.target.value, 'usd')}
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-slate-400 text-[10px]">Bs</span>
                <input 
                  type="text" 
                  inputMode="decimal"
                  placeholder="Bs" 
                  className="w-full bg-white border-2 border-slate-100 rounded-xl pl-8 pr-4 py-3 text-xs font-bold"
                  value={manualItem.priceBs} 
                  onChange={(e) => handleManualPriceChange(e.target.value, 'bs')}
                />
              </div>
              <button 
                onClick={addManualItem}
                className="bg-[#004ea1] text-white py-3 rounded-xl shadow-md hover:bg-blue-600 flex items-center justify-center gap-2 font-black text-[10px] uppercase italic"
              >
                <Plus size={16} /> AÑADIR
              </button>
            </div>
            {showErrors && orderItems.length === 0 && (
              <p className="text-[10px] text-red-500 font-bold mt-3 uppercase italic flex items-center gap-2">
                <AlertCircle size={12}/> Debe añadir al menos un producto a la venta.
              </p>
            )}
          </div>

          <div className="overflow-hidden rounded-3xl border-2 border-slate-100">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4 italic">Cant.</th>
                  <th className="px-6 py-4 italic">Descripción</th>
                  <th className="px-6 py-4 italic">Unit. $</th>
                  <th className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orderItems.map((item) => (
                  <tr key={item.productId} className="hover:bg-slate-50/50 transition-colors italic font-bold text-slate-600 uppercase text-xs">
                    <td className="px-6 py-4 text-slate-800">{item.quantity}</td>
                    <td className="px-6 py-4">{item.name}</td>
                    <td className="px-6 py-4 text-[#004ea1]">${item.priceUsd.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => setOrderItems(orderItems.filter((i) => i.productId !== item.productId))} className="text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="lg:col-span-4 space-y-8">
        <div className="bg-[#000814] text-white rounded-[3rem] p-10 shadow-2xl space-y-8 relative overflow-hidden border-4 border-white/5">
          <div className="relative z-10 space-y-6">
            <h4 className="text-xl font-black italic tracking-tighter uppercase border-b border-white/10 pb-4">Cierre de Venta</h4>
            
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Total Factura</span>
                <span className="text-4xl font-black italic tracking-tighter text-white">${totalUsd.toFixed(2)}</span>
              </div>
              <p className="text-xs text-slate-500 text-right italic font-bold">Equivalente: Bs. {totalBs.toLocaleString('es-VE')}</p>
            </div>

            <div className="h-px bg-white/10" />

            <div className="space-y-6 pt-4">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic block">Monto Percibido del Cliente</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">$</span>
                    <input 
                      type="text" 
                      inputMode="decimal"
                      placeholder="0.00"
                      className="w-full bg-white/5 border-2 border-white/10 rounded-2xl pl-8 pr-4 py-4 text-white font-black text-xl outline-none focus:border-blue-500/50 transition-all"
                      value={perceived.usd}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        const num = parseFloat(val) || 0;
                        setPerceived({
                          ...perceived, 
                          usd: val, 
                          bs: val ? (num * settings.bcvRate).toFixed(2) : ''
                        });
                      }}
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">Bs</span>
                    <input 
                      type="text" 
                      inputMode="decimal"
                      placeholder="0.00"
                      className="w-full bg-white/5 border-2 border-white/10 rounded-2xl pl-10 pr-4 py-4 text-white font-black text-xl outline-none focus:border-blue-500/50 transition-all"
                      value={perceived.bs}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        const num = parseFloat(val) || 0;
                        setPerceived({
                          ...perceived, 
                          bs: val, 
                          usd: (settings.bcvRate > 0 && val) ? (num / settings.bcvRate).toFixed(2) : ''
                        });
                      }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center bg-white/5 rounded-2xl p-4 border border-white/10">
                   <div className="flex items-center gap-3">
                      <Coins className="text-[#004ea1]" size={18} />
                      <span className="text-[10px] font-black uppercase italic text-slate-400">Total Percibido ($):</span>
                   </div>
                   <span className="text-xl font-black italic text-white">${totalPerceivedUsd.toFixed(2)}</span>
                </div>
              </div>

              {changeUsd > 0 && (
                <div className="bg-emerald-600/20 border-2 border-emerald-500/30 rounded-[2rem] p-6 space-y-3 animate-in zoom-in duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-emerald-500 text-white rounded-lg flex items-center justify-center shadow-lg"><ArrowRight size={16}/></div>
                    <span className="text-[10px] font-black uppercase italic tracking-widest text-emerald-400">Vuelto Sugerido:</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-3xl font-black italic tracking-tighter text-emerald-400">${changeUsd.toFixed(2)}</span>
                    <div className="text-right">
                       <p className="text-[9px] font-black uppercase text-emerald-500/60 leading-none mb-1">Bolívares</p>
                       <p className="text-lg font-black italic text-emerald-500">Bs. {changeBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic block">Forma de Pago</label>
                  <select 
                    className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-5 py-4 text-white font-black text-xs uppercase outline-none focus:border-blue-500/50 transition-all appearance-none"
                    value={financials.paymentMethod}
                    onChange={(e) => setFinancials({...financials, paymentMethod: e.target.value as Order['paymentMethod']})}
                  >
                    <option value="EFECTIVO">EFECTIVO</option>
                    <option value="DOLARES $">DOLARES $</option>
                    <option value="PAGO MOVIL">PAGO MOVIL</option>
                    <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                    <option value="PUNTO DE VENTA">PUNTO DE VENTA</option>
                    <option value="BIOPAGO">BIOPAGO</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic block flex items-center gap-2">
                    <Zap size={12} className="text-blue-400" /> Nro de Referencia Bancaria
                  </label>
                  <input 
                    type="text" 
                    placeholder="Ej: 00998877"
                    className="w-full bg-white/10 border-2 border-blue-500/30 rounded-2xl px-5 py-4 text-white font-black text-base outline-none focus:border-blue-500 transition-all uppercase italic placeholder:text-slate-600"
                    value={financials.paymentReference}
                    onChange={(e) => setFinancials({...financials, paymentReference: e.target.value})}
                  />
                </div>
              </div>
              <div className="pt-4">
                <label className="flex items-center gap-4 cursor-pointer group bg-white/5 p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
                  <input 
                    type="checkbox" 
                    className="hidden peer" 
                    checked={!!checklistProgress['protocolo_validado']} 
                    onChange={() => setChecklistProgress({ ...checklistProgress, 'protocolo_validado': !checklistProgress['protocolo_validado'] })} 
                  />
                  <div className="w-10 h-10 rounded-xl border-2 border-white/20 peer-checked:bg-emerald-500 peer-checked:border-emerald-500 flex items-center justify-center transition-all">
                    <CheckCircle2 size={24} className={checklistProgress['protocolo_validado'] ? "text-white" : "text-white/20"} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase italic leading-none text-white">Validación Protocolo</p>
                    <p className="text-[8px] font-bold text-slate-500 uppercase italic">Confirmar checklist de venta</p>
                  </div>
                </label>
              </div>
            </div>

            <button 
              onClick={handleSubmit}
              disabled={!checklistProgress['protocolo_validado']}
              className={`w-full py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-2xl transition-all flex items-center justify-center gap-3 border-b-8 italic ${
                checklistProgress['protocolo_validado']
                  ? 'bg-[#004ea1] text-white border-blue-900 hover:bg-blue-600'
                  : 'bg-slate-100 text-slate-300 border-transparent cursor-not-allowed'
              }`}
            >
              <CheckCircle2 size={20} /> FINALIZAR VENTA DIRECTA
            </button>
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
    <label className={`text-[10px] font-black uppercase tracking-widest ml-1 italic transition-colors ${error ? 'text-red-500' : 'text-slate-400'}`}>
      {label}
    </label>
    <div className="relative">
      <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${error ? 'text-red-400' : 'text-slate-300'}`}>
        {icon}
      </div>
      <input 
        type="text" 
        className={`w-full border-2 rounded-2xl pl-12 pr-5 py-4 text-slate-800 font-bold outline-none transition-all ${error ? 'bg-red-50 border-red-200 focus:border-red-400' : 'bg-slate-50 border-transparent focus:bg-white focus:border-blue-100'}`}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
      {error && <AlertCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500" size={16} />}
    </div>
  </div>
);

export default DirectSaleForm;
