import React, { useState, useEffect, Suspense, memo, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { motion, useScroll, useTransform, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  MapPin, Info, Home, ChevronDown, Shield,
  Users, BookOpen, Bell,
} from 'lucide-react';
import { Earth } from './components/Earth';
import { Menu, X } from 'lucide-react';
import backgroundImage from './assets/Home-bg.jpg';
import sec1 from './assets/home-sec1.jpg';
import sec11 from './assets/home-sec-1.jpg';
import sec12 from './assets/home-sec-2.jpg';
import safe1 from './assets/safe1.jpg';
import safe2 from './assets/safe2.jpeg';
import './App.css';
import vid from './assets/vid/Safety-vid.mp4';
import { Link } from 'react-router-dom';

// Memoized NavLink Component
const NavLink = memo(({ icon, text, to }) => (
  <motion.div
    className="flex items-center space-x-2 text-gray-700 hover:text-rose-500 transition-all duration-300 px-4 py-2 rounded-full hover:bg-rose-50 w-full"
    whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
    whileTap={{ scale: 0.95 }}
    style={{ willChange: 'transform' }}
  >
    <Link to={to} className="flex items-center space-x-2 w-full">
      {icon}
      <span className="font-medium text-base">{text}</span>
    </Link>
  </motion.div>
));

// Memoized FeatureCard Component
const FeatureCard = memo(({ icon, title, description }) => {
  const [ref, inView] = useInView({ threshold: 0.2, triggerOnce: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="bg-white p-6 rounded-2xl shadow-md hover:scale-105 transition-transform duration-300 border border-rose-100 w-full max-w-xs"
      style={{ willChange: 'transform, opacity' }}
    >
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="p-4 bg-rose-50 rounded-full">{icon}</div>
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        <p className="text-base text-gray-600">{description}</p>
      </div>
    </motion.div>
  );
});

function App() {
  const [percentage, setPercentage] = useState(0);
  const controls = useAnimation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hideNav, setHideNav] = useState(false);
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 100], [1, 0]);

  const [safetyRef, safetyInView] = useInView({ threshold: 0.2 });

  useEffect(() => {
    setHideNav(safetyInView);
  }, [safetyInView]);

  const handleScroll = useCallback(() => {
    const scrolled = window.scrollY > 50;
    if (scrolled !== isScrolled) setIsScrolled(scrolled);
  }, [isScrolled]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const easeOutQuad = (t) => t * (2 - t);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const section = document.getElementById("safety-section");
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          controls.start({ scale: 1, opacity: 1 });

          let start = 0;
          let end = 68;
          let duration = 1000;
          let startTime = null;

          const animateCount = (timestamp) => {
            if (!startTime) startTime = timestamp;
            let progress = (timestamp - startTime) / duration;
            if (progress > 1) progress = 1;
            let easedProgress = easeOutQuad(progress);
            setPercentage(Math.floor(start + (end - start) * easedProgress));
            if (progress < 1) requestAnimationFrame(animateCount);
          };

          requestAnimationFrame(animateCount);
          setHasAnimated(true);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(section);
    return () => observer.unobserve(section);
  }, [controls, hasAnimated]);

  return (
    <div>
      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          isScrolled ? 'bg-white/90 shadow-lg' : 'bg-transparent'
        } ${hideNav ? 'opacity-0 pointer-events-none' : 'opacity-100'} md:h-20`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12 md:h-20">
            <motion.div
              className="flex items-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Shield className="h-6 w-6 md:h-10 md:w-10 text-rose-500" />
              <span className="ml-2 text-lg md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-500 to-pink-500">
                SafeGuardian
              </span>
            </motion.div>

            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-1 rounded-md text-rose-500 hover:text-rose-600 focus:outline-none"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              <NavLink icon={<Home className="h-5 w-5" />} text="Home" to="/" />
              <NavLink icon={<MapPin className="h-5 w-5" />} text="Location" to="/detectlocation" />
              <NavLink icon={<Bell className="h-5 w-5" />} text="Alerts" to="/alert" />
              <NavLink icon={<Info className="h-5 w-5" />} text="About" to="/about" />
            </div>
          </div>

          <motion.div
            className={`md:hidden w-full bg-white/95 shadow-lg overflow-hidden ${
              isMobileMenuOpen ? 'max-h-64' : 'max-h-0'
            }`}
            initial={false}
            animate={{ maxHeight: isMobileMenuOpen ? '16rem' : '0rem' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="px-4 py-2 space-y-2">
              <NavLink icon={<Home className="h-5 w-5" />} text="Home" to="/" />
              <NavLink icon={<MapPin className="h-5 w-5" />} text="Location" to="/detectlocation" />
              <NavLink icon={<Bell className="h-5 w-5" />} text="Alerts" to="/alert" />
              <NavLink icon={<Info className="h-5 w-5" />} text="About" to="/about" />
            </div>
          </motion.div>
        </div>
      </nav>

      {/* Welcome Section */}
      <section
        className="min-h-screen pt-16 md:pt-20 relative overflow-hidden"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          width: '100%'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/90 to-white/50" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-5rem)] w-full">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col justify-center space-y-6 px-2 sm:px-0 w-full"
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Your Safety is Our{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500">
                  Priority
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-700 leading-relaxed">
                Empowering women with real-time safety solutions and community support.
              </p>
              <motion.button
                className="w-fit bg-gradient-to-r from-rose-500 to-pink-500 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-full font-semibold text-base sm:text-lg shadow-md hover:shadow-lg transition-transform duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started Now
              </motion.button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-full h-[250px] sm:h-[350px] md:h-[450px]"
            >
              <Canvas 
                camera={{ position: [0, 0, 3], fov: 60 }} 
                gl={{ antialias: true }} 
                performance={{ min: 0.5 }}
                className="w-full h-full"
              >
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <Suspense fallback={null}>
                  <Earth />
                  <OrbitControls 
                    enableZoom={false} 
                    enablePan={false} 
                    autoRotate 
                    autoRotateSpeed={0.5} 
                  />
                </Suspense>
              </Canvas>
            </motion.div>
          </div>
        </div>
        <motion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2" 
          style={{ opacity }}
        >
          <ChevronDown className="w-8 h-8 sm:w-10 sm:h-10 text-rose-500 animate-bounce" />
        </motion.div>
      </section>

      {/* Simplified Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="hidden lg:flex flex-col items-center space-y-6"
          >
            <img src={safe1} alt="Cross pattern 1" className="w-48 h-48 object-cover rounded-xl shadow-md transform rotate-45 border-2 border-black" />
            <img src={safe2} alt="Cross pattern 2" className="w-48 h-48 object-cover rounded-xl shadow-md transform -rotate-45 border-2 border-black" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center lg:col-span-1"
          >
            <h2 className="text-4xl md:text-5xl font-extrabold text-black mb-6 uppercase font-sans">
              Your Safety First
            </h2>
            <p className="text-xl text-gray-800 font-light leading-relaxed">
              Discover a new standard of protection with our innovative safety solutions.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="space-y-6 flex flex-col items-center lg:items-end"
          >
            <FeatureCard icon={<MapPin className="w-8 h-8 text-black" />} title="Live Tracking" description="Real-time location monitoring" />
            <FeatureCard icon={<Bell className="w-8 h-8 text-black" />} title="Instant Alerts" description="Rapid emergency response" />
            <FeatureCard icon={<Users className="w-8 h-8 text-black" />} title="Community" description="Connected safety network" />
          </motion.div>
        </div>
      </section>

      {/* Simplified Empowerment Section */}
      <section
        className="py-20 relative bg-cover bg-center overflow-hidden"
        style={{ backgroundImage: `url(${sec1})`, minHeight: "100vh" }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-rose-900/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5 tracking-tight">
              Empowering Women, Ensuring Safety
            </h2>
            <p className="text-xl text-gray-100 max-w-3xl mx-auto leading-relaxed">
              Join our initiative to foster a secure, inclusive world for women.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col gap-6">
              <motion.img
                src={sec11}
                alt="Women Empowerment"
                className="w-full h-60 md:h-72 object-cover rounded-2xl shadow-md"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              />
              <motion.img
                src={sec12}
                alt="Women Supporting Each Other"
                className="w-full h-60 md:h-72 object-cover rounded-2xl shadow-md"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
            </div>
            <motion.div
              className="p-8 bg-white/95 shadow-md rounded-3xl"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                Women's Safety & Security
              </h3>
              <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-6">
                Our community offers cutting-edge solutions and supportive networks to empower and protect women.
              </p>
              <button className="px-8 py-3 bg-gradient-to-r from-rose-600 to-purple-600 text-white rounded-lg shadow-md hover:scale-105 transition-transform duration-200">
                Discover More
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Safety Tips Section */}
      <section
        id="safety-section"
        ref={safetyRef}
        className="min-h-screen py-16 sm:py-20 relative overflow-hidden"
      >
        <video autoPlay loop muted className="absolute inset-0 w-full h-full object-cover z-0">
          <source src={vid} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-black/60 z-10" />
        <div className="absolute inset-0 z-20 pointer-events-none">
          <div className="w-full h-full bg-rose-900/40 clip-path-cross-line" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-30">
          <motion.div
            className="text-center mb-12 sm:mb-20"
            initial={{ opacity: 0, y: -50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white drop-shadow-lg"
              style={{ fontFamily: "'Sacramento', cursive", color: '#ffe4e6', textShadow: '3px 3px 6px rgba(0, 0, 0, 0.6)' }}
            >
              Safety Tips
            </h2>
          </motion.div>
          <div className="flex flex-col lg:flex-row justify-end items-center h-[calc(100vh-8rem)] sm:h-[calc(100vh-10rem)]">
            <div className="w-full lg:w-1/2 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
              <div className="flex flex-col items-center gap-6 sm:gap-8 lg:gap-12">
                <motion.div
                  className="w-56 sm:w-64 md:w-80 h-56 sm:h-64 md:h-80 bg-white/20 backdrop-blur-lg border-2 border-rose-300 shadow-2xl transform rotate-45 overflow-hidden"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="absolute inset-0 transform -rotate-45 p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center">
                    <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-rose-600 mb-2 sm:mb-4" />
                    <h3
                      className="text-xl sm:text-2xl md:text-3xl text-black text-center"
                      style={{ fontFamily: "'Great Vibes', cursive'" }}
                    >
                      <span className="inline-block animate-text-reveal">Stay Aware</span>
                    </h3>
                    <p className="text-rose-800 text-sm sm:text-base md:text-lg font-light text-center mt-2 sm:mt-3">
                      Stay vigilant in public spaces, avoid isolated areas, and trust your instincts.
                    </p>
                  </div>
                </motion.div>
                <motion.div
                  className="w-56 sm:w-64 md:w-80 h-56 sm:h-64 md:h-80 bg-white/20 backdrop-blur-lg border-2 border-rose-300 shadow-2xl transform rotate-45 overflow-hidden"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="absolute inset-0 transform -rotate-45 p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center">
                    <Shield className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-rose-600 mb-2 sm:mb-4" />
                    <h3
                      className="text-xl sm:text-2xl md:text-3xl text-black text-center"
                      style={{ fontFamily: "'Great Vibes', cursive'" }}
                    >
                      <span className="inline-block animate-text-reveal">Share Location</span>
                    </h3>
                    <p className="text-rose-800 text-sm sm:text-base md:text-lg font-light text-center mt-2 sm:mt-3">
                      Use apps to share your live location with trusted contacts.
                    </p>
                  </div>
                </motion.div>
              </div>
              <motion.div
                className="text-center lg:ml-8"
                initial={{ scale: 0, opacity: 0 }}
                animate={controls}
                transition={{ duration: 0.8 }}
              >
                <div className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-white drop-shadow-3d">
                  {percentage}%
                </div>
                <p
                  className="text-lg sm:text-xl md:text-2xl text-rose-200 mt-1 sm:mt-2"
                  style={{ fontFamily: "'Sacramento', cursive'" }}
                >
                  Women's Safety Index
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;