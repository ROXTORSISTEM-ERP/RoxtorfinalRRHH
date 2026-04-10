
import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  ChevronRight, 
  Zap, 
  Target, 
  Package, 
  Calculator, 
  FileText, 
  ShieldCheck, 
  Users,
  MessageSquare,
  HelpCircle
} from 'lucide-react';

interface GuideSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string[];
  steps?: string[];
}

const ERP_GUIDE_DATA: GuideSection[] = [
  {
    id: 'radar',
    title: 'Radar AI (Cerebro de Ventas)',
    icon: <Zap className="text-amber-500" />,
    content: [
      'El Radar AI es el motor que procesa los pedidos entrantes.',
      'Puedes pegar textos de WhatsApp o descripciones manuales.',
      'Extrae automáticamente: Cliente, Producto, Cantidad y Especificaciones.',
      'Valida precios contra el Catálogo Maestro (Detal/Mayor).'
    ],
    steps: [
      'Ve a la pestaña RADAR.',
      'Pega el mensaje del cliente en el cuadro de texto.',
      'Haz clic en "PROCESAR CON RADAR AI".',
      'Verifica los datos extraídos y genera la orden.'
    ]
  },
  {
    id: 'operaciones',
    title: 'Flujo de Combate (Operaciones)',
    icon: <Target className="text-rose-500" />,
    content: [
      'Controla la trazabilidad total de cada pedido.',
      'Los estados incluyen: Diseño, Bordado, Sublimación, Taller y Entrega.',
      'Permite mover órdenes entre sedes (Principal vs Centro).',
      'Notifica automáticamente al cliente vía WhatsApp cuando cambia el estado.'
    ],
    steps: [
      'En OPERACIONES, verás todas las órdenes activas.',
      'Usa los botones de estado para mover la orden al siguiente proceso.',
      'Haz clic en el icono de WhatsApp para enviar el estatus al cliente.'
    ]
  },
  {
    id: 'stock',
    title: 'Inventario y Catálogo Maestro',
    icon: <Package className="text-emerald-500" />,
    content: [
      'Gestiona productos, materiales e insumos.',
      'Diferencia entre precios al Detal y al Mayor.',
      'Permite configurar recargos por tallas grandes (XL, XXL, etc.).',
      'Sincroniza el stock entre las diferentes sedes.'
    ],
    steps: [
      'Ve a INVENTARIO.',
      'Haz clic en "NUEVO PRODUCTO" para agregar uno nuevo.',
      'Define nombre, categoría, precios y stock inicial.',
      'Usa "INGENIERÍA DE COSTOS" dentro de cada producto para calcular su rentabilidad.'
    ]
  },
  {
    id: 'costos',
    title: 'Ingeniería de Costos',
    icon: <Calculator className="text-indigo-500" />,
    content: [
      'Es la herramienta más potente para asegurar la rentabilidad.',
      'Calcula el costo real sumando: Materiales + Mano de Obra + Gastos Operativos.',
      'Aplica el margen de ganancia deseado para obtener el precio de venta sugerido.',
      'Permite ajustar precios dinámicamente según el costo de los insumos.'
    ],
    steps: [
      'Dentro de un producto en INVENTARIO, busca el botón de calculadora.',
      'Agrega los materiales necesarios (ej: 0.5m de tela).',
      'Define el costo de mano de obra (confección/estampado).',
      'El sistema te dirá cuánto debes cobrar para ganar el % deseado.'
    ]
  },
  {
    id: 'facturacion',
    title: 'Facturación y Recibos',
    icon: <FileText className="text-blue-500" />,
    content: [
      'Genera recibos digitales profesionales con códigos QR.',
      'Maneja múltiples métodos de pago (Pago Móvil, Zelle, Efectivo).',
      'Registra abonos y saldos pendientes.',
      'Permite imprimir facturas en formato ticket o PDF.'
    ]
  },
  {
    id: 'gerencia',
    title: 'Gerencia y Auditoría',
    icon: <ShieldCheck className="text-slate-800" />,
    content: [
      'Panel de control para dueños y administradores.',
      'Cierre de caja diario detallado.',
      'Reportes de ventas por sede y por agente.',
      'Configuración global del sistema (Tasa del día, PIN Maestro).'
    ]
  }
];

const ERPGuide: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const filteredSections = ERP_GUIDE_DATA.filter(section => 
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.content.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h3 className="text-4xl font-black text-[#000814] uppercase italic tracking-tighter leading-none">GUÍA MAESTRA ROXTOR</h3>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2 italic">
          <BookOpen size={14} className="text-[#004ea1]" /> Centro de Ayuda y Aprendizaje ERP
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
        <input 
          type="text" 
          placeholder="¿Qué necesitas aprender hoy? (ej: costos, pedidos, facturas...)"
          className="w-full bg-white border-4 border-slate-50 rounded-[2.5rem] pl-16 pr-8 py-6 font-bold text-slate-600 shadow-xl outline-none focus:border-blue-500 transition-all italic"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredSections.map((section) => (
          <div 
            key={section.id}
            onClick={() => setSelectedSection(selectedSection === section.id ? null : section.id)}
            className={`bg-white border-4 rounded-[3rem] p-8 shadow-sm hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden ${selectedSection === section.id ? 'border-blue-500' : 'border-slate-50'}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                {section.icon}
              </div>
              <ChevronRight className={`text-slate-300 transition-transform ${selectedSection === section.id ? 'rotate-90' : ''}`} />
            </div>
            
            <h4 className="text-xl font-black text-[#000814] uppercase italic mb-2">{section.title}</h4>
            
            {selectedSection === section.id ? (
              <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
                <div className="space-y-3">
                  {section.content.map((text, i) => (
                    <p key={i} className="text-xs font-bold text-slate-500 leading-relaxed italic flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1 shrink-0" />
                      {text}
                    </p>
                  ))}
                </div>

                {section.steps && (
                  <div className="bg-blue-50 p-6 rounded-[2rem] space-y-3 border-2 border-blue-100">
                    <p className="text-[10px] font-black text-blue-600 uppercase italic flex items-center gap-2">
                      <HelpCircle size={14} /> Paso a Paso:
                    </p>
                    {section.steps.map((step, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <span className="w-5 h-5 bg-blue-600 text-white text-[10px] font-black rounded-lg flex items-center justify-center shrink-0">{i + 1}</span>
                        <p className="text-[10px] font-bold text-blue-800 uppercase italic leading-tight">{step}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[10px] font-bold text-slate-400 uppercase italic line-clamp-2">
                {section.content[0]}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="bg-[#000814] rounded-[3.5rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl border-b-8 border-slate-800">
        <div className="space-y-2 text-center md:text-left">
          <h5 className="text-2xl font-black uppercase italic tracking-tighter">¿Aún tienes dudas?</h5>
          <p className="text-xs font-bold text-slate-400 uppercase italic">Nuestro equipo de soporte está listo para ayudarte en tiempo real.</p>
        </div>
        <a 
          href="https://wa.me/584249635252" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest italic transition-all flex items-center gap-3 shadow-xl active:scale-95"
        >
          <MessageSquare size={18} /> CONTACTAR SOPORTE
        </a>
      </div>
    </div>
  );
};

export default ERPGuide;
