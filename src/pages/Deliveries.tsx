import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, Search, Truck, MapPin, CheckCircle, Clock, Package, Calendar } from 'lucide-react';

interface Delivery {
  id: string;
  company_id: string;
  branch_id: string;
  delivery_number: string;
  order_id: string;
  customer_name: string | null;
  delivery_address: string | null;
  delivery_date: string;
  scheduled_time: string | null;
  driver_name: string | null;
  vehicle_number: string | null;
  status: string;
  notes: string | null;
  proof_photo_url: string | null;
  receiver_name: string | null;
  received_at: string | null;
  created_at: string;
}

export function Deliveries() {
  const { currentBranch } = useAuth();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    order_id: '',
    customer_name: '',
    delivery_address: '',
    delivery_date: new Date().toISOString().split('T')[0],
    scheduled_time: '',
    driver_name: '',
    vehicle_number: '',
    notes: ''
  });

  useEffect(() => {
    if (currentBranch) {
      loadDeliveries();
      loadOrders();
    }
  }, [currentBranch, filterStatus]);

  const loadDeliveries = async () => {
    if (!currentBranch) return;

    try {
      let query = supabase
        .from('deliveries')
        .select('*')
        .eq('branch_id', currentBranch.id)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      setDeliveries(data || []);
    } catch (error) {
      console.error('Error loading deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    if (!currentBranch) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, status')
        .eq('branch_id', currentBranch.id)
        .in('status', ['confirmed', 'production'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBranch) return;

    try {
      const { data: branch } = await supabase
        .from('branches')
        .select('company_id')
        .eq('id', currentBranch.id)
        .single();

      if (!branch) return;

      const deliveryNumber = `DEL-${Date.now().toString().slice(-8)}`;

      const { error } = await supabase
        .from('deliveries')
        .insert({
          company_id: branch.company_id,
          branch_id: currentBranch.id,
          delivery_number: deliveryNumber,
          order_id: formData.order_id,
          customer_name: formData.customer_name,
          delivery_address: formData.delivery_address,
          delivery_date: formData.delivery_date,
          scheduled_time: formData.scheduled_time || null,
          driver_name: formData.driver_name || null,
          vehicle_number: formData.vehicle_number || null,
          notes: formData.notes || null,
          status: 'scheduled'
        });

      if (error) throw error;

      setShowCreateModal(false);
      setFormData({
        order_id: '',
        customer_name: '',
        delivery_address: '',
        delivery_date: new Date().toISOString().split('T')[0],
        scheduled_time: '',
        driver_name: '',
        vehicle_number: '',
        notes: ''
      });
      loadDeliveries();
    } catch (error) {
      console.error('Error creating delivery:', error);
      alert('Failed to create delivery');
    }
  };

  const handleUpdateStatus = async (deliveryId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };

      if (newStatus === 'delivered') {
        updateData.received_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('deliveries')
        .update(updateData)
        .eq('id', deliveryId);

      if (error) throw error;
      loadDeliveries();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleOrderSelect = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setFormData({
        ...formData,
        order_id: orderId,
        customer_name: order.customer_name || ''
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'in_transit': return 'bg-amber-100 text-amber-700';
      case 'delivered': return 'bg-emerald-100 text-emerald-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return Clock;
      case 'in_transit': return Truck;
      case 'delivered': return CheckCircle;
      default: return Package;
    }
  };

  const filteredDeliveries = deliveries.filter(d =>
    d.delivery_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.driver_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold text-slate-900">Deliveries & Shipping</h1>
          <p className="text-slate-600 mt-1">Manage deliveries and track shipments</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="w-5 h-5" />
          Schedule Delivery
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Scheduled', value: deliveries.filter(d => d.status === 'scheduled').length, color: 'from-blue-500 to-blue-600', icon: Clock },
          { label: 'In Transit', value: deliveries.filter(d => d.status === 'in_transit').length, color: 'from-amber-500 to-amber-600', icon: Truck },
          { label: 'Delivered', value: deliveries.filter(d => d.status === 'delivered').length, color: 'from-emerald-500 to-emerald-600', icon: CheckCircle },
          { label: 'Total', value: deliveries.length, color: 'from-slate-500 to-slate-600', icon: Package }
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search deliveries..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'scheduled', 'in_transit', 'delivered', 'cancelled'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-200">
          {filteredDeliveries.map((delivery) => {
            const StatusIcon = getStatusIcon(delivery.status);
            return (
              <div key={delivery.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
                      <Truck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-mono font-medium text-slate-900">{delivery.delivery_number}</p>
                      <p className="text-sm text-slate-600 mt-1">{delivery.customer_name || 'No customer name'}</p>
                      {delivery.delivery_address && (
                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {delivery.delivery_address}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(delivery.delivery_date).toLocaleDateString('id-ID')}
                        </span>
                        {delivery.driver_name && (
                          <span>Driver: {delivery.driver_name}</span>
                        )}
                        {delivery.vehicle_number && (
                          <span>Vehicle: {delivery.vehicle_number}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(delivery.status)}`}>
                      <StatusIcon className="w-3 h-3" />
                      {delivery.status}
                    </span>
                    {delivery.status === 'scheduled' && (
                      <button
                        onClick={() => handleUpdateStatus(delivery.id, 'in_transit')}
                        className="px-3 py-1 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 transition-colors"
                      >
                        Start Delivery
                      </button>
                    )}
                    {delivery.status === 'in_transit' && (
                      <button
                        onClick={() => handleUpdateStatus(delivery.id, 'delivered')}
                        className="px-3 py-1 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        Mark Delivered
                      </button>
                    )}
                  </div>
                </div>
                {delivery.notes && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-700">{delivery.notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredDeliveries.length === 0 && (
          <div className="text-center py-12">
            <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">No deliveries found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700"
            >
              Schedule your first delivery
            </button>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Schedule New Delivery</h2>
              <p className="text-sm text-slate-600 mt-1">Create a delivery schedule for an order</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Order</label>
                <select
                  value={formData.order_id}
                  onChange={(e) => handleOrderSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose an order...</option>
                  {orders.map(order => (
                    <option key={order.id} value={order.id}>
                      {order.order_number} - {order.customer_name || 'Walk-in'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Customer Name</label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Delivery Address</label>
                <textarea
                  value={formData.delivery_address}
                  onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Delivery Date</label>
                  <input
                    type="date"
                    value={formData.delivery_date}
                    onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Scheduled Time</label>
                  <input
                    type="time"
                    value={formData.scheduled_time}
                    onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Driver Name</label>
                  <input
                    type="text"
                    value={formData.driver_name}
                    onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Vehicle Number</label>
                  <input
                    type="text"
                    value={formData.vehicle_number}
                    onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., B 1234 XYZ"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Special instructions, landmarks, etc."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({
                      order_id: '',
                      customer_name: '',
                      delivery_address: '',
                      delivery_date: new Date().toISOString().split('T')[0],
                      scheduled_time: '',
                      driver_name: '',
                      vehicle_number: '',
                      notes: ''
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all"
                >
                  Schedule Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
