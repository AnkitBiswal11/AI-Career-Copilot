import json
import ollama


def _clean_json_response(content: str) -> dict:
    """Clean and parse JSON returned by the AI."""
    content = content.strip()

    # Remove markdown code fences if the model adds them
    if content.startswith("```"):
        lines = content.splitlines()

        if lines and lines[0].startswith("```"):
            lines = lines[1:]

        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]

        content = "\n".join(lines).strip()

    try:
        return json.loads(content)
    except json.JSONDecodeError:
        # Try extracting the JSON object from surrounding text
        start = content.find("{")
        end = content.rfind("}")

        if start != -1 and end != -1:
            return json.loads(content[start:end + 1])

        raise ValueError("AI returned invalid JSON")


def analyze_job_match(resume_text: str, job_description: str) -> dict:
    prompt = f"""
You are an expert technical recruiter and career advisor for computer science
students and fresh graduates.

Compare the candidate's resume against the job description.

IMPORTANT RULES:

- Use ONLY information explicitly present in the resume for candidate skills,
  experience, projects, education, and achievements.
- Do NOT invent skills or experience.
- A skill should be considered "matching" only when the resume demonstrates it.
- A skill should be considered "missing" when it is an important job requirement
  that is not demonstrated in the resume.
- Distinguish between required skills and nice-to-have skills.
- Be realistic for a fresher.
- Keep lists concise and useful.
- Do not make unsupported claims about companies or hiring statistics.
- Return ONLY valid JSON.
- Do not use markdown.
- Do not wrap the response in ```json.

Return EXACTLY this structure:

{{
    "match_score": 0,
    "matching_skills": [],
    "missing_skills": [],
    "strengths": [],
    "weaknesses": [],
    "recommended_learning": [],
    "interview_topics": [],
    "recommendation": ""
}}

Scoring guidance:

- 80-100: Strong match
- 65-79: Good match but some preparation recommended
- 45-64: Partial match; significant preparation required
- 0-44: Weak match

The recommendation MUST be exactly one of:

"APPLY"
"APPLY WITH PREPARATION"
"NOT READY"

RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}
"""

    try:
        response = ollama.chat(
            model="qwen3:4b",
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            format="json",
            think=False,
        )

        result = _clean_json_response(
            response["message"]["content"]
        )

        # -----------------------------
        # Normalize match score
        # -----------------------------
        try:
            score = int(result.get("match_score", 0))
        except (TypeError, ValueError):
            score = 0

        score = max(0, min(score, 100))

        # -----------------------------
        # Validate recommendation
        # -----------------------------
        valid_recommendations = {
            "APPLY",
            "APPLY WITH PREPARATION",
            "NOT READY",
        }

        recommendation = result.get(
            "recommendation",
            "APPLY WITH PREPARATION",
        )

        if recommendation not in valid_recommendations:
            recommendation = "APPLY WITH PREPARATION"

        # -----------------------------
        # Clean list fields
        # -----------------------------
        def clean_list(value):
            if not isinstance(value, list):
                return []

            cleaned = []

            for item in value:
                if item is None:
                    continue

                text = str(item).strip()

                if text:
                    cleaned.append(text)

            return cleaned

        return {
            "match_score": score,
            "matching_skills": clean_list(
                result.get("matching_skills")
            ),
            "missing_skills": clean_list(
                result.get("missing_skills")
            ),
            "strengths": clean_list(
                result.get("strengths")
            ),
            "weaknesses": clean_list(
                result.get("weaknesses")
            ),
            "recommended_learning": clean_list(
                result.get("recommended_learning")
            ),
            "interview_topics": clean_list(
                result.get("interview_topics")
            ),
            "recommendation": recommendation,
        }

    except json.JSONDecodeError:
        return {
            "match_score": 0,
            "matching_skills": [],
            "missing_skills": [],
            "strengths": [],
            "weaknesses": [],
            "recommended_learning": [],
            "interview_topics": [],
            "recommendation": "APPLY WITH PREPARATION",
            "error": "AI returned an invalid JSON response.",
        }

    except Exception as exc:
        return {
            "match_score": 0,
            "matching_skills": [],
            "missing_skills": [],
            "strengths": [],
            "weaknesses": [],
            "recommended_learning": [],
            "interview_topics": [],
            "recommendation": "APPLY WITH PREPARATION",
            "error": f"AI matching failed: {str(exc)}",
        }