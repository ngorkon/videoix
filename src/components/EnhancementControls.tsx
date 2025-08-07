'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Eye, 
  Palette, 
  Volume2,
  RotateCcw,
  Sun,
  ChevronDown,
  ChevronUp,
  Settings2,
  Sparkles
} from 'lucide-react';

interface EnhancementSettings {
  upscaling: number;
  noiseReduction: number;
  sharpening: number;
  colorEnhancement: number;
  brightnessBoost: number;
  customResolution?: { width: number; height: number };
  useCustomResolution?: boolean;
}

interface EnhancementControlsProps {
  settings: EnhancementSettings;
  onChange: (settings: EnhancementSettings) => void;
  isEnhancing: boolean;
}

export function EnhancementControls({ 
  settings, 
  onChange, 
  isEnhancing 
}: EnhancementControlsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCustomResolution, setShowCustomResolution] = useState(false);
  const [customWidth, setCustomWidth] = useState(1920);
  const [customHeight, setCustomHeight] = useState(1080);

  const handleSliderChange = (key: keyof EnhancementSettings, value: number) => {
    onChange({
      ...settings,
      [key]: value
    });
  };

  // Get target resolution description based on upscaling factor
  const getTargetResolutionDescription = (upscaling: number) => {
    if (upscaling >= 4) return '4K Ultra HD (3840×2160)';
    if (upscaling >= 2.5) return '1440p Quad HD (2560×1440)';
    if (upscaling >= 2) return '1080p Full HD (1920×1080)';
    return `${upscaling}× Scale Factor`;
  };

  const presets = [
    {
      name: 'Balanced',
      description: 'General-purpose enhancement',
      settings: { upscaling: 2, noiseReduction: 0.5, sharpening: 0.3, colorEnhancement: 0.4, brightnessBoost: 0, useCustomResolution: false }
    },
    {
      name: 'HD to 4K',
      description: 'Maximum quality upscaling',
      settings: { upscaling: 4, noiseReduction: 0.8, sharpening: 0.6, colorEnhancement: 0.7, brightnessBoost: 0.1, useCustomResolution: false }
    },
    {
      name: 'Low Light Boost',
      description: 'For dark videos',
      settings: { upscaling: 2.5, noiseReduction: 0.7, sharpening: 0.4, colorEnhancement: 0.6, brightnessBoost: 0.5, useCustomResolution: false }
    }
  ];

  // Resolution presets
  const resolutionPresets = [
    { name: '720p HD', width: 1280, height: 720 },
    { name: '1080p FHD', width: 1920, height: 1080 },
    { name: '1440p QHD', width: 2560, height: 1440 },
    { name: '4K UHD', width: 3840, height: 2160 },
    { name: '5K', width: 5120, height: 2880 },
    { name: '8K', width: 7680, height: 4320 }
  ];

  const setCustomResolution = (width: number, height: number) => {
    setCustomWidth(width);
    setCustomHeight(height);
    onChange({
      ...settings,
      customResolution: { width, height },
      useCustomResolution: true,
      upscaling: 1 // Reset upscaling when using custom resolution
    });
  };

  const applyCustomResolution = () => {
    onChange({
      ...settings,
      customResolution: { width: customWidth, height: customHeight },
      useCustomResolution: true,
      upscaling: 1
    });
  };

  const SliderControl = ({ 
    label, 
    value, 
    min, 
    max, 
    step, 
    icon: Icon, 
    onChange,
    description
  }: {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    icon: React.ElementType;
    onChange: (value: number) => void;
    description?: string;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-white">{label}</span>
        </div>
        <span className="text-sm text-gray-400">{value.toFixed(1)}</span>
      </div>
      {description && (
        <div className="text-xs text-blue-400 ml-6">
          {description}
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
      />
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-black/40 backdrop-blur-lg rounded-xl border border-gray-700 p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Enhancement
        </h3>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          isEnhancing 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
        }`}>
          {isEnhancing ? 'Active' : 'Inactive'}
        </div>
      </div>

      {/* Quick Presets */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-300">Quick Presets</h4>
        <div className="space-y-2">
          {presets.map((preset) => (
            <motion.button
              key={preset.name}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange(preset.settings)}
              className="w-full p-3 text-left bg-gradient-to-r from-gray-800/50 to-gray-700/50 hover:from-gray-700/50 hover:to-gray-600/50 border border-gray-600 hover:border-gray-500 rounded-lg transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">{preset.name}</div>
                  <div className="text-xs text-gray-400">{preset.description}</div>
                </div>
                <Zap className="h-4 w-4 text-blue-400" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Resolution Presets */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-300">Target Resolution</h4>
        <div className="grid grid-cols-2 gap-2">
          {resolutionPresets.map((preset) => (
            <motion.button
              key={preset.name}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCustomResolution(preset.width, preset.height)}
              className={`p-2 text-xs rounded-lg border transition-all ${
                settings.useCustomResolution && 
                settings.customResolution?.width === preset.width && 
                settings.customResolution?.height === preset.height
                  ? 'bg-blue-600 border-blue-500 text-white' 
                  : 'bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:border-gray-500'
              }`}
            >
              <div className="font-medium">{preset.name}</div>
              <div className="opacity-80">{preset.width}×{preset.height}</div>
            </motion.button>
          ))}
        </div>
        
        {/* Custom Resolution Input */}
        <div className="space-y-2">
          <button
            onClick={() => setShowCustomResolution(!showCustomResolution)}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            {showCustomResolution ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            Custom Resolution
          </button>
          
          {showCustomResolution && (
            <div className="flex gap-2 items-center">
              <input
                type="number"
                value={customWidth}
                onChange={(e) => setCustomWidth(parseInt(e.target.value) || 1920)}
                placeholder="Width"
                className="flex-1 px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white"
              />
              <span className="text-gray-400 text-xs">×</span>
              <input
                type="number"
                value={customHeight}
                onChange={(e) => setCustomHeight(parseInt(e.target.value) || 1080)}
                placeholder="Height"
                className="flex-1 px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={applyCustomResolution}
                className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                Apply
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Controls Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full flex items-center justify-between p-3 bg-gray-800/30 hover:bg-gray-700/50 border border-gray-600 hover:border-gray-500 rounded-lg transition-all"
      >
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-gray-400" />
          <span className="font-medium text-white">Advanced Controls</span>
        </div>
        {showAdvanced ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>

      {/* Advanced Controls */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 overflow-hidden"
          >
            <SliderControl
              label="Upscaling"
              value={settings.upscaling}
              min={1}
              max={4}
              step={0.1}
              icon={Zap}
              onChange={(value) => handleSliderChange('upscaling', value)}
              description={`Target: ${getTargetResolutionDescription(settings.upscaling)}`}
            />

            <SliderControl
              label="Noise Reduction"
              value={settings.noiseReduction}
              min={0}
              max={1}
              step={0.1}
              icon={Volume2}
              onChange={(value) => handleSliderChange('noiseReduction', value)}
            />

            <SliderControl
              label="Sharpening"
              value={settings.sharpening}
              min={0}
              max={1}
              step={0.1}
              icon={Eye}
              onChange={(value) => handleSliderChange('sharpening', value)}
            />

            <SliderControl
              label="Color Enhancement"
              value={settings.colorEnhancement}
              min={0}
              max={1}
              step={0.1}
              icon={Palette}
              onChange={(value) => handleSliderChange('colorEnhancement', value)}
            />

            <SliderControl
              label="Brightness Boost"
              value={settings.brightnessBoost}
              min={-0.5}
              max={1}
              step={0.1}
              icon={Sun}
              onChange={(value) => handleSliderChange('brightnessBoost', value)}
            />

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange({
                upscaling: 2,
                noiseReduction: 0.5,
                sharpening: 0.3,
                colorEnhancement: 0.4,
                brightnessBoost: 0,
              })}
              className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Default
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status */}
      {isEnhancing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg"
        >
          <div className="flex items-center gap-2 text-sm text-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            AI Enhancement Active • {
              settings.useCustomResolution && settings.customResolution 
                ? `${settings.customResolution.width}×${settings.customResolution.height}` 
                : getTargetResolutionDescription(settings.upscaling)
            }
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
