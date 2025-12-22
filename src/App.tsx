import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Materials } from './pages/Materials';
import { Orders } from './pages/Orders';
import { Production } from './pages/Production';
import { POS } from './pages/POS';
import { Reports } from './pages/Reports';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.hash.slice(1) || '/dashboard');

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash.slice(1) || '/dashboard');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (currentPath) {
      case '/dashboard':
        return <Dashboard />;
      case '/products':
        return <Products />;
      case '/materials':
        return <Materials />;
      case '/orders':
        return <Orders />;
      case '/production':
        return <Production />;
      case '/pos':
        return <POS />;
      case '/reports':
        return <Reports />;
      case '/pricing':
      case '/deliveries':
      case '/settings':
        return (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🚧</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Coming Soon</h2>
              <p className="text-slate-600">This module is under construction</p>
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout>
      {renderPage()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
