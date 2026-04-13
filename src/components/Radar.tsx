import React, { useState, useEffect, useRef } from 'react';
import { Product, AppSettings, Order } from '../types';
import { compressImage } from '../utils/storage';
import { sendWhatsappMessage } from '../services/whatsappService';
import { 
  Radar as RadarIcon, Send, FileUp, Loader2, CheckCircle, Zap 
} from 'lucide-react';

interface Props {
  products: Product[];
  orders: Order[];
  settings: AppSettings;
  currentStoreId: string;
  onNewOrder: (order: Order) => void;
  onNewMessage?: (message: any) => void;
  messages: any[];
}

const Radar: React.FC<Props> = ({ 
  products, settings, currentStoreId, onNewOrder, onNewMessage, messages
}) => {

  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<'idle' | 'thinking' | 'scanning'>('idle');
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const callRadarAPI = async (message?: string, image?: string) => {
    const res = await fetch('/api/ai/radar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message, 
        image,
        catalog: products.map(p => ({ name: p.name, priceRetail: p.priceRetail }))
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Error en el Radar");
    }
    return data;
  };

  const handleAIService = async (text?: string, imageBase64?: string) => {
    const userPrompt = text || input.trim();
    if (!userPrompt && !imageBase64) return;

    setIsAnalyzing(true);
    setAnalysisStep(imageBase64 ? 'scanning' : 'thinking');

    if (!imageBase64) {
      // Detectar si es una clave API
      if (userPrompt.trim().startsWith('AIza')) {
        try {
          const res = await fetch('/api/config/gemini-key', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: userPrompt.trim() })
          });
          const data = await res.json();
          if (data.success) {
            onNewMessage?.({
              id: Date.now().toString(),
              from: 'system',
              body: "✅ ¡Excelente! He configurado tu GEMINI_API_KEY. Ahora el Radar está activo y listo para procesar tus pedidos. 🦖⚡"
            });
            setInput('');
            setIsAnalyzing(false);
            setAnalysisStep('idle');
            return;
          }
        } catch (e) {
          console.error("Error setting key:", e);
        }
      }

      onNewMessage?.({
        id: Date.now().toString(),
        from: 'user',
        body: userPrompt
      });
      setInput('');
    }

    try {
      const response = await callRadarAPI(userPrompt, imageBase64);

      // Mensaje IA
      onNewMessage?.({
        id: Date.now().toString(),
        from: 'system',
        body: response.suggested_reply || "Procesado."
      });

      // Crear orden
      if (response.new_order) {
        const newOrder: Order = {
          id: `ROX-${Date.now()}`,
          orderNumber: `WEB-${Date.now().toString().slice(-4)}`,
          customerName: response.customer_name || "Cliente",
          customerPhone: response.customer_phone || "",
          customerCi: "",
          items: response.items || [],
          totalUsd: response.total_amount || 0,
          totalBs: (response.total_amount || 0) * settings.bcvRate,
          abonoUsd: 0,
          restanteUsd: response.total_amount || 0,
          status: 'pendiente',
          taskStatus: 'esperando',
          history: [],
          bcvRate: settings.bcvRate,
          issueDate: new Date().toISOString(),
          deliveryDate: new Date(Date.now() + 7 * 86400000).toISOString(),
          technicalDetails: {},
          referenceImages: [],
          paymentMethod: 'EFECTIVO',
          storeId: currentStoreId,
          issuingAgentId: 'radar'
        };

        onNewOrder(newOrder);
        setSubmittedOrder(newOrder);

        if (newOrder.customerPhone) {
          await sendWhatsappMessage({
            to: newOrder.customerPhone,
            templateName: 'pedido_confirmado_roxtor',
            variables: [newOrder.customerName, newOrder.orderNumber, 'roxtor'],
            agentId: 'RADAR'
          });
        }
      }

    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('GEMINI_API_KEY no configurada')) {
        onNewMessage?.({
          id: Date.now().toString(),
          from: 'system',
          body: "⚠️ El Radar AI requiere configuración. Por favor, asegúrate de que la variable GEMINI_API_KEY esté configurada en el panel de 'Settings' -> 'Secrets' de AI Studio."
        });
      } else {
        onNewMessage?.({
          id: Date.now().toString(),
          from: 'system',
          body: "❌ Hubo un error procesando tu solicitud. Por favor intenta de nuevo."
        });
      }
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('idle');
    }
  };

  return (
    <div className="flex flex-col h-full bg-black text-white rounded-3xl overflow-hidden">

      {/* HEADER */}
      <div className="p-4 flex justify-between items-center border-b border-white/10">
        <div className="flex items-center gap-3">
          <RadarIcon className={isAnalyzing ? 'animate-spin' : ''}/>
          <span className="text-xs font-bold uppercase">Radar IA</span>
        </div>
        <Zap size={16}/>
      </div>

      {/* CHAT */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={msg.from === 'user' ? 'text-right' : ''}>
            <div className="inline-block bg-white/10 p-3 rounded-xl text-xs">
              {msg.body}
            </div>
          </div>
        ))}
        {isAnalyzing && (
          <div className="text-xs opacity-60 flex gap-2">
            <Loader2 className="animate-spin" size={14}/>
            {analysisStep}
          </div>
        )}
        <div ref={chatEndRef}/>
      </div>

      {/* INPUT */}
      <div className="p-4 flex gap-2 border-t border-white/10">
        <label>
          <FileUp/>
          <input type="file" hidden onChange={async e => {
            const file = e.target.files?.[0];
            if (file) {
              const compressed = await compressImage(file);
              const reader = new FileReader();
              reader.onloadend = () => {
                handleAIService("Analiza este comprobante", (reader.result as string).split(',')[1]);
              };
              reader.readAsDataURL(compressed);
            }
          }}/>
        </label>

        <input 
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAIService()}
          className="flex-1 bg-transparent outline-none text-xs"
        />

        <button onClick={() => handleAIService()}>
          <Send/>
        </button>
      </div>

      {/* CONFIRM */}
      {submittedOrder && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center">
          <div className="bg-white text-black p-6 rounded-2xl text-center">
            <CheckCircle/>
            <p>Orden creada</p>
            <strong>{submittedOrder.orderNumber}</strong>
          </div>
        </div>
      )}
    </div>
  );
};

export default Radar;
