import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  BarChart3,
  Menu,
} from 'lucide-react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    setIsMobileMenuOpen(false);
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
      {/* Sidebar: Static on Desktop, Slide-over Drawer on Mobile */}
      <Sidebar
        activePage={activePage}
        setActivePage={(page) => {
          setSelectedCustomerId(null);
          setActivePage(page);
        }}
        user={user}
        onLogout={handleLogout}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main View Area: Top Navbar + Scrollable Content Body + Mobile Bottom Bar */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* Top Navbar with Mobile Hamburger Button */}
        <Navbar
          user={user}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
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

        {/* Scrollable Data Page */}
        <main className="flex-1 overflow-y-auto custom-scrollbar pb-16 md:pb-0">
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

        {/* Native Mobile Bottom Navigation Bar (Visible only on mobile screens < 768px) */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-[#E2E8F0] z-40 flex items-center justify-around py-1.5 px-2 shadow-lg backdrop-blur-md bg-white/95">
          <button
            onClick={() => {
              setSelectedCustomerId(null);
              setActivePage('dashboard');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition ${
              activePage === 'dashboard' ? 'text-[#0F357E] font-bold' : 'text-[#64748B]'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px]">Dashboard</span>
          </button>

          <button
            onClick={() => {
              setSelectedCustomerId(null);
              setActivePage('customers');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition ${
              activePage === 'customers' || activePage === 'customer-detail'
                ? 'text-[#0F357E] font-bold'
                : 'text-[#64748B]'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px]">Customers</span>
          </button>

          <button
            onClick={() => {
              setSelectedCustomerId(null);
              setActivePage('deals');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition ${
              activePage === 'deals' ? 'text-[#0F357E] font-bold' : 'text-[#64748B]'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px]">Deals</span>
          </button>

          <button
            onClick={() => {
              setSelectedCustomerId(null);
              setActivePage('reports');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition ${
              activePage === 'reports' ? 'text-[#0F357E] font-bold' : 'text-[#64748B]'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px]">Reports</span>
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[#64748B] hover:text-[#0F172A] transition"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px]">More</span>
          </button>
        </nav>
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
