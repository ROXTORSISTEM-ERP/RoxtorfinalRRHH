
import React, { useRef, useState } from 'react';
import { AppSettings } from '../types';
import { Image as ImageIcon, Type, Layout, Plus, Trash2, Upload, Sparkles, Loader2 } from 'lucide-react';
import { uploadToSupabaseStorage, compressImage } from '../utils/storage';

interface Props {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

const LandingSettings: React.FC<Props> = ({ settings, setSettings }) => {
  const heroInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState<string | null>(null);

  const updateLandingConfig = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      landingConfig: {
        ...(prev.landingConfig || {}),
        [field]: value
      }
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string, index?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadId = index !== undefined ? `portfolio-${index}` : field;
    setIsUploading(uploadId);

    try {
      const compressed = await compressImage(file);
      
      // Intentar subir a Supabase si está configurado
      if (settings.cloudSync?.enabled && settings.cloudSync.provider === 'supabase' && settings.cloudSync.apiUrl) {
        const fileName = `landing_${field}_${Date.now()}.webp`;
        const url = await uploadToSupabaseStorage(
          compressed, 
          'landing', 
          fileName, 
          { apiUrl: settings.cloudSync.apiUrl, apiKey: settings.cloudSync.apiKey }
        );
        
        if (url) {
          if (index !== undefined) {
            handleUpdatePortfolio(index, 'imageUrl', url);
          } else {
            updateLandingConfig(field, url);
          }
          setIsUploading(null);
          return;
        }
      }

      // Fallback a base64 optimizado si no hay nube
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200; 
          const scale = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          const optimizedUrl = canvas.toDataURL('image/webp', 0.8);
          
          if (index !== undefined) {
            handleUpdatePortfolio(index, 'imageUrl', optimizedUrl);
          } else {
            updateLandingConfig(field, optimizedUrl);
          }
          setIsUploading(null);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error uploading image:", err);
      setIsUploading(null);
    }
  };

  const handleAddPortfolio = () => {
    const newItem = { title: '', category: '', imageUrl: 'https://picsum.photos/seed/new/600/800' };
    updateLandingConfig('portfolio', [...(settings.landingConfig?.portfolio || []), newItem]);
  };

  const handleUpdatePortfolio = (index: number, field: string, value: string) => {
    const newPortfolio = [...(settings.landingConfig?.portfolio || [])];
    newPortfolio[index] = { ...newPortfolio[index], [field]: value };
    updateLandingConfig('portfolio', newPortfolio);
  };

  const handleRemovePortfolio = (index: number) => {
    const newPortfolio = (settings.landingConfig?.portfolio || []).filter((_, i) => i !== index);
    updateLandingConfig('portfolio', newPortfolio);
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 italic">
      {/* HERO CONFIG */}
      <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-8 md:p-12 shadow-sm space-y-10">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-rose-50 border-2 border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center shadow-sm">
            <Layout size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">Configuración de Portada</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Personaliza la primera impresión de tu web</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 space-y-6">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Imagen Principal (Hero)</label>
            <div className="aspect-video bg-slate-50 border-4 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center relative group overflow-hidden shadow-inner">
              {settings.landingConfig?.heroImageUrl ? (
                <img src={settings.landingConfig.heroImageUrl} className="w-full h-full object-cover" alt="Hero Preview" />
              ) : (
                <div className="text-center opacity-30">
                  <ImageIcon size={48} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-[10px] font-black uppercase">Subir Imagen Hero</p>
                </div>
              )}
              <button 
                onClick={() => heroInputRef.current?.click()} 
                disabled={isUploading === 'heroImageUrl'}
                className="absolute inset-0 bg-rose-600/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white gap-2 transition-all backdrop-blur-sm disabled:opacity-100"
              >
                {isUploading === 'heroImageUrl' ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <Upload size={24} />
                )}
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {isUploading === 'heroImageUrl' ? 'Subiendo...' : 'Cambiar Imagen'}
                </span>
              </button>
              <input type="file" ref={heroInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'heroImageUrl')} />
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Títulos y Textos</label>
              <div className="space-y-4">
                <div className="relative">
                  <Type size={14} className="absolute left-5 top-5 text-slate-300" />
                  <input 
                    type="text" 
                    placeholder="Título Principal (Ej: Soluciones Creativas)"
                    value={settings.landingConfig?.heroTitle || ''}
                    onChange={(e) => updateLandingConfig('heroTitle', e.target.value)}
                    className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 pl-12 text-slate-800 font-bold focus:bg-white focus:border-rose-200 outline-none transition-all italic"
                  />
                </div>
                <div className="relative">
                  <Sparkles size={14} className="absolute left-5 top-5 text-rose-400" />
                  <input 
                    type="text" 
                    placeholder="Subtítulo (Ej: Inteligentes)"
                    value={settings.landingConfig?.heroSubtitle || ''}
                    onChange={(e) => updateLandingConfig('heroSubtitle', e.target.value)}
                    className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 pl-12 text-slate-800 font-bold focus:bg-white focus:border-rose-200 outline-none transition-all italic"
                  />
                </div>
                <textarea 
                  placeholder="Descripción breve de la empresa..."
                  value={settings.landingConfig?.heroDescription || ''}
                  onChange={(e) => updateLandingConfig('heroDescription', e.target.value)}
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 text-slate-800 font-bold focus:bg-white focus:border-rose-200 outline-none transition-all italic min-h-[100px]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PORTFOLIO CONFIG */}
      <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-8 md:p-12 shadow-sm space-y-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-blue-50 border-2 border-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
              <ImageIcon size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">Galería de Proyectos</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Muestra tus mejores trabajos reales</p>
            </div>
          </div>
          <button 
            onClick={handleAddPortfolio}
            className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg"
          >
            <Plus size={16} /> Agregar Proyecto
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(settings.landingConfig?.portfolio || []).map((item, index) => (
            <div key={index} className="bg-slate-50 rounded-[2.5rem] p-6 border-2 border-slate-100 space-y-4 group relative">
              <button 
                onClick={() => handleRemovePortfolio(index)}
                className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 transition-colors z-10"
              >
                <Trash2 size={18} />
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
                <div className="sm:col-span-4">
                  <div className="aspect-[3/4] bg-white rounded-2xl overflow-hidden border-2 border-slate-200 relative group/img">
                    <img src={item.imageUrl} className="w-full h-full object-cover" alt="Project" />
                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                      {isUploading === `portfolio-${index}` ? (
                        <Loader2 size={20} className="text-white animate-spin" />
                      ) : (
                        <Upload size={20} className="text-white" />
                      )}
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        disabled={isUploading !== null}
                        onChange={(e) => handleImageUpload(e, 'imageUrl', index)} 
                      />
                    </label>
                  </div>
                </div>
                <div className="sm:col-span-8 space-y-4">
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-slate-400 uppercase italic">Título del Proyecto</label>
                    <input 
                      type="text" 
                      value={item.title}
                      onChange={(e) => handleUpdatePortfolio(index, 'title', e.target.value)}
                      className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-blue-300 italic"
                      placeholder="Ej: FC Guayana - Local"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-slate-400 uppercase italic">Categoría</label>
                    <input 
                      type="text" 
                      value={item.category}
                      onChange={(e) => handleUpdatePortfolio(index, 'category', e.target.value)}
                      className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-blue-300 italic"
                      placeholder="Ej: Deportiva"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LandingSettings;
