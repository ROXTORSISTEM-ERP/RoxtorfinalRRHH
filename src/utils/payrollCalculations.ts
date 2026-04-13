
import { Agent, AppSettings, AttendanceRecord } from '../types';
import { differenceInDays, differenceInMonths, differenceInYears, parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

export const calculateSeniority = (entryDate?: string) => {
  if (!entryDate) return { years: 0, months: 0, days: 0, totalDays: 0 };
  const start = parseISO(entryDate);
  const end = new Date();
  
  const years = differenceInYears(end, start);
  const months = differenceInMonths(end, start) % 12;
  const days = differenceInDays(end, start) % 30; // Approximation
  const totalDays = differenceInDays(end, start);

  return { years, months, days, totalDays };
};

export const getWeeklyAttendance = (agent: Agent) => {
  const now = new Date();
  const start = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(now, { weekStartsOn: 1 }); // Sunday (we use Mon-Sat)
  
  const weeklyRecords = (agent.attendance || []).filter(r => {
    const recordDate = parseISO(r.date);
    return isWithinInterval(recordDate, { start, end });
  });

  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const attendanceTable = days.map((dayName, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const dateStr = date.toISOString().split('T')[0];
    const record = weeklyRecords.find(r => r.date === dateStr);
    
    let delayMinutes = 0;
    if (record && record.checkIn) {
      const checkInTime = new Date(record.checkIn);
      const expectedTime = new Date(checkInTime);
      expectedTime.setHours(8, 0, 0, 0);
      if (checkInTime > expectedTime) {
        delayMinutes = Math.floor((checkInTime.getTime() - expectedTime.getTime()) / 60000);
      }
    }

    return {
      dayName,
      date: dateStr,
      status: record?.status || 'ausente',
      checkIn: record?.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
      delayMinutes: record?.status === 'ausente' ? 0 : delayMinutes
    };
  });

  const totalAbsences = attendanceTable.filter(d => d.status === 'ausente').length;
  const totalDelayMinutes = attendanceTable.reduce((acc, d) => acc + d.delayMinutes, 0);

  return { attendanceTable, totalAbsences, totalDelayMinutes };
};

export const calculatePayrollDetails = (agent: Agent, settings: AppSettings, commissionsUsd: number = 0) => {
  const exchangeRate = settings.bcvRate || 1;
  const weeklyRateUsd = agent.salaryAmountUsd || 0;
  const totalWeeklyBs = weeklyRateUsd * exchangeRate;
  
  const legalMonthlyBs = 130;
  const legalWeeklyBs = legalMonthlyBs / 4;
  
  const roxtorBonusBs = Math.max(0, totalWeeklyBs - legalWeeklyBs);
  const commissionsBs = commissionsUsd * exchangeRate;

  const { totalAbsences, totalDelayMinutes } = getWeeklyAttendance(agent);
  
  // Descuento por Falta: (Sueldo Semanal / 6) x Días ausentes
  const absenceDeductionBs = (totalWeeklyBs / 6) * totalAbsences;
  
  // Descuento por Tardanza: (Sueldo Semanal / 45 horas) x Minutos de retraso convertidos a fracción de hora
  const delayHours = totalDelayMinutes / 60;
  const delayDeductionBs = (totalWeeklyBs / 45) * delayHours;

  const totalDeductionsBs = absenceDeductionBs + delayDeductionBs;
  const netTotalBs = legalWeeklyBs + roxtorBonusBs + commissionsBs - totalDeductionsBs;
  const netTotalUsd = netTotalBs / exchangeRate;

  return {
    exchangeRate,
    legalWeeklyBs,
    roxtorBonusBs,
    commissionsBs,
    commissionsUsd,
    absenceDeductionBs,
    delayDeductionBs,
    totalDeductionsBs,
    netTotalBs,
    netTotalUsd,
    totalAbsences,
    totalDelayMinutes
  };
};

export const calculateLiquidationDetails = (agent: Agent, settings: AppSettings) => {
  const { years, totalDays } = calculateSeniority(agent.entryDate);
  const legalMonthlyBs = 130;
  const realWeeklyUsd = agent.salaryAmountUsd || 0;
  const realMonthlyUsd = realWeeklyUsd * 4;
  const exchangeRate = settings.bcvRate || 1;

  // Prestaciones Sociales (LOTTT): Basado en 130 Bs (30 días por año)
  const dailyLegalBs = legalMonthlyBs / 30;
  const totalLotttBs = (totalDays / 365) * 30 * dailyLegalBs;

  // Liquidación de Gestión (Roxtor): Basado en el sueldo real en USD
  const dailyRealUsd = realMonthlyUsd / 30;
  const totalRoxtorUsd = (totalDays / 365) * 30 * dailyRealUsd;
  const totalRoxtorBs = totalRoxtorUsd * exchangeRate;

  // Bono de Egreso Especial (Para Formato C)
  const specialExitBonusBs = Math.max(0, totalRoxtorBs - totalLotttBs);

  return {
    lotttBs: totalLotttBs,
    roxtorUsd: totalRoxtorUsd,
    roxtorBs: totalRoxtorBs,
    specialExitBonusBs,
    seniorityYears: years,
    seniorityDays: totalDays,
    exchangeRate
  };
};

export const calculateVacationDetails = (agent: Agent, settings: AppSettings) => {
  const realWeeklyUsd = agent.salaryAmountUsd || 0;
  const exchangeRate = settings.bcvRate || 1;
  
  // Vacaciones Colectivas: 2 semanas de sueldo real (1 Vacación + 1 Aguinaldo)
  const vacationWeekUsd = realWeeklyUsd;
  const aguinaldoWeekUsd = realWeeklyUsd;
  
  const totalUsd = vacationWeekUsd + aguinaldoWeekUsd;
  const totalBs = totalUsd * exchangeRate;

  return {
    vacationWeekUsd,
    aguinaldoWeekUsd,
    vacationWeekBs: vacationWeekUsd * exchangeRate,
    aguinaldoWeekBs: aguinaldoWeekUsd * exchangeRate,
    totalUsd,
    totalBs,
    weeks: 2,
    exchangeRate
  };
};
