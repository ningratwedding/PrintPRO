import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { TrendingUp, DollarSign, Package, Factory, BarChart3, Calendar } from 'lucide-react';

export function Reports() {
  const { currentBranch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProfit: 0,
    profitMargin: 0,
    topProducts: [] as any[],
    revenueByType: [] as any[]
  });

  useEffect(() => {
    if (currentBranch) {
      loadReportData();
    }
  }, [currentBranch, dateRange]);

  const loadReportData = async () => {
    if (!currentBranch) return;

    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('branch_id', currentBranch.id)
        .gte('order_date', dateRange.start)
        .lte('order_date', dateRange.end);

      if (error) throw error;

      const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
      const totalOrders = orders?.length || 0;

      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_name, quantity, line_total, hpp_total')
        .in('order_id', orders?.map(o => o.id) || []);

      const totalHPP = orderItems?.reduce((sum, item) => sum + Number(item.hpp_total), 0) || 0;
      const totalProfit = totalRevenue - totalHPP;
      const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

      const productSales: Record<string, { qty: number; revenue: number }> = {};
      orderItems?.forEach(item => {
        if (!productSales[item.product_name]) {
          productSales[item.product_name] = { qty: 0, revenue: 0 };
        }
        productSales[item.product_name].qty += Number(item.quantity);
        productSales[item.product_name].revenue += Number(item.line_total);
      });

      const topProducts = Object.entries(productSales)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      const revenueByType = [
        { type: 'Quotation', count: orders?.filter(o => o.order_type === 'quotation').length || 0 },
        { type: 'Sales Order', count: orders?.filter(o => o.order_type === 'sales_order').length || 0 }
      ];

      setReportData({
        totalRevenue,
        totalOrders,
        totalProfit,
        profitMargin,
        topProducts,
        revenueByType
      });
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-slate-600 mt-1">Business insights and performance metrics</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">Date Range:</span>
          </div>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <span className="text-slate-500">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: 'Total Revenue',
            value: `Rp ${reportData.totalRevenue.toLocaleString('id-ID')}`,
            icon: DollarSign,
            color: 'from-blue-600 to-blue-700'
          },
          {
            label: 'Total Orders',
            value: reportData.totalOrders,
            icon: Package,
            color: 'from-emerald-600 to-emerald-700'
          },
          {
            label: 'Gross Profit',
            value: `Rp ${reportData.totalProfit.toLocaleString('id-ID')}`,
            icon: TrendingUp,
            color: 'from-violet-600 to-violet-700'
          },
          {
            label: 'Profit Margin',
            value: `${reportData.profitMargin.toFixed(1)}%`,
            icon: BarChart3,
            color: 'from-amber-600 to-amber-700'
          }
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">Top Products by Revenue</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {reportData.topProducts.map((product, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">{i + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{product.name}</p>
                        <p className="text-sm text-slate-600">{product.qty.toFixed(0)} units</p>
                      </div>
                    </div>
                    <p className="font-medium text-slate-900">
                      Rp {product.revenue.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-blue-700 h-2 rounded-full"
                      style={{
                        width: `${(product.revenue / reportData.topProducts[0]?.revenue) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              ))}
              {reportData.topProducts.length === 0 && (
                <p className="text-center text-slate-500 py-8">No product data available</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">Order Type Distribution</h2>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {reportData.revenueByType.map((item, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded ${
                        item.type === 'Quotation' ? 'bg-amber-500' : 'bg-blue-500'
                      }`}></div>
                      <span className="font-medium text-slate-900">{item.type}</span>
                    </div>
                    <span className="text-2xl font-bold text-slate-900">{item.count}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        item.type === 'Quotation'
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                          : 'bg-gradient-to-r from-blue-500 to-blue-600'
                      }`}
                      style={{
                        width: `${(item.count / reportData.totalOrders) * 100}%`
                      }}
                    ></div>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">
                    {((item.count / reportData.totalOrders) * 100).toFixed(1)}% of total orders
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
