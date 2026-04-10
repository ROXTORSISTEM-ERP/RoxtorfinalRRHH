
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Product, Order, AppSettings, Agent, Workshop, Expense, Debt, PayrollPayment, StaffEvaluation, Lead, RadarAlert, Message, FiscalInvoice } from './types';
import Radar from './components/Radar';
import Inventory from './components/Inventory';
import Gestion from './components/Gestion';
import Operaciones from './components/Operaciones';
import WhatsAppInbox from './components/WhatsAppInbox';
import LandingPage from './components/LandingPage';
import StaffPerformance from './components/StaffPerformance';
import TrainingAcademy from './components/TrainingAcademy';
import Checklists from './components/Checklists';
import Manuals from './components/Manuals';
import FiscalBilling from './components/FiscalBilling';
import Profile from './components/Profile';
import RRHH from './components/RRHH';
import PublicLanding from './components/PublicLanding';
import LandingSettings from './components/LandingSettings';
import CoreERPView from './components/CoreERP/CoreERPView';
import { ROXTOR_SYSTEM_INSTRUCTIONS } from './constants/systemInstructions';
import { callAI } from './utils/ai';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import WorkshopQueue from './components/WorkshopQueue';
import { 
  Radar as RadarIcon, 
  Package, 
  Lock,
  ShieldCheck,
  Cloud,
  CloudOff,
  Power,
  Zap,
  ChevronRight,
  Key,
  RefreshCw,
  Edit2,
  Save,
  Loader2,
  X,
  Database,
  Wifi,
  AlertTriangle,
  RefreshCcw,
  LifeBuoy,
  DownloadCloud,
  Users,
  User,
  BookOpen,
  MessageSquare,
  FileText,
  Briefcase,
  LayoutDashboard
} from 'lucide-react';

const SidebarIconItem = ({ active, onClick, icon, tooltip }: any) => (
  <div className="relative group">
    <button 
      onClick={onClick} 
      className={`p-4 rounded-2xl transition-all duration-300 flex items-center justify-center ${
        active 
        ? 'bg-blue-600 text-white shadow-[0_10px_30px_rgba(37,99,235,0.5)] scale-110' 
        : 'text-slate-500 hover:bg-white/10 hover:text-white'
      }`}
    >
      {icon}
    </button>
    
    {/* Tooltip Flotante */}
    <div className="absolute left-20 top-1/2 -translate-y-1/2 bg-[#000814] text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all border border-white/10 shadow-2xl z-50 whitespace-nowrap translate-x-2 group-hover:translate-x-0">
      {tooltip}
    </div>
  </div>
);

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<'public' | 'staff'>('public');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isPublicView, setIsPublicView] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [activeTab, setActiveTab] = useState<'radar' | 'operaciones' | 'stock' | 'gestion' | 'equipo' | 'inbox' | 'facturacion' | 'perfil' | 'rrhh' | 'erp'>('radar');
  const [equipoSubTab, setEquipoSubTab] = useState<'desempeño' | 'academia' | 'checklists' | 'manuales'>('academia');
  const [currentStoreId, setCurrentStoreId] = useState<string>('store_1');
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('synced');
  
  const [isSyncingBcv, setIsSyncingBcv] = useState(false);
  const [isEditingBcv, setIsEditingBcv] = useState(false);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [payroll, setPayroll] = useState<PayrollPayment[]>([]);
  const [evaluations, setEvaluations] = useState<StaffEvaluation[]>([]);
  const [radarAlerts, setRadarAlerts] = useState<RadarAlert[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [fiscalInvoices, setFiscalInvoices] = useState<FiscalInvoice[]>([]);
  const [agents, setAgents] = useState<Agent[]>([
    { 
      id: 'agent_ale', 
      name: 'ALEJANDRO', 
      fullName: 'ALEJANDRO RODRIGUEZ',
      idNumber: 'V-20.123.456',
      role: 'OPERACIONES', 
      storeId: 'store_1', 
      pin: '102030',
      entryDate: '2023-01-15',
      baseSalaryBs: 130,
      complementaryBonusUsd: 200,
      hourlyRateUsd: 2.5,
      attendance: [
        { id: '1', date: '2026-04-01', checkIn: Date.now(), status: 'presente', locationVerified: true, storeId: 'store_1' },
        { id: '2', date: '2026-04-02', checkIn: Date.now(), status: 'presente', locationVerified: true, storeId: 'store_1' },
        { id: '3', date: '2026-04-03', checkIn: Date.now(), status: 'tarde', locationVerified: true, storeId: 'store_1' },
        { id: '4', date: '2026-04-04', checkIn: Date.now(), status: 'ausente', locationVerified: false, storeId: 'store_1' },
      ]
    },
    { 
      id: 'agent_emi', 
      name: 'EMIRIUSKA', 
      fullName: 'EMIRIUSKA GONZALEZ',
      idNumber: 'V-22.987.654',
      role: 'VENTAS', 
      storeId: 'store_1', 
      pin: '102030',
      entryDate: '2023-06-20',
      baseSalaryBs: 130,
      complementaryBonusUsd: 180,
      hourlyRateUsd: 2.0,
      attendance: [
        { id: '1', date: '2026-04-01', checkIn: Date.now(), status: 'presente', locationVerified: true, storeId: 'store_1' },
        { id: '2', date: '2026-04-02', checkIn: Date.now(), status: 'presente', locationVerified: true, storeId: 'store_1' },
      ]
    },
    { id: 'agent_web', name: 'SISTEMA WEB', role: 'VENTAS', storeId: 'store_1', pin: '999999' }
  ]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  
  const [settings, setSettings] = useState<AppSettings>({
    masterPin: 'Roxtor*2026#',
    loginPin: '102030',
    businessName: 'ROXTOR',
    slogan: 'PERSONALIZACIÓN PROFESIONAL',
    instagram: 'ROXTOR.PZO',
    companyPhone: '+584249635252',
    preferredTone: 'cercano',
    bcvRate: 0,
    logoUrl: '',
    encryptionKey: 'roxtor_secure_key',
    pagoMovil: { bank: 'BANCAMIGA (0172)', idNumber: '18806871', phone: '04249635252' },
    whatsappConfig: {
      enabled: false,
      accessToken: '',
      phoneNumberId: '',
      businessAccountId: '',
      verifyToken: 'roxtor_verify_token'
    },
    stores: [
      { id: 'store_1', name: 'ROXTOR PRINCIPAL', location: 'Puerto Ordaz', lat: 8.297, lng: -62.711, phone: '+584249635252', prefix: 'P', nextOrderNumber: 1, nextDirectSaleNumber: 1 },
      { id: 'store_2', name: 'ROXTOR CENTRO', location: 'Centro PZO', lat: 8.305, lng: -62.705, phone: '', prefix: 'C', nextOrderNumber: 1, nextDirectSaleNumber: 1 }
    ],
    cloudSync: { enabled: true, provider: 'supabase', apiUrl: '', apiKey: '' }
  });

  const [cloudConfig, setCloudConfig] = useState<{ url: string; key: string } | null>(null);
  const [showSyncDiagnostic, setShowSyncDiagnostic] = useState(false);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<boolean>(false);

  useEffect(() => {
    const handleChangeTab = (e: any) => {
      if (e.detail) setActiveTab(e.detail);
    };
    window.addEventListener('changeTab', handleChangeTab);
    return () => window.removeEventListener('changeTab', handleChangeTab);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'public') {
      setIsPublicView(true);
      setIsSessionActive(true);
      setActiveTab('radar');
    }

    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config');
        if (response.ok) {
          const data = await response.json();
          if (data.supabaseUrl && data.supabaseKey) {
            const newCloudConfig = { url: data.supabaseUrl, key: data.supabaseKey };
            setCloudConfig(newCloudConfig);
            
            setSettings(prev => ({
              ...prev,
              cloudSync: { 
                enabled: true, 
                provider: 'supabase',
                apiUrl: data.supabaseUrl, 
                apiKey: data.supabaseKey 
              }
            }));
            
            setTimeout(() => syncWithCloud('pull', { 
              apiUrl: data.supabaseUrl, 
              apiKey: data.supabaseKey,
              enabled: true,
              provider: 'supabase'
            }), 1500);
            return;
          }
        }
      } catch (e) {
        console.warn("API Config fetch failed, falling back to env variables");
      }

      // Fallback a variables de entorno de Vite (para Netlify/Vercel estático)
      const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
      const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

      if (envUrl && envKey) {
        const newCloudConfig = { url: envUrl, key: envKey };
        setCloudConfig(newCloudConfig);
        setSettings(prev => ({
          ...prev,
          cloudSync: { 
            enabled: true, 
            provider: 'supabase',
            apiUrl: envUrl, 
            apiKey: envKey 
          }
        }));
        
        setTimeout(() => syncWithCloud('pull', { 
          apiUrl: envUrl, 
          apiKey: envKey,
          enabled: true,
          provider: 'supabase'
        }), 1500);
      }
    };
    fetchConfig();
  }, []);

  const [tempBcv, setTempBcv] = useState(settings?.bcvRate?.toString() || "0");
  const isSyncingRef = useRef(false);
  const syncTimeoutRef = useRef<any>(null);
  
   // Función Maestra de Sincronización (Pull & Push)
  useEffect(() => {
    // Migración de seguridad: Si el PIN es el viejo default, lo subimos al nuevo estándar
    if (settings.loginPin === '0000') {
      setSettings(prev => ({ ...prev, loginPin: '102030' }));
    }
    if (settings.masterPin === '1234') {
      setSettings(prev => ({ ...prev, masterPin: 'Roxtor*2026#' }));
    }
    // Migración de agentes
    if (agents.some(a => a.pin === '0000')) {
      setAgents(prev => prev.map(a => a.pin === '0000' ? { ...a, pin: '102030' } : a));
    }
  }, [settings.loginPin, settings.masterPin, agents]);

  useEffect(() => {
    const currentAgent = agents.find(a => a.id === currentAgentId);
    const isManager = !isLocked || currentAgent?.role === 'GERENCIA';
    if (equipoSubTab === 'desempeño' && !isManager) {
      setEquipoSubTab('academia');
    }
  }, [currentAgentId, isLocked, equipoSubTab, agents]);

  const syncWithCloud = useCallback(async (mode: 'push' | 'pull' = 'push', overrideSyncConfig?: any) => {
    const config = overrideSyncConfig || settings.cloudSync;
    const apiUrl = config?.apiUrl || cloudConfig?.url;
    const apiKey = config?.apiKey || cloudConfig?.key;

    if (!apiUrl || !apiKey) return;
    if (isSyncingRef.current && mode === 'push') return; 
    
    isSyncingRef.current = true;
    setSyncStatus('syncing');
    
    let baseUrl = apiUrl.trim().replace(/\/$/, '');
    if (!baseUrl.startsWith('http')) {
      baseUrl = `https://${baseUrl}`;
    }
    
    if (!baseUrl.includes('.supabase.co') && !baseUrl.includes('localhost')) {
      console.warn("ROXTOR: URL de Supabase parece inválida:", baseUrl);
      setSyncStatus('error');
      setLastSyncError("URL de Supabase inválida. Debe ser https://xxx.supabase.co");
      return false;
    }
    const url = `${baseUrl}/rest/v1/roxtor_sync?store_id=eq.global_master`;
    
    const performFetch = async (fetchUrl: string, options: any) => {
      try {
        const response = await fetch(fetchUrl, options);
        // Algunos navegadores retornan status 0 en errores de red/CORS sin lanzar excepción
        if (response.status === 0) throw new Error("Failed to fetch");
        return response;
      } catch (e: any) {
        const isNetworkError = 
          e.message?.includes("Failed to fetch") || 
          e.message?.includes("network error") ||
          e.message?.includes("Load failed") ||
          e.name === "TypeError" ||
          e.name === "NetworkError";

        if (isNetworkError) {
          console.log("ROXTOR: Direct fetch failed, trying proxy...", fetchUrl);
          try {
            const proxyResponse = await fetch('/api/sync-proxy', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                method: options.method || 'GET',
                url: fetchUrl,
                headers: options.headers,
                body: options.body ? JSON.parse(options.body) : undefined
              })
            });
            return proxyResponse;
          } catch (proxyError: any) {
            console.error("ROXTOR: Proxy fetch also failed:", proxyError);
            throw new Error(`Error de conexión (Directo y Proxy fallaron): ${proxyError.message}`);
          }
        }
        throw e;
      }
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      if (mode === 'pull') {
        const response = await performFetch(url, {
          headers: { 
            'apikey': apiKey, 
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json'
          },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errText = await response.text();
          setLastSyncError(`Error del Servidor (${response.status}): ${errText}`);
          throw new Error(`Pull failed: ${response.status}`);
        }
        
        const data = await response.json();
        if (data && data[0] && data[0].payload) {
          const cloud = data[0].payload;
          // Actualizamos estados locales
          if (cloud.products) setProducts(cloud.products);
          if (cloud.orders) setOrders(cloud.orders);
          if (cloud.leads) setLeads(cloud.leads);
          if (cloud.expenses) setExpenses(cloud.expenses);
          if (cloud.debts) setDebts(cloud.debts);
          if (cloud.payroll) setPayroll(cloud.payroll);
          if (cloud.evaluations) setEvaluations(cloud.evaluations);
          if (cloud.radarAlerts) setRadarAlerts(cloud.radarAlerts);
          if (cloud.messages) setMessages(cloud.messages);
          if (cloud.fiscalInvoices) setFiscalInvoices(cloud.fiscalInvoices);
          if (cloud.agents) {
            const hasWeb = cloud.agents.some((a: any) => a.id === 'agent_web');
            if (!hasWeb) {
              setAgents([...cloud.agents, { id: 'agent_web', name: 'SISTEMA WEB', role: 'VENTAS', storeId: 'store_1', pin: '9999' }]);
            } else {
              setAgents(cloud.agents);
            }
          }
          if (cloud.workshops) setWorkshops(cloud.workshops);
          if (cloud.settings) setSettings(prev => ({ ...prev, ...cloud.settings, cloudSync: prev.cloudSync }));
          console.log("ROXTOR: Datos sincronizados desde la nube.");
          setLastSyncError(null);
        } else {
          console.log("ROXTOR: No se encontraron datos en la nube para esta sede.");
        }
      } else {
        // Push Mode
        const payload = {
          products, orders, leads, expenses, debts, payroll, agents, workshops, evaluations, radarAlerts, messages, fiscalInvoices,
          settings: { ...settings, cloudSync: undefined }, 
          lastUpdate: Date.now()
        };

        const response = await performFetch(`${baseUrl}/rest/v1/roxtor_sync`, {
          method: 'POST',
          headers: { 
            'apikey': apiKey, 
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({
            store_id: 'global_master',
            payload: payload,
            last_sync: new Date().toISOString()
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
           const errData = await response.json().catch(() => ({ message: response.statusText }));
           if (response.status === 404 || errData.message?.includes("not found")) {
              setLastSyncError("Error 404: Tabla 'roxtor_sync' no existe en Supabase. Ejecuta el SQL.");
           } else {
              setLastSyncError(`Error al Guardar (${response.status}): ${errData.message || response.statusText}`);
           }
           throw new Error(`Push failed: ${response.status}`);
        }
        setLastSyncError(null);
      }
      setSyncStatus('synced');
      return true;
    } catch (error: any) {
      console.error("Sync Error Detail:", error);
      setSyncStatus('error');
      
      let errorMessage = error.message || "Error desconocido.";
      
      if (errorMessage.includes("Failed to fetch")) {
        errorMessage = "Error de Red Crítico: El navegador y el servidor no pudieron contactar a Supabase. Verifica que la URL sea correcta en Netlify.";
      } else if (error.name === 'AbortError') {
        errorMessage = "Tiempo Agotado (Timeout): Supabase tardó más de 15s en responder.";
      }
      
      setLastSyncError(errorMessage);
      return false;
    } finally {
      isSyncingRef.current = false;
    }
  }, [settings, products, orders, expenses, debts, payroll, agents, workshops, cloudConfig]);

  // Carga Inicial y Configuración
  useEffect(() => {
    const savedSettings = localStorage.getItem('erp_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        // Mezclamos con los valores por defecto para evitar crashes por campos faltantes
        setSettings(prev => ({
          ...prev,
          ...parsed,
          // Aseguramos que stores siempre exista
          stores: parsed.stores || prev.stores,
          // Aseguramos que cloudSync siempre exista
          cloudSync: { ...prev.cloudSync, ...(parsed.cloudSync || {}) }
        }));
        
        if (parsed.cloudSync?.enabled) {
          // Un solo pull inicial
          setTimeout(() => syncWithCloud('pull'), 1000);
        }
      } catch (e) {
        console.error("Error parsing settings", e);
      }
    }
    
    const savedProducts = localStorage.getItem('erp_products');
    if (savedProducts) setProducts(JSON.parse(savedProducts));
    
    const savedOrders = localStorage.getItem('erp_orders');
    if (savedOrders) {
      try {
        const parsedOrders = JSON.parse(savedOrders);
        // Validamos que sea un array para que .filter() no falle en Gerencia
        setOrders(Array.isArray(parsedOrders) ? parsedOrders : []);
      } catch (e) {
        console.error("Error al cargar memoria local:", e);
        setOrders([]); // Si el dato está corrupto, empezamos limpio
      }
    } else {
      setOrders([]); // Si no hay nada guardado, garantizamos una lista vacía
    }

    const savedAgents = localStorage.getItem('erp_agents');
    if (savedAgents) {
      const parsed = JSON.parse(savedAgents);
      const hasWeb = parsed.some((a: any) => a.id === 'agent_web');
      if (!hasWeb) {
        setAgents([...parsed, { id: 'agent_web', name: 'SISTEMA WEB', role: 'VENTAS', storeId: 'store_1', pin: '9999' }]);
      } else {
        setAgents(parsed);
      }
    }

    const savedEvaluations = localStorage.getItem('erp_evaluations');
    if (savedEvaluations) setEvaluations(JSON.parse(savedEvaluations));
    
    const savedRadarAlerts = localStorage.getItem('erp_radar_alerts');
    if (savedRadarAlerts) setRadarAlerts(JSON.parse(savedRadarAlerts));

    const savedMessages = localStorage.getItem('erp_messages');
    if (savedMessages) setMessages(JSON.parse(savedMessages));

    const handleForcePush = () => syncWithCloud('push');
    window.addEventListener('forceCloudPush', handleForcePush);
    return () => window.removeEventListener('forceCloudPush', handleForcePush);
  }, []); // Solo al montar

  // Guardado Local y Sincronización Automática (Debounced)
  useEffect(() => {
    if (!isSessionActive) return;

    const safeSave = (key: string, data: any) => {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (e: any) {
        if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
          console.error(`ROXTOR: Límite de almacenamiento local excedido para ${key}.`);
          setStorageError(true);
          // Si son productos, intentamos guardar una versión "ligera" sin imágenes
          if (key === 'erp_products' && Array.isArray(data)) {
            const lightData = data.map(p => ({ ...p, imageUrl: p.imageUrl?.length > 1000 ? '' : p.imageUrl }));
            try {
              localStorage.setItem(key, JSON.stringify(lightData));
              console.warn("ROXTOR: Se guardó una versión ligera de productos (sin fotos pesadas) para evitar error de cuota.");
            } catch (innerError) {
              console.error("ROXTOR: Error crítico de espacio persistente.");
            }
          }
        }
      }
    };

    safeSave('erp_products', products);
    safeSave('erp_orders', orders);
    safeSave('erp_settings', settings);
    safeSave('erp_agents', agents);
    safeSave('erp_evaluations', evaluations);
    safeSave('erp_radar_alerts', radarAlerts);
    safeSave('erp_messages', messages);

    // Si no estamos en medio de un pull, programamos un push
    if (settings.cloudSync?.enabled && !isSyncingRef.current) {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        syncWithCloud('push');
      }, 5000); // 5 segundos de espera tras el último cambio
    }
  }, [products, orders, settings, agents, workshops, expenses, debts, payroll, isSessionActive]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => { setIsOnline(false); setSyncStatus('offline'); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

// --- BLOQUE INTEGRAL DE BCV (MANUAL + IA) ---

const handleManualBcvSave = async () => {
    if (isSyncingRef.current) return;
    
    const newRate = parseFloat(tempBcv.replace(',', '.'));
    if (isNaN(newRate) || newRate <= 0) return;

    isSyncingRef.current = true;
    try {
      // 1. Actualizamos el estado local primero
      const updatedSettings = { ...settings, bcvRate: newRate };
      setSettings(updatedSettings);
      
      // 2. Usamos tu función maestra 'syncWithCloud' para subir el cambio
      // Esto evita el error de "supabase is not defined"
      await syncWithCloud('push', updatedSettings.cloudSync);
      
      setIsEditingBcv(false);
      console.log("✅ Tasa enviada a la nube mediante syncWithCloud");
    } catch (err) {
      console.error("Error en push manual:", err);
      alert("Error al sincronizar con la nube.");
    } finally {
      isSyncingRef.current = false;
    }
  };

  const syncBcvFromOfficialSource = async () => {
    if (isSyncingBcv) return;
    
    setIsSyncingBcv(true);
    try {
      const prompt = "Valor oficial BCV dolar hoy numero solo ej 45.21";
      const options = {
        tools: [{ googleSearch: {} }]
      };

      const rateStr = await callAI(prompt, options);
      const cleanedRate = rateStr.replace(/[^\d.,]/g, '').replace(',', '.').match(/\d+\.?\d*/);
      const rate = cleanedRate ? parseFloat(cleanedRate[0]) : NaN;

      if (!isNaN(rate) && rate > 0) {
        const roundedRate = Number(rate.toFixed(2));
        const updatedSettings = { ...settings, bcvRate: roundedRate };
        
        setSettings(updatedSettings);
        setTempBcv(roundedRate.toString());
        
        await syncWithCloud('push', updatedSettings.cloudSync);
        console.log("✅ IA sincronizó y syncWithCloud subió los datos");
      }
    } catch (e) {
      console.error("Error en sincronización IA:", e);
    } finally {
      setIsSyncingBcv(false);
    }
  };
  
  if (!isSessionActive) {
    if (viewMode === 'public') {
      return (
        <div className="relative">
          <PublicLanding 
            products={products} 
            orders={orders}
            settings={settings} 
            currentStoreId={currentStoreId} 
            onNewOrder={(order) => {
              setOrders([order, ...orders]);
              syncWithCloud('push');
            }}
            onUpdateOrder={(o) => {
              setOrders(orders.map(order => order.id === o.id ? o : order));
              setTimeout(() => syncWithCloud('push'), 500);
            }}
            onUpdateSettings={setSettings}
            radarAlerts={radarAlerts}
            onNewAlert={(alert) => {
              setRadarAlerts(prev => [alert, ...prev]);
              setTimeout(() => syncWithCloud('push'), 500);
            }}
            messages={messages}
            onNewMessage={(m) => setMessages(prev => {
              if (prev.find(existing => existing.id === m.id)) return prev;
              return [...prev, m];
            })}
            agents={agents}
          />
          <button 
            onClick={() => setViewMode('staff')}
            className="fixed bottom-6 right-6 bg-white/10 backdrop-blur-md border border-white/20 text-white/40 p-3 rounded-xl hover:text-white hover:bg-[#000814] transition-all z-[100] text-[8px] font-black uppercase tracking-widest italic"
          >
            Acceso Staff
          </button>
        </div>
      );
    }
    return <AuthScreen 
      settings={settings} 
      onLogin={(pin: string) => {
        if (pin === settings.loginPin) {
          setIsSessionActive(true);
          return true;
        }
        // También permitir acceso con PIN de agentes
        const agent = agents.find(a => a.pin === pin);
        if (agent) {
          setIsSessionActive(true);
          setCurrentAgentId(agent.id);
          return true;
        }
        return false;
      }} 
      onRestore={async (pin: string) => {
        if (pin === settings.masterPin) {
          const success = await syncWithCloud('pull');
          if (success) {
            setIsSessionActive(true);
            return true;
          }
          return false;
        }
        return false;
      }}
      onBack={() => setViewMode('public')}
    />;
  }

  if (isPublicView) {
    return (
      <PublicLanding 
        products={products} 
        orders={orders}
        settings={settings} 
        currentStoreId={currentStoreId} 
        radarAlerts={radarAlerts}
        onNewAlert={(alert) => {
          setRadarAlerts(prev => [alert, ...prev]);
          setTimeout(() => syncWithCloud('push'), 500);
        }}
        onNewOrder={(order) => {
          setOrders([order, ...orders]);
          syncWithCloud('push');
        }}
        onUpdateOrder={(o) => {
          setOrders(orders.map(order => order.id === o.id ? o : order));
          setTimeout(() => syncWithCloud('push'), 500);
        }}
        onUpdateSettings={setSettings}
        messages={messages}
        onNewMessage={(m) => setMessages(prev => {
          if (prev.find(existing => existing.id === m.id)) return prev;
          return [...prev, m];
        })}
        agents={agents}
      />
    );
  }

  return (
    <Routes>
      <Route path="/taller/:workshopId" element={
        <WorkshopQueue 
          orders={orders} 
          workshops={workshops} 
          setOrders={setOrders} 
          settings={settings} 
        />
      } />
      <Route path="*" element={
        <div className="flex h-screen bg-[#000814] text-slate-900 overflow-hidden font-sans">
          <div className="flex-1 flex flex-col min-w-0 relative bg-slate-50 pb-20">
            {/* BARRA DE ESTADO DE LA NUBE (SUPERIOR) */}
            <div className={`h-1 w-full fixed top-0 left-0 z-[100] transition-all duration-500 ${
              syncStatus === 'syncing' ? 'bg-blue-500 animate-pulse shadow-[0_0_10px_#3b82f6]' : 
              syncStatus === 'error' ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]' : 
              'bg-emerald-500'
            }`} />

      <div className={`${syncStatus === 'error' || storageError ? 'bg-rose-600 animate-pulse' : syncStatus === 'syncing' ? 'bg-blue-600' : 'bg-[#000814]'} h-10 flex items-center justify-between px-6 text-[9px] font-black uppercase tracking-[0.2em] text-white transition-all z-50`}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 cursor-pointer hover:text-blue-300 transition-colors" onClick={() => setShowSyncDiagnostic(true)}>
            {!isOnline ? <CloudOff size={12} className="text-white/50" /> : 
             syncStatus === 'syncing' ? <RefreshCcw size={12} className="animate-spin text-white" /> : 
             syncStatus === 'error' || storageError ? <AlertTriangle size={12} className="text-white" /> :
             (!settings?.cloudSync?.apiUrl || !settings?.cloudSync?.apiKey) ? <Database size={12} className="text-rose-400 animate-pulse" /> :
             <Cloud size={12} className="text-blue-400" />}
            <span>
              {syncStatus === 'syncing' ? 'TRANSMITIENDO DATOS...' : 
               storageError ? (
                 <div className="flex items-center gap-2">
                   <span>MEMORIA LOCAL LLENA</span>
                   <button 
                     onClick={(e) => {
                       e.stopPropagation();
                       if (confirm("⚠️ ¿LIBERAR MEMORIA? Las fotos pesadas se borrarán de este dispositivo para ahorrar espacio. Seguirán disponibles en la nube.")) {
                         const lightProducts = products.map(p => ({ ...p, imageUrl: p.imageUrl?.startsWith('data:') ? '' : p.imageUrl }));
                         setProducts(lightProducts);
                         setStorageError(false);
                         localStorage.setItem('erp_products', JSON.stringify(lightProducts));
                       }
                     }}
                     className="bg-white text-rose-600 px-2 py-0.5 rounded-md font-black hover:bg-rose-100 transition-colors"
                   >
                     LIMPIAR YA
                   </button>
                 </div>
               ) :
               syncStatus === 'error' ? 'ERROR DE CONEXIÓN - VERIFICA SUPABASE' :
               (!settings?.cloudSync?.apiUrl || !settings?.cloudSync?.apiKey) ? 'CONFIGURACIÓN NUBE PENDIENTE' :
               isOnline ? 'SINCRO NUBE OK' : 'MODO OFFLINE'}
            </span>
          </div>
          {settings.cloudSync?.enabled && (
            <button onClick={() => syncWithCloud('pull')} className="hover:text-blue-300 flex items-center gap-1 transition-colors">
              <RefreshCw size={10} /> ACTUALIZAR TODO
            </button>
          )}
        </div>
        <button onClick={() => setIsSessionActive(false)} className="bg-white/10 px-3 py-1 rounded-lg hover:bg-white/20 transition-all">SALIR DEL SISTEMA</button>
      </div>

      {/* PANEL DE DIAGNÓSTICO DE NUBE */}
      {showSyncDiagnostic && (
        <div className="fixed inset-0 z-[200] bg-[#000814]/90 backdrop-blur-xl flex items-center justify-center p-6 italic">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl space-y-8 animate-in zoom-in-95">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-[#000814] uppercase tracking-tighter leading-none italic">Diagnóstico de Nube</h3>
                <p className="text-[10px] font-bold text-blue-600 uppercase italic">Estado de conexión con Supabase</p>
              </div>
              <button onClick={() => setShowSyncDiagnostic(false)} className="p-2 bg-slate-50 rounded-xl text-slate-300 hover:text-red-500 transition-all"><X size={24}/></button>
            </div>

            <div className="space-y-4">
              <DiagnosticItem 
                label="Variables de Entorno" 
                status={cloudConfig ? 'ok' : 'error'} 
                message={cloudConfig ? 'Configuradas correctamente' : 'Faltan variables SUPABASE_URL/KEY'} 
              />
              <DiagnosticItem 
                label="Conexión a Internet" 
                status={isOnline ? 'ok' : 'error'} 
                message={isOnline ? 'Conectado a la red' : 'Sin conexión a internet'} 
              />
              <DiagnosticItem 
                label="Respuesta de Supabase" 
                status={syncStatus === 'error' ? 'error' : 'ok'} 
                message={lastSyncError || 'Servidor respondiendo correctamente'} 
              />
              <DiagnosticItem 
                label="Memoria del Navegador" 
                status={storageError ? 'error' : 'ok'} 
                message={storageError ? 'Límite de 5MB excedido. Sincroniza a la nube para liberar espacio.' : 'Espacio suficiente'} 
              />
              {syncStatus === 'error' && (lastSyncError?.includes("Error de conexión") || lastSyncError?.includes("Failed to fetch")) && (
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 space-y-2">
                  <p className="text-[9px] font-black text-rose-600 uppercase italic">💡 Tips de Solución:</p>
                  <ul className="text-[8px] text-rose-500 font-bold uppercase list-disc pl-4 space-y-1">
                    <li>Verifica que la URL de Supabase sea correcta (ej: https://xxx.supabase.co)</li>
                    <li>Desactiva AdBlockers que bloquean dominios de bases de datos</li>
                    <li>Si usas VPN o estás en una red corporativa, intenta desactivarla</li>
                    <li>Asegúrate de que no haya espacios al final de la URL o Key</li>
                    <li>Si estás en Venezuela (CANTV), el sistema ya está usando un Proxy automático para intentar saltar el bloqueo.</li>
                  </ul>
                </div>
              )}
            </div>

            <div className="bg-blue-50 p-6 rounded-3xl border-2 border-blue-100 space-y-2">
              <p className="text-[10px] font-black text-blue-600 uppercase italic flex items-center gap-2"><Wifi size={14}/> Sincronización Forzada</p>
              <p className="text-[9px] text-blue-400 font-bold uppercase leading-relaxed">Si los cambios de la PC no aparecen, usa este botón para obligar una descarga completa.</p>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => {
                  if (confirm("⚠️ ¿ESTÁS SEGURO? Esto borrará la memoria local del navegador y reiniciará la app. Los datos en la nube NO se borrarán.")) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                className="flex-1 bg-rose-50 text-rose-600 py-6 rounded-[2.5rem] font-black uppercase text-[10px] tracking-widest hover:bg-rose-600 hover:text-white transition-all border-b-8 border-rose-100 italic"
              >
                Resetear App
              </button>
              <button 
                onClick={() => {
                  if (confirm("⚠️ ¿LIBERAR MEMORIA? Las fotos se borrarán de este dispositivo para ahorrar espacio, pero SE MANTENDRÁN EN LA NUBE. \n\nIMPORTANTE: Asegúrate de que el indicador diga 'SINCRO NUBE OK' antes de continuar.")) {
                    const lightProducts = products.map(p => ({ ...p, imageUrl: p.imageUrl?.startsWith('data:') ? '' : p.imageUrl }));
                    setProducts(lightProducts);
                    setStorageError(false);
                    // Guardamos en localStorage pero evitamos que el próximo auto-sync sobreescriba la nube inmediatamente con vacíos
                    localStorage.setItem('erp_products', JSON.stringify(lightProducts));
                    alert("Memoria liberada localmente. Las fotos pesadas (base64) han sido removidas de este dispositivo. Se recargarán desde la nube cuando sea necesario.");
                  }
                }}
                className="flex-1 bg-amber-50 text-amber-600 py-6 rounded-[2.5rem] font-black uppercase text-[10px] tracking-widest hover:bg-amber-600 hover:text-white transition-all border-b-8 border-amber-100 italic"
              >
                Liberar Espacio
              </button>
              <button 
                onClick={async () => {
                  const success = await syncWithCloud('pull');
                  if (success) setShowSyncDiagnostic(false);
                }} 
                className="flex-[2] bg-[#000814] text-white py-6 rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-blue-600 transition-all border-b-8 border-slate-800 italic flex items-center justify-center gap-3"
              >
                <RefreshCcw size={18} className={syncStatus === 'syncing' ? 'animate-spin' : ''} /> 
                REINTENTAR AHORA
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="h-24 border-b bg-white flex items-center justify-between px-6 z-20 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#000814] rounded-2xl flex items-center justify-center text-white italic font-black text-2xl rotate-3 shadow-lg overflow-hidden">
              {settings.logoUrl ? <img src={settings.logoUrl} className="w-full h-full object-contain p-1" /> : 'R'}
            </div>
            <div>
              <span className="font-black text-2xl tracking-tighter text-[#000814] italic uppercase block leading-none">{settings.businessName}</span>
              <span className="text-[10px] font-bold text-rose-600 tracking-[0.05em] uppercase italic">{settings.slogan}</span>
            </div>
          </div>
          <div className="h-10 w-px bg-slate-100 mx-4" />
          <div className="flex items-center gap-4 px-4 py-2 bg-slate-50 rounded-2xl">
             <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">BCV HOY</span>
              {isEditingBcv ? (
                <div className="flex items-center gap-2">
                  <input 
                    autoFocus
                    type="text" 
                    className="w-20 bg-white border-2 border-[#004ea1] rounded-lg px-2 py-1 text-sm font-black text-[#004ea1] outline-none"
                    value={tempBcv}
                    onChange={(e) => setTempBcv(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualBcvSave()}
                  />
                  <button onClick={handleManualBcvSave} className="text-[#004ea1] hover:scale-110"><Save size={14} /></button>
                </div>
              ) : (
                <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setIsEditingBcv(true)}>
                  <span className="text-lg font-black text-[#004ea1] italic tabular-nums leading-none">Bs. {settings.bcvRate.toLocaleString('es-VE')}</span>
                  <Edit2 size={12} className="text-slate-300 group-hover:text-[#004ea1] transition-colors" />
                </div>
              )}
             </div>
             <button onClick={syncBcvFromOfficialSource} disabled={isSyncingBcv} className="p-2 rounded-xl bg-[#000814] text-white shadow-md hover:bg-slate-800 transition-all">
               {isSyncingBcv ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
             </button>
          </div>
        </div>

        <button onClick={() => { setIsLocked(!isLocked); setViewMode('public'); setIsSessionActive(false); }} className={`${!isLocked ? 'bg-[#004ea1]' : 'bg-slate-100 text-slate-400'} px-6 py-3 rounded-2xl text-[10px] font-black flex items-center gap-3 shadow-xl transition-all uppercase italic`}>
          {!isLocked ? <ShieldCheck size={14}/> : <Lock size={14}/>} {!isLocked ? 'GERENCIA ABIERTA' : 'SISTEMA BLOQUEADO'}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 bg-slate-50/50">
        {activeTab === 'radar' && (
          <Radar 
            products={products} 
            orders={orders}
            settings={settings} 
            currentStoreId={currentStoreId} 
            radarAlerts={radarAlerts}
            onNewAlert={(alert) => {
              setRadarAlerts(prev => [alert, ...prev]);
              setTimeout(() => syncWithCloud('push'), 500);
            }}
            onNewOrder={(o) => { 
              setOrders([o, ...orders]); 
              setTimeout(() => syncWithCloud('push'), 500); 
            }} 
            onUpdateOrder={(o) => {
              setOrders(orders.map(order => order.id === o.id ? o : order));
              setTimeout(() => syncWithCloud('push'), 500);
            }}
            onUpdateSettings={(s) => setSettings(s)} 
            messages={messages}
            onNewMessage={(m) => setMessages(prev => {
              if (prev.find(existing => existing.id === m.id)) return prev;
              return [...prev, m];
            })}
            currentAgentId={currentAgentId}
            agents={agents}
          />
        )}
        {activeTab === 'erp' && (isLocked ? <PINScreen onUnlock={(pin: string) => {
          if (pin === settings.masterPin) {
            setIsLocked(false);
            return true;
          }
          return false;
        }} label="Acceso Gerencial" icon={<Lock size={40} />} isAlphanumeric={true} onBack={() => setActiveTab('radar')} /> : 
          <CoreERPView 
            orders={orders}
            setOrders={setOrders}
            products={products}
            setProducts={setProducts}
            agents={agents}
            setAgents={setAgents}
            settings={settings}
            setSettings={setSettings}
            expenses={expenses}
            debts={debts}
            payroll={payroll}
            workshops={workshops}
            currentStoreId={currentStoreId}
          />
        )}
        {activeTab === 'inbox' && (
          <WhatsAppInbox 
            settings={settings}
            orders={orders}
            currentAgentId={currentAgentId || undefined}
          />
        )}
        {activeTab === 'operaciones' && <Operaciones orders={orders} setOrders={setOrders} products={products} agents={agents} setAgents={setAgents} workshops={workshops} settings={settings} setSettings={setSettings} currentStoreId={currentStoreId} expenses={expenses} setExpenses={setExpenses} debts={debts} setDebts={setDebts} radarAlerts={radarAlerts} setRadarAlerts={setRadarAlerts} leads={leads} setLeads={setLeads} />}
        {activeTab === 'stock' && <Inventory products={products} setProducts={setProducts} currentStoreId={currentStoreId} settings={settings} />}
        {activeTab === 'equipo' && (
          <div className="space-y-8">
            {!currentAgentId ? (
              <div className="max-w-xl mx-auto bg-white border-4 border-slate-50 rounded-[4rem] p-12 shadow-sm space-y-10 text-center animate-in zoom-in-95">
                <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl rotate-3"><Users size={48}/></div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-black text-[#000814] uppercase italic tracking-tighter leading-none">Identificación de Equipo</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest">SELECCIONA TU PERFIL PARA ACCEDER A LA ACADEMIA</p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {agents.filter(a => a.id !== 'agent_web').map(agent => (
                    <button 
                      key={agent.id}
                      onClick={() => setCurrentAgentId(agent.id)}
                      className="group flex items-center justify-between bg-slate-50 p-6 rounded-3xl border-2 border-transparent hover:border-blue-500 hover:bg-white transition-all"
                    >
                      <div className="text-left">
                        <p className="font-black text-slate-800 uppercase italic text-sm">{agent.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase italic">{agent.role}</p>
                      </div>
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-300 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-sm">
                        <ChevronRight size={20} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-slate-100 pb-6">
                  <div className="flex gap-4 overflow-x-auto no-scrollbar">
                    {(!isLocked || agents.find(a => a.id === currentAgentId)?.role === 'GERENCIA') && (
                      <button 
                        onClick={() => setEquipoSubTab('desempeño')} 
                        className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase italic transition-all whitespace-nowrap ${equipoSubTab === 'desempeño' ? 'bg-[#000814] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                      >
                        Disciplina Operativa
                      </button>
                    )}
                    <button 
                      onClick={() => setEquipoSubTab('academia')} 
                      className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase italic transition-all whitespace-nowrap ${equipoSubTab === 'academia' ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                      Academia Roxtor
                    </button>
                    <button 
                      onClick={() => setEquipoSubTab('checklists')} 
                      className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase italic transition-all whitespace-nowrap ${equipoSubTab === 'checklists' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                      Checklists
                    </button>
                    <button 
                      onClick={() => setEquipoSubTab('manuales')} 
                      className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase italic transition-all whitespace-nowrap ${equipoSubTab === 'manuales' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                      Manuales
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[8px] font-black text-slate-400 uppercase italic">Sesión Activa</p>
                      <p className="text-[10px] font-black text-slate-800 uppercase italic">{agents.find(a => a.id === currentAgentId)?.name}</p>
                    </div>
                    <button 
                      onClick={() => setCurrentAgentId(null)}
                      className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
                      title="Cerrar Sesión de Agente"
                    >
                      <Power size={18} />
                    </button>
                  </div>
                </div>
                {equipoSubTab === 'desempeño' && (!isLocked || agents.find(a => a.id === currentAgentId)?.role === 'GERENCIA') ? (
                  <StaffPerformance orders={orders} expenses={expenses} agents={agents} settings={settings} />
                ) : equipoSubTab === 'academia' ? (
                  <TrainingAcademy agents={agents} evaluations={evaluations} setEvaluations={setEvaluations} currentAgentId={currentAgentId} settings={settings} />
                ) : equipoSubTab === 'checklists' ? (
                  <Checklists />
                ) : equipoSubTab === 'manuales' ? (
                  <Manuals />
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 opacity-20 italic">
                    <Lock size={48} className="mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest">Acceso Restringido a Gerencia</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        {activeTab === 'facturacion' && (
          <FiscalBilling 
            orders={orders}
            settings={settings}
            fiscalInvoices={fiscalInvoices}
            onSaveInvoice={(invoice) => {
              setFiscalInvoices(prev => [invoice, ...prev]);
              setTimeout(() => syncWithCloud('push'), 500);
            }}
            currentAgentId={currentAgentId}
            agents={agents}
            currentStoreId={currentStoreId}
          />
        )}
        {activeTab === 'perfil' && currentAgentId && (
          <Profile 
            agent={agents.find(a => a.id === currentAgentId)!} 
            onUpdateAgent={(updatedAgent) => {
              setAgents(prev => prev.map(a => a.id === updatedAgent.id ? updatedAgent : a));
              setTimeout(() => syncWithCloud('push'), 500);
            }} 
          />
        )}
        {activeTab === 'gestion' && (isLocked ? <PINScreen onUnlock={(pin: string) => {
          if (pin === settings.masterPin) {
            setIsLocked(false);
            return true;
          }
          return false;
        }} label="Acceso Gerencial" icon={<Lock size={40} />} isAlphanumeric={true} onBack={() => setActiveTab('radar')} /> : 
        <Gestion 
          orders={orders} 
          setOrders={setOrders} 
          products={products} 
          agents={agents} 
          setAgents={setAgents} 
          workshops={workshops} 
          setWorkshops={setWorkshops} 
          settings={settings} 
          setSettings={setSettings} 
          currentStoreId={currentStoreId} 
          expenses={expenses} 
          setExpenses={setExpenses} 
          debts={debts}
          setDebts={setDebts}
          payroll={payroll}
          setPayroll={setPayroll}
          leads={leads}
          setLeads={setLeads}
          currentAgentId={currentAgentId}
          currentAgent={agents.find(a => a.id === currentAgentId)}
        />)}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-[#000814] border-t border-white/5 flex items-center justify-center gap-4 md:gap-12 px-4 z-30 shadow-2xl">
        <TabItem active={activeTab === 'radar'} onClick={() => setActiveTab('radar')} icon={<RadarIcon size={22}/>} label="Radar" />
        <TabItem active={activeTab === 'erp'} onClick={() => setActiveTab('erp')} icon={<LayoutDashboard size={22} className="text-emerald-500" />} label="Core ERP" />
        <TabItem active={activeTab === 'inbox'} onClick={() => setActiveTab('inbox')} icon={<MessageSquare size={22}/>} label="Mensajería" />
        <TabItem active={activeTab === 'operaciones'} onClick={() => setActiveTab('operaciones')} icon={<Zap size={22}/>} label="Operaciones" />
        <TabItem active={activeTab === 'stock'} onClick={() => setActiveTab('stock')} icon={<Package size={22}/>} label="Inventario" />
        <TabItem active={activeTab === 'facturacion'} onClick={() => setActiveTab('facturacion')} icon={<FileText size={22}/>} label="Factura" />
        <TabItem active={activeTab === 'equipo'} onClick={() => setActiveTab('equipo')} icon={<Users size={22}/>} label="Equipo" />
        {currentAgentId && (
          <TabItem active={activeTab === 'perfil'} onClick={() => setActiveTab('perfil')} icon={<User size={22}/>} label="Perfil" />
        )}
        <TabItem active={activeTab === 'gestion'} onClick={() => setActiveTab('gestion')} icon={<ShieldCheck size={22}/>} label="Gerencia" />
      </nav>
    </div>
    </div>
    } />
  </Routes>
  );
};

const DiagnosticItem = ({ label, status, message }: any) => (
  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
    <div className={`w-3 h-3 rounded-full ${status === 'ok' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-rose-500 shadow-[0_0_10px_#f43f5e]'}`} />
    <div className="flex-1">
      <p className="text-[9px] font-black text-slate-400 uppercase italic">{label}</p>
      <p className={`text-[10px] font-bold uppercase italic ${status === 'ok' ? 'text-slate-600' : 'text-rose-600'}`}>{message}</p>
    </div>
  </div>
);

const SidebarItem = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all group ${
      active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
        : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
    }`}
  >
    <div className={`transition-all ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</div>
    <span className="text-[11px] font-black uppercase tracking-widest italic">{label}</span>
  </button>
);

const TabItem = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className="relative flex flex-col items-center justify-center w-24 h-full transition-all duration-300 group">
    <div className={`transition-all ${active ? 'text-white scale-125 -translate-y-1' : 'text-slate-600 group-hover:text-slate-400'}`}>{icon}</div>
    <span className={`text-[9px] font-black uppercase tracking-[0.15em] mt-2 italic ${active ? 'text-white' : 'text-slate-600'}`}>{label}</span>
  </button>
);

const AuthScreen = ({ settings, onLogin, onRestore, onBack }: any) => {
  const [showPin, setShowPin] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restorePin, setRestorePin] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestore = async (pin: string) => {
    setIsRestoring(true);
    const success = await onRestore(pin);
    setIsRestoring(false);
    if (success) {
      setShowRestoreModal(false);
    } else {
      alert("PIN Incorrecto o Error de Conexión. Intenta de nuevo.");
      setRestorePin('');
    }
  };

  return (
    <div className="h-screen w-screen bg-[#000814] flex flex-col items-center justify-center p-8 overflow-hidden relative italic">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse"></div>
      {!showPin ? (
        <div className="relative z-10 flex flex-col items-center gap-12">
           <div className="w-56 h-56 bg-white text-[#000814] rounded-[4rem] flex items-center justify-center text-8xl font-black italic shadow-2xl rotate-3 overflow-hidden">
             {settings.logoUrl ? <img src={settings.logoUrl} className="w-full h-full object-contain p-4" /> : 'R'}
           </div>
           <div className="text-center space-y-4">
             <h1 className="text-7xl font-black italic tracking-tighter text-white uppercase leading-none">{settings.businessName} ERP</h1>
             <p className="text-slate-500 font-black text-xs uppercase tracking-[0.5em] italic">{settings.slogan}</p>
           </div>
           
           <div className="flex flex-col items-center gap-4 w-full">
             <button onClick={() => setShowPin(true)} className="group flex items-center gap-6 bg-white text-[#000814] pl-10 pr-4 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all w-full md:w-auto">
               ACCEDER AL SISTEMA <div className="w-12 h-12 bg-[#000814] text-white rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-[#000814] transition-all"><ChevronRight size={24} /></div>
             </button>
             
             <button onClick={() => setShowRestoreModal(true)} className="flex items-center gap-3 text-slate-500 hover:text-white transition-all uppercase font-black text-[10px] tracking-widest pt-4">
               <LifeBuoy size={16} className="text-rose-500" /> ¿BORRASTE TUS DATOS? RECUPERAR AQUÍ
             </button>
           </div>
        </div>
      ) : (
        <PINScreen onUnlock={onLogin} label="ACCESO GENERAL" icon={<Key size={40} className="text-blue-500" />} onBack={() => setShowPin(false)} length={6} />
      )}

      {/* MODAL DE RECUPERACIÓN DE EMERGENCIA */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-[200] bg-[#000814]/98 backdrop-blur-2xl flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-md rounded-[4rem] p-10 shadow-2xl border-8 border-white/10 animate-in zoom-in-95 space-y-8">
              <div className="flex justify-between items-start">
                 <div className="space-y-1">
                    <h3 className="text-2xl font-black text-[#000814] uppercase tracking-tighter leading-none italic">Recuperación Nube</h3>
                    <p className="text-[10px] font-bold text-rose-600 uppercase italic">Seguridad de Gerencia Requerida</p>
                 </div>
                 <button onClick={() => setShowRestoreModal(false)} className="p-2 bg-slate-50 rounded-xl text-slate-300 hover:text-red-500 transition-all"><X size={24}/></button>
              </div>

              <div className="bg-blue-50 p-6 rounded-3xl border-2 border-blue-100">
                 <p className="text-[10px] font-black text-blue-600 uppercase italic flex items-center gap-2"><Lock size={14}/> Verificación de Identidad</p>
                 <p className="text-[9px] text-blue-400 font-bold uppercase mt-2 leading-relaxed">Para recuperar tus datos de la nube sin configurar llaves, ingresa el PIN de Gerencia.</p>
              </div>

              <div className="space-y-6">
                <div className="flex justify-center gap-4">
                  <input 
                    type="password"
                    value={restorePin}
                    onChange={(e) => setRestorePin(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRestore(restorePin)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-4 text-center font-black text-[#000814] tracking-[0.2em] outline-none focus:border-blue-500 transition-all"
                    placeholder="CLAVE DE GERENCIA"
                    autoFocus
                  />
                </div>
                
                <button 
                  onClick={() => handleRestore(restorePin)}
                  disabled={isRestoring || !restorePin}
                  className="w-full py-4 bg-[#000814] text-white rounded-2xl font-black uppercase italic tracking-widest hover:bg-blue-600 transition-all disabled:opacity-50"
                >
                  VERIFICAR Y RESTAURAR
                </button>
              </div>

              {isRestoring && (
                <div className="flex items-center justify-center gap-3 text-[#000814] font-black text-[10px] uppercase tracking-widest animate-pulse">
                  <Loader2 size={16} className="animate-spin" /> SINCRONIZANDO CON LA NUBE...
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

const PINScreen = ({ onUnlock, label, icon, onBack, isAlphanumeric = false, length = 4 }: any) => {
  const [pin, setPin] = useState('');
  
  const handleUnlock = (value: string) => {
    if (!onUnlock(value)) {
      setPin('');
    }
  };

  const addDigit = (d: string) => {
    if (pin.length < length) {
      const newPin = pin + d;
      setPin(newPin);
      if (newPin.length === length) {
        setTimeout(() => handleUnlock(newPin), 150);
      }
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-6">
      <div className="bg-white/5 backdrop-blur-3xl border-4 border-white/10 rounded-[4rem] p-12 shadow-2xl w-full max-w-md flex flex-col items-center space-y-10">
        <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center text-white shadow-inner">{icon}</div>
        <h4 className="font-black text-xl uppercase tracking-tighter italic text-white">{label}</h4>
        
        {isAlphanumeric ? (
          <div className="w-full space-y-6">
            <input 
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock(pin)}
              className="w-full bg-white/10 border-2 border-white/10 rounded-2xl px-6 py-5 text-white font-black text-center tracking-[0.2em] outline-none focus:border-blue-500 transition-all"
              placeholder="CLAVE MAESTRA"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={onBack} className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all">VOLVER</button>
              <button onClick={() => handleUnlock(pin)} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 transition-all">ENTRAR</button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex gap-5">
              {Array.from({ length }).map((_, i) => (
                <div key={i} className={`w-4 h-4 rounded-full transition-all duration-300 ${pin.length > i ? 'bg-blue-500 scale-150 shadow-[0_0_15px_#3b82f6]' : 'bg-white/10'}`} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4 w-full">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '←'].map(v => (
                <button 
                  key={`pin-btn-${v}`} 
                  onClick={() => {
                    if (v === 'C') setPin('');
                    else if (v === '←') {
                      if (pin.length === 0 && onBack) onBack();
                      else setPin(pin.slice(0, -1));
                    } else {
                      addDigit(v.toString());
                    }
                  }} 
                  className="h-16 rounded-[1.5rem] bg-white/5 border border-white/5 font-black text-white hover:bg-white hover:text-[#000814] active:scale-90 transition-all flex items-center justify-center text-lg"
                >
                  {v}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;

