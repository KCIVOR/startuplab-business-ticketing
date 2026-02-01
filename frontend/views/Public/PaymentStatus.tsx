
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { Order } from '../../types';
import { Card, Button } from '../../components/Shared';
import { ICONS } from '../../constants';
import QRCode from 'react-qr-code';

export const PaymentStatusView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<'checking' | 'success' | 'failed' | 'pending'>('checking');
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    const checkStatus = async () => {
      if (!sessionId) return;
      try {
        const data = await apiService.getOrderStatus(sessionId);
        if (data) {
          setOrder(data);
          if (data.status === 'PAID') {
            setStatus('success');
            const tix = await apiService.getTicketsByOrder(sessionId);
            setTickets(Array.isArray(tix) ? tix : []);
          } else if (data.status === 'FAILED') {
            setStatus('failed');
          } else if (data.status === 'PENDING_PAYMENT') {
            // For demo, treat pending as success after redirect
            setStatus('success');
            const tix = await apiService.getTicketsByOrder(sessionId);
            setTickets(Array.isArray(tix) ? tix : []);
          } else {
            setStatus('pending');
          }
        } else {
          setStatus('failed');
        }
      } catch (err) {
        console.error(err);
        setStatus('failed');
      }
    };
    
    checkStatus();
  }, [sessionId]);

  const renderContent = () => {
    switch (status) {
      case 'checking':
        return (
          <div className="flex flex-col items-center py-20">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <h2 className="text-xl font-bold">Verifying Payment...</h2>
            <p className="text-slate-500">Please do not refresh this page.</p>
          </div>
        );
      case 'success':
        return (
          <div className="flex flex-col items-center py-10 px-6 text-center">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
              <ICONS.CheckCircle className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-2">Payment Successful!</h1>
            <p className="text-slate-500 max-w-sm mb-8">
              Your registration order <strong>#{order?.orderId.substr(-6).toUpperCase()}</strong> is confirmed. A copy of your ticket has been sent to your email.
            </p>
            <div className="space-y-3 w-full max-w-xs">
              <Button className="w-full" size="lg" onClick={() => navigate(`/tickets/${sessionId}`)}>
                View Digital Ticket
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate('/events')}>
                Back to Events
              </Button>
            </div>

            {tickets.length > 0 && (
              <div className="w-full mt-10 text-left">
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Tickets</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {tickets.map((t) => (
                    <div key={t.ticketId} className="border border-slate-100 rounded-2xl p-4 bg-white shadow-sm flex flex-col items-center gap-3">
                      <QRCode value={t.qrPayload || t.ticketCode} size={140} />
                      <div className="text-xs text-slate-500 break-all text-center">
                        {t.ticketCode}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-600">{t.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case 'failed':
        return (
          <div className="flex flex-col items-center py-10 px-6 text-center">
            <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-2">Payment Failed</h1>
            <p className="text-slate-500 max-w-sm mb-8">
              We couldn't process your payment. Please try again or contact support if the issue persists.
            </p>
            <Button className="w-full max-w-xs" variant="primary" size="lg" onClick={() => navigate('/events')}>
              Try Again
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <Card className="shadow-2xl border-none">
        {renderContent()}
      </Card>
    </div>
  );
};
