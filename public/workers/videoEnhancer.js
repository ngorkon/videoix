// Video Enhancement Web Worker
// This worker handles heavy video processing tasks to avoid blocking the main thread

self.onmessage = function(e) {
  const { imageData, settings } = e.data;
  
  if (!imageData || !settings) {
    return;
  }

  const enhancedImageData = enhanceVideoFrame(imageData, settings);
  
  self.postMessage({
    type: 'enhanced-frame',
    imageData: enhancedImageData
  });
};

function enhanceVideoFrame(imageData, settings) {
  const data = imageData.data;
  const { noiseReduction, sharpening, colorEnhancement } = settings; // 'upscaling' is not used
  
  // Apply enhancement algorithms
  for (let i = 0; i < data.length; i += 4) {
    // Color enhancement
    if (colorEnhancement > 0) {
      data[i] = Math.min(255, data[i] * (1 + colorEnhancement * 0.5));     // Red
      data[i + 1] = Math.min(255, data[i + 1] * (1 + colorEnhancement * 0.5)); // Green
      data[i + 2] = Math.min(255, data[i + 2] * (1 + colorEnhancement * 0.5)); // Blue
    }
    
    // Noise reduction (simple smoothing)
    if (noiseReduction > 0) {
      const factor = 1 - (noiseReduction * 0.1);
      data[i] = data[i] * factor;
      data[i + 1] = data[i + 1] * factor;
      data[i + 2] = data[i + 2] * factor;
    }
    
    // Sharpening (simplified)
    if (sharpening > 0) {
      const sharpenFactor = 1 + sharpening * 0.3;
      data[i] = Math.min(255, data[i] * sharpenFactor);
      data[i + 1] = Math.min(255, data[i + 1] * sharpenFactor);
      data[i + 2] = Math.min(255, data[i + 2] * sharpenFactor);
    }
  }
  
  return imageData;
}
