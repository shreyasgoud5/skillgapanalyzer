-- Enable vector extension for potentially doing vector similarity directly in DB later (Optional but good practice)
-- create extension if not exists vector;

-- Create analyses table
CREATE TABLE analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resume_text TEXT NOT NULL,
    jd_text TEXT NOT NULL,
    
    -- Stored deeply structured JSON results
    scores JSONB NOT NULL,
    skill_analysis JSONB NOT NULL,
    section_analysis JSONB NOT NULL,
    action_plan JSONB NOT NULL,
    recruiter_summary JSONB NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Turn on Row Level Security
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only select their own analyses
CREATE POLICY "Users can view their own analyses" 
ON analyses FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can insert their own analyses
CREATE POLICY "Users can insert their own analyses" 
ON analyses FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own analyses
CREATE POLICY "Users can update their own analyses" 
ON analyses FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy: Users can delete their own analyses
CREATE POLICY "Users can delete their own analyses" 
ON analyses FOR DELETE 
USING (auth.uid() = user_id);
