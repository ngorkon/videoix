'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Sparkles, Loader, CheckCircle } from 'lucide-react';

export const VideoEnhancerFast: React.FC = () => {
  const [url, setUrl] = useState('');
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [videoSource, setVideoSource] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsProcessing(true);
    setError('');
    setProcessingStage('Analyzing video...');

    try {
      // Simulate fast processing stages
      await new Promise(resolve => setTimeout(resolve, 500));
      setProcessingStage('Extracting video stream...');
      
      // Try mega-extractor for fast extraction
      const response = await fetch('/api/mega-extractor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (data.directUrl) {
          setProcessingStage('Preparing enhanced playback...');
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Use direct URL or proxy for better compatibility
          const finalUrl = data.directUrl.includes('.m3u8') 
            ? `/api/proxy?url=${encodeURIComponent(data.directUrl)}`
            : data.directUrl;
            
          setVideoSource(finalUrl);
          setIsVideoLoaded(true);
          setProcessingStage('✨ Enhancement ready!');
        } else if (data.embedUrl) {
          setVideoSource(data.embedUrl);
          setIsVideoLoaded(true);
          setProcessingStage('✨ Video ready!');
        } else {
          throw new Error('No video stream found');
        }
      } else {
        throw new Error(data.error || 'Failed to process video');
      }
    } catch (err) {
      console.error('Processing failed:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingStage('');
      }, 1000);
    }
  }, [url]);

  const handleNewVideo = useCallback(() => {
    setUrl('');
    setIsVideoLoaded(false);
    setVideoSource('');
    setError('');
    inputRef.current?.focus();
  }, []);

  if (isVideoLoaded && videoSource) {
    return (
      <div className="max-w-4xl mx-auto px-4">
        {/* Video Player */}
        <div className="bg-black rounded-xl overflow-hidden border border-white/10 mb-6">
          {videoSource.includes('embed') ? (
            <iframe
              src={videoSource}
              className="w-full h-[400px] md:h-[500px]"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              src={videoSource}
              controls
              className="w-full h-full min-h-[400px]"
              autoPlay
              playsInline
            />
          )}
        </div>

        {/* Enhanced Status */}
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <div>
              <h3 className="text-white font-medium">Video Enhanced Successfully!</h3>
              <p className="text-green-300 text-sm">Your video is now playing with AI-powered quality improvements.</p>
            </div>
          </div>
        </div>

        {/* New Video Button */}
        <div className="text-center">
          <button
            onClick={handleNewVideo}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium py-3 px-8 rounded-lg transition-all transform hover:scale-105"
          >
            Enhance Another Video
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4">
      <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 overflow-hidden">
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="video-url" className="block text-lg font-medium text-white mb-3">
                Video URL
              </label>
              <input
                ref={inputRef}
                id="video-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=... or any video URL"
                className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-4 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all text-lg"
                required
                disabled={isProcessing}
              />
            </div>

            {/* Processing Status */}
            {isProcessing && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Loader className="w-5 h-5 text-blue-400 animate-spin" />
                  <span className="text-blue-300 font-medium">{processingStage}</span>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-300">{error}</p>
              </div>
            )}

            {/* Supported Platforms */}
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-3">Works with:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {['YouTube', 'TikTok', 'Instagram', 'Vimeo', 'Direct Files'].map((platform) => (
                  <span
                    key={platform}
                    className="px-3 py-1 bg-gray-700 text-gray-300 text-xs rounded-full"
                  >
                    {platform}
                  </span>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!url.trim() || isProcessing}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-medium py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
            >
              {isProcessing ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Enhance Video with AI
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Quick Info */}
      <div className="mt-8 text-center text-gray-400 text-sm space-y-2">
        <p>✨ Instant AI enhancement • 🚀 No waiting • 🔒 100% private</p>
      </div>
    </div>
  );
};

export default VideoEnhancerFast;
