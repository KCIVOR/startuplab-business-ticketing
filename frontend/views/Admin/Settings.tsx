
import React, { useState } from 'react';
import { Card, Button, Input, Badge, Modal } from '../../components/Shared';
import { ICONS } from '../../constants';
import { UserRole } from '../../types';
import { apiService } from '../../services/apiService';

// Refined granular permissions for staff as per developer brief
type PermissionCategory = 'view_events' | 'edit_events' | 'manual_checkin';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  perspective: UserRole;
  status: 'Active' | 'Inactive' | 'Pending';
  isOwner?: boolean;
  permissions: PermissionCategory[];
}

export const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'team' | 'permission' | 'payment' | 'workflow'>('team');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  React.useEffect(() => {
    const API = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000';
    fetch(`${API}/api/users/all`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        const mapped = Array.isArray(data)
          ? data.map(u => ({
              id: u.userId,
              name: u.name || '',
              email: u.email,
              role: u.role || '',
              perspective: u.role === 'STAFF' ? UserRole.STAFF : UserRole.ADMIN,
              permissions: [
                ...(u.canViewEvents ? ['view_events'] : []),
                ...(u.canEditEvents ? ['edit_events'] : []),
                ...(u.canManualCheckIn ? ['manual_checkin'] : [])
              ],
            }))
          : [];
        const sorted = mapped.sort((a, b) => {
          const aIsAdmin = a.perspective === UserRole.ADMIN;
          const bIsAdmin = b.perspective === UserRole.ADMIN;
          if (aIsAdmin === bIsAdmin) return a.name.localeCompare(b.name);
          return aIsAdmin ? -1 : 1;
        });
        setTeamMembers(sorted);
      });
  }, []);

  const [inviteData, setInviteData] = useState({
    name: '',
    email: '',
    role: 'STAFF',
    perspective: UserRole.STAFF,
    permissions: ['view_events'] as PermissionCategory[]
  });

  const toggleMemberPermission = async (memberId: string, perm: PermissionCategory) => {
    const target = teamMembers.find(m => m.id === memberId && m.perspective === UserRole.STAFF);
    if (!target) return;
    const hasPerm = target.permissions.includes(perm);
    const nextPerms = hasPerm
      ? target.permissions.filter(p => p !== perm)
      : [...target.permissions, perm];

    // Optimistic update
    setTeamMembers(prev => prev.map(m => m.id === memberId ? { ...m, permissions: nextPerms } : m));

    const payload = {
      canViewEvents: nextPerms.includes('view_events'),
      canEditEvents: nextPerms.includes('edit_events'),
      canManualCheckIn: nextPerms.includes('manual_checkin'),
    };

    try {
      await apiService.updateUserPermissions(memberId, payload);
    } catch (err) {
      // rollback on failure
      setTeamMembers(prev => prev.map(m => m.id === memberId ? { ...m, permissions: target.permissions } : m));
      console.error('Failed to update permissions', err);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const API = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000';
    const res = await fetch(`${API}/api/invite/create-and-send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: inviteData.email,
        role: UserRole.STAFF,
        name: inviteData.name,
      })
    });
    if (!res.ok) {
      return;
    }
    const newMember: TeamMember = {
      id: Math.random().toString(36).substr(2, 9),
      name: inviteData.name,
      email: inviteData.email,
      role: 'STAFF',
      perspective: UserRole.STAFF,
      status: 'Pending',
      permissions: inviteData.permissions
    };
    setTeamMembers(prev => [...prev, newMember]);
    setInviteData({ name: '', email: '', role: 'STAFF', perspective: UserRole.STAFF, permissions: ['view_events'] });
    setIsInviteModalOpen(false);
  };

  const PermissionShield: React.FC<{ active?: boolean, onClick?: () => void, disabled?: boolean }> = ({ active = false, onClick, disabled = false }) => (
    <button 
      type="button"
      onClick={disabled ? undefined : onClick}
      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
        disabled 
          ? 'text-indigo-600 bg-indigo-50/50 cursor-not-allowed opacity-50' 
          : active 
            ? 'text-white bg-indigo-600 shadow-lg shadow-indigo-100 scale-105 active:scale-95' 
            : 'text-slate-200 bg-slate-50 hover:bg-slate-100 hover:text-slate-400 active:scale-95'
      }`}
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    </button>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Organizational Settings</h1>
          <p className="text-slate-500 font-medium text-sm mt-1 text-balance">Configure organizational parameters and visualize system architecture.</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm self-start md:self-auto shrink-0">
          {[
            { id: 'team', label: 'Team' },
            { id: 'permission', label: 'Access Control' },
            { id: 'payment', label: 'HitPay Engine' },
            { id: 'workflow', label: 'System Workflow' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        {activeTab === 'team' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
               <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Executive Directory</h3>
               <Button size="sm" className="rounded-xl px-4 py-2" onClick={() => setIsInviteModalOpen(true)}>
                 <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                   <ICONS.Users className="w-3.5 h-3.5" />
                   Invite Associate
                 </span>
               </Button>
            </div>
            <Card className="overflow-hidden border-slate-200 rounded-[2.5rem] shadow-sm bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="px-10 py-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Full Name / Identity</th>
                      <th className="px-10 py-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Position</th>
                                          </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {teamMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-50/50 transition-all group">
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-5">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-lg shadow-lg ${member.isOwner ? 'bg-orange-600 shadow-orange-100' : 'bg-slate-800 shadow-slate-100'}`}>
                              {member.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <div className="font-black text-slate-900 text-[15px] tracking-tight">{member.name}</div>
                                {member.isOwner && (
                                  <div className="bg-[#1E293B] text-white text-[8px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest">owner</div>
                                )}
                              </div>
                              <div className="text-[12px] text-slate-400 font-bold tracking-tight">{member.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                           <div className="text-[13px] font-black text-slate-700 uppercase tracking-widest">{member.role}</div>
                           <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">{member.perspective} HUB</div>
                        </td>
                                              </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'permission' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
               <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Personnel Access Matrix</h3>
               <Badge type="info" className="font-black text-[9px] tracking-widest uppercase">LIMIT STAFF CAPABILITIES</Badge>
            </div>
            <Card className="overflow-hidden border-slate-200 rounded-[2.5rem] shadow-sm bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="px-10 py-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Personnel Name</th>
                      <th className="px-6 py-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">View Events</th>
                      <th className="px-6 py-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Edit Events</th>
                      <th className="px-6 py-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Manual Check-in</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {teamMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-50/50 transition-all group">
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-5">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-md ${member.isOwner ? 'bg-orange-600' : 'bg-slate-800'}`}>
                              {member.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <div className="font-black text-slate-900 text-[14px] tracking-tight">{member.name}</div>
                              </div>
                              <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{member.role}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-8">
                          <div className="flex justify-center">
                            <PermissionShield active={member.permissions.includes('view_events')} disabled={member.perspective === UserRole.ADMIN} onClick={() => toggleMemberPermission(member.id, 'view_events')} />
                          </div>
                        </td>
                        <td className="px-6 py-8">
                          <div className="flex justify-center">
                            <PermissionShield active={member.permissions.includes('edit_events')} disabled={member.perspective === UserRole.ADMIN} onClick={() => toggleMemberPermission(member.id, 'edit_events')} />
                          </div>
                        </td>
                        <td className="px-6 py-8">
                          <div className="flex justify-center">
                            <PermissionShield active={member.permissions.includes('manual_checkin')} disabled={member.perspective === UserRole.ADMIN} onClick={() => toggleMemberPermission(member.id, 'manual_checkin')} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'payment' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">HitPay Infrastructure</h3>
                <Badge type="success" className="font-black text-[9px] tracking-widest px-3 py-1">LIVE PRODUCTION</Badge>
              </div>
              <Card className="p-10 border-none shadow-sm ring-1 ring-slate-200 rounded-[3rem] bg-white">
                <div className="flex items-center gap-6 mb-12">
                   <div className="w-24 h-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center shadow-sm p-4">
                      <img src="https://www.hitpayapp.com/static/media/hitpay-logo.0f074558.png" alt="HitPay" className="h-4 object-contain" />
                   </div>
                   <div>
                     <h4 className="text-2xl font-black text-slate-900 tracking-tighter">Secure Checkout</h4>
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Global Payment Processing Engine</p>
                </div>
              </div>
                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Business API Key</label>
                    <div className="relative">
                      <input type="password" value="••••••••••••••••••••••••••••••••" readOnly className="w-full px-8 py-5 bg-slate-50/50 border border-slate-100 rounded-[1.5rem] text-sm font-bold text-slate-400" />
                      <button className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800">Rotate</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Salt Checksum</label>
                      <input type="password" value="••••••••••••" readOnly className="w-full px-8 py-5 bg-slate-50/50 border border-slate-100 rounded-[1.5rem] text-sm font-bold text-slate-400" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Market Currency</label>
                      <select className="w-full px-8 py-5 bg-white border border-slate-200 rounded-[1.5rem] text-sm font-bold text-slate-900 outline-none">
                        <option>PHP (Philippine Peso)</option>
                        <option>SGD (Singapore Dollar)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
            <div className="space-y-8">
               <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Secure Webhook</h3>
               <Card className="p-8 border-slate-200 rounded-[2.5rem] bg-slate-50/50">
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Callback URL</p>
                      <div className="bg-white px-5 py-4 rounded-xl border border-slate-200 text-[11px] font-mono text-slate-500 break-all leading-relaxed shadow-sm">
                        https://api.startuplab.co/v1/payments/hitpay/callback
                      </div>
                    </div>
                  </div>
               </Card>
            </div>
          </div>
        )}

        {/* HIGH-FIDELITY SYSTEM FLOWCHART VISUALIZATION */}
        {activeTab === 'workflow' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex items-center justify-between">
               <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">End-to-End Architecture Flow</h3>
               <Badge type="info" className="font-black text-[9px] tracking-widest px-3 py-1">REAL-TIME SYSTEM MAP</Badge>
            </div>

            <div className="relative bg-white rounded-[3rem] p-10 lg:p-16 border border-slate-100 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.03)] overflow-hidden">
               {/* Background grid for aesthetic */}
               <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
               
               <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-20">
                  
                  {/* TRACK 1: ADMIN ENGINE */}
                  <div className="space-y-12">
                     <div className="text-center pb-4 border-b border-slate-100">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em]">Admin Engine</span>
                     </div>
                     <div className="space-y-12 relative">
                        {/* Node: Event Creation */}
                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-sm relative z-10">
                           <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-100">
                              <ICONS.Calendar className="w-5 h-5" />
                           </div>
                           <h4 className="font-black text-slate-900 text-sm tracking-tight mb-2 uppercase">WYSIWYG Setup</h4>
                           <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Admin launches event via Live Preview portal. Metadata stored in Secure Storage.</p>
                        </div>

                        {/* Node: Inventory Control */}
                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-sm relative z-10">
                           <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center mb-4 shadow-lg">
                              <ICONS.Settings className="w-5 h-5" />
                           </div>
                           <h4 className="font-black text-slate-900 text-sm tracking-tight mb-2 uppercase">Ticket Inventory</h4>
                           <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Pricing, capacity, and sales end-dates configured per tier (Free vs Paid).</p>
                        </div>

                        {/* Connector Line to Track 2 */}
                        <div className="hidden lg:block absolute -right-12 top-1/2 w-24 h-px bg-gradient-to-r from-slate-200 to-indigo-400"></div>
                     </div>
                  </div>

                  {/* TRACK 2: PUBLIC JOURNEY & GATEWAY */}
                  <div className="space-y-12">
                     <div className="text-center pb-4 border-b border-slate-100">
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em]">Public Journey</span>
                     </div>
                     <div className="space-y-12 relative">
                        {/* Node: Registration */}
                        <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-xl shadow-slate-100 relative z-10 transform scale-105">
                           <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-100">
                              <ICONS.Users className="w-5 h-5" />
                           </div>
                           <h4 className="font-black text-slate-900 text-sm tracking-tight mb-2 uppercase">Registration Form</h4>
                           <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Attendee selects tickets and enters identification details.</p>
                        </div>

                        {/* Node: HitPay Gateway */}
                        <div className="bg-indigo-900 p-8 rounded-[2rem] border-4 border-indigo-400 shadow-2xl relative z-10 overflow-hidden group">
                           <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 blur-3xl rounded-full"></div>
                           <div className="flex items-center gap-4 mb-4">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg p-2">
                                 <img src="https://www.hitpayapp.com/static/media/hitpay-logo.0f074558.png" alt="" className="h-2" />
                              </div>
                              <h4 className="font-black text-white text-[12px] uppercase tracking-widest">HitPay Tunnel</h4>
                           </div>
                           <p className="text-[11px] text-indigo-200 font-bold leading-relaxed mb-4">External secure session initialization for real-time fund capture.</p>
                           <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Active Verification</span>
                           </div>
                        </div>

                        {/* Connector Line to Track 3 */}
                        <div className="hidden lg:block absolute -right-12 top-1/2 w-24 h-px bg-gradient-to-r from-indigo-400 to-slate-200"></div>
                     </div>
                  </div>

                  {/* TRACK 3: OPERATIONAL CORE */}
                  <div className="space-y-12">
                     <div className="text-center pb-4 border-b border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Operational Core</span>
                     </div>
                     <div className="space-y-12 relative">
                        {/* Node: Digital Delivery */}
                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-sm relative z-10">
                           <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center mb-4 shadow-lg">
                              <ICONS.CreditCard className="w-5 h-5" />
                           </div>
                           <h4 className="font-black text-slate-900 text-sm tracking-tight mb-2 uppercase">Digital Ticket</h4>
                           <p className="text-[11px] text-slate-500 font-medium leading-relaxed">System generates unique UUID + QR code hash for the confirmed guest.</p>
                        </div>

                        {/* Node: Entry Control */}
                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-sm relative z-10">
                           <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-100">
                              <ICONS.CheckCircle className="w-5 h-5" />
                           </div>
                           <h4 className="font-black text-slate-900 text-sm tracking-tight mb-2 uppercase">QR Check-In</h4>
                           <p className="text-[11px] text-slate-500 font-medium leading-relaxed">On-site Staff Hub scans QR or manually verifies identity to grant entry.</p>
                        </div>
                     </div>
                  </div>

               </div>

               {/* Central Database Icon positioned at bottom */}
               <div className="mt-20 flex justify-center relative">
                  <div className="absolute top-[-40px] w-px h-10 bg-slate-200"></div>
                  <div className="bg-white px-8 py-4 rounded-2xl border-2 border-slate-100 shadow-xl flex items-center gap-4">
                     <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                        <ICONS.Layout className="w-4 h-4" />
                     </div>
                     <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Central Registry / Storage</span>
                  </div>
               </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-[2rem] p-8 flex gap-6">
               <div className="w-12 h-12 bg-white text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-indigo-100">
                  <ICONS.TrendingUp className="w-6 h-6" />
               </div>
               <div className="space-y-1">
                  <h5 className="text-[13px] font-black text-indigo-900 uppercase tracking-tight">System Integrity Report</h5>
                  <p className="text-[12px] text-indigo-700 font-medium leading-relaxed">
                     Every node in the journey is connected via the **apiService** abstraction, ensuring that data consistency is maintained between the Public Front, the HitPay Secure Tunnel, and the Admin Operation Hub.
                  </p>
               </div>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} title="Invite Staff Personnel">
        <form onSubmit={handleInviteSubmit} className="space-y-8">
          <div className="space-y-5">
            <Input label="Personnel Name" placeholder="e.g. Jordan Miller" required className="py-4 px-6 rounded-2xl bg-slate-50 border-slate-100" value={inviteData.name} onChange={(e: any) => setInviteData({...inviteData, name: e.target.value})} />
            <Input label="Work Email" type="email" placeholder="j.miller@startuplab.co" required className="py-4 px-6 rounded-2xl bg-slate-50 border-slate-100" value={inviteData.email} onChange={(e: any) => setInviteData({...inviteData, email: e.target.value})} />
            <Input label="Assigned Position" value="STAFF" disabled className="py-4 px-6 rounded-2xl bg-slate-100 border-slate-100 text-slate-400" />
          </div>
          <div className="pt-6 flex gap-4">
            <Button variant="outline" className="flex-1 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest" onClick={() => setIsInviteModalOpen(false)}>Discard</Button>
            <Button type="submit" className="flex-[2] py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-indigo-100">Generate Invite</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
