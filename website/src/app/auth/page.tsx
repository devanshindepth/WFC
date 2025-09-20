"use client"
import { useState } from "react";
import { signIn } from "@/lib/auth-client";

export default function SignIn() {
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/"
      });
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, black 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        }}></div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-2xl shadow-lg mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-baskerville font-bold text-black mb-2 tracking-tight">
            Welcome
          </h1>
          <p className="text-gray-600 text-lg font-inter">
            Sign in to access your account
          </p>
        </div>

        {/* Sign In Form */}
        <div className="bg-white rounded-3xl  border border-gray-200 p-8 relative overflow-hidden">
          {/* Subtle inner shadow */}
          <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-gray-50 opacity-50 rounded-3xl"></div>

          <div className="relative z-10">
            {/* Divider */}
            <div className="flex items-center mb-8">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="px-4 text-sm text-gray-500 font-medium font-inter">Continue with</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            {/* Google Sign In Button */}
            <button
              type="button"
              disabled={loading}
              onClick={handleSignIn}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className={`
                cta cta-dark w-full group relative bg-white border border-gray-300 text-black px-8 py-4 text-lg font-semibold rounded-2xl
                shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform
                ${loading ? 'opacity-75 cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2'}
                ${isHovered ? 'shadow-xl' : 'shadow-lg'}
              `}
            >
              <div className="flex items-center justify-center gap-4">
                {/* Google Icon */}
                <div className={`
                  w-6 h-6 transition-transform duration-300
                `}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 262">
                    <path fill="#4285F4" d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"></path>
                    <path fill="#34A853" d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"></path>
                    <path fill="#FBBC05" d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"></path>
                    <path fill="#EB4335" d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"></path>
                  </svg>
                </div>

                <span className="text-base">
                  {loading ? 'Signing in...' : 'Sign in with Google'}
                </span>

                {/* Loading spinner */}
                {loading && (
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
                )}
              </div>

              {/* Hover effect overlay */}
              <div className={`
                absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0
                transition-opacity duration-300 rounded-2xl
                ${isHovered ? 'opacity-20' : ''}
              `}></div>
            </button>

            {/* Additional Options */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                By signing in, you agree to our{' '}
                <a href="#" className="text-black hover:text-gray-700 underline transition-colors duration-200">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-black hover:text-gray-700 underline transition-colors duration-200">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm font-inter">
            Secure authentication powered by modern standards
          </p>
        </div>
      </div>
    </div>
  );
}