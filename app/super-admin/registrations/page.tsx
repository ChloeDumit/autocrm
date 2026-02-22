'use client';

import { useEffect, useState } from 'react';
import superAdminApi from '@/lib/super-admin-api';
import {
  ClipboardList,
  Check,
  X,
  Clock,
  Mail,
  Phone,
  Building2,
  User,
  Globe,
  AlertCircle,
} from 'lucide-react';

interface Registration {
  id: string;
  companyName: string;
  subdomain: string;
  email: string;
  phone: string | null;
  userName: string;
  status: string;
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approveSettings, setApproveSettings] = useState({
    plan: 'FREE',
    maxUsers: 5,
    maxVehicles: 100,
  });

  useEffect(() => {
    fetchRegistrations();
  }, [statusFilter]);

  const fetchRegistrations = async () => {
    try {
      const endpoint =
        statusFilter === 'PENDING'
          ? '/super-admin/tenants'
          : '/super-admin/tenants';

      // Use registration endpoints
      const response = await superAdminApi.get(
        statusFilter
          ? `/registration/all?status=${statusFilter}`
          : '/registration/all'
      );
      setRegistrations(response.data);
    } catch (error) {
      console.error('Failed to fetch registrations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRegistration) return;

    try {
      await superAdminApi.post(`/registration/${selectedRegistration.id}/approve`, approveSettings);
      setShowApproveModal(false);
      setSelectedRegistration(null);
      fetchRegistrations();
    } catch (error) {
      console.error('Failed to approve registration:', error);
    }
  };

  const handleReject = async () => {
    if (!selectedRegistration || !rejectReason.trim()) return;

    try {
      await superAdminApi.post(`/registration/${selectedRegistration.id}/reject`, {
        reason: rejectReason,
      });
      setShowRejectModal(false);
      setSelectedRegistration(null);
      setRejectReason('');
      fetchRegistrations();
    } catch (error) {
      console.error('Failed to reject registration:', error);
    }
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-500/20 text-yellow-400',
    APPROVED: 'bg-green-500/20 text-green-400',
    REJECTED: 'bg-red-500/20 text-red-400',
  };

  const statusIcons: Record<string, React.ReactNode> = {
    PENDING: <Clock className="h-4 w-4" />,
    APPROVED: <Check className="h-4 w-4" />,
    REJECTED: <X className="h-4 w-4" />,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Registrations</h1>
        <p className="text-slate-400">Review and approve company registration requests</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['PENDING', 'APPROVED', 'REJECTED', ''].map((status) => (
          <button
            key={status || 'all'}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {status || 'All'}
          </button>
        ))}
      </div>

      {/* Registrations List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          </div>
        ) : registrations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-slate-800 rounded-xl border border-slate-700">
            <ClipboardList className="h-12 w-12 mb-4" />
            <p>No registrations found</p>
          </div>
        ) : (
          registrations.map((reg) => (
            <div
              key={reg.id}
              className="bg-slate-800 rounded-xl border border-slate-700 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{reg.companyName}</h3>
                    <span
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${statusColors[reg.status]}`}
                    >
                      {statusIcons[reg.status]}
                      {reg.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Globe className="h-4 w-4" />
                      <span>{reg.subdomain}.rodar.uy</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Mail className="h-4 w-4" />
                      <span>{reg.email}</span>
                    </div>
                    {reg.phone && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <Phone className="h-4 w-4" />
                        <span>{reg.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-slate-400">
                      <User className="h-4 w-4" />
                      <span>{reg.userName}</span>
                    </div>
                  </div>

                  {reg.rejectionReason && (
                    <div className="mt-4 p-3 bg-red-900/20 border border-red-900/50 rounded-lg">
                      <div className="flex items-center gap-2 text-red-400 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span className="font-medium">Rejection reason:</span>
                      </div>
                      <p className="text-slate-300 text-sm mt-1">{reg.rejectionReason}</p>
                    </div>
                  )}

                  <p className="text-slate-500 text-sm mt-4">
                    Submitted: {new Date(reg.createdAt).toLocaleString()}
                    {reg.reviewedAt && (
                      <> • Reviewed: {new Date(reg.reviewedAt).toLocaleString()}</>
                    )}
                  </p>
                </div>

                {reg.status === 'PENDING' && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedRegistration(reg);
                        setShowApproveModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRegistration(reg);
                        setShowRejectModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedRegistration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
            <h2 className="text-xl font-semibold mb-4">Approve Registration</h2>
            <p className="text-slate-400 mb-6">
              Approve <strong>{selectedRegistration.companyName}</strong> with the following
              settings:
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Subscription Plan
                </label>
                <select
                  value={approveSettings.plan}
                  onChange={(e) =>
                    setApproveSettings({ ...approveSettings, plan: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="FREE">Free</option>
                  <option value="STARTER">Starter</option>
                  <option value="PROFESSIONAL">Professional</option>
                  <option value="ENTERPRISE">Enterprise</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Max Users
                </label>
                <input
                  type="number"
                  value={approveSettings.maxUsers}
                  onChange={(e) =>
                    setApproveSettings({
                      ...approveSettings,
                      maxUsers: parseInt(e.target.value) || 5,
                    })
                  }
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
                  value={approveSettings.maxVehicles}
                  onChange={(e) =>
                    setApproveSettings({
                      ...approveSettings,
                      maxVehicles: parseInt(e.target.value) || 100,
                    })
                  }
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={1}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedRegistration(null);
                }}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRegistration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
            <h2 className="text-xl font-semibold mb-4">Reject Registration</h2>
            <p className="text-slate-400 mb-6">
              Reject the registration for <strong>{selectedRegistration.companyName}</strong>
            </p>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Reason for rejection
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none"
                placeholder="Please provide a reason for rejecting this registration..."
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedRegistration(null);
                  setRejectReason('');
                }}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
