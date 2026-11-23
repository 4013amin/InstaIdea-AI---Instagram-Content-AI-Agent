export type UserRole = 'admin' | 'user';

export type SubscriptionTier = 'free' | 'pro' | 'vip';

export interface User {
  id: string;
  username: string;
  password_hash: string;
  display_name: string;
  role: UserRole;
  credits: number;
  subscription_tier: SubscriptionTier;
  daily_video_limit: number;
  daily_videos_used: number;
  last_video_date: string; // YYYY-MM-DD
  status: 'active' | 'blocked';
  created_at: string;
  last_login_at?: string;
  last_auto_run_date?: string; // YYYY-MM-DD
  profile: InstagramProfile;
  token?: string;
}

export interface UserPublicInfo {
  id: string;
  username: string;
  display_name: string;
  role: UserRole;
  credits: number;
  subscription_tier: SubscriptionTier;
  daily_video_limit: number;
  daily_videos_used: number;
  status: 'active' | 'blocked';
  created_at: string;
  last_login_at?: string;
  profile?: InstagramProfile;
  idea_count?: number;
}

export interface AdminStats {
  total_users: number;
  active_users: number;
  blocked_users: number;
  total_credits: number;
  total_ideas: number;
  plan_counts: {
    free: number;
    pro: number;
    vip: number;
  };
}

export type ContentType = 'Reel' | 'Story' | 'Carousel' | 'Post' | 'Live';

export type ContentGoal =
  | 'افزایش فالوور'
  | 'افزایش تعامل'
  | 'فروش'
  | 'برندینگ'
  | 'آموزش'
  | 'جذب مشتری';

export type DifficultyLevel = 'آسان' | 'متوسط' | 'پیشرفته';

export type IdeaStatus = 'new' | 'in_progress' | 'published' | 'archived';

export type PreferredContentTypeSetting =
  | 'reel_priority' // بیشتر ریلز
  | 'story_priority' // هر روز استوری
  | 'smart_mix' // انتخاب هوشمندانه متناسب با هدف پیج
  | 'carousel_priority' // بیشتر کروسل
  | 'balanced'; // ترکیب مساوی

export interface CalendarDayPlan {
  day_of_week: string; // 'شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'
  topic: string;
  content_type: ContentType;
  goal: string;
  details?: string;
}

export interface PosterDesignSettings {
  custom_prompt: string;
  primary_color: string;
  secondary_color: string;
  style_theme: 'cyber' | 'sunset' | 'luxury' | 'minimal' | 'modern_glass' | 'bold_dark';
  font_size_scale: 'compact' | 'normal' | 'impact';
  show_page_id: boolean;
  additional_notes?: string;
}

export interface NotebookLMSettings {
  enabled: boolean;
  connection_mode: 'webhook_bridge' | 'rest_api' | 'enterprise_gcp';
  bridge_url?: string;
  bridge_api_key?: string;
  notebook_id?: string;
  notebook_url?: string;
  video_style?: 'explainer' | 'whiteboard' | 'watercolor' | 'retro_print' | 'anime' | 'heritage';
  video_format?: 'brief' | 'explainer' | 'deep_dive';
  output_language?: string;
  auto_dispatch_daily: boolean;
  auto_publish_on_return: boolean;
  callback_secret?: string;
}

export interface InstagramProfile {
  id: string;
  instagram_url: string;
  instagram_handle?: string;
  page_name: string;
  niche: string;
  description: string;
  target_audience: string;
  preferred_content_type: PreferredContentTypeSetting;
  content_tone: string;
  schedule_time: string; // e.g. "12:00"
  is_scheduler_active: boolean;
  previous_samples: string[];
  page_goals: string[];
  telegram_chat_id?: string;
  telegram_bot_token?: string;
  webhook_url?: string;
  instagram_account_id?: string;
  instagram_access_token?: string;
  auto_publish_webhook?: string;

  // Custom Content Calendar & Poster Design Prompt
  custom_calendar_active?: boolean;
  calendar_schedule?: CalendarDayPlan[];
  custom_calendar_notes?: string;
  poster_design?: PosterDesignSettings;

  // NotebookLM Two-Way Video Pipeline
  notebooklm?: NotebookLMSettings;

  // Full Daily Autopilot (Auto Idea + Auto Visual/Video Render + Auto Instagram Publish)
  auto_generate_media?: boolean;
  auto_publish_daily?: boolean;
  autopilot_formats?: ContentType[];

  created_at: string;
  updated_at: string;
}

export interface ContentIdea {
  id: string;
  user_id?: string;
  profile_id: string;
  created_at: string;
  date_label: string; // e.g. "۱۴۰۳/۰۷/۱۲"
  scheduled_time: string;
  status: IdeaStatus;
  
  // 14 Core Fields required by the prompt
  title: string;
  content_type: ContentType;
  goal: string;
  hook: string;
  idea: string;
  script: string;
  video_script: string;
  caption: string;
  cta: string;
  visual_suggestion: string;
  hashtags: string[];
  reason: string;
  difficulty: DifficultyLevel;
  estimated_time: string;
  
  // Extra helpful fields
  target_audience_segment?: string;
  audio_suggestion?: string;
  carousel_slides?: Array<{ slide_number: number; title: string; content: string; visual_note: string }>;
  story_frames?: Array<{ frame_number: number; format: string; text: string; sticker_suggestion: string }>;
  video_scenes?: Array<{ time_range: string; scene_title: string; speech_text: string; visual_cue: string }>;

  // Publishing & Visual Generation Fields
  generated_media_type?: 'image' | 'carousel' | 'video' | 'story';
  generated_image_url?: string;
  generated_slides?: string[];
  generated_carousel_urls?: string[];
  generated_story_urls?: string[];
  generated_video_url?: string;
  published_at?: string;
  instagram_post_id?: string;
  instagram_permalink?: string;
  auto_pipeline_stage?: 'idle' | 'idea_ready' | 'media_ready' | 'published_to_instagram' | 'queued_ready' | 'failed';
  auto_pipeline_note?: string;

  // NotebookLM Video Pipeline Tracking
  notebooklm_status?: 'idle' | 'dispatched' | 'generating_video' | 'video_ready' | 'published' | 'failed';
  notebooklm_job_id?: string;
  notebooklm_source_doc?: string;
  notebooklm_video_prompt?: string;
  notebooklm_dispatched_at?: string;
  notebooklm_video_returned_at?: string;
  notebooklm_error?: string;
}

export interface SchedulerLog {
  id: string;
  timestamp: string;
  profile_id: string;
  status: 'success' | 'failed' | 'skipped';
  message: string;
  idea_id?: string;
}

