import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

// Load .env.local
const envFile = fs.readFileSync(".env.local", "utf8");
let apiKey = "";
for (const line of envFile.split("\n")) {
    if (line.startsWith("GEMINI_API_KEY=")) {
        apiKey = line.split("=")[1].trim();
    }
}

const genAI = new GoogleGenerativeAI(apiKey);
const geminiModel = genAI.getGenerativeModel({
  model: "gemini-flash-latest",
  generationConfig: {
    temperature: 0.1,
  }
});

async function run() {
    const prompt = `Extract a flat list of exactly top 10-15 core professional skills and technologies from the following resume. Return ONLY a valid JSON array of strings. No markdown formatting, no explanations. Example: ["JavaScript", "Project Management", "React"]\n\nText:\nI am a software engineer with 5 years of experience in React, Node.js, TypeScript, and MongoDB.`;
    
    try {
        const result = await geminiModel.generateContent(prompt);
        console.log("Raw Response:");
        console.log(result.response.text());
    } catch (e) {
        console.error("Error:", e);
    }   
}

run();
