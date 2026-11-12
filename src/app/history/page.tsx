"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Loader2, History as HistoryIcon, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button, buttonVariants } from "@/components/ui/button";

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch("/api/history");
        if (!res.ok) {
          throw new Error("Failed to fetch history");
        }
        const data = await res.json();
        setHistory(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <Card className="border-destructive/50 bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive">Authentication Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center text-center p-4">
        <HistoryIcon className="w-16 h-16 text-foreground/20 mb-4" />
        <h2 className="text-2xl font-bold mb-2">No History Found</h2>
        <p className="text-foreground/60 mb-6 max-w-md">You haven't run any analyses yet. Head back to the analyzer to verify your resume.</p>
        <Link href="/" className={buttonVariants()}>Analyze Resume</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
          <HistoryIcon className="w-8 h-8 text-primary" />
          Past Analyses
        </h1>
        <p className="text-foreground/60 mt-1">Review your previously analyzed resumes and job descriptions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {history.map((item) => (
          <Card key={item.id} className="bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-colors group relative overflow-hidden flex flex-col pointer-events-auto">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-50 group-hover:opacity-100 transition-opacity" />
            
            <CardHeader className="pb-4">
              <CardTitle className="text-lg truncate max-w-[250px]" title={item.scores?.jobTitle || `Analysis ${item.id.substring(0, 8)}`}>
                {item.scores?.jobTitle || `Analysis ${item.id.substring(0, 8)}`}
              </CardTitle>
              <CardDescription>
                {format(new Date(item.created_at), "MMM d, yyyy 'at' h:mm a")}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col gap-4">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-semibold">Overall Match</span>
                  <span>{item.scores?.overallMatchScore || 0}%</span>
                </div>
                <Progress value={item.scores?.overallMatchScore || 0} className="h-1.5 bg-primary/20" />
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs text-foreground/70 mb-4">
                <div>Skills: <span className="font-semibold text-foreground">{item.scores?.skillMatchScore || 0}%</span></div>
                <div>Exp: <span className="font-semibold text-foreground">{item.scores?.experienceScore || 0}%</span></div>
                <div>Keywords: <span className="font-semibold text-foreground">{item.scores?.keywordScore || 0}%</span></div>
              </div>

              <div className="mt-auto pt-4 border-t border-border/50">
                <Button 
                  variant="ghost" 
                  className="w-full justify-between hover:bg-primary/10 hover:text-primary transition-colors"
                  onClick={() => {
                    const mappedData = {
                      jobTitle: item.scores?.jobTitle,
                      overallMatchScore: item.scores?.overallMatchScore || 0,
                      skillMatchScore: item.scores?.skillMatchScore || 0,
                      keywordScore: item.scores?.keywordScore || 0,
                      experienceScore: item.scores?.experienceScore || 0,
                      skills: item.skill_analysis || [],
                      sectionAnalysis: item.section_analysis || [],
                      actionPlan: item.action_plan || [],
                      recruiterSummary: item.recruiter_summary || "No summary provided.",
                    };
                    sessionStorage.setItem("latestAnalysis", JSON.stringify(mappedData));
                    window.location.href = "/dashboard";
                  }}
                >
                  <span>
                    View Full Details
                    <ArrowRight className="w-4 h-4 ml-2 inline" />
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
