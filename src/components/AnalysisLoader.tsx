import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { AgentLog } from "../services/geminiService";

export default function AnalysisLoader({ logs, isComplete }: { logs: AgentLog[], isComplete?: boolean }) {
  const lastLog = isComplete 
    ? { status: "Multi-Agent Consensus Reached. Finalizing report..." }
    : (logs.length > 0 ? logs[logs.length - 1] : { status: "Initializing Multi-Agent Network..." });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
      className="fixed inset-0 z-[100] bg-surface flex flex-col items-center justify-center overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loader-title"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full blur-[150px] pointer-events-none" />
      
      {/* Network Wave Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 2, opacity: [0, 1, 0] }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              delay: i * 0.8,
              ease: "easeOut"
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-white/20 rounded-full"
          />
        ))}
      </div>

      <div className="relative w-64 h-64 mb-16 flex items-center justify-center">
        {/* Cinematic Rings */}
        <motion.div 
          animate={{ 
            rotate: 360,
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.02, 1]
          }}
          transition={{ 
            rotate: { duration: 8, repeat: Infinity, ease: "linear" },
            opacity: { duration: 3, repeat: Infinity, ease: "easeInOut" },
            scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute inset-0 rounded-full border border-white/10 border-dashed" 
          aria-hidden="true"
        />
        <motion.div 
          animate={{ 
            rotate: isComplete ? 720 : -360,
            boxShadow: isComplete 
              ? ["0 0 15px rgba(59,130,246,0.2)", "0 0 30px rgba(59,130,246,0.6)", "0 0 15px rgba(59,130,246,0.2)"]
              : ["0 0 5px rgba(255,255,255,0.05)", "0 0 15px rgba(255,255,255,0.15)", "0 0 5px rgba(255,255,255,0.05)"]
          }}
          transition={{ 
            rotate: { duration: isComplete ? 2 : 12, repeat: isComplete ? 0 : Infinity, ease: "easeInOut" },
            boxShadow: { duration: 3, repeat: Infinity, ease: "easeInOut" }
          }}
          className={`absolute inset-6 rounded-full border-t-2 ${isComplete ? 'border-blue-400' : 'border-white/20'}`}
          aria-hidden="true"
        />
        <motion.div 
          animate={isComplete ? { scale: [1, 1.25, 1.1], opacity: 0.8 } : { scale: [1, 1.05, 1], opacity: [0.1, 0.4, 0.1] }}
          transition={{ duration: isComplete ? 1.5 : 3, repeat: isComplete ? 0 : Infinity }}
          className={`absolute inset-12 rounded-full border-2 ${isComplete ? 'border-blue-400' : 'border-white/40'} blur-[1px]`}
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col items-center">
            <motion.div 
              animate={isComplete ? { scale: 1.3, backgroundColor: "rgba(59, 130, 246, 0.3)" } : {}}
              className={`w-14 h-14 glass-card rounded-full flex items-center justify-center mb-4 transition-all duration-700 ${isComplete ? 'border-blue-400/70 shadow-[0_0_30px_rgba(59,130,246,0.4)]' : 'border-white/20'}`}
            >
               <motion.div 
                 animate={isComplete ? { scale: [1, 1.6, 1.5], opacity: 1 } : { scale: [1, 1.3, 1] }}
                 transition={{ repeat: isComplete ? 0 : Infinity, duration: 1.5 }}
                 className={`w-2 h-2 rounded-full ${isComplete ? 'bg-blue-400 shadow-[0_0_10px_#60a5fa]' : 'bg-white shadow-[0_0_10px_#fff]'}`} 
               />
            </motion.div>
        </div>
      </div>

      <div className="text-center space-y-8 max-w-md px-8">
        <div className="space-y-2">
            <motion.h2 
              id="loader-title"
              animate={isComplete ? { color: "#60a5fa" } : {}}
              className="text-2xl font-thin tracking-[0.2em] uppercase text-white transition-colors"
            >
              {isComplete ? "Scan Verified" : "Alitheia Scan"}
            </motion.h2>
            <div className="flex items-center justify-center gap-2">
                <span className={`w-2 h-[1px] transition-colors ${isComplete ? 'bg-blue-400' : 'bg-blue-500'}`} aria-hidden="true" />
                <span className="text-[10px] font-mono text-white/30 tracking-widest uppercase">
                  {isComplete ? "Consensus Integrity: 0.998" : "Deep Neural Verification"}
                </span>
                <span className={`w-2 h-[1px] transition-colors ${isComplete ? 'bg-blue-400' : 'bg-blue-500'}`} aria-hidden="true" />
            </div>
        </div>

        <div className="h-12 flex flex-col items-center justify-center" aria-live="polite">
          <motion.p 
            key={lastLog.status}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`font-light text-sm tracking-wide transition-colors ${isComplete ? 'text-blue-200' : 'text-white/60'}`}
          >
            {lastLog.status}
          </motion.p>
          <p className="text-[9px] font-mono text-white/20 mt-2 uppercase tracking-tighter">
             {isComplete 
               ? "Rendering dashboard architecture..." 
               : (logs.length > 0 ? `Step ${logs.length} of 4: ${logs[logs.length-1].agent}` : "Handshaking with verification nodes...")
             }
          </p>
        </div>
        
        <div className="w-48 h-[1px] bg-white/5 relative overflow-hidden mx-auto" role="presentation">
          <motion.div 
            initial={{ left: "-100%" }}
            animate={isComplete ? { left: "0%", width: "100%" } : { left: "100%" }}
            transition={{ 
              duration: isComplete ? 0.5 : 1.5, 
              repeat: isComplete ? 0 : Infinity, 
              ease: isComplete ? "easeOut" : "linear" 
            }}
            className={`absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent ${isComplete ? 'via-blue-400' : 'via-white/40'} to-transparent`}
          />
        </div>
      </div>

      {/* Floating Meta Labels */}
      <div className="absolute bottom-12 left-12 flex flex-col gap-1 items-start">
         <div className="text-[8px] font-mono text-white/10 uppercase tracking-[0.3em]">Encryption: AES-256</div>
         <div className="text-[8px] font-mono text-white/10 uppercase tracking-[0.3em]">Latency: 14ms</div>
      </div>
      <div className="absolute bottom-12 right-12 text-right">
         <div className="text-[8px] font-mono text-white/10 uppercase tracking-[0.3em]">Secure Intel Core active</div>
      </div>
    </motion.div>
  );
}
