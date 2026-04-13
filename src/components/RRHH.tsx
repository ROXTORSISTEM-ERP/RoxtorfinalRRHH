import React, { useState, useMemo, useRef } from 'react';
import { Agent, AppSettings, PayrollPayment } from '../types';
import { 
  Users, 
  FileText, 
  Calendar, 
  DollarSign, 
  Clock, 
  Briefcase, 
  Download, 
  Plus, 
  Search,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Printer,
  History,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { supabase } from '../utils/supabase';
import { 
  calculateSeniority, 
  calculatePayrollDetails, 
  calculateLiquidationDetails, 
  calculateVacationDetails,
  getWeeklyAttendance
} from '../utils/payrollCalculations';
import PayrollReceipt from './PayrollReceipt';

interface Props {
  agents: Agent[];
  onUpdateAgent: (agent: Agent) => void;
  settings: AppSettings;
  payroll: PayrollPayment[];
}

const RRHH: React.FC<Props> = ({ agents, onUpdateAgent, settings, payroll }) => {
  const [activeTab, setActiveTab] = useState<'staff' | 'payroll' | 'contracts' | 'vacations' | 'destajo' | 'history'>('staff');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditingEntryDate, setIsEditingEntryDate] = useState(false);
  const [tempEntryDate, setTempEntryDate] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [newPieceWork, setNewPieceWork] = useState({ description: '', quantity: 0, unitPriceUsd: 0 });
  const [liquidationFormat, setLiquidationFormat] = useState<'A' | 'B' | 'C'>('A');
  const [showVacationPreview, setShowVacationPreview] = useState(false);
  const contractRef = useRef<HTMLDivElement>(null);
  const payStubRef = useRef<HTMLDivElement>(null);
  const liquidationRef = useRef<HTMLDivElement>(null);
  const vacationRef = useRef<HTMLDivElement>(null);

  const fiscalData = {
    name: "Inversiones Roxtor, C.A",
    rif: "J-40295973-7",
    address: "Ciudad Guayana, Estado Bolívar"
  };

  const selectedAgent = useMemo(() => 
    agents.find(a => a.id === selectedAgentId), 
    [agents, selectedAgentId]
  );

  const filteredAgents = useMemo(() => 
    agents.filter(a => 
      a.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.idNumber?.includes(searchTerm)
    ), 
    [agents, searchTerm]
  );

  // --- LÓGICA DE CÁLCULOS ---
  // Se utilizan las funciones importadas de payrollCalculations.ts

  const generateContractPDF = async () => {
    if (!contractRef.current || !selectedAgent) return;
    
    const canvas = await html2canvas(contractRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    const pdfBlob = pdf.output('blob');
    const fileName = `contratos/${selectedAgent.id}_${Date.now()}.pdf`;
    
    setIsUploading(true);
    const { error } = await supabase!.storage
      .from('expedientes')
      .upload(fileName, pdfBlob);
    setIsUploading(false);

    if (error) {
      console.error('Error uploading contract:', error);
      alert('Error al guardar en Supabase. Se descargará localmente.');
    } else {
      // Actualizar el registro del agente con el link del contrato si fuera necesario
      onUpdateAgent({
        ...selectedAgent,
        contractUrl: fileName
      });
      alert('Contrato guardado en el expediente de Supabase.');
    }

    pdf.save(`Contrato_${selectedAgent.fullName?.replace(/\s+/g, '_')}.pdf`);
  };

  const generatePayStubPDF = async () => {
    if (!payStubRef.current || !selectedAgent) return;
    const canvas = await html2canvas(payStubRef.current, { 
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });
    const imgData = canvas.toDataURL('image/png');
    // Media Carta: 139.7 x 215.9 mm
    const pdf = new jsPDF('p', 'mm', [139.7, 215.9]);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Recibo_Roxtor_${selectedAgent.name}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const generateLiquidationPDF = async () => {
    if (!liquidationRef.current || !selectedAgent) return;
    const canvas = await html2canvas(liquidationRef.current, { 
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });
    const imgData = canvas.toDataURL('image/png');
    // Media Carta: 139.7 x 215.9 mm
    const pdf = new jsPDF('p', 'mm', [139.7, 215.9]);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Liquidacion_${liquidationFormat}_${selectedAgent.name}.pdf`);
  };

  const generateVacationPDF = async () => {
    if (!vacationRef.current || !selectedAgent) return;
    const canvas = await html2canvas(vacationRef.current, { 
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', [139.7, 215.9]);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Recibo_Vacaciones_${selectedAgent.name}.pdf`);
  };

  const handleSaveEntryDate = () => {
    if (selectedAgent && tempEntryDate) {
      onUpdateAgent({
        ...selectedAgent,
        entryDate: tempEntryDate
      });
      setIsEditingEntryDate(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-white overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#0f0f0f]">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/20 rounded-xl">
            <Users className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter italic uppercase">Gestión de RRHH</h1>
            <p className="text-xs text-slate-400 font-medium">Control de Personal, Nómina y Contratos</p>
          </div>
        </div>

        <div className="flex gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
          {[
            { id: 'staff', icon: Users, label: 'Personal' },
            { id: 'payroll', icon: DollarSign, label: 'Cálculos' },
            { id: 'destajo', icon: Briefcase, label: 'Destajo' },
            { id: 'history', icon: History, label: 'Historial' },
            { id: 'vacations', icon: Calendar, label: 'Vacaciones' },
            { id: 'contracts', icon: FileText, label: 'Contratos' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                  : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar: Lista de Agentes */}
        <div className="w-80 border-r border-white/10 flex flex-col bg-[#0d0d0d]">
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar colaborador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredAgents.map(agent => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                  selectedAgentId === agent.id 
                    ? 'bg-blue-600/10 border border-blue-600/20' 
                    : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-sm font-bold border border-white/10">
                  {agent.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="text-left overflow-hidden">
                  <p className="text-sm font-bold truncate">{agent.fullName || agent.name}</p>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{agent.role}</p>
                </div>
                {selectedAgentId === agent.id && <ChevronRight className="w-4 h-4 text-blue-500 ml-auto" />}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-black/20 p-8">
          <AnimatePresence mode="wait">
            {!selectedAgent ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4"
              >
                <Users className="w-16 h-16 opacity-20" />
                <p className="font-medium italic">Selecciona un colaborador para ver su ficha de RRHH</p>
              </motion.div>
            ) : (
              <motion.div
                key={selectedAgent.id + activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto space-y-6"
              >
                {/* Ficha Rápida */}
                <div className="bg-[#111] border border-white/10 rounded-2xl p-6 flex items-center gap-6">
                  <div className="w-24 h-24 rounded-2xl bg-blue-600 flex items-center justify-center text-3xl font-black shadow-2xl shadow-blue-600/20">
                    {selectedAgent.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-3xl font-black italic uppercase tracking-tighter">{selectedAgent.fullName || selectedAgent.name}</h2>
                      <span className="px-3 py-1 bg-blue-600/20 text-blue-400 text-[10px] font-black rounded-full uppercase tracking-widest border border-blue-600/30">
                        {selectedAgent.role}
                      </span>
                    </div>
                    <div className="flex gap-6 text-sm text-slate-400 font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        Ingreso: {isEditingEntryDate ? (
                          <div className="flex items-center gap-2">
                            <input 
                              type="date" 
                              value={tempEntryDate} 
                              onChange={(e) => setTempEntryDate(e.target.value)}
                              className="bg-black/50 border border-white/20 rounded px-2 py-1 text-xs text-white outline-none"
                            />
                            <button onClick={handleSaveEntryDate} className="text-blue-500 hover:text-blue-400 font-black uppercase text-[10px]">Guardar</button>
                            <button onClick={() => setIsEditingEntryDate(false)} className="text-slate-500 hover:text-slate-400 font-black uppercase text-[10px]">X</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>{selectedAgent.entryDate ? format(new Date(selectedAgent.entryDate), 'dd MMM yyyy', { locale: es }) : 'No registrada'}</span>
                            <button 
                              onClick={() => {
                                setTempEntryDate(selectedAgent.entryDate || '');
                                setIsEditingEntryDate(true);
                              }}
                              className="p-1 hover:bg-white/10 rounded transition-all"
                            >
                              <Plus className="w-3 h-3 text-blue-500" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-slate-500" />
                        ID: {selectedAgent.idNumber || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contenido según Tab */}
                {activeTab === 'staff' && (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-black uppercase tracking-widest text-blue-500 flex items-center gap-2">
                          <Briefcase className="w-4 h-4" /> Datos Laborales
                        </h3>
                        <button 
                          onClick={() => {
                            const newDate = prompt('Nueva fecha de ingreso (YYYY-MM-DD):', selectedAgent.entryDate || '');
                            if (newDate) onUpdateAgent({ ...selectedAgent, entryDate: newDate });
                          }}
                          className="text-[8px] font-black uppercase bg-blue-600/20 text-blue-400 px-2 py-1 rounded border border-blue-600/30 hover:bg-blue-600/30 transition-all"
                        >
                          Editar Fecha
                        </button>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between p-3 bg-black/30 rounded-xl border border-white/5">
                          <span className="text-slate-400 text-xs font-bold uppercase">Sueldo Base (Bs)</span>
                          <span className="font-mono font-bold">{selectedAgent.baseSalaryBs || 130} Bs.</span>
                        </div>
                        <div className="flex justify-between p-3 bg-black/30 rounded-xl border border-white/5">
                          <span className="text-slate-400 text-xs font-bold uppercase">Bono Complementario (USD)</span>
                          <span className="font-mono font-bold text-green-400">{selectedAgent.complementaryBonusUsd || 0} $</span>
                        </div>
                        <div className="flex justify-between p-3 bg-black/30 rounded-xl border border-white/5">
                          <span className="text-slate-400 text-xs font-bold uppercase">Tipo de Pago</span>
                          <span className="font-bold uppercase text-xs">{selectedAgent.salaryType || 'No definido'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#111] border border-white/10 rounded-2xl p-6 space-y-4">
                      <h3 className="text-sm font-black uppercase tracking-widest text-blue-500 flex items-center gap-2">
                        <History className="w-4 h-4" /> Antigüedad
                      </h3>
                      {(() => {
                        const s = calculateSeniority(selectedAgent.entryDate);
                        return (
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-black/30 p-4 rounded-xl border border-white/5 text-center">
                              <p className="text-2xl font-black text-white">{s.years}</p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase">Años</p>
                            </div>
                            <div className="bg-black/30 p-4 rounded-xl border border-white/5 text-center">
                              <p className="text-2xl font-black text-white">{s.months}</p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase">Meses</p>
                            </div>
                            <div className="bg-black/30 p-4 rounded-xl border border-white/5 text-center">
                              <p className="text-2xl font-black text-white">{s.days}</p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase">Días</p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="bg-[#111] border border-white/10 rounded-2xl p-6 space-y-4">
                      <h3 className="text-sm font-black uppercase tracking-widest text-blue-500 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Control de Asistencia
                      </h3>
                      {(() => {
                        const { totalAbsences, totalDelayMinutes } = getWeeklyAttendance(selectedAgent);
                        return (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-red-600/10 p-2 rounded-lg border border-red-600/20 text-center">
                                <p className="text-lg font-black text-red-400">{totalAbsences}</p>
                                <p className="text-[8px] text-slate-500 font-bold uppercase">Ausencias (Semana)</p>
                              </div>
                              <div className="bg-yellow-600/10 p-2 rounded-lg border border-yellow-600/20 text-center">
                                <p className="text-lg font-black text-yellow-400">{totalDelayMinutes}</p>
                                <p className="text-[8px] text-slate-500 font-bold uppercase">Min. Retraso</p>
                              </div>
                            </div>
                            <div className="flex justify-between p-3 bg-black/30 rounded-xl border border-white/5">
                              <span className="text-slate-400 text-xs font-bold uppercase">Precio por Hora</span>
                              <span className="font-mono font-bold text-blue-400">{selectedAgent.hourlyRateUsd || 0} $/h</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-blue-500 flex items-center gap-2">
                      <History className="w-4 h-4" /> Historial de Pagos de Nómina
                    </h3>
                    <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-white/5 text-slate-400 font-black uppercase tracking-widest">
                          <tr>
                            <th className="p-4">Fecha</th>
                            <th className="p-4">Periodo</th>
                            <th className="p-4 text-right">Monto ($)</th>
                            <th className="p-4 text-right">Monto (Bs)</th>
                            <th className="p-4">Método</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {payroll
                            .filter(p => p.agentId === selectedAgent.id)
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map(payment => (
                              <tr key={payment.id} className="hover:bg-white/5 transition-all">
                                <td className="p-4 text-slate-500">{format(new Date(payment.date), 'dd/MM/yy')}</td>
                                <td className="p-4 font-bold uppercase">
                                  {payment.periodStart && payment.periodEnd 
                                    ? `${format(new Date(payment.periodStart), 'dd/MM')} - ${format(new Date(payment.periodEnd), 'dd/MM')}`
                                    : 'N/A'}
                                </td>
                                <td className="p-4 text-right font-black text-green-400">${payment.amountUsd.toFixed(2)}</td>
                                <td className="p-4 text-right font-black text-blue-400">{payment.amountBs.toFixed(2)} Bs.</td>
                                <td className="p-4 uppercase text-[10px] font-bold">{payment.method}</td>
                              </tr>
                            ))}
                          {payroll.filter(p => p.agentId === selectedAgent.id).length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-10 text-center text-slate-500 italic">No hay registros de pagos para este colaborador</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'destajo' && (
                  <div className="space-y-6">
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-6 space-y-4">
                      <h3 className="text-sm font-black uppercase tracking-widest text-blue-500 flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Registrar Trabajo por Destajo
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        <input 
                          type="text" 
                          placeholder="Descripción (ej: Bordado 50 gorras)"
                          className="bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-blue-500"
                          value={newPieceWork.description}
                          onChange={(e) => setNewPieceWork({...newPieceWork, description: e.target.value})}
                        />
                        <input 
                          type="number" 
                          placeholder="Cantidad"
                          className="bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-blue-500"
                          value={newPieceWork.quantity || ''}
                          onChange={(e) => setNewPieceWork({...newPieceWork, quantity: parseFloat(e.target.value) || 0})}
                        />
                        <input 
                          type="number" 
                          placeholder="Precio Unitario ($)"
                          className="bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-blue-500"
                          value={newPieceWork.unitPriceUsd || ''}
                          onChange={(e) => setNewPieceWork({...newPieceWork, unitPriceUsd: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      <button 
                        onClick={() => {
                          if (selectedAgent && newPieceWork.description && newPieceWork.quantity > 0) {
                            const record = {
                              id: Math.random().toString(36).substr(2, 9),
                              date: new Date().toISOString(),
                              description: newPieceWork.description,
                              quantity: newPieceWork.quantity,
                              unitPriceUsd: newPieceWork.unitPriceUsd,
                              totalUsd: newPieceWork.quantity * newPieceWork.unitPriceUsd,
                              status: 'pendiente' as const
                            };
                            onUpdateAgent({
                              ...selectedAgent,
                              pieceWorkRecords: [...(selectedAgent.pieceWorkRecords || []), record]
                            });
                            setNewPieceWork({ description: '', quantity: 0, unitPriceUsd: 0 });
                          }
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all"
                      >
                        Añadir a Cuentas por Pagar
                      </button>
                    </div>

                    <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-white/5 text-slate-400 font-black uppercase tracking-widest">
                          <tr>
                            <th className="p-4">Fecha</th>
                            <th className="p-4">Descripción</th>
                            <th className="p-4 text-center">Cant.</th>
                            <th className="p-4 text-right">Total ($)</th>
                            <th className="p-4 text-center">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {(selectedAgent.pieceWorkRecords || []).map(record => (
                            <tr key={record.id} className="hover:bg-white/5 transition-all">
                              <td className="p-4 text-slate-500">{format(new Date(record.date), 'dd/MM/yy')}</td>
                              <td className="p-4 font-bold uppercase">{record.description}</td>
                              <td className="p-4 text-center">{record.quantity}</td>
                              <td className="p-4 text-right font-black text-blue-400">${record.totalUsd.toFixed(2)}</td>
                              <td className="p-4 text-center">
                                <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase ${
                                  record.status === 'pagado' ? 'bg-green-600/20 text-green-400' : 'bg-yellow-600/20 text-yellow-400'
                                }`}>
                                  {record.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {activeTab === 'payroll' && (
                  <div className="space-y-6">
                    <div className="flex justify-end">
                      <button 
                        onClick={generatePayStubPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase italic text-[10px] transition-all shadow-lg shadow-blue-600/20"
                      >
                        <Printer className="w-4 h-4" /> Imprimir Recibo Semanal (Media Carta)
                      </button>
                    </div>

                    <div className="bg-blue-600/10 border border-blue-600/20 rounded-2xl p-6 flex items-start gap-4">
                      <AlertCircle className="w-6 h-6 text-blue-500 shrink-0 mt-1" />
                      <div>
                        <h4 className="font-black uppercase italic text-blue-400">Módulo de Liquidación con Triple Formato</h4>
                        <p className="text-sm text-slate-400">Elige el formato de cálculo para la previsualización y exportación.</p>
                      </div>
                    </div>

                    <div className="flex gap-2 bg-black/40 p-1 rounded-xl border border-white/5 w-fit">
                      {[
                        { id: 'A', label: 'Formato A (Legal)' },
                        { id: 'B', label: 'Formato B (Gestión)' },
                        { id: 'C', label: 'Formato C (Mixto)' }
                      ].map(f => (
                        <button
                          key={f.id}
                          onClick={() => setLiquidationFormat(f.id as any)}
                          className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                            liquidationFormat === f.id 
                              ? 'bg-blue-600 text-white' 
                              : 'text-slate-400 hover:bg-white/5'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    <div className="bg-white text-black p-8 rounded-sm shadow-2xl overflow-hidden min-h-[215.9mm] w-[139.7mm] mx-auto" ref={liquidationRef}>
                      {selectedAgent && (() => {
                        const liq = calculateLiquidationDetails(selectedAgent, settings);
                        return (
                          <div className="space-y-6 font-sans">
                            <div className="flex justify-between items-start border-b-2 border-black pb-4">
                              <div className="flex gap-3 items-center">
                                <img src={settings.logoUrl || "https://picsum.photos/seed/roxtor/100/50"} alt="Logo" className="h-10 grayscale" referrerPolicy="no-referrer" />
                                <div>
                                  <h1 className="text-lg font-black italic uppercase tracking-tighter">LIQUIDACIÓN DE PRESTACIONES</h1>
                                  <p className="text-[8px] font-bold uppercase">{fiscalData.name}</p>
                                  <p className="text-[8px] font-bold">RIF {fiscalData.rif}</p>
                                </div>
                              </div>
                              <div className="text-right text-[9px] font-bold uppercase">
                                <p>Fecha: {format(new Date(), 'dd/MM/yyyy')}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-[9px]">
                              <div className="bg-slate-50 p-2 rounded border border-slate-200">
                                <p className="text-slate-500 uppercase font-black text-[7px]">TRABAJADOR</p>
                                <p className="font-black text-xs uppercase">{selectedAgent.fullName || selectedAgent.name}</p>
                                <p className="font-bold">C.I: {selectedAgent.idNumber || 'S/N'}</p>
                              </div>
                              <div className="bg-slate-50 p-2 rounded border border-slate-200 text-right">
                                <p className="text-slate-500 uppercase font-black text-[7px]">DATOS LABORALES</p>
                                <p className="font-bold uppercase">Ingreso: {selectedAgent.entryDate ? format(new Date(selectedAgent.entryDate), 'dd/MM/yyyy') : 'S/N'}</p>
                                <p className="font-bold uppercase">Antigüedad: {liq.seniorityYears}a {liq.seniorityDays % 365}d</p>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <p className="text-[8px] font-black uppercase border-b border-black">CÁLCULO SEGÚN {liquidationFormat === 'A' ? 'LOTTT (ART. 142)' : liquidationFormat === 'B' ? 'GESTIÓN ADMINISTRATIVA' : 'FORMATO MIXTO'}</p>
                              
                              <div className="space-y-2 text-[10px]">
                                {liquidationFormat === 'A' && (
                                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                    <span className="font-medium uppercase">Prestaciones Sociales LOTTT (Base 130 Bs)</span>
                                    <span className="font-black">{liq.lotttBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.</span>
                                  </div>
                                )}

                                {liquidationFormat === 'B' && (
                                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                    <span className="font-medium uppercase">Liquidación de Gestión (Sueldo Real USD)</span>
                                    <span className="font-black">{liq.roxtorUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} $</span>
                                  </div>
                                )}

                                {liquidationFormat === 'C' && (
                                  <>
                                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                      <span className="font-medium uppercase">Base Legal LOTTT</span>
                                      <span className="font-black">{liq.lotttBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                      <span className="font-medium uppercase">Bono de Egreso Especial (Acuerdo)</span>
                                      <span className="font-black">{liq.specialExitBonusBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 bg-slate-50 p-2 rounded">
                                      <span className="font-black uppercase">Total Conciliado</span>
                                      <span className="font-black text-lg">{(liq.lotttBs + liq.specialExitBonusBs).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="pt-20 grid grid-cols-2 gap-12">
                              <div className="text-center border-t border-black pt-2">
                                <p className="text-[7px] font-black uppercase">Firma del Trabajador</p>
                              </div>
                              <div className="text-center border-t border-black pt-2">
                                <p className="text-[7px] font-black uppercase">Por la Empresa</p>
                              </div>
                            </div>

                            <div className="mt-6 text-center">
                              <p className="text-[6px] font-bold uppercase text-slate-400 leading-tight">
                                {fiscalData.name} | RIF {fiscalData.rif} <br/>
                                Documento generado para fines de cierre de relación laboral.
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="flex justify-end">
                      <button 
                        onClick={generateLiquidationPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase italic text-[10px] transition-all shadow-lg shadow-blue-600/20"
                      >
                        <Download className="w-4 h-4" /> Descargar Liquidación PDF
                      </button>
                    </div>

                    <div className="fixed -left-[2000px] top-0">
                      <div ref={payStubRef}>
                        <PayrollReceipt 
                          agent={selectedAgent} 
                          settings={settings} 
                          isPrinting={true}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'vacations' && (
                  <div className="space-y-6">
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-8 space-y-8">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-black italic uppercase tracking-tighter">Plan de Vacaciones Colectivas</h3>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setShowVacationPreview(!showVacationPreview)}
                            className="px-4 py-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-600/30 text-[10px] font-black uppercase"
                          >
                            {showVacationPreview ? 'Cerrar Previsualización' : 'Previsualizar Recibo'}
                          </button>
                          <div className="px-4 py-2 bg-green-600/20 text-green-400 rounded-xl border border-green-600/30 text-xs font-black uppercase">
                            2 Semanas / Año
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <h4 className="font-black uppercase italic text-sm text-blue-400">Fechas de Disfrute</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-500 uppercase">Inicio</label>
                              <input 
                                type="date" 
                                value={selectedAgent.vacationStart || ''}
                                onChange={(e) => onUpdateAgent({...selectedAgent, vacationStart: e.target.value})}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-blue-500"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-500 uppercase">Fin</label>
                              <input 
                                type="date" 
                                value={selectedAgent.vacationEnd || ''}
                                onChange={(e) => onUpdateAgent({...selectedAgent, vacationEnd: e.target.value})}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-blue-500"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-black uppercase italic text-sm text-blue-400">Resumen de Pago</h4>
                          {(() => {
                            const vac = calculateVacationDetails(selectedAgent, settings);
                            return (
                              <div className="bg-black/40 p-4 rounded-2xl border border-white/5 grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-[8px] text-slate-500 font-black uppercase">Total en Bs.</p>
                                  <p className="text-xl font-black">{vac.totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[8px] text-slate-500 font-black uppercase">Total en USD</p>
                                  <p className="text-xl font-black text-green-500">{vac.totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} $</p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {showVacationPreview && (
                        <div className="pt-8 border-t border-white/10 space-y-6">
                          <div className="flex justify-end">
                            <button 
                              onClick={generateVacationPDF}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase italic text-[10px] transition-all"
                            >
                              <Download className="w-4 h-4" /> Descargar Recibo de Vacaciones
                            </button>
                          </div>
                          
                          <div className="bg-white text-black p-8 rounded-sm shadow-2xl overflow-hidden min-h-[215.9mm] w-[139.7mm] mx-auto" ref={vacationRef}>
                            {(() => {
                              const vac = calculateVacationDetails(selectedAgent, settings);
                              return (
                                <div className="space-y-6 font-sans">
                                  <div className="flex justify-between items-start border-b-2 border-black pb-4">
                                    <div className="flex gap-3 items-center">
                                      <img src={settings.logoUrl || "https://picsum.photos/seed/roxtor/100/50"} alt="Logo" className="h-10 grayscale" referrerPolicy="no-referrer" />
                                      <div>
                                        <h1 className="text-lg font-black italic uppercase tracking-tighter">RECIBO DE VACACIONES</h1>
                                        <p className="text-[8px] font-bold uppercase">{fiscalData.name}</p>
                                        <p className="text-[8px] font-bold">RIF {fiscalData.rif}</p>
                                      </div>
                                    </div>
                                    <div className="text-right text-[9px] font-bold uppercase">
                                      <p>Fecha: {format(new Date(), 'dd/MM/yyyy')}</p>
                                    </div>
                                  </div>

                                  <div className="bg-slate-50 p-3 rounded border border-slate-200 text-[9px]">
                                    <p className="text-slate-500 uppercase font-black text-[7px]">TRABAJADOR</p>
                                    <p className="font-black text-xs uppercase">{selectedAgent.fullName || selectedAgent.name}</p>
                                    <p className="font-bold">C.I: {selectedAgent.idNumber || 'S/N'}</p>
                                    <div className="mt-2 grid grid-cols-2 gap-4 border-t border-slate-200 pt-2">
                                      <p className="font-bold uppercase">Desde: {selectedAgent.vacationStart ? format(new Date(selectedAgent.vacationStart), 'dd/MM/yyyy') : '---'}</p>
                                      <p className="font-bold uppercase">Hasta: {selectedAgent.vacationEnd ? format(new Date(selectedAgent.vacationEnd), 'dd/MM/yyyy') : '---'}</p>
                                    </div>
                                  </div>

                                  <div className="space-y-4">
                                    <p className="text-[8px] font-black uppercase border-b border-black">Desglose de Pago (Tasa: {vac.exchangeRate} Bs/$)</p>
                                    <div className="space-y-2 text-[10px]">
                                      <div className="flex justify-between items-center py-1 border-b border-slate-100">
                                        <span className="font-medium uppercase">Semana de Vacaciones (Disfrute)</span>
                                        <span className="font-bold">{vac.vacationWeekBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.</span>
                                      </div>
                                      <div className="flex justify-between items-center py-1 border-b border-slate-100">
                                        <span className="font-medium uppercase">Semana de Aguinaldo (Diciembre)</span>
                                        <span className="font-bold">{vac.aguinaldoWeekBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.</span>
                                      </div>
                                      <div className="flex justify-between items-center py-2 bg-slate-50 p-2 rounded">
                                        <span className="font-black uppercase">Total a Pagar</span>
                                        <span className="font-black text-lg">{vac.totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="pt-20 grid grid-cols-2 gap-12">
                                    <div className="text-center border-t border-black pt-2">
                                      <p className="text-[7px] font-black uppercase">Firma del Trabajador</p>
                                    </div>
                                    <div className="text-center border-t border-black pt-2">
                                      <p className="text-[7px] font-black uppercase">Sello Roxtor</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'contracts' && (
                  <div className="space-y-6">
                    <div className="flex justify-end gap-3">
                      {isUploading && (
                        <div className="flex items-center gap-2 text-blue-500 text-[10px] font-black uppercase animate-pulse">
                          <Loader2 className="w-4 h-4 animate-spin" /> Subiendo a Supabase...
                        </div>
                      )}
                      <button 
                        onClick={generateContractPDF}
                        disabled={isUploading}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-black uppercase italic text-sm transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50"
                      >
                        <Download className="w-4 h-4" /> Descargar y Guardar Contrato
                      </button>
                    </div>

                    {/* Previsualización del Contrato */}
                    <div className="bg-white text-black p-12 rounded-sm shadow-2xl overflow-hidden" ref={contractRef}>
                      <div className="max-w-2xl mx-auto space-y-6 font-serif text-[11px] leading-relaxed text-justify">
                        <div className="text-center space-y-1 mb-8">
                          <h1 className="text-lg font-bold uppercase underline">CONTRATO INDIVIDUAL DE TRABAJO</h1>
                          <p className="text-[9px] font-bold">{fiscalData.name} - RIF {fiscalData.rif}</p>
                        </div>

                        <p>
                          Entre la sociedad mercantil <b>{fiscalData.name.toUpperCase()}</b>, domiciliada en {fiscalData.address}, debidamente inscrita ante el Registro Mercantil, 
                          representada en este acto por su Gerencia General, quien en lo sucesivo y a los efectos de este contrato se denominará <b>EL PATRONO</b>, 
                          por una parte; y por la otra el ciudadano(a) <b>{selectedAgent.fullName?.toUpperCase()}</b>, 
                          titular de la cédula de identidad Nro. <b>{selectedAgent.idNumber}</b>, quien en lo sucesivo se denominará 
                          <b> EL TRABAJADOR</b>, se ha convenido en celebrar el presente contrato de trabajo sujeto a las cláusulas que se detallan a continuación:
                        </p>

                        <div className="space-y-3">
                          <p><b>PRIMERA (OBJETO):</b> EL TRABAJADOR se obliga a prestar sus servicios personales bajo la dependencia de EL PATRONO, desempeñando el cargo de <b>{selectedAgent.role.toUpperCase()}</b>, realizando las funciones inherentes a dicha posición y aquellas que le sean asignadas de acuerdo a su capacidad y naturaleza del servicio.</p>
                          
                          <p><b>SEGUNDA (FECHA DE INGRESO):</b> La relación laboral objeto de este contrato inicia el día <b>{selectedAgent.entryDate ? format(new Date(selectedAgent.entryDate), "dd 'de' MMMM 'de' yyyy", { locale: es }) : '__________'}</b>. Se establece un período de prueba de noventa (90) días, conforme a la normativa legal vigente.</p>
                          
                          <p><b>TERCERA (REMUNERACIÓN Y MONEDA DE CUENTA):</b> Se establece un sueldo base mensual de <b>130 Bolívares</b>, el cual será cancelado mediante cuotas semanales. Adicionalmente, se acuerda el pago de un Bono de Productividad y Asistencia equivalente a la cantidad de <b>{selectedAgent.complementaryBonusUsd || 0} Dólares Americanos</b>, utilizando como única referencia de cálculo el tipo de cambio oficial publicado por el Banco Central de Venezuela (BCV) vigente a la fecha de cada pago efectivo.</p>
                          
                          <p><b>CUARTA (JORNADA LABORAL Y ASISTENCIA):</b> La jornada de trabajo será de Lunes a Sábado, en el horario de 8:00 AM a 5:00 PM, con una (1) hora de descanso intermedio. EL TRABAJADOR acepta que el registro de asistencia se llevará a través del sistema Roxtor ERP, y que los retrasos injustificados generarán los descuentos proporcionales correspondientes sobre su remuneración integral.</p>
                          
                          <p><b>QUINTA (VACACIONES Y BENEFICIOS):</b> Se establecen dos (2) semanas de vacaciones anuales colectivas. La primera semana se disfrutará en el mes de Diciembre (remunerada con salario correspondiente a 1 semana más 1 semana de sueldo como aguinaldo) y la segunda semana será de disfrute con el pago de su otra semana de salario previa planificación acordada con la Gerencia.</p>
                          
                          <p><b>SEXTA (CONFIDENCIALIDAD Y CÓDIGO DE ÉTICA):</b> EL TRABAJADOR se compromete formalmente a mantener la más estricta confidencialidad sobre los diseños, procesos de fabricación, cartera de clientes y cualquier información interna de {fiscalData.name.toUpperCase()}. Queda prohibida la reproducción o filtración de material propiedad de la empresa. El maltrato intencional de la maquinaria, equipos de computación o mobiliario será causal de despido justificado según lo previsto en la LOTTT.</p>
                          
                          <p><b>SÉPTIMA (COMPROMISO Y DOMICILIO):</b> La empresa se compromete a dotar de uniformes, herramientas de trabajo y ambiente de trabajo seguro. Para todos los efectos derivados de este contrato, las partes eligen como domicilio especial y excluyente a la ciudad de Puerto Ordaz, Ciudad Guayana, Estado Bolívar.</p>
                        </div>

                        <p className="pt-4">
                          Se firman dos (2) ejemplares de un mismo tenor y a un solo efecto, en Ciudad Guayana, a los {format(new Date(), 'dd')} días del mes de {format(new Date(), 'MMMM', { locale: es })} de 2026.
                        </p>

                        <div className="pt-16 grid grid-cols-2 gap-20 text-center">
                          <div className="border-t border-black pt-2">
                            <p className="font-bold">POR EL PATRONO</p>
                            <p className="text-[9px]">{fiscalData.name}</p>
                          </div>
                          <div className="border-t border-black pt-2">
                            <p className="font-bold">POR EL TRABAJADOR</p>
                            <p className="text-[9px]">{selectedAgent.fullName}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default RRHH;
