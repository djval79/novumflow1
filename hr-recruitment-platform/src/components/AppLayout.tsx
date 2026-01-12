import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import BrandedFooter from './BrandedFooter';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  Settings,
  Sliders,
  LogOut,
  Menu,
  X,
  Shield,
  Fingerprint,
  Zap,
  FolderOpen,
  MessageSquare,
  Bell,
  TrendingUp,
  Building2,
  History,
  ShieldCheck,
  Clock,
  BarChart3,
  UsersRound,
  UserPlus,
  GraduationCap,
  CreditCard,
  CalendarDays,
  AlertOctagon,
  Receipt
} from 'lucide-react';

import TenantSwitcher from './TenantSwitcher';
import NotificationCenter from './NotificationCenter';
import GlobalSearch from './GlobalSearch';
import QuickActions from './QuickActions';
import HelpCenter from './HelpCenter';
import PWAInstallPrompt from './PWAInstallPrompt';
import { QuickAppSwitcher } from './CrossAppNavigation';

export default function AppLayout() {
  const { user, profile, signOut } = useAuth();
  const { hasFeature } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  const allNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, feature: 'dashboard' },
    { name: 'HR Module', href: '/hr', icon: Users, feature: 'hr_module' },
    { name: 'Recruitment', href: '/recruitment', icon: Briefcase, feature: 'recruitment' },
    { name: 'Shift Rota', href: '/shifts', icon: CalendarDays, feature: 'shifts' },
    { name: 'Incidents', href: '/incidents', icon: AlertOctagon, feature: 'incidents' },
    { name: 'Performance', href: '/performance', icon: TrendingUp, feature: 'performance' },
    { name: 'Attendance', href: '/attendance', icon: Clock, feature: 'attendance' },
    { name: 'Expenses', href: '/expenses', icon: Receipt, feature: 'expenses' },
    { name: 'Onboarding', href: '/onboarding', icon: UserPlus, feature: 'onboarding' },
    { name: 'Training', href: '/training', icon: GraduationCap, feature: 'training' },
    { name: 'Team', href: '/team', icon: UsersRound, feature: 'team' },
    { name: 'Reports', href: '/reports', icon: BarChart3, feature: 'reports' },
    { name: 'Audit Trail', href: '/audit', icon: History, feature: 'audit' },
    { name: 'Integrations', href: '/integrations', icon: Zap, feature: 'integrations' },
    { name: 'Documents', href: '/documents', icon: FolderOpen, feature: 'documents' },
    { name: 'Messaging', href: '/messaging', icon: MessageSquare, feature: 'messaging' },
    { name: 'Notice Board', href: '/noticeboard', icon: Bell, feature: 'noticeboard' },
    { name: 'Home Office Compliance', href: '/compliance', icon: Shield, feature: 'compliance' },
    { name: 'Biometric System', href: '/biometric', icon: Fingerprint, feature: 'biometric' },
    { name: 'Automation', href: '/automation', icon: Zap, feature: 'automation' },
    { name: 'Letters', href: '/letters', icon: FileText, feature: 'letters' },
    { name: 'Forms', href: '/forms', icon: FileText, feature: 'forms' },
    { name: 'Billing', href: '/billing', icon: CreditCard, feature: 'system' },
    { name: 'Settings', href: '/settings', icon: Settings, feature: 'settings' },
    { name: 'Recruit Settings', href: '/recruit-settings', icon: Sliders, feature: 'recruit_settings' },
  ];

  // Filter navigation based on enabled features
  // RBAC: Hide restricted items for staff even if feature is enabled
  const isRestrictedUser = profile?.role === 'carer' || profile?.role === 'staff';
  const restrictedFeatures = ['hr_module', 'recruitment', 'settings', 'recruit_settings', 'compliance'];

  const navigation = allNavigation.filter(item => {
    if (!hasFeature(item.feature)) return false;
    if (isRestrictedUser && restrictedFeatures.includes(item.feature)) return false;
    return true;
  });

  // Add Tenant Management for super admins
  if (profile?.is_super_admin) {
    navigation.push({
      name: 'Tenant Management',
      href: '/tenant-management',
      icon: Building2,
      feature: 'system'
    });
    navigation.push({
      name: 'Audit Logs',
      href: '/audit-logs',
      icon: History,
      feature: 'system'
    });
    navigation.push({
      name: 'Security Dashboard',
      href: '/admin/security',
      icon: Shield,
      feature: 'system'
    });
  }

  // Add Compliance Hub (comprehensive compliance management)
  navigation.push({
    name: 'Compliance Hub',
    href: '/compliance-hub',
    icon: ShieldCheck,
    feature: 'system'
  });

  // Add Sponsor Guardian (Visa & RTW Compliance)
  navigation.push({
    name: 'Sponsor Guardian',
    href: '/sponsor-guardian',
    icon: Shield,
    feature: 'system'
  });

  // Add Compliance Dashboard (available to all users)
  navigation.push({
    name: 'Compliance Dashboard',
    href: '/compliance-dashboard',
    icon: Shield,
    feature: 'system'
  });

  // Add Digital Passport (available to all users)
  navigation.push({
    name: 'My Passport',
    href: '/my-passport',
    icon: Shield,
    feature: 'system'
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 fixed w-full z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <div className="flex items-center ml-2 lg:ml-0 cursor-pointer" onClick={() => navigate('/dashboard')}>
                <img
                  src="/pwa-192x192.png"
                  alt="NovumFlow"
                  className="h-9 w-auto object-contain"
                />
                <span className="ml-3 text-xl font-bold bg-gradient-to-r from-cyan-600 to-cyan-500 bg-clip-text text-transparent hidden sm:block tracking-tight">NovumFlow</span>
              </div>

              {/* Tenant Switcher - Hidden on small mobile */}
              <div className="hidden md:block ml-6">
                <TenantSwitcher />
              </div>
              <QuickAppSwitcher />
            </div>

            <div className="flex items-center space-x-1 md:space-x-3">
              {/* Global Search */}
              <GlobalSearch />

              <div className="flex items-center space-x-1">
                {/* Help Center */}
                <HelpCenter />

                {/* Notification Center */}
                <NotificationCenter />
              </div>

              <div className="hidden lg:block text-right border-l border-gray-100 pl-4 ml-2">
                <p className="text-sm font-bold text-gray-900 truncate max-w-[150px]">{profile?.full_name || user?.email}</p>
                <p className="text-[10px] text-gray-400 capitalize font-medium tracking-wider">{profile?.role?.replace(/_/g, ' ')}</p>
              </div>

              <button
                onClick={handleSignOut}
                className="flex items-center p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden xl:inline ml-2 text-sm font-semibold">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[55] transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Navigation Sidebar */}
      <div className={`lg:hidden fixed inset-y-0 left-0 w-72 bg-white z-[60] shadow-2xl transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-xl font-black text-cyan-600 tracking-tight">NovumFlow</span>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-gray-50 rounded-lg text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive
                      ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                  >
                    <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="p-4 border-t border-gray-100">
            <TenantSwitcher />
            <div className="mt-4 pt-4 border-t border-gray-100">
              <CompactAppSwitcher />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 pt-16">
        {/* Desktop Sidebar */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:pt-16">
          <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
            <nav className="mt-5 flex-1 px-4 space-y-1.5 font-sans">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${isActive
                      ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-100'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1'
                      }`}
                  >
                    <item.icon className={`mr-3 flex-shrink-0 h-5 w-5 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'
                      }`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-gray-100">
              <CompactAppSwitcher />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 lg:pl-64 flex flex-col">
          <main className="flex-1 min-h-[calc(100vh-4rem)]">
            <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
              <Outlet />
            </div>
          </main>

          {/* Mobile Bottom Navigation - Floating Design */}
          <div className="lg:hidden sticky bottom-6 left-0 right-0 px-4 z-40 pointer-events-none">
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl shadow-cyan-500/10 px-6 py-3 flex justify-between items-center pointer-events-auto max-w-md mx-auto ring-1 ring-black/5">
              {navigation.slice(0, 5).map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'text-cyan-600 scale-110' : 'text-gray-400 hover:text-gray-600'
                      }`}
                  >
                    <item.icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                    <span className="text-[10px] font-black uppercase tracking-tighter">{item.name.split(' ')[0]}</span>
                    {isActive && <div className="w-1 h-1 rounded-full bg-cyan-600" />}
                  </Link>
                );
              })}
            </div>
          </div>

          <BrandedFooter />
        </div>
      </div>

      <QuickActions />
      <HelpCenter />
      <PWAInstallPrompt />
    </div>
  );
}
