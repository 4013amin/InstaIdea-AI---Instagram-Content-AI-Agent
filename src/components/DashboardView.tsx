import React from 'react';
import { 
  Sparkles, Calendar, Clock, CheckCircle2, TrendingUp, 
  Film, Layers, Tv, Radio, ArrowLeft, Sliders, ExternalLink,
  Zap, Bell, AlertCircle, Download, Palette
} from 'lucide-react';
import type { InstagramProfile, ContentIdea, IdeaStatus, UserPublicInfo } from '../types.ts';
import { TodayIdeaCard } from './TodayIdeaCard.tsx';
import { Crown, Coins } from 'lucide-react';

interface DashboardViewProps {
  currentUser?: UserPublicInfo | null;
  profile: InstagramProfile | null;
  todayIdea: ContentIdea | null;
  recentIdeas: ContentIdea[];
  stats: {
    total_ideas: number;
    published_ideas: number;
    in_progress_ideas: number;
    new_ideas: number;
    scheduler_active: boolean;
    scheduled_time: string;
  };
  onGenerateNew: () => void;
  isGenerating: boolean;
  onUpdateStatus: (id: string, status: IdeaStatus) => void;
  onSimulateRun: () => void;
  onToggleScheduler: () => void;
  onSelectIdea: (idea: ContentIdea) => void;
  onNavigateToSettings: () => void;
  onNavigateToHistory: () => void;
  onNavigateToAdmin?: () => void;
  onNavigateToCalendar?: () => void;
  onIdeaUpdated?: (updated: ContentIdea) => void;
  onOpenAuthModal?: (mode?: 'login' | 'register') => void;
  onLoginSuccess?: (user: UserPublicInfo, token: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  profile,
  todayIdea,
  recentIdeas,
  stats,
  onGenerateNew,
  isGenerating,
  onUpdateStatus,
  onSimulateRun,
  onToggleScheduler,
  onSelectIdea,
  onNavigateToSettings,
  onNavigateToHistory,
  onNavigateToAdmin,
  onNavigateToCalendar,
  onIdeaUpdated,
  onOpenAuthModal,
  onLoginSuccess,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const quotaUsed = currentUser?.daily_videos_used || 0;
  const quotaLimit = currentUser?.daily_video_limit || 1;

  // Calculate current Persian day & calendar plan
  const persianDaysMap = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
  const todayPersian = persianDaysMap[new Date().getDay()];
  const todayPlan = profile?.calendar_schedule?.find(p => p.day_of_week === todayPersian);

  return (
    <div className="space-y-6">
      
      {/* Unified Context & Command Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Right: Account & Today's Calendar Topic */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm sm:text-base font-bold text-white">
                {profile?.page_name ? profile.page_name : 'پیج اینستاگرام'}
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-xs text-pink-400 font-mono dir-ltr">
                {profile?.instagram_handle || `@${currentUser?.username || 'user'}`}
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-xs text-slate-300 font-medium">
                {currentUser?.display_name ? `مدیر: ${currentUser.display_name}` : ''}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
              <span className="text-slate-300 font-medium">🗓️ {todayPersian}:</span>
              <span className="text-slate-200 font-semibold">{todayPlan?.topic || 'آموزش تخصصی و ترفندهای کاربردی'}</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">فرمت: <strong className="text-pink-400 font-semibold">{todayPlan?.content_type || 'Reel'}</strong></span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">هدف: <strong className="text-slate-200">{todayPlan?.goal || 'جذب فالوور جدید'}</strong></span>
              <span className="text-slate-600">|</span>
              <button
                type="button"
                onClick={onNavigateToSettings}
                className={`inline-flex items-center gap-1 font-medium cursor-pointer transition-colors ${
                  profile?.notebooklm?.enabled
                    ? 'text-emerald-400 hover:text-emerald-300'
                    : 'text-slate-400 hover:text-indigo-400'
                }`}
                title="مدیریت اتصال روزانه به NotebookLM"
              >
                <span>NotebookLM:</span>
                <strong>{profile?.notebooklm?.enabled ? 'متصل و خودکار' : 'غیرفعال'}</strong>
              </button>
            </div>
          </div>

          {/* Left: Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onSimulateRun}
              disabled={isGenerating}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
              title="اجرای فوری کل پایپلاین: تولید محتوا + ساخت تصویر/اسلاید/استوری/ویدیو + انتشار خودکار"
            >
              <Zap className={`w-3.5 h-3.5 ${isGenerating ? 'animate-pulse' : ''}`} />
              <span>{isGenerating ? 'در حال اتوماسیون...' : 'اجرای اتوپایلوت الان'}</span>
            </button>

            {onNavigateToCalendar && (
              <button
                type="button"
                onClick={onNavigateToCalendar}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="ویرایش تقویم ۷ روزه و پرامپت پوستر"
              >
                <Sliders className="w-3.5 h-3.5 text-pink-400" />
                <span>تقویم و پوستر</span>
              </button>
            )}

            <a
              href="/api/project/download-source"
              download="instagram-ai-studio-full-source.zip"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="دانلود کل سورس‌کد پروژه با تمام بخش‌ها (.ZIP)"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>دانلود سورس (.ZIP)</span>
            </a>

            {isAdmin && onNavigateToAdmin && (
              <button
                type="button"
                onClick={onNavigateToAdmin}
                className="px-3 py-2 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1 hover:bg-amber-500/25 transition-colors"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>پنل ادمین</span>
              </button>
            )}
          </div>

        </div>
      </div>
      
      {/* Refined 4-Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Metric 1: Total Ideas */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block mb-0.5">کل ایده‌ها</span>
            <div className="text-xl sm:text-2xl font-bold text-white tabular-nums">{stats.total_ideas}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-pink-400">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        {/* Metric 2: Published */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block mb-0.5">منتشر شده در پیج</span>
            <div className="text-xl sm:text-2xl font-bold text-emerald-400 tabular-nums">{stats.published_ideas}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* Metric 3: In Progress */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block mb-0.5">در حال ضبط و ادیت</span>
            <div className="text-xl sm:text-2xl font-bold text-amber-400 tabular-nums">{stats.in_progress_ideas}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        {/* Metric 4: Daily Schedule Time & Switch */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block mb-0.5">انتشار خودکار</span>
            <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
              <span className="tabular-nums">ساعت {stats.scheduled_time}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded ${stats.scheduler_active ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                {stats.scheduler_active ? 'روشن' : 'خاموش'}
              </span>
            </div>
          </div>
          <button
            onClick={onToggleScheduler}
            title={stats.scheduler_active ? 'خاموش کردن زمان‌بند روزانه' : 'روشن کردن زمان‌بند روزانه'}
            className={`w-9 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
              stats.scheduler_active ? 'bg-emerald-600 justify-start' : 'bg-slate-800 justify-end'
            }`}
          >
            <div className="bg-white w-4 h-4 rounded-full shadow-sm"></div>
          </button>
        </div>

      </div>

      {/* Main Today Idea Section */}
      <TodayIdeaCard
        idea={todayIdea}
        profile={profile}
        currentUser={currentUser}
        onOpenAuth={onOpenAuthModal}
        onLoginSuccess={onLoginSuccess}
        onUpdateStatus={onUpdateStatus}
        onSimulateRun={onSimulateRun}
        onGenerateNew={onGenerateNew}
        isGenerating={isGenerating}
        onIdeaUpdated={onIdeaUpdated}
      />

      {/* Bottom Split: Page Quick Info & Previous Ideas Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Quick Profile Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-pink-400" />
                تنظیمات فعال پیج
              </h3>
              <button
                onClick={onNavigateToSettings}
                className="text-xs text-pink-400 hover:text-pink-300 flex items-center gap-1"
              >
                ویرایش
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {profile ? (
              <div className="space-y-3.5 text-xs text-slate-300">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400 block mb-0.5">نام پیج:</span>
                  <span className="font-bold text-white text-sm">{profile.page_name}</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400 block mb-0.5">حوزه فعالیت:</span>
                  <span className="text-slate-200">{profile.niche}</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400 block mb-0.5">مخاطب هدف:</span>
                  <span className="text-slate-200 line-clamp-2">{profile.target_audience}</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400 block mb-0.5">لحن محتوا:</span>
                  <span className="text-pink-400 font-medium">{profile.content_tone}</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400 block mb-1">اهداف انتخاب شده:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.page_goals.map((g, idx) => (
                      <span key={idx} className="bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded-md border border-purple-500/20 text-[11px]">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>موتور هوش مصنوعی:</span>
            <span className="text-slate-200 font-mono bg-slate-950 px-2 py-1 rounded-md border border-slate-800">
              gemini-4-hydrogen
            </span>
          </div>
        </div>

        {/* Right: Previous Ideas List (Recent History) */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                ایده‌های قبلی پیج (بررسی‌شده برای جلوگیری از تکرار)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                ایجنت پیش از ساخت ایده جدید این عناوین را تحلیل کرده تا تکراری نباشند.
              </p>
            </div>
            <button
              onClick={onNavigateToHistory}
              className="text-xs text-pink-400 hover:text-pink-300 flex items-center gap-1 font-medium"
            >
              مشاهده همه
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentIdeas.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              هنوز ایده‌ای در سابقه ذخیره نشده است.
            </div>
          ) : (
            <div className="space-y-3">
              {recentIdeas.slice(0, 5).map((prevIdea) => (
                <div
                  key={prevIdea.id}
                  onClick={() => onSelectIdea(prevIdea)}
                  className="cursor-pointer bg-slate-950/70 hover:bg-slate-950 border border-slate-800/80 hover:border-pink-500/40 p-3.5 rounded-2xl transition-all flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className={`text-[11px] px-2 py-1 rounded-lg border font-semibold ${
                      prevIdea.content_type === 'Reel'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : prevIdea.content_type === 'Carousel'
                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {prevIdea.content_type}
                    </span>
                    <div className="truncate">
                      <h4 className="text-sm font-semibold text-slate-200 group-hover:text-pink-300 transition-colors truncate">
                        {prevIdea.title}
                      </h4>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        Hook: «{prevIdea.hook}»
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs shrink-0">
                    <span className="text-slate-400">{prevIdea.date_label}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] ${
                      prevIdea.status === 'published'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : prevIdea.status === 'in_progress'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {prevIdea.status === 'published' ? 'منتشر شد' : prevIdea.status === 'in_progress' ? 'در حال ساخت' : 'جدید'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
