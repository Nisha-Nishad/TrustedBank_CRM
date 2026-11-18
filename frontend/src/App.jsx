import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LeadsPage from './pages/LeadsPage';
import CustomersPage from './pages/CustomersPage';
import DealsPage from './pages/DealsPage';
import TasksPage from './pages/TasksPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import AdminUsersPage from './pages/AdminUsersPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import { api } from './services/api';

export default function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('crm_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [activePage, setActivePage] = useState('dashboard');
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [toast, setToast] = useState(null);

  const notify = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setActivePage('dashboard');
    notify(`Welcome back, ${userData.name}!`, 'success');
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setActivePage('dashboard');
    notify('Logged out successfully', 'success');
  };

  const handleViewCustomer360 = (customerId) => {
    setSelectedCustomerId(customerId);
    setActivePage('customer-detail');
  };

  // If not authenticated, render LoginPage
  if (!user) {
    return (
      <>
        <LoginPage onLoginSuccess={handleLoginSuccess} />
        <Toast toast={toast} onClose={() => setToast(null)} />
      </>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC]">
      {/* Static Fixed Left Sidebar */}
      <Sidebar
        activePage={activePage}
        setActivePage={(page) => {
          setSelectedCustomerId(null);
          setActivePage(page);
        }}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main View Area: Static Top Navbar + Scrollable Content Body */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Static Navbar */}
        <Navbar
          user={user}
          onNavigate={(page, id) => {
            if (page === 'customer-detail' && id) {
              setSelectedCustomerId(id);
              setActivePage('customer-detail');
            } else {
              setSelectedCustomerId(null);
              setActivePage(page);
            }
          }}
        />

        {/* Scrollable Data Page: Only this content area scrolls */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {activePage === 'dashboard' && <DashboardPage setActivePage={setActivePage} onNotify={notify} />}
          {activePage === 'leads' && <LeadsPage onNotify={notify} />}
          {activePage === 'customers' && (
            <CustomersPage onViewCustomer360={handleViewCustomer360} onNotify={notify} />
          )}
          {activePage === 'deals' && <DealsPage onNotify={notify} />}
          {activePage === 'tasks' && <TasksPage onNotify={notify} />}
          {activePage === 'reports' && <ReportsPage onNotify={notify} />}
          {activePage === 'settings' && <SettingsPage user={user} onNotify={notify} />}
          {activePage === 'customer-detail' && (
            <CustomerDetailPage
              customerId={selectedCustomerId}
              onBack={() => setActivePage('customers')}
              onNotify={notify}
            />
          )}
          {activePage === 'admin' && user?.role === 'ADMIN' && (
            <AdminUsersPage onNotify={notify} />
          )}
        </main>
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
