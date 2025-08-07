import { NextRequest, NextResponse } from 'next/server';

interface VideoStream {
  url: string;
  quality: string;
  format: string;
  size?: number;
  fps?: number;
  headers?: Record<string, string>;
}

interface ExtractionResult {
  success: boolean;
  streams: VideoStream[];
  directUrl?: string;
  embedUrl?: string;
  metadata?: {
    title?: string;
    duration?: number;
    thumbnail?: string;
  };
  extractionTime: number;
  method: string;
}

// Super-intelligent extraction with parallel processing and smart fallbacks
class SuperVideoExtractor {
  private userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0'
  ];

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
  }

  // Ultra-fast YouTube extraction with multiple methods
  async extractYouTube(videoId: string): Promise<ExtractionResult> {
    const startTime = Date.now();
    
    const methods = [
      this.youtubeMethod1(videoId),
      this.youtubeMethod2(videoId),
      this.youtubeMethod3(videoId),
      this.youtubeMethod4(videoId),
      this.youtubeMethod5(videoId)
    ];

    try {
      // Run all methods in parallel and take the first successful one
      const result = await Promise.any(methods);
      result.extractionTime = Date.now() - startTime;
      return result;
    } catch {
      // If all methods fail, return enhanced embed
      return {
        success: true,
        streams: [],
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&controls=0&disablekb=1&fs=1&modestbranding=1&playsinline=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(process.env.VERCEL_URL || 'http://localhost:3000')}`,
        extractionTime: Date.now() - startTime,
        method: 'enhanced-embed-fallback'
      };
    }
  }

  // Method 1: YouTube player API
  private async youtubeMethod1(videoId: string): Promise<ExtractionResult> {
    const userAgent = this.getRandomUserAgent();
    
    const response = await this.withTimeout(
      fetch(`https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': userAgent,
          'X-YouTube-Client-Name': '1',
          'X-YouTube-Client-Version': '2.20231214.01.00'
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: 'WEB',
              clientVersion: '2.20231214.01.00'
            }
          },
          videoId: videoId
        })
      }),
      3000
    );

    if (!response.ok) throw new Error('YouTube API failed');
    
    const data = await response.json();
    
    if (data.streamingData?.formats || data.streamingData?.adaptiveFormats) {
      const streams: VideoStream[] = [];
      
      // Process regular formats
      if (data.streamingData.formats) {
        for (const format of data.streamingData.formats) {
          if (format.url) {
            streams.push({
              url: format.url,
              quality: format.qualityLabel || `${format.height}p`,
              format: format.mimeType?.split('/')[1]?.split(';')[0] || 'mp4',
              size: format.contentLength ? parseInt(format.contentLength) : undefined,
              fps: format.fps
            });
          }
        }
      }
      
      // Process adaptive formats
      if (data.streamingData.adaptiveFormats) {
        for (const format of data.streamingData.adaptiveFormats) {
          if (format.url && format.mimeType?.includes('video')) {
            streams.push({
              url: format.url,
              quality: format.qualityLabel || `${format.height}p`,
              format: format.mimeType.split('/')[1].split(';')[0],
              size: format.contentLength ? parseInt(format.contentLength) : undefined,
              fps: format.fps
            });
          }
        }
      }
      
      if (streams.length > 0) {
        // Sort by quality (highest first)
        streams.sort((a, b) => {
          const aHeight = parseInt(a.quality.replace('p', '')) || 0;
          const bHeight = parseInt(b.quality.replace('p', '')) || 0;
          return bHeight - aHeight;
        });
        
        return {
          success: true,
          streams,
          directUrl: streams[0].url,
          metadata: {
            title: data.videoDetails?.title,
            duration: parseInt(data.videoDetails?.lengthSeconds),
            thumbnail: data.videoDetails?.thumbnail?.thumbnails?.[0]?.url
          },
          extractionTime: 0,
          method: 'youtube-player-api'
        };
      }
    }
    
    throw new Error('No streams found in YouTube API response');
  }

  // Method 2: YouTube embed extraction
  private async youtubeMethod2(videoId: string): Promise<ExtractionResult> {
    const userAgent = this.getRandomUserAgent();
    
    const response = await this.withTimeout(
      fetch(`https://www.youtube.com/embed/${videoId}`, {
        headers: { 'User-Agent': userAgent }
      }),
      2000
    );
    
    if (!response.ok) throw new Error('YouTube embed failed');
    
    const html = await response.text();
    
    // Extract player config from embed page
    const configMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
    if (configMatch) {
      try {
        const config = JSON.parse(configMatch[1]);
        
        if (config.streamingData?.formats) {
          const streams: VideoStream[] = config.streamingData.formats
            .filter((f: { url?: string }) => f.url)
            .map((f: { url: string; qualityLabel?: string; height?: number; mimeType?: string }) => ({
              url: f.url,
              quality: f.qualityLabel || `${f.height}p`,
              format: f.mimeType?.split('/')[1]?.split(';')[0] || 'mp4'
            }));
          
          if (streams.length > 0) {
            return {
              success: true,
              streams,
              directUrl: streams[0].url,
              extractionTime: 0,
              method: 'youtube-embed-config'
            };
          }
        }
      } catch {
        // Continue to next method
      }
    }
    
    throw new Error('No streams found in YouTube embed');
  }

  // Method 3: YouTube watch page extraction
  private async youtubeMethod3(videoId: string): Promise<ExtractionResult> {
    const userAgent = this.getRandomUserAgent();
    
    const response = await this.withTimeout(
      fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: { 'User-Agent': userAgent }
      }),
      2000
    );
    
    if (!response.ok) throw new Error('YouTube watch page failed');
    
    const html = await response.text();
    
    // Extract from ytInitialPlayerResponse
    const playerMatch = html.match(/var ytInitialPlayerResponse = ({.+?});/);
    if (playerMatch) {
      try {
        const playerData = JSON.parse(playerMatch[1]);
        
        if (playerData.streamingData?.formats) {
          const streams: VideoStream[] = playerData.streamingData.formats
            .filter((f: { url?: string }) => f.url)
            .map((f: { url: string; qualityLabel?: string; height?: number; mimeType?: string }) => ({
              url: f.url,
              quality: f.qualityLabel || `${f.height}p`,
              format: f.mimeType?.split('/')[1]?.split(';')[0] || 'mp4'
            }));
          
          if (streams.length > 0) {
            return {
              success: true,
              streams,
              directUrl: streams[0].url,
              extractionTime: 0,
              method: 'youtube-watch-page'
            };
          }
        }
      } catch {
        // Continue
      }
    }
    
    throw new Error('No streams found in YouTube watch page');
  }

  // Method 4: YouTube oEmbed + hybrid
  private async youtubeMethod4(videoId: string): Promise<ExtractionResult> {
    const response = await this.withTimeout(
      fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`),
      1500
    );
    
    if (!response.ok) throw new Error('YouTube oEmbed failed');
    
    const data = await response.json();
    
    // Use oEmbed for metadata and enhanced embed for playback
    return {
      success: true,
      streams: [],
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&controls=0&disablekb=1&fs=1&modestbranding=1&playsinline=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(process.env.VERCEL_URL || 'http://localhost:3000')}`,
      metadata: {
        title: data.title,
        thumbnail: data.thumbnail_url
      },
      extractionTime: 0,
      method: 'youtube-oembed-hybrid'
    };
  }

  // Method 5: YouTube mobile API
  private async youtubeMethod5(videoId: string): Promise<ExtractionResult> {
    const response = await this.withTimeout(
      fetch(`https://m.youtube.com/watch?v=${videoId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
        }
      }),
      2000
    );
    
    if (!response.ok) throw new Error('YouTube mobile failed');
    
    const html = await response.text();
    
    // Try to extract from mobile page
    const configMatch = html.match(/ytInitialPlayerResponse":\s*({.+?}),"playerResponse"/);
    if (configMatch) {
      try {
        const config = JSON.parse(configMatch[1]);
        
        if (config.streamingData?.formats) {
          const streams: VideoStream[] = config.streamingData.formats
            .filter((f: { url?: string }) => f.url)
            .map((f: { url: string; qualityLabel?: string; height?: number; mimeType?: string }) => ({
              url: f.url,
              quality: f.qualityLabel || `${f.height}p`,
              format: f.mimeType?.split('/')[1]?.split(';')[0] || 'mp4'
            }));
          
          if (streams.length > 0) {
            return {
              success: true,
              streams,
              directUrl: streams[0].url,
              extractionTime: 0,
              method: 'youtube-mobile-api'
            };
          }
        }
      } catch {
        // Continue
      }
    }
    
    throw new Error('No streams found in YouTube mobile');
  }

  // Ultra-fast Dailymotion extraction
  async extractDailymotion(videoId: string): Promise<ExtractionResult> {
    const startTime = Date.now();
    
    const methods = [
      this.dailymotionMethod1(videoId),
      this.dailymotionMethod2(videoId),
      this.dailymotionMethod3(videoId)
    ];

    try {
      const result = await Promise.any(methods);
      result.extractionTime = Date.now() - startTime;
      return result;
    } catch {
      return {
        success: true,
        streams: [],
        embedUrl: `https://www.dailymotion.com/embed/video/${videoId}?autoplay=1&mute=0&controls=1&origin=${encodeURIComponent(process.env.VERCEL_URL || 'http://localhost:3000')}`,
        extractionTime: Date.now() - startTime,
        method: 'dailymotion-embed-fallback'
      };
    }
  }

  // Method 1: Dailymotion player config
  private async dailymotionMethod1(videoId: string): Promise<ExtractionResult> {
    const userAgent = this.getRandomUserAgent();
    
    const response = await this.withTimeout(
      fetch(`https://www.dailymotion.com/player/metadata/video/${videoId}`, {
        headers: {
          'User-Agent': userAgent,
          'Referer': 'https://www.dailymotion.com/',
          'Accept': 'application/json'
        }
      }),
      2000
    );
    
    if (!response.ok) throw new Error('Dailymotion metadata failed');
    
    const data = await response.json();
    
    if (data.qualities) {
      const streams: VideoStream[] = [];
      
      for (const [quality, urls] of Object.entries(data.qualities)) {
        if (Array.isArray(urls) && urls.length > 0) {
          for (const urlData of urls) {
            if (urlData && typeof urlData === 'object' && 'url' in urlData) {
              streams.push({
                url: urlData.url,
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
        return {
          success: true,
          streams,
          directUrl: streams[0].url,
          metadata: {
            title: data.title,
            duration: data.duration,
            thumbnail: data.posters?.[0]?.url
          },
          extractionTime: 0,
          method: 'dailymotion-metadata'
        };
      }
    }
    
    throw new Error('No streams in Dailymotion metadata');
  }

  // Method 2: Dailymotion embed page
  private async dailymotionMethod2(videoId: string): Promise<ExtractionResult> {
    const userAgent = this.getRandomUserAgent();
    
    const response = await this.withTimeout(
      fetch(`https://www.dailymotion.com/embed/video/${videoId}`, {
        headers: { 'User-Agent': userAgent }
      }),
      2000
    );
    
    if (!response.ok) throw new Error('Dailymotion embed failed');
    
    const html = await response.text();
    
    // Extract config from embed
    const configMatch = html.match(/window\.__PLAYER_CONFIG__\s*=\s*({.+?});/);
    if (configMatch) {
      try {
        const config = JSON.parse(configMatch[1]);
        
        if (config.metadata?.qualities) {
          const streams: VideoStream[] = [];
          
          for (const [quality, urls] of Object.entries(config.metadata.qualities)) {
            if (Array.isArray(urls)) {
              for (const urlData of urls) {
                if (urlData && typeof urlData === 'object' && 'url' in urlData) {
                  streams.push({
                    url: urlData.url,
                    quality: quality,
                    format: 'mp4'
                  });
                }
              }
            }
          }
          
          if (streams.length > 0) {
            return {
              success: true,
              streams,
              directUrl: streams[0].url,
              extractionTime: 0,
              method: 'dailymotion-embed-config'
            };
          }
        }
      } catch {
        // Continue
      }
    }
    
    throw new Error('No config in Dailymotion embed');
  }

  // Method 3: Dailymotion watch page
  private async dailymotionMethod3(videoId: string): Promise<ExtractionResult> {
    const userAgent = this.getRandomUserAgent();
    
    const response = await this.withTimeout(
      fetch(`https://www.dailymotion.com/video/${videoId}`, {
        headers: { 'User-Agent': userAgent }
      }),
      2000
    );
    
    if (!response.ok) throw new Error('Dailymotion watch failed');
    
    const html = await response.text();
    
    // Try to extract player data from watch page
    const playerMatch = html.match(/"qualities":\s*({.+?})/);
    if (playerMatch) {
      try {
        const qualities = JSON.parse(playerMatch[1]);
        const streams: VideoStream[] = [];
        
        for (const [quality, urls] of Object.entries(qualities)) {
          if (Array.isArray(urls)) {
            for (const urlData of urls) {
              if (urlData && typeof urlData === 'object' && 'url' in urlData) {
                streams.push({
                  url: urlData.url,
                  quality: quality,
                  format: 'mp4'
                });
              }
            }
          }
        }
        
        if (streams.length > 0) {
          return {
            success: true,
            streams,
            directUrl: streams[0].url,
            extractionTime: 0,
            method: 'dailymotion-watch-page'
          };
        }
      } catch {
        // Continue
      }
    }
    
    throw new Error('No streams in Dailymotion watch page');
  }

  // Ultra-fast Vimeo extraction
  async extractVimeo(videoId: string): Promise<ExtractionResult> {
    const startTime = Date.now();
    
    const methods = [
      this.vimeoMethod1(videoId),
      this.vimeoMethod2(videoId),
      this.vimeoMethod3(videoId)
    ];

    try {
      const result = await Promise.any(methods);
      result.extractionTime = Date.now() - startTime;
      return result;
    } catch {
      return {
        success: true,
        streams: [],
        embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1&title=0&byline=0&portrait=0&dnt=1&origin=${encodeURIComponent(process.env.VERCEL_URL || 'http://localhost:3000')}`,
        extractionTime: Date.now() - startTime,
        method: 'vimeo-embed-fallback'
      };
    }
  }

  // Method 1: Vimeo player config
  private async vimeoMethod1(videoId: string): Promise<ExtractionResult> {
    const userAgent = this.getRandomUserAgent();
    
    const response = await this.withTimeout(
      fetch(`https://player.vimeo.com/video/${videoId}/config`, {
        headers: {
          'User-Agent': userAgent,
          'Referer': 'https://vimeo.com/'
        }
      }),
      2000
    );
    
    if (!response.ok) throw new Error('Vimeo config failed');
    
    const data = await response.json();
    
    if (data.request?.files?.progressive) {
      const streams: VideoStream[] = data.request.files.progressive.map((stream: { url: string; height: number }) => ({
        url: stream.url,
        quality: `${stream.height}p`,
        format: 'mp4',
        headers: {
          'Referer': 'https://player.vimeo.com/'
        }
      }));
      
      return {
        success: true,
        streams,
        directUrl: streams[0].url,
        metadata: {
          title: data.video?.title,
          duration: data.video?.duration,
          thumbnail: data.video?.thumbs?.base
        },
        extractionTime: 0,
        method: 'vimeo-player-config'
      };
    }
    
    throw new Error('No progressive streams in Vimeo config');
  }

  // Method 2: Vimeo oEmbed
  private async vimeoMethod2(videoId: string): Promise<ExtractionResult> {
    const response = await this.withTimeout(
      fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}`),
      1500
    );
    
    if (!response.ok) throw new Error('Vimeo oEmbed failed');
    
    const data = await response.json();
    
    return {
      success: true,
      streams: [],
      embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1&title=0&byline=0&portrait=0&dnt=1&origin=${encodeURIComponent(process.env.VERCEL_URL || 'http://localhost:3000')}`,
      metadata: {
        title: data.title,
        thumbnail: data.thumbnail_url
      },
      extractionTime: 0,
      method: 'vimeo-oembed'
    };
  }

  // Method 3: Vimeo API
  private async vimeoMethod3(videoId: string): Promise<ExtractionResult> {
    const userAgent = this.getRandomUserAgent();
    
    const response = await this.withTimeout(
      fetch(`https://vimeo.com/${videoId}`, {
        headers: { 'User-Agent': userAgent }
      }),
      2000
    );
    
    if (!response.ok) throw new Error('Vimeo page failed');
    
    const html = await response.text();
    
    // Extract config from page
    const configMatch = html.match(/"config_url":"([^"]+)"/);
    if (configMatch) {
      const configUrl = configMatch[1].replace(/\\u002F/g, '/');
      
      try {
        const configResponse = await this.withTimeout(
          fetch(configUrl, {
            headers: { 'User-Agent': userAgent }
          }),
          1500
        );
        
        if (configResponse.ok) {
          const configData = await configResponse.json();
          
          if (configData.request?.files?.progressive) {
            const streams: VideoStream[] = configData.request.files.progressive.map((stream: { url: string; height: number }) => ({
              url: stream.url,
              quality: `${stream.height}p`,
              format: 'mp4'
            }));
            
            return {
              success: true,
              streams,
              directUrl: streams[0].url,
              extractionTime: 0,
              method: 'vimeo-dynamic-config'
            };
          }
        }
      } catch {
        // Continue
      }
    }
    
    throw new Error('No config URL in Vimeo page');
  }

  // Generic video extraction
  async extractGeneric(url: string): Promise<ExtractionResult> {
    const startTime = Date.now();
    
    try {
      // Check if it's already a direct video URL
      const response = await this.withTimeout(
        fetch(url, { method: 'HEAD' }),
        3000
      );
      
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.startsWith('video/')) {
        return {
          success: true,
          streams: [{
            url: url,
            quality: 'original',
            format: contentType.split('/')[1]
          }],
          directUrl: url,
          extractionTime: Date.now() - startTime,
          method: 'direct-video-url'
        };
      }
      
      throw new Error('Not a direct video URL');
    } catch {
      return {
        success: false,
        streams: [],
        extractionTime: Date.now() - startTime,
        method: 'generic-failed'
      };
    }
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const platform = searchParams.get('platform');
  const videoId = searchParams.get('videoId');

  if (!url) {
    return NextResponse.json({
      success: false,
      error: 'URL parameter is required'
    }, { status: 400 });
  }

  console.log(`🚀 SUPER EXTRACTION starting for: ${url}`);
  
  const extractor = new SuperVideoExtractor();
  let result: ExtractionResult;

  try {
    if (platform && videoId) {
      // Use platform-specific extraction
      switch (platform) {
        case 'youtube':
          result = await extractor.extractYouTube(videoId);
          break;
        case 'dailymotion':
          result = await extractor.extractDailymotion(videoId);
          break;
        case 'vimeo':
          result = await extractor.extractVimeo(videoId);
          break;
        default:
          result = await extractor.extractGeneric(url);
          break;
      }
    } else {
      // Auto-detect platform and extract
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
        if (videoIdMatch) {
          result = await extractor.extractYouTube(videoIdMatch[1]);
        } else {
          throw new Error('Invalid YouTube URL');
        }
      } else if (url.includes('dailymotion.com')) {
        const videoIdMatch = url.match(/dailymotion\.com\/video\/([^/?#]+)/);
        if (videoIdMatch) {
          result = await extractor.extractDailymotion(videoIdMatch[1]);
        } else {
          throw new Error('Invalid Dailymotion URL');
        }
      } else if (url.includes('vimeo.com')) {
        const videoIdMatch = url.match(/vimeo\.com\/(\d+)/);
        if (videoIdMatch) {
          result = await extractor.extractVimeo(videoIdMatch[1]);
        } else {
          throw new Error('Invalid Vimeo URL');
        }
      } else {
        result = await extractor.extractGeneric(url);
      }
    }

    console.log(`✅ SUPER EXTRACTION completed in ${result.extractionTime}ms using ${result.method}`);
    console.log(`📊 Found ${result.streams.length} streams, direct: ${!!result.directUrl}, embed: ${!!result.embedUrl}`);

    return NextResponse.json(result);

  } catch (extractionError) {
    console.error('❌ SUPER EXTRACTION failed:', extractionError);
    
    return NextResponse.json({
      success: false,
      streams: [],
      error: extractionError instanceof Error ? extractionError.message : 'Unknown extraction error',
      extractionTime: 0,
      method: 'error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
