import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const { scrollYProgress } = useScroll();

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const lensOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);
  const lensYOffset = useTransform(scrollYProgress, [0.15, 0.3], [0, 800]); // Gravity fall-off
  const blurValue = useTransform(scrollYProgress, [0, 0.2], [12, 0]);
  const contentOpacity = useTransform(scrollYProgress, [0.2, 0.4], [0, 1]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={`relative min-h-[160vh] overflow-hidden bg-surface ${mousePos.y < window.innerHeight && lensOpacity.get() > 0.5 ? 'lg:cursor-none' : ''}`}
      role="banner"
    >
      <h1 className="sr-only">Alitheia - Truth Verification System</h1>
      {/* Background Intelligence Glows */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Background Particles Simulation */}
      <motion.div 
        style={{ y: backgroundY }}
        className="fixed inset-0 z-0 opacity-20 pointer-events-none"
        aria-hidden="true"
      >
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 100 + "%", 
              y: Math.random() * 100 + "%",
              opacity: Math.random() * 0.5 
            }}
            animate={{ 
              y: [null, "-=100px", "-=200px"],
              opacity: [0.1, 0.4, 0.1]
            }}
            transition={{ 
              duration: 5 + Math.random() * 10, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="absolute w-1 h-1 bg-white rounded-full blur-[1px]"
          />
        ))}
      </motion.div>

      <section className="h-screen flex flex-col items-center justify-center relative px-8" aria-labelledby="hero-title">
        {/* Layered Content: Discrete Background (Hidden/Dark) */}
        <motion.div 
          style={{ opacity: 0 }}
          className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-8 max-w-4xl mx-auto pointer-events-none z-0"
          aria-hidden="true"
        >
          <div className="text-display-xl font-thin tracking-tighter">alitheia</div>
        </motion.div>

        {/* Revealed Content Layer (Masked by Circle) */}
        <motion.div 
          style={{ 
            clipPath: `circle(110px at ${mousePos.x}px ${mousePos.y}px)`,
            opacity: lensOpacity
          }}
          className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-8 max-w-4xl mx-auto pointer-events-none z-10"
          aria-hidden="true"
        >
          <div className="text-display-xl font-thin tracking-tighter text-white">alitheia</div>
          <p className="text-headline-md text-white max-w-2xl mx-auto font-light">
            Decrypting linguistic patterns beneath the noise. <br />
            Deep multi-source verification for the digital age.
          </p>
          <div className="flex items-center justify-center gap-4 pt-8">
            <div className="text-label-caps text-blue-400">Protocol active</div>
            <div className="w-12 h-[1px] bg-blue-400" />
            <div className="text-label-caps text-purple-400">V2.4.9 Secure</div>
          </div>
        </motion.div>

        {/* Final Visible Header (Transitioned after scroll) */}
        <motion.div 
          style={{ opacity: contentOpacity }}
          className="flex flex-col items-center justify-center text-center space-y-8 max-w-4xl opacity-0"
        >
          <h2 id="hero-title" className="sr-only">System Overview</h2>
          <p className="text-headline-md text-white/50 max-w-2xl mx-auto font-light">
             Adversarial mapping for high-stakes intelligence.
          </p>
        </motion.div>

        {/* The Detective's Magnifying Glass (HUD Frame) */}
        <motion.div 
          className="fixed pointer-events-none z-50 w-72 h-72 rounded-full border-[1.5px] border-white/30 hidden lg:flex items-center justify-center overflow-visible"
          style={{ 
            left: mousePos.x, 
            top: mousePos.y, 
            translateX: "-50%", 
            translateY: "-50%",
            opacity: lensOpacity,
            y: lensYOffset
          }}
          aria-hidden="true"
        >
          {/* Glass Reflection */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent rounded-full shadow-inner" />
          
          {/* HUD Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-[105%] h-[105%] rounded-full border border-blue-500/20 animate-pulse" />
             <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className="text-[9px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">TRUTH_SCAN_ACTIVE</div>
                <div className="w-[1px] h-4 bg-blue-500/40 mt-1" />
             </div>
             
             {/* Handle Silhouette */}
             <div className="absolute top-[90%] left-[80%] w-2 h-48 bg-gradient-to-b from-white/40 to-transparent rounded-full origin-top rotate-[40deg] opacity-60" />
          </div>

          <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-[1px] rounded-full" />
          
          <div className="text-white text-[9px] font-mono opacity-80 text-center px-12 leading-tight uppercase tracking-widest relative z-20">
             Analyzing <br/>
             Structural integrity <br/>
             Prob: 0.992
          </div>
        </motion.div>
      </section>

      <section className="h-[50vh] flex items-center justify-center relative translate-z-0">
         <div className="text-center">
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="text-label-caps mb-4 tracking-[0.3em] text-white/40"
            >
              SCROLL TO ANALYZE
            </motion.div>
            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-[1px] h-12 bg-gradient-to-b from-white/40 to-transparent mx-auto"
            />
         </div>
      </section>
    </div>
  );
}
