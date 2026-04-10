
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Order, Workshop, WorkshopWorkflowStatus, AppSettings } from '../types';
import { 
  Scissors, 
  CheckCircle2, 
  Clock, 
  Package, 
  Truck, 
  AlertCircle,
  ChevronRight,
  MessageCircle,
  ExternalLink
} from 'lucide-react';

interface Props {
  orders: Order[];
  workshops: Workshop[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  settings: AppSettings;
  workshopId?: string; // Prop opcional para vista previa
}

const WorkshopQueue: React.FC<Props> = ({ orders, workshops, setOrders, settings, workshopId: propWorkshopId }) => {
  const { workshopId: paramWorkshopId } = useParams<{ workshopId: string }>();
  const workshopId = propWorkshopId || paramWorkshopId;
  const workshop = workshops.find(w => w.id === workshopId);
  
  const [workshopOrders, setWorkshopOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (workshopId) {
      const filtered = orders.filter(o => o.assignedWorkshopIds?.includes(workshopId))
        .sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime());
      setWorkshopOrders(filtered);
    }
  }, [orders, workshopId]);

  if (!workshop) {
    return (
      <div className="min-h-screen bg-[#000814] flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-[3rem] text-center space-y-4 shadow-2xl">
          <AlertCircle size={64} className="mx-auto text-red-500" />
          <h2 className="text-2xl font-black uppercase italic tracking-tighter">Taller no encontrado</h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">El enlace es inválido o el taller fue eliminado</p>
        </div>
      </div>
    );
  }

  const updateStatus = (orderId: string, newStatus: WorkshopWorkflowStatus) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const updatedWorkflowStatus = { ...(o.workshopWorkflowStatus || {}), [workshopId!]: newStatus };
        
        let generalStatus = o.status;
        let taskStatus = o.taskStatus;

        // Automatización de flujo de trabajo basada en el estado del taller
        if (newStatus === 'COSTURA') {
          // Si el taller inicia costura, la orden general pasa a 'taller' y tarea a 'confeccion'
          generalStatus = 'taller';
          taskStatus = 'confeccion';
        } else if (newStatus === 'TERMINADO') {
          // Si el taller termina, la orden general pasa a 'bordado' (como paso previo a recepción final)
          generalStatus = 'bordado';
          taskStatus = 'terminado';
        } else if (newStatus === 'Entregado') {
          // Si ya se entregó físicamente a la tienda, se marca como bordado para control final
          generalStatus = 'bordado';
          taskStatus = 'terminado';
        }

        const historyEntry = {
          timestamp: Date.now(),
          agentId: 'taller',
          action: `[TALLER] ${workshop.name} marcó estado: ${newStatus} -> Flujo: ${generalStatus.toUpperCase()}`,
          status: generalStatus
        };

        return { 
          ...o, 
          status: generalStatus,
          taskStatus: taskStatus,
          workshopWorkflowStatus: updatedWorkflowStatus, 
          history: [...(o.history || []), historyEntry] 
        };
      }
      return o;
    }));
  };

  const getStatusColor = (status: WorkshopWorkflowStatus) => {
    switch (status) {
      case 'Recibido': return 'bg-blue-500 text-white';
      case 'INICIAR CORTE': return 'bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]';
      case 'COSTURA': return 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]';
      case 'TERMINADO': return 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]';
      case 'Entregado': return 'bg-slate-400 text-white';
      default: return 'bg-slate-100 text-slate-400';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-[#000814] text-white p-8 rounded-b-[3rem] shadow-2xl">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Scissors className="text-blue-400" size={24} />
              <h1 className="text-3xl font-black uppercase italic tracking-tighter leading-none">{workshop.name}</h1>
            </div>
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.3em] italic">Cola de Producción en Tiempo Real</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-500 uppercase italic">Capacidad Diaria</p>
            <p className="text-xl font-black italic">{workshop.dailyCapacity || 0} Uds</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {workshopOrders.length === 0 ? (
          <div className="py-32 text-center bg-white rounded-[3rem] border-4 border-dashed border-slate-100 opacity-50">
            <Clock size={64} className="mx-auto mb-4 text-slate-200" />
            <p className="font-black uppercase tracking-widest text-xs italic">No tienes pedidos asignados actualmente</p>
          </div>
        ) : (
          workshopOrders.map(order => {
            const currentStatus = order.workshopWorkflowStatus?.[workshopId!] || 'Pendiente';
            const isUrgent = order.isUrgent || (new Date(order.deliveryDate).getTime() - Date.now() < 86400000);

            return (
              <div key={order.id} className={`bg-white rounded-[2.5rem] p-8 shadow-sm border-4 transition-all ${isUrgent ? 'border-red-100' : 'border-white'} hover:shadow-xl`}>
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black text-[#000814] uppercase italic tracking-tighter">Orden #{order.orderNumber}</h3>
                      {isUrgent && <span className="bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded-lg animate-pulse">URGENTE</span>}
                      {order.isInitialQueue && <span className="bg-blue-600 text-white text-[8px] font-black px-2 py-1 rounded-lg">CARGA INICIAL</span>}
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase italic">Entrega: {new Date(order.deliveryDate).toLocaleDateString()}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase italic tracking-widest ${getStatusColor(currentStatus)}`}>
                    {currentStatus}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 mb-8">
                  <p className="text-[10px] font-black text-slate-400 uppercase italic mb-2">Detalles del Trabajo</p>
                  <p className="text-sm font-bold text-[#000814] uppercase italic leading-relaxed">
                    {order.technicalDetails || "Sin especificaciones técnicas detalladas"}
                  </p>
                </div>

                {/* Workflow Buttons */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button 
                    disabled={currentStatus !== 'Pendiente'}
                    onClick={() => updateStatus(order.id, 'Recibido')}
                    className={`py-4 rounded-xl font-black text-[9px] uppercase tracking-widest italic transition-all ${
                      currentStatus === 'Recibido' ? 'bg-blue-500 text-white shadow-inner' : 'bg-slate-100 text-slate-400 hover:bg-blue-50 hover:text-blue-500'
                    }`}
                  >
                    Recibido
                  </button>
                  <button 
                    disabled={currentStatus !== 'Recibido'}
                    onClick={() => updateStatus(order.id, 'INICIAR CORTE')}
                    className={`py-4 rounded-xl font-black text-[9px] uppercase tracking-widest italic transition-all ${
                      currentStatus === 'INICIAR CORTE' ? 'bg-amber-500 text-white shadow-inner' : 'bg-slate-100 text-slate-400 hover:bg-amber-50 hover:text-amber-500'
                    }`}
                  >
                    Iniciar Corte
                  </button>
                  <button 
                    disabled={currentStatus !== 'INICIAR CORTE'}
                    onClick={() => updateStatus(order.id, 'COSTURA')}
                    className={`py-4 rounded-xl font-black text-[9px] uppercase tracking-widest italic transition-all ${
                      currentStatus === 'COSTURA' ? 'bg-indigo-500 text-white shadow-inner' : 'bg-slate-100 text-slate-400 hover:bg-indigo-50 hover:text-indigo-500'
                    }`}
                  >
                    Costura
                  </button>
                  <button 
                    disabled={currentStatus !== 'COSTURA'}
                    onClick={() => updateStatus(order.id, 'TERMINADO')}
                    className={`py-4 rounded-xl font-black text-[9px] uppercase tracking-widest italic transition-all ${
                      currentStatus === 'TERMINADO' ? 'bg-emerald-500 text-white shadow-inner' : 'bg-slate-100 text-slate-400 hover:bg-emerald-50 hover:text-emerald-500'
                    }`}
                  >
                    Terminado
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Branding */}
      <div className="text-center py-10 opacity-30">
        <p className="text-[10px] font-black uppercase italic tracking-[0.5em]">Roxtor PZO: Soluciones Creativas</p>
      </div>
    </div>
  );
};

export default WorkshopQueue;
