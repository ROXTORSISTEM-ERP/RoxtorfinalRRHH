
import React, { useState } from 'react';
import { 
  ShoppingCart as CartIcon, 
  Trash2, 
  Plus, 
  Minus, 
  X, 
  Truck, 
  CreditCard, 
  Camera, 
  MessageCircle,
  MapPin,
  User,
  Hash,
  Phone,
  Send,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { Product, Order } from '../types';

interface Props {
  products: Product[];
  initialCart: { product: Product; quantity: number }[];
  onUpdateCart: React.Dispatch<React.SetStateAction<{ product: Product; quantity: number }[]>>;
  onClose: () => void;
  onCheckout: (orderData: any) => void;
}

const ShoppingCart: React.FC<Props> = ({ products, initialCart, onUpdateCart, onClose, onCheckout }) => {
  const cart = initialCart;
  const setCart = onUpdateCart;
  const [step, setStep] = useState<'cart' | 'form' | 'success'>('cart');
  const [formData, setFormData] = useState({
    name: '',
    id: '',
    phone: '',
    address: '',
    shippingType: 'regional' as 'regional' | 'nacional',
    shippingCarrier: 'ZOOM' as 'ZOOM' | 'TEALCA',
    customDesignRequest: '',
    paymentCapture: null as string | null,
  });

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.product.priceRetail * item.quantity), 0);
  const shippingCost = formData.shippingType === 'regional' ? 5 : 0; // Nacional por cobrar
  const total = subtotal + shippingCost;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, paymentCapture: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.id || !formData.phone || !formData.address) {
      alert("Por favor completa todos los campos obligatorios.");
      return;
    }
    
    const orderData = {
      customerName: formData.name,
      customerId: formData.id,
      customerPhone: formData.phone,
      address: formData.address,
      items: cart.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.priceRetail
      })),
      total: total,
      shippingType: formData.shippingType,
      shippingCarrier: formData.shippingCarrier,
      customDesign: formData.customDesignRequest,
      status: 'WEB-PENDIENTE'
    };

    onCheckout(orderData);
    setStep('success');
  };

  return (
    <div className="fixed inset-0 bg-[#000814]/80 backdrop-blur-md z-[200] flex justify-end italic">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#000814] text-white rounded-2xl flex items-center justify-center shadow-lg">
              <CartIcon size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-800">Carrito de Compras</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ROXTOR Web Checkout</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-xl transition-all text-slate-400"><X size={24}/></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
          {step === 'cart' && (
            <div className="space-y-8">
              {cart.length === 0 ? (
                <div className="text-center py-20 space-y-6">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                    <CartIcon size={48} />
                  </div>
                  <p className="text-slate-400 font-bold uppercase italic tracking-widest">Tu carrito está vacío</p>
                  <button onClick={onClose} className="bg-[#000814] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Explorar Catálogo</button>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex gap-6 bg-slate-50 p-6 rounded-[2rem] border-2 border-transparent hover:border-slate-100 transition-all group">
                        <div className="w-24 h-24 bg-white rounded-2xl overflow-hidden shadow-sm flex-shrink-0">
                          <img 
                            src={item.product.imageUrl || "https://picsum.photos/seed/product/200/200"} 
                            className="w-full h-full object-cover" 
                            alt={item.product.name}
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between">
                            <h4 className="font-black uppercase italic text-slate-800">{item.product.name}</h4>
                            <button onClick={() => removeFromCart(item.product.id)} className="text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={16}/></button>
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.product.category}</p>
                          <div className="flex justify-between items-end pt-2">
                            <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
                              <button onClick={() => updateQuantity(item.product.id, -1)} className="text-slate-400 hover:text-[#000814]"><Minus size={14}/></button>
                              <span className="text-xs font-black">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.product.id, 1)} className="text-slate-400 hover:text-[#000814]"><Plus size={14}/></button>
                            </div>
                            <span className="text-lg font-black italic text-[#000814]">${(item.product.priceRetail * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-50 p-8 rounded-[3rem] space-y-4">
                    <div className="flex justify-between text-slate-400 text-[10px] font-black uppercase tracking-widest">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-800 text-xl font-black uppercase italic tracking-tighter border-t border-slate-200 pt-4">
                      <span>Total Estimado</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-center">Envío se calcula en el siguiente paso</p>
                  </div>

                  <button 
                    onClick={() => setStep('form')}
                    className="w-full bg-[#000814] text-white py-6 rounded-[2rem] font-black uppercase italic tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                  >
                    Continuar al Pago <ArrowRight size={20} />
                  </button>
                </>
              )}
            </div>
          )}

          {step === 'form' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-6">
                <h3 className="text-xl font-black uppercase italic text-slate-800 border-b-4 border-slate-100 pb-4">Datos de Envío y Contacto</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 italic ml-2 flex items-center gap-2"><User size={12}/> Nombre Completo</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-black uppercase text-xs outline-none focus:border-blue-500 transition-all"
                      placeholder="Ej: Juan Pérez"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 italic ml-2 flex items-center gap-2"><Hash size={12}/> Cédula / ID</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-black uppercase text-xs outline-none focus:border-blue-500 transition-all"
                      placeholder="Ej: V-12345678"
                      value={formData.id}
                      onChange={(e) => setFormData({...formData, id: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 italic ml-2 flex items-center gap-2"><Phone size={12}/> Teléfono WhatsApp</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-black uppercase text-xs outline-none focus:border-blue-500 transition-all"
                      placeholder="Ej: 0424 1234567"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 italic ml-2 flex items-center gap-2"><MapPin size={12}/> Dirección Exacta</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-black uppercase text-xs outline-none focus:border-blue-500 transition-all"
                      placeholder="Ej: Urb. Los Olivos, Calle 5..."
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-slate-400 italic ml-2">Método de Envío</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setFormData({...formData, shippingType: 'regional'})}
                      className={`p-6 rounded-[2rem] border-2 transition-all text-left ${formData.shippingType === 'regional' ? 'bg-blue-50 border-blue-500' : 'bg-slate-50 border-slate-100'}`}
                    >
                      <Truck size={24} className={formData.shippingType === 'regional' ? 'text-blue-600' : 'text-slate-300'} />
                      <p className="mt-4 font-black uppercase italic text-xs">Regional (PZO/San Félix)</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Costo: $5.00</p>
                    </button>
                    <button 
                      onClick={() => setFormData({...formData, shippingType: 'nacional'})}
                      className={`p-6 rounded-[2rem] border-2 transition-all text-left ${formData.shippingType === 'nacional' ? 'bg-blue-50 border-blue-500' : 'bg-slate-50 border-slate-100'}`}
                    >
                      <Truck size={24} className={formData.shippingType === 'nacional' ? 'text-blue-600' : 'text-slate-300'} />
                      <p className="mt-4 font-black uppercase italic text-xs">Nacional (ZOOM/TEALCA)</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cobro en Destino</p>
                    </button>
                  </div>
                </div>

                {formData.shippingType === 'nacional' && (
                  <div className="flex bg-slate-100 p-2 rounded-2xl">
                    <button 
                      onClick={() => setFormData({...formData, shippingCarrier: 'ZOOM'})}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase italic transition-all ${formData.shippingCarrier === 'ZOOM' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}
                    >
                      ZOOM
                    </button>
                    <button 
                      onClick={() => setFormData({...formData, shippingCarrier: 'TEALCA'})}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase italic transition-all ${formData.shippingCarrier === 'TEALCA' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}
                    >
                      TEALCA
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 italic ml-2 flex items-center gap-2"><MessageCircle size={12}/> Requerimientos de Diseño / Personalización</label>
                  <textarea 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-black uppercase text-xs outline-none focus:border-blue-500 transition-all min-h-[100px]"
                    placeholder="Ej: Quiero que lleve el logo de mi empresa en el pecho y el nombre de cada empleado en la espalda..."
                    value={formData.customDesignRequest}
                    onChange={(e) => setFormData({...formData, customDesignRequest: e.target.value})}
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-slate-400 italic ml-2 flex items-center gap-2"><Camera size={12}/> Cargar Referencia / Capture de Pago</label>
                  <div className="relative group">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-10 flex flex-col items-center justify-center gap-4 group-hover:bg-slate-100 transition-all">
                      {formData.paymentCapture ? (
                        <img src={formData.paymentCapture} className="w-32 h-32 object-cover rounded-2xl shadow-lg" alt="Capture" />
                      ) : (
                        <>
                          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 shadow-sm">
                            <Plus size={32} />
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Click para subir foto</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#000814] p-10 rounded-[3rem] text-white space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subtotal</span>
                  <span className="text-xl font-black italic">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Envío ({formData.shippingType})</span>
                  <span className="text-xl font-black italic">${shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-6 border-t border-white/10">
                  <span className="text-sm font-black uppercase italic tracking-tighter text-rose-500">Total Final</span>
                  <span className="text-5xl font-black italic tracking-tighter">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setStep('cart')}
                  className="flex-1 py-6 rounded-[2rem] border-4 border-slate-50 text-slate-400 font-black uppercase italic text-xs tracking-widest hover:text-[#000814] transition-all"
                >
                  Volver al Carrito
                </button>
                <button 
                  onClick={handleSubmit}
                  className="flex-[2] bg-rose-600 text-white py-6 rounded-[2rem] font-black uppercase italic tracking-[0.2em] shadow-xl hover:bg-rose-500 transition-all flex items-center justify-center gap-3"
                >
                  Confirmar Pedido <Send size={20} />
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-20 space-y-8 animate-in zoom-in-95 duration-500">
              <div className="w-32 h-32 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={64} />
              </div>
              <div className="space-y-4">
                <h3 className="text-4xl font-black uppercase italic text-slate-800 tracking-tighter">¡Pedido Recibido!</h3>
                <p className="text-slate-500 font-medium italic max-w-md mx-auto">
                  Gracias por confiar en ROXTOR. Tu solicitud ha sido enviada a nuestro equipo de ventas. Un agente se contactará contigo vía WhatsApp en los próximos minutos para validar los detalles y el pago.
                </p>
              </div>
              <div className="bg-slate-50 p-8 rounded-[3rem] border-2 border-slate-100 flex items-center gap-6 max-w-md mx-auto">
                <div className="w-16 h-16 bg-[#000814] text-white rounded-2xl flex items-center justify-center shadow-xl">
                  <MessageCircle size={32} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black uppercase italic text-[#000814]">Soporte Roxtor</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">+58 424 9635252</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="bg-[#000814] text-white px-12 py-6 rounded-[2rem] font-black uppercase italic tracking-[0.2em] shadow-xl"
              >
                Cerrar y Volver
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShoppingCart;
