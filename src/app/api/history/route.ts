import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized. Please log in to view history." }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("analyses")
      .select("id, created_at, scores, skill_analysis, section_analysis, action_plan, recruiter_summary")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase Select Error:", error);
      return NextResponse.json({ error: "Failed to fetch history." }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Fetch History Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
