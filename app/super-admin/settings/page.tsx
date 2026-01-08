'use client';

import { useEffect, useState } from 'react';
import superAdminApi from '@/lib/super-admin-api';
import { useSuperAdmin } from '@/lib/super-admin-context';
import {
  Settings,
  User,
  Lock,
  Shield,
  Users,
  Plus,
  Trash2,
  Mail,
  Check,
  AlertCircle,
} from 'lucide-react';

interface SuperAdminUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export default function SettingsPage() {
  const { superAdmin } = useSuperAdmin();
  const [activeTab, setActiveTab] = useState('profile');
  const [superAdmins, setSuperAdmins] = useState<SuperAdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // New admin form
  const [newAdminForm, setNewAdminForm] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [showNewAdminModal, setShowNewAdminModal] = useState(false);

  useEffect(() => {
    if (superAdmin) {
      setProfileForm({
        name: superAdmin.name,
        email: superAdmin.email,
      });
    }
  }, [superAdmin]);

  useEffect(() => {
    if (activeTab === 'admins') {
      fetchSuperAdmins();
    }
  }, [activeTab]);

  const fetchSuperAdmins = async () => {
    try {
      const response = await superAdminApi.get('/super-admin/auth/list');
      setSuperAdmins(response.data);
    } catch (err) {
      console.error('Failed to fetch super admins:', err);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    setIsLoading(true);
    try {
      await superAdminApi.put('/super-admin/auth/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setMessage({ type: 'success', text: 'Password updated successfully' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update password' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (!newAdminForm.name || !newAdminForm.email || !newAdminForm.password) {
      setMessage({ type: 'error', text: 'All fields are required' });
      return;
    }

    if (newAdminForm.password.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    setIsLoading(true);
    try {
      await superAdminApi.post('/super-admin/auth/create', newAdminForm);
      setMessage({ type: 'success', text: 'Super admin created successfully' });
      setShowNewAdminModal(false);
      setNewAdminForm({ name: '', email: '', password: '' });
      fetchSuperAdmins();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to create admin' });
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'admins', label: 'Super Admins', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-slate-400">Manage your account and platform settings</p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}
        >
          {message.type === 'success' ? (
            <Check className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto text-current hover:opacity-70">
            &times;
          </button>
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-48 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700 p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Profile Information</h2>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled
                  />
                  <p className="text-xs text-slate-500 mt-1">Contact system administrator to change</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled
                  />
                  <p className="text-xs text-slate-500 mt-1">Contact system administrator to change</p>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Change Password</h2>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handlePasswordChange}
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded-lg transition-colors"
                >
                  {isLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>
          )}

          {/* Super Admins Tab */}
          {activeTab === 'admins' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Super Administrators</h2>
                <button
                  onClick={() => setShowNewAdminModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Admin
                </button>
              </div>

              <div className="space-y-3">
                {superAdmins.map((admin) => (
                  <div
                    key={admin.id}
                    className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-lg font-semibold text-white">
                          {admin.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{admin.name}</p>
                        <p className="text-sm text-slate-400">{admin.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-400">
                        Added {new Date(admin.createdAt).toLocaleDateString()}
                      </span>
                      {admin.id === superAdmin?.id && (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                          You
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {superAdmins.length === 0 && (
                  <p className="text-slate-400 text-center py-8">No super admins found</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Admin Modal */}
      {showNewAdminModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
            <h2 className="text-xl font-semibold mb-4">Add Super Admin</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                <input
                  type="text"
                  value={newAdminForm.name}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  value={newAdminForm.email}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                <input
                  type="password"
                  value={newAdminForm.password}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, password: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Minimum 8 characters"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowNewAdminModal(false);
                  setNewAdminForm({ name: '', email: '', password: '' });
                }}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAdmin}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded-lg transition-colors"
              >
                {isLoading ? 'Creating...' : 'Create Admin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
