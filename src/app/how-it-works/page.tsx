'use client';

import Link from 'next/link';
import { ArrowLeft, Upload, Brain, Play } from 'lucide-react';

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <nav className="relative z-50 bg-black/10 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors">
              <ArrowLeft size={20} />
              <span className="text-sm font-medium">Back to VideoiX</span>
            </Link>
            <Link href="/" className="text-2xl font-bold text-white">
              Video<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">iX</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            Video Enhancement
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Made Simple
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Transform any video in just 3 easy steps. No technical knowledge required - 
            our AI does all the heavy lifting for you.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-16 mb-16">
          <Step
            number="1"
            icon={<Upload className="w-8 h-8" />}
            title="Paste Your Video Link"
            description="Simply copy and paste any video URL from YouTube, TikTok, Instagram, or upload a direct file. We support all major video platforms and formats."
            details={[
              "YouTube, TikTok, Instagram, Vimeo supported",
              "Direct MP4, MOV, AVI files work too",
              "No file size limits",
              "Completely secure and private"
            ]}
          />

          <Step
            number="2"
            icon={<Brain className="w-8 h-8" />}
            title="AI Analyzes Your Video"
            description="Our advanced neural networks examine every frame, identifying faces, text, objects, and scenes to determine the best enhancement approach."
            details={[
              "Smart content recognition",
              "Automatic quality detection", 
              "Optimal enhancement selection",
              "Real-time processing"
            ]}
          />

          <Step
            number="3"
            icon={<Play className="w-8 h-8" />}
            title="Watch the Magic Happen"
            description="Your enhanced video is ready to watch immediately. See the difference as blurry footage becomes crystal clear with incredible detail."
            details={[
              "Instant playback",
              "Up to 4x resolution boost",
              "Enhanced colors and sharpness",
              "No watermarks or limits"
            ]}
          />
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-12 border border-white/10">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-gray-300 mb-8">
            Try VideoiX now and see the difference AI can make to your videos.
          </p>
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium py-3 px-8 rounded-lg transition-all transform hover:scale-105"
          >
            <Play className="w-5 h-5" />
            Start Enhancing
          </Link>
        </div>
      </main>
    </div>
  );
}

function Step({ 
  number, 
  icon, 
  title, 
  description, 
  details 
}: { 
  number: string; 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  details: string[] 
}) {
  return (
    <div className="flex flex-col md:flex-row items-start gap-8">
      {/* Step Number */}
      <div className="flex-shrink-0">
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {number}
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-xl opacity-30"></div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-blue-400">{icon}</div>
            <h3 className="text-2xl font-bold text-white">{title}</h3>
          </div>
          <p className="text-gray-300 text-lg mb-6 leading-relaxed">{description}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {details.map((detail, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-gray-400">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0"></div>
                {detail}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
