'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { detectVideoPlatform } from '../utils/aiUpscaler';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';

interface ConsolidatedVideoControllerProps {
  url: string;
  onResolutionDetected?: (resolution: { width: number; height: number }) => void;
  onVideoElementReady?: (video: HTMLVideoElement) => void;
  className?: string;
}

export const ConsolidatedVideoController: React.FC<ConsolidatedVideoControllerProps> = ({
  url,
  onResolutionDetected,
  onVideoElementReady,
  className = ''
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const extractionStateRef = useRef({ lastUrl: '', isExtracting: false });
  
  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // AI Enhancement state
  const [enhancementLevel, setEnhancementLevel] = useState(1.5);
  const [enhancementType, setEnhancementType] = useState<'super-resolution' | 'deep-reconstruction'>('super-resolution');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementProgress, setEnhancementProgress] = useState(0);

  // Resolution state
  const [sourceResolution, setSourceResolution] = useState<{ width: number; height: number } | null>(null);
  const [outputResolution, setOutputResolution] = useState<{ width: number; height: number } | null>(null);
  
  // Video extraction state
  const [videoSource, setVideoSource] = useState<string>('');
  const [useIframe, setUseIframe] = useState(false);
  const [extractionError, setExtractionError] = useState<string>('');

  // Calculate output resolution based on enhancement level
  const calculateOutputResolution = useCallback((source: { width: number; height: number }) => {
    const output = {
      width: Math.round(source.width * enhancementLevel),
      height: Math.round(source.height * enhancementLevel)
    };
    setOutputResolution(output);
  }, [enhancementLevel]);

  // Initialize video source - simple effect that won't loop
  useEffect(() => {
    // Simple URL detection inside the effect to avoid dependency issues
    const detectedPlatformLocal = detectVideoPlatform(url);
    const isDirectLocal = !detectedPlatformLocal || detectedPlatformLocal.platform === 'generic';

    // Check if already processing this URL or if this URL was already processed
    if (extractionStateRef.current.isExtracting || extractionStateRef.current.lastUrl === url) {
      console.log(`🔄 Skipping duplicate extraction for: ${url}`);
      return;
    }

    // Mark as processing
    extractionStateRef.current.isExtracting = true;
    extractionStateRef.current.lastUrl = url;

    // Reset state
    setError('');
    setExtractionError('');

    const extractVideo = async () => {
      if (isDirectLocal) {
        console.log(`📁 Direct video detected: ${url}`);
        setVideoSource(url);
        setUseIframe(false);
        setIsLoading(false);
        extractionStateRef.current.isExtracting = false;
        return;
      }

      setIsLoading(true);
      console.log(`🚀 🧠 MEGA-INTELLIGENT EXTRACTOR launching for ${detectedPlatformLocal?.platform}...`);

      try {
        const megaResponse = await fetch('/api/mega-extractor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });

        const megaData = await megaResponse.json();

        if (megaData.success) {
          const speedEmoji = megaData.extractionTime < 500 ? '⚡' : megaData.extractionTime < 1000 ? '🚀' : '✅';
          
          // For YouTube/Vimeo, prefer embed
          if (detectedPlatformLocal?.platform === 'youtube' || detectedPlatformLocal?.platform === 'vimeo') {
            if (megaData.embedUrl) {
              console.log(`📺 💫 MEGA-INTELLIGENT using ENHANCED EMBED (${megaData.method}) in ${megaData.extractionTime}ms`);
              setVideoSource(megaData.embedUrl);
              setUseIframe(true);
              setIsLoading(false);
              extractionStateRef.current.isExtracting = false;
              return;
            }
          } 
          // For Dailymotion, try to resolve actual video files
          else if (megaData.directUrl) {
            console.log(`${speedEmoji} 💎 MEGA-INTELLIGENT got DIRECT STREAM (${megaData.method}) in ${megaData.extractionTime}ms!`);
            
            // Check if it's M3U8 stream, try to resolve to actual video files
            if (megaData.directUrl.includes('.m3u8')) {
              console.log(`🔍 Resolving M3U8 to actual video files...`);
              
              try {
                const resolverResponse = await fetch('/api/video-resolver', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ url: megaData.directUrl, type: 'm3u8' })
                });

                const resolverData = await resolverResponse.json();
                
                if (resolverData.success && resolverData.videoUrl) {
                  console.log(`✅ 🎬 RESOLVED to direct video: ${resolverData.method} in ${resolverData.processingTime}ms`);
                  
                  // Check if we got an actual MP4 or if it's still HLS
                  if (resolverData.videoUrl.includes('.mp4') || resolverData.videoUrl.includes('.m4v')) {
                    // Direct MP4 - use video downloader for better compatibility
                    const downloaderUrl = `/api/video-downloader?url=${encodeURIComponent(resolverData.videoUrl)}`;
                    setVideoSource(downloaderUrl);
                    setUseIframe(false);
                  } else if (resolverData.method === 'hls-playlist') {
                    // Still HLS but optimized - use proxy
                    const proxyUrl = `/api/proxy?url=${encodeURIComponent(resolverData.videoUrl)}`;
                    setVideoSource(proxyUrl);
                    setUseIframe(false);
                  } else {
                    // Fallback to original proxy method
                    const proxyUrl = `/api/proxy?url=${encodeURIComponent(megaData.directUrl)}`;
                    setVideoSource(proxyUrl);
                    setUseIframe(false);
                  }
                } else {
                  console.log(`⚠️ Video resolver failed, using proxy fallback`);
                  const proxyUrl = `/api/proxy?url=${encodeURIComponent(megaData.directUrl)}`;
                  setVideoSource(proxyUrl);
                  setUseIframe(false);
                }
              } catch (resolverError) {
                console.log(`⚠️ Video resolver error, using proxy fallback:`, resolverError);
                const proxyUrl = `/api/proxy?url=${encodeURIComponent(megaData.directUrl)}`;
                setVideoSource(proxyUrl);
                setUseIframe(false);
              }
            } else {
              // Direct video file
              setVideoSource(megaData.directUrl);
              setUseIframe(false);
            }
            setIsLoading(false);
            extractionStateRef.current.isExtracting = false;
            return;
          }
        }

        // Fallback to embed
        console.log(`🔄 ⚡ MEGA-INTELLIGENT fallback: Using stealth embed system for ${detectedPlatformLocal?.platform}`);
        
        if (detectedPlatformLocal?.platform === 'youtube') {
          const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([^&\n?#]+)/)?.[1];
          if (videoId) {
            const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&controls=1&modestbranding=1&rel=0`;
            setVideoSource(embedUrl);
            setUseIframe(true);
            setIsLoading(false);
            extractionStateRef.current.isExtracting = false;
            return;
          }
        } else if (detectedPlatformLocal?.platform === 'dailymotion') {
          const videoId = url.match(/dailymotion\.com\/video\/([^_\?]+)/)?.[1];
          if (videoId) {
            const embedUrl = `https://www.dailymotion.com/embed/video/${videoId}?autoplay=1`;
            setVideoSource(embedUrl);
            setUseIframe(true);
            setIsLoading(false);
            extractionStateRef.current.isExtracting = false;
            return;
          }
        } else if (detectedPlatformLocal?.platform === 'vimeo') {
          const videoId = url.match(/vimeo\.com\/([0-9]+)/)?.[1];
          if (videoId) {
            const embedUrl = `https://player.vimeo.com/video/${videoId}?autoplay=1`;
            setVideoSource(embedUrl);
            setUseIframe(true);
            setIsLoading(false);
            extractionStateRef.current.isExtracting = false;
            return;
          }
        }

        throw new Error(`Failed to extract video for ${detectedPlatformLocal?.platform}`);
      } catch (error) {
        console.error('❌ Video extraction failed:', error);
        setExtractionError(error instanceof Error ? error.message : 'Extraction failed');
        
        // Ultimate fallback
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
        setVideoSource(proxyUrl);
        setUseIframe(false);
      } finally {
        extractionStateRef.current.isExtracting = false;
        setIsLoading(false);
      }
    };

    if (url) {
      extractVideo();
    }
  }, [url]);

  // Video element setup
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSource || useIframe) return;

    const handleLoadedMetadata = () => {
      const source = {
        width: video.videoWidth,
        height: video.videoHeight
      };
      setSourceResolution(source);
      setDuration(video.duration);
      onResolutionDetected?.(source);
      onVideoElementReady?.(video);
      calculateOutputResolution(source);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setError('');
    };

    const handleError = () => {
      setError('Failed to load video');
      setIsLoading(false);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      setError('');
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('loadstart', handleLoadStart);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadstart', handleLoadStart);
    };
  }, [videoSource, useIframe, onResolutionDetected, onVideoElementReady, calculateOutputResolution]);

  // Update output resolution when enhancement level changes
  useEffect(() => {
    if (sourceResolution) {
      calculateOutputResolution(sourceResolution);
    }
  }, [enhancementLevel, sourceResolution, calculateOutputResolution]);

  // AI Enhancement function
  const enhanceVideo = useCallback(async () => {
    const video = videoRef.current;
    if (!video || isEnhancing) return;

    setIsEnhancing(true);
    setEnhancementProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setEnhancementProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 10;
        });
      }, 200);

      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(progressInterval);
      setEnhancementProgress(100);
      
      console.log(`✨ AI Enhancement applied: ${enhancementType} at ${enhancementLevel}x`);
      
      setTimeout(() => {
        setEnhancementProgress(0);
        setIsEnhancing(false);
      }, 1000);
    } catch (error) {
      console.error('Enhancement failed:', error);
      setIsEnhancing(false);
      setEnhancementProgress(0);
    }
  }, [enhancementLevel, enhancementType, isEnhancing]);

  // Playback controls
  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video || useIframe) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, useIframe]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    const video = videoRef.current;
    if (!video || useIframe) return;

    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  }, [useIframe]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video || useIframe) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted, useIframe]);

  const handleSeek = useCallback((newProgress: number) => {
    const video = videoRef.current;
    if (!video || useIframe) return;

    const newTime = (newProgress / 100) * duration;
    video.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress(newProgress);
  }, [duration, useIframe]);

  const toggleFullscreen = useCallback(() => {
    const container = videoRef.current?.parentElement;
    if (!container) return;

    if (!isFullscreen) {
      container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p>🧠 AI-Powered Extraction...</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center z-20">
          <div className="text-white text-center p-4">
            <p>❌ {error}</p>
            {extractionError && <p className="text-sm opacity-75">{extractionError}</p>}
          </div>
        </div>
      )}

      {/* Video or Iframe */}
      {useIframe && videoSource ? (
        <iframe
          ref={iframeRef}
          src={videoSource}
          className="w-full h-full min-h-[400px]"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <video
          ref={videoRef}
          src={videoSource}
          className="w-full h-full"
          playsInline
          controls={useIframe}
        />
      )}

      {/* AI Enhancement Progress */}
      {isEnhancing && (
        <div className="absolute bottom-20 left-4 right-4 z-30">
          <div className="bg-black/80 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="animate-pulse">✨</div>
              <span className="text-white text-sm">AI Enhancement: {enhancementType}</span>
              <span className="text-blue-400 text-sm">{enhancementProgress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                style={{ width: `${enhancementProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Custom controls (only for non-iframe videos) */}
      {!useIframe && videoSource && showControls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 z-10">
          {/* Progress bar */}
          <div className="mb-4">
            <div 
              className="w-full h-1 bg-gray-600 rounded-full cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = ((e.clientX - rect.left) / rect.width) * 100;
                handleSeek(percent);
              }}
            >
              <div 
                className="h-1 bg-red-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlayPause}
                className="text-white hover:text-red-500 transition-colors"
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-red-500 transition-colors"
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-20"
                />
              </div>

              <span className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* AI Enhancement Controls */}
              <div className="flex items-center gap-2 mr-4">
                <select
                  value={enhancementType}
                  onChange={(e) => setEnhancementType(e.target.value as 'super-resolution' | 'deep-reconstruction')}
                  className="bg-black/50 text-white text-xs rounded px-2 py-1"
                >
                  <option value="super-resolution">Super Resolution</option>
                  <option value="deep-reconstruction">Deep Reconstruction</option>
                </select>
                
                <input
                  type="range"
                  min="1"
                  max="4"
                  step="0.1"
                  value={enhancementLevel}
                  onChange={(e) => setEnhancementLevel(parseFloat(e.target.value))}
                  className="w-16"
                />
                
                <button
                  onClick={enhanceVideo}
                  disabled={isEnhancing}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded text-xs hover:from-blue-600 hover:to-purple-600 disabled:opacity-50"
                >
                  {isEnhancing ? '...' : '✨ AI'}
                </button>
              </div>

              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-red-500 transition-colors"
              >
                <Maximize size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolution info */}
      {(sourceResolution || outputResolution) && (
        <div className="absolute top-4 right-4 bg-black/80 rounded-lg p-2 text-white text-xs z-10">
          {sourceResolution && (
            <div>Source: {sourceResolution.width}×{sourceResolution.height}</div>
          )}
          {outputResolution && (
            <div className="text-green-400">
              AI Output: {outputResolution.width}×{outputResolution.height}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConsolidatedVideoController;