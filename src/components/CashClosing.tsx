
import React, { useState, useMemo } from 'react';
import { Order, AppSettings, Expense, Agent } from '../types';
import { 
  Calculator, 
  Store, 
  DollarSign, 
  Smartphone, 
  ArrowRightLeft, 
  Wallet, 
  Calendar,
  Printer, 
  MessageCircle,
  ShieldCheck,
  MinusCircle,
  Plus,
  Trash2,
  X,
  Send,
  CloudCheck,
  FileText,
  Hash,
  Clock,
  Users
} from 'lucide-react';

interface Props {
  orders: Order[];
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  settings: AppSettings;
  agents: Agent[];
  filterStoreId?: string;
}

const CashClosing: React.FC<Props> = ({ orders, expenses, setExpenses, settings, agents, filterStoreId }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({ 
    description: '', 
    amount: 0, 
    currency: 'USD' as 'USD' | 'BS',
    invoiceNumber: '',
    vendorName: '',
    vendorRif: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Otros' as any,
    responsibleAgentId: ''
  });

  const formatDateToStore = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleAddExpense = () => {
    if (!newExpense.description || newExpense.amount <= 0) return;
    
    const amountUsd = Number((newExpense.currency === 'USD' ? newExpense.amount : newExpense.amount / settings.bcvRate).toFixed(2));
    const amountBs = Number((newExpense.currency === 'BS' ? newExpense.amount : newExpense.amount * settings.bcvRate).toFixed(2));
    const descLower = newExpense.description.toLowerCase();
    const isAdvance = descLower.includes('anticipo');
    
    let linkedAgentId = undefined;
    if (isAdvance) {
      const foundAgent = agents.find(a => descLower.includes(a.name.toLowerCase()));
      if (foundAgent) linkedAgentId = foundAgent.id;
    }

    // Usar la fecha seleccionada en el formulario para el timestamp
    const expenseTimestamp = new Date(newExpense.date + 'T12:00:00').getTime();

    const expense: Expense = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: expenseTimestamp,
      description: newExpense.description.toUpperCase(),
      amountUsd, 
      amountBs, 
      bcvRate: settings.bcvRate,
      storeId: filterStoreId || settings.stores[0].id,
      isAdvance, 
      agentId: linkedAgentId,
      responsibleAgentId: newExpense.category === 'Desperdicios' ? newExpense.responsibleAgentId : undefined,
      invoiceNumber: newExpense.invoiceNumber.toUpperCase(),
      vendorName: newExpense.vendorName.toUpperCase(),
      vendorRif: newExpense.vendorRif.toUpperCase(),
      invoiceDate: newExpense.date,
      category: newExpense.category
    };

    setExpenses(prev => [...prev, expense]);
    setIsAddingExpense(false);
    setNewExpense({ 
      description: '', 
      amount: 0, 
      currency: 'USD', 
      invoiceNumber: '', 
      vendorName: '',
      vendorRif: '',
      date: new Date().toISOString().split('T')[0],
      category: 'Otros',
      responsibleAgentId: ''
    });
  };

  const storeSummaries = useMemo(() => {
    const formattedDate = formatDateToStore(selectedDate);
    const startOfDay = new Date(selectedDate + 'T00:00:00').getTime();
    const endOfDay = new Date(selectedDate + 'T23:59:59').getTime();
    const storesToProcess = filterStoreId ? settings.stores.filter(s => s.id === filterStoreId) : settings.stores;

    return storesToProcess.map(store => {
      const storeOrders = orders.filter(o => o.storeId === store.id);
      const storeExpenses = expenses.filter(e => e.storeId === store.id && e.timestamp >= startOfDay && e.timestamp <= endOfDay);
      const totals = { 'DOLARES $': 0, 'PAGO MOVIL': 0, 'TRANSFERENCIA': 0, 'EFECTIVO': 0, 'PUNTO DE VENTA': 0, 'BIOPAGO': 0 };

      storeOrders.filter(o => !o.isLogistics).forEach(order => {
        // Solo sumamos del historial para evitar duplicados y capturar abonos de diferentes días
        (order.history || []).forEach(h => {
          if (h.timestamp >= startOfDay && h.timestamp <= endOfDay) {
            // Regex mejorado para capturar montos de abonos, pagos, cobros y ventas directas
            const match = h.action.match(/(?:Pago|Abono|Cobro|Percibido)[^$]*\$([\d.]+)/i);
            if (match && !h.action.includes("Orden generada")) {
              const amount = parseFloat(match[1]);
              let method = order.paymentMethod || 'EFECTIVO';
              
              // Intentar detectar el método de pago específico del mensaje del historial si existe
              const actionUpper = h.action.toUpperCase();
              if (actionUpper.includes("PAGO MOVIL")) method = "PAGO MOVIL";
              else if (actionUpper.includes("TRANSFERENCIA")) method = "TRANSFERENCIA";
              else if (actionUpper.includes("DOLARES")) method = "DOLARES $";
              else if (actionUpper.includes("EFECTIVO")) method = "EFECTIVO";
              else if (actionUpper.includes("PUNTO")) method = "PUNTO DE VENTA";
              else if (actionUpper.includes("BIOPAGO")) method = "BIOPAGO";
              
              if (totals.hasOwnProperty(method)) {
                totals[method as keyof typeof totals] += amount;
              }
            }
          }
        });
      });

      const totalStoreBrutoUsd = Object.values(totals).reduce((a, b) => a + b, 0);
      const totalExpensesUsd = storeExpenses.reduce((acc, curr) => acc + (curr.amountUsd || 0), 0);
      return { ...store, totals, totalExpensesUsd, totalStoreBrutoUsd, totalStoreNetoUsd: totalStoreBrutoUsd - totalExpensesUsd, todayExpenses: storeExpenses };
    });
  }, [orders, expenses, settings, selectedDate, filterStoreId]);

  const handleSendWhatsAppReport = (summary: any) => {
    const date = formatDateToStore(selectedDate);
    let message = `*📊 REPORTE DE CIERRE - ${summary.name}*\n`;
    message += `📅 *FECHA:* ${date}\n`;
    message += `----------------------------------\n\n`;
    
    message += `💰 *INGRESOS BRUTOS:* $${summary.totalStoreBrutoUsd.toFixed(2)}\n`;
    message += `• Dólares ($): $${summary.totals['DOLARES $'].toFixed(2)}\n`;
    message += `• Pago Móvil: $${summary.totals['PAGO MOVIL'].toFixed(2)}\n`;
    message += `• Otros Medios: $${(summary.totals['TRANSFERENCIA'] + summary.totals['PUNTO DE VENTA'] + summary.totals['BIOPAGO'] + summary.totals['EFECTIVO']).toFixed(2)}\n\n`;
    
    if (summary.todayExpenses.length > 0) {
      message += `📉 *DESGLOSE DE RETIROS / EGRESOS:*\n`;
      summary.todayExpenses.forEach((ex: Expense) => {
        const fact = ex.invoiceNumber ? ` [Fact: ${ex.invoiceNumber}]` : '';
        const vendor = ex.vendorName ? ` (${ex.vendorName})` : '';
        message += `- ${ex.description}${vendor}${fact}: -$${ex.amountUsd.toFixed(2)}\n`;
      });
      message += `*TOTAL RETIROS: -$${summary.totalExpensesUsd.toFixed(2)}*\n\n`;
    } else {
      message += `📉 *EGRESOS:* $0.00 (Sin novedades)\n\n`;
    }
    
    message += `----------------------------------\n`;
    message += `✅ *SALDO NETO FINAL EN CAJA:*\n`;
    message += `*TOTAL: $${summary.totalStoreNetoUsd.toFixed(2)}*\n`;
    message += `*REF BS: ${(summary.totalStoreNetoUsd * settings.bcvRate).toLocaleString('es-VE')}*\n`;
    message += `----------------------------------\n\n`;
    message += `_Sistema de Gestión ROXTOR Intelligent ERP_`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700 italic">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h3 className="text-3xl font-black text-[#000814] uppercase italic tracking-tighter">Caja y Movimientos</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2 italic">Auditoría en tiempo real por nodo sucursal</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setIsAddingExpense(true)} className="bg-rose-600 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-xl border-b-4 border-rose-800 hover:bg-rose-700 transition-all"><MinusCircle size={18} /> REGISTRAR RETIRO</button>
          <div className="flex items-center gap-4 bg-white border-2 border-slate-100 rounded-2xl px-6 py-3 shadow-sm">
            <Calendar size={18} className="text-[#004ea1]" />
            <input type="date" className="text-xs font-black uppercase italic outline-none text-[#000814] bg-transparent" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </div>
        </div>
      </div>

      {isAddingExpense && (
        <div className="fixed inset-0 z-[200] bg-[#000814]/95 backdrop-blur-2xl flex items-center justify-center p-4 italic">
           <div className="bg-white w-full max-w-md rounded-[4rem] p-10 shadow-2xl space-y-8 border-8 border-white/10 animate-in zoom-in-95">
              <div className="flex justify-between items-start border-b border-slate-50 pb-6">
                <div>
                  <h4 className="text-2xl font-black text-[#000814] uppercase italic tracking-tighter leading-none">Nuevo Egreso</h4>
                  <p className="text-[10px] font-bold text-rose-600 uppercase italic mt-1">Salida de Capital Autorizada</p>
                </div>
                <button onClick={() => setIsAddingExpense(false)} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-red-500 transition-all"><X size={24}/></button>
              </div>
              <div className="space-y-6">
                 <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase italic ml-1 flex items-center gap-2"><Clock size={12}/> Fecha del Gasto</label>
                       <input 
                         type="date" 
                         className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-xs font-black uppercase outline-none focus:bg-white focus:border-rose-300" 
                         value={newExpense.date} 
                         onChange={(e) => setNewExpense({...newExpense, date: e.target.value})} 
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase italic ml-1 flex items-center gap-2"><Hash size={12}/> Nro. de Factura / Comprobante</label>
                       <input 
                         type="text" 
                         placeholder="EJ: 00452 / S/F" 
                         className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-xs font-black uppercase outline-none focus:bg-white" 
                         value={newExpense.invoiceNumber} 
                         onChange={(e) => setNewExpense({...newExpense, invoiceNumber: e.target.value})} 
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase italic ml-1 flex items-center gap-2"><Store size={12}/> Empresa / Proveedor</label>
                       <input 
                         type="text" 
                         placeholder="EJ: INVERSIONES ROXTOR C.A." 
                         className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-xs font-black uppercase outline-none focus:bg-white" 
                         value={newExpense.vendorName} 
                         onChange={(e) => setNewExpense({...newExpense, vendorName: e.target.value})} 
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase italic ml-1 flex items-center gap-2"><ShieldCheck size={12}/> RIF de la Empresa</label>
                       <input 
                         type="text" 
                         placeholder="EJ: J-12345678-9" 
                         className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-xs font-black uppercase outline-none focus:bg-white" 
                         value={newExpense.vendorRif} 
                         onChange={(e) => setNewExpense({...newExpense, vendorRif: e.target.value})} 
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase italic ml-1">Categoría de Auditoría</label>
                       <select 
                         className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-xs font-black uppercase outline-none focus:bg-white"
                         value={newExpense.category}
                         onChange={(e) => setNewExpense({...newExpense, category: e.target.value as any})}
                       >
                         <option value="Otros">Otros / General</option>
                         <option value="Logística/Gasolina">Logística / Gasolina</option>
                         <option value="Desperdicios">Desperdicios / Merma</option>
                         <option value="Insumos">Compra de Insumos</option>
                         <option value="Nómina">Pago de Nómina</option>
                         <option value="SOCIOS">Gastos de Socios (Colegio, Mercado, hortalizas, etc.)</option>
                       </select>
                    </div>

                    {newExpense.category === 'Desperdicios' && (
                      <div className="space-y-2 animate-in slide-in-from-top-2">
                        <label className="text-[10px] font-black text-rose-600 uppercase italic ml-1 flex items-center gap-2"><ShieldCheck size={12}/> Responsable del Error</label>
                        <select 
                          className="w-full bg-rose-50 border-2 border-rose-100 rounded-2xl px-6 py-4 text-xs font-black uppercase outline-none focus:bg-white"
                          value={newExpense.responsibleAgentId}
                          onChange={(e) => setNewExpense({...newExpense, responsibleAgentId: e.target.value})}
                        >
                          <option value="">-- SELECCIONE RESPONSABLE --</option>
                          {agents.map(a => <option key={a.id} value={a.id}>{a.name} ({a.role})</option>)}
                        </select>
                      </div>
                    )}

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase italic ml-1">Monto del Retiro</label>
                       <div className="flex gap-2">
                          <input type="number" className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-xl font-black outline-none focus:bg-white" value={newExpense.amount || ''} onChange={(e) => setNewExpense({...newExpense, amount: parseFloat(e.target.value) || 0})} placeholder="0.00" />
                          <select className="w-24 bg-[#000814] text-white rounded-2xl px-2 font-black text-[10px] uppercase" value={newExpense.currency} onChange={(e) => setNewExpense({...newExpense, currency: e.target.value as any})}><option value="USD">USD ($)</option><option value="BS">VES (Bs)</option></select>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase italic ml-1">Descripción / Motivo</label>
                       <input type="text" placeholder="EJ: PAGO ALQUILER / COMPRA LINO" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-xs font-black uppercase outline-none focus:bg-white" value={newExpense.description} onChange={(e) => setNewExpense({...newExpense, description: e.target.value})} />
                    </div>
                 </div>

                 <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 italic">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-2">Resumen de Conversión:</p>
                    <p className="text-xs font-black text-[#000814] uppercase">
                       {newExpense.currency === 'USD' ? `BS. ${(newExpense.amount * settings.bcvRate).toLocaleString('es-VE')}` : `$ ${(newExpense.amount / settings.bcvRate).toFixed(2)}`}
                    </p>
                 </div>
                 <button onClick={handleAddExpense} className="w-full bg-rose-600 text-white py-6 rounded-[2.5rem] font-black uppercase italic shadow-2xl border-b-8 border-rose-800 active:translate-y-1 transition-all">FINALIZAR REGISTRO</button>
              </div>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {storeSummaries.map((summary) => (
          <div key={summary.id} className="bg-white border-4 border-slate-50 rounded-[4rem] p-10 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 pointer-events-none group-hover:scale-110 transition-transform duration-700"><Calculator size={200} /></div>
            <div className="relative z-10 space-y-8">
              <div className="flex justify-between items-start border-b border-slate-100 pb-6">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-[#000814] text-white rounded-2xl flex items-center justify-center shadow-lg rotate-3"><Store size={28} /></div>
                  <div>
                    <h4 className="text-2xl font-black text-[#000814] uppercase tracking-tighter italic leading-none">{summary.name}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic flex items-center gap-2">
                       <CloudCheck size={12} className="text-blue-500" /> AUDITORÍA SYNC
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-black text-emerald-600 uppercase block italic mb-1">Total Ingresos</span>
                  <span className="text-2xl font-black text-slate-800 italic tracking-tighter">${summary.totalStoreBrutoUsd.toFixed(2)}</span>
                </div>
              </div>

              {summary.todayExpenses.length > 0 && (
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-2">Movimientos de Egreso:</p>
                   <div className="space-y-3 max-h-60 overflow-y-auto pr-2 no-scrollbar italic">
                      {summary.todayExpenses.map((ex: Expense) => (
                        <div key={ex.id} className="bg-rose-50/50 border-2 border-rose-100 p-5 rounded-3xl flex items-center justify-between group relative overflow-hidden transition-all hover:bg-rose-50">
                           <div className="flex items-center gap-5">
                              <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center shadow-sm">{ex.isAdvance ? <ShieldCheck size={16}/> : <MinusCircle size={16}/>}</div>
                              <div>
                                <p className="text-[11px] font-black text-rose-900 uppercase italic leading-none">{ex.description}</p>
                                <div className="flex items-center gap-3 mt-1.5 opacity-60">
                                   {ex.category && <p className="text-[8px] font-black text-rose-500 uppercase">[{ex.category}]</p>}
                                   {ex.responsibleAgentId && (
                                     <p className="text-[8px] font-black text-rose-700 uppercase flex items-center gap-1">
                                       <Users size={10}/> RESP: {agents.find(a => a.id === ex.responsibleAgentId)?.name || 'DESCONOCIDO'}
                                     </p>
                                   )}
                                   {ex.invoiceNumber && <p className="text-[8px] font-bold text-rose-400 uppercase flex items-center gap-1"><FileText size={10}/> FACT: {ex.invoiceNumber}</p>}
                                   {ex.vendorName && <p className="text-[8px] font-bold text-rose-400 uppercase flex items-center gap-1"><Store size={10}/> {ex.vendorName}</p>}
                                   <p className="text-[8px] font-bold text-rose-400 uppercase flex items-center gap-1"><Calendar size={10}/> {ex.invoiceDate ? formatDateToStore(ex.invoiceDate) : new Date(ex.timestamp).toLocaleDateString()}</p>
                                </div>
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                              <span className="font-black text-rose-600 text-base italic">-${ex.amountUsd.toFixed(2)}</span>
                              <button onClick={() => setExpenses(prev => prev.filter(e => e.id !== ex.id))} className="w-8 h-8 rounded-lg bg-white border border-rose-200 text-rose-300 hover:text-red-500 hover:border-red-300 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PaymentRow icon={<DollarSign size={16}/>} label="Dólares ($)" amount={summary.totals['DOLARES $']} color="text-emerald-600" />
                <PaymentRow icon={<Wallet size={16}/>} label="Efectivo (Bs)" amount={summary.totals['EFECTIVO']} subtext={`Bs. ${(summary.totals['EFECTIVO'] * settings.bcvRate).toLocaleString()}`} />
                <PaymentRow icon={<Smartphone size={16}/>} label="Pago Móvil" amount={summary.totals['PAGO MOVIL']} subtext={`Bs. ${(summary.totals['PAGO MOVIL'] * settings.bcvRate).toLocaleString()}`} />
                <PaymentRow icon={<ArrowRightLeft size={16}/>} label="Transferencias" amount={summary.totals['TRANSFERENCIA']} />
              </div>

              <div className="bg-[#004ea1] rounded-[2.5rem] p-8 text-white flex justify-between items-center shadow-2xl relative overflow-hidden border-b-8 border-blue-900">
                <div className="relative z-10">
                  <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest italic mb-1">Neto Final Disponible</p>
                  <p className="text-4xl font-black italic tracking-tighter">${summary.totalStoreNetoUsd.toFixed(2)}</p>
                  <p className="text-[10px] font-bold text-blue-300 uppercase italic mt-1">Bs. {(summary.totalStoreNetoUsd * settings.bcvRate).toLocaleString('es-VE')}</p>
                </div>
                <div className="relative z-10 flex gap-3">
                  <button onClick={() => handleSendWhatsAppReport(summary)} className="p-4 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 shadow-lg active:scale-95 transition-all group flex items-center gap-2">
                    <Send size={20} /> <span className="text-[9px] font-black uppercase italic hidden group-hover:block">WhatsApp</span>
                  </button>
                  <button onClick={() => window.print()} className="p-4 bg-white/10 text-white rounded-2xl hover:bg-white/20 shadow-lg active:scale-95"><Printer size={20} /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PaymentRow = ({ icon, label, amount, subtext, color }: any) => (
  <div className="bg-slate-50/50 border-2 border-slate-100 rounded-3xl p-5 flex items-center justify-between hover:bg-white transition-all">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-[#004ea1] shadow-sm">{icon}</div>
      <div><p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">{label}</p><p className={`text-sm font-black italic ${color || 'text-slate-800'}`}>${(amount || 0).toFixed(2)}</p></div>
    </div>
    {subtext && <div className="text-right"><p className="text-[8px] font-black text-slate-300 uppercase">Ref. Bs</p><p className="text-[10px] font-black text-slate-500">{subtext}</p></div>}
  </div>
);

export default CashClosing;
