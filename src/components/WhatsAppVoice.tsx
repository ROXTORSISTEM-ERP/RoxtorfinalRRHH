
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage, Blob } from '@google/genai';
import { Product, AppSettings } from '../types';
import { ROXTOR_SYSTEM_INSTRUCTIONS } from '../constants/systemInstructions';
import { callRoxtorAI, getGeminiApiKey } from '../utils/ai';
import { 
  MessageCircle, 
  Volume2, 
  Sparkles, 
  Edit3, 
  Download, 
  Mic, 
  MicOff,
  Zap, 
  Play, 
  RefreshCw,
  Copy,
  CheckCircle2,
  Trash2,
  Pause,
  Headphones,
  Info,
  ChevronRight,
  Waves,
  Image as ImageIcon,
  Send
} from 'lucide-react';

interface Props {
  products: Product[];
  settings: AppSettings;
}

const WhatsAppVoice: React.FC<Props> = ({ products, settings }) => {
  const [prompt, setPrompt] = useState('');
  const [draftText, setDraftText] = useState('');
  const [detectedImages, setDetectedImages] = useState<string[]>([]);
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isConnectingMic, setIsConnectingMic] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const sessionRef = useRef<any>(null);

  const catalogData = products.map(p => ({ id: p.id, name: p.name, hasImage: !!p.imageUrl }));

  const decodeBase64 = (base64: string) => {
    try {
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
      return bytes;
    } catch (e) { return new Uint8Array(0); }
  };

  const decodeRawPCM = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
    return buffer;
  };

  const createAudioBlob = (data: Float32Array): Blob => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) int16[i] = data[i] * 32768;
    let binary = '';
    const bytes = new Uint8Array(int16.buffer);
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return { data: btoa(binary), mimeType: 'audio/pcm;rate=16000' };
  };

  const toggleMic = async () => {
    if (isRecording) { if (sessionRef.current) sessionRef.current.close(); setIsRecording(false); return; }
    setIsConnectingMic(true);
    try {
      const apiKey = getGeminiApiKey();
      const ai = new GoogleGenAI({ apiKey });
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let fullTranscript = '';
      const sessionPromise = ai.live.connect({
        model: 'gemini-1.5-pro',
        callbacks: {
          onopen: () => {
            setIsRecording(true); setIsConnectingMic(false);
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const pcmBlob = createAudioBlob(e.inputBuffer.getChannelData(0));
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor); scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => { if (msg.serverContent?.inputTranscription) { fullTranscript += msg.serverContent.inputTranscription.text; setPrompt(fullTranscript); } },
          onclose: () => { setIsRecording(false); inputCtx.close().catch(() => {}); },
          onerror: () => setIsRecording(false)
        },
        config: { 
          responseModalities: [Modality.AUDIO], 
          inputAudioTranscription: {}, 
          systemInstruction: ROXTOR_SYSTEM_INSTRUCTIONS + "\n\nINSTRUCCIÓN ESPECÍFICA: Transcriptor de dictado para ERP textil." 
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (e) { setIsConnectingMic(false); }
  };

  const generateAIBasedText = async () => {
    if (!prompt.trim()) return;
    setIsGeneratingText(true);
    setAudioBuffer(null);
    setDetectedImages([]);
    try {
      const systemInstruction = `
        ${ROXTOR_SYSTEM_INSTRUCTIONS}
        
        INSTRUCCIONES ESPECÍFICAS PARA WHATSAPP VOICE:
        Eres el mejor vendedor de ${settings.businessName}.
        CATÁLOGO: ${JSON.stringify(catalogData)}
        INSTRUCCIÓN: Redacta la respuesta de WhatsApp perfecta en tono ${settings.preferredTone.toUpperCase()}.
        Si el dictado indica que hay que enviar fotos o imágenes de un producto, identifica el ID del producto y devuélvelo en un campo JSON llamado "images".
        
        RESPONDE ESTRICTAMENTE JSON:
        {
          "text": "mensaje redactado",
          "images": ["id_producto"]
        }
      `;

      const result = await callRoxtorAI(prompt, undefined, {
        model: 'gemini-1.5-pro',
        systemInstruction,
        responseMimeType: 'application/json'
      });

      if (result.error) throw new Error(result.suggested_reply);

      setDraftText(result.text || '');
      setDetectedImages(result.images || []);
    } catch (e) { alert("Error procesando texto."); } finally { setIsGeneratingText(false); }
  };

  const generateAudio = async () => {
    if (!draftText.trim()) return;
    setIsGeneratingAudio(true);
    try {
      const result = await callRoxtorAI(`Dilo muy amable: ${draftText}`, undefined, {
        model: "gemini-1.5-pro",
        modalities: ["AUDIO"]
      });

      if (result.error) throw new Error(result.suggested_reply);

      const base64Data = result.audioData;
      if (base64Data) {
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        setAudioBuffer(await decodeRawPCM(decodeBase64(base64Data), audioContextRef.current, 24000, 1));
      }
    } catch (e) { alert("Error audio."); } finally { setIsGeneratingAudio(false); }
  };

  const handleShareProductImage = (pid: string) => {
    const p = products.find(prod => prod.id === pid);
    if (!p) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(`Mira la foto de ${p.name}: 📸✨`)}`, '_blank');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-24">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-8 rounded-[3.5rem] shadow-sm border-2 border-slate-50">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-[#004ea1] text-white rounded-[2rem] flex items-center justify-center shadow-2xl rotate-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-400/20 animate-pulse" /><Headphones size={40} className="relative z-10" />
          </div>
          <div>
            <h2 className="text-4xl font-black text-[#000814] uppercase italic tracking-tighter leading-none">VOICE FACTORY</h2>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-2 italic flex items-center gap-2"><Sparkles size={14} className="text-blue-500" /> TALLER DE AUDIO PROFESIONAL</p>
          </div>
        </div>
        <button onClick={toggleMic} disabled={isConnectingMic} className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${isRecording ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-100 text-slate-500'}`}>{isRecording ? <MicOff size={16}/> : <Mic size={16}/>} {isRecording ? 'PARAR DICTADO' : 'GRABAR IDEAS'}</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-white border-4 border-slate-50 rounded-[3.5rem] p-10 shadow-sm space-y-8 transition-all hover:shadow-xl relative overflow-hidden">
            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 italic"><MessageCircle size={16} className="text-[#004ea1]" /> Dictado del Agente</label>
              <textarea placeholder="Indica el presupuesto o si hay que enviar fotos..." className="w-full h-32 bg-slate-50 border-2 border-transparent rounded-[2.5rem] p-8 text-sm font-medium outline-none focus:bg-white focus:border-blue-100 transition-all resize-none italic" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
              <button onClick={generateAIBasedText} disabled={isGeneratingText || !prompt} className="w-full bg-[#000814] text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest italic flex items-center justify-center gap-4 hover:bg-slate-800 disabled:opacity-30 shadow-2xl border-b-8 border-slate-900 active:translate-y-1">{isGeneratingText ? <RefreshCw size={20} className="animate-spin" /> : <Zap size={20} />} REDACTAR RESPUESTA PREMIUM</button>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 italic"><Edit3 size={16} className="text-emerald-500" /> Guion para WhatsApp</label>
              <textarea className="w-full h-44 bg-white border-4 border-slate-50 rounded-[2.5rem] p-8 text-sm font-black uppercase italic outline-none focus:border-emerald-500 transition-all resize-none shadow-inner" value={draftText} onChange={(e) => setDraftText(e.target.value)} />
              <div className="flex gap-4">
                <button onClick={generateAudio} disabled={isGeneratingAudio || !draftText} className="flex-1 bg-emerald-500 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest italic flex items-center justify-center gap-4 shadow-xl hover:bg-emerald-600 disabled:opacity-30 border-b-8 border-emerald-700">{isGeneratingAudio ? <RefreshCw size={20} className="animate-spin" /> : <Volume2 size={20} />} GENERAR NOTA DE VOZ</button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-10">
          <div className="bg-[#f0f2f5] rounded-[4rem] p-10 border-8 border-white shadow-2xl min-h-[600px] flex flex-col relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cartographer.png")' }}></div>
            <div className="flex items-center gap-4 bg-white p-4 rounded-[2rem] mb-10 border border-slate-200 shadow-sm relative z-10"><div className="w-12 h-12 bg-[#00a884] rounded-full flex items-center justify-center text-white shadow-lg"><MessageCircle size={24} /></div><div><p className="text-xs font-black text-slate-800 uppercase italic leading-none">Canal WhatsApp</p><p className="text-[9px] font-bold text-[#00a884] uppercase italic mt-1 flex items-center gap-1"><div className="w-1.5 h-1.5 bg-[#00a884] rounded-full animate-pulse" /> Vozify AI Activo</p></div></div>

            {detectedImages.length > 0 && (
              <div className="mb-6 space-y-3 relative z-10">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic ml-2">Fotos recomendadas para enviar:</p>
                 <div className="flex flex-wrap gap-2">
                    {detectedImages.map((pid, idx) => {
                      const p = products.find(prod => prod.id === pid);
                      return p && p.imageUrl ? (
                        <div key={`${pid}-${idx}`} className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg overflow-hidden relative group">
                           <img src={p.imageUrl} className="w-full h-full object-cover" />
                           <button onClick={() => handleShareProductImage(pid)} className="absolute inset-0 bg-[#00a884]/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"><Send size={16}/></button>
                        </div>
                      ) : null;
                    })}
                 </div>
              </div>
            )}

            {audioBuffer ? (
              <div className="self-start max-w-[95%] bg-white rounded-[2rem] rounded-tl-none p-6 shadow-xl space-y-6 animate-in slide-in-from-left-6 duration-500 relative z-10">
                <div className="flex items-center gap-6">
                  <button onClick={() => { if(isPlaying) { sourceNodeRef.current?.stop(); setIsPlaying(false); } else { const s = audioContextRef.current?.createBufferSource(); if(s && audioBuffer) { s.buffer = audioBuffer; s.connect(audioContextRef.current!.destination); s.onended = () => setIsPlaying(false); s.start(0); sourceNodeRef.current = s; setIsPlaying(true); } } }} className={`w-16 h-16 ${isPlaying ? 'bg-rose-500' : 'bg-[#00a884]'} text-white rounded-full flex items-center justify-center shadow-2xl`}>{isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1 fill-current" />}</button>
                  <div className="flex-1 space-y-3"><div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full bg-[#00a884] ${isPlaying ? 'w-full transition-all' : 'w-0'}`} style={{ transitionDuration: isPlaying ? `${audioBuffer.duration}s` : '0s', transitionTimingFunction: 'linear' }}></div></div><div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase italic"><span>{Math.round(audioBuffer.duration)} Segs</span><Waves size={14} className={isPlaying ? 'text-[#00a884] animate-pulse' : ''} /></div></div>
                </div>
                <div className="p-5 bg-[#dcf8c6] rounded-2xl border border-[#c1e8ba]"><p className="text-[11px] font-bold text-slate-800 italic leading-relaxed uppercase">"{draftText}"</p></div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-300 opacity-30 text-center space-y-6 relative z-10"><div className="w-32 h-32 border-8 border-dashed border-slate-200 rounded-full flex items-center justify-center"><Mic size={60} /></div><p className="text-[11px] font-black uppercase tracking-[0.3em] italic">Graba tu dictado</p></div>
            )}
            <div className="mt-auto bg-white/60 backdrop-blur-sm p-4 rounded-3xl border border-white/50 text-center relative z-10"><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Vozify Engine v3.5 • Visual Enabled</p></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppVoice;
