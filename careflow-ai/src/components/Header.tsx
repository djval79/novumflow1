
import React from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TenantSwitcher from './TenantSwitcher';
import { QuickAppSwitcher } from './CrossAppNavigation';
import NotificationCenter from './NotificationCenter';
import GlobalSearch from './GlobalSearch';

const Header: React.FC = () => {
  const { user, profile } = useAuth();

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const displayRole = profile?.role || 'Guest';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
      {/* Mobile Menu Trigger */}
      <button className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
        <Menu size={24} />
      </button>

      {/* Tenant Switcher - Desktop */}
      <div className="hidden md:block">
        <TenantSwitcher />
      </div>

      {/* Global Search */}
      <div className="flex-1 max-w-xl ml-4 lg:ml-0 hidden md:flex justify-center">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-4">
        {/* Cross-App Navigation */}
        <QuickAppSwitcher />

        {/* Real Notification Center */}
        <NotificationCenter />

        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-slate-800">{displayName}</p>
            <p className="text-xs text-slate-500 capitalize">{displayRole}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-white font-bold text-sm">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

