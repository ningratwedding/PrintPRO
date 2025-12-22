import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { WorkOrder } from '../types/database';
import { Plus, Search, Play, Pause, CheckCircle, XCircle, Clock, Factory } from 'lucide-react';

export function Production() {
  const { currentBranch, user } = useAuth();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (currentBranch) {
      loadWorkOrders();
    }
  }, [currentBranch, filterStatus]);

  const loadWorkOrders = async () => {
    if (!currentBranch) return;

    try {
      let query = supabase
        .from('work_orders')
        .select('*')
        .eq('branch_id', currentBranch.id)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      setWorkOrders(data || []);
    } catch (error) {
      console.error('Error loading work orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (workOrderId: string) => {
    try {
      const { error } = await supabase
        .from('work_orders')
        .update({
          status: 'in_progress',
          actual_start: new Date().toISOString()
        })
        .eq('id', workOrderId);

      if (error) throw error;
      loadWorkOrders();
    } catch (error) {
      console.error('Error starting work order:', error);
    }
  };

  const handleComplete = async (workOrderId: string) => {
    const qtyCompleted = prompt('Enter quantity completed:');
    if (!qtyCompleted) return;

    try {
      const { error } = await supabase
        .from('work_orders')
        .update({
          status: 'completed',
          actual_end: new Date().toISOString(),
          quantity_completed: Number(qtyCompleted)
        })
        .eq('id', workOrderId);

      if (error) throw error;
      loadWorkOrders();
    } catch (error) {
      console.error('Error completing work order:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'in_progress': return Play;
      case 'completed': return CheckCircle;
      case 'cancelled': return XCircle;
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-slate-100 text-slate-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-emerald-100 text-emerald-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const calculateProgress = (wo: WorkOrder) => {
    if (wo.quantity_planned === 0) return 0;
    return Math.round((wo.quantity_completed / wo.quantity_planned) * 100);
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
          <h1 className="text-3xl font-bold text-slate-900">Production Management</h1>
          <p className="text-slate-600 mt-1">Monitor and manage work orders</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Pending', value: workOrders.filter(w => w.status === 'pending').length, color: 'bg-slate-100 text-slate-700' },
          { label: 'In Progress', value: workOrders.filter(w => w.status === 'in_progress').length, color: 'bg-blue-100 text-blue-700' },
          { label: 'Completed', value: workOrders.filter(w => w.status === 'completed').length, color: 'bg-emerald-100 text-emerald-700' },
          { label: 'Cancelled', value: workOrders.filter(w => w.status === 'cancelled').length, color: 'bg-red-100 text-red-700' }
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-sm font-medium text-slate-600 mb-2">{stat.label}</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${stat.color}`}>
                {stat.label.toLowerCase()}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'in_progress', 'completed', 'cancelled'].map(status => (
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
          {workOrders.map((wo) => {
            const StatusIcon = getStatusIcon(wo.status);
            const progress = calculateProgress(wo);

            return (
              <div key={wo.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
                      <Factory className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-mono font-medium text-slate-900">{wo.work_order_number}</p>
                      <p className="text-sm text-slate-600 mt-1">
                        Planned: {wo.quantity_planned} | Completed: {wo.quantity_completed} | Rejected: {wo.quantity_rejected}
                      </p>
                      {wo.scheduled_start && (
                        <p className="text-sm text-slate-500 mt-1">
                          Scheduled: {new Date(wo.scheduled_start).toLocaleString('id-ID')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(wo.status)}`}>
                      <StatusIcon className="w-3 h-3" />
                      {wo.status}
                    </span>
                    {wo.status === 'pending' && (
                      <button
                        onClick={() => handleStart(wo.id)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Start
                      </button>
                    )}
                    {wo.status === 'in_progress' && (
                      <button
                        onClick={() => handleComplete(wo.id)}
                        className="px-3 py-1 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>

                {wo.status === 'in_progress' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-600">Progress</span>
                      <span className="text-sm font-medium text-slate-900">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-blue-700 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {wo.notes && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-700">{wo.notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {workOrders.length === 0 && (
          <div className="text-center py-12">
            <Factory className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">No work orders found</p>
          </div>
        )}
      </div>
    </div>
  );
}
