import { motion } from "motion/react";
import { ShieldCheck, AlertTriangle, ShieldAlert, RotateCcw, ExternalLink, TrendingUp, Users, Share2, Globe } from "lucide-react";
import { AnalysisResult } from "../services/geminiService";
import ReactMarkdown from "react-markdown";

export default function Dashboard({ 
  result, 
  onReset, 
  onCommunity 
}: { 
  result: AnalysisResult; 
  onReset: () => void;
  onCommunity: () => void;
}) {
  const isTrue = result.verdict === "Likely True";
  const isMisleading = result.verdict === "Potentially Misleading";
  
  const icon = isTrue ? <ShieldCheck className="w-12 h-12 text-blue-400" /> : 
               isMisleading ? <AlertTriangle className="w-12 h-12 text-yellow-400" /> : 
               <ShieldAlert className="w-12 h-12 text-red-400" />;
               
  const colorClass = isTrue ? "text-blue-400" : isMisleading ? "text-yellow-400" : "text-red-400";
  const borderClass = isTrue ? "border-blue-400/20" : isMisleading ? "border-yellow-400/20" : "border-red-400/20";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-24"
      role="region"
      aria-label="Analysis Results Dashboard"
    >
      {/* Top Bar Navigation for Dashboard */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 glass-card rounded-full flex items-center justify-center" aria-hidden="true">
              <Globe className="w-4 h-4 text-white/40" />
           </div>
           <div className="hidden md:block">
              <div className="text-label-caps text-[10px] text-white/30">Session ID</div>
              <div className="text-xs font-mono text-white/60" aria-label="Session Identification Code">AL-7492-XQ</div>
           </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              const shareData = {
                title: 'Alitheia Intelligence Report',
                text: `Alitheia Analysis: ${result.verdict} (${result.confidence}% Confidence). ${result.summary}`,
                url: window.location.href
              };
              if (navigator.share) {
                navigator.share(shareData);
              } else {
                navigator.clipboard.writeText(`${shareData.text}\n\nRead full report at: ${shareData.url}`);
                alert("Analysis link copied to clipboard.");
              }
            }}
            aria-label="Share this analysis report"
            className="flex items-center gap-2 text-label-caps text-white/50 hover:text-white transition-colors"
          >
            <Share2 className="w-3 h-3" aria-hidden="true" /> Share Results
          </button>
          <div className="w-[1px] h-3 bg-white/10" aria-hidden="true" />
          <button 
            onClick={onReset}
            aria-label="Start a new analysis"
            className="flex items-center gap-2 text-label-caps text-white/50 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3 h-3" aria-hidden="true" /> New Analysis
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Verdict Card */}
        <div className={`col-span-1 lg:col-span-4 glass-card rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden ${borderClass}`}>
           <div className="absolute top-0 right-0 p-8 opacity-10 blur-[40px] pointer-events-none" aria-hidden="true">
              {icon}
           </div>
           <div className="space-y-6">
              <div className="p-3 bg-white/5 rounded-2xl w-fit" aria-hidden="true">
                {icon}
              </div>
              <div aria-live="polite">
                <div className="text-label-caps text-white/40 mb-1">AI Verdict</div>
                <h3 className={`text-3xl font-light ${colorClass}`}>{result.verdict}</h3>
              </div>
              
              <div className="space-y-4">
                 <div className="flex justify-between items-end">
                    <span id="confidence-label" className="text-label-caps text-white/30">Confidence Score</span>
                    <span className="text-2xl font-thin">{result.confidence}%</span>
                 </div>
                 <div 
                  className="w-full h-1 bg-white/5 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-labelledby="confidence-label"
                  aria-valuenow={result.confidence}
                  aria-valuemin={0}
                  aria-valuemax={100}
                 >
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${result.confidence}%` }}
                      className={`h-full ${isTrue ? "bg-blue-400" : isMisleading ? "bg-yellow-400" : "bg-red-400"}`}
                    />
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4 mt-12 bg-black/20 p-4 rounded-2xl" role="group" aria-label="Key Indicators">
              <div>
                <div id="bias-label" className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Bias Rating</div>
                <div 
                  className="h-1 bg-white/5 rounded-full"
                  role="progressbar"
                  aria-labelledby="bias-label"
                  aria-valuenow={result.metrics.bias}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="h-full bg-white/20 rounded-full" style={{width: `${result.metrics.bias}%`}} />
                </div>
              </div>
              <div>
                <div id="emotion-label" className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Emotion</div>
                <div 
                  className="h-1 bg-white/5 rounded-full"
                  role="progressbar"
                  aria-labelledby="emotion-label"
                  aria-valuenow={result.metrics.emotion}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="h-full bg-white/20 rounded-full" style={{width: `${result.metrics.emotion}%`}} />
                </div>
              </div>
           </div>
        </div>

        {/* Summary & Analysis */}
        <div className="col-span-1 lg:col-span-8 glass-card rounded-3xl p-10 space-y-10">
           <div className="space-y-4">
              <h4 className="text-label-caps text-white/40">Intelligence Summary</h4>
              <div className="text-xl font-light leading-relaxed prose prose-invert max-w-none">
                 <ReactMarkdown>{result.summary}</ReactMarkdown>
              </div>
           </div>

           <div className="h-[1px] bg-white/5" aria-hidden="true" />

           <div className="space-y-6 text-sm font-light leading-relaxed text-white/60">
              <h4 className="text-label-caps text-white/40">Contextual Reasoning</h4>
              <p>{result.context}</p>
           </div>
           
           <div className="flex flex-wrap gap-3" aria-label="Extracted Claims">
              {result.claims.slice(0, 3).map((claim, i) => (
                <div key={i} className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[11px] text-white/60">
                   {claim}
                </div>
              ))}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Verification Matrix (Sources) */}
        <section className="glass-card rounded-3xl p-10 space-y-8" aria-labelledby="supporting-sources-title">
           <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-400" aria-hidden="true" />
              <h4 id="supporting-sources-title" className="text-lg font-light">Supporting Sources</h4>
           </div>
           <div className="space-y-6">
              {result.sources.supporting.map((source, i) => (
                <article key={i} className="group p-6 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-all cursor-pointer">
                   <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <div 
                          className={`w-1.5 h-1.5 rounded-full ${
                            source.credibility >= 80 ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : 
                            source.credibility >= 50 ? "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]" : 
                            "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                          }`} 
                          aria-hidden="true" 
                        />
                        <div className="text-label-caps text-white/30">{source.name}</div>
                      </div>
                      <div className="text-xs font-mono text-blue-400" aria-label={`Credibility score: ${source.credibility} percent`}>Trust: {source.credibility}</div>
                   </div>
                   <h5 className="text-white/80 font-light mb-4 group-hover:text-white transition-colors">{source.headline}</h5>
                   <button 
                    className="flex items-center gap-2 text-[10px] text-white/30 uppercase tracking-widest group-hover:text-white/60 focus:outline-none focus:text-white"
                    aria-label={`Review document from ${source.name}`}
                   >
                      <ExternalLink className="w-3 h-3" aria-hidden="true" /> Review Document
                   </button>
                </article>
              ))}
           </div>
        </section>

        <section className="glass-card rounded-3xl p-10 space-y-8" aria-labelledby="contradictions-title">
           <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400" aria-hidden="true" />
              <h4 id="contradictions-title" className="text-lg font-light">Contradictions Found</h4>
           </div>
           <div className="space-y-6">
              {result.sources.contradicting.length > 0 ? result.sources.contradicting.map((source, i) => (
                <article key={i} className="group p-6 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-all cursor-pointer">
                   <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <div 
                          className={`w-1.5 h-1.5 rounded-full ${
                            source.credibility >= 80 ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : 
                            source.credibility >= 50 ? "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]" : 
                            "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                          }`} 
                          aria-hidden="true" 
                        />
                        <div className="text-label-caps text-white/30">{source.name}</div>
                      </div>
                      <div className="text-xs font-mono text-red-400" aria-label={`Risk score: ${100 - source.credibility} percent`}>Risk: {100 - source.credibility}</div>
                   </div>
                   <h5 className="text-white/80 font-light mb-4 group-hover:text-white transition-colors">{source.headline}</h5>
                   <button 
                    className="flex items-center gap-2 text-[10px] text-white/30 uppercase tracking-widest group-hover:text-white/60 focus:outline-none focus:text-white"
                    aria-label={`View rebuttal from ${source.name}`}
                   >
                      <ExternalLink className="w-3 h-3" aria-hidden="true" /> View Rebuttal
                   </button>
                </article>
              )) : (
                <div className="h-full flex items-center justify-center p-12 border border-dashed border-white/10 rounded-2xl opacity-40">
                   <p className="text-sm italic">No significant contradictions detected in premium journals.</p>
                </div>
              )}
           </div>
        </section>
      </div>

      <section className="glass-card rounded-3xl p-10 space-y-12" aria-labelledby="network-viz-title">
         <div className="flex items-center justify-between">
            <h4 id="network-viz-title" className="text-lg font-light">Network Proximities</h4>
            <div className="flex gap-4" role="legend">
               <div className="flex items-center gap-2 text-xs text-white/40"><div className="w-1 h-1 bg-blue-400" aria-hidden="true" /> Official</div>
               <div className="flex items-center gap-2 text-xs text-white/40"><div className="w-1 h-1 bg-red-400" aria-hidden="true" /> Disputed</div>
            </div>
         </div>
         
         {/* Simple visualization placeholder */}
         <div 
          className="h-64 relative flex items-center justify-center overflow-hidden rounded-2xl bg-black/20"
          role="img"
          aria-label="Network propagation visualization showing verified vs disputed nodes"
         >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" aria-hidden="true" />
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              className="w-96 h-96 border border-white/5 rounded-full absolute" 
              aria-hidden="true"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
              className="w-[450px] h-[450px] border border-white/5 rounded-full absolute" 
              aria-hidden="true"
            />
            <div className="z-10 text-center space-y-4">
               <div className="w-16 h-16 glass-card rounded-full mx-auto flex items-center justify-center border-white/20" aria-hidden="true">
                  <TrendingUp className="w-6 h-6 text-white/80" />
               </div>
               <div className="text-label-caps text-[10px] text-white/40">Propagation Velocity: High</div>
            </div>
            
            {/* Pulsing nodes */}
            <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-blue-400 rounded-full animate-pulse" aria-hidden="true" />
            <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-red-400 rounded-full animate-pulse " style={{animationDelay: '1s'}} aria-hidden="true" />
            <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-white/40 rounded-full" aria-hidden="true" />
         </div>
      </section>

      {/* Community Section */}
      <section className="p-10 border border-white/5 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8" aria-labelledby="community-footer-title">
         <div className="space-y-2">
            <h4 id="community-footer-title" className="text-lg font-light flex items-center gap-2"><Users className="w-5 h-5 text-white/40" aria-hidden="true" /> Alitheia Community</h4>
            <p className="text-sm text-white/40 font-light">Join 12,400+ researchers currently reviewing this intelligence thread.</p>
         </div>
         <div className="flex gap-4">
            <button className="px-6 py-3 glass-card rounded-xl text-sm font-light hover:bg-white/5 transition-all flex items-center gap-2">
               <Share2 className="w-4 h-4" aria-hidden="true" /> Share Thread
            </button>
            <button 
              onClick={onCommunity}
              className="px-6 py-3 bg-white text-black rounded-xl text-sm font-medium hover:bg-white/90 transition-all font-sans"
              aria-label="Join the community discussion about these results"
            >
               Join Discussion
            </button>
         </div>
      </section>

      <div className="pt-12 text-center max-w-2xl mx-auto space-y-4" role="contentinfo" aria-label="Disclaimer">
         <p className="text-[10px] text-white/20 font-light leading-relaxed">
            AI-GENERATED VERIFICATION RESULTS ARE PROBABILISTIC AND SHOULD NOT BE CONSIDERED ABSOLUTE TRUTH. USERS ARE ENCOURAGED TO CROSS-REFERENCE MULTIPLE RELIABLE SOURCES BEFORE MAKING CONCLUSIONS.
         </p>
      </div>
    </motion.div>
  );
}
