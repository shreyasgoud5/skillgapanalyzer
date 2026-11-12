import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

const envFile = fs.readFileSync(".env.local", "utf8");
let apiKey = "";
for (const line of envFile.split("\n")) {
    if (line.startsWith("GEMINI_API_KEY=")) {
        apiKey = line.split("=")[1].trim();
    }
}

async function run() {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=" + apiKey);
    const data = await response.json();
    console.log(data.models.map(m => m.name));
}

run();
