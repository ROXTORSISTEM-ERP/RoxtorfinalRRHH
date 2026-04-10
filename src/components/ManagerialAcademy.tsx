
import React from 'react';
import { 
  BookOpen, 
  Target, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Users, 
  DollarSign,
  ChevronRight,
  PlayCircle,
  Award
} from 'lucide-react';

const ManagerialAcademy: React.FC = () => {
  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700 italic">
      <div className="bg-[#000814] rounded-[4rem] p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12"><BookOpen size={200} /></div>
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-3 bg-white/10 px-6 py-2 rounded-full border border-white/20">
            <Award size={18} className="text-rose-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">Certificación Roxtor ERP</span>
          </div>
          <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-tight">Academia de Eficiencia Gerencial</h2>
          <p className="text-lg text-slate-300 font-medium leading-relaxed">
            Bienvenido al núcleo de formación para directivos. Aquí aprenderás a transformar datos en decisiones estratégicas y a manejar el flujo de combate de ROXTOR con precisión quirúrgica.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <LessonCard 
          icon={<DollarSign size={24} />}
          title="Módulo 1: Finanzas Transparentes"
          description="Aprende a registrar ingresos, egresos y retiros de socios para construir un historial financiero auditable."
          duration="15 min"
          color="bg-emerald-500"
        />
        <LessonCard 
          icon={<Target size={24} />}
          title="Módulo 2: Metas de Venta"
          description="Cómo establecer objetivos mensuales y monitorear el progreso en tiempo real para motivar al equipo."
          duration="10 min"
          color="bg-blue-500"
        />
        <LessonCard 
          icon={<Zap size={24} />}
          title="Módulo 3: Protocolo Express"
          description="Gestión de urgencias y recargos logísticos para maximizar la rentabilidad en pedidos de último minuto."
          duration="12 min"
          color="bg-rose-500"
        />
      </div>

      <div className="bg-white border-4 border-slate-50 rounded-[4rem] p-12 shadow-sm space-y-12">
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#000814] text-white rounded-2xl flex items-center justify-center shadow-lg"><ShieldCheck size={24} /></div>
            <h3 className="text-3xl font-black text-[#000814] uppercase italic tracking-tighter">Guía de Implementación: Plan de Cuentas</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="bg-slate-50 p-8 rounded-[3rem] border-2 border-slate-100 space-y-4">
                <h4 className="text-lg font-black text-[#000814] uppercase italic">1. Registro de Ingresos</h4>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Cada vez que un cliente realiza un abono, el sistema lo registra automáticamente. Es vital que el **Método de Pago** sea exacto (Dólares, Pago Móvil, etc.) para que el cierre de caja al final del día coincida con el dinero físico y digital.
                </p>
                <div className="flex items-center gap-2 text-[#004ea1] font-black text-[10px] uppercase italic">
                  <ChevronRight size={14} /> Tip: Siempre pide el capture de pago.
                </div>
              </div>

              <div className="bg-slate-50 p-8 rounded-[3rem] border-2 border-slate-100 space-y-4">
                <h4 className="text-lg font-black text-[#000814] uppercase italic">2. Gestión de Egresos (Gastos)</h4>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Usa el botón <span className="text-rose-600 font-black">"REGISTRAR RETIRO"</span> en el Cierre de Caja. Clasifica cada gasto:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-3 text-xs font-bold text-slate-500 uppercase italic">
                    <div className="w-2 h-2 bg-rose-500 rounded-full" /> Nómina: Pagos a empleados.
                  </li>
                  <li className="flex items-center gap-3 text-xs font-bold text-slate-500 uppercase italic">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" /> Insumos: Compra de telas, hilos, tintas.
                  </li>
                  <li className="flex items-center gap-3 text-xs font-bold text-slate-500 uppercase italic">
                    <div className="w-2 h-2 bg-amber-500 rounded-full" /> Socios: Retiros personales (Colegio, Mercado).
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-[#000814] text-white p-10 rounded-[4rem] shadow-2xl space-y-8">
              <h4 className="text-2xl font-black italic uppercase tracking-tighter">¿Por qué registrar Gastos de Socios?</h4>
              <p className="text-slate-400 font-medium leading-relaxed">
                Actualmente, al no tener un sueldo fijo, el negocio es su "caja chica". Esto nubla la rentabilidad real. 
                Al registrar cada gasto personal (hortalizas, colegio, etc.) bajo la categoría <span className="text-rose-400 font-black">SOCIOS</span>, ROXTOR podrá:
              </p>
              <div className="space-y-4">
                <BenefitItem text="Calcular cuánto dinero retira cada socio mensualmente." />
                <BenefitItem text="Determinar si el negocio puede soportar un sueldo fijo mayor o menor." />
                <BenefitItem text="Separar la salud financiera de la empresa de las necesidades personales." />
                <BenefitItem text="Preparar el camino para una estructura corporativa real." />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 rounded-[4rem] p-12 border-2 border-slate-100 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg"><TrendingUp size={24} /></div>
            <h3 className="text-3xl font-black text-[#000814] uppercase italic tracking-tighter">Gastos Fijos vs. Punto de Equilibrio</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h5 className="font-black text-[#000814] uppercase italic">Entendiendo los Gastos Fijos</h5>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                Es muy probable que tus gastos (mercado, colegio, alquiler) no disminuyan, sino que se mantengan constantes. Esto es normal. El objetivo no es necesariamente "gastar menos" en lo vital, sino asegurar que el negocio genere lo suficiente para cubrirlo.
              </p>
            </div>
            <div className="space-y-4">
              <h5 className="font-black text-[#000814] uppercase italic">El Punto de Equilibrio</h5>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                Si tus gastos fijos (incluyendo los de socios) suman $1,500 al mes, y tu margen de ganancia promedio es del 40%, necesitas vender exactamente **$3,750** para no perder dinero. Todo lo que vendas por encima de eso es utilidad real para el crecimiento del taller.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const LessonCard = ({ icon, title, description, duration, color }: any) => (
  <div className="bg-white border-4 border-slate-50 p-8 rounded-[3rem] shadow-sm hover:shadow-xl transition-all group relative overflow-hidden italic">
    <div className={`w-14 h-14 ${color} text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:rotate-6 transition-transform`}>
      {icon}
    </div>
    <h4 className="text-lg font-black text-[#000814] uppercase italic mb-3">{title}</h4>
    <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">{description}</p>
    <div className="flex items-center justify-between mt-auto">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
        <PlayCircle size={14} /> {duration}
      </span>
      <button className="text-[#004ea1] font-black text-[10px] uppercase italic flex items-center gap-2 group-hover:translate-x-2 transition-transform">
        Comenzar <ChevronRight size={14} />
      </button>
    </div>
  </div>
);

const BenefitItem = ({ text }: { text: string }) => (
  <div className="flex items-center gap-3">
    <div className="w-5 h-5 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center">
      <ShieldCheck size={12} />
    </div>
    <p className="text-xs font-bold text-slate-300 uppercase italic">{text}</p>
  </div>
);

export default ManagerialAcademy;
