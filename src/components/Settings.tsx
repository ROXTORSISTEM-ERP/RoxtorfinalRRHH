
import React, { useRef, useState, useEffect } from 'react';
import { AppSettings, StoreConfig, SalesGoal, Agent } from '../types';
import { 
  Shield, 
  Building2, 
  Upload, 
  Camera, 
  MapPin, 
  Smartphone, 
  Phone, 
  Download, 
  FileUp, 
  RefreshCw, 
  CheckCircle, 
  Key, 
  Globe, 
  Link2, 
  Terminal, 
  Settings2, 
  Wallet, 
  X, 
  Lock, 
  Wifi, 
  Database, 
  CloudCheck, 
  AlertCircle, 
  Image as ImageIcon,
  Quote,
  Sparkles,
  Target,
  Plus,
  Trash2,
  Calendar,
  Zap,
  Clock,
  TrendingUp,
  MessageSquare,
  Key as KeyIcon,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

interface Props {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  agents: Agent[];
  onResetOrders?: () => void;
  onResetExpenses?: () => void;
  onResetAll?: () => void;
}

const Settings: React.FC<Props> = ({ settings, setSettings, agents, onResetOrders, onResetExpenses, onResetAll }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aboutMedia1Ref = useRef<HTMLInputElement>(null);
  const aboutMedia2Ref = useRef<HTMLInputElement>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUploadingAbout, setIsUploadingAbout] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [logoStatus, setLogoStatus] = useState<'local' | 'cloud' | 'none'>('none');

  useEffect(() => {
    if (settings.logoUrl) {
      setLogoStatus(settings.cloudSync?.enabled ? 'cloud' : 'local');
    } else {
      setLogoStatus('none');
    }
  }, [settings.logoUrl, settings.cloudSync?.enabled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setSettings(prev => ({
      ...prev,
      whatsappConfig: {
        ...(prev.whatsappConfig || {
          enabled: false,
          accessToken: '',
          phoneNumberId: '',
          businessAccountId: '',
          verifyToken: 'roxtor_verify_token'
        }),
        [name]: val
      }
    }));
  };

  const handleStoreConfigChange = (storeId: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      stores: prev.stores.map(s => s.id === storeId ? { ...s, [field]: value } : s)
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400; 
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const optimizedUrl = canvas.toDataURL('image/webp', 0.8);
        setSettings(prev => ({ ...prev, logoUrl: optimizedUrl }));
        setLogoStatus('local');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const testCloudConnection = () => {
    if (!settings.cloudSync?.apiUrl || !settings.cloudSync?.apiKey) {
      alert("⚠️ Error: Faltan credenciales de Supabase.");
      return;
    }
    setIsSyncing(true);
    window.dispatchEvent(new CustomEvent('forceCloudPush'));
    setTimeout(() => {
      setIsSyncing(false);
      setLogoStatus('cloud');
      alert("✅ ¡Sincronización Exitosa!");
    }, 2000);
  };

  const handleAddGoal = () => {
    const newGoal: SalesGoal = {
      id: Math.random().toString(36).substr(2, 9),
      month: new Date().toISOString().slice(0, 7),
      targetAmountUsd: 0,
      description: ''
    };
    setSettings(prev => ({
      ...prev,
      salesGoals: [...(prev.salesGoals || []), newGoal]
    }));
  };

  const handleUpdateGoal = (id: string, field: keyof SalesGoal, value: any) => {
    setSettings(prev => ({
      ...prev,
      salesGoals: (prev.salesGoals || []).map(g => g.id === id ? { ...g, [field]: value } : g)
    }));
  };

  const handleRemoveGoal = (id: string) => {
    setSettings(prev => ({
      ...prev,
      salesGoals: (prev.salesGoals || []).filter(g => g.id !== id)
    }));
  };

  const handleAddInvestment = () => {
    const newInv = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      amountUsd: 0,
      date: new Date().toISOString().split('T')[0],
      expectedMonthlyRevenueUsd: 0
    };
    setSettings(prev => ({
      ...prev,
      investments: [...(prev.investments || []), newInv]
    }));
  };

  const handleUpdateInvestment = (id: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      investments: (prev.investments || []).map(inv => inv.id === id ? { ...inv, [field]: value } : inv)
    }));
  };

  const handleRemoveInvestment = (id: string) => {
    setSettings(prev => ({
      ...prev,
      investments: (prev.investments || []).filter(inv => inv.id !== id)
    }));
  };

  const handleAboutMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAbout(index);
    try {
      let finalFile: File | Blob = file;
      const isVideo = file.type.startsWith('video/');

      if (!isVideo && file.type.startsWith('image/')) {
        // Importar dinámicamente para evitar problemas de carga
        const { compressImage } = await import('../utils/storage');
        finalFile = await compressImage(file);
      }

      // Si hay configuración de la nube, subir directo a Supabase
      if (settings.cloudSync?.enabled && settings.cloudSync.provider === 'supabase') {
        const { uploadToSupabaseStorage } = await import('../utils/storage');
        const extension = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
        const fileName = `about_${index}_${Date.now()}.${extension}`;
        
        const url = await uploadToSupabaseStorage(
          finalFile, 
          'public_assets', 
          fileName, 
          { apiUrl: settings.cloudSync.apiUrl, apiKey: settings.cloudSync.apiKey }
        );
        
        if (url) {
          const newImages = [...(settings.landingConfig?.aboutUsImages || ['', ''])];
          newImages[index] = url;
          setSettings(prev => ({
            ...prev,
            landingConfig: { ...prev.landingConfig, aboutUsImages: newImages }
          }));
          setIsUploadingAbout(null);
          return;
        }
      }

      // Fallback a base64 si no hay nube o falla la subida
      if (file.size > 2 * 1024 * 1024 && !settings.cloudSync?.enabled) {
        alert("⚠️ El archivo es muy grande (>2MB). Se recomienda activar la sincronización en la nube (Supabase) para archivos pesados o videos.");
      }

      const reader = new FileReader();
      reader.onload = () => {
        const newImages = [...(settings.landingConfig?.aboutUsImages || ['', ''])];
        newImages[index] = reader.result as string;
        setSettings(prev => ({
          ...prev,
          landingConfig: { ...prev.landingConfig, aboutUsImages: newImages }
        }));
        setIsUploadingAbout(null);
      };
      reader.readAsDataURL(finalFile);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Error al subir el archivo.");
      setIsUploadingAbout(null);
    }
  };

  const exportMasterData = () => {
    setIsSyncing(true);
    try {
      const fullData = {
        products: JSON.parse(localStorage.getItem('erp_products') || '[]'),
        orders: JSON.parse(localStorage.getItem('erp_orders') || '[]'),
        agents: JSON.parse(localStorage.getItem('erp_agents') || '[]'),
        workshops: JSON.parse(localStorage.getItem('erp_workshops') || '[]'),
        settings: settings,
        exportDate: new Date().toISOString(),
        keyCheck: settings.encryptionKey,
      };
      const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `RESPALDO_ROXTOR_MASTER_${new Date().getTime()}.json`;
      link.click();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (e) {
      alert("Error al generar el respaldo.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleAccountingPermission = (agentId: string) => {
    const currentPermissions = settings.accountingPermissions || [];
    const newPermissions = currentPermissions.includes(agentId)
      ? currentPermissions.filter(id => id !== agentId)
      : [...currentPermissions, agentId];
    
    setSettings(prev => ({
      ...prev,
      accountingPermissions: newPermissions
    }));
  };

  const handleFiscalDataChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      fiscalData: {
        ...(prev.fiscalData || { legalName: '', rif: '', fiscalAddress: '', partners: [] }),
        [field]: value
      }
    }));
  };

  const handleAddPartner = () => {
    const partners = settings.fiscalData?.partners || [];
    handleFiscalDataChange('partners', [...partners, { name: '', percentage: 0 }]);
  };

  const handleUpdatePartner = (index: number, field: string, value: any) => {
    const partners = [...(settings.fiscalData?.partners || [])];
    partners[index] = { ...partners[index], [field]: value };
    handleFiscalDataChange('partners', partners);
  };

  const handleRemovePartner = (index: number) => {
    const partners = (settings.fiscalData?.partners || []).filter((_, i) => i !== index);
    handleFiscalDataChange('partners', partners);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700 italic">
      
      <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-8 md:p-12 shadow-sm space-y-10">
        <div className="flex justify-between items-center">
          <SectionHeader icon={<Building2 size={24}/>} title="IDENTIDAD DE MARCA" subtitle="Define la personalidad de tu negocio" />
          <button onClick={() => setShowGuide(true)} className="bg-slate-50 text-slate-400 p-4 rounded-2xl hover:bg-[#000814] hover:text-white transition-all group">
            <Terminal size={20} className="group-hover:animate-pulse" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-4 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#004ea1] uppercase tracking-widest ml-1 italic flex justify-between">
                Logo Principal
                {logoStatus === 'local' && <span className="text-amber-500 flex items-center gap-1"><AlertCircle size={10}/> SOLO LOCAL</span>}
                {logoStatus === 'cloud' && <span className="text-emerald-500 flex items-center gap-1"><CloudCheck size={10}/> EN LA NUBE</span>}
              </label>
              <div className="aspect-square bg-slate-50 border-4 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center relative group overflow-hidden shadow-inner">
                 {settings.logoUrl ? (
                   <div className="w-full h-full p-6 flex items-center justify-center relative">
                      <img src={settings.logoUrl} className="max-w-full max-h-full object-contain drop-shadow-md" alt="Preview" />
                      {logoStatus === 'local' && (
                        <div className="absolute top-4 right-4 bg-amber-500 text-white p-2 rounded-full shadow-lg animate-pulse">
                          <RefreshCw size={14} />
                        </div>
                      )}
                   </div>
                 ) : (
                   <div className="text-center opacity-30 group-hover:opacity-50 transition-opacity">
                     <ImageIcon size={48} className="mx-auto mb-2 text-slate-300" />
                     <p className="text-[10px] font-black uppercase">Subir Logo</p>
                   </div>
                 )}
                 <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-[#004ea1]/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white gap-2 transition-all backdrop-blur-sm">
                   <Upload size={24} />
                   <span className="text-[10px] font-black uppercase tracking-widest">Cambiar Imagen</span>
                 </button>
                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
              </div>
            </div>

            {/* PREVIEW DE CABECERA */}
            <div className="bg-[#000814] p-6 rounded-[2rem] border-2 border-white/5 space-y-4 shadow-xl">
               <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest text-center italic">Vista Previa de Identidad</p>
               <div className="flex flex-col items-center text-center gap-2">
                 <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white font-black italic">
                   {settings.logoUrl ? <img src={settings.logoUrl} className="w-full h-full object-contain p-1" /> : 'R'}
                 </div>
                 <div>
                    <h5 className="text-white font-black text-sm uppercase leading-none tracking-tighter italic">{settings.businessName || 'Tu Empresa'}</h5>
                    <p className="text-rose-500 font-bold text-[8px] uppercase tracking-widest italic mt-1">{settings.slogan || 'Tu Eslogan Aquí'}</p>
                 </div>
               </div>
            </div>
          </div>

          <div className="md:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputGroup 
                label="Nombre Comercial" 
                name="businessName" 
                value={settings.businessName} 
                onChange={handleChange} 
                icon={<Building2 size={14}/>}
              />
              <InputGroup 
                label="Eslogan de Marca" 
                name="slogan" 
                value={settings.slogan} 
                onChange={handleChange} 
                placeholder="Ej: Personalización Profesional" 
                icon={<Quote size={14} className="text-rose-500" />}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3 w-full">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Teléfono Corporativo</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#004ea1] font-black">+58</span>
                  <input name="companyPhone" value={settings.companyPhone?.replace('+58', '') || ''} onChange={(e) => setSettings({...settings, companyPhone: `+58${e.target.value.replace(/\D/g, '')}`})} className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 pl-12 text-slate-800 font-bold focus:bg-white focus:border-[#004ea1]/20 outline-none transition-all" placeholder="424 1234567" />
                </div>
              </div>
              <InputGroup 
                label="Instagram" 
                name="instagram" 
                value={settings.instagram} 
                onChange={handleChange} 
                prefix="@" 
                icon={<ImageIcon size={14}/>}
              />
            </div>

            <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic flex items-center gap-2">
                 <Sparkles size={12} className="text-emerald-500" /> Tono del Asistente Vozify AI
               </label>
               <select 
                 name="preferredTone" 
                 value={settings.preferredTone} 
                 onChange={handleChange}
                 className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 text-slate-800 font-bold focus:bg-white focus:border-emerald-200 outline-none transition-all uppercase italic"
               >
                  <option value="cercano">CERCANO (AMABLE/TÚ)</option>
                  <option value="profesional">PROFESIONAL (USTED)</option>
                  <option value="entusiasta">ENTUSIASTA (VENTAS)</option>
                  <option value="casual">CASUAL (RELAJADO)</option>
               </select>
               <p className="text-[8px] font-bold text-slate-400 uppercase italic ml-2">El eslogan se usará automáticamente en las despedidas de audio.</p>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic flex items-center gap-2">
                <ImageIcon size={12} className="text-rose-500" /> Multimedia Sección "Nosotros" (About Us)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* MEDIA 1 */}
                <div className="space-y-3">
                  <label className="text-[8px] font-bold text-slate-400 uppercase italic">Media 1 (Equipo / Reel)</label>
                  <div className="aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden relative group">
                    {settings.landingConfig?.aboutUsImages?.[0] ? (
                      settings.landingConfig.aboutUsImages[0].includes('video') || settings.landingConfig.aboutUsImages[0].startsWith('data:video') ? (
                        <video src={settings.landingConfig.aboutUsImages[0]} className="w-full h-full object-cover" muted loop autoPlay />
                      ) : (
                        <img src={settings.landingConfig.aboutUsImages[0]} className="w-full h-full object-cover" alt="About 1" />
                      )
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                        <ImageIcon size={32} />
                        <p className="text-[8px] font-black uppercase mt-2">Sin Media</p>
                      </div>
                    )}
                    <button 
                      onClick={() => aboutMedia1Ref.current?.click()}
                      disabled={isUploadingAbout === 0}
                      className="absolute inset-0 bg-[#004ea1]/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white gap-2 transition-all backdrop-blur-sm"
                    >
                      {isUploadingAbout === 0 ? <RefreshCw className="animate-spin" size={24} /> : <Upload size={24} />}
                      <span className="text-[9px] font-black uppercase tracking-widest">{isUploadingAbout === 0 ? 'Subiendo...' : 'Cargar Imagen/Reel'}</span>
                    </button>
                    <input type="file" ref={aboutMedia1Ref} className="hidden" accept="image/*,video/*" onChange={(e) => handleAboutMediaUpload(e, 0)} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="O pega URL aquí"
                    value={settings.landingConfig?.aboutUsImages?.[0] || ''}
                    onChange={(e) => {
                      const newImages = [...(settings.landingConfig?.aboutUsImages || ['', ''])];
                      newImages[0] = e.target.value;
                      setSettings(prev => ({
                        ...prev,
                        landingConfig: { ...prev.landingConfig, aboutUsImages: newImages }
                      }));
                    }}
                    className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-4 py-2 text-[10px] font-bold outline-none focus:bg-white focus:border-rose-200"
                  />
                </div>

                {/* MEDIA 2 */}
                <div className="space-y-3">
                  <label className="text-[8px] font-bold text-slate-400 uppercase italic">Media 2 (Taller / Reel)</label>
                  <div className="aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden relative group">
                    {settings.landingConfig?.aboutUsImages?.[1] ? (
                      settings.landingConfig.aboutUsImages[1].includes('video') || settings.landingConfig.aboutUsImages[1].startsWith('data:video') ? (
                        <video src={settings.landingConfig.aboutUsImages[1]} className="w-full h-full object-cover" muted loop autoPlay />
                      ) : (
                        <img src={settings.landingConfig.aboutUsImages[1]} className="w-full h-full object-cover" alt="About 2" />
                      )
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                        <ImageIcon size={32} />
                        <p className="text-[8px] font-black uppercase mt-2">Sin Media</p>
                      </div>
                    )}
                    <button 
                      onClick={() => aboutMedia2Ref.current?.click()}
                      disabled={isUploadingAbout === 1}
                      className="absolute inset-0 bg-[#004ea1]/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white gap-2 transition-all backdrop-blur-sm"
                    >
                      {isUploadingAbout === 1 ? <RefreshCw className="animate-spin" size={24} /> : <Upload size={24} />}
                      <span className="text-[9px] font-black uppercase tracking-widest">{isUploadingAbout === 1 ? 'Subiendo...' : 'Cargar Imagen/Reel'}</span>
                    </button>
                    <input type="file" ref={aboutMedia2Ref} className="hidden" accept="image/*,video/*" onChange={(e) => handleAboutMediaUpload(e, 1)} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="O pega URL aquí"
                    value={settings.landingConfig?.aboutUsImages?.[1] || ''}
                    onChange={(e) => {
                      const newImages = [...(settings.landingConfig?.aboutUsImages || ['', ''])];
                      newImages[1] = e.target.value;
                      setSettings(prev => ({
                        ...prev,
                        landingConfig: { ...prev.landingConfig, aboutUsImages: newImages }
                      }));
                    }}
                    className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-4 py-2 text-[10px] font-bold outline-none focus:bg-white focus:border-rose-200"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-10 md:p-14 shadow-sm space-y-10">
        <div className="flex justify-between items-center">
          <SectionHeader icon={<Target size={24} className="text-emerald-600"/>} title="METAS DE VENTA" subtitle="Establece objetivos mensuales de facturación" />
          <button onClick={handleAddGoal} className="bg-emerald-50 text-emerald-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
            <Plus size={16}/> Nueva Meta
          </button>
        </div>
        
        <div className="space-y-4">
          {(settings.salesGoals || []).length > 0 ? (
            (settings.salesGoals || []).map(goal => (
              <div key={goal.id} className="bg-slate-50 rounded-[2rem] p-6 border-2 border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-6 items-center group">
                <div className="md:col-span-3 space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase italic flex items-center gap-2"><Calendar size={10}/> Mes / Año</label>
                  <input 
                    type="month" 
                    value={goal.month} 
                    onChange={(e) => handleUpdateGoal(goal.id, 'month', e.target.value)}
                    className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-xs font-black outline-none focus:border-emerald-300"
                  />
                </div>
                <div className="md:col-span-3 space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase italic flex items-center gap-2"><Target size={10}/> Objetivo ($)</label>
                  <input 
                    type="number" 
                    value={goal.targetAmountUsd} 
                    onChange={(e) => handleUpdateGoal(goal.id, 'targetAmountUsd', parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-xs font-black outline-none focus:border-emerald-300"
                  />
                </div>
                <div className="md:col-span-5 space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase italic flex items-center gap-2"><Quote size={10}/> Nota Estratégica</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Temporada Escolar / Lanzamiento" 
                    value={goal.description} 
                    onChange={(e) => handleUpdateGoal(goal.id, 'description', e.target.value)}
                    className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-xs font-black outline-none focus:border-emerald-300 uppercase italic"
                  />
                </div>
                <div className="md:col-span-1 flex justify-end">
                  <button onClick={() => handleRemoveGoal(goal.id)} className="p-3 text-slate-200 hover:text-red-500 transition-colors">
                    <Trash2 size={20}/>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[2rem] p-10 text-center space-y-2">
              <p className="text-xs font-black text-slate-400 uppercase italic">No hay metas definidas</p>
              <p className="text-[9px] font-bold text-slate-300 uppercase italic">Crea una meta para visualizar el progreso en el Centro de Auditoría.</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-10 md:p-14 shadow-sm space-y-10">
        <div className="flex justify-between items-center">
          <SectionHeader icon={<Zap size={24} className="text-indigo-600"/>} title="INTELIGENCIA ESTRATÉGICA" subtitle="Configura parámetros de capacidad y ROI" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic flex items-center gap-2">
              <Clock size={12} className="text-indigo-500" /> Capacidad Semanal (Unidades)
            </label>
            <input 
              type="number" 
              name="weeklyCapacityUnits" 
              value={settings.weeklyCapacityUnits || 0} 
              onChange={handleChange}
              className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 text-slate-800 font-bold focus:bg-white focus:border-indigo-200 outline-none transition-all"
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic flex items-center gap-2">
              <TrendingUp size={12} className="text-indigo-500" /> Costo Hora Taller ($)
            </label>
            <input 
              type="number" 
              name="workshopHourlyCostUsd" 
              value={settings.workshopHourlyCostUsd || 0} 
              onChange={handleChange}
              className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 text-slate-800 font-bold focus:bg-white focus:border-indigo-200 outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h5 className="font-black uppercase text-xs text-slate-500 italic">Inversiones en Equipos (ROI)</h5>
            <button onClick={handleAddInvestment} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-600 hover:text-white transition-all">
              <Plus size={14}/> Añadir Equipo
            </button>
          </div>
          
          <div className="space-y-4">
            {(settings.investments || []).map(inv => (
              <div key={inv.id} className="bg-slate-50 rounded-[2rem] p-6 border-2 border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-4 space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase italic">Nombre del Equipo</label>
                  <input value={inv.name} onChange={(e) => handleUpdateInvestment(inv.id, 'name', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none" placeholder="Ej: Bordadora 12 Cabezales" />
                </div>
                <div className="md:col-span-3 space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase italic">Inversión ($)</label>
                  <input type="number" value={inv.amountUsd} onChange={(e) => handleUpdateInvestment(inv.id, 'amountUsd', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none" />
                </div>
                <div className="md:col-span-4 space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase italic">Ingreso Mensual Proyectado ($)</label>
                  <input type="number" value={inv.expectedMonthlyRevenueUsd} onChange={(e) => handleUpdateInvestment(inv.id, 'expectedMonthlyRevenueUsd', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none" />
                </div>
                <div className="md:col-span-1 flex justify-end">
                  <button onClick={() => handleRemoveInvestment(inv.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 size={18}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-10 md:p-14 shadow-sm space-y-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><Globe size={200} className="text-emerald-500" /></div>
        <div className="relative z-10 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner border border-emerald-100">
                  <Globe size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">CONEXIÓN NUBE SUPABASE</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Sincronización Automática Activa</p>
                </div>
              </div>
              
              <div className="bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-lg italic">
                 <CloudCheck size={18} /> CONFIGURADO POR SERVIDOR
              </div>
            </div>

            <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-slate-100 space-y-4">
              <p className="text-xs font-bold text-slate-600 italic leading-relaxed">
                La conexión con Supabase se ha configurado automáticamente desde las variables de entorno del servidor. 
                Todos los dispositivos conectados a esta instancia compartirán la misma base de datos en tiempo real.
              </p>
              <div className="flex items-center gap-4 text-emerald-600">
                <Wifi size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Sincronización Bidireccional Activa</span>
              </div>
            </div>

           <button onClick={testCloudConnection} disabled={isSyncing} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 italic">
             {isSyncing ? <RefreshCw className="animate-spin" size={18} /> : <CloudCheck size={18} />}
             {isSyncing ? 'TRANSMITIENDO...' : 'FORZAR SINCRONIZACIÓN AHORA'}
           </button>
        </div>
      </div>
      
      <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-10 md:p-14 shadow-sm space-y-10">
        <SectionHeader icon={<Settings2 size={24} className="text-[#004ea1]"/>} title="SEDES Y NUMERACIÓN" subtitle="Gestión de contactos y folios por sucursal" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {settings.stores.map(store => (
            <div key={store.id} className="bg-slate-50 rounded-[2.5rem] p-8 border-2 border-slate-100 space-y-6 hover:shadow-xl transition-all">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-4">
                  <MapPin size={20} className="text-[#004ea1]" />
                  <h5 className="font-black text-slate-800 uppercase italic">{store.name}</h5>
                </div>
                <span className="bg-white px-3 py-1 rounded-lg text-[9px] font-black text-slate-400 border border-slate-200">PREFIJO: {store.prefix}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase italic flex items-center gap-2">
                     <Phone size={10} className="text-[#004ea1]"/> WhatsApp de la Sede
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#004ea1]">+58</span>
                    <input type="text" value={store.phone?.replace('+58', '') || ''} onChange={(e) => handleStoreConfigChange(store.id, 'phone', `+58${e.target.value.replace(/\D/g, '')}`)} placeholder="412 1234567" className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 pl-12 text-xs font-bold text-slate-800 focus:border-blue-300 outline-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase italic flex items-center gap-2">
                     <Terminal size={10} className="text-[#004ea1]"/> Próximo Nro. Orden
                  </label>
                  <input type="number" value={store.nextOrderNumber} onChange={(e) => handleStoreConfigChange(store.id, 'nextOrderNumber', parseInt(e.target.value))} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:border-blue-300 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase italic flex items-center gap-2">
                     <Terminal size={10} className="text-[#004ea1]"/> Próximo Nro. Venta
                  </label>
                  <input type="number" value={store.nextDirectSaleNumber} onChange={(e) => handleStoreConfigChange(store.id, 'nextDirectSaleNumber', parseInt(e.target.value))} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:border-blue-300 outline-none" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#000814] rounded-[3rem] p-10 md:p-14 text-white shadow-2xl relative overflow-hidden border-4 border-white/5">
        <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><MessageSquare size={200}/></div>
        <div className="relative z-10 space-y-10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]"><MessageSquare size={32}/></div>
            <div>
              <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none text-white">CRM & CHATBOT (META API)</h3>
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em] mt-2 italic">Configuración para futura integración</p>
            </div>
          </div>

          <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
            <div className="flex items-center gap-4 mb-4">
              <input 
                type="checkbox" 
                id="whatsappEnabled"
                name="enabled"
                checked={settings.whatsappConfig?.enabled || false}
                onChange={handleWhatsappChange}
                className="w-6 h-6 rounded-lg accent-emerald-500"
              />
              <label htmlFor="whatsappEnabled" className="text-sm font-black uppercase italic text-emerald-400">Activar Módulo de Comunicación</label>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed">
              Al activar este módulo, el sistema se preparará para recibir y enviar mensajes vía WhatsApp Meta API. 
              Sin las llaves configuradas, el sistema seguirá operando de manera manual.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 italic flex items-center gap-2"><KeyIcon size={10}/> Access Token (Meta)</label>
              <input 
                type="password" 
                name="accessToken" 
                value={settings.whatsappConfig?.accessToken || ''} 
                onChange={handleWhatsappChange} 
                className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-4 text-white font-mono text-xs outline-none focus:border-emerald-500/50 transition-all" 
                placeholder="EAAB..."
              />
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 italic flex items-center gap-2"><Smartphone size={10}/> Phone Number ID</label>
              <input 
                type="text" 
                name="phoneNumberId" 
                value={settings.whatsappConfig?.phoneNumberId || ''} 
                onChange={handleWhatsappChange} 
                className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-4 text-white font-mono text-xs outline-none focus:border-emerald-500/50 transition-all" 
                placeholder="109..."
              />
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 italic flex items-center gap-2"><Building2 size={10}/> Business Account ID</label>
              <input 
                type="text" 
                name="businessAccountId" 
                value={settings.whatsappConfig?.businessAccountId || ''} 
                onChange={handleWhatsappChange} 
                className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-4 text-white font-mono text-xs outline-none focus:border-emerald-500/50 transition-all" 
                placeholder="104..."
              />
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 italic flex items-center gap-2"><Shield size={10}/> Verify Token (Webhook)</label>
              <input 
                type="text" 
                name="verifyToken" 
                value={settings.whatsappConfig?.verifyToken || ''} 
                onChange={handleWhatsappChange} 
                className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-4 text-white font-mono text-xs outline-none focus:border-emerald-500/50 transition-all" 
              />
            </div>
          </div>

          <div className="bg-emerald-500/10 p-6 rounded-3xl border border-emerald-500/20 mt-6">
            <div className="flex items-center gap-4">
              <input 
                type="checkbox" 
                id="useTemplates"
                name="useTemplates"
                checked={settings.whatsappConfig?.useTemplates || false}
                onChange={handleWhatsappChange}
                className="w-6 h-6 rounded-lg accent-emerald-500"
              />
              <div className="flex flex-col">
                <label htmlFor="useTemplates" className="text-sm font-black uppercase italic text-emerald-400">Usar Plantillas Oficiales (Meta Templates)</label>
                <p className="text-[9px] text-slate-400 font-bold uppercase italic">Recomendado para producción. Requiere configurar plantillas en el panel de Meta.</p>
              </div>
            </div>
          </div>
          </div>
        </div>

      <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-10 md:p-14 shadow-sm space-y-10">
        <SectionHeader icon={<ShieldCheck size={24} className="text-blue-600"/>} title="DATOS FISCALES (NIIF)" subtitle="Información legal para contabilidad y auditoría" />
        
        <div className="bg-blue-50/50 p-8 rounded-[2rem] border-2 border-blue-100 flex gap-6 items-center mb-8">
          <AlertCircle className="text-blue-500 flex-shrink-0" size={32} />
          <p className="text-[10px] font-bold text-blue-700 italic leading-relaxed">
            ESTA INFORMACIÓN ES EXCLUSIVA PARA EL MÓDULO CONTABLE. 
            NO SE REFLEJARÁ EN DOCUMENTOS PÚBLICOS NI COMERCIALES.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Nombre Legal / Razón Social</label>
            <input 
              type="text" 
              value={settings.fiscalData?.legalName || ''} 
              onChange={(e) => handleFiscalDataChange('legalName', e.target.value)}
              className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 text-slate-800 font-bold focus:bg-white focus:border-blue-200 outline-none transition-all uppercase italic"
              placeholder="Ej: INVERSIONES ROXTOR C.A."
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">RIF (Registro Fiscal)</label>
            <input 
              type="text" 
              value={settings.fiscalData?.rif || ''} 
              onChange={(e) => handleFiscalDataChange('rif', e.target.value)}
              className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 text-slate-800 font-bold focus:bg-white focus:border-blue-200 outline-none transition-all uppercase italic"
              placeholder="Ej: J-12345678-9"
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Dirección Fiscal Completa</label>
          <textarea 
            value={settings.fiscalData?.fiscalAddress || ''} 
            onChange={(e) => handleFiscalDataChange('fiscalAddress', e.target.value)}
            className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 text-slate-800 font-bold focus:bg-white focus:border-blue-200 outline-none transition-all uppercase italic h-32 resize-none"
            placeholder="Dirección legal exacta..."
          />
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h5 className="font-black uppercase text-xs text-slate-500 italic">Socios y Accionistas</h5>
            <button onClick={handleAddPartner} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-all">
              <Plus size={14}/> Añadir Socio
            </button>
          </div>
          
          <div className="space-y-4">
            {(settings.fiscalData?.partners || []).map((partner, idx) => (
              <div key={idx} className="bg-slate-50 rounded-[2rem] p-6 border-2 border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-7 space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase italic">Nombre del Socio</label>
                  <input 
                    value={partner.name} 
                    onChange={(e) => handleUpdatePartner(idx, 'name', e.target.value)} 
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none uppercase italic" 
                  />
                </div>
                <div className="md:col-span-4 space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase italic">Participación (%)</label>
                  <input 
                    type="number" 
                    value={partner.percentage} 
                    onChange={(e) => handleUpdatePartner(idx, 'percentage', parseFloat(e.target.value) || 0)} 
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none" 
                  />
                </div>
                <div className="md:col-span-1 flex justify-end">
                  <button onClick={() => handleRemovePartner(idx)} className="text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 size={18}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-10 md:p-14 shadow-sm space-y-10">
        <SectionHeader icon={<ShieldCheck size={24} className="text-emerald-600"/>} title="PERMISOS CONTABLES" subtitle="Asigna acceso al módulo de ingeniería contable" />
        
        <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-slate-100 space-y-6">
          <p className="text-xs font-bold text-slate-600 italic leading-relaxed text-center">
            Selecciona los agentes que tendrán autorización para ver reportes financieros, balances y proyecciones. 
            <span className="text-[#004ea1] font-black"> Los usuarios con rol "Gerencia" tienen acceso total por defecto.</span>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.filter(a => a.role !== 'Gerencia' && a.id !== 'agent_web').map(agent => (
              <button 
                key={agent.id}
                onClick={() => handleToggleAccountingPermission(agent.id)}
                className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${
                  settings.accountingPermissions?.includes(agent.id)
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    settings.accountingPermissions?.includes(agent.id) ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300'
                  }`}>
                    <UserCheck size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black uppercase italic">{agent.name}</p>
                    <p className="text-[9px] font-bold uppercase italic opacity-60">{agent.role}</p>
                  </div>
                </div>
                {settings.accountingPermissions?.includes(agent.id) && <CheckCircle size={18} className="text-emerald-500" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#000814] rounded-[3rem] p-10 md:p-14 text-white shadow-2xl relative overflow-hidden border-4 border-white/5">
        <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12"><Shield size={200}/></div>
        <div className="relative z-10 space-y-12">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.3)]"><Lock size={32}/></div>
            <div>
              <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none text-white">SEGURIDAD Y PINS</h3>
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] mt-2 italic">Control de accesos y cifrado</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 italic flex items-center gap-2"><Smartphone size={10}/> PIN Acceso App (6 Dígitos)</label>
              <input type="password" name="loginPin" maxLength={6} placeholder="000000" value={settings.loginPin} onChange={handleChange} className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-5 text-white font-mono text-3xl tracking-[0.3em] outline-none focus:border-emerald-500/50 transition-all" />
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 italic flex items-center gap-2"><Shield size={10}/> Clave Gerencia (Alfanumérica)</label>
              <input type="text" name="masterPin" placeholder="Roxtor*2026#" value={settings.masterPin} onChange={handleChange} className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-5 text-white font-mono text-xl tracking-[0.1em] outline-none focus:border-blue-500/50 transition-all" />
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 italic flex items-center gap-2"><Key size={10}/> Cifrado Respaldo</label>
              <input type="text" name="encryptionKey" value={settings.encryptionKey} onChange={handleChange} className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-5 text-[10px] text-blue-200 font-mono tracking-widest outline-none focus:border-blue-500/50 uppercase transition-all" />
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row gap-4">
             <button onClick={exportMasterData} disabled={isSyncing} className={`flex-1 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all border-b-4 flex items-center justify-center gap-3 ${showSuccess ? 'bg-emerald-500 border-emerald-700 text-white' : 'bg-white text-[#000814] border-slate-300 hover:bg-slate-100'}`}>
               {showSuccess ? <CheckCircle size={18}/> : <Download size={18}/>} EXPORTAR BASE DE DATOS
             </button>
             <label className="flex-1 bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-500 transition-all border-b-4 border-blue-900 flex items-center justify-center gap-3 cursor-pointer text-center">
               <FileUp size={18}/> IMPORTAR RESPALDO JSON
               <input type="file" className="hidden" accept=".json" />
             </label>
          </div>
        </div>
      </div>
      {/* SECCIÓN DE MANTENIMIENTO Y DATOS DE PRUEBA */}
      <div className="bg-white rounded-[3rem] p-10 shadow-sm border-4 border-slate-50 space-y-8">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <div className="bg-rose-50 p-4 rounded-2xl text-rose-600 shadow-sm"><Trash2 size={24}/></div>
          <div>
            <h3 className="text-xl font-black text-[#000814] uppercase italic tracking-tighter">Mantenimiento del Sistema</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase italic">Gestión de datos de prueba y limpieza</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-slate-100 space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase italic">Limpieza de Datos</h4>
            <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed">
              Si has terminado de probar el sistema con datos ficticios, puedes realizar una limpieza selectiva o total. 
              <span className="text-rose-600 block mt-1">⚠️ ESTA ACCIÓN ES IRREVERSIBLE.</span>
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button 
                onClick={onResetOrders}
                className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-black text-[9px] uppercase italic hover:border-rose-200 hover:text-rose-600 transition-all"
              >
                Borrar Órdenes
              </button>
              <button 
                onClick={onResetExpenses}
                className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-black text-[9px] uppercase italic hover:border-rose-200 hover:text-rose-600 transition-all"
              >
                Borrar Gastos
              </button>
            </div>
          </div>

          <div className="bg-rose-600 p-8 rounded-[2.5rem] shadow-xl space-y-4">
            <h4 className="text-xs font-black text-white uppercase italic">REINICIO TOTAL (MODO PRODUCCIÓN)</h4>
            <p className="text-[9px] text-rose-100 font-bold uppercase leading-relaxed">
              Elimina todos los registros transaccionales para iniciar la operación real del negocio. Se mantendrán los productos y configuraciones de marca.
            </p>
            <button 
              onClick={onResetAll}
              className="w-full py-4 bg-white text-rose-600 rounded-2xl font-black text-[10px] uppercase italic tracking-widest shadow-lg hover:bg-rose-50 transition-all"
            >
              LIMPIAR TODO Y EMPEZAR DE CERO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionHeader = ({ icon, title, subtitle }: any) => (
  <div className="flex items-center gap-6">
    <div className="w-14 h-14 bg-[#f8fafc] border-2 border-slate-100 text-[#004ea1] rounded-2xl flex items-center justify-center shadow-sm">{icon}</div>
    <div>
      <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">{title}</h3>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">{subtitle}</p>
    </div>
  </div>
);

const InputGroup = ({ label, prefix, icon, ...props }: any) => (
  <div className="space-y-3 w-full">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">{label}</label>
    <div className="relative">
      {icon && <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 z-10">{icon}</div>}
      {prefix && <span className={`absolute ${icon ? 'left-11' : 'left-5'} top-1/2 -translate-y-1/2 text-[#004ea1] font-black`}>{prefix}</span>}
      <input {...props} className={`w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 text-slate-800 font-bold focus:bg-white focus:border-[#004ea1]/20 outline-none transition-all ${(prefix || icon) ? 'pl-12' : ''} ${prefix && icon ? 'pl-16' : ''}`} />
    </div>
  </div>
);

export default Settings;
