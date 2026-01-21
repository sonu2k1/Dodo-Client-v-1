import { useState } from 'react';
import { AppLayout } from './components/layout';
import AIConcierge from './pages/AIConcierge';
import { GlassCard } from './components/ui';
import './App.css';

function App() {
  const [activeNav, setActiveNav] = useState('ai-concierge');

  const renderContent = () => {
    switch (activeNav) {
      case 'ai-concierge':
        return <AIConcierge />;
      case 'wallet':
        return (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-gradient-neon">Wallet</h1>
            <GlassCard className="p-8">
              <p className="text-gray-400">Wallet management coming soon...</p>
            </GlassCard>
          </div>
        );
      case 'trust-logs':
        return (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-gradient-neon">Trust Logs</h1>
            <GlassCard className="p-8">
              <p className="text-gray-400">Trust logs coming soon...</p>
            </GlassCard>
          </div>
        );
      case 'transactions':
        return (
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-gradient-neon">Transactions</h1>
            <GlassCard className="p-8">
              <p className="text-gray-400">Transaction history coming soon...</p>
            </GlassCard>
          </div>
        );
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
