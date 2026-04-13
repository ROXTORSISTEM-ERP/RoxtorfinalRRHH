
import React from 'react';
import { Agent, AppSettings } from '../types';
import { calculatePayrollDetails, getWeeklyAttendance, calculateSeniority } from '../utils/payrollCalculations';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  agent: Agent;
  settings: AppSettings;
  commissionsUsd?: number;
  paymentReference?: string;
  onReferenceChange?: (ref: string) => void;
  isPrinting?: boolean;
}

const PayrollReceipt: React.FC<Props> = ({ 
  agent, 
  settings, 
  commissionsUsd = 0, 
  paymentReference = '',
  onReferenceChange,
  isPrinting = false
}) => {
  const details = calculatePayrollDetails(agent, settings, commissionsUsd);
  const { attendanceTable } = getWeeklyAttendance(agent);
  const seniority = calculateSeniority(agent.entryDate);

  const fiscalData = {
    name: "Inversiones Roxtor, C.A",
    rif: "J-40295973-7",
    address: "Ciudad Guayana, Estado Bolívar"
  };

  return (
    <div className={`bg-white text-black p-6 w-[139.7mm] min-h-[215.9mm] flex flex-col font-sans border border-slate-200 ${isPrinting ? 'print-optimized' : ''}`}>
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4">
        <div className="flex gap-3 items-center">
          <img 
            src={settings.logoUrl || "https://picsum.photos/seed/roxtor/100/50"} 
            alt="Logo" 
            className="h-10 grayscale" 
            referrerPolicy="no-referrer"
          />
          <div>
            <h1 className="text-lg font-black italic uppercase tracking-tighter">RECIBO DE PAGO</h1>
            <p className="text-[8px] font-bold uppercase">{fiscalData.name}</p>
            <p className="text-[8px] font-bold uppercase">RIF {fiscalData.rif}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-bold uppercase">Fecha: {format(new Date(), 'dd/MM/yyyy')}</p>
          <p className="text-[9px] font-bold uppercase">Antigüedad: {seniority.years}a {seniority.months}m {seniority.days}d</p>
        </div>
      </div>

      {/* Agent Info */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-[9px]">
        <div className="bg-slate-50 p-2 rounded border border-slate-200">
          <p className="text-slate-500 uppercase font-black text-[7px]">COLABORADOR</p>
          <p className="font-black text-xs uppercase">{agent.fullName || agent.name}</p>
          <p className="font-bold">C.I: {agent.idNumber || 'S/N'}</p>
        </div>
        <div className="bg-slate-50 p-2 rounded border border-slate-200 text-right">
          <p className="text-slate-500 uppercase font-black text-[7px]">CARGO / ROL</p>
          <p className="font-black text-xs uppercase">{agent.role}</p>
          <p className="font-bold uppercase">Sede: {agent.storeId === 'store_1' ? 'Principal' : 'Centro'}</p>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="mb-4">
        <p className="text-[8px] font-black uppercase mb-1 border-b border-black">Validación de Asistencia Semanal</p>
        <table className="w-full text-[8px] border-collapse">
          <thead>
            <tr className="bg-slate-100 uppercase font-black">
              <th className="border border-slate-300 p-1 text-left">Día</th>
              <th className="border border-slate-300 p-1">Fecha</th>
              <th className="border border-slate-300 p-1">Entrada</th>
              <th className="border border-slate-300 p-1">Estado</th>
              <th className="border border-slate-300 p-1">Retraso</th>
            </tr>
          </thead>
          <tbody>
            {attendanceTable.map((d, i) => (
              <tr key={i} className="text-center">
                <td className="border border-slate-200 p-1 text-left font-bold">{d.dayName}</td>
                <td className="border border-slate-200 p-1">{format(parseISO(d.date), 'dd/MM')}</td>
                <td className="border border-slate-200 p-1">{d.checkIn}</td>
                <td className={`border border-slate-200 p-1 font-bold uppercase ${d.status === 'ausente' ? 'text-red-600' : ''}`}>
                  {d.status}
                </td>
                <td className={`border border-slate-200 p-1 font-bold ${d.delayMinutes > 0 ? 'text-amber-600' : ''}`}>
                  {d.delayMinutes > 0 ? `${d.delayMinutes} min` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payment Body */}
      <div className="flex-1 space-y-2">
        <p className="text-[8px] font-black uppercase mb-1 border-b border-black">Conceptos de Pago (Tasa: {details.exchangeRate} Bs/$)</p>
        <div className="space-y-1 text-[9px]">
          <div className="flex justify-between items-center py-1 border-b border-slate-100">
            <span className="font-medium uppercase">Sueldo Base Legal (LOTTT)</span>
            <span className="font-bold">{details.legalWeeklyBs.toFixed(2)} Bs.</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-100">
            <span className="font-medium uppercase">Bono Complementario Roxtor</span>
            <span className="font-bold">{details.roxtorBonusBs.toFixed(2)} Bs.</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-100">
            <span className="font-medium uppercase">Comisiones por Producción / Ventas</span>
            <span className="font-bold">{details.commissionsBs.toFixed(2)} Bs.</span>
          </div>
          
          {/* Deductions */}
          <div className="pt-2">
            <p className="text-[7px] font-black text-red-600 uppercase mb-1">Deducciones</p>
            <div className="flex justify-between items-center py-1 text-red-600">
              <span className="font-medium uppercase">(-) Descuento por Ausencia ({details.totalAbsences} días)</span>
              <span className="font-bold">-{details.absenceDeductionBs.toFixed(2)} Bs.</span>
            </div>
            <div className="flex justify-between items-center py-1 text-red-600">
              <span className="font-medium uppercase">(-) Descuento por Impuntualidad ({details.totalDelayMinutes} min)</span>
              <span className="font-bold">-{details.delayDeductionBs.toFixed(2)} Bs.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Totals & Reference */}
      <div className="mt-4 pt-4 border-t-2 border-black">
        <div className="flex justify-between items-end mb-4">
          <div className="flex-1 mr-8">
            <p className="text-[8px] font-black uppercase mb-1">Referencia de Pago</p>
            {onReferenceChange ? (
              <input 
                type="text" 
                value={paymentReference}
                onChange={(e) => onReferenceChange(e.target.value)}
                placeholder="Nro. Referencia / Pago Móvil"
                className="w-full border-b border-slate-300 text-[10px] font-black uppercase outline-none py-1 focus:border-black"
              />
            ) : (
              <p className="text-[10px] font-black uppercase border-b border-slate-300 py-1">{paymentReference || 'S/N'}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black uppercase">Total Neto a Pagar</p>
            <p className="text-2xl font-black italic tracking-tighter leading-none">{details.netTotalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Equiv. {details.netTotalUsd.toFixed(2)} $</p>
          </div>
        </div>

        {/* Footer */}
        <div className="grid grid-cols-2 gap-12 pt-8">
          <div className="text-center">
            <div className="border-t border-black pt-1">
              <p className="text-[7px] font-black uppercase tracking-widest">Firma del Trabajador</p>
              <p className="text-[6px] text-slate-400 mt-1">C.I. {agent.idNumber}</p>
            </div>
          </div>
          <div className="text-center relative">
            <div className="border-t border-black pt-1">
              <p className="text-[7px] font-black uppercase tracking-widest">Sello Roxtor Academy</p>
              <p className="text-[6px] text-slate-400 mt-1">Gerencia de Operaciones</p>
            </div>
            {/* Mock Stamp */}
            <div className="absolute -top-6 right-0 border-2 border-black/20 rounded-full w-12 h-12 flex items-center justify-center rotate-12 opacity-30">
              <span className="text-[6px] font-black uppercase text-center">ROXTOR<br/>ACADEMY</span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-[6px] font-bold uppercase text-slate-400 leading-tight">
            He recibido a mi entera satisfacción la cantidad arriba indicada por concepto de pago de mis servicios. <br/>
            Declaro estar conforme con los cálculos de asignaciones y deducciones presentados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PayrollReceipt;
