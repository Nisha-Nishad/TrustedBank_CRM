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
} from 'lucide-react';

export default function Sidebar({ activePage, setActivePage, user, onLogout }) {
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

  return (
    <aside className="w-[230px] bg-white border-r border-[#E2E8F0] flex flex-col justify-between shrink-0 h-screen select-none relative z-20">
      <div className="flex-1 flex flex-col min-h-0">
        
        {/* Permanent Bank Logo Header - Classical Bank Pillars Icon (Never removed) */}
        <div className="h-16 px-5 flex items-center gap-3 border-b border-[#F1F5F9] shrink-0">
          <div className="w-9 h-9 rounded-xl bg-[#0F357E] text-white flex items-center justify-center shadow-md shrink-0">
            {/* Classical Bank Pillars Architectural Icon */}
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

        {/* Navigation Menu */}
        <nav className="px-3 py-3 space-y-1 text-sm font-medium overflow-y-auto custom-scrollbar flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
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
            onClick={onLogout}
            title="Logout"
            className="text-[#64748B] hover:text-[#DC2626] transition p-0.5 shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
