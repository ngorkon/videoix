'use client';

import { Github, Twitter, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-black/20 backdrop-blur-lg mt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <span className="text-gray-300">Made with</span>
            <Heart className="h-4 w-4 text-red-400" />
            <span className="text-gray-300">for better video experiences</span>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="https://github.com"
              className="text-gray-400 hover:text-white transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href="https://twitter.com"
              className="text-gray-400 hover:text-white transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Twitter className="h-5 w-5" />
            </a>
          </div>
        </div>
        <div className="text-center text-sm text-gray-500 mt-4">
          © 2025 VideoiX. Enhancing streams with AI technology.
        </div>
      </div>
    </footer>
  );
}
