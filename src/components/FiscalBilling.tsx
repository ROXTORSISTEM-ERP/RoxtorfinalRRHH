import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { Order, AppSettings, FiscalInvoice, Agent } from '../types';
import { FileText, Printer, Search, MapPin, User, Hash, History, Download, Calendar, CreditCard } from 'lucide-react';

interface FiscalBillingProps {
  orders: Order[];
  settings: AppSettings;
  fiscalInvoices: FiscalInvoice[];
  onSaveInvoice: (invoice: FiscalInvoice) => void;
  currentAgentId: string | null;
  agents: Agent[];
  currentStoreId: string;
}

const FiscalBilling: React.FC<FiscalBillingProps> = ({ 
  orders, 
  settings, 
  fiscalInvoices, 
  onSaveInvoice, 
  currentAgentId, 
  agents,
  currentStoreId 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [address, setAddress] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentType, setPaymentType] = useState<'PAGO MOVIL' | 'EFECTIVO' | 'PUNTO'>('PAGO MOVIL');
  const [showHistory, setShowHistory] = useState(false);

  const filteredOrders = orders.filter(o => 
    o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customerCi.includes(searchTerm)
  ).slice(0, 5);

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setSelectedItems(order.items.map((_, idx: number) => idx.toString())); // Select all by default
    setSearchTerm('');
  };

  const toggleItem = (idx: string) => {
    setSelectedItems(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const generateFiscalPDF = () => {
    if (!selectedOrder || !invoiceNumber) {
      alert('Por favor ingrese el número de factura manual.');
      return;
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [140, 216] // Media Carta (Half Letter)
    });

    const bcvRate = settings.bcvRate || 1;
    const itemsToPrint = selectedOrder.items.filter((_, idx: number) => selectedItems.includes(idx.toString()));
    
    const totalUsdToPrint = itemsToPrint.reduce((acc: number, item: any) => acc + (item.quantity * item.priceUsd), 0);
    const totalBs = totalUsdToPrint * bcvRate;
    const baseImponible = totalBs / 1.16;
    const iva = totalBs - baseImponible;

    const currentAgent = agents.find(a => a.id === currentAgentId);

    // Estilo de escritura limpia
    doc.setFont('helvetica');
    
    // Espacio para encabezado pre-impreso (aprox 40mm)
    let y = 35;

    // Nro Factura y Fecha (Pequeño debajo de donde iría el logo pre-impreso)
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`FACTURA NRO: ${invoiceNumber}`, 125, y, { align: 'right' });
    y += 4;
    doc.text(`FECHA: ${invoiceDate}`, 125, y, { align: 'right' });
    y += 6;

    // Datos del Cliente
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`NOMBRE/RAZÓN SOCIAL: ${selectedOrder.customerName.toUpperCase()}`, 15, y);
    y += 5;
    doc.text(`C.I./RIF: ${selectedOrder.customerCi}`, 15, y);
    y += 5;
    doc.text(`TELÉFONO: ${selectedOrder.customerPhone}`, 15, y);
    y += 5;
    doc.text(`DIRECCIÓN: ${address.toUpperCase() || 'CIUDAD GUAYANA, BOLÍVAR'}`, 15, y);
    y += 5;
    doc.text(`FORMA DE PAGO: ${paymentType}`, 15, y);
    y += 10;

    // Línea separadora sutil
    doc.setDrawColor(200);
    doc.line(15, y, 125, y);
    y += 7;

    // Encabezados de tabla
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('CANT', 15, y);
    doc.text('DESCRIPCIÓN', 30, y);
    doc.text('P. UNIT (Bs)', 95, y, { align: 'right' });
    doc.text('TOTAL (Bs)', 125, y, { align: 'right' });
    y += 5;
    doc.setFont('helvetica', 'normal');

    // Items
    itemsToPrint.forEach((item: any) => {
      const unitPriceBs = (item.priceUsd * bcvRate);
      const itemTotalBs = (item.quantity * unitPriceBs);
      
      doc.text(item.quantity.toString(), 15, y);
      
      // Descripción con nro de orden pequeño
      const desc = `${item.name.toUpperCase()}`;
      doc.text(desc, 30, y);
      
      // Nro de orden en pequeño debajo
      doc.setFontSize(7);
      doc.text(`REF: ${selectedOrder.orderNumber}`, 30, y + 3);
      doc.setFontSize(9);

      doc.text(unitPriceBs.toLocaleString('es-VE', { minimumFractionDigits: 2 }), 95, y, { align: 'right' });
      doc.text(itemTotalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 }), 125, y, { align: 'right' });
      y += 8;
    });

    // Totales al final (dejar espacio si hay pocos items)
    y = Math.max(y + 10, 160);

    doc.line(80, y, 125, y);
    y += 7;

    doc.setFont('helvetica', 'bold');
    doc.text('BASE IMPONIBLE:', 80, y);
    doc.setFont('helvetica', 'normal');
    doc.text(baseImponible.toLocaleString('es-VE', { minimumFractionDigits: 2 }), 125, y, { align: 'right' });
    y += 5;

    doc.setFont('helvetica', 'bold');
    doc.text('I.V.A. (16%):', 80, y);
    doc.setFont('helvetica', 'normal');
    doc.text(iva.toLocaleString('es-VE', { minimumFractionDigits: 2 }), 125, y, { align: 'right' });
    y += 7;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL BS:', 80, y);
    doc.text(totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 }), 125, y, { align: 'right' });

    // Pie de página (Espacio para firmas o sellos pre-impresos)
    // Agente emisor discreto
    const agentName = currentAgent?.name || selectedOrder.issuingAgentName || 'SISTEMA';
    doc.setFontSize(6);
    doc.setFont('helvetica', 'italic');
    doc.text(`Generado por: ${agentName}`, 15, 205);
    
    // Guardar en historial
    const newInvoice: FiscalInvoice = {
      id: crypto.randomUUID(),
      orderId: selectedOrder.id,
      orderNumber: selectedOrder.orderNumber,
      invoiceNumber: invoiceNumber,
      date: invoiceDate,
      customerName: selectedOrder.customerName,
      customerCi: selectedOrder.customerCi,
      storeId: currentStoreId,
      paymentType: paymentType,
      items: itemsToPrint.map(i => ({ name: i.name, quantity: i.quantity, priceUsd: i.priceUsd })),
      totalUsd: totalUsdToPrint,
      bcvRate: bcvRate,
      baseImponibleBs: baseImponible,
      ivaBs: iva,
      totalBs: totalBs,
      agentId: currentAgentId || undefined,
      agentName: agentName
    };

    onSaveInvoice(newInvoice);
    doc.save(`Factura_${invoiceNumber}_${selectedOrder.orderNumber}.pdf`);
    
    // Reset form
    setInvoiceNumber('');
    setSelectedOrder(null);
    setSelectedItems([]);
  };

  const exportToExcel = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyInvoices = fiscalInvoices.filter(inv => 
      inv.date.startsWith(currentMonth) && inv.storeId === currentStoreId
    );

    if (monthlyInvoices.length === 0) {
      alert('No hay facturas en este mes para exportar.');
      return;
    }

    const data = monthlyInvoices.flatMap(inv => 
      inv.items.map(item => ({
        'FECHA': inv.date,
        'TIENDA': inv.storeId === 'P' ? 'PRINCIPAL' : 'CENTRO',
        'NRO FACTURA': inv.invoiceNumber,
        'RAZON SOCIAL': inv.customerName,
        'CEDULA/RIF': inv.customerCi,
        'PRODUCTO': item.name,
        'CANT': item.quantity,
        'BASE IMPONIBLE (Bs)': (item.quantity * item.priceUsd * inv.bcvRate / 1.16).toFixed(2),
        'IVA (Bs)': (item.quantity * item.priceUsd * inv.bcvRate * 0.16 / 1.16).toFixed(2),
        'TOTAL (Bs)': (item.quantity * item.priceUsd * inv.bcvRate).toFixed(2),
        'TIPO PAGO': inv.paymentType,
        'AGENTE': inv.agentName
      }))
    );

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    
    // Add header row for Roxtor
    XLSX.utils.sheet_add_aoa(ws, [["ROXTOR PZO - REPORTE MENSUAL DE FACTURACIÓN FISCAL"]], { origin: "A1" });
    
    XLSX.utils.book_append_sheet(wb, ws, "Facturas");
    XLSX.writeFile(wb, `Reporte_Fiscal_Roxtor_${currentMonth}.xlsx`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-white border-4 border-slate-50 rounded-[3.5rem] p-10 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg rotate-3">
              <FileText size={28} />
            </div>
            <div>
              <h3 className="text-3xl font-black text-[#000814] uppercase italic tracking-tighter leading-none">Facturación Fiscal</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2 italic">Emisión de Documentos Legales (Forma Libre)</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase italic transition-all flex items-center gap-2 ${
                showHistory ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <History size={16} />
              {showHistory ? 'Volver a Emisión' : 'Historial de Facturas'}
            </button>
            {!showHistory && (
              <button 
                onClick={exportToExcel}
                className="px-6 py-3 bg-[#000814] text-white rounded-2xl font-black text-[10px] uppercase italic transition-all flex items-center gap-2 hover:bg-slate-800"
              >
                <Download size={16} />
                Exportar Mes
              </button>
            )}
          </div>
        </div>

        {showHistory ? (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-[#000814] uppercase italic tracking-widest">Historial de Facturas Emitidas</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase italic">Mostrando facturas de este mes</p>
            </div>
            
            <div className="overflow-hidden rounded-[2rem] border-2 border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase italic">Fecha</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase italic">Nro Factura</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase italic">Cliente</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase italic">Pago</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase italic text-right">Total Bs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fiscalInvoices
                    .filter(inv => inv.storeId === currentStoreId)
                    .slice(0, 20)
                    .map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-6 text-[10px] font-bold text-slate-600 uppercase italic">{inv.date}</td>
                      <td className="p-6 text-[10px] font-black text-[#000814] uppercase italic">{inv.invoiceNumber}</td>
                      <td className="p-6">
                        <p className="text-[10px] font-black text-[#000814] uppercase italic">{inv.customerName}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase italic">{inv.customerCi}</p>
                      </td>
                      <td className="p-6">
                        <span className="text-[8px] font-black px-2 py-1 bg-slate-100 rounded-lg text-slate-600 uppercase italic">{inv.paymentType}</span>
                      </td>
                      <td className="p-6 text-right font-black text-emerald-600 italic text-xs">
                        Bs {inv.totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  {fiscalInvoices.filter(inv => inv.storeId === currentStoreId).length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-[10px] font-black text-slate-300 uppercase italic">No hay facturas registradas</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Buscador de Orden */}
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest ml-1">Buscar Orden de Servicio</label>
                <div className="relative">
                  <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-600 opacity-40" />
                  <input 
                    type="text" 
                    placeholder="Nro Orden, Nombre o Cédula..."
                    className="w-full bg-slate-50 border-2 border-transparent rounded-[2rem] pl-14 pr-6 py-5 text-slate-800 font-black uppercase text-xs focus:bg-white focus:border-emerald-600/20 outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {searchTerm && (
                <div className="bg-slate-50 rounded-[2rem] overflow-hidden border-2 border-slate-100 animate-in slide-in-from-top-4">
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map(order => (
                      <button
                        key={order.id}
                        onClick={() => handleSelectOrder(order)}
                        className="w-full p-6 text-left hover:bg-white transition-all border-b border-slate-100 last:border-none flex justify-between items-center group"
                      >
                        <div>
                          <p className="font-black text-[#000814] uppercase text-xs italic group-hover:text-emerald-600 transition-colors">#{order.orderNumber} - {order.customerName}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase italic">{order.customerCi}</p>
                        </div>
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg italic">${order.totalUsd.toFixed(2)}</span>
                      </button>
                    ))
                  ) : (
                    <div className="p-6 text-center text-[10px] font-black text-slate-300 uppercase italic">No se encontraron órdenes</div>
                  )}
                </div>
              )}

              {selectedOrder && (
                <div className="bg-emerald-50/50 border-2 border-emerald-100 rounded-[2.5rem] p-8 space-y-6 animate-in zoom-in-95">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <Hash size={20} className="text-emerald-600" />
                      <h4 className="font-black text-[#000814] uppercase italic">Orden Seleccionada: {selectedOrder.orderNumber}</h4>
                    </div>
                    <button onClick={() => setSelectedOrder(null)} className="text-[10px] font-black text-red-500 uppercase italic hover:underline">Cambiar</button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-2xl shadow-sm">
                      <p className="text-[8px] font-black text-slate-400 uppercase italic mb-1">Total Orden ($)</p>
                      <p className="text-xl font-black text-[#000814] italic">${selectedOrder.totalUsd.toFixed(2)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm">
                      <p className="text-[8px] font-black text-slate-400 uppercase italic mb-1">Total en Bs (Tasa {settings.bcvRate})</p>
                      <p className="text-xl font-black text-emerald-600 italic">Bs {(selectedOrder.totalUsd * settings.bcvRate).toLocaleString('es-VE')}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-slate-400 uppercase italic ml-1">Seleccionar Productos</label>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item: any, idx: number) => (
                        <div 
                          key={idx}
                          onClick={() => toggleItem(idx.toString())}
                          className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedItems.includes(idx.toString()) 
                            ? 'bg-white border-emerald-500 shadow-sm' 
                            : 'bg-slate-100/50 border-transparent opacity-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded flex items-center justify-center border-2 ${
                              selectedItems.includes(idx.toString()) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'
                            }`}>
                              {selectedItems.includes(idx.toString()) && <FileText size={12} />}
                            </div>
                            <span className="text-[10px] font-black text-[#000814] uppercase italic">{item.name}</span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 italic">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Datos Fiscales */}
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-[3rem] p-8 space-y-6">
                <h4 className="text-sm font-black text-[#000814] uppercase italic tracking-widest flex items-center gap-3">
                  <User size={18} className="text-emerald-600" /> Datos de Facturación
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase italic ml-1">Nro Factura (Manual)</label>
                    <div className="relative">
                      <Hash size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-600 opacity-40" />
                      <input 
                        type="text" 
                        placeholder="0001"
                        className="w-full bg-white border-2 border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-slate-800 font-black uppercase text-xs focus:border-emerald-600/20 outline-none transition-all"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase italic ml-1">Fecha Emisión</label>
                    <div className="relative">
                      <Calendar size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-600 opacity-40" />
                      <input 
                        type="date" 
                        className="w-full bg-white border-2 border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-slate-800 font-black uppercase text-xs focus:border-emerald-600/20 outline-none transition-all"
                        value={invoiceDate}
                        onChange={(e) => setInvoiceDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase italic ml-1">Tipo de Pago</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['PAGO MOVIL', 'EFECTIVO', 'PUNTO'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setPaymentType(type as any)}
                        className={`py-3 rounded-xl text-[9px] font-black uppercase italic transition-all border-2 ${
                          paymentType === type 
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' 
                          : 'bg-white border-slate-100 text-slate-400 hover:border-emerald-200'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase italic ml-1">Nombre o Razón Social</label>
                    <input 
                      type="text" 
                      readOnly
                      className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 text-slate-800 font-black uppercase text-xs outline-none opacity-70"
                      value={selectedOrder?.customerName || ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase italic ml-1">C.I. / RIF</label>
                    <input 
                      type="text" 
                      readOnly
                      className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 text-slate-800 font-black uppercase text-xs outline-none opacity-70"
                      value={selectedOrder?.customerCi || ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase italic ml-1">Dirección Fiscal (Opcional)</label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-600 opacity-40" />
                      <input 
                        type="text" 
                        placeholder="Ej: Av. Las Américas, Puerto Ordaz"
                        className="w-full bg-white border-2 border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-slate-800 font-black uppercase text-xs focus:border-emerald-600/20 outline-none transition-all"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button 
                disabled={!selectedOrder || !invoiceNumber}
                onClick={generateFiscalPDF}
                className={`w-full py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3 shadow-2xl ${
                  selectedOrder && invoiceNumber
                  ? 'bg-[#000814] text-white hover:bg-slate-800 border-b-8 border-slate-700 active:translate-y-1 active:border-b-4' 
                  : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                }`}
              >
                <Printer size={20} />
                GENERAR FACTURA FISCAL
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Vista Previa de Cálculo */}
      {selectedOrder && selectedItems.length > 0 && (
        <div className="bg-white border-4 border-slate-50 rounded-[3.5rem] p-10 shadow-sm animate-in slide-in-from-bottom-6">
          <h4 className="text-lg font-black text-[#000814] uppercase italic mb-8 tracking-tighter">Desglose Fiscal Estimado (Selección)</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 bg-slate-50 rounded-[2rem] border-2 border-transparent hover:border-emerald-100 transition-all">
              <p className="text-[10px] font-black text-slate-400 uppercase italic mb-2">Base Imponible</p>
              <p className="text-2xl font-black text-[#000814] italic">
                Bs {( (selectedOrder.items.filter((_, idx: number) => selectedItems.includes(idx.toString())).reduce((acc: number, item: any) => acc + (item.quantity * item.priceUsd), 0) * settings.bcvRate) / 1.16).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-8 bg-slate-50 rounded-[2rem] border-2 border-transparent hover:border-emerald-100 transition-all">
              <p className="text-[10px] font-black text-slate-400 uppercase italic mb-2">I.V.A. (16%)</p>
              <p className="text-2xl font-black text-emerald-600 italic">
                Bs {( (selectedOrder.items.filter((_, idx: number) => selectedItems.includes(idx.toString())).reduce((acc: number, item: any) => acc + (item.quantity * item.priceUsd), 0) * settings.bcvRate) - ((selectedOrder.items.filter((_, idx: number) => selectedItems.includes(idx.toString())).reduce((acc: number, item: any) => acc + (item.quantity * item.priceUsd), 0) * settings.bcvRate) / 1.16)).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-8 bg-[#000814] rounded-[2rem] shadow-xl">
              <p className="text-[10px] font-black text-slate-400 uppercase italic mb-2">Total Factura</p>
              <p className="text-2xl font-black text-white italic">
                Bs {(selectedOrder.items.filter((_, idx: number) => selectedItems.includes(idx.toString())).reduce((acc: number, item: any) => acc + (item.quantity * item.priceUsd), 0) * settings.bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="mt-8 p-6 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
              <FileText size={20} />
            </div>
            <p className="text-[10px] font-bold text-amber-800 uppercase italic leading-relaxed">
              Nota: Este formato está optimizado para impresión en <span className="font-black">Forma Libre (Media Carta)</span>. 
              Asegúrese de que la impresora esté configurada para papel de 14cm x 21.6cm. 
              No se incluye encabezado ni pie de página para respetar el diseño pre-impreso de su papelería legal.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FiscalBilling;
