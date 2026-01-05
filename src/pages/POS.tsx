import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { POSSession, ProductTemplate } from '../types/database';
import { DollarSign, CreditCard, Smartphone, Banknote, Clock, CheckCircle, Search, X, Plus, Minus, ShoppingBag, Grid3x3, Package } from 'lucide-react';

interface CartItem {
  id: string;
  product_id?: string;
  name: string;
  price: number;
  quantity: number;
}

export function POS() {
  const { currentBranch, user } = useAuth();
  const [activeSession, setActiveSession] = useState<POSSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOpenSession, setShowOpenSession] = useState(false);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<ProductTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (currentBranch && user) {
      loadActiveSession();
      loadProducts();
    }
  }, [currentBranch, user]);

  const loadActiveSession = async () => {
    if (!currentBranch || !user) return;

    try {
      const { data, error } = await supabase
        .from('pos_sessions')
        .select('*')
        .eq('branch_id', currentBranch.id)
        .eq('user_id', user.id)
        .eq('status', 'open')
        .order('opened_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setActiveSession(data);
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    if (!currentBranch) return;

    try {
      const { data: branch } = await supabase
        .from('branches')
        .select('company_id')
        .eq('id', currentBranch.id)
        .single();

      if (!branch) return;

      const { data, error } = await supabase
        .from('product_templates')
        .select('*')
        .eq('company_id', branch.company_id)
        .eq('active', true)
        .order('name');

      if (error) throw error;

      setProducts(data || []);

      const uniqueCategories = Array.from(new Set(data?.map(p => p.category).filter(Boolean) || []));
      setCategories(uniqueCategories as string[]);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleOpenSession = async () => {
    if (!currentBranch || !user) return;

    try {
      const sessionNumber = `POS-${Date.now().toString().slice(-8)}`;

      const { data, error } = await supabase
        .from('pos_sessions')
        .insert({
          branch_id: currentBranch.id,
          session_number: sessionNumber,
          user_id: user.id,
          opening_balance: openingBalance
        })
        .select()
        .single();

      if (error) throw error;
      setActiveSession(data);
      setShowOpenSession(false);
      setOpeningBalance(0);
    } catch (error) {
      console.error('Error opening session:', error);
    }
  };

  const handleCloseSession = async () => {
    if (!activeSession) return;

    const cashCounted = prompt('Enter cash counted:');
    if (!cashCounted) return;

    try {
      const variance = Number(cashCounted) - activeSession.opening_balance;

      const { error } = await supabase
        .from('pos_sessions')
        .update({
          closed_at: new Date().toISOString(),
          cash_counted: Number(cashCounted),
          variance: variance,
          status: 'closed'
        })
        .eq('id', activeSession.id);

      if (error) throw error;
      setActiveSession(null);
    } catch (error) {
      console.error('Error closing session:', error);
    }
  };

  const addToCart = (product: ProductTemplate, price: number = 50000) => {
    const existingItem = cart.find(item => item.product_id === product.id);

    if (existingItem) {
      setCart(cart.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        id: `${product.id}-${Date.now()}`,
        product_id: product.id,
        name: product.name,
        price: price,
        quantity: 1
      }]);
    }
  };

  const updateQuantity = (itemId: string, change: number) => {
    setCart(cart.map(item => {
      if (item.id === itemId) {
        const newQty = Math.max(1, item.quantity + change);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const handlePayment = async (paymentMethod: string) => {
    if (!currentBranch || !user || !activeSession || cart.length === 0) return;

    try {
      const { data: branch } = await supabase
        .from('branches')
        .select('company_id')
        .eq('id', currentBranch.id)
        .single();

      if (!branch) return;

      const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const orderNumber = `POS-${Date.now().toString().slice(-8)}`;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          company_id: branch.company_id,
          branch_id: currentBranch.id,
          order_number: orderNumber,
          order_type: 'sales_order',
          status: 'paid',
          customer_name: 'Walk-in Customer',
          order_date: new Date().toISOString().split('T')[0],
          subtotal: totalAmount,
          total_amount: totalAmount,
          user_id: user.id
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const paymentNumber = `PAY-${Date.now().toString().slice(-8)}`;

      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          company_id: branch.company_id,
          branch_id: currentBranch.id,
          payment_number: paymentNumber,
          order_id: order.id,
          pos_session_id: activeSession.id,
          payment_method: paymentMethod,
          amount: totalAmount,
          user_id: user.id
        });

      if (paymentError) throw paymentError;

      alert(`Payment successful! Order #${orderNumber}`);
      setCart([]);
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Payment failed. Please try again.');
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const paymentMethods = [
    { id: 'cash', label: 'Cash', icon: Banknote, color: 'from-emerald-600 to-emerald-700' },
    { id: 'card', label: 'Card', icon: CreditCard, color: 'from-blue-600 to-blue-700' },
    { id: 'transfer', label: 'Transfer', icon: DollarSign, color: 'from-violet-600 to-violet-700' },
    { id: 'qris', label: 'QRIS', icon: Smartphone, color: 'from-amber-600 to-amber-700' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!activeSession) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Point of Sale</h1>
          <p className="text-slate-600 mt-1">Start a cashier session to begin</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">No Active Session</h2>
            <p className="text-slate-600 mb-8">You need to open a cashier session before you can process sales</p>
            <button
              onClick={() => setShowOpenSession(true)}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all"
            >
              Open Cashier Session
            </button>
          </div>
        </div>

        {showOpenSession && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">Open Cashier Session</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Opening Cash Balance</label>
                  <input
                    type="number"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    placeholder="0"
                  />
                  <p className="text-sm text-slate-500 mt-2">Enter the amount of cash in the register at the start of your shift</p>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowOpenSession(false)}
                    className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleOpenSession}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all"
                  >
                    Open Session
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Point of Sale</h1>
          <p className="text-slate-600 mt-1">Session: {activeSession.session_number}</p>
        </div>
        <button
          onClick={handleCloseSession}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          Close Session
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All Products
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Grid3x3 className="w-5 h-5 text-slate-700" />
              <h2 className="text-lg font-bold text-slate-900">Products</h2>
              <span className="ml-auto text-sm text-slate-600">{filteredProducts.length} items</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No products found</p>
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 hover:from-blue-50 hover:to-blue-100 border border-slate-200 rounded-xl text-left transition-all group hover:shadow-md"
                  >
                    {product.image_url ? (
                      <div className="w-full h-24 mb-3 rounded-lg overflow-hidden bg-slate-200">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-24 mb-3 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                        <Package className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
                    <p className="font-medium text-slate-900 group-hover:text-blue-900 truncate">{product.name}</p>
                    <p className="text-xs text-slate-500 mb-2">{product.code}</p>
                    <p className="text-sm font-bold text-slate-700 group-hover:text-blue-700">
                      Rp 50,000
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-slate-700" />
                <h2 className="text-lg font-bold text-slate-900">Cart</h2>
              </div>
              {cart.length > 0 && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                </span>
              )}
            </div>
            <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 text-sm truncate">{item.name}</p>
                      <p className="text-xs text-slate-600">Rp {item.price.toLocaleString('id-ID')} each</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-7 h-7 flex items-center justify-center bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-10 text-center font-medium text-slate-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-7 h-7 flex items-center justify-center bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-sm font-bold text-slate-900">
                      Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                <div className="text-center py-12">
                  <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No items in cart</p>
                  <p className="text-sm text-slate-400 mt-1">Add products to get started</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-200 space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                  <span>Subtotal:</span>
                  <span>Rp {cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-slate-900">Total:</span>
                  <span className="text-2xl font-bold text-slate-900">
                    Rp {cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => handlePayment(method.id)}
                    disabled={cart.length === 0}
                    className={`w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r ${method.color} text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <method.icon className="w-5 h-5" />
                    <span className="font-medium">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-medium text-emerald-900">Session Active</p>
                <p className="text-sm text-emerald-700">Started {new Date(activeSession.opened_at).toLocaleTimeString('id-ID')}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-emerald-700">Opening Balance:</span>
                <span className="font-medium text-emerald-900">Rp {activeSession.opening_balance.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
