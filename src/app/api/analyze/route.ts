import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import mammoth from "mammoth";
import { callGemini, generateEmbeddings, generateBatchEmbeddings, cosineSimilarity } from "@/lib/ai";
import { AnalysisResult, MatchCategory, SkillMatch } from "@/lib/types";

async function parseFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
    if (typeof globalThis.DOMMatrix === 'undefined') {
      globalThis.DOMMatrix = class DOMMatrix {} as any;
      globalThis.ImageData = class ImageData {} as any;
      globalThis.Path2D = class Path2D {} as any;
    }
    const pdfParse = require("pdf-parse");
    const data = await pdfParse(buffer);
    return data.text;
  } else if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } else {
    throw new Error("Unsupported file type. Please upload a PDF or DOCX file.");
  }
}

async function extractBothSkills(resumeText: string, jdText: string): Promise<{resumeSkills: string[], jdSkills: string[]}> {
  const prompt = `Extract a flat list of exactly top 10-15 core professional skills and technologies from the Candidate's Resume, and separately from the Job Description. 
Return ONLY a valid JSON object with two arrays. No markdown formatting, no explanations. 
Example: {"resumeSkills": ["JavaScript", "React"], "jdSkills": ["Project Management", "React"]}

Resume:
${resumeText.substring(0, 3000)}

Job Description:
${jdText.substring(0, 2000)}`;

  try {
    const result = await callGemini(prompt);
    const responseText = result.response.text().trim();
    
    let cleanedText = responseText;
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    }
    const data = JSON.parse(cleanedText);
    return {
      resumeSkills: Array.isArray(data.resumeSkills) ? data.resumeSkills : ["Analysis Failed"],
      jdSkills: Array.isArray(data.jdSkills) ? data.jdSkills : ["Analysis Failed"]
    };
  } catch (error: any) {
    console.warn("Fallback: Returning basic skills due to Gemini failure for skill extraction");
    
    // Explicit fail-fast if quota is dead or API completely unresponsive
    return {
      resumeSkills: ["API_QUOTA_EXHAUSTED"],
      jdSkills: ["API_QUOTA_EXHAUSTED"]
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const resumeFile = formData.get("resume") as File | null;
    const jobDescription = formData.get("jobDescription") as string | null;

    if (!resumeFile || !jobDescription) {
      return NextResponse.json({ error: "Missing resume or job description" }, { status: 400 });
    }

    // 1. Parse Resume
    const resumeText = await parseFile(resumeFile);

    // 2. Extract Skills (Combined into one call to avoid 429 Too Many Requests)
    const { resumeSkills, jdSkills } = await extractBothSkills(resumeText, jobDescription);

    if (jdSkills[0] === "API_QUOTA_EXHAUSTED") {
      return NextResponse.json(
        { error: "AI Service Quota Exhausted. The Gemini free tier has reached its daily limit. Please try again tomorrow or configure a new API key." },
        { status: 429 }
      );
    }

    if (jdSkills.length === 0 || jdSkills[0] === "Analysis Failed") {
      return NextResponse.json({ error: "Could not extract skills from Job Description." }, { status: 400 });
    }

    // 3. Generate Embeddings for Skills via Bulk Batch to avoid 429 Error
    let resumeEmbeddingsVecs = await generateBatchEmbeddings(resumeSkills);
    let jdEmbeddingsVecs = await generateBatchEmbeddings(jdSkills);

    const resumeEmbeddings = resumeSkills.map((skill, i) => ({ skill, vec: resumeEmbeddingsVecs[i] }));
    const jdEmbeddings = jdSkills.map((skill, i) => ({ skill, vec: jdEmbeddingsVecs[i] }));

    // 4. Calculate similarities and find matches
    const skillMatches: SkillMatch[] = [];
    let matchedCount = 0;
    let partialCount = 0;

    for (const jdSkillObj of jdEmbeddings) {
      let bestMatchScore = 0;
      let bestMatchSkill = "";

      for (const resSkillObj of resumeEmbeddings) {
        const score = cosineSimilarity(jdSkillObj.vec, resSkillObj.vec);
        if (score > bestMatchScore) {
          bestMatchScore = score;
          bestMatchSkill = resSkillObj.skill;
        }
      }

      let category: MatchCategory = "missing";
      if (bestMatchScore >= 0.8) {
        category = "matched";
        matchedCount++;
      } else if (bestMatchScore >= 0.5) {
        category = "partial";
        partialCount++;
      }

      skillMatches.push({
        skill: jdSkillObj.skill,
        category,
        similarityScore: bestMatchScore,
        matchedWith: bestMatchScore >= 0.5 ? bestMatchSkill : undefined,
      });
    }

    const skillMatchScore = Math.round(((matchedCount + (partialCount * 0.5)) / jdSkills.length) * 100) || 0;

    // 5. Generate Insights (Action Plan, Recruiter Summary, Section Analysis)
    const insightPrompt = `
      Based on a candidate's resume and a job description, I have calculated a skill match score of ${skillMatchScore}%.
      
      Here are the missing skills:
      ${skillMatches.filter(s => s.category === "missing").map(s => s.skill).join(", ")}
      
      Here are the partially matched skills:
      ${skillMatches.filter(s => s.category === "partial").map(s => s.skill).join(", ")}
      
      Here are the fully matched skills:
      ${skillMatches.filter(s => s.category === "matched").map(s => s.skill).join(", ")}

      Resume Text:
      ${resumeText.substring(0, 3000)}... // Truncated for brevity

      Job Description:
      ${jobDescription.substring(0, 2000)}...

      Generate a JSON response with the following structure exactly (no markdown wrapping, just valid JSON string):
      {
        "jobTitle": "string (Extract the main 2-5 word job title the candidate is applying for)",
        "keywordScore": number (0-100),
        "experienceScore": number (0-100),
        "sectionAnalysis": [
          {"sectionName": "string", "score": number, "feedback": "string"}
        ],
        "actionPlan": [
          {"title": "string", "description": "string", "priority": "High" | "Medium" | "Low"}
        ],
        "recruiterSummary": "A concise 2-3 sentence summary evaluating the candidate's fit."
      }
    `;

    let insights;
    try {
      const insightResult = await callGemini(insightPrompt);
      let insightText = insightResult.response.text().trim();
      if (insightText.startsWith("```json")) {
        insightText = insightText.replace(/^```json\n?/, "").replace(/\n?```$/, "");
      }
      insights = JSON.parse(insightText);
    } catch (e) {
      console.warn("Fallback: Returning basic insights due to Gemini failure.");
      insights = {
        jobTitle: "Target Position",
        keywordScore: skillMatchScore, 
        experienceScore: skillMatchScore, 
        sectionAnalysis: [], 
        actionPlan: [], 
        recruiterSummary: "Candidate has some matching skills but deep AI analysis is temporarily unavailable."
      };
    }

    const overallScore = Math.round((skillMatchScore * 0.5) + ((insights.keywordScore || 0) * 0.25) + ((insights.experienceScore || 0) * 0.25));

    const finalResult: AnalysisResult = {
      jobTitle: insights.jobTitle || "Job Analysis",
      overallMatchScore: overallScore || 0,
      skillMatchScore,
      keywordScore: insights.keywordScore || 0,
      experienceScore: insights.experienceScore || 0,
      skills: skillMatches,
      sectionAnalysis: insights.sectionAnalysis || [],
      actionPlan: insights.actionPlan || [],
      recruiterSummary: insights.recruiterSummary || "No summary provided.",
    };

    return NextResponse.json(finalResult);

  } catch (error) {
    console.error("Analyze Error:", error);
    return NextResponse.json({ error: "Internal Server Error during analysis." }, { status: 500 });
  }
}
