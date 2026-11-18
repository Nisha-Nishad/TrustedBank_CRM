import React from 'react';
import {
  LayoutDashboard,
  User,
  Users,
  MessageSquare,
  CheckSquare,
  BarChart3,
  Settings,
  ShieldCheck,
  LogOut,
  X,
} from 'lucide-react';

export default function Sidebar({
  activePage,
  setActivePage,
  user,
  onLogout,
  isOpen = false,
  onClose = () => {},
}) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads', icon: User },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'deals', label: 'Deals (Pipeline)', icon: MessageSquare },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Admin Users is visible for Admin role
  if (user?.role === 'ADMIN') {
    menuItems.push({ id: 'admin', label: 'Admin Users', icon: ShieldCheck });
  }

  const roleDisplay = user?.role === 'ADMIN' ? 'Admin' : user?.role === 'SALES_REP' ? 'Sales RM' : 'Manager';

  const handleItemClick = (pageId) => {
    setActivePage(pageId);
    onClose();
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between select-none">
      <div className="flex-1 flex flex-col min-h-0">
        {/* Permanent Bank Logo Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-[#F1F5F9] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0F357E] text-white flex items-center justify-center shadow-md shrink-0">
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 fill-white text-white"
                aria-label="TrustBank Logo"
              >
                <path d="M12 2L2 7v2h20V7L12 2zM4 10v8h3v-8H4zm6 0v8h3v-8h-3zm6 0v8h3v-8h-3zM2 19v3h20v-3H2z" />
              </svg>
            </div>
            <span className="text-base font-bold text-[#0F172A] tracking-tight">
              TrustBank CRM
            </span>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="px-3 py-3 space-y-1 text-sm font-medium overflow-y-auto custom-scrollbar flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-left transition-all ${
                  isActive
                    ? 'bg-[#0F357E] text-white font-semibold shadow-sm'
                    : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#64748B]'}`} />
                <span className="text-[13px]">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section with Role & Logout */}
      <div className="p-4 border-t border-[#F1F5F9] shrink-0 bg-[#FFFFFF]">
        <div className="w-full flex items-center justify-between px-3 py-2 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] text-xs font-medium text-[#334155]">
          <span className="flex items-center gap-1.5 truncate">
            <User className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
            <span className="truncate">Role: {roleDisplay}</span>
          </span>
          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            title="Logout"
            className="text-[#64748B] hover:text-[#DC2626] transition p-0.5 shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Static Sidebar (Visible on md and up) */}
      <aside className="hidden md:flex w-[230px] bg-white border-r border-[#E2E8F0] flex-col shrink-0 h-screen relative z-20">
        {sidebarContent}
      </aside>

      {/* 2. Mobile Drawer & Backdrop (Visible when isOpen on mobile) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          {/* Slide-out Panel */}
          <aside className="relative w-[270px] max-w-[80vw] bg-white h-full shadow-2xl z-50 flex flex-col animate-slideInLeft">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
