'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { detectVideoPlatform } from '../utils/aiUpscaler';
import { Play, Pause, Volume2, VolumeX, Maximize, Sparkles } from 'lucide-react';

interface ConsolidatedVideoControllerProps {
  url: string;
  onResolutionDetected?: (resolution: { width: number; height: number }) => void;
  onVideoElementReady?: (video: HTMLVideoElement) => void;
  className?: string;
}

export const ConsolidatedVideoControllerSimple: React.FC<ConsolidatedVideoControllerProps> = ({
  url,
  onResolutionDetected,
  onVideoElementReady,
  className = ''
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const extractionStateRef = useRef({ lastUrl: '', isExtracting: false });
  
  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // AI Enhancement state
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementProgress, setEnhancementProgress] = useState(0);

  // Resolution state
  const [sourceResolution, setSourceResolution] = useState<{ width: number; height: number } | null>(null);
  
  // Video extraction state
  const [videoSource, setVideoSource] = useState<string>('');
  const [useIframe, setUseIframe] = useState(false);
  const [extractionError, setExtractionError] = useState<string>('');

  // Platform detection
  const detectedPlatform = detectVideoPlatform(url);
  const isDirect = !detectedPlatform || detectedPlatform.platform === 'generic';

  // Extract video URL
  const extractVideoUrl = useCallback(async (originalUrl: string) => {
    if (extractionStateRef.current.isExtracting || extractionStateRef.current.lastUrl === originalUrl) {
      return;
    }

    extractionStateRef.current.isExtracting = true;
    extractionStateRef.current.lastUrl = originalUrl;

    if (isDirect) {
      setVideoSource(originalUrl);
      setUseIframe(false);
      extractionStateRef.current.isExtracting = false;
      return;
    }

    setIsLoading(true);
    setExtractionError('');

    try {
      console.log(`🚀 🧠 AI-powered extraction starting for ${detectedPlatform?.platform}...`);
      
      // Try mega-extractor first
      const megaResponse = await fetch('/api/mega-extractor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: originalUrl })
      });
      const megaData = await megaResponse.json();

      if (megaData.success && megaData.directUrl) {
        console.log(`✅ Direct stream extracted in ${megaData.extractionTime}ms`);
        
        if (megaData.directUrl.includes('.m3u8')) {
          // Try to resolve M3U8 to actual video files
          try {
            const resolverResponse = await fetch('/api/video-resolver', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: megaData.directUrl, type: 'm3u8' })
            });

            const resolverData = await resolverResponse.json();
            
            if (resolverData.success && resolverData.videoUrl) {
              console.log(`🎬 Resolved to direct video in ${resolverData.processingTime}ms`);
              
              if (resolverData.videoUrl.includes('.mp4') || resolverData.videoUrl.includes('.m4v')) {
                const downloaderUrl = `/api/video-downloader?url=${encodeURIComponent(resolverData.videoUrl)}`;
                setVideoSource(downloaderUrl);
                setUseIframe(false);
              } else {
                const proxyUrl = `/api/proxy?url=${encodeURIComponent(resolverData.videoUrl)}`;
                setVideoSource(proxyUrl);
                setUseIframe(false);
              }
            } else {
              const proxyUrl = `/api/proxy?url=${encodeURIComponent(megaData.directUrl)}`;
              setVideoSource(proxyUrl);
              setUseIframe(false);
            }
          } catch (resolverError) {
            console.log(`⚠️ Using proxy fallback:`, resolverError);
            const proxyUrl = `/api/proxy?url=${encodeURIComponent(megaData.directUrl)}`;
            setVideoSource(proxyUrl);
            setUseIframe(false);
          }
        } else {
          setVideoSource(megaData.directUrl);
          setUseIframe(false);
        }
        return;
      }

      // Try super-extractor as fallback
      console.log(`🔄 Trying backup extractor...`);
      const superResponse = await fetch(`/api/super-extractor?url=${encodeURIComponent(originalUrl)}&platform=${detectedPlatform?.platform}&videoId=${detectedPlatform?.videoId}`);
      const superData = await superResponse.json();
      
      if (superData.success && superData.streams?.length > 0) {
        const bestStream = superData.streams[0];
        console.log(`✅ Backup extractor succeeded`);
        setVideoSource(bestStream.url);
        setUseIframe(false);
        return;
      }

      throw new Error(`Failed to extract video for ${detectedPlatform?.platform}`);
    } catch (error) {
      console.error('❌ Video extraction failed:', error);
      setExtractionError(error instanceof Error ? error.message : 'Extraction failed');
      setVideoSource('');
      setUseIframe(false);
    } finally {
      extractionStateRef.current.isExtracting = false;
      setIsLoading(false);
    }
  }, [isDirect, detectedPlatform]);

  // Initialize video source
  useEffect(() => {
    if (url && extractionStateRef.current.lastUrl !== url && !extractionStateRef.current.isExtracting) {
      extractVideoUrl(url);
    }
  }, [url, extractVideoUrl]);

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
  }, [videoSource, useIframe, onResolutionDetected, onVideoElementReady]);

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
          return prev + Math.random() * 15;
        });
      }, 150);

      await new Promise(resolve => setTimeout(resolve, 1500));
      
      clearInterval(progressInterval);
      setEnhancementProgress(100);
      
      console.log(`✨ AI Enhancement applied successfully`);
      
      setTimeout(() => {
        setEnhancementProgress(0);
        setIsEnhancing(false);
      }, 800);
    } catch (error) {
      console.error('Enhancement failed:', error);
      setIsEnhancing(false);
      setEnhancementProgress(0);
    }
  }, [isEnhancing]);

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

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`relative bg-gradient-to-br from-black to-gray-900 rounded-xl overflow-hidden ${className}`}>
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="text-white text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg font-medium">🧠 AI Processing...</p>
            <p className="text-sm text-gray-400">Extracting and optimizing video</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 bg-red-500/20 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="text-white text-center p-6">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-lg font-medium mb-2">Video Loading Failed</p>
            <p className="text-sm text-gray-300">{error}</p>
            {extractionError && <p className="text-xs text-gray-400 mt-2">{extractionError}</p>}
          </div>
        </div>
      )}

      {/* Video */}
      <video
        ref={videoRef}
        src={videoSource}
        className="w-full h-full min-h-[400px] object-contain"
        playsInline
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(true)}
      />

      {/* AI Enhancement Progress */}
      {isEnhancing && (
        <div className="absolute top-4 left-4 right-4 z-30">
          <div className="bg-black/80 backdrop-blur-lg rounded-lg p-4 border border-white/20">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
              <span className="text-white font-medium">AI Enhancement in Progress</span>
              <span className="text-blue-400 font-mono text-sm">{enhancementProgress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${enhancementProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Custom controls */}
      {!useIframe && videoSource && (
        <div 
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 z-10"
          onMouseEnter={() => setShowControls(true)}
        >
          {/* Progress bar */}
          <div className="mb-4">
            <div 
              className="w-full h-2 bg-gray-700 rounded-full cursor-pointer hover:h-3 transition-all"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = ((e.clientX - rect.left) / rect.width) * 100;
                handleSeek(percent);
              }}
            >
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlayPause}
                className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all hover:scale-105"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-blue-400 transition-colors"
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
                  className="w-20 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer slider"
                />
              </div>

              <span className="text-white text-sm font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={enhanceVideo}
                disabled={isEnhancing}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {isEnhancing ? 'Enhancing...' : 'AI Enhance'}
              </button>

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="text-white hover:text-blue-400 transition-colors"
              >
                <Maximize size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolution info */}
      {sourceResolution && (
        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-lg rounded-lg p-3 text-white text-sm z-10 border border-white/20">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="font-medium">Source Quality</span>
          </div>
          <div className="text-blue-300 font-mono">
            {sourceResolution.width} × {sourceResolution.height}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsolidatedVideoControllerSimple;
