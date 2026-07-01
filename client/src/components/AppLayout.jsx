import { BrainCircuit, LayoutDashboard, LogOut, PanelsTopLeft } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/workspaces', label: 'Workspaces', icon: PanelsTopLeft }
];

export function AppLayout({ children }) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-cyan-700 text-white">
              <BrainCircuit size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold leading-5">NeuroFlow AI</p>
              <p className="text-xs text-muted">Document intelligence workspace</p>
            </div>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                      isActive ? 'bg-cyan-50 text-cyan-800' : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  <Icon size={16} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 sm:inline">{user?.name}</span>
            <button
              className="focus-ring grid h-9 w-9 place-items-center rounded-md border border-line bg-white text-slate-600 hover:bg-slate-50"
              onClick={handleLogout}
              title="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
