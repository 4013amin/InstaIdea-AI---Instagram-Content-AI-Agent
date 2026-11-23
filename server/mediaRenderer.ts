import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import sharp from 'sharp';
import type { ContentIdea, InstagramProfile } from '../src/types.ts';

const execFileAsync = promisify(execFile);

function escapeXml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}

function sanitizeHexColor(color: string | undefined, fallback: string): string {
  if (!color) return fallback;
  const trimmed = color.trim();
  return /^#[0-9a-fA-F]{3,8}$/.test(trimmed) ? trimmed : fallback;
}

function wrapLines(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const clean = String(text || '').replace(/\r/g, '').trim();
  if (!clean) return [];
  const paragraphs = clean.split('\n');
  const result: string[] = [];

  for (const para of paragraphs) {
    const words = para.trim().split(/\s+/).filter(Boolean);
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length > maxCharsPerLine && current) {
        result.push(current);
        current = word;
        if (result.length >= maxLines) break;
      } else {
        current = candidate;
      }
    }
    if (result.length >= maxLines) break;
    if (current) result.push(current);
    if (result.length >= maxLines) break;
  }

  if (result.length === maxLines && clean.length > result.join(' ').length + 4) {
    const last = result[maxLines - 1];
    result[maxLines - 1] = last.length > 3 ? `${last.slice(0, -1)}…` : `${last}…`;
  }
  return result.slice(0, maxLines);
}

function renderMultilineText(params: {
  lines: string[];
  x: number;
  startY: number;
  lineHeight: number;
  fontSize: number;
  fill: string;
  fontWeight?: string;
  anchor?: 'middle' | 'start' | 'end';
}): string {
  const { lines, x, startY, lineHeight, fontSize, fill, fontWeight = 'bold', anchor = 'middle' } = params;
  return lines
    .map((line, i) => {
      const y = startY + i * lineHeight;
      return `<text x="${x}" y="${y}" text-anchor="${anchor}" direction="rtl" unicode-bidi="embed" font-family="Noto Sans Arabic, Noto Kufi Arabic, DejaVu Sans, sans-serif" font-weight="${fontWeight}" font-size="${fontSize}" fill="${fill}">${escapeXml(line)}</text>`;
    })
    .join('\n');
}

function getThemePalette(profile: InstagramProfile) {
  const style = profile?.poster_design?.style_theme || 'cyber';
  const primary = sanitizeHexColor(profile?.poster_design?.primary_color, '#ec4899');
  const secondary = sanitizeHexColor(profile?.poster_design?.secondary_color, '#8b5cf6');

  if (style === 'sunset') {
    return { bg1: '#4c0519', bg2: '#831843', bg3: '#1e1b4b', accent: '#fb7185', accent2: '#f59e0b', cardBg: 'rgba(15,23,42,0.78)' };
  }
  if (style === 'luxury') {
    return { bg1: '#0a0a0a', bg2: '#171717', bg3: '#050505', accent: '#f59e0b', accent2: '#fbbf24', cardBg: 'rgba(20,20,20,0.88)' };
  }
  if (style === 'minimal') {
    return { bg1: '#0f172a', bg2: '#1e293b', bg3: '#020617', accent: '#38bdf8', accent2: '#94a3b8', cardBg: 'rgba(15,23,42,0.85)' };
  }
  return { bg1: '#090d16', bg2: '#0f172a', bg3: '#1e1b4b', accent: primary, accent2: secondary, cardBg: 'rgba(15,23,42,0.82)' };
}

function buildPosterSvg(params: {
  width: number;
  height: number;
  profile: InstagramProfile;
  badgeText: string;
  headline: string;
  bodyText: string;
  footerText: string;
  subLabel?: string;
  progressCurrent?: number;
  progressTotal?: number;
  isStory?: boolean;
  isReel?: boolean;
  stickerText?: string;
  timeRange?: string;
}): string {
  const {
    width,
    height,
    profile,
    badgeText,
    headline,
    bodyText,
    footerText,
    subLabel,
    progressCurrent,
    progressTotal,
    isStory,
    isReel,
    stickerText,
    timeRange,
  } = params;

  const palette = getThemePalette(profile);
  const pageName = profile?.page_name || 'Instagram Studio';
  const rawHandle = profile?.instagram_handle || profile?.instagram_url || '@instagram';
  const handle = rawHandle.replace(/.*instagram\.com\/?|\/$/g, '').startsWith('@')
    ? rawHandle.replace(/.*instagram\.com\/?|\/$/g, '')
    : `@${rawHandle.replace(/.*instagram\.com\/?|\/$/g, '')}`;
  const showHandle = profile?.poster_design?.show_page_id !== false;

  const scaleFactor =
    profile?.poster_design?.font_size_scale === 'impact'
      ? 1.12
      : profile?.poster_design?.font_size_scale === 'compact'
      ? 0.9
      : 1;

  const headlineLines = wrapLines(headline, isStory || isReel ? 22 : 24, 3);
  const bodyLines = wrapLines(bodyText, isStory || isReel ? 32 : 34, 5);

  const topBarsSvg =
    progressTotal && progressTotal > 1
      ? Array.from({ length: progressTotal })
          .map((_, idx) => {
            const gap = 14;
            const totalW = width - 120;
            const barW = (totalW - gap * (progressTotal - 1)) / progressTotal;
            const x = 60 + idx * (barW + gap);
            const active = idx <= (progressCurrent ?? 0);
            return `<rect x="${x}" y="58" width="${barW}" height="8" rx="4" fill="${active ? palette.accent : 'rgba(255,255,255,0.22)'}" />`;
          })
          .join('')
      : '';

  const headlineStartY = isStory || isReel ? 380 : 290;
  const cardY = isStory || isReel ? 700 : 530;
  const cardH = isStory || isReel ? 470 : 340;
  const bodyStartY = cardY + 115;

  const stickerSvg =
    isStory && stickerText
      ? `
      <rect x="140" y="1280" width="${width - 280}" height="240" rx="32" fill="rgba(255,255,255,0.95)" stroke="${palette.accent}" stroke-width="4" />
      <text x="${width / 2}" y="1355" text-anchor="middle" direction="rtl" font-family="Noto Sans Arabic, sans-serif" font-weight="bold" font-size="32" fill="#0f172a">استیکر تعاملی استوری</text>
      ${renderMultilineText({
        lines: wrapLines(stickerText, 28, 2),
        x: width / 2,
        startY: 1425,
        lineHeight: 46,
        fontSize: 30,
        fill: '#be123c',
      })}
    `
      : '';

  const reelTimelineSvg =
    isReel && timeRange
      ? `
      <rect x="${width / 2 - 190}" y="195" width="380" height="58" rx="29" fill="rgba(244,63,94,0.18)" stroke="${palette.accent}" stroke-width="2" />
      <text x="${width / 2}" y="233" text-anchor="middle" direction="rtl" font-family="Noto Sans Arabic, sans-serif" font-weight="bold" font-size="26" fill="#fda4af">${escapeXml(timeRange)}</text>
    `
      : '';

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${palette.bg1}" />
      <stop offset="50%" stop-color="${palette.bg2}" />
      <stop offset="100%" stop-color="${palette.bg3}" />
    </linearGradient>
    <radialGradient id="glow1" cx="82%" cy="18%" r="45%">
      <stop offset="0%" stop-color="${palette.accent}" stop-opacity="0.34" />
      <stop offset="100%" stop-color="${palette.accent}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="glow2" cx="18%" cy="85%" r="48%">
      <stop offset="0%" stop-color="${palette.accent2}" stop-opacity="0.28" />
      <stop offset="100%" stop-color="${palette.accent2}" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#bgGrad)" />
  <rect width="${width}" height="${height}" fill="url(#glow1)" />
  <rect width="${width}" height="${height}" fill="url(#glow2)" />

  <!-- Subtle frame -->
  <rect x="36" y="36" width="${width - 72}" height="${height - 72}" rx="28" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="3" />
  ${topBarsSvg}

  <!-- Top Header -->
  <text x="${width - 80}" y="128" text-anchor="end" direction="rtl" font-family="Noto Sans Arabic, sans-serif" font-weight="bold" font-size="26" fill="${palette.accent}">${escapeXml(badgeText)}</text>
  <text x="80" y="128" text-anchor="start" direction="rtl" font-family="Noto Sans Arabic, sans-serif" font-weight="bold" font-size="24" fill="#cbd5e1">${escapeXml(pageName)}</text>

  ${reelTimelineSvg}

  <!-- Headline -->
  ${renderMultilineText({
    lines: headlineLines,
    x: width / 2,
    startY: headlineStartY,
    lineHeight: Math.round(74 * scaleFactor),
    fontSize: Math.round(52 * scaleFactor),
    fill: '#ffffff',
    fontWeight: 'bold',
  })}

  <!-- Main Content Card -->
  <rect x="90" y="${cardY}" width="${width - 180}" height="${cardH}" rx="28" fill="${palette.cardBg}" stroke="rgba(255,255,255,0.16)" stroke-width="2" />
  ${subLabel ? `<text x="${width / 2}" y="${cardY + 56}" text-anchor="middle" direction="rtl" font-family="Noto Sans Arabic, sans-serif" font-weight="bold" font-size="26" fill="${palette.accent}">${escapeXml(subLabel)}</text>` : ''}

  ${renderMultilineText({
    lines: bodyLines,
    x: width / 2,
    startY: bodyStartY,
    lineHeight: Math.round(52 * scaleFactor),
    fontSize: Math.round(32 * scaleFactor),
    fill: '#e2e8f0',
    fontWeight: 'normal',
  })}

  ${stickerSvg}

  <!-- Footer CTA & Handle -->
  <text x="${width / 2}" y="${height - 140}" text-anchor="middle" direction="rtl" font-family="Noto Sans Arabic, sans-serif" font-weight="bold" font-size="28" fill="#38bdf8">${escapeXml(footerText)}</text>
  ${showHandle ? `<text x="${width / 2}" y="${height - 84}" text-anchor="middle" font-family="DejaVu Sans, Noto Sans Arabic, sans-serif" font-weight="bold" font-size="26" fill="${palette.accent}">${escapeXml(handle)}</text>` : ''}
</svg>`;
}

export interface RenderedIdeaMediaResult {
  generated_media_type: 'image' | 'carousel' | 'video' | 'story';
  generated_image_url: string;
  generated_carousel_urls?: string[];
  generated_story_urls?: string[];
  generated_video_url?: string;
}

export async function renderIdeaMediaAssets(params: {
  idea: ContentIdea;
  profile: InstagramProfile;
  mediaDir: string;
  saveFile: (prefix: string, ideaId: string, ext: string, buffer: Buffer) => string;
}): Promise<RenderedIdeaMediaResult> {
  const { idea, profile, mediaDir, saveFile } = params;
  const contentType = idea.content_type;

  // 1. Carousel: render all slides (1080x1080 JPEG)
  if (contentType === 'Carousel') {
    const slides =
      idea.carousel_slides && idea.carousel_slides.length > 0
        ? idea.carousel_slides
        : [
            { slide_number: 1, title: idea.hook || idea.title, content: 'ورق بزنید تا جزئیات کامل را ببینید', visual_note: 'کاور' },
            { slide_number: 2, title: 'نکته اول', content: (idea.idea || idea.caption || idea.title || '').slice(0, 160), visual_note: 'بخش ۱' },
            { slide_number: 3, title: 'نکته دوم', content: (idea.script || idea.idea || '').slice(0, 160), visual_note: 'بخش ۲' },
            { slide_number: 4, title: 'چک‌لیست اجرا', content: '۱. ذخیره پست  ۲. اجرای ترفند  ۳. مقایسه نتیجه', visual_note: 'چک‌لیست' },
            { slide_number: 5, title: 'سیو کن تا یادت نره!', content: idea.cta || 'نظرت رو در کامنت بنویس', visual_note: 'پایان' },
          ];

    const carouselUrls: string[] = [];
    for (let i = 0; i < slides.length; i++) {
      const s = slides[i];
      const svg = buildPosterSvg({
        width: 1080,
        height: 1080,
        profile,
        badgeText: `CAROUSEL ${i + 1}/${slides.length}`,
        headline: s.title,
        bodyText: s.content,
        subLabel: i === 0 ? 'کاور اسلاید' : `اسلاید ${i + 1}`,
        footerText: i < slides.length - 1 ? 'ورق بزنید اسلاید بعدی' : 'سیو کن و برای دوستت بفرست',
        progressCurrent: i,
        progressTotal: slides.length,
      });
      const jpgBuffer = await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
      const url = saveFile(`carousel_s${i + 1}`, idea.id, 'jpg', jpgBuffer);
      carouselUrls.push(url);
    }

    return {
      generated_media_type: 'carousel',
      generated_image_url: carouselUrls[0],
      generated_carousel_urls: carouselUrls,
    };
  }

  // 2. Story: render vertical 9:16 frames (1080x1920 JPEG)
  if (contentType === 'Story') {
    const frames =
      idea.story_frames && idea.story_frames.length > 0
        ? idea.story_frames
        : [
            { frame_number: 1, format: 'شروع چالش روز', text: idea.hook || idea.title, sticker_suggestion: 'Poll: موافقم / مخالفم' },
            { frame_number: 2, format: 'راهکار کلیدی', text: (idea.idea || idea.script || idea.caption || '').slice(0, 150), sticker_suggestion: 'Slider: چقدر مفید بود؟' },
            { frame_number: 3, format: 'دعوت به تعامل', text: idea.cta || 'سوال خودت رو اینجا بنویس', sticker_suggestion: 'Question Box: پیام بگذارید' },
          ];

    const storyUrls: string[] = [];
    for (let i = 0; i < frames.length; i++) {
      const f = frames[i];
      const svg = buildPosterSvg({
        width: 1080,
        height: 1920,
        profile,
        badgeText: `STORY ${i + 1}/${frames.length}`,
        headline: f.format,
        bodyText: f.text,
        subLabel: `فریم ${i + 1}`,
        footerText: 'ریپلای کنید یا در نظرسنجی شرکت کنید',
        progressCurrent: i,
        progressTotal: frames.length,
        isStory: true,
        stickerText: f.sticker_suggestion,
      });
      const jpgBuffer = await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
      const url = saveFile(`story_f${i + 1}`, idea.id, 'jpg', jpgBuffer);
      storyUrls.push(url);
    }

    return {
      generated_media_type: 'story',
      generated_image_url: storyUrls[0],
      generated_story_urls: storyUrls,
    };
  }

  // 3. Reel: render 4 vertical 1080x1920 scenes + assemble real H.264 MP4 video with ffmpeg
  if (contentType === 'Reel') {
    const scenes =
      idea.video_scenes && idea.video_scenes.length > 0
        ? idea.video_scenes
        : [
            { time_range: '۰ تا ۳ ثانیه', scene_title: 'هوک شروع ویدیو', speech_text: idea.hook || idea.title, visual_cue: 'کلوزآپ پرانرژی' },
            { time_range: '۳ تا ۱۵ ثانیه', scene_title: 'بیان چالش مخاطب', speech_text: (idea.video_script || idea.idea || idea.caption || '').slice(0, 140), visual_cue: 'نمایش صحنه' },
            { time_range: '۱۵ تا ۴۰ ثانیه', scene_title: 'آموزش و راهکار اصلی', speech_text: (idea.script || idea.idea || '').slice(0, 150), visual_cue: 'زیرنویس درشت' },
            { time_range: '۴۰ تا ۵۰ ثانیه', scene_title: 'دعوت به اقدام (CTA)', speech_text: idea.cta || 'کپشن رو بخون و سیو کن!', visual_cue: 'اشاره به سیو' },
          ];

    const safeId = idea.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'reel';
    const tempFramePaths: string[] = [];
    let coverUrl = '';

    try {
      for (let i = 0; i < scenes.length; i++) {
        const sc = scenes[i];
        const svg = buildPosterSvg({
          width: 1080,
          height: 1920,
          profile,
          badgeText: `REEL SCENE ${i + 1}/${scenes.length}`,
          headline: sc.scene_title,
          bodyText: sc.speech_text,
          subLabel: 'متن کلامی و زیرنویس ریلز',
          footerText: sc.visual_cue || 'ویدیوی ریلز تولیدشده با هوش مصنوعی',
          progressCurrent: i,
          progressTotal: scenes.length,
          isReel: true,
          timeRange: sc.time_range,
        });
        const pngBuf = await sharp(Buffer.from(svg)).png().toBuffer();
        const framePath = path.resolve(mediaDir, `_tmp_reel_${safeId}_${i}.png`);
        if (!framePath.startsWith(mediaDir + path.sep)) {
          throw new Error('مسیر فریم موقت نامعتبر است');
        }
        fs.writeFileSync(framePath, pngBuf);
        tempFramePaths.push(framePath);

        if (i === 0) {
          const coverJpg = await sharp(pngBuf).jpeg({ quality: 90 }).toBuffer();
          coverUrl = saveFile('reel_cover', idea.id, 'jpg', coverJpg);
        }
      }

      const outVideoName = `reel_auto_${safeId}_${Date.now()}.mp4`;
      const outVideoPath = path.resolve(mediaDir, outVideoName);
      if (!outVideoPath.startsWith(mediaDir + path.sep)) {
        throw new Error('مسیر ویدیوی خروجی نامعتبر است');
      }

      // Build ffmpeg command with 3s per scene (total ~12s H.264 30fps vertical 1080x1920 MP4)
      const args: string[] = ['-y'];
      for (const fp of tempFramePaths) {
        args.push('-loop', '1', '-t', '3', '-i', fp);
      }
      const scaleChains = tempFramePaths
        .map((_, idx) => `[${idx}:v]scale=1080:1920,setsar=1[s${idx}]`)
        .join(';');
      const concatPins = tempFramePaths.map((_, idx) => `[s${idx}]`).join('');
      const filterComplex = `${scaleChains};${concatPins}concat=n=${tempFramePaths.length}:v=1:a=0,format=yuv420p[v]`;

      args.push(
        '-filter_complex',
        filterComplex,
        '-map',
        '[v]',
        '-r',
        '30',
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-movflags',
        '+faststart',
        outVideoPath
      );

      await execFileAsync('ffmpeg', args, { timeout: 60000 });

      return {
        generated_media_type: 'video',
        generated_image_url: coverUrl,
        generated_video_url: `/media/${outVideoName}`,
      };
    } finally {
      for (const fp of tempFramePaths) {
        try {
          if (fs.existsSync(fp)) fs.unlinkSync(fp);
        } catch {
          // ignore cleanup failure
        }
      }
    }
  }

  // 4. Standard Single Post (or Live announcement): 1080x1080 JPEG poster
  const svg = buildPosterSvg({
    width: 1080,
    height: 1080,
    profile,
    badgeText: contentType === 'Live' ? 'INSTAGRAM LIVE' : 'INSTAGRAM POST',
    headline: idea.hook || idea.title || 'پست روزانه',
    bodyText: (idea.idea || idea.script || idea.caption || '').slice(0, 175),
    subLabel: idea.title || '',
    footerText: idea.cta || 'سیو کن و نظرت رو برام بنویس',
  });
  const jpgBuffer = await sharp(Buffer.from(svg)).jpeg({ quality: 92 }).toBuffer();
  const postUrl = saveFile('post_auto', idea.id, 'jpg', jpgBuffer);

  return {
    generated_media_type: 'image',
    generated_image_url: postUrl,
  };
}
