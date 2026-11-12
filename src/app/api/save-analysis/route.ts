import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized. Please log in to save analysis." }, { status: 401 });
    }

    const body = await req.json();
    const { resume_text, jd_text, scores, skill_analysis, section_analysis, action_plan, recruiter_summary } = body;

    const { data, error } = await supabase
      .from("analyses")
      .insert({
        user_id: user.id,
        resume_text: resume_text || "No text provided",
        jd_text: jd_text || "No text provided",
        scores,
        skill_analysis,
        section_analysis,
        action_plan,
        recruiter_summary,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase Insert Error:", error);
      return NextResponse.json({ error: "Failed to save analysis." }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Save Analysis Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
