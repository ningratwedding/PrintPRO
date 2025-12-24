import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, Search, Tag, Edit2, Trash2 } from 'lucide-react';

interface PricingRule {
  id: string;
  company_id: string;
  name: string;
  product_template_id: string | null;
  rules_json: any;
  active: boolean;
  created_at: string;
}

export function Pricing() {
  const { currentBranch } = useAuth();
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    product_template_id: '',
    base_price: 0,
    markup_percentage: 0,
    description: ''
  });

  useEffect(() => {
    if (currentBranch) {
      loadData();
    }
  }, [currentBranch]);

  const loadData = async () => {
    if (!currentBranch) return;

    try {
      const { data: branch } = await supabase
        .from('branches')
        .select('company_id')
        .eq('id', currentBranch.id)
        .single();

      if (!branch) return;

      const [rulesResult, productsResult] = await Promise.all([
        supabase
          .from('pricing_rules')
          .select('*')
          .eq('company_id', branch.company_id)
          .eq('active', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('product_templates')
          .select('id, name, code')
          .eq('company_id', branch.company_id)
          .eq('active', true)
          .order('name')
      ]);

      setPricingRules(rulesResult.data || []);
      setProducts(productsResult.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
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

      const rulesJson = {
        base_price: formData.base_price,
        markup_percentage: formData.markup_percentage,
        description: formData.description,
        formula: `base_price * (1 + markup_percentage / 100)`
      };

      const { error } = await supabase
        .from('pricing_rules')
        .insert({
          company_id: branch.company_id,
          name: formData.name,
          product_template_id: formData.product_template_id || null,
          rules_json: rulesJson
        });

      if (error) throw error;

      setShowAddModal(false);
      setFormData({ name: '', product_template_id: '', base_price: 0, markup_percentage: 0, description: '' });
      loadData();
    } catch (error) {
      console.error('Error creating pricing rule:', error);
      alert('Failed to create pricing rule');
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this pricing rule?')) return;

    try {
      const { error } = await supabase
        .from('pricing_rules')
        .update({ active: false })
        .eq('id', ruleId);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error deleting pricing rule:', error);
      alert('Failed to delete pricing rule');
    }
  };

  const filteredRules = pricingRules.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProductName = (productId: string | null) => {
    if (!productId) return 'All Products';
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Unknown Product';
  };

  const calculateFinalPrice = (rule: PricingRule) => {
    const basePrice = rule.rules_json?.base_price || 0;
    const markup = rule.rules_json?.markup_percentage || 0;
    return basePrice * (1 + markup / 100);
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
          <h1 className="text-3xl font-bold text-slate-900">Pricing Rules</h1>
          <p className="text-slate-600 mt-1">Manage pricing rules and markup strategies</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Pricing Rule
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search pricing rules..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Base Price</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Markup</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Final Price</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                        <Tag className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{rule.name}</p>
                        {rule.rules_json?.description && (
                          <p className="text-sm text-slate-500">{rule.rules_json.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-3 py-1 text-xs font-medium bg-violet-100 text-violet-700 rounded-full">
                      {getProductName(rule.product_template_id)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-slate-900">
                    Rp {(rule.rules_json?.base_price || 0).toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded">
                      +{rule.rules_json?.markup_percentage || 0}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-emerald-600">
                    Rp {calculateFinalPrice(rule).toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRules.length === 0 && (
          <div className="text-center py-12">
            <Tag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">No pricing rules found</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700"
            >
              Create your first pricing rule
            </button>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Add Pricing Rule</h2>
              <p className="text-sm text-slate-600 mt-1">Create a new pricing rule with base price and markup</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Rule Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Standard Banner Pricing"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Product (Optional)</label>
                <select
                  value={formData.product_template_id}
                  onChange={(e) => setFormData({ ...formData, product_template_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Products</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Base Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Markup Percentage</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.markup_percentage}
                  onChange={(e) => setFormData({ ...formData, markup_percentage: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 30 for 30%"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Optional description"
                />
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-600">Final Price Preview:</p>
                <p className="text-2xl font-bold text-emerald-600">
                  Rp {(formData.base_price * (1 + formData.markup_percentage / 100)).toLocaleString('id-ID')}
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ name: '', product_template_id: '', base_price: 0, markup_percentage: 0, description: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all"
                >
                  Create Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
