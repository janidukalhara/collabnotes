import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import SearchBar from '../notes/SearchBar';
import toast from 'react-hot-toast';

const NavItem = ({ to, icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150
       ${isActive
         ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
         : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-transparent'}`
    }
  >
    {icon}
    <span>{label}</span>
  </NavLink>
);

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out');
    navigate('/login');
  };

  const avatar = user?.avatar
    ? <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
    : (
      <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
        {user?.name?.[0]?.toUpperCase() ?? '?'}
      </div>
    );

  return (
    <div className="min-h-screen flex bg-zinc-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col
        transform transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:static lg:translate-x-0`}
      >
        {/* Brand */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-2.5">
          <div className="w-7 h-7 bg-amber-400 rounded-lg flex items-center justify-center rotate-3 flex-shrink-0">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </div>
          <span className="font-display font-bold text-white text-base">CollabNotes</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <NavItem
            to="/dashboard"
            label="My Notes"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
            }
          />
          <NavItem
            to="/profile"
            label="Profile"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            }
          />
        </nav>

        {/* User footer */}
        <div className="px-3 py-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-zinc-800 transition-colors group">
            {avatar}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-200 truncate">{user?.name}</p>
              <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
            </div>
            <button onClick={handleLogout} title="Sign out"
              className="text-zinc-600 hover:text-red-400 transition-colors p-1 rounded-lg opacity-0 group-hover:opacity-100"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center gap-4 px-4 sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-zinc-500 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="flex-1 max-w-md">
            <SearchBar />
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
