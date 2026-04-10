
import React, { useState } from 'react';
import { Order, Product, Agent, AppSettings, Workshop, Expense, Debt, PayrollPayment, Lead } from '../../types';
import OrderManager from './OrderManager';
import InventoryManager from './InventoryManager';
import FinanceManager from './FinanceManager';
import HRManager from './HRManager';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  DollarSign, 
  Users,
  Settings as SettingsIcon
} from 'lucide-react';

interface Props {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  agents: Agent[];
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  expenses: Expense[];
  debts: Debt[];
  payroll: PayrollPayment[];
  workshops: Workshop[];
  currentStoreId: string;
}

const CoreERPView: React.FC<Props> = (props) => {
  const [activeModule, setActiveModule] = useState<'orders' | 'inventory' | 'finance' | 'hr'>('orders');

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 lg:p-8 space-y-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header con Navegación de Módulos */}
        <div className="bg-[#000814] rounded-[3rem] p-4 flex flex-wrap lg:flex-nowrap gap-2 shadow-2xl border-4 border-white/5 overflow-x-auto no-scrollbar">
          <ModuleTab 
            active={activeModule === 'orders'} 
            onClick={() => setActiveModule('orders')} 
            icon={<ShoppingBag size={20}/>} 
            label="Órdenes" 
          />
          <ModuleTab 
            active={activeModule === 'inventory'} 
            onClick={() => setActiveModule('inventory')} 
            icon={<Package size={20}/>} 
            label="Inventario" 
          />
          <ModuleTab 
            active={activeModule === 'finance'} 
            onClick={() => setActiveModule('finance')} 
            icon={<DollarSign size={20}/>} 
            label="Finanzas" 
          />
          <ModuleTab 
            active={activeModule === 'hr'} 
            onClick={() => setActiveModule('hr')} 
            icon={<Users size={20}/>} 
            label="Personal" 
          />
        </div>

        {/* Contenido del Módulo */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeModule === 'orders' && (
            <OrderManager 
              orders={props.orders} 
              setOrders={props.setOrders} 
              settings={props.settings} 
              agents={props.agents} 
              workshops={props.workshops} 
              products={props.products}
              currentStoreId={props.currentStoreId}
            />
          )}
          {activeModule === 'inventory' && (
            <InventoryManager 
              products={props.products} 
              setProducts={props.setProducts} 
              settings={props.settings} 
            />
          )}
          {activeModule === 'finance' && (
            <FinanceManager 
              orders={props.orders} 
              expenses={props.expenses} 
              debts={props.debts} 
              settings={props.settings} 
            />
          )}
          {activeModule === 'hr' && (
            <HRManager 
              agents={props.agents} 
              payroll={props.payroll} 
              orders={props.orders} 
              settings={props.settings} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

const ModuleTab = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick} 
    className={`flex-1 flex items-center justify-center gap-3 px-8 py-5 rounded-[2rem] transition-all duration-300 whitespace-nowrap ${
      active 
        ? 'bg-white text-[#000814] shadow-xl scale-[1.02] font-black italic' 
        : 'text-slate-500 hover:text-white hover:bg-white/5 font-bold'
    }`}
  >
    {icon}
    <span className="text-xs uppercase tracking-widest italic">{label}</span>
  </button>
);

export default CoreERPView;
