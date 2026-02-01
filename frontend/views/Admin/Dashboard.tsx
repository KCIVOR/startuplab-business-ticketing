
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { AnalyticsSummary, UserRole } from '../../types';
import { Card, PageLoader } from '../../components/Shared';
import { ICONS } from '../../constants';

type Tx = {
  orderId: string;
  eventId?: string;
  buyerName?: string;
  totalAmount?: number;
  currency?: string;
  status?: string;
  created_at?: string;
};

const StatCard: React.FC<{ title: string, value: string | number, icon: React.ReactNode, trend?: string, color?: string }> = ({ title, value, icon, trend, color = 'indigo' }) => (
  <Card className="p-6">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-[#1F3A5F]/60 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-[#1F3A5F]">{value}</h3>
        {trend && (
          <p className={`text-xs mt-2 flex items-center ${trend.startsWith('+') ? 'text-[#2F80ED]' : 'text-[#1F3A5F]'}`}>
            <ICONS.TrendingUp className="w-3 h-3 mr-1" />
            {trend} from last month
          </p>
        )}
      </div>
      <div className={`p-3 bg-[#56CCF2]/20 text-[#2F80ED] rounded-xl`}>
        {icon}
      </div>
    </div>
  </Card>
);

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AnalyticsSummary | null>(null);
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [role, setRole] = React.useState<UserRole | null>(null);
  const isStaff = role === UserRole.STAFF;
  const basePath = isStaff ? '/staff' : '/admin';


  React.useEffect(() => {
    async function fetchRole() {
      try {
        const res = await fetch(`/api/user/role`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setRole(data?.[0]?.role || UserRole.ADMIN);
        } else {
          setRole(UserRole.ADMIN);
        }
      } catch {
        setRole(UserRole.ADMIN);
      }
    }
    fetchRole();
  }, []);

  React.useEffect(() => {
    if (role === UserRole.STAFF) {
      navigate('/staff/events', { replace: true });
    }
  }, [role, navigate]);

  React.useEffect(() => {
    if (!isStaff) {
      apiService.getAnalytics().then(data => {
        setStats(data);
        setLoading(false);
      });
      apiService.getRecentTransactions().then(data => {
        setTransactions(data || []);
        setTxLoading(false);
      }).catch(() => setTxLoading(false));
    }
  }, [isStaff]);

  if (isStaff) {
    return (
      <div className="p-20 text-center">
        <ICONS.CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4 opacity-20" />
        <h2 className="text-xl font-bold text-[#1F3A5F]/50">Restricted Access</h2>
        <p className="text-[#1F3A5F]/50 mt-2">Revenue reports are available for Administrators only.</p>
        <button 
          onClick={() => navigate(`${basePath}/events?role=${role}`)}
          className="mt-6 text-[#2F80ED] font-bold hover:underline"
        >
          Go to Operations Hub
        </button>
      </div>
    );
  }

  if (loading) return <PageLoader label="Loading enterprise reports..." variant="page" />;
  if (!stats) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-black text-[#1F3A5F] tracking-tight">Financial Performance</h1>
        <p className="text-[#1F3A5F]/60 font-medium">Organization-wide revenue and registration analytics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Total Registrations" 
          value={stats.totalRegistrations} 
          icon={<ICONS.Users className="w-6 h-6" />} 
          trend=""
        />
        <StatCard 
          title="Tickets Sold Today" 
          value={stats.ticketsSoldToday} 
          icon={<ICONS.Ticket className="w-6 h-6" />} 
          trend=""
        />
        <StatCard 
          title="Total Revenue" 
          value={`PHP ${stats.totalRevenue.toLocaleString()}`} 
          icon={<ICONS.CreditCard className="w-6 h-6" />} 
          trend=""
        />
        <StatCard 
          title="Revenue Today" 
          value={`PHP ${stats.revenueToday.toLocaleString()}`} 
          icon={<ICONS.CreditCard className="w-6 h-6" />} 
          trend=""
        />
        <StatCard 
          title="Attendance Rate" 
          value={`${stats.attendanceRate.toFixed(1)}%`} 
          icon={<ICONS.CheckCircle className="w-6 h-6" />} 
        />
        <StatCard 
          title="Payment Success" 
          value={`${stats.paymentSuccessRate.toFixed(1)}%`} 
          icon={<ICONS.TrendingUp className="w-6 h-6" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <Card className="p-6">
            <h3 className="font-bold text-lg mb-6 flex items-center">
              <ICONS.Calendar className="w-5 h-5 mr-2 text-[#2F80ED]" />
              All Transactions
            </h3>
            {txLoading ? (
              <div className="text-[#1F3A5F]/50 text-sm">Loading transactions...</div>
            ) : transactions.length === 0 ? (
              <div className="text-[#1F3A5F]/50 text-sm">No transactions yet.</div>
            ) : (
              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                {transactions.map((tx) => (
                  <div key={tx.orderId} className="flex gap-3 items-start pb-4 border-b border-[#F4F6F8] last:border-0">
                    <div className="w-10 h-10 rounded-full bg-[#F4F6F8] border border-[#F4F6F8] flex items-center justify-center text-[#1F3A5F]/50 flex-shrink-0">
                      <ICONS.Users className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#1F3A5F] truncate">{tx.buyerName || 'Paid Registration'}</p>
                      <p className="text-xs text-[#1F3A5F]/60 truncate">{tx.eventId || 'Event'} • {tx.created_at ? new Date(tx.created_at).toLocaleString() : ''}</p>
                      <span className={`inline-flex text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded mt-2 ${tx.status === 'PAID' ? 'bg-[#56CCF2]/20 text-[#2F80ED]' : 'bg-[#F4F6F8] text-[#1F3A5F]/60'}`}>
                        {tx.status || 'PENDING'}
                      </span>
                    </div>
                    <div className="ml-auto text-sm font-bold text-[#2F80ED] whitespace-nowrap">
                      {tx.currency || 'PHP'} {Number(tx.totalAmount || 0).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
         </Card>
         
         <Card className="p-8 flex flex-col items-center justify-center text-center border-dashed border-2 bg-[#56CCF2]/20/20 border-[#56CCF2]/40">
            <div className="w-20 h-20 bg-white shadow-xl shadow-[#2F80ED]/10 text-[#2F80ED] rounded-3xl flex items-center justify-center mb-6">
              <ICONS.Calendar className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-[#1F3A5F] mb-2">New Event Concept?</h3>
            <p className="text-[#1F3A5F]/60 text-sm max-w-xs mb-8 font-medium">Launch a new workshop or conference to drive organization revenue.</p>
            <button 
              onClick={() => navigate(`/events?openModal=true`)}
              className="bg-[#2F80ED] text-white px-8 py-3 rounded-2xl font-bold hover:bg-[#1F3A5F] transition-all shadow-xl shadow-[#2F80ED]/10 active:scale-95"
            >
              Configure Event
            </button>
         </Card>
      </div>
    </div>
  );
};
