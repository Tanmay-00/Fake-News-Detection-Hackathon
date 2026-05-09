import { motion, AnimatePresence } from "motion/react";
import { X, Home, Info, Settings, LogIn, User as UserIcon, LogOut, ChevronRight } from "lucide-react";
import { User } from "../types";
import { auth, db, handleFirestoreError, OperationType } from "../lib/firebase";
import { signOut, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onNavigate: (view: "analysis" | "community") => void;
  activeView: string;
  onAuthOpen: () => void;
}

export default function Sidebar({ isOpen, onClose, user, onNavigate, activeView, onAuthOpen }: SidebarProps) {
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      onClose();
    } catch (error) {
      console.error("Sign out failed", error);
    }
  };

  const menuItems = [
    { id: "analysis", label: "Home", icon: Home, view: "analysis" },
    { id: "about", label: "About Us", icon: Info },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
          />

          {/* Sidebar Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-[#050505] border-l border-white/5 z-[101] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-8 flex justify-between items-center border-b border-white/5">
              <h2 className="text-xl font-thin tracking-widest text-white/80">CORE NAVIGATION</h2>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            {/* Menu Links */}
            <div className="flex-1 p-8 space-y-2 overflow-y-auto custom-scrollbar pb-32">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.view) {
                      onNavigate(item.view as any);
                      onClose();
                    }
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${
                    (item.view === activeView) 
                      ? "bg-white/10 border border-white/10" 
                      : "hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:border-white/20 transition-all">
                      <item.icon className={`w-5 h-5 ${item.view === activeView ? 'text-white' : 'text-white/40'}`} />
                    </div>
                    <span className={`text-sm font-light tracking-widest ${item.view === activeView ? 'text-white' : 'text-white/60'}`}>
                      {item.label}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/10 group-hover:translate-x-1 transition-transform" />
                </button>
              ))}

              <button
                onClick={() => {
                  onNavigate("community");
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${
                  activeView === 'community' 
                    ? "bg-white/10 border border-white/10" 
                    : "hover:bg-white/5 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:border-white/20 transition-all">
                    <UserIcon className={`w-5 h-5 ${activeView === 'community' ? 'text-white' : 'text-white/40'}`} />
                  </div>
                  <span className={`text-sm font-light tracking-widest ${activeView === 'community' ? 'text-white' : 'text-white/60'}`}>
                    Research Hub
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-white/10 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* User Section Bottom */}
            <div className="mt-auto p-8 border-t border-white/5 bg-[#080808] flex-shrink-0 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
              {user ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-5 h-5 text-white/20" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{user.name}</div>
                      <div className="text-[10px] text-white/30 uppercase font-mono tracking-widest leading-none mt-1">{user.role}</div>
                    </div>
                  </div>
                  <button 
                    onClick={handleSignOut}
                    className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 hover:text-red-400 hover:border-red-400/20 transition-all flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center space-y-1">
                    <p className="text-[10px] text-white/20 uppercase tracking-[0.1em]">Secure your dashboard access</p>
                  </div>
                  <button 
                    onClick={() => {
                      onAuthOpen();
                      onClose();
                    }}
                    className="w-full py-4 bg-white text-black rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-white/90 transition-all flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
                  >
                    <LogIn className="w-4 h-4" /> Sign In
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
