'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, Play, Upload, Youtube, Video, Globe, AlertCircle } from 'lucide-react';
import { processVideoUrl, validateVideoUrl, getSampleUrls, type VideoInfo } from '../utils/videoUtils';

interface UrlInputProps {
  onSubmit: (url: string, videoInfo: VideoInfo) => void;
}

export function UrlInput({ onSubmit }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validateUrl = async (inputUrl: string) => {
    if (!inputUrl.trim()) {
      setIsValidUrl(false);
      setVideoInfo(null);
      return;
    }

    setIsValidating(true);
    try {
      const processed = processVideoUrl(inputUrl);
      const validation = await validateVideoUrl(inputUrl);
      
      setVideoInfo(processed);
      setIsValidUrl(validation.valid);
    } catch {
      setIsValidUrl(false);
      setVideoInfo(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    validateUrl(newUrl);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidUrl && videoInfo) {
      onSubmit(url, videoInfo);
    }
  };

  const sampleUrls = getSampleUrls();

  const getVideoTypeIcon = (type: string) => {
    switch (type) {
      case 'youtube':
      case 'youtube-live':
      case 'youtube-shorts':
        return Youtube;
      case 'dailymotion':
      case 'vimeo':
        return Video;
      case 'direct':
        return Video;
      default:
        return Globe;
    }
  };

  const getVideoTypeLabel = (type: string) => {
    switch (type) {
      case 'youtube':
        return 'YouTube Video';
      case 'youtube-live':
        return 'YouTube Live';
      case 'youtube-shorts':
        return 'YouTube Shorts';
      case 'dailymotion':
        return 'Dailymotion Video';
      case 'vimeo':
        return 'Vimeo Video';
      case 'direct':
        return 'Direct Video';
      case 'instagram':
        return 'Instagram (Coming Soon)';
      case 'tiktok':
        return 'TikTok (Coming Soon)';
      default:
        return 'Unknown Format';
    }
  };

  return (
    <div className="text-center space-y-6">
      <div className="mb-8">
        <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          Load Video Stream
        </h3>
        <p className="text-gray-400">
          YouTube, Dailymotion, Vimeo videos, live streams, and direct video links
        </p>
        {videoInfo && (
          <div className="flex items-center justify-center gap-2 mt-3 px-3 py-1 bg-gray-800/50 rounded-lg border border-gray-600 inline-flex">
            {(() => {
              const IconComponent = getVideoTypeIcon(videoInfo.type);
              return <IconComponent className="h-4 w-4 text-blue-400" />;
            })()}
            <span className="text-sm text-gray-300">{getVideoTypeLabel(videoInfo.type)}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="url"
            value={url}
            onChange={handleUrlChange}
            placeholder="https://youtube.com/watch?v=... or https://dailymotion.com/video/... or direct video URL"
            className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          {isValidating && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={!isValidUrl}
          className={`w-full py-3 px-6 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
            isValidUrl
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Play className="h-5 w-5" />
          Load Video
        </motion.button>

        {/* YouTube Notice */}
        {videoInfo && videoInfo.type.startsWith('youtube') && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-yellow-400 font-medium mb-1">YouTube Video Detected</p>
                <p className="text-gray-300">
                  Some YouTube videos may have embedding restrictions. If the video fails to load, 
                  you&apos;ll have options to try alternative methods or open it directly in YouTube.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </form>

      <div className="pt-6 border-t border-gray-700">
        <p className="text-sm text-gray-400 mb-3">Try with sample videos:</p>
        <div className="space-y-2">
          {sampleUrls.map((sample, index) => {
            const IconComponent = getVideoTypeIcon(sample.type);
            return (
              <button
                key={index}
                onClick={() => {
                  setUrl(sample.url);
                  const processed = processVideoUrl(sample.url);
                  setVideoInfo(processed);
                  setIsValidUrl(true);
                  onSubmit(sample.url, processed);
                }}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-blue-600/10 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <IconComponent className="h-4 w-4 text-blue-400" />
                  <span className="text-blue-400 font-medium">{sample.name}</span>
                </div>
                <span className="text-gray-400 text-xs truncate block">{sample.url}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
