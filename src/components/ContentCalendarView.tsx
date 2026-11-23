import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, Palette, Sparkles, Save, Check, RefreshCw, 
  Film, Layers, Tv, FileText, Video, Download, ArrowRight, Lightbulb, 
  HelpCircle, Eye, CheckCircle2, ChevronRight, Sliders, Smartphone,
  Zap, Copy, Shield, Bookmark, Flame, Target, MessageSquare
} from 'lucide-react';
import type { 
  InstagramProfile, 
  CalendarDayPlan, 
  PosterDesignSettings, 
  ContentType, 
  UserPublicInfo 
} from '../types.ts';

interface ContentCalendarViewProps {
  profile: InstagramProfile | null;
  onUpdateProfile: (updated: Partial<InstagramProfile>) => Promise<void>;
  onGenerateForDay?: (dayOfWeek: string) => void;
  isGenerating?: boolean;
  currentUser?: UserPublicInfo | null;
}

const DEFAULT_DAYS: CalendarDayPlan[] = [
  { day_of_week: 'شنبه', topic: 'آموزش تخصصی و ترفندهای کاربردی', content_type: 'Reel', goal: 'جذب فالوور جدید', details: 'هوک میخکوب‌کننده ۳ ثانیه اول و آموزش سریع یک ابزار' },
  { day_of_week: 'یکشنبه', topic: 'معرفی ابزارهای هوش مصنوعی و سایت‌های برتر', content_type: 'Carousel', goal: 'سیو و شیر حداکثری', details: 'پست اسلایدی ورق‌زدنی با کاور کنجکاوکننده' },
  { day_of_week: 'دوشنبه', topic: 'پرسش و پاسخ، حل چالش مخاطب و سناریوی استوری', content_type: 'Story', goal: 'افزایش تعامل', details: 'باکس سوال، نظرسنجی و پاسخ به دغدغه پرتکرار' },
  { day_of_week: 'سه‌شنبه', topic: 'بررسی پرونده، اشتباهات رایج یا مقایسه قبل و بعد', content_type: 'Reel', goal: 'برندینگ و اعتبار', details: 'داستان‌سرایی و انتقال تجربه' },
  { day_of_week: 'چهارشنبه', topic: 'معرفی خدمات یا پیشنهاد ویژه و فروش', content_type: 'Post', goal: 'فروش و جذب مشتری', details: 'کال تو اکشن مستقیم دایرکت یا لینک بیو' },
  { day_of_week: 'پنج‌شنبه', topic: 'چک‌لیست هفتگی، خلاصه نکات و کوییز', content_type: 'Carousel', goal: 'افزایش تعامل', details: 'اسلایدهای منظم و چک‌لیستی که حتماً ذخیره شود' },
  { day_of_week: 'جمعه', topic: 'پشت صحنه، داستان برند یا لایف‌استایل کاری', content_type: 'Story', goal: 'وفاداری و ارتباط صمیمی', details: 'فضای غیررسمی و ارتباط انسانی با مخاطب' },
];

const PRESET_STRATEGIES = [
  {
    name: '🚀 رشد انفجاری پیج‌های تکنولوژی و برنامه‌نویسی',
    desc: 'ترکیب ریلزهای ترفند روزانه + کاروسل مقایسه‌ای ابزارها',
    schedule: [
      { day_of_week: 'شنبه', topic: 'ترفند کدنویسی و ترفندهای سرعت عمل در نرم‌افزارها', content_type: 'Reel' as ContentType, goal: 'جذب فالوور جدید', details: 'شروع با هوک: اشتباهی که اکثر دولوپرها انجام می‌دهند' },
      { day_of_week: 'یکشنبه', topic: 'معرفی ۳ ابزار هوش مصنوعی کاربردی جایگزین ابزارهای گران', content_type: 'Carousel' as ContentType, goal: 'سیو و اشتراک‌گذاری بالا', details: 'اسلایدهای شفاف همراه با آیکون و لینک' },
      { day_of_week: 'دوشنبه', topic: 'تحلیل یک باگ یا چالش فنی واقعی و راه‌حل آن', content_type: 'Story' as ContentType, goal: 'افزایش تعامل', details: 'استیکر نظرسنجی درباره تجربه مشابه مخاطبان' },
      { day_of_week: 'سه‌شنبه', topic: 'بررسی فریمورک یا تکنولوژی جدید و مقایسه پرفورمنس', content_type: 'Reel' as ContentType, goal: 'برندینگ و مرجعیت', details: 'ریتم سریع و نمایش اسکرین کدها' },
      { day_of_week: 'چهارشنبه', topic: 'معرفی دوره‌های آموزشی، خدمات توسعه یا پکیج مشاوره‌ای', content_type: 'Post' as ContentType, goal: 'فروش و لید', details: 'کال تو اکشن برای ارسال پیام در دایرکت' },
      { day_of_week: 'پنج‌شنبه', topic: 'چک‌لیست قدم‌به‌قدم امنیت و بهینه‌سازی پروژه', content_type: 'Carousel' as ContentType, goal: 'سیو و ذخیره', details: 'اسلاید پایانی حاوی جمع‌بندی جامع' },
      { day_of_week: 'جمعه', topic: 'ستاپ کاری، گجت‌های روی میز و برنامه‌ریزی هفته کاری جدید', content_type: 'Story' as ContentType, goal: 'ارتباط صمیمی', details: 'استوری تعاملی با باکس پرسش و پاسخ' },
    ]
  },
  {
    name: '🛍️ فروشگاهی و جذب مشتری مستقیم',
    desc: 'تمرکز بر اعتمادسازی، نمایش رضایت مشتری و فروش هدفمند',
    schedule: [
      { day_of_week: 'شنبه', topic: 'حل یک مشکل روزمره مشتری با معرفی کاربرد محصول', content_type: 'Reel' as ContentType, goal: 'جذب فالوور و مشتری', details: 'نمایش قبل و بعد از استفاده از محصول' },
      { day_of_week: 'یکشنبه', topic: 'راهنمای جامع خرید و مقایسه مدل‌ها برای جلوگیری از اشتباه', content_type: 'Carousel' as ContentType, goal: 'سیو و آموزش خرید', details: 'نکات تشخیص کیفیت و اصالت' },
      { day_of_week: 'دوشنبه', topic: 'پاسخ به پرتکرارترین سوالات مشتریان و راهنمای سایز یا ارسال', content_type: 'Story' as ContentType, goal: 'اعتمادسازی', details: 'استیکر کوییز و تست اطلاعات' },
      { day_of_week: 'سه‌شنبه', topic: 'آنباکسینگ جزئیات، کیفیت بسته‌بندی و تست دوام', content_type: 'Reel' as ContentType, goal: 'جلب اعتماد', details: 'صدای ASMR و فیلم‌برداری کلوزآپ' },
      { day_of_week: 'چهارشنبه', topic: 'آفر ویژه هفتگی، کد تخفیف اختصاصی یا جشنواره فروش', content_type: 'Post' as ContentType, goal: 'فروش مستقیم', details: 'مهلت محدود و کال تو اکشن ثبت سفارش' },
      { day_of_week: 'پنج‌شنبه', topic: 'نمایش رضایت مشتریان، پیام‌های پرمهر و بسته‌های ارسالی', content_type: 'Carousel' as ContentType, goal: 'اثبات اجتماعی (Social Proof)', details: 'اسکرین‌شات پیام‌ها و رسیدهای پستی' },
      { day_of_week: 'جمعه', topic: 'پشت صحنه بسته‌بندی، تیم فروش و حال و هوای انبار', content_type: 'Story' as ContentType, goal: 'وفاداری به برند', details: 'پرسش درباره سلیقه مخاطب برای محصولات هفته بعد' },
    ]
  }
];

const PRESET_POSTER_PROMPTS = [
  {
    title: 'سایبر نئونی و های‌تک (Cyber Neon)',
    prompt: 'پوستر مدرن های‌تک با پس‌زمینه دارک بلک مات، افکت‌های نورانی نئونی بنفش و فیروزه‌ای، تایپوگرافی بولد فارسی و المان‌های شیشه‌ای براق',
    primary: '#ec4899',
    secondary: '#8b5cf6',
    theme: 'cyber' as const
  },
  {
    title: 'مینیمال شیشه‌ای اپل استایل (Modern Glass)',
    prompt: 'پوستر فوق‌العاده تمیز و مینیمال با سبک Glassmorphism، حاشیه‌های نرم، تایپوگرافی خوانا و مدرن فارسی، کنتراست عالی و فضاهای خالی متعادل',
    primary: '#3b82f6',
    secondary: '#06b6d4',
    theme: 'modern_glass' as const
  },
  {
    title: 'لوکس مشکی و طلایی (Luxury Gold)',
    prompt: 'پوستر بسیار لوکس با تم تاریک سرمه‌ای/مشکی متالیک، خطوط و کادربندی‌های طلایی درخشان، فونت باوقار و حس پرستیژ و VIP',
    primary: '#f59e0b',
    secondary: '#d97706',
    theme: 'luxury' as const
  },
  {
    title: 'غروب رز و مدرن (Sunset Rose)',
    prompt: 'پوستر پرانرژی با گرادیان‌های لطیف صورتی، نارنجی و سرخ‌آبی، نور ملایم، حس زنده و جوان‌پسند همراه با آیکون‌های وکتور تمیز',
    primary: '#f43f5e',
    secondary: '#fb923c',
    theme: 'sunset' as const
  }
];

export const ContentCalendarView: React.FC<ContentCalendarViewProps> = ({
  profile,
  onUpdateProfile,
  onGenerateForDay,
  isGenerating,
  currentUser,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'calendar' | 'poster'>('calendar');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);

  // Calendar State
  const [isCalendarActive, setIsCalendarActive] = useState<boolean>(
    profile?.custom_calendar_active ?? true
  );
  const [calendarSchedule, setCalendarSchedule] = useState<CalendarDayPlan[]>(
    profile?.calendar_schedule && profile.calendar_schedule.length > 0
      ? profile.calendar_schedule
      : DEFAULT_DAYS
  );
  const [calendarNotes, setCalendarNotes] = useState<string>(
    profile?.custom_calendar_notes || ''
  );

  // Poster Design Prompt State
  const [posterPrompt, setPosterPrompt] = useState<string>(
    profile?.poster_design?.custom_prompt || 
    'پوستر مینیمال مدرن با پس‌زمینه دارک، هایلایت‌های نئونی، تایپوگرافی درشت و بولد فارسی، حاشیه شیشه‌ای و المان سه‌بعدی مرتبط با موضوع'
  );
  const [primaryColor, setPrimaryColor] = useState<string>(
    profile?.poster_design?.primary_color || '#ec4899'
  );
  const [secondaryColor, setSecondaryColor] = useState<string>(
    profile?.poster_design?.secondary_color || '#8b5cf6'
  );
  const [styleTheme, setStyleTheme] = useState<any>(
    profile?.poster_design?.style_theme || 'cyber'
  );
  const [fontSizeScale, setFontSizeScale] = useState<'compact' | 'normal' | 'impact'>(
    profile?.poster_design?.font_size_scale || 'normal'
  );
  const [showPageId, setShowPageId] = useState<boolean>(
    profile?.poster_design?.show_page_id ?? true
  );
  const [additionalNotes, setAdditionalNotes] = useState<string>(
    profile?.poster_design?.additional_notes || ''
  );

  // Persian day calculation
  const persianDaysMap = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
  const todayPersian = persianDaysMap[new Date().getDay()];

  // Day navigator state
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(() => {
    const idx = (profile?.calendar_schedule || DEFAULT_DAYS).findIndex(d => d.day_of_week === todayPersian);
    return idx >= 0 ? idx : 0;
  });
  const [viewMode, setViewMode] = useState<'focused' | 'all'>('focused');

  // Update a specific day in the calendar
  const handleUpdateDay = (index: number, updates: Partial<CalendarDayPlan>) => {
    const updated = [...calendarSchedule];
    updated[index] = { ...updated[index], ...updates };
    setCalendarSchedule(updated);
  };

  // Save all settings to profile
  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    const posterDesign: PosterDesignSettings = {
      custom_prompt: posterPrompt,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      style_theme: styleTheme,
      font_size_scale: fontSizeScale,
      show_page_id: showPageId,
      additional_notes: additionalNotes,
    };

    try {
      await onUpdateProfile({
        custom_calendar_active: isCalendarActive,
        calendar_schedule: calendarSchedule,
        custom_calendar_notes: calendarNotes,
        poster_design: posterDesign,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save calendar & poster settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Download complete source code
  const handleDownloadFullProject = () => {
    setDownloadingZip(true);
    const link = document.createElement('a');
    link.href = '/api/project/download-source';
    link.download = 'instagram-ai-studio-full-source.zip';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => setDownloadingZip(false), 4000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto" dir="rtl">
      
      {/* Top Banner & Fast Actions */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/25">
                <CalendarIcon className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <span>تقویم محتوایی اختصاصی و استودیو طراحی پوستر</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  برنامه‌ریزی دقیق روزهای هفته + دستورالعمل و پرامپت اختصاصی برای هدایت هوش مصنوعی در تولید پوسترها
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href="/n8n-instagram-ai-studio.json"
              download="n8n-instagram-ai-studio.json"
              className="px-3.5 py-2.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 hover:text-white border border-indigo-700/50 text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer"
              title="دانلود فایل گردش‌کار آماده n8n برای اتوماسیون کامل تقویم اینستاگرام"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              <span>فایل n8n (.JSON)</span>
            </a>

            <button
              type="button"
              onClick={handleDownloadFullProject}
              disabled={downloadingZip}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
              title="دانلود فایل فشرده سورس کامل فرانت‌اند و بک‌اند پروژه"
            >
              <Download className="w-4 h-4 text-sky-400" />
              <span>{downloadingZip ? 'در حال آماده‌سازی ZIP...' : '📥 دانلود سورس‌کد (.ZIP)'}</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>در حال ذخیره...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>تنظیمات ذخیره شد!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>ذخیره تقویم و استایل پوستر</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status Strip: Today's Focus & Active Switch */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold text-xs">
                🗓️
              </div>
              <div>
                <span className="text-[11px] text-slate-400">امروز در تقویم:</span>
                <div className="text-xs font-black text-white">{todayPersian}</div>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20 text-[10.5px] font-bold">
              {calendarSchedule.find(p => p.day_of_week === todayPersian)?.content_type || 'Reel'}
            </span>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                🎨
              </div>
              <div>
                <span className="text-[11px] text-slate-400">سبک پوستر فعال:</span>
                <div className="text-xs font-black text-white">
                  {styleTheme === 'cyber' ? 'سایبر نئونی' :
                   styleTheme === 'modern_glass' ? 'شیشه‌ای مدرن' :
                   styleTheme === 'luxury' ? 'لوکس طلایی' : 'غروب رز'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: primaryColor }} />
              <span className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: secondaryColor }} />
            </div>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                ⚡
              </div>
              <div>
                <span className="text-[11px] text-slate-400">پیروی هوش مصنوعی:</span>
                <div className="text-xs font-bold text-emerald-400">
                  {isCalendarActive ? 'اجرای دقیق تقویم فعال است' : 'ایده‌پردازی آزاد'}
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isCalendarActive}
                onChange={(e) => setIsCalendarActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-950 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveSubTab('calendar')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'calendar'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarIcon className="w-4 h-4 text-pink-400" />
            <span>۱. جدول تقویم محتوایی هفتگی (شنبه تا جمعه)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('poster')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'poster'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-4 h-4 text-purple-400" />
            <span>۲. پرامپت اختصاصی و استودیو طراحی پوستر</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: CONTENT CALENDAR */}
      {activeSubTab === 'calendar' && (
        <div className="space-y-6">
          
          {/* Quick Preset Templates */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                الگوهای آماده استراتژی تقویم محتوا (۱ کلیک بارگذاری):
              </span>
              <span className="text-[11px] text-slate-400">
                می‌توانید هر کدام را انتخاب و سپس متن‌ها را ویرایش کنید
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PRESET_STRATEGIES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setCalendarSchedule(preset.schedule);
                    setIsCalendarActive(true);
                  }}
                  className="p-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-pink-500/40 text-right transition-all group cursor-pointer"
                >
                  <div className="text-xs font-black text-white group-hover:text-pink-300 transition-colors">
                    {preset.name}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {preset.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 7 Days Weekly Navigation & Editor */}
          <div className="space-y-4">
            
            {/* Week Days Strip Header & View Mode Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>برنامه‌ریزی روزهای هفته:</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  هوش مصنوعی در هر روز بر اساس برنامه همان روز، سناریو، کپشن و پوستر اختصاصی تولید می‌کند.
                </p>
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setViewMode('focused')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    viewMode === 'focused'
                      ? 'bg-slate-800 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  نمایش روز انتخابی (خلوت و متمرکز)
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('all')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    viewMode === 'all'
                      ? 'bg-slate-800 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  نمایش تمام ۷ روز
                </button>
              </div>
            </div>

            {/* Horizontal 7-Day Selector Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {calendarSchedule.map((dayPlan, idx) => {
                const isToday = dayPlan.day_of_week === todayPersian;
                const isSelected = selectedDayIdx === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedDayIdx(idx);
                      if (viewMode === 'all') setViewMode('focused');
                    }}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer relative flex flex-col items-center justify-between gap-1.5 ${
                      isSelected
                        ? 'bg-slate-800 border-pink-500/70 shadow-lg shadow-pink-500/10 ring-1 ring-pink-500/30'
                        : isToday
                        ? 'bg-slate-900/90 border-slate-700 hover:border-slate-600'
                        : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    {isToday && (
                      <span className="absolute top-1.5 left-2 text-[9px] font-bold text-pink-400 bg-pink-500/15 px-1.5 rounded-full">
                        امروز
                      </span>
                    )}
                    <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                      {dayPlan.day_of_week}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate max-w-full">
                      {dayPlan.content_type === 'Reel' ? '🎬 ریلز' :
                       dayPlan.content_type === 'Carousel' ? '📚 کاروسل' :
                       dayPlan.content_type === 'Story' ? '📱 استوری' :
                       dayPlan.content_type === 'Post' ? '🖼️ پست' : '📡 لایو'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* FOCUSED VIEW: Single Day Editor */}
            {viewMode === 'focused' && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
                
                {/* Day Header & Fast Navigation */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs ${
                      calendarSchedule[selectedDayIdx].day_of_week === todayPersian
                        ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                        : 'bg-slate-800 text-slate-200'
                    }`}>
                      {calendarSchedule[selectedDayIdx].day_of_week}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          برنامه روز {calendarSchedule[selectedDayIdx].day_of_week}
                        </span>
                        {calendarSchedule[selectedDayIdx].day_of_week === todayPersian && (
                          <span className="text-[10px] bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2 py-0.5 rounded-md font-semibold">
                            روز جاری تقویم
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        تنظیمات این روز را ویرایش کنید و در پایان روی دکمه ذخیره کلیک نمایید.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {onGenerateForDay && (
                      <button
                        type="button"
                        onClick={() => onGenerateForDay(calendarSchedule[selectedDayIdx].day_of_week)}
                        disabled={isGenerating}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-pink-600 hover:bg-pink-500 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-pink-600/20"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>تولید سناریوی {calendarSchedule[selectedDayIdx].day_of_week}</span>
                      </button>
                    )}

                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                      <button
                        type="button"
                        onClick={() => setSelectedDayIdx((selectedDayIdx + 6) % 7)}
                        className="px-2.5 py-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                        title="روز قبلی"
                      >
                        قبلی
                      </button>
                      <span className="text-slate-600">|</span>
                      <button
                        type="button"
                        onClick={() => setSelectedDayIdx((selectedDayIdx + 1) % 7)}
                        className="px-2.5 py-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                        title="روز بعدی"
                      >
                        بعدی
                      </button>
                    </div>
                  </div>
                </div>

                {/* Form Fields for Selected Day */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Format Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">فرمت محتوا:</label>
                    <select
                      value={calendarSchedule[selectedDayIdx].content_type}
                      onChange={(e) => handleUpdateDay(selectedDayIdx, { content_type: e.target.value as ContentType })}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-pink-500 text-white text-xs font-semibold rounded-xl px-3.5 py-2.5 outline-none transition-colors cursor-pointer"
                    >
                      <option value="Reel">🎬 ریلز (Reel)</option>
                      <option value="Carousel">📚 کاروسل ۵ اسلاید (Carousel)</option>
                      <option value="Story">📱 استوری ۹:۱۶ (Story)</option>
                      <option value="Post">🖼️ پست تک تصویر (Post)</option>
                      <option value="Live">📡 سناریوی لایو (Live)</option>
                    </select>
                  </div>

                  {/* Goal */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">هدف اصلی این روز:</label>
                    <input
                      type="text"
                      value={calendarSchedule[selectedDayIdx].goal}
                      onChange={(e) => handleUpdateDay(selectedDayIdx, { goal: e.target.value })}
                      placeholder="مثال: جذب فالوور جدید، تعامل، سیو..."
                      className="w-full bg-slate-950 border border-slate-800 focus:border-pink-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-colors"
                    />
                  </div>

                  {/* Specific Hook / Details */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">نکته خاص یا هوک پیشنهادی:</label>
                    <input
                      type="text"
                      value={calendarSchedule[selectedDayIdx].details || ''}
                      onChange={(e) => handleUpdateDay(selectedDayIdx, { details: e.target.value })}
                      placeholder="هوک جنجالی یا زاویه دید خاص..."
                      className="w-full bg-slate-950 border border-slate-800 focus:border-pink-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-colors"
                    />
                  </div>

                </div>

                {/* Topic / Niche description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">موضوع، حوزه یا سناریوی دقیق این روز:</label>
                  <textarea
                    rows={3}
                    value={calendarSchedule[selectedDayIdx].topic}
                    onChange={(e) => handleUpdateDay(selectedDayIdx, { topic: e.target.value })}
                    placeholder="توضیح کامل موضوع روز..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-pink-500 rounded-xl p-3.5 text-xs text-white placeholder-slate-600 outline-none transition-colors resize-none leading-relaxed"
                  />
                </div>

              </div>
            )}

            {/* ALL VIEW: Full 7 Days Table/Cards */}
            {viewMode === 'all' && (
              <div className="space-y-3">
                {calendarSchedule.map((dayPlan, idx) => {
                  const isToday = dayPlan.day_of_week === todayPersian;
                  return (
                    <div 
                      key={idx}
                      className={`p-4 rounded-2xl border transition-all ${
                        isToday 
                          ? 'bg-slate-900/90 border-pink-500/50 shadow-md ring-1 ring-pink-500/20' 
                          : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        
                        {/* Day Label & Badge */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center font-bold ${
                            isToday 
                              ? 'bg-pink-600 text-white shadow-sm' 
                              : 'bg-slate-950 text-slate-300 border border-slate-800'
                          }`}>
                            <span className="text-xs">{dayPlan.day_of_week}</span>
                            {isToday && <span className="text-[8px] text-pink-200">امروز</span>}
                          </div>

                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">فرمت:</label>
                            <select
                              value={dayPlan.content_type}
                              onChange={(e) => handleUpdateDay(idx, { content_type: e.target.value as ContentType })}
                              className="bg-slate-950 border border-slate-800 text-white text-xs font-semibold rounded-xl px-2.5 py-1.5 outline-none focus:border-pink-500 cursor-pointer"
                            >
                              <option value="Reel">🎬 ریلز (Reel)</option>
                              <option value="Carousel">📚 کاروسل</option>
                              <option value="Story">📱 استوری</option>
                              <option value="Post">🖼️ پست</option>
                              <option value="Live">📡 لایو</option>
                            </select>
                          </div>
                        </div>

                        {/* Topic */}
                        <div className="flex-1">
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">موضوع روز:</label>
                          <input
                            type="text"
                            value={dayPlan.topic}
                            onChange={(e) => handleUpdateDay(idx, { topic: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-pink-500 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-600 outline-none"
                          />
                        </div>

                        {/* Goal & Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:w-72 shrink-0">
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">هدف:</label>
                            <input
                              type="text"
                              value={dayPlan.goal}
                              onChange={(e) => handleUpdateDay(idx, { goal: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-pink-500 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">نکته/هوک:</label>
                            <input
                              type="text"
                              value={dayPlan.details || ''}
                              onChange={(e) => handleUpdateDay(idx, { details: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-pink-500 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                            />
                          </div>
                        </div>

                        {/* Fast Generate */}
                        {onGenerateForDay && (
                          <div className="shrink-0 flex items-center">
                            <button
                              type="button"
                              onClick={() => onGenerateForDay(dayPlan.day_of_week)}
                              disabled={isGenerating}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1 cursor-pointer"
                            >
                              <Sparkles className="w-3 h-3 text-pink-400" />
                              <span>تولید</span>
                            </button>
                          </div>
                        )}

                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

          {/* Overall Calendar Strategy Notes */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-3">
            <h4 className="text-xs font-black text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-pink-400" />
              <span>یادداشت‌ها و خط‌مشی کلی تقویم برای هوش مصنوعی (اختیاری):</span>
            </h4>
            <textarea
              rows={3}
              value={calendarNotes}
              onChange={(e) => setCalendarNotes(e.target.value)}
              placeholder="مثلاً: در تمام روزها روی حوزه فریلنسری و دلاری تمرکز کن، از اصطلاحات سنگین خودداری کن و همیشه کال تو اکشن شفاف به دایرکت بگذار..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-pink-500 rounded-2xl p-4 text-xs text-white placeholder-slate-600 outline-none leading-relaxed resize-none"
            />
          </div>

        </div>
      )}

      {/* SUB-TAB 2: POSTER DESIGN PROMPT STUDIO */}
      {activeSubTab === 'poster' && (
        <div className="space-y-6">
          
          {/* Preset Poster Prompts */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-purple-400" />
                سبک‌ها و پرامپت‌های گرافیکی آماده (۱ کلیک اعمال):
              </span>
              <span className="text-[11px] text-slate-400">
                پوسترها و کاورها بر اساس این استایل تولید و رندر خواهند شد
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {PRESET_POSTER_PROMPTS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPosterPrompt(item.prompt);
                    setPrimaryColor(item.primary);
                    setSecondaryColor(item.secondary);
                    setStyleTheme(item.theme);
                  }}
                  className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    styleTheme === item.theme
                      ? 'bg-slate-950 border-purple-500/80 ring-2 ring-purple-500/20 shadow-lg'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-black text-white">{item.title}</div>
                    <div className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.prompt}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                    <span className="text-[10px] text-slate-400">رنگ‌های برند:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: item.primary }} />
                      <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: item.secondary }} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Poster Prompt Studio Box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-6">
            
            {/* Custom Prompt Textarea */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-pink-400" />
                  <span>پرامپت اختصاصی و دستورالعمل طراحی گرافیکی پوستر برای هوش مصنوعی:</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  متن دلخواه خود را تایپ کنید تا پوسترها طبق سلیقه شما طراحی شوند
                </span>
              </div>
              <textarea
                rows={4}
                value={posterPrompt}
                onChange={(e) => setPosterPrompt(e.target.value)}
                placeholder="توضیح دهید پوسترها چطور باشند، مثلاً: زمینه سیاه مات با نور بنفش نئونی، تایپوگرافی درشت فارسی، کادر شیشه‌ای و المان سه‌بعدی..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-2xl p-4 text-xs text-white placeholder-slate-600 outline-none leading-relaxed resize-none font-medium"
              />
            </div>

            {/* Colors & Style Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-slate-800">
              
              {/* Primary Color */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">رنگ اصلی برند:</label>
                <div className="flex items-center gap-2.5 bg-slate-950 border border-slate-800 rounded-xl p-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-full bg-transparent text-xs text-white font-mono dir-ltr outline-none"
                  />
                </div>
              </div>

              {/* Secondary Color */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">رنگ دوم (مکمل):</label>
                <div className="flex items-center gap-2.5 bg-slate-950 border border-slate-800 rounded-xl p-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-full bg-transparent text-xs text-white font-mono dir-ltr outline-none"
                  />
                </div>
              </div>

              {/* Font Scale */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">مقیاس فونت و تیترها:</label>
                <select
                  value={fontSizeScale}
                  onChange={(e) => setFontSizeScale(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-xl p-2.5 outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="compact">فشرده و ظریف (Compact)</option>
                  <option value="normal">استاندارد اینستاگرامی (Normal)</option>
                  <option value="impact">درشت، بولد و با ضرب‌آهنگ بالا (Impact)</option>
                </select>
              </div>

              {/* Show Page ID on Poster */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">واترمارک آیدی پیج:</label>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
                  <span className="text-xs text-slate-300">درج آیدی روی پوستر</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showPageId}
                      onChange={(e) => setShowPageId(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-500"></div>
                  </label>
                </div>
              </div>

            </div>

            {/* Additional Custom Design Notes */}
            <div className="pt-2 border-t border-slate-800">
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                المان‌های اجباری طراحی (اختیاری):
              </label>
              <input
                type="text"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="مثلاً: درج برچسب «پست ویژه» در گوشه راست، کادر شیشه‌ای شفاف برای متن اصلی، خط‌کشی ظریف..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none"
              />
            </div>

            {/* Live Style Preview Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-400" />
                پیش‌نمایش استایل زنده پوستر با این رنگ‌ها و پرامپت:
              </span>

              <div 
                className="rounded-2xl p-6 sm:p-8 text-center relative overflow-hidden transition-all shadow-xl"
                style={{
                  background: `linear-gradient(135deg, #090d16 0%, #0f172a 50%, #1e1b4b 100%)`,
                  border: `2px solid ${primaryColor}40`,
                  boxShadow: `0 10px 30px ${primaryColor}15`
                }}
              >
                {/* Glowing light effect based on user color */}
                <div 
                  className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl opacity-40 pointer-events-none"
                  style={{ backgroundColor: primaryColor }}
                />
                <div 
                  className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full blur-3xl opacity-40 pointer-events-none"
                  style={{ backgroundColor: secondaryColor }}
                />

                {showPageId && (
                  <div className="inline-block px-3 py-1 rounded-full text-[11px] font-mono text-white/90 bg-white/10 backdrop-blur-md border border-white/15 mb-4">
                    {profile?.instagram_url ? profile.instagram_url.replace(/.*instagram\.com\/?|@/g, '@') : '@amin.devv'}
                  </div>
                )}

                <h3 
                  className={`font-black text-white mb-2 leading-tight ${
                    fontSizeScale === 'impact' ? 'text-xl sm:text-2xl' :
                    fontSizeScale === 'compact' ? 'text-sm sm:text-base' :
                    'text-base sm:text-lg'
                  }`}
                >
                  ۵ ابزار شگفت‌انگیز برای تولید محتوا و رشد پیج اینستاگرام
                </h3>

                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  کاور و پوسترهای پیج شما با این ترکیب رنگ، تایپوگرافی و المان‌های شیشه‌ای اختصاصی طراحی خواهند شد.
                </p>

                <div className="mt-5 flex items-center justify-center gap-2">
                  <span 
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-md"
                    style={{ backgroundColor: primaryColor }}
                  >
                    ورق بزنید
                  </span>
                  <span 
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white/90 bg-white/10 backdrop-blur-md border border-white/20"
                  >
                    اسلاید ۱ از ۵
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Floating Save Bar */}
      <div className="bg-slate-900/95 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-2xl backdrop-blur-md">
        <div className="text-xs text-slate-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>تغییرات شما به صورت دائم بر روی حساب کاربری پیج ذخیره می‌شود.</span>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? 'در حال ذخیره...' : saveSuccess ? 'ذخیره شد!' : 'ذخیره تغییرات'}
        </button>
      </div>

    </div>
  );
};
