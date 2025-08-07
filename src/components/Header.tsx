'use client';

import { PlayCircle, Zap } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-gray-800 bg-black/20 backdrop-blur-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <PlayCircle className="h-8 w-8 text-blue-400" />
              <Zap className="h-4 w-4 text-yellow-400 absolute -top-1 -right-1" />
            </div>
            <span className="text-2xl font-bold text-white">VideoiX</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">
              How it Works
            </a>
            <a href="#about" className="text-gray-300 hover:text-white transition-colors">
              About
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
