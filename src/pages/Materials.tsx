import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Material, InventoryLot } from '../types/database';
import { Plus, Search, Package, AlertTriangle, TrendingDown } from 'lucide-react';

interface MaterialWithStock extends Material {
  total_available: number;
  is_low_stock: boolean;
}

export function Materials() {
  const { currentBranch } = useAuth();
  const [materials, setMaterials] = useState<MaterialWithStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'substrate',
    unit: 'meter',
    min_stock: 0,
    reorder_point: 0
  });

  useEffect(() => {
    if (currentBranch) {
      loadMaterials();
    }
  }, [currentBranch]);

  const loadMaterials = async () => {
    if (!currentBranch) return;

    try {
      const { data: branch } = await supabase
        .from('branches')
        .select('company_id')
        .eq('id', currentBranch.id)
        .single();

      if (!branch) return;

      const { data: materialsData, error: materialsError } = await supabase
        .from('materials')
        .select('*')
        .eq('company_id', branch.company_id)
        .eq('active', true)
        .order('name');

      if (materialsError) throw materialsError;

      const materialsWithStock = await Promise.all(
        (materialsData || []).map(async (material) => {
          const { data: lots } = await supabase
            .from('inventory_lots')
            .select('quantity_available')
            .eq('material_id', material.id)
            .eq('branch_id', currentBranch.id);

          const total_available = lots?.reduce((sum, lot) => sum + Number(lot.quantity_available), 0) || 0;
          const is_low_stock = total_available < material.min_stock;

          return {
            ...material,
            total_available,
            is_low_stock
          };
        })
      );

      setMaterials(materialsWithStock);
    } catch (error) {
      console.error('Error loading materials:', error);
    } finally {
      setLoading(false);
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

      const { error } = await supabase
        .from('materials')
        .insert({
          company_id: branch.company_id,
          ...formData
        });

      if (error) throw error;

      setShowAddModal(false);
      setFormData({ name: '', code: '', category: 'substrate', unit: 'meter', min_stock: 0, reorder_point: 0 });
      loadMaterials();
    } catch (error) {
      console.error('Error creating material:', error);
    }
  };

  const filteredMaterials = materials.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = [
    { value: 'substrate', label: 'Substrate' },
    { value: 'ink', label: 'Ink' },
    { value: 'chemical', label: 'Chemical' },
    { value: 'packaging', label: 'Packaging' },
    { value: 'other', label: 'Other' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const lowStockCount = materials.filter(m => m.is_low_stock).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Materials & Inventory</h1>
          <p className="text-slate-600 mt-1">Manage raw materials and stock levels</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Material
        </button>
      </div>

      {lowStockCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <div>
            <p className="font-medium text-red-900">Low Stock Alert</p>
            <p className="text-sm text-red-700">{lowStockCount} materials are below minimum stock level</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search materials..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Available</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Min Stock</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Avg Cost</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredMaterials.map((material) => (
                <tr key={material.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm text-slate-900">{material.code}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        material.is_low_stock ? 'bg-red-100' : 'bg-emerald-100'
                      }`}>
                        <Package className={`w-5 h-5 ${material.is_low_stock ? 'text-red-600' : 'text-emerald-600'}`} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{material.name}</p>
                        <p className="text-sm text-slate-500">{material.unit}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                      {material.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className={`font-medium ${material.is_low_stock ? 'text-red-600' : 'text-slate-900'}`}>
                      {material.total_available.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-slate-900">
                    {material.min_stock.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-slate-900">
                    Rp {material.average_cost.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {material.is_low_stock ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                        <TrendingDown className="w-3 h-3" />
                        Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex px-3 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                        OK
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredMaterials.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">No materials found</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Add New Material</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Material Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Material Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Unit</label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Min Stock</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.min_stock}
                    onChange={(e) => setFormData({ ...formData, min_stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Reorder Point</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.reorder_point}
                    onChange={(e) => setFormData({ ...formData, reorder_point: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all"
                >
                  Add Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
