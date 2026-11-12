# Skill Gap Analysis Using Resume Embeddings

An AI-assisted web application that analyzes a candidate's resume against a job description to identify matching skills, missing competencies, and areas for improvement.

## Features

- Upload resumes in PDF and DOCX formats.
- Extract professional skills from resumes and job descriptions using the Gemini API.
- Compare skills using embeddings and cosine similarity.
- Categorize skills as matched, partially matched, or missing.
- Generate skill match scores and candidate insights.
- Display personalized improvement recommendations.
- View analysis results through an interactive dashboard.

## Technologies Used

- **Frontend:** Next.js, React.js, TypeScript
- **AI Integration:** Google Gemini API
- **Database:** Supabase
- **Styling:** Tailwind CSS

## Getting Started

Clone the repository:

```bash
git clone https://github.com/shreyasgoud255/skilllgapanalyzer.git
```

Navigate to the project directory:

```bash
cd skilllgapanalyzer
```

Install dependencies:

```bash
npm install
```

Create a `.env.local` file in the project root and configure the required environment variables:

```env
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Academic Project

Developed as part of an academic team project during the 2025–2026 academic year.