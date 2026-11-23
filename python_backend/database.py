import sqlite3
import json
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from config import DATABASE_PATH

def get_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Profiles table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        instagram_url TEXT,
        page_name TEXT,
        niche TEXT,
        description TEXT,
        target_audience TEXT,
        preferred_content_type TEXT,
        content_tone TEXT,
        schedule_time TEXT,
        is_scheduler_active INTEGER DEFAULT 1,
        previous_samples TEXT,
        page_goals TEXT,
        telegram_chat_id TEXT,
        telegram_bot_token TEXT,
        webhook_url TEXT,
        created_at TEXT,
        updated_at TEXT
    )
    """)

    # Ideas table with all 14 required fields
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ideas (
        id TEXT PRIMARY KEY,
        profile_id TEXT,
        created_at TEXT,
        date_label TEXT,
        scheduled_time TEXT,
        status TEXT DEFAULT 'new',
        title TEXT,
        content_type TEXT,
        goal TEXT,
        hook TEXT,
        idea TEXT,
        script TEXT,
        video_script TEXT,
        caption TEXT,
        cta TEXT,
        visual_suggestion TEXT,
        hashtags TEXT,
        reason TEXT,
        difficulty TEXT,
        estimated_time TEXT,
        audio_suggestion TEXT,
        FOREIGN KEY (profile_id) REFERENCES profiles (id)
    )
    """)

    # Scheduler logs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS scheduler_logs (
        id TEXT PRIMARY KEY,
        timestamp TEXT,
        profile_id TEXT,
        status TEXT,
        message TEXT,
        idea_id TEXT
    )
    """)

    # Insert default profile if none exists
    cursor.execute("SELECT COUNT(*) as count FROM profiles")
    if cursor.fetchone()["count"] == 0:
        now = datetime.now().isoformat()
        cursor.execute("""
        INSERT INTO profiles (
            id, instagram_url, page_name, niche, description, target_audience,
            preferred_content_type, content_tone, schedule_time, is_scheduler_active,
            previous_samples, page_goals, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "profile_default",
            "https://instagram.com/digitech_academy",
            "آکادمی دیجی‌تک (DigiTech)",
            "آموزش فناوری، ترفندهای موبایل و ابزارهای هوش مصنوعی",
            "پیج آموزشی تخصصی برای آموزش کاربردی ابزارهای جدید AI، ترفندهای افزایش بازدهی و معرفی سایت‌های شگفت‌انگیز برای فریلنسرها و علاقه‌مندان به تکنولوژی.",
            "دانشجویان، فریلنسرها، طراحان و جوانان ۲۰ الی ۳۵ ساله علاقه‌مند به پیشرفت کاری و تکنولوژی",
            "smart_mix",
            "دوستانه، پرانرژی، کاربردی و روان بدون اصطلاحات پیچیده خسته‌کننده",
            "11:00",
            1,
            json.dumps([
                "آموزش ساخت عکس تبلیغاتی با هوش مصنوعی در کمتر از ۶۰ ثانیه",
                "۳ اکستنشن مرورگر که هر فریلنسری باید داشته باشد",
                "چگونه سرعت آیفون را با یک ترفند ساده دو برابر کنیم؟"
            ], ensure_ascii=False),
            json.dumps(["افزایش فالوور", "افزایش تعامل", "برندینگ"], ensure_ascii=False),
            now,
            now
        ))

    # Insert sample ideas if empty
    cursor.execute("SELECT COUNT(*) as count FROM ideas")
    if cursor.fetchone()["count"] == 0:
        now = datetime.now().isoformat()
        cursor.execute("""
        INSERT INTO ideas (
            id, profile_id, created_at, date_label, scheduled_time, status,
            title, content_type, goal, hook, idea, script, video_script,
            caption, cta, visual_suggestion, hashtags, reason, difficulty,
            estimated_time, audio_suggestion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "idea_sample_1",
            "profile_default",
            now,
            "امروز",
            "11:00",
            "new",
            "۵ ابزار رایگان هوش مصنوعی که جایگزین ۱۰ نرم‌افزار پولی می‌شوند",
            "Reel",
            "افزایش تعامل و سیو بالا",
            "دیگه ماهی یک میلیون تومن به ابزارهای هوش مصنوعی پول نده!",
            "معرفی ۵ هوش مصنوعی کاملاً رایگان بدون تحریم برای افزایش بازدهی کار روزانه",
            "۰ تا ۳ ثانیه: هوک هیجانی، ۳ تا ۲۰ ثانیه: معرفی سریع ابزارها روی صفحه مانیتور",
            "سلام رفقا! اگه هنوز داری برای فتوشاپ یا ابزارهای ادیت صدا پول میدی، این ویدیو رو سیو کن...",
            "💾 حتما سیوش کن چون به دردت میخوره!\n\n۵ ابزار رایگان:\n۱. طراحی پوستر\n۲. تبدیل صوت به متن فارسی\n۳. ساخت پرزنتیشن\n\nنظرت چیه؟ برام کامنت کن!",
            "این پست رو بفرست برای اون دوستت که دنبال ابزار رایگانه!",
            "شات نزدیک از چهره با اشاره به لوگوی ابزارها و بک‌گراند نئونی",
            json.dumps(["#هوش_مصنوعی", "#ترفند", "#فناوری", "#ابزار_رایگان"], ensure_ascii=False),
            "محتواهای لیست ابزار بالاترین نرخ ذخیره (Save) را در حوزه تکنولوژی ثبت می‌کنند.",
            "آسان",
            "۳۰ دقیقه",
            "موزیک لایت ترند ریلز"
        ))

    conn.commit()
    conn.close()

def get_profile(profile_id: str = "profile_default") -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM profiles WHERE id = ?", (profile_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    d["is_scheduler_active"] = bool(d["is_scheduler_active"])
    d["previous_samples"] = json.loads(d["previous_samples"] or "[]")
    d["page_goals"] = json.loads(d["page_goals"] or "[]")
    return d

def update_profile(profile_data: Dict[str, Any], profile_id: str = "profile_default") -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    cursor.execute("""
    UPDATE profiles SET
        instagram_url = ?,
        page_name = ?,
        niche = ?,
        description = ?,
        target_audience = ?,
        preferred_content_type = ?,
        content_tone = ?,
        schedule_time = ?,
        is_scheduler_active = ?,
        previous_samples = ?,
        page_goals = ?,
        telegram_chat_id = ?,
        telegram_bot_token = ?,
        webhook_url = ?,
        updated_at = ?
    WHERE id = ?
    """, (
        profile_data.get("instagram_url", ""),
        profile_data.get("page_name", ""),
        profile_data.get("niche", ""),
        profile_data.get("description", ""),
        profile_data.get("target_audience", ""),
        profile_data.get("preferred_content_type", "smart_mix"),
        profile_data.get("content_tone", ""),
        profile_data.get("schedule_time", "11:00"),
        1 if profile_data.get("is_scheduler_active", True) else 0,
        json.dumps(profile_data.get("previous_samples", []), ensure_ascii=False),
        json.dumps(profile_data.get("page_goals", []), ensure_ascii=False),
        profile_data.get("telegram_chat_id", ""),
        profile_data.get("telegram_bot_token", ""),
        profile_data.get("webhook_url", ""),
        now,
        profile_id
    ))
    conn.commit()
    conn.close()
    return get_profile(profile_id)

def get_ideas(profile_id: str = "profile_default", search: str = "", content_type: str = "", goal: str = "", status: str = "") -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM ideas WHERE profile_id = ?"
    params: List[Any] = [profile_id]

    if content_type and content_type != "all":
        query += " AND LOWER(content_type) = LOWER(?)"
        params.append(content_type)

    if status and status != "all":
        query += " AND status = ?"
        params.append(status)

    if goal and goal != "all":
        query += " AND goal LIKE ?"
        params.append(f"%{goal}%")

    if search:
        query += " AND (title LIKE ? OR hook LIKE ? OR caption LIKE ? OR hashtags LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term, term])

    query += " ORDER BY created_at DESC"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    result = []
    for r in rows:
        d = dict(r)
        d["hashtags"] = json.loads(d["hashtags"] or "[]")
        result.append(d)
    return result

def save_idea(idea_data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    
    idea_id = idea_data.get("id") or ("idea_" + str(uuid.uuid4())[:8])
    now = idea_data.get("created_at") or datetime.now().isoformat()
    
    cursor.execute("""
    INSERT INTO ideas (
        id, profile_id, created_at, date_label, scheduled_time, status,
        title, content_type, goal, hook, idea, script, video_script,
        caption, cta, visual_suggestion, hashtags, reason, difficulty,
        estimated_time, audio_suggestion
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        idea_id,
        idea_data.get("profile_id", "profile_default"),
        now,
        idea_data.get("date_label", datetime.now().strftime("%Y-%m-%d")),
        idea_data.get("scheduled_time", "11:00"),
        idea_data.get("status", "new"),
        idea_data.get("title", ""),
        idea_data.get("content_type", "Reel"),
        idea_data.get("goal", ""),
        idea_data.get("hook", ""),
        idea_data.get("idea", ""),
        idea_data.get("script", ""),
        idea_data.get("video_script", ""),
        idea_data.get("caption", ""),
        idea_data.get("cta", ""),
        idea_data.get("visual_suggestion", ""),
        json.dumps(idea_data.get("hashtags", []), ensure_ascii=False),
        idea_data.get("reason", ""),
        idea_data.get("difficulty", "آسان"),
        idea_data.get("estimated_time", "۳۰ دقیقه"),
        idea_data.get("audio_suggestion", "")
    ))
    conn.commit()
    conn.close()
    
    idea_data["id"] = idea_id
    idea_data["created_at"] = now
    return idea_data

def update_idea_status(idea_id: str, status: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE ideas SET status = ? WHERE id = ?", (status, idea_id))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0

def delete_idea(idea_id: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM ideas WHERE id = ?", (idea_id,))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0

def add_log(profile_id: str, status: str, message: str, idea_id: Optional[str] = None):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO scheduler_logs (id, timestamp, profile_id, status, message, idea_id)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (
        "log_" + str(uuid.uuid4())[:8],
        datetime.now().isoformat(),
        profile_id,
        status,
        message,
        idea_id
    ))
    conn.commit()
    conn.close()

def get_logs(limit: int = 30) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM scheduler_logs ORDER BY timestamp DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]
