import React, { useState } from 'react';
import { 
  Sparkles, Shield, User as UserIcon, Lock, ArrowRight, 
  CheckCircle2, AlertCircle, Eye, EyeOff, LogIn, UserPlus,
  Crown, Film, Coins, Key, ArrowLeft, X, HelpCircle
} from 'lucide-react';
import type { UserPublicInfo } from '../types.ts';

interface AuthModalProps {
  onLoginSuccess: (user: UserPublicInfo, token: string) => void;
  onClose?: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  onLoginSuccess, 
  onClose,
  initialMode = 'login' 
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Directly perform login with given credentials (1-click quick login)
  const executeLogin = async (u: string, p: string) => {
    setMode('login');
    setUsername(u);
    setPassword(p);
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u.trim(), password: p }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'خطا در ورود به حساب');
      }

      setSuccessMsg(`ورود موفقیت‌آمیز به عنوان ${data.user.display_name || u}...`);
      setTimeout(() => {
        onLoginSuccess(data.user, data.token);
      }, 400);
    } catch (err: any) {
      setError(err.message || 'خطا در ورود');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (u: string, p: string) => {
    executeLogin(u, p);
  };

  const handleSwitchToLoginWithCurrentUsername = () => {
    setMode('login');
    setError(null);
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!username.trim()) {
      setError('لطفاً نام کاربری را وارد کنید.');
      return;
    }
    if (!password) {
      setError('لطفاً رمز عبور را وارد کنید.');
      return;
    }

    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const bodyPayload = mode === 'login' 
        ? { username: username.trim(), password }
        : { username: username.trim(), password, display_name: displayName.trim() };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'خطا در ارتباط با سرور');
      }

      setSuccessMsg(mode === 'login' ? 'ورود موفقیت‌آمیز بود...' : 'ثبت‌نام با موفقیت انجام شد!');
      setTimeout(() => {
        onLoginSuccess(data.user, data.token);
      }, 500);
    } catch (err: any) {
      setError(err.message || 'خطایی رخ داد.');
    } finally {
      setLoading(false);
    }
  };

  const isUsernameTakenError = error && error.includes('قبلاً ثبت شده');

  const content = (
    <div className="max-w-md w-full z-10 space-y-6">
      
      {/* Header Branding */}
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600 shadow-xl shadow-pink-500/25 mb-1">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-l from-white via-slate-100 to-pink-300 bg-clip-text text-transparent">
          {onClose ? 'مدیریت و ورود به حساب کاربری' : 'ایجنت هوشمند اینستاگرام'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          سیستم تولید خودکار استراتژی، سناریو و انتشار محتوا با هوش مصنوعی
        </p>
      </div>

      {/* Feature Highlights Pills */}
      {!onClose && (
        <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-medium text-slate-300">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex flex-col items-center gap-1">
            <Film className="w-4 h-4 text-pink-400" />
            <span>اشتراک روزانه ۱ ویدیو</span>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex flex-col items-center gap-1">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>پنل مدیریت ادمین</span>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex flex-col items-center gap-1">
            <Coins className="w-4 h-4 text-emerald-400" />
            <span>حفظ دائمی تنظیمات پیج</span>
          </div>
        </div>
      )}

      {/* Card Form */}
      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
        
        {/* Close button if rendered as modal */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 left-4 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer z-20"
            title="بستن پنجره"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Clear Educational Hint Box */}
        <div className="mb-4 p-3 rounded-2xl bg-slate-950/90 border border-slate-800 text-[11px] text-slate-300 leading-relaxed flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white block mb-0.5">ثبت یا ورود نام کاربری و رمز عبور (Username & Password):</span>
            <p className="text-slate-400">
              این حساب کاربری مختص این نرم‌افزار است تا سهمیه روزانه، اعتبار و ایده‌های پیج شما ذخیره شود. <span className="text-emerald-400 font-semibold">برای پیج اینستاگرام نیازی به رمز عبور اینستاگرام نیست</span> و امنیت پیج شما حفظ می‌شود.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex rounded-2xl bg-slate-950 p-1 mb-5 border border-slate-800">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>ورود به حساب موجود</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>ثبت‌نام کاربر جدید</span>
            </button>
          </div>

          {/* Quick Demo Access Bar */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 mb-5">
            <div className="text-[11px] font-semibold text-slate-400 mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-pink-400" />
                <span>ورود مستقیم با ۱ کلیک:</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">بدون نیاز به تایپ رمز</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="p-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 active:scale-95 border border-purple-500/30 text-purple-300 font-semibold flex flex-col items-center justify-center gap-1 transition-all text-center disabled:opacity-50"
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>ورود به عنوان ادمین</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">admin / admin123</span>
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin('user1', '123456')}
                className="p-2 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 active:scale-95 border border-pink-500/30 text-pink-300 font-semibold flex flex-col items-center justify-center gap-1 transition-all text-center disabled:opacity-50"
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <UserIcon className="w-3.5 h-3.5 text-pink-400" />
                  <span>ورود کاربر عادی</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">user1 / 123456</span>
              </button>
            </div>
          </div>

          {/* Alert Message */}
          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span className="font-medium">{error}</span>
              </div>
              
              {/* Contextual helper if username is already taken */}
              {isUsernameTakenError && (
                <div className="pt-2 border-t border-rose-500/20 flex flex-col gap-2">
                  <p className="text-[11px] text-rose-300">
                    💡 اگر این اکانت متعلق به شماست، می‌توانید مستقیماً به زبانه ورود بروید:
                  </p>
                  <button
                    type="button"
                    onClick={handleSwitchToLoginWithCurrentUsername}
                    className="w-full py-2 px-3 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 border border-rose-400/40 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>انتقال به صفحه ورود برای «{username}»</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  نام و نام خانوادگی یا نام پیج (اختیاری)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="مثال: فروشگاه کیف و کفش یا علی رضایی"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  نام کاربری (Username)
                </label>
                {mode === 'register' && (
                  <span className="text-[10px] text-pink-400">یک نام منحصر‌به‌فرد جدید وارد کنید</span>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={e => {
                    setUsername(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder={mode === 'login' ? 'admin یا user1 یا نام کاربری شما' : 'مثال: my_page_id یا ali1403'}
                  dir="ltr"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors text-left font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  رمز عبور (Password)
                </label>
                {mode === 'login' && username === 'admin' && (
                  <button 
                    type="button" 
                    onClick={() => setPassword('admin123')}
                    className="text-[10px] text-purple-400 hover:underline font-mono"
                  >
                    درج پیش‌فرض: admin123
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="حداقل ۴ کاراکتر"
                  dir="ltr"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors pl-11 text-left font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div className="p-3 bg-pink-500/10 border border-pink-500/20 rounded-xl text-[11px] text-pink-300 space-y-1">
                <div className="flex items-center gap-1 font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>طرح اشتراک پیش‌فرض شما:</span>
                </div>
                <p>• روزانه ۱ ویدیو / ایده رایگان</p>
                <p>• ۵ سکه هدیه خوش‌آمدگویی برای تولید بیشتر</p>
                <p>• ذخیره دائمی و مستقل تنظیمات اینستاگرام شما</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>در حال پردازش...</span>
              ) : mode === 'login' ? (
                <>
                  <span>ورود به سامانه</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </>
              ) : (
                <>
                  <span>ثبت‌نام و شروع رایگان</span>
                  <Sparkles className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-500 space-y-1">
          <p>اطلاعات پیج و تنظیمات اختصاصی هر کاربر مستقل و امن ذخیره می‌شود.</p>
          <p className="text-[11px] text-slate-600">برای دسترسی به پنل مدیریت با حساب <code className="text-purple-400 font-mono">admin</code> وارد شوید.</p>
        </div>

      </div>
  );

  if (onClose) {
    return (
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
        {content}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden selection:bg-pink-500 selection:text-white" dir="rtl">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-pink-600/15 via-rose-500/10 to-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>
      {content}
    </div>
  );
};
