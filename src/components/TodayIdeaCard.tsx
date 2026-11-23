import React, { useState, useRef } from 'react';
import { 
  Sparkles, Copy, Check, Clock, BarChart3, AlertCircle, 
  Send, Eye, Film, Layers, Radio, Share2, Bookmark, CheckCircle2,
  Tv, MessageSquare, Flame, HelpCircle, Instagram, Palette, ExternalLink,
  BookOpen, Upload, RefreshCw, Video, Link as LinkIcon
} from 'lucide-react';
import type { ContentIdea, IdeaStatus, InstagramProfile, UserPublicInfo } from '../types.ts';
import { PublishModal } from './PublishModal.tsx';

interface TodayIdeaCardProps {
  idea: ContentIdea | null;
  profile?: InstagramProfile | null;
  onUpdateStatus: (id: string, status: IdeaStatus) => void;
  onSimulateRun: () => void;
  onGenerateNew: () => void;
  isGenerating: boolean;
  onIdeaUpdated?: (updated: ContentIdea) => void;
  currentUser?: UserPublicInfo | null;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
  onLoginSuccess?: (user: UserPublicInfo, token: string) => void;
}

export const TodayIdeaCard: React.FC<TodayIdeaCardProps> = ({
  idea,
  profile = null,
  onUpdateStatus,
  onSimulateRun,
  onGenerateNew,
  isGenerating,
  onIdeaUpdated,
  currentUser,
  onOpenAuth,
  onLoginSuccess,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'script' | 'caption' | 'visuals' | 'notebooklm' | 'preview'>('script');
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  // NotebookLM Two-Way Video Pipeline State
  const [isDispatchingNlm, setIsDispatchingNlm] = useState(false);
  const [isAttachingNlm, setIsAttachingNlm] = useState(false);
  const [nlmMessage, setNlmMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [nlmVideoUrlInput, setNlmVideoUrlInput] = useState('');
  const [nlmSourceDoc, setNlmSourceDoc] = useState('');
  const [nlmVideoPrompt, setNlmVideoPrompt] = useState('');
  const [nlmCallbackUrl, setNlmCallbackUrl] = useState('');
  const [isRenderingServerMedia, setIsRenderingServerMedia] = useState(false);
  const videoFileInputRef = useRef<HTMLInputElement | null>(null);

  if (!idea) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center">
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
          <Sparkles className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">هنوز ایده‌ای برای امروز تولید نشده است</h3>
        <p className="text-slate-400 text-xs max-w-md mx-auto mb-5 leading-relaxed">
          دستیار شما طبق زمان‌بندی روزانه یا با فشردن دکمه زیر، یک ایده اختصاصی با سناریو و کپشن کامل آماده می‌کند.
        </p>
        <button
          onClick={onGenerateNew}
          disabled={isGenerating}
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md shadow-pink-500/20 hover:shadow-pink-500/40 transition-all cursor-pointer"
        >
          {isGenerating ? 'در حال طراحی ایده با هوش مصنوعی...' : 'تولید اولین ایده امروز ✨'}
        </button>
      </div>
    );
  }

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleLoadNotebookLMPackage = async () => {
    try {
      const token = localStorage.getItem('instaideas_token') || '';
      const res = await fetch(`/api/notebooklm/status/${idea.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setNlmSourceDoc(data.source_doc || '');
        setNlmVideoPrompt(data.video_prompt || '');
        setNlmCallbackUrl(data.callback_url || '');
      }
    } catch {
      // Ignore silent preload failures
    }
  };

  const handleDispatchToNotebookLM = async () => {
    setIsDispatchingNlm(true);
    setNlmMessage(null);
    try {
      const token = localStorage.getItem('instaideas_token') || '';
      const res = await fetch('/api/notebooklm/dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ idea_id: idea.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در ارسال دیتا به NotebookLM');
      }
      if (data.idea) {
        setNlmSourceDoc(data.idea.notebooklm_source_doc || '');
        setNlmVideoPrompt(data.idea.notebooklm_video_prompt || '');
        if (onIdeaUpdated) onIdeaUpdated(data.idea);
      }
      if (data.callbackUrl) {
        setNlmCallbackUrl(data.callbackUrl);
      }
      setNlmMessage({ text: data.message || 'دیتا با موفقیت به NotebookLM ارسال شد.', type: 'success' });
    } catch (err: any) {
      setNlmMessage({ text: err.message || 'خطا در اتصال به پل NotebookLM', type: 'error' });
    } finally {
      setIsDispatchingNlm(false);
    }
  };

  const handleAttachNotebookLMVideo = async (autoPublish: boolean, base64Video?: string) => {
    setIsAttachingNlm(true);
    setNlmMessage(null);
    try {
      const token = localStorage.getItem('instaideas_token') || '';
      const res = await fetch('/api/notebooklm/attach-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          idea_id: idea.id,
          video_url: base64Video ? undefined : nlmVideoUrlInput.trim(),
          video_base64: base64Video,
          auto_publish: autoPublish,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در ثبت ویدیوی NotebookLM');
      }
      if (data.idea && onIdeaUpdated) {
        onIdeaUpdated(data.idea);
      }
      setNlmVideoUrlInput('');
      setNlmMessage({ text: data.message || 'ویدیوی NotebookLM با موفقیت ثبت شد.', type: 'success' });
    } catch (err: any) {
      setNlmMessage({ text: err.message || 'خطا در ثبت ویدیو', type: 'error' });
    } finally {
      setIsAttachingNlm(false);
    }
  };

  const handleVideoFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 35 * 1024 * 1024) {
      setNlmMessage({ text: 'حجم فایل ویدیو نباید بیشتر از ۳۵ مگابایت باشد.', type: 'error' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleAttachNotebookLMVideo(false, reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRenderServerMedia = async () => {
    setIsRenderingServerMedia(true);
    try {
      const token = localStorage.getItem('instaideas_token') || '';
      const res = await fetch(`/api/ideas/${idea.id}/render-media`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.idea && onIdeaUpdated) {
        onIdeaUpdated(data.idea);
      }
    } catch (e) {
      console.error('Server media render error:', e);
    } finally {
      setIsRenderingServerMedia(false);
    }
  };

  const getFormatBadge = (type: string) => {
    switch (type) {
      case 'Reel':
        return { label: 'ریلز (Reel)', color: 'text-rose-400', icon: Film };
      case 'Story':
        return { label: 'استوری (Story)', color: 'text-amber-400', icon: Tv };
      case 'Carousel':
        return { label: 'کاروسل اسلایدی (Carousel)', color: 'text-indigo-400', icon: Layers };
      case 'Live':
        return { label: 'لایو (Live)', color: 'text-red-400', icon: Radio };
      default:
        return { label: 'پست تصویری (Post)', color: 'text-emerald-400', icon: Film };
    }
  };

  const formatBadge = getFormatBadge(idea.content_type);
  const FormatIcon = formatBadge.icon;

  const fullCopyText = `📌 عنوان: ${idea.title}
🎬 نوع محتوا: ${idea.content_type}
🎯 هدف: ${idea.goal}

⚡ Hook شروع ۳ ثانیه اول:
${idea.hook}

💡 ایده کامل:
${idea.idea}

📝 سناریوی مرحله‌به‌مرحله:
${idea.script}

🎙️ دیالوگ کلامی ویدیو یا متن اسلایدها:
${idea.video_script || idea.script}

📋 کپشن:
${idea.caption}

📢 Call To Action:
${idea.cta}

🏷 هشتگ‌ها:
${idea.hashtags.join(' ')}
`;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl">
      
      {/* 1. Header Bar: Title, Unboxed Metadata & Primary Action */}
      <div className="p-5 sm:p-6 border-b border-slate-800 space-y-4">
        
        {/* Top Kicker & Action Cluster */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Metadata Row */}
          <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
            <span className="font-semibold text-pink-400">{idea.date_label}</span>
            <span className="text-slate-600">·</span>
            <span className="flex items-center gap-1">
              <FormatIcon className={`w-3.5 h-3.5 ${formatBadge.color}`} />
              <span className="text-slate-200 font-medium">{formatBadge.label}</span>
            </span>
            <span className="text-slate-600">·</span>
            <span>هدف: <strong className="text-slate-200 font-medium">{idea.goal}</strong></span>
            <span className="text-slate-600">·</span>
            <span>زمان ساخت: <strong className="text-slate-300 font-medium">{idea.estimated_time}</strong></span>
            <span className="text-slate-600">·</span>
            <span>سختی: <strong className="text-amber-300 font-medium">{idea.difficulty}</strong></span>
          </div>

          {/* Top Actions: Status + Launch Studio + Copy All */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <select
              value={idea.status}
              onChange={(e) => onUpdateStatus(idea.id, e.target.value as IdeaStatus)}
              aria-label="تغییر وضعیت اجرای ایده"
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-2.5 py-1.5 outline-none focus:border-pink-500 cursor-pointer"
            >
              <option value="new">🟡 در انتظار ساخت</option>
              <option value="in_progress">🟠 در حال ضبط / ادیت</option>
              <option value="published">🟢 منتشر شده</option>
              <option value="archived">⚪ بایگانی</option>
            </select>

            <button
              onClick={() => setIsPublishModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md shadow-pink-500/20 hover:from-pink-600 hover:to-rose-700 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              title="ورود به استودیو طراحی رسانه و انتشار به اینستاگرام"
            >
              <Send className="w-3.5 h-3.5" />
              <span>استودیو و انتشار</span>
            </button>

            <button
              onClick={() => copyToClipboard(fullCopyText, 'full')}
              className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 text-xs transition-all flex items-center gap-1 cursor-pointer"
              title="کپی کردن متن کامل سناریو، کپشن و هشتگ‌ها"
            >
              {copiedKey === 'full' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">کپی کل ایده</span>
            </button>
          </div>

        </div>

        {/* Main Title */}
        <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
          {idea.title}
        </h2>

        {/* Segmented Workspace Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-medium overflow-x-auto">
          <button
            onClick={() => setActiveTab('script')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'script'
                ? 'bg-slate-800 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-pink-400" />
            <span>سناریو و ویدیو</span>
          </button>

          <button
            onClick={() => setActiveTab('caption')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'caption'
                ? 'bg-slate-800 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-400" />
            <span>کپشن و هشتگ‌ها</span>
          </button>

          <button
            onClick={() => setActiveTab('visuals')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'visuals'
                ? 'bg-slate-800 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-purple-400" />
            <span>راهنمای بصری و پوستر</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('notebooklm');
              handleLoadNotebookLMPackage();
            }}
            className={`flex-1 min-w-[130px] py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'notebooklm'
                ? 'bg-slate-800 text-emerald-300 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>ویدیوی NotebookLM</span>
            {idea.generated_video_url && (
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-slate-800 text-pink-300 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>پیش‌نمایش اینستاگرام</span>
          </button>
        </div>

      </div>

      {/* 2. TAB 1: SCRIPT & VIDEO */}
      {activeTab === 'script' && (
        <div className="p-5 sm:p-6 space-y-5">
          
          {/* Hook (Crucial for 3-second retention) */}
          <div className="bg-slate-950/90 border border-pink-500/30 rounded-xl p-4 sm:p-5 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-pink-400 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-pink-400" />
                <span>جمله قلاب شروع ۳ ثانیه اول (Hook):</span>
              </span>
              <button
                onClick={() => copyToClipboard(idea.hook, 'hook')}
                className="text-xs text-pink-300 hover:text-white flex items-center gap-1 bg-pink-500/15 hover:bg-pink-500/25 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
              >
                {copiedKey === 'hook' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>کپی هوک</span>
              </button>
            </div>
            <p className="text-base sm:text-lg font-bold text-white leading-relaxed">
              « {idea.hook} »
            </p>
            <p className="text-[11px] text-slate-400 mt-2">
              💡 نکته استراتژیست: این جمله را در ۳ ثانیه نخست با لحن پرانرژی و شوکه‌کننده بیان کنید و همزمان به صورت متن بولد روی تصویر نمایش دهید.
            </p>
          </div>

          {/* 2-Column Split: Step-by-Step Script vs. Spoken Dialogue */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Step-by-step Script */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-rose-400" />
                  <span>سناریوی مرحله‌به‌مرحله و زمان‌بندی:</span>
                </span>
                <button
                  onClick={() => copyToClipboard(idea.script, 'script')}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                >
                  {copiedKey === 'script' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>کپی سناریو</span>
                </button>
              </div>
              <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed bg-slate-900/80 p-3.5 rounded-lg border border-slate-800/80 font-mono text-[12px] max-h-80 overflow-y-auto">
                {idea.script}
              </div>
            </div>

            {/* Video Dialogue / Spoken text */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                  <span>متن کلامی و دیالوگ دقیق ویدیو/اسلایدها:</span>
                </span>
                <button
                  onClick={() => copyToClipboard(idea.video_script, 'video_script')}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                >
                  {copiedKey === 'video_script' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>کپی دیالوگ</span>
                </button>
              </div>
              <div className="text-xs text-slate-200 whitespace-pre-line leading-relaxed bg-slate-900/80 p-3.5 rounded-lg border border-slate-800/80 max-h-80 overflow-y-auto italic">
                {idea.video_script}
              </div>
            </div>

          </div>

          {/* Strategic Context & Why This Idea */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3.5">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                مفهوم و ارزش پیشنهادی ایده
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {idea.idea}
              </p>
            </div>

            <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3.5">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                دلیل استراتژیک برای رشد پیج شما
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {idea.reason}
              </p>
            </div>
          </div>

        </div>
      )}

      {/* 3. TAB 2: CAPTION & HASHTAGS */}
      {activeTab === 'caption' && (
        <div className="p-5 sm:p-6 space-y-5">
          
          {/* Main Ready-to-Publish Caption */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-pink-400" />
                  <span>کپشن بهینه‌سازی‌شده برای انتشار:</span>
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  شامل متن اصلی، ایموجی‌ها، فاصله‌بندی استاندارد اینستاگرام و دعوت به اقدام
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(idea.caption, 'caption')}
                className="px-3 py-1.5 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedKey === 'caption' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>کپی کپشن کامل</span>
              </button>
            </div>
            
            <div className="text-xs sm:text-sm text-slate-200 whitespace-pre-line leading-relaxed bg-slate-900/90 p-4 rounded-xl border border-slate-800 max-h-80 overflow-y-auto font-sans">
              {idea.caption}
            </div>
          </div>

          {/* Call to Action Box */}
          <div className="bg-slate-950/60 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 mb-1">
                <Share2 className="w-3.5 h-3.5" />
                <span>کال تو اکشن (Call To Action):</span>
              </span>
              <p className="text-xs text-slate-300 font-medium">
                {idea.cta}
              </p>
            </div>
            <button
              onClick={() => copyToClipboard(idea.cta, 'cta')}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 shrink-0 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800"
            >
              {copiedKey === 'cta' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>کپی CTA</span>
            </button>
          </div>

          {/* Explore Hashtags Cloud */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                هشتگ‌های تخصصی ({idea.hashtags.length} هشتگ) - روی هر کدام کلیک کنید تا کپی شود:
              </span>
              <button
                onClick={() => copyToClipboard(idea.hashtags.join(' '), 'hashtags')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                {copiedKey === 'hashtags' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>کپی همه هشتگ‌ها</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {idea.hashtags.map((tag, idx) => (
                <span
                  key={idx}
                  onClick={() => copyToClipboard(tag, `tag_${idx}`)}
                  className="cursor-pointer text-xs bg-slate-900 hover:bg-slate-800 text-pink-400 border border-slate-800/80 px-2.5 py-1 rounded-lg transition-colors"
                  title="کلیک برای کپی"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* 4. TAB 3: VISUALS & POSTER GUIDELINES */}
      {activeTab === 'visuals' && (
        <div className="p-5 sm:p-6 space-y-5">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Visual Suggestion */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-purple-400" />
                <span>راهنمای کادربندی، نورپردازی و قاب بصری:</span>
              </span>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-3.5 rounded-lg border border-slate-800">
                {idea.visual_suggestion}
              </p>
            </div>

            {/* Audio & Music Suggestion */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-teal-400" />
                <span>موزیک، افکت صوتی و صداگذاری:</span>
              </span>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-3.5 rounded-lg border border-slate-800">
                {idea.audio_suggestion || 'استفاده از موزیک‌های ترند بی‌کلام ریلز اینستاگرام با حجم صدای ملایم زیر صدای گوینده.'}
              </p>
            </div>

          </div>

          {/* Auto-Rendered Server Media Gallery (Post / 5 Carousel Slides / 3 Story Frames / MP4 Reel) */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>فایل‌های ساخته‌شده خودکار روی سرور ({idea.content_type})</span>
                </h4>
                {idea.auto_pipeline_note && (
                  <p className="text-[11px] text-slate-400 mt-0.5">{idea.auto_pipeline_note}</p>
                )}
              </div>

              <button
                type="button"
                onClick={handleRenderServerMedia}
                disabled={isRenderingServerMedia}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-sky-300 border border-slate-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRenderingServerMedia ? 'animate-spin' : ''}`} />
                <span>{isRenderingServerMedia ? 'در حال رندر...' : 'رندر خودکار فایل‌های رسانه'}</span>
              </button>
            </div>

            {idea.generated_video_url && (
              <div className="max-w-xs mx-auto rounded-2xl overflow-hidden border border-slate-800 bg-black">
                <video src={idea.generated_video_url} controls playsInline className="w-full aspect-[9/16] object-contain" />
              </div>
            )}

            {idea.generated_carousel_urls && idea.generated_carousel_urls.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {idea.generated_carousel_urls.map((url, idx) => (
                  <a key={idx} href={url} download target="_blank" rel="noreferrer" className="group block rounded-xl overflow-hidden border border-slate-800 hover:border-pink-500/60 transition-all">
                    <img src={url} alt={`اسلاید ${idx + 1}`} className="w-full aspect-square object-cover" />
                  </a>
                ))}
              </div>
            )}

            {idea.generated_story_urls && idea.generated_story_urls.length > 0 && (
              <div className="grid grid-cols-3 gap-2.5 max-w-lg mx-auto">
                {idea.generated_story_urls.map((url, idx) => (
                  <a key={idx} href={url} download target="_blank" rel="noreferrer" className="group block rounded-xl overflow-hidden border border-slate-800 hover:border-amber-500/60 transition-all">
                    <img src={url} alt={`فریم ${idx + 1}`} className="w-full aspect-[9/16] object-cover" />
                  </a>
                ))}
              </div>
            )}

            {!idea.generated_video_url && !idea.generated_carousel_urls?.length && !idea.generated_story_urls?.length && idea.generated_image_url && (
              <div className="max-w-xs mx-auto rounded-2xl overflow-hidden border border-slate-800">
                <img src={idea.generated_image_url} alt={idea.title} className="w-full aspect-square object-cover" />
              </div>
            )}

            {!idea.generated_image_url && !idea.generated_video_url && (
              <p className="text-xs text-slate-500 text-center py-3">
                برای این ایده هنوز فایل رسانه‌ای رندر نشده است؛ دکمه «رندر خودکار فایل‌های رسانه» بالا را بزنید.
              </p>
            )}
          </div>

          {/* Direct Launch to Media & Poster Studio */}
          <div className="bg-gradient-to-r from-purple-950/40 via-slate-950 to-pink-950/40 border border-purple-500/30 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-sm font-bold text-white block mb-1">
                استودیو طراحی پوستر و ساخت انیمیشن ریلز
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                تغییر استایل پوستر (سایبر نئون، مینیمال، لوکس طلایی، غروب)، دانلود فایل باکیفیت PNG و رندر انیمیشن ریلز.
              </p>
            </div>
            <button
              onClick={() => setIsPublishModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-md shadow-purple-500/25 flex items-center gap-1.5 cursor-pointer shrink-0 transition-all"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>ورود به استودیو طراحی و انتشار</span>
            </button>
          </div>

        </div>
      )}

      {/* 4.5 TAB: NOTEBOOKLM TWO-WAY VIDEO PIPELINE */}
      {activeTab === 'notebooklm' && (
        <div className="p-5 sm:p-6 space-y-5">
          {/* Pipeline Progress Bar */}
          <div className="bg-slate-950 border border-emerald-500/25 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  خط لوله خودکار: ارسال به NotebookLM ← ساخت ویدیو ← انتشار در اینستاگرام
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  وضعیت فعلی:{' '}
                  <strong className="text-emerald-300">
                    {idea.notebooklm_status === 'published'
                      ? '✅ ویدیو برگشت و در اینستاگرام منتشر شد'
                      : idea.notebooklm_status === 'video_ready' || idea.generated_video_url
                      ? '🎬 ویدیوی NotebookLM آماده انتشار است'
                      : idea.notebooklm_status === 'generating_video'
                      ? '⏳ ارسال شده به پل NotebookLM (در انتظار بازگشت ویدیو)'
                      : idea.notebooklm_status === 'dispatched'
                      ? '📦 سورس و پرامپت آماده ارسال به NotebookLM'
                      : idea.notebooklm_status === 'failed'
                      ? '❌ خطا در اتصال به پل'
                      : 'آماده شروع'}
                  </strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDispatchToNotebookLM}
                  disabled={isDispatchingNlm}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isDispatchingNlm ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{profile?.notebooklm?.bridge_url ? 'ارسال خودکار به NotebookLM' : 'آماده‌سازی بسته NotebookLM'}</span>
                </button>

                <a
                  href={profile?.notebooklm?.notebook_url || 'https://notebooklm.google.com/'}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                  <span>باز کردن NotebookLM</span>
                </a>
              </div>
            </div>

            {nlmMessage && (
              <div className={`p-3 rounded-xl text-xs border ${
                nlmMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                {nlmMessage.text}
              </div>
            )}
          </div>

          {/* 2-Column Workspace: Left = Outbound Source + Prompt | Right = Returned Video + Publish */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Column 1: Outbound Data & Video Overview Prompt */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">۱. دیتای منبع برای ارسال به NotebookLM (Source Brief)</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(idea.notebooklm_source_doc || nlmSourceDoc || fullCopyText, 'nlm_src')}
                    className="text-[11px] text-emerald-300 hover:text-white flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-lg cursor-pointer"
                  >
                    {copiedKey === 'nlm_src' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>کپی منبع</span>
                  </button>
                </div>
                <pre className="text-[11px] text-slate-300 bg-slate-900 p-3 rounded-xl border border-slate-800 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed font-sans">
                  {idea.notebooklm_source_doc || nlmSourceDoc || fullCopyText}
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">۲. پرامپت ساخت ویدیو در NotebookLM Studio</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(idea.notebooklm_video_prompt || nlmVideoPrompt || `یک ویدیوی توضیحی کوتاه بر اساس قلاب «${idea.hook}» و سناریو برای اینستاگرام بساز.`, 'nlm_prompt')}
                    className="text-[11px] text-sky-300 hover:text-white flex items-center gap-1 bg-sky-500/10 px-2 py-1 rounded-lg cursor-pointer"
                  >
                    {copiedKey === 'nlm_prompt' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>کپی پرامپت ویدیو</span>
                  </button>
                </div>
                <div className="text-xs text-slate-300 bg-slate-900 p-3 rounded-xl border border-slate-800 leading-relaxed">
                  {idea.notebooklm_video_prompt || nlmVideoPrompt || `یک ویدیوی کوتاه اینستاگرامی با قلاب «${idea.hook}» و دعوت به اقدام «${idea.cta}» تولید کن.`}
                </div>
              </div>

              {nlmCallbackUrl && (
                <div className="text-[11px] text-slate-400 bg-slate-900/70 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                  <span className="truncate dir-ltr font-mono">{nlmCallbackUrl}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(nlmCallbackUrl, 'nlm_cb')}
                    className="shrink-0 text-sky-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 cursor-pointer"
                  >
                    {copiedKey === 'nlm_cb' ? 'کپی شد' : 'کپی Callback'}
                  </button>
                </div>
              )}
            </div>

            {/* Column 2: Returned Video & Auto/Manual Publish to Instagram */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-4">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Video className="w-4 h-4 text-pink-400" />
                ۳. ویدیوی برگشتی از NotebookLM و ارسال به اینستاگرام
              </span>

              {idea.generated_video_url ? (
                <div className="space-y-3">
                  <div className="rounded-xl overflow-hidden bg-black border border-slate-800 aspect-video flex items-center justify-center">
                    <video
                      src={idea.generated_video_url}
                      controls
                      className="w-full h-full max-h-64 object-contain"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPublishModalOpen(true)}
                      className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-md shadow-pink-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Instagram className="w-4 h-4" />
                      <span>انتشار ویدیو به عنوان ریلز اینستاگرام</span>
                    </button>
                    <a
                      href={idea.generated_video_url}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                    >
                      دانلود ویدیو
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-900/70 border border-dashed border-slate-700 text-center space-y-2">
                  <Film className="w-7 h-7 text-slate-500 mx-auto" />
                  <p className="text-xs text-slate-300 font-medium">
                    هنوز ویدیویی از NotebookLM دریافت نشده است
                  </p>
                  <p className="text-[11px] text-slate-500">
                    در صورت اتصال پل خودکار (Callback)، ویدیو اتوماتیک اینجا ظاهر و منتشر می‌شود؛ یا فایل MP4 خروجی NotebookLM را در زیر آپلود/متصل کنید:
                  </p>
                </div>
              )}

              {/* Attach via URL or File Upload */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="لینک مستقیم ویدیوی خروجی (https://.../video.mp4)"
                    value={nlmVideoUrlInput}
                    onChange={(e) => setNlmVideoUrlInput(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-emerald-500 dir-ltr font-mono"
                  />
                  <button
                    type="button"
                    disabled={isAttachingNlm || !nlmVideoUrlInput.trim()}
                    onClick={() => handleAttachNotebookLMVideo(false)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>ثبت لینک</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={videoFileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    onChange={handleVideoFileSelected}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isAttachingNlm}
                    onClick={() => videoFileInputRef.current?.click()}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-emerald-300 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isAttachingNlm ? 'در حال بارگذاری ویدیو...' : 'آپلود فایل ویدیوی ساخته‌شده در NotebookLM (.mp4 / .webm)'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 4: INSTAGRAM MOCKUP PREVIEW */}
      {activeTab === 'preview' && (
        <div className="p-5 sm:p-6 flex justify-center">
          <div className="w-full max-w-sm bg-black border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl relative">
            
            {/* Phone Top Notch Bar */}
            <div className="bg-black text-white px-6 pt-3 pb-2 flex justify-between items-center text-[11px] font-sans">
              <span>9:41</span>
              <div className="w-20 h-3.5 bg-slate-900 rounded-full"></div>
              <div className="flex items-center gap-1">5G</div>
            </div>

            {/* Instagram Header */}
            <div className="px-4 py-2 flex items-center justify-between border-b border-white/10">
              <span className="font-semibold text-xs text-white">Instagram Reels</span>
              <span className="text-[11px] text-slate-400">{idea.content_type}</span>
            </div>

            {/* Simulated Reel Screen */}
            <div className="relative aspect-[9/16] bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 p-4 flex flex-col justify-between">
              
              {/* Hook text overlay in Reel */}
              <div className="mt-8 text-center bg-black/75 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 shadow-lg">
                <span className="text-[10px] text-pink-400 font-bold tracking-wider block mb-1">تیتر در ۳ ثانیه اول:</span>
                <p className="text-sm font-extrabold text-white leading-snug">
                  {idea.hook}
                </p>
              </div>

              {/* Middle preview clue */}
              <div className="text-center p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 text-xs text-slate-300">
                <p className="font-semibold text-white mb-1">💡 سناریوی پیشنهادی:</p>
                <p className="line-clamp-4 text-[11px] text-slate-300">{idea.script}</p>
              </div>

              {/* Bottom Reel UI with Profile & Caption */}
              <div className="space-y-2 text-white">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-rose-600 flex items-center justify-center font-bold text-xs">
                    AI
                  </div>
                  <span className="text-xs font-bold">{profile?.instagram_handle || '@your_instagram_page'}</span>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">Follow</span>
                </div>

                <p className="text-xs text-slate-200 line-clamp-2">
                  {idea.caption}
                </p>

                <div className="flex items-center gap-2 text-[10px] text-slate-300 bg-black/40 px-2 py-1 rounded-md">
                  <Radio className="w-3 h-3 text-pink-400" />
                  <span className="truncate">{idea.audio_suggestion || 'صدای ترند اینستاگرام'}</span>
                </div>
              </div>

            </div>

            {/* Instagram Bottom Nav Mock */}
            <div className="bg-black px-6 py-2.5 flex justify-between items-center text-slate-400 border-t border-white/10 text-xs">
              <span>🏠</span>
              <span>🔍</span>
              <span>➕</span>
              <span className="text-white">🎬</span>
              <span>👤</span>
            </div>

          </div>
        </div>
      )}

      {/* 6. Card Footer Bar */}
      <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <Clock className="w-3.5 h-3.5 text-pink-400" />
          <span>ساعت زمان‌بند: {idea.scheduled_time}</span>
          <span>•</span>
          <span>وضعیت:</span>
          <span className="font-medium text-slate-200">
            {idea.status === 'new' ? 'در انتظار ساخت' : idea.status === 'in_progress' ? 'در حال ضبط/ادیت' : idea.status === 'published' ? 'منتشر شده' : 'بایگانی'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdateStatus(idea.id, 'published')}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>علامت‌گذاری به عنوان منتشر شد</span>
          </button>
          
          <button
            onClick={onSimulateRun}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="اجرای مجدد ایجنت برای شبیه‌سازی دریافت ایده بعدی"
          >
            <span>شبیه‌سازی اجرای زمان‌بند</span>
          </button>
        </div>
      </div>

      {/* 1-Click Publishing & Visual Studio Modal */}
      <PublishModal
        idea={idea}
        profile={profile}
        currentUser={currentUser}
        onOpenAuth={onOpenAuth}
        onLoginSuccess={onLoginSuccess}
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onPublished={(updated) => {
          if (onIdeaUpdated) onIdeaUpdated(updated);
        }}
      />

    </div>
  );
};
