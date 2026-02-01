import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { Event } from '../../types';
import { Card, Button } from '../../components/Shared';
import { ICONS } from '../../constants';

// Helper to handle JSONB image format
const getImageUrl = (img: any): string => {
  if (!img) return 'https://via.placeholder.com/800x400';
  if (typeof img === 'string') return img;
  return img.url || img.path || img.publicUrl || 'https://via.placeholder.com/800x400';
};

// Date/time formatting with event timezone
const formatDate = (iso: string, timezone?: string, opts?: Intl.DateTimeFormatOptions) => {
  try {
    return new Intl.DateTimeFormat('en-GB', { timeZone: timezone || 'UTC', ...opts }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleString();
  }
};

const formatStartForCard = (startAt: string, timezone?: string) => {
  const d = formatDate(startAt, timezone, { month: 'short', day: 'numeric' });
  const t = formatDate(startAt, timezone, { hour: '2-digit', minute: '2-digit' });
  return `${d} • ${t}`;
};

const EventCard: React.FC<{ event: Event }> = ({ event }) => {
  const navigate = useNavigate();
  // Safe calculation for minPrice if ticketTypes exist
  const minPrice = event.ticketTypes?.length 
    ? Math.min(...event.ticketTypes.map(t => t.priceAmount)) 
    : 0;
  
  // Registration window label
  const now = new Date();
  const regOpen = event.regOpenAt ? new Date(event.regOpenAt) : null;
  const regClose = event.regCloseAt ? new Date(event.regCloseAt) : null;
  const regLabel = regOpen && now < regOpen
    ? `Opens ${formatDate(regOpen.toISOString(), event.timezone, { year: 'numeric', month: 'short', day: 'numeric' })}`
    : regClose
      ? `Closes ${formatDate(regClose.toISOString(), event.timezone, { year: 'numeric', month: 'short', day: 'numeric' })}`
      : '';
  
  return (
    <Card 
      className="flex flex-col h-full group cursor-pointer border-none shadow-[0_10px_40px_-10px_rgba(0,0,0,0.06)] hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12)] transition-all duration-700 rounded-[2rem] overflow-hidden bg-white"
      onClick={() => navigate(`/events/${event.slug}`)}
    >
      {/* Image Section */}
      <div className="relative h-60 overflow-hidden">
        <img 
          src={getImageUrl(event.imageUrl)}
          alt={event.eventName} 
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-80"></div>
        
        <div className="absolute top-5 right-5">
          <div className="bg-[#10B981]/15 backdrop-blur-md px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-400/20 text-[#10B981]">
            {event.status}
          </div>
        </div>
        <div className="absolute top-5 left-5">
          <div className="bg-white/70 backdrop-blur-md px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/40 text-slate-900">
            {event.locationType}
          </div>
        </div>

        <div className="absolute bottom-6 left-8 right-8">
           <h4 className="text-white text-xl font-black tracking-tight leading-tight line-clamp-2 drop-shadow-sm">
             {event.eventName}
           </h4>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-8 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-5">
           <div className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.15em] flex items-center gap-1.5">
             <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
             {event.registrationCount ?? 0} REGISTERED / {event.capacityTotal} SLOTS
           </div>
        </div>
        
        <p className="text-slate-400 text-[14px] font-medium line-clamp-2 mb-8 leading-relaxed opacity-80">
          {event.description}
        </p>
        
        <div className="mt-auto space-y-4 mb-8">
          <div className="flex items-center text-[10px] font-black text-slate-600 uppercase tracking-[0.25em]">
            <ICONS.Calendar className="w-4 h-4 mr-3 text-indigo-500 shrink-0" />
            {formatStartForCard(event.startAt, event.timezone)}
          </div>
          <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            <ICONS.MapPin className="w-4 h-4 mr-3 text-slate-200 shrink-0" />
            <span className="truncate">{event.locationText || 'Location TBA'}</span>
          </div>
          {regLabel && (
            <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <span className="w-1 h-1 bg-slate-300 rounded-full mr-3"></span>
              {regLabel}
            </div>
          )}
        </div>

        {/* Pricing Area */}
        <div className="flex items-center justify-between pt-6 mt-auto border-t border-slate-50">
          <div>
            <span className="text-[9px] text-slate-300 uppercase tracking-[0.3em] font-black block mb-1">STARTING FROM</span>
            <p className="text-2xl font-black text-slate-900 tracking-tighter">
              {minPrice === 0 ? <span className="text-indigo-600">FREE</span> : `PHP ${minPrice.toLocaleString()}`}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#4F46E5] text-white flex items-center justify-center transition-all hover:bg-slate-900 shadow-[0_10px_25px_-5px_rgba(79,70,229,0.4)] hover:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.2)] hover:scale-105 active:scale-95">
            <ICONS.ChevronRight className="w-6 h-6" strokeWidth={3} />
          </div>
        </div>
      </div>
    </Card>
  );
};

export const EventList: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 6, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    apiService.getEvents(currentPage, 6).then(data => {
      setEvents(data.events);
      setPagination(data.pagination);
      setLoading(false);
    });
  }, [currentPage]);

  const filteredEvents = useMemo(() => {
    return events.filter(e => 
      e.eventName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.locationText?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
  }, [events, searchTerm]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center bg-transparent">
      <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-slate-400 font-black uppercase tracking-widest text-[9px]">Syncing Executive Portal...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 lg:py-12 animate-in fade-in duration-1000">
      {/* Landing Experience Hero Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-12">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-indigo-600 text-[10px] text-white font-black uppercase tracking-[0.2em] mb-4 shadow-xl shadow-indigo-100">
             <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
             ACTIVE REGISTRATION PORTAL
          </div>
          <h1 className="text-6xl lg:text-[5.5rem] font-black text-slate-900 tracking-tighter leading-[0.85] mb-6">
            Curated Industry <br />
            <span className="text-indigo-600 italic">Excellence</span>
          </h1>
          <p className="text-slate-400 text-base lg:text-lg font-medium leading-relaxed max-w-lg opacity-90">
            Access world-class summits, masterclasses, and executive networking sessions curated for innovators.
          </p>
        </div>
        
        <div className="w-full lg:w-[420px] shrink-0 lg:pb-2">
           <div className="relative group">
             <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-300 group-focus-within:text-indigo-600 transition-colors">
               <ICONS.Search className="h-5 w-5" strokeWidth={3} />
             </div>
             <input 
              type="text" 
              placeholder="Search active sessions..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-14 pr-8 py-5 bg-white border border-slate-100 rounded-[2rem] text-[15px] font-bold shadow-[0_15px_40px_-10px_rgba(0,0,0,0.05)] transition-all focus:outline-none focus:ring-8 focus:ring-indigo-600/5 focus:border-indigo-600 placeholder:text-slate-300 placeholder:font-black placeholder:uppercase placeholder:tracking-widest placeholder:text-[11px]"
             />
           </div>
        </div>
      </div>

      {/* Grid Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12">
        {filteredEvents.map((event, idx) => (
          <div key={event.eventId} className="animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both" style={{ animationDelay: `${(idx % pagination.limit) * 100}ms` }}>
            <EventCard event={event} />
          </div>
        ))}
      </div>
      
      {/* Pagination Controller */}
      {pagination.totalPages > 1 && (
        <div className="mt-20 flex items-center justify-center gap-2">
           <div className="flex items-center gap-2 px-2 py-1 bg-white rounded-[1.5rem] border border-slate-100 shadow-sm">
              {Array.from({ length: pagination.totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i + 1)}
                  className={`w-10 h-10 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                    pagination.page === i + 1 
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
      
      {/* Empty State */}
      {filteredEvents.length === 0 && (
        <div className="py-32 px-12 text-center bg-white rounded-[3rem] border border-slate-50 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ICONS.Search className="w-10 h-10 text-slate-200" />
          </div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-4">No active sessions found</h3>
          <Button 
            variant="outline" 
            className="px-12 py-4 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] border-2 border-slate-100 transition-all hover:bg-slate-50"
            onClick={() => setSearchTerm('')}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};