'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  ExternalLink, 
  Maximize, 
  SkipForward, 
  SkipBack 
} from 'lucide-react';
import { type VideoInfo } from '../utils/videoUtils';
import { upscaleVideo, type UpscalingConfig, detectVideoPlatform } from '../utils/aiUpscaler';
import { StealthYouTubePlayer } from './StealthYouTubePlayer';
import { UniversalVideoPlayer } from './UniversalVideoPlayer';

interface VideoPlayerProps {
  url: string;
  videoInfo?: VideoInfo | null;
  isEnhancing: boolean;
  enhancementSettings: {
    upscaling: number;
    noiseReduction: number;
    sharpening: number;
    colorEnhancement: number;
    brightnessBoost?: number;
  };
  upscalingConfig?: UpscalingConfig | null;
  onVideoElementReady?: (element: HTMLVideoElement) => void;
  onResolutionDetected?: (resolution: { width: number; height: number }) => void;
}

export function VideoPlayer({ 
  url, 
  videoInfo, 
  isEnhancing, 
  enhancementSettings, 
  upscalingConfig,
  onVideoElementReady,
  onResolutionDetected 
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const upscaledCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoResolution, setVideoResolution] = useState<{ width: number; height: number } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);

  // Determine if we're using a specific platform or universal detection
  const detectedPlatform = detectVideoPlatform(url);
  const isYouTube = videoInfo?.type.startsWith('youtube') || detectedPlatform?.platform === 'youtube';
  const isUniversalPlatform = detectedPlatform && detectedPlatform.platform !== 'generic';

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      const resolution = {
        width: video.videoWidth,
        height: video.videoHeight
      };
      setVideoResolution(resolution);
      onResolutionDetected?.(resolution);
      onVideoElementReady?.(video);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [onVideoElementReady, onResolutionDetected]);

  // AI Enhancement Effect
  useEffect(() => {
    if (!isEnhancing || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const processFrame = () => {
      if (video.paused || video.ended) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw original frame
      ctx.drawImage(video, 0, 0);

      // Apply enhancement filters
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Apply basic enhancement filters
      for (let i = 0; i < data.length; i += 4) {
        // Sharpening
        if (enhancementSettings.sharpening > 0) {
          const sharpen = 1 + enhancementSettings.sharpening * 0.5;
          data[i] = Math.min(255, data[i] * sharpen);
          data[i + 1] = Math.min(255, data[i + 1] * sharpen);
          data[i + 2] = Math.min(255, data[i + 2] * sharpen);
        }

        // Color enhancement
        if (enhancementSettings.colorEnhancement > 0) {
          const enhance = 1 + enhancementSettings.colorEnhancement * 0.3;
          data[i] = Math.min(255, data[i] * enhance);
          data[i + 1] = Math.min(255, data[i + 1] * enhance);
          data[i + 2] = Math.min(255, data[i + 2] * enhance);
        }

        // Brightness boost
        if (enhancementSettings.brightnessBoost && enhancementSettings.brightnessBoost > 0) {
          const brightness = enhancementSettings.brightnessBoost * 25;
          data[i] = Math.min(255, data[i] + brightness);
          data[i + 1] = Math.min(255, data[i + 1] + brightness);
          data[i + 2] = Math.min(255, data[i + 2] + brightness);
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // Handle upscaling if config is provided
      if (upscalingConfig && upscaledCanvasRef.current) {
        upscaleVideo(canvas, upscaledCanvasRef.current, upscalingConfig);
      }

      animationId = requestAnimationFrame(processFrame);
    };

    if (!video.paused) {
      processFrame();
    }

    const handleVideoPlay = () => {
      processFrame();
    };

    const handleVideoPause = () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };

    video.addEventListener('play', handleVideoPlay);
    video.addEventListener('pause', handleVideoPause);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      video.removeEventListener('play', handleVideoPlay);
      video.removeEventListener('pause', handleVideoPause);
    };
  }, [isEnhancing, enhancementSettings, upscalingConfig]);

  // Control functions
  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(!isMuted);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * duration;
    
    videoRef.current.currentTime = newTime;
  };

  const resetVideo = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    setCurrentTime(0);
    setProgress(0);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Enhanced video controls
  const skipForward = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, duration);
  };

  const skipBackward = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      console.log('Fullscreen not supported or denied');
    }
  };

  const changePlaybackRate = (rate: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const handleVolumeChange = (newVolume: number) => {
    if (!videoRef.current) return;
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div ref={containerRef} className="space-y-4 relative">
      <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
        {isUniversalPlatform ? (
          // Universal Video Player for all supported platforms
          <UniversalVideoPlayer 
            url={url}
            isEnhancing={isEnhancing}
            enhancementSettings={enhancementSettings}
            upscalingConfig={upscalingConfig}
            className="w-full h-full"
          />
        ) : isYouTube ? (
          // Legacy YouTube Player (kept for compatibility)
          <StealthYouTubePlayer 
            videoInfo={videoInfo!}
            isEnhancing={isEnhancing}
            enhancementSettings={enhancementSettings}
            upscalingConfig={upscalingConfig}
            className="w-full h-full"
          />
        ) : (
          // Direct Video
          <>
            <video
              ref={videoRef}
              src={url}
              className={`absolute inset-0 w-full h-full object-contain ${isEnhancing ? 'opacity-0' : 'opacity-100'}`}
              crossOrigin="anonymous"
              playsInline
            />
            
            {isEnhancing && (
              <>
                {upscalingConfig ? (
                  // Show upscaled canvas when upscaling is active
                  <canvas
                    ref={upscaledCanvasRef}
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                ) : (
                  // Show regular enhanced canvas
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                )}
                {/* Hidden canvas for processing */}
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
              </>
            )}

            {/* Enhancement Indicator */}
            {isEnhancing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute top-4 right-4 px-3 py-1 bg-green-500/90 backdrop-blur-sm rounded-full text-sm font-medium text-white flex items-center gap-2"
              >
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                {upscalingConfig ? 
                  `AI Upscaled to ${upscalingConfig.targetWidth}×${upscalingConfig.targetHeight}` : 
                  'AI Enhanced'
                }
              </motion.div>
            )}

            {/* Resolution Display */}
            {videoResolution && (
              <div className="absolute top-4 left-4 px-3 py-1 bg-black/70 backdrop-blur-sm rounded-lg text-sm text-white">
                Source: {videoResolution.width}×{videoResolution.height}
                {upscalingConfig && (
                  <span className="text-green-400 ml-2">
                    → {upscalingConfig.targetWidth}×{upscalingConfig.targetHeight}
                  </span>
                )}
              </div>
            )}

            {/* Play Button Overlay */}
            {!isPlaying && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors"
              >
                <div className="p-4 bg-white/90 rounded-full">
                  <Play className="h-8 w-8 text-gray-900 ml-1" />
                </div>
              </motion.button>
            )}
          </>
        )}
      </div>

      {/* Enhanced Video Controls - Only show for direct videos */}
      {!isYouTube && !isUniversalPlatform && (
        <div className="space-y-3">
          {/* Progress Bar */}
          <div
            onClick={handleProgressClick}
            className="w-full h-2 bg-gray-700 rounded-full cursor-pointer"
          >
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Enhanced Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Skip backward */}
              <button
                onClick={skipBackward}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                title="Skip backward 10s"
              >
                <SkipBack className="h-5 w-5 text-white" />
              </button>

              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5 text-white" />
                ) : (
                  <Play className="h-5 w-5 text-white ml-0.5" />
                )}
              </button>

              {/* Skip forward */}
              <button
                onClick={skipForward}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                title="Skip forward 10s"
              >
                <SkipForward className="h-5 w-5 text-white" />
              </button>

              {/* Volume */}
              <button
                onClick={toggleMute}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5 text-white" />
                ) : (
                  <Volume2 className="h-5 w-5 text-white" />
                )}
              </button>

              {/* Volume Slider */}
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-20 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Playback Speed */}
              <div className="relative">
                <select
                  value={playbackRate}
                  onChange={(e) => changePlaybackRate(parseFloat(e.target.value))}
                  className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm cursor-pointer"
                >
                  <option value={0.5}>0.5x</option>
                  <option value={0.75}>0.75x</option>
                  <option value={1}>1x</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2x</option>
                </select>
              </div>

              {/* Reset */}
              <button
                onClick={resetVideo}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                title="Reset video"
              >
                <RotateCcw className="h-5 w-5 text-white" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                title="Toggle fullscreen"
              >
                <Maximize className="h-5 w-5 text-white" />
              </button>
            </div>

            <div className="text-sm text-gray-400">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
        </div>
      )}

      {/* YouTube Notice for Enhancement */}
      {(isYouTube || isUniversalPlatform) && isEnhancing && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-400">
            <ExternalLink className="h-4 w-4 inline mr-2" />
            Platform videos use their native player. AI enhancement simulation is displayed as an overlay for demonstration purposes.
          </p>
        </div>
      )}
    </div>
  );
}
