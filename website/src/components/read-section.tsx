import Image from 'next/image';

const ReadSection = () => (
    <div id="read" className="feature">
        <div className="feature-content">
            <div className="w-full max-w-none">
                <section className="bg-white relative overflow-hidden w-full rounded-2xl">
                    <div className="w-full px-6 lg:px-8 rounded-full">
                        <div className="grid grid-cols-1 lg:grid-cols-2 w-full gap-8 lg:gap-16 items-center min-h-0">

                            {/* Left Content */}
                            <div className="space-y-6 order-2 lg:order-1">
                                <div className="space-y-4">
                                    <div className="inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full border border-gray-200">
                                        <div className="w-2 h-2 bg-gray-800 rounded-full animate-pulse"></div>
                                        <span className="text-sm font-semibold text-gray-800 font-inter">Deep Analysis</span>
                                    </div>

                                    <h2 className="text-3xl lg:text-4xl xl:text-5xl font-baskerville font-bold text-gray-900 leading-tight" style={{
                                        color: '#4a5568',
                                    }}>
                                        Read Between the
                                        <span className="block text-gray-900" style={{
                                            color: '#4a5568',
                                        }}>
                                            Legal Lines
                                        </span>
                                    </h2>

                                    <p className="text-lg lg:text-xl text-gray-600 leading-relaxed font-inter">
                                        Our advanced AI doesnt just read legal documents—it understands context, identifies implications, and reveals hidden meanings that could affect your rights.
                                    </p>
                                </div>

                                {/* Feature Cards */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-4 lg:p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                                        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gray-900 rounded-xl flex items-center justify-center mb-3">
                                            <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <h3 className="font-baskerville font-bold text-gray-900 mb-2 text-base lg:text-lg">Context-Aware Analysis</h3>
                                        <p className="text-gray-600 font-inter text-sm">Understands legal context and industry-specific terminology for accurate interpretation.</p>
                                    </div>

                                    <div className="bg-gray-50 p-4 lg:p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                                        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gray-900 rounded-xl flex items-center justify-center mb-3">
                                            <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                        </div>
                                        <h3 className="font-baskerville font-bold text-gray-900 mb-2 text-base lg:text-lg">Legal Precedent Mapping</h3>
                                        <p className="text-gray-600 font-inter text-sm">Connects clauses to relevant case law and legal precedents for comprehensive understanding.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Content - Image */}
                            <div className="relative w-full order-1 lg:order-2">
                                <div className="relative bg-gray-50 rounded-2xl p-6 lg:p-8 shadow-xl border border-gray-200">
                                    <Image
                                        src="/read.png"
                                        alt="Deep Legal Analysis"
                                        width={800}
                                        height={600}
                                        className="w-full h-48 lg:h-64 xl:h-72 object-cover rounded-2xl shadow-md"
                                    />
                                </div>
                            </div>

                        </div>
                    </div>
                </section>
            </div>
        </div>
    </div>
);

export default ReadSection;