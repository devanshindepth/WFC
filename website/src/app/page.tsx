"use client"
import { Award, CheckCircle, Eye, MessageSquare, Shield, Users, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

const LegalEaseLanding = () => {
  const [highlightedText, setHighlightedText] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: <Eye className="w-10 h-10 text-black" />,
      title: "Auto-Scanning",
      description: "Automatically detects Terms & Conditions and Privacy Policies on any website without manual uploads.",
      highlight: "AI-powered detection"
    },
    {
      icon: <MessageSquare className="w-10 h-10 text-black" />,
      title: "Dynamic Explanations",
      description: "Complex clauses rewritten in plain, easy-to-understand language with interactive AI explanations.",
      highlight: "Contextual summaries"
    },
    {
      icon: <Shield className="w-10 h-10 text-black" />,
      title: "Risk Assessment",
      description: "Highlights risky or uncommon clauses, helping users spot potential red flags before they agree.",
      highlight: "Smart risk analysis"
    },
    {
      icon: <Zap className="w-10 h-10 text-black" />,
      title: "Personalized Guidance",
      description: "Step-by-step guidance adapted to your preferences and interaction history for better understanding.",
      highlight: "Adaptive learning"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-40 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center relative">
          {/* Centered Logo */}
          <div className={`mb-26 transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <div className="text-6xl font-baskerville font-bold text-black">
              LegalEase
            </div>
          </div>

          <div className={`mb-12 animate-fade-in-up ${isVisible ? 'animate-fade-in-up' : ''}`}>
            <div className="inline-block bg-white/90 backdrop-blur-sm border-2 border-gray-200 px-16 py-10 mb-12 shadow-2xl rounded-2xl">
              <h1 className="text-5xl font-baskerville font-black text-black leading-tight tracking-tight">
                Understand Legal Documents
                <span className="block text-black">with AI Confidence</span>
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed font-medium font-inter">
              Transform complex terms and conditions into clear, actionable insights with our advanced AI-powered analysis platform.
            </p>
          </div>

          <div className={`space-y-4 animate-fade-in-up animate-delay-400 ${isVisible ? 'animate-fade-in-up animate-delay-400' : ''}`}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-black hover:bg-gray-800 text-white px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 focus-visible font-inter">
                Start Free Analysis
              </button>
              <button className="bg-white border-2 border-gray-300 text-black px-8 py-4 text-lg font-semibold rounded-xl hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 focus-visible font-inter">
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="pb-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-baskerville font-bold text-black mb-6">
              See AI Analysis in Action
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-inter">
              Experience how LegalEase transforms complex legal jargon into clear, actionable insights
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-fade-in-up">
            {/* Browser Header */}
            <div className="bg-gray-100 px-8 py-6 flex items-center gap-4 border-b border-gray-200">
              <div className="flex gap-3">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex-1 bg-white rounded-lg px-4 py-3 text-gray-600 text-base border border-gray-300 shadow-sm font-inter">
                https://streaming-service.com/terms-of-service
              </div>
              <div className="text-gray-500 text-sm font-medium font-inter">AI Analysis Active</div>
            </div>

            {/* Browser Content */}
            <div className="p-12 space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-3xl font-baskerville font-bold text-black">Terms of Service</h3>
                <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">
                  <CheckCircle className="w-4 h-4" />
                  AI Analysis Complete
                </div>
              </div>

              <div className="space-y-6 text-gray-700 leading-relaxed font-inter">
                <p className="text-lg">
                  By using our service, you acknowledge that we may collect and process your{' '}
                  <span
                    className="bg-yellow-100 hover:bg-yellow-200 px-4 py-2 rounded-lg cursor-pointer relative group border border-yellow-300 transition-colors duration-200"
                    onMouseEnter={() => setHighlightedText(1)}
                    onMouseLeave={() => setHighlightedText(null)}
                  >
                    personal data and usage patterns
                    {highlightedText === 1 && (
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-3 bg-black text-white p-6 rounded-xl text-sm w-96 z-20 shadow-2xl border border-gray-700">
                        <div className="flex items-start gap-3">
                          <div className="bg-black p-2 rounded-lg mt-1">
                            <MessageSquare className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <strong className="text-gray-300">AI Summary:</strong>
                            <p className="mt-2">They track your activity and collect personal information for business purposes like analytics and marketing.</p>
                            <div className="mt-3 flex gap-2">
                              <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">Standard Practice</span>
                              <span className="bg-black text-white px-2 py-1 rounded text-xs">GDPR Compliant</span>
                            </div>
                          </div>
                        </div>
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-black"></div>
                      </div>
                    )}
                  </span>
                  {' '}for various business purposes including but not limited to analytics, marketing, and{' '}
                  <span
                    className="bg-yellow-100 hover:bg-yellow-200 px-4 py-2 rounded-lg cursor-pointer relative group border border-yellow-300 transition-colors duration-200"
                    onMouseEnter={() => setHighlightedText(2)}
                    onMouseLeave={() => setHighlightedText(null)}
                  >
                    third-party integrations
                    {highlightedText === 2 && (
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-3 bg-black text-white p-6 rounded-xl text-sm w-96 z-20 shadow-2xl border border-gray-700">
                        <div className="flex items-start gap-3">
                          <div className="bg-black p-2 rounded-lg mt-1">
                            <Shield className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <strong className="text-gray-300">Risk Assessment:</strong>
                            <div className="mt-2">Your data may be shared with partner companies. Consider reviewing their privacy practices.</div>
                            <div className="mt-3 flex gap-2">
                              <span className="bg-yellow-600 text-white px-2 py-1 rounded text-xs">Medium Risk</span>
                              <span className="bg-black text-white px-2 py-1 rounded text-xs">Requires Consent</span>
                            </div>
                          </div>
                        </div>
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-black"></div>
                      </div>
                    )}
                  </span>
                  .
                </p>

                <p className="text-lg">
                  You hereby grant us an{' '}
                  <span
                    className="bg-red-100 hover:bg-red-200 px-4 py-2 rounded-lg cursor-pointer relative group border border-red-300 transition-colors duration-200"
                    onMouseEnter={() => setHighlightedText(3)}
                    onMouseLeave={() => setHighlightedText(null)}
                  >
                    irrevocable, worldwide, royalty-free license
                    {highlightedText === 3 && (
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-3 bg-red-600 text-white p-6 rounded-xl text-sm w-96 z-20 shadow-2xl border border-red-700">
                        <div className="flex items-start gap-3">
                          <div className="bg-red-600 p-2 rounded-lg mt-1">
                            <Shield className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <strong className="text-red-200">⚠️ High Risk Alert:</strong>
                            <p className="mt-2">This grants permanent global rights to use your content without compensation. Consider negotiating or seeking alternatives.</p>
                            <div className="mt-3 flex gap-2">
                              <span className="bg-red-700 text-white px-2 py-1 rounded text-xs">High Risk</span>
                              <span className="bg-yellow-600 text-white px-2 py-1 rounded text-xs">Negotiable</span>
                            </div>
                          </div>
                        </div>
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-red-600"></div>
                      </div>
                    )}
                  </span>
                  {' '}to use, reproduce, modify, adapt, publish, translate, create derivative works from, distribute, and display any content you submit.
                </p>
              </div>

              {/* AI Analysis Summary */}
              <div className="bg-gray-50 border-2 border-gray-200 p-8 rounded-2xl">
                <div className="flex items-start gap-6">
                  <div className="bg-black text-white p-4 rounded-2xl shadow-lg">
                    <Zap className="w-8 h-8" />
                  </div>
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-baskerville font-bold text-black text-2xl">AI Analysis Summary</h4>
                      <div className="text-sm text-gray-700 font-medium font-inter">Processing time: 2.3s</div>
                    </div>
                    <p className="text-gray-800 text-lg leading-relaxed font-inter">
                      Found 3 key clauses: 2 standard terms requiring standard consent, 1 high-risk clause that may need negotiation.
                      <strong className="block mt-2">Recommendation: Review data sharing practices and consider limiting content uploads.</strong>
                    </p>
                    <div className="flex gap-3 pt-2">
                      <span className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm font-semibold border border-green-200 font-inter">2 Standard Terms</span>
                      <span className="bg-red-100 text-red-800 px-4 py-2 rounded-lg text-sm font-semibold border border-red-200 font-inter">1 High Risk</span>
                      <span className="bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold font-inter">AI Confidence: 98%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-6xl font-baskerville font-black text-black leading-tight">
              Professional-grade legal analysis
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto font-medium font-inter">
              Powered by advanced AI to protect consumers from unfair terms and hidden clauses.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group space-y-4 p-8 bg-gray-50 border-2 border-gray-200 rounded-2xl hover:shadow-2xl hover:border-black transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="text-black group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-baskerville font-bold text-black">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-base font-inter">
                    {feature.description}
                  </p>
                  <div className="text-sm font-semibold text-black bg-gray-100 px-3 py-1 rounded-full inline-block font-inter">
                    {feature.highlight}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-24 bg-black">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center text-white">
          <h2 className="text-4xl md:text-6xl font-baskerville font-black leading-tight mb-8">
            Ready to understand what you&apos;re agreeing to?
          </h2>
          <p className="text-xl md:text-2xl mb-12 font-medium max-w-4xl mx-auto font-inter">
            Join thousands who now read legal documents with confidence and clarity.
          </p>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button className="bg-white text-black px-10 py-5 text-xl font-bold rounded-2xl hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 font-inter">
                Install Extension
              </button>
              <button className="bg-transparent border-2 border-white text-white px-10 py-5 text-xl font-bold rounded-2xl hover:bg-white/10 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 font-inter">
                Request Demo
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center text-lg font-inter">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6" />
                <span>Compatible with Chrome, Firefox, and Edge</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6" />
                <span>Free to start • No credit card required</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-black text-white py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="text-5xl font-baskerville font-bold mb-4 text-white">
              LegalEase
            </div>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto font-inter">
              Making legal documents transparent and understandable for everyone through AI-powered analysis.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="text-center space-y-4">
              <h4 className="text-lg font-baskerville font-bold text-white">Platform</h4>
              <div className="space-y-2 text-base text-gray-300 font-inter">
                <a href="#" className="block hover:text-white transition-colors duration-200">Browser Extension</a>
                <a href="#" className="block hover:text-white transition-colors duration-200">Developer API</a>
                <a href="#" className="block hover:text-white transition-colors duration-200">Integrations</a>
              </div>
            </div>
            <div className="text-center space-y-4">
              <h4 className="text-lg font-baskerville font-bold text-white">Solutions</h4>
              <div className="space-y-2 text-base text-gray-300 font-inter">
                <a href="#" className="block hover:text-white transition-colors duration-200">For Consumers</a>
                <a href="#" className="block hover:text-white transition-colors duration-200">For Businesses</a>
                <a href="#" className="block hover:text-white transition-colors duration-200">Enterprise</a>
              </div>
            </div>
            <div className="text-center space-y-4">
              <h4 className="text-lg font-baskerville font-bold text-white">Company</h4>
              <div className="space-y-2 text-base text-gray-300 font-inter">
                <a href="#" className="block hover:text-white transition-colors duration-200">About Us</a>
                <a href="#" className="block hover:text-white transition-colors duration-200">Privacy Policy</a>
                <a href="#" className="block hover:text-white transition-colors duration-200">Terms of Service</a>
                <a href="#" className="block hover:text-white transition-colors duration-200">Contact</a>
              </div>
            </div>
            <div className="text-center space-y-4">
              <h4 className="text-lg font-baskerville font-bold text-white">Security</h4>
              <div className="space-y-2 text-base text-gray-300 font-inter">
                <div className="flex items-center justify-center gap-2">
                  <Award className="w-4 h-4 text-white" />
                  <span>GDPR Compliant</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4 text-white" />
                  <span>Bank-level Security</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Users className="w-4 h-4 text-white" />
                  <span>50,000+ Users</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center pt-8 border-t border-gray-700">
            <p className="text-base text-gray-400 font-inter">
              © 2025 LegalEase. All rights reserved. • Empowering consumers through AI-powered legal transparency.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LegalEaseLanding;