'use client';

import { SuperAdminProvider, useSuperAdmin } from '@/lib/super-admin-context';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  LayoutDashboard,
  Users,
  ClipboardList,
  Settings,
  LogOut,
  BarChart3,
} from 'lucide-react';

function SuperAdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { superAdmin, isAuthenticated, isLoading, logout } = useSuperAdmin();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== '/super-admin/login') {
      router.push('/super-admin/login');
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  // Show login page without layout
  if (pathname === '/super-admin/login') {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const navItems = [
    { href: '/super-admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/super-admin/tenants', label: 'Tenants', icon: Building2 },
    { href: '/super-admin/registrations', label: 'Registrations', icon: ClipboardList },
    { href: '/super-admin/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/super-admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-700 bg-slate-800">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-slate-700 px-6">
            <Building2 className="h-8 w-8 text-blue-500" />
            <span className="ml-3 text-xl font-bold">Rodar Admin</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{superAdmin?.name}</p>
                <p className="text-xs text-slate-400">{superAdmin?.email}</p>
              </div>
              <button
                onClick={logout}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 min-h-screen">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SuperAdminProvider>
      <SuperAdminLayoutContent>{children}</SuperAdminLayoutContent>
    </SuperAdminProvider>
  );
}
