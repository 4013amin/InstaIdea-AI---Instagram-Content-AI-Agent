/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { HistoryView } from './components/HistoryView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { DocumentationView } from './components/DocumentationView.tsx';
import { AdminPanelView } from './components/AdminPanelView.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { ContentCalendarView } from './components/ContentCalendarView.tsx';
import type { InstagramProfile, ContentIdea, IdeaStatus, UserPublicInfo } from './types.ts';
import { CheckCircle2, AlertCircle, RefreshCw, X } from 'lucide-react';

const TOKEN_STORAGE_KEY = 'instaideas_token';
const THEME_STORAGE_KEY = 'instaideas_theme';
export type AppTheme = 'dark' | 'light' | 'sunset';

export default function App() {
  const [token, setToken] = useState<string>(() => localStorage.getItem(TOKEN_STORAGE_KEY) || '');
  const [theme, setTheme] = useState<AppTheme>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'sunset' || saved === 'dark') return saved;
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);
  const [currentUser, setCurrentUser] = useState<UserPublicInfo | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const handleOpenAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'calendar' | 'settings' | 'docs' | 'admin'>('dashboard');
  const [profile, setProfile] = useState<InstagramProfile | null>(null);
  const [todayIdea, setTodayIdea] = useState<ContentIdea | null>(null);
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [stats, setStats] = useState({
    total_ideas: 0,
    published_ideas: 0,
    in_progress_ideas: 0,
    new_ideas: 0,
    scheduler_active: true,
    scheduled_time: '11:00',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper for authenticated requests
  const authFetch = async (url: string, options: RequestInit = {}) => {
    const activeToken = token || localStorage.getItem(TOKEN_STORAGE_KEY) || '';
    const headers = {
      ...(options.headers || {}),
      'Authorization': `Bearer ${activeToken}`,
    };
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      // Session expired or invalid
      handleLogout();
      throw new Error('نشست شما منقضی شده است. لطفاً دوباره وارد شوید.');
    }
    return res;
  };

  // Verify authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!storedToken) {
        setIsAuthLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${storedToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
          setToken(storedToken);
          // Load app data for this user
          await fetchData(storedToken);
        } else {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          setToken('');
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Auth verification failed:', err);
      } finally {
        setIsAuthLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Fetch user-specific profile, stats, and ideas
  const fetchData = async (authToken: string = token) => {
    setIsLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${authToken}` };

      // 1. Profile & Stats
      const profRes = await fetch('/api/profile', { headers });
      if (profRes.ok) {
        const profData = await profRes.json();
        setProfile(profData.profile);
        if (profData.user) {
          setCurrentUser(profData.user);
        }
        if (profData.stats) {
          setStats(profData.stats);
        }
      }

      // 2. Ideas list
      const ideasRes = await fetch('/api/ideas', { headers });
      if (ideasRes.ok) {
        const ideasData = await ideasRes.json();
        setIdeas(ideasData.ideas || []);
      }

      // 3. Today's idea
      const todayRes = await fetch('/api/ideas/today', { headers });
      if (todayRes.ok) {
        const todayData = await todayRes.json();
        setTodayIdea(todayData.idea);
      }
    } catch (err) {
      console.error('Failed to load user data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle successful login
  const handleLoginSuccess = async (user: UserPublicInfo, receivedToken: string) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, receivedToken);
    setToken(receivedToken);
    setCurrentUser(user);
    if (user.profile) {
      setProfile(user.profile);
    }
    setActiveTab('dashboard');
    showToast(`خوش آمدید، ${user.display_name}!`, 'success');
    await fetchData(receivedToken);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setToken('');
      setCurrentUser(null);
      setProfile(null);
      setIdeas([]);
      setTodayIdea(null);
      setActiveTab('dashboard');
      showToast('با موفقیت از حساب کاربری خارج شدید.');
    }
  };

  // Generate new idea now
  const handleGenerateNew = async () => {
    setIsGenerating(true);
    showToast('ایجنت در حال تحلیل پیج اختصاصی شما و طراحی ایده جدید است...', 'success');
    try {
      const res = await authFetch('/api/ideas/generate', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'خطا در تولید ایده');
      }

      setTodayIdea(data.idea);
      setIdeas(prev => [data.idea, ...prev]);
      if (data.user) {
        setCurrentUser(data.user);
      }
      setStats(prev => ({ ...prev, total_ideas: prev.total_ideas + 1, new_ideas: prev.new_ideas + 1 }));
      showToast(`✨ ایده جدید آماده شد: «${data.idea.title}»`, 'success');
      setActiveTab('dashboard');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'خطا در ارتباط با مدل هوش مصنوعی', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Run Full Daily Autopilot Now (Generate Idea + Render Media + Auto-Publish)
  const handleSimulateRun = async () => {
    setIsGenerating(true);
    showToast('در حال اجرای اتوپایلوت کامل: تولید محتوا + رندر رسانه + آماده‌سازی انتشار...', 'success');
    try {
      const res = await authFetch('/api/scheduler/simulate-run', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'خطا در اجرای اتوپایلوت');
      }
      if (data.idea) {
        setTodayIdea(data.idea);
        setIdeas(prev => [data.idea, ...prev]);
        showToast(data.message || 'چرخه اتوپایلوت کامل با موفقیت اجرا شد.', 'success');
        fetchData();
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate idea specifically tailored for a calendar day
  const handleGenerateForDay = async (dayOfWeek: string) => {
    setIsGenerating(true);
    showToast(`در حال تولید ایده هوشمند بر اساس برنامه روز ${dayOfWeek}...`, 'success');
    try {
      const res = await authFetch('/api/ideas/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day_of_week: dayOfWeek })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'خطا در تولید ایده');
      }
      setTodayIdea(data.idea);
      setIdeas(prev => [data.idea, ...prev]);
      if (data.user) {
        setCurrentUser(data.user);
      }
      showToast(`ایده روز ${dayOfWeek} با عنوان «${data.idea.title}» ساخته شد!`);
      setActiveTab('dashboard');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      showToast(err.message || 'خطا در تولید ایده', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle scheduler active
  const handleToggleScheduler = async () => {
    try {
      const res = await authFetch('/api/scheduler/toggle', { method: 'POST' });
      const data = await res.json();
      if (profile) {
        setProfile({ ...profile, is_scheduler_active: data.is_active });
      }
      setStats(prev => ({ ...prev, scheduler_active: data.is_active }));
      showToast(data.is_active ? 'زمان‌بندی ارسال روزانه فعال شد.' : 'زمان‌بندی روزانه غیرفعال شد.');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Update idea status
  const handleUpdateStatus = async (id: string, status: IdeaStatus) => {
    try {
      const res = await authFetch(`/api/ideas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setIdeas(prev => prev.map(i => i.id === id ? { ...i, status } : i));
        if (todayIdea && todayIdea.id === id) {
          setTodayIdea({ ...todayIdea, status });
        }
        showToast('وضعیت ایده به‌روزرسانی شد.');
        fetchData();
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Delete idea
  const handleDeleteIdea = async (id: string) => {
    if (!confirm('آیا از حذف این ایده مطمئن هستید؟')) return;
    try {
      const res = await authFetch(`/api/ideas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setIdeas(prev => prev.filter(i => i.id !== id));
        if (todayIdea && todayIdea.id === id) {
          const remaining = ideas.filter(i => i.id !== id);
          setTodayIdea(remaining.length > 0 ? remaining[0] : null);
        }
        showToast('ایده با موفقیت حذف شد.');
        fetchData();
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Save profile updates (Permanently saved to user account!)
  const handleSaveProfile = async (updated: Partial<InstagramProfile>) => {
    const res = await authFetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    if (!res.ok) {
      throw new Error('خطا در ذخیره اطلاعات پیج');
    }
    const data = await res.json();
    setProfile(data.profile);
    if (currentUser) {
      setCurrentUser({ ...currentUser, profile: data.profile });
    }
    setStats(prev => ({
      ...prev,
      scheduler_active: data.profile.is_scheduler_active,
      scheduled_time: data.profile.schedule_time,
    }));
    showToast('تنظیمات اختصاصی پیج شما با موفقیت ذخیره شد.');
  };

  const handleIdeaUpdated = (updated: ContentIdea) => {
    setIdeas(prev => prev.map(i => i.id === updated.id ? updated : i));
    if (todayIdea && todayIdea.id === updated.id) {
      setTodayIdea(updated);
    }
    showToast('وضعیت پست و پوستر اینستاگرام به‌روزرسانی شد.', 'success');
    fetchData();
  };

  // Loading indicator for initial auth check
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white" dir="rtl">
        <RefreshCw className="w-8 h-8 text-pink-500 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-300">در حال بررسی احراز هویت کاربر...</p>
      </div>
    );
  }

  // If user is not logged in, show Auth Screen
  if (!currentUser) {
    return <AuthModal onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-pink-500 selection:text-white" dir="rtl">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md bg-slate-900/95 border border-slate-700 text-xs sm:text-sm font-semibold">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white mr-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Header */}
      <Header
        profile={profile}
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onGenerateNew={handleGenerateNew}
        isGenerating={isGenerating}
        onToggleScheduler={handleToggleScheduler}
        onLogout={handleLogout}
        onOpenAuthModal={handleOpenAuthModal}
        theme={theme}
        onThemeChange={setTheme}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            currentUser={currentUser}
            profile={profile}
            todayIdea={todayIdea}
            recentIdeas={ideas}
            stats={stats}
            onGenerateNew={handleGenerateNew}
            isGenerating={isGenerating}
            onUpdateStatus={handleUpdateStatus}
            onSimulateRun={handleSimulateRun}
            onToggleScheduler={handleToggleScheduler}
            onSelectIdea={(idea) => {
              setTodayIdea(idea);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToSettings={() => setActiveTab('settings')}
            onNavigateToHistory={() => setActiveTab('history')}
            onNavigateToAdmin={() => setActiveTab('admin')}
            onNavigateToCalendar={() => setActiveTab('calendar')}
            onIdeaUpdated={handleIdeaUpdated}
            onOpenAuthModal={handleOpenAuthModal}
            onLoginSuccess={handleLoginSuccess}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            ideas={ideas}
            profile={profile}
            currentUser={currentUser}
            onUpdateStatus={handleUpdateStatus}
            onDeleteIdea={handleDeleteIdea}
            onIdeaUpdated={handleIdeaUpdated}
            onOpenAuthModal={handleOpenAuthModal}
            onLoginSuccess={handleLoginSuccess}
          />
        )}

        {activeTab === 'calendar' && (
          <ContentCalendarView
            profile={profile}
            onUpdateProfile={handleSaveProfile}
            onGenerateForDay={handleGenerateForDay}
            isGenerating={isGenerating}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            currentUser={currentUser}
            profile={profile}
            onSaveProfile={handleSaveProfile}
            theme={theme}
            onThemeChange={setTheme}
          />
        )}

        {activeTab === 'docs' && (
          <DocumentationView />
        )}

        {activeTab === 'admin' && currentUser?.role === 'admin' && (
          <AdminPanelView
            currentUser={currentUser}
            token={token}
          />
        )}
      </main>

      {/* Interactive Auth Modal for Switching Account or Re-authenticating */}
      {isAuthModalOpen && (
        <AuthModal
          onLoginSuccess={(user, tok) => {
            handleLoginSuccess(user, tok);
            setIsAuthModalOpen(false);
          }}
          onClose={() => setIsAuthModalOpen(false)}
          initialMode={authModalMode}
        />
      )}

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pink-500"></span>
            <span>InstaIdea AI Agent • کاربر جاری: {currentUser.display_name} (@{currentUser.username})</span>
          </div>
          <div className="text-[11px] text-slate-400">
            تولید روزانه محتوای اختصاصی اینستاگرام • اشتراک اختصاصی و ذخیره ابری تنظیمات
          </div>
        </div>
      </footer>

    </div>
  );
}
