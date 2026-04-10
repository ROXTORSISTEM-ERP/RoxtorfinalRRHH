
import React, { useState, useMemo } from 'react';
import { Order, Product, Agent, AppSettings, Workshop, Expense, Debt, PayrollPayment, Lead } from '../types';
import Reports from './Reports';
import TeamManager from './TeamManager';
import WorkshopManager from './WorkshopManager';
import Settings from './Settings';
import LandingSettings from './LandingSettings';
import CashClosing from './CashClosing';
import AccountsPayable from './AccountsPayable';
import AccountsReceivable from './AccountsReceivable';
import Payroll from './Payroll';
import ManagerialAcademy from './ManagerialAcademy';
import CRM from './CRM';
import AccountingSystem from './AccountingSystem';
import RRHH from './RRHH';
import { 
  BarChart3, 
  Users, 
  Settings as SettingsIcon,
  Warehouse,
  Calculator,
  CreditCard,
  Banknote,
  GraduationCap,
  DollarSign,
  Layout,
  Contact,
  ShieldCheck
} from 'lucide-react';

interface Props {
  orders: Order[];
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  products: Product[];
  agents: Agent[];
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
  workshops: Workshop[];
  setWorkshops: React.Dispatch<React.SetStateAction<Workshop[]>>;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  currentStoreId: string;
  debts: Debt[];
  setDebts: React.Dispatch<React.SetStateAction<Debt[]>>;
  payroll: PayrollPayment[];
  setPayroll: React.Dispatch<React.SetStateAction<PayrollPayment[]>>;
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  currentAgent?: Agent;
  currentAgentId?: string | null;
}

const Gestion: React.FC<Props> = ({ 
  orders, 
  expenses,
  setExpenses,
  setOrders, 
  products, 
  agents, 
  setAgents, 
  workshops, 
  setWorkshops, 
  settings, 
  setSettings, 
  currentStoreId,
  debts,
  setDebts,
  payroll,
  setPayroll,
  leads,
  setLeads,
  currentAgent,
  currentAgentId
}) => {
  const [subTab, setSubTab] = useState<'reports' | 'cash' | 'receivable' | 'payable' | 'payroll' | 'team' | 'workshop' | 'brand' | 'landing' | 'academy' | 'crm' | 'accounting' | 'rrhh'>('reports');

  const canAccessAccounting = useMemo(() => {
    // Si la gerencia está desbloqueada (vía PIN maestro), dar acceso total
    // O si hay un agente logueado con rol Gerencia o permisos específicos
    const agent = currentAgent || agents.find(a => a.id === currentAgentId);
    if (!currentAgentId) return true; // Acceso vía PIN Maestro (Dueño)
    if (agent?.role === 'Gerencia' || agent?.role === 'GERENCIA') return true;
    if (settings.accountingPermissions?.includes(agent?.id || '')) return true;
    return false;
  }, [currentAgent, currentAgentId, agents, settings.accountingPermissions]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-[#000814] rounded-[2.5rem] p-2 flex flex-wrap lg:flex-nowrap gap-1 shadow-2xl overflow-x-auto no-scrollbar border-4 border-white/5">
        <SubNavItem active={subTab === 'reports'} onClick={() => setSubTab('reports')} icon={<BarChart3 size={18}/>} label="Auditoría AI" />
        <SubNavItem active={subTab === 'cash'} onClick={() => setSubTab('cash')} icon={<Calculator size={18}/>} label="Cierre Caja" />
        <SubNavItem active={subTab === 'receivable'} onClick={() => setSubTab('receivable')} icon={<DollarSign size={18}/>} label="Cuentas x Cobrar" />
        <SubNavItem active={subTab === 'payable'} onClick={() => setSubTab('payable')} icon={<CreditCard size={18}/>} label="Cuentas x Pagar" />
        <SubNavItem active={subTab === 'payroll'} onClick={() => setSubTab('payroll')} icon={<Banknote size={18}/>} label="Nómina" />
        <SubNavItem active={subTab === 'crm'} onClick={() => setSubTab('crm')} icon={<Contact size={18}/>} label="CRM" />
        {canAccessAccounting && (
          <SubNavItem active={subTab === 'accounting'} onClick={() => setSubTab('accounting')} icon={<ShieldCheck size={18} className="text-emerald-500" />} label="Contabilidad" />
        )}
        {canAccessAccounting && (
          <SubNavItem active={subTab === 'rrhh'} onClick={() => setSubTab('rrhh')} icon={<Users size={18} className="text-blue-500" />} label="RRHH" />
        )}
        <SubNavItem active={subTab === 'team'} onClick={() => setSubTab('team')} icon={<Users size={18}/>} label="Equipo" />
        <SubNavItem active={subTab === 'workshop'} onClick={() => setSubTab('workshop')} icon={<Warehouse size={18}/>} label="Aliados" />
        <SubNavItem active={subTab === 'brand'} onClick={() => setSubTab('brand')} icon={<SettingsIcon size={18}/>} label="Marca" />
        <SubNavItem active={subTab === 'landing'} onClick={() => setSubTab('landing')} icon={<Layout size={18}/>} label="Portada" />
        <SubNavItem active={subTab === 'academy'} onClick={() => setSubTab('academy')} icon={<GraduationCap size={18}/>} label="Academia" />
      </div>

      <div className="min-h-[60vh]">
        {subTab === 'reports' && <Reports orders={orders} expenses={expenses} setOrders={setOrders} products={products} settings={settings} agents={agents} workshops={workshops} debts={debts} payroll={payroll} />}
        {subTab === 'cash' && <CashClosing orders={orders} expenses={expenses} setExpenses={setExpenses} settings={settings} agents={agents} />}
        {subTab === 'receivable' && <AccountsReceivable orders={orders} settings={settings} />}
        {subTab === 'payable' && <AccountsPayable debts={debts} setDebts={setDebts} workshops={workshops} settings={settings} />}
        {subTab === 'payroll' && <Payroll payroll={payroll} setPayroll={setPayroll} agents={agents} settings={settings} orders={orders} expenses={expenses} />}
        {subTab === 'crm' && <CRM leads={leads} onUpdateLeads={setLeads} orders={orders} />}
        {subTab === 'accounting' && canAccessAccounting && <AccountingSystem orders={orders} expenses={expenses} settings={settings} agents={agents} workshops={workshops} products={products} />}
        {subTab === 'rrhh' && canAccessAccounting && (
          <RRHH 
            agents={agents} 
            onUpdateAgent={(updatedAgent) => {
              setAgents(prev => prev.map(a => a.id === updatedAgent.id ? updatedAgent : a));
            }}
            settings={settings}
            payroll={payroll}
          />
        )}
        {subTab === 'team' && <TeamManager agents={agents} setAgents={setAgents} orders={orders} expenses={expenses} currentStoreId={currentStoreId} />}
        {subTab === 'workshop' && (
          <WorkshopManager 
            workshops={workshops} 
            setWorkshops={setWorkshops} 
            currentStoreId={currentStoreId}
            orders={orders}
            setOrders={setOrders}
            settings={settings}
          />
        )}
        {subTab === 'brand' && (
          <Settings 
            settings={settings} 
            setSettings={setSettings} 
            agents={agents} 
            onResetOrders={() => {
              if (confirm("¿Borrar todas las órdenes?")) setOrders([]);
            }}
            onResetExpenses={() => {
              if (confirm("¿Borrar todos los gastos?")) setExpenses([]);
            }}
            onResetAll={() => {
              if (confirm("¿ESTÁS SEGURO? Esta acción eliminará TODAS las órdenes, gastos, deudas, nóminas y prospectos para dejar el sistema en blanco.")) {
                setOrders([]);
                setExpenses([]);
                setDebts([]);
                setPayroll([]);
                setLeads([]);
                alert("Sistema reiniciado con éxito.");
              }
            }}
          />
        )}
        {subTab === 'landing' && <LandingSettings settings={settings} setSettings={setSettings} />}
        {subTab === 'academy' && <ManagerialAcademy />}
      </div>
    </div>
  );
};

const SubNavItem = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl transition-all duration-300 whitespace-nowrap ${active ? 'bg-white text-[#000814] shadow-md font-black italic scale-[1.02]' : 'text-slate-500 hover:text-white hover:bg-white/5 font-bold'}`}>
    {icon}
    <span className="text-[10px] uppercase tracking-widest italic">{label}</span>
  </button>
);

export default Gestion;
