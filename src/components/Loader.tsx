import { motion } from "motion/react";
import { useEffect, useState } from "react";

export default function Loader({ onComplete }: { onComplete: () => void }) {
  const [status, setStatus] = useState("Decrypting linguistic patterns...");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const statuses = [
      "Initializing intelligence protocols...",
      "Decrypting linguistic patterns...",
      "Cross-referencing historical data...",
      "Verifying source metadata...",
      "Establishing secure connection..."
    ];
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i < statuses.length) {
        setStatus(statuses[i]);
      }
    }, 1200);

    const timer = setTimeout(onComplete, 6000);
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onComplete]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + 1, 100));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-surface-container-lowest flex flex-col items-center justify-center text-center overflow-hidden"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />
      
      {/* Scanning Line */}
      <motion.div 
        animate={{ top: ["-10%", "110%"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent z-[101] pointer-events-none"
      />

      {/* Decorative Data Streams */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden font-mono text-[8px] flex justify-around">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: -100 }}
            animate={{ y: [null, 1000] }}
            transition={{ duration: 15 + i * 2, repeat: Infinity, ease: "linear", delay: i * 0.8 }}
            className="flex flex-col gap-2"
          >
            {[...Array(40)].map((_, j) => (
              <span key={j}>{Math.random().toString(36).substring(2, 8).toUpperCase()}</span>
            ))}
          </motion.div>
        ))}
      </div>

      <div className="relative w-48 h-48 mb-12 flex items-center justify-center">
        {/* Outer Ring */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border border-white/5 shadow-[0_0_40px_rgba(255,255,255,0.05)]" 
          aria-hidden="true"
        />
        
        {/* Animated Rings */}
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute inset-4 rounded-full border-t-2 border-white/10" 
          aria-hidden="true"
        />
        <motion.div 
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-10 rounded-full border border-white/20" 
          aria-hidden="true"
        />
        <motion.div 
          animate={{ scale: [1, 0.9, 1], opacity: [0.1, 0.4, 0.1] }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
          className="absolute inset-14 rounded-full border border-blue-500/10" 
          aria-hidden="true"
        />

        <div className="w-16 h-16 rounded-full glass-card flex items-center justify-center">
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,1)]" 
          />
        </div>
      </div>

      <div className="text-center space-y-4 relative z-10">
        <h2 className="text-headline-lg text-white font-thin tracking-[0.3em] uppercase">alitheia</h2>
        <div className="h-6 flex items-center justify-center">
          <motion.p 
            key={status}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white/50 font-light"
          >
            {status}
          </motion.p>
        </div>
        
        <div className="w-64 h-[1px] bg-white/10 relative overflow-hidden mt-8" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="System loading progress">
          <motion.div 
            initial={{ left: "-100%" }}
            animate={{ left: "100%" }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 bottom-0 w-1/2 bg-white/40 shadow-[0_0_20px_rgba(255,255,255,0.5)]"
          />
          <motion.div 
            style={{ width: `${progress}%` }}
            className="absolute top-0 bottom-0 bg-white/20 h-full transition-all duration-300"
          />
        </div>
        
        <p className="text-label-caps text-white/30 text-[10px] mt-2">Intelligence protocol v2.4.9</p>
      </div>
    </motion.div>
  );
}
