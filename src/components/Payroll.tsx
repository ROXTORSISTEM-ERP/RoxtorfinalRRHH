
import React, { useState, useMemo, useRef } from 'react';
import { PayrollPayment, Agent, AppSettings, Order, Expense } from '../types';
import { 
  calculatePayrollDetails, 
  getWeeklyAttendance 
} from '../utils/payrollCalculations';
import PayrollReceipt from './PayrollReceipt';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { 
  Users, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  Zap, 
  Plus, 
  Trash2, 
  ArrowRight,
  Calculator,
  Search,
  History,
  Coins,
  FileText,
  MessageCircle,
  Printer,
  Download,
  Loader2,
  MinusCircle,
  PlusCircle
} from 'lucide-react';

interface Props {
  payroll: PayrollPayment[];
  setPayroll: React.Dispatch<React.SetStateAction<PayrollPayment[]>>;
  agents: Agent[];
  settings: AppSettings;
  orders: Order[];
  expenses: Expense[];
}

const Payroll: React.FC<Props> = ({ payroll, setPayroll, agents, settings, orders, expenses }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState<string | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [selectedAgentForCommissions, setSelectedAgentForCommissions] = useState<string>('');
  const [extraCommissionsList, setExtraCommissionsList] = useState<{ id: string, description: string, amount: number }[]>([]);
  const [newExtra, setNewExtra] = useState({ description: '', amount: 0 });
  const [newPayment, setNewPayment] = useState({
    agentId: '',
    agentName: '',
    agentFullName: '',
    agentIdNumber: '',
    amountUsd: 0,
    date: new Date().toISOString().split('T')[0],
    method: 'DOLARES $',
    reference: '',
    baseSalaryUsd: 0,
    commissionsUsd: 0,
    extraBonusesUsd: 0,
    extraBonusesDescription: '',
    advancesDeductedUsd: 0,
    absencesDeductedUsd: 0,
    periodStart: '',
    periodEnd: ''
  });

  const calculateAgentCommissions = (agentId: string) => {
    const agentOrders = orders.filter(o => o.assignedAgentId === agentId && o.status === 'completado');
    return agentOrders.reduce((acc, order) => acc + (order.totalCommissionsUsd || 0), 0);
  };

  const calculateAgentAdvances = (agentId: string) => {
    return expenses
      .filter(e => e.agentId === agentId && e.isAdvance)
      .reduce((acc, curr) => acc + curr.amountUsd, 0);
  };

  const handleAgentSelect = (agentId: string) => {
    if (agentId === 'OTRO') {
      setNewPayment(prev => ({
        ...prev,
        agentId: 'OTRO',
        agentName: '',
        agentFullName: '',
        agentIdNumber: '',
        baseSalaryUsd: 0,
        commissionsUsd: 0,
        extraBonusesUsd: 0,
        extraBonusesDescription: '',
        advancesDeductedUsd: 0,
        absencesDeductedUsd: 0,
        amountUsd: 0
      }));
      return;
    }

    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;

    const commissions = calculateAgentCommissions(agentId);
    const advances = calculateAgentAdvances(agentId);
    
    // Use new calculation logic
    const details = calculatePayrollDetails(agent, settings, commissions);
    
    // Deduct advances from the net total
    const finalAmountUsd = details.netTotalUsd - advances;

    setNewPayment(prev => ({
      ...prev,
      agentId: agent.id,
      agentName: agent.name,
      agentFullName: agent.fullName || agent.name,
      agentIdNumber: agent.idNumber || '',
      baseSalaryUsd: agent.salaryAmountUsd || 0,
      commissionsUsd: commissions,
      extraBonusesUsd: 0,
      extraBonusesDescription: '',
      advancesDeductedUsd: advances,
      absencesDeductedUsd: details.absenceDeductionBs / settings.bcvRate,
      amountUsd: Math.max(0, finalAmountUsd)
    }));
  };

  const pendingCommissions = useMemo(() => {
    if (!selectedAgentForCommissions) return 0;
    return calculateAgentCommissions(selectedAgentForCommissions);
  }, [selectedAgentForCommissions, orders]);

  const handleApplyCommissions = () => {
    const totalExtras = extraCommissionsList.reduce((acc, curr) => acc + curr.amount, 0);
    const extrasDesc = extraCommissionsList.map(e => `${e.description} ($${e.amount})`).join(' | ');
    
    handleAgentSelect(selectedAgentForCommissions);
    
    // After handleAgentSelect updates state, we need to ensure extras are added
    setNewPayment(prev => ({
      ...prev,
      extraBonusesUsd: totalExtras,
      extraBonusesDescription: extrasDesc,
      amountUsd: prev.amountUsd + totalExtras
    }));
    
    setIsAdding(true);
    setExtraCommissionsList([]);
  };

  const handleAddPayment = () => {
    if (!newPayment.amountUsd || (!newPayment.agentId && !newPayment.agentName)) return;
    
    const selectedAgent = agents.find(a => a.id === newPayment.agentId);
    const finalName = selectedAgent ? selectedAgent.name : newPayment.agentName.toUpperCase();
    
    const payment: PayrollPayment = {
      id: Math.random().toString(36).substr(2, 9),
      agentId: newPayment.agentId || undefined,
      agentName: finalName,
      agentFullName: newPayment.agentFullName || finalName,
      agentIdNumber: newPayment.agentIdNumber,
      amountUsd: newPayment.amountUsd,
      amountBs: newPayment.amountUsd * settings.bcvRate,
      bcvRate: settings.bcvRate,
      date: newPayment.date,
      method: newPayment.method,
      reference: newPayment.reference.toUpperCase(),
      baseSalaryUsd: newPayment.baseSalaryUsd,
      commissionsUsd: newPayment.commissionsUsd,
      extraBonusesUsd: newPayment.extraBonusesUsd,
      extraBonusesDescription: newPayment.extraBonusesDescription,
      advancesDeductedUsd: newPayment.advancesDeductedUsd,
      absencesDeductedUsd: newPayment.absencesDeductedUsd,
      periodStart: newPayment.periodStart,
      periodEnd: newPayment.periodEnd
    };

    setPayroll([payment, ...payroll]);
    setIsAdding(false);
    setNewPayment({ 
      agentId: '', 
      agentName: '', 
      agentFullName: '',
      agentIdNumber: '',
      amountUsd: 0, 
      date: new Date().toISOString().split('T')[0], 
      method: 'DOLARES $', 
      reference: '',
      baseSalaryUsd: 0,
      commissionsUsd: 0,
      extraBonusesUsd: 0,
      extraBonusesDescription: '',
      advancesDeductedUsd: 0,
      absencesDeductedUsd: 0,
      periodStart: '',
      periodEnd: ''
    });
  };

  const generateReceiptPDF = async (payment: PayrollPayment) => {
    if (!receiptRef.current) return;
    setIsGeneratingReceipt(payment.id);
    
    try {
      // Wait for React to render the component in the hidden div
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      // Media Carta: 139.7 x 215.9 mm
      const pdf = new jsPDF('p', 'mm', [139.7, 215.9]);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Recibo_Roxtor_${payment.agentName}_${payment.date}.pdf`);
    } catch (error) {
      console.error('Error generating receipt:', error);
    } finally {
      setIsGeneratingReceipt(null);
    }
  };

  const handlePrintPayroll = () => window.print();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 italic pb-20">
      {/* Hidden Receipt Template for PDF Generation */}
      <div className="fixed left-[-9999px] top-[-9999px]">
        <div ref={receiptRef}>
          {isGeneratingReceipt && (() => {
            const payment = payroll.find(p => p.id === isGeneratingReceipt);
            const agent = agents.find(a => a.id === payment?.agentId);
            if (!payment || !agent) return null;
            return (
              <PayrollReceipt 
                agent={agent} 
                settings={settings} 
                commissionsUsd={(payment.commissionsUsd || 0) + (payment.extraBonusesUsd || 0)}
                paymentReference={payment.reference}
                isPrinting={true}
              />
            );
          })()}
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h3 className="text-3xl font-black text-[#000814] uppercase tracking-tighter">Nómina y Compensación</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2 italic flex items-center gap-2">
            <Users size={14} className="text-[#004ea1]" /> PAGOS A COLABORADORES Y AGENTES
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={handlePrintPayroll} className="bg-slate-100 text-slate-500 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 border-slate-200 hover:bg-white transition-all"><Printer size={16}/></button>
          <button onClick={() => setIsAdding(!isAdding)} className="bg-[#004ea1] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl border-b-4 border-blue-900 hover:bg-blue-700 active:translate-y-1 transition-all">
            {isAdding ? 'CANCELAR' : 'REGISTRAR PAGO'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-gradient-to-br from-[#000814] to-[#001d3d] rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20"><Calculator size={24}/></div>
              <h4 className="text-xl font-black uppercase italic tracking-tighter">Calculadora de Comisiones (Bordado)</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-300 uppercase italic">Seleccionar Colaborador</label>
                  <select 
                    className="w-full bg-white/10 border-2 border-white/10 rounded-2xl px-6 py-4 font-black uppercase text-xs outline-none focus:border-blue-400 transition-all text-white"
                    value={selectedAgentForCommissions}
                    onChange={(e) => setSelectedAgentForCommissions(e.target.value)}
                  >
                    <option value="" className="text-slate-800">-- SELECCIONAR --</option>
                    {agents.map(a => (
                      <option key={a.id} value={a.id} className="text-slate-800">{a.name} ({a.role})</option>
                    ))}
                  </select>
                </div>

                <div className="bg-white/5 rounded-3xl p-6 border border-white/10 space-y-4">
                  <p className="text-[10px] font-black text-blue-300 uppercase italic">Agregar Comisión Extra / Bono</p>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Descripción"
                      className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-bold uppercase outline-none focus:border-blue-400"
                      value={newExtra.description}
                      onChange={(e) => setNewExtra({...newExtra, description: e.target.value})}
                    />
                    <input 
                      type="number" 
                      placeholder="$"
                      className="w-20 bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-bold outline-none focus:border-blue-400"
                      value={newExtra.amount || ''}
                      onChange={(e) => setNewExtra({...newExtra, amount: parseFloat(e.target.value) || 0})}
                    />
                    <button 
                      onClick={() => {
                        if (newExtra.description && newExtra.amount > 0) {
                          setExtraCommissionsList([...extraCommissionsList, { ...newExtra, id: Math.random().toString(36).substr(2, 9) }]);
                          setNewExtra({ description: '', amount: 0 });
                        }
                      }}
                      className="p-2 bg-blue-500 rounded-xl hover:bg-blue-400 transition-all"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {extraCommissionsList.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      {extraCommissionsList.map((extra) => (
                        <div key={extra.id} className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                          <div className="text-[9px] font-bold uppercase truncate max-w-[150px]">{extra.description}</div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-emerald-400">${extra.amount.toFixed(2)}</span>
                            <button onClick={() => setExtraCommissionsList(extraCommissionsList.filter((e) => e.id !== extra.id))} className="text-white/20 hover:text-rose-400"><Trash2 size={12}/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white/5 rounded-3xl p-6 border border-white/10 flex flex-col justify-center h-full">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-black text-blue-300 uppercase italic">Comisiones Pendientes (Sistema)</p>
                      <p className="text-3xl font-black italic tracking-tighter text-blue-400">${pendingCommissions.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-emerald-300 uppercase italic">Bonos/Extras Adicionales</p>
                      <p className="text-3xl font-black italic tracking-tighter text-emerald-400">${extraCommissionsList.reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)}</p>
                    </div>
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-[10px] font-black text-white uppercase italic">Total a Liquidar</p>
                      <p className="text-5xl font-black italic tracking-tighter text-white">${(pendingCommissions + extraCommissionsList.reduce((acc, curr) => acc + curr.amount, 0)).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <button 
              onClick={handleApplyCommissions}
              disabled={!selectedAgentForCommissions || (pendingCommissions <= 0 && extraCommissionsList.length === 0)}
              className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${(selectedAgentForCommissions && (pendingCommissions > 0 || extraCommissionsList.length > 0)) ? 'bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}
            >
              LIQUIDAR Y CARGAR A NÓMINA
            </button>
          </div>
          <Coins size={200} className="absolute -right-20 -bottom-20 text-white/5 rotate-12" />
        </div>

        <div className="bg-white border-4 border-slate-50 rounded-[3.5rem] p-10 shadow-xl flex flex-col justify-center items-center text-center space-y-4">
          <div className="w-16 h-16 bg-blue-100 text-[#004ea1] rounded-full flex items-center justify-center shadow-inner"><DollarSign size={32}/></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase italic">Total Pagado este Mes</p>
            <p className="text-4xl font-black text-[#000814] italic tracking-tighter">
              ${payroll.filter(p => p.date.startsWith(new Date().toISOString().slice(0, 7))).reduce((acc, p) => acc + p.amountUsd, 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {isAdding && (
        <div className="bg-white border-4 border-slate-50 rounded-[3.5rem] p-10 shadow-2xl space-y-10 animate-in slide-in-from-top-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase italic">Personal Destinatario</label>
              <select className="w-full bg-slate-50 border-2 rounded-2xl px-5 py-4 font-black uppercase text-xs outline-none" value={newPayment.agentId} onChange={(e) => handleAgentSelect(e.target.value)}>
                <option value="">-- SELECCIONAR AGENTE --</option>
                <option value="OTRO">-- OTRO PERSONAL --</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.name} ({a.role})</option>)}
              </select>
            </div>
            {newPayment.agentId === 'OTRO' ? (
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase italic">Nombre Completo</label>
                 <input type="text" className="w-full bg-slate-50 border-2 rounded-2xl px-5 py-4 font-black uppercase text-xs" placeholder="EJ: JUAN PEREZ" value={newPayment.agentFullName} onChange={(e) => setNewPayment({...newPayment, agentFullName: e.target.value, agentName: e.target.value})} />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase italic">Nombre Completo (Confirmado)</label>
                <div className="w-full bg-slate-100 border-2 rounded-2xl px-5 py-4 font-black uppercase text-xs text-slate-500">
                  {newPayment.agentFullName || '---'}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase italic">Monto Final a Pagar ($)</label>
              <input type="number" className="w-full bg-slate-50 border-2 rounded-2xl px-5 py-4 font-black text-2xl text-[#004ea1]" value={newPayment.amountUsd || ''} onChange={(e) => setNewPayment({...newPayment, amountUsd: parseFloat(e.target.value) || 0})} />
            </div>
          </div>

          {newPayment.agentId !== 'OTRO' && newPayment.agentId !== '' && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-emerald-50 p-4 rounded-2xl border-2 border-emerald-100">
                <p className="text-[8px] font-black text-emerald-600 uppercase italic flex items-center gap-1"><PlusCircle size={8}/> Sueldo Base</p>
                <p className="text-lg font-black text-emerald-700">${newPayment.baseSalaryUsd.toFixed(2)}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-2xl border-2 border-blue-100">
                <p className="text-[8px] font-black text-blue-600 uppercase italic flex items-center gap-1"><PlusCircle size={8}/> Comisiones</p>
                <p className="text-lg font-black text-blue-700">${newPayment.commissionsUsd.toFixed(2)}</p>
              </div>
              <div className="bg-rose-50 p-4 rounded-2xl border-2 border-rose-100">
                <p className="text-[8px] font-black text-rose-600 uppercase italic flex items-center gap-1"><MinusCircle size={8}/> Anticipos</p>
                <p className="text-lg font-black text-rose-700">-${newPayment.advancesDeductedUsd.toFixed(2)}</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-2xl border-2 border-amber-100">
                <p className="text-[8px] font-black text-amber-600 uppercase italic flex items-center gap-1"><MinusCircle size={8}/> Ausencias</p>
                <p className="text-lg font-black text-amber-700">-${newPayment.absencesDeductedUsd.toFixed(2)}</p>
              </div>
              <div className="bg-emerald-500 p-4 rounded-2xl border-2 border-emerald-600 text-white">
                <p className="text-[8px] font-black uppercase italic flex items-center gap-1"><PlusCircle size={8}/> Total Neto</p>
                <p className="text-lg font-black">${newPayment.amountUsd.toFixed(2)}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-emerald-50/50 p-8 rounded-[2.5rem] border-2 border-emerald-100 border-dashed">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-emerald-600 uppercase italic">Bonos / Extras Adicionales ($)</label>
              <input 
                type="number" 
                className="w-full bg-white border-2 border-emerald-200 rounded-2xl px-5 py-4 font-black text-2xl text-emerald-700 outline-none focus:border-emerald-500 transition-all" 
                value={newPayment.extraBonusesUsd || ''} 
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  const diff = val - newPayment.extraBonusesUsd;
                  setNewPayment({...newPayment, extraBonusesUsd: val, amountUsd: newPayment.amountUsd + diff});
                }} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-emerald-600 uppercase italic">Descripción de Bonos/Extras</label>
              <input 
                type="text" 
                className="w-full bg-white border-2 border-emerald-200 rounded-2xl px-5 py-4 font-black uppercase text-xs text-emerald-700 outline-none focus:border-emerald-500 transition-all" 
                placeholder="EJ: BONO POR PRODUCTIVIDAD / COMISIÓN ESPECIAL"
                value={newPayment.extraBonusesDescription} 
                onChange={(e) => setNewPayment({...newPayment, extraBonusesDescription: e.target.value})} 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase italic">Fecha de Liquidación</label>
              <input type="date" className="w-full bg-slate-50 border-2 rounded-2xl px-5 py-4 font-black text-xs" value={newPayment.date} onChange={(e) => setNewPayment({...newPayment, date: e.target.value})} />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase italic">Método de Pago</label>
                <select className="w-full bg-slate-50 border-2 rounded-2xl px-5 py-4 font-black uppercase text-xs outline-none" value={newPayment.method} onChange={(e) => setNewPayment({...newPayment, method: e.target.value})}>
                   <option value="DOLARES $">DOLARES $ (CASH)</option><option value="PAGO MOVIL">PAGO MÓVIL (Bs)</option><option value="TRANSFERENCIA">TRANSFERENCIA (Bs/$)</option><option value="EFECTIVO">EFECTIVO (Bs)</option>
                </select>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase italic">Número de Referencia</label>
                <input type="text" className="w-full bg-slate-50 border-2 rounded-2xl px-6 py-4 font-black uppercase text-sm" placeholder="EJ: 00987654" value={newPayment.reference} onChange={(e) => setNewPayment({...newPayment, reference: e.target.value})} />
             </div>
          </div>

          <div className="bg-[#004ea1] rounded-[2.5rem] p-8 text-white flex justify-between items-center shadow-xl">
             <div><p className="text-[10px] font-black uppercase opacity-60">Conversión BCV Automática</p><p className="text-3xl font-black italic tracking-tighter">Bs. {(newPayment.amountUsd * settings.bcvRate).toLocaleString('es-VE')}</p></div>
             <Calculator size={48} className="opacity-20 rotate-12" />
          </div>

          <button onClick={handleAddPayment} className="w-full bg-[#000814] text-white py-6 rounded-[2.5rem] font-black uppercase shadow-2xl border-b-8 border-slate-900 active:translate-y-1">PROCESAR PAGO DE NÓMINA</button>
        </div>
      )}

      <div className="bg-white border-4 border-slate-50 rounded-[4rem] overflow-hidden shadow-sm">
         <div className="overflow-x-auto">
            <table className="w-full text-left italic">
               <thead className="bg-[#000814] text-white text-[9px] font-black uppercase tracking-[0.2em]">
                  <tr>
                    <th className="px-10 py-6">FECHA</th>
                    <th className="px-10 py-6">COLABORADOR</th>
                    <th className="px-10 py-6">TOTAL USD</th>
                    <th className="px-10 py-6">PAGO BS (BCV)</th>
                    <th className="px-10 py-6">MÉTODO / REF</th>
                    <th className="px-10 py-6 text-right">ACCIONES</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {payroll.length === 0 ? <tr><td colSpan={6} className="px-10 py-20 text-center text-slate-300 font-black uppercase text-sm">Sin pagos de nómina registrados</td></tr> : payroll.map(p => (
                    <tr key={p.id} className="hover:bg-blue-50/20 transition-all group">
                       <td className="px-10 py-6 text-[10px] font-bold text-slate-400">{p.date}</td>
                       <td className="px-10 py-6"><p className="font-black text-slate-800 uppercase text-xs">{p.agentName}</p><p className="text-[8px] font-bold text-[#004ea1] uppercase">Pago de Salario / Comisión</p></td>
                       <td className="px-10 py-6 font-black text-slate-800 text-sm">${p.amountUsd.toFixed(2)}</td>
                       <td className="px-10 py-6 font-black text-[#004ea1] text-[10px]">Bs. {p.amountBs.toLocaleString('es-VE')}</td>
                       <td className="px-10 py-6"><p className="text-[9px] font-black text-slate-500 uppercase">{p.method}</p><p className="text-[8px] font-bold text-slate-400 uppercase italic">Ref: {p.reference || 'S/N'}</p></td>
                       <td className="px-10 py-6 text-right">
                         <div className="flex justify-end gap-2">
                           <button 
                             onClick={() => generateReceiptPDF(p)} 
                             disabled={isGeneratingReceipt === p.id}
                             className="p-2 text-[#004ea1] hover:bg-blue-100 rounded-lg transition-colors"
                             title="Descargar Recibo"
                           >
                             {isGeneratingReceipt === p.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16}/>}
                           </button>
                           <button onClick={() => setPayroll(payroll.filter(item => item.id !== p.id))} className="p-2 text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                         </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default Payroll;
