"use client"
import { UserCircle, Menu, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navbarRef = useRef(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    // Animate navbar entry
    gsap.fromTo(navbarRef.current,
      { y: -100, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power2.out" }
    );

    // ScrollTrigger to pin navbar for 710vh
    ScrollTrigger.create({
      trigger: "body",
      start: "100vh top",
      end: "700vh top",
      onUpdate: (self) => {
        if (self.progress < 1) {
          // During the trigger range: make it appear sticky
          gsap.set(navbarRef.current, {
            position: "fixed",
            top: "1rem",
            left: "1rem",
            right: "1rem",
            y: 0
          });
        } else {
          // At end trigger: animate navbar upward and out of view
          gsap.to(navbarRef.current, {
            y: -100,
            duration: 0.5,
            ease: "power2.inOut"
          });
        }
      }
    });
  }, []);

  return (
    <nav ref={navbarRef} className="fixed top-4 left-4 right-4 z-50 bg-gray-800/90 backdrop-blur-md rounded-full max-w-7xl mx-auto ">
      <div className="max-w-6xl mx-auto px-6 py-3">
        <div className="flex justify-between items-center">
          {/* Left side - Lawlens title */}
          <div className="text-2xl md:text-3xl font-baskerville font-bold text-white">
            Lawlens
          </div>

          {/* Desktop Menu - Center */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#chat" className="relative text-white hover:text-gray-200 font-inter text-lg font-medium transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-white after:transition-all after:duration-300 hover:after:w-full">
              Chat
            </a>
            <a href="#read" className="relative text-white hover:text-gray-200 font-inter text-lg font-medium transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-white after:transition-all after:duration-300 hover:after:w-full">
              Read
            </a>
            <a href="#focus" className="relative text-white hover:text-gray-200 font-inter text-lg font-medium transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-white after:transition-all after:duration-300 hover:after:w-full">
              Focus
            </a>
          </div>

          {/* Right side - Login Button */}
          <div className="flex items-center space-x-4">
            {/* Desktop Login Button */}
            <a href="/auth" className="cta cta-dark md:flex items-center space-x-2 bg-white text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-inter text-sm font-medium">
              <UserCircle className="w-4 h-4" />
              <span>Login</span>
            </a>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="md:hidden p-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 bg-gray-600 rounded-lg p-4">
            <div className="flex flex-col space-y-4">
              <a href="#chat" className="relative text-white hover:text-gray-200 font-inter text-lg font-medium transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-white after:transition-all after:duration-300 hover:after:w-full">
                Chat
              </a>
              <a href="#read" className="relative text-white hover:text-gray-200 font-inter text-lg font-medium transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-white after:transition-all after:duration-300 hover:after:w-full">
                Read
              </a>
              <a href="#focus" className="relative text-white hover:text-gray-200 font-inter text-lg font-medium transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-white after:transition-all after:duration-300 hover:after:w-full">
                Focus
              </a>
              <a href="#footer" className="relative text-white hover:text-gray-200 font-inter text-lg font-medium transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-white after:transition-all after:duration-300 hover:after:w-full">
                Features
              </a>
              <a href="/auth" className="flex items-center space-x-2 bg-white text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-inter text-sm font-medium w-fit">
                <UserCircle className="w-4 h-4" />
                <span>Login</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
