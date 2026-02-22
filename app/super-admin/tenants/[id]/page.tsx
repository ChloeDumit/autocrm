'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import superAdminApi from '@/lib/super-admin-api';
import { useSuperAdmin } from '@/lib/super-admin-context';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  Users,
  Car,
  UserCircle,
  ShoppingCart,
  Calendar,
  Edit,
  Pause,
  Play,
  Trash2,
  ExternalLink,
  LogIn,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';

interface TenantDetail {
  id: string;
  name: string;
  subdomain: string;
  status: string;
  plan: string;
  email: string;
  phone: string | null;
  maxUsers: number;
  maxVehicles: number;
  createdAt: string;
  approvedAt: string | null;
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  }>;
  appConfig: {
    nombreEmpresa: string;
    colorPrimario: string;
    logo: string | null;
  } | null;
  _count: {
    vehicles: number;
    clients: number;
    sales: number;
    testDrives: number;
  };
}

interface TenantStats {
  counts: {
    users: number;
    vehicles: number;
    clients: number;
    sales: number;
    testDrives: number;
  };
  limits: {
    maxUsers: number;
    maxVehicles: number;
    usersUsage: number;
    vehiclesUsage: number;
  };
  salesByStage: Array<{ etapa: string; _count: number }>;
  recentSales: Array<{
    id: string;
    precioVenta: number;
    etapa: string;
    createdAt: string;
    vehicle: { marca: string; modelo: string };
    client: { nombre: string };
  }>;
}

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { impersonateUser } = useSuperAdmin();
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    plan: '',
    maxUsers: 5,
    maxVehicles: 100,
  });

  useEffect(() => {
    fetchTenant();
    fetchStats();
  }, [params.id]);

  const fetchTenant = async () => {
    try {
      const response = await superAdminApi.get(`/super-admin/tenants/${params.id}`);
      setTenant(response.data);
      setEditForm({
        name: response.data.name,
        email: response.data.email,
        phone: response.data.phone || '',
        plan: response.data.plan,
        maxUsers: response.data.maxUsers,
        maxVehicles: response.data.maxVehicles,
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load tenant');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await superAdminApi.get(`/super-admin/tenants/${params.id}/stats`);
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleSuspend = async () => {
    if (!confirm('Are you sure you want to suspend this tenant?')) return;
    try {
      await superAdminApi.post(`/super-admin/tenants/${params.id}/suspend`);
      fetchTenant();
    } catch (err) {
      console.error('Failed to suspend:', err);
    }
  };

  const handleReactivate = async () => {
    try {
      await superAdminApi.post(`/super-admin/tenants/${params.id}/reactivate`);
      fetchTenant();
    } catch (err) {
      console.error('Failed to reactivate:', err);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to cancel this tenant? This cannot be undone.')) return;
    try {
      await superAdminApi.delete(`/super-admin/tenants/${params.id}`);
      router.push('/super-admin/tenants');
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handleUpdate = async () => {
    try {
      await superAdminApi.put(`/super-admin/tenants/${params.id}`, editForm);
      setIsEditing(false);
      fetchTenant();
    } catch (err) {
      console.error('Failed to update:', err);
    }
  };

  const handleImpersonate = async (userId: string) => {
    try {
      const { token, subdomain } = await impersonateUser(userId);
      // Open tenant in new tab with impersonation token
      const url = `http://${subdomain}.localhost:3000/dashboard?impersonate=${token}`;
      window.open(url, '_blank');
    } catch (err) {
      console.error('Failed to impersonate:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-red-400">{error || 'Tenant not found'}</p>
        <Link href="/super-admin/tenants" className="text-blue-400 mt-4">
          Back to Tenants
        </Link>
      </div>
    );
  }

  const statusColors: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    ACTIVE: { bg: 'bg-green-500/20', text: 'text-green-400', icon: <CheckCircle className="h-4 w-4" /> },
    PENDING: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: <Clock className="h-4 w-4" /> },
    SUSPENDED: { bg: 'bg-red-500/20', text: 'text-red-400', icon: <XCircle className="h-4 w-4" /> },
    CANCELLED: { bg: 'bg-slate-500/20', text: 'text-slate-400', icon: <XCircle className="h-4 w-4" /> },
  };

  const planColors: Record<string, string> = {
    FREE: 'bg-slate-600',
    STARTER: 'bg-blue-600',
    PROFESSIONAL: 'bg-purple-600',
    ENTERPRISE: 'bg-amber-600',
  };

  const statusStyle = statusColors[tenant.status] || statusColors.PENDING;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/super-admin/tenants"
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{tenant.name}</h1>
              <span
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
              >
                {statusStyle.icon}
                {tenant.status}
              </span>
              <span className={`px-2 py-1 rounded text-xs font-medium text-white ${planColors[tenant.plan]}`}>
                {tenant.plan}
              </span>
            </div>
            <p className="text-slate-400">{tenant.subdomain}.autocrm.com</p>
          </div>
        </div>

        <div className="flex gap-2">
          <a
            href={`http://${tenant.subdomain}.localhost:3000`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Visit Site
          </a>
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>
          {tenant.status === 'ACTIVE' ? (
            <button
              onClick={handleSuspend}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
            >
              <Pause className="h-4 w-4" />
              Suspend
            </button>
          ) : tenant.status === 'SUSPENDED' ? (
            <button
              onClick={handleReactivate}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              <Play className="h-4 w-4" />
              Reactivate
            </button>
          ) : null}
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Cancel
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Users</p>
              <p className="text-2xl font-bold">
                {stats?.counts.users || tenant.users.length}/{tenant.maxUsers}
              </p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
          {stats && (
            <div className="mt-3">
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full"
                  style={{ width: `${Math.min(stats.limits.usersUsage, 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">{Math.round(stats.limits.usersUsage)}% used</p>
            </div>
          )}
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Vehicles</p>
              <p className="text-2xl font-bold">
                {stats?.counts.vehicles || tenant._count.vehicles}/{tenant.maxVehicles}
              </p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <Car className="h-6 w-6 text-white" />
            </div>
          </div>
          {stats && (
            <div className="mt-3">
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full"
                  style={{ width: `${Math.min(stats.limits.vehiclesUsage, 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">{Math.round(stats.limits.vehiclesUsage)}% used</p>
            </div>
          )}
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Clients</p>
              <p className="text-2xl font-bold">{stats?.counts.clients || tenant._count.clients}</p>
            </div>
            <div className="bg-cyan-500 p-3 rounded-lg">
              <UserCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Sales</p>
              <p className="text-2xl font-bold">{stats?.counts.sales || tenant._count.sales}</p>
            </div>
            <div className="bg-pink-500 p-3 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tenant Info */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold mb-4">Tenant Information</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-slate-400 text-sm">Company Name</p>
                <p>{tenant.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-slate-400 text-sm">Subdomain</p>
                <p>{tenant.subdomain}.autocrm.com</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-slate-400 text-sm">Email</p>
                <p>{tenant.email}</p>
              </div>
            </div>
            {tenant.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-slate-400 text-sm">Phone</p>
                  <p>{tenant.phone}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-slate-400 text-sm">Created</p>
                <p>{new Date(tenant.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            {tenant.approvedAt && (
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-slate-400 text-sm">Approved</p>
                  <p>{new Date(tenant.approvedAt).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Users */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold mb-4">Users ({tenant.users.length})</h2>
          <div className="space-y-3">
            {tenant.users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-slate-400">{user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      user.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-500/20 text-slate-400'
                    }`}
                  >
                    {user.role}
                  </span>
                  <button
                    onClick={() => handleImpersonate(user.id)}
                    className="p-2 hover:bg-slate-600 rounded-lg transition-colors"
                    title="Login as this user"
                  >
                    <LogIn className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {tenant.users.length === 0 && (
              <p className="text-slate-400 text-center py-4">No users yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Sales by Stage */}
      {stats && stats.salesByStage.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold mb-4">Sales Pipeline</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.salesByStage.map((stage) => (
              <div key={stage.etapa} className="text-center p-4 bg-slate-700/50 rounded-lg">
                <p className="text-2xl font-bold">{stage._count}</p>
                <p className="text-sm text-slate-400 capitalize">{stage.etapa.toLowerCase()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Sales */}
      {stats && stats.recentSales.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold mb-4">Recent Sales</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-slate-400 text-sm border-b border-slate-700">
                  <th className="pb-3 font-medium">Vehicle</th>
                  <th className="pb-3 font-medium">Client</th>
                  <th className="pb-3 font-medium">Price</th>
                  <th className="pb-3 font-medium">Stage</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentSales.map((sale) => (
                  <tr key={sale.id} className="border-b border-slate-700/50">
                    <td className="py-3">
                      {sale.vehicle.marca} {sale.vehicle.modelo}
                    </td>
                    <td className="py-3">{sale.client.nombre}</td>
                    <td className="py-3">${sale.precioVenta}</td>
                    <td className="py-3">
                      <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400 capitalize">
                        {sale.etapa.toLowerCase()}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">
                      {new Date(sale.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
            <h2 className="text-xl font-semibold mb-4">Edit Tenant</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Company Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Plan</label>
                <select
                  value={editForm.plan}
                  onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="FREE">Free</option>
                  <option value="STARTER">Starter</option>
                  <option value="PROFESSIONAL">Professional</option>
                  <option value="ENTERPRISE">Enterprise</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Max Users</label>
                  <input
                    type="number"
                    value={editForm.maxUsers}
                    onChange={(e) => setEditForm({ ...editForm, maxUsers: parseInt(e.target.value) || 5 })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Max Vehicles</label>
                  <input
                    type="number"
                    value={editForm.maxVehicles}
                    onChange={(e) => setEditForm({ ...editForm, maxVehicles: parseInt(e.target.value) || 100 })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={1}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
