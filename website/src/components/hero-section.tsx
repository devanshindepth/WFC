"use client"
import { ArrowRight } from "lucide-react"
import { useEffect, useState } from "react"

const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="feature">
      <div className="feature-content">
        <div className="w-full max-w-none">
          <section className="bg-white relative overflow-hidden w-full">
            <div className="w-full px-6 lg:px-8 rounded-full">
              <div className="grid grid-cols-1 lg:grid-cols-2 w-full gap-8 lg:gap-16 items-center min-h-0">
                {/* Left Content */}
                <div className="space-y-6">
                  <div
                    className={`mb-10 transition-all duration-1000 delay-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                  >
                    <div className="inline-block bg-white border border-gray-200 px-8 md:px-12 py-6 md:py-8 mb-8 shadow-lg rounded-3xl backdrop-blur-sm">
                      <h1 className="text-4xl md:text-5xl lg:text-6xl font-baskerville font-black text-gray-900 leading-tight">
                        Decode Legal Documents
                        <span className="block text-gray-700">with AI Precision</span>
                      </h1>
                    </div>
                    <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-inter">
                      Transform complex legal language into clear, actionable insights with our intelligent AI-powered
                      analysis platform.
                    </p>
                  </div>

                  <div
                    className={`space-y-6 transition-all duration-1000 delay-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                  >
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <button className="cta bg-gray-800 text-white border border-gray-300 px-8 py-4 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 font-inter group flex items-center justify-center gap-3">
                        Install Extension
                        <ArrowRight className="w-5 h-5 transform rotate-315 group-hover:rotate-360 transition-transform duration-300 ease-in-out" />
                      </button>
                      {/* <button className="cta cta-dark bg-white border border-gray-300 text-gray-900 px-8 py-4 text-lg font-semibold rounded-2xl  shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 font-inter">
                        Watch Demo
                      </button> */}
                    </div>
                  </div>
                </div>

                {/* Right Content - YouTube Video with Right-to-Left Fade Animation */}
                <div
                  className={`relative w-full transition-all duration-1000 delay-750 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}
                >
                  <div className="relative bg-gray-50 rounded-2xl p-6 lg:p-8 shadow-xl border border-gray-200">
                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden">
                      <iframe
                        className="absolute inset-0 w-full h-full"
                        src="https://www.youtube.com/embed/TJ-skJGONnE?si=JEgdLt4kRdck3fRY"
                        title="Demo Video"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default HeroSection
