
import { Event, TicketType } from '../types';

export const MOCK_EVENTS: Event[] = [
  {
    eventId: 'ev-1',
    slug: 'tech-summit-2024',
    eventName: 'Global Tech Summit 2024',
    description: 'The premier event for technology enthusiasts and innovators.',
    startAt: '2024-11-15T09:00:00Z',
    locationType: 'ONSITE',
    locationText: 'Sands Expo & Convention Centre, Philippines',
    capacityTotal: 500,
    regOpenAt: '2024-01-01',
    regCloseAt: '2024-11-14',
    status: 'PUBLISHED',
    imageUrl: 'https://images.unsplash.com/photo-1540575861501-7ad0582373f3?auto=format&fit=crop&q=80&w=800',
    ticketTypes: [
      { ticketTypeId: 'tk-1', eventId: 'ev-1', name: 'General Admission', priceAmount: 99.00, currency: 'PHP', quantityTotal: 400, quantitySold: 45, status: true },
      { ticketTypeId: 'tk-2', eventId: 'ev-1', name: 'VIP Pass', priceAmount: 249.00, currency: 'PHP', quantityTotal: 100, quantitySold: 12, status: true }
    ]
  },
  {
    eventId: 'ev-2',
    slug: 'workshop-react-mastery',
    eventName: 'React Mastery Workshop',
    description: 'Deep dive into advanced React patterns.',
    startAt: '2024-12-05T14:00:00Z',
    locationType: 'ONLINE',
    locationText: 'Zoom (Online)',
    capacityTotal: 100,
    regOpenAt: '2024-01-01',
    regCloseAt: '2024-12-04',
    status: 'PUBLISHED',
    imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=800',
    ticketTypes: [
      { ticketTypeId: 'tk-3', eventId: 'ev-2', name: 'Workshop Entry', priceAmount: 0.00, currency: 'PHP', quantityTotal: 100, quantitySold: 88, status: true }
    ]
  },
  {
    eventId: 'ev-3',
    slug: 'music-night-live',
    eventName: 'Acoustic Sessions: Live',
    description: 'Intimate acoustic performances.',
    startAt: '2024-10-20T19:00:00Z',
    locationType: 'ONSITE',
    locationText: 'Cultural Center of the Philippines',
    capacityTotal: 200,
    status: 'PUBLISHED',
    imageUrl: 'https://images.unsplash.com/photo-1514525253361-bee8718a300a?auto=format&fit=crop&q=80&w=800',
    ticketTypes: [
      { ticketTypeId: 'tk-4', eventId: 'ev-3', name: 'Standard Seat', priceAmount: 45.00, currency: 'PHP', quantityTotal: 200, quantitySold: 150, status: true }
    ]
  }
];
