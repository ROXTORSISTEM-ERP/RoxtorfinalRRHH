
import React, { useState, useMemo } from 'react';
import { Agent, Order, Expense, StoreConfig, AttendanceRecord } from '../types';
import { 
  UserPlus, 
  Trash2, 
  ShieldCheck, 
  Scissors, 
  Paintbrush, 
  Briefcase, 
  User, 
  Phone, 
  Star, 
  MessageCircle,
  ExternalLink,
  History,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Edit2,
  FileText,
  TrendingUp,
  Search,
  CheckCircle,
  Coins,
  MinusCircle,
  Key,
  MapPin,
  DollarSign,
  Calculator
} from 'lucide-react';

interface Props {
  agents: Agent[];
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
  orders: Order[];
  expenses: Expense[];
  currentStoreId: string;
  stores?: StoreConfig[]; // Hacemos opcional pero lo usaremos si está disponible
}

const TeamManager: React.FC<Props & { stores?: any }> = ({ agents, setAgents, orders, expenses, currentStoreId, stores = [] }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [editingPrices, setEditingPrices] = useState<Agent | null>(null);
  const [newPrice, setNewPrice] = useState({ garmentType: '', priceUsd: 0 });
  const [viewHistoryAgent, setViewHistoryAgent] = useState<Agent | null>(null);
  const [historyFilter, setHistoryFilter] = useState<'todos' | 'atiempo' | 'tarde' | 'anticipos'>('todos');
  
  const [newAgent, setNewAgent] = useState({ 
    name: '', // This will be the nickname
    fullName: '',
    idNumber: '',
    nickname: '',
    role: 'AGENTE DE VENTAS',
    specialty: '',
    phone: '',
    pin: '',
    storeId: currentStoreId,
    hourlyRateUsd: 0,
    salaryType: 'fijo' as any,
    salaryAmountUsd: 0,
    commissionPercent: 10,
    entryDate: new Date().toISOString().split('T')[0]
  });

  const calculateHourlyRate = (type: string, amount: number) => {
    // Basado en 45 horas semanales
    if (type === 'semanal') return Number((amount / 45).toFixed(2));
    if (type === 'quincenal' || type === 'comision/quincena') return Number((amount / 90).toFixed(2));
    return 0;
  };

  const parseOrderDate = (dateStr: string) => {
    if (!dateStr) return 0;
    const [d, m, y] = dateStr.split('/').map(Number);
    return new Date(y, m - 1, d, 23, 59, 59).getTime();
  };

  const getAbsences = (attendance: AttendanceRecord[] = []) => {
    const today = new Date();
    const currentDay = today.getDate();
    let workDays = 0;
    for (let i = 1; i <= currentDay; i++) {
      const d = new Date(today.getFullYear(), today.getMonth(), i);
      if (d.getDay() !== 0) workDays++;
    }
    const presentDays = attendance.filter(r => {
      const d = new Date(r.date);
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    }).length;
    return Math.max(0, workDays - presentDays);
  };

  const getAgentStats = (agentId: string) => {
    let completedCount = 0;
    let onTimeCount = 0;
    let lateCount = 0;

    orders.forEach(order => {
      const deadline = parseOrderDate(order.deliveryDate);
      const participations = order.history.filter(h => 
        h.agentId === agentId && h.action.includes('[TASK_OK]')
      );

      participations.forEach(p => {
        completedCount++;
        if (p.timestamp <= deadline) onTimeCount++;
        else lateCount++;
      });
    });

    const pendingCount = orders.filter(o => o.assignedAgentId === agentId && o.status !== 'completado').length;
    const agentAdvances = expenses.filter(e => e.agentId === agentId && e.isAdvance);
    const totalAdvances = agentAdvances.reduce((acc, curr) => acc + curr.amountUsd, 0);

    return { 
      completed: completedCount, 
      pending: pendingCount, 
      onTime: onTimeCount, 
      late: lateCount,
      totalAdvances,
      efficiency: completedCount > 0 ? Math.round((onTimeCount / completedCount) * 100) : 0
    };
  };

  const handleAdd = () => {
    if (!newAgent.name || !newAgent.pin || newAgent.pin.length !== 6) {
      alert("Por favor ingrese el Nombre y un PIN de 6 dígitos.");
      return;
    }

    // Calcular Tarifa Hora Automática si es fijo/semanal/quincenal
    let calculatedHourlyRate = newAgent.hourlyRateUsd;
    if (newAgent.salaryType === 'semanal' || newAgent.salaryType === 'quincenal' || newAgent.salaryType === 'comision/quincena') {
      calculatedHourlyRate = calculateHourlyRate(newAgent.salaryType, newAgent.salaryAmountUsd);
    } else if (newAgent.salaryType === 'fijo') {
      calculatedHourlyRate = newAgent.salaryAmountUsd;
    } else if (newAgent.salaryType === 'comision') {
      calculatedHourlyRate = 0;
    }

    const agent: Agent = {
      id: Math.random().toString(36).substr(2, 9),
      name: (newAgent.nickname || newAgent.name).toUpperCase(),
      fullName: newAgent.fullName.toUpperCase(),
      idNumber: newAgent.idNumber.toUpperCase(),
      nickname: (newAgent.nickname || newAgent.name).toUpperCase(),
      role: newAgent.role,
      storeId: newAgent.storeId,
      pin: newAgent.pin,
      specialty: newAgent.specialty.toUpperCase(),
      phone: newAgent.phone ? `+58${newAgent.phone.replace(/\D/g, '')}` : undefined,
      hourlyRateUsd: calculatedHourlyRate,
      salaryType: newAgent.salaryType,
      salaryAmountUsd: newAgent.salaryAmountUsd,
      commissionPercent: newAgent.commissionPercent,
      entryDate: newAgent.entryDate
    };
    setAgents([...agents, agent]);
    setNewAgent({ 
      name: '', 
      fullName: '',
      idNumber: '',
      nickname: '',
      role: 'AGENTE DE VENTAS', 
      specialty: '', 
      phone: '', 
      pin: '', 
      storeId: currentStoreId, 
      hourlyRateUsd: 0,
      salaryType: 'fijo' as any,
      salaryAmountUsd: 0,
      commissionPercent: 10,
      entryDate: new Date().toISOString().split('T')[0]
    });
    setIsAdding(false);
  };

  const handleAddPrice = () => {
    if (!editingPrices || !newPrice.garmentType || newPrice.priceUsd <= 0) return;
    
    const updatedAgent = {
      ...editingPrices,
      laborPrices: [...(editingPrices.laborPrices || []), { ...newPrice }]
    };
    
    setAgents(agents.map(a => a.id === updatedAgent.id ? updatedAgent : a));
    setEditingPrices(updatedAgent);
    setNewPrice({ garmentType: '', priceUsd: 0 });
  };

  const handleRemovePrice = (index: number) => {
    if (!editingPrices) return;
    const updatedPrices = [...(editingPrices.laborPrices || [])];
    updatedPrices.splice(index, 1);
    const updatedAgent = { ...editingPrices, laborPrices: updatedPrices };
    setAgents(agents.map(a => a.id === updatedAgent.id ? updatedAgent : a));
    setEditingPrices(updatedAgent);
  };

  const agentParticipationHistory = useMemo(() => {
    if (!viewHistoryAgent) return [];
    
    const events: any[] = [];
    
    if (historyFilter === 'anticipos' || historyFilter === 'todos') {
      expenses.filter(e => e.agentId === viewHistoryAgent.id && e.isAdvance).forEach(ex => {
        events.push({
          type: 'expense',
          description: ex.description,
          amountUsd: ex.amountUsd,
          timestamp: ex.timestamp,
          isAtTime: true
        });
      });
    }

    if (historyFilter !== 'anticipos') {
      orders.forEach(order => {
        const deadline = parseOrderDate(order.deliveryDate);
        order.history.forEach(h => {
          if (h.agentId === viewHistoryAgent.id && h.action.includes('[TASK_OK]')) {
            const isAtTime = h.timestamp <= deadline;
            events.push({
              type: 'order',
              orderNumber: order.orderNumber,
              customerName: order.customerName,
              action: h.action.replace('[TASK_OK]', '').trim(),
              timestamp: h.timestamp,
              issueDate: order.issueDate,
              deliveryDate: order.deliveryDate,
              isAtTime
            });
          }
        });
      });
    }

    const sorted = events.sort((a, b) => b.timestamp - a.timestamp);
    if (historyFilter === 'atiempo') return sorted.filter(e => e.type === 'order' && e.isAtTime);
    if (historyFilter === 'tarde') return sorted.filter(e => e.type === 'order' && !e.isAtTime);
    if (historyFilter === 'anticipos') return sorted.filter(e => e.type === 'expense');
    return sorted;
  }, [viewHistoryAgent, historyFilter, orders, expenses]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h3 className="text-3xl font-black text-[#000814] uppercase italic tracking-tighter leading-none">EQUIPO Y TRAZABILIDAD</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 italic flex items-center gap-2">
            <TrendingUp size={14} className="text-[#004ea1]" /> GESTIÓN DE PRODUCTIVIDAD Y BENEFICIOS
          </p>
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className="bg-[#000814] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-xl active:translate-y-1 border-b-8 border-slate-700">
          {isAdding ? 'CANCELAR' : 'REGISTRAR AGENTE'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white border-4 border-slate-50 rounded-[3.5rem] p-10 shadow-2xl space-y-10 animate-in slide-in-from-top-6">
          <h4 className="text-2xl font-black text-[#000814] uppercase italic">Nuevo Especialista Roxtor</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase italic">Apodo (Identidad Operativa)</label>
              <input type="text" placeholder="EJ: JUAN_ROXTOR" className="w-full bg-slate-50 border-2 rounded-2xl px-6 py-4 font-black uppercase text-xs outline-none" value={newAgent.nickname} onChange={(e) => setNewAgent({...newAgent, nickname: e.target.value, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase italic">Nombre Completo (Certificados/Nómina)</label>
              <input type="text" placeholder="JUAN PEREZ" className="w-full bg-slate-50 border-2 rounded-2xl px-6 py-4 font-black uppercase text-xs outline-none" value={newAgent.fullName} onChange={(e) => setNewAgent({...newAgent, fullName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase italic">Cédula / ID</label>
              <input type="text" placeholder="V-12345678" className="w-full bg-slate-50 border-2 rounded-2xl px-6 py-4 font-black uppercase text-xs outline-none" value={newAgent.idNumber} onChange={(e) => setNewAgent({...newAgent, idNumber: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase italic">Rol Operativo</label>
              <select className="w-full bg-slate-50 border-2 rounded-2xl px-6 py-4 font-black uppercase text-[10px] italic outline-none" value={newAgent.role} onChange={(e) => setNewAgent({...newAgent, role: e.target.value})}>
                <option value="AGENTE DE VENTAS">AGENTE DE VENTAS</option><option value="DISEÑADOR">DISEÑADOR</option><option value="OPERACIONES">OPERACIONES</option><option value="TALLER/PRODUCCIÓN">TALLER/PRODUCCIÓN</option><option value="ADMINISTRACIÓN">ADMINISTRACIÓN</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase italic">Nodo / Sede</label>
              <select className="w-full bg-slate-50 border-2 rounded-2xl px-6 py-4 font-black uppercase text-[10px] italic outline-none" value={newAgent.storeId} onChange={(e) => setNewAgent({...newAgent, storeId: e.target.value})}>
                <option value="store_1">TIENDA PRINCIPAL</option>
                <option value="store_2">ROXTOR CENTRO</option>
                <option value="global">GLOBAL (AMBAS)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-indigo-600 uppercase italic flex items-center gap-2"><Coins size={10}/> Tarifa Hora ($)</label>
              <input type="number" placeholder="2.50" className="w-full bg-indigo-50 border-2 border-indigo-100 rounded-2xl px-6 py-4 font-black text-indigo-600 text-center outline-none" value={newAgent.hourlyRateUsd} onChange={(e) => setNewAgent({...newAgent, hourlyRateUsd: parseFloat(e.target.value) || 0})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-rose-600 uppercase italic flex items-center gap-2"><Key size={10}/> PIN (6 Dígitos)</label>
              <input type="password" maxLength={6} placeholder="556677" className="w-full bg-rose-50 border-2 border-rose-100 rounded-2xl px-6 py-4 font-black text-rose-600 text-center text-xl outline-none" value={newAgent.pin} onChange={(e) => setNewAgent({...newAgent, pin: e.target.value.replace(/\D/g, '')})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase italic">Tipo de Pago</label>
              <select className="w-full bg-slate-50 border-2 rounded-2xl px-6 py-4 font-black uppercase text-[10px] italic outline-none" value={newAgent.salaryType} onChange={(e) => {
                const type = e.target.value;
                setNewAgent({...newAgent, salaryType: type as any});
              }}>
                <option value="fijo">FIJO / HORA</option>
                <option value="semanal">SEMANAL</option>
                <option value="quincenal">QUINCENAL</option>
                <option value="comision/quincena">COMISIÓN + QUINCENA</option>
                <option value="comision">SOLO COMISIÓN (10%)</option>
              </select>
            </div>
            {(newAgent.salaryType === 'semanal' || newAgent.salaryType === 'quincenal' || newAgent.salaryType === 'fijo' || newAgent.salaryType === 'comision/quincena') && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-emerald-600 uppercase italic flex items-center gap-2"><DollarSign size={10}/> Monto Base ($)</label>
                <input type="number" placeholder="50.00" className="w-full bg-emerald-50 border-2 border-emerald-100 rounded-2xl px-6 py-4 font-black text-emerald-600 text-center outline-none" value={newAgent.salaryAmountUsd} onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setNewAgent({
                    ...newAgent, 
                    salaryAmountUsd: val,
                    hourlyRateUsd: (newAgent.salaryType === 'semanal' || newAgent.salaryType === 'quincenal' || newAgent.salaryType === 'comision/quincena') 
                      ? calculateHourlyRate(newAgent.salaryType, val)
                      : newAgent.hourlyRateUsd
                  });
                }} />
              </div>
            )}
            {(newAgent.salaryType === 'comision' || newAgent.salaryType === 'comision/quincena') && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-orange-600 uppercase italic flex items-center gap-2"><TrendingUp size={10}/> % Comisión</label>
                <input type="number" placeholder="10" className="w-full bg-orange-50 border-2 border-orange-100 rounded-2xl px-6 py-4 font-black text-orange-600 text-center outline-none" value={newAgent.commissionPercent} onChange={(e) => setNewAgent({...newAgent, commissionPercent: parseFloat(e.target.value) || 0})} />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase italic">Fecha de Ingreso</label>
              <input type="date" className="w-full bg-slate-50 border-2 rounded-2xl px-6 py-4 font-black uppercase text-xs outline-none" value={newAgent.entryDate} onChange={(e) => setNewAgent({...newAgent, entryDate: e.target.value})} />
            </div>
          </div>
          <button onClick={handleAdd} className="w-full bg-[#000814] text-white py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl border-b-8 border-slate-700 italic">VINCULAR AL SISTEMA</button>
        </div>
      )}

      {/* Modal de Edición de Agente */}
      {editingAgent && (
        <div className="fixed inset-0 bg-[#000814]/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3.5rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto p-12 shadow-2xl space-y-10 border-4 border-slate-50">
            <div className="flex justify-between items-center">
              <h4 className="text-3xl font-black text-[#000814] uppercase italic">Modificar Perfil: {editingAgent.name}</h4>
              <button onClick={() => setEditingAgent(null)} className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase italic">Apodo</label>
                <input type="text" className="w-full bg-slate-50 border-2 rounded-2xl px-6 py-4 font-black uppercase text-xs outline-none" value={editingAgent.nickname || editingAgent.name} onChange={(e) => setEditingAgent({...editingAgent, nickname: e.target.value, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase italic">Nombre Completo</label>
                <input type="text" className="w-full bg-slate-50 border-2 rounded-2xl px-6 py-4 font-black uppercase text-xs outline-none" value={editingAgent.fullName || ''} onChange={(e) => setEditingAgent({...editingAgent, fullName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase italic">Cédula</label>
                <input type="text" className="w-full bg-slate-50 border-2 rounded-2xl px-6 py-4 font-black uppercase text-xs outline-none" value={editingAgent.idNumber || ''} onChange={(e) => setEditingAgent({...editingAgent, idNumber: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase italic">Rol</label>
                <select className="w-full bg-slate-50 border-2 rounded-2xl px-6 py-4 font-black uppercase text-[10px] italic outline-none" value={editingAgent.role} onChange={(e) => setEditingAgent({...editingAgent, role: e.target.value})}>
                  <option value="AGENTE DE VENTAS">AGENTE DE VENTAS</option><option value="DISEÑADOR">DISEÑADOR</option><option value="OPERACIONES">OPERACIONES</option><option value="TALLER/PRODUCCIÓN">TALLER/PRODUCCIÓN</option><option value="ADMINISTRACIÓN">ADMINISTRACIÓN</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase italic">Fecha de Ingreso</label>
                <input type="date" className="w-full bg-slate-50 border-2 rounded-2xl px-6 py-4 font-black uppercase text-xs outline-none" value={editingAgent.entryDate || ''} onChange={(e) => setEditingAgent({...editingAgent, entryDate: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-rose-600 uppercase italic flex items-center gap-2"><Key size={10}/> PIN (6 Dígitos)</label>
                <input type="password" maxLength={6} className="w-full bg-rose-50 border-2 border-rose-100 rounded-2xl px-6 py-4 font-black text-rose-600 text-center text-xl outline-none" value={editingAgent.pin} onChange={(e) => setEditingAgent({...editingAgent, pin: e.target.value.replace(/\D/g, '')})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase italic">Tipo de Pago</label>
                <select className="w-full bg-slate-50 border-2 rounded-2xl px-6 py-4 font-black uppercase text-[10px] italic outline-none" value={editingAgent.salaryType} onChange={(e) => {
                  const type = e.target.value as any;
                  const newRate = (type === 'semanal' || type === 'quincenal' || type === 'comision/quincena') 
                    ? calculateHourlyRate(type, editingAgent.salaryAmountUsd || 0)
                    : editingAgent.hourlyRateUsd;
                  setEditingAgent({...editingAgent, salaryType: type, hourlyRateUsd: newRate});
                }}>
                  <option value="fijo">FIJO / HORA</option>
                  <option value="semanal">SEMANAL</option>
                  <option value="quincenal">QUINCENAL</option>
                  <option value="comision/quincena">COMISIÓN + QUINCENA</option>
                  <option value="comision">SOLO COMISIÓN (10%)</option>
                </select>
              </div>
              {(editingAgent.salaryType === 'semanal' || editingAgent.salaryType === 'quincenal' || editingAgent.salaryType === 'fijo' || editingAgent.salaryType === 'comision/quincena') && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-emerald-600 uppercase italic flex items-center gap-2"><DollarSign size={10}/> Monto Base ($)</label>
                  <input type="number" className="w-full bg-emerald-50 border-2 border-emerald-100 rounded-2xl px-6 py-4 font-black text-emerald-600 text-center outline-none" value={editingAgent.salaryAmountUsd} onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    const newRate = (editingAgent.salaryType === 'semanal' || editingAgent.salaryType === 'quincenal' || editingAgent.salaryType === 'comision/quincena') 
                      ? calculateHourlyRate(editingAgent.salaryType, val)
                      : editingAgent.hourlyRateUsd;
                    setEditingAgent({...editingAgent, salaryAmountUsd: val, hourlyRateUsd: newRate});
                  }} />
                </div>
              )}
              {(editingAgent.salaryType === 'comision' || editingAgent.salaryType === 'comision/quincena') && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-orange-600 uppercase italic flex items-center gap-2"><TrendingUp size={10}/> % Comisión</label>
                  <input type="number" className="w-full bg-orange-50 border-2 border-orange-100 rounded-2xl px-6 py-4 font-black text-orange-600 text-center outline-none" value={editingAgent.commissionPercent} onChange={(e) => setEditingAgent({...editingAgent, commissionPercent: parseFloat(e.target.value) || 0})} />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-indigo-600 uppercase italic flex items-center gap-2"><Calculator size={10}/> Tarifa Hora Calculada ($)</label>
                <div className="w-full bg-indigo-50 border-2 border-indigo-100 rounded-2xl px-6 py-4 font-black text-indigo-600 text-center text-lg">
                  {editingAgent.hourlyRateUsd}$
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => {
                setAgents(agents.map(a => a.id === editingAgent.id ? editingAgent : a));
                setEditingAgent(null);
              }} className="flex-1 bg-[#000814] text-white py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl border-b-8 border-slate-700 italic">GUARDAR CAMBIOS</button>
              <button onClick={() => {
                if(confirm('¿Seguro que desea eliminar este agente?')) {
                  setAgents(agents.filter(a => a.id !== editingAgent.id));
                  setEditingAgent(null);
                }
              }} className="bg-rose-500 text-white px-12 py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl border-b-8 border-rose-700 italic">ELIMINAR</button>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {agents.map(agent => {
          const stats = getAgentStats(agent.id);
          const agentStore = agent.storeId === 'global' ? 'GLOBAL' : (agent.storeId === 'store_1' ? 'PRINCIPAL' : 'CENTRO');
          return (
            <div key={agent.id} className="bg-white border-4 border-slate-50 rounded-[3.5rem] p-10 shadow-sm hover:shadow-2xl transition-all group border-l-8 border-l-[#000814]">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-16 h-16 bg-[#000814] rounded-[1.5rem] flex items-center justify-center text-white shadow-lg rotate-2 group-hover:rotate-0 transition-transform">
                  <User size={28} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <h5 className="font-black text-[#000814] uppercase text-lg tracking-tighter italic truncate">{agent.name}</h5>
                  <div className="flex flex-wrap gap-2 items-center mt-1">
                    <span className="text-[8px] bg-[#004ea1]/10 text-[#004ea1] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg italic">{agent.role}</span>
                    <span className="text-[8px] bg-emerald-50 text-emerald-600 font-black uppercase tracking-widest px-2.5 py-1 rounded-lg italic flex items-center gap-1"><MapPin size={8}/> {agentStore}</span>
                    <span className="text-[8px] bg-indigo-50 text-indigo-600 font-black uppercase tracking-widest px-2.5 py-1 rounded-lg italic flex items-center gap-1">
                      <Coins size={8}/> 
                      {agent.hourlyRateUsd}$ / HORA
                    </span>
                    <button 
                      onClick={() => setEditingAgent(agent)}
                      className="text-[8px] bg-slate-100 text-slate-600 font-black uppercase tracking-widest px-2.5 py-1 rounded-lg italic flex items-center gap-1 hover:bg-slate-200"
                    >
                      <Edit2 size={8}/> EDITAR PERFIL
                    </button>
                    <span className="text-[8px] bg-slate-50 text-slate-500 font-black uppercase tracking-widest px-2.5 py-1 rounded-lg italic">
                      {agent.salaryType === 'semanal' ? `$${agent.salaryAmountUsd}/sem` : 
                       agent.salaryType === 'quincenal' ? `$${agent.salaryAmountUsd}/quin` :
                       agent.salaryType === 'comision/quincena' ? `$${agent.salaryAmountUsd}/quin + %` :
                       agent.salaryType === 'comision' ? `${agent.commissionPercent}% com` :
                       `$${agent.salaryAmountUsd || agent.hourlyRateUsd}/h`}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-[8px] font-black text-slate-400 uppercase italic">Efectividad</p>
                   <span className={`text-2xl font-black italic ${stats.efficiency >= 90 ? 'text-emerald-500' : 'text-amber-500'}`}>{stats.efficiency}%</span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-3 mb-8">
                <div className="bg-slate-50 p-4 rounded-2xl text-center"><p className="text-[7px] font-black text-slate-400 uppercase mb-1">Cargas</p><p className="text-xl font-black text-slate-800">{stats.pending}</p></div>
                <div className="bg-emerald-50 p-4 rounded-2xl text-center"><p className="text-[7px] font-black text-emerald-500 uppercase mb-1">Tareas</p><p className="text-xl font-black text-emerald-600">{stats.completed}</p></div>
                <div className="bg-rose-50 p-4 rounded-2xl text-center"><p className="text-[7px] font-black text-rose-500 uppercase mb-1">Tarde</p><p className="text-xl font-black text-rose-600">{stats.late}</p></div>
                <div className="bg-blue-50 p-4 rounded-2xl text-center"><p className="text-[7px] font-black text-blue-500 uppercase mb-1">Anticipos</p><p className="text-xl font-black text-blue-600">${stats.totalAdvances.toFixed(0)}</p></div>
                <div className="bg-amber-50 p-4 rounded-2xl text-center">
                  <p className="text-[7px] font-black text-amber-600 uppercase mb-1">Ausencias</p>
                  <p className="text-xl font-black text-amber-700">{getAbsences(agent.attendance)}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setEditingPrices(agent)}
                  className="w-14 flex items-center justify-center bg-blue-50 text-[#004ea1] rounded-2xl border-2 border-transparent hover:bg-[#004ea1] hover:text-white transition-all"
                  title="Precios por Confección"
                >
                  <Scissors size={18} />
                </button>
                <button onClick={() => setViewHistoryAgent(agent)} className="flex-1 flex items-center justify-center gap-3 bg-[#000814] text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest italic shadow-lg"><History size={16} /> EXPEDIENTE MULTI-ORDEN</button>
                <button onClick={() => confirm(`¿Eliminar a ${agent.name}?`) && setAgents(agents.filter(a => a.id !== agent.id))} className="w-14 flex items-center justify-center bg-slate-50 text-slate-300 rounded-2xl border-2 border-transparent hover:text-red-600 transition-all"><Trash2 size={18} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {viewHistoryAgent && (
        <div className="fixed inset-0 z-[150] bg-[#000814]/95 backdrop-blur-2xl flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-5xl rounded-[4rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border-8 border-white/10 animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/50">
                 <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-[#004ea1] text-white rounded-3xl flex items-center justify-center shadow-2xl rotate-3"><ShieldCheck size={32}/></div>
                    <div>
                       <h4 className="text-3xl font-black text-[#000814] uppercase italic tracking-tighter leading-none">Expediente del Agente</h4>
                       <p className="text-[10px] font-bold text-[#004ea1] uppercase tracking-widest mt-2 italic">Análisis financiero y operativo: {viewHistoryAgent.name}</p>
                    </div>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => setHistoryFilter('todos')} className={`px-5 py-2.5 rounded-xl font-black text-[9px] uppercase italic ${historyFilter === 'todos' ? 'bg-[#000814] text-white' : 'bg-slate-100 text-slate-400'}`}>TODAS</button>
                    <button onClick={() => setHistoryFilter('atiempo')} className={`px-5 py-2.5 rounded-xl font-black text-[9px] uppercase italic ${historyFilter === 'atiempo' ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-400'}`}>A TIEMPO</button>
                    <button onClick={() => setHistoryFilter('anticipos')} className={`px-5 py-2.5 rounded-xl font-black text-[9px] uppercase italic ${historyFilter === 'anticipos' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-400'}`}>ANTICIPOS</button>
                    <button onClick={() => setViewHistoryAgent(null)} className="ml-4 w-12 h-12 rounded-full bg-white border-2 flex items-center justify-center text-slate-300 hover:text-red-500 transition-all"><X size={24}/></button>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto p-10 bg-white italic">
                 <div className="space-y-4">
                    {agentParticipationHistory.length === 0 ? (
                      <div className="py-32 text-center opacity-10"><FileText size={80} className="mx-auto mb-4" /><p className="text-xl font-black uppercase italic tracking-[0.3em]">Sin registros para este filtro</p></div>
                    ) : (
                      agentParticipationHistory.map((e, idx) => (
                        <div key={idx} className={`border-2 rounded-[2rem] p-6 transition-all flex flex-col md:flex-row items-center justify-between gap-6 group ${e.type === 'expense' ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100 hover:border-[#004ea1]/30'}`}>
                           <div className="flex items-center gap-6 flex-1">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg rotate-2 group-hover:rotate-0 transition-transform ${e.type === 'expense' ? 'bg-blue-600' : e.isAtTime ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                                 {e.type === 'expense' ? <Coins size={24}/> : e.isAtTime ? <CheckCircle2 size={24}/> : <AlertTriangle size={24}/>}
                              </div>
                              <div>
                                 {e.type === 'order' ? (
                                   <>
                                      <div className="flex items-center gap-3">
                                         <span className="text-[10px] font-black text-[#004ea1] italic">#{e.orderNumber}</span>
                                         <h6 className="font-black text-slate-800 uppercase italic text-sm">{e.customerName}</h6>
                                      </div>
                                      <p className="text-[10px] font-black text-slate-400 uppercase mt-1 italic">{e.action}</p>
                                   </>
                                 ) : (
                                   <>
                                      <h6 className="font-black text-blue-800 uppercase italic text-sm">{e.description}</h6>
                                      <p className="text-[10px] font-black text-blue-400 uppercase mt-1 italic">Retiro de Caja / Anticipo de Pago</p>
                                   </>
                                 )}
                              </div>
                           </div>
                           <div className="text-right">
                              {e.type === 'order' ? (
                                <>
                                  <p className="text-[8px] font-black text-slate-400 uppercase italic">Hito Operativo</p>
                                  <span className={`text-[10px] font-black uppercase italic ${e.isAtTime ? 'text-emerald-500' : 'text-rose-500'}`}>{e.isAtTime ? 'ENTREGA A TIEMPO' : 'ENTREGA TARDE'}</span>
                                  <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase italic">ORDEN: {e.deliveryDate}</p>
                                </>
                              ) : (
                                <>
                                  <p className="text-[8px] font-black text-blue-400 uppercase italic">Beneficio Recibido</p>
                                  <span className="text-2xl font-black text-blue-700 italic tracking-tighter">${e.amountUsd.toFixed(2)}</span>
                                  <p className="text-[9px] font-bold text-blue-400 mt-1 uppercase italic">{new Date(e.timestamp).toLocaleDateString()}</p>
                                </>
                              )}
                           </div>
                        </div>
                      ))
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}
      {editingPrices && (
        <div className="fixed inset-0 z-[200] bg-[#000814]/95 backdrop-blur-2xl flex items-center justify-center p-6 italic">
          <div className="bg-white w-full max-w-2xl rounded-[4rem] p-10 shadow-2xl space-y-8 animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-slate-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#004ea1] text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <Scissors size={24} />
                </div>
                <div>
                  <h4 className="text-2xl font-black uppercase italic tracking-tighter text-[#000814]">Precios por Confección (Destajo)</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase italic">Agente: {editingPrices.name}</p>
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
    </div>
  );
};

export default TeamManager;
