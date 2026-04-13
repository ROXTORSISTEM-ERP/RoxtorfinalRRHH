

import React, { useState, useMemo } from 'react';
import { Order, Product, AppSettings, Agent, Workshop, Expense, Debt, PayrollPayment } from '../types';
import { ROXTOR_SYSTEM_INSTRUCTIONS } from '../constants/systemInstructions';
import { callAI } from '../utils/ai';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Zap, 
  Sparkles, 
  Loader2, 
  MinusCircle,
  Wallet,
  Store,
  FileDown,
  CheckCircle2,
  History,
  Medal,
  CreditCard,
  ArrowUpRight,
  TrendingDown,
  BookOpen,
  Download,
  PieChart,
  Activity,
  BarChart3,
  Warehouse
} from 'lucide-react';
import OrderReceipt from './OrderReceipt';
import { exportToCSV } from '../utils/csvExport';
import { exportToExcel, exportToPDF } from '../utils/reportExport';

interface Props {
  orders: Order[];
  expenses: Expense[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  products: Product[];
  settings: AppSettings;
  agents: Agent[];
  workshops: Workshop[];
  debts: Debt[];
  payroll: PayrollPayment[];
}

const Reports: React.FC<Props> = ({ orders = [], expenses = [], setOrders, products, settings, agents = [], workshops, debts = [], payroll = [] }) => {
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<Order | null>(null);
  const [reportSubTab, setReportSubTab] = useState<'dashboard' | 'liabilities' | 'operations' | 'receivables' | 'intelligence' | 'history' | 'education'>('dashboard');
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [historySearch, setHistorySearch] = useState('');
  
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isAskingAi, setIsAskingAi] = useState(false);
  const [coachQuestion, setCoachQuestion] = useState('');
  const [coachAnswer, setCoachAnswer] = useState<string | null>(null);
  const [isAskingCoach, setIsAskingCoach] = useState(false);

  const months = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];

  const parseStoreDate = (dateStr: string) => {
    if (!dateStr) return null;
    try {
      const [d, m, y] = dateStr.split('/').map(Number);
      return { day: d, month: m - 1, year: y };
    } catch { return null; }
  };

  const parseOrderDateToTimestamp = (dateStr: string) => {
    if (!dateStr) return 0;
    const [d, m, y] = dateStr.split('/').map(Number);
    return new Date(y, m - 1, d, 23, 59, 59).getTime();
  };

  const filteredByMonth = useMemo(() => orders.filter(o => {
    const date = parseStoreDate(o.issueDate);
    return date && date.month === viewMonth && date.year === viewYear;
  }), [orders, viewMonth, viewYear]);

  // Finanzas: Cálculos
  const totalSalesUsd = useMemo(() => filteredByMonth.filter(o => !o.isLogistics).reduce((acc, o) => acc + (o.abonoUsd || 0), 0), [filteredByMonth]);
  const totalSalesBs = useMemo(() => filteredByMonth.filter(o => !o.isLogistics).reduce((acc, o) => acc + ((o.abonoUsd || 0) * (o.bcvRate || 1)), 0), [filteredByMonth]);
  
  const totalOperatingExpensesUsd = useMemo(() => expenses.filter(e => {
    const date = new Date(e.timestamp);
    return date.getMonth() === viewMonth && date.getFullYear() === viewYear;
  }).reduce((acc, e) => acc + e.amountUsd, 0), [expenses, viewMonth, viewYear]);

  const totalOperatingExpensesBs = useMemo(() => expenses.filter(e => {
    const date = new Date(e.timestamp);
    return date.getMonth() === viewMonth && date.getFullYear() === viewYear;
  }).reduce((acc, e) => acc + (e.amountBs || (e.amountUsd * (e.bcvRate || 1))), 0), [expenses, viewMonth, viewYear]);

  const expensesByCategory = useMemo(() => {
    const categories = ['Logística/Gasolina', 'Desperdicios', 'Insumos', 'Nómina', 'SOCIOS', 'Otros'];
    const result: Record<string, number> = {};
    categories.forEach(cat => {
      result[cat] = expenses.filter(e => {
        const date = new Date(e.timestamp);
        return date.getMonth() === viewMonth && date.getFullYear() === viewYear && e.category === cat;
      }).reduce((acc, e) => acc + e.amountUsd, 0);
    });
    return result;
  }, [expenses, viewMonth, viewYear]);

  const wasteByAgent = useMemo(() => {
    const result: Record<string, number> = {};
    expenses.filter(e => {
      const date = new Date(e.timestamp);
      return date.getMonth() === viewMonth && date.getFullYear() === viewYear && e.category === 'Desperdicios' && e.responsibleAgentId;
    }).forEach(e => {
      const agent = agents.find(a => a.id === e.responsibleAgentId);
      const name = agent ? agent.name : 'Desconocido';
      result[name] = (result[name] || 0) + e.amountUsd;
    });
    return result;
  }, [expenses, agents, viewMonth, viewYear]);

  const totalPayrollUsd = useMemo(() => payroll.filter(p => {
    const date = new Date(p.date);
    return date.getMonth() === viewMonth && date.getFullYear() === viewYear;
  }).reduce((acc, p) => acc + p.amountUsd, 0), [payroll, viewMonth, viewYear]);

  const totalDebtPaymentsUsd = useMemo(() => {
    let total = 0;
    debts.forEach(d => {
      d.payments.forEach(p => {
        const date = new Date(p.date);
        if (date.getMonth() === viewMonth && date.getFullYear() === viewYear) total += p.amountUsd;
      });
    });
    return total;
  }, [debts, viewMonth, viewYear]);

  const totalReceivablesUsd = useMemo(() => orders.filter(o => o.restanteUsd > 0 && !o.isLogistics).reduce((acc, o) => acc + o.restanteUsd, 0), [orders]);

  const totalExpressSurchargesUsd = useMemo(() => {
    return filteredByMonth.reduce((acc, order) => {
      const expressItem = order.items.find(item => item.name.toUpperCase().includes('RECARGO EXPRESS'));
      return acc + (expressItem ? (expressItem.priceUsd * expressItem.quantity) : 0);
    }, 0);
  }, [filteredByMonth]);

  const totalExpensesSum = totalOperatingExpensesUsd + totalPayrollUsd + totalDebtPaymentsUsd;
  const balanceNetoUsd = totalSalesUsd - totalExpensesSum;

  // Eficiencia de Agentes
  const agentEfficiency = useMemo(() => {
    return agents.map(agent => {
      let completedCount = 0;
      let onTimeCount = 0;

      orders.forEach(order => {
        const deadline = parseOrderDateToTimestamp(order.deliveryDate);
        const participations = order.history.filter(h => h.agentId === agent.id && h.action.includes('[TASK_OK]'));
        
        participations.forEach(p => {
          completedCount++;
          if (p.timestamp <= deadline) onTimeCount++;
        });
      });

      return {
        id: agent.id,
        name: agent.name,
        role: agent.role,
        completed: completedCount,
        efficiency: completedCount > 0 ? Math.round((onTimeCount / completedCount) * 100) : 0
      };
    }).sort((a, b) => b.efficiency - a.efficiency);
  }, [agents, orders]);

  const workshopEfficiency = useMemo(() => {
    return workshops.map(workshop => {
      let totalOrders = 0;
      let completedOrders = 0;
      let onTimeOrders = 0;

      orders.forEach(order => {
        if (order.assignedWorkshopIds?.includes(workshop.id)) {
          totalOrders++;
          if (order.status === 'completado') {
            completedOrders++;
            const deadline = parseOrderDateToTimestamp(order.deliveryDate);
            const completionEvent = order.history.find(h => h.status === 'completado');
            if (completionEvent && completionEvent.timestamp <= deadline) {
              onTimeOrders++;
            }
          }
        }
      });

      return {
        id: workshop.id,
        name: workshop.name,
        total: totalOrders,
        completed: completedOrders,
        efficiency: completedOrders > 0 ? Math.round((onTimeOrders / completedOrders) * 100) : 0
      };
    }).sort((a, b) => b.efficiency - a.efficiency);
  }, [workshops, orders]);

  // Feed de Historial Operativo Maestro
  const masterOperativeHistory = useMemo(() => {
    const events: any[] = [];
    orders.forEach(order => {
      order.history.forEach(h => {
        if (h.action.includes('[TASK_OK]')) {
          const agent = agents.find(a => a.id === h.agentId);
          events.push({
            agentName: agent?.name || 'Sistema',
            action: h.action.replace('[TASK_OK]', '').trim(),
            orderNum: order.orderNumber,
            timestamp: h.timestamp,
            status: h.status
          });
        }
      });
    });
    return events.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);
  }, [orders, agents]);

  const currentMonthGoal = useMemo(() => {
    const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
    return settings.salesGoals?.find(g => g.month === monthStr);
  }, [settings.salesGoals, viewMonth, viewYear]);

  const salesGoalProgress = useMemo(() => {
    if (!currentMonthGoal || currentMonthGoal.targetAmountUsd === 0) return 0;
    return Math.min(Math.round((totalSalesUsd / currentMonthGoal.targetAmountUsd) * 100), 100);
  }, [totalSalesUsd, currentMonthGoal]);

  const breakEvenAnalysis = useMemo(() => {
    const totalFixedCosts = totalExpensesSum;
    const averageMargin = 0.40; 
    const breakEvenSales = averageMargin > 0 ? totalFixedCosts / averageMargin : 0;
    
    const starProductPrice = 12;
    const unitsNeeded = starProductPrice > 0 ? Math.ceil(breakEvenSales / starProductPrice) : 0;

    return {
      breakEvenSales,
      unitsNeeded,
      isCovered: totalSalesUsd >= breakEvenSales,
      gap: Math.max(0, breakEvenSales - totalSalesUsd)
    };
  }, [totalExpensesSum, totalSalesUsd]);

  // Inteligencia Estratégica
  const strategicIntelligence = useMemo(() => {
    // 1. Margen por Línea
    const lines = ['Uniformes corporativos', 'Deportivos full print', 'Colegios', 'B2C sublimación', 'Insumos', 'Otros'];
    const marginByLine = lines.map(line => {
      const lineOrders = filteredByMonth.filter(o => o.items.some(item => {
        const p = products.find(prod => prod.id === item.productId);
        return p?.line === line;
      }));
      
      const revenue = lineOrders.reduce((acc, o) => acc + o.totalUsd, 0);
      const cost = lineOrders.reduce((acc, o) => {
        return acc + o.items.reduce((itemAcc, item) => {
          const p = products.find(prod => prod.id === item.productId);
          return itemAcc + ((p?.costUsd || 0) * item.quantity);
        }, 0);
      }, 0);
      
      const margin = revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0;
      return { line, revenue, margin: Math.round(margin) };
    });

    // 2. Rentabilidad por Cliente
    const customerStats = Array.from(new Set(orders.map(o => o.customerName))).map(name => {
      const customerOrders = orders.filter(o => o.customerName === name);
      const revenue = customerOrders.reduce((acc, o) => acc + o.totalUsd, 0);
      const cost = customerOrders.reduce((acc, o) => {
        return acc + o.items.reduce((itemAcc, item) => {
          const p = products.find(prod => prod.id === item.productId);
          return itemAcc + ((item.costUsd || p?.costUsd || 0) * item.quantity);
        }, 0);
      }, 0);
      const utility = revenue - cost;
      const reworks = customerOrders.reduce((acc, o) => acc + (o.reworksCount || 0), 0);
      const urgencies = customerOrders.filter(o => o.isUrgent).length;
      
      let classification: 'A' | 'B' | 'C' = 'B';
      if (revenue > 500 && reworks === 0 && utility > revenue * 0.4) classification = 'A';
      else if (reworks > 2 || revenue < 50 || utility < revenue * 0.2) classification = 'C';

      return { name, revenue, utility, reworks, urgencies, classification };
    }).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    // 2.1 Utilidad por Contrato (Top 10 órdenes más rentables)
    const contractProfitability = filteredByMonth.filter(o => !o.isLogistics).map(o => {
      const revenue = o.totalUsd;
      const cost = o.items.reduce((acc, item) => {
        const p = products.find(prod => prod.id === item.productId);
        return acc + ((item.costUsd || p?.costUsd || 0) * item.quantity);
      }, 0);
      const utility = revenue - cost;
      const margin = revenue > 0 ? (utility / revenue) * 100 : 0;
      return { 
        id: o.id,
        orderNumber: o.orderNumber, 
        customerName: o.customerName, 
        revenue, 
        utility, 
        margin: Math.round(margin) 
      };
    }).sort((a, b) => b.utility - a.utility).slice(0, 10);

    // 3. Capacidad Productiva
    const weeklyCapacity = settings.weeklyCapacityUnits || 500;
    const currentWeeklyProduction = filteredByMonth.reduce((acc, o) => acc + o.items.reduce((iAcc, i) => iAcc + i.quantity, 0), 0) / 4; // Promedio semanal
    const saturation = Math.min(Math.round((currentWeeklyProduction / weeklyCapacity) * 100), 100);

    // 4. Dependencia de Dueño
    const ownerActions = orders.reduce((acc, o) => {
      return acc + o.history.filter(h => {
        const agent = agents.find(a => a.id === h.agentId);
        return agent?.role?.toLowerCase().includes('dueño') || agent?.role?.toLowerCase().includes('gerente');
      }).length;
    }, 0);
    const totalActions = orders.reduce((acc, o) => acc + o.history.length, 0);
    const ownerDependency = totalActions > 0 ? Math.round((ownerActions / totalActions) * 100) : 0;

    // 5. Salud de Flujo de Caja (Score 0-100)
    const liquidity = totalSalesUsd;
    const receivablesRisk = totalReceivablesUsd > totalSalesUsd * 0.5 ? 20 : 0;
    const debtRisk = totalDebtPaymentsUsd > totalSalesUsd * 0.3 ? 20 : 0;
    const cashFlowScore = Math.max(0, 100 - receivablesRisk - debtRisk - (ownerDependency > 70 ? 10 : 0));

    // 6. Capital de Trabajo
    const workingCapital = totalSalesUsd + totalReceivablesUsd - totalExpensesSum - totalDebtPaymentsUsd;

    return {
      marginByLine,
      customerStats,
      contractProfitability,
      saturation,
      ownerDependency,
      cashFlowScore,
      weeklyCapacity,
      workingCapital
    };
  }, [filteredByMonth, products, orders, settings, agents, totalSalesUsd, totalReceivablesUsd, totalDebtPaymentsUsd, totalExpensesSum]);

// --- CORRECCIÓN ÚNICA NECESARIA ---

const askAiForFinancialReport = async () => {
  setIsAskingAi(true);
  
  try {
    const prompt = `Actúa como el CFO y Auditor de Operaciones de ROXTOR ERP. 
    Periodo: ${months[viewMonth]} ${viewYear}. 
      
    DATOS FINANCIEROS Y OPERATIVOS:
    - Ventas Reales (Ingresos): $${totalSalesUsd}
    - Meta de Venta: $${currentMonthGoal?.targetAmountUsd || 'No definida'}
    - Progreso de Meta: ${salesGoalProgress}%
    - Recargos Protocolo Express: $${totalExpressSurchargesUsd}
    - Gastos por Categoría: ${JSON.stringify(expensesByCategory)}
    - Desperdicios por Responsable: ${JSON.stringify(wasteByAgent)}
    - Nómina (Pagos Directos): $${totalPayrollUsd}
    - Pagos de Deudas: $${totalDebtPaymentsUsd}
    - Saldo por Cobrar: $${totalReceivablesUsd}
    - Balance Neto: $${balanceNetoUsd}
    - Punto de Equilibrio: $${breakEvenAnalysis.breakEvenSales.toFixed(2)}
    - Saturación Taller: ${strategicIntelligence.saturation}%
    - Dependencia Dueño: ${strategicIntelligence.ownerDependency}%
    - Score Salud Flujo Caja: ${strategicIntelligence.cashFlowScore}/100
    
    INSTRUCCIÓN: Genera un análisis técnico y crítico enfocado en MEJORAR LA PRODUCTIVIDAD y LA RENTABILIDAD.
    Identifica fugas de capital, ineficiencias en el taller y sugiere acciones concretas.
    
    Responde OBLIGATORIAMENTE en este formato:
    [STATUS]: (Óptimo / Alerta / Crítico)
    [ANÁLISIS DE DATOS]: Desglose técnico de los números.
    [CUESTIONAMIENTO]: Pregunta provocadora sobre una decisión o dato.
    [ACCIÓN DE MEJORA]: Recomendación técnica concreta para aumentar productividad.`;

    const response = await callAI(prompt);
    setAiAdvice(response || "No se pudo generar el informe.");

  } catch (e) { 
    console.error(e);
    setAiAdvice("Error al conectar con la IA Auditora."); 
  } finally { 
    setIsAskingAi(false); 
  }
};

  const askAiCoach = async () => {
    if (!coachQuestion?.trim()) return;

    setIsAskingCoach(true);

    try {
      const prompt = `Actúa como un Coach Financiero experto para ROXTOR ERP.
      El usuario pregunta: "${coachQuestion}"
      Contexto de ROXTOR:
      - Ventas del mes: $${totalSalesUsd}
      - Gastos del mes: $${totalExpensesSum}
      - Punto de equilibrio: $${breakEvenAnalysis.breakEvenSales.toFixed(2)}
      Responde de forma educativa, motivadora y técnica.`;

      const response = await callAI(prompt);
      setCoachAnswer(response || "No pude procesar tu duda.");
    } catch (error) {
      setCoachAnswer("Error al conectar con el Coach.");
    } finally {
      setIsAskingCoach(false);
    }
  };

  const handleUpdateOrder = (updatedOrder: Order) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    // Forzar guardado en nube si está activo
    window.dispatchEvent(new CustomEvent('forceCloudPush'));
  };

  const exportFinanzasCSV = () => {
    const data = [{
      Mes: months[viewMonth],
      Año: viewYear,
      Ventas_Cobradas: totalSalesUsd,
      Gastos_Operativos: totalOperatingExpensesUsd,
      Nomina: totalPayrollUsd,
      Pagos_Deuda: totalDebtPaymentsUsd,
      Balance_Neto: balanceNetoUsd,
      Cuentas_Por_Cobrar: totalReceivablesUsd,
      Punto_Equilibrio: breakEvenAnalysis.breakEvenSales,
      Capital_Trabajo: strategicIntelligence.workingCapital
    }];
    exportToCSV(data, `Finanzas_Roxtor_${months[viewMonth]}_${viewYear}`);
  };

  const exportReceivablesCSV = () => {
    const data = orders.filter(o => o.restanteUsd > 0).map(o => ({
      Orden: o.orderNumber,
      Cliente: o.customerName,
      Cedula: o.customerCi,
      Telefono: o.customerPhone,
      Fecha: o.issueDate,
      Total: o.totalUsd,
      Abonado: o.abonoUsd,
      Pendiente: o.restanteUsd
    }));
    exportToCSV(data, `Cuentas_Por_Cobrar_Roxtor_${Date.now()}`);
  };

  const exportEfficiencyCSV = () => {
    const data = agentEfficiency.map(a => ({
      Agente: a.name,
      Rol: a.role,
      Tareas_Completadas: a.completed,
      Eficiencia_Porcentaje: a.efficiency
    }));
    exportToCSV(data, `Eficiencia_Equipo_Roxtor_${Date.now()}`);
  };

  const exportExpensesCSV = () => {
    const data = expenses.filter(e => {
      const date = new Date(e.timestamp);
      return date.getMonth() === viewMonth && date.getFullYear() === viewYear;
    }).map(e => ({
      Fecha: new Date(e.timestamp).toLocaleDateString(),
      Categoria: e.category,
      Monto_USD: e.amountUsd,
      Descripcion: e.description,
      Responsable: agents.find(a => a.id === e.responsibleAgentId)?.name || 'N/A'
    }));
    exportToCSV(data, `Egresos_Roxtor_${months[viewMonth]}_${viewYear}`);
  };

  const exportVentasConsolidado = (format: 'excel' | 'pdf') => {
    const data = filteredByMonth.filter(o => !o.isLogistics).map(o => ({
      FECHA: o.issueDate,
      ORDEN: o.orderNumber,
      DESCRIPCION: o.items.map(i => i.name).join(', ').substring(0, 50),
      MONTO_USD: `$${(o.abonoUsd || 0).toFixed(2)}`,
      MONTO_BS: `Bs. ${((o.abonoUsd || 0) * (o.bcvRate || 1)).toFixed(2)}`,
      TASA_BCV: (o.bcvRate || 1).toFixed(2)
    }));

    const filename = `Libro_Ventas_${months[viewMonth]}_${viewYear}`;
    const title = `LIBRO DE VENTAS CONSOLIDADO - ${months[viewMonth]} ${viewYear}`;

    if (format === 'excel') {
      const excelData = [...data, { 
        FECHA: 'TOTAL', 
        ORDEN: '', 
        DESCRIPCION: '', 
        MONTO_USD: `$${totalSalesUsd.toFixed(2)}`,
        MONTO_BS: `Bs. ${totalSalesBs.toFixed(2)}`,
        TASA_BCV: ''
      }];
      exportToExcel(excelData, filename);
    } else {
      const headers = ['FECHA', 'ORDEN', 'DESCRIPCION', 'MONTO USD', 'MONTO BS', 'TASA BCV'];
      const body = data.map(d => [d.FECHA, d.ORDEN, d.DESCRIPCION, d.MONTO_USD, d.MONTO_BS, d.TASA_BCV]);
      body.push(['', '', 'TOTAL GENERAL', `$${totalSalesUsd.toFixed(2)}`, `Bs. ${totalSalesBs.toFixed(2)}`, '']);
      exportToPDF(headers, body, filename, title);
    }
  };

  const exportComprasGastos = (format: 'excel' | 'pdf') => {
    const monthExpenses = expenses.filter(e => {
      const date = new Date(e.timestamp);
      return date.getMonth() === viewMonth && date.getFullYear() === viewYear;
    });

    const data = monthExpenses.map(e => ({
      FECHA: e.invoiceDate ? parseStoreDate(e.invoiceDate)?.day + '/' + (parseStoreDate(e.invoiceDate)?.month! + 1) + '/' + parseStoreDate(e.invoiceDate)?.year : new Date(e.timestamp).toLocaleDateString(),
      FACTURA: e.invoiceNumber || 'S/F',
      EMPRESA: e.vendorName || 'N/A',
      RIF: e.vendorRif || 'N/A',
      CATEGORIA: e.category || 'Otros',
      DESCRIPCION: e.description,
      MONTO_USD: `$${e.amountUsd.toFixed(2)}`,
      MONTO_BS: `Bs. ${(e.amountBs || (e.amountUsd * (e.bcvRate || 1))).toFixed(2)}`,
      TASA_BCV: (e.bcvRate || 1).toFixed(2)
    }));

    const filename = `Libro_Compras_Gastos_${months[viewMonth]}_${viewYear}`;
    const title = `LIBRO DE COMPRAS Y GASTOS - ${months[viewMonth]} ${viewYear}`;

    if (format === 'excel') {
      const excelData = [...data, { 
        FECHA: 'TOTAL', 
        FACTURA: '', 
        EMPRESA: '', 
        RIF: '', 
        CATEGORIA: '', 
        DESCRIPCION: '', 
        MONTO_USD: `$${totalOperatingExpensesUsd.toFixed(2)}`,
        MONTO_BS: `Bs. ${totalOperatingExpensesBs.toFixed(2)}`,
        TASA_BCV: ''
      }];
      exportToExcel(excelData, filename);
    } else {
      const headers = ['FECHA', 'FACTURA', 'EMPRESA', 'RIF', 'CATEGORIA', 'DESCRIPCION', 'MONTO USD', 'MONTO BS', 'TASA BCV'];
      const body = data.map(d => [d.FECHA, d.FACTURA, d.EMPRESA, d.RIF, d.CATEGORIA, d.DESCRIPCION, d.MONTO_USD, d.MONTO_BS, d.TASA_BCV]);
      body.push(['', '', '', '', '', 'TOTAL GENERAL', `$${totalOperatingExpensesUsd.toFixed(2)}`, `Bs. ${totalOperatingExpensesBs.toFixed(2)}`, '']);
      exportToPDF(headers, body, filename, title);
    }
  };

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700 italic">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 no-print">
        <div className="space-y-1">
          <h3 className="text-3xl font-black text-[#000814] uppercase leading-none italic tracking-tighter">Centro de Auditoría</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2"><Sparkles size={14} className="text-rose-500" /> INTELIGENCIA FINANCIERA CENTRAL</p>
        </div>
        <div className="flex flex-wrap gap-4 items-center bg-white border-4 border-slate-50 p-4 rounded-[2.5rem] shadow-sm">
           <Calendar size={18} className="text-rose-600" />
           <select value={viewMonth} onChange={(e) => setViewMonth(parseInt(e.target.value))} className="text-[10px] font-black uppercase italic outline-none cursor-pointer bg-transparent">{months.map((m, i) => <option key={m} value={i}>{m}</option>)}</select>
           <select value={viewYear} onChange={(e) => setViewYear(parseInt(e.target.value))} className="text-[10px] font-black uppercase italic outline-none cursor-pointer bg-transparent">{[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}</select>
        </div>
      </div>

      {/* MÉTRICAS FINANCIERAS PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 no-print">
        <MetricCard title="Ventas Cobradas" value={`$${totalSalesUsd.toLocaleString()}`} icon={<TrendingUp size={20} />} color="#10b981" subtitle={currentMonthGoal ? `META: $${currentMonthGoal.targetAmountUsd}` : "FLUJO DE CAJA BRUTO"} />
        <MetricCard title="Recargos Express" value={`$${totalExpressSurchargesUsd.toLocaleString()}`} icon={<Zap size={20} />} color="#3b82f6" subtitle="PROTOCOLO URGENTE" />
        <MetricCard title="Gastos Totales" value={`$${totalExpensesSum.toLocaleString()}`} icon={<TrendingDown size={20} />} color="#e11d48" subtitle="GASTOS+NOMINA+DEUDA" />
        <MetricCard title="Balance Neto" value={`$${balanceNetoUsd.toLocaleString()}`} icon={<Wallet size={20} />} color="#004ea1" subtitle="RENTABILIDAD DISPONIBLE" />
        <MetricCard title="Por Cobrar" value={`$${totalReceivablesUsd.toLocaleString()}`} icon={<CreditCard size={20} />} color="#f59e0b" subtitle="CAPITAL PENDIENTE" />
      </div>

      {currentMonthGoal && (
        <div className="bg-white border-4 border-slate-50 rounded-[3rem] p-8 shadow-sm no-print">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><Medal size={20}/></div>
              <h5 className="font-black uppercase text-xs text-slate-600 italic">Progreso de Meta Mensual: {months[viewMonth]}</h5>
            </div>
            <span className="text-xl font-black italic text-emerald-600">{salesGoalProgress}%</span>
          </div>
          <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden border-2 border-slate-50">
            <div 
              className="h-full bg-emerald-500 transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(16,185,129,0.4)]" 
              style={{ width: `${salesGoalProgress}%` }}
            />
          </div>
          <div className="flex justify-between mt-3">
            <p className="text-[9px] font-bold text-slate-400 uppercase italic">Recaudado: ${totalSalesUsd.toFixed(2)}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase italic">Objetivo: ${currentMonthGoal.targetAmountUsd.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* ANÁLISIS DE PUNTO DE EQUILIBRIO */}
      <div className="bg-slate-50 border-4 border-white rounded-[3rem] p-10 shadow-inner no-print space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#000814] text-white rounded-2xl flex items-center justify-center shadow-lg"><TrendingUp size={24} /></div>
          <div>
            <h4 className="text-xl font-black text-[#000814] uppercase italic tracking-tighter leading-none">Análisis de Supervivencia (Break-even)</h4>
            <p className="text-[9px] font-bold text-slate-400 uppercase italic mt-1">¿Cuánto falta para cubrir todos los gastos?</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 space-y-2">
            <p className="text-[9px] font-black text-slate-400 uppercase italic">Venta Necesaria</p>
            <p className="text-2xl font-black text-[#000814] italic tracking-tighter">${breakEvenAnalysis.breakEvenSales.toFixed(2)}</p>
            <p className="text-[8px] font-bold text-slate-400 uppercase italic">Para cubrir ${totalExpensesSum.toFixed(2)} de gastos</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 space-y-2">
            <p className="text-[9px] font-black text-slate-400 uppercase italic">Unidades "Estrella" (Franelas $12)</p>
            <p className="text-2xl font-black text-[#004ea1] italic tracking-tighter">{breakEvenAnalysis.unitsNeeded} PIEZAS</p>
            <p className="text-[8px] font-bold text-slate-400 uppercase italic">Volumen mínimo de ventas</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 space-y-2">
            <p className="text-[9px] font-black text-slate-400 uppercase italic">Estado de Cobertura</p>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${breakEvenAnalysis.isCovered ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500 animate-bounce'}`} />
              <p className={`text-xl font-black italic ${breakEvenAnalysis.isCovered ? 'text-emerald-600' : 'text-rose-600'}`}>
                {breakEvenAnalysis.isCovered ? 'GANA DINERO' : 'FALTA COBERTURA'}
              </p>
            </div>
            {!breakEvenAnalysis.isCovered && <p className="text-[8px] font-bold text-rose-400 uppercase italic">Faltan ${breakEvenAnalysis.gap.toFixed(2)} para equilibrio</p>}
          </div>
        </div>
      </div>

      <div className="bg-[#000814] rounded-[3.5rem] p-10 text-white relative overflow-hidden shadow-2xl no-print">
         <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><Zap size={150} /></div>
         <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-6">
               <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center shadow-lg border border-white/20"><Sparkles size={32} className="text-rose-400" /></div>
               <div><h4 className="text-2xl font-black italic tracking-tighter uppercase leading-none">IA Financial Audit</h4><p className="text-[10px] font-black text-rose-400 uppercase tracking-widest italic mt-1">Sugerencias automáticas de gestión</p></div>
               <button onClick={askAiForFinancialReport} disabled={isAskingAi} className="ml-auto bg-white text-[#000814] px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-xl">{isAskingAi ? <Loader2 size={16} className="animate-spin" /> : 'GENERAR INFORME DE SALUD'}</button>
            </div>
            {aiAdvice && <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 animate-in zoom-in-95"><p className="text-[13px] font-black italic uppercase leading-relaxed text-slate-300 whitespace-pre-line">"{aiAdvice}"</p></div>}
         </div>
      </div>

      <div className="bg-white border-4 border-slate-50 rounded-[4rem] p-10 shadow-sm space-y-10 no-print">
         <div className="flex gap-4 border-b border-slate-100 pb-8 overflow-x-auto no-scrollbar">
            <button onClick={() => setReportSubTab('dashboard')} className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase italic transition-all whitespace-nowrap ${reportSubTab === 'dashboard' ? 'bg-[#004ea1] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>Finanzas</button>
            <button onClick={() => setReportSubTab('intelligence')} className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase italic transition-all whitespace-nowrap ${reportSubTab === 'intelligence' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>Estrategia AI</button>
            <button onClick={() => setReportSubTab('receivables')} className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase italic transition-all whitespace-nowrap ${reportSubTab === 'receivables' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>Por Cobrar</button>
            <button onClick={() => setReportSubTab('operations')} className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase italic transition-all whitespace-nowrap ${reportSubTab === 'operations' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>Equipo</button>
            <button onClick={() => setReportSubTab('liabilities')} className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase italic transition-all whitespace-nowrap ${reportSubTab === 'liabilities' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>Deudas</button>
            <button onClick={() => setReportSubTab('education')} className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase italic transition-all whitespace-nowrap ${reportSubTab === 'education' ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>Educación Financiera</button>
            <button onClick={() => setReportSubTab('history')} className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase italic transition-all whitespace-nowrap ${reportSubTab === 'history' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>Documentos</button>
         </div>

         {reportSubTab === 'intelligence' && (
           <div className="space-y-10 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-indigo-50 p-6 rounded-[2rem] border-2 border-indigo-100 text-center">
                  <p className="text-[9px] font-black text-indigo-400 uppercase italic">Salud Flujo de Caja</p>
                  <p className={`text-4xl font-black italic ${strategicIntelligence.cashFlowScore > 70 ? 'text-emerald-600' : 'text-rose-600'}`}>{strategicIntelligence.cashFlowScore}/100</p>
                  <p className="text-[8px] font-bold text-indigo-300 uppercase italic mt-1">{strategicIntelligence.cashFlowScore > 70 ? 'FUERTE' : 'VULNERABLE'}</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase italic">Saturación Taller</p>
                  <p className="text-4xl font-black text-slate-800 italic">{strategicIntelligence.saturation}%</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase italic mt-1">{strategicIntelligence.saturation > 80 ? 'SUBIR PRECIOS' : 'ACTIVAR VENTAS'}</p>
                </div>
                <div className="bg-rose-50 p-6 rounded-[2rem] border-2 border-rose-100 text-center">
                  <p className="text-[9px] font-black text-rose-400 uppercase italic">Dependencia Dueño</p>
                  <p className="text-4xl font-black text-rose-600 italic">{strategicIntelligence.ownerDependency}%</p>
                  <p className="text-[8px] font-bold text-rose-300 uppercase italic mt-1">{strategicIntelligence.ownerDependency > 50 ? 'AUTOEMPLEO' : 'EMPRESA ESCALABLE'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white border-2 border-slate-100 p-8 rounded-[3rem] space-y-6">
                  <h5 className="font-black uppercase text-xs text-slate-500 flex items-center gap-2">Margen por Línea de Negocio</h5>
                  <div className="space-y-4">
                    {strategicIntelligence.marginByLine.map(line => (
                      <div key={line.line} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-black uppercase italic">
                          <span>{line.line}</span>
                          <span className={line.margin > 30 ? 'text-emerald-500' : 'text-rose-500'}>{line.margin}% MARGEN</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${line.margin > 30 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${line.margin}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border-2 border-slate-100 p-8 rounded-[3rem] space-y-6">
                  <h5 className="font-black uppercase text-xs text-slate-500 flex items-center gap-2">Rentabilidad por Cliente (Top 10)</h5>
                  <div className="space-y-3">
                    {strategicIntelligence.customerStats.map(c => (
                      <div key={c.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <div>
                          <p className="text-[10px] font-black uppercase italic">{c.name}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase italic">Utilidad: ${c.utility.toFixed(2)} • Retrabajos: {c.reworks}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase italic ${c.classification === 'A' ? 'bg-emerald-100 text-emerald-600' : c.classification === 'B' ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'}`}>
                            Cliente {c.classification}
                          </span>
                          <p className="text-[10px] font-black text-slate-800 mt-1">${c.revenue.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border-2 border-slate-100 p-8 rounded-[3rem] space-y-6">
                  <h5 className="font-black uppercase text-xs text-slate-500 flex items-center gap-2">Utilidad por Contrato (Top 10)</h5>
                  <div className="space-y-3">
                    {strategicIntelligence.contractProfitability.map(c => (
                      <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <div>
                          <p className="text-[10px] font-black uppercase italic">#{c.orderNumber} - {c.customerName}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase italic">Margen: {c.margin}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-emerald-600 italic tracking-tighter">+${c.utility.toFixed(2)}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase italic">Venta: ${c.revenue.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {settings.investments && settings.investments.length > 0 && (
                <div className="bg-indigo-900 text-white p-10 rounded-[4rem] space-y-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><Zap size={150} /></div>
                  <h5 className="font-black uppercase text-xs text-indigo-300 flex items-center gap-2">Proyección de ROI (Equipos)</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {settings.investments.map(inv => {
                      const monthsToPay = Math.ceil(inv.amountUsd / inv.expectedMonthlyRevenueUsd);
                      return (
                        <div key={inv.id} className="bg-white/10 border border-white/20 p-6 rounded-[2.5rem] space-y-2">
                          <p className="text-lg font-black uppercase italic">{inv.name}</p>
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-[8px] font-bold text-indigo-200 uppercase tracking-widest">Inversión: ${inv.amountUsd}</p>
                              <p className="text-[10px] font-black text-emerald-400 uppercase italic">Retorno en {monthsToPay} meses</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[8px] font-bold text-indigo-200 uppercase tracking-widest">Ingreso Proyectado</p>
                              <p className="text-xl font-black italic">${inv.expectedMonthlyRevenueUsd}/mes</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
           </div>
         )}

          {reportSubTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in">
              <div className="flex flex-wrap justify-end gap-3">
                <div className="flex bg-white border-2 border-slate-100 rounded-2xl p-1 shadow-sm">
                   <button onClick={() => exportVentasConsolidado('excel')} className="flex items-center gap-2 px-4 py-2 rounded-xl text-emerald-600 font-black text-[9px] uppercase italic hover:bg-emerald-50 transition-all">
                     <FileDown size={14} /> Libro Ventas (Excel)
                   </button>
                   <button onClick={() => exportVentasConsolidado('pdf')} className="flex items-center gap-2 px-4 py-2 rounded-xl text-rose-600 font-black text-[9px] uppercase italic hover:bg-rose-50 transition-all">
                     <Download size={14} /> Libro Ventas (PDF)
                   </button>
                </div>
                <div className="flex bg-white border-2 border-slate-100 rounded-2xl p-1 shadow-sm">
                   <button onClick={() => exportComprasGastos('excel')} className="flex items-center gap-2 px-4 py-2 rounded-xl text-emerald-600 font-black text-[9px] uppercase italic hover:bg-emerald-50 transition-all">
                     <FileDown size={14} /> Libro Compras (Excel)
                   </button>
                   <button onClick={() => exportComprasGastos('pdf')} className="flex items-center gap-2 px-4 py-2 rounded-xl text-rose-600 font-black text-[9px] uppercase italic hover:bg-rose-50 transition-all">
                     <Download size={14} /> Libro Compras (PDF)
                   </button>
                </div>
                <button onClick={exportFinanzasCSV} className="flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase italic hover:bg-slate-200 transition-all">
                  <Download size={14} /> Exportar CSV Finanzas
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-slate-100 space-y-6">
                    <div className="flex justify-between items-center">
                      <h5 className="font-black uppercase text-xs text-slate-500 flex items-center gap-2"><MinusCircle size={14}/> Desglose de Egresos</h5>
                      <button onClick={exportExpensesCSV} className="text-[9px] font-black text-[#004ea1] uppercase italic hover:underline">Exportar CSV Egresos</button>
                    </div>
                 <div className="space-y-4">
                    {Object.entries(expensesByCategory).map(([cat, amount]) => (
                      amount > 0 && <DesgloseItem key={cat} label={cat.toUpperCase()} value={amount} color="text-rose-500" />
                    ))}
                    <DesgloseItem label="PAGOS DE NÓMINA" value={totalPayrollUsd} color="text-rose-500" />
                    <DesgloseItem label="ABONOS A DEUDAS" value={totalDebtPaymentsUsd} color="text-rose-500" />
                    <div className="h-px bg-slate-200 w-full my-2"/>
                    <DesgloseItem label="TOTAL EGRESOS DEL MES" value={totalExpensesSum} color="text-rose-600" bold />
                 </div>
              </div>
              <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-slate-100 space-y-6">
                 <h5 className="font-black uppercase text-xs text-slate-500 flex items-center gap-2"><Store size={14}/> Rendimiento por Sede</h5>
                 <div className="space-y-4">
                    {settings.stores.map(s => {
                      const storeTotal = filteredByMonth.filter(o => o.storeId === s.id).reduce((a, b) => a + (b.abonoUsd || 0), 0);
                      return <DesgloseItem key={s.id} label={s.name} value={storeTotal} color="text-[#004ea1]" />
                    })}
                 </div>
              </div>
            </div>
          </div>
         )}

         {reportSubTab === 'receivables' && (
           <div className="space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center mb-6">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Cuentas por Cobrar (Pendientes)</h5>
                <div className="flex items-center gap-4"><button onClick={exportReceivablesCSV} className="flex items-center gap-2 bg-amber-50 text-amber-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase italic hover:bg-amber-100 transition-all"><Download size={14} /> Exportar CSV</button><span className="bg-amber-50 text-amber-600 px-4 py-1 rounded-full font-black text-[10px] italic">Total Pendiente: ${totalReceivablesUsd.toFixed(2)}</span></div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {orders.filter(o => o.restanteUsd > 0).map(order => (
                  <div key={order.id} className="bg-white border-2 border-slate-100 p-6 rounded-[2.5rem] flex items-center justify-between group hover:border-amber-400 transition-all shadow-sm">
                    <div className="flex items-center gap-5">
                       <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-amber-500 group-hover:text-white transition-all"><ArrowUpRight size={24}/></div>
                       <div>
                          <p className="font-black text-slate-800 uppercase text-sm">#{order.orderNumber} - {order.customerName}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase italic">Fecha: {order.issueDate} • Sede: {settings.stores.find(s => s.id === order.storeId)?.name}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[8px] font-black text-slate-300 uppercase">RESTANTE</p>
                       <span className="text-xl font-black text-amber-600 italic tracking-tighter">${order.restanteUsd.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {reportSubTab === 'operations' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in">
              <div className="lg:col-span-4 space-y-6">
                <div className="flex items-center gap-3 mb-4"><Medal size={20} className="text-amber-500"/><h5 className="font-black uppercase text-xs text-slate-600">Ranking de Eficiencia</h5></div>
                <div className="space-y-4">
                  {agentEfficiency.map((a, i) => (
                    <div key={a.id} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:border-[#004ea1] transition-all">
                       <div className="flex items-center gap-4">
                          <span className="text-xl font-black text-slate-200">0{i+1}</span>
                          <div><p className="font-black text-slate-800 uppercase text-xs">{a.name}</p><p className="text-[8px] font-bold text-slate-400 uppercase italic">{a.completed} Tareas completas</p></div>
                       </div>
                       <div className="text-right">
                          <p className={`text-xl font-black italic ${a.efficiency >= 85 ? 'text-emerald-500' : 'text-amber-500'}`}>{a.efficiency}%</p>
                          <div className="w-20 h-1 bg-slate-200 rounded-full mt-1 overflow-hidden"><div className={`h-full ${a.efficiency >= 85 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{width: `${a.efficiency}%`}}/></div>
                       </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-4 space-y-6">
                <div className="flex items-center gap-3 mb-4"><Warehouse size={20} className="text-blue-500"/><h5 className="font-black uppercase text-xs text-slate-600">Eficiencia de Talleres</h5></div>
                <div className="space-y-4">
                  {workshopEfficiency.map((w, i) => (
                    <div key={w.id} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:border-blue-600 transition-all">
                       <div className="flex items-center gap-4">
                          <span className="text-xl font-black text-slate-200">0{i+1}</span>
                          <div><p className="font-black text-slate-800 uppercase text-xs">{w.name}</p><p className="text-[8px] font-bold text-slate-400 uppercase italic">{w.total} Órdenes totales</p></div>
                       </div>
                       <div className="text-right">
                          <p className={`text-xl font-black italic ${w.efficiency >= 85 ? 'text-emerald-500' : 'text-amber-500'}`}>{w.efficiency}%</p>
                          <div className="w-20 h-1 bg-slate-200 rounded-full mt-1 overflow-hidden"><div className={`h-full ${w.efficiency >= 85 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{width: `${w.efficiency}%`}}/></div>
                       </div>
                    </div>
                  ))}
                  {workshopEfficiency.length === 0 && <p className="text-center text-[10px] font-black text-slate-300 uppercase italic py-10">No hay datos de talleres</p>}
                </div>
              </div>

              <div className="lg:col-span-4 space-y-6">
                <div className="flex items-center gap-3 mb-4"><History size={20} className="text-[#004ea1]"/><h5 className="font-black uppercase text-xs text-slate-600">Feed Operativo Maestro</h5></div>
                <div className="bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200 p-8 space-y-6 max-h-[600px] overflow-y-auto no-scrollbar">
                   {masterOperativeHistory.map((h, idx) => (
                     <div key={idx} className="flex gap-6 items-start group">
                        <div className="w-10 h-10 bg-white border-2 border-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-[#000814] group-hover:text-white transition-all shadow-sm"><CheckCircle2 size={18}/></div>
                        <div className="flex-1 space-y-1">
                           <div className="flex justify-between items-center"><p className="text-[11px] font-black text-slate-800 uppercase italic">Orden #{h.orderNum}</p><span className="text-[8px] font-bold text-slate-400 uppercase">{new Date(h.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
                           <p className="text-[10px] font-bold text-[#004ea1] uppercase">{h.agentName}: <span className="text-slate-500 font-medium">{h.action}</span></p>
                           <div className="h-px bg-slate-100 w-full mt-2"/>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
           </div>
         )}

          {reportSubTab === 'education' && (
            <div className="space-y-10 animate-in fade-in italic">
              <div className="bg-violet-900 text-white p-10 rounded-[4rem] relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><BookOpen size={150} /></div>
                <div className="relative z-10 space-y-4">
                  <h4 className="text-3xl font-black italic tracking-tighter uppercase">Academia de Liderazgo Financiero</h4>
                  <p className="text-violet-200 text-sm max-w-2xl">Domina estos 5 pilares para llevar a ROXTOR al siguiente nivel. El conocimiento es el activo más rentable.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <EducationCard 
                  icon={<PieChart className="text-blue-500" />}
                  title="1. Estado de Resultados (P&L)"
                  description="Es el resumen de tus ingresos y gastos. Te dice si ganaste o perdiste dinero en un periodo. No confundas 'vender' con 'ganar'."
                  formula="Ventas - Costos - Gastos = Utilidad Neta"
                />
                <EducationCard 
                  icon={<Activity className="text-emerald-500" />}
                  title="2. Flujo de Caja (Cash Flow)"
                  description="Es el movimiento real de dinero. Puedes tener utilidades pero no tener efectivo si tus clientes no te han pagado. El efectivo es el oxígeno."
                  formula="Entradas de Efectivo - Salidas de Efectivo"
                />
                <EducationCard 
                  icon={<BarChart3 className="text-amber-500" />}
                  title="3. Margen Bruto"
                  description="Lo que te queda después de pagar el costo directo del producto. Si es bajo, estás trabajando mucho para ganar poco."
                  formula="((Precio - Costo) / Precio) * 100"
                />
                <EducationCard 
                  icon={<Zap className="text-rose-500" />}
                  title="4. Punto de Equilibrio"
                  description="El nivel de ventas donde no ganas ni pierdes. Todo lo que vendas por encima de esto es utilidad pura."
                  formula="Gastos Fijos / Margen de Contribución"
                />
                <EducationCard 
                  icon={<Wallet className="text-indigo-500" />}
                  title="5. Capital de Trabajo"
                  description="El dinero que necesitas para operar día a día (comprar tela, pagar nómina) antes de cobrar tus ventas."
                  formula="Activos Corrientes - Pasivos Corrientes"
                />
              </div>

              <div className="bg-white border-4 border-violet-50 rounded-[3rem] p-10 shadow-sm space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-violet-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Sparkles size={24} /></div>
                  <div>
                    <h4 className="text-xl font-black text-[#000814] uppercase italic tracking-tighter leading-none">Consultar al Coach Financiero AI</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase italic mt-1">Pregunta sobre estrategias, conceptos o dudas de tu negocio</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <input 
                    type="text" 
                    placeholder="Ej: ¿Cómo puedo mejorar mi capital de trabajo?"
                    className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-xs font-black uppercase italic outline-none focus:border-violet-200 transition-all"
                    value={coachQuestion}
                    onChange={(e) => setCoachQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && askAiCoach()}
                  />
                  <button 
                    onClick={askAiCoach}
                    disabled={isAskingCoach}
                    className="bg-violet-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-violet-700 transition-all shadow-xl disabled:opacity-50"
                  >
                    {isAskingCoach ? <Loader2 size={16} className="animate-spin" /> : 'CONSULTAR'}
                  </button>
                </div>

                {coachAnswer && (
                  <div className="bg-violet-50 border border-violet-100 rounded-[2rem] p-8 animate-in slide-in-from-bottom-4">
                    <p className="text-[13px] font-black italic uppercase leading-relaxed text-violet-900 whitespace-pre-line">"{coachAnswer}"</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {reportSubTab === 'liabilities' && (
            <div className="space-y-8 animate-in fade-in italic">
               <div className="flex justify-between items-center mb-6">
                 <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Gestión de Pasivos y Compromisos</h5>
                 <div className="bg-rose-50 text-rose-600 px-4 py-2 rounded-full font-black text-[10px] italic">
                   Deuda Pendiente Total: ${debts.filter(d => d.status === 'pendiente').reduce((acc, d) => acc + (d.totalAmountUsd - d.payments.reduce((pa, pb) => pa + pb.amountUsd, 0)), 0).toFixed(2)}
                 </div>
               </div>

               <div className="grid grid-cols-1 gap-6">
                 {debts.filter(d => d.status === 'pendiente').map(d => {
                   const paid = d.payments.reduce((a, b) => a + b.amountUsd, 0);
                   const balance = d.totalAmountUsd - paid;
                   const progress = Math.min(Math.round((paid / d.totalAmountUsd) * 100), 100);
                   
                   return (
                     <div key={d.id} className="bg-white border-4 border-slate-50 p-8 rounded-[3rem] shadow-sm hover:shadow-md transition-all space-y-6 group">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-rose-500 group-hover:text-white transition-all">
                              <CreditCard size={24} />
                            </div>
                            <div>
                              <p className="font-black text-slate-800 uppercase text-sm tracking-tighter">{d.creditorName}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase italic">{d.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                             <p className="text-2xl font-black text-rose-600 italic tracking-tighter">${balance.toFixed(2)}</p>
                             <p className="text-[8px] font-bold text-slate-400 uppercase italic">Restante de ${d.totalAmountUsd.toFixed(2)}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-[9px] font-black uppercase italic text-slate-400">
                            <span>Progreso de Pago</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                            <div 
                              className="h-full bg-rose-500 transition-all duration-1000" 
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-50">
                          <p className="text-[9px] font-black text-slate-400 uppercase italic mb-3">Últimos Abonos</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {d.payments.slice(-3).reverse().map(p => (
                              <div key={p.id} className="bg-slate-50 p-3 rounded-xl flex justify-between items-center">
                                <span className="text-[8px] font-bold text-slate-400 uppercase italic">{p.date}</span>
                                <span className="text-[10px] font-black text-emerald-600 italic tracking-tighter">${p.amountUsd.toFixed(2)}</span>
                              </div>
                            ))}
                            {d.payments.length === 0 && <p className="text-[9px] text-slate-300 italic">Sin abonos registrados</p>}
                          </div>
                        </div>
                     </div>
                   );
                 })}
                 {debts.filter(d => d.status === 'pendiente').length === 0 && (
                   <div className="py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                     <CheckCircle2 size={48} className="mx-auto text-emerald-400 mb-4" />
                     <p className="text-xs font-black text-slate-400 uppercase italic">Sin deudas pendientes</p>
                   </div>
                 )}
               </div>
            </div>
         )}

          {reportSubTab === 'history' && (
            <div className="space-y-8 animate-in fade-in">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Historial de Documentos Generados</h5>
                  <p className="text-[8px] font-bold text-slate-300 uppercase italic">Registro de Órdenes de Servicio y Notas de Entrega guardadas en la nube</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button 
                      onClick={() => setHistoryStatusFilter('all')}
                      className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase italic transition-all ${historyStatusFilter === 'all' ? 'bg-white text-[#000814] shadow-sm' : 'text-slate-400'}`}
                    >
                      Todos
                    </button>
                    <button 
                      onClick={() => setHistoryStatusFilter('active')}
                      className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase italic transition-all ${historyStatusFilter === 'active' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                    >
                      Activas
                    </button>
                    <button 
                      onClick={() => setHistoryStatusFilter('completed')}
                      className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase italic transition-all ${historyStatusFilter === 'completed' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
                    >
                      Completadas
                    </button>
                  </div>
                  <input 
                    type="text"
                    placeholder="Buscar por # o cliente..."
                    className="bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2 text-[10px] font-black uppercase italic outline-none focus:border-[#004ea1] transition-all w-48"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-white border-4 border-slate-50 rounded-[3rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase italic">Documento</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase italic">Fecha</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase italic">Cliente</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase italic">Estado</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase italic">Monto</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase italic text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {orders
                        .filter(o => {
                          const date = parseStoreDate(o.issueDate);
                          const matchesMonth = date && date.month === viewMonth && date.year === viewYear;
                          const matchesStatus = historyStatusFilter === 'all' 
                            ? true 
                            : historyStatusFilter === 'completed' 
                              ? o.status === 'completado' 
                              : o.status !== 'completado';
                          const matchesSearch = o.orderNumber.toLowerCase().includes(historySearch.toLowerCase()) || 
                                              o.customerName.toLowerCase().includes(historySearch.toLowerCase());
                          return matchesMonth && matchesStatus && matchesSearch;
                        })
                        .sort((a, b) => parseOrderDateToTimestamp(b.issueDate) - parseOrderDateToTimestamp(a.issueDate))
                        .map(order => (
                          <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${order.isLogistics ? 'bg-rose-500' : (order.isDirectSale ? 'bg-blue-500' : 'bg-[#000814]')}`}>
                                  {order.isLogistics ? <Warehouse size={14}/> : <FileDown size={14}/>}
                                </div>
                                <span className="text-[10px] font-black text-slate-800">#{order.orderNumber}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase italic">{order.issueDate}</td>
                            <td className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase italic truncate max-w-[150px]">{order.customerName}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase italic ${order.status === 'completado' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-[10px] font-black text-[#004ea1] italic">${order.totalUsd.toFixed(2)}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => setSelectedOrderForPrint(order)}
                                  className="p-2 text-slate-400 hover:text-[#004ea1] transition-colors"
                                  title="Ver Recibo"
                                >
                                  <History size={16} />
                                </button>
                                {order.receiptUrl && (
                                  <a 
                                    href={order.receiptUrl} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                                    title="Ver PDF en Nube"
                                  >
                                    <ArrowUpRight size={16} />
                                  </a>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {orders.filter(o => {
                    const date = parseStoreDate(o.issueDate);
                    return date && date.month === viewMonth && date.year === viewYear;
                  }).length === 0 && (
                    <div className="py-20 text-center space-y-4">
                      <History size={48} className="mx-auto text-slate-200" />
                      <p className="text-[10px] font-black text-slate-400 uppercase italic">No hay órdenes registradas en {months[viewMonth]} {viewYear}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
      </div>

      <div className="flex justify-center gap-4 no-print">
         <button onClick={() => window.print()} className="bg-[#000814] text-white px-10 py-5 rounded-3xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 hover:bg-slate-800 transition-all border-b-8 border-slate-900 active:translate-y-1"><FileDown size={20}/> DESCARGAR AUDITORÍA PDF</button>
      </div>

      {selectedOrderForPrint && (
        <OrderReceipt 
          order={selectedOrderForPrint} 
          settings={settings} 
          workshops={workshops}
          onClose={() => setSelectedOrderForPrint(null)} 
          onUpdateOrder={handleUpdateOrder}
        />
      )}
    </div>
  );
};

const MetricCard = ({ title, value, icon, color, subtitle }: any) => (
  <div className="bg-white border-4 border-slate-50 p-8 rounded-[3rem] shadow-sm hover:shadow-2xl transition-all relative overflow-hidden group border-l-[12px] italic" style={{ borderLeftColor: color }}>
    <div className="flex justify-between items-start mb-4"><div className="p-3 rounded-2xl text-white shadow-xl rotate-3 group-hover:rotate-0 transition-transform" style={{ backgroundColor: color }}>{icon}</div><div className="text-right"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic mb-1">{title}</p><span className="text-2xl font-black italic tracking-tighter" style={{ color: color }}>{value}</span></div></div>
    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic opacity-60">{subtitle}</p>
  </div>
);

const EducationCard = ({ icon, title, description, formula }: any) => (
  <div className="bg-white border-2 border-slate-100 p-8 rounded-[3rem] space-y-4 hover:border-violet-400 transition-all group shadow-sm">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">{icon}</div>
      <h5 className="font-black uppercase text-sm text-slate-800 italic">{title}</h5>
    </div>
    <p className="text-xs text-slate-500 leading-relaxed font-medium">{description}</p>
    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
      <p className="text-[9px] font-black text-slate-400 uppercase italic mb-1">Fórmula Clave:</p>
      <p className="text-[11px] font-black text-violet-600 uppercase italic">{formula}</p>
    </div>
  </div>
);

const DesgloseItem = ({ label, value, color, bold }: any) => (
  <div className="flex justify-between items-center">
    <p className={`text-[10px] font-black uppercase italic ${bold ? 'text-slate-800' : 'text-slate-400'}`}>{label}:</p>
    <span className={`font-black italic ${color} ${bold ? 'text-xl' : 'text-sm'}`}>${value.toFixed(2)}</span>
  </div>
);

export default Reports;

