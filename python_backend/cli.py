#!/usr/bin/env python3
"""
CLI Tool for Instagram AI Agent
اجرای دستورات ایجنت اینستاگرام از طریق خط فرمان (ترمینال)
"""
import sys
import json
import argparse
from database import init_db, get_profile, get_ideas, save_idea
from agent import InstagramContentAgent

def main():
    parser = argparse.ArgumentParser(description="InstaIdea AI - Instagram Content Agent CLI")
    subparsers = parser.add_subparsers(dest="command", help="دستورات در دسترس")

    # Command: generate
    subparsers.add_parser("generate", help="تولید یک ایده جدید برای پیج جاری")

    # Command: profile
    subparsers.add_parser("profile", help="نمایش مشخصات پیج فعال")

    # Command: history
    subparsers.add_parser("history", help="مشاهده لیست ایده‌های تولید شده اخیر")

    # Command: analyze
    subparsers.add_parser("analyze", help="تحلیل استراتژیک بیزینس و بایو پیج")

    # Command: publish
    publish_parser = subparsers.add_parser("publish", help="انتشار ایده به همراه عکس به اینستاگرام")
    publish_parser.add_argument("--idea-id", help="شناسه ایده جهت انتشار (اختیاری، در غیر این صورت آخرین ایده انتخاب می‌شود)")

    args = parser.parse_args()

    init_db()
    profile = get_profile("profile_default")
    if not profile:
        print("❌ پروفایل پیش‌فرضی یافت نشد!")
        sys.exit(1)

    if args.command == "generate":
        print(f"🤖 در حال تولید ایده برای پیج «{profile.get('page_name')}»...")
        agent = InstagramContentAgent()
        history = get_ideas("profile_default")
        try:
            idea = agent.generate_daily_idea(profile, history)
            saved = save_idea(idea)
            print("\n" + "="*50)
            print(f"✨ ایده جدید تولید شد: {saved.get('title')}")
            print(f"📌 نوع محتوا: {saved.get('content_type')} | سختی: {saved.get('difficulty')}")
            print(f"🎯 هدف: {saved.get('goal')}")
            print(f"⚡ Hook: {saved.get('hook')}")
            print(f"\n💡 ایده کامل:\n{saved.get('idea')}")
            print(f"\n🎬 متن سناریو:\n{saved.get('video_script')}")
            print(f"\n📋 کپشن پیشنهادی:\n{saved.get('caption')}")
            print(f"\n🏷 هشتگ‌ها: {' '.join(saved.get('hashtags', []))}")
            print("="*50 + "\n")
        except Exception as e:
            print(f"❌ خطا در تولید ایده: {e}")

    elif args.command == "profile":
        print("\n--- مشخصات پیج فعال ---")
        for k, v in profile.items():
            if k not in ["telegram_bot_token"]:
                print(f"{k}: {v}")

    elif args.command == "history":
        ideas = get_ideas("profile_default")
        print(f"\nتعداد کل ایده‌های ذخیره شده: {len(ideas)}")
        for idx, idea in enumerate(ideas[:10], 1):
            print(f"{idx}. [{idea.get('content_type')}] {idea.get('title')} ({idea.get('date_label')}) - وضعیت: {idea.get('status')}")

    elif args.command == "analyze":
        print("🔍 در حال تحلیل پیج...")
        agent = InstagramContentAgent()
        analysis = agent.analyze_page(
            profile.get("page_name"),
            profile.get("instagram_url"),
            profile.get("niche"),
            profile.get("description")
        )
        print(json.dumps(analysis, ensure_ascii=False, indent=2))

    elif args.command == "publish":
        from publisher import InstagramPublisher
        ideas = get_ideas("profile_default")
        if not ideas:
            print("❌ هیچ ایده‌ای در دیتابیس موجود نیست.")
            sys.exit(1)
        
        target_idea = None
        if args.idea_id:
            for i in ideas:
                if i.get("id") == args.idea_id:
                    target_idea = i
                    break
        if not target_idea:
            target_idea = ideas[0]

        print(f"🚀 در حال انتشار پست «{target_idea.get('title')}» به اینستاگرام...")
        result = InstagramPublisher.publish_post(
            idea=target_idea,
            image_url="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe"
        )
        print("✅ نتیجه انتشار:")
        print(json.dumps(result, ensure_ascii=False, indent=2))

    else:
        parser.print_help()

if __name__ == "__main__":
    main()
