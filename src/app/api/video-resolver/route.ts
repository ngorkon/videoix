import { NextRequest, NextResponse } from 'next/server';

interface ResolvedVideo {
  success: boolean;
  videoUrl?: string;
  videoUrls?: Array<{
    url: string;
    quality: string;
    format: string;
    size?: number;
  }>;
  isLive?: boolean;
  error?: string;
  method: string;
  processingTime: number;
}

class VideoResolver {
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  // Parse M3U8 manifest and extract video segments
  async parseM3U8Manifest(manifestUrl: string): Promise<ResolvedVideo> {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 Parsing M3U8 manifest: ${manifestUrl}`);
      
      const response = await fetch(manifestUrl, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': '*/*',
          'Referer': 'https://www.dailymotion.com/'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch manifest: ${response.status}`);
      }

      const manifestText = await response.text();
      console.log(`📄 Manifest content preview: ${manifestText.substring(0, 200)}...`);

      // Check if this is a master playlist (contains other playlists) or media playlist (contains segments)
      if (manifestText.includes('#EXT-X-STREAM-INF')) {
        // Master playlist - extract the highest quality stream
        return this.parseMasterPlaylist(manifestText, manifestUrl);
      } else if (manifestText.includes('#EXTINF')) {
        // Media playlist - extract video segments
        return this.parseMediaPlaylist(manifestText, manifestUrl);
      } else {
        throw new Error('Invalid M3U8 format');
      }
    } catch (error) {
      console.error('❌ M3U8 parsing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        method: 'm3u8-parser',
        processingTime: Date.now() - startTime
      };
    }
  }

  // Parse master playlist and get the best quality stream
  private async parseMasterPlaylist(manifestText: string, baseUrl: string): Promise<ResolvedVideo> {
    const startTime = Date.now();
    
    try {
      const lines = manifestText.split('\n');
      const streams: Array<{ url: string; quality: string; bandwidth: number }> = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('#EXT-X-STREAM-INF:')) {
          const nextLine = lines[i + 1]?.trim();
          if (nextLine && !nextLine.startsWith('#')) {
            // Extract bandwidth and resolution
            const bandwidthMatch = line.match(/BANDWIDTH=(\d+)/);
            const resolutionMatch = line.match(/RESOLUTION=(\d+x\d+)/);
            
            const bandwidth = bandwidthMatch ? parseInt(bandwidthMatch[1]) : 0;
            const quality = resolutionMatch ? resolutionMatch[1] : `${Math.round(bandwidth / 1000)}k`;
            
            // Resolve relative URL
            const streamUrl = nextLine.startsWith('http') ? nextLine : new URL(nextLine, baseUrl).href;
            
            streams.push({
              url: streamUrl,
              quality,
              bandwidth
            });
          }
        }
      }

      if (streams.length === 0) {
        throw new Error('No streams found in master playlist');
      }

      // Sort by bandwidth (quality) and get the best one
      streams.sort((a, b) => b.bandwidth - a.bandwidth);
      const bestStream = streams[0];
      
      console.log(`🎯 Found ${streams.length} quality levels, selecting: ${bestStream.quality}`);
      
      // Now parse the media playlist for this quality
      return this.parseM3U8Manifest(bestStream.url);
      
    } catch (error) {
      console.error('❌ Master playlist parsing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        method: 'master-playlist-parser',
        processingTime: Date.now() - startTime
      };
    }
  }

  // Parse media playlist and extract segments
  private parseMediaPlaylist(manifestText: string, baseUrl: string): ResolvedVideo {
    const startTime = Date.now();
    
    try {
      const lines = manifestText.split('\n');
      const segments: string[] = [];
      let isLive = false;
      
      // Check if it's a live stream
      if (manifestText.includes('#EXT-X-PLAYLIST-TYPE:VOD')) {
        isLive = false;
      } else if (!manifestText.includes('#EXT-X-ENDLIST')) {
        isLive = true;
      }

      // Extract all video segments
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('#EXTINF:')) {
          const nextLine = lines[i + 1]?.trim();
          if (nextLine && !nextLine.startsWith('#')) {
            // Resolve relative URL
            const segmentUrl = nextLine.startsWith('http') ? nextLine : new URL(nextLine, baseUrl).href;
            segments.push(segmentUrl);
          }
        }
      }

      console.log(`📹 Found ${segments.length} video segments, isLive: ${isLive}`);

      if (segments.length === 0) {
        throw new Error('No video segments found');
      }

      // For non-live content, try to find a single MP4 URL or return the first segment
      if (!isLive && segments.length > 0) {
        // Check if segments are actual MP4 files
        const firstSegment = segments[0];
        if (firstSegment.includes('.mp4') || firstSegment.includes('.m4v')) {
          console.log(`✅ Found direct MP4 segment: ${firstSegment}`);
          return {
            success: true,
            videoUrl: firstSegment,
            videoUrls: segments.map((url, index) => ({
              url,
              quality: `segment-${index + 1}`,
              format: 'mp4'
            })),
            isLive: false,
            method: 'mp4-segment-extractor',
            processingTime: Date.now() - startTime
          };
        }
        
        // For TS segments, return the playlist URL for HLS playback
        console.log(`📺 Returning HLS playlist for TS segments`);
        return {
          success: true,
          videoUrl: baseUrl, // Return the playlist URL itself
          isLive: false,
          method: 'hls-playlist',
          processingTime: Date.now() - startTime
        };
      }

      return {
        success: true,
        videoUrl: segments[0], // Return first segment for now
        videoUrls: segments.slice(0, 10).map((url, index) => ({ // Limit to first 10 segments
          url,
          quality: `segment-${index + 1}`,
          format: 'ts'
        })),
        isLive,
        method: 'segment-extractor',
        processingTime: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('❌ Media playlist parsing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        method: 'media-playlist-parser',
        processingTime: Date.now() - startTime
      };
    }
  }

  // Try alternative extraction methods for different platforms
  async extractDirectVideo(originalUrl: string): Promise<ResolvedVideo> {
    const startTime = Date.now();
    
    try {
      // Try to get the page and look for video elements
      console.log(`🔍 Attempting direct video extraction from: ${originalUrl}`);
      
      const response = await fetch(originalUrl, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.status}`);
      }

      const html = await response.text();
      
      // Look for direct video URLs in the HTML
      const videoUrlPatterns = [
        /(?:src|data-src)="([^"]*\.mp4[^"]*)"/gi,
        /(?:src|data-src)="([^"]*\.m4v[^"]*)"/gi,
        /(?:src|data-src)="([^"]*\.webm[^"]*)"/gi,
        /"file":\s*"([^"]*\.mp4[^"]*)"/gi,
        /"videoUrl":\s*"([^"]*\.mp4[^"]*)"/gi,
      ];

      const foundUrls: string[] = [];
      
      for (const pattern of videoUrlPatterns) {
        let match;
        while ((match = pattern.exec(html)) !== null) {
          const url = match[1];
          if (url && !foundUrls.includes(url)) {
            foundUrls.push(url);
          }
        }
      }

      if (foundUrls.length > 0) {
        console.log(`✅ Found ${foundUrls.length} direct video URLs`);
        return {
          success: true,
          videoUrl: foundUrls[0],
          videoUrls: foundUrls.map((url, index) => ({
            url,
            quality: `quality-${index + 1}`,
            format: url.includes('.mp4') ? 'mp4' : url.includes('.webm') ? 'webm' : 'unknown'
          })),
          method: 'direct-html-extraction',
          processingTime: Date.now() - startTime
        };
      }

      throw new Error('No direct video URLs found in HTML');
      
    } catch (error) {
      console.error('❌ Direct video extraction failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        method: 'direct-video-extractor',
        processingTime: Date.now() - startTime
      };
    }
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { url, type } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log(`🚀 VIDEO RESOLVER starting for: ${url} (type: ${type || 'auto'})`);
    
    const resolver = new VideoResolver();
    let result: ResolvedVideo;

    if (type === 'm3u8' || url.includes('.m3u8')) {
      result = await resolver.parseM3U8Manifest(url);
    } else {
      result = await resolver.extractDirectVideo(url);
    }

    const totalTime = Date.now() - startTime;
    console.log(`${result.success ? '✅' : '❌'} VIDEO RESOLVER completed in ${totalTime}ms using ${result.method}`);

    return NextResponse.json({
      ...result,
      totalTime
    });

  } catch (error) {
    console.error('❌ Video resolver error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      method: 'video-resolver',
      processingTime: Date.now() - startTime
    }, { status: 500 });
  }
}
