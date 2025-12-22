import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { POSSession } from '../types/database';
import { DollarSign, CreditCard, Smartphone, Banknote, Clock, CheckCircle } from 'lucide-react';

export function POS() {
  const { currentBranch, user } = useAuth();
  const [activeSession, setActiveSession] = useState<POSSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOpenSession, setShowOpenSession] = useState(false);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [cart, setCart] = useState<any[]>([]);

  useEffect(() => {
    if (currentBranch && user) {
      loadActiveSession();
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
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Close Session
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Items</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { name: 'Banner 3x2m', price: 150000 },
                { name: 'Stiker A4', price: 5000 },
                { name: 'Brosur A4', price: 2500 },
                { name: 'Kartu Nama', price: 50000 },
                { name: 'Undangan', price: 3000 },
                { name: 'X-Banner', price: 85000 }
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => setCart([...cart, { ...item, id: Date.now() + i }])}
                  className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 hover:from-blue-50 hover:to-blue-100 border border-slate-200 rounded-xl text-left transition-all group"
                >
                  <p className="font-medium text-slate-900 group-hover:text-blue-900">{item.name}</p>
                  <p className="text-sm text-slate-600 group-hover:text-blue-600 mt-1">
                    Rp {item.price.toLocaleString('id-ID')}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Cart</h2>
            </div>
            <div className="p-6 space-y-3 max-h-64 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{item.name}</p>
                    <p className="text-xs text-slate-600">Rp {item.price.toLocaleString('id-ID')}</p>
                  </div>
                  <button
                    onClick={() => setCart(cart.filter(c => c.id !== item.id))}
                    className="text-red-600 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
              {cart.length === 0 && (
                <p className="text-center text-slate-500 py-8">No items in cart</p>
              )}
            </div>
            <div className="p-6 border-t border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-bold text-slate-900">Total</span>
                <span className="text-2xl font-bold text-slate-900">
                  Rp {cart.reduce((sum, item) => sum + item.price, 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="space-y-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
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
