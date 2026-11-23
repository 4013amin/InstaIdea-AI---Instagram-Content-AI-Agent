import React, { useState } from 'react';
import { 
  Search, Filter, Calendar, Clock, Film, Layers, Tv, Radio, 
  Trash2, Copy, Check, Eye, Download, X, CheckCircle2, Bookmark,
  Instagram, Send
} from 'lucide-react';
import type { ContentIdea, IdeaStatus, ContentType, InstagramProfile, UserPublicInfo } from '../types.ts';
import { PublishModal } from './PublishModal.tsx';

interface HistoryViewProps {
  ideas: ContentIdea[];
  profile?: InstagramProfile | null;
  onUpdateStatus: (id: string, status: IdeaStatus) => void;
  onDeleteIdea: (id: string) => void;
  onIdeaUpdated?: (updated: ContentIdea) => void;
  currentUser?: UserPublicInfo | null;
  onOpenAuthModal?: (mode?: 'login' | 'register') => void;
  onLoginSuccess?: (user: UserPublicInfo, token: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  ideas,
  profile = null,
  onUpdateStatus,
  onDeleteIdea,
  onIdeaUpdated,
  currentUser,
  onOpenAuthModal,
  onLoginSuccess,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedGoal, setSelectedGoal] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeIdeaModal, setActiveIdeaModal] = useState<ContentIdea | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [publishTargetIdea, setPublishTargetIdea] = useState<ContentIdea | null>(null);

  // Filter ideas
  const filteredIdeas = ideas.filter((idea) => {
    // Search
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term || (
      idea.title.toLowerCase().includes(term) ||
      idea.hook.toLowerCase().includes(term) ||
      idea.caption.toLowerCase().includes(term) ||
      idea.hashtags.some(h => h.toLowerCase().includes(term))
    );

    // Type
    const matchesType = selectedType === 'all' || idea.content_type.toLowerCase() === selectedType.toLowerCase();

    // Goal
    const matchesGoal = selectedGoal === 'all' || idea.goal.includes(selectedGoal);

    // Status
    const matchesStatus = selectedStatus === 'all' || idea.status === selectedStatus;

    return matchesSearch && matchesType && matchesGoal && matchesStatus;
  });

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const exportAsJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredIdeas, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `instagram_ideas_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportAsTxt = () => {
    const textContent = filteredIdeas.map((idea, idx) => `
========================================
ایده شماره ${idx + 1}: ${idea.title}
تاریخ: ${idea.date_label} | نوع: ${idea.content_type} | وضعیت: ${idea.status}
هدف: ${idea.goal} | زمان ساخت: ${idea.estimated_time} | سختی: ${idea.difficulty}
----------------------------------------
⚡ Hook:
${idea.hook}

💡 شرح ایده:
${idea.idea}

🎬 سناریو و متن کلامی:
${idea.video_script || idea.script}

📋 کپشن:
${idea.caption}

📢 CTA:
${idea.cta}

🏷 هشتگ‌ها:
${idea.hashtags.join(' ')}
========================================
`).join('\n\n');

    const dataStr = 'data:text/plain;charset=utf-8,' + encodeURIComponent(textContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `instagram_ideas_archive_${new Date().toISOString().slice(0, 10)}.txt`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Controls & Filters */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-pink-400" />
              آرشیو و تاریخچه تمام ایده‌ها
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              مجموع {ideas.length} ایده تولیدشده • فیلتر و جستجوی لحظه‌ای در عناوین، سناریوها و کپشن‌ها
            </p>
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={exportAsTxt}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              خروجی متنی (TXT)
            </button>
            <button
              onClick={exportAsJson}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              خروجی JSON
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="جستجو در عنوان، هوک، کپشن..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-pink-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Content Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              aria-label="فیلتر بر اساس نوع محتوا"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-pink-500"
            >
              <option value="all">همه فرمت‌ها (Reel, Story, ...)</option>
              <option value="Reel">🎬 فقط ریلز (Reel)</option>
              <option value="Story">📱 فقط استوری (Story)</option>
              <option value="Carousel">📚 فقط کاروسل (Carousel)</option>
              <option value="Post">🖼 فقط پست تک‌اسلاید</option>
              <option value="Live">🎙 فقط لایو</option>
            </select>
          </div>

          {/* Goal Filter */}
          <div>
            <select
              value={selectedGoal}
              onChange={(e) => setSelectedGoal(e.target.value)}
              aria-label="فیلتر بر اساس هدف محتوا"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-pink-500"
            >
              <option value="all">همه اهداف محتوایی</option>
              <option value="فالوور">افزایش فالوور</option>
              <option value="تعامل">افزایش تعامل و سیو</option>
              <option value="فروش">فروش و پیشنهاد محصول</option>
              <option value="برندینگ">برندینگ و اعتبار</option>
              <option value="آموزش">آموزش تخصصی</option>
              <option value="مشتری">جذب مشتری و لید</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="فیلتر بر اساس وضعیت اجرا"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-pink-500"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="new">🟡 در انتظار ساخت (جدید)</option>
              <option value="in_progress">🟠 در حال ضبط و ادیت</option>
              <option value="published">🟢 منتشر شده</option>
              <option value="archived">⚪ بایگانی شده</option>
            </select>
          </div>

        </div>

      </div>

      {/* Ideas Grid */}
      {filteredIdeas.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
          <Filter className="w-8 h-8 mx-auto mb-3 text-slate-500" />
          <p className="text-sm font-semibold">هیچ ایده‌ای با این فیلترها پیدا نشد.</p>
          <p className="text-xs text-slate-500 mt-1">عبارت جستجو یا فیلترهای بالا را تغییر دهید.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredIdeas.map((idea) => {
            return (
              <div
                key={idea.id}
                className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-pink-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all group shadow-lg"
              >
                <div>
                  {/* Top line with format, date, and status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                      idea.content_type === 'Reel'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : idea.content_type === 'Carousel'
                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {idea.content_type}
                    </span>

                    <span className="text-[11px] text-slate-400">
                      {idea.date_label}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-white group-hover:text-pink-300 transition-colors line-clamp-2 mb-2 leading-snug">
                    {idea.title}
                  </h3>

                  {/* Hook preview */}
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 mb-3">
                    <span className="text-[10px] text-pink-400 font-bold block mb-0.5">Hook:</span>
                    <p className="text-xs text-slate-300 italic line-clamp-2">
                      «{idea.hook}»
                    </p>
                  </div>

                  {/* Goal & Time */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3">
                    <span className="truncate">🎯 {idea.goal}</span>
                    <span className="shrink-0">⏱ {idea.estimated_time}</span>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <select
                    value={idea.status}
                    onChange={(e) => onUpdateStatus(idea.id, e.target.value as IdeaStatus)}
                    aria-label="تغییر وضعیت اجرا"
                    className="bg-slate-950 border border-slate-800 text-[11px] text-slate-300 rounded-lg px-2 py-1 outline-none"
                  >
                    <option value="new">🟡 جدید</option>
                    <option value="in_progress">🟠 در حال ساخت</option>
                    <option value="published">🟢 منتشر شد</option>
                    <option value="archived">⚪ بایگانی</option>
                  </select>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveIdeaModal(idea)}
                      className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                      title="مشاهده جزئیات و سناریوی کامل"
                    >
                      <Eye className="w-4 h-4 text-pink-400" />
                    </button>
                    <button
                      onClick={() => copyToClipboard(idea.caption, `cap_${idea.id}`)}
                      className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                      title="کپی کردن کپشن"
                    >
                      {copiedKey === `cap_${idea.id}` ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => onDeleteIdea(idea.id)}
                      className="p-1.5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                      title="حذف ایده"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Idea Detail Modal */}
      {activeIdeaModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative">
            
            <button
              onClick={() => setActiveIdeaModal(null)}
              className="absolute left-6 top-6 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2.5 py-1 rounded-md bg-pink-500/10 text-pink-400 border border-pink-500/20 font-bold">
                {activeIdeaModal.content_type}
              </span>
              <span className="text-xs text-slate-400">{activeIdeaModal.date_label}</span>
              <span className="text-xs text-purple-400">سختی: {activeIdeaModal.difficulty}</span>
            </div>

            <h3 className="text-xl font-bold text-white mb-4">
              {activeIdeaModal.title}
            </h3>

            {/* Hook */}
            <div className="bg-pink-950/30 border border-pink-500/30 rounded-2xl p-4 mb-4">
              <span className="text-xs font-bold text-pink-400 block mb-1">Hook ۳ ثانیه اول:</span>
              <p className="text-sm font-semibold text-white">«{activeIdeaModal.hook}»</p>
            </div>

            {/* Full Concept & Reason */}
            <div className="space-y-4 text-xs text-slate-300 mb-4">
              <div>
                <span className="font-bold text-slate-400 block mb-1">توضیح کامل ایده:</span>
                <p className="leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">{activeIdeaModal.idea}</p>
              </div>

              <div>
                <span className="font-bold text-slate-400 block mb-1">چرا مناسب این پیج است؟</span>
                <p className="leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">{activeIdeaModal.reason}</p>
              </div>

              <div>
                <span className="font-bold text-slate-400 block mb-1">سناریوی پیشنهادی:</span>
                <div className="whitespace-pre-line leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[12px]">
                  {activeIdeaModal.script}
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-400 block mb-1">متن دقیق کلامی ویدیو یا اسلایدها:</span>
                <div className="whitespace-pre-line leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800 italic">
                  {activeIdeaModal.video_script}
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-400 block mb-1">کپشن:</span>
                <div className="whitespace-pre-line leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {activeIdeaModal.caption}
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-400 block mb-1">Call To Action:</span>
                <p className="bg-amber-500/10 text-amber-300 p-2.5 rounded-lg border border-amber-500/20 font-medium">
                  {activeIdeaModal.cta}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-400 block mb-1">هشتگ‌ها:</span>
                <p className="text-pink-400 font-mono">{activeIdeaModal.hashtags.join(' ')}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => {
                  setPublishTargetIdea(activeIdeaModal);
                }}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-pink-500/20"
              >
                <Instagram className="w-4 h-4" />
                <span>🚀 استودیو و انتشار به اینستاگرام</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    copyToClipboard(activeIdeaModal.caption, 'modal_cap');
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  {copiedKey === 'modal_cap' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  کپی کپشن
                </button>
                <button
                  onClick={() => setActiveIdeaModal(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
                >
                  بستن
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Publish Modal for history items */}
      {publishTargetIdea && (
        <PublishModal
          idea={publishTargetIdea}
          profile={profile}
          currentUser={currentUser}
          onOpenAuth={onOpenAuthModal}
          onLoginSuccess={onLoginSuccess}
          isOpen={!!publishTargetIdea}
          onClose={() => setPublishTargetIdea(null)}
          onPublished={(updated) => {
            if (onIdeaUpdated) onIdeaUpdated(updated);
            setActiveIdeaModal(null);
            setPublishTargetIdea(null);
          }}
        />
      )}

    </div>
  );
};
