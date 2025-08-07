import { NextRequest, NextResponse } from 'next/server';
import youtubeDl from 'youtube-dl-exec';

/**
 * Enhanced YouTube video stream extraction API
 * This implementation extracts direct video streams for true AI processing
 */

interface VideoFormat {
  format_id: string;
  url: string;
  ext: string;
  width?: number;
  height?: number;
  fps?: number;
  vcodec?: string;
  acodec?: string;
  filesize?: number;
  quality?: string;
}

interface ExtractedInfo {
  id: string;
  title: string;
  description?: string;
  duration?: number;
  uploader?: string;
  view_count?: number;
  thumbnail: string;
  formats: VideoFormat[];
  best_quality?: VideoFormat;
  direct_url?: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const videoId = searchParams.get('videoId');
  const quality = searchParams.get('quality') || 'best';
  const format = searchParams.get('format') || 'mp4';

  if (!videoId) {
    return NextResponse.json(
      { error: 'Video ID is required' },
      { status: 400 }
    );
  }

  try {
    // Method 1: Full stream extraction using youtube-dl with enhanced stealth
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    console.log(`🎯 Extracting video info for: ${videoUrl}`);
    
    // Enhanced options with better anti-detection
    const extractionOptions = {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      quiet: true,
      format: quality === 'best' ? 'best[ext=mp4]/best' : `${quality}[ext=${format}]/${quality}`,
      addHeader: [
        'referer:https://www.youtube.com/',
        'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'accept-language:en-US,en;q=0.9',
        'accept-encoding:gzip, deflate, br',
        'sec-fetch-dest:document',
        'sec-fetch-mode:navigate',
        'sec-fetch-site:none',
        'upgrade-insecure-requests:1'
      ],
      cookies: '', // Let youtube-dl handle cookies
      extractFlat: false,
      writeSubtitles: false,
      writeAutoSub: false,
      skipDownload: false,
      // Additional anti-detection measures
      retries: 3,
      fragmentRetries: 3,
      timeout: 30,
      socketTimeout: 30
    };

    // Add random delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

    // Extract video information and formats
    const videoInfo = await youtubeDl(videoUrl, extractionOptions) as Record<string, unknown>;

    if (!videoInfo) {
      throw new Error('Failed to extract video information');
    }

    console.log('✅ Video info extracted successfully');

    // Process formats and find the best quality options
    const formats: VideoFormat[] = ((videoInfo.formats as unknown[]) || [])
      .filter((fmt: unknown) => {
        const format = fmt as Record<string, unknown>;
        return format.url && (format.vcodec !== 'none' || format.acodec !== 'none');
      })
      .map((fmt: unknown) => {
        const format = fmt as Record<string, unknown>;
        return {
          format_id: format.format_id as string,
          url: format.url as string,
          ext: (format.ext as string) || 'mp4',
          width: format.width as number,
          height: format.height as number,
          fps: format.fps as number,
          vcodec: format.vcodec as string,
          acodec: format.acodec as string,
          filesize: format.filesize as number,
          quality: (format.format_note as string) || (format.quality as string)
        };
      });

    // Find best video quality for AI processing
    const videoFormats = formats.filter(fmt => fmt.vcodec && fmt.vcodec !== 'none');
    const bestQuality = videoFormats.reduce((best, current) => {
      if (!best) return current;
      if (!current.height || !best.height) return best;
      return current.height > best.height ? current : best;
    }, videoFormats[0]);

    const extractedInfo: ExtractedInfo = {
      id: videoInfo.id as string,
      title: videoInfo.title as string,
      description: videoInfo.description as string | undefined,
      duration: videoInfo.duration as number | undefined,
      uploader: videoInfo.uploader as string | undefined,
      view_count: videoInfo.view_count as number | undefined,
      thumbnail: videoInfo.thumbnail as string,
      formats: formats,
      best_quality: bestQuality,
      direct_url: bestQuality?.url
    };

    // Enhanced return with more detailed success information
    return NextResponse.json({
      success: true,
      videoId: videoId,
      canExtract: true,
      extractionMethod: 'youtube-dl-direct',
      data: extractedInfo,
      message: 'Direct stream extraction successful - 4K AI upscaling ready',
      aiReady: {
        directUrl: bestQuality?.url,
        resolution: bestQuality ? `${bestQuality.width}x${bestQuality.height}` : 'unknown',
        format: bestQuality?.ext,
        canUpscale: true,
        maxResolution: bestQuality?.height ? (bestQuality.height <= 480 ? '4K ready' : 'Enhanced ready') : 'unknown'
      },
      availableFormats: formats.length,
      extractionTime: Date.now()
    });

  } catch (extractionError) {
    console.error('❌ Direct extraction failed:', extractionError);
    
    // Enhanced fallback strategy
    try {
      console.log('🔄 Attempting enhanced fallback methods...');
      
      // Method 1: Try with different youtube-dl options
      const fallbackOptions = {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        quiet: true,
        format: 'worst[ext=mp4]/worst', // Try lowest quality first
        addHeader: [
          'user-agent:Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
        ],
        retries: 1,
        timeout: 15
      };
      
      const fallbackVideoInfo = await youtubeDl(`https://www.youtube.com/watch?v=${videoId}`, fallbackOptions) as Record<string, unknown>;
      
      if (fallbackVideoInfo && fallbackVideoInfo.url) {
        console.log('✅ Fallback extraction successful');
        return NextResponse.json({
          success: true,
          videoId: videoId,
          canExtract: true,
          extractionMethod: 'youtube-dl-fallback',
          data: {
            id: fallbackVideoInfo.id as string,
            title: fallbackVideoInfo.title as string,
            direct_url: fallbackVideoInfo.url as string,
            format: (fallbackVideoInfo.ext as string) || 'mp4',
            resolution: 'fallback-quality',
            thumbnail: fallbackVideoInfo.thumbnail as string
          },
          message: 'Fallback extraction successful - Basic stream available',
          fallback: true
        });
      }
    } catch (fallbackError) {
      console.error('❌ Fallback extraction also failed:', fallbackError);
    }
    
    // Method 2: Enhanced oEmbed fallback
    try {
      const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const oEmbedResponse = await fetch(oEmbedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (oEmbedResponse.ok) {
        const oEmbedData = await oEmbedResponse.json();
        
        // Generate more sophisticated embed URLs
        const enhancedUrls = [
          `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&origin=${request.nextUrl.origin}&rel=0&modestbranding=1&html5=1&iv_load_policy=3&showinfo=0&controls=1`,
          `https://www.youtube.com/embed/${videoId}?html5=1&rel=0&modestbranding=1&showinfo=0&controls=1&disablekb=1&fs=1&playsinline=1`,
          `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&controls=1&rel=0&showinfo=0&modestbranding=1&enablejsapi=1&origin=${request.nextUrl.origin}&widgetid=1`,
          `https://www.youtube.com/embed/${videoId}?wmode=transparent&rel=0&modestbranding=1&showinfo=0&controls=1&theme=dark&color=white`
        ];

        return NextResponse.json({
          success: true,
          videoId: videoId,
          title: oEmbedData.title,
          thumbnail: oEmbedData.thumbnail_url,
          enhancedUrls: enhancedUrls,
          canExtract: false,
          fallback: true,
          extractionMethod: 'enhanced-embed',
          extractionError: extractionError instanceof Error ? extractionError.message : 'Unknown error',
          message: 'Enhanced iframe embedding with AI simulation overlay - Direct extraction blocked'
        });
      }
    } catch (fallbackError) {
      console.error('❌ Enhanced oEmbed fallback failed:', fallbackError);
    }

    return NextResponse.json({
      success: false,
      error: 'All extraction methods failed',
      videoId: videoId,
      extractionError: extractionError instanceof Error ? extractionError.message : 'Unknown extraction error'
    }, { status: 404 });
  }
}

/**
 * POST endpoint for advanced extraction requests with custom parameters
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoId, quality, format, extractAudio } = body;

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    // Advanced extraction with custom parameters
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    const options: Record<string, unknown> = {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      addHeader: [
        'referer:youtube.com',
        'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      ]
    };

    // Set format based on requirements
    if (quality && format) {
      options.format = `${quality}[ext=${format}]`;
    } else if (quality) {
      options.format = `${quality}`;
    } else {
      options.format = 'best[ext=mp4]';
    }

    // Extract audio if requested
    if (extractAudio) {
      options.extractAudio = true;
      options.audioFormat = 'mp3';
    }

    try {
      const videoInfo = await youtubeDl(videoUrl, options) as Record<string, unknown>;
      
      return NextResponse.json({
        success: true,
        videoId: videoId,
        canExtract: true,
        data: {
          id: videoInfo.id as string,
          title: videoInfo.title as string,
          direct_url: videoInfo.url as string,
          format: videoInfo.ext as string,
          resolution: (videoInfo.width && videoInfo.height) ? `${videoInfo.width}x${videoInfo.height}` : 'unknown',
          duration: videoInfo.duration as number,
          thumbnail: videoInfo.thumbnail as string
        },
        message: 'Advanced extraction successful',
        parameters: { quality, format, extractAudio }
      });

    } catch (extractionError) {
      return NextResponse.json({
        success: false,
        error: 'Advanced extraction failed',
        videoId: videoId,
        extractionError: extractionError instanceof Error ? extractionError.message : 'Unknown error',
        suggestion: 'Try with different quality/format parameters'
      }, { status: 422 });
    }

  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request format', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    );
  }
}
