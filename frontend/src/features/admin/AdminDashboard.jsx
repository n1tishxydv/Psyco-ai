import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/adminService';
import { isBackendConfigured } from '../../services/apiClient';
import { Card, CardHeader, CardContent } from '../../components/cards/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { InitialsAvatar } from '../../components/common/InitialsAvatar';
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Mail,
  History,
  RefreshCw,
  Search,
  Filter,
  Check,
  Eye,
  Lock,
  Stethoscope,
  Clock,
  Send,
  Building,
  FileText
} from 'lucide-react';

export function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stats
  const [stats, setStats] = useState(null);

  // Tab Data
  const [psychologists, setPsychologists] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [faqSubmissions, setFaqSubmissions] = useState([]);
  const [contactSubmissions, setContactSubmissions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Filters & State
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [faqAnswer, setFaqAnswer] = useState('');
  const [faqCategory, setFaqCategory] = useState('general');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);

  const fetchDashboardData = async () => {
    if (!isBackendConfigured()) {
      setLoading(false);
      setError('Administrative metrics are unavailable because the backend service is currently not connected.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const metrics = await adminService.getPlatformMetrics();
      setStats(metrics);

      // Fetch tab-specific data concurrently
      const [psychRes, usersRes, faqRes, contactRes, auditRes] = await Promise.allSettled([
        adminService.getPsychologistApprovals(),
        adminService.listUsers(),
        adminService.getFaqSubmissions(),
        adminService.getContactSubmissions(),
        adminService.getAuditLogs({ limit: 50 })
      ]);

      if (psychRes.status === 'fulfilled') setPsychologists(psychRes.value || []);
      if (usersRes.status === 'fulfilled') setUsersList(usersRes.value?.users || usersRes.value || []);
      if (faqRes.status === 'fulfilled') setFaqSubmissions(faqRes.value || []);
      if (contactRes.status === 'fulfilled') setContactSubmissions(contactRes.value || []);
      if (auditRes.status === 'fulfilled') setAuditLogs(auditRes.value || []);
    } catch (err) {
      console.error('Failed to load admin metrics:', err);
      setError('Unable to load administrative telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Psychologist approval/rejection actions
  const handleApprovePsychologist = async (psychologistId) => {
    if (!window.confirm('Approve this clinician registration and verify active status?')) return;
    try {
      setActionInProgress(true);
      await adminService.approvePsychologist(psychologistId);
      setPsychologists((prev) =>
        prev.map((p) => {
          const pId = p.psychologistId || p.uid || p.id;
          return pId === psychologistId ? { ...p, approvalStatus: 'approved', verified: true } : p;
        })
      );
      fetchDashboardData();
    } catch (err) {
      alert(err?.message || 'Failed to approve psychologist.');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleRejectPsychologist = async (psychologistId) => {
    const reason = prompt('Please enter a clinical verification rejection rationale:');
    if (!reason) return;
    try {
      setActionInProgress(true);
      await adminService.rejectPsychologist(psychologistId, reason);
      setPsychologists((prev) =>
        prev.map((p) => {
          const pId = p.psychologistId || p.uid || p.id;
          return pId === psychologistId ? { ...p, approvalStatus: 'rejected', verified: false, rejectionReason: reason } : p;
        })
      );
      fetchDashboardData();
    } catch (err) {
      alert(err?.message || 'Failed to reject psychologist.');
    } finally {
      setActionInProgress(false);
    }
  };

  // User suspend / reactivate
  const handleToggleUserStatus = async (targetUser) => {
    const isCurrentlyActive = targetUser.status !== 'suspended';
    const newStatus = isCurrentlyActive ? 'suspended' : 'active';
    const reason = isCurrentlyActive ? prompt('Reason for suspension:') : 'Reactivated by administrator';
    if (isCurrentlyActive && !reason) return;

    try {
      setActionInProgress(true);
      await adminService.updateUserStatus(targetUser.uid, newStatus, reason || 'Administrative status change');
      setUsersList((prev) =>
        prev.map((u) => (u.uid === targetUser.uid ? { ...u, status: newStatus } : u))
      );
    } catch (err) {
      alert(err?.message || 'Failed to update user status.');
    } finally {
      setActionInProgress(false);
    }
  };

  // FAQ Publishing
  const handlePublishFaq = async (submissionId) => {
    if (!faqAnswer.trim()) {
      alert('Please provide an authoritative answer before publishing to the public FAQ.');
      return;
    }
    try {
      setActionInProgress(true);
      await adminService.publishFaq(submissionId, {
        answer: faqAnswer.trim(),
        category: faqCategory
      });
      alert('FAQ published to live public website!');
      setSelectedSubmission(null);
      setFaqAnswer('');
      // Refresh FAQ list
      const updated = await adminService.getFaqSubmissions();
      setFaqSubmissions(updated || []);
    } catch (err) {
      alert(err?.message || 'Failed to publish FAQ.');
    } finally {
      setActionInProgress(false);
    }
  };

  // Contact Submission Status Update
  const handleUpdateContactStatus = async (submissionId, newStatus) => {
    try {
      setActionInProgress(true);
      await adminService.updateContactStatus(submissionId, newStatus);
      setContactSubmissions((prev) =>
        prev.map((c) => (c.submissionId === submissionId ? { ...c, status: newStatus } : c))
      );
    } catch (err) {
      alert(err?.message || 'Failed to update inquiry status.');
    } finally {
      setActionInProgress(false);
    }
  };

  // Filtered Users
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      !userSearch ||
      (u.fullName && u.fullName.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.uid && u.uid.toLowerCase().includes(userSearch.toLowerCase()));
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const pendingApprovals = psychologists.filter((p) => {
    const s = (p.approvalStatus || (p.verified ? 'approved' : 'pending')).toLowerCase();
    return s !== 'approved' && s !== 'rejected';
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Security Boundary Notice */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950/30 rounded-2xl border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="teal" size="sm">Administrative Governance</Badge>
              <Badge variant="neutral" size="sm">System Operations</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-teal-400" />
              Platform Administration & Operations
            </h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-2 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-400' : ''}`} />
            Refresh Telemetry
          </Button>
        </div>

        {/* Clinical Privacy Wall Banner */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-teal-500/20 text-xs text-slate-400 flex items-start gap-3">
          <Lock className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-200">Strict Clinical Privacy Boundary:</strong> In accordance with healthcare data protection standards, administrator accounts have operational and user governance privileges, but are <span className="text-teal-300 font-semibold">strictly barred from viewing private psychotherapy notes, psychiatric session recordings, or mental health disclosures</span>.
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Real Platform Operational Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-slate-800 bg-slate-900/90 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase text-slate-400">Total Users</span>
            <Users className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-2">
            {stats?.totalUsers ?? '...'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Platform accounts</div>
        </Card>

        <Card className="border-slate-800 bg-slate-900/90 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase text-slate-400">Patients</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-2">
            {stats?.patientCount ?? '...'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Registered clients</div>
        </Card>

        <Card className="border-slate-800 bg-slate-900/90 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase text-slate-400">Psychologists</span>
            <Stethoscope className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-2">
            {stats?.psychologistCount ?? '...'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {stats?.pendingApprovals ?? pendingApprovals.length} pending review
          </div>
        </Card>

        <Card className="border-slate-800 bg-slate-900/90 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase text-slate-400">Pending Inquiries</span>
            <Mail className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-2">
            {stats?.pendingContactSubmissions ?? contactSubmissions.filter(c => c.status === 'new').length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Contact inbox</div>
        </Card>

        <Card className="border-slate-800 bg-slate-900/90 p-4 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase text-slate-400">FAQ Queue</span>
            <HelpCircle className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-2">
            {stats?.pendingFaqSubmissions ?? faqSubmissions.filter(f => f.status === 'submitted').length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Public questions</div>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Stethoscope className="w-3.5 h-3.5" />
          <span>Clinician Approvals ({pendingApprovals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>User Directory ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('faqs')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'faqs'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>FAQ Moderation ({faqSubmissions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('contacts')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'contacts'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Contact Submissions ({contactSubmissions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Audit Trail ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: PSYCHOLOGIST CREDENTIAL REVIEW & APPROVALS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Psychologist Registrations & Verification Queue
              </h2>
              <p className="text-xs text-slate-400">
                Review submitted license numbers, years of experience, and clinical bio before authorizing active practice status.
              </p>
            </div>
            <Badge variant="teal" size="sm">
              {pendingApprovals.length} Action Required
            </Badge>
          </div>

          {psychologists.length === 0 ? (
            <Card className="border-slate-800 bg-slate-900/60 p-12 text-center">
              <EmptyState
                icon={Stethoscope}
                title="No Psychologist Applications"
                description="There are currently no registered psychologist accounts awaiting credential review."
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {psychologists.map((psych) => {
                const pId = psych.psychologistId || psych.uid || psych.id;
                const status = (psych.approvalStatus || (psych.verified ? 'approved' : 'pending')).toLowerCase();
                const isApproved = status === 'approved';
                const isRejected = status === 'rejected';
                const isPending = !isApproved && !isRejected;

                return (
                  <Card
                    key={pId}
                    className={`border transition-all ${
                      isPending ? 'border-amber-500/40 bg-slate-900' : 'border-slate-800 bg-slate-900/60'
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex items-start gap-4">
                          <InitialsAvatar name={psych.fullName || psych.email} size="lg" />
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-3">
                              <h3 className="text-base font-bold text-slate-100">
                                {psych.fullName || 'Clinician Application'}
                              </h3>
                              <Badge
                                variant={isApproved ? 'green' : isPending ? 'amber' : 'red'}
                                size="sm"
                                className="capitalize"
                              >
                                {isApproved ? 'Approved & Verified' : isRejected ? 'Rejected' : 'Pending Review'}
                              </Badge>
                              {psych.canPrescribe && (
                                <Badge variant="teal" size="sm">
                                  Prescriber Credentialed
                                </Badge>
                              )}
                            </div>

                            <p className="text-xs text-slate-400">
                              Email: <span className="text-slate-200">{psych.email}</span> • ID: <code className="text-[11px] text-teal-300 font-mono">{pId}</code>
                            </p>

                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-300 pt-1">
                              <div>
                                <span className="text-slate-500 font-medium">License:</span>{' '}
                                <span className="font-semibold text-slate-200">{psych.licenseNumber || 'Not submitted'}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 font-medium">Specializations:</span>{' '}
                                <span className="text-teal-300">
                                  {Array.isArray(psych.specializations) ? psych.specializations.join(', ') : psych.specializations || 'General'}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 font-medium">Experience:</span>{' '}
                                <span>{psych.yearsOfExperience ? `${psych.yearsOfExperience} years` : 'N/A'}</span>
                              </div>
                            </div>

                            {psych.bio && (
                              <p className="text-xs text-slate-400 pt-2 leading-relaxed max-w-3xl line-clamp-2">
                                "{psych.bio}"
                              </p>
                            )}

                            {psych.rejectionReason && (
                              <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-300 mt-2">
                                <strong>Rejection Rationale:</strong> {psych.rejectionReason}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Approval / Rejection Controls */}
                        <div className="flex md:flex-col gap-2 shrink-0">
                          {isPending && (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                disabled={actionInProgress}
                                onClick={() => handleApprovePsychologist(pId)}
                                className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Approve License
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={actionInProgress}
                                onClick={() => handleRejectPsychologist(pId)}
                                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 hover:border-red-500"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Reject Application
                              </Button>
                            </>
                          )}

                          {isApproved && (
                            <div className="flex flex-col items-end gap-2">
                              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Active Verified Clinician
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={actionInProgress}
                                onClick={() => handleRejectPsychologist(pId)}
                                className="text-[11px] text-red-400 hover:text-red-300 hover:border-red-500 py-1 px-2.5 h-auto"
                              >
                                Revoke Approval
                              </Button>
                            </div>
                          )}

                          {isRejected && (
                            <div className="flex flex-col items-end gap-2">
                              <span className="text-[11px] text-red-400 flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5" /> Application Rejected
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={actionInProgress}
                                onClick={() => handleApprovePsychologist(pId)}
                                className="text-[11px] text-teal-400 hover:text-teal-300 hover:border-teal-500 py-1 px-2.5 h-auto"
                              >
                                Re-Approve Clinician
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: USER DIRECTORY & ACCOUNT LIFECYCLE */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Search & Filter Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search user name or email..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-400"
              />
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs text-slate-400">Filter Role:</span>
              {['all', 'patient', 'psychologist', 'admin'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-2.5 py-1 text-xs rounded-lg capitalize transition-colors ${
                    roleFilter === r
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-900'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Registered</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No registered users matching this filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isSuspended = u.status === 'suspended';
                    return (
                      <tr key={u.uid} className="hover:bg-slate-850/50 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <InitialsAvatar name={u.fullName || u.email} size="sm" />
                            <div>
                              <div className="font-semibold text-slate-200">
                                {u.fullName || 'Registered User'}
                              </div>
                              <div className="text-[11px] text-slate-400">{u.email}</div>
                              <div className="text-[10px] text-slate-600 font-mono">{u.uid}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <Badge
                            variant={u.role === 'admin' ? 'red' : u.role === 'psychologist' ? 'green' : 'teal'}
                            size="sm"
                            className="capitalize"
                          >
                            {u.role || 'patient'}
                          </Badge>
                        </td>
                        <td className="p-3.5">
                          <Badge
                            variant={isSuspended ? 'red' : 'green'}
                            size="sm"
                            className="capitalize"
                          >
                            {u.status || 'active'}
                          </Badge>
                        </td>
                        <td className="p-3.5 text-slate-400">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Active'}
                        </td>
                        <td className="p-3.5 text-right">
                          {u.role !== 'admin' && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={actionInProgress}
                              onClick={() => handleToggleUserStatus(u)}
                              className={`text-[11px] ${
                                isSuspended
                                  ? 'text-emerald-400 hover:border-emerald-500'
                                  : 'text-amber-400 hover:border-amber-500'
                              }`}
                            >
                              {isSuspended ? 'Reactivate' : 'Suspend Account'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: FAQ MODERATION */}
      {activeTab === 'faqs' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-base font-semibold text-slate-100">
              Community FAQ Questions
            </h2>
            <p className="text-xs text-slate-400">
              Review public user submissions, draft professional answers, and publish verified answers to the public FAQ page.
            </p>

            {faqSubmissions.length === 0 ? (
              <Card className="border-slate-800 bg-slate-900/60 p-12 text-center">
                <EmptyState
                  icon={HelpCircle}
                  title="No FAQ Submissions"
                  description="No public user questions submitted yet."
                />
              </Card>
            ) : (
              <div className="space-y-3">
                {faqSubmissions.map((sub) => {
                  const isSelected = selectedSubmission?.submissionId === sub.submissionId;
                  const isPublished = sub.status === 'published';

                  return (
                    <Card
                      key={sub.submissionId}
                      className={`cursor-pointer transition-all border ${
                        isSelected
                          ? 'border-teal-500 bg-slate-900'
                          : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                      }`}
                      onClick={() => {
                        setSelectedSubmission(sub);
                        setFaqAnswer(sub.answer || '');
                        setFaqCategory(sub.category || 'general');
                      }}
                    >
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <Badge
                            variant={isPublished ? 'green' : 'amber'}
                            size="sm"
                            className="capitalize"
                          >
                            {sub.status || 'submitted'}
                          </Badge>
                          <span className="text-[10px] text-slate-500">
                            {new Date(sub.createdAt || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-slate-200">
                          "{sub.question}"
                        </h4>
                        <div className="text-[11px] text-slate-400">
                          Submitted by: {sub.submittedByName || sub.submittedByEmail || 'Anonymous Visitor'}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: FAQ Editor / Publisher */}
          <div className="lg:col-span-5">
            {selectedSubmission ? (
              <Card className="border-slate-800 bg-slate-900 shadow-lg sticky top-24">
                <CardHeader className="border-b border-slate-800 pb-3">
                  <Badge variant="teal" size="sm">Answer & Moderation</Badge>
                  <h3 className="text-sm font-bold text-slate-100 mt-1">
                    "{selectedSubmission.question}"
                  </h3>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      FAQ Category
                    </label>
                    <select
                      value={faqCategory}
                      onChange={(e) => setFaqCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-400"
                    >
                      <option value="general">General Inquiries</option>
                      <option value="appointments">Appointments & Scheduling</option>
                      <option value="confidentiality">Privacy & Confidentiality</option>
                      <option value="telehealth">Telehealth & Video Consultations</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Authoritative Public Answer <span className="text-teal-400">*</span>
                    </label>
                    <textarea
                      rows={5}
                      value={faqAnswer}
                      onChange={(e) => setFaqAnswer(e.target.value)}
                      placeholder="Write the clear, approved answer to display publicly on the Psyco AI FAQ page..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-400 leading-relaxed"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSubmission(null)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={actionInProgress || !faqAnswer.trim()}
                      onClick={() => handlePublishFaq(selectedSubmission.submissionId)}
                      className="flex items-center gap-1.5 text-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Publish Live to Website
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-slate-800 bg-slate-900/60 p-8 text-center">
                <EmptyState
                  icon={HelpCircle}
                  title="Select a Question"
                  description="Click on any question from the list to write an answer and publish it."
                />
              </Card>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: CONTACT SUBMISSIONS */}
      {activeTab === 'contacts' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Public Contact & Inquiry Inbox
            </h2>
            <p className="text-xs text-slate-400">
              Inquiries submitted through the public website contact form. Update review status and record administrative notes.
            </p>
          </div>

          {contactSubmissions.length === 0 ? (
            <Card className="border-slate-800 bg-slate-900/60 p-12 text-center">
              <EmptyState
                icon={Mail}
                title="No Contact Inquiries"
                description="The public contact inbox has no recorded submissions."
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contactSubmissions.map((contact) => (
                <Card key={contact.submissionId} className="border-slate-800 bg-slate-900">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-100">
                          {contact.subject || 'General Inquiry'}
                        </h4>
                        <div className="text-xs text-slate-400 mt-0.5">
                          From: <strong className="text-slate-200">{contact.fullName || contact.name}</strong> ({contact.email})
                        </div>
                      </div>
                      <Badge
                        variant={contact.status === 'responded' ? 'green' : contact.status === 'in_review' ? 'teal' : 'amber'}
                        size="sm"
                        className="capitalize shrink-0"
                      >
                        {contact.status || 'New'}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 whitespace-pre-wrap">
                      "{contact.message}"
                    </p>

                    <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>Submitted: {new Date(contact.createdAt || Date.now()).toLocaleDateString()}</span>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={contact.status || 'new'}
                          disabled={actionInProgress}
                          onChange={(e) => handleUpdateContactStatus(contact.submissionId, e.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-300"
                        >
                          <option value="new">New</option>
                          <option value="in_review">In Review</option>
                          <option value="responded">Responded</option>
                          <option value="closed">Closed</option>
                          <option value="spam">Spam</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SYSTEM AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Operational Audit Trail
            </h2>
            <p className="text-xs text-slate-400">
              Append-only audit trail recording significant governance events, authentication updates, and clinical status changes.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Event Type</th>
                  <th className="p-3">Actor Role</th>
                  <th className="p-3">Resource</th>
                  <th className="p-3">Resource ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 font-sans">
                      No audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.eventId || log.timestamp} className="hover:bg-slate-850/50">
                      <td className="p-3 text-slate-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span className="text-teal-300 font-medium">
                          {log.eventType || log.action}
                        </span>
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={log.actorRole === 'admin' ? 'red' : log.actorRole === 'psychologist' ? 'green' : 'neutral'}
                          size="sm"
                          className="font-sans text-[10px] capitalize"
                        >
                          {log.actorRole || 'system'}
                        </Badge>
                      </td>
                      <td className="p-3 text-slate-300">
                        {log.resourceType || 'general'}
                      </td>
                      <td className="p-3 text-slate-400 truncate max-w-[140px]">
                        {log.resourceId || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
