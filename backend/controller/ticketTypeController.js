import supabase from '../database/db.js';

// List ticket types for an event
export const listTicketTypes = async (req, res) => {
  try {
    const { eventId } = req.query;
    if (!eventId) return res.status(400).json({ error: 'eventId is required' });
    const { data, error } = await supabase
      .from('ticketTypes')
      .select('*')
      .eq('eventId', eventId);
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Unexpected error' });
  }
};

// Create ticket type
export const createTicketType = async (req, res) => {
  try {
    // Use authenticated user id when available; otherwise null
    const createdBy = req.user?.id || req.user?.userId || null;
    console.log(createdBy)
    let payload = { ...req.body, createdBy };
    console.log('[ticketTypeController] createTicketType payload:', payload);
    const { data, error } = await supabase
      .from('ticketTypes')
      .insert(payload)
      .select('*')
      .single();
    if (error) {
      console.error('[ticketTypeController] Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }
    return res.status(201).json(data);
  } catch (err) {
    console.error('[ticketTypeController] Caught error:', err);
    return res.status(500).json({ error: err?.message || 'Unexpected error' });
  }
};

// Update ticket type
export const updateTicketType = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const { data, error } = await supabase
      .from('ticketTypes')
      .update(updates)
      .eq('ticketTypeId', id)
      .select('*')
      .single();
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Ticket type not found' });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Unexpected error' });
  }
};

// Delete ticket type
export const deleteTicketType = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('ticketTypes')
      .delete()
      .eq('ticketTypeId', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Unexpected error' });
  }
};
