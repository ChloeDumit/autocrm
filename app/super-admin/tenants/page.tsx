'use client';

import { useEffect, useState } from 'react';
import superAdminApi from '@/lib/super-admin-api';
import Link from 'next/link';
import {
  Building2,
  Search,
  Plus,
  MoreVertical,
  Users,
  Car,
  ExternalLink,
  Pause,
  Play,
  Trash2,
} from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  status: string;
  plan: string;
  email: string;
  maxUsers: number;
  maxVehicles: number;
  createdAt: string;
  _count: {
    users: number;
    vehicles: number;
    clients: number;
    sales: number;
  };
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    fetchTenants();
  }, [statusFilter, planFilter, searchQuery]);

  const fetchTenants = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (planFilter) params.append('plan', planFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await superAdminApi.get(`/super-admin/tenants?${params.toString()}`);
      setTenants(response.data);
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuspend = async (tenantId: string) => {
    try {
      await superAdminApi.post(`/super-admin/tenants/${tenantId}/suspend`);
      fetchTenants();
    } catch (error) {
      console.error('Failed to suspend tenant:', error);
    }
    setActionMenuOpen(null);
  };

  const handleReactivate = async (tenantId: string) => {
    try {
      await superAdminApi.post(`/super-admin/tenants/${tenantId}/reactivate`);
      fetchTenants();
    } catch (error) {
      console.error('Failed to reactivate tenant:', error);
    }
    setActionMenuOpen(null);
  };

  const handleDelete = async (tenantId: string) => {
    if (!confirm('Are you sure you want to cancel this tenant?')) return;
    try {
      await superAdminApi.delete(`/super-admin/tenants/${tenantId}`);
      fetchTenants();
    } catch (error) {
      console.error('Failed to delete tenant:', error);
    }
    setActionMenuOpen(null);
  };

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-500/20 text-green-400',
    PENDING: 'bg-yellow-500/20 text-yellow-400',
    SUSPENDED: 'bg-red-500/20 text-red-400',
    CANCELLED: 'bg-slate-500/20 text-slate-400',
  };

  const planColors: Record<string, string> = {
    FREE: 'bg-slate-600',
    STARTER: 'bg-blue-600',
    PROFESSIONAL: 'bg-purple-600',
    ENTERPRISE: 'bg-amber-600',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tenants</h1>
          <p className="text-slate-400">Manage all registered companies</p>
        </div>
        <Link
          href="/super-admin/tenants/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Add Tenant</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search tenants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING">Pending</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Plans</option>
          <option value="FREE">Free</option>
          <option value="STARTER">Starter</option>
          <option value="PROFESSIONAL">Professional</option>
          <option value="ENTERPRISE">Enterprise</option>
        </select>
      </div>

      {/* Tenants Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          </div>
        ) : tenants.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Building2 className="h-12 w-12 mb-4" />
            <p>No tenants found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-slate-400 text-sm border-b border-slate-700 bg-slate-800/50">
                <th className="px-6 py-4 font-medium">Company</th>
                <th className="px-6 py-4 font-medium">Subdomain</th>
                <th className="px-6 py-4 font-medium">Plan</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Usage</th>
                <th className="px-6 py-4 font-medium">Created</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="px-6 py-4">
                    <Link
                      href={`/super-admin/tenants/${tenant.id}`}
                      className="font-medium hover:text-blue-400"
                    >
                      {tenant.name}
                    </Link>
                    <p className="text-sm text-slate-400">{tenant.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <a
                      href={`http://${tenant.subdomain}.localhost:3000`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-slate-300 hover:text-blue-400"
                    >
                      {tenant.subdomain}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium text-white ${planColors[tenant.plan]}`}
                    >
                      {tenant.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${statusColors[tenant.status]}`}
                    >
                      {tenant.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1" title="Users">
                        <Users className="h-4 w-4 text-slate-400" />
                        <span>
                          {tenant._count.users}/{tenant.maxUsers}
                        </span>
                      </div>
                      <div className="flex items-center gap-1" title="Vehicles">
                        <Car className="h-4 w-4 text-slate-400" />
                        <span>
                          {tenant._count.vehicles}/{tenant.maxVehicles}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {new Date(tenant.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative">
                      <button
                        onClick={() =>
                          setActionMenuOpen(actionMenuOpen === tenant.id ? null : tenant.id)
                        }
                        className="p-2 hover:bg-slate-700 rounded-lg"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                      {actionMenuOpen === tenant.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-slate-700 border border-slate-600 rounded-lg shadow-lg z-10">
                          <Link
                            href={`/super-admin/tenants/${tenant.id}`}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-slate-600 text-sm"
                          >
                            View Details
                          </Link>
                          {tenant.status === 'ACTIVE' ? (
                            <button
                              onClick={() => handleSuspend(tenant.id)}
                              className="flex items-center gap-2 px-4 py-2 hover:bg-slate-600 text-sm w-full text-left text-yellow-400"
                            >
                              <Pause className="h-4 w-4" />
                              Suspend
                            </button>
                          ) : tenant.status === 'SUSPENDED' ? (
                            <button
                              onClick={() => handleReactivate(tenant.id)}
                              className="flex items-center gap-2 px-4 py-2 hover:bg-slate-600 text-sm w-full text-left text-green-400"
                            >
                              <Play className="h-4 w-4" />
                              Reactivate
                            </button>
                          ) : null}
                          <button
                            onClick={() => handleDelete(tenant.id)}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-slate-600 text-sm w-full text-left text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
