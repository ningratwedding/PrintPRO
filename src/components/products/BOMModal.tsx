import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Plus, Trash2, Package, Percent } from 'lucide-react';

interface BOMModalProps {
  productTemplateId: string;
  productName: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface BOMItem {
  id: string;
  material_id: string;
  material_name: string;
  quantity_per_unit: number;
  unit: string;
  waste_factor: number;
  unit_cost: number;
}

export function BOMModal({ productTemplateId, productName, onClose, onSuccess }: BOMModalProps) {
  const [bomItems, setBomItems] = useState<BOMItem[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({
    material_id: '',
    quantity_per_unit: 1,
    waste_factor: 0
  });

  useEffect(() => {
    loadBOM();
    loadMaterials();
  }, [productTemplateId]);

  const loadBOM = async () => {
    try {
      const { data, error } = await supabase
        .from('product_bom')
        .select('*')
        .eq('product_template_id', productTemplateId)
        .order('created_at');

      if (error) throw error;
      setBomItems(data || []);
    } catch (error) {
      console.error('Error loading BOM:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('id, name, base_unit, cost_per_unit')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('Error loading materials:', error);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();

    const material = materials.find(m => m.id === newItem.material_id);
    if (!material) return;

    try {
      const totalQuantity = newItem.quantity_per_unit * (1 + newItem.waste_factor / 100);
      const totalCost = totalQuantity * material.cost_per_unit;

      const { error } = await supabase
        .from('product_bom')
        .insert({
          product_template_id: productTemplateId,
          material_id: newItem.material_id,
          material_name: material.name,
          quantity_per_unit: newItem.quantity_per_unit,
          unit: material.base_unit,
          waste_factor: newItem.waste_factor / 100,
          unit_cost: material.cost_per_unit,
          total_cost: totalCost
        });

      if (error) throw error;

      setShowAddItem(false);
      setNewItem({ material_id: '', quantity_per_unit: 1, waste_factor: 0 });
      loadBOM();
      onSuccess();
    } catch (error) {
      console.error('Error adding BOM item:', error);
      alert('Failed to add material');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Remove this material from BOM?')) return;

    try {
      const { error } = await supabase
        .from('product_bom')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      loadBOM();
      onSuccess();
    } catch (error) {
      console.error('Error deleting BOM item:', error);
    }
  };

  const totalCost = bomItems.reduce((sum, item) => {
    const qty = item.quantity_per_unit * (1 + item.waste_factor);
    return sum + (qty * item.unit_cost);
  }, 0);

  if (loading) {
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
            <h2 className="text-xl font-bold text-slate-900">Bill of Materials</h2>
            <p className="text-sm text-slate-600 mt-1">{productName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Total materials: <span className="font-medium text-slate-900">{bomItems.length}</span>
            </div>
            <button
              onClick={() => setShowAddItem(true)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Material
            </button>
          </div>

          {showAddItem && (
            <form onSubmit={handleAddItem} className="p-4 bg-blue-50 rounded-lg space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Material</label>
                <select
                  value={newItem.material_id}
                  onChange={(e) => setNewItem({ ...newItem, material_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  required
                >
                  <option value="">Select material...</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Rp {m.cost_per_unit.toLocaleString('id-ID')}/{m.base_unit})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantity per Unit</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItem.quantity_per_unit}
                    onChange={(e) => setNewItem({ ...newItem, quantity_per_unit: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    required
                    min="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Waste Factor (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newItem.waste_factor}
                    onChange={(e) => setNewItem({ ...newItem, waste_factor: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddItem(false);
                    setNewItem({ material_id: '', quantity_per_unit: 1, waste_factor: 0 });
                  }}
                  className="flex-1 px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Add Material
                </button>
              </div>
            </form>
          )}

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Material</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-600">Qty/Unit</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-600">Waste</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-600">Total Qty</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-600">Unit Cost</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-600">Total Cost</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {bomItems.map((item) => {
                  const totalQty = item.quantity_per_unit * (1 + item.waste_factor);
                  const totalItemCost = totalQty * item.unit_cost;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="text-sm font-medium text-slate-900">{item.material_name}</p>
                            <p className="text-xs text-slate-500">{item.unit}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-900">{item.quantity_per_unit.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded">
                          <Percent className="w-3 h-3" />
                          {(item.waste_factor * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-slate-900">{totalQty.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600">
                        Rp {item.unit_cost.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-slate-900">
                        Rp {totalItemCost.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-300">
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                    Total Cost per Unit:
                  </td>
                  <td className="px-4 py-3 text-right text-lg font-bold text-emerald-600">
                    Rp {totalCost.toLocaleString('id-ID')}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
            {bomItems.length === 0 && (
              <div className="text-center py-12 text-slate-500 text-sm">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p>No materials defined yet</p>
                <p className="text-xs mt-1">Click "Add Material" to define the bill of materials</p>
              </div>
            )}
          </div>

          <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-900">Manufacturing Cost</p>
                <p className="text-xs text-emerald-700 mt-1">Material cost per unit produced</p>
              </div>
              <p className="text-2xl font-bold text-emerald-700">
                Rp {totalCost.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
