import { ReactNode, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Package,
  Boxes,
  DollarSign,
  ShoppingCart,
  Factory,
  Truck,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
  ChevronDown
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

interface NavItem {
  label: string;
  icon: typeof LayoutDashboard;
  path: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Products', icon: Package, path: '/products' },
  { label: 'Materials', icon: Boxes, path: '/materials' },
  { label: 'Pricing', icon: DollarSign, path: '/pricing' },
  { label: 'Orders', icon: ShoppingCart, path: '/orders' },
  { label: 'Production', icon: Factory, path: '/production' },
  { label: 'POS', icon: DollarSign, path: '/pos' },
  { label: 'Deliveries', icon: Truck, path: '/deliveries' },
  { label: 'Reports', icon: BarChart3, path: '/reports' },
  { label: 'Settings', icon: Settings, path: '/settings' }
];

export function Layout({ children }: LayoutProps) {
  const { user, currentBranch, currentRole, userBranches, setCurrentBranch, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-slate-900 to-slate-800 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">PrintPro</h1>
                <p className="text-xs text-slate-400">{currentRole?.name || 'User'}</p>
              </div>
            </div>
          </div>

          {currentBranch && (
            <div className="p-4 border-b border-slate-700">
              <div className="relative">
                <button
                  onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <span className="truncate">{currentBranch.name}</span>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {branchDropdownOpen && userBranches.length > 1 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden z-10">
                    {userBranches.map((ubr) => (
                      <button
                        key={ubr.branch_id}
                        onClick={() => {
                          setCurrentBranch(ubr.branch_id);
                          setBranchDropdownOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-white hover:bg-slate-700 transition-colors"
                      >
                        {ubr.branch?.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all group"
              >
                <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </a>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-700">
            <div className="px-4 py-3 bg-slate-800 rounded-lg mb-3">
              <p className="text-xs text-slate-400">Signed in as</p>
              <p className="text-sm text-white font-medium truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-red-600 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-4 py-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div className="flex items-center gap-4 ml-auto">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{currentBranch?.name}</p>
                <p className="text-xs text-slate-500">{currentRole?.name}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">
          {children}
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
