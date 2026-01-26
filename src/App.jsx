import { useState } from 'react';
import { AppLayout } from './components/layout';
import AIConcierge from './pages/AIConcierge';
import WalletPage from './pages/WalletPage';
import TransactionsPage from './pages/TransactionsPage';
import TrustLogsPage from './pages/TrustLogsPage';
import { GlassCard } from './components/ui';
import './App.css';

function App() {
  const [activeNav, setActiveNav] = useState('ai-concierge');

  const renderContent = () => {
    switch (activeNav) {
      case 'ai-concierge':
        return <AIConcierge />;
      case 'wallet':
        return <WalletPage />;
      case 'trust-logs':
        return <TrustLogsPage />;
      case 'transactions':
        return <TransactionsPage />;
      case 'settings':
        return (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-gradient-neon">Settings</h1>
            <GlassCard className="p-8">
              <p className="text-gray-400">Settings panel coming soon...</p>
            </GlassCard>
          </div>
        );
      default:
        return <AIConcierge />;
    }
  };

  return (
    <AppLayout activeNav={activeNav} onNavigate={setActiveNav}>
      {renderContent()}
    </AppLayout>
  );
}

export default App;
