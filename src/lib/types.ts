export type MatchCategory = "matched" | "partial" | "missing";

export interface SkillMatch {
  skill: string;
  category: MatchCategory;
  similarityScore: number; // 0 to 1
  matchedWith?: string; // If matched/partial, what it matched with from the resume
}

export interface SectionAnalysis {
  sectionName: string;
  score: number; // 0 to 100
  feedback: string;
}

export interface ActionPlanStep {
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
}

export interface AnalysisResult {
  jobTitle?: string;
  overallMatchScore: number; // 0 to 100
  skillMatchScore: number;
  keywordScore: number;
  experienceScore: number;
  skills: SkillMatch[];
  sectionAnalysis: SectionAnalysis[];
  actionPlan: ActionPlanStep[];
  recruiterSummary: string;
}
