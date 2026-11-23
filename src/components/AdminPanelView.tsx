import React, { useState, useEffect } from 'react';
import { 
  Users, Shield, Crown, Coins, Film, Plus, Search, 
  Edit3, Trash2, CheckCircle2, AlertCircle, RefreshCw, 
  Lock, Unlock, Key, ArrowUpRight, Instagram, Sliders,
  Check, X, Sparkles, UserCheck, UserX, Clock
} from 'lucide-react';
import type { UserPublicInfo, AdminStats, SubscriptionTier, UserRole } from '../types.ts';

interface AdminPanelViewProps {
  currentUser: UserPublicInfo;
  token: string;
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({ currentUser, token }) => {
  const [users, setUsers] = useState<UserPublicInfo[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modals
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserPublicInfo | null>(null);

  // Form states for Add User
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('user');
  const [newTier, setNewTier] = useState<SubscriptionTier>('free');
  const [newCredits, setNewCredits] = useState<number>(5);
  const [newDailyLimit, setNewDailyLimit] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for Edit User
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editCredits, setEditCredits] = useState<number>(0);
  const [editTier, setEditTier] = useState<SubscriptionTier>('free');
  const [editDailyLimit, setEditDailyLimit] = useState<number>(1);
  const [editRole, setEditRole] = useState<UserRole>('user');
  const [editStatus, setEditStatus] = useState<'active' | 'blocked'>('active');
  const [editNewPassword, setEditNewPassword] = useState('');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch('/api/admin/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (usersRes.ok) {
        const uData = await usersRes.json();
        setUsers(uData.users || []);
      }
      if (statsRes.ok) {
        const sData = await statsRes.json();
        setStats(sData.stats);
      }
    } catch (err: any) {
      console.error(err);
      showToast('خطا در دریافت اطلاعات ادمین', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Quick Credit Adjustment
  const handleCreditDelta = async (userId: string, delta: number) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ credits_delta: delta })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, credits: data.user.credits } : u));
      showToast(`اعتبار کاربر به‌روزرسانی شد (${delta > 0 ? '+' + delta : delta} سکه)`);
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Toggle user active / blocked
  const handleToggleStatus = async (user: UserPublicInfo) => {
    if (user.id === currentUser.id) {
      showToast('نمی‌توانید وضعیت اکانت خود را تغییر دهید.', 'error');
      return;
    }
    const newStatus = user.status === 'active' ? 'blocked' : 'active';
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
      showToast(newStatus === 'active' ? 'کاربر فعال شد.' : 'کاربر مسدود شد.');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Quick Plan Change
  const handleQuickPlanChange = async (userId: string, tier: SubscriptionTier) => {
    const defaultLimits = { free: 1, pro: 3, vip: 10 };
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subscription_tier: tier,
          daily_video_limit: defaultLimits[tier]
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUsers(prev => prev.map(u => u.id === userId ? { 
        ...u, 
        subscription_tier: tier, 
        daily_video_limit: data.user.daily_video_limit 
      } : u));
      showToast(`طرح اشتراک کاربر به «${getTierLabel(tier)}» ارتقا یافت.`);
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Reset Today's Daily Video Count
  const handleResetDailyQuota = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ daily_videos_used: 0 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, daily_videos_used: 0 } : u));
      showToast('سهمیه مصرفی امروز کاربر صفر شد و کاربر مجدداً می‌تواند تولید کند.');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Delete User
  const handleDeleteUser = async (user: UserPublicInfo) => {
    if (user.id === currentUser.id) {
      showToast('امکان حذف حساب کاربری خودتان وجود ندارد.', 'error');
      return;
    }
    if (!confirm(`آیا از حذف کامل کاربر «${user.username}» و کلیه ایده‌ها و اطلاعات پیج او اطمینان دارید؟`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUsers(prev => prev.filter(u => u.id !== user.id));
      showToast('کاربر با موفقیت حذف گردید.');
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Submit Add User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword) {
      showToast('نام کاربری و رمز عبور الزامی است.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: newUsername.trim(),
          password: newPassword,
          display_name: newDisplayName.trim() || newUsername.trim(),
          role: newRole,
          subscription_tier: newTier,
          credits: newCredits,
          daily_video_limit: newDailyLimit,
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('کاربر جدید با موفقیت ساخته شد.');
      setIsAddUserOpen(false);
      setNewUsername('');
      setNewPassword('');
      setNewDisplayName('');
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit User Modal
  const openEditModal = (user: UserPublicInfo) => {
    setSelectedUser(user);
    setEditDisplayName(user.display_name || user.username);
    setEditCredits(user.credits);
    setEditTier(user.subscription_tier);
    setEditDailyLimit(user.daily_video_limit);
    setEditRole(user.role);
    setEditStatus(user.status);
    setEditNewPassword('');
    setIsEditUserOpen(true);
  };

  // Submit Edit User
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      const payload: any = {
        display_name: editDisplayName,
        credits: editCredits,
        subscription_tier: editTier,
        daily_video_limit: editDailyLimit,
        role: editRole,
        status: editStatus,
      };
      if (editNewPassword.trim()) {
        payload.new_password = editNewPassword.trim();
      }

      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('اطلاعات کاربر با موفقیت به‌روزرسانی شد.');
      setIsEditUserOpen(false);
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Labels & Colors
  const getTierLabel = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'vip': return 'نامحدود VIP';
      case 'pro': return 'حرفه‌ای (۳ ویدیو)';
      case 'free': return 'رایگان (۱ ویدیو)';
      default: return tier;
    }
  };

  const getTierBadge = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'vip':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">VIP نامحدود</span>;
      case 'pro':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">پرو (۳ ویدیو/روز)</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">رایگان (۱ ویدیو/روز)</span>;
    }
  };

  // Filtered users
  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q || 
      u.username.toLowerCase().includes(q) || 
      u.display_name.toLowerCase().includes(q) ||
      (u.profile?.page_name && u.profile.page_name.toLowerCase().includes(q));

    const matchPlan = planFilter === 'all' || u.subscription_tier === planFilter;
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;

    return matchSearch && matchPlan && matchStatus;
  });

  return (
    <div className="space-y-8" dir="rtl">
      
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-xs sm:text-sm font-semibold text-white">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900/40 via-slate-900 to-pink-900/40 border border-purple-500/30 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-lg shadow-purple-500/30">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                پنل مدیریت کاربران و اشتراک‌ها
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  دسترسی ادمین کل
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                مدیریت اعتبار کاربران، سهمیه روزانه ویدیوها، پلن‌های اشتراکی و داده‌های اختصاصی هر پیج
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddUserOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن کاربر جدید</span>
          </button>
          <button
            onClick={fetchAdminData}
            title="تازوه‌سازی لیست"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">کل کاربران</span>
              <Users className="w-4 h-4 text-pink-400" />
            </div>
            <div className="text-2xl font-black text-white">{stats.total_users}</div>
            <div className="text-[11px] text-slate-500 mt-1">
              {stats.active_users} فعال • {stats.blocked_users} مسدود
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">کل اعتبار در گردش</span>
              <Coins className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400">{stats.total_credits}</div>
            <div className="text-[11px] text-slate-500 mt-1">سکه قابل مصرف برای تولید</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">کل محتوای تولیدشده</span>
              <Film className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-purple-300">{stats.total_ideas}</div>
            <div className="text-[11px] text-slate-500 mt-1">ریلز، استوری و کاروسل</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">پلن رایگان (۱ ویدیو)</span>
              <Sparkles className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-blue-300">{stats.plan_counts.free}</div>
            <div className="text-[11px] text-slate-500 mt-1">کاربران سهمیه روزانه</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">پلن پرو و VIP</span>
              <Crown className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-300">
              {stats.plan_counts.pro + stats.plan_counts.vip}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {stats.plan_counts.pro} Pro • {stats.plan_counts.vip} VIP
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="جستجوی کاربر با نام کاربری، نام پیج یا نام نمایشی..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <select
            value={planFilter}
            onChange={e => setPlanFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-pink-500"
          >
            <option value="all">همه پلن‌ها</option>
            <option value="free">رایگان (۱ ویدیو)</option>
            <option value="pro">حرفه‌ای Pro</option>
            <option value="vip">نامحدود VIP</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-pink-500"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="active">فقط فعال</option>
            <option value="blocked">مسدود شده</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between px-2 text-xs text-slate-400 font-semibold">
          <span>لیست کاربران سیستم ({filteredUsers.length} کاربر)</span>
          <span>مدیریت سهمیه، پلن و اعتبار</span>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            کاربری با این فیلتر یا نام کاربری یافت نشد.
          </div>
        ) : (
          filteredUsers.map(user => {
            const isSelf = user.id === currentUser.id;
            return (
              <div 
                key={user.id}
                className={`bg-slate-900/90 border rounded-2xl p-4 sm:p-5 transition-all ${
                  user.status === 'blocked' 
                    ? 'border-rose-900/40 bg-rose-950/10 opacity-75' 
                    : isSelf 
                    ? 'border-purple-500/40 shadow-lg shadow-purple-500/10' 
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  
                  {/* User Profile Info */}
                  <div className="flex items-start gap-3.5 min-w-[240px]">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600 p-[2px] shrink-0">
                      <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-bold text-white text-base">
                        {user.username.slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm sm:text-base">
                          {user.display_name}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          @{user.username}
                        </span>
                        {user.role === 'admin' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            👑 مدیر
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                            کاربر
                          </span>
                        )}
                        {isSelf && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            اکانت شما
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-400">
                        {user.profile?.page_name && (
                          <span className="flex items-center gap-1 text-slate-300 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 text-[11px]">
                            <Instagram className="w-3 h-3 text-pink-400" />
                            <span>{user.profile.page_name}</span>
                          </span>
                        )}
                        <span className="text-[11px]">
                          تولیدات: <strong className="text-slate-200">{user.idea_count || 0}</strong> ایده
                        </span>
                        <span className="text-[11px] text-slate-500">
                          عضویت: {new Date(user.created_at).toLocaleDateString('fa-IR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Plan & Quota Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto text-xs">
                    
                    {/* Subscription Plan & Quick Switcher */}
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between">
                      <span className="text-[11px] text-slate-400 mb-1">پلن اشتراک:</span>
                      <div className="mb-1.5">{getTierBadge(user.subscription_tier)}</div>
                      <div className="flex gap-1 text-[10px]">
                        <button
                          onClick={() => handleQuickPlanChange(user.id, 'free')}
                          className={`px-1.5 py-0.5 rounded ${user.subscription_tier === 'free' ? 'bg-pink-500 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                        >
                          رایگان
                        </button>
                        <button
                          onClick={() => handleQuickPlanChange(user.id, 'pro')}
                          className={`px-1.5 py-0.5 rounded ${user.subscription_tier === 'pro' ? 'bg-purple-500 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                        >
                          پرو
                        </button>
                        <button
                          onClick={() => handleQuickPlanChange(user.id, 'vip')}
                          className={`px-1.5 py-0.5 rounded ${user.subscription_tier === 'vip' ? 'bg-amber-500 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                        >
                          VIP
                        </button>
                      </div>
                    </div>

                    {/* Daily Quota Tracking */}
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between">
                      <span className="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
                        <span>سهمیه امروز:</span>
                        <button 
                          onClick={() => handleResetDailyQuota(user.id)}
                          title="صفر کردن مصرف امروز"
                          className="text-[10px] text-pink-400 hover:underline"
                        >
                          ریست
                        </button>
                      </span>
                      <div className="text-sm font-bold text-white flex items-center gap-1">
                        <span className={user.daily_videos_used >= user.daily_video_limit ? 'text-amber-400' : 'text-emerald-400'}>
                          {user.daily_videos_used}
                        </span>
                        <span className="text-slate-500">/</span>
                        <span>{user.daily_video_limit} ویدیو</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            user.daily_videos_used >= user.daily_video_limit ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, (user.daily_videos_used / (user.daily_video_limit || 1)) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Credits Balance & Quick Delta Buttons */}
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 col-span-2 sm:col-span-1 flex flex-col justify-between">
                      <span className="text-[11px] text-slate-400 mb-1">موجودی اعتبار (سکه):</span>
                      <div className="text-base font-black text-amber-400 flex items-center gap-1.5">
                        <Coins className="w-4 h-4" />
                        <span>{user.credits} سکه</span>
                      </div>
                      <div className="flex gap-1 mt-1 text-[10px]">
                        <button
                          onClick={() => handleCreditDelta(user.id, 5)}
                          className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30"
                        >
                          +۵ سکه
                        </button>
                        <button
                          onClick={() => handleCreditDelta(user.id, 10)}
                          className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/30"
                        >
                          +۱۰
                        </button>
                        <button
                          onClick={() => handleCreditDelta(user.id, -1)}
                          disabled={user.credits <= 0}
                          className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                        >
                          -۱
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                    <button
                      onClick={() => handleToggleStatus(user)}
                      disabled={isSelf}
                      title={user.status === 'active' ? 'مسدود کردن کاربر' : 'فعال‌سازی کاربر'}
                      className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                        user.status === 'active'
                          ? 'bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      } ${isSelf ? 'opacity-30 cursor-not-allowed' : ''}`}
                    >
                      {user.status === 'active' ? <UserCheck className="w-4 h-4 text-emerald-400" /> : <UserX className="w-4 h-4 text-rose-400" />}
                    </button>

                    <button
                      onClick={() => openEditModal(user)}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-pink-400" />
                      <span>مدیریت کامل</span>
                    </button>

                    <button
                      onClick={() => handleDeleteUser(user)}
                      disabled={isSelf}
                      title="حذف کاربر"
                      className={`p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors ${
                        isSelf ? 'opacity-30 cursor-not-allowed' : ''
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add User Modal */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddUserOpen(false)}
              className="absolute left-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Plus className="w-5 h-5 text-pink-400" />
              <h3 className="text-base font-bold text-white">افزودن کاربر جدید به سیستم</h3>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">نام کاربری (Username)</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  placeholder="مثال: company_page"
                  dir="ltr"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">رمز عبور اولیه</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="حداقل ۴ کاراکتر"
                  dir="ltr"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">نام نمایشی یا نام پیج (اختیاری)</label>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={e => setNewDisplayName(e.target.value)}
                  placeholder="مثال: پیج فروشگاهی نگین"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">نقش کاربری</label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as UserRole)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-pink-500"
                  >
                    <option value="user">کاربر عادی</option>
                    <option value="admin">مدیر سیستم (Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">طرح اشتراک</label>
                  <select
                    value={newTier}
                    onChange={e => {
                      const t = e.target.value as SubscriptionTier;
                      setNewTier(t);
                      if (t === 'free') setNewDailyLimit(1);
                      if (t === 'pro') setNewDailyLimit(3);
                      if (t === 'vip') setNewDailyLimit(10);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-pink-500"
                  >
                    <option value="free">رایگان (۱ ویدیو در روز)</option>
                    <option value="pro">حرفه‌ای Pro (۳ ویدیو)</option>
                    <option value="vip">نامحدود VIP</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">سهمیه روزانه ویدیو</label>
                  <input
                    type="number"
                    min="1"
                    value={newDailyLimit}
                    onChange={e => setNewDailyLimit(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">اعتبار هدیه (سکه)</label>
                  <input
                    type="number"
                    min="0"
                    value={newCredits}
                    onChange={e => setNewCredits(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl font-bold bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'در حال ثبت...' : 'ایجاد کاربر'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditUserOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsEditUserOpen(false)}
              className="absolute left-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Sliders className="w-5 h-5 text-pink-400" />
              <h3 className="text-base font-bold text-white">
                مدیریت کاربر: @{selectedUser.username}
              </h3>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">نام نمایشی</label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={e => setEditDisplayName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">طرح اشتراک</label>
                  <select
                    value={editTier}
                    onChange={e => {
                      const t = e.target.value as SubscriptionTier;
                      setEditTier(t);
                      if (t === 'free') setEditDailyLimit(1);
                      if (t === 'pro') setEditDailyLimit(3);
                      if (t === 'vip') setEditDailyLimit(10);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-pink-500"
                  >
                    <option value="free">رایگان (۱ ویدیو)</option>
                    <option value="pro">حرفه‌ای Pro (۳ ویدیو)</option>
                    <option value="vip">نامحدود VIP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">سهمیه روزانه ویدیو</label>
                  <input
                    type="number"
                    min="1"
                    value={editDailyLimit}
                    onChange={e => setEditDailyLimit(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">موجودی اعتبار (سکه)</label>
                  <input
                    type="number"
                    min="0"
                    value={editCredits}
                    onChange={e => setEditCredits(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">وضعیت حساب</label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-pink-500"
                  >
                    <option value="active">فعال</option>
                    <option value="blocked">مسدود شده</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">تغییر رمز عبور (در صورت نیاز)</label>
                <input
                  type="password"
                  value={editNewPassword}
                  onChange={e => setEditNewPassword(e.target.value)}
                  placeholder="در صورت عدم تغییر خالی بگذارید"
                  dir="ltr"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl font-bold bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditUserOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
