import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function searchSerp(query: string) {
  const apiKey = process.env.SERP_API_KEY;
  if (!apiKey) return [];

  try {
    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    
    return (data.organic_results || []).map((result: any) => ({
      name: result.source || new URL(result.link).hostname,
      url: result.link,
      headline: result.title,
      snippet: result.snippet,
      credibility: 85 // Default base credibility for serp results
    }));
  } catch (error) {
    console.error("SerpAPI Error:", error);
    return [];
  }
}

export async function fetchNews(query: string) {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return [];

  try {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&apiKey=${apiKey}&pageSize=5`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "ok") return [];

    return (data.articles || []).map((article: any) => ({
      name: article.source.name,
      url: article.url,
      headline: article.title,
      snippet: article.description,
      credibility: 90
    }));
  } catch (error) {
    console.error("NewsAPI Error:", error);
    return [];
  }
}

export async function searchIntelligence(input: string) {
  // Step 1: In a perfect world we'd generate queries first, 
  // but for simplicity here we'll search the input and some key terms extracted simply.
  const terms = input.split(' ').slice(0, 5).join(' ');
  
  const searchPromises = [
    searchSerp(input),
    fetchNews(input),
    searchSerp(terms),
    fetchNews(terms)
  ];
  
  const results = await Promise.all(searchPromises);
  const flatResults = results.flat().filter((v, i, a) => a.findIndex(t => t.url === v.url) === i);
  
  return flatResults.slice(0, 10); // Return top 10 unique results
}
