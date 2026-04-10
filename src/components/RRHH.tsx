import React, { useState, useMemo, useRef } from 'react';
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
import { Agent, AppSettings, PayrollPayment } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from '../utils/supabase';

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
  const contractRef = useRef<HTMLDivElement>(null);
  const payStubRef = useRef<HTMLDivElement>(null);
  const liquidationRef = useRef<HTMLDivElement>(null);

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

  const calculateSeniority = (entryDate?: string) => {
    if (!entryDate) return { years: 0, months: 0, days: 0 };
    const start = new Date(entryDate);
    const end = new Date();
    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();

    if (days < 0) {
      months -= 1;
      days += 30;
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    return { years, months, days };
  };

  const calculateAttendanceStats = (agent: Agent) => {
    if (!agent.attendance) return { present: 0, absent: 0, late: 0, totalHours: 0 };
    
    let present = 0;
    let absent = 0;
    let late = 0;
    let totalHours = 0;

    agent.attendance.forEach(record => {
      if (record.status === 'presente') present++;
      else if (record.status === 'ausente') absent++;
      else if (record.status === 'tarde') late++;

      // Cálculo de horas (asumiendo jornada de 8h si está presente)
      if (record.status === 'presente' || record.status === 'tarde') {
        totalHours += 8; 
      }
    });

    return { present, absent, late, totalHours };
  };

  const calculateVacations = (agent: Agent) => {
    const baseSalary = agent.baseSalaryBs || 130;
    const bonusUsd = agent.complementaryBonusUsd || 0;
    
    const weeklyBaseBs = baseSalary / 4;
    const weeklyBonusUsd = bonusUsd / 4;

    return {
      totalWeeks: 2,
      decemberPayment: {
        bs: weeklyBaseBs * 2, // 1 sueldo + 1 aguinaldo
        usd: weeklyBonusUsd * 2
      },
      annualWeekPayment: {
        bs: weeklyBaseBs,
        usd: weeklyBonusUsd
      },
      totalAnnualBs: weeklyBaseBs * 3, // 2 semanas disfrute + 1 aguinaldo
      totalAnnualUsd: weeklyBonusUsd * 3
    };
  };

  const calculateLiquidation = (agent: Agent) => {
    const seniority = calculateSeniority(agent.entryDate);
    const baseSalary = agent.baseSalaryBs || 130;
    const bonusUsd = agent.complementaryBonusUsd || 0;
    
    // Cálculo simplificado basado en LOTTT (ejemplo)
    // 30 días de salario por año de servicio
    const totalMonths = seniority.years * 12 + seniority.months;
    const dailyBaseBs = baseSalary / 30;
    const dailyBonusUsd = bonusUsd / 30;

    const daysProvision = totalMonths * 2.5; // 30 días al año / 12 meses = 2.5 días por mes

    return {
      daysProvision,
      totalBs: daysProvision * dailyBaseBs,
      totalUsd: daysProvision * dailyBonusUsd
    };
  };

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
    const canvas = await html2canvas(payStubRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    // Media Carta: 139.7 x 215.9 mm
    const pdf = new jsPDF('p', 'mm', [139.7, 215.9]);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Recibo_${selectedAgent.name}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const generateLiquidationPDF = async () => {
    if (!liquidationRef.current || !selectedAgent) return;
    const canvas = await html2canvas(liquidationRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', [139.7, 215.9]);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Liquidacion_${selectedAgent.name}.pdf`);
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
                      <h3 className="text-sm font-black uppercase tracking-widest text-blue-500 flex items-center gap-2">
                        <Briefcase className="w-4 h-4" /> Datos Laborales
                      </h3>
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
                        const stats = calculateAttendanceStats(selectedAgent);
                        return (
                          <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-green-600/10 p-2 rounded-lg border border-green-600/20 text-center">
                                <p className="text-lg font-black text-green-400">{stats.present}</p>
                                <p className="text-[8px] text-slate-500 font-bold uppercase">Presente</p>
                              </div>
                              <div className="bg-red-600/10 p-2 rounded-lg border border-red-600/20 text-center">
                                <p className="text-lg font-black text-red-400">{stats.absent}</p>
                                <p className="text-[8px] text-slate-500 font-bold uppercase">Ausente</p>
                              </div>
                              <div className="bg-yellow-600/10 p-2 rounded-lg border border-yellow-600/20 text-center">
                                <p className="text-lg font-black text-yellow-400">{stats.late}</p>
                                <p className="text-[8px] text-slate-500 font-bold uppercase">Tarde</p>
                              </div>
                            </div>
                            <div className="flex justify-between p-3 bg-black/30 rounded-xl border border-white/5">
                              <span className="text-slate-400 text-xs font-bold uppercase">Precio por Hora</span>
                              <span className="font-mono font-bold text-blue-400">{selectedAgent.hourlyRateUsd || 0} $/h</span>
                            </div>
                            <div className="flex justify-between p-3 bg-black/30 rounded-xl border border-white/5">
                              <span className="text-slate-400 text-xs font-bold uppercase">Total Horas Mes</span>
                              <span className="font-mono font-bold">{stats.totalHours} h</span>
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
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-black uppercase italic text-[10px] transition-all"
                      >
                        <Printer className="w-4 h-4" /> Imprimir Recibo Semanal (Media Carta)
                      </button>
                    </div>

                    <div className="bg-blue-600/10 border border-blue-600/20 rounded-2xl p-6 flex items-start gap-4">
                      <AlertCircle className="w-6 h-6 text-blue-500 shrink-0 mt-1" />
                      <div>
                        <h4 className="font-black uppercase italic text-blue-400">Cálculo de Liquidación Proyectada</h4>
                        <p className="text-sm text-slate-400">Basado en la LOTTT (30 días de salario integral por año de servicio). Los montos son referenciales.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6" ref={liquidationRef}>
                      {(() => {
                        const liq = calculateLiquidation(selectedAgent);
                        return (
                          <>
                            <div className="bg-[#111] border border-white/10 rounded-2xl p-8 text-center space-y-2">
                              <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Total en Bolívares (Base)</p>
                              <p className="text-5xl font-black italic tracking-tighter">{liq.totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.</p>
                              <p className="text-[10px] text-slate-600 font-bold uppercase">Cálculo sobre sueldo base de 130 Bs.</p>
                            </div>
                            <div className="bg-[#111] border border-white/10 rounded-2xl p-8 text-center space-y-2">
                              <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Total en Dólares (Bonos)</p>
                              <p className="text-5xl font-black italic tracking-tighter text-green-500">{liq.totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} $</p>
                              <p className="text-[10px] text-slate-600 font-bold uppercase">Cálculo sobre bonos complementarios</p>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    <div className="flex justify-end">
                      <button 
                        onClick={generateLiquidationPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-xl font-black uppercase italic text-[10px] transition-all border border-blue-600/30"
                      >
                        <Download className="w-4 h-4" /> Descargar Liquidación PDF
                      </button>
                    </div>

                    <div className="fixed -left-[2000px] top-0">
                      <div ref={payStubRef} className="bg-white text-black p-8 w-[139.7mm] min-h-[215.9mm] flex flex-col font-sans">
                        <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
                           <div>
                             <h2 className="text-xl font-black italic uppercase italic">RECIBO DE PAGO</h2>
                             <p className="text-[10px] font-bold">INVERSIONES ROXTOR C.A.</p>
                             <p className="text-[10px]">RIF J-504746813</p>
                           </div>
                           <div className="text-right">
                             <p className="text-[10px] font-bold">FECHA: {format(new Date(), 'dd/MM/yyyy')}</p>
                             <p className="text-[10px] font-bold">NRO: {Date.now().toString().slice(-6)}</p>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8 text-[10px]">
                           <div>
                             <p className="text-slate-500 uppercase font-bold">TRABAJADOR</p>
                             <p className="font-black text-sm">{selectedAgent.fullName}</p>
                             <p>C.I: {selectedAgent.idNumber}</p>
                           </div>
                           <div className="text-right">
                             <p className="text-slate-500 uppercase font-bold">CARGO</p>
                             <p className="font-black">{selectedAgent.role}</p>
                           </div>
                        </div>

                        <div className="flex-1 border-t border-b border-black py-4 space-y-2">
                           <div className="flex justify-between text-xs">
                             <span>Sueldo Base Semanal (Bs)</span>
                             <span className="font-bold">{(selectedAgent.baseSalaryBs || 130) / 4} Bs.</span>
                           </div>
                           <div className="flex justify-between text-xs">
                             <span>Bono Complementario Semanal (USD)</span>
                             <span className="font-bold">{(selectedAgent.complementaryBonusUsd || 0) / 4} $</span>
                           </div>
                           <div className="flex justify-between text-xs">
                             <span>Horas Trabajadas</span>
                             <span className="font-bold">{calculateAttendanceStats(selectedAgent).totalHours} h</span>
                           </div>
                           {selectedAgent.hourlyRateUsd && (
                             <div className="flex justify-between text-xs text-blue-600 font-bold">
                               <span>Pago por Horas (USD)</span>
                               <span>{(calculateAttendanceStats(selectedAgent).totalHours * selectedAgent.hourlyRateUsd).toFixed(2)} $</span>
                             </div>
                           )}
                        </div>

                        <div className="mt-auto pt-8 flex justify-between items-end">
                           <div className="w-40 border-t border-black text-center pt-2">
                             <p className="text-[8px] font-bold uppercase">Firma del Trabajador</p>
                           </div>
                           <div className="text-right">
                             <p className="text-[10px] font-bold uppercase">Total a Pagar</p>
                             <p className="text-2xl font-black italic">
                               {((selectedAgent.complementaryBonusUsd || 0) / 4 + (calculateAttendanceStats(selectedAgent).totalHours * (selectedAgent.hourlyRateUsd || 0))).toFixed(2)} $
                             </p>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'vacations' && (
                  <div className="space-y-6">
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-8 space-y-8">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-black italic uppercase tracking-tighter">Plan de Vacaciones Colectivas</h3>
                        <div className="px-4 py-2 bg-green-600/20 text-green-400 rounded-xl border border-green-600/30 text-xs font-black uppercase">
                          2 Semanas / Año
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black">1</div>
                            <h4 className="font-black uppercase italic text-sm">Semana de Diciembre (Descanso)</h4>
                          </div>
                          <div className="bg-black/40 p-6 rounded-2xl border border-white/5 space-y-4">
                            <p className="text-xs text-slate-400 leading-relaxed font-medium">
                              Se otorga una semana de descanso efectivo en Diciembre. El pago incluye la semana de sueldo regular más una semana de aguinaldo.
                            </p>
                            {(() => {
                              const vac = calculateVacations(selectedAgent);
                              return (
                                <div className="flex justify-between items-end">
                                  <div>
                                    <p className="text-[10px] text-slate-500 font-black uppercase">Pago Total Diciembre</p>
                                    <p className="text-xl font-black">{vac.decemberPayment.bs.toFixed(2)} Bs.</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xl font-black text-green-500">{vac.decemberPayment.usd.toFixed(2)} $</p>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black">2</div>
                            <h4 className="font-black uppercase italic text-sm">Semana Flexible (Disfrute)</h4>
                          </div>
                          <div className="bg-black/40 p-6 rounded-2xl border border-white/5 space-y-4">
                            <p className="text-xs text-slate-400 leading-relaxed font-medium">
                              La segunda semana se puede tomar durante el año con previa notificación. El pago se puede solicitar en Diciembre o al momento del disfrute.
                            </p>
                            {(() => {
                              const vac = calculateVacations(selectedAgent);
                              return (
                                <div className="flex justify-between items-end">
                                  <div>
                                    <p className="text-[10px] text-slate-500 font-black uppercase">Pago Semana Flexible</p>
                                    <p className="text-xl font-black">{vac.annualWeekPayment.bs.toFixed(2)} Bs.</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xl font-black text-green-500">{vac.annualWeekPayment.usd.toFixed(2)} $</p>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
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
                      <div className="max-w-2xl mx-auto space-y-8 font-serif text-sm leading-relaxed text-justify">
                        <div className="text-center space-y-2 mb-12">
                          <h1 className="text-2xl font-bold uppercase underline">CONTRATO INDIVIDUAL DE TRABAJO Y CÓDIGO DE ÉTICA</h1>
                          <p className="text-xs font-bold">INVERSIONES ROXTOR C.A. - RIF J-504746813</p>
                        </div>

                        <p>
                          Entre la sociedad mercantil <b>INVERSIONES ROXTOR C.A.</b>, domiciliada en Ciudad Guayana, Estado Bolívar, 
                          representada en este acto por su Gerencia General, quien en lo sucesivo se denominará <b>EL PATRONO</b>, 
                          por una parte; y por la otra el ciudadano(a) <b>{selectedAgent.fullName?.toUpperCase()}</b>, 
                          titular de la cédula de identidad Nro. <b>{selectedAgent.idNumber}</b>, quien en lo sucesivo se denominará 
                          <b> EL TRABAJADOR</b>, se ha convenido en celebrar el presente contrato de trabajo bajo las siguientes cláusulas:
                        </p>

                        <div className="space-y-4">
                          <p><b>PRIMERA (OBJETO):</b> EL TRABAJADOR se obliga a prestar sus servicios personales bajo la dependencia de EL PATRONO en el cargo de <b>{selectedAgent.role.toUpperCase()}</b>.</p>
                          
                          <p><b>SEGUNDA (FECHA DE INGRESO):</b> La relación laboral inicia el día <b>{selectedAgent.entryDate ? format(new Date(selectedAgent.entryDate), "dd 'de' MMMM 'de' yyyy", { locale: es }) : '__________'}</b>.</p>
                          
                          <p><b>TERCERA (REMUNERACIÓN):</b> Se establece un sueldo base mensual de <b>{selectedAgent.baseSalaryBs || 130} Bolívares</b>, pagaderos semanalmente. Adicionalmente, se acuerda un bono de productividad y asistencia de <b>{selectedAgent.complementaryBonusUsd || 0} Dólares Americanos</b> (pagaderos en divisas o su equivalente en Bs. a tasa BCV).</p>
                          
                          <p><b>CUARTA (JORNADA):</b> La jornada laboral será de Lunes a Sábado, de 8:00 AM a 5:00 PM, con una hora de descanso, cumpliendo con las 45 horas semanales establecidas en la LOTTT.</p>
                          
                          <p><b>QUINTA (VACACIONES):</b> Se establecen dos (2) semanas de vacaciones anuales. Una semana de descanso obligatorio en Diciembre (pagada con sueldo + aguinaldo) y una semana de disfrute flexible durante el año.</p>
                          
                          <p><b>SEXTA (CONFIDENCIALIDAD Y ÉTICA):</b> EL TRABAJADOR se compromete a no filtrar diseños, técnicas de producción o información interna de la empresa. Queda prohibido el uso de equipos para fines personales sin autorización. El incumplimiento de estas normas o el maltrato a la maquinaria será causal de despido justificado según la LOTTT.</p>
                          
                          <p><b>SÉPTIMA (COMPROMISO):</b> La empresa se compromete a dotar de uniformes, herramientas de diseño y un ambiente de trabajo seguro en la sede de Ciudad Guayana.</p>
                        </div>

                        <div className="pt-24 grid grid-cols-2 gap-20 text-center">
                          <div className="border-t border-black pt-2">
                            <p className="font-bold">POR EL PATRONO</p>
                            <p className="text-[10px]">INVERSIONES ROXTOR C.A.</p>
                          </div>
                          <div className="border-t border-black pt-2">
                            <p className="font-bold">POR EL TRABAJADOR</p>
                            <p className="text-[10px]">{selectedAgent.fullName}</p>
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
