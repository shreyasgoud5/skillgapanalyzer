import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-flash-latest",
  generationConfig: {
    temperature: 0.1,
  }
});

export const embeddingModel = genAI.getGenerativeModel({
  model: "gemini-embedding-001",
});

export async function callGemini(prompt: string) {
  let delay = 2000;
  const maxRetries = 3;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await geminiModel.generateContent(prompt);
      return result;
    } catch (err: any) {
      if (i === maxRetries - 1) throw err;
      
      const errMsg = err?.message?.toLowerCase() || "";
      if (errMsg.includes("quota")) {
        console.error("API Quota Exhausted. Failing fast.");
        throw err;
      }

      const isRateLimit = err?.status === 429 || errMsg.includes("429") || errMsg.includes("too many requests");
      if (isRateLimit) {
        delay = delay * 2; 
        console.warn(`Rate limit hit (attempt ${i + 1}). Retrying in ${delay}ms...`);
      } else {
        console.warn(`API error (attempt ${i + 1}). Retrying in ${delay}ms...`);
      }
      
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error(`Failed after ${maxRetries} retries`);
}

export async function generateEmbeddings(text: string): Promise<number[]> {
  try {
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error("Error generating embeddings:", error);
    throw error;
  }
}

async function safeEmbed(request: any) {
  let delay = 3000;
  const maxRetries = 3;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await embeddingModel.batchEmbedContents(request);
    } catch (e: any) {
      if (i === maxRetries - 1) throw e;
      
      const errMsg = e?.message?.toLowerCase() || "";
      if (errMsg.includes("quota")) {
        console.error("API Quota Exhausted. Failing fast.");
        throw e;
      }

      const isRateLimit = e?.status === 429 || errMsg.includes("429") || errMsg.includes("too many requests");
      if (isRateLimit) {
        delay = delay * 2;
        console.warn(`Embed rate limit hit (attempt ${i + 1}). Retrying in ${delay}ms...`);
      } else {
        console.warn(`Embed API error (attempt ${i + 1}). Retrying in ${delay}ms...`);
      }
      
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

export async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  
  const results: number[][] = [];
  const BATCH_SIZE = 100; // Increased to 100 to fit all skills in one API call

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const chunk = texts.slice(i, i + BATCH_SIZE);

    try {
      const res = await safeEmbed({
        requests: chunk.map(t => ({
          content: { role: "user", parts: [{ text: t }] }
        }))
      });
      if (res && res.embeddings) {
        results.push(...res.embeddings.map(e => e.values));
      } else {
        results.push(...chunk.map(() => new Array(768).fill(0)));
      }
    } catch (error: any) {
      console.warn("Fallback: Returning zero vectors due to API exhaustion.");
      results.push(...chunk.map(() => new Array(768).fill(0))); // Fallback safely
    }

    // Delay to avoid rate limit
    if (i + BATCH_SIZE < texts.length) {
      await new Promise(r => setTimeout(r, 3000)); // Increased base delay between batches
    }
  }

  return results;
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
