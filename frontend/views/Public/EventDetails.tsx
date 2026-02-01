
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { Event, TicketType } from '../../types';
import { Button, Card } from '../../components/Shared';
import { ICONS } from '../../constants';

// Helper to handle JSONB image format
const getImageUrl = (img: any): string => {
  if (!img) return 'https://via.placeholder.com/800x400';
  if (typeof img === 'string') return img;
  return img.url || img.path || img.publicUrl || 'https://via.placeholder.com/800x400';
};

// Formatting helpers (use event timezone)
const formatDate = (iso: string, timezone?: string, opts?: Intl.DateTimeFormatOptions) => {
  try {
    return new Intl.DateTimeFormat('en-GB', { timeZone: timezone || 'UTC', ...opts }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleString();
  }
};

const formatRange = (startAt?: string, endAt?: string, timezone?: string) => {
  if (!startAt) return '';
  const startDate = new Date(startAt);
  const startStr = `${formatDate(startAt, timezone, { dateStyle: 'medium' })} ${formatDate(startAt, timezone, { timeStyle: 'short' })}`;
  if (!endAt) return startStr;
  const endDate = new Date(endAt);
  const sameDay = startDate.toDateString() === endDate.toDateString();
  if (sameDay) {
    const endTime = formatDate(endAt, timezone, { timeStyle: 'short' });
    return `${startStr} – ${endTime}`;
  }
  const endStr = `${formatDate(endAt, timezone, { dateStyle: 'medium' })} ${formatDate(endAt, timezone, { timeStyle: 'short' })}`;
  return `${startStr} → ${endStr}`;
};

export const EventDetails: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (slug) {
      apiService.getEventBySlug(slug).then(data => {
        setEvent(data);
        if (data && data.ticketTypes.length > 0) {
          const initialQuantities: Record<string, number> = {};
          data.ticketTypes.forEach(t => { initialQuantities[t.ticketTypeId] = 0; });
          setQuantities(initialQuantities);
        }
        setLoading(false);
      });
    }
  }, [slug]);

  if (loading) return <div className="p-20 text-center text-slate-400">Syncing event profile...</div>;
  if (!event) return <div className="p-20 text-center text-slate-400">Session not found.</div>;

  const updateQuantity = (ticketTypeId: string, change: number, available: number) => {
    setQuantities(prev => ({
      ...prev,
      [ticketTypeId]: Math.max(0, Math.min((Number(prev[ticketTypeId]) || 0) + change, available))
    }));
  };

  const totalQuantity = (Object.values(quantities) as number[]).reduce((acc: number, q: number) => acc + q, 0);
  const grandTotal = event.ticketTypes.reduce((acc: number, t: TicketType) => acc + (t.priceAmount * (Number(quantities[t.ticketTypeId]) || 0)), 0);

  // Registration window
  const now = new Date();
  const regOpen = event.regOpenAt ? new Date(event.regOpenAt) : null;
  const regClose = event.regCloseAt ? new Date(event.regCloseAt) : null;
  let regState = '';
  if (regOpen && now < regOpen) {
    regState = `Opens ${formatDate(regOpen.toISOString(), event.timezone, { year: 'numeric', month: 'short', day: 'numeric' })}`;
  } else if (regClose && now > regClose) {
    regState = 'Registration closed';
  } else if (regClose) {
    regState = `Closes ${formatDate(regClose.toISOString(), event.timezone, { year: 'numeric', month: 'short', day: 'numeric' })}`;
  }

  const handleRegister = () => {
    if (totalQuantity > 0) {
      const selections = event.ticketTypes.filter(t => (Number(quantities[t.ticketTypeId]) || 0) > 0).map(t => ({
        id: t.ticketTypeId,
        qty: Number(quantities[t.ticketTypeId])
      }));
      const selectionParam = encodeURIComponent(JSON.stringify(selections));
      navigate(`/events/${event.slug}/register?selections=${selectionParam}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 lg:py-16 animate-in fade-in duration-700">
      <div className="mb-8">
        <button 
          onClick={() => navigate('/')} 
          className="text-indigo-600 hover:text-indigo-800 text-[11px] font-black tracking-widest uppercase flex items-center mb-10 gap-2 group transition-colors"
        >
          <svg className="w-4 h-4 rotate-180 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
          BACK TO EXPLORATIONS
        </button>

        <div className="flex flex-col lg:flex-row gap-16 items-start">
          <div className="flex-1 space-y-10">
            {/* Visual Header */}
            <div className="overflow-hidden rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] ring-1 ring-slate-200">
              <img 
                src={getImageUrl(event.imageUrl)}
                alt={event.eventName} 
                className="w-full aspect-video object-cover" 
              />
            </div>

            {/* Event Profile */}
            <div>
              <h1 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter mb-6 leading-tight">
                {event.eventName}
              </h1>
              <div className="flex flex-wrap gap-4 mb-12">
                <div className="flex items-center text-slate-700 bg-white px-6 py-3 rounded-2xl border border-slate-200 text-[13px] font-black shadow-sm">
                  <ICONS.Calendar className="w-4 h-4 mr-3 text-indigo-600" />
                  {formatRange(event.startAt, event.endAt, event.timezone)}
                </div>
                <div className="flex items-center text-slate-700 bg-white px-6 py-3 rounded-2xl border border-slate-200 text-[13px] font-black shadow-sm">
                  <ICONS.MapPin className="w-4 h-4 mr-3 text-indigo-600" />
                  {event.locationText}
                </div>
                <div className="flex items-center text-slate-700 bg-white px-4 py-2 rounded-2xl border border-slate-200 text-[12px] font-black shadow-sm">
                  {event.locationType}
                </div>
                <div className="flex items-center text-slate-700 bg-white px-4 py-2 rounded-2xl border border-slate-200 text-[12px] font-black shadow-sm">
                  STATUS: {event.status}
                </div>
                <div className="flex items-center text-slate-700 bg-white px-4 py-2 rounded-2xl border border-slate-200 text-[12px] font-black shadow-sm">
                  CAPACITY: {event.capacityTotal}
                </div>
                {event.timezone && (
                  <div className="flex items-center text-slate-700 bg-white px-4 py-2 rounded-2xl border border-slate-200 text-[12px] font-black shadow-sm">
                    TZ: {event.timezone}
                  </div>
                )}
                {regState && (
                  <div className="flex items-center text-slate-700 bg-white px-4 py-2 rounded-2xl border border-slate-200 text-[12px] font-black shadow-sm">
                    {regState}
                  </div>
                )}
              </div>

              <div className="p-10 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-6">EVENT OVERVIEW</h3>
                <p className="text-slate-600 leading-relaxed text-lg font-medium whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            </div>
          </div>

          {/* Secure Access Sidebar */}
          <div className="w-full lg:w-[420px] shrink-0">
            <Card className="p-10 sticky top-10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] border-none ring-1 ring-slate-200 rounded-[3rem] bg-white">
              <h2 className="text-2xl font-black text-slate-900 mb-10 tracking-tight">
                Secure Access
              </h2>
              
              <div className="space-y-6 mb-12">
                {event.ticketTypes.map(ticket => {
                  const qty = quantities[ticket.ticketTypeId] || 0;
                  const available = ticket.quantityTotal - ticket.quantitySold;
                  const isSoldOut = available <= 0;

                  return (
                    <div 
                      key={ticket.ticketTypeId}
                      className={`p-8 rounded-[2rem] border-2 transition-all duration-500 ${
                        qty > 0 ? 'border-indigo-600 bg-indigo-50/20' : 'border-slate-50 bg-white hover:border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-black text-slate-900 text-[13px] uppercase tracking-wider">{ticket.name}</span>
                        <span className={`text-white text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${isSoldOut ? 'bg-rose-500' : 'bg-emerald-500'}`}>
                          {isSoldOut ? 'SOLD OUT' : 'AVAILABLE'}
                        </span>
                      </div>
                      <div className="text-2xl font-black text-slate-900 mb-8 tracking-tighter">
                        {ticket.priceAmount === 0 ? 'FREE' : `PHP ${ticket.priceAmount.toLocaleString()}.00`}
                      </div>
                      
                      <div className="pt-6 border-t border-slate-100/50 flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">QUANTITY</span>
                        <div className="flex items-center gap-5">
                          <button 
                            onClick={() => updateQuantity(ticket.ticketTypeId, -1, available)}
                            disabled={qty === 0}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                              qty > 0 ? 'hover:bg-slate-100 text-slate-900 border border-slate-200' : 'text-slate-200 cursor-not-allowed'
                            }`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M20 12H4"/></svg>
                          </button>
                          <span className="font-black text-xl text-slate-900 w-4 text-center">{qty}</span>
                          <button 
                            onClick={() => updateQuantity(ticket.ticketTypeId, 1, available)}
                            disabled={isSoldOut || qty >= available}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl text-white transition-all shadow-lg shadow-slate-200 ${
                              isSoldOut || qty >= available ? 'bg-slate-300 cursor-not-allowed' : 'bg-slate-950 hover:bg-indigo-600'
                            }`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M12 4v16m8-8H4"/></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-6">
                <Button 
                  className="w-full py-6 rounded-[1.5rem] shadow-2xl shadow-indigo-100 font-black text-xl transition-all hover:scale-[1.02] bg-indigo-600 text-white" 
                  disabled={totalQuantity === 0}
                  onClick={handleRegister}
                >
                  {totalQuantity === 0 ? 'Select Tickets' : `Reserve Access`}
                </Button>
                <div className="flex items-center justify-center gap-3 opacity-30">
                   <ICONS.CreditCard className="w-4 h-4" />
                   <p className="text-[10px] text-center font-black uppercase tracking-[0.4em] text-slate-900">
                    SECURE HITPAY CHECKOUT
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
