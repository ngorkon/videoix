import { NextRequest, NextResponse } from 'next/server';
import { detectVideoPlatform, generateUniversalStealthUrls, extractVideoMetadata } from '../../../utils/aiUpscaler';

interface ExtractionResult {
  success: boolean;
  directUrl: string;
  platform: string;
  resolution?: string;
  metadata?: Record<string, unknown>;
}

// Platform-specific extractors
async function extractYouTubeStream(videoId: string): Promise<ExtractionResult> {
  try {
    // Use yt-dlp for YouTube extraction
    const { spawn } = await import('child_process');
    const ytDlpPath = process.env.YTDLP_PATH || 'yt-dlp';
    
    return new Promise((resolve, reject) => {
      const args = [
        '--get-url',
        '--format', 'best[ext=mp4]/best',
        '--no-warnings',
        `https://www.youtube.com/watch?v=${videoId}`
      ];
      
      const ytDlp = spawn(ytDlpPath, args);
      let output = '';
      let error = '';
      
      ytDlp.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      ytDlp.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      ytDlp.on('close', (code) => {
        if (code === 0 && output.trim()) {
          resolve({
            success: true,
            directUrl: output.trim(),
            platform: 'youtube'
          });
        } else {
          reject(new Error(error || 'YouTube extraction failed'));
        }
      });
    });
  } catch (error) {
    throw new Error(`YouTube extraction error: ${error}`);
  }
}


async function extractGenericStream(url: string): Promise<ExtractionResult> {
  try {
    // For generic video URLs, return as-is
    return {
      success: true,
      directUrl: url,
      platform: 'generic'
    };
  } catch (error) {
    throw new Error(`Generic extraction error: ${error}`);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const quality = searchParams.get('quality') || 'best';
    const format = searchParams.get('format') || 'mp4';

    if (!url) {
      return NextResponse.json({
        success: false,
        error: 'URL parameter is required'
      }, { status: 400 });
    }

    console.log(`🔍 Universal video extraction request: ${url}`);

    // Detect video platform
    const videoInfo = detectVideoPlatform(url);
    
    if (!videoInfo) {
      return NextResponse.json({
        success: false,
        error: 'Unsupported video platform or invalid URL'
      }, { status: 400 });
    }

    console.log(`📺 Detected platform: ${videoInfo.platform}, Video ID: ${videoInfo.videoId}`);

    // Generate stealth URLs for embedding
    const stealthUrls = generateUniversalStealthUrls(videoInfo);
    
    // Try to extract metadata
    const metadata = await extractVideoMetadata(videoInfo);
    
    let extractionResult: ExtractionResult;
    
    try {
      // Use super-intelligent extractor for all platforms
      console.log(`🚀 Using SUPER EXTRACTOR for ${videoInfo.platform}:`, videoInfo.videoId);
      
      try {
        const superResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/super-extractor?url=${encodeURIComponent(videoInfo.originalUrl)}&platform=${videoInfo.platform}&videoId=${videoInfo.videoId}`);
        const superData = await superResponse.json();
        
        if (superData.success) {
          if (superData.streams && superData.streams.length > 0) {
            const bestStream = superData.streams[0]; // Get highest quality
            console.log(`✅ SUPER EXTRACTOR got direct stream (${superData.method}): ${bestStream.url}`);
            
            return NextResponse.json({
              success: true,
              directUrl: bestStream.url,
              platform: videoInfo.platform,
              resolution: bestStream.quality || 'unknown',
              stealthUrls,
              metadata: {
                title: superData.metadata?.title,
                duration: superData.metadata?.duration,
                thumbnail: superData.metadata?.thumbnail
              },
              extractionTime: superData.extractionTime,
              method: superData.method
            });
          } else if (superData.embedUrl) {
            console.log(`📺 SUPER EXTRACTOR using enhanced embed (${superData.method})`);
            
            return NextResponse.json({
              success: true,
              canExtract: false,
              platform: videoInfo.platform,
              embedUrl: superData.embedUrl,
              stealthUrls,
              metadata: {
                title: superData.metadata?.title,
                duration: superData.metadata?.duration,
                thumbnail: superData.metadata?.thumbnail
              },
              extractionTime: superData.extractionTime,
              method: superData.method
            });
          }
        }
      } catch (superError) {
        console.log(`⚠️ SUPER EXTRACTOR failed, trying legacy fallback:`, superError);
      }

      // Legacy fallback for YouTube and generic videos only
      if (videoInfo.platform === 'youtube' || videoInfo.platform === 'generic') {
        console.log(`🔄 Using legacy extraction for ${videoInfo.platform}`);
        
        const extractionPromise = (async () => {
          switch (videoInfo.platform) {
            case 'youtube':
              return await extractYouTubeStream(videoInfo.videoId);
            case 'generic':
              return await extractGenericStream(videoInfo.originalUrl);
            default:
              throw new Error(`Direct extraction not supported for ${videoInfo.platform}`);
          }
        })();

        // Add timeout to prevent hanging
        extractionResult = await Promise.race([
          extractionPromise,
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Extraction timeout - using fallback')), 8000)
          )
        ]);
        
        console.log(`✅ Direct stream extraction successful for ${videoInfo.platform}`);
        
        return NextResponse.json({
          success: true,
          canExtract: true,
          platform: videoInfo.platform,
          videoInfo: {
            ...videoInfo,
            ...metadata
          },
          data: {
            direct_url: extractionResult.directUrl,
            quality,
            format,
            resolution: extractionResult.resolution || 'unknown'
          },
          stealthUrls,
          fallback: false
        });
      } else {
        // For other platforms, skip to fallback immediately
        throw new Error(`Fast fallback for ${videoInfo.platform} - using stealth embed`);
      }

    } catch (extractionError) {
      console.log(`⚠️ Direct extraction failed for ${videoInfo.platform}:`, extractionError);
      
      // Return stealth embedding URLs as fallback
      return NextResponse.json({
        success: true,
        canExtract: false,
        platform: videoInfo.platform,
        videoInfo: {
          ...videoInfo,
          ...metadata
        },
        stealthUrls,
        fallback: true,
        fallbackReason: `Direct extraction not available for ${videoInfo.platform}`
      });
    }

  } catch (error) {
    console.error('Universal extraction error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown extraction error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      console.log('⚠️ Invalid JSON in POST request');
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON in request body'
      }, { status: 400 });
    }
    
    const { url, quality = 'best', format = 'mp4' } = body;

    if (!url) {
      return NextResponse.json({
        success: false,
        error: 'URL is required'
      }, { status: 400 });
    }

    // Use the same logic as GET but with POST body
    const searchParams = new URLSearchParams({
      url,
      quality,
      format
    });

    const getRequest = new NextRequest(
      `${request.nextUrl.origin}${request.nextUrl.pathname}?${searchParams}`,
      { method: 'GET' }
    );

    return await GET(getRequest);

  } catch (error) {
    console.error('Universal extraction POST error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown extraction error'
    }, { status: 500 });
  }
}
