'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, 
  RefreshCw, 
  ExternalLink, 
  Settings,
  Shield
} from 'lucide-react';
import { type VideoInfo, generateYouTubeEmbedUrls, checkEmbedRestrictions } from '../utils/videoUtils';

interface YouTubePlayerProps {
  videoInfo: VideoInfo;
  isEnhancing: boolean;
  className?: string;
}

export function YouTubePlayer({ videoInfo, isEnhancing, className = '' }: YouTubePlayerProps) {
  const [currentEmbedIndex, setCurrentEmbedIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [embedUrls, setEmbedUrls] = useState<string[]>([]);
  const [canEmbed, setCanEmbed] = useState<boolean | null>(null);
  const [errorDetails, setErrorDetails] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (videoInfo.videoId) {
      const urls = generateYouTubeEmbedUrls(videoInfo.videoId);
      setEmbedUrls(urls);
      setCurrentEmbedIndex(0);
      setHasError(false);
      setErrorDetails('');
      setIsLoading(true);
      
      // Check if embedding is possible
      checkEmbedRestrictions(videoInfo.videoId).then((result) => {
        setCanEmbed(result);
        if (!result) {
          setErrorDetails('This video has embedding restrictions set by the creator.');
        }
      }).catch((error) => {
        console.warn('Could not check embed restrictions:', error);
        setErrorDetails('Unable to verify video availability.');
      });
    }
  }, [videoInfo.videoId]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
    setErrorDetails('');
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
    
    if (currentEmbedIndex >= embedUrls.length - 1) {
      setErrorDetails('This video is not available for embedding after trying all methods.');
    } else {
      setErrorDetails('This video may have regional or embedding restrictions.');
    }
  };

  const tryNextEmbedUrl = () => {
    if (currentEmbedIndex < embedUrls.length - 1) {
      setCurrentEmbedIndex(currentEmbedIndex + 1);
      setHasError(false);
      setErrorDetails('');
      setIsLoading(true);
    }
  };

  const openInYouTube = () => {
    window.open(videoInfo.originalUrl, '_blank');
  };

  const currentEmbedUrl = embedUrls[currentEmbedIndex];

  if (canEmbed === false) {
    return (
      <div className={`relative w-full h-full bg-gray-900 rounded-lg overflow-hidden ${className}`}>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
          <Shield className="h-16 w-16 text-yellow-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Embedding Restricted</h3>
          <p className="text-gray-400 mb-6 max-w-md">
            This YouTube video cannot be embedded due to the creator&apos;s settings. 
            You can still watch it directly on YouTube.
          </p>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openInYouTube}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            <ExternalLink className="h-5 w-5" />
            Watch on YouTube
          </motion.button>
          
          {isEnhancing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute top-4 right-4 px-3 py-1 bg-green-500/90 backdrop-blur-sm rounded-full text-sm font-medium text-white flex items-center gap-2 z-10"
            >
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Enhancement Ready
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {/* Loading State */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10"
          >
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-400">Loading YouTube video...</p>
              {currentEmbedIndex > 0 && (
                <p className="text-sm text-blue-400 mt-1">
                  Trying alternative method {currentEmbedIndex + 1}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      <AnimatePresence>
        {hasError && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10 p-6 text-center"
          >
            <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Video Unavailable</h3>
            <p className="text-gray-400 mb-2 max-w-md">
              {errorDetails || 'This video encountered an error while loading.'}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              This might be due to embedding restrictions, regional limitations, or network issues.
            </p>
            
            <div className="flex gap-3">
              {currentEmbedIndex < embedUrls.length - 1 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={tryNextEmbedUrl}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Alternative
                </motion.button>
              )}
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={openInYouTube}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Open in YouTube
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* YouTube Iframe */}
      {!hasError && currentEmbedUrl && (
        <iframe
          ref={iframeRef}
          src={currentEmbedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          title="YouTube video player"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />
      )}

      {/* Enhancement Indicator */}
      {isEnhancing && !hasError && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-4 right-4 px-3 py-1 bg-green-500/90 backdrop-blur-sm rounded-full text-sm font-medium text-white flex items-center gap-2 z-10"
        >
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          AI Enhancement Available
        </motion.div>
      )}

      {/* YouTube Notice */}
      {!hasError && !isLoading && (
        <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/70 backdrop-blur-sm rounded-lg text-sm text-white">
          <span className="flex items-center gap-2">
            <Settings className="h-3 w-3" />
            YouTube Video • Controls available in player
          </span>
        </div>
      )}

      {/* Retry Information */}
      {currentEmbedIndex > 0 && !hasError && !isLoading && (
        <div className="absolute bottom-4 right-4 px-3 py-1 bg-blue-500/70 backdrop-blur-sm rounded-lg text-sm text-white">
          Alternative method {currentEmbedIndex + 1}
        </div>
      )}
    </div>
  );
}
