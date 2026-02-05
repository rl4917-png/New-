
import React, { useState } from 'react';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import CustomerOverview from './pages/CustomerOverview';
import CustomerProjectManagement from './pages/CustomerProjectManagement';
import CustomerShortlistReview from './pages/CustomerShortlistReview';
import ExpertDashboard from './pages/ExpertDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { Need, NeedStatus } from './types';
import { MOCK_NEEDS } from './services/mockData';

export type Role = 'customer' | 'expert' | 'admin';
export type CustomerView = 'overview' | 'projects' | 'shortlists';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeRole, setActiveRole] = useState<Role>('customer');
  const [customerView, setCustomerView] = useState<CustomerView>('overview');
  const [needs, setNeeds] = useState<Need[]>(MOCK_NEEDS);
  const [isCreatingNeed, setIsCreatingNeed] = useState(false);

  const handleLogin = (role: Role) => {
    setActiveRole(role);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  const handleAddNeed = (newNeed: Need) => {
    setNeeds(prev => [newNeed, ...prev]);
    setIsCreatingNeed(false);
    setCustomerView('projects');
  };

  const handleUpdateNeed = (updatedNeed: Need) => {
    setNeeds(prev => prev.map(n => n.id === updatedNeed.id ? updatedNeed : n));
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderCustomerContent = () => {
    switch (customerView) {
      case 'overview':
        return <CustomerOverview needs={needs} setView={setCustomerView} />;
      case 'projects':
        return (
          <CustomerProjectManagement 
            needs={needs} 
            isCreating={isCreatingNeed} 
            setIsCreating={setIsCreatingNeed}
            onAddNeed={handleAddNeed}
            onUpdateNeed={handleUpdateNeed}
          />
        );
      case 'shortlists':
        return <CustomerShortlistReview needs={needs} onUpdateNeed={handleUpdateNeed} />;
    }
  };

  const renderContent = () => {
    switch (activeRole) {
      case 'customer':
        return renderCustomerContent();
      case 'expert':
        return <ExpertDashboard />;
      case 'admin':
        return <AdminDashboard needs={needs} onUpdateNeed={handleUpdateNeed} />;
    }
  };

  return (
    <Layout 
      activeRole={activeRole} 
      customerView={customerView}
      setCustomerView={setCustomerView}
      onLogout={handleLogout}
      onNewAction={() => {
        setCustomerView('projects');
        setIsCreatingNeed(true);
      }}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
