import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Save, Building2, DollarSign, Percent, Printer, MapPin, Phone, Mail, Plus, Store, CheckCircle2 } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  timezone: string | null;
  active: boolean;
  created_at: string;
}

export function Settings() {
  const { currentBranch, user, setCurrentBranch } = useAuth();
  const [activeTab, setActiveTab] = useState('branches');
  const [saving, setSaving] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [companyData, setCompanyData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    tax_id: '',
    logo_url: ''
  });
  const [branchData, setBranchData] = useState({
    name: '',
    address: '',
    phone: '',
    timezone: 'Asia/Jakarta',
    printer_config: ''
  });
  const [newBranchData, setNewBranchData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    timezone: 'Asia/Jakarta'
  });
  const [taxSettings, setTaxSettings] = useState({
    tax_rate: 11,
    tax_included: false,
    tax_label: 'PPN'
  });

  useEffect(() => {
    if (currentBranch) {
      loadSettings();
      loadBranches();
    }
  }, [currentBranch]);

  const loadSettings = async () => {
    if (!currentBranch) return;

    try {
      const { data: branch, error: branchError } = await supabase
        .from('branches')
        .select('*, company:companies(*)')
        .eq('id', currentBranch.id)
        .single();

      if (branchError) throw branchError;

      if (branch) {
        setBranchData({
          name: branch.name || '',
          address: branch.address || '',
          phone: branch.phone || '',
          timezone: branch.timezone || 'Asia/Jakarta',
          printer_config: branch.printer_config || ''
        });

        if (branch.company) {
          setCompanyData({
            name: branch.company.name || '',
            address: branch.company.address || '',
            phone: branch.company.phone || '',
            email: branch.company.email || '',
            tax_id: branch.company.tax_id || '',
            logo_url: branch.company.logo_url || ''
          });
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadBranches = async () => {
    if (!currentBranch) return;

    try {
      const { data: currentBranchData } = await supabase
        .from('branches')
        .select('company_id')
        .eq('id', currentBranch.id)
        .single();

      if (!currentBranchData) return;

      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('company_id', currentBranchData.company_id)
        .order('created_at');

      if (error) throw error;
      setBranches(data || []);
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBranch || !user) return;

    setSaving(true);
    try {
      const { data: currentBranchData } = await supabase
        .from('branches')
        .select('company_id')
        .eq('id', currentBranch.id)
        .single();

      if (!currentBranchData) return;

      const branchCode = newBranchData.code || `BR${Date.now().toString().slice(-6)}`;

      const { data: newBranch, error: branchError } = await supabase
        .from('branches')
        .insert({
          company_id: currentBranchData.company_id,
          name: newBranchData.name,
          code: branchCode,
          address: newBranchData.address,
          phone: newBranchData.phone,
          timezone: newBranchData.timezone,
          active: true
        })
        .select()
        .single();

      if (branchError) throw branchError;

      if (newBranch) {
        const { error: roleError } = await supabase
          .from('user_branch_roles')
          .insert({
            user_id: user.id,
            branch_id: newBranch.id,
            role_id: (await supabase.from('roles').select('id').eq('name', 'admin').single()).data?.id
          });

        if (roleError) throw roleError;
      }

      alert('Branch created successfully!');
      setShowAddBranchModal(false);
      setNewBranchData({ name: '', code: '', address: '', phone: '', timezone: 'Asia/Jakarta' });
      loadBranches();
    } catch (error) {
      console.error('Error creating branch:', error);
      alert('Failed to create branch');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBranch) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('branches')
        .update({
          name: branchData.name,
          address: branchData.address,
          phone: branchData.phone,
          timezone: branchData.timezone,
          printer_config: branchData.printer_config
        })
        .eq('id', currentBranch.id);

      if (error) throw error;
      alert('Branch settings saved successfully');
      loadSettings();
    } catch (error) {
      console.error('Error saving branch:', error);
      alert('Failed to save branch settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBranch) return;

    setSaving(true);
    try {
      const { data: branch } = await supabase
        .from('branches')
        .select('company_id')
        .eq('id', currentBranch.id)
        .single();

      if (!branch) return;

      const { error } = await supabase
        .from('companies')
        .update({
          name: companyData.name,
          address: companyData.address,
          phone: companyData.phone,
          email: companyData.email,
          tax_id: companyData.tax_id,
          logo_url: companyData.logo_url
        })
        .eq('id', branch.company_id);

      if (error) throw error;
      alert('Company settings saved successfully');
      loadSettings();
    } catch (error) {
      console.error('Error saving company:', error);
      alert('Failed to save company settings');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'branches', label: 'Branches', icon: Store },
    { id: 'branch', label: 'Current Branch', icon: Building2 },
    { id: 'company', label: 'Company Info', icon: Building2 },
    { id: 'tax', label: 'Tax & Pricing', icon: Percent },
    { id: 'printer', label: 'Printer Setup', icon: Printer }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-1">Configure your system preferences</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200">
          <div className="flex gap-1 p-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'branches' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Manage Branches</h2>
                  <p className="text-sm text-slate-600 mt-1">Add and manage multiple business locations</p>
                </div>
                <button
                  onClick={() => setShowAddBranchModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Branch
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {branches.map((branch) => (
                  <div
                    key={branch.id}
                    className={`p-6 border-2 rounded-xl transition-all ${
                      branch.id === currentBranch?.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          branch.id === currentBranch?.id
                            ? 'bg-blue-600'
                            : 'bg-slate-200'
                        }`}>
                          <Store className={`w-6 h-6 ${
                            branch.id === currentBranch?.id ? 'text-white' : 'text-slate-600'
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{branch.name}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">Code: {branch.code}</p>
                          {branch.id === currentBranch?.id && (
                            <span className="text-xs font-medium text-blue-600">Current Branch</span>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        branch.active
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {branch.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {branch.address && (
                      <div className="flex items-start gap-2 text-sm text-slate-600 mb-2">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <p>{branch.address}</p>
                      </div>
                    )}
                    {branch.phone && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <p>{branch.phone}</p>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-200">
                      <span>Timezone: {branch.timezone || 'Asia/Jakarta'}</span>
                      <span>•</span>
                      <span>Created: {new Date(branch.created_at).toLocaleDateString('id-ID')}</span>
                    </div>
                    {branch.id !== currentBranch?.id && (
                      <button
                        onClick={() => setCurrentBranch(branch.id)}
                        className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white rounded-lg transition-all font-medium text-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Switch to this branch
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {branches.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                  <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">No branches found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'branch' && (
            <form onSubmit={handleSaveBranch} className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4">Branch Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Branch Name</label>
                    <input
                      type="text"
                      value={branchData.name}
                      onChange={(e) => setBranchData({ ...branchData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Address
                    </label>
                    <textarea
                      value={branchData.address}
                      onChange={(e) => setBranchData({ ...branchData, address: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={branchData.phone}
                        onChange={(e) => setBranchData({ ...branchData, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Timezone</label>
                      <select
                        value={branchData.timezone}
                        onChange={(e) => setBranchData({ ...branchData, timezone: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Asia/Jakarta">WIB - Jakarta</option>
                        <option value="Asia/Makassar">WITA - Makassar</option>
                        <option value="Asia/Jayapura">WIT - Jayapura</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Branch Settings'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'company' && (
            <form onSubmit={handleSaveCompany} className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4">Company Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Company Name</label>
                    <input
                      type="text"
                      value={companyData.name}
                      onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Company Address
                    </label>
                    <textarea
                      value={companyData.address}
                      onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={companyData.phone}
                        onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </label>
                      <input
                        type="email"
                        value={companyData.email}
                        onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tax ID / NPWP</label>
                    <input
                      type="text"
                      value={companyData.tax_id}
                      onChange={(e) => setCompanyData({ ...companyData, tax_id: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="00.000.000.0-000.000"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Company Info'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'tax' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4">Tax & Pricing Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tax Label</label>
                    <input
                      type="text"
                      value={taxSettings.tax_label}
                      onChange={(e) => setTaxSettings({ ...taxSettings, tax_label: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., PPN, VAT"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                      <Percent className="w-4 h-4" />
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={taxSettings.tax_rate}
                      onChange={(e) => setTaxSettings({ ...taxSettings, tax_rate: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="tax_included"
                      checked={taxSettings.tax_included}
                      onChange={(e) => setTaxSettings({ ...taxSettings, tax_included: e.target.checked })}
                      className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="tax_included" className="text-sm font-medium text-slate-700">
                      Prices include tax by default
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => alert('Tax settings saved! (This is a demo - implement actual save)')}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save Tax Settings
                </button>
              </div>
            </div>
          )}

          {activeTab === 'printer' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4">Printer Configuration</h2>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Printer className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-900">Printer Setup Info</p>
                        <p className="text-sm text-blue-700 mt-1">
                          Configure your thermal printer for receipts. Most POS printers use ESC/POS protocol.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Printer Configuration</label>
                    <textarea
                      value={branchData.printer_config}
                      onChange={(e) => setBranchData({ ...branchData, printer_config: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      rows={6}
                      placeholder='{"printer_type": "thermal", "port": "USB001", "paper_width": 80}'
                    />
                    <p className="text-xs text-slate-500 mt-2">JSON configuration for your printer</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => alert('Print test page (demo)')}
                  className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Test Print
                </button>
                <button
                  onClick={handleSaveBranch}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save Printer Config
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddBranchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Add New Branch</h2>
              <p className="text-sm text-slate-600 mt-1">Create a new business location</p>
            </div>
            <form onSubmit={handleCreateBranch} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Branch Name *</label>
                <input
                  type="text"
                  value={newBranchData.name}
                  onChange={(e) => setNewBranchData({ ...newBranchData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="e.g., Cabang Jakarta Pusat"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Branch Code</label>
                <input
                  type="text"
                  value={newBranchData.code}
                  onChange={(e) => setNewBranchData({ ...newBranchData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., JKT01 (auto-generated if empty)"
                />
                <p className="text-xs text-slate-500 mt-1">Unique code for the branch. Leave empty to auto-generate.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Address
                </label>
                <textarea
                  value={newBranchData.address}
                  onChange={(e) => setNewBranchData({ ...newBranchData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Full address of the branch"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone
                </label>
                <input
                  type="tel"
                  value={newBranchData.phone}
                  onChange={(e) => setNewBranchData({ ...newBranchData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 021-12345678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Timezone</label>
                <select
                  value={newBranchData.timezone}
                  onChange={(e) => setNewBranchData({ ...newBranchData, timezone: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Asia/Jakarta">WIB - Jakarta</option>
                  <option value="Asia/Makassar">WITA - Makassar</option>
                  <option value="Asia/Jayapura">WIT - Jayapura</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddBranchModal(false);
                    setNewBranchData({ name: '', code: '', address: '', phone: '', timezone: 'Asia/Jakarta' });
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
