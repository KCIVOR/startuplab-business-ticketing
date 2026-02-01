
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { RegistrationView, UserRole } from '../../types';
import { Card } from '../../components/Shared';
import { ICONS } from '../../constants';
import { useUser } from '../../context/UserContext';

export const RegistrationsList: React.FC = () => {
  const [regs, setRegs] = useState<RegistrationView[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [searchParams] = useSearchParams();
  const { role } = useUser();
  const isStaff = role === UserRole.STAFF;
  const eventId = searchParams.get('eventId');
  const itemsPerPage = 10;
  const isServerPaged = !eventId;

  const filteredRegs = regs.filter(r => 
    (r.attendeeName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (r.attendeeEmail?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const totalPages = isServerPaged
    ? Math.max(1, pagination.totalPages || 1)
    : Math.max(1, Math.ceil(filteredRegs.length / itemsPerPage));

  const pagedRegs = useMemo(() => {
  if (isServerPaged) return filteredRegs;
  const start = (currentPage - 1) * itemsPerPage;
  return filteredRegs.slice(start, start + itemsPerPage);
}, [filteredRegs, currentPage, itemsPerPage, isServerPaged]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (eventId) {
          const data = await apiService.getEventRegistrations(eventId);
          setRegs(data);
          setPagination({
            page: 1,
            limit: itemsPerPage,
            total: data.length,
            totalPages: Math.max(1, Math.ceil(data.length / itemsPerPage))
          });
        } else {
          const { registrations, pagination: serverPagination } = await apiService.getAllRegistrations(currentPage, itemsPerPage);
          setRegs(registrations || []);
          setPagination(serverPagination || {
            page: 1,
            limit: itemsPerPage,
            total: 0,
            totalPages: 1
          });
        }
      } catch (error) {
        console.error('Error fetching registrations:', error);
      } finally {
        setLoading(false);
      }
    };
    if (eventId || isServerPaged) {
      fetchData();
    }
  }, [eventId, currentPage, isServerPaged, itemsPerPage]);

  useEffect(() => {
    console.log('Pagination state updated:', {
      currentPage,
      pagination,
      totalPages,
      isServerPaged,
      regsLength: regs?.length || 0
    });
  }, [pagination, currentPage, totalPages, isServerPaged, regs]);

  const handlePageChange = (page: number) => {
  setCurrentPage(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

  const handleCheckIn = async (reg: RegistrationView) => {
    try {
      const result = await apiService.checkInTicket(reg.ticketCode);
      setRegs(prev => prev.map(r => r.id === reg.id ? { ...r, status: 'USED', checkInTimestamp: result?.usedAt || new Date().toISOString() } : r));
    } catch (err) {
      // no-op for now; could add toast/alert
    }
  };



  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, eventId]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Attendee Directory</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">
            {isStaff ? 'Operations: Verifying registrations and managing check-ins.' : 'Full visibility of confirmed registrations and financial transactions.'}
          </p>
        </div>
        <div className="w-full md:w-80">
          <div className="relative group">
             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300">
               <ICONS.Search className="h-4 w-4" strokeWidth={3} />
             </div>
             <input 
              type="text" 
              placeholder="Search directory..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all"
             />
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm rounded-2xl bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Attendee</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ticket Information</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {pagedRegs.map((reg, index) => {
                const isCheckedIn = reg.status === 'USED';
                const rowKey = reg.id ?? reg.ticketCode ?? `${reg.eventId}-${reg.orderId}-${index}`;
                
                return (
                  <tr key={rowKey} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-[15px] text-slate-900 tracking-tight">{reg.attendeeName}</span>
                        <span className="text-[12px] text-slate-400 font-medium mt-0.5">{reg.attendeeEmail}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-[14px] font-bold text-slate-800">{reg.eventName}</span>
                        <span className="text-[12px] text-slate-400 font-medium mt-0.5">{reg.ticketName}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                        isCheckedIn 
                          ? 'bg-emerald-50 text-emerald-600' 
                          : 'bg-indigo-50 text-indigo-600'
                      }`}>
                        {isCheckedIn ? 'CHECKED_IN' : 'ISSUED'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[15px] font-black text-slate-900 tracking-tighter">
                        {reg.currency} {(reg.amountPaid ?? 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {!isCheckedIn ? (
                          <button 
                            onClick={() => handleCheckIn(reg)}
                            className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.15em] hover:text-slate-900 transition-colors"
                          >
                            MANUAL CHECK-IN
                          </button>
                      ) : (
                        <span className="text-[12px] font-bold text-slate-300 italic tracking-tight">Arrived</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredRegs.length === 0 && !loading && (
          <div className="py-24 text-center">
            <ICONS.Users className="w-12 h-12 text-slate-100 mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No active attendees found.</p>
          </div>
        )}
      </Card>
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <div className="flex items-center gap-2 px-2 py-1 bg-white rounded-[1.5rem] border border-slate-100 shadow-sm">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => handlePageChange(i + 1)}
                className={`w-10 h-10 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                  currentPage === i + 1
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                    : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
