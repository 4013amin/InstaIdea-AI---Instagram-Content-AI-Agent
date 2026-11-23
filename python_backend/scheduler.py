import time
import schedule
import logging
import requests
from datetime import datetime
from agent import InstagramContentAgent
from database import get_profile, get_ideas, save_idea, add_log, init_db
from config import TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, WEBHOOK_URL

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("Scheduler")

def send_telegram_notification(idea: dict, bot_token: str, chat_id: str):
    """ارسال ایده روزانه به ربات تلگرام کاربر"""
    if not bot_token or not chat_id:
        return
    
    text = f"""🚀 <b>ایده محتوای امروز اینستاگرام شما آماده شد!</b>

📌 <b>عنوان:</b> {idea.get('title')}
🎬 <b>نوع محتوا:</b> {idea.get('content_type')}
🎯 <b>هدف:</b> {idea.get('goal')}
⏱ <b>زمان ساخت:</b> {idea.get('estimated_time')} (سختی: {idea.get('difficulty')})

⚡ <b>Hook (شروع ویدیو):</b>
<i>"{idea.get('hook')}"</i>

💡 <b>ایده کلی:</b>
{idea.get('idea')}

📝 <b>سناریو / متن ویدیو:</b>
{idea.get('video_script')}

📋 <b>کپشن پیشنهادی:</b>
{idea.get('caption')}

📢 <b>Call To Action:</b>
{idea.get('cta')}

🏷 <b>هشتگ‌ها:</b>
{' '.join(idea.get('hashtags', []))}
"""
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML"
    }
    try:
        res = requests.post(url, json=payload, timeout=15)
        if res.status_code == 200:
            logger.info("Telegram notification sent successfully.")
        else:
            logger.warning(f"Telegram returned status {res.status_code}: {res.text}")
    except Exception as e:
        logger.error(f"Error sending Telegram message: {e}")

def send_webhook_notification(idea: dict, webhook_url: str):
    """ارسال وب‌هوک به سرویس‌های متصل مانند Make / Zapier یا سرور اختصاصی"""
    if not webhook_url:
        return
    try:
        res = requests.post(webhook_url, json={"event": "daily_idea_ready", "idea": idea}, timeout=15)
        logger.info(f"Webhook dispatched to {webhook_url}, status: {res.status_code}")
    except Exception as e:
        logger.error(f"Webhook dispatch failed: {e}")

def run_daily_generation_job(profile_id: str = "profile_default"):
    """تابع اجرایی زمان‌بند برای تولید ایده روزانه در ساعت مشخص‌شده"""
    logger.info(f"Triggering daily generation job for profile: {profile_id}")
    profile = get_profile(profile_id)
    if not profile:
        logger.warning(f"Profile {profile_id} not found.")
        return

    if not profile.get("is_scheduler_active", True):
        logger.info(f"Scheduler is disabled for profile {profile_id}. Skipping.")
        add_log(profile_id, "skipped", "زمان‌بند برای این پیج در وضعیت غیرفعال قرار دارد.")
        return

    try:
        agent = InstagramContentAgent()
        history = get_ideas(profile_id=profile_id)
        
        logger.info("Generating daily idea with Gemini API...")
        new_idea = agent.generate_daily_idea(profile, history)
        
        saved = save_idea(new_idea)
        log_msg = f"ایده روزانه با موفقیت در ساعت {profile.get('schedule_time')} تولید شد: «{new_idea.get('title')}»"
        add_log(profile_id, "success", log_msg, idea_id=saved.get("id"))
        logger.info(log_msg)

        # Dispatch notifications
        bot_token = profile.get("telegram_bot_token") or TELEGRAM_BOT_TOKEN
        chat_id = profile.get("telegram_chat_id") or TELEGRAM_CHAT_ID
        if bot_token and chat_id:
            send_telegram_notification(saved, bot_token, chat_id)

        webhook = profile.get("webhook_url") or WEBHOOK_URL
        if webhook:
            send_webhook_notification(saved, webhook)

    except Exception as e:
        err_msg = f"خطا در اجرای زمان‌بندی روزانه: {str(e)}"
        logger.error(err_msg)
        add_log(profile_id, "failed", err_msg)

def start_scheduler_daemon():
    """راه‌اندازی سرویس زمان‌بندی پس‌زمینه با کتابخانه schedule"""
    init_db()
    profile = get_profile("profile_default")
    target_time = profile.get("schedule_time", "11:00") if profile else "11:00"

    logger.info(f"Instagram AI Agent Scheduler started. Target daily time: {target_time}")
    
    # Schedule job daily at specified time
    schedule.every().day.at(target_time).do(run_daily_generation_job, profile_id="profile_default")

    while True:
        schedule.run_pending()
        time.sleep(30)

if __name__ == "__main__":
    start_scheduler_daemon()
