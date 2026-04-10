
import React from 'react';
import { 
  Zap, 
  ShieldCheck, 
  Users, 
  Building2, 
  Star, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  Instagram,
  Phone,
  LayoutGrid,
  Heart
} from 'lucide-react';

interface Props {
  onPublicRadar: () => void;
}

const LandingPage: React.FC<Props> = ({ onPublicRadar }) => {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#004ea1] selection:text-white italic">
      {/* NAVIGATION */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#000814] text-white rounded-xl flex items-center justify-center shadow-lg">
              <Zap size={20} />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase italic">ROXTOR</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#vision" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#004ea1] transition-colors">Visión</a>
            <a href="#b2b" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#004ea1] transition-colors">Corporativo</a>
            <a href="#b2c" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#004ea1] transition-colors">Personal</a>
            <button 
              onClick={onPublicRadar}
              className="bg-[#004ea1] text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-xl"
            >
              Radar de Pedidos
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-600 px-4 py-1 rounded-full border border-rose-100">
              <Star size={14} fill="currentColor" />
              <span className="text-[10px] font-black uppercase tracking-widest">Líderes en Personalización</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase leading-[0.85] text-[#000814]">
              Transformamos <span className="text-[#004ea1]">Ideas</span> en Identidad.
            </h1>
            <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-xl">
              Soluciones creativas inteligentes para empresas y personas. Desde una pieza emocional hasta dotaciones corporativas masivas.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={onPublicRadar}
                className="bg-[#004ea1] text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#003a7a] transition-all shadow-2xl shadow-blue-200 flex items-center gap-3"
              >
                Hacer Pedido Web <ArrowRight size={18} />
              </button>
              <button className="bg-white text-[#000814] border-4 border-slate-50 px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all flex items-center gap-3">
                Hablar con un Experto
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="bg-slate-50 rounded-[4rem] aspect-square overflow-hidden border-8 border-white shadow-2xl relative z-10">
              <img 
                src="https://picsum.photos/seed/roxtor/800/800" 
                alt="Roxtor Work" 
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>

      {/* VISION & MISSION */}
      <section id="vision" className="py-24 bg-[#000814] text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-20 opacity-5 rotate-12"><Zap size={300} /></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
            <div className="space-y-6">
              <h2 className="text-4xl font-black italic uppercase tracking-tighter text-rose-500">Nuestra Misión</h2>
              <p className="text-xl text-slate-300 font-medium leading-relaxed">
                "Transformar ideas en identidad visual a través de soluciones creativas de personalización, garantizando calidad excepcional y tiempos de entrega récord para emprendedores y empresas."
              </p>
            </div>
            <div className="space-y-6">
              <h2 className="text-4xl font-black italic uppercase tracking-tighter text-[#004ea1]">Nuestra Visión</h2>
              <p className="text-xl text-slate-300 font-medium leading-relaxed">
                "Ser el ecosistema de personalización líder en Venezuela, reconocido por la integración de tecnología inteligente y excelencia operativa, impulsando el crecimiento de nuestros aliados y clientes."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* B2B SECTION */}
      <section id="b2b" className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-[#004ea1]">
                <Building2 size={24} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Soluciones Corporativas</span>
              </div>
              <h2 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none text-[#000814]">
                Impulsa tu <span className="text-[#004ea1]">Marca</span> B2B.
              </h2>
            </div>
            <p className="max-w-md text-slate-500 font-medium italic">
              Dotaciones, uniformes y material POP con trazabilidad total y precios de mayorista garantizados.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<ShieldCheck size={32} />}
              title="Calidad Industrial"
              desc="Materiales seleccionados para durabilidad extrema en entornos de trabajo."
            />
            <FeatureCard 
              icon={<Clock size={32} />}
              title="Tiempos Récord"
              desc="Protocolo Express para entregas urgentes sin comprometer el acabado."
            />
            <FeatureCard 
              icon={<LayoutGrid size={32} />}
              title="Gestión de Lotes"
              desc="Control exacto de tallas y especificaciones para equipos grandes."
            />
          </div>
        </div>
      </section>

      {/* B2C SECTION */}
      <section id="b2c" className="py-24 px-6">
        <div className="max-w-7xl mx-auto bg-[#004ea1] rounded-[4rem] p-12 md:p-20 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute bottom-0 right-0 p-10 opacity-10 -rotate-12"><Heart size={200} /></div>
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none">
                Momentos que <span className="text-rose-400">Perduran</span>.
              </h2>
              <p className="text-lg text-blue-100 font-medium leading-relaxed">
                Para el público B2C, ofrecemos la magia de la personalización individual. Cumpleaños, regalos especiales y piezas únicas con narrativa emocional.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-4 font-black uppercase text-xs italic">
                  <CheckCircle2 className="text-rose-400" size={20} /> Franelas Microdurazno Premium
                </li>
                <li className="flex items-center gap-4 font-black uppercase text-xs italic">
                  <CheckCircle2 className="text-rose-400" size={20} /> Diseños Creativos a Medida
                </li>
                <li className="flex items-center gap-4 font-black uppercase text-xs italic">
                  <CheckCircle2 className="text-rose-400" size={20} /> Empaque de Regalo Exclusivo
                </li>
              </ul>
              <button className="bg-white text-[#004ea1] px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-transform shadow-xl">
                Personalizar Mi Pieza
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <img src="https://picsum.photos/seed/gift1/400/500" className="rounded-3xl shadow-lg" referrerPolicy="no-referrer" />
                <img src="https://picsum.photos/seed/gift2/400/300" className="rounded-3xl shadow-lg" referrerPolicy="no-referrer" />
              </div>
              <div className="space-y-4 pt-8">
                <img src="https://picsum.photos/seed/gift3/400/300" className="rounded-3xl shadow-lg" referrerPolicy="no-referrer" />
                <img src="https://picsum.photos/seed/gift4/400/500" className="rounded-3xl shadow-lg" referrerPolicy="no-referrer" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-50 py-20 px-6 border-t border-slate-200">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#000814] text-white rounded-lg flex items-center justify-center">
                <Zap size={16} />
              </div>
              <span className="text-lg font-black tracking-tighter uppercase italic">ROXTOR</span>
            </div>
            <p className="text-xs text-slate-400 font-bold uppercase italic leading-relaxed">
              Soluciones Creativas Inteligentes.<br/>Ciudad Guayana, Venezuela.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-black uppercase text-[10px] tracking-widest text-slate-900 italic">Contacto</h4>
            <div className="space-y-2">
              <a href="tel:+584249635252" className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#004ea1] transition-colors italic">
                <Phone size={14} /> +58 424 9635252
              </a>
              <a href="https://instagram.com/roxtor.pzo" className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#004ea1] transition-colors italic">
                <Instagram size={14} /> @roxtor.pzo
              </a>
            </div>
          </div>
          <div className="md:col-span-2 space-y-4">
            <h4 className="font-black uppercase text-[10px] tracking-widest text-slate-900 italic">Únete a la Red Roxtor</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed italic">
              Recibe ofertas exclusivas para empresas y adelantos de nuestras nuevas colecciones.
            </p>
            <div className="flex gap-2">
              <input type="email" placeholder="TU EMAIL" className="bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-[#004ea1] flex-1" />
              <button className="bg-[#000814] text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-[#004ea1] transition-colors">
                Unirme
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="space-y-2 text-center md:text-left">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">© 2026 ROXTOR. Todos los derechos reservados.</p>
            <p className="text-[10px] font-bold text-slate-400 italic">
              📖 “A su tiempo segaremos, si no desmayamos.” — Gálatas 6:9
            </p>
            <p className="text-[10px] font-bold text-slate-400 italic">
              📖 “Y todo lo que hagáis, hacedlo de corazón, como para el Señor y no para los hombres.” - Colosenses 3:23
            </p>
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-[9px] font-black text-slate-300 uppercase tracking-widest hover:text-slate-600 italic">Privacidad</a>
            <a href="#" className="text-[9px] font-black text-slate-300 uppercase tracking-widest hover:text-slate-600 italic">Términos</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: any) => (
  <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-100 hover:border-[#004ea1]/20 hover:shadow-2xl transition-all group italic">
    <div className="w-16 h-16 bg-slate-50 text-[#004ea1] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
      {icon}
    </div>
    <h4 className="text-xl font-black text-[#000814] uppercase italic mb-3">{title}</h4>
    <p className="text-sm text-slate-500 font-medium leading-relaxed">{desc}</p>
  </div>
);

export default LandingPage;
