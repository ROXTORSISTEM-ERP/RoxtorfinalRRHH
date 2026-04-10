import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Share2, 
  ChevronRight, 
  Book, 
  ShieldCheck, 
  Zap, 
  Users, 
  Printer,
  Search,
  CheckCircle2,
  AlertTriangle,
  Palette,
  TrendingUp
} from 'lucide-react';

interface Manual {
  id: string;
  title: string;
  category: 'VENTAS' | 'OPERACIONES' | 'GERENCIA' | 'DISEÑO' | 'RECEPCION';
  content: string;
  lastUpdated: string;
}

const MANUALS: Manual[] = [
  {
    id: 'm1',
    title: 'Protocolo de Atención al Cliente y Cierre',
    category: 'VENTAS',
    lastUpdated: '2024-03-03',
    content: `
# MANUAL DE ATENCIÓN AL CLIENTE ROXTOR

## 1. El Primer Contacto
- **Saludo:** "¡Hola! Bienvenido a Roxtor. Soy [Tu Nombre], ¿en qué podemos ayudarte a crear hoy?"
- **Escucha Activa:** Identifica si es un cliente nuevo o recurrente.
- **Tono:** Profesional, entusiasta y casual.

## 2. Datos Obligatorios en la Orden
Para evitar errores, toda orden DEBE incluir:
- **Nombre Completo:** (Evitar apodos).
- **Cédula/ID:** Vital para facturación y retiro.
- **Teléfono:** Para notificaciones de WhatsApp.
- **Especificaciones:** Tela, Color, Talla (S, M, L, XL...).
- **LISTADO DIGITAL:** en caso de personalizado (SOLICITAR LISTADO en PDF, JPEG o WORD).

## 3. El Cierre de Venta
- **Abono:** 50% obligatorio. Sin abono no hay orden.
- **Capture:** Debe verse claramente el número de referencia y monto.
- **Tiempos:** 3-5 días hábiles (Microdurazno), 7-10 días (Chemises/Camisas).
    `
  },
  {
    id: 'm2',
    title: 'Gestión de Órdenes y Radar AI',
    category: 'RECEPCION',
    lastUpdated: '2024-03-03',
    content: `
# MANUAL DE OPERATIVIDAD: RADAR Y ÓRDENES

## 1. Uso del Radar AI
- **Entrada:** Pega el texto de Whatsapp del cliente o usa Voice Studio para dictar.
- **Validación:** Revisa que el JSON extraído coincida con lo solicitado.
- **Nro-WEB:** El sistema genera automáticamente el correlativo WEB-XXX.

## 2. Llenado de Formularios
- **Diseño:** Describe el arte (Ej: "Logo Roxtor pecho izquierdo 10cm").
- **Taller:** Indica la técnica (Sublimación, Bordado o DTF).
- **Asignación:** Selecciona al agente responsable de cada etapa.
    `
  },
  {
    id: 'm3',
    title: 'Protocolo de Diseño y Aprobación',
    category: 'DISEÑO',
    lastUpdated: '2024-03-03',
    content: `
# MANUAL DE DISEÑO Y CALIDAD

## 1. Recepción de Tarea
- Revisa los archivos de referencia en el Radar.
- Si la calidad es baja, solicita el archivo original (PDF/Vector).

## 2. El Mockup Digital
- Todo diseño debe presentarse sobre una plantilla de la prenda.
- **Aprobación:** Envía el mockup al cliente. "Hola [Nombre], adjunto tu diseño para aprobación."

## 3. Preparación Técnica
- **Vectores:** Textos a curvas.
- **DTF:** Fondo transparente, líneas > 0.5mm.
- **Sublimación:** Modo CMYK, 300 DPI, efecto Espejo.
    `
  },
  {
    id: 'm4',
    title: 'Gestión de Caja y Retiros',
    category: 'GERENCIA',
    lastUpdated: '2024-03-03',
    content: `
# MANUAL FINANCIERO: CAJA Y RETIROS

## 1. Ingreso de Retiros
- Todo retiro de efectivo o transferencia para gastos debe registrarse al momento.
- **Categorías:** Insumos, Nómina, Logística, Socios.

## 2. Items Adicionales
- Si el cliente agrega un item después de la orden inicial:
- Usa la función "Agregar Item" en la orden existente.
- Actualiza el saldo pendiente inmediatamente.
    `
  },
  {
    id: 'm5',
    title: 'Diseño Gran Formato / Full Print',
    category: 'DISEÑO',
    lastUpdated: '2026-03-16',
    content: `
# MANUAL DE PROCEDIMIENTO: DISEÑO GRAN FORMATO / FULL PRINT

## 1. RECEPCIÓN DEL CLIENTE
- Identificar el tipo de diseño y recopilar logos en alta resolución.
- Aclarar que los diseños son referenciales, no copias 100% exactas.

## 2. REQUERIMIENTOS TÉCNICOS
- Logotipos: Vectoriales (PDF, AI).
- Colores: Códigos Hexadecimales o Pantone.
- Tallas: Cuadros específicos (Juvenil, Dama, Caballero).

## 3. PROCESO Y APROBACIÓN
- Mockup: Presentación en maniquí digital.
- Revisión: Máximo 2 rondas de cambios menores.
- Envío: Archivos en CMYK, escala real, perfiles de color para gran formato.
    `
  }
];

const Manuals: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedManual, setSelectedManual] = useState<Manual | null>(null);
  const [confirmedManuals, setConfirmedManuals] = useState<string[]>([]);
  const [idoScore, setIdoScore] = useState(0);

  useEffect(() => {
    const score = (confirmedManuals.length / MANUALS.length) * 100;
    setIdoScore(Math.round(score));
  }, [confirmedManuals]);

  const filteredManuals = MANUALS.filter(m => 
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleConfirmRead = (id: string) => {
    if (!confirmedManuals.includes(id)) {
      setConfirmedManuals(prev => [...prev, id]);
    }
  };

  const handlePrint = () => window.print();

  return (
    <div className="space-y-10 animate-in fade-in duration-700 italic pb-20 max-w-7xl mx-auto">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h3 className="text-5xl font-black text-[#000814] uppercase tracking-tighter italic leading-none">Protocolos</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
            <Book size={14} className="text-amber-500" /> REGLAS DE ORO DE LA OPERATIVIDAD ROXTOR
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="BUSCAR PROCEDIMIENTO..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-5 bg-white border-4 border-slate-50 rounded-2xl text-[10px] font-black uppercase italic focus:outline-none focus:border-amber-200 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* IDO DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border-4 border-slate-50 rounded-[2.5rem] p-8 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest">Manuales Leídos</p>
            <h5 className="text-4xl font-black text-[#000814] uppercase italic tracking-tighter">
              {confirmedManuals.length} <span className="text-slate-100">/ {MANUALS.length}</span>
            </h5>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 shadow-inner">
            <Book size={32} />
          </div>
        </div>

        <div className="bg-[#000814] border-4 border-slate-800 rounded-[2.5rem] p-8 flex items-center justify-between shadow-2xl col-span-1 md:col-span-2 relative overflow-hidden">
          <div className="relative z-10 space-y-4 w-full">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black text-emerald-400 uppercase italic tracking-widest">Capacitación de Agente</p>
                <h5 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">IDO: {idoScore}%</h5>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-white/40 uppercase italic block">Estado:</span>
                <span className={`text-[10px] font-black uppercase italic ${idoScore === 100 ? 'text-emerald-500' : 'text-amber-500'}`}>
                   {idoScore === 100 ? '100% OPERATIVO' : 'EN FORMACIÓN'}
                </span>
              </div>
            </div>
            <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 p-[2px]">
              <div 
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-1000 ease-out rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                style={{ width: `${idoScore}%` }}
              />
            </div>
          </div>
          <Zap size={120} className="absolute -right-8 -bottom-8 text-white/5 -rotate-12" />
        </div>
      </div>

      {/* MANUALS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredManuals.map((manual) => (
          <button 
            key={manual.id}
            onClick={() => setSelectedManual(manual)}
            className="group bg-white border-4 border-slate-50 rounded-[3rem] p-8 text-left hover:shadow-2xl hover:border-amber-100 transition-all space-y-4 relative overflow-hidden active:scale-[0.98]"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <FileText size={80} />
            </div>
            
            <div className="flex justify-between items-start">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                manual.category === 'VENTAS' ? 'bg-blue-500' :
                manual.category === 'DISEÑO' ? 'bg-rose-500' :
                manual.category === 'GERENCIA' ? 'bg-violet-500' : 'bg-emerald-500'
              }`}>
                <Zap size={24} />
              </div>
              {confirmedManuals.includes(manual.id) && (
                <div className="bg-emerald-50 text-emerald-500 p-2 rounded-xl border border-emerald-100 animate-in zoom-in">
                  <CheckCircle2 size={18} />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h4 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter leading-tight group-hover:text-[#000814] transition-colors">{manual.title}</h4>
              <p className="text-[9px] font-bold text-slate-400 uppercase italic">Revisión: {manual.lastUpdated}</p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <span className="px-3 py-1 bg-slate-50 rounded-lg text-[8px] font-black text-slate-500 uppercase italic group-hover:bg-slate-100">{manual.category}</span>
              <span className="text-[8px] font-black text-amber-500 uppercase italic flex items-center gap-1">
                Ver Protocolo <ChevronRight size={10} />
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* MODAL DE LECTURA */}
      {selectedManual && (
        <div className="fixed inset-0 z-[300] bg-[#000814]/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl h-full max-h-[92vh] rounded-[4rem] overflow-hidden flex flex-col shadow-2xl border-8 border-white/10">
            <header className="p-8 md:p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-white shadow-xl rotate-3 ${
                  selectedManual.category === 'VENTAS' ? 'bg-blue-500' :
                  selectedManual.category === 'DISEÑO' ? 'bg-rose-500' :
                  selectedManual.category === 'GERENCIA' ? 'bg-violet-500' : 'bg-emerald-500'
                }`}>
                  <Book size={32} />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">{selectedManual.title}</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest mt-2">ID PROTOCOLO: ROX-{selectedManual.id.toUpperCase()}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handlePrint} className="p-4 bg-white border-2 border-slate-100 text-slate-400 rounded-2xl hover:text-blue-500 hover:border-blue-100 transition-all shadow-sm"><Printer size={20} /></button>
                <button onClick={() => setSelectedManual(null)} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-rose-500 transition-all shadow-xl active:scale-90"><ChevronRight className="rotate-90" size={20} /></button>
              </div>
            </header>
            
            <main className="flex-1 overflow-y-auto p-8 md:p-16 scrollbar-hide">
              <div className="prose prose-slate max-w-none">
                <div className="whitespace-pre-wrap font-medium text-slate-700 leading-relaxed text-lg font-sans selection:bg-amber-100 selection:text-amber-900">
                  {selectedManual.content}
                </div>
              </div>

              {/* IDO CONFIRMATION BOX */}
              <div className="mt-20 p-10 bg-slate-900 rounded-[3rem] border-4 border-slate-800 shadow-2xl relative overflow-hidden group">
                <TrendingUp className="absolute -right-4 -bottom-4 text-white/5 -rotate-12 group-hover:scale-110 transition-transform duration-700" size={160} />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-amber-500 uppercase italic tracking-widest">Compromiso Operativo</p>
                    <h5 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">¿Protocolo comprendido?</h5>
                    <p className="text-[10px] text-slate-400 font-bold uppercase italic max-w-sm">Confirmar lectura suma puntos a tu IDO mensual y asegura la calidad del taller.</p>
                  </div>
                  
                  <button 
                    onClick={() => handleConfirmRead(selectedManual.id)}
                    disabled={confirmedManuals.includes(selectedManual.id)}
                    className={`px-12 py-6 rounded-[2rem] font-black uppercase text-[12px] tracking-widest transition-all flex items-center gap-3 shadow-2xl active:scale-95 ${
                      confirmedManuals.includes(selectedManual.id) 
                      ? 'bg-emerald-500 text-white cursor-default' 
                      : 'bg-white text-slate-900 hover:bg-amber-400'
                    }`}
                  >
                    {confirmedManuals.includes(selectedManual.id) ? (
                      <> <CheckCircle2 size={24} /> LEÍDO Y ENTENDIDO </>
                    ) : (
                      <> <ShieldCheck size={24} /> CONFIRMAR LECTURA </>
                    )}
                  </button>
                </div>
              </div>
            </main>
          </div>
        </div>
      )}

      {/* FOOTER INFO */}
      <div className="bg-[#000814] border-4 border-slate-800 rounded-[3rem] p-10 flex flex-col md:flex-row items-center gap-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10 -rotate-12"><Users size={120} className="text-white" /></div>
        <div className="p-8 bg-white/5 text-amber-500 rounded-[2rem] shadow-xl rotate-3 border border-white/10"><AlertTriangle size={40} /></div>
        <div className="space-y-3 relative z-10 text-center md:text-left">
          <h4 className="text-3xl font-black text-white uppercase italic tracking-tighter">Cultura Roxtor</h4>
          <p className="text-[11px] font-bold text-slate-500 uppercase italic leading-relaxed max-w-3xl">
            "La disciplina es el puente entre las metas y los logros." Estos manuales son la base de nuestra escalabilidad en Ciudad Guayana.
            Todo proceso omitido afecta directamente la rentabilidad y la imagen de la marca.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Manuals;