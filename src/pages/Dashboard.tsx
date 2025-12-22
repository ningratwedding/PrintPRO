import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Factory,
  AlertTriangle,
  Package
} from 'lucide-react';

interface DashboardStats {
  todaySales: number;
  todayOrders: number;
  activeWorkOrders: number;
  lowStockItems: number;
  pendingQuotations: number;
  monthRevenue: number;
  salesTrend: number;
}

export function Dashboard() {
  const { currentBranch } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    todayOrders: 0,
    activeWorkOrders: 0,
    lowStockItems: 0,
    pendingQuotations: 0,
    monthRevenue: 0,
    salesTrend: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentBranch) {
      loadDashboardStats();
    }
  }, [currentBranch]);

  const loadDashboardStats = async () => {
    if (!currentBranch) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

      const [ordersToday, ordersMonth, workOrders, materials, quotations] = await Promise.all([
        supabase
          .from('orders')
          .select('total_amount')
          .eq('branch_id', currentBranch.id)
          .gte('order_date', today),
        supabase
          .from('orders')
          .select('total_amount')
          .eq('branch_id', currentBranch.id)
          .gte('order_date', firstDayOfMonth),
        supabase
          .from('work_orders')
          .select('id')
          .eq('branch_id', currentBranch.id)
          .eq('status', 'in_progress'),
        supabase
          .from('inventory_lots')
          .select('material_id, quantity_available, materials!inner(min_stock)')
          .eq('branch_id', currentBranch.id),
        supabase
          .from('orders')
          .select('id')
          .eq('branch_id', currentBranch.id)
          .eq('order_type', 'quotation')
          .eq('status', 'draft')
      ]);

      const todaySales = ordersToday.data?.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0;
      const monthRevenue = ordersMonth.data?.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0;

      const lowStock = materials.data?.filter((item: any) => {
        return item.quantity_available < item.materials.min_stock;
      }).length || 0;

      setStats({
        todaySales,
        todayOrders: ordersToday.data?.length || 0,
        activeWorkOrders: workOrders.data?.length || 0,
        lowStockItems: lowStock,
        pendingQuotations: quotations.data?.length || 0,
        monthRevenue,
        salesTrend: 12.5
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Today's Sales",
      value: `Rp ${stats.todaySales.toLocaleString('id-ID')}`,
      icon: DollarSign,
      color: 'from-blue-500 to-blue-600',
      trend: stats.salesTrend,
      trendUp: true
    },
    {
      title: "Today's Orders",
      value: stats.todayOrders,
      icon: ShoppingCart,
      color: 'from-emerald-500 to-emerald-600',
      badge: `${stats.pendingQuotations} quotes`
    },
    {
      title: 'Active Production',
      value: stats.activeWorkOrders,
      icon: Factory,
      color: 'from-amber-500 to-amber-600'
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockItems,
      icon: AlertTriangle,
      color: 'from-red-500 to-red-600',
      alert: stats.lowStockItems > 0
    },
    {
      title: 'Month Revenue',
      value: `Rp ${stats.monthRevenue.toLocaleString('id-ID')}`,
      icon: Package,
      color: 'from-violet-500 to-violet-600'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">Welcome back! Here's your overview</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 group"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
                {card.trend !== undefined && (
                  <div className={`flex items-center gap-1 text-sm font-medium ${card.trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
                    {card.trendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {card.trend}%
                  </div>
                )}
                {card.alert && (
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                )}
              </div>
              <div>
                <p className="text-slate-600 text-sm font-medium mb-1">{card.title}</p>
                <p className="text-2xl font-bold text-slate-900">{card.value}</p>
                {card.badge && (
                  <p className="text-xs text-slate-500 mt-2">{card.badge}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Orders</h2>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div>
                  <p className="font-medium text-slate-900">Order #{1000 + i}</p>
                  <p className="text-sm text-slate-600">Customer Name {i}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-slate-900">Rp {(1500000 * i).toLocaleString('id-ID')}</p>
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                    Confirmed
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Production Status</h2>
          <div className="space-y-4">
            {[
              { name: 'Banner 3x2m', progress: 75, status: 'Printing' },
              { name: 'Stiker 1000pcs', progress: 45, status: 'Laminating' },
              { name: 'Brosur A4', progress: 90, status: 'QC' }
            ].map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-600">{item.status}</p>
                  </div>
                  <span className="text-sm font-medium text-slate-900">{item.progress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-blue-700 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${item.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
