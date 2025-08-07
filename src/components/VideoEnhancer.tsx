'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Monitor
} from 'lucide-react';
import { EnhancementControls } from './EnhancementControls';
import { UrlInput } from './UrlInput';
import { ResolutionSelector } from './ResolutionSelector';
import { ConsolidatedVideoController } from './ConsolidatedVideoController';
import { type VideoInfo } from '../utils/videoUtils';
// import { QualityDetector } from './QualityDetector';

interface EnhancementSettings {
  upscaling: number;
  noiseReduction: number;
  sharpening: number;
  colorEnhancement: number;
  brightnessBoost: number;
  customResolution?: { width: number; height: number };
  useCustomResolution?: boolean;
}

export function VideoEnhancer() {
  const [videoUrl, setVideoUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [videoResolution, setVideoResolution] = useState<{ width: number; height: number } | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementSettings, setEnhancementSettings] = useState({
    upscaling: 2,
    noiseReduction: 0.5,
    sharpening: 0.3,
    colorEnhancement: 0.4,
    brightnessBoost: 0,
    useCustomResolution: false,
    customResolution: { width: 1920, height: 1080 }
  });

  // Quick test function for development
  const testWithUrl = (testUrl: string, platform: string) => {
    const testInfo: VideoInfo = {
      type: platform as VideoInfo['type'],
      originalUrl: testUrl,
      videoId: 'test'
    };
    handleUrlSubmit(testUrl, testInfo);
  };

  const handleUrlSubmit = (url: string, info: VideoInfo) => {
    setVideoUrl(url);
    setVideoInfo(info);
    // Reset resolution when new video is loaded
    setVideoResolution(null);
  };

  const handleVideoElementReady = (element: HTMLVideoElement) => {
    setVideoElement(element);
  };

  const handleResolutionDetected = (resolution: { width: number; height: number }) => {
    setVideoResolution(resolution);
    
    // Automatically configure upscaling when resolution is detected
    handleEnhancementSettingsChange(enhancementSettings);
  };

  const toggleEnhancement = () => {
    setIsEnhancing(!isEnhancing);
  };

  const handleEnhancementSettingsChange = (newSettings: EnhancementSettings) => {
    // Fill in default values for optional properties
    const completeSettings = {
      ...newSettings,
      useCustomResolution: newSettings.useCustomResolution ?? false,
      customResolution: newSettings.customResolution ?? { width: 1920, height: 1080 }
    };
    
    setEnhancementSettings(completeSettings);
    
    // Automatically set target resolution based on settings
    if (videoResolution) {
      let targetWidth: number, targetHeight: number;
      
      // Use custom resolution if specified
      if (completeSettings.useCustomResolution && completeSettings.customResolution) {
        targetWidth = completeSettings.customResolution.width;
        targetHeight = completeSettings.customResolution.height;
      } else {
        // Special handling for common upscaling factors
        if (completeSettings.upscaling >= 4) {
          // 4K upscaling
          targetWidth = 3840;
          targetHeight = 2160;
        } else if (completeSettings.upscaling >= 2.5) {
          // 1440p upscaling
          targetWidth = 2560;
          targetHeight = 1440;
        } else if (completeSettings.upscaling >= 2) {
          // 1080p upscaling
          targetWidth = 1920;
          targetHeight = 1080;
        } else {
          // Calculate based on scale factor
          targetWidth = Math.round(videoResolution.width * completeSettings.upscaling);
          targetHeight = Math.round(videoResolution.height * completeSettings.upscaling);
        }
      }
      
      console.log(`🎯 Setting target resolution to ${targetWidth}x${targetHeight} ${completeSettings.useCustomResolution ? '(Custom)' : `(${completeSettings.upscaling}x scale)`}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Video Area */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-black/40 backdrop-blur-lg rounded-xl border border-gray-700 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Monitor className="h-6 w-6" />
                Video Stream
              </h2>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleEnhancement}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    isEnhancing
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <Zap className="h-4 w-4" />
                  {isEnhancing ? 'Enhancing' : 'Enhance'}
                </motion.button>
              </div>
            </div>

            {!videoUrl ? (
              <>
                <UrlInput onSubmit={handleUrlSubmit} />
                
                {/* Quick Test Buttons */}
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <p className="text-sm text-gray-400 mb-3">Quick Test:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <button
                      onClick={() => testWithUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube')}
                      className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded text-sm border border-red-500/30"
                    >
                      Test YouTube
                    </button>
                    <button
                      onClick={() => testWithUrl('https://www.dailymotion.com/video/x9mrim4', 'dailymotion')}
                      className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded text-sm border border-blue-500/30"
                    >
                      Test Dailymotion
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <ConsolidatedVideoController
                url={videoUrl}
                onVideoElementReady={handleVideoElementReady}
                onResolutionDetected={handleResolutionDetected}
              />
            )}
          </motion.div>

          {/* Key Features - Simplified */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 text-center"
          >
            <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 backdrop-blur-lg rounded-xl border border-blue-500/20 p-6">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Zap className="h-5 w-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">AI-Powered Real-time Enhancement</h3>
              </div>
              <p className="text-gray-300 text-sm max-w-2xl mx-auto">
                Transform any video stream with intelligent upscaling, noise reduction, and quality optimization. 
                Choose from smart presets or fine-tune manually for perfect results.
              </p>
            </div>
          </motion.div>

          {/* Demo Video Buttons */}
          {!videoInfo && (
            <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-600">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                <Zap className="mr-2 text-purple-400" size={18} />
                Try These Classic Low-Quality Videos for 4K AI Enhancement:
              </h3>
              <div className="grid grid-cols-1 gap-2">                  <button
                    onClick={() => {
                      const demoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
                      handleUrlSubmit(demoUrl, {
                        type: 'youtube',
                        videoId: 'dQw4w9WgXcQ',
                        originalUrl: demoUrl
                      });
                    }}
                    className="text-left p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors border border-gray-600/50"
                  >
                    <div className="font-medium text-white">Rick Astley - Never Gonna Give You Up (1987)</div>
                    <div className="text-sm text-gray-300">Original: 240p → AI Enhanced: 4K Ultra HD</div>
                    <div className="text-xs text-purple-400 mt-1">Classic video perfect for AI upscaling demo</div>
                  </button>
                  
                  <button
                    onClick={() => {
                      const demoUrl = 'https://www.youtube.com/watch?v=kJQP7kiw5Fk';
                      handleUrlSubmit(demoUrl, {
                        type: 'youtube',
                        videoId: 'kJQP7kiw5Fk',
                        originalUrl: demoUrl
                      });
                    }}
                    className="text-left p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors border border-gray-600/50"
                  >
                    <div className="font-medium text-white">Luis Fonsi - Despacito ft. Daddy Yankee</div>
                    <div className="text-sm text-gray-300">Original: 360p → AI Enhanced: 4K Ultra HD</div>
                    <div className="text-xs text-blue-400 mt-1">Popular video with great upscaling potential</div>
                  </button>
                  
                  <button
                    onClick={() => {
                      const demoUrl = 'https://www.youtube.com/watch?v=9bZkp7q19f0';
                      handleUrlSubmit(demoUrl, {
                        type: 'youtube',
                        videoId: '9bZkp7q19f0',
                        originalUrl: demoUrl
                      });
                    }}
                    className="text-left p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors border border-gray-600/50"
                  >
                    <div className="font-medium text-white">PSY - Gangnam Style</div>
                    <div className="text-sm text-gray-300">Original: 480p → AI Enhanced: 4K Ultra HD</div>
                    <div className="text-xs text-green-400 mt-1">Viral video showcase for super-resolution</div>
                  </button>
              </div>
              
              <div className="mt-4 p-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg border border-purple-500/30">
                <div className="text-sm text-white font-medium mb-2">🎯 What makes this special:</div>
                <div className="text-xs text-gray-300 space-y-1">
                  <div>• Transform 240p videos into stunning 4K quality</div>
                  <div>• Real-time AI super-resolution processing</div>
                  <div>• Advanced noise reduction and sharpening</div>
                  <div>• Makes old, unwatchable videos look magnificent</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhancement Controls */}
        <div className="lg:col-span-1 space-y-6">
          {/* Resolution Selector */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
          >
            <ResolutionSelector
              sourceResolution={videoResolution}
              onConfigChange={() => {}}
              videoElement={videoElement}
            />
          </motion.div>

          {/* Enhancement Controls */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <EnhancementControls
              settings={enhancementSettings}
              onChange={handleEnhancementSettingsChange}
              isEnhancing={isEnhancing}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
