
import React from 'react';
import { LayoutDashboard, Calendar, Users, FileHeart, BadgePoundSterling, LogOut, BarChart3, Settings, Mail, Briefcase, Map, Blocks, Pill, ClipboardCheck, GraduationCap, ShieldAlert, UserPlus, PhoneIncoming, Video, FolderOpen, CheckSquare, HelpCircle, Box, Receipt, Store, Coffee, Lock, Upload, ThumbsUp, Utensils, Package } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      console.log('Sidebar: Sign Out clicked');

      // Race between signOut and a 2-second timeout
      await Promise.race([
        signOut(),
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);

      console.log('Sidebar: Sign Out completed (or timed out), redirecting...');
      window.location.href = '/#/login'; // Force navigation
      window.location.reload(); // Ensure clean state
    } catch (error) {
      console.error('Sidebar: Sign Out error', error);
      // Force redirect even on error
      window.location.href = '/#/login';
      window.location.reload();
    } finally {
      setIsSigningOut(false);
    }
  };

  const navItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: '/',
      roles: [UserRole.ADMIN, UserRole.CARER, UserRole.FAMILY, UserRole.CLIENT]
    },
    {
      icon: CheckSquare,
      label: 'Tasks & Reminders',
      path: '/tasks',
      roles: [UserRole.ADMIN]
    },
    {
      icon: Briefcase,
      label: 'My Hub',
      path: '/staff-hub',
      roles: [UserRole.ADMIN, UserRole.CARER]
    },
    {
      icon: GraduationCap,
      label: 'Training Academy',
      path: '/training',
      roles: [UserRole.ADMIN, UserRole.CARER]
    },
    {
      icon: Mail,
      label: 'Messages',
      path: '/messages',
      roles: [UserRole.ADMIN, UserRole.CARER, UserRole.FAMILY, UserRole.CLIENT]
    },
    {
      icon: Video,
      label: 'Telehealth',
      path: '/telehealth',
      roles: [UserRole.ADMIN, UserRole.CARER, UserRole.FAMILY, UserRole.CLIENT]
    },
    {
      icon: PhoneIncoming,
      label: 'Enquiries & CRM',
      path: '/crm',
      roles: [UserRole.ADMIN]
    },
    {
      icon: Calendar,
      label: 'Rostering',
      path: '/rostering',
      roles: [UserRole.ADMIN, UserRole.CARER]
    },
    {
      icon: Store,
      label: 'Open Shifts',
      path: '/shift-market',
      roles: [UserRole.ADMIN, UserRole.CARER]
    },
    {
      icon: Map,
      label: 'Routes & Map',
      path: '/routes',
      roles: [UserRole.ADMIN, UserRole.CARER]
    },
    {
      icon: FileHeart,
      label: 'Care Plans',
      path: '/care-plans',
      roles: [UserRole.ADMIN, UserRole.CARER, UserRole.FAMILY, UserRole.CLIENT]
    },
    {
      icon: Utensils,
      label: 'Food & Nutrition',
      path: '/nutrition',
      roles: [UserRole.ADMIN, UserRole.CARER, UserRole.FAMILY]
    },
    {
      icon: Coffee,
      label: 'Activities & Events',
      path: '/activities',
      roles: [UserRole.ADMIN, UserRole.CARER, UserRole.FAMILY, UserRole.CLIENT]
    },
    {
      icon: ShieldAlert,
      label: 'Incidents & Risk',
      path: '/incidents',
      roles: [UserRole.ADMIN]
    },
    {
      icon: ClipboardCheck,
      label: 'Forms & Audits',
      path: '/forms',
      roles: [UserRole.ADMIN, UserRole.CARER]
    },
    {
      icon: ThumbsUp,
      label: 'Feedback & Quality',
      path: '/feedback',
      roles: [UserRole.ADMIN]
    },
    {
      icon: Pill,
      label: 'Medication',
      path: '/medication',
      roles: [UserRole.ADMIN, UserRole.CARER, UserRole.FAMILY]
    },
    {
      icon: Package,
      label: 'Inventory & Supplies',
      path: '/inventory',
      roles: [UserRole.ADMIN, UserRole.CARER]
    },
    {
      icon: Users,
      label: 'People',
      path: '/people',
      roles: [UserRole.ADMIN, UserRole.CARER]
    },
    {
      icon: Lock,
      label: 'Users & Security',
      path: '/users',
      roles: [UserRole.ADMIN]
    },
    {
      icon: Box,
      label: 'Equipment & Assets',
      path: '/assets',
      roles: [UserRole.ADMIN]
    },
    {
      icon: Receipt,
      label: 'Expenses & Mileage',
      path: '/expenses',
      roles: [UserRole.ADMIN, UserRole.CARER]
    },
    {
      icon: UserPlus,
      label: 'Recruitment',
      path: '/recruitment',
      roles: [UserRole.ADMIN]
    },
    {
      icon: FolderOpen,
      label: 'Documents',
      path: '/documents',
      roles: [UserRole.ADMIN, UserRole.CARER]
    },
    {
      icon: BadgePoundSterling,
      label: 'Finance',
      path: '/finance',
      roles: [UserRole.ADMIN]
    },
    {
      icon: BarChart3,
      label: 'Reports',
      path: '/reports',
      roles: [UserRole.ADMIN]
    },
    {
      icon: Blocks,
      label: 'Integrations',
      path: '/integrations',
      roles: [UserRole.ADMIN]
    },
    {
      icon: Upload,
      label: 'Data Import',
      path: '/import',
      roles: [UserRole.ADMIN]
    },
    {
      icon: Settings,
      label: 'Settings',
      path: '/settings',
      roles: [UserRole.ADMIN]
    },
    {
      icon: HelpCircle,
      label: 'Help & Support',
      path: '/help',
      roles: [UserRole.ADMIN, UserRole.CARER, UserRole.FAMILY, UserRole.CLIENT]
    },
  ];

  // Use profile.role instead of user.role (Case Insensitive)
  const userRole = profile?.role?.toLowerCase();
  const isSuperAdmin = user?.email === 'mrsonirie@gmail.com' || profile?.is_super_admin;

  console.log('Sidebar Debug:', {
    userEmail: user?.email,
    profileRole: profile?.role,
    normalizedRole: userRole,
    isSuperAdmin
  });

  const allowedItems = navItems.filter(item => {
    if (isSuperAdmin) return true;
    if (!userRole) return false;
    return item.roles.some(r => r.toLowerCase() === userRole);
  });

  return (
    <aside className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 flex flex-col z-30">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <span className="bg-primary-500 w-8 h-8 rounded-lg flex items-center justify-center">
            <FileHeart className="text-white" size={18} />
          </span>
          CareFlow AI
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {allowedItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
              ${isActive(item.path)
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/50'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
          >
            <item.icon size={20} />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg text-sm font-medium text-slate-400 hover:bg-red-900/20 hover:text-red-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSigningOut ? (
            <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <LogOut size={20} />
          )}
          {isSigningOut ? 'Signing Out...' : 'Sign Out'}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
