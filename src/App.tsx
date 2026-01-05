import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';
import { SetupWizard } from './components/setup/SetupWizard';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Materials } from './pages/Materials';
import { Orders } from './pages/Orders';
import { Production } from './pages/Production';
import { POS } from './pages/POS';
import { Reports } from './pages/Reports';
import { Users } from './pages/Users';
import { Pricing } from './pages/Pricing';
import { Deliveries } from './pages/Deliveries';
import { Settings } from './pages/Settings';

function AppContent() {
  const { user, loading, userBranches } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.hash.slice(1) || '/dashboard');
  const [showSignup, setShowSignup] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);

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
    return showSignup
      ? <SignupPage onSwitchToLogin={() => setShowSignup(false)} />
      : <LoginPage onSwitchToSignup={() => setShowSignup(true)} />;
  }

  if (userBranches.length === 0 && !setupComplete) {
    return <SetupWizard onComplete={() => {
      setSetupComplete(true);
      window.location.reload();
    }} />;
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
      case '/users':
        return <Users />;
      case '/pricing':
        return <Pricing />;
      case '/deliveries':
        return <Deliveries />;
      case '/settings':
        return <Settings />;
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
