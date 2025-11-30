
import React, { useState } from 'react';
import { Bell, Search, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TenantSwitcher from './TenantSwitcher';
import { QuickAppSwitcher } from './CrossAppNavigation';
import NotificationCenter from './NotificationCenter';

const Header: React.FC = () => {
  const { user } = useAuth();

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
        {/* Mobile Menu Trigger */}
        <button className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
          <Menu size={24} />
        </button>

        {/* Tenant Switcher - Desktop */}
        <div className="hidden md:block">
          <TenantSwitcher />
        </div>

        <div className="flex-1 max-w-xl ml-4 lg:ml-0 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search for client, staff member, or invoice..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Cross-App Navigation */}
          <QuickAppSwitcher />

          {/* Real Notification Center */}
          <NotificationCenter />

          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-slate-800">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-500">{user?.role || 'Guest'}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary-100 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-primary-700 font-bold">
              {user?.avatar || 'U'}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
