import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Loader2, ShieldCheck, AlertCircle, HelpCircle } from "lucide-react";
import { AgentLog, AnalysisResult, performDeepAnalysis } from "../services/geminiService";
import Dashboard from "./Dashboard";
import AnalysisLoader from "./AnalysisLoader";

export default function AnalysisUI({ onCommunity, onAnalyzingChange }: { onCommunity: () => void, onAnalyzingChange?: (analyzing: boolean) => void }) {
  const [input, setInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAnalyzing) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    onAnalyzingChange?.(isAnalyzing);
    return () => { document.body.style.overflow = "unset"; };
  }, [isAnalyzing, onAnalyzingChange]);

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setIsAnalyzing(true);
    setResult(null);
    setLogs([]);
    setError(null);
    
    try {
      const data = await performDeepAnalysis(input, (log) => {
        setLogs(prev => [...prev, log]);
      });
      // Small delay to show completion state
      await new Promise(resolve => setTimeout(resolve, 2000));
      setResult(data);
    } catch (e) {
      console.error(e);
      let message = "The multi-agent network encountered an interference. Verification protocols stalled. Please retry the request.";
      
      if (e instanceof Error) {
        const errorText = e.message.toLowerCase();
        if (errorText.includes("failed to fetch") || errorText.includes("network") || errorText.includes("connectivity")) {
          message = "Network connectivity issue detected. The synchronization with the verification nodes failed.";
        } else if (errorText.includes("rate limit") || errorText.includes("429") || errorText.includes("too many requests")) {
          message = "API rate limit exceeded. The verification core is cooling down; please wait a moment before re-submitting.";
        } else if (errorText.includes("search server")) {
          message = "Real-time intelligence retrieval failed. The searching protocols are currently throttled or unavailable.";
        } else if (errorText.includes("gemini")) {
          message = "The Neural Core is experiencing high latency. The synthesis phase could not be completed.";
        } else if (errorText.includes("quota") || errorText.includes("limit")) {
          message = "System capacity reached. Deep verification cycles are temporarily limited.";
        } else if (errorText.includes("inconclusive")) {
          message = "The intelligence provided was insufficient for a high-confidence verdict. Try providing more context or article text.";
        }
      }
      setError(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <section className="min-h-screen py-24 px-8 max-w-6xl mx-auto relative z-10" aria-labelledby="analysis-title">
      <div className="ambient-glow top-0 left-1/4 w-[500px] h-[500px] bg-white/5 opacity-10" />
      
      {!result || isAnalyzing ? (
        <div className="space-y-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isAnalyzing ? 0 : 1, y: isAnalyzing ? -20 : 0 }}
            className="text-center space-y-4"
          >
            <h2 id="analysis-title" className="text-headline-lg font-thin">Intelligence Core</h2>
            <p className="text-white/40 max-w-xl mx-auto font-light">
              Submit claims, headlines, or full articles for multi-agent adversarial verification.
            </p>
          </motion.div>

          <motion.div 
            animate={{ opacity: isAnalyzing ? 0 : 1 }}
            className="flex flex-col items-center gap-8"
          >
            <div className="relative w-full">
              <label htmlFor="claim-input" className="sr-only">Analysis Input</label>
              <textarea
                id="claim-input"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Paste article text, headline, or claim for verification..."
                className="w-full h-64 glass-card rounded-2xl p-8 text-lg font-light focus:outline-none focus:ring-1 focus:ring-white/20 transition-all placeholder:text-white/10 resize-none"
              />
              
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute -bottom-16 left-0 right-0 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm"
                    role="alert"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <p className="font-light">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAnalyze}
              disabled={isAnalyzing || !input.trim()}
              aria-busy={isAnalyzing}
              className="px-12 py-4 rounded-xl bg-white text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed group flex items-center gap-3 overflow-hidden relative shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_50px_rgba(255,255,255,0.2)] transition-all"
            >
              <span className="text-sm tracking-widest uppercase font-mono">
                {isAnalyzing ? "Processing..." : "Initiate Verification"}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </motion.button>
          </motion.div>
        </div>
      ) : (
        <Dashboard result={result} onReset={() => { setResult(null); setInput(""); }} onCommunity={onCommunity} />
      )}

      <AnimatePresence>
        {isAnalyzing && (
          <AnalysisLoader logs={logs} isComplete={logs.length >= 4} />
        )}
      </AnimatePresence>
    </section>
  );
}
