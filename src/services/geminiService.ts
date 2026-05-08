import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface AnalysisResult {
  verdict: "Likely True" | "Potentially Misleading" | "High Risk Misinformation";
  confidence: number;
  summary: string;
  context: string;
  claims: string[];
  sources: {
    supporting: Source[];
    contradicting: Source[];
  };
  metrics: {
    bias: number;
    manipulation: number;
    emotion: number;
    trust: number;
  };
}

export interface Source {
  name: string;
  url: string;
  headline: string;
  credibility: number;
  date?: string;
}

export interface AgentLog {
  agent: string;
  status: string;
  timestamp: string;
}

export async function performDeepAnalysis(
  input: string,
  onProgress: (log: AgentLog) => void
): Promise<AnalysisResult> {
  const model = "gemini-3-flash-preview";
  const now = () => new SourceDate().toISOString();

  onProgress({ agent: "Search Agent", status: "Querying Serp & News intelligence databases...", timestamp: now() });
  
  try {
    // Phase 1: Search (Backend)
    const searchResponse = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input })
    });

    if (!searchResponse.ok) {
      throw new Error("Search server failed to respond");
    }

    const intelligentSources = await searchResponse.json();
    
    onProgress({ agent: "Cross-Verification Agent", status: "Analyzing retrieved sources for contradictions...", timestamp: now() });
    await new Promise(r => setTimeout(r, 600));
    
    onProgress({ agent: "Synthesis Agent", status: "Performing perfect prediction using grounded intelligence...", timestamp: now() });
    
    // Phase 2: Grounded Analysis (Frontend Gemini API)
    const finalPrompt = `
      You are Alitheia Intelligence Core. Perform a perfect verification of the claim based on these retrieved sources.
      
      Original Text: ${input}
      
      Retrieved Intelligent Sources:
      ${JSON.stringify(intelligentSources, null, 2)}
      
      Return a precise JSON analysis following this schema:
      {
        "verdict": "Likely True" | "Potentially Misleading" | "High Risk Misinformation",
        "confidence": number,
        "summary": "Concise executive summary",
        "context": "Deep reasoning explaining why this verdict was reached",
        "claims": ["extracted claim 1", "extracted claim 2"],
        "sources": {
          "supporting": [{"name": "source name", "url": "url", "headline": "headline", "credibility": number}],
          "contradicting": [{"name": "source name", "url": "url", "headline": "headline", "credibility": number}]
        },
        "metrics": { "bias": 0-100, "manipulation": 0-100, "emotion": 0-100, "trust": 0-100 }
      }
    `;

    const response = await ai.models.generateContent({
      model,
      contents: finalPrompt,
      config: { responseMimeType: "application/json" },
    });

    if (!response.text) throw new Error("Inconclusive intelligence result.");
    
    const result = JSON.parse(response.text.replace(/```json|```/g, "").trim());
    return result;
  } catch (error) {
    console.error("Intelligence Core Error:", error);
    throw error;
  }
}

class SourceDate extends Date {
  toISOString() {
    return super.toISOString().split('T')[1].split('.')[0];
  }
}
