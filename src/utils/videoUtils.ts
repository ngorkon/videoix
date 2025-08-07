/**
 * Video URL processing utilities for YouTube, social media, and direct video links
 */

export interface VideoInfo {
  type: 'youtube' | 'youtube-live' | 'youtube-shorts' | 'dailymotion' | 'vimeo' | 'direct' | 'instagram' | 'tiktok' | 'unknown';
  embedUrl?: string;
  originalUrl: string;
  videoId?: string;
  isLive?: boolean;
  alternativeUrls?: string[];
}

/**
 * Extract YouTube video ID from various YouTube URL formats
 */
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
    /youtube\.com\/live\/([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

/**
 * Extract Dailymotion video ID from various Dailymotion URL formats
 */
export function extractDailymotionVideoId(url: string): string | null {
  const patterns = [
    /dailymotion\.com\/video\/([^/?_]+)/,
    /dailymotion\.com\/embed\/video\/([^/?_]+)/,
    /dai\.ly\/([^/?_]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

/**
 * Extract Vimeo video ID from various Vimeo URL formats
 */
export function extractVimeoVideoId(url: string): string | null {
  const patterns = [
    /vimeo\.com\/(\d+)/,
    /vimeo\.com\/video\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

/**
 * Generate multiple YouTube embed URL options for better compatibility
 * Uses privacy-focused and anti-detection techniques
 */
export function generateYouTubeEmbedUrls(videoId: string): string[] {
  return [
    // Privacy-enhanced nocookie domain (best for avoiding restrictions)
    `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&iv_load_policy=3&fs=1&showinfo=0`,
    
    // Standard nocookie with anti-detection parameters
    `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&controls=1&disablekb=0&enablejsapi=0&fs=1&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3`,
    
    // Alternative with different parameter combination
    `https://www.youtube-nocookie.com/embed/${videoId}?wmode=transparent&rel=0&autohide=1&showinfo=0&enablejsapi=0`,
    
    // Standard YouTube embed as fallback
    `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0`,
    
    // Direct video URL attempt (may work for some videos)
    `https://www.youtube.com/embed/${videoId}?html5=1&rel=0&modestbranding=1&playsinline=1`
  ];
}

/**
 * Generate multiple Dailymotion embed URL options for better compatibility
 */
export function generateDailymotionEmbedUrls(videoId: string): string[] {
  return [
    // Standard embed with privacy settings
    `https://www.dailymotion.com/embed/video/${videoId}?ui-logo=0&ui-start-screen-info=0&sharing-enable=0`,
    
    // Geo-location player
    `https://geo.dailymotion.com/player.html?video=${videoId}`,
    
    // Alternative embed with minimal UI
    `https://www.dailymotion.com/embed/video/${videoId}?autoplay=0&mute=0&ui-highlight=1e7fcf&ui-logo=0&ui-start-screen-info=0&ui-theme=dark`,
    
    // Standard embed
    `https://www.dailymotion.com/embed/video/${videoId}`,
    
    // Widget embed
    `https://www.dailymotion.com/embed/video/${videoId}?queue-enable=false&sharing-enable=false`
  ];
}

/**
 * Generate multiple Vimeo embed URL options for better compatibility
 */
export function generateVimeoEmbedUrls(videoId: string): string[] {
  return [
    // Privacy-focused with minimal UI
    `https://player.vimeo.com/video/${videoId}?portrait=0&byline=0&title=0&dnt=1`,
    
    // Standard player
    `https://player.vimeo.com/video/${videoId}`,
    
    // With additional privacy options
    `https://player.vimeo.com/video/${videoId}?portrait=0&byline=0&title=0&sidedock=0&dnt=1`,
    
    // Responsive player
    `https://player.vimeo.com/video/${videoId}?responsive=1&portrait=0&byline=0&title=0`
  ];
}

/**
 * Check if a video might be embeddable
 */
export function checkEmbedRestrictions(videoId: string): Promise<boolean> {
  return new Promise((resolve) => {
    // Create a test iframe to check if embedding is allowed
    const testFrame = document.createElement('iframe');
    testFrame.style.display = 'none';
    testFrame.src = `https://www.youtube.com/embed/${videoId}`;
    
    let resolved = false;
    
    const cleanup = () => {
      if (testFrame.parentNode) {
        testFrame.parentNode.removeChild(testFrame);
      }
    };
    
    testFrame.onload = () => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve(true);
      }
    };
    
    testFrame.onerror = () => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve(false);
      }
    };
    
    // Timeout after 5 seconds
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve(false);
      }
    }, 5000);
    
    document.body.appendChild(testFrame);
  });
}

/**
 * Check if a YouTube URL is a live stream
 */
export function isYouTubeLive(url: string): boolean {
  return url.includes('/live/') || url.includes('&live=1') || url.includes('?live=1');
}

/**
 * Check if a YouTube URL is a Short/Reel
 */
export function isYouTubeShorts(url: string): boolean {
  return url.includes('/shorts/');
}

/**
 * Process and classify video URL
 */
export function processVideoUrl(url: string): VideoInfo {
  const normalizedUrl = url.trim().toLowerCase();

  // YouTube detection
  if (normalizedUrl.includes('youtube.com') || normalizedUrl.includes('youtu.be')) {
    const videoId = extractYouTubeVideoId(url);
    
    if (!videoId) {
      return { type: 'unknown', originalUrl: url };
    }

    const isLive = isYouTubeLive(url);
    const isShorts = isYouTubeShorts(url);

    let type: VideoInfo['type'] = 'youtube';
    if (isLive) type = 'youtube-live';
    else if (isShorts) type = 'youtube-shorts';

    // Create embed URL with better compatibility
    const embedUrls = generateYouTubeEmbedUrls(videoId);
    const embedUrl = embedUrls[0]; // Use the first (most compatible) URL

    return {
      type,
      embedUrl,
      originalUrl: url,
      videoId,
      isLive,
      alternativeUrls: embedUrls.slice(1) // Store alternatives for fallback
    };
  }

  // Dailymotion detection
  if (normalizedUrl.includes('dailymotion.com') || normalizedUrl.includes('dai.ly')) {
    const videoId = extractDailymotionVideoId(url);
    
    if (!videoId) {
      return { type: 'unknown', originalUrl: url };
    }

    const embedUrls = generateDailymotionEmbedUrls(videoId);
    const embedUrl = embedUrls[0];

    return {
      type: 'dailymotion',
      embedUrl,
      originalUrl: url,
      videoId,
      alternativeUrls: embedUrls.slice(1)
    };
  }

  // Vimeo detection
  if (normalizedUrl.includes('vimeo.com')) {
    const videoId = extractVimeoVideoId(url);
    
    if (!videoId) {
      return { type: 'unknown', originalUrl: url };
    }

    const embedUrls = generateVimeoEmbedUrls(videoId);
    const embedUrl = embedUrls[0];

    return {
      type: 'vimeo',
      embedUrl,
      originalUrl: url,
      videoId,
      alternativeUrls: embedUrls.slice(1)
    };
  }

  // Instagram detection
  if (normalizedUrl.includes('instagram.com')) {
    return {
      type: 'instagram',
      originalUrl: url,
      // Instagram doesn't allow direct embedding, would need API integration
    };
  }

  // TikTok detection
  if (normalizedUrl.includes('tiktok.com') || normalizedUrl.includes('tiktok.app')) {
    return {
      type: 'tiktok',
      originalUrl: url,
      // TikTok has limited embedding options
    };
  }

  // Direct video URL detection
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.m3u8', '.ts'];
  const hasVideoExtension = videoExtensions.some(ext => normalizedUrl.includes(ext));
  
  if (hasVideoExtension || normalizedUrl.includes('blob:') || normalizedUrl.includes('stream')) {
    return {
      type: 'direct',
      embedUrl: url,
      originalUrl: url
    };
  }

  return {
    type: 'unknown',
    originalUrl: url
  };
}

/**
 * Get YouTube thumbnail URL
 */
export function getYouTubeThumbnail(videoId: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'high'): string {
  return `https://img.youtube.com/vi/${videoId}/${quality}default.jpg`;
}

/**
 * Validate if URL is accessible and supported
 */
export async function validateVideoUrl(url: string): Promise<{ valid: boolean; reason?: string }> {
  try {
    const videoInfo = processVideoUrl(url);
    
    if (videoInfo.type === 'unknown') {
      return { valid: false, reason: 'Unsupported video format or platform' };
    }

    if (videoInfo.type === 'instagram' || videoInfo.type === 'tiktok') {
      return { valid: false, reason: 'Instagram and TikTok videos require special API access' };
    }

    // For YouTube videos, we can assume they're valid if we extracted an ID
    if (videoInfo.type.startsWith('youtube') && videoInfo.videoId) {
      return { valid: true };
    }

    // For Dailymotion videos, we can assume they're valid if we extracted an ID
    if (videoInfo.type === 'dailymotion' && videoInfo.videoId) {
      return { valid: true };
    }

    // For Vimeo videos, we can assume they're valid if we extracted an ID
    if (videoInfo.type === 'vimeo' && videoInfo.videoId) {
      return { valid: true };
    }

    // For direct URLs, try to validate
    if (videoInfo.type === 'direct') {
      return { valid: true };
    }

    return { valid: true };
  } catch {
    return { valid: false, reason: 'Invalid URL format' };
  }
}

/**
 * Get sample URLs for different platforms
 */
export function getSampleUrls() {
  return [
    {
      name: 'YouTube Video',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      type: 'youtube'
    },
    {
      name: 'YouTube Shorts',
      url: 'https://www.youtube.com/shorts/dQw4w9WgXcQ',
      type: 'youtube-shorts'
    },
    {
      name: 'Dailymotion Video',
      url: 'https://www.dailymotion.com/video/x9mnm4',
      type: 'dailymotion'
    },
    {
      name: 'Vimeo Video',
      url: 'https://vimeo.com/148751763',
      type: 'vimeo'
    },
    {
      name: 'Direct MP4',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      type: 'direct'
    },
    {
      name: 'Sample Stream',
      url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      type: 'direct'
    }
  ];
}
