
import React, { useState } from 'react';
import { Workshop, Order, AppSettings } from '../types';
import WorkshopQueue from './WorkshopQueue';
import { 
  Warehouse, 
  Plus, 
  Trash2, 
  MessageCircle, 
  User, 
  Phone, 
  Layers,
  ChevronRight,
  Sparkles,
  Scissors,
  Zap,
  FileText,
  DollarSign,
  ExternalLink,
  X
} from 'lucide-react';

interface Props {
  workshops: Workshop[];
  setWorkshops: React.Dispatch<React.SetStateAction<Workshop[]>>;
  currentStoreId: string;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  settings: AppSettings;
}

const WorkshopManager: React.FC<Props> = ({ 
  workshops, 
  setWorkshops, 
  currentStoreId,
  orders,
  setOrders,
  settings
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingPrices, setEditingPrices] = useState<Workshop | null>(null);
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null);
  const [previewWorkshopId, setPreviewWorkshopId] = useState<string | null>(null);
  const [showInitialQueueModal, setShowInitialQueueModal] = useState(false);
  const [initialQueueText, setInitialQueueText] = useState('');
  const [newPrice, setNewPrice] = useState({ garmentType: '', priceUsd: 0 });
  const [formData, setFormData] = useState<Omit<Workshop, 'id' | 'storeId'>>({
    name: '',
    department: 'COSTURA',
    customDepartment: '',
    phone: '',
    laborPrices: [],
    specialties: [],
    dailyCapacity: 0,
    availabilityStatus: 'disponible',
    activeOrders: []
  });

  const departments = ['COSTURA', 'DTF', 'GIGANTOGRAFIA', 'TALONARIOS', 'OTRO'];
  const commonSpecialties = ['Franelas', 'Chemises', 'Camisas', 'Chaquetas', 'Gorras', 'Bolsos', 'Pantalones', 'Uniformes'];

  const handleAdd = () => {
    if (!formData.name || !formData.phone) return;
    
    if (editingWorkshop) {
      const updated = workshops.map(w => w.id === editingWorkshop.id ? { ...editingWorkshop, ...formData } : w);
      setWorkshops(updated);
      setEditingWorkshop(null);
    } else {
      const workshop: Workshop = {
        id: Math.random().toString(36).substr(2, 9),
        storeId: currentStoreId,
        ...formData
      };
      setWorkshops([...workshops, workshop]);
    }

    setFormData({ 
      name: '', 
      department: 'COSTURA', 
      customDepartment: '', 
      phone: '', 
      laborPrices: [],
      specialties: [],
      dailyCapacity: 0,
      availabilityStatus: 'disponible'
    });
    setIsAdding(false);
  };

  const handleLoadInitialQueue = () => {
    if (!initialQueueText.trim()) return;

    const lines = initialQueueText.split('\n');
    const newOrders: Order[] = [];
    const now = Date.now();
    const today = new Date().toISOString().split('T')[0];

    lines.forEach((line, index) => {
      const parts = line.split(',').map(p => p.trim());
      if (parts.length >= 3) {
        const [productName, qty, workshopName] = parts;
        const targetWorkshop = workshops.find(w => w.name.toLowerCase().includes(workshopName.toLowerCase()));
        
        if (targetWorkshop) {
          const order: Order = {
            id: `WEB-INIT-${now}-${index}`,
            orderNumber: `INIT-${index + 1}`,
            storeId: currentStoreId,
            customerName: 'CARGA INICIAL',
            customerCi: '0',
            customerPhone: '0',
            items: [{
              productId: 'initial',
              name: productName,
              quantity: parseInt(qty) || 1,
              priceUsd: 0
            }],
            totalUsd: 0,
            totalBs: 0,
            abonoUsd: 0,
            restanteUsd: 0,
            status: 'taller',
            taskStatus: 'proceso',
            history: [{
              timestamp: now,
              agentId: 'system',
              action: 'Carga inicial de cola de producción',
              status: 'taller'
            }],
            bcvRate: settings.bcvRate,
            issueDate: today,
            deliveryDate: today,
            technicalDetails: `Carga inicial: ${productName}`,
            referenceImages: [],
            assignedWorkshopIds: [targetWorkshop.id],
            workshopWorkflowStatus: { [targetWorkshop.id]: 'COSTURA' },
            paymentMethod: 'EFECTIVO',
            isInitialQueue: true
          };
          newOrders.push(order);
        }
      }
    });

    if (newOrders.length > 0) {
      setOrders([...orders, ...newOrders]);
      alert(`${newOrders.length} órdenes cargadas a la cola inicial.`);
    } else {
      alert("No se detectaron órdenes válidas. Formato: Producto, Cantidad, Nombre del Taller");
    }

    setInitialQueueText('');
    setShowInitialQueueModal(false);
  };

  const handleAddPrice = () => {
    if (!editingPrices || !newPrice.garmentType || newPrice.priceUsd <= 0) return;
    
    const updatedWorkshop = {
      ...editingPrices,
      laborPrices: [...(editingPrices.laborPrices || []), { ...newPrice }]
    };
    
    setWorkshops(workshops.map(w => w.id === updatedWorkshop.id ? updatedWorkshop : w));
    setEditingPrices(updatedWorkshop);
    setNewPrice({ garmentType: '', priceUsd: 0 });
  };

  const handleRemovePrice = (index: number) => {
    if (!editingPrices) return;
    const updatedPrices = [...(editingPrices.laborPrices || [])];
    updatedPrices.splice(index, 1);
    const updatedWorkshop = { ...editingPrices, laborPrices: updatedPrices };
    setWorkshops(workshops.map(w => w.id === updatedWorkshop.id ? updatedWorkshop : w));
    setEditingPrices(updatedWorkshop);
  };

  const getDeptIcon = (dept: string) => {
    switch (dept) {
      case 'COSTURA': return <Scissors size={18} />;
      case 'DTF': return <Zap size={18} />;
      case 'GIGANTOGRAFIA': return <Layers size={18} />;
      case 'TALONARIOS': return <FileText size={18} />;
      default: return <Sparkles size={18} />;
    }
  };

  const sendWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('58') ? cleanPhone : `58${cleanPhone}`;
    const message = encodeURIComponent(`Hola ${name}, te escribimos desde ROXTOR para consultar disponibilidad operativo.`);
    window.open(`https://wa.me/${fullPhone}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h3 className="text-3xl font-black text-[#000814] uppercase italic tracking-tighter leading-none">Aliados de Producción</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2 italic">Directorio Externo de Talleres y Maquila</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowInitialQueueModal(true)}
            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-blue-700 transition-all border-b-8 border-blue-800 shadow-xl active:translate-y-1 active:border-b-4"
          >
            <Layers size={20} />
            CARGAR COLA INICIAL
          </button>
          <button 
            onClick={() => {
              setIsAdding(!isAdding);
              setEditingWorkshop(null);
              setFormData({
                name: '',
                department: 'COSTURA',
                customDepartment: '',
                phone: '',
                laborPrices: [],
                specialties: [],
                dailyCapacity: 0,
                availabilityStatus: 'disponible',
                activeOrders: []
              });
            }}
            className="bg-[#000814] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-slate-800 transition-all border-b-8 border-slate-700 shadow-xl active:translate-y-1 active:border-b-4"
          >
            {isAdding ? <Trash2 size={20} /> : <Plus size={20} />}
            {isAdding ? 'CANCELAR' : 'REGISTRAR TALLER'}
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="bg-white border-4 border-slate-50 rounded-[3.5rem] p-10 shadow-2xl space-y-10 animate-in slide-in-from-top-6 duration-300">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-8">
            <div className="w-14 h-14 bg-[#004ea1] text-white rounded-2xl flex items-center justify-center shadow-lg rotate-3">
              <Warehouse size={28} />
            </div>
            <div>
              <h4 className="text-2xl font-black text-[#000814] uppercase italic tracking-tighter">
                {editingWorkshop ? 'Editar Aliado Externo' : 'Alta de Aliado Externo'}
              </h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">
                {editingWorkshop ? 'Actualización de datos en sistema' : 'Sincronización de base de datos'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest ml-1">Nombre Comercial / Taller *</label>
              <div className="relative">
                <User size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#004ea1] opacity-40" />
                <input 
                  type="text" 
                  placeholder="Ej: Confecciones El Diamante"
                  className="w-full bg-slate-50 border-2 border-transparent rounded-[2rem] pl-14 pr-6 py-5 text-slate-800 font-black uppercase text-xs focus:bg-white focus:border-[#004ea1]/20 outline-none transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest ml-1">Número de Contacto *</label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-[#004ea1] text-sm">+58</span>
                <input 
                  type="text" 
                  placeholder="412 1234567"
                  className="w-full bg-slate-50 border-2 border-transparent rounded-[2rem] pl-16 pr-6 py-5 text-slate-800 font-black text-sm tabular-nums focus:bg-white focus:border-[#004ea1]/20 outline-none transition-all"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest ml-1">Especialidad Operativa *</label>
              <div className="relative">
                <Layers size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#004ea1] opacity-40" />
                <select 
                  className="w-full bg-slate-50 border-2 border-transparent rounded-[2rem] pl-14 pr-6 py-5 text-slate-800 font-black uppercase text-[10px] italic outline-none focus:bg-white focus:border-[#004ea1]/20 appearance-none"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value as any})}
                >
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            {formData.department === 'OTRO' && (
              <div className="space-y-3 animate-in fade-in slide-in-from-left-4">
                <label className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest ml-1">Especificar Departamento</label>
                <input 
                  type="text" 
                  placeholder="Ej: Bordados Especiales"
                  className="w-full bg-slate-50 border-2 border-transparent rounded-[2rem] px-8 py-5 text-slate-800 font-black uppercase text-xs focus:bg-white focus:border-[#004ea1]/20 outline-none transition-all"
                  value={formData.customDepartment}
                  onChange={(e) => setFormData({...formData, customDepartment: e.target.value})}
                />
              </div>
            )}

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest ml-1">Capacidad Diaria (Unidades)</label>
              <input 
                type="number" 
                placeholder="Ej: 50"
                className="w-full bg-slate-50 border-2 border-transparent rounded-[2rem] px-8 py-5 text-slate-800 font-black text-xs focus:bg-white focus:border-[#004ea1]/20 outline-none transition-all"
                value={formData.dailyCapacity || ''}
                onChange={(e) => setFormData({...formData, dailyCapacity: parseInt(e.target.value) || 0})}
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest ml-1">Estado de Disponibilidad</label>
              <select 
                className="w-full bg-slate-50 border-2 border-transparent rounded-[2rem] px-8 py-5 text-slate-800 font-black uppercase text-[10px] italic outline-none focus:bg-white focus:border-[#004ea1]/20 appearance-none"
                value={formData.availabilityStatus}
                onChange={(e) => setFormData({...formData, availabilityStatus: e.target.value as any})}
              >
                <option value="disponible">DISPONIBLE ✅</option>
                <option value="ocupado">OCUPADO ⏳</option>
                <option value="mantenimiento">MANTENIMIENTO 🛠️</option>
              </select>
            </div>

            {formData.department === 'COSTURA' && (
              <>
                <div className="space-y-3 col-span-full">
                  <label className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest ml-1">Prendas Especializadas</label>
                  <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-[2rem] border-2 border-transparent focus-within:border-[#004ea1]/20 transition-all">
                    {commonSpecialties.map(s => (
                      <button
                        key={s}
                        onClick={() => {
                          const current = formData.specialties || [];
                          if (current.includes(s)) {
                            setFormData({...formData, specialties: current.filter(x => x !== s)});
                          } else {
                            setFormData({...formData, specialties: [...current, s]});
                          }
                        }}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase italic transition-all ${
                          formData.specialties?.includes(s) 
                            ? 'bg-[#004ea1] text-white shadow-lg scale-105' 
                            : 'bg-white text-slate-400 border border-slate-100'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                    <input 
                      type="text" 
                      placeholder="+ Otro"
                      className="bg-transparent border-none outline-none text-[10px] font-black uppercase italic text-slate-800 w-24 ml-2"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val && !formData.specialties?.includes(val)) {
                            setFormData({...formData, specialties: [...(formData.specialties || []), val]});
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <button 
            onClick={handleAdd}
            className="w-full bg-[#000814] text-white py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-slate-800 transition-all border-b-8 border-slate-700 italic active:translate-y-1 active:border-b-4 shadow-2xl"
          >
            GUARDAR ALIADO EN DIRECTORIO
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workshops.length === 0 ? (
          <div className="col-span-full py-32 text-center border-4 border-dashed border-slate-100 rounded-[4rem] opacity-20 bg-slate-50/50">
            <Warehouse size={80} className="mx-auto mb-6" />
            <p className="font-black uppercase tracking-[0.4em] text-sm italic">Directorio de Talleres Vacío</p>
          </div>
        ) : (
          workshops.map(workshop => (
            <div key={workshop.id} className="bg-white border-4 border-slate-50 p-8 rounded-[3.5rem] shadow-sm hover:shadow-2xl transition-all group flex flex-col border-l-8 border-l-[#000814] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rotate-12 group-hover:scale-110 duration-700">
                {getDeptIcon(workshop.department)}
              </div>
              
              <div className="flex items-center gap-5 mb-8">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-[#004ea1] shadow-inner group-hover:bg-[#000814] group-hover:text-white transition-all duration-500">
                  {getDeptIcon(workshop.department)}
                </div>
                <div className="space-y-1 overflow-hidden">
                  <h5 className="font-black text-[#000814] uppercase text-sm tracking-tighter italic truncate">{workshop.name}</h5>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] bg-[#004ea1] text-white font-black uppercase tracking-widest px-2.5 py-1 rounded-lg italic">
                      {workshop.department === 'OTRO' ? workshop.customDepartment : workshop.department}
                    </span>
                    {workshop.availabilityStatus && (
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg italic ${
                        workshop.availabilityStatus === 'disponible' ? 'bg-emerald-500 text-white' : 
                        workshop.availabilityStatus === 'ocupado' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
                      }`}>
                        {workshop.availabilityStatus}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-6 space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase italic">Capacidad Diaria</p>
                  <p className="text-[10px] font-black text-[#000814] italic">{workshop.dailyCapacity || 0} Uds</p>
                </div>
                {workshop.department === 'COSTURA' && (
                  <div className="flex flex-wrap gap-1">
                    {workshop.specialties?.map((s, i) => (
                      <span key={i} className="text-[7px] bg-slate-100 text-slate-500 font-bold uppercase px-2 py-0.5 rounded-md italic">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 mt-auto">
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setEditingPrices(workshop)}
                    className="flex items-center justify-center gap-3 bg-blue-50 text-[#004ea1] px-4 py-4 rounded-2xl border-2 border-blue-100 hover:bg-[#004ea1] hover:text-white transition-all shadow-sm font-black text-[9px] uppercase tracking-widest italic"
                  >
                    <DollarSign size={16} /> PRECIOS
                  </button>
                  <button 
                    onClick={() => {
                      setEditingWorkshop(workshop);
                      setFormData({
                        name: workshop.name,
                        department: workshop.department,
                        customDepartment: workshop.customDepartment || '',
                        phone: workshop.phone,
                        laborPrices: workshop.laborPrices || [],
                        specialties: workshop.specialties || [],
                        dailyCapacity: workshop.dailyCapacity || 0,
                        availabilityStatus: workshop.availabilityStatus || 'disponible',
                        activeOrders: workshop.activeOrders || []
                      });
                      setIsAdding(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex items-center justify-center gap-3 bg-slate-50 text-slate-600 px-4 py-4 rounded-2xl border-2 border-slate-100 hover:bg-slate-200 transition-all shadow-sm font-black text-[9px] uppercase tracking-widest italic"
                  >
                    <Plus size={16} className="rotate-45" /> EDITAR
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setPreviewWorkshopId(workshop.id)}
                    className="flex items-center justify-center gap-3 bg-blue-50 text-[#004ea1] px-4 py-4 rounded-2xl border-2 border-blue-100 hover:bg-[#004ea1] hover:text-white transition-all shadow-sm font-black text-[9px] uppercase tracking-widest italic"
                  >
                    <Warehouse size={16} /> VISTA PREVIA
                  </button>
                  <button 
                    onClick={() => window.open(`${window.location.origin}/taller/${workshop.id}`, '_blank')}
                    className="flex items-center justify-center gap-3 bg-indigo-50 text-indigo-600 px-4 py-4 rounded-2xl border-2 border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm font-black text-[9px] uppercase tracking-widest italic"
                  >
                    <ExternalLink size={16} /> ENLACE
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => sendWhatsApp(workshop.phone, workshop.name)}
                    className="flex items-center justify-center gap-3 bg-emerald-50 text-emerald-600 px-4 py-4 rounded-2xl border-2 border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all shadow-sm font-black text-[9px] uppercase tracking-widest italic"
                  >
                    <MessageCircle size={16} /> WHATSAPP
                  </button>
                  <button 
                    onClick={() => setWorkshops(workshops.filter(w => w.id !== workshop.id))}
                    className="flex items-center justify-center gap-3 bg-slate-50 text-slate-300 px-4 py-4 rounded-2xl border-2 border-transparent hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all font-black text-[9px] uppercase tracking-widest italic"
                  >
                    <Trash2 size={16} /> ELIMINAR
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {/* Modal de Carga Inicial */}
      {showInitialQueueModal && (
        <div className="fixed inset-0 z-[200] bg-[#000814]/95 backdrop-blur-2xl flex items-center justify-center p-6 italic">
          <div className="bg-white w-full max-w-2xl rounded-[4rem] p-10 shadow-2xl space-y-8 animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-slate-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <Layers size={24} />
                </div>
                <div>
                  <h4 className="text-2xl font-black uppercase italic tracking-tighter text-[#000814]">Carga Inicial de Producción</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase italic">Medición de capacidad real sin montos monetarios</p>
                </div>
              </div>
              <button onClick={() => setShowInitialQueueModal(false)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-red-500 transition-all">
                <X size={24}/>
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-500 uppercase italic bg-blue-50 p-4 rounded-2xl border border-blue-100">
                Instrucciones: Ingrese una orden por línea con el formato:<br/>
                <span className="text-blue-600 font-bold">Producto, Cantidad, Nombre del Taller</span><br/>
                Ejemplo: Franela Microdurazno, 50, Taller El Diamante
              </p>
              <textarea 
                className="w-full h-64 bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-8 text-xs font-black uppercase italic outline-none focus:border-blue-200 transition-all resize-none"
                placeholder="Franela Microdurazno, 50, Taller El Diamante&#10;Chemise Piquet, 20, Taller Central"
                value={initialQueueText}
                onChange={(e) => setInitialQueueText(e.target.value)}
              />
            </div>

            <button 
              onClick={handleLoadInitialQueue}
              className="w-full bg-blue-600 text-white py-6 rounded-[2.5rem] font-black uppercase shadow-2xl hover:bg-blue-700 italic text-xs tracking-widest border-b-8 border-blue-800 active:translate-y-1 transition-all"
            >
              PROCESAR CARGA INICIAL
            </button>
          </div>
        </div>
      )}

      {editingPrices && (
        <div className="fixed inset-0 z-[200] bg-[#000814]/95 backdrop-blur-2xl flex items-center justify-center p-6 italic">
          <div className="bg-white w-full max-w-2xl rounded-[4rem] p-10 shadow-2xl space-y-8 animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-slate-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#004ea1] text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <DollarSign size={24} />
                </div>
                <div>
                  <h4 className="text-2xl font-black uppercase italic tracking-tighter text-[#000814]">Precios por Confección</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase italic">{editingPrices.name}</p>
                </div>
              </div>
              <button onClick={() => setEditingPrices(null)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-red-500 transition-all">
                <X size={24}/>
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase italic ml-1">Tipo de Prenda / Servicio</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Franela Microdurazno"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xs font-black uppercase italic outline-none"
                    value={newPrice.garmentType}
                    onChange={(e) => setNewPrice({...newPrice, garmentType: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase italic ml-1">Precio Mano de Obra ($)</label>
                  <div className="flex gap-3">
                    <input 
                      type="number" 
                      placeholder="1.50"
                      className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xs font-black outline-none"
                      value={newPrice.priceUsd || ''}
                      onChange={(e) => setNewPrice({...newPrice, priceUsd: parseFloat(e.target.value) || 0})}
                    />
                    <button 
                      onClick={handleAddPrice}
                      className="bg-[#000814] text-white px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all"
                    >
                      AGREGAR
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-[2.5rem] p-8 space-y-4 max-h-[300px] overflow-y-auto no-scrollbar">
                {(editingPrices.laborPrices || []).length === 0 ? (
                  <p className="text-center text-[10px] font-black text-slate-300 uppercase italic py-10">No hay precios configurados</p>
                ) : (
                  editingPrices.laborPrices?.map((lp, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-2xl flex justify-between items-center shadow-sm border-2 border-transparent hover:border-blue-100 transition-all">
                      <div>
                        <p className="font-black text-[#000814] uppercase text-xs italic">{lp.garmentType}</p>
                        <p className="text-[10px] font-bold text-[#004ea1] italic tracking-widest">${lp.priceUsd.toFixed(2)} por unidad</p>
                      </div>
                      <button 
                        onClick={() => handleRemovePrice(idx)}
                        className="p-3 text-slate-300 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button 
              onClick={() => setEditingPrices(null)}
              className="w-full bg-[#000814] text-white py-6 rounded-[2.5rem] font-black uppercase shadow-2xl hover:bg-slate-800 italic text-xs tracking-widest border-b-8 border-slate-900 active:translate-y-1 transition-all"
            >
              FINALIZAR CONFIGURACIÓN
            </button>
          </div>
        </div>
      )}
      {/* Modal de Vista Previa */}
      {previewWorkshopId && (
        <div className="fixed inset-0 bg-[#000814]/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 md:p-10 overflow-y-auto">
          <div className="bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
            <div className="p-6 border-b-2 border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-black text-[#000814] uppercase italic">Simulación de Interfaz de Taller</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Así es como el taller verá su cola de trabajo</p>
              </div>
              <button 
                onClick={() => setPreviewWorkshopId(null)}
                className="p-4 bg-white rounded-2xl text-slate-400 hover:text-red-500 shadow-sm transition-all"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-100">
              <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border-8 border-white">
                <WorkshopQueue 
                  workshopId={previewWorkshopId}
                  orders={orders}
                  setOrders={setOrders}
                  settings={settings}
                  workshops={workshops}
                />
              </div>
            </div>

            <div className="p-6 bg-blue-600 text-white text-center">
              <p className="text-xs font-black uppercase tracking-widest italic">
                💡 Esta es una vista previa interactiva. Los cambios realizados aquí afectarán a las órdenes reales.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkshopManager;
