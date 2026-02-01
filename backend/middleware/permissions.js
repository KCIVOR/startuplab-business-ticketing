import supabase from '../database/db.js';

// Role-based guard: allow if req.user exists and role is in allowedRoles
export function requireRoles(allowedRoles) {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Not authenticated' });

      const allowed = Array.isArray(allowedRoles)
        ? allowedRoles
        : allowedRoles
          ? [allowedRoles]
          : [];

      if (allowed.length === 0) return next();

      const { data: profile, error } = await supabase
        .from('users')
        .select('role')
        .eq('userId', userId)
        .maybeSingle();

      if (error) return res.status(500).json({ error: 'Database query failed' });
      if (!profile) return res.status(404).json({ error: 'User not found' });

      const role = profile.role;
      if (allowed.includes(role)) return next();

      return res.status(403).json({ error: 'Forbidden' });
    } catch (err) {
      console.error('requireRoles error:', err);
      return res.status(500).json({ error: 'Server error during authorization' });
    }
  };
}

// Permission-flag guard (staff granular), with admin bypass
export function requireFlags({ view = false, edit = false, manualCheckIn = false } = {}) {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;
      if (!userId) return res.status(401).json({ error: 'Not authenticated' });
      if (role === 'ADMIN') return next();

      const { data: profile, error } = await supabase
        .from('users')
        .select('canviewevents, caneditevents, canmanualcheckin')
        .eq('userId', userId)
        .maybeSingle();

      if (error) return res.status(500).json({ error: 'Database query failed' });
      if (!profile) return res.status(404).json({ error: 'User not found' });

      if (view && !profile.canviewevents) return res.status(403).json({ error: 'Forbidden' });
      if (edit && !profile.caneditevents) return res.status(403).json({ error: 'Forbidden' });
      if (manualCheckIn && !profile.canmanualcheckin) return res.status(403).json({ error: 'Forbidden' });

      return next();
    } catch (err) {
      console.error('requireFlags error:', err);
      return res.status(500).json({ error: 'Server error during authorization' });
    }
  };
}
