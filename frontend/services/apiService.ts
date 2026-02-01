
import { Event, Order, OrderItem, Attendee, Ticket, TicketType, AnalyticsSummary, RegistrationView, TicketStatus, OrderStatus } from '../types';
import { MOCK_EVENTS } from './mockData';
// Local storage keys
const STORAGE_EVENTS = 'ef_events';
const STORAGE_ORDERS = 'ef_orders';
const STORAGE_ATTENDEES = 'ef_attendees';
const STORAGE_TICKETS = 'ef_tickets';

const initializeData = () => {
  if (!localStorage.getItem(STORAGE_EVENTS)) {
    localStorage.setItem(STORAGE_EVENTS, JSON.stringify(MOCK_EVENTS));
  }
  if (!localStorage.getItem(STORAGE_ORDERS)) localStorage.setItem(STORAGE_ORDERS, '[]');
  if (!localStorage.getItem(STORAGE_ATTENDEES)) localStorage.setItem(STORAGE_ATTENDEES, '[]');
  if (!localStorage.getItem(STORAGE_TICKETS)) localStorage.setItem(STORAGE_TICKETS, '[]');
};

initializeData();

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000';

export const apiService = {
  
  // --- Public APIs ---

  // GET /api/events
  getEvents: async (page = 1, limit = 10): Promise<{ events: Event[], pagination: any }> => {
    const res = await fetch(`${API_BASE}/api/events?status=PUBLISHED&page=${page}&limit=${limit}`, {
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error(`Failed to load events: ${res.status}`);
    const data = await res.json();
    return data;
  },

  // GET /api/events/:slug
  getEventBySlug: async (slug: string): Promise<Event | null> => {
    const res = await fetch(`${API_BASE}/api/events/${encodeURIComponent(slug)}`, {
      headers: { 'Content-Type': 'application/json' }
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to load event: ${res.status}`);
    const data = await res.json();
    return data as Event;
  },

  // POST /api/orders (Creates Order -> OrderItems -> Attendees -> Tickets)
  createOrderTransaction: async (data: {
    eventId: string;
    buyerName: string;
    buyerEmail: string;
    buyerPhone?: string;
    company?: string;
    items: { ticketTypeId: string; quantity: number; price: number }[];
    totalAmount: number;
    currency: string;
  }): Promise<{ orderId: string }> => {
    const res = await fetch(`${API_BASE}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`Order failed: ${(await res.json()).error || res.status}`);
    return await res.json();
  },

  // POST /api/payments/hitpay/checkout-session
  createHitpayCheckoutSession: async (
    orderId: string
  ): Promise<{ checkoutUrl: string | null; status?: string; mock?: boolean }> => {
    const res = await fetch(`${API_BASE}/api/payments/hitpay/checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ orderId })
    });
    const payload = await res.json();
    if (!res.ok) throw new Error(payload?.error || `Failed to create checkout session: ${res.status}`);
    return payload;
  },

  // GET /api/payments/status?sessionId=... 
  // We use Order ID as session ID for simplicity in mock
  getOrderStatus: async (orderId: string): Promise<Order | null> => {
    const res = await fetch(`${API_BASE}/api/orders/${encodeURIComponent(orderId)}`, {
      credentials: 'include'
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to load order: ${res.status}`);
    return await res.json();
  },

  // GET /api/tickets/order/:orderId
  getTicketsByOrder: async (orderId: string) => {
    const res = await fetch(`${API_BASE}/api/tickets/order/${encodeURIComponent(orderId)}`, {
      credentials: 'include'
    });
    if (!res.ok) throw new Error(`Failed to load tickets: ${res.status}`);
    return await res.json();
  },

  // GET /api/tickets/:ticketId
  // Returns a joined view for the UI
  getTicketDetails: async (id: string): Promise<RegistrationView | null> => {
    const tickets: Ticket[] = JSON.parse(localStorage.getItem(STORAGE_TICKETS) || '[]');
    const attendees: Attendee[] = JSON.parse(localStorage.getItem(STORAGE_ATTENDEES) || '[]');
    const orders: Order[] = JSON.parse(localStorage.getItem(STORAGE_ORDERS) || '[]');
    const events: Event[] = JSON.parse(localStorage.getItem(STORAGE_EVENTS) || '[]');

    // Try finding by ticketId OR orderId (for confirmation page)
    let ticket = tickets.find(t => t.ticketId === id);
    
    // If passed an orderId, get the first ticket
    if (!ticket) {
        ticket = tickets.find(t => t.orderId === id);
    }
    
    if (!ticket) return null;

    const event = events.find(e => e.eventId === ticket!.eventId);
    const attendee = attendees.find(a => a.attendeeId === ticket!.attendeeId);
    const order = orders.find(o => o.orderId === ticket!.orderId);
    const ticketType = event?.ticketTypes.find(t => t.ticketTypeId === ticket!.ticketTypeId);

    if (!event || !attendee || !order) return null;

    return {
      id: ticket.ticketId,
      ticketCode: ticket.ticketCode,
      eventId: event.eventId,
      eventName: event.eventName,
      attendeeName: attendee.name,
      attendeeEmail: attendee.email,
      ticketName: ticketType?.name || 'Unknown Ticket',
      status: ticket.status,
      paymentStatus: order.status,
      orderId: order.orderId,
      amountPaid: order.totalAmount,
      currency: order.currency,
      checkInTimestamp: ticket.usedAt
    };
  },

  // --- TicketTypes APIs ---

  // GET /api/ticket-types?eventId=...
  getTicketTypes: async (eventId: string): Promise<TicketType[]> => {
    const res = await fetch(`${API_BASE}/api/ticket-types?eventId=${encodeURIComponent(eventId)}`);
    if (!res.ok) throw new Error(`Failed to load ticket types: ${res.status}`);
    return await res.json();
  },

  // POST /api/ticket-types
  createTicketType: async (data: Partial<TicketType>): Promise<TicketType> => {
    // Remove createdBy if present
    const { createdBy, ...clean } = data;
    const res = await fetch(`${API_BASE}/api/ticket-types`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clean)
      
    });
    if (!res.ok) throw new Error(`Failed to create ticket type: ${res.status}`);
    return await res.json();
  },

  // PUT /api/ticket-types/:id
  updateTicketType: async (id: string, data: Partial<TicketType>): Promise<TicketType> => {
    const res = await fetch(`${API_BASE}/api/ticket-types/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`Failed to update ticket type: ${res.status}`);
    return await res.json();
  },

  // DELETE /api/ticket-types/:id
  deleteTicketType: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/api/ticket-types/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!res.ok) throw new Error(`Failed to delete ticket type: ${res.status}`);
  },

// --- Admin APIs ---

  getAttendeesByEvent: async (eventId: string): Promise<Attendee[]> => {
    // TODO: Replace with real API call
    const attendees: Attendee[] = JSON.parse(localStorage.getItem(STORAGE_ATTENDEES) || '[]');
    return attendees.filter(a => a.eventId === eventId);
  },

  createTicket: async (payload: Partial<Ticket>): Promise<Ticket> => {
    // TODO: Replace with real API call
    const tickets: Ticket[] = JSON.parse(localStorage.getItem(STORAGE_TICKETS) || '[]');
    const ticket: Ticket = {
      ticketId: `tik-${Math.random().toString(36).substr(2, 9)}`,
      eventId: payload.eventId!,
      ticketTypeId: payload.ticketTypeId!,
      orderId: payload.orderId || '',
      attendeeId: payload.attendeeId!,
      ticketCode: `TC-${Math.random().toString(36).toUpperCase().substr(2, 8)}`,
      qrPayload: `VALID:${Math.random().toString(36).substr(2, 9)}`,
      status: payload.status || 'ISSUED',
      issuedAt: new Date().toISOString(),
      usedAt: undefined
    };
    tickets.push(ticket);
    localStorage.setItem(STORAGE_TICKETS, JSON.stringify(tickets));
    return ticket;
  },

  getAdminEvents: async (): Promise<Event[]> => {
    const res = await fetch(`${API_BASE}/api/admin/events`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    if (!res.ok) throw new Error(`Failed to load admin events: ${res.status}`);
    const data = await res.json();
    return (data || []).map((event: Event) => ({ ...event, ticketTypes: event.ticketTypes || [] }));
  },

  createEvent: async (eventData: Partial<Event>): Promise<Event> => {
    const res = await fetch(`${API_BASE}/api/admin/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(eventData)
    });
    if (!res.ok) throw new Error(`Failed to create event: ${res.status}`);
    const data = await res.json();
    return { ...data, ticketTypes: data?.ticketTypes || eventData.ticketTypes || [] } as Event;
  },

  updateEvent: async (id: string, eventData: Partial<Event>): Promise<Event> => {
    const res = await fetch(`${API_BASE}/api/admin/events/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(eventData)
    });
    if (!res.ok) throw new Error(`Failed to update event: ${res.status}`);
    const data = await res.json();
    return { ...data, ticketTypes: data?.ticketTypes || eventData.ticketTypes || [] } as Event;
  },

  uploadEventImage: async (file: File, eventId?: string): Promise<{ publicUrl: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    if (eventId) formData.append('eventId', eventId);

    const endpoint = eventId
      ? `${API_BASE}/api/admin/events/${encodeURIComponent(eventId)}/image`
      : `${API_BASE}/api/admin/events/image`;

    const res = await fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    if (!res.ok) throw new Error(`Failed to upload image: ${res.status}`);
    const data = await res.json();
    return { publicUrl: data.publicUrl };
  },

  getAnalytics: async (): Promise<AnalyticsSummary> => {
    const res = await fetch(`${API_BASE}/api/analytics/summary`, {
      credentials: 'include'
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || `Failed to load analytics: ${res.status}`);
    }
    return res.json();
  },

  getRecentTransactions: async () => {
    const res = await fetch(`${API_BASE}/api/analytics/transactions`, {
      credentials: 'include'
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || `Failed to load transactions: ${res.status}`);
    }
    return res.json();
  },

  // GET /api/tickets/registrations?eventId=...
  getEventRegistrations: async (eventId: string): Promise<RegistrationView[]> => {
    const res = await fetch(`${API_BASE}/api/tickets/registrations?eventId=${encodeURIComponent(eventId)}`, {
      credentials: 'include'
    });
    if (!res.ok) throw new Error(`Failed to load registrations: ${res.status}`);
    return await res.json();
  },

  // GET /api/tickets/registrations-all (admin)
  getAllRegistrations: async (page = 1, limit = 10): Promise<{ registrations: RegistrationView[]; pagination: any }> => {
    const url = `${API_BASE}/api/tickets/registrations-all?page=${page}&limit=${limit}`;
    console.log('Making request to:', url);
    try {
      const res = await fetch(url, {
        credentials: 'include'
      });
      console.log('Response status:', res.status);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('API Error:', {
          status: res.status,
          statusText: res.statusText,
          url,
          error: errorText
        });
        throw new Error(`Failed to load all registrations: ${res.status}`);
      }
      const data = await res.json();
      console.log('API Response data:', data);
      if (Array.isArray(data)) {
        const result = {
          registrations: data,
          pagination: {
            page,
            limit,
            total: data.length,
            totalPages: Math.max(1, Math.ceil(data.length / limit))
          }
        };
        console.log('Normalized array response to:', result);
        return result;
      }
      if (!data.registrations || !data.pagination) {
        console.warn('Unexpected API response format. Expected {registrations, pagination} but got:', data);
      }
      return data;
    } catch (error: any) {
      console.error('Error in getAllRegistrations:', {
        error,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  },

  // POST /api/tickets/checkin
  checkInTicket: async (code: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/api/tickets/checkin`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || `Check-in failed: ${res.status}`);
    }
    return res.json();
  },

  // PUT /api/users/:id/permissions
  updateUserPermissions: async (userId: string, payload: { canViewEvents: boolean; canEditEvents: boolean; canManualCheckIn: boolean }) => {
    const res = await fetch(`${API_BASE}/api/users/${encodeURIComponent(userId)}/permissions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || `Failed to update permissions: ${res.status}`);
    }
    return res.json();
  }
};
