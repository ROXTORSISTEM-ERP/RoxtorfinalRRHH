import React, { useState, useRef } from 'react';
import { Order, AppSettings, Workshop } from '../types';
import { Printer, X, Instagram, Phone, MessageCircle, CloudUpload, Loader2, CheckCircle, Scissors } from 'lucide-react';
import html2canvas from 'html2canvas';
import { uploadToSupabaseStorage } from '../utils/storage';
import { supabase } from '../utils/supabase';

interface Props {
  order: Order;
  settings: AppSettings;
  workshops: Workshop[];
  onClose: () => void;
  onUpdateOrder?: (order: Order) => void;
  onResetForm?: () => void;
}

const OrderReceipt: React.FC<Props> = ({ order, settings, workshops, onClose, onUpdateOrder, onResetForm }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(!!order.receiptUrl);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Validación de seguridad para evitar el crash
  if (!order) return null;

  const bcvRate = order.bcvRate || settings?.bcvRate || 0;
  const totalUsd = Number(order.totalUsd) || 0;
  const abonoUsd = Number(order.abonoUsd) || 0;
  const restanteUsd = Math.max(0, totalUsd - abonoUsd);
  
  const isNE = order.orderNumber?.startsWith('NE');
  const docColorClass = isNE ? 'bg-[#004ea1]' : 'bg-[#000814]';
  const docBorderClass = isNE ? 'border-[#004ea1]' : 'border-[#000814]';

  // --- SOLUCIÓN AL ERROR: Usamos 'order' directamente ---
  const triggerAutoSave = () => {
    if (!saveSuccess && !isSaving) {
      setTimeout(() => handleSaveAndExit(), 500);
    }
  };

  const handleSendToClient = () => {
    triggerAutoSave();
    const techTallas = order.technicalDetails?.tallas_registro || 'DETALLADO EN NOTA';
    const cleanPhone = order.customerPhone.replace(/\D/g, '');
    const clientPhone = cleanPhone.startsWith('58') ? cleanPhone : `58${cleanPhone}`;
    
    // Extraemos detalles de diseño para el cliente
    const tela = order.technicalDetails?.tipo_tela || 'MICRODURAZNO';
    const color = order.technicalDetails?.color_prenda || 'VER ARTE';
    const diseño = order.technicalDetails?.resumen_diseno || 'ESTÁNDAR / SEGÚN REFERENCIA';

    const message = `*ORDEN ROXTOR #${order.orderNumber}* 🦖\n` +
      `¡Hola *${order.customerName.split(' ')[0]}*! Tu orden está registrada.\n` +
      `--------------------------------\n` +
      `📦 *PEDIDO:* ${order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}\n` +
      `📏 *TALLAS:* ${techTallas}\n\n` +
      `🎨 *DISEÑO Y DETALLES:* \n` +
      `• Tela: ${tela}\n` +
      `• Color: ${color}\n` +
      `• Notas: ${diseño}\n\n` +
      `💰 *FINANZAS:* \n` +
      `• Total: $${totalUsd.toFixed(2)}\n` +
      `• Abono: $${abonoUsd.toFixed(2)}\n` +
      `• *Restante: $${restanteUsd.toFixed(2)}*\n` +
      `--------------------------------\n` +
      `📅 *FECHA DE ENTREGA:* ${order.deliveryDate}\n\n` +
      `*Gracias por preferir ROXTOR" 🔥`;

    window.open(`https://wa.me/${clientPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleSendToWorkshop = () => {
    triggerAutoSave();
    const workshopName = order.technicalDetails?.assigned_workshop_name;
    
    // Si no hay taller o es interno, enviamos a tu número de respaldo de Roxtor
    const aliado = workshops.find(w => w.name === workshopName);
    const rawPhone = aliado?.phone || "584249635252"; 
    const tallerPhone = rawPhone.replace(/\D/g, '').startsWith('58') ? rawPhone.replace(/\D/g, '') : `58${rawPhone.replace(/\D/g, '')}`;

    // LÓGICA DE FECHA LÍMITE: Restar 2 días para que el taller entregue antes que el cliente
    let workshopDeliveryDate = 'POR DEFINIR';
    if (order.deliveryDate) {
      const dateParts = order.deliveryDate.split('/');
      const d = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
      d.setDate(d.getDate() - 2);
      workshopDeliveryDate = d.toLocaleDateString('es-VE', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });
    }

    const message = `*ORDEN DE PRODUCCIÓN #${order.orderNumber}* 🧵\n` +
      `📍 *TALLER:* ${(workshopName || 'POR ASIGNAR').toUpperCase()}\n` +
      `--------------------------------\n` +
      `📏 *TALLAS:* ${order.technicalDetails?.tallas_registro || 'VER NOTA'}\n\n` +
      `🎨 *DETALLES TÉCNICOS:*\n` +
      `• *Tela:* ${order.technicalDetails?.tipo_tela || 'MICRODURAZNO'}\n` +
      `• *Color:* ${order.technicalDetails?.color_prenda || 'VER ARTE'}\n` +
      `• *Notas:* ${order.technicalDetails?.resumen_diseno || 'SIN OBSERVACIONES'}\n\n` +
      `📅 *FECHA LÍMITE TALLER:* ${workshopDeliveryDate} (URGENTE)\n` +
      `--------------------------------\n` +
      `🔥 *ROXTOR ERP - CONTROL DE CALIDAD*`;

    window.open(`https://wa.me/${tallerPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleSaveAndExit = async () => {
    if (!receiptRef.current || isSaving) return;
    setIsSaving(true);
    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 2, useCORS: true });
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.8));
      let imageUrl = order.receiptUrl;
      
      if (blob && settings.cloudSync?.enabled) {
        const uploadedUrl = await uploadToSupabaseStorage(blob, 'roxtor_receipts', `receipt_${order.orderNumber}.jpg`, 
          { apiUrl: settings.cloudSync.apiUrl, apiKey: settings.cloudSync.apiKey });
        if (uploadedUrl) imageUrl = uploadedUrl;
      }
      
      if (supabase) {
        await supabase.from('ordenes').upsert({ orderNumber: order.orderNumber, receiptUrl: imageUrl }, { onConflict: 'orderNumber' });
      }
      
      setSaveSuccess(true);
      if (onUpdateOrder) onUpdateOrder({ ...order, receiptUrl: imageUrl });
      if (onResetForm) onResetForm();
      onClose();
    } catch (err) { 
      console.error("Error en Roxtor Save:", err); 
    } finally { 
      setIsSaving(false); 
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#000814]/95 backdrop-blur-xl flex items-center justify-center p-2">
      <div className="bg-white w-full max-w-5xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[98vh]">
        
        {/* Toolbar Blindada */}
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <div className="flex gap-2">
            <button onClick={handleSendToClient} className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-black text-[10px] flex items-center gap-2 italic">
              <MessageCircle size={14} /> CLIENTE
            </button>
            <button onClick={handleSendToWorkshop} className={`${order.technicalDetails?.assigned_workshop_name ? 'bg-rose-600' : 'bg-slate-300'} text-white px-4 py-2 rounded-xl font-black text-[10px] flex items-center gap-2 italic`}>
              <Scissors size={14} /> {order.technicalDetails?.assigned_workshop_name || 'SIN TALLER'}
            </button>
          </div>
          
          <div className="flex gap-2">
            <button onClick={handleSaveAndExit} disabled={isSaving || saveSuccess} className={`${saveSuccess ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-600 text-white'} px-4 py-2 rounded-xl font-black text-[10px] flex items-center gap-2`}>
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : (saveSuccess ? <CheckCircle size={14} /> : <CloudUpload size={14} />)}
              {saveSuccess ? 'REGISTRADO' : 'REGISTRAR Y CERRAR'}
            </button>
            <button onClick={() => { triggerAutoSave(); window.print(); }} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-black text-[10px] flex items-center gap-2 italic"><Printer size={14} /> IMPRIMIR</button>
            <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white border flex items-center justify-center text-slate-300 hover:text-red-500"><X size={20} /></button>
          </div>
        </div>

        {/* El Recibo (Cuerpo) */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100">
          <div id="printable-order" ref={receiptRef} className="bg-white mx-auto w-[140mm] min-h-[216mm] p-[8mm] text-[#000814] font-sans relative flex flex-col shadow-lg">
            
            {/* Header con Estética Roxtor */}
            <div className={`flex justify-between items-center border-b-[4px] ${docBorderClass} pb-4 mb-4`}>
              <div className="flex items-center gap-4">
                <img src={settings?.logoUrl} alt="Logo" className="h-14 w-auto object-contain" />
                <div>
                  <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">{settings?.businessName}</h1>
                  <div className="flex flex-col gap-1 mt-1">
                    <p className="text-[10px] font-black flex items-center gap-1"><Phone size={8}/> {settings?.companyPhone}</p>
                    <p className="text-[10px] font-black flex items-center gap-1 text-rose-600"><Instagram size={8}/> SÍGUENOS EN ROXTOR.PZO</p>
                  </div>
                </div>
              </div>
              <div className="text-right leading-none">
                <p className="text-2xl font-black italic text-rose-600 tracking-tighter">#{order.orderNumber}</p>
                <p className="text-[9px] font-black text-slate-400 mt-1 uppercase italic">{order.issueDate}</p>
              </div>
            </div>

            {/* Ficha Cliente y Entrega */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 italic">
                <p className="text-[8px] font-black text-slate-400 uppercase">CLIENTE</p>
                <p className="text-sm font-black uppercase">{order.customerName}</p>
                <p className="text-[11px] font-bold text-slate-500">{order.customerPhone}</p>
              </div>
              <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100 italic text-right">
                <p className="text-[8px] font-black text-rose-400 uppercase">FECHA DE ENTREGA</p>
                <p className="text-xl font-black text-rose-600 tracking-tighter">{order.deliveryDate}</p>
              </div>
            </div>

            {/* Tabla de Items */}
            <div className={`mb-4 rounded-2xl border-2 ${docBorderClass} overflow-hidden`}>
              <table className="w-full">
                <thead className={`${docColorClass} text-white text-[9px] font-black italic uppercase`}>
                  <tr><th className="p-3 text-left">CANT</th><th className="p-3 text-left">PRODUCTO</th><th className="p-3 text-right">SUBTOTAL</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 italic font-black text-sm">
                  {order.items?.map((item, idx) => (
                    <tr key={idx}><td className="p-3 text-center">{item.quantity}</td><td className="p-3 uppercase">{item.name}</td><td className="p-3 text-right">${((item.priceUsd || 0) * (item.quantity || 0)).toFixed(2)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Ficha Técnica (Tallas/Tela) */}
            <div className={`mb-4 rounded-2xl border-2 ${docBorderClass} overflow-hidden italic`}>
              <div className={`${docColorClass} p-2 px-4 text-white text-[9px] font-black uppercase flex justify-between`}>
                <span>Especificaciones Técnicas</span>
                {order.technicalDetails?.assigned_workshop_name && <span className="bg-rose-600 px-2 rounded">📍 {order.technicalDetails.assigned_workshop_name}</span>}
              </div>
              <div className="p-4 grid grid-cols-2 gap-4 border-b border-slate-50">
                <div><p className="text-[8px] font-black text-slate-400">TELA</p><p className="text-[11px] font-black uppercase">{order.technicalDetails?.tipo_tela}</p></div>
                <div className="text-right"><p className="text-[8px] font-black text-slate-400">COLOR</p><p className="text-[11px] font-black uppercase">{order.technicalDetails?.color_prenda}</p></div>
              </div>
              <div className="p-4 bg-slate-50/50">
                <p className="text-[8px] font-black text-rose-500 mb-1 uppercase">TALLAS REGISTRADAS</p>
                <p className="text-[11px] font-black uppercase leading-tight">{order.technicalDetails?.tallas_registro}</p>
              </div>
            </div>

            <div className="flex-1"></div>

            {/* Bloque Financiero */}
            <div className="grid grid-cols-2 gap-4 items-end mb-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 italic">
                <p className="text-[8px] font-black text-slate-400 uppercase">PAGO: {order.paymentMethod}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">REF: {order.paymentReference || 'S/R'}</p>
              </div>
              <div className={`${docColorClass} rounded-2xl p-4 text-white shadow-xl italic font-black uppercase`}>
                <div className="flex justify-between text-[10px] opacity-60"><span>TOTAL</span> <span>${totalUsd.toFixed(2)}</span></div>
                <div className="flex justify-between text-[10px] opacity-60"><span>ABONO</span> <span>-${abonoUsd.toFixed(2)}</span></div>
                <div className="h-px bg-white/20 my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-xs">RESTA</span>
                  <span className="text-2xl tracking-tighter">${restanteUsd.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 space-y-1">
              <p className="text-[10px] font-black text-rose-600 text-center uppercase italic">
                Roxtor Inversiones C.A. - Sin abono del 50% no se procesa orden.
              </p>
              <p className="text-[10px] font-black text-rose-600 text-center uppercase italic">
                Sin cambios tras aprobación de diseño. ¡Gracias por su confianza!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderReceipt;
