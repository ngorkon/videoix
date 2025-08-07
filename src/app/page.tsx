'use client';

import { VideoEnhancer } from '@/components/VideoEnhancer';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            VideoiX
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Enhance videos from YouTube, Dailymotion, Vimeo, and more with AI-powered real-time processing. 
            Transform low-quality videos into crystal-clear, high-definition content with advanced pixel reconstruction.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm text-gray-400">
            <span className="px-3 py-1 bg-red-500/20 rounded-full border border-red-500/30">YouTube</span>
            <span className="px-3 py-1 bg-blue-500/20 rounded-full border border-blue-500/30">Dailymotion</span>
            <span className="px-3 py-1 bg-cyan-500/20 rounded-full border border-cyan-500/30">Vimeo</span>
            <span className="px-3 py-1 bg-blue-600/20 rounded-full border border-blue-600/30">Facebook</span>
            <span className="px-3 py-1 bg-pink-500/20 rounded-full border border-pink-500/30">Instagram</span>
            <span className="px-3 py-1 bg-sky-500/20 rounded-full border border-sky-500/30">Twitter</span>
            <span className="px-3 py-1 bg-black/20 rounded-full border border-gray-500/30">TikTok</span>
            <span className="px-3 py-1 bg-purple-500/20 rounded-full border border-purple-500/30">Twitch</span>
            <span className="px-3 py-1 bg-gray-500/20 rounded-full border border-gray-500/30">Direct URLs</span>
          </div>
        </div>
        <VideoEnhancer />
      </main>
      <Footer />
    </div>
  );
}
