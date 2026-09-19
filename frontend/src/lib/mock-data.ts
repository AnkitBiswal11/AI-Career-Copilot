/**
 * Demonstration data used until the FastAPI backend returns live values.
 * Every consumer reads these through the typed interfaces in src/types/api.ts,
 * so swapping in real responses requires no component changes.
 */
import type {
  CareerReadiness,
  DashboardData,
  InterviewProgress,
  JobMatch,
  LearningProgress,
  ResumeAnalysis,
  RoadmapStage,
  SkillGap,
} from "@/types/api";

export const careerReadiness: CareerReadiness = {
  score: 78,
  delta: 8,
  breakdown: [
    { dimension: "Technical Skills", score: 88 },
    { dimension: "Resume", score: 86 },
    { dimension: "Projects", score: 74 },
    { dimension: "DSA", score: 45 },
    { dimension: "Interview", score: 64 },
    { dimension: "Communication", score: 72 },
  ],
  history: [
    { label: "Jan", value: 42 },
    { label: "Feb", value: 51 },
    { label: "Mar", value: 58 },
    { label: "Apr", value: 66 },
    { label: "May", value: 72 },
    { label: "Jun", value: 78 },
  ],
};

export const resumeAnalysis: ResumeAnalysis = {
  score: 86,
  ats_score: 88,
  technical_skills: 12,
  projects: 3,
  achievements: 4,
  breakdown: [
    { label: "Content Quality", value: 90 },
    { label: "Technical Skills", value: 88 },
    { label: "Projects", value: 80 },
    { label: "ATS Compatibility", value: 88 },
    { label: "Formatting", value: 92 },
  ],
  strengths: [
    {
      title: "Strong Python foundation",
      detail: "Python appears across three projects with framework depth, not just syntax mentions.",
    },
    {
      title: "Good SQL knowledge",
      detail: "Joins, indexing and schema design are evidenced in your internship bullet points.",
    },
    {
      title: "Relevant backend project",
      detail: "Your FastAPI service maps directly to 8 of the 11 job descriptions you analysed.",
    },
    {
      title: "Clear technical skills section",
      detail: "Skills are grouped and parseable, which raises ATS extraction accuracy.",
    },
  ],
  improvements: [
    {
      title: "Add measurable project impact",
      detail: "Quantify outcomes — latency reduced, users served, records processed.",
    },
    {
      title: "Improve project descriptions",
      detail: "Lead with the problem and architecture decision, then the stack you used.",
    },
    {
      title: "Add relevant achievements",
      detail: "Hackathons, contest ratings or certifications strengthen fresher profiles.",
    },
    {
      title: "Improve GitHub documentation",
      detail: "READMEs with setup steps and screenshots meaningfully lift recruiter trust.",
    },
  ],
};

export const skillProficiency = [
  { skill: "Python", current: 90, target: 90 },
  { skill: "SQL", current: 82, target: 85 },
  { skill: "FastAPI", current: 76, target: 80 },
  { skill: "Git", current: 70, target: 75 },
  { skill: "DSA", current: 45, target: 80 },
  { skill: "Docker", current: 35, target: 70 },
  { skill: "AWS", current: 20, target: 60 },
];

export const skillGaps: SkillGap[] = [
  { skill: "DSA", current: 45, required: 80, priority: "HIGH", learning_days: 14 },
  { skill: "Docker", current: 35, required: 70, priority: "HIGH", learning_days: 5 },
  { skill: "AWS", current: 20, required: 60, priority: "MEDIUM", learning_days: 7 },
  { skill: "Git", current: 70, required: 75, priority: "LOW", learning_days: 2 },
];

export const jobMatches: JobMatch[] = [
  {
    company: "Google",
    role: "Software Engineer Intern",
    score: 92,
    status: "Excellent Match",
    matching_skills: ["Python", "SQL", "REST APIs", "Git"],
    missing_skills: ["Advanced DSA"],
    radar: [],
  },
  {
    company: "Microsoft",
    role: "Backend Developer",
    score: 84,
    status: "Strong Match",
    matching_skills: ["Python", "FastAPI", "SQL"],
    missing_skills: ["Docker", "Azure"],
    radar: [],
  },
  {
    company: "TCS",
    role: "Python Developer",
    score: 76,
    status: "Good Match",
    matching_skills: ["Python", "SQL"],
    missing_skills: ["Docker"],
    radar: [],
  },
  {
    company: "Infosys",
    role: "Software Engineer",
    score: 68,
    status: "Moderate Match",
    matching_skills: ["Python", "Git"],
    missing_skills: ["Java", "DSA"],
    radar: [],
  },
];

export const jobMatchResult: JobMatch = {
  company: "Microsoft",
  role: "Backend Developer",
  score: 82,
  status: "Strong Match",
  matching_skills: ["Python", "SQL", "FastAPI", "REST APIs"],
  missing_skills: ["Docker", "AWS", "Advanced DSA"],
  radar: [
    { skill: "Python", candidate: 90, required: 85 },
    { skill: "SQL", candidate: 82, required: 80 },
    { skill: "FastAPI", candidate: 76, required: 70 },
    { skill: "Git", candidate: 70, required: 75 },
    { skill: "Docker", candidate: 35, required: 70 },
    { skill: "AWS", candidate: 20, required: 60 },
    { skill: "DSA", candidate: 45, required: 80 },
  ],
};

export const jobMatchDistribution = [
  { name: "Excellent", value: 3 },
  { name: "Strong", value: 4 },
  { name: "Moderate", value: 3 },
  { name: "Low", value: 1 },
];

export const roadmap: RoadmapStage[] = [
  {
    id: "foundation",
    title: "Foundation",
    status: "completed",
    completion: 100,
    duration: "6 weeks",
    items: [
      { label: "Python", done: true },
      { label: "SQL", done: true },
    ],
  },
  {
    id: "backend",
    title: "Backend Development",
    status: "current",
    completion: 45,
    duration: "5 weeks",
    items: [
      { label: "FastAPI", done: true },
      { label: "REST APIs", done: false },
      { label: "Authentication", done: false },
      { label: "Docker", done: false },
    ],
  },
  {
    id: "cs",
    title: "Computer Science Core",
    status: "upcoming",
    completion: 15,
    duration: "8 weeks",
    items: [
      { label: "DSA", done: false },
      { label: "DBMS", done: false },
      { label: "Operating Systems", done: false },
      { label: "Computer Networks", done: false },
    ],
  },
  {
    id: "genai",
    title: "GenAI",
    status: "upcoming",
    completion: 0,
    duration: "6 weeks",
    items: [
      { label: "LLM Fundamentals", done: false },
      { label: "Prompt Engineering", done: false },
      { label: "Embeddings", done: false },
      { label: "RAG", done: false },
      { label: "Vector Databases", done: false },
    ],
  },
  {
    id: "placement",
    title: "Placement Ready",
    status: "upcoming",
    completion: 0,
    duration: "4 weeks",
    items: [
      { label: "Resume", done: false },
      { label: "GitHub", done: false },
      { label: "Mock Interviews", done: false },
      { label: "Applications", done: false },
    ],
  },
];

export const learningProgress: LearningProgress = {
  total_hours: 23,
  weekly_goal: 20,
  goal_completion: 115,
  streak_days: 7,
  weekly: [
    { label: "DSA", value: 8 },
    { label: "Python", value: 4 },
    { label: "FastAPI", value: 5 },
    { label: "GenAI", value: 6 },
  ],
  distribution: [
    { label: "DSA", value: 8 },
    { label: "Python", value: 4 },
    { label: "FastAPI", value: 5 },
    { label: "GenAI", value: 6 },
  ],
  improvement: [
    { month: "Feb", python: 62, dsa: 20, genai: 5 },
    { month: "Mar", python: 70, dsa: 26, genai: 14 },
    { month: "Apr", python: 78, dsa: 32, genai: 25 },
    { month: "May", python: 85, dsa: 39, genai: 34 },
    { month: "Jun", python: 90, dsa: 45, genai: 41 },
  ],
};

export const interviewProgress: InterviewProgress = {
  readiness: 64,
  questions_completed: 32,
  questions_total: 50,
  categories: [
    { label: "Technical", value: 72 },
    { label: "HR", value: 81 },
    { label: "Behavioral", value: 65 },
    { label: "Projects", value: 58 },
  ],
  radar: [
    { topic: "Python", score: 84 },
    { topic: "SQL", score: 78 },
    { topic: "DSA", score: 45 },
    { topic: "DBMS", score: 62 },
    { topic: "OS", score: 55 },
    { topic: "CN", score: 50 },
    { topic: "Projects", score: 58 },
  ],
  weekly: [
    { label: "Week 1", value: 35 },
    { label: "Week 2", value: 44 },
    { label: "Week 3", value: 53 },
    { label: "Week 4", value: 64 },
  ],
};

export const interviewQuestions = [
  {
    id: 1,
    question: "Explain the difference between INNER JOIN and LEFT JOIN.",
    topic: "SQL",
    difficulty: "Medium",
    answer:
      "INNER JOIN returns only the rows where the join predicate matches in both tables. LEFT JOIN returns every row from the left table and the matched rows from the right table, filling unmatched right-side columns with NULL. Use LEFT JOIN when absence of a related row is itself meaningful — for example listing all students including those with no submitted assignment.",
    feedback:
      "Strong answer structure. To score higher, mention NULL handling in WHERE clauses and how filtering the right table in WHERE silently converts a LEFT JOIN into an INNER JOIN.",
  },
  {
    id: 2,
    question: "How does Python's GIL affect multithreaded workloads?",
    topic: "Python",
    difficulty: "Hard",
    answer:
      "The Global Interpreter Lock allows only one thread to execute Python bytecode at a time, so CPU-bound threads do not run in parallel. I/O-bound work still benefits from threading because the GIL is released during blocking calls. For CPU-bound parallelism use multiprocessing, native extensions, or async offloading to a worker pool.",
    feedback:
      "Good coverage of the trade-off. Add a concrete example — e.g. a FastAPI endpoint offloading PDF parsing to a process pool — to demonstrate applied understanding.",
  },
  {
    id: 3,
    question: "Walk me through a project where you made a difficult technical trade-off.",
    topic: "Projects",
    difficulty: "Medium",
    answer:
      "Use the STAR structure: describe the situation and constraint, the options considered, the decision criteria you applied (latency, cost, maintainability), and the measurable outcome. Close with what you would change today.",
    feedback:
      "Anchor the answer in a number. Interviewers remember 'cut p95 latency from 900ms to 220ms' far more than 'made it faster'.",
  },
];

export const dashboardData: DashboardData = {
  readiness: careerReadiness,
  resume: resumeAnalysis,
  matches: jobMatches,
  skill_gaps: skillGaps,
  next_action: {
    title: "Improve your DSA fundamentals.",
    why: "Your technical skills are strong, but your DSA readiness is currently 45%, which may reduce your interview performance.",
    priority: "HIGH",
    estimate: "14 days",
    cta: "Start DSA Plan",
  },
};

export const coachSuggestions = [
  "How can I improve my resume?",
  "What should I learn next?",
  "Why is my job match score low?",
  "Create a 30-day DSA plan.",
  "Prepare me for a Python interview.",
  "What skills are most important for backend development?",
];

export const coachReplies: Record<string, string> = {
  default:
    "Based on your current profile — resume 86, readiness 78, DSA 45 — the highest-leverage move is two weeks of focused DSA practice on arrays, hashing and trees. That single change lifts your projected interview readiness from 64% to roughly 79%.",
  resume:
    "Your resume scores 86/100. The fastest gains: quantify project impact (+4 pts), rewrite project bullets to lead with architecture decisions (+3 pts), and add a measurable achievement line (+2 pts).",
  learn:
    "Learn Docker next. It appears in 68% of the job descriptions you analysed and is a 5-day gap to close — the best effort-to-match-score ratio in your plan.",
  match:
    "Your match scores drop mainly on Docker, AWS and advanced DSA. Those three account for 14 of the 18 missing-skill hits across your analysed roles.",
  dsa: "30-day DSA plan: Week 1 arrays + strings + hashing, Week 2 two pointers + sliding window + stacks, Week 3 trees + graphs BFS/DFS, Week 4 DP fundamentals + 4 timed mock contests. Target 4 problems a day with written post-mortems.",
  interview:
    "For a Python interview, expect: data model questions (mutability, generators), GIL and concurrency, decorators, and one applied API design round. I'd rehearse your FastAPI project story with metrics attached.",
};
