import { NextRequest, NextResponse } from 'next/server';

interface VideoInfo {
  platform: string;
  videoId: string;
  originalUrl: string;
}

// Ultra-intelligent video source detection
function detectVideoSource(url: string): VideoInfo {
  // YouTube detection
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return {
          platform: 'youtube',
          videoId: match[1],
          originalUrl: url
        };
      }
    }
  }
  
  // Dailymotion detection
  if (url.includes('dailymotion.com')) {
    const patterns = [
      /dailymotion\.com\/video\/([a-zA-Z0-9]+)/,
      /dailymotion\.com\/embed\/video\/([a-zA-Z0-9]+)/,
      /dai\.ly\/([a-zA-Z0-9]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return {
          platform: 'dailymotion',
          videoId: match[1],
          originalUrl: url
        };
      }
    }
  }
  
  // Vimeo detection
  if (url.includes('vimeo.com')) {
    const patterns = [
      /vimeo\.com\/(\d+)/,
      /player\.vimeo\.com\/video\/(\d+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return {
          platform: 'vimeo',
          videoId: match[1],
          originalUrl: url
        };
      }
    }
  }
  
  // Generic video detection
  return {
    platform: 'generic',
    videoId: btoa(url).replace(/[^a-zA-Z0-9]/g, '').substring(0, 10),
    originalUrl: url
  };
}

// Generate stealth bypass URLs
function generateStealthUrls(videoInfo: VideoInfo): string[] {
  const baseUrls = [
    process.env.VERCEL_URL || 'http://localhost:3000',
    'https://noembed.com',
    'https://iframe.ly'
  ];
  
  const stealthUrls: string[] = [];
  
  switch (videoInfo.platform) {
    case 'youtube':
      stealthUrls.push(
        `https://www.youtube-nocookie.com/embed/${videoInfo.videoId}?autoplay=1&controls=1&modestbranding=1&rel=0`,
        `https://invidious.io/embed/${videoInfo.videoId}`,
        `${baseUrls[0]}/api/proxy?url=${encodeURIComponent(videoInfo.originalUrl)}`
      );
      break;
      
    case 'dailymotion':
      stealthUrls.push(
        `https://www.dailymotion.com/embed/video/${videoInfo.videoId}?autoplay=1&mute=0`,
        `https://geo.dailymotion.com/player.html?video=${videoInfo.videoId}`,
        `${baseUrls[0]}/api/proxy?url=${encodeURIComponent(videoInfo.originalUrl)}`
      );
      break;
      
    case 'vimeo':
      stealthUrls.push(
        `https://player.vimeo.com/video/${videoInfo.videoId}?autoplay=1&title=0&byline=0&portrait=0`,
        `https://vimeo.com/${videoInfo.videoId}/embed`,
        `${baseUrls[0]}/api/proxy?url=${encodeURIComponent(videoInfo.originalUrl)}`
      );
      break;
      
    default:
      stealthUrls.push(
        `${baseUrls[0]}/api/proxy?url=${encodeURIComponent(videoInfo.originalUrl)}`,
        `https://noembed.com/embed?url=${encodeURIComponent(videoInfo.originalUrl)}`
      );
      break;
  }
  
  return stealthUrls;
}

// Mega-intelligent extraction system
export async function GET(request: NextRequest) {
  const startTime = Date.now();
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

  console.log(`🔍 🧠 MEGA-INTELLIGENT extraction request: ${url}`);

  try {
    // Phase 1: Detect video source with advanced AI
    const videoInfo = detectVideoSource(url);
    console.log(`🎯 Detected platform: ${videoInfo.platform}, Video ID: ${videoInfo.videoId}`);

    // Phase 2: Generate stealth URLs for maximum bypass
    const stealthUrls = generateStealthUrls(videoInfo);

    // Phase 3: Call super-extractor with enhanced error handling
    console.log(`🚀 🦾 MEGA-INTELLIGENT SUPER EXTRACTOR launching for ${videoInfo.platform}...`);
    
    try {
      const superResponse = await fetch(
        `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/super-extractor?url=${encodeURIComponent(url)}&platform=${videoInfo.platform}&videoId=${videoInfo.videoId}`,
        {
          method: 'GET',
          headers: {
            'User-Agent': 'VideoiX-MegaIntelligent/2.0',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          },
          signal: AbortSignal.timeout(15000) // 15 second timeout
        }
      );
      
      if (superResponse.ok) {
        const superData = await superResponse.json();
        console.log(`📊 Super-extractor response:`, {
          success: superData.success,
          streamsCount: superData.streams?.length || 0,
          hasEmbed: !!superData.embedUrl,
          method: superData.method
        });
        
        if (superData.success) {
          const extractionTime = Date.now() - startTime;
          
          // Direct streams found
          if (superData.streams && superData.streams.length > 0) {
            const bestStream = superData.streams[0];
            console.log(`✅ 💎 MEGA-INTELLIGENT got DIRECT STREAM (${superData.method}) in ${extractionTime}ms: ${bestStream.url.substring(0, 100)}...`);
            
            return NextResponse.json({
              success: true,
              directUrl: bestStream.url,
              platform: videoInfo.platform,
              quality: bestStream.quality || quality,
              format: bestStream.format || format,
              extractionTime,
              method: `mega-intelligent-${superData.method}`,
              canExtract: true,
              stealthUrls,
              metadata: superData.metadata,
              videoInfo,
              data: {
                direct_url: bestStream.url,
                quality: bestStream.quality || quality,
                format: bestStream.format || format,
                extraction_time: extractionTime,
                method: superData.method
              },
              fallback: false
            });
          }
          
          // Enhanced embed found
          if (superData.embedUrl) {
            console.log(`📺 💫 MEGA-INTELLIGENT using ENHANCED EMBED (${superData.method}) in ${extractionTime}ms`);
            
            return NextResponse.json({
              success: true,
              embedUrl: superData.embedUrl,
              platform: videoInfo.platform,
              quality: 'adaptive',
              format: 'embed',
              extractionTime,
              method: `mega-intelligent-${superData.method}`,
              canExtract: true,
              stealthUrls,
              metadata: superData.metadata,
              videoInfo,
              data: {
                embed_url: superData.embedUrl,
                quality: 'adaptive',
                format: 'embed',
                extraction_time: extractionTime,
                method: superData.method
              },
              fallback: false
            });
          }
        }
      } else {
        console.log(`⚠️ Super-extractor returned ${superResponse.status}: ${superResponse.statusText}`);
      }
    } catch (superError) {
      console.log(`⚠️ Super-extractor failed:`, superError instanceof Error ? superError.message : String(superError));
    }

    // Phase 4: Mega-intelligent fallback with stealth embedding
    console.log(`🔄 ⚡ MEGA-INTELLIGENT fallback: Using stealth embed system for ${videoInfo.platform}`);
    const extractionTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      stealthUrls,
      platform: videoInfo.platform,
      quality: 'adaptive',
      format: 'embed',
      extractionTime,
      method: 'mega-intelligent-stealth-embed',
      canExtract: false,
      videoInfo,
      data: {
        stealth_urls: stealthUrls,
        quality: 'adaptive',
        format: 'embed',
        extraction_time: extractionTime,
        method: 'stealth-embed'
      },
      fallback: true
    });

  } catch (error) {
    const extractionTime = Date.now() - startTime;
    console.error('❌ MEGA-INTELLIGENT extraction error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Mega-intelligent extraction failed',
      extractionTime,
      canExtract: false,
      method: 'mega-intelligent-error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    console.log('⚠️ Invalid JSON in mega-intelligent POST request');
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

  // Create a new URL with the parameters for the GET handler
  const searchParams = new URLSearchParams({
    url,
    quality,
    format
  });
  
  const newRequest = new NextRequest(`${request.url}?${searchParams}`, {
    method: 'GET',
    headers: request.headers
  });
  
  return GET(newRequest);
}
