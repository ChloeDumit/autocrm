'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
  plan: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  email: string;
  phone: string | null;
  maxUsers: number;
  maxVehicles: number;
  createdAt: string;
  approvedAt: string | null;
}

interface TenantContextType {
  tenant: Tenant | null;
  subdomain: string | null;
  isLoading: boolean;
  error: string | null;
  isSuperAdmin: boolean;
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

function getSubdomainFromCookie(): string | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'tenant-subdomain') {
      return value;
    }
  }
  return null;
}

function getSubdomainFromHostname(): string | null {
  if (typeof window === 'undefined') return null;

  const hostname = window.location.hostname;

  // For localhost development (e.g., company1.localhost)
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    const parts = hostname.split('.');
    if (parts.length > 1 && parts[0] !== 'www' && parts[0] !== 'localhost' && parts[0] !== '127') {
      return parts[0];
    }
    return null;
  }

  // For production (e.g., company1.autocrm.com)
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    const subdomain = parts[0];
    const reserved = ['admin', 'www', 'api', 'app'];
    if (!reserved.includes(subdomain.toLowerCase())) {
      return subdomain;
    }
  }

  return null;
}

interface TenantProviderProps {
  children: ReactNode;
}

export function TenantProvider({ children }: TenantProviderProps) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const fetchTenant = async (subdomainToFetch: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${apiUrl}/app-config`, {
        headers: {
          'X-Tenant-Subdomain': subdomainToFetch,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Tenant not found');
        }
        if (response.status === 403) {
          throw new Error('Tenant is suspended or inactive');
        }
        throw new Error('Failed to load tenant');
      }

      const config = await response.json();

      // For now, we don't have full tenant info from app-config
      // We'll need to fetch it separately or include it in the response
      // This is a simplified version
      setTenant({
        id: config.tenantId || '',
        name: config.nombreEmpresa || '',
        subdomain: subdomainToFetch,
        status: 'ACTIVE',
        plan: 'FREE',
        email: '',
        phone: null,
        maxUsers: 5,
        maxVehicles: 100,
        createdAt: '',
        approvedAt: null,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tenant');
      setTenant(null);
    }
  };

  const refreshTenant = async () => {
    if (subdomain) {
      await fetchTenant(subdomain);
    }
  };

  useEffect(() => {
    // Check if we're on the super admin panel
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname.startsWith('admin.') || window.location.pathname.startsWith('/super-admin')) {
        setIsSuperAdmin(true);
        setIsLoading(false);
        return;
      }
    }

    // Try to get subdomain from cookie first, then from hostname
    const subdomainFromCookie = getSubdomainFromCookie();
    const subdomainFromHostname = getSubdomainFromHostname();
    const detectedSubdomain = subdomainFromCookie || subdomainFromHostname;

    if (detectedSubdomain) {
      setSubdomain(detectedSubdomain);
      fetchTenant(detectedSubdomain).finally(() => setIsLoading(false));
    } else {
      // No subdomain - might be main site or development without subdomain
      setIsLoading(false);
    }
  }, []);

  return (
    <TenantContext.Provider
      value={{
        tenant,
        subdomain,
        isLoading,
        error,
        isSuperAdmin,
        refreshTenant,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

// Hook for getting the current subdomain (useful for API calls)
export function useSubdomain(): string | null {
  const { subdomain } = useTenant();
  return subdomain;
}
