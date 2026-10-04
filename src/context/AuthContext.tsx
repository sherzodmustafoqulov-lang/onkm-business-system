'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AuthContextType {
  currentUser: any | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<any | null>>;
  branches: Array<{ id: string; name: string; code: string }>;
  currentBranchId: string;
  setCurrentBranchId: (branchId: string) => void;
  loading: boolean;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  setCurrentUser: () => {},
  branches: [],
  currentBranchId: 'ALL',
  setCurrentBranchId: () => {},
  loading: true,
  refreshAuth: async () => {},
});

const CACHE_KEY = 'onkm_cached_user';
const BRANCH_CACHE_KEY = 'onkm_cached_branches';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [branches, setBranches] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [currentBranchId, setCurrentBranchId] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);

  // Synchronize cached user from sessionStorage after client mount to prevent SSR hydration mismatch
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        setCurrentUser(parsed);
        setLoading(false);
      }
      const cachedBranches = sessionStorage.getItem(BRANCH_CACHE_KEY);
      if (cachedBranches) {
        setBranches(JSON.parse(cachedBranches));
      }
    } catch {}
  }, []);

  const fetchUserAndBranches = useCallback(async () => {
    try {
      const [authRes, branchRes] = await Promise.all([
        fetch('/api/auth/me'),
        branches.length === 0 ? fetch('/api/branches') : Promise.resolve(null),
      ]);

      if (!authRes.ok) {
        if (authRes.status === 401) {
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem(CACHE_KEY);
            sessionStorage.removeItem(BRANCH_CACHE_KEY);
            if (!window.location.pathname.startsWith('/login')) {
              window.location.href = '/login';
            }
          }
        }
        return;
      }

      const authData = await authRes.json();
      if (authData?.user) {
        setCurrentUser(authData.user);
        if (authData.user.branchId && currentBranchId === 'ALL') {
          setCurrentBranchId(authData.user.branchId);
        }
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(authData.user));
        } catch {}
      }

      if (branchRes && branchRes.ok) {
        const branchData = await branchRes.json();
        if (branchData?.branches) {
          setBranches(branchData.branches);
          try {
            sessionStorage.setItem(BRANCH_CACHE_KEY, JSON.stringify(branchData.branches));
          } catch {}
        }
      }
    } catch (err) {
      console.error('Auth context fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [branches.length, currentBranchId]);

  useEffect(() => {
    fetchUserAndBranches();

    // Global session heartbeat once every 60s
    const heartbeat = () => {
      fetch('/api/auth/session/heartbeat', { method: 'POST' }).catch(() => {});
    };
    heartbeat();
    const interval = setInterval(heartbeat, 60000);
    return () => clearInterval(interval);
  }, [fetchUserAndBranches]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        branches,
        currentBranchId,
        setCurrentBranchId,
        loading,
        refreshAuth: fetchUserAndBranches,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
