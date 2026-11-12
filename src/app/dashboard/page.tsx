"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, XCircle, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalysisResult, SkillMatch } from "@/lib/types";

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("latestAnalysis");
    if (stored) {
      try {
        setData(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse analysis data", e);
      }
    }
  }, []);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] text-center p-4">
        <h2 className="text-2xl font-bold mb-4">No recent analysis found.</h2>
        <Button onClick={() => router.push("/")} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go back to analyze
        </Button>
      </div>
    );
  }

  const renderSkillBadge = (skill: SkillMatch) => {
    if (skill.category === "matched") {
      return (
        <Badge key={skill.skill} className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 p-1.5 pr-3">
          <CheckCircle className="w-3.5 h-3.5" />
          {skill.skill}
        </Badge>
      );
    }
    if (skill.category === "partial") {
      return (
        <Badge key={skill.skill} className="bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 p-1.5 pr-3">
          <AlertTriangle className="w-3.5 h-3.5" />
          {skill.skill}
        </Badge>
      );
    }
    return (
      <Badge key={skill.skill} className="bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1.5 p-1.5 pr-3">
        <XCircle className="w-3.5 h-3.5" />
        {skill.skill}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">
            {data.jobTitle ? `${data.jobTitle} Analysis` : 'Analysis Results'}
          </h1>
          <p className="text-foreground/60 mt-1">
            Deep dive into your resume vs job description mapping.
          </p>
        </div>
        <Button onClick={() => router.push("/")} variant="outline" className="shrink-0">
          <ArrowLeft className="mr-2 h-4 w-4" /> New Analysis
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-card/50 backdrop-blur-sm border-primary/20 shadow-md transform hover:scale-[1.02] transition-transform">
          <CardHeader className="pb-2">
            <CardDescription>Overall Match</CardDescription>
            <CardTitle className="text-4xl">{data.overallMatchScore}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={data.overallMatchScore} className="h-2" />
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Skill Coverage</CardDescription>
            <CardTitle className="text-2xl">{data.skillMatchScore}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={data.skillMatchScore} className="h-1.5" />
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Experience Focus</CardDescription>
            <CardTitle className="text-2xl">{data.experienceScore}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={data.experienceScore} className="h-1.5" />
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Keyword Relevance</CardDescription>
            <CardTitle className="text-2xl">{data.keywordScore}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={data.keywordScore} className="h-1.5" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="skills" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-background/50 backdrop-blur border border-border/50 mb-6">
          <TabsTrigger value="skills">Skill Gap Map</TabsTrigger>
          <TabsTrigger value="sections">Section Analysis</TabsTrigger>
          <TabsTrigger value="action">Action Plan</TabsTrigger>
          <TabsTrigger value="recruiter">Recruiter Mode</TabsTrigger>
        </TabsList>
        
        <TabsContent value="skills" className="mt-0">
          <Card className="bg-card/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle>Skill Gap Map</CardTitle>
              <CardDescription>Visual breakdown of every skill found in the job description.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {data.skills.sort((a, b) => b.similarityScore - a.similarityScore).map(renderSkillBadge)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sections" className="mt-0">
          <div className="grid md:grid-cols-2 gap-4">
            {data.sectionAnalysis.map((section, i) => (
              <Card key={i} className="bg-card/40 backdrop-blur-md">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">{section.sectionName}</CardTitle>
                    <span className="font-mono text-sm font-bold opacity-70">{section.score}/100</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <Progress value={section.score} className="h-1.5 mb-4" />
                  <p className="text-sm text-foreground/80 leading-relaxed">{section.feedback}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="action" className="mt-0">
          <div className="space-y-4">
            {data.actionPlan.map((step, i) => (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} key={step.title}>
                <Card className="bg-card/40 backdrop-blur-md border-l-4" style={{ 
                  borderLeftColor: step.priority === "High" ? "#ef4444" : step.priority === "Medium" ? "#f59e0b" : "#3b82f6" 
                }}>
                  <CardContent className="p-4 flex gap-4 items-start">
                    <div className="mt-1 font-bold text-xs uppercase opacity-60 w-16 text-center">{step.priority}</div>
                    <div>
                      <h4 className="font-semibold">{step.title}</h4>
                      <p className="text-sm text-foreground/70 mt-1">{step.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recruiter" className="mt-0">
          <Card className="bg-primary/5 border-primary/20 backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <CardHeader>
              <CardTitle>10-Second Summary</CardTitle>
              <CardDescription>What a recruiter will think glancing at this resume for this role.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed italic text-foreground/90 font-serif">
                "{data.recruiterSummary}"
              </p>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
