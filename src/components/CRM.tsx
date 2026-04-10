
import React, { useState } from 'react';
import { Lead, LeadStatus, LeadCategory, LeadTemperature, Order } from '../types';
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Instagram, 
  MapPin, 
  MoreVertical, 
  Filter,
  Calendar,
  MessageSquare,
  Building2,
  ChevronRight,
  Trash2,
  Edit2,
  Save,
  X,
  User,
  Thermometer,
  Tag,
  Star,
  Zap,
  LayoutDashboard,
  BarChart3,
  Flame,
  Sun,
  Snowflake,
  Palette,
  MessageCircle
} from 'lucide-react';

interface Props {
  leads: Lead[];
  onUpdateLeads: (leads: Lead[]) => void;
  orders?: Order[];
}

const CRM: React.FC<Props> = ({ leads, onUpdateLeads, orders = [] }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'leads' | 'pipeline'>('leads');
  const [selectedLeadForDesigns, setSelectedLeadForDesigns] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<LeadStatus | 'Todos'>('Todos');
  const [filterCategory, setFilterCategory] = useState<LeadCategory | 'Todas'>('Todas');
  const [filterTemperature, setFilterTemperature] = useState<LeadTemperature | 'Todas'>('Todas');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [newLead, setNewLead] = useState<Partial<Lead>>({
    companyName: '',
    contactPerson: '',
    phone: '',
    instagram: '',
    address: '',
    status: 'Prospecto',
    category: 'Potencial',
    temperature: 'Tibio',
    notes: ''
  });

  const statuses: LeadStatus[] = ['Prospecto', 'Contactado', 'Reunión agendada', 'Propuesta enviada', 'Cliente'];
  const categories: LeadCategory[] = ['Potencial', 'Frecuente', 'Personal'];
  const temperatures: LeadTemperature[] = ['Frío', 'Tibio', 'Caliente', 'Problemático'];

  const handleAddLead = () => {
    if (!newLead.companyName || !newLead.contactPerson || !newLead.phone) {
      alert("Por favor complete los campos obligatorios (Empresa, Encargado, Teléfono)");
      return;
    }

    const lead: Lead = {
      id: Math.random().toString(36).substr(2, 9),
      companyName: newLead.companyName!,
      contactPerson: newLead.contactPerson!,
      phone: newLead.phone!,
      instagram: newLead.instagram || '',
      address: newLead.address || '',
      status: newLead.status as LeadStatus || 'Prospecto',
      category: newLead.category as LeadCategory || 'Potencial',
      temperature: newLead.temperature as LeadTemperature || 'Tibio',
      notes: newLead.notes || '',
      createdAt: new Date().toISOString(),
      lastContactDate: new Date().toISOString()
    };

    onUpdateLeads([lead, ...leads]);
    setShowAddModal(false);
    setNewLead({
      companyName: '',
      contactPerson: '',
      phone: '',
      instagram: '',
      address: '',
      status: 'Prospecto',
      category: 'Potencial',
      temperature: 'Tibio',
      notes: ''
    });
  };

  const handleUpdateLead = () => {
    if (!editingLead) return;
    const updatedLeads = leads.map(l => l.id === editingLead.id ? editingLead : l);
    onUpdateLeads(updatedLeads);
    setEditingLead(null);
  };

  const handleDeleteLead = (id: string) => {
    if (window.confirm("¿Está seguro de eliminar este contacto comercial?")) {
      onUpdateLeads(leads.filter(l => l.id !== id));
    }
  };

  const filteredLeads = leads.filter(l => {
    const matchesSearch = 
      l.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.phone.includes(searchTerm);
    const matchesStatus = filterStatus === 'Todos' || l.status === filterStatus;
    const matchesCategory = filterCategory === 'Todas' || l.category === filterCategory;
    const matchesTemperature = filterTemperature === 'Todas' || l.temperature === filterTemperature;
    return matchesSearch && matchesStatus && matchesCategory && matchesTemperature;
  });

  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case 'Prospecto': return 'bg-slate-100 text-slate-600';
      case 'Contactado': return 'bg-blue-100 text-blue-600';
      case 'Reunión agendada': return 'bg-purple-100 text-purple-600';
      case 'Propuesta enviada': return 'bg-amber-100 text-amber-600';
      case 'Cliente': return 'bg-emerald-100 text-emerald-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getTemperatureColor = (temp: LeadTemperature) => {
    switch (temp) {
      case 'Frío': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Tibio': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Caliente': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'Problemático': return 'bg-red-100 text-red-600 border-red-200';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  const getTemperatureIcon = (temp: LeadTemperature) => {
    switch (temp) {
      case 'Frío': return <Snowflake size={10} />;
      case 'Tibio': return <Sun size={10} />;
      case 'Caliente': return <Flame size={10} />;
      default: return <Thermometer size={10} />;
    }
  };

  const getCategoryIcon = (cat: LeadCategory) => {
    switch (cat) {
      case 'Potencial': return <Star size={12} className="text-amber-500" />;
      case 'Frecuente': return <Zap size={12} className="text-blue-500" />;
      case 'Personal': return <User size={12} className="text-slate-500" />;
      default: return <Tag size={12} />;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 italic min-h-[600px]">
      {/* SIDEBAR NAVIGATION */}
      <div className="lg:w-64 flex flex-col gap-2">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
            activeTab === 'dashboard'
              ? 'bg-emerald-50 text-emerald-700 shadow-sm'
              : 'text-zinc-500 hover:bg-zinc-100'
          }`}
        >
          <LayoutDashboard size={18} /> Dashboard
        </button>
        <button
          onClick={() => setActiveTab('leads')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
            activeTab === 'leads'
              ? 'bg-emerald-50 text-emerald-700 shadow-sm'
              : 'text-zinc-500 hover:bg-zinc-100'
          }`}
        >
          <Users size={18} /> Base de Datos
        </button>
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
            activeTab === 'pipeline'
              ? 'bg-emerald-50 text-emerald-700 shadow-sm'
              : 'text-zinc-500 hover:bg-zinc-100'
          }`}
        >
          <BarChart3 size={18} /> Pipeline
        </button>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 space-y-8">
        {activeTab === 'leads' && (
          <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-[#000814] text-white rounded-[2rem] flex items-center justify-center shadow-xl rotate-3">
                  <Users size={32} />
                </div>
                <div>
                  <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">Base Comercial</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2 italic">Gestión de Prospectos e Instituciones</p>
                </div>
              </div>

              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-[#000814] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-blue-600 transition-all shadow-2xl active:scale-95"
              >
                <Plus size={20} /> Nuevo Contacto
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* FILTROS Y BUSQUEDA */}
              <div className="lg:col-span-12 space-y-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                      type="text" 
                      placeholder="Buscar por empresa, encargado o teléfono..."
                      className="w-full bg-white border-4 border-slate-50 rounded-2xl px-6 py-4 pl-14 text-slate-800 font-bold outline-none focus:border-blue-100 transition-all italic"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* INTERNAL TABS STYLE FOR FILTERS */}
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-6 border-b border-slate-100">
                      <span className="text-[8px] font-black text-slate-300 uppercase italic">Estado:</span>
                      <div className="flex gap-4 overflow-x-auto no-scrollbar">
                        {['Todos', ...statuses].map((s) => (
                          <button
                            key={s}
                            onClick={() => setFilterStatus(s as any)}
                            className={`pb-3 px-1 font-black text-[9px] uppercase tracking-widest whitespace-nowrap transition-all relative ${
                              filterStatus === s 
                                ? 'text-emerald-700' 
                                : 'text-zinc-400 hover:text-zinc-600'
                            }`}
                          >
                            {s}
                            {filterStatus === s && (
                              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald-500 animate-in fade-in duration-300" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-6 border-b border-slate-100">
                      <span className="text-[8px] font-black text-slate-300 uppercase italic">Categoría:</span>
                      <div className="flex gap-4 overflow-x-auto no-scrollbar">
                        {['Todas', ...categories].map((c) => (
                          <button
                            key={c}
                            onClick={() => setFilterCategory(c as any)}
                            className={`pb-3 px-1 font-black text-[9px] uppercase tracking-widest whitespace-nowrap transition-all relative ${
                              filterCategory === c 
                                ? 'text-emerald-700' 
                                : 'text-zinc-400 hover:text-zinc-600'
                            }`}
                          >
                            {c}
                            {filterCategory === c && (
                              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald-500 animate-in fade-in duration-300" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-6 border-b border-slate-100">
                      <span className="text-[8px] font-black text-slate-300 uppercase italic">Temperatura:</span>
                      <div className="flex gap-4 overflow-x-auto no-scrollbar">
                        {['Todas', ...temperatures].map((t) => (
                          <button
                            key={t}
                            onClick={() => setFilterTemperature(t as any)}
                            className={`pb-3 px-1 font-black text-[9px] uppercase tracking-widest whitespace-nowrap transition-all relative ${
                              filterTemperature === t 
                                ? 'text-emerald-700' 
                                : 'text-zinc-400 hover:text-zinc-600'
                            }`}
                          >
                            {t}
                            {filterTemperature === t && (
                              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald-500 animate-in fade-in duration-300" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* LISTADO DE LEADS */}
              <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredLeads.map((lead) => (
                  <div key={lead.id} className="bg-white border-4 border-slate-50 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                    <div className={`absolute top-0 right-0 w-32 h-32 opacity-[0.03] -mr-8 -mt-8 rotate-12 group-hover:rotate-0 transition-transform`}>
                      <Building2 size={128} />
                    </div>

                    <div className="flex justify-between items-start mb-6">
                      <div className="flex flex-col gap-2">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                        <div className="flex gap-2">
                          <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${getTemperatureColor(lead.temperature)}`}>
                            {getTemperatureIcon(lead.temperature)} {lead.temperature}
                          </span>
                          <span className="px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest bg-slate-50 text-slate-500 border border-slate-100 flex items-center gap-1.5">
                            {getCategoryIcon(lead.category)} {lead.category}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingLead(lead)} className="p-2 text-slate-300 hover:text-blue-500 transition-colors"><Edit2 size={18}/></button>
                        <button onClick={() => handleDeleteLead(lead.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={18}/></button>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xl font-black text-slate-800 uppercase italic leading-tight mb-1">{lead.companyName}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2 italic">
                          <User size={12} className="text-blue-500" /> {lead.contactPerson}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-4 text-slate-600">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400"><Phone size={18}/></div>
                          <span className="text-sm font-bold italic">{lead.phone}</span>
                        </div>
                        {lead.instagram && (
                          <div className="flex items-center gap-4 text-slate-600">
                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400"><Instagram size={18}/></div>
                            <span className="text-sm font-bold italic">@{lead.instagram.replace('@', '')}</span>
                          </div>
                        )}
                        {lead.address && (
                          <div className="flex items-center gap-4 text-slate-600">
                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400"><MapPin size={18}/></div>
                            <span className="text-xs font-bold italic leading-tight">{lead.address}</span>
                          </div>
                        )}
                      </div>

                      {lead.notes && (
                        <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase italic mb-2 flex items-center gap-2"><MessageSquare size={12}/> NOTAS</p>
                          <p className="text-[11px] font-bold text-slate-600 italic leading-relaxed">{lead.notes}</p>
                        </div>
                      )}

                      {orders.some(o => o.customerPhone.replace(/\D/g, '').includes(lead.phone.replace(/\D/g, '')) && o.finalDesignUrl) && (
                        <button 
                          onClick={() => setSelectedLeadForDesigns(lead)}
                          className="w-full bg-emerald-50 text-emerald-600 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-600 hover:text-white transition-all italic"
                        >
                          <Palette size={14} /> Ver Diseños Finales
                        </button>
                      )}

                      <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-[9px] font-black text-slate-300 uppercase italic">
                          <Calendar size={12} /> {new Date(lead.createdAt).toLocaleDateString()}
                        </div>
                        <button className="text-blue-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-1 hover:gap-3 transition-all italic">
                          DETALLES <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-[2rem] border-4 border-slate-50 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Prospectos</p>
                <p className="text-4xl font-black text-slate-800 italic">{leads.length}</p>
              </div>
              <div className="bg-white p-8 rounded-[2rem] border-4 border-slate-50 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Clientes Convertidos</p>
                <p className="text-4xl font-black text-emerald-600 italic">{leads.filter(l => l.status === 'Cliente').length}</p>
              </div>
              <div className="bg-white p-8 rounded-[2rem] border-4 border-slate-50 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Oportunidades Calientes</p>
                <p className="text-4xl font-black text-orange-600 italic">{leads.filter(l => l.temperature === 'Caliente').length}</p>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border-4 border-slate-50 shadow-sm">
              <h3 className="text-xl font-black text-slate-800 uppercase italic mb-6">Distribución por Estado</h3>
              <div className="space-y-4">
                {statuses.map(status => {
                  const count = leads.filter(l => l.status === status).length;
                  const percent = leads.length > 0 ? (count / leads.length) * 100 : 0;
                  return (
                    <div key={status} className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase italic">
                        <span>{status}</span>
                        <span>{count} ({percent.toFixed(0)}%)</span>
                      </div>
                      <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-1000" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pipeline' && (
          <div className="space-y-8 animate-in fade-in duration-500">
             <div className="flex items-center gap-4 mb-8">
                <BarChart3 className="text-emerald-600" size={32} />
                <h2 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter">Pipeline de Ventas</h2>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-8">
                {statuses.map(status => (
                  <div key={status} className="min-w-[250px] bg-slate-50/50 rounded-[2rem] p-4 border-2 border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2 flex justify-between items-center">
                      {status}
                      <span className="bg-white px-2 py-0.5 rounded-lg text-slate-800">{leads.filter(l => l.status === status).length}</span>
                    </h4>
                    <div className="space-y-3">
                      {leads.filter(l => l.status === status).map(lead => (
                        <div key={lead.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                          <p className="text-xs font-black text-slate-800 uppercase italic mb-1 truncate">{lead.companyName}</p>
                          <div className="flex justify-between items-center">
                            <span className={`text-[8px] px-2 py-0.5 rounded-md font-black uppercase ${getTemperatureColor(lead.temperature)}`}>
                              {lead.temperature}
                            </span>
                            <span className="text-[8px] text-slate-400 font-bold italic">{new Date(lead.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>

      {/* MODAL AGREGAR/EDITAR */}
      {(showAddModal || editingLead) && (
        <div className="fixed inset-0 z-[100] bg-[#000814]/90 backdrop-blur-xl flex items-center justify-center p-6 italic">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl border-8 border-white/10 animate-in zoom-in-95 space-y-8 overflow-y-auto max-h-[90vh] no-scrollbar">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none italic">
                  {editingLead ? 'Editar Contacto' : 'Nuevo Contacto Comercial'}
                </h3>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-2 italic">Registro de Institución / Empresa</p>
              </div>
              <button onClick={() => { setShowAddModal(false); setEditingLead(null); }} className="p-3 bg-slate-50 rounded-2xl text-slate-300 hover:text-rose-500 transition-all"><X size={24}/></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Institución / Empresa *</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-slate-800 font-bold focus:bg-white focus:border-blue-200 outline-none transition-all italic"
                  value={editingLead ? editingLead.companyName : newLead.companyName}
                  onChange={(e) => editingLead ? setEditingLead({...editingLead, companyName: e.target.value}) : setNewLead({...newLead, companyName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Director / Encargado *</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-slate-800 font-bold focus:bg-white focus:border-blue-200 outline-none transition-all italic"
                  value={editingLead ? editingLead.contactPerson : newLead.contactPerson}
                  onChange={(e) => editingLead ? setEditingLead({...editingLead, contactPerson: e.target.value}) : setNewLead({...newLead, contactPerson: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Teléfono *</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-slate-800 font-bold focus:bg-white focus:border-blue-200 outline-none transition-all italic"
                  value={editingLead ? editingLead.phone : newLead.phone}
                  onChange={(e) => editingLead ? setEditingLead({...editingLead, phone: e.target.value}) : setNewLead({...newLead, phone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Instagram</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-slate-800 font-bold focus:bg-white focus:border-blue-200 outline-none transition-all italic"
                  value={editingLead ? editingLead.instagram : newLead.instagram}
                  onChange={(e) => editingLead ? setEditingLead({...editingLead, instagram: e.target.value}) : setNewLead({...newLead, instagram: e.target.value})}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Dirección</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-slate-800 font-bold focus:bg-white focus:border-blue-200 outline-none transition-all italic"
                  value={editingLead ? editingLead.address : newLead.address}
                  onChange={(e) => editingLead ? setEditingLead({...editingLead, address: e.target.value}) : setNewLead({...newLead, address: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Estado de Contacto</label>
                <select 
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-slate-800 font-bold focus:bg-white focus:border-blue-200 outline-none transition-all italic appearance-none"
                  value={editingLead ? editingLead.status : newLead.status}
                  onChange={(e) => editingLead ? setEditingLead({...editingLead, status: e.target.value as LeadStatus}) : setNewLead({...newLead, status: e.target.value as LeadStatus})}
                >
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Categoría</label>
                <select 
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-slate-800 font-bold focus:bg-white focus:border-blue-200 outline-none transition-all italic appearance-none"
                  value={editingLead ? editingLead.category : newLead.category}
                  onChange={(e) => editingLead ? setEditingLead({...editingLead, category: e.target.value as LeadCategory}) : setNewLead({...newLead, category: e.target.value as LeadCategory})}
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Temperatura</label>
                <select 
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-slate-800 font-bold focus:bg-white focus:border-blue-200 outline-none transition-all italic appearance-none"
                  value={editingLead ? editingLead.temperature : newLead.temperature}
                  onChange={(e) => editingLead ? setEditingLead({...editingLead, temperature: e.target.value as LeadTemperature}) : setNewLead({...newLead, temperature: e.target.value as LeadTemperature})}
                >
                  {temperatures.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Notas / Observaciones</label>
                <textarea 
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-slate-800 font-bold focus:bg-white focus:border-blue-200 outline-none transition-all italic min-h-[100px]"
                  value={editingLead ? editingLead.notes : newLead.notes}
                  onChange={(e) => editingLead ? setEditingLead({...editingLead, notes: e.target.value}) : setNewLead({...newLead, notes: e.target.value})}
                />
              </div>
            </div>

            <button 
              onClick={editingLead ? handleUpdateLead : handleAddLead}
              className="w-full bg-[#000814] text-white py-6 rounded-3xl font-black uppercase text-sm tracking-[0.3em] hover:bg-blue-600 transition-all shadow-2xl flex items-center justify-center gap-4"
            >
              <Save size={20} /> {editingLead ? 'Guardar Cambios' : 'Registrar Contacto'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL DISEÑOS FINALES */}
      {selectedLeadForDesigns && (
        <div className="fixed inset-0 z-[100] bg-[#000814]/90 backdrop-blur-xl flex items-center justify-center p-6 italic">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] p-10 shadow-2xl space-y-8 animate-in zoom-in-95 overflow-y-auto max-h-[90vh] no-scrollbar">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter italic leading-none">Diseños Finales</h3>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-2 italic">{selectedLeadForDesigns.companyName}</p>
              </div>
              <button onClick={() => setSelectedLeadForDesigns(null)} className="p-3 bg-slate-50 rounded-2xl text-slate-300 hover:text-rose-500 transition-all"><X size={24}/></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {orders
                .filter(o => o.customerPhone.replace(/\D/g, '').includes(selectedLeadForDesigns.phone.replace(/\D/g, '')) && o.finalDesignUrl)
                .map(order => (
                  <div key={order.id} className="bg-slate-50 rounded-[2.5rem] p-6 border-4 border-white shadow-inner space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase italic">Orden #{order.orderNumber}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase italic">{new Date(order.issueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="aspect-square w-full rounded-3xl overflow-hidden bg-white border-2 border-slate-100 shadow-sm">
                      <img src={order.finalDesignUrl} className="w-full h-full object-contain" alt={`Diseño Orden ${order.orderNumber}`} />
                    </div>
                    <button 
                      onClick={() => {
                        const msg = `🎨 *ROXTOR: TU DISEÑO ESTÁ LISTO* \n\nHola ${order.customerName.split(' ')[0]}, adjunto el diseño final de tu orden *${order.orderNumber}* para tu revisión.\n\nFavor confirmar si todo está correcto para proceder con la producción.`;
                        window.open(`https://wa.me/${order.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                      }}
                      className="w-full bg-[#000814] text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all"
                    >
                      <MessageCircle size={16} /> Enviar por WhatsApp
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRM;
