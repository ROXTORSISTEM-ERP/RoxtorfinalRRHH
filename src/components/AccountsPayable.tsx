
import React, { useState } from 'react';
import { Debt, DebtPayment, Workshop, AppSettings } from '../types';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Calendar, 
  DollarSign, 
  User, 
  Search, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  X, 
  FileText, 
  History,
  Zap
} from 'lucide-react';

interface Props {
  debts: Debt[];
  setDebts: React.Dispatch<React.SetStateAction<Debt[]>>;
  workshops: Workshop[];
  settings: AppSettings;
}

const AccountsPayable: React.FC<Props> = ({ debts, setDebts, workshops, settings }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [paymentModalDebt, setPaymentModalDebt] = useState<Debt | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [newDebt, setNewDebt] = useState({ 
    creditorName: '', 
    description: '', 
    totalAmountUsd: 0, 
    dateAcquired: new Date().toISOString().split('T')[0] 
  });

  const [newPayment, setNewPayment] = useState({
    amountUsd: 0,
    date: new Date().toISOString().split('T')[0],
    method: 'DOLARES $',
    reference: ''
  });

  const handleAddDebt = () => {
    if (!newDebt.creditorName || newDebt.totalAmountUsd <= 0) return;
    const debt: Debt = {
      id: Math.random().toString(36).substr(2, 9),
      creditorName: newDebt.creditorName.toUpperCase(),
      description: newDebt.description.toUpperCase(),
      totalAmountUsd: newDebt.totalAmountUsd,
      dateAcquired: newDebt.dateAcquired,
      payments: [],
      status: 'pendiente'
    };
    setDebts([debt, ...debts]);
    setIsAdding(false);
    setNewDebt({ creditorName: '', description: '', totalAmountUsd: 0, dateAcquired: new Date().toISOString().split('T')[0] });
  };

  const handleAddPayment = () => {
    if (!paymentModalDebt || newPayment.amountUsd <= 0) return;
    
    const payment: DebtPayment = {
      id: Math.random().toString(36).substr(2, 9),
      amountUsd: newPayment.amountUsd,
      date: newPayment.date,
      method: newPayment.method,
      reference: newPayment.reference.toUpperCase()
    };

    setDebts(prev => prev.map(d => {
      if (d.id !== paymentModalDebt.id) return d;
      const updatedPayments = [...d.payments, payment];
      const totalPaid = updatedPayments.reduce((acc, curr) => acc + curr.amountUsd, 0);
      return {
        ...d,
        payments: updatedPayments,
        status: totalPaid >= d.totalAmountUsd ? 'pagado' : 'pendiente'
      };
    }));

    setPaymentModalDebt(null);
    setNewPayment({ amountUsd: 0, date: new Date().toISOString().split('T')[0], method: 'DOLARES $', reference: '' });
  };

  const filteredDebts = debts.filter(d => 
    d.creditorName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 italic pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h3 className="text-3xl font-black text-[#000814] uppercase tracking-tighter">Pasivos y Compromisos</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2 italic flex items-center gap-2">
            <CreditCard size={14} className="text-rose-600" /> CONTROL DE CUENTAS POR PAGAR
          </p>
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className="bg-rose-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl border-b-4 border-rose-800 hover:bg-rose-700 active:translate-y-1 transition-all">
          {isAdding ? 'CANCELAR' : 'REGISTRAR DEUDA'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white border-4 border-slate-50 rounded-[3.5rem] p-10 shadow-2xl space-y-8 animate-in slide-in-from-top-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase italic">Acreedor / Beneficiario</label>
              <select className="w-full bg-slate-50 border-2 rounded-2xl px-5 py-4 font-black uppercase text-xs outline-none" value={newDebt.creditorName} onChange={(e) => setNewDebt({...newDebt, creditorName: e.target.value})}>
                <option value="">-- SELECCIONAR --</option>
                <option value="OTRO">-- OTRO PROVEEDOR --</option>
                {workshops.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
              </select>
            </div>
            {newDebt.creditorName === 'OTRO' && (
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase italic">Nombre Manual</label>
                  <input type="text" className="w-full bg-slate-50 border-2 rounded-2xl px-5 py-4 font-black uppercase text-xs" placeholder="EJ: ALQUILER SEDE" onChange={(e) => setNewDebt({...newDebt, creditorName: e.target.value})} />
               </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase italic">Importe de Deuda ($)</label>
              <input type="number" className="w-full bg-slate-50 border-2 rounded-2xl px-5 py-4 font-black text-lg text-rose-600" value={newDebt.totalAmountUsd || ''} onChange={(e) => setNewDebt({...newDebt, totalAmountUsd: parseFloat(e.target.value) || 0})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase italic">Fecha Contraída</label>
              <input type="date" className="w-full bg-slate-50 border-2 rounded-2xl px-5 py-4 font-black text-xs" value={newDebt.dateAcquired} onChange={(e) => setNewDebt({...newDebt, dateAcquired: e.target.value})} />
            </div>
          </div>
          <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase italic">Concepto o Descripción</label>
              <input type="text" className="w-full bg-slate-50 border-2 rounded-2xl px-5 py-4 font-black uppercase text-xs" placeholder="MOTIVO DEL CRÉDITO..." value={newDebt.description} onChange={(e) => setNewDebt({...newDebt, description: e.target.value})} />
          </div>
          <button onClick={handleAddDebt} className="w-full bg-[#000814] text-white py-6 rounded-[2.5rem] font-black uppercase shadow-2xl border-b-8 border-slate-900 active:translate-y-1">VINCULAR OBLIGACIÓN FINANCIERA</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {filteredDebts.map(debt => {
          const totalPaid = debt.payments.reduce((acc, curr) => acc + curr.amountUsd, 0);
          const balance = debt.totalAmountUsd - totalPaid;
          const isSettled = balance <= 0;
          return (
            <div key={debt.id} className={`bg-white border-4 border-slate-50 rounded-[3.5rem] p-8 shadow-sm transition-all group border-l-[12px] ${isSettled ? 'border-l-emerald-500' : 'border-l-rose-500'}`}>
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-1">
                  <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg ${isSettled ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600 animate-pulse'}`}>{isSettled ? 'LIQUIDADO' : 'PENDIENTE'}</span>
                  <h4 className="text-xl font-black uppercase text-slate-800 tracking-tighter leading-none italic mt-2">{debt.creditorName}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase italic">{debt.description}</p>
                </div>
                <div className="text-right">
                   <p className="text-[8px] font-black text-slate-400 uppercase italic">Total Deuda</p>
                   <p className="text-2xl font-black italic text-slate-800">${debt.totalAmountUsd.toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                 <div className="bg-slate-50 p-4 rounded-2xl"><p className="text-[7px] font-black text-slate-400 uppercase mb-1">Abonado</p><p className="text-xl font-black text-emerald-600">${totalPaid.toFixed(2)}</p></div>
                 <div className="bg-slate-50 p-4 rounded-2xl"><p className="text-[7px] font-black text-slate-400 uppercase mb-1">Saldo Restante</p><p className={`text-xl font-black ${balance > 0 ? 'text-rose-600' : 'text-slate-300'}`}>${balance.toFixed(2)}</p></div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setPaymentModalDebt(debt)} disabled={isSettled} className="flex-1 bg-[#000814] text-white py-4 rounded-2xl font-black text-[10px] uppercase italic tracking-widest shadow-lg disabled:opacity-30 flex items-center justify-center gap-2"><DollarSign size={16}/> REGISTRAR PAGO</button>
                <button onClick={() => setDebts(debts.filter(d => d.id !== debt.id))} className="w-14 bg-slate-50 text-slate-300 hover:text-red-500 rounded-2xl flex items-center justify-center transition-all"><Trash2 size={18}/></button>
              </div>
            </div>
          );
        })}
      </div>

      {paymentModalDebt && (
        <div className="fixed inset-0 z-[200] bg-[#000814]/95 backdrop-blur-2xl flex items-center justify-center p-4 italic">
           <div className="bg-white w-full max-w-md rounded-[4rem] p-10 shadow-2xl space-y-8 border-8 border-white/10 animate-in zoom-in-95">
              <div className="flex justify-between items-start border-b border-slate-50 pb-6">
                <div>
                  <h4 className="text-2xl font-black text-[#000814] uppercase italic tracking-tighter">Abono a Deuda</h4>
                  <p className="text-[10px] font-bold text-rose-600 uppercase italic">Para: {paymentModalDebt.creditorName}</p>
                </div>
                <button onClick={() => setPaymentModalDebt(null)} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-red-500 transition-all"><X size={24}/></button>
              </div>
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase italic ml-1">Monto del Pago ($)</label>
                    <input type="number" className="w-full bg-slate-50 border-2 rounded-2xl px-6 py-5 text-2xl font-black outline-none" value={newPayment.amountUsd || ''} onChange={(e) => setNewPayment({...newPayment, amountUsd: parseFloat(e.target.value) || 0})} />
                 </div>
                 <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase italic ml-1">Método de Pago</label>
                       <select className="w-full bg-slate-50 border-2 rounded-2xl px-5 py-4 text-xs font-black uppercase italic outline-none" value={newPayment.method} onChange={(e) => setNewPayment({...newPayment, method: e.target.value})}>
                          <option value="DOLARES $">DOLARES $</option><option value="PAGO MOVIL">PAGO MOVIL (Bs)</option><option value="TRANSFERENCIA">TRANSFERENCIA (Bs/$)</option><option value="EFECTIVO">EFECTIVO (Bs)</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-[#004ea1] uppercase italic ml-1">Referencia Bancaria</label>
                       <input type="text" className="w-full bg-blue-50/50 border-2 border-blue-100 rounded-2xl px-6 py-4 text-sm font-black uppercase outline-none focus:bg-white" placeholder="EJ: 0045812" value={newPayment.reference} onChange={(e) => setNewPayment({...newPayment, reference: e.target.value})} />
                    </div>
                 </div>
                 <button onClick={handleAddPayment} className="w-full bg-emerald-600 text-white py-6 rounded-[2.5rem] font-black uppercase shadow-2xl border-b-8 border-emerald-800 active:translate-y-1">LIQUIDAR ABONO</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AccountsPayable;
