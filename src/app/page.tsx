"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function Home() {
  const router = useRouter();
  const [resume, setResume] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resume || !jobDescription) {
      setError("Please provide both a resume and a job description.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("resume", resume);
      formData.append("jobDescription", jobDescription);

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Analysis failed");
      }

      const data = await res.json();
      
      // Store locally to pass to dashboard implicitly or save via API if user is authenticated
      sessionStorage.setItem("latestAnalysis", JSON.stringify(data));
      
      // Attempt to save to history if authenticated
      await fetch("/api/save-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_text: resume.name, // Simplified for demo
          jd_text: jobDescription.substring(0, 100) + "...", 
          scores: {
            jobTitle: data.jobTitle,
            overallMatchScore: data.overallMatchScore,
            skillMatchScore: data.skillMatchScore,
            keywordScore: data.keywordScore,
            experienceScore: data.experienceScore,
          },
          skill_analysis: data.skills,
          section_analysis: data.sectionAnalysis,
          action_plan: data.actionPlan,
          recruiter_summary: data.recruiterSummary,
        }),
      });

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {!loading ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center"
          >
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-lg">
                Bridge Your <span className="text-primary text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400">Skill Gap</span>
              </h1>
              <p className="text-lg text-foreground/80 leading-relaxed">
                Upload your resume and paste the job description you're applying for.
                Our AI agents will tear it down, find exactly where you're lacking, 
                and give you a structured plan to become the perfect candidate.
              </p>
              
              <ul className="space-y-3 pt-4 text-sm font-medium text-foreground/70 border-t border-border/50">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Multi-Agent Verification</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Vector Embedding Match</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Actionable Insights</li>
              </ul>
            </div>

            <Card className="border border-primary/20 bg-card/40 backdrop-blur-md shadow-2xl">
              <CardHeader>
                <CardTitle>Start Analysis</CardTitle>
                <CardDescription>Input your data to get deep insights.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAnalyze} className="space-y-6">
                  
                  <div className="space-y-2 group">
                    <Label htmlFor="resume" className="text-foreground/90">Resume (PDF/DOCX)</Label>
                    <div className="relative">
                      <Input 
                        id="resume" 
                        type="file" 
                        accept=".pdf,.docx" 
                        onChange={(e) => setResume(e.target.files?.[0] || null)}
                        className="file:bg-primary/10 file:text-primary file:border-0 file:rounded-md file:px-4 file:py-1 cursor-pointer transition-all border-border/50 hover:border-primary/50"
                      />
                      <Upload className="absolute right-3 top-2.5 h-4 w-4 text-foreground/40 group-hover:text-primary transition-colors pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jd" className="text-foreground/90">Job Description</Label>
                    <div className="relative">
                      <Textarea 
                        id="jd" 
                        placeholder="Paste the target job description here..."
                        className="min-h-[140px] resize-y border-border/50 hover:border-primary/50 transition-all focus-visible:ring-primary/50 bg-background/50"
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                      />
                      <FileText className="absolute right-3 top-3 h-4 w-4 text-foreground/40 pointer-events-none" />
                    </div>
                  </div>

                  {error && (
                    <div className="text-destructive text-sm font-medium bg-destructive/10 p-3 rounded-md border border-destructive/20">
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full group shadow-lg hover:shadow-primary/25 transition-all text-md h-12" disabled={!resume || !jobDescription}>
                    Analyze Match
                    <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </form>
              </CardContent>
            </Card>

          </motion.div>
        ) : (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center space-y-8 text-center"
          >
            <div className="relative">
              <div className="absolute inset-0 blur-xl bg-primary/30 rounded-full animate-pulse" />
              <Loader2 className="w-16 h-16 text-primary animate-spin relative z-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">AI Agents are Working</h2>
              <p className="text-foreground/60 max-w-sm animate-pulse">
                Parsing resume, generating multidimensional vector embeddings, and mapping skills against the job description...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
