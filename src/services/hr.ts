
import { Agent, AttendanceRecord, PayrollPayment, AppSettings } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const registerAttendance = (
  agentId: string,
  storeId: string,
  status: AttendanceRecord['status'] = 'presente'
): AttendanceRecord => {
  return {
    id: uuidv4(),
    date: new Date().toISOString().split('T')[0],
    checkIn: Date.now(),
    status,
    locationVerified: true,
    storeId
  };
};

export const calculateCommission = (
  agent: Agent,
  orders: any[] // Filtered orders for the agent
): number => {
  if (agent.salaryType !== 'comision' && agent.salaryType !== 'comision/quincena') return 0;
  const totalSales = orders.reduce((acc, o) => acc + o.totalUsd, 0);
  return totalSales * (agent.commissionPercent || 0) / 100;
};

export const createPayrollPayment = (
  agent: Agent,
  amountUsd: number,
  settings: AppSettings
): PayrollPayment => {
  return {
    id: uuidv4(),
    agentId: agent.id,
    agentName: agent.name,
    amountUsd,
    amountBs: amountUsd * settings.bcvRate,
    bcvRate: settings.bcvRate,
    date: new Date().toISOString().split('T')[0],
    method: 'EFECTIVO',
    reference: 'Nómina Generada'
  };
};
