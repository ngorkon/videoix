import { NextRequest, NextResponse } from 'next/server';

// Constants for cache management
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const MAX_CACHE_SIZE = 1000;

interface CacheEntry {
  data: unknown;
  timestamp: number;
  hitCount: number;
}

// Intelligent cache management
class ExtractionCache {
  private cache = new Map<string, CacheEntry>();

  get(key: string): unknown | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }
    
    // Update hit count and timestamp for LRU
    entry.hitCount++;
    entry.timestamp = Date.now();
    
    return entry.data;
  }

  set(key: string, data: unknown): void {
    // Clean cache if too large
    if (this.cache.size >= MAX_CACHE_SIZE) {
      this.cleanup();
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hitCount: 1
    });
  }

  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    // Remove expired entries first
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > CACHE_TTL) {
        this.cache.delete(key);
      }
    }
    
    // If still too large, remove least recently used
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const sortedEntries = entries
        .filter(([key]) => this.cache.has(key))
        .sort((a, b) => a[1].hitCount - b[1].hitCount);
      
      const toRemove = Math.floor(MAX_CACHE_SIZE * 0.2); // Remove 20%
      for (let i = 0; i < toRemove && i < sortedEntries.length; i++) {
        this.cache.delete(sortedEntries[i][0]);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: MAX_CACHE_SIZE,
      ttl: CACHE_TTL
    };
  }
}

const cache = new ExtractionCache();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const platform = searchParams.get('platform');
  const videoId = searchParams.get('videoId');
  const action = searchParams.get('action');

  // Handle cache stats request
  if (action === 'stats') {
    return NextResponse.json(cache.getStats());
  }

  // Handle cache clear request  
  if (action === 'clear') {
    cache.clear();
    return NextResponse.json({ success: true, message: 'Cache cleared' });
  }

  if (!url) {
    return NextResponse.json({
      success: false,
      error: 'URL parameter is required'
    }, { status: 400 });
  }

  const startTime = Date.now();
  
  // Create cache key
  const cacheKey = `${platform || 'auto'}:${videoId || url}`;
  
  // Check cache first for lightning-fast response
  const cachedResult = cache.get(cacheKey);
  if (cachedResult) {
    console.log(`⚡ CACHE HIT for ${cacheKey} - instant response!`);
    return NextResponse.json({
      ...cachedResult,
      cached: true,
      extractionTime: Date.now() - startTime
    });
  }

  console.log(`🔍 CACHE MISS for ${cacheKey} - fetching...`);

  try {
    // Call super extractor
    const response = await fetch(
      `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/super-extractor?${searchParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'User-Agent': 'VideoiX-Cache/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Super extractor failed: ${response.status}`);
    }

    const result = await response.json();
    
    // Cache successful results
    if (result.success) {
      cache.set(cacheKey, result);
      console.log(`💾 CACHED result for ${cacheKey}`);
    }

    result.cached = false;
    result.extractionTime = Date.now() - startTime;

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ TURBO EXTRACTOR failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      cached: false,
      extractionTime: Date.now() - startTime
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    console.log('⚠️ Invalid JSON in turbo-extractor POST request');
    return NextResponse.json({
      success: false,
      error: 'Invalid JSON in request body'
    }, { status: 400 });
  }
  
  const { url, platform, videoId } = body;

  if (!url) {
    return NextResponse.json({
      success: false,
      error: 'URL is required'
    }, { status: 400 });
  }

  const startTime = Date.now();
  
  // Create cache key
  const cacheKey = `${platform || 'auto'}:${videoId || url}`;
  
  // Check cache first
  const cachedResult = cache.get(cacheKey);
  if (cachedResult) {
    console.log(`⚡ CACHE HIT for ${cacheKey} - instant response!`);
    return NextResponse.json({
      ...cachedResult,
      cached: true,
      extractionTime: Date.now() - startTime
    });
  }

  console.log(`🔍 CACHE MISS for ${cacheKey} - fetching...`);

  try {
    // Build query parameters for super extractor
    const params = new URLSearchParams({
      url: body.url,
      ...(body.platform && { platform: body.platform }),
      ...(body.videoId && { videoId: body.videoId })
    });
    
    // Call super extractor using GET
    const response = await fetch(
      `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/super-extractor?${params}`,
      {
        method: 'GET',
        headers: {
          'User-Agent': 'VideoiX-Cache/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Super extractor failed: ${response.status}`);
    }

    const result = await response.json();
    
    // Cache successful results
    if (result.success) {
      cache.set(cacheKey, result);
      console.log(`💾 CACHED result for ${cacheKey}`);
    }

    result.cached = false;
    result.extractionTime = Date.now() - startTime;

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ TURBO EXTRACTOR failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      cached: false,
      extractionTime: Date.now() - startTime
    }, { status: 500 });
  }
}
