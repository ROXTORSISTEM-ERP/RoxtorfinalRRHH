import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Message, AppSettings, Order } from '../types';
import { 
  MessageCircle, 
  Search, 
  Send, 
  Clock, 
  CheckCheck, 
  Check, 
  AlertCircle,
  ArrowLeft,
  MoreVertical,
  Phone,
  ExternalLink,
  Zap,
  TrendingUp,
  Package,
  CheckCircle2,
  Truck
} from 'lucide-react';
import { sendWhatsappMessage } from '../services/whatsappService';
import { supabase } from '../utils/supabase';

// DICCIONARIO DE LAS 10 PLANTILLAS ROXTOR
const ROXTOR_TEMPLATES = {
  BIENVENIDA: { name: 'bienvenida_roxtor', label: 'Bienvenida', icon: <MessageCircle size={14}/> },
  PENDIENTE: { name: 'datos_pendientes_roxtor', label: 'Datos Faltantes', icon: <AlertCircle size={14}/> },
  COTIZACION: { name: 'cotizacion_lista_roxtor', label: 'Enviar Cotización', icon: <ExternalLink size={14}/> },
  CONFIRMADO: { name: 'pedido_confirmado_roxtor', label: 'Confirmar Pedido', icon: <Check size={14}/> },
  DISENO: { name: 'revision_diseno_roxtor', label: 'Enviar Diseño', icon: <Zap size={14}/> },
  APROBADO: { name: 'diseno_aprobado_roxtor', label: 'Diseño Aprobado', icon: <CheckCircle2 size={14}/> },
  PRODUCCION: { name: 'produccion_roxtor', label: 'A Producción', icon: <Package size={14}/> },
  LISTO: { name: 'pedido_listo_roxtor', label: 'Pedido Listo', icon: <Zap size={14}/> },
  PAGO: { name: 'pago_confirmado_roxtor', label: 'Confirmar Pago', icon: <CheckCheck size={14}/> },
  ENTREGA: { name: 'entrega_roxtor', label: 'Notificar Entrega', icon: <Truck size={14}/> }, // Marketing
};

interface Props {
  settings: AppSettings;
  orders: Order[];
  currentAgentId?: string;
}

const WhatsAppInbox: React.FC<Props> = ({ settings, orders, currentAgentId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const mapDBToMessage = (m: any): Message => ({
    id: m.id,
    from: m.status === 'received' ? m.phone : 'system',
    to: m.status === 'received' ? 'system' : m.phone,
    body: m.message,
    timestamp: new Date(m.created_at).getTime(),
    direction: m.status === 'received' ? 'inbound' : 'outbound',
    status: m.status === 'received' ? 'read' : m.status as any,
    customerName: m.customer_name
  });

  useEffect(() => {
    const fetchMessages = async () => {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from('whatsapp_messages')
          .select('*')
          .order('created_at', { ascending: true });
        if (data) setMessages(data.map(mapDBToMessage));
      } catch (error) { console.error("Error:", error); }
      finally { setIsLoading(false); }
    };
    fetchMessages();

    const channel = supabase?.channel('whatsapp_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_messages' }, (payload: any) => {
        if (payload.eventType === 'INSERT') {
          const newMsg = mapDBToMessage(payload.new);
          setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
        } else if (payload.eventType === 'UPDATE') {
          const updated = mapDBToMessage(payload.new);
          setMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
        }
      }).subscribe();
    return () => { if (supabase && channel) supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedChat]);

  const conversations = useMemo(() => {
    const groups: Record<string, Message[]> = {};
    messages.forEach(msg => {
      const phone = msg.direction === 'inbound' ? msg.from : msg.to;
      if (!groups[phone]) groups[phone] = [];
      groups[phone].push(msg);
    });

    return Object.entries(groups).map(([phone, msgs]) => {
      const last = msgs[msgs.length - 1];
      const linkedOrder = orders.find(o => o.customerPhone.replace(/\D/g, '').includes(phone.replace(/\D/g, '')));
      return {
        phone,
        messages: msgs.sort((a, b) => a.timestamp - b.timestamp),
        lastMessage: last,
        customerName: linkedOrder ? linkedOrder.customerName : (msgs.find(m => m.customerName && m.customerName !== 'ROXTOR ERP')?.customerName || 'Cliente Roxtor'),
        unreadCount: msgs.filter(m => m.direction === 'inbound' && m.status !== 'read').length
      };
    }).sort((a, b) => b.lastMessage.timestamp - a.lastMessage.timestamp);
  }, [messages, orders]);

  const activeMessages = useMemo(() => 
    selectedChat ? messages.filter(m => m.from === selectedChat || m.to === selectedChat).sort((a, b) => a.timestamp - b.timestamp) : []
  , [selectedChat, messages]);

  const activeCustomer = useMemo(() => conversations.find(c => c.phone === selectedChat), [selectedChat, conversations]);
  const activeOrder = useMemo(() => {
    if (!selectedChat) return null;
    const clean = selectedChat.replace(/\D/g, '');
    return orders.find(o => o.customerPhone.replace(/\D/g, '').includes(clean));
  }, [selectedChat, orders]);

  // FUNCIÓN MAESTRA DE ENVÍO (TEXTO O PLANTILLA)
  const handleActionSend = async (template?: any, customVars?: string[]) => {
    if (!selectedChat || (!replyText.trim() && !template)) return;

    const tempId = `temp-${Date.now()}`;
    const displayBody = template ? `[Plantilla: ${template.name}]` : replyText;
    
    setReplyText('');
    setIsSending(true);

    const optimistic: Message = {
      id: tempId, from: 'system', to: selectedChat, body: displayBody,
      timestamp: Date.now(), direction: 'outbound', status: 'sending',
      customerName: activeCustomer?.customerName
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const success = await sendWhatsappMessage({
        to: selectedChat,
        body: template ? undefined : displayBody,
        templateName: template?.name,
        variables: customVars,
        agentId: currentAgentId
      });

      if (!success) throw new Error();
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'sent' } : m));
    } catch (error) {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
    } finally { setIsSending(false); }
  };

  return (
    <div className="flex h-[85vh] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 italic font-medium">
      {/* LISTA DE CHATS */}
      <div className={`w-full md:w-96 border-r border-slate-100 flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-slate-50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-[#000814] uppercase tracking-tighter italic">Bandeja Roxtor</h2>
            <div className="bg-emerald-500 text-white p-2 rounded-xl shadow-lg">
              <Zap size={20} fill="currentColor" />
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" placeholder="BUSCAR..." 
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-[10px] font-black outline-none uppercase tracking-widest"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {conversations.filter(c => c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm)).map(conv => (
            <button 
              key={conv.phone} onClick={() => setSelectedChat(conv.phone)}
              className={`w-full p-5 flex items-center gap-4 hover:bg-slate-50 transition-all border-b border-slate-50/50 ${selectedChat === conv.phone ? 'bg-blue-50/50 border-l-8 border-l-[#004ea1]' : ''}`}
            >
              <div className="w-14 h-14 bg-[#000814] text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg rotate-2">
                {conv.customerName[0]}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-black text-sm text-slate-800 truncate uppercase italic">{conv.customerName}</h4>
                  <span className="text-[9px] font-bold text-slate-400">{new Date(conv.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-xs text-slate-500 truncate italic">{conv.lastMessage.body}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ÁREA DE CHAT */}
      <div className={`flex-1 flex flex-col bg-slate-50/30 ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
        {selectedChat ? (
          <>
            <div className="bg-white p-5 border-b border-slate-100 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedChat(null)} className="md:hidden p-2 text-slate-400"><ArrowLeft size={20} /></button>
                <div className="w-12 h-12 bg-[#004ea1] text-white rounded-2xl flex items-center justify-center font-black shadow-md rotate-3">{activeCustomer?.customerName[0]}</div>
                <div>
                  <h3 className="font-black text-sm text-slate-800 uppercase italic leading-none">{activeCustomer?.customerName}</h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedChat}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
              {activeMessages.map((msg) => {
                const isOut = msg.direction === 'outbound';
                return (
                  <div key={msg.id} className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] p-5 rounded-[2rem] shadow-sm ${isOut ? 'bg-[#000814] text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}`}>
                      <p className="text-sm italic whitespace-pre-wrap">{msg.body}</p>
                      <div className={`flex items-center gap-2 mt-2 ${isOut ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[8px] font-bold opacity-30">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isOut && (
                          <span className="text-blue-400">
                            {msg.status === 'read' ? <CheckCheck size={12} /> : msg.status === 'sending' ? <Clock size={12} className="animate-spin" /> : <Check size={12} />}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            <div className="p-6 bg-white border-t border-slate-100">
              <div className="flex items-end gap-3 max-w-5xl mx-auto">
                <div className="flex-1 bg-slate-50 rounded-[2rem] p-2 border border-slate-100">
                  <textarea 
                    placeholder="ESCRIBE O ELIGE UNA ACCIÓN..." 
                    className="w-full bg-transparent border-none outline-none text-sm font-bold p-3 max-h-32 resize-none uppercase italic"
                    rows={1} value={replyText} onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleActionSend(); } }}
                  />
                </div>
                <button 
                  onClick={() => handleActionSend()} disabled={!replyText.trim() || isSending}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${replyText.trim() ? 'bg-[#004ea1] text-white rotate-12 scale-110' : 'bg-slate-100 text-slate-300'}`}
                >
                  <Send size={24} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
             <MessageCircle size={80} className="text-slate-100" />
             <h3 className="text-3xl font-black text-[#000814] uppercase italic tracking-tighter">Radar Roxtor</h3>
          </div>
        )}
      </div>

      {/* PANEL DE CONTROL (PLANTILLAS Y ORDEN) */}
      {selectedChat && (
        <div className="hidden lg:flex w-80 border-l border-slate-100 flex-col bg-white p-6 space-y-6 overflow-y-auto no-scrollbar">
          <div className="text-center space-y-2">
            <div className="w-20 h-20 bg-[#000814] text-white rounded-[2rem] flex items-center justify-center font-black text-3xl mx-auto shadow-xl rotate-3 italic">
              {activeCustomer?.customerName[0]}
            </div>
            <h3 className="text-md font-black text-[#000814] uppercase italic">{activeCustomer?.customerName}</h3>
          </div>

          {/* ACCIONES DE PLANTILLAS */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest flex items-center gap-2">
              <Zap size={12}/> Automatizaciones Meta
            </p>
            <div className="grid grid-cols-1 gap-2">
              {Object.values(ROXTOR_TEMPLATES).map((t) => (
                <button 
                  key={t.name}
                  onClick={() => handleActionSend(t, [activeCustomer?.customerName || 'Cliente', activeOrder?.orderNumber || 'S/N', 'roxtorca.com.ve'])}
                  className={`flex items-center justify-between p-3 rounded-xl text-[9px] font-black uppercase italic transition-all ${t.name.includes('entrega') ? 'bg-[#000814] text-white hover:bg-emerald-600' : 'bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-[#004ea1]'}`}
                >
                  <span className="flex items-center gap-2">{t.icon} {t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* INFO DE LA ORDEN */}
          {activeOrder && (
            <div className="p-5 bg-blue-50/50 rounded-[2rem] border border-blue-100 space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-2xl font-black text-[#004ea1] italic">#{activeOrder.orderNumber}</p>
                <span className="text-[8px] font-black bg-[#004ea1] text-white px-2 py-1 rounded-lg uppercase">{activeOrder.status}</span>
              </div>
              <div className="text-[10px] font-bold uppercase italic space-y-1">
                <div className="flex justify-between text-slate-500"><span>Total:</span> <span>${activeOrder.totalUsd.toFixed(2)}</span></div>
                <div className="flex justify-between text-rose-600"><span>Resta:</span> <span>${activeOrder.restanteUsd.toFixed(2)}</span></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WhatsAppInbox;