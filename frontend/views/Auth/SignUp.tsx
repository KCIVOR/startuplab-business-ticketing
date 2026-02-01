
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input } from '../../components/Shared';
import { ICONS } from '../../constants';
import { UserRole } from '../../types';

export const SignUpView: React.FC = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole>(UserRole.ADMIN);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    company: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API registration delay
    setTimeout(() => {
      setIsSubmitting(false);
      alert('Account created successfully! Redirecting to login...');
      navigate('/login');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-0 left-0 w-full h-full opacity-40 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-100 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-emerald-100 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-xl w-full relative z-10 py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-3">
            Join <span className="text-indigo-600">StartupLab</span>
          </h1>
          <p className="text-slate-500 text-lg font-medium">Create your professional portal account</p>
        </div>

        <Card className="p-10 bg-white border-slate-200 shadow-2xl shadow-slate-200/50 rounded-[3rem]">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Perspective Selection */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Select Perspective</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole(UserRole.ADMIN)}
                  className={`py-4 rounded-2xl border-2 font-bold text-sm transition-all flex flex-col items-center gap-2 ${
                    role === UserRole.ADMIN 
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 shadow-lg shadow-indigo-100' 
                    : 'border-slate-100 text-slate-400 hover:border-slate-200'
                  }`}
                >
                  <ICONS.Layout className="w-5 h-5" />
                  Administrator
                </button>
                <button
                  type="button"
                  onClick={() => setRole(UserRole.STAFF)}
                  className={`py-4 rounded-2xl border-2 font-bold text-sm transition-all flex flex-col items-center gap-2 ${
                    role === UserRole.STAFF 
                    ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 shadow-lg shadow-emerald-100' 
                    : 'border-slate-100 text-slate-400 hover:border-slate-200'
                  }`}
                >
                  <ICONS.CheckCircle className="w-5 h-5" />
                  Event Staff
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <Input 
                label="Full Name" 
                placeholder="e.g. Jordan Miller" 
                required
                className="py-4 px-6 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-indigo-600/20"
                value={formData.name}
                onChange={(e: any) => setFormData({...formData, name: e.target.value})}
              />
              <Input 
                label="Professional Email" 
                type="email"
                placeholder="j.miller@organization.com" 
                required
                className="py-4 px-6 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-indigo-600/20"
                value={formData.email}
                onChange={(e: any) => setFormData({...formData, email: e.target.value})}
              />
              <Input 
                label="Organization" 
                placeholder="Company or Entity Name" 
                required
                className="py-4 px-6 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-indigo-600/20"
                value={formData.company}
                onChange={(e: any) => setFormData({...formData, company: e.target.value})}
              />
              <Input 
                label="Password" 
                type="password"
                placeholder="••••••••" 
                required
                className="py-4 px-6 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-indigo-600/20"
                value={formData.password}
                onChange={(e: any) => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <Button 
              type="submit"
              className={`w-full py-5 text-base font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all ${
                role === UserRole.ADMIN ? 'bg-indigo-600 shadow-indigo-100' : 'bg-emerald-600 shadow-emerald-100'
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Provisioning...' : 'Initialize Account'}
            </Button>

            <p className="text-center text-slate-400 text-xs font-medium">
              By initializing, you agree to our <a href="#" className="text-slate-900 font-bold hover:underline">Executive Terms</a>
            </p>
          </form>
        </Card>

        <div className="mt-8 text-center">
          <button 
            className="text-slate-400 hover:text-indigo-600 transition-all text-sm font-bold flex items-center justify-center gap-2 mx-auto group"
            onClick={() => navigate('/login')}
          >
            Already have an account? <span className="text-indigo-600 group-hover:underline">Login to Portal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
