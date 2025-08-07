'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

interface VideoFrameCaptureProps {
  videoElement?: HTMLVideoElement;
  isCapturing: boolean;
  onFrameCaptured?: (canvas: HTMLCanvasElement) => void;
  targetFPS?: number;
}

export function useVideoFrameCapture({ 
  videoElement, 
  isCapturing, 
  onFrameCaptured,
  targetFPS = 30 
}: VideoFrameCaptureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [captureRate] = useState(1000 / targetFPS);

  const captureFrame = useCallback(() => {
    if (!videoElement || !canvasRef.current || videoElement.paused || videoElement.ended) {
      return null;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Set canvas to match video dimensions
    canvas.width = videoElement.videoWidth || videoElement.clientWidth;
    canvas.height = videoElement.videoHeight || videoElement.clientHeight;

    try {
      // Draw current video frame to canvas
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      if (onFrameCaptured) {
        onFrameCaptured(canvas);
      }
      
      return canvas;
    } catch (error) {
      // Handle CORS or other drawing errors
      console.warn('Frame capture failed:', error);
      return null;
    }
  }, [videoElement, onFrameCaptured]);

  useEffect(() => {
    if (!isCapturing || !videoElement) return;

    const interval = setInterval(() => {
      captureFrame();
    }, captureRate);

    return () => clearInterval(interval);
  }, [isCapturing, videoElement, captureRate, captureFrame]);

  return {
    captureFrame,
    canvas: canvasRef.current
  };
}
