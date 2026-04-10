
import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Package, 
  Truck, 
  Scissors, 
  UserCheck, 
  Settings, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Download, 
  FileSpreadsheet, 
  Save,
  PieChart as PieChartIcon,
  TrendingUp,
  DollarSign,
  Clock,
  Layers
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

import { Product } from '../types';

interface Props {
  products: Product[];
  onSaveToInventory?: (data: any) => void;
}

const STAGES = [
  { id: 1, name: 'Identificación', icon: <Package size={20} /> },
  { id: 2, name: 'Materia Prima', icon: <Truck size={20} /> },
  { id: 3, name: 'Personalización', icon: <Scissors size={20} /> },
  { id: 4, name: 'Mano de Obra', icon: <UserCheck size={20} /> },
  { id: 5, name: 'Costos Operativos', icon: <Settings size={20} /> },
  { id: 6, name: 'Resultado Final', icon: <CheckCircle2 size={20} /> },
];

const CostEngineering: React.FC<Props> = ({ onSaveToInventory, products }) => {
  const [currentStage, setCurrentStage] = useState(1);
  const [formData, setFormData] = useState({
    // Etapa 1
    selectedProductId: '',
    productName: '',
    productType: 'franelas',
    customProductType: '',
    
    // Etapa 2
    purchasePrice: 0,
    transportCost: 0,
    taxes: 0,
    otherCosts: 0,
    // Rendimiento de tela
    fabricPricePerMeter: 0,
    fabricYieldPerMeter: 1, // Cuanto rinde 1 metro
    
    // Etapa 3
    technique: 'bordado' as 'bordado' | 'dtf' | 'sublimacion' | 'vinil',
    // Bordado
    stitches: 0,
    costPerThousandStitches: 1,
    embroideryCommissionPercent: 10, // 10% para bordadores
    // DTF / Sublimacion
    width: 0,
    height: 0,
    costPerCm2: 0.01,
    // Vinil
    rollPrice: 0,
    rollMeters: 0,
    metersUsed: 0,
    
    // Etapa 4
    laborType: 'hourly' as 'hourly' | 'piecework',
    weeklySalary: 0,
    weeklyHours: 40,
    productionTimeMinutes: 0,
    laborCostPerPiece: 0, // Pago por destajo
    
    // Etapa 5
    monthlyRent: 0,
    monthlyElectricity: 0,
    monthlyInternet: 0,
    monthlyMaintenance: 0,
    monthlySoftware: 0,
    monthlyOthers: 0,
    monthlyUnitsProduced: 1,
  });

  // Cálculos
  const calculations = useMemo(() => {
    // Etapa 2: Materia Prima
    let rawMaterialCost = formData.purchasePrice + formData.transportCost + formData.taxes + formData.otherCosts;
    
    // Si se especifica precio por metro y rendimiento
    if (formData.fabricPricePerMeter > 0 && formData.fabricYieldPerMeter > 0) {
      rawMaterialCost += (formData.fabricPricePerMeter / formData.fabricYieldPerMeter);
    }

    // Etapa 3: Personalización
    let personalizationCost = 0;
    if (formData.technique === 'bordado') {
      const baseBordadoCost = (formData.stitches / 1000) * formData.costPerThousandStitches;
      const commission = baseBordadoCost * (formData.embroideryCommissionPercent / 100);
      personalizationCost = baseBordadoCost + commission;
    } else if (formData.technique === 'dtf' || formData.technique === 'sublimacion') {
      const area = formData.width * formData.height;
      personalizationCost = area * formData.costPerCm2;
    } else if (formData.technique === 'vinil') {
      personalizationCost = formData.rollMeters > 0 ? (formData.rollPrice / formData.rollMeters) * formData.metersUsed : 0;
    }

    // Etapa 4: Mano de Obra
    let laborCost = 0;
    if (formData.laborType === 'hourly') {
      const costPerHour = formData.weeklyHours > 0 ? formData.weeklySalary / formData.weeklyHours : 0;
      laborCost = (formData.productionTimeMinutes / 60) * costPerHour;
    } else {
      laborCost = formData.laborCostPerPiece;
    }

    // Etapa 5: Costos Operativos (Fijos al mes desglosados entre todos los productos)
    const totalMonthlyExpenses = formData.monthlyRent + formData.monthlyElectricity + formData.monthlyInternet + formData.monthlyMaintenance + formData.monthlySoftware + formData.monthlyOthers;
    const operatingCostPerUnit = formData.monthlyUnitsProduced > 0 ? totalMonthlyExpenses / formData.monthlyUnitsProduced : 0;

    // Etapa 6
    const totalUnitCost = rawMaterialCost + personalizationCost + laborCost + operatingCostPerUnit;
    const minProfitablePrice = totalUnitCost * 1.3; // 30% margen mínimo sugerido

    return {
      rawMaterialCost,
      personalizationCost,
      laborCost,
      operatingCostPerUnit,
      totalUnitCost,
      minProfitablePrice,
      totalMonthlyExpenses
    };
  }, [formData]);

  const chartData = [
    { name: 'Materia Prima', value: calculations.rawMaterialCost },
    { name: 'Personalización', value: calculations.personalizationCost },
    { name: 'Mano de Obra', value: calculations.laborCost },
    { name: 'Costos Operativos', value: calculations.operatingCostPerUnit },
  ].filter(d => d.value > 0);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  const handleNext = () => setCurrentStage(prev => Math.min(prev + 1, 6));
  const handleBack = () => setCurrentStage(prev => Math.max(prev - 1, 1));

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Análisis de Costos ROXTOR', 20, 20);
    doc.setFontSize(12);
    doc.text(`Producto: ${formData.productName}`, 20, 30);
    doc.text(`Tipo: ${formData.productType}`, 20, 40);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 50);
    
    doc.line(20, 55, 190, 55);
    
    doc.text('Desglose de Costos Unitarios:', 20, 65);
    doc.text(`- Materia Prima: $${calculations.rawMaterialCost.toFixed(2)}`, 30, 75);
    doc.text(`- Personalización: $${calculations.personalizationCost.toFixed(2)}`, 30, 85);
    doc.text(`- Mano de Obra: $${calculations.laborCost.toFixed(2)}`, 30, 95);
    doc.text(`- Costos Operativos: $${calculations.operatingCostPerUnit.toFixed(2)}`, 30, 105);
    
    doc.setFontSize(14);
    doc.text(`COSTO TOTAL UNITARIO: $${calculations.totalUnitCost.toFixed(2)}`, 20, 120);
    doc.text(`PRECIO MÍNIMO RENTABLE (30%): $${calculations.minProfitablePrice.toFixed(2)}`, 20, 130);
    
    doc.setFontSize(10);
    doc.text('ERP ROXTOR - Trazabilidad Total', 20, 280);
    
    doc.save(`Costo_${formData.productName || 'Producto'}.pdf`);
  };

  const exportToExcel = () => {
    const data = [
      ['ANÁLISIS DE COSTOS ROXTOR'],
      ['Producto', formData.productName],
      ['Tipo', formData.productType],
      ['Fecha', new Date().toLocaleDateString()],
      [],
      ['CONCEPTO', 'MONTO'],
      ['Materia Prima', calculations.rawMaterialCost],
      ['Personalización', calculations.personalizationCost],
      ['Mano de Obra', calculations.laborCost],
      ['Costos Operativos', calculations.operatingCostPerUnit],
      ['COSTO TOTAL UNITARIO', calculations.totalUnitCost],
      ['PRECIO MÍNIMO RENTABLE', calculations.minProfitablePrice]
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Costos");
    XLSX.writeFile(wb, `Costo_${formData.productName || 'Producto'}.xlsx`);
  };

  return (
    <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border-8 border-slate-50 italic">
      {/* Header */}
      <div className="bg-[#000814] p-10 text-white flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl rotate-3">
            <Calculator size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Ingeniería de Costos</h2>
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.3em] mt-2 italic">Asistente de Rentabilidad Real ROXTOR</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={exportToExcel} className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all"><FileSpreadsheet size={20}/></button>
          <button onClick={exportToPDF} className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all"><Download size={20}/></button>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex border-b border-slate-100 bg-slate-50/50 overflow-x-auto no-scrollbar">
        {STAGES.map((stage) => (
          <div 
            key={stage.id}
            className={`flex-1 min-w-[120px] py-6 flex flex-col items-center gap-2 transition-all relative ${currentStage === stage.id ? 'bg-white' : 'opacity-40'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${currentStage === stage.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-200 text-slate-500'}`}>
              {stage.id}
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">{stage.name}</span>
            {currentStage === stage.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600" />}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="p-12 max-w-4xl mx-auto min-h-[500px]">
        {currentStage === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black uppercase italic text-slate-800">Identificación del Producto</h3>
              <p className="text-xs font-bold text-slate-400 uppercase italic">Define el elemento a costear o selecciona del catálogo</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 italic ml-2">Seleccionar del Catálogo Maestro</label>
              <select 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-black uppercase text-xs outline-none focus:border-blue-500 transition-all"
                value={formData.selectedProductId}
                onChange={(e) => {
                  const product = products.find(p => p.id === e.target.value);
                  if (product) {
                    setFormData({
                      ...formData,
                      selectedProductId: product.id,
                      productName: product.name,
                      productType: product.category?.toLowerCase() || 'otros',
                      purchasePrice: product.priceRetail || 0
                    });
                  } else {
                    setFormData({...formData, selectedProductId: ''});
                  }
                }}
              >
                <option value="">-- NUEVO PRODUCTO --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 italic ml-2">Nombre del Producto</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-black uppercase text-xs outline-none focus:border-blue-500 transition-all"
                  placeholder="Ej: Franela Microdurazno Blanca"
                  value={formData.productName}
                  onChange={(e) => setFormData({...formData, productName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 italic ml-2">Tipo de Producto</label>
                <select 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-black uppercase text-xs outline-none focus:border-blue-500 transition-all"
                  value={formData.productType}
                  onChange={(e) => setFormData({...formData, productType: e.target.value})}
                >
                  <option value="franelas">Franelas</option>
                  <option value="uniformes">Uniformes</option>
                  <option value="jersey deportivo">Jersey Deportivo</option>
                  <option value="gorra">Gorra</option>
                  <option value="servicio de bordado">Servicio de Bordado</option>
                  <option value="servicio dtf">Servicio DTF</option>
                  <option value="servicio sublimacion">Servicio Sublimación</option>
                  <option value="vinil textil">Vinil Textil</option>
                  <option value="otros">Otros (Manual)</option>
                </select>
              </div>
              {formData.productType === 'otros' && (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 italic ml-2">Especificar Tipo de Producto</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-black uppercase text-xs outline-none focus:border-blue-500 transition-all"
                    placeholder="Escribe el tipo de producto..."
                    value={formData.customProductType}
                    onChange={(e) => setFormData({...formData, customProductType: e.target.value})}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {currentStage === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black uppercase italic text-slate-800">Costo de Materia Prima</h3>
              <p className="text-xs font-bold text-slate-400 uppercase italic">Insumos base y logística de compra</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 italic ml-2">Precio de Compra Unitario ($)</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-black text-xl outline-none focus:border-blue-500 transition-all"
                  value={formData.purchasePrice || ''}
                  onChange={(e) => setFormData({...formData, purchasePrice: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 italic ml-2">Transporte / Flete ($)</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-black text-xl outline-none focus:border-blue-500 transition-all"
                  value={formData.transportCost || ''}
                  onChange={(e) => setFormData({...formData, transportCost: parseFloat(e.target.value) || 0})}
                />
              </div>
              
              <div className="md:col-span-2 p-6 bg-slate-50 rounded-3xl border-2 border-slate-100 space-y-6">
                <p className="text-[10px] font-black text-slate-400 uppercase italic">Rendimiento de Tela (Opcional)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 italic ml-2">Precio por Metro de Tela ($)</label>
                    <input 
                      type="number" 
                      className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 font-black text-xl outline-none focus:border-blue-500 transition-all"
                      value={formData.fabricPricePerMeter || ''}
                      onChange={(e) => setFormData({...formData, fabricPricePerMeter: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 italic ml-2">Rendimiento (Unidades por Metro)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 font-black text-xl outline-none focus:border-blue-500 transition-all"
                      placeholder="Ej: 1.5 (1 franela y media)"
                      value={formData.fabricYieldPerMeter || ''}
                      onChange={(e) => setFormData({...formData, fabricYieldPerMeter: parseFloat(e.target.value) || 1})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 italic ml-2">Impuestos / Aranceles ($)</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-black text-xl outline-none focus:border-blue-500 transition-all"
                  value={formData.taxes || ''}
                  onChange={(e) => setFormData({...formData, taxes: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 italic ml-2">Otros Costos Asociados ($)</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-black text-xl outline-none focus:border-blue-500 transition-all"
                  value={formData.otherCosts || ''}
                  onChange={(e) => setFormData({...formData, otherCosts: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
            <div className="bg-blue-50 p-8 rounded-[2rem] border-2 border-blue-100 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-blue-600 italic">Costo Real Materia Prima:</span>
              <span className="text-3xl font-black text-blue-700 italic">${calculations.rawMaterialCost.toFixed(2)}</span>
            </div>
          </div>
        )}

        {currentStage === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black uppercase italic text-slate-800">Costo de Personalización</h3>
              <p className="text-xs font-bold text-slate-400 uppercase italic">Técnica aplicada al producto</p>
            </div>
            
            <div className="flex bg-slate-100 p-2 rounded-2xl">
              {['bordado', 'dtf', 'sublimacion', 'vinil'].map((t) => (
                <button 
                  key={t}
                  onClick={() => setFormData({...formData, technique: t as any})}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase italic transition-all ${formData.technique === t ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {formData.technique === 'bordado' && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 italic ml-2">Cantidad de Puntadas</label>
                    <input 
                      type="number" 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-black text-xl outline-none focus:border-blue-500 transition-all"
                      value={formData.stitches || ''}
                      onChange={(e) => setFormData({...formData, stitches: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 italic ml-2">Costo por 1000 Puntadas ($)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-black text-xl outline-none focus:border-blue-500 transition-all"
                      value={formData.costPerThousandStitches || ''}
                      onChange={(e) => setFormData({...formData, costPerThousandStitches: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 italic ml-2">Comisión Bordador (%)</label>
                    <input 
                      type="number" 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-black text-xl outline-none focus:border-blue-500 transition-all"
                      value={formData.embroideryCommissionPercent || ''}
                      onChange={(e) => setFormData({...formData, embroideryCommissionPercent: parseFloat(e.target.value) || 0})}
                    />
                    <p className="text-[8px] font-bold text-slate-400 uppercase italic mt-1">* Norma Roxtor: 10% de comisión por pieza bordada.</p>
                  </div>
                </>
              )}

              {(formData.technique === 'dtf' || formData.technique === 'sublimacion') && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 italic ml-2">Ancho del Diseño (cm)</label>
                    <input 
                      type="number" 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-black text-xl outline-none focus:border-blue-500 transition-all"
                      value={formData.width || ''}
                      onChange={(e) => setFormData({...formData, width: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 italic ml-2">Alto del Diseño (cm)</label>
                    <input 
                      type="number" 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-black text-xl outline-none focus:border-blue-500 transition-all"
                      value={formData.height || ''}
                      onChange={(e) => setFormData({...formData, height: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 italic ml-2">Costo por cm² ($)</label>
                    <input 
                      type="number" 
                      step="0.001"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-black text-xl outline-none focus:border-blue-500 transition-all"
                      value={formData.costPerCm2 || ''}
                      onChange={(e) => setFormData({...formData, costPerCm2: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </>
              )}

              {formData.technique === 'vinil' && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 italic ml-2">Precio del Rollo ($)</label>
                    <input 
                      type="number" 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-black text-xl outline-none focus:border-blue-500 transition-all"
                      value={formData.rollPrice || ''}
                      onChange={(e) => setFormData({...formData, rollPrice: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 italic ml-2">Metros del Rollo</label>
                    <input 
                      type="number" 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-black text-xl outline-none focus:border-blue-500 transition-all"
                      value={formData.rollMeters || ''}
                      onChange={(e) => setFormData({...formData, rollMeters: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 italic ml-2">Metros Usados por Pieza</label>
                    <input 
                      type="number" 
                      step="0.01"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-black text-xl outline-none focus:border-blue-500 transition-all"
                      value={formData.metersUsed || ''}
                      onChange={(e) => setFormData({...formData, metersUsed: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </>
              )}
            </div>
            <div className="bg-blue-50 p-8 rounded-[2rem] border-2 border-blue-100 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-blue-600 italic">Costo de Personalización:</span>
              <span className="text-3xl font-black text-blue-700 italic">${calculations.personalizationCost.toFixed(2)}</span>
            </div>
          </div>
        )}

        {currentStage === 4 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black uppercase italic text-slate-800">Costo de Mano de Obra</h3>
              <p className="text-xs font-bold text-slate-400 uppercase italic">Tiempo y remuneración del personal</p>
            </div>

            <div className="flex bg-slate-100 p-2 rounded-2xl">
              <button 
                onClick={() => setFormData({...formData, laborType: 'hourly'})}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase italic transition-all ${formData.laborType === 'hourly' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}
              >
                Por Hora / Salario
              </button>
              <button 
                onClick={() => setFormData({...formData, laborType: 'piecework'})}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase italic transition-all ${formData.laborType === 'piecework' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}
              >
                Por Destajo / Pieza
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {formData.laborType === 'hourly' ? (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 italic ml-2">Salario Semanal ($)</label>
                    <input 
                      type="number" 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-black text-xl outline-none focus:border-blue-500 transition-all"
                      value={formData.weeklySalary || ''}
                      onChange={(e) => setFormData({...formData, weeklySalary: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 italic ml-2">Horas Trabajadas por Semana</label>
                    <input 
                      type="number" 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-black text-xl outline-none focus:border-blue-500 transition-all"
                      value={formData.weeklyHours || ''}
                      onChange={(e) => setFormData({...formData, weeklyHours: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 italic ml-2">Tiempo de Producción por Pieza (minutos)</label>
                    <input 
                      type="number" 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-black text-xl outline-none focus:border-blue-500 transition-all"
                      value={formData.productionTimeMinutes || ''}
                      onChange={(e) => setFormData({...formData, productionTimeMinutes: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 italic ml-2">Pago por Pieza Terminada ($)</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-black text-xl outline-none focus:border-blue-500 transition-all"
                    placeholder="Monto a pagar al trabajador por esta unidad"
                    value={formData.laborCostPerPiece || ''}
                    onChange={(e) => setFormData({...formData, laborCostPerPiece: parseFloat(e.target.value) || 0})}
                  />
                </div>
              )}
            </div>
            <div className="bg-blue-50 p-8 rounded-[2rem] border-2 border-blue-100 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-blue-600 italic">Costo Mano de Obra Unitario:</span>
              <span className="text-3xl font-black text-blue-700 italic">${calculations.laborCost.toFixed(2)}</span>
            </div>
          </div>
        )}

        {currentStage === 5 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black uppercase italic text-slate-800">Costos Operativos Mensuales</h3>
              <p className="text-xs font-bold text-slate-400 uppercase italic">Gastos fijos de la empresa</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Alquiler', key: 'monthlyRent' },
                { label: 'Electricidad', key: 'monthlyElectricity' },
                { label: 'Internet', key: 'monthlyInternet' },
                { label: 'Mantenimiento', key: 'monthlyMaintenance' },
                { label: 'Software', key: 'monthlySoftware' },
                { label: 'Otros Gastos', key: 'monthlyOthers' },
              ].map((item) => (
                <div key={item.key} className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 italic ml-2">{item.label} ($)</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 font-black text-sm outline-none focus:border-blue-500 transition-all"
                    value={(formData as any)[item.key] || ''}
                    onChange={(e) => setFormData({...formData, [item.key]: parseFloat(e.target.value) || 0})}
                  />
                </div>
              ))}
            </div>
            <div className="pt-8 border-t border-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 italic ml-2">Unidades Producidas al Mes (Estimado)</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-black text-xl outline-none focus:border-blue-500 transition-all"
                    value={formData.monthlyUnitsProduced || ''}
                    onChange={(e) => setFormData({...formData, monthlyUnitsProduced: parseFloat(e.target.value) || 1})}
                  />
                </div>
                <div className="bg-blue-50 p-8 rounded-[2rem] border-2 border-blue-100 flex flex-col justify-center">
                  <span className="text-[10px] font-black uppercase text-blue-600 italic">Costo Operativo Unitario:</span>
                  <span className="text-3xl font-black text-blue-700 italic">${calculations.operatingCostPerUnit.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStage === 6 && (
          <div className="space-y-12 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center space-y-4">
              <h3 className="text-4xl font-black uppercase italic text-slate-800 tracking-tighter">Análisis de Rentabilidad</h3>
              <p className="text-xs font-bold text-slate-400 uppercase italic">Resultados finales para {formData.productName || 'el producto'}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="bg-[#000814] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                  <div className="relative z-10 space-y-6">
                    <div>
                      <p className="text-[10px] font-black text-blue-400 uppercase italic tracking-widest">Costo Total Unitario</p>
                      <p className="text-6xl font-black italic tracking-tighter">${calculations.totalUnitCost.toFixed(2)}</p>
                    </div>
                    <div className="pt-6 border-t border-white/10">
                      <p className="text-[10px] font-black text-emerald-400 uppercase italic tracking-widest">Precio Mínimo Rentable (30% Margen)</p>
                      <p className="text-4xl font-black italic tracking-tighter text-emerald-500">${calculations.minProfitablePrice.toFixed(2)}</p>
                    </div>
                  </div>
                  <DollarSign size={150} className="absolute -right-10 -bottom-10 text-white/5 rotate-12" />
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 italic ml-2">Desglose de Componentes</h4>
                  <div className="space-y-2">
                    {[
                      { label: 'Materia Prima', value: calculations.rawMaterialCost, color: 'bg-emerald-500' },
                      { label: 'Personalización', value: calculations.personalizationCost, color: 'bg-blue-500' },
                      { label: 'Mano de Obra', value: calculations.laborCost, color: 'bg-amber-500' },
                      { label: 'Costos Operativos', value: calculations.operatingCostPerUnit, color: 'bg-rose-500' },
                    ].map((item) => {
                      const percentage = calculations.totalUnitCost > 0 ? (item.value / calculations.totalUnitCost) * 100 : 0;
                      return (
                        <div key={item.label} className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${item.color}`} />
                            <span className="text-[10px] font-black uppercase text-slate-600 italic">{item.label}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black text-slate-800 italic">${item.value.toFixed(2)}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase">{percentage.toFixed(1)}%</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="h-[300px] bg-slate-50 rounded-[3rem] p-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-blue-50 p-8 rounded-[3rem] border-2 border-blue-100 space-y-4">
                  <div className="flex items-center gap-3 text-blue-600">
                    <TrendingUp size={20} />
                    <h4 className="font-black uppercase italic tracking-tighter">Análisis Estratégico</h4>
                  </div>
                  <p className="text-xs text-slate-600 font-bold italic leading-relaxed">
                    El componente de <span className="text-blue-700">
                      {chartData.sort((a, b) => b.value - a.value)[0]?.name || 'costo'}
                    </span> representa el mayor impacto en la producción. Se recomienda optimizar procesos en esta área para mejorar el margen de rentabilidad.
                  </p>
                </div>

                <button 
                  onClick={() => onSaveToInventory?.({
                    name: formData.productName,
                    type: formData.productType,
                    cost: calculations.totalUnitCost,
                    minPrice: calculations.minProfitablePrice,
                    details: calculations
                  })}
                  className="w-full bg-[#000814] text-white py-6 rounded-[2rem] font-black uppercase italic tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                >
                  <Save size={20} /> Guardar en Inventario
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Navigation */}
      <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
        <button 
          onClick={handleBack}
          disabled={currentStage === 1}
          className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${currentStage === 1 ? 'opacity-0 pointer-events-none' : 'bg-white text-slate-400 hover:text-slate-600 shadow-sm'}`}
        >
          <ArrowLeft size={16} /> Anterior
        </button>
        
        <div className="flex gap-2">
          {STAGES.map(s => (
            <div key={s.id} className={`w-1.5 h-1.5 rounded-full transition-all ${currentStage === s.id ? 'w-6 bg-blue-600' : 'bg-slate-300'}`} />
          ))}
        </div>

        <button 
          onClick={handleNext}
          disabled={currentStage === 6}
          className={`flex items-center gap-2 px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all ${currentStage === 6 ? 'opacity-0 pointer-events-none' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
        >
          Siguiente <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default CostEngineering;
