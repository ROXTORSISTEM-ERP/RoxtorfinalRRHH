
import React from 'react';
import { Order, Expense, Debt, AppSettings } from '../../types';
import { calculateFinancialSummary } from '../../services/finance';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Banknote
} from 'lucide-react';

interface Props {
  orders: Order[];
  expenses: Expense[];
  debts: Debt[];
  settings: AppSettings;
}

const FinanceManager: React.FC<Props> = ({ orders, expenses, debts, settings }) => {
  const { totalIncome, totalExpenses, netProfit } = calculateFinancialSummary(orders, expenses);
  const totalReceivable = orders.reduce((acc, o) => acc + o.restanteUsd, 0);
  const totalPayable = debts.reduce((acc, d) => acc + (d.status === 'pendiente' ? d.totalAmountUsd : 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <h2 className="text-3xl font-black text-[#000814] italic uppercase tracking-tighter">Estados Financieros</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard 
          label="Ingresos (Abonos)" 
          value={`$${totalIncome.toLocaleString()}`} 
          subValue={`Bs. ${(totalIncome * settings.bcvRate).toLocaleString()}`}
          icon={<ArrowUpRight className="text-emerald-500" />}
          trend="up"
        />
        <SummaryCard 
          label="Egresos (Gastos)" 
          value={`$${totalExpenses.toLocaleString()}`} 
          subValue={`Bs. ${(totalExpenses * settings.bcvRate).toLocaleString()}`}
          icon={<ArrowDownRight className="text-rose-500" />}
          trend="down"
        />
        <SummaryCard 
          label="Utilidad Neta" 
          value={`$${netProfit.toLocaleString()}`} 
          subValue={`Bs. ${(netProfit * settings.bcvRate).toLocaleString()}`}
          icon={<PieChart className="text-blue-500" />}
          highlight={netProfit > 0}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center"><Banknote size={20}/></div>
            <h3 className="text-lg font-black uppercase italic text-slate-800">Cuentas por Cobrar</h3>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest">Total Pendiente</p>
              <p className="text-4xl font-black italic tracking-tighter text-[#004ea1] tabular-nums">${totalReceivable.toLocaleString()}</p>
            </div>
            <p className="text-xs font-bold text-slate-400 italic">De {orders.filter(o => o.restanteUsd > 0).length} órdenes</p>
          </div>
        </div>

        <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center"><CreditCard size={20}/></div>
            <h3 className="text-lg font-black uppercase italic text-slate-800">Cuentas por Pagar</h3>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest">Total Deuda</p>
              <p className="text-4xl font-black italic tracking-tighter text-rose-500 tabular-nums">${totalPayable.toLocaleString()}</p>
            </div>
            <p className="text-xs font-bold text-slate-400 italic">De {debts.filter(d => d.status === 'pendiente').length} acreedores</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ label, value, subValue, icon, trend, highlight }: any) => (
  <div className={`bg-white p-8 rounded-[3rem] border-4 border-slate-50 shadow-sm relative overflow-hidden ${highlight ? 'ring-4 ring-blue-500/10' : ''}`}>
    <div className="flex justify-between items-start mb-4">
      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center shadow-inner">
        {icon}
      </div>
      {trend && (
        <span className={`text-[10px] font-black uppercase italic ${trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
          {trend === 'up' ? '+12%' : '-5%'}
        </span>
      )}
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest mb-1">{label}</p>
    <p className="text-4xl font-black italic tracking-tighter text-[#000814] tabular-nums leading-none mb-2">{value}</p>
    <p className="text-xs font-bold text-slate-400 italic">{subValue}</p>
  </div>
);

export default FinanceManager;
