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
  FileText,
  Settings,
  Activity,
  Server,
  Database,
  Sparkles,
  Calendar,
  MapPin,
  Globe,
  Plus,
  Trash2,
  Edit3,
  MessageSquare,
  ChevronRight,
  Info
} from 'lucide-react';

export function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Core Data States
  const [stats, setStats] = useState(null);
  const [pendingActions, setPendingActions] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [psychologists, setPsychologists] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [clinicMemberships, setClinicMemberships] = useState([]);
  const [independentPractices, setIndependentPractices] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [publicContent, setPublicContent] = useState({});
  const [auditLogs, setAuditLogs] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [platformSettings, setPlatformSettings] = useState(null);

  // Filter & Search States
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');

  const [psychStatusFilter, setPsychStatusFilter] = useState('all');
  const [psychSearch, setPsychSearch] = useState('');

  const [clinicStatusFilter, setClinicStatusFilter] = useState('all');
  const [clinicSearch, setClinicSearch] = useState('');

  const [practiceSearch, setPracticeSearch] = useState('');
  const [practiceStatusFilter, setPracticeStatusFilter] = useState('all');

  const [ticketStatusFilter, setTicketStatusFilter] = useState('all');
  const [ticketCategoryFilter, setTicketCategoryFilter] = useState('all');
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState('all');
  const [ticketSearch, setTicketSearch] = useState('');

  const [faqCategoryFilter, setFaqCategoryFilter] = useState('all');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('all');

  // Modals & Action States
  const [selectedUser, setSelectedUser] = useState(null);
  const [suspendModal, setSuspendModal] = useState({ open: false, targetUser: null, reason: '' });
  const [selectedPsychologist, setSelectedPsychologist] = useState(null);
  const [psychReviewModal, setPsychReviewModal] = useState({ open: false, psych: null, action: 'approve', reason: '' });
  const [createClinicModal, setCreateClinicModal] = useState(false);
  const [newClinicData, setNewClinicData] = useState({
    name: '',
    organizationType: 'private_group',
    primaryContact: '',
    email: '',
    phone: '',
    address: { line1: '', city: '', state: '', postalCode: '' },
    description: '',
  });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketReplyText, setTicketReplyText] = useState('');
  const [isInternalReply, setIsInternalReply] = useState(false);

  const [faqModal, setFaqModal] = useState({ open: false, isEdit: false, faq: null, question: '', answer: '', category: 'General Practice', order: 1 });
  const [cmsEditModal, setCmsEditModal] = useState({ open: false, sectionKey: '', title: '', content: '' });

  const [actionInProgress, setActionInProgress] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchDashboardData = async () => {
    if (!isBackendConfigured()) {
      setLoading(false);
      setError('Administrative telemetry is unavailable because the backend is currently not connected.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Concurrent fetch of core metrics and operational data
      const [
        metricsRes,
        usersRes,
        psychRes,
        clinicsRes,
        membershipsRes,
        practicesRes,
        ticketsRes,
        faqsRes,
        contentRes,
        auditRes,
        healthRes,
        settingsRes
      ] = await Promise.allSettled([
        adminService.getPlatformMetrics(),
        adminService.listUsers(),
        adminService.getPsychologists(),
        adminService.getClinics(),
        adminService.getClinicMemberships(),
        adminService.getIndependentPractices(),
        adminService.getSupportTickets(),
        adminService.getFaqs(),
        adminService.getPublicContent(),
        adminService.getAuditLogs({ limit: 100 }),
        adminService.getSystemHealth(),
        adminService.getPlatformSettings()
      ]);

      if (metricsRes.status === 'fulfilled') {
        const val = metricsRes.value;
        setStats(val?.metrics || val || {});
        setPendingActions(val?.pendingActions || []);
      }
      if (usersRes.status === 'fulfilled') setUsersList(usersRes.value?.users || usersRes.value || []);
      if (psychRes.status === 'fulfilled') setPsychologists(psychRes.value?.data || psychRes.value || []);
      if (clinicsRes.status === 'fulfilled') setClinics(clinicsRes.value || []);
      if (membershipsRes.status === 'fulfilled') setClinicMemberships(membershipsRes.value || []);
      if (practicesRes.status === 'fulfilled') setIndependentPractices(practicesRes.value || []);
      if (ticketsRes.status === 'fulfilled') setSupportTickets(ticketsRes.value || []);
      if (faqsRes.status === 'fulfilled') setFaqs(faqsRes.value || []);
      if (contentRes.status === 'fulfilled') setPublicContent(contentRes.value || {});
      if (auditRes.status === 'fulfilled') setAuditLogs(auditRes.value?.data || auditRes.value || []);
      if (healthRes.status === 'fulfilled') setSystemHealth(healthRes.value?.data || healthRes.value || {});
      if (settingsRes.status === 'fulfilled') setPlatformSettings(settingsRes.value || {});

    } catch (err) {
      console.error('Failed to load administrative workspace data:', err);
      setError('Unable to load administrative telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // USER MANAGEMENT HANDLERS
  const handleOpenSuspendModal = (u) => {
    if (u.uid === user?.uid) {
      alert('Self-suspension prohibited. You cannot suspend your own administrative account.');
      return;
    }
    setSuspendModal({ open: true, targetUser: u, reason: '' });
  };

  const handleConfirmSuspend = async () => {
    if (!suspendModal.reason.trim()) {
      alert('Please document a rationale for suspending this user account.');
      return;
    }
    try {
      setActionInProgress(true);
      await adminService.updateUserStatus(suspendModal.targetUser.uid, 'suspended', suspendModal.reason.trim());
      showToast(`Account ${suspendModal.targetUser.email} has been suspended.`);
      setSuspendModal({ open: false, targetUser: null, reason: '' });
      fetchDashboardData();
    } catch (err) {
      alert(err?.message || 'Failed to suspend user account.');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleReactivateUser = async (u) => {
    if (!window.confirm(`Reactivate account for ${u.fullName || u.email}?`)) return;
    try {
      setActionInProgress(true);
      await adminService.updateUserStatus(u.uid, 'active', 'Reactivated by administrator');
      showToast(`Account ${u.email} is now active.`);
      fetchDashboardData();
    } catch (err) {
      alert(err?.message || 'Failed to reactivate user.');
    } finally {
      setActionInProgress(false);
    }
  };

  // PSYCHOLOGIST CREDENTIAL VERIFICATION HANDLERS
  const handleOpenPsychReview = (psych, action) => {
    setPsychReviewModal({ open: true, psych, action, reason: '' });
  };

  const handleConfirmPsychReview = async () => {
    const { psych, action, reason } = psychReviewModal;
    const pId = psych.psychologistId || psych.uid || psych.id;

    if (action === 'reject' && !reason.trim()) {
      alert('A documented reason is required when rejecting clinician verification.');
      return;
    }
    if (action === 'suspend' && !reason.trim()) {
      alert('A documented reason is required when suspending an authorized practitioner.');
      return;
    }

    try {
      setActionInProgress(true);
      if (action === 'approve') {
        await adminService.approvePsychologist(pId);
        showToast(`Clinician ${psych.fullName || psych.email} has been approved and verified.`);
      } else if (action === 'reject') {
        await adminService.rejectPsychologist(pId, reason.trim());
        showToast(`Clinician application for ${psych.fullName || psych.email} declined.`);
      } else if (action === 'suspend') {
        await adminService.suspendPsychologist(pId, reason.trim());
        showToast(`Practitioner ${psych.fullName || psych.email} suspended.`);
      }
      setPsychReviewModal({ open: false, psych: null, action: 'approve', reason: '' });
      fetchDashboardData();
    } catch (err) {
      alert(err?.message || 'Credential review action failed.');
    } finally {
      setActionInProgress(false);
    }
  };

  // CLINIC MANAGEMENT HANDLERS
  const handleCreateClinic = async (e) => {
    e.preventDefault();
    if (!newClinicData.name.trim() || !newClinicData.email.trim() || !newClinicData.primaryContact.trim()) {
      alert('Please provide the clinic organization name, official email, and primary contact.');
      return;
    }
    try {
      setActionInProgress(true);
      await adminService.createClinic(newClinicData);
      showToast(`Clinic "${newClinicData.name}" registered successfully.`);
      setCreateClinicModal(false);
      setNewClinicData({
        name: '',
        organizationType: 'private_group',
        primaryContact: '',
        email: '',
        phone: '',
        address: { line1: '', city: '', state: '', postalCode: '' },
        description: '',
      });
      fetchDashboardData();
    } catch (err) {
      alert(err?.message || 'Failed to register clinic.');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleUpdateClinicStatus = async (clinicId, newStatus) => {
    const reason = prompt(`Reason for setting clinic status to ${newStatus}:`);
    if (!reason) return;
    try {
      setActionInProgress(true);
      await adminService.updateClinicStatus(clinicId, newStatus, reason);
      showToast(`Clinic status updated to ${newStatus}.`);
      fetchDashboardData();
    } catch (err) {
      alert(err?.message || 'Failed to update clinic status.');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleReviewMembership = async (membershipId, newStatus) => {
    const reason = prompt(`Administrative rationale for setting membership to ${newStatus}:`) || '';
    try {
      setActionInProgress(true);
      await adminService.reviewClinicMembership(membershipId, newStatus, reason);
      showToast(`Clinic membership status updated to ${newStatus}.`);
      fetchDashboardData();
    } catch (err) {
      alert(err?.message || 'Failed to update membership status.');
    } finally {
      setActionInProgress(false);
    }
  };

  // INDEPENDENT PRACTICE OVERSIGHT HANDLERS
  const handleTogglePracticeStatus = async (practice) => {
    const isCurrentlyActive = practice.status !== 'suspended';
    const newStatus = isCurrentlyActive ? 'suspended' : 'active';
    const reason = prompt(
      isCurrentlyActive
        ? 'Please provide a documented justification for suspending this independent practice:'
        : 'Reinstatement notes:'
    );
    if (!reason) return;

    try {
      setActionInProgress(true);
      await adminService.updatePracticeStatus(practice.id, newStatus, reason);
      showToast(`Practice "${practice.practiceName}" is now ${newStatus}.`);
      fetchDashboardData();
    } catch (err) {
      alert(err?.message || 'Failed to update practice status.');
    } finally {
      setActionInProgress(false);
    }
  };

  // SUPPORT TICKET HANDLERS
  const handleSelectTicket = async (ticket) => {
    try {
      const details = await adminService.getSupportTicketDetails(ticket.id);
      setSelectedTicket(details);
    } catch (err) {
      setSelectedTicket(ticket);
    }
  };

  const handleUpdateTicketStatus = async (ticketId, status) => {
    try {
      setActionInProgress(true);
      await adminService.updateSupportTicket(ticketId, { status });
      showToast(`Ticket status updated to ${status}.`);
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket((prev) => ({ ...prev, status }));
      }
      fetchDashboardData();
    } catch (err) {
      alert(err?.message || 'Failed to update ticket status.');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleSendTicketReply = async (e) => {
    e.preventDefault();
    if (!ticketReplyText.trim()) return;

    try {
      setActionInProgress(true);
      await adminService.addSupportReply(selectedTicket.id, ticketReplyText.trim(), isInternalReply);
      showToast(isInternalReply ? 'Internal administrative note added.' : 'Reply sent to user.');
      setTicketReplyText('');
      const updated = await adminService.getSupportTicketDetails(selectedTicket.id);
      setSelectedTicket(updated);
      fetchDashboardData();
    } catch (err) {
      alert(err?.message || 'Failed to send reply.');
    } finally {
      setActionInProgress(false);
    }
  };

  // FAQ & CMS HANDLERS
  const handleOpenFaqModal = (faq = null) => {
    if (faq) {
      setFaqModal({
        open: true,
        isEdit: true,
        faq,
        question: faq.question,
        answer: faq.answer,
        category: faq.category || 'General Practice',
        order: faq.order || 1,
      });
    } else {
      setFaqModal({
        open: true,
        isEdit: false,
        faq: null,
        question: '',
        answer: '',
        category: 'General Practice',
        order: (faqs.length || 0) + 1,
      });
    }
  };

  const handleSaveFaq = async (e) => {
    e.preventDefault();
    if (!faqModal.question.trim() || !faqModal.answer.trim()) {
      alert('Both Question and Answer are required.');
      return;
    }

    try {
      setActionInProgress(true);
      if (faqModal.isEdit) {
        await adminService.updateFaq(faqModal.faq.id, {
          question: faqModal.question.trim(),
          answer: faqModal.answer.trim(),
          category: faqModal.category.trim(),
          order: Number(faqModal.order),
        });
        showToast('FAQ updated successfully.');
      } else {
        await adminService.publishFaq({
          question: faqModal.question.trim(),
          answer: faqModal.answer.trim(),
          category: faqModal.category.trim(),
          order: Number(faqModal.order),
          published: true,
        });
        showToast('New FAQ published successfully.');
      }
      setFaqModal({ open: false, isEdit: false, faq: null, question: '', answer: '', category: 'General Practice', order: 1 });
      fetchDashboardData();
    } catch (err) {
      alert(err?.message || 'Failed to save FAQ.');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleDeleteFaq = async (faqId) => {
    if (!window.confirm('Are you sure you want to delete this FAQ entry from the public website?')) return;
    try {
      setActionInProgress(true);
      await adminService.deleteFaq(faqId);
      showToast('FAQ removed.');
      fetchDashboardData();
    } catch (err) {
      alert(err?.message || 'Failed to delete FAQ.');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleToggleFaqPublish = async (faqId, currentPublished) => {
    try {
      setActionInProgress(true);
      await adminService.toggleFaqPublish(faqId, !currentPublished);
      showToast(`FAQ publication set to ${!currentPublished}.`);
      fetchDashboardData();
    } catch (err) {
      alert(err?.message || 'Failed to toggle FAQ publication.');
    } finally {
      setActionInProgress(false);
    }
  };

  // CMS Content Update
  const handleSaveCmsContent = async (e) => {
    e.preventDefault();
    try {
      setActionInProgress(true);
      await adminService.updatePublicContent(cmsEditModal.sectionKey, {
        title: cmsEditModal.title,
        content: cmsEditModal.content,
      });
      showToast(`Section "${cmsEditModal.sectionKey}" updated on public website.`);
      setCmsEditModal({ open: false, sectionKey: '', title: '', content: '' });
      fetchDashboardData();
    } catch (err) {
      alert(err?.message || 'Failed to update public content.');
    } finally {
      setActionInProgress(false);
    }
  };

  // PLATFORM SETTINGS HANDLER
  const handleSavePlatformSettings = async (e) => {
    e.preventDefault();
    try {
      setActionInProgress(true);
      await adminService.updatePlatformSettings(platformSettings);
      showToast('Platform configuration persisted successfully.');
      fetchDashboardData();
    } catch (err) {
      alert(err?.message || 'Failed to save platform settings.');
    } finally {
      setActionInProgress(false);
    }
  };

  // FILTERS
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      !userSearch ||
      (u.fullName && u.fullName.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.uid && u.uid.toLowerCase().includes(userSearch.toLowerCase()));
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const matchesStatus = userStatusFilter === 'all' || u.status === userStatusFilter || u.accountStatus === userStatusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const filteredPsychologists = psychologists.filter((p) => {
    const status = (p.approvalStatus || (p.verified ? 'approved' : 'pending')).toLowerCase();
    const matchesStatus = psychStatusFilter === 'all' || status === psychStatusFilter;
    const matchesSearch =
      !psychSearch ||
      (p.fullName && p.fullName.toLowerCase().includes(psychSearch.toLowerCase())) ||
      (p.email && p.email.toLowerCase().includes(psychSearch.toLowerCase())) ||
      (p.licenseNumber && p.licenseNumber.toLowerCase().includes(psychSearch.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const filteredClinics = clinics.filter((c) => {
    const matchesStatus = clinicStatusFilter === 'all' || c.status === clinicStatusFilter;
    const matchesSearch =
      !clinicSearch ||
      (c.name && c.name.toLowerCase().includes(clinicSearch.toLowerCase())) ||
      (c.email && c.email.toLowerCase().includes(clinicSearch.toLowerCase())) ||
      (c.primaryContact && c.primaryContact.toLowerCase().includes(clinicSearch.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const filteredPractices = independentPractices.filter((p) => {
    const matchesStatus = practiceStatusFilter === 'all' || p.status === practiceStatusFilter;
    const matchesSearch =
      !practiceSearch ||
      (p.practiceName && p.practiceName.toLowerCase().includes(practiceSearch.toLowerCase())) ||
      (p.clinicianName && p.clinicianName.toLowerCase().includes(practiceSearch.toLowerCase())) ||
      (p.clinicianEmail && p.clinicianEmail.toLowerCase().includes(practiceSearch.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const filteredTickets = supportTickets.filter((t) => {
    const matchesStatus = ticketStatusFilter === 'all' || t.status === ticketStatusFilter;
    const matchesCategory = ticketCategoryFilter === 'all' || t.category === ticketCategoryFilter;
    const matchesPriority = ticketPriorityFilter === 'all' || t.priority === ticketPriorityFilter;
    const matchesSearch =
      !ticketSearch ||
      (t.subject && t.subject.toLowerCase().includes(ticketSearch.toLowerCase())) ||
      (t.userName && t.userName.toLowerCase().includes(ticketSearch.toLowerCase())) ||
      (t.userEmail && t.userEmail.toLowerCase().includes(ticketSearch.toLowerCase())) ||
      (t.ticketNumber && t.ticketNumber.toLowerCase().includes(ticketSearch.toLowerCase()));
    return matchesStatus && matchesCategory && matchesPriority && matchesSearch;
  });

  const filteredAuditLogs = auditLogs.filter((l) => {
    const matchesAction = auditActionFilter === 'all' || l.action === auditActionFilter;
    const matchesSearch =
      !auditSearch ||
      (l.userId && l.userId.toLowerCase().includes(auditSearch.toLowerCase())) ||
      (l.action && l.action.toLowerCase().includes(auditSearch.toLowerCase())) ||
      (JSON.stringify(l.details || {})).toLowerCase().includes(auditSearch.toLowerCase());
    return matchesAction && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-teal-500 text-slate-950 font-semibold rounded-xl shadow-2xl flex items-center gap-3 border border-teal-400 animate-bounce">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Security Lockout Notice */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950/30 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="teal" size="sm">Platform Administration</Badge>
              <Badge variant="neutral" size="sm">SaaS Operations</Badge>
              {stats?.pendingApprovals > 0 && (
                <Badge variant="amber" size="sm" className="animate-pulse">
                  {stats.pendingApprovals} Clinicians Pending Review
                </Badge>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-teal-400" />
              Psyco AI Operations Console
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Logged in as <strong className="text-slate-200">{user?.displayName || user?.email}</strong> • Role: Platform Administrator
            </p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDashboardData}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-400' : ''}`} />
              Refresh Telemetry
            </Button>
          </div>
        </div>

        {/* Clinical Privacy Lockout Barrier */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-teal-500/20 text-xs text-slate-400 flex items-start gap-3">
          <Lock className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-200">Strict Clinical Privacy Lockout Barrier:</strong> Administrative accounts govern platform credentials, organizational registrations, support queues, and system telemetry, but are <span className="text-teal-300 font-semibold">strictly barred by server-side authorization and ReBAC from accessing private psychotherapy session transcripts, clinical SOAP notes, or mental-health intake records</span>.
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main 10-Tab Navigation Bar */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Users ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('psychologists')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'psychologists'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Stethoscope className="w-3.5 h-3.5" />
          <span>Clinician Approvals ({stats?.pendingApprovals || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('clinics')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'clinics'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Clinics ({clinics.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('practices')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'practices'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Independent Practices ({independentPractices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('support')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'support'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Support & Tickets ({supportTickets.filter(t => t.status !== 'resolved' && t.status !== 'closed').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('faqs')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'faqs'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>FAQs & CMS ({faqs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Audit Trail</span>
        </button>

        <button
          onClick={() => setActiveTab('health')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'health'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>System Health</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'settings'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Platform Settings</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: EXECUTIVE OVERVIEW & PENDING QUEUE */}
      {/* ============================================================ */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Telemetry Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="border-slate-800 bg-slate-900/90 p-4">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-semibold uppercase">Total Users</span>
                <Users className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-2xl font-bold text-slate-100 mt-2">{stats?.totalUsers ?? '...'}</div>
              <div className="text-[10px] text-slate-500 mt-1">{stats?.activeAccounts || 0} active accounts</div>
            </Card>

            <Card className="border-slate-800 bg-slate-900/90 p-4">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-semibold uppercase">Patients</span>
                <Users className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-2xl font-bold text-slate-100 mt-2">{stats?.patientCount ?? '...'}</div>
              <div className="text-[10px] text-slate-500 mt-1">Registered clients</div>
            </Card>

            <Card className="border-slate-800 bg-slate-900/90 p-4">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-semibold uppercase">Clinicians</span>
                <Stethoscope className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-2xl font-bold text-slate-100 mt-2">{stats?.psychologistCount ?? '...'}</div>
              <div className="text-[10px] text-teal-400 mt-1">{stats?.verifiedPsychologists || 0} verified</div>
            </Card>

            <Card className="border-slate-800 bg-slate-900/90 p-4">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-semibold uppercase">Pending Approvals</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-amber-400 mt-2">{stats?.pendingApprovals ?? '0'}</div>
              <div className="text-[10px] text-slate-500 mt-1">Requires review</div>
            </Card>

            <Card className="border-slate-800 bg-slate-900/90 p-4">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-semibold uppercase">Clinics & Practices</span>
                <Building className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-slate-100 mt-2">{stats?.totalClinics ?? clinics.length}</div>
              <div className="text-[10px] text-slate-500 mt-1">{stats?.activePractices || independentPractices.length} independent</div>
            </Card>

            <Card className="border-slate-800 bg-slate-900/90 p-4">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-semibold uppercase">Support Queue</span>
                <Mail className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-bold text-slate-100 mt-2">{stats?.pendingSupportRequests ?? '0'}</div>
              <div className="text-[10px] text-slate-500 mt-1">Open tickets</div>
            </Card>
          </div>

          {/* Pending Actions Direct Queue */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    Pending Action Items & Verification Queue
                  </h2>
                  <p className="text-xs text-slate-400">Outstanding clinician verifications, clinic registrations, and urgent support tickets.</p>
                </div>
                <Badge variant="amber" size="sm">{pendingActions.length} Pending</Badge>
              </div>

              {pendingActions.length === 0 ? (
                <Card className="border-slate-800 bg-slate-900/60 p-8 text-center">
                  <CheckCircle2 className="w-10 h-10 text-teal-400 mx-auto mb-2 opacity-80" />
                  <h3 className="text-sm font-semibold text-slate-200">All Queues Clear</h3>
                  <p className="text-xs text-slate-400 mt-1">There are no pending clinician applications or unhandled organizational registrations.</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {pendingActions.map((action, idx) => (
                    <Card key={idx} className="border-slate-800 bg-slate-900/80 p-4 hover:border-slate-700 transition-colors">
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                action.type === 'psychologist_verification'
                                  ? 'amber'
                                  : action.type === 'clinic_approval'
                                  ? 'purple'
                                  : 'rose'
                              }
                              size="sm"
                            >
                              {action.type.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <span className="text-xs font-bold text-slate-200">{action.title}</span>
                          </div>
                          <p className="text-xs text-slate-400">{action.subtitle}</p>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Submitted: {new Date(action.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveTab(action.targetTab)}
                          className="shrink-0 flex items-center gap-1.5"
                        >
                          Review <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Quick System Health Snapshot */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Server className="w-4 h-4 text-teal-400" />
                  System Health Snapshot
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('health')} className="text-xs text-teal-400">
                  Full Diagnostic →
                </Button>
              </div>

              <Card className="border-slate-800 bg-slate-900/90 p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-xs text-slate-400">Backend Server</span>
                  <Badge variant="teal" size="sm">ONLINE</Badge>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-xs text-slate-400">Firebase RTDB</span>
                  <Badge variant={systemHealth?.services?.firebaseRtdb?.status === 'HEALTHY' ? 'teal' : 'amber'} size="sm">
                    {systemHealth?.services?.firebaseRtdb?.status || 'CONNECTED'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-xs text-slate-400">Gemini Clinical AI</span>
                  <Badge variant={systemHealth?.services?.geminiAi?.status === 'HEALTHY' ? 'teal' : 'neutral'} size="sm">
                    {systemHealth?.services?.geminiAi?.status || 'CONFIGURED'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-xs text-slate-400">AssemblyAI Transcription</span>
                  <Badge variant={systemHealth?.services?.assemblyAi?.status === 'HEALTHY' ? 'teal' : 'neutral'} size="sm">
                    {systemHealth?.services?.assemblyAi?.status || 'CONFIGURED'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Google Calendar Sync</span>
                  <Badge variant={systemHealth?.services?.googleCalendar?.status === 'HEALTHY' ? 'teal' : 'neutral'} size="sm">
                    {systemHealth?.services?.googleCalendar?.status || 'CONFIGURED'}
                  </Badge>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: USER DIRECTORY & ACCOUNT GOVERNANCE */}
      {/* ============================================================ */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-400" />
                Platform User Directory & Governance
              </h2>
              <p className="text-xs text-slate-400">Search registered patients, clinicians, and administrators. Manage account suspension and verification.</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="neutral" size="sm">{filteredUsers.length} Accounts Displayed</Badge>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by name, email, or UID..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-teal-500"
              >
                <option value="all">All Roles</option>
                <option value="patient">Patients</option>
                <option value="psychologist">Psychologists</option>
                <option value="admin">Administrators</option>
              </select>
            </div>

            <div>
              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-teal-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending_verification">Pending Verification</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <Card className="border-slate-800 bg-slate-900/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4">Registered Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-400">
                        No user accounts found matching current query and filters.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSuspended = u.status === 'suspended' || u.accountStatus === 'suspended';
                      return (
                        <tr key={u.uid} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <InitialsAvatar name={u.fullName || u.email} size="sm" />
                              <div>
                                <div className="font-semibold text-slate-100">{u.fullName || 'User'}</div>
                                <div className="text-[11px] text-slate-400">{u.email}</div>
                                <div className="text-[10px] text-teal-400 font-mono">{u.uid}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 capitalize">
                            <Badge
                              variant={u.role === 'admin' ? 'teal' : u.role === 'psychologist' ? 'purple' : 'sky'}
                              size="sm"
                            >
                              {u.role}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={isSuspended ? 'red' : 'green'} size="sm" className="capitalize">
                              {u.status || 'Active'}
                            </Badge>
                            {u.statusReason && (
                              <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-xs">
                                Reason: {u.statusReason}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedUser(u)}
                                className="text-slate-400 hover:text-slate-200 text-xs"
                              >
                                Details
                              </Button>
                              {isSuspended ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleReactivateUser(u)}
                                  disabled={actionInProgress}
                                  className="text-teal-400 border-teal-500/30 text-xs"
                                >
                                  Reactivate
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenSuspendModal(u)}
                                  disabled={actionInProgress || u.uid === user?.uid}
                                  className="text-rose-400 border-rose-500/30 text-xs"
                                >
                                  Suspend
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: CLINICIAN CREDENTIAL REVIEW & VERIFICATION */}
      {/* ============================================================ */}
      {activeTab === 'psychologists' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-teal-400" />
                Psychologist Verification & Credential Review
              </h2>
              <p className="text-xs text-slate-400">
                Inspect submitted license registrations, qualifications, and clinical experience. Authorize active practice status.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="teal" size="sm">
                {psychologists.filter(p => p.approvalStatus === 'approved' || p.verified).length} Approved
              </Badge>
              <Badge variant="amber" size="sm">
                {psychologists.filter(p => p.approvalStatus === 'pending' || (!p.verified && p.approvalStatus !== 'approved' && p.approvalStatus !== 'rejected')).length} Pending
              </Badge>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by clinician name, email, or license..."
                value={psychSearch}
                onChange={(e) => setPsychSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <select
                value={psychStatusFilter}
                onChange={(e) => setPsychStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-teal-500"
              >
                <option value="all">All Verification Statuses</option>
                <option value="pending">Pending Review</option>
                <option value="approved">Approved & Verified</option>
                <option value="rejected">Rejected</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Clinician Cards Grid */}
          <div className="grid grid-cols-1 gap-4">
            {filteredPsychologists.length === 0 ? (
              <Card className="border-slate-800 bg-slate-900/60 p-12 text-center">
                <EmptyState
                  icon={Stethoscope}
                  title="No Clinician Applications Found"
                  description="There are currently no registered psychologist accounts matching your filter parameters."
                />
              </Card>
            ) : (
              filteredPsychologists.map((psych) => {
                const pId = psych.psychologistId || psych.uid || psych.id;
                const status = (psych.approvalStatus || (psych.verified ? 'approved' : 'pending')).toLowerCase();
                const isApproved = status === 'approved';
                const isRejected = status === 'rejected';
                const isSuspended = status === 'suspended';
                const isPending = !isApproved && !isRejected && !isSuspended;

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
                            <div className="flex flex-wrap items-center gap-2.5">
                              <h3 className="text-base font-bold text-slate-100">
                                {psych.fullName || 'Clinician Applicant'}
                              </h3>
                              <Badge
                                variant={isApproved ? 'green' : isPending ? 'amber' : isSuspended ? 'neutral' : 'red'}
                                size="sm"
                                className="capitalize"
                              >
                                {isApproved ? 'Approved & Verified' : isPending ? 'Pending Review' : isSuspended ? 'Suspended' : 'Rejected'}
                              </Badge>
                              {psych.canPrescribe && (
                                <Badge variant="teal" size="sm">Prescriber Authority</Badge>
                              )}
                            </div>

                            <p className="text-xs text-slate-400">
                              Email: <span className="text-slate-200">{psych.email}</span> • ID: <code className="text-[11px] text-teal-300 font-mono">{pId}</code>
                            </p>

                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-300 pt-1">
                              <div>
                                <span className="text-slate-500">License No:</span>{' '}
                                <span className="font-semibold text-slate-200 font-mono">{psych.licenseNumber || 'Not submitted'}</span>
                              </div>
                              <div>
                                <span className="text-slate-500">Experience:</span>{' '}
                                <span className="font-semibold text-slate-200">{psych.yearsOfExperience || 0} years</span>
                              </div>
                              {psych.specializations && psych.specializations.length > 0 && (
                                <div>
                                  <span className="text-slate-500">Specializations:</span>{' '}
                                  <span className="text-teal-300">
                                    {Array.isArray(psych.specializations) ? psych.specializations.join(', ') : psych.specializations}
                                  </span>
                                </div>
                              )}
                            </div>

                            {psych.bio && (
                              <p className="text-xs text-slate-400 line-clamp-2 pt-1 border-t border-slate-800/60 mt-2">
                                {psych.bio}
                              </p>
                            )}

                            {psych.rejectionReason && (
                              <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/20 text-xs text-red-200 mt-2">
                                <strong>Review Note:</strong> {psych.rejectionReason}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex sm:flex-col items-center gap-2 shrink-0 self-end md:self-start">
                          {isPending && (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleOpenPsychReview(psych, 'approve')}
                                disabled={actionInProgress}
                                className="w-full flex items-center justify-center gap-1.5"
                              >
                                <Check className="w-3.5 h-3.5" /> Approve Credentials
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenPsychReview(psych, 'reject')}
                                disabled={actionInProgress}
                                className="w-full text-rose-400 border-rose-500/30 flex items-center justify-center gap-1.5"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Reject
                              </Button>
                            </>
                          )}
                          {isApproved && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenPsychReview(psych, 'suspend')}
                              disabled={actionInProgress}
                              className="w-full text-amber-400 border-amber-500/30 flex items-center justify-center gap-1.5"
                            >
                              Suspend Credentials
                            </Button>
                          )}
                          {isSuspended && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenPsychReview(psych, 'approve')}
                              disabled={actionInProgress}
                              className="w-full text-teal-400 border-teal-500/30 flex items-center justify-center gap-1.5"
                            >
                              Reinstate
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 4: CLINIC MANAGEMENT & MEMBERSHIPS */}
      {/* ============================================================ */}
      {activeTab === 'clinics' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Building className="w-4 h-4 text-purple-400" />
                Clinic Organization Directory & Governance
              </h2>
              <p className="text-xs text-slate-400">
                Register clinical groups, approve healthcare organizations, and manage clinician practice memberships.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCreateClinicModal(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" /> Register New Clinic
            </Button>
          </div>

          {/* Clinics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClinics.length === 0 ? (
              <div className="col-span-full">
                <Card className="border-slate-800 bg-slate-900/60 p-12 text-center">
                  <EmptyState
                    icon={Building}
                    title="No Clinics Found"
                    description="No registered clinics match the active criteria. Use 'Register New Clinic' to add an organization."
                  />
                </Card>
              </div>
            ) : (
              filteredClinics.map((clinic) => (
                <Card key={clinic.id} className="border-slate-800 bg-slate-900/80 p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="font-bold text-slate-100 text-sm">{clinic.name}</div>
                      <Badge variant="purple" size="sm" className="capitalize">
                        {clinic.organizationType.replace('_', ' ')}
                      </Badge>
                    </div>
                    <Badge variant={clinic.status === 'active' ? 'green' : 'amber'} size="sm" className="capitalize">
                      {clinic.status}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-xs text-slate-400">
                    <div>Primary Contact: <strong className="text-slate-200">{clinic.primaryContact || 'N/A'}</strong></div>
                    <div>Email: <span className="text-teal-300">{clinic.email}</span></div>
                    {clinic.phone && <div>Phone: <span className="text-slate-300">{clinic.phone}</span></div>}
                    <div>
                      Members: <strong className="text-slate-200">{clinic.membershipCount || 0} clinicians</strong>
                      {clinic.pendingMembershipCount > 0 && (
                        <span className="text-amber-400 font-semibold ml-2">({clinic.pendingMembershipCount} pending)</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    {clinic.status === 'active' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateClinicStatus(clinic.id, 'suspended')}
                        disabled={actionInProgress}
                        className="text-amber-400 border-amber-500/30 text-xs"
                      >
                        Suspend Clinic
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateClinicStatus(clinic.id, 'active')}
                        disabled={actionInProgress}
                        className="text-teal-400 border-teal-500/30 text-xs"
                      >
                        Activate Clinic
                      </Button>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Sub-section: Clinician Membership Affiliation Requests */}
          <div className="pt-6 border-t border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-400" />
              Clinician Clinic Membership Requests ({clinicMemberships.length})
            </h3>
            <Card className="border-slate-800 bg-slate-900/80 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase text-[10px]">
                      <th className="py-2.5 px-4">Clinician</th>
                      <th className="py-2.5 px-4">Target Clinic</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4">Requested Date</th>
                      <th className="py-2.5 px-4 text-right">Review Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {clinicMemberships.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-6 text-center text-slate-500">
                          No clinic membership affiliation requests found.
                        </td>
                      </tr>
                    ) : (
                      clinicMemberships.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-semibold text-slate-100">
                            {m.psychologistName || m.psychologistId}
                          </td>
                          <td className="py-3 px-4 text-teal-300 font-medium">
                            {m.clinicName || m.clinicId}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={m.status === 'approved' ? 'green' : m.status === 'pending' ? 'amber' : 'red'} size="sm">
                              {m.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                            {m.requestedAt ? new Date(m.requestedAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {m.status === 'pending' ? (
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleReviewMembership(m.id, 'approved')}
                                  disabled={actionInProgress}
                                  className="text-teal-400 border-teal-500/30 text-xs"
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleReviewMembership(m.id, 'rejected')}
                                  disabled={actionInProgress}
                                  className="text-rose-400 border-rose-500/30 text-xs"
                                >
                                  Reject
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReviewMembership(m.id, m.status === 'approved' ? 'revoked' : 'approved')}
                                disabled={actionInProgress}
                                className="text-slate-400 hover:text-slate-200 text-xs"
                              >
                                {m.status === 'approved' ? 'Revoke Membership' : 'Re-approve'}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 5: INDEPENDENT PRACTICE OVERSIGHT */}
      {/* ============================================================ */}
      {activeTab === 'practices' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Globe className="w-4 h-4 text-teal-400" />
                Independent Clinician Practice Oversight
              </h2>
              <p className="text-xs text-slate-400">
                Supervise autonomous psychologist practices operating without clinic affiliation. Inspect consultation modes and office configurations.
              </p>
            </div>
            <Badge variant="teal" size="sm">{independentPractices.length} Independent Practices Registered</Badge>
          </div>

          {/* Practices Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPractices.length === 0 ? (
              <div className="col-span-full">
                <Card className="border-slate-800 bg-slate-900/60 p-12 text-center">
                  <EmptyState
                    icon={Globe}
                    title="No Independent Practices"
                    description="No independent clinical practices found."
                  />
                </Card>
              </div>
            ) : (
              filteredPractices.map((p) => {
                const isActive = p.status !== 'suspended';
                return (
                  <Card key={p.id} className="border-slate-800 bg-slate-900/80 p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="font-bold text-slate-100 text-sm">{p.practiceName}</div>
                        <div className="text-xs text-slate-400">Clinician: <strong className="text-slate-200">{p.clinicianName}</strong></div>
                      </div>
                      <Badge variant={isActive ? 'green' : 'red'} size="sm">
                        {p.status || 'Active'}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-xs text-slate-400">
                      <div>Consultation Modes: <Badge variant="teal" size="sm" className="capitalize">{p.offeredModes || 'both'}</Badge></div>
                      <div>Physical Locations: <strong className="text-slate-200">{p.locationsCount} registered</strong></div>
                      <div>Session Duration: <span className="text-slate-300">{p.appointmentDurationMinutes || 50} mins</span></div>
                      <div>Buffer Time: <span className="text-slate-300">{p.bufferTimeMinutes || 10} mins</span></div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-mono">ID: {p.id}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTogglePracticeStatus(p)}
                        disabled={actionInProgress}
                        className={`text-xs ${isActive ? 'text-amber-400 border-amber-500/30' : 'text-teal-400 border-teal-500/30'}`}
                      >
                        {isActive ? 'Suspend Practice' : 'Reinstate Practice'}
                      </Button>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 6: SUPPORT & TICKETS WORKSPACE */}
      {/* ============================================================ */}
      {activeTab === 'support' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Mail className="w-4 h-4 text-rose-400" />
                Support Ticket Management & Contact Queue
              </h2>
              <p className="text-xs text-slate-400">Resolve patient and psychologist platform issues. Maintain strict separation from private health records.</p>
            </div>
            <Badge variant="rose" size="sm">{filteredTickets.length} Tickets</Badge>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search ticket subject, user, email..."
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <select
                value={ticketStatusFilter}
                onChange={(e) => setTicketStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-teal-500"
              >
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting_user">Waiting for User</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <select
                value={ticketCategoryFilter}
                onChange={(e) => setTicketCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-teal-500"
              >
                <option value="all">All Categories</option>
                <option value="account_access">Account Access</option>
                <option value="registration">Registration</option>
                <option value="psychologist_verification">Psychologist Verification</option>
                <option value="appointment_problems">Appointment Inquiries</option>
                <option value="technical_difficulties">Technical Difficulties</option>
                <option value="general_assistance">General Assistance</option>
              </select>
            </div>

            <div>
              <select
                value={ticketPriorityFilter}
                onChange={(e) => setTicketPriorityFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-teal-500"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Tickets List */}
          <div className="grid grid-cols-1 gap-3">
            {filteredTickets.length === 0 ? (
              <Card className="border-slate-800 bg-slate-900/60 p-12 text-center">
                <EmptyState
                  icon={Mail}
                  title="No Support Tickets Found"
                  description="All customer support and inquiries are clear."
                />
              </Card>
            ) : (
              filteredTickets.map((t) => (
                <Card
                  key={t.id}
                  onClick={() => handleSelectTicket(t)}
                  className="border-slate-800 bg-slate-900/80 p-4 hover:border-slate-700 cursor-pointer transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            t.priority === 'urgent'
                              ? 'red'
                              : t.priority === 'high'
                              ? 'amber'
                              : 'neutral'
                          }
                          size="sm"
                          className="uppercase font-mono text-[9px]"
                        >
                          {t.priority}
                        </Badge>
                        <span className="text-xs font-mono text-teal-400 font-bold">{t.ticketNumber}</span>
                        <h4 className="text-sm font-semibold text-slate-100">{t.subject}</h4>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1">{t.message}</p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                        <span>From: <strong className="text-slate-300">{t.userName}</strong> ({t.userEmail})</span>
                        <span>Category: <strong className="text-slate-300 capitalize">{t.category?.replace('_', ' ')}</strong></span>
                        <span>Date: {new Date(t.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={
                          t.status === 'resolved' || t.status === 'closed'
                            ? 'green'
                            : t.status === 'new'
                            ? 'amber'
                            : 'teal'
                        }
                        size="sm"
                        className="capitalize"
                      >
                        {t.status.replace('_', ' ')}
                      </Badge>
                      <Button variant="ghost" size="sm" className="text-xs text-teal-400">
                        View Thread →
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 7: FAQ MODERATION & CMS WORKSPACE */}
      {/* ============================================================ */}
      {activeTab === 'faqs' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-purple-400" />
                Frequently Asked Questions (FAQ) & Public CMS
              </h2>
              <p className="text-xs text-slate-400">Manage published public FAQs and update editable informational sections on the public site.</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenFaqModal()}
                className="flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" /> Create New FAQ
              </Button>
            </div>
          </div>

          {/* FAQs List */}
          <div className="space-y-3">
            {faqs.length === 0 ? (
              <Card className="border-slate-800 bg-slate-900/60 p-12 text-center">
                <EmptyState
                  icon={HelpCircle}
                  title="No FAQs Configured"
                  description="Click 'Create New FAQ' to author an answer for public website visitors."
                />
              </Card>
            ) : (
              faqs.map((f) => (
                <Card key={f.id} className="border-slate-800 bg-slate-900/80 p-5 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="neutral" size="sm">{f.category || 'General'}</Badge>
                        <Badge variant={f.published ? 'green' : 'amber'} size="sm">
                          {f.published ? 'Published' : 'Draft'}
                        </Badge>
                        <span className="text-[10px] text-slate-500 font-mono">Order: {f.order || 1}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-100 pt-1">{f.question}</h4>
                      <p className="text-xs text-slate-300 whitespace-pre-line">{f.answer}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleFaqPublish(f.id, f.published)}
                        disabled={actionInProgress}
                        className="text-xs"
                      >
                        {f.published ? 'Unpublish' : 'Publish'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenFaqModal(f)}
                        className="text-xs text-slate-300"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFaq(f.id)}
                        className="text-xs text-rose-400 hover:text-rose-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 8: AUDIT TRAIL */}
      {/* ============================================================ */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <History className="w-4 h-4 text-teal-400" />
                Immutable Compliance Audit Trail
              </h2>
              <p className="text-xs text-slate-400">Append-only operational record of user status changes, credential verification decisions, and settings updates.</p>
            </div>
            <Badge variant="teal" size="sm">{filteredAuditLogs.length} Records Logged</Badge>
          </div>

          {/* Search & Action Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search audit trail by actor UID or metadata..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-teal-500"
              >
                <option value="all">All Recorded Actions</option>
                <option value="PSYCHOLOGIST_APPROVED">Psychologist Approved</option>
                <option value="PSYCHOLOGIST_REJECTED">Psychologist Rejected</option>
                <option value="USER_SUSPENDED">User Suspended</option>
                <option value="USER_REACTIVATED">User Reactivated</option>
                <option value="CLINIC_CREATED">Clinic Created</option>
                <option value="CLINIC_STATUS_UPDATED">Clinic Status Updated</option>
                <option value="PLATFORM_SETTINGS_UPDATED">Settings Updated</option>
              </select>
            </div>
          </div>

          {/* Audit Logs Table */}
          <Card className="border-slate-800 bg-slate-900/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase text-[10px]">
                    <th className="py-2.5 px-4">Action Event</th>
                    <th className="py-2.5 px-4">Actor UID</th>
                    <th className="py-2.5 px-4">Details / Parameters</th>
                    <th className="py-2.5 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-slate-500">
                        No audit events match the active search.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4">
                          <Badge variant="teal" size="sm" className="font-mono text-[10px]">
                            {log.action}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                          {log.userId || log.actorUid || 'SYSTEM'}
                        </td>
                        <td className="py-3 px-4 text-slate-300 font-mono text-[11px] max-w-md truncate">
                          {JSON.stringify(log.details || {})}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 9: SYSTEM HEALTH & INTEGRATION MONITORING */}
      {/* ============================================================ */}
      {activeTab === 'health' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Server className="w-4 h-4 text-teal-400" />
                System Integration Diagnostics & Operational Health
              </h2>
              <p className="text-xs text-slate-400">
                Inspect connectivity status for backend services, Firebase Authentication, Firebase RTDB, and external AI integrations.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchDashboardData} disabled={loading} className="text-xs">
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin text-teal-400' : ''}`} /> Run Diagnostic Check
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {systemHealth?.services &&
              Object.entries(systemHealth.services).map(([key, s]) => {
                const isHealthy = s.status === 'HEALTHY' || s.status === 'ONLINE';
                const isNotConfig = s.status === 'NOT_CONFIGURED';
                return (
                  <Card key={key} className="border-slate-800 bg-slate-900/80 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-100">{s.name}</span>
                      <Badge
                        variant={isHealthy ? 'green' : isNotConfig ? 'neutral' : 'amber'}
                        size="sm"
                      >
                        {s.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-400 space-y-1">
                      {s.uptime && <div>Uptime: <strong className="text-slate-200">{s.uptime}</strong></div>}
                      {s.mode && <div>Mode: <code className="text-teal-300 text-[10px]">{s.mode}</code></div>}
                      {s.alignment && <div>Alignment: <strong className="text-slate-200">{s.alignment}</strong></div>}
                    </div>
                  </Card>
                );
              })}
          </div>

          {/* Process Telemetry */}
          <Card className="border-slate-800 bg-slate-900/90 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-400" /> Process Resources & Storage Invariant
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-300 pt-2">
              <div>
                <span className="text-slate-500">Node Engine:</span>{' '}
                <span className="font-mono font-semibold text-slate-200">{systemHealth?.process?.nodeVersion || 'v20.x'}</span>
              </div>
              <div>
                <span className="text-slate-500">Heap Used:</span>{' '}
                <span className="font-mono font-semibold text-slate-200">{systemHealth?.process?.memoryUsageMb?.heapUsed || 0} MB</span>
              </div>
              <div>
                <span className="text-slate-500">Storage Invariant:</span>{' '}
                <span className="font-semibold text-teal-300">Firebase RTDB (Text/JSON Only)</span>
              </div>
              <div>
                <span className="text-slate-500">Binary Media Policy:</span>{' '}
                <span className="font-semibold text-emerald-400">Strict Zero Media Invariant</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 10: PLATFORM SETTINGS */}
      {/* ============================================================ */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Settings className="w-4 h-4 text-teal-400" />
              Platform Operational Configuration
            </h2>
            <p className="text-xs text-slate-400">Manage global practice defaults, support contact information, registration policies, and maintenance mode.</p>
          </div>

          {platformSettings && (
            <form onSubmit={handleSavePlatformSettings} className="space-y-6 max-w-3xl">
              <Card className="border-slate-800 bg-slate-900/80 p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2">Branding & Support Contact</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Platform Brand Name</label>
                    <input
                      type="text"
                      value={platformSettings.platformName || ''}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, platformName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Public Support Email</label>
                    <input
                      type="email"
                      value={platformSettings.supportEmail || ''}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, supportEmail: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Public Support Phone</label>
                    <input
                      type="text"
                      value={platformSettings.supportPhone || ''}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, supportPhone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Default Platform Timezone</label>
                    <input
                      type="text"
                      value={platformSettings.defaultTimezone || ''}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, defaultTimezone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2 pt-4">Clinical Appointment Defaults</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Default Duration (Minutes)</label>
                    <input
                      type="number"
                      value={platformSettings.defaultAppointmentDuration || 50}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, defaultAppointmentDuration: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Default Buffer Time (Minutes)</label>
                    <input
                      type="number"
                      value={platformSettings.defaultBufferTime || 10}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, defaultBufferTime: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2 pt-4">Registration & Verification Governance</h3>
                <div className="space-y-3 pt-1">
                  <label className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(platformSettings.allowPatientRegistration)}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, allowPatientRegistration: e.target.checked })}
                      className="rounded border-slate-800 bg-slate-950 text-teal-500"
                    />
                    <span>Allow Public Patient Registration</span>
                  </label>
                  <label className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(platformSettings.allowClinicianRegistration)}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, allowClinicianRegistration: e.target.checked })}
                      className="rounded border-slate-800 bg-slate-950 text-teal-500"
                    />
                    <span>Allow Clinician Onboarding Registration</span>
                  </label>
                  <label className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(platformSettings.requireCredentialVerification)}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, requireCredentialVerification: e.target.checked })}
                      className="rounded border-slate-800 bg-slate-950 text-teal-500"
                    />
                    <span>Strict Credential Verification Gate (No appointments prior to admin approval)</span>
                  </label>
                </div>

                <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2 pt-4">Maintenance Announcement</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(platformSettings.maintenanceMode)}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, maintenanceMode: e.target.checked })}
                      className="rounded border-slate-800 bg-slate-950 text-amber-500"
                    />
                    <span className="text-amber-400 font-semibold">Enable Public Maintenance Banner</span>
                  </label>
                  {platformSettings.maintenanceMode && (
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Maintenance Banner Announcement Text</label>
                      <input
                        type="text"
                        value={platformSettings.maintenanceAnnouncement || ''}
                        onChange={(e) => setPlatformSettings({ ...platformSettings, maintenanceAnnouncement: e.target.value })}
                        placeholder="e.g., Scheduled infrastructure maintenance will occur on Sunday at 02:00 AM UTC."
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-4 flex justify-end">
                  <Button type="submit" variant="primary" disabled={actionInProgress} className="flex items-center gap-2">
                    <Check className="w-4 h-4" /> Save Platform Configuration
                  </Button>
                </div>
              </Card>
            </form>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 1: SUSPEND USER ACCOUNT */}
      {/* ============================================================ */}
      {suspendModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              Suspend Account: {suspendModal.targetUser?.fullName || suspendModal.targetUser?.email}
            </h3>
            <p className="text-xs text-slate-400">
              Suspended users will immediately lose access to authenticated workflows. Documenting an administrative justification is required for the audit trail.
            </p>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Administrative Reason (Required)</label>
              <textarea
                rows="3"
                value={suspendModal.reason}
                onChange={(e) => setSuspendModal({ ...suspendModal, reason: e.target.value })}
                placeholder="Document justification for suspension..."
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSuspendModal({ open: false, targetUser: null, reason: '' })}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleConfirmSuspend}
                disabled={actionInProgress || !suspendModal.reason.trim()}
                className="text-rose-400 border-rose-500/30"
              >
                Confirm Account Suspension
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: CLINICIAN REVIEW MODAL */}
      {/* ============================================================ */}
      {psychReviewModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              {psychReviewModal.action === 'approve' ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-teal-400" />
                  Approve Clinician: {psychReviewModal.psych?.fullName}
                </>
              ) : psychReviewModal.action === 'suspend' ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  Suspend Clinician: {psychReviewModal.psych?.fullName}
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-400" />
                  Reject Clinician Application
                </>
              )}
            </h3>

            <p className="text-xs text-slate-400">
              {psychReviewModal.action === 'approve'
                ? 'Approving this application marks credentials as verified and authorizes the psychologist to offer independent or clinic appointments.'
                : 'Please document the justification for this verification decision. It will be recorded in the audit log.'}
            </p>

            {psychReviewModal.action !== 'approve' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Reason (Required)</label>
                <textarea
                  rows="3"
                  value={psychReviewModal.reason}
                  onChange={(e) => setPsychReviewModal({ ...psychReviewModal, reason: e.target.value })}
                  placeholder="Enter reason for rejection or suspension..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPsychReviewModal({ open: false, psych: null, action: 'approve', reason: '' })}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmPsychReview}
                disabled={actionInProgress || (psychReviewModal.action !== 'approve' && !psychReviewModal.reason.trim())}
              >
                Confirm Decision
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: REGISTER NEW CLINIC */}
      {/* ============================================================ */}
      {createClinicModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Building className="w-5 h-5 text-purple-400" /> Register Clinic Organization
            </h3>
            <form onSubmit={handleCreateClinic} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Clinic Name</label>
                <input
                  type="text"
                  required
                  value={newClinicData.name}
                  onChange={(e) => setNewClinicData({ ...newClinicData, name: e.target.value })}
                  placeholder="e.g., MindCare Clinical Group"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Organization Type</label>
                  <select
                    value={newClinicData.organizationType}
                    onChange={(e) => setNewClinicData({ ...newClinicData, organizationType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200"
                  >
                    <option value="private_group">Private Group Practice</option>
                    <option value="hospital">Hospital Department</option>
                    <option value="wellness_center">Wellness Center</option>
                    <option value="outpatient_clinic">Outpatient Clinic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Primary Contact Person</label>
                  <input
                    type="text"
                    required
                    value={newClinicData.primaryContact}
                    onChange={(e) => setNewClinicData({ ...newClinicData, primaryContact: e.target.value })}
                    placeholder="e.g., Dr. Elena Vance"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Official Email</label>
                  <input
                    type="email"
                    required
                    value={newClinicData.email}
                    onChange={(e) => setNewClinicData({ ...newClinicData, email: e.target.value })}
                    placeholder="contact@mindcare.org"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={newClinicData.phone}
                    onChange={(e) => setNewClinicData({ ...newClinicData, phone: e.target.value })}
                    placeholder="+91 (0) 80 4123 4567"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">City & Facility Address</label>
                <input
                  type="text"
                  value={newClinicData.address.city}
                  onChange={(e) =>
                    setNewClinicData({
                      ...newClinicData,
                      address: { ...newClinicData.address, city: e.target.value },
                    })
                  }
                  placeholder="e.g., Bengaluru, Karnataka"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button variant="ghost" size="sm" type="button" onClick={() => setCreateClinicModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={actionInProgress}>
                  Register Clinic
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: SUPPORT TICKET DETAILS & REPLY DRAWER */}
      {/* ============================================================ */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-teal-400 font-bold">{selectedTicket.ticketNumber}</span>
                  <Badge variant="neutral" size="sm" className="capitalize">
                    {selectedTicket.category?.replace('_', ' ')}
                  </Badge>
                  <Badge variant="teal" size="sm" className="capitalize">
                    {selectedTicket.status}
                  </Badge>
                </div>
                <h3 className="text-base font-bold text-slate-100 mt-1">{selectedTicket.subject}</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)}>
                Close
              </Button>
            </div>

            {/* Warning Alert */}
            <div className="p-3 rounded-lg bg-slate-950 border border-amber-500/20 text-[11px] text-amber-200/90 flex items-start gap-2.5 shrink-0">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>Support personnel must not request or persist private mental-health clinical notes or therapy disclosures in ticket responses.</span>
            </div>

            {/* Conversation Thread */}
            <div className="overflow-y-auto space-y-3 p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex-1">
              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <strong className="text-slate-200">{selectedTicket.userName || 'User'}</strong>
                  <span className="text-slate-500">{new Date(selectedTicket.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-xs text-slate-300 whitespace-pre-line">{selectedTicket.message}</p>
              </div>

              {selectedTicket.replies &&
                selectedTicket.replies.map((rep, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg space-y-1 ${
                      rep.isInternal
                        ? 'bg-amber-950/20 border border-amber-500/30'
                        : 'bg-teal-950/20 border border-teal-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                        {rep.senderRole === 'admin' ? 'Support Administrator' : 'User'}
                        {rep.isInternal && <Badge variant="amber" size="sm">Internal Note</Badge>}
                      </span>
                      <span className="text-slate-500">{new Date(rep.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-300 whitespace-pre-line">{rep.message}</p>
                  </div>
                ))}
            </div>

            {/* Reply Composer */}
            <form onSubmit={handleSendTicketReply} className="space-y-3 shrink-0">
              <textarea
                rows="3"
                value={ticketReplyText}
                onChange={(e) => setTicketReplyText(e.target.value)}
                placeholder="Type your response to the user or internal administrative note..."
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-teal-500"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInternalReply}
                    onChange={(e) => setIsInternalReply(e.target.checked)}
                    className="rounded border-slate-800 bg-slate-950 text-amber-500"
                  />
                  <span>Internal Note Only (Hidden from user)</span>
                </label>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateTicketStatus(selectedTicket.id, selectedTicket.status === 'resolved' ? 'open' : 'resolved')}
                    className="text-xs"
                  >
                    {selectedTicket.status === 'resolved' ? 'Reopen Ticket' : 'Mark Resolved'}
                  </Button>
                  <Button type="submit" variant="primary" size="sm" disabled={actionInProgress || !ticketReplyText.trim()}>
                    <Send className="w-3.5 h-3.5 mr-1" /> Send Reply
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 5: CREATE / EDIT FAQ */}
      {/* ============================================================ */}
      {faqModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-purple-400" />
              {faqModal.isEdit ? 'Edit FAQ Item' : 'Author Public FAQ Item'}
            </h3>
            <form onSubmit={handleSaveFaq} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Question</label>
                <input
                  type="text"
                  required
                  value={faqModal.question}
                  onChange={(e) => setFaqModal({ ...faqModal, question: e.target.value })}
                  placeholder="e.g., Does Psyco AI store permanent audio recordings?"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={faqModal.category}
                    onChange={(e) => setFaqModal({ ...faqModal, category: e.target.value })}
                    placeholder="General Practice"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={faqModal.order}
                    onChange={(e) => setFaqModal({ ...faqModal, order: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Answer</label>
                <textarea
                  rows="4"
                  required
                  value={faqModal.answer}
                  onChange={(e) => setFaqModal({ ...faqModal, answer: e.target.value })}
                  placeholder="Provide an authoritative and clinically accurate answer..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setFaqModal({ open: false, isEdit: false, faq: null, question: '', answer: '', category: 'General Practice', order: 1 })}
                >
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={actionInProgress}>
                  {faqModal.isEdit ? 'Update FAQ' : 'Publish FAQ'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
