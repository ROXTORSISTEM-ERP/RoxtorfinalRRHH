
import React, { useState } from 'react';
import { Agent } from '../types';
import { Key, Save, ShieldCheck, User, Lock, AlertTriangle } from 'lucide-react';

interface Props {
  agent: Agent;
  onUpdateAgent: (updatedAgent: Agent) => void;
}

const Profile: React.FC<Props> = ({ agent, onUpdateAgent }) => {
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleUpdatePin = () => {
    if (newPin.length !== 6 || !/^\d+$/.test(newPin)) {
      setError('El PIN debe tener exactamente 6 dígitos numéricos.');
      return;
    }
    if (newPin !== confirmPin) {
      setError('Los PINs no coinciden.');
      return;
    }

    onUpdateAgent({ ...agent, pin: newPin });
    setShowSuccess(true);
    setError('');
    setNewPin('');
    setConfirmPin('');
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500 p-6">
      <div className="space-y-1">
        <h3 className="text-3xl font-black text-[#000814] uppercase italic tracking-tighter leading-none">MI PERFIL ROXTOR</h3>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 italic flex items-center gap-2">
          <User size={14} className="text-[#004ea1]" /> GESTIÓN DE SEGURIDAD PERSONAL
        </p>
      </div>

      <div className="bg-white border-4 border-slate-50 rounded-[3.5rem] p-10 shadow-2xl space-y-10">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-[#000814] rounded-3xl flex items-center justify-center text-white text-3xl font-black italic shadow-xl rotate-3">
            {agent.name.charAt(0)}
          </div>
          <div>
            <h4 className="text-2xl font-black text-[#000814] uppercase italic leading-none">{agent.name}</h4>
            <p className="text-[10px] font-bold text-blue-600 uppercase italic mt-1">{agent.role}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase italic">{agent.fullName || 'SIN NOMBRE COMPLETO'}</p>
          </div>
        </div>

        <div className="h-px bg-slate-100" />

        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-emerald-500" size={20} />
            <h5 className="text-sm font-black text-[#000814] uppercase italic">Cambiar PIN de Acceso</h5>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase italic">Nuevo PIN (6 Dígitos)</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="password" 
                  maxLength={6}
                  placeholder="••••••"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-6 py-4 font-black text-xl text-[#000814] outline-none focus:border-blue-500 transition-all"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase italic">Confirmar PIN</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="password" 
                  maxLength={6}
                  placeholder="••••••"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-6 py-4 font-black text-xl text-[#000814] outline-none focus:border-blue-500 transition-all"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border-2 border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 animate-in shake-in">
              <AlertTriangle size={18} />
              <p className="text-[10px] font-black uppercase italic">{error}</p>
            </div>
          )}

          {showSuccess && (
            <div className="p-4 bg-emerald-50 border-2 border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600 animate-in zoom-in-95">
              <ShieldCheck size={18} />
              <p className="text-[10px] font-black uppercase italic">¡PIN ACTUALIZADO CORRECTAMENTE!</p>
            </div>
          )}

          <button 
            onClick={handleUpdatePin}
            disabled={newPin.length !== 6 || confirmPin.length !== 6}
            className="w-full bg-[#000814] text-white py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] italic shadow-2xl hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border-b-8 border-slate-800 flex items-center justify-center gap-3"
          >
            <Save size={18} /> ACTUALIZAR MI SEGURIDAD
          </button>
        </div>

        <div className="bg-blue-50 p-6 rounded-3xl border-2 border-blue-100 space-y-2">
          <p className="text-[10px] font-black text-blue-600 uppercase italic flex items-center gap-2">
            <Key size={14}/> Seguridad de Acceso
          </p>
          <p className="text-[9px] text-blue-400 font-bold uppercase leading-relaxed italic">
            Tu PIN es personal e intransferible. Úsalo para acceder al sistema y registrar tus operaciones. 
            Gerencia también puede resetear tu PIN si lo olvidas.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
