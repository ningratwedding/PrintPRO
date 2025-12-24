import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Building2, MapPin, User, CheckCircle, LogOut, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SetupWizardProps {
  onComplete: () => void;
}

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const { user, signOut } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [userData, setUserData] = useState({
    fullName: '',
  });

  const [companyData, setCompanyData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
  });

  const [branchData, setBranchData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
  });

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStep(2);
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyData.name,
          code: companyData.code,
          address: companyData.address,
          phone: companyData.phone,
          email: companyData.email,
        })
        .select()
        .single();

      if (companyError) throw companyError;

      setCompanyId(company.id);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Gagal membuat perusahaan');
    } finally {
      setLoading(false);
    }
  };

  const handleBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!companyId) throw new Error('Company ID not found');

      const { data: branch, error: branchError } = await supabase
        .from('branches')
        .insert({
          company_id: companyId,
          name: branchData.name,
          code: branchData.code,
          address: branchData.address,
          phone: branchData.phone,
        })
        .select()
        .single();

      if (branchError) throw branchError;

      if (!user) throw new Error('User not authenticated');

      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email!,
          full_name: userData.fullName,
          company_id: companyId,
          role: 'owner',
          active: true,
        });

      if (userError) throw userError;

      const { data: ownerRole } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'Owner')
        .single();

      if (!ownerRole) throw new Error('Owner role not found');

      const { error: roleError } = await supabase
        .from('user_branch_roles')
        .insert({
          user_id: user.id,
          branch_id: branch.id,
          role_id: ownerRole.id,
        });

      if (roleError) throw roleError;

      onComplete();
    } catch (err: any) {
      setError(err.message || 'Gagal menyelesaikan setup');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSetup = async () => {
    setShowCancelModal(false);
    setLoading(true);
    try {
      await signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-2xl p-8 relative">
          <button
            onClick={() => setShowCancelModal(true)}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
            title="Keluar dari setup"
          >
            <LogOut className="w-5 h-5" />
          </button>

          <div className="flex items-center justify-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center text-slate-900 mb-2">Setup Bisnis Anda</h1>
          <p className="text-center text-slate-600 mb-8">
            Mari kita mulai dengan mengatur informasi dasar bisnis Anda
          </p>

          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                {step > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
              </div>
              <div className={`w-20 h-1 transition-all ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                {step > 2 ? <CheckCircle className="w-5 h-5" /> : '2'}
              </div>
              <div className={`w-20 h-1 transition-all ${step >= 3 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                3
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleUserSubmit} className="space-y-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-3">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Informasi Anda</h2>
                <p className="text-sm text-slate-600">Masukkan nama lengkap Anda</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={userData.fullName}
                  onChange={(e) => setUserData({ ...userData, fullName: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Contoh: Budi Santoso"
                  required
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Email Anda:</strong> {user?.email}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                Lanjutkan
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleCompanySubmit} className="space-y-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-3">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Informasi Perusahaan</h2>
                <p className="text-sm text-slate-600">Masukkan detail perusahaan Anda</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nama Perusahaan
                </label>
                <input
                  type="text"
                  value={companyData.name}
                  onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Contoh: PT Digital Printing Indonesia"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Kode Perusahaan
                </label>
                <input
                  type="text"
                  value={companyData.code}
                  onChange={(e) => setCompanyData({ ...companyData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Contoh: DPI"
                  required
                />
                <p className="mt-1 text-xs text-slate-500">Kode unik untuk identifikasi perusahaan</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Alamat
                </label>
                <textarea
                  value={companyData.address}
                  onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Alamat lengkap perusahaan"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Telepon
                  </label>
                  <input
                    type="tel"
                    value={companyData.phone}
                    onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Contoh: 021-12345678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={companyData.email}
                    onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Contoh: info@perusahaan.com"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-all"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? 'Membuat...' : 'Lanjutkan'}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleBranchSubmit} className="space-y-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-3">
                  <MapPin className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Cabang Pertama</h2>
                <p className="text-sm text-slate-600">Buat lokasi cabang pertama Anda</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nama Cabang
                </label>
                <input
                  type="text"
                  value={branchData.name}
                  onChange={(e) => setBranchData({ ...branchData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Contoh: Kantor Pusat"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Kode Cabang
                </label>
                <input
                  type="text"
                  value={branchData.code}
                  onChange={(e) => setBranchData({ ...branchData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Contoh: HQ"
                  required
                />
                <p className="mt-1 text-xs text-slate-500">Kode unik untuk identifikasi cabang</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Alamat
                </label>
                <textarea
                  value={branchData.address}
                  onChange={(e) => setBranchData({ ...branchData, address: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Alamat lengkap cabang"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Telepon
                </label>
                <input
                  type="tel"
                  value={branchData.phone}
                  onChange={(e) => setBranchData({ ...branchData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Contoh: 021-87654321"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Siap untuk menyelesaikan setup!</p>
                    <p>Setelah langkah ini, Anda akan dapat mengakses dashboard dan mulai menggunakan sistem.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-all"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg font-medium hover:from-green-700 hover:to-green-800 focus:ring-4 focus:ring-green-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? 'Menyelesaikan...' : 'Selesaikan Setup'}
                </button>
              </div>
            </form>
          )}
        </div>

        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900">Batalkan Setup?</h3>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-slate-600 mb-6">
                Apakah Anda yakin ingin keluar dari setup? Data yang sudah dimasukkan {step > 1 ? 'mungkin sudah tersimpan dan ' : ''}akan hilang. Anda perlu login kembali untuk melanjutkan setup.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleCancelSetup}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Keluar...' : 'Ya, Keluar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
