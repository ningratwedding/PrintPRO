import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Order, OrderItem, ProductTemplate } from '../../types/database';
import { X, Plus, Trash2, Save } from 'lucide-react';

interface OrderDetailsModalProps {
  orderId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function OrderDetailsModal({ orderId, onClose, onSuccess }: OrderDetailsModalProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [products, setProducts] = useState<ProductTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({
    product_template_id: '',
    product_name: '',
    quantity: 1,
    unit: 'pcs',
    unit_price: 0
  });

  useEffect(() => {
    loadOrderDetails();
    loadProducts();
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)
        .order('line_number');

      if (itemsError) throw itemsError;
      setItems(itemsData || []);
    } catch (error) {
      console.error('Error loading order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('product_templates')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    try {
      const nextLineNumber = items.length > 0 ? Math.max(...items.map(i => i.line_number)) + 1 : 1;
      const lineTotal = newItem.quantity * newItem.unit_price;

      const { error } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          line_number: nextLineNumber,
          product_template_id: newItem.product_template_id || null,
          product_name: newItem.product_name,
          quantity: newItem.quantity,
          unit: newItem.unit,
          unit_price: newItem.unit_price,
          line_total: lineTotal
        });

      if (error) throw error;

      const newTotal = (order.total_amount || 0) + lineTotal;
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          subtotal: newTotal,
          total_amount: newTotal
        })
        .eq('id', order.id);

      if (updateError) throw updateError;

      setShowAddItem(false);
      setNewItem({ product_template_id: '', product_name: '', quantity: 1, unit: 'pcs', unit_price: 0 });
      loadOrderDetails();
      onSuccess();
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item');
    }
  };

  const handleDeleteItem = async (itemId: string, lineTotal: number) => {
    if (!confirm('Remove this item?')) return;
    if (!order) return;

    try {
      const { error } = await supabase
        .from('order_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      const newTotal = (order.total_amount || 0) - lineTotal;
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          subtotal: newTotal,
          total_amount: newTotal
        })
        .eq('id', order.id);

      if (updateError) throw updateError;

      loadOrderDetails();
      onSuccess();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!order) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order.id);

      if (error) throw error;

      loadOrderDetails();
      onSuccess();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setNewItem({
        ...newItem,
        product_template_id: productId,
        product_name: product.name,
        unit: product.base_unit
      });
    }
  };

  if (loading || !order) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Order Details</h2>
            <p className="text-sm text-slate-600 mt-1">{order.order_number}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm text-slate-600">Customer</p>
              <p className="font-medium text-slate-900">{order.customer_name || 'Walk-in'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Date</p>
              <p className="font-medium text-slate-900">{new Date(order.order_date).toLocaleDateString('id-ID')}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Status</p>
              <select
                value={order.status}
                onChange={(e) => handleUpdateStatus(e.target.value)}
                className="px-3 py-1 border border-slate-300 rounded-lg text-sm font-medium"
              >
                <option value="draft">Draft</option>
                <option value="confirmed">Confirmed</option>
                <option value="production">Production</option>
                <option value="delivered">Delivered</option>
                <option value="invoiced">Invoiced</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <p className="text-sm text-slate-600">Type</p>
              <p className="font-medium text-slate-900">{order.order_type === 'quotation' ? 'Quotation' : 'Sales Order'}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Items</h3>
              <button
                onClick={() => setShowAddItem(true)}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            {showAddItem && (
              <form onSubmit={handleAddItem} className="p-4 bg-blue-50 rounded-lg mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Product</label>
                    <select
                      value={newItem.product_template_id}
                      onChange={(e) => handleProductSelect(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="">Select product...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Custom Name</label>
                    <input
                      type="text"
                      value={newItem.product_name}
                      onChange={(e) => setNewItem({ ...newItem, product_name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      required
                      min="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                    <input
                      type="text"
                      value={newItem.unit}
                      onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Unit Price (Rp)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newItem.unit_price}
                      onChange={(e) => setNewItem({ ...newItem, unit_price: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      required
                      min="0"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddItem(false);
                      setNewItem({ product_template_id: '', product_name: '', quantity: 1, unit: 'pcs', unit_price: 0 });
                    }}
                    className="flex-1 px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Add Item
                  </button>
                </div>
              </form>
            )}

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">#</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Product</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-600">Qty</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-600">Unit Price</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-600">Total</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-slate-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm text-slate-600">{item.line_number}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-900">{item.product_name}</p>
                        <p className="text-xs text-slate-500">{item.unit}</p>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-900">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-sm text-slate-900">
                        Rp {item.unit_price.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-slate-900">
                        Rp {item.line_total.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDeleteItem(item.id, item.line_total)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {items.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No items yet. Click "Add Item" to get started.
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <div className="flex justify-between items-center text-lg font-bold">
              <span className="text-slate-900">Total</span>
              <span className="text-slate-900">
                Rp {order.total_amount.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              onSuccess();
              onClose();
            }}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}
