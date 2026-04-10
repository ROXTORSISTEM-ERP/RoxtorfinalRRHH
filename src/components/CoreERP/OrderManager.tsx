
import React, { useState } from 'react';
import { Order, AppSettings, Agent, Workshop, Product } from '../../types';
import { createOrder, updateOrderStatus } from '../../services/orders';
import { handleWorkflowTransition } from '../../services/workflow';
import { 
  Plus, 
  Search, 
  Filter, 
  ChevronRight, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Palette,
  Hammer,
  Truck,
  User
} from 'lucide-react';

interface Props {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  settings: AppSettings;
  agents: Agent[];
  workshops: Workshop[];
  products: Product[];
  currentStoreId: string;
}

const OrderManager: React.FC<Props> = ({ 
  orders, 
  setOrders, 
  settings, 
  agents, 
  workshops, 
  products,
  currentStoreId 
}) => {
  const [filter, setFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.customerName.toLowerCase().includes(filter.toLowerCase()) || 
                         o.orderNumber.toLowerCase().includes(filter.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (order: Order, newStatus: any) => {
    const updatedOrder = await handleWorkflowTransition(order, newStatus, 'system', settings);
    setOrders(prev => prev.map(o => o.id === order.id ? updatedOrder : o));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-3xl font-black text-[#000814] italic uppercase tracking-tighter">Gestión de Órdenes</h2>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar orden o cliente..." 
              className="w-full pl-10 pr-4 py-2 bg-white border-2 border-slate-100 rounded-xl focus:border-[#004ea1] outline-none transition-all"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <select 
            className="px-4 py-2 bg-white border-2 border-slate-100 rounded-xl outline-none focus:border-[#004ea1]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="diseño">Diseño</option>
            <option value="producción">Producción</option>
            <option value="taller">Taller</option>
            <option value="completado">Completados</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.map(order => (
          <div key={order.id} className="bg-white border-2 border-slate-50 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all border-l-8 border-l-[#004ea1]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{order.customerName}</p>
                <h3 className="text-2xl font-black italic tracking-tighter">#{order.orderNumber}</h3>
              </div>
              <StatusBadge status={order.status} />
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
                <Clock size={16} />
                <span>Entrega: {order.deliveryDate || 'No definida'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
                <User size={16} />
                <span>Agente: {agents.find(a => a.id === order.assignedAgentId)?.name || 'Sin asignar'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => handleStatusChange(order, 'diseño')}
                className="flex items-center justify-center gap-2 p-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all"
              >
                <Palette size={14} /> Diseño
              </button>
              <button 
                onClick={() => handleStatusChange(order, 'taller')}
                className="flex items-center justify-center gap-2 p-2 bg-amber-50 text-amber-600 rounded-xl text-[10px] font-black uppercase hover:bg-amber-600 hover:text-white transition-all"
              >
                <Hammer size={14} /> Taller
              </button>
              <button 
                onClick={() => handleStatusChange(order, 'completado')}
                className="col-span-2 flex items-center justify-center gap-2 p-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all"
              >
                <CheckCircle size={14} /> Finalizar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    pendiente: 'bg-slate-100 text-slate-600',
    diseño: 'bg-blue-100 text-blue-600',
    producción: 'bg-purple-100 text-purple-600',
    taller: 'bg-amber-100 text-amber-600',
    completado: 'bg-emerald-100 text-emerald-600'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase italic ${colors[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
};

export default OrderManager;
