'use client';

import Link from 'next/link';
import { ArrowLeft, Sparkles, Shield, Zap, Heart } from 'lucide-react';

export default function About() {
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
            About
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              VideoiX
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            We believe every video deserves to look its best. VideoiX makes professional-grade 
            video enhancement accessible to everyone.
          </p>
        </div>

        {/* Mission */}
        <div className="mb-16">
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-white/10">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">Our Mission</h2>
            <p className="text-lg text-gray-300 leading-relaxed text-center max-w-3xl mx-auto">
              To democratize professional video enhancement using cutting-edge AI technology. 
              Whether you&apos;re a content creator, student, or just someone who wants their memories to look amazing, 
              VideoiX makes it possible with just one click.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <ValueCard
            icon={<Sparkles className="w-8 h-8 text-purple-400" />}
            title="Innovation First"
            description="We use the latest AI models and neural networks to deliver results that seemed impossible just years ago."
          />
          
          <ValueCard
            icon={<Shield className="w-8 h-8 text-green-400" />}
            title="Privacy & Security"
            description="Your videos are processed securely and never stored. What you upload is yours alone."
          />
          
          <ValueCard
            icon={<Zap className="w-8 h-8 text-yellow-400" />}
            title="Lightning Fast"
            description="No more waiting hours for video processing. Get professional results in seconds, not hours."
          />
          
          <ValueCard
            icon={<Heart className="w-8 h-8 text-red-400" />}
            title="Made for Everyone"
            description="From complete beginners to video professionals, VideoiX is designed to be simple yet powerful."
          />
        </div>

        {/* Story */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-12 border border-white/10 mb-16">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">The Story Behind VideoiX</h2>
          <div className="space-y-6 text-gray-300 leading-relaxed">
            <p>
              VideoiX was born from a simple frustration: why should professional video enhancement 
              be limited to expensive software and technical expertise?
            </p>
            <p>
              Our team of AI researchers and developers spent years perfecting neural networks that 
              could understand video content at a deep level. We wanted to create something that could 
              take a blurry phone video and make it look like it was shot with professional equipment.
            </p>
            <p>
              Today, VideoiX powers millions of video enhancements, helping creators, businesses, 
              and everyday users transform their content with the power of artificial intelligence.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Videos?</h2>
          <p className="text-gray-300 mb-8">
            Join the AI video revolution and see what your content can become.
          </p>
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium py-3 px-8 rounded-lg transition-all transform hover:scale-105"
          >
            <Sparkles className="w-5 h-5" />
            Try VideoiX Now
          </Link>
        </div>
      </main>
    </div>
  );
}

function ValueCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
}) {
  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300">
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <h3 className="text-xl font-bold text-white">{title}</h3>
      </div>
      <p className="text-gray-300 leading-relaxed">{description}</p>
    </div>
  );
}
