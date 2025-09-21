import Image from 'next/image';

const FocusSection = () => (
  <div id="focus" className="feature">
    <div className="feature-content">
      <div className="w-full max-w-none">
        <section className="bg-white relative overflow-hidden w-full">
          <div className="w-full px-6 lg:px-8 rounded-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 w-full gap-8 lg:gap-16 items-center min-h-0">

              {/* Left Content */}
              <div className="space-y-6">
                <div className="space-y-4">
                  {/* <div className="inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full border border-gray-200">
                    <div className="w-2 h-2 bg-gray-800 rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold text-gray-800 font-inter">AI-Powered Focus</span>
                  </div> */}

                  <h2 className="text-3xl lg:text-4xl xl:text-5xl font-baskerville font-bold text-gray-900 leading-tight" style={{
                    color: '#4a5568',
                  }}>
                    Focus on What Really Matters
                  </h2>

                  <p className="text-lg lg:text-xl text-gray-600 leading-relaxed font-inter">
                    Our AI cuts through legal complexity to highlight critical clauses, potential risks, and actionable insights.
                  </p>
                </div>

                {/* Feature Cards - Horizontal Layout */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 lg:p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gray-900 rounded-xl flex items-center justify-center mb-3">
                      <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="font-baskerville font-bold text-gray-900 mb-2 text-base lg:text-lg">Risk Assessment</h3>
                    <p className="text-gray-600 font-inter text-sm">Identify high-risk clauses instantly.</p>
                  </div>

                  <div className="bg-gray-50 p-4 lg:p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gray-900 rounded-xl flex items-center justify-center mb-3">
                      <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="font-baskerville font-bold text-gray-900 mb-2 text-base lg:text-lg">Instant Analysis</h3>
                    <p className="text-gray-600 font-inter text-sm">Get insights in seconds, not hours.</p>
                  </div>
                </div>
              </div>

              {/* Right Content - Image */}
              <div className="relative w-full">
                <div className="relative bg-gray-50 rounded-2xl p-6 lg:p-8 shadow-xl border border-gray-200">
                  <Image
                    src="/focus.png"
                    alt="AI Focus Analysis"
                    width={800}
                    height={600}
                    className="w-full h-48 lg:h-64 xl:h-72 object-cover rounded-2xl shadow-md"
                  />
                  <div className="absolute -bottom-3 -right-3 lg:-bottom-4 lg:-right-4 bg-gray-900 text-white px-4 py-2 lg:px-6 lg:py-3 rounded-xl shadow-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span className="text-xs lg:text-sm font-semibold font-inter">AI Analysis Active</span>
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

export default FocusSection;