import React, { useState, useEffect } from 'react';
import { 
  Sliders, Save, Clock, Check, Sparkles, AlertCircle, Plus, 
  Trash2, Send, ExternalLink, Bot, Bell, ShieldAlert, CheckCircle2,
  TrendingUp, Compass, MessageSquare, Sun, Moon, Palette, BookOpen,
  Video, Copy, Workflow
} from 'lucide-react';
import type { InstagramProfile, PreferredContentTypeSetting, UserPublicInfo, NotebookLMSettings } from '../types.ts';

interface SettingsViewProps {
  currentUser?: UserPublicInfo | null;
  profile: InstagramProfile | null;
  onSaveProfile: (updated: Partial<InstagramProfile>) => Promise<void>;
  theme?: 'dark' | 'light' | 'sunset';
  onThemeChange?: (theme: 'dark' | 'light' | 'sunset') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  profile,
  onSaveProfile,
  theme = 'dark',
  onThemeChange,
}) => {
  const [formData, setFormData] = useState<Partial<InstagramProfile>>({});
  const [newSample, setNewSample] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedCallback, setCopiedCallback] = useState(false);

  // Profile analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  const handleGoalToggle = (goal: string) => {
    const current = formData.page_goals || [];
    if (current.includes(goal)) {
      setFormData({ ...formData, page_goals: current.filter(g => g !== goal) });
    } else {
      setFormData({ ...formData, page_goals: [...current, goal] });
    }
  };

  const handleAddSample = () => {
    if (!newSample.trim()) return;
    const current = formData.previous_samples || [];
    setFormData({ ...formData, previous_samples: [...current, newSample.trim()] });
    setNewSample('');
  };

  const handleRemoveSample = (index: number) => {
    const current = formData.previous_samples || [];
    setFormData({ ...formData, previous_samples: current.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveProfile(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAnalyzePage = async () => {
    setIsAnalyzing(true);
    try {
      const token = localStorage.getItem('instaideas_token') || '';
      const res = await fetch('/api/profile/analyze', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          instagram_url: formData.instagram_url,
          page_name: formData.page_name,
          niche: formData.niche,
          description: formData.description,
        })
      });
      const data = await res.json();
      if (data.analysis) {
        setAnalysisResult(data.analysis);
      }
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const allGoals = [
    'افزایش فالوور',
    'افزایش تعامل',
    'فروش',
    'برندینگ',
    'آموزش',
    'جذب مشتری',
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      
      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-8 shadow-2xl">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-pink-400" />
              پیکربندی هوشمند پیج اینستاگرام و زمان‌بند
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              اطلاعات زیر پایه‌ی اصلی تفکر و سناریونویسی Gemini به عنوان استراتژیست پیج شما هستند.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <span>در حال ذخیره...</span>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>ذخیره شد!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>ذخیره تمام تنظیمات</span>
              </>
            )}
          </button>
        </div>

        {/* Dedicated Account Notice */}
        {currentUser && (
          <div className="bg-slate-950/80 border border-purple-500/30 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <span className="font-bold text-white">
                  تنظیمات اختصاصی حساب کاربری @{currentUser.username} ({currentUser.display_name})
                </span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  تمام اطلاعات پیج، لحن، نمونه‌ها و تنظیمات زمان‌بندی به طور دائمی بر روی اکانت شما ذخیره شده و از اکانت‌های دیگر کاملاً مجزا است.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shrink-0">
              ذخیره‌سازی ابری فعال
            </span>
          </div>
        )}

        {/* Studio Theme / Appearance Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-bold">🎨</span>
              ظاهر و پوسته بصری استودیو (Theme Appearance)
            </h3>
            <span className="text-[11px] text-slate-400">
              پوسته فعال: {theme === 'light' ? '☀️ روشن مدرن' : theme === 'sunset' ? '🔮 غروب مخملی' : '🌙 تیره حرفه‌ای'}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            تم مورد نظر خود را برای راحتی چشم و محیط کار خلاقانه انتخاب کنید. تمام بخش‌ها، تقویم و ادیتور سناریو بلافاصله تطبیق می‌یابند:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            
            {/* Dark Theme Card */}
            <button
              type="button"
              onClick={() => onThemeChange?.('dark')}
              className={`p-4 rounded-2xl border text-right transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between h-36 ${
                theme === 'dark'
                  ? 'border-indigo-500 bg-slate-950/90 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/40'
                  : 'border-slate-800 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-950/80'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-indigo-400">
                  <Moon className="w-4 h-4" />
                </div>
                {theme === 'dark' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    فعال
                  </span>
                )}
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">🌙 تیره استودیویی (Dark Pro)</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  کنتراست عمیق، مشکی خالص و سرمه‌ای ملایم؛ ایده‌آل برای کار طولانی و شبانه.
                </p>
              </div>
              <div className="flex gap-1.5 pt-1">
                <span className="w-4 h-2 rounded bg-slate-950 border border-slate-700"></span>
                <span className="w-4 h-2 rounded bg-slate-800"></span>
                <span className="w-4 h-2 rounded bg-pink-500"></span>
              </div>
            </button>

            {/* Light Theme Card */}
            <button
              type="button"
              onClick={() => onThemeChange?.('light')}
              className={`p-4 rounded-2xl border text-right transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between h-36 ${
                theme === 'light'
                  ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/40'
                  : 'border-slate-800 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-950/80'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-600">
                  <Sun className="w-4 h-4" />
                </div>
                {theme === 'light' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40">
                    فعال
                  </span>
                )}
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">☀️ روشن مدرن (Crisp Light)</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  سفید و نقره‌ای مات، فونت‌های مشکی خوانا و شاداب، شفاف در نور روز.
                </p>
              </div>
              <div className="flex gap-1.5 pt-1">
                <span className="w-4 h-2 rounded bg-white border border-slate-300"></span>
                <span className="w-4 h-2 rounded bg-slate-100 border border-slate-300"></span>
                <span className="w-4 h-2 rounded bg-rose-500"></span>
              </div>
            </button>

            {/* Sunset Velvet Theme Card */}
            <button
              type="button"
              onClick={() => onThemeChange?.('sunset')}
              className={`p-4 rounded-2xl border text-right transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between h-36 ${
                theme === 'sunset'
                  ? 'border-purple-500 bg-purple-950/50 shadow-lg shadow-purple-500/15 ring-2 ring-purple-500/40'
                  : 'border-slate-800 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-950/80'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="w-8 h-8 rounded-xl bg-purple-900/80 border border-purple-600 flex items-center justify-center text-purple-300">
                  <Palette className="w-4 h-4" />
                </div>
                {theme === 'sunset' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    فعال
                  </span>
                )}
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">🔮 غروب مخملی (Sunset Velvet)</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  تم اختصاصی اینستاگرام با هاله‌های نئونی، آمتیست، رزگلد و عمق بنفش رویال.
                </p>
              </div>
              <div className="flex gap-1.5 pt-1">
                <span className="w-4 h-2 rounded bg-purple-950 border border-purple-700"></span>
                <span className="w-4 h-2 rounded bg-purple-800"></span>
                <span className="w-4 h-2 rounded bg-amber-400"></span>
              </div>
            </button>

          </div>
        </div>

        {/* Section 1: Page Basic Info (Fields 1, 2, 3, 4) */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-pink-500/20 text-pink-400 text-xs flex items-center justify-center font-bold">۱</span>
            اطلاعات هویتی و عمومی پیج
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Field 1: Instagram URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ۱. لینک یا آیدی اینستاگرام
              </label>
              <input
                type="text"
                placeholder="https://instagram.com/my_page یا @my_page"
                value={formData.instagram_url || ''}
                onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-pink-500 transition-all dir-ltr"
              />
              <p className="text-[10px] text-emerald-400 mt-1">
                🔒 توجه امنیتی: برای تولید یا ارسال محتوا هیچ نیازی به رمز عبور اینستاگرام نیست؛ فقط آیدی یا لینک پیج ثبت می‌شود.
              </p>
            </div>

            {/* Field 2: Page Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ۲. نام پیج (برند یا کسب‌وکار)
              </label>
              <input
                type="text"
                placeholder="مثلاً: آکادمی دیجیتال مارکتینگ"
                value={formData.page_name || ''}
                onChange={(e) => setFormData({ ...formData, page_name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-pink-500 transition-all"
              />
            </div>

          </div>

          {/* Field 3: Niche */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              ۳. حوزه فعالیت پیج (Niche)
            </label>
            <input
              type="text"
              placeholder="مثلاً: آموزش برنامه نویسی، تناسب اندام و رژیم غذایی، فروشگاه پوشاک، دکوراسیون، مالی و ارز دیجیتال..."
              value={formData.niche || ''}
              onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-pink-500 transition-all"
            />
          </div>

          {/* Field 4: Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              ۴. توضیح کوتاهی درباره کسب‌وکار، بایو یا خدمات پیج
            </label>
            <textarea
              rows={3}
              placeholder="توضیح دهید پیج شما دقیقاً چه خدماتی می‌دهد، چه نیازی را برطرف می‌کند و ارزش اصلی آن چیست..."
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-pink-500 transition-all leading-relaxed"
            />
          </div>

          {/* Strategic Analysis Assistant Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleAnalyzePage}
              disabled={isAnalyzing || !formData.niche}
              className="px-4 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all flex items-center gap-2"
            >
              <Compass className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : 'text-purple-400'}`} />
              <span>{isAnalyzing ? 'در حال تحلیل استراتژیک با جمنای...' : 'تحلیل هوشمند بایو و فرصت‌های پیج'}</span>
            </button>
          </div>

          {/* Analysis Result Box */}
          {analysisResult && (
            <div className="bg-purple-950/30 border border-purple-500/30 rounded-2xl p-5 space-y-3 text-xs text-purple-200">
              <div className="font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                تحلیل استراتژیک ایجنت بر اساس داده‌های ورودی پیج:
              </div>
              
              <div>
                <span className="text-purple-300 font-semibold block mb-1">نقاط قوت هویتی پیج:</span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                  {analysisResult.strengths?.map((s: string, idx: number) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-purple-300 font-semibold block mb-1">فرصت‌های محتوایی کمتر کار شده در این حوزه:</span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                  {analysisResult.content_opportunities?.map((o: string, idx: number) => (
                    <li key={idx}>{o}</li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-purple-300 font-semibold block mb-1">پیشنهاد بهبود بایو برای افزایش نرخ فالو:</span>
                <p className="bg-slate-950 p-2.5 rounded-lg border border-purple-500/20 text-white italic">
                  {analysisResult.suggested_bio_improvement}
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Section 2: Audience & Tone (Fields 5, 7) */}
        <div className="space-y-4 pt-6 border-t border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-pink-500/20 text-pink-400 text-xs flex items-center justify-center font-bold">۲</span>
            مخاطبان هدف و لحن برند
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Field 5: Target Audience */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ۵. مخاطبان هدف (پرسونا، سن، دغدغه‌ها)
              </label>
              <textarea
                rows={2}
                placeholder="مثلاً: دانشجویان، کارمندان و فریلنسرهای ۱۸ الی ۳۵ سال که به دنبال درآمد دلاری و ارتقای مهارت هستند..."
                value={formData.target_audience || ''}
                onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-pink-500 transition-all leading-relaxed"
              />
            </div>

            {/* Field 7: Content Tone */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ۷. لحن محتوا (Content Tone)
              </label>
              <input
                type="text"
                placeholder="مثلاً: دوستانه و صمیمی، پرانرژی و شوخ، علمی و تخصصی، آرام و انگیزشی..."
                value={formData.content_tone || ''}
                onChange={(e) => setFormData({ ...formData, content_tone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-pink-500 transition-all"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {['صمیمی و دوستانه', 'تخصصی و موثق', 'انگیزشی و پرانرژی', 'طنز و چالش‌محور', 'گام‌به‌گام و آموزشی'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setFormData({ ...formData, content_tone: preset })}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-md"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Section 3: Content Preference & Goals (Fields 6, 10) */}
        <div className="space-y-4 pt-6 border-t border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-pink-500/20 text-pink-400 text-xs flex items-center justify-center font-bold">۳</span>
            فرمت دلخواه محتوا و اهداف پیج
          </h3>

          {/* Field 6: Preferred Content Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              ۶. نوع محتوای مورد علاقه (دستور به هوش مصنوعی)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'reel_priority', label: '🎬 من بیشتر Reel می‌خواهم', desc: 'تمرکز بالا بر ریلزهای پربازدید و الگوریتمی' },
                { id: 'story_priority', label: '📱 هر روز ایده‌ای برای Story بده', desc: 'استوری‌های تعاملی چندمرحله‌ای برای فروش و ارتباط' },
                { id: 'smart_mix', label: '🧠 انتخاب هوشمندانه (پیشنهادی)', desc: 'انتخاب بهترین فرمت بین Reel, Carousel و Story متناسب با هدف' },
              ].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setFormData({ ...formData, preferred_content_type: opt.id as PreferredContentTypeSetting })}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    formData.preferred_content_type === opt.id
                      ? 'bg-pink-950/40 border-pink-500 text-white shadow-md shadow-pink-500/10'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs mb-1">{opt.label}</div>
                  <div className="text-[11px] text-slate-400 leading-normal">{opt.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Field 10: Page Goals */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              ۱۰. اهداف پیج (حداقل یک یا چند مورد را انتخاب کنید)
            </label>
            <div className="flex flex-wrap gap-2">
              {allGoals.map((g) => {
                const isSelected = (formData.page_goals || []).includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => handleGoalToggle(g)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-500/20'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 inline ml-1.5" />}
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Section 4: Daily Schedule (Field 8) & Samples (Field 9) */}
        <div className="space-y-4 pt-6 border-t border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-pink-500/20 text-pink-400 text-xs flex items-center justify-center font-bold">۴</span>
            زمان‌بندی روزانه و نمونه محتواهای قبلی
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Field 8: Daily Schedule */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-pink-400" />
                  ۸. ساعت دریافت ایده روزانه
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">ارسال خودکار:</span>
                  <input
                    type="checkbox"
                    checked={formData.is_scheduler_active ?? true}
                    onChange={(e) => setFormData({ ...formData, is_scheduler_active: e.target.checked })}
                    className="w-4 h-4 accent-pink-500 rounded cursor-pointer"
                  />
                </div>
              </div>

              <input
                type="time"
                value={formData.schedule_time || '11:00'}
                onChange={(e) => setFormData({ ...formData, schedule_time: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white font-mono outline-none focus:border-pink-500 dir-ltr text-center"
              />

              {/* Full Daily Autopilot Toggles */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-200">
                  <input
                    type="checkbox"
                    checked={formData.auto_generate_media !== false}
                    onChange={(e) => setFormData({ ...formData, auto_generate_media: e.target.checked })}
                    className="w-4 h-4 mt-0.5 accent-pink-500 rounded cursor-pointer"
                  />
                  <span>
                    <strong className="block text-white">تولید خودکار رسانه (پیش‌فرض فعال)</strong>
                    <span className="text-[11px] text-slate-400">ساخت اتوماتیک پوستر، ۵ اسلاید کاروسل، ۳ فریم استوری و ویدیو MP4 ریلز روی سرور</span>
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-200">
                  <input
                    type="checkbox"
                    checked={formData.auto_publish_daily !== false}
                    onChange={(e) => setFormData({ ...formData, auto_publish_daily: e.target.checked })}
                    className="w-4 h-4 mt-0.5 accent-emerald-500 rounded cursor-pointer"
                  />
                  <span>
                    <strong className="block text-white">انتشار خودکار در اینستاگرام (پیش‌فرض فعال)</strong>
                    <span className="text-[11px] text-slate-400">
                      {(formData.instagram_access_token && formData.instagram_account_id) || formData.auto_publish_webhook || formData.webhook_url
                        ? '✅ کانال انتشار (Meta API / وب‌هوک) متصل است و هر روز خودکار پست می‌کند.'
                        : '⏳ برای ارسال واقعی روی پیج، توکن Meta API یا وب‌هوک را در بخش ۶ زیر وارد کنید.'}
                    </span>
                  </span>
                </label>
              </div>
            </div>

            {/* Field 9: Previous Samples */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <label className="block text-xs font-semibold text-slate-200">
                ۹. چند نمونه از محتواهای قبلی پیج (جهت یادگیری سبک)
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="عنوان یا موضوع یک پست قبلی..."
                  value={newSample}
                  onChange={(e) => setNewSample(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSample(); } }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-600 outline-none focus:border-pink-500"
                />
                <button
                  type="button"
                  onClick={handleAddSample}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  افزودن
                </button>
              </div>

              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {(formData.previous_samples || []).map((sample, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-slate-900 p-2 rounded-lg text-slate-300">
                    <span className="truncate">{sample}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSample(idx)}
                      className="text-slate-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Section 5: Integrations & Notifications (Telegram & Webhook) */}
        <div className="space-y-4 pt-6 border-t border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-sky-400" />
              اتصال به تلگرام و وب‌هوک (اختیاری)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              در صورت تمایل، هر روز صبح ساعت مشخص‌شده ایده مستقیماً به تلگرام یا اتوماسیون شما فرستاده می‌شود.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Telegram Bot Token
              </label>
              <input
                type="text"
                placeholder="123456789:ABCdefGhIJKlmNoPQRstuVWXyz..."
                value={formData.telegram_bot_token || ''}
                onChange={(e) => setFormData({ ...formData, telegram_bot_token: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-700 outline-none focus:border-sky-500 dir-ltr font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Telegram Chat ID
              </label>
              <input
                type="text"
                placeholder="مثلاً: 987654321 یا @mychannel"
                value={formData.telegram_chat_id || ''}
                onChange={(e) => setFormData({ ...formData, telegram_chat_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-700 outline-none focus:border-sky-500 dir-ltr font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 6: Direct Instagram Auto-Publishing API & Webhook */}
        <div className="space-y-4 pt-6 border-t border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-pink-500/20 text-pink-400 text-xs flex items-center justify-center font-bold">🚀</span>
              تنظیمات اتصال مستقیم به API انتشار اینستاگرام (Instagram Graph API)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              سیستم به صورت خودکار عکس و کپشن را می‌سازد. در صورت تمایل به انتشار مستقیم و تمام‌اتوماتیک در پیج، می‌توانید اطلاعات زیر را وارد کنید یا از وب‌هوک استفاده نمایید:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Instagram Business Account ID (شناسه اکانت تجاری)
              </label>
              <input
                type="text"
                placeholder="مثلاً: 17841400000000000"
                value={formData.instagram_account_id || ''}
                onChange={(e) => setFormData({ ...formData, instagram_account_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-700 outline-none focus:border-pink-500 dir-ltr font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Meta Graph API Access Token (توکن دسترسی فیس‌بوک/اینستاگرام)
              </label>
              <input
                type="password"
                placeholder="EAA..."
                value={formData.instagram_access_token || ''}
                onChange={(e) => setFormData({ ...formData, instagram_access_token: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-700 outline-none focus:border-pink-500 dir-ltr font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Webhook انتشار خودکار (اتصال به Make / Zapier / n8n / Bot)
            </label>
            <input
              type="text"
              placeholder="https://hook.eu1.make.com/..."
              value={formData.auto_publish_webhook || ''}
              onChange={(e) => setFormData({ ...formData, auto_publish_webhook: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-700 outline-none focus:border-pink-500 dir-ltr font-mono"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              💡 با زدن دکمه انتشار، پوستر و کپشن به این وب‌هوک نیز فرستاده می‌شود تا در صورت استفاده از ابزارهای اتوماسیون، فوراً در پیج شما درج گردد.
            </p>
          </div>
        </div>

        {/* Section 7: NotebookLM Two-Way Video Pipeline */}
        {(() => {
          const nlm: NotebookLMSettings = formData.notebooklm || {
            enabled: false,
            connection_mode: 'webhook_bridge',
            bridge_url: '',
            bridge_api_key: '',
            notebook_id: '',
            notebook_url: 'https://notebooklm.google.com/',
            video_style: 'explainer',
            video_format: 'brief',
            output_language: 'fa',
            auto_dispatch_daily: false,
            auto_publish_on_return: false,
            callback_secret: '',
          };

          const updateNlm = (patch: Partial<NotebookLMSettings>) => {
            setFormData({
              ...formData,
              notebooklm: { ...nlm, ...patch },
            });
          };

          const callbackEndpoint = `${window.location.origin}/api/notebooklm/callback?secret=${encodeURIComponent(nlm.callback_secret || '')}`;

          return (
            <div className="space-y-4 pt-6 border-t border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold">
                      <BookOpen className="w-3.5 h-3.5" />
                    </span>
                    اتصال دوطرفه به Google NotebookLM (ارسال دیتا، ساخت ویدیو و بازگشت خودکار)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    دیتای سناریوی روزانه به NotebookLM ارسال می‌شود، ویدیو ساخته شده و پس از بازگشت به اینجا مستقیماً به اینستاگرام (Reels) ارسال می‌گردد.
                  </p>
                </div>

                <label className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={Boolean(nlm.enabled)}
                    onChange={(e) => updateNlm({ enabled: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-emerald-300">
                    {nlm.enabled ? 'خط لوله فعال است' : 'فعال‌سازی NotebookLM'}
                  </span>
                </label>
              </div>

              <div className="bg-slate-950/70 border border-emerald-500/20 rounded-2xl p-4 text-xs text-slate-300 space-y-2 leading-relaxed">
                <div className="flex items-center gap-2 font-bold text-emerald-300">
                  <Workflow className="w-4 h-4" />
                  <span>نحوه کارکرد اتصال واقعی با NotebookLM:</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  از آنجا که نسخه رایگان/شخصی NotebookLM هنوز API عمومی مستقیم گوگل ندارد (و API رسمی فقط برای اکانت‌های Enterprise گوگل‌کلاد است)، این سیستم از دو روش استاندارد پشتیبانی می‌کند:
                </p>
                <ul className="text-[11px] text-slate-300 list-disc list-inside space-y-1">
                  <li><strong>حالت تمام‌اتوماتیک روزانه:</strong> اتصال به پل REST / n8n / UseAPI یا سرور شخصی NotebookLM (`notebooklm-rest-api`)؛ هر روز دیتا ارسال و ویدیوی ساخته‌شده از طریق لینک Callback به سامانه برگشته و در اینستاگرام منتشر می‌شود.</li>
                  <li><strong>حالت سریع استودیو (بدون نیاز به سرور واسط):</strong> با یک کلیک سورس و پرامپت ویدیو آماده کپی در NotebookLM می‌شود و فایل MP4 خروجی را مستقیماً در همین بخش آپلود و منتشر می‌کنید.</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    روش اتصال به NotebookLM
                  </label>
                  <select
                    value={nlm.connection_mode}
                    onChange={(e) => updateNlm({ connection_mode: e.target.value as NotebookLMSettings['connection_mode'] })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  >
                    <option value="webhook_bridge">وب‌هوک پل اتوماسیون (n8n / Make)</option>
                    <option value="rest_api">سرور REST API (notebooklm-rest-api / UseAPI)</option>
                    <option value="enterprise_gcp">Google Cloud Enterprise Notebook API</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    سبک ویدیوی NotebookLM (Video Style)
                  </label>
                  <select
                    value={nlm.video_style || 'explainer'}
                    onChange={(e) => updateNlm({ video_style: e.target.value as NotebookLMSettings['video_style'] })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  >
                    <option value="explainer">توضیحی مدرن (Explainer)</option>
                    <option value="whiteboard">وایت‌برد آموزشی (Whiteboard)</option>
                    <option value="watercolor">هنری آبرنگی (Watercolor)</option>
                    <option value="retro_print">رترو و چاپی (Retro Print)</option>
                    <option value="anime">انیمه‌ای پویا (Anime)</option>
                    <option value="heritage">مستند و کلاسیک (Heritage)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    فرمت و عمق ویدیو
                  </label>
                  <select
                    value={nlm.video_format || 'brief'}
                    onChange={(e) => updateNlm({ video_format: e.target.value as NotebookLMSettings['video_format'] })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  >
                    <option value="brief">خلاصه سریع و ریلزپسند (Brief)</option>
                    <option value="explainer">آموزشی کامل (Explainer)</option>
                    <option value="deep_dive">تحلیل عمیق (Deep Dive)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    آدرس Endpoint پل NotebookLM (Bridge URL)
                  </label>
                  <input
                    type="text"
                    placeholder="https://n8n.yourdomain.com/webhook/notebooklm-video"
                    value={nlm.bridge_url || ''}
                    onChange={(e) => updateNlm({ bridge_url: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-700 outline-none focus:border-emerald-500 dir-ltr font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    کلید دسترسی پل (Bearer / API Key اختیاری)
                  </label>
                  <input
                    type="password"
                    placeholder="nlm_live_..."
                    value={nlm.bridge_api_key || ''}
                    onChange={(e) => updateNlm({ bridge_api_key: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-700 outline-none focus:border-emerald-500 dir-ltr font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    شناسه نوت‌بوک هدف (Notebook ID)
                  </label>
                  <input
                    type="text"
                    placeholder="مثلاً: nb_123456abcdef"
                    value={nlm.notebook_id || ''}
                    onChange={(e) => updateNlm({ notebook_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-700 outline-none focus:border-emerald-500 dir-ltr font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    لینک مستقیم نوت‌بوک در NotebookLM
                  </label>
                  <input
                    type="text"
                    placeholder="https://notebooklm.google.com/notebook/..."
                    value={nlm.notebook_url || ''}
                    onChange={(e) => updateNlm({ notebook_url: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-700 outline-none focus:border-emerald-500 dir-ltr font-mono"
                  />
                </div>
              </div>

              {/* Daily Automation Switches */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-emerald-500/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={Boolean(nlm.auto_dispatch_daily)}
                    onChange={(e) => updateNlm({ auto_dispatch_daily: e.target.checked })}
                    className="w-4 h-4 mt-0.5 accent-emerald-500 rounded cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      ۱. ارسال خودکار روزانه دیتا به NotebookLM
                    </span>
                    <span className="text-[11px] text-slate-400">
                      هر روز رأس ساعت زمان‌بند ({formData.schedule_time || '11:00'}) پس از تولید سناریو، سورس و پرامپت ویدیو خودکار به NotebookLM ارسال شود.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-pink-500/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={Boolean(nlm.auto_publish_on_return)}
                    onChange={(e) => updateNlm({ auto_publish_on_return: e.target.checked })}
                    className="w-4 h-4 mt-0.5 accent-pink-500 rounded cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      ۲. انتشار خودکار در اینستاگرام به محض بازگشت ویدیو
                    </span>
                    <span className="text-[11px] text-slate-400">
                      وقتی ویدیوی ساخته‌شده از NotebookLM به Callback برگشت، خودکار به عنوان ریلز (Meta Reels API / وب‌هوک) منتشر شود.
                    </span>
                  </div>
                </label>
              </div>

              {/* Callback URL for Returning Videos */}
              {nlm.callback_secret && (
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5" />
                      آدرس Callback امن برای بازگشت ویدیو از NotebookLM به این سامانه:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(callbackEndpoint);
                        setCopiedCallback(true);
                        setTimeout(() => setCopiedCallback(false), 2000);
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedCallback ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCallback ? 'کپی شد!' : 'کپی لینک Callback'}</span>
                    </button>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 bg-slate-900 p-2 rounded-lg border border-slate-800 dir-ltr truncate">
                    {callbackEndpoint}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    پل اتوماسیون (n8n یا اسکریپت پایتون NotebookLM) پس از ساخت ویدیو، یک POST با بدنه <code className="text-slate-300">{`{"idea_id": "...", "video_url": "https://..."}`}</code> به این آدرس می‌فرستد.
                  </p>
                </div>
              )}
            </div>
          );
        })()}

        {/* Bottom Save Bar */}
        <div className="pt-6 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transition-all"
          >
            {isSaving ? 'در حال ذخیره...' : saveSuccess ? 'ذخیره شد! ✨' : 'ذخیره تغییرات پیج'}
          </button>
        </div>

      </form>

    </div>
  );
};
