import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Shield, ShieldCheck, Key, Lock, Edit3, Trash2, Search, 
  Filter, Check, AlertCircle, RefreshCw, Eye, EyeOff, Loader2, Phone, Mail, 
  Calendar, ShieldAlert, UserCheck, CheckCircle2, XCircle, AlertTriangle, X,
  MapPin, Building2, Radio, Car, ExternalLink, Award, Sparkles, CheckCheck,
  LayoutGrid, List
} from 'lucide-react';
import { UserRole, AdminUserAccount, UserCategory, ResponderApprovalStatus, ResponderPartner } from '../types';

interface AdminUserManagementProps {
  currentAdminEmail?: string;
  onOpenMyPasswordChange?: () => void;
  initialSearchQuery?: string;
}

const POPULAR_COVERAGE_AREAS = [
  'N1 Midrand to Centurion',
  'Pretoria East & N4 Corridor',
  'Sandton, Rivonia & N3 Buccleuch',
  'Johannesburg CBD & M1 Corridors',
  'R21 Airport / Kempton Park Corridor',
  'Ekurhuleni East Rand & N12',
  'West Rand / Krugersdorp (N14 / Ontdekkers)',
  'All Gauteng Highway Corridors'
];

export const AdminUserManagement: React.FC<AdminUserManagementProps> = ({
  currentAdminEmail = '',
  onOpenMyPasswordChange,
  initialSearchQuery = ''
}) => {
  const [users, setUsers] = useState<AdminUserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [approvalFilter, setApprovalFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isTriggeringTestAlert, setIsTriggeringTestAlert] = useState(false);

  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editTargetUser, setEditTargetUser] = useState<AdminUserAccount | null>(null);
  const [passwordResetTarget, setPasswordResetTarget] = useState<AdminUserAccount | null>(null);
  const [deleteTargetUser, setDeleteTargetUser] = useState<AdminUserAccount | null>(null);

  // Responder Approval Modal State
  const [approvingUser, setApprovingUser] = useState<AdminUserAccount | null>(null);
  const [approveArea, setApproveArea] = useState('');
  const [approveOrg, setApproveOrg] = useState('');
  const [approveType, setApproveType] = useState<ResponderPartner['type']>('partner_responder');
  const [approveCallsign, setApproveCallsign] = useState('');
  const [approvePhone, setApprovePhone] = useState('');
  const [approveNotes, setApproveNotes] = useState('');
  const [isSubmittingApprove, setIsSubmittingApprove] = useState(false);

  // Reject Confirmation State
  const [rejectingUser, setRejectingUser] = useState<AdminUserAccount | null>(null);
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  // Form states for Add User
  const [newFullName, setNewFullName] = useState('');
  const [newSurname, setNewSurname] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCellNumber, setNewCellNumber] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('admin');
  const [newStatus, setNewStatus] = useState<'active' | 'suspended'>('active');
  const [newUserCategory, setNewUserCategory] = useState<UserCategory>('community');
  const [newOrganizationName, setNewOrganizationName] = useState('');
  const [newCoverageArea, setNewCoverageArea] = useState('');
  const [newResponderType, setNewResponderType] = useState<ResponderPartner['type']>('partner_responder');
  const [newResponderCallsign, setNewResponderCallsign] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Form states for Edit User
  const [editFullName, setEditFullName] = useState('');
  const [editSurname, setEditSurname] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCellNumber, setEditCellNumber] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('admin');
  const [editStatus, setEditStatus] = useState<'active' | 'suspended'>('active');
  const [editUserCategory, setEditUserCategory] = useState<UserCategory>('community');
  const [editOrganizationName, setEditOrganizationName] = useState('');
  const [editCoverageArea, setEditCoverageArea] = useState('');
  const [editResponderType, setEditResponderType] = useState<ResponderPartner['type']>('partner_responder');
  const [editResponderCallsign, setEditResponderCallsign] = useState('');
  const [editResponderApprovalStatus, setEditResponderApprovalStatus] = useState<ResponderApprovalStatus>('none');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Form states for Password Reset
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);

  const handleTriggerTestAlert = async () => {
    setIsTriggeringTestAlert(true);
    try {
      const res = await fetch('/api/admin/users/test-registration-alert', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showNotification('success', 'Test user registration alert dispatched! The popup should appear momentarily.');
        loadUsers();
      } else {
        showNotification('error', 'Failed to dispatch test registration alert.');
      }
    } catch (e) {
      showNotification('error', 'Network error triggering test alert.');
    } finally {
      setIsTriggeringTestAlert(false);
    }
  };

  const showNotification = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 4000);
  };

  const getAuthHeaders = () => {
    const token =
      sessionStorage.getItem('adminToken') ||
      localStorage.getItem('adminToken') ||
      'admin-auth-token-charlesodendaal43';
    const email = currentAdminEmail || 'charlesodendaal43@gmail.com';
    return {
      'Content-Type': 'application/json',
      'x-user-email': email,
      'x-admin-email': email,
      'x-admin-token': token,
      'x-admin-role': 'super_admin',
      'x-user-role': 'super_admin',
      'Authorization': `Bearer ${token}`
    };
  };

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.users) {
          setUsers(data.users);
        }
      } else if (res.status === 403) {
        showNotification('error', 'Unauthorized: Chief Admin privileges required to manage users.');
      } else {
        showNotification('error', 'Failed to fetch users from server.');
      }
    } catch (err) {
      showNotification('error', 'Network error fetching users list.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery = 
      !query ||
      u.fullName.toLowerCase().includes(query) ||
      u.surname.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.cellNumber.toLowerCase().includes(query) ||
      (u.organizationName && u.organizationName.toLowerCase().includes(query)) ||
      (u.coverageArea && u.coverageArea.toLowerCase().includes(query)) ||
      (u.responderCallsign && u.responderCallsign.toLowerCase().includes(query)) ||
      (u.role && u.role.toLowerCase().includes(query));

    const matchesRole = 
      roleFilter === 'all' || 
      (roleFilter === 'admin' && (u.role === 'admin' || u.role === 'super_admin')) ||
      (roleFilter === 'super_admin' && u.role === 'super_admin') ||
      (roleFilter === 'moderator' && u.role === 'moderator') ||
      (roleFilter === 'patrol' && u.role === 'patrol') ||
      (roleFilter === 'user' && (!u.role || u.role === 'user'));

    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && (u.status === 'active' || !u.status)) ||
      (statusFilter === 'suspended' && u.status === 'suspended');

    const matchesCategory =
      categoryFilter === 'all' ||
      (categoryFilter === 'community' && (!u.userCategory || u.userCategory === 'community')) ||
      (categoryFilter === 'responder' && u.userCategory === 'responder') ||
      (categoryFilter === 'law_enforcement' && u.userCategory === 'law_enforcement') ||
      (categoryFilter === 'advertiser' && u.userCategory === 'advertiser');

    const matchesApproval =
      approvalFilter === 'all' ||
      (approvalFilter === 'pending' && u.responderApprovalStatus === 'pending') ||
      (approvalFilter === 'approved' && u.responderApprovalStatus === 'approved') ||
      (approvalFilter === 'rejected' && u.responderApprovalStatus === 'rejected') ||
      (approvalFilter === 'none' && (!u.responderApprovalStatus || u.responderApprovalStatus === 'none'));

    return matchesQuery && matchesRole && matchesStatus && matchesCategory && matchesApproval;
  });

  // Handle Add User
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName || !newSurname || !newEmail || !newPassword || !newCellNumber) {
      showNotification('error', 'Please fill in all required fields.');
      return;
    }
    if (newPassword.length < 4) {
      showNotification('error', 'Password must be at least 4 characters long.');
      return;
    }

    setIsSubmittingAdd(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          fullName: newFullName,
          surname: newSurname,
          email: newEmail,
          cellNumber: newCellNumber,
          password: newPassword,
          role: newRole,
          status: newStatus,
          userCategory: newUserCategory,
          organizationName: newOrganizationName || undefined,
          coverageArea: newCoverageArea || undefined,
          responderType: newResponderType,
          responderCallsign: newResponderCallsign || undefined,
          responderApprovalStatus: (newUserCategory === 'responder' || newUserCategory === 'law_enforcement') ? 'approved' : 'none'
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('success', `User ${newFullName} ${newSurname} created successfully!`);
        setIsAddModalOpen(false);
        setNewFullName('');
        setNewSurname('');
        setNewEmail('');
        setNewCellNumber('');
        setNewPassword('');
        setNewRole('admin');
        setNewUserCategory('community');
        setNewOrganizationName('');
        setNewCoverageArea('');
        setNewResponderType('partner_responder');
        setNewResponderCallsign('');
        loadUsers();
      } else {
        showNotification('error', data.error || 'Failed to create user account.');
      }
    } catch (err) {
      showNotification('error', 'Network error creating user.');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (user: AdminUserAccount) => {
    setEditTargetUser(user);
    setEditFullName(user.fullName);
    setEditSurname(user.surname);
    setEditEmail(user.email);
    setEditCellNumber(user.cellNumber);
    setEditRole(user.role || 'user');
    setEditStatus(user.status || 'active');
    setEditUserCategory(user.userCategory || (user.companyName ? 'advertiser' : 'community'));
    setEditOrganizationName(user.organizationName || user.companyName || '');
    setEditCoverageArea(user.coverageArea || '');
    setEditResponderType(user.responderType || 'partner_responder');
    setEditResponderCallsign(user.responderCallsign || '');
    setEditResponderApprovalStatus(user.responderApprovalStatus || 'none');
  };

  // Handle Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTargetUser) return;

    setIsSubmittingEdit(true);
    try {
      const res = await fetch(`/api/admin/users/${editTargetUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          fullName: editFullName,
          surname: editSurname,
          email: editEmail,
          cellNumber: editCellNumber,
          role: editRole,
          status: editStatus,
          userCategory: editUserCategory,
          organizationName: editOrganizationName || undefined,
          coverageArea: editCoverageArea || undefined,
          responderType: editResponderType,
          responderCallsign: editResponderCallsign || undefined,
          responderApprovalStatus: editResponderApprovalStatus
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('success', `Updated account for ${editFullName} (${editEmail})`);
        setEditTargetUser(null);
        loadUsers();
      } else {
        showNotification('error', data.error || 'Failed to update user.');
      }
    } catch (err) {
      showNotification('error', 'Network error updating user.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Open Approve Responder Modal
  const handleOpenApproveModal = (user: AdminUserAccount) => {
    setApprovingUser(user);
    setApproveArea(user.coverageArea || 'N1 Midrand to Centurion');
    setApproveOrg(user.organizationName || user.companyName || (user.userCategory === 'law_enforcement' ? 'Law Enforcement Agency' : 'Roadside Responder Unit'));
    setApproveType(user.responderType || (user.userCategory === 'law_enforcement' ? 'saps_police' : 'partner_responder'));
    const cleanPrefix = (user.organizationName || user.fullName || 'Unit').replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
    setApproveCallsign(user.responderCallsign || `${cleanPrefix}-${Math.floor(100 + Math.random() * 900)}`);
    setApprovePhone(user.cellNumber || '');
    setApproveNotes(`Approved by Admin into live responders directory.`);
  };

  // Confirm Approve Responder
  const handleConfirmApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingUser) return;
    if (!approveArea.trim()) {
      showNotification('error', 'Please specify the official operational coverage area for this responder.');
      return;
    }

    setIsSubmittingApprove(true);
    try {
      const res = await fetch(`/api/admin/responders/approve-user/${approvingUser.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          coverageArea: approveArea.trim(),
          organizationName: approveOrg.trim(),
          type: approveType,
          callsign: approveCallsign.trim(),
          phone: approvePhone.trim(),
          notes: approveNotes.trim(),
          label: `${approveOrg.trim()} • ${approveCallsign.trim()}`
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('success', `Successfully approved ${approvingUser.fullName} to Responders List with area "${approveArea.trim()}"!`);
        setApprovingUser(null);
        await loadUsers();
      } else {
        showNotification('error', data.error || 'Failed to approve responder.');
      }
    } catch (err) {
      showNotification('error', 'Network error approving responder.');
    } finally {
      setIsSubmittingApprove(false);
    }
  };

  // Confirm Reject Responder Application
  const handleConfirmReject = async () => {
    if (!rejectingUser) return;

    setIsSubmittingReject(true);
    try {
      const res = await fetch(`/api/admin/responders/reject-user/${rejectingUser.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('success', `Responder application for ${rejectingUser.fullName} rejected.`);
        setRejectingUser(null);
        await loadUsers();
      } else {
        showNotification('error', data.error || 'Failed to reject application.');
      }
    } catch (err) {
      showNotification('error', 'Network error rejecting application.');
    } finally {
      setIsSubmittingReject(false);
    }
  };

  // Handle Admin Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordResetTarget) return;

    if (resetNewPassword.length < 4) {
      showNotification('error', 'New password must be at least 4 characters long.');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      showNotification('error', 'Passwords do not match.');
      return;
    }

    setIsSubmittingReset(true);
    try {
      const res = await fetch(`/api/admin/users/${passwordResetTarget.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ newPassword: resetNewPassword })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('success', `Password updated successfully for ${passwordResetTarget.fullName}!`);
        setPasswordResetTarget(null);
        setResetNewPassword('');
        setResetConfirmPassword('');
      } else {
        showNotification('error', data.error || 'Failed to reset password.');
      }
    } catch (err) {
      showNotification('error', 'Network error resetting password.');
    } finally {
      setIsSubmittingReset(false);
    }
  };

  // Handle Delete User
  const handleConfirmDelete = async () => {
    if (!deleteTargetUser) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteTargetUser.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('success', data.message || 'User removed.');
        setDeleteTargetUser(null);
        loadUsers();
      } else {
        showNotification('error', data.error || 'Failed to delete user.');
      }
    } catch (err) {
      showNotification('error', 'Network error deleting user.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Quick Toggle Active/Suspended
  const handleToggleStatus = async (user: AdminUserAccount) => {
    const nextStatus = user.status === 'suspended' ? 'active' : 'suspended';
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        showNotification('success', `Account ${user.fullName} is now ${nextStatus}.`);
        loadUsers();
      } else {
        const err = await res.json().catch(() => ({}));
        showNotification('error', err.error || 'Failed to update status.');
      }
    } catch (err) {
      showNotification('error', 'Error toggling account status.');
    }
  };

  const getRoleBadge = (role?: UserRole, email?: string) => {
    if (email === 'charlesodendaal43@gmail.com' || role === 'super_admin') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40">
          <Shield className="w-3 h-3 mr-1 text-amber-400" />
          Chief Admin
        </span>
      );
    }
    if (role === 'admin') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
          <ShieldCheck className="w-3 h-3 mr-1 text-emerald-400" />
          Admin & Dispatch
        </span>
      );
    }
    if (role === 'moderator') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/40">
          <ShieldAlert className="w-3 h-3 mr-1 text-purple-400" />
          Moderator
        </span>
      );
    }
    if (role === 'patrol') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-400 border border-sky-500/40">
          <UserCheck className="w-3 h-3 mr-1 text-sky-400" />
          Patrol Officer
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
        Citizen / Motorist
      </span>
    );
  };

  const getCategoryBadge = (category?: UserCategory) => {
    if (category === 'law_enforcement') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
          <Shield className="w-3 h-3 mr-1 text-blue-400" />
          Law Enforcement
        </span>
      );
    }
    if (category === 'responder') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
          <Car className="w-3 h-3 mr-1 text-emerald-400" />
          Responder
        </span>
      );
    }
    if (category === 'advertiser') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
          <Sparkles className="w-3 h-3 mr-1 text-purple-400" />
          Advertiser
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
        Community Motorist
      </span>
    );
  };

  const getApprovalBadge = (user: AdminUserAccount) => {
    const status = user.responderApprovalStatus;
    if (user.userCategory !== 'responder' && user.userCategory !== 'law_enforcement' && (!status || status === 'none')) {
      return null;
    }

    if (status === 'pending') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
          <AlertCircle className="w-3 h-3 mr-1 text-amber-400" />
          Pending Approval
        </span>
      );
    }
    if (status === 'approved') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-400" />
          Approved Responder
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/40">
          <XCircle className="w-3 h-3 mr-1 text-red-400" />
          Rejected
        </span>
      );
    }
    return null;
  };

  const totalAdmins = users.filter(u => u.role === 'admin' || u.role === 'super_admin' || u.email === 'charlesodendaal43@gmail.com').length;
  const totalPatrols = users.filter(u => u.role === 'patrol' || u.responderApprovalStatus === 'approved').length;
  const totalUsers = users.length;
  const totalSuspended = users.filter(u => u.status === 'suspended').length;
  const pendingResponders = users.filter(u => u.responderApprovalStatus === 'pending');

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Metrics */}
      <div className="bg-[#0F1115] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-500 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                User & Responder Management
                <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/40 font-mono px-2 py-0.5 rounded-full font-bold">
                  {users.length} Accounts
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage community motorists, approve roadside responders & law enforcement with operational areas, and configure roles.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onOpenMyPasswordChange && (
              <button
                type="button"
                onClick={onOpenMyPasswordChange}
                className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 font-bold px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider transition border border-amber-500/30 cursor-pointer"
                title="Change your logged-in administrator password"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Change My Password</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleTriggerTestAlert}
              disabled={isTriggeringTestAlert}
              className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 font-bold px-3 py-2 rounded-xl text-xs uppercase tracking-wider transition border border-amber-500/40 cursor-pointer shadow-sm active:scale-95"
              title="Trigger a test new user registration popup to verify audio chime and display"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isTriggeringTestAlert ? 'animate-spin text-amber-300' : 'text-amber-400'}`} />
              <span>{isTriggeringTestAlert ? 'Dispatching...' : 'Test User Popup'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New User / Official</span>
            </button>

            <button
              type="button"
              onClick={loadUsers}
              disabled={isLoading}
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition cursor-pointer"
              title="Refresh users list"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Pending Approvals Standout Banner */}
        {pendingResponders.length > 0 && (
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-orange-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 sm:mt-0">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Pending Responder Approvals ({pendingResponders.length})</span>
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Motorists registered as Responders or Law Enforcement require Admin verification and coverage area assignment before appearing in the active responder directory.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setApprovalFilter('pending');
                setCategoryFilter('all');
                setRoleFilter('all');
              }}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-md shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Review Pending ({pendingResponders.length})</span>
            </button>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-[#0A0B0D] border border-slate-800/80 rounded-2xl p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Accounts</span>
            <div className="text-xl font-black text-white mt-1 font-mono">{totalUsers}</div>
          </div>
          <div 
            onClick={() => {
              if (pendingResponders.length > 0) {
                setApprovalFilter(approvalFilter === 'pending' ? 'all' : 'pending');
              }
            }}
            className={`bg-[#0A0B0D] border rounded-2xl p-3.5 transition ${
              pendingResponders.length > 0 ? 'border-amber-500/40 cursor-pointer hover:bg-amber-500/5' : 'border-slate-800/80'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
              <span>Pending Approvals</span>
              {pendingResponders.length > 0 && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
            </span>
            <div className="text-xl font-black text-amber-400 mt-1 font-mono">{pendingResponders.length}</div>
          </div>
          <div className="bg-[#0A0B0D] border border-slate-800/80 rounded-2xl p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">Verified Responders</span>
            <div className="text-xl font-black text-emerald-400 mt-1 font-mono">{totalPatrols}</div>
          </div>
          <div className="bg-[#0A0B0D] border border-slate-800/80 rounded-2xl p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block">Admin & Dispatch</span>
            <div className="text-xl font-black text-sky-400 mt-1 font-mono">{totalAdmins}</div>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {feedbackMsg && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center space-x-2.5 animate-fadeIn ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200' 
            : 'bg-red-950/80 border-red-800 text-red-200'
        }`}>
          {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="bg-[#0F1115] border border-slate-800 rounded-2xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, organization, area, callsign, email, phone..."
            className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters & View Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <div className="flex items-center space-x-1.5 bg-[#0A0B0D] border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-400">
            <Car className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">All Categories</option>
              <option value="responder" className="bg-slate-900 text-white">🛡️ Responders</option>
              <option value="law_enforcement" className="bg-slate-900 text-white">🚔 Law Enforcement</option>
              <option value="community" className="bg-slate-900 text-white">🚗 Community Motorists</option>
              <option value="advertiser" className="bg-slate-900 text-white">📢 Advertisers</option>
            </select>
          </div>

          {/* Approval Filter */}
          <div className="flex items-center space-x-1.5 bg-[#0A0B0D] border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-400">
            <Award className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={approvalFilter}
              onChange={(e) => setApprovalFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer font-bold"
            >
              <option value="all" className="bg-slate-900 text-white">All Approvals</option>
              <option value="pending" className="bg-slate-900 text-amber-300 font-bold">
                ⏳ Pending Approval ({pendingResponders.length})
              </option>
              <option value="approved" className="bg-slate-900 text-emerald-300">✅ Approved Responders</option>
              <option value="rejected" className="bg-slate-900 text-red-300">❌ Rejected</option>
            </select>
          </div>

          {/* Role Filter */}
          <div className="flex items-center space-x-1.5 bg-[#0A0B0D] border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">All Roles</option>
              <option value="admin" className="bg-slate-900 text-white">Admins & Dispatch</option>
              <option value="patrol" className="bg-slate-900 text-white">Patrol Officers</option>
              <option value="moderator" className="bg-slate-900 text-white">Moderators</option>
              <option value="user" className="bg-slate-900 text-white">Citizens / Motorists</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1.5 bg-[#0A0B0D] border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-400">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">All Statuses</option>
              <option value="active" className="bg-slate-900 text-white">Active</option>
              <option value="suspended" className="bg-slate-900 text-white">Suspended</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#0A0B0D] border border-slate-800 rounded-xl p-0.5 gap-1 ml-auto">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Table View with explicit columns"
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Cards View with prominent action bars"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Users Count & Table / Card Display */}
      <div className="space-y-4">
        {/* Results Counter & Actions Guide */}
        <div className="flex items-center justify-between px-1 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">{filteredUsers.length}</span>
            <span>user account{filteredUsers.length === 1 ? '' : 's'} displayed</span>
            {(searchQuery || roleFilter !== 'all' || categoryFilter !== 'all' || statusFilter !== 'all' || approvalFilter !== 'all') && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono">
                Filtered
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="hidden sm:inline">💡 Click</span>
            <span className="font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">Edit</span>
            <span>to modify roles & profile</span>
          </div>
        </div>

        {/* ---------------- VIEW MODE 1: TABLE VIEW ---------------- */}
        {viewMode === 'table' && (
          <div className="bg-[#0F1115] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700">
              <table className="w-full text-left border-collapse text-xs min-w-[1020px]">
                <thead>
                  <tr className="bg-[#0A0B0D] border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4 w-[250px]">User / Applicant</th>
                    <th className="py-3.5 px-3.5 w-[190px]">Category & Org</th>
                    <th className="py-3.5 px-3 w-[180px]">Operational Area</th>
                    <th className="py-3.5 px-3 w-[170px]">Status & Role</th>
                    <th className="py-3.5 px-3 w-[150px]">Contact</th>
                    <th className="py-3.5 px-4 w-[240px] text-right font-black text-amber-400">
                      Actions & Controls
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm font-medium">No users found matching your search or filters.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const isPrimaryChiefAdmin = user.email.toLowerCase() === 'charlesodendaal43@gmail.com';
                      const isSuspended = user.status === 'suspended';
                      const isPending = user.responderApprovalStatus === 'pending';

                      return (
                        <tr 
                          key={user.id} 
                          className={`hover:bg-slate-800/40 transition group ${
                            isPending 
                              ? 'bg-amber-500/[0.06] border-l-4 border-l-amber-500' 
                              : isSuspended 
                              ? 'opacity-60 bg-red-950/10' 
                              : ''
                          }`}
                        >
                          {/* Name & Avatar */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-2.5">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                                isPrimaryChiefAdmin 
                                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' 
                                  : user.role === 'admin' 
                                  ? 'bg-emerald-600 text-white' 
                                  : user.role === 'patrol' 
                                  ? 'bg-sky-600 text-white' 
                                  : isPending
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}>
                                {user.fullName.charAt(0)}{user.surname.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5 truncate">
                                  <span className="truncate">{user.fullName} {user.surname}</span>
                                  {user.email.toLowerCase() === currentAdminEmail.toLowerCase() && (
                                    <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono font-bold shrink-0">
                                      You
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5 truncate">
                                  <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                                  <span className="truncate">{user.email}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Category & Affiliation */}
                          <td className="py-3.5 px-3.5">
                            <div className="space-y-1">
                              <div>{getCategoryBadge(user.userCategory)}</div>
                              {user.organizationName ? (
                                <div className="text-[10px] text-slate-300 flex items-center gap-1 font-medium truncate max-w-[170px]">
                                  <Building2 className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                                  <span className="truncate">{user.organizationName}</span>
                                </div>
                              ) : user.companyName ? (
                                <div className="text-[10px] text-slate-400 flex items-center gap-1 truncate max-w-[170px]">
                                  <Building2 className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                                  <span className="truncate">{user.companyName}</span>
                                </div>
                              ) : null}
                              {user.responderCallsign && (
                                <div className="text-[9px] text-amber-400/90 font-mono flex items-center gap-1">
                                  <Radio className="w-2.5 h-2.5 text-amber-500/70 shrink-0" />
                                  <span>{user.responderCallsign}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Operational Area */}
                          <td className="py-3.5 px-3">
                            {user.coverageArea ? (
                              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-[10px] font-medium max-w-[170px] truncate">
                                <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                                <span className="truncate">{user.coverageArea}</span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-500 italic">Unassigned</span>
                            )}
                          </td>

                          {/* Status & Approval */}
                          <td className="py-3.5 px-3">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {getRoleBadge(user.role, user.email)}
                                <button
                                  type="button"
                                  onClick={() => !isPrimaryChiefAdmin && handleToggleStatus(user)}
                                  disabled={isPrimaryChiefAdmin}
                                  className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition ${
                                    isSuspended
                                      ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                                  } ${isPrimaryChiefAdmin ? 'cursor-default' : 'cursor-pointer'}`}
                                  title={isPrimaryChiefAdmin ? 'Chief Admin cannot be suspended' : 'Click to toggle Active / Suspended'}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full mr-1 ${isSuspended ? 'bg-red-400' : 'bg-emerald-400'}`} />
                                  {isSuspended ? 'Suspended' : 'Active'}
                                </button>
                              </div>
                              <div>{getApprovalBadge(user)}</div>
                            </div>
                          </td>

                          {/* Contact Info */}
                          <td className="py-3.5 px-3">
                            <div className="text-[11px] text-slate-300 font-mono flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                              <a 
                                href={`tel:${user.cellNumber}`} 
                                className="hover:text-amber-400 transition truncate max-w-[130px]"
                              >
                                {user.cellNumber}
                              </a>
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3 text-slate-600 shrink-0" />
                              <span>{user.registeredAt ? new Date(user.registeredAt).toLocaleDateString() : 'Active'}</span>
                            </div>
                          </td>

                          {/* Actions Column - 100% visible, wide, prominent buttons */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {/* Approval Actions for Pending Responders */}
                              {isPending && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenApproveModal(user)}
                                    className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[11px] rounded-xl flex items-center gap-1 shadow-md transition cursor-pointer shrink-0"
                                    title="Approve with operational area"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Approve</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setRejectingUser(user)}
                                    className="p-1.5 bg-red-950/90 hover:bg-red-900 text-red-300 hover:text-white rounded-xl border border-red-800 transition cursor-pointer shrink-0"
                                    title="Reject responder application"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}

                              {/* Quick Assign / Edit Operational Area */}
                              {!isPending && (user.userCategory === 'responder' || user.userCategory === 'law_enforcement' || user.role === 'patrol') && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenApproveModal(user)}
                                  className="p-1.5 bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 hover:text-white rounded-xl border border-emerald-500/40 transition cursor-pointer shrink-0 flex items-center gap-1 text-[11px] font-bold"
                                  title="Update operational area"
                                >
                                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                                </button>
                              )}

                              {/* Reset Password Key Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setPasswordResetTarget(user);
                                  setResetNewPassword('');
                                  setResetConfirmPassword('');
                                }}
                                className="p-1.5 bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 hover:text-amber-100 rounded-xl border border-amber-500/40 transition cursor-pointer shrink-0"
                                title={`Reset password for ${user.fullName}`}
                              >
                                <Key className="w-3.5 h-3.5 text-amber-400" />
                              </button>

                              {/* Prominent Edit Details Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(user)}
                                className="px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/35 text-sky-200 hover:text-white rounded-xl border border-sky-500/50 hover:border-sky-300 transition cursor-pointer flex items-center gap-1.5 text-xs font-black shadow-md shadow-sky-950/40 shrink-0"
                                title={`Edit ${user.fullName}'s profile & role`}
                              >
                                <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                                <span>Edit</span>
                              </button>

                              {/* Delete Button (Chief Admin protected) */}
                              {!isPrimaryChiefAdmin && (
                                <button
                                  type="button"
                                  onClick={() => setDeleteTargetUser(user)}
                                  className="p-1.5 bg-rose-500/15 hover:bg-rose-600/30 text-rose-300 hover:text-rose-100 rounded-xl border border-rose-500/40 hover:border-rose-400 transition cursor-pointer shrink-0"
                                  title={`Delete account for ${user.fullName}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                </button>
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
          </div>
        )}

        {/* ---------------- VIEW MODE 2: CARDS VIEW ---------------- */}
        {viewMode === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredUsers.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-[#0F1115] border border-slate-800 rounded-3xl text-slate-500">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">No users found matching your search or filters.</p>
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isPrimaryChiefAdmin = user.email.toLowerCase() === 'charlesodendaal43@gmail.com';
                const isSuspended = user.status === 'suspended';
                const isPending = user.responderApprovalStatus === 'pending';

                return (
                  <div
                    key={user.id}
                    className={`bg-[#0F1115] border rounded-3xl p-5 space-y-4 shadow-xl flex flex-col justify-between transition ${
                      isPending
                        ? 'border-amber-500/60 bg-gradient-to-b from-amber-950/20 to-[#0F1115]'
                        : isSuspended
                        ? 'border-red-500/40 opacity-75'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Top: Avatar, Name, Email, Status */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-md ${
                            isPrimaryChiefAdmin 
                              ? 'bg-amber-500 text-slate-950' 
                              : user.role === 'admin' 
                              ? 'bg-emerald-600 text-white' 
                              : user.role === 'patrol' 
                              ? 'bg-sky-600 text-white' 
                              : isPending
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            {user.fullName.charAt(0)}{user.surname.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-white text-sm flex items-center gap-1.5 truncate">
                              <span className="truncate">{user.fullName} {user.surname}</span>
                              {user.email.toLowerCase() === currentAdminEmail.toLowerCase() && (
                                <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono font-bold shrink-0">
                                  You
                                </span>
                              )}
                            </h4>
                            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 truncate mt-0.5">
                              <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className="truncate">{user.email}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status Toggle Badge */}
                        <button
                          type="button"
                          onClick={() => !isPrimaryChiefAdmin && handleToggleStatus(user)}
                          disabled={isPrimaryChiefAdmin}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition shrink-0 ${
                            isSuspended
                              ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                          } ${isPrimaryChiefAdmin ? 'cursor-default' : 'cursor-pointer'}`}
                          title={isPrimaryChiefAdmin ? 'Chief Admin cannot be suspended' : 'Click to toggle Active / Suspended'}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full mr-1 ${isSuspended ? 'bg-red-400' : 'bg-emerald-400'}`} />
                          {isSuspended ? 'Suspended' : 'Active'}
                        </button>
                      </div>

                      {/* Badges Bar */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {getRoleBadge(user.role, user.email)}
                        {getCategoryBadge(user.userCategory)}
                        {getApprovalBadge(user)}
                      </div>

                      {/* Details Box */}
                      <div className="bg-[#0A0B0D] border border-slate-800/80 rounded-2xl p-3 text-xs space-y-2">
                        {/* Operational Area */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-400 text-[11px] flex items-center gap-1 shrink-0">
                            <MapPin className="w-3 h-3 text-amber-400" />
                            <span>Area:</span>
                          </span>
                          <span className="font-semibold text-slate-200 text-[11px] truncate max-w-[180px]">
                            {user.coverageArea || <span className="text-slate-500 italic font-normal">Unassigned</span>}
                          </span>
                        </div>

                        {/* Organization / Callsign */}
                        {(user.organizationName || user.companyName || user.responderCallsign) && (
                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                            <span className="text-slate-400 text-[11px] flex items-center gap-1 shrink-0">
                              <Building2 className="w-3 h-3 text-slate-500" />
                              <span>Affiliation:</span>
                            </span>
                            <div className="text-right truncate max-w-[180px]">
                              <div className="font-semibold text-slate-200 text-[11px] truncate">
                                {user.organizationName || user.companyName}
                              </div>
                              {user.responderCallsign && (
                                <div className="text-[9px] text-amber-400 font-mono">
                                  Callsign: {user.responderCallsign}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Phone & Date */}
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                          <span className="text-slate-400 text-[11px] flex items-center gap-1 shrink-0">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>Phone:</span>
                          </span>
                          <a 
                            href={`tel:${user.cellNumber}`} 
                            className="font-mono text-[11px] text-amber-400 hover:underline"
                          >
                            {user.cellNumber}
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Prominent Action Bar at Bottom of Card */}
                    <div className="pt-2 border-t border-slate-800/80 space-y-2">
                      {/* Pending Responder Approvals */}
                      {isPending && (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenApproveModal(user)}
                            className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve Unit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setRejectingUser(user)}
                            className="w-full py-2 bg-red-950/80 hover:bg-red-900 text-red-300 hover:text-white border border-red-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}

                      {/* Main Action Buttons Grid */}
                      <div className="flex items-center gap-2">
                        {/* Big Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(user)}
                          className="flex-1 h-9 bg-sky-500/20 hover:bg-sky-500/35 text-sky-200 hover:text-white border border-sky-500/50 hover:border-sky-300 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-sky-950/40 transition cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                          <span>Edit Profile & Role</span>
                        </button>

                        {/* Assign Area (if responder) */}
                        {!isPending && (user.userCategory === 'responder' || user.userCategory === 'law_enforcement' || user.role === 'patrol') && (
                          <button
                            type="button"
                            onClick={() => handleOpenApproveModal(user)}
                            className="h-9 px-3 bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 hover:text-white border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer shrink-0"
                            title="Set Operational Area"
                          >
                            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                          </button>
                        )}

                        {/* Reset Password */}
                        <button
                          type="button"
                          onClick={() => {
                            setPasswordResetTarget(user);
                            setResetNewPassword('');
                            setResetConfirmPassword('');
                          }}
                          className="h-9 px-3 bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 hover:text-white border border-amber-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer shrink-0"
                          title="Reset Password"
                        >
                          <Key className="w-3.5 h-3.5 text-amber-400" />
                        </button>

                        {/* Delete User */}
                        {!isPrimaryChiefAdmin && (
                          <button
                            type="button"
                            onClick={() => setDeleteTargetUser(user)}
                            className="h-9 px-3 bg-rose-500/15 hover:bg-rose-600/30 text-rose-300 hover:text-white border border-rose-500/40 rounded-xl text-xs font-bold flex items-center justify-center transition cursor-pointer shrink-0"
                            title="Delete User Account"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ----------------- MODALS ----------------- */}

      {/* 0. APPROVE RESPONDER TO LIVE DIRECTORY WITH AREA MODAL */}
      {approvingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0F1115] border border-emerald-500/40 rounded-3xl w-full max-w-xl p-6 shadow-2xl relative text-slate-200 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setApprovingUser(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5">
              <div className="w-12 h-12 bg-emerald-500/20 border-2 border-emerald-500/40 rounded-2xl flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <span>Approve to Live Responders Directory</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono px-2 py-0.5 rounded-full uppercase">
                    Verification
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Assign operational coverage area, organization affiliation, and unit callsign.
                </p>
              </div>
            </div>

            {/* Applicant Summary Card */}
            <div className="bg-[#0A0B0D] border border-slate-800/80 rounded-2xl p-4 mb-4 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Applicant:</span>
                <span className="font-bold text-white text-sm">{approvingUser.fullName} {approvingUser.surname}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Email & Phone:</span>
                <span className="font-mono text-slate-300">{approvingUser.email} • {approvingUser.cellNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Requested Category:</span>
                <div>{getCategoryBadge(approvingUser.userCategory)}</div>
              </div>
            </div>

            <form onSubmit={handleConfirmApprove} className="space-y-4">
              {/* Coverage Area Assignment */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    Operational Coverage Area *
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Where unit actively patrols</span>
                </label>
                <input
                  type="text"
                  required
                  value={approveArea}
                  onChange={(e) => setApproveArea(e.target.value)}
                  placeholder="e.g. N1 Midrand to Centurion, Sandton & N3 Buccleuch..."
                  className="w-full bg-[#0A0B0D] border border-emerald-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
                {/* Fast Corridor Pills */}
                <div className="mt-2">
                  <span className="text-[10px] text-slate-400 block mb-1 font-semibold">Quick Gauteng Corridors:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_COVERAGE_AREAS.map((area) => (
                      <button
                        type="button"
                        key={area}
                        onClick={() => setApproveArea(area)}
                        className={`text-[10px] px-2 py-1 rounded-lg border transition cursor-pointer ${
                          approveArea === area
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                            : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Organization & Callsign */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Company / Organization *
                  </label>
                  <input
                    type="text"
                    required
                    value={approveOrg}
                    onChange={(e) => setApproveOrg(e.target.value)}
                    placeholder="e.g. Netcare 911, SAPS Sunnyside, Tracker SA"
                    className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Unit Callsign *
                  </label>
                  <input
                    type="text"
                    required
                    value={approveCallsign}
                    onChange={(e) => setApproveCallsign(e.target.value)}
                    placeholder="e.g. NET-911, SAPS-402, PATROL-01"
                    className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Unit Type & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Responder Classification
                  </label>
                  <select
                    value={approveType}
                    onChange={(e) => setApproveType(e.target.value as ResponderPartner['type'])}
                    className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="partner_responder">Partner Roadside Responder</option>
                    <option value="saps_police">SAPS Police</option>
                    <option value="metro_police">Metro Police (TMPD / JMPD)</option>
                    <option value="medical_ems">Medical EMS</option>
                    <option value="towing_recovery">Towing & Recovery</option>
                    <option value="cpf_patrol">CPF Community Watch</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Emergency Dispatch Phone
                  </label>
                  <input
                    type="tel"
                    value={approvePhone}
                    onChange={(e) => setApprovePhone(e.target.value)}
                    placeholder="+27 82 123 4567"
                    className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Internal Verification Notes
                </label>
                <input
                  type="text"
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  placeholder="e.g. Radio frequency confirmed, credentials verified..."
                  className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setApprovingUser(null)}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition border border-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingApprove}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-900/30 disabled:opacity-50 flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  {isSubmittingApprove ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Approve & Add to Responders List</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 0.5. REJECT RESPONDER APPLICATION CONFIRMATION MODAL */}
      {rejectingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0F1115] border border-red-800/80 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-slate-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-950/80 border border-red-700 rounded-2xl flex items-center justify-center text-red-400 shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Reject Responder Application?</h3>
                <p className="text-xs text-slate-400">User will remain an active community motorist.</p>
              </div>
            </div>

            <div className="bg-[#0A0B0D] border border-slate-800 rounded-2xl p-4 mb-5 text-xs space-y-1.5">
              <div className="font-bold text-white text-sm">{rejectingUser.fullName} {rejectingUser.surname}</div>
              <div className="text-slate-400 font-mono">{rejectingUser.email}</div>
              {rejectingUser.organizationName && (
                <div className="text-slate-300">Company: {rejectingUser.organizationName}</div>
              )}
              {rejectingUser.coverageArea && (
                <div className="text-slate-300">Requested Area: {rejectingUser.coverageArea}</div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setRejectingUser(null)}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition border border-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isSubmittingReject}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-red-600/30 disabled:opacity-50 flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                {isSubmittingReject ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                <span>Reject Application</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. ADD NEW USER / ADMIN MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0F1115] border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative text-slate-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5">
              <div className="w-11 h-11 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-500 shrink-0">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Add New User / Official</h3>
                <p className="text-xs text-slate-400">Create a new administrator, responder, patrol, or citizen account</p>
              </div>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              {/* Category selection */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  User Category *
                </label>
                <select
                  value={newUserCategory}
                  onChange={(e) => {
                    const cat = e.target.value as UserCategory;
                    setNewUserCategory(cat);
                    if (cat === 'responder' || cat === 'law_enforcement') {
                      setNewRole('patrol');
                    }
                  }}
                  className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="community">🚗 Community Motorist</option>
                  <option value="responder">🛡️ Roadside Responder</option>
                  <option value="law_enforcement">🚔 Law Enforcement (SAPS / Metro)</option>
                  <option value="advertiser">📢 Local Business / Advertiser</option>
                </select>
              </div>

              {/* Responder Extra Fields if category is responder or law enforcement */}
              {(newUserCategory === 'responder' || newUserCategory === 'law_enforcement') && (
                <div className="p-3.5 bg-slate-900/60 border border-amber-500/30 rounded-2xl space-y-3">
                  <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    Responder Verification & Area Details
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Organization / Affiliation *
                      </label>
                      <input
                        type="text"
                        required
                        value={newOrganizationName}
                        onChange={(e) => setNewOrganizationName(e.target.value)}
                        placeholder="e.g. Netcare 911, SAPS, Tracker"
                        className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Assigned Callsign
                      </label>
                      <input
                        type="text"
                        value={newResponderCallsign}
                        onChange={(e) => setNewResponderCallsign(e.target.value)}
                        placeholder="e.g. PATROL-05"
                        className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Coverage Area *
                    </label>
                    <input
                      type="text"
                      required
                      value={newCoverageArea}
                      onChange={(e) => setNewCoverageArea(e.target.value)}
                      placeholder="e.g. N1 Midrand to Centurion"
                      className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {POPULAR_COVERAGE_AREAS.slice(0, 4).map((area) => (
                        <button
                          type="button"
                          key={area}
                          onClick={() => setNewCoverageArea(area)}
                          className="text-[9px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        >
                          {area}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="e.g. John"
                    className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Surname *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSurname}
                    onChange={(e) => setNewSurname(e.target.value)}
                    placeholder="e.g. Smith"
                    className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="john.smith@domain.co.za"
                  className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Cell / WhatsApp Number *
                </label>
                <input
                  type="tel"
                  required
                  value={newCellNumber}
                  onChange={(e) => setNewCellNumber(e.target.value)}
                  placeholder="+27 82 123 4567"
                  className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    System Role *
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="admin">Admin & Dispatch Officer</option>
                    <option value="patrol">Highway Patrol / Responder</option>
                    <option value="moderator">Community Moderator</option>
                    <option value="user">Citizen / Motorist</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Initial Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as 'active' | 'suspended')}
                    className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Initial Password (min 4 chars) *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter password..."
                    className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-3 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition border border-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  {isSubmittingAdd ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. EDIT USER DETAILS MODAL */}
      {editTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0F1115] border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative text-slate-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditTargetUser(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5">
              <div className="w-11 h-11 bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center text-white shrink-0">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Edit User Account</h3>
                <p className="text-xs text-slate-400">Update account profile, category & role permissions</p>
              </div>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Category & Approval Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    User Category
                  </label>
                  <select
                    value={editUserCategory}
                    onChange={(e) => setEditUserCategory(e.target.value as UserCategory)}
                    className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="community">🚗 Community Motorist</option>
                    <option value="responder">🛡️ Roadside Responder</option>
                    <option value="law_enforcement">🚔 Law Enforcement</option>
                    <option value="advertiser">📢 Advertiser</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Approval Status
                  </label>
                  <select
                    value={editResponderApprovalStatus}
                    onChange={(e) => setEditResponderApprovalStatus(e.target.value as ResponderApprovalStatus)}
                    className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="none">None (Regular user)</option>
                    <option value="pending">⏳ Pending Approval</option>
                    <option value="approved">✅ Approved Responder</option>
                    <option value="rejected">❌ Rejected</option>
                  </select>
                </div>
              </div>

              {/* Organization & Area Details */}
              {(editUserCategory === 'responder' || editUserCategory === 'law_enforcement' || editResponderApprovalStatus === 'approved') && (
                <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Organization / Agency
                      </label>
                      <input
                        type="text"
                        value={editOrganizationName}
                        onChange={(e) => setEditOrganizationName(e.target.value)}
                        placeholder="e.g. Netcare 911, SAPS"
                        className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Callsign
                      </label>
                      <input
                        type="text"
                        value={editResponderCallsign}
                        onChange={(e) => setEditResponderCallsign(e.target.value)}
                        placeholder="e.g. PATROL-01"
                        className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Coverage Area
                    </label>
                    <input
                      type="text"
                      value={editCoverageArea}
                      onChange={(e) => setEditCoverageArea(e.target.value)}
                      placeholder="e.g. N1 Midrand to Centurion"
                      className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {POPULAR_COVERAGE_AREAS.slice(0, 4).map((area) => (
                        <button
                          type="button"
                          key={area}
                          onClick={() => setEditCoverageArea(area)}
                          className="text-[9px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        >
                          {area}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Surname
                  </label>
                  <input
                    type="text"
                    required
                    value={editSurname}
                    onChange={(e) => setEditSurname(e.target.value)}
                    className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Cell / WhatsApp Number
                </label>
                <input
                  type="tel"
                  required
                  value={editCellNumber}
                  onChange={(e) => setEditCellNumber(e.target.value)}
                  className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    System Role
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    disabled={editTargetUser.email.toLowerCase() === 'charlesodendaal43@gmail.com'}
                    className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 disabled:opacity-60"
                  >
                    <option value="super_admin">Chief Admin</option>
                    <option value="admin">Admin & Dispatch Officer</option>
                    <option value="patrol">Highway Patrol / Responder</option>
                    <option value="moderator">Community Moderator</option>
                    <option value="user">Citizen / Motorist</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Account Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as 'active' | 'suspended')}
                    disabled={editTargetUser.email.toLowerCase() === 'charlesodendaal43@gmail.com'}
                    className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 disabled:opacity-60"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setEditTargetUser(null)}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition border border-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  {isSubmittingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. ADMIN RESET PASSWORD MODAL */}
      {passwordResetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0F1115] border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-slate-200">
            <button
              onClick={() => setPasswordResetTarget(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5">
              <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-500 shrink-0">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Reset User Password</h3>
                <p className="text-xs text-slate-400">
                  Setting new password for: <span className="text-white font-bold">{passwordResetTarget.fullName} {passwordResetTarget.surname}</span> ({passwordResetTarget.email})
                </p>
              </div>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    required
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    placeholder="Enter new password (min 4 characters)..."
                    className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Confirm New Password *
                </label>
                <input
                  type={showResetPassword ? 'text' : 'password'}
                  required
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password..."
                  className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="pt-3 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setPasswordResetTarget(null)}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition border border-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReset}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  {isSubmittingReset ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. DELETE CONFIRMATION MODAL */}
      {deleteTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0F1115] border border-red-800/80 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-slate-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-950/80 border border-red-700 rounded-2xl flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Delete User Account?</h3>
                <p className="text-xs text-slate-400">This action will remove this account permanently.</p>
              </div>
            </div>

            <div className="bg-[#0A0B0D] border border-slate-800 rounded-2xl p-4 mb-5 text-xs space-y-1.5">
              <div className="font-bold text-white text-sm">{deleteTargetUser.fullName} {deleteTargetUser.surname}</div>
              <div className="text-slate-400 font-mono">{deleteTargetUser.email}</div>
              <div className="text-slate-400 font-mono">{deleteTargetUser.cellNumber}</div>
              <div className="pt-1">{getRoleBadge(deleteTargetUser.role, deleteTargetUser.email)}</div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setDeleteTargetUser(null)}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition border border-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-red-600/30 disabled:opacity-50 flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
