import React, { useState, useEffect, useRef } from 'react';
import { Product, AppSettings, Order, Message } from '../types';
import { ROXTOR_SYSTEM_INSTRUCTIONS } from '../constants/systemInstructions';
import { compressImage } from '../utils/storage';
import { callRoxtorAI } from '../utils/ai'; 
import { sendWhatsappMessage } from '../services/whatsappService';
import { executeAction } from '../services/workflow';
import { parseAIResponseToActions } from '../services/aiWorkflow';
import { 
  Radar as RadarIcon, Send, FileUp, Loader2, CheckCircle, Zap 
} from 'lucide-react';

interface Props {
  products: Product[];
  orders: Order[];
  settings: AppSettings;
  currentStoreId: string;
  radarAlerts: any[];
  onNewAlert: (alert: any) => void;
  onNewOrder: (order: Order) => void;
  onUpdateOrder: (order: Order) => void;
  onNewMessage?: (message: any) => void;
  onUpdateSettings?: (settings: AppSettings) => void;
  messages: any[];
  currentAgentId: string | null;
  agents: any[];
  isPublic?: boolean;
  initialMessage?: string;
}

const Radar: React.FC<Props> = ({ 
  products, settings, currentStoreId, onNewOrder, radarAlerts, onNewAlert, onUpdateOrder, onNewMessage, onUpdateSettings, agents, orders, messages, currentAgentId, isPublic, initialMessage
}) => {
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<'idle' | 'thinking' | 'scanning' | 'printing'>('idle');
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const welcomeId = 'welcome-msg-1';
    if (messages.length === 0 || !messages.find(m => m.id === welcomeId)) {
      onNewMessage?.({
        id: welcomeId, from: 'system', to: 'user', direction: 'outbound',
        body: "🤖 RADAR ACTIVO. Soy el Agente de Ventas Roxtor. Puedo dar presupuestos, validar pagos y registrar tu orden automáticamente. ¿Qué fabricamos hoy?",
        timestamp: Date.now(),
        status: 'sent'
      });
    }
  }, []);

  const handleAIService = async (text?: string, imageBase64?: string) => {
    const userPrompt = text || input.trim();
    if (!userPrompt && !imageBase64) return;

    setIsAnalyzing(true);
    setAnalysisStep(imageBase64 ? 'scanning' : 'thinking');

    if (!imageBase64) {
      onNewMessage?.({ 
        id: Date.now().toString(), 
        from: 'user', 
        to: 'system', 
        direction: 'inbound', 
        body: userPrompt, 
        timestamp: Date.now(),
        status: 'read'
      });
      setInput('');
    }

    try {
      const context = `
        INSTRUCCIONES: ${ROXTOR_SYSTEM_INSTRUCTIONS}
        CATALOGO: ${JSON.stringify(products.map(p => ({ n: p.name, p: p.priceRetail })))}
        TASA_BCV: ${settings.bcvRate}
        IDENTIDAD: Eres 'SISTEMA-WEB'.
      `;

      const response = await callRoxtorAI(`CONTEXTO: ${context}\n\nPREGUNTA: ${userPrompt}`, imageBase64);

      let aiText = "";
      let jsonData: any = null;

      if (response && !response.error) {
        const aiMessage: any = {
          id: Date.now().toString(),
          from: 'system',
          to: 'user',
          direction: 'outbound',
          body: response.suggested_reply || "Respuesta procesada.",
          timestamp: Date.now(),
          status: 'sent'
        };
        onNewMessage?.(aiMessage);
        
        // Handle Actions
        const actions = parseAIResponseToActions(response);
        for (const action of actions) {
          await executeAction(action, {
            orders,
            setOrders: (newOrders) => {
              if (action.type === 'CREATE_ORDER') {
                // We'll handle order creation below to keep existing logic
              } else {
                // For other actions, we'd need a way to update the global state
                // This is just a placeholder for now
                console.log("Executing AI Action:", action);
              }
            },
            settings,
            currentAgentId: currentAgentId || undefined
          });
        }

        if (response.suggested_reply) {
          aiText = response.suggested_reply;
          jsonData = response; 
        } else if (typeof response === 'string') {
          aiText = response;
        } else {
          jsonData = response;
          aiText = response.suggested_reply || "Respuesta procesada.";
        }
      } else {
        aiText = response.suggested_reply || "Error de comunicación con la sede.";
        onNewMessage?.({
          id: Date.now().toString(),
          from: 'system',
          to: 'user',
          direction: 'outbound',
          body: aiText,
          timestamp: Date.now(),
          status: 'failed'
        });
      }

      if (jsonData?.new_order) {
        setAnalysisStep('printing');
        const newOrderObj: Order = {
          id: `ROX-${Date.now().toString().slice(-5)}`,
          orderNumber: `P-${Date.now().toString().slice(-4)}`,
          customerName: jsonData.customer_data?.name || "Cliente Web",
          customerPhone: jsonData.customer_data?.phone || "",
          customerCi: "",
          items: jsonData.items || [],
          totalUsd: jsonData.total_amount || 0,
          totalBs: (jsonData.total_amount || 0) * settings.bcvRate,
          abonoUsd: jsonData.is_payment ? jsonData.total_amount : 0,
          restanteUsd: jsonData.is_payment ? 0 : jsonData.total_amount,
          status: 'pendiente',
          taskStatus: 'esperando',
          history: [],
          bcvRate: settings.bcvRate,
          issueDate: new Date().toISOString(),
          deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          technicalDetails: {},
          referenceImages: [],
          paymentMethod: 'EFECTIVO',
          storeId: currentStoreId,
          issuingAgentId: 'agent_web'
        };

        onNewOrder(newOrderObj);
        setSubmittedOrder(newOrderObj);

        if (newOrderObj.customerPhone) {
          const template = jsonData.is_payment ? 'pago_confirmado_roxtor' : 'pedido_confirmado_roxtor';
          await sendWhatsappMessage({
            to: newOrderObj.customerPhone,
            templateName: template,
            variables: [newOrderObj.customerName, newOrderObj.orderNumber, 'roxtorca.com.ve'],
            agentId: 'SISTEMA-WEB'
          });
        }
      }

      // setMessages removed as it is now handled by onNewMessage calls above

    } catch (error) {
      console.error("Error Radar:", error);
      onNewMessage?.({ id: 'err', from: 'system', to: 'user', direction: 'outbound', body: "⚠️ Error técnico en PZO. Reintenta.", timestamp: Date.now(), status: 'failed' });
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('idle');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#000814]/95 backdrop-blur-2xl border-2 border-white/10 rounded-[3rem] shadow-2xl overflow-hidden font-inter italic">
      {/* HEADER */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-blue-900/20 to-transparent">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg border border-white/20">
            <RadarIcon size={24} className={isAnalyzing ? 'animate-spin' : ''} />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Radar Intelligent</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest italic">Meta AI Connected</span>
            </div>
          </div>
        </div>
        <Zap size={20} className="text-blue-400 opacity-30 animate-pulse" />
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 no-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.direction === 'inbound' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-[2rem] text-[11px] font-bold shadow-xl border-2 ${
              msg.direction === 'inbound' ? 'bg-blue-600 text-white border-blue-400 rounded-tr-none' : 'bg-white/5 text-blue-50 border-white/10 backdrop-blur-md rounded-tl-none'
            }`}>
              {msg.body}
            </div>
          </div>
        ))}
        {isAnalyzing && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-blue-500/30 p-3 rounded-2xl flex items-center gap-2 animate-pulse">
              <Loader2 size={14} className="animate-spin text-blue-400" />
              <span className="text-[8px] font-black text-blue-400 uppercase">{analysisStep}...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="p-6 bg-black/40 border-t border-white/5">
        <div className="flex items-center gap-3 bg-white/5 p-3 rounded-[2rem] border border-white/10">
          <label className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-xl cursor-pointer">
            <FileUp size={22} />
            <input type="file" className="hidden" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                const compressed = await compressImage(file);
                const reader = new FileReader();
                reader.onloadend = () => handleAIService("Analiza este comprobante", (reader.result as string).split(',')[1]);
                reader.readAsDataURL(compressed);
              }
            }} accept="image/*" />
          </label>
          <input 
            type="text" value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleAIService()}
            placeholder="PRESUPUESTO / VALIDAR PAGO..." 
            className="flex-1 bg-transparent border-none text-[10px] font-black uppercase text-white placeholder:text-blue-900/40 outline-none"
          />
          <button onClick={() => handleAIService()} className="p-4 bg-blue-600 text-white rounded-xl shadow-lg active:scale-90 transition-all">
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* TICKET DE VENTA */}
      {submittedOrder && (
        <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] w-full max-w-xs overflow-hidden shadow-2xl font-inter italic">
            <div className="p-8 border-b-2 border-dashed border-slate-100 text-center">
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto text-white mb-4 shadow-lg shadow-emerald-500/20">
                <CheckCircle size={32} />
              </div>
              <h2 className="text-xl font-black uppercase text-slate-900 leading-none">Orden Registrada</h2>
              <p className="text-[8px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{submittedOrder.orderNumber}</p>
            </div>
            <div className="p-8 space-y-4">
               <div className="flex justify-between items-center">
                 <span className="text-[9px] font-black text-slate-400 uppercase">Monto Total</span>
                 <span className="text-3xl font-black text-emerald-600">${submittedOrder.totalUsd.toFixed(2)}</span>
               </div>
               <div className="bg-blue-50 p-4 rounded-2xl text-[9px] font-bold text-blue-600 uppercase text-center leading-tight">
                 Se ha enviado la plantilla de Meta al cliente automáticamente.
               </div>
            </div>
            <button onClick={() => setSubmittedOrder(null)} className="w-full py-8 bg-slate-900 text-white font-black text-[10px] tracking-[0.3em] hover:bg-black">FINALIZAR</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Radar;
