import React from 'react';
import { UserRole } from '../types';

interface UserContextState {
  role: UserRole | null;
  email: string | null;
  isAuthenticated: boolean;
  canViewEvents?: boolean;
  canEditEvents?: boolean;
  canManualCheckIn?: boolean;
}

interface UserContextValue extends UserContextState {
  setUser: (payload: { role: UserRole; email: string; canViewEvents?: boolean; canEditEvents?: boolean; canManualCheckIn?: boolean }) => void;
  clearUser: () => void;
}

const UserContext = React.createContext<UserContextValue | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = React.useState<UserContextState>({
    role: null,
    email: null,
    isAuthenticated: false,
    canViewEvents: undefined,
    canEditEvents: undefined,
    canManualCheckIn: undefined,
  });

  const setUser = React.useCallback((payload: { role: UserRole; email: string; canViewEvents?: boolean; canEditEvents?: boolean; canManualCheckIn?: boolean }) => {
    setState((prev) => {
      if (prev.isAuthenticated && prev.role === payload.role && prev.email === payload.email) return prev;
      return { 
        role: payload.role, 
        email: payload.email, 
        isAuthenticated: true,
        canViewEvents: payload.canViewEvents,
        canEditEvents: payload.canEditEvents,
        canManualCheckIn: payload.canManualCheckIn,
      };
    });
  }, []);

  const clearUser = React.useCallback(() => {
    setState((prev) => {
      if (!prev.isAuthenticated && !prev.role && !prev.email) return prev;
      return { role: null, email: null, isAuthenticated: false, canViewEvents: undefined, canEditEvents: undefined, canManualCheckIn: undefined };
    });
  }, []);

  const value = React.useMemo(() => ({ ...state, setUser, clearUser }), [state, setUser, clearUser]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = React.useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
};
