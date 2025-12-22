import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Material } from '../../types/database';
import { X } from 'lucide-react';

interface AddStockModalProps {
  material: Material;
  branchId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddStockModal({ material, branchId, onClose, onSuccess }: AddStockModalProps) {
  const [formData, setFormData] = useState({
    quantity: 0,
    unit_cost: 0,
    supplier_name: '',
    lot_number: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const lotNumber = formData.lot_number || `LOT-${Date.now().toString().slice(-8)}`;
      const receivedDate = new Date().toISOString().split('T')[0];

      const { error: lotError } = await supabase
        .from('inventory_lots')
        .insert({
          material_id: material.id,
          branch_id: branchId,
          lot_number: lotNumber,
          received_date: receivedDate,
          quantity_received: formData.quantity,
          quantity_available: formData.quantity,
          unit_cost: formData.unit_cost,
          supplier_name: formData.supplier_name,
          notes: formData.notes
        });

      if (lotError) throw lotError;

      const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert({
          material_id: material.id,
          branch_id: branchId,
          movement_type: 'in',
          quantity: formData.quantity,
          unit_cost: formData.unit_cost,
          reference_type: 'purchase',
          notes: formData.notes
        });

      if (movementError) throw movementError;

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding stock:', error);
      alert('Failed to add stock. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Add Stock</h2>
            <p className="text-sm text-slate-600 mt-1">{material.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Quantity ({material.unit})
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              min="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Unit Cost (Rp)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.unit_cost}
              onChange={(e) => setFormData({ ...formData, unit_cost: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Supplier Name
            </label>
            <input
              type="text"
              value={formData.supplier_name}
              onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Lot Number (Optional)
            </label>
            <input
              type="text"
              value={formData.lot_number}
              onChange={(e) => setFormData({ ...formData, lot_number: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Auto-generated if empty"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
