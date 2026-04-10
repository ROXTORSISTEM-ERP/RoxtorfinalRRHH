
import React, { useState, useMemo } from 'react';
import Workflow from './Workflow';
import ServiceOrderForm from './ServiceOrderForm';
import DirectSaleForm from './DirectSaleForm';
import CashClosing from './CashClosing';
import VoiceAssistant from './VoiceAssistant';
import VoiceStudio from './VoiceStudio'; 
import OrderReceipt from './OrderReceipt';
import CRM from './CRM';
import { exportToCSV } from '../utils/csvExport';
import { 
  Layers, 
  PlusCircle,
  Zap,
  Calculator,
  Mic,
  Users,
  MapPin,
  ChevronRight,
  ShieldCheck,
  LogOut,
  BookOpen,
  MessageSquare,
  MessageCircle,
  Calendar,
  Clock,
  Play,
  Headphones,
  Key,
  X,
  Loader2,
  CheckCircle,
  Contact
} from 'lucide-react';

import { Order, Product, Agent, AppSettings, Workshop, Expense, Debt, RadarAlert, Lead } from '../types';

interface Props {
  orders: Order[];
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  debts: Debt[];
  setDebts: React.Dispatch<React.SetStateAction<Debt[]>>;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  products: Product[];
  agents: Agent[];
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
  workshops: Workshop[];
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  currentStoreId: string;
  radarAlerts: RadarAlert[];
  setRadarAlerts: React.Dispatch<React.SetStateAction<RadarAlert[]>>;
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
}

const SubNavItem = ({ active, onClick, icon, label, highlight }: any) => (
  <button 
    onClick={onClick} 
    className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl transition-all duration-300 whitespace-nowrap ${
      active 
        ? 'bg-white text-[#000814] shadow-md font-black' 
        : highlight 
          ? 'text-rose-500 hover:text-rose-600 hover:bg-rose-50 font-bold'
          : 'text-slate-500 hover:text-white hover:bg-white/5 font-bold'
    }`}
  >
    {icon}
    <span className="text-[10px] uppercase tracking-widest italic">{label}</span>
  </button>
);

const Operaciones: React.FC<Props> = ({ 
  orders, 
  expenses,
  setExpenses,
  debts,
  setDebts,
  setOrders, 
  products, 
  agents, 
  setAgents,
  workshops,
  settings, 
  setSettings, 
  currentStoreId,
  radarAlerts,
  setRadarAlerts,
  leads,
  setLeads
}) => {
  const [subTab, setSubTab] = useState<'flow' | 'orders' | 'direct' | 'cash' | 'voice' | 'studio' | 'manual' | 'auto' | 'crm'>('flow');
  const [sessionAgentId, setSessionAgentId] = useState<string | null>(null);
  const [sessionStoreId, setSessionStoreId] = useState<string>(currentStoreId);
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<Order | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<'idle' | 'checking' | 'success' | 'error' | 'far'>('idle');
  const [attendanceError, setAttendanceError] = useState('');
  
  // Estado para validación de PIN de agente
  const [pendingAgent, setPendingAgent] = useState<Agent | null>(null);
  const [agentPinInput, setAgentPinInput] = useState('');

  const selectedAgent = agents.find(a => a.id === sessionAgentId);
  const selectedStore = settings?.stores?.find(s => s.id === sessionStoreId);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleAttendance = () => {
    if (!selectedAgent || !selectedStore) return;
    
    setAttendanceStatus('checking');
    
    if (!navigator.geolocation) {
      setAttendanceStatus('error');
      setAttendanceError('Geolocalización no soportada');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Si la tienda no tiene coordenadas, permitimos marcar (para demo o si no se han configurado)
        // Pero si las tiene, validamos 200 metros
        if (selectedStore.lat && selectedStore.lng) {
          const distance = getDistance(latitude, longitude, selectedStore.lat, selectedStore.lng);
          if (distance > 200) {
            setAttendanceStatus('far');
            setAttendanceError(`Estás muy lejos de la tienda (${Math.round(distance)}m). Debes estar en el local.`);
            return;
          }
        }

        const today = new Date().toISOString().split('T')[0];
        const newRecord = {
          id: Math.random().toString(36).substr(2, 9),
          date: today,
          checkIn: Date.now(),
          status: 'presente' as const,
          locationVerified: true,
          storeId: selectedStore.id
        };

        setAgents(prev => prev.map(a => {
          if (a.id === selectedAgent.id) {
            const attendance = a.attendance || [];
            if (attendance.some(r => r.date === today)) return a;
            return { ...a, attendance: [...attendance, newRecord] };
          }
          return a;
        }));
        
        setAttendanceStatus('success');
        setTimeout(() => setAttendanceStatus('idle'), 3000);
      },
      (error) => {
        setAttendanceStatus('error');
        setAttendanceError('Error al obtener ubicación. Asegúrate de permitir el acceso.');
      },
      { enableHighAccuracy: true }
    );
  };

  const hasMarkedToday = useMemo(() => {
    if (!selectedAgent) return false;
    const today = new Date().toISOString().split('T')[0];
    return selectedAgent.attendance?.some(r => r.date === today);
  }, [selectedAgent]);

  const exportSessionOrdersCSV = () => {
    const sessionOrders = orders.filter(o => o.storeId === sessionStoreId);
    const data = sessionOrders.map(o => ({
      Orden: o.orderNumber,
      Cliente: o.customerName,
      Status: o.status,
      Total_USD: o.totalUsd,
      Total_BS: (o.totalUsd * (o.bcvRate || 1)).toFixed(2),
      Abono_USD: o.abonoUsd,
      Abono_BS: (o.abonoUsd * (o.bcvRate || 1)).toFixed(2),
      Restante_USD: o.restanteUsd,
      Tasa_BCV: (o.bcvRate || 1).toFixed(2),
      Fecha_Entrega: o.deliveryDate,
      Sede: selectedStore?.name || 'N/A'
    }));
    exportToCSV(data, `Ordenes_Sesion_${selectedStore?.name}_${Date.now()}`);
  };

  const parseDate = (d: string) => {
    if (!d) return 0;
    try {
        const [day, month, year] = d.split('/').map(Number);
        return new Date(year, month - 1, day).getTime();
    } catch (e) { return 0; }
  };

  const agentWorkload = useMemo(() => {
    if (!sessionAgentId) return [];
    return orders
      .filter(o => o.assignedAgentId === sessionAgentId && o.status !== 'completado')
      .sort((a, b) => parseDate(a.deliveryDate) - parseDate(b.deliveryDate));
  }, [orders, sessionAgentId]);

  const autoReadyOrders = useMemo(() => {
    const highPriorityPhases = ['bordado', 'sublimación', 'corte_vinil', 'planchado', 'impresión', 'taller'];
    return orders.filter(o => o.status !== 'completado' && (highPriorityPhases.includes(o.status) || o.taskStatus === 'terminado'));
  }, [orders]);

  // Lógica de Alertas de Taller (4 días antes de entrega)
  React.useEffect(() => {
    const checkWorkshopAlerts = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newAlerts: RadarAlert[] = [];

      orders.forEach(order => {
        if (order.taskStatus === 'confeccion' && order.status !== 'completado' && order.deliveryDate) {
          try {
            const parts = order.deliveryDate.split('/');
            if (parts.length !== 3) return;
            const [day, month, year] = parts.map(Number);
            const deliveryDate = new Date(year, month - 1, day);
            
            const diffTime = deliveryDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Alerta a los 4 días o menos antes de la entrega
            if (diffDays <= 4 && diffDays >= 0) {
              const alertId = `workshop-delay-${order.id}`;
              
              if (!radarAlerts.some(a => a.id === alertId)) {
                newAlerts.push({
                  id: alertId,
                  timestamp: Date.now(),
                  message: `⚠️ DEMORA TALLER: Orden #${order.orderNumber} (${order.customerName}) - Entrega en ${diffDays} días.`,
                  customerName: order.customerName,
                  customerPhone: order.customerPhone,
                  status: 'pending'
                });
              }
            }
          } catch (e) { console.error("Error parsing delivery date for alert:", e); }
        }
      });

      if (newAlerts.length > 0) {
        setRadarAlerts(prev => [...prev, ...newAlerts]);
      }
    };

    const timer = setTimeout(checkWorkshopAlerts, 2000); // Ejecutar poco después de cargar
    return () => clearTimeout(timer);
  }, [orders, radarAlerts, setRadarAlerts]);

  const handleAgentClick = (agent: Agent) => {
    setPendingAgent(agent);
    setAgentPinInput('');
  };

  const handlePinSubmit = (digit: string) => {
    if (!pendingAgent) return;
    const newPin = agentPinInput + digit;
    if (newPin.length <= 6) {
      setAgentPinInput(newPin);
      if (newPin.length === 6) {
        if (newPin === (pendingAgent.pin || '102030')) {
          setSessionAgentId(pendingAgent.id);
          setPendingAgent(null);
          setAgentPinInput('');
        } else {
          alert("PIN INCORRECTO. Intente de nuevo.");
          setAgentPinInput('');
        }
      }
    }
  };

  if (!sessionAgentId) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-[#000814] text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl rotate-3">
             <Users size={40} />
          </div>
          <h2 className="text-4xl font-black text-[#000814] uppercase italic tracking-tighter">Acceso Operador</h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest italic">Seleccione su identificación y sucursal de hoy</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-10 shadow-sm space-y-8">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                 <MapPin className="text-[#004ea1]" size={20} />
                 <h4 className="text-sm font-black uppercase italic text-slate-800">Sede de Trabajo</h4>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {settings.stores.map(s => (
                  <button 
                    key={s.id} 
                    onClick={() => setSessionStoreId(s.id)}
                    className={`p-6 rounded-[2rem] border-4 text-left transition-all relative overflow-hidden ${sessionStoreId === s.id ? 'bg-[#004ea1] border-[#004ea1] text-white shadow-xl shadow-blue-100 scale-[1.02]' : 'bg-slate-50 border-transparent text-slate-400 hover:border-slate-100'}`}
                  >
                    <span className="text-[10px] font-black uppercase italic opacity-50 block mb-1">NODO ACTIVO</span>
                    <span className="text-lg font-black uppercase italic tracking-tighter">{s.name}</span>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10"><MapPin size={40}/></div>
                  </button>
                ))}
              </div>
           </div>

           <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-10 shadow-sm space-y-8">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                 <ShieldCheck className="text-emerald-500" size={20} />
                 <h4 className="text-sm font-black uppercase italic text-slate-800">Identidad del Agente</h4>
              </div>
              <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                {agents.filter(a => a.storeId === sessionStoreId || a.storeId === 'global').map(agent => (
                  <button 
                    key={agent.id} 
                    onClick={() => handleAgentClick(agent)}
                    className="group w-full p-6 bg-white border-2 border-slate-100 rounded-[2.5rem] hover:border-[#000814] hover:shadow-xl transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-[#000814] group-hover:text-white transition-all">
                          <Users size={20} />
                       </div>
                       <div className="text-left">
                          <p className="font-black text-slate-800 uppercase italic text-sm">{agent.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase italic">{agent.role}</p>
                       </div>
                    </div>
                    <ChevronRight size={20} className="text-slate-200 group-hover:text-[#004ea1] group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
           </div>
        </div>

        {/* Modal de PIN para Agente */}
        {pendingAgent && (
          <div className="fixed inset-0 z-[200] bg-[#000814]/95 backdrop-blur-2xl flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[4rem] p-12 shadow-2xl flex flex-col items-center space-y-10 border-8 border-white/10 animate-in zoom-in-95">
              <div className="flex justify-between w-full items-center">
                 <button onClick={() => setPendingAgent(null)} className="p-3 bg-slate-50 rounded-2xl text-slate-300 hover:text-red-500 transition-all"><X size={24}/></button>
                 <div className="text-center">
                   <h4 className="font-black text-xl uppercase tracking-tighter italic text-[#000814]">{pendingAgent.name}</h4>
                   <p className="text-[9px] font-black text-[#004ea1] uppercase italic tracking-widest">VALIDACIÓN DE IDENTIDAD</p>
                 </div>
                 <div className="w-12 h-12 bg-[#000814] text-white rounded-2xl flex items-center justify-center shadow-lg"><Key size={20}/></div>
              </div>

              <div className="flex gap-5">
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <div key={i} className={`w-5 h-5 rounded-full transition-all duration-300 ${agentPinInput.length > i ? 'bg-[#004ea1] scale-125 shadow-[0_0_15px_#004ea1]' : 'bg-slate-100'}`} />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4 w-full">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '←'].map(v => (
                  <button 
                    key={v} 
                    onClick={() => {
                      if (v === 'C') setAgentPinInput('');
                      else if (v === '←') setAgentPinInput(agentPinInput.slice(0, -1));
                      else handlePinSubmit(v.toString());
                    }}
                    className="h-16 rounded-[1.5rem] bg-slate-50 border-2 border-slate-100 font-black text-[#000814] hover:bg-[#000814] hover:text-white active:scale-90 transition-all flex items-center justify-center text-xl italic"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="bg-[#000814] rounded-[3rem] p-10 text-white flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12"><Zap size={200}/></div>
         <div className="flex items-center gap-8 relative z-10">
            <div className="w-20 h-20 bg-[#004ea1] text-white rounded-[2rem] flex items-center justify-center shadow-lg shadow-blue-500/20 italic font-black text-3xl rotate-3">
              {(selectedAgent?.name || 'A')[0]}
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Sesión activa en: {selectedStore?.name}</p>
              <h3 className="text-3xl font-black italic tracking-tighter uppercase">{selectedAgent?.name}</h3>
            </div>
         </div>
         <div className="flex items-center gap-6 relative z-10">
            {!hasMarkedToday && (
              <button 
                onClick={handleAttendance}
                disabled={attendanceStatus === 'checking' || attendanceStatus === 'success'}
                className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest italic flex items-center gap-2 transition-all shadow-lg border-b-4 ${
                  attendanceStatus === 'checking' ? 'bg-slate-700 text-slate-400 cursor-wait border-slate-800' :
                  attendanceStatus === 'success' ? 'bg-emerald-500 text-white border-emerald-700' :
                  attendanceStatus === 'far' || attendanceStatus === 'error' ? 'bg-rose-500 text-white border-rose-700 animate-shake' :
                  'bg-emerald-600 text-white border-emerald-800 hover:bg-emerald-500 hover:scale-105 active:scale-95'
                }`}
              >
                {attendanceStatus === 'checking' ? <Loader2 className="animate-spin" size={14} /> : 
                 attendanceStatus === 'success' ? <ShieldCheck size={14} /> : <MapPin size={14} />}
                {attendanceStatus === 'checking' ? 'VERIFICANDO...' :
                 attendanceStatus === 'success' ? 'ASISTENCIA OK' :
                 attendanceStatus === 'far' ? 'FUERA DE RANGO' :
                 attendanceStatus === 'error' ? 'ERROR GPS' : 'MARCAR ENTRADA'}
              </button>
            )}
            
            {hasMarkedToday && (
              <div className="px-6 py-3 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center gap-2 text-emerald-400 font-black text-[10px] uppercase italic shadow-inner">
                <ShieldCheck size={14} /> ENTRADA: {new Date(selectedAgent?.attendance?.find(r => r.date === new Date().toISOString().split('T')[0])?.checkIn || 0).toLocaleTimeString()}
              </div>
            )}
            <button 
              onClick={exportSessionOrdersCSV}
              className="bg-white/10 border border-white/20 px-6 py-3 rounded-2xl text-[9px] font-black uppercase italic hover:bg-white/20 transition-all"
            >
              Exportar CSV Sesión
            </button>
            <div className="bg-white/5 border border-white/10 px-8 py-3 rounded-2xl text-center backdrop-blur-md">
               <p className="text-[9px] font-black text-slate-500 uppercase italic">Mis Trabajos en Cola</p>
               <p className="text-2xl font-black italic text-blue-400 tabular-nums">{agentWorkload.length}</p>
            </div>
            <button onClick={() => setSessionAgentId(null)} className="w-14 h-14 bg-rose-600/20 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-lg">
               <LogOut size={24} />
            </button>
         </div>
      </div>

      <div className="bg-white/80 backdrop-blur-md rounded-[3rem] p-3 flex flex-wrap lg:flex-nowrap gap-2 shadow-sm border border-slate-100 overflow-x-auto no-scrollbar">
        <SubNavItem active={subTab === 'flow'} onClick={() => setSubTab('flow')} icon={<Layers size={18}/>} label="Combate" />
        <SubNavItem active={subTab === 'auto'} onClick={() => setSubTab('auto')} icon={<Play size={18} className="text-[#004ea1] animate-pulse" />} label="MODO AUTO" />
        <SubNavItem active={subTab === 'orders'} onClick={() => setSubTab('orders')} icon={<PlusCircle size={18} className="text-rose-500" />} label="Cargar Pedido" highlight />
        <SubNavItem active={subTab === 'crm'} onClick={() => setSubTab('crm')} icon={<Contact size={18} className="text-emerald-500" />} label="CRM" />
        <SubNavItem active={subTab === 'studio'} onClick={() => setSubTab('studio')} icon={<Headphones size={18} className="text-emerald-500" />} label="Voice Studio" />
        <SubNavItem active={subTab === 'voice'} onClick={() => setSubTab('voice')} icon={<Mic size={18} className="text-blue-500" />} label="Simulador AI" />
        <SubNavItem active={subTab === 'direct'} onClick={() => setSubTab('direct')} icon={<Zap size={18} className="text-[#004ea1]" />} label="Venta Rápida" />
        <SubNavItem active={subTab === 'cash'} onClick={() => setSubTab('cash')} icon={<Calculator size={18} className="text-emerald-500" />} label="Caja" />
      </div>

      <div className="min-h-[60vh]">
        {subTab === 'flow' && (
           <div className="space-y-16">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {agentWorkload.map((order, idx) => {
                  const urgent = order.deliveryDate ? true : false;
                  return (
                    <div key={`${order.id}-${idx}`} className={`bg-white border-2 border-slate-50 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl transition-all relative group flex flex-col h-full border-l-[12px] border-l-[#004ea1]`}>
                       <div className="flex flex-col mb-6">
                         <div className="flex justify-between items-start mb-3">
                           <h5 className="text-[9px] font-black text-slate-400 uppercase italic tracking-widest truncate max-w-[160px]">{order.customerName}</h5>
                           <div className={`px-3 py-1 rounded-xl text-[8px] font-black uppercase italic shadow-sm bg-blue-50 text-[#004ea1]`}>
                              {order.status.toUpperCase()}
                           </div>
                         </div>
                         <p className="text-4xl font-black text-[#000814] italic tabular-nums leading-none tracking-tighter mb-4">#{order.orderNumber}</p>
                         <div className="flex items-center gap-3 text-slate-400 font-black italic text-sm">
                           <Calendar size={18} className="text-[#004ea1]" /> {order.deliveryDate}
                         </div>
                       </div>
                       <button onClick={() => setSubTab('flow')} className={`w-full py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest italic shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-3 border-b-4 bg-[#000814] text-white border-slate-800`}>
                          GESTIONAR TAREA <ChevronRight size={18} />
                       </button>
                    </div>
                  );
                })}
              </div>
              <div className="pt-20 border-t-2 border-slate-100">
                <Workflow orders={orders} setOrders={setOrders} settings={settings} agents={agents} workshops={workshops} products={products} debts={debts} setDebts={setDebts} radarAlerts={radarAlerts} setRadarAlerts={setRadarAlerts} />
              </div>
           </div>
        )}
        {subTab === 'auto' && (
           <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {autoReadyOrders.map((order, idx) => (
                  <div key={`${order.id}-${idx}`} className="bg-white border-2 border-slate-50 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all relative group flex flex-col h-full border-l-[12px] border-l-emerald-500">
                     <div className="flex justify-between items-start mb-4">
                        <div>
                           <h5 className="text-[9px] font-black text-slate-400 uppercase italic tracking-widest">{order.customerName}</h5>
                           <p className="text-4xl font-black text-[#000814] italic tracking-tighter">#{order.orderNumber}</p>
                        </div>
                     </div>
                     <button onClick={() => window.dispatchEvent(new CustomEvent('autoFinishOrder', { detail: order.id }))} className="w-full bg-[#000814] text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] italic flex items-center justify-center gap-3 border-b-4 border-slate-800 hover:bg-emerald-600 transition-all shadow-xl">
                        <MessageCircle size={18} /> FINALIZAR TODO
                     </button>
                  </div>
                ))}
              </div>
              <div className="hidden"><Workflow orders={orders} setOrders={setOrders} settings={settings} agents={agents} workshops={workshops} products={products} debts={debts} setDebts={setDebts} radarAlerts={radarAlerts} setRadarAlerts={setRadarAlerts} /></div>
           </div>
        )}
        {subTab === 'orders' && <ServiceOrderForm products={products} settings={settings} setSettings={setSettings} agents={agents} workshops={workshops} currentStoreId={sessionStoreId} currentAgentId={sessionAgentId} onSave={(newOrder) => {
          setOrders([newOrder, ...orders]);
          setSelectedOrderForPrint(newOrder);
        }} />}
        {subTab === 'studio' && <VoiceStudio products={products} settings={settings} />}
        {subTab === 'voice' && <VoiceAssistant products={products} settings={settings} />}
        {subTab === 'direct' && <DirectSaleForm products={products} settings={settings} setSettings={setSettings} currentStoreId={sessionStoreId} onSave={(newSale) => {
          setOrders([newSale, ...orders]);
          setSelectedOrderForPrint(newSale);
        }} />}
        {subTab === 'cash' && <CashClosing orders={orders} expenses={expenses} setExpenses={setExpenses} settings={settings} agents={agents} filterStoreId={sessionStoreId} />}
        {subTab === 'crm' && <CRM leads={leads} onUpdateLeads={setLeads} orders={orders} />}
      </div>

      {selectedOrderForPrint && (
        <OrderReceipt 
          order={selectedOrderForPrint} 
          settings={settings} 
          workshops={workshops}
          onClose={() => setSelectedOrderForPrint(null)} 
        />
      )}
    </div>
  );
};

export default Operaciones;
