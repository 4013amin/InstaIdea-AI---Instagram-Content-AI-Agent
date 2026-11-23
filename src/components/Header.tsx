import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Clock, Calendar, Play, RefreshCw, Power, 
  Crown, Coins, Film, LogOut, User as UserIcon, Shield,
  ChevronDown, UserPlus, Key, LogIn, Download,
  Sun, Moon, Palette, Check
} from 'lucide-react';
import type { InstagramProfile, UserPublicInfo } from '../types.ts';

interface HeaderProps {
  profile: InstagramProfile | null;
  currentUser: UserPublicInfo | null;
  activeTab: 'dashboard' | 'history' | 'calendar' | 'settings' | 'docs' | 'admin';
  setActiveTab: (tab: 'dashboard' | 'history' | 'calendar' | 'settings' | 'docs' | 'admin') => void;
  onGenerateNew: () => void;
  isGenerating: boolean;
  onToggleScheduler: () => void;
  onLogout: () => void;
  onOpenAuthModal?: (mode?: 'login' | 'register') => void;
  theme?: 'dark' | 'light' | 'sunset';
  onThemeChange?: (theme: 'dark' | 'light' | 'sunset') => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  currentUser,
  activeTab,
  setActiveTab,
  onGenerateNew,
  isGenerating,
  onToggleScheduler,
  onLogout,
  onOpenAuthModal,
  theme = 'dark',
  onThemeChange,
}) => {
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const themeMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-2">
          
          {/* Brand & Page Info */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600 p-[1.5px] shadow-md shadow-pink-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-pink-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold text-white tracking-tight">
                  InstaIdea AI
                </span>
                {isAdmin ? (
                  <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-400" />
                    <span>مدیر</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-400">
                    {profile?.instagram_handle || `@${currentUser?.username || 'user'}`}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[140px] sm:max-w-xs">
                {profile?.page_name || 'دستیار هوشمند سناریو و تقویم اینستاگرام'}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-900/80 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-slate-800 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              داشبورد امروز
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'calendar'
                  ? 'bg-slate-800 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-pink-400" />
              <span>تقویم و پوستر</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-slate-800 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              آرشیو ایده‌ها
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'settings'
                  ? 'bg-slate-800 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              تنظیمات پیج
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'docs'
                  ? 'bg-slate-800 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              مستندات و n8n
            </button>

            {/* Admin Panel Tab (Only for Admin) */}
            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'admin'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-amber-400 hover:bg-amber-500/10'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>پنل ادمین</span>
              </button>
            )}
          </nav>

          {/* Quick Actions & Account */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Unified Credits & Quota Pill */}
            {currentUser && (
              <div 
                title={isAdmin ? 'دسترسی نامحدود ادمین' : `موجودی: ${currentUser.credits} سکه | مصرف امروز: ${currentUser.daily_videos_used} از ${currentUser.daily_video_limit}`}
                className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300"
              >
                <div className="flex items-center gap-1 text-amber-300 font-semibold tabular-nums">
                  <Coins className="w-3 h-3 text-amber-400" />
                  <span>{currentUser.credits}</span>
                </div>
                <span className="text-slate-600">·</span>
                <div className="flex items-center gap-1 text-slate-300 font-medium">
                  <Film className="w-3 h-3 text-pink-400" />
                  <span className="tabular-nums">
                    {isAdmin ? 'نامحدود' : `${currentUser.daily_videos_used}/${currentUser.daily_video_limit}`}
                  </span>
                </div>
              </div>
            )}

            {/* Primary Generate Button */}
            <button
              onClick={onGenerateNew}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-md shadow-pink-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>تولید...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>تولید سناریو</span>
                </>
              )}
            </button>

            {/* Theme Switcher Popover */}
            <div className="relative" ref={themeMenuRef}>
              <button
                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs transition-all cursor-pointer"
                title="تغییر تم و ظاهر استودیو"
                aria-label="تغییر تم"
              >
                {theme === 'light' ? (
                  <Sun className="w-4 h-4 text-amber-500" />
                ) : theme === 'sunset' ? (
                  <Palette className="w-4 h-4 text-purple-400" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-400" />
                )}
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isThemeMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isThemeMenuOpen && (
                <div className="absolute left-0 mt-2 w-52 rounded-2xl bg-slate-900/98 border border-slate-800 shadow-2xl backdrop-blur-xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  <div className="text-[11px] font-bold text-slate-400 px-2 py-1 border-b border-slate-800">
                    انتخاب تم استودیو
                  </div>

                  <button
                    onClick={() => {
                      onThemeChange?.('dark');
                      setIsThemeMenuOpen(false);
                    }}
                    className={`w-full px-2.5 py-2 rounded-xl flex items-center justify-between text-xs transition-colors cursor-pointer text-right ${
                      theme === 'dark' ? 'bg-indigo-500/15 text-indigo-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-slate-950 border border-slate-700 flex items-center justify-center">
                        <Moon className="w-3 h-3 text-indigo-400" />
                      </div>
                      <span>🌙 تیره حرفه‌ای (Dark)</span>
                    </div>
                    {theme === 'dark' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </button>

                  <button
                    onClick={() => {
                      onThemeChange?.('light');
                      setIsThemeMenuOpen(false);
                    }}
                    className={`w-full px-2.5 py-2 rounded-xl flex items-center justify-between text-xs transition-colors cursor-pointer text-right ${
                      theme === 'light' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-center">
                        <Sun className="w-3 h-3 text-amber-500" />
                      </div>
                      <span>☀️ روشن مدرن (Light)</span>
                    </div>
                    {theme === 'light' && <Check className="w-3.5 h-3.5 text-amber-500" />}
                  </button>

                  <button
                    onClick={() => {
                      onThemeChange?.('sunset');
                      setIsThemeMenuOpen(false);
                    }}
                    className={`w-full px-2.5 py-2 rounded-xl flex items-center justify-between text-xs transition-colors cursor-pointer text-right ${
                      theme === 'sunset' ? 'bg-purple-500/15 text-purple-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-purple-950 border border-purple-700 flex items-center justify-center">
                        <Palette className="w-3 h-3 text-purple-400" />
                      </div>
                      <span>🔮 غروب مخملی (Sunset)</span>
                    </div>
                    {theme === 'sunset' && <Check className="w-3.5 h-3.5 text-purple-400" />}
                  </button>
                </div>
              )}
            </div>

            {/* User Account Button & Dropdown */}
            <div className="relative" ref={accountMenuRef}>
              {currentUser ? (
                <button
                  onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-white transition-all cursor-pointer"
                  title="مدیریت حساب کاربری"
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                    {currentUser.display_name ? currentUser.display_name.slice(0, 1) : 'U'}
                  </div>
                  <span className="hidden md:inline font-medium text-xs max-w-[90px] truncate">{currentUser.display_name}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isAccountMenuOpen ? 'rotate-180' : ''}`} />
                </button>
              ) : (
                <button
                  onClick={() => onOpenAuthModal?.('login')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-medium text-xs cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-pink-400" />
                  <span>ورود</span>
                </button>
              )}

              {/* Account Dropdown Menu */}
              {isAccountMenuOpen && currentUser && (
                <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-slate-900/98 border border-slate-800 shadow-2xl backdrop-blur-xl p-3 z-50 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">{currentUser.display_name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isAdmin ? 'bg-amber-500/20 text-amber-300' : 'bg-pink-500/20 text-pink-300'}`}>
                        {isAdmin ? 'مدیر سیستم' : 'کاربر'}
                      </span>
                    </div>
                    <div className="text-[11px] text-pink-400 font-mono dir-ltr text-right">@{currentUser.username}</div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-800">
                      <span>موجودی اعتبار:</span>
                      <span className="font-bold text-amber-300 tabular-nums">{currentUser.credits} سکه</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>سهمیه تولید امروز:</span>
                      <span className="font-bold text-slate-200 tabular-nums">
                        {isAdmin ? 'نامحدود' : `${currentUser.daily_videos_used} از ${currentUser.daily_video_limit}`}
                      </span>
                    </div>
                  </div>

                  {/* Theme Switcher within Account Menu */}
                  <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1.5">
                    <span className="text-[10px] font-semibold text-slate-400 block">پوسته بصری:</span>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        type="button"
                        onClick={() => onThemeChange?.('dark')}
                        className={`p-1.5 rounded-lg flex flex-col items-center gap-1 text-[10px] transition-all cursor-pointer ${
                          theme === 'dark' ? 'bg-indigo-600/30 text-white font-bold border border-indigo-500/50' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <Moon className="w-3.5 h-3.5" />
                        <span>تیره</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onThemeChange?.('light')}
                        className={`p-1.5 rounded-lg flex flex-col items-center gap-1 text-[10px] transition-all cursor-pointer ${
                          theme === 'light' ? 'bg-amber-500/30 text-amber-400 font-bold border border-amber-500/50' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <Sun className="w-3.5 h-3.5" />
                        <span>روشن</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onThemeChange?.('sunset')}
                        className={`p-1.5 rounded-lg flex flex-col items-center gap-1 text-[10px] transition-all cursor-pointer ${
                          theme === 'sunset' ? 'bg-purple-600/30 text-purple-300 font-bold border border-purple-500/50' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <Palette className="w-3.5 h-3.5" />
                        <span>غروب</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1 text-xs">
                    {/* Download Project Source Code Option */}
                    <a
                      href="/api/project/download-source"
                      download="instagram-ai-studio-full-source.zip"
                      className="w-full px-3 py-2 rounded-xl text-sky-300 hover:text-white hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer text-right"
                    >
                      <Download className="w-3.5 h-3.5 text-sky-400" />
                      <span>دانلود سورس‌کد کامل پروژه (.ZIP)</span>
                    </a>

                    <button
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        onOpenAuthModal?.('login');
                      }}
                      className="w-full px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer text-right"
                    >
                      <Key className="w-3.5 h-3.5 text-pink-400" />
                      <span>تغییر حساب / ورود با کاربری دیگر</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        onOpenAuthModal?.('register');
                      }}
                      className="w-full px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer text-right"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>ثبت‌نام یک حساب کاربری جدید</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors cursor-pointer text-right pt-2 border-t border-slate-800"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>خروج از حساب</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex lg:hidden items-center justify-around py-2.5 border-t border-slate-800/80 text-[11px] overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-1 px-2 rounded-lg font-medium whitespace-nowrap ${activeTab === 'dashboard' ? 'text-pink-400 font-bold bg-pink-500/10' : 'text-slate-400'}`}
          >
            داشبورد
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-1 px-2 rounded-lg font-medium whitespace-nowrap ${activeTab === 'history' ? 'text-pink-400 font-bold bg-pink-500/10' : 'text-slate-400'}`}
          >
            آرشیو
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`py-1 px-2 rounded-lg font-medium whitespace-nowrap ${activeTab === 'calendar' ? 'text-pink-400 font-bold bg-pink-500/10' : 'text-slate-400'}`}
          >
            تقویم و پوستر
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-1 px-2 rounded-lg font-medium whitespace-nowrap ${activeTab === 'settings' ? 'text-pink-400 font-bold bg-pink-500/10' : 'text-slate-400'}`}
          >
            تنظیمات پیج
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`py-1 px-2.5 rounded-lg font-bold whitespace-nowrap flex items-center gap-1 ${activeTab === 'admin' ? 'text-amber-300 font-bold bg-amber-500/20' : 'text-amber-400'}`}
            >
              <Crown className="w-3 h-3" />
              <span>پنل ادمین</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('docs')}
            className={`py-1 px-2 rounded-lg font-medium whitespace-nowrap ${activeTab === 'docs' ? 'text-pink-400 font-bold bg-pink-500/10' : 'text-slate-400'}`}
          >
            راهنما
          </button>
        </div>

      </div>
    </header>
  );
};
