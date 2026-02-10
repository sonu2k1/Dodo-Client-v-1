import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/auth';
import { AppLayout } from './components/layout';
import AIConcierge from './pages/AIConcierge';
import WalletPage from './pages/WalletPage';
import TransactionsPage from './pages/TransactionsPage';
import TrustLogsPage from './pages/TrustLogsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { GlassCard } from './components/ui';
import './App.css';

import { AnimatePresence } from 'framer-motion';
import PageTransition from './components/layout/PageTransition';

// Dashboard component with navigation
const Dashboard = () => {
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
      <AnimatePresence mode="wait">
        <PageTransition key={activeNav}>
          {renderContent()}
        </PageTransition>
      </AnimatePresence>
    </AppLayout>
  );
};

// Protected Dashboard wrapper
const ProtectedDashboard = () => {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
};

// Main App component with routing
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route path="/*" element={<ProtectedDashboard />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
