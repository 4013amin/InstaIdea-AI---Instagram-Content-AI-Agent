import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { renderIdeaMediaAssets } from './server/mediaRenderer.ts';

const require = createRequire(import.meta.url);
const archiver = require('archiver');
import type { 
  InstagramProfile, 
  ContentIdea, 
  SchedulerLog, 
  User, 
  UserPublicInfo, 
  AdminStats,
  SubscriptionTier,
  UserRole,
  CalendarDayPlan,
  PosterDesignSettings,
  NotebookLMSettings
} from './src/types.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Ensure database directory exists
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const MEDIA_DIR = path.join(DATA_DIR, 'media');
if (!fs.existsSync(MEDIA_DIR)) {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
}
app.use('/media', express.static(MEDIA_DIR));

const DB_PATH = path.join(DATA_DIR, 'database.json');

interface DatabaseSchema {
  users: User[];
  ideas: ContentIdea[];
  logs: SchedulerLog[];
  last_scheduled_check: string;
  last_public_base_url?: string;
  profile?: InstagramProfile;
}

// Initial default profile template
const defaultProfile: InstagramProfile = {
  id: 'profile_default',
  instagram_url: 'https://instagram.com/digitech_academy',
  page_name: 'آکادمی دیجی‌تک (DigiTech)',
  niche: 'آموزش فناوری، ترفندهای موبایل و ابزارهای هوش مصنوعی',
  description: 'پیج آموزشی تخصصی برای آموزش کاربردی ابزارهای جدید AI، ترفندهای افزایش بازدهی و معرفی سایت‌های شگفت‌انگیز برای فریلنسرها و علاقه‌مندان به تکنولوژی.',
  target_audience: 'دانشجویان، فریلنسرها، طراحان و جوانان ۲۰ الی ۳۵ ساله علاقه‌مند به پیشرفت کاری و تکنولوژی',
  preferred_content_type: 'smart_mix',
  content_tone: 'دوستانه، پرانرژی، کاربردی و روان بدون اصطلاحات پیچیده خسته‌کننده',
  schedule_time: '11:00',
  is_scheduler_active: true,
  previous_samples: [
    'آموزش ساخت عکس تبلیغاتی با هوش مصنوعی در کمتر از ۶۰ ثانیه',
    '۳ اکستنشن مرورگر که هر فریلنسری باید داشته باشد',
    'چگونه سرعت آیفون را با یک ترفند ساده دو برابر کنیم؟'
  ],
  page_goals: ['افزایش فالوور', 'افزایش تعامل', 'برندینگ'],
  telegram_chat_id: '',
  telegram_bot_token: '',
  webhook_url: '',

  // Content Calendar & Poster Design Defaults
  custom_calendar_active: true,
  calendar_schedule: [
    { day_of_week: 'شنبه', topic: 'آموزش تخصصی و ترفندهای کاربردی', content_type: 'Reel', goal: 'جذب فالوور جدید', details: 'هوک میخکوب‌کننده ۳ ثانیه اول و آموزش سریع یک ابزار' },
    { day_of_week: 'یکشنبه', topic: 'معرفی ابزارهای هوش مصنوعی و سایت‌های برتر', content_type: 'Carousel', goal: 'سیو و شیر حداکثری', details: 'پست اسلایدی ورق‌زدنی با کاور کنجکاوکننده' },
    { day_of_week: 'دوشنبه', topic: 'پرسش و پاسخ، حل چالش مخاطب و سناریوی استوری', content_type: 'Story', goal: 'افزایش تعامل', details: 'باکس سوال، نظرسنجی و پاسخ به دغدغه پرتکرار' },
    { day_of_week: 'سه‌شنبه', topic: 'بررسی پرونده، اشتباهات رایج یا مقایسه قبل و بعد', content_type: 'Reel', goal: 'برندینگ و اعتبار', details: 'داستان‌سرایی و انتقال تجربه' },
    { day_of_week: 'چهارشنبه', topic: 'معرفی خدمات یا پیشنهاد ویژه و فروش', content_type: 'Post', goal: 'فروش و جذب مشتری', details: 'کال تو اکشن مستقیم دایرکت یا لینک بیو' },
    { day_of_week: 'پنج‌شنبه', topic: 'چک‌لیست هفتگی، خلاصه نکات و کوییز', content_type: 'Carousel', goal: 'افزایش تعامل', details: 'اسلایدهای منظم و چک‌لیستی که حتماً ذخیره شود' },
    { day_of_week: 'جمعه', topic: 'پشت صحنه، داستان برند یا لایف‌استایل کاری', content_type: 'Story', goal: 'وفاداری و ارتباط صمیمی', details: 'فضای غیررسمی و ارتباط انسانی با مخاطب' },
  ],
  custom_calendar_notes: 'طبق روزهای هفته پیش برو و فرمت‌ها را رعایت کن.',
  poster_design: {
    custom_prompt: 'پوستر مینیمال مدرن با پس‌زمینه دارک و هایلایت نئونی بنفش، تایپوگرافی بولد فارسی و المان‌های شیشه‌ای شیک',
    primary_color: '#ec4899',
    secondary_color: '#8b5cf6',
    style_theme: 'cyber',
    font_size_scale: 'normal',
    show_page_id: true,
    additional_notes: 'آیدی پیج در کادر شیشه‌ای و برچسب عنوان واضح باشد.'
  },
  notebooklm: {
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
  },
  auto_generate_media: true,
  auto_publish_daily: true,
  autopilot_formats: ['Reel', 'Carousel', 'Story', 'Post'],

  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Seed initial sample ideas
const defaultSampleIdeas: ContentIdea[] = [
  {
    id: 'idea_sample_1',
    user_id: 'user_admin_001',
    profile_id: 'profile_default',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    date_label: '۲ روز پیش',
    scheduled_time: '11:00',
    status: 'published',
    title: '۵ ابزار رایگان هوش مصنوعی که جایگزین ۱۰ نرم‌افزار پولی می‌شوند',
    content_type: 'Reel',
    goal: 'افزایش تعامل و سیو بالا',
    hook: 'دیگه ماهی یک میلیون تومن به ابزارهای هوش مصنوعی پول نده!',
    idea: 'معرفی سریع و ضربتی ۵ هوش مصنوعی کاملاً رایگان که کار ادیت صدا، حذف پس‌زمینه، ساخت اسلاید، خلاصه‌سازی ویدیو و نوشتن ایمیل را بدون محدودیت انجام می‌دهند.',
    script: '۰ تا ۳ ثانیه: تصویر هیجان‌زده همراه با فاکتور هزینه‌ها و هوک تند.\n۳ تا ۱۸ ثانیه: نام‌بردن و نمایش صفحه مانیتور از ۵ ابزار فوق‌العاده با افکت صوتی کلیک.\n۱۸ تا ۲۵ ثانیه: دعوت به سیو ویدیو و اعلام اینکه لینک‌ها در هایلایت ابزارها قرار گرفته.',
    video_script: '«سلام رفقا! اگه هنوز داری برای فتوشاپ، کانوا پرو یا ابزارهای ادیت صدا پول دلاری میدی، این ویدیو رو همین الان سیو کن چون امروز ۵ تا ابزار کاملاً رایگان و بدون فیلتر رو معرفی می‌کنم که کیفیت کارشون پشم‌ریزونه!...»',
    caption: '💾 حتما سیوش کن چون موقع انجام پروژه حسابی به کارت میاد!\n\nخیلی‌ها فکر می‌کنن برای اینکه کار باکیفیت تحویل بدن حتماً باید اشتراک پریمیوم بخرن، اما این ۵ تا سایت نشون دادن که کیفیت همیشه پولی نیست:\n\n۱. ابزار طراحی خودکار\n۲. هوش مصنوعی تبدیل صوت به متن فارسی\n۳. ابزار ساخت اتوماتیک پاورپوینت\n۴. حذف نویز صدا در ۱۰ ثانیه\n۵. جستجوگر مقالات هوشمند\n\n💬 اسم ابزار مورد علاقه خودت چیه؟ برام کامنت کن!',
    cta: 'این پست رو بفرست برای اون دوستت که همیشه دنبال ابزار رایگانه!',
    visual_suggestion: 'شات نزدیک از صورت همراه با اشاره دست به بالای کادر که لوگوی ابزارها به صورت پاپ‌آپ همراه با افکت صوتی پاپ می‌آیند. نورپردازی گرم و زمینه نئونی بنفش/آبی.',
    hashtags: ['#هوش_مصنوعی', '#فناوری_روز', '#ابزار_رایگان', '#ترفند_موبایل', '#فریلنسری', '#تولید_محتوا'],
    reason: 'پست‌های مقایسه‌ای و معرفی لیست ابزار همیشه بالاترین میزان ذخیره (Save) و اشتراک‌گذاری را در پیج‌های حوزه فناوری دارند و مخاطبان هدف به دنبال صرفه‌جویی در هزینه هستند.',
    difficulty: 'آسان',
    estimated_time: '۴۵ دقیقه'
  },
  {
    id: 'idea_sample_2',
    user_id: 'user_admin_001',
    profile_id: 'profile_default',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    date_label: 'دیروز',
    scheduled_time: '11:00',
    status: 'in_progress',
    title: 'چک‌لیست قدم‌به‌قدم امنیت اکانت اینستاگرام در برابر هک',
    content_type: 'Carousel',
    goal: 'برندینگ و جلب اعتماد مخاطب',
    hook: 'رمز دو مرحله‌ای کافی نیست! ۳ نقطه ضعف پیجت که ازش بی‌خبری',
    idea: 'یک اسلایدی ورق‌زدنی (کاروسل) جذاب با گرافیک تمیز که به کاربر یاد می‌دهد چطور ایمیل پشتیبان، برنامه‌های متصل (Third-party apps) و سشن‌های لاگین ناشناس را چک کند.',
    script: 'اسلاید ۱: کاور شوکه‌کننده و هشدار امنیتی.\nاسلاید ۲ تا ۵: اسکرین‌شات از منوهای مخفی اینستاگرام با فلش‌های رنگی.\nاسلاید آخر: چک‌لیست نهایی و سوال تعاملی.',
    video_script: 'متن روی اسلاید اول: «این تنظیمات رو همین الان چک کن تا پیجت نپره!»',
    caption: '🔐 امنیت پیج شوخی‌بردار نیست!\n\nخیلی از ادمین‌ها و صاحبان کسب‌وکار فکر می‌کنن با یه پسورد سخت یا SMS فعال کار تمومه. اما هکرها معمولاً از طریق برنامه‌های قدیمی که به اکانت وصل موندن یا ایمیل‌های بدون تأیید نفوذ می‌کنن.\n\nورق بزنید و این ۳ مورد حیاتی رو قدم به قدم چک کنید.\n\n👇 آیا تا حالا کسی تلاش کرده وارد اکانتت بشه؟',
    cta: 'سیو کن تا سر فرصت تنظیماتش رو برای پیج خودت یا پیج کاریت ست کنی.',
    visual_suggestion: 'اسلایدهای تیره با ترکیب رنگ مشکی و زرد هشدار، آیکون‌های وکتور تمیز، خطوط راهنما برای اسلاید بعدی تا مخاطب ترغیب به ورق زدن شود.',
    hashtags: ['#امنیت_پیج', '#اینستاگرام_مارکتینگ', '#ترفند_اینستاگرام', '#امنیت_سایبری', '#دیجیتال_مارکتینگ'],
    reason: 'پست‌های آموزشی معتبر اعتماد مخاطب به پیج را تقویت کرده و پیج را به عنوان یک مرجع فنی و موثق در ذهن کاربر تثبیت می‌کند.',
    difficulty: 'متوسط',
    estimated_time: '۱ ساعت و ۱۵ دقیقه'
  }
];

// Security & Password Helpers
const PASSWORD_SALT = 'instaideasalt_2026_secure';
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + PASSWORD_SALT).digest('hex');
}

function generateToken(): string {
  return 'tkn_' + crypto.randomBytes(24).toString('hex');
}

function sanitizeUser(user: User): UserPublicInfo {
  return {
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    role: user.role,
    credits: user.credits,
    subscription_tier: user.subscription_tier,
    daily_video_limit: user.daily_video_limit,
    daily_videos_used: user.daily_videos_used,
    status: user.status,
    created_at: user.created_at,
    last_login_at: user.last_login_at,
    profile: user.profile,
  };
}

// Check and reset daily video quota if date changed
function checkAndResetDailyQuota(user: User, db: DatabaseSchema): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (user.last_video_date !== today) {
    user.daily_videos_used = 0;
    user.last_video_date = today;
    saveDb(db);
    return true;
  }
  return false;
}

function readDb(): DatabaseSchema {
  let data: any = null;
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      data = JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading DB:', err);
  }

  if (!data) {
    data = {
      users: [],
      ideas: defaultSampleIdeas,
      logs: [
        {
          id: 'log_init',
          timestamp: new Date().toISOString(),
          profile_id: 'profile_default',
          status: 'success',
          message: 'ایجنت با موفقیت راه‌اندازی شد و سیستم آماده دریافت دستور است.',
        }
      ],
      last_scheduled_check: new Date().toISOString(),
    };
  }

  let dbChanged = false;

  // Initialize users if missing or empty
  if (!data.users || !Array.isArray(data.users) || data.users.length === 0) {
    const today = new Date().toISOString().slice(0, 10);
    const adminUser: User = {
      id: 'user_admin_001',
      username: 'admin',
      password_hash: hashPassword('admin123'),
      display_name: 'مدیر کل سیستم',
      role: 'admin',
      credits: 9999,
      subscription_tier: 'vip',
      daily_video_limit: 999,
      daily_videos_used: 0,
      last_video_date: today,
      status: 'active',
      created_at: new Date().toISOString(),
      profile: data.profile || defaultProfile,
      token: 'admin_initial_token_' + Date.now(),
    };

    const demoUser: User = {
      id: 'user_demo_002',
      username: 'user1',
      password_hash: hashPassword('123456'),
      display_name: 'کاربر آزمایشی',
      role: 'user',
      credits: 5,
      subscription_tier: 'free',
      daily_video_limit: 1, // 1 video per day on free plan!
      daily_videos_used: 0,
      last_video_date: today,
      status: 'active',
      created_at: new Date().toISOString(),
      profile: {
        ...defaultProfile,
        id: 'profile_user_demo_002',
        page_name: 'پیج من (نمونه)',
        instagram_url: 'https://instagram.com/my_page',
        description: 'پیج آزمایشی برای تولید ایده‌های روزانه',
      },
      token: 'demo_initial_token_' + Date.now(),
    };

    data.users = [adminUser, demoUser];
    dbChanged = true;
  }

  // Ensure all ideas have user_id
  if (Array.isArray(data.ideas)) {
    for (const idea of data.ideas) {
      if (!idea.user_id) {
        idea.user_id = data.users[0]?.id || 'user_admin_001';
        dbChanged = true;
      }
    }
  }

  if (dbChanged) {
    saveDb(data);
  }

  return data;
}

function saveDb(data: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving DB:', err);
  }
}

// Auth Helper & Middleware
function getAuthUser(req: express.Request): { user: User; db: DatabaseSchema } | null {
  const authHeader = req.headers.authorization || (req.headers['x-auth-token'] as string);
  if (!authHeader) return null;
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
  if (!token) return null;

  const db = readDb();
  const user = db.users.find(u => u.token === token);
  if (!user) return null;

  checkAndResetDailyQuota(user, db);
  return { user, db };
}

function requireAuth(req: any, res: any, next: any) {
  const result = getAuthUser(req);
  if (!result) {
    return res.status(401).json({ error: 'لطفاً وارد حساب کاربری خود شوید.' });
  }
  if (result.user.status === 'blocked') {
    return res.status(403).json({ error: 'حساب کاربری شما توسط مدیر سیستم مسدود شده است.' });
  }
  req.user = result.user;
  req.db = result.db;
  next();
}

function requireAdmin(req: any, res: any, next: any) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'دسترسی غیرمجاز. فقط مدیر کل سیستم به این بخش دسترسی دارد.' });
    }
    next();
  });
}

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Format Persian date helper
function getPersianDateString(): string {
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date());
  } catch {
    return new Date().toLocaleDateString('fa-IR');
  }
}

// Candidate Gemini models in priority order for resilience against 503/429 spikes
const CANDIDATE_MODELS = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'];

async function callGeminiWithFallback(params: {
  contents: any;
  config: any;
}): Promise<{ text: string; modelUsed: string }> {
  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[Gemini] Requesting model: ${model} (attempt ${attempt})...`);
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });

        if (response && response.text) {
          console.log(`[Gemini] Success using model: ${model}`);
          return { text: response.text, modelUsed: model };
        }
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || JSON.stringify(err);
        console.warn(`[Gemini] Model ${model} (attempt ${attempt}) error:`, msg);

        // Check if error is 503 (high demand / unavailable) or 429 (rate limit)
        const isTemporary = 
          msg.includes('503') || 
          msg.includes('UNAVAILABLE') || 
          msg.includes('high demand') ||
          msg.includes('overloaded') ||
          msg.includes('429') ||
          msg.includes('RESOURCE_EXHAUSTED');

        if (isTemporary && attempt === 1) {
          await new Promise(res => setTimeout(res, 1500));
        } else {
          break;
        }
      }
    }
  }

  throw lastError;
}

// Generate Instagram Content Idea via Gemini
async function generateIdeaWithGemini(profile: InstagramProfile, history: ContentIdea[], dayOverride?: string): Promise<ContentIdea> {
  const previousTitles = history.slice(0, 15).map(h => `- [${h.content_type}] ${h.title} (هدف: ${h.goal})`).join('\n');
  const userSamples = profile.previous_samples && profile.previous_samples.length > 0 
    ? profile.previous_samples.map(s => `- ${s}`).join('\n')
    : 'نمونه‌ای ثبت نشده است.';

  // Determine Persian day of week
  const persianDaysMap = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
  const currentPersianDay = dayOverride || persianDaysMap[new Date().getDay()];

  let calendarInstruction = '';
  let requestedFormat = profile.preferred_content_type;

  if (profile.custom_calendar_active && profile.calendar_schedule && profile.calendar_schedule.length > 0) {
    const matchedPlan = profile.calendar_schedule.find(p => p.day_of_week === currentPersianDay) || profile.calendar_schedule[0];
    if (matchedPlan) {
      calendarInstruction = `
🗓️ دستورالعمل الزامی و محوری تقویم محتوایی اختصاصی کاربر:
امروز در تقویم محتوایی روز «${matchedPlan.day_of_week}» است.
- تم / موضوع تعیین‌شده برای امروز: ${matchedPlan.topic}
- فرمت مقرر برای این روز: ${matchedPlan.content_type}
- هدف استراتژیک: ${matchedPlan.goal}
- جزئیات و تأکیدات خاص کاربر: ${matchedPlan.details || 'طبق تقویم'}
${profile.custom_calendar_notes ? `- استراتژی کلی تقویم: ${profile.custom_calendar_notes}` : ''}
⚠️ الزامی: ایده و سناریوی تولیدی باید حتماً و بدون استثناء بر اساس این تم و موضوع برنامه‌ریزی‌شده در تقویم محتوا باشد!`;
    }
  }

  let formatInstruction = '';
  if (calendarInstruction) {
    formatInstruction = 'فرمت اصلی باید مطابق با روز تقویم محتوایی اختصاصی کاربر تولید شود.';
  } else if (profile.preferred_content_type === 'reel_priority') {
    formatInstruction = 'اولویت اصلی فرمت باید حتماً ریلز (Reel) باشد مگر اینکه ایده به شدت برای فرمت دیگری ضروری باشد.';
  } else if (profile.preferred_content_type === 'story_priority') {
    formatInstruction = 'اولویت اصلی فرمت باید حتماً استوری تعاملی (Story) با سناریوی چندفریمی باشد.';
  } else if (profile.preferred_content_type === 'carousel_priority') {
    formatInstruction = 'اولویت اصلی فرمت باید پست اسلایدی (Carousel) با ورق‌زدن بالا باشد.';
  } else {
    const cycle = ['Reel', 'Carousel', 'Story', 'Post'] as const;
    const suggestedFormat = cycle[history.length % cycle.length];
    formatInstruction = `برای ایجاد تنوع کامل در پیج بین پست، اسلایدی (Carousel)، استوری و ریلز، فرمت پیشنهادی امروز «${suggestedFormat}» است. اگر موضوع ایجاب می‌کند یکی از فرمت‌های Reel، Carousel، Story یا Post را انتخاب کن.`;
  }

  let posterDesignInstruction = '';
  if (profile.poster_design && profile.poster_design.custom_prompt) {
    posterDesignInstruction = `
🎨 دستورالعمل اختصاصی پرامپت و استایل طراحی پوستر، کاور و گرافیک:
- پرامپت استایل بصری: ${profile.poster_design.custom_prompt}
- تم و سبک گرافیکی: ${profile.poster_design.style_theme || 'مدرن و نئونی'}
- رنگ اصلی برند: ${profile.poster_design.primary_color || '#ec4899'}
- رنگ مکمل: ${profile.poster_design.secondary_color || '#8b5cf6'}
- اندازه و مقیاس تایپوگرافی: ${profile.poster_design.font_size_scale || 'normal'}
- نمایش آیدی پیج: ${profile.poster_design.show_page_id ? 'بله، حتماً آیدی پیج در طراحی لحاظ شود' : 'خیر'}
- نکات تکمیلی طراحی پوستر: ${profile.poster_design.additional_notes || 'ندارد'}
در فیلد پیشنهاد بصری (visual_suggestion) و المان‌های اسلایدها و کاور، دقیقاً بر اساس این پرامپت و پالت رنگی جزئیات طراحی پوستر را پیشنهاد بده.`;
  }

  const systemInstruction = `تو یک مدیر ارشد استراتژی محتوا و اینستاگرامر حرفه‌ای (Instagram Content Strategist & Growth Hacker) هستی.
وظیفه اصلی تو تولید دقیقاً یک ایده محتوایی فوق‌العاده کاربردی، به‌روز، خلاقانه و کاملاً قابل اجرا برای یک پیج اینستاگرام است.

قوانین حیاتی:
۱. ایده باید متناسب با حوزه فعالیت پیج، لحن پیج و مخاطبان هدف باشد. اگر کاربر تقویم محتوایی اختصاصی مشخص کرده باشد، باید صد در صد از تم و موضوع همان روز تقویم پیروی کنی.
۲. ایده باید به گونه‌ای باشد که کاربر بتواند «همین امروز» آن را پیاده‌سازی و ضبط/طراحی کند. از ارائه‌ی کلی‌گویی‌های بیهوده مثل «یک پست انگیزشی بگذارید» اکیداً خودداری کن! جزئیات دقیق، سناریو ثانیه‌ای یا فریم‌به‌فریم، جملات شروع (Hook) و متن ویدیو را دقیق بنویس.
۳. بررسی ایده‌های قبلی پیج:
تو باید لیست ایده‌های قبلی را با دقت بخوانید. تحت هیچ شرایطی نباید ایده تکراری یا خیلی مشابه ایده‌های روزهای قبل تولید کنی! زاویه دید، موضوع، هوک و فرمت باید کاملاً تازه باشد.
۴. طراحی بصری و پوستر:
اگر کاربر پرامپت یا رنگ‌بندی خاصی برای پوستر مشخص کرده، پیشنهاد بصری (visual_suggestion) را دقیقاً بر اساس دستورالعمل بصری کاربر بنویس.
۵. صداقت در تحلیل:
اگر اطلاعات واقعی بیشتری از پیج در دسترس نیست، هرگز اطلاعات فالوور یا آمار جعلی حدس نزن. فقط و فقط بر اساس داده‌های کاربر و اصول حرفه‌ای رشد اینستاگرام ایده بساز.
۶. تمام متن‌ها و فیلدها باید به زبان فارسی روان، جذاب، اصیل و مدرن اینستاگرامی باشند.
۷. خروجی باید یک آبجکت JSON معتبر باشد.`;

  const userPrompt = `اطلاعات پیج اینستاگرام:
- نام پیج: ${profile.page_name}
- آدرس/لینک پیج: ${profile.instagram_url}
- حوزه فعالیت: ${profile.niche}
- توضیحات پیج: ${profile.description}
- مخاطبان هدف: ${profile.target_audience}
- لحن محتوا: ${profile.content_tone}
- اهداف اصلی پیج: ${profile.page_goals.join('، ') || 'رشد پیج'}
- دستورالعمل فرمت مورد نظر: ${formatInstruction}
${calendarInstruction}
${posterDesignInstruction}

نمونه محتواهای قبلی که کاربر ارائه کرده:
${userSamples}

لیست ایده‌هایی که قبلاً برای این پیج تولید شده (اکیداً تکرار نشوند):
${previousTitles || 'هنوز ایده‌ای در سابقه وجود ندارد.'}

لطفاً دقیقاً یک ایده جدید برای امروز با تمام ۱۴ بخش خواسته شده تولید کن و در قالب JSON برگردان.`;

  let responseText = '';
  try {
    const result = await callGeminiWithFallback({
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'عنوان ایده جذاب و خلاصه' },
            content_type: { 
              type: Type.STRING, 
              description: 'یکی از موارد: Reel, Story, Carousel, Post, Live' 
            },
            goal: { type: Type.STRING, description: 'هدف این محتوا (مثلاً جذب فالوور، فروش، سیو، تعامل)' },
            hook: { type: Type.STRING, description: 'هوک یا جمله شروع میخکوب‌کننده ۳ ثانیه اول' },
            idea: { type: Type.STRING, description: 'توضیح کامل ایده و زاویه دید' },
            script: { type: Type.STRING, description: 'سناریوی پیشنهادی با زمان‌بندی یا گام‌به‌گام' },
            video_script: { type: Type.STRING, description: 'متن دقیق کلامی ویدیو یا متن اسلایدها' },
            caption: { type: Type.STRING, description: 'کپشن کامل و آماده همراه با فاصله و ایموجی' },
            cta: { type: Type.STRING, description: 'کال تو اکشن (Call to Action) شفاف و ترغیب‌کننده' },
            visual_suggestion: { type: Type.STRING, description: 'پیشنهاد نور، قاب، دکور، زیرنویس و افکت بصری' },
            hashtags: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: 'لیست ۶ الی ۱۲ هشتگ استراتژیک و مرتبط با علامت #' 
            },
            reason: { type: Type.STRING, description: 'دلیل اینکه چرا این ایده برای این پیج مناسب است' },
            difficulty: { type: Type.STRING, description: 'یکی از موارد: آسان، متوسط، پیشرفته' },
            estimated_time: { type: Type.STRING, description: 'زمان تقریبی ساخت (مثلاً ۳۰ دقیقه)' },
            audio_suggestion: { type: Type.STRING, description: 'پیشنهاد موزیک ترند، صدای گوینده یا افکت صوتی' }
          },
          required: [
            'title', 'content_type', 'goal', 'hook', 'idea', 'script', 
            'video_script', 'caption', 'cta', 'visual_suggestion', 
            'hashtags', 'reason', 'difficulty', 'estimated_time'
          ]
        }
      }
    });
    responseText = result.text;
  } catch (apiError: any) {
    console.error('All Gemini candidate models experienced temporary load spike or failure:', apiError);
    return generateSmartContingencyIdea(profile, history);
  }

  const parsed = JSON.parse(responseText || '{}');
  
  let cType = (parsed.content_type || 'Reel').trim();
  if (!['Reel', 'Story', 'Carousel', 'Post', 'Live'].includes(cType)) {
    if (cType.toLowerCase().includes('reel')) cType = 'Reel';
    else if (cType.toLowerCase().includes('story')) cType = 'Story';
    else if (cType.toLowerCase().includes('carousel')) cType = 'Carousel';
    else cType = 'Reel';
  }

  let diff = (parsed.difficulty || 'آسان').trim();
  if (!['آسان', 'متوسط', 'پیشرفته'].includes(diff)) {
    diff = diff.includes('پیش') ? 'پیشرفته' : diff.includes('متوسط') ? 'متوسط' : 'آسان';
  }

  const newIdea: ContentIdea = {
    id: 'idea_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    profile_id: profile.id,
    created_at: new Date().toISOString(),
    date_label: getPersianDateString(),
    scheduled_time: profile.schedule_time || '12:00',
    status: 'new',
    title: parsed.title || 'ایده روزانه محتوا',
    content_type: cType as any,
    goal: parsed.goal || 'افزایش تعامل',
    hook: parsed.hook || 'یک نکته مهم که باید بدانید!',
    idea: parsed.idea || '',
    script: parsed.script || '',
    video_script: parsed.video_script || '',
    caption: parsed.caption || '',
    cta: parsed.cta || 'نظرت رو برام کامنت کن!',
    visual_suggestion: parsed.visual_suggestion || '',
    hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : ['#اینستاگرام', '#تولید_محتوا'],
    reason: parsed.reason || 'متناسب با علاقه مخاطبان هدف',
    difficulty: diff as any,
    estimated_time: parsed.estimated_time || '۳۰ الی ۴۵ دقیقه',
    audio_suggestion: parsed.audio_suggestion || 'موزیک لایت بی‌کلام یا موزیک ترند اینستاگرام'
  };

  return enrichIdeaWithAssetBreakdown(newIdea, profile);
}

// Helper to guarantee multi-slide carousel, multi-frame story, and multi-scene video data
function enrichIdeaWithAssetBreakdown(idea: ContentIdea, profile: InstagramProfile): ContentIdea {
  const niche = profile?.niche || 'تکنولوژی و رشد پیج';

  if (idea.content_type === 'Carousel' && (!idea.carousel_slides || idea.carousel_slides.length === 0)) {
    idea.carousel_slides = [
      {
        slide_number: 1,
        title: idea.hook || idea.title,
        content: `راهنمای کاربردی برای ${niche}\nورق بزنید تا جزئیات رو ببینید 👉`,
        visual_note: 'کاور اصلی با تایپوگرافی درشت و تضاد رنگی بالا'
      },
      {
        slide_number: 2,
        title: 'قدم اول: شروع اصولی و بدون اشتباه',
        content: idea.idea.slice(0, 180) || 'خیلی از افراد از این نقطه شروع اشتباه می‌کنند...',
        visual_note: 'باکس توضیحی با آیکون هدف و فلش راهنما'
      },
      {
        slide_number: 3,
        title: 'ترفند طلایی و راز موفقیت',
        content: idea.script.slice(0, 180) || 'این فرمول ثابت شده است و بازدهی را دو برابر می‌کند.',
        visual_note: 'نمایش آمار یا ترفند کلیدی'
      },
      {
        slide_number: 4,
        title: 'چک‌لیست اجرایی امروز',
        content: `۱. این نکته را یادداشت کنید\n۲. بلافاصله تست کنید\n۳. نتایج را بررسی نمایید`,
        visual_note: 'بولت‌پوینت‌های تیک‌دار'
      },
      {
        slide_number: 5,
        title: 'سیو کن تا موقع اجرا گمش نکنی!',
        content: idea.cta || 'نظرت رو در کامنت‌ها بنویس و این پست رو برای دوستانت بفرست.',
        visual_note: 'آیکون بزرگ سیو و اشتراک‌گذاری'
      }
    ];
  }

  if (idea.content_type === 'Story' && (!idea.story_frames || idea.story_frames.length === 0)) {
    idea.story_frames = [
      {
        frame_number: 1,
        format: 'طرح چالش روز با استیکر بله/خیر',
        text: idea.hook || 'آیا شما هم این چالش را تجربه کرده‌اید؟',
        sticker_suggestion: 'Poll: بله دقیقاً / خیر تا حالا نه'
      },
      {
        frame_number: 2,
        format: 'ارائه راهکار و نکته طلایی',
        text: idea.idea.slice(0, 140) || 'تنها راهکار اصولی اینه که...',
        sticker_suggestion: 'Slider: چقدر به کارت اومد؟'
      },
      {
        frame_number: 3,
        format: 'کال تو اکشن و سوال باز',
        text: idea.cta || 'تجربه خودت رو در این باره بنویس',
        sticker_suggestion: 'Question Box: سوالت رو اینجا بپرس'
      }
    ];
  }

  if (idea.content_type === 'Reel' && (!idea.video_scenes || idea.video_scenes.length === 0)) {
    idea.video_scenes = [
      {
        time_range: '۰ تا ۳ ثانیه',
        scene_title: 'Hook میخکوب‌کننده اولیه',
        speech_text: idea.hook || 'این ویدیو رو همین الان سیو کن!',
        visual_cue: 'شات کلوزآپ با انرژی بالا و نمایش تیتر متحرک'
      },
      {
        time_range: '۳ تا ۱۵ ثانیه',
        scene_title: 'بیان چالش و ایجاد حس نیاز',
        speech_text: idea.video_script ? idea.video_script.slice(0, 120) : 'خیلی‌ها فکر می‌کنن راه سختیه، اما واقعیت اینه...',
        visual_cue: 'حرکت سریع دوربین و نمایش مانیتور یا گوشی'
      },
      {
        time_range: '۱۵ تا ۴۰ ثانیه',
        scene_title: 'آموزش گام‌به‌گام و ترفند اصلی',
        speech_text: idea.script.slice(0, 150) || 'این ترفند کار شما را در کمترین زمان راه می‌اندازد.',
        visual_cue: 'اسکرین رکورد یا نمایش دست همراه با زیرنویس زنده'
      },
      {
        time_range: '۴۰ تا ۵۰ ثانیه',
        scene_title: 'کال تو اکشن (CTA) و دعوت به تعامل',
        speech_text: idea.cta || 'کپشن رو برای جزئیات بیشتر بخون و سیوش کن!',
        visual_cue: 'اشاره به دکمه سیو و کامنت همراه با لوگوی پیج'
      }
    ];
  }

  return idea;
}

// Fallback idea generator
function generateSmartContingencyIdea(profile: InstagramProfile, history: ContentIdea[]): ContentIdea {
  const niche = profile.niche || 'تکنولوژی و کسب‌وکار';
  const name = profile.page_name || 'پیج شما';
  const goal = profile.page_goals?.[0] || 'افزایش تعامل و فالوور';
  
  let cType: any = 'Reel';
  if (profile.preferred_content_type === 'story_priority') cType = 'Story';
  else if (profile.preferred_content_type === 'carousel_priority') cType = 'Carousel';
  else {
    const cycle = ['Reel', 'Carousel', 'Story', 'Post'] as const;
    cType = cycle[history.length % cycle.length];
  }

  const contingencyIdeas = [
    {
      title: `۳ اشتباه به ظاهر ساده در حوزه ${niche} که جلوی رشد شما را می‌گیرد`,
      cType: 'Reel' as const,
      goal: goal || 'افزایش تعامل و آگاهی',
      hook: `اگه در حوزه ${niche} فعالیت داری، این اشتباه رو همین امروز متوقف کن!`,
      idea: `بررسی روان و سریع ۳ مورد از رایج‌ترین خطاهایی که مخاطبان هدف در زمینه ${niche} مرتکب می‌شوند و معرفی راهکار جایگزین، کاربردی و کم‌هزینه.`,
      script: `۰ تا ۳ ثانیه: جمله هوک با زاویه دوربین بسته و اشاره به متن روی صفحه.\n۳ تا ۱۸ ثانیه: بیان خطای اول و دوم با لحن دلسوزانه و ارائه مثال ملموس.\n۱۸ تا ۲۸ ثانیه: راهکار اصلی، نمایش نتیجه و دعوت به سیو کردن ویدیو برای اجرای آن.`,
      video_script: `«خیلی‌ها فکر می‌کنن برای پیشرفت در حوزه ${niche} باید کارهای عجیب و غریب بکنن، اما واقعیت اینه که این ۳ تا اشتباه جلوی دیده‌شدنت رو گرفته! اولین اشتباه رو همین الان چک کن...»`,
      caption: `🚨 این اشتباهات رو جدی بگیرید!\n\nخیلی وقت‌ها دلیل اینکه نتیجه دلخواه‌مون رو نمی‌گیریم، اشتباهات ریزیه که هر روز ناخواسته تکرارشون می‌کنیم.\n\nورق بزنید و این نکات رو بررسی کنید.\n\n💬 شما تا حالا کدام یک از این موارد رو تجربه کردید؟ در کامنت بنویسید.`,
      cta: `این ویدیو رو ذخیره کن تا موقع تولید و اجرا فراموشش نکنی!`,
      visual: `نور ملایم، شات نیم‌تنه با حرکات دست هماهنگ و نمایش کلمات کلیدی به صورت انیمیشن درشت روی صفحه با افکت صوتی پاپ.`,
      hashtags: [`#${niche.replace(/\s+/g, '_')}`, '#ترفند', '#رشد_پیج', '#تولید_محتوا', '#آموزش'],
      reason: `پست‌های «اشتباهات رایج» طبق الگوریتم اینستاگرام بالاترین نرخ نگه‌داشت مخاطب (Watch Time) و تبادل نظر در کامنت‌ها را ایجاد می‌کنند.`,
      difficulty: 'آسان' as const,
      time: '۳۵ دقیقه',
    },
    {
      title: `چک‌لیست قدم‌به‌قدم و ابزارهای طلایی برای موفقیت در ${niche}`,
      cType: 'Carousel' as const,
      goal: 'برندینگ و سیو بالا',
      hook: `چیزهایی که افراد حرفه‌ای در ${niche} به شما نمی‌گویند!`,
      idea: `معرفی چک‌لیست کاربردی و ترفندهای عملی برای علاقه‌مندان به ${niche} به همراه راهنمای گام‌به‌گام برای تازه‌کارها و حرفه‌ای‌ها.`,
      script: `اسلاید ۱: کاور کنجکاوی‌برانگیز با تایپوگرافی بولد.\nاسلاید ۲ تا ۵: نکات گام‌به‌گام با بولت‌پوینت‌های کوتاه و کاملاً شفاف.\nاسلاید آخر: چک‌لیست جامع و دعوت به اشتراک‌گذاری در دایرکت.`,
      video_script: `متن روی اسلاید اول: رازهایی که اگر زودتر در ${niche} می‌دانستم، ماه‌ها جلوتر بودم!`,
      caption: `💡 راهنمای ضروری برای پیشرفت در ${niche}:\n\nاگر می‌خوای کارها سریع‌تر و تمیزتر پیش بره، حتماً این چک‌لیست رو ذخیره داشته باش.\n\n👇 سوال یا ابزار مورد علاقه‌ت رو برام کامنت کن.`,
      cta: `سیوش کن و برای همکاری که نیاز داره بفرست.`,
      visual: `اسلایدهای مینیمال با رنگ سازمانی پیج، آیکون‌های بولد و استفاده از تضاد رنگی بالا برای خوانایی کامل در صفحه موبایل.`,
      hashtags: [`#${niche.replace(/\s+/g, '_')}`, '#آموزش_اینستاگرام', '#کسب_درآمد', '#ترفند_کاربردی'],
      reason: `پست‌های اسلایدی منبع‌محور نرخ اشتراک‌گذاری (Share) در دایرکت و سیو را به شدت افزایش می‌دهند.`,
      difficulty: 'متوسط' as const,
      time: '۴۵ دقیقه',
    },
    {
      title: `چالش تعاملی و پرسش و پاسخ روزانه درباره ${niche}`,
      cType: 'Story' as const,
      goal: 'افزایش ریپلای و تعامل استوری',
      hook: `نظرت درباره بزرگ‌ترین چالش این روزهای ${niche} چیه؟`,
      idea: `سلسله استوری‌های ۳ فریمی با استیکر نظرسنجی و سوال برای افزایش ریپلای و برقراری ارتباط مستقیم با دنبال‌کنندگان فعال.`,
      script: `فریم ۱: طرح سوال چالشی با نظرسنجی بله/خیر.\nفریم ۲: اشتراک‌گذاری راهکار سریع و کاربردی.\nفریم ۳: دعوت به ارسال سوال در باکس استوری.`,
      video_script: `امروز می‌خوایم یه راست بریم سر اصل مطلب در ${niche}! روی استیکر بزنید.`,
      caption: `استوری تعاملی روز برای ${name}`,
      cta: `همین الان در نظرسنجی استوری شرکت کن!`,
      visual: `استوری عمودی ۹:۱۶ با فونت بولد و باکس‌های شیشه‌ای کنتراست بالا.`,
      hashtags: [`#${niche.replace(/\s+/g, '_')}`, '#استوری_تعاملی', '#روزمرگی_کاری'],
      reason: `استوری‌های تعاملی نرخ بازدید پیج را در الگوریتم اینستاگرام بالا نگه می‌دارند.`,
      difficulty: 'آسان' as const,
      time: '۱۵ دقیقه',
    },
    {
      title: `راهنمای یک‌صفحه‌ای طلایی برای پیشرفت سریع در ${niche}`,
      cType: 'Post' as const,
      goal: 'سیو و معرفی برند',
      hook: `این یک تصویر تمام نقشه راه ${niche} رو خلاصه کرده!`,
      idea: `طراحی یک پوستر تک‌فریم بسیار خوانا و کاربردی که مخاطب بتواند به عنوان مرجع سریع ذخیره کند.`,
      script: `تیتر قدرتمند در بالا، باکس جمع‌بندی سه‌مرحله‌ای در مرکز، و دعوت به اقدام در پایین تصویر.`,
      video_script: `این پست رو ذخیره کن تا همیشه جلوی چشمت باشه.`,
      caption: `📌 نقشه راه سریع ${niche}\n\nاگر می‌خوای بدون سردرگمی قدم اول رو محکم برداری، این پوستر رو سیو کن و هر هفته مرورش کن.\n\n💬 کدوم مرحله برات چالش‌برانگیزتره؟`,
      cta: `برای دریافت فایل کامل یا مشاوره کامنت بگذار.`,
      visual: `پوستر مربعی ۱۰۸۰×۱۰۸۰ با پالت برند پیج و تایپوگرافی شاخص.`,
      hashtags: [`#${niche.replace(/\s+/g, '_')}`, '#پوستر_آموزشی', '#نکات_طلایی'],
      reason: `پوسترهای تک‌فریم مرجع سریع‌ترین نرخ سیو در اکسپلور را ایجاد می‌کنند.`,
      difficulty: 'آسان' as const,
      time: '۲۰ دقیقه',
    }
  ];

  const pick = contingencyIdeas.find(x => x.cType === cType) || contingencyIdeas[history.length % contingencyIdeas.length];

  const contingencyIdea: ContentIdea = {
    id: 'idea_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    profile_id: profile.id,
    created_at: new Date().toISOString(),
    date_label: getPersianDateString(),
    scheduled_time: profile.schedule_time || '12:00',
    status: 'new',
    title: pick.title,
    content_type: pick.cType,
    goal: pick.goal,
    hook: pick.hook,
    idea: pick.idea,
    script: pick.script,
    video_script: pick.video_script,
    caption: pick.caption,
    cta: pick.cta,
    visual_suggestion: pick.visual,
    hashtags: pick.hashtags,
    reason: pick.reason,
    difficulty: pick.difficulty,
    estimated_time: pick.time,
    audio_suggestion: 'موزیک ترند ریلز با ریتم ملایم'
  };

  return enrichIdeaWithAssetBreakdown(contingencyIdea, profile);
}

// ==========================================
// SECURITY & NOTEBOOKLM PIPELINE HELPERS
// ==========================================

function validateExternalHttpUrl(rawUrl: string): { valid: boolean; error?: string; parsed?: URL } {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, error: 'آدرس وارد نشده است.' };
  }
  const trimmed = rawUrl.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: 'فرمت آدرس URL معتبر نیست.' };
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { valid: false, error: 'فقط پروتکل‌های http و https مجاز هستند.' };
  }

  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.startsWith('127.') ||
    host.startsWith('10.') ||
    host.startsWith('192.168.') ||
    host.startsWith('169.254.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    host.startsWith('fc') ||
    host.startsWith('fd') ||
    host.startsWith('fe80')
  ) {
    return { valid: false, error: 'آدرس‌های شبکه داخلی یا لوکال (localhost/private IP) برای امنیت سرور مجاز نیستند.' };
  }

  return { valid: true, parsed };
}

function safeSaveMediaFile(prefix: string, ideaId: string, ext: string, buffer: Buffer): string {
  const safeId = ideaId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'item';
  const safeExt = ext.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'bin';
  const filename = `${prefix}_${safeId}_${Date.now()}.${safeExt}`;
  const resolved = path.resolve(MEDIA_DIR, filename);
  if (!resolved.startsWith(MEDIA_DIR + path.sep)) {
    throw new Error('مسیر فایل نامعتبر است.');
  }
  fs.writeFileSync(resolved, buffer);
  return `/media/${filename}`;
}

function ensureUserNotebookLMConfig(profile: InstagramProfile): InstagramProfile {
  const baseNlm = profile.notebooklm || {
    enabled: false,
    connection_mode: 'webhook_bridge' as const,
    bridge_url: '',
    bridge_api_key: '',
    notebook_id: '',
    notebook_url: 'https://notebooklm.google.com/',
    video_style: 'explainer' as const,
    video_format: 'brief' as const,
    output_language: 'fa',
    auto_dispatch_daily: false,
    auto_publish_on_return: false,
    callback_secret: '',
  };
  if (!baseNlm.callback_secret) {
    baseNlm.callback_secret = crypto.randomBytes(24).toString('hex');
  }
  return {
    ...profile,
    notebooklm: baseNlm,
  };
}

function buildNotebookLMPackage(idea: ContentIdea, profile: InstagramProfile) {
  const nlm = profile.notebooklm;
  const styleLabelMap: Record<string, string> = {
    explainer: 'توضیحی مدرن (Explainer)',
    whiteboard: 'وایت‌برد آموزشی (Whiteboard)',
    watercolor: 'هنری آبرنگی (Watercolor)',
    retro_print: 'رترو چاپی (Retro Print)',
    anime: 'انیمه‌ای (Anime)',
    heritage: 'کلاسیک و مستند (Heritage)',
  };
  const styleName = styleLabelMap[nlm?.video_style || 'explainer'] || 'Explainer';

  const sourceDoc = [
    `# بسته محتوای روزانه اینستاگرام: ${idea.title}`,
    `تاریخ برنامه‌ریزی: ${idea.date_label} | ساعت: ${idea.scheduled_time}`,
    `نام پیج: ${profile.page_name} (${profile.instagram_handle || profile.instagram_url})`,
    `حوزه تخصصی (Niche): ${profile.niche}`,
    `مخاطبان هدف: ${profile.target_audience}`,
    `لحن و شخصیت برند: ${profile.content_tone}`,
    `فرمت هدف: ${idea.content_type} | هدف استراتژیک: ${idea.goal}`,
    ``,
    `## قلاب شروع ۳ ثانیه اول (Hook)`,
    idea.hook,
    ``,
    `## ایده محوری و زاویه دید`,
    idea.idea,
    ``,
    `## سناریوی دقیق و صحنه‌بندی ویدیو`,
    idea.script,
    ``,
    `## دیالوگ گفتاری و متن روایت (Voiceover Script)`,
    idea.video_script || idea.script,
    ``,
    ...(idea.video_scenes && idea.video_scenes.length > 0
      ? [
          `## جزئیات صحنه‌های ویدیویی`,
          ...idea.video_scenes.map(s => `- [${s.time_range}] ${s.scene_title}: ${s.speech_text} (پیشنهاد تصویر: ${s.visual_cue})`),
          ``,
        ]
      : []),
    `## راهنمای بصری و پوستر`,
    idea.visual_suggestion,
    ``,
    `## دعوت به اقدام (CTA) و کپشن اینستاگرام`,
    idea.cta,
    ``,
    idea.caption,
    ``,
    `هشتگ‌ها: ${(idea.hashtags || []).join(' ')}`
  ].join('\n');

  const videoPrompt = `یک ویدیوی کوتاه و جذاب اینستاگرامی (Video Overview) به زبان ${nlm?.output_language === 'en' ? 'انگلیسی' : 'فارسی'} با سبک بصری ${styleName} و ریتم ${nlm?.video_format === 'deep_dive' ? 'تحلیلی و عمیق' : 'سریع و کاربردی'} تولید کن. حتماً با این قلاب شروع شود: «${idea.hook}»، نکات اصلی سناریو را با مثال ملموس توضیح دهد و در پایان مخاطب را به این اقدام دعوت کند: «${idea.cta}». مناسب برای انتشار عمودی ۹:۱۶ در اینستاگرام پیج ${profile.page_name}.`;

  return { sourceDoc, videoPrompt };
}

async function publishIdeaToInstagram(params: {
  db: DatabaseSchema;
  user: User;
  ideaIndex: number;
  baseUrl: string;
  overrideCaption?: string;
  imageDataUrl?: string;
  videoUrlOverride?: string;
  isAutopilot?: boolean;
}) {
  const { db, user, ideaIndex, baseUrl, overrideCaption, imageDataUrl, videoUrlOverride, isAutopilot = false } = params;
  const idea = db.ideas[ideaIndex];
  const userProfile = user.profile || defaultProfile;

  let localImageUrl = idea.generated_image_url || '';
  if (imageDataUrl && imageDataUrl.startsWith('data:image')) {
    const extMatch = imageDataUrl.match(/^data:image\/(\w+);base64,/);
    const ext = extMatch && extMatch[1] === 'jpeg' ? 'jpg' : (extMatch && extMatch[1]) || 'jpg';
    const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    localImageUrl = safeSaveMediaFile('post', idea.id, ext, buffer);
  }

  const finalVideoUrl = videoUrlOverride || idea.generated_video_url || '';
  const carouselUrls = idea.generated_carousel_urls || [];
  const storyUrls = idea.generated_story_urls || [];
  const finalCaption = overrideCaption || idea.caption;
  const simulatedPostId = 'ig_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const targetInstagramUrl = userProfile.instagram_url
    ? (userProfile.instagram_url.startsWith('http') ? userProfile.instagram_url : `https://instagram.com/${userProfile.instagram_url.replace(/^@/, '')}`)
    : 'https://www.instagram.com/';

  const resolvePublicMediaUrl = (mediaPath: string) => {
    if (!mediaPath) return '';
    if (mediaPath.startsWith('http://') || mediaPath.startsWith('https://')) return mediaPath;
    return `${baseUrl}${mediaPath.startsWith('/') ? mediaPath : '/' + mediaPath}`;
  };

  const hasMetaApi = Boolean(userProfile.instagram_access_token && userProfile.instagram_account_id);
  let publishedToMeta = false;
  let metaPostId = '';
  let metaPermalink = '';
  let metaErrorMessage = '';

  if (hasMetaApi) {
    try {
      const igAccountId = encodeURIComponent(userProfile.instagram_account_id!);
      const accessToken = userProfile.instagram_access_token!;

      if (idea.content_type === 'Carousel' && carouselUrls.length >= 2) {
        // Multi-slide Carousel publishing via Meta Graph API v19.0
        const childIds: string[] = [];
        for (const slideUrl of carouselUrls.slice(0, 10)) {
          const childRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image_url: resolvePublicMediaUrl(slideUrl),
              is_carousel_item: true,
              access_token: accessToken,
            }),
          });
          const childData = await childRes.json();
          if (!childData.id) {
            throw new Error(childData.error?.message || 'خطا در ساخت اسلاید کاروسل در متا');
          }
          childIds.push(childData.id);
        }

        const parentRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            media_type: 'CAROUSEL',
            children: childIds.join(','),
            caption: finalCaption,
            access_token: accessToken,
          }),
        });
        const parentData = await parentRes.json();
        if (!parentData.id) {
          metaErrorMessage = parentData.error?.message || 'خطا در ایجاد کانتینر کاروسل متا';
        } else {
          const publishRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media_publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ creation_id: parentData.id, access_token: accessToken }),
          });
          const publishData = await publishRes.json();
          if (publishData.id) {
            publishedToMeta = true;
            metaPostId = publishData.id;
            metaPermalink = `https://www.instagram.com/p/${publishData.id}/`;
          } else {
            metaErrorMessage = publishData.error?.message || 'خطا در انتشار نهایی کاروسل در متا';
          }
        }
      } else if (idea.content_type === 'Story') {
        // Story 9:16 publishing via Meta Graph API v19.0
        const framesToPublish = storyUrls.length > 0 ? storyUrls : (localImageUrl ? [localImageUrl] : []);
        const publishedStoryIds: string[] = [];
        for (const frameUrl of framesToPublish) {
          const storyContainerRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              media_type: 'STORIES',
              image_url: resolvePublicMediaUrl(frameUrl),
              access_token: accessToken,
            }),
          });
          const storyContainer = await storyContainerRes.json();
          if (storyContainer.id) {
            const pubRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media_publish`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ creation_id: storyContainer.id, access_token: accessToken }),
            });
            const pubData = await pubRes.json();
            if (pubData.id) publishedStoryIds.push(pubData.id);
            else metaErrorMessage = pubData.error?.message || metaErrorMessage;
          } else {
            metaErrorMessage = storyContainer.error?.message || 'خطا در ایجاد استوری در API متا';
          }
        }
        if (publishedStoryIds.length > 0) {
          publishedToMeta = true;
          metaPostId = publishedStoryIds[0];
          metaPermalink = targetInstagramUrl;
        }
      } else {
        // Single Image Post or Video Reel
        const isVideoReel = Boolean(finalVideoUrl);
        const containerPayload: Record<string, any> = {
          caption: finalCaption,
          access_token: accessToken,
        };

        if (isVideoReel) {
          containerPayload.media_type = 'REELS';
          containerPayload.video_url = resolvePublicMediaUrl(finalVideoUrl);
          containerPayload.share_to_feed = true;
        } else {
          containerPayload.image_url = resolvePublicMediaUrl(localImageUrl);
        }

        const mediaContainerRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(containerPayload),
        });
        const containerData = await mediaContainerRes.json();

        if (containerData.id) {
          if (isVideoReel) {
            for (let attempt = 0; attempt < 8; attempt++) {
              await new Promise(r => setTimeout(r, 2500));
              const statusRes = await fetch(
                `https://graph.facebook.com/v19.0/${encodeURIComponent(containerData.id)}?fields=status_code&access_token=${encodeURIComponent(accessToken)}`
              );
              const statusData = await statusRes.json();
              if (statusData.status_code === 'FINISHED') break;
              if (statusData.status_code === 'ERROR') {
                metaErrorMessage = 'متا در پردازش فایل ویدیو خطا داد.';
                break;
              }
            }
          }

          if (!metaErrorMessage) {
            const publishRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media_publish`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                creation_id: containerData.id,
                access_token: accessToken,
              }),
            });
            const publishData = await publishRes.json();
            if (publishData.id) {
              publishedToMeta = true;
              metaPostId = publishData.id;
              metaPermalink = `https://www.instagram.com/p/${publishData.id}/`;
            } else {
              metaErrorMessage = publishData.error?.message || 'خطا در گام نهایی انتشار با API متا';
            }
          }
        } else {
          metaErrorMessage = containerData.error?.message || 'خطا در ایجاد کانتینر رسانه در API متا';
        }
      }
    } catch (metaErr: any) {
      console.warn('Meta Graph API direct call error:', metaErr.message);
      metaErrorMessage = metaErr.message;
    }
  }

  const webhookUrl = userProfile.auto_publish_webhook || userProfile.webhook_url;
  let webhookDispatched = false;
  let webhookStatus = 'skipped';

  if (webhookUrl && webhookUrl.trim()) {
    const urlCheck = validateExternalHttpUrl(webhookUrl);
    if (urlCheck.valid) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);
        const webhookResponse = await fetch(urlCheck.parsed!.toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'instagram_publish',
            autopilot: isAutopilot,
            account_id: userProfile.instagram_account_id || userProfile.instagram_url,
            instagram_handle: userProfile.instagram_handle,
            idea_id: idea.id,
            title: idea.title,
            content_type: idea.content_type,
            post_id: publishedToMeta ? metaPostId : simulatedPostId,
            permalink: publishedToMeta ? metaPermalink : targetInstagramUrl,
            caption: finalCaption,
            hashtags: idea.hashtags,
            image_url: resolvePublicMediaUrl(localImageUrl),
            carousel_urls: carouselUrls.map(resolvePublicMediaUrl),
            story_urls: storyUrls.map(resolvePublicMediaUrl),
            video_url: resolvePublicMediaUrl(finalVideoUrl),
            source: idea.notebooklm_video_returned_at ? 'notebooklm_pipeline' : isAutopilot ? 'autopilot_renderer' : 'studio_canvas',
            published_to_meta: publishedToMeta,
            published_at: new Date().toISOString(),
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        webhookDispatched = webhookResponse.ok;
        webhookStatus = webhookResponse.ok ? 'delivered' : 'failed';
      } catch (webhookErr: any) {
        console.warn('Webhook publish notification timed out or failed (non-blocking):', webhookErr.message);
        webhookStatus = 'timeout_or_failed';
      }
    } else {
      webhookStatus = 'invalid_url';
    }
  }

  const finalPermalink = publishedToMeta ? metaPermalink : targetInstagramUrl;
  const finalPostId = publishedToMeta ? metaPostId : simulatedPostId;
  const actuallyPublishedRemotely = publishedToMeta || webhookDispatched;

  const nextStatus = isAutopilot
    ? (actuallyPublishedRemotely ? 'published' : 'in_progress')
    : 'published';

  const pipelineStage = actuallyPublishedRemotely
    ? 'published_to_instagram'
    : 'queued_ready';

  const pipelineNote = publishedToMeta
    ? `با موفقیت و به‌صورت خودکار در پیج اینستاگرام (${idea.content_type}) منتشر شد.`
    : webhookDispatched
    ? `فایل‌های ${idea.content_type} ساخته شد و از طریق وب‌هوک انتشار خودکار ارسال گردید.`
    : hasMetaApi && metaErrorMessage
    ? `فایل‌های ${idea.content_type} ساخته شدند، اما متا خطا داد: ${metaErrorMessage}`
    : `فایل‌های ${idea.content_type} به‌صورت خودکار تولید و آماده شدند؛ برای انتشار مستقیم در پیج، توکن Meta API یا وب‌هوک را در تنظیمات ثبت کنید.`;

  db.ideas[ideaIndex] = {
    ...idea,
    status: nextStatus,
    published_at: actuallyPublishedRemotely || !isAutopilot ? new Date().toISOString() : idea.published_at,
    instagram_post_id: finalPostId,
    instagram_permalink: finalPermalink,
    generated_image_url: localImageUrl || idea.generated_image_url,
    generated_video_url: finalVideoUrl || idea.generated_video_url,
    generated_media_type: finalVideoUrl
      ? 'video'
      : carouselUrls.length > 0
      ? 'carousel'
      : storyUrls.length > 0
      ? 'story'
      : (idea.generated_media_type || 'image'),
    notebooklm_status: idea.notebooklm_video_returned_at ? 'published' : idea.notebooklm_status,
    auto_pipeline_stage: pipelineStage,
    auto_pipeline_note: pipelineNote,
    caption: finalCaption,
  };

  db.logs.unshift({
    id: 'log_' + Date.now(),
    timestamp: new Date().toISOString(),
    profile_id: userProfile.id,
    status: actuallyPublishedRemotely || !isAutopilot ? 'success' : 'skipped',
    message: pipelineNote,
    idea_id: idea.id,
  });

  saveDb(db);

  return {
    publishedToMeta,
    hasMetaApi,
    metaErrorMessage,
    finalPostId,
    finalPermalink,
    localImageUrl,
    finalVideoUrl,
    carouselUrls,
    storyUrls,
    webhookDispatched,
    webhookStatus,
    idea: db.ideas[ideaIndex],
  };
}

async function dispatchIdeaToNotebookLM(params: {
  db: DatabaseSchema;
  user: User;
  ideaIndex: number;
  baseUrl: string;
}) {
  const { db, user, ideaIndex, baseUrl } = params;
  const userIndex = db.users.findIndex(u => u.id === user.id);
  const ensuredProfile = ensureUserNotebookLMConfig(user.profile || defaultProfile);
  if (userIndex !== -1) {
    db.users[userIndex].profile = ensuredProfile;
  }

  const idea = db.ideas[ideaIndex];
  const nlm = ensuredProfile.notebooklm!;
  const { sourceDoc, videoPrompt } = buildNotebookLMPackage(idea, ensuredProfile);
  const callbackUrl = `${baseUrl}/api/notebooklm/callback?idea_id=${encodeURIComponent(idea.id)}&secret=${encodeURIComponent(nlm.callback_secret || '')}`;

  db.ideas[ideaIndex] = {
    ...idea,
    notebooklm_source_doc: sourceDoc,
    notebooklm_video_prompt: videoPrompt,
    notebooklm_dispatched_at: new Date().toISOString(),
    notebooklm_error: undefined,
  };

  let bridgeDispatched = false;
  let immediateVideoUrl = '';
  let bridgeMessage = '';

  if (nlm.bridge_url && nlm.bridge_url.trim()) {
    const check = validateExternalHttpUrl(nlm.bridge_url);
    if (!check.valid) {
      db.ideas[ideaIndex].notebooklm_status = 'failed';
      db.ideas[ideaIndex].notebooklm_error = check.error;
      saveDb(db);
      return { success: false, error: check.error, idea: db.ideas[ideaIndex], callbackUrl };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (nlm.bridge_api_key) {
        headers['Authorization'] = `Bearer ${nlm.bridge_api_key}`;
        headers['X-API-Key'] = nlm.bridge_api_key;
      }

      const payload = {
        event: 'notebooklm_create_video',
        connection_mode: nlm.connection_mode,
        idea_id: idea.id,
        notebook_id: nlm.notebook_id || '',
        notebook_url: nlm.notebook_url || '',
        source_title: `${idea.date_label} - ${idea.title}`,
        source_content: sourceDoc,
        video_prompt: videoPrompt,
        video_style: nlm.video_style || 'explainer',
        video_format: nlm.video_format || 'brief',
        language: nlm.output_language || 'fa',
        callback_url: callbackUrl,
        callback_secret: nlm.callback_secret,
        auto_publish_instagram: Boolean(nlm.auto_publish_on_return),
        instagram_handle: ensuredProfile.instagram_handle || ensuredProfile.instagram_url,
        caption: idea.caption,
        hashtags: idea.hashtags,
      };

      const resp = await fetch(check.parsed!.toString(), {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const textBody = await resp.text();
      let jsonBody: any = {};
      try {
        jsonBody = JSON.parse(textBody);
      } catch {
        jsonBody = {};
      }

      if (!resp.ok) {
        throw new Error(jsonBody.error || jsonBody.message || `خطای سرور پل NotebookLM (${resp.status})`);
      }

      bridgeDispatched = true;
      db.ideas[ideaIndex].notebooklm_job_id = jsonBody.job_id || jsonBody.id || `nlm_${Date.now()}`;

      // Check if bridge returned the generated video synchronously
      if (jsonBody.video_base64 && typeof jsonBody.video_base64 === 'string') {
        const cleanBase64 = jsonBody.video_base64.replace(/^data:video\/\w+;base64,/, '');
        const buffer = Buffer.from(cleanBase64, 'base64');
        immediateVideoUrl = safeSaveMediaFile('nlm_video', idea.id, 'mp4', buffer);
      } else if (jsonBody.video_url && typeof jsonBody.video_url === 'string') {
        const vCheck = validateExternalHttpUrl(jsonBody.video_url);
        if (vCheck.valid) {
          immediateVideoUrl = vCheck.parsed!.toString();
        }
      }

      if (immediateVideoUrl) {
        db.ideas[ideaIndex].generated_video_url = immediateVideoUrl;
        db.ideas[ideaIndex].generated_media_type = 'video';
        db.ideas[ideaIndex].notebooklm_status = 'video_ready';
        db.ideas[ideaIndex].notebooklm_video_returned_at = new Date().toISOString();
        bridgeMessage = 'دیتا به NotebookLM ارسال و ویدیوی ساخته‌شده بلافاصله دریافت شد!';
      } else {
        db.ideas[ideaIndex].notebooklm_status = 'generating_video';
        bridgeMessage = 'دیتا با موفقیت به پل NotebookLM ارسال شد. پس از اتمام رندر ویدیو، به صورت خودکار به اینجا برمی‌گردد.';
      }
    } catch (err: any) {
      db.ideas[ideaIndex].notebooklm_status = 'failed';
      db.ideas[ideaIndex].notebooklm_error = err.message || 'خطا در اتصال به پل NotebookLM';
      db.logs.unshift({
        id: 'log_' + Date.now(),
        timestamp: new Date().toISOString(),
        profile_id: ensuredProfile.id,
        status: 'failed',
        message: `خطا در ارسال ایده «${idea.title}» به پل NotebookLM: ${err.message}`,
        idea_id: idea.id,
      });
      saveDb(db);
      return { success: false, error: db.ideas[ideaIndex].notebooklm_error, idea: db.ideas[ideaIndex], callbackUrl };
    }
  } else {
    db.ideas[ideaIndex].notebooklm_status = 'dispatched';
    bridgeMessage = 'بسته منبع و پرامپت ساخت ویدیوی NotebookLM آماده شد (برای ارسال تمام‌اتوماتیک، آدرس Bridge/n8n را در تنظیمات وارد کنید).';
  }

  db.logs.unshift({
    id: 'log_' + Date.now(),
    timestamp: new Date().toISOString(),
    profile_id: ensuredProfile.id,
    status: 'success',
    message: `NotebookLM: ${bridgeMessage} («${idea.title}»)`,
    idea_id: idea.id,
  });

  saveDb(db);

  // Auto-publish if video came back synchronously and auto_publish_on_return is enabled
  let autoPublishResult: any = null;
  if (immediateVideoUrl && nlm.auto_publish_on_return) {
    autoPublishResult = await publishIdeaToInstagram({
      db,
      user,
      ideaIndex,
      baseUrl,
      videoUrlOverride: immediateVideoUrl,
    });
  }

  return {
    success: true,
    bridge_dispatched: bridgeDispatched,
    video_url: immediateVideoUrl,
    auto_published: Boolean(autoPublishResult),
    publish_result: autoPublishResult,
    message: autoPublishResult?.publishedToMeta
      ? 'ویدیو از NotebookLM دریافت و مستقیماً در اینستاگرام منتشر شد!'
      : bridgeMessage,
    callbackUrl,
    idea: db.ideas[ideaIndex],
  };
}

async function sendTelegramNotificationIfConfigured(profile: InstagramProfile, idea: ContentIdea, statusNote: string) {
  if (!profile.telegram_bot_token || !profile.telegram_chat_id) return;
  try {
    const cleanToken = profile.telegram_bot_token.trim();
    if (!/^\d+:[a-zA-Z0-9_-]{20,}$/.test(cleanToken)) return;
    const text = [
      `🤖 *اتوپایلوت روزانه اینستاگرام اجرا شد*`,
      `📌 *عنوان:* ${idea.title}`,
      `🎬 *فرمت:* ${idea.content_type}`,
      `⚡ *هوک:* ${idea.hook}`,
      `📊 *وضعیت:* ${statusNote}`,
    ].join('\n');

    await fetch(`https://api.telegram.org/bot${encodeURIComponent(cleanToken)}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: profile.telegram_chat_id.trim(),
        text,
        parse_mode: 'Markdown',
      }),
    });
  } catch (tgErr: any) {
    console.warn('Telegram notification error (non-blocking):', tgErr.message);
  }
}

async function renderAndAttachMediaForIdea(params: {
  db: DatabaseSchema;
  ideaIndex: number;
  profile: InstagramProfile;
}) {
  const { db, ideaIndex, profile } = params;
  const idea = db.ideas[ideaIndex];
  const rendered = await renderIdeaMediaAssets({
    idea,
    profile,
    mediaDir: MEDIA_DIR,
    saveFile: safeSaveMediaFile,
  });

  db.ideas[ideaIndex] = {
    ...db.ideas[ideaIndex],
    generated_media_type: rendered.generated_media_type,
    generated_image_url: rendered.generated_image_url,
    generated_carousel_urls: rendered.generated_carousel_urls,
    generated_story_urls: rendered.generated_story_urls,
    generated_video_url: rendered.generated_video_url || db.ideas[ideaIndex].generated_video_url,
    auto_pipeline_stage: 'media_ready',
    auto_pipeline_note: `فایل‌های ${idea.content_type} به‌صورت خودکار روی سرور رندر و آماده شدند.`,
  };
  saveDb(db);
  return rendered;
}

async function runFullAutopilotForUser(params: {
  db: DatabaseSchema;
  user: User;
  baseUrl: string;
  dayOverride?: string;
  triggerLabel?: string;
}) {
  const { db, user, baseUrl, dayOverride, triggerLabel = 'زمان‌بند روزانه' } = params;
  const profile = ensureUserNotebookLMConfig({
    ...defaultProfile,
    ...(user.profile || {}),
    auto_generate_media: user.profile?.auto_generate_media ?? true,
    auto_publish_daily: user.profile?.auto_publish_daily ?? true,
  });

  const userHistory = db.ideas.filter(i => i.user_id === user.id);
  const newIdea = await generateIdeaWithGemini(profile, userHistory, dayOverride);
  newIdea.user_id = user.id;
  newIdea.profile_id = profile.id;
  newIdea.auto_pipeline_stage = 'idea_ready';

  db.ideas.unshift(newIdea);
  db.logs.unshift({
    id: 'log_' + Date.now(),
    timestamp: new Date().toISOString(),
    profile_id: profile.id,
    status: 'success',
    message: `${triggerLabel}: ایده «${newIdea.title}» (${newIdea.content_type}) تولید شد.`,
    idea_id: newIdea.id,
  });
  saveDb(db);

  // Step 2: Render visual/video media automatically on server
  let renderedMedia: any = null;
  if (profile.auto_generate_media !== false) {
    try {
      renderedMedia = await renderAndAttachMediaForIdea({
        db,
        ideaIndex: 0,
        profile,
      });
    } catch (renderErr: any) {
      console.error('[Autopilot] Server media rendering failed:', renderErr.message);
      db.ideas[0].auto_pipeline_stage = 'failed';
      db.ideas[0].auto_pipeline_note = `خطا در رندر خودکار رسانه: ${renderErr.message}`;
      saveDb(db);
    }
  }

  // Step 3: NotebookLM optional bridge dispatch (for Reels/videos)
  let nlmResult: any = null;
  const waitingForAsyncNlmVideo =
    Boolean(profile.notebooklm?.enabled && profile.notebooklm?.auto_dispatch_daily && profile.notebooklm?.bridge_url?.trim());

  if (profile.notebooklm?.enabled && profile.notebooklm?.auto_dispatch_daily) {
    try {
      nlmResult = await dispatchIdeaToNotebookLM({
        db,
        user,
        ideaIndex: 0,
        baseUrl,
      });
    } catch (nlmErr: any) {
      console.warn('[Autopilot] NotebookLM dispatch failed (continuing with local media):', nlmErr.message);
    }
  }

  // Step 4: Auto-publish to Instagram (all 4 formats: Post, Carousel, Story, Reel)
  let publishResult: any = null;
  const nlmAlreadyAutoPublished = Boolean(nlmResult?.auto_published);
  const shouldWaitForNlmCallback =
    waitingForAsyncNlmVideo &&
    Boolean(profile.notebooklm?.auto_publish_on_return) &&
    !nlmResult?.video_url &&
    nlmResult?.bridge_dispatched;

  if (profile.auto_publish_daily !== false && !nlmAlreadyAutoPublished && !shouldWaitForNlmCallback) {
    publishResult = await publishIdeaToInstagram({
      db,
      user: { ...user, profile },
      ideaIndex: 0,
      baseUrl,
      isAutopilot: true,
    });
  }

  const finalIdea = db.ideas[0];
  await sendTelegramNotificationIfConfigured(
    profile,
    finalIdea,
    finalIdea.auto_pipeline_note || 'محتوای امروز آماده شد.'
  );

  return {
    idea: finalIdea,
    media: renderedMedia,
    notebooklm: nlmResult,
    publish_result: publishResult,
  };
}

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

// Register new user
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, password, display_name } = req.body;
    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return res.status(400).json({ error: 'نام کاربری باید حداقل ۳ کاراکتر باشد.' });
    }
    if (!password || typeof password !== 'string' || password.length < 4) {
      return res.status(400).json({ error: 'رمز عبور باید حداقل ۴ کاراکتر باشد.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const db = readDb();

    // Check if username exists
    if (db.users.some(u => u.username.toLowerCase() === cleanUsername)) {
      return res.status(400).json({ error: 'این نام کاربری قبلاً ثبت شده است. لطفاً نام دیگری انتخاب کنید.' });
    }

    const today = new Date().toISOString().slice(0, 10);
    const newUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const token = generateToken();

    // Initialize personal Instagram profile for the new user
    const userProfile: InstagramProfile = {
      ...defaultProfile,
      id: 'profile_' + newUserId,
      page_name: display_name ? `پیج ${display_name}` : `پیج ${cleanUsername}`,
      instagram_url: `https://instagram.com/${cleanUsername}`,
      description: 'پیج جدید در حال تنظیم استراتژی محتوا با هوش مصنوعی',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newUser: User = {
      id: newUserId,
      username: cleanUsername,
      password_hash: hashPassword(password),
      display_name: (display_name && display_name.trim()) || cleanUsername,
      role: 'user',
      credits: 5, // Welcome credits
      subscription_tier: 'free',
      daily_video_limit: 1, // Daily 1 video limit as requested
      daily_videos_used: 0,
      last_video_date: today,
      status: 'active',
      created_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
      profile: userProfile,
      token,
    };

    db.users.push(newUser);
    saveDb(db);

    res.json({
      success: true,
      token,
      user: sanitizeUser(newUser),
      message: 'ثبت‌نام با موفقیت انجام شد و ۵ سکه خوش‌آمدگویی دریافت کردید.'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'خطا در ثبت نام' });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'نام کاربری و رمز عبور الزامی است.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const db = readDb();
    const user = db.users.find(u => u.username.toLowerCase() === cleanUsername);

    if (!user) {
      return res.status(401).json({ error: 'کاربری با این مشخصات یافت نشد.' });
    }

    const expectedHash = hashPassword(password);
    if (user.password_hash !== expectedHash) {
      return res.status(401).json({ error: 'رمز عبور وارد شده نادرست است.' });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({ error: 'حساب کاربری شما توسط مدیر سیستم مسدود شده است.' });
    }

    // Refresh token and update login time
    const token = generateToken();
    user.token = token;
    user.last_login_at = new Date().toISOString();
    checkAndResetDailyQuota(user, db);

    saveDb(db);

    res.json({
      success: true,
      token,
      user: sanitizeUser(user),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'خطا در ورود' });
  }
});

// Current user profile & quota check
app.get('/api/auth/me', requireAuth, (req: any, res) => {
  res.json({
    success: true,
    user: sanitizeUser(req.user),
  });
});

// Logout
app.post('/api/auth/logout', requireAuth, (req: any, res) => {
  const db = readDb();
  const user = db.users.find(u => u.id === req.user.id);
  if (user) {
    user.token = undefined;
    saveDb(db);
  }
  res.json({ success: true });
});

// ==========================================
// ADMIN MANAGEMENT ROUTES (Requires role: admin)
// ==========================================

// Get all users with stats
app.get('/api/admin/users', requireAdmin, (req: any, res) => {
  const db = readDb();
  const usersWithStats = db.users.map(u => {
    checkAndResetDailyQuota(u, db);
    const ideaCount = db.ideas.filter(i => i.user_id === u.id).length;
    return {
      ...sanitizeUser(u),
      idea_count: ideaCount,
    };
  });

  res.json({ users: usersWithStats });
});

// Create new user by Admin
app.post('/api/admin/users', requireAdmin, (req: any, res) => {
  try {
    const { 
      username, 
      password, 
      display_name, 
      role = 'user', 
      credits = 5, 
      subscription_tier = 'free', 
      daily_video_limit = 1 
    } = req.body;

    if (!username || username.trim().length < 3) {
      return res.status(400).json({ error: 'نام کاربری باید حداقل ۳ کاراکتر باشد.' });
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ error: 'رمز عبور باید حداقل ۴ کاراکتر باشد.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const db = readDb();

    if (db.users.some(u => u.username.toLowerCase() === cleanUsername)) {
      return res.status(400).json({ error: 'کاربری با این نام کاربری از قبل وجود دارد.' });
    }

    const today = new Date().toISOString().slice(0, 10);
    const newUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    const userProfile: InstagramProfile = {
      ...defaultProfile,
      id: 'profile_' + newUserId,
      page_name: display_name ? `پیج ${display_name}` : `پیج ${cleanUsername}`,
      instagram_url: `https://instagram.com/${cleanUsername}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newUser: User = {
      id: newUserId,
      username: cleanUsername,
      password_hash: hashPassword(password),
      display_name: display_name ? display_name.trim() : cleanUsername,
      role: role === 'admin' ? 'admin' : 'user',
      credits: Number(credits) || 0,
      subscription_tier: subscription_tier || 'free',
      daily_video_limit: Number(daily_video_limit) || 1,
      daily_videos_used: 0,
      last_video_date: today,
      status: 'active',
      created_at: new Date().toISOString(),
      profile: userProfile,
    };

    db.users.push(newUser);
    saveDb(db);

    res.json({
      success: true,
      user: sanitizeUser(newUser),
      message: 'کاربر جدید با موفقیت توسط ادمین ساخته شد.'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update User (credits, plan, quota, status, password, role)
app.patch('/api/admin/users/:id', requireAdmin, (req: any, res) => {
  try {
    const { id } = req.params;
    const db = readDb();
    const userIndex = db.users.findIndex(u => u.id === id);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'کاربر مورد نظر یافت نشد.' });
    }

    const targetUser = db.users[userIndex];

    // Updates
    if (req.body.display_name !== undefined) {
      targetUser.display_name = req.body.display_name.trim();
    }

    if (req.body.role !== undefined && ['admin', 'user'].includes(req.body.role)) {
      // Prevent removing the last admin
      if (targetUser.role === 'admin' && req.body.role === 'user') {
        const adminCount = db.users.filter(u => u.role === 'admin').length;
        if (adminCount <= 1) {
          return res.status(400).json({ error: 'نمی‌توان آخرین مدیر سیستم را به کاربر عادی تنزل داد.' });
        }
      }
      targetUser.role = req.body.role;
    }

    if (req.body.subscription_tier !== undefined) {
      targetUser.subscription_tier = req.body.subscription_tier;
      // Auto adjust recommended daily limit if requested
      if (req.body.subscription_tier === 'free' && req.body.daily_video_limit === undefined) {
        targetUser.daily_video_limit = 1;
      } else if (req.body.subscription_tier === 'pro' && req.body.daily_video_limit === undefined) {
        targetUser.daily_video_limit = 3;
      } else if (req.body.subscription_tier === 'vip' && req.body.daily_video_limit === undefined) {
        targetUser.daily_video_limit = 10;
      }
    }

    if (req.body.credits !== undefined) {
      targetUser.credits = Math.max(0, Number(req.body.credits) || 0);
    }

    if (req.body.credits_delta !== undefined) {
      targetUser.credits = Math.max(0, targetUser.credits + Number(req.body.credits_delta));
    }

    if (req.body.daily_video_limit !== undefined) {
      targetUser.daily_video_limit = Math.max(1, Number(req.body.daily_video_limit) || 1);
    }

    if (req.body.daily_videos_used !== undefined) {
      targetUser.daily_videos_used = Math.max(0, Number(req.body.daily_videos_used) || 0);
    }

    if (req.body.status !== undefined && ['active', 'blocked'].includes(req.body.status)) {
      // Prevent blocking own account
      if (targetUser.id === req.user.id && req.body.status === 'blocked') {
        return res.status(400).json({ error: 'شما نمی‌توانید حساب کاربری جاری خود را مسدود کنید.' });
      }
      targetUser.status = req.body.status;
    }

    if (req.body.new_password && typeof req.body.new_password === 'string') {
      if (req.body.new_password.length < 4) {
        return res.status(400).json({ error: 'رمز عبور جدید باید حداقل ۴ کاراکتر باشد.' });
      }
      targetUser.password_hash = hashPassword(req.body.new_password);
    }

    saveDb(db);

    res.json({
      success: true,
      user: sanitizeUser(targetUser),
      message: 'اطلاعات کاربر با موفقیت به‌روزرسانی شد.'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
app.delete('/api/admin/users/:id', requireAdmin, (req: any, res) => {
  try {
    const { id } = req.params;
    const db = readDb();

    if (id === req.user.id) {
      return res.status(400).json({ error: 'امکان حذف حساب کاربری خودتان وجود ندارد.' });
    }

    const user = db.users.find(u => u.id === id);
    if (!user) {
      return res.status(404).json({ error: 'کاربر مورد نظر یافت نشد.' });
    }

    // Remove user and ideas
    db.users = db.users.filter(u => u.id !== id);
    db.ideas = db.ideas.filter(i => i.user_id !== id);

    saveDb(db);

    res.json({ success: true, message: 'کاربر و داده‌های مرتبط با موفقیت حذف شدند.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin stats overview
app.get('/api/admin/stats', requireAdmin, (req: any, res) => {
  const db = readDb();
  const totalUsers = db.users.length;
  const activeUsers = db.users.filter(u => u.status === 'active').length;
  const blockedUsers = db.users.filter(u => u.status === 'blocked').length;
  const totalCredits = db.users.reduce((acc, u) => acc + (u.credits || 0), 0);
  const totalIdeas = db.ideas.length;

  const planCounts = {
    free: db.users.filter(u => u.subscription_tier === 'free').length,
    pro: db.users.filter(u => u.subscription_tier === 'pro').length,
    vip: db.users.filter(u => u.subscription_tier === 'vip').length,
  };

  const stats: AdminStats = {
    total_users: totalUsers,
    active_users: activeUsers,
    blocked_users: blockedUsers,
    total_credits: totalCredits,
    total_ideas: totalIdeas,
    plan_counts: planCounts,
  };

  res.json({ stats });
});

// ==========================================
// USER PROFILE & INSTAGRAM SETTINGS (Per-User!)
// ==========================================

// 1. Get Profile & Status for authenticated user
app.get('/api/profile', requireAuth, (req: any, res) => {
  const db = readDb();
  const userIndex = db.users.findIndex(u => u.id === req.user.id);
  const rawUser = userIndex !== -1 ? db.users[userIndex] : (req.user as User);

  // Ensure NotebookLM config & autopilot defaults exist
  const rawEnsured = ensureUserNotebookLMConfig(rawUser.profile || defaultProfile);
  const ensuredProfile: InstagramProfile = {
    ...rawEnsured,
    auto_generate_media: rawEnsured.auto_generate_media ?? true,
    auto_publish_daily: rawEnsured.auto_publish_daily ?? true,
    autopilot_formats: rawEnsured.autopilot_formats || ['Reel', 'Carousel', 'Story', 'Post'],
  };
  const host = req.get('host') || '';
  const protocol = req.headers['x-forwarded-proto'] ? String(req.headers['x-forwarded-proto']).split(',')[0] : (req.protocol || 'https');
  const reqBaseUrl = host && !host.includes('localhost') && !host.includes('127.0.0.1') ? `${protocol}://${host}` : '';

  let dbDirty = false;
  if (userIndex !== -1 && (!rawUser.profile?.notebooklm?.callback_secret || rawUser.profile?.auto_generate_media === undefined)) {
    db.users[userIndex].profile = ensuredProfile;
    dbDirty = true;
  }
  if (reqBaseUrl && db.last_public_base_url !== reqBaseUrl) {
    db.last_public_base_url = reqBaseUrl;
    dbDirty = true;
  }
  if (dbDirty) {
    saveDb(db);
  }

  const userIdeas = db.ideas.filter(i => i.user_id === rawUser.id);

  res.json({
    profile: ensuredProfile,
    user: sanitizeUser({ ...rawUser, profile: ensuredProfile }),
    stats: {
      total_ideas: userIdeas.length,
      published_ideas: userIdeas.filter(i => i.status === 'published').length,
      in_progress_ideas: userIdeas.filter(i => i.status === 'in_progress').length,
      new_ideas: userIdeas.filter(i => i.status === 'new').length,
      scheduler_active: ensuredProfile.is_scheduler_active,
      scheduled_time: ensuredProfile.schedule_time,
    }
  });
});

// 2. Update Profile & Settings (Permanently saved to user account!)
app.put('/api/profile', requireAuth, (req: any, res) => {
  try {
    const db = readDb();
    const userIndex = db.users.findIndex(u => u.id === req.user.id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'کاربر یافت نشد' });
    }

    // Validate external URLs if provided
    const urlFieldsToCheck: Array<{ label: string; val?: string }> = [
      { label: 'آدرس پل NotebookLM', val: req.body?.notebooklm?.bridge_url },
      { label: 'آدرس وب‌هوک انتشار', val: req.body?.auto_publish_webhook },
      { label: 'آدرس وب‌هوک اطلاع‌رسانی', val: req.body?.webhook_url },
    ];
    for (const field of urlFieldsToCheck) {
      if (field.val && typeof field.val === 'string' && field.val.trim() !== '') {
        const check = validateExternalHttpUrl(field.val);
        if (!check.valid) {
          return res.status(400).json({ error: `${field.label}: ${check.error}` });
        }
      }
    }

    const currentProfile = ensureUserNotebookLMConfig(db.users[userIndex].profile || defaultProfile);
    const mergedNotebookLM = req.body.notebooklm
      ? {
          ...currentProfile.notebooklm,
          ...req.body.notebooklm,
          callback_secret: currentProfile.notebooklm?.callback_secret || crypto.randomBytes(24).toString('hex'),
        }
      : currentProfile.notebooklm;

    const updatedProfile: InstagramProfile = {
      ...currentProfile,
      ...req.body,
      id: currentProfile.id,
      notebooklm: mergedNotebookLM,
      updated_at: new Date().toISOString()
    };

    db.users[userIndex].profile = updatedProfile;
    saveDb(db);

    res.json({ 
      success: true, 
      profile: updatedProfile,
      message: 'اطلاعات و تنظیمات اینستاگرام روی حساب کاربری شما ذخیره شد.'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// IDEAS & CONTENT CREATION (Per-User!)
// ==========================================

// 3. Get Ideas / History for authenticated user
app.get('/api/ideas', requireAuth, (req: any, res) => {
  const db = readDb();
  const userId = req.user.id;
  
  // Normal users only see their own ideas; Admins can see all if ?all=true
  let results = (req.user.role === 'admin' && req.query.all === 'true')
    ? [...db.ideas]
    : db.ideas.filter(i => i.user_id === userId);

  const { search, content_type, goal, status } = req.query;

  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    results = results.filter(i => 
      i.title.toLowerCase().includes(q) ||
      i.hook.toLowerCase().includes(q) ||
      i.caption.toLowerCase().includes(q) ||
      i.hashtags.some(h => h.toLowerCase().includes(q))
    );
  }

  if (content_type && typeof content_type === 'string' && content_type !== 'all') {
    results = results.filter(i => i.content_type.toLowerCase() === content_type.toLowerCase());
  }

  if (goal && typeof goal === 'string' && goal !== 'all') {
    results = results.filter(i => i.goal.includes(goal));
  }

  if (status && typeof status === 'string' && status !== 'all') {
    results = results.filter(i => i.status === status);
  }

  results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  res.json({
    ideas: results,
    total: results.length
  });
});

// 4. Get Today's Latest Idea for authenticated user
app.get('/api/ideas/today', requireAuth, (req: any, res) => {
  const db = readDb();
  const userId = req.user.id;
  const userIdeas = db.ideas.filter(i => i.user_id === userId);

  if (userIdeas.length === 0) {
    return res.json({ idea: null });
  }

  const sorted = [...userIdeas].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  res.json({ idea: sorted[0] });
});

// 5. Generate New Idea Right Now (Checks Subscription Quota & Credits!)
app.post('/api/ideas/generate', requireAuth, async (req: any, res) => {
  try {
    const db = readDb();
    const userIndex = db.users.findIndex(u => u.id === req.user.id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'کاربر یافت نشد' });
    }

    const user = db.users[userIndex];
    checkAndResetDailyQuota(user, db);

    // Check quota for non-admins
    if (user.role !== 'admin') {
      const hasDailyQuota = user.daily_videos_used < user.daily_video_limit;
      if (hasDailyQuota) {
        // Use daily free quota
        user.daily_videos_used += 1;
      } else if (user.credits > 0) {
        // Use bonus credit
        user.credits -= 1;
      } else {
        return res.status(403).json({
          error: `سهمیه رایگان روزانه شما (${user.daily_video_limit} محتوا/ویدیو در روز) برای امروز به پایان رسیده و اعتبار کافی ندارید. جهت افزایش سهمیه روزانه یا دریافت اعتبار با ادمین سیستم تماس بگیرید.`,
          quota_exceeded: true,
          daily_videos_used: user.daily_videos_used,
          daily_video_limit: user.daily_video_limit,
          credits: user.credits,
        });
      }
    }

    // Generate idea customized for THIS user's profile and calendar
    const userHistory = db.ideas.filter(i => i.user_id === user.id);
    const dayOverride = typeof req.body?.day_of_week === 'string' ? req.body.day_of_week : undefined;
    const newIdea = await generateIdeaWithGemini(user.profile, userHistory, dayOverride);
    newIdea.user_id = user.id;
    newIdea.profile_id = user.profile.id;

    db.ideas.unshift(newIdea);
    
    // Add log
    db.logs.unshift({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      profile_id: user.profile.id,
      status: 'success',
      message: `ایده جدید با عنوان «${newIdea.title}» (${newIdea.content_type}) برای کاربر ${user.username} تولید شد.`,
      idea_id: newIdea.id
    });

    saveDb(db);

    const host = req.get('host') || `localhost:${PORT}`;
    const protocol = req.headers['x-forwarded-proto'] ? String(req.headers['x-forwarded-proto']).split(',')[0] : (req.protocol || 'https');
    const baseUrl = `${protocol}://${host}`;

    // Automatically render server-side visual/video media for the generated idea
    if (user.profile?.auto_generate_media !== false) {
      try {
        await renderAndAttachMediaForIdea({
          db,
          ideaIndex: 0,
          profile: user.profile,
        });
      } catch (renderErr: any) {
        console.warn('Auto media render on generate failed (non-blocking):', renderErr.message);
      }
    }

    if (user.profile?.notebooklm?.enabled && user.profile?.notebooklm?.auto_dispatch_daily) {
      try {
        await dispatchIdeaToNotebookLM({
          db,
          user,
          ideaIndex: 0,
          baseUrl,
        });
      } catch (nlmErr: any) {
        console.warn('Auto-dispatch to NotebookLM on generate failed (non-blocking):', nlmErr.message);
      }
    }

    if (req.body?.auto_publish === true) {
      await publishIdeaToInstagram({
        db,
        user,
        ideaIndex: 0,
        baseUrl,
        isAutopilot: true,
      });
    }

    res.json({ 
      success: true, 
      idea: db.ideas[0], 
      user: sanitizeUser(user),
      message: user.role === 'admin' 
        ? 'ایده و فایل‌های رسانه با موفقیت تولید شدند.' 
        : `ایده و رسانه تولید شد (سهمیه امروز: ${user.daily_videos_used}/${user.daily_video_limit} - اعتبار: ${user.credits})`
    });
  } catch (error: any) {
    console.error('Failed to generate idea:', error);
    res.status(500).json({ error: error.message || 'خطا در برقراری ارتباط با مدل هوش مصنوعی' });
  }
});

// 5b. Render / Re-render Server Media Assets (Post JPG, 5 Carousel Slides, 3 Story Frames, or 1080x1920 MP4 Reel)
app.post('/api/ideas/:id/render-media', requireAuth, async (req: any, res) => {
  try {
    const { id } = req.params;
    const db = readDb();
    const index = db.ideas.findIndex(i => i.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'ایده یافت نشد' });
    }
    if (req.user.role !== 'admin' && db.ideas[index].user_id && db.ideas[index].user_id !== req.user.id) {
      return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }
    await renderAndAttachMediaForIdea({
      db,
      ideaIndex: index,
      profile: req.user.profile || defaultProfile,
    });
    res.json({
      success: true,
      idea: db.ideas[index],
      message: `فایل‌های ${db.ideas[index].content_type} با کیفیت بالا رندر و ذخیره شدند.`,
    });
  } catch (error: any) {
    console.error('Render media error:', error);
    res.status(500).json({ error: error.message || 'خطا در رندر خودکار فایل رسانه' });
  }
});

// 6. Update Idea Status / Notes
app.patch('/api/ideas/:id', requireAuth, (req: any, res) => {
  try {
    const { id } = req.params;
    const db = readDb();
    const index = db.ideas.findIndex(i => i.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'ایده یافت نشد' });
    }

    // Ensure idea belongs to user or user is admin
    if (req.user.role !== 'admin' && db.ideas[index].user_id && db.ideas[index].user_id !== req.user.id) {
      return res.status(403).json({ error: 'شما مجاز به ویرایش این ایده نیستید.' });
    }

    db.ideas[index] = {
      ...db.ideas[index],
      ...req.body,
      id: db.ideas[index].id,
      user_id: db.ideas[index].user_id,
      profile_id: db.ideas[index].profile_id,
    };
    saveDb(db);
    res.json({ success: true, idea: db.ideas[index] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Delete an Idea
app.delete('/api/ideas/:id', requireAuth, (req: any, res) => {
  try {
    const { id } = req.params;
    const db = readDb();
    const idea = db.ideas.find(i => i.id === id);
    if (!idea) {
      return res.status(404).json({ error: 'ایده یافت نشد' });
    }

    if (req.user.role !== 'admin' && idea.user_id && idea.user_id !== req.user.id) {
      return res.status(403).json({ error: 'شما مجاز به حذف این ایده نیستید.' });
    }

    db.ideas = db.ideas.filter(i => i.id !== id);
    saveDb(db);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Analyze Page Bio & Strategic Recommendations
app.post('/api/profile/analyze', requireAuth, async (req: any, res) => {
  try {
    const { instagram_url, page_name, niche, description } = req.body;
    
    const prompt = `به عنوان یک مشاور ارشد الگوریتم و برندینگ اینستاگرام، اطلاعات عمومی زیر از پیج را تحلیل کن:
نام پیج: ${page_name}
آدرس پیج: ${instagram_url}
حوزه فعالیت: ${niche}
بایو یا توضیحات: ${description}

لطفاً یک تحلیل راهبردی کوتاه و کاربردی ارائه بده. هیچ داده جعلی یا غیرواقعی از فالوور یا نرخ تبدیل حدس نزن.
خروجی باید JSON با فرمت زیر باشد:
{
  "strengths": ["نقطه قوت ۱", "نقطه قوت ۲"],
  "content_opportunities": ["فرصت محتوایی ۱", "فرصت محتوایی ۲", "فرصت ۳"],
  "suggested_bio_improvement": "پیشنهاد بهبود بایو برای افزایش نرخ فالو",
  "viral_hook_patterns": ["الگوی هوک ۱ مناسب این حوزه", "الگوی هوک ۲"],
  "posting_rhythm_advice": "توصیه درباره زمان و نظم انتشار"
}`;

    let parsed: any = null;
    try {
      const response = await callGeminiWithFallback({
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });
      parsed = JSON.parse(response.text || '{}');
    } catch (e) {
      parsed = {
        strengths: [`تخصص متمرکز در حوزه ${niche || 'کسب‌وکار'}`, 'پتانسیل بالای تعامل با مخاطب هدف'],
        content_opportunities: [
          `تولید ریلزهای مقایسه‌ای و ترفندهای سریع در ${niche || 'این حوزه'}`,
          'استوری‌های پشت صحنه و پاسخ به سوالات متداول فالوورها',
          'پست‌های اسلایدی کاروسل با قابلیت سیو بالا'
        ],
        suggested_bio_improvement: `🎯 راهنمای جامع ${niche || 'شما'}\n💡 آموزش ترفندهای کاربردی روزانه\n👇 برای شروع روی لینک زیر کلیک کنید:`,
        viral_hook_patterns: [
          `«این اشتباه رو در ${niche || 'کارت'} انجام نده!»`,
          `«۳ رازی که هیچ‌کس درباره ${niche || 'این موضوع'} بهت نمیگه»`
        ],
        posting_rhythm_advice: 'انتشار ۳ الی ۴ ریلز در هفته همراه با استوری‌های تعاملی روزانه'
      };
    }

    res.json({ success: true, analysis: parsed });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'خطا در تحلیل پیج' });
  }
});

// 9. Publish Directly to Instagram (Content + Image or Video Reel 1-Click Publishing)
app.post('/api/instagram/publish', requireAuth, async (req: any, res) => {
  try {
    const { idea_id, image_data_url, video_url, caption } = req.body;
    const db = readDb();
    const ideaIndex = db.ideas.findIndex(i => i.id === idea_id);
    if (ideaIndex === -1) {
      return res.status(404).json({ error: 'ایده مورد نظر یافت نشد' });
    }

    const idea = db.ideas[ideaIndex];
    if (req.user.role !== 'admin' && idea.user_id && idea.user_id !== req.user.id) {
      return res.status(403).json({ error: 'شما اجازه انتشار این ایده را ندارید.' });
    }

    if (!idea.user_id) {
      db.ideas[ideaIndex].user_id = req.user.id;
    }

    if (video_url && typeof video_url === 'string' && !video_url.startsWith('/media/')) {
      const check = validateExternalHttpUrl(video_url);
      if (!check.valid) {
        return res.status(400).json({ error: `آدرس ویدیو نامعتبر است: ${check.error}` });
      }
    }

    const host = req.get('host') || `localhost:${PORT}`;
    const protocol = req.headers['x-forwarded-proto'] ? String(req.headers['x-forwarded-proto']).split(',')[0] : (req.protocol || 'https');
    const baseUrl = `${protocol}://${host}`;

    const result = await publishIdeaToInstagram({
      db,
      user: req.user as User,
      ideaIndex,
      baseUrl,
      overrideCaption: caption,
      imageDataUrl: image_data_url,
      videoUrlOverride: video_url,
    });

    res.json({
      success: true,
      published: true,
      published_to_meta: result.publishedToMeta,
      meta_api_configured: result.hasMetaApi,
      meta_error: result.metaErrorMessage,
      post_id: result.finalPostId,
      permalink: result.finalPermalink,
      image_url: result.localImageUrl,
      video_url: result.finalVideoUrl,
      webhook_dispatched: result.webhookDispatched,
      webhook_status: result.webhookStatus,
      idea: result.idea,
      message: result.publishedToMeta
        ? (result.finalVideoUrl ? 'ویدیوی ریلز با موفقیت در پیج اینستاگرام منتشر شد!' : 'پست با موفقیت در پیج اینستاگرام منتشر شد!')
        : 'بسته محتوا و رسانه با موفقیت رندر شد و در سامانه ذخیره گردید.'
    });
  } catch (error: any) {
    console.error('Instagram publish error:', error);
    res.status(500).json({ error: error.message || 'خطا در انتشار' });
  }
});

// ==========================================
// NOTEBOOKLM TWO-WAY VIDEO PIPELINE ROUTES
// ==========================================

// A. Dispatch Idea Data + Prompt to NotebookLM (Bridge / REST / Brief)
app.post('/api/notebooklm/dispatch', requireAuth, async (req: any, res) => {
  try {
    const { idea_id } = req.body;
    const db = readDb();
    const ideaIndex = db.ideas.findIndex(i => i.id === idea_id);
    if (ideaIndex === -1) {
      return res.status(404).json({ error: 'ایده مورد نظر یافت نشد.' });
    }

    const idea = db.ideas[ideaIndex];
    if (req.user.role !== 'admin' && idea.user_id && idea.user_id !== req.user.id) {
      return res.status(403).json({ error: 'شما اجازه دسترسی به این ایده را ندارید.' });
    }

    const host = req.get('host') || `localhost:${PORT}`;
    const protocol = req.headers['x-forwarded-proto'] ? String(req.headers['x-forwarded-proto']).split(',')[0] : (req.protocol || 'https');
    const baseUrl = `${protocol}://${host}`;

    const result = await dispatchIdeaToNotebookLM({
      db,
      user: req.user as User,
      ideaIndex,
      baseUrl,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error: any) {
    console.error('NotebookLM dispatch error:', error);
    res.status(500).json({ error: error.message || 'خطا در ارسال دیتا به NotebookLM' });
  }
});

// B. Attach / Upload Video Returned from NotebookLM (URL or Local .mp4/.webm Upload)
app.post('/api/notebooklm/attach-video', requireAuth, async (req: any, res) => {
  try {
    const { idea_id, video_url, video_base64, auto_publish = false } = req.body;
    const db = readDb();
    const ideaIndex = db.ideas.findIndex(i => i.id === idea_id);
    if (ideaIndex === -1) {
      return res.status(404).json({ error: 'ایده مورد نظر یافت نشد.' });
    }

    const idea = db.ideas[ideaIndex];
    if (req.user.role !== 'admin' && idea.user_id && idea.user_id !== req.user.id) {
      return res.status(403).json({ error: 'شما اجازه ویرایش این ایده را ندارید.' });
    }

    let storedVideoUrl = '';
    if (video_base64 && typeof video_base64 === 'string') {
      const mimeMatch = video_base64.match(/^data:video\/(mp4|webm|quicktime);base64,/);
      const ext = mimeMatch ? (mimeMatch[1] === 'quicktime' ? 'mov' : mimeMatch[1]) : 'mp4';
      const cleanBase64 = video_base64.replace(/^data:video\/[\w+-]+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      storedVideoUrl = safeSaveMediaFile('nlm_video', idea.id, ext, buffer);
    } else if (video_url && typeof video_url === 'string') {
      const check = validateExternalHttpUrl(video_url);
      if (!check.valid) {
        return res.status(400).json({ error: check.error });
      }
      storedVideoUrl = check.parsed!.toString();
    } else {
      return res.status(400).json({ error: 'لطفاً فایل ویدیو یا لینک معتبر ویدیوی NotebookLM را ارسال کنید.' });
    }

    db.ideas[ideaIndex] = {
      ...idea,
      generated_video_url: storedVideoUrl,
      generated_media_type: 'video',
      notebooklm_status: 'video_ready',
      notebooklm_video_returned_at: new Date().toISOString(),
      notebooklm_error: undefined,
    };

    db.logs.unshift({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      profile_id: req.user.profile?.id || 'profile_default',
      status: 'success',
      message: `ویدیوی NotebookLM برای ایده «${idea.title}» دریافت و در سامانه ثبت شد.`,
      idea_id: idea.id,
    });
    saveDb(db);

    let publishResult: any = null;
    if (auto_publish) {
      const host = req.get('host') || `localhost:${PORT}`;
      const protocol = req.headers['x-forwarded-proto'] ? String(req.headers['x-forwarded-proto']).split(',')[0] : (req.protocol || 'https');
      const baseUrl = `${protocol}://${host}`;
      publishResult = await publishIdeaToInstagram({
        db,
        user: req.user as User,
        ideaIndex,
        baseUrl,
        videoUrlOverride: storedVideoUrl,
      });
    }

    res.json({
      success: true,
      video_url: storedVideoUrl,
      auto_published: Boolean(publishResult),
      publish_result: publishResult,
      idea: publishResult ? publishResult.idea : db.ideas[ideaIndex],
      message: publishResult?.publishedToMeta
        ? 'ویدیوی NotebookLM ثبت و مستقیماً در اینستاگرام منتشر شد!'
        : 'ویدیوی NotebookLM با موفقیت دریافت و به ایده متصل شد.',
    });
  } catch (error: any) {
    console.error('NotebookLM attach video error:', error);
    res.status(500).json({ error: error.message || 'خطا در ذخیره ویدیوی NotebookLM' });
  }
});

// C. Authenticated Webhook Callback from NotebookLM Bridge / n8n (Returns Video -> Auto-Publishes to Instagram)
app.post('/api/notebooklm/callback', async (req, res) => {
  try {
    const ideaId = String(req.query.idea_id || req.body?.idea_id || '').trim();
    const providedSecret = String(
      req.headers['x-notebooklm-secret'] ||
      (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : '') ||
      req.query.secret ||
      req.body?.secret ||
      ''
    ).trim();

    if (!ideaId || !providedSecret) {
      return res.status(401).json({ error: 'شناسه ایده و کلید امنیتی Callback الزامی است.' });
    }

    const db = readDb();
    const ideaIndex = db.ideas.findIndex(i => i.id === ideaId);
    if (ideaIndex === -1) {
      return res.status(404).json({ error: 'ایده یافت نشد.' });
    }

    const idea = db.ideas[ideaIndex];
    const ownerUser = db.users.find(u => u.id === idea.user_id) || db.users.find(u => u.profile?.id === idea.profile_id);
    const expectedSecret = ownerUser?.profile?.notebooklm?.callback_secret;

    if (!ownerUser || !expectedSecret) {
      return res.status(403).json({ error: 'دسترسی مجاز نیست.' });
    }

    const expectedBuf = Buffer.from(expectedSecret, 'utf8');
    const providedBuf = Buffer.from(providedSecret, 'utf8');
    if (expectedBuf.length !== providedBuf.length || !crypto.timingSafeEqual(expectedBuf, providedBuf)) {
      return res.status(403).json({ error: 'کلید امنیتی Callback نامعتبر است.' });
    }

    const { video_url, video_base64, error: callbackError, auto_publish } = req.body || {};

    if (callbackError) {
      db.ideas[ideaIndex].notebooklm_status = 'failed';
      db.ideas[ideaIndex].notebooklm_error = String(callbackError);
      saveDb(db);
      return res.json({ success: false, status: 'failed', error: String(callbackError) });
    }

    let returnedVideoUrl = '';
    if (video_base64 && typeof video_base64 === 'string') {
      const cleanBase64 = video_base64.replace(/^data:video\/[\w+-]+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      returnedVideoUrl = safeSaveMediaFile('nlm_cb', idea.id, 'mp4', buffer);
    } else if (video_url && typeof video_url === 'string') {
      const check = validateExternalHttpUrl(video_url);
      if (!check.valid) {
        return res.status(400).json({ error: `آدرس ویدیوی بازگشتی نامعتبر است: ${check.error}` });
      }
      returnedVideoUrl = check.parsed!.toString();
    } else {
      return res.status(400).json({ error: 'فیلد video_url یا video_base64 در پاسخ یافت نشد.' });
    }

    db.ideas[ideaIndex] = {
      ...idea,
      generated_video_url: returnedVideoUrl,
      generated_media_type: 'video',
      notebooklm_status: 'video_ready',
      notebooklm_video_returned_at: new Date().toISOString(),
      notebooklm_error: undefined,
    };

    db.logs.unshift({
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      profile_id: ownerUser.profile.id,
      status: 'success',
      message: `ویدیو از طریق Callback از NotebookLM برای «${idea.title}» بازگشت داده شد.`,
      idea_id: idea.id,
    });
    saveDb(db);

    const shouldAutoPublish = auto_publish !== undefined
      ? Boolean(auto_publish)
      : Boolean(ownerUser.profile.notebooklm?.auto_publish_on_return);

    let publishResult: any = null;
    if (shouldAutoPublish) {
      const host = req.get('host') || `localhost:${PORT}`;
      const protocol = req.headers['x-forwarded-proto'] ? String(req.headers['x-forwarded-proto']).split(',')[0] : (req.protocol || 'https');
      const baseUrl = `${protocol}://${host}`;
      publishResult = await publishIdeaToInstagram({
        db,
        user: ownerUser,
        ideaIndex,
        baseUrl,
        videoUrlOverride: returnedVideoUrl,
      });
    }

    res.json({
      success: true,
      idea_id: idea.id,
      video_url: returnedVideoUrl,
      auto_published: Boolean(publishResult),
      published_to_meta: Boolean(publishResult?.publishedToMeta),
      permalink: publishResult?.finalPermalink,
      status: publishResult ? 'published' : 'video_ready',
    });
  } catch (error: any) {
    console.error('NotebookLM callback error:', error);
    res.status(500).json({ error: error.message || 'خطا در پردازش Callback' });
  }
});

// D. Get NotebookLM Pipeline Status & Prepared Package for an Idea
app.get('/api/notebooklm/status/:ideaId', requireAuth, (req: any, res) => {
  const db = readDb();
  const idea = db.ideas.find(i => i.id === req.params.ideaId);
  if (!idea) {
    return res.status(404).json({ error: 'ایده یافت نشد.' });
  }
  if (req.user.role !== 'admin' && idea.user_id && idea.user_id !== req.user.id) {
    return res.status(403).json({ error: 'دسترسی غیرمجاز' });
  }

  const ensuredProfile = ensureUserNotebookLMConfig(req.user.profile || defaultProfile);
  const pkg = buildNotebookLMPackage(idea, ensuredProfile);
  const host = req.get('host') || `localhost:${PORT}`;
  const protocol = req.headers['x-forwarded-proto'] ? String(req.headers['x-forwarded-proto']).split(',')[0] : (req.protocol || 'https');
  const callbackUrl = `${protocol}://${host}/api/notebooklm/callback?idea_id=${encodeURIComponent(idea.id)}&secret=${encodeURIComponent(ensuredProfile.notebooklm?.callback_secret || '')}`;

  res.json({
    idea_id: idea.id,
    notebooklm_status: idea.notebooklm_status || 'idle',
    generated_video_url: idea.generated_video_url || '',
    source_doc: idea.notebooklm_source_doc || pkg.sourceDoc,
    video_prompt: idea.notebooklm_video_prompt || pkg.videoPrompt,
    callback_url: callbackUrl,
    notebook_url: ensuredProfile.notebooklm?.notebook_url || 'https://notebooklm.google.com/',
    error: idea.notebooklm_error || '',
  });
});

// 10. Scheduler status & test dispatch (Per-User)
app.post('/api/scheduler/toggle', requireAuth, (req: any, res) => {
  const db = readDb();
  const userIndex = db.users.findIndex(u => u.id === req.user.id);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'کاربر یافت نشد' });
  }

  const current = db.users[userIndex].profile.is_scheduler_active;
  db.users[userIndex].profile.is_scheduler_active = !current;
  saveDb(db);

  res.json({ 
    success: true, 
    is_active: db.users[userIndex].profile.is_scheduler_active 
  });
});

app.post('/api/scheduler/simulate-run', requireAuth, async (req: any, res) => {
  try {
    const db = readDb();
    const userIndex = db.users.findIndex(u => u.id === req.user.id);
    const user = userIndex !== -1 ? db.users[userIndex] : (req.user as User);

    const host = req.get('host') || `localhost:${PORT}`;
    const protocol = req.headers['x-forwarded-proto'] ? String(req.headers['x-forwarded-proto']).split(',')[0] : (req.protocol || 'https');
    const baseUrl = `${protocol}://${host}`;

    const autopilotResult = await runFullAutopilotForUser({
      db,
      user,
      baseUrl,
      dayOverride: typeof req.body?.day_of_week === 'string' ? req.body.day_of_week : undefined,
      triggerLabel: 'اجرای دستی اتوپایلوت کامل',
    });

    res.json({
      success: true,
      idea: autopilotResult.idea,
      media: autopilotResult.media,
      notebooklm: autopilotResult.notebooklm,
      publish_result: autopilotResult.publish_result,
      message: autopilotResult.idea.auto_pipeline_note || 'چرخه اتوپایلوت کامل (تولید محتوا + رندر رسانه + آماده‌سازی انتشار) اجرا شد.',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/scheduler/logs', requireAuth, (req: any, res) => {
  const db = readDb();
  const userProfileId = req.user.profile.id;
  const userLogs = db.logs.filter(l => l.profile_id === userProfileId || req.user.role === 'admin');
  res.json({ logs: userLogs.slice(0, 30) });
});

// 11. Download Entire Project Source Code (.ZIP)
app.get('/api/project/download-source', (req, res) => {
  try {
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    res.attachment('instagram-ai-studio-full-source.zip');

    archive.on('error', (err: any) => {
      console.error('Archiver error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'خطا در فشرده‌سازی سورس‌کد پروژه' });
      }
    });

    archive.pipe(res);

    const projectRoot = __dirname;

    // 1. Add complete src & server directories
    archive.directory(path.join(projectRoot, 'src'), 'src');
    if (fs.existsSync(path.join(projectRoot, 'server'))) {
      archive.directory(path.join(projectRoot, 'server'), 'server');
    }

    // 2. Add public directory if exists
    if (fs.existsSync(path.join(projectRoot, 'public'))) {
      archive.directory(path.join(projectRoot, 'public'), 'public');
    }

    // 3. Add core configuration and code files
    const coreFiles = [
      'server.ts',
      'package.json',
      'tsconfig.json',
      'tsconfig.node.json',
      'vite.config.ts',
      'index.html'
    ];

    for (const f of coreFiles) {
      const p = path.join(projectRoot, f);
      if (fs.existsSync(p)) {
        archive.file(p, { name: f });
      }
    }

    // 4. Add clean sample database
    const cleanDbSample = {
      users: [
        {
          id: 'user_admin_001',
          username: 'admin',
          password_hash: hashPassword('admin123'),
          display_name: 'مدیر کل سیستم',
          role: 'admin',
          credits: 9999,
          subscription_tier: 'vip',
          daily_video_limit: 999,
          daily_videos_used: 0,
          last_video_date: new Date().toISOString().slice(0, 10),
          status: 'active',
          created_at: new Date().toISOString(),
          profile: defaultProfile
        }
      ],
      ideas: defaultSampleIdeas,
      logs: [],
      last_scheduled_check: new Date().toISOString()
    };
    archive.append(JSON.stringify(cleanDbSample, null, 2), { name: 'data/database.sample.json' });

    // 5. Add clean .env.example
    const envSample = `# کلید API گوگل جمینای
GEMINI_API_KEY=your_gemini_api_key_here

# پورت اجرای وب سرور
PORT=3000
`;
    archive.append(envSample, { name: '.env.example' });

    // 6. Add complete README.md
    const readmeDoc = `# استودیو هوشمند تولید محتوا و تقویم اینستاگرام (Instagram AI Studio)

یک سامانه جامع و فوق‌العاده فول‌استک بر پایه هوش مصنوعی Google Gemini جهت خلق خودکار سناریوها، استوری‌های ۹:۱۶، کاروسل‌های ۵ اسلایدی، ریلز ویدیویی و پوسترهای گرافیکی پیج اینستاگرام.

---

## 🌟 امکانات پروژه:
1. **تقویم محتوایی هفتگی:** برنامه‌ریزی روزهای شنبه تا جمعه با موضوعات و اهداف تفکیک‌شده.
2. **استودیو طراحی پوستر و پرامپت اختصاصی:** تعیین استایل (نئونی، شیشه‌ای، لوکس، مینیمال) و رنگ‌های برند.
3. **موتور رندر گرافیکی و انیمیشن ریلز:** ساخت تصاویر و کاروسل و ویدیوی متحرک ریلز (.webm).
4. **انتشار ۱-کلیکی امن و قانونی:** دانلود مستقیم رسانه‌ها، کپی کپشن و هشتگ‌ها و انتقال به اینستاگرام بدون کوچک‌ترین خطر بلاک یا بن پیج.
5. **سیستم کاربران و پنل مدیریت:** تفکیک سهمیه، نقش ادمین و کاربر عادی و احراز هویت مستقل.

---

## 🚀 راهنمای نصب و راه‌اندازی لوکال:

### پیش‌نیازها:
- نصب بودن **Node.js** نسخه 18 یا بالاتر.

### گام‌های اجرا:
\`\`\`bash
# ۱. نصب پکیج‌های پروژه
npm install

# ۲. ایجاد فایل تنظیمات محیطی (.env)
cp .env.example .env
# سپس کلید GEMINI_API_KEY خود را درون فایل .env قرار دهید.

# ۳. اجرای پروژه در حالت توسعه
npm run dev
\`\`\`

پس از اجرا، مرورگر خود را باز کرده و به آدرس زیر بروید:
\`http://localhost:3000\`

- نام کاربری ادمین: \`admin\`
- رمز عبور ادمین: \`admin123\`
`;
    archive.append(readmeDoc, { name: 'README.md' });

    archive.finalize();
  } catch (err: any) {
    console.error('Source code archive error:', err);
    res.status(500).json({ error: 'خطا در بسته‌بندی سورس‌کد پروژه' });
  }
});

// Background interval for Full Daily Autopilot (runs every 60s, catches up across restarts)
const triggeredUserDates = new Set<string>();
setInterval(async () => {
  try {
    const db = readDb();
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;
    const todayDateString = now.toISOString().slice(0, 10);

    for (let i = 0; i < db.users.length; i++) {
      const user = db.users[i];
      if (!user.profile?.is_scheduler_active) continue;
      if (user.status === 'blocked') continue;

      const scheduledTime = user.profile.schedule_time || '11:00';
      const triggerKey = `${user.id}_${todayDateString}`;
      const alreadyRanToday = user.last_auto_run_date === todayDateString || triggeredUserDates.has(triggerKey);

      if (currentTime >= scheduledTime && !alreadyRanToday) {
        console.log(`[Autopilot] Running full daily content + media + publish pipeline for ${user.username} (scheduled: ${scheduledTime}, now: ${currentTime})...`);
        triggeredUserDates.add(triggerKey);
        db.users[i].last_auto_run_date = todayDateString;
        saveDb(db);

        const publicBaseUrl = process.env.APP_URL || db.last_public_base_url || `http://localhost:${PORT}`;
        await runFullAutopilotForUser({
          db,
          user: db.users[i],
          baseUrl: publicBaseUrl,
          triggerLabel: `اتوپایلوت روزانه (${currentTime})`,
        });
      }
    }
  } catch (err) {
    console.error('[Scheduler] Error in interval check:', err);
  }
}, 60000);

// Setup Vite middleware in dev or serve static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
