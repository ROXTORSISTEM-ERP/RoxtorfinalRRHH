
import React, { useMemo } from 'react';
import { Order, AppSettings } from '../types';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Building2
} from 'lucide-react';

interface Props {
  orders: Order[];
  settings: AppSettings;
}

const AccountsReceivable: React.FC<Props> = ({ orders, settings }) => {
  const pendingOrders = useMemo(() => {
    return orders.filter(o => !o.isDirectSale && o.restanteUsd > 0 && o.status !== 'completado');
  }, [orders]);

  const totalReceivable = pendingOrders.reduce((acc, o) => acc + o.restanteUsd, 0);
  const b2bReceivable = pendingOrders.filter(o => o.customerType === 'B2B').reduce((acc, o) => acc + o.restanteUsd, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 italic">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h3 className="text-4xl font-black text-[#000814] uppercase tracking-tighter italic leading-none">Cuentas por Cobrar</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
            <DollarSign size={14} className="text-emerald-500" /> CONTROL DE CRÉDITOS Y SALDOS PENDIENTES
          </p>
        </div>
        <div className="bg-white border-4 border-slate-50 p-6 rounded-[2.5rem] shadow-sm flex items-center gap-8">
          <div className="text-center">
            <p className="text-[8px] font-black text-slate-400 uppercase italic mb-1">Total por Cobrar</p>
            <p className="text-3xl font-black text-emerald-600 italic tracking-tighter">
              ${totalReceivable.toLocaleString()}
            </p>
          </div>
          <div className="h-10 w-px bg-slate-100" />
          <div className="text-center">
            <p className="text-[8px] font-black text-slate-400 uppercase italic mb-1">Cartera B2B</p>
            <p className="text-3xl font-black text-blue-600 italic tracking-tighter">
              ${b2bReceivable.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white border-4 border-slate-50 rounded-[3.5rem] overflow-hidden shadow-sm">
          <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
             <h4 className="font-black text-sm text-slate-800 uppercase italic flex items-center gap-2">
               <Clock size={18} className="text-amber-500" /> Órdenes con Saldo Pendiente
             </h4>
             <span className="text-[9px] font-black text-slate-400 uppercase italic">Trazabilidad Institucional</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white border-b border-slate-50">
                <tr>
                  <th className="px-8 py-5">ORDEN / CLIENTE</th>
                  <th className="px-8 py-5">FECHA ENTREGA</th>
                  <th className="px-8 py-5">TOTAL</th>
                  <th className="px-8 py-5">ABONO</th>
                  <th className="px-8 py-5">RESTANTE</th>
                  <th className="px-8 py-5 text-right">ESTADO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pendingOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center opacity-20 italic">
                      <CheckCircle2 size={48} className="mx-auto mb-4" />
                      <p className="text-xs font-black uppercase tracking-widest">No hay cuentas por cobrar pendientes</p>
                    </td>
                  </tr>
                ) : (
                  pendingOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${order.customerType === 'B2B' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                            {order.customerType === 'B2B' ? <Building2 size={18} /> : <Users size={18} />}
                          </div>
                          <div>
                            <p className="font-black text-slate-800 uppercase italic text-sm">{order.orderNumber}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase italic">{order.customerName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Calendar size={14} />
                          <span className="text-[10px] font-black italic">{new Date(order.deliveryDate).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 font-bold text-slate-800 text-sm">${order.totalUsd}</td>
                      <td className="px-8 py-6 font-bold text-emerald-600 text-sm">${order.abonoUsd}</td>
                      <td className="px-8 py-6">
                        <span className="font-black text-rose-600 text-base italic">${order.restanteUsd}</span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className={`px-4 py-1.5 rounded-xl font-black text-[10px] uppercase italic shadow-sm ${
                          order.status === 'Por Validar' ? 'bg-amber-50 text-amber-600' :
                          order.status === 'pendiente' ? 'bg-blue-50 text-blue-600' :
                          'bg-slate-50 text-slate-600'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#000814] rounded-[3rem] p-8 text-white space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><ShieldAlert size={100} /></div>
            <div className="relative z-10 space-y-4">
              <h4 className="text-xl font-black uppercase italic tracking-tighter">Límite de Riesgo</h4>
              <p className="text-[10px] font-bold text-slate-500 uppercase italic tracking-widest">Exposición Financiera Actual</p>
              <div className="pt-4">
                <p className="text-4xl font-black italic text-amber-500 tracking-tighter">
                  {((totalReceivable / (settings.salesGoals?.[0]?.targetAmountUsd || 10000)) * 100).toFixed(1)}%
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase italic mt-1">Del objetivo de ventas mensual</p>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mt-4">
                <div 
                  className="h-full bg-amber-500" 
                  style={{ width: `${Math.min(100, (totalReceivable / 10000) * 100)}%` }} 
                />
              </div>
            </div>
          </div>

          <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-8 shadow-sm space-y-6">
            <h4 className="font-black text-sm text-slate-800 uppercase italic flex items-center gap-2">
              <ArrowUpRight size={18} className="text-emerald-500" /> Trazabilidad Institucional
            </h4>
            <div className="space-y-4">
               <div className="p-4 bg-slate-50 rounded-2xl border-l-4 border-blue-500 italic">
                 <p className="text-[10px] font-black uppercase mb-1 text-blue-700">Venta de Orden y Control</p>
                 <p className="text-[9px] font-bold text-slate-500 leading-relaxed">
                   "No vendemos franelas. Vendemos la seguridad de que su dotación estará lista a tiempo, con trazabilidad total en cada paso del proceso."
                 </p>
               </div>
               <div className="p-4 bg-slate-50 rounded-2xl border-l-4 border-emerald-500 italic">
                 <p className="text-[10px] font-black uppercase mb-1 text-emerald-700">Cumplimiento Financiero</p>
                 <p className="text-[9px] font-bold text-slate-500 leading-relaxed">
                   El sistema bloquea automáticamente órdenes con abono inferior al 50%. Esto garantiza el flujo de caja para insumos.
                 </p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountsReceivable;
