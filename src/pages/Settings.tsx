import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Save, Building2, DollarSign, Percent, Printer, MapPin, Phone, Mail } from 'lucide-react';

export function Settings() {
  const { currentBranch, user } = useAuth();
  const [activeTab, setActiveTab] = useState('branch');
  const [saving, setSaving] = useState(false);
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
  const [taxSettings, setTaxSettings] = useState({
    tax_rate: 11,
    tax_included: false,
    tax_label: 'PPN'
  });

  useEffect(() => {
    if (currentBranch) {
      loadSettings();
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
    { id: 'branch', label: 'Branch Settings', icon: Building2 },
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
    </div>
  );
}
