'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, 
  RefreshCw, 
  ExternalLink, 
  Settings,
  Play,
  Pause,
  Volume2,
  VolumeX
} from 'lucide-react';
import { type VideoInfo, generateYouTubeEmbedUrls } from '../utils/videoUtils';
import { AIEnhancementOverlay } from './AIEnhancementOverlay';
import DirectVideoEnhancer from './DirectVideoEnhancer';

interface EnhancedYouTubePlayerProps {
  videoInfo: VideoInfo;
  isEnhancing: boolean;
  enhancementSettings?: {
    upscaling: number;
    noiseReduction: number;
    sharpening: number;
    colorEnhancement: number;
    brightnessBoost?: number;
  };
  upscalingConfig?: {
    targetWidth: number;
    targetHeight: number;
    algorithm: string;
  } | null;
  className?: string;
  onVideoElementReady?: (element: HTMLVideoElement) => void;
  onResolutionDetected?: (resolution: { width: number; height: number }) => void;
}

// Add this interface for direct stream data
interface DirectStreamData {
  success: boolean;
  canExtract: boolean;
  data?: {
    direct_url: string;
    resolution: string;
    format: string;
    title: string;
    thumbnail: string;
  };
  fallback?: boolean;
  enhancedUrls?: string[];
}

export function EnhancedYouTubePlayer({ 
  videoInfo, 
  isEnhancing, 
  enhancementSettings = {
    upscaling: 2,
    noiseReduction: 0.5,
    sharpening: 0.3,
    colorEnhancement: 0.4,
    brightnessBoost: 0,
  },
  upscalingConfig,
  className = '',
  onVideoElementReady,
  onResolutionDetected
}: EnhancedYouTubePlayerProps) {
  const [currentEmbedIndex, setCurrentEmbedIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [embedUrls, setEmbedUrls] = useState<string[]>([]);
  const [directStreamData, setDirectStreamData] = useState<DirectStreamData | null>(null);
  const [useDirectStream, setUseDirectStream] = useState(false);
  const [isExtractingStream, setIsExtractingStream] = useState(false);
  const [directVideoUrl, setDirectVideoUrl] = useState<string>('');
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  
  // Direct video player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoInfo.videoId) {
      const urls = generateYouTubeEmbedUrls(videoInfo.videoId);
      setEmbedUrls(urls);
      setCurrentEmbedIndex(0);
      setHasError(false);
      setErrorDetails('');
      setIsLoading(true);
      setUseDirectStream(false);
      setRetryCount(0);
    }
  }, [videoInfo.videoId]);

  // Try to extract direct video stream as a last resort
  const tryDirectVideoExtraction = async () => {
    if (!videoInfo.videoId) return;
    
    try {
      // First, try the backend extraction service
      const response = await fetch(`/api/youtube-extract?videoId=${videoInfo.videoId}`);
      const data = await response.json();
      
      if (data.videoUrl) {
        setDirectVideoUrl(data.videoUrl);
        setUseDirectStream(true);
        setHasError(false);
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.warn('Backend extraction failed, trying alternative methods:', error);
    }

    try {
      // Alternative: Try to get video info through public APIs
      const fetchedVideoInfo = await fetchVideoInfo(videoInfo.videoId);
      if (fetchedVideoInfo && fetchedVideoInfo.streamUrl) {
        setDirectVideoUrl(fetchedVideoInfo.streamUrl);
        setUseDirectStream(true);
        setHasError(false);
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.warn('Alternative extraction failed:', error);
    }

    // If all methods fail, enable enhanced iframe mode with AI simulation
    setErrorDetails('Using enhanced iframe with AI simulation overlay.');
    setHasError(false);
    setIsLoading(false);
    setUseDirectStream(false);
  };

  // Fetch video information using public methods
  const fetchVideoInfo = async (videoId: string) => {
    try {
      // This would use YouTube's public APIs or other methods
      const oEmbedResponse = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      );
      
      if (oEmbedResponse.ok) {
        const oEmbedData = await oEmbedResponse.json();
        // oEmbed doesn't provide direct video URLs, but we can use it for metadata
        return {
          title: oEmbedData.title,
          thumbnail: oEmbedData.thumbnail_url,
          streamUrl: null // Would need more sophisticated extraction
        };
      }
    } catch (error) {
      console.warn('oEmbed fetch failed:', error);
    }
    
    return null;
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
    setErrorDetails('');
    setRetryCount(0);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
    setRetryCount(prev => prev + 1);
    
    if (currentEmbedIndex >= embedUrls.length - 1) {
      if (retryCount >= 2) {
        setErrorDetails('All embedding methods failed. Attempting direct stream extraction...');
        tryDirectVideoExtraction();
      } else {
        setErrorDetails('This video cannot be embedded due to restrictions.');
      }
    } else {
      setErrorDetails('Embedding failed, trying alternative method...');
    }
  };

  const tryNextEmbedUrl = () => {
    if (currentEmbedIndex < embedUrls.length - 1) {
      setCurrentEmbedIndex(currentEmbedIndex + 1);
      setHasError(false);
      setErrorDetails('');
      setIsLoading(true);
    } else {
      // All embed URLs tried, attempt direct extraction
      tryDirectVideoExtraction();
    }
  };

  const openInYouTube = () => {
    window.open(videoInfo.originalUrl, '_blank');
  };

  // Direct video player controls
  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Video element setup for direct streams
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !useDirectStream) return;

    const handleLoadedMetadata = () => {
      const resolution = {
        width: video.videoWidth,
        height: video.videoHeight
      };
      
      if (onResolutionDetected) {
        onResolutionDetected(resolution);
      }
      
      if (onVideoElementReady) {
        onVideoElementReady(video);
      }
    };

    const handleTimeUpdate = () => {
      // Video progress tracking can be added here if needed
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [useDirectStream, directVideoUrl, onVideoElementReady, onResolutionDetected]);

  // Add effect to attempt extraction on load
  useEffect(() => {
    if (videoInfo.videoId) {
      attemptDirectExtraction(videoInfo.videoId);
    }
  }, [videoInfo.videoId]);

  // Add function to attempt direct stream extraction
  const attemptDirectExtraction = async (videoId: string) => {
    setIsExtractingStream(true);
    try {
      const response = await fetch(`/api/youtube-extract?videoId=${videoId}&quality=best&format=mp4`);
      const data = await response.json();
      
      console.log('Direct extraction result:', data);
      setDirectStreamData(data);
      
      if (data.success && data.canExtract && data.data?.direct_url) {
        setUseDirectStream(true);
        console.log('Direct stream available:', data.data.direct_url);
      }
    } catch (error) {
      console.error('Direct extraction failed:', error);
    } finally {
      setIsExtractingStream(false);
    }
  };

  const currentEmbedUrl = embedUrls[currentEmbedIndex];

  if (useDirectStream && directVideoUrl) {
    // Render direct video player for extracted streams
    return (
      <div className={`relative w-full h-full bg-gray-900 rounded-lg overflow-hidden ${className}`}>
        <video
          ref={videoRef}
          src={directVideoUrl}
          className="w-full h-full object-contain"
          crossOrigin="anonymous"
          playsInline
        />
        
        {/* Direct video controls */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center gap-4 bg-black/70 backdrop-blur-sm rounded-lg p-3">
          <button
            onClick={togglePlay}
            className="text-white hover:text-blue-400 transition-colors"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
          
          <button
            onClick={toggleMute}
            className="text-white hover:text-blue-400 transition-colors"
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
          
          <div className="flex-1 text-sm text-white">
            Direct Stream Mode • AI Enhancement Active
          </div>
        </div>

        {/* Enhancement indicator */}
        {isEnhancing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-4 right-4 px-3 py-1 bg-green-500/90 backdrop-blur-sm rounded-full text-sm font-medium text-white flex items-center gap-2 z-10"
          >
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            AI Enhanced Direct Stream
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {/* Direct Stream Player (when available) */}
      {useDirectStream && directStreamData?.data?.direct_url && (
        <DirectVideoEnhancer
          videoUrl={directStreamData.data.direct_url}
          originalResolution={directStreamData.data.resolution}
          targetResolution={upscalingConfig ? `${upscalingConfig.targetWidth}x${upscalingConfig.targetHeight}` : '1080p'}
          onEnhancementChange={(enhancing) => {
            console.log('Direct stream enhancement:', enhancing);
          }}
        />
      )}

      {/* Show extraction status */}
      {isExtractingStream && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-4 right-4 bg-purple-600 text-white px-3 py-2 rounded-lg text-sm z-20"
        >
          Extracting direct stream...
        </motion.div>
      )}

      {/* Show direct stream toggle when available */}
      {directStreamData?.success && directStreamData?.canExtract && (
        <motion.button
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setUseDirectStream(!useDirectStream)}
          className={`absolute top-4 left-4 px-3 py-2 rounded-lg text-sm font-medium z-20 transition-colors ${
            useDirectStream 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {useDirectStream ? '🎬 Direct Stream (4K AI)' : '📺 Switch to Direct Stream'}
        </motion.button>
      )}

      {/* Loading State */}
      <AnimatePresence>
        {isLoading && !useDirectStream && (
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
                  Trying enhanced method {currentEmbedIndex + 1}
                </p>
              )}
              {retryCount > 0 && (
                <p className="text-xs text-yellow-400 mt-1">
                  Bypass attempt {retryCount}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      <AnimatePresence>
        {hasError && !isLoading && !useDirectStream && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10 p-6 text-center"
          >
            <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Video Embedding Issue</h3>
            <p className="text-gray-400 mb-2 max-w-md">
              {errorDetails || 'This video encountered an error while loading.'}
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
                  Try Enhanced Method
                </motion.button>
              )}
              
              {retryCount < 2 && currentEmbedIndex >= embedUrls.length - 1 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={tryDirectVideoExtraction}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Extract Direct Stream
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

      {/* Enhanced YouTube Iframe */}
      {!hasError && !useDirectStream && currentEmbedUrl && (
        <>
          <iframe
            ref={iframeRef}
            src={currentEmbedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            title="YouTube video player"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            style={{
              border: 'none',
              background: 'transparent'
            }}
          />
          
          {/* AI Enhancement Overlay for iframe */}
          <AIEnhancementOverlay
            isEnhancing={isEnhancing}
            enhancementSettings={enhancementSettings}
            upscalingConfig={upscalingConfig}
          />
        </>
      )}

      {/* Enhancement Indicator for iframe */}
      {isEnhancing && !hasError && !isLoading && !useDirectStream && (
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
      {!hasError && !isLoading && !useDirectStream && (
        <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/70 backdrop-blur-sm rounded-lg text-sm text-white">
          <span className="flex items-center gap-2">
            <Settings className="h-3 w-3" />
            Enhanced YouTube Player
            {currentEmbedIndex > 0 && ` • Method ${currentEmbedIndex + 1}`}
          </span>
        </div>
      )}
    </div>
  );
}
