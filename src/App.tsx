import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";
import Loader from "./components/Loader";
import Hero from "./components/Hero";
import AnalysisUI from "./components/AnalysisUI";
import Community from "./components/Community";
import Sidebar from "./components/Sidebar";
import AuthModal from "./components/AuthModal";
import { useAuth } from "./hooks/useAuth";
import { LogIn, User as UserIcon } from "lucide-react";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [activeView, setActiveView] = useState<"analysis" | "community">("analysis");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-surface">
      <AnimatePresence>
        {loading ? (
          <Loader key="loader" onComplete={() => setLoading(false)} />
        ) : (
          <motion.div 
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative"
          >
            {/* Sidebar */}
            <Sidebar 
              isOpen={sidebarOpen} 
              onClose={() => setSidebarOpen(false)} 
              user={user}
              onNavigate={(view) => setActiveView(view)}
              activeView={activeView}
              onAuthOpen={() => setIsAuthModalOpen(true)}
            />

            {/* Navigation */}
            <AnimatePresence>
              {!isAnalyzing && (
                <motion.nav 
                  initial={{ y: -100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -100, opacity: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className={`fixed top-0 inset-x-0 z-[60] transition-all duration-500 py-6 px-6 md:px-16 flex justify-between items-center ${scrolled ? 'bg-surface/80 backdrop-blur-3xl border-b border-white/5 py-4' : ''}`}
                >
                  <div className="flex items-center gap-12">
                     <h1 
                      onClick={() => setActiveView("analysis")}
                      className="text-xl font-thin tracking-tighter cursor-pointer hover:opacity-70 transition-opacity"
                     >alitheia</h1>
                     <div className="hidden lg:flex items-center gap-8">
                        <button 
                          onClick={() => setActiveView("analysis")}
                          className={`text-label-caps text-[10px] transition-colors ${activeView === 'analysis' ? 'text-white' : 'text-white/40 hover:text-white'}`}
                        >
                          Intelligence Core
                        </button>
                        <button 
                          onClick={() => setActiveView("community")}
                          className={`text-label-caps text-[10px] transition-colors ${activeView === 'community' ? 'text-white' : 'text-white/40 hover:text-white'}`}
                        >
                          Research Hub
                        </button>
                        {["Methodology", "Global Reports"].map((item) => (
                          <a 
                            key={item} 
                            href="#" 
                            className="text-label-caps text-[10px] text-white/40 hover:text-white transition-colors"
                          >
                            {item}
                          </a>
                        ))}
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    {!user ? (
                      <button 
                        onClick={() => setIsAuthModalOpen(true)}
                        className="px-6 py-2 rounded-xl bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-white/90 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                      >
                         Sign In
                      </button>
                    ) : (
                      <button 
                         onClick={() => setSidebarOpen(true)}
                         className="flex items-center gap-3 group"
                      >
                         <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors cursor-pointer overflow-hidden">
                            {user.avatar ? (
                              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <UserIcon className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                            )}
                         </div>
                         <span className="hidden sm:block text-[10px] text-white/40 font-mono tracking-widest uppercase truncate max-w-[80px]">{user.name}</span>
                      </button>
                    )}
                    
                    <button 
                      onClick={() => setSidebarOpen(true)}
                      className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors cursor-pointer group"
                      aria-label="Toggle Navigation Dashboard"
                    >
                       <Menu className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
                    </button>
                  </div>
                </motion.nav>
              )}
            </AnimatePresence>

            <main>
              <AnimatePresence mode="wait">
                {activeView === "analysis" ? (
                  <motion.div
                    key="analysis"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Hero />
                    <AnalysisUI 
                      onCommunity={() => setActiveView("community")} 
                      onAnalyzingChange={setIsAnalyzing}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="community"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Community onAuthOpen={() => setIsAuthModalOpen(true)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </main>

            <AuthModal 
              isOpen={isAuthModalOpen} 
              onClose={() => setIsAuthModalOpen(false)} 
            />

             <footer className="py-24 md:py-32 border-t border-white/5 px-6 md:px-16 lg:px-24 relative overflow-hidden bg-surface-container-lowest">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[400px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none" />
                
                <div className="max-w-7xl mx-auto relative z-10">
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16 lg:gap-32 mb-24">
                      {/* Brand Block */}
                      <div className="lg:col-span-5 space-y-10">
                         <div className="space-y-6">
                            <h2 className="text-4xl md:text-5xl font-thin tracking-tighter text-white">alitheia</h2>
                            <p className="text-sm md:text-base text-white/40 font-light leading-relaxed max-w-sm">
                               The world's first multi-agent adversarial network for truth verification. 
                               Built for the post-truth era to safeguard global intelligence integrity.
                            </p>
                         </div>
                         <div className="flex items-center gap-3 bg-white/5 w-fit px-4 py-2 rounded-xl border border-white/10 glass-card">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
                            <span className="text-[10px] text-white/50 font-mono uppercase tracking-[0.2em] leading-none">v2.4.9 System Online</span>
                         </div>
                      </div>
                      
                      {/* Links Grid */}
                      <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-12 sm:gap-16">
                         <div className="space-y-8">
                            <h3 className="text-[10px] text-white/20 font-mono tracking-[0.3em] uppercase border-b border-white/5 pb-4">Intelligence</h3>
                            <nav className="flex flex-col gap-4">
                               {["Neural Nodes", "Research Hub", "Adversarial Lab", "Core API"].map(item => (
                                 <motion.a 
                                   key={item} 
                                   href="#" 
                                   whileHover={{ x: 4, color: "#fff" }}
                                   className="text-[11px] text-white/40 font-light transition-all uppercase tracking-widest block"
                                 >
                                   {item}
                                 </motion.a>
                               ))}
                            </nav>
                         </div>

                         <div className="space-y-8">
                            <h3 className="text-[10px] text-white/20 font-mono tracking-[0.3em] uppercase border-b border-white/5 pb-4">Foundation</h3>
                            <nav className="flex flex-col gap-4">
                               {["Protocol V2", "Whitepaper", "Network Stats", "Transparency"].map(item => (
                                 <motion.a 
                                   key={item} 
                                   href="#" 
                                   whileHover={{ x: 4, color: "#fff" }}
                                   className="text-[11px] text-white/40 font-light transition-all uppercase tracking-widest block"
                                 >
                                   {item}
                                 </motion.a>
                               ))}
                            </nav>
                         </div>

                         <div className="space-y-8 col-span-2 sm:col-span-1">
                            <h3 className="text-[10px] text-white/20 font-mono tracking-[0.3em] uppercase border-b border-white/5 pb-4">Connect</h3>
                            <div className="flex gap-4">
                               {[1, 2, 3].map(i => (
                                 <motion.div 
                                  key={i} 
                                  whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.2)" }}
                                  className="w-11 h-11 rounded-xl border border-white/5 flex items-center justify-center transition-all cursor-pointer glass-card"
                                  aria-label={`Open social channel ${i}`}
                                 >
                                   <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                                 </motion.div>
                               ))}
                            </div>
                         </div>
                      </div>
                   </div>
                   
                   <div className="flex flex-col md:flex-row justify-between items-center gap-10 pt-12 border-t border-white/5">
                      <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16 text-center md:text-left">
                         <p className="text-[10px] text-white/20 font-mono tracking-[0.3em] uppercase">© 2026 ALITHEIA CORE SYSTEM</p>
                         <div className="flex gap-10">
                            <a href="#" className="text-[10px] text-white/20 font-mono hover:text-white tracking-[0.3em] uppercase transition-colors">Privacy_Protocol</a>
                            <a href="#" className="text-[10px] text-white/20 font-mono hover:text-white tracking-[0.3em] uppercase transition-colors">Terms_Usage</a>
                         </div>
                      </div>
                      
                      <p className="text-[9px] text-white/10 font-mono uppercase tracking-[0.6em] hidden xl:block">Zero-Knowledge Verification Protocol Enabled</p>
                   </div>
                </div>
             </footer>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
