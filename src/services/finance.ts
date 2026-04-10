
import { Expense, Order, AppSettings, Debt, PayrollPayment } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const createExpense = (
  description: string,
  amountUsd: number,
  category: Expense['category'],
  settings: AppSettings,
  storeId: string,
  agentId?: string
): Expense => {
  return {
    id: uuidv4(),
    timestamp: Date.now(),
    description,
    amountUsd,
    amountBs: amountUsd * settings.bcvRate,
    bcvRate: settings.bcvRate,
    storeId,
    category,
    isAdvance: category === 'Nómina',
    agentId
  };
};

export const calculateFinancialSummary = (orders: Order[], expenses: Expense[]) => {
  const totalIncome = orders.reduce((acc, o) => acc + o.abonoUsd, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amountUsd, 0);
  const netProfit = totalIncome - totalExpenses;

  return {
    totalIncome,
    totalExpenses,
    netProfit
  };
};

export const getPendingDebts = (debts: Debt[]) => {
  return debts.filter(d => d.status === 'pendiente');
};
