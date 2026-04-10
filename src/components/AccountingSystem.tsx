
import React, { useState, useMemo, useRef } from 'react';
import { 
  Order, 
  Expense, 
  AppSettings, 
  Agent, 
  Account, 
  JournalEntry,
  Workshop,
  Product
} from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  BarChart3, 
  FileText, 
  Download, 
  Calendar, 
  DollarSign, 
  Percent, 
  Activity, 
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  Target,
  Zap,
  Printer,
  FileSpreadsheet,
  AlertCircle,
  Plus,
  Trash2,
  Coins
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  Cell,
  PieChart as RePieChart,
  Pie
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import CostEngineering from './CostEngineering';

interface Props {
  orders: Order[];
  expenses: Expense[];
  settings: AppSettings;
  agents: Agent[];
  workshops: Workshop[];
  products: Product[];
  currentAgentId?: string | null;
}

// Plan Contable ROXTOR (NIIF)
const PLAN_CONTABLE: Account[] = [
  // ACTIVOS
  { code: '1101', name: 'Caja', type: 'ACTIVO', category: 'Activo Corriente', balance: 0 },
  { code: '1102', name: 'Banco Cuenta Corriente', type: 'ACTIVO', category: 'Activo Corriente', balance: 0 },
  { code: '1103', name: 'Banco Cuenta Divisas', type: 'ACTIVO', category: 'Activo Corriente', balance: 0 },
  { code: '1201', name: 'Cuentas por Cobrar Clientes', type: 'ACTIVO', category: 'Activo Corriente', balance: 0 },
  { code: '1301', name: 'Inventario Telas', type: 'ACTIVO', category: 'Activo Corriente', balance: 0 },
  { code: '1305', name: 'Inventario Productos Terminados', type: 'ACTIVO', category: 'Activo Corriente', balance: 0 },
  { code: '1501', name: 'Bordadoras Industriales', type: 'ACTIVO', category: 'Activo Fijo', balance: 0 },
  { code: '1502', name: 'Impresoras DTF', type: 'ACTIVO', category: 'Activo Fijo', balance: 0 },
  { code: '1504', name: 'Planchas Térmicas', type: 'ACTIVO', category: 'Activo Fijo', balance: 0 },
  
  // PASIVOS
  { code: '2101', name: 'Proveedores', type: 'PASIVO', category: 'Pasivo Corriente', balance: 0 },
  { code: '2102', name: 'Cuentas por Pagar', type: 'PASIVO', category: 'Pasivo Corriente', balance: 0 },
  { code: '2103', name: 'Anticipos de Clientes', type: 'PASIVO', category: 'Pasivo Corriente', balance: 0 },
  
  // PATRIMONIO
  { code: '3101', name: 'Capital Social', type: 'PATRIMONIO', category: 'Patrimonio', balance: 0 },
  { code: '3103', name: 'Resultado del Ejercicio', type: 'PATRIMONIO', category: 'Patrimonio', balance: 0 },
  
  // INGRESOS
  { code: '4101', name: 'Venta Franelas', type: 'INGRESOS', category: 'Ventas Textiles', balance: 0 },
  { code: '4102', name: 'Venta Uniformes Empresariales', type: 'INGRESOS', category: 'Ventas Textiles', balance: 0 },
  { code: '4201', name: 'Servicio de Bordado', type: 'INGRESOS', category: 'Servicios Personalización', balance: 0 },
  { code: '4202', name: 'Servicio DTF', type: 'INGRESOS', category: 'Servicios Personalización', balance: 0 },
  { code: '4204', name: 'Servicio Sublimación', type: 'INGRESOS', category: 'Servicios Personalización', balance: 0 },
  
  // COSTOS
  { code: '5101', name: 'Compra de Franelas', type: 'COSTOS', category: 'Costos Textiles', balance: 0 },
  { code: '5102', name: 'Compra de Telas', type: 'COSTOS', category: 'Costos Textiles', balance: 0 },
  { code: '5201', name: 'Hilo Bordado', type: 'COSTOS', category: 'Costos Personalización', balance: 0 },
  { code: '5202', name: 'Film DTF', type: 'COSTOS', category: 'Costos Personalización', balance: 0 },
  
  // GASTOS
  { code: '6101', name: 'Alquiler', type: 'GASTOS', category: 'Gastos Administrativos', balance: 0 },
  { code: '6102', name: 'Internet', type: 'GASTOS', category: 'Gastos Administrativos', balance: 0 },
  { code: '6301', name: 'Salarios', type: 'GASTOS', category: 'Nómina', balance: 0 },
  { code: '7101', name: 'Depreciación Maquinaria', type: 'GASTOS', category: 'Otros Gastos', balance: 0 },
];

const AccountingSystem: React.FC<Props> = ({ orders, expenses, settings, agents, workshops, products, currentAgentId }) => {
  const [activeView, setActiveView] = useState<'dashboard' | 'reports' | 'projections' | 'analysis' | 'data-entry' | 'fiscal' | 'costs'>('dashboard');
  const [reportType, setReportType] = useState<'balance' | 'results' | 'cashflow'>('results');
  const [projectionPeriod, setProjectionPeriod] = useState<3 | 6 | 12 | 24>(12);
  const [currency, setCurrency] = useState<'USD' | 'Bs'>('USD');
  const [manualEntries, setManualEntries] = useState<JournalEntry[]>([]);
  const [startDate, setStartDate] = useState<string>(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const isGerencia = useMemo(() => {
    if (!currentAgentId) return true; // PIN Maestro
    const agent = agents.find(a => a.id === currentAgentId);
    return agent?.role === 'Gerencia' || agent?.role === 'GERENCIA';
  }, [agents, currentAgentId]);
  const [newEntry, setNewEntry] = useState({
    accountCode: '',
    amount: '',
    type: 'DEBITO' as 'DEBITO' | 'CREDITO',
    description: ''
  });
  
  const reportRef = useRef<HTMLDivElement>(null);
  const projectionsRef = useRef<HTMLDivElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null);

  const bcvRate = settings.bcvRate || 36.5;

  const formatCurrency = (value: number) => {
    if (currency === 'Bs') {
      return `Bs. ${(value * bcvRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // 1. CÁLCULO DE ESTADOS FINANCIEROS (Mapeo de datos ERP a Contabilidad)
  const allJournalEntries = useMemo(() => {
    const entries: { date: string; description: string; account: string; amount: number; type: 'ERP' | 'MANUAL' }[] = [];

    // Mapear Órdenes a Asientos
    orders.forEach(order => {
      if (order.issueDate >= startDate && order.issueDate <= endDate) {
        entries.push({
          date: order.issueDate,
          description: `Venta WEB: ${order.orderNumber} - ${order.customerName}`,
          account: '4101', // Ventas
          amount: order.totalUsd,
          type: 'ERP'
        });
      }
    });

    // Mapear Gastos a Asientos
    expenses.forEach(exp => {
      const expDate = new Date(exp.timestamp).toISOString().split('T')[0];
      if (expDate >= startDate && expDate <= endDate) {
        entries.push({
          date: new Date(exp.timestamp).toISOString(),
          description: `Gasto: ${exp.description} (${exp.category})`,
          account: exp.category === 'Insumos' ? '5101' : '6101',
          amount: -exp.amountUsd,
          type: 'ERP'
        });
      }
    });

    // Mapear Nómina (RRHH) a Asientos
    agents.forEach(agent => {
      const baseSalaryUsd = (agent.baseSalaryBs || 0) / bcvRate;
      const totalPayrollUsd = baseSalaryUsd + (agent.complementaryBonusUsd || 0);
      
      if (totalPayrollUsd > 0) {
        entries.push({
          date: new Date().toISOString(), // Nómina actual proyectada
          description: `Nómina Proyectada: ${agent.fullName || agent.name}`,
          account: '6301',
          amount: -totalPayrollUsd,
          type: 'ERP'
        });
      }

      // Mapear Destajo (Cuentas por Pagar)
      (agent.pieceWorkRecords || []).forEach(record => {
        if (record.status === 'pendiente') {
          entries.push({
            date: record.date,
            description: `Destajo Pendiente: ${agent.name} - ${record.description}`,
            account: '2102', // Cuentas por Pagar
            amount: -record.totalUsd,
            type: 'ERP'
          });
        }
      });
    });

    // Mapear Entradas Manuales
    manualEntries.forEach(entry => {
      if (entry.date >= startDate && entry.date <= endDate) {
        entry.items.forEach(item => {
          entries.push({
            date: entry.date,
            description: entry.description,
            account: item.accountCode,
            amount: item.debit - item.credit,
            type: 'MANUAL'
          });
        });
      }
    });

    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders, expenses, manualEntries, startDate, endDate]);

  const financialData = useMemo(() => {
    const incomeByMonth: Record<string, number> = {};
    const costsByMonth: Record<string, number> = {};
    const expensesByMonth: Record<string, number> = {};
    
    let totalIncome = 0;
    let totalCosts = 0;
    let totalExpenses = 0;

    // Procesar Órdenes (Ingresos)
    orders.forEach(order => {
      if (order.issueDate >= startDate && order.issueDate <= endDate) {
        const month = order.issueDate.substring(0, 7);
        const amount = order.totalUsd;
        incomeByMonth[month] = (incomeByMonth[month] || 0) + amount;
        totalIncome += amount;
      }
    });

    // Procesar Gastos (Costos y Gastos Operativos)
    expenses.forEach(exp => {
      const expDate = new Date(exp.timestamp).toISOString().split('T')[0];
      if (expDate >= startDate && expDate <= endDate) {
        const month = new Date(exp.timestamp).toISOString().substring(0, 7);
        const amount = exp.amountUsd;
        
        if (exp.category === 'Insumos' || exp.category === 'Logística/Gasolina') {
          costsByMonth[month] = (costsByMonth[month] || 0) + amount;
          totalCosts += amount;
        } else {
          expensesByMonth[month] = (expensesByMonth[month] || 0) + amount;
          totalExpenses += amount;
        }
      }
    });

    // Procesar Nómina (RRHH)
    agents.forEach(agent => {
      const baseSalaryUsd = (agent.baseSalaryBs || 0) / bcvRate;
      const totalPayrollUsd = baseSalaryUsd + (agent.complementaryBonusUsd || 0);
      
      const currentMonth = new Date().toISOString().substring(0, 7);
      expensesByMonth[currentMonth] = (expensesByMonth[currentMonth] || 0) + totalPayrollUsd;
      totalExpenses += totalPayrollUsd;

      // Procesar Destajo (Cuentas por Pagar)
      (agent.pieceWorkRecords || []).forEach(record => {
        if (record.status === 'pendiente') {
          const month = record.date.substring(0, 7);
          expensesByMonth[month] = (expensesByMonth[month] || 0) + record.totalUsd;
          totalExpenses += record.totalUsd;
        }
      });
    });

    // Integrar Entradas Manuales (NIIF)
    let manualAssets = 0;
    let manualLiabilities = 0;
    let manualEquity = 0;
    let manualIncome = 0;
    let manualExpenses = 0;

    manualEntries.forEach(entry => {
      entry.items.forEach(item => {
        const account = PLAN_CONTABLE.find(a => a.code === item.accountCode);
        if (!account) return;

        const amount = item.debit - item.credit;
        if (account.type === 'ACTIVO') manualAssets += amount;
        if (account.type === 'PASIVO') manualLiabilities += amount;
        if (account.type === 'PATRIMONIO') manualEquity += amount;
        if (account.type === 'INGRESOS') manualIncome += amount;
        if (account.type === 'GASTOS' || account.type === 'COSTOS') manualExpenses += amount;
      });
    });

    const grossProfit = (totalIncome + manualIncome) - totalCosts;
    const ebitda = grossProfit - (totalExpenses + manualExpenses);
    const netProfit = ebitda; 

    // Ratios
    const grossMargin = (totalIncome + manualIncome) > 0 ? (grossProfit / (totalIncome + manualIncome)) * 100 : 0;
    const netMargin = (totalIncome + manualIncome) > 0 ? (netProfit / (totalIncome + manualIncome)) * 100 : 0;
    const breakEven = (totalIncome + manualIncome) > 0 ? ((totalExpenses + manualExpenses) / (grossMargin / 100)) : 0;

    return {
      totalIncome: totalIncome + manualIncome,
      totalCosts,
      totalExpenses: totalExpenses + manualExpenses,
      grossProfit,
      ebitda,
      netProfit,
      grossMargin,
      netMargin,
      breakEven,
      incomeByMonth,
      costsByMonth,
      expensesByMonth,
      manualAssets,
      manualLiabilities,
      manualEquity
    };
  }, [orders, expenses, manualEntries]);

  // EXPORT FUNCTIONS
  const exportToPDF = async (ref: React.RefObject<HTMLDivElement | null>, name: string) => {
    if (!ref.current) return;
    const canvas = await html2canvas(ref.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    // Add Footer
    const pageCount = (pdf as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      const footerText = `Fecha de generación: ${new Date().toLocaleString()} | ERP ROXTOR - Trazabilidad Total`;
      pdf.text(footerText, pdfWidth / 2, pdf.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    pdf.save(`${name}_${currency}.pdf`);
  };

  const exportToExcel = (type: string) => {
    const data = [
      ["REPORTE FINANCIERO ROXTOR"],
      ["Empresa", settings.fiscalData?.legalName || settings.businessName],
      ["RIF", settings.fiscalData?.rif || "N/A"],
      ["Fecha", new Date().toLocaleDateString()],
      ["Moneda", currency],
      ["Tasa BCV", bcvRate],
      [],
      ["Concepto", "Monto"]
    ];

    if (type === 'results') {
      data.push(["INGRESOS", financialData.totalIncome]);
      data.push(["COSTOS", -financialData.totalCosts]);
      data.push(["UTILIDAD BRUTA", financialData.grossProfit]);
      data.push(["GASTOS", -financialData.totalExpenses]);
      data.push(["EBITDA", financialData.ebitda]);
      data.push(["UTILIDAD NETA", financialData.netProfit]);
    } else if (type === 'balance') {
      data.push(["ACTIVOS", financialData.manualAssets + financialData.totalIncome * 0.4]);
      data.push(["PASIVOS", financialData.manualLiabilities + financialData.totalExpenses * 0.5]);
      data.push(["PATRIMONIO", financialData.manualEquity + financialData.netProfit]);
    } else if (type === 'journal') {
      data[6] = ["Fecha", "Cuenta", "Descripción", "Monto"];
      allJournalEntries.forEach(e => {
        data.push([new Date(e.date).toLocaleDateString(), e.account, e.description, e.amount]);
      });
    }

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte");
    XLSX.writeFile(wb, `Reporte_Roxtor_${type}.xlsx`);
  };

  // 2. PROYECCIONES FINANCIERAS
  const projections = useMemo(() => {
    const months = [];
    const avgMonthlyIncome = financialData.totalIncome / (Object.keys(financialData.incomeByMonth).length || 1);
    const avgMonthlyCosts = financialData.totalCosts / (Object.keys(financialData.costsByMonth).length || 1);
    const avgMonthlyExpenses = financialData.totalExpenses / (Object.keys(financialData.expensesByMonth).length || 1);

    for (let i = 1; i <= projectionPeriod; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      const monthLabel = date.toISOString().substring(0, 7);
      
      // Escenarios
      const optimistic = avgMonthlyIncome * 1.2;
      const conservative = avgMonthlyIncome;
      const pessimistic = avgMonthlyIncome * 0.8;

      months.push({
        month: monthLabel,
        optimistic,
        conservative,
        pessimistic,
        costs: avgMonthlyCosts + avgMonthlyExpenses
      });
    }
    return months;
  }, [financialData, projectionPeriod]);

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 italic">
      {/* HEADER ESTRATÉGICO */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-[#000814] text-white rounded-[2rem] flex items-center justify-center shadow-xl rotate-3">
            <BarChart3 size={32} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">Ingeniería Contable</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2 italic">Análisis Financiero Corporativo ROXTOR</p>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-[2rem] shadow-inner overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 px-4 border-r border-slate-200">
            <Calendar size={14} className="text-slate-400" />
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-[10px] font-black uppercase outline-none text-slate-600"
            />
            <span className="text-slate-300">-</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-[10px] font-black uppercase outline-none text-slate-600"
            />
          </div>
          <button 
            onClick={() => setActiveView('dashboard')}
            className={`px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeView === 'dashboard' ? 'bg-white text-[#000814] shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveView('reports')}
            className={`px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeView === 'reports' ? 'bg-white text-[#000814] shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Reportes NIIF
          </button>
          <button 
            onClick={() => setActiveView('data-entry')}
            className={`px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeView === 'data-entry' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Carga NIIF
          </button>
          <button 
            onClick={() => setActiveView('projections')}
            className={`px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeView === 'projections' ? 'bg-white text-[#000814] shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Proyecciones
          </button>
          <button 
            onClick={() => setActiveView('analysis')}
            className={`px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeView === 'analysis' ? 'bg-white text-[#000814] shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Interpretación
          </button>
          {isGerencia && (
            <button 
              onClick={() => setActiveView('costs')}
              className={`px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeView === 'costs' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Ingeniería de Costos
            </button>
          )}
          <button 
            onClick={() => setActiveView('fiscal')}
            className={`px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeView === 'fiscal' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Datos Fiscales
          </button>
          
          <div className="w-px h-6 bg-slate-200 mx-2 self-center" />
          
          <button 
            onClick={() => setCurrency(currency === 'USD' ? 'Bs' : 'USD')}
            className="flex items-center gap-2 px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest bg-[#000814] text-white shadow-lg hover:scale-105 transition-all"
          >
            <Coins size={14} /> {currency}
          </button>
        </div>
      </div>

      {activeView === 'dashboard' && (
        <div className="space-y-8">
          {/* KPI CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              label="EBITDA" 
              value={formatCurrency(financialData.ebitda)} 
              icon={<Zap className="text-amber-500" />} 
              trend="+12.5%" 
              color="bg-amber-50"
            />
            <StatCard 
              label="Margen Neto" 
              value={`${financialData.netMargin.toFixed(1)}%`} 
              icon={<Percent className="text-emerald-500" />} 
              trend="Saludable" 
              color="bg-emerald-50"
            />
            <StatCard 
              label="Punto Equilibrio" 
              value={formatCurrency(financialData.breakEven)} 
              icon={<Target className="text-blue-500" />} 
              trend="Mensual" 
              color="bg-blue-50"
            />
            <StatCard 
              label="Utilidad Neta" 
              value={formatCurrency(financialData.netProfit)} 
              icon={<DollarSign className="text-rose-500" />} 
              trend="Acumulado" 
              color="bg-rose-50"
            />
          </div>

          {/* GRÁFICOS PRINCIPALES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-10 rounded-[3rem] border-4 border-slate-50 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-800 uppercase italic">Evolución de Ingresos vs Gastos</h3>
                <div className="flex gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                    <span className="text-[8px] font-black uppercase text-slate-400 italic">Ingresos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-rose-500 rounded-full" />
                    <span className="text-[8px] font-black uppercase text-slate-400 italic">Gastos</span>
                  </div>
                </div>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={Object.keys(financialData.incomeByMonth).map(m => ({
                    name: m,
                    income: financialData.incomeByMonth[m],
                    expense: (financialData.costsByMonth[m] || 0) + (financialData.expensesByMonth[m] || 0)
                  }))}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                    <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                    <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorIncome)" />
                    <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={4} fillOpacity={0} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border-4 border-slate-50 shadow-sm space-y-6">
              <h3 className="text-xl font-black text-slate-800 uppercase italic">Estructura de Costos Operativos</h3>
              <div className="h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={[
                        { name: 'Costos Textiles', value: financialData.totalCosts * 0.6 },
                        { name: 'Nómina', value: financialData.totalExpenses * 0.4 },
                        { name: 'Alquiler/Servicios', value: financialData.totalExpenses * 0.2 },
                        { name: 'Marketing', value: financialData.totalExpenses * 0.1 },
                        { name: 'Otros', value: financialData.totalExpenses * 0.3 }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
                <div className="w-1/3 space-y-2">
                  {['Textiles', 'Nómina', 'Servicios', 'Marketing', 'Otros'].map((label, i) => (
                    <div key={label} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                      <span className="text-[9px] font-black uppercase text-slate-500 italic">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === 'reports' && (
        <div className="bg-white rounded-[4rem] shadow-2xl overflow-hidden border-8 border-slate-50 animate-in zoom-in-95 duration-500">
          {/* REPORT HEADER */}
          <div className="bg-[#000814] p-12 text-white flex justify-between items-end">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <FileText size={24} />
                </div>
                <h3 className="text-3xl font-black uppercase italic tracking-tighter">Informe Financiero Ejecutivo</h3>
              </div>
              <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                <span>Empresa: {settings.businessName}</span>
                <span>Periodo: {new Date().getFullYear()}</span>
                <span>Normativa: NIIF / IFRS</span>
                <span>Tasa: {bcvRate} Bs/$</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => window.print()} className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all text-white"><Printer size={20}/></button>
              <button onClick={() => exportToExcel(reportType)} className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all text-white"><FileSpreadsheet size={20}/></button>
              <button onClick={() => exportToPDF(reportRef, `Reporte_Roxtor_${reportType}`)} className="p-4 bg-emerald-500 rounded-2xl hover:bg-emerald-600 transition-all text-white"><Download size={20}/></button>
            </div>
          </div>

          {/* REPORT TABS */}
          <div className="flex border-b border-slate-100 bg-slate-50/50">
            <button 
              onClick={() => setReportType('results')}
              className={`flex-1 py-6 text-[10px] font-black uppercase tracking-widest italic transition-all ${reportType === 'results' ? 'bg-white text-emerald-600 border-b-4 border-emerald-500' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Estado de Resultados
            </button>
            <button 
              onClick={() => setReportType('balance')}
              className={`flex-1 py-6 text-[10px] font-black uppercase tracking-widest italic transition-all ${reportType === 'balance' ? 'bg-white text-emerald-600 border-b-4 border-emerald-500' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Balance General
            </button>
            <button 
              onClick={() => setReportType('cashflow')}
              className={`flex-1 py-6 text-[10px] font-black uppercase tracking-widest italic transition-all ${reportType === 'cashflow' ? 'bg-white text-emerald-600 border-b-4 border-emerald-500' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Flujo de Efectivo
            </button>
          </div>

          {/* REPORT CONTENT (A4 Style) */}
          <div ref={reportRef} className="p-16 max-w-4xl mx-auto space-y-12 bg-white">
            {reportType === 'results' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="text-center space-y-2">
                  <h4 className="text-2xl font-black uppercase italic text-slate-800">Estado de Resultados Integrales</h4>
                  <p className="text-xs font-bold text-slate-400 uppercase italic">Expresado en {currency === 'USD' ? 'Dólares Estadounidenses ($)' : 'Bolívares (Bs.)'}</p>
                </div>

                <div className="space-y-4">
                  <ReportRow label="INGRESOS POR VENTAS" value={financialData.totalIncome} formatCurrency={formatCurrency} isHeader />
                  <ReportRow label="Ventas Textiles (4100)" value={financialData.totalIncome * 0.7} formatCurrency={formatCurrency} isSub />
                  <ReportRow label="Servicios de Personalización (4200)" value={financialData.totalIncome * 0.3} formatCurrency={formatCurrency} isSub />
                  
                  <div className="h-4" />
                  
                  <ReportRow label="COSTOS DE PRODUCCIÓN" value={-financialData.totalCosts} formatCurrency={formatCurrency} isHeader />
                  <ReportRow label="Costos Textiles (5100)" value={-financialData.totalCosts * 0.8} formatCurrency={formatCurrency} isSub />
                  <ReportRow label="Costos Operativos (5300)" value={-financialData.totalCosts * 0.2} formatCurrency={formatCurrency} isSub />
                  
                  <div className="h-4 border-t-2 border-slate-800" />
                  
                  <ReportRow label="UTILIDAD BRUTA" value={financialData.grossProfit} formatCurrency={formatCurrency} isTotal />
                  
                  <div className="h-4" />
                  
                  <ReportRow label="GASTOS OPERATIVOS" value={-financialData.totalExpenses} formatCurrency={formatCurrency} isHeader />
                  <ReportRow label="Gastos Administrativos (6100)" value={-financialData.totalExpenses * 0.4} formatCurrency={formatCurrency} isSub />
                  <ReportRow label="Gastos Comerciales (6200)" value={-financialData.totalExpenses * 0.2} formatCurrency={formatCurrency} isSub />
                  <ReportRow label="Nómina (6300)" value={-financialData.totalExpenses * 0.4} formatCurrency={formatCurrency} isSub />
                  
                  <div className="h-4 border-t-2 border-slate-800" />
                  
                  <ReportRow label="EBITDA" value={financialData.ebitda} formatCurrency={formatCurrency} isTotal />
                  <ReportRow label="Depreciación y Amortización" value={-financialData.totalIncome * 0.05} formatCurrency={formatCurrency} />
                  
                  <div className="h-8 border-b-4 border-double border-slate-800" />
                  
                  <ReportRow label="UTILIDAD NETA DEL EJERCICIO" value={financialData.netProfit} formatCurrency={formatCurrency} isFinal />
                </div>
              </div>
            )}

            {reportType === 'balance' && (
              <div className="grid grid-cols-2 gap-16 animate-in fade-in duration-500">
                <div className="space-y-8">
                  <h4 className="text-xl font-black uppercase italic text-emerald-600 border-b-2 border-emerald-100 pb-2">Activos</h4>
                  <div className="space-y-4">
                    <ReportRow label="ACTIVO CORRIENTE" value={financialData.totalIncome * 0.4} formatCurrency={formatCurrency} isHeader />
                    <ReportRow label="Caja y Bancos" value={financialData.totalIncome * 0.15} formatCurrency={formatCurrency} isSub />
                    <ReportRow label="Cuentas por Cobrar" value={financialData.totalIncome * 0.1} formatCurrency={formatCurrency} isSub />
                    <ReportRow label="Inventarios" value={financialData.totalIncome * 0.15} formatCurrency={formatCurrency} isSub />
                    
                    <div className="h-4" />
                    
                    <ReportRow label="ACTIVO NO CORRIENTE" value={25000 + financialData.manualAssets} formatCurrency={formatCurrency} isHeader />
                    <ReportRow label="Propiedad, Planta y Equipo" value={30000 + financialData.manualAssets} formatCurrency={formatCurrency} isSub />
                    <ReportRow label="Depreciación Acumulada" value={-5000} formatCurrency={formatCurrency} isSub />
                    
                    <div className="h-4 border-t-2 border-slate-800" />
                    <ReportRow label="TOTAL ACTIVOS" value={financialData.totalIncome * 0.4 + 25000 + financialData.manualAssets} formatCurrency={formatCurrency} isTotal />
                  </div>
                </div>

                <div className="space-y-8">
                  <h4 className="text-xl font-black uppercase italic text-rose-600 border-b-2 border-rose-100 pb-2">Pasivo y Patrimonio</h4>
                  <div className="space-y-4">
                    <ReportRow label="PASIVO CORRIENTE" value={financialData.totalExpenses * 0.5 + financialData.manualLiabilities} formatCurrency={formatCurrency} isHeader />
                    <ReportRow label="Proveedores" value={financialData.totalExpenses * 0.3} formatCurrency={formatCurrency} isSub />
                    <ReportRow label="Cuentas por Pagar" value={financialData.totalExpenses * 0.2 + financialData.manualLiabilities} formatCurrency={formatCurrency} isSub />
                    
                    <div className="h-4" />
                    
                    <ReportRow label="PATRIMONIO" value={financialData.totalIncome * 0.4 + 25000 + financialData.manualAssets - (financialData.totalExpenses * 0.5 + financialData.manualLiabilities)} formatCurrency={formatCurrency} isHeader />
                    <ReportRow label="Capital Social" value={15000 + financialData.manualEquity} formatCurrency={formatCurrency} isSub />
                    <ReportRow label="Utilidades Retenidas" value={5000} formatCurrency={formatCurrency} isSub />
                    <ReportRow label="Resultado del Ejercicio" value={financialData.netProfit} formatCurrency={formatCurrency} isSub />
                    
                    <div className="h-4 border-t-2 border-slate-800" />
                    <ReportRow label="TOTAL PASIVO Y PATRIMONIO" value={financialData.totalIncome * 0.4 + 25000 + financialData.manualAssets} formatCurrency={formatCurrency} isTotal />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeView === 'data-entry' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
          <div className="lg:col-span-1 bg-white p-10 rounded-[3rem] border-4 border-slate-50 shadow-sm space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center">
                <Plus size={24} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Carga NIIF</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 italic mb-2 block">Cuenta Contable</label>
                <select 
                  value={newEntry.accountCode}
                  onChange={(e) => setNewEntry({...newEntry, accountCode: e.target.value})}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-xs font-bold italic focus:border-emerald-500 outline-none transition-all"
                >
                  <option value="">Seleccione Cuenta</option>
                  {PLAN_CONTABLE.map(acc => (
                    <option key={acc.code} value={acc.code}>{acc.code} - {acc.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 italic mb-2 block">Monto ($)</label>
                <input 
                  type="number"
                  value={newEntry.amount}
                  onChange={(e) => setNewEntry({...newEntry, amount: e.target.value})}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-xs font-bold italic focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 italic mb-2 block">Tipo de Movimiento</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setNewEntry({...newEntry, type: 'DEBITO'})}
                    className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase italic transition-all ${newEntry.type === 'DEBITO' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}
                  >
                    Débito (+)
                  </button>
                  <button 
                    onClick={() => setNewEntry({...newEntry, type: 'CREDITO'})}
                    className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase italic transition-all ${newEntry.type === 'CREDITO' ? 'bg-rose-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}
                  >
                    Crédito (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 italic mb-2 block">Descripción / Glosa</label>
                <textarea 
                  value={newEntry.description}
                  onChange={(e) => setNewEntry({...newEntry, description: e.target.value})}
                  placeholder="Ej: Aporte de Capital Socios..."
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-xs font-bold italic focus:border-emerald-500 outline-none transition-all h-24 resize-none"
                />
              </div>

              <button 
                onClick={() => {
                  if (!newEntry.accountCode || !newEntry.amount) return;
                  const amount = parseFloat(newEntry.amount);
                  const entry: JournalEntry = {
                    id: Math.random().toString(36).substr(2, 9),
                    date: new Date().toISOString(),
                    description: newEntry.description,
                    items: [{
                      accountCode: newEntry.accountCode,
                      debit: newEntry.type === 'DEBITO' ? amount : 0,
                      credit: newEntry.type === 'CREDITO' ? amount : 0
                    }]
                  };
                  setManualEntries([...manualEntries, entry]);
                  setNewEntry({ accountCode: '', amount: '', type: 'DEBITO', description: '' });
                }}
                className="w-full bg-[#000814] text-white py-6 rounded-[2rem] font-black uppercase italic tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-all"
              >
                Registrar Asiento
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border-4 border-slate-50 shadow-sm space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Libro Diario (Consolidado ERP)</h3>
              <button 
                onClick={() => exportToExcel('journal')}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-black uppercase italic text-slate-600 hover:bg-slate-200 transition-all"
              >
                <FileSpreadsheet size={14} /> Exportar Diario
              </button>
            </div>
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto no-scrollbar">
              <table className="w-full">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b-2 border-slate-100">
                    <th className="text-left py-4 text-[10px] font-black uppercase text-slate-400 italic">Fecha</th>
                    <th className="text-left py-4 text-[10px] font-black uppercase text-slate-400 italic">Cuenta</th>
                    <th className="text-left py-4 text-[10px] font-black uppercase text-slate-400 italic">Descripción</th>
                    <th className="text-right py-4 text-[10px] font-black uppercase text-slate-400 italic">Monto</th>
                    <th className="text-center py-4 text-[10px] font-black uppercase text-slate-400 italic">Origen</th>
                  </tr>
                </thead>
                <tbody>
                  {allJournalEntries.map((entry, idx) => {
                    const account = PLAN_CONTABLE.find(a => a.code === entry.account);
                    return (
                      <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all">
                        <td className="py-4 text-[10px] font-bold text-slate-500 italic">{new Date(entry.date).toLocaleDateString()}</td>
                        <td className="py-4">
                          <p className="text-[10px] font-black text-slate-800 uppercase italic">{account?.name || 'S/N'}</p>
                          <p className="text-[8px] font-bold text-slate-400">{entry.account}</p>
                        </td>
                        <td className="py-4 text-[10px] font-bold text-slate-600 italic max-w-xs truncate">{entry.description}</td>
                        <td className={`py-4 text-right text-[10px] font-black italic ${entry.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {formatCurrency(entry.amount)}
                        </td>
                        <td className="py-4 text-center">
                          <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase italic ${entry.type === 'ERP' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {entry.type}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeView === 'projections' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="bg-white p-10 rounded-[3rem] border-4 border-slate-50 shadow-sm">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center">
                  <TrendingUp size={24} />
                </div>
                <h3 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Proyecciones Financieras</h3>
              </div>
              <div className="flex gap-3">
                <div className="flex bg-slate-100 p-1 rounded-2xl mr-4">
                  {[3, 6, 12, 24].map(p => (
                    <button 
                      key={p}
                      onClick={() => setProjectionPeriod(p as any)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase italic transition-all ${projectionPeriod === p ? 'bg-[#000814] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {p} Meses
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => exportToPDF(projectionsRef, 'Proyecciones_Roxtor')}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase italic tracking-widest shadow-lg hover:scale-105 transition-all"
                >
                  <Download size={14} /> Descargar PDF
                </button>
              </div>
            </div>
            
            <div ref={projectionsRef} className="bg-white p-8 space-y-8">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={projections}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                    <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                    <Line type="monotone" dataKey="optimistic" name="Optimista" stroke="#10b981" strokeWidth={4} dot={{r: 6, fill: '#10b981'}} />
                    <Line type="monotone" dataKey="conservative" name="Conservador" stroke="#3b82f6" strokeWidth={4} dot={{r: 6, fill: '#3b82f6'}} />
                    <Line type="monotone" dataKey="pessimistic" name="Pesimista" stroke="#ef4444" strokeWidth={4} dot={{r: 6, fill: '#ef4444'}} />
                    <Line type="monotone" dataKey="costs" name="Costos Proyectados" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-emerald-50 rounded-3xl border-2 border-emerald-100 space-y-2">
                  <p className="text-[10px] font-black text-emerald-600 uppercase italic">Escenario Optimista</p>
                  <p className="text-2xl font-black text-emerald-700 italic">{formatCurrency(projections[projections.length-1].optimistic * projectionPeriod)}</p>
                  <p className="text-[9px] font-bold text-emerald-500 italic">Crecimiento proyectado del 20%</p>
                </div>
                <div className="p-6 bg-blue-50 rounded-3xl border-2 border-blue-100 space-y-2">
                  <p className="text-[10px] font-black text-blue-600 uppercase italic">Escenario Conservador</p>
                  <p className="text-2xl font-black text-blue-700 italic">{formatCurrency(projections[projections.length-1].conservative * projectionPeriod)}</p>
                  <p className="text-[9px] font-bold text-blue-500 italic">Basado en promedio histórico</p>
                </div>
                <div className="p-6 bg-rose-50 rounded-3xl border-2 border-rose-100 space-y-2">
                  <p className="text-[10px] font-black text-rose-600 uppercase italic">Escenario Pesimista</p>
                  <p className="text-2xl font-black text-rose-700 italic">{formatCurrency(projections[projections.length-1].pessimistic * projectionPeriod)}</p>
                  <p className="text-[9px] font-bold text-rose-500 italic">Contracción proyectada del 20%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === 'analysis' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="bg-white p-10 rounded-[3rem] border-4 border-slate-50 shadow-sm">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-500 text-white rounded-2xl flex items-center justify-center">
                  <Activity size={24} />
                </div>
                <h3 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Interpretación Financiera</h3>
              </div>
              <button 
                onClick={() => exportToPDF(analysisRef, 'Analisis_Roxtor')}
                className="flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-2xl text-[10px] font-black uppercase italic tracking-widest shadow-lg hover:scale-105 transition-all"
              >
                <Download size={14} /> Descargar Análisis
              </button>
            </div>

            <div ref={analysisRef} className="bg-white p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <AnalysisItem 
                    title="Salud Financiera" 
                    status={financialData.netMargin > 15 ? 'Excelente' : 'Estable'}
                    description={`La empresa mantiene un margen neto del ${financialData.netMargin.toFixed(1)}%, lo cual indica una estructura de costos eficiente y una alta capacidad de generación de valor.`}
                    color={financialData.netMargin > 15 ? 'text-emerald-600' : 'text-blue-600'}
                  />
                  <AnalysisItem 
                    title="Riesgos Detectados" 
                    status="Bajo"
                    description="El punto de equilibrio se alcanza en los primeros 12 días del mes. El principal riesgo es la dependencia de insumos importados con volatilidad de precios."
                    color="text-amber-600"
                  />
                  <AnalysisItem 
                    title="Capacidad de Endeudamiento" 
                    status="Alta"
                    description={`Con un EBITDA de ${formatCurrency(financialData.ebitda)}, la empresa puede asumir compromisos financieros para expansión de maquinaria sin comprometer el flujo de caja operativo.`}
                    color="text-emerald-600"
                  />
                </div>

                <div className="bg-[#000814] p-10 rounded-[3rem] shadow-2xl space-y-8 text-white">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center">
                      <ShieldCheck size={24} />
                    </div>
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter">Recomendaciones Estratégicas</h3>
                  </div>

                  <div className="space-y-4">
                    <RecommendationCard 
                      icon={<TrendingUp size={18} />}
                      title="Optimización de Margen B2B"
                      text="Ajustar el margen en pedidos corporativos al 45% para absorber variaciones en costos de telas premium."
                    />
                    <RecommendationCard 
                      icon={<Zap size={18} />}
                      title="Inversión en Maquinaria"
                      text="Se recomienda la adquisición de una nueva bordadora de 4 cabezales para reducir el costo de máquina (CM) en un 15%."
                    />
                    <RecommendationCard 
                      icon={<PieChart size={18} />}
                      title="Diversificación de Línea"
                      text="Potenciar la línea de uniformes escolares en el Q3 para equilibrar la estacionalidad de las ventas corporativas."
                    />
                    <RecommendationCard 
                      icon={<Activity size={18} />}
                      title="Gestión de Inventario"
                      text="Implementar política de stock crítico para insumos DTF para evitar paradas de producción por quiebre de stock."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === 'fiscal' && (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
          <div className="bg-white p-12 rounded-[4rem] border-8 border-slate-50 shadow-2xl space-y-12">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-xl">
                <ShieldCheck size={40} />
              </div>
              <h3 className="text-4xl font-black text-slate-800 uppercase italic tracking-tighter">Configuración Fiscal Veraz</h3>
              <p className="text-xs font-bold text-slate-400 uppercase italic tracking-widest">Información exclusiva para reportes contables NIIF</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 italic ml-4">Nombre Legal de la Empresa</label>
                  <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 text-sm font-black text-slate-800 italic">
                    {settings.fiscalData?.legalName || "No configurado"}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 italic ml-4">Registro Fiscal (RIF)</label>
                  <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 text-sm font-black text-slate-800 italic">
                    {settings.fiscalData?.rif || "No configurado"}
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 italic ml-4">Dirección Fiscal</label>
                  <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 text-sm font-black text-slate-800 italic h-[148px]">
                    {settings.fiscalData?.fiscalAddress || "No configurado"}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-xl font-black uppercase italic text-slate-800 border-b-4 border-slate-100 pb-4">Socios y Participación</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {settings.fiscalData?.partners?.map((partner, idx) => (
                  <div key={idx} className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 flex justify-between items-center">
                    <span className="text-xs font-black text-slate-800 uppercase italic">{partner.name}</span>
                    <span className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black italic">{partner.percentage}%</span>
                  </div>
                )) || (
                  <p className="text-xs font-bold text-slate-300 italic uppercase tracking-widest col-span-2 text-center py-10">No hay socios registrados</p>
                )}
              </div>
            </div>

            <div className="p-8 bg-amber-50 rounded-[2rem] border-2 border-amber-100 flex gap-6 items-center">
              <AlertCircle className="text-amber-500 flex-shrink-0" size={32} />
              <p className="text-[10px] font-bold text-amber-700 italic leading-relaxed">
                ESTA INFORMACIÓN ES ESTRICTAMENTE PARA USO CONTABLE Y AUDITORÍA. 
                NO SE REFLEJARÁ EN ÓRDENES DE COMPRA, NOTAS DE ENTREGA NI RECIBOS PÚBLICOS.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeView === 'costs' && (
        <div className="animate-in fade-in duration-500">
          <CostEngineering 
            products={products}
            onSaveToInventory={(data) => {
              console.log('Guardando costo en inventario:', data);
              alert(`Costo de ${data.name} guardado: $${data.cost.toFixed(2)}`);
            }} 
          />
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon, trend, color }: any) => (
  <div className={`p-8 rounded-[2.5rem] border-4 border-white shadow-sm space-y-4 ${color}`}>
    <div className="flex justify-between items-start">
      <div className="p-3 bg-white rounded-2xl shadow-sm">{icon}</div>
      <span className="text-[10px] font-black uppercase italic text-slate-400">{trend}</span>
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-black text-slate-800 italic tracking-tighter">{value}</p>
    </div>
  </div>
);

const ReportRow = ({ label, value, formatCurrency, isHeader, isSub, isTotal, isFinal }: any) => (
  <div className={`flex justify-between items-center py-2 ${isHeader ? 'mt-6' : ''} ${isTotal ? 'border-t border-slate-300 pt-4' : ''} ${isFinal ? 'pt-4' : ''}`}>
    <span className={`uppercase italic tracking-tight ${isHeader ? 'text-xs font-black text-slate-800' : isSub ? 'text-[10px] font-bold text-slate-500 pl-6' : isTotal || isFinal ? 'text-sm font-black text-slate-900' : 'text-xs font-bold text-slate-600'}`}>
      {label}
    </span>
    <span className={`font-black italic ${isHeader ? 'text-xs text-slate-800' : isSub ? 'text-[10px] text-slate-500' : isTotal ? 'text-sm text-slate-900' : isFinal ? 'text-lg text-emerald-600' : 'text-xs text-slate-600'}`}>
      {formatCurrency(value)}
    </span>
  </div>
);

const AnalysisItem = ({ title, status, description, color }: any) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <h4 className="text-xs font-black uppercase italic text-slate-400">{title}</h4>
      <span className={`text-[10px] font-black uppercase italic px-3 py-1 rounded-full bg-slate-50 border border-slate-100 ${color}`}>{status}</span>
    </div>
    <p className="text-xs font-bold text-slate-600 italic leading-relaxed">{description}</p>
  </div>
);

const RecommendationCard = ({ icon, title, text }: any) => (
  <div className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all group cursor-default">
    <div className="flex items-center gap-4 mb-2">
      <div className="text-emerald-400 group-hover:scale-110 transition-transform">{icon}</div>
      <h4 className="text-xs font-black uppercase italic tracking-widest">{title}</h4>
    </div>
    <p className="text-[11px] font-medium text-slate-400 italic leading-relaxed pl-8">{text}</p>
  </div>
);

export default AccountingSystem;
