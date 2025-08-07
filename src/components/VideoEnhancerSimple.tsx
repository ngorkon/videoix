'use client';

import React, { useState, useRef, useCallback } from 'react';
import { ConsolidatedVideoControllerSimple } from './ConsolidatedVideoControllerSimple';
import { Play, Sparkles, Settings, Info } from 'lucide-react';

export const VideoEnhancerSimple: React.FC = () => {
  const [url, setUrl] = useState('');
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [enhancementLevel, setEnhancementLevel] = useState(2.0);
  const [enhancementType, setEnhancementType] = useState<'super-resolution' | 'deep-reconstruction'>('super-resolution');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      setIsVideoLoaded(true);
    }
  }, [url]);

  const handleClear = useCallback(() => {
    setUrl('');
    setIsVideoLoaded(false);
    inputRef.current?.focus();
  }, []);

  const handleResolutionDetected = useCallback((resolution: { width: number; height: number }) => {
    console.log('Resolution detected:', resolution);
  }, []);

  const handleVideoElementReady = useCallback((video: HTMLVideoElement) => {
    console.log('Video element ready:', video);
  }, []);

  if (isVideoLoaded && url) {
    return (
      <div className="max-w-6xl mx-auto px-4">
        {/* Video Player Section */}
        <div className="bg-black/20 backdrop-blur-lg rounded-2xl p-6 border border-white/10 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">AI Enhancement Active</span>
              </div>
            </div>
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Load New Video
            </button>
          </div>

          <ConsolidatedVideoControllerSimple
            url={url}
            onResolutionDetected={handleResolutionDetected}
            onVideoElementReady={handleVideoElementReady}
            className="rounded-xl overflow-hidden"
          />
        </div>

        {/* Enhancement Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick Enhancement */}
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">AI Enhancement</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Enhancement Level</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="4"
                    step="0.1"
                    value={enhancementLevel}
                    onChange={(e) => setEnhancementLevel(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-white text-sm font-medium min-w-[3rem]">{enhancementLevel.toFixed(1)}x</span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Enhancement Mode</label>
                <select
                  value={enhancementType}
                  onChange={(e) => setEnhancementType(e.target.value as 'super-resolution' | 'deep-reconstruction')}
                  className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-400 focus:outline-none"
                >
                  <option value="super-resolution">Super Resolution</option>
                  <option value="deep-reconstruction">Deep Reconstruction</option>
                </select>
              </div>
            </div>
          </div>

          {/* Video Info */}
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Video Information</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Source URL:</span>
                <span className="text-blue-300 truncate max-w-[200px]" title={url}>
                  {url.length > 30 ? `${url.substring(0, 30)}...` : url}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Enhancement:</span>
                <span className="text-green-400">Real-time AI Processing</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Quality:</span>
                <span className="text-purple-400">Enhanced {enhancementLevel}x</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-6 border-b border-white/10">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Start Enhancing Your Video</h2>
            <p className="text-gray-300 text-sm">
              Paste any video URL and experience AI-powered enhancement in real-time
            </p>
          </div>
        </div>

        {/* Input Section */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="video-url" className="block text-sm font-medium text-gray-300 mb-2">
                Video URL
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  id="video-url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=... or any video URL"
                  className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <Play className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Supported Platforms */}
            <div>
              <p className="text-xs text-gray-400 mb-3">Supported Platforms:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'YouTube', color: 'red' },
                  { name: 'Dailymotion', color: 'blue' },
                  { name: 'Vimeo', color: 'cyan' },
                  { name: 'Direct URLs', color: 'gray' }
                ].map((platform) => (
                  <span
                    key={platform.name}
                    className={`px-3 py-1 bg-${platform.color}-500/20 text-${platform.color}-300 text-xs rounded-full border border-${platform.color}-500/30`}
                  >
                    {platform.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Settings */}
            <div className="border-t border-white/10 pt-6">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-gray-300 hover:text-white text-sm transition-colors mb-4"
              >
                <Settings className="w-4 h-4" />
                {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
              </button>

              {showAdvanced && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-black/20 rounded-lg border border-white/10">
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">Enhancement Level</label>
                    <select
                      value={enhancementLevel}
                      onChange={(e) => setEnhancementLevel(parseFloat(e.target.value))}
                      className="w-full bg-black/30 border border-white/20 rounded px-3 py-2 text-white text-sm focus:border-purple-400 focus:outline-none"
                    >
                      <option value={1.5}>1.5x - Subtle Enhancement</option>
                      <option value={2.0}>2.0x - Standard Enhancement</option>
                      <option value={2.5}>2.5x - Strong Enhancement</option>
                      <option value={3.0}>3.0x - Maximum Enhancement</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">Processing Mode</label>
                    <select
                      value={enhancementType}
                      onChange={(e) => setEnhancementType(e.target.value as 'super-resolution' | 'deep-reconstruction')}
                      className="w-full bg-black/30 border border-white/20 rounded px-3 py-2 text-white text-sm focus:border-purple-400 focus:outline-none"
                    >
                      <option value="super-resolution">Super Resolution</option>
                      <option value="deep-reconstruction">Deep Reconstruction</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!url.trim()}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Start AI Enhancement
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VideoEnhancerSimple;
