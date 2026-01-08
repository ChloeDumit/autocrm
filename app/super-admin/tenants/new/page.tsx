'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import superAdminApi from '@/lib/super-admin-api';
import Link from 'next/link';
import { ArrowLeft, Building2, User, AlertCircle, Check } from 'lucide-react';

export default function NewTenantPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);

  const [form, setForm] = useState({
    name: '',
    subdomain: '',
    email: '',
    phone: '',
    plan: 'FREE',
    maxUsers: 5,
    maxVehicles: 100,
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  });

  const checkSubdomain = async (subdomain: string) => {
    if (!subdomain || subdomain.length < 3) {
      setSubdomainAvailable(null);
      return;
    }

    setCheckingSubdomain(true);
    try {
      const response = await superAdminApi.get(`/registration/check-subdomain/${subdomain}`);
      setSubdomainAvailable(response.data.available);
    } catch {
      setSubdomainAvailable(null);
    } finally {
      setCheckingSubdomain(false);
    }
  };

  const handleSubdomainChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setForm({ ...form, subdomain: cleaned });
    setSubdomainAvailable(null);

    // Debounce the check
    const timeoutId = setTimeout(() => {
      checkSubdomain(cleaned);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name || !form.subdomain || !form.email || !form.adminName || !form.adminEmail || !form.adminPassword) {
      setError('Please fill in all required fields');
      return;
    }

    if (form.adminPassword.length < 8) {
      setError('Admin password must be at least 8 characters');
      return;
    }

    if (subdomainAvailable === false) {
      setError('Subdomain is not available');
      return;
    }

    setIsLoading(true);
    try {
      const response = await superAdminApi.post('/super-admin/tenants', form);
      router.push(`/super-admin/tenants/${response.data.tenant.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create tenant');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/super-admin/tenants"
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create New Tenant</h1>
          <p className="text-slate-400">Add a new company to the platform</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Information */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-400" />
            Company Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Autos del Norte"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Subdomain *
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={form.subdomain}
                    onChange={(e) => handleSubdomainChange(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="autosdelnorte"
                    required
                  />
                  {checkingSubdomain && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
                    </div>
                  )}
                  {!checkingSubdomain && subdomainAvailable === true && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Check className="h-5 w-5 text-green-400" />
                    </div>
                  )}
                  {!checkingSubdomain && subdomainAvailable === false && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    </div>
                  )}
                </div>
                <span className="text-slate-400">.autocrm.com</span>
              </div>
              {subdomainAvailable === false && (
                <p className="text-red-400 text-sm mt-1">This subdomain is not available</p>
              )}
              {subdomainAvailable === true && (
                <p className="text-green-400 text-sm mt-1">This subdomain is available</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Contact Email *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="contact@company.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Settings */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold mb-4">Subscription Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Plan</label>
              <select
                value={form.plan}
                onChange={(e) => setForm({ ...form, plan: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="FREE">Free</option>
                <option value="STARTER">Starter - $29/mo</option>
                <option value="PROFESSIONAL">Professional - $79/mo</option>
                <option value="ENTERPRISE">Enterprise - $199/mo</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Max Users</label>
                <input
                  type="number"
                  value={form.maxUsers}
                  onChange={(e) => setForm({ ...form, maxUsers: parseInt(e.target.value) || 5 })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={1}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Max Vehicles
                </label>
                <input
                  type="number"
                  value={form.maxVehicles}
                  onChange={(e) => setForm({ ...form, maxVehicles: parseInt(e.target.value) || 100 })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={1}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Admin User */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-purple-400" />
            Admin User
          </h2>
          <p className="text-slate-400 text-sm mb-4">
            This user will be the administrator for the tenant and can manage everything.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Name *</label>
              <input
                type="text"
                value={form.adminName}
                onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email *</label>
              <input
                type="email"
                value={form.adminEmail}
                onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="admin@company.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password *</label>
              <input
                type="password"
                value={form.adminPassword}
                onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Minimum 8 characters"
                required
                minLength={8}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Link
            href="/super-admin/tenants"
            className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isLoading || subdomainAvailable === false}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {isLoading ? 'Creating...' : 'Create Tenant'}
          </button>
        </div>
      </form>
    </div>
  );
}
