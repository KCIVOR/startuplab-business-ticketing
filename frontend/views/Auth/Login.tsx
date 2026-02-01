
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input } from '../../components/Shared';
import { ICONS } from '../../constants';
import { supabase } from "../../supabase/supabaseClient.js";
import { useUser } from '../../context/UserContext';

const API = import.meta.env.VITE_API_BASE;



export const LoginPerspective: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useUser();
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPass, setStaffPass] = useState('');
  const [adminError, setAdminError] = useState('');
  const [staffError, setStaffError] = useState('');

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminError('');
    setStaffError('');
    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email: adminEmail, password: adminPass });
    if (loginError || !data.session) {
      setAdminError(loginError?.message || "Incorrect email or password.");
      return;
    }
    // Check if user is actually admin (use backend service-key lookup)
    const roleRes = await fetch(`${API}/api/user/role-by-email?email=${encodeURIComponent(adminEmail)}`);
    if (!roleRes.ok) {
      setAdminError('Account not found or not authorized.');
      return;
    }
    const userData = await roleRes.json().catch(() => null);
    if (!userData || userData.role !== 'ADMIN') {
      setAdminError('This login is only for admin accounts. Please use the correct login form.');
      return;
    }
    setUser({ role: userData.role, email: adminEmail });
    const { access_token, refresh_token } = data.session;
    const response = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ access_token, refresh_token })
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      console.log(result.message || "Failed to store session");
      return;
    }
    localStorage.removeItem("sb-ddkkbtijqrgpitncxylx-auth-token");
    navigate('/dashboard');
  }
  const handleStaffLogin = async (e) => {
    e.preventDefault();
    setAdminError('');
    setStaffError('');
    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email: staffEmail, password: staffPass });
    if (loginError || !data.session) {
      setStaffError(loginError?.message || "Incorrect email or password.");
      return;
    }
    // Check if user is actually staff (use backend service-key lookup)
    const roleRes = await fetch(`${API}/api/user/role-by-email?email=${encodeURIComponent(staffEmail)}`);
    if (!roleRes.ok) {
      setStaffError('Account not found or not authorized.');
      return;
    }
    const userData = await roleRes.json().catch(() => null);
    if (!userData || userData.role !== 'STAFF') {
      setStaffError('This login is only for staff accounts.');
      return;
    }
    setUser({ role: userData.role, email: staffEmail });
    const { access_token, refresh_token } = data.session;
    const response = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ access_token, refresh_token })
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      console.log(result.message || "Failed to store session");
      return;
    }
    localStorage.removeItem("sb-ddkkbtijqrgpitncxylx-auth-token");
    navigate('/events');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative gradients for a modern look */}
      <div className="absolute top-0 left-0 w-full h-full opacity-40 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-100 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-emerald-100 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-4xl w-full relative z-10 py-12">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-3">
            StartupLab <span className="text-indigo-600">Business Ticketing</span>
          </h1>
          <p className="text-slate-500 text-lg font-medium">Portal Access Perspective</p>
          <div className="w-20 h-1 bg-indigo-600 mx-auto mt-4 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Administrator Perspective */}
          <Card 
            className="p-10 bg-white border-slate-200 hover:border-indigo-300 transition-all group flex flex-col h-full shadow-xl shadow-slate-200/50 rounded-[2.5rem]"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <ICONS.Layout className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">Administrator</h2>
                <p className="text-indigo-600 text-[10px] uppercase font-black tracking-widest">Enterprise Access</p>
              </div>
            </div>
            
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              Full control over events, pricing strategies, detailed revenue analytics, and organization-wide attendee databases rovickromasanta.startuplab@gmail.com.
            </p>

            <div className="space-y-4 mb-10">
              <Input 
                placeholder="Admin Email" 
                value={adminEmail}
                onChange={(e: any) => setAdminEmail(e.target.value)}
              />
              <Input 
                placeholder="Password" 
                type="password"
                value={adminPass}
                onChange={(e: any) => setAdminPass(e.target.value)}
              />
            </div>

            <Button 
              className="w-full bg-indigo-600 hover:bg-indigo-700 mt-auto py-4 text-base font-bold shadow-lg shadow-indigo-100 rounded-2xl"
              onClick={handleAdminLogin}
            >
              Enter Admin Dashboard
            </Button>
            {adminError && (
              <div className="mt-4 text-rose-600 text-sm font-bold text-center">{adminError}</div>
            )}
          </Card>

          {/* Event Staff Perspective */}
          <Card 
            className="p-10 bg-white border-slate-200 hover:border-emerald-300 transition-all group flex flex-col h-full shadow-xl shadow-slate-200/50 rounded-[2.5rem]"
          >
             <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <ICONS.CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">Event Staff</h2>
                <p className="text-emerald-600 text-[10px] uppercase font-black tracking-widest">Operations Hub</p>
              </div>
            </div>
            
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              Streamlined tools for high-speed attendee check-ins, QR scanning, and onsite registration status verification.
            </p>

            <div className="space-y-4 mb-10">
              <Input 
                placeholder="Staff ID / Email" 
                value={staffEmail}
                onChange={(e: any) => setStaffEmail(e.target.value)}
              />
              <Input 
                placeholder="Password" 
                type="password"
                value={staffPass}
                onChange={(e: any) => setStaffPass(e.target.value)}
              />
            </div>

            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700 mt-auto py-4 text-base font-bold shadow-lg shadow-emerald-100 rounded-2xl"
              onClick={handleStaffLogin}
            >
              Enter Staff Portal
            </Button>
            {staffError && (
              <div className="mt-4 text-rose-600 text-sm font-bold text-center">{staffError}</div>
            )}
          </Card>
        </div>

        <div className="mt-16 flex flex-col items-center gap-6">
          <button 
            className="text-slate-400 hover:text-indigo-600 transition-all text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 group"
            onClick={() => navigate('/events')}
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Return to Public Website
          </button>
        </div>
      </div>
    </div>
  );
};
