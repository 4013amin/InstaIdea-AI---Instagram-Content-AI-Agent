from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

from config import API_HOST, API_PORT
from database import (
    init_db, get_profile, update_profile, get_ideas,
    save_idea, update_idea_status, delete_idea, add_log, get_logs
)
from agent import InstagramContentAgent
from scheduler import send_telegram_notification, send_webhook_notification

init_db()

app = FastAPI(
    title="InstaIdea AI - Instagram Content Agent API",
    description="API حرفه‌ای تولید ایده روزانه محتوای اینستاگرام با Gemini و پایتون",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ProfileUpdateModel(BaseModel):
    instagram_url: Optional[str] = None
    page_name: Optional[str] = None
    niche: Optional[str] = None
    description: Optional[str] = None
    target_audience: Optional[str] = None
    preferred_content_type: Optional[str] = "smart_mix"
    content_tone: Optional[str] = None
    schedule_time: Optional[str] = "11:00"
    is_scheduler_active: Optional[bool] = True
    previous_samples: Optional[List[str]] = []
    page_goals: Optional[List[str]] = []
    telegram_chat_id: Optional[str] = None
    telegram_bot_token: Optional[str] = None
    webhook_url: Optional[str] = None

class StatusUpdateModel(BaseModel):
    status: str

class BioAnalyzeModel(BaseModel):
    page_name: str
    instagram_url: str
    niche: str
    description: str

@app.get("/api/profile")
def get_current_profile():
    profile = get_profile("profile_default")
    if not profile:
        raise HTTPException(status_code=404, detail="پروفایل یافت نشد")
    ideas = get_ideas("profile_default")
    return {
        "profile": profile,
        "stats": {
            "total_ideas": len(ideas),
            "published_ideas": len([i for i in ideas if i.get("status") == "published"]),
            "in_progress_ideas": len([i for i in ideas if i.get("status") == "in_progress"]),
            "new_ideas": len([i for i in ideas if i.get("status") == "new"]),
            "scheduler_active": profile.get("is_scheduler_active", True),
            "scheduled_time": profile.get("schedule_time", "11:00"),
        }
    }

@app.put("/api/profile")
def save_profile_endpoint(data: ProfileUpdateModel):
    updated = update_profile(data.dict(exclude_unset=True), "profile_default")
    return {"success": True, "profile": updated}

@app.get("/api/ideas")
def list_ideas(
    search: str = Query("", description="جستجو در عنوان یا کپشن"),
    content_type: str = Query("all", description="نوع محتوا"),
    goal: str = Query("all", description="هدف"),
    status: str = Query("all", description="وضعیت")
):
    ideas = get_ideas(
        profile_id="profile_default",
        search=search,
        content_type=content_type,
        goal=goal,
        status=status
    )
    return {"ideas": ideas, "total": len(ideas)}

@app.get("/api/ideas/today")
def get_today_latest_idea():
    ideas = get_ideas("profile_default")
    if not ideas:
        return {"idea": None}
    return {"idea": ideas[0]}

@app.post("/api/ideas/generate")
def generate_idea_now(background_tasks: BackgroundTasks):
    profile = get_profile("profile_default")
    if not profile:
        raise HTTPException(status_code=404, detail="پروفایل یافت نشد")
    
    agent = InstagramContentAgent()
    history = get_ideas("profile_default")
    
    try:
        new_idea = agent.generate_daily_idea(profile, history)
        saved = save_idea(new_idea)
        
        add_log(
            "profile_default",
            "success",
            f"ایده جدید «{saved.get('title')}» به صورت دستی تولید شد.",
            idea_id=saved.get("id")
        )

        # Dispatch if configured
        if profile.get("telegram_bot_token") and profile.get("telegram_chat_id"):
            background_tasks.add_task(
                send_telegram_notification,
                saved,
                profile["telegram_bot_token"],
                profile["telegram_chat_id"]
            )

        return {"success": True, "idea": saved}
    except Exception as e:
        add_log("profile_default", "failed", f"خطا در تولید ایده: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/api/ideas/{idea_id}")
def update_status(idea_id: str, data: StatusUpdateModel):
    success = update_idea_status(idea_id, data.status)
    if not success:
        raise HTTPException(status_code=404, detail="ایده یافت نشد")
    return {"success": True}

@app.delete("/api/ideas/{idea_id}")
def delete_idea_endpoint(idea_id: str):
    success = delete_idea(idea_id)
    if not success:
        raise HTTPException(status_code=404, detail="ایده یافت نشد")
    return {"success": True}

@app.post("/api/profile/analyze")
def analyze_page_bio(data: BioAnalyzeModel):
    agent = InstagramContentAgent()
    try:
        analysis = agent.analyze_page(
            page_name=data.page_name,
            instagram_url=data.instagram_url,
            niche=data.niche,
            description=data.description
        )
        return {"success": True, "analysis": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class PublishPostModel(BaseModel):
    idea_id: str
    image_data_url: Optional[str] = None
    caption: Optional[str] = None

@app.post("/api/instagram/publish")
def publish_to_instagram_endpoint(data: PublishPostModel):
    from publisher import InstagramPublisher
    ideas = get_ideas("profile_default")
    matched = [i for i in ideas if i.get("id") == data.idea_id]
    if not matched:
        raise HTTPException(status_code=404, detail="ایده یافت نشد")
    
    idea = matched[0]
    result = InstagramPublisher.publish_post(
        idea=idea,
        image_url=data.image_data_url or "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe",
        caption=data.caption
    )
    return result

@app.post("/api/scheduler/toggle")
def toggle_scheduler():
    profile = get_profile("profile_default")
    new_state = not profile.get("is_scheduler_active", True)
    update_profile({"is_scheduler_active": new_state}, "profile_default")
    return {"success": True, "is_active": new_state}

@app.get("/api/scheduler/logs")
def get_scheduler_logs():
    return {"logs": get_logs(30)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host=API_HOST, port=API_PORT, reload=True)
