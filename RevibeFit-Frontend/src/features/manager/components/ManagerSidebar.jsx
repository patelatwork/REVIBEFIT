import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    ShieldCheck,
    FileText,
    FlaskConical,
    BarChart3,
    LogOut,
    Menu,
    X,
    Dumbbell,
    ChevronRight,
    ArrowLeftRight,
    User,
} from 'lucide-react';
import logo from '../../../assets/exercise_8407005.png';

const navItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, path: '/manager/dashboard' },
    { id: 'approvals', label: 'Approvals', icon: ShieldCheck, path: '/manager/pending-approvals' },
    { id: 'users', label: 'Users', icon: Users, path: '/manager/users' },
    { id: 'invoices', label: 'Invoices', icon: FileText, path: '/manager/invoices' },
    { id: 'earnings', label: 'Earnings', icon: FlaskConical, path: '/manager/earnings' },
    { id: 'commission', label: 'Commission Requests', icon: ArrowLeftRight, path: '/manager/commission-requests' },
    { id: 'profile', label: 'My Profile', icon: User, path: '/manager/profile' },
];

const ManagerSidebar = ({ managerName, assignedRegion }) => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
    };

    const isActive = (item) => location.pathname === item.path;

    return (
        <>
            {/* Mobile top bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#1a2a3a] z-50 flex items-center justify-between px-4 shadow-lg">
                <div className="flex items-center gap-3">
                    <img src={logo} alt="RevibeFit" className="h-8 w-8" />
                    <span className="text-white font-bold text-lg">RevibeFit Manager</span>
                </div>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                    {collapsed ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile overlay */}
            {collapsed && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setCollapsed(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full bg-gradient-to-b from-[#1a2a3a] to-[#0f1925] z-50 transition-all duration-300 ease-in-out flex flex-col
          ${collapsed ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:w-64`}
                style={{ width: '16rem' }}
            >
                {/* Logo */}
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#60a5fa] to-[#3b82f6] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Dumbbell size={22} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-white font-bold text-lg leading-tight">RevibeFit</h1>
                            <p className="text-blue-300/70 text-xs">Manager Panel</p>
                        </div>
                    </div>
                </div>

                {/* Region Badge */}
                {assignedRegion && (
                    <div className="px-6 py-3 border-b border-white/10">
                        <div className="bg-blue-500/10 rounded-lg px-3 py-2 text-center">
                            <p className="text-blue-300/60 text-[10px] uppercase tracking-wider">Region</p>
                            <p className="text-blue-200 text-sm font-medium">{assignedRegion}</p>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                    <p className="text-blue-300/50 text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">
                        Navigation
                    </p>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item);
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    navigate(item.path);
                                    setCollapsed(false);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                  ${active
                                        ? 'bg-gradient-to-r from-[#60a5fa]/20 to-[#3b82f6]/10 text-[#60a5fa] shadow-lg shadow-blue-500/5'
                                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <div className={`p-1.5 rounded-lg transition-colors ${active ? 'bg-[#60a5fa]/20' : 'group-hover:bg-white/5'}`}>
                                    <Icon size={18} />
                                </div>
                                <span className="flex-1 text-left">{item.label}</span>
                                {active && <ChevronRight size={14} className="text-[#60a5fa]/60" />}
                            </button>
                        );
                    })}
                </nav>

                {/* User section */}
                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-3 px-2">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#60a5fa] to-[#2563eb] flex items-center justify-center text-white font-bold text-sm">
                            {managerName ? managerName.charAt(0).toUpperCase() : 'M'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{managerName || 'Manager'}</p>
                            <p className="text-blue-300/60 text-xs truncate">{assignedRegion || 'Manager'}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-all duration-200"
                    >
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default ManagerSidebar;
