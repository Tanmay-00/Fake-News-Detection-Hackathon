import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, LogIn, Loader2, Check } from "lucide-react";
import { auth, db, handleFirestoreError, OperationType } from "../lib/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { User } from "../types";
import { cn } from "../lib/utils";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: User) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parseErrorMessage = (err: any) => {
    try {
      const parsed = JSON.parse(err.message);
      return parsed.error || "A secure protocol violation occurred.";
    } catch {
      if (err.message?.includes("auth/user-not-found")) return "Account not found.";
      if (err.message?.includes("auth/wrong-password")) return "Incorrect password. Please try again.";
      if (err.message?.includes("auth/email-already-in-use")) return "This email is already registered.";
      return err.message || "An unexpected error occurred.";
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === "signup") {
        const res = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await updateProfile(res.user, { displayName: form.name });
        
        const userData: User = {
          id: res.user.uid,
          name: form.name,
          role: "Researcher",
          avatar: undefined
        };
        await setDoc(doc(db, "users", res.user.uid), userData);
        onSuccess?.(userData);
      } else {
        await signInWithEmailAndPassword(auth, form.email, form.password);
      }
      onClose();
      setForm({ email: "", password: "", name: "" });
    } catch (err: any) {
      setError(parseErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onClose();
    } catch (err) {
      console.error("Google sign in failed:", err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="relative my-auto w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-3xl p-10 space-y-8 shadow-2xl"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all z-20"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-center space-y-3">
              <h3 className="text-3xl font-thin tracking-tighter text-white">
                {mode === "login" ? "Welcome back" : "Join the network"}
              </h3>
              <p className="text-xs text-white/30 font-light max-w-[240px] mx-auto leading-relaxed">
                {mode === "login" 
                  ? "Sign in to access your research dashboard and historical data." 
                  : "Create an account to participate in global intelligence synthesis."}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-6">
              {mode === "signup" && (
                <div className="space-y-2">
                  <label className="text-xs text-white/50 font-light ml-1">Full Name</label>
                  <input 
                    required
                    type="text" 
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-light focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-white/10"
                    placeholder="Enter your name"
                  />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-xs text-white/50 font-light ml-1">Email Address</label>
                <input 
                  required
                  type="email" 
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-light focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-white/10"
                  placeholder="name@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-white/50 font-light ml-1">Password</label>
                <input 
                  required
                  type="password" 
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-light focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-white/10"
                  placeholder="••••••••"
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="text-red-400 bg-red-400/5 py-3 px-4 rounded-xl border border-red-400/10 text-xs font-light text-center">
                      {error}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-white/5 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/10 transition-all group overflow-hidden relative"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    mode === "login" ? "Sign In" : "Sign Up"
                  )}
                </span>
                <div className="absolute inset-0 bg-blue-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
              <div className="relative flex justify-center text-[10px] uppercase text-white/20"><span className="bg-[#0A0A0A] px-4 font-mono">Social Authentication</span></div>
            </div>

            <button 
              onClick={handleGoogleSignIn}
              className="w-full py-4 glass-card border border-white/10 rounded-xl text-sm font-light hover:border-white/30 transition-all flex items-center justify-center gap-3"
            >
              <img src="https://www.google.com/favicon.ico" className="w-4 h-4 opacity-50 grayscale hover:grayscale-0 transition-all" alt="" />
              Continue with Google
            </button>

            <p className="text-center text-[10px] text-white/20">
              {mode === "login" ? "NEED AN ACCOUNT?" : "ALREADY HAVE AN ACCOUNT?"}
              <button 
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="ml-2 text-white/60 hover:text-white underline underline-offset-4 decoration-white/10"
              >
                {mode === "login" ? "Register now" : "Sign in here"}
              </button>
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
