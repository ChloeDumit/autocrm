'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import superAdminApi from './super-admin-api';

interface SuperAdmin {
  id: string;
  email: string;
  name: string;
}

interface SuperAdminContextType {
  superAdmin: SuperAdmin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  impersonateUser: (userId: string) => Promise<{ token: string; subdomain: string }>;
}

const SuperAdminContext = createContext<SuperAdminContextType | undefined>(undefined);

interface SuperAdminProviderProps {
  children: ReactNode;
}

export function SuperAdminProvider({ children }: SuperAdminProviderProps) {
  const [superAdmin, setSuperAdmin] = useState<SuperAdmin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('super-admin-token');
    const storedAdmin = localStorage.getItem('super-admin');

    if (token && storedAdmin) {
      try {
        setSuperAdmin(JSON.parse(storedAdmin));
        // Verify token is still valid
        superAdminApi
          .get('/super-admin/auth/me')
          .then((response) => {
            setSuperAdmin(response.data);
            localStorage.setItem('super-admin', JSON.stringify(response.data));
          })
          .catch(() => {
            // Token is invalid, clear session
            localStorage.removeItem('super-admin-token');
            localStorage.removeItem('super-admin');
            setSuperAdmin(null);
          })
          .finally(() => setIsLoading(false));
      } catch {
        localStorage.removeItem('super-admin-token');
        localStorage.removeItem('super-admin');
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await superAdminApi.post('/super-admin/auth/login', {
      email,
      password,
    });

    const { token, superAdmin: admin } = response.data;

    localStorage.setItem('super-admin-token', token);
    localStorage.setItem('super-admin', JSON.stringify(admin));
    setSuperAdmin(admin);
  };

  const logout = () => {
    localStorage.removeItem('super-admin-token');
    localStorage.removeItem('super-admin');
    setSuperAdmin(null);
    window.location.href = '/super-admin/login';
  };

  const impersonateUser = async (userId: string) => {
    const response = await superAdminApi.post(`/super-admin/auth/impersonate/${userId}`);
    const { token, user } = response.data;

    return {
      token,
      subdomain: user.tenant.subdomain,
    };
  };

  return (
    <SuperAdminContext.Provider
      value={{
        superAdmin,
        isAuthenticated: !!superAdmin,
        isLoading,
        login,
        logout,
        impersonateUser,
      }}
    >
      {children}
    </SuperAdminContext.Provider>
  );
}

export function useSuperAdmin() {
  const context = useContext(SuperAdminContext);
  if (context === undefined) {
    throw new Error('useSuperAdmin must be used within a SuperAdminProvider');
  }
  return context;
}
