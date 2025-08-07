'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface AIEnhancementOverlayProps {
  isEnhancing: boolean;
  enhancementSettings: {
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
}

export function AIEnhancementOverlay({ 
  isEnhancing, 
  enhancementSettings, 
  upscalingConfig 
}: AIEnhancementOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animationFrame, setAnimationFrame] = useState<number>(0);

  useEffect(() => {
    if (!isEnhancing || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container
    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    let frame = 0;
    const animate = () => {
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create enhancement simulation effects
      if (isEnhancing) {
        // Base transparency
        ctx.globalAlpha = 0.15;

        // Simulate upscaling effect
        if (upscalingConfig) {
          drawUpscalingPattern(ctx, canvas.width, canvas.height, frame);
        }

        // Simulate sharpening
        if (enhancementSettings.sharpening > 0) {
          drawSharpeningEffect(ctx, canvas.width, canvas.height, enhancementSettings.sharpening, frame);
        }

        // Simulate color enhancement
        if (enhancementSettings.colorEnhancement > 0) {
          drawColorEnhancement(ctx, canvas.width, canvas.height, enhancementSettings.colorEnhancement, frame);
        }

        // Simulate noise reduction
        if (enhancementSettings.noiseReduction > 0) {
          drawNoiseReductionEffect(ctx, canvas.width, canvas.height, enhancementSettings.noiseReduction, frame);
        }

        // Simulate brightness boost
        if (enhancementSettings.brightnessBoost && enhancementSettings.brightnessBoost !== 0) {
          drawBrightnessEffect(ctx, canvas.width, canvas.height, enhancementSettings.brightnessBoost, frame);
        }

        ctx.globalAlpha = 1;
      }

      frame++;
      const nextFrame = requestAnimationFrame(animate);
      setAnimationFrame(nextFrame);
    };

    animate();

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isEnhancing, enhancementSettings, upscalingConfig, animationFrame]);

  const drawUpscalingPattern = (ctx: CanvasRenderingContext2D, width: number, height: number, frame: number) => {
    const gridSize = 20;
    const opacity = Math.sin(frame * 0.05) * 0.3 + 0.5;
    
    ctx.globalAlpha = opacity * 0.1;
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;

    // Draw upscaling grid pattern
    for (let x = 0; x < width; x += gridSize) {
      for (let y = 0; y < height; y += gridSize) {
        ctx.strokeRect(x, y, gridSize, gridSize);
      }
    }
  };

  const drawSharpeningEffect = (ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number, frame: number) => {
    const lineCount = Math.floor(intensity * 20);
    const opacity = Math.sin(frame * 0.08) * 0.2 + 0.3;
    
    ctx.globalAlpha = opacity * intensity;
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1;

    // Draw sharp edge indicators
    for (let i = 0; i < lineCount; i++) {
      const x = (i / lineCount) * width;
      const y = Math.sin(x * 0.01 + frame * 0.02) * 50 + height / 2;
      
      ctx.beginPath();
      ctx.moveTo(x, y - 10);
      ctx.lineTo(x, y + 10);
      ctx.stroke();
    }
  };

  const drawColorEnhancement = (ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number, frame: number) => {
    const pulseIntensity = Math.sin(frame * 0.06) * 0.5 + 0.5;
    
    // Color enhancement gradient overlay
    const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height)/2);
    gradient.addColorStop(0, `rgba(168, 85, 247, ${intensity * pulseIntensity * 0.1})`);
    gradient.addColorStop(0.5, `rgba(59, 130, 246, ${intensity * pulseIntensity * 0.05})`);
    gradient.addColorStop(1, `rgba(16, 185, 129, ${intensity * pulseIntensity * 0.02})`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  };

  const drawNoiseReductionEffect = (ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number, frame: number) => {
    const particleCount = Math.floor(intensity * 30);
    const opacity = Math.sin(frame * 0.1) * 0.3 + 0.4;
    
    ctx.globalAlpha = opacity * intensity * 0.3;
    ctx.fillStyle = '#06b6d4';

    // Draw floating particles to represent noise reduction
    for (let i = 0; i < particleCount; i++) {
      const x = (Math.sin(frame * 0.01 + i) * 0.5 + 0.5) * width;
      const y = (Math.cos(frame * 0.015 + i * 2) * 0.5 + 0.5) * height;
      const size = Math.sin(frame * 0.02 + i) * 2 + 3;
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawBrightnessEffect = (ctx: CanvasRenderingContext2D, width: number, height: number, brightness: number, frame: number) => {
    const pulseIntensity = Math.sin(frame * 0.04) * 0.3 + 0.7;
    const alpha = Math.abs(brightness) * pulseIntensity * 0.1;
    
    if (brightness > 0) {
      // Brightness boost - warm glow
      ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
    } else {
      // Brightness reduction - cool overlay
      ctx.fillStyle = `rgba(0, 100, 200, ${alpha})`;
    }
    
    ctx.fillRect(0, 0, width, height);
  };

  if (!isEnhancing) return null;

  return (
    <motion.canvas
      ref={canvasRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 pointer-events-none z-10"
      style={{
        mixBlendMode: 'overlay'
      }}
    />
  );
}
