'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, Zap, Eye } from 'lucide-react';
import { AIUpscaler } from '@/utils/aiUpscaler';

interface DirectVideoEnhancerProps {
  videoUrl: string;
  originalResolution?: string;
  targetResolution?: string;
  title?: string;
  onEnhancementChange?: (isEnhancing: boolean) => void;
}

interface EnhancementSettings {
  upscaling: number;
  sharpening: number;
  noiseReduction: number;
  colorEnhancement: number;
  brightness: number;
  contrast: number;
}

export default function DirectVideoEnhancer({
  videoUrl,
  originalResolution = 'auto',
  targetResolution = '1080p',
  onEnhancementChange
}: DirectVideoEnhancerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const enhancedCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [processingStats, setProcessingStats] = useState({
    fps: 0,
    processingTime: 0,
    frameCount: 0
  });

  const [enhancementSettings, setEnhancementSettings] = useState<EnhancementSettings>({
    upscaling: 2.0,
    sharpening: 0.3,
    noiseReduction: 0.5,
    colorEnhancement: 0.2,
    brightness: 0.1,
    contrast: 0.1
  });

  // Video frame processing loop
  const processFrame = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const enhancedCanvas = enhancedCanvasRef.current;

    if (!video || !canvas || !enhancedCanvas || video.paused || video.ended) {
      return;
    }

    const ctx = canvas.getContext('2d');
    const enhancedCtx = enhancedCanvas.getContext('2d');

    if (!ctx || !enhancedCtx) return;

    const startTime = performance.now();

    try {
      // Draw current frame to working canvas
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      if (isEnhancing) {
        // Get image data for processing
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Apply AI enhancements
        const aiUpscaler = new AIUpscaler();
        const enhancedImageData = await aiUpscaler.enhanceImageData(
          imageData,
          {
            algorithm: 'super-resolution',
            scaleFactor: enhancementSettings.upscaling,
            sharpening: enhancementSettings.sharpening,
            noiseReduction: enhancementSettings.noiseReduction,
            colorEnhancement: enhancementSettings.colorEnhancement,
            brightness: enhancementSettings.brightness,
            contrast: enhancementSettings.contrast
          }
        );

        // Draw enhanced frame
        enhancedCanvas.width = enhancedImageData.width;
        enhancedCanvas.height = enhancedImageData.height;
        enhancedCtx.putImageData(enhancedImageData, 0, 0);
      } else {
        // Direct copy when not enhancing
        enhancedCanvas.width = canvas.width;
        enhancedCanvas.height = canvas.height;
        enhancedCtx.drawImage(canvas, 0, 0);
      }

      // Update processing stats
      const processingTime = performance.now() - startTime;
      setProcessingStats(prev => ({
        fps: Math.round(1000 / processingTime),
        processingTime: Math.round(processingTime),
        frameCount: prev.frameCount + 1
      }));

    } catch (error) {
      console.error('Frame processing error:', error);
    }

    // Schedule next frame
    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, [isEnhancing, enhancementSettings]);

  // Start/stop processing when video plays/pauses
  useEffect(() => {
    if (isPlaying && videoRef.current) {
      processFrame();
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, processFrame]);

  // Video event handlers
  const handlePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleVolumeChange = () => {
    if (videoRef.current) {
      setVolume(videoRef.current.volume);
      setIsMuted(videoRef.current.muted);
    }
  };

  const toggleEnhancement = () => {
    const newEnhancing = !isEnhancing;
    setIsEnhancing(newEnhancing);
    onEnhancementChange?.(newEnhancing);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative bg-black rounded-lg overflow-hidden">
      {/* Hidden video element */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="hidden"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onVolumeChange={handleVolumeChange}
        crossOrigin="anonymous"
        preload="metadata"
      />

      {/* Working canvas (hidden) */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Enhanced display canvas */}
      <canvas
        ref={enhancedCanvasRef}
        className="w-full h-auto max-h-[70vh] object-contain"
      />

      {/* Video controls overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center space-x-4">
          {/* Play/Pause */}
          <button
            onClick={handlePlay}
            className="text-white hover:text-blue-400 transition-colors"
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>

          {/* Progress bar */}
          <div className="flex-1">
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={currentTime}
              onChange={(e) => {
                if (videoRef.current) {
                  videoRef.current.currentTime = parseFloat(e.target.value);
                }
              }}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-300 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume control */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.muted = !videoRef.current.muted;
                }
              }}
              className="text-white hover:text-blue-400 transition-colors"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={volume}
              onChange={(e) => {
                if (videoRef.current) {
                  videoRef.current.volume = parseFloat(e.target.value);
                }
              }}
              className="w-20 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Enhancement toggle */}
          <button
            onClick={toggleEnhancement}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              isEnhancing
                ? 'bg-blue-500 text-white'
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            <Zap size={16} className="inline mr-1" />
            AI {isEnhancing ? 'ON' : 'OFF'}
          </button>

          {/* Fullscreen */}
          <button className="text-white hover:text-blue-400 transition-colors">
            <Maximize size={20} />
          </button>
        </div>
      </div>

      {/* Enhancement status */}
      {isEnhancing && (
        <div className="absolute top-4 right-4 bg-black/80 text-white px-3 py-2 rounded-lg text-sm">
          <div className="flex items-center space-x-2">
            <Eye className="text-blue-400" size={16} />
            <span>AI Enhanced</span>
          </div>
          <div className="text-xs text-gray-300 mt-1">
            {processingStats.fps} FPS • {processingStats.processingTime}ms/frame
          </div>
          <div className="text-xs text-gray-300">
            {originalResolution} → {targetResolution}
          </div>
        </div>
      )}

      {/* Enhancement controls */}
      <div className="absolute top-4 left-4 bg-black/80 text-white p-3 rounded-lg">
        <div className="text-sm font-medium mb-2 flex items-center">
          <Settings size={16} className="mr-2" />
          Enhancement Settings
        </div>
        
        <div className="space-y-2 text-xs">
          <div>
            <label className="block mb-1">Upscaling: {enhancementSettings.upscaling}x</label>
            <input
              type="range"
              min={1}
              max={4}
              step={0.1}
              value={enhancementSettings.upscaling}
              onChange={(e) => setEnhancementSettings(prev => ({
                ...prev,
                upscaling: parseFloat(e.target.value)
              }))}
              className="w-full h-1 bg-gray-600 rounded appearance-none cursor-pointer"
            />
          </div>

          <div>
            <label className="block mb-1">Sharpening: {Math.round(enhancementSettings.sharpening * 100)}%</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={enhancementSettings.sharpening}
              onChange={(e) => setEnhancementSettings(prev => ({
                ...prev,
                sharpening: parseFloat(e.target.value)
              }))}
              className="w-full h-1 bg-gray-600 rounded appearance-none cursor-pointer"
            />
          </div>

          <div>
            <label className="block mb-1">Noise Reduction: {Math.round(enhancementSettings.noiseReduction * 100)}%</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={enhancementSettings.noiseReduction}
              onChange={(e) => setEnhancementSettings(prev => ({
                ...prev,
                noiseReduction: parseFloat(e.target.value)
              }))}
              className="w-full h-1 bg-gray-600 rounded appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
