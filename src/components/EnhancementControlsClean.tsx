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

  const handleSliderChange = (key: keyof EnhancementSettings, value: number) => {
    onChange({
      ...settings,
      [key]: value
    });
  };

  const presets = [
    {
      name: 'Balanced',
      description: 'General-purpose enhancement',
      settings: { upscaling: 2, noiseReduction: 0.5, sharpening: 0.3, colorEnhancement: 0.4, brightnessBoost: 0 }
    },
    {
      name: 'HD to 4K',
      description: 'Maximum quality upscaling',
      settings: { upscaling: 4, noiseReduction: 0.8, sharpening: 0.6, colorEnhancement: 0.7, brightnessBoost: 0.1 }
    },
    {
      name: 'Low Light Boost',
      description: 'For dark videos',
      settings: { upscaling: 2.5, noiseReduction: 0.7, sharpening: 0.4, colorEnhancement: 0.6, brightnessBoost: 0.5 }
    }
  ];

  const SliderControl = ({ 
    label, 
    value, 
    min, 
    max, 
    step, 
    icon: Icon, 
    onChange 
  }: {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    icon: React.ElementType;
    onChange: (value: number) => void;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-white">{label}</span>
        </div>
        <span className="text-sm text-gray-400">{value.toFixed(1)}</span>
      </div>
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
            AI Enhancement Active • {settings.upscaling}x Upscaling
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
