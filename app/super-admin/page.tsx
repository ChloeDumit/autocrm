'use client';

import { useEffect, useState } from 'react';
import superAdminApi from '@/lib/super-admin-api';
import {
  Building2,
  Users,
  Car,
  UserCircle,
  ShoppingCart,
  TrendingUp,
  Clock,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardMetrics {
  tenants: {
    total: number;
    active: number;
    pending: number;
    suspended: number;
  };
  platform: {
    totalUsers: number;
    totalVehicles: number;
    totalClients: number;
    totalSales: number;
  };
  tenantsByPlan: Array<{ plan: string; _count: number }>;
  recentTenants: Array<{
    id: string;
    name: string;
    subdomain: string;
    status: string;
    plan: string;
    createdAt: string;
    _count: { users: number; vehicles: number };
  }>;
  pendingRegistrations: number;
}

export default function SuperAdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await superAdminApi.get('/super-admin/dashboard/metrics');
      setMetrics(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load metrics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Tenants',
      value: metrics?.tenants.total || 0,
      icon: Building2,
      color: 'bg-blue-500',
    },
    {
      label: 'Active Tenants',
      value: metrics?.tenants.active || 0,
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      label: 'Total Users',
      value: metrics?.platform.totalUsers || 0,
      icon: Users,
      color: 'bg-purple-500',
    },
    {
      label: 'Total Vehicles',
      value: metrics?.platform.totalVehicles || 0,
      icon: Car,
      color: 'bg-orange-500',
    },
    {
      label: 'Total Clients',
      value: metrics?.platform.totalClients || 0,
      icon: UserCircle,
      color: 'bg-cyan-500',
    },
    {
      label: 'Total Sales',
      value: metrics?.platform.totalSales || 0,
      icon: ShoppingCart,
      color: 'bg-pink-500',
    },
  ];

  const planColors: Record<string, string> = {
    FREE: 'bg-slate-500',
    STARTER: 'bg-blue-500',
    PROFESSIONAL: 'bg-purple-500',
    ENTERPRISE: 'bg-amber-500',
  };

  const statusColors: Record<string, string> = {
    ACTIVE: 'text-green-400',
    PENDING: 'text-yellow-400',
    SUSPENDED: 'text-red-400',
    CANCELLED: 'text-slate-400',
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-slate-400">Platform overview and metrics</p>
        </div>
        {metrics?.pendingRegistrations > 0 && (
          <Link
            href="/super-admin/registrations"
            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
          >
            <Clock className="h-5 w-5" />
            <span>{metrics.pendingRegistrations} pending registrations</span>
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-slate-800 rounded-xl p-6 border border-slate-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value.toLocaleString()}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tenants by Plan */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold mb-4">Tenants by Plan</h2>
          <div className="space-y-4">
            {metrics?.tenantsByPlan.map((item) => (
              <div key={item.plan} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${planColors[item.plan] || 'bg-slate-500'}`} />
                  <span className="text-slate-300">{item.plan}</span>
                </div>
                <span className="font-semibold">{item._count}</span>
              </div>
            ))}
            {(!metrics?.tenantsByPlan || metrics.tenantsByPlan.length === 0) && (
              <p className="text-slate-400 text-center py-4">No tenants yet</p>
            )}
          </div>
        </div>

        {/* Tenant Status */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold mb-4">Tenant Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-green-400">Active</span>
              <span className="font-semibold">{metrics?.tenants.active || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-yellow-400">Pending</span>
              <span className="font-semibold">{metrics?.tenants.pending || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-red-400">Suspended</span>
              <span className="font-semibold">{metrics?.tenants.suspended || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tenants */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Tenants</h2>
          <Link
            href="/super-admin/tenants"
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-slate-400 text-sm border-b border-slate-700">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Subdomain</th>
                <th className="pb-3 font-medium">Plan</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Users</th>
                <th className="pb-3 font-medium">Vehicles</th>
                <th className="pb-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {metrics?.recentTenants.map((tenant) => (
                <tr key={tenant.id} className="border-b border-slate-700/50">
                  <td className="py-4">
                    <Link
                      href={`/super-admin/tenants/${tenant.id}`}
                      className="hover:text-blue-400"
                    >
                      {tenant.name}
                    </Link>
                  </td>
                  <td className="py-4 text-slate-400">{tenant.subdomain}</td>
                  <td className="py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${planColors[tenant.plan]} text-white`}
                    >
                      {tenant.plan}
                    </span>
                  </td>
                  <td className={`py-4 ${statusColors[tenant.status]}`}>{tenant.status}</td>
                  <td className="py-4">{tenant._count.users}</td>
                  <td className="py-4">{tenant._count.vehicles}</td>
                  <td className="py-4 text-slate-400">
                    {new Date(tenant.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {(!metrics?.recentTenants || metrics.recentTenants.length === 0) && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No tenants yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
