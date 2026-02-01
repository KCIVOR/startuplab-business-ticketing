import supabase from '../database/db.js';

export const getSummary = async (_req, res) => {
  try {
    // Tickets and attendance
    const { data: tickets, error: ticketErr } = await supabase
      .from('tickets')
      .select('ticketId, status, issuedAt');
    if (ticketErr) return res.status(500).json({ error: ticketErr.message });

    const totalRegistrations = tickets?.length || 0;
    const usedCount = (tickets || []).filter(t => t.status === 'USED').length;
    const attendanceRate = totalRegistrations ? (usedCount / totalRegistrations) * 100 : 0;

    // Orders and revenue
    const { data: orders, error: orderErr } = await supabase
      .from('orders')
      .select('orderId, totalAmount, status, created_at');
    if (orderErr) return res.status(500).json({ error: orderErr.message });

    const paidOrders = (orders || []).filter(o => o.status === 'PAID');
    const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const paymentSuccessRate = (orders || []).length
      ? (paidOrders.length / orders.length) * 100
      : 0;

    // Today ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startIso = today.toISOString();

    const ticketsSoldToday = (tickets || []).filter(t => t.issuedAt && t.issuedAt >= startIso).length;
    const revenueToday = paidOrders
      .filter(o => o.created_at && o.created_at >= startIso)
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return res.json({
      totalRegistrations,
      ticketsSoldToday,
      totalRevenue,
      revenueToday,
      attendanceRate,
      paymentSuccessRate,
    });
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Unexpected error' });
  }
};

export const getRecentTransactions = async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('orderId, eventId, buyerName, totalAmount, currency, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Unexpected error' });
  }
};
