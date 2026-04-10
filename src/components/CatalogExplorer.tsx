
import React from 'react';
import { X, Zap, Maximize2, Search, Info, ShoppingCart as CartIcon } from 'lucide-react';
import { Product } from '../types';

interface Props {
  products: Product[];
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  onConsult: (product: Product) => void;
}

const CatalogExplorer: React.FC<Props> = ({ products, onClose, onAddToCart, onConsult }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filter, setFilter] = React.useState('todos');

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'todos' || p.category.toLowerCase() === filter.toLowerCase();
    return matchesSearch && matchesFilter && p.stock > 0;
  });

  const categories = ['todos', ...new Set(products.map(p => p.category.toLowerCase()))];

  const getSurcharge = (productName: string) => {
    const name = productName.toLowerCase();
    if (name.includes('jersey') || name.includes('chaqueta')) return '+$2 por cada "X" adicional (XL+)';
    if (name.includes('camisa')) return '+$3 por cada "X" adicional (XL+)';
    return '+$1 por cada "X" adicional (XL+)';
  };

  return (
    <div className="fixed inset-0 bg-[#000814]/95 backdrop-blur-xl z-[250] flex flex-col italic">
      <div className="max-w-7xl mx-auto w-full h-full flex flex-col p-6 md:p-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div className="space-y-2">
            <h2 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none">
              Explorar <span className="text-rose-500">Catálogo</span>
            </h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.5em]">Trazabilidad & Precios Oficiales</p>
          </div>
          <button 
            onClick={onClose}
            className="w-16 h-16 bg-white/10 hover:bg-rose-600 text-white rounded-full flex items-center justify-center transition-all border border-white/10"
          >
            <X size={32} />
          </button>
        </div>

        {/* Filters & Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input 
              type="text" 
              placeholder="BUSCAR PRODUCTO O CATEGORÍA..."
              className="w-full bg-white/5 border-2 border-white/10 rounded-[2rem] pl-16 pr-8 py-6 text-white font-black uppercase italic outline-none focus:border-rose-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="bg-white/5 border-2 border-white/10 rounded-[2rem] px-8 py-6 text-white font-black uppercase italic outline-none focus:border-rose-500 transition-all"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat} value={cat} className="bg-[#000814]">{cat.toUpperCase()}</option>
            ))}
          </select>
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto pr-4 no-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden group hover:bg-white/10 transition-all">
                <div className="aspect-video overflow-hidden relative">
                  <img 
                    src={product.imageUrl || `https://picsum.photos/seed/${product.name}/800/600`} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700"
                    alt={product.name}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#000814] to-transparent opacity-60" />
                  <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                    <div>
                      <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">{product.name}</h4>
                      <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-2">{product.category}</p>
                    </div>
                  </div>
                </div>

                <div className="p-8 space-y-8">
                  {/* Prices */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center">
                      <p className="text-[9px] font-black text-slate-500 uppercase italic mb-1">Precio Detal</p>
                      <p className="text-2xl font-black text-white italic">${product.priceRetail.toFixed(2)}</p>
                    </div>
                    <div className="bg-rose-500/10 p-4 rounded-2xl border border-rose-500/20 text-center">
                      <p className="text-[9px] font-black text-rose-400 uppercase italic mb-1">Precio Mayor (+12)</p>
                      <p className="text-2xl font-black text-rose-500 italic">${product.priceWholesale.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Surcharges */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Maximize2 size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-white uppercase italic">Recargos por Talla</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase italic mt-1">{getSurcharge(product.name)}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="w-10 h-10 bg-rose-500/20 text-rose-400 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Zap size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-white uppercase italic">Servicio Express</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase italic mt-1">Desde +$1 (Sujeto a disponibilidad de taller)</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => onAddToCart(product)}
                      className="bg-rose-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 transition-all flex items-center justify-center gap-3"
                    >
                      <CartIcon size={18} /> Carrito
                    </button>
                    <button 
                      onClick={() => onConsult(product)}
                      className="bg-white text-[#000814] py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-3"
                    >
                      Radar AI <Zap size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">
            Roxtor PZO: Soluciones Creativas Inteligentes • Ciudad Guayana, Venezuela
          </p>
        </div>
      </div>
    </div>
  );
};

export default CatalogExplorer;
