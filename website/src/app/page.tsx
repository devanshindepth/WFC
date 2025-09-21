"use client";
import StickyFeaturesSection from "@/components/sticky-features-section";
import ChatSection from "../components/chat-section";
import FocusSection from "../components/focus-section";
import HeroSection from "../components/hero-section";
import ReadSection from "../components/read-section";
import Navbar from "@/components/navbar";

const LawlensLanding = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Moved to sticky features section */}
      {/* <section className="min-h-screen flex items-center relative overflow-hidden pt-20">
        <Navbar />
        <div className="max-w-6xl mx-auto px-6 lg:px-8 text-center relative">
          <div className={`mb-10 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-block bg-white border border-gray-200 px-8 md:px-12 py-6 md:py-8 mb-8 shadow-lg rounded-3xl backdrop-blur-sm">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-baskerville font-black text-gray-900 leading-tight">
                Decode Legal Documents
                <span className="block text-gray-700">with AI Precision</span>
              </h1>
            </div>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-inter">
              Transform complex legal language into clear, actionable insights with our intelligent AI-powered analysis platform.
            </p>
          </div>

          <div className={`space-y-6 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="cta bg-gray-800 text-white border border-gray-300 px-8 py-4 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 font-inter group flex items-center justify-center gap-3">
                Install Extension
                <ArrowRight className="w-5 h-5 transform rotate-315 group-hover:rotate-360 transition-transform duration-300 ease-in-out" />
              </button>
              <button className="cta cta-dark bg-white border border-gray-300 text-gray-900 px-8 py-4 text-lg font-semibold rounded-2xl  shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 font-inter">
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </section> */}
      <Navbar />
      <StickyFeaturesSection>
        <HeroSection />
        <ChatSection />
        <ReadSection />
        <FocusSection />
      </StickyFeaturesSection>

      {/* Analysis Section - Commented out */}
      {/* <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-baskerville font-bold text-gray-900 mb-6">
              See AI Analysis in Action
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-inter leading-loose">
              Experience how Lawlens transforms complex legal jargon into clear, actionable insights
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 flex items-center gap-3 border-b border-gray-200">
              <div className="flex gap-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              </div>
              <div className="flex-1 bg-white rounded-lg px-4 py-2 text-gray-600 text-sm border border-gray-200 font-inter">
                https://streaming-service.com/terms-of-service
              </div>
              <div className="text-gray-500 text-sm font-medium font-inter">AI Analysis Active</div>
            </div>

            <div className="p-8 md:p-12 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-3xl font-baskerville font-bold text-gray-900">Terms of Service</h3>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-semibold border border-green-200">
                  <CheckCircle className="w-4 h-4" />
                  AI Analysis Complete
                </div>
              </div>

              <div className="space-y-6 text-gray-700 leading-loose font-inter text-lg">
                <div>
                  By using our service, you acknowledge that we may collect and process your{' '}
                  <span
                    className="bg-blue-50  border-b-2 border-blue-200 px-2 py-1 rounded cursor-pointer relative group transition-all duration-200 hover:bg-blue-100"
                    onMouseEnter={() => setHighlightedText(1)}
                    onMouseLeave={() => setHighlightedText(null)}
                  >
                    personal data and usage patterns
                    {highlightedText === 1 && (
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-3 bg-gray-900 text-white p-6 rounded-xl text-sm w-80 z-20 shadow-2xl">
                        <div className="flex items-start gap-3">
                          <div className="bg-blue-600 p-2 rounded-lg">
                            <MessageSquare className="w-4 h-4 text-gray-900" />
                          </div>
                          <div>
                            <strong className="text-blue-200">AI Summary:</strong>
                            <p className="mt-2">They track your activity and collect personal information for business purposes like analytics and marketing.</p>
                            <div className="mt-3 flex gap-2">
                              <span className="bg-green-600 text-gray-900 px-2 py-1 rounded text-xs">Standard Practice</span>
                              <span className="bg-blue-600 text-gray-900 px-2 py-1 rounded text-xs">GDPR Compliant</span>
                            </div>
                          </div>
                        </div>
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                      </div>
                    )}
                  </span>
                  {' '}for various business purposes including but not limited to analytics, marketing, and{' '}
                  <span
                    className="bg-yellow-50 border-b-2 border-yellow-200 px-2 py-1 rounded cursor-pointer relative group transition-all duration-200 hover:bg-yellow-100"
                    onMouseEnter={() => setHighlightedText(2)}
                    onMouseLeave={() => setHighlightedText(null)}
                  >
                    third-party integrations
                    {highlightedText === 2 && (
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-3 bg-gray-900 text-white p-6 rounded-xl text-sm w-80 z-20 shadow-2xl">
                        <div className="flex items-start gap-3">
                          <div className="bg-yellow-600 p-2 rounded-lg">
                            <Shield className="w-4 h-4 text-gray-900" />
                          </div>
                          <div>
                            <strong className="text-yellow-200">Risk Assessment:</strong>
                            <div className="mt-2">Your data may be shared with partner companies. Consider reviewing their privacy practices.</div>
                            <div className="mt-3 flex gap-2">
                              <span className="bg-yellow-600 text-gray-900 px-2 py-1 rounded text-xs">Medium Risk</span>
                              <span className="bg-gray-600 text-gray-900 px-2 py-1 rounded text-xs">Requires Consent</span>
                            </div>
                          </div>
                        </div>
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                      </div>
                    )}
                  </span>
                  .
                </div>

                <div>
                  You hereby grant us an{' '}
                  <span
                    className="bg-red-50 border-b-2 border-red-200 px-2 py-1 rounded cursor-pointer relative group transition-all duration-200 hover:bg-red-100"
                    onMouseEnter={() => setHighlightedText(3)}
                    onMouseLeave={() => setHighlightedText(null)}
                  >
                    irrevocable, worldwide, royalty-free license
                    {highlightedText === 3 && (
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-3 bg-gray-900 text-white p-6 rounded-xl text-sm w-80 z-20 shadow-2xl">
                        <div className="flex items-start gap-3">
                          <div className="bg-red-600 p-2 rounded-lg">
                            <Shield className="w-4 h-4 text-gray-900" />
                          </div>
                          <div>
                            <strong className="text-red-200">⚠️ High Risk Alert:</strong>
                            <p className="mt-2">This grants permanent global rights to use your content without compensation. Consider negotiating or seeking alternatives.</p>
                            <div className="mt-3 flex gap-2">
                              <span className="bg-red-600 text-gray-900 px-2 py-1 rounded text-xs">High Risk</span>
                              <span className="bg-orange-600 text-gray-900 px-2 py-1 rounded text-xs">Negotiable</span>
                            </div>
                          </div>
                        </div>
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                      </div>
                    )}
                  </span>
                  {' '}to use, reproduce, modify, adapt, publish, translate, create derivative works from, distribute, and display any content you submit.
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl">
                <div className="flex items-start gap-4">
                  <div className="bg-black text-white p-3 rounded-xl shadow-lg">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-baskerville font-bold text-gray-900 text-xl">AI Analysis Summary</h4>
                      <div className="text-sm text-gray-600 font-medium font-inter">Processing time: 2.3s</div>
                    </div>
                    <p className="text-gray-700 text-base leading-loose font-inter">
                      Found 3 key clauses: 2 standard terms requiring standard consent, 1 high-risk clause that may need negotiation.
                      <strong className="block mt-2">Recommendation: Review data sharing practices and consider limiting content uploads.</strong>
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold border border-green-200 font-inter">2 Standard Terms</span>
                      <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold border border-red-200 font-inter">1 High Risk</span>
                      <span className="bg-black text-white px-3 py-1 rounded-full text-sm font-semibold font-inter">AI Confidence: 98%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section> */}

      {/* Enhanced Footer */}
      {/* <footer id="footer" className="bg-white text-gray-900 py-16 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="text-5xl font-baskerville font-bold mb-4 text-gray-900">
              Lawlens
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-inter">
              Making legal documents transparent and understandable for everyone through AI-powered analysis.
            </p>
          </div>

          <div className="text-center border-gray-800">
            <p className="text-base text-gray-500 font-inter">
              © 2025 Lawlens. All rights reserved. • Empowering consumers through AI-powered legal transparency.
            </p>
          </div>
        </div>
      </footer> */}
    </div>
  );
};

export default LawlensLanding;
