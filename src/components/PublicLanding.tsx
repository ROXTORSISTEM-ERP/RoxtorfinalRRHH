
import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  GraduationCap, 
  Briefcase, 
  Stethoscope, 
  ArrowRight, 
  MessageCircle, 
  Zap, 
  ShieldCheck, 
  Users,
  Building2,
  ChevronRight,
  Star,
  CheckCircle2,
  Plus,
  Phone,
  Instagram,
  Mail,
  Target,
  Eye,
  Heart,
  Lightbulb,
  Handshake,
  Layers,
  Clock,
  CreditCard,
  Truck,
  Maximize2,
  Search,
  Share2,
  Copy,
  ExternalLink,
  DollarSign
} from 'lucide-react';
import Radar from './Radar';
import ShoppingCart from './ShoppingCart';
import CatalogExplorer from './CatalogExplorer';
import { Product, AppSettings, Order, RadarAlert, Message } from '../types';

interface Props {
  products: Product[];
  orders: Order[];
  settings: AppSettings;
  currentStoreId: string;
  onNewOrder: (order: Order) => void;
  onUpdateOrder: (order: Order) => void;
  onUpdateSettings: (settings: AppSettings) => void;
  radarAlerts: RadarAlert[];
  onNewAlert: (alert: RadarAlert) => void;
  messages: Message[];
  onNewMessage: (message: Message) => void;
  agents: any[];
}

const PublicLanding: React.FC<Props> = ({ products, orders, settings, currentStoreId, onNewOrder, onUpdateOrder, onUpdateSettings, radarAlerts, onNewAlert, messages, onNewMessage, agents }) => {
  const [activeView, setActiveView] = useState<'landing' | 'radar'>('landing');
  const [initialRadarMessage, setInitialRadarMessage] = useState<string | undefined>(undefined);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [directMode, setDirectMode] = useState<'catalog' | 'tracking' | null>(null);
  const [trackingQuery, setTrackingQuery] = useState('');
  const [trackingResult, setTrackingResult] = useState<Order | null>(null);
  const [trackingError, setTrackingError] = useState('');
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    ci: '',
    type: 'presupuesto' as 'presupuesto' | 'estatus',
    details: ''
  });
  const [b2bForm, setB2bForm] = useState({ company: '', request: '' });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [catalogSearch, setCatalogSearch] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Handle Direct Modes (Subdomain Simulation)
    const mode = params.get('mode');
    if (mode === 'catalog') {
      setDirectMode('catalog');
      setIsCatalogOpen(true);
    } else if (mode === 'tracking') {
      setDirectMode('tracking');
      setShowTrackingModal(true);
    }

    if (params.get('view') === 'radar') {
      setActiveView('radar');
    }

    const trackId = params.get('track');
    if (trackId) {
      setTrackingQuery(trackId);
      setShowTrackingModal(true);
      
      // Auto-search if trackId is provided
      const foundOrder = orders.find(o => 
        o.orderNumber.toLowerCase() === trackId.toLowerCase() || 
        o.customerCi.toLowerCase() === trackId.toLowerCase()
      );
      if (foundOrder) {
        setTrackingResult(foundOrder);
      }
    }
    
    if (params.get('show') === 'catalog') {
      setIsCatalogOpen(true);
    }
  }, [orders]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const filteredLandingProducts = products
    .filter(p => p.stock > 0)
    .filter(p => 
      p.name.toLowerCase().includes(catalogSearch.toLowerCase()) || 
      p.category.toLowerCase().includes(catalogSearch.toLowerCase())
    );

  const collections = [
    {
      id: 'deportiva',
      title: 'Línea Deportiva',
      subtitle: 'Clubes de Fútbol & Atletismo',
      description: 'Diseños extraordinarios con tecnología de sublimación de alto rendimiento. Adulto, Juvenil e Infantil.',
      icon: <Trophy className="text-amber-500" size={32} />,
      image: 'https://picsum.photos/seed/football/800/600',
      features: ['Telas Dry-Fit', 'Escudos Bordados/3D', 'Jerseys Full Print']
    },
    {
      id: 'escolar',
      title: 'Línea Escolar',
      subtitle: 'Colegios & Academias',
      description: 'Uniformes que inspiran orgullo. Chemises, monos y chaquetas con cortes modernos y durabilidad extrema.',
      icon: <GraduationCap className="text-blue-500" size={32} />,
      image: 'https://picsum.photos/seed/school/800/600',
      features: ['Algodón Pima', 'Bordados Alta Def.', 'Dotación Institucional']
    },
    {
      id: 'empresarial',
      title: 'Línea Ejecutiva',
      subtitle: 'Corporativo & Oficina',
      description: 'Imagen profesional para tu equipo. Camisas Oxford, polos premium y chaquetas institucionales.',
      icon: <Briefcase className="text-slate-700" size={32} />,
      image: 'https://picsum.photos/seed/office/800/600',
      features: ['Camisas Bordadas', 'Pantalones de Vestir', 'Telas Anti-Arrugas']
    },
    {
      id: 'medica',
      title: 'Línea Médica',
      subtitle: 'Salud & Bienestar',
      description: 'Uniformes quirúrgicos (Scrubs) diseñados para la comodidad en jornadas largas. Estilo y protección.',
      icon: <Stethoscope className="text-emerald-500" size={32} />,
      image: 'https://picsum.photos/seed/medical/800/600',
      features: ['Tela Antifluido', 'Corte Ergonómico', 'Uniformes Médicos']
    }
  ];

  const portfolio = [
    { title: 'FC Guayana - Local', category: 'Deportiva', img: 'https://picsum.photos/seed/jersey1/600/800' },
    { title: 'Colegio Loyola - Promo', category: 'Escolar', img: 'https://picsum.photos/seed/uniform1/600/800' },
    { title: 'Banco Caroní - Ejecutiva', category: 'Corporativa', img: 'https://picsum.photos/seed/shirt1/600/800' },
    { title: 'Hosp. Uyapar - Quirúrgico', category: 'Médica', img: 'https://picsum.photos/seed/scrub1/600/800' },
  ];

  const handleB2BSubmit = () => {
    if (!b2bForm.company || !b2bForm.request) {
      alert("Por favor completa los datos de tu empresa y solicitud.");
      return;
    }
    const message = `🤖 ¡Hola! Soy el representante de ${b2bForm.company}. Mi solicitud es: ${b2bForm.request}. Por favor, ayúdame a procesar esta cotización B2B institucional.`;
    setInitialRadarMessage(message);
    setActiveView('radar');
  };

  const handleCustomerFormSubmit = () => {
    if (!customerForm.name || !customerForm.phone || !customerForm.details) {
      alert("Por favor completa los campos obligatorios.");
      return;
    }

    const message = `🤖 SOLICITUD DE CLIENTE:
Nombre: ${customerForm.name}
Teléfono: ${customerForm.phone}
C.I: ${customerForm.ci}
Tipo: ${customerForm.type.toUpperCase()}
Detalles: ${customerForm.details}`;

    // Si hay API Key configurada, procedemos al Radar AI
    if (settings.cloudSync?.apiKey || (import.meta as any).env?.VITE_GEMINI_API_KEY) {
      setInitialRadarMessage(message);
      setActiveView('radar');
      setShowOrderForm(false);
    } else {
      // Si no hay IA activa, guardamos como alerta en el ERP y simulamos envío de correo
      const newAlert: RadarAlert = {
        id: crypto.randomUUID(),
        type: 'order_request',
        message: `SOLICITUD WEB: ${customerForm.type.toUpperCase()} - ${customerForm.name}`,
        title: `Nueva Solicitud: ${customerForm.name}`,
        description: `${customerForm.type.toUpperCase()} - ${customerForm.details}`,
        status: 'pending',
        timestamp: Date.now(),
        customerName: customerForm.name,
        customerPhone: customerForm.phone,
        metadata: {
          customerName: customerForm.name,
          customerPhone: customerForm.phone,
          customerId: customerForm.ci,
          requestType: customerForm.type,
          details: customerForm.details
        }
      };
      onNewAlert(newAlert);
      
      alert("¡Solicitud recibida! Nuestro equipo de gerencia (gerencia@roxtor.com.ve) procesará su requerimiento a la brevedad.");
      setShowOrderForm(false);
    }
  };

  const handleTrackingSearch = () => {
    setTrackingError('');
    setTrackingResult(null);
    
    if (!trackingQuery.trim()) {
      setTrackingError('Por favor ingrese un número de orden o cédula.');
      return;
    }

    const query = trackingQuery.toLowerCase().trim();
    const foundOrder = orders.find(o => 
      o.orderNumber.toLowerCase() === query || 
      o.customerCi.toLowerCase() === query
    );

    if (foundOrder) {
      setTrackingResult(foundOrder);
      // Update URL without reloading
      const url = new URL(window.location.href);
      url.searchParams.set('track', foundOrder.orderNumber);
      window.history.pushState({}, '', url);
    } else {
      setTrackingError('No se encontró ningún pedido con esos datos. Verifique e intente de nuevo.');
    }
  };

  const copyTrackingLink = (orderNumber?: string) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const link = orderNumber ? `${baseUrl}?track=${orderNumber}` : `${baseUrl}?show=tracking`;
    navigator.clipboard.writeText(link);
    alert("¡Enlace copiado al portapapeles! Puedes pegarlo en tu biografía de Instagram o enviarlo por WhatsApp.");
  };

  if (activeView === 'radar') {
    return (
      <div className="min-h-screen bg-slate-50">
        <nav className="bg-[#000814] text-white p-6 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center shadow-lg rotate-3">
              <Zap size={24} />
            </div>
            <span className="font-black italic tracking-tighter text-xl">ROXTOR <span className="text-rose-500">RADAR</span></span>
          </div>
          <button 
            onClick={() => {
              if (directMode) {
                window.location.href = window.location.origin + window.location.pathname;
              } else {
                setActiveView('landing');
                setInitialRadarMessage(undefined);
              }
            }}
            className="text-[10px] font-black uppercase italic tracking-widest hover:text-rose-500 transition-all"
          >
            {directMode ? 'Ir a la Web Principal' : 'Volver al Inicio'}
          </button>
        </nav>
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          <Radar 
            products={products} 
            orders={orders}
            settings={settings} 
            currentStoreId={currentStoreId} 
            onNewOrder={onNewOrder} 
            messages={messages}
            onNewMessage={onNewMessage}
          />
        </div>
      </div>
    );
  }

  // Render Direct Mode Layouts
  if (directMode === 'catalog' && isCatalogOpen) {
    return (
      <div className="min-h-screen bg-white">
        <CatalogExplorer 
          products={products} 
          onClose={() => window.location.href = window.location.origin + window.location.pathname} 
          onAddToCart={addToCart}
          onConsult={(product) => {
            setInitialRadarMessage(`🤖 Hola, me interesa el producto: ${product.name}. ¿Podrías darme más detalles?`);
            setActiveView('radar');
            setDirectMode(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-rose-500 selection:text-white italic">
      {/* MODAL RASTREO DE PEDIDO */}
      {showTrackingModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#000814]/80 backdrop-blur-md" onClick={() => {
            if (directMode === 'tracking') {
              window.location.href = window.location.origin + window.location.pathname;
            } else {
              setShowTrackingModal(false);
            }
          }} />
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 relative z-10 shadow-2xl border-4 border-slate-50">
            <button 
              onClick={() => {
                if (directMode === 'tracking') {
                  window.location.href = window.location.origin + window.location.pathname;
                } else {
                  setShowTrackingModal(false);
                }
              }}
              className="absolute top-8 right-8 text-slate-300 hover:text-rose-600 transition-colors"
            >
              <Plus className="rotate-45" size={24} />
            </button>
            
            <div className="space-y-8">
              <div className="space-y-2">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                  <Search size={24} />
                </div>
                <h3 className="text-3xl font-black uppercase italic tracking-tighter text-[#000814]">Rastreo de Pedido</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Consulta el estatus en tiempo real de tu orden</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase italic">Nro de Orden o Cédula</label>
                    <button 
                      onClick={() => copyTrackingLink()}
                      className="text-[8px] font-black text-blue-600 uppercase italic flex items-center gap-1 hover:underline"
                    >
                      <Copy size={10} /> Copiar Link del Portal
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-500 transition-all"
                      placeholder="Ej: ROX-1001 o 12345678"
                      value={trackingQuery}
                      onChange={(e) => setTrackingQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleTrackingSearch()}
                    />
                    <button 
                      onClick={handleTrackingSearch}
                      className="bg-blue-600 text-white px-6 rounded-xl font-black text-[10px] uppercase italic hover:bg-blue-700 transition-all"
                    >
                      BUSCAR
                    </button>
                  </div>
                </div>

                {trackingError && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                    <p className="text-[10px] text-rose-600 font-bold italic">{trackingError}</p>
                  </div>
                )}

                {trackingResult && (
                  <div className="p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100 space-y-6 animate-in zoom-in-95 duration-300">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase italic">Orden</p>
                        <p className="text-xl font-black text-[#000814] italic">{trackingResult.orderNumber}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => copyTrackingLink(trackingResult.orderNumber)}
                          className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 transition-all"
                          title="Copiar link de esta orden"
                        >
                          <Copy size={14} />
                        </button>
                        <button 
                          onClick={() => {
                            const storeName = trackingResult.orderNumber.startsWith('P') ? 'Sede Principal Vista al Sol' : trackingResult.orderNumber.startsWith('C') ? 'Sede Centro San Felix' : 'nuestra tienda';
                            const text = `¡Hola! 👋 Este es el estatus de mi pedido ${trackingResult.orderNumber} en ROXTOR: ${trackingResult.status.toUpperCase()}. 🦖\n\n📍 Debes retirar en: *${storeName}*.\n\n🔗 Puedes ver el detalle aquí: ${window.location.origin}${window.location.pathname}?track=${trackingResult.orderNumber}`;
                            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                          }}
                          className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all"
                          title="Compartir por WhatsApp"
                        >
                          <Share2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[8px] font-black text-slate-400 uppercase italic">Estatus Actual en Tablero de Combate</p>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200 animate-pulse">
                          <Zap size={24} />
                        </div>
                        <div>
                          <p className="text-xl font-black text-rose-600 uppercase italic tracking-tighter">
                            {trackingResult.status === 'completado' ? 'LISTO PARA ENTREGA' : trackingResult.status.toUpperCase()}
                          </p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase italic">
                            {trackingResult.taskStatus === 'terminado' ? 'Control de calidad aprobado' : `Fase: ${trackingResult.taskStatus}`}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase italic">Tienda de Retiro</span>
                        <span className="text-[10px] font-bold text-rose-600 uppercase italic">
                          {trackingResult.orderNumber.startsWith('P') ? 'Vista al Sol (Principal)' : trackingResult.orderNumber.startsWith('C') ? 'Centro San Felix' : 'Por definir'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase italic">Fecha de Entrega Estimada</span>
                        <span className="text-[10px] font-bold text-[#000814]">{trackingResult.deliveryDate}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FORMULARIO INICIAL */}
      {showOrderForm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#000814]/80 backdrop-blur-md" onClick={() => setShowOrderForm(false)} />
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 relative z-10 shadow-2xl border-4 border-slate-50">
            <button 
              onClick={() => setShowOrderForm(false)}
              className="absolute top-8 right-8 text-slate-300 hover:text-rose-600 transition-colors"
            >
              <Plus className="rotate-45" size={24} />
            </button>
            
            <div className="space-y-8">
              <div className="space-y-2">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                  <Zap size={24} />
                </div>
                <h3 className="text-3xl font-black uppercase italic tracking-tighter text-[#000814]">Iniciar Solicitud</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completa tus datos para procesar tu pedido</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase italic ml-1">Nombre Completo</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-rose-500 transition-all"
                      placeholder="Ej: Juan Pérez"
                      value={customerForm.name}
                      onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase italic ml-1">Teléfono</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-rose-500 transition-all"
                      placeholder="Ej: 04241234567"
                      value={customerForm.phone}
                      onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase italic ml-1">C.I. / RIF</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-rose-500 transition-all"
                      placeholder="Ej: V-12345678"
                      value={customerForm.ci}
                      onChange={(e) => setCustomerForm({...customerForm, ci: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase italic ml-1">Tipo de Solicitud</label>
                    <select 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-rose-500 transition-all"
                      value={customerForm.type}
                      onChange={(e) => setCustomerForm({...customerForm, type: e.target.value as any})}
                    >
                      <option value="presupuesto">SOLICITUD DE PRESUPUESTO</option>
                      <option value="estatus">ESTATUS DE PEDIDO</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase italic ml-1">Detalles de la Solicitud</label>
                  <textarea 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-rose-500 transition-all min-h-[100px]"
                    placeholder="Describe lo que necesitas..."
                    value={customerForm.details}
                    onChange={(e) => setCustomerForm({...customerForm, details: e.target.value})}
                  />
                </div>

                <button 
                  onClick={handleCustomerFormSubmit}
                  className="w-full bg-[#000814] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-rose-600 transition-all flex items-center justify-center gap-3"
                >
                  Procesar Solicitud <Zap size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NAVIGATION */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-[100] border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} className="w-10 h-10 object-contain" alt="Logo" />
            ) : (
              <div className="w-10 h-10 bg-[#000814] rounded-xl flex items-center justify-center shadow-lg">
                <Zap size={24} className="text-white" />
              </div>
            )}
            <span className="font-black italic tracking-tighter text-2xl text-[#000814]">{settings.businessName || 'ROXTOR'}</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#nosotros" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#000814] transition-all">Nosotros</a>
            <a href="#colecciones" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#000814] transition-all">Colecciones</a>
            <a href="#b2b" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#000814] transition-all">Empresas & Clubes</a>
            <button 
              onClick={() => setShowTrackingModal(true)}
              className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-all flex items-center gap-2"
            >
              <Search size={14} /> Rastrear
            </button>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-[#000814] transition-all"
            >
              <CreditCard size={20} />
              {cart.length > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                  {cart.reduce((acc, item) => acc + item.quantity, 0)}
                </div>
              )}
            </button>
            <button 
              onClick={() => setShowOrderForm(true)}
              className="bg-[#000814] text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-rose-600 transition-all"
            >
              Iniciar Pedido AI
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-50 -z-10 skew-x-12 translate-x-32" />
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-600 px-4 py-2 rounded-full">
              <ShieldCheck size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Orden • Control • Cumplimiento</span>
            </div>
            <h1 className="text-7xl md:text-8xl font-black text-[#000814] uppercase tracking-tighter leading-[0.85] italic">
              {settings.landingConfig?.heroTitle || 'Soluciones'} <br />
              <span className="text-rose-600">{settings.landingConfig?.heroSubtitle || 'Creativas'}</span> <br />
              {settings.landingConfig?.heroTitle ? '' : 'Inteligentes.'}
            </h1>
            <p className="text-lg text-slate-500 max-w-md font-medium leading-relaxed">
              {settings.landingConfig?.heroDescription || 'No solo fabricamos uniformes. Creamos la identidad visual que impulsa a tu equipo, colegio o empresa con trazabilidad total.'}
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => setShowOrderForm(true)}
                className="bg-[#000814] text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-rose-600 transition-all flex items-center gap-3 group"
              >
                Iniciar Pedido AI <Zap size={18} className="group-hover:animate-pulse transition-transform" />
              </button>
              <button 
                onClick={() => setShowTrackingModal(true)}
                className="bg-white border-4 border-slate-50 text-[#000814] px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-blue-100 transition-all flex items-center gap-3 group"
              >
                Rastrear Pedido <Search size={18} className="text-blue-600 group-hover:scale-110 transition-transform" />
              </button>
              <button 
                onClick={() => setShowOrderForm(true)}
                className="bg-slate-50 text-slate-400 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:text-[#000814] hover:bg-slate-100 transition-all"
              >
                Cotizar Pedido
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square bg-[#000814] rounded-[4rem] overflow-hidden shadow-2xl rotate-3 relative group">
               <img 
                 src={settings.landingConfig?.heroImageUrl || "https://picsum.photos/seed/roxtor-hero/1000/1000"} 
                 alt="Roxtor Uniforms" 
                 className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-1000"
                 referrerPolicy="no-referrer"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-[#000814] to-transparent opacity-60" />
               <div className="absolute bottom-10 left-10 text-white">
                 <p className="text-4xl font-black italic tracking-tighter uppercase">Calidad <br /> Institucional</p>
                 <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400 mt-2">Hecho en Ciudad Guayana</p>
               </div>
            </div>
            <div className="absolute -bottom-10 -left-10 bg-white p-8 rounded-[2.5rem] shadow-2xl border-4 border-slate-50 animate-bounce duration-[3000ms]">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                   <Users size={24} />
                 </div>
                 <div>
                   <p className="text-2xl font-black italic text-[#000814] leading-none">+500</p>
                   <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Clientes B2B</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* COLLECTIONS GRID */}
      <section id="colecciones" className="py-32 bg-slate-50 px-6">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-5xl font-black text-[#000814] uppercase tracking-tighter italic">Nuestras Colecciones</h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Especialización por Sector</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {collections.map((col) => (
              <div 
                key={col.id} 
                className="bg-white rounded-[3rem] p-8 shadow-sm hover:shadow-2xl transition-all duration-500 group border-4 border-transparent hover:border-rose-100 flex flex-col h-full"
              >
                <div className="mb-8 p-4 bg-slate-50 rounded-2xl w-fit group-hover:bg-[#000814] group-hover:text-white transition-all duration-500">
                  {col.icon}
                </div>
                <div className="space-y-2 mb-6">
                  <h3 className="text-2xl font-black text-[#000814] uppercase tracking-tighter italic leading-none">{col.title}</h3>
                  <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">{col.subtitle}</p>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed mb-8 flex-grow">
                  {col.description}
                </p>
                <div className="space-y-3 mb-8">
                  {col.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase italic">
                      <CheckCircle2 size={12} className="text-emerald-500" />
                      {feat}
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => {
                    setInitialRadarMessage(`🤖 Hola, me interesa la ${col.title}. ¿Podrías darme más información sobre los modelos disponibles?`);
                    setActiveView('radar');
                  }}
                  className="w-full py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest group-hover:bg-[#000814] group-hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  Ver Modelos <ChevronRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PORTFOLIO SECTION */}
      <section className="py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8">
            <div className="space-y-4">
              <h2 className="text-5xl font-black text-[#000814] uppercase tracking-tighter italic leading-none">Diseños <br /> <span className="text-rose-600">Extraordinarios</span></h2>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Nuestros Proyectos Recientes</p>
            </div>
            <button 
              onClick={() => setActiveView('radar')}
              className="text-[10px] font-black uppercase tracking-widest text-[#000814] border-b-2 border-rose-500 pb-1"
            >
              Solicitar Diseño Personalizado
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(settings.landingConfig?.portfolio || portfolio).map((item: any, i: number) => (
              <div key={`collection-${i}`} className="group relative aspect-[3/4] rounded-[2.5rem] overflow-hidden shadow-xl">
                <img 
                  src={item.imageUrl || item.img} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#000814] via-transparent to-transparent opacity-0 group-hover:opacity-90 transition-opacity duration-500 flex flex-col justify-end p-8">
                  <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-2">{item.category}</p>
                  <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">{item.title}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT US / IDENTITY */}
      <section id="nosotros" className="py-32 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-12">
              <div className="space-y-4">
                <h2 className="text-5xl font-black text-[#000814] uppercase tracking-tighter italic leading-none">Quiénes <br /> <span className="text-rose-600">Somos</span></h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Identidad & Propósito</p>
              </div>
              
              <div className="space-y-8">
                <div className="bg-slate-50 p-8 rounded-[3rem] border-2 border-slate-100 relative group hover:border-rose-200 transition-all">
                  <div className="absolute -top-6 -left-6 w-12 h-12 bg-[#000814] text-white rounded-2xl flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform">
                    <Building2 size={24} />
                  </div>
                  <p className="text-lg text-slate-700 font-bold italic leading-relaxed">
                    ROXTOR es una empresa especializada en diseño y producción de uniformes institucionales personalizados. Trabajamos con organizaciones educativas, deportivas, médicas y empresariales que buscan uniformes duraderos, con identidad y gestionados bajo un sistema profesional de pedidos.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4 p-6 bg-rose-50/50 rounded-3xl border border-rose-100">
                    <div className="flex items-center gap-3 text-rose-600">
                      <Target size={20} />
                      <h4 className="font-black uppercase italic tracking-tighter">Misión</h4>
                    </div>
                    <p className="text-xs text-slate-600 font-bold italic leading-relaxed">
                      Diseñar y producir uniformes institucionales de alta calidad que fortalezcan la identidad de organizaciones educativas, deportivas, médicas y empresariales, apoyados en tecnología, procesos estructurados y atención profesional.
                    </p>
                  </div>
                  <div className="space-y-4 p-6 bg-blue-50/50 rounded-3xl border border-blue-100">
                    <div className="flex items-center gap-3 text-blue-600">
                      <Eye size={20} />
                      <h4 className="font-black uppercase italic tracking-tighter">Visión</h4>
                    </div>
                    <p className="text-xs text-slate-600 font-bold italic leading-relaxed">
                      Convertir a ROXTOR en el proveedor institucional líder de uniformes personalizados en la región, reconocido por su innovación, control de producción y soluciones integrales de imagen corporativa.
                    </p>
                  </div>
                </div>

                <div className="p-8 bg-[#000814] text-white rounded-[3rem] shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-10"><Heart size={120} /></div>
                  <div className="relative z-10 space-y-4">
                    <h4 className="text-xl font-black uppercase italic tracking-tighter text-rose-500">Propósito de Marca</h4>
                    <p className="text-lg font-bold italic leading-tight">
                      Construir identidad y profesionalismo a través de uniformes que representen a las instituciones con orgullo, calidad y organización.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="aspect-[4/5] bg-slate-100 rounded-[3rem] overflow-hidden">
                    {settings.landingConfig?.aboutUsImages?.[0]?.includes('video') || settings.landingConfig?.aboutUsImages?.[0]?.startsWith('data:video') ? (
                      <video 
                        src={settings.landingConfig.aboutUsImages[0]} 
                        className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" 
                        muted loop autoPlay playsInline
                      />
                    ) : (
                      <img 
                        src={settings.landingConfig?.aboutUsImages?.[0] || "https://picsum.photos/seed/roxtor-1/600/800"} 
                        className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" 
                        alt="Roxtor Team" 
                      />
                    )}
                  </div>
                  <div className="aspect-square bg-rose-600 rounded-[3rem] flex items-center justify-center p-8 text-white text-center">
                    <p className="text-2xl font-black uppercase italic tracking-tighter leading-none">Calidad <br /> Sin <br /> Excusas</p>
                  </div>
                </div>
                <div className="space-y-4 pt-12">
                  <div className="aspect-square bg-[#000814] rounded-[3rem] flex items-center justify-center p-8 text-white text-center">
                    <p className="text-2xl font-black uppercase italic tracking-tighter leading-none">Diseño <br /> Con <br /> Propósito</p>
                  </div>
                  <div className="aspect-[4/5] bg-slate-100 rounded-[3rem] overflow-hidden">
                    {settings.landingConfig?.aboutUsImages?.[1]?.includes('video') || settings.landingConfig?.aboutUsImages?.[1]?.startsWith('data:video') ? (
                      <video 
                        src={settings.landingConfig.aboutUsImages[1]} 
                        className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" 
                        muted loop autoPlay playsInline
                      />
                    ) : (
                      <img 
                        src={settings.landingConfig?.aboutUsImages?.[1] || "https://picsum.photos/seed/roxtor-2/600/800"} 
                        className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" 
                        alt="Roxtor Workshop" 
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VALUES SECTION */}
      <section className="py-32 bg-slate-50 px-6">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-5xl font-black text-[#000814] uppercase tracking-tighter italic">Nuestros Valores</h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">El ADN de ROXTOR</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { title: 'Compromiso', desc: 'Cumplimos lo que prometemos.', icon: <Handshake size={32} /> },
              { title: 'Calidad', desc: 'Cada prenda representa nuestra marca.', icon: <Star size={32} /> },
              { title: 'Innovación', desc: 'Integramos diseño, tecnología y producción.', icon: <Lightbulb size={32} /> },
              { title: 'Organización', desc: 'Trabajamos con procesos claros y trazabilidad.', icon: <Layers size={32} /> },
              { title: 'Confianza', desc: 'Las instituciones saben que pueden contar con ROXTOR.', icon: <ShieldCheck size={32} /> },
              { title: 'Excelencia', desc: 'Excelencia en cada trabajo.', icon: <Trophy size={32} /> },
              { title: 'Disciplina', desc: 'Disciplina en cada proceso.', icon: <CheckCircle2 size={32} /> },
              { title: 'Perseverancia', desc: 'Perseverancia en cada meta.', icon: <Target size={32} /> }
            ].map((val, i) => (
              <div key={`product-${i}`} className="bg-white p-8 rounded-[2.5rem] border-4 border-transparent hover:border-rose-100 transition-all group text-center space-y-6 shadow-sm hover:shadow-xl">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-400 group-hover:bg-[#000814] group-hover:text-white transition-all duration-500">
                  {val.icon}
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-black uppercase italic tracking-tighter text-[#000814]">{val.title}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase leading-tight">{val.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* METHODOLOGY SECTION */}
      <section className="py-32 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="relative">
               <div className="absolute -top-20 -left-20 w-64 h-64 bg-rose-100 rounded-full blur-3xl opacity-50" />
               <div className="space-y-6 relative z-10">
                 {[
                   { step: '01', title: 'Diseño Personalizado', desc: 'Conceptualizamos tu identidad visual.' },
                   { step: '02', title: 'Confirmación del Pedido', desc: 'Validación técnica y administrativa.' },
                   { step: '03', title: 'Producción Controlada', desc: 'Trazabilidad total en cada etapa.' },
                   { step: '04', title: 'Entrega Organizada', desc: 'Logística eficiente y puntual.' }
                 ].map((m, i) => (
                   <div key={i} className="flex items-center gap-8 group">
                     <span className="text-6xl font-black italic text-slate-100 group-hover:text-rose-600 transition-colors duration-500">{m.step}</span>
                     <div className="space-y-1">
                       <h4 className="text-xl font-black uppercase italic tracking-tighter text-[#000814]">{m.title}</h4>
                       <p className="text-xs font-bold text-slate-400 uppercase italic">{m.desc}</p>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
            <div className="space-y-12">
              <div className="space-y-4">
                <h2 className="text-5xl font-black text-[#000814] uppercase tracking-tighter italic leading-none">Nuestra <br /> <span className="text-rose-600">Metodología</span></h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Sistema Estructurado de Producción</p>
              </div>
              <p className="text-lg text-slate-500 font-medium leading-relaxed italic">
                ROXTOR trabaja bajo un sistema estructurado que permite evitar retrasos y errores, garantizando que cada institución reciba exactamente lo que proyectó.
              </p>
              <div className="p-8 bg-slate-50 rounded-[3rem] border-2 border-slate-100 flex items-center gap-6">
                <div className="w-16 h-16 bg-[#000814] text-white rounded-2xl flex items-center justify-center shadow-xl">
                  <Zap size={32} />
                </div>
                <div>
                  <p className="text-sm font-black uppercase italic text-[#000814]">Eficiencia Garantizada</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tecnología + Procesos Claros</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMMERCIAL CONDITIONS */}
      <section className="py-32 bg-[#000814] px-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute top-10 left-10 rotate-12"><CreditCard size={200} /></div>
          <div className="absolute bottom-10 right-10 -rotate-12"><Truck size={200} /></div>
        </div>
        
        <div className="max-w-7xl mx-auto space-y-20 relative z-10">
          <div className="text-center space-y-4">
            <h2 className="text-5xl font-black text-white uppercase tracking-tighter italic">Condiciones Comerciales</h2>
            <p className="text-rose-500 text-[10px] font-black uppercase tracking-[0.3em]">Organización & Cumplimiento</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'Abono Mínimo 50%', desc: 'Para iniciar el proceso de diseño y producción.', icon: <CreditCard size={24} /> },
              { title: 'Producción Programada', desc: 'Entramos a taller según cronograma oficial.', icon: <Clock size={24} /> },
              { title: 'Entrega Contra Saldo', desc: 'Despacho inmediato al completar el pago.', icon: <Truck size={24} /> },
              { title: 'Mayoristas +12', desc: 'Precios especiales a partir de 12 piezas.', icon: <Users size={24} /> }
            ].map((cond, i) => (
              <div key={`feature-${i}`} className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] space-y-6 hover:bg-white/10 transition-all">
                <div className="w-12 h-12 bg-rose-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                  {cond.icon}
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-black uppercase italic tracking-tighter text-white">{cond.title}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase leading-tight">{cond.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCT CATALOG */}
      <section id="catalogo" className="py-32 bg-slate-50 px-6 overflow-hidden italic">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-6">
            <h2 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter text-[#000814] leading-none">Catálogo Maestro</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.5em] italic">Calidad Premium • Trazabilidad Total</p>
            
            <div className="max-w-2xl mx-auto relative mt-10">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              <input 
                type="text" 
                placeholder="BUSCAR EN EL CATÁLOGO (Ej: Franela, Chemise...)"
                className="w-full bg-white border-4 border-white shadow-xl rounded-[2rem] pl-16 pr-8 py-6 text-[#000814] font-black uppercase italic outline-none focus:border-rose-500/20 transition-all"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredLandingProducts.slice(0, 8).map((product) => (
              <div key={product.id} className="group bg-white rounded-[3rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all border-4 border-transparent hover:border-rose-500/10">
                <div className="aspect-square overflow-hidden relative">
                  <img 
                    src={product.imageUrl || `https://picsum.photos/seed/${product.name}/800/800`} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" 
                    alt={product.name}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-6 right-6 flex flex-col gap-2">
                    <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase italic leading-none mb-1">Detal</p>
                      <span className="text-sm font-black italic text-[#000814]">${product.priceRetail.toFixed(2)}</span>
                    </div>
                    <div className="bg-rose-500/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-rose-400/20">
                      <p className="text-[8px] font-black text-white/70 uppercase italic leading-none mb-1">Mayor (+12)</p>
                      <span className="text-sm font-black italic text-white">${product.priceWholesale.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="p-8 space-y-4">
                  <div>
                    <h4 className="font-black uppercase italic text-slate-800 tracking-tighter">{product.name}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">{product.category}</p>
                    
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Zap size={10} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-700 uppercase italic leading-none">Servicio Express</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase italic mt-1">Recargo desde +$1</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => addToCart(product)}
                      className="bg-rose-600 text-white py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-rose-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={12} /> Carrito
                    </button>
                    <button 
                      onClick={() => {
                        setInitialRadarMessage(`Hola, me interesa el producto: ${product.name}. ¿Podrían darme más información sobre disponibilidad y tiempos de entrega?`);
                        setActiveView('radar');
                      }}
                      className="bg-[#000814] text-white py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                    >
                      <Zap size={12} /> Radar AI
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button 
              onClick={() => setIsCatalogOpen(true)}
              className="inline-flex items-center gap-4 px-12 py-6 bg-white border-4 border-slate-100 rounded-[2rem] font-black uppercase italic text-xs tracking-widest hover:border-rose-500/20 hover:shadow-xl transition-all"
            >
              Ver Catálogo Completo <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* B2B / CONTACT FORM */}
      <section id="b2b" className="py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto bg-[#000814] rounded-[5rem] p-12 md:p-24 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-20 opacity-5 rotate-12"><Building2 size={300} /></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
            <div className="space-y-8">
              <h2 className="text-6xl font-black italic tracking-tighter uppercase leading-none">
                Atención <br />
                <span className="text-rose-500">Institucional</span> <br />
                Especializada.
              </h2>
              <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-md">
                Gestionamos dotaciones masivas para empresas, uniformes escolares para instituciones y equipaciones completas para clubes deportivos con estándares de alta calidad, control operativo y trazabilidad total.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-3xl font-black italic text-white">50%</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Abono Inicial</p>
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-black italic text-white uppercase">Récord</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Tiempo de Entrega</p>
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-black italic text-white uppercase">Garantizada</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Trazabilidad Total</p>
                </div>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3.5rem] p-10 space-y-8">
              <div className="space-y-2">
                <h4 className="text-xl font-black uppercase italic tracking-tighter">Solicitud B2B Express</h4>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nuestro Radar AI procesará tu requerimiento</p>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase italic ml-1">Nombre de la Empresa / Club</label>
                  <input 
                    type="text" 
                    className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-rose-500 transition-all" 
                    placeholder="Ej: Fútbol Club Guayana" 
                    value={b2bForm.company}
                    onChange={(e) => setB2bForm({...b2bForm, company: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase italic ml-1">¿Qué necesitas cotizar?</label>
                  <textarea 
                    className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-rose-500 transition-all min-h-[100px]" 
                    placeholder="Ej: 50 Uniformes de fútbol para niños, tallas 6 a 14..." 
                    value={b2bForm.request}
                    onChange={(e) => setB2bForm({...b2bForm, request: e.target.value})}
                  />
                </div>
                <button 
                  onClick={handleB2BSubmit}
                  className="w-full bg-rose-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-rose-500 transition-all flex items-center justify-center gap-3"
                >
                  Enviar a Radar AI <Zap size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS / TRUST */}
      <section className="py-32 bg-white px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="flex gap-1 text-amber-500"><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/></div>
            <p className="text-sm font-black italic text-[#000814] leading-relaxed">"La trazabilidad que ofrece Roxtor es única. Pudimos ver el avance de nuestros uniformes escolares en tiempo real."</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">— Colegio Los Próceres</p>
          </div>
          <div className="space-y-4">
            <div className="flex gap-1 text-amber-500"><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/></div>
            <p className="text-sm font-black italic text-[#000814] leading-relaxed">"Diseños de fútbol que no tienen nada que envidiar a marcas internacionales. El equipo quedó impactado."</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">— Academia de Fútbol Bolívar</p>
          </div>
          <div className="space-y-4">
            <div className="flex gap-1 text-amber-500"><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/></div>
            <p className="text-sm font-black italic text-[#000814] leading-relaxed">"Nuestros uniformes quirúrgicos son cómodos y profesionales. Roxtor entendió perfectamente nuestras necesidades."</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">— Clínica San Rafael</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-50 py-20 px-6 border-t border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} className="w-8 h-8 object-contain" alt="Logo" />
              ) : (
                <div className="w-8 h-8 bg-[#000814] rounded-lg flex items-center justify-center shadow-lg">
                  <Zap size={18} className="text-white" />
                </div>
              )}
              <span className="font-black italic tracking-tighter text-xl text-[#000814]">{settings.businessName || 'ROXTOR'}</span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed">
              {settings.slogan || 'Soluciones Creativas Inteligentes.'} <br />
              Ciudad Guayana, Venezuela.
            </p>
          </div>
          <div className="space-y-6">
            <h5 className="text-[10px] font-black uppercase tracking-widest text-[#000814]">Contacto</h5>
            <div className="space-y-4">
              <a href="tel:+584249635252" className="flex items-center gap-3 text-xs font-bold text-slate-500 hover:text-rose-600 transition-all"><Phone size={14}/> +58 424 9635252</a>
              <a href="mailto:ventas@roxtorca.com.ve" className="flex items-center gap-3 text-xs font-bold text-slate-500 hover:text-rose-600 transition-all"><Mail size={14}/> ventas@roxtorca.com.ve</a>
            </div>
          </div>
          <div className="space-y-6">
            <h5 className="text-[10px] font-black uppercase tracking-widest text-[#000814]">Redes Sociales</h5>
            <div className="flex gap-4">
              <a href="https://instagram.com/roxtor.pzo" target="_blank" rel="noreferrer" className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:shadow-lg transition-all border border-slate-100"><Instagram size={20}/></a>
              <a href="#" className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:shadow-lg transition-all border border-slate-100"><MessageCircle size={20}/></a>
            </div>
          </div>
          <div className="space-y-6">
            <h5 className="text-[10px] font-black uppercase tracking-widest text-[#000814]">Legal</h5>
            <div className="space-y-2">
              <p className="text-[9px] font-bold text-slate-400 uppercase italic">Términos y Condiciones</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase italic">Políticas de Privacidad</p>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-slate-200 text-center space-y-4">
          <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.5em]">© 2026 ROXTOR ERP • TRAZABILIDAD TOTAL</p>
          <p className="text-xs font-bold text-slate-400 italic">
            📖 “A su tiempo segaremos, si no desmayamos.” — Gálatas 6:9
          </p>
          <p className="text-xs font-bold text-slate-400 italic">
            📖 “Y todo lo que hagáis, hacedlo de corazón, como para el Señor y no para los hombres.” - Colosenses 3:23
          </p>
        </div>
      </footer>

      {isCatalogOpen && (
        <CatalogExplorer 
          products={products} 
          onClose={() => setIsCatalogOpen(false)}
          onAddToCart={addToCart}
          onConsult={(product) => {
            setInitialRadarMessage(`Hola, me interesa el producto: ${product.name}. ¿Podrían darme más información sobre disponibilidad y tiempos de entrega?`);
            setActiveView('radar');
            setIsCatalogOpen(false);
          }}
        />
      )}

      {isCartOpen && (
        <ShoppingCart 
          products={products} 
          initialCart={cart}
          onUpdateCart={setCart}
          onClose={() => setIsCartOpen(false)} 
          onCheckout={(orderData) => {
            console.log('Checkout:', orderData);
            // Aquí se podría enviar a la base de datos o a Radar
            const message = `🛒 ¡NUEVO PEDIDO WEB! 
            Cliente: ${orderData.customerName} (${orderData.customerId})
            Teléfono: ${orderData.customerPhone}
            Dirección: ${orderData.address}
            Envío: ${orderData.shippingType} ${orderData.shippingCarrier || ''}
            Productos: ${orderData.items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')}
            Total: $${orderData.total.toFixed(2)}
            Diseño: ${orderData.customDesign || 'Estándar'}`;
            
            setInitialRadarMessage(message);
            setActiveView('radar');
            setIsCartOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default PublicLanding;
