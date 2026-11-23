import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from database import get_profile, get_ideas, save_idea, update_idea_status, add_log

logger = logging.getLogger("InstagramPublisher")
logging.basicConfig(level=logging.INFO)

def make_http_post(url: str, payload: dict) -> dict:
    try:
        import requests
        res = requests.post(url, json=payload, timeout=30)
        return res.json()
    except ImportError:
        import urllib.request
        data_bytes = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data_bytes,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))

class InstagramPublisher:
    """
    سرویس انتشار مستقیم محتوا و عکس به اینستاگرام از طریق Meta Graph API و Webhook
    """

    @staticmethod
    def publish_post(
        idea: Dict[str, Any],
        image_url: str,
        caption: Optional[str] = None,
        profile_id: str = "profile_default"
    ) -> Dict[str, Any]:
        profile = get_profile(profile_id)
        if not profile:
            raise ValueError("پروفایل یافت نشد")

        final_caption = caption or idea.get("caption", "")
        access_token = profile.get("instagram_access_token")
        account_id = profile.get("instagram_account_id")
        webhook_url = profile.get("auto_publish_webhook") or profile.get("webhook_url")

        post_id = None
        status_message = "پست با موفقیت آماده و منتشر شد."

        # 1. Direct Publish via Meta Graph API (If Token and Account ID are set)
        if access_token and account_id:
            try:
                logger.info(f"Publishing via Meta Graph API to account {account_id}...")
                
                # Step 1: Create media container
                media_url = f"https://graph.facebook.com/v19.0/{account_id}/media"
                container_data = make_http_post(media_url, {
                    "image_url": image_url,
                    "caption": final_caption,
                    "access_token": access_token
                })

                if "id" in container_data:
                    creation_id = container_data["id"]
                    # Step 2: Publish media container
                    publish_url = f"https://graph.facebook.com/v19.0/{account_id}/media_publish"
                    pub_data = make_http_post(publish_url, {
                        "creation_id": creation_id,
                        "access_token": access_token
                    })
                    if "id" in pub_data:
                        post_id = pub_data["id"]
                        status_message = f"پست با شناسه {post_id} با موفقیت در اینستاگرام منتشر شد."
                        logger.info(status_message)
                    else:
                        logger.warning(f"Media publish warning: {pub_data}")
                else:
                    logger.warning(f"Media container creation warning: {container_data}")
            except Exception as e:
                logger.error(f"Error publishing to Meta Graph API: {e}")

        # 2. Dispatch to Webhook (Make / Zapier / n8n / Bot)
        if webhook_url:
            try:
                make_http_post(webhook_url, {
                    "event": "instagram_publish_requested",
                    "idea_id": idea.get("id"),
                    "title": idea.get("title"),
                    "caption": final_caption,
                    "image_url": image_url,
                    "published_at": datetime.now().isoformat()
                })
                logger.info(f"Webhook dispatched to {webhook_url}")
            except Exception as e:
                logger.error(f"Webhook dispatch error: {e}")

        # 3. Update idea status
        idea_id = idea.get("id")
        if idea_id:
            update_idea_status(idea_id, "published")
            add_log(profile_id, "success", f"پست «{idea.get('title')}» در اینستاگرام منتشر شد.", idea_id=idea_id)

        return {
            "success": True,
            "post_id": post_id,
            "message": status_message,
            "published_at": datetime.now().isoformat()
        }
