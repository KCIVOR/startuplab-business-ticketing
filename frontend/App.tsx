
import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import { EventList } from './views/Public/EventList';
import { EventDetails } from './views/Public/EventDetails';
import { RegistrationForm } from './views/Public/RegistrationForm';
import { PaymentStatusView } from './views/Public/PaymentStatus';
import { TicketView } from './views/Public/TicketView';
import { AdminDashboard } from './views/Admin/Dashboard';
import { EventsManagement } from './views/Admin/EventsManagement';
import { RegistrationsList } from './views/Admin/RegistrationsList';
import { CheckIn } from './views/Admin/CheckIn';
import { SettingsView } from './views/Admin/Settings';
import { LoginPerspective } from './views/Auth/Login';
import { SignUpView } from './views/Auth/SignUp';
import { AcceptInvite } from './views/Auth/AcceptInvite';
import { ICONS } from './constants';
import { UserRole } from './types';
import { supabase } from "./supabase/supabaseClient.js";
import { useUser } from './context/UserContext';
const API = import.meta.env.VITE_API_BASE;
const Branding: React.FC<{ className?: string, light?: boolean }> = ({ className = '', light = false }) => (
  <span className={`font-black tracking-tighter ${className} ${light ? 'text-white' : 'text-slate-900'}`}>
    StartupLab <span className="text-indigo-600 font-bold italic">Business Ticketing</span>
  </span>
);
const PortalLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, isAuthenticated, clearUser, setUser, canViewEvents, canEditEvents, canManualCheckIn } = useUser();
  const isStaff = role === UserRole.STAFF;
  // Unified URLs for both roles

  useEffect(() => {
    const syncSession = async () => {
      const isPortalRoute = ['/dashboard', '/events', '/attendees', '/checkin', '/settings'].includes(location.pathname);
      if (!isPortalRoute) return;

      try {
        const res = await fetch(`${API}/api/whoAmI`, { credentials: 'include', cache: 'no-store' });
        if (!res.ok) {
          clearUser();
          navigate('/login', { replace: true });
          return;
        }
        const me = await res.json().catch(() => null);
        if (!me?.role || !me?.email) {
          clearUser();
          navigate('/login', { replace: true });
          return;
        }
        setUser({ 
          role: me.role, 
          email: me.email,
          canViewEvents: me.canViewEvents,
          canEditEvents: me.canEditEvents,
          canManualCheckIn: me.canManualCheckIn,
        });
      } catch {
        clearUser();
        navigate('/login', { replace: true });
      }
    };

    syncSession();
  }, [clearUser, location.pathname, navigate, setUser]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!role) return;
    const staffAllowed = ['/events', '/attendees', '/checkin'];
    const adminAllowed = ['/dashboard', '/events', '/attendees', '/checkin', '/settings'];
    const allowed = isStaff ? staffAllowed : adminAllowed;
    if (!allowed.includes(location.pathname)) {
      navigate('/events', { replace: true });
      return;
    }
    if (isStaff) {
      if (location.pathname === '/events' && canViewEvents === false) {
        navigate('/attendees', { replace: true });
      }
      if (location.pathname === '/checkin' && canManualCheckIn === false) {
        navigate('/attendees', { replace: true });
      }
    }
  }, [isAuthenticated, isStaff, location.pathname, navigate, role, canViewEvents, canManualCheckIn]);

  const menuItems = (
    role === UserRole.STAFF
      ? [
          { label: 'Events', path: '/events', icon: <ICONS.Calendar className="w-5 h-5" /> },
          { label: 'Attendees', path: '/attendees', icon: <ICONS.Users className="w-5 h-5" /> },
          { label: 'Check-In', path: '/checkin', icon: <ICONS.CheckCircle className="w-5 h-5" /> },
        ]
      : [
          { label: 'Dashboard', path: '/dashboard', icon: <ICONS.Layout className="w-5 h-5" /> },
          { label: 'Events', path: '/events', icon: <ICONS.Calendar className="w-5 h-5" /> },
          { label: 'Attendees', path: '/attendees', icon: <ICONS.Users className="w-5 h-5" /> },
          { label: 'Check-In', path: '/checkin', icon: <ICONS.CheckCircle className="w-5 h-5" /> },
          { label: 'Settings', path: '/settings', icon: <ICONS.Settings className="w-5 h-5" /> },
        ]
  );

  const handleLogout = async () => {
    try {
      // 1. Call backend logout to clear cookies
      await fetch(`${API}/api/auth/logout`, { 
        method: "POST", 
        credentials: "include" 
      });
  
      // 2. Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Supabase sign out error:", error);
      }
  
      // 3. Clear any local tokens/storage
      localStorage.removeItem('sb-ddkkbtijqrgpitncxylx-auth-token');
      clearUser();
      
      // 4. Navigate to login
      navigate('/');
    } catch (error) {
      console.error("Logout error:", error);
      // Still navigate to login even if there was an error
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-72 bg-white border-r border-slate-200 hidden lg:flex flex-col">
        <div className="p-8">
          <Link to="/" className="text-lg">
            <Branding className="text-base" />
          </Link>
          <div className="mt-4 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isStaff ? 'bg-emerald-500' : 'bg-indigo-500'} animate-pulse`}></span>
            <p className="text-[9px] uppercase font-black text-slate-400 tracking-[0.2em]">
              {isStaff ? 'Operations Hub' : 'Enterprise Admin'}
            </p>
          </div>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                location.pathname === item.path
                  ? (isStaff ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-100' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-100')
                  : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
              }`}
            >
              {item.icon}
              <span className="font-bold text-sm tracking-tight">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-6 mt-auto">
          <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3 border border-slate-100">
            <div className={`w-10 h-10 rounded-xl ${isStaff ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'} flex items-center justify-center font-black text-xs`}>
              {isStaff ? 'ST' : 'AD'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-black text-slate-900 truncate">{isStaff ? 'Staff Operative' : 'System Admin'}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate">StartupLab Global</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 flex items-center justify-between lg:justify-end sticky top-0 z-10">
          <div className="lg:hidden">
            <Branding className="text-xs" />
          </div>
          <div className="flex items-center gap-6">
             <div className="hidden md:flex flex-col items-end">
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">System Status</span>
               <span className="text-[9px] font-bold text-emerald-500 flex items-center gap-1.5">
                 <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
                 Encrypted & Live
               </span>
             </div>
             <button onClick={handleLogout} className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-600 transition-colors border border-slate-100 px-3 py-1.5 rounded-lg">
               Logout
             </button>
          </div>
        </header>
        <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-slate-50">
    <header className="h-20 bg-white border-b border-slate-100 px-8 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
        <Link to="/" className="transition-transform hover:scale-[0.98] active:scale-95">
          <Branding className="text-xl lg:text-2xl" />
        </Link>
        <nav className="flex items-center gap-10">
          <Link to="/" className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-indigo-600 transition-colors hidden sm:block">
            EVENTS
          </Link>
          <Link to="/login" className="bg-[#4F46E5] text-white px-9 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] shadow-[0_10px_30px_-5px_rgba(79,70,229,0.3)] hover:bg-slate-900 transition-all">
            PORTAL LOGIN
          </Link>
        </nav>
      </div>
    </header>
    <main className="flex-1">{children}</main>
    <footer className="bg-slate-950 text-slate-400 py-16 px-8 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          <div>
            <Branding light className="text-2xl" />
            <p className="mt-4 text-sm font-medium max-w-sm text-white/40 leading-relaxed">
              Global-standard ticketing solutions for modern gatherings. Powered by StartupLab.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 lg:text-right uppercase tracking-[0.2em] font-black text-[9px]">
            <div className="space-y-4">
              <p className="text-white/20 mb-4">Platform</p>
              <Link to="/" className="block text-white/60 hover:text-indigo-400">Events List</Link>
              <Link to="/login" className="block text-white/60 hover:text-indigo-400">Admin Login</Link>
            </div>
            <div className="space-y-4">
              <p className="text-white/20 mb-4">Legal</p>
              <a href="#" className="block text-white/60 hover:text-indigo-400">Privacy</a>
              <a href="#" className="block text-white/60 hover:text-indigo-400">Terms</a>
            </div>
          </div>
        </div>
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-[9px] uppercase tracking-[0.3em] font-black text-white/20">
            © 2024 StartupLab Systems International
          </div>
          <div className="flex items-center gap-6 opacity-20 grayscale brightness-200">
             <img src="https://www.hitpayapp.com/static/media/hitpay-logo.0f074558.png" alt="HitPay" className="h-3" />
          </div>
        </div>
      </div>
    </footer>
  </div>
);

const App: React.FC = () => (
  <Router>
    <Routes>
      <Route path="/login" element={<LoginPerspective />} />
      <Route path="/signup" element={<SignUpView />} />
      <Route path="/accept-invite" element={<AcceptInvite />} />
      <Route path="/" element={<PublicLayout><EventList /></PublicLayout>} />
      <Route path="/events/:slug" element={<PublicLayout><EventDetails /></PublicLayout>} />
      <Route path="/events/:slug/register" element={<PublicLayout><RegistrationForm /></PublicLayout>} />
      <Route path="/payment/status" element={<PublicLayout><PaymentStatusView /></PublicLayout>} />
      <Route path="/tickets/:ticketId" element={<PublicLayout><TicketView /></PublicLayout>} />

      <Route path="/dashboard" element={<PortalLayout><AdminDashboard /></PortalLayout>} />
      <Route path="/events" element={<PortalLayout><EventsManagement /></PortalLayout>} />
      <Route path="/attendees" element={<PortalLayout><RegistrationsList /></PortalLayout>} />
      <Route path="/checkin" element={<PortalLayout><CheckIn /></PortalLayout>} />
      <Route path="/settings" element={<PortalLayout><SettingsView /></PortalLayout>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Router>
);
export default App;
