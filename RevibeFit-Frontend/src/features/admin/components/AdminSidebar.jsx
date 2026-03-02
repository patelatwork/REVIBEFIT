import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  FileText,
  FlaskConical,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Dumbbell,
  ChevronRight,
  UserCog,
} from 'lucide-react';
import logo from '../../../assets/exercise_8407005.png';

const navItems = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/admin/dashboard', section: 'analytics' },
  { id: 'users', label: 'Users', icon: Users, path: '/admin/dashboard', section: 'users' },
  { id: 'approvals', label: 'Approvals', path: '/admin/pending-approvals', icon: ShieldCheck },
  { id: 'invoices', label: 'Invoices', path: '/admin/invoices', icon: FileText },
  { id: 'earnings', label: 'Earnings', path: '/admin/earnings', icon: FlaskConical },
  { id: 'managers', label: 'Managers', path: '/admin/managers', icon: UserCog },
];

const AdminSidebar = ({ activeSection, onSectionChange }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
  };

  const handleItemClick = (item) => {
    if (item.section) {
      // Dashboard sub-sections (analytics, users)
      if (location.pathname === '/admin/dashboard') {
        // Already on dashboard — just switch section
        onSectionChange(item.section);
      } else {
        // Navigate to dashboard with section query param
        navigate(`/admin/dashboard?section=${item.section}`);
      }
    } else if (item.id === 'overview') {
      if (location.pathname === '/admin/dashboard') {
        onSectionChange('overview');
      } else {
        navigate('/admin/dashboard');
      }
    } else if (item.path) {
      navigate(item.path);
    } else {
      onSectionChange(item.id);
    }
  };

  const isActive = (item) => {
    // Dashboard overview: only active when on dashboard AND section is 'overview'
    if (item.id === 'overview') {
      return location.pathname === '/admin/dashboard' && activeSection === 'overview';
    }
    // Sub-sections (analytics, users): active when on dashboard AND matching section
    if (item.section) {
      return location.pathname === '/admin/dashboard' && activeSection === item.section;
    }
    // Standalone pages (approvals, invoices, earnings): active by path match
    if (item.path) return location.pathname === item.path;
    return activeSection === item.id;
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#1a3a2a] z-50 flex items-center justify-between px-4 shadow-lg">
        <div className="flex items-center gap-3">
          <img src={logo} alt="RevibeFit" className="h-8 w-8" />
          <span className="text-white font-bold text-lg">RevibeFit Admin</span>
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
        className={`fixed top-0 left-0 h-full bg-gradient-to-b from-[#1a3a2a] to-[#0f2519] z-50 transition-all duration-300 ease-in-out flex flex-col
          ${collapsed ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:w-64`}
        style={{ width: '16rem' }}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#4ade80] to-[#22c55e] rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
              <Dumbbell size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">RevibeFit</h1>
              <p className="text-green-300/70 text-xs">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <p className="text-green-300/50 text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">
            Navigation
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <button
                key={item.id}
                onClick={() => {
                  handleItemClick(item);
                  setCollapsed(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                  ${active
                    ? 'bg-gradient-to-r from-[#4ade80]/20 to-[#22c55e]/10 text-[#4ade80] shadow-lg shadow-green-500/5'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <div className={`p-1.5 rounded-lg transition-colors ${active ? 'bg-[#4ade80]/20' : 'group-hover:bg-white/5'}`}>
                  <Icon size={18} />
                </div>
                <span className="flex-1 text-left">{item.label}</span>
                {active && <ChevronRight size={14} className="text-[#4ade80]/60" />}
              </button>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4ade80] to-[#16a34a] flex items-center justify-center text-white font-bold text-sm">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">Admin</p>
              <p className="text-green-300/60 text-xs truncate">Super Admin</p>
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

export default AdminSidebar;
