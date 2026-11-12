import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";

const envContent = fs.readFileSync(".env.local", "utf8");
const match = envContent.match(/GEMINI_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : "";
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

async function run() {
  const texts = ["React", "Node.js", "TypeScript"];
  const res = await model.batchEmbedContents({
    requests: texts.map(t => ({
      content: { role: "user", parts: [{ text: t }] }
    }))
  });
  console.log(res.embeddings.length);
  console.log(res.embeddings[0].values.length);
}
run();
