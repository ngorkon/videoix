'use client';

import Link from 'next/link';
import { ArrowLeft, Sparkles, Zap, Target, Globe } from 'lucide-react';

export default function Features() {
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

      {/* Features Content */}
      <main className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            Supercharge Your Videos
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              With AI Power
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Discover how VideoiX transforms ordinary videos into extraordinary experiences. 
            No technical skills needed - just pure AI magic.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <FeatureCard
            icon={<Sparkles className="w-8 h-8 text-purple-400" />}
            title="AI Super Resolution"
            description="Turn blurry 480p videos into crystal-clear 4K. Our neural networks understand what's in your video and recreate missing details with incredible accuracy."
            benefits={["480p → 4K enhancement", "Smart detail reconstruction", "No artifacts or blur"]}
          />
          
          <FeatureCard
            icon={<Zap className="w-8 h-8 text-yellow-400" />}
            title="Lightning Fast Processing"
            description="Get results in seconds, not hours. Watch your enhanced video immediately while our AI works its magic in real-time."
            benefits={["Real-time processing", "No waiting around", "Instant playback"]}
          />
          
          <FeatureCard
            icon={<Target className="w-8 h-8 text-green-400" />}
            title="Smart Content Detection"
            description="Our AI recognizes faces, text, landscapes, and objects to apply the perfect enhancement for each part of your video."
            benefits={["Face-aware enhancement", "Text sharpening", "Scene optimization"]}
          />
          
          <FeatureCard
            icon={<Globe className="w-8 h-8 text-blue-400" />}
            title="Works Everywhere"
            description="YouTube, TikTok, Instagram, your phone videos - if it's a video, we can enhance it. No downloads, no software installs."
            benefits={["All major platforms", "Direct file support", "Browser-based"]}
          />
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-12 border border-white/10">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Videos?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of creators who&apos;ve already discovered the power of AI video enhancement.
          </p>
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium py-3 px-8 rounded-lg transition-all transform hover:scale-105"
          >
            <Sparkles className="w-5 h-5" />
            Try VideoiX Free
          </Link>
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description, 
  benefits 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  benefits: string[] 
}) {
  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300">
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <h3 className="text-2xl font-bold text-white">{title}</h3>
      </div>
      <p className="text-gray-300 mb-6 leading-relaxed">{description}</p>
      <ul className="space-y-2">
        {benefits.map((benefit, index) => (
          <li key={index} className="flex items-center gap-2 text-sm text-gray-400">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
            {benefit}
          </li>
        ))}
      </ul>
    </div>
  );
}
