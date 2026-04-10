
import React, { useState } from 'react';
import { 
  CheckSquare, 
  ClipboardList, 
  UserCheck, 
  ShoppingCart, 
  Zap, 
  ShieldCheck,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export const DEPARTMENT_CHECKLISTS = [
  {
    id: 'ventas',
    name: 'Ventas y Atención',
    icon: <ShoppingCart size={20} />,
    items: [
      'Toma de datos completa (Nombre, Cédula, Teléfono).',
      'Explicación de tiempos de entrega (CONSULTAR días).',
      'Solicitud de abono del 50% obligatorio.',
      'Carga de capture de pago en el sistema.',
      'Confirmación de fecha de retiro.'
    ]
  },
  {
    id: 'recepcion',
    name: 'Recepción y Radar',
    icon: <ClipboardList size={20} />,
    items: [
      'Validación de archivos de referencia (calidad).',
      'Confirmación de Talla, Color y Tela.',
      'Asignación de agente responsable.'
    ]
  },
  {
    id: 'operaciones',
    name: 'Operaciones y Taller',
    icon: <Zap size={20} />,
    items: [
      'Verificación de insumos disponibles.',
      'Actualización de estado de Tareas asignadas.',
      'Control de calidad post-producción.',
      'Registro de desperdicios prendas dañadas si aplica.',
      'Notificación de pedido listo para entrega.'
    ]
  }
];

const Checklists: React.FC = () => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleItem = (deptId: string, index: number) => {
    const key = `${deptId}-${index}`;
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 italic">
      <div className="space-y-1">
        <h3 className="text-4xl font-black text-[#000814] uppercase tracking-tighter italic leading-none">Checklists de Calidad</h3>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
          <CheckSquare size={14} className="text-emerald-500" /> PROTOCOLOS OBLIGATORIOS POR DEPARTAMENTO
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {DEPARTMENT_CHECKLISTS.map((dept) => {
          const deptCheckedCount = dept.items.filter((_, i) => checkedItems[`${dept.id}-${i}`]).length;
          const progress = (deptCheckedCount / dept.items.length) * 100;

          return (
            <div key={dept.id} className="bg-white border-4 border-slate-50 rounded-[3.5rem] p-8 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-slate-50 text-[#004ea1] rounded-2xl shadow-inner">{dept.icon}</div>
                  <h4 className="font-black text-sm text-slate-800 uppercase italic">{dept.name}</h4>
                </div>
                <span className={`text-[10px] font-black italic ${progress === 100 ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {deptCheckedCount}/{dept.items.length}
                </span>
              </div>

              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-[#004ea1]'}`} 
                  style={{ width: `${progress}%` }} 
                />
              </div>

              <div className="space-y-3">
                {dept.items.map((item, index) => (
                  <button 
                    key={index}
                    onClick={() => toggleItem(dept.id, index)}
                    className={`w-full flex items-start gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                      checkedItems[`${dept.id}-${index}`] 
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                        : 'bg-white border-slate-50 text-slate-500 hover:border-slate-100'
                    }`}
                  >
                    <div className={`mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                      checkedItems[`${dept.id}-${index}`] ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200'
                    }`}>
                      {checkedItems[`${dept.id}-${index}`] && <CheckCircle2 size={12} />}
                    </div>
                    <span className="text-[10px] font-bold uppercase leading-tight">{item}</span>
                  </button>
                ))}
              </div>

              {progress === 100 && (
                <div className="bg-emerald-50 p-4 rounded-2xl flex items-center gap-3 animate-in zoom-in-95">
                  <ShieldCheck size={20} className="text-emerald-500" />
                  <p className="text-[9px] font-black text-emerald-600 uppercase italic">Protocolo de {dept.name} completado con éxito.</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-amber-50 border-4 border-amber-100 rounded-[3rem] p-8 flex items-start gap-6 shadow-sm">
        <div className="p-4 bg-amber-500 text-white rounded-3xl shadow-xl rotate-3"><AlertCircle size={32} /></div>
        <div className="space-y-2">
          <h4 className="text-xl font-black text-amber-800 uppercase italic tracking-tighter">Recordatorio de Disciplina</h4>
          <p className="text-[10px] font-bold text-amber-600 uppercase italic leading-relaxed">
            El incumplimiento de estos checklists afecta directamente tu **Índice de Disciplina Operativa (IDO)**. 
            Asegúrate de marcar cada paso al completar una tarea para mantener tu clasificación en el **Grupo A**.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Checklists;
