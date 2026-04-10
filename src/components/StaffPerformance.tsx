
import React, { useMemo } from 'react';
import { Order, Expense, Agent, StaffDisciplineRecord, AppSettings } from '../types';
import { 
  ShieldCheck, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Trophy, 
  Target,
  Users,
  Calendar,
  Zap,
  Activity,
  ArrowUpRight,
  Clock,
  FileCheck,
  BarChart3
} from 'lucide-react';

interface Props {
  orders: Order[];
  expenses: Expense[];
  agents: Agent[];
  settings: AppSettings;
}

const StaffPerformance: React.FC<Props> = ({ orders, expenses, agents, settings }) => {
  // Simulación de cálculo de métricas (en un sistema real esto vendría de logs históricos)
  const disciplineStats = useMemo(() => {
    return agents.map(agent => {
      const agentOrders = orders.filter(o => o.assignedAgentId === agent.id);
      const agentExpenses = expenses.filter(e => e.responsibleAgentId === agent.id);
      
      // % Pedidos registrados correctamente (simulado basado en campos llenos)
      const correctOrders = agentOrders.filter(o => o.customerCi && o.customerPhone && o.deliveryDate).length;
      const correctOrdersPercent = agentOrders.length > 0 ? (correctOrders / agentOrders.length) * 100 : 90;

      // % Gastos cargados el mismo día (simulado)
      const sameDayExpensesPercent = agentExpenses.length > 0 ? 85 : 95;

      // % Órdenes que pasan por todo el flujo (simulado)
      const workflowCompliancePercent = agentOrders.filter(o => o.status === 'completado').length > 0 ? 88 : 92;

      const totalScore = (correctOrdersPercent + sameDayExpensesPercent + workflowCompliancePercent) / 3;
      
      let classification: 'A' | 'B' | 'C' = 'B';
      if (totalScore >= 90) classification = 'A';
      else if (totalScore < 75) classification = 'C';

      return {
        agentId: agent.id,
        agentName: agent.name,
        role: agent.role,
        correctOrdersPercent,
        sameDayExpensesPercent,
        workflowCompliancePercent,
        totalScore,
        classification
      };
    });
  }, [orders, expenses, agents]);

  const globalIDO = disciplineStats.reduce((acc, s) => acc + s.totalScore, 0) / (disciplineStats.length || 1);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 italic">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h3 className="text-4xl font-black text-[#000814] uppercase tracking-tighter italic leading-none">Disciplina Operativa</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
            <Activity size={14} className="text-blue-500" /> MÉTRICAS DE CUMPLIMIENTO Y TRAZABILIDAD
          </p>
        </div>
        <div className="bg-white border-4 border-slate-50 p-6 rounded-[2.5rem] shadow-sm flex items-center gap-8">
          <div className="text-center">
            <p className="text-[8px] font-black text-slate-400 uppercase italic mb-1">Índice Global (IDO)</p>
            <p className={`text-3xl font-black italic tracking-tighter ${globalIDO >= 85 ? 'text-emerald-500' : 'text-amber-500'}`}>
              {globalIDO.toFixed(1)}%
            </p>
          </div>
          <div className="h-10 w-px bg-slate-100" />
          <div className="text-center">
            <p className="text-[8px] font-black text-slate-400 uppercase italic mb-1">Objetivo Semanal</p>
            <p className="text-3xl font-black text-slate-800 italic tracking-tighter">85%</p>
          </div>
        </div>
      </div>

      {/* ALERTAS DE SABOTAJE PASIVO / IMPROVISACIÓN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border-4 border-slate-50 rounded-[3.5rem] overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
               <h4 className="font-black text-sm text-slate-800 uppercase italic flex items-center gap-2">
                 <Users size={18} className="text-[#004ea1]" /> Ranking de Disciplina por Agente
               </h4>
               <span className="text-[9px] font-black text-slate-400 uppercase italic">Meta 3 Meses: 98%</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white border-b border-slate-50">
                  <tr>
                    <th className="px-8 py-5">AGENTE</th>
                    <th className="px-8 py-5">REGISTRO</th>
                    <th className="px-8 py-5">FLUJO</th>
                    <th className="px-8 py-5">GASTOS</th>
                    <th className="px-8 py-5">IDO</th>
                    <th className="px-8 py-5 text-right">GRUPO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {disciplineStats.map((stat) => (
                    <tr key={stat.agentId} className="hover:bg-slate-50/50 transition-all group">
                      <td className="px-8 py-6">
                        <div>
                          <p className="font-black text-slate-800 uppercase italic text-sm">{stat.agentName}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase italic">{stat.role}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden w-16">
                            <div className="h-full bg-blue-500" style={{ width: `${stat.correctOrdersPercent}%` }} />
                          </div>
                          <span className="text-[10px] font-black italic">{stat.correctOrdersPercent.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden w-16">
                            <div className="h-full bg-emerald-500" style={{ width: `${stat.workflowCompliancePercent}%` }} />
                          </div>
                          <span className="text-[10px] font-black italic">{stat.workflowCompliancePercent.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden w-16">
                            <div className="h-full bg-amber-500" style={{ width: `${stat.sameDayExpensesPercent}%` }} />
                          </div>
                          <span className="text-[10px] font-black italic">{stat.sameDayExpensesPercent.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`font-black italic text-base ${stat.totalScore >= 85 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {stat.totalScore.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className={`px-4 py-1.5 rounded-xl font-black text-[10px] uppercase italic shadow-sm ${
                          stat.classification === 'A' ? 'bg-emerald-50 text-emerald-600' :
                          stat.classification === 'B' ? 'bg-amber-50 text-amber-600' :
                          'bg-rose-50 text-rose-600'
                        }`}>
                          Grupo {stat.classification}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#000814] rounded-[3rem] p-8 text-white space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><ShieldCheck size={100} /></div>
            <div className="relative z-10 space-y-4">
              <h4 className="text-xl font-black uppercase italic tracking-tighter">Impacto en Margen</h4>
              <p className="text-[10px] font-bold text-slate-500 uppercase italic tracking-widest">Pérdida por Improvisación</p>
              <div className="pt-4">
                <p className="text-4xl font-black italic text-rose-500 tracking-tighter">-8.5%</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase italic mt-1">Estimado de fuga de capital mensual</p>
              </div>
              <div className="space-y-3 pt-4">
                <ImpactItem label="Errores por orden" value="12%" color="text-rose-400" />
                <ImpactItem label="Retrabajo" value="18%" color="text-rose-400" />
                <ImpactItem label="Desperdicio" value="5%" color="text-rose-400" />
              </div>
            </div>
          </div>

          <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-8 shadow-sm space-y-6">
            <h4 className="font-black text-sm text-slate-800 uppercase italic flex items-center gap-2">
              <AlertCircle size={18} className="text-rose-500" /> Alertas de Trazabilidad
            </h4>
            <div className="space-y-4">
               <AlertItem 
                 title="Sabotaje Pasivo Detectado" 
                 desc="3 órdenes registradas 48h después de la venta." 
                 type="warning"
               />
               <AlertItem 
                 title="Desviación de Flujo" 
                 desc="EMI-042 saltó de 'Pendiente' a 'Completado' sin validación." 
                 type="danger"
               />
               <AlertItem 
                 title="Registro Incompleto" 
                 desc="ALE-015 no posee teléfono de contacto." 
                 type="info"
               />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ImpactItem = ({ label, value, color }: any) => (
  <div className="flex justify-between items-center border-b border-white/5 pb-2">
    <span className="text-[9px] font-black uppercase italic text-slate-400">{label}</span>
    <span className={`text-xs font-black italic ${color}`}>{value}</span>
  </div>
);

const AlertItem = ({ title, desc, type }: any) => (
  <div className={`p-4 rounded-2xl border-l-4 italic ${
    type === 'danger' ? 'bg-rose-50 border-rose-500 text-rose-700' :
    type === 'warning' ? 'bg-amber-50 border-amber-500 text-amber-700' :
    'bg-blue-50 border-blue-500 text-blue-700'
  }`}>
    <p className="text-[10px] font-black uppercase mb-1">{title}</p>
    <p className="text-[9px] font-bold opacity-80">{desc}</p>
  </div>
);

export default StaffPerformance;
