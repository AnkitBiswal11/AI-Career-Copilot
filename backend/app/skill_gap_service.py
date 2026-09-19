import json
import ollama


def _clean_json_response(content: str) -> dict:
    content = content.strip()

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
        start = content.find("{")
        end = content.rfind("}")

        if start != -1 and end != -1:
            return json.loads(content[start:end + 1])

        raise ValueError("AI returned invalid JSON")


def analyze_skill_gap(
    resume_text: str,
    job_description: str,
) -> dict:

    prompt = f"""
You are an expert technical recruiter and career coach.

Analyze the candidate's skill gap for the target job.

IMPORTANT RULES:

- Use ONLY skills and experience explicitly demonstrated in the resume.
- Never invent candidate skills.
- Identify important skills required by the job that are not demonstrated
  in the resume.
- Be realistic for a computer science fresher.
- Separate technical skills from broader interview preparation where useful.
- Keep the result concise and actionable.
- Estimate current proficiency from evidence in the resume.
- Estimate required proficiency based on the job description.
- Learning days should be realistic for a fresher.
- Priority must be one of: "HIGH", "MEDIUM", "LOW".
- Return ONLY valid JSON.
- Do not use markdown.

Return EXACTLY this structure:

{{
    "readiness_score": 0,
    "skill_gaps": [
        {{
            "skill": "",
            "current": 0,
            "required": 0,
            "gap": 0,
            "priority": "HIGH",
            "learning_days": 0,
            "reason": "",
            "learning_plan": []
        }}
    ],
    "strengths": [],
    "top_priorities": [],
    "career_insights": [],
    "quick_wins": []
}}

SCORING:

- readiness_score must be between 0 and 100.
- current and required must be between 0 and 100.
- gap = required - current.
- Only include meaningful skill gaps.
- Sort skill_gaps from highest priority to lowest priority.

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

        # --------------------------------
        # Normalize readiness score
        # --------------------------------
        try:
            readiness_score = int(
                result.get("readiness_score", 0)
            )
        except (TypeError, ValueError):
            readiness_score = 0

        readiness_score = max(
            0,
            min(readiness_score, 100),
        )

        # --------------------------------
        # Clean skill gaps
        # --------------------------------
        skill_gaps = []

        raw_gaps = result.get("skill_gaps", [])

        if isinstance(raw_gaps, list):
            for item in raw_gaps:
                if not isinstance(item, dict):
                    continue

                skill = str(
                    item.get("skill", "")
                ).strip()

                if not skill:
                    continue

                try:
                    current = int(item.get("current", 0))
                except (TypeError, ValueError):
                    current = 0

                try:
                    required = int(item.get("required", 0))
                except (TypeError, ValueError):
                    required = 0

                current = max(0, min(current, 100))
                required = max(0, min(required, 100))

                gap = max(0, required - current)

                priority = str(
                    item.get("priority", "MEDIUM")
                ).upper()

                if priority not in {"HIGH", "MEDIUM", "LOW"}:
                    priority = "MEDIUM"

                try:
                    learning_days = int(
                        item.get("learning_days", 1)
                    )
                except (TypeError, ValueError):
                    learning_days = 1

                learning_days = max(
                    1,
                    min(learning_days, 90),
                )

                learning_plan = item.get(
                    "learning_plan",
                    [],
                )

                if not isinstance(learning_plan, list):
                    learning_plan = []

                learning_plan = [
                    str(step).strip()
                    for step in learning_plan
                    if str(step).strip()
                ]

                skill_gaps.append(
                    {
                        "skill": skill,
                        "current": current,
                        "required": required,
                        "gap": gap,
                        "priority": priority,
                        "learning_days": learning_days,
                        "reason": str(
                            item.get("reason", "")
                        ).strip(),
                        "learning_plan": learning_plan,
                    }
                )

        # --------------------------------
        # Clean generic list fields
        # --------------------------------
        def clean_list(value):
            if not isinstance(value, list):
                return []

            return [
                str(item).strip()
                for item in value
                if str(item).strip()
            ]

        return {
            "readiness_score": readiness_score,
            "skill_gaps": skill_gaps,
            "strengths": clean_list(
                result.get("strengths")
            ),
            "top_priorities": clean_list(
                result.get("top_priorities")
            ),
            "career_insights": clean_list(
                result.get("career_insights")
            ),
            "quick_wins": clean_list(
                result.get("quick_wins")
            ),
        }

    except json.JSONDecodeError:
        return {
            "readiness_score": 0,
            "skill_gaps": [],
            "strengths": [],
            "top_priorities": [],
            "career_insights": [],
            "quick_wins": [],
            "error": "AI returned an invalid JSON response.",
        }

    except Exception as exc:
        return {
            "readiness_score": 0,
            "skill_gaps": [],
            "strengths": [],
            "top_priorities": [],
            "career_insights": [],
            "quick_wins": [],
            "error": f"Skill gap analysis failed: {str(exc)}",
        }