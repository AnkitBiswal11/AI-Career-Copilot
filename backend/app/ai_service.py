import json
import re
import ollama


def extract_json(text: str) -> dict:
    """
    Extract a JSON object even if the model adds extra text,
    markdown fences, or reasoning around the JSON.
    """

    text = text.strip()

    # Remove markdown code fences
    text = re.sub(r"```json\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"```\s*", "", text)

    text = text.strip()

    # First attempt: entire response is JSON
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Second attempt: find the first JSON object
    start = text.find("{")
    end = text.rfind("}")

    if start != -1 and end != -1 and end > start:
        candidate = text[start:end + 1]

        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            pass

    raise ValueError("Could not extract valid JSON from AI response.")


def analyze_resume(resume_text: str) -> dict:

    prompt = f"""
You are an expert career advisor for computer science students and freshers.

Analyze the resume below.

IMPORTANT:
- Use ONLY information present in the resume for candidate facts.
- Never invent achievements, companies, statistics, certifications,
  experience, projects, or skills.
- If information is missing, say it is missing.
- Recommendations may be your own practical suggestions.
- Keep the response concise.
- Return ONLY JSON.
- Do NOT return explanations.
- Do NOT return markdown.
- Do NOT return ``` fences.
- Do NOT include reasoning before or after the JSON.

Return EXACTLY this JSON structure:

{{
  "resume_score": 0,
  "candidate_summary": "",
  "technical_skills": [],
  "soft_skills": [],
  "strengths": [],
  "weaknesses": [],
  "missing_skills": [],
  "suitable_job_roles": [],
  "improvement_suggestions": [],
  "placement_preparation_plan": [],
  "skill_scores": [
    {{
      "skill": "",
      "score": 0
    }}
  ]
}}

Rules:
- resume_score: integer from 0 to 100
- skill score: integer from 0 to 100
- skill_scores: 5 to 8 important skills
- Keep lists concise.
- Be realistic for a fresher.

RESUME:
{resume_text}
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
            options={
                "temperature": 0,
            },
        )

        content = response["message"]["content"].strip()

        result = extract_json(content)

        # Safely normalize the response
        try:
            resume_score = int(result.get("resume_score", 0))
        except (TypeError, ValueError):
            resume_score = 0

        resume_score = max(0, min(resume_score, 100))

        def clean_list(value):
            if not isinstance(value, list):
                return []

            return [
                str(item).strip()
                for item in value
                if str(item).strip()
            ]

        skill_scores = []

        if isinstance(result.get("skill_scores"), list):
            for item in result["skill_scores"]:
                if not isinstance(item, dict):
                    continue

                skill = str(item.get("skill", "")).strip()

                try:
                    score = int(item.get("score", 0))
                except (TypeError, ValueError):
                    score = 0

                score = max(0, min(score, 100))

                if skill:
                    skill_scores.append(
                        {
                            "skill": skill,
                            "score": score,
                        }
                    )

        return {
            "resume_score": resume_score,
            "candidate_summary": str(
                result.get("candidate_summary", "")
            ).strip(),

            "technical_skills": clean_list(
                result.get("technical_skills")
            ),

            "soft_skills": clean_list(
                result.get("soft_skills")
            ),

            "strengths": clean_list(
                result.get("strengths")
            ),

            "weaknesses": clean_list(
                result.get("weaknesses")
            ),

            "missing_skills": clean_list(
                result.get("missing_skills")
            ),

            "suitable_job_roles": clean_list(
                result.get("suitable_job_roles")
            ),

            "improvement_suggestions": clean_list(
                result.get("improvement_suggestions")
            ),

            "placement_preparation_plan": clean_list(
                result.get("placement_preparation_plan")
            ),

            "skill_scores": skill_scores,
        }

    except Exception as exc:

        print("❌ Resume AI analysis failed:")
        print(str(exc))

        return {
            "resume_score": 0,
            "candidate_summary": (
                "AI analysis failed. Please try analyzing the resume again."
            ),
            "technical_skills": [],
            "soft_skills": [],
            "strengths": [],
            "weaknesses": [],
            "missing_skills": [],
            "suitable_job_roles": [],
            "improvement_suggestions": [],
            "placement_preparation_plan": [],
            "skill_scores": [],
            "error": str(exc),
        }