'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, 
  Zap, 
  AlertTriangle, 
  CheckCircle,
  // Monitor, // unused
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface QualityMetrics {
  resolution: { width: number; height: number };
  estimatedQuality: 'poor' | 'fair' | 'good' | 'excellent';
  detectedIssues: string[];
  recommendedEnhancements: {
    upscaling: number;
    noiseReduction: number;
    sharpening: number;
    colorEnhancement: number;
    brightnessBoost: number;
  };
  targetResolution: '720p' | '1080p' | '1440p' | '4K';
}

interface EnhancementSettings {
  upscaling: number;
  noiseReduction: number;
  sharpening: number;
  colorEnhancement: number;
  brightnessBoost: number;
  targetResolution: string;
}

interface QualityDetectorProps {
  videoElement: HTMLVideoElement | null;
  onQualityDetected: (metrics: QualityMetrics) => void;
  onApplyRecommendations: (settings: EnhancementSettings) => void;
}

export function QualityDetector({ 
  videoElement, 
  onQualityDetected, 
  onApplyRecommendations 
}: QualityDetectorProps) {
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [targetResolution, setTargetResolution] = useState<'720p' | '1080p' | '1440p' | '4K'>('1080p');
  const [showDetails, setShowDetails] = useState(false);

  const resolutionTargets = {
    '720p': { width: 1280, height: 720, label: 'HD Ready (720p)' },
    '1080p': { width: 1920, height: 1080, label: 'Full HD (1080p)' },
    '1440p': { width: 2560, height: 1440, label: 'Quad HD (1440p)' },
    '4K': { width: 3840, height: 2160, label: 'Ultra HD (4K)' }
  };

  const analyzeVideoQuality = async () => {
    if (!videoElement) return;

    setIsAnalyzing(true);
    
    // Create canvas for analysis
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Wait for video metadata
    await new Promise((resolve) => {
      if (videoElement.readyState >= 1) resolve(null);
      else videoElement.addEventListener('loadedmetadata', () => resolve(null), { once: true });
    });

    const width = videoElement.videoWidth;
    const height = videoElement.videoHeight;
    
    canvas.width = Math.min(width, 640); // Sample at lower res for performance
    canvas.height = Math.min(height, 360);

    // Capture frame for analysis
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Analyze quality metrics
    const qualityMetrics = await performQualityAnalysis(imageData, { width, height });
    
    setMetrics(qualityMetrics);
    onQualityDetected(qualityMetrics);
    setIsAnalyzing(false);
  };

  const performQualityAnalysis = async (
    imageData: ImageData, 
    originalSize: { width: number; height: number }
  ): Promise<QualityMetrics> => {
    const data = imageData.data;
    let totalBrightness = 0;
    let noiseLevel = 0;
    let colorVariance = 0;

    // Analyze pixels
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Calculate brightness
      const brightness = (r + g + b) / 3;
      totalBrightness += brightness;
      
      // Estimate noise (simplified)
      if (i > 4) {
        const prevR = data[i - 4];
        const diff = Math.abs(r - prevR);
        noiseLevel += diff;
      }
      
      // Color variance
      const variance = Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r);
      colorVariance += variance;
    }

    const pixelCount = data.length / 4;
    const avgBrightness = totalBrightness / pixelCount;
    const avgNoise = noiseLevel / pixelCount;
    const avgColorVariance = colorVariance / pixelCount;

    // Determine quality level
    let estimatedQuality: 'poor' | 'fair' | 'good' | 'excellent';
    const detectedIssues: string[] = [];

    // Resolution analysis
    if (originalSize.width < 720 || originalSize.height < 480) {
      estimatedQuality = 'poor';
      detectedIssues.push('Very low resolution detected');
    } else if (originalSize.width < 1280 || originalSize.height < 720) {
      estimatedQuality = 'fair';
      detectedIssues.push('Below HD resolution');
    } else if (originalSize.width < 1920 || originalSize.height < 1080) {
      estimatedQuality = 'good';
    } else {
      estimatedQuality = 'excellent';
    }

    // Brightness analysis
    if (avgBrightness < 80) {
      detectedIssues.push('Video appears dark/underexposed');
    } else if (avgBrightness > 200) {
      detectedIssues.push('Video appears overexposed');
    }

    // Noise analysis
    if (avgNoise > 30) {
      detectedIssues.push('High noise levels detected');
    }

    // Color analysis
    if (avgColorVariance < 20) {
      detectedIssues.push('Limited color range detected');
    }

    // Calculate recommended enhancements based on target resolution
    const target = resolutionTargets[targetResolution];
    const upscaleNeeded = Math.max(1, Math.min(4, target.width / originalSize.width));
    
    const recommendedEnhancements = {
      upscaling: upscaleNeeded,
      noiseReduction: Math.min(1, avgNoise / 50),
      sharpening: estimatedQuality === 'poor' ? 0.8 : estimatedQuality === 'fair' ? 0.6 : 0.4,
      colorEnhancement: avgColorVariance < 20 ? 0.7 : 0.4,
      brightnessBoost: avgBrightness < 80 ? 0.6 : avgBrightness > 200 ? -0.3 : 0
    };

    return {
      resolution: originalSize,
      estimatedQuality,
      detectedIssues,
      recommendedEnhancements,
      targetResolution
    };
  };

  const applyRecommendations = () => {
    if (!metrics) return;
    
    onApplyRecommendations({
      ...metrics.recommendedEnhancements,
      targetResolution: targetResolution
    });
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'poor': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'fair': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'good': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'excellent': return 'text-green-400 bg-green-500/20 border-green-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  useEffect(() => {
    const performAnalysis = async () => {
      if (videoElement && videoElement.readyState >= 1) {
        await analyzeVideoQuality();
      }
    };
    performAnalysis();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoElement]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/40 backdrop-blur-lg rounded-xl border border-gray-700 p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Smart Quality Detection
        </h3>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={analyzeVideoQuality}
          disabled={isAnalyzing || !videoElement}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm rounded-lg transition-all flex items-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Re-analyze
            </>
          )}
        </motion.button>
      </div>

      {/* Target Resolution Selector */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-300">Target Quality</h4>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(resolutionTargets).map(([key, value]) => (
            <button
              key={key}
              onClick={() => setTargetResolution(key as '720p' | '1080p' | '1440p' | '4K')}
              className={`p-2 rounded-lg border text-sm transition-all ${
                targetResolution === key
                  ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                  : 'bg-gray-800/50 border-gray-600 text-gray-300 hover:border-gray-500'
              }`}
            >
              <div className="text-center">
                <div className="font-medium">{key}</div>
                <div className="text-xs opacity-75">{value.width}×{value.height}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {metrics && (
        <div className="space-y-3">
          {/* Current Quality Status */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-600">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${getQualityColor(metrics.estimatedQuality)}`}>
                {metrics.estimatedQuality === 'excellent' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              </div>
              <div>
                <div className="font-medium text-white capitalize">{metrics.estimatedQuality} Quality</div>
                <div className="text-sm text-gray-400">
                  {metrics.resolution.width}×{metrics.resolution.height} → {metrics.recommendedEnhancements.upscaling.toFixed(1)}x upscale
                </div>
              </div>
            </div>
          </div>

          {/* Quick Issues */}
          {metrics.detectedIssues.length > 0 && (
            <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
              <div className="text-sm text-orange-400 space-y-1">
                {metrics.detectedIssues.slice(0, 2).map((issue, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3" />
                    {issue}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Apply Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={applyRecommendations}
            className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-lg transition-all flex items-center justify-center gap-2 font-medium"
          >
            <Zap className="h-4 w-4" />
            Apply AI Recommendations
          </motion.button>

          {/* Details Toggle */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full text-center text-sm text-gray-400 hover:text-gray-300 transition-colors flex items-center justify-center gap-1"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
            {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {/* Detailed Info */}
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-2 gap-2 text-xs"
            >
              <div className="p-2 bg-gray-800/30 rounded">
                <div className="text-gray-400">Upscaling</div>
                <div className="text-white font-medium">{metrics.recommendedEnhancements.upscaling.toFixed(1)}x</div>
              </div>
              <div className="p-2 bg-gray-800/30 rounded">
                <div className="text-gray-400">Noise Reduction</div>
                <div className="text-white font-medium">{(metrics.recommendedEnhancements.noiseReduction * 100).toFixed(0)}%</div>
              </div>
              <div className="p-2 bg-gray-800/30 rounded">
                <div className="text-gray-400">Sharpening</div>
                <div className="text-white font-medium">{(metrics.recommendedEnhancements.sharpening * 100).toFixed(0)}%</div>
              </div>
              <div className="p-2 bg-gray-800/30 rounded">
                <div className="text-gray-400">Color Boost</div>
                <div className="text-white font-medium">{(metrics.recommendedEnhancements.colorEnhancement * 100).toFixed(0)}%</div>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}
