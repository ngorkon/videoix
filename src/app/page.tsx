'use client';

import { VideoEnhancerFast } from '@/components/VideoEnhancerFast';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Simple Navigation Header */}
      <nav className="relative z-50 bg-black/10 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center">
              <h1 className="text-2xl font-bold text-white">
                Video<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">iX</span>
              </h1>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/features" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">
                Features
              </Link>
              <Link href="/how-it-works" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">
                How It Works
              </Link>
              <Link href="/about" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">
                About
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-300 hover:text-white p-2"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/10">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-black/20 backdrop-blur-lg">
              <Link href="/features" className="text-gray-300 hover:text-white block px-3 py-2 text-sm font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                Features
              </Link>
              <Link href="/how-it-works" className="text-gray-300 hover:text-white block px-3 py-2 text-sm font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                How It Works
              </Link>
              <Link href="/about" className="text-gray-300 hover:text-white block px-3 py-2 text-sm font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                About
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Simple Hero Section */}
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Make Any Video
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Crystal Clear
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Instantly transform blurry, low-quality videos into stunning HD with our AI. 
            Just paste a link and watch the magic happen.
          </p>
        </div>

        {/* Video Enhancement Tool */}
        <VideoEnhancerFast />

        {/* Simple Footer */}
        <footer className="mt-20 py-8 text-center text-gray-400 text-sm">
          <p>© 2025 VideoiX • Transform any video with AI</p>
        </footer>
      </main>
    </div>
  );
}
