import React, { useState } from 'react';
import { 
  BookOpen, Terminal, Key, Clock, ShieldCheck, Copy, Check, 
  Code, Server, Database, Sparkles, Send, ExternalLink, Cpu,
  Workflow, Download, CheckCircle2, ArrowDownToLine, GitBranch,
  Layers, ArrowLeft, ArrowRight, FolderTree, FileCode, CheckCircle,
  Play, RefreshCw, Smartphone, Globe, Share2, Eye, Box, FileText,
  Sliders, Shield, Palette, Film, Calendar, Zap
} from 'lucide-react';

export const DocumentationView: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [mainDocTab, setMainDocTab] = useState<'flowchart' | 'architecture' | 'structure' | 'n8n' | 'python'>('flowchart');
  const [activeCodeTab, setActiveCodeTab] = useState<'agent' | 'scheduler' | 'api' | 'cli' | 'env' | 'n8n'>('n8n');
  const [selectedFlowStep, setSelectedFlowStep] = useState<number>(1);
  const [n8nJsonText, setN8nJsonText] = useState<string>('');

  React.useEffect(() => {
    fetch('/n8n-instagram-ai-studio.json')
      .then(res => res.text())
      .then(text => setN8nJsonText(text))
      .catch(() => {});
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const agentPythonCode = `import json
import logging
from typing import Dict, Any, List
from google import genai
from google.genai import types

class InstagramContentAgent:
    """Instagram Content Strategist Agent with Gemini 3.8 Flash"""
    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)
        self.model = "gemini-3.8-flash"

    def generate_daily_idea(self, profile: dict, history: list) -> dict:
        # Deduplication against past history
        past_titles = "\\n".join([f"- [{h['content_type']}] {h['title']}" for h in history[:20]])

        system_instruction = """تو یک مدیر ارشد استراتژی محتوا و رشد اینستاگرام (Instagram Content Strategist) هستی.
وظیفه تو تولید دقیقاً یک ایده محتوایی کاربردی، جذاب و قابل اجرا برای یک پیج است.
قوانین:
۱. از ایده‌های تکراری موجود در تاریخچه اکیداً اجتناب کن.
۲. ایده باید به شکلی باشد که کاربر امروز بتواند آن را اجرا کند.
۳. خروجی باید آبجکت JSON معتبر شامل ۱۴ فیلد مشخص باشد."""

        user_prompt = f"""پیج: {profile['page_name']}
حوزه: {profile['niche']}
مخاطب: {profile['target_audience']}
لحن: {profile['content_tone']}
اهداف: {', '.join(profile.get('page_goals', []))}

ایده‌های قبلی (تکرار نشوند):
{past_titles}

یک ایده جدید با ۱۴ فیلد الزامی (title, content_type, goal, hook, idea, script, video_script, caption, cta, visual_suggestion, hashtags, reason, difficulty, estimated_time) برگردان."""

        response = self.client.models.generate_content(
            model=self.model,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json"
            )
        )
        return json.loads(response.text)`;

  const schedulerPythonCode = `import schedule
import time
from agent import InstagramContentAgent
from database import get_profile, get_ideas, save_idea, add_log

def daily_job():
    profile = get_profile("profile_default")
    if not profile or not profile.get("is_scheduler_active", True):
        return
    
    agent = InstagramContentAgent(api_key=profile["gemini_api_key"])
    history = get_ideas("profile_default")
    
    new_idea = agent.generate_daily_idea(profile, history)
    saved = save_idea(new_idea)
    print(f"✨ ایده امروز با موفقیت در ساعت {profile['schedule_time']} تولید شد: {saved['title']}")

def start_scheduler():
    profile = get_profile("profile_default")
    target_time = profile.get("schedule_time", "11:00")
    
    schedule.every().day.at(target_time).do(daily_job)
    print(f"زمان‌بند فعال شد. زمان اجرای روزانه: {target_time}")
    
    while True:
        schedule.run_pending()
        time.sleep(30)

if __name__ == "__main__":
    start_scheduler()`;

  const apiFastapiCode = `from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
from database import get_profile, update_profile, get_ideas, save_idea
from agent import InstagramContentAgent

app = FastAPI(title="Instagram AI Agent API")

@app.get("/api/ideas/today")
def get_today_idea():
    ideas = get_ideas("profile_default")
    return {"idea": ideas[0] if ideas else None}

@app.post("/api/ideas/generate")
def generate_now(background_tasks: BackgroundTasks):
    profile = get_profile("profile_default")
    agent = InstagramContentAgent()
    history = get_ideas("profile_default")
    new_idea = agent.generate_daily_idea(profile, history)
    saved = save_idea(new_idea)
    return {"success": True, "idea": saved}`;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      
      {/* Title Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
              <GitBranch className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">فلوچارت، معماری سیستم و مستندات فنی</h2>
              <p className="text-xs text-slate-400 mt-1">دیاگرام تعاملی فرآیند، ساختار لایه‌ای پروژه، ورک‌فلو n8n و سورس پایتون</p>
            </div>
          </div>

          {/* Quick Source Download Link */}
          <a
            href="/api/project/download-source"
            download="instagram-ai-studio-full-source.zip"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-sky-300 hover:text-white transition-all cursor-pointer self-start sm:self-auto"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span>دانلود سورس پروژه (.ZIP)</span>
          </a>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 mt-6 pt-6 border-t border-slate-800/80">
          <button
            onClick={() => setMainDocTab('flowchart')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              mainDocTab === 'flowchart'
                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md shadow-pink-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>۱. فلوچارت تعاملی فرآیند</span>
          </button>

          <button
            onClick={() => setMainDocTab('architecture')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              mainDocTab === 'architecture'
                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md shadow-pink-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>۲. معماری لایه‌ای سیستم</span>
          </button>

          <button
            onClick={() => setMainDocTab('structure')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              mainDocTab === 'structure'
                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md shadow-pink-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>۳. ساختار فایل‌ها و پوشه‌ها</span>
          </button>

          <button
            onClick={() => setMainDocTab('n8n')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              mainDocTab === 'n8n'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            <span>۴. ورک‌فلو اتوماسیون n8n</span>
          </button>

          <button
            onClick={() => setMainDocTab('python')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              mainDocTab === 'python'
                ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-md shadow-slate-900/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>۵. اسکریپت‌های پایتون</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          TAB 1: INTERACTIVE FLOWCHART (فلوچارت فرآیند)
          ======================================================== */}
      {mainDocTab === 'flowchart' && (
        <div className="space-y-6">
          {/* Flowchart Overview */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-6 shadow-2xl">
            <div>
              <div className="flex items-center gap-2 text-pink-400 font-bold text-xs uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Life-Cycle Flowchart</span>
              </div>
              <h3 className="text-lg font-black text-white">
                چرخه حیات تولید محتوا: از زمان‌بند تا انتشار مستقیم اینستاگرام
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                روی هر کدام از گام‌های زیر کلیک کنید تا جزئیات فنی، ورودی‌ها، هوش مصنوعی و خروجی‌های آن مرحله را مشاهده کنید:
              </p>
            </div>

            {/* Visual Step Progress Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {[
                { step: 1, title: 'تحریک اولیه', desc: 'زمان‌بند یا کلیک', icon: Clock, color: 'text-amber-400', border: 'border-amber-500/30' },
                { step: 2, title: 'کانتکست پیج', desc: 'پروفایل + تقویم', icon: Sliders, color: 'text-sky-400', border: 'border-sky-500/30' },
                { step: 3, title: 'رفع تکرار', desc: 'بررسی ۲۰ ایده قبلی', icon: ShieldCheck, color: 'text-indigo-400', border: 'border-indigo-500/30' },
                { step: 4, title: 'استراتژیست AI', desc: 'Gemini 3.8 Flash', icon: Sparkles, color: 'text-pink-400', border: 'border-pink-500/30' },
                { step: 5, title: 'طراحی پوستر', desc: 'موتور کانواس + ریلز', icon: Film, color: 'text-purple-400', border: 'border-purple-500/30' },
                { step: 6, title: 'انتشار چندگانه', desc: 'API / وب‌هوک / اپ', icon: Send, color: 'text-emerald-400', border: 'border-emerald-500/30' },
              ].map((item) => {
                const IconComponent = item.icon;
                const isSelected = selectedFlowStep === item.step;
                return (
                  <button
                    key={item.step}
                    onClick={() => setSelectedFlowStep(item.step)}
                    className={`p-3 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between h-24 ${
                      isSelected
                        ? `bg-slate-800 ${item.border} ring-2 ring-pink-500/50 shadow-lg`
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-pink-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                        گام {item.step}
                      </span>
                      <IconComponent className={`w-3.5 h-3.5 ${item.color}`} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{item.title}</div>
                      <div className="text-[10px] text-slate-400">{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Step Deep Dive Card */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 space-y-4">
              {selectedFlowStep === 1 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs">۱</span>
                    <h4 className="text-sm font-bold text-white">گام اول: تحریک فرآیند (Process Triggering)</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    سیستم تولید محتوا به سه شکل مجزا قابلیت شروع فعالیت دارد:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="font-bold text-amber-400 block mb-1">⏰ زمان‌بند سرور (Cron Job)</span>
                      ماژول درونی <code className="text-sky-300">node-cron</code> در سرور Express رأس ساعت مشخص‌شده کاربر در تنظیمات (مثلاً ۱۱:۰۰) فراخوانی می‌شود.
                    </div>
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="font-bold text-pink-400 block mb-1">👆 درخواست دستی کاربر</span>
                      کاربر با کلیک روی دکمه «تولید سناریو» در هدر یا داشبورد اندپوینت <code className="text-sky-300">/api/ideas/generate</code> را فعال می‌کند.
                    </div>
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="font-bold text-emerald-400 block mb-1">⚡ وب‌هوک و n8n خارجی</span>
                      سیستم‌های اتوماسیون با ارسال درخواست HTTP POST همراه با Bearer Token از راه دور سناریو تولید می‌کنند.
                    </div>
                  </div>
                </div>
              )}

              {selectedFlowStep === 2 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-300 flex items-center justify-center font-bold text-xs">۲</span>
                    <h4 className="text-sm font-bold text-white">گام دوم: واکشی پروفایل، پرامپت‌ها و تقویم محتوایی</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    سیستم هوش مصنوعی به هیچ عنوان بدون کانتکست عمل نمی‌کند. در این مرحله پارامترهای زیر از <code className="text-pink-300">data/database.json</code> لود می‌شوند:
                  </p>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <li><b className="text-white">هویت پیج:</b> موضوع (Niche)، پرسونای مخاطب (Target Audience)، لحن بیان (Content Tone) و اهداف تجاری (Page Goals).</li>
                    <li><b className="text-white">تقویم ۷ روزه:</b> تشخیص روز هفته (مثلاً دوشنبه) و لود کردن نوع محتوای اختصاصی آن روز (ریلز آموزشی، کاروسل چالشی، استوری تعاملی).</li>
                    <li><b className="text-white">دستورالعمل پوستر:</b> سبک تم رنگی انتخاب‌شده برای روز مورد نظر (نئون، مینیمال، رزگلد، لوکس).</li>
                  </ul>
                </div>
              )}

              {selectedFlowStep === 3 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs">۳</span>
                    <h4 className="text-sm font-bold text-white">گام سوم: الگوریتم ضدهرزنامه و رفع تکرار (Deduplication Engine)</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    برای اینکه پیج هرگز موضوع تکراری منتشر نکند:
                  </p>
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
                    <div className="flex items-center gap-2 text-indigo-300 font-bold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>استخراج بلک‌لیست از دیتابیس</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      ۲۰ ایده و عنوان اخیراً منتشرشده یا ذخیره‌شده لود شده و در بخش Negative Constraints پرامپت Gemini قرار می‌گیرد.
                      مدل موظف است زاویه دید (Angle)، قلاب جلب توجه (Hook) و استدلال متفاوتی خلق نماید.
                    </p>
                  </div>
                </div>
              )}

              {selectedFlowStep === 4 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-pink-500/20 text-pink-300 flex items-center justify-center font-bold text-xs">۴</span>
                    <h4 className="text-sm font-bold text-white">گام چهارم: استراتژیست ارشد محتوا (Gemini 3.8 Flash)</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    موتور هوش مصنوعی به عنوان مدیر ارشد رشد اینستاگرام فراخوانی می‌شود و با پاسخ ساختاریافته (JSON Strict Mode) ۱۴ فیلد عملیاتی تولید می‌کند:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <span className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-slate-200 font-mono">title (عنوان)</span>
                    <span className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-slate-200 font-mono">hook (قلاب ۳ ثانیه)</span>
                    <span className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-slate-200 font-mono">script (متن اسلایدها)</span>
                    <span className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-slate-200 font-mono">video_script (سناریو ویدیو)</span>
                    <span className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-slate-200 font-mono">caption (کپشن حرفه‌ای)</span>
                    <span className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-slate-200 font-mono">cta (دعوت به اقدام)</span>
                    <span className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-slate-200 font-mono">hashtags (هشتگ‌ها)</span>
                    <span className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-slate-200 font-mono">visual_suggestion (پرامپت)</span>
                  </div>
                </div>
              )}

              {selectedFlowStep === 5 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-xs">۵</span>
                    <h4 className="text-sm font-bold text-white">گام پنجم: رندر پوستر، انیماتور ریلز و بوم Canvas</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    متن به تنهایی در اینستاگرام کافی نیست؛ بنابراین موتور بصری وارد عمل می‌شود:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                      <b className="text-purple-300 block">🎨 موتور پوستر گرافیکی HTML5 Canvas:</b>
                      <p className="text-[11px] text-slate-400">
                        ترکیب هوشمند تایتل، هوک طلایی، لوگو، آی‌دی پیج و گرادیان با نسبت ابعاد رسمی ۱۰۸۰×۱۹۲۰ ریلز با امکان دانلود مستقیم PNG.
                      </p>
                    </div>
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                      <b className="text-pink-300 block">🎬 انیماتور ویدیویی ۵۰ ثانیه‌ای ریلز:</b>
                      <p className="text-[11px] text-slate-400">
                        تجزیه سناریو به ۴ صحنه کلیدی، انیمیشن تایپوگرافی زنده و قابلیت رکورد و دانلود به فرمت ویدیویی استاندارد <code className="text-sky-300">.webm</code>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedFlowStep === 6 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs">۶</span>
                    <h4 className="text-sm font-bold text-white">گام ششم: کانال‌های انتشار و آرشیو دیتابیس</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    کاربر یا سیستم بر اساس تنظیمات، یکی از ۳ مسیر انتشار را برمی‌گزیند:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="font-bold text-pink-400 block mb-1">۱. انتشار مستقیم اینستاگرام</span>
                      از طریق توکن رسمی Meta Graph API مستقیماً در پیج تجاری (Business Profile) پابلیش می‌شود.
                    </div>
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="font-bold text-indigo-400 block mb-1">۲. ارسال به اتوماسیون n8n</span>
                      پوستر، کپشن و هشتگ‌ها به وب‌هوک n8n ارسال شده تا در کانال تلگرام، گوگل شیت یا اپ‌های دیگر پخش شوند.
                    </div>
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="font-bold text-sky-400 block mb-1">۳. آرشیو و کپی دستی در اپ</span>
                      کپی آنی کپشن و هشتگ‌ها در کلیپ‌بورد با یک کلیک + باز کردن اپلیکیشن موبایل اینستاگرام بدون کوچک‌ترین ریسک مسدودی پیج.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ASCII / Visual Flow Diagram */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs text-sky-300 dir-ltr overflow-x-auto leading-relaxed">
              <pre className="text-[11px] text-slate-300">
{`+-----------------------------------------------------------------------------------------+
|                                    1. TRIGGER PHASE                                     |
|  [Cron Schedule (Daily 11:00)]  OR  [User Manual Click]  OR  [External n8n / Webhook]   |
+--------------------------------------------+--------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
|                                    2. CONTEXT LOAD                                      |
|  * Page Profile (Niche, Tone, Goals)                                                    |
|  * 7-Day Content Calendar Plan (e.g. Monday: Educational Reels)                          |
|  * Deduplication Engine (Fetch Last 20 Past Ideas Blacklist)                            |
+--------------------------------------------+--------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
|                               3. AI STRATEGIST ENGINE                                   |
|  * Google GenAI SDK -> Model: gemini-3.8-flash                                          |
|  * Output: 14 Strict JSON Fields (Title, Hook, Script, Video, Caption, CTA, Hashtags)   |
+--------------------------------------------+--------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
|                           4. VISUAL & MEDIA GENERATION                                  |
|  * HTML5 Canvas Poster Engine (1080x1920 High-Res PNG)                                  |
|  * 50-Second Reels Interactive Animator (Typography + WebM Video Recording)             |
+--------------------------------------------+--------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
|                                5. MULTI-CHANNEL OUTPUT                                  |
|     +---------------------------+---------------------------+---------------------+     |
|     | Meta Instagram Graph API  | n8n Webhook / Automation  | Mobile Copy & Paste |     |
|     +---------------------------+---------------------------+---------------------+     |
|                                             |                                           |
|                                             v                                           |
|                     [Database Storage: data/database.json]                              |
|                     [User Credits & Quota Deduction Update]                             |
+-----------------------------------------------------------------------------------------+`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: SYSTEM ARCHITECTURE (معماری لایه‌ای)
          ======================================================== */}
      {mainDocTab === 'architecture' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-6 shadow-2xl">
            <div>
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider mb-1">
                <Layers className="w-3.5 h-3.5" />
                <span>Layered System Architecture</span>
              </div>
              <h3 className="text-lg font-black text-white">معماری ۵ لایه‌ای نرم‌افزار InstaIdea AI Studio</h3>
              <p className="text-xs text-slate-400 mt-1">
                این پروژه بر اساس اصول مهندسی نرم‌افزار مدرن، به ۵ لایه مجزا با مسئولیت مشخص (Separation of Concerns) تقسیم شده است:
              </p>
            </div>

            <div className="space-y-4">
              
              {/* Layer 1: Presentation Layer */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-pink-500/20 text-pink-400 text-xs flex items-center justify-center font-bold">۱</span>
                    <h4 className="text-sm font-bold text-white">لایه نمایش و رابط کاربری (Frontend Presentation Layer)</h4>
                  </div>
                  <span className="text-[10px] font-mono text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">
                    React 19 • Vite • Tailwind CSS
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  مسئول ارائه تجربه کاربری روان، ۳ پوسته بصری (تیره، روشن، غروب مخملی)، تقویم هفتگی درگ‌اند‌دراپ و ادیتور زنده سناریو.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 text-[11px] text-slate-400">
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <b className="text-slate-200 block">DashboardView.tsx</b>
                    کارت سناریو، پیش‌نمایش ریلز و انتشار
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <b className="text-slate-200 block">ContentCalendarView.tsx</b>
                    تقویم ۷ روزه، تنظیمات پوستر هر روز
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <b className="text-slate-200 block">SettingsView & Admin.tsx</b>
                    پیکربندی هویت پیج و مدیریت کاربران
                  </div>
                </div>
              </div>

              {/* Layer 2: API & Gateway Layer */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 text-xs flex items-center justify-center font-bold">۲</span>
                    <h4 className="text-sm font-bold text-white">لایه سرور، احراز هویت و گیت‌وی (Server & Gateway Layer)</h4>
                  </div>
                  <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                    Express.js • Node.js • JWT • Node-Cron
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  فایل <code className="text-sky-300">server.ts</code> درگاه ورود تمامی درخواست‌ها است؛ شامل سیستم احراز هویت با توکن امضاشده JWT، حفاظت از کلید‌های API، زمان‌بند پس‌زمینه روزانه، و مسیر دانلود زیپ سورس کامل پروژه.
                </p>
              </div>

              {/* Layer 3: AI Intelligence Layer */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 text-xs flex items-center justify-center font-bold">۳</span>
                    <h4 className="text-sm font-bold text-white">لایه منطق و هوش مصنوعی (AI Intelligence & Strategist Layer)</h4>
                  </div>
                  <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                    @google/genai • Gemini 3.8 Flash
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  استفاده از آخرین نسخه رسمی SDK هوش مصنوعی گوگل برای سناریونویسی با پرامپت مهندسی‌شده، اعتبارسنجی خروجی ساختاریافته JSON و الگوریتم فیلتر ایده‌های تکراری.
                </p>
              </div>

              {/* Layer 4: Storage & State Layer */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center font-bold">۴</span>
                    <h4 className="text-sm font-bold text-white">لایه داده و پایدارسازی (Persistence & Data Store Layer)</h4>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    ACID Atomic JSON DB • File System
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  پایگاه داده سبک و مقاوم در <code className="text-amber-300">data/database.json</code> با تفکیک کاربران، ایده‌ها، سهمیه روزانه و رسانه‌ها در پوشه <code className="text-amber-300">data/media/</code>.
                </p>
              </div>

              {/* Layer 5: External Bridges Layer */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold">۵</span>
                    <h4 className="text-sm font-bold text-white">لایه ارتباطات خارجی و اتوماسیون (External Bridges & Automation)</h4>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Meta Graph API • n8n Workflow • Webhooks
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  اتصال به اکانت بیزینس اینستاگرام، امکان ارسال پوستر و کپشن به اتوماسیون n8n برای انتشار خودکار یا ارسال به بات تلگرام.
                </p>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: DIRECTORY & FILE STRUCTURE (ساختار فایل‌ها)
          ======================================================== */}
      {mainDocTab === 'structure' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-6 shadow-2xl">
            <div>
              <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider mb-1">
                <FolderTree className="w-3.5 h-3.5" />
                <span>Project Directory Tree</span>
              </div>
              <h3 className="text-lg font-black text-white">ساختار و وظایف فایل‌های پروژه</h3>
              <p className="text-xs text-slate-400 mt-1">
                نقشه کامل مسیرها و وظیفه هر فایل در معماری این پروژه:
              </p>
            </div>

            <div className="space-y-3 text-xs">
              
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 font-mono">
                <div className="text-emerald-400 font-bold dir-ltr text-left">/ (Workspace Root)</div>
                <div className="text-slate-300 space-y-2 dir-ltr text-left pl-3 border-l border-slate-800 text-[11px]">
                  <div>├── <b className="text-pink-400">server.ts</b> <span className="text-slate-400 font-sans">← سرور فول‌استک Express، مدیریت هوش مصنوعی Gemini، احراز هویت، دانلود سورس، انتشار اینستاگرام و زمان‌بند Cron</span></div>
                  <div>├── <b className="text-sky-400">package.json</b> <span className="text-slate-400 font-sans">← لیست پکیج‌ها (react 19, @google/genai, express, lucide-react, archiver)</span></div>
                  <div>├── <b className="text-amber-400">vite.config.ts</b> <span className="text-slate-400 font-sans">← پیکربندی Vite و پورت ۳۰۰۰</span></div>
                  <div>├── <b className="text-purple-400">public/</b></div>
                  <div>│   └── <b className="text-emerald-300">n8n-instagram-ai-studio.json</b> <span className="text-slate-400 font-sans">← فایل آماده ایمپورت ورک‌فلو اتوماسیون ۹ نودی در n8n</span></div>
                  <div>├── <b className="text-purple-400">data/</b> <span className="text-slate-400 font-sans">← دایرکتوری پایگاه داده محلی</span></div>
                  <div>│   ├── <b className="text-amber-300">database.json</b> <span className="text-slate-400 font-sans">← دیتابیس کاربران، سناریوها، تقویم و لاگ‌ها</span></div>
                  <div>│   └── <b className="text-amber-300">media/</b> <span className="text-slate-400 font-sans">← تصاویر و پوسترهای کش‌شده</span></div>
                  <div>├── <b className="text-purple-400">python_backend/</b> <span className="text-slate-400 font-sans">← نسخه مستقل پایتون (FastAPI + Agent + Scheduler)</span></div>
                  <div>│   ├── <b className="text-slate-300">agent.py</b>, <b className="text-slate-300">scheduler.py</b>, <b className="text-slate-300">api.py</b>, <b className="text-slate-300">database.py</b></div>
                  <div>├── <b className="text-purple-400">src/</b> <span className="text-slate-400 font-sans">← کد فرانت‌اند ری‌اکت</span></div>
                  <div>│   ├── <b className="text-pink-400">App.tsx</b> <span className="text-slate-400 font-sans">← روت اصلی، استیت کلی، تم‌ها (dark, light, sunset)</span></div>
                  <div>│   ├── <b className="text-pink-400">types.ts</b> <span className="text-slate-400 font-sans">← تعاریف تایپ اسکریپت مدل‌ها (ContentIdea, Profile, User, Calendar)</span></div>
                  <div>│   ├── <b className="text-pink-400">index.css</b> <span className="text-slate-400 font-sans">← استایل‌های Tailwind v4 و متغیرهای تم روشن و غروب</span></div>
                  <div>│   └── <b className="text-purple-400">components/</b></div>
                  <div>│       ├── <b className="text-white">Header.tsx</b> <span className="text-slate-400 font-sans">← نویگیشن، وضعیت موجودی، سوئیچر ۳ تم، منوی اکانت</span></div>
                  <div>│       ├── <b className="text-white">DashboardView.tsx</b> <span className="text-slate-400 font-sans">← پیشخوان امروز، ریلز انیماتور، دکمه تولید</span></div>
                  <div>│       ├── <b className="text-white">TodayIdeaCard.tsx</b> <span className="text-slate-400 font-sans">← کارت جامع ۱۴ فیلدی سناریو با ادیتور و رندر پوستر</span></div>
                  <div>│       ├── <b className="text-white">ContentCalendarView.tsx</b> <span className="text-slate-400 font-sans">← تقویم محتوایی ۷ روزه و تنظیمات پرامپت پوستر</span></div>
                  <div>│       ├── <b className="text-white">HistoryView.tsx</b> <span className="text-slate-400 font-sans">← آرشیو و فیلتر ایده‌های گذشته</span></div>
                  <div>│       ├── <b className="text-white">SettingsView.tsx</b> <span className="text-slate-400 font-sans">← تنظیمات هویت پیج، توکن فیس‌بوک و وب‌هوک</span></div>
                  <div>│       ├── <b className="text-white">DocumentationView.tsx</b> <span className="text-slate-400 font-sans">← فلوچارت تعاملی، معماری، مستندات n8n و پایتون</span></div>
                  <div>│       ├── <b className="text-white">PublishModal.tsx</b> <span className="text-slate-400 font-sans">← پنجره انتشار به Graph API و وب‌هوک</span></div>
                  <div>│       └── <b className="text-white">AdminPanelView.tsx</b> <span className="text-slate-400 font-sans">← پنل مدیریت کاربران و سکه‌ها</span></div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 4: n8n AUTOMATION WORKFLOW
          ======================================================== */}
      {mainDocTab === 'n8n' && (
        <div className="space-y-6">
          {/* n8n Full Automation Workflow Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950/60 via-slate-900/90 to-purple-950/40 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
                  <Workflow className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white">ورک‌فلو آماده n8n برای اتوماسیون کامل اینستاگرام</h3>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">آماده ایمپورت</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">تولید خودکار روزانه طبق تقویم ۷ روزه + اتصال به Gemini AI + خروجی تلگرام و وب‌هوک</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="/n8n-instagram-ai-studio.json"
                  download="n8n-instagram-ai-studio.json"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold text-xs shadow-lg shadow-pink-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  دانلود فایل n8n (.json)
                </a>
                <button
                  onClick={() => copyToClipboard(n8nJsonText || '', 'n8n_full_copy')}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                >
                  {copiedKey === 'n8n_full_copy' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">کپی شد!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>کپی JSON برای n8n</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Nodes breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-indigo-500/20">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs mb-1.5">
                  <Clock className="w-4 h-4" />
                  <span>۱. تریگر روزانه و وب‌هوک</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  اجرای هر روز رأس ساعت ۹ صبح با Cron Trigger یا اجرای در لحظه با وب‌هوک دستی.
                </p>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-2xl border border-indigo-500/20">
                <div className="flex items-center gap-2 text-pink-400 font-bold text-xs mb-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>۲. موتور تقویم و Gemini AI</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  تطبیق روز هفته با موضوع تقویم (شنبه تا جمعه)، استایل پوستر و فراخوانی مدل جمینای.
                </p>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-2xl border border-indigo-500/20">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-1.5">
                  <Send className="w-4 h-4" />
                  <span>۳. فرمت‌بندی و ارسال</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  تولید کپشن، هوک و هشتگ‌ها و ارسال خودکار به ربات تلگرام یا پاسخ ساختاریافته به وب‌هوک.
                </p>
              </div>
            </div>

            {/* How to import to n8n */}
            <div className="bg-slate-950/90 rounded-2xl p-4 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-amber-300 block">نحوه اجرای ورک‌فلو در n8n:</span>
              <div className="text-[11px] text-slate-300 space-y-1.5 list-decimal list-inside">
                <div>۱. وارد پنل n8n خود شوید و یک ورک‌فلو خالی ایجاد کنید.</div>
                <div>۲. فایل دانلودشده <code className="text-pink-300 bg-slate-900 px-1 rounded">n8n-instagram-ai-studio.json</code> را با کشیدن و رها کردن (Drag & Drop) یا از منوی سه‌نقطه &gt; <b>Import from File</b> بارگذاری کنید (یا مستقیماً کپی و روی صفحه n8n کلید <code className="text-sky-300 bg-slate-900 px-1 rounded">Ctrl+V</code> را بزنید).</div>
                <div>۳. در نود <span className="text-purple-300 font-bold">پیکربندی پیج و تقویم (Profile & Settings)</span>، مقادیر <code className="text-emerald-400">gemini_api_key</code> و آیدی اینستاگرام خود را وارد کنید.</div>
                <div>۴. دکمه <b>Save</b> و سپس <b>Active</b> را در بالای n8n بزنید تا سیستم خودکار فعال شود!</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 5: PYTHON BACKEND & SCRIPTS
          ======================================================== */}
      {mainDocTab === 'python' && (
        <div className="space-y-6">
          {/* Step 1: Getting Gemini API Key */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Key className="w-4 h-4 text-amber-400" />
          <span>گام اول: دریافت کلید Gemini API</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          برای اتصال ایجنت به مدل پیشرفته <span className="font-mono text-pink-400">gemini-3.8-flash</span>، ابتدا باید یک کلید API دریافت کنید:
        </p>
        <ol className="list-decimal list-inside text-xs text-slate-300 space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
          <li>وارد سایت <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-pink-400 underline inline-flex items-center gap-1">Google AI Studio <ExternalLink className="w-3 h-3" /></a> شوید.</li>
          <li>روی دکمه <b>Get API key</b> کلیک کنید.</li>
          <li>یک پروژه انتخاب کرده و کلید جدید بسازید.</li>
          <li>کلید را در متغیر محیطی <code className="text-emerald-400 bg-slate-900 px-1.5 py-0.5 rounded">GEMINI_API_KEY</code> قرار دهید.</li>
        </ol>
      </div>

      {/* Step 2: Environment Variables */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>گام دوم: تنظیم متغیرهای محیطی (.env)</span>
          </div>
          <button
            onClick={() => copyToClipboard(`GEMINI_API_KEY="your_api_key_here"\nDATABASE_PATH="instagram_agent.db"\nAPI_PORT=8000\nTELEGRAM_BOT_TOKEN=""\nTELEGRAM_CHAT_ID=""`, 'env_copy')}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
          >
            {copiedKey === 'env_copy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            کپی نمونه env
          </button>
        </div>
        <pre className="bg-slate-950 text-slate-200 text-xs p-4 rounded-2xl border border-slate-800 font-mono dir-ltr overflow-x-auto">
{`# Gemini API Key (گرفته شده از Google AI Studio)
GEMINI_API_KEY="AIzaSyYourSecretKey..."

# مسیر پایگاه داده SQLite
DATABASE_PATH="instagram_agent.db"

# پورت سرور API
API_HOST="0.0.0.0"
API_PORT=8000

# تنظیمات ارسال تلگرام (در صورت تمایل)
TELEGRAM_BOT_TOKEN="123456789:ABCdef..."
TELEGRAM_CHAT_ID="987654321"`}
        </pre>
      </div>

      {/* Step 3: Installation & Running */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Terminal className="w-4 h-4 text-sky-400" />
          <span>گام سوم: دستورات ترمینال برای نصب و اجرا</span>
        </div>

        <div className="space-y-3">
          <div>
            <span className="text-xs text-slate-400 block mb-1">۱. نصب وابستگی‌های پایتون:</span>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-pink-300 dir-ltr flex justify-between items-center">
              <span>pip install -r python_backend/requirements.txt</span>
              <button onClick={() => copyToClipboard('pip install -r python_backend/requirements.txt', 'pip_copy')}>
                {copiedKey === 'pip_copy' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-500" />}
              </button>
            </div>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-1">۲. تست و اجرای دستی ایجنت در ترمینال:</span>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-emerald-300 dir-ltr flex justify-between items-center">
              <span>python python_backend/cli.py generate</span>
              <button onClick={() => copyToClipboard('python python_backend/cli.py generate', 'cli_copy')}>
                {copiedKey === 'cli_copy' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-500" />}
              </button>
            </div>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-1">۳. اجرای سرور وب FastAPI:</span>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-sky-300 dir-ltr flex justify-between items-center">
              <span>python -m uvicorn python_backend.api:app --host 0.0.0.0 --port 8000 --reload</span>
              <button onClick={() => copyToClipboard('python -m uvicorn python_backend.api:app --host 0.0.0.0 --port 8000 --reload', 'uvicorn_copy')}>
                {copiedKey === 'uvicorn_copy' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-500" />}
              </button>
            </div>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-1">۴. اجرای سرویس زمان‌بند روزانه (Scheduler Background Worker):</span>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-amber-300 dir-ltr flex justify-between items-center">
              <span>nohup python python_backend/scheduler.py &gt; scheduler.log 2&gt;&amp;1 &amp;</span>
              <button onClick={() => copyToClipboard('nohup python python_backend/scheduler.py > scheduler.log 2>&1 &', 'nohup_copy')}>
                {copiedKey === 'nohup_copy' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-500" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Step 4: Python Source Code Inspection */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Code className="w-4 h-4 text-rose-400" />
            <span>مشاهده کدهای پایتون موجود در پروژه</span>
          </div>

          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs gap-1">
            <button
              onClick={() => setActiveCodeTab('n8n')}
              className={`px-3 py-1 rounded-lg ${activeCodeTab === 'n8n' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'}`}
            >
              n8n-workflow.json
            </button>
            <button
              onClick={() => setActiveCodeTab('agent')}
              className={`px-3 py-1 rounded-lg ${activeCodeTab === 'agent' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'}`}
            >
              agent.py
            </button>
            <button
              onClick={() => setActiveCodeTab('scheduler')}
              className={`px-3 py-1 rounded-lg ${activeCodeTab === 'scheduler' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'}`}
            >
              scheduler.py
            </button>
            <button
              onClick={() => setActiveCodeTab('api')}
              className={`px-3 py-1 rounded-lg ${activeCodeTab === 'api' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'}`}
            >
              api.py
            </button>
          </div>
        </div>

        <div className="relative">
          <pre className="bg-slate-950 text-slate-300 text-xs p-4 rounded-2xl border border-slate-800 font-mono dir-ltr overflow-x-auto max-h-96">
            {activeCodeTab === 'n8n' && (n8nJsonText || 'در حال بارگذاری فایل JSON...')}
            {activeCodeTab === 'agent' && agentPythonCode}
            {activeCodeTab === 'scheduler' && schedulerPythonCode}
            {activeCodeTab === 'api' && apiFastapiCode}
          </pre>
          <button
            onClick={() => copyToClipboard(
              activeCodeTab === 'n8n' ? (n8nJsonText || '') : activeCodeTab === 'agent' ? agentPythonCode : activeCodeTab === 'scheduler' ? schedulerPythonCode : apiFastapiCode,
              'tab_copy'
            )}
            className="absolute left-4 top-4 p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 border border-slate-700"
          >
            {copiedKey === 'tab_copy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            کپی فایل
          </button>
        </div>
      </div>

      {/* How Deduplication Works */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-pink-400" />
          مکانیزم هوشمند جلوگیری از تولید ایده‌های تکراری (Deduplication)
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          یکی از مهم‌ترین وظایف ایجنت این است که هر روز ایده‌ای نو و متفاوت ارائه دهد. برای تحقق این هدف:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300 pt-2">
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <span className="font-bold text-pink-400 block mb-1">۱. خواندن تاریخچه</span>
            ایجنت قبل از هر فراخوانی، ۲۰ ایده قبلی ذخیره‌شده در دیتابیس را لود می‌کند.
          </div>
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <span className="font-bold text-purple-400 block mb-1">۲. ارسال به پرامپت Gemini</span>
            عناوین، اهداف و فرمت‌های گذشته به عنوان لیست منفی (Blacklist) ارسال می‌شوند.
          </div>
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <span className="font-bold text-emerald-400 block mb-1">۳. زاویه دید نو</span>
            هوش مصنوعی موظف می‌شود زاویه دید، هوک اولیه و راهکار متفاوتی برای امروز خلق کند.
          </div>
        </div>
      </div>
    </div>
  )}

    </div>
  );
};

