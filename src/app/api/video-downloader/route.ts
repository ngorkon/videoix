import { NextRequest, NextResponse } from 'next/server';

interface DownloadResult {
  success: boolean;
  videoData?: ArrayBuffer;
  contentType?: string;
  error?: string;
  size?: number;
  downloadTime: number;
}

class VideoDownloader {
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  async downloadVideoSegment(url: string, rangeStart?: number, rangeEnd?: number): Promise<DownloadResult> {
    const startTime = Date.now();
    
    try {
      console.log(`⬇️ Downloading video segment: ${url.substring(0, 100)}...`);
      
      const headers: Record<string, string> = {
        'User-Agent': this.userAgent,
        'Accept': '*/*',
        'Accept-Encoding': 'identity',
        'Connection': 'keep-alive'
      };

      // Add range header if specified
      if (rangeStart !== undefined) {
        const rangeHeader = rangeEnd !== undefined 
          ? `bytes=${rangeStart}-${rangeEnd}`
          : `bytes=${rangeStart}-`;
        headers['Range'] = rangeHeader;
        console.log(`📊 Requesting range: ${rangeHeader}`);
      }

      // Set appropriate referer based on the URL
      if (url.includes('dailymotion.com')) {
        headers['Referer'] = 'https://www.dailymotion.com/';
        headers['Origin'] = 'https://www.dailymotion.com';
      } else if (url.includes('youtube.com') || url.includes('googlevideo.com')) {
        headers['Referer'] = 'https://www.youtube.com/';
      } else if (url.includes('vimeo.com')) {
        headers['Referer'] = 'https://vimeo.com/';
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || 'video/mp4';
      const contentLength = response.headers.get('content-length');
      const size = contentLength ? parseInt(contentLength) : undefined;

      console.log(`📦 Content-Type: ${contentType}, Size: ${size ? `${Math.round(size / 1024 / 1024 * 100) / 100}MB` : 'unknown'}`);

      const videoData = await response.arrayBuffer();
      const downloadTime = Date.now() - startTime;

      console.log(`✅ Download completed in ${downloadTime}ms, received ${videoData.byteLength} bytes`);

      return {
        success: true,
        videoData,
        contentType,
        size: videoData.byteLength,
        downloadTime
      };

    } catch (error) {
      console.error('❌ Video download failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        downloadTime: Date.now() - startTime
      };
    }
  }

  async streamVideo(url: string, rangeHeader?: string): Promise<Response> {
    try {
      console.log(`🎥 Streaming video: ${url.substring(0, 100)}...`);
      
      const headers: Record<string, string> = {
        'User-Agent': this.userAgent,
        'Accept': '*/*',
        'Accept-Encoding': 'identity'
      };

      if (rangeHeader) {
        headers['Range'] = rangeHeader;
        console.log(`📊 Range request: ${rangeHeader}`);
      }

      // Set appropriate referer
      if (url.includes('dailymotion.com')) {
        headers['Referer'] = 'https://www.dailymotion.com/';
        headers['Origin'] = 'https://www.dailymotion.com';
      } else if (url.includes('youtube.com') || url.includes('googlevideo.com')) {
        headers['Referer'] = 'https://www.youtube.com/';
      } else if (url.includes('vimeo.com')) {
        headers['Referer'] = 'https://vimeo.com/';
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || 'video/mp4';
      const contentLength = response.headers.get('content-length');
      const acceptRanges = response.headers.get('accept-ranges');
      const contentRange = response.headers.get('content-range');

      // Create response headers
      const responseHeaders = new Headers({
        'Content-Type': contentType,
        'Accept-Ranges': acceptRanges || 'bytes',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Content-Range, Content-Length',
        'Cache-Control': 'public, max-age=3600',
      });

      if (contentLength) {
        responseHeaders.set('Content-Length', contentLength);
      }

      if (contentRange) {
        responseHeaders.set('Content-Range', contentRange);
      }

      const status = rangeHeader && response.status === 206 ? 206 : 200;

      console.log(`✅ Streaming response: ${status}, Content-Type: ${contentType}`);

      return new Response(response.body, {
        status,
        headers: responseHeaders
      });

    } catch (error) {
      console.error('❌ Video streaming failed:', error);
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Streaming failed'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  const download = request.nextUrl.searchParams.get('download') === 'true';
  const rangeStart = request.nextUrl.searchParams.get('start');
  const rangeEnd = request.nextUrl.searchParams.get('end');
  
  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  const downloader = new VideoDownloader();
  const rangeHeader = request.headers.get('range');

  try {
    if (download) {
      // Download mode - get the full file or specific range
      const start = rangeStart ? parseInt(rangeStart) : undefined;
      const end = rangeEnd ? parseInt(rangeEnd) : undefined;
      
      const result = await downloader.downloadVideoSegment(url, start, end);
      
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return new Response(result.videoData, {
        headers: {
          'Content-Type': result.contentType || 'video/mp4',
          'Content-Length': result.size?.toString() || '0',
          'Content-Disposition': 'inline',
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } else {
      // Streaming mode - proxy the video with range support
      return await downloader.streamVideo(url, rangeHeader || undefined);
    }
  } catch (error) {
    console.error('❌ Video download/stream error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Range, Content-Length',
    }
  });
}
