"use client"
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="feature">
      <div className="feature-content">
        <div className="w-full max-w-none">
          <section className="bg-white relative overflow-hidden w-full">
            <div className="w-full px-6 lg:px-8 rounded-full">
              <div className="grid grid-cols-1 lg:grid-cols-2 w-full gap-8 lg:gap-16 items-center min-h-0">

                {/* Left Content */}
                <div className="space-y-6">
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

                {/* Right Content - Video Demo with Right-to-Left Fade Animation */}
                <div className={`relative w-full transition-all duration-1000 delay-750 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
                  <div className="relative bg-gray-50 rounded-2xl p-6 lg:p-8 shadow-xl border border-gray-200">
                    <div className="w-full h-48 lg:h-64 xl:h-72 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <p className="text-gray-600 font-inter font-medium">AI Legal Analysis Demo</p>
                      </div>
                    </div>
                    <div className="absolute -bottom-3 -right-3 lg:-bottom-4 lg:-right-4 bg-gray-900 text-white px-4 py-2 lg:px-6 lg:py-3 rounded-xl shadow-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span className="text-xs lg:text-sm font-semibold font-inter">Live Demo</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
