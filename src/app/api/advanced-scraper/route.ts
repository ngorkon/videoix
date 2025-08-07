import { NextRequest, NextResponse } from 'next/server';

interface VideoStreamData {
  streamUrl: string;
  quality: string;
  format: string;
  headers?: Record<string, string>;
}

interface ScrapingResult {
  success: boolean;
  streams?: VideoStreamData[];
  embedUrl?: string;
  metadata?: {
    title?: string;
    duration?: number;
    thumbnail?: string;
  };
  error?: string;
}

/**
 * Extract video streams using multiple techniques with timeout and parallel processing
 */
async function scrapeVideoStreams(videoId: string, platform: string): Promise<ScrapingResult> {
  try {
    switch (platform) {
      case 'dailymotion':
        return await scrapeDailymotionStreams(videoId);
      case 'vimeo':
        return await scrapeVimeoStreams(videoId);
      default:
        throw new Error(`Scraping not supported for ${platform}`);
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown scraping error'
    };
  }
}

/**
 * Helper function to run promises with timeout
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

/**
 * Dailymotion stream scraping with parallel methods and fast fallback
 */
async function scrapeDailymotionStreams(videoId: string): Promise<ScrapingResult> {
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  
  try {
    // Try to get the player config which might contain direct streams
    const playerConfigResponse = await withTimeout(
      fetch(`https://www.dailymotion.com/player/metadata/video/${videoId}`, {
        headers: { 
          'User-Agent': userAgent,
          'Referer': 'https://www.dailymotion.com/',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(3000)
      }),
      3000
    );

    if (playerConfigResponse.ok) {
      const playerData = await playerConfigResponse.json();
      
      // Check if we have qualities data
      if (playerData && playerData.qualities) {
        const streams: VideoStreamData[] = [];
        
        // Extract available qualities (look for the actual stream URLs)
        for (const [quality, qualityData] of Object.entries(playerData.qualities)) {
          if (quality !== 'auto' && qualityData && Array.isArray(qualityData)) {
            for (const stream of qualityData) {
              if (stream && typeof stream === 'object' && 'url' in stream) {
                streams.push({
                  streamUrl: stream.url,
                  quality: quality,
                  format: 'mp4',
                  headers: {
                    'Referer': 'https://www.dailymotion.com/',
                    'User-Agent': userAgent
                  }
                });
              }
            }
          }
        }
        
        if (streams.length > 0) {
          console.log(`✅ Fast extraction successful for Dailymotion ${videoId}`);
          return {
            success: true,
            streams: streams.sort((a, b) => {
              const qualityOrder = { '1080': 5, '720': 4, '480': 3, '360': 2, '240': 1 };
              return (qualityOrder[b.quality as keyof typeof qualityOrder] || 0) - (qualityOrder[a.quality as keyof typeof qualityOrder] || 0);
            }),
            metadata: {
              title: playerData.title || `Dailymotion Video ${videoId}`,
              duration: playerData.duration,
              thumbnail: playerData.posters?.[0]?.url
            }
          };
        }
      }
    }
    
    // If no direct streams, try alternative methods for metadata at least
    try {
      const oembedResponse = await withTimeout(
        fetch(`https://www.dailymotion.com/services/oembed?url=https://www.dailymotion.com/video/${videoId}&format=json`, {
          headers: { 'User-Agent': userAgent },
          signal: AbortSignal.timeout(2000)
        }),
        2000
      );
      
      if (oembedResponse.ok) {
        const oembedData = await oembedResponse.json();
        console.log(`✅ Got metadata from oEmbed for Dailymotion ${videoId}`);
        
        return {
          success: true,
          embedUrl: `https://www.dailymotion.com/embed/video/${videoId}?autoplay=1&mute=0&queue-enable=false&sharing-enable=false&ui-logo=false&ui-start-screen-info=false&syndication=lr%3A175862&origin=${encodeURIComponent(process.env.VERCEL_URL || 'http://localhost:3001')}`,
          metadata: {
            title: oembedData.title || `Dailymotion Video ${videoId}`,
            thumbnail: oembedData.thumbnail_url
          }
        };
      }
    } catch {
      console.log(`⚠️ oEmbed failed for Dailymotion ${videoId}`);
    }
    
    // Final fallback to enhanced embed
    console.log(`⚡ Using enhanced embed fallback for Dailymotion ${videoId}`);
    return {
      success: true,
      embedUrl: `https://www.dailymotion.com/embed/video/${videoId}?autoplay=1&mute=0&queue-enable=false&sharing-enable=false&ui-logo=false&ui-start-screen-info=false&syndication=lr%3A175862&origin=${encodeURIComponent(process.env.VERCEL_URL || 'http://localhost:3001')}`,
      metadata: {
        title: `Dailymotion Video ${videoId}`
      }
    };

  } catch {
    console.log(`⚡ All methods failed, using enhanced embed fallback for Dailymotion ${videoId}`);
    return {
      success: true,
      embedUrl: `https://www.dailymotion.com/embed/video/${videoId}?autoplay=1&mute=0&queue-enable=false&sharing-enable=false&ui-logo=false&ui-start-screen-info=false&syndication=lr%3A175862&origin=${encodeURIComponent(process.env.VERCEL_URL || 'http://localhost:3001')}`,
      metadata: {
        title: `Dailymotion Video ${videoId}`
      }
    };
  }
}

/**
 * Vimeo stream scraping with fast fallback
 */
async function scrapeVimeoStreams(videoId: string): Promise<ScrapingResult> {
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  
  // Fast fallback
  const fastFallback: ScrapingResult = {
    success: true,
    embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1&title=0&byline=0&portrait=0&dnt=1&origin=${encodeURIComponent(process.env.VERCEL_URL || 'http://localhost:3001')}`,
    metadata: {
      title: `Vimeo Video ${videoId}`
    }
  };

  try {
    // Quick attempt at Vimeo's player config API with short timeout
    const configData = await withTimeout(
      fetch(`https://player.vimeo.com/video/${videoId}/config`, {
        headers: { 'User-Agent': userAgent, 'Referer': 'https://vimeo.com/' },
        signal: AbortSignal.timeout(2000)
      }).then(res => res.ok ? res.json() : null),
      2000
    );

    if (configData?.request?.files?.progressive) {
      const streams: VideoStreamData[] = configData.request.files.progressive.map((stream: { url: string; height: number }) => ({
        streamUrl: stream.url,
        quality: `${stream.height}p`,
        format: 'mp4',
        headers: {
          'Referer': 'https://player.vimeo.com/'
        }
      }));

      console.log(`✅ Fast extraction successful for Vimeo ${videoId}`);
      return {
        success: true,
        streams,
        metadata: {
          title: configData.video?.title,
          duration: configData.video?.duration,
          thumbnail: configData.video?.thumbs?.base
        }
      };
    }

    console.log(`⚡ Using fast fallback for Vimeo ${videoId}`);
    return fastFallback;

  } catch {
    console.log(`⚡ Quick method failed, using fast fallback for Vimeo ${videoId}`);
    return fastFallback;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');
  const platform = searchParams.get('platform');

  if (!videoId || !platform) {
    return NextResponse.json({
      success: false,
      error: 'videoId and platform parameters are required'
    }, { status: 400 });
  }

  console.log(`🔍 Advanced scraping for ${platform} video: ${videoId}`);

  try {
    const result = await scrapeVideoStreams(videoId, platform);
    
    if (result.success && result.streams && result.streams.length > 0) {
      console.log(`✅ Found ${result.streams.length} streams for ${platform}:${videoId}`);
    } else if (result.success && result.embedUrl) {
      console.log(`📺 Using enhanced embed for ${platform}:${videoId}`);
    } else {
      console.log(`❌ Scraping failed for ${platform}:${videoId}:`, result.error);
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Advanced scraping error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
