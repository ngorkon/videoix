'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { detectVideoPlatform } from '../utils/aiUpscaler';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings } from 'lucide-react';

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
  const [enhancementLevel, setEnhancementLevel] = useState(1.5);
  const [enhancementType, setEnhancementType] = useState<'super-resolution' | 'deep-reconstruction'>('super-resolution');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementProgress, setEnhancementProgress] = useState(0);

  // Resolution state
  const [sourceResolution, setSourceResolution] = useState<{ width: number; height: number } | null>(null);
  const [outputResolution, setOutputResolution] = useState<{ width: number; height: number } | null>(null);
  
  // Video extraction state
  const [videoSource, setVideoSource] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string>('');
  const [lastExtractedUrl, setLastExtractedUrl] = useState<string>('');
  const extractionInProgressRef = useRef<boolean>(false);

  // Platform detection
  const detectedPlatform = detectVideoPlatform(url);
  const isDirect = !detectedPlatform || detectedPlatform.platform === 'generic';

  // Extract video URL for platform videos using MEGA-INTELLIGENT extractor
  const extractVideoUrl = useCallback(async (originalUrl: string) => {
    // Prevent duplicate extractions
    if (isExtracting || lastExtractedUrl === originalUrl) {
      return;
    }

    if (isDirect) {
      setVideoSource(originalUrl);
      setLastExtractedUrl(originalUrl);
      return;
    }

    setIsExtracting(true);
    setExtractionError('');
    setLastExtractedUrl(originalUrl);

    try {
      console.log(`🚀 🧠 MEGA-INTELLIGENT EXTRACTOR launching for ${detectedPlatform?.platform}...`);
      
      // Use the new mega-intelligent extractor
      const megaResponse = await fetch('/api/mega-extractor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: originalUrl })
      });

      const megaData = await megaResponse.json();

      if (megaData.success) {
        const speedEmoji = megaData.extractionTime < 500 ? '⚡' : megaData.extractionTime < 1000 ? '🚀' : '✅';
        
        // For platforms like YouTube, use embed URLs instead of trying direct video
        if (detectedPlatform?.platform === 'youtube' || detectedPlatform?.platform === 'vimeo') {
          if (megaData.embedUrl) {
            console.log(`📺 MEGA-INTELLIGENT using ENHANCED EMBED (${megaData.method}) in ${megaData.extractionTime}ms!`);
            setVideoSource(megaData.embedUrl);
            return;
          } else if (megaData.stealthUrls && megaData.stealthUrls.length > 0) {
            console.log(`� MEGA-INTELLIGENT using STEALTH EMBED (${megaData.method}) in ${megaData.extractionTime}ms!`);
            setVideoSource(megaData.stealthUrls[0]);
            return;
          }
        } else if (megaData.directUrl) {
          // For platforms like Dailymotion, try direct streams but with CORS proxy
          console.log(`${speedEmoji} MEGA-INTELLIGENT got DIRECT STREAM (${megaData.method}) in ${megaData.extractionTime}ms!`);
          const proxyUrl = `/api/proxy?url=${encodeURIComponent(megaData.directUrl)}`;
          setVideoSource(proxyUrl);
          return;
        }
      }

      // If mega-extractor didn't work, use embed fallback
      console.log(`🔄 Using embed fallback for ${detectedPlatform?.platform}...`);
      
      if (detectedPlatform?.platform === 'youtube') {
        const videoId = originalUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([^&\n?#]+)/)?.[1];
        if (videoId) {
          const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&controls=1&modestbranding=1&rel=0`;
          setVideoSource(embedUrl);
          return;
        }
      } else if (detectedPlatform?.platform === 'dailymotion') {
        const videoId = originalUrl.match(/dailymotion\.com\/video\/([^_\?]+)/)?.[1];
        if (videoId) {
          const embedUrl = `https://www.dailymotion.com/embed/video/${videoId}?autoplay=1`;
          setVideoSource(embedUrl);
          return;
        }
      } else if (detectedPlatform?.platform === 'vimeo') {
        const videoId = originalUrl.match(/vimeo\.com\/([0-9]+)/)?.[1];
        if (videoId) {
          const embedUrl = `https://player.vimeo.com/video/${videoId}?autoplay=1`;
          setVideoSource(embedUrl);
          return;
        }
      }

      throw new Error(`Failed to extract video for ${detectedPlatform?.platform}`);
    } catch (error) {
      console.error('❌ Video extraction failed:', error);
      setExtractionError(error instanceof Error ? error.message : 'Extraction failed');
      
      // Ultimate fallback to proxy
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(originalUrl)}`;
      setVideoSource(proxyUrl);
    } finally {
      setIsExtracting(false);
    }
  }, [isDirect, detectedPlatform]); // REMOVED isExtracting and lastExtractedUrl from dependencies!

  // Calculate output resolution based on enhancement level
  const calculateOutputResolution = useCallback((source: { width: number; height: number }) => {
    const output = {
      width: Math.round(source.width * enhancementLevel),
      height: Math.round(source.height * enhancementLevel)
    };
    setOutputResolution(output);
  }, [enhancementLevel]);

  // Initialize video source - FIXED dependency array
  useEffect(() => {
    if (url && url !== lastExtractedUrl && !isExtracting) {
      extractVideoUrl(url);
    }
  }, [url, lastExtractedUrl, isExtracting]); // REMOVED extractVideoUrl from dependencies!

  // Video element setup
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSource) return;

    const handleLoadedMetadata = () => {
      const source = {
        width: video.videoWidth,
        height: video.videoHeight
      };
      setSourceResolution(source);
      setDuration(video.duration);
      onResolutionDetected?.(source);
      onVideoElementReady?.(video);
      
      // Calculate output resolution
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
  }, [videoSource, onResolutionDetected, onVideoElementReady, calculateOutputResolution]);

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
      // Simulate AI processing with progress updates
      const progressInterval = setInterval(() => {
        setEnhancementProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 10;
        });
      }, 200);

      // Apply AI enhancement (simulated)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(progressInterval);
      setEnhancementProgress(100);
      
      console.log(`✨ AI Enhancement applied: ${enhancementType} at ${enhancementLevel}x`);
      
      // Reset progress after completion
      setTimeout(() => {
        setEnhancementProgress(0);
        setIsEnhancing(false);
      }, 1000);
    } catch (error) {
      console.error('Enhancement failed:', error);
      setIsEnhancing(false);
      setEnhancementProgress(0);
    }
  }, [enhancementType, enhancementLevel, isEnhancing]);

  // Playback controls
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const position = (e.clientX - rect.left) / rect.width;
    const newTime = position * duration;
    
    video.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress((newTime / duration) * 100);
  };

  const handleVolumeChange = (newVolume: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!isFullscreen) {
      if (video.requestFullscreen) {
        video.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Extraction Status */}
      {isExtracting && (
        <div className="absolute top-4 left-4 z-30 bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
          🧠 Mega-Intelligence Extracting...
        </div>
      )}

      {extractionError && (
        <div className="absolute top-4 left-4 z-30 bg-red-600 text-white px-3 py-1 rounded-full text-sm">
          ⚠️ {extractionError}
        </div>
      )}

      {/* Enhancement Status */}
      {isEnhancing && (
        <div className="absolute top-4 right-4 z-30 bg-purple-600 text-white px-3 py-1 rounded-full text-sm">
          ✨ AI Enhancing: {enhancementProgress.toFixed(0)}%
        </div>
      )}

      {/* Video Element */}
      {videoSource && (
        <>
          {videoSource.includes('embed') || videoSource.includes('youtube') || videoSource.includes('dailymotion.com/embed') || videoSource.includes('vimeo.com') ? (
            // Use iframe for embed URLs
            <iframe
              src={videoSource}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => {
                setIsLoading(false);
                setError('');
                // Set default resolution for embeds
                if (!sourceResolution) {
                  const defaultRes = { width: 1280, height: 720 };
                  setSourceResolution(defaultRes);
                  onResolutionDetected?.(defaultRes);
                  calculateOutputResolution(defaultRes);
                }
              }}
              onError={() => {
                setError('Failed to load video');
                setIsLoading(false);
              }}
            />
          ) : (
            // Use video element for direct URLs
            <video
              ref={videoRef}
              src={videoSource}
              className="w-full h-full object-contain"
              playsInline
              crossOrigin="anonymous"
              onMouseEnter={() => setShowControls(true)}
              onMouseLeave={() => setShowControls(false)}
            />
          )}
        </>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-white text-lg">Loading video...</div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-red-400 text-lg">{error}</div>
        </div>
      )}

      {/* Video Controls */}
      {showControls && !isLoading && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
          {/* Progress Bar */}
          <div 
            className="w-full h-1 bg-gray-600 rounded-full cursor-pointer mb-4"
            onClick={handleSeek}
          >
            <div 
              className="h-full bg-red-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <button onClick={togglePlay} className="hover:text-red-400">
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>

              <div className="flex items-center gap-2">
                <button onClick={toggleMute} className="hover:text-red-400">
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-20"
                />
              </div>

              <span className="text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* AI Enhancement Controls */}
              <div className="flex items-center gap-2">
                <Settings size={16} />
                <select
                  value={enhancementType}
                  onChange={(e) => setEnhancementType(e.target.value as 'super-resolution' | 'deep-reconstruction')}
                  className="bg-black bg-opacity-50 text-white text-sm rounded px-2 py-1"
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
                <span className="text-xs">{enhancementLevel.toFixed(1)}x</span>
                <button
                  onClick={enhanceVideo}
                  disabled={isEnhancing}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-2 py-1 rounded text-xs"
                >
                  ✨ Enhance
                </button>
              </div>

              <button onClick={toggleFullscreen} className="hover:text-red-400">
                <Maximize size={20} />
              </button>
            </div>
          </div>

          {/* Resolution Info */}
          {sourceResolution && outputResolution && (
            <div className="flex justify-between text-xs text-gray-300 mt-2">
              <span>Source: {sourceResolution.width}x{sourceResolution.height}</span>
              <span>Enhanced: {outputResolution.width}x{outputResolution.height}</span>
              <span>Platform: {detectedPlatform?.platform || 'Direct'}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConsolidatedVideoController;
