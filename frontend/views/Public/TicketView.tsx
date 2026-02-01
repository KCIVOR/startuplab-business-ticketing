
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { RegistrationView } from '../../types';
import { Card, Badge, Button } from '../../components/Shared';
import { ICONS } from '../../constants';

export const TicketView: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<RegistrationView | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ticketId) {
      apiService.getTicketDetails(ticketId).then(data => {
        setTicket(data);
        setLoading(false);
      });
    }
  }, [ticketId]);

  if (loading) return <div className="p-20 text-center">Loading ticket...</div>;
  if (!ticket) return <div className="p-20 text-center">Ticket not found.</div>;

  const isCheckedIn = ticket.status === 'USED';

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-black text-slate-900 mb-2">Your Digital Ticket</h1>
        <p className="text-slate-500 text-sm">Present this QR code at the event entrance for check-in.</p>
      </div>

      <Card className="shadow-2xl overflow-visible relative">
        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-50 border border-slate-200"></div>
        <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-50 border border-slate-200"></div>

        <div className="p-6 text-center border-b border-dashed border-slate-200 pb-10">
          <Badge type={isCheckedIn ? 'success' : 'info'} className="mb-4">
            {isCheckedIn ? 'CHECKED IN' : 'VALID TICKET'}
          </Badge>
          <h2 className="text-xl font-black text-slate-900 line-clamp-2 mb-2">{ticket.eventName}</h2>
          <p className="text-slate-500 text-sm mb-6 uppercase tracking-widest font-semibold">{ticket.ticketName}</p>
          
          <div className="bg-white p-4 inline-block rounded-xl border border-slate-100 shadow-sm mx-auto mb-4">
             {/* Mocking QR code with SVG */}
             <div className="w-48 h-48 bg-slate-50 flex items-center justify-center border border-slate-200 rounded-lg">
                <svg className="w-40 h-40 text-slate-900" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 3h4v4H3V3zm0 7h4v4H3v-4zm0 7h4v4H3v-4zm7-14h4v4h-4V3zm0 7h4v4h-4v-4zm0 7h4v4h-4v-4zm7-14h4v4h-4V3zm0 7h4v4h-4v-4zm0 7h4v4h-4v-4zM5 5h0v0H5V5zm0 7h0v0H5v-0zm0 7h0v0H5v-0zm7-14h0v0h-0V3zm0 7h0v0h-0v-4zm0 7h0v0h-0v-4zm7-14h0v0h-0V3zm0 7h0v0h-0v-4zm0 7h0v0h-0v-4z" />
                </svg>
             </div>
             <p className="text-xs font-mono text-slate-400 mt-2">{ticket.ticketCode}</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center text-sm">
             <span className="text-slate-400 font-medium">Attendee</span>
             <span className="text-slate-900 font-bold">{ticket.attendeeName}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
             <span className="text-slate-400 font-medium">Order ID</span>
             <span className="text-slate-900 font-mono font-bold">#{ticket.orderId.substr(-6).toUpperCase()}</span>
          </div>
           <div className="flex justify-between items-center text-sm">
             <span className="text-slate-400 font-medium">Status</span>
             <span className="text-emerald-600 font-bold">Paid</span>
          </div>
        </div>
      </Card>

      <div className="mt-8 flex flex-col gap-3">
        <Button variant="secondary" className="w-full" onClick={() => window.print()}>
          Download PDF
        </Button>
        <Button variant="ghost" className="w-full" onClick={() => navigate('/events')}>
          Back to Events
        </Button>
      </div>
    </div>
  );
};
