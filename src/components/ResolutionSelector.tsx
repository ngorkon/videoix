'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Monitor, 
  Zap, 
  TrendingUp,
  Eye,
  Sparkles,
  Target
} from 'lucide-react';
import { analyzeVideoQuality, generateUpscalingConfig, getRecommendedResolutions, type VideoMetrics, type UpscalingConfig } from '../utils/aiUpscaler';

interface ResolutionSelectorProps {
  sourceResolution: { width: number; height: number } | null;
  onConfigChange: (config: UpscalingConfig) => void;
  videoElement?: HTMLVideoElement | null;
}

export function ResolutionSelector({ sourceResolution, onConfigChange, videoElement }: ResolutionSelectorProps) {
  const [videoMetrics, setVideoMetrics] = useState<VideoMetrics | null>(null);
  const [selectedResolution, setSelectedResolution] = useState<{ width: number; height: number } | null>(null);
  const [upscalingConfig, setUpscalingConfig] = useState<UpscalingConfig | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Analyze video quality
  const analyzeVideo = useCallback(async () => {
    if (!videoElement || !sourceResolution) return;

    setIsAnalyzing(true);
    try {
      // Create canvas to capture video frame
      const canvas = document.createElement('canvas');
      canvas.width = sourceResolution.width;
      canvas.height = sourceResolution.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      // Draw current video frame
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      // Get image data for analysis
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      // Analyze video quality
      const metrics = analyzeVideoQuality(imageData);
      setVideoMetrics(metrics);
      // Auto-select recommended resolution
      const recommended = getRecommendedResolutions(sourceResolution.width, sourceResolution.height);
      if (recommended.length > 0) {
        setSelectedResolution(recommended[0]);
      }
    } catch (error) {
      console.error('Video analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [videoElement, sourceResolution]);

  // Analyze video quality when video element changes
  useEffect(() => {
    if (videoElement && sourceResolution) {
      analyzeVideo();
    }
  }, [videoElement, sourceResolution, analyzeVideo]);

  // Generate upscaling config when resolution is selected
  useEffect(() => {
    if (videoMetrics && selectedResolution) {
      const config = generateUpscalingConfig(videoMetrics, selectedResolution);
      setUpscalingConfig(config);
      onConfigChange(config);
    }
  }, [videoMetrics, selectedResolution, onConfigChange]);

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-blue-400';
      case 'fair': return 'text-yellow-400';
      default: return 'text-red-400';
    }
  };

  const getQualityIcon = (quality: string) => {
    switch (quality) {
      case 'excellent': return '🏆';
      case 'good': return '✅';
      case 'fair': return '⚠️';
      default: return '❌';
    }
  };

  const resolutionPresets = [
    { name: '720p HD', width: 1280, height: 720, description: 'High Definition' },
    { name: '1080p FHD', width: 1920, height: 1080, description: 'Full HD' },
    { name: '1440p QHD', width: 2560, height: 1440, description: 'Quad HD' },
    { name: '4K UHD', width: 3840, height: 2160, description: 'Ultra HD' }
  ];

  if (!sourceResolution) {
    return (
      <div className="text-center p-6 bg-gray-800/30 rounded-lg border border-gray-600">
        <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-400">Load a video to analyze resolution</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Source Video Analysis */}
      <div className="bg-black/40 backdrop-blur-lg rounded-xl border border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="h-5 w-5 text-blue-400" />
          <h3 className="font-semibold text-white">Source Analysis</h3>
          {isAnalyzing && (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Resolution:</span>
            <span className="text-white">{sourceResolution.width}×{sourceResolution.height}</span>
          </div>
          
          {videoMetrics && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-400">Quality:</span>
                <span className={`font-medium ${getQualityColor(videoMetrics.quality)}`}>
                  {getQualityIcon(videoMetrics.quality)} {videoMetrics.quality.toUpperCase()}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Sharpness:</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${videoMetrics.sharpnessScore * 100}%` }}
                    />
                  </div>
                  <span className="text-white text-xs">{Math.round(videoMetrics.sharpnessScore * 100)}%</span>
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Noise Level:</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${videoMetrics.noiseLevel * 100}%` }}
                    />
                  </div>
                  <span className="text-white text-xs">{Math.round(videoMetrics.noiseLevel * 100)}%</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Target Resolution Selection */}
      <div className="bg-black/40 backdrop-blur-lg rounded-xl border border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-green-400" />
          <h3 className="font-semibold text-white">Target Resolution</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {resolutionPresets.map((preset) => {
            const isSelected = selectedResolution?.width === preset.width && selectedResolution?.height === preset.height;
            const scaleFactor = preset.width / sourceResolution.width;
            const isUpscale = scaleFactor > 1;
            
            return (
              <motion.button
                key={preset.name}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedResolution({ width: preset.width, height: preset.height })}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                    : 'bg-gray-800/50 border-gray-600 hover:border-gray-500 text-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium">{preset.name}</div>
                  {isUpscale && (
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  )}
                </div>
                <div className="text-xs text-gray-400">{preset.description}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {preset.width}×{preset.height} • {scaleFactor.toFixed(1)}x
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Upscaling Configuration */}
      {upscalingConfig && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-black/40 backdrop-blur-lg rounded-xl border border-gray-700 p-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <h3 className="font-semibold text-white">AI Upscaling Config</h3>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Algorithm:</span>
              <span className="text-white capitalize">{upscalingConfig.algorithm.replace('-', ' ')}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Enhancement Level:</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${upscalingConfig.sharpening * 100}%` }}
                  />
                </div>
                <span className="text-white text-xs">{Math.round(upscalingConfig.sharpening * 100)}%</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="text-center">
                <div className="text-gray-400 text-xs">Noise Reduction</div>
                <div className="text-white font-medium">{Math.round(upscalingConfig.noiseReduction * 100)}%</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 text-xs">Edge Enhancement</div>
                <div className="text-white font-medium">{Math.round(upscalingConfig.edgeEnhancement * 100)}%</div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <Zap className="h-4 w-4" />
              <span>Ready for AI upscaling to {selectedResolution?.width}×{selectedResolution?.height}</span>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
