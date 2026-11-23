import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from config import GEMINI_API_KEY, GEMINI_MODEL

logger = logging.getLogger("InstagramAgent")
logging.basicConfig(level=logging.INFO)

class InstagramContentAgent:
    """
    AI Agent حرفه‌ای استراتژیست محتوای اینستاگرام (Instagram Content Strategist)
    تولید روزانه ایده‌های محتوایی کاربردی، خلاقانه و قابل اجرا با Gemini API
    """

    def __init__(self, api_key: Optional[str] = None, model: str = GEMINI_MODEL):
        self.api_key = api_key or GEMINI_API_KEY
        self.model = model
        self.client = None

        if not self.api_key:
            logger.warning("GEMINI_API_KEY is not set. API calls might require environment variable.")

        try:
            from google import genai
            self.client = genai.Client(api_key=self.api_key)
            logger.info("Google GenAI client initialized successfully.")
        except ImportError:
            logger.info("google-genai package not installed locally; will use REST fallback if needed.")

    def _call_gemini_api(self, system_instruction: str, user_prompt: str) -> str:
        """Call Gemini via official SDK or fallback to REST with multi-model failover"""
        candidate_models = [self.model, "gemini-3.1-flash-lite", "gemini-flash-latest"]
        # Remove duplicates while preserving order
        candidate_models = list(dict.fromkeys(candidate_models))
        
        last_error = None
        for model_name in candidate_models:
            for attempt in range(1, 3):
                try:
                    logger.info(f"Trying Gemini model: {model_name} (attempt {attempt})...")
                    if self.client:
                        from google.genai import types
                        response = self.client.models.generate_content(
                            model=model_name,
                            contents=user_prompt,
                            config=types.GenerateContentConfig(
                                system_instruction=system_instruction,
                                response_mime_type="application/json",
                                temperature=0.8
                            )
                        )
                        if response and response.text:
                            return response.text
                    else:
                        import requests
                        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.api_key}"
                        payload = {
                            "systemInstruction": {
                                "parts": [{"text": system_instruction}]
                            },
                            "contents": [
                                {
                                    "parts": [{"text": user_prompt}]
                                }
                            ],
                            "generationConfig": {
                                "responseMimeType": "application/json",
                                "temperature": 0.8
                            }
                        }
                        res = requests.post(url, json=payload, timeout=60)
                        res.raise_for_status()
                        data = res.json()
                        return data["candidates"][0]["content"]["parts"][0]["text"]
                except Exception as err:
                    last_error = err
                    err_str = str(err)
                    logger.warning(f"Model {model_name} attempt {attempt} failed: {err_str}")
                    if ("503" in err_str or "UNAVAILABLE" in err_str or "429" in err_str) and attempt == 1:
                        import time
                        time.sleep(1.5)
                    else:
                        break

        raise last_error or RuntimeError("All Gemini models are temporarily unavailable.")

    def generate_daily_idea(self, profile: Dict[str, Any], history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        تولید ایده روزانه جدید بر اساس اطلاعات پیج و جلوگیری از تکرار نسبت به تاریخچه
        """
        # Deduplication list
        previous_ideas_summary = []
        for h in history[:20]:
            c_type = h.get("content_type", "")
            title = h.get("title", "")
            goal = h.get("goal", "")
            previous_ideas_summary.append(f"- [{c_type}] {title} (هدف: {goal})")

        previous_ideas_text = "\n".join(previous_ideas_summary) if previous_ideas_summary else "هیچ ایده‌ای قبلاً ثبت نشده است."

        # Format preferences
        pref = profile.get("preferred_content_type", "smart_mix")
        if pref == "reel_priority":
            format_rule = "اولویت اصلی باید ریلز (Reel) باشد مگر اینکه ایده به ساختار دیگری نیاز داشته باشد."
        elif pref == "story_priority":
            format_rule = "اولویت اصلی باید استوری تعاملی (Story) چندفریمی با استیکر و تعامل باشد."
        elif pref == "carousel_priority":
            format_rule = "اولویت اصلی باید پست اسلایدی (Carousel) با ورق‌زدن بالا باشد."
        else:
            format_rule = "متناسب با اهداف پیج، بهترین فرمت را از میان Reel، Story، Carousel، Post یا Live هوشمندانه انتخاب کن."

        samples = profile.get("previous_samples", [])
        samples_text = "\n".join([f"- {s}" for s in samples]) if samples else "ثبت نشده است."

        goals = ", ".join(profile.get("page_goals", [])) or "رشد و تعامل"

        system_instruction = """تو یک مدیر ارشد استراتژی محتوا و رشد اینستاگرام (Instagram Content Strategist & Growth Hacker) هستی.
وظیفه اصلی تو تولید دقیقاً یک ایده محتوایی کاربردی، جذاب و کاملاً قابل اجرا برای یک پیج اینستاگرام است.

قوانین حیاتی:
۱. ایده باید کاملاً متناسب با حوزه فعالیت پیج، مخاطب هدف و لحن تعیین‌شده باشد.
۲. ایده باید به شکلی باشد که کاربر بتواند همین امروز آن را اجرا و تولید کند. از کلی‌گویی بیهوده پرهیز کن و سناریوی دقیق، جملات هوک و متن کلامی بنویس.
۳. بررسی ایده‌های روزهای قبل:
لیست ایده‌های قبلی را با دقت بخوان. به هیچ عنوان ایده تکراری یا بسیار مشابه قبلی‌ها ارائه نده! زاویه دید و هوک باید کاملاً نو باشد.
۴. بدون فکت‌های دروغین: هرگز تعداد فالوور یا آمار جعلی از پیج حدس نزن.
۵. خروجی باید الزاماً یک آبجکت معتبر JSON شامل ۱۴ فیلد مشخص‌شده باشد."""

        user_prompt = f"""اطلاعات پیج اینستاگرام کاربر:
- نام پیج: {profile.get('page_name')}
- آدرس/لینک پیج: {profile.get('instagram_url')}
- حوزه فعالیت: {profile.get('niche')}
- توضیح کسب‌وکار: {profile.get('description')}
- مخاطبان هدف: {profile.get('target_audience')}
- لحن محتوا: {profile.get('content_tone')}
- اهداف اصلی: {goals}
- تنظیم نوع محتوا: {format_rule}

نمونه محتواهای قبلی پیج:
{samples_text}

لیست ایده‌های قبلی پیج (اکیداً از تکرار این موارد پرهیز شود):
{previous_ideas_text}

لطفاً دقیقاً یک ایده جدید برای امروز با تمام ۱۴ فیلد زیر در قالب JSON تولید کن:
{{
  "title": "عنوان جذاب ایده",
  "content_type": "یکی از موارد: Reel / Story / Carousel / Post / Live",
  "goal": "هدف این محتوا",
  "hook": "جمله شروع میخکوب‌کننده ۳ ثانیه اول (Hook)",
  "idea": "توضیح کامل ایده و ارزش پیشنهادی",
  "script": "سناریوی پیشنهادی ثانیه‌ای یا مرحله‌به‌مرحله",
  "video_script": "متن دقیق کلامی برای گوینده در ویدیو یا متن اسلایدها",
  "caption": "کپشن کامل و آماده برای انتشار همراه ایموجی و فاصله‌گذاری",
  "cta": "دعوت به اقدام (Call To Action) مشخص",
  "visual_suggestion": "پیشنهاد نحوه فیلم‌برداری، نور، زاویه دوربین و المان‌های بصری",
  "hashtags": ["#هشتگ۱", "#هشتگ۲", "#هشتگ۳", "#هشتگ۴", "#هشتگ۵", "#هشتگ۶"],
  "reason": "دلیل اینکه چرا این ایده برای این پیج مناسب است",
  "difficulty": "آسان یا متوسط یا پیشرفته",
  "estimated_time": "زمان تقریبی مورد نیاز برای ساخت",
  "audio_suggestion": "پیشنهاد موزیک ترند یا سبک صداگذاری"
}}"""

        raw_response = self._call_gemini_api(system_instruction, user_prompt)
        
        # Parse JSON
        try:
            cleaned = raw_response.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            data = json.loads(cleaned)
        except Exception as e:
            logger.error(f"Error parsing Gemini JSON response: {e}")
            logger.error(f"Raw response was: {raw_response}")
            raise ValueError("خطا در پردازش خروجی مدل هوش مصنوعی")

        # Normalize fields
        data["profile_id"] = profile.get("id", "profile_default")
        data["scheduled_time"] = profile.get("schedule_time", "11:00")
        data["created_at"] = datetime.now().isoformat()
        data["status"] = "new"

        return data

    def analyze_page(self, page_name: str, instagram_url: str, niche: str, description: str) -> Dict[str, Any]:
        """تحلیل استراتژیک عمومی پیج و بایو بدون جعل آمار"""
        prompt = f"""به عنوان استراتژیست ارشد الگوریتم اینستاگرام، اطلاعات پیج زیر را بررسی و پیشنهادات بهبود ارائه بده:
نام پیج: {page_name}
آدرس: {instagram_url}
حوزه: {niche}
بایو یا توضیحات: {description}

خروجی باید JSON با این ساختار باشد:
{{
  "strengths": ["نقطه قوت ۱", "نقطه قوت ۲"],
  "content_opportunities": ["فرصت محتوایی ۱", "فرصت محتوایی ۲"],
  "suggested_bio_improvement": "پیشنهاد بازنویسی بایو",
  "viral_hook_patterns": ["فرمول هوک ۱", "فرمول هوک ۲"],
  "posting_rhythm_advice": "توصیه ریتم انتشار"
}}"""
        system = "تو مشاور ارشد رشد در اینستاگرام هستی. بدون حدس آمار جعلی، راهکارهای اجرایی بده."
        raw = self._call_gemini_api(system, prompt)
        cleaned = raw.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        return json.loads(cleaned)
