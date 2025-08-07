'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RefreshCw, ExternalLink, Settings, Zap, Eye } from 'lucide-react';
import { type VideoInfo } from '../utils/videoUtils';
import { AIEnhancementOverlay } from './AIEnhancementOverlay';
import DirectVideoEnhancer from './DirectVideoEnhancer';

interface StealthYouTubePlayerProps {
  videoInfo: VideoInfo;
  isEnhancing: boolean;
  enhancementSettings?: {
    upscaling: number;
    noiseReduction: number;
    sharpening: number;
    colorEnhancement: number;
    brightnessBoost?: number;
  };
  upscalingConfig?: {
    targetWidth: number;
    targetHeight: number;
    algorithm: string;
  } | null;
  className?: string;
  // onVideoElementReady?: (element: HTMLVideoElement) => void;
  // onResolutionDetected?: (resolution: { width: number; height: number }) => void;
}

// Stealth embedding URLs with advanced anti-detection
const generateStealthUrls = (videoId: string, origin: string) => {
  const baseParams = {
    autoplay: '0',
    controls: '1',
    disablekb: '0',
    enablejsapi: '1',
    fs: '1',
    iv_load_policy: '3',
    modestbranding: '1',
    playsinline: '1',
    rel: '0',
    showinfo: '0',
    origin: origin,
    widget_referrer: origin
  };

  const createUrl = (domain: string, extraParams: Record<string, string> = {}) => {
    const params = { ...baseParams, ...extraParams };
    const paramString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    return `https://${domain}/embed/${videoId}?${paramString}`;
  };

  return [
    // Method 1: youtube-nocookie with minimal tracking
    createUrl('www.youtube-nocookie.com', {
      html5: '1',
      cc_load_policy: '0',
      hl: 'en',
      cc_lang_pref: 'en'
    }),
    
    // Method 2: Standard YouTube with stealth params
    createUrl('www.youtube.com', {
      html5: '1',
      wmode: 'transparent',
      theme: 'dark',
      color: 'white'
    }),
    
    // Method 3: Alternative with different params
    createUrl('www.youtube-nocookie.com', {
      start: '0',
      end: '999999',
      loop: '0',
      playlist: videoId
    }),
    
    // Method 4: Minimal params for maximum compatibility
    createUrl('www.youtube.com', {
      html5: '1'
    }),
    
    // Method 5: Alternative domain approach
    createUrl('www.youtube-nocookie.com', {
      frameborder: '0',
      allowfullscreen: 'true'
    })
  ];
};

interface DirectStreamData {
  success: boolean;
  canExtract: boolean;
  data?: {
    direct_url: string;
    resolution: string;
    format: string;
    title: string;
    thumbnail: string;
  };
  fallback?: boolean;
  enhancedUrls?: string[];
}

export function StealthYouTubePlayer({ 
  videoInfo, 
  isEnhancing, 
  enhancementSettings = {
    upscaling: 2,
    noiseReduction: 0.5,
    sharpening: 0.3,
    colorEnhancement: 0.4,
    brightnessBoost: 0,
  },
  upscalingConfig,
  className = '',
  // onVideoElementReady,
  // onResolutionDetected
}: StealthYouTubePlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // const containerRef = useRef<HTMLDivElement>(null); // unused
  
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  // const [errorDetails, setErrorDetails] = useState<string>(''); // unused
  const [currentEmbedIndex, setCurrentEmbedIndex] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [stealthUrls, setStealthUrls] = useState<string[]>([]);
  const [currentEmbedUrl, setCurrentEmbedUrl] = useState<string>('');
  
  // Direct stream states
  const [directStreamData, setDirectStreamData] = useState<DirectStreamData | null>(null);
  const [useDirectStream, setUseDirectStream] = useState(false);
  const [isExtractingStream, setIsExtractingStream] = useState(false);
  const [showFallbackMessage, setShowFallbackMessage] = useState(false);

  // Generate stealth URLs
  useEffect(() => {
    if (videoInfo.videoId && typeof window !== 'undefined') {
      const urls = generateStealthUrls(videoInfo.videoId, window.location.origin);
      setStealthUrls(urls);
      setCurrentEmbedUrl(urls[0]);
    }
  }, [videoInfo.videoId]);

  // Attempt direct stream extraction immediately
  const attemptDirectExtraction = useCallback(async (videoId: string) => {
    setIsExtractingStream(true);
    try {
      const response = await fetch(`/api/youtube-extract?videoId=${videoId}&quality=best&format=mp4`);
      const data = await response.json();
      
      console.log('Direct extraction result:', data);
      setDirectStreamData(data);
      
      if (data.success && data.canExtract && data.data?.direct_url) {
        setUseDirectStream(true);
        setIsLoading(false);
        setHasError(false);
        console.log('✅ Direct stream available:', data.data.direct_url);
        return true;
      } else if (data.success && data.fallback) {
        console.log('⚠️ Using enhanced iframe fallback');
        setShowFallbackMessage(true);
      }
    } catch (error) {
      console.error('❌ Direct extraction failed:', error);
    } finally {
      setIsExtractingStream(false);
    }
    return false;
  }, []);

  // Try direct extraction first
  useEffect(() => {
    if (videoInfo.videoId) {
      attemptDirectExtraction(videoInfo.videoId);
    }
  }, [videoInfo.videoId, attemptDirectExtraction]);

  // Enhanced iframe loading with stealth techniques
  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    
    // Additional stealth measures
    const iframe = iframeRef.current;
    if (iframe) {
      try {
        // Mask the iframe as a regular video player
        iframe.setAttribute('data-player-type', 'html5-video');
        iframe.setAttribute('data-origin', 'internal');
        
        // Remove YouTube-specific attributes that might trigger detection
        iframe.removeAttribute('data-youtube-iframe');
        
        // Add artificial delay to avoid rapid requests
        setTimeout(() => {
          if (iframe.contentWindow) {
            // Post messages to simulate normal video player behavior
            iframe.contentWindow.postMessage(
              '{"event":"listening","id":""}',
              '*'
            );
          }
        }, Math.random() * 2000 + 1000);
        
      } catch (error) {
        console.warn('Stealth setup warning:', error);
      }
    }
  }, []);

  const handleIframeError = useCallback(() => {
    console.warn(`Embed method ${currentEmbedIndex + 1} failed`);
    setHasError(true);
    // setErrorDetails removed (unused)
  }, [currentEmbedIndex]);

  // Try next stealth URL
  const tryNextStealthUrl = useCallback(() => {
    if (currentEmbedIndex < stealthUrls.length - 1) {
      const nextIndex = currentEmbedIndex + 1;
      setCurrentEmbedIndex(nextIndex);
      setCurrentEmbedUrl(stealthUrls[nextIndex]);
      setHasError(false);
      setIsLoading(true);
      // setErrorDetails removed (unused)
      
      console.log(`🔄 Trying stealth method ${nextIndex + 1}/${stealthUrls.length}`);
    } else {
      // All stealth methods failed, try direct extraction as last resort
      setRetryCount(prev => prev + 1);
      if (retryCount < 2) {
        console.log('🚀 All embed methods failed, forcing direct stream extraction...');
        attemptDirectExtraction(videoInfo.videoId || '');
      }
    }
  }, [currentEmbedIndex, stealthUrls, retryCount, attemptDirectExtraction, videoInfo.videoId]);

  // Automatic failover logic
  useEffect(() => {
    if (hasError && !useDirectStream && !isExtractingStream) {
      const timeout = setTimeout(() => {
        tryNextStealthUrl();
      }, 2000 + Math.random() * 1000); // Random delay to avoid pattern detection
      
      return () => clearTimeout(timeout);
    }
  }, [hasError, useDirectStream, isExtractingStream, tryNextStealthUrl]);

  const openInYouTube = () => {
    window.open(`https://www.youtube.com/watch?v=${videoInfo.videoId}`, '_blank');
  };

  // Show direct video enhancer if we have a direct stream
  if (useDirectStream && directStreamData?.data?.direct_url) {
    return (
      <div className={`relative w-full h-full bg-gray-900 rounded-lg overflow-hidden ${className}`}>
        <DirectVideoEnhancer
          videoUrl={directStreamData.data.direct_url}
          originalResolution={directStreamData.data.resolution}
          targetResolution={upscalingConfig ? `${upscalingConfig.targetWidth}x${upscalingConfig.targetHeight}` : '1080p'}
          // onEnhancementChange removed, was unused
        />
        
        {/* Direct stream indicator */}
        <div className="absolute top-4 left-4 px-3 py-1 bg-green-500/90 backdrop-blur-sm rounded-full text-sm font-medium text-white flex items-center gap-2 z-10">
          {/* <Monitor className="h-4 w-4" /> Removed unused Monitor icon */}
          Direct 4K Stream
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {/* Loading State */}
      <AnimatePresence>
        {(isLoading || isExtractingStream) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10"
          >
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-400">
                {isExtractingStream ? 'Extracting direct stream...' : 'Loading stealth player...'}
              </p>
              {currentEmbedIndex > 0 && !isExtractingStream && (
                <p className="text-sm text-blue-400 mt-1">
                  Stealth method {currentEmbedIndex + 1}/{stealthUrls.length}
                </p>
              )}
              {retryCount > 0 && (
                <p className="text-xs text-yellow-400 mt-1">
                  Enhanced bypass attempt {retryCount}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State with Advanced Options */}
      <AnimatePresence>
        {hasError && !isLoading && !useDirectStream && !isExtractingStream && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10 p-6 text-center"
          >
            <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Advanced Bypass Required</h3>
            <p className="text-gray-400 mb-4 max-w-md">
              YouTube is blocking standard embeds. We&apos;re using advanced stealth techniques to bypass restrictions.
            </p>
            
            <div className="flex flex-wrap gap-3 justify-center">
              {currentEmbedIndex < stealthUrls.length - 1 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={tryNextStealthUrl}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Stealth Method {currentEmbedIndex + 2}
                </motion.button>
              )}
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => attemptDirectExtraction(videoInfo.videoId || '')}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                <Zap className="h-4 w-4" />
                Force Direct Extraction
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={openInYouTube}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Open in YouTube
              </motion.button>
            </div>
            
            <div className="mt-4 text-xs text-gray-500 max-w-md">
              <p>Stealth methods: {currentEmbedIndex + 1}/{stealthUrls.length} • Retries: {retryCount}/2</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stealth YouTube Iframe */}
      {!hasError && !useDirectStream && currentEmbedUrl && (
        <>
          <iframe
            ref={iframeRef}
            src={currentEmbedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            title="Enhanced Video Player"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            style={{
              border: 'none',
              background: 'transparent'
            }}
            // Anti-detection attributes
            data-player-type="html5-video"
            data-origin="internal"
          />
          
          {/* AI Enhancement Overlay for iframe */}
          <AIEnhancementOverlay
            isEnhancing={isEnhancing}
            enhancementSettings={enhancementSettings}
            upscalingConfig={upscalingConfig}
          />
        </>
      )}

      {/* Enhancement Status Indicators */}
      {isEnhancing && !hasError && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-4 right-4 px-3 py-1 bg-green-500/90 backdrop-blur-sm rounded-full text-sm font-medium text-white flex items-center gap-2 z-10"
        >
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          {useDirectStream ? 'True AI Enhancement' : 'AI Simulation Active'}
        </motion.div>
      )}

      {/* Stealth Mode Indicator */}
      {!hasError && !isLoading && !useDirectStream && (
        <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/70 backdrop-blur-sm rounded-lg text-sm text-white">
          <span className="flex items-center gap-2">
            <Eye className="h-3 w-3" />
            Stealth Mode {currentEmbedIndex + 1}
            {showFallbackMessage && ' • Enhanced Fallback'}
          </span>
        </div>
      )}

      {/* Direct Stream Extraction Status */}
      {directStreamData && !useDirectStream && (
        <div className="absolute top-4 left-4 px-3 py-1 bg-yellow-500/90 backdrop-blur-sm rounded-lg text-sm text-white">
          <span className="flex items-center gap-2">
            <Settings className="h-3 w-3" />
            {directStreamData.success && directStreamData.fallback ? 'Fallback Mode' : 'Stream Pending'}
          </span>
        </div>
      )}
    </div>
  );
}
