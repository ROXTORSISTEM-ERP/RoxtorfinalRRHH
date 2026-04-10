
import React from 'react';
import { Agent, PayrollPayment, AppSettings, Order } from '../../types';
import { calculateCommission } from '../../services/hr';
import { 
  Users, 
  Banknote, 
  Clock, 
  Award,
  Calendar,
  CheckCircle2,
  UserCheck
} from 'lucide-react';

interface Props {
  agents: Agent[];
  payroll: PayrollPayment[];
  orders: Order[];
  settings: AppSettings;
}

const HRManager: React.FC<Props> = ({ agents, payroll, orders, settings }) => {
  const activeAgents = agents.filter(a => a.id !== 'agent_web');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <h2 className="text-3xl font-black text-[#000814] italic uppercase tracking-tighter">Gestión de Personal y Nómina</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeAgents.map(agent => {
          const agentOrders = orders.filter(o => o.assignedAgentId === agent.id);
          const commission = calculateCommission(agent, agentOrders);
          const today = new Date().toISOString().split('T')[0];
          const hasMarkedToday = agent.attendance?.some(r => r.date === today);

          return (
            <div key={agent.id} className="bg-white border-4 border-slate-50 rounded-[3rem] p-8 shadow-sm space-y-6 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[#000814] text-white rounded-2xl flex items-center justify-center text-xl font-black italic shadow-xl">
                    {agent.name[0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-black italic tracking-tighter text-[#000814] uppercase">{agent.name}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest">{agent.role}</p>
                  </div>
                </div>
                {hasMarkedToday ? (
                  <span className="bg-emerald-50 text-emerald-600 p-2 rounded-xl" title="Asistencia hoy"><UserCheck size={20}/></span>
                ) : (
                  <span className="bg-rose-50 text-rose-600 p-2 rounded-xl" title="Falta asistencia"><Clock size={20}/></span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase italic tracking-widest mb-1">Comisiones</p>
                  <p className="text-lg font-black italic tracking-tighter text-emerald-600 tabular-nums">${commission.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase italic tracking-widest mb-1">Ventas Mes</p>
                  <p className="text-lg font-black italic tracking-tighter text-blue-600 tabular-nums">{agentOrders.length}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase italic">
                  <Calendar size={14} /> Ingreso: {agent.entryDate || 'N/A'}
                </div>
                <button className="text-[#004ea1] text-[10px] font-black uppercase italic hover:underline">Ver Perfil</button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-[#000814] rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12"><Award size={200}/></div>
        <div className="relative z-10 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-black italic tracking-tighter uppercase">Historial de Pagos de Nómina</h3>
            <button className="bg-white text-[#000814] px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest italic hover:scale-105 transition-all">Generar Nómina</button>
          </div>
          <div className="space-y-3">
            {payroll.slice(0, 5).map(payment => (
              <div key={payment.id} className="flex justify-between items-center p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center"><Banknote size={20}/></div>
                  <div>
                    <p className="font-black italic text-sm">{payment.agentName}</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase italic">{payment.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black italic text-emerald-400 tabular-nums">${payment.amountUsd}</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase italic">Ref: {payment.reference}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRManager;
