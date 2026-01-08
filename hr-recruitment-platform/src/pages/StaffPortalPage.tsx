import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, BookOpen, FileText, Bell, LogOut, User } from 'lucide-react';

export default function StaffPortalPage() {
    const { user, profile, signOut } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const quickActions = [
        {
            title: 'My Passport',
            icon: Shield,
            path: '/my-passport',
            color: 'bg-purple-100 text-purple-600',
            desc: 'View Digital ID & Compliance'
        },
        {
            title: 'My Training',
            icon: BookOpen,
            path: '/training',
            color: 'bg-blue-100 text-blue-600',
            desc: 'Access courses & certificates'
        },
        {
            title: 'Documents',
            icon: FileText,
            path: '/documents',
            color: 'bg-orange-100 text-orange-600',
            desc: 'Payslips & Contracts'
        },
        {
            title: 'Notices',
            icon: Bell,
            path: '/noticeboard',
            color: 'bg-green-100 text-green-600',
            desc: 'Company updates'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Mobile Header */}
            <header className="bg-white shadow-sm px-4 py-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-cyan-100 flex items-center justify-center overflow-hidden">
                        {user?.user_metadata?.avatar_url ? (
                            <img src={user.user_metadata.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                            <User className="h-6 w-6 text-cyan-600" />
                        )}
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-gray-900">Hello, {profile?.full_name?.split(' ')[0] || 'Staff'}</h1>
                        <p className="text-xs text-gray-500">Staff Portal</p>
                    </div>
                </div>
                <button
                    onClick={handleSignOut}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </header>

            <main className="flex-1 p-4 max-w-md mx-auto w-full space-y-6">
                {/* Welcome Card */}
                <div className="bg-gradient-to-r from-cyan-600 to-cyan-500 rounded-2xl p-6 text-white shadow-lg">
                    <h2 className="text-xl font-bold mb-1">Ready for your shift?</h2>
                    <p className="text-cyan-100 text-sm mb-4">
                        Check your compliance status before you start.
                    </p>
                    <button
                        onClick={() => navigate('/my-passport')}
                        className="bg-white text-cyan-600 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-cyan-50 transition-colors w-full"
                    >
                        View Digital Passport
                    </button>
                </div>

                {/* Quick Actions Grid */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {quickActions.map((action) => (
                            <button
                                key={action.title}
                                onClick={() => navigate(action.path)}
                                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all text-left flex flex-col gap-3"
                            >
                                <div className={`p-2 rounded-lg w-fit ${action.color}`}>
                                    <action.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="block font-semibold text-gray-900 text-sm">{action.title}</span>
                                    <span className="block text-xs text-gray-500 mt-0.5">{action.desc}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Latest Notice Preview */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-gray-900">Latest Update</h3>
                        <span className="text-xs text-gray-500">Today</span>
                    </div>
                    <div className="p-4">
                        <p className="text-sm text-gray-600 line-clamp-2">
                            Please remember to sync your mobile app before starting your shift to get the latest settings.
                        </p>
                        <button
                            onClick={() => navigate('/noticeboard')}
                            className="text-xs text-cyan-600 font-medium mt-2 hover:underline"
                        >
                            Read more
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
