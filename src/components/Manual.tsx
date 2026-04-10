
import React from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Zap, 
  MessageCircle, 
  ShieldAlert, 
  DollarSign, 
  PackageCheck,
  Power,
  ChevronRight,
  ClipboardList
} from 'lucide-react';

const Manual: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-[#000814] text-white rounded-2xl flex items-center justify-center mx-auto shadow-xl rotate-3">
          <BookOpen size={32} />
        </div>
        <h2 className="text-4xl font-black text-[#000814] uppercase italic tracking-tighter">PROTOCOLO OPERATIVO</h2>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest italic">Guía diaria obligatoria para Agentes Roxtor</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* FASE 1: APERTURA */}
        <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-10 shadow-sm space-y-6 hover:shadow-xl transition-all">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
            <div className="w-10 h-10 bg-blue-50 text-[#004ea1] rounded-xl flex items-center justify-center font-black italic shadow-inner">01</div>
            <h4 className="text-lg font-black uppercase italic text-[#000814]">Apertura de Sistema</h4>
          </div>
          <ul className="space-y-4">
            <StepItem icon={<Power size={14} />} text="Iniciar sesión con su PIN personal y seleccionar la SUCURSAL correcta." />
            <StepItem icon={<RefreshCwIcon size={14} />} text="Verificar que la TASA BCV esté actualizada en el Radar (Botón Actualizar)." />
            <StepItem icon={<ClipboardList size={14} />} text="Revisar el 'Tablero de Combate' para identificar pedidos urgentes del día." />
          </ul>
        </div>

        {/* FASE 2: GESTIÓN DE VENTAS */}
        <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-10 shadow-sm space-y-6 hover:shadow-xl transition-all">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center font-black italic shadow-inner">02</div>
            <h4 className="text-lg font-black uppercase italic text-[#000814]">Atención y Carga</h4>
          </div>
          <ul className="space-y-4">
            <StepItem icon={<Zap size={14} />} text="Usar RADAR AI para procesar capturas de WhatsApp o notas de voz rápidamente." />
            <StepItem icon={<DollarSign size={14} />} text="REGLA DE ORO: Solicitar siempre el 50% DE ABONO para iniciar cualquier diseño o trabajo." />
            <StepItem icon={<ShieldAlert size={14} />} text="Informar al cliente: No se aceptan devoluciones de dinero una vez procesada la orden." />
          </ul>
        </div>

        {/* FASE 3: PRODUCCIÓN */}
        <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-10 shadow-sm space-y-6 hover:shadow-xl transition-all">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-black italic shadow-inner">03</div>
            <h4 className="text-lg font-black uppercase italic text-[#000814]">Flujo y Taller</h4>
          </div>
          <ul className="space-y-4">
            <StepItem icon={<ChevronRight size={14} />} text="Mover las órdenes de estado (Diseño -> Impresión) a medida que avances." />
            <StepItem icon={<MessageCircle size={14} />} text="Si el pedido va a taller externo, enviar la Hoja de Especificaciones vía WhatsApp desde el sistema." />
            <StepItem icon={<CheckCircle2 size={14} />} text="Al finalizar, mover a 'COMPLETADO' para que el cliente reciba la notificación (si aplica)." />
          </ul>
        </div>

        {/* FASE 4: CIERRE */}
        <div className="bg-[#000814] border-4 border-white/5 rounded-[3rem] p-10 shadow-2xl space-y-6 text-white">
          <div className="flex items-center gap-4 border-b border-white/10 pb-6">
            <div className="w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center font-black italic shadow-lg">04</div>
            <h4 className="text-lg font-black uppercase italic">Cierre Diario</h4>
          </div>
          <ul className="space-y-4">
            <StepItem icon={<PackageCheck size={14} className="text-blue-400" />} text="Confirmar que todos los pedidos entregados estén marcados como 'DESPACHADOS'." />
            <StepItem icon={<DollarSign size={14} className="text-emerald-400" />} text="Ejecutar 'MI CIERRE' y verificar que el monto en caja coincida con el reporte del sistema." />
            <StepItem icon={<MessageCircle size={14} className="text-blue-400" />} text="Enviar el resumen del cierre al grupo de WhatsApp de Gerencia." />
          </ul>
        </div>
      </div>

      {/* REGLAS CRÍTICAS */}
      <div className="bg-rose-50 border-4 border-rose-100 rounded-[3rem] p-10 space-y-6">
        <h5 className="text-xs font-black text-rose-600 uppercase tracking-[0.3em] italic flex items-center gap-3">
          <ShieldAlert size={20} /> MANDAMIENTOS ROXTOR (LECTURA OBLIGATORIA)
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <p className="text-[11px] font-black text-slate-800 uppercase leading-relaxed italic">
              1. NUNCA entregar una mercancía si el cliente no ha cancelado el 100% del saldo pendiente.
            </p>
            <p className="text-[11px] font-black text-slate-800 uppercase leading-relaxed italic">
              2. El diseño final debe ser aprobado por el cliente ANTES de imprimir o bordar.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-black text-slate-800 uppercase leading-relaxed italic">
              3. Si hay un error en producción, reportar inmediatamente en el historial de la orden para trazabilidad.
            </p>
            <p className="text-[11px] font-black text-slate-800 uppercase leading-relaxed italic">
              4. Mantener el inventario actualizado: si se vende una gorra física, descontarla al instante.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StepItem = ({ icon, text, className }: { icon: React.ReactNode, text: string, className?: string }) => (
  <li className={`flex gap-4 items-start group ${className}`}>
    <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-[#000814] mt-0.5 group-hover:bg-[#000814] group-hover:text-white transition-all">
      {icon}
    </div>
    <p className="text-[10px] font-black text-slate-600 uppercase italic leading-relaxed group-hover:text-slate-900 transition-colors">
      {text}
    </p>
  </li>
);

const RefreshCwIcon = ({ size, className }: { size: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
);

export default Manual;
