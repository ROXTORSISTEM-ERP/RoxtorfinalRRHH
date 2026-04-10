
import React, { useState, useRef, useEffect } from 'react';
import { Product, AppSettings } from '../types';
import { ROXTOR_SYSTEM_INSTRUCTIONS } from '../constants/systemInstructions';
import { uploadToSupabaseStorage, compressImage } from '../utils/storage';
import { callRoxtorAI } from '../utils/ai';
import { exportToCSV } from '../utils/csvExport';
import { 
  Plus, 
  Trash2, 
  Camera, 
  Loader2, 
  Search, 
  Edit3, 
  X, 
  Image as ImageIcon, 
  Save, 
  Globe,
  Package,
  FileSearch,
  Upload,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  FileUp,
  Sparkles,
  Zap,
  Layers,
  StickyNote,
  Cpu,
  Scan,
  ShieldCheck,
  Terminal,
  Activity,
  Share2,
  MessageCircle,
  Calculator,
  Clock
} from 'lucide-react';

interface Props {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  currentStoreId: string;
  settings: AppSettings;
}

const Inventory: React.FC<Props> = ({ products, setProducts, currentStoreId, settings }) => {
  const [viewMode, setViewMode] = useState<'catalog' | 'profitability'>('catalog');
  const [isScanning, setIsScanning] = useState(false);
  const [isVisualScanning, setIsVisualScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importResults, setImportResults] = useState<Partial<Product>[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    name: '',
    priceRetail: 0,
    priceWholesale: 0,
    costUsd: 0,
    costBs: 0,
    costBreakdown: [],
    currency: 'USD',
    material: '',
    description: '',
    additionalConsiderations: '',
    imageUrl: '',
    stock: 0,
    category: 'producto',
    embroideryPriceComponent: 0,
    estimatedLaborMinutes: 0,
    storeId: currentStoreId,
    targetAreas: ''
  });

  // Mensajes de progreso para la IA
  const scanMessages = [
    "Iniciando Conexión con Gemini 2.0 Flash...",
    "Extrayendo capas visuales del documento...",
    "Identificando patrones de precios (Detal/Mayor)...",
    "Analizando descriptores de materiales y telas...",
    "Mapeando recargos por tallas especiales...",
    "Estructurando base de datos temporal...",
    "Finalizando interpretación de catálogo..."
  ];

  useEffect(() => {
    let interval: any;
    if (isScanning) {
      interval = setInterval(() => {
        setScanStep((prev) => (prev + 1) % scanMessages.length);
        setScanProgress(prev => Math.min(prev + (100 / scanMessages.length), 100));
      }, 2500);
    } else {
      setScanStep(0);
      setScanProgress(0);
    }
    return () => clearInterval(interval);
  }, [isScanning]);

  const handleShareCatalog = () => {
    if (products.length === 0) return;
    let message = `*CATÁLOGO OFICIAL ROXTOR* 🦖✨\n\n`;
    const categories = Array.from(new Set(products.map(p => p.category || 'PRODUCTOS')));
    
    categories.forEach(cat => {
      const catProducts = products.filter(p => (p.category || 'PRODUCTOS') === cat);
      message += `*--- ${cat.toUpperCase()} ---*\n`;
      catProducts.forEach(p => {
        message += `• *${p.name}*\n`;
        message += `  💰 Detal: $${p.priceRetail}\n`;
        if (p.material) message += `  🧵 Tela: ${p.material}\n`;
        if (p.additionalConsiderations) message += `  ⚠️ Nota: ${p.additionalConsiderations}\n`;
        message += `\n`;
      });
    });
    
    message += `_Precios sujetos a cambio. Solicita tu presupuesto personalizado._`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({ ...product, costBreakdown: product.costBreakdown || [] });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        priceRetail: 0,
        priceWholesale: 0,
        costUsd: 0,
        costBs: 0,
        costBreakdown: [],
        currency: 'USD',
        material: '',
        description: '',
        additionalConsiderations: '',
        imageUrl: '',
        stock: 0,
        category: 'producto',
        embroideryPriceComponent: 0,
        estimatedLaborMinutes: 0,
        storeId: currentStoreId,
        targetAreas: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const compressed = await compressImage(file, 800);
        
        // Subida a Supabase si está activo
        if (settings.cloudSync?.enabled && settings.cloudSync.provider === 'supabase') {
          const fileName = `product_${Date.now()}.jpg`;
          const url = await uploadToSupabaseStorage(
            compressed, 
            'products', 
            fileName, 
            { apiUrl: settings.cloudSync.apiUrl, apiKey: settings.cloudSync.apiKey }
          );
          if (url) {
            setFormData({ ...formData, imageUrl: url });
            setIsUploading(false);
            return;
          }
        }

        // Fallback a base64
        const reader = new FileReader();
        reader.onload = () => {
          setFormData({ ...formData, imageUrl: reader.result as string });
          setIsUploading(false);
        };
        reader.readAsDataURL(compressed);
      } catch (err) {
        console.error("Upload error:", err);
        setIsUploading(false);
      }
    }
  };

  const handleVisualScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsVisualScanning(true);
    setIsScanning(true);
    setScanProgress(5);
    
    try {
      const compressed = await compressImage(file, 1024);
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const prompt = `
            ESCANEANDO PRODUCTO INDIVIDUAL ROXTOR.
            Identifica este producto. Si es un producto que ya conoces de ROXTOR (como franelas, uniformes, etc.), especifica sus detalles.
            Si no lo conoces, descríbelo técnicamente para crear un nuevo registro.
          `;

          const result = await callRoxtorAI(prompt, reader.result as string, { module: 'inventory' });
          
          if (result.error) {
            throw new Error(result.suggested_reply || "Error en el escaneo visual");
          }

          if (result.items && result.items.length > 0) {
            setImportResults(result.items);
            setIsImportModalOpen(true);
          } else {
            alert("La IA no pudo identificar productos claros en esta imagen.");
          }
        } catch (err) {
          console.error("Visual Scan Error:", err);
          alert("Error en el escaneo visual. Intente de nuevo.");
        } finally {
          setIsScanning(false);
          setIsVisualScanning(false);
          if (cameraInputRef.current) cameraInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(compressed);
    } catch (err) {
      console.error("Setup Error:", err);
      setIsScanning(false);
      setIsVisualScanning(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScanProgress(5); 
    
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          
          const prompt = `
            ERES UN EXPERTO EN CATALOGOS TEXTILES PARA INVERSIONES ROXTOR.
            Analiza este archivo (PDF o Imagen) y extrae CADA PRODUCTO/SERVICIO.
            
            REGLAS DE ORO:
            1. Extrae el nombre en MAYÚSCULAS.
            2. Identifica la tela/material (Lino, Algodón, Microdurazno, etc.).
            3. Captura precios DETAL y MAYOR.
            4. Identifica el ÁREA O USO DIRIGIDO (Ejem: Uso personal, deportes, colegios, empresas, clínicas).
            5. REGLA CRÍTICA: Busca "Recargos Especiales" como: costos por tallas 2XL en adelante, cargos de diseño, o digitalización.
            
            Devuelve este JSON estrictamente:
            {
              "items": [
                {
                  "name": "NOMBRE",
                  "priceRetail": 0.0,
                  "priceWholesale": 0.0,
                  "material": "TELA",
                  "targetAreas": "ÁREA O USO",
                  "additionalConsiderations": "RECARGOS (Ejem: +2$ tallas plus)",
                  "description": "NOTAS GENERALES"
                }
              ]
            }
          `;

          // Ejecución a través del puente seguro
          const result = await callRoxtorAI(prompt, reader.result as string, { module: 'inventory' });
          
          if (result.error) {
            throw new Error(result.suggested_reply || "Error en el análisis de IA");
          }

          setImportResults(result.items || []);
          setIsImportModalOpen(true);
        } catch (err) {
          console.error("AI Import Error:", err);
          alert("Error procesando catálogo con la IA. Verifique su conexión.");
        } finally {
          setIsScanning(false);
          if (importInputRef.current) importInputRef.current.value = '';
        }
      };
      reader.onerror = () => {
        alert("Error al leer el archivo.");
        setIsScanning(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Setup Error:", err);
      setIsScanning(false);
    }
  };

  const addCostComponent = () => {
    const newComponent = { id: `cost_${Date.now()}`, name: '', amountUsd: 0 };
    setFormData(prev => ({
      ...prev,
      costBreakdown: [...(prev.costBreakdown || []), newComponent]
    }));
  };

  const removeCostComponent = (id: string) => {
    setFormData(prev => {
      const updatedBreakdown = (prev.costBreakdown || []).filter(c => c.id !== id);
      const totalCostUsd = updatedBreakdown.reduce((acc, c) => acc + c.amountUsd, 0);
      return {
        ...prev,
        costBreakdown: updatedBreakdown,
        costUsd: totalCostUsd,
        costBs: Number((totalCostUsd * settings.bcvRate).toFixed(2))
      };
    });
  };

  const updateCostComponent = (id: string, field: 'name' | 'amountUsd', value: any) => {
    setFormData(prev => {
      const updatedBreakdown = (prev.costBreakdown || []).map(c => 
        c.id === id ? { ...c, [field]: value } : c
      );
      const totalCostUsd = updatedBreakdown.reduce((acc, c) => acc + c.amountUsd, 0);
      return {
        ...prev,
        costBreakdown: updatedBreakdown,
        costUsd: totalCostUsd,
        costBs: Number((totalCostUsd * settings.bcvRate).toFixed(2))
      };
    });
  };

  const handleSave = () => {
    if (!formData.name) return;
    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? { ...formData, id: p.id } : p));
    } else {
      const newProduct: Product = { ...formData, id: Math.random().toString(36).substr(2, 9) };
      setProducts([newProduct, ...products]);
    }
    setIsModalOpen(false);
  };

  const confirmImport = () => {
    const newItems: Product[] = importResults.map(item => ({
      id: Math.random().toString(36).substr(2, 9),
      name: (item.name || 'SIN NOMBRE').toUpperCase(),
      priceRetail: item.priceRetail || 0,
      priceWholesale: item.priceWholesale || 0,
      costUsd: 0,
      costBs: 0,
      currency: 'USD',
      material: (item.material || 'MULTI').toUpperCase(),
      description: item.description || '',
      additionalConsiderations: (item.additionalConsiderations || '').toUpperCase(),
      targetAreas: (item.targetAreas || '').toUpperCase(),
      stock: 0,
      category: 'producto',
      storeId: currentStoreId,
      imageUrl: ''
    }));

    setProducts([...newItems, ...products]);
    setImportResults([]);
    setIsImportModalOpen(false);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.material.toLowerCase().includes(searchQuery.toLowerCase());
    const isStoreMatch = p.storeId === 'global' || p.storeId === currentStoreId;
    return matchesSearch && isStoreMatch;
  });

  const exportInventoryCSV = () => {
    const data = products.map(p => ({
      Nombre: p.name,
      Categoria: p.category,
      Material: p.material,
      Precio_Detal: p.priceRetail,
      Precio_Mayor: p.priceWholesale,
      Costo_USD: p.costUsd,
      Stock: p.stock,
      Sede: settings.stores.find(s => s.id === p.storeId)?.name || 'Global'
    }));
    exportToCSV(data, `Inventario_Roxtor_${Date.now()}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 italic">
      {/* OVERLAY DE ESCANEO IA MEJORADO */}
      {isScanning && (
        <div className="fixed inset-0 z-[300] bg-[#000814]/98 backdrop-blur-3xl flex items-center justify-center p-6 italic">
          <div className="flex flex-col items-center max-w-lg w-full space-y-12">
            <div className="relative">
              {/* Círculo de Escaneo Animado */}
              <div className="w-72 h-72 border-4 border-blue-500/20 rounded-full flex items-center justify-center relative overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.1)]">
                <div className="absolute inset-0 bg-blue-500/5 animate-pulse"></div>
                {/* Línea de escaneo láser */}
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_25px_#3b82f6] animate-[scan_2.5s_ease-in-out_infinite]"></div>
                <div className="flex flex-col items-center gap-4">
                  <Cpu size={100} className="text-blue-500 animate-pulse" />
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
              
              {/* Iconos flotantes orbitales */}
              <div className="absolute -top-6 -right-6 bg-[#004ea1] p-5 rounded-3xl shadow-2xl animate-bounce">
                <Scan size={28} className="text-white" />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-emerald-600 p-5 rounded-3xl shadow-2xl animate-pulse">
                <CheckCircle2 size={28} className="text-white" />
              </div>
            </div>

            <div className="text-center space-y-8 w-full">
              <div className="space-y-2">
                <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">
                  ANÁLISIS <span className="text-blue-500">DEEP-VISUAL</span>
                </h3>
                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em] flex items-center justify-center gap-2">
                  <Activity size={12} className="text-blue-400" /> PROCESANDO CATÁLOGO CON REDES NEURONALES
                </p>
              </div>

              {/* Logger de progreso dinámico */}
              <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 space-y-4 shadow-inner">
                <div className="flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-2">
                   <span className="flex items-center gap-2"><Terminal size={12}/> STATUS_LOG</span>
                   <span className="text-blue-400 animate-pulse">EXECUTING...</span>
                </div>
                <div className="h-10 overflow-hidden relative">
                   <p key={scanStep} className="text-white font-black uppercase text-sm italic tracking-wide animate-in slide-in-from-bottom-4 duration-500 absolute w-full text-center">
                     {scanMessages[scanStep]}
                   </p>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-500" 
                    style={{ width: `${scanProgress}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center gap-3">
                  <Zap size={16} className="text-amber-500" />
                  <span className="text-[9px] font-black text-slate-400 uppercase text-left leading-tight">Gemini 3 Flash<br/>Ultra-Fast Engine</span>
                </div>
                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center gap-3">
                  <ShieldCheck size={16} className="text-blue-500" />
                  <span className="text-[9px] font-black text-slate-400 uppercase text-left leading-tight">Data Safety<br/>Verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h3 className="text-4xl font-black text-[#000814] tracking-tighter uppercase leading-none italic">CATÁLOGO MAESTRO</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2 italic">
            <Globe size={14} className="text-[#004ea1]" /> SISTEMA DE INVENTARIO INTELIGENTE • PDF / IMG
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="flex bg-white border-2 border-slate-100 p-1 rounded-2xl mr-2">
            <button 
              onClick={() => setViewMode('catalog')}
              className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${viewMode === 'catalog' ? 'bg-[#000814] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Catálogo
            </button>
            <button 
              onClick={() => setViewMode('profitability')}
              className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${viewMode === 'profitability' ? 'bg-[#000814] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Análisis Costos
            </button>
          </div>
          <button 
            onClick={exportInventoryCSV}
            className="bg-slate-100 text-slate-600 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-slate-200 transition-all shadow-sm"
          >
            <FileUp size={18} /> EXPORTAR CSV
          </button>
          <button 
            onClick={handleShareCatalog}
            className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-emerald-700 shadow-xl border-b-4 border-emerald-800 active:translate-y-1 transition-all"
          >
            <MessageCircle size={18} /> COMPARTIR CATÁLOGO
          </button>
          <input 
            type="file" 
            ref={importInputRef} 
            className="hidden" 
            accept="image/*,application/pdf" 
            onChange={handleImportFile} 
          />
          <input 
            type="file" 
            ref={cameraInputRef} 
            className="hidden" 
            accept="image/*" 
            capture="environment"
            onChange={handleVisualScan} 
          />
          <button 
            onClick={() => cameraInputRef.current?.click()} 
            disabled={isScanning} 
            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-blue-700 shadow-xl border-b-4 border-blue-800 disabled:opacity-50 transition-all group"
          >
            <Camera size={18} className="group-hover:rotate-12 transition-transform" /> 
            {isScanning && isVisualScanning ? 'ESCANEANDO...' : 'ESCANEO VISUAL'}
          </button>
          <button 
            onClick={() => importInputRef.current?.click()} 
            disabled={isScanning} 
            className="relative overflow-hidden bg-rose-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-rose-700 shadow-xl border-b-4 border-rose-800 disabled:opacity-50 transition-all group"
          >
            {isScanning ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} className="group-hover:scale-125 transition-transform" />} 
            {isScanning ? 'ESCANEANDO...' : 'IMPORTAR CATALOGO (IA)'}
          </button>
          <button onClick={() => handleOpenModal()} className="bg-[#000814] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-slate-800 shadow-xl border-b-4 border-slate-600 active:translate-y-1 transition-all">
            <Plus size={18} /> NUEVO PRODUCTO
          </button>
        </div>
      </div>

      {viewMode === 'catalog' ? (
        <div className="bg-white border-4 border-slate-50 rounded-[3.5rem] overflow-hidden shadow-sm">
          <div className="p-8 border-b border-slate-50 flex items-center gap-4 bg-slate-50/30">
            <Search size={22} className="text-[#004ea1]/30" />
            <input type="text" placeholder="Buscar por nombre, tela o recargo..." className="bg-transparent border-none outline-none text-base w-full font-bold placeholder:text-slate-300 italic" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left italic">
              <thead className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-white border-b border-slate-50">
                <tr>
                  <th className="px-10 py-6">VISTA</th>
                  <th className="px-10 py-6">ESPECIFICACIONES DEL PRODUCTO</th>
                  <th className="px-10 py-6">DETAL ($)</th>
                  <th className="px-10 py-6">MAYOR ($)</th>
                  <th className="px-10 py-6">MARGEN (%)</th>
                  <th className="px-10 py-6 text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProducts.map((p, idx) => {
                  const cost = p.costUsd || 0;
                  const marginRetail = p.priceRetail > 0 ? ((p.priceRetail - cost) / p.priceRetail) * 100 : 0;
                  const marginWholesale = p.priceWholesale > 0 ? ((p.priceWholesale - cost) / p.priceWholesale) * 100 : 0;

                  return (
                    <tr key={`${p.id}-${idx}`} className="hover:bg-blue-50/20 transition-all group">
                      <td className="px-10 py-5">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 border-2 border-slate-200 overflow-hidden flex items-center justify-center shadow-sm relative group/img">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon size={20} className="text-slate-300" />
                          )}
                          <div className="absolute inset-0 bg-[#004ea1]/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                            <Edit3 size={14} className="text-white" />
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-5">
                        <div className="max-w-[400px]">
                          <p className="font-black text-slate-800 uppercase text-sm group-hover:text-[#004ea1] transition-colors">{p.name}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 opacity-80">
                             {p.material && (
                               <p className="text-[8px] font-black uppercase text-[#004ea1] flex items-center gap-1">
                                 <Layers size={10}/> {p.material}
                               </p>
                             )}
                             {p.additionalConsiderations && (
                               <p className="text-[8px] font-black uppercase text-rose-600 flex items-center gap-1">
                                 <Zap size={10}/> {p.additionalConsiderations}
                               </p>
                             )}
                             {p.targetAreas && (
                               <p className="text-[8px] font-black uppercase text-emerald-600 flex items-center gap-1">
                                 <Globe size={10}/> {p.targetAreas}
                               </p>
                             )}
                          </div>
                          {p.description && <p className="text-[7px] font-bold text-slate-400 uppercase mt-1 line-clamp-1">{p.description}</p>}
                        </div>
                      </td>
                      <td className="px-10 py-5">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 text-base italic">${p.priceRetail}</span>
                          <span className="text-[8px] font-bold text-slate-400">Bs. {(p.priceRetail * settings.bcvRate).toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="px-10 py-5">
                        <div className="flex flex-col">
                          <span className="font-black text-[#004ea1] text-base italic">${p.priceWholesale}</span>
                          <span className="text-[8px] font-bold text-slate-400">Bs. {(p.priceWholesale * settings.bcvRate).toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="px-10 py-5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${marginRetail > 30 ? 'bg-emerald-500' : marginRetail > 15 ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                            <span className="text-[10px] font-black italic">DETAL: {marginRetail.toFixed(1)}%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${marginWholesale > 20 ? 'bg-emerald-500' : marginWholesale > 10 ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                            <span className="text-[10px] font-black italic text-[#004ea1]">MAYOR: {marginWholesale.toFixed(1)}%</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-5 text-right">
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenModal(p)} className="p-3 bg-white border-2 border-slate-100 text-slate-400 hover:text-[#004ea1] rounded-2xl transition-all shadow-sm"><Edit3 size={18} /></button>
                          <button onClick={() => confirm('¿Eliminar registro?') && setProducts(products.filter(item => item.id !== p.id))} className="p-3 bg-white border-2 border-slate-100 text-slate-200 hover:text-red-500 rounded-2xl transition-all shadow-sm"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-10 shadow-sm space-y-8">
              <div className="flex items-center justify-between">
                <h4 className="text-2xl font-black text-[#000814] uppercase italic tracking-tighter">Estructura de Rentabilidad</h4>
                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl">
                  <Activity size={16} className="text-[#004ea1]" />
                  <span className="text-[10px] font-black text-slate-400 uppercase italic">Tasa BCV: Bs. {settings.bcvRate}</span>
                </div>
              </div>

              <div className="space-y-4">
                {filteredProducts.map((p, idx) => {
                  const cost = p.costUsd || 0;
                  const profitRetail = p.priceRetail - cost;
                  const profitWholesale = p.priceWholesale - cost;
                  const marginRetail = p.priceRetail > 0 ? (profitRetail / p.priceRetail) * 100 : 0;

                  return (
                    <div key={`profit-${p.id}-${idx}`} className="p-6 bg-slate-50/50 border-2 border-slate-100 rounded-3xl hover:border-blue-200 transition-all group">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm font-black text-[#004ea1] italic">
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-slate-800 uppercase italic text-sm">{p.name}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase italic">Costo: ${cost.toFixed(2)} / Bs. {(cost * settings.bcvRate).toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-emerald-600 uppercase italic">Utilidad Detal</p>
                          <p className="text-xl font-black text-[#000814] italic tracking-tighter">+${profitRetail.toFixed(2)}</p>
                        </div>
                      </div>

                      {p.costBreakdown && p.costBreakdown.length > 0 && (
                        <div className="mb-4 flex flex-wrap gap-2">
                          {p.costBreakdown.map(c => (
                            <div key={c.id} className="px-3 py-1 bg-white rounded-lg border border-slate-100 text-[8px] font-black uppercase italic text-slate-500">
                              {c.name}: <span className="text-[#004ea1]">${c.amountUsd}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-slate-100">
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-[8px] font-black text-slate-400 uppercase italic">Margen Detal</span>
                            <span className={`text-xs font-black italic ${marginRetail > 30 ? 'text-emerald-600' : 'text-amber-600'}`}>{marginRetail.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-1000 ${marginRetail > 30 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(marginRetail, 100)}%` }}></div>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100">
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-[8px] font-black text-slate-400 uppercase italic">Utilidad Mayor</span>
                            <span className="text-xs font-black italic text-[#004ea1]">+${profitWholesale.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {[1,2,3,4,5].map(i => (
                              <div key={`profit-bar-${p.id}-${i}`} className={`flex-1 h-1.5 rounded-full ${i <= (profitWholesale / 5) ? 'bg-[#004ea1]' : 'bg-slate-100'}`}></div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-[#000814] rounded-[3rem] p-10 text-white space-y-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative z-10 space-y-6">
                <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center">
                  <DollarSign size={32} className="text-blue-400" />
                </div>
                <div>
                  <h4 className="text-2xl font-black uppercase italic tracking-tighter">Resumen de Ganancias</h4>
                  <p className="text-[10px] font-bold text-slate-500 uppercase italic tracking-widest">Promedio de Margen Operativo</p>
                </div>
                
                <div className="space-y-6 pt-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase italic">Margen Promedio</p>
                      <p className="text-4xl font-black italic tracking-tighter">
                        {(filteredProducts.reduce((acc, p) => acc + (p.priceRetail > 0 ? ((p.priceRetail - (p.costUsd || 0)) / p.priceRetail) * 100 : 0), 0) / (filteredProducts.length || 1)).toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-500 uppercase italic">Total Items</p>
                      <p className="text-xl font-black italic">{filteredProducts.length}</p>
                    </div>
                  </div>
                  
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                    <p className="text-[9px] font-black text-blue-400 uppercase italic mb-4 flex items-center gap-2">
                      <Zap size={12}/> Sugerencia de Auditoría
                    </p>
                    <p className="text-[10px] font-bold text-slate-300 uppercase italic leading-relaxed">
                      Mantén tus márgenes por encima del 35% para cubrir gastos operativos y logística. Los productos con margen menor al 15% requieren revisión de precios inmediata.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#000814]/80 backdrop-blur-xl animate-in fade-in">
          <div className="bg-white w-full max-w-4xl rounded-[4rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border-8 border-white/20">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-[#000814] text-white rounded-3xl flex items-center justify-center shadow-xl rotate-3"><Package size={28}/></div>
                <div>
                  <h4 className="text-3xl font-black text-[#000814] uppercase tracking-tighter italic leading-none">{editingProduct ? 'EDITAR PRODUCTO' : 'NUEVO REGISTRO'}</h4>
                  <p className="text-[10px] font-bold text-[#004ea1] uppercase tracking-[0.2em] mt-2 italic">Control de Telas y Recargos Especiales</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center text-slate-300 hover:text-red-500 transition-all shadow-md"><X size={24} /></button>
            </div>
            <div className="p-10 overflow-y-auto space-y-10 flex-1 bg-white italic">
               <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                  <div className="md:col-span-5 space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Miniatura de Catálogo</label>
                    <div onClick={() => !isUploading && fileInputRef.current?.click()} className={`aspect-square bg-slate-50 border-4 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center relative group overflow-hidden cursor-pointer hover:border-[#004ea1]/30 transition-all ${isUploading ? 'opacity-50 cursor-wait' : ''}`}>
                       {isUploading ? (
                         <div className="text-center animate-pulse">
                           <Loader2 size={60} className="mx-auto mb-4 animate-spin text-[#004ea1]" />
                           <p className="text-[11px] font-black uppercase">Subiendo...</p>
                         </div>
                       ) : formData.imageUrl ? (
                         <img src={formData.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                       ) : (
                         <div className="text-center opacity-30 group-hover:opacity-50 transition-opacity">
                           <Camera size={60} className="mx-auto mb-4" />
                           <p className="text-[11px] font-black uppercase">Subir Foto</p>
                         </div>
                       )}
                       {!isUploading && (
                         <div className="absolute inset-0 bg-[#000814]/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white gap-3 transition-all backdrop-blur-sm">
                           <Upload size={32} />
                           <span className="text-[10px] font-black uppercase tracking-widest">CAMBIAR IMAGEN</span>
                         </div>
                       )}
                       <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    </div>
                  </div>
                  <div className="md:col-span-7 space-y-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre del Item</label>
                        <input type="text" className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-5 text-slate-800 font-black focus:bg-white focus:border-[#004ea1]/20 outline-none transition-all uppercase italic text-lg" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="EJ: FRANELA MICRODURAZNO" />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Moneda Base</label>
                        <div className="flex bg-slate-100 p-1 rounded-2xl">
                          <button 
                            onClick={() => setFormData({...formData, currency: 'USD'})}
                            className={`px-6 py-4 rounded-xl font-black text-xs transition-all ${formData.currency === 'USD' ? 'bg-[#000814] text-white shadow-lg' : 'text-slate-400'}`}
                          >
                            USD $
                          </button>
                          <button 
                            onClick={() => setFormData({...formData, currency: 'BS'})}
                            className={`px-6 py-4 rounded-xl font-black text-xs transition-all ${formData.currency === 'BS' ? 'bg-[#000814] text-white shadow-lg' : 'text-slate-400'}`}
                          >
                            BS.
                          </button>
                        </div>
                      </div>
                    </div>

                      <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#004ea1] text-white rounded-xl flex items-center justify-center shadow-lg"><Activity size={20}/></div>
                            <h5 className="text-sm font-black text-[#000814] uppercase italic">Estructura de Costos y Margen</h5>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                const laborCost = (formData.estimatedLaborMinutes || 0) / 60 * 1.25; // Usando $1.25/h como base ($50/semana)
                                const newComp = { id: Math.random().toString(36).substr(2, 9), name: 'MANO DE OBRA (EST)', amountUsd: Number(laborCost.toFixed(2)) };
                                setFormData({
                                  ...formData,
                                  costBreakdown: [...(formData.costBreakdown || []), newComp]
                                });
                              }}
                              className="text-[9px] font-black text-emerald-600 uppercase italic bg-white px-4 py-2 rounded-xl border-2 border-slate-100 hover:border-emerald-500/30 transition-all flex items-center gap-2"
                              title="Calcula costo basado en $1.25/hora"
                            >
                              <Calculator size={14}/> Calcular M.O.
                            </button>
                            <button 
                              onClick={addCostComponent}
                              className="text-[9px] font-black text-[#004ea1] uppercase italic bg-white px-4 py-2 rounded-xl border-2 border-slate-100 hover:border-[#004ea1]/30 transition-all flex items-center gap-2"
                            >
                              <Plus size={14}/> Añadir Componente
                            </button>
                          </div>
                        </div>
                        
                        {/* DESGLOSE DE COSTOS */}
                        <div className="space-y-3">
                          {(formData.costBreakdown || []).map((comp) => (
                            <div key={comp.id} className="flex gap-3 animate-in slide-in-from-left-2">
                              <input 
                                type="text" 
                                placeholder="EJ: MANO DE OBRA, TELA, HILOS..." 
                                className="flex-1 bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-[10px] font-black uppercase outline-none focus:border-[#004ea1]/30 transition-all shadow-sm"
                                value={comp.name}
                                onChange={(e) => updateCostComponent(comp.id, 'name', e.target.value)}
                              />
                              <div className="w-32 relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">$</span>
                                <input 
                                  type="number" 
                                  className="w-full bg-white border-2 border-slate-200 rounded-xl pl-7 pr-4 py-3 text-[10px] font-black outline-none focus:border-[#004ea1]/30 transition-all shadow-sm"
                                  value={comp.amountUsd}
                                  onChange={(e) => updateCostComponent(comp.id, 'amountUsd', parseFloat(e.target.value) || 0)}
                                />
                              </div>
                              <button 
                                onClick={() => removeCostComponent(comp.id)}
                                className="p-3 text-slate-300 hover:text-rose-500 transition-colors"
                              >
                                <X size={16}/>
                              </button>
                            </div>
                          ))}
                          {(formData.costBreakdown || []).length === 0 && (
                            <p className="text-[9px] font-bold text-slate-400 uppercase italic text-center py-4 bg-white/50 rounded-2xl border-2 border-dashed border-slate-100">
                              No hay desglose de costos. Define los componentes para un cálculo exacto.
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-200">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Costo Total ($)</label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400">$</span>
                              <input 
                                type="number" 
                                className="w-full bg-white border-2 border-slate-200 rounded-xl pl-10 pr-5 py-4 text-slate-800 font-black outline-none focus:border-[#004ea1]/30 transition-all shadow-sm text-xl" 
                                value={formData.costUsd} 
                                readOnly={(formData.costBreakdown || []).length > 0}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setFormData({...formData, costUsd: val, costBs: Number((val * settings.bcvRate).toFixed(2))});
                                }} 
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Costo Total (Bs.)</label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400">Bs.</span>
                              <input 
                                type="number" 
                                className="w-full bg-white border-2 border-slate-200 rounded-xl pl-12 pr-5 py-4 text-slate-800 font-black outline-none focus:border-[#004ea1]/30 transition-all shadow-sm text-xl" 
                                value={formData.costBs} 
                                readOnly={(formData.costBreakdown || []).length > 0}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setFormData({...formData, costBs: val, costUsd: Number((val / settings.bcvRate).toFixed(2))});
                                }} 
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-rose-600 uppercase tracking-widest ml-1 italic">Comp. Bordado ($)</label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-rose-400">$</span>
                              <input 
                                type="number" 
                                className="w-full bg-rose-50 border-2 border-rose-100 rounded-xl pl-10 pr-5 py-4 text-rose-600 font-black outline-none focus:border-rose-300 transition-all shadow-sm text-xl" 
                                value={formData.embroideryPriceComponent} 
                                onChange={(e) => setFormData({...formData, embroideryPriceComponent: parseFloat(e.target.value) || 0})} 
                              />
                            </div>
                            <p className="text-[8px] text-slate-400 italic px-1">Monto del precio que es bordado (para comisiones).</p>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1 italic">Tiempo Laboral (min)</label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-blue-400"><Clock size={20}/></span>
                              <input 
                                type="number" 
                                className="w-full bg-blue-50 border-2 border-blue-100 rounded-xl pl-12 pr-5 py-4 text-blue-600 font-black outline-none focus:border-blue-300 transition-all shadow-sm text-xl" 
                                value={formData.estimatedLaborMinutes} 
                                onChange={(e) => setFormData({...formData, estimatedLaborMinutes: parseInt(e.target.value) || 0})} 
                              />
                            </div>
                            <p className="text-[8px] text-slate-400 italic px-1">Minutos estimados de trabajo por unidad.</p>
                          </div>
                        </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                          <p className="text-[9px] font-black text-slate-400 uppercase italic mb-1">Margen Detal</p>
                          <p className={`text-2xl font-black italic ${formData.priceRetail > (formData.costUsd || 0) ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formData.priceRetail > 0 ? (((formData.priceRetail - (formData.costUsd || 0)) / formData.priceRetail) * 100).toFixed(1) : '0.0'}%
                          </p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                          <p className="text-[9px] font-black text-slate-400 uppercase italic mb-1">Margen Mayor</p>
                          <p className={`text-2xl font-black italic ${formData.priceWholesale > (formData.costUsd || 0) ? 'text-[#004ea1]' : 'text-rose-600'}`}>
                            {formData.priceWholesale > 0 ? (((formData.priceWholesale - (formData.costUsd || 0)) / formData.priceWholesale) * 100).toFixed(1) : '0.0'}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Precio Detal {formData.currency === 'USD' ? '($)' : '(Bs.)'}</label>
                         <input 
                           type="number" 
                           className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-5 py-4 text-slate-800 font-black outline-none focus:bg-white transition-all shadow-sm text-xl" 
                           value={formData.currency === 'USD' ? formData.priceRetail : Number((formData.priceRetail * settings.bcvRate).toFixed(2))} 
                           onChange={(e) => {
                             const val = parseFloat(e.target.value) || 0;
                             const finalUsd = formData.currency === 'USD' ? val : val / settings.bcvRate;
                             setFormData({...formData, priceRetail: Number(finalUsd.toFixed(2))});
                           }} 
                         />
                         {formData.currency === 'BS' && <p className="text-[9px] font-bold text-slate-400 ml-1 italic">Equivalente: ${formData.priceRetail.toFixed(2)}</p>}
                         {formData.currency === 'USD' && <p className="text-[9px] font-bold text-slate-400 ml-1 italic">Equivalente: Bs. {(formData.priceRetail * settings.bcvRate).toFixed(2)}</p>}
                       </div>
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-[#004ea1] uppercase tracking-widest ml-1">Precio Mayor {formData.currency === 'USD' ? '($)' : '(Bs.)'}</label>
                         <input 
                           type="number" 
                           className="w-full bg-slate-50 border-2 border-[#004ea1]/10 rounded-xl px-5 py-4 text-[#004ea1] font-black outline-none focus:bg-white transition-all shadow-sm text-xl" 
                           value={formData.currency === 'USD' ? formData.priceWholesale : Number((formData.priceWholesale * settings.bcvRate).toFixed(2))} 
                           onChange={(e) => {
                             const val = parseFloat(e.target.value) || 0;
                             const finalUsd = formData.currency === 'USD' ? val : val / settings.bcvRate;
                             setFormData({...formData, priceWholesale: Number(finalUsd.toFixed(2))});
                           }} 
                         />
                         {formData.currency === 'BS' && <p className="text-[9px] font-bold text-slate-400 ml-1 italic">Equivalente: ${formData.priceWholesale.toFixed(2)}</p>}
                         {formData.currency === 'USD' && <p className="text-[9px] font-bold text-slate-400 ml-1 italic">Equivalente: Bs. {(formData.priceWholesale * settings.bcvRate).toFixed(2)}</p>}
                       </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1 italic flex items-center gap-2">
                          <Globe size={14}/> Área o Uso Dirigido
                        </label>
                        <input 
                          type="text" 
                          className="w-full bg-emerald-50/30 border-2 border-emerald-100 rounded-2xl px-6 py-4 text-slate-800 font-bold focus:bg-white focus:border-emerald-200 outline-none transition-all uppercase italic" 
                          placeholder="EJ: USO PERSONAL, DEPORTES, COLEGIOS, EMPRESAS" 
                          value={formData.targetAreas || ''} 
                          onChange={(e) => setFormData({...formData, targetAreas: e.target.value})} 
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-[#004ea1] uppercase tracking-widest ml-1 italic flex items-center gap-2">
                          <Layers size={14}/> Tela / Composición
                        </label>
                        <input 
                          type="text" 
                          className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-slate-800 font-bold focus:bg-white focus:border-slate-200 outline-none transition-all uppercase italic" 
                          value={formData.material} 
                          onChange={(e) => setFormData({...formData, material: e.target.value})} 
                          placeholder="EJ: ALGODÓN 100% / LINO" 
                        />
                      </div>
                    </div>
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-4"><label className="text-[10px] font-black text-rose-600 uppercase tracking-widest ml-1 italic flex items-center gap-2"><Zap size={14}/> Recargos y Tallas Especiales</label><textarea className="w-full bg-rose-50/30 border-2 border-rose-100 rounded-[2rem] px-8 py-6 text-slate-800 font-bold focus:bg-white focus:border-rose-200 outline-none h-32 resize-none transition-all uppercase italic" placeholder="EJ: +3$ TALLAS 2XL-4XL, +$5 DISEÑO ADICIONAL" value={formData.additionalConsiderations} onChange={(e) => setFormData({...formData, additionalConsiderations: e.target.value})} /></div>
                 <div className="space-y-4"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic flex items-center gap-2"><StickyNote size={14}/> Notas de Catálogo</label><textarea className="w-full bg-slate-50 border-2 border-transparent rounded-[2rem] px-8 py-6 text-slate-800 font-bold focus:bg-white focus:border-blue-100 outline-none h-32 resize-none transition-all uppercase italic" placeholder="Instrucciones para vendedores..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} /></div>
               </div>
            </div>
            <div className="p-10 border-t border-slate-50 flex justify-end bg-slate-50/50 italic"><button onClick={handleSave} className="bg-[#000814] text-white px-16 py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-slate-800 shadow-2xl transition-all active:scale-95 flex items-center gap-3 border-b-8 border-slate-900"><Save size={20} /> GUARDAR REGISTRO</button></div>
          </div>
        </div>
      )}

      {isImportModalOpen && (
        <div className="fixed inset-0 z-[60] bg-[#000814]/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in zoom-in-95 duration-300 italic">
           <div className="bg-white w-full max-w-6xl rounded-[4rem] shadow-2xl flex flex-col max-h-[90vh] border-8 border-white/20">
              <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-rose-600 text-white rounded-3xl flex items-center justify-center shadow-xl animate-pulse">
                    <FileSearch size={32}/>
                  </div>
                  <div>
                    <h4 className="text-3xl font-black text-[#000814] uppercase tracking-tighter italic leading-none">Editor de Extracción IA</h4>
                    <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mt-2 italic flex items-center gap-2">
                      <AlertCircle size={14}/> MODIFIQUE INDIVIDUALMENTE LOS DATOS ANTES DE INTEGRAR
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsImportModalOpen(false)} className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all shadow-sm"><X size={24}/></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50 space-y-6">
                {importResults.map((item, idx) => (
                  <div key={`import-${idx}-${item.name}`} className="bg-white border-2 border-slate-100 rounded-[3rem] p-8 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 hover:border-rose-200 transition-all relative group">
                    <div className="absolute top-4 right-4"><button onClick={() => setImportResults(importResults.filter((_, i) => i !== idx))} className="text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={20}/></button></div>
                    
                    <div className="md:col-span-4 space-y-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase italic">Identificación del Producto</label>
                      <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[12px] font-black uppercase outline-none focus:bg-white focus:border-rose-300" value={item.name} onChange={(e) => { const updated = [...importResults]; updated[idx].name = e.target.value; setImportResults(updated); }} />
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase italic">Detal ($)</label>
                      <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[12px] font-black outline-none focus:bg-white" value={item.priceRetail} onChange={(e) => { const updated = [...importResults]; updated[idx].priceRetail = parseFloat(e.target.value) || 0; setImportResults(updated); }} />
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[8px] font-black text-[#004ea1] uppercase italic">Mayor ($)</label>
                      <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[12px] font-black outline-none focus:bg-white" value={item.priceWholesale} onChange={(e) => { const updated = [...importResults]; updated[idx].priceWholesale = parseFloat(e.target.value) || 0; setImportResults(updated); }} />
                    </div>

                    <div className="md:col-span-4 space-y-1">
                      <label className="text-[8px] font-black text-[#004ea1] uppercase italic">Tela / Material</label>
                      <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[12px] font-black uppercase outline-none focus:bg-white" value={item.material} onChange={(e) => { const updated = [...importResults]; updated[idx].material = e.target.value; setImportResults(updated); }} />
                    </div>

                    <div className="md:col-span-12 space-y-1">
                      <label className="text-[8px] font-black text-emerald-600 uppercase italic">Área o Uso Dirigido</label>
                      <input type="text" className="w-full bg-emerald-50/50 border border-emerald-100 rounded-xl px-4 py-3 text-[12px] font-black uppercase outline-none focus:bg-white focus:border-emerald-300" value={item.targetAreas} onChange={(e) => { const updated = [...importResults]; updated[idx].targetAreas = e.target.value; setImportResults(updated); }} />
                    </div>

                    <div className="md:col-span-12 space-y-1">
                      <label className="text-[8px] font-black text-rose-600 uppercase italic">Recargos Detectados (2XL, Diseño, Bordado...)</label>
                      <input type="text" className="w-full bg-rose-50/50 border border-rose-100 rounded-xl px-4 py-3 text-[12px] font-black uppercase outline-none focus:bg-white focus:border-rose-300" value={item.additionalConsiderations} onChange={(e) => { const updated = [...importResults]; updated[idx].additionalConsiderations = e.target.value; setImportResults(updated); }} />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-10 bg-white border-t border-slate-200 flex justify-between items-center italic">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center font-black">{importResults.length}</div>
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest">PRODUCTOS LISTOS</p>
                </div>
                <button onClick={confirmImport} className="bg-emerald-600 text-white px-16 py-6 rounded-3xl font-black uppercase text-[12px] tracking-widest shadow-2xl hover:bg-emerald-700 transition-all flex items-center gap-4 border-b-8 border-emerald-800">
                  <CheckCircle2 size={24} /> INTEGRAR AL INVENTARIO
                </button>
              </div>
           </div>
        </div>
      )}
      
      {/* ESTILOS DE ANIMACIÓN PARA EL ESCANEO */}
      <style>{`
        @keyframes scan {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(288px); }
        }
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};

export default Inventory;
