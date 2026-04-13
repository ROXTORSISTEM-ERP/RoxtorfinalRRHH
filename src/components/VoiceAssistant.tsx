import React, { useState, useEffect, useRef } from 'react';
import { Product, AppSettings } from '../types';
import { ROXTOR_SYSTEM_INSTRUCTIONS } from '../constants/systemInstructions';
import { callRoxtorAI } from '../utils/ai';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  AlertCircle, 
  MessageCircle, 
  Waves,
  Send,
  Heart,
  UserCheck
} from 'lucide-react';

interface Props {
  products: Product[];
  settings: AppSettings;
}

const VoiceAssistant: React.FC<Props> = ({ products, settings }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcriptions, setTranscriptions] = useState<{ user: string; ai: string }[]>([]);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);

  // Referencias para el manejo de audio y WebSocket
  const socketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startSession = async () => {
    if (isActive) return;
    
    setError("La API_KEY de Gemini no está disponible en el cliente por seguridad. Las funciones de voz en tiempo real requieren un proxy de WebSockets en el servidor."); 
    setIsConnecting(false);
    return; 
  };

  const startAudioCapture = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    audioContextRef.current = audioCtx;

    const source = audioCtx.createMediaStreamSource(stream);
    const processor = audioCtx.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    processor.onaudioprocess = (e) => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = Math.max(-1, Math.min(1, inputData[0])) < 0 
          ? new Int16Array(inputData.map(n => n * 0x8000)) 
          : new Int16Array(inputData.map(n => n * 0x7FFF));
        
        const base64 = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
        socketRef.current.send(JSON.stringify({
          realtime_input: { media_chunks: [{ data: base64, mime_type: "audio/pcm" }] }
        }));
      }
    };

    source.connect(processor);
    processor.connect(audioCtx.destination);
    setIsActive(true);
    setIsConnecting(false);
  };

  const playAudioChunk = (base64: string) => {
    setIsAiSpeaking(true);
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    
    // Aquí podrías usar un AudioWorklet para un streaming más fluido, 
    // pero para este ERP, el AudioContext básico es suficiente.
    const audioBlob = new Blob([bytes], { type: 'audio/pcm' });
    // Lógica simplificada de reproducción...
  };

  const stopSession = () => {
    socketRef.current?.close();
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioContextRef.current?.close();
    setIsActive(false);
    setIsConnecting(false);
    setIsAiSpeaking(false);
  };

  return (
    <div className="flex flex-col items-center gap-8 max-w-4xl mx-auto py-10 px-4 italic">
      <div className="text-center space-y-4">
        <div className="flex justify-center items-center gap-4">
           <div className="w-16 h-16 bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center shadow-2xl rotate-3">
             <MessageCircle size={32} />
           </div>
           <h2 className="text-5xl font-black text-[#000814] uppercase tracking-tighter italic leading-none">Vozify <span className="text-emerald-500">AI</span></h2>
        </div>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em] flex items-center justify-center gap-2">
          <UserCheck size={14} className="text-emerald-500" /> {settings.slogan}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 w-full">
        <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-8 bg-white p-12 rounded-[4rem] shadow-sm border-2 border-slate-50 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500 opacity-20" />
           <div className="relative">
              {isActive && <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20"></div>}
              <button
                onClick={() => isActive ? stopSession() : startSession()}
                disabled={isConnecting}
                className={`relative z-10 w-44 h-44 rounded-full flex flex-col items-center justify-center gap-4 transition-all shadow-2xl border-8 ${isActive ? 'bg-[#000814] border-emerald-500 text-white' : 'bg-slate-50 border-white text-slate-300 hover:bg-white hover:text-emerald-500 hover:border-emerald-100'}`}
              >
                {isActive ? <MicOff size={48}/> : <Mic size={48}/>}
                <span className="font-black text-[9px] uppercase tracking-widest">{isActive ? 'DETENER' : 'HABLAR'}</span>
              </button>
           </div>
           <div className="text-center space-y-2">
              <h4 className="font-black text-[#000814] uppercase text-sm italic">{isActive ? 'VOZIFY ESCUCHANDO...' : 'PRESIONA PARA INICIAR'}</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">PREGUNTA SOBRE TUS PRODUCTOS</p>
           </div>
           {isAiSpeaking && (
              <div className="flex gap-1.5 h-8 items-center">
                  {[1,2,3,4,5,6].map(i => <div key={`voice-bar-${i}`} className="w-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ height: `${20 + Math.random()*60}%`, animationDelay: `${i*0.1}s` }} />)}
              </div>
           )}
        </div>

        <div className="lg:col-span-7 space-y-6 bg-slate-100/50 p-8 rounded-[4rem] border-2 border-white shadow-inner min-h-[500px] flex flex-col">
           <div className="flex items-center gap-3 border-b border-slate-200 pb-6 mb-4">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-md"><UserCheck size={20}/></div>
              <div><p className="text-xs font-black text-slate-800 uppercase italic">Canal Inteligente {settings.businessName}</p><p className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest">MODO {settings.preferredTone.toUpperCase()} ACTIVO</p></div>
           </div>

           <div className="space-y-6 flex-1 overflow-y-auto pr-2">
              {transcriptions.map((t, i) => (
                <div key={i} className="space-y-4 animate-in slide-in-from-bottom-4">
                   <div className="flex justify-end"><div className="bg-[#d9fdd3] text-[#111b21] px-5 py-3 rounded-2xl rounded-tr-none text-xs font-medium shadow-sm border border-[#c1e8ba] max-w-[85%] italic">"{t.user}"</div></div>
                   <div className="flex justify-start">
                      <div className="bg-white px-5 py-3 rounded-2xl rounded-tl-none shadow-md max-w-[85%] border border-slate-100 space-y-4">
                         <div className="flex items-center gap-3"><div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white"><Volume2 size={16}/></div><div className="flex-1 h-1 bg-slate-50 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 w-full animate-pulse"/></div></div>
                         <p className="text-[11px] font-black text-slate-700 uppercase italic leading-relaxed">"{t.ai}"</p>
                         <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(t.ai)}`, '_blank')} className="flex items-center gap-2 text-[9px] font-black text-emerald-600 uppercase border-t border-slate-50 pt-2 group"><Send size={12} /> ENVIAR A WHATSAPP</button>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      {error && <div className="bg-rose-50 border-2 border-rose-100 p-4 rounded-2xl text-rose-600 text-[10px] font-black uppercase flex items-center gap-3 animate-bounce"><AlertCircle size={18}/> {error}</div>}
    </div>
  );
};

export default VoiceAssistant;
