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
  Heart,
  AlertOctagon,
  Receipt
} from 'lucide-react';

import TenantSwitcher from './TenantSwitcher';
import { QuickAppSwitcher } from './CrossAppNavigation';
import NotificationCenter from './NotificationCenter';
import GlobalSearch from './GlobalSearch';
import QuickActions from './QuickActions';
import HelpCenter from './HelpCenter';

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
    { name: 'Performance', href: '/performance', icon: TrendingUp, feature: 'performance' },
    { name: 'Attendance', href: '/attendance', icon: Clock, feature: 'attendance' },
    { name: 'Shift Rota', href: '/shifts', icon: CalendarDays, feature: 'shifts' },
    { name: 'Clients', href: '/clients', icon: Heart, feature: 'clients' },
    { name: 'Incidents', href: '/incidents', icon: AlertOctagon, feature: 'incidents' },
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
  // RBAC: Hide restricted items for carers/staff even if feature is enabled
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
    name: 'CQC Compliance',
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
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 fixed w-full z-30">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <div className="flex items-center ml-2 lg:ml-0">
                <img
                  src="/pwa-192x192.png"
                  alt="NovumFlow"
                  className="h-10 w-auto object-contain"
                />
                <span className="ml-3 text-xl font-bold bg-gradient-to-r from-cyan-600 to-cyan-500 bg-clip-text text-transparent">NovumFlow</span>
              </div>

              {/* Tenant Switcher */}
              <div className="hidden md:block ml-6">
                <TenantSwitcher />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Global Search */}
              <GlobalSearch />

              {/* Help Center */}
              <HelpCenter />

              {/* Notification Center */}
              <NotificationCenter />

              {/* Cross-App Navigation */}
              <QuickAppSwitcher />

              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">{profile?.full_name || user?.email}</p>
                <p className="text-xs text-gray-500 capitalize">{profile?.role?.replace('_', ' ')}</p>
              </div>

              <button
                onClick={handleSignOut}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition ${isActive
                      ? 'bg-cyan-50 text-cyan-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:pt-16">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition ${isActive
                    ? 'bg-cyan-50 text-cyan-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  <item.icon className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive ? 'text-cyan-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64 flex flex-col min-h-screen pt-16">
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>
        <BrandedFooter />
      </div>

      {/* Quick Actions FAB */}
      <QuickActions />
    </div>
  );
}
