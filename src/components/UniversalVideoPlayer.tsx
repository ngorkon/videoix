'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RefreshCw, ExternalLink, Settings, Zap, Eye, Monitor } from 'lucide-react';
import { detectVideoPlatform, generateUniversalStealthUrls, type UniversalVideoInfo } from '../utils/aiUpscaler';
import { AIEnhancementOverlay } from './AIEnhancementOverlay';
import DirectVideoEnhancer from './DirectVideoEnhancer';

interface UniversalVideoPlayerProps {
  url: string;
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
}

interface DirectStreamData {
  success: boolean;
  canExtract: boolean;
  platform: string;
  data?: {
    direct_url: string;
    quality: string;
    format: string;
    resolution: string;
  };
  stealthUrls?: string[];
  fallback?: boolean;
}

export function UniversalVideoPlayer({
  url,
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
}: UniversalVideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentEmbedIndex, setCurrentEmbedIndex] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [stealthUrls, setStealthUrls] = useState<string[]>([]);
  const [currentEmbedUrl, setCurrentEmbedUrl] = useState<string>('');
  const [videoInfo, setVideoInfo] = useState<UniversalVideoInfo | null>(null);
  
  // Direct stream states
  const [directStreamData, setDirectStreamData] = useState<DirectStreamData | null>(null);
  const [useDirectStream, setUseDirectStream] = useState(false);
  const [isExtractingStream, setIsExtractingStream] = useState(false);
  const [showFallbackMessage, setShowFallbackMessage] = useState(false);
  const [isAdvancedScraping, setIsAdvancedScraping] = useState(false);
  const [bypassAttempts, setBypassAttempts] = useState(0);
  const [maxBypassAttempts] = useState(5);
  const [loadStartTime] = useState(Date.now());
  
  // Stealth mode controls
  const [selectedStealthMode, setSelectedStealthMode] = useState(0);
  const [showStealthSelector, setShowStealthSelector] = useState(false);
  const [manualStealthControl, setManualStealthControl] = useState(false);

  // Optimized detection and URL generation
  useEffect(() => {
    if (url) {
      const detectedInfo = detectVideoPlatform(url);
      if (detectedInfo) {
        setVideoInfo(detectedInfo);
        const urls = generateUniversalStealthUrls(detectedInfo);
        setStealthUrls(urls);
        setCurrentEmbedUrl(urls[0]);
        
        // For Dailymotion/Vimeo, start with iframe immediately (no extraction delay)
        if (detectedInfo.platform === 'dailymotion' || detectedInfo.platform === 'vimeo') {
          console.log(`⚡ Fast-track iframe loading for ${detectedInfo.platform}:`, detectedInfo.videoId);
          setIsLoading(false); // Start loading iframe immediately
          
          // Optionally try advanced scraping in background (non-blocking)
          setTimeout(() => {
            setIsAdvancedScraping(true);
            fetch(`/api/advanced-scraper?videoId=${detectedInfo.videoId}&platform=${detectedInfo.platform}`)
              .then(res => res.json())
              .then(data => {
                if (data.success && data.streams?.length > 0) {
                  console.log(`🚀 Background scraping found streams for ${detectedInfo.platform}`);
                }
              })
              .catch(() => {})
              .finally(() => setIsAdvancedScraping(false));
          }, 3000); // Try after 3 seconds, non-blocking
        } else {
          console.log(`🎬 Detected ${detectedInfo.platform} video:`, detectedInfo.videoId);
        }
      }
    }
  }, [url]);

  // Advanced stream scraping
  const attemptAdvancedScraping = useCallback(async () => {
    if (!videoInfo || bypassAttempts >= maxBypassAttempts) return false;
    
    setIsAdvancedScraping(true);
    setBypassAttempts(prev => prev + 1);
    
    try {
      console.log(`🔧 Advanced scraping attempt ${bypassAttempts + 1} for ${videoInfo.platform}`);
      
      const response = await fetch(`/api/advanced-scraper?videoId=${videoInfo.videoId}&platform=${videoInfo.platform}`);
      const data = await response.json();
      
      if (data.success) {
        if (data.streams && data.streams.length > 0) {
          console.log(`✅ Found ${data.streams.length} direct streams via advanced scraping`);
          
          // Try the highest quality stream
          const bestStream = data.streams.sort((a: { quality: string }, b: { quality: string }) => {
            const aQuality = parseInt(a.quality) || 0;
            const bQuality = parseInt(b.quality) || 0;
            return bQuality - aQuality;
          })[0];
          
          setDirectStreamData({
            success: true,
            canExtract: true,
            platform: videoInfo.platform,
            data: {
              direct_url: bestStream.streamUrl,
              quality: bestStream.quality,
              format: bestStream.format,
              resolution: bestStream.quality
            }
          });
          
          setUseDirectStream(true);
          setIsLoading(false);
          setHasError(false);
          return true;
        } else if (data.embedUrl) {
          console.log(`📺 Using enhanced embed from advanced scraping`);
          const enhancedEmbedUrl = `${data.embedUrl}&origin=${encodeURIComponent(window.location.origin)}`;
          setCurrentEmbedUrl(enhancedEmbedUrl);
          setStealthUrls([enhancedEmbedUrl, ...stealthUrls]);
        }
      }
    } catch (error) {
      console.error('❌ Advanced scraping failed:', error);
    } finally {
      setIsAdvancedScraping(false);
    }
    
    return false;
  }, [videoInfo, bypassAttempts, maxBypassAttempts, stealthUrls]);

  // Attempt universal stream extraction with enhanced techniques
  const attemptUniversalExtraction = useCallback(async (videoUrl: string) => {
    setIsExtractingStream(true);
    try {
      const response = await fetch(`/api/universal-extract?url=${encodeURIComponent(videoUrl)}&quality=best&format=mp4`);
      const data = await response.json();
      
      console.log('Universal extraction result:', data);
      setDirectStreamData(data);
      
      if (data.success && data.canExtract && data.data?.direct_url) {
        setUseDirectStream(true);
        setIsLoading(false);
        setHasError(false);
        console.log(`✅ Direct stream available for ${data.platform}:`, data.data.direct_url);
        return true;
      } else if (data.success && data.fallback) {
        console.log(`⚠️ Using enhanced iframe fallback for ${data.platform}`);
        setShowFallbackMessage(true);
        if (data.stealthUrls && data.stealthUrls.length > 0) {
          setStealthUrls(data.stealthUrls);
          setCurrentEmbedUrl(data.stealthUrls[0]);
        }
        
        // Try advanced scraping if universal extraction failed
        setTimeout(() => {
          attemptAdvancedScraping();
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Universal extraction failed:', error);
      
      // Try advanced scraping as fallback
      setTimeout(() => {
        attemptAdvancedScraping();
      }, 1000);
    } finally {
      setIsExtractingStream(false);
    }
    return false;
  }, [attemptAdvancedScraping]);

  const forceAdvancedBypass = useCallback(() => {
    console.log(`🚀 Force bypass activated for ${videoInfo?.platform}`);
    setBypassAttempts(0); // Reset counter for force bypass
    attemptAdvancedScraping();
  }, [videoInfo?.platform, attemptAdvancedScraping]);

  // Optimized extraction - immediate for fast platforms, background for slow ones
  useEffect(() => {
    if (url && videoInfo) {
      // For slow platforms (Dailymotion, Vimeo), skip universal extraction
      if (videoInfo.platform === 'dailymotion' || videoInfo.platform === 'vimeo') {
        console.log(`⚡ Skipping slow extraction for ${videoInfo.platform}, using iframe directly`);
        return;
      }
      
      // For other platforms, try extraction
      attemptUniversalExtraction(url);
    }
  }, [url, videoInfo, attemptUniversalExtraction]);

  // Enhanced iframe error handling with intelligent recovery strategies
  const handleIframeError = useCallback(() => {
    console.warn(`❌ Iframe error for ${videoInfo?.platform} - Method ${currentEmbedIndex + 1}/${stealthUrls.length}`);
    
    // Implement intelligent error recovery
    if (videoInfo?.platform === 'dailymotion' || videoInfo?.platform === 'vimeo') {
      // For restricted platforms, try multiple recovery strategies
      const strategies = [
        () => {
          // Strategy 1: Try proxy URL with enhanced headers
          const proxyUrl = `/api/proxy?url=${encodeURIComponent(currentEmbedUrl)}&bypass=advanced`;
          console.log('🛡️ Trying proxy bypass with enhanced headers');
          setCurrentEmbedUrl(proxyUrl);
        },
        () => {
          // Strategy 2: Try mobile version
          if (videoInfo.platform === 'dailymotion') {
            const mobileUrl = `https://touch.dailymotion.com/embed/video/${videoInfo.videoId}?autoplay=false&info=false`;
            console.log('📱 Trying mobile version bypass');
            setCurrentEmbedUrl(mobileUrl);
          }
        },
        () => {
          // Strategy 3: Try CDN bypass
          if (videoInfo.platform === 'dailymotion') {
            const cdnUrl = `https://geo.dailymotion.com/player.html?video=${videoInfo.videoId}&autoplay=false&mute=false`;
            console.log('🌐 Trying CDN bypass');
            setCurrentEmbedUrl(cdnUrl);
          }
        },
        () => {
          // Strategy 4: Force advanced scraping
          console.log('🔧 Forcing advanced stream extraction');
          attemptAdvancedScraping();
        }
      ];
      
      const strategyIndex = Math.min(retryCount, strategies.length - 1);
      if (strategyIndex < strategies.length) {
        setTimeout(() => {
          strategies[strategyIndex]();
          setRetryCount(prev => prev + 1);
          setHasError(false);
          setIsLoading(true);
        }, 1000 + Math.random() * 1000);
        return;
      }
    }
    
    setHasError(true);
  }, [currentEmbedIndex, videoInfo, stealthUrls, currentEmbedUrl, retryCount, attemptAdvancedScraping]);

  // Enhanced iframe loading with universal stealth techniques and success detection
  const handleIframeLoad = useCallback(() => {
    const loadTime = Date.now() - loadStartTime;
    console.log(`✅ Iframe loaded successfully for ${videoInfo?.platform} in ${loadTime}ms using method ${currentEmbedIndex + 1}`);
    
    setIsLoading(false);
    setHasError(false); // Clear any previous errors
    
    // Additional stealth measures for all platforms
    const iframe = iframeRef.current;
    if (iframe && videoInfo) {
      try {
        // Platform-specific stealth setup
        iframe.setAttribute('data-player-type', `${videoInfo.platform}-player`);
        iframe.setAttribute('data-origin', 'internal');
        
        // Remove platform-specific detection attributes
        iframe.removeAttribute(`data-${videoInfo.platform}-iframe`);
        
        // Post success message to iframe for platforms that listen
        setTimeout(() => {
          if (iframe.contentWindow) {
            try {
              iframe.contentWindow.postMessage(
                { type: 'player-ready', source: 'videoix' },
                '*'
              );
            } catch {
              // Silently fail for cross-origin restrictions
            }
          }
        }, 1000);
        
        // For Dailymotion/Vimeo, verify the iframe actually loaded content
        if (videoInfo.platform === 'dailymotion' || videoInfo.platform === 'vimeo') {
          setTimeout(() => {
            try {
              // Check if iframe has actual content (not just loaded empty frame)
              const doc = iframe.contentDocument || iframe.contentWindow?.document;
              if (doc && doc.body) {
                const hasContent = doc.body.children.length > 0 || (doc.body.textContent?.trim().length || 0) > 0;
                if (!hasContent) {
                  console.warn(`⚠️ ${videoInfo.platform} iframe loaded but appears empty, trying next method`);
                  handleIframeError();
                }
              }
            } catch {
              // Cross-origin restrictions prevent access, assume success
              console.log(`🔒 ${videoInfo.platform} iframe cross-origin protected (normal for embedded videos)`);
            }
          }, 2000);
        }
        
      } catch (error) {
        console.error('Error in iframe setup:', error);
      }
    }
  }, [videoInfo, currentEmbedIndex, loadStartTime, handleIframeError]);

  // Try next stealth URL
  const tryNextStealthUrl = useCallback(() => {
    if (currentEmbedIndex < stealthUrls.length - 1) {
      const nextIndex = currentEmbedIndex + 1;
      setCurrentEmbedIndex(nextIndex);
      setSelectedStealthMode(nextIndex); // Update selected mode for UI
      setCurrentEmbedUrl(stealthUrls[nextIndex]);
      setHasError(false);
      setIsLoading(true);
      
      console.log(`🔄 Trying universal stealth method ${nextIndex + 1}/${stealthUrls.length} for ${videoInfo?.platform}`);
    } else {
      // All stealth methods failed, try direct extraction as last resort
      setRetryCount(prev => prev + 1);
      if (retryCount < 2) {
        console.log(`🚀 All embed methods failed for ${videoInfo?.platform}, forcing direct extraction...`);
        attemptUniversalExtraction(url);
      }
    }
  }, [currentEmbedIndex, stealthUrls, retryCount, attemptUniversalExtraction, url, videoInfo]);

  // Try next stealth URL manually
  const trySpecificStealthMode = useCallback((modeIndex: number) => {
    if (!videoInfo || modeIndex >= stealthUrls.length) return;
    
    console.log(`🎯 Manually trying stealth mode ${modeIndex + 1}/${stealthUrls.length} for ${videoInfo.platform}`);
    setSelectedStealthMode(modeIndex);
    setCurrentEmbedIndex(modeIndex);
    setCurrentEmbedUrl(stealthUrls[modeIndex]);
    setHasError(false);
    setIsLoading(true);
    setRetryCount(0); // Reset retry count for manual selection
  }, [videoInfo, stealthUrls]);

  // Generate stealth mode descriptions
  const getStealthModeDescription = useCallback((index: number, platform: string) => {
    const descriptions: Record<string, string[]> = {
      dailymotion: [
        'Standard Embed - Basic embedding',
        'Syndication Bypass - Partner embedding',
        'Geo Domain - Geographic routing',
        'Chromeless Mode - No UI elements',
        'Mobile Version - Touch interface',
        'Proxy Standard - Basic anti-detection',
        'Proxy Advanced - Full stealth mode',
        'CDN Bypass - Content delivery network',
        'Stream Extract - Direct video URL',
        'Mobile CDN - Mobile content network',
        'Static Embed - Static hosting',
        'Alternative CDN - Backup servers'
      ],
      youtube: [
        'NooCookie Standard - Privacy mode',
        'YouTube Standard - Regular embed',
        'Modified Standard - Custom parameters',
        'NooCookie Clean - Minimal tracking',
        'NooCookie Anonymous - Zero referrer'
      ],
      vimeo: [
        'Player Standard - Default player',
        'DNT Mode - Do not track',
        'Background Mode - Minimal interface',
        'Direct Embed - Alternative embed',
        'Clean Player - No branding'
      ],
      generic: [
        'Direct Video URL - No embedding required'
      ]
    };
    
    const platformDescriptions = descriptions[platform] || descriptions.generic;
    return platformDescriptions[index] || `Mode ${index + 1} - Alternative bypass`;
  }, []);

  // Manual stealth mode selection UI
  const renderStealthModeSelector = () => {
    if (videoInfo?.platform !== 'dailymotion' && videoInfo?.platform !== 'vimeo') return null;
    
    return (
      <div className="absolute top-4 right-4 bg-gray-800/90 backdrop-blur-md rounded-lg p-4 text-white text-sm shadow-lg z-20">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold">{videoInfo.platform === 'dailymotion' ? 'Dailymotion Stealth Modes' : 'Vimeo Stealth Modes'}</h4>
          <button
            onClick={() => setShowStealthSelector(false)}
            className="text-gray-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex flex-col gap-2">
          {stealthUrls.map((_, index) => (
            <button
              key={index}
              onClick={() => trySpecificStealthMode(index)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 ease-in-out
                ${selectedStealthMode === index ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedStealthMode === index ? 'currentColor' : 'transparent' }} />
                {getStealthModeDescription(index, videoInfo.platform)}
              </span>
              
              {selectedStealthMode === index && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const openInOriginalPlatform = () => {
    window.open(url, '_blank');
  };

  // Platform-specific labels and colors
  const getPlatformInfo = () => {
    if (!videoInfo) return { name: 'Video', color: 'bg-gray-500' };
    
    switch (videoInfo.platform) {
      case 'youtube':
        return { name: 'YouTube', color: 'bg-red-500' };
      case 'dailymotion':
        return { name: 'Dailymotion', color: 'bg-blue-500' };
      case 'vimeo':
        return { name: 'Vimeo', color: 'bg-cyan-500' };
      case 'facebook':
        return { name: 'Facebook', color: 'bg-blue-600' };
      case 'instagram':
        return { name: 'Instagram', color: 'bg-pink-500' };
      case 'twitter':
        return { name: 'Twitter', color: 'bg-sky-500' };
      case 'tiktok':
        return { name: 'TikTok', color: 'bg-black' };
      case 'twitch':
        return { name: 'Twitch', color: 'bg-purple-500' };
      default:
        return { name: 'Video', color: 'bg-gray-500' };
    }
  };

  const platformInfo = getPlatformInfo();

  // Show direct video enhancer if we have a direct stream
  if (useDirectStream && directStreamData?.data?.direct_url) {
    return (
      <div className={`relative w-full h-full bg-gray-900 rounded-lg overflow-hidden ${className}`}>
        <DirectVideoEnhancer
          videoUrl={directStreamData.data.direct_url}
          originalResolution={directStreamData.data.resolution}
          targetResolution={upscalingConfig ? `${upscalingConfig.targetWidth}x${upscalingConfig.targetHeight}` : '1080p'}
        />
        
        {/* Direct stream indicator */}
        <div className={`absolute top-4 left-4 px-3 py-1 ${platformInfo.color}/90 backdrop-blur-sm rounded-full text-sm font-medium text-white flex items-center gap-2 z-10`}>
          <Monitor className="h-4 w-4" />
          {platformInfo.name} Direct 4K Stream
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {/* Optimized Loading State */}
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
                {isExtractingStream 
                  ? `Extracting ${platformInfo.name} stream...` 
                  : videoInfo?.platform === 'dailymotion' || videoInfo?.platform === 'vimeo'
                    ? `Loading ${platformInfo.name} player...` // Fast loading message
                    : `Loading ${platformInfo.name} player...`}
              </p>
              {isAdvancedScraping && (
                <p className="text-sm text-purple-400 mt-1">
                  🚀 Advanced bypass in progress...
                </p>
              )}
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

      {/* Error State with Universal Options */}
      <AnimatePresence>
        {hasError && !isLoading && !useDirectStream && !isExtractingStream && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10 p-6 text-center"
          >
            <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Universal Bypass Required</h3>
            <p className="text-gray-400 mb-4 max-w-md">
              {platformInfo.name} is blocking standard embeds. We&apos;re using advanced stealth techniques to bypass restrictions.
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
                onClick={() => attemptUniversalExtraction(url)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                <Zap className="h-4 w-4" />
                Force Direct Extraction
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={forceAdvancedBypass}
                disabled={isAdvancedScraping}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                <Settings className="h-4 w-4" />
                {isAdvancedScraping ? 'Bypassing...' : 'Advanced Bypass'}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={openInOriginalPlatform}
                className={`flex items-center gap-2 px-4 py-2 ${platformInfo.color} hover:opacity-80 text-white rounded-lg font-medium transition-colors`}
              >
                <ExternalLink className="h-4 w-4" />
                Open in {platformInfo.name}
              </motion.button>
            </div>
            
            <div className="mt-4 text-xs text-gray-500 max-w-md">
              <p>Platform: {platformInfo.name} • Methods: {currentEmbedIndex + 1}/{stealthUrls.length} • Retries: {retryCount}/2</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stealth Mode Selector - Manual Control */}
      {!hasError && !useDirectStream && stealthUrls.length > 1 && (
        <div className="mb-4 p-4 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-white">Stealth Mode Control</span>
              <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full">
                Mode {selectedStealthMode + 1}/{stealthUrls.length}
              </span>
            </div>
            <button
              onClick={() => setShowStealthSelector(!showStealthSelector)}
              className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
            >
              {showStealthSelector ? 'Hide' : 'Show'} Options
            </button>
          </div>
          
          <div className="text-xs text-gray-400 mb-3">
            Current: {getStealthModeDescription(selectedStealthMode, videoInfo?.platform || 'generic')}
          </div>
          
          {showStealthSelector && (
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {stealthUrls.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => trySpecificStealthMode(index)}
                    disabled={isLoading}
                    className={`text-left p-2 rounded text-xs transition-colors ${
                      index === selectedStealthMode
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    } disabled:opacity-50`}
                  >
                    <div className="font-medium">Mode {index + 1}</div>
                    <div className="text-xs opacity-80 truncate">
                      {getStealthModeDescription(index, videoInfo?.platform || 'generic')}
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-700">
                <button
                  onClick={() => setManualStealthControl(!manualStealthControl)}
                  className={`text-xs px-3 py-1 rounded transition-colors ${
                    manualStealthControl 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  {manualStealthControl ? 'Auto Mode' : 'Manual Mode'}
                </button>
                
                <button
                  onClick={() => trySpecificStealthMode(Math.floor(Math.random() * stealthUrls.length))}
                  disabled={isLoading}
                  className="text-xs px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors disabled:opacity-50"
                >
                  Random Mode
                </button>
                
                <button
                  onClick={() => {
                    const proxyUrl = `/api/proxy?url=${encodeURIComponent(stealthUrls[selectedStealthMode])}&bypass=advanced`;
                    setCurrentEmbedUrl(proxyUrl);
                    setIsLoading(true);
                    setHasError(false);
                  }}
                  disabled={isLoading}
                  className="text-xs px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50"
                >
                  Force Proxy
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Universal Stealth Iframe with Proxy Support */}
      {!hasError && !useDirectStream && currentEmbedUrl && (
        <>
          <iframe
            ref={iframeRef}
            src={bypassAttempts > 2 ? `/api/proxy?url=${encodeURIComponent(currentEmbedUrl)}&referer=${encodeURIComponent('https://www.dailymotion.com')}` : currentEmbedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen; microphone; camera"
            allowFullScreen
            title={`Enhanced ${platformInfo.name} Player`}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            style={{
              border: 'none',
              background: 'transparent'
            }}
            // Enhanced anti-detection attributes
            data-player-type={`${videoInfo?.platform}-player`}
            data-origin="internal"
            data-bypass-level={bypassAttempts}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads allow-top-navigation-by-user-activation"
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

      {/* Platform Mode Indicator */}
      {!hasError && !isLoading && !useDirectStream && videoInfo && (
        <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/70 backdrop-blur-sm rounded-lg text-sm text-white">
          <span className="flex items-center gap-2">
            <Eye className="h-3 w-3" />
            {platformInfo.name} Stealth Mode {currentEmbedIndex + 1}
            {showFallbackMessage && ' • Enhanced Fallback'}
            {bypassAttempts > 0 && ` • Bypass L${bypassAttempts}`}
            {bypassAttempts > 2 && ' • PROXY'}
          </span>
        </div>
      )}

      {/* Universal Stream Status */}
      {directStreamData && !useDirectStream && (
        <div className={`absolute top-4 left-4 px-3 py-1 ${platformInfo.color}/90 backdrop-blur-sm rounded-lg text-sm text-white`}>
          <span className="flex items-center gap-2">
            <Settings className="h-3 w-3" />
            {directStreamData.success && directStreamData.fallback ? `${platformInfo.name} Fallback` : `${platformInfo.name} Pending`}
          </span>
        </div>
      )}

      {/* Stealth Mode Selector */}
      {showStealthSelector && renderStealthModeSelector()}
    </div>
  );
}
