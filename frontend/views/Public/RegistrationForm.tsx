
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { Event, TicketType } from '../../types';
import { Button, Card, Input } from '../../components/Shared';
import { ICONS } from '../../constants';

export const RegistrationForm: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [selectedItems, setSelectedItems] = useState<{ ticket: TicketType, qty: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    termsAccepted: false
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (slug) {
      apiService.getEventBySlug(slug).then(data => {
        setEvent(data);
        if (data) {
          try {
            const selectionRaw = searchParams.get('selections');
            if (selectionRaw) {
              const parsed: { id: string, qty: number }[] = JSON.parse(decodeURIComponent(selectionRaw));
              const items = parsed.map(p => {
                const t = data.ticketTypes.find(tick => tick.ticketTypeId === p.id);
                return t ? { ticket: t, qty: p.qty } : null;
              }).filter(i => i !== null) as { ticket: TicketType, qty: number }[];
              setSelectedItems(items);
            }
          } catch (e) {
            console.error("Failed to parse selections", e);
          }
        }
        setLoading(false);
      });
    }
  }, [slug, searchParams]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Full name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.termsAccepted) newErrors.terms = 'You must accept the terms';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !event || selectedItems.length === 0) return;

    setSubmitting(true);
    try {
      const grandTotal = selectedItems.reduce((acc, item) => acc + (item.ticket.priceAmount * item.qty), 0);
      
      const { orderId } = await apiService.createOrderTransaction({
        eventId: event.eventId,
        buyerName: formData.name,
        buyerEmail: formData.email,
        buyerPhone: formData.phone,
        company: formData.company,
        items: selectedItems.map(i => ({ ticketTypeId: i.ticket.ticketTypeId, quantity: i.qty, price: i.ticket.priceAmount })),
        totalAmount: grandTotal,
        currency: selectedItems[0]?.ticket.currency || 'PHP'
      });
      console.log('Order created:', orderId);

      const hasPaid = grandTotal > 0;

      if (!hasPaid) {
        navigate(`/payment/status?sessionId=${orderId}`); // Free order also goes to status page for confirmation
      } else {
        // Paid: create HitPay checkout session then redirect
        const { checkoutUrl, status } = await apiService.createHitpayCheckoutSession(orderId);
        if (checkoutUrl && checkoutUrl !== 'null' && checkoutUrl !== 'undefined') {
          window.location.href = checkoutUrl;
        } else {
          // Mock/disabled HitPay: go straight to status page
          navigate(`/payment/status?sessionId=${orderId}&status=${status || 'PAID'}`);
        }
      }
    } catch (err) {
      console.error(err);
        alert('Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Initializing Secure Session...</p>
      </div>
    </div>
  );

  if (!event || selectedItems.length === 0) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Card className="p-10 text-center max-w-sm">
        <h2 className="text-xl font-black text-slate-900 mb-2">Session Expired</h2>
        <p className="text-slate-500 text-sm mb-6">Please restart your registration from the event page.</p>
        <Button onClick={() => navigate('/')}>Return to Events</Button>
      </Card>
    </div>
  );

  const totalQuantity = selectedItems.reduce((acc, item) => acc + item.qty, 0);
  const grandTotal = selectedItems.reduce((acc, item) => acc + (item.ticket.priceAmount * item.qty), 0);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-6 lg:py-16 animate-in fade-in duration-700">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-10">
          <button 
            onClick={() => navigate(-1)} 
            className="group flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-black text-[9px] uppercase tracking-[0.2em] transition-colors mb-4"
          >
            <svg className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Change Selection
          </button>
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter mb-2 leading-none">
            Complete Registration
          </h1>
          <div className="flex items-center gap-3">
            <span className="bg-indigo-600 text-white text-[8px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest">
              {totalQuantity} {totalQuantity === 1 ? 'Ticket' : 'Tickets'}
            </span>
            <p className="text-slate-500 font-medium text-sm">
              for <span className="text-slate-900 font-bold">{event.eventName}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 items-start">
          
          <div className="flex-1 w-full">
            <form onSubmit={handleSubmit} className="space-y-8">
              <Card className="p-8 lg:p-12 border-none shadow-[0_30px_60px_-15px_rgba(0,0,0,0.02)] ring-1 ring-slate-200/50 rounded-[3rem] bg-white relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center justify-center gap-6 mb-12">
                    <div className="w-12 h-px bg-slate-100"></div>
                    <h3 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.4em] whitespace-nowrap text-center">
                      Primary Registrant
                    </h3>
                    <div className="w-12 h-px bg-slate-100"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-slate-600 ml-1">Full Name *</label>
                      <Input 
                        placeholder="Full name as per identification" 
                        className="py-5 px-6 rounded-[1.25rem] font-bold bg-slate-50/50 border-transparent focus:bg-white focus:border-indigo-600/20 text-slate-900 placeholder:text-slate-300 transition-all text-[15px] shadow-sm"
                        value={formData.name}
                        onChange={(e: any) => setFormData({...formData, name: e.target.value})}
                        error={errors.name}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-slate-600 ml-1">Email Address *</label>
                      <Input 
                        type="email" 
                        placeholder="name@organization.com" 
                        className="py-5 px-6 rounded-[1.25rem] font-bold bg-slate-50/50 border-transparent focus:bg-white focus:border-indigo-600/20 text-slate-900 placeholder:text-slate-300 transition-all text-[15px] shadow-sm"
                        value={formData.email}
                        onChange={(e: any) => setFormData({...formData, email: e.target.value})}
                        error={errors.email}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-slate-600 ml-1">Contact Number</label>
                      <Input 
                        placeholder="+63 ...." 
                        className="py-5 px-6 rounded-[1.25rem] font-bold bg-slate-50/50 border-transparent focus:bg-white focus:border-indigo-600/20 text-slate-900 placeholder:text-slate-300 transition-all text-[15px] shadow-sm"
                        value={formData.phone}
                        onChange={(e: any) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-slate-600 ml-1">Company</label>
                      <Input 
                        placeholder="Organization / Entity" 
                        className="py-5 px-6 rounded-[1.25rem] font-bold bg-slate-50/50 border-transparent focus:bg-white focus:border-indigo-600/20 text-slate-900 placeholder:text-slate-300 transition-all text-[15px] shadow-sm"
                        value={formData.company}
                        onChange={(e: any) => setFormData({...formData, company: e.target.value})}
                      />
                    </div>

                    <div className="md:col-span-2 pt-6 border-t border-slate-50 space-y-4">
                       <label className="flex items-start gap-4 cursor-pointer group select-none">
                          <div className="relative mt-1">
                            <input 
                              type="checkbox" 
                              className="peer sr-only"
                              checked={formData.termsAccepted}
                              onChange={(e) => setFormData({...formData, termsAccepted: e.target.checked})}
                            />
                            <div className="w-6 h-6 border-2 border-slate-200 rounded-lg bg-white peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all flex items-center justify-center">
                              <ICONS.CheckCircle className={`w-4 h-4 text-white transition-opacity ${formData.termsAccepted ? 'opacity-100' : 'opacity-0'}`} strokeWidth={4} />
                            </div>
                          </div>
                          <span className="text-sm font-medium text-slate-500 leading-relaxed group-hover:text-slate-700 transition-colors">
                            I acknowledge that I have read and agree to the <a href="#" className="text-indigo-600 font-bold hover:underline">Terms and Conditions</a> and <a href="#" className="text-indigo-600 font-bold hover:underline">Privacy Policy</a> governing this event session.
                          </span>
                       </label>
                       {errors.terms && <p className="text-[11px] font-black text-rose-500 uppercase tracking-widest pl-10">{errors.terms}</p>}
                    </div>
                  </div>
                </div>
              </Card>

              <div className="flex flex-col sm:flex-row items-stretch gap-4">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="flex-[2] py-5 rounded-2xl shadow-xl shadow-indigo-100 font-black text-lg transition-all hover:scale-[1.01] bg-indigo-600" 
                  disabled={submitting}
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </span>
                  ) : grandTotal === 0 ? 'Confirm Registration' : `Checkout PHP ${grandTotal.toLocaleString()}`}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="lg" 
                  className="flex-1 py-5 rounded-2xl text-slate-400 font-black uppercase tracking-widest text-[10px] border-2 border-slate-100 transition-all" 
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </Button>
              </div>

              <div className="flex flex-col items-center gap-4 pt-6">
                 <div className="flex items-center gap-6 opacity-20 grayscale brightness-0">
                    <img src="https://www.hitpayapp.com/static/media/hitpay-logo.0f074558.png" alt="HitPay" className="h-4" />
                 </div>
                 <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-300">
                  Global Transaction Security by HitPay
                </p>
              </div>
            </form>
          </div>

          {/* High-Contrast Reservation Summary */}
          <div className="w-full lg:w-[400px] shrink-0 sticky top-10">
            <Card className="bg-white border-2 border-slate-100 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] rounded-[2.5rem] overflow-hidden p-0">
              <div className="p-8 lg:p-10 space-y-10">
                <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                  <h3 className="font-black text-[11px] text-indigo-600 uppercase tracking-[0.4em] flex items-center gap-3">
                    <ICONS.Calendar className="w-4 h-4" />
                    Reservation Summary
                  </h3>
                </div>
                
                <div className="space-y-10">
                  {/* Line Items */}
                  <div className="space-y-8">
                    {selectedItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start group">
                        <div className="flex-1 pr-6">
                          <p className="font-black text-slate-900 text-base uppercase tracking-tight leading-tight mb-2 group-hover:text-indigo-600 transition-colors">
                            {item.ticket.name}
                          </p>
                          <div className="flex items-center gap-2.5">
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                              {item.qty} {item.qty === 1 ? 'Guest' : 'Guests'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-black text-slate-900 tracking-tighter block">
                            PHP {(item.ticket.priceAmount * item.qty).toLocaleString()}
                          </span>
                          <span className="text-[9px] text-slate-300 font-black uppercase tracking-widest block mt-0.5">
                            {item.ticket.priceAmount > 0 ? `PHP ${item.ticket.priceAmount.toLocaleString()} ea` : 'Complimentary'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Fee Breakdown */}
                  <div className="pt-8 border-t border-slate-50 space-y-4">
                    <div className="flex justify-between items-center text-slate-400">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em]">Platform Subtotal</span>
                      <span className="text-[11px] font-black tracking-widest">PHP {grandTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">HitPay Service Fee</span>
                      <span className="text-[9px] font-black text-emerald-500 border border-emerald-500/10 px-2.5 py-0.5 rounded-lg tracking-[0.15em] bg-emerald-500/5">
                        WAIVED
                      </span>
                    </div>
                  </div>

                  {/* Grand Total Footer */}
                  <div className="pt-8 border-t-2 border-indigo-50">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] block">Grand Total</span>
                        <span className="text-4xl font-black text-slate-900 tracking-tighter block leading-none">
                          {grandTotal === 0 ? 'FREE' : `PHP ${grandTotal.toLocaleString()}`}
                        </span>
                      </div>
                      <div className="pb-1">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100 shadow-sm">
                           <ICONS.CheckCircle className="w-6 h-6" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivery Information */}
                <div className="mt-2 pt-8 border-t border-slate-50">
                   <div className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 group transition-all">
                      <div className="p-2.5 bg-white text-indigo-600 rounded-lg shadow-sm group-hover:scale-105 transition-transform border border-slate-100">
                        <ICONS.CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">Digital Delivery</p>
                        <p className="text-[9px] text-slate-400 font-bold mt-1.5 uppercase tracking-widest">Instant Ticket Access</p>
                      </div>
                   </div>
                </div>
              </div>
            </Card>
            
            <div className="mt-8 px-10 text-center">
              <p className="text-[9px] text-slate-300 font-bold leading-relaxed uppercase tracking-[0.2em]">
                Enterprise Shield • Secure Checkout
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
